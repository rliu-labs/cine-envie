// Analyse d'une « envie » en langage naturel (français, anglais, espagnol, allemand, italien, portugais ou darija marocain en lettres latines) -> critères de recherche TMDB.
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

export const MOVIE_GENRES_ES = {
  28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen',
  99: 'Documental', 18: 'Drama', 10751: 'Familia', 14: 'Fantasía',
  36: 'Historia', 27: 'Terror', 10402: 'Música', 9648: 'Misterio',
  10749: 'Romance', 878: 'Ciencia ficción', 53: 'Suspense', 10752: 'Bélica', 37: 'Western',
};

export const TV_GENRES_ES = {
  10759: 'Acción y aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen',
  99: 'Documental', 18: 'Drama', 10751: 'Familia', 10762: 'Infantil',
  9648: 'Misterio', 10765: 'Ciencia ficción y fantasía', 10768: 'Bélica y política', 37: 'Western',
};

export const MOVIE_GENRES_DE = {
  28: 'Action', 12: 'Abenteuer', 16: 'Animation', 35: 'Komödie', 80: 'Krimi',
  99: 'Dokumentarfilm', 18: 'Drama', 10751: 'Familie', 14: 'Fantasy',
  36: 'Historie', 27: 'Horror', 10402: 'Musik', 9648: 'Mystery',
  10749: 'Liebesfilm', 878: 'Science-Fiction', 53: 'Thriller', 10752: 'Kriegsfilm', 37: 'Western',
};
export const TV_GENRES_DE = {
  10759: 'Action & Abenteuer', 16: 'Animation', 35: 'Komödie', 80: 'Krimi',
  99: 'Dokumentarfilm', 18: 'Drama', 10751: 'Familie', 10762: 'Kinder',
  9648: 'Mystery', 10765: 'Sci-Fi & Fantasy', 10768: 'Krieg & Politik', 37: 'Western',
};
export const MOVIE_GENRES_IT = {
  28: 'Azione', 12: 'Avventura', 16: 'Animazione', 35: 'Commedia', 80: 'Crime',
  99: 'Documentario', 18: 'Dramma', 10751: 'Famiglia', 14: 'Fantasy',
  36: 'Storia', 27: 'Horror', 10402: 'Musica', 9648: 'Mistero',
  10749: 'Romance', 878: 'Fantascienza', 53: 'Thriller', 10752: 'Guerra', 37: 'Western',
};
export const TV_GENRES_IT = {
  10759: 'Azione e avventura', 16: 'Animazione', 35: 'Commedia', 80: 'Crime',
  99: 'Documentario', 18: 'Dramma', 10751: 'Famiglia', 10762: 'Bambini',
  9648: 'Mistero', 10765: 'Fantascienza e fantasy', 10768: 'Guerra e politica', 37: 'Western',
};
export const MOVIE_GENRES_PT = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime',
  99: 'Documentário', 18: 'Drama', 10751: 'Família', 14: 'Fantasia',
  36: 'História', 27: 'Terror', 10402: 'Música', 9648: 'Mistério',
  10749: 'Romance', 878: 'Ficção científica', 53: 'Thriller', 10752: 'Guerra', 37: 'Faroeste',
};
export const TV_GENRES_PT = {
  10759: 'Ação e aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime',
  99: 'Documentário', 18: 'Drama', 10751: 'Família', 10762: 'Infantil',
  9648: 'Mistério', 10765: 'Ficção científica e fantasia', 10768: 'Guerra e política', 37: 'Faroeste',
};

// Noms de genres dans la langue de l'interface (le darija utilise le français).
export const genreMaps = (lang) => ({
  en: { movie: MOVIE_GENRES_EN, tv: TV_GENRES_EN },
  es: { movie: MOVIE_GENRES_ES, tv: TV_GENRES_ES },
  de: { movie: MOVIE_GENRES_DE, tv: TV_GENRES_DE },
  it: { movie: MOVIE_GENRES_IT, tv: TV_GENRES_IT },
  pt: { movie: MOVIE_GENRES_PT, tv: TV_GENRES_PT },
}[lang] || { movie: MOVIE_GENRES, tv: TV_GENRES });

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


