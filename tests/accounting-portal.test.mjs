import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { accountingPeriod, csvCell } from "../src/lib/accounting.ts";
test("Accounting periods and CSV injection protection", () => {
  assert.deepEqual(accountingPeriod("2026-12"), {
    month: "2026-12",
    start: "2026-12-01",
    end: "2027-01-01",
  });
  assert.throws(() => accountingPeriod("2026-13"));
  for (const value of ['=HYPERLINK("x")', " +cmd", "@SUM(A1)", "\t=1"])
    assert.ok(csvCell(value).startsWith("\"'"));
});
test("Accounting migration: restricted roles, immutable fiscal ledger, historical isolation and idempotence", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      fs.readFileSync("tests/fixtures/commercial-current-schema.sql", "utf8"),
    );
    for (const file of fs
      .readdirSync("supabase/migrations")
      .filter((n) => n.endsWith(".sql"))
      .sort())
      await db.exec(fs.readFileSync(`supabase/migrations/${file}`, "utf8"));
    const migration = fs.readFileSync(
      "supabase/migrations/20261019000100_accounting_portal.sql",
      "utf8",
    );
    const ids = [
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "dddddddd-dddd-dddd-dddd-dddddddddddd",
    ];
    for (const id of ids)
      await db.query("insert into auth.users(id) values($1)", [id]);
    await db.query(
      "insert into admin_users(user_id,username,full_name) values($1,'admin','Admin')",
      [ids[0]],
    );
    await db.query(
      "insert into administration_users(user_id,full_name,email) values($1,'Staff','staff@example.invalid')",
      [ids[1]],
    );
    await db.query(
      "insert into accounting_users(user_id,full_name,email) values($1,'Accountant','accountant@example.invalid')",
      [ids[2]],
    );
    const seller = (
      await db.query(
        "insert into sellers(user_id,username,full_name,email) values($1,'seller','Seller','seller@example.invalid') returning id",
        [ids[3]],
      )
    ).rows[0].id;
    await db.query(
      "insert into clients(seller_id,name) values($1,'Historical client')",
      [seller],
    );
    const client = (await db.query("select id from clients limit 1")).rows[0]
      .id;
    const budget = (
      await db.query(
        "insert into budgets(client_id,seller_id,total_amount) values($1,$2,100) returning id",
        [client, seller],
      )
    ).rows[0].id;
    await db.query(
      "insert into orders(client_id,seller_id,budget_id,total_amount,recorded_by_user_id) values($1,$2,$3,100,$4)",
      [client, seller, budget, ids[0]],
    );
    await db.exec(
      "insert into fiscal_documents(issuer_tax_id,voucher_type,point_of_sale,voucher_number,issued_on,recipient_name,recipient_document,currency,net_amount,tax_amount,total_amount,authorization_code,authorization_expires_on,authorized_at) values('20123456789',1,1,1,'2026-10-19','Synthetic recipient','20111111112','ARS',100,21,121,'12345678901234','2026-10-29',now())",
    );
    const doc = (await db.query("select * from fiscal_documents")).rows;
    await db.exec(migration);
    assert.deepEqual(
      (await db.query("select * from fiscal_documents")).rows,
      doc,
    );
    for (let i = 0; i < ids.length; i++) {
      await db.exec("SET ROLE authenticated");
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
        ids[i],
      ]);
      assert.equal(
        (await db.query("select count(*)::int n from fiscal_documents")).rows[0]
          .n,
        i < 3 ? 1 : 0,
      );
      await assert.rejects(
        db.exec(
          "insert into accounting_users(user_id,full_name,email) values(gen_random_uuid(),'Forged','x')",
        ),
      );
      await assert.rejects(db.exec("delete from fiscal_documents"));
      if (i === 2) {
        assert.equal(
          (await db.query("select count(*)::int n from clients")).rows[0].n,
          0,
        );
        assert.equal(
          (await db.query("select count(*)::int n from budgets")).rows[0].n,
          0,
        );
        assert.equal(
          (await db.query("select count(*)::int n from orders")).rows[0].n,
          0,
        );
      }
      await db.exec("RESET ROLE");
    }
    await db.query(
      "update accounting_users set is_active=false where user_id=$1",
      [ids[2]],
    );
    await db.exec("SET ROLE authenticated");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      ids[2],
    ]);
    assert.equal(
      (await db.query("select count(*)::int n from fiscal_documents")).rows[0]
        .n,
      0,
    );
    await db.exec("RESET ROLE");
    // A deactivated privileged profile cannot fall back to an active accountant profile.
    await db.query(
      "insert into accounting_users(user_id,full_name,email) values($1,'Overlap','overlap@example.invalid')",
      [ids[0]],
    );
    await db.query("update admin_users set is_active=false where user_id=$1", [
      ids[0],
    ]);
    await db.exec("SET ROLE authenticated");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      ids[0],
    ]);
    assert.equal(
      (await db.query("select count(*)::int n from fiscal_documents")).rows[0]
        .n,
      0,
    );
    await db.exec("RESET ROLE");
    await db.exec("SET ROLE anon");
    await assert.rejects(db.exec("select * from fiscal_documents"));
    await db.exec("RESET ROLE");
    await assert.rejects(
      db.exec("update fiscal_documents set total_amount=121"),
      /inmutables/,
    );
    await assert.rejects(db.exec("delete from fiscal_documents"), /inmutables/);
    assert.equal(
      (await db.query("select count(*)::int n from clients")).rows[0].n,
      1,
    );
  } finally {
    await db.close();
  }
});

