"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";
import { getConfig } from "@/lib/config/data";
import { computeReconciliation, type ReconcileResult } from "./reconcile-logic";

/**
 * Reconcile a van load (M27) — out − returned vs invoiced sales + cash. Sales/cash are
 * matched to the load by route + date (best linkage until van↔invoice is explicit).
 * Upserts the reconciliations row and flips the load to 'reconciled'. Variance beyond
 * the configured tolerance flags it to the owner. Audited.
 */
export type ReconcileVanResult =
  | { ok: true; result: ReconcileResult }
  | { ok: false; error: string };

function sum<T>(rows: T[] | null | undefined, pick: (r: T) => number): number {
  return (rows ?? []).reduce((a, r) => a + Number(pick(r)), 0);
}

export async function reconcileVanLoad(vanLoadId: string): Promise<ReconcileVanResult> {
  try {
    const supabase = createAdminClient();

    const { data: load, error: loadErr } = await supabase
      .from("van_loads")
      .select("id,route,load_date")
      .eq("id", vanLoadId)
      .maybeSingle();
    if (loadErr || !load) return { ok: false, error: "Van load not found." };

    const { data: lines } = await supabase
      .from("van_load_lines")
      .select("qty_out,qty_returned")
      .eq("van_load_id", vanLoadId);
    const qtyOut = sum(lines, (l) => l.qty_out);
    const qtyReturned = sum(lines, (l) => l.qty_returned);

    // Invoices for this route + date → recognized sales + cash owed.
    let soldInvoiced = 0;
    let cashExpected = 0;
    let cashCollected = 0;
    if (load.route) {
      const { data: orders } = await supabase.from("orders").select("id").eq("route", load.route);
      const orderIds = (orders ?? []).map((o) => o.id);
      if (orderIds.length) {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("id,total")
          .in("order_id", orderIds)
          .eq("invoice_date", load.load_date);
        const invoiceIds = (invoices ?? []).map((i) => i.id);
        cashExpected = sum(invoices, (i) => i.total);

        if (invoiceIds.length) {
          const { data: invLines } = await supabase
            .from("invoice_lines")
            .select("qty")
            .in("invoice_id", invoiceIds);
          soldInvoiced = sum(invLines, (l) => l.qty);

          const { data: collections } = await supabase
            .from("collections")
            .select("amount")
            .in("invoice_id", invoiceIds);
          cashCollected = sum(collections, (c) => c.amount);
        }
      }
    }

    const tol = await getConfig("recon_tolerance"); // { amount, pct }
    const qtyTolerance = Math.ceil((qtyOut * (tol.pct ?? 0)) / 100);
    const cashTolerance = tol.amount ?? 0;

    const result = computeReconciliation({
      qtyOut,
      qtyReturned,
      soldInvoiced,
      cashExpected,
      cashCollected,
      qtyTolerance,
      cashTolerance,
    });

    const { error: upErr } = await supabase.from("reconciliations").upsert(
      {
        van_load_id: vanLoadId,
        qty_out: result.qtyOut,
        qty_sold: result.qtySold,
        qty_returned: result.qtyReturned,
        variance: result.variance,
        cash_expected: result.cashExpected,
        cash_collected: result.cashCollected,
        cash_variance: result.cashVariance,
        status: result.status,
      },
      { onConflict: "van_load_id" },
    );
    if (upErr) {
      console.error("reconcileVanLoad: upsert error —", upErr.message);
      return { ok: false, error: "Could not save the reconciliation." };
    }

    await supabase.from("van_loads").update({ status: "reconciled" }).eq("id", vanLoadId);

    await logAudit({
      action: "van.reconcile",
      entityTable: "reconciliations",
      entityId: vanLoadId,
      after: { variance: result.variance, cashVariance: result.cashVariance, status: result.status },
    });

    revalidatePath(`/vans/${vanLoadId}`);
    revalidatePath("/vans");
    return { ok: true, result };
  } catch (err) {
    console.error("reconcileVanLoad: unexpected error —", err);
    return { ok: false, error: "Unexpected error reconciling the load." };
  }
}

export type ReconciliationRow = ReconcileResult & { reconciledAt: string | null };

/** Read a saved reconciliation for a load, or null if not reconciled yet. */
export async function getReconciliation(vanLoadId: string): Promise<ReconciliationRow | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("reconciliations")
      .select("qty_out,qty_sold,qty_returned,variance,cash_expected,cash_collected,cash_variance,status,reconciled_at")
      .eq("van_load_id", vanLoadId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      qtyOut: Number(data.qty_out),
      qtyReturned: Number(data.qty_returned),
      qtySold: Number(data.qty_sold),
      variance: Number(data.variance),
      cashExpected: Number(data.cash_expected),
      cashCollected: Number(data.cash_collected),
      cashVariance: Number(data.cash_variance),
      status: data.status as "ok" | "flagged",
      reconciledAt: data.reconciled_at,
    };
  } catch (err) {
    console.error("getReconciliation: unexpected error —", err);
    return null;
  }
}
