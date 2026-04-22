import type { Plan } from "@/types/plan";

export interface PlanContextLike {
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

const NIVEAU_LABEL: Record<string, string> = {
  debutant: "débutant",
  intermediaire: "intermédiaire",
  confirme: "confirmé",
  expert: "expert",
};

const OBJECTIF_LABEL: Record<string, string> = {
  finir: "finir la course sereinement",
  performance: "réaliser une performance personnelle",
  podium: "viser le podium",
  "qualif-utmb": "accumuler des Running Stones pour l'UTMB",
};

function formatDateFr(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PlanIntro({
  plan,
  context,
}: {
  plan: Plan;
  context: PlanContextLike;
}) {
  const prenom = (context.prenom || "").trim();
  const hello = prenom ? `Salut ${prenom},` : "Salut,";

  const dateFr = formatDateFr(context.courseDate);
  const objectifText =
    OBJECTIF_LABEL[context.objectifPrincipal || ""] || context.objectifPrincipal || "finir la course";
  const niveauText = NIVEAU_LABEL[context.niveau || ""] || context.niveau || "inconnu";

  const methodologie = plan.meta.methodologie || "";
  const semainesTotal = plan.meta.semaines_total;
  const volumePic = plan.meta.volume_pic_km;
  const chargeTotale = plan.meta.charge_totale_heures;

  return (
    <section
      aria-label="Introduction personnalisée"
      className="bg-gradient-to-br from-navy to-navy-light text-white p-6 md:p-8 border-l-4 border-primary"
    >
      <div className="text-[10px] font-headline font-black uppercase tracking-widest text-primary mb-3">
        Ton plan personnalisé
      </div>

      <h2 className="font-headline text-2xl md:text-3xl font-black tracking-tight leading-tight mb-4">
        {hello}
      </h2>

      <div className="space-y-4 text-slate-200 leading-relaxed">
        <p>
          Tu prépares <strong className="text-white">{context.courseName || "ta course"}</strong>
          {dateFr && <> — <strong className="text-white">{dateFr}</strong></>}
          {context.courseDistance && context.courseDenivele != null && (
            <>
              , une épreuve de <strong className="text-white">{context.courseDistance} km</strong>
              {" "}avec <strong className="text-white">{context.courseDenivele.toLocaleString("fr-FR")} m de dénivelé positif</strong>
            </>
          )}
          . Ton objectif : <strong className="text-white">{objectifText}</strong>.
        </p>

        <p>
          Nous sommes partis de ton profil de coureur <strong className="text-white">{niveauText}</strong>
          {context.volumeActuelKm != null && (
            <>, à <strong className="text-white">{context.volumeActuelKm} km par semaine</strong> actuellement</>
          )}
          {context.seancesMaxParSemaine != null && (
            <>, avec <strong className="text-white">{context.seancesMaxParSemaine} séances disponibles par semaine</strong></>
          )}
          . Le plan est dimensionné sur <strong className="text-white">{semainesTotal} semaines</strong>
          {volumePic && (
            <>, avec un volume de pic à <strong className="text-white">{volumePic} km/semaine</strong></>
          )}
          {chargeTotale && (
            <> pour une charge totale d'environ <strong className="text-white">{chargeTotale} heures</strong></>
          )}
          .
        </p>

        {methodologie && (
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="text-[10px] font-headline font-black uppercase tracking-widest text-primary mb-2">
              Approche retenue
            </div>
            <p className="italic text-slate-300">{methodologie}</p>
          </div>
        )}

        {context.blessuresRecurrentes && context.blessuresRecurrentes.trim() && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-[10px] font-headline font-black uppercase tracking-widest text-primary mb-2">
              Point de vigilance signalé
            </div>
            <p className="italic text-slate-300">
              Le plan intègre ta contrainte : {context.blessuresRecurrentes}.
            </p>
          </div>
        )}

        <p className="text-sm text-slate-400 italic pt-3">
          Ce plan est <strong className="text-slate-200">indicatif</strong> et repose sur la
          littérature scientifique appliquée au trail. Il ne remplace pas un suivi par un préparateur
          diplômé, en particulier si tu as une blessure en cours ou une pathologie chronique.
        </p>
      </div>
    </section>
  );
}
