import { AppShell } from "@/components/shell";
import { requireRole } from "@/lib/auth";
import { tick } from "@/lib/lifecycle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  await tick();
  return (
    <AppShell
      user={user}
      title="Platform"
      items={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/accounts", label: "Accounts" },
        { href: "/admin/campaigns", label: "Campaigns" },
        { href: "/admin/creatives", label: "Creatives" },
        { href: "/admin/pricing", label: "Pricing" },
        { href: "/admin/finance", label: "Finance" },
        { href: "/admin/audit", label: "Audit" },
      ]}
    >
      {children}
    </AppShell>
  );
}
