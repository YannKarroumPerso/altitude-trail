import type { Metadata } from "next";
import { SITE_URL, SITE_NAME, absoluteUrl, buildWebPageJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/ui/JsonLd";
import Breadcrumb from "@/components/ui/Breadcrumb";

const TITLE = `Mentions légales — ${SITE_NAME}`;
const DESCRIPTION = "Mentions légales d'Altitude Trail : éditeur, directeur de publication, hébergeur, conformément à la loi pour la confiance dans l'économie numérique (LCEN, article 6).";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/mentions-legales") },
};

export const revalidate = 86400; // 1j

export default function MentionsLegales() {
  return (
    <div className="bg-surface min-h-screen">
      <JsonLd
        data={buildWebPageJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          url: absoluteUrl("/mentions-legales"),
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Accueil", url: SITE_URL },
          { label: "Mentions légales", url: absoluteUrl("/mentions-legales") },
        ])}
      />
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Mentions légales" }]} />
        <h1 className="font-headline font-black text-4xl lg:text-5xl tracking-tighter mb-8 mt-6">
          Mentions légales
        </h1>
        <p className="text-sm text-slate-500 mb-10 italic">
          Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN), article 6.
        </p>

        <section className="space-y-6 text-base text-slate-700 leading-relaxed">
          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Éditeur du site</h2>
            <p>
              <strong>Altitude Trail</strong> est un projet éditorial individuel dirigé par <strong>Yann Karroum</strong>,
              passionné de trail running. Contact : <a href="mailto:yannkarroum@gmail.com" className="text-primary hover:underline">yannkarroum@gmail.com</a>.
            </p>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Directeur de la publication</h2>
            <p>Yann Karroum.</p>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Hébergeur</h2>
            <p>
              Site hébergé par <strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
              Site officiel : <a href="https://vercel.com" className="text-primary hover:underline" target="_blank" rel="noopener">vercel.com</a>.
            </p>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu publié sur altitude-trail.fr (articles, illustrations, mise en page, code source, marque <em>Altitude Trail</em>) est protégé par le droit d&apos;auteur.
              Toute reproduction, représentation ou diffusion, intégrale ou partielle, sans autorisation écrite préalable est interdite.
              Les courtes citations sont autorisées dans les conditions de l&apos;article L. 122-5 du Code de la propriété intellectuelle (mention de la source obligatoire).
            </p>
            <p className="mt-2">
              Les illustrations générées par intelligence artificielle (Google Gemini Nano Banana) sont la propriété d&apos;Altitude Trail.
              Les marques tierces citées (UTMB, Western States, Salomon, Hoka, Decathlon, etc.) appartiennent à leurs détenteurs respectifs.
            </p>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Liens externes</h2>
            <p>
              Altitude Trail cite régulièrement ses sources externes (iRunFar, Freetrail, sites officiels d&apos;événements, presse spécialisée).
              La responsabilité éditoriale de ces sites tiers appartient à leurs auteurs respectifs.
              Altitude Trail ne saurait être tenu responsable du contenu accessible via ces liens.
            </p>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Liens partenaires</h2>
            <p>
              Certains articles équipement comportent des liens d&apos;affiliation vers des e-marchands (i-Run, Decathlon).
              Altitude Trail peut percevoir une commission sur les achats effectués via ces liens, sans surcoût pour le lecteur.
              Ce partenariat n&apos;influence pas la ligne éditoriale ni le contenu des articles, comme indiqué explicitement à proximité de chaque lien d&apos;affiliation.
            </p>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Signaler une erreur ou un contenu</h2>
            <p>
              Pour signaler une erreur factuelle, demander un droit de réponse, ou contester un contenu :{" "}
              <a href="mailto:yannkarroum@gmail.com?subject=Signaler%20un%20contenu" className="text-primary hover:underline">
                yannkarroum@gmail.com
              </a>.
            </p>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Confidentialité &amp; cookies</h2>
            <p>
              Le traitement des données personnelles et la politique de cookies font l&apos;objet d&apos;une page dédiée :{" "}
              <a href="/confidentialite" className="text-primary hover:underline">politique de confidentialité</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
