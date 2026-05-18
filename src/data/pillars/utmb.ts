// PILLAR DOSSIER UTMB MONT-BLANC
// VERIFICATION OBLIGATOIRE avant edition : croiser palmares et dates avec
// - https://montblanc.utmb.world/results
// - https://www.irunfar.com/?s=utmb+results
// - https://utmb.world/news/new-season-2026
// Pas d'invention de chrono ni de vainqueur. Toujours sourcer.
import type { PillarDossier } from "./types";

export const utmb: PillarDossier = {
  slug: "utmb",
  name: "UTMB Mont-Blanc",
  tagline: "Le rendez-vous mondial du trail. Une course, une légende, sept jours d'épreuves à Chamonix.",
  heroImage: "/logo-square.png",
  intro: `L'Ultra-Trail du Mont-Blanc, organisé chaque dernière semaine d'août à Chamonix, est devenu en vingt-deux éditions la course de référence du trail mondial. 171 kilomètres et 10 000 mètres de dénivelé positif autour du massif du Mont-Blanc, traversant la France, l'Italie et la Suisse, à boucler en moins de 46 heures 30.

Au-delà de l'épreuve reine, la semaine UTMB rassemble sept courses (PTL, TDS, CCC, OCC, ETC, MCC, YCC) et concentre la quasi-totalité de l'élite mondiale : plus de 10 000 dossards, 100 000 visiteurs à Chamonix, et une retransmission live suivie dans plus de 80 pays. Pour les coureurs amateurs, c'est aussi le Graal logistique : se qualifier exige un UTMB Index validé dans la bonne catégorie de distance et des Running Stones obtenus sur les UTMB World Series, un système qui a remplacé l'ancien quota de points ITRA en 2022-2023.

Cette page agrège toute la couverture éditoriale d'Altitude Trail sur l'UTMB : préviews élite, recaps, analyses tactiques, débats institutionnels (subventions, écologie, professionnalisation), et guides pratiques.`,
  specs: [
    { label: "Distance", value: "171 km" },
    { label: "Dénivelé positif", value: "10 000 m+" },
    { label: "Temps maximum", value: "46 h 30" },
    { label: "Altitude maximale", value: "2 537 m (Grand Col Ferret)" },
    { label: "Pays traversés", value: "France · Italie · Suisse" },
    { label: "Création", value: "2003" },
  ],
  programme: [
    { label: "Semaine UTMB 2026", value: "Du lundi 24 au dimanche 30 août 2026" },
    { label: "UTMB Mont-Blanc (100 M)", value: "Départ vendredi 28 août 2026 à 17 h 45 à Chamonix" },
    { label: "PTL", value: "Petite Trotte à Léon, 300 km en équipe (départ en début de semaine)" },
    { label: "TDS", value: "Sur les Traces des Ducs de Savoie, 145 km" },
    { label: "CCC", value: "Courmayeur-Champex-Chamonix, 101 km" },
    { label: "OCC / ETC / MCC / YCC", value: "Formats courts 15 à 56 km" },
  ],
  palmares: [
    { year: 2025, men: "Tom Evans (GBR)", women: "Ruth Croft (NZL)", menTime: "19 h 18 min 58 s", womenTime: "22 h 56 min 23 s" },
    { year: 2024, men: "Vincent Bouillard (FRA)", women: "Katie Schide (USA)", menTime: "19 h 54 min 23 s", womenTime: "22 h 09 min 31 s (record)" },
    { year: 2023, men: "Jim Walmsley (USA)", women: "Courtney Dauwalter (USA)", menTime: "19 h 37 min 43 s", womenTime: "23 h 29 min 14 s" },
    { year: 2022, men: "Kilian Jornet (ESP)", women: "Katie Schide (USA)", menTime: "19 h 49 min 30 s", womenTime: "23 h 15 min" },
    { year: 2021, men: "François D'Haene (FRA)", women: "Courtney Dauwalter (USA)", menTime: "20 h 45 min 59 s", womenTime: "22 h 30 min 54 s" },
  ],
  glossary: [
    { term: "UTMB Index", definition: "Score officiel UTMB World Series (de 0 à 1 000) calculé par catégorie de distance (20K, 50K, 100K, 100M). Remplace l'ancien ITRA Index dans le processus de qualification UTMB depuis 2022-2023. Requis pour postuler à la lottery." },
    { term: "Running Stones (Pierres d'Aigle)", definition: "Points attribués lors d'un finish sur un UTMB World Series Event. Barème : 1 stone pour une 20K, 2 pour une 50K, 3 pour une 100K, 4 pour une 100M. Doublé sur un World Series Major. Validité 2 ans." },
    { term: "TDS", definition: "Sur les Traces des Ducs de Savoie — 145 km, ~9 100 m+, l'épreuve la plus technique du programme UTMB, démarrant à Courmayeur." },
    { term: "CCC", definition: "Courmayeur-Champex-Chamonix — 101 km, ~6 100 m+, la « petite UTMB » qui ouvre l'accès au format reine." },
    { term: "OCC", definition: "Orsières-Champex-Chamonix — 56 km, ~3 500 m+, format intermédiaire très couru par les coureurs internationaux." },
    { term: "Drop bag", definition: "Sac de matériel personnel récupérable par le coureur aux bases vie autorisées sur le tracé (Courmayeur notamment). Permet changement de chaussures, vêtements, ravitaillement personnel." },
  ],
  faq: [
    { question: "Comment se qualifier pour l'UTMB Mont-Blanc ?", answer: "Il faut accumuler au moins une Running Stone obtenue dans les 24 derniers mois sur un UTMB World Series Event, et disposer d'un UTMB Index validé dans la catégorie de distance correspondante. Puis postuler à la lottery annuelle qui ouvre fin décembre. Le taux d'acceptation tourne autour de 30 % pour l'épreuve reine." },
    { question: "Combien coûte l'inscription ?", answer: "Environ 410 € pour l'UTMB en 2026, hors frais de licence et certificat médical. CCC : ~270 €. TDS : ~320 €. OCC : ~180 €. Tarifs indicatifs à confirmer sur montblanc.utmb.world." },
    { question: "Quel est le record de l'épreuve ?", answer: "Aucun chrono masculin n'a battu les 19 h 18 min 58 s de Tom Evans en 2025 — record actuel. Côté féminin, Katie Schide a posé le record en 22 h 09 min 31 s lors de l'édition 2024." },
    { question: "L'UTMB est-il diffusé en direct ?", answer: "Oui, gratuitement sur la chaîne YouTube de l'UTMB World Series, dès le départ vendredi 17 h 45 jusqu'à la dernière arrivée dimanche. Couverture par caméras embarquées, drones et points de passage chronométrés." },
    { question: "Quel matériel obligatoire ?", answer: "Une liste précise est imposée par l'organisation : veste imperméable à coutures étanches, pantalon long, gants chauds, bonnet, couverture de survie, sifflet, gobelet réutilisable, téléphone, frontale avec piles de rechange, 1 L d'eau minimum. Vérification aléatoire en course." },
  ],
  howToWatch: [
    { label: "Diffusion officielle UTMB", url: "https://utmbmontblanc.com/", description: "Live YouTube gratuit, démarrage vendredi soir 17 h 45 heure de Chamonix" },
    { label: "Suivi GPS live tracker", description: "Tracker officiel mis à jour toutes les 5 min, accessible depuis montblanc.utmb.world" },
    { label: "Live blog Altitude Trail", description: "Couverture francophone par Altitude Trail dès le départ : positions clés (Les Contamines, Courmayeur, Champex), analyses tactiques, interviews" },
  ],
  officialUrl: "https://montblanc.utmb.world/",
  nextEditionDate: "2026-08-28",
};
