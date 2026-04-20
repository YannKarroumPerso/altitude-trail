#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const CONTENT_DIR = path.resolve("content/articles");
const PUBLIC_IMAGES_DIR = path.resolve("public/articles");

const FAL_KEY = process.env.BFL_API_KEY || process.env.FAL_API_KEY;
if (!FAL_KEY) {
  console.error("BFL_API_KEY / FAL_API_KEY manquante");
  process.exit(1);
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";
const FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro/v1.1";
const STYLE_SUFFIX =
  ", cinematic photography, photorealistic, trail running editorial style, dramatic natural lighting, shallow depth of field, 35mm film aesthetic, ultra realistic, magazine quality";
const HERO_W = 1200;
const HERO_H = 672;
const BODY_W = 1344;
const BODY_H = 768;
const FALLBACK_HERO = "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=80";
const DEFAULT_DATE = "20 avril 2026";

const FORCE = process.argv.includes("--force");

// ARTICLES : spécifications pour la génération.
// Éditez/étendez pour alimenter une rubrique. Les articles déjà créés sont
// automatiquement passés (skip if file existe, sauf --force).
const ARTICLES = [
  // ===== DÉBUTER =====
  {
    slug: "premiere-sortie-trail-choix-parcours-allure",
    title: "Première sortie trail : comment choisir son parcours et son allure",
    excerpt:
      "Ni trop long ni trop raide : les règles simples pour que votre baptême en sentier reste un plaisir et pose les bases d'une pratique durable.",
    category: "Débuter",
    categorySlug: "debuter",
    tags: ["Débuter", "Parcours", "Allure", "Progression"],
    readTime: "7 min",
    date: "1 avril 2026",
    topic:
      "première sortie trail pour un coureur sur route : choisir un parcours adapté (5-8 km, +150-300 m, sentier balisé en forêt plutôt qu'en montagne), évaluer son niveau honnêtement, tenir l'allure en endurance fondamentale (test de la conversation, marche en côte assumée même très tôt), contenu du sac minimum (500 ml d'eau, coupe-vent, téléphone, barre), sécurité (horaires, météo, prévenir un proche), erreurs fréquentes au départ (vouloir courir 100% du parcours, comparer son allure à la route), comment progresser sans forcer d'une sortie à l'autre",
  },
  {
    slug: "choisir-premiere-paire-chaussures-trail-guide-complet",
    title: "Choisir sa première paire de chaussures de trail : le guide complet",
    excerpt:
      "Drop, crampons, amorti, pointure : cinq critères déterminent si vos premières sorties se feront avec plaisir ou avec ampoules. On décortique chacun d'eux.",
    category: "Débuter",
    categorySlug: "debuter",
    tags: ["Chaussures", "Débuter", "Équipement", "Achat"],
    readTime: "8 min",
    date: "3 avril 2026",
    topic:
      "guide d'achat chaussures de trail pour débuter : drop (différence talon-pointe, 6-8 mm idéal pour débuter), crampons (hauteur 3-5 mm, densité selon terrain), amorti (grosse stack pour longues distances ou fin pour proprioception), rock plate anti-cailloux, système de laçage, pointure (prendre demi-pointure voire pointure au-dessus, essayer en fin de journée avec chaussettes techniques), modèles polyvalents par gamme de prix (entry 80-110€ / intermédiaire 120-160€), alterner sur deux paires pour prolonger la durée de vie (600-800 km typique), quand remplacer",
  },
  {
    slug: "route-vers-trail-adapter-entrainement-sans-blessure",
    title: "De la route au trail : comment adapter son entraînement sans se blesser",
    excerpt:
      "Le passage du bitume au sentier change presque tout : cadence, allure, mécanique de descente. Voici la feuille de route pour basculer en douceur.",
    category: "Débuter",
    categorySlug: "debuter",
    tags: ["Transition", "Débuter", "Progression", "Route"],
    readTime: "8 min",
    date: "5 avril 2026",
    topic:
      "transition route vers trail : différences mécaniques (cadence plus variée, amplitude réduite, usage actif du tronc et des bras, pose de pied adaptable), adaptation neuromusculaire en 8-12 semaines, progression de terrain (chemins forestiers plats → vallonnés → techniques), apprendre la descente (oublier le chrono, pose médio-pied souple, regard 3-5 mètres devant), gestion de la marche en côte (dès 12-15% de pente), renforcement spécifique (ischios, mollets, moyen fessier, chevilles), charge d'entraînement (remplacer progressivement les séances route par du trail, pas tout changer d'un coup), risques typiques à cette phase (tendinite d'Achille, périostite, entorse de cheville)",
  },
  {
    slug: "premier-10km-trail-plan-entrainement-12-semaines",
    title: "Préparer son premier 10 km de trail en 12 semaines",
    excerpt:
      "Un plan clair, quatre séances par semaine et une progression respectueuse : le protocole que n'importe quel coureur motivé peut suivre pour franchir le cap.",
    category: "Débuter",
    categorySlug: "debuter",
    tags: ["Plan d'entraînement", "Débuter", "10 km", "Objectif"],
    readTime: "9 min",
    date: "7 avril 2026",
    topic:
      "plan 12 semaines premier 10 km de trail : phase 1 base aérobie (semaines 1-4, 3 sorties hebdomadaires en endurance fondamentale + 1 sortie longue progressive), phase 2 spécifique trail (semaines 5-8, ajout de côtes courtes, descentes techniques, sortie longue en montée douce), phase 3 affûtage (semaines 9-11, intensité modérée sur profil proche de la course, réduction progressive du volume), semaine 12 (taper, visualisation, check matériel, alimentation), exemples de séances types avec durées et descriptions précises, règle des 10% d'augmentation hebdomadaire, adaptation selon le niveau de départ (coureur régulier vs reprise)",
  },
  {
    slug: "materiel-minimum-demarrer-trail-budget",
    title: "Le matériel minimum pour démarrer le trail running (avec budget)",
    excerpt:
      "Inutile de dépenser 800 € pour se lancer. On dresse la liste des indispensables, gamme et prix réalistes pour la saison 2026.",
    category: "Débuter",
    categorySlug: "debuter",
    tags: ["Matériel", "Budget", "Équipement", "Débuter"],
    readTime: "8 min",
    date: "9 avril 2026",
    topic:
      "matériel minimum trail pour débuter avec budgets : chaussures (80-150€), short/collant technique avec poches latérales (40-60€), tee-shirt respirant synthétique ou mérinos (30-50€), veste coupe-vent compactable (60-100€), casquette (15-25€), sac d'hydratation 5 L type Salomon Active Skin ou Nathan VaporAiress (60-90€), gourdes souples (10-20€), frontale basique 200 lumens pour sortie matinale automne-hiver (30-50€), bâtons pliants (plus tard, 80-120€, pas essentiels au début), budget total 350-500€ pour un set complet, conseils achat (marques fiables, périodes de soldes janvier-juillet, circuits seconde main type Everide ou Vinted)",
  },

  // ===== NUTRITION =====
  {
    slug: "nutrition-ultra-plan-alimentaire-dix-heures-effort",
    title: "Nutrition en ultra : construire son plan alimentaire au-delà de 10 h d'effort",
    excerpt:
      "La digestion est le premier ennemi en ultra. Comment organiser son alimentation pour tenir physiquement et mentalement, sans coup de moins bien.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Nutrition", "Ultra", "Plan alimentaire", "Digestion"],
    readTime: "10 min",
    date: "2 avril 2026",
    topic:
      "nutrition ultra-trail 10 h et plus : besoins énergétiques (300-500 kcal/h selon intensité et gabarit), répartition glucides/lipides/protéines (80/15/5 en course), stratégie bâton (apports réguliers toutes les 30-45 min, pas de longues pauses), alternance liquide/solide selon la fatigue digestive, apports sodium 500-1000 mg/h en chaleur, timing des grosses collations aux ravitos principaux, gestion de la fatigue digestive après 6-8 h (passage à des aliments familiers et tièdes : purée de pommes de terre, bouillon, riz au lait, banane), aliments-clés qui fonctionnent en ultra, erreurs à éviter (sur-gélification, changement soudain de stratégie en course, aliments nouveaux)",
  },
  {
    slug: "glucides-trail-combien-quand-quelle-forme",
    title: "Les glucides en trail : combien, quand, sous quelle forme",
    excerpt:
      "60, 90, 120 g/h ? La science avance vite et les recommandations aussi. Tour d'horizon actualisé des apports glucidiques en course, fondé sur les dernières études.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Glucides", "Nutrition", "Gels", "Science"]  ,
    readTime: "9 min",
    date: "4 avril 2026",
    topic:
      "glucides en trail running : bases physiologiques (stock glycogène 400-500 g chez un athlète bien préparé), oxydation maximale par heure (la barre des 60 g/h a été repoussée à 90-120 g/h grâce au mix glucose-fructose en ratio 2:1 ou 1:0,8), formes disponibles (gels, boissons isotoniques, barres, gâteaux maison), timing (charge de 3-4 g/kg dans les 3-4 h avant départ, prise régulière pendant, recharge post-effort dans les 30 min), training the gut (protocoles progressifs pour tolérer des apports élevés sans trouble digestif), pics insuliniques, marques françaises et internationales (Baouw, Näak, Maurten, Overstim's), alternatives naturelles (purée de fruits, dattes, figues séchées, patate douce cuite)",
  },
  {
    slug: "sels-electrolytes-trail-dosage-chaleur-effort-long",
    title: "Sels et électrolytes : dosage pour la chaleur et l'effort long",
    excerpt:
      "Sodium, potassium, magnésium : trois minéraux centraux dans la réussite d'un ultra par temps chaud. Dosages, formes, erreurs classiques.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Électrolytes", "Sodium", "Chaleur", "Hydratation"],
    readTime: "8 min",
    date: "6 avril 2026",
    topic:
      "électrolytes en trail : rôle physiologique du sodium (équilibre hydrique, contraction musculaire), du potassium (excitabilité cellulaire) et du magnésium (synthèse ATP, relâchement), pertes sudorales pouvant atteindre 1 à 1,5 L/h avec 0,5 à 1,5 g de sodium par litre selon l'individu et la chaleur, risque majeur d'hyponatrémie liée à une surhydratation sans apport salin, protocole pratique (500-1000 mg de sodium/h en forte chaleur), formes disponibles (capsules SaltStick ou Overstim's, boissons isotoniques, bouillon salé aux ravitos), test de sudation personnalisé pour connaître son profil, signes de déséquilibre (crampes tardives, vertiges, nausées, confusion mentale en fin d'effort)",
  },
  {
    slug: "nutrition-avant-course-semaine-qui-precede-ultra",
    title: "Nutrition avant-course : la semaine qui précède un ultra",
    excerpt:
      "Carbohydrate loading, hydratation, fibres, alcool : comment bâtir les sept derniers jours avant le départ pour arriver sur la ligne au top.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Préparation course", "Glucides", "Hydratation", "Ultra"],
    readTime: "8 min",
    date: "8 avril 2026",
    topic:
      "nutrition la semaine avant un ultra : protocole moderne de carbohydrate loading (8-12 g de glucides/kg/jour dans les 36-48 h qui précèdent, plus efficace que l'ancienne semaine d'excès), importance du tapering (réduction du volume d'entraînement pour saturer les stocks de glycogène), hydratation progressive sans excès (viser une urine claire sans se forcer), réduction des fibres à 48 h du départ pour alléger la digestion, alcool déconseillé 72 h avant, repas du soir J-1 (pâtes classiques, éviter les nouveautés, portions maîtrisées), petit-déjeuner jour J (3-4 h avant départ, pain beurre-miel ou porridge, glucides + protéines, faible en gras et fibres), check-list des erreurs fréquentes (régime drastique, nouveautés alimentaires, sous-hydratation de peur de s'arrêter)",
  },
  {
    slug: "erreurs-nutritionnelles-qui-cassent-une-saison-trail",
    title: "Les erreurs nutritionnelles qui cassent une saison entière",
    excerpt:
      "Déficit énergétique relatif, sous-consommation de glucides, carences en fer : ces erreurs invisibles s'accumulent et finissent par briser la progression.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Santé", "RED-S", "Fer", "Performance"],
    readTime: "9 min",
    date: "10 avril 2026",
    topic:
      "erreurs nutritionnelles récurrentes chez le traileur : déficit énergétique relatif (RED-S, répercussions hormonales fréquentes particulièrement chez les femmes, baisse de performance chronique, troubles du cycle menstruel, fragilité osseuse), sous-consommation de glucides par peur de la prise de poids (rendement diminué des séances, épuisement tardif), carence en fer (fréquente, fatigue chronique, baisse de VO2max, signes : pâleur, essoufflement à l'effort, bilan sanguin ferritine + CRP), déshydratation chronique, excès de protéines au détriment des glucides, négligence du postprandial (fenêtre métabolique des 30 min post-séance), carence en vitamine D en hiver, signaux d'alerte (fatigue persistante, sommeil détérioré, humeur, chute de performance), quand consulter un médecin ou nutritionniste du sport",
  },

  // ===== ENTRAÎNEMENT & PERFORMANCES =====
  {
    slug: "plan-entrainement-ultra-quatre-blocs-essentiels",
    title: "Bâtir son plan d'entraînement pour un ultra : les 4 blocs essentiels",
    excerpt:
      "Base, développement, spécifique, affûtage : comprendre ces quatre phases change la façon dont on structure six mois de préparation.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Plan d'entraînement", "Ultra", "Périodisation", "Performance"],
    readTime: "10 min",
    date: "12 avril 2026",
    topic:
      "plan ultra 24 semaines en 4 blocs : bloc 1 base aérobie (8 semaines, volume progressif, 80% d'endurance fondamentale, peu d'intensité, fondations), bloc 2 développement (6 semaines, introduction de seuil et de VMA, sorties longues en côte, premier choc physiologique), bloc 3 spécifique (6 semaines, reproduction du profil réel de la course, sorties dos-à-dos le week-end, dénivelé cumulé hebdomadaire cible), bloc 4 affûtage (3-4 semaines, réduction du volume de 50-60% mais maintien de l'intensité, dernière grosse séance J-10), semaine de récupération tous les 3-4 semaines, adaptation selon la distance cible (50 km, 100 km, 100 miles), tenir compte des contraintes perso (famille, travail)",
  },
  {
    slug: "renforcement-musculaire-trail-exercices-cles",
    title: "Renforcement musculaire pour le trail : les exercices qui changent tout",
    excerpt:
      "Deux séances par semaine bien ciblées font plus pour votre performance en trail que dix sorties supplémentaires. Le programme minimaliste qui marche.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Renforcement", "Musculation", "Performance", "Prévention"],
    readTime: "9 min",
    date: "14 avril 2026",
    topic:
      "renforcement musculaire ciblé pour le trail : chaînes postérieures (ischio-jambiers, fessiers, lombaires), stabilisateurs de la hanche (moyen fessier souvent déficient), mollet et pied (soléaires, triceps sural, intrinsèques), gainage fonctionnel (anti-rotation du tronc), 6 exercices clés à maîtriser : squat bulgare ou fente arrière chargée, soulevé de terre roumain unilatéral, élévation unilatérale sur marche, planche dynamique, bird dog avec tenue, calf raise excentrique en descente de marche, volume recommandé (2 séances hebdomadaires de 30-45 min, à distance des sorties intenses), périodisation (plus de charge hors période de course, entretien pendant), impact prouvé sur l'économie de course et la résistance à la fatigue musculaire",
  },
  {
    slug: "seuil-trail-structurer-intervalles-cote",
    title: "Le seuil en trail : comment structurer ses intervalles en côte",
    excerpt:
      "L'entraînement au seuil, socle de la performance en endurance, doit être pensé différemment quand le dénivelé s'en mêle. Méthodologie.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Seuil", "Intervalles", "Côte", "VMA"],
    readTime: "9 min",
    date: "16 avril 2026",
    topic:
      "intervalles au seuil en côte : définition du seuil lactique (SL2) vs seuil ventilatoire 2, particularité du seuil en montée (fréquence cardiaque typiquement 5-10 bpm plus basse qu'en plat à effort équivalent en lactate), choix de la pente (5-10% pour des efforts longs façon fractionné long, >10% pour force-vitesse et sollicitation plus musculaire), formats classiques (6x3 min en côte moyenne, 4x5 min, 3x8 min avec récupération en descente active), repères d'allure subjective (effort confortablement dur, conversation coupée, sensation maîtrisable), rotation hebdomadaire avec d'autres qualités (VMA en côte courte, endurance en côte longue), erreurs classiques à éviter (partir trop vite sur les premières reps, négliger la récupération descente, multiplier ce type de séance au-delà d'une par semaine)",
  },
  {
    slug: "preparation-mentale-ultra-gerer-nuit-douleur-bas",
    title: "Préparation mentale en ultra : gérer la nuit, la douleur, les bas",
    excerpt:
      "Au-delà de douze heures, le mental bascule. Traverser les nuits et les passages creux relève d'une préparation aussi rigoureuse que l'entraînement physique.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Mental", "Ultra", "Nuit", "Préparation"],
    readTime: "9 min",
    date: "18 avril 2026",
    topic:
      "préparation mentale en ultra-trail : chunking (découpage cognitif de la course en segments courts de ravito à ravito), ancrages mentaux préparés en amont (un mot, une image, un proche qu'on convoque), gestion des bas psychologiques (acceptation sans lutte, dialogue intérieur, rituels de relance : boire, manger, relâcher la cadence), adaptation à la nuit (baisse de lumière → baisse de vigilance → somnolence, gestion du café et de la caféine, micro-sieste active 15-20 min possible), distinction entre douleur inconfort acceptable et signal d'alerte, visualisation répétée en amont des passages durs connus, rôle du crew et des accompagnants (rôle opérationnel et émotionnel), méditation et routine pré-course pour calmer l'anxiété du départ",
  },
  {
    slug: "recuperation-charge-entrainement-eviter-surentrainement",
    title: "Récupération et charge d'entraînement : lire ses signaux pour éviter le surentraînement",
    excerpt:
      "Fréquence cardiaque au repos, variabilité cardiaque, sommeil : trois indicateurs simples pour ajuster sa charge semaine après semaine.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Récupération", "HRV", "Surentraînement", "Charge"],
    readTime: "9 min",
    date: "19 avril 2026",
    topic:
      "charge d'entraînement et récupération en trail : concept de charge aiguë sur chronique (ratio ACWR, zone rouge au-delà de 1,5), fatigue physiologique vs fatigue psychologique, indicateurs simples à tenir soi-même (FC de repos au réveil, HRV mesurée chaque matin avec une montre ou app, qualité du sommeil, humeur, sensation sur une séance repère hebdomadaire), test de Ruffier-Dickson ou saut vertical pour vérifier la fraîcheur physique, signes de surentraînement (baisse de performance prolongée, FC repos anormalement élevée, irritabilité, perte d'appétit ou de poids), outils grand public (montres GPS avec HRV comme Garmin ou Polar, application Elite HRV, Strava score de forme), programmation d'une semaine de décharge tous les 3-4 semaines, périodes critiques à surveiller (avant une course, retour de course), importance capitale du sommeil et de l'alimentation post-séance",
  },
];

