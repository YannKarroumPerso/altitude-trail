// PILLAR DOSSIER HARDROCK 100
// VERIFICATION OBLIGATOIRE avant edition : croiser palmares et dates avec
// - https://hardrock100.com/hardrock-pastresults.php
// - https://www.irunfar.com/?s=hardrock+results
// Pas d'invention de chrono ni de vainqueur. Toujours sourcer.
import type { PillarDossier } from "./types";

export const hardrock100: PillarDossier = {
  slug: "hardrock-100",
  name: "Hardrock 100",
  tagline: "Hardrock 100 : l'ultra le plus brutal des USA peut-il survivre au réchauffement climatique des San Juan ? Programme 2026, palmarès, acclimatation altitude.",
  heroImage: "/logo-square.png",
  intro: `Le Hardrock Hundred Mile Endurance Run, créé en 1992 à Silverton (Colorado), est l'ultra de montagne le plus exigeant des États-Unis. 160 km en boucle dans les San Juan Mountains, 10 000 mètres de dénivelé positif, et une altitude moyenne de 3 360 m culminant à 4 282 m au Handies Peak. La course se court mi-juillet sous des conditions extrêmes : neige résiduelle aux passages les plus hauts, orages électriques quotidiens, hypothermie possible la nuit, mal aigu des montagnes garanti pour qui n'est pas acclimaté.

Le rituel mythique : embrasser le Hardrock, un bloc de quartz brut à Silverton, devant 200 spectateurs. La course alterne chaque année le sens (clockwise / counter-clockwise) — l'édition 2026 se courra en sens horaire (clockwise). Le cut-off est de 48 heures, et le taux de finishers tourne autour de 60 %, l'un des plus faibles de tout le circuit mondial.

Toute la couverture Altitude Trail du Hardrock est rassemblée ici : préviews du plateau (souvent restreint, 145 dossards), analyses des stratégies acclimatation altitude, récits des cols mythiques (Grant Swamp Pass, Virginius Pass), et débats sur la durabilité environnementale dans cet écosystème alpin fragile.`,
  specs: [
    { label: "Distance", value: "160 km" },
    { label: "Dénivelé positif", value: "10 000 m+" },
    { label: "Altitude moyenne", value: "3 360 m" },
    { label: "Altitude maximale", value: "4 282 m (Handies Peak)" },
    { label: "Temps maximum", value: "48 h" },
    { label: "Création", value: "1992" },
    { label: "Sens 2026", value: "Clockwise (horaire)" },
  ],
  programme: [
    { label: "Mercredi 8 juillet 2026", value: "Arrivée des coureurs à Silverton, vérification matériel" },
    { label: "Jeudi 9 juillet", value: "Course briefing officiel, parcours détaillé selon sens de l'année (clockwise en 2026)" },
    { label: "Vendredi 10 juillet", value: "Départ 6 h heure des Rocheuses (14 h heure de Paris)" },
    { label: "Samedi 11 juillet", value: "Premières arrivées vers 4 h heure locale (12 h Paris)" },
    { label: "Dimanche 12 juillet", value: "Cut-off final à 6 h heure locale" },
  ],
  palmares: [
    { year: 2025, men: "Ludovic Pommeret (FRA)", women: "Katie Schide (USA)", menTime: "22 h 21 min 53 s", womenTime: "25 h 50 min 23 s (record overall)" },
    { year: 2024, men: "Ludovic Pommeret (FRA)", women: "Courtney Dauwalter (USA)", menTime: "21 h 33 min 06 s (record CW)", womenTime: "26 h 11 min 49 s" },
    { year: 2023, men: "Aurélien Dunand-Pallaz (FRA)", women: "Courtney Dauwalter (USA)", menTime: "n.c.", womenTime: "26 h 14 min 12 s (record CCW femmes)" },
    { year: 2022, men: "Kilian Jornet (ESP)", women: "Courtney Dauwalter (USA)", menTime: "21 h 36 min 24 s (record CW)", womenTime: "26 h 44 min 38 s" },
    { year: 2021, men: "François D'Haene (FRA)", women: "Sabrina Stanley (USA)", menTime: "21 h 45 min 50 s", womenTime: "27 h 21 min 49 s" },
  ],
  glossary: [
    { term: "Kiss the rock", definition: "Rituel d'arrivée : le finisher embrasse le rocher de quartz à Silverton. Officialisation symbolique du finish." },
    { term: "Counter-clockwise / Clockwise", definition: "Le parcours alterne chaque année dans le sens horaire ou anti-horaire. Les sections techniques (Grant Swamp Pass, Virginius) changent donc d'orientation montée/descente. 2026 = clockwise." },
    { term: "Krogers Canteen", definition: "Ravitaillement le plus célèbre, situé à Virginius Pass (4 015 m), tenu par des bénévoles depuis 1993. Sert pancakes, soupe, café — à 4 000 m d'altitude." },
    { term: "Hardrocker", definition: "Coureur qui a fini au moins une fois la course. Communauté très soudée, retours fréquents (Karl Meltzer a 17 finishes, record absolu)." },
    { term: "Pacer", definition: "Pacer autorisé à partir de Cunningham Aid Station (km 145 ou 152 selon sens). Crucial pour la dernière section et les passages techniques de nuit." },
    { term: "Acclimatation", definition: "Période obligatoire d'au moins 7-10 jours en altitude (idéalement >2 500 m) avant le départ pour éviter l'œdème pulmonaire de haute altitude." },
  ],
  faq: [
    { question: "Comment se qualifier pour Hardrock ?", answer: "Lottery très sélective (3-4 % d'acceptation), accessible après avoir terminé une des courses qualifiantes (Hardrock-qualifier). Système de tickets multiples pour les habitués." },
    { question: "Quel est le record ?", answer: "Hommes : Kilian Jornet en sens clockwise (21 h 36 min 24 s en 2022), battu depuis par Ludovic Pommeret (21 h 33 min 06 s en 2024). Femmes : Katie Schide (25 h 50 min 23 s en 2025), première femme sous 26 h." },
    { question: "Pourquoi Hardrock est-il considéré comme le plus dur ?", answer: "Combinaison d'altitude moyenne 3 360 m, dénivelé brut 10 000 m+, terrain technique (éboulis, neiges éternelles, traversées de rivières), météo imprévisible (orages, neige possible en juillet)." },
    { question: "Combien coûte la course ?", answer: "275 USD pour 2026. Total avec voyage et acclimatation depuis l'Europe : 5 000 à 6 000 €." },
    { question: "Y a-t-il une diffusion ?", answer: "Live officiel limité (peu de captation sur les sommets isolés). Suivi GPS via une trackleader app obligatoire pour chaque coureur. Couverture iRunFar et Altitude Trail." },
  ],
  howToWatch: [
    { label: "Diffusion officielle Hardrock", url: "https://hardrock100.com/", description: "Suivi GPS live via app dédiée (chaque coureur porte un tracker)" },
    { label: "iRunFar live coverage", url: "https://www.irunfar.com/", description: "Couverture iRunFar avec mises à jour aux ravitaillements accessibles" },
    { label: "Live blog Altitude Trail", description: "Coverage francophone Altitude Trail avec focus sur les coureurs français (Pommeret, Dunand-Pallaz, Buisson, D'Haene...)" },
  ],
  officialUrl: "https://hardrock100.com/",
  nextEditionDate: "2026-07-10",
};
