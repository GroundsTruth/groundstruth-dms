import { createAdminClient } from "@/lib/supabase/admin";
import { invoiceSellerEntity } from "./seller";

/**
 * Invoice read accessors (M21) — server-side, seed-safe. No nested joins.
 */

export type InvoiceSummary = {
  id: string;
  invoiceNo: string;
  orderId: string | null;
  invoiceDate: string;
  total: number;
  status: string;
};

export type Seller = { name: string; gstin: string; address: string; stateCode: string };

export type InvoiceDetail = {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  status: string;
  route: string | null;
  subtotal: number;
  taxTotal: number;
  cessTotal: number;
  total: number;
  provisional: boolean;
  seller: Seller;
  lines: {
    code: string;
    name: string;
    hsn: string | null;
    qty: number;
    unitPrice: number;
    taxable: number;
    taxPct: number;
    taxAmount: number;
    cessPct: number;
    cessAmount: number;
    lineTotal: number;
  }[];
};

const SELLER_FALLBACK: Seller = {
  name: "Jaypee Advertisers",
  gstin: "[GSTIN pending]",
  address: "[address pending]",
  stateCode: "",
};

export async function getRecentInvoices(limit = 25): Promise<InvoiceSummary[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("id,invoice_no,order_id,invoice_date,total,status")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("getRecentInvoices: Supabase error —", error.message);
      return [];
    }
    return (data ?? []).map((i) => ({
      id: i.id,
      invoiceNo: i.invoice_no,
      orderId: i.order_id,
      invoiceDate: i.invoice_date,
      total: Number(i.total),
      status: i.status,
    }));
  } catch (err) {
    console.error("getRecentInvoices: unexpected error —", err);
    return [];
  }
}

export async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  try {
    const supabase = createAdminClient();
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("id,invoice_no,order_id,invoice_date,status,subtotal,tax_total,cess_total,total")
      .eq("id", id)
      .maybeSingle();
    if (invErr || !inv) {
      if (invErr) console.error("getInvoice: header error —", invErr.message);
      return null;
    }

    const [linesRes, orderRes, jaypeeRes, falconRes, sellerRes] = await Promise.all([
      supabase
        .from("invoice_lines")
        .select("sku_id,hsn,qty,unit_price,tax_pct,tax_amount,cess_pct,cess_amount,line_total")
        .eq("invoice_id", id),
      inv.order_id
        ? supabase.from("orders").select("route").eq("id", inv.order_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("config").select("value").eq("key", "seller_jaypee").maybeSingle(),
      supabase.from("config").select("value").eq("key", "seller_falcon").maybeSingle(),
      supabase.from("config").select("value").eq("key", "seller").maybeSingle(), // legacy fallback
    ]);

    const lines = linesRes.data ?? [];
    const skuIds = Array.from(new Set(lines.map((l) => l.sku_id)));
    const { data: skus } = skuIds.length
      ? await supabase.from("skus").select("id,code,name,category").in("id", skuIds)
      : { data: [] as { id: string; code: string; name: string; category: string }[] };
    const skuById = new Map((skus ?? []).map((s) => [s.id, { code: s.code, name: s.name, category: s.category }]));

    // Dual entity: pick the seller by the products on the invoice (client 2026-07-01).
    const entity = invoiceSellerEntity(lines.map((l) => skuById.get(l.sku_id)?.category ?? "Other"));
    const sv = ((entity === "falcon" ? falconRes.data?.value : jaypeeRes.data?.value)
      ?? sellerRes.data?.value ?? {}) as Partial<Record<string, string>>;
    const seller: Seller = {
      name: sv.name ?? SELLER_FALLBACK.name,
      gstin: sv.gstin ?? SELLER_FALLBACK.gstin,
      address: sv.address ?? SELLER_FALLBACK.address,
      stateCode: sv.state_code ?? SELLER_FALLBACK.stateCode,
    };

    return {
      id: inv.id,
      invoiceNo: inv.invoice_no,
      invoiceDate: inv.invoice_date,
      status: inv.status,
      route: (orderRes.data as { route: string | null } | null)?.route ?? null,
      subtotal: Number(inv.subtotal),
      taxTotal: Number(inv.tax_total),
      cessTotal: Number(inv.cess_total),
      total: Number(inv.total),
      provisional: false,
      seller,
      lines: lines.map((l) => {
        const sku = skuById.get(l.sku_id) ?? { code: "—", name: "Unknown SKU" };
        return {
          code: sku.code,
          name: sku.name,
          hsn: l.hsn ?? null,
          qty: Number(l.qty),
          unitPrice: Number(l.unit_price),
          // taxable = inclusive line gross − tax − cess (the ex-tax value).
          taxable: Number(l.line_total) - Number(l.tax_amount) - Number(l.cess_amount),
          taxPct: Number(l.tax_pct),
          taxAmount: Number(l.tax_amount),
          cessPct: Number(l.cess_pct),
          cessAmount: Number(l.cess_amount),
          lineTotal: Number(l.line_total),
        };
      }),
    };
  } catch (err) {
    console.error("getInvoice: unexpected error —", err);
    return null;
  }
}
