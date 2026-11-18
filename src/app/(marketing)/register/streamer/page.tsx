import type { Metadata } from "next";
import Link from "next/link";
import { registerStreamerAction } from "@/actions/auth";
import { Form, SubmitButton } from "@/components/form";
import { AuthCard } from "@/components/site";
import { Field, Input, Select } from "@/components/ui";
import { CONTENT_CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = { title: "Creator registration" };

export default function StreamerRegisterPage() {
  return (
    <AuthCard
      title="List a channel"
      lede="You get a persistent OBS browser source. Campaigns do not run until the channel is verified and you approve them."
    >
      <Form action={registerStreamerAction} className="space-y-4">
        <Field label="Your name">
          <Input name="name" required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required />
        </Field>
        <Field label="Password" hint="At least 10 characters.">
          <Input name="password" type="password" required minLength={10} />
        </Field>
        <Field label="Channel name">
          <Input name="displayName" required />
        </Field>
        <Field label="Twitch channel" hint="A login or a twitch.tv URL.">
          <Input name="twitch" required />
        </Field>
        <Field label="Category">
          <Select name="category" defaultValue="Just Chatting">
            {CONTENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>
        <SubmitButton className="w-full">Create creator account</SubmitButton>
      </Form>
      <p className="mt-4 text-sm text-muted">
        Representing several channels? <Link href="/register/agency">Open an agency account</Link>
      </p>
    </AuthCard>
  );
}
