// Analyse d'une « envie » en langage naturel -> critères de recherche TMDB.
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

// Chaque humeur : genres films (m), genres séries (t), genres à exclure (x).
const MOODS = [
  { label: 'cosy', words: ['cosy', 'cocooning', 'doudou', 'réconfort', 'reconfort', 'chaleureux', 'feel good', 'feel-good', 'tranquille', 'détente', 'detente', 'douceur'],
    m: [35, 10749, 10751], t: [35, 10751], x: [27, 53, 10752] },
  { label: 'drôle', words: ['drôle', 'drole', 'rire', 'marrant', 'comédie', 'comedie', 'humour', 'fun', 'léger', 'leger', 'décalé', 'decale'],
    m: [35], t: [35] },
  { label: 'intrigue', words: ['intrigue', 'mystère', 'mystere', 'enquête', 'enquete', 'suspense', 'twist', 'policier', 'whodunit', 'énigme', 'enigme'],
    m: [9648, 80], t: [9648, 80] },
  { label: 'frissons', words: ['peur', 'horreur', 'flippant', 'frisson', 'frissons', 'angoisse', 'terrifiant', 'épouvante', 'epouvante'],
    m: [27], t: [9648] },
  { label: 'tension', words: ['thriller', 'tendu', 'haletant', 'nerveux', 'stress'],
    m: [53], t: [80, 9648] },
  { label: 'action', words: ['action', 'adrénaline', 'adrenaline', 'baston', 'explosif', 'bourrin', 'combat'],
    m: [28], t: [10759] },
  { label: 'aventure', words: ['aventure', 'voyage', 'épique', 'epique', 'quête', 'quete', 'évasion', 'evasion'],
    m: [12, 14], t: [10759, 10765] },
  { label: 'romance', words: ['romance', 'romantique', 'amour', 'love', 'couple', 'saint-valentin'],
    m: [10749], t: [18] },
  { label: 'émotion', words: ['émouvant', 'emouvant', 'pleurer', 'émotion', 'emotion', 'touchant', 'drame', 'triste'],
    m: [18], t: [18] },
  { label: 'SF', words: ['sf', 'science-fiction', 'science fiction', 'espace', 'futur', 'futuriste', 'dystopie', 'robot'],
    m: [878], t: [10765] },
  { label: 'fantastique', words: ['fantastique', 'fantasy', 'magie', 'magique', 'dragon', 'sorcier'],
    m: [14], t: [10765] },
  { label: 'famille', words: ['famille', 'enfant', 'enfants', 'kids', 'familial', 'gamins'],
    m: [10751, 16], t: [10751, 10762], x: [27] },
  { label: 'animation', words: ['animation', 'animé', 'anime', 'dessin animé', 'pixar', 'ghibli'],
    m: [16], t: [16] },
  { label: 'docu / histoire vraie', words: ['documentaire', 'docu', 'vrai', 'histoire vraie', 'inspirant'],
    m: [99, 36], t: [99] },
  { label: 'historique', words: ['historique', 'époque', 'epoque', 'guerre', 'médiéval', 'medieval'],
    m: [36, 10752], t: [10768] },
  { label: 'crime', words: ['crime', 'mafia', 'gangster', 'braquage', 'heist', 'cartel'],
    m: [80], t: [80] },
  { label: 'western', words: ['western', 'cowboy'], m: [37], t: [37] },
  { label: 'musique', words: ['musique', 'musical', 'comédie musicale', 'concert'], m: [10402], t: [] },
];

const SIMILAR_RE = /(?:similaire\s+(?:à|a)|comme|dans\s+le\s+style\s+(?:de|d')|façon|facon|du\s+genre\s+(?:de\s+)?|à\s+la|qui\s+ressemble\s+(?:à|a)|proche\s+de)\s+["«“]?([^,;.!?"»”]+)/i;

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
  if (sim) res.similarTo = sim[1].trim().replace(/\s+(et|mais|avec)\s.*$/i, '').trim();

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

  if (/\b(serie|series|saison|episodes?)\b/.test(moodText)) res.type = 'tv';
  else if (/\b(film|films|long[- ]metrage)\b/.test(moodText)) res.type = 'movie';
  if (/\b(recent|recents|nouveau|nouveaute|nouveautes|sorti recemment|cette annee)\b/.test(moodText)) res.recent = true;
  if (/\b(court|courte|rapide|pas trop long)\b/.test(moodText)) res.short = true;
  if (/\b(classique|culte|vieux|ancien|annees \d0)\b/.test(moodText)) res.classic = true;

  return res;
}

// Score d'un résultat TMDB par rapport à l'envie analysée (plus haut = mieux).
export function scoreItem(item, mood) {
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
  return score;
}
