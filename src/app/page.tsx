import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { articles } from "@/lib/data";
import ArticleCard from "@/components/ui/ArticleCard";
import HeroEvent from "@/components/ui/HeroEvent";
import CalendarPreview from "@/components/ui/CalendarPreview";
import JsonLd from "@/components/ui/JsonLd";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  buildItemListJsonLd,
  buildCollectionPageJsonLd,
  parseFrDate,
} from "@/lib/seo";
import { getActiveOrNextHotEvent, getUpcomingHotEvents } from "@/lib/hot-events";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Actualités trail, courses et ultra-trail`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/", languages: { fr: "/" } },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: `${SITE_NAME} — Actualités trail, courses et ultra-trail`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Actualités trail, courses et ultra-trail`,
    description: SITE_DESCRIPTION,
  },
};

// Revalidation : on regenere la home toutes les 10 min pour que les nouveaux
// articles event remontent vite dans le hero et que la fenetre hot s ouvre/
// se ferme correctement (cycle J-5..J+3 sans deploiement requis).
export const revalidate = 600;

// Tri authoritative par publishedAt ISO (precision intra-jour), fallback sur
// parseFrDate(date) pour les vieux articles sans publishedAt. CRITIQUE pour
// Discover : un article publie a 14h doit passer devant un article 09h le
// meme jour, ce que le sort actuel par date FR (resolution jour) ne fait pas.
function articleTimestamp(a: { publishedAt?: string; date: string }): number {
  if (a.publishedAt) {
    const t = new Date(a.publishedAt).getTime();
    if (!isNaN(t)) return t;
  }
  const d = parseFrDate(a.date);
  return d ? d.getTime() : 0;
}

const sortedArticles = [...articles].sort((a, b) => articleTimestamp(b) - articleTimestamp(a));

