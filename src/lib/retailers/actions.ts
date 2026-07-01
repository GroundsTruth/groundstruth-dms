"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";
import { validateRetailer, normalizePhone, type RetailerInput } from "./logic";
import { getSessionUser, requireRole } from "@/lib/auth/session";

/**
 * Retailer onboarding (M16/M17) — server actions. Create/update with light validation;
 * new retailers start `pending` and an owner/approver flips them to `approved` (M17
 * approval rule). Soft-deactivate instead of delete (history-safe). Audited.
 * TODO(auth): gate create/approve to owner/rep + stamp created_by once M05–M09 land.
 */
export type RetailerActionResult = { ok: true; id: string } | { ok: false; error: string };

function toRow(input: RetailerInput) {
  return {
    name: input.name.trim(),
    owner_name: input.ownerName?.trim() || null,
    shop_name: input.shopName?.trim() || null,
    address: input.address?.trim() || null,
    phone: input.phone ? normalizePhone(input.phone) : null,
    gstin: input.gstin?.trim().toUpperCase() || null,
    route: input.route?.trim() || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    customer_type: input.customerType ?? "cash",
    customer_category: input.customerCategory ?? "retail",
    credit_limit: input.creditLimit ?? 0,
    shop_photo_path: input.shopPhotoPath ?? null,
  };
}

export async function createRetailer(input: RetailerInput): Promise<RetailerActionResult> {
  const invalid = validateRetailer(input);
  if (invalid) return { ok: false, error: invalid };
  try {
    const supabase = createAdminClient();
    // #11: cash customers auto-approve; credit customers need sign-off.
    const approval_status = (input.customerType ?? "cash") === "cash" ? "approved" : "pending";
    const { data, error } = await supabase
      .from("retailers")
      .insert({ ...toRow(input), approval_status })
      .select("id")
      .single();
    if (error || !data) {
      console.error("createRetailer: insert error —", error?.message);
      return { ok: false, error: "Could not add the retailer. Please try again." };
    }
    await logAudit({ action: "retailer.create", entityTable: "retailers", entityId: data.id, after: input });
    revalidatePath("/retailers");
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("createRetailer: unexpected error —", err);
    return { ok: false, error: "Unexpected error adding the retailer." };
  }
}

export async function updateRetailer(id: string, input: RetailerInput): Promise<RetailerActionResult> {
  const invalid = validateRetailer(input);
  if (invalid) return { ok: false, error: invalid };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("retailers").update(toRow(input)).eq("id", id);
    if (error) {
      console.error("updateRetailer: update error —", error.message);
      return { ok: false, error: "Could not save the retailer. Please try again." };
    }
    await logAudit({ action: "retailer.update", entityTable: "retailers", entityId: id, after: input });
    revalidatePath("/retailers");
    return { ok: true, id };
  } catch (err) {
    console.error("updateRetailer: unexpected error —", err);
    return { ok: false, error: "Unexpected error saving the retailer." };
  }
}

/** Approve a pending retailer, or set back to pending (M17 approval rule).
 *  #23: gated to owner/warehouse. While auth is dormant (no session), it's allowed; once
 *  AUTH_ENABLED + a session exists, a non-owner/warehouse caller is rejected. */
export async function setRetailerApproval(id: string, approved: boolean): Promise<RetailerActionResult> {
  try {
    const user = await getSessionUser();
    if (user) requireRole(user, ["owner", "warehouse"]);
    const supabase = createAdminClient();
    const status = approved ? "approved" : "pending";
    const { error } = await supabase.from("retailers").update({ approval_status: status }).eq("id", id);
    if (error) {
      console.error("setRetailerApproval: error —", error.message);
      return { ok: false, error: "Could not update approval." };
    }
    await logAudit({ action: "retailer.approval", entityTable: "retailers", entityId: id, after: { status } });
    revalidatePath("/retailers");
    return { ok: true, id };
  } catch (err) {
    console.error("setRetailerApproval: unexpected error —", err);
    return { ok: false, error: "Unexpected error updating approval." };
  }
}

/** Soft activate / deactivate. */
export async function setRetailerActive(id: string, active: boolean): Promise<RetailerActionResult> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("retailers").update({ is_active: active }).eq("id", id);
    if (error) {
      console.error("setRetailerActive: error —", error.message);
      return { ok: false, error: "Could not update the retailer." };
    }
    await logAudit({ action: "retailer.active", entityTable: "retailers", entityId: id, after: { active } });
    revalidatePath("/retailers");
    return { ok: true, id };
  } catch (err) {
    console.error("setRetailerActive: unexpected error —", err);
    return { ok: false, error: "Unexpected error updating the retailer." };
  }
}
