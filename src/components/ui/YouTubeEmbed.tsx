"use client";

/**
 * YouTubeEmbed — pattern "facade" :
 *
 * Au premier rendu on affiche uniquement la miniature de la vidéo + un bouton
 * play. L'iframe YouTube (qui charge ~500 KB de JS tiers, pénalise le LCP et
 * ajoute 30+ requêtes réseau) n'est injecté qu'au clic utilisateur. Résultat :
 *   - LCP et CLS préservés
 *   - Score Performance PSI conservé
 *   - UX identique (un clic pour lancer)
 *
 * Un VideoObject JSON-LD est émis en parallèle pour que Google indexe la
 * vidéo et l'affiche dans le carrousel "Vidéos" des SERP.
 */

import { useState } from "react";
import Image from "next/image";
import JsonLd from "./JsonLd";

export interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  description?: string;
  uploadDate?: string; // ISO 8601
  durationSeconds?: number;
  channelName?: string;
}

function formatIso8601Duration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let out = "PT";
  if (h) out += `${h}H`;
  if (m) out += `${m}M`;
  if (s || (!h && !m)) out += `${s}S`;
  return out;
}

export default function YouTubeEmbed({
  videoId,
  title,
  description,
  uploadDate,
  durationSeconds,
  channelName,
}: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Miniature haute qualité servie par YouTube (toujours disponible)
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const thumbnailFallback = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description: description || title,
    thumbnailUrl: [thumbnail, thumbnailFallback],
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
  if (uploadDate) jsonLd.uploadDate = uploadDate;
  if (durationSeconds) jsonLd.duration = formatIso8601Duration(durationSeconds);
  if (channelName) {
    jsonLd.author = { "@type": "Person", name: channelName };
  }

  return (
    <div className="my-8">
      <JsonLd data={jsonLd} />
      <div className="relative aspect-video bg-navy overflow-hidden">
        {isLoaded ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsLoaded(true)}
            aria-label={`Lire la vidéo : ${title}`}
            className="group absolute inset-0 w-full h-full cursor-pointer"
          >
            <Image
              src={thumbnail}
              alt={title}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
              onError={(e) => {
                // fallback sur hqdefault si maxres n'existe pas pour cette vidéo
                (e.currentTarget as HTMLImageElement).src = thumbnailFallback;
              }}
              unoptimized
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-20 h-14 bg-red-600 group-hover:bg-red-700 transition-colors rounded-lg flex items-center justify-center shadow-lg">
                <svg
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-8 h-8 translate-x-0.5"
                  aria-hidden="true"
                >
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-2 italic">
        Vidéo YouTube — {title}
        {channelName ? ` · ${channelName}` : ""}
      </p>
    </div>
  );
}
