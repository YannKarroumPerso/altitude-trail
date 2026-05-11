#!/usr/bin/env node
/**
 * sync-secrets.mjs — pousse les secrets locaux (.secrets/*.txt) vers Vercel + GitHub Actions.
 * Usage: node scripts/sync-secrets.mjs [--dry-run]
 * Ajouter un secret: 1) cree .secrets/xxx.txt  2) ajoute mapping NAMING  3) npm run sync-secrets
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sodium from "libsodium-wrappers";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SECRETS_DIR = path.join(REPO_ROOT, ".secrets");
const VERCEL_PROJECT_ID = "prj_ptixycm8pZfWnpBCDrTAq1aMO4rZ";
const GITHUB_OWNER = "YannKarroumPerso";
const GITHUB_REPO = "altitude-trail";

const NAMING = {
  github_token:              { vercel: null,                        github_actions: null },
  github_username:           { vercel: null,                        github_actions: null },
  vercel_token:              { vercel: null,                        github_actions: null },
  gemini_api_key:            { vercel: "GEMINI_API_KEY",            github_actions: "GEMINI_API_KEY" },
  anthropic_api_key:         { vercel: "ANTHROPIC_API_KEY",         github_actions: "ANTHROPIC_API_KEY" },
  bfl_api_key:               { vercel: null,                        github_actions: "BFL_API_KEY" },
  youtube_api_data:          { vercel: "YOUTUBE_API_DATA",          github_actions: "YOUTUBE_API_DATA" },
  tavily_api_key:            { vercel: "TAVILY_API_KEY",            github_actions: "TAVILY_API_KEY" },
  resend_api_key:            { vercel: "RESEND_API_KEY",            github_actions: null },
  supabase_url:              { vercel: "SUPABASE_URL",              github_actions: null },
  supabase_service_role_key: { vercel: "SUPABASE_SERVICE_ROLE_KEY", github_actions: null },
  pagespeed_api_key:         { vercel: "PAGESPEED_API_KEY",         github_actions: null },
  cron_secret:               { vercel: "CRON_SECRET",               github_actions: null },
  github_trigger_pat:        { vercel: "GITHUB_TRIGGER_PAT",        github_actions: null },
  gmail_app_password:        { vercel: null,                        github_actions: "GMAIL_APP_PASSWORD" },
};

const DRY_RUN = process.argv.includes("--dry-run");
const log  = (s, m) => console.log(`[sync] ${s}: ${m}`);
const warn = (s, m) => console.warn(`[sync] ${s}: WARN ${m}`);
const fail = (m) => { console.error(`[sync] FATAL ${m}`); process.exit(1); };

async function loadLocalSecrets() {
  let entries;
  try { entries = await fs.readdir(SECRETS_DIR); }
  catch (e) {
    if (e.code === "ENOENT") fail(`dossier ${SECRETS_DIR} introuvable. Cree-le avec : mkdir .secrets`);
    throw e;
  }
  const out = new Map();
  for (const f of entries) {
    if (!f.endsWith(".txt")) continue;
    const key = f.slice(0, -4).toLowerCase();
    const raw = await fs.readFile(path.join(SECRETS_DIR, f), "utf8");
    const value = raw.replace(/^﻿/, "").trim();
    if (!value) { warn("local", `${f} vide, ignore`); continue; }
    out.set(key, value);
  }
  return out;
}

async function vercelGetEnvs(token) {
  const r = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?decrypt=false`,
    { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) { const t = await r.text(); throw new Error(`Vercel GET envs failed: ${r.status} ${t}`); }
  const j = await r.json();
  return Array.isArray(j.envs) ? j.envs : [];
}

async function vercelCreateEnv(token, key, value) {
  const r = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ key, value, target: ["production", "preview"], type: "sensitive" }),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`Vercel POST ${key} failed: ${r.status} ${t}`); }
}

async function vercelUpdateEnv(token, envId, key, value) {
  const r = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env/${envId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ value, target: ["production", "preview"], type: "sensitive" }),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`Vercel PATCH ${key} failed: ${r.status} ${t}`); }
}

async function syncVercel(secrets) {
  const token = secrets.get("vercel_token");
  if (!token) { warn("vercel", "pas de .secrets/vercel_token.txt, skip"); return; }
  let existing = [];
  if (!DRY_RUN) existing = await vercelGetEnvs(token);
  const byKey = new Map(existing.map((e) => [e.key, e]));
  for (const [localName, value] of secrets.entries()) {
    const map = NAMING[localName];
    if (!map) { warn("vercel", `secret local "${localName}" absent du NAMING, ignore`); continue; }
    const vKey = map.vercel;
    if (!vKey) continue;
    const found = byKey.get(vKey);
    if (DRY_RUN) { log("vercel", `${vKey} -> ${found ? "update (force)" : "create"} [dry-run]`); continue; }
    try {
      if (found) { await vercelUpdateEnv(token, found.id, vKey, value); log("vercel", `${vKey} -> updated`); }
      else       { await vercelCreateEnv(token, vKey, value);            log("vercel", `${vKey} -> created`); }
    } catch (e) { console.error(`[sync] vercel ${vKey} ERROR:`, e.message); }
  }
}

async function ghGetPublicKey(token) {
  const r = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/secrets/public-key`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } }
  );
  if (!r.ok) { const t = await r.text(); throw new Error(`GitHub GET public-key failed: ${r.status} ${t}`); }
  return await r.json();
}

async function ghPutSecret(token, name, encryptedValue, keyId) {
  const r = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/secrets/${name}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      body: JSON.stringify({ encrypted_value: encryptedValue, key_id: keyId }),
    }
  );
  if (!r.ok && r.status !== 201 && r.status !== 204) {
    const t = await r.text();
    throw new Error(`GitHub PUT secret ${name} failed: ${r.status} ${t}`);
  }
}

function sealSecret(plain, base64PublicKey) {
  const pubBytes = sodium.from_base64(base64PublicKey, sodium.base64_variants.ORIGINAL);
  const msgBytes = sodium.from_string(plain);
  const sealed = sodium.crypto_box_seal(msgBytes, pubBytes);
  return sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL);
}

async function syncGithub(secrets) {
  const token = secrets.get("github_token");
  if (!token) { warn("github", "pas de .secrets/github_token.txt, skip"); return; }
  await sodium.ready;
  let publicKey = null;
  if (!DRY_RUN) publicKey = await ghGetPublicKey(token);
  for (const [localName, value] of secrets.entries()) {
    const map = NAMING[localName];
    if (!map) continue;
    const ghKey = map.github_actions;
    if (!ghKey) continue;
    if (DRY_RUN) { log("github", `${ghKey} -> PUT (encrypted) [dry-run]`); continue; }
    try {
      const enc = sealSecret(value, publicKey.key);
      await ghPutSecret(token, ghKey, enc, publicKey.key_id);
      log("github", `${ghKey} -> updated`);
    } catch (e) { console.error(`[sync] github ${ghKey} ERROR:`, e.message); }
  }
}

async function main() {
  log("init", `repo root = ${REPO_ROOT}`);
  log("init", `dry-run   = ${DRY_RUN}`);
  const secrets = await loadLocalSecrets();
  log("init", `${secrets.size} secret(s) charge(s) depuis .secrets/`);
  for (const k of secrets.keys()) {
    if (!(k in NAMING)) warn("naming", `"${k}" present mais absent du NAMING (ajoute le mapping si tu veux qu il soit pousse)`);
  }
  for (const k of Object.keys(NAMING)) {
    if (!secrets.has(k)) log("naming", `"${k}" mappe mais .secrets/${k}.txt absent (ok si non utilise)`);
  }
  await syncVercel(secrets);
  await syncGithub(secrets);
  log("done", DRY_RUN ? "dry-run termine, rien pousse." : "sync termine.");
}

main().catch((e) => { console.error("[sync] crash:", e); process.exit(1); });
