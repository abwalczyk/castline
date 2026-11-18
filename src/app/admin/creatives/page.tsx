import Link from "next/link";
import { moderateCreativeAction } from "@/actions/admin";
import { Form, SubmitButton } from "@/components/form";
import { Badge, PageHeader, Panel, Select, Textarea } from "@/components/ui";
import { listCreativesForReview } from "@/lib/store";

export default async function CreativesPage() {
  const assets = await listCreativesForReview();
  return (
    <div>
      <PageHeader eyebrow="Moderation" title="Creatives in review" description="Approve or reject stills, GIFs, and video before a flight can be paid." />
      <div className="grid gap-4">
        {assets.map((asset) => (
          <Panel key={asset.id} className="grid gap-4 p-4 md:grid-cols-[240px_1fr]">
            {asset.type === "mp4" ? (
              <video src={`/api/media/${asset.id}`} className="aspect-video bg-black" muted controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/media/${asset.id}`} alt="" className="aspect-video bg-black object-contain" />
            )}
            <div>
              <p className="text-sm">
                <Link href={`/admin/campaigns/${asset.campaignId}`}>{asset.originalName}</Link> <Badge status={asset.status} />
              </p>
              <Form action={moderateCreativeAction} className="mt-3 space-y-3">
                <input type="hidden" name="creativeId" value={asset.id} />
                <Select name="status" defaultValue={asset.status === "rejected" ? "rejected" : "approved"}>
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </Select>
                <Textarea name="note" defaultValue={asset.moderationNote} />
                <SubmitButton variant="secondary">Save moderation</SubmitButton>
              </Form>
            </div>
          </Panel>
        ))}
        {assets.length === 0 ? <p className="text-sm text-muted">Nothing is waiting for creative review.</p> : null}
      </div>
    </div>
  );
}
