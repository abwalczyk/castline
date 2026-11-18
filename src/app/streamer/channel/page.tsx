import { notFound } from "next/navigation";
import { acceptInviteAction, saveChannel } from "@/actions/streamer";
import { Form, SubmitButton } from "@/components/form";
import { Badge, Field, Input, Notice, PageHeader, Select, Textarea } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { CONTENT_CATEGORIES, LANGUAGES } from "@/lib/constants";
import { streamerByOwner } from "@/lib/store";
import { twitchConfigured } from "@/lib/twitch";

export default async function ChannelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole("streamer");
  const streamer = await streamerByOwner(user.id);
  if (!streamer) notFound();
  const query = await searchParams;
  return (
    <div>
      <PageHeader eyebrow="Channel" title="Profile and verification" description="Marketplace listings use the average CCV and follower count you enter. Those figures also feed estimated exposure, which is labeled as an estimate." />
      <div className="mb-4">
        <Badge status={streamer.verificationStatus} />
      </div>
      {query.twitch === "verified" ? <Notice>Twitch confirmed this login. The channel is verified.</Notice> : null}
      {query.twitch === "error" ? <Notice>Twitch did not confirm the channel. Try again, or ask an administrator to verify it.</Notice> : null}
      {query.twitch === "unconfigured" ? <Notice>Twitch OAuth is not configured. An administrator can verify the channel manually.</Notice> : null}
      {twitchConfigured() ? (
        <a href="/api/twitch/start" className="mb-6 inline-flex text-sm text-accent-soft">
          Verify with Twitch
        </a>
      ) : (
        <p className="mb-6 text-sm text-muted">Twitch OAuth is off in this environment. Verification is an administrator action.</p>
      )}
      <Form action={saveChannel} className="max-w-xl space-y-4">
        <Field label="Display name">
          <Input name="displayName" defaultValue={streamer.displayName} required />
        </Field>
        <Field label="Twitch">
          <Input name="twitch" defaultValue={streamer.twitchLogin} required />
        </Field>
        <Field label="Category">
          <Select name="category" defaultValue={streamer.category}>
            {CONTENT_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
        </Field>
        <Field label="Language">
          <Select name="language" defaultValue={streamer.language}>
            {LANGUAGES.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Average concurrent viewers">
          <Input name="avgCcv" inputMode="numeric" defaultValue={streamer.avgCcv} required />
        </Field>
        <Field label="Followers">
          <Input name="followers" inputMode="numeric" defaultValue={streamer.followerCount} required />
        </Field>
        <Field label="Bio">
          <Textarea name="bio" defaultValue={streamer.bio} />
        </Field>
        <SubmitButton>Save channel</SubmitButton>
      </Form>
      {streamer.linkStatus !== "active" ? (
        <Form action={acceptInviteAction} className="mt-10 max-w-xl space-y-4 border-t border-line pt-8">
          <h2 className="font-serif text-2xl">Join an agency</h2>
          <Field label="Invite code">
            <Input name="code" placeholder="HARBOR7K" />
          </Field>
          <SubmitButton variant="secondary">Accept invite</SubmitButton>
        </Form>
      ) : (
        <p className="mt-8 text-sm text-muted">This channel is represented by an agency. Approval rules may be set on the roster.</p>
      )}
    </div>
  );
}
