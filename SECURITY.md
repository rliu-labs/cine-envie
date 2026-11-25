# Sécurité

## Signaler une faille
Si tu trouves un problème de sécurité, merci de **ne pas ouvrir de ticket public**.
Utilise plutôt le signalement privé de GitHub : onglet **Security** → **Report a vulnerability**.
Je réponds dès que possible et je corrige en priorité.

## Ce que l'appli protège
- **Pas de serveur** : Ciné‑Envie est un site statique. Aucune donnée ne transite par un serveur à moi.
- **Clé TMDB locale** : elle est enregistrée uniquement dans le navigateur (`localStorage`) et n'est envoyée qu'à `api.themoviedb.org`, en HTTPS.
- **Listes locales** : « à voir » et « vus » restent sur ton appareil ; l'export JSON est un fichier que tu gardes.
- **Aucun pistage** : pas de statistiques, pas de publicité, pas de cookies, pas de service tiers en dehors de TMDB.
- **Zéro dépendance** : aucun paquet npm ni script externe chargé, donc pas de risque lié à la chaîne d'approvisionnement.
- **Content Security Policy stricte** : la page ne peut exécuter que ses propres scripts et ne peut contacter que l'API TMDB et son serveur d'images.
- **Échappement systématique** des données affichées (titres, résumés, fichiers importés) contre les injections HTML.

## Bon à savoir
- Sur un ordinateur partagé, efface ta clé dans ⚙︎ Réglages après usage : n'importe qui utilisant le même navigateur pourrait la lire.
- Ta clé TMDB est gratuite et révocable à tout moment depuis ton compte themoviedb.org.
