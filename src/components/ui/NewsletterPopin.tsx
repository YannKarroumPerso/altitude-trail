"use client";

/**
 * Popin newsletter qui s'affiche après 60 secondes passées sur le site.
 *
 * Principes UX :
 *   - Affichée une seule fois, sauf si l'utilisateur redemande (refresh du
 *     localStorage) → on garde en mémoire 30 jours.
 *   - Fermable via 4 gestes distincts : bouton X, clic sur backdrop, touche
 *     Escape, ou soumission réussie.
 *   - Pas intrusive : pas de popup modale bloquante au démarrage.
 *
 * Respect RGPD :
 *   - Consentement explicite par clic sur "M'inscrire" (double opt-in mail à
 *     venir côté API).
 *   - Mention des conditions (pas de revente, résiliation 1 clic) visible.
 */

import { useEffect, useRef, useState } from "react";

const LOCALSTORAGE_KEY = "at-newsletter-popin-closed-at";
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours
const DELAY_MS = 60_000; // 60 secondes

type Status = "idle" | "submitting" | "success" | "error";

export default function NewsletterPopin() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Montre la popin après DELAY_MS, sauf si dismiss récent en localStorage.
  useEffect(() => {
    // Skip si déjà dismiss dans les 30 derniers jours
    try {
      const dismissed = localStorage.getItem(LOCALSTORAGE_KEY);
      if (dismissed) {
        const ts = parseInt(dismissed, 10);
        if (!isNaN(ts) && Date.now() - ts < DISMISS_DURATION_MS) {
          return; // pas d'affichage
        }
      }
    } catch {
      // localStorage indispo (safari privé, etc.) → on affiche normalement
    }

    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Focus sur le bouton close à l'ouverture pour accessibilité
  useEffect(() => {
    if (visible && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [visible]);

  // Fermeture via Escape
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);

  }, [visible]);

  function persistDismiss() {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, String(Date.now()));
    } catch {}
  }

  function close() {
    persistDismiss();
    setVisible(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setErrorMessage("Adresse email invalide.");
      return;
    }
    if (!consent) {
      setErrorMessage("Tu dois consentir à l'inscription pour continuer.");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), consent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setStatus("success");
      persistDismiss();
      // Fermeture automatique 4s après succès
      setTimeout(() => setVisible(false), 4000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Erreur inattendue, réessaie plus tard."
      );
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="bg-white max-w-md w-full shadow-2xl relative animate-slide-up">
        {/* Bouton fermer */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={close}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-navy hover:bg-surface-container transition-colors text-xl"
        >
          ✕
        </button>

        {status === "success" ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h2 className="font-headline text-2xl font-black mb-2 text-navy">
              Inscription enregistrée
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tu recevras nos prochaines actualités trail par email. Un mail de
              confirmation arrive dans ta boîte de réception.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-navy text-white p-6 border-b-4 border-primary">
              <div className="text-[10px] font-headline font-black uppercase tracking-widest text-primary mb-2">
                Altitude Trail
              </div>
              <h2
                id="newsletter-title"
                className="font-headline text-2xl md:text-3xl font-black leading-tight tracking-tight"
              >
                Ne rate plus aucune actu trail
              </h2>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Reçois nos articles, les résultats des grandes courses et les
                dernières analyses directement dans ta boîte mail. Une à deux fois
                par semaine, jamais de spam.
              </p>

              <label className="block">
                <span className="sr-only">Adresse email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex items-start gap-2 text-xs text-slate-600 leading-snug cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 shrink-0 accent-primary"
                />
                <span>
                  J&apos;accepte de recevoir la newsletter d&apos;Altitude Trail.
                  Je peux me désinscrire en un clic depuis n&apos;importe quel email.
                  Aucune revente, aucun partage.
                </span>
              </label>

              {errorMessage && (
                <p className="text-sm text-red-600 bg-red-50 border-l-2 border-red-600 px-3 py-2">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 transition-colors text-white font-headline font-black text-sm uppercase tracking-widest py-3"
              >
                {status === "submitting" ? "Inscription..." : "M'inscrire"}
              </button>

              <p className="text-center">
                <button
                  type="button"
                  onClick={close}
                  className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-4"
                >
                  Non merci, je préfère rester libre
                </button>
              </p>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}
