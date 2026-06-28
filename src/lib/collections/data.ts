import { createAdminClient } from "@/lib/supabase/admin";

export type CollectionRow = {
  id: string;
  amount: number;
  mode: string;
  reference: string | null;
  collectedAt: string;
};

/** Collections recorded against an invoice + their total. Seed-safe. */
export async function getCollections(
  invoiceId: string,
): Promise<{ rows: CollectionRow[]; total: number }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("collections")
      .select("id,amount,mode,reference,collected_at")
      .eq("invoice_id", invoiceId)
      .order("collected_at", { ascending: false });
    if (error) {
      console.error("getCollections: Supabase error —", error.message);
      return { rows: [], total: 0 };
    }
    const rows = (data ?? []).map((c) => ({
      id: c.id,
      amount: Number(c.amount),
      mode: c.mode,
      reference: c.reference,
      collectedAt: c.collected_at,
    }));
    return { rows, total: rows.reduce((a, r) => a + r.amount, 0) };
  } catch (err) {
    console.error("getCollections: unexpected error —", err);
    return { rows: [], total: 0 };
  }
}
