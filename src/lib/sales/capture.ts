"use server";

import { createRetailer } from "@/lib/retailers/actions";
import type { RetailerInput } from "@/lib/retailers/logic";
import { recordCollection } from "@/lib/collections/actions";
import type { CollectionMode } from "@/lib/collections/logic";
import { createOrder } from "./orders-actions";
import { confirmAndInvoice } from "./invoice-actions";

/**
 * Ground-level Sales Capture (audit #7) — the client's stated priority, as ONE call so
 * Aman's capture screen does: pick/inline-onboard shop → SKU/qty/rate/discount → payment
 * → invoice, in a single journey. Composes the existing actions (retailer / order /
 * confirm-and-invoice / collection). A below-list order stops at 'pending_approval'
 * (no invoice until an admin approves). The capture UI is Aman's lane; this is the backend.
 */
export type CaptureInput = {
  retailerId?: string | null;
  newRetailer?: RetailerInput | null; // inline onboarding when no existing shop
  route?: string | null;
  listType?: "retail" | "wholesale";
  lines: { skuId: string; qty: number; chargedPrice?: number | null }[];
  payment?: { mode: CollectionMode; amount: number; reference?: string | null } | null;
};

export type CaptureResult =
  | { ok: true; stage: "invoiced"; orderId: string; invoiceId: string }
  | { ok: true; stage: "pending_approval"; orderId: string }
  | { ok: false; error: string };

export async function captureSale(input: CaptureInput): Promise<CaptureResult> {
  // 1. Resolve the shop — inline-onboard if new.
  let retailerId = input.retailerId ?? null;
  if (!retailerId && input.newRetailer) {
    const r = await createRetailer(input.newRetailer);
    if (!r.ok) return { ok: false, error: r.error };
    retailerId = r.id;
  }

  // 2. Punch the order (per-line rate/discount; below-list → approval).
  const ord = await createOrder({
    retailerId,
    route: input.route ?? null,
    listType: input.listType,
    lines: input.lines,
  });
  if (!ord.ok) return { ok: false, error: ord.error };
  if (ord.needsApproval) {
    return { ok: true, stage: "pending_approval", orderId: ord.orderId };
  }

  // 3. Invoice + atomic stock deduct.
  const inv = await confirmAndInvoice(ord.orderId);
  if (!inv.ok) return { ok: false, error: inv.error };

  // 4. Capture the payment (cash/UPI), if collected at the door.
  if (input.payment && input.payment.amount > 0) {
    await recordCollection(inv.invoiceId, {
      amount: input.payment.amount,
      mode: input.payment.mode,
      reference: input.payment.reference ?? null,
    });
  }

  return { ok: true, stage: "invoiced", orderId: ord.orderId, invoiceId: inv.invoiceId };
}