export default function Home() {
  const now = new Date();
  const hotStatus = getActiveOrNextHotEvent(now);

  // Articles du dossier event (s'il y a un event actif/upcoming/just-finished).
  // Pour "next" (futur lointain), on ne fait pas de filtre : pas de dossier specifique.
  const dossierArticles = (hotStatus && hotStatus.kind !== "next")
    ? sortedArticles.filter((a) => a.hotEventSlug === hotStatus.event.slug)
    : (hotStatus ? sortedArticles.filter((a) => a.hotEventSlug === hotStatus.event.slug).slice(0, 3) : []);

  // Si pas d'articles dossier mais event "next" connu, on synthese visuel avec
  // les 3 premiers articles generiques pour ne pas laisser le hero vide.
  const heroArticles = dossierArticles.length > 0
    ? dossierArticles
    : sortedArticles.slice(0, 3);

  // Bloc "Dans l'actu" : 6 articles recents qui ne sont PAS dans le hero
  const heroSlugs = new Set(heroArticles.slice(0, 4).map((a) => a.slug));
  const actuArticles = sortedArticles
    .filter((a) => !heroSlugs.has(a.slug))
    .slice(0, 6);

  const upcomingEvents = getUpcomingHotEvents(now, 6, hotStatus?.event.slug);

  const coursesRecits = sortedArticles
    .filter((a) => a.categorySlug === "courses-recits" && !heroSlugs.has(a.slug))
    .slice(0, 4);
  const scienceArticles = sortedArticles
    .filter((a) => (a.categorySlug === "entrainement" || a.categorySlug === "nutrition") && !heroSlugs.has(a.slug))
    .slice(0, 4);

  const homeJsonLdList = [...heroArticles.slice(0, 4), ...actuArticles].filter(Boolean);

  return (
    <div className="bg-surface">
      <JsonLd
        data={buildCollectionPageJsonLd({
          name: `${SITE_NAME} — Accueil`,
          description: SITE_DESCRIPTION,
          url: SITE_URL,
          articles: homeJsonLdList,
        })}
      />
      <JsonLd
        data={buildItemListJsonLd({
          name: "Derniers articles",
          url: SITE_URL,
          articles: homeJsonLdList,
        })}
      />

      {/* Section 1 : HERO EVENT (toujours visible) */}
      <HeroEvent status={hotStatus} articles={heroArticles} />

      {/* Section 2 : DANS L'ACTU TRAIL */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12">
        <div className="newspaper-divider mb-10"><span>DANS L&apos;ACTU TRAIL</span></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {actuArticles[0] && (
            <div className="lg:col-span-8">
              <ArticleCard article={actuArticles[0]} variant="large" />
            </div>
          )}
          <div className="lg:col-span-4 space-y-6">
            {actuArticles.slice(1, 4).map((a) => (
              <Link key={a.slug} href={`/articles/${a.slug}`} className="group flex gap-3 border-b border-surface-container pb-4 last:border-b-0">
                <Image
                  src={a.image}
                  alt={a.title}
                  width={96}
                  height={96}
                  className="w-24 h-24 object-cover shrink-0 grayscale group-hover:grayscale-0 transition-all"
                />
                <div className="space-y-1">
                  <h3 className="font-headline font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-3">{a.title}</h3>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{a.category}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        {actuArticles.length > 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mt-10">
            {actuArticles.slice(4, 6).map((a) => (
              <ArticleCard key={a.slug} article={a} variant="default" />
            ))}
          </div>
        )}
      </section>

      {/* Section 3 : LES PROCHAINES COURSES */}
      <CalendarPreview events={upcomingEvents} />

      {/* CTA Moteur d'entrainement personnalise (conserve) */}
      <section className="bg-navy text-white">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-[0.95]">
              Moteur d&apos;entraînement
              <br />
              <span className="text-primary">100 % personnalisé</span>
            </h2>
            <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Indique ta course cible, ton niveau et ton volume actuel. On te construit en moins de 2 minutes un plan complet semaine par semaine, avec périodisation, séances détaillées, conseils nutrition et récupération.
            </p>
            <div className="pt-4">
              <Link href="/entrainement/generateur" className="inline-block bg-primary hover:bg-primary-dark transition-colors text-white font-headline font-black text-sm uppercase tracking-widest py-4 px-8">
                Construire mon plan gratuit &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 : COURSES & RECITS */}
      {coursesRecits.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-12 pt-8">
          <div className="newspaper-divider"><span>COURSES &amp; RÉCITS</span></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-0 md:gap-y-8 mt-12">
            {coursesRecits.map((article, i) => (
              <ArticleCard
                key={article.slug}
                article={article}
                variant="default"
                hideExcerpt={i % 3 === 2}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 5 : SCIENCE & ENTRAINEMENT */}
      {scienceArticles.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-20">
          <div className="newspaper-divider"><span>SCIENCE &amp; ENTRAÎNEMENT</span></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
            <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              {scienceArticles.map((article, i) => {
                const hideExcerpt = i % 3 === 2;
                return (
                  <Link
                    key={article.slug}
                    href={"/articles/" + article.slug}
                    className="group flex flex-col md:flex-row gap-3 md:gap-4 pb-6 border-b border-surface-container md:pb-0 md:border-b-0"
                  >
                    <Image
                      src={article.image}
                      alt={article.title}
                      width={800}
                      height={450}
                      sizes="(max-width: 768px) 100vw, 96px"
                      className="w-full aspect-video md:w-24 md:h-24 md:aspect-auto md:shrink-0 object-cover lg:grayscale lg:group-hover:grayscale-0 transition-all duration-300"
                    />
                    <div className="space-y-2">
                      <h4 className="font-headline font-black md:font-bold text-2xl md:text-xl leading-tight group-hover:text-primary transition-colors">{article.title}</h4>
                      {!hideExcerpt && (
                        <p className="text-base md:text-sm text-slate-600 leading-relaxed line-clamp-3 md:line-clamp-2">{article.excerpt}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="bg-white p-6 border-l-2 border-primary shadow-sm space-y-6">
              <h3 className="font-headline font-black text-2xl tracking-tighter italic uppercase">Altitude Trail</h3>
              <p className="text-sm leading-relaxed text-slate-600">Recevez chaque vendredi le &quot;Briefing des Cimes&quot; : l&apos;essentiel de l&apos;actu trail dans votre boîte mail.</p>
              <input className="w-full border border-slate-200 text-xs px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="votre@email.com" type="email" />
              <button className="w-full bg-primary text-white py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors">
                S&apos;ABONNER À LA NEWSLETTER
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
