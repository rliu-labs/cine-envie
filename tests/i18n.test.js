import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, guessCountry, DEFAULT_LANG, countryOptions, countryName, setLang, getLang, intlLang, LANGS, t, moodLabel } from '../js/i18n.js';
import { genreMaps } from '../js/mood.js';

test('pays par défaut déduit de la langue du navigateur', () => {
  assert.equal(guessCountry(['fr-BE', 'fr']), 'BE');
  assert.equal(guessCountry(['de-CH']), 'CH');
  assert.equal(guessCountry(['en-US', 'en']), 'FR');
  assert.equal(guessCountry([]), 'FR');
});

test('langue par défaut', () => {
  assert.equal(DEFAULT_LANG, 'en');
  setLang('xx');
  assert.equal(getLang(), 'en');
});

test('liste des pays européens complète et triée', () => {
  const opts = countryOptions('fr');
  assert.equal(opts.length, COUNTRIES.length);
  assert.ok(COUNTRIES.includes('FR') && COUNTRIES.includes('GB') && COUNTRIES.includes('CH'));
  const names = opts.map((o) => o[1]);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'fr')));
});

test('chaque texte existe dans les 7 langues', async () => {
  const src = await import('node:fs').then((fs) => fs.readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8'));
  const keys = (block) => [...block.matchAll(/(?:^\s{4}|, )(\w+): /gm)].map((m) => m[1]).sort();
  const block = (l) => src.split(new RegExp(`^\\s{2}${l}: \\{$`, 'm'))[1].split(/^\s{2}(?:\w+: \{|\};)$/m)[0].split(/^\s{4}moods:/m)[0];
  const fr = keys(block('fr'));
  assert.ok(fr.length > 90, `${fr.length} clés`);
  assert.deepEqual(keys(block('en')), fr);
  for (const l of ['es', 'de', 'it', 'pt']) assert.deepEqual(keys(block(l)), fr, l);
  assert.deepEqual(keys(block('ary')), fr);
});

test('darija : 3e langue, pays en français, humeurs traduites', () => {
  assert.deepEqual(LANGS.map((l) => l[0]), ['en', 'ary', 'de', 'es', 'fr', 'it', 'pt']);
  const rest = LANGS.slice(1).map((l) => l[1]);
  assert.deepEqual(rest, [...rest].sort((a, b) => a.localeCompare(b)));
  setLang('ary');
  assert.equal(getLang(), 'ary');
  assert.equal(t('find'), '9elleb');
  assert.equal(moodLabel('drôle'), 'd7k');
  assert.equal(intlLang(), 'fr');
  assert.equal(countryName('BE'), 'Belgique');
  setLang('xx');
  assert.equal(getLang(), 'en');
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

test('espagnol : interface, pays et genres', () => {
  setLang('es');
  assert.equal(t('find'), 'Buscar');
  assert.equal(moodLabel('drôle'), 'divertida');
  assert.equal(intlLang(), 'es');
  assert.equal(countryName('DE'), 'Alemania');
  assert.equal(genreMaps('es').movie[27], 'Terror');
  assert.deepEqual(Object.keys(genreMaps('es').movie), Object.keys(genreMaps('fr').movie));
  assert.deepEqual(Object.keys(genreMaps('es').tv), Object.keys(genreMaps('fr').tv));
  setLang('fr');
});

test('allemand, italien, portugais : interface, pays, genres et langue TMDB', () => {
  const cas = { de: ['Finden', 'lustig', 'Frankreich', 'Komödie'], it: ['Trova', 'divertente', 'Francia', 'Commedia'], pt: ['Procurar', 'divertido', 'França', 'Comédia'] };
  for (const [l, [find, funny, france, comedy]] of Object.entries(cas)) {
    setLang(l);
    assert.equal(t('find'), find);
    assert.equal(moodLabel('drôle'), funny);
    assert.equal(intlLang(), l);
    assert.equal(countryName('FR'), france);
    assert.equal(genreMaps(l).movie[35], comedy);
    assert.deepEqual(Object.keys(genreMaps(l).movie), Object.keys(genreMaps('fr').movie));
    assert.deepEqual(Object.keys(genreMaps(l).tv), Object.keys(genreMaps('fr').tv));
  }
  setLang('fr');
});
