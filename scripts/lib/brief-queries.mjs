// Banques de requêtes Tavily pour les brèves actu chaude.
// Trois verticales distinctes, chacune avec ses domaines d'autorité.
//
// Ne JAMAIS mélanger avec QUERY_POOL de veille-tavily.mjs : les brèves ont
// leur propre cap, leur propre gabarit éditorial (format court) et leur
// propre fenêtre de fraîcheur (3 jours, vs 7 pour la veille classique).

// ─── Verticale 1 : ÉQUIPEMENT & CHAUSSURES ─────────────────────────────────
// Priorité SEO #1 : marché francophone sous-servi, forte intention commerciale.

const EQUIPMENT_DOMAINS = [
  // Médias trail internationaux (reviews + announcements)
  "irunfar.com",
  "trailrunnermag.com",
  "runrepeat.com",
  "runnersworld.com",
  "runningmagazine.ca",
  "believeintherun.com",
  "doctorsofrunning.com",
  // Médias français
  "lepape-info.com",
  "u-trail.com",
  "trail-session.fr",
  "passiontrail.com",
  // Sites marques (pages news / press releases)
  "salomon.com",
  "hoka.com",
  "lasportiva.com",
  "altrarunning.com",
  "scarpa.com",
  "nnormal.com",
  "adidas.com",
  "asics.com",
  "merrell.com",
  "saucony.com",
  "mizunorunning.com",
  "brooksrunning.com",
  "norda.run",
  "speedland.running",
  "vjsport.com",
];

const EQUIPMENT_QUERIES = [
  {
    query: '"trail running shoe" release 2026 new model launch review',
    angle: "Sortie récente d'une chaussure trail : spécifications, drop, stack, terrain cible, prix annoncé, disponibilité France.",
  },
  {
    query: '"Hoka" OR "Salomon" OR "La Sportiva" new trail shoe 2026 launch announcement',
    angle: "Annonce produit chez un major trail : positionnement dans la gamme, évolution vs modèle précédent, disponibilité FR.",
  },
  {
    query: '"carbon plate" trail running shoe 2026 review race',
    angle: "Chaussures carbone pour trail : nouveaux modèles, performances en course, adoption par les élites.",
  },
  {
    query: '"Nnormal" OR "Norda" OR "Speedland" trail shoe 2026 review',
    angle: "Marques émergentes premium : actualité produit, positionnement marché, perception critique.",
  },
  {
    query: '"trail running vest" OR "hydration pack" 2026 release review',
    angle: "Sac d'hydratation et gilets trail : nouveautés, capacités, compatibilité flasks, prix.",
  },
  {
    query: '"GPS watch" trail running 2026 release Garmin Coros Suunto',
    angle: "Montres GPS pour trail : nouveautés Garmin/Coros/Suunto, autonomie, cartographie, précision.",
  },
  {
    query: '"trail running poles" carbon 2026 new review',
    angle: "Bâtons de trail : nouveautés carbone, pliage Z, poids annoncés, tests terrain.",
  },
  {
    query: '"headlamp" trail ultra night running 2026 release',
    angle: "Lampes frontales pour trail nocturne : lumens, autonomie, poids, adaptations ultra.",
  },
  {
    query: '"Speedgoat" OR "Sense Ride" OR "Mutant" trail shoe update 2026',
    angle: "Mise à jour d'un modèle iconique (Speedgoat, Sense Ride, Mutant) : évolutions, conservation de l'ADN, retour des testeurs.",
  },
  {
    query: '"waterproof" OR "Gore-Tex" trail running shoe 2026 review',
    angle: "Chaussures imperméables trail : membranes utilisées, respirabilité, retour d'usage en conditions humides.",
  },
  {
    query: '"recovery" OR "compression" socks trail running 2026 new',
    angle: "Chaussettes compression et récupération : nouveautés techniques, bénéfices mesurés, prix.",
  },
  {
    query: '"rain jacket" trail running waterproof breathable 2026 release',
    angle: "Vestes imperméables trail : poids, hydrostatique, respirabilité, compressibilité, prix.",
  },
  {
    query: '"gaiter" OR "guêtre" trail running mountain 2026 new',
    angle: "Guêtres trail : protection contre cailloux et neige, compatibilité chaussures, retours pratiques.",
  },
  {
    query: '"Altra" OR "Topo" zero drop trail running 2026 launch review',
    angle: "Chaussures zero drop (Altra, Topo) : actualité gamme, retour des coureurs en transition.",
  },
  {
    query: '"trail running gear" OR "matériel trail" nouveauté 2026 France',
    angle: "Actualité matériel trail marché français : disponibilité, prix en euros, revendeurs.",
  },
];

const EQUIPMENT_VERTICAL = EQUIPMENT_QUERIES.map((q) => ({
  ...q,
  vertical: "equipement",
  categorySlug: "equipement",
  include_domains: EQUIPMENT_DOMAINS,
}));

