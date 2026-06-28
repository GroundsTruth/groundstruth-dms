"use client";

import { useState, type ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { StatusBadge } from "@/components/kit/status-badge";
import { QtyStepper } from "@/components/kit/qty-stepper";
import { EmptyState } from "@/components/kit/empty-state";
import { ErrorState } from "@/components/kit/error-state";
import { LoadingState, Spinner } from "@/components/kit/loading-state";
import { FormField, FormActions } from "@/components/kit/form-field";
import { useConfirm } from "@/components/kit/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

const SAMPLE = [
  { sku: "SKU006", name: "CSD Cola — 200 ML", rate: "₹240", stock: 420, tone: "ok" as const, label: "In stock" },
  { sku: "SKU019", name: "Campa Cola — 2.25 L", rate: "₹677", stock: 64, tone: "warn" as const, label: "Low" },
  { sku: "SKU051", name: "Water — 750 ML", rate: "₹155", stock: 0, tone: "bad" as const, label: "Out" },
];

export default function KitPage() {
  const [qty, setQty] = useState(12);
  const [rate, setRate] = useState("");
  const rateError =
    rate !== "" && !/^\d+$/.test(rate)
      ? "Enter a whole number (₹ per case)."
      : undefined;
  const { confirm, dialog } = useConfirm();

  return (
    <>
      <PageHeader
        title="UI Kit"
        subtitle="The shared design language — Campa tokens, field-ready components."
        actions={
          <Button onClick={() => toast.success("Saved", { description: "Toast from the kit." })}>
            Test toast
          </Button>
        }
      />

      <div className="space-y-8">
        <Section title="KPI cards · executive">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Sales today" value="₹5,67,187" accent />
            <KpiCard label="Units sold" value="1,826" />
            <KpiCard label="Pending cash" value="₹77,000" sub={<StatusBadge tone="warn">Follow up</StatusBadge>} />
            <KpiCard label="Low stock" value="3 SKUs" sub={<StatusBadge tone="bad">Reorder</StatusBadge>} />
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Alert action</Button>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Add SKU
            </Button>
          </div>
        </Section>

        <Section title="Status · colour always carries a word">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone="ok">In stock</StatusBadge>
            <StatusBadge tone="warn">Low stock</StatusBadge>
            <StatusBadge tone="bad">Out / flagged</StatusBadge>
            <StatusBadge tone="neutral">Draft</StatusBadge>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Section>

        <Section title="Quantity stepper · driver, no keyboard">
          <div className="flex flex-wrap items-center gap-4">
            <QtyStepper value={qty} onChange={setQty} />
            <span className="text-sm text-muted-foreground">
              Selected:{" "}
              <span className="font-semibold text-foreground">{qty}</span> cases
            </span>
          </div>
        </Section>

        <Section title="Input">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search SKUs, routes…" className="pl-9" />
          </div>
        </Section>

        <Section title="Data table · warehouse">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Rate/case</TableHead>
                      <TableHead className="text-right">On hand</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE.map((r) => (
                      <TableRow key={r.sku}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {r.sku}
                        </TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.rate}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.stock}</TableCell>
                        <TableCell>
                          <StatusBadge tone={r.tone}>{r.label}</StatusBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="cola">Cola</TabsTrigger>
              <TabsTrigger value="water">Water</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="pt-3 text-sm text-muted-foreground">
              All 52 SKUs from the Jaypee master list.
            </TabsContent>
            <TabsContent value="cola" className="pt-3 text-sm text-muted-foreground">
              Cola variants (200 ml → 2.25 L).
            </TabsContent>
            <TabsContent value="water" className="pt-3 text-sm text-muted-foreground">
              Water SKUs.
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Empty state">
          <EmptyState
            title="No SKUs match your search"
            description="Try a different name, or clear the filters to see all products."
            action={
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Add SKU
              </Button>
            }
          />
        </Section>

        <Section title="Loading states">
          <div className="grid gap-4 md:grid-cols-2">
            <LoadingState label="Loading SKUs…" rows={3} />
            <Card>
              <CardContent className="flex h-full items-center gap-2 p-4 text-sm text-muted-foreground">
                <Spinner /> Saving order…
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Error & offline · always retryable">
          <div className="grid gap-4 md:grid-cols-2">
            <ErrorState onRetry={() => toast("Retrying…")} />
            <ErrorState variant="offline" onRetry={() => toast("Reconnecting…")} />
          </div>
        </Section>

        <Section title="Form field · label, hint, required, live error">
          <form
            className="max-w-sm space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Saved", { description: "SKU form submitted." });
            }}
          >
            <FormField label="SKU name" required hint="As it appears on the invoice.">
              {(p) => <Input {...p} placeholder="CSD Cola — 200 ML" />}
            </FormField>
            <FormField label="Rate per case (₹)" required error={rateError}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="numeric"
                  placeholder="240"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              )}
            </FormField>
            <FormActions>
              <Button type="button" variant="ghost" onClick={() => setRate("")}>
                Reset
              </Button>
              <Button type="submit">Save SKU</Button>
            </FormActions>
          </form>
        </Section>

        <Section title="Confirm dialog · every destructive action">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="destructive"
              onClick={async () => {
                const ok = await confirm({
                  title: "Deactivate this SKU?",
                  description:
                    "It will be hidden from the active catalog. You can reactivate it anytime.",
                  confirmLabel: "Deactivate",
                  variant: "destructive",
                });
                if (ok) toast.success("Confirmed");
                else toast("Cancelled");
              }}
            >
              Deactivate SKU
            </Button>
            <span className="text-sm text-muted-foreground">
              <code className="text-xs">useConfirm()</code> → awaitable boolean. Reuse for every
              destructive action — never a bare <code className="text-xs">window.confirm()</code>.
            </span>
          </div>
        </Section>
      </div>
      {dialog}
    </>
  );
}
