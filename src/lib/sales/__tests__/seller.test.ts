import { describe, it, expect } from "vitest";
import { sellerEntityForCategory, invoiceSellerEntity } from "../seller";

describe("dual seller entity", () => {
  it("Cola/CSD/Soda → jaypee; Water/Juice/Energy → falcon", () => {
    expect(sellerEntityForCategory("Cola")).toBe("jaypee");
    expect(sellerEntityForCategory("Soda")).toBe("jaypee");
    expect(sellerEntityForCategory("Water")).toBe("falcon");
    expect(sellerEntityForCategory("Juice")).toBe("falcon");
    expect(sellerEntityForCategory("Energy")).toBe("falcon");
  });
  it("invoice picks the dominant entity (ties → jaypee)", () => {
    expect(invoiceSellerEntity(["Cola", "Cola", "Water"])).toBe("jaypee");
    expect(invoiceSellerEntity(["Water", "Juice", "Cola"])).toBe("falcon");
    expect(invoiceSellerEntity(["Cola", "Water"])).toBe("jaypee");
  });
});
