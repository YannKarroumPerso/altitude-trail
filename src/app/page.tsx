import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { articles, mostRead } from "@/lib/data";
import ArticleCard from "@/components/ui/ArticleCard";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Actualités trail, courses et ultra-trail`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/", languages: { fr: "/" } },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: `${SITE_NAME} — Actualités trail, courses et ultra-trail`,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Actualités trail, courses et ultra-trail`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

const featuredArticle = articles[0];
const secondaryArticles = articles.slice(1, 3);
const sidebarArticles = articles.slice(3, 6);
const coursesRecits = articles.filter(a => a.categorySlug === "courses-recits").slice(0, 4);
const scienceArticles = articles.filter(a => a.categorySlug === "entrainement" || a.categorySlug === "nutrition").slice(0, 4);

export default function Home() {
  return (
    <div className="bg-surface">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Sidebar — desktop col 1-3 ; hidden sur mobile pour feed pleine largeur */}
        <aside className="lg:col-span-3 space-y-6 order-3 lg:order-none hidden lg:block">
          <div className="bg-navy text-white py-2 px-4 font-headline font-bold uppercase text-sm inline-block">
            LES PLUS CONSULTÉS
          </div>
          <div className="space-y-6">
            {mostRead.map((article, i) => (
              <Link key={article.slug} href={"/articles/" + article.slug} className="flex gap-4 group cursor-pointer">
                <div className="text-4xl font-headline font-black text-slate-300 group-hover:text-primary transition-colors leading-none shrink-0">
                  {i + 1}
                </div>
                <div className="space-y-1">
                  {i % 2 === 0 && (
                    <Image src={article.image} alt={article.title} width={96} height={64}
                      className="w-24 h-16 object-cover rounded shadow-sm lg:grayscale lg:group-hover:grayscale-0 transition-all mb-1" />
                  )}
                  <h3 className="font-headline font-bold text-sm leading-snug group-hover:underline">{article.title}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{article.category} — {article.readTime}</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>

        {/* Central Column — desktop middle ; on mobile rendered first */}
        <section className="lg:col-span-6 space-y-8 order-1 lg:order-none">
          <ArticleCard article={featuredArticle} variant="large" priority />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-2 border-surface-container pt-8">
            {secondaryArticles.map((article, i) => (
              <ArticleCard
                key={article.slug}
                article={article}
                variant="default"
                hideExcerpt={i % 3 === 2}
              />
            ))}
          </div>
        </section>

        {/* Right Rail (AGENDA + À LA UNE) — desktop col 10-12 ; hidden sur mobile */}
        <aside className="lg:col-span-3 space-y-8 order-2 lg:order-none hidden lg:block">
          <div className="bg-navy text-white p-6 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">AGENDA</span>
            <div className="space-y-2">
              <p className="font-headline font-black text-2xl uppercase tracking-tight">Prochaines courses</p>
              <p className="text-xs text-slate-300">Toutes les courses trail en France</p>
            </div>
            <Link href="/courses" className="bg-primary text-white px-6 py-2 text-xs font-headline font-bold hover:opacity-80 transition-opacity uppercase tracking-widest">
              VOIR LE CALENDRIER
            </Link>
          </div>
          <div className="space-y-6">
            <div className="bg-navy text-white py-2 px-4 font-headline font-bold uppercase text-sm inline-block">À LA UNE</div>
            <div className="space-y-4">
              {sidebarArticles.map((article, i) => (
                <div key={article.slug} className={i < sidebarArticles.length - 1 ? "border-b border-surface-container pb-4" : ""}>
                  <Link href={"/articles/" + article.slug} className="flex gap-3 group cursor-pointer">
                    <Image src={article.image} alt={article.title} width={64} height={64}
                      className="w-16 h-16 object-cover rounded-sm shrink-0" />
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold leading-tight group-hover:text-primary transition-colors">{article.title}</h5>
                      <span className="text-[10px] text-primary font-bold uppercase">{article.category}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Courses & Récits */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-12">
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

      {/* Science & Entraînement */}
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
            <p className="text-sm leading-relaxed text-slate-600">Recevez chaque vendredi le "Briefing des Cimes" : l'essentiel de l'actu trail dans votre boîte mail.</p>
            <input className="w-full border border-slate-200 text-xs px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="votre@email.com" type="email" />
            <button className="w-full bg-primary text-white py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors">
              S'ABONNER À LA NEWSLETTER
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
