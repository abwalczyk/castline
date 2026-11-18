import type { Metadata } from "next";
import Link from "next/link";
import { registerAgencyAction } from "@/actions/auth";
import { Form, SubmitButton } from "@/components/form";
import { AuthCard } from "@/components/site";
import { Field, Input } from "@/components/ui";

export const metadata: Metadata = { title: "Agency registration" };

export default function AgencyRegisterPage() {
  return (
    <AuthCard title="Open an agency account" lede="Invite creators, set floors and category rules, and approve campaigns on the roster you manage.">
      <Form action={registerAgencyAction} className="space-y-4">
        <Field label="Your name">
          <Input name="name" required />
        </Field>
        <Field label="Work email">
          <Input name="email" type="email" required />
        </Field>
        <Field label="Password" hint="At least 10 characters.">
          <Input name="password" type="password" required minLength={10} />
        </Field>
        <Field label="Agency name">
          <Input name="agencyName" required />
        </Field>
        <Field label="Website" hint="Optional.">
          <Input name="website" placeholder="https://" />
        </Field>
        <SubmitButton className="w-full">Create agency</SubmitButton>
      </Form>
      <p className="mt-4 text-sm text-muted">
        A single channel? <Link href="/register/streamer">Register as a creator</Link>
      </p>
    </AuthCard>
  );
}
