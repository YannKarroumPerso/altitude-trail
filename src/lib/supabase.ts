// Client Supabase cote serveur uniquement.
// Ne JAMAIS importer ce module depuis un composant client.
// La service role key donne un acces total a la base, elle doit rester serveur.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null; // graceful degradation : on ignore la DB si pas config
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

// Enregistre un user (upsert par email) puis le plan associe.
// Retourne { userId, planId } en cas de succes, null si Supabase est pas config.
export async function persistPlanGeneration(args: {
  email: string;
  prenom?: string | null;
  age?: number | null;
  sexe?: string | null;
  region?: string | null;
  consentRGPD: boolean;
  form: {
    courseName: string;
    courseDate: string;
    courseDistance: number;
    courseDenivele: number;
    niveau: string;
    volumeActuelKm: number;
    seancesMaxParSemaine: number;
    objectifPrincipal: string;
    blessuresRecurrentes?: string;
  };
  plan: unknown;
}): Promise<{ userId: string; planId: string } | null> {
  const client = getSupabaseServer();
  if (!client) return null;

  // Upsert user sur la cle email
  const { data: userRow, error: userErr } = await client
    .from("users")
    .upsert(
      {
        email: args.email.trim().toLowerCase(),
        prenom: args.prenom ?? null,
        age: args.age ?? null,
        sexe: args.sexe ?? null,
        region: args.region ?? null,
        consent_rgpd: args.consentRGPD,
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
      plan_json: args.plan,
    })
    .select("id")
    .single();

  if (planErr || !planRow) {
    console.error("[supabase] plan insert error:", planErr?.message);
    return { userId: userRow.id, planId: "" };
  }

  return { userId: userRow.id, planId: planRow.id };
}
