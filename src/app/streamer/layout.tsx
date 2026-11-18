import { AppShell } from "@/components/shell";
import { requireRole } from "@/lib/auth";
import { tick } from "@/lib/lifecycle";
import { streamerByOwner } from "@/lib/store";

export default async function StreamerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("streamer");
  await tick();
  const streamer = await streamerByOwner(user.id);
  return (
    <AppShell
      user={user}
      title={streamer?.displayName ?? "Creator"}
      items={[
        { href: "/streamer", label: "Overview" },
        { href: "/streamer/channel", label: "Channel" },
        { href: "/streamer/commercial", label: "Rates" },
        { href: "/streamer/campaigns", label: "Campaigns" },
        { href: "/streamer/earnings", label: "Earnings" },
        { href: "/streamer/reports", label: "Reports" },
        { href: "/streamer/overlay", label: "OBS source" },
      ]}
    >
      {children}
    </AppShell>
  );
}
