// Mood parser tests: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMood, scoreItem } from '../js/mood.js';

test('detects several moods and a reference title', () => {
  const r = parseMood("soirée cosy, drôle avec de l'intrigue comme À couteaux tirés");
  assert.deepEqual(r.moods, ['cozy', 'funny', 'mystery']);
  assert.equal(r.similarTo, 'À couteaux tirés');
  assert.ok(r.exclude.has(27), "le cosy exclut l'horror");
});

test('recognises movie or series', () => {
  assert.equal(parseMood("un film d'action").type, 'movie');
  assert.equal(parseMood('une série à suspense comme Dark').type, 'tv');
  assert.equal(parseMood('un truc drôle').type, 'all');
});

test('spots recent, short and classic', () => {
  assert.equal(parseMood("un film d'action récent").recent, true);
  assert.equal(parseMood('un truc court').short, true);
  assert.equal(parseMood('un classique culte').classic, true);
});

test('ignores accents and case', () => {
  assert.deepEqual(parseMood('COMEDIE ROMANTIQUE').moods, parseMood('comédie romantique').moods);
});

test('the quoted title does not create a false mood', () => {
  const r = parseMood('comme Mission Impossible');
  assert.equal(r.similarTo, 'Mission Impossible');
  assert.deepEqual(r.moods, []);
});

test('a requested genre is never excluded', () => {
  const r = parseMood('cosy mais avec du thriller');
  assert.ok(r.movieGenres.has(53));
  assert.ok(!r.exclude.has(53));
});

test('the score favours wanted genres and penalises excluded ones', () => {
  const mood = parseMood('soirée cosy et drôle');
  const comedy = { media_type: 'movie', genre_ids: [35], vote_average: 7, vote_count: 1000 };
  const horror = { media_type: 'movie', genre_ids: [27], vote_average: 7, vote_count: 1000 };
  assert.ok(scoreItem(comedy, mood) > scoreItem(horror, mood));
});

test('understands a mood written in English', () => {
  const r = parseMood('A cozy, funny night with some mystery, like Knives Out');
  assert.deepEqual(r.moods, ['cozy', 'funny', 'mystery']);
  assert.equal(r.similarTo, 'Knives Out');
  assert.ok(r.exclude.has(27));
});

test('English: movie or series, recent, classic, short', () => {
  assert.equal(parseMood('a suspenseful series like Dark').type, 'tv');
  assert.equal(parseMood('a TV show about dragons').type, 'tv');
  const r = parseMood('a recent action movie');
  assert.equal(r.type, 'movie');
  assert.equal(r.recent, true);
  assert.equal(parseMood('a classic 90s thriller').classic, true);
  assert.equal(parseMood('something short and funny').short, true);
});

test('English: "I would like" is not taken as a title', () => {
  const r = parseMood('I would like something funny');
  assert.equal(r.similarTo, null);
  assert.deepEqual(r.moods, ['funny']);
});

test('English: reference style', () => {
  assert.equal(parseMood("a clever heist in the style of Ocean's Eleven").similarTo, "Ocean's Eleven");
  assert.equal(parseMood('sci-fi similar to Arrival and not too long').similarTo, 'Arrival');
});

