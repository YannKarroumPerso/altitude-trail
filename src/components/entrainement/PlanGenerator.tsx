"use client";

import { useEffect, useMemo, useState } from "react";
import ChargeChartLoader from "./ChargeChartLoader";
import { Plan, Seance, SEANCE_COLORS } from "@/types/plan";
import { PlanFormInput } from "@/lib/entrainement-prompt";
import { REGIONS } from "@/lib/regions";

type Niveau = PlanFormInput["niveau"];
type Objectif = PlanFormInput["objectifPrincipal"];

const NIVEAUX: { value: Niveau; label: string }[] = [
  { value: "debutant", label: "Débutant (< 6 mois de pratique)" },
  { value: "intermediaire", label: "Intermédiaire (6 mois - 2 ans)" },
  { value: "confirme", label: "Confirmé (2-5 ans)" },
  { value: "expert", label: "Expert (5+ ans, plusieurs ultras finis)" },
];

const OBJECTIFS: { value: Objectif; label: string }[] = [
  { value: "finir", label: "Finir la course sereinement" },
  { value: "performance", label: "Viser un chrono cible" },
  { value: "podium", label: "Podium / top 10" },
  { value: "qualif-utmb", label: "Qualification UTMB (Running Stones)" },
];

export default function PlanGenerator() {
  const [form, setForm] = useState<PlanFormInput>({
    prenom: "",
    email: "",
    age: undefined,
    sexe: undefined,
    region: "",
    consentRGPD: false,
    niveau: "intermediaire",
    volumeActuelKm: 30,
    seancesMaxParSemaine: 5,
    courseName: "",
    courseDate: "",
    courseDistance: 42,
    courseDenivele: 2000,
    objectifPrincipal: "finir",
    blessuresRecurrentes: "",
  });
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [openSeance, setOpenSeance] = useState<string | null>(null);
  const [streamProgress, setStreamProgress] = useState<StreamProgress>({
    phase: "init",
    weeksDone: 0,
    weeksTotal: 0,
  });

  const totalDenivele = useMemo(
    () => plan?.semaines.reduce((sum, s) => sum + s.denivele_total, 0) ?? 0,
    [plan]
  );
  const totalKm = useMemo(
    () => plan?.semaines.reduce((sum, s) => sum + s.volume_km, 0) ?? 0,
    [plan]
  );

  const update = <K extends keyof PlanFormInput>(k: K, v: PlanFormInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((form.email || "").trim());
  const canProceed = (current: number): boolean => {
    if (current === 1)
      return (
        !!form.prenom &&
        emailOk &&
        !!form.age &&
        form.age >= 12 &&
        form.age <= 99 &&
        !!form.sexe &&
        !!form.region
      );
    if (current === 2)
      return !!form.niveau && form.volumeActuelKm >= 0 && form.seancesMaxParSemaine >= 3;
    if (current === 3)
      return (
        !!form.courseName.trim() &&
        !!form.courseDate &&
        form.courseDistance > 0 &&
        form.courseDenivele >= 0 &&
        !!form.objectifPrincipal
      );
    if (current === 4) return form.consentRGPD;
    return false;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPlan(null);
    setOpenSeance(null);
    setStreamProgress({ phase: "init", weeksDone: 0, weeksTotal: 0 });
    try {
      const res = await fetch("/api/plan-generateur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok && contentType.includes("application/json")) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error("Reponse sans corps");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const errIdx = buffer.indexOf("__STREAM_ERROR__");
        if (errIdx >= 0) {
          throw new Error(buffer.slice(errIdx + 16).trim() || "Erreur pendant la generation");
        }
        setStreamProgress(parseStreamProgress(buffer));
      }

      const clean = buffer.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      const startIdx = clean.indexOf("{");
      const endIdx = clean.lastIndexOf("}");
      if (startIdx === -1 || endIdx === -1) throw new Error("JSON introuvable");
      const parsed = JSON.parse(clean.slice(startIdx, endIdx + 1)) as Plan;
      setPlan(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {loading && <LoadingOverlay progress={streamProgress} />}
      <form onSubmit={onSubmit} className="bg-surface-container p-6 space-y-6 no-print">
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600">
            <span>Étape {step} sur 4</span>
            <span className="text-slate-400">{["Toi", "Ton profil", "Ta course", "Validation"][step - 1]}</span>
          </div>
          <div className="h-1.5 bg-white overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Étape 1 — Identite */}
        {step === 1 && (
          <div className="space-y-5 pt-2">
            <div>
              <h3 className="font-headline text-2xl font-black tracking-tight mb-1">À propos de toi</h3>
              <p className="text-sm text-slate-600">Ces infos nous permettent de personnaliser ton plan. On ne t&apos;enverra pas de spam.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Prénom</span>
                <input
                  type="text"
                  value={form.prenom || ""}
                  onChange={(e) => update("prenom", e.target.value)}
                  placeholder="Ton prénom"
                  required
                  autoComplete="given-name"
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Adresse email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="ton@email.fr"
                  required
                  autoComplete="email"
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Âge</span>
                <input
                  type="number"
                  min={12}
                  max={99}
                  value={form.age ?? ""}
                  onChange={(e) => update("age", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  placeholder="Ex : 35"
                  required
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Sexe</span>
                <select
                  value={form.sexe || ""}
                  onChange={(e) => update("sexe", (e.target.value || undefined) as PlanFormInput["sexe"])}
                  required
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sélectionner</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Région</span>
                <select
                  value={form.region || ""}
                  onChange={(e) => update("region", e.target.value)}
                  required
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sélectionner ta région</option>
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Étape 2 — Profil coureur */}
        {step === 2 && (
          <div className="space-y-5 pt-2">
            <div>
              <h3 className="font-headline text-2xl font-black tracking-tight mb-1">Ton profil coureur</h3>
              <p className="text-sm text-slate-600">Pour calibrer la charge d&apos;entraînement à ton niveau actuel.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Niveau actuel</span>
                <select
                  value={form.niveau}
                  onChange={(e) => update("niveau", e.target.value as PlanFormInput["niveau"])}
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {NIVEAUX.map((n) => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Volume actuel (km/sem)</span>
                <input
                  type="number"
                  min={0}
                  max={250}
                  value={form.volumeActuelKm}
                  onChange={(e) => update("volumeActuelKm", parseInt(e.target.value, 10) || 0)}
                  required
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Séances max / semaine</span>
                <input
                  type="number"
                  min={3}
                  max={7}
                  value={form.seancesMaxParSemaine}
                  onChange={(e) => update("seancesMaxParSemaine", parseInt(e.target.value, 10) || 3)}
                  required
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
          </div>
        )}

        {/* Étape 3 — Course cible */}
        {step === 3 && (
          <div className="space-y-5 pt-2">
            <div>
              <h3 className="font-headline text-2xl font-black tracking-tight mb-1">Ta course cible</h3>
              <p className="text-sm text-slate-600">Le plan sera optimisé pour que tu sois au pic de forme le jour J.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Nom de la course</span>
                <input
                  type="text"
                  value={form.courseName}
                  onChange={(e) => update("courseName", e.target.value)}
                  placeholder="Ex : CCC by UTMB"
                  required
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Date de la course</span>
                <input
                  type="date"
                  value={form.courseDate}
                  onChange={(e) => update("courseDate", e.target.value)}
                  required
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Objectif principal</span>
                <select
                  value={form.objectifPrincipal}
                  onChange={(e) => update("objectifPrincipal", e.target.value as PlanFormInput["objectifPrincipal"])}
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {OBJECTIFS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Distance (km)</span>
                <input
                  type="number"
                  min={5}
                  max={330}
                  value={form.courseDistance}
                  onChange={(e) => update("courseDistance", parseInt(e.target.value, 10) || 0)}
                  required
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Dénivelé positif (m)</span>
                <input
                  type="number"
                  min={0}
                  max={25000}
                  step={50}
                  value={form.courseDenivele}
                  onChange={(e) => update("courseDenivele", parseInt(e.target.value, 10) || 0)}
                  required
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
          </div>
        )}

        {/* Étape 4 — Blessures + consentement + soumission */}
        {step === 4 && (
          <div className="space-y-5 pt-2">
            <div>
              <h3 className="font-headline text-2xl font-black tracking-tight mb-1">Derniers détails</h3>
              <p className="text-sm text-slate-600">Encore une minute et ton plan personnalisé est prêt.</p>
            </div>
            <label className="block">
              <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Blessures récurrentes (facultatif)</span>
              <textarea
                value={form.blessuresRecurrentes}
                onChange={(e) => update("blessuresRecurrentes", e.target.value)}
                placeholder="Ex : tendinite d'Achille droite, syndrome rotulien chronique"
                rows={3}
                className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </label>
            <label className="flex items-start gap-2 cursor-pointer bg-white p-3 border border-slate-200">
              <input
                type="checkbox"
                checked={form.consentRGPD}
                onChange={(e) => update("consentRGPD", e.target.checked)}
                required
                className="mt-0.5 accent-primary"
              />
              <span className="text-xs text-slate-600 leading-snug">
                J&apos;accepte que mon email soit utilisé par Altitude Trail pour me transmettre mon plan
                et m&apos;envoyer des conseils d&apos;entraînement. Je peux me désabonner à tout moment.
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="border-l-4 border-red-600 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
              className="text-slate-600 hover:text-navy font-headline font-bold text-xs uppercase tracking-widest py-3 px-5"
            >
              ← Retour
            </button>
          ) : (
            <span />
          )}
          {step < 4 ? (
            <button
              type="button"
              disabled={!canProceed(step)}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              className="bg-primary text-white font-headline font-black text-xs uppercase tracking-widest py-3 px-6 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant →
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !canProceed(4)}
              className="bg-primary text-white font-headline font-black text-xs uppercase tracking-widest py-3 px-6 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Génération…" : "Générer mon plan"}
            </button>
          )}
        </div>
      </form>

      {plan && (
        <PlanDisplay
          plan={plan}
          totalKm={totalKm}
          totalDenivele={totalDenivele}
          openSeance={openSeance}
          onOpen={setOpenSeance}
        />
      )}
    </div>
  );
}

function PlanDisplay({
  plan,
  totalKm,
  totalDenivele,
  openSeance,
  onOpen,
}: {
  plan: Plan;
  totalKm: number;
  totalDenivele: number;
  openSeance: string | null;
  onOpen: (id: string | null) => void;
}) {
  const planStart = useMemo(() => getPlanStartDate(plan), [plan]);
  const raceDateLabel = useMemo(() => {
    if (!plan.meta.date_course) return "";
    const d = new Date(plan.meta.date_course + "T00:00:00");
    return isNaN(d.getTime())
      ? plan.meta.date_course
      : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }, [plan]);

  return (
    <div id="plan-export" className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-navy pb-4">
        <div>
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">Plan généré</div>
          <h2 className="font-headline text-3xl md:text-4xl font-black tracking-tight leading-tight">
            {plan.meta.course || "Plan d'entraînement"}
          </h2>
          {raceDateLabel && (
            <div className="text-sm text-slate-600 mt-1">Course le {raceDateLabel}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print bg-navy text-white font-headline font-black text-xs uppercase tracking-widest py-3 px-6 hover:opacity-80 transition-opacity"
        >
          Exporter en PDF
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Semaines" value={plan.meta.semaines_total} />
        <Stat label="Volume total" value={`${Math.round(totalKm)} km`} />
        <Stat label="Heures totales" value={`${plan.meta.charge_totale_heures} h`} />
        <Stat label="Dénivelé total" value={`${totalDenivele.toLocaleString("fr-FR")} m`} />
      </div>

      <div className="bg-white border border-surface-container p-6">
        <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-2">Méthodologie</div>
        <p className="font-headline font-bold text-lg leading-snug">{plan.meta.methodologie}</p>
      </div>

      <div>
        <div className="newspaper-divider mb-6"><span>PHASES DE PRÉPARATION</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plan.phases.map((phase, i) => (
            <div key={i} className="bg-surface-container p-4 border-l-4 border-primary">
              <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-1">
                Phase {i + 1} — Semaines {phase.semaines[0]}–{phase.semaines[phase.semaines.length - 1]}
              </div>
              <div className="font-headline font-black text-xl mb-2">{phase.nom}</div>
              <div className="text-sm text-slate-700 mb-2">{phase.objectif}</div>
              <div className="text-xs text-slate-500 italic">{phase.focus}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="newspaper-divider mb-6"><span>CHARGE HEBDOMADAIRE</span></div>
        <div className="bg-white border border-surface-container p-4">
          <ChargeChartLoader plan={plan} />
        </div>
      </div>

      <div>
        <div className="newspaper-divider mb-6"><span>PLAN SEMAINE PAR SEMAINE</span></div>
        <div className="space-y-6">
          {plan.semaines.map((semaine) => (
            <SemaineBlock
              key={semaine.numero}
              semaine={semaine}
              planStart={planStart}
              openSeance={openSeance}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="newspaper-divider mb-6"><span>CONSEILS GÉNÉRAUX</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConseilBox title="Alimentation" text={plan.conseils_globaux.alimentation_generale} />
          <ConseilBox title="Sommeil" text={plan.conseils_globaux.sommeil} />
          <div className="bg-surface-container p-6">
            <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-2">Matériel recommandé</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {plan.conseils_globaux.materiels_recommandes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 border-l-4 border-red-600 p-6">
            <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-red-700 mb-2">Signaux d'alarme</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-red-900">
              {plan.conseils_globaux.signaux_alarme.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-white border border-surface-container p-6 mt-6">
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-2">Ajustements possibles</div>
          <p className="text-sm leading-relaxed text-slate-700">{plan.conseils_globaux.ajustements_possibles}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-container p-4">
      <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="font-headline text-2xl font-black mt-1">{value}</div>
    </div>
  );
}

function ConseilBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-surface-container p-6">
      <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-2">{title}</div>
      <p className="text-sm leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

function SemaineBlock({
  semaine,
  planStart,
  openSeance,
  onOpen,
}: {
  semaine: import("@/types/plan").Semaine;
  planStart: Date | null;
  openSeance: string | null;
  onOpen: (id: string | null) => void;
}) {
  const weekStart = useMemo(() => {
    if (!planStart) return null;
    const d = new Date(planStart);
    d.setDate(planStart.getDate() + (semaine.numero - 1) * 7);
    return d;
  }, [planStart, semaine.numero]);

  const weekRangeLabel = useMemo(() => {
    if (!weekStart) return "";
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const f = (d: Date) =>
      d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return `${f(weekStart)} – ${f(end)}`;
  }, [weekStart]);

  return (
    <div className="bg-white border border-surface-container break-inside-avoid">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-surface-container">
        <div>
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">
            Semaine {semaine.numero} · {semaine.phase}
            {weekRangeLabel && <span className="ml-2 text-slate-400">({weekRangeLabel})</span>}
          </div>
          <div className="font-headline font-black text-xl leading-tight">{semaine.theme}</div>
        </div>
        <div className="flex gap-4 text-sm font-headline font-bold">
          <span><span className="text-primary">{semaine.volume_km}</span> km</span>
          <span><span className="text-primary">{semaine.volume_heures.toFixed(1)}</span> h</span>
          <span><span className="text-primary">+{semaine.denivele_total.toLocaleString("fr-FR")}</span> m</span>
          <span className="text-slate-500">Charge {semaine.charge_relative}%</span>
        </div>
      </div>
      {(semaine.conseils_semaine || semaine.nutrition_conseil || semaine.recuperation_conseil) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-surface-container">
          <MiniConseil label="Focus semaine" text={semaine.conseils_semaine} />
          <MiniConseil label="Nutrition" text={semaine.nutrition_conseil} />
          <MiniConseil label="Récupération" text={semaine.recuperation_conseil} />
        </div>
      )}
      <div className="divide-y divide-surface-container">
        {semaine.seances.map((seance, i) => {
          const id = `s${semaine.numero}-j${i}`;
          const isOpen = openSeance === id;
          const seanceDate = computeSeanceDate(weekStart, seance.jour);
          return (
            <SeanceRow
              key={id}
              id={id}
              seance={seance}
              seanceDate={seanceDate}
              isOpen={isOpen}
              onToggle={() => onOpen(isOpen ? null : id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function MiniConseil({ label, text }: { label: string; text: string }) {
  if (!text) return <div />;
  return (
    <div className="p-4 border-r last:border-r-0 border-surface-container text-sm">
      <div className="text-[9px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <p className="text-slate-700 leading-snug">{text}</p>
    </div>
  );
}

function SeanceRow({
  id,
  seance,
  seanceDate,
  isOpen,
  onToggle,
}: {
  id: string;
  seance: Seance;
  seanceDate: Date | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const color = SEANCE_COLORS[seance.type] || SEANCE_COLORS.REPOS;
  const dateLabel = seanceDate
    ? seanceDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
    : "";
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-detail`}
        className="w-full flex flex-wrap items-center gap-4 p-4 text-left hover:bg-surface-container/60 transition-colors"
      >
        <div
          className="shrink-0 w-20 text-center text-[10px] font-headline font-black uppercase tracking-widest px-2 py-1"
          style={{ background: color.bg, color: color.text }}
        >
          {seance.type}
        </div>
        <div className="shrink-0 w-24 text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">
          <div>{seance.jour}</div>
          {dateLabel && <div className="text-slate-400 normal-case tracking-normal text-[11px] font-normal">{dateLabel}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-headline font-bold text-base truncate">{seance.titre}</div>
          <div className="text-xs text-slate-500">{color.label}</div>
        </div>
        <div className="shrink-0 flex gap-4 text-xs font-headline font-bold text-slate-600">
          {seance.duree_min > 0 && <span>{seance.duree_min} min</span>}
          {seance.distance_km > 0 && <span>{seance.distance_km} km</span>}
          {seance.denivele > 0 && <span>+{seance.denivele} m</span>}
          {seance.rpe_cible > 0 && <span>RPE {seance.rpe_cible}</span>}
        </div>
        <div className="shrink-0 text-slate-400 text-lg font-bold" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </div>
      </button>
      {isOpen && (
        <div id={`${id}-detail`} className="bg-surface-container/50 p-5 space-y-4">
          {seance.description && <p className="text-sm leading-relaxed">{seance.description}</p>}
          {seance.zones_cardio?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {seance.zones_cardio.map((z) => (
                <span key={z} className="bg-navy text-white text-[10px] font-headline font-bold uppercase tracking-widest px-2 py-0.5">{z}</span>
              ))}
            </div>
          )}
          {seance.echauffement && <DetailBlock label="Échauffement" text={seance.echauffement} />}
          {seance.corps_seance && <DetailBlock label="Corps de séance" text={seance.corps_seance} />}
          {seance.retour_calme && <DetailBlock label="Retour au calme" text={seance.retour_calme} />}
          {seance.exercices_renforcement && seance.exercices_renforcement.length > 0 && (
            <div>
              <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-2">Exercices de renforcement</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {seance.exercices_renforcement.map((ex, i) => (
                  <div key={i} className="bg-white p-3 border border-surface-container">
                    <div className="font-headline font-black text-sm mb-1">{ex.nom}</div>
                    <div className="text-xs text-slate-500 mb-2">
                      {ex.series} × {ex.repetitions} · repos {ex.repos_sec}s · {ex.muscle_cible}
                    </div>
                    <div className="text-xs text-slate-700 mb-2">{ex.description}</div>
                    {(ex.variante_debutant || ex.variante_avance) && (
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        {ex.variante_debutant && <div>↓ Débutant : {ex.variante_debutant}</div>}
                        {ex.variante_avance && <div>↑ Avancé : {ex.variante_avance}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {seance.materiel && seance.materiel.length > 0 && (
            <div className="text-xs">
              <span className="font-headline font-bold uppercase tracking-wider text-slate-500">Matériel : </span>
              {seance.materiel.join(", ")}
            </div>
          )}
          {seance.conseils_techniques && (
            <DetailBlock label="Conseils techniques" text={seance.conseils_techniques} />
          )}
        </div>
      )}
    </div>
  );
}

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <p className="text-sm leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

// --- Helpers date ---

const FRENCH_DAY_TO_OFFSET: Record<string, number> = {
  lundi: 0,
  mardi: 1,
  mercredi: 2,
  jeudi: 3,
  vendredi: 4,
  samedi: 5,
  dimanche: 6,
};

function getPlanStartDate(plan: Plan): Date | null {
  if (!plan.meta.date_course || !plan.meta.semaines_total) return null;
  const race = new Date(plan.meta.date_course + "T00:00:00");
  if (isNaN(race.getTime())) return null;
  const offsetFromMonday = (race.getDay() + 6) % 7;
  const raceWeekMonday = new Date(race);
  raceWeekMonday.setDate(race.getDate() - offsetFromMonday);
  const start = new Date(raceWeekMonday);
  start.setDate(raceWeekMonday.getDate() - (plan.meta.semaines_total - 1) * 7);
  return start;
}

function computeSeanceDate(weekStart: Date | null, jour: string): Date | null {
  if (!weekStart) return null;
  const offset = FRENCH_DAY_TO_OFFSET[(jour || "").toLowerCase().trim()];
  if (offset === undefined) return null;
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + offset);
  return d;
}

// --- Overlay d'attente pendant la generation (streaming) ---

interface StreamProgress {
  phase: "init" | "meta" | "phases" | "weeks" | "conseils" | "done";
  weeksDone: number;
  weeksTotal: number;
}

function parseStreamProgress(buffer: string): StreamProgress {
  const totalMatch = buffer.match(/"semaines_total"\s*:\s*(\d+)/);
  const weeksTotal = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const weeksDone = (buffer.match(/"numero"\s*:\s*\d+/g) || []).length;

  let phase: StreamProgress["phase"] = "init";
  if (buffer.includes('"conseils_globaux"')) phase = "conseils";
  else if (buffer.includes('"semaines"')) phase = "weeks";
  else if (buffer.includes('"phases"')) phase = "phases";
  else if (buffer.includes('"meta"')) phase = "meta";

  return { phase, weeksDone, weeksTotal };
}

function LoadingOverlay({ progress }: { progress: StreamProgress }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(tick);
  }, []);
  const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");

  const steps: { key: StreamProgress["phase"]; label: string }[] = [
    { key: "meta", label: "Analyse de ton profil" },
    { key: "phases", label: "Structuration des phases" },
    { key: "weeks", label: "Construction des semaines" },
    { key: "conseils", label: "Conseils nutrition & recuperation" },
  ];
  const order: StreamProgress["phase"][] = ["init", "meta", "phases", "weeks", "conseils", "done"];
  const currentIndex = order.indexOf(progress.phase);

  const weeksPct =
    progress.weeksTotal > 0
      ? Math.min(100, Math.round((progress.weeksDone / progress.weeksTotal) * 100))
      : 0;

  return (
    <div className="no-print fixed inset-0 z-[100] bg-navy/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white p-8 md:p-10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">
            Generation en direct
          </span>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 tabular-nums">
            {mm}:{ss}
          </span>
        </div>

        <h3 className="font-headline text-2xl md:text-3xl font-black tracking-tight leading-tight mb-6">
          Nous construisons ton plan personnalise
        </h3>

        <ul className="space-y-2 mb-6">
          {steps.map((step, i) => {
            const stepOrderIdx = order.indexOf(step.key);
            const done = currentIndex > stepOrderIdx;
            const active = currentIndex === stepOrderIdx;
            return (
              <li key={step.key} className="flex items-center gap-3">
                <span
                  className={`shrink-0 w-5 h-5 flex items-center justify-center text-[11px] font-black ${
                    done
                      ? "bg-primary text-white"
                      : active
                      ? "bg-white border-2 border-primary text-primary"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`text-sm ${
                    active
                      ? "text-navy font-headline font-bold"
                      : done
                      ? "text-slate-500 line-through"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                  {step.key === "weeks" && active && progress.weeksTotal > 0 && (
                    <span className="ml-2 text-primary">
                      {progress.weeksDone}/{progress.weeksTotal}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        {progress.phase === "weeks" && progress.weeksTotal > 0 && (
          <div className="mb-6">
            <div className="h-2 bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${weeksPct}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-[13px] text-slate-600 leading-relaxed">
          Ton plan se construit en direct, <strong>semaine par semaine</strong>.
          <br />
          <strong className="text-red-600">Ne ferme pas cette page</strong>, tu vas voir ton plan apparaitre.
        </p>
      </div>
    </div>
  );
}
