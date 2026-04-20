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

const FORCE = process.argv.includes("--force");

const ARTICLES = [
  {
    slug: "fasciite-plantaire-trail-causes-traitement-prevention",
    title: "Fasciite plantaire : pourquoi elle s'invite sur les trails longs et comment s'en prémunir",
    excerpt:
      "La plus tenace des blessures du pied frappe aussi bien les débutants que les ultra-traileurs. Anatomie, causes, traitement et stratégie de retour en douceur.",
    category: "Blessures & Préventions",
    categorySlug: "blessures",
    tags: ["Fasciite plantaire", "Pied", "Récupération", "Prévention"],
    readTime: "8 min",
    topic:
      "fasciite plantaire chez le traileur : anatomie de l'aponévrose, mécanismes de surcharge (volume, dénivelé négatif, chaussures trop rigides ou trop molles), signes d'alerte le matin au lever, diagnostic clinique et par imagerie si besoin, traitement (repos relatif, étirements spécifiques, semelles amortissantes, ondes de choc radiales, PRP en seconde intention), protocole de reprise progressif, renforcement de la voûte plantaire",
  },
  {
    slug: "tendinite-achille-trail-running-mecanisme-prevention",
    title: "Tendinite d'Achille en trail : l'inflammation qui ruine une saison",
    excerpt:
      "Dénivelé positif, chaussures à drop faible, progression trop brutale : trois raisons pour lesquelles le tendon d'Achille cède. On décortique le mécanisme et les parades.",
    category: "Blessures & Préventions",
    categorySlug: "blessures",
    tags: ["Tendinite d'Achille", "Tendon", "Mollet", "Progression"],
    readTime: "8 min",
    topic:
      "tendinopathie du tendon d'Achille chez le traileur : différence entre tendinopathie corporéale et insertionnelle, rôle du dénivelé montant dans la sollicitation, impact du drop des chaussures, signe du talon matinal, traitement actuel basé sur le renforcement excentrique (protocole d'Alfredson), gestion du volume, intérêt du gainage du tronc, retour progressif",
  },
  {
    slug: "syndrome-essuie-glace-itbs-genou-trail-descente",
    title: "Syndrome de l'essuie-glace : la douleur au genou qui vous stoppe en descente",
    excerpt:
      "Ce syndrome frotte, brûle, et contraint à l'abandon sur le côté extérieur du genou. Comprendre le mécanisme change radicalement la façon d'aborder les grandes descentes.",
    category: "Blessures & Préventions",
    categorySlug: "blessures",
    tags: ["ITBS", "Essuie-glace", "Genou", "Descente", "Renforcement"],
    readTime: "7 min",
    topic:
      "syndrome de la bandelette ilio-tibiale (ITBS) chez le traileur : anatomie de la bandelette et insertion sur le tubercule de Gerdy, biomécanique de la descente technique (amortissement excentrique du quadriceps et du moyen fessier), douleur latérale du genou, rôle de la faiblesse du moyen fessier et du valgus dynamique, traitement (repos, étirements, renforcement du moyen fessier, travail du pattern de course), reprise progressive",
  },
  {
    slug: "periostite-tibiale-traileur-debutant-progression",
    title: "Périostite tibiale : le mal qui trahit un volume d'entraînement mal dosé",
    excerpt:
      "Brûlures le long du tibia, sensations de cuisson après chaque sortie : le signal que votre organisme ne suit plus. Diagnostic et protocole de reprise.",
    category: "Blessures & Préventions",
    categorySlug: "blessures",
    tags: ["Périostite", "Tibia", "Débutant", "Volume"],
    readTime: "7 min",
    topic:
      "périostite tibiale chez le coureur en transition vers le trail : inflammation du périoste du tibia, facteurs (augmentation trop rapide du volume, surfaces dures, chaussures usées, déséquilibre musculaire triceps-tibial antérieur), diagnostic différentiel avec la fracture de fatigue, protocole de traitement (glaçage, cross-training, réadaptation progressive), règle des 10% d'augmentation hebdomadaire, renforcement des intrinsèques du pied",
  },
  {
    slug: "entorse-cheville-trail-premiers-gestes-proprioception",
    title: "Entorse de cheville : premiers gestes sur le sentier et protocole de reprise",
    excerpt:
      "Une racine mal vue, un pierrier glissant, et la cheville part sur le côté. Savoir gérer l'instant et construire un retour durable est tout l'enjeu d'un traileur.",
    category: "Blessures & Préventions",
    categorySlug: "blessures",
    tags: ["Entorse", "Cheville", "Premiers secours", "Proprioception"],
    readTime: "9 min",
    topic:
      "entorse de cheville en trail : anatomie ligamentaire (ligament talo-fibulaire antérieur principalement), grades I à III, gestion sur le terrain (protocole GREC/POLICE, attelle de fortune, évacuation), diagnostic à froid, rééducation fondée sur la proprioception et le renforcement des péroniers, plateau de Freeman et travail sur sols instables, prévention par chaussures à tige haute et exercices d'équilibre, récidive fréquente si rééducation négligée",
  },
];

