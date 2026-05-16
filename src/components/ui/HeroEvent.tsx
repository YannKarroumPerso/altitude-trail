import Link from "next/link";
import Image from "next/image";
import { Article } from "@/types";
import { HotEvent, HotEventStatus, formatLongFr } from "@/lib/hot-events";

type Props = {
  status: HotEventStatus;
  articles: Article[];
};

function badgeLabel(status: HotEventStatus): { label: string; tone: "live" | "upcoming" | "past" | "next" } {
  if (!status) return { label: "À LA UNE", tone: "next" };
  switch (status.kind) {
    case "live":
      return { label: "EN CE MOMENT", tone: "live" };
    case "upcoming": {
      const days = Math.ceil(Math.abs(status.relativeHours) / 24);
      return { label: `J-${days} · COUVERTURE EN COURS`, tone: "upcoming" };
    }
    case "just-finished":
      return { label: "RECAP EN COURS", tone: "past" };
    case "next":
      return { label: `PROCHAINE GRANDE COURSE · DANS ${status.daysUntil} JOURS`, tone: "next" };
  }
}

const TONE_CLASSES: Record<"live" | "upcoming" | "past" | "next", string> = {
  live: "bg-red-600 text-white",
  upcoming: "bg-primary text-white",
  past: "bg-emerald-600 text-white",
  next: "bg-navy text-white",
};

export default function HeroEvent({ status, articles }: Props) {
  if (!status) return null;
  const event: HotEvent = status.event;
  const { label, tone } = badgeLabel(status);
  const lead = articles[0];
  const secondary = articles.slice(1, 4);

  return (
    <section
      className="bg-surface-container border-b-2 border-navy"
      aria-label={`Couverture éditoriale : ${event.name}`}
    >
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-6 pb-10">
        {/* Bandeau */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 text-[11px] font-headline font-black uppercase tracking-[0.15em] ${TONE_CLASSES[tone]}`}
          >
            {tone === "live" && (
              <span className="relative flex w-2 h-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
            )}
            {label}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-slate-500 font-headline font-bold">
            {event.name}
          </span>
        </div>

        {/* Heading */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Article hero a gauche */}
          <div className="lg:col-span-8">
            {lead ? (
              <Link href={`/articles/${lead.slug}`} className="group block">
                <div className="relative aspect-[16/9] mb-4 overflow-hidden bg-slate-200">
                  <Image
                    src={lead.image}
                    alt={lead.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <h2 className="font-headline font-black text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.05] group-hover:text-primary transition-colors">
                  {lead.title}
                </h2>
                {lead.excerpt && (
                  <p className="mt-3 text-base md:text-lg text-slate-600 leading-relaxed line-clamp-3">
                    {lead.excerpt}
                  </p>
                )}
              </Link>
            ) : (
              <div className="aspect-[16/9] bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-headline uppercase tracking-widest">
                Couverture en cours d&apos;edition
              </div>
            )}
          </div>

          {/* Bloc info + 3 articles a droite */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-navy text-white p-5 space-y-2">
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-headline font-bold">
                Calendrier
              </p>
              <p className="font-headline font-black text-xl leading-tight">
                {formatLongFr(event.start)}
              </p>
              <p className="text-sm text-slate-300">{event.location}</p>
              {(event.distance || event.elevation) && (
                <p className="text-xs text-slate-400 pt-1">
                  {event.distance}
                  {event.distance && event.elevation && " · "}
                  {event.elevation}
                </p>
              )}
            </div>

            <div>
              <div className="bg-navy text-white py-2 px-4 font-headline font-bold uppercase text-xs inline-block mb-3">
                Le dossier ({articles.length} {articles.length > 1 ? "articles" : "article"})
              </div>
              <ul className="space-y-4">
                {secondary.map((a) => (
                  <li key={a.slug} className="border-b border-surface-container pb-3 last:border-b-0">
                    <Link href={`/articles/${a.slug}`} className="group flex gap-3">
                      <Image
                        src={a.image}
                        alt={a.title}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover shrink-0 grayscale group-hover:grayscale-0 transition-all"
                      />
                      <div className="space-y-1">
                        <h3 className="font-headline font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-3">
                          {a.title}
                        </h3>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          {a.category}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {articles.length > 4 && (
                <Link
                  href={`/courses?event=${event.slug}`}
                  className="inline-block mt-4 text-xs font-headline font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Voir tous les articles du dossier &rarr;
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
