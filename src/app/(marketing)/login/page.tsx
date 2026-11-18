import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { login, loginAsDemo } from "@/actions/auth";
import { Form, SubmitButton } from "@/components/form";
import { AuthCard } from "@/components/site";
import { buttonClass, Field, Input, Notice } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, demoEnabled } from "@/lib/demo";
import { homeForRole, safeNextPath } from "@/lib/paths";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));
  const query = await searchParams;
  const next = safeNextPath(typeof query.next === "string" ? query.next : "", "");
  return (
    <AuthCard title="Sign in" lede="Advertisers, creators, agencies, and administrators each land in their own workspace.">
      {query.error === "demo" ? <Notice>The demo account could not be opened. Restart the app so the sample data can load.</Notice> : null}
      <Form action={login} className="mt-4 space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email">
          <Input name="email" type="email" autoComplete="username" required />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="w-full">Sign in</SubmitButton>
      </Form>
      <p className="mt-4 text-sm text-muted">
        New here? <Link href="/register/brand">Advertiser</Link>, <Link href="/register/streamer">creator</Link>, or{" "}
        <Link href="/register/agency">agency</Link>.
      </p>
      {demoEnabled() ? (
        <div className="mt-8 border-t border-line pt-6">
          <p className="text-sm text-muted">
            Sample workspace password: <span className="text-ink">{DEMO_PASSWORD}</span>
          </p>
          <div className="mt-3 grid gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <form key={account.email} action={loginAsDemo}>
                <input type="hidden" name="email" value={account.email} />
                <button className={`${buttonClass("secondary")} w-full`}>
                  Continue as {account.role}
                </button>
              </form>
            ))}
          </div>
        </div>
      ) : null}
    </AuthCard>
  );
}
