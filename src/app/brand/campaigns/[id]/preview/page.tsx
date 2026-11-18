import Link from "next/link";
import { notFound } from "next/navigation";
import { AdPlayer, type PlayerAd } from "@/components/player";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { SPONSOR_LABEL } from "@/lib/constants";
import { destinationHost } from "@/lib/urls";
import { brandByOwner, creatives, getCampaign } from "@/lib/store";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("brand");
  const brand = await brandByOwner(user.id);
  const campaign = await getCampaign(id);
  if (!brand || !campaign || campaign.brandId !== brand.id) notFound();
  const assets = await creatives(campaign.id);
  const ads: PlayerAd[] = assets.map((asset) => ({
    creativeId: asset.id,
    campaignId: campaign.id,
    type: asset.type,
    url: `/api/media/${asset.id}`,
    durationSec: campaign.placementDurationSec,
    destinationHost: destinationHost(campaign.destinationUrl),
    disclosure: SPONSOR_LABEL,
  }));
  return (
    <div>
      <PageHeader
        eyebrow="Preview"
        title={campaign.name}
        description="This frame does not record playback. The Sponsored label is part of the player and stays on the broadcast."
        action={
          <Link href={`/brand/campaigns/${campaign.id}`} className="text-sm text-muted">
            Back to campaign
          </Link>
        }
      />
      <div className="h-[480px] overflow-hidden rounded-xl border border-line bg-black">
        <AdPlayer ads={ads} width={1280} height={720} position="bottom-right" size={campaign.placementSize} track={false} preview />
      </div>
    </div>
  );
}
