import type { PillarDossier } from "./types";

export const westernStates100: PillarDossier = {
  slug: "western-states-100",
  name: "Western States 100",
  tagline: "L'ultra le plus prestigieux du monde, fondateur de la discipline. 100 miles à travers la Sierra Nevada californienne.",
  heroImage: "/logo-square.png",
  intro: `Créée en 1974 par Gordy Ainsleigh, le Western States 100 Endurance Run est la mère de tous les ultras modernes. 161 kilomètres entre Olympic Valley (Squaw Valley) et Auburn, en Californie, à boucler en moins de 30 heures pour décrocher la légendaire boucle d'argent (sub-24h).

L'épreuve se court chaque dernier samedi de juin et concentre l'élite mondiale du trail. Son cachet : un parcours intransigeant avec 5 500 m+ et 7 000 m de descente, un passage de la Sierra Nevada à 2 700 m d'altitude, des températures qui dépassent souvent 38 °C dans les canyons, et un final iconique sur le track de Placer High School à Auburn. Le sélectif est tel que la lottery annuelle, sur 14 000 candidatures, ne retient que 369 dossards.

Toute la couverture éditoriale d'Altitude Trail sur le WSER est rassemblée ici : préviews du plateau élite américain et international, analyses tactiques (gestion des canyons, stratégie hydratation, ravitaillement Foresthill), résultats live, et décryptages institutionnels.`,
  specs: [
    { label: "Distance", value: "161 km (100 miles)" },
    { label: "Dénivelé positif", value: "5 500 m+" },
    { label: "Dénivelé négatif", value: "7 000 m-" },
    { label: "Temps maximum", value: "30 h" },
    { label: "Altitude maximale", value: "2 667 m (Emigrant Pass)" },
    { label: "Création", value: "1974" },
  ],
  programme: [
    { label: "Mercredi 24 juin 2026", value: "Inspection matériel obligatoire, briefing élite à Olympic Valley" },
    { label: "Jeudi 25 juin", value: "Salt Conference (élite men/women), cérémonies vétérans" },
    { label: "Vendredi 26 juin", value: "Briefing général, drop bags déposés" },
    { label: "Samedi 27 juin", value: "Départ 5 h heure du Pacifique (14 h heure de Paris). Premières arrivées hommes vers 18 h heure locale (3 h Paris dimanche)" },
    { label: "Dimanche 28 juin", value: "Golden hour à 11 h heure du Pacifique. Cérémonie des boucles d'argent" },
  ],
  palmares: [
    { year: 2025, men: "Caleb Olson (USA)", women: "Katharina Hartmuth (SUI)", menTime: "14 h 17 min", womenTime: "16 h 30 min" },
    { year: 2024, men: "Jim Walmsley (USA)", women: "Katie Schide (USA)", menTime: "14 h 13 min", womenTime: "15 h 47 min" },
    { year: 2023, men: "Tom Evans (GBR)", women: "Courtney Dauwalter (USA)", menTime: "14 h 40 min", womenTime: "15 h 29 min" },
    { year: 2022, men: "Adam Peterman (USA)", women: "Ruth Croft (NZL)", menTime: "15 h 13 min", womenTime: "17 h 21 min" },
    { year: 2021, men: "Jim Walmsley (USA)", women: "Beth Pascall (GBR)", menTime: "14 h 46 min", womenTime: "17 h 10 min" },
  ],
  glossary: [
    { term: "Golden Ticket", definition: "Système d'entrée automatique au Western States via une victoire ou un podium sur certaines courses qualificatives mondiales (Canyons 100K, Bandera 100K, etc.). Chaque course distribue 2 à 3 tickets." },
    { term: "Buckle (boucle d'argent)", definition: "Plaque de ceinture remise aux finishers : argent pour sub-24h, bronze pour sub-30h. Symbole le plus convoité de la culture ultra US." },
    { term: "Lottery", definition: "Tirage au sort annuel début décembre. Pour être éligible, il faut avoir fini une course qualificative (généralement 100K avec temps minimum) dans l'année. Taux d'acceptation : ~3 %." },
    { term: "Canyon", definition: "Les trois grands canyons (Devil's Thumb, El Dorado, Volcano) entre les km 80 et 105. Sections clés de la course où la chaleur (souvent 40 °C+) brise les ambitions." },
    { term: "Pacer", definition: "Coureur autorisé à accompagner un participant à partir du km 100 (Foresthill) pour la nuit. Soutien moral et navigation, sans porter de matériel." },
    { term: "Crew", definition: "Équipe de soutien qui suit le coureur sur les ravitaillements accessibles aux véhicules. Logistique critique : nourriture personnalisée, vêtements de rechange, refroidissement." },
  ],
  faq: [
    { question: "Comment se qualifier pour le Western States ?", answer: "Deux voies : la lottery (tirage au sort) après avoir bouclé une course qualifiante ITRA pendant l'année, ou un Golden Ticket (podium sur une des 12 courses qualificatives mondiales)." },
    { question: "Combien coûte l'inscription ?", answer: "525 USD pour 2026, plus 250 USD de frais de qualification et licence. Coût total avec voyage depuis l'Europe : 4 000 à 5 000 €." },
    { question: "Quel est le record ?", answer: "Jim Walmsley : 14 h 09 min (2022). Courtney Dauwalter : 15 h 29 min (2023)." },
    { question: "Pourquoi 'States' au pluriel ?", answer: "Héritage du Western States Trail original, une route équestre traversant le Nevada et la Californie. Le toponyme est resté." },
    { question: "Y a-t-il une diffusion en français ?", answer: "Le live officiel est anglophone (irunfar, WSER YouTube). Altitude Trail propose une couverture francophone en parallèle avec décryptages des positions clés (Robinson Flat, Devil's Thumb, Foresthill, Highway 49)." },
  ],
  howToWatch: [
    { label: "Diffusion officielle WSER", url: "https://www.wser.org/", description: "Live YouTube en anglais, démarrage samedi 5 h heure du Pacifique (14 h heure de Paris)" },
    { label: "iRunFar live coverage", url: "https://www.irunfar.com/", description: "Couverture iRunFar en temps réel avec mises à jour aux principaux points de passage" },
    { label: "Live blog Altitude Trail", description: "Coverage francophone Altitude Trail avec décryptages tactiques aux canyons + Foresthill + Highway 49" },
  ],
  officialUrl: "https://www.wser.org/",
  nextEditionDate: "2026-06-27",
};
