import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { OrderWorkspace } from "../src/components/administracion/OrderWorkspace.tsx";
import {
  orderStatusLabel,
  matchingRecipes,
} from "../src/lib/order-workflow.ts";
import { seedWorkflow } from "./fixtures/order-workflow-scenario.mjs";

test("One transaction accepts, identifies, reviews and issues all lines; rollback, history and permissions remain intact", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      fs.readFileSync("tests/fixtures/commercial-current-schema.sql", "utf8"),
    );
    const migrations = fs
      .readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of migrations)
      await db.exec(fs.readFileSync("supabase/migrations/" + file, "utf8"));
    const f = await seedWorkflow(db);
    const q = await f.quote();
    await assert.rejects(f.emit(q, { actor: f.sellerUser }), /ACCESO DENEGADO/);
    const invalid = f.lines(q);
    invalid[1].bom_id = crypto.randomUUID();
    await assert.rejects(
      f.emit(q, { customLines: invalid }),
      /receta publicada compatible/,
    );
    assert.equal(
      (
        await db.query("select status from order_requests where id=$1", [
          q.request,
        ])
      ).rows[0].status,
      "pending",
    );
    assert.equal(
      Number((await db.query("select count(*) c from orders")).rows[0].c),
      0,
    );
    assert.ok(
      (
        await db.query(
          "select converted_quantity from budget_items where budget_id=$1",
          [q.budget],
        )
      ).rows.every((i) => i.converted_quantity === 0),
    );
    const key = crypto.randomUUID();
    const emitted = await f.emit(q, { key });
    assert.ok(emitted.manufacturingOrderId);
    assert.deepEqual(await f.emit(q, { key }), emitted);
    await assert.rejects(f.emit(q, { key, hash: "changed" }), /idempotencia/);
    const order = (
      await db.query("select * from orders where id=$1", [emitted.orderId])
    ).rows[0];
    assert.equal(order.status, "processing");
    assert.equal(order.commercial_approval_status, "approved");
    const items = (
      await db.query("select * from order_items where order_id=$1", [order.id])
    ).rows;
    assert.equal(items.length, 3);
    assert.ok(
      items.every(
        (i) =>
          i.product_id &&
          i.configuration_status === "approved" &&
          i.manufacturing_issued_quantity === 1,
      ),
    );
    const document = (
      await db.query("select * from manufacturing_orders where id=$1", [
        emitted.manufacturingOrderId,
      ])
    ).rows[0];
    assert.equal(document.commercial_items_snapshot.length, 3);
    assert.equal(
      Number(
        (await db.query("select count(*) c from manufacturing_orders")).rows[0]
          .c,
      ),
      1,
    );
    assert.equal(
      Number(
        (
          await db.query(
            "select count(*) c from order_request_notifications where request_id=$1 and event='submitted' and not is_read",
            [q.request],
          )
        ).rows[0].c,
      ),
      0,
    );
    await assert.rejects(
      f.emit(q, { actor: f.staffUser }),
      /renglones pendientes/,
    );
    const accepted = await f.quote(1);
    const acceptedOrder = (
      await db.query("select decide_order_request($1,$2,'approved',null) r", [
        f.adminUser,
        accepted.request,
      ])
    ).rows[0].r.order_id;
    await assert.rejects(
      db.query("update orders set status='processing' where id=$1", [
        acceptedOrder,
      ]),
      /Primero emití/,
    );
    const oi = (
      await db.query("select * from order_items where order_id=$1", [
        acceptedOrder,
      ])
    ).rows[0];
    const acceptedLines = f
      .lines(accepted)
      .map((l) => ({ ...l, source_id: oi.id }));
    const second = (
      await db.query(
        "select prepare_and_issue_order($1,null,$2,$3,$4::jsonb,$5::jsonb,'[]',null,$6,$7) r",
        [
          f.adminUser,
          acceptedOrder,
          oi.id,
          JSON.stringify(acceptedLines),
          JSON.stringify([
            {
              code: "SYN",
              name: "Synthetic component",
              quantity: 1,
              unitOfMeasure: "un",
            },
          ]),
          crypto.randomUUID(),
          "accepted",
        ],
      )
    ).rows[0].r;
    assert.equal(second.orderId, acceptedOrder);
    assert.notEqual(second.manufacturingOrderId, emitted.manufacturingOrderId);
    await db.query(
      "select set_order_status_audited($1,$2,'processing','delivered')",
      [f.adminUser, order.id],
    );
    const historyBefore = JSON.stringify(
      (await db.query("select * from orders where id=$1", [order.id])).rows[0],
    );
    const snapshotBefore = JSON.stringify(
      (
        await db.query("select * from manufacturing_orders where id=$1", [
          document.id,
        ])
      ).rows[0],
    );
    await db.exec(
      fs.readFileSync(
        "supabase/migrations/20261022000100_simplified_order_manufacturing_flow.sql",
        "utf8",
      ),
    );
    assert.equal(
      JSON.stringify(
        (await db.query("select * from orders where id=$1", [order.id]))
          .rows[0],
      ),
      historyBefore,
    );
    assert.equal(
      JSON.stringify(
        (
          await db.query("select * from manufacturing_orders where id=$1", [
            document.id,
          ])
        ).rows[0],
      ),
      snapshotBefore,
    );
    await assert.rejects(
      f.emit(q, { actor: f.staffUser }),
      /Pedido no fabricable/,
    );
    const stale = await f.quote(1);
    const staleLines = f.lines(stale);
    staleLines[0].recipe_updated_at = "2000-01-01T00:00:00Z";
    await assert.rejects(
      f.emit(stale, { customLines: staleLines }),
      /receta cambió/,
    );
    const wrongRecipe = f.lines(stale);
    wrongRecipe[0].bom_id = f.products[1].recipe.id;
    await assert.rejects(
      f.emit(stale, { customLines: wrongRecipe }),
      /receta publicada compatible/,
    );
    const changed = await f.quote(1);
    await db.query("update budgets set total_amount=99 where id=$1", [
      changed.budget,
    ]);
    await assert.rejects(f.emit(changed), /presupuesto cambió/);
    const counts = (await db.query("select administration_workflow_counts() r"))
      .rows[0].r;
    assert.equal(counts.production, 1);
    assert.equal(counts.requests, 2);
    for (const role of ["anon", "authenticated"]) {
      await db.exec("set role " + role);
      await assert.rejects(f.emit(q), /permission denied/);
      await assert.rejects(
        db.query("select administration_workflow_counts()"),
        /permission denied/,
      );
      await assert.rejects(
        db.query(
          "select set_order_status_audited($1,$2,'processing','delivered')",
          [f.adminUser, order.id],
        ),
        /permission denied/,
      );
      await db.exec("reset role");
    }
  } finally {
    await db.close();
  }
});

