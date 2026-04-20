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
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className="nav-link">
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
                href={`/categories/${cat.slug}`}
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

      {/* Tagline Banner */}
      <div className="bg-primary text-white py-2 px-8 text-center text-xs font-bold uppercase tracking-widest">
        Le média trail de référence
      </div>
    </header>
  );
}
