# Contributing

Thanks for your interest! Ciné‑Envie is a small personal project, but ideas and fixes are welcome.

## How to
1. Open an issue (bug or idea) before a large change.
2. Fork, create a branch, then run the app locally:
   ```
   python3 -m http.server 8000
   ```
3. Run the tests before opening a pull request:
   ```
   npm test
   ```

## Project principles
- **No dependencies, no build step for the app**: plain HTML, CSS and native JavaScript modules. npm packages are only used for tooling (screenshots).
- **Nothing server-side**: the TMDB key and the lists stay in the user's browser.
- **English in the code**: comments, identifiers, commit messages and docs are written in English. User-facing text lives in `js/i18n.js` and must exist in all 7 languages.
- **Legal**: only official streaming offers are shown.

Never commit an API key or an export of personal lists.
