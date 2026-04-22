"use client";

import { useEffect, useRef, useState } from "react";
import PlanDisplay from "./PlanDisplay";
import { Plan } from "@/types/plan";

type PlanStatus = "generating" | "ready" | "failed";

interface StatusResponse {
  id: string;
  status: PlanStatus;
  plan: Plan | null;
  error: string | null;
  createdAt: string;
}

const TIPS = [
  {
    title: "La règle des 10 %",
    body: "On ne dépasse jamais +10 % de volume par semaine. C'est la règle d'or pour éviter tendinites et fractures de stress.",
  },
  {
    title: "80/20 polarisé",
    body: "Les coureurs d'élite passent 80 % du temps en endurance facile et 20 % en intensité. L'entre-deux est le piège à fatigue.",
  },
  {
    title: "La sortie longue du dimanche",
    body: "Non négociable. C'est elle qui construit l'endurance musculaire et la capacité oxydative sur ultra-trail.",
  },
  {
    title: "Récupération = progression",
    body: "Les adaptations se font au repos, pas pendant l'effort. Une semaine de décharge toutes les 3-4 semaines, c'est obligatoire.",
  },
  {
    title: "Gestion du dénivelé",
    body: "En trail, 100 m D+ ≈ 1 km plat en termes de charge. Tes sorties s'évaluent en km-effort, pas en km bruts.",
  },
  {
    title: "Nutrition training",
    body: "Ton estomac s'entraîne aussi. 60 à 90 g de glucides/heure sur les sorties longues pour habituer l'absorption.",
  },
];

export default function MonPlanClient({ accessToken }: { accessToken: string }) {
  const [status, setStatus] = useState<PlanStatus>("generating");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/plan-generateur/status?token=${encodeURIComponent(accessToken)}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (res.status === 404) {
            setError("Plan introuvable. Il a peut-être expiré.");
            setStatus("failed");
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as StatusResponse;
        if (cancelled) return;
        setStatus(data.status);
        if (data.status === "ready" && data.plan) {
          setPlan(data.plan);
        }
        if (data.status === "failed") {
          setError(data.error || "La génération a échoué. Réessaie plus tard.");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    };

    // Premier appel immediat, puis polling toutes les 3 secondes tant que generating
    poll();
    pollRef.current = setInterval(() => {
      poll();
    }, 3000);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [accessToken]);

  // Arret du polling quand on a un statut final
  useEffect(() => {
    if ((status === "ready" || status === "failed") && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [status]);

  // Timer elapsed + rotation des tips
  useEffect(() => {
    if (status !== "generating") return;
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    const rot = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 7000);
    return () => {
      clearInterval(tick);
      clearInterval(rot);
    };
  }, [status]);

  if (status === "ready" && plan) {
    return <PlanDisplay plan={plan} />;
  }

  if (status === "failed") {
    return (
      <div className="bg-red-50 border-l-4 border-red-600 p-6 space-y-3">
        <h2 className="font-headline font-black text-xl text-red-900">Génération échouée</h2>
        <p className="text-sm text-red-800">{error || "Une erreur est survenue."}</p>
        <a
          href="/entrainement/generateur"
          className="inline-block bg-primary text-white font-headline font-black text-xs uppercase tracking-widest py-3 px-6 hover:opacity-80 transition-opacity"
        >
          Réessayer
        </a>
      </div>
    );
  }

  const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");
  const tip = TIPS[tipIndex];

  return (
    <div className="space-y-8">
      {/* Bandeau principal */}
      <div className="bg-navy text-white p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-headline font-black uppercase tracking-widest text-primary">
            En cours de génération
          </span>
          <span className="text-[10px] font-headline font-black uppercase tracking-widest text-slate-400 tabular-nums">
            {mm}:{ss}
          </span>
        </div>
        <h2 className="font-headline text-2xl md:text-3xl font-black tracking-tight leading-tight">
          Ton plan est en cours de construction
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          La génération prend <strong className="text-white">60 à 120 secondes</strong>. Tu peux fermer cette
          page et revenir plus tard, ton plan sera disponible sur cette URL.
          <br />
          <span className="text-primary">Tu peux aussi nous laisser t&apos;envoyer le plan par email
          quand il est prêt.</span>
        </p>
        <div className="h-1.5 bg-navy-light/50 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${Math.min(95, (elapsed / 90) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Tips rotatifs pour engager l'utilisateur */}
      <div className="bg-white border-l-4 border-primary p-6 space-y-3">
        <div className="text-[10px] font-headline font-black uppercase tracking-widest text-primary">
          Pendant qu&apos;on travaille — Le savais-tu ?
        </div>
        <div key={tipIndex} className="animate-[fadeIn_0.5s_ease-in-out]">
          <h3 className="font-headline text-xl font-black tracking-tight mb-2">{tip.title}</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{tip.body}</p>
        </div>
        <div className="flex gap-1.5 pt-2">
          {TIPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 transition-colors ${
                i === tipIndex ? "bg-primary" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Reassurance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          icon="📬"
          title="Email automatique"
          body="Un lien vers ton plan sera envoyé sur l&apos;email que tu as fourni dès qu&apos;il est prêt."
        />
        <InfoCard
          icon="🔗"
          title="URL permanente"
          body="Cette page est la tienne. Bookmark-la, partage-la, reviens quand tu veux."
        />
        <InfoCard
          icon="⚡"
          title="Aucune urgence"
          body="Si tu fermes l&apos;onglet, la génération continue en arrière-plan. Tu peux revenir plus tard."
        />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="bg-surface-container p-5 space-y-2">
      <div className="text-2xl" aria-hidden="true">{icon}</div>
      <h4 className="font-headline font-black text-sm uppercase tracking-wide">{title}</h4>
      <p className="text-xs text-slate-700 leading-relaxed">{body}</p>
    </div>
  );
}