// Vocabulaire espagnol (dont le registre familier), ajouté aux humeurs ci-dessus.
const ES_WORDS = {
  cosy: ['acogedora', 'acogedor', 'tranquila', 'tranquilo', 'relajante', 'para relajarse', 'reconfortante', 'bajo la manta', 'de manta y sofá', 'de sofá', 'domingo lluvioso', 'que haga sentir bien', 'buen rollo'],
  'drôle': ['divertida', 'divertido', 'graciosa', 'gracioso', 'comedia', 'humor', 'risa', 'risas', 'reír', 'reirme', 'reírme', 'partirse de risa', 'me parta de risa', 'para partirse', 'desternillante', 'tronchante', 'absurda', 'ligera'],
  intrigue: ['misterio', 'intriga', 'enigma', 'detective', 'investigación', 'giro', 'giros', 'giro final', 'policiaca', 'policíaca', 'que te rompa la cabeza', 'rayada', 'flipante', 'quién es el asesino'],
  frissons: ['miedo', 'terror', 'de miedo', 'que dé miedo', 'que de miedo', 'aterradora', 'escalofriante', 'escalofríos', 'da yuyu', 'yuyu', 'acojonante', 'mal rollo', 'sustos', 'de sustos'],
  tension: ['tensión', 'tensa', 'trepidante', 'angustiosa', 'que no puedas despegarte', 'en vilo', 'de infarto', 'suspense', 'suspenso'],
  action: ['acción', 'adrenalina', 'peleas', 'tortas', 'de tiros', 'tiros', 'explosiones', 'cañera', 'trepidante'],
  aventure: ['aventura', 'aventuras', 'viaje', 'épica', 'epopeya', 'búsqueda del tesoro'],
  romance: ['romántica', 'romántico', 'amor', 'de amor', 'historia de amor', 'cita', 'pastelona', 'moñas', 'ñoña'],
  'émotion': ['emotiva', 'emocionante', 'conmovedora', 'llorar', 'para llorar', 'triste', 'drama', 'lacrimógena', 'que me haga llorar'],
  SF: ['ciencia ficción', 'ciencia-ficción', 'espacio', 'futuro', 'futurista', 'distopía', 'robots', 'extraterrestres', 'viaje en el tiempo', 'viajes en el tiempo', 'nave espacial'],
  fantastique: ['fantasía', 'magia', 'mágica', 'dragones', 'brujas', 'mago', 'magos'],
  famille: ['familia', 'familiar', 'niños', 'con los niños', 'con los críos', 'críos', 'peques', 'para todos los públicos', 'todos los públicos'],
  animation: ['animación', 'animada', 'dibujos', 'dibujos animados'],
  'docu / histoire vraie': ['documental', 'docu', 'historia real', 'basada en hechos reales', 'hechos reales', 'inspiradora'],
  historique: ['histórica', 'histórico', 'de época', 'guerra', 'medieval', 'bélica'],
  crime: ['crimen', 'criminal', 'mafia', 'atraco', 'robo', 'gánsteres', 'narcos', 'narco'],
  'film de daron': ['peli de padre', 'película de padre', 'peli de mi padre', 'peli de papá', 'cine de papá'],
  western: ['vaqueros', 'del oeste'],
  musique: ['música', 'musical', 'concierto'],
};

