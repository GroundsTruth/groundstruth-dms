import { getUsers } from "@/lib/users/data";
import { PageHeader } from "@/components/kit/page-header";
import { KpiCard } from "@/components/kit/kpi-card";
import { UsersClient } from "@/components/users/users-client";

// Staff list is read from Supabase per request.
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await getUsers();
  const active = users.filter((u) => u.isActive).length;
  const owners = users.filter((u) => u.role === "owner").length;

  return (
    <>
      <PageHeader
        title="Users & roles"
        subtitle="Staff who can sign in. Assign a role to control which screens each person sees (owner-only)."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Staff" value={String(users.length)} accent />
        <KpiCard label="Active" value={String(active)} />
        <KpiCard label="Owners" value={String(owners)} />
        <KpiCard label="Roles" value="3" />
      </div>

      <UsersClient users={users} />
    </>
  );
}