const SYSTEM_PROMPT = `Tu es un rédacteur senior pour Altitude Trail, magazine français de trail running.

Mission : rédiger un article long format en français sur un sujet précis en lien avec la pratique du trail. Ton angle est journalistique et pédagogique, aligné sur les bonnes pratiques actuelles (médecine du sport, sciences de l'entraînement, nutrition sportive). Tu peux citer des références sans inventer de chiffres non vérifiables — utilise des fourchettes ("six à huit semaines", "la majorité des coureurs"), jamais un pourcentage chiffré au dixième.

Structure attendue :
- Ouverture (150-220 mots), sans sous-titre : scène concrète, anecdote ou mise en situation, puis problématisation
- 4 sections avec sous-titres ## : développement logique selon le sujet (mécanisme → facteurs → méthode → prévention ; ou bases → planification → exécution → erreurs à éviter ; etc.)
- Conclusion (80-120 mots) sans sous-titre

Contraintes strictes :
- 1000 à 1200 mots au total
- Pas de H1 dans ta sortie (le titre est rendu séparément par la page)
- Markdown pur, aucun fence de code
- Tu peux citer des noms propres plausibles de coureur, coach, kinésithérapeute, médecin du sport ou diététicien pour nourrir un propos, mais pas de citation fictive attribuée à une personnalité réelle
- Pour les sujets médicaux / nutritionnels : renvoyer systématiquement vers un professionnel de santé pour un avis personnalisé

Prompts image (EN anglais, pour flux-pro-1.1) :
- heroPrompt : scène iconique 16:9 évoquant le sujet principal — 40-60 mots
- body1Prompt : scène contextuelle (terrain, équipement, moment illustratif) — 40-60 mots
- body2Prompt : scène d'un moment clé différent du hero et de body1 — 40-60 mots
Chaque prompt ultra-spécifique : sujet, action, décor, lumière, équipement. Pas de style photographique (ajouté automatiquement). Une seule ligne chacun.

Réponds STRICTEMENT au format JSON brut (pas de code fence, pas de prose), schéma :
{"content":"...","heroPrompt":"...","body1Prompt":"...","body2Prompt":"..."}`;

