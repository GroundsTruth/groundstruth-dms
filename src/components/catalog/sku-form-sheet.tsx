"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { Sku, SkuInput } from "@/lib/catalog/types";
import { createSku, updateSku } from "@/lib/catalog/actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormActions } from "@/components/kit/form-field";
import { Spinner } from "@/components/kit/loading-state";

const CATEGORIES = [
  "Cola", "Lemon", "Orange", "Soda", "Energy", "Juice", "Water", "Other",
];

/**
 * Add / edit SKU form in a slide-over Sheet. `editSku=null` → add mode (code is
 * auto-assigned server-side); a Sku → edit mode (code shown, not editable).
 * Persists via the catalog server actions; revalidatePath refreshes the table.
 */
export function SkuFormSheet({
  open,
  editSku,
  onOpenChange,
}: {
  open: boolean;
  editSku: Sku | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cola");
  const [packMl, setPackMl] = useState("");
  const [packLabel, setPackLabel] = useState("");
  const [rate, setRate] = useState("");
  // Commercial / tax (optional — from the client / CA).
  const [hsn, setHsn] = useState("");
  const [gst, setGst] = useState("");
  const [cess, setCess] = useState("");
  const [mrp, setMrp] = useState("");
  const [unitsPerCase, setUnitsPerCase] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Prefill when the sheet opens (or the target SKU changes).
  useEffect(() => {
    if (!open) return;
    setTouched(false);
    const numOrEmpty = (n: number | null | undefined) => (n != null ? String(n) : "");
    if (editSku) {
      setName(editSku.name);
      setCategory(editSku.category);
      setPackMl(numOrEmpty(editSku.packMl));
      setPackLabel(editSku.packLabel);
      setRate(numOrEmpty(editSku.ratePerCase));
      setHsn(editSku.hsn ?? "");
      setGst(numOrEmpty(editSku.taxSlabPct));
      setCess(numOrEmpty(editSku.cessPct));
      setMrp(numOrEmpty(editSku.mrp));
      setUnitsPerCase(numOrEmpty(editSku.unitsPerCase));
    } else {
      setName("");
      setCategory("Cola");
      setPackMl("");
      setPackLabel("");
      setRate("");
      setHsn("");
      setGst("");
      setCess("");
      setMrp("");
      setUnitsPerCase("");
    }
  }, [open, editSku]);

  const nameError = touched && !name.trim() ? "Product name is required." : undefined;
  const packLabelError = touched && !packLabel.trim() ? "Pack label is required." : undefined;
  const packMlError = packMl !== "" && !/^\d+$/.test(packMl) ? "Whole number only." : undefined;
  const rateError =
    rate !== "" && !/^\d+(\.\d{1,2})?$/.test(rate) ? "Number only (max 2 decimals)." : undefined;
  const money = /^\d+(\.\d{1,2})?$/;
  const hsnError = hsn !== "" && !/^\d{4,8}$/.test(hsn) ? "4–8 digits." : undefined;
  const gstError =
    gst !== "" && (!money.test(gst) || parseFloat(gst) > 100) ? "0–100 (max 2 dp)." : undefined;
  const cessError =
    cess !== "" && (!money.test(cess) || parseFloat(cess) > 100) ? "0–100 (max 2 dp)." : undefined;
  // Cess only makes sense alongside a GST slab — mirror the server-side guard.
  const cessNeedsGst = cess !== "" && gst === "" ? "Set GST % first." : undefined;
  const mrpError = mrp !== "" && !money.test(mrp) ? "Number only (max 2 decimals)." : undefined;
  const unitsPerCaseError =
    unitsPerCase !== "" && !/^\d+$/.test(unitsPerCase) ? "Whole number only." : undefined;
  const blocked =
    packMlError != null ||
    rateError != null ||
    hsnError != null ||
    gstError != null ||
    cessError != null ||
    cessNeedsGst != null ||
    mrpError != null ||
    unitsPerCaseError != null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!name.trim() || !packLabel.trim() || blocked) return;

    const input: SkuInput = {
      name,
      category: category as Sku["category"],
      packMl: packMl === "" ? null : parseInt(packMl, 10),
      packLabel,
      ratePerCase: rate === "" ? null : parseFloat(rate),
      hsn: hsn.trim() === "" ? null : hsn.trim(),
      taxSlabPct: gst === "" ? null : parseFloat(gst),
      cessPct: cess === "" ? null : parseFloat(cess),
      mrp: mrp === "" ? null : parseFloat(mrp),
      unitsPerCase: unitsPerCase === "" ? null : parseInt(unitsPerCase, 10),
    };

    setSubmitting(true);
    if (editSku) {
      const res = await updateSku(editSku.code, input);
      setSubmitting(false);
      if (!res.ok) return toast.error("Couldn't save", { description: res.error });
      toast.success("SKU updated");
    } else {
      const res = await createSku(input);
      setSubmitting(false);
      if (!res.ok) return toast.error("Couldn't save", { description: res.error });
      toast.success("SKU added", { description: `Code ${res.code}` });
    }
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editSku ? "Edit SKU" : "Add SKU"}</SheetTitle>
          <SheetDescription>
            {editSku ? (
              <>
                Editing <span className="font-mono">{editSku.code}</span>.
              </>
            ) : (
              "New product for the catalog — the code is assigned automatically."
            )}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto">
          <FormField label="Product name" required error={nameError} hint="As it appears on the invoice.">
            {(p) => (
              <Input
                {...p}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="CSD Cola — 200 ML"
              />
            )}
          </FormField>

          <FormField label="Category" required>
            {(p) => (
              <select
                {...p}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Pack label" required error={packLabelError}>
              {(p) => (
                <Input
                  {...p}
                  value={packLabel}
                  onChange={(e) => setPackLabel(e.target.value)}
                  placeholder="200 ML"
                />
              )}
            </FormField>
            <FormField label="Size (ml)" error={packMlError} hint="optional">
              {(p) => (
                <Input
                  {...p}
                  inputMode="numeric"
                  value={packMl}
                  onChange={(e) => setPackMl(e.target.value)}
                  placeholder="200"
                />
              )}
            </FormField>
          </div>

          <FormField
            label="Rate per case (₹)"
            error={rateError}
            hint="Leave blank if the client hasn't confirmed."
          >
            {(p) => (
              <Input
                {...p}
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="240"
              />
            )}
          </FormField>

          {/* Tax & commercial — arrives from the client / CA, often after launch. */}
          <div
            role="group"
            aria-labelledby="sku-tax-heading"
            className="space-y-4 rounded-md border border-dashed border-border bg-muted/30 p-3"
          >
            <div>
              <p id="sku-tax-heading" className="text-sm font-medium">
                Tax &amp; commercial
              </p>
              <p className="text-xs text-muted-foreground">
                Pre-filled from GST research (provisional) — edit per the CA&apos;s
                confirmation. Water is also corroborated by the sample invoice.
              </p>
            </div>

            <FormField label="HSN / SAC" error={hsnError} hint="4–8 digit code">
              {(p) => (
                <Input
                  {...p}
                  inputMode="numeric"
                  value={hsn}
                  onChange={(e) => setHsn(e.target.value)}
                  placeholder="22011010"
                />
              )}
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="GST %" error={gstError} hint="total, e.g. 5 / 18 / 28">
                {(p) => (
                  <Input
                    {...p}
                    inputMode="decimal"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    placeholder="5"
                  />
                )}
              </FormField>
              <FormField label="Cess %" error={cessError ?? cessNeedsGst} hint="0 for most">
                {(p) => (
                  <Input
                    {...p}
                    inputMode="decimal"
                    value={cess}
                    onChange={(e) => setCess(e.target.value)}
                    placeholder="0"
                  />
                )}
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="MRP (₹)" error={mrpError} hint="optional">
                {(p) => (
                  <Input
                    {...p}
                    inputMode="decimal"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="20"
                  />
                )}
              </FormField>
              <FormField label="Units / case" error={unitsPerCaseError} hint="pieces per case">
                {(p) => (
                  <Input
                    {...p}
                    inputMode="numeric"
                    value={unitsPerCase}
                    onChange={(e) => setUnitsPerCase(e.target.value)}
                    placeholder="24"
                  />
                )}
              </FormField>
            </div>
          </div>

          <FormActions className="mt-auto border-t pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || blocked}>
              {submitting ? (
                <>
                  <Spinner className="mr-1.5 text-primary-foreground" /> Saving…
                </>
              ) : editSku ? (
                "Save changes"
              ) : (
                "Add SKU"
              )}
            </Button>
          </FormActions>
        </form>
      </SheetContent>
    </Sheet>
  );
}
