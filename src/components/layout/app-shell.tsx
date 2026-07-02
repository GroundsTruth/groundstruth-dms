"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Menu, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { navItemsForRole, type NavItem } from "@/lib/nav";
import { signOut } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/auth/rbac";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Minimal identity the shell needs — the server layout passes it (null when dormant). */
export type ShellUser = { name: string; role: AppRole } | null;

const ROLE_LABEL: Record<AppRole, string> = {
  owner: "Owner",
  warehouse: "Warehouse",
  driver_rep: "Driver / Rep",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-4">
      <BrandLogo box="h-8 w-8" />
      <div className="leading-tight">
        <p className="text-sm font-semibold">Campa DMS</p>
        <p className="text-[11px] text-muted-foreground">GroundsTruth</p>
      </div>
    </Link>
  );
}

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user?: ShellUser;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();
  const router = useRouter();

  // Role-filter the nav. Null user (auth dormant / not signed in) → show everything.
  const items = navItemsForRole(user?.role ?? null);

  const displayName = user?.name ?? "Demo user";
  const roleLine = user ? ROLE_LABEL[user.role] : "Auth off · demo";

  function handleSignOut() {
    startSignOut(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r bg-card lg:flex lg:flex-col">
        <Brand />
        <div className="mt-2 flex-1 overflow-y-auto pb-4">
          <NavLinks items={items} />
        </div>
        <div className="space-y-2 border-t px-5 py-3">
          {/* Dual branding (client 7/1): both distributor identities visible in-app. */}
          <div className="flex items-center gap-3">
            <BrandLogo entity="falcon" box="h-5 w-auto" rounded="" alt="Falcon Enterprises" />
            <BrandLogo entity="jaypee" box="h-5 w-auto" rounded="" alt="Jaypee" />
          </div>
          <p className="text-[11px] text-muted-foreground">Web app · phone &amp; laptop</p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur lg:px-6">
          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <div className="mt-2">
                <NavLinks items={items} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <span className="text-sm font-semibold lg:hidden">Campa DMS</span>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
                      {initials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  {displayName}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {roleLine}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleSignOut();
                  }}
                  disabled={signingOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
