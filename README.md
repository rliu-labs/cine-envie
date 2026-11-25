<p align="center">
  <img src="docs/banner.svg" alt="Ciné‑Envie : dis ce que tu as envie de regarder, l'appli trouve le film ou la série" width="100%">
</p>

<p align="center">
  <a href="https://rliu-labs.github.io/cine-envie/"><b>▶ Essayer l'appli</b></a>
  ·
  <a href="#fonctionnalités">Fonctionnalités</a>
  ·
  <a href="#comment-ça-marche">Comment ça marche</a>
  ·
  <a href="#sécurité-et-vie-privée">Sécurité</a>
  ·
  <a href="#lancer-en-local">Lancer en local</a>
</p>

<p align="center">
  <a href="https://rliu-labs.github.io/cine-envie/"><img alt="Démo en ligne" src="https://img.shields.io/badge/démo-en_ligne-e5484d?style=flat-square"></a>
  <a href="https://github.com/rliu-labs/cine-envie/actions/workflows/tests.yml"><img alt="Tests" src="https://img.shields.io/github/actions/workflow/status/rliu-labs/cine-envie/tests.yml?branch=main&label=tests&style=flat-square"></a>
  <img alt="PWA" src="https://img.shields.io/badge/PWA-installable-5a0fc8?style=flat-square">
  <img alt="Zéro dépendance" src="https://img.shields.io/badge/dépendances-0-3fb67d?style=flat-square">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-modules_natifs-f7df1e?style=flat-square&logo=javascript&logoColor=black">
  <a href="LICENSE"><img alt="Licence MIT" src="https://img.shields.io/badge/licence-MIT-blue?style=flat-square"></a>
</p>

---

**Ciné‑Envie** répond à la question de tous les soirs : *« on regarde quoi ? »*.
Tu écris ton envie comme tu la dirais à un ami, **en français ou en anglais**, et l'appli propose des films et séries qui collent, avec **où les regarder légalement dans ton pays** (31 pays européens).

> « soirée cosy, drôle avec de l'intrigue comme À couteaux tirés »
> → humeurs *cosy, drôle, intrigue* · pas d'horreur ni de thriller · proche de *À couteaux tirés*

C'est une application web installable (PWA), sans serveur, sans compte, sans dépendance : du HTML, du CSS et du JavaScript natif.

<p align="center">
  <img src="docs/accueil.png" alt="Écran d'accueil de Ciné‑Envie" width="760">
</p>

## Fonctionnalités

| | |
|---|---|
| 💬 **Envie** | Recherche en langage naturel, langage familier compris : humeurs, genres à éviter, film ou série, récent / court / classique, titre de référence (« comme Dark », « like Dark »). |
| 🌍 **Bilingue** | Interface et recherche en français ou en anglais ; la langue du navigateur est détectée, et modifiable dans les réglages. |
| 📺 **Films et séries** | Recherche, thématiques, tendances, notes et recommandations couvrent films et séries. Sur la page de recherche, un clic choisit **Films**, **Séries** ou **Les deux**. |
| 🍿 **Mes plateformes** | Directement sur la page de recherche, choisis une ou plusieurs plateformes (Netflix, Prime Video, Disney+, Canal+…, selon ton pays) ou « Toutes » : les résultats se limitent à ce que tu peux regarder, et tes plateformes sont mises en avant dans chaque fiche. |
| 📍 **Ton pays** | Choix du pays de résidence parmi 31 pays européens, directement depuis la fiche : les plateformes affichées sont celles disponibles chez toi. |
| 🔥 **Tendances** | Films et séries tendance de la semaine, avec un badge **Nouveau** sur ce qui est apparu depuis ta dernière visite. |
| 🎭 **Thématiques** | Parcours par genre, par popularité ou par note. |
| 🎬 **Fiche** | Résumé, réalisateur, casting, bande‑annonce et plateformes légales du pays choisi (abonnement, gratuit, location, achat). |
| ⭐ **Profil de goûts** | Note les titres vus de 1 à 5 étoiles : l'appli en déduit les genres que tu aimes ou évites, ajuste le classement de chaque recherche et propose une sélection « Recommandé pour toi ». |
| 📋 **Mes listes** | « À voir » et « Vus », stockés dans le navigateur, avec export / import JSON pour changer d'appareil. |
| 📱 **Installable** | Sur ordinateur (Chrome, Edge), Android et iPhone ; l'interface reste disponible hors ligne. |

## Comment ça marche

Le cœur de l'appli est [`js/mood.js`](js/mood.js) : un petit analyseur de langage naturel bilingue, sans service externe, qui transforme une phrase en critères de recherche.

```mermaid
flowchart LR
  A["Phrase de l'utilisateur"] --> B["mood.js<br/>analyse de l'envie"]
  B --> C["Genres voulus<br/>et exclus"]
  B --> D["Film / série<br/>récent, court, classique"]
  B --> E["Titre de référence"]
  C & D --> F["TMDB /discover"]
  E --> G["TMDB /search<br/>puis /recommendations"]
  F & G --> H["Score et classement"]
  H --> I["Résultats + plateformes FR"]
```

Exemples réels de sortie de l'analyseur :