const DATE_LABEL = "20 avril 2026";

const SYSTEM_PROMPT = `Tu es un rédacteur senior pour Altitude Trail, rubrique Blessures & Préventions.

Mission : rédiger un article long format en français sur une blessure ou un sujet de santé propre au trail running. Ton angle est journalistique et pédagogique, aligné sur les bonnes pratiques médicales actuelles. Tu peux citer des références (études, recommandations, experts reconnus) sans inventer de chiffres précis non vérifiables — utilise des fourchettes ("six à huit semaines en général", "la majorité des cas", "trois coureurs sur quatre ressentent"), jamais un pourcentage chiffré au dixième.

Structure attendue :
- Ouverture (150-220 mots), sans sous-titre : scène clinique ou scène sur sentier, puis mise en perspective (fréquence, impact sur la saison, pourquoi le trail expose particulièrement à ce problème)
- 4 sections avec sous-titres ## : mécanisme/anatomie → facteurs déclenchants → diagnostic et signes d'alerte → traitement et prévention/reprise (une section peut fusionner les deux derniers)
- Conclusion (80-120 mots) sans sous-titre

Contraintes strictes :
- 1000 à 1200 mots au total
- Pas de H1 dans ta sortie (le titre est rendu séparément par la page)
- Markdown pur, aucun fence de code
- Tu peux inventer un nom propre plausible de kinésithérapeute ou médecin du sport pour nourrir un propos (ex : "Marion Delmas, kinésithérapeute à Chamonix, souligne…"), mais pas de citation fictive attribuée à une personnalité réelle
- Aucune recommandation de diagnostic à distance : tu renvoies toujours vers un professionnel de santé pour un avis personnalisé

Prompts image (EN anglais, pour flux-pro-1.1) :
- heroPrompt : scène iconique 16:9 évoquant le sujet (gros plan anatomique sur sentier, scène de soin moderne, moment critique sur trail) — 40-60 mots
- body1Prompt : scène contextuelle, par exemple sur terrain ou en cabinet — 40-60 mots
- body2Prompt : scène d'un moment clé (exercice de rééducation, geste technique, prévention active) — 40-60 mots
Chaque prompt ultra-spécifique : sujet, action, décor, lumière, équipement. Pas de style photographique (ajouté automatiquement). Une seule ligne chacun.

Réponds STRICTEMENT au format JSON brut (pas de code fence, pas de prose), schéma :
{"content":"...","heroPrompt":"...","body1Prompt":"...","body2Prompt":"..."}`;

function userPrompt(spec) {
  return `Rédige l'article pour Altitude Trail à partir de ces éléments :

Titre : ${spec.title}
Chapô : ${spec.excerpt}
Sujet clinique détaillé : ${spec.topic}
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

function buildMarkdownFile(spec, body) {
  const tagsYaml = `[${spec.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`;
  const lines = [
    "---",
    `slug: "${spec.slug}"`,
    `title: "${spec.title.replace(/"/g, '\\"')}"`,
    `excerpt: "${spec.excerpt.replace(/"/g, '\\"')}"`,
    `category: "${spec.category}"`,
    `categorySlug: ${spec.categorySlug}`,
    `author: "Rédaction Altitude"`,
    `date: "${DATE_LABEL}"`,
    `readTime: "${spec.readTime}"`,
    `image: "/articles/${spec.slug}-hero.jpg"`,
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
  console.log(`[new-articles]   hero: ${heroPrompt.slice(0, 70)}…`);

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
  const md = buildMarkdownFile(spec, bodyWithImages);
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
  for (const spec of ARTICLES) {
    try {
      const { skipped } = await processArticle(client, spec);
      if (!skipped) done++;
    } catch (e) {
      console.error(`[new-articles] ${spec.slug}: FAILED — ${e.message}`);
      failed++;
    }
  }
  console.log(`[new-articles] terminé — ${done} créé(s), ${failed} échec(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
