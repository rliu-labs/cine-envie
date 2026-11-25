import { parseMood, scoreItem, genreMaps, buildProfile } from './mood.js';
import * as api from './tmdb.js';
import * as store from './store.js';
import { t, getLang, setLang, moodLabel, guessLang, guessCountry, countryName, countryOptions } from './i18n.js';

const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const year = (it) => (it.release_date || it.first_air_date || it.date || '').slice(0, 4);
const titleOf = (it) => it.title || it.name || '';
const genreName = (it, g) => {
  const m = genreMaps(getLang());
  return (it.media_type === 'tv' ? m.tv : m.movie)[g] || m.movie[g] || m.tv[g];
};

// ---------- Langue et pays ----------
const langs = typeof navigator !== 'undefined' ? [...(navigator.languages || [navigator.language || ''])] : [];
function applyLocale() {
  setLang(store.getLang() || guessLang(langs));
  api.setLocale(getLang(), store.getRegion() || guessCountry(langs));
  api.setProviders(store.getProviders(api.getRegion()));
  document.querySelectorAll('nav a').forEach((a, i) => { if (t('nav')[i]) a.textContent = t('nav')[i]; });
  const gear = $('nav a[href="#reglages"]');
  if (gear) { gear.textContent = '⚙︎'; gear.setAttribute('aria-label', t('settings')); }
  renderFooter();
}
const tasteProfile = () => buildProfile(Object.values(store.getList()));

// Mention TMDB obligatoire (logo + phrase exacte des conditions d'utilisation), en pied de page.
function renderFooter() {
  let f = $('#credits');
  if (!f) { f = document.createElement('footer'); f.id = 'credits'; document.body.appendChild(f); }
  f.innerHTML = `
    <a href="https://www.themoviedb.org" target="_blank" rel="noopener" class="tmdb-logo"><img src="icons/tmdb.svg" alt="TMDB" width="120" height="16"></a>
    <p>${t('tmdbNotice')} This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    <p>${t('justwatch')} <a href="https://www.justwatch.com" target="_blank" rel="noopener">JustWatch</a>.</p>`;
}

// Bandeau « Sur tes plateformes : … » (ou lien pour les choisir)
let providerNames = new Map();
async function loadProviderNames() {
  if (!api.hasCredential()) return [];
  try { const list = await api.providerList(); providerNames = new Map(list.map((p) => [p.id, p])); return list; } catch { return []; }
}
function platformPill() {
  const ids = api.getProviders();
  if (!ids.length) return `<p class="hint pill-line">${t('allPlatforms')} · <a href="#reglages">${t('choosePlatforms')}</a></p>`;
  const names = ids.map((id) => providerNames.get(id)?.name).filter(Boolean).join(', ') || ids.length;
  return `<p class="hint pill-line">${esc(t('onPlatforms')(names))} · <a href="#reglages">${t('editPlatforms')}</a></p>`;
}
async function refreshPill() {
  if (api.getProviders().length && !providerNames.size) await loadProviderNames();
  const el = $('#pill'); if (el) el.innerHTML = platformPill();
}

