import { describe, it, expect } from "vitest";
import { canAccess, allowedRoutesFor } from "../rbac";

describe("canAccess", () => {
  it("owner can access every app route", () => {
    for (const p of ["/dashboard", "/inventory", "/orders", "/capture", "/vans", "/invoices", "/collections", "/retailers", "/schemes", "/users"]) {
      expect(canAccess("owner", p)).toBe(true);
    }
  });

  it("warehouse can access inventory but not orders/collections/users", () => {
    expect(canAccess("warehouse", "/inventory")).toBe(true);
    expect(canAccess("warehouse", "/orders")).toBe(false);
    expect(canAccess("warehouse", "/collections")).toBe(false);
    expect(canAccess("warehouse", "/users")).toBe(false);
  });

  it("driver_rep can access orders/collections/retailers but not inventory/users", () => {
    expect(canAccess("driver_rep", "/orders")).toBe(true);
    expect(canAccess("driver_rep", "/collections")).toBe(true);
    expect(canAccess("driver_rep", "/retailers")).toBe(true);
    expect(canAccess("driver_rep", "/inventory")).toBe(false);
    expect(canAccess("driver_rep", "/users")).toBe(false);
  });

  it("capture is owner + driver_rep only (warehouse blocked)", () => {
    expect(canAccess("owner", "/capture")).toBe(true);
    expect(canAccess("driver_rep", "/capture")).toBe(true);
    expect(canAccess("warehouse", "/capture")).toBe(false);
  });

  it("schemes is owner-only (admin-configurable)", () => {
    expect(canAccess("owner", "/schemes")).toBe(true);
    expect(canAccess("warehouse", "/schemes")).toBe(false);
    expect(canAccess("driver_rep", "/schemes")).toBe(false);
  });

  it("matches nested paths by prefix (/vans/123 → /vans rule)", () => {
    expect(canAccess("warehouse", "/vans/abc-123")).toBe(true);
    expect(canAccess("driver_rep", "/invoices/xyz")).toBe(true);
  });

  it("allows any signed-in role on unlisted routes (e.g. /kit)", () => {
    expect(canAccess("warehouse", "/kit")).toBe(true);
    expect(canAccess("driver_rep", "/")).toBe(true);
  });
});

describe("allowedRoutesFor", () => {
  it("lists the nav routes a role may see", () => {
    const owner = allowedRoutesFor("owner");
    expect(owner).toContain("/inventory");
    expect(owner).toContain("/users");
    const driver = allowedRoutesFor("driver_rep");
    expect(driver).toContain("/orders");
    expect(driver).not.toContain("/inventory");
  });
});
