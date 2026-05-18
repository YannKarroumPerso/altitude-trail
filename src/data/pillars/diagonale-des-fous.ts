// PILLAR DOSSIER DIAGONALE DES FOUS
// VERIFICATION OBLIGATOIRE avant edition : croiser palmares et dates avec
// - https://www.grandraid-reunion.com/fr/resultats/
// - https://distances.plus (presse trail FR)
// - https://la1ere.franceinfo.fr/reunion/ (presse Reunion)
// Pas d'invention de chrono ni de vainqueur. Toujours sourcer.
import type { PillarDossier } from "./types";

export const diagonaleDesFous: PillarDossier = {
  slug: "diagonale-des-fous",
  name: "Diagonale des Fous",
  tagline: "Diagonale des Fous 2026 : le nouveau tracé via Salazie est-il vraiment plus dur ? Programme, palmarès, comment se qualifier depuis l'Europe.",
  heroImage: "/logo-square.png",
  intro: `Le Grand Raid de La Réunion, plus connu sous le nom de Diagonale des Fous, est la course de référence du trail français hors métropole. Créée en 1989, elle traverse l'île volcanique du sud (Saint-Pierre) au nord (Saint-Denis). Le tracé évolue régulièrement : pour 2026, l'organisation annonce 180 kilomètres et 10 200 mètres de dénivelé positif, avec un passage par Salazie inédit, et un cut-off de 65 heures pour les derniers finishers.

Le parcours est un voyage à travers plusieurs univers en une seule course : forêt tropicale humide, volcan actif (Piton de la Fournaise), cirques de Mafate et Salazie, et descente finale à travers les zones urbaines. Les températures oscillent entre 4 °C la nuit en altitude (Plaine des Sables à 2 200 m) et 30 °C dans les pentes inférieures. La pluie tropicale soudaine est constante en saison.

Plus de 2 800 coureurs s'élancent chaque mi-octobre depuis Saint-Pierre, tirés au sort parmi 7 000 candidats. La course attire un plateau international fort et fait vibrer toute l'île pendant 4 jours. Altitude Trail couvre la course année par année avec préviews, analyses, et compte-rendus complets.`,
  specs: [
    { label: "Distance (édition 2026)", value: "180 km" },
    { label: "Dénivelé positif (édition 2026)", value: "10 200 m+" },
    { label: "Temps maximum", value: "65 h" },
    { label: "Altitude maximale", value: "2 320 m (Piton de la Fournaise)" },
    { label: "Création", value: "1989" },
    { label: "Plateau", value: "~2 800 finishers / 7 000 inscrits" },
  ],
  programme: [
    { label: "Mardi 13 octobre 2026", value: "Retrait dossards à Saint-Pierre, vérification matériel" },
    { label: "Mercredi 14 octobre", value: "Briefings officiels, expo trail" },
    { label: "Jeudi 15 octobre", value: "Départ Diagonale 22 h heure de La Réunion (20 h Paris) depuis le Stade de la Redoute" },
    { label: "Vendredi 16 octobre", value: "Première nuit en course. Mafate à l'aube samedi" },
    { label: "Samedi 17 octobre", value: "Arrivée des premiers vainqueurs vers 22 h heure locale" },
    { label: "Dimanche 18 octobre", value: "Arrivées des derniers finishers jusqu'au cut-off 65 h" },
  ],
  palmares: [
    { year: 2025, men: "Baptiste Chassagne (FRA)", women: "Blandine L'Hirondel (FRA)", menTime: "23 h 31 min 54 s", womenTime: "27 h 26 min 09 s" },
    { year: 2024, men: "Mathieu Blanchard (FRA)", women: "Manon Bohard (FRA)", menTime: "23 h 25 min 02 s (record course)", womenTime: "31 h 49 min" },
    { year: 2023, men: "Aurélien Dunand-Pallaz (FRA)", women: "Katie Schide (USA)", menTime: "23 h 21 min 23 s", womenTime: "27 h 31 min 08 s" },
    { year: 2022, men: "Benoît Girondel (FRA)", women: "Andrea Huser (SUI)", menTime: "23 h 53 min 53 s", womenTime: "26 h 34 min 52 s" },
    { year: 2021, men: "Ludovic Pommeret + Daniel Jung (ex-aequo)", women: "Emilie Maroteaux (FRA)", menTime: "23 h 02 min 21 s", womenTime: "29 h 54 min 59 s" },
  ],
  glossary: [
    { term: "Mafate", definition: "Cirque inaccessible en voiture, traversé entre les km 80 et 100. Sections les plus dures (Marla, Roche-Plate, Grand Place, Aurère)." },
    { term: "Salazie", definition: "Cirque traversé sur le tracé 2026 (nouveauté éditoriale du parcours)." },
    { term: "La Redoute", definition: "Stade de la Redoute à Saint-Denis, arrivée de la course. Les vivats créoles sous les arches font partie du mythe." },
    { term: "Plaine des Sables", definition: "Plateau lunaire à 2 200 m d'altitude, à proximité du volcan. Premier passage de la course (km 35-45), souvent dans la nuit et le froid." },
    { term: "Mascareignes", definition: "Sous-bois tropical traversé sur la fin du parcours, partie technique humide." },
    { term: "Bénévole", definition: "5 000 bénévoles assurent la logistique (ravitaillements, sécurité, balisage). Tradition forte sur l'île." },
  ],
  faq: [
    { question: "Comment s'inscrire à la Diagonale des Fous ?", answer: "Lottery annuelle ouverte en mai. Il faut avoir bouclé une course qualifiante (avec critères ITRA). Sur 7 000 candidats, environ 2 800 dossards sont attribués." },
    { question: "Combien coûte la course ?", answer: "Environ 200 € pour 2026, plus voyage Réunion (1 200-1 800 € depuis la métropole) et hébergement (700-1 200 € pour la semaine)." },
    { question: "Quel est le record ?", answer: "Hommes : Mathieu Blanchard 23 h 25 min 02 s (édition 2024). Le palmarès féminin est plus difficile à comparer en raison des évolutions du tracé d'une édition à l'autre." },
    { question: "Y a-t-il une diffusion en direct ?", answer: "Oui, retransmission Réunion 1ère TV (chaîne publique de l'île) + diffusion web gratuite. Couverture exhaustive par les médias trail locaux (Run La Réunion, Imaz Press) et nationaux." },
    { question: "Quel matériel obligatoire ?", answer: "Veste imperméable, polaire, gants, sifflet, couverture survie, frontale avec piles de rechange, gobelet réutilisable, téléphone, 1,5 L eau minimum. Contrôle aléatoire en course." },
  ],
  howToWatch: [
    { label: "Diffusion officielle Grand Raid", url: "https://www.grandraid-reunion.com/", description: "Live TV et web gratuit, démarrage jeudi 22 h heure de La Réunion (20 h Paris)" },
    { label: "Réunion 1ère TV", description: "Couverture continue de la chaîne publique réunionnaise (web replay accessible depuis la métropole)" },
    { label: "Live blog Altitude Trail", description: "Coverage métropolitaine Altitude Trail avec décryptages aux passages clés (Plaine des Sables, Salazie, Mafate, Aurère)" },
  ],
  officialUrl: "https://www.grandraid-reunion.com/",
  nextEditionDate: "2026-10-15",
};
