import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

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

// Genere un token URL-safe de 32 caracteres (base64url sur 24 bytes)
export function generateAccessToken(): string {
  return randomBytes(24).toString("base64url");
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

export async function createPendingPlan(args: {
  user: UserData;
  form: PlanFormData;
}): Promise<{ userId: string; planId: string; accessToken: string } | null> {
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

  const accessToken = generateAccessToken();

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
      access_token: accessToken,
    })
    .select("id")
    .single();

  if (planErr || !planRow) {
    console.error("[supabase] plan insert error:", planErr?.message);
    return null;
  }

  return { userId: userRow.id, planId: planRow.id, accessToken };
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

export interface PlanContext {
  prenom: string | null;
  courseName: string;
  courseDate: string | null;
  courseDistance: number | null;
  courseDenivele: number | null;
  niveau: string | null;
  volumeActuelKm: number | null;
  seancesMaxParSemaine: number | null;
  objectifPrincipal: string | null;
  blessuresRecurrentes: string | null;
}

export interface PlanStatusResult {
  id: string;
  status: "generating" | "ready" | "failed";
  plan: unknown | null;
  error: string | null;
  createdAt: string;
  accessToken?: string;
  // Données du formulaire + user, pour enrichir l'affichage côté front.
  context?: PlanContext | null;
}

// Lookup par token d'acces (URL publique) : c'est ce que le client et le lien email utilisent.
export async function getPlanByAccessToken(token: string): Promise<PlanStatusResult | null> {
  const client = getSupabaseServer();
  if (!client) return null;
  const { data, error } = await client
    .from("plans")
    .select(
      "id, status, plan_json, error_message, created_at, access_token, " +
        "course_name, course_date, course_distance, course_denivele, " +
        "niveau, volume_actuel_km, seances_max_par_semaine, " +
        "objectif_principal, blessures_recurrentes, users(prenom)"
    )
    .eq("access_token", token)
    .single();
  if (error || !data) return null;

  // Supabase infère parfois `data` comme un union contenant GenericStringError
  // quand le select combine colonnes + relation. On force le type attendu via
  // un double cast (unknown intermédiaire pour satisfaire TS).
  type PlanRow = {
    id: string;
    status: "generating" | "ready" | "failed";
    plan_json: unknown | null;
    error_message: string | null;
    created_at: string;
    access_token: string;
    course_name: string | null;
    course_date: string | null;
    course_distance: number | null;
    course_denivele: number | null;
    niveau: string | null;
    volume_actuel_km: number | null;
    seances_max_par_semaine: number | null;
    objectif_principal: string | null;
    blessures_recurrentes: string | null;
    users: { prenom: string | null } | { prenom: string | null }[] | null;
  };
  const row = data as unknown as PlanRow;

  // Normalisation user (peut être objet ou array selon l'inférence Supabase)
  const rawUsers = row.users;
  const u = Array.isArray(rawUsers) ? rawUsers[0] : rawUsers;
  const prenom = (u && typeof u === "object" && (u as { prenom?: string | null }).prenom) || null;

  const context: PlanContext = {
    prenom,
    courseName: String(row.course_name || ""),
    courseDate: row.course_date || null,
    courseDistance: typeof row.course_distance === "number" ? row.course_distance : null,
    courseDenivele: typeof row.course_denivele === "number" ? row.course_denivele : null,
    niveau: row.niveau || null,
    volumeActuelKm: typeof row.volume_actuel_km === "number" ? row.volume_actuel_km : null,
    seancesMaxParSemaine:
      typeof row.seances_max_par_semaine === "number" ? row.seances_max_par_semaine : null,
    objectifPrincipal: row.objectif_principal || null,
    blessuresRecurrentes: row.blessures_recurrentes || null,
  };

  return {
    id: row.id,
    status: row.status,
    plan: row.plan_json,
    error: row.error_message,
    createdAt: row.created_at,
    accessToken: row.access_token,
    context,
  };
}

// Lookup par id interne (usage interne, p.ex. apres creation pour recuperer le user)
export async function getPlanById(planId: string): Promise<PlanStatusResult | null> {
  const client = getSupabaseServer();
  if (!client) return null;
  const { data, error } = await client
    .from("plans")
    .select("id, status, plan_json, error_message, created_at, access_token")
    .eq("id", planId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    status: data.status,
    plan: data.plan_json,
    error: data.error_message,
    createdAt: data.created_at,
    accessToken: data.access_token,
  };
}

// Recupere l'email + prenom d'un user par son id (pour envoyer l'email de notification)
export async function getUserForPlan(planId: string): Promise<{
  email: string;
  prenom: string | null;
} | null> {
  const client = getSupabaseServer();
  if (!client) return null;
  const { data, error } = await client
    .from("plans")
    .select("users(email, prenom)")
    .eq("id", planId)
    .single();
  if (error || !data) return null;
  // Supabase typage : users peut etre un array (1-n) ou un objet (1-1). On normalise.
  const rawUsers = (data as unknown as { users: unknown }).users;
  const u = Array.isArray(rawUsers) ? rawUsers[0] : rawUsers;
  if (!u || typeof u !== "object") return null;
  const user = u as { email?: string; prenom?: string | null };
  if (!user.email) return null;
  return { email: user.email, prenom: user.prenom ?? null };
}
