import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProfile, profileBonus, scoreItem, parseMood } from '../js/mood.js';

// Minimal localStorage to test store.js under Node
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const store = await import('../js/store.js');

const e = (id, genres, rating) => ({ id, media_type: 'movie', genre_ids: genres, status: 'seen', rating });

test('empty profile without ratings', () => {
  const p = buildProfile([{ id: 1, genre_ids: [35], status: 'seen' }]);
  assert.equal(p.count, 0);
  assert.equal(profileBonus({ genre_ids: [35] }, p), 0);
});

test('well-rated genres are liked, badly rated ones avoided', () => {
  const p = buildProfile([e(1, [35, 9648], 5), e(2, [35], 4), e(3, [27], 1), e(4, [27, 53], 2)]);
  assert.equal(p.count, 4);
  assert.equal(p.liked[0], 35);
  assert.ok(p.disliked.includes(27));
  assert.ok(!p.liked.includes(27));
});

test('the profile changes the ranking of recommendations', () => {
  const p = buildProfile([e(1, [35], 5), e(2, [35], 5), e(3, [27], 1)]);
  const mood = parseMood('un film');
  const comedy = { media_type: 'movie', genre_ids: [35], vote_average: 6.5, vote_count: 500 };
  const horror = { media_type: 'movie', genre_ids: [27], vote_average: 7.5, vote_count: 500 };
  assert.ok(scoreItem(horror, mood) > scoreItem(comedy, mood), 'without a profile, the best rating wins');
  assert.ok(scoreItem(comedy, mood, p) > scoreItem(horror, mood, p), 'with a profile, taste comes first');
});

test('rating a title marks it as seen and keeps the rating', () => {
  const it = { id: 42, media_type: 'movie', title: 'X', genre_ids: [18] };
  store.setRating(it, 4);
  assert.equal(store.getEntry(it).status, 'seen');
  assert.equal(store.getEntry(it).rating, 4);
  store.setRating(it, 0);
  assert.equal(store.getEntry(it).rating, undefined);
  store.setRating(it, 5);
  store.setStatus(it, 'towatch');
  assert.equal(store.getEntry(it).rating, undefined, 'moving back to "to watch" clears the rating');
});

test('ratings are included in the export', () => {
  const json = JSON.parse(store.exportData());
  assert.ok(Object.values(json.list).every((x) => x.rating === undefined || (x.rating >= 1 && x.rating <= 5)));
});

test('services stored per country and movies / series preference', () => {
  store.setProviders('FR', [8, 119, 8]);
  store.setProviders('BE', [337]);
  assert.deepEqual(store.getProviders('FR'), [8, 119]);
  assert.deepEqual(store.getProviders('BE'), [337]);
  assert.deepEqual(store.getProviders('DE'), [8, 119, 337], 'default: Netflix, Prime Video, Disney+');
  assert.equal(store.getMediaType(), 'all');
  store.setMediaType('tv');
  assert.equal(store.getMediaType(), 'tv');
});

test('"All" = all my services, the selection narrows it down', () => {
  store.setProviders('IT', [8, 119, 337, 381]);
  assert.deepEqual(store.effectiveProviders('IT'), [8, 119, 337, 381], 'nothing selected = all my services');
  store.setActive('IT', [8, 337]);
  assert.deepEqual(store.effectiveProviders('IT'), [8, 337]);
  store.setProviders('IT', [8, 119]);
  assert.deepEqual(store.getActive('IT'), [8], 'a service unticked in the settings leaves the selection');
  store.setProviders('IT', []);
  assert.deepEqual(store.effectiveProviders('IT'), [], 'no service ticked = the whole catalogue');
});
