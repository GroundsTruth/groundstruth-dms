-- 20260701124019_recon_tiers.sql — Tiered reconciliation status (client 2026-07-01).
-- recon_status gains 'warn' + 'critical' (was ok/flagged). Cash: <0.1% ok · 0.1-0.3% warn ·
-- >0.3% critical. Stock: <0.2% · 0.2-0.6% · >0.6%. Thresholds live in reconcile-logic.ts.
-- Apply via SQL Editor before reconciling (else writing 'warn'/'critical' errors). Idempotent.

alter type recon_status add value if not exists 'warn';
alter type recon_status add value if not exists 'critical';
