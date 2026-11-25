// Analyse d'une « envie » en langage naturel (français ou anglais) -> critères de recherche TMDB.
// Pur JS, sans dépendance : testable avec node.

export const MOVIE_GENRES = {
  28: 'Action', 12: 'Aventure', 16: 'Animation', 35: 'Comédie', 80: 'Crime',
  99: 'Documentaire', 18: 'Drame', 10751: 'Familial', 14: 'Fantastique',
  36: 'Histoire', 27: 'Horreur', 10402: 'Musique', 9648: 'Mystère',
  10749: 'Romance', 878: 'Science-fiction', 53: 'Thriller', 10752: 'Guerre', 37: 'Western',
};

export const TV_GENRES = {
  10759: 'Action & Aventure', 16: 'Animation', 35: 'Comédie', 80: 'Crime',
  99: 'Documentaire', 18: 'Drame', 10751: 'Familial', 10762: 'Enfants',
  9648: 'Mystère', 10765: 'SF & Fantastique', 10768: 'Guerre & Politique', 37: 'Western',
};

export const MOVIE_GENRES_EN = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy',
  36: 'History', 27: 'Horror', 10402: 'Music', 9648: 'Mystery',
  10749: 'Romance', 878: 'Science Fiction', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

export const TV_GENRES_EN = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids',
  9648: 'Mystery', 10765: 'Sci-Fi & Fantasy', 10768: 'War & Politics', 37: 'Western',
};

// Noms de genres dans la langue de l'interface.
export const genreMaps = (lang) => (lang === 'en'
  ? { movie: MOVIE_GENRES_EN, tv: TV_GENRES_EN }
  : { movie: MOVIE_GENRES, tv: TV_GENRES });

