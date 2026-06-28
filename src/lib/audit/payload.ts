/**
 * Audit payload builder (M02) — pure, no Supabase imports, unit-tested. Maps a
 * caller's camelCase input to an `audit_log` row (snake_case), normalizing omitted
 * optionals to null and validating the required fields. Kept separate from the DB
 * write (./service) so the mapping is testable and the writer stays a thin wrapper.
 */

export type AuditInput = {
  actorUserId?: string | null;
  action: string;          // e.g. "sku.update", "invoice.create"
  entityTable: string;     // e.g. "skus", "invoices"
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

export type AuditRow = {
  actor_user_id: string | null;
  action: string;
  entity_table: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
};

export function buildAuditRow(input: AuditInput): AuditRow {
  const action = (input.action ?? "").trim();
  if (!action) throw new Error("audit: action is required.");
  const entityTable = (input.entityTable ?? "").trim();
  if (!entityTable) throw new Error("audit: entityTable is required.");

  return {
    actor_user_id: input.actorUserId ?? null,
    action,
    entity_table: entityTable,
    entity_id: input.entityId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
  };
}