// ─── Verticale 2 : MARQUES & INDUSTRIE ─────────────────────────────────────
// Actualité business-oriented : annonces corporate, sponsorings, organisations.

const INDUSTRY_DOMAINS = [
  "irunfar.com",
  "trailrunnermag.com",
  "ultrarunning.com",
  "runnersworld.com",
  "runningmagazine.ca",
  "runningusa.org",
  "lepape-info.com",
  "u-trail.com",
  "trail-session.fr",
  "trail-endurance.com",
  "utmb.world",
  "utmbmontblanc.com",
  "goldentrailseries.com",
  "itra.run",
  "worldathletics.org",
  "ispo.com",
  "outdoorretailer.com",
];

const INDUSTRY_QUERIES = [
  {
    query: '"UTMB World Series" 2026 announcement new race partnership',
    angle: "Actualité UTMB World Series : ajouts au calendrier, nouveaux partenariats, règles qualifications Running Stones.",
  },
  {
    query: '"Golden Trail Series" 2026 calendar athletes partnership',
    angle: "Actualité Golden Trail Series : calendrier, coureurs engagés, évolutions du format.",
  },
  {
    query: '"ITRA" index ranking trail 2026 update announcement',
    angle: "ITRA : évolutions du classement, nouvelles courses labellisées, règles de qualification.",
  },
  {
    query: '"Hoka" OR "Salomon" sponsorship athlete signing trail 2026',
    angle: "Transferts et signatures : nouvelles recrues dans les écuries marques, ruptures de contrat.",
  },
  {
    query: '"trail running" brand acquisition merger 2026 business',
    angle: "Acquisitions et fusions dans l'industrie trail : impact sur l'offre, stratégie corporate.",
  },
  {
    query: '"ISPO" OR "Outdoor Retailer" trail running 2026 new product announcement',
    angle: "Salons outdoor (ISPO, OR Summer/Winter Market) : annonces produits, tendances de la saison à venir.",
  },
  {
    query: '"trail running" race organization cancellation safety 2026',
    angle: "Annulations et reports de courses : raisons avancées, impact sur le calendrier FR et international.",
  },
  {
    query: '"trail running industry" sustainability ecolabel 2026',
    angle: "Initiatives durabilité dans l'industrie trail : programmes carbone, matériaux recyclés, transport.",
  },
  {
    query: '"French trail" federation FFA organization 2026',
    angle: "Fédérations françaises et trail : FFA, positions officielles, championnats.",
  },
  {
    query: '"trail running shoe" brand strategy 2026 market',
    angle: "Stratégie des marques sur le segment trail : lancements, retraits de modèles, positionnement.",
  },
  {
    query: '"UTMB" qualifications Running Stones new rules 2026',
    angle: "Évolutions des règles de qualification UTMB (Running Stones, Index) : impact pour les coureurs FR.",
  },
  {
    query: '"Skyrunning" ISF federation 2026 announcement',
    angle: "Fédération Skyrunning (ISF) : circuit World Series, règles, courses FR/ITA.",
  },
  {
    query: '"trail running" prize money elite 2026 announcement',
    angle: "Dotations et prize money sur les grandes courses : évolutions, disparités hommes/femmes.",
  },
  {
    query: '"trail running" broadcast streaming rights 2026 UTMB',
    angle: "Diffusion en direct des grandes courses : plateformes, droits, qualité couverture.",
  },
  {
    query: '"running magazine" OR "trail magazine" France 2026 lancement',
    angle: "Écosystème média trail en France : lancements, fusions, ligne éditoriale.",
  },
];

const INDUSTRY_VERTICAL = INDUSTRY_QUERIES.map((q) => ({
  ...q,
  vertical: "marques-industrie",
  categorySlug: "marques-industrie",
  include_domains: INDUSTRY_DOMAINS,
}));

// ─── Verticale 3 : ATHLÈTES ─────────────────────────────────────────────────
// Portraits, transferts, performances. Angle factuel et prudent :
// zéro spéculation sur vie privée, blessures non-confirmées, contrats non-signés.

const ATHLETE_DOMAINS = [
  "irunfar.com",
  "trailrunnermag.com",
  "ultrarunning.com",
  "lepape-info.com",
  "u-trail.com",
  "trail-session.fr",
  "runnersworld.com",
  "runningmagazine.ca",
  "theoutdoorjournal.com",
  "redbull.com",
  "worldathletics.org",
  "itra.run",
];

