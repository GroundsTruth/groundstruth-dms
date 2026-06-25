import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          GroundsTruth
        </p>
        <h1 className="mt-2 text-4xl font-bold text-primary">Campa DMS</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Warehouse → van load-out → field sale → invoice → stock deduction →
          collection → reconciliation.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Open dashboard
          </Link>
          <Link
            href="/kit"
            className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-secondary-foreground transition hover:opacity-90"
          >
            View UI kit
          </Link>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Local dev · localhost:3000</p>
    </main>
  );
}
