#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { EDITORIAL_STYLE_ORIGINAL } from "./lib/editorial-style.mjs";

const CONTENT_DIR = path.resolve("content/articles");
const PUBLIC_IMAGES_DIR = path.resolve("public/articles");

const FAL_KEY = process.env.BFL_API_KEY || process.env.FAL_API_KEY;
if (!FAL_KEY) {
  console.error("BFL_API_KEY / FAL_API_KEY manquante");
  process.exit(1);
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";
const FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro/v1.1";
const STYLE_SUFFIX =
  ", cinematic photography, photorealistic, trail running editorial style, dramatic natural lighting, shallow depth of field, 35mm film aesthetic, ultra realistic, magazine quality";
const HERO_W = 1200;
const HERO_H = 672;
const BODY_W = 1344;
const BODY_H = 768;
const FALLBACK_HERO = "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=80";
const DEFAULT_DATE = "20 avril 2026";

const FORCE = process.argv.includes("--force");

// ARTICLES : spécifications pour la génération.
// Éditez/étendez pour alimenter une rubrique. Les articles déjà créés sont
// automatiquement passés (skip if file existe, sauf --force).
const ARTICLES = [
  // ===== DÉBUTER =====
  {
    slug: "premiere-sortie-trail-choix-parcours-allure",
    title: "Première sortie trail : comment choisir son parcours et son allure",
    excerpt:
      "Ni trop long ni trop raide : les règles simples pour que votre baptême en sentier reste un plaisir et pose les bases d'une pratique durable.",
    category: "Débuter",
    categorySlug: "debuter",
    tags: ["Débuter", "Parcours", "Allure", "Progression"],
    readTime: "7 min",
    date: "1 avril 2026",
    topic:
      "première sortie trail pour un coureur sur route : choisir un parcours adapté (5-8 km, +150-300 m, sentier balisé en forêt plutôt qu'en montagne), évaluer son niveau honnêtement, tenir l'allure en endurance fondamentale (test de la conversation, marche en côte assumée même très tôt), contenu du sac minimum (500 ml d'eau, coupe-vent, téléphone, barre), sécurité (horaires, météo, prévenir un proche), erreurs fréquentes au départ (vouloir courir 100% du parcours, comparer son allure à la route), comment progresser sans forcer d'une sortie à l'autre",
  },
  {
    slug: "choisir-premiere-paire-chaussures-trail-guide-complet",
    title: "Choisir sa première paire de chaussures de trail : le guide complet",
    excerpt:
      "Drop, crampons, amorti, pointure : cinq critères déterminent si vos premières sorties se feront avec plaisir ou avec ampoules. On décortique chacun d'eux.",
    category: "Débuter",
    categorySlug: "debuter",
    tags: ["Chaussures", "Débuter", "Équipement", "Achat"],
    readTime: "8 min",
    date: "3 avril 2026",
    topic:
      "guide d'achat chaussures de trail pour débuter : drop (différence talon-pointe, 6-8 mm idéal pour débuter), crampons (hauteur 3-5 mm, densité selon terrain), amorti (grosse stack pour longues distances ou fin pour proprioception), rock plate anti-cailloux, système de laçage, pointure (prendre demi-pointure voire pointure au-dessus, essayer en fin de journée avec chaussettes techniques), modèles polyvalents par gamme de prix (entry 80-110€ / intermédiaire 120-160€), alterner sur deux paires pour prolonger la durée de vie (600-800 km typique), quand remplacer",
  },
  {
    slug: "route-vers-trail-adapter-entrainement-sans-blessure",
    title: "De la route au trail : comment adapter son entraînement sans se blesser",
    excerpt:
      "Le passage du bitume au sentier change presque tout : cadence, allure, mécanique de descente. Voici la feuille de route pour basculer en douceur.",
    category: "Débuter",
    categorySlug: "debuter",
    tags: ["Transition", "Débuter", "Progression", "Route"],
    readTime: "8 min",
    date: "5 avril 2026",
    topic:
      "transition route vers trail : différences mécaniques (cadence plus variée, amplitude réduite, usage actif du tronc et des bras, pose de pied adaptable), adaptation neuromusculaire en 8-12 semaines, progression de terrain (chemins forestiers plats → vallonnés → techniques), apprendre la descente (oublier le chrono, pose médio-pied souple, regard 3-5 mètres devant), gestion de la marche en côte (dès 12-15% de pente), renforcement spécifique (ischios, mollets, moyen fessier, chevilles), charge d'entraînement (remplacer progressivement les séances route par du trail, pas tout changer d'un coup), risques typiques à cette phase (tendinite d'Achille, périostite, entorse de cheville)",
  },
  {
    slug: "premier-10km-trail-plan-entrainement-12-semaines",
    title: "Préparer son premier 10 km de trail en 12 semaines",
    excerpt:
      "Un plan clair, quatre séances par semaine et une progression respectueuse : le protocole que n'importe quel coureur motivé peut suivre pour franchir le cap.",
    category: "Débuter",
    categorySlug: "debuter",
    tags: ["Plan d'entraînement", "Débuter", "10 km", "Objectif"],
    readTime: "9 min",
    date: "7 avril 2026",
    topic:
      "plan 12 semaines premier 10 km de trail : phase 1 base aérobie (semaines 1-4, 3 sorties hebdomadaires en endurance fondamentale + 1 sortie longue progressive), phase 2 spécifique trail (semaines 5-8, ajout de côtes courtes, descentes techniques, sortie longue en montée douce), phase 3 affûtage (semaines 9-11, intensité modérée sur profil proche de la course, réduction progressive du volume), semaine 12 (taper, visualisation, check matériel, alimentation), exemples de séances types avec durées et descriptions précises, règle des 10% d'augmentation hebdomadaire, adaptation selon le niveau de départ (coureur régulier vs reprise)",
  },
  {
    slug: "materiel-minimum-demarrer-trail-budget",
    title: "Le matériel minimum pour démarrer le trail running (avec budget)",
    excerpt:
      "Inutile de dépenser 800 € pour se lancer. On dresse la liste des indispensables, gamme et prix réalistes pour la saison 2026.",
    category: "Débuter",
    categorySlug: "debuter",
    tags: ["Matériel", "Budget", "Équipement", "Débuter"],
    readTime: "8 min",
    date: "9 avril 2026",
    topic:
      "matériel minimum trail pour débuter avec budgets : chaussures (80-150€), short/collant technique avec poches latérales (40-60€), tee-shirt respirant synthétique ou mérinos (30-50€), veste coupe-vent compactable (60-100€), casquette (15-25€), sac d'hydratation 5 L type Salomon Active Skin ou Nathan VaporAiress (60-90€), gourdes souples (10-20€), frontale basique 200 lumens pour sortie matinale automne-hiver (30-50€), bâtons pliants (plus tard, 80-120€, pas essentiels au début), budget total 350-500€ pour un set complet, conseils achat (marques fiables, périodes de soldes janvier-juillet, circuits seconde main type Everide ou Vinted)",
  },

  // ===== NUTRITION =====
  {
    slug: "nutrition-ultra-plan-alimentaire-dix-heures-effort",
    title: "Nutrition en ultra : construire son plan alimentaire au-delà de 10 h d'effort",
    excerpt:
      "La digestion est le premier ennemi en ultra. Comment organiser son alimentation pour tenir physiquement et mentalement, sans coup de moins bien.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Nutrition", "Ultra", "Plan alimentaire", "Digestion"],
    readTime: "10 min",
    date: "2 avril 2026",
    topic:
      "nutrition ultra-trail 10 h et plus : besoins énergétiques (300-500 kcal/h selon intensité et gabarit), répartition glucides/lipides/protéines (80/15/5 en course), stratégie bâton (apports réguliers toutes les 30-45 min, pas de longues pauses), alternance liquide/solide selon la fatigue digestive, apports sodium 500-1000 mg/h en chaleur, timing des grosses collations aux ravitos principaux, gestion de la fatigue digestive après 6-8 h (passage à des aliments familiers et tièdes : purée de pommes de terre, bouillon, riz au lait, banane), aliments-clés qui fonctionnent en ultra, erreurs à éviter (sur-gélification, changement soudain de stratégie en course, aliments nouveaux)",
  },
  {
    slug: "glucides-trail-combien-quand-quelle-forme",
    title: "Les glucides en trail : combien, quand, sous quelle forme",
    excerpt:
      "60, 90, 120 g/h ? La science avance vite et les recommandations aussi. Tour d'horizon actualisé des apports glucidiques en course, fondé sur les dernières études.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Glucides", "Nutrition", "Gels", "Science"]  ,
    readTime: "9 min",
    date: "4 avril 2026",
    topic:
      "glucides en trail running : bases physiologiques (stock glycogène 400-500 g chez un athlète bien préparé), oxydation maximale par heure (la barre des 60 g/h a été repoussée à 90-120 g/h grâce au mix glucose-fructose en ratio 2:1 ou 1:0,8), formes disponibles (gels, boissons isotoniques, barres, gâteaux maison), timing (charge de 3-4 g/kg dans les 3-4 h avant départ, prise régulière pendant, recharge post-effort dans les 30 min), training the gut (protocoles progressifs pour tolérer des apports élevés sans trouble digestif), pics insuliniques, marques françaises et internationales (Baouw, Näak, Maurten, Overstim's), alternatives naturelles (purée de fruits, dattes, figues séchées, patate douce cuite)",
  },
  {
    slug: "sels-electrolytes-trail-dosage-chaleur-effort-long",
    title: "Sels et électrolytes : dosage pour la chaleur et l'effort long",
    excerpt:
      "Sodium, potassium, magnésium : trois minéraux centraux dans la réussite d'un ultra par temps chaud. Dosages, formes, erreurs classiques.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Électrolytes", "Sodium", "Chaleur", "Hydratation"],
    readTime: "8 min",
    date: "6 avril 2026",
    topic:
      "électrolytes en trail : rôle physiologique du sodium (équilibre hydrique, contraction musculaire), du potassium (excitabilité cellulaire) et du magnésium (synthèse ATP, relâchement), pertes sudorales pouvant atteindre 1 à 1,5 L/h avec 0,5 à 1,5 g de sodium par litre selon l'individu et la chaleur, risque majeur d'hyponatrémie liée à une surhydratation sans apport salin, protocole pratique (500-1000 mg de sodium/h en forte chaleur), formes disponibles (capsules SaltStick ou Overstim's, boissons isotoniques, bouillon salé aux ravitos), test de sudation personnalisé pour connaître son profil, signes de déséquilibre (crampes tardives, vertiges, nausées, confusion mentale en fin d'effort)",
  },
  {
    slug: "nutrition-avant-course-semaine-qui-precede-ultra",
    title: "Nutrition avant-course : la semaine qui précède un ultra",
    excerpt:
      "Carbohydrate loading, hydratation, fibres, alcool : comment bâtir les sept derniers jours avant le départ pour arriver sur la ligne au top.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Préparation course", "Glucides", "Hydratation", "Ultra"],
    readTime: "8 min",
    date: "8 avril 2026",
    topic:
      "nutrition la semaine avant un ultra : protocole moderne de carbohydrate loading (8-12 g de glucides/kg/jour dans les 36-48 h qui précèdent, plus efficace que l'ancienne semaine d'excès), importance du tapering (réduction du volume d'entraînement pour saturer les stocks de glycogène), hydratation progressive sans excès (viser une urine claire sans se forcer), réduction des fibres à 48 h du départ pour alléger la digestion, alcool déconseillé 72 h avant, repas du soir J-1 (pâtes classiques, éviter les nouveautés, portions maîtrisées), petit-déjeuner jour J (3-4 h avant départ, pain beurre-miel ou porridge, glucides + protéines, faible en gras et fibres), check-list des erreurs fréquentes (régime drastique, nouveautés alimentaires, sous-hydratation de peur de s'arrêter)",
  },
  {
    slug: "erreurs-nutritionnelles-qui-cassent-une-saison-trail",
    title: "Les erreurs nutritionnelles qui cassent une saison entière",
    excerpt:
      "Déficit énergétique relatif, sous-consommation de glucides, carences en fer : ces erreurs invisibles s'accumulent et finissent par briser la progression.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Santé", "RED-S", "Fer", "Performance"],
    readTime: "9 min",
    date: "10 avril 2026",
    topic:
      "erreurs nutritionnelles récurrentes chez le traileur : déficit énergétique relatif (RED-S, répercussions hormonales fréquentes particulièrement chez les femmes, baisse de performance chronique, troubles du cycle menstruel, fragilité osseuse), sous-consommation de glucides par peur de la prise de poids (rendement diminué des séances, épuisement tardif), carence en fer (fréquente, fatigue chronique, baisse de VO2max, signes : pâleur, essoufflement à l'effort, bilan sanguin ferritine + CRP), déshydratation chronique, excès de protéines au détriment des glucides, négligence du postprandial (fenêtre métabolique des 30 min post-séance), carence en vitamine D en hiver, signaux d'alerte (fatigue persistante, sommeil détérioré, humeur, chute de performance), quand consulter un médecin ou nutritionniste du sport",
  },

  // ===== ENTRAÎNEMENT & PERFORMANCES =====
  {
    slug: "plan-entrainement-ultra-quatre-blocs-essentiels",
    title: "Bâtir son plan d'entraînement pour un ultra : les 4 blocs essentiels",
    excerpt:
      "Base, développement, spécifique, affûtage : comprendre ces quatre phases change la façon dont on structure six mois de préparation.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Plan d'entraînement", "Ultra", "Périodisation", "Performance"],
    readTime: "10 min",
    date: "12 avril 2026",
    topic:
      "plan ultra 24 semaines en 4 blocs : bloc 1 base aérobie (8 semaines, volume progressif, 80% d'endurance fondamentale, peu d'intensité, fondations), bloc 2 développement (6 semaines, introduction de seuil et de VMA, sorties longues en côte, premier choc physiologique), bloc 3 spécifique (6 semaines, reproduction du profil réel de la course, sorties dos-à-dos le week-end, dénivelé cumulé hebdomadaire cible), bloc 4 affûtage (3-4 semaines, réduction du volume de 50-60% mais maintien de l'intensité, dernière grosse séance J-10), semaine de récupération tous les 3-4 semaines, adaptation selon la distance cible (50 km, 100 km, 100 miles), tenir compte des contraintes perso (famille, travail)",
  },
  {
    slug: "renforcement-musculaire-trail-exercices-cles",
    title: "Renforcement musculaire pour le trail : les exercices qui changent tout",
    excerpt:
      "Deux séances par semaine bien ciblées font plus pour votre performance en trail que dix sorties supplémentaires. Le programme minimaliste qui marche.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Renforcement", "Musculation", "Performance", "Prévention"],
    readTime: "9 min",
    date: "14 avril 2026",
    topic:
      "renforcement musculaire ciblé pour le trail : chaînes postérieures (ischio-jambiers, fessiers, lombaires), stabilisateurs de la hanche (moyen fessier souvent déficient), mollet et pied (soléaires, triceps sural, intrinsèques), gainage fonctionnel (anti-rotation du tronc), 6 exercices clés à maîtriser : squat bulgare ou fente arrière chargée, soulevé de terre roumain unilatéral, élévation unilatérale sur marche, planche dynamique, bird dog avec tenue, calf raise excentrique en descente de marche, volume recommandé (2 séances hebdomadaires de 30-45 min, à distance des sorties intenses), périodisation (plus de charge hors période de course, entretien pendant), impact prouvé sur l'économie de course et la résistance à la fatigue musculaire",
  },
  {
    slug: "seuil-trail-structurer-intervalles-cote",
    title: "Le seuil en trail : comment structurer ses intervalles en côte",
    excerpt:
      "L'entraînement au seuil, socle de la performance en endurance, doit être pensé différemment quand le dénivelé s'en mêle. Méthodologie.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Seuil", "Intervalles", "Côte", "VMA"],
    readTime: "9 min",
    date: "16 avril 2026",
    topic:
      "intervalles au seuil en côte : définition du seuil lactique (SL2) vs seuil ventilatoire 2, particularité du seuil en montée (fréquence cardiaque typiquement 5-10 bpm plus basse qu'en plat à effort équivalent en lactate), choix de la pente (5-10% pour des efforts longs façon fractionné long, >10% pour force-vitesse et sollicitation plus musculaire), formats classiques (6x3 min en côte moyenne, 4x5 min, 3x8 min avec récupération en descente active), repères d'allure subjective (effort confortablement dur, conversation coupée, sensation maîtrisable), rotation hebdomadaire avec d'autres qualités (VMA en côte courte, endurance en côte longue), erreurs classiques à éviter (partir trop vite sur les premières reps, négliger la récupération descente, multiplier ce type de séance au-delà d'une par semaine)",
  },
  {
    slug: "preparation-mentale-ultra-gerer-nuit-douleur-bas",
    title: "Préparation mentale en ultra : gérer la nuit, la douleur, les bas",
    excerpt:
      "Au-delà de douze heures, le mental bascule. Traverser les nuits et les passages creux relève d'une préparation aussi rigoureuse que l'entraînement physique.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Mental", "Ultra", "Nuit", "Préparation"],
    readTime: "9 min",
    date: "18 avril 2026",
    topic:
      "préparation mentale en ultra-trail : chunking (découpage cognitif de la course en segments courts de ravito à ravito), ancrages mentaux préparés en amont (un mot, une image, un proche qu'on convoque), gestion des bas psychologiques (acceptation sans lutte, dialogue intérieur, rituels de relance : boire, manger, relâcher la cadence), adaptation à la nuit (baisse de lumière → baisse de vigilance → somnolence, gestion du café et de la caféine, micro-sieste active 15-20 min possible), distinction entre douleur inconfort acceptable et signal d'alerte, visualisation répétée en amont des passages durs connus, rôle du crew et des accompagnants (rôle opérationnel et émotionnel), méditation et routine pré-course pour calmer l'anxiété du départ",
  },
  {
    slug: "recuperation-charge-entrainement-eviter-surentrainement",
    title: "Récupération et charge d'entraînement : lire ses signaux pour éviter le surentraînement",
    excerpt:
      "Fréquence cardiaque au repos, variabilité cardiaque, sommeil : trois indicateurs simples pour ajuster sa charge semaine après semaine.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Récupération", "HRV", "Surentraînement", "Charge"],
    readTime: "9 min",
    date: "19 avril 2026",
    topic:
      "charge d'entraînement et récupération en trail : concept de charge aiguë sur chronique (ratio ACWR, zone rouge au-delà de 1,5), fatigue physiologique vs fatigue psychologique, indicateurs simples à tenir soi-même (FC de repos au réveil, HRV mesurée chaque matin avec une montre ou app, qualité du sommeil, humeur, sensation sur une séance repère hebdomadaire), test de Ruffier-Dickson ou saut vertical pour vérifier la fraîcheur physique, signes de surentraînement (baisse de performance prolongée, FC repos anormalement élevée, irritabilité, perte d'appétit ou de poids), outils grand public (montres GPS avec HRV comme Garmin ou Polar, application Elite HRV, Strava score de forme), programmation d'une semaine de décharge tous les 3-4 semaines, périodes critiques à surveiller (avant une course, retour de course), importance capitale du sommeil et de l'alimentation post-séance",
  },

  // ===== ACTUALITÉS =====
  {
    slug: "ffa-certification-epreuves-trail-nouveau-cadre-2026",
    title: "FFA et certification des épreuves trail : le nouveau cadre 2026 décrypté",
    excerpt:
      "La Fédération française d'athlétisme revoit son dispositif d'agrément des courses nature pour la saison 2026. Ce que ça change pour les organisateurs et les coureurs.",
    category: "Actualités",
    categorySlug: "actualites",
    tags: ["FFA", "Certification", "Réglementation", "Organisation"],
    readTime: "8 min",
    date: "25 mars 2026",
    topic:
      "réforme 2026 du cadre FFA de certification des épreuves trail : critères (kilométrage, dénivelé, assurances, ETU, médicalisation, ravitaillements), distinction épreuves officielles / non-officielles, impact organisateurs (coûts, logistique), bénéfices coureurs (résultats homologués, cotation ITRA, qualifications), calendrier d'application, positions des principaux organisateurs français, analyse : tournant pour la professionnalisation du trail français ?",
  },
  {
    slug: "stations-montagne-ete-vtt-trail-modele-economique",
    title: "Stations de montagne : la bataille de l'été entre VTT et trail",
    excerpt:
      "Les stations françaises cherchent leur nouveau modèle économique hors saison hivernale. Le trail et le VTT se partagent — ou s'affrontent — sur les mêmes versants.",
    category: "Actualités",
    categorySlug: "actualites",
    tags: ["Stations", "Économie", "Aménagement", "Tendance"],
    readTime: "9 min",
    date: "15 avril 2026",
    topic:
      "positionnement stratégique des stations alpines françaises sur l'été : VTT enduro-DH vs trail running, investissements (remontées piétonnes, balisage, labels, Label'Trail FFA), concurrence ou complémentarité (cas La Clusaz pro-trail, Les 2 Alpes pro-VTT, Serre Chevalier hybride), influence des grands événements (UTMB World Series, Crankworx, EWS), économie (nuitées, retombées locales), tensions entre pratiques sur les mêmes sentiers, analyse : spécialisation ou co-existence ?",
  },
  {
    slug: "chaussures-carbone-trail-itra-reglementation-limite",
    title: "Chaussures carbone en trail : la limite réglementaire ITRA enfin posée",
    excerpt:
      "Après des années de flou, l'International Trail Running Association tranche sur les plaques carbone et les épaisseurs de semelles. Nouvelle règle, nouvelle industrie.",
    category: "Actualités",
    categorySlug: "actualites",
    tags: ["ITRA", "Chaussures", "Carbone", "Industrie"],
    readTime: "8 min",
    date: "10 avril 2026",
    topic:
      "réglementation ITRA 2026 sur les chaussures de trail : précédents World Athletics pour la route (40 mm stack, plaque unique), transposition discutée au trail (limites en débat, spécificités terrain), positions des marques (Nike Vaporfly-Trail, Hoka, adidas Adizero Prime X, Salomon S/Lab), impact sur les records et économie de course, dimension éthique (sport vs industrie), calendrier d'application, positions publiques d'athlètes élites, analyse : fin de l'ère sans règle du matériel trail ?",
  },
  {
    slug: "utmb-wildcards-elites-protestation-systeme",
    title: "UTMB et les wildcards : le mouvement de protestation des élites",
    excerpt:
      "Invitations personnelles, tirages au sort, critères opaques : le système d'accès à l'UTMB est remis en cause par une partie des meilleurs coureurs mondiaux.",
    category: "Actualités",
    categorySlug: "actualites",
    tags: ["UTMB", "Élites", "Wildcards", "Gouvernance"],
    readTime: "9 min",
    date: "5 avril 2026",
    topic:
      "controverse autour du système UTMB : fonctionnement (pierres de qualification ITRA, tirage au sort, wildcards organisateurs), critiques d'élites (manque de transparence des critères, questions de parité genre, dépendance sponsors Hoka-UTMB), tribunes collectives récentes, réponse UTMB Group, parallèle avec d'autres modèles (Hardrock lottery, Western States, Barkley), analyse : l'UTMB peut-il rester légitime sans réforme profonde de son modèle d'accès ?",
  },
  {
    slug: "kilian-jornet-nnormal-modele-marque-durable",
    title: "Kilian Jornet et NNormal : les coulisses d'un modèle vertical",
    excerpt:
      "Trois ans après le lancement, la marque du Catalan s'impose dans le trail avec un modèle de production et de distribution qui rompt avec l'industrie classique.",
    category: "Actualités",
    categorySlug: "actualites",
    tags: ["NNormal", "Kilian Jornet", "Industrie", "Durabilité"],
    readTime: "9 min",
    date: "30 mars 2026",
    topic:
      "état des lieux NNormal après trois saisons : modèle d'entreprise (co-fondation Camper, production locale, gamme volontairement réduite), succès Kjerag et Tomir, positionnement durable (matériaux bio-sourcés, réparabilité, empreinte), place dans l'écosystème sponsoring (équipe NNormal vs écurie classique), comparaison avec On Running et Saucony, analyse : modèle reproductible ou niche militante ?",
  },

  // ===== COURSES & RÉCITS =====
  {
    slug: "grand-raid-pyrenees-portraits-vainqueurs-strategies",
    title: "Grand Raid des Pyrénées : quatre vainqueurs, quatre stratégies gagnantes",
    excerpt:
      "Depuis sa création en 2011, le GRP a sacré des profils très différents. Portrait croisé de quatre coureurs qui racontent leurs 160 kilomètres.",
    category: "Courses & Récits",
    categorySlug: "courses-recits",
    tags: ["GRP", "Pyrénées", "Portraits", "Ultra"],
    readTime: "10 min",
    date: "20 mars 2026",
    topic:
      "histoires croisées de vainqueurs récents du Grand Raid des Pyrénées (160 km, +10000 m) : quatre approches tactiques distinctes (fort départ puis gestion, crescendo, nocturne optimale, pari nutrition audacieux), profils de coureurs (âge, expérience, pays), passages-clés (port de Bielsa, col de Madamète, brèche de Roland), moments critiques, analyse éditoriale : qu'est-ce qui fait un bon ultratraileur sur cette course techniquement exigeante ?",
  },
  {
    slug: "tds-2024-meteo-course-bouleversee-recit",
    title: "TDS 2024 : le jour où la météo a tout rebattu",
    excerpt:
      "Orage cévenol, brouillard épais, boue jusqu'aux chevilles : le 28 août 2024, la TDS a basculé. Retour sur une édition qui a redéfini les standards de gestion du risque.",
    category: "Courses & Récits",
    categorySlug: "courses-recits",
    tags: ["TDS", "UTMB", "Météo", "Récit"],
    readTime: "10 min",
    date: "1 avril 2026",
    topic:
      "récit chronologique de la TDS 2024 bouleversée par la météo : contexte amont (prévisions dégradées, maintien contesté), décisions d'organisation (déroutage à la Gittaz, arrêts), gestion du matériel obligatoire, abandon massif au col de la Seigne, positions des élites (Pommeret, Chaverot, Kyburz), enseignements UTMB Group (protocole météo durci pour 2025), parallèle Diagonale des Fous 2019, analyse : le trail peut-il rester ouvert aux conditions extrêmes ?",
  },
  {
    slug: "occitane-by-utmb-sud-ouest-ariege-ascension",
    title: "L'Occitane by UTMB : comment le sud-ouest s'est imposé en deux saisons",
    excerpt:
      "Née en 2022 dans les Pyrénées ariégeoises, l'Occitane by UTMB est devenue une étape incontournable du calendrier mondial. Anatomie d'une ascension éclair.",
    category: "Courses & Récits",
    categorySlug: "courses-recits",
    tags: ["Occitane", "UTMB World Series", "Ariège", "Croissance"],
    readTime: "9 min",
    date: "25 mars 2026",
    topic:
      "ascension de l'Occitane by UTMB (Ax-les-Thermes, Ariège) : lancement 2022, intégration World Series, évolution de la participation (passage de 2 000 à plus de 8 000 dossards en trois saisons), parcours-phare 155 km et 8 700 m D+, vainqueurs marquants, positionnement géographique stratégique (sud-ouest moins saturé), retombées économiques locales, modèle partenarial UTMB Group / collectivités / station, analyse : quel rôle cette course joue-t-elle dans la cartographie française du trail ?",
  },
  {
    slug: "restonica-trail-corse-ultra-confidentiel-reference",
    title: "Restonica Trail : le confidentiel corse devenu référence",
    excerpt:
      "110 km dans les aiguilles de Bavella et le massif du Rotondo, sur le sentier du GR 20. L'ultra le plus dur de France a longtemps vécu à l'écart. Plus maintenant.",
    category: "Courses & Récits",
    categorySlug: "courses-recits",
    tags: ["Restonica", "Corse", "GR 20", "Ultra"],
    readTime: "9 min",
    date: "10 avril 2026",
    topic:
      "histoire du Restonica Trail : création 2010 à l'initiative de coureurs locaux, longue phase confidentielle (moins de 200 dossards), parcours unique (GR 20, aiguilles de Bavella, massif du Rotondo, 110 km et +7500 m), difficultés propres (pierriers, câbles, exposition), vainqueurs historiques, médiatisation depuis 2022 (docu Salomon TV, retour de Thierry Breuil), positionnement calendrier (juin, pré-saison alpine), analyse : l'ultra le plus dur de France et pourquoi ça compte.",
  },
  {
    slug: "diagonale-fous-2023-duel-grangier-dhaene",
    title: "Diagonale des Fous 2023 : le duel Grangier-D'Haene, minute par minute",
    excerpt:
      "Deux jours, deux nuits, 165 km à moins de cinq minutes d'écart. Retour sur le duel qui a animé l'édition 2023 du Grand Raid réunionnais.",
    category: "Courses & Récits",
    categorySlug: "courses-recits",
    tags: ["Diagonale des Fous", "François D'Haene", "Réunion", "Récit"],
    readTime: "10 min",
    date: "28 mars 2026",
    topic:
      "récit détaillé du duel François D'Haene / Mathieu Grangier sur la Diagonale des Fous 2023 : timeline chronologique (Saint-Pierre départ, Cilaos, Marla, Mafate, Roche-Écrite, Saint-Denis), écarts par grand point de passage, moments clés (coup dur de D'Haene à Dos d'Âne, remontée de Grangier puis contre-remontée nocturne), conditions météo et ambiance, ressources publiques des deux coureurs post-course, analyse : qu'est-ce qui a fait basculer la course ?",
  },

  // ===== BLESSURES (cinq sujets nouveaux) =====
  {
    slug: "syndrome-piriforme-traileur-douleur-fessiere",
    title: "Syndrome du piriforme : la douleur fessière qui mime une sciatique",
    excerpt:
      "Une douleur profonde au milieu de la fesse qui irradie dans la jambe en descente. Rare, mais capable de briser une saison entière si elle est mal prise en charge.",
    category: "Blessures & Préventions",
    categorySlug: "blessures",
    tags: ["Syndrome du piriforme", "Fessier", "Sciatique", "Kiné"],
    readTime: "9 min",
    date: "12 avril 2026",
    topic:
      "syndrome du piriforme chez le traileur : anatomie (muscle piriforme, rapport anatomique avec le nerf sciatique, variante anatomique 10-15 % où le nerf traverse le muscle), mécanismes déclenchants (surcharge en descente technique, gainage insuffisant, sédentarité prolongée), diagnostic différentiel avec la sciatique radiculaire (test de FAIR, place de l'IRM), traitement (étirements spécifiques, massages profonds, infiltration en seconde intention), prévention (renforcement moyen fessier, assouplissement rotateurs externes), protocole de reprise",
  },
  {
    slug: "ampoules-frottements-ultra-prevention-gestion",
    title: "Ampoules et frottements en ultra : l'ennemi sous-estimé",
    excerpt:
      "Un détail qui sabote des courses entières. La gestion des frottements relève autant de la préparation que du plan d'attaque aux ravitaillements.",
    category: "Blessures & Préventions",
    categorySlug: "blessures",
    tags: ["Ampoules", "Ultra", "Pieds", "Équipement"],
    readTime: "8 min",
    date: "8 avril 2026",
    topic:
      "prévention et gestion des ampoules en ultra-trail : mécanisme (chaleur, humidité, friction combinées), facteurs aggravants (chaussettes inadaptées, chaussures mouillées, hyper-pronation, ongles longs), préparation sur 2-3 semaines (tannage à l'alcool camphré, callotage au nubuck, taping des zones à risque), équipement (chaussettes techniques double épaisseur type Injinji, coque talon bien adaptée, pointure), kit ampoules (aiguille stérile, compeed, tape micropore), intervention aux ravitos (séchage, changement complet de chaussettes, percer ou non), retour d'expérience Diagonale des Fous, UTMB, Grand Raid Pyrénées",
  },
  {
    slug: "lombalgie-traileur-sac-hydratation-gestion-charge",
    title: "Lombalgie du traileur : quand le sac d'hydratation devient le problème",
    excerpt:
      "Douleur bas du dos qui s'installe sur les longues sorties, s'efface au repos, revient en course. Souvent le signe d'un réglage de matériel à revoir.",
    category: "Blessures & Préventions",
    categorySlug: "blessures",
    tags: ["Lombalgie", "Dos", "Équipement", "Gainage"],
    readTime: "8 min",
    date: "18 avril 2026",
    topic:
      "lombalgie mécanique du traileur liée au sac d'hydratation : anatomie (paravertébraux, disques L4-L5, L5-S1), mécanisme (charge déséquilibrée, posture en hyperextension sur montée raide, vibrations répétées en descente), facteurs matériel (taille de sac inadaptée, surcharge au-delà de 3-4 kg, positions poches avant mal calibrées), facteurs physiologiques (gainage insuffisant, déficit ischio-jambiers, raideur fléchisseurs de hanche), traitement (massages, étirements, kiné), rééducation (programmes Williams et McKenzie selon profil), choix matériel corrigé (taille de torse mesurée, ajustement ceinture, contenance minimale)",
  },
  {
    slug: "fracture-fatigue-trail-signaux-alerte",
    title: "Fracture de fatigue : lire les signaux avant la rupture",
    excerpt:
      "Une douleur qui monte en intensité à chaque sortie, un point précis qui brûle la nuit. Le piège classique du coureur qui repousse la consultation.",
    category: "Blessures & Préventions",
    categorySlug: "blessures",
    tags: ["Fracture de fatigue", "Tibia", "Diagnostic", "Os"],
    readTime: "9 min",
    date: "15 avril 2026",
    topic:
      "fracture de fatigue chez le traileur : mécanismes biomécaniques (microtraumatismes répétés, défaut d'adaptation osseuse), sites fréquents (tibia antérieur, col fémoral, métatarses), facteurs de risque (augmentation brutale du volume, déficit énergétique relatif RED-S, carence vitamine D, cycle menstruel irrégulier), symptômes évolutifs (gêne en fin de sortie → douleur en cours d'effort → douleur au repos), diagnostic (radiographie souvent négative à J+15, IRM de référence, scintigraphie), traitement (6-8 semaines de décharge selon siège), retour progressif avec règle des 10 %, rôle de la nutrition (vitamine D, calcium, apport énergétique suffisant)",
  },
  {
    slug: "ongles-noirs-onychomycose-pied-coureur-soins",
    title: "Ongles noirs et onychomycose : les petites misères du pied du coureur",
    excerpt:
      "Décollement, noircissement, démangeaisons : le pied du traileur cumule les traumatismes. Décryptage des pathologies les plus fréquentes et des soins adaptés.",
    category: "Blessures & Préventions",
    categorySlug: "blessures",
    tags: ["Ongles", "Pieds", "Dermatologie", "Soins"],
    readTime: "8 min",
    date: "22 avril 2026",
    topic:
      "pathologies de l'ongle chez le coureur de trail : hématome sous-unguéal (ongle noir par traumatisme répété, prévention par pointure adaptée, ponction si gêne), onycholyse (décollement partiel ou total, repousse 6-12 mois), ongle incarné (causes, prise en charge podologique), onychomycose (infection fongique, facteurs favorisants humidité-macération-immunité, diagnostic par prélèvement, traitement topique ou systémique selon étendue, durée 3 à 6 mois), hygiène post-sortie, choix chaussettes, massage quotidien, quand consulter un dermatologue ou un podologue",
  },

  // ===== NOUVEAUX (20 avril 2026) =====
  {
    slug: "cafeine-ultra-trail-dosage-vigilance-nocturne",
    title: "La caféine en ultra : dosage optimal et gestion de la vigilance nocturne",
    excerpt:
      "Un café à Courmayeur, une capsule à minuit, un gel caféiné au lever du soleil. Le plan est rarement pensé. Comment utiliser vraiment la caféine pour passer la nuit sans la payer au réveil.",
    category: "Nutrition",
    categorySlug: "nutrition",
    tags: ["Caféine", "Vigilance", "Ultra", "Nuit"],
    readTime: "8 min",
    date: "20 avril 2026",
    topic:
      "utilisation raisonnée de la caféine en ultra-trail : pharmacocinétique (pic plasmatique 45-60 min après ingestion, demi-vie 4-6 h, métabolisme hépatique CYP1A2 très variable selon les individus), effets ergogènes démontrés par la littérature (↑ vigilance centrale, ↓ perception de l'effort, ↑ mobilisation des acides gras libres, amélioration de la précision motrice en fatigue), dosage recommandé 3-6 mg/kg avant effort prolongé, recharges en course (impulsions 50-100 mg/h en continu ou doses 100-200 mg à moments stratégiques), stratégie face à la nuit (ne pas abuser en début de nuit pour préserver la possibilité d'un abandon-sommeil ; dose critique vers 2 h-5 h du matin quand la mélatonine endogène culmine), formes disponibles (gels caféinés Maurten Caf, gommes Run Gum, capsules No-Doz 100 mg, café soluble aux ravitos UTMB, pastilles Lipton noir), interactions (↑ sollicitation cardiaque par forte chaleur, effet diurétique modéré surestimé par la croyance populaire), erreurs les plus fréquentes (surdosage par empilement de produits, premier usage le jour J sans tolérance testée), intérêt d'un sevrage 7-10 jours avant l'objectif pour maximiser l'effet",
  },
  {
    slug: "entrainement-specifique-descente-trail-excentrique",
    title: "Entraînement spécifique descente : pourquoi les jambes lâchent et comment y remédier",
    excerpt:
      "Les dix derniers kilomètres d'un ultra se jouent en descente, jambes détruites. La cause est musculaire, pas cardiaque. La parade aussi.",
    category: "Entraînement & Performances",
    categorySlug: "entrainement",
    tags: ["Descente", "Excentrique", "Renforcement", "Quadriceps"],
    readTime: "9 min",
    date: "20 avril 2026",
    topic:
      "entraînement spécifique à la descente en trail : physiologie de la contraction excentrique (muscle allongé sous tension, micro-lésions des sarcomères nettement plus marquées qu'en concentrique, courbatures retardées DOMS 24-48 h, déficit fonctionnel 50-80 % pendant 5-7 jours sur le quadriceps), pourquoi la descente casse les jambes en ultra (accumulation de micro-lésions non récupérées, effet repeated bout qui protège après quelques semaines d'entraînement préalable), protocoles d'entraînement terrain (sortie longue avec descente continue 30-60 min en endurance modérée sur pente 8-12 %, séance de descente rapide en côte technique type 6x200 m, renforcement en dehors des séances de course), travail au gymnase (squat descendant 3-4 s sur la phase excentrique, step-down unipodal sur marche, fente bulgare avec tempo, Nordic hamstring curl pour ischio-jambiers), règle de progression (augmentation du dénivelé négatif hebdomadaire plafonnée à 10 % par semaine), erreurs classiques (évitement de la descente par peur de la blessure, entraînement exclusivement concentrique en salle, programmation de charges massives de descente dans les 2 dernières semaines avant course), placement dans le plan (6 à 10 semaines avant l'objectif, semaine de décharge tous les 3-4 cycles)",
  },
];

