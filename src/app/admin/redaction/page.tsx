import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/lib/data";
import { HOT_EVENTS, getActiveOrNextHotEvent, formatRelativeEventDate } from "@/lib/hot-events";
import { getArticlePublishedAt } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Redaction — Schema hebdo Altitude Trail",
  description: "Tableau de bord redactionnel hebdomadaire. Suivi production + comite editorial.",
  robots: { index: false, follow: false }, // pas indexer cette page admin
};

// Cette page revalide toutes les 5 min pour avoir des donnees fraiches
export const revalidate = 300;

type SlotPlan = {
  day: string;
  theme: string;
  author: string;
  status: "publie" | "en-cours" | "a-produire" | "skip";
  slug?: string;
  title?: string;
};

function getCurrentWeek(now: Date = new Date()): { start: Date; end: Date; label: string } {
  const d = new Date(now);
  const day = d.getUTCDay(); // 0=dim, 1=lun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  const label = `Semaine du ${monday.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} au ${sunday.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  return { start: monday, end: sunday, label };
}

const WEEKLY_PLAN: SlotPlan[] = [
  { day: "Lundi", theme: "Entrainement", author: "Thomas Rouvier", status: "a-produire" },
  { day: "Mardi", theme: "Nutrition", author: "Claire Mercier", status: "a-produire" },
  { day: "Mercredi", theme: "Equipement", author: "Marc Blanc", status: "a-produire" },
  { day: "Jeudi", theme: "Blessures & prevention", author: "Thomas Rouvier", status: "a-produire" },
  { day: "Vendredi", theme: "Science & Performance (peer-reviewed)", author: "Thomas Rouvier", status: "a-produire" },
  { day: "Samedi", theme: "Guide pratique", author: "Marc Blanc / Yann", status: "a-produire" },
  { day: "Dimanche", theme: "Portrait / recit", author: "Marc Blanc", status: "a-produire" },
];

function articlesPublishedThisWeek(weekStart: Date, weekEnd: Date) {
  return articles.filter((a) => {
    const t = getArticlePublishedAt(a);
    return t >= weekStart && t <= weekEnd;
  });
}

function eventCoveragePlan(eventSlug: string) {
  return [
    { stage: "J-7 Preview plateau & favoris", status: "—" },
    { stage: "J-5 Preview parcours & glossaire", status: "—" },
    { stage: "J-3 Preview courses femmes", status: "—" },
    { stage: "J-1 Preview meteo & comment regarder", status: "—" },
    { stage: "J Live blog (updates auto toutes les heures)", status: "—" },
    { stage: "J+0 Recap hommes", status: "—" },
    { stage: "J+0 Recap femmes", status: "—" },
    { stage: "J+2 Analyse tactique", status: "—" },
    { stage: "J+5 Bilan & lecons", status: "—" },
  ];
}

