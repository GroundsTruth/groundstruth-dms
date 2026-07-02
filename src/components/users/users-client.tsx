"use client";

import { useState, useTransition } from "react";
import { Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import type { AppUser } from "@/lib/users/data";
import { updateUserRole, setUserActive } from "@/lib/users/actions";
import { ROLES, type AppRole } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/kit/status-badge";
import { EmptyState } from "@/components/kit/empty-state";
import { useConfirm } from "@/components/kit/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_LABEL: Record<AppRole, string> = {
  owner: "Owner",
  warehouse: "Warehouse",
  driver_rep: "Driver / Rep",
};

function RoleSelect({ user }: { user: AppUser }) {
  const [pending, start] = useTransition();
  function onChange(role: AppRole) {
    if (role === user.role) return;
    start(async () => {
      const res = await updateUserRole(user.id, role);
      if (!res.ok) toast.error("Couldn't change role", { description: res.error });
      else toast.success(`${user.name} is now ${ROLE_LABEL[role]}`);
    });
  }
  return (
    <select
      value={user.role}
      disabled={pending || !user.isActive}
      onChange={(e) => onChange(e.target.value as AppRole)}
      className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
      aria-label={`Role for ${user.name}`}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

function ActiveToggle({ user }: { user: AppUser }) {
  const [pending, start] = useTransition();
  const { confirm, dialog } = useConfirm();

  function toggle() {
    start(async () => {
      if (user.isActive) {
        const ok = await confirm({
          title: `Deactivate ${user.name}?`,
          description: "They won't be able to sign in until reactivated.",
          confirmLabel: "Deactivate",
          variant: "destructive",
        });
        if (!ok) return;
      }
      const res = await setUserActive(user.id, !user.isActive);
      if (!res.ok) toast.error("Couldn't update", { description: res.error });
      else toast.success(user.isActive ? "User deactivated" : "User reactivated");
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          user.isActive
            ? "text-muted-foreground hover:text-destructive"
            : "text-emerald-600 hover:text-emerald-700",
        )}
        onClick={toggle}
        disabled={pending}
        aria-label={user.isActive ? `Deactivate ${user.name}` : `Reactivate ${user.name}`}
      >
        {user.isActive ? <Ban className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
      </Button>
      {dialog}
    </>
  );
}

export function UsersClient({ users }: { users: AppUser[] }) {
  const [showInactive, setShowInactive] = useState(false);
  const inactiveCount = users.filter((u) => !u.isActive).length;
  const shown = users.filter((u) => showInactive || u.isActive);

  if (users.length === 0) {
    return (
      <EmptyState
        title="No staff yet"
        description="Users appear here after they sign in for the first time, or once the driver list is seeded. Roles can then be assigned."
      />
    );
  }

  return (
    <div className="space-y-4">
      {inactiveCount > 0 ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            className={cn(
              "text-xs font-medium underline-offset-2 hover:underline",
              showInactive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {showInactive ? "Hide inactive" : `Show inactive (${inactiveCount})`}
          </button>
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((u) => (
                <TableRow key={u.id} className={cn(!u.isActive && "opacity-60")}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {u.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <RoleSelect user={u} />
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <StatusBadge tone="ok">Active</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Inactive</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActiveToggle user={u} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
