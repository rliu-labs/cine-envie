import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../js/tmdb.js';

test('requests follow the chosen language and country', async () => {
  const urls = [];
  globalThis.fetch = async (u) => { urls.push(new URL(u)); return { ok: true, status: 200, json: async () => ({ results: [] }) }; };
  api.setCredential('abc');
  api.setLocale('en', 'BE');
  await api.discover('movie', { with_genres: 35 });
  assert.equal(urls[0].searchParams.get('language'), 'en-US');
  assert.equal(urls[0].searchParams.get('watch_region'), 'BE');
  assert.equal(api.getRegion(), 'BE');
  api.setLocale('fr', 'nimportequoi');
  assert.equal(api.getRegion(), 'BE', 'an invalid country code is ignored');
});

test('the services filter is added to searches', async () => {
  const urls = [];
  globalThis.fetch = async (u) => { urls.push(new URL(u)); return { ok: true, status: 200, json: async () => ({ results: [] }) }; };
  api.setCredential('abc2');
  api.setLocale('fr', 'FR');
  api.setProviders([8, '119', 'x', -1]);
  assert.deepEqual(api.getProviders(), [8, 119]);
  await api.discover('tv', { with_genres: 18 });
  assert.equal(urls.at(-1).searchParams.get('with_watch_providers'), '8|119');
  assert.equal(urls.at(-1).searchParams.get('with_watch_monetization_types'), 'flatrate|free|ads');
  api.setProviders([]);
  await api.discover('tv', { with_genres: 80 });
  assert.equal(urls.at(-1).searchParams.get('with_watch_providers'), null);
});

test('the country\'s services, without duplicates and sorted', async () => {
  globalThis.fetch = async (u) => {
    const type = new URL(u).pathname.includes('/tv') ? 'tv' : 'movie';
    const results = type === 'movie'
      ? [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png', display_priorities: { FR: 2 } }, { provider_id: 119, provider_name: 'Prime Video', logo_path: '/p.png', display_priorities: { FR: 5 } }]
      : [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png', display_priorities: { FR: 1 } }, { provider_id: 381, provider_name: 'Canal+', logo_path: '/c.png', display_priorities: { FR: 3 } }];
    return { ok: true, status: 200, json: async () => ({ results }) };
  };
  api.setCredential('abc3');
  const list = await api.providerList();
  assert.deepEqual(list.map((p) => p.name), ['Netflix', 'Canal+', 'Prime Video']);
});
