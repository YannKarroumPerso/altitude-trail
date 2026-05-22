// Envoi d'emails via Gmail SMTP pour notifications fact-check.
// Necessite : .secrets/gmail_app_password.txt (App Password Gmail).
// Mode dry-run automatique si pas de password (log au lieu d'envoi).

import nodemailer from "nodemailer";
import fs from "node:fs/promises";
import path from "node:path";

const GMAIL_USER = "yannkarroum@gmail.com";
const GMAIL_FROM = "Altitude Trail Bot <yannkarroum@gmail.com>";

async function getGmailPassword() {
  // 1) Variable d'env (cas GitHub Actions)
  if (process.env.GMAIL_APP_PASSWORD) return process.env.GMAIL_APP_PASSWORD;
  // 2) Fichier local .secrets/
  const localPath = path.resolve(".secrets/gmail_app_password.txt");
  try {
    const content = await fs.readFile(localPath, "utf8");
    return content.trim();
  } catch {
    return null;
  }
}

/**
 * Envoie un email de notification a Yann.
 * Si pas de gmail_app_password, mode dry-run : log seulement.
 *
 * @param {object} args
 * @param {string} args.subject - sujet email
 * @param {string} args.body - corps texte
 * @param {string} [args.bodyHtml] - corps HTML optionnel
 * @returns {Promise<{sent: boolean, dryRun: boolean, error?: string}>}
 */
export async function notifyYann({ subject, body, bodyHtml }) {
  const password = await getGmailPassword();
  if (!password) {
    console.log(`[notifier] DRY-RUN (pas de gmail_app_password) | ${subject}`);
    console.log(`[notifier] BODY:\n${body}`);
    return { sent: false, dryRun: true };
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: password },
    });
    await transporter.sendMail({
      from: GMAIL_FROM,
      to: GMAIL_USER,
      subject,
      text: body,
      ...(bodyHtml ? { html: bodyHtml } : {}),
    });
    console.log(`[notifier] Email envoye : ${subject}`);
    return { sent: true, dryRun: false };
  } catch (err) {
    console.error(`[notifier] Echec envoi : ${err.message}`);
    return { sent: false, dryRun: false, error: err.message };
  }
}