test('French slang', () => {
  const cases = {
    'un truc qui fout les jetons': 'scary',
    'un bon film de daron': 'dadMovie',
    'un truc chill sous la couette': 'cozy',
    'un film qui me retourne le cerveau': 'mystery',
    'un nanar pour se marrer': 'funny',
    'un film qui fait chialer': 'emotional',
    'un truc qui me tient en haleine': 'tension',
    'un film où ça pète dans tous les sens': 'action',
    'un dessin animé avec les gosses': 'family',
  };
  for (const [q, m] of Object.entries(cases)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
});

test('English slang', () => {
  assert.ok(parseMood('something mind-bending like Inception').moods.includes('mystery'));
  assert.ok(parseMood('a dad movie with explosions').moods.includes('dadMovie'));
  assert.ok(parseMood('a tearjerker that will make me cry').moods.includes('emotional'));
  assert.ok(parseMood('goofy dumb fun').moods.includes('funny'));
});

test('"à binger" means a series', () => {
  assert.equal(parseMood('une série à binger').type, 'tv');
  assert.equal(parseMood('something to binge').type, 'tv');
});

test('"casse-tête" does not trigger the crime mood', () => {
  const r = parseMood('un casse-tête');
  assert.ok(r.moods.includes('mystery'));
  assert.ok(!r.moods.includes('crime'));
});

test('Darija in Latin script (Arabizi) and spelling variants', () => {
  const cases = {
    'bghit chi film dyal d7k': 'funny',
    'chi film kaydahek bzaf': 'funny',
    'chi 7aja katkhl3': 'scary',
    'film dyal lkhouf w jnoun': 'scary',
    'film dyal l7ob': 'romance',
    'bghit nbki lyouma': 'emotional',
    'film fih dbaz w 9rtas': 'action',
    'msalsal fih tachwi9': 'mystery',
    'film dyal chfara': 'crime',
    'bghit nrta7 m3a chi film': 'cozy',
    'chi 7aja l drari': 'family',
    'film dyal lfada': 'scifi',
    'chi moghamara': 'adventure',
    'film tarikhi': 'historical',
    'film dyal bba': 'dadMovie',
  };
  for (const [q, m] of Object.entries(cases)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
});

test('Darija: type, recent, short, classic and "b7al"', () => {
  const r = parseMood('msalsal jdid b7al Dark w fih d7k');
  assert.equal(r.type, 'tv');
  assert.ok(r.recent);
  assert.equal(r.similarTo, 'Dark');
  assert.ok(r.moods.includes('funny'));
  assert.equal(parseMood('chi aflam dyal d7k').type, 'movie');
  assert.ok(parseMood('film 9sir').short);
  assert.ok(parseMood('film dyal zman').classic);
});

test('French / Darija mix', () => {
  const r = parseMood('soirée cosy, film dyal d7k w l7ob');
  assert.deepEqual(r.moods.sort(), ['cozy', 'funny', 'romance'].sort());
  assert.equal(r.type, 'movie');
});

test('Darija creates no false positives in French or English', () => {
  for (const q of ['khlas safi', 'un film à voir ce soir', 'a movie about a hub of robbers', 'chi film']) {
    assert.deepEqual(parseMood(q).moods, [], q);
  }
});

test('Spanish search, including slang', () => {
  const cases = {
    'una noche tranquila y divertida': 'cozy',
    'una peli para partirse de risa': 'funny',
    'una serie con giros y misterio': 'mystery',
    'algo que dé miedo': 'scary',
    'algo que me haga llorar': 'emotional',
    'una peli de tiros': 'action',
    'una comedia romántica': 'romance',
    'ciencia ficción con viajes en el tiempo': 'scifi',
    'para ver con los críos': 'family',
    'un documental basado en hechos reales': 'documentary',
    'un atraco': 'crime',
    'una peli de padre': 'dadMovie',
  };
  for (const [q, m] of Object.entries(cases)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
});

test('Spanish: type, recent, short, classic and reference title', () => {
  const r = parseMood('una serie reciente de suspense como Dark y con giros');
  assert.equal(r.type, 'tv');
  assert.ok(r.recent);
  assert.equal(r.similarTo, 'Dark');
  assert.ok(r.moods.includes('mystery'));
  assert.equal(parseMood('una peli de acción').type, 'movie');
  assert.ok(parseMood('algo corto').short);
  assert.ok(parseMood('un clásico de los 80').classic);
  assert.equal(parseMood('un atraco al estilo de Ocean\'s Eleven').similarTo, 'Ocean\'s Eleven');
});

test('German search (slang and compound words)', () => {
  const cases = {
    'ein gemütlicher Abend': 'cozy', 'etwas Lustiges': 'funny', 'ein Krimi mit Wendungen': 'mystery',
    'was Gruseliges': 'scary', 'etwas zum Heulen': 'emotional', 'ein Liebesfilm': 'romance',
    'mit den Kindern': 'family', 'eine Doku': 'documentary', 'ein Raubüberfall': 'crime', 'Zeitreisen im Weltraum': 'scifi',
  };
  for (const [q, m] of Object.entries(cases)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
  const r = parseMood('ein neuer Actionfilm wie John Wick und lustig');
  assert.equal(r.type, 'movie');
  assert.ok(r.recent);
  assert.equal(r.similarTo, 'John Wick');
  assert.ok(r.moods.includes('funny'));
  assert.equal(parseMood('eine Serie mit drei Staffeln').type, 'tv');
  assert.ok(parseMood('ein Klassiker aus den 80ern').classic);
});

test('Italian search', () => {
  const cases = {
    'una serata rilassante': 'cozy', 'qualcosa di divertente': 'funny', 'un giallo con colpi di scena': 'mystery',
    'un film che fa paura': 'scary', 'qualcosa da far piangere': 'emotional', 'una storia d\'amore': 'romance',
    'con i bambini': 'family', 'cartoni animati': 'animation', 'una rapina': 'crime', 'fantascienza': 'scifi',
  };
  for (const [q, m] of Object.entries(cases)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
  const r = parseMood('una serie recente come Dark e divertente');
  assert.equal(r.type, 'tv');
  assert.ok(r.recent);
  assert.equal(r.similarTo, 'Dark');
  assert.ok(r.moods.includes('funny'));
  assert.ok(parseMood('un film breve').short);
  assert.ok(parseMood('un classico degli anni 80').classic);
});

test('Portuguese search', () => {
  const cases = {
    'uma noite tranquila': 'cozy', 'algo engraçado': 'funny', 'um policial com reviravoltas': 'mystery',
    'algo que meta medo': 'scary', 'um filme para chorar': 'emotional', 'uma história de amor': 'romance',
    'com os miúdos': 'family', 'desenhos animados': 'animation', 'um assalto': 'crime', 'ficção científica': 'scifi',
  };
  for (const [q, m] of Object.entries(cases)) assert.ok(parseMood(q).moods.includes(m), `${q} -> ${m}`);
  const r = parseMood('uma série nova parecida com Dark e divertida');
  assert.equal(r.type, 'tv');
  assert.ok(r.recent);
  assert.equal(r.similarTo, 'Dark');
  assert.ok(r.moods.includes('funny'));
  assert.equal(parseMood('um filme curto').type, 'movie');
  assert.ok(parseMood('um filme curto').short);
  assert.ok(parseMood('um clássico dos anos 80').classic);
});

test('English "come" and "coup de cœur" are not misread', () => {
  assert.equal(parseMood('something to come home to').similarTo, null);
  assert.deepEqual(parseMood('un coup de cœur').moods, []);
});

test('reference title containing a conjunction', () => {
  assert.equal(parseMood('una serata divertente, come Cena con delitto').similarTo, 'Cena con delitto');
  assert.equal(parseMood('like Fast and Furious and funny').similarTo, 'Fast and Furious');
  assert.equal(parseMood('come Dark e divertente').similarTo, 'Dark');
  assert.equal(parseMood('comme Dark que j\'ai adoré').similarTo, 'Dark');
});
