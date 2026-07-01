"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  MapPin,
  Check,
  Store,
  ShoppingCart,
  ReceiptText,
  CircleAlert,
} from "lucide-react";

import { captureSale, type CaptureInput } from "@/lib/sales/capture";
import { ROUTES, type OrderableSku } from "@/lib/sales/orders-data";
import type { Retailer } from "@/lib/retailers/data";
import { FormField } from "@/components/kit/form-field";
import { QtyStepper } from "@/components/kit/qty-stepper";
import { StatusBadge } from "@/components/kit/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Line = { key: number; skuId: string; qty: number; rate: string };
type PayMode = "cash" | "upi" | "credit";
type Stage = "edit" | "preview";

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const selectCls = cn(
  "flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

/** Thumb-friendly segmented choice (Onfleet-style — no dropdown for 2-3 options). */
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-10 rounded-md text-sm font-medium transition",
            value === o.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Section({
  step,
  title,
  icon: Icon,
  children,
}: {
  step: number;
  title: string;
  icon: typeof Store;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {step}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CaptureClient({
  skus,
  retailers,
}: {
  skus: OrderableSku[];
  retailers: Retailer[];
}) {
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState<Stage>("edit");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<
    | { kind: "invoiced"; invoiceId: string }
    | { kind: "pending"; orderId: string }
    | null
  >(null);

  // Step 1 — route + list type
  const [route, setRoute] = useState("");
  const [listType, setListType] = useState<"retail" | "wholesale">("retail");

  // Step 2 — shop
  const [shopMode, setShopMode] = useState<"existing" | "new">(
    retailers.length > 0 ? "existing" : "new",
  );
  const [retailerId, setRetailerId] = useState("");
  const [shopQuery, setShopQuery] = useState("");
  const [nName, setNName] = useState("");
  const [nOwner, setNOwner] = useState("");
  const [nPhone, setNPhone] = useState("");
  const [nGstin, setNGstin] = useState("");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  // Step 3 — items
  const [lines, setLines] = useState<Line[]>([{ key: 1, skuId: "", qty: 1, rate: "" }]);

  // Step 4 — payment
  const [payMode, setPayMode] = useState<PayMode>("cash");
  const [payRef, setPayRef] = useState("");
  const [payAmount, setPayAmount] = useState("");

  const priceById = useMemo(() => new Map(skus.map((s) => [s.id, s.basePrice])), [skus]);

  const shopMatches = useMemo(() => {
    const q = shopQuery.trim().toLowerCase();
    const list = !q
      ? retailers
      : retailers.filter((r) =>
          [r.name, r.shopName, r.phone].some((v) => v?.toLowerCase().includes(q)),
        );
    return list.slice(0, 50);
  }, [retailers, shopQuery]);

  const selectedShop = retailers.find((r) => r.id === retailerId) ?? null;

  function chargedOf(l: Line): number | null {
    const list = priceById.get(l.skuId) ?? null;
    return l.rate !== "" ? Number(l.rate) : list;
  }
  function belowList(l: Line): boolean {
    const list = priceById.get(l.skuId);
    return l.rate !== "" && list != null && Number(l.rate) < list;
  }
  function lineTotal(l: Line): number | null {
    const c = chargedOf(l);
    return c == null || !l.qty ? null : c * l.qty;
  }
  const validLines = lines.filter((l) => l.skuId && l.qty > 0 && chargedOf(l) != null);
  const subtotal = validLines.reduce((a, l) => a + (lineTotal(l) ?? 0), 0);
  const anyBelowList = lines.some(belowList);

  function setLine(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { key: Math.max(0, ...ls.map((l) => l.key)) + 1, skuId: "", qty: 1, rate: "" }]);
  }
  function removeLine(key: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((l) => l.key !== key)));
  }

  function captureGps() {
    setGeoMsg("Locating…");
    if (!("geolocation" in navigator)) {
      setGeoMsg("Location not available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoMsg("Location captured ✓");
      },
      () => setGeoMsg("Couldn't get location — allow location access and retry."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // ── validation to enter preview ──
  const shopReady = shopMode === "existing" ? retailerId !== "" : nName.trim() !== "";
  const canReview = shopReady && validLines.length > 0 && !pending;

  const shopLabel = shopMode === "existing"
    ? selectedShop?.shopName || selectedShop?.name || "—"
    : nName.trim() || "New shop";
  const effectiveAmount = payMode === "credit" ? 0 : payAmount !== "" ? Number(payAmount) : subtotal;

  function buildInput(): CaptureInput {
    const captureLines = validLines.map((l) => ({
      skuId: l.skuId,
      qty: l.qty,
      chargedPrice: l.rate !== "" ? Number(l.rate) : null,
    }));
    const base: CaptureInput = {
      route: route || null,
      listType,
      lines: captureLines,
      payment:
        payMode === "credit" || effectiveAmount <= 0
          ? null
          : { mode: payMode, amount: effectiveAmount, reference: payRef || null },
    };
    if (shopMode === "existing") return { ...base, retailerId };
    return {
      ...base,
      newRetailer: {
        name: nName.trim(),
        ownerName: nOwner.trim() || null,
        phone: nPhone.trim() || null,
        gstin: nGstin.trim() || null,
        route: route || null,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        customerType: "cash", // field-onboarded shops are cash-only (credit needs admin sign-off)
        customerCategory: listType,
      },
    };
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await captureSale(buildInput());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.stage === "invoiced") setDone({ kind: "invoiced", invoiceId: res.invoiceId });
      else setDone({ kind: "pending", orderId: res.orderId });
    });
  }

  function resetAll() {
    setStage("edit");
    setDone(null);
    setError(null);
    setRetailerId("");
    setShopQuery("");
    setNName(""); setNOwner(""); setNPhone(""); setNGstin("");
    setGeo(null); setGeoMsg(null);
    setLines([{ key: 1, skuId: "", qty: 1, rate: "" }]);
    setPayMode("cash"); setPayRef(""); setPayAmount("");
  }

  // ── success / pending screen ──
  if (done) {
    const invoiced = done.kind === "invoiced";
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <div className={cn(
          "mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full",
          invoiced ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
        )}>
          {invoiced ? <Check className="h-6 w-6" /> : <CircleAlert className="h-6 w-6" />}
        </div>
        <h2 className="text-lg font-semibold">
          {invoiced ? "Sale invoiced" : "Sent for approval"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {invoiced
            ? `${shopLabel} · ${inr(subtotal)} captured.`
            : "A price was below list — an admin must approve before it invoices."}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {invoiced ? (
            <Button asChild>
              <Link href={`/invoices/${done.invoiceId}`}>
                <ReceiptText className="mr-1.5 h-4 w-4" /> View invoice
              </Link>
            </Button>
          ) : null}
          <Button variant={invoiced ? "outline" : "default"} onClick={resetAll}>
            <Plus className="mr-1.5 h-4 w-4" /> New sale
          </Button>
        </div>
      </div>
    );
  }

  // ── preview ──
  if (stage === "preview") {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Review &amp; confirm</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Shop</dt>
              <dd className="text-right font-medium">{shopLabel}{shopMode === "new" ? " (new)" : ""}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Route · list</dt>
              <dd className="text-right">{route || "—"} · {listType}</dd>
            </div>
          </dl>

          <div className="mt-3 divide-y divide-border border-y border-border">
            {validLines.map((l) => {
              const s = skus.find((x) => x.id === l.skuId);
              return (
                <div key={l.key} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{s?.code} — {s?.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {l.qty} × {inr(chargedOf(l) ?? 0)}{belowList(l) ? " ⚠" : ""}
                  </span>
                  <span className="w-20 shrink-0 text-right font-medium tabular-nums">{inr(lineTotal(l) ?? 0)}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total (GST-incl.)</span>
            <span className="text-lg font-bold tabular-nums">{inr(subtotal)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span className="font-medium">
              {payMode === "credit" ? "On credit (pay later)" : `${payMode.toUpperCase()} · ${inr(effectiveAmount)}`}
            </span>
          </div>
          {anyBelowList ? (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              ⚠ A line is below list price — this will need admin approval before it invoices.
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-12" onClick={() => setStage("edit")} disabled={pending}>
            Edit
          </Button>
          <Button className="flex-1 h-12" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : anyBelowList ? "Send for approval" : "Confirm & invoice"}
          </Button>
        </div>
      </div>
    );
  }

  // ── edit ──
  return (
    <div className="mx-auto max-w-md space-y-4">
      <Section step={1} title="Route" icon={ShoppingCart}>
        <div className="space-y-3">
          <FormField label="Route">
            {(p) => (
              <select {...p} value={route} onChange={(e) => setRoute(e.target.value)} className={selectCls}>
                <option value="">Select route…</option>
                {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </FormField>
          <FormField label="Price list">
            {() => (
              <Segmented
                value={listType}
                onChange={setListType}
                options={[{ value: "retail", label: "Retail" }, { value: "wholesale", label: "Wholesale" }]}
              />
            )}
          </FormField>
        </div>
      </Section>

      <Section step={2} title="Shop" icon={Store}>
        <Segmented
          value={shopMode}
          onChange={setShopMode}
          options={[{ value: "existing", label: "Existing shop" }, { value: "new", label: "New shop" }]}
        />
        {shopMode === "existing" ? (
          <div className="mt-3 space-y-2">
            <Input
              value={shopQuery}
              onChange={(e) => setShopQuery(e.target.value)}
              placeholder="Search shop by name or phone…"
              className="h-11"
            />
            <select
              aria-label="Shop"
              value={retailerId}
              onChange={(e) => setRetailerId(e.target.value)}
              className={selectCls}
            >
              <option value="">Select shop…</option>
              {shopMatches.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.shopName || r.name}{r.phone ? ` · ${r.phone}` : ""}
                  {r.customerType === "credit" ? " · credit" : ""}
                </option>
              ))}
            </select>
            {retailers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No shops yet — switch to “New shop”.</p>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <FormField label="Shop name" required>
              {(p) => <Input {...p} value={nName} onChange={(e) => setNName(e.target.value)} placeholder="e.g. Sharma Stores" className="h-11" />}
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Owner name">
                {(p) => <Input {...p} value={nOwner} onChange={(e) => setNOwner(e.target.value)} className="h-11" />}
              </FormField>
              <FormField label="Owner phone">
                {(p) => <Input {...p} inputMode="numeric" value={nPhone} onChange={(e) => setNPhone(e.target.value)} className="h-11" />}
              </FormField>
            </div>
            <FormField label="GSTIN" hint="optional">
              {(p) => <Input {...p} value={nGstin} onChange={(e) => setNGstin(e.target.value)} placeholder="optional" className="h-11" />}
            </FormField>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={captureGps} className="h-11">
                <MapPin className="mr-1.5 h-4 w-4" /> {geo ? "Re-capture GPS" : "Capture GPS"}
              </Button>
              {geoMsg ? <span className="text-xs text-muted-foreground">{geoMsg}</span> : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Field shops are cash-only. Credit accounts are set up by an admin in Retailers.
            </p>
          </div>
        )}
      </Section>

      <Section step={3} title="Items" icon={ShoppingCart}>
        <div className="space-y-3">
          {lines.map((l) => {
            const price = priceById.get(l.skuId);
            const unpriced = l.skuId !== "" && price == null;
            return (
              <div key={l.key} className="rounded-lg border border-border p-3">
                <div className="flex items-start gap-2">
                  <select
                    aria-label="SKU"
                    value={l.skuId}
                    onChange={(e) => setLine(l.key, { skuId: e.target.value })}
                    className={cn(selectCls, "flex-1")}
                  >
                    <option value="">Select item…</option>
                    {skus.map((s) => (
                      <option key={s.id} value={s.id} disabled={s.basePrice == null}>
                        {s.code} — {s.name}{s.basePrice == null ? " (no price)" : ` · ${inr(s.basePrice)}`}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLine(l.key)}
                    aria-label="Remove item"
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {unpriced ? (
                  <p className="mt-2 text-xs font-medium text-destructive">No price set — can&apos;t sell this yet.</p>
                ) : (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <QtyStepper value={l.qty} min={1} onChange={(q) => setLine(l.key, { qty: q })} />
                    <div className="w-28">
                      <Input
                        aria-label="Rate"
                        inputMode="decimal"
                        value={l.rate}
                        onChange={(e) => setLine(l.key, { rate: e.target.value })}
                        placeholder={price != null ? inr(price) : "Rate"}
                        className="h-11 text-right"
                      />
                      {belowList(l) ? (
                        <p className="mt-1 text-right text-[11px] font-medium text-amber-600">below list</p>
                      ) : null}
                    </div>
                    <div className="w-20 text-right text-sm font-semibold tabular-nums">
                      {lineTotal(l) != null ? inr(lineTotal(l)!) : "—"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Subtotal (GST-incl.)</span>
          <span className="text-lg font-bold tabular-nums">{inr(subtotal)}</span>
        </div>
      </Section>

      <Section step={4} title="Payment" icon={ReceiptText}>
        <Segmented
          value={payMode}
          onChange={setPayMode}
          options={[
            { value: "cash", label: "Cash" },
            { value: "upi", label: "UPI" },
            { value: "credit", label: "Credit" },
          ]}
        />
        {payMode !== "credit" ? (
          <div className="mt-3 space-y-3">
            <FormField label="Amount collected" hint={`default ${inr(subtotal)}`}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="decimal"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={String(subtotal)}
                  className="h-11"
                />
              )}
            </FormField>
            {payMode === "upi" ? (
              <FormField label="UPI reference" hint="optional">
                {(p) => <Input {...p} value={payRef} onChange={(e) => setPayRef(e.target.value)} className="h-11" />}
              </FormField>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Billed to the shop&apos;s credit ledger — no payment captured now.
          </p>
        )}
      </Section>

      {!shopReady ? (
        <p className="text-center text-xs text-muted-foreground">Pick or add a shop to continue.</p>
      ) : null}
      <Button className="h-12 w-full text-base" disabled={!canReview} onClick={() => { setError(null); setStage("preview"); }}>
        Review order
        {validLines.length > 0 ? <StatusBadge tone="neutral" className="ml-2">{inr(subtotal)}</StatusBadge> : null}
      </Button>
    </div>
  );
}
