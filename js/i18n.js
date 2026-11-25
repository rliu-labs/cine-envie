// Langue de l'interface (fr / en) et pays de résidence pour les plateformes de streaming.

// Pays européens proposés (codes ISO 3166-1 utilisés par TMDB / JustWatch).
export const COUNTRIES = ['AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU',
  'IE', 'IS', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];

const STR = {
  fr: {
    nav: ['Envie', 'Tendances', 'Thématiques', 'Mes listes'],
    welcome: 'Bienvenue 👋',
    welcomeText: 'L\'appli utilise la base gratuite <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a> pour les tendances, les genres et les plateformes de streaming.',
    step1: 'Crée un compte gratuit sur <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org</a>.',
    step2: 'Va dans <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">Paramètres → API</a> et demande une clé (usage personnel).',
    step3: 'Colle la « Clé d\'API » ou le « Jeton d\'accès en lecture » ci‑dessous.',
    keyPh: 'Clé API TMDB', save: 'Enregistrer', checking: 'Vérification…', keyOk: 'Clé valide ✔',
    loading: 'Chargement…', empty: 'Rien trouvé pour l\'instant.',
    isNew: 'Nouveau', seen: 'Vu', toWatch: 'À voir', movie: 'Film', tv: 'Série',
    ask: 'Tu as envie de quoi ce soir ?',
    askPh: 'ex. soirée cosy, drôle, avec de l\'intrigue, comme À couteaux tirés',
    find: 'Trouver', searching: 'Je cherche des idées…',
    presets: [
      'Soirée cosy, drôle avec de l\'intrigue', 'Un film d\'action récent qui ne se prend pas au sérieux',
      'Une série à suspense comme Dark', 'Un truc qui fait peur mais pas trop gore', 'Film familial pour dimanche soir',
      'Une comédie romantique feel good', 'De la SF qui fait réfléchir comme Interstellar', 'Un braquage malin dans le style de Ocean\'s Eleven',
    ],
    closeTo: (t) => `Proche de ${t}`, fits: (m) => `Colle à : ${m}`, popular: 'Populaire en ce moment',
    understood: 'J\'ai compris :', nothing: 'pas de critère précis, voici les incontournables du moment',
    mood: 'humeur :', near: 'proche de', notFound: (t) => `titre « ${t} » introuvable`,
    only: (k) => `<b>${k === 'tv' ? 'séries' : 'films'}</b> uniquement`, recent: 'récents', classic: 'classiques', short: 'courts',
    trends: 'Tendances de la semaine', all: 'Tout', movies: 'Films', series: 'Séries',
    newSince: (n) => `${n} nouveauté${n > 1 ? 's' : ''} depuis ta dernière visite.`,
    byTheme: 'Par thématique', popularS: 'Populaires', topRated: 'Mieux notés',
    library: 'Ma cinémathèque', seenP: 'Vus',
    settings: 'Réglages', lang: 'Langue', country: 'Pays de résidence',
    countryHint: 'Sert à afficher les plateformes légales disponibles chez toi.',
    tmdbKey: 'Clé TMDB', backup: 'Sauvegarde de mes listes',
    backupHint: 'Tes listes sont stockées dans ce navigateur. Exporte-les pour les transférer sur un autre appareil.',
    exp: 'Exporter (.json)', imp: 'Importer', imported: (n) => `${n} titres importés ✔`,
    install: 'Installer l\'appli',
    installHint: 'Sur Chrome/Edge (Windows, Mac, Android) : menu ⋮ → « Installer l\'application ». Sur iPhone (Safari) : Partager → « Sur l\'écran d\'accueil ».',
    credits: 'Données fournies par TMDB. Ce produit utilise l\'API TMDB mais n\'est ni approuvé ni certifié par TMDB. Disponibilités streaming : JustWatch via TMDB.',
    close: 'Fermer', seasons: (n) => `${n} saison${n > 1 ? 's' : ''}`, noOverview: 'Pas de résumé disponible.',
    by: 'De', with: 'avec', inList: '✔ Dans ma liste', addList: '+ À voir', isSeen: '✔ Vu', markSeen: 'Marquer vu',
    trailer: '▶ Bande-annonce', similar: 'Des idées similaires', likeQ: (t) => `comme ${t}`,
    whereIn: 'Où le regarder', flatrate: 'Abonnement', free: 'Gratuit', rent: 'Location', buy: 'Achat',
    noOffer: 'Aucune offre légale référencée dans ce pays pour l\'instant (souvent le cas des films encore au cinéma).',
    allOffers: 'Voir toutes les offres (JustWatch)',
    taste: 'Mes goûts', rate: 'Ta note', rateHint: 'Note les titres que tu as vus : tes recommandations s\'adaptent à tes goûts.',
    clearRate: 'Effacer', stars: (n) => `${n} étoile${n > 1 ? 's' : ''}`,
    tasteIntro: (n) => `D'après tes ${n} note${n > 1 ? 's' : ''}, voici ce que tu aimes.`,
    tasteEmpty: 'Note au moins 3 titres vus (ouvre une fiche, puis donne des étoiles) pour construire ton profil de goûts.',
    likes: 'Tu aimes', dislikes: 'Moins ton truc', forYou: 'Recommandé pour toi',
    tasteLocal: 'Ton profil est calculé dans ton navigateur et n\'est envoyé nulle part.',
    tasteBoost: 'ajusté à tes goûts',
    tmdbNotice: 'Données et images fournies par TMDB.',
    justwatch: 'Disponibilités streaming fournies par',
    platforms: 'Mes plateformes', platformsHint: 'Coche tes abonnements : les recherches, thématiques et recommandations ne montreront que ce qui y est disponible (abonnement ou gratuit). Rien de coché = toutes les plateformes.',
    onPlatforms: (n) => `Sur tes plateformes : ${n}`, editPlatforms: 'modifier', allPlatforms: 'Toutes les plateformes', choosePlatforms: 'choisir mes plateformes',
    trendsAllPlatforms: 'Les tendances couvrent toutes les plateformes.', both: 'Les deux', clearAll: 'Tout décocher',
    lookFor: 'Je cherche', onWhere: 'Sur', allShort: 'Toutes', othersChecked: (n) => `+ ${n} autre${n > 1 ? 's' : ''} (réglages)`,
    moods: {},
  },
  en: {
    nav: ['Mood', 'Trending', 'Genres', 'My lists'],
    welcome: 'Welcome 👋',
    welcomeText: 'The app uses the free <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a> database for trends, genres and streaming services.',
    step1: 'Create a free account on <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org</a>.',
    step2: 'Go to <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">Settings → API</a> and request a key (personal use).',
    step3: 'Paste the “API Key” or the “API Read Access Token” below.',
    keyPh: 'TMDB API key', save: 'Save', checking: 'Checking…', keyOk: 'Valid key ✔',
    loading: 'Loading…', empty: 'Nothing found yet.',
    isNew: 'New', seen: 'Seen', toWatch: 'To watch', movie: 'Movie', tv: 'Series',
    ask: 'What are you in the mood for tonight?',
    askPh: 'e.g. a cozy, funny night with some mystery, like Knives Out',
    find: 'Find', searching: 'Looking for ideas…',
    presets: [
      'A cozy, funny night with some mystery', 'A recent action movie that doesn\'t take itself seriously',
      'A suspenseful series like Dark', 'Something scary but not too gory', 'Family movie for Sunday night',
      'A feel-good romantic comedy', 'Thought-provoking sci-fi like Interstellar', 'A clever heist in the style of Ocean\'s Eleven',
    ],
    closeTo: (t) => `Similar to ${t}`, fits: (m) => `Matches: ${m}`, popular: 'Popular right now',
    understood: 'Here\'s what I understood:', nothing: 'nothing specific, here are the current must-sees',
    mood: 'mood:', near: 'similar to', notFound: (t) => `title “${t}” not found`,
    only: (k) => `<b>${k === 'tv' ? 'series' : 'movies'}</b> only`, recent: 'recent', classic: 'classics', short: 'short',
    trends: 'Trending this week', all: 'All', movies: 'Movies', series: 'Series',
    newSince: (n) => `${n} new title${n > 1 ? 's' : ''} since your last visit.`,
    byTheme: 'By genre', popularS: 'Popular', topRated: 'Top rated',
    library: 'My library', seenP: 'Seen',
    settings: 'Settings', lang: 'Language', country: 'Country of residence',
    countryHint: 'Used to show the legal streaming services available where you live.',
    tmdbKey: 'TMDB key', backup: 'Back up my lists',
    backupHint: 'Your lists are stored in this browser. Export them to move them to another device.',
    exp: 'Export (.json)', imp: 'Import', imported: (n) => `${n} titles imported ✔`,
    install: 'Install the app',
    installHint: 'In Chrome/Edge (Windows, Mac, Android): menu ⋮ → “Install app”. On iPhone (Safari): Share → “Add to Home Screen”.',
    credits: 'Data provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability: JustWatch via TMDB.',
    close: 'Close', seasons: (n) => `${n} season${n > 1 ? 's' : ''}`, noOverview: 'No overview available.',
    by: 'By', with: 'starring', inList: '✔ In my list', addList: '+ To watch', isSeen: '✔ Seen', markSeen: 'Mark as seen',
    trailer: '▶ Trailer', similar: 'Similar ideas', likeQ: (t) => `like ${t}`,
    whereIn: 'Where to watch', flatrate: 'Subscription', free: 'Free', rent: 'Rent', buy: 'Buy',
    noOffer: 'No legal offer listed in this country yet (often the case for movies still in theaters).',
    allOffers: 'See all offers (JustWatch)',
    taste: 'My taste', rate: 'Your rating', rateHint: 'Rate the titles you have seen: your recommendations adapt to your taste.',
    clearRate: 'Clear', stars: (n) => `${n} star${n > 1 ? 's' : ''}`,
    tasteIntro: (n) => `Based on your ${n} rating${n > 1 ? 's' : ''}, here is what you like.`,
    tasteEmpty: 'Rate at least 3 titles you have seen (open a title, then give it stars) to build your taste profile.',
    likes: 'You like', dislikes: 'Not really your thing', forYou: 'Recommended for you',
    tasteLocal: 'Your profile is computed in your browser and never sent anywhere.',
    tasteBoost: 'tuned to your taste',
    tmdbNotice: 'Data and images provided by TMDB.',
    justwatch: 'Streaming availability provided by',
    platforms: 'My streaming services', platformsHint: 'Tick your subscriptions: searches, genres and recommendations will only show what is available on them (subscription or free). Nothing ticked = all services.',
    onPlatforms: (n) => `On your services: ${n}`, editPlatforms: 'edit', allPlatforms: 'All streaming services', choosePlatforms: 'choose my services',
    trendsAllPlatforms: 'Trending covers all streaming services.', both: 'Both', clearAll: 'Untick all',
    lookFor: 'Looking for', onWhere: 'On', allShort: 'All', othersChecked: (n) => `+ ${n} other${n > 1 ? 's' : ''} (settings)`,
    moods: {
      cosy: 'cozy', 'drôle': 'funny', intrigue: 'mystery', frissons: 'scary', tension: 'tension', action: 'action',
      aventure: 'adventure', romance: 'romance', 'émotion': 'emotional', SF: 'sci-fi', fantastique: 'fantasy',
      famille: 'family', animation: 'animation', 'docu / histoire vraie': 'documentary / true story',
      historique: 'historical', 'film de daron': 'dad movie', crime: 'crime', western: 'western', musique: 'music',
    },
  },
};

let lang = 'fr';
export const getLang = () => lang;
export function setLang(l) {
  lang = STR[l] ? l : 'fr';
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}
export const t = (k) => STR[lang][k] ?? STR.fr[k];
export const moodLabel = (m) => STR[lang].moods[m] || m;

// Langue et pays par défaut d'après le navigateur.
export function guessLang(langs = []) {
  return langs.some((l) => /^fr\b/i.test(l)) || !langs.length ? 'fr' : (langs.some((l) => /^en\b/i.test(l)) ? 'en' : 'fr');
}
export function guessCountry(langs = []) {
  for (const l of langs) {
    const c = (l.split('-')[1] || '').toUpperCase();
    if (COUNTRIES.includes(c)) return c;
  }
  return 'FR';
}

export function countryName(code, l = lang) {
  try { return new Intl.DisplayNames([l], { type: 'region' }).of(code); } catch { return code; }
}
export function countryOptions(l = lang) {
  return COUNTRIES.map((c) => [c, countryName(c, l)]).sort((a, b) => a[1].localeCompare(b[1], l));
}
