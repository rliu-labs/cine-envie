// Tests de l'analyse d'envie : npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMood, scoreItem } from '../js/mood.js';

test('détecte plusieurs humeurs et un titre de référence', () => {
  const r = parseMood("soirée cosy, drôle avec de l'intrigue comme À couteaux tirés");
  assert.deepEqual(r.moods, ['cosy', 'drôle', 'intrigue']);
  assert.equal(r.similarTo, 'À couteaux tirés');
  assert.ok(r.exclude.has(27), "le cosy exclut l'horreur");
});

test('reconnaît film ou série', () => {
  assert.equal(parseMood("un film d'action").type, 'movie');
  assert.equal(parseMood('une série à suspense comme Dark').type, 'tv');
  assert.equal(parseMood('un truc drôle').type, 'all');
});

test('repère récent, court et classique', () => {
  assert.equal(parseMood("un film d'action récent").recent, true);
  assert.equal(parseMood('un truc court').short, true);
  assert.equal(parseMood('un classique culte').classic, true);
});

test('ignore les accents et la casse', () => {
  assert.deepEqual(parseMood('COMEDIE ROMANTIQUE').moods, parseMood('comédie romantique').moods);
});

test('le titre cité ne crée pas de fausse humeur', () => {
  const r = parseMood('comme Mission Impossible');
  assert.equal(r.similarTo, 'Mission Impossible');
  assert.deepEqual(r.moods, []);
});

test('un genre demandé n\'est jamais exclu', () => {
  const r = parseMood('cosy mais avec du thriller');
  assert.ok(r.movieGenres.has(53));
  assert.ok(!r.exclude.has(53));
});

test('le score favorise les genres voulus et pénalise les exclus', () => {
  const mood = parseMood('soirée cosy et drôle');
  const comedie = { media_type: 'movie', genre_ids: [35], vote_average: 7, vote_count: 1000 };
  const horreur = { media_type: 'movie', genre_ids: [27], vote_average: 7, vote_count: 1000 };
  assert.ok(scoreItem(comedie, mood) > scoreItem(horreur, mood));
});

test('comprend une envie écrite en anglais', () => {
  const r = parseMood('A cozy, funny night with some mystery, like Knives Out');
  assert.deepEqual(r.moods, ['cosy', 'drôle', 'intrigue']);
  assert.equal(r.similarTo, 'Knives Out');
  assert.ok(r.exclude.has(27));
});

test('anglais : film ou série, récent, classique, court', () => {
  assert.equal(parseMood('a suspenseful series like Dark').type, 'tv');
  assert.equal(parseMood('a TV show about dragons').type, 'tv');
  const r = parseMood('a recent action movie');
  assert.equal(r.type, 'movie');
  assert.equal(r.recent, true);
  assert.equal(parseMood('a classic 90s thriller').classic, true);
  assert.equal(parseMood('something short and funny').short, true);
});

test('anglais : « I would like » n\'est pas pris pour un titre', () => {
  const r = parseMood('I would like something funny');
  assert.equal(r.similarTo, null);
  assert.deepEqual(r.moods, ['drôle']);
});

test('anglais : style de référence', () => {
  assert.equal(parseMood("a clever heist in the style of Ocean's Eleven").similarTo, "Ocean's Eleven");
  assert.equal(parseMood('sci-fi similar to Arrival and not too long').similarTo, 'Arrival');
});

