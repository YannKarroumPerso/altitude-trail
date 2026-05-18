import type { PillarDossier } from "./types";

export const utmb: PillarDossier = {
  slug: "utmb",
  name: "UTMB Mont-Blanc",
  tagline: "Le rendez-vous mondial du trail. Une course, une légende, sept jours d'épreuves à Chamonix.",
  heroImage: "/logo-square.png",
  intro: `L'Ultra-Trail du Mont-Blanc, organisé chaque dernière semaine d'août à Chamonix, est devenu en vingt-deux éditions la course de référence du trail mondial. 171 kilomètres et 10 000 mètres de dénivelé positif autour du massif du Mont-Blanc, traversant la France, l'Italie et la Suisse, à boucler en moins de 46 heures.

Au-delà de l'épreuve reine, la semaine UTMB rassemble sept courses (PTL, TDS, CCC, OCC, ETC, MCC, YCC) et concentre la quasi-totalité de l'élite mondiale : plus de 10 000 dossards, 100 000 visiteurs à Chamonix, et une retransmission télévisée suivie dans plus de 80 pays. Pour les coureurs amateurs, c'est aussi le Graal logistique : se qualifier exige des points "running stones" obtenus sur les UTMB World Series, un système de qualification controversé que nous décortiquons régulièrement.

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
    { label: "Lundi 24 août 2026", value: "PTL — Petite Trotte à Léon, 300 km en équipe" },
    { label: "Mercredi 26 août", value: "TDS — Sur les Traces des Ducs de Savoie, 145 km" },
    { label: "Jeudi 27 août", value: "OCC — Orsières-Champex-Chamonix, 56 km · ETC sprint 15 km" },
    { label: "Vendredi 28 août", value: "CCC — Courmayeur-Champex-Chamonix, 101 km · UTMB départ 18 h" },
    { label: "Samedi-dimanche 29-30 août", value: "UTMB en course — premières arrivées samedi soir, dernières dimanche après-midi" },
  ],
  palmares: [
    { year: 2025, men: "Jim Walmsley (USA)", women: "Courtney Dauwalter (USA)", menTime: "19 h 18 min", womenTime: "23 h 15 min" },
    { year: 2024, men: "Vincent Bouillard (FRA)", women: "Katharina Hartmuth (SUI)", menTime: "19 h 54 min", womenTime: "23 h 35 min" },
    { year: 2023, men: "Jim Walmsley (USA)", women: "Courtney Dauwalter (USA)", menTime: "19 h 37 min", womenTime: "23 h 29 min" },
    { year: 2022, men: "Kilian Jornet (ESP)", women: "Katie Schide (USA)", menTime: "19 h 49 min", womenTime: "23 h 15 min" },
    { year: 2021, men: "François D'Haene (FRA)", women: "Courtney Dauwalter (USA)", menTime: "20 h 45 min", womenTime: "22 h 30 min" },
  ],
  glossary: [
    { term: "ITRA Index", definition: "Système de notation international (de 0 à 1 000) qui hiérarchise les coureurs selon leurs résultats récents en course. Un ITRA Index supérieur à 800 chez les hommes ouvre l'accès à l'élite mondiale." },
    { term: "Running Stones", definition: "Points UTMB obtenus en finishant une course du circuit UTMB World Series, à accumuler pour pouvoir s'inscrire à la lottery de l'UTMB Mont-Blanc." },
    { term: "TDS", definition: "Sur les Traces des Ducs de Savoie — 145 km, 9 100 m+, l'épreuve la plus technique du programme UTMB, démarrant à Courmayeur." },
    { term: "CCC", definition: "Courmayeur-Champex-Chamonix — 101 km, 6 100 m+, la « petite UTMB » qui ouvre l'accès au format reine." },
    { term: "OCC", definition: "Orsières-Champex-Chamonix — 56 km, 3 500 m+, format intermédiaire très couru par les coureurs internationaux." },
    { term: "Drop bag", definition: "Sac que les coureurs déposent au départ et qu'ils retrouvent à Courmayeur (km 80) pour changer chaussures, vêtements, ravitaillement personnel." },
  ],
  faq: [
    { question: "Comment se qualifier pour l'UTMB Mont-Blanc ?", answer: "Il faut accumuler des Running Stones en finissant des courses du circuit UTMB World Series (les valeurs varient selon le format : 1 stone pour une 50K, jusqu'à 4 pour un 100M). Puis postuler à la lottery annuelle qui ouvre fin décembre. Le taux d'acceptation tourne autour de 30 % pour l'épreuve reine." },
    { question: "Combien coûte l'inscription ?", answer: "Environ 410 € pour l'UTMB en 2026, hors frais de licence ITRA (15 €) et certificat médical. CCC : 270 €. TDS : 320 €. OCC : 180 €." },
    { question: "Quel est le record de l'épreuve ?", answer: "Jim Walmsley détient le record masculin en 19 h 18 min (2025), Courtney Dauwalter le record féminin en 22 h 30 min (2021)." },
    { question: "L'UTMB est-il diffusé en direct ?", answer: "Oui, gratuitement sur la chaîne YouTube de l'UTMB World Series, dès le départ vendredi 18 h jusqu'à la dernière arrivée dimanche. Couverture par caméras embarquées, drones et points de passage chronométrés." },
    { question: "Quel matériel obligatoire ?", answer: "Une liste précise est imposée par l'organisation : veste imperméable à coutures étanches, pantalon long, gants chauds, bonnet, couverture de survie, sifflet, gobelet réutilisable, téléphone, frontale avec piles de rechange, 1 L d'eau minimum. Vérification aléatoire en course." },
  ],
  howToWatch: [
    { label: "Diffusion officielle UTMB", url: "https://utmbmontblanc.com/", description: "Live YouTube gratuit, démarrage vendredi soir 18 h heure de Chamonix" },
    { label: "Suivi GPS live tracker", description: "Tracker officiel mis à jour toutes les 5 min, accessible depuis utmbmontblanc.com" },
    { label: "Live blog Altitude Trail", description: "Couverture francophone par Altitude Trail dès le départ : positions clés (Les Contamines, Courmayeur, Champex), analyses tactiques, interviews" },
  ],
  officialUrl: "https://utmbmontblanc.com/",
  nextEditionDate: "2026-08-28",
};
