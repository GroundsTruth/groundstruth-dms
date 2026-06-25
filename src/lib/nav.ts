import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  ReceiptText,
  Wallet,
  Palette,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Primary navigation. Some targets are placeholders until their module ships;
 * the active item highlights based on the current path.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Catalog", href: "/catalog", icon: Package },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Van Load", href: "/vans", icon: Truck },
  { label: "Invoices", href: "/invoices", icon: ReceiptText },
  { label: "Collections", href: "/collections", icon: Wallet },
  { label: "UI Kit", href: "/kit", icon: Palette },
];
