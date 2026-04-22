"use client";
import Link from "next/link";
import { useState } from "react";
import { categories } from "@/lib/data";

const GUIDES_TOOLS = [
  { href: "/guides/utmb", label: "Guide UTMB", desc: "La référence pour courir l'UTMB" },
  { href: "/courses", label: "Calendrier des courses", desc: "Carte et filtres de toutes les courses France" },
  { href: "/entrainement/generateur", label: "Plan d'entraînement", desc: "Générateur personnalisé gratuit" },
  { href: "/lexique", label: "Lexique du trail", desc: "40 termes essentiels" },
  { href: "/parcours", label: "Traces & parcours", desc: "Itinéraires GPX à découvrir" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Top Navy Bar */}
      <div className="bg-navy flex justify-between items-center w-full px-6 py-3 border-b border-white/10 relative">
        <div className="flex gap-4 items-center hidden md:flex">
          <a href="/sitemap.xml" className="text-slate-300 hover:text-white transition-colors text-sm">RSS</a>
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
            className="md:hidden text-white p-2 -mr-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
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
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className="nav-link">
                {cat.label}
              </Link>
            ))}

            {/* Dropdown Guides & Outils */}
            <div
              className="relative"
              onMouseEnter={() => setGuidesOpen(true)}
              onMouseLeave={() => setGuidesOpen(false)}
            >
              <button
                type="button"
                className="nav-link text-primary font-bold flex items-center gap-1"
                onClick={() => setGuidesOpen((v) => !v)}
                aria-expanded={guidesOpen}
                aria-haspopup="true"
              >
                Guides &amp; outils
                <svg className="w-3 h-3" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </button>
              {guidesOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 bg-white text-navy shadow-xl border border-surface-container min-w-[320px] z-50"
                  role="menu"
                >
                  <ul className="py-2">
                    {GUIDES_TOOLS.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="block px-5 py-3 hover:bg-surface-container transition-colors"
                          onClick={() => setGuidesOpen(false)}
                          role="menuitem"
                        >
                          <div className="font-headline font-black text-navy text-sm group-hover:text-primary">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {item.desc}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
                href={`/categories/${cat.slug}`}
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {cat.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-3 mt-1">
              <div className="text-[10px] font-headline font-black uppercase tracking-widest text-primary mb-2">
                Guides &amp; outils
              </div>
              {GUIDES_TOOLS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link block py-1.5"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link href="/contact" className="nav-link border-t border-white/10 pt-3" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </div>
        </div>
      )}

      {/* Tagline Banner */}
      <div className="bg-primary text-white py-2 px-8 text-center text-xs font-bold uppercase tracking-widest">
        Le media trail de référence
      </div>
    </header>
  );
}