function userPrompt(spec) {
  return `Rédige l'article pour Altitude Trail à partir de ces éléments :

Titre : ${spec.title}
Chapô : ${spec.excerpt}
Sujet détaillé : ${spec.topic}
Catégorie : ${spec.category}
Tags : ${spec.tags.join(", ")}

Réponds UNIQUEMENT avec l'objet JSON demandé par le system prompt. Une seule ligne par prompt image, pas de retour chariot interne.`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function countWords(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

function insertImagesInBody(body, imageRefs) {
  const refs = imageRefs.filter(Boolean);
  if (!refs.length) return body;
  const paragraphs = body.split(/\n{2,}/);
  const total = countWords(body);
  const targets = [200, Math.max(Math.floor(total / 2), 450)];
  const out = [];
  let cum = 0;
  let inserted = 0;
  for (const p of paragraphs) {
    out.push(p);
    cum += countWords(p);
    while (inserted < refs.length && cum >= targets[inserted] && cum < total) {
      const { url, alt } = refs[inserted];
      out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
      inserted++;
    }
  }
  while (inserted < refs.length) {
    const { url, alt } = refs[inserted];
    out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
    inserted++;
  }
  return out.join("\n\n");
}

function extractJson(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("pas de JSON trouvé");
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function generateArticle(client, spec) {
  const stream = client.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt(spec) }],
  });
  const message = await stream.finalMessage();
  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const parsed = extractJson(text);
  if (!parsed.content || !parsed.heroPrompt || !parsed.body1Prompt || !parsed.body2Prompt) {
    throw new Error(`JSON incomplet: ${Object.keys(parsed).join(", ")}`);
  }
  const words = countWords(parsed.content);
  if (words < 700) throw new Error(`content trop court (${words} mots)`);
  return { ...parsed, words };
}

