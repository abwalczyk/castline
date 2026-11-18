import { AppShell } from "@/components/shell";
import { requireRole } from "@/lib/auth";
import { tick } from "@/lib/lifecycle";
import { agencyByOwner } from "@/lib/store";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("manager");
  await tick();
  const agency = await agencyByOwner(user.id);
  return (
    <AppShell
      user={user}
      title={agency?.name ?? "Agency"}
      items={[
        { href: "/agency", label: "Overview" },
        { href: "/agency/roster", label: "Roster" },
        { href: "/agency/campaigns", label: "Campaigns" },
        { href: "/agency/reports", label: "Reports" },
      ]}
    >
      {children}
    </AppShell>
  );
}
