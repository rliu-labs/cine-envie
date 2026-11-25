import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProfile, profileBonus, scoreItem, parseMood } from '../js/mood.js';

// localStorage minimal pour tester store.js sous Node
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const store = await import('../js/store.js');

const e = (id, genres, rating) => ({ id, media_type: 'movie', genre_ids: genres, status: 'seen', rating });

test('profil vide sans notes', () => {
  const p = buildProfile([{ id: 1, genre_ids: [35], status: 'seen' }]);
  assert.equal(p.count, 0);
  assert.equal(profileBonus({ genre_ids: [35] }, p), 0);
});

test('les genres bien notés sont aimés, les mal notés évités', () => {
  const p = buildProfile([e(1, [35, 9648], 5), e(2, [35], 4), e(3, [27], 1), e(4, [27, 53], 2)]);
  assert.equal(p.count, 4);
  assert.equal(p.liked[0], 35);
  assert.ok(p.disliked.includes(27));
  assert.ok(!p.liked.includes(27));
});

test('le profil change le classement des recommandations', () => {
  const p = buildProfile([e(1, [35], 5), e(2, [35], 5), e(3, [27], 1)]);
  const mood = parseMood('un film');
  const comedie = { media_type: 'movie', genre_ids: [35], vote_average: 6.5, vote_count: 500 };
  const horreur = { media_type: 'movie', genre_ids: [27], vote_average: 7.5, vote_count: 500 };
  assert.ok(scoreItem(horreur, mood) > scoreItem(comedie, mood), 'sans profil, la meilleure note gagne');
  assert.ok(scoreItem(comedie, mood, p) > scoreItem(horreur, mood, p), 'avec profil, les goûts priment');
});

test('noter un titre le marque comme vu et la note est conservée', () => {
  const it = { id: 42, media_type: 'movie', title: 'X', genre_ids: [18] };
  store.setRating(it, 4);
  assert.equal(store.getEntry(it).status, 'seen');
  assert.equal(store.getEntry(it).rating, 4);
  store.setRating(it, 0);
  assert.equal(store.getEntry(it).rating, undefined);
  store.setRating(it, 5);
  store.setStatus(it, 'towatch');
  assert.equal(store.getEntry(it).rating, undefined, 'repasser en « à voir » efface la note');
});

test('les notes partent dans l\'export', () => {
  const json = JSON.parse(store.exportData());
  assert.ok(Object.values(json.list).every((x) => x.rating === undefined || (x.rating >= 1 && x.rating <= 5)));
});