// Allemand, italien et portugais. Un mot qui finit par * est un radical : il couvre
// les terminaisons (gemütlich*, gemütlicher, gemütliches… ; divertent* : divertente, divertenti…).
const DE_WORDS = {
  cosy: ['gemütlich*', 'kuschelig*', 'entspann*', 'wohlfühl*', 'chillig*', 'auf der couch', 'sofaabend', 'zum runterkommen'],
  'drôle': ['lustig*', 'witzig*', 'komödie*', 'komisch*', 'zum lachen', 'lachen', 'humorvoll*', 'spaßig*', 'albern*', 'zum totlachen', 'brüller'],
  intrigue: ['rätsel*', 'mysteriös*', 'krimi', 'krimis', 'detektiv*', 'wendung*', 'verwirrend*', 'kopfkino', 'wer ist der mörder'],
  frissons: ['grusel*', 'angst', 'schaurig*', 'unheimlich*', 'gänsehaut', 'erschreck*', 'zum fürchten', 'schocker', 'horrorfilm*'],
  tension: ['spannend*', 'spannung*', 'nervenkitzel', 'packend*', 'fesselnd*'],
  action: ['actionreich*', 'actionfilm*', 'schießerei*', 'prügelei*', 'explosion*', 'ballerei*', 'krachend*'],
  aventure: ['abenteuer*', 'episch*', 'schatzsuche'],
  romance: ['romantisch*', 'liebe', 'liebesfilm*', 'liebesgeschichte*', 'schnulz*', 'kitschig*'],
  'émotion': ['emotional*', 'traurig*', 'weinen', 'heulen', 'rührend*', 'bewegend*', 'zum heulen', 'tränendrüs*'],
  SF: ['weltraum*', 'zukunft*', 'futuristisch*', 'dystop*', 'außerirdisch*', 'zeitreise*', 'raumschiff*'],
  fantastique: ['magie', 'magisch*', 'drachen', 'zauber*'],
  famille: ['familie*', 'kinder', 'mit den kindern', 'kinderfilm*', 'für die ganze familie'],
  animation: ['animiert*', 'zeichentrick*', 'animationsfilm*', 'trickfilm*'],
  'docu / histoire vraie': ['doku', 'dokus', 'dokumentar*', 'wahre geschichte', 'wahren begebenheit*', 'wahren geschichte'],
  historique: ['historisch*', 'krieg', 'kriege', 'kriegsfilm*', 'weltkrieg*', 'mittelalter*', 'kostümfilm*'],
  crime: ['verbrechen', 'raub*', 'überfall*', 'kriminal*', 'gangsterfilm*'],
  'film de daron': ['papa-film', 'papafilm', 'vaterfilm', 'film für papa'],
  western: ['wildwest*'],
  musique: ['musik*', 'konzert*'],
};
const IT_WORDS = {
  cosy: ['rilassant*', 'accogliente', 'sul divano', 'sotto la coperta', 'coccol*', 'buon umore', 'di buon umore'],
  'drôle': ['divertent*', 'comico', 'comica', 'comici', 'commedia', 'commedie', 'ridere', 'far ridere', 'risate', 'spassos*', 'esilarant*', 'da sbellicarsi', 'demenzial*'],
  intrigue: ['mistero', 'misteri', 'misterios*', 'giallo', 'gialli', 'enigm*', 'investigazion*', 'colpo di scena', 'colpi di scena', 'poliziesc*'],
  frissons: ['paura', 'terrore', 'spavent*', 'inquietant*', 'brividi', 'da brividi', 'che fa paura'],
  tension: ['tensione', 'avvincent*', 'col fiato sospeso', 'ansiogen*'],
  action: ['azione', 'sparatori*', 'botte', 'combattiment*', 'esplosion*', 'mazzate'],
  aventure: ['avventur*', 'viaggio', 'epico', 'epica'],
  romance: ['romantic*', 'amore', 'storia d\'amore', 'sdolcinat*'],
  'émotion': ['commovent*', 'piangere', 'far piangere', 'emozionant*', 'strappalacrime', 'dramma', 'drammatic*'],
  SF: ['fantascienza', 'spazio', 'futuro', 'futuristic*', 'distopi*', 'alieni', 'viaggi nel tempo', 'viaggio nel tempo', 'astronave'],
  fantastique: ['magia', 'magico', 'magica', 'magici', 'draghi', 'stregon*', 'maghi'],
  famille: ['famiglia', 'famiglie', 'bambini', 'con i bambini', 'per tutta la famiglia', 'per famiglie'],
  animation: ['animazione', 'animat*', 'cartoni', 'cartoni animati', 'cartone animato'],
  'docu / histoire vraie': ['documentari*', 'storia vera', 'tratto da una storia vera', 'fatti reali'],
  historique: ['storic*', 'guerra', 'in costume'],
  crime: ['crimin*', 'rapina', 'rapine', 'colpo grosso', 'malavita'],
  'film de daron': ['film da papà', 'film di papà', 'film per papà'],
  western: [],
  musique: ['musica', 'concerto', 'concerti'],
};
const PT_WORDS = {
  cosy: ['tranquil*', 'aconchegant*', 'relaxant*', 'no sofá', 'debaixo da manta', 'para relaxar', 'bem-dispost*', 'sentir bem'],
  'drôle': ['divertid*', 'engraçad*', 'comédia', 'comédias', 'rir', 'para rir', 'gargalhad*', 'hilariant*', 'cómic*', 'cômic*'],
  intrigue: ['mistério', 'mistérios', 'misterios*', 'investigação', 'reviravolta*', 'policial', 'detetive*'],
  frissons: ['medo', 'assustador*', 'arrepiant*', 'meta medo', 'dá medo', 'de arrepiar'],
  tension: ['tensão', 'eletrizante', 'electrizante', 'de cortar a respiração', 'angustiante'],
  action: ['ação', 'acção', 'porrada', 'tiroteio*', 'explosões', 'lutas', 'pancadaria'],
  aventure: ['viagem', 'épico', 'épica'],
  romance: ['romântic*', 'história de amor', 'lamechas', 'melos*'],
  'émotion': ['emotiv*', 'comovente*', 'chorar', 'para chorar', 'dramátic*', 'de lágrimas'],
  SF: ['ficção científica', 'espaço', 'futurist*', 'distópi*', 'alienígenas', 'viagem no tempo', 'nave espacial'],
  fantastique: ['mágic*', 'dragões', 'feiticeiro*', 'bruxas'],
  famille: ['família', 'crianças', 'miúdos', 'com os miúdos', 'para toda a família', 'putos'],
  animation: ['animação', 'animad*', 'desenhos animados'],
  'docu / histoire vraie': ['documentári*', 'história verídica', 'factos reais', 'fatos reais', 'baseado em factos', 'baseado em fatos'],
  historique: ['históric*', 'de época'],
  crime: ['assalto*', 'roubo', 'bandidos'],
  'film de daron': ['filme de pai', 'filme de cota', 'filme do meu pai'],
  western: ['faroeste'],
  musique: ['música', 'concerto'],
};
for (const m of MOODS) for (const w of [ES_WORDS, DE_WORDS, IT_WORDS, PT_WORDS]) m.words.push(...(w[m.label] || []));

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

