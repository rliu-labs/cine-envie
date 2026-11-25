# Contribuer

Merci de ton intérêt ! Ciné‑Envie est un petit projet perso, mais les idées et corrections sont bienvenues.

## En pratique
1. Ouvre un ticket (bug ou idée) avant un gros changement.
2. Forke, crée une branche, puis lance l'appli en local :
   ```
   python3 -m http.server 8000
   ```
3. Lance les tests avant d'ouvrir une pull request :
   ```
   npm test
   ```

## Principes du projet
- **Zéro dépendance, zéro build** : du HTML, du CSS et des modules JavaScript natifs.
- **Rien côté serveur** : la clé TMDB et les listes restent dans le navigateur de l'utilisateur.
- **En français** : interface, messages et commentaires.
- **Légal** : on n'indique que des offres de streaming officielles.

Ne committe jamais de clé API ni d'export de listes personnelles.