| Ce que tu écris | Humeurs | Type | Exclu | Référence |
|---|---|---|---|---|
| soirée cosy, drôle avec de l'intrigue comme À couteaux tirés | cosy, drôle, intrigue | tout | Horreur, Thriller, Guerre | À couteaux tirés |
| un film d'action récent qui ne se prend pas au sérieux | action | film · récent | | |
| une série à suspense comme Dark | intrigue | série | | Dark |
| film familial pour dimanche soir | famille | film | Horreur | |
| de la SF qui fait réfléchir comme Interstellar | SF | tout | | Interstellar |
| A cozy, funny night with some mystery, like Knives Out | cosy, drôle, intrigue | tout | Horreur, Thriller, Guerre | Knives Out |
| a classic 90s thriller | tension | tout · classique | | |
| I would like something funny | drôle | tout | | *(aucune : « like » n'est pas pris pour un titre)* |
| un truc qui fout les jetons | frissons | tout | | |
| un bon film de daron | film de daron | film | | |
| une série à binger qui me retourne le cerveau | intrigue | série | | |
| un truc chill sous la couette | cosy | tout | Horreur, Thriller, Guerre | |

Chaque résultat reçoit ensuite un score : +3 par genre voulu, −6 par genre exclu, plus la note et la popularité, et un bonus s'il vient des recommandations du titre de référence.

Le **profil de goûts** s'ajoute à ce score : chaque note donne à ses genres une affinité entre −1 (1★) et +1 (5★), moyennée et lissée pour qu'un seul film ne fasse pas la loi. Tout est calculé dans le navigateur.

## Architecture

```
├── index.html             Coquille de l'appli
├── style.css              Thème sombre, mise en page responsive
├── js/
│   ├── app.js             Vues, navigation par hash, fiche détaillée
│   ├── mood.js            Analyse de l'envie et score (pur JS, testé)
│   ├── i18n.js            Textes FR / EN, pays européens, détection langue et pays
│   ├── tmdb.js            Client API TMDB (langue et pays réglables, cache mémoire)
│   └── store.js           Stockage local : langue, pays, clé, listes, notes, veille
├── sw.js                  Service worker (interface hors ligne, cache des affiches)
├── manifest.webmanifest   Manifeste PWA
├── icons/                 Icône de l'appli, logo TMDB
├── scripts/captures.mjs   Génère les captures et le GIF du README (Playwright)
└── tests/                 Tests node:test (analyseur, profil, traductions, client TMDB)
```

**Choix techniques**
- **Zéro build, zéro dépendance** : modules ES natifs, servis tels quels par GitHub Pages.
- **Clé v3 ou jeton v4** : le client détecte le format et utilise le paramètre `api_key` ou l'en‑tête `Bearer`.
- **Service worker « réseau d'abord »** : les mises à jour arrivent tout de suite, le cache prend le relais hors ligne.

## Sécurité et vie privée

Ciné‑Envie est conçu pour ne rien savoir de toi.

| | |
|---|---|
| 🖥️ **Aucun serveur** | Site 100 % statique hébergé sur GitHub Pages, servi en HTTPS. |
| 🔑 **Ta clé reste chez toi** | La clé TMDB est stockée dans ton navigateur et envoyée uniquement à l'API TMDB. |
| 🙈 **Aucun pistage** | Pas de statistiques, de publicité, de cookies ni de service tiers. |
| 📦 **Zéro dépendance** | La page ne charge aucun paquet npm ni script externe : rien qui puisse être compromis en amont. (Les seuls paquets npm servent à générer les captures, jamais à l'appli.) |
| 🛡️ **Content Security Policy** | Le navigateur bloque tout script étranger et toute connexion hors de TMDB. |
| 🧹 **Données échappées** | Tout ce qui vient de TMDB ou d'un import est neutralisé avant affichage. |

Une faille ? Voir [SECURITY.md](SECURITY.md) pour la signaler en privé.

## Lancer en local

```bash
git clone https://github.com/rliu-labs/cine-envie.git
cd cine-envie
python3 -m http.server 8000   # ou : npm start
```

Ouvre http://localhost:8000 et colle ta clé TMDB (gratuite : themoviedb.org → Paramètres → API).

Tests :

```bash
npm test
```

Captures d'écran et GIF de démonstration, avec de vraies données (nécessite ta clé TMDB) :

```bash
npm install
npx playwright install chromium
TMDB_KEY=ta_cle npm run captures   # résultat dans docs/captures/
```

Les idées sont bienvenues : voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Crédits

<a href="https://www.themoviedb.org/"><img src="icons/tmdb.svg" alt="The Movie Database (TMDB)" height="18"></a>

Données et images de films et séries : [TMDB](https://www.themoviedb.org/).
*This product uses the TMDB API but is not endorsed or certified by TMDB.*

Disponibilités streaming : [JustWatch](https://www.justwatch.com/), via l'API TMDB.

Icône : pictogramme « clapperboard » de [Lucide](https://lucide.dev) (licence ISC, voir [icons/LICENSE-lucide.txt](icons/LICENSE-lucide.txt)).

Code sous licence [MIT](LICENSE).
