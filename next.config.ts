import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirections 301 — évite la cannibalisation SEO sur des pages aux
  // contenus proches et préserve le jus des liens entrants éventuels.
  async redirects() {
    return [
      {
        source: "/trouver-une-course",
        destination: "/courses",
        permanent: true,
      },
      // 301 : corrige les 404 dus a un mismatch filename/frontmatter-slug.
      // Les articles ont ete publies avec un frontmatter slug qui differe du
      // nom de fichier, donc le site les sert aux nouvelles URLs pendant que
      // Google a indexe les anciennes URLs (filename-based).
      {
        source: "/articles/biolite-range-500-headlamp-review",
        destination:
          "/articles/biolite-range-500-74-grammes-et-8-minutes-de-charge-pour-les-nuits-de-trail",
        permanent: true,
      },
      {
        source:
          "/articles/kilian-jornet-quand-son-message-ecolo-sur-l-utmb-vire-au-placement-de-produit",
        destination:
          "/articles/kilian-jornet-nnormal-et-l-utmb-quand-l-ecologie-devient-un-argument-commercial",
        permanent: true,
      },
      {
        source:
          "/articles/the-200-mile-phenomenon-a-data-based-look-at-their-growth-and-demographics",
        destination:
          "/articles/qui-court-vraiment-les-200-miles-de-trail-95-heures-40-ans-et-des-milliers-d",
        permanent: true,
      },
      // 301 : article satirique supprime (UTMB ravitos / crise subventions)
      // -> redirige vers le vrai article sur les subventions publiques UTMB Nice.
      {
        source:
          "/articles/utmb-supprime-tous-ses-ravitos-la-crise-des-subventions-frappe-le-trail-mondial",
        destination:
          "/articles/utmb-nice-perd-ses-subventions-publiques-trail-alsace-a-deja-trace-la-voie",
        permanent: true,
      },
      // ── Redirects automatiques : 88 articles avec mismatch filename ↔ frontmatter slug ──
      // Cause root : bug dans veille.mjs qui calculait baseSlug depuis le titre RSS source
      // alors que Claude réécrivait le titre dans la synthèse. Fixé dans le commit du même
      // batch (filename utilise désormais slugify(validated.meta.title)). Ces 88 redirects
      // couvrent les articles déjà publiés avec l'ancien comportement, pour éviter les 404
      // sur les anciens URLs (emails de notif, partages externes, indexation Google).
      {
        source: "/articles/2026-canyons-by-utmb-100k-results-adam-peterman-and-riley-brady-take-home-wins",
        destination: "/articles/canyons-by-utmb-2026-six-minutes-entre-quatre-hommes-trois-golden-tickets",
        permanent: true,
      },
      {
        source: "/articles/2026-cocodona-250-mile-results-rachel-entrekin-wins-outright-and-kilian-korth",
        destination: "/articles/56h09-au-cocodona-250-miles-entrekin-pulverise-le-record-absolu-et-l-emporte-au",
        permanent: true,
      },
      {
        source: "/articles/2026-madeira-island-ultra-trail-110k-results-victory-for-katharina-hartmuth-and",
        destination: "/articles/miut-110k-2026-hartmuth-gagne-enfin-apres-3-tentatives-la-france-rafle-le",
        permanent: true,
      },
      {
        source: "/articles/2026-transvulcania-half-marathon-results-volcanic-victory-for-ruth-gitonga-and",
        destination: "/articles/transvulcania-half-marathon-2026-gitonga-pulverise-le-record-kiriago-gagne-au",
        permanent: true,
      },
      {
        source: "/articles/2026-transvulcania-races-live-coverage",
        destination: "/articles/transvulcania-2026-le-vk-de-la-palma-entre-au-mountain-running-world-cup",
        permanent: true,
      },
      {
        source: "/articles/2026-transvulcania-ultramarathon-preview",
        destination: "/articles/transvulcania-2026-ben-dhiman-face-a-un-record-vieux-de-11-ans",
        permanent: true,
      },
      {
        source: "/articles/2026-transvulcania-vertical-kilometer-and-half-marathon-preview",
        destination: "/articles/transvulcania-2026-sept-kenyans-au-depart-d-une-coupe-du-monde-a-800",
        permanent: true,
      },
      {
        source: "/articles/2026-transvulcania-vk-results-kenyans-joyce-njeru-and-richard-omaya-atuya",
        destination: "/articles/transvulcania-vk-2026-omaya-atuya-et-njeru-signent-deux-records-le-kenya-ecrase",
        permanent: true,
      },
      {
        source: "/articles/2026-zegama-aizkorri-marathon-preview",
        destination: "/articles/zegama-2026-le-choc-alexandersson-alonso-et-la-quete-du-12e-sacre-de-jornet",
        permanent: true,
      },
      {
        source: "/articles/361-lynx-running-shoes-review",
        destination: "/articles/361-lynx-la-chaussure-de-trail-qui-monte-discretement-en-puissance",
        permanent: true,
      },
      {
        source: "/articles/a-seulement-22-ans-le-traileur-parisien-noa-ohms-remporte-un-100-miles-et",
        destination: "/articles/22-ans-100-miles-ticket-utmb-noa-ohms-la-revelation-parisienne-du-trail",
        permanent: true,
      },
      {
        source: "/articles/a-survival-guide-to-ultrarunning-race-lottery-rejection",
        destination: "/articles/recale-aux-loteries-d-ultra-le-guide-de-survie-du-traileur-decu",
        permanent: true,
      },
      {
        source: "/articles/allen-and-kershaw-win-108-mile-montane-winter-spine-challenger-south",
        destination: "/articles/montane-winter-spine-challenger-south-allen-et-kershaw-dominent-les-108-miles-de",
        permanent: true,
      },
      {
        source: "/articles/andy-symonds-est-la-preuve-vivante-qu-il-n-y-a-pas-d-age-pour-reussir-en-trail",
        destination: "/articles/a-44-ans-andy-symonds-domine-le-grand-raid-ventoux-by-utmb-et-redefinit-l-age",
        permanent: true,
      },
      {
        source: "/articles/anta-guanjun-trail-running-premium-shoes-from-china-interview-at-hk100-by-mayayo",
        destination: "/articles/anta-guanjun-la-chine-vise-le-haut-de-gamme-du-trail-avec-la-saker-3rc",
        permanent: true,
      },
      {
        source: "/articles/applications-open-for-the-2026-rut-grants",
        destination: "/articles/14-600-de-subventions-the-rut-mountain-runs-mise-sur-la-culture-trail-pas-le",
        permanent: true,
      },
      {
        source: "/articles/asics-malcesine-baldo-trail-2026-con-gardener-e-scaini-e-stata-una-short-trail",
        destination: "/articles/malcesine-baldo-trail-2026-double-record-1-100-coureurs-32-nations-sur-le-lac",
        permanent: true,
      },
      {
        source: "/articles/ask-the-pro-international-racing-unknowns-training-transitions-and-jacket-types",
        destination: "/articles/apres-boston-le-bighorn-100-ce-que-la-transition-route-ultra-exige-vraiment",
        permanent: true,
      },
      {
        source: "/articles/ben-dhiman-pre-2026-transvulcania-ultramarathon-interview",
        destination: "/articles/ben-dhiman-a-transvulcania-deuxieme-a-l-utmb-pere-de-jumeaux-et-un-hiver-a-24-h",
        permanent: true,
      },
      {
        source: "/articles/benoit-roux-le-responsable-des-benevoles-de-l-utmb-demissionne",
        destination: "/articles/l-utmb-perd-son-responsable-des-benevoles-benoit-roux-demissionne-fracture-de",
        permanent: true,
      },
      {
        source: "/articles/best-trail-running-shoes-of-2026",
        destination: "/articles/nike-domine-le-trail-en-2026-13-chaussures-retenues-sur-300-par-irunfar",
        permanent: true,
      },
      {
        source: "/articles/biolite-range-500-headlamp-review",
        destination: "/articles/biolite-range-500-74-grammes-et-8-minutes-de-charge-pour-les-nuits-de-trail",
        permanent: true,
      },
      {
        source: "/articles/blandine-l-hirondel-pre-2026-transvulcania-ultramarathon-interview",
        destination: "/articles/transvulcania-2026-blandine-l-hirondel-2-semaines-a-la-palma-pour-une-premiere",
        permanent: true,
      },
      {
        source: "/articles/bob-yates-completes-1-030-mile-uk-run-for-60th-birthday",
        destination: "/articles/bob-yates-1-030-miles-a-travers-le-royaume-uni-pour-feter-ses-60-ans",
        permanent: true,
      },
      {
        source: "/articles/boston-bound-the-joy-of-wesley-kiptoo-and-alex-masai",
        destination: "/articles/wesley-kiptoo-et-alex-masai-deux-kenyans-un-reve-de-boston",
        permanent: true,
      },
      {
        source: "/articles/brooks-caldera-8-review-l-ultra-confort",
        destination: "/articles/brooks-caldera-8-testee-sur-150-km-le-confort-extreme-a-t-il-un-prix-en-trail-d",
        permanent: true,
      },
      {
        source: "/articles/cocodona-250-ryan-sandes-runs-250-miles-to-rediscover-his-love-for-running-film",
        destination: "/articles/ryan-sandes-402-km-de-boue-pour-retrouver-le-feu-sacre-du-trail",
        permanent: true,
      },
      {
        source: "/articles/colmen-trail-2026-domenica-una-13-edizione-da-sold-out",
        destination: "/articles/colmen-trail-500-dossards-envoles-quand-un-trail-de-village-verrouille-sa-jauge",
        permanent: true,
      },
      {
        source: "/articles/colmen-trail-2026-la-montagna-magica-che-domina-morbegno-regala-sempre-grandi-em",
        destination: "/articles/colmen-trail-2026-gaggi-et-rota-martir-dominent-la-montagne-magique-de-morbegno",
        permanent: true,
      },
      {
        source: "/articles/comment-le-trail-alsace-by-utmb-va-montrer-l-exemple-a-nice",
        destination: "/articles/utmb-nice-perd-ses-subventions-publiques-trail-alsace-a-deja-trace-la-voie",
        permanent: true,
      },
      {
        source: "/articles/comment-recuperer-des-pieds-gonfles-apres-un-ultra-trail",
        destination: "/articles/pieds-gonfles-post-ultra-4-signaux-d-alarme-et-la-regle-des-24-premieres-heures",
        permanent: true,
      },
      {
        source: "/articles/communities-mourn-deaths-at-the-2026-marathon-des-sables-and-on-the-cape-wrath-t",
        destination: "/articles/deuil-dans-le-monde-du-trail-deux-coureurs-emportes-sur-le-marathon-des-sables-e",
        permanent: true,
      },
      {
        source: "/articles/controle-d-acces-aux-sentiers-une-carte-de-trail-obligatoire-des-le-1er-juin",
        destination: "/articles/carte-de-trail-obligatoire-en-2026-la-liberte-sur-les-sentiers-bientot",
        permanent: true,
      },
      {
        source: "/articles/courtney-dauwalter-salomon-continue-their-partnership-until-2029",
        destination: "/articles/courtney-dauwalter-et-salomon-un-mariage-prolonge-jusqu-en-2029",
        permanent: true,
      },
      {
        source: "/articles/discovering-a-new-place-through-running",
        destination: "/articles/courir-pour-apprivoiser-une-ville-ce-que-30-ans-de-trail-nomade-enseignent",
        permanent: true,
      },
      {
        source: "/articles/domani-il-portogallo-ospita-il-mondo-la-world-cup-2026-inizia-con-la-sao-bras-cr",
        destination: "/articles/coup-d-envoi-au-portugal-la-coupe-du-monde-de-course-en-montagne-2026-s-ouvre-av",
        permanent: true,
      },
      {
        source: "/articles/ecologie-de-facade-l-utmb-rend-obligatoire-l-utilisation-du-mode-lumiere-rouge-s",
        destination: "/articles/lampe-rouge-obligatoire-a-l-utmb-symbole-ecologique-ou-poudre-aux-yeux",
        permanent: true,
      },
      {
        source: "/articles/elhousine-elazzaoui-puls-media",
        destination: "/articles/elazzaoui-1-000-1-000-aux-golden-trail-world-series-une-domination-historique",
        permanent: true,
      },
      {
        source: "/articles/emelie-forsberg-pre-2026-transvulcania-ultramarathon-interview",
        destination: "/articles/emelie-forsberg-a-transvulcania-11-ans-d-absence-4-semaines-d-entrainement-un",
        permanent: true,
      },
      {
        source: "/articles/enceinte-de-quatre-mois-camille-bruyas-termine-huitieme-d-un-trail-de-56-km",
        destination: "/articles/enceinte-de-4-mois-camille-bruyas-finit-8e-sur-56-km-a-madere",
        permanent: true,
      },
      {
        source: "/articles/every-line-tells-a-story-due-giorni-nel-mondo-scott-running-in-val-di-sole",
        destination: "/articles/scott-running-fete-ses-20-ans-ce-que-revele-une-operation-de-presse-en-val-di-so",
        permanent: true,
      },
      {
        source: "/articles/everybody-loves-a-homecoming-race",
        destination: "/articles/29-fois-le-meme-50k-ces-courses-ultra-qui-creent-des-fideles-a-vie",
        permanent: true,
      },
      {
        source: "/articles/from-exception-to-expecting-embracing-pregnancy-and-motherhood-in-competitive",
        destination: "/articles/enceinte-et-sous-contrat-salomon-grayson-murphy-reecrit-les-regles-du-trail",
        permanent: true,
      },
      {
        source: "/articles/gazzaniga-capitale-del-mountain-running-caccia-alla-maglia-azzurra-al-4",
        destination: "/articles/gazzaniga-joue-gros-9-km-et-1000-m-d-pour-decrocher-la-maglia-azzurra-a-kamnik",
        permanent: true,
      },
      {
        source: "/articles/grossesse-enceinte-de-4-mois-camille-bruyas-termine-huitieme-d-un-trail-de-56-km",
        destination: "/articles/8e-d-un-56-km-enceinte-de-4-mois-camille-bruyas-et-le-trail-face-a-la-grossesse",
        permanent: true,
      },
      {
        source: "/articles/he-fell-200-feet-during-a-trail-running-race-and-lived-to-tell-the-tale",
        destination: "/articles/stuart-terrill-60-metres-de-chute-quand-le-mountain-running-bascule-dans-le-spor",
        permanent: true,
      },
      {
        source: "/articles/human-half-marathon-world-record-zapped-by-humanoid-robot-at-the-2026-beijing-e-",
        destination: "/articles/pekin-2026-quand-un-robot-pulverise-le-record-du-monde-du-semi-marathon",
        permanent: true,
      },
      {
        source: "/articles/idee-d-enchainement-trail-cotes-montees-marche-rapide",
        destination: "/articles/cotes-montees-marche-rapide-l-equation-oubliee-du-trail-de-30-km",
        permanent: true,
      },
      {
        source: "/articles/interview-de-julien-chorier-directeur-sportif-de-l-utmb-faut-il-autoriser-les-pa",
        destination: "/articles/julien-chorier-ouvrir-les-pacers-a-tous-denaturerait-l-utmb",
        permanent: true,
      },
      {
        source: "/articles/jim-walmsley-notre-coureur-prefere-sera-bien-au-depart-de-la-western-states",
        destination: "/articles/western-states-100-jim-walmsley-annonce-son-retour-sur-161-km-de-sierra-nevada",
        permanent: true,
      },
      {
        source: "/articles/john-cappis-remembering-a-hardrock-and-western-states-pioneer",
        destination: "/articles/mort-de-john-cappis-le-pionnier-qui-a-faconne-hardrock-100-et-western-states",
        permanent: true,
      },
      {
        source: "/articles/k2-valtellina-extreme-vertical-race-iscrizioni-aperte-per-la-1-tappa-di-va",
        destination: "/articles/k2-valtellina-2026-2-000-m-de-d-en-9-km-et-un-circuit-vk-qui-change-la-donne",
        permanent: true,
      },
      {
        source: "/articles/kilian-jornet-quand-son-message-ecolo-sur-l-utmb-vire-au-placement-de-produit",
        destination: "/articles/kilian-jornet-nnormal-et-l-utmb-quand-l-ecologie-devient-un-argument-commercial",
        permanent: true,
      },
      {
        source: "/articles/kim-collison-wins-the-men-s-montane-winter-spine-race",
        destination: "/articles/kim-collison-roi-de-la-spine-race-la-redemption-au-bout-de-82-heures",
        permanent: true,
      },
      {
        source: "/articles/l-effet-fomo-explique-pourquoi-les-courses-sur-route-et-les-trails-sont-pris-d",
        destination: "/articles/utmb-marathon-de-paris-pourquoi-le-fomo-vide-les-inscriptions-en-quelques",
        permanent: true,
      },
      {
        source: "/articles/la-reunion-l-ultra-terrestre-menace-la-diagonale-des-fous",
        destination: "/articles/l-ultra-terrestre-utoi-menace-t-il-vraiment-la-diagonale-des-fous",
        permanent: true,
      },
      {
        source: "/articles/le-principe-de-cette-course-etait-original",
        destination: "/articles/les-heures-barbares-quand-le-trail-s-invite-sur-un-circuit-de-moto-cross",
        permanent: true,
      },
      {
        source: "/articles/les-4-seances-cles-pour-preparer-un-trail-a-fort-denivele",
        destination: "/articles/2-500-m-d-en-35-km-4-seances-pour-ne-pas-s-effondrer-apres-le-premier-col",
        permanent: true,
      },
      {
        source: "/articles/live-transvulcania-comment-suivre-le-trail-en-direct-depuis-la-france",
        destination: "/articles/transvulcania-2026-detienne-et-l-hirondel-defient-le-volcan-de-la-palma",
        permanent: true,
      },
      {
        source: "/articles/michel-poletti-le-projet-du-createur-de-l-utmb-nous-fait-penser-a-un-ultra-trail",
        destination: "/articles/a-71-ans-michel-poletti-traverse-la-france-a-pied-entre-ses-courses-utmb",
        permanent: true,
      },
      {
        source: "/articles/montres-gps-qui-sont-ces-irreductibles-traileurs-qui-refusent-les-ecrans-amoled",
        destination: "/articles/pourquoi-les-ultratraileurs-boudent-l-ecran-amoled-sur-leur-montre-gps",
        permanent: true,
      },
      {
        source: "/articles/mountain-classic-verso-il-tricolore-di-revello",
        destination: "/articles/njeru-triple-championne-du-monde-joue-les-titres-italiens-de-mountain-classic-a",
        permanent: true,
      },
      {
        source: "/articles/nike-acg-pegasus-trail-review",
        destination: "/articles/nike-acg-pegasus-trail-de-l-entraineur-quotidien-a-la-chaussure-de-50-km",
        permanent: true,
      },
      {
        source: "/articles/para-athlete-alexis-trougnou-sets-mount-kilimanjaro-fkt-helps-pave-way-for-para-",
        destination: "/articles/kilimandjaro-alexis-trougnou-signe-le-premier-fkt-para-athlete-sur-le-toit-de-l-",
        permanent: true,
      },
      {
        source: "/articles/pourquoi-le-fkt-de-clemquicourt-en-coree-ne-sera-pas-homologue",
        destination: "/articles/baekdu-daegan-le-fkt-de-clemquicourt-bloque-par-les-regles-d-homologation",
        permanent: true,
      },
      {
        source: "/articles/pourquoi-quand-l-utmb-dit-que-le-ventoux-n-est-pas-loin-de-nice-c-est",
        destination: "/articles/le-ventoux-pas-loin-de-nice-selon-l-utmb-215-km-de-geographie-elastique",
        permanent: true,
      },
      {
        source: "/articles/premier-run-communautaire-puls-a-annecy-good-vibes",
        destination: "/articles/nuit-sur-le-mont-veyrier-puls-lance-ses-runs-communautaires-et-teste-rossignol",
        permanent: true,
      },
      {
        source: "/articles/quel-renforcement-musculaire-faut-il-faire-pour-preparer-un-trail-long",
        destination: "/articles/trail-long-sans-gros-d-pourquoi-vos-muscles-lachent-avant-le-finish",
        permanent: true,
      },
      {
        source: "/articles/salomon-xt-6-review-by-mayayo-the-great-classic-now-a-sneaker-for-2026",
        destination: "/articles/salomon-xt-6-2026-quand-la-legende-du-trail-devient-sneaker-unisexe",
        permanent: true,
      },
      {
        source: "/articles/saucony-entre-dans-une-nouvelle-ere",
        destination: "/articles/saucony-joue-la-carte-culturelle-a-paris-avec-sottsass-et-deux-pop-ups",
        permanent: true,
      },
      {
        source: "/articles/scott-presenta-il-running-team-2026-tra-conferme-e-nuove-promesse",
        destination: "/articles/scott-running-team-2026-la-releve-frappe-a-la-porte",
        permanent: true,
      },
      {
        source: "/articles/skimo-olympics-all-set-for-olympic-debut-at-cortina-20226-spain-s-prospects-and-",
        destination: "/articles/ski-alpinisme-aux-jo-cortina-2026-le-grand-saut-olympique-et-les-espoirs-espagno",
        permanent: true,
      },
      {
        source: "/articles/skyrace-des-matheysins-l-un-des-trails-les-plus-spectaculaires-de-france",
        destination: "/articles/skyrace-des-matheysins-le-week-end-de-trail-alpin-du-1er-mai-qui-ne-ressemble-a",
        permanent: true,
      },
      {
        source: "/articles/steady-love",
        destination: "/articles/steady-love-ce-que-zach-miller-retiendra-vraiment-de-sa-vie-de-coureur",
        permanent: true,
      },
      {
        source: "/articles/the-200-mile-phenomenon-a-data-based-look-at-their-growth-and-demographics",
        destination: "/articles/qui-court-vraiment-les-200-miles-de-trail-95-heures-40-ans-et-des-milliers-d",
        permanent: true,
      },
      {
        source: "/articles/the-seven-wonders-of-the-trail-running-world",
        destination: "/articles/les-sept-merveilles-du-trail-mondial-l-ultime-bucket-list",
        permanent: true,
      },
      {
        source: "/articles/this-is-running-a-review-of-raziq-rauf-s-book-celebrating-the-culture-history",
        destination: "/articles/le-livre-qui-archive-70-ans-de-running-mondial-au-moment-ou-le-sport-se",
        permanent: true,
      },
      {
        source: "/articles/this-week-in-running-april-20-2026",
        destination: "/articles/this-week-in-running-le-tour-du-monde-du-trail-20-avril-2026",
        permanent: true,
      },
      {
        source: "/articles/this-week-in-running-april-27-2026",
        destination: "/articles/canyons-100k-2026-peterman-brady-et-le-drame-des-golden-tickets-vers-western",
        permanent: true,
      },
      {
        source: "/articles/this-week-in-running-may-4-2026",
        destination: "/articles/tranchand-maitre-aux-matheysins-innsbruck-gache-son-trail-hunt-a-30-000",
        permanent: true,
      },
      {
        source: "/articles/this-weekend-in-ultrarunning-july-5-7-2025-uk-ireland",
        destination: "/articles/11-ultras-simultanes-170-miles-en-ecosse-le-week-end-qui-resume-le-trail",
        permanent: true,
      },
      {
        source: "/articles/this-weekend-june-20th-2025",
        destination: "/articles/39e-west-highland-way-pourquoi-le-royaume-uni-est-devenu-la-nation-de-l-ultra",
        permanent: true,
      },
      {
        source: "/articles/trail-connaissez-vous-la-phase-dite-de-fraicheur-dans-un-plan-d-entrainement",
        destination: "/articles/phase-de-fraicheur-avant-l-utmb-l-etape-finale-que-trop-de-coureurs-baclent",
        permanent: true,
      },
      {
        source: "/articles/utmb-2026-baptiste-chassagne-veut-gagner-il-assume-sans-ambition",
        destination: "/articles/baptiste-chassagne-vise-la-victoire-a-l-utmb-2026-le-vainqueur-de-la-diagonale",
        permanent: true,
      },
      {
        source: "/articles/utmb-index-pourquoi-votre-score-a-baisse-alors-que-vous-n-y-etes-pour-rien",
        destination: "/articles/utmb-index-en-baisse-pourquoi-votre-score-a-chute-sans-que-vous-ayez-couru",
        permanent: true,
      },
      {
        source: "/articles/want-to-break-an-ultrarunning-champion-send-her-to-bhutan",
        destination: "/articles/bhoutan-la-course-qui-a-brise-clare-gallagher",
        permanent: true,
      },
      {
        source: "/articles/weekend-race-results-23-6-25",
        destination: "/articles/week-end-d-ultra-au-royaume-uni-les-pennines-exmoor-et-les-highlands-dictent-leu",
        permanent: true,
      },
      {
        source: "/articles/why-cats-make-the-purr-fect-companions-for-runners",
        destination: "/articles/le-chat-compagnon-insoupconne-du-traileur",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "cdn.trailrunnermag.com" },
      { protocol: "https", hostname: "s3.amazonaws.com" },
      { protocol: "https", hostname: "ultrarunningworld.co.uk" },
      { protocol: "https", hostname: "www.corsainmontagna.it" },
      { protocol: "https", hostname: "www.ultrarunnermagazine.co.uk" },
      { protocol: "https", hostname: "www.irunfar.com" },
      { protocol: "https", hostname: "passiontrail.fr" },
      { protocol: "https", hostname: "www.lepape-info.com" },
      { protocol: "https", hostname: "www2.u-trail.com" },
      { protocol: "https", hostname: "runactu.com" },
      { protocol: "https", hostname: "ultrarunning.com" },
      { protocol: "https", hostname: "trailrunningspain.com" },
      { protocol: "https", hostname: "www.discoveryalps.it" },
      { protocol: "https", hostname: "marathonhandbook.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      // Ajout 2026-05-12 : domaines découverts dans le corpus, sinon Next.js
      // Image bloque l'image et affiche une vignette vide sur la home/sidebar.
      { protocol: "https", hostname: "summarymp3.136.112.225.207.sslip.io" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "zof.endurance-store.fr" },
      { protocol: "https", hostname: "track.effiliation.com" },
    ],
  },
};

export default nextConfig;
