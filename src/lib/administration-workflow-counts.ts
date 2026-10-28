import type { SupabaseClient } from "@supabase/supabase-js";

export type AdministrationWorkflowCounts = {
  requests: number;
  preparation: number;
  production: number;
};

/** Keep the dashboard usable while the aggregate RPC is not yet installed. */
export async function readAdministrationWorkflowCounts(
  db: SupabaseClient,
): Promise<AdministrationWorkflowCounts> {
  const { data, error } = await db.rpc("administration_workflow_counts");
  if (!error) return data as AdministrationWorkflowCounts;
  if (error.code !== "PGRST202") throw error;

  // Filter the embedded relation before testing existence: cancelled OFs do not count.
  const [requests, preparation, production] = await Promise.all([
    db
      .from("order_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("orders")
      .select("id,manufacturing_orders(id)", { count: "exact", head: true })
      .eq("sale_channel", "direct")
      .in("status", ["pending", "processing"])
      .or(
        "commercial_approval_status.eq.approved,and(commercial_approval_status.eq.legacy,status.eq.pending)",
      )
      .in("manufacturing_orders.status", [
        "issued",
        "in_production",
        "completed",
      ])
      .is("manufacturing_orders", null),
    db
      .from("orders")
      .select("id,manufacturing_orders(id)", { count: "exact", head: true })
      .eq("sale_channel", "direct")
      .eq("status", "processing")
      .in("manufacturing_orders.status", [
        "issued",
        "in_production",
        "completed",
      ])
      .or(
        "commercial_approval_status.eq.legacy,manufacturing_orders.not.is.null",
      ),
  ]);
  for (const result of [requests, preparation, production]) {
    if (result.error) throw result.error;
    if (result.count === null)
      throw new Error("No se pudo obtener el conteo de pendientes.");
  }
  return {
    requests: requests.count!,
    preparation: preparation.count!,
    production: production.count!,
  };
}
