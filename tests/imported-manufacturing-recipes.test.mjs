import assert from "node:assert/strict";
import { test } from "node:test";
import { matchingRecipes } from "../src/lib/order-workflow.ts";
import {
  roundSupplyQuantity,
  formatSupplyQuantity,
} from "../src/lib/manufacturing-calculations.ts";
import { SupplyInputSchema } from "../src/lib/validations/manufacturing.ts";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { OrderWorkspace } from "../src/components/administracion/OrderWorkspace.tsx";

test("Order workspace shows imported source code and opens that exact draft for review", () => {
  const data = {
    orderId: "o",
    orderNumber: 32,
    clientName: "Cliente",
    sellerName: "Vendedor",
    status: "pending",
    approval: "approved",
    total: 1,
    notes: null,
    lines: [
      {
        id: "line",
        product_name: "Lady Plus",
        variant_name: null,
        quantity: 1,
        product_id: "lady",
        variant_id: null,
        configuration: {},
        factory_notes: null,
      },
    ],
    documents: [],
    products: [{ id: "lady", name: "Lady" }],
    variants: [],
    options: [],
    recipes: [
      {
        id: "source-recipe",
        name: "FSLP1 — LADYPLUS 4J",
        product_id: "lady",
        variant_id: null,
        status: "draft",
        version: 1,
        technical_notes: "Pendiente de revisar la descripción",
      },
    ],
  };
  const html = renderToStaticMarkup(
    React.createElement(
      AppRouterContext.Provider,
      { value: {} },
      React.createElement(OrderWorkspace, { data }),
    ),
  );
  assert.ok(html.includes("FSLP1"));
  assert.ok(html.includes("recipe=source-recipe"));
  assert.ok(html.includes("Pendiente de revisar la descripción"));
  assert.ok(!html.includes('<option value="source-recipe"'));
});

test("Imported drafts remain visible data but cannot become manufacturing choices", () => {
  const draft = {
    id: "draft",
    product_id: "lady",
    variant_id: null,
    status: "draft",
  };
  const active = {
    id: "active",
    product_id: "lady",
    variant_id: "six-jets",
    status: "published",
  };
  assert.deepEqual(matchingRecipes([draft], "lady", "six-jets"), []);
  assert.deepEqual(matchingRecipes([draft, active], "lady", "six-jets"), [
    active,
  ]);
  assert.deepEqual(matchingRecipes([active], "lady", "four-jets"), []);
});

test("Imported fractions retain database precision and never round to zero units", () => {
  assert.equal(roundSupplyQuantity(0.33, "un"), 0.33);
  assert.equal(roundSupplyQuantity(0.25 * 3, "un"), 0.75);
  assert.equal(roundSupplyQuantity(0.0123, "m"), 0.0123);
  assert.equal(formatSupplyQuantity(0.33, "un"), "0,33 un");
  assert.equal(formatSupplyQuantity(1, "un"), "1 un");
  assert.equal(formatSupplyQuantity(1, "m"), "1,00 m");
});

test("Legacy component codes can be edited without discarding embedded spaces", () => {
  const supply = SupplyInputSchema.parse({
    code: "OG 1055",
    name: "Componente",
    unitOfMeasure: "un",
  });
  assert.equal(supply.code, "OG 1055");
});
