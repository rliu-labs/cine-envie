# Journal des versions

## 0.9.0 (novembre 2026)
- Espagnol : interface complète (4e choix du menu de langue et des réglages), recherche par envie en espagnol avec le registre familier, genres et fiches TMDB en espagnol.
- README principal en anglais, version française dans README.fr.md (lien pour passer de l’une à l’autre).

## 0.8.0 (novembre 2026)
- Interface complète en darija marocain (lettres latines), 3e choix du menu de langue et des réglages.
- La recherche par envie comprend le darija en « arabizi » (3, 7, 9…), ses variantes d’orthographe et les mélanges français / darija : « bghit chi film dyal d7k », « chi 7aja katkhl3 », « msalsal b7al Dark »…
- En darija, les fiches TMDB (titres, résumés) s’affichent en français.

## 0.7.0 (novembre 2026)
- Menu déroulant de langue dans l’en-tête (globe FR / EN), façon Material Design : accessible au clavier, synchronisé avec les réglages.

## 0.6.0 (novembre 2026)
- « Mes plateformes » par défaut : Netflix, Prime Video et Disney+.
- Page de recherche : un bouton par plateforme cochée dans les réglages ; « Toutes » = l'ensemble de mes plateformes ; lien « + ajouter une plateforme ».
- Les nouvelles versions de l'appli s'affichent dès le chargement suivant.

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
