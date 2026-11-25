# Journal des versions

## 0.5.0 (novembre 2026)
- Barre de filtres sur la page de recherche : Films / Séries / Les deux, et plateformes (Toutes, Netflix, Prime Video, Disney+) en multi-choix ; les autres plateformes se choisissent dans les réglages.
- Le résumé des résultats rappelle les plateformes choisies.

## 0.4.0 (novembre 2026)
- Filtre « Mes plateformes » : choix des services de streaming du pays (Netflix, Prime Video, Disney+, Canal+…), mémorisé par pays, appliqué aux recherches, thématiques et recommandations.
- Choix Films / Séries / Les deux pour la recherche par envie.
- Vocabulaire familier en français et en anglais (« qui fout les jetons », « film de daron », « à binger », « mind-bending »…).

## 0.3.0 (novembre 2026)
- Profil de goûts : note de 1 à 5 étoiles sur les titres vus, affinités par genre, classement ajusté et sélection « Recommandé pour toi ».
- Mention TMDB obligatoire (logo officiel et avertissement) et attribution JustWatch en pied de page.
- Script `npm run captures` pour générer captures et GIF avec de vraies données.

## 0.2.0 (novembre 2026)
- Recherche par envie en anglais (humeurs, type, période, « like … », « in the style of … »).
- Interface complète en français ou en anglais, choix mémorisé.
- Choix du pays de résidence parmi 31 pays européens : plateformes légales affichées selon le pays, sélecteur aussi dans la fiche.
- Tests des traductions et du client TMDB.
- Nouvelle icône basée sur le pictogramme « clapperboard » de Lucide (ISC).

## 0.1.0 (novembre 2026)
Première version publique.
- Recherche par envie en langage naturel (humeurs, exclusions, film ou série, récent / court / classique, titre de référence).
- Tendances de la semaine avec badge « Nouveau ».
- Navigation par thématique (genres, populaires, mieux notés).
- Fiche détaillée : casting, bande‑annonce, plateformes légales en France.
- Listes « à voir » / « vus » avec export / import JSON.
- PWA installable, interface utilisable hors ligne.
- Tests de l'analyse d'envie et intégration continue GitHub Actions.
- Content Security Policy, échappement renforcé et politique de sécurité (SECURITY.md).
