# Backlog — Altitude Trail

Liste vivante des optimisations et évolutions à mettre en place plus tard.
Un item est "ready" quand il a tous les inputs nécessaires pour être codé.

---

## 🟡 En attente d'inputs

### Densifier le calendrier des événements chauds

**Contexte.** Le calendrier `scripts/lib/hot-events-calendar.mjs` contient
aujourd'hui 15 courses majeures mondiales qui déclenchent le "mode boost" de
la veille (cap 10 articles/jour, Tavily 4 runs/jour, badge LIVE sur les
articles). L'ajout de 10-15 courses supplémentaires étend la couverture live
sur ~10-12 semaines/an (vs 5-6 aujourd'hui), améliore le SEO longue traîne
("résultats [course] 2026") et différencie éditorialement Altitude Trail
face aux médias français concurrents.

**Plafond recommandé.** Ne pas dépasser 20-25 événements annuels pour éviter
la dilution du badge LIVE et le risque de content farm perçu par Google.

**Répartition cible** des ajouts :
- 60 % France / Europe francophone (base audience)
- 30 % international reconnu (trafic anglophone)
- 10 % exotique / iconique (Barkley, Moab 240, etc.)

**Courses suggérées** (à valider ou modifier par Yann) :

France :
- Ecotrail Paris (mars)
- MaXi-Race Annecy (mai)
- Grand Raid des Pyrénées (août)
- Les Templiers (octobre)
- SaintéLyon (décembre)
- Trail 6000D à La Plagne (juillet)
- UTVO Vallée d'Ossau

International :
- Leadville 100 (Colorado, août)
- Bighorn Trail 100 (Wyoming, juin)
- Ultra-Trail Australia (mai)
- JFK 50 Mile (Maryland, novembre)
- Istria 100 (Croatie, avril)
- Penyagolosa Trails (Espagne, avril)
- Trofeo Kima (Italie, août)
- Leadville, Barkley Marathons, Moab 240, Spartathlon

**Format d'input attendu** (Yann fournit la liste) :

```
Nom course | Ville, Pays | Date début 2026 | Site officiel
Ecotrail Paris | Paris, France | 2026-03-14 | www.ecotrailparis.com
SaintéLyon | Lyon, France | 2026-12-06 | www.saintelyon.com
```

**Ce qui est à coder** quand on a les inputs :
1. Étendre le tableau `HOT_EVENTS` dans `scripts/lib/hot-events-calendar.mjs`
   avec une entrée par course, incluant slug, name, start (ISO), location,
   queries (2-3 Tavily optimisées avec noms exacts), tags.
2. Whitelister les sites officiels supplémentaires dans
   `scripts/lib/authority-domains.mjs` ou directement dans les
   `include_domains` de chaque événement.
3. Relire la logique `isInHotEventWindow` si plusieurs événements se
   chevauchent : aujourd'hui c'est "premier trouvé gagne", ok pour 25
   événements mais à revoir si 50+.

**Temps estimé** : 15-20 min une fois la liste reçue.

---

## 💡 Idées en vrac (pas encore priorisées)

- **Page agrégée par événement** : `/live/utmb-2026`, `/live/western-states-2026`
  qui regroupe tous les articles taggés `hotEventSlug: "utmb"`. Bon pour SEO.
- **Coaching premium adaptatif** : version payante du moteur d'entraînement
  où Claude adapte le plan chaque semaine selon les séances réellement
  effectuées (saisie manuelle ou Strava API). Chantier produit majeur.
- **Cookie consent banner RGPD** : actuellement GA + Resend posent des
  cookies sans bannière. Risque CNIL faible mais réel. 2h de code.
- **Newsletter digest automatique** : envoyer chaque vendredi un digest
  des 5 articles de la semaine aux inscrits (utilise Resend + query
  Supabase `users WHERE consent_newsletter = true`).
- **Stats admin** : page `/admin` protégée par mot de passe avec KPIs
  (nb inscriptions/jour, articles publiés/mois, plans générés, sources
  RSS qui performent, etc.).
- **Backfill YouTube sur articles existants** : relancer `npm run
  backfill-seo` une fois `YOUTUBE_API_DATA` dans `.env.local`.
- **Pillar page n°2** : "Guide complet premier ultra-trail" (le suivant
  après UTMB, gros potentiel SEO).
- **Rebalance auteurs** du corpus existant pour appliquer la règle 80/20
  rétroactivement (Yann < 25 % du catalogue).
