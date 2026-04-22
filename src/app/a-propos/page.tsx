import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/ui/JsonLd";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  AUTHOR_NAME,
  AUTHOR_URL,
  LOGO_SQUARE_URL,
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd,
  buildPersonJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo";

const TITLE = `À propos — ${SITE_NAME}`;
const DESCRIPTION =
  "Altitude Trail, magazine analytique du trail running français : rédaction, politique éditoriale, contact et mentions légales.";

export const metadata: Metadata = {
  title: "À propos",
  description: DESCRIPTION,
  alternates: { canonical: "/a-propos", languages: { fr: "/a-propos" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/a-propos`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function AboutPage() {
  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "À propos" },
  ];
  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd
        data={buildWebPageJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          url: AUTHOR_URL,
          breadcrumb: [
            { label: "Accueil", url: SITE_URL },
            { label: "À propos", url: AUTHOR_URL },
          ],
        })}
      />
      <JsonLd
        data={buildPersonJsonLd({
          name: AUTHOR_NAME,
          url: AUTHOR_URL,
          jobTitle: "Rédaction éditoriale trail running",
          description:
            "Collectif de rédacteurs spécialistes du trail running, de l'ultra-endurance et de la montagne. Signe l'ensemble des analyses et reportages d'Altitude Trail.",
          image: LOGO_SQUARE_URL,
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Accueil", url: SITE_URL },
          { label: "À propos", url: `${SITE_URL}/a-propos` },
        ])}
      />
      <Breadcrumb items={breadcrumb} />
      <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-8">
        À propos d&apos;Altitude Trail
      </h1>

      <p className="text-xl text-slate-600 italic border-l-4 border-primary pl-6 mb-10 leading-relaxed">
        {SITE_DESCRIPTION}
      </p>

      <section className="prose max-w-none text-slate-700 leading-relaxed text-lg space-y-4 mb-12">
        <h2 className="font-headline text-3xl font-black mt-8 mb-3">La rédaction</h2>
        <p>
          {AUTHOR_NAME} est une équipe éditoriale spécialisée dans la
          couverture analytique du trail running, de l&apos;ultra-endurance et
          de la course en montagne. Nos références : The Athletic, Running
          Magazine, Trail Runner Mag. Nous revendiquons un angle éditorial —
          pas de paraphrase, pas de communiqué recyclé.
        </p>
        <p>
          Chaque article combine l&apos;expertise terrain d&apos;un rédacteur
          trail et la relecture analytique d&apos;un coordinateur éditorial.
          Les chiffres, dates et classements cités proviennent exclusivement
          des sources officielles des épreuves, de la presse spécialisée
          (lepape-info, u-Trail, iRunFar, Trail Runner Mag, Ultrarunning) ou
          d&apos;études scientifiques et médicales publiées.
        </p>

        <h2 className="font-headline text-3xl font-black mt-10 mb-3">Politique éditoriale</h2>
        <p>
          Nous garantissons quatre engagements :
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>
            <strong>Zéro fiction.</strong> Aucune citation fabriquée, aucun
            témoignage inventé, aucun personnage imaginaire mis en scène. Les
            citations directes sont systématiquement attribuées à leur auteur
            réel et à la publication d&apos;origine.
          </li>
          <li>
            <strong>Sources citées nommément.</strong> Chaque information
            spécifique reprise d&apos;un média tiers est créditée dans le
            corps du texte (&laquo; selon u-Trail &raquo;, &laquo; comme
            l&apos;a rapporté iRunFar &raquo;).
          </li>
          <li>
            <strong>Précision des chiffres.</strong> Distances, dénivelés,
            temps de course, classements, cotes ITRA sont donnés tels que
            dans la source officielle, sans arrondi ni extrapolation.
          </li>
          <li>
            <strong>Transparence sur les études.</strong> Pour les sujets
            médicaux, nutritionnels et d&apos;entraînement, nous citons les
            institutions de référence (ACSM, HAS, British Journal of Sports
            Medicine) sans jamais inventer un titre d&apos;article ou un nom
            d&apos;auteur.
          </li>
        </ul>

        <h2 className="font-headline text-3xl font-black mt-10 mb-3">Périmètre éditorial</h2>
        <p>
          Six rubriques couvrent l&apos;essentiel du trail français et
          international :
        </p>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>
            <Link href="/categories/actualites" className="text-primary underline hover:opacity-80">
              Actualités
            </Link>{" "}
            — faits saillants, débats de l&apos;industrie, décryptages
          </li>
          <li>
            <Link href="/categories/courses-recits" className="text-primary underline hover:opacity-80">
              Courses &amp; Récits
            </Link>{" "}
            — comptes-rendus, portraits, histoires de coureurs
          </li>
          <li>
            <Link href="/categories/entrainement" className="text-primary underline hover:opacity-80">
              Entraînement &amp; Performances
            </Link>{" "}
            — méthodologie, périodisation, analyse de l&apos;effort
          </li>
          <li>
            <Link href="/categories/nutrition" className="text-primary underline hover:opacity-80">
              Nutrition
            </Link>{" "}
            — physiologie digestive en course, ravitaillement, hydratation
          </li>
          <li>
            <Link href="/categories/blessures" className="text-primary underline hover:opacity-80">
              Blessures &amp; Préventions
            </Link>{" "}
            — traumatologie, prévention, rééducation
          </li>
          <li>
            <Link href="/categories/debuter" className="text-primary underline hover:opacity-80">
              Débuter
            </Link>{" "}
            — guides pour les coureurs qui s&apos;initient au trail
          </li>
        </ul>

        <h2 className="font-headline text-3xl font-black mt-10 mb-3">Outils</h2>
        <p>
          En complément de la production éditoriale, Altitude Trail met à
          disposition trois outils gratuits :
        </p>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>
            <Link href="/courses" className="text-primary underline hover:opacity-80">
              Annuaire des courses françaises
            </Link>
          </li>
          <li>
            <Link href="/parcours" className="text-primary underline hover:opacity-80">
              Base de traces GPX
            </Link>{" "}
            issues d&apos;OpenStreetMap, classées par région, balisage et
            difficulté
          </li>
          <li>
            <Link href="/entrainement/generateur" className="text-primary underline hover:opacity-80">
              Moteur d&apos;entraînement personnalisé trail
            </Link>{" "}
            personnalisé selon l&apos;objectif, le niveau et la
            disponibilité
          </li>
        </ul>

        <h2 className="font-headline text-3xl font-black mt-10 mb-3">Contact rédaction</h2>
        <p>
          Pour une prise de contact éditoriale, un sujet à signaler ou une
          demande d&apos;interview :
        </p>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>
            E-mail :{" "}
            <a
              href="mailto:redaction@altitude-trail.fr"
              className="text-primary underline hover:opacity-80"
            >
              redaction@altitude-trail.fr
            </a>
          </li>
          <li>
            Formulaire :{" "}
            <Link href="/contact" className="text-primary underline hover:opacity-80">
              /contact
            </Link>
          </li>
        </ul>

        <h2 className="font-headline text-3xl font-black mt-10 mb-3">Mentions légales</h2>
        <p>
          Éditeur du site : {SITE_NAME}. Hébergement : Vercel Inc., 440 N
          Barranca Ave #4133, Covina, CA 91723, USA. Directeur de la
          publication : la rédaction d&apos;Altitude Trail. Contact
          rédaction :{" "}
          <a
            href="mailto:redaction@altitude-trail.fr"
            className="text-primary underline hover:opacity-80"
          >
            redaction@altitude-trail.fr
          </a>
          .
        </p>
        <p>
          Les données de navigation sont traitées via Google Analytics
          conformément au RGPD. Aucune donnée personnelle n&apos;est cédée
          à des tiers. Les images illustrant les articles sont soit
          générées par intelligence artificielle (fal.ai / flux-pro-1.1),
          soit reprises sous licence depuis les sources citées dans chaque
          article.
        </p>
      </section>

      <div className="bg-surface-container p-6 border-l-4 border-navy">
        <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-2">
          Signaler une erreur
        </p>
        <p className="text-sm text-slate-700">
          Une imprécision, un chiffre erroné, une attribution incorrecte ?
          Écrivez-nous à{" "}
          <a
            href="mailto:redaction@altitude-trail.fr"
            className="text-primary underline hover:opacity-80"
          >
            redaction@altitude-trail.fr
          </a>
          . Les corrections sont apportées sous 48 h et signalées en pied
          d&apos;article.
        </p>
      </div>
    </div>
  );
}
