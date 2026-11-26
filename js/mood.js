// Analyse d'une « envie » en langage naturel (français, anglais ou darija marocain en lettres latines) -> critères de recherche TMDB.
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


// Darija marocain écrit en lettres latines (« arabizi ») : pas d'orthographe standard.
// On replie d'abord le texte (chiffres-lettres 3, 7, 9…, lettres doublées), puis on
// teste chaque mot avec des motifs souples qui tolèrent les variantes et les préfixes
// verbaux (ka-, kay-, n-, t-, gha-…). Les motifs renvoient aux humeurs ci-dessus.
export function foldDarija(s) {
  return norm(s)
    .replace(/5/g, 'kh').replace(/7/g, 'h').replace(/9/g, 'q').replace(/8/g, 'gh')
    .replace(/[32]/g, 'a')
    .replace(/([a-z])\1+/g, '$1');
}

const V = '(?:ka|ki|kay|kan|kat|gha|ghad[ai]?|mo|mu|n|t|y|m|l)?'; // préfixes verbaux et article
const DARIJA = [
  { label: 'drôle', re: [`^${V}${V}d[aeiou]?h[aeiou]?k`, `^${V}a?q[ae]?ch[ae]?b`, '^n[ou]kat$'] },
  { label: 'frissons', re: [`^${V}${V}khl[ae](a|ni|tni|k|tek)?$`, '^l?r[ou]+ab$', `^${V}${V}khw[aei]f`, '^l?kh[ou]+f$', '^l?j[ae]?n[ou]+n$', '^l?afarit$'] },
  { label: 'romance', re: ['^l?hob$', '^lhub$', `^${V}${V}ach[ae]?q`, '^l?gh?ram$', '^m?ghr[ae]m$'] },
  { label: 'émotion', re: [`^${V}${V}bk(i|a|ani|ini|iw|iti)$`, '^l?h[ae]?z[ie]?n[ae]?$', '^mo?u?ath?[ie]r$', '^l?dmou?a$'] },
  { label: 'action', re: [`^${V}${V}d[ae]?b[ae]?z`, `^${V}q[ae]?rt[ae]?s`, '^l?darb$'] },
  { label: 'intrigue', re: ['^(a?l)?(o|a)?ghaz$', '^l?[oa]?ghz$', `^${V}tachwi?q`, '^m?ch[ae]wi?q$'] },
  { label: 'tension', re: [`^${V}tachwi?q`] },
  { label: 'crime', re: ['^l?ch[ae]?f[ae]?r[ae]?$', '^l?b[ou]+l[ie]+s(i|ia|iya)?$', '^l?mafia$'] },
  { label: 'cosy', re: [`^${V}rt[ae]h$`, '^l?raha$'] },
  { label: 'famille', re: ['^l?d[ae]?rari$', '^l?w[ae]?lad$', '^l?familia$', '^ayla$', '^(l|a)?aila$', '^l?sghar$'] },
  { label: 'SF', re: ['^a?lfada$', 'm[ou]st[ae]qb[ae]l'] },
  { label: 'aventure', re: ['m[ou]gh[ae]m[ae]ra', '^(s|l)?s?afar$'] },
  { label: 'docu / histoire vraie', re: ['^l?wath?a+i?q?i(ya|a)?$', '^waq[ie]a?i?(ya|a|ia)?$'] },
  { label: 'historique', re: ['^(a?l)?tarikh(i|ia|iya)?$', '^l?harb$'] },
  { label: 'animation', re: ['^l?r[ae]?s[ou]+m$', '^mot?harika$'] },
  { label: 'musique', re: ['^l?mo?u?siqa$', '^l?gh?na$'] },
].map((d) => ({ ...d, re: d.re.map((r) => new RegExp(r)) }));

const DARIJA_FLAGS = {
  tv: /^(l?m[ou]?s[ae]?ls[ae]?l(a|at)?|l?msalsl[ae]t?)$/,
  movie: /^(l?aflam|l?filmat|lfilm)$/,
  recent: /^(jdid|jdida|jdad|l?jdid)$/,
  short: /^(qsir|qsira|qsar)$/,
  classic: /^(qdim|qdima|qdam)$/,
};