const countrySelect = (id) => `<select id="${id}" aria-label="${esc(t('country'))}">${countryOptions().map(([c, n]) => `<option value="${c}" ${c === api.getRegion() ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
function setCountry(c) { store.setRegion(c); providerNames = new Map(); applyLocale(); }

// ---------- Rendu commun ----------
function card(it, extra = {}) {
  const entry = store.getEntry(it);
  const poster = it.poster_path ? `${api.IMG}w342${it.poster_path}` : '';
  const badges = [
    extra.isNew ? `<span class="badge new">${t('isNew')}</span>` : '',
    entry?.status === 'seen' ? `<span class="badge seen">${t('seen')}</span>` : '',
    entry?.status === 'towatch' ? `<span class="badge todo">${t('toWatch')}</span>` : '',
  ].join('');
  const genres = (it.genre_ids || []).slice(0, 2).map((g) => genreName(it, g)).filter(Boolean).join(' · ');
  return `
    <button class="card" data-type="${esc(it.media_type)}" data-id="${esc(it.id)}" title="${esc(titleOf(it))}">
      <div class="poster">${poster ? `<img loading="lazy" src="${esc(poster)}" alt="">` : `<div class="noimg">${esc(titleOf(it))}</div>`}
        <div class="badges">${badges}</div>
        ${it.vote_average ? `<span class="note">★ ${Number(it.vote_average).toFixed(1)}</span>` : ''}
      </div>
      <div class="meta">
        <strong>${esc(titleOf(it))}</strong>
        <small>${it.media_type === 'tv' ? t('tv') : t('movie')} · ${esc(year(it)) || '—'}${genres ? ` · ${esc(genres)}` : ''}</small>
        ${extra.why ? `<small class="why">${esc(extra.why)}</small>` : ''}
        ${extra.rating ? `<small class="mine">${'★'.repeat(extra.rating)}${'☆'.repeat(5 - extra.rating)}</small>` : ''}
      </div>
    </button>`;
}

function grid(items, extraFn = () => ({})) {
  if (!items.length) return `<p class="empty">${t('empty')}</p>`;
  return `<div class="grid">${items.map((it) => card(it, extraFn(it))).join('')}</div>`;
}

function loading(msg = t('loading')) { return `<p class="loading">${msg}</p>`; }
function errorBox(e) { return `<p class="error">${esc(e.message || e)}</p>`; }

function langSwitch() {
  return `<div class="seg" id="langSeg">${[['fr', 'Français'], ['en', 'English']].map(([v, l]) => `<button type="button" data-l="${v}" class="${v === getLang() ? 'on' : ''}">${l}</button>`).join('')}</div>`;
}
function bindLangSwitch(again) {
  view.querySelectorAll('#langSeg button').forEach((b) => b.addEventListener('click', () => { store.setLang(b.dataset.l); applyLocale(); again(); }));
}

function needKey() {
  view.innerHTML = `
    <section class="panel">
      <div class="row spread"><h2>${t('welcome')}</h2>${langSwitch()}</div>
      <p>${t('welcomeText')}</p>
      <ol><li>${t('step1')}</li><li>${t('step2')}</li><li>${t('step3')}</li></ol>
      ${keyForm()}
    </section>`;
  bindKeyForm();
  bindLangSwitch(needKey);
}

function keyForm() {
  return `<form id="keyForm" class="row">
    <input id="keyInput" type="password" placeholder="${esc(t('keyPh'))}" value="${esc(store.getKey())}" autocomplete="off">
    <button class="primary">${t('save')}</button></form><p id="keyMsg" class="hint"></p>`;
}
function bindKeyForm() {
  $('#keyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const k = $('#keyInput').value.trim();
    api.setCredential(k);
    $('#keyMsg').textContent = t('checking');
    try {
      await api.tmdb('/configuration');
      store.setKey(k);
      $('#keyMsg').textContent = t('keyOk');
      setTimeout(() => { location.hash = '#envie'; route(); }, 400);
    } catch (err) { $('#keyMsg').textContent = err.message; }
  });
}

// ---------- Vue « Envie du moment » ----------
let lastQuery = '';
// Plateformes proposées en raccourci sur la page de recherche (identifiants TMDB) :
// seulement Netflix, Prime Video et Disney+ ; les autres se choisissent dans les réglages.
const QUICK = [[8, 'Netflix'], [119, 'Prime Video'], [337, 'Disney+']];

function filterBar() {
  const type = store.getMediaType();
  const sel = new Set(api.getProviders());
  const chips = QUICK.map(([id, name]) => ({ id, name, logo: providerNames.get(id)?.logo }));
  // Plateformes cochées dans les réglages en plus des trois raccourcis : simple rappel discret
  const others = [...sel].filter((id) => !QUICK.some(([q]) => q === id)).length;
  const chip = (p) => `<button type="button" class="pchip ${sel.has(p.id) ? 'on' : ''}" data-p="${p.id}" aria-pressed="${sel.has(p.id)}">${p.logo ? `<img src="${esc(`${api.IMG}w92${p.logo}`)}" alt="">` : ''}${esc(p.name)}</button>`;
  return `
    <div class="filters">
      <div class="frow"><span class="flabel">${t('lookFor')}</span>
        <div class="fchips" role="group">${[['movie', `🎬 ${t('movies')}`], ['tv', `📺 ${t('series')}`], ['all', t('both')]].map(([v, l]) => `<button type="button" class="tchip ${v === type ? 'on' : ''}" data-v="${v}" aria-pressed="${v === type}">${l}</button>`).join('')}</div>
      </div>
      <div class="frow"><span class="flabel">${t('onWhere')}</span>
        <div class="fchips" role="group">
          <button type="button" class="pchip ${sel.size ? '' : 'on'}" data-p="all" aria-pressed="${!sel.size}">${t('allShort')}</button>
          ${chips.map(chip).join('')}
          ${others ? `<a class="more" href="#reglages">${t('othersChecked')(others)}</a>` : ''}
        </div>
      </div>
    </div>`;
}

