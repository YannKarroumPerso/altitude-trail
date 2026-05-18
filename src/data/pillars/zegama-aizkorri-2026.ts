import type { PillarDossier } from "./types";

export const zegamaAizkorri2026: PillarDossier = {
  slug: "zegama-aizkorri-2026",
  name: "Zegama-Aizkorri 2026",
  tagline: "Le marathon mythique du Pays basque. 42 km, 2 736 m+, le rendez-vous incontournable du skyrunning mondial.",
  heroImage: "/logo-square.png",
  intro: `Le Zegama-Aizkorri Mendi Maratoia, créé en 2002 dans la sierra d'Aizkorri en Pays basque espagnol, est la course de skyrunning la plus suivie au monde. 42 kilomètres et 2 736 mètres de dénivelé positif, traversant les quatre sommets emblématiques du Guipuscoa : Aratz, Aizkorri, Aitxuri (1 551 m, point culminant) et Andraitz. Le parcours est resté quasi identique depuis l'origine, et son record (Kilian Jornet, 3 h 36 min 40 s en 2022) reste l'une des marques de référence du sky-running mondial.

L'édition 2026 célèbre les 25 ans de la course, avec le retour annoncé de Kilian Jornet (vainqueur 11 fois entre 2007 et 2024). La course est cette année la manche d'ouverture de la Golden Trail World Series, ce qui concentre la quasi-totalité de l'élite mondiale sur la ligne de départ : Elhousine Elazzaoui (tenant du titre), Stian Angermund, Daniel Pattis, Tove Alexandersson, Sara Alonso, Judith Wyder.

Au-delà du sportif, Zegama est un phénomène culturel : 5 000 spectateurs massés sur les pentes de l'Aizkorri, tunnel humain au passage de Sancti-Spiritu, atmosphère basque qui fait de cette course un pèlerinage populaire. Toute la couverture Altitude Trail (12 articles à ce jour) est rassemblée ici.`,
  specs: [
    { label: "Distance", value: "42 km" },
    { label: "Dénivelé positif", value: "2 736 m+" },
    { label: "Altitude maximale", value: "1 551 m (Aitxuri)" },
    { label: "Temps maximum", value: "8 h" },
    { label: "Création", value: "2002" },
    { label: "Plateau", value: "500 dossards (lottery + invitations élite)" },
  ],
  programme: [
    { label: "Vendredi 15 mai 2026", value: "Kilomètre Vertical (5,2 km / 1 015 m+), épreuve associée. Départs individuels toutes les 30 sec" },
    { label: "Samedi 16 mai", value: "Briefing officiel, retraits dossards, conférence de presse élite" },
    { label: "Dimanche 17 mai", value: "Départ Marathon 9 h heure de Madrid (9 h Paris). Premières arrivées vers 12 h 40 (hommes), 14 h (femmes)" },
  ],
  palmares: [
    { year: 2025, men: "Elhousine Elazzaoui (MAR)", women: "Sara Alonso (ESP)", menTime: "3 h 43 min 28 s", womenTime: "4 h 27 min 25 s" },
    { year: 2024, men: "Kilian Jornet (ESP)", women: "Maude Mathys (SUI)", menTime: "3 h 41 min 12 s", womenTime: "4 h 22 min 18 s" },
    { year: 2023, men: "Stian Angermund (NOR)", women: "Maude Mathys (SUI)", menTime: "3 h 44 min 01 s", womenTime: "4 h 21 min 39 s" },
    { year: 2022, men: "Kilian Jornet (ESP)", women: "Nienke Brinkman (NED)", menTime: "3 h 36 min 40 s (record)", womenTime: "4 h 16 min 43 s (record)" },
    { year: 2019, men: "Kilian Jornet (ESP)", women: "Sheila Avilés (ESP)", menTime: "3 h 49 min 51 s", womenTime: "4 h 30 min 14 s" },
  ],
  glossary: [
    { term: "Mendi Maratoia", definition: "Littéralement « marathon de montagne » en basque. Désignation officielle de l'épreuve, distincte d'un marathon route classique." },
    { term: "Sancti-Spiritu", definition: "Ermitage à l'arrivée du Kilomètre Vertical et passage clé du Marathon. Lieu de l'iconique tunnel humain où les 5 000 spectateurs s'écartent au dernier moment devant les coureurs." },
    { term: "Aitxuri", definition: "Point culminant du parcours (1 551 m), atteint vers le km 25. Sommet emblématique de la sierra d'Aizkorri." },
    { term: "Golden Trail World Series (GTWS)", definition: "Circuit de skyrunning mondial créé en 2018, comptant 6 manches dont Zegama est l'ouverture en 2026. Classement annuel cumulé." },
    { term: "Sky Marathon", definition: "Format officiel ISF (International Skyrunning Federation) : 30-50 km avec D+ supérieur à 2 000 m. Zegama est l'archétype." },
    { term: "Skytopper", definition: "Le passage en file unique sur la crête entre Aizkorri et Aitxuri. Section la plus exposée en cas de mauvais temps." },
  ],
  faq: [
    { question: "Comment s'inscrire à Zegama ?", answer: "Lottery annuelle ouverte en janvier. Sur ~5 000 candidats, 500 dossards attribués (dont 50-80 invitations élite). Pas de critères qualifiants stricts hors expérience trail." },
    { question: "Quel est le record ?", answer: "Kilian Jornet : 3 h 36 min 40 s (2022). Nienke Brinkman : 4 h 16 min 43 s (2022)." },
    { question: "Combien coûte l'inscription ?", answer: "75 € pour 2026 (l'une des moins chères du circuit mondial, par choix éditorial de l'organisation locale)." },
    { question: "Y a-t-il une diffusion en direct ?", answer: "Oui, retransmission gratuite sur la chaîne YouTube de la Golden Trail World Series, démarrage 8 h 45 heure de Madrid. Couverture francophone par Altitude Trail." },
    { question: "Pourquoi tant de spectateurs ?", answer: "Tradition basque : la course est devenue un événement culturel local. La municipalité estime 25 000 visiteurs sur le week-end pour une population de 1 500 habitants. Atmosphère unique au monde sur ce format." },
  ],
  howToWatch: [
    { label: "Golden Trail World Series", url: "https://goldentrailseries.com/", description: "Live YouTube gratuit, démarrage dimanche 8 h 45 heure de Madrid (8 h 45 Paris)" },
    { label: "Zegama-Aizkorri officiel", url: "https://www.zegama-aizkorri.com/en/", description: "Site officiel avec timing live, positions intermédiaires aux sommets" },
    { label: "Live blog Altitude Trail", description: "Coverage francophone Altitude Trail avec 11 mises à jour automatiques toutes les heures dimanche 7 h-17 h" },
  ],
  officialUrl: "https://www.zegama-aizkorri.com/en/",
  nextEditionDate: "2026-05-17",
};
