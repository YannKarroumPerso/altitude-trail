import Link from "next/link";
import { categories } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="bg-slate-950 py-16 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h4 className="text-xl font-black text-white font-headline uppercase tracking-tighter">
            ALTITUDE TRAIL
          </h4>
          <p className="text-xs tracking-wide text-slate-500 leading-relaxed">
            © {new Date().getFullYear()} Altitude Trail. Le magazine du trail running français. Built for the long run.
          </p>
          <div className="flex gap-4">
            <a href="/rss.xml" className="text-slate-400 hover:text-primary transition-colors text-xs">RSS</a>
            <Link href="/auteurs" className="text-slate-400 hover:text-primary transition-colors text-xs">Rédaction</Link>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">CATÉGORIES</h5>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="text-xs text-slate-500 hover:text-white transition-colors hover:underline underline-offset-4"
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">GUIDES & OUTILS</h5>
          <Link
            href="/guides/utmb"
            className="text-xs text-slate-500 hover:text-white transition-colors hover:underline underline-offset-4"
          >
            Guide complet UTMB
          </Link>
          <Link
            href="/trouver-une-course"
            className="text-xs text-slate-500 hover:text-white transition-colors hover:underline underline-offset-4"
          >
            Trouver une course
          </Link>
          <Link
            href="/entrainement/generateur"
            className="text-xs text-slate-500 hover:text-white transition-colors hover:underline underline-offset-4"
          >
            Générateur de plan
          </Link>
          <Link
            href="/lexique"
            className="text-xs text-slate-500 hover:text-white transition-colors hover:underline underline-offset-4"
          >
            Lexique du trail
          </Link>
          <Link
            href="/courses"
            className="text-xs text-slate-500 hover:text-white transition-colors hover:underline underline-offset-4"
          >
            Calendrier des courses
          </Link>
          <Link
            href="/a-propos"
            className="text-xs text-slate-500 hover:text-white transition-colors hover:underline underline-offset-4"
          >
            À propos
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
