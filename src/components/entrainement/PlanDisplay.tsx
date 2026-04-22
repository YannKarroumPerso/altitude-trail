"use client";

import { useMemo, useState } from "react";
import ChargeChartLoader from "./ChargeChartLoader";
import PlanIntro, { type PlanContextLike } from "./PlanIntro";
import { Plan, Seance, SEANCE_COLORS } from "@/types/plan";

export default function PlanDisplay({
  plan,
  context,
}: {
  plan: Plan;
  context?: PlanContextLike | null;
}) {
  const [openSeance, setOpenSeance] = useState<string | null>(null);
  const totalDenivele = useMemo(
    () => plan.semaines.reduce((sum, s) => sum + s.denivele_total, 0),
    [plan],
  );
  const totalKm = useMemo(
    () => plan.semaines.reduce((sum, s) => sum + s.volume_km, 0),
    [plan],
  );
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
      {context && <PlanIntro plan={plan} context={context} />}
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
              onOpen={setOpenSeance}
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
            <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-red-700 mb-2">Signaux d&apos;alarme</div>
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
    const f = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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

// Helpers dates

const FRENCH_DAY_TO_OFFSET: Record<string, number> = {
  lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, samedi: 5, dimanche: 6,
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