function bindFilterBar(onChange) {
  const box = $('#filterBox');
  box.innerHTML = filterBar();
  box.querySelectorAll('.tchip').forEach((b) => b.addEventListener('click', () => {
    store.setMediaType(b.dataset.v); bindFilterBar(onChange); onChange();
  }));
  box.querySelectorAll('.pchip').forEach((b) => b.addEventListener('click', () => {
    let next = [];
    if (b.dataset.p !== 'all') {
      const id = Number(b.dataset.p);
      const sel = new Set(api.getProviders());
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      next = [...sel];
    }
    store.setProviders(api.getRegion(), next); api.setProviders(next);
    bindFilterBar(onChange); onChange();
  }));
}

async function viewEnvie() {
  const presets = t('presets');
  view.innerHTML = `
    <section class="hero">
      <h2>${t('ask')}</h2>
      <div id="filterBox"></div>
      <form id="moodForm" class="row">
        <input id="moodInput" placeholder="${esc(t('askPh'))}" value="${esc(lastQuery)}">
        <button class="primary">${t('find')}</button>
      </form>
      <div class="chips">${presets.map((p) => `<button class="chip" data-q="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    </section>
    <div id="moodOut"></div>`;
  const rerun = () => { if (lastQuery) runMood(lastQuery); };
  bindFilterBar(rerun);
  $('#moodForm').addEventListener('submit', (e) => { e.preventDefault(); runMood($('#moodInput').value); });
  view.querySelectorAll('.hero .chip').forEach((c) => c.addEventListener('click', () => { $('#moodInput').value = c.dataset.q; runMood(c.dataset.q); }));
  if (lastQuery) runMood(lastQuery);
  // Charge logos et noms des plateformes du pays, puis redessine la barre
  if (!providerNames.size && api.hasCredential()) { await loadProviderNames(); if ($('#filterBox')) bindFilterBar(rerun); }
}

async function runMood(q) {
  lastQuery = q.trim();
  const out = $('#moodOut');
  if (!lastQuery) return;
  const mood = parseMood(lastQuery);
  // Si la phrase ne précise pas film ou série, on suit le choix Films / Séries / Les deux.
  if (mood.type === 'all') mood.type = store.getMediaType();
  const moods = mood.moods.map(moodLabel);
  out.innerHTML = loading(t('searching'));
  try {
    const pool = new Map();
    const add = (list, why) => list.forEach((it) => {
      const k = store.itemKey(it);
      if (!pool.has(k)) pool.set(k, { ...it, _why: why });
      else if (it._fromSimilar) pool.get(k)._fromSimilar = true;
    });
    let ref = null;
    let recKeys = null;
    let refWhy = '';

    if (mood.similarTo) {
      const found = await api.searchTitle(mood.similarTo);
      ref = found[0];
      if (ref) {
        const recs = await api.recommendations(ref.media_type, ref.id);
        if (!api.getProviders().length) add(recs.map((r) => ({ ...r, _fromSimilar: true })), t('closeTo')(titleOf(ref)));
        else {
          // Avec un filtre plateformes : on cherche dans le même registre que la référence,
          // sur tes plateformes, et on favorise ce qui fait aussi partie de ses recommandations.
          recKeys = new Set(recs.map((r) => store.itemKey(r)));
          for (const g of ref.genre_ids || []) (ref.media_type === 'tv' ? mood.tvGenres : mood.movieGenres).add(g);
          refWhy = t('closeTo')(titleOf(ref));
        }
      }
    }

    const types = mood.type === 'all' ? ['movie', 'tv'] : [mood.type];
    const today = new Date();
    const recentFrom = `${today.getFullYear() - 3}-01-01`;
    const jobs = types.map((type) => {
      const genres = [...(type === 'tv' ? mood.tvGenres : mood.movieGenres)];
      if (!genres.length && !mood.recent && ref) return Promise.resolve([]);
      const dateKey = type === 'tv' ? 'first_air_date' : 'primary_release_date';
      const params = {
        with_genres: genres.join('|'),
        without_genres: [...mood.exclude].join(','),
        sort_by: mood.classic ? 'vote_average.desc' : 'popularity.desc',
        'vote_count.gte': mood.classic ? 1500 : 200,
        [`${dateKey}.gte`]: mood.recent ? recentFrom : undefined,
        [`${dateKey}.lte`]: mood.classic ? '2005-12-31' : undefined,
        'with_runtime.lte': mood.short && type === 'movie' ? 105 : undefined,
      };
      return Promise.all([api.discover(type, params), api.discover(type, { ...params, page: 2 })]).then((a) => a.flat());
    });
    const found = await Promise.all(jobs);
    found.forEach((list) => add(list, moods.length ? t('fits')(moods.join(', ')) : t('popular')));

    let items = [...pool.values()];
    if (recKeys) items.forEach((it) => { if (recKeys.has(store.itemKey(it))) { it._fromSimilar = true; it._why = refWhy; } });
    if (mood.type !== 'all') items = items.filter((it) => it.media_type === mood.type);
    if (ref) items = items.filter((it) => !(it.id === ref.id && it.media_type === ref.media_type));
    const profile = tasteProfile();
    items.sort((a, b) => scoreItem(b, mood, profile) - scoreItem(a, mood, profile));
    items = items.slice(0, 30);

    const summary = [
      moods.length ? `${t('mood')} <b>${esc(moods.join(', '))}</b>` : '',
      mood.similarTo ? (ref ? `${t('near')} <b>${esc(titleOf(ref))}</b> (${esc(year(ref))})` : esc(t('notFound')(mood.similarTo))) : '',
      mood.type !== 'all' ? t('only')(mood.type) : '',
      profile.count >= 3 ? `<i>${t('tasteBoost')}</i>` : '',
      api.getProviders().length ? `${t('onWhere').toLowerCase()} <b>${esc(api.getProviders().map((id) => providerNames.get(id)?.name || QUICK.find(([q]) => q === id)?.[1] || id).join(', '))}</b>` : '',
      mood.recent ? `<b>${t('recent')}</b>` : '', mood.classic ? `<b>${t('classic')}</b>` : '', mood.short ? `<b>${t('short')}</b>` : '',
    ].filter(Boolean).join(' · ');
    out.innerHTML = `<p class="hint">${t('understood')} ${summary || t('nothing')}.</p>${grid(items, (it) => ({ why: it._why }))}`;
  } catch (e) { out.innerHTML = errorBox(e); }
}

// ---------- Vue « Tendances » ----------
let trendType = 'all';
async function viewTendances() {
  view.innerHTML = `
    <section class="toolbar">
      <h2>${t('trends')}</h2>
      <div class="seg">${[['all', t('all')], ['movie', t('movies')], ['tv', t('series')]].map(([v, l]) => `<button data-v="${v}" class="${v === trendType ? 'on' : ''}">${l}</button>`).join('')}</div>
    </section><div id="trendOut">${loading()}</div>`;
  view.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { trendType = b.dataset.v; viewTendances(); }));
  try {
    const [p1, p2] = await Promise.all([api.trending(trendType, 'week', 1), api.trending(trendType, 'week', 2)]);
    const items = [...p1, ...p2];
    const isNew = store.diffTrending(items);
    const nb = items.filter(isNew).length;
    $('#trendOut').innerHTML = (api.getProviders().length ? `<p class="hint">${t('trendsAllPlatforms')}</p>` : '') + (nb ? `<p class="hint">${t('newSince')(nb)}</p>` : '') + grid(items, (it) => ({ isNew: isNew(it) }));
  } catch (e) { $('#trendOut').innerHTML = errorBox(e); }
}

// ---------- Vue « Par genre » ----------
const genreState = { type: 'movie', genre: 35, sort: 'popularity.desc' };
async function viewGenres() {
  const map = genreMaps(getLang())[genreState.type];
  if (!map[genreState.genre]) genreState.genre = Number(Object.keys(map)[0]);
  view.innerHTML = `
    <section class="toolbar">
      <h2>${t('byTheme')}</h2>
      <div class="seg" id="gType">${[['movie', t('movies')], ['tv', t('series')]].map(([v, l]) => `<button data-v="${v}" class="${v === genreState.type ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="seg" id="gSort">${[['popularity.desc', t('popularS')], ['vote_average.desc', t('topRated')]].map(([v, l]) => `<button data-v="${v}" class="${v === genreState.sort ? 'on' : ''}">${l}</button>`).join('')}</div>
    </section>
    <div class="chips">${Object.entries(map).map(([id, n]) => `<button class="chip ${Number(id) === genreState.genre ? 'on' : ''}" data-g="${id}">${n}</button>`).join('')}</div>
    <div id="pill">${platformPill()}</div>
    <div id="genreOut">${loading()}</div>`;
  view.querySelectorAll('#gType button').forEach((b) => b.addEventListener('click', () => { genreState.type = b.dataset.v; viewGenres(); }));
  view.querySelectorAll('#gSort button').forEach((b) => b.addEventListener('click', () => { genreState.sort = b.dataset.v; viewGenres(); }));
  view.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { genreState.genre = Number(c.dataset.g); viewGenres(); }));
  refreshPill();
  try {
    const params = { with_genres: genreState.genre, sort_by: genreState.sort, 'vote_count.gte': genreState.sort.startsWith('vote') ? 1000 : 150 };
    const [a, b] = await Promise.all([api.discover(genreState.type, params), api.discover(genreState.type, { ...params, page: 2 })]);
    $('#genreOut').innerHTML = grid([...a, ...b]);
  } catch (e) { $('#genreOut').innerHTML = errorBox(e); }
}

