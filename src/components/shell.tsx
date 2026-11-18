import Link from "next/link";
import { headers } from "next/headers";
import { logout } from "@/actions/auth";
import { Badge, buttonClass, Wordmark } from "@/components/ui";
import { roleLabel } from "@/lib/labels";
import type { User } from "@/lib/types";

export async function AppShell({
  user,
  title,
  items,
  children,
}: {
  user: User;
  title: string;
  items: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const path = (await headers()).get("x-pathname") ?? "";
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <Wordmark href={items[0]?.href ?? "/"} />
            <Badge status={user.role}>{roleLabel(user.role)}</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">{title}</span>
            <form action={logout}>
              <button className={buttonClass("ghost")}>Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-[190px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {items.map((item) => {
            const current = item.href.split("/").length === 2 ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm whitespace-nowrap ${current ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
