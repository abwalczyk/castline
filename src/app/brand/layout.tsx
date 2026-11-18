import { AppShell } from "@/components/shell";
import { requireRole } from "@/lib/auth";
import { tick } from "@/lib/lifecycle";
import { brandByOwner } from "@/lib/store";

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("brand");
  await tick();
  const brand = await brandByOwner(user.id);
  return (
    <AppShell
      user={user}
      title={brand?.companyName ?? "Advertiser"}
      items={[
        { href: "/brand", label: "Overview" },
        { href: "/brand/inventory", label: "Inventory" },
        { href: "/brand/campaigns", label: "Campaigns" },
        { href: "/brand/profile", label: "Profile" },
      ]}
    >
      {children}
    </AppShell>
  );
}