// ---------- Vue « Mes listes » ----------
let listTab = 'towatch';
function viewListes() {
  const all = Object.values(store.getList()).sort((a, b) => b.updatedAt - a.updatedAt);
  const items = all.filter((e) => e.status === listTab);
  const count = (s) => all.filter((e) => e.status === s).length;
  view.innerHTML = `
    <section class="toolbar">
      <h2>${t('library')}</h2>
      <div class="seg">${[['towatch', `${t('toWatch')} (${count('towatch')})`], ['seen', `${t('seenP')} (${count('seen')})`], ['taste', t('taste')]].map(([v, l]) => `<button data-v="${v}" class="${v === listTab ? 'on' : ''}">${l}</button>`).join('')}</div>
    </section><div id="listOut">${listTab === 'taste' ? '' : grid(items, (it) => ({ rating: it.rating }))}</div>`;
  view.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { listTab = b.dataset.v; viewListes(); }));
  if (listTab === 'taste') viewTaste(all);
}

async function viewTaste(all) {
  const out = $('#listOut');
  const profile = buildProfile(all);
  if (profile.count < 3) { out.innerHTML = `<p class="hint">${t('tasteEmpty')}</p>`; return; }
  const names = (ids) => ids.slice(0, 6).map((g) => genreMaps(getLang()).movie[g] || genreMaps(getLang()).tv[g]).filter(Boolean);
  const chips = (ids, cls) => names(ids).map((n) => `<span class="chip ${cls}">${esc(n)}</span>`).join('');
  out.innerHTML = `
    <section class="panel taste">
      <p>${t('tasteIntro')(profile.count)}</p>
      ${profile.liked.length ? `<h3>${t('likes')}</h3><div class="chips">${chips(profile.liked, 'like')}</div>` : ''}
      ${profile.disliked.length ? `<h3>${t('dislikes')}</h3><div class="chips">${chips(profile.disliked, 'dislike')}</div>` : ''}
      <p class="hint">${t('tasteLocal')}</p>
    </section>
    <h3>${t('forYou')}</h3><div id="forYou">${loading()}</div>`;
  if (!api.hasCredential()) { $('#forYou').innerHTML = ''; return; }
  try {
    const known = new Set(all.map((e) => `${e.media_type}:${e.id}`));
    const mood = { movieGenres: new Set(), tvGenres: new Set(), exclude: new Set(profile.disliked) };
    const jobs = ['movie', 'tv'].map((type) => {
      const map = genreMaps('fr')[type];
      const liked = profile.liked.filter((g) => map[g]).slice(0, 3);
      const disliked = profile.disliked.filter((g) => map[g] && !liked.includes(g));
      if (!liked.length) return Promise.resolve([]);
      return api.discover(type, { with_genres: liked.join('|'), without_genres: disliked.join(','), 'vote_count.gte': 300 });
    });
    const items = (await Promise.all(jobs)).flat()
      .filter((it) => !known.has(`${it.media_type}:${it.id}`))
      .sort((a, b) => scoreItem(b, mood, profile) - scoreItem(a, mood, profile))
      .slice(0, 24);
    $('#forYou').innerHTML = grid(items);
  } catch (e) { $('#forYou').innerHTML = errorBox(e); }
}

