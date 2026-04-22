import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import {
  SITE_URL,
  SITE_NAME,
  AUTHOR_NAME,
  AUTHOR_URL,
  buildBreadcrumbJsonLd,
  buildNewsArticleJsonLd,
  buildFaqPageJsonLd,
  buildHowToJsonLd,
} from "@/lib/seo";

const TITLE = "Guide complet UTMB : qualifications, préparation, stratégie de course";
const DESCRIPTION =
  "Tout ce qu'il faut savoir pour courir l'UTMB : système des Running Stones, parcours 2026, plan de préparation sur 24 semaines, gestion nutrition et sommeil, stratégie par tronçon. Le guide de référence.";
const PAGE_URL = `${SITE_URL}/guides/utmb`;
const HERO_IMAGE = `${SITE_URL}/articles/utmb-wildcards-elites-protestation-systeme-1.jpg`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides/utmb", languages: { fr: "/guides/utmb" } },
  openGraph: {
    type: "article",
    url: PAGE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    locale: "fr_FR",
    images: [{ url: HERO_IMAGE, width: 1200, height: 675, alt: "UTMB" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [HERO_IMAGE] },
};

const FAQ = [
  {
    q: "Combien coûte l'inscription à l'UTMB ?",
    a: "Les tarifs varient selon la course (UTMB 171 km, CCC, OCC, TDS, MCC, PTL) et évoluent chaque année. S'ajoutent des frais obligatoires (licence ITRA, cotisation ProTrail) et optionnels (options Running Stones). Les montants exacts 2026 sont publiés sur le site officiel utmbmontblanc.com au moment de l'ouverture des inscriptions.",
  },
  {
    q: "Comment se qualifier pour l'UTMB ?",
    a: "Le système combine des points ITRA (cotations attribuées aux courses qualifiantes terminées dans les 24 mois précédents) et des Running Stones obtenues en finissant des courses du circuit UTMB World Series. Plus tu accumules de Running Stones, plus tu augmentes tes chances au tirage au sort. Les seuils précis varient chaque année selon la demande — consulte utmbmontblanc.com pour les règles de l'édition en cours.",
  },
  {
    q: "Quel temps maximum pour finir l'UTMB ?",
    a: "Le temps limite officiel est affiché sur le site UTMB (autour de 46 heures pour les 171 km). Des barrières horaires intermédiaires sont présentes à chaque ravitaillement majeur : Saint-Gervais, Les Contamines, Courmayeur, Champex, Trient, Vallorcine. Les temps vainqueurs se situent généralement autour de 20h pour les hommes et 23-25h pour les femmes selon les éditions.",
  },
  {
    q: "Sur combien de semaines préparer l'UTMB ?",
    a: "16 à 24 semaines pour un coureur ayant déjà une base ultra. 28 à 36 semaines si c'est ta première tentative sur 100+ miles. Le dernier bloc de 6-8 semaines concentre les sorties longues en dénivelé, avec une baisse progressive du volume sur les 2-3 dernières semaines.",
  },
  {
    q: "Quels sont les points techniques les plus difficiles du parcours ?",
    a: "La descente de Saint-Gervais (rapide, quadriceps à protéger), la montée au Col du Bonhomme (longue, souvent dans la nuit), la montée au Grand Col Ferret (altitude, froid et vent exposé), la descente sur Trient (glissante par temps humide), et les derniers kilomètres sur Chamonix après La Flégère (jambes cuites, concentration à maintenir).",
  },
  {
    q: "Combien de calories faut-il ingérer sur l'UTMB ?",
    a: "Les études sur ultra-trail montagneux indiquent une dépense de l'ordre de 10 000 à 15 000 kcal selon le gabarit et le temps passé sur le parcours. L'absorption en course se situe entre 5 000 et 8 000 kcal. Un déficit existe mécaniquement — l'objectif est de le minimiser, pas de l'éliminer.",
  },
  {
    q: "Faut-il dormir pendant l'UTMB ?",
    a: "Pour les coureurs rapides (moins de 28h), la course se fait sans vrai sommeil, éventuellement avec quelques micro-siestes très courtes à Courmayeur ou Champex-Lac. Pour les coureurs plus lents (plus de 35h), un sommeil de 30 à 60 minutes peut être nécessaire pour préserver les fonctions cognitives et éviter les chutes.",
  },
];

const HOW_TO_STEPS = [
  {
    name: "J-24 semaines : vérifier la qualification ITRA",
    text: "Consulter les règles d'admission de l'édition en cours sur utmbmontblanc.com : index ITRA requis, catégorie visée, besoin éventuel de Running Stones supplémentaires. Si l'index n'est pas suffisant, prévoir une ou deux courses qualifiantes dans les mois qui précèdent.",
  },
  {
    name: "J-24 à J-16 : base aérobie",
    text: "60-80 km/semaine avec 1 sortie longue de 3-5h, progressivement en D+. Priorité au foncier, pas au chrono.",
  },
  {
    name: "J-16 à J-8 : spécifique",
    text: "Volume jusqu'à 100-120 km/semaine, 1 SL de 5-8h avec 2000+ D+, 1 séance seuil, 2 sorties D+ pures.",
  },
  {
    name: "J-8 à J-3 : affûtage",
    text: "Réduire volume de 40-60 %, conserver l'intensité sur séances courtes. Récupérer, pas se vider.",
  },
  {
    name: "J-3 à J0 : préparation course",
    text: "Sac testé, ravitaillement prévu par tronçon, pacers (si autorisés), réservation hôtel Chamonix, récupération du dossard le mercredi.",
  },
];

export default function GuideUTMBPage() {
  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Guides" },
    { label: "UTMB" },
  ];

  const articleLike = {
    slug: "guides/utmb",
    title: TITLE,
    excerpt: DESCRIPTION,
    category: "Guides",
    categorySlug: "guides",
    author: AUTHOR_NAME,
    date: "22 avril 2026",
    readTime: "22 min",
    image: HERO_IMAGE,
    tags: ["UTMB", "ultra-trail", "préparation", "Chamonix", "Running Stones"],
    content: DESCRIPTION,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd data={buildNewsArticleJsonLd(articleLike)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Accueil", url: SITE_URL },
          { label: "Guides", url: `${SITE_URL}/guides` },
          { label: "UTMB", url: PAGE_URL },
        ])}
      />
      <JsonLd data={buildFaqPageJsonLd(FAQ)} />
      <JsonLd
        data={buildHowToJsonLd({
          name: "Préparer l'UTMB en 24 semaines",
          description: "Plan de préparation structuré pour courir l'UTMB, phase par phase",
          url: PAGE_URL,
          totalTime: "P168D",
          steps: HOW_TO_STEPS,
        })}
      />

      <Breadcrumb items={breadcrumb} />

      <div className="mb-4">
        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 tracking-tighter uppercase font-headline">
          GUIDE DE RÉFÉRENCE
        </span>
      </div>

      <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-6">
        {TITLE}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-semibold uppercase tracking-wide mb-8 border-b border-surface-container pb-6">
        <span>Par <Link href="/auteurs/thomas-rouvier" className="text-navy hover:text-primary underline-offset-4 hover:underline">Thomas Rouvier</Link></span>
        <span>·</span>
        <span>22 avril 2026</span>
        <span>·</span>
        <span>22 min de lecture</span>
      </div>

      <div className="mb-8 overflow-hidden">
        <Image
          src="/articles/utmb-wildcards-elites-protestation-systeme-1.jpg"
          alt="Départ nocturne de l'UTMB à Chamonix"
          width={1200}
          height={675}
          priority
          sizes="(max-width: 1024px) 100vw, 896px"
          className="w-full aspect-video object-cover"
        />
      </div>

      <p className="text-xl text-slate-600 italic border-l-4 border-primary pl-6 mb-10 leading-relaxed">
        {DESCRIPTION}
      </p>

      {/* Sommaire */}
      <nav aria-label="Sommaire" className="bg-surface-container border-l-4 border-navy p-6 mb-10">
        <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-4">
          Sommaire
        </div>
        <ol className="space-y-2">
          {[
            { id: "histoire", label: "L'UTMB en 5 chiffres" },
            { id: "parcours", label: "Le parcours 171 km, tronçon par tronçon" },
            { id: "qualification", label: "Se qualifier : Running Stones et ITRA" },
            { id: "preparation", label: "Préparer l'UTMB en 24 semaines" },
            { id: "nutrition", label: "Nutrition et hydratation sur 22 heures" },
            { id: "sommeil", label: "Gérer le sommeil et la nuit" },
            { id: "materiel", label: "Matériel obligatoire et conseillé" },
            { id: "faq", label: "Questions fréquentes" },
          ].map((item, i) => (
            <li key={item.id} className="flex gap-3 items-baseline">
              <span className="font-headline font-black text-primary shrink-0 w-8 text-sm tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <a
                href={`#${item.id}`}
                className="font-headline font-bold text-navy hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed">
        <section id="histoire" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mt-10 mb-4">L'UTMB en 5 chiffres</h2>
          <p className="mb-4">
            Créé en 2003 par Catherine et <Link href="/articles/a-71-ans-michel-poletti-traverse-la-france-a-pied-entre-ses-courses-utmb" className="text-primary hover:underline">Michel Poletti</Link>, l'Ultra-Trail du Mont-Blanc est devenu en vingt ans la référence mondiale du trail en montagne. Le chiffre brut d'abord : 171 kilomètres, 10 000 mètres de dénivelé positif (l'équivalent d'escalader la Tour Eiffel 33 fois d'affilée), 3 pays traversés (France, Italie, Suisse), 46h30 de temps limite, et désormais environ 10 000 coureurs qui convergent chaque fin août vers Chamonix toutes courses confondues (UTMB, CCC, TDS, OCC, MCC, PTL).
          </p>
          <p className="mb-4">
            Derrière ces chiffres, une industrie : l'UTMB World Series désormais intégrée à Ironman puis au groupe AEG pilote un circuit mondial d'une cinquantaine d'événements. Finisher une UTMB World Series rapporte des <em>Running Stones</em> — la monnaie qui donne accès au tirage au sort de Chamonix. Plus tu stones, plus tu augmentes tes chances.
          </p>
        </section>

        <section id="parcours" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mt-10 mb-4">Le parcours 171 km, tronçon par tronçon</h2>
          <p className="text-sm text-slate-500 italic mb-4 bg-surface-container p-3 border-l-2 border-primary">
            Les distances et dénivelés indiqués ci-dessous sont des ordres de grandeur historiques — le tracé exact est susceptible d'évoluer d'une édition à l'autre selon la météo, l'état des sentiers ou des ajustements d'organisation. Les données officielles à jour sont publiées sur <a href="https://utmbmontblanc.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">utmbmontblanc.com</a>.
          </p>
          <p className="mb-4">
            Le parcours se lit comme une épopée en six actes. Le départ a lieu traditionnellement le vendredi soir à 18h depuis la place du Triangle de l'Amitié à Chamonix, dans un chaos acoustique unique. Vangelis, haies de spectateurs, lampe frontale allumée (même si il fait encore jour), et le peloton s'élance en file vers Les Houches.
          </p>
          <p className="mb-4">
            <strong>Chamonix → Saint-Gervais (21 km, 1300 D+)</strong> : premier contrefort, col de Voza. Moment critique pour ne pas partir trop vite. Beaucoup de débutants ruinent ici leur course entière.
          </p>
          <p className="mb-4">
            <strong>Saint-Gervais → Les Contamines (10 km, 400 D+)</strong> : vallée roulante de nuit, occasion de manger consistant avant la vraie montagne.
          </p>
          <p className="mb-4">
            <strong>Les Contamines → Courmayeur (45 km, 3000 D+)</strong> : cœur de la course. Montée au Col du Bonhomme de nuit, passage des Chapieux, Col de la Seigne à l'aube, descente sur Lac Combal puis montée à Arête Mont-Favre et longue descente sur Courmayeur. À Courmayeur (km 79), tu es à mi-course — c'est ici que beaucoup abandonnent.
          </p>
          <p className="mb-4">
            <strong>Courmayeur → Champex-Lac (45 km, 2200 D+)</strong> : traversée du Val Ferret italien puis suisse. Grand Col Ferret à 2500 m d'altitude, souvent dans le froid. Arrivée à Champex-Lac (km 123) en début d'après-midi ou en soirée selon le rythme.
          </p>
          <p className="mb-4">
            <strong>Champex-Lac → Trient → Vallorcine (30 km, 2000 D+)</strong> : trois derniers cols en Suisse. Catogne (compliqué au mental), Bovine (long), puis la redescente sur Trient et remontée aux Tseppes avant Vallorcine. C'est ici que se joue le finish. Les jambes cuites transforment des descentes anodines en calvaire.
          </p>
          <p className="mb-4">
            <strong>Vallorcine → Chamonix (20 km, 850 D+)</strong> : dernier mur de La Flégère, puis long faux-plat descendant vers l'arrivée. L'entrée dans Chamonix sous l'arche UTMB est une émotion brute — peu importe ton temps.
          </p>
        </section>

        <section id="qualification" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mt-10 mb-4">Se qualifier : Running Stones et index ITRA</h2>
          <p className="mb-4">
            L'accès aux courses UTMB de Chamonix combine deux logiques. D'un côté, une <strong>qualification sportive</strong> basée sur l'index ITRA (International Trail Running Association) : chaque course terminée dans les mois précédents attribue une cotation, qui détermine la catégorie à laquelle tu peux prétendre. De l'autre, une <strong>loterie pondérée par les Running Stones</strong> : plus tu en accumules en finissant des épreuves du circuit UTMB World Series, plus tes chances d'être tiré au sort augmentent.
          </p>
          <p className="mb-4">
            Les règles exactes évoluent chaque année — seuils d'index, nombre de stones requis, calendrier des inscriptions, tarifs — en fonction de la demande et de l'évolution du programme. <strong>Les chiffres publiés sur des sites tiers sont souvent périmés.</strong> Avant de te lancer dans une stratégie de qualification, vérifie les règles de l'édition en cours directement sur le site officiel :
          </p>
          <p className="mb-4">
            <a href="https://utmbmontblanc.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4">
              utmbmontblanc.com — règles d'inscription et de qualification
            </a>
          </p>
          <p className="mb-4">
            <Link href="/articles/utmb-wildcards-elites-protestation-systeme" className="text-primary hover:underline">Le système fait débat dans le milieu</Link> : il favorise mécaniquement les coureurs capables de financer plusieurs voyages internationaux par an pour accumuler des stones, ce qui alimente une réflexion continue sur la notion d'équité d'accès à l'épreuve.
          </p>
        </section>

        <section id="preparation" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mt-10 mb-4">Préparer l'UTMB en 24 semaines</h2>
          <p className="mb-4">
            Une prépa UTMB réussie se structure en 4 blocs de 5-6 semaines. L'erreur classique : vouloir tout caser en 3 mois. Résultat : blessures, surentraînement, fatigue chronique au départ.
          </p>
          <p className="mb-4">
            <strong>Bloc 1 — Base foncière (semaines 1-6)</strong> : reconstruction de l'aérobie. 60-80 km/semaine, sortie longue de 2-4h, 1 séance VMA courte, 2 séances de renforcement. Pas de course sur cette phase.
          </p>
          <p className="mb-4">
            <strong>Bloc 2 — Développement spécifique (semaines 7-12)</strong> : introduction du dénivelé. 80-100 km/semaine, SL de 4-6h avec 1500-2500 D+, une course test mi-bloc de 40-60 km pour valider la progression.
          </p>
          <p className="mb-4">
            <strong>Bloc 3 — Pic spécifique (semaines 13-18)</strong> : semaines les plus dures. 100-130 km/semaine, SL jusqu'à 7-9h avec 3000 D+, double sortie dénivelé (samedi + dimanche) sur 2 week-ends. Course de préparation de 80-100 km 4 à 5 semaines avant l'UTMB.
          </p>
          <p className="mb-4">
            <strong>Bloc 4 — Affûtage (semaines 19-24)</strong> : réduction progressive du volume de 40-60 %, maintien de l'intensité, priorité au sommeil et à la récupération. Dernière grosse séance 10 jours avant le départ, max.
          </p>
          <p className="mb-4">
            Un <Link href="/entrainement/generateur" className="text-primary hover:underline">générateur de plan d'entraînement personnalisé</Link> est disponible sur ce site pour bâtir ta périodisation selon ton niveau actuel et ta date d'objectif.
          </p>
        </section>

        <section id="nutrition" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mt-10 mb-4">Nutrition et hydratation sur 22 heures</h2>
          <p className="mb-4">
            La règle d'or de l'ultra : <Link href="/articles/comment-nourrir-son-corps-sur-un-ultra-sans-craquer-au-km-40" className="text-primary hover:underline">60 à 90 g de glucides par heure</Link>, tolérés grâce à plusieurs semaines de <em>training the gut</em>. Un estomac non entraîné plafonne à 40 g/h et craque au km 40.
          </p>
          <p className="mb-4">
            Pour un coureur de 70 kg visant 22h d'effort, la cible totale est entre 1 300 et 2 000 g de glucides ingérés. C'est énorme. On les décompose en :
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Gels énergétiques</strong> (25-30 g chacun) : 2-3 par heure sur les 6 premières heures, puis saturation du sucré</li>
            <li><strong>Boissons glucidiques</strong> (30-60 g/bidon) : fond hydrique + calories, alternées avec eau pure</li>
            <li><strong>Solides</strong> (barres énergétiques, riz, purées de patate douce) : prises en transition aux ravitaillements</li>
            <li><strong>Salé</strong> : bouillons, chips, fromage aux ravitos de nuit — coupe la saturation sucrée</li>
            <li><strong>Caféine</strong> : 2-3 prises de 100-200 mg sur les 8 dernières heures pour compenser la fatigue nerveuse</li>
          </ul>
          <p className="mb-4">
            Côté hydratation : 500-750 ml par heure en moyenne, adapté à la température. Sur l'UTMB fin août, les variations sont énormes (30 °C en vallée, 0 °C aux cols la nuit). Surveiller la couleur des urines aux ravitos.
          </p>
        </section>

        <section id="sommeil" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mt-10 mb-4">Gérer le sommeil et la nuit</h2>
          <p className="mb-4">
            Le départ vendredi à 18h implique que la majorité des coureurs va traverser deux nuits (vendredi/samedi et éventuellement samedi/dimanche). La gestion du sommeil est un sujet à part entière : <Link href="/articles/votre-meilleur-allie-contre-les-blessures-ne-coute-rien-le-sommeil" className="text-primary hover:underline">bien dormir les nuits qui précèdent la course</Link> est plus important que la stratégie pendant.
          </p>
          <p className="mb-4">
            Cible : 8 à 9 heures de sommeil dans les 5 jours avant la course, avec coucher régulier. Éviter l'alcool et la caféine en soirée. La veille du départ, pas de changement de routine : une bonne journée de récupération vaut mieux qu'une visite nocturne des rues de Chamonix.
          </p>
          <p className="mb-4">
            Pendant la course, pour un coureur visant moins de 30h : zéro sommeil, éventuellement 2-3 micro-siestes de 5 min à Courmayeur, Champex ou Trient. Au-delà de 35h, un vrai sommeil de 30 à 60 minutes à Courmayeur ou Champex est souvent plus productif que de courir zombi.
          </p>
        </section>

        <section id="materiel" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mt-10 mb-4">Matériel obligatoire et conseillé</h2>
          <p className="mb-4">
            La liste officielle UTMB est stricte et vérifiée aléatoirement en course. En 2026 :
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Sac de trail avec capacité d'1,5 L d'eau minimum + bidons/poches</li>
            <li>Téléphone portable chargé, allumé, numéro organisation enregistré</li>
            <li>Gobelet réutilisable de 15 cl minimum</li>
            <li>Lampe frontale 200 lumens + lampe de secours + piles de rechange</li>
            <li>Couverture de survie 1,40 × 2 m minimum</li>
            <li>Sifflet, bandage élastique 80 × 3 cm, imperméable avec capuche et coutures étanches</li>
            <li>Pantalon, bonnet, gants chauds (vérifiés à l'inscription du fait des températures en altitude)</li>
            <li>Rations alimentaires, GPS activé, argent liquide</li>
          </ul>
          <p className="mb-4">
            Au-delà de l'obligatoire, les finisheurs recommandent : une paire de <strong>bâtons</strong> (25 % de charge en moins sur les quadri en descente raide), des <strong>chaussures avec bonne accroche</strong> (type Hoka Tecton X, Salomon S/Lab Ultra, La Sportiva Prodigio), et un <strong>smartphone avec la trace GPX</strong> de secours (les balises peuvent être sabotées, le brouillard masque les rubalises).
          </p>
        </section>

        <section id="faq" className="scroll-mt-24">
          <h2 className="font-headline text-3xl font-black mt-10 mb-4">Questions fréquentes</h2>
          <div className="space-y-6">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-surface-container pb-4">
                <summary className="cursor-pointer font-headline font-bold text-lg text-navy marker:text-primary hover:text-primary transition-colors">
                  {f.q}
                </summary>
                <p className="mt-3 text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* CTA vers le générateur de plan */}
      <div className="mt-16 bg-navy text-white p-8 lg:p-10 border-l-4 border-primary">
        <h3 className="font-headline font-black text-2xl lg:text-3xl uppercase tracking-tighter mb-3">
          Prêt à passer à la préparation ?
        </h3>
        <p className="text-slate-300 mb-5 leading-relaxed">
          Le générateur de plan personnalisé bâtit ta périodisation UTMB sur 16 à 24 semaines en fonction de ton volume actuel, ta VMA et ta date d'objectif.
        </p>
        <Link
          href="/entrainement/generateur"
          className="inline-block bg-primary text-white px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors"
        >
          Générer mon plan UTMB →
        </Link>
      </div>
    </div>
  );
}
