import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  ClipboardList,
  Truck,
  ReceiptText,
  Store,
  Palette,
  type LucideIcon,
} from "lucide-react";

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
  { label: "UI Kit", href: "/kit", icon: Palette },
];
