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