const FORMAT_INSTRUCTIONS = `FORMAT DE SORTIE (ARTICLE ORIGINAL)

Prompts image à produire en anglais pour flux-pro-1.1 :
- heroPrompt : scène iconique 16:9 évoquant le sujet principal — 40-60 mots
- body1Prompt : scène contextuelle (terrain, équipement, moment illustratif) — 40-60 mots
- body2Prompt : scène d'un moment clé, différente de heroPrompt et body1Prompt — 40-60 mots
Chaque prompt ultra-spécifique : sujet, action, décor, lumière, équipement. Pas de style photographique (suffixe cinéma ajouté automatiquement). Une seule ligne chacun.

Réponds STRICTEMENT au format JSON brut (pas de code fence, pas de prose avant ni après), schéma :
{"content":"<corps markdown 1000-1200 mots, sans frontmatter, sans H1>","heroPrompt":"...","body1Prompt":"...","body2Prompt":"..."}`;

const SYSTEM_PROMPT = `${EDITORIAL_STYLE_ORIGINAL}\n\n${FORMAT_INSTRUCTIONS}`;

function userPrompt(spec) {
  return `Rédige l'article pour Altitude Trail à partir de ces éléments :

Titre : ${spec.title}
Chapô : ${spec.excerpt}
Sujet détaillé : ${spec.topic}
Catégorie : ${spec.category}
Tags : ${spec.tags.join(", ")}

Réponds UNIQUEMENT avec l'objet JSON demandé par le system prompt. Une seule ligne par prompt image, pas de retour chariot interne.`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function countWords(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

function insertImagesInBody(body, imageRefs) {
  const refs = imageRefs.filter(Boolean);
  if (!refs.length) return body;
  const paragraphs = body.split(/\n{2,}/);
  const total = countWords(body);
  const targets = [200, Math.max(Math.floor(total / 2), 450)];
  const out = [];
  let cum = 0;
  let inserted = 0;
  for (const p of paragraphs) {
    out.push(p);
    cum += countWords(p);
    while (inserted < refs.length && cum >= targets[inserted] && cum < total) {
      const { url, alt } = refs[inserted];
      out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
      inserted++;
    }
  }
  while (inserted < refs.length) {
    const { url, alt } = refs[inserted];
    out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
    inserted++;
  }
  return out.join("\n\n");
}

function extractJson(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("pas de JSON trouvé");
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function generateArticle(client, spec) {
  const stream = client.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 32000, // partage avec thinking:adaptive
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt(spec) }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "max_tokens") {
    throw new Error(
      "Claude a atteint max_tokens (stop_reason=max_tokens) - article tronque, rejete."
    );
  }
  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const parsed = extractJson(text);
  if (!parsed.content || !parsed.heroPrompt || !parsed.body1Prompt || !parsed.body2Prompt) {
    throw new Error(`JSON incomplet: ${Object.keys(parsed).join(", ")}`);
  }
  const words = countWords(parsed.content);
  if (words < 700) throw new Error(`content trop court (${words} mots)`);
  return { ...parsed, words };
}

async function generateFalImage(prompt, width, height) {
  const body = {
    prompt: `${prompt.trim()}${STYLE_SUFFIX}`,
    image_size: { width, height },
    num_inference_steps: 28,
    safety_tolerance: "2",
    output_format: "jpeg",
    enable_safety_checker: true,
  };
  const res = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error(`fal: pas d'URL`);
  return url;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

function buildMarkdownFile(spec, body, heroOk) {
  const tagsYaml = `[${spec.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`;
  const imagePath = heroOk ? `/articles/${spec.slug}-hero.jpg` : FALLBACK_HERO;
  const lines = [
    "---",
    `slug: "${spec.slug}"`,
    `title: "${spec.title.replace(/"/g, '\\"')}"`,
    `excerpt: "${spec.excerpt.replace(/"/g, '\\"')}"`,
    `category: "${spec.category}"`,
    `categorySlug: ${spec.categorySlug}`,
    `author: "Rédaction Altitude"`,
    `date: "${spec.date || DEFAULT_DATE}"`,
    `readTime: "${spec.readTime}"`,
    `image: "${imagePath}"`,
    `tags: ${tagsYaml}`,
    "---",
    "",
    body.trim(),
    "",
  ];
  return lines.join("\n");
}

async function processArticle(client, spec) {
  const mdPath = path.join(CONTENT_DIR, `${spec.slug}.md`);
  if (!FORCE && existsSync(mdPath)) {
    console.log(`[new-articles] skip ${spec.slug} (déjà créé)`);
    return { skipped: true };
  }

  console.log(`[new-articles] ${spec.slug}: Claude…`);
  const { content, heroPrompt, body1Prompt, body2Prompt, words } = await generateArticle(client, spec);
  console.log(`[new-articles]   content: ${words} mots`);

  const heroPath = path.join(PUBLIC_IMAGES_DIR, `${spec.slug}-hero.jpg`);
  const body1Path = path.join(PUBLIC_IMAGES_DIR, `${spec.slug}-1.jpg`);
  const body2Path = path.join(PUBLIC_IMAGES_DIR, `${spec.slug}-2.jpg`);

  const results = await Promise.all([
    (async () => {
      const url = await generateFalImage(heroPrompt, HERO_W, HERO_H);
      await downloadImage(url, heroPath);
      return "hero";
    })().catch((e) => {
      console.error(`[new-articles]   hero: error ${e.message}`);
      return null;
    }),
    (async () => {
      const url = await generateFalImage(body1Prompt, BODY_W, BODY_H);
      await downloadImage(url, body1Path);
      return "body1";
    })().catch((e) => {
      console.error(`[new-articles]   body1: error ${e.message}`);
      return null;
    }),
    (async () => {
      const url = await generateFalImage(body2Prompt, BODY_W, BODY_H);
      await downloadImage(url, body2Path);
      return "body2";
    })().catch((e) => {
      console.error(`[new-articles]   body2: error ${e.message}`);
      return null;
    }),
  ]);
  const ok = new Set(results.filter(Boolean));
  console.log(`[new-articles]   images: ${[...ok].join(", ") || "(aucune)"}`);

  const bodyRefs = [];
  if (ok.has("body1")) bodyRefs.push({ url: `/articles/${spec.slug}-1.jpg`, alt: `Illustration ${spec.category}` });
  if (ok.has("body2")) bodyRefs.push({ url: `/articles/${spec.slug}-2.jpg`, alt: `Illustration ${spec.category}` });
  const bodyWithImages = insertImagesInBody(content, bodyRefs);
  const md = buildMarkdownFile(spec, bodyWithImages, ok.has("hero"));
  await fs.writeFile(mdPath, md, "utf8");
  console.log(`[new-articles]   saved ${mdPath}`);
  return { skipped: false };
}

async function main() {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  const client = new Anthropic();
  let done = 0;
  let failed = 0;
  let skipped = 0;
  for (const spec of ARTICLES) {
    try {
      const { skipped: wasSkipped } = await processArticle(client, spec);
      if (wasSkipped) skipped++;
      else done++;
    } catch (e) {
      console.error(`[new-articles] ${spec.slug}: FAILED — ${e.message}`);
      failed++;
    }
  }
  console.log(`[new-articles] terminé — ${done} créé(s), ${skipped} skipped, ${failed} échec(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
