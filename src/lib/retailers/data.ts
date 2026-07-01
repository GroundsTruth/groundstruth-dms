import { createAdminClient } from "@/lib/supabase/admin";

export type Retailer = {
  id: string;
  name: string;
  ownerName: string | null;
  shopName: string | null;
  address: string | null;
  phone: string | null;
  gstin: string | null;
  route: string | null;
  lat: number | null;
  lng: number | null;
  approvalStatus: string;
  isActive: boolean;
  customerType: string;
  customerCategory: string;
  creditLimit: number;
};

type Row = {
  id: string;
  name: string;
  owner_name: string | null;
  shop_name: string | null;
  address: string | null;
  phone: string | null;
  gstin: string | null;
  route: string | null;
  lat: number | null;
  lng: number | null;
  approval_status: string;
  is_active: boolean;
  customer_type: string | null;
  customer_category: string | null;
  credit_limit: number | null;
};

function map(r: Row): Retailer {
  return {
    id: r.id,
    name: r.name,
    ownerName: r.owner_name,
    shopName: r.shop_name,
    address: r.address,
    phone: r.phone,
    gstin: r.gstin,
    route: r.route,
    lat: r.lat,
    lng: r.lng,
    approvalStatus: r.approval_status,
    isActive: r.is_active,
    customerType: r.customer_type ?? "cash",
    customerCategory: r.customer_category ?? "retail",
    creditLimit: Number(r.credit_limit ?? 0),
  };
}

/** All retailers (active first), newest first. Seed-safe ([] on error). */
export async function getRetailers(): Promise<Retailer[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("retailers")
      .select("id,name,owner_name,shop_name,address,phone,gstin,route,lat,lng,approval_status,is_active,customer_type,customer_category,credit_limit")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getRetailers: Supabase error —", error.message);
      return [];
    }
    return (data ?? []).map((r) => map(r as Row));
  } catch (err) {
    console.error("getRetailers: unexpected error —", err);
    return [];
  }
}

export type RetailerCredit = {
  creditLimit: number;
  invoiced: number;
  collected: number;
  outstanding: number;
  available: number;
};

/** Derived credit position for a retailer (audit #6): outstanding = invoiced − collected. */
export async function getRetailerCredit(retailerId: string): Promise<RetailerCredit> {
  try {
    const supabase = createAdminClient();
    const [{ data: r }, { data: invs }, { data: cols }] = await Promise.all([
      supabase.from("retailers").select("credit_limit").eq("id", retailerId).maybeSingle(),
      supabase.from("invoices").select("total").eq("retailer_id", retailerId),
      supabase.from("collections").select("amount").eq("retailer_id", retailerId),
    ]);
    const creditLimit = Number(r?.credit_limit ?? 0);
    const invoiced = (invs ?? []).reduce((a, i) => a + Number(i.total), 0);
    const collected = (cols ?? []).reduce((a, c) => a + Number(c.amount), 0);
    const outstanding = invoiced - collected;
    return { creditLimit, invoiced, collected, outstanding, available: creditLimit - outstanding };
  } catch (err) {
    console.error("getRetailerCredit: unexpected error —", err);
    return { creditLimit: 0, invoiced: 0, collected: 0, outstanding: 0, available: 0 };
  }
}