const SIMILAR_RE = /(?:\b(?:b7al|bhal|b7el|bhel|f7al|fhal)|similaire\s+(?:à|a)|comme|dans\s+le\s+style\s+(?:de|d')|façon|facon|du\s+genre\s+(?:de\s+)?|à\s+la|qui\s+ressemble\s+(?:à|a)|proche\s+de|similar\s+to|(?<!\b(?:would|i|we|you|they|feel|feels|feeling|'d)\s)like|in\s+the\s+(?:style|vein|spirit)\s+of|reminiscent\s+of|along\s+the\s+lines\s+of)\s+["«“]?([^,;.!?"»”]+)/i;

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
  if (sim) res.similarTo = sim[1].trim().replace(/\s+(et|mais|avec|and|but|with|that|which|w|walakin|wlakin|m3a)\s.*$/i, '').trim();

  // Retire le titre cité pour ne pas en déduire des humeurs (ex. « comme Mission Impossible »)
  // (on garde ce qui suit le titre : « comme Dark et drôle », « b7al Dark w fih d7k »)
  const moodText = sim ? norm(raw.replace(sim[0], ` ${sim[1].trim().slice(res.similarTo.length)}`)) : text;

  for (const mood of MOODS) {
    if (mood.words.some((w) => hasWord(moodText, w))) {
      res.moods.push(mood.label);
      mood.m.forEach((g) => res.movieGenres.add(g));
      mood.t.forEach((g) => res.tvGenres.add(g));
      (mood.x || []).forEach((g) => res.exclude.add(g));
    }
  }
  // Darija (arabizi), seul ou mélangé au français
  const tokens = foldDarija(moodText).split(/[^a-z]+/).filter(Boolean);
  const folded = ` ${tokens.join(' ')} `;
  const addMood = (label) => {
    const mood = MOODS.find((m) => m.label === label);
    if (res.moods.includes(label)) return;
    res.moods.push(label);
    mood.m.forEach((g) => res.movieGenres.add(g));
    mood.t.forEach((g) => res.tvGenres.add(g));
    (mood.x || []).forEach((g) => res.exclude.add(g));
  };
  for (const d of DARIJA) if (tokens.some((w) => d.re.some((r) => r.test(w)))) addMood(d.label);
  if (/ (film|aflam) dyal (ba|bouya|lwalid) /.test(folded)) addMood('film de daron');

  // Un genre demandé explicitement ne doit pas être exclu par une autre humeur
  for (const g of res.movieGenres) res.exclude.delete(g);

  if (/\b(serie|series|saisons?|episodes?|show|shows|tv|seasons?|binge|binger|bingewatch|binge-watch)\b/.test(moodText)) res.type = 'tv';
  else if (/\b(film|films|long[- ]metrage|movie|movies)\b/.test(moodText)) res.type = 'movie';
  if (/\b(recent|recents|nouveau|nouveaute|nouveautes|sorti recemment|cette annee|qui vient de sortir|du moment|new|newer|latest|this year|recently released|brand new)\b/.test(moodText)) res.recent = true;
  if (/\b(court|courte|rapide|pas trop long|vite fait|pas long|short|quick|not too long|quick watch)\b/.test(moodText)) res.short = true;
  if (tokens.some((w) => DARIJA_FLAGS.tv.test(w))) res.type = 'tv';
  else if (res.type === 'all' && tokens.some((w) => DARIJA_FLAGS.movie.test(w))) res.type = 'movie';
  if (tokens.some((w) => DARIJA_FLAGS.recent.test(w)) || / (ad|yalah) (khrej|khrjat|kherj) /.test(folded)) res.recent = true;
  if (tokens.some((w) => DARIJA_FLAGS.short.test(w)) || / mach(i)? t[ae]?wil/.test(folded)) res.short = true;
  if (tokens.some((w) => DARIJA_FLAGS.classic.test(w)) || / dyal (zman|zaman) /.test(folded)) res.classic = true;
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
