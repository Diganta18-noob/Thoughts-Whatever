"use client";

import { useState } from "react";
import { Play, Instagram } from "lucide-react";
import { instagramShortcode, youtubeId, cn } from "@/lib/utils";

/**
 * Both embeds use a click-to-load facade rather than mounting the third-party
 * iframe on page load.
 *
 * Two reasons, and the second is the one that matters. An Instagram embed
 * pulls roughly a megabyte of script before a reader has asked for it, which
 * is punishing on the mobile connections most of this audience is on. And it
 * sets Meta cookies for every visitor to every page — including people who
 * came from a search result and only wanted to read the essay. The facade
 * means the reader chooses when that happens.
 */

function Facade({
  poster,
  label,
  onPlay,
  className,
}: {
  poster?: string | null;
  label: string;
  onPlay: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className={cn(
        "group relative flex w-full items-center justify-center overflow-hidden rounded-sm border border-rule bg-surface-raised",
        className,
      )}
      aria-label={label}
    >
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-85 transition group-hover:opacity-100"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-content/[0.06] to-content/[0.02]" />
      )}

      <div className="relative flex flex-col items-center gap-3 px-6 py-16">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-surface shadow-lg transition group-hover:scale-105">
          <Play className="h-5 w-5 translate-x-[2px]" fill="currentColor" />
        </span>
        <span className="rounded-sm bg-surface/85 px-2.5 py-1 font-bengali-sans text-xs text-content backdrop-blur">
          {label}
        </span>
      </div>
    </button>
  );
}

export function ReelEmbed({
  url,
  poster,
  className,
}: {
  url: string;
  poster?: string | null;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const code = instagramShortcode(url);

  if (!code) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
      >
        <Instagram className="h-4 w-4" />
        রিলটি দেখুন
      </a>
    );
  }

  return (
    <div data-print="hide" className={cn("mx-auto w-full max-w-[400px]", className)}>
      {loaded ? (
        <div className="overflow-hidden rounded-sm border border-rule">
          <iframe
            src={`https://www.instagram.com/reel/${code}/embed/captioned/`}
            title="ইনস্টাগ্রাম রিল"
            className="block h-[640px] w-full"
            frameBorder={0}
            scrolling="no"
            allow="encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <Facade
          poster={poster}
          label="রিল চালান"
          onPlay={() => setLoaded(true)}
          className="aspect-[4/5]"
        />
      )}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center justify-center gap-1.5 font-bengali-sans text-xs text-content-faint transition hover:text-accent"
      >
        <Instagram className="h-3 w-3" />
        ইনস্টাগ্রামে দেখুন
      </a>
    </div>
  );
}

export function VideoEmbed({
  url,
  poster,
  className,
}: {
  url: string;
  poster?: string | null;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const id = youtubeId(url);

  if (!id) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-accent hover:underline"
      >
        ভিডিওটি দেখুন
      </a>
    );
  }

  const thumb = poster || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

  return (
    <div data-print="hide" className={cn("w-full", className)}>
      {loaded ? (
        <div className="aspect-video overflow-hidden rounded-sm border border-rule">
          <iframe
            // youtube-nocookie: no tracking cookie until playback actually starts.
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title="তথ্যচিত্র"
            className="h-full w-full"
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <Facade
          poster={thumb}
          label="তথ্যচিত্র দেখুন"
          onPlay={() => setLoaded(true)}
          className="aspect-video"
        />
      )}
    </div>
  );
}
