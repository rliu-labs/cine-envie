import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, guessCountry, guessLang, countryOptions, setLang, t, moodLabel } from '../js/i18n.js';
import { genreMaps } from '../js/mood.js';

test('pays par défaut déduit de la langue du navigateur', () => {
  assert.equal(guessCountry(['fr-BE', 'fr']), 'BE');
  assert.equal(guessCountry(['de-CH']), 'CH');
  assert.equal(guessCountry(['en-US', 'en']), 'FR');
  assert.equal(guessCountry([]), 'FR');
});

test('langue par défaut', () => {
  assert.equal(guessLang(['en-GB']), 'en');
  assert.equal(guessLang(['fr-FR', 'en']), 'fr');
  assert.equal(guessLang(['de-DE']), 'fr');
});

test('liste des pays européens complète et triée', () => {
  const opts = countryOptions('fr');
  assert.equal(opts.length, COUNTRIES.length);
  assert.ok(COUNTRIES.includes('FR') && COUNTRIES.includes('GB') && COUNTRIES.includes('CH'));
  const names = opts.map((o) => o[1]);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'fr')));
});

test('chaque texte existe en français et en anglais', async () => {
  const src = await import('node:fs').then((fs) => fs.readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8'));
  const keys = (block) => [...block.matchAll(/^\s{4}(\w+):/gm)].map((m) => m[1]).sort();
  const [fr, en] = src.split(/^\s{2}en: \{$/m);
  assert.deepEqual(keys(fr.split(/^\s{2}fr: \{$/m)[1]), keys(en.split(/^\};$/m)[0]));
});

test('traductions de l\'interface et des humeurs', () => {
  setLang('en');
  assert.equal(t('find'), 'Find');
  assert.equal(moodLabel('drôle'), 'funny');
  setLang('fr');
  assert.equal(t('find'), 'Trouver');
  assert.equal(moodLabel('drôle'), 'drôle');
});

test('noms de genres dans les deux langues', () => {
  assert.equal(genreMaps('fr').movie[35], 'Comédie');
  assert.equal(genreMaps('en').movie[35], 'Comedy');
  assert.deepEqual(Object.keys(genreMaps('fr').tv), Object.keys(genreMaps('en').tv));
});
