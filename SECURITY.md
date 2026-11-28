# Security

## Reporting a vulnerability
If you find a security issue, please **do not open a public issue**.
Use GitHub's private reporting instead: **Security** tab → **Report a vulnerability**.
I will reply as soon as possible and fix it as a priority.

## What the app protects
- **No server**: Ciné‑Envie is a static site. No data goes through a server of mine.
- **Local TMDB key**: it is stored only in the browser (`localStorage`) and sent only to `api.themoviedb.org`, over HTTPS.
- **Local lists and ratings**: "to watch", "seen", your ratings and your taste profile stay on your device; the JSON export is a file you keep.
- **No tracking**: no analytics, no ads, no cookies. The only third parties are TMDB (data and images), YouTube (trailers, privacy-enhanced mode) and, only when you use the phone-to-TV transfer, the ntfy.sh relay, which receives end-to-end encrypted data it cannot read.
- **No dependencies in the app**: the page loads no npm package or external script, so there is no supply-chain risk. Development packages (screenshot generation) are never served to users.
- **Strict Content Security Policy**: the page can only run its own scripts and can only contact the TMDB API, its image server and the ntfy.sh relay.
- **Systematic escaping** of displayed data (titles, overviews, imported files) against HTML injection.

## Good to know
- On a shared computer, clear your key in ⚙︎ Settings after use: anyone using the same browser could read it.
- Your TMDB key is free and can be revoked at any time from your themoviedb.org account.
