# Brand assets

Drop the distributor logo here as **`logo.png`** (from the client's `PPT_1.pptx`).

- Path served at runtime: `/brand/logo.png`
- Used by `src/components/layout/brand-logo.tsx` in the **app shell** + the **printable invoice header**.
- Until the file exists, the UI falls back to the "C" wordmark automatically — nothing breaks.
- Prefer a square-ish, transparent PNG (renders at 32px in the shell, 48px on invoices). SVG also fine
  if you rename the `<img src>` accordingly.

_This is the dual-branding asset from client Round-3 ("distributor logo (PPT_1) + entity name on app & invoices")._