const ATHLETE_QUERIES = [
  {
    query: '"Kilian Jornet" 2026 announcement project race',
    angle: "Actualité Kilian Jornet : projets annoncés, courses inscrites, déclarations publiques factuelles.",
  },
  {
    query: '"Courtney Dauwalter" 2026 race result announcement',
    angle: "Actualité Courtney Dauwalter : courses, performances, déclarations officielles.",
  },
  {
    query: '"Jim Walmsley" 2026 UTMB Western States race result',
    angle: "Actualité Jim Walmsley : calendrier, résultats, déclarations officielles.",
  },
  {
    query: '"François D\'Haene" 2026 annonce course projet',
    angle: "Actualité François D'Haene : projets montagne, courses, publications officielles.",
  },
  {
    query: '"Katie Schide" trail ultramarathon 2026 result',
    angle: "Actualité Katie Schide : performances, courses engagées, calendrier.",
  },
  {
    query: '"trail running" athlete signing contract 2026 brand',
    angle: "Transferts d'athlètes entre marques : contrats annoncés, ruptures, nouveaux sponsors.",
  },
  {
    query: '"FKT" fastest known time record trail mountain 2026',
    angle: "Records FKT validés : itinéraire, temps, athlète, conditions. Sources Fastestknowntime.com obligatoires.",
  },
  {
    query: '"Vasu Sojitra" OR "Mathieu Blanchard" trail 2026 announce',
    angle: "Actualité coureurs francophones ou portraits atypiques : projets, performances, parcours.",
  },
  {
    query: '"Pau Capell" OR "Dakota Jones" trail 2026 race interview',
    angle: "Actualité élite espagnole et américaine : courses, interviews, performances.",
  },
  {
    query: '"Ruth Croft" OR "Abby Hall" trail 2026 result race',
    angle: "Élite féminine internationale : résultats, calendriers, déclarations officielles.",
  },
  {
    query: '"trail running" athlete retirement comeback 2026 announcement',
    angle: "Retraites et retours en compétition : annonces officielles, context carrière.",
  },
  {
    query: '"trail running" athlete injury recovery 2026 official statement',
    angle: "Blessures d'athlètes : uniquement sur déclarations officielles ou publications de l'athlète. Pas de spéculation.",
  },
  {
    query: '"Blandine L\'Hirondel" OR "Clémentine Geoffray" trail 2026 course',
    angle: "Élite féminine française : courses engagées, résultats, projets.",
  },
  {
    query: '"Zach Miller" OR "Tom Evans" trail 2026 race result',
    angle: "Élite masculine internationale : performances, calendriers, stratégies annoncées.",
  },
  {
    query: '"trail running" young talent rising star 2026 profile',
    angle: "Jeunes coureurs émergents : profils, premiers podiums, trajectoire. Vérifier les chiffres avant publication.",
  },
];

const ATHLETE_VERTICAL = ATHLETE_QUERIES.map((q) => ({
  ...q,
  vertical: "athletes",
  categorySlug: "athletes",
  include_domains: ATHLETE_DOMAINS,
}));

// ─── Export combiné ────────────────────────────────────────────────────────

export const BRIEF_VERTICALS = {
  equipement: EQUIPMENT_VERTICAL,
  "marques-industrie": INDUSTRY_VERTICAL,
  athletes: ATHLETE_VERTICAL,
};

export const BRIEF_POOL = [
  ...EQUIPMENT_VERTICAL,
  ...INDUSTRY_VERTICAL,
  ...ATHLETE_VERTICAL,
];

/**
 * Pioche N queries distinctes depuis le pool des brèves, en rotation
 * équitable entre les 3 verticales (ordre : équipement → industrie → athlètes).
 * Déterministe sur l'horodatage pour éviter les doublons entre runs rapprochés.
 */
export function pickBriefQueriesForRun(count, seedDate = new Date()) {
  const hourKey = `${seedDate.getUTCFullYear()}-${seedDate.getUTCMonth()}-${seedDate.getUTCDate()}-${seedDate.getUTCHours()}`;
  let h = 0;
  for (let i = 0; i < hourKey.length; i++) h = (h * 31 + hourKey.charCodeAt(i)) & 0xffffffff;
  const absHash = Math.abs(h);

  // Ordre déterministe des verticales : on pivote par jour pour balancer
  const verticalOrder = [
    ["equipement", EQUIPMENT_VERTICAL],
    ["marques-industrie", INDUSTRY_VERTICAL],
    ["athletes", ATHLETE_VERTICAL],
  ];
  const dayOffset = absHash % verticalOrder.length;
  const rotated = [
    ...verticalOrder.slice(dayOffset),
    ...verticalOrder.slice(0, dayOffset),
  ];

  const out = [];
  const seen = new Set();
  let pickIdx = 0;
  // Tour 1 : 1 query par verticale (round-robin)
  while (out.length < count && pickIdx < rotated.length * 5) {
    const [, queries] = rotated[pickIdx % rotated.length];
    const qIdx = (absHash + Math.floor(pickIdx / rotated.length) * 7) % queries.length;
    const q = queries[qIdx];
    const key = q.query;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(q);
    }
    pickIdx++;
  }
  return out;
}