// Chaque humeur : genres films (m), genres séries (t), genres à exclure (x).
const MOODS = [
  { label: 'cosy', words: ['cosy', 'cocooning', 'doudou', 'réconfort', 'reconfort', 'chaleureux', 'feel good', 'feel-good', 'tranquille', 'détente', 'detente', 'douceur',
      'cozy', 'comfort', 'comforting', 'wholesome', 'relaxing', 'chill', 'heartwarming', 'uplifting',
      'pepouze', 'pépouze', 'tranquillou', 'posé', 'pose', 'sous la couette', 'sous le plaid', 'plaid', 'canap', 'dimanche pluvieux', 'doudou', 'qui fait du bien', 'reposant', 'lazy sunday', 'under a blanket', 'comfort watch'],
    m: [35, 10749, 10751], t: [35, 10751], x: [27, 53, 10752] },
  { label: 'drôle', words: ['drôle', 'drole', 'rire', 'marrant', 'comédie', 'comedie', 'humour', 'fun', 'léger', 'leger', 'décalé', 'decale',
      'funny', 'comedy', 'hilarious', 'laugh', 'laughs', 'lighthearted', 'light-hearted', 'quirky', 'silly',
      'se marrer', 'marrer', 'poilant', 'tordant', 'barre de rire', 'fou rire', 'débile', 'debile', 'nanar', 'nanard', 'rigoler', 'rigolo', 'lol', 'goofy', 'dumb fun', 'laugh out loud', 'make me laugh'],
    m: [35], t: [35] },
  { label: 'intrigue', words: ['intrigue', 'mystère', 'mystere', 'enquête', 'enquete', 'suspense', 'twist', 'policier', 'whodunit', 'énigme', 'enigme',
      'mystery', 'detective', 'investigation', 'suspenseful', 'puzzle', 'intriguing', 'murder mystery',
      'retourne le cerveau', 'retourner le cerveau', 'prise de tête', 'prise de tete', 'casse-tête', 'casse-tete', 'plot twist', 'qui fait cogiter', 'mindfuck', 'mind-bending', 'mind bending', 'mind-blowing', 'mindblowing', 'twisty', 'whodunnit'],
    m: [9648, 80], t: [9648, 80] },
  { label: 'frissons', words: ['peur', 'horreur', 'flippant', 'frisson', 'frissons', 'angoisse', 'terrifiant', 'épouvante', 'epouvante',
      'scary', 'horror', 'creepy', 'spooky', 'frightening', 'terrifying', 'chilling',
      'fout les jetons', 'foutre les jetons', 'les jetons', 'flipper', 'flippe', 'fait flipper', 'glauque', 'qui fait peur', 'chair de poule', 'freaky', 'gives me chills', 'jump scare', 'jumpscare'],
    m: [27], t: [9648] },
  { label: 'tension', words: ['thriller', 'tendu', 'haletant', 'nerveux', 'stress',
      'tense', 'gripping', 'thrilling', 'nail-biting', 'edge of my seat',
      'scotché', 'scotche', 'en haleine', 'tenir en haleine', 'qui tient en haleine', 'sous tension', 'edge of my seat', 'edge-of-your-seat', 'nerve-racking'],
    m: [53], t: [80, 9648] },
  { label: 'action', words: ['action', 'adrénaline', 'adrenaline', 'baston', 'explosif', 'bourrin', 'combat',
      'explosive', 'fight', 'fights', 'fast-paced', 'action-packed',
      'ça pète', 'ca pete', 'qui pète', 'qui pete', 'castagne', 'bagarre', 'badass', 'explosions', 'grosses explosions', 'popcorn', 'gros bras', 'kick-ass'],
    m: [28], t: [10759] },
  { label: 'aventure', words: ['aventure', 'voyage', 'épique', 'epique', 'quête', 'quete', 'évasion', 'evasion',
      'adventure', 'journey', 'epic', 'quest', 'escapist',
      'dépaysant', 'depaysant', 'grand spectacle', 'road trip', 'road movie', 'treasure hunt', 'chasse au trésor'],
    m: [12, 14], t: [10759, 10765] },
  { label: 'romance', words: ['romance', 'romantique', 'amour', 'love', 'couple', 'saint-valentin',
      'romantic', 'love story', 'date night', 'rom-com', 'romcom',
      'guimauve', 'à l\'eau de rose', 'eau de rose', 'mielleux', 'love story', 'histoire d\'amour', 'sappy', 'swoon', 'swoony'],
    m: [10749], t: [18] },
  { label: 'émotion', words: ['émouvant', 'emouvant', 'pleurer', 'émotion', 'emotion', 'touchant', 'drame', 'triste',
      'emotional', 'moving', 'tearjerker', 'cry', 'touching', 'drama', 'sad', 'heartbreaking',
      'chialer', 'faire pleurer', 'me faire pleurer', 'tire-larmes', 'lacrymal', 'qui prend aux tripes', 'bouleversant', 'make me cry', 'ugly cry', 'tear-jerker', 'gut-wrenching'],
    m: [18], t: [18] },
  { label: 'SF', words: ['sf', 'science-fiction', 'science fiction', 'espace', 'futur', 'futuriste', 'dystopie', 'robot',
      'sci-fi', 'scifi', 'space', 'future', 'dystopia', 'dystopian', 'robots', 'aliens',
      'extraterrestre', 'extraterrestres', 'aliens', 'vaisseau', 'voyage dans le temps', 'time travel', 'cyberpunk', 'spaceship'],
    m: [878], t: [10765] },
  { label: 'fantastique', words: ['fantastique', 'fantasy', 'magie', 'magique', 'dragon', 'sorcier',
      'magic', 'magical', 'dragons', 'wizard', 'wizards'],
    m: [14], t: [10765] },
  { label: 'famille', words: ['famille', 'enfant', 'enfants', 'kids', 'familial', 'gamins',
      'family', 'kids', 'children', 'family-friendly',
      'avec les gosses', 'gosses', 'mômes', 'momes', 'marmots', 'les petits', 'tout public', 'with the kids', 'all ages'],
    m: [10751, 16], t: [10751, 10762], x: [27] },
  { label: 'animation', words: ['animation', 'animé', 'anime', 'dessin animé', 'pixar', 'ghibli',
      'animated', 'cartoon'],
    m: [16], t: [16] },
  { label: 'docu / histoire vraie', words: ['documentaire', 'docu', 'vrai', 'histoire vraie', 'inspirant',
      'documentary', 'docuseries', 'true story', 'based on a true story', 'inspiring', 'real life'],
    m: [99, 36], t: [99] },
  { label: 'historique', words: ['historique', 'époque', 'epoque', 'guerre', 'médiéval', 'medieval',
      'historical', 'period drama', 'war', 'medieval'],
    m: [36, 10752], t: [10768] },
  { label: 'crime', words: ['crime', 'mafia', 'gangster', 'braquage', 'heist', 'cartel',
      'gangsters', 'heist', 'robbery', 'mob',
      'truands', 'voyous', 'polar', 'hold-up', 'narcos', 'true crime'],
    m: [80], t: [80] },
  { label: 'film de daron', words: ['film de daron', 'films de daron', 'film de papa', 'daron', 'darons', 'dad movie', 'dad movies', 'dad film'],
    m: [28, 53, 10752, 37], t: [10759, 80] },
  { label: 'western', words: ['western', 'cowboy',
      'cowboys'], m: [37], t: [37] },
  { label: 'musique', words: ['musique', 'musical', 'comédie musicale', 'concert',
      'music', 'musical'], m: [10402], t: [] },
];

