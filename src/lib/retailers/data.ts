import { createAdminClient } from "@/lib/supabase/admin";

export type Retailer = {
  id: string;
  name: string;
  shopName: string | null;
  address: string | null;
  phone: string | null;
  gstin: string | null;
  route: string | null;
  lat: number | null;
  lng: number | null;
  approvalStatus: string;
  isActive: boolean;
};

type Row = {
  id: string;
  name: string;
  shop_name: string | null;
  address: string | null;
  phone: string | null;
  gstin: string | null;
  route: string | null;
  lat: number | null;
  lng: number | null;
  approval_status: string;
  is_active: boolean;
};

function map(r: Row): Retailer {
  return {
    id: r.id,
    name: r.name,
    shopName: r.shop_name,
    address: r.address,
    phone: r.phone,
    gstin: r.gstin,
    route: r.route,
    lat: r.lat,
    lng: r.lng,
    approvalStatus: r.approval_status,
    isActive: r.is_active,
  };
}

/** All retailers (active first), newest first. Seed-safe ([] on error). */
export async function getRetailers(): Promise<Retailer[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("retailers")
      .select("id,name,shop_name,address,phone,gstin,route,lat,lng,approval_status,is_active")
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
