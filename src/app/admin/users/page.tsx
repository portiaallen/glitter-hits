import { prisma } from "@/lib/db";
import { formatCredits } from "@/lib/utils";
import { UserSuspendControls } from "@/components/admin/UserSuspendControls";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="gh-glass overflow-x-auto p-4">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-[var(--text-muted)]">
          <tr>
            <th className="p-2">User</th>
            <th className="p-2">Role</th>
            <th className="p-2">Membership</th>
            <th className="p-2">Balance</th>
            <th className="p-2">Level</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-[var(--border-glass)]">
              <td className="p-2">
                <div>{u.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
              </td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">{u.membership}</td>
              <td className="p-2">{formatCredits(u.creditBalance)}</td>
              <td className="p-2">{u.levelSlug}</td>
              <td className="p-2">{u.isSuspended ? "suspended" : "active"}</td>
              <td className="p-2">
                <UserSuspendControls
                  userId={u.id}
                  isSuspended={u.isSuspended}
                  email={u.email}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
