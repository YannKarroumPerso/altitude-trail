import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export interface PlanFormData {
  courseName: string;
  courseDate: string;
  courseDistance: number;
  courseDenivele: number;
  niveau: string;
  volumeActuelKm: number;
  seancesMaxParSemaine: number;
  objectifPrincipal: string;
  blessuresRecurrentes?: string;
}

export interface UserData {
  email: string;
  prenom?: string | null;
  age?: number | null;
  sexe?: string | null;
  region?: string | null;
  consentRGPD: boolean;
}

// Cree une ligne plan avec statut "generating" et renvoie son id.
export async function createPendingPlan(args: {
  user: UserData;
  form: PlanFormData;
}): Promise<{ userId: string; planId: string } | null> {
  const client = getSupabaseServer();
  if (!client) return null;

  const { data: userRow, error: userErr } = await client
    .from("users")
    .upsert(
      {
        email: args.user.email.trim().toLowerCase(),
        prenom: args.user.prenom ?? null,
        age: args.user.age ?? null,
        sexe: args.user.sexe ?? null,
        region: args.user.region ?? null,
        consent_rgpd: args.user.consentRGPD,
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();

  if (userErr || !userRow) {
    console.error("[supabase] user upsert error:", userErr?.message);
    return null;
  }

  const { data: planRow, error: planErr } = await client
    .from("plans")
    .insert({
      user_id: userRow.id,
      course_name: args.form.courseName,
      course_date: args.form.courseDate,
      course_distance: args.form.courseDistance,
      course_denivele: args.form.courseDenivele,
      objectif_principal: args.form.objectifPrincipal,
      niveau: args.form.niveau,
      volume_actuel_km: args.form.volumeActuelKm,
      seances_max_par_semaine: args.form.seancesMaxParSemaine,
      blessures_recurrentes: args.form.blessuresRecurrentes || null,
      plan_json: null,
      status: "generating",
    })
    .select("id")
    .single();

  if (planErr || !planRow) {
    console.error("[supabase] plan insert error:", planErr?.message);
    return null;
  }

  return { userId: userRow.id, planId: planRow.id };
}

export async function finalizePlan(planId: string, plan: unknown): Promise<boolean> {
  const client = getSupabaseServer();
  if (!client) return false;
  const { error } = await client
    .from("plans")
    .update({ plan_json: plan, status: "ready" })
    .eq("id", planId);
  if (error) {
    console.error("[supabase] finalize error:", error.message);
    return false;
  }
  return true;
}

export async function markPlanFailed(planId: string, errorMessage: string): Promise<void> {
  const client = getSupabaseServer();
  if (!client) return;
  await client
    .from("plans")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", planId);
}

export interface PlanStatusResult {
  id: string;
  status: "generating" | "ready" | "failed";
  plan: unknown | null;
  error: string | null;
  createdAt: string;
}

export async function getPlanById(planId: string): Promise<PlanStatusResult | null> {
  const client = getSupabaseServer();
  if (!client) return null;
  const { data, error } = await client
    .from("plans")
    .select("id, status, plan_json, error_message, created_at")
    .eq("id", planId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    status: data.status,
    plan: data.plan_json,
    error: data.error_message,
    createdAt: data.created_at,
  };
}
