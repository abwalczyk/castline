import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "How it works" };

const STEPS = [
  {
    title: "Brands assemble a flight",
    body: "An advertiser profile holds the company, the billing contact, and the industry. A campaign adds dates, a budget, a placement duration, a rotation, a size, an optional restricted category, and an HTTPS destination. Creatives are PNG, JPEG, WebP, GIF, or MP4, and they stay pending until a moderator approves them.",
  },
  {
    title: "Creators and agencies decide",
    body: "Each creator sets a daily rate, inventory limits, and categories they will not run. An agency can raise a floor, add restrictions, and choose whether the creator, the agency, either, or both must approve. One relevant rejection or change request sends the campaign back.",
  },
  {
    title: "Castline reviews, then the brand pays",
    body: "Platform review covers the campaign and every creative. Payment is available only after the relevant approvals are in and at least one creative is approved. Stripe Checkout collects the brand total. Commission is calculated on the creator side and is not added at checkout.",
  },
  {
    title: "The browser source delivers",
    body: "Every creator has one persistent URL. OBS loads it as a Browser Source. The page asks the server for the active playlist, rotates approved creatives for their scheduled duration, and keeps a Sponsored label on screen. When the playlist is empty, the source is transparent.",
  },
  {
    title: "Playback and exposure stay separate",
    body: "A playback event means the browser source started or finished a creative. It does not mean a viewer saw it. Estimated exposure is average concurrent viewers multiplied by completed playback time, and every report labels it as an estimate.",
  },
  {
    title: "Earnings wait for delivery",
    body: "Creator earnings are held when the brand pays. They become eligible only after the flight has ended and the completed-playback minimum is met. The first release of payouts is recorded manually. Stripe Connect transfers are wired for when a connected account is present.",
  },
];

export default function HowItWorksPage() {
  return (
    <article className="max-w-3xl py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-faint">Product</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">How a placement moves from brief to broadcast.</h1>
      <p className="mt-4 text-base leading-7 text-muted">
        Castline is an advertising operations product. The broadcast is the medium. The workflow is approval, payment, delivery, and a report that does not pretend a source render is a verified impression.
      </p>
      <ol className="mt-10 space-y-8">
        {STEPS.map((step, index) => (
          <li key={step.title} className="border-t border-line pt-6">
            <p className="text-xs tracking-[0.16em] text-faint">0{index + 1}</p>
            <h2 className="mt-2 font-serif text-3xl">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex gap-3">
        <Link href="/register/brand" className={buttonClass()}>
          Create an advertiser account
        </Link>
        <Link href="/streamers" className={buttonClass("secondary")}>
          Browse inventory
        </Link>
      </div>
    </article>
  );
}
