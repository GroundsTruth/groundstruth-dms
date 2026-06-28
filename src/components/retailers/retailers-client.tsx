"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Pencil, X } from "lucide-react";
import {
  createRetailer,
  updateRetailer,
  setRetailerApproval,
  setRetailerActive,
} from "@/lib/retailers/actions";
import type { Retailer } from "@/lib/retailers/data";
import { ROUTES } from "@/lib/sales/orders-data";
import { FormField, FormActions } from "@/components/kit/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/kit/status-badge";
import { EmptyState } from "@/components/kit/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

const selectCls = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

type Draft = {
  name: string;
  shopName: string;
  phone: string;
  gstin: string;
  route: string;
  address: string;
};

const EMPTY: Draft = { name: "", shopName: "", phone: "", gstin: "", route: "", address: "" };

export function RetailersClient({ retailers }: { retailers: Retailer[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setEditId(null);
    setDraft(EMPTY);
    setError(null);
    setOpen(true);
  }
  function startEdit(r: Retailer) {
    setEditId(r.id);
    setDraft({
      name: r.name,
      shopName: r.shopName ?? "",
      phone: r.phone ?? "",
      gstin: r.gstin ?? "",
      route: r.route ?? "",
      address: r.address ?? "",
    });
    setError(null);
    setOpen(true);
  }
  function close() {
    setOpen(false);
    setEditId(null);
    setDraft(EMPTY);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      name: draft.name,
      shopName: draft.shopName || null,
      phone: draft.phone || null,
      gstin: draft.gstin || null,
      route: draft.route || null,
      address: draft.address || null,
    };
    startTransition(async () => {
      const res = editId
        ? await updateRetailer(editId, input)
        : await createRetailer(input);
      if (res.ok) {
        close();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function approve(id: string, approved: boolean) {
    startTransition(async () => {
      await setRetailerApproval(id, approved);
      router.refresh();
    });
  }
  function toggleActive(id: string, active: boolean) {
    startTransition(async () => {
      await setRetailerActive(id, active);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        {!open ? (
          <Button onClick={startAdd}>
            <Plus className="h-4 w-4" /> Add retailer
          </Button>
        ) : null}
      </div>

      {open ? (
        <form onSubmit={save} className="mb-6 rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold">{editId ? "Edit retailer" : "Onboard retailer"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" required>
              {(p) => <Input {...p} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />}
            </FormField>
            <FormField label="Shop name">
              {(p) => <Input {...p} value={draft.shopName} onChange={(e) => setDraft({ ...draft, shopName: e.target.value })} />}
            </FormField>
            <FormField label="Phone">
              {(p) => <Input {...p} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="10-digit" />}
            </FormField>
            <FormField label="GSTIN" hint="Optional — 15 characters">
              {(p) => <Input {...p} value={draft.gstin} onChange={(e) => setDraft({ ...draft, gstin: e.target.value })} />}
            </FormField>
            <FormField label="Route / beat">
              {(p) => (
                <select {...p} value={draft.route} onChange={(e) => setDraft({ ...draft, route: e.target.value })} className={selectCls}>
                  <option value="">No route</option>
                  {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
            </FormField>
            <FormField label="Address">
              {(p) => <Input {...p} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />}
            </FormField>
          </div>
          {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
          <FormActions>
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : editId ? "Save" : "Onboard"}</Button>
          </FormActions>
        </form>
      ) : null}

      {retailers.length === 0 ? (
        <EmptyState icon={Store} title="No retailers yet" description="Onboard your first retailer with the button above." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {retailers.map((r) => (
                <TableRow key={r.id} className={r.isActive ? "" : "opacity-50"}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    {r.shopName ? <div className="text-xs text-muted-foreground">{r.shopName}</div> : null}
                  </TableCell>
                  <TableCell>{r.route ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.phone ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.gstin ?? "—"}</TableCell>
                  <TableCell>
                    {!r.isActive ? (
                      <StatusBadge tone="neutral">Inactive</StatusBadge>
                    ) : r.approvalStatus === "approved" ? (
                      <StatusBadge tone="ok">Approved</StatusBadge>
                    ) : (
                      <StatusBadge tone="warn">Pending</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {r.isActive && r.approvalStatus !== "approved" ? (
                        <Button size="sm" variant="outline" onClick={() => approve(r.id, true)} disabled={pending}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                      ) : null}
                      <Button size="icon" variant="ghost" onClick={() => startEdit(r)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleActive(r.id, !r.isActive)}
                        aria-label={r.isActive ? "Deactivate" : "Reactivate"}
                        disabled={pending}
                      >
                        {r.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