test('vocabulaire familier en français', () => {
  const cas = {
    'un truc qui fout les jetons': 'frissons',
    'un bon film de daron': 'film de daron',
    'un truc chill sous la couette': 'cosy',
    'un film qui me retourne le cerveau': 'intrigue',
    'un nanar pour se marrer': 'drôle',
    'un film qui fait chialer': 'émotion',
    'un truc qui me tient en haleine': 'tension',
    'un film où ça pète dans tous les sens': 'action',
    'un dessin animé avec les gosses': 'famille',
  };
  for (const [q, m] of Object.entries(cas)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
});

test('vocabulaire familier en anglais', () => {
  assert.ok(parseMood('something mind-bending like Inception').moods.includes('intrigue'));
  assert.ok(parseMood('a dad movie with explosions').moods.includes('film de daron'));
  assert.ok(parseMood('a tearjerker that will make me cry').moods.includes('émotion'));
  assert.ok(parseMood('goofy dumb fun').moods.includes('drôle'));
});

test('« à binger » veut dire une série', () => {
  assert.equal(parseMood('une série à binger').type, 'tv');
  assert.equal(parseMood('something to binge').type, 'tv');
});

test('« casse-tête » ne déclenche pas le registre crime', () => {
  const r = parseMood('un casse-tête');
  assert.ok(r.moods.includes('intrigue'));
  assert.ok(!r.moods.includes('crime'));
});

test('darija en lettres latines (arabizi) et variantes d\'orthographe', () => {
  const cas = {
    'bghit chi film dyal d7k': 'drôle',
    'chi film kaydahek bzaf': 'drôle',
    'chi 7aja katkhl3': 'frissons',
    'film dyal lkhouf w jnoun': 'frissons',
    'film dyal l7ob': 'romance',
    'bghit nbki lyouma': 'émotion',
    'film fih dbaz w 9rtas': 'action',
    'msalsal fih tachwi9': 'intrigue',
    'film dyal chfara': 'crime',
    'bghit nrta7 m3a chi film': 'cosy',
    'chi 7aja l drari': 'famille',
    'film dyal lfada': 'SF',
    'chi moghamara': 'aventure',
    'film tarikhi': 'historique',
    'film dyal bba': 'film de daron',
  };
  for (const [q, m] of Object.entries(cas)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
});

test('darija : type, récent, court, ancien et « b7al »', () => {
  const r = parseMood('msalsal jdid b7al Dark w fih d7k');
  assert.equal(r.type, 'tv');
  assert.ok(r.recent);
  assert.equal(r.similarTo, 'Dark');
  assert.ok(r.moods.includes('drôle'));
  assert.equal(parseMood('chi aflam dyal d7k').type, 'movie');
  assert.ok(parseMood('film 9sir').short);
  assert.ok(parseMood('film dyal zman').classic);
});

test('mélange français / darija', () => {
  const r = parseMood('soirée cosy, film dyal d7k w l7ob');
  assert.deepEqual(r.moods.sort(), ['cosy', 'drôle', 'romance'].sort());
  assert.equal(r.type, 'movie');
});

test('le darija ne crée pas de faux positifs en français ou en anglais', () => {
  for (const q of ['khlas safi', 'un film à voir ce soir', 'a movie about a hub of robbers', 'chi film']) {
    assert.deepEqual(parseMood(q).moods, [], q);
  }
});

test('recherche en espagnol, y compris le registre familier', () => {
  const cas = {
    'una noche tranquila y divertida': 'cosy',
    'una peli para partirse de risa': 'drôle',
    'una serie con giros y misterio': 'intrigue',
    'algo que dé miedo': 'frissons',
    'algo que me haga llorar': 'émotion',
    'una peli de tiros': 'action',
    'una comedia romántica': 'romance',
    'ciencia ficción con viajes en el tiempo': 'SF',
    'para ver con los críos': 'famille',
    'un documental basado en hechos reales': 'docu / histoire vraie',
    'un atraco': 'crime',
    'una peli de padre': 'film de daron',
  };
  for (const [q, m] of Object.entries(cas)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
});

test('espagnol : type, récent, court, classique et titre de référence', () => {
  const r = parseMood('una serie reciente de suspense como Dark y con giros');
  assert.equal(r.type, 'tv');
  assert.ok(r.recent);
  assert.equal(r.similarTo, 'Dark');
  assert.ok(r.moods.includes('intrigue'));
  assert.equal(parseMood('una peli de acción').type, 'movie');
  assert.ok(parseMood('algo corto').short);
  assert.ok(parseMood('un clásico de los 80').classic);
  assert.equal(parseMood('un atraco al estilo de Ocean\'s Eleven').similarTo, 'Ocean\'s Eleven');
});

test('recherche en allemand (registre familier et mots composés)', () => {
  const cas = {
    'ein gemütlicher Abend': 'cosy', 'etwas Lustiges': 'drôle', 'ein Krimi mit Wendungen': 'intrigue',
    'was Gruseliges': 'frissons', 'etwas zum Heulen': 'émotion', 'ein Liebesfilm': 'romance',
    'mit den Kindern': 'famille', 'eine Doku': 'docu / histoire vraie', 'ein Raubüberfall': 'crime', 'Zeitreisen im Weltraum': 'SF',
  };
  for (const [q, m] of Object.entries(cas)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
  const r = parseMood('ein neuer Actionfilm wie John Wick und lustig');
  assert.equal(r.type, 'movie');
  assert.ok(r.recent);
  assert.equal(r.similarTo, 'John Wick');
  assert.ok(r.moods.includes('drôle'));
  assert.equal(parseMood('eine Serie mit drei Staffeln').type, 'tv');
  assert.ok(parseMood('ein Klassiker aus den 80ern').classic);
});

test('recherche en italien', () => {
  const cas = {
    'una serata rilassante': 'cosy', 'qualcosa di divertente': 'drôle', 'un giallo con colpi di scena': 'intrigue',
    'un film che fa paura': 'frissons', 'qualcosa da far piangere': 'émotion', 'una storia d\'amore': 'romance',
    'con i bambini': 'famille', 'cartoni animati': 'animation', 'una rapina': 'crime', 'fantascienza': 'SF',
  };
  for (const [q, m] of Object.entries(cas)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
  const r = parseMood('una serie recente come Dark e divertente');
  assert.equal(r.type, 'tv');
  assert.ok(r.recent);
  assert.equal(r.similarTo, 'Dark');
  assert.ok(r.moods.includes('drôle'));
  assert.ok(parseMood('un film breve').short);
  assert.ok(parseMood('un classico degli anni 80').classic);
});

test('recherche en portugais', () => {
  const cas = {
    'uma noite tranquila': 'cosy', 'algo engraçado': 'drôle', 'um policial com reviravoltas': 'intrigue',
    'algo que meta medo': 'frissons', 'um filme para chorar': 'émotion', 'uma história de amor': 'romance',
    'com os miúdos': 'famille', 'desenhos animados': 'animation', 'um assalto': 'crime', 'ficção científica': 'SF',
  };
  for (const [q, m] of Object.entries(cas)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
  const r = parseMood('uma série nova parecida com Dark e divertida');
  assert.equal(r.type, 'tv');
  assert.ok(r.recent);
  assert.equal(r.similarTo, 'Dark');
  assert.ok(r.moods.includes('drôle'));
  assert.equal(parseMood('um filme curto').type, 'movie');
  assert.ok(parseMood('um filme curto').short);
  assert.ok(parseMood('um clássico dos anos 80').classic);
});

test('« come » anglais et « coup de cœur » ne sont pas mal interprétés', () => {
  assert.equal(parseMood('something to come home to').similarTo, null);
  assert.deepEqual(parseMood('un coup de cœur').moods, []);
});

test('titre de référence avec une conjonction dans le titre', () => {
  assert.equal(parseMood('una serata divertente, come Cena con delitto').similarTo, 'Cena con delitto');
  assert.equal(parseMood('like Fast and Furious and funny').similarTo, 'Fast and Furious');
  assert.equal(parseMood('come Dark e divertente').similarTo, 'Dark');
  assert.equal(parseMood('comme Dark que j\'ai adoré').similarTo, 'Dark');
});
