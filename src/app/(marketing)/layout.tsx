import { SiteFooter, SiteHeader } from "@/components/site";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-5">{children}</div>
      <SiteFooter />
    </div>
  );
}
