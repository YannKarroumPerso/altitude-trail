"use client";

import { useMemo, useState } from "react";
import ChargeChartLoader from "./ChargeChartLoader";
import { Plan, Seance, SEANCE_COLORS } from "@/types/plan";
import { PlanFormInput } from "@/lib/entrainement-prompt";

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
    courseName: "",
    courseDate: "",
    courseDistance: 42,
    courseDenivele: 2000,
    niveau: "intermediaire",
    volumeActuelKm: 30,
    seancesMaxParSemaine: 5,
    objectifPrincipal: "finir",
    blessuresRecurrentes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [openSeance, setOpenSeance] = useState<string | null>(null);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPlan(null);
    setOpenSeance(null);
    try {
      const res = await fetch("/api/plan-generateur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (!data.plan) throw new Error("Réponse sans plan");
      setPlan(data.plan as Plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="bg-surface-container p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Nom de la course cible</span>
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
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Distance course (km)</span>
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
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Dénivelé + course (m)</span>
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
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Niveau actuel</span>
            <select
              value={form.niveau}
              onChange={(e) => update("niveau", e.target.value as Niveau)}
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
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Objectif principal</span>
            <select
              value={form.objectifPrincipal}
              onChange={(e) => update("objectifPrincipal", e.target.value as Objectif)}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {OBJECTIFS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Blessures récurrentes (facultatif)</span>
            <textarea
              value={form.blessuresRecurrentes}
              onChange={(e) => update("blessuresRecurrentes", e.target.value)}
              placeholder="Ex : tendinite d'Achille droite en avril 2025, syndrome rotulien chronique"
              rows={2}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white font-headline font-black text-xs uppercase tracking-widest py-3 px-6 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Génération en cours…" : "Générer mon plan"}
          </button>
          {loading && (
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              Claude calcule ton plan — 30 à 90 secondes selon la durée de préparation
            </span>
          )}
        </div>
        {error && (
          <div className="border-l-4 border-red-600 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}
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
  return (
    <div className="space-y-10">
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
  openSeance,
  onOpen,
}: {
  semaine: import("@/types/plan").Semaine;
  openSeance: string | null;
  onOpen: (id: string | null) => void;
}) {
  return (
    <div className="bg-white border border-surface-container">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-surface-container">
        <div>
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">Semaine {semaine.numero} · {semaine.phase}</div>
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
          return (
            <SeanceRow
              key={id}
              id={id}
              seance={seance}
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
  isOpen,
  onToggle,
}: {
  id: string;
  seance: Seance;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const color = SEANCE_COLORS[seance.type] || SEANCE_COLORS.REPOS;
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
        <div className="shrink-0 w-16 text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">
          {seance.jour}
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
          {seance.exercices_renforcement?.length > 0 && (
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
          {seance.materiel?.length > 0 && (
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