test("Full source snapshots, partial invoices, credit notes and authorization stay consistent", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      fs.readFileSync("tests/fixtures/commercial-current-schema.sql", "utf8"),
    );
    for (const file of fs
      .readdirSync("supabase/migrations")
      .filter((n) => n.endsWith(".sql"))
      .sort())
      await db.exec(fs.readFileSync(`supabase/migrations/${file}`, "utf8"));
    const admin = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      accountant = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    await db.query("insert into auth.users(id) values($1),($2)", [
      admin,
      accountant,
    ]);
    await db.query(
      "insert into admin_users(user_id,username,full_name) values($1,'admin','Admin')",
      [admin],
    );
    await db.query(
      "insert into accounting_users(user_id,full_name,email) values($1,'Accountant','accountant@example.invalid')",
      [accountant],
    );
    const client = (
      await db.query(
        "insert into clients(name) values('Synthetic client') returning id",
      )
    ).rows[0].id;
    const budget = (
      await db.query(
        "insert into budgets(client_id,total_amount) values($1,200) returning id",
        [client],
      )
    ).rows[0].id;
    const unrelated = (
      await db.query(
        "insert into budgets(client_id,total_amount) values($1,999) returning id",
        [client],
      )
    ).rows[0].id;
    await db.query(
      "insert into budget_items(budget_id,product_name,quantity,unit_price,total_price) values($1,'Bath',1,180,180),($1,'Extra jets',2,10,20)",
      [budget],
    );
    const order = (
      await db.query(
        "insert into orders(client_id,budget_id,total_amount,recorded_by_user_id) values($1,$2,200,$3) returning id",
        [client, budget, admin],
      )
    ).rows[0].id;
    await db.query(
      "insert into order_items(order_id,product_name,quantity,unit_price,total_price) values($1,'Bath',1,180,180),($1,'Extra jets',2,10,20)",
      [order],
    );
    let n = 0;
    async function invoice(
      amount,
      {
        type = 1,
        sourceOrder = order,
        sourceBudget = null,
        original = null,
        currency = "ARS",
      } = {},
    ) {
      return (
        await db.query(
          `insert into fiscal_documents(issuer_tax_id,voucher_type,point_of_sale,voucher_number,issued_on,recipient_name,recipient_document,currency,net_amount,tax_amount,total_amount,authorization_code,authorization_expires_on,authorized_at,source_order_id,source_budget_id,original_document_id,source_order_snapshot)
 values('20123456789',$1,1,$2,'2026-10-19','Synthetic recipient','20111111112',$3,$4,0,$4,'12345678901234','2026-10-29',now(),$5,$6,$7,'{"forged":true}') returning *`,
          [type, ++n, currency, amount, sourceOrder, sourceBudget, original],
        )
      ).rows[0];
    }
    const first = await invoice(80);
    assert.equal(first.source_budget_id, budget);
    assert.equal(first.source_order_snapshot.items.length, 2);
    assert.equal(first.source_budget_snapshot.items.length, 2);
    assert.equal(first.source_order_snapshot.document.total_amount, 200);
    assert.ok(!("public_token" in first.source_budget_snapshot.document));
    assert.ok(!first.source_order_snapshot.forged);
    const second = await invoice(60);
    const credit = await invoice(20, {
      type: 3,
      sourceOrder: null,
      original: first.id,
    });
    assert.equal(credit.source_order_id, order);
    assert.deepEqual(credit.source_order_snapshot, first.source_order_snapshot);
    await assert.rejects(
      invoice(10, { sourceBudget: unrelated }),
      /no corresponde/,
    );
    await assert.rejects(
      invoice(10, { sourceOrder: null, original: first.id, currency: "USD" }),
      /mismo emisor y moneda/,
    );
    const noSource = await invoice(99, { sourceOrder: null });
    assert.equal(noSource.source_order_id, null);
    assert.equal(noSource.source_budget_snapshot, null);
    await db.query(
      "update budget_items set product_name='Changed product' where budget_id=$1",
      [budget],
    );
    await db.query("update orders set total_amount=400 where id=$1", [order]);
    assert.deepEqual(
      (
        await db.query(
          "select source_order_snapshot from fiscal_documents where id=$1",
          [first.id],
        )
      ).rows[0].source_order_snapshot,
      first.source_order_snapshot,
    );
    const migration = fs.readFileSync(
      "supabase/migrations/20261019000200_accounting_document_traceability.sql",
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    await db.exec("SET ROLE authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      accountant,
    ]);
    const summary = (
      await db.query("select get_fiscal_billing_summary($1) result", [first.id])
    ).rows[0].result;
    assert.equal(summary.document_count, 3);
    assert.equal(summary.net_invoiced, 120);
    assert.equal(summary.pending_amount, 80);
    assert.equal(
      Number(first.source_order_snapshot.document.total_amount) -
        summary.net_invoiced,
      80,
    );
    assert.equal(
      (await db.query("select count(*)::int n from budgets")).rows[0].n,
      0,
    );
    assert.equal(
      (
        await db.query(
          "select source_budget_snapshot from fiscal_documents where id=$1",
          [first.id],
        )
      ).rows[0].source_budget_snapshot.document.id,
      budget,
    );
    assert.equal(
      (await db.query("select count(*)::int n from orders")).rows[0].n,
      0,
    );
    await assert.rejects(
      db.query("update fiscal_documents set source_budget_id=$1 where id=$2", [
        unrelated,
        first.id,
      ]),
    );
    await db.exec("RESET ROLE");
    await db.query(
      "update accounting_users set is_active=false where user_id=$1",
      [accountant],
    );
    await db.exec("SET ROLE authenticated");
    await assert.rejects(
      db.query("select get_fiscal_billing_summary($1)", [first.id]),
      /Acceso denegado/,
    );
    await db.exec("RESET ROLE");
    await db.exec("SET ROLE anon");
    await assert.rejects(
      db.query("select get_fiscal_billing_summary($1)", [first.id]),
    );
    await db.exec("RESET ROLE");
    assert.ok(second.id);
  } finally {
    await db.close();
  }
});
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AccountingSourceDocument} from '../src/components/contable/AccountingSourceDocument.tsx';

test('Source document displays full budget including customer, additions, configuration and totals',()=>{
 const snapshot={currency:'ARS',document:{id:'source',budget_number:176,total_amount:200,status:'accepted',created_at:'2026-10-19T12:00:00Z',discounts:[5],subtotal_amount:190,tax_amount:10,public_notes:'Condiciones originales',client_snapshot:{name:'Cliente relacionado',company_name:'Empresa relacionada'},seller_snapshot:{name:'Asesor original'}},items:[{id:'base',product_name:'Bañera',quantity:1,unit_price:180,total_price:180},{id:'addition',product_name:'Jets adicionales',quantity:2,unit_price:10,total_price:20,configuration:{jets_count:2}}]};
 const html=renderToStaticMarkup(React.createElement(AccountingSourceDocument,{title:'Presupuesto',id:'presupuesto',snapshot}));
 for(const text of ['176','Bañera','Jets adicionales','jets_count','Cliente relacionado','Empresa relacionada','Asesor original','Condiciones originales','200,00','180,00'])assert.ok(html.includes(text),text);
 assert.ok(!html.includes('overflow-hidden'));
});