// ---------- Vue « Réglages » ----------
function viewReglages() {
  view.innerHTML = `
    <section class="panel">
      <h2>${t('settings')}</h2>
      <h3>${t('lang')}</h3>${langSwitch()}
      <h3>${t('country')}</h3>
      <p class="hint">${t('countryHint')}</p>
      ${countrySelect('countrySel')}
      <h3>${t('platforms')}</h3>
      <p class="hint">${t('platformsHint')}</p>
      <div id="provPick">${api.hasCredential() ? loading() : ''}</div>
      <h3>${t('tmdbKey')}</h3>${keyForm()}
      <h3>${t('backup')}</h3>
      <p class="hint">${t('backupHint')}</p>
      <div class="row"><button id="exp">${t('exp')}</button><label class="btn">${t('imp')}<input id="imp" type="file" accept="application/json" hidden></label></div>
      <p id="ioMsg" class="hint"></p>
      <h3>${t('install')}</h3>
      <p class="hint">${t('installHint')}</p>
    </section>`;
  bindKeyForm();
  bindLangSwitch(viewReglages);
  $('#countrySel').addEventListener('change', (e) => { setCountry(e.target.value); viewReglages(); });
  renderProviderPicker();
  $('#exp').addEventListener('click', () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `cinematheque-${new Date().toISOString().slice(0, 10)}.json` });
    a.click(); URL.revokeObjectURL(a.href);
  });
  $('#imp').addEventListener('change', async (e) => {
    try { const n = store.importData(await e.target.files[0].text()); $('#ioMsg').textContent = t('imported')(n); } catch (err) { $('#ioMsg').textContent = err.message; }
  });
}

