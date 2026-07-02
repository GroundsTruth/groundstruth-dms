"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Distributor brand mark (dual-branding, client Round-3). Renders the client's logo from
 * `/public/brand/logo.png` once that asset is dropped in; until then it falls back to the
 * "C" wordmark so nothing looks broken. Used in the app shell + the printable invoice header.
 * `box` sizes the square (fallback + image), `alt` names the distributor.
 */
export function BrandLogo({
  box = "h-8 w-8",
  rounded = "rounded-lg",
  alt = "Campa",
  className,
}: {
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

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand asset, no layout shift
    <img
      src="/brand/logo.png"
      alt={alt}
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-contain", box, rounded, className)}
    />
  );
}
