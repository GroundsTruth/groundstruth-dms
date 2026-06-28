import { createAdminClient } from "@/lib/supabase/admin";

export { formatInvoiceNo } from "./invoice-format";

/**
 * Invoice numbering (M20). The series lives in config.invoice_series
 * ({prefix,next,padding}); the `next_invoice_no` RPC reads + increments it under a
 * row lock so concurrent invoices never collide or skip. The pure formatter lives in
 * ./invoice-format (unit-tested); `nextInvoiceNo` is the atomic server call.
 */

/**
 * Reserve the next invoice number (atomic). Returns null on failure so the caller
 * (confirmAndInvoice, M22) can abort the whole invoice rather than guess a number.
 */
export async function nextInvoiceNo(): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("next_invoice_no");
    if (error) {
      console.error("nextInvoiceNo: rpc error —", error.message);
      return null;
    }
    return data as string;
  } catch (err) {
    console.error("nextInvoiceNo: unexpected error —", err);
    return null;
  }
}
