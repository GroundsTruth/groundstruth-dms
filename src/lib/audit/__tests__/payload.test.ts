import { describe, it, expect } from "vitest";
import { buildAuditRow } from "../payload";

describe("buildAuditRow", () => {
  it("maps camelCase input to the snake_case audit_log row", () => {
    const row = buildAuditRow({
      actorUserId: "u-1",
      action: "sku.update",
      entityTable: "skus",
      entityId: "s-9",
      before: { name: "old" },
      after: { name: "new" },
    });
    expect(row).toEqual({
      actor_user_id: "u-1",
      action: "sku.update",
      entity_table: "skus",
      entity_id: "s-9",
      before: { name: "old" },
      after: { name: "new" },
    });
  });

  it("normalizes omitted optional fields to null", () => {
    const row = buildAuditRow({ action: "invoice.create", entityTable: "invoices" });
    expect(row.actor_user_id).toBeNull();
    expect(row.entity_id).toBeNull();
    expect(row.before).toBeNull();
    expect(row.after).toBeNull();
  });

  it("trims action and entity_table", () => {
    const row = buildAuditRow({ action: "  order.cancel  ", entityTable: "  orders " });
    expect(row.action).toBe("order.cancel");
    expect(row.entity_table).toBe("orders");
  });

  it("throws when action is empty", () => {
    expect(() => buildAuditRow({ action: "  ", entityTable: "skus" })).toThrow(/action/i);
  });

  it("throws when entityTable is empty", () => {
    expect(() => buildAuditRow({ action: "sku.update", entityTable: "" })).toThrow(/entity/i);
  });
});