const SIMILAR_RE = /(?:\b(?:b7al|bhal|b7el|bhel|f7al|fhal)|similaire\s+(?:à|a)|comme|\bcomo|parecid[ao]s?\s+(?:a|com)|ao\s+estilo\s+de|\bwie|ähnlich\s+wie|im\s+stil\s+von|(?<!\b(?:to|will|can|could|would|i|you|we|they|please)\s)\bcome(?!\s+(?:on|back|home|out|in|up|over|along|together|true|alive|with)\b)|simile\s+a|nello\s+stile\s+di|al\s+estilo\s+de|en\s+plan|del\s+estilo\s+de|\btipo|dans\s+le\s+style\s+(?:de|d')|façon|facon|du\s+genre\s+(?:de\s+)?|à\s+la|qui\s+ressemble\s+(?:à|a)|proche\s+de|similar\s+to|(?<!\b(?:would|i|we|you|they|feel|feels|feeling|'d)\s)like|in\s+the\s+(?:style|vein|spirit)\s+of|reminiscent\s+of|along\s+the\s+lines\s+of)\s+["«“]?([^,;.!?"»”]+)/i;

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function hasWord(text, word) {
  const stem = word.endsWith('*'); // radical : accepte n'importe quelle terminaison
  const w = norm(stem ? word.slice(0, -1) : word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${w}${stem ? '' : '([^a-z0-9]|$)'}`).test(text);
}

// Titre de référence : on coupe à la première conjonction qui introduit autre chose
// (« Dark et drôle », « Dark que j'ai adoré »), mais on garde les titres qui contiennent
// « et / con / e » quand la suite ne décrit aucune envie (« Cena con delitto »).
const CUT_ALWAYS = /\s+(mais|but|that|which|que|pero|aber|ma|mas|walakin|wlakin)\s/i;
const CUT_IF_MOOD = /\s+(et|avec|and|with|w|m3a|y|con|und|mit|e|com)\s/gi;
function describesSomething(text) {
  const r = parseMood(text);
  return r.moods.length > 0 || r.type !== 'all' || r.recent || r.short || r.classic;
}
function cleanTitle(s) {
  let title = s.trim();
  const always = title.match(CUT_ALWAYS);
  if (always) title = title.slice(0, always.index);
  // On teste chaque morceau entre deux conjonctions : « Fast and Furious and funny »
  // garde « Fast and Furious » et coupe avant « funny ».
  const cuts = [...title.matchAll(CUT_IF_MOOD)];
  for (const [i, m] of cuts.entries()) {
    const end = cuts[i + 1] ? cuts[i + 1].index : title.length;
    if (describesSomething(title.slice(m.index + m[0].length, end))) return title.slice(0, m.index).trim();
  }
  return title.trim();
}

export function parseMood(input) {
  const raw = (input || '').trim();
  const text = norm(raw);
  const res = {
    raw, moods: [], movieGenres: new Set(), tvGenres: new Set(), exclude: new Set(),
    similarTo: null, type: 'all', recent: false, short: false, classic: false,
  };

  const sim = raw.match(SIMILAR_RE);
  if (sim) res.similarTo = cleanTitle(sim[1]);

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

  if (/\b(serie|series|saisons?|episodes?|show|shows|tv|seasons?|binge|binger|bingewatch|binge-watch|temporadas?|capitulos?|maraton|serien|staffeln?|folgen|stagion[ei]|puntate|episodi|episodios)\b/.test(moodText)) res.type = 'tv';
  else if (/\b[a-z]{3,}film(e|en)?\b/.test(moodText) || /\b(film|films|long[- ]metrage|movie|movies|pelicula|peliculas|peli|pelis|filme|spielfilm|filmes)\b/.test(moodText)) res.type = 'movie';
  if (/\b(recent|recents|nouveau|nouveaute|nouveautes|sorti recemment|cette annee|qui vient de sortir|du moment|new|newer|latest|this year|recently released|brand new|reciente|recientes|nueva|nuevas|nuevo|nuevos|estreno|estrenos|este ano|de este ano|neu|neue|neuer|neues|aktuell|aktuelle|dieses jahr|recente|recenti|nuovo|nuova|nuovi|uscito da poco|di quest'anno|novo|novos|nova|novas|estreia|estreias|deste ano|acabado de sair)\b/.test(moodText)) res.recent = true;
  if (/\b(court|courte|rapide|pas trop long|vite fait|pas long|short|quick|not too long|quick watch|corta|corto|cortita|no muy larga|no muy largo|kurz|kurzer|kurze|nicht zu lang|breve|brevi|non troppo lungo|curto|curta|nao muito longo)\b/.test(moodText)) res.short = true;
  if (tokens.some((w) => DARIJA_FLAGS.tv.test(w))) res.type = 'tv';
  else if (res.type === 'all' && tokens.some((w) => DARIJA_FLAGS.movie.test(w))) res.type = 'movie';
  if (tokens.some((w) => DARIJA_FLAGS.recent.test(w)) || / (ad|yalah) (khrej|khrjat|kherj) /.test(folded)) res.recent = true;
  if (tokens.some((w) => DARIJA_FLAGS.short.test(w)) || / mach(i)? t[ae]?wil/.test(folded)) res.short = true;
  if (tokens.some((w) => DARIJA_FLAGS.classic.test(w)) || / dyal (zman|zaman) /.test(folded)) res.classic = true;
  if (/\b(classique|culte|vieux|ancien|annees \d0|classic|classics|cult|old|oldies?|\d0s|clasico|clasica|clasicos|clasicas|de culto|antigua|antiguo|de los \d0|anos \d0|klassiker|kult|kultfilm|\d0er|classico|classici|vecchio|vecchi|anni \d0|classica|antigo|antigos)\b/.test(moodText)) res.classic = true;

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
