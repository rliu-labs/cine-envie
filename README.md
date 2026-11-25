# Ciné‑Envie : prototype

**En ligne : https://rliu-labs.github.io/cine-envie/** (coller sa clé TMDB dans ⚙︎ Réglages au premier lancement ; elle reste dans le navigateur).

Appli web perso (PWA) pour trouver quoi regarder selon l'envie du moment, suivre les tendances et tenir sa liste « à voir / vus ».

## Ce que fait le prototype
- **Envie** : on écrit en français ce qu'on veut (« soirée cosy, drôle avec de l'intrigue comme À couteaux tirés ») ; l'appli en déduit les genres, les exclusions (pas d'horreur pour du cosy), film ou série, récent / classique / court, et un titre de référence, puis classe les idées.
- **Tendances** : films et séries tendance de la semaine (TMDB), avec un badge « Nouveau » sur ce qui est apparu depuis la dernière visite.
- **Thématiques** : parcourir par genre, populaires ou mieux notés.
- **Fiche** : résumé, réalisateur, casting, bande‑annonce, et **où le regarder légalement en France** (abonnement, gratuit, location, achat).
- **Mes listes** : à voir / vus, stockées dans le navigateur, export/import JSON pour passer d'un appareil à l'autre.
- **Installable** : ordinateur (Chrome/Edge), Android, iPhone (Safari → « Sur l'écran d'accueil »), interface lisible sur grand écran.

## Lancer en local
```
python3 -m http.server 8000
```
Puis ouvrir http://localhost:8000 et coller sa clé TMDB (gratuite : themoviedb.org → Paramètres → API).

## Mise en ligne
Le site est publié par GitHub Pages depuis la branche `main`, dossier racine. Chaque push sur `main` met le site à jour en une ou deux minutes. Après une mise à jour, recharger la page (le service worker sert le réseau d'abord).

## Structure
- `index.html`, `style.css` : interface
- `js/app.js` : vues et navigation
- `js/mood.js` : analyse de l'envie en langage naturel et score des résultats
- `js/tmdb.js` : client API TMDB (fr-FR, région FR)
- `js/store.js` : stockage local (clé, listes, veille)
- `sw.js`, `manifest.webmanifest`, `icons/` : PWA

Données : TMDB (ce produit utilise l'API TMDB sans être approuvé par TMDB) ; disponibilités streaming via JustWatch.
