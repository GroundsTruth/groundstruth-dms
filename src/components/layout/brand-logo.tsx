"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Distributor brand mark (dual-branding, client 7/1: "header must prominently feature
 * our distributor logo and legal entity name (Falcon/Jaypee) as the primary seller").
 * Both entity logos ship in `/public/brand/` (extracted from the client's PPT_1):
 * pass `entity` to pick one — Falcon on Falcon invoices, Jaypee on Jaypee's. Without
 * an entity it tries the generic `/brand/logo.png`, falling back to the "C" mark.
 * Entity logos are wide wordmarks — size with `box="h-10 w-auto"` style values.
 */
export function BrandLogo({
  entity,
  box = "h-8 w-8",
  rounded = "rounded-lg",
  alt = "Campa",
  className,
}: {
  entity?: "falcon" | "jaypee" | null;
  box?: string;
  rounded?: string;
  alt?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center bg-primary font-bold text-primary-foreground",
          box,
          rounded,
          className,
        )}
      >
        C
      </span>
    );
  }

  const src = entity ? `/brand/${entity}.png` : "/brand/logo.png";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand asset, no layout shift
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-contain", box, rounded, className)}
    />
  );
}
