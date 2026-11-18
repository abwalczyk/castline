import type { Metadata } from "next";

export const metadata: Metadata = { title: "Disclosure" };

export default function DisclosurePage() {
  return (
    <article className="max-w-3xl py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-faint">Advertising standards</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">What “Sponsored” means on a broadcast.</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted">
        <p>
          Every creative rendered by a Castline browser source carries a Sponsored label. Creators cannot turn that label off. The destination is shown as a hostname. The source does not navigate the broadcast to the advertiser&apos;s site.
        </p>
        <p>
          A playback is a record that the browser source started or completed a creative. It is evidence about the stream software, not about the audience. Castline does not sell playback counts as verified impressions.
        </p>
        <p>
          Estimated exposure is the creator&apos;s stated average concurrent viewers multiplied by completed playback time. Reports keep that figure next to verified playback and name it as an estimate. Average CCV is supplied by the creator or their agency until a measured audience feed is connected.
        </p>
        <p>
          Restricted categories — alcohol, gambling, politics, supplements, dating, and crypto — can be blocked by a creator or an agency. A campaign in a blocked category cannot be added to that roster.
        </p>
      </div>
    </article>
  );
}