export default function AdminRedactionPage() {
  const now = new Date();
  const week = getCurrentWeek(now);
  const weekArticles = articlesPublishedThisWeek(week.start, week.end);
  const hotEvent = getActiveOrNextHotEvent(now);

  // Top categories publiees cette semaine
  const byCat = new Map<string, number>();
  for (const a of weekArticles) {
    byCat.set(a.category, (byCat.get(a.category) || 0) + 1);
  }
  const catList = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

  // Repartition par auteur
  const byAuthor = new Map<string, number>();
  for (const a of weekArticles) {
    byAuthor.set(a.author, (byAuthor.get(a.author) || 0) + 1);
  }
  const authorList = [...byAuthor.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-surface min-h-screen">
      <header className="bg-navy text-white">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-10">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-headline font-black mb-2">
            Admin · Tableau de bord redactionnel
          </div>
          <h1 className="font-headline font-black text-3xl md:text-5xl tracking-tight">
            Schema hebdomadaire
          </h1>
          <p className="mt-3 text-slate-300">{week.label}</p>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-10 space-y-10">

        {/* KPIs synthese */}
        <section>
          <h2 className="font-headline text-xl font-black uppercase mb-4">KPIs semaine en cours</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 border-l-4 border-primary">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-headline font-bold mb-1">Articles publies</p>
              <p className="font-headline font-black text-4xl">{weekArticles.length}</p>
            </div>
            <div className="bg-white p-5 border-l-4 border-navy">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-headline font-bold mb-1">Articles total site</p>
              <p className="font-headline font-black text-4xl">{articles.length}</p>
            </div>
            <div className="bg-white p-5 border-l-4 border-emerald-600">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-headline font-bold mb-1">Hot event actif</p>
              <p className="font-headline font-black text-base mt-1">{hotEvent?.event.name || "—"}</p>
              {hotEvent && <p className="text-xs text-slate-500 mt-1">{formatRelativeEventDate(hotEvent.event)}</p>}
            </div>
            <div className="bg-white p-5 border-l-4 border-amber-500">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-headline font-bold mb-1">Cible vision 2026</p>
              <p className="font-headline font-black text-2xl mt-1">5-10 / jour</p>
              <p className="text-xs text-slate-500">soit 35-70 / sem</p>
            </div>
          </div>
        </section>

        {/* Couverture event en cours */}
        {hotEvent && (
          <section>
            <h2 className="font-headline text-xl font-black uppercase mb-4">
              Couverture event : <span className="text-primary">{hotEvent.event.name}</span>
            </h2>
            <div className="bg-white p-5">
              <p className="text-xs text-slate-500 mb-4">Schema 8 articles cible (J-7 a J+5)</p>
              <ul className="divide-y divide-surface-container">
                {eventCoveragePlan(hotEvent.event.slug).map((stage, i) => (
                  <li key={i} className="py-3 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
                    <span className="font-headline font-bold text-sm uppercase tracking-wider text-navy">{stage.stage}</span>
                    <span className="text-sm text-slate-700">{stage.status}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/dossiers/${hotEvent.event.slug}`} className="inline-block mt-4 text-xs uppercase tracking-widest font-headline font-black text-primary hover:underline">
                Voir le dossier complet →
              </Link>
            </div>
          </section>
        )}

        {/* Schema thematique hebdo */}
        <section>
          <h2 className="font-headline text-xl font-black uppercase mb-4">Planning thematique articles de fond (7 / sem)</h2>
          <div className="bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container text-left">
                <tr>
                  <th className="px-4 py-2 font-headline uppercase text-xs">Jour</th>
                  <th className="px-4 py-2 font-headline uppercase text-xs">Theme</th>
                  <th className="px-4 py-2 font-headline uppercase text-xs">Auteur</th>
                  <th className="px-4 py-2 font-headline uppercase text-xs">Statut</th>
                </tr>
              </thead>
              <tbody>
                {WEEKLY_PLAN.map((slot) => (
                  <tr key={slot.day} className="border-b border-surface-container">
                    <td className="px-4 py-2 font-headline font-bold">{slot.day}</td>
                    <td className="px-4 py-2">{slot.theme}</td>
                    <td className="px-4 py-2 text-slate-600">{slot.author}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-1 text-[10px] font-headline font-black uppercase tracking-wider bg-amber-100 text-amber-800">{slot.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">Le statut est statique pour l'instant (a connecter avec un mapping article -&gt; jour dans une future iteration).</p>
        </section>

        {/* Repartition publication semaine */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5">
            <h3 className="font-headline text-lg font-black mb-3">Categories publiees cette sem.</h3>
            {catList.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Aucun article publie cette semaine.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {catList.map(([cat, n]) => (
                  <li key={cat} className="flex justify-between">
                    <span>{cat}</span>
                    <span className="font-headline font-bold">{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white p-5">
            <h3 className="font-headline text-lg font-black mb-3">Auteurs (cette sem.)</h3>
            {authorList.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Aucun.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {authorList.map(([author, n]) => (
                  <li key={author} className="flex justify-between">
                    <span>{author}</span>
                    <span className="font-headline font-bold">{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Articles publies cette semaine */}
        <section>
          <h2 className="font-headline text-xl font-black uppercase mb-4">Articles publies cette semaine ({weekArticles.length})</h2>
          {weekArticles.length === 0 ? (
            <p className="text-sm text-slate-500 italic bg-white p-5">Aucun article publie cette semaine.</p>
          ) : (
            <ul className="bg-white divide-y divide-surface-container">
              {weekArticles.slice(0, 30).map((a) => (
                <li key={a.slug} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/articles/${a.slug}`} className="font-headline font-bold text-sm hover:text-primary line-clamp-1">{a.title}</Link>
                    <p className="text-xs text-slate-500 mt-1">{a.author} · {a.category} · {getArticlePublishedAt(a).toLocaleDateString("fr-FR")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Comite editorial */}
        <section className="bg-navy text-white p-6">
          <h2 className="font-headline text-xl font-black uppercase mb-3">Comite editorial</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-headline font-bold mb-1">Lundi 9h-10h Paris</p>
              <p className="font-headline font-bold text-sm mb-2">Briefing semaine</p>
              <ul className="text-xs text-slate-300 space-y-1 leading-relaxed">
                <li>· Digest actu trail 7 derniers jours (5 min)</li>
                <li>· Prio sujets semaine (15 min)</li>
                <li>· Briefing 8 articles event + 7 articles fond (30 min)</li>
                <li>· Revue KPIs sem N-1 (10 min)</li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-headline font-bold mb-1">Vendredi 17h-17h30</p>
              <p className="font-headline font-bold text-sm mb-2">Retro semaine</p>
              <ul className="text-xs text-slate-300 space-y-1 leading-relaxed">
                <li>· Articles publies, ceux qui ont marche vs pas</li>
                <li>· Lecons editoriales</li>
                <li>· Ajustements semaine N+1</li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
