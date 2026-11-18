"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type PlayerAd = {
  creativeId: string;
  campaignId: string;
  type: "image" | "gif" | "mp4";
  url: string;
  durationSec: number;
  destinationHost: string;
  disclosure: string;
};

const FRACTION: Record<string, number> = { small: 0.18, medium: 0.24, large: 0.32 };

export function AdPlayer({
  playlistUrl,
  eventUrl,
  ads: providedAds,
  width,
  height,
  position,
  size,
  track = true,
  audio = false,
  preview = false,
}: {
  playlistUrl?: string;
  eventUrl?: string;
  ads?: PlayerAd[];
  width: number;
  height: number;
  position: string;
  size: string;
  track?: boolean;
  audio?: boolean;
  preview?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [ads, setAds] = useState<PlayerAd[]>(providedAds ?? []);
  const [index, setIndex] = useState(0);

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setScale(Math.min(rect.width / width, rect.height / height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width, height]);

  useEffect(() => {
    if (!playlistUrl) return;
    let stop = false;
    const load = async () => {
      const response = await fetch(playlistUrl, { cache: "no-store" });
      if (stop) return;
      if (!response.ok) {
        setAds([]);
        return;
      }
      const body = (await response.json()) as { ads?: PlayerAd[] };
      const next = body.ads ?? [];
      setAds((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    };
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [playlistUrl]);

  useEffect(() => {
    if (providedAds) setAds(providedAds);
  }, [providedAds]);

  const ad = ads.length > 0 ? ads[index % ads.length] : null;

  useEffect(() => {
    if (!ad) return;
    const started = performance.now();
    if (track && eventUrl) {
      void fetch(eventUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creativeId: ad.creativeId,
          campaignId: ad.campaignId,
          eventType: "started",
          durationMs: 0,
        }),
      });
    }
    const timer = window.setTimeout(() => {
      if (track && eventUrl) {
        void fetch(eventUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creativeId: ad.creativeId,
            campaignId: ad.campaignId,
            eventType: "completed",
            durationMs: Math.max(0, Math.round(performance.now() - started)),
          }),
        });
      }
      setIndex((current) => current + 1);
    }, Math.max(1, ad.durationSec) * 1000);
    return () => window.clearTimeout(timer);
  }, [ad, eventUrl, track]);

  const box = Math.round(width * (FRACTION[size] ?? 0.24));
  const place =
    position === "bottom-left"
      ? { left: 32, bottom: 32 }
      : position === "top-right"
        ? { right: 32, top: 32 }
        : position === "top-left"
          ? { left: 32, top: 32 }
          : position === "center"
            ? { left: (width - box) / 2, top: (height - box * 0.72) / 2 }
            : { right: 32, bottom: 32 };

  return (
    <div ref={frame} className="relative h-full w-full overflow-hidden bg-transparent">
      <div
        className="absolute left-0 top-0"
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {ad ? (
          <article
            aria-label="Sponsored advertisement"
            className="absolute overflow-hidden rounded-md bg-black/80 shadow-2xl ring-1 ring-white/20"
            style={{ width: box, ...place }}
          >
            <div className="flex items-center justify-between gap-3 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/85">
              <span>{ad.disclosure}</span>
              {ad.destinationHost ? <span className="truncate normal-case tracking-normal text-white/55">{ad.destinationHost}</span> : null}
            </div>
            {ad.type === "mp4" ? (
              <video key={ad.url} src={ad.url} className="aspect-video w-full bg-black object-contain" autoPlay muted={!audio} playsInline />
            ) : (
              // User-uploaded creatives are served from an authenticated or tokenized route.
              // eslint-disable-next-line @next/next/no-img-element
              <img key={ad.url} src={ad.url} alt="" className="aspect-video w-full bg-black object-contain" />
            )}
          </article>
        ) : preview ? (
          <div className="absolute bottom-8 right-8 w-64 rounded-md border border-dashed border-white/30 px-3 py-4 text-xs text-white/70">
            No sponsored placement is scheduled.
          </div>
        ) : null}
      </div>
    </div>
  );
}
