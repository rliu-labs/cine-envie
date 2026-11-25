import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../js/tmdb.js';

test('les requêtes suivent la langue et le pays choisis', async () => {
  const urls = [];
  globalThis.fetch = async (u) => { urls.push(new URL(u)); return { ok: true, status: 200, json: async () => ({ results: [] }) }; };
  api.setCredential('abc');
  api.setLocale('en', 'BE');
  await api.discover('movie', { with_genres: 35 });
  assert.equal(urls[0].searchParams.get('language'), 'en-US');
  assert.equal(urls[0].searchParams.get('watch_region'), 'BE');
  assert.equal(api.getRegion(), 'BE');
  api.setLocale('fr', 'nimportequoi');
  assert.equal(api.getRegion(), 'BE', 'un code pays invalide est ignoré');
});
