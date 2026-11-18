import { revokeOverlayAction, saveOverlayAction } from "@/actions/streamer";
import { CopyButton } from "@/components/copy-button";
import { Form, SubmitButton } from "@/components/form";
import { Field, Input, PageHeader, Panel, Select } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { PLACEMENT_SIZES, POSITIONS } from "@/lib/constants";
import { requestOrigin } from "@/lib/origin";
import { overlayPath } from "@/lib/paths";
import { labelize } from "@/lib/labels";
import { streamerByOwner } from "@/lib/store";

export default async function OverlaySetupPage() {
  const user = await requireRole("streamer");
  const streamer = await streamerByOwner(user.id, true);
  if (!streamer?.overlayToken) return null;
  const origin = await requestOrigin();
  const path = overlayPath(streamer.slug, streamer.overlayToken, {
    width: streamer.overlayWidth,
    height: streamer.overlayHeight,
    position: streamer.overlayPosition,
    size: streamer.placementSize,
    audio: streamer.overlayAudio,
  });
  const url = `${origin}${path}`;
  return (
    <div>
      <PageHeader
        eyebrow="Delivery"
        title="OBS browser source"
        description="This URL stays the same until you revoke it. OBS keeps rendering it with no one signed in."
      />
      <Panel className="p-5">
        <p className="break-all font-mono text-sm text-accent-soft">{url}</p>
        <div className="mt-4">
          <CopyButton value={url} label="Copy URL" />
        </div>
      </Panel>
      <ol className="mt-8 max-w-2xl list-decimal space-y-3 pl-5 text-sm leading-6 text-muted">
        <li>In OBS, add a source and choose Browser.</li>
        <li>Paste the URL. Set the width to {streamer.overlayWidth} and the height to {streamer.overlayHeight}.</li>
        <li>Leave “Shutdown source when not visible” unchecked if the ad should keep its place in the rotation between scenes.</li>
        <li>Do not add CSS that hides the Sponsored label. The player draws it and the page is transparent when nothing is scheduled.</li>
        <li>Playback events from this source are plays of the creative. They are not a count of viewers.</li>
      </ol>
      <Form action={saveOverlayAction} className="mt-8 grid max-w-xl gap-4 md:grid-cols-2">
        <Field label="Width">
          <Input name="width" defaultValue={streamer.overlayWidth} />
        </Field>
        <Field label="Height">
          <Input name="height" defaultValue={streamer.overlayHeight} />
        </Field>
        <Field label="Position">
          <Select name="position" defaultValue={streamer.overlayPosition}>
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {labelize(position)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Creative size">
          <Select name="size" defaultValue={streamer.placementSize}>
            {PLACEMENT_SIZES.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="audio" defaultChecked={streamer.overlayAudio} />
          Allow creative audio. Leave this off for a normal broadcast mix.
        </label>
        <div className="md:col-span-2">
          <SubmitButton variant="secondary">Save source settings</SubmitButton>
        </div>
      </Form>
      <Form action={revokeOverlayAction} className="mt-6">
        <SubmitButton variant="danger">Revoke URL and issue a new one</SubmitButton>
      </Form>
    </div>
  );
}
