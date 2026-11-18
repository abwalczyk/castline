import { startCampaign } from "@/actions/brand";
import { Form, SubmitButton } from "@/components/form";
import { Field, Input, PageHeader } from "@/components/ui";
import { streamerById } from "@/lib/store";
import { parseUuid } from "@/lib/validate";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const streamerId = typeof query.streamer === "string" ? parseUuid(query.streamer) : null;
  const streamer = streamerId ? await streamerById(streamerId) : null;
  return (
    <div>
      <PageHeader
        eyebrow="Draft"
        title="New campaign"
        description={streamer ? `This draft starts with ${streamer.displayName}.` : "You can add creators after the draft exists."}
      />
      <Form action={startCampaign} className="max-w-md space-y-4">
        {streamer ? <input type="hidden" name="streamerId" value={streamer.id} /> : null}
        <Field label="Campaign name">
          <Input name="name" required />
        </Field>
        <SubmitButton>Create draft</SubmitButton>
      </Form>
    </div>
  );
}
