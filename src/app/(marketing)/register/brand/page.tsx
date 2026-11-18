import type { Metadata } from "next";
import Link from "next/link";
import { registerBrandAction } from "@/actions/auth";
import { Form, SubmitButton } from "@/components/form";
import { AuthCard } from "@/components/site";
import { Field, Input, Select } from "@/components/ui";
import { BRAND_VERTICALS } from "@/lib/constants";

export const metadata: Metadata = { title: "Advertiser registration" };

export default function BrandRegisterPage() {
  return (
    <AuthCard title="Create an advertiser account" lede="Book dated placements on participating livestreams. Payment happens after the flight is approved.">
      <Form action={registerBrandAction} className="space-y-4">
        <Field label="Your name">
          <Input name="name" required />
        </Field>
        <Field label="Work email">
          <Input name="email" type="email" required />
        </Field>
        <Field label="Password" hint="At least 10 characters.">
          <Input name="password" type="password" required minLength={10} />
        </Field>
        <Field label="Company">
          <Input name="companyName" required />
        </Field>
        <Field label="Website" hint="Optional. Public HTTPS only.">
          <Input name="website" placeholder="https://" />
        </Field>
        <Field label="Industry">
          <Select name="industry" defaultValue="Consumer goods">
            {BRAND_VERTICALS.map((vertical) => (
              <option key={vertical} value={vertical}>
                {vertical}
              </option>
            ))}
          </Select>
        </Field>
        <SubmitButton className="w-full">Create account</SubmitButton>
      </Form>
      <p className="mt-4 text-sm text-muted">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </AuthCard>
  );
}
