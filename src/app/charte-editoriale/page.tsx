import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import {
  SITE_URL,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo";

const TITLE = "Charte éditoriale";
const DESCRIPTION =
  "Ligne éditoriale d'Altitude Trail : mission, méthodologie, sources, transparence sur l'usage de l'IA, politique de correction et conflits d'intérêts.";
const PAGE_URL = `${SITE_URL}/charte-editoriale`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/charte-editoriale", languages: { fr: "/charte-editoriale" } },
  openGraph: {
    type: "article",
    url: PAGE_URL,
    title: `${TITLE} — ${SITE_NAME}`,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function CharteEditorialePage() {
  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Charte éditoriale" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd
        data={buildWebPageJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          url: PAGE_URL,
          breadcrumb: [
            { label: "Accueil", url: SITE_URL },
            { label: "Charte éditoriale", url: PAGE_URL },
          ],
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Accueil", url: SITE_URL },
          { label: "Charte éditoriale", url: PAGE_URL },
        ])}
      />

      <Breadcrumb items={breadcrumb} />

      <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-6">
        Charte éditoriale
      </h1>

      <p className="text-xl text-slate-600 italic border-l-4 border-primary pl-6 mb-10 leading-relaxed">
        Altitude Trail est un magazine éditorial indépendant consacré au trail
        running et à l'ultra-endurance. Cette charte décrit les principes, la
        méthode et les limites de notre pratique rédactionnelle.
      </p>

      <p className="text-sm text-slate-500 italic mb-10">
        Dernière mise à jour : 22 avril 2026
      </p>

      {/* Sommaire */}
      <nav aria-label="Sommaire" className="bg-surface-container border-l-4 border-navy p-6 mb-12">
        <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-3">
          Sommaire
        </div>
        <ol className="space-y-2 text-sm">
          {[
            { id: "mission", label: "Mission éditoriale" },
            { id: "principes", label: "Principes" },
            { id: "methodologie", label: "Méthodologie et sources" },
            { id: "ia", label: "Transparence sur l'usage de l'IA" },
            { id: "corrections", label: "Politique de correction" },
            { id: "interets", label: "Indépendance et conflits d'intérêts" },
            { id: "contact", label: "Nous contacter" },
          ].map((item, i) => (
            <li key={item.id} className="flex gap-3 items-baseline">
              <span className="font-headline font-black text-primary shrink-0 w-6 text-xs tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <a href={`#${item.id}`} className="text-navy hover:text-primary hover:underline underline-offset-4">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed space-y-8">
        {/* 1 — Mission */}
        <section id="mission" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mb-4">
            1. Mission éditoriale
          </h2>
          <p>
            Altitude Trail couvre l'actualité, la science et la culture du trail
            running francophone. Nous visons trois lecteurs : le coureur débutant
            qui cherche des repères fiables, le traileur expérimenté qui
            progresse dans son art, et le passionné d'ultra qui suit les circuits
            mondiaux.
          </p>
          <p>
            Nos contenus se répartissent entre l'actualité des courses
            (résultats, portraits, enjeux), l'entraînement et la physiologie
            appliquée, la nutrition d'endurance, la prévention des blessures, et
            l'analyse de l'écosystème trail (fédérations, équipementiers,
            organisateurs).
          </p>
          <p>
            Nous ne sommes ni un site d'affiliation, ni un blog de coach
            commercial, ni un relais des communiqués d'équipementiers. Notre
            valeur vient de la rigueur avec laquelle nous trions, recoupons et
            expliquons les informations du milieu.
          </p>
        </section>

        {/* 2 — Principes */}
        <section id="principes" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mb-4">2. Principes</h2>
          <ul className="list-none pl-0 space-y-4">
            <li className="border-l-4 border-primary pl-4">
              <strong className="text-navy">Rigueur factuelle.</strong> Chaque
              affirmation chiffrée ou technique est sourcée. En cas de doute
              sur une donnée (temps de course, performance, protocole), nous
              préférons l'omission à l'approximation.
            </li>
            <li className="border-l-4 border-primary pl-4">
              <strong className="text-navy">Indépendance.</strong> Nous
              n'acceptons aucun contenu fourni ni relu par un annonceur, un
              équipementier ou un organisateur de course. Les partenariats
              éventuels sont toujours signalés explicitement.
            </li>
            <li className="border-l-4 border-primary pl-4">
              <strong className="text-navy">Humilité technique.</strong> Nos
              articles d'entraînement, nutrition ou prévention des blessures
              fournissent des repères généraux. Ils ne remplacent ni un
              préparateur diplômé, ni un diététicien du sport, ni un médecin du
              sport.
            </li>
            <li className="border-l-4 border-primary pl-4">
              <strong className="text-navy">Service du lecteur.</strong> Nous
              privilégions toujours l'information utile au coureur sur le trafic
              ou l'engagement. Pas de clickbait, pas de listicles creux, pas de
              titres mensongers.
            </li>
            <li className="border-l-4 border-primary pl-4">
              <strong className="text-navy">Respect des personnes.</strong>
              {" "}Nous traitons les protagonistes de nos articles avec
              bienveillance, y compris en cas de critique. Nous donnons la
              parole aux personnes mises en cause avant publication lorsque
              c'est matériellement possible.
            </li>
          </ul>
        </section>

        {/* 3 — Méthodologie */}
        <section id="methodologie" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mb-4">
            3. Méthodologie et sources
          </h2>
          <p>
            Nos sources primaires sont de cinq ordres :
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Les <strong>communiqués officiels</strong> des organisateurs de
              course, fédérations (ITRA, FFA, World Athletics), et équipementiers.
            </li>
            <li>
              Les <strong>publications scientifiques</strong> évaluées par des
              pairs (revues comme le <em>British Journal of Sports Medicine</em>,
              base PubMed, études INSEP), pour tout sujet relevant de la
              physiologie, de la nutrition ou de la prévention des blessures.
            </li>
            <li>
              Les <strong>médias trail établis</strong> dont la rigueur est
              reconnue (iRunFar, Ultrarunning, Trail Runner Mag, Le Pape Info,
              u-Trail), cités nommément lorsque nous reprenons une information.
            </li>
            <li>
              Les <strong>déclarations publiques</strong> des coureurs et
              organisateurs (interviews, conférences de presse, comptes
              sociaux officiels), lorsqu'elles sont vérifiables.
            </li>
            <li>
              Les <strong>données factuelles</strong> des plateformes de résultats
              officiels (sites des courses, livestreams chronométrés,
              classements ITRA).
            </li>
          </ul>
          <p>
            Lorsque nous reprenons une information publiée par un autre média,
            nous le mentionnons explicitement dans le corps de l'article avec un
            lien vers la publication originale. Aucun texte n'est recopié.
            Chaque reprise est reformulée et contextualisée.
          </p>
        </section>

        {/* 4 — Transparence IA */}
        <section id="ia" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mb-4">
            4. Transparence sur l'usage de l'intelligence artificielle
          </h2>
          <p>
            Altitude Trail utilise des outils d'intelligence artificielle dans
            son processus éditorial. Par souci de transparence, voici le
            périmètre exact de cet usage.
          </p>
          <h3 className="font-headline text-xl font-bold mt-6 mb-2">
            Rédaction
          </h3>
          <p>
            Une partie de nos articles d'actualité est produite avec l'assistance
            d'un modèle de langage (Claude, édité par Anthropic). Le modèle
            synthétise des sources publiques — articles de presse,
            communiqués, bases de résultats — identifiées par notre système de
            veille. Chaque contenu produit fait l'objet d'une relecture humaine,
            d'une vérification des faits cités et d'une reformulation
            éditoriale. Les articles reprenant une source unique citent
            systématiquement cette source.
          </p>
          <p>
            Les articles de fond (dossiers, guides, analyses longues) sont
            rédigés et validés par un auteur humain nommé, identifié en haut
            d'article avec lien vers sa page dédiée.
          </p>
          <h3 className="font-headline text-xl font-bold mt-6 mb-2">
            Images d'illustration
          </h3>
          <p>
            Les images génériques illustrant nos articles (paysages, scènes de
            course non identifiables) sont générées par un modèle de synthèse
            d'image (FLUX). Ces visuels ne représentent pas de coureur ou
            d'événement réel. Lorsqu'un article exige une photo de personne ou
            d'événement précis, nous utilisons soit une photo d'archive sourcée
            (avec crédit), soit aucune photo plutôt qu'une génération trompeuse.
          </p>
          <h3 className="font-headline text-xl font-bold mt-6 mb-2">
            Ce que l'IA ne fait jamais chez nous
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Inventer des chiffres, des résultats de course, des temps ou des
              records.
            </li>
            <li>
              Attribuer des citations fictives à une personne réelle.
            </li>
            <li>
              Générer des images de coureurs identifiables dans des situations
              qu'ils n'ont pas vécues.
            </li>
            <li>
              Écrire un avis sur un produit, un coach ou un organisateur sans
              vérification humaine.
            </li>
          </ul>
          <p>
            Toute suspicion d'erreur due à l'IA doit nous être signalée (voir
            section « Politique de correction » ci-dessous). Nous corrigeons
            publiquement.
          </p>
        </section>

        {/* 5 — Corrections */}
        <section id="corrections" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mb-4">
            5. Politique de correction
          </h2>
          <p>
            Nous corrigeons les erreurs factuelles dès que nous en avons
            connaissance. Notre procédure :
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Signalement de l'erreur via notre{" "}
              <Link href="/contact" className="text-primary hover:underline">
                formulaire de contact
              </Link>{" "}
              ou par email à{" "}
              <a
                href="mailto:redaction@altitude-trail.fr"
                className="text-primary hover:underline"
              >
                redaction@altitude-trail.fr
              </a>
              .
            </li>
            <li>
              Vérification indépendante par la rédaction dans un délai de 72
              heures ouvrées.
            </li>
            <li>
              Correction publiée dans l'article concerné avec, en bas, une
              mention explicite : <em>« Correction publiée le [date] : [nature
              de la correction] »</em>. Nous ne modifions pas le contenu
              silencieusement.
            </li>
            <li>
              Pour les erreurs graves (attribution erronée de performance,
              mention diffamatoire involontaire), nous contactons directement la
              personne concernée et présentons des excuses publiques dans
              l'article.
            </li>
            <li>
              Mise à jour du champ{" "}
              <code className="bg-surface-container px-1.5 py-0.5 text-sm">
                dateModified
              </code>{" "}
              dans les données structurées de l'article, pour que les moteurs
              de recherche détectent le changement.
            </li>
          </ol>
          <p>
            Un article qui ne peut pas être corrigé (source non vérifiable,
            erreur matériellement irréparable) est dépublié et remplacé par une
            explication dédiée à l'URL d'origine.
          </p>
        </section>

        {/* 6 — Indépendance */}
        <section id="interets" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mb-4">
            6. Indépendance et conflits d'intérêts
          </h2>
          <p>
            Altitude Trail est édité de manière indépendante, sans adossement à
            un groupe média, un organisateur de course, un équipementier ou une
            fédération.
          </p>
          <p>
            Nous ne pratiquons pas le publi-rédactionnel. Si un article
            présente un produit, un service ou une course d'un partenaire
            commercial, la mention <strong>« Contenu en partenariat »</strong>
            apparaît en haut d'article, avant le titre. Aucun de nos articles
            ne rentre actuellement dans cette catégorie.
          </p>
          <p>
            Certains de nos auteurs sont par ailleurs des traileurs actifs
            participant à des courses couvertes dans nos colonnes. Dans ce
            cas, soit l'article n'est pas signé par la personne concernée, soit
            un <em>disclaimer</em> est ajouté en tête (« L'auteur a participé à
            cette course »).
          </p>
          <p>
            Les liens externes que nous incluons dans nos articles sont
            sélectionnés pour leur valeur informative. Aucun d'eux n'est un
            lien d'affiliation rémunéré. En cas d'introduction d'un programme
            d'affiliation dans le futur, cette charte sera mise à jour
            explicitement.
          </p>
        </section>

        {/* 7 — Contact */}
        <section id="contact" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mb-4">
            7. Nous contacter
          </h2>
          <p>
            Pour signaler une erreur, demander un droit de réponse, proposer une
            information, ou toute question d'ordre éditorial :
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Email :{" "}
              <a
                href="mailto:redaction@altitude-trail.fr"
                className="text-primary hover:underline"
              >
                redaction@altitude-trail.fr
              </a>
            </li>
            <li>
              Formulaire :{" "}
              <Link href="/contact" className="text-primary hover:underline">
                /contact
              </Link>
            </li>
            <li>
              Toutes les signatures de la rédaction sont listées sur la page{" "}
              <Link href="/auteurs" className="text-primary hover:underline">
                Rédaction
              </Link>
              .
            </li>
          </ul>
          <p>
            Les demandes relatives à la protection des données personnelles sont
            traitées conformément au RGPD — voir nos{" "}
            <Link href="/a-propos" className="text-primary hover:underline">
              mentions légales
            </Link>
            .
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t-2 border-navy text-center">
        <p className="text-sm text-slate-500 italic">
          Cette charte évolue. Les modifications sont datées en tête de page et
          consultables via l'historique de notre dépôt public.
        </p>
      </div>
    </div>
  );
}