test("Unified status wording and exact recipe selection do not hide missing preparation", () => {
  assert.equal(
    orderStatusLabel({
      status: "pending",
      commercial_approval_status: "approved",
    }),
    "Aceptado · en preparación",
  );
  assert.equal(
    orderStatusLabel({
      status: "processing",
      commercial_approval_status: "approved",
      manufacturing_orders: [],
    }),
    "Aceptado · en preparación",
  );
  assert.equal(orderStatusLabel({ status: "delivered" }), "Entregado");
  assert.equal(
    orderStatusLabel({
      status: "processing",
      commercial_approval_status: "legacy",
      manufacturing_orders: [],
    }),
    "En fabricación",
  );
  const recipes = [
    { id: "base", product_id: "p", variant_id: null },
    { id: "exact", product_id: "p", variant_id: "v" },
    { id: "wrong", product_id: "other", variant_id: null },
  ];
  assert.deepEqual(
    matchingRecipes(recipes, "p", "v").map((r) => r.id),
    ["exact"],
  );
  assert.deepEqual(matchingRecipes(recipes, "", "v"), []);
});

test("Existing accepted request is shown as preparation, with actionable missing recipe and no second approval", () => {
  const data = {
    orderId: "order",
    orderNumber: 32,
    budgetNumber: 205,
    clientName: "Synthetic Client",
    sellerName: "Synthetic Seller",
    status: "processing",
    approval: "approved",
    total: 100,
    notes: null,
    lines: [
      {
        id: "line",
        product_name: "Lady Plus",
        variant_name: null,
        quantity: 1,
        product_id: "product",
        variant_id: null,
        configuration: {},
        factory_notes: null,
      },
    ],
    documents: [],
    products: [{ id: "product", name: "Lady Plus" }],
    variants: [],
    recipes: [],
    options: [],
  };
  const html = renderToStaticMarkup(
    React.createElement(
      AppRouterContext.Provider,
      { value: {} },
      React.createElement(OrderWorkspace, { data }),
    ),
  );
  assert.ok(html.includes("Aceptado · en preparación"));
  assert.ok(html.includes("Falta definir cómo se fabrica"));
  assert.ok(html.includes("Emitir orden de fabricación"));
  assert.ok(!html.includes("Iniciar Fabricación"));
  assert.ok(!html.includes("Confirmar pedido y emitir OF"));
  assert.ok(html.includes("fabricacion-productos?product=product"));
});
