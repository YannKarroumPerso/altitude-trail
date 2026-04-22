"use client";

/**
 * Popin newsletter — version soignée mobile-first.
 *
 * Design :
 *   - Mobile (<640px) : bottom sheet plein écran, rounded-t, slide depuis le bas
 *   - Desktop : modale centrée max 440px, slide + fade
 *   - Hero visuel avec image article + overlay navy gradient
 *   - Formulaire minimaliste, gros input tactile
 *   - Animations 300ms
 */

import { useEffect, useRef, useState } from "react";

const LOCALSTORAGE_KEY = "at-newsletter-popin-closed-at";
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const DELAY_MS = 60_000;

type Status = "idle" | "submitting" | "success" | "error";

export default function NewsletterPopin() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(LOCALSTORAGE_KEY);
      if (dismissed) {
        const ts = parseInt(dismissed, 10);
        if (!isNaN(ts) && Date.now() - ts < DISMISS_DURATION_MS) return;
      }
    } catch {}
    const t = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setMounted(true));
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (visible && closeBtnRef.current) closeBtnRef.current.focus();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [visible]);

  function persistDismiss() {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, String(Date.now()));
    } catch {}
  }

  function close() {
    setMounted(false);
    setTimeout(() => {
      persistDismiss();
      setVisible(false);
    }, 300);
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
      setErrorMessage("Tu dois accepter la newsletter pour continuer.");
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
      setTimeout(() => {
        setMounted(false);
        setTimeout(() => setVisible(false), 300);
      }, 5000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Erreur inattendue, réessaie plus tard."
      );
    }
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={
          "fixed inset-0 z-[100] bg-black transition-opacity duration-300 " +
          (mounted ? "opacity-60 backdrop-blur-sm" : "opacity-0 pointer-events-none")
        }
        onClick={close}
        aria-hidden="true"
      />

      {/* Conteneur popin */}
      <div
        className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center pointer-events-none sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-title"
      >
        <div
          className={
            "relative pointer-events-auto bg-white w-full sm:max-w-[440px] overflow-hidden shadow-2xl transition-all duration-300 ease-out " +
            "rounded-t-[20px] sm:rounded-lg max-h-[92vh] overflow-y-auto " +
            (mounted
              ? "translate-y-0 opacity-100 sm:scale-100"
              : "translate-y-full sm:translate-y-4 opacity-0 sm:scale-95")
          }
        >
          {/* Poignée mobile */}
          <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-300 rounded-full" aria-hidden="true" />

          {/* Bouton fermer */}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all rounded-full"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {status === "success" ? (
            /* ──── Écran succès ──── */
            <div className="bg-navy text-white px-6 pt-10 pb-10 sm:px-10 sm:pt-14 sm:pb-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary mb-6">
                <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="text-[11px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-3">
                Bienvenue
              </div>
              <h2 className="font-headline text-3xl sm:text-4xl font-black leading-[1.05] tracking-tight mb-4">
                C&apos;est parti
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xs mx-auto">
                On vient de t&apos;envoyer un email avec nos trois articles de référence pour bien démarrer.
              </p>
            </div>
          ) : (
            <>
              {/* Hero visuel */}
              <div className="relative h-[200px] sm:h-[220px] overflow-hidden bg-navy">
                {/* Image de fond (paysage alpin) */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('/articles/preparer-premier-trail-10-km-conseils-cles-hero.jpg')",
                  }}
                  aria-hidden="true"
                />
                {/* Overlay dégradé navy pour lisibilité du texte */}
                <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/75 to-navy" aria-hidden="true" />

                {/* Badge */}
                <div className="relative h-full flex flex-col justify-end p-6 sm:p-8">
                  <div className="text-[10px] font-headline font-black uppercase tracking-[0.25em] text-primary mb-2">
                    Newsletter Altitude Trail
                  </div>
                  <h2
                    id="newsletter-title"
                    className="font-headline text-2xl sm:text-3xl font-black leading-[1.1] tracking-tight text-white pr-10"
                  >
                    L&apos;actu trail,
                    <br />
                    <span className="text-primary">1 à 2 fois par semaine.</span>
                  </h2>
                </div>
              </div>

              {/* Formulaire */}
              <form onSubmit={onSubmit} className="px-6 sm:px-8 pt-6 pb-7 sm:pb-8 space-y-4">
                <p className="text-[15px] text-slate-700 leading-relaxed">
                  Les résultats des grandes courses, nos analyses et les articles qui comptent — directement dans ta boîte mail. Zéro spam, désinscription en 1 clic.
                </p>

                <label className="block">
                  <span className="sr-only">Adresse email</span>
                  <input
                    type="email"
                    required
                    inputMode="email"
                    autoComplete="email"
                    placeholder="ton@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b-2 border-slate-200 focus:border-primary bg-transparent px-0 py-3 text-[16px] focus:outline-none transition-colors placeholder:text-slate-400"
                  />
                </label>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all text-white font-headline font-black text-sm uppercase tracking-[0.15em] py-4 mt-2"
                >
                  {status === "submitting" ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                      </svg>
                      Inscription…
                    </span>
                  ) : (
                    <>S&apos;inscrire gratuitement</>
                  )}
                </button>

                <label className="flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 shrink-0 w-4 h-4 accent-primary cursor-pointer"
                  />
                  <span>
                    J&apos;accepte de recevoir la newsletter et je peux me désinscrire à tout moment. Voir la{" "}
                    <a href="/charte-editoriale" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-primary">
                      charte
                    </a>
                    .
                  </span>
                </label>

                {errorMessage && (
                  <p
                    className="text-sm text-red-700 bg-red-50 border-l-4 border-red-600 px-3 py-2.5"
                    role="alert"
                  >
                    {errorMessage}
                  </p>
                )}

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="text-xs text-slate-400 hover:text-slate-700 transition-colors underline underline-offset-2"
                  >
                    Non merci, une autre fois
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
