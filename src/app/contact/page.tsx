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
