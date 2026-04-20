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
