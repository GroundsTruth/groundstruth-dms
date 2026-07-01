import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  ClipboardList,
  Truck,
  ReceiptText,
  Store,
  Gift,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { canAccess, type AppRole } from "@/lib/auth/rbac";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Primary navigation — one entry per shipped module, ordered along the flow:
 * catalog → inventory → orders → vans → invoices → retailers. The active item
 * highlights on the current path. (Collections is recorded on an invoice's Payments
 * panel — reached via Invoices — so it has no separate top-level entry.)
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Capture sale", href: "/capture", icon: ShoppingCart },
  { label: "Catalog", href: "/catalog", icon: Package },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Orders", href: "/orders", icon: ClipboardList },
  { label: "Van Load", href: "/vans", icon: Truck },
  { label: "Invoices", href: "/invoices", icon: ReceiptText },
  { label: "Retailers", href: "/retailers", icon: Store },
  { label: "Schemes", href: "/schemes", icon: Gift },
  { label: "UI Kit", href: "/kit", icon: Palette },
];

/**
 * Nav items this role may see. Mirrors `canAccess` (rbac.ts) exactly — unlisted routes
 * (e.g. `/capture`, `/schemes`, `/kit`) are visible to any signed-in user. When `role`
 * is null (auth dormant, or not signed in) we show everything so the app stays usable
 * before the login lockdown is flipped on. Middleware is the real gate; this only hides
 * links the user couldn't open anyway.
 */
export function navItemsForRole(role: AppRole | null): NavItem[] {
  if (!role) return NAV_ITEMS;
  return NAV_ITEMS.filter((item) => canAccess(role, item.href));
}
