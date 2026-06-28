import { createAdminClient } from "@/lib/supabase/admin";
import { buildAuditRow, type AuditInput } from "./payload";

/**
 * AuditService (M02) — append one row to `audit_log`. This is a SIDE-EFFECT:
 * per CLAUDE.md rule 4 it must NEVER throw or block the main flow. All errors
 * (bad payload, DB unreachable) are swallowed and logged. Call it after the
 * primary mutation has succeeded.
 *
 *   await logAudit({ actorUserId, action: "sku.update", entityTable: "skus",
 *                    entityId, before, after });
 *
 * Returns true if the row was written, false if it was swallowed.
 */
export async function logAudit(input: AuditInput): Promise<boolean> {
  try {
    const row = buildAuditRow(input);
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_log").insert(row);
    if (error) {
      console.error("logAudit: insert failed (swallowed) —", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("logAudit: unexpected error (swallowed) —", err);
    return false;
  }
}
