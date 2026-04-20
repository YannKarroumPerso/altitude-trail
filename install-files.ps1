# Script altitude-trail - copie tous les fichiers
Write-Host "Installation des fichiers altitude-trail..." -ForegroundColor Green

Write-Host "Ecriture de src\app\globals.css..."
$content = @'
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background-color: #f8f9ff;
    color: #0b1c30;
    font-family: 'Inter', sans-serif;
  }
}

@layer components {
  .newspaper-divider {
    position: relative;
    border-bottom: 2px solid #0b1c30;
    margin: 3rem 0 2.5rem 0;
    text-align: center;
  }
  .newspaper-divider span {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: #0b1c30;
    color: white;
    padding: 0.25rem 1.5rem;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.875rem;
    white-space: nowrap;
  }
}

'@
Set-Content -Path "src\app\globals.css" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\app\layout.tsx..."
$content = @'
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Altitude Trail — Le magazine du trail running",
  description: "Actualités, courses, entraînement, nutrition et récits de trail running en France et dans le monde.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

'@
Set-Content -Path "src\app\layout.tsx" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\app\page.tsx..."
$content = @'
import Link from "next/link";
import Image from "next/image";
import { articles, mostRead } from "@/lib/data";
import ArticleCard from "@/components/ui/ArticleCard";

const featuredArticle = articles[0];
const secondaryArticles = articles.slice(1, 3);
const sidebarArticles = articles.slice(3, 6);
const coursesRecits = articles.filter(a => a.categorySlug === "courses-recits").slice(0, 4);
const scienceArticles = articles.filter(a => a.categorySlug === "entrainement" || a.categorySlug === "nutrition").slice(0, 4);

