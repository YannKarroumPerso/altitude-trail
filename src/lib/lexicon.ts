// Lexique du trail running — 40 termes essentiels.
// Chaque entrée renvoie vers une catégorie ou un article du site pour
// renforcer le maillage interne depuis la page /lexique (gros levier SEO :
// des requêtes longue traîne type "c'est quoi le D+ en trail" tombent sur
// cette page + distribution d'autorité vers les articles liés).

export interface LexiconTerm {
  term: string;
  aliases?: string[]; // pour la recherche (D+, dplus, denivele)
  category: string;  // catégorie thématique pour le regroupement
  definition: string;
  seeAlso?: string[]; // slugs d'articles ou chemins de catégories
}

export const LEXICON: LexiconTerm[] = [
  // ─ A ─
  {
    term: "Allure",
    category: "Entraînement",
    definition:
      "Vitesse de course exprimée en minutes par kilomètre (ex. 5:30/km). En trail, l'allure varie énormément selon la pente ; on raisonne souvent en temps vertical plutôt qu'en allure plane.",
    seeAlso: ["/categories/entrainement"],
  },
  {
    term: "Anaérobie",
    category: "Physiologie",
    definition:
      "Effort soutenu au-delà du seuil lactique, où les muscles produisent de l'énergie sans apport d'oxygène suffisant. Non tenable longtemps. Sollicité en trail court, ascensions courtes et raides, relances.",
    seeAlso: ["/categories/entrainement"],
  },
  // ─ B ─
  {
    term: "Bâtons",
    aliases: ["trekking poles"],
    category: "Matériel",
    definition:
      "Cannes en carbone ou aluminium utilisées en montée raide et longue descente pour répartir la charge sur les bras. Obligatoires sur certains ultra (UTMB, Tor des Géants). Techniques d'usage variées : alterné en montée longue, double appui en raide.",
    seeAlso: ["/articles/la-descente-fait-plus-de-degats-que-la-montee-voici-comment-proteger-vos-articulations"],
  },
  {
    term: "Bloc (d'entraînement)",
    category: "Entraînement",
    definition:
      "Période structurée de 3 à 8 semaines ciblant un type de développement (base aérobie, seuil, volume, affûtage). La périodisation enchaîne plusieurs blocs avec des objectifs progressifs.",
    seeAlso: ["/entrainement/generateur"],
  },
  // ─ C ─
  {
    term: "Cadence",
    category: "Technique",
    definition:
      "Nombre de foulées par minute. Cible moyenne en trail : 170-190. Une cadence haute avec foulée courte économise les articulations, surtout en descente.",
    seeAlso: ["/articles/la-descente-fait-plus-de-degats-que-la-montee-voici-comment-proteger-vos-articulations"],
  },
  {
    term: "Chemin",
    category: "Terrain",
    definition:
      "Piste terreuse ou empierrée, souvent large, en milieu forestier ou de montagne. Praticable pour débuter le trail avant les sentiers techniques.",
  },
  // ─ D ─
  {
    term: "D+",
    aliases: ["dplus", "dénivelé positif", "denivele positif"],
    category: "Dénivelé",
    definition:
      "Somme des ascensions cumulées sur un parcours, exprimée en mètres. Un trail de 42 km avec 2000 m D+ signifie que tu grimpes 2000 mètres au total, répartis sur l'ensemble. Le D+ est l'indicateur de difficulté principal en trail, avant la distance.",
    seeAlso: ["/categories/entrainement", "/courses"],
  },
  {
    term: "D-",
    aliases: ["dmoins", "dénivelé négatif", "denivele negatif"],
    category: "Dénivelé",
    definition:
      "Somme des descentes cumulées. Souvent négligé, pourtant c'est le D- qui détruit les quadriceps et les articulations sur ultra. Un 100 km avec 5000 D+/5000 D- exige autant de préparation à la descente qu'à la montée.",
    seeAlso: ["/articles/la-descente-fait-plus-de-degats-que-la-montee-voici-comment-proteger-vos-articulations"],
  },
  {
    term: "Descente excentrique",
    category: "Physiologie",
    definition:
      "Mode de contraction musculaire où le muscle s'allonge sous tension (ex. freinage en descente). Génère 30-40 % de force en plus qu'en concentrique et provoque l'essentiel des micro-lésions en trail long.",
    seeAlso: ["/articles/la-descente-fait-plus-de-degats-que-la-montee-voici-comment-proteger-vos-articulations"],
  },
  // ─ E ─
  {
    term: "Endurance fondamentale",
    aliases: ["EF"],
    category: "Entraînement",
    definition:
      "Allure basse, entre 65 % et 75 % de la FCmax, où tu respires par le nez sans difficulté. Doit représenter 75 à 80 % du volume hebdomadaire d'un traileur. Socle de toutes les performances longues.",
    seeAlso: ["/categories/entrainement"],
  },
  {
    term: "Électrolytes",
    category: "Nutrition",
    definition:
      "Sels minéraux (sodium, potassium, magnésium, calcium) perdus par la transpiration. Indispensables sur effort long pour éviter crampes, hyponatrémie et fatigue nerveuse. Pris en tablettes, gels salés ou bouillons en course.",
    seeAlso: ["/categories/nutrition", "/articles/comment-nourrir-son-corps-sur-un-ultra-sans-craquer-au-km-40"],
  },
  // ─ F ─
  {
    term: "Fartlek",
    category: "Entraînement",
    definition:
      "Séance à allure variable non structurée : tu alternes accélérations et récupérations selon le terrain ou l'envie. Idéal en trail pour développer la polyvalence sans contrainte chronomètre.",
    seeAlso: ["/categories/entrainement"],
  },
  {
    term: "FCmax",
    aliases: ["fréquence cardiaque maximale"],
    category: "Physiologie",
    definition:
      "Nombre maximal de battements par minute que ton cœur peut atteindre en effort. Base de calcul des zones d'entraînement. Mieux vaut la mesurer sur test de terrain que via formule (220-âge très imprécise).",
  },
  {
    term: "FKT",
    aliases: ["fastest known time"],
    category: "Record",
    definition:
      "Record du parcours sur un itinéraire non officiel (grande traversée, massif, chemin de grande randonnée). Communauté très active sur fastestknowntime.com. Objectif alternatif aux courses classiques.",
  },
  {
    term: "Foulée",
    category: "Technique",
    definition:
      "Cycle complet d'un pas (un pied puis l'autre). En trail, la foulée doit être souple, courte et réactive — pas trop amortie au risque de freiner l'appui.",
    seeAlso: ["/articles/la-descente-fait-plus-de-degats-que-la-montee-voici-comment-proteger-vos-articulations"],
  },
  // ─ G ─
  {
    term: "Gel énergétique",
    category: "Nutrition",
    definition:
      "Petite poche concentrée de glucides (20-30 g) prise en course. Rapide à ingérer mais saturation du goût sucré après 3-4 gels consécutifs. À alterner avec solide et liquide sur ultra.",
    seeAlso: ["/articles/comment-nourrir-son-corps-sur-un-ultra-sans-craquer-au-km-40"],
  },
  {
    term: "Glycogène",
    category: "Physiologie",
    definition:
      "Réserve de glucides dans les muscles et le foie. 1500 à 2000 kcal disponibles chez un coureur entraîné. S'épuise en 2-3 heures d'effort intense → nécessité de se ravitailler.",
    seeAlso: ["/articles/comment-nourrir-son-corps-sur-un-ultra-sans-craquer-au-km-40"],
  },
  {
    term: "GPX",
    category: "Matériel",
    definition:
      "Format de fichier qui encode une trace GPS (latitude, longitude, altitude, waypoints). La plupart des montres trail et plateformes (Strava, Komoot, UTMB) l'acceptent. Indispensable pour préparer une course ou reconnaître un parcours.",
  },
  // ─ H ─
  {
    term: "Hypoglycémie",
    category: "Nutrition",
    definition:
      "Chute du taux de glucose sanguin en dessous du seuil normal. Symptômes : faiblesse, vertiges, vision floue, malaise. Cause classique du mur au km 40 en ultra mal nourri.",
    seeAlso: ["/articles/comment-nourrir-son-corps-sur-un-ultra-sans-craquer-au-km-40"],
  },
  {
    term: "Hyponatrémie",
    category: "Nutrition",
    definition:
      "Dilution anormale du sodium sanguin causée par un excès d'eau sans apport en sels. Potentiellement mortelle sur ultra. Prévention : apport d'électrolytes en continu, pas seulement de l'eau.",
    seeAlso: ["/articles/comment-nourrir-son-corps-sur-un-ultra-sans-craquer-au-km-40"],
  },
  // ─ I ─
  {
    term: "ITRA",
    aliases: ["International Trail Running Association"],
    category: "Fédération",
    definition:
      "Fédération internationale qui attribue à chaque course un indice ITRA (cotation de difficulté) et à chaque coureur un score de performance. Points ITRA nécessaires pour s'inscrire aux grandes courses (UTMB, Tor, etc.).",
  },
  // ─ L ─
  {
    term: "Lactate",
    category: "Physiologie",
    definition:
      "Sous-produit du métabolisme anaérobie. Contrairement à la croyance, le lactate n'est pas la cause des douleurs musculaires : il est au contraire un carburant recyclé par le foie et les muscles lents.",
  },
  {
    term: "Lampe frontale",
    category: "Matériel",
    definition:
      "Obligatoire sur toute course de nuit. Critères : 200 lumens minimum pour le sentier technique, autonomie adaptée à la durée du nocturne (+2h de marge), confort sur le front.",
  },
  // ─ M ─
  {
    term: "Marathon des sables",
    aliases: ["MDS"],
    category: "Courses",
    definition:
      "Ultra en auto-suffisance de 250 km environ, sur 6 étapes, dans le désert marocain. Référence mondiale des courses par étapes depuis 1986.",
    seeAlso: ["/courses"],
  },
  {
    term: "Matériel obligatoire",
    category: "Matériel",
    definition:
      "Liste d'équipement à emporter pendant toute la course (veste imperméable, couverture de survie, sifflet, 1L d'eau, gobelet, etc.). Contrôlé au départ ou sur piste par les commissaires. Infraction = pénalité ou disqualification.",
  },
  // ─ N ─
  {
    term: "Negative split",
    category: "Stratégie",
    definition:
      "Courir la seconde moitié d'une course plus vite que la première. Stratégie prudente en trail, contre-intuitive mais souvent gagnante sur ultra : protège les jambes, exploite les coureurs partis trop vite.",
  },
  // ─ P ─
  {
    term: "Pacers",
    category: "Courses",
    definition:
      "Accompagnateurs autorisés à courir avec un engagé sur la partie finale de certaines courses (Western States, Hardrock). Rôle : soutien moral et logistique. Interdits sur UTMB World Series.",
    seeAlso: ["/articles/julien-chorier-ouvrir-les-pacers-a-tous-denaturerait-l-utmb"],
  },
  {
    term: "Périodisation",
    category: "Entraînement",
    definition:
      "Organisation de l'entraînement en phases successives (base, spécifique, affûtage) pour amener le pic de forme à la date précise d'une course objectif. Sans périodisation, pas de performance durable.",
    seeAlso: ["/entrainement/generateur"],
  },
  {
    term: "Pronation",
    category: "Biomécanique",
    definition:
      "Mouvement naturel d'affaissement du pied vers l'intérieur à chaque appui. Une pronation excessive (pied plat) ou insuffisante (pied creux) influe sur le choix de chaussures.",
  },
  // ─ R ─
  {
    term: "Reverse running",
    aliases: ["rétro-course"],
    category: "Technique",
    definition:
      "Course à reculons utilisée pour soulager les quadriceps en descente prolongée ou renforcer les muscles antagonistes en séance spécifique. Technique pratiquée par des élites.",
  },
  // ─ S ─
  {
    term: "Seuil lactique",
    aliases: ["seuil anaérobie"],
    category: "Physiologie",
    definition:
      "Intensité au-delà de laquelle la production de lactate dépasse la capacité d'élimination. Correspond à ~90 % FCmax. Zone centrale des séances de tempo / seuil, 1-2× par semaine max.",
  },
  {
    term: "Sortie longue",
    aliases: ["SL"],
    category: "Entraînement",
    definition:
      "Séance hebdomadaire la plus longue de la semaine, 2 à 5h selon le niveau et l'objectif. Développe l'endurance fondamentale, l'économie de course et la résistance mentale. Pierre angulaire de la prépa trail.",
    seeAlso: ["/entrainement/generateur"],
  },
  // ─ T ─
  {
    term: "Tapering",
    aliases: ["affûtage"],
    category: "Entraînement",
    definition:
      "Phase de réduction progressive du volume d'entraînement dans les 2 à 3 semaines précédant une course objectif. Permet au corps de récupérer des dernières grosses charges et d'arriver frais sur la ligne.",
  },
  {
    term: "Technique (terrain)",
    category: "Terrain",
    definition:
      "Se dit d'un sentier avec obstacles (pierriers, racines, dévers, passages exposés) qui demandent attention constante. À opposer au terrain roulant.",
  },
  {
    term: "Tempo run",
    category: "Entraînement",
    definition:
      "Séance à allure seuil, 20 à 40 minutes en continu. Développe la tolérance au lactate et la capacité à tenir une vitesse élevée sans basculer dans le rouge.",
  },
  {
    term: "Tor des Géants",
    category: "Courses",
    definition:
      "Ultra italien de 330 km et 24 000 m D+ dans le Val d'Aoste, temps limite 150 heures. Une des références mondiales du long, sans sommeil obligatoire.",
  },
  {
    term: "Trace GPS",
    category: "Matériel",
    definition:
      "Enregistrement numérique d'un parcours à suivre via montre ou téléphone. Format standard : GPX. Indispensable sur courses mal balisées ou entraînement en autonomie.",
  },
  // ─ U ─
  {
    term: "Ultra-trail",
    category: "Courses",
    definition:
      "Course nature de plus de 42 km (la distance marathon). Au-delà de 80 km, on parle de long ou d'ultra long. Exigence combinée d'endurance, dénivelé, autonomie et gestion mentale.",
    seeAlso: ["/courses", "/categories/courses-recits"],
  },
  {
    term: "UTMB",
    aliases: ["Ultra-Trail du Mont-Blanc"],
    category: "Courses",
    definition:
      "Ultra créé en 2003 autour du massif du Mont-Blanc. 171 km, 10 000 m D+, temps limite 46h30. Épreuve reine du circuit UTMB World Series, qualification via running stones.",
    seeAlso: ["/articles/a-71-ans-michel-poletti-traverse-la-france-a-pied-entre-ses-courses-utmb"],
  },
  {
    term: "UTMB World Series",
    category: "Courses",
    definition:
      "Circuit mondial regroupant plusieurs dizaines d'événements affiliés UTMB sur tous les continents. Participation rapporte des running stones, points de qualification pour l'UTMB Finals à Chamonix.",
  },
  // ─ V ─
  {
    term: "V3",
    aliases: ["vitesse 3 km/h"],
    category: "Dénivelé",
    definition:
      "Vitesse ascensionnelle de référence (m/h) : 1000 m de dénivelé positif par heure correspond à une VK (Vertical Kilometer) en environ 45-50 min pour les élites. Benchmark pour évaluer un profil grimpeur.",
  },
  {
    term: "VK",
    aliases: ["Vertical Kilometer"],
    category: "Courses",
    definition:
      "Course de montagne sur environ 5 km pour 1000 m de dénivelé positif. Format intense, durée 35 à 60 minutes selon niveau. Entrée du circuit Skyrunning.",
  },
  {
    term: "VMA",
    aliases: ["Vitesse Maximale Aérobie"],
    category: "Physiologie",
    definition:
      "Vitesse à laquelle tu atteins ta VO2max. Se mesure sur test demi-Cooper ou VAMEVAL. Sert de référence pour calibrer les séances : endurance à 70-75 % VMA, seuil à 85-90 %, VMA pure à 100 %+.",
    seeAlso: ["/entrainement/generateur"],
  },
  {
    term: "VO2max",
    category: "Physiologie",
    definition:
      "Volume maximal d'oxygène qu'un individu peut consommer par minute et par kilo de poids (ml/min/kg). Indicateur n°1 du potentiel aérobie. 60+ pour un traileur performant, 80+ pour l'élite mondiale.",
  },
  // ─ W ─
  {
    term: "Western States",
    aliases: ["WSER", "WS100"],
    category: "Courses",
    definition:
      "Western States Endurance Run, 100 miles en Californie depuis 1977. Plus ancien ultra-trail au monde, qualification par loterie, référence historique.",
    seeAlso: ["/articles/a-survival-guide-to-ultrarunning-race-lottery-rejection"],
  },
];