async function renderProviderPicker() {
  const box = $('#provPick');
  if (!box || !api.hasCredential()) return;
  const list = (await loadProviderNames()).slice(0, 30);
  if (!$('#provPick')) return;
  const draw = () => {
    const sel = new Set(api.getProviders());
    box.innerHTML = `<div class="provs">${list.map((p) => `
      <button type="button" class="prov-pick ${sel.has(p.id) ? 'on' : ''}" data-p="${p.id}" aria-pressed="${sel.has(p.id)}">
        <img src="${esc(`${api.IMG}w92${p.logo}`)}" alt=""><span>${esc(p.name)}</span></button>`).join('')}</div>
      ${sel.size ? `<button type="button" class="link" id="provClear">${t('clearAll')}</button>` : ''}`;
    box.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const id = Number(b.dataset.p);
      const next = sel.has(id) ? [...sel].filter((x) => x !== id) : [...sel, id];
      store.setProviders(api.getRegion(), next); api.setProviders(next); draw();
    }));
    $('#provClear', box)?.addEventListener('click', () => { store.setProviders(api.getRegion(), []); api.setProviders([]); draw(); });
  };
  draw();
}

// ---------- Fiche détaillée ----------
async function openDetail(type, id) {
  const dlg = $('#detail');
  dlg.innerHTML = `<div class="sheet">${loading()}</div>`;
  dlg.showModal();
  try {
    const d = await api.details(type, id);
    const it = { ...d, media_type: type, genre_ids: d.genres.map((g) => g.id) };
    const provRow = (label, list) => list?.length ? `<div class="prov"><span>${label}</span>${list.map((p) => `<img class="${api.getProviders().includes(p.provider_id) ? 'mine' : ''}" title="${esc(p.provider_name)}" alt="${esc(p.provider_name)}" src="${esc(`${api.IMG}w92${p.logo_path}`)}">`).join('')}</div>` : '';
    const trailer = (d.videos?.results || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer') || (d.videos?.results || []).find((v) => v.site === 'YouTube');
    const runtime = d.runtime ? `${Math.floor(d.runtime / 60)}h${String(d.runtime % 60).padStart(2, '0')}` : (d.number_of_seasons ? t('seasons')(d.number_of_seasons) : '');
    const cast = (d.credits?.cast || []).slice(0, 5).map((c) => c.name).join(', ');
    const director = (d.credits?.crew || []).find((c) => c.job === 'Director')?.name || (d.created_by || []).map((c) => c.name).join(', ');
    const render = () => {
      const entry = store.getEntry(it);
      const st = entry?.status;
      const myRating = entry?.rating || 0;
      // Toutes les régions sont renvoyées d'un coup : changer de pays ne refait pas d'appel.
      const prov = d['watch/providers']?.results?.[api.getRegion()] || {};
      const offers = provRow(t('flatrate'), prov.flatrate) + provRow(t('free'), [...(prov.free || []), ...(prov.ads || [])]) + provRow(t('rent'), prov.rent) + provRow(t('buy'), prov.buy);
      dlg.innerHTML = `
        <div class="sheet">
          ${d.backdrop_path ? `<img class="backdrop" src="${esc(`${api.IMG}w780${d.backdrop_path}`)}" alt="">` : ''}
          <button class="close" aria-label="${esc(t('close'))}">✕</button>
          <div class="body">
            <h2>${esc(titleOf(d))} <small>${esc(year(d))}</small></h2>
            <p class="hint">${type === 'tv' ? t('tv') : t('movie')}${runtime ? ` · ${runtime}` : ''} · ${esc(d.genres.map((g) => g.name).join(', '))}${d.vote_average ? ` · ★ ${Number(d.vote_average).toFixed(1)}` : ''}</p>
            ${d.tagline ? `<p class="tagline">${esc(d.tagline)}</p>` : ''}
            <p>${esc(d.overview || t('noOverview'))}</p>
            ${director ? `<p class="hint">${t('by')} ${esc(director)}${cast ? ` · ${t('with')} ${esc(cast)}` : ''}</p>` : ''}
            <div class="row actions">
              <button data-s="towatch" class="${st === 'towatch' ? 'primary' : ''}">${st === 'towatch' ? t('inList') : t('addList')}</button>
              <button data-s="seen" class="${st === 'seen' ? 'primary' : ''}">${st === 'seen' ? t('isSeen') : t('markSeen')}</button>
              ${trailer ? `<a class="btn" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${esc(encodeURIComponent(trailer.key))}">${t('trailer')}</a>` : ''}
              <button data-more>${t('similar')}</button>
            </div>
            <div class="rating">
              <span class="hint">${t('rate')}</span>
              ${[1, 2, 3, 4, 5].map((n) => `<button class="star ${n <= myRating ? 'on' : ''}" data-r="${n}" aria-label="${esc(t('stars')(n))}">★</button>`).join('')}
              ${myRating ? `<button class="link" data-r="0">${t('clearRate')}</button>` : ''}
            </div>
            <div class="row where"><h3>${t('whereIn')}</h3>${countrySelect('detailCountry')}</div>
            ${offers || `<p class="hint">${t('noOffer')}</p>`}
            ${prov.link ? `<p class="hint"><a href="${esc(prov.link)}" target="_blank" rel="noopener">${t('allOffers')}</a></p>` : ''}
          </div>
        </div>`;
      $('.close', dlg).addEventListener('click', () => dlg.close());
      dlg.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
        store.setRating(it, Number(b.dataset.r)); render(); refreshBadges();
      }));
      $('#detailCountry', dlg).addEventListener('change', (e) => { setCountry(e.target.value); render(); });
      dlg.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
        store.setStatus(it, st === b.dataset.s ? null : b.dataset.s); render(); refreshBadges();
      }));
      $('[data-more]', dlg).addEventListener('click', () => {
        dlg.close(); lastQuery = t('likeQ')(titleOf(d)); location.hash = '#envie'; route();
      });
    };
    render();
  } catch (e) { dlg.innerHTML = `<div class="sheet">${errorBox(e)}</div>`; }
}

function refreshBadges() { if ((location.hash || '#envie') === '#listes') viewListes(); }

// ---------- Navigation ----------
const ROUTES = { '#envie': viewEnvie, '#tendances': viewTendances, '#genres': viewGenres, '#listes': viewListes, '#reglages': viewReglages };
function route() {
  const h = ROUTES[location.hash] ? location.hash : '#envie';
  document.querySelectorAll('nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === h));
  if (!api.hasCredential() && h !== '#listes') return needKey();
  ROUTES[h]();
  window.scrollTo(0, 0);
}

view.addEventListener('click', (e) => {
  const c = e.target.closest('.card');
  if (c) openDetail(c.dataset.type, c.dataset.id);
});
$('#detail').addEventListener('click', (e) => { if (e.target.id === 'detail') e.target.close(); });
window.addEventListener('hashchange', route);

applyLocale();
api.setCredential(store.getKey());
route();

if ('serviceWorker' in navigator) {
  // Quand une nouvelle version de l'appli est publiée, on recharge une fois pour l'afficher tout de suite.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => r.update()).catch(() => {});
}