export default function Home() {
  return (
    <div className="bg-surface">
      {/* Main 3-column grid */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Sidebar: LES PLUS CONSULTÉS */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-navy text-white py-2 px-4 font-headline font-bold uppercase text-sm inline-block">
            LES PLUS CONSULTÉS
          </div>
          <div className="space-y-6">
            {mostRead.map((article, i) => (
              <Link key={article.slug} href={``/articles/${article.slug}``} className="flex gap-4 group cursor-pointer">
                <div className="text-4xl font-headline font-black text-slate-300 group-hover:text-primary transition-colors leading-none shrink-0">
                  {i + 1}
                </div>
                <div className="space-y-1">
                  {article.image && i % 2 === 0 && (
                    <Image
                      src={article.image}
                      alt={article.title}
                      width={96}
                      height={64}
                      className="w-24 h-16 object-cover rounded shadow-sm grayscale group-hover:grayscale-0 transition-all mb-1"
                    />
                  )}
                  <h3 className="font-headline font-bold text-sm leading-snug group-hover:underline">
                    {article.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    {article.category} — {article.readTime}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </aside>

        {/* Central Column: Hero Article */}
        <section className="lg:col-span-6 space-y-8">
          <ArticleCard article={featuredArticle} variant="large" />

          {/* Secondary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-2 border-surface-container pt-8">
            {secondaryArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="default" />
            ))}
          </div>
        </section>

        {/* Right Rail */}
        <aside className="lg:col-span-3 space-y-8">
          {/* Promo bloc */}
          <div className="bg-navy text-white p-6 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">AGENDA</span>
            <div className="space-y-2">
              <p className="font-headline font-black text-2xl uppercase tracking-tight">Prochaines courses</p>
              <p className="text-xs text-slate-300">Retrouvez toutes les courses trail en France</p>
            </div>
            <Link href="/courses" className="bg-primary text-white px-6 py-2 text-xs font-headline font-bold rounded-sm hover:opacity-80 transition-opacity uppercase tracking-widest">
              VOIR LE CALENDRIER
            </Link>
          </div>

          {/* À LA UNE Sidebar */}
          <div className="space-y-6">
            <div className="bg-navy text-white py-2 px-4 font-headline font-bold uppercase text-sm inline-block">
              À LA UNE
            </div>
            <div className="space-y-4">
              {sidebarArticles.map((article, i) => (
                <div key={article.slug} className={i < sidebarArticles.length - 1 ? "border-b border-surface-container pb-4" : ""}>
                  <ArticleCard article={article} variant="horizontal" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Courses & Récits section */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-12">
        <div className="newspaper-divider">
          <span>COURSES &amp; RÉCITS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {coursesRecits.map((article) => (
            <Link key={article.slug} href={``/articles/${article.slug}``} className="space-y-4 group cursor-pointer block">
              <Image
                src={article.image}
                alt={article.title}
                width={400}
                height={300}
                className="w-full aspect-[4/3] object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
              />
              <h3 className="font-headline font-bold text-lg leading-tight group-hover:underline">
                {article.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Science & Entraînement section */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-20">
        <div className="newspaper-divider">
          <span>SCIENCE &amp; ENTRAÎNEMENT</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
          <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {scienceArticles.map((article) => (
              <Link key={article.slug} href={``/articles/${article.slug}``} className="flex gap-4 group">
                <div className="shrink-0 w-24 h-24 bg-surface-container-high flex items-center justify-center text-3xl">
                  🏃
                </div>
                <div className="space-y-2">
                  <h4 className="font-headline font-bold text-xl group-hover:text-primary transition-colors">{article.title}</h4>
                  <p className="text-sm text-slate-600 line-clamp-2">{article.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div className="bg-white p-6 border-l-2 border-primary shadow-sm space-y-6">
            <h3 className="font-headline font-black text-2xl tracking-tighter italic uppercase">Altitude Trail</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Recevez chaque vendredi le "Briefing des Cimes" : l'essentiel de l'actu trail condensé directement dans votre boîte mail.
            </p>
            <div className="space-y-3">
              <input
                className="w-full border border-slate-200 text-xs px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="votre@email.com"
                type="email"
              />
              <button className="w-full bg-primary text-white py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors">
                S'ABONNER À LA NEWSLETTER
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

'@
Set-Content -Path "src\app\page.tsx" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\app\courses\page.tsx..."
$content = @'
import { races } from "@/lib/data";
import Link from "next/link";

const difficultyColor: Record<string, string> = {
  "Facile": "bg-green-100 text-green-800",
  "Modéré": "bg-yellow-100 text-yellow-800",
  "Difficile": "bg-orange-100 text-orange-800",
  "Extrême": "bg-red-100 text-red-800",
};

export default function CoursesPage() {
  const regions = [...new Set(races.map((r) => r.region))].sort();
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <div className="border-b-2 border-navy pb-6 mb-12">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-headline uppercase tracking-wide">
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <span>/</span>
          <span>Courses en France</span>
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">Courses de Trail en France</h1>
        <p className="text-slate-500 mt-2">Le calendrier des courses — {races.length} courses répertoriées</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-10">
        <span className="text-xs font-headline font-bold uppercase tracking-wide text-slate-500 self-center mr-2">Région :</span>
        <button className="px-4 py-2 text-xs font-headline font-bold uppercase bg-navy text-white">Toutes</button>
        {regions.map((region) => (
          <button key={region} className="px-4 py-2 text-xs font-headline font-bold uppercase bg-surface-container text-navy hover:bg-navy hover:text-white transition-colors">
            {region}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy text-white font-headline text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Course</th>
              <th className="text-left px-4 py-3">Lieu</th>
              <th className="text-left px-4 py-3">Région</th>
              <th className="text-left px-4 py-3">Date 2025</th>
              <th className="text-left px-4 py-3">Distance</th>
              <th className="text-left px-4 py-3">D+</th>
              <th className="text-left px-4 py-3">Difficulté</th>
              <th className="text-left px-4 py-3">Site</th>
            </tr>
          </thead>
          <tbody>
            {races.map((race, i) => (
              <tr key={race.id} className={"border-b border-surface-container hover:bg-surface-container transition-colors " + (i % 2 === 0 ? "bg-white" : "bg-surface")}>
                <td className="px-4 py-4 font-headline font-bold">{race.name}</td>
                <td className="px-4 py-4 text-slate-600">{race.location}</td>
                <td className="px-4 py-4 text-slate-500 text-xs">{race.region}</td>
                <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{race.date}</td>
                <td className="px-4 py-4 font-bold text-primary">{race.distance}</td>
                <td className="px-4 py-4 text-slate-600">{race.elevation}</td>
                <td className="px-4 py-4">
                  <span className={"px-2 py-0.5 text-xs font-bold rounded-sm " + (difficultyColor[race.difficulty] || "")}>
                    {race.difficulty}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {race.website ? (
                    <a href={race.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-bold">Voir →</a>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 bg-navy text-white p-8 text-center space-y-4">
        <h3 className="font-headline text-2xl font-black uppercase">Votre course n'est pas dans la liste ?</h3>
        <p className="text-slate-300 text-sm">Contactez-nous pour ajouter votre événement trail.</p>
        <Link href="/contact" className="inline-block bg-primary text-white px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-opacity">
          NOUS CONTACTER
        </Link>
      </div>
    </div>
  );
}

'@
Set-Content -Path "src\app\courses\page.tsx" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\app\categories\[slug]\page.tsx..."
$content = @'
import { articles, categories } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArticleCard from "@/components/ui/ArticleCard";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const categoryArticles = articles.filter((a) => a.categorySlug === slug);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      {/* Header */}
      <div className="border-b-2 border-navy pb-6 mb-12">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-headline uppercase tracking-wide">
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <span>/</span>
          <span>{category.label}</span>
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">{category.label}</h1>
        <p className="text-slate-500 mt-2">{category.description}</p>
      </div>

      {/* All categories nav */}
      <div className="flex flex-wrap gap-3 mb-12">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={``/categories/${cat.slug}``}
            className={``px-4 py-2 text-xs font-headline font-bold uppercase tracking-wide transition-colors ${
              cat.slug === slug
                ? "bg-navy text-white"
                : "bg-surface-container text-navy hover:bg-navy hover:text-white"
            }``}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {categoryArticles.length === 0 ? (
        <p className="text-slate-500 text-center py-20">Aucun article dans cette catégorie pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {categoryArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} variant="default" />
          ))}
        </div>
      )}
    </div>
  );
}

'@
Set-Content -Path "src\app\categories\[slug]\page.tsx" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\app\articles\[slug]\page.tsx..."
$content = @'
import { articles } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ArticleCard from "@/components/ui/ArticleCard";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = articles.filter((a) => a.categorySlug === article.categorySlug && a.slug !== slug).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-headline uppercase tracking-wide">
        <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
        <span>/</span>
        <Link href={``/categories/${article.categorySlug}``} className="hover:text-primary transition-colors">{article.category}</Link>
        <span>/</span>
        <span className="text-on-surface">{article.title.slice(0, 40)}...</span>
      </div>

      {/* Category badge */}
      <div className="mb-4">
        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 tracking-tighter uppercase font-headline">
          {article.category}
        </span>
      </div>

      {/* Title */}
      <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-6">
        {article.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold uppercase tracking-wide mb-8 border-b border-surface-container pb-6">
        <span>Par {article.author}</span>
        <span>·</span>
        <span>{article.date}</span>
        <span>·</span>
        <span>{article.readTime} de lecture</span>
      </div>

      {/* Hero image */}
      <div className="mb-8 overflow-hidden">
        <Image
          src={article.image}
          alt={article.title}
          width={1200}
          height={675}
          className="w-full aspect-video object-cover"
        />
      </div>

      {/* Excerpt */}
      <p className="text-xl text-slate-600 italic border-l-4 border-primary pl-6 mb-8 leading-relaxed">
        {article.excerpt}
      </p>

      {/* Content placeholder */}
      <div className="prose prose-lg max-w-none space-y-6 text-slate-700 leading-relaxed">
        <p>
          Le trail running est bien plus qu'un sport — c'est une philosophie de vie, une façon d'appréhender la montagne et ses défis. Dans cet article, nous explorons en profondeur tous les aspects de ce sujet passionnant qui touche des milliers de coureurs en France et dans le monde entier.
        </p>
        <p>
          Que vous soyez débutant cherchant vos premiers kilomètres en nature ou ultra-traileur expérimenté visant les plus grandes courses mondiales, les enjeux restent les mêmes : repousser ses limites, se connecter à la nature, et partager cette passion avec une communauté extraordinaire.
        </p>
        <h2 className="font-headline text-3xl font-black mt-10 mb-4">Les fondamentaux</h2>
        <p>
          La préparation est la clé de tout. Sans une base solide d'entraînement progressif, aucun objectif ambitieux ne peut être atteint durablement. Les meilleurs traileurs du monde consacrent des années à construire leur moteur aérobie avant de viser les podiums.
        </p>
        <p>
          La gestion de l'effort, la lecture du terrain, la nutrition adaptée — chaque paramètre compte. C'est cette complexité qui rend le trail si exigeant et si enrichissant à la fois.
        </p>
        <h2 className="font-headline text-3xl font-black mt-10 mb-4">En pratique</h2>
        <p>
          Sur le terrain, la théorie laisse place à l'instinct. Des années d'entraînement cristallisées en quelques heures d'effort intense, où chaque décision — s'alimenter, ralentir, accélérer — peut faire la différence entre une belle performance et un abandon.
        </p>
      </div>

      {/* Tags */}
      {article.tags && (
        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-surface-container">
          {article.tags.map((tag) => (
            <span key={tag} className="bg-surface-container text-xs font-bold px-3 py-1 font-headline uppercase tracking-wide">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Related articles */}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="newspaper-divider mb-10">
            <span>ARTICLES SIMILAIRES</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} variant="default" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'@
Set-Content -Path "src\app\articles\[slug]\page.tsx" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\app\contact\page.tsx..."
$content = @'
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-12">
      <div className="border-b-2 border-navy pb-6 mb-12">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-headline uppercase tracking-wide">
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <span>/</span>
          <span>Contact</span>
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">Contactez-nous</h1>
        <p className="text-slate-500 mt-2">Une question, un partenariat, une course à référencer ? On vous répond.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div className="space-y-6">
          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-headline font-black text-lg uppercase">Rédaction</h3>
            <p className="text-sm text-slate-600 mt-1">redaction@altitude-trail.fr</p>
          </div>
          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-headline font-black text-lg uppercase">Partenariats</h3>
            <p className="text-sm text-slate-600 mt-1">partenariat@altitude-trail.fr</p>
          </div>
          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-headline font-black text-lg uppercase">Référencer une course</h3>
            <p className="text-sm text-slate-600 mt-1">Utilisez le formulaire ci-contre pour soumettre votre événement trail à notre calendrier.</p>
          </div>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-wide text-slate-600 mb-2">Nom *</label>
            <input type="text" className="w-full border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Votre nom" />
          </div>
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-wide text-slate-600 mb-2">Email *</label>
            <input type="email" className="w-full border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="votre@email.com" />
          </div>
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-wide text-slate-600 mb-2">Sujet</label>
            <select className="w-full border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
              <option>Question générale</option>
              <option>Soumettre un article</option>
              <option>Référencer une course</option>
              <option>Partenariat / Publicité</option>
              <option>Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-headline font-bold uppercase tracking-wide text-slate-600 mb-2">Message *</label>
            <textarea rows={5} className="w-full border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Votre message..." />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-4 font-headline font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors">
            ENVOYER LE MESSAGE
          </button>
        </form>
      </div>
    </div>
  );
}

'@
Set-Content -Path "src\app\contact\page.tsx" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\components\layout\Footer.tsx..."
$content = @'
import Link from "next/link";
import { categories } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="bg-slate-950 py-16 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <h4 className="text-xl font-black text-white font-headline uppercase tracking-tighter">
            ALTITUDE TRAIL
          </h4>
          <p className="text-xs tracking-wide text-slate-500 leading-relaxed">
            © {new Date().getFullYear()} Altitude Trail. Le magazine du trail running français. Built for the long run.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-400 hover:text-primary transition-colors text-xs">RSS</a>
            <a href="#" className="text-slate-400 hover:text-primary transition-colors text-xs">Instagram</a>
            <a href="#" className="text-slate-400 hover:text-primary transition-colors text-xs">Strava</a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">CATÉGORIES</h5>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={``/categories/${cat.slug}``}
              className="text-xs text-slate-500 hover:text-white transition-colors hover:underline underline-offset-4"
            >
              {cat.label}
            </Link>
          ))}
          <Link
            href="/courses"
            className="text-xs text-slate-500 hover:text-white transition-colors hover:underline underline-offset-4"
          >
            Courses en France
          </Link>
          <Link
            href="/contact"
            className="text-xs text-slate-500 hover:text-white transition-colors hover:underline underline-offset-4"
          >
            Contact
          </Link>
        </div>

        <div className="space-y-4">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">NEWSLETTER</h5>
          <p className="text-xs text-slate-400 leading-relaxed">
            Recevez chaque vendredi le "Briefing des Cimes" : l'essentiel de l'actu trail condensé.
          </p>
          <div className="flex">
            <input
              className="bg-slate-900 border-none text-xs flex-grow px-4 text-white h-10 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="votre@email.com"
              type="email"
            />
            <button className="bg-primary text-white px-6 font-headline font-bold text-[10px] uppercase h-10 hover:bg-primary-dark transition-colors">
              OK
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

'@
Set-Content -Path "src\components\layout\Footer.tsx" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\components\layout\Header.tsx..."
$content = @'
"use client";
import Link from "next/link";
import { useState } from "react";
import { categories } from "@/lib/data";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Top Navy Bar */}
      <div className="bg-navy flex justify-between items-center w-full px-6 py-3 border-b border-white/10 relative">
        <div className="flex gap-4 items-center">
          <a href="#" className="text-slate-300 hover:text-white transition-colors text-sm">RSS</a>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link href="/">
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter font-headline uppercase">
              Altitude Trail
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="bg-primary hover:opacity-80 transition-opacity text-white px-4 py-1.5 font-headline font-black text-xs tracking-widest rounded-md hidden md:block"
          >
            CONTACT
          </Link>
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Secondary Navigation (desktop) */}
      <nav className="bg-navy w-full border-t border-white/5 shadow-xl hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {categories.map((cat) => (
              <Link key={cat.slug} href={``/categories/${cat.slug}``} className="nav-link">
                {cat.label}
              </Link>
            ))}
            <Link href="/courses" className="nav-link text-primary font-bold">
              Courses en France
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="bg-navy border-t border-white/10 md:hidden">
          <div className="flex flex-col px-6 py-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={``/categories/${cat.slug}``}
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {cat.label}
              </Link>
            ))}
            <Link href="/courses" className="nav-link text-primary font-bold" onClick={() => setMenuOpen(false)}>
              Courses en France
            </Link>
            <Link href="/contact" className="nav-link" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </div>
        </div>
      )}

      {/* Alert Banner */}
      <div className="bg-primary text-white py-2 px-8 flex justify-center items-center gap-3 text-xs font-bold uppercase tracking-widest">
        <span>⚡</span>
        <span>DIRECT : Suivez la Diagonale des Fous en temps réel sur Altitude Trail !</span>
        <span>→</span>
      </div>
    </header>
  );
}

'@
Set-Content -Path "src\components\layout\Header.tsx" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\components\ui\ArticleCard.tsx..."
$content = @'
import Link from "next/link";
import Image from "next/image";
import { Article } from "@/types";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "horizontal" | "mini" | "large";
}

export default function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  if (variant === "large") {
    return (
      <Link href={``/articles/${article.slug}``} className="group cursor-pointer block">
        <div className="overflow-hidden">
          <Image
            src={article.image}
            alt={article.title}
            width={900}
            height={562}
            className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 tracking-tighter uppercase font-headline">
              À LA UNE
            </span>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
              PAR {article.author} — {article.date}
            </span>
          </div>
          <h2 className="font-headline text-3xl lg:text-5xl font-black leading-none tracking-tighter group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p className="text-slate-600 leading-relaxed text-lg italic border-l-4 border-primary pl-4">
            {article.excerpt}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link href={``/articles/${article.slug}``} className="flex gap-3 group cursor-pointer">
        <Image
          src={article.image}
          alt={article.title}
          width={64}
          height={64}
          className="w-16 h-16 object-cover rounded-sm shrink-0"
        />
        <div className="space-y-1">
          <h5 className="text-xs font-bold leading-tight group-hover:text-primary transition-colors">
            {article.title}
          </h5>
          <span className="text-[10px] text-primary font-bold uppercase">{article.category}</span>
        </div>
      </Link>
    );
  }

  if (variant === "mini") {
    return (
      <Link href={``/articles/${article.slug}``} className="flex gap-4 group cursor-pointer">
        <div className="text-4xl font-headline font-black text-slate-300 group-hover:text-primary transition-colors leading-none shrink-0">
          {article.readTime}
        </div>
        <div className="space-y-1">
          <h3 className="font-headline font-bold text-sm leading-snug group-hover:underline">
            {article.title}
          </h3>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            {article.category} — {article.readTime} READ
          </p>
        </div>
      </Link>
    );
  }

  // default
  return (
    <Link href={``/articles/${article.slug}``} className="space-y-3 group cursor-pointer block">
      <div className="overflow-hidden">
        <Image
          src={article.image}
          alt={article.title}
          width={400}
          height={400}
          className="w-full aspect-square object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-primary font-bold uppercase tracking-wider font-headline">
          {article.category}
        </span>
        <span className="text-[10px] text-slate-400">· {article.readTime}</span>
      </div>
      <h4 className="font-headline font-bold text-xl leading-tight group-hover:text-primary transition-colors">
        {article.title}
      </h4>
      <p className="text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
    </Link>
  );
}

'@
Set-Content -Path "src\components\ui\ArticleCard.tsx" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\lib\data.ts..."
$content = @'
import { Article, Race, Category } from "@/types";

export const categories: Category[] = [
  { slug: "actualites", label: "Actualités", description: "Les dernières nouvelles du monde du trail running" },
  { slug: "debuter", label: "Débuter", description: "Tous les conseils pour se lancer dans le trail" },
  { slug: "courses-recits", label: "Courses & Récits", description: "Récits de course et comptes rendus" },
  { slug: "nutrition", label: "Nutrition", description: "Alimentation et ravitaillement pour le trail" },
  { slug: "entrainement", label: "Entraînement & Performances", description: "Plans d'entraînement et conseils de performance" },
  { slug: "blessures", label: "Blessures & Préventions", description: "Prévention et récupération des blessures" },
];

export const articles: Article[] = [
  {
    slug: "diagonale-des-fous-2024",
    title: "DIAGONALE DES FOUS : LE MYTHE RÉINVENTÉ.",
    excerpt: "Traverser l'île de la Réunion n'est plus une course, c'est un pèlerinage brutal vers la limite de soi. Décryptage d'une édition qui s'annonce historique.",
    category: "Courses & Récits",
    categorySlug: "courses-recits",
    author: "Rédaction Altitude",
    date: "24 octobre 2024",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=80",
    featured: true,
    tags: ["Diagonale des Fous", "Réunion", "Ultra"],
  },
  {
    slug: "kilian-jornet-endurance",
    title: "Comment Kilian Jornet a redéfini les limites de l'endurance pure",
    excerpt: "Analyse de la carrière et des méthodes d'entraînement de la légende catalane du trail mondial.",
    category: "Actualités",
    categorySlug: "actualites",
    author: "Marc Dubois",
    date: "20 octobre 2024",
    readTime: "12 min",
    image: "https://images.unsplash.com/photo-1590659534532-ffc89be3e22b?w=800&q=80",
    tags: ["Kilian Jornet", "Performance"],
  },
  {
    slug: "chaussures-carbone-trail-2024",
    title: "Test Chaussures : Les meilleures plaques carbone pour le trail 2024",
    excerpt: "Notre sélection des meilleures chaussures à plaque carbone testées sur le terrain.",
    category: "Actualités",
    categorySlug: "actualites",
    author: "Sophie Martin",
    date: "18 octobre 2024",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    tags: ["Équipement", "Chaussures"],
  },
  {
    slug: "nutrition-ultra-erreurs",
    title: "Nutrition : 5 erreurs fatales à éviter sur ultra-marathon",
    excerpt: "Les dernières études scientifiques montrent que la gestion de l'osmolalité est cruciale au-delà de 10h d'effort.",
    category: "Nutrition",
    categorySlug: "nutrition",
    author: "Dr. Paul Lefèvre",
    date: "15 octobre 2024",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=800&q=80",
    tags: ["Nutrition", "Ultra", "Science"],
  },
  {
    slug: "utmb-2025-tirage",
    title: "UTMB 2025 : Les nouvelles règles de tirage au sort expliquées",
    excerpt: "World Athletics Running majors change les règles. Ce que ça change pour vous.",
    category: "Actualités",
    categorySlug: "actualites",
    author: "Rédaction Altitude",
    date: "12 octobre 2024",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800&q=80",
    tags: ["UTMB", "Réglementation"],
  },
  {
    slug: "trail-asie-du-sud-est",
    title: "Dossier : La montée en puissance du trail en Asie du Sud-Est",
    excerpt: "Vietnam, Thaïlande, Philippines — le trail explose dans toute la région. Reportage au cœur de cette révolution.",
    category: "Courses & Récits",
    categorySlug: "courses-recits",
    author: "Julie Nguyen",
    date: "10 octobre 2024",
    readTime: "15 min",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    tags: ["Asie", "Voyage"],
  },
  {
    slug: "hydratation-sel",
    title: "Hydratation : Pourquoi le sel est votre meilleur allié",
    excerpt: "Les électrolytes et leur rôle crucial dans la performance en trail longue distance.",
    category: "Nutrition",
    categorySlug: "nutrition",
    author: "Dr. Paul Lefèvre",
    date: "8 octobre 2024",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    tags: ["Nutrition", "Hydratation"],
  },
  {
    slug: "calendrier-2025-top-10",
    title: "Calendrier : Les 10 courses à ne pas rater en 2025",
    excerpt: "De la Patagonie aux Alpes, notre sélection exclusive pour planifier votre saison.",
    category: "Courses & Récits",
    categorySlug: "courses-recits",
    author: "Marc Dubois",
    date: "5 octobre 2024",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    tags: ["Calendrier", "2025"],
  },
  {
    slug: "renforcement-excentrique",
    title: "Le renforcement excentrique pour les descentes",
    excerpt: "Pourquoi vos quadriceps vous lâchent en descente et comment y remédier avec 3 exercices clés.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    author: "Thomas Bernard",
    date: "2 octobre 2024",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    tags: ["Entraînement", "Force"],
  },
  {
    slug: "utmb-col-bonhomme",
    title: "UTMB : Les secrets de la montée vers le Col du Bonhomme",
    excerpt: "Stratégie, gestion de l'effort et mental — tout ce qu'il faut savoir sur ce passage emblématique.",
    category: "Courses & Récits",
    categorySlug: "courses-recits",
    author: "Marc Dubois",
    date: "28 septembre 2024",
    readTime: "10 min",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
    tags: ["UTMB", "Alpes", "Technique"],
  },
  {
    slug: "fkt-appalaches",
    title: "FKT : Nouveau record sur le Sentier des Appalaches",
    excerpt: "Un ultratraileur américain pulvérise le record de vitesse sur les 3 500 km du trail légendaire.",
    category: "Actualités",
    categorySlug: "actualites",
    author: "Rédaction Altitude",
    date: "25 septembre 2024",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    tags: ["FKT", "Record"],
  },
  {
    slug: "debuter-trail-guide-complet",
    title: "Guide complet pour débuter le trail en 2024",
    excerpt: "Équipement, entraînement, nutrition — tout ce dont vous avez besoin pour vous lancer.",
    category: "Débuter",
    categorySlug: "debuter",
    author: "Sophie Martin",
    date: "20 septembre 2024",
    readTime: "20 min",
    image: "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=800&q=80",
    tags: ["Débutant", "Guide"],
  },
];

export const races: Race[] = [
  {
    id: "utmb",
    name: "Ultra-Trail du Mont-Blanc (UTMB)",
    location: "Chamonix",
    department: "Haute-Savoie (74)",
    region: "Auvergne-Rhône-Alpes",
    date: "25 août 2025",
    distance: "171 km",
    elevation: "+10 000 m",
    difficulty: "Extrême",
    website: "https://utmb.world",
    description: "La course de trail la plus emblématique au monde, autour du Mont-Blanc.",
  },
  {
    id: "grand-raid-reunion",
    name: "Diagonale des Fous",
    location: "Saint-Pierre, La Réunion",
    department: "La Réunion (974)",
    region: "Océan Indien",
    date: "17 octobre 2025",
    distance: "165 km",
    elevation: "+9 643 m",
    difficulty: "Extrême",
    website: "https://grandraid-reunion.com",
    description: "La traversée de l'île de la Réunion, une des courses les plus dures du monde.",
  },
  {
    id: "maxi-race-annecy",
    name: "Maxi-Race du Lac d'Annecy",
    location: "Annecy",
    department: "Haute-Savoie (74)",
    region: "Auvergne-Rhône-Alpes",
    date: "10 mai 2025",
    distance: "85 km",
    elevation: "+5 700 m",
    difficulty: "Difficile",
    website: "https://maxi-race.com",
    description: "Le tour du lac d'Annecy en trail, avec une vue imprenable sur les Alpes.",
  },
  {
    id: "ecotrail-paris",
    name: "EcoTrail de Paris",
    location: "Paris",
    department: "Ile-de-France (75)",
    region: "Île-de-France",
    date: "22 mars 2025",
    distance: "80 km",
    elevation: "+1 000 m",
    difficulty: "Modéré",
    website: "https://ecotrailparis.com",
    description: "Un trail autour de Paris, de Versailles au Trocadéro.",
  },
  {
    id: "transgrancanaria",
    name: "Trail des Templiers",
    location: "Millau",
    department: "Aveyron (12)",
    region: "Occitanie",
    date: "25 octobre 2025",
    distance: "73 km",
    elevation: "+3 800 m",
    difficulty: "Difficile",
    website: "https://traildesgrandscausses.com",
    description: "Un trail mythique dans les Gorges du Tarn et les Grands Causses.",
  },
  {
    id: "oxy-trail",
    name: "Oxy'Trail",
    location: "Forêt de Saint-Germain-en-Laye",
    department: "Yvelines (78)",
    region: "Île-de-France",
    date: "29 mars 2025",
    distance: "34 km",
    elevation: "+500 m",
    difficulty: "Facile",
    description: "Course idéale pour débuter, dans la forêt de Saint-Germain-en-Laye.",
  },
  {
    id: "trail-blanc-combloux",
    name: "Trail Blanc de Combloux",
    location: "Combloux",
    department: "Haute-Savoie (74)",
    region: "Auvergne-Rhône-Alpes",
    date: "15 janvier 2025",
    distance: "30 km",
    elevation: "+1 800 m",
    difficulty: "Difficile",
    description: "Un trail en conditions hivernales sur les pentes du Mont-Blanc.",
  },
  {
    id: "marathon-du-mont-blanc",
    name: "Marathon du Mont-Blanc",
    location: "Chamonix",
    department: "Haute-Savoie (74)",
    region: "Auvergne-Rhône-Alpes",
    date: "28 juin 2025",
    distance: "42 km",
    elevation: "+2 800 m",
    difficulty: "Difficile",
    website: "https://marathondumontblanc.fr",
    description: "42 km autour des aiguilles de Chamonix, un classique absolu.",
  },
  {
    id: "trail-du-golfe-du-morbihan",
    name: "Trail du Golfe du Morbihan",
    location: "Vannes",
    department: "Morbihan (56)",
    region: "Bretagne",
    date: "6 avril 2025",
    distance: "55 km",
    elevation: "+800 m",
    difficulty: "Modéré",
    description: "Un trail côtier magnifique autour du Golfe du Morbihan.",
  },
  {
    id: "trail-des-forts",
    name: "Trail des Forts",
    location: "Verdun",
    department: "Meuse (55)",
    region: "Grand Est",
    date: "18 mai 2025",
    distance: "50 km",
    elevation: "+1 200 m",
    difficulty: "Modéré",
    description: "Un trail dans les forêts chargées d'histoire autour de Verdun.",
  },
];

export const mostRead = articles.slice(0, 5);
export const featuredArticle = articles[0];
export const latestArticles = articles.slice(1, 7);

'@
Set-Content -Path "src\lib\data.ts" -Value $content -Encoding UTF8

Write-Host "Ecriture de src\types\index.ts..."
$content = @'
export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
  tags?: string[];
  content?: string;
}

export interface Race {
  id: string;
  name: string;
  location: string;
  department: string;
  region: string;
  date: string;
  distance: string;
  elevation: string;
  difficulty: "Facile" | "Modéré" | "Difficile" | "Extrême";
  website?: string;
  description?: string;
}

export interface Category {
  slug: string;
  label: string;
  description: string;
}

'@
Set-Content -Path "src\types\index.ts" -Value $content -Encoding UTF8

Write-Host "Ecriture de next.config.ts..."
$content = @'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;

'@
Set-Content -Path "next.config.ts" -Value $content -Encoding UTF8

Write-Host "Ecriture de tailwind.config.ts..."
$content = @'
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff4500",
        "primary-dark": "#d83900",
        navy: "#0b1c30",
        "navy-light": "#1a2f47",
        surface: "#f8f9ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "on-surface": "#0b1c30",
        outline: "#926f66",
        "outline-variant": "#e7bdb2",
      },
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;

'@
Set-Content -Path "tailwind.config.ts" -Value $content -Encoding UTF8

Write-Host "Tous les fichiers sont ecrits!" -ForegroundColor Green
Write-Host "Lance: npm run dev" -ForegroundColor Yellow