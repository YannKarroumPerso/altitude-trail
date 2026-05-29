// Wrapper autour des appels Anthropic qui log les tokens + cout reel
// par run. Centralise le pricing pour faciliter les mises a jour.
//
// Usage dans un pipeline :
//   import { trackCost, summarize } from "./lib/anthropic-cost-tracker.mjs";
//   const message = await client.messages.create({...});
//   trackCost(MODEL, message.usage);
//   // ... fin du pipeline :
//   summarize();  // imprime un recap "TokenUsage script.mjs : 12.5K input / 3.2K output / $0.052"

// Pricing en USD per 1M tokens (au 2026-05-29).
// IMPORTANT : a remettre a jour si Anthropic change ses tarifs.
const PRICING = {
  "claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    cache_write: 3.75,  // input + 25%
    cache_read: 0.30,   // input × 10%
    thinking: 3.0,      // tokens internes thinking factures comme input
  },
  "claude-haiku-4-5-20251001": {
    input: 0.80,
    output: 4.0,
    cache_write: 1.0,   // input + 25%
    cache_read: 0.08,   // input × 10%
    thinking: 0.80,     // input rate
  },
  // fallback raisonnable si modele inconnu : tarif Haiku
  "_default": {
    input: 0.80,
    output: 4.0,
    cache_write: 1.0,
    cache_read: 0.08,
    thinking: 0.80,
  },
};

const _runStats = {
  callCount: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCacheCreationTokens: 0,
  totalCacheReadTokens: 0,
  totalThinkingTokens: 0,
  totalCostUsd: 0,
};

/**
 * Tracke le cout d'un appel Anthropic. Lit usage retourne par l'API.
 * @param {string} model - ex "claude-haiku-4-5-20251001"
 * @param {object} usage - objet `message.usage` retourne par messages.create
 *   Champs : input_tokens, output_tokens, cache_creation_input_tokens,
 *   cache_read_input_tokens, et thinking_tokens si dispo.
 */
export function trackCost(model, usage) {
  const tariff = PRICING[model] || PRICING._default;
  const inputTok = usage.input_tokens || 0;
  const outputTok = usage.output_tokens || 0;
  const cacheCreation = usage.cache_creation_input_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;
  const thinking = usage.thinking_tokens || 0;

  const cost = (
    (inputTok / 1_000_000) * tariff.input +
    (outputTok / 1_000_000) * tariff.output +
    (cacheCreation / 1_000_000) * tariff.cache_write +
    (cacheRead / 1_000_000) * tariff.cache_read +
    (thinking / 1_000_000) * tariff.thinking
  );

  _runStats.callCount++;
  _runStats.totalInputTokens += inputTok;
  _runStats.totalOutputTokens += outputTok;
  _runStats.totalCacheCreationTokens += cacheCreation;
  _runStats.totalCacheReadTokens += cacheRead;
  _runStats.totalThinkingTokens += thinking;
  _runStats.totalCostUsd += cost;

  // Log immediat pour suivi en temps reel
  console.log(
    `[cost] ${model} | input ${inputTok}t (cache w:${cacheCreation} r:${cacheRead}) | output ${outputTok}t | thinking ${thinking}t | $${cost.toFixed(4)}`
  );
}

/**
 * Imprime le total du run + estimation mensuelle si on extrapole sur 30j
 * avec la frequence cron du pipeline appelant.
 * @param {object} [opts]
 * @param {string} [opts.scriptName="unknown"]
 * @param {number} [opts.runsPerDay=1]
 */
export function summarize({ scriptName = "unknown", runsPerDay = 1 } = {}) {
  const s = _runStats;
  const monthly = s.totalCostUsd * runsPerDay * 30;
  console.log("─────────────────────────────────────");
  console.log(`[cost-summary] ${scriptName}`);
  console.log(`  Appels Anthropic    : ${s.callCount}`);
  console.log(`  Input tokens        : ${s.totalInputTokens.toLocaleString()}`);
  console.log(`  Output tokens       : ${s.totalOutputTokens.toLocaleString()}`);
  console.log(`  Cache create/read   : ${s.totalCacheCreationTokens.toLocaleString()} / ${s.totalCacheReadTokens.toLocaleString()}`);
  console.log(`  Thinking tokens     : ${s.totalThinkingTokens.toLocaleString()}`);
  console.log(`  Cout total ce run   : $${s.totalCostUsd.toFixed(4)}`);
  console.log(`  Cout mensuel projete: $${monthly.toFixed(2)} (si ${runsPerDay} run/jour x 30j)`);
  console.log("─────────────────────────────────────");
}

/**
 * Retourne les stats brutes (pour tests ou agrégation custom).
 */
export function getStats() {
  return { ..._runStats };
}

/**
 * Reset les stats (utile pour les tests qui simulent plusieurs runs).
 */
export function resetStats() {
  _runStats.callCount = 0;
  _runStats.totalInputTokens = 0;
  _runStats.totalOutputTokens = 0;
  _runStats.totalCacheCreationTokens = 0;
  _runStats.totalCacheReadTokens = 0;
  _runStats.totalThinkingTokens = 0;
  _runStats.totalCostUsd = 0;
}
