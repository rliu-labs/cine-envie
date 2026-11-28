# Changelog

## 0.16.0 (November 2026)
- The codebase is now fully in English: comments, identifiers, CSS class names, tests, docs and file names (`docs/home.*.png`, `.github/ISSUE_TEMPLATE/idea.md`). The interface stays available in 7 languages.
- English page addresses: `#mood`, `#trending`, `#genres`, `#lists`, `#settings`, `#person/<id>`. The old French addresses (`#envie`, `#tendances`, `#listes`, `#reglages`, `#personne/<id>`) still work and redirect to the new ones.
- Error messages (missing or rejected TMDB key, unrecognised import file) are now translated into the interface language.
- The list export file is now named `cine-envie-YYYY-MM-DD.json`.
- Submitting an empty TMDB key in the settings now clears the saved key, as the security notes advise on shared computers.
- Faster mood parsing: vocabulary patterns are compiled once instead of on every search, and duplicate words are removed. Poster grids read the lists from storage once per grid instead of once per poster.
- README: removed the "Works on every screen" section that appeared twice in every language.
- Removed unused code: unused translation strings, an unused stored timestamp, unused CSS rules and a duplicate base64 helper.

## 0.15.0 (November 2026)
- About 140 countries to choose from (Europe, Americas, Africa, Middle East, Asia, Oceania), including Canada, the United States and Morocco.
- "To watch" alerts: a banner at the top of the Mood and My lists pages tells you when a title from your list arrives on one of your services or gets a new season. Each title is checked at most once a day; you can open the title page or dismiss the alert.

## 0.14.0 (November 2026)
- Animated loading: grey posters that "breathe" replace the "Loading…" text (title pages included), with no animation when the system asks for reduced motion.
- Trailer played right in the title page (YouTube in privacy-enhanced mode), with a link to open it on YouTube; it stops when the title page is closed.
- Person pages: tapping a cast photo opens their page (photo, birth, biography, all their movies and series with their role, "Show more").

## 0.13.0 (November 2026)
- From phone to TV in one scan: the TV shows a QR code, the phone sends the TMDB key, settings and (optionally) lists, end-to-end encrypted through the public ntfy.sh relay. Also in Settings → "Move to another device".
- Title search (in addition to mood search), with suggestions while typing: presets or titles with their poster.
- Voice search (🎤 button) where the browser supports it.
- "Show more" button under every result list (mood, title, trending, genres).
- Light or dark theme (Auto follows the device).
- Cast photos on the title page.
- TV mode: presets come before the search field, so there is nothing to type.

## 0.12.0 (November 2026)
- TV mode: large display that reads from a distance (overscan-safe margins, larger posters and text, near full-screen title page) and remote-control or keyboard navigation (arrows, OK, Back) with a clearly visible focus.
- Switches on by itself on smart TVs and TV boxes (Samsung Tizen, LG webOS, Android TV / Google TV, Fire TV…), configurable in Settings → Display (Auto, Phone / computer, TV) or with `?tv=1` / `?tv=0` in the address. Nothing changes on phones and computers.

## 0.11.1 (November 2026)
- Footer: collapsible "About and legal notice" section in all 7 languages, visible even without a TMDB key (privacy, service trademarks, publisher and host).
- README: more accurate privacy note (the browser contacts TMDB, GitHub Pages and YouTube for trailers), trademark disclaimer and legal notice in all 7 languages.

## 0.11.0 (November 2026)
- German, Italian and Portuguese: full interface, mood search including slang (and German compound words such as "Actionfilm"), genres and TMDB title pages in each language.
- More reliable reference titles when they contain "et / con / e" ("Cena con delitto", "Fast and Furious").
- README, banner and home screenshot in all 7 languages.

## 0.10.0 (November 2026)
- English becomes the default language for new users (an already saved choice is kept).
- Language menu and settings: English first, then Darija, Español, Français in alphabetical order.

## 0.9.0 (November 2026)
- Spanish: full interface (4th choice in the language menu and settings), mood search in Spanish including slang, genres and TMDB title pages in Spanish.
- README in 4 languages: English (main), French, Spanish and Darija, with a selector at the top of each version; banner and home screenshot in each language.

## 0.8.0 (November 2026)
- Full interface in Moroccan Darija (Latin script), 3rd choice in the language menu and settings.
- Mood search understands Darija written in "Arabizi" (3, 7, 9…), its spelling variants and French / Darija mixes: "bghit chi film dyal d7k", "chi 7aja katkhl3", "msalsal b7al Dark"…
- In Darija, TMDB title pages (titles, overviews) are shown in French.

## 0.7.0 (November 2026)
- Language dropdown in the header (FR / EN globe), Material Design style: keyboard accessible and in sync with the settings.

## 0.6.0 (November 2026)
- Default "My services": Netflix, Prime Video and Disney+.
- Search page: one button per service ticked in the settings; "All" = all my services; "+ add a service" link.
- New versions of the app show up on the next load.

## 0.5.0 (November 2026)
- Filter bar on the search page: Movies / Series / Both, and services (All, Netflix, Prime Video, Disney+) as multiple choice; other services are picked in the settings.
- The results summary reminds you of the chosen services.

## 0.4.0 (November 2026)
- "My services" filter: pick the country's streaming services (Netflix, Prime Video, Disney+, Canal+…), stored per country, applied to searches, genres and recommendations.
- Movies / Series / Both choice for the mood search.
- French and English slang ("qui fout les jetons", "film de daron", "à binger", "mind-bending"…).

## 0.3.0 (November 2026)
- Taste profile: 1 to 5 star ratings on seen titles, per-genre affinities, adjusted ranking and a "Recommended for you" selection.
- Mandatory TMDB attribution (official logo and disclaimer) and JustWatch credit in the footer.
- `npm run captures` script to generate screenshots and a GIF with real data.

## 0.2.0 (November 2026)
- Mood search in English (moods, type, period, "like …", "in the style of …").
- Full interface in French or English, choice remembered.
- Country of residence among 31 European countries: legal services shown for that country, with a selector on the title page too.
- Tests for translations and the TMDB client.
- New icon based on Lucide's "clapperboard" pictogram (ISC).

## 0.1.0 (November 2026)
First public release.
- Natural-language mood search (moods, exclusions, movie or series, recent / short / classic, reference title).
- This week's trending titles with a "New" badge.
- Browse by genre (popular, top rated).
- Title page: cast, trailer, legal streaming services in France.
- "To watch" / "Seen" lists with JSON export / import.
- Installable PWA, interface usable offline.
- Mood parser tests and GitHub Actions continuous integration.
- Content Security Policy, stronger escaping and a security policy (SECURITY.md).
