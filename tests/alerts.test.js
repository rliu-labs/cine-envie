import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshot, compare, due } from '../js/alerts.js';

const fiche = (fr, seasons = [], last = null) => ({
  'watch/providers': { results: { FR: fr } },
  seasons, last_episode_to_air: last,
});
const NF = { provider_id: 8, provider_name: 'Netflix' };
const PV = { provider_id: 119, provider_name: 'Prime Video' };
const CA = { provider_id: 381, provider_name: 'Canal+' };

test('instantané : plateformes incluses et saisons diffusées', () => {
  const s = snapshot(fiche({ flatrate: [NF], ads: [PV], rent: [CA] }, [
    { season_number: 0, air_date: '2010-01-01' }, { season_number: 1, air_date: '2020-01-01' },
    { season_number: 2, air_date: '2026-01-01' }, { season_number: 3, air_date: '2030-01-01' },
  ]), 'FR', '2026-11-27');
  assert.deepEqual(s.prov, [8, 119]); // la location ne compte pas
  assert.equal(s.names[8], 'Netflix');
  assert.equal(s.seasons, 2); // la saison 3 est seulement annoncée
  assert.equal(snapshot(fiche({}), 'US').seasons, 0);
});

test('alerte quand le titre arrive sur une de mes plateformes', () => {
  const prev = snapshot(fiche({ flatrate: [CA] }), 'FR');
  const cur = snapshot(fiche({ flatrate: [CA, NF, PV] }), 'FR');
  assert.deepEqual(compare(prev, cur, [8, 337]), [{ kind: 'platform', ids: [8], names: ['Netflix'] }]);
  assert.deepEqual(compare(prev, cur, [337]), []); // pas chez moi
});

test('alerte nouvelle saison, jamais au premier passage ni après un changement de pays', () => {
  const s = (n) => snapshot(fiche({}, [], { season_number: n }), 'FR');
  assert.deepEqual(compare(s(2), s(3)), [{ kind: 'season', n: 3 }]);
  assert.deepEqual(compare(s(3), s(3)), []);
  assert.deepEqual(compare(null, snapshot(fiche({ flatrate: [NF] }), 'FR'), [8]), []);
  assert.deepEqual(compare({ ...s(1), region: 'BE' }, s(3)), []);
});

test('titres à vérifier : « À voir » seulement, une fois par jour, les plus récents d’abord', () => {
  const now = 1e12;
  const list = {
    'movie:1': { status: 'towatch', updatedAt: 1 },
    'tv:2': { status: 'towatch', updatedAt: 3 },
    'movie:3': { status: 'seen', updatedAt: 5 },
    'tv:4': { status: 'towatch', updatedAt: 2 },
  };
  const snaps = { 'tv:4': { at: now - 3600e3 }, 'movie:1': { at: now - 48 * 3600e3 } };
  assert.deepEqual(due(list, snaps, now), ['tv:2', 'movie:1']);
  assert.deepEqual(due(list, {}, now, { limit: 1 }), ['tv:2']);
});
