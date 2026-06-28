"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";
import { outstanding, validateCollection, type CollectionInput } from "./logic";

/**
 * Record a collection against an invoice (M29). Reads the invoice total + what's
 * already collected, validates against the outstanding, inserts the row, audits.
 * Reference (UPI UTR / receipt no) is captured, not processed.
 */
export type RecordCollectionResult = { ok: true } | { ok: false; error: string };

export async function recordCollection(
  invoiceId: string,
  input: CollectionInput,
): Promise<RecordCollectionResult> {
  try {
    const supabase = createAdminClient();

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("id,total,retailer_id")
      .eq("id", invoiceId)
      .maybeSingle();
    if (invErr || !invoice) return { ok: false, error: "Invoice not found." };

    const { data: existing } = await supabase
      .from("collections")
      .select("amount")
      .eq("invoice_id", invoiceId);
    const collected = (existing ?? []).reduce((a, c) => a + Number(c.amount), 0);
    const owed = outstanding(Number(invoice.total), collected);

    const invalid = validateCollection(input, { outstanding: owed });
    if (invalid) return { ok: false, error: invalid };

    const { data: row, error: insErr } = await supabase
      .from("collections")
      .insert({
        invoice_id: invoiceId,
        retailer_id: invoice.retailer_id,
        amount: input.amount,
        mode: input.mode,
        reference: input.reference ?? null,
      })
      .select("id")
      .single();
    if (insErr || !row) {
      console.error("recordCollection: insert error —", insErr?.message);
      return { ok: false, error: "Could not record the collection. Please try again." };
    }

    await logAudit({
      action: "collection.record",
      entityTable: "collections",
      entityId: row.id,
      after: { invoiceId, amount: input.amount, mode: input.mode },
    });

    revalidatePath(`/invoices/${invoiceId}`);
    return { ok: true };
  } catch (err) {
    console.error("recordCollection: unexpected error —", err);
    return { ok: false, error: "Unexpected error recording the collection." };
  }
}
