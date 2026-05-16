import Link from "next/link";
import { HotEvent, formatRelativeEventDate } from "@/lib/hot-events";

type Props = {
  events: HotEvent[];
};

export default function CalendarPreview({ events }: Props) {
  if (events.length === 0) return null;
  return (
    <section className="bg-white border-t border-surface-container">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="newspaper-divider mb-10"><span>LES PROCHAINES COURSES</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Link
              key={event.slug}
              href={`/courses?event=${event.slug}`}
              className="group border border-surface-container p-5 hover:border-navy transition-colors flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-widest text-primary font-headline font-black">
                  {formatRelativeEventDate(event)}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-headline font-bold">
                  {event.location.split(",").pop()?.trim()}
                </span>
              </div>
              <h3 className="font-headline font-black text-xl tracking-tight leading-tight group-hover:text-primary transition-colors">
                {event.name}
              </h3>
              {(event.distance || event.elevation) && (
                <p className="text-xs text-slate-500">
                  {event.distance}
                  {event.distance && event.elevation && " · "}
                  {event.elevation}
                </p>
              )}
              <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-auto pt-2 font-headline font-bold group-hover:text-navy transition-colors">
                Voir la couverture &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
