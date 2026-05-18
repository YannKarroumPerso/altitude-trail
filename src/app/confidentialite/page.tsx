import type { Metadata } from "next";
import { SITE_URL, SITE_NAME, absoluteUrl, buildWebPageJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/ui/JsonLd";
import Breadcrumb from "@/components/ui/Breadcrumb";

const TITLE = `Politique de confidentialité — ${SITE_NAME}`;
const DESCRIPTION = "Politique de confidentialité d'Altitude Trail : traitement des données personnelles, cookies, droits RGPD, durée de conservation.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/confidentialite") },
};

export const revalidate = 86400;

export default function Confidentialite() {
  return (
    <div className="bg-surface min-h-screen">
      <JsonLd
        data={buildWebPageJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          url: absoluteUrl("/confidentialite"),
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Accueil", url: SITE_URL },
          { label: "Confidentialité", url: absoluteUrl("/confidentialite") },
        ])}
      />
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Confidentialité" }]} />
        <h1 className="font-headline font-black text-4xl lg:text-5xl tracking-tighter mb-8 mt-6">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-slate-500 mb-10 italic">
          Dernière mise à jour : 18 mai 2026. Conforme au Règlement général sur la protection des données (RGPD).
        </p>

        <section className="space-y-6 text-base text-slate-700 leading-relaxed">
          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Responsable du traitement</h2>
            <p>
              <strong>Yann Karroum</strong>, éditeur d&apos;Altitude Trail.
              Contact : <a href="mailto:yannkarroum@gmail.com" className="text-primary hover:underline">yannkarroum@gmail.com</a>.
            </p>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Données collectées</h2>
            <p>
              Altitude Trail ne demande aucune création de compte. Aucune donnée personnelle directe (nom, adresse postale, téléphone) n&apos;est collectée pour la simple consultation du site.
            </p>
            <p className="mt-2">Les seules données traitées sont :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Adresse e-mail</strong> si vous vous inscrivez à la newsletter (formulaire en bas de page). Finalité : envoi du briefing éditorial. Base légale : consentement.</li>
              <li><strong>Données de navigation anonymisées</strong> via les cookies analytiques (cf section Cookies).</li>
              <li><strong>Adresses IP techniques</strong> conservées par l&apos;hébergeur Vercel pour les besoins de sécurité (durée légale, hors contrôle d&apos;Altitude Trail).</li>
            </ul>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Cookies</h2>
            <p>Altitude Trail utilise les catégories de cookies suivantes :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Cookies techniques</strong> : strictement nécessaires au fonctionnement du site (préférences d&apos;affichage, sécurité). Pas de consentement requis (article 82 loi Informatique &amp; Libertés).</li>
              <li><strong>Cookies de mesure d&apos;audience</strong> via Vercel Analytics — anonymisés, agrégés, sans identification individuelle. Conformité CNIL.</li>
              <li><strong>Cookies publicitaires Google AdSense</strong> — utilisés pour la diffusion d&apos;annonces et la mesure de leur performance. Consentement requis (Consent Mode v2 implémenté).</li>
              <li><strong>Cookies des liens partenaires</strong> (i-Run, Decathlon, autres) — déposés uniquement si vous cliquez sur un lien d&apos;affiliation, à des fins de mesure d&apos;attribution.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Vos droits</h2>
            <p>
              Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants sur vos données :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification et d&apos;effacement</li>
              <li>Droit à la portabilité</li>
              <li>Droit d&apos;opposition au traitement</li>
              <li>Droit de retirer votre consentement à tout moment</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits : <a href="mailto:yannkarroum@gmail.com?subject=RGPD%20-%20Mes%20donnees" className="text-primary hover:underline">yannkarroum@gmail.com</a>.
              Réponse sous un mois maximum (article 12 RGPD).
            </p>
            <p className="mt-2">
              Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL :
              {" "}<a href="https://www.cnil.fr/fr/plaintes" className="text-primary hover:underline" target="_blank" rel="noopener">cnil.fr/fr/plaintes</a>.
            </p>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Durée de conservation</h2>
            <p>
              Adresses e-mail de la newsletter : conservées tant que vous restez abonné, supprimées dans les 30 jours après désinscription.
              Données analytiques anonymisées : agrégées au-delà de 13 mois.
            </p>
          </div>

          <div>
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-navy mb-2">Transferts hors UE</h2>
            <p>
              Vercel (hébergeur) opère depuis les États-Unis. Google AdSense traite également des données aux États-Unis.
              Ces transferts sont encadrés par les clauses contractuelles types validées par la Commission européenne.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
