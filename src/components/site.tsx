import Link from "next/link";
import { logout } from "@/actions/auth";
import { buttonClass, Wordmark } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { roleLabel } from "@/lib/labels";
import { homeForRole } from "@/lib/paths";

const NAV = [
  ["How it works", "/how-it-works"],
  ["Inventory", "/streamers"],
  ["Pricing", "/pricing"],
] as const;

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Wordmark />
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href={homeForRole(user.role)} className={buttonClass("secondary")}>
                {roleLabel(user.role)}
              </Link>
              <form action={logout}>
                <button className={buttonClass("ghost")}>Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost")}>
                Sign in
              </Link>
              <Link href="/register/brand" className={buttonClass()}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-faint">
        <p>Castline · sponsored placements for livestream broadcasts</p>
        <div className="flex gap-4">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/disclosure">Disclosure</Link>
          <Link href="/register/agency">Agencies</Link>
        </div>
      </div>
    </footer>
  );
}

export function AuthCard({ title, lede, children }: { title: string; lede: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="font-serif text-4xl tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{lede}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
