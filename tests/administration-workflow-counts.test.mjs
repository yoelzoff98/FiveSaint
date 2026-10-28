import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { readAdministrationWorkflowCounts } from "../src/lib/administration-workflow-counts.ts";

function client(handler) {
  return createClient("https://synthetic.supabase.co", "synthetic-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, options) => handler(new URL(url), options) },
  });
}
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

test("Installed aggregate RPC returns counts without extra queries", async () => {
  const counts = { requests: 2, preparation: 3, production: 4 };
  const db = client((url) => {
    assert.ok(url.pathname.endsWith("/rpc/administration_workflow_counts"));
    return json(counts);
  });
  assert.deepEqual(await readAdministrationWorkflowCounts(db), counts);
});

test("Missing RPC falls back to exact head counts with the same workflow filters", async () => {
  const queries = [];
  const db = client((url, options) => {
    if (url.pathname.includes("/rpc/"))
      return json({ code: "PGRST202", message: "Missing RPC" }, 404);
    queries.push(url);
    assert.equal(options.method, "HEAD");
    assert.ok(
      new Headers(options.headers).get("prefer").includes("count=exact"),
    );
    let count = 2;
    if (url.pathname.endsWith("/orders")) {
      assert.equal(url.searchParams.get("sale_channel"), "eq.direct");
      assert.equal(
        url.searchParams.get("manufacturing_orders.status"),
        "in.(issued,in_production,completed)",
      );
      if (url.searchParams.has("manufacturing_orders")) {
        count = 3;
        assert.equal(url.searchParams.get("manufacturing_orders"), "is.null");
        assert.equal(url.searchParams.get("status"), "in.(pending,processing)");
        assert.equal(
          url.searchParams.get("or"),
          "(commercial_approval_status.eq.approved,and(commercial_approval_status.eq.legacy,status.eq.pending))",
        );
      } else {
        count = 4;
        assert.equal(url.searchParams.get("status"), "eq.processing");
        assert.equal(
          url.searchParams.get("or"),
          "(commercial_approval_status.eq.legacy,manufacturing_orders.not.is.null)",
        );
      }
    } else {
      assert.ok(url.pathname.endsWith("/order_requests"));
      assert.equal(url.searchParams.get("status"), "eq.pending");
    }
    return new Response(null, {
      headers: { "content-range": `0-${count - 1}/${count}` },
    });
  });
  assert.deepEqual(await readAdministrationWorkflowCounts(db), {
    requests: 2,
    preparation: 3,
    production: 4,
  });
  assert.equal(queries.length, 3);
});

test("Permission failures do not activate the compatibility fallback", async () => {
  let calls = 0;
  const db = client(() => {
    calls++;
    return json({ code: "42501", message: "permission denied" }, 403);
  });
  await assert.rejects(
    readAdministrationWorkflowCounts(db),
    (e) => e.code === "42501",
  );
  assert.equal(calls, 1);
});

test("A failed count remains an error instead of reporting zero pending work", async () => {
  const db = client((url) =>
    url.pathname.includes("/rpc/")
      ? json({ code: "PGRST202", message: "Missing RPC" }, 404)
      : json({ code: "42P01", message: "missing table" }, 404),
  );
  await assert.rejects(
    readAdministrationWorkflowCounts(db),
    (e) => e.code === "42P01",
  );
});