async function generateFalImage(prompt, width, height) {
  const body = {
    prompt: `${prompt.trim()}${STYLE_SUFFIX}`,
    image_size: { width, height },
    num_inference_steps: 28,
    safety_tolerance: "2",
    output_format: "jpeg",
    enable_safety_checker: true,
  };
  const res = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error(`fal: pas d'URL`);
  return url;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

function buildMarkdownFile(spec, body, heroOk) {
  const tagsYaml = `[${spec.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`;
  const imagePath = heroOk ? `/articles/${spec.slug}-hero.jpg` : FALLBACK_HERO;
  const lines = [
    "---",
    `slug: "${spec.slug}"`,
    `title: "${spec.title.replace(/"/g, '\\"')}"`,
    `excerpt: "${spec.excerpt.replace(/"/g, '\\"')}"`,
    `category: "${spec.category}"`,
    `categorySlug: ${spec.categorySlug}`,
    `author: "Rédaction Altitude"`,
    `date: "${spec.date || DEFAULT_DATE}"`,
    `readTime: "${spec.readTime}"`,
    `image: "${imagePath}"`,
    `tags: ${tagsYaml}`,
    "---",
    "",
    body.trim(),
    "",
  ];
  return lines.join("\n");
}

async function processArticle(client, spec) {
  const mdPath = path.join(CONTENT_DIR, `${spec.slug}.md`);
  if (!FORCE && existsSync(mdPath)) {
    console.log(`[new-articles] skip ${spec.slug} (déjà créé)`);
    return { skipped: true };
  }

  console.log(`[new-articles] ${spec.slug}: Claude…`);
  const { content, heroPrompt, body1Prompt, body2Prompt, words } = await generateArticle(client, spec);
  console.log(`[new-articles]   content: ${words} mots`);

  const heroPath = path.join(PUBLIC_IMAGES_DIR, `${spec.slug}-hero.jpg`);
  const body1Path = path.join(PUBLIC_IMAGES_DIR, `${spec.slug}-1.jpg`);
  const body2Path = path.join(PUBLIC_IMAGES_DIR, `${spec.slug}-2.jpg`);

  const results = await Promise.all([
    (async () => {
      const url = await generateFalImage(heroPrompt, HERO_W, HERO_H);
      await downloadImage(url, heroPath);
      return "hero";
    })().catch((e) => {
      console.error(`[new-articles]   hero: error ${e.message}`);
      return null;
    }),
    (async () => {
      const url = await generateFalImage(body1Prompt, BODY_W, BODY_H);
      await downloadImage(url, body1Path);
      return "body1";
    })().catch((e) => {
      console.error(`[new-articles]   body1: error ${e.message}`);
      return null;
    }),
    (async () => {
      const url = await generateFalImage(body2Prompt, BODY_W, BODY_H);
      await downloadImage(url, body2Path);
      return "body2";
    })().catch((e) => {
      console.error(`[new-articles]   body2: error ${e.message}`);
      return null;
    }),
  ]);
  const ok = new Set(results.filter(Boolean));
  console.log(`[new-articles]   images: ${[...ok].join(", ") || "(aucune)"}`);

  const bodyRefs = [];
  if (ok.has("body1")) bodyRefs.push({ url: `/articles/${spec.slug}-1.jpg`, alt: `Illustration ${spec.category}` });
  if (ok.has("body2")) bodyRefs.push({ url: `/articles/${spec.slug}-2.jpg`, alt: `Illustration ${spec.category}` });
  const bodyWithImages = insertImagesInBody(content, bodyRefs);
  const md = buildMarkdownFile(spec, bodyWithImages, ok.has("hero"));
  await fs.writeFile(mdPath, md, "utf8");
  console.log(`[new-articles]   saved ${mdPath}`);
  return { skipped: false };
}

async function main() {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  const client = new Anthropic();
  let done = 0;
  let failed = 0;
  let skipped = 0;
  for (const spec of ARTICLES) {
    try {
      const { skipped: wasSkipped } = await processArticle(client, spec);
      if (wasSkipped) skipped++;
      else done++;
    } catch (e) {
      console.error(`[new-articles] ${spec.slug}: FAILED — ${e.message}`);
      failed++;
    }
  }
  console.log(`[new-articles] terminé — ${done} créé(s), ${skipped} skipped, ${failed} échec(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