const SIMILAR_RE = /(?:similaire\s+(?:à|a)|comme|dans\s+le\s+style\s+(?:de|d')|façon|facon|du\s+genre\s+(?:de\s+)?|à\s+la|qui\s+ressemble\s+(?:à|a)|proche\s+de|similar\s+to|(?<!\b(?:would|i|we|you|they|feel|feels|feeling|'d)\s)like|in\s+the\s+(?:style|vein|spirit)\s+of|reminiscent\s+of|along\s+the\s+lines\s+of)\s+["«“]?([^,;.!?"»”]+)/i;

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function hasWord(text, word) {
  const w = norm(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`).test(text);
}

export function parseMood(input) {
  const raw = (input || '').trim();
  const text = norm(raw);
  const res = {
    raw, moods: [], movieGenres: new Set(), tvGenres: new Set(), exclude: new Set(),
    similarTo: null, type: 'all', recent: false, short: false, classic: false,
  };

  const sim = raw.match(SIMILAR_RE);
  if (sim) res.similarTo = sim[1].trim().replace(/\s+(et|mais|avec|and|but|with|that|which)\s.*$/i, '').trim();

  // Retire le titre cité pour ne pas en déduire des humeurs (ex. « comme Mission Impossible »)
  const moodText = sim ? norm(raw.replace(sim[0], ' ')) : text;

  for (const mood of MOODS) {
    if (mood.words.some((w) => hasWord(moodText, w))) {
      res.moods.push(mood.label);
      mood.m.forEach((g) => res.movieGenres.add(g));
      mood.t.forEach((g) => res.tvGenres.add(g));
      (mood.x || []).forEach((g) => res.exclude.add(g));
    }
  }
  // Un genre demandé explicitement ne doit pas être exclu par une autre humeur
  for (const g of res.movieGenres) res.exclude.delete(g);

  if (/\b(serie|series|saisons?|episodes?|show|shows|tv|seasons?|binge|binger|bingewatch|binge-watch)\b/.test(moodText)) res.type = 'tv';
  else if (/\b(film|films|long[- ]metrage|movie|movies)\b/.test(moodText)) res.type = 'movie';
  if (/\b(recent|recents|nouveau|nouveaute|nouveautes|sorti recemment|cette annee|qui vient de sortir|du moment|new|newer|latest|this year|recently released|brand new)\b/.test(moodText)) res.recent = true;
  if (/\b(court|courte|rapide|pas trop long|vite fait|pas long|short|quick|not too long|quick watch)\b/.test(moodText)) res.short = true;
  if (/\b(classique|culte|vieux|ancien|annees \d0|classic|classics|cult|old|oldies?|\d0s)\b/.test(moodText)) res.classic = true;

  return res;
}

// Profil de goûts : à partir des notes (1 à 5) données aux titres vus,
// calcule une affinité par genre entre -1 (déteste) et +1 (adore).
export function buildProfile(entries) {
  const rated = (entries || []).filter((e) => e && e.rating >= 1 && e.rating <= 5);
  const sum = new Map();
  const n = new Map();
  for (const e of rated) {
    const v = (e.rating - 3) / 2; // 1★ -> -1, 3★ -> 0, 5★ -> +1
    for (const g of e.genre_ids || []) {
      sum.set(g, (sum.get(g) || 0) + v);
      n.set(g, (n.get(g) || 0) + 1);
    }
  }
  const genres = new Map();
  // Moyenne lissée : un genre vu une seule fois pèse moins qu'un genre confirmé.
  for (const [g, s] of sum) genres.set(g, s / (n.get(g) + 1));
  const sorted = [...genres].sort((a, b) => b[1] - a[1]);
  return {
    count: rated.length,
    genres,
    liked: sorted.filter(([, w]) => w > 0.15).map(([g]) => g),
    disliked: sorted.filter(([, w]) => w < -0.15).reverse().map(([g]) => g),
  };
}

// Bonus de profil pour un résultat (0 si pas encore de profil).
export function profileBonus(item, profile) {
  if (!profile || !profile.count) return 0;
  return (item.genre_ids || []).reduce((acc, g) => acc + (profile.genres.get(g) || 0), 0) * 3;
}

// Score d'un résultat TMDB par rapport à l'envie analysée (plus haut = mieux).
export function scoreItem(item, mood, profile = null) {
  const genres = item.genre_ids || [];
  const wanted = item.media_type === 'tv' ? mood.tvGenres : mood.movieGenres;
  let score = 0;
  for (const g of genres) {
    if (wanted.has(g)) score += 3;
    if (mood.exclude.has(g)) score -= 6;
  }
  score += (item.vote_average || 0) / 2;
  score += Math.log10((item.vote_count || 0) + 1);
  if (item._fromSimilar) score += 4;
  score += profileBonus(item, profile);
  return score;
}
