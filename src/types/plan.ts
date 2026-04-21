// Types du plan d'entraînement retourné par /api/plan-generateur.
// Alignés sur la structure JSON stricte imposée au modèle dans
// src/lib/entrainement-prompt.ts.

export type SeanceType =
  | "REPOS"
  | "EF"
  | "SL"
  | "VMA"
  | "TEMPO"
  | "TRAIL"
  | "RENFORCEMENT"
  | "CROISE";

export type SeanceCategorie =
  | "recuperation"
  | "endurance"
  | "intensite"
  | "specifique"
  | "renforcement"
  | "croisement";

export interface Exercice {
  nom: string;
  series: number;
  repetitions: string;
  repos_sec: number;
  description: string;
  muscle_cible: string;
  variante_debutant?: string;
  variante_avance?: string;
}

export interface Seance {
  jour: string;
  type: SeanceType;
  categorie: SeanceCategorie;
  titre: string;
  duree_min: number;
  distance_km: number;
  denivele: number;
  rpe_cible: number;
  zones_cardio: string[];
  description: string;
  echauffement: string;
  corps_seance: string;
  retour_calme: string;
  exercices_renforcement: Exercice[];
  materiel: string[];
  conseils_techniques: string;
}

export interface Semaine {
  numero: number;
  phase: string;
  theme: string;
  volume_km: number;
  volume_heures: number;
  denivele_total: number;
  charge_relative: number;
  conseils_semaine: string;
  nutrition_conseil: string;
  recuperation_conseil: string;
  seances: Seance[];
}

export interface Phase {
  nom: string;
  semaines: number[];
  objectif: string;
  focus: string;
}

export interface ConseilsGlobaux {
  materiels_recommandes: string[];
  alimentation_generale: string;
  sommeil: string;
  signaux_alarme: string[];
  ajustements_possibles: string;
}

export interface PlanMeta {
  course: string;
  date_course: string;
  semaines_total: number;
  volume_depart_km: number;
  volume_pic_km: number;
  charge_totale_heures: number;
  methodologie: string;
}

export interface Plan {
  meta: PlanMeta;
  phases: Phase[];
  semaines: Semaine[];
  conseils_globaux: ConseilsGlobaux;
}

export const SEANCE_COLORS: Record<SeanceType, { bg: string; text: string; label: string }> = {
  EF:          { bg: "#10b981", text: "#ffffff", label: "Endurance fondamentale" },
  SL:          { bg: "#3b82f6", text: "#ffffff", label: "Sortie longue" },
  VMA:         { bg: "#dc2626", text: "#ffffff", label: "VMA" },
  TEMPO:       { bg: "#ea580c", text: "#ffffff", label: "Tempo / Seuil" },
  TRAIL:       { bg: "#8b5cf6", text: "#ffffff", label: "Trail technique" },
  RENFORCEMENT:{ bg: "#eab308", text: "#0a1628", label: "Renforcement" },
  CROISE:      { bg: "#06b6d4", text: "#ffffff", label: "Entraînement croisé" },
  REPOS:       { bg: "#64748b", text: "#ffffff", label: "Repos" },
};
