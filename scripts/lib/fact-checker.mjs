// Agent fact-check pre-publish.
// Mission : detecter dans un article markdown les claims factuels (chronos,
// palmares, dates, citations, donnees chiffrees, noms propres), evaluer
// leur fiabilite, donner un score de confiance 0-100. Si score < SEUIL,
// ping Yann par email (via email-notifier).
//
// Decision : GO (score >= 70), REVIEW (40-69, ping email), REJECT (<40).

import Anthropic from "@anthropic-ai/sdk";
import { notifyYann } from "./email-notifier.mjs";

const MODEL = "claude-haiku-4-5-20251001"; // Haiku rapide + economique pour fact-check
const SEUIL_GO = 70;
const SEUIL_REJECT = 40;

/**
 * Analyse un article markdown et retourne un score de confiance + diagnostic.
 * @param {object} article - { title, content, externalRefs, tags, hotEventSlug, ... }
 * @returns {Promise<{score: number, decision: 'GO'|'REVIEW'|'REJECT', issues: string[], summary: string}>}
 */
export async function factCheckArticle(article) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[fact-check] ANTHROPIC_API_KEY manquante, skip");
    return { score: 100, decision: "GO", issues: [], summary: "skip (pas d'API key)" };
  }
  const client = new Anthropic({ apiKey });

  // Extraire les claims potentiellement risques
  const title = article.title || "";
  const content = article.content || "";
  const refs = (article.externalRefs || []).map((r) => r.url || r.label || "").join(", ");

  const prompt = `Tu es fact-checker pour un media trail running francais (altitude-trail.fr). Mission : evaluer si cet article contient des faits sourcables ou s'il contient des claims a haut risque (dates, chronos, palmares, noms propres, citations directes, donnees chiffrees) qui peuvent etre inexacts.

TITRE : ${title}

CONTENU :
${content.slice(0, 6000)}

REFERENCES EXTERNES :
${refs}

ANALYSE EN 4 ETAPES :

1. **CLAIMS A RISQUE** : liste les 3-5 affirmations factuelles les plus a risque dans cet article (ex : "Kilian Jornet a remporte 11 fois Zegama", "course du 17 mai 2026", "chrono 3h36'40"). Pour chaque claim, indique s'il est sourcable depuis les externalRefs ou non.

2. **SIGNAUX DE QUALITE** :
- Au moins 2 sources externes citees ? (oui/non)
- Dates explicites avec annee ? (oui/non)
- Sources peer-reviewed presentes pour les sujets science/sante ? (oui/non/n.a.)
- Le titre evite-t-il le clickbait u-trail-style (pas de "ces 5 signes", pas de "verite folle") ? (oui/non)
- Le titre est-il sous 75 caracteres ? (oui/non)

3. **SCORE DE CONFIANCE (0-100)** : note globale prenant en compte :
- Sourcage (40 points si >2 sources primaires, 20 si 1 source, 0 si aucune)
- Coherence factuelle interne (30 points si dates/chronos coherents, -10 par incoherence)
- Angle editorial (15 points si question/contradiction, 5 si neutre, 0 si clickbait)
- Risque global (15 points si rien d'inhabituel, -20 si claim suspect sans source)

4. **DECISION** :
- Score >= 70 : GO (publier)
- Score 40-69 : REVIEW (ping Yann pour validation humaine)
- Score < 40 : REJECT (ne pas publier)

OUTPUT JSON STRICT (pas de markdown, juste l'objet) :
{
  "score": <number 0-100>,
  "decision": "GO" | "REVIEW" | "REJECT",
  "issues": ["liste des problemes identifies, 0 a 5 items"],
  "summary": "1 phrase de synthese"
}`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = resp.content[0].text.trim();
  // Extraire le JSON (peut etre entoure de texte)
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("[fact-check] Reponse Claude sans JSON :", text.slice(0, 300));
    return { score: 50, decision: "REVIEW", issues: ["Parsing fact-check echoue"], summary: "Erreur parsing" };
  }
  try {
    const parsed = JSON.parse(match[0]);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      decision: parsed.decision || "REVIEW",
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      summary: String(parsed.summary || ""),
    };
  } catch (err) {
    console.error("[fact-check] JSON parse fail :", err.message);
    return { score: 50, decision: "REVIEW", issues: ["JSON parse fail : " + err.message], summary: "" };
  }
}

/**
 * Si le score est sous le seuil REVIEW, ping Yann par email.
 * Retourne le resultat de l'envoi.
 */
export async function notifyIfDoubt(article, factCheckResult) {
  if (factCheckResult.decision === "GO") {
    return { notified: false, reason: "GO score acceptable" };
  }
  const subject = `Altitude Trail FACT-CHECK ${factCheckResult.decision} : ${article.title}`;
  const body = `Article : ${article.title}
Slug : ${article.slug}
Score : ${factCheckResult.score}/100
Decision : ${factCheckResult.decision}

Synthese : ${factCheckResult.summary}

Problemes detectes :
${factCheckResult.issues.map((i) => `  - ${i}`).join("\n")}

Lien article :
https://www.altitude-trail.fr/articles/${article.slug}

Action requise :
- ${factCheckResult.decision === "REVIEW" ? "Vérifier les claims listés et confirmer si OK pour publication. Sinon supprimer/réécrire." : "Article REJETÉ automatiquement. Vérifier et décider si on tente une réécriture sourcée."}
`;
  return await notifyYann({ subject, body });
}
