import { parseMood, scoreItem, genreMaps, buildProfile } from './mood.js?v=21';
import * as api from './tmdb.js?v=21';
import * as store from './store.js?v=21';
import { resolveTv, setTv, isTv } from './tv.js?v=21';
import { qrSvg } from './qr.js?v=21';
import * as pair from './pair.js?v=21';
import * as alerts from './alerts.js?v=21';
import { intlLang, t, getLang, setLang, LANGS, moodLabel, DEFAULT_LANG, guessCountry, countryName, countryOptions } from './i18n.js?v=21';

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
  setLang(store.getLang() || DEFAULT_LANG); // anglais pour un nouvel utilisateur, sinon le choix enregistré
  api.setLocale(getLang(), store.getRegion() || guessCountry(langs));
  api.setProviders(store.effectiveProviders(api.getRegion()));
  document.querySelectorAll('nav a').forEach((a, i) => { if (t('nav')[i]) a.textContent = t('nav')[i]; });
  const gear = $('nav a[href="#reglages"]');
  if (gear) { gear.textContent = '⚙︎'; gear.setAttribute('aria-label', t('settings')); }
  renderFooter();
  renderLangMenu();
}
// Thème clair / sombre : attribut data-theme sur <html> (absent = celui du système).
const darkQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
function applyTheme() {
  const th = store.getTheme();
  if (th === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = th;
  const dark = th === 'dark' || (th === 'auto' && (darkQuery ? darkQuery.matches : true));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#14141c' : '#f4f4f8');
}
darkQuery?.addEventListener?.('change', applyTheme);

const tasteProfile = () => buildProfile(Object.values(store.getList()));

// Menu de langue dans l'en-tête (style Material : bouton globe + menu déroulant)
function renderLangMenu() {
  const header = $('header');
  if (!header) return;
  let box = $('#langMenu');
  if (!box) {
    box = document.createElement('div');
    box.id = 'langMenu';
    box.className = 'langmenu';
    header.appendChild(box);
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) closeLangMenu(); });
  }
  const cur = LANGS.find(([c]) => c === getLang()) || LANGS[0];
  box.innerHTML = `
    <button type="button" class="lm-btn" aria-haspopup="menu" aria-expanded="false" aria-controls="lmList" aria-label="${esc(t('lang'))} : ${esc(cur[1])}">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      <span>${cur[2]}</span><span class="lm-caret" aria-hidden="true">▾</span>
    </button>
    <ul class="lm-list" id="lmList" role="menu" hidden>
      ${LANGS.map(([c, name]) => `<li role="none"><button type="button" role="menuitemradio" aria-checked="${c === cur[0]}" data-lang="${c}" tabindex="-1"><span class="lm-check" aria-hidden="true">${c === cur[0] ? '✓' : ''}</span>${name}</button></li>`).join('')}
    </ul>`;
  const btn = $('.lm-btn', box);
  const list = $('.lm-list', box);
  const items = [...list.querySelectorAll('[role="menuitemradio"]')];
  const open = (focusIdx = items.findIndex((i) => i.dataset.lang === cur[0])) => {
    list.hidden = false; btn.setAttribute('aria-expanded', 'true'); items[Math.max(0, focusIdx)].focus();
  };
  btn.addEventListener('click', () => (list.hidden ? open() : closeLangMenu(true)));
  btn.addEventListener('keydown', (e) => {
    if (isTv()) return; // à la télécommande, les flèches servent à se déplacer ; OK ouvre le menu
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(e.key === 'ArrowUp' ? items.length - 1 : 0); }
  });
  list.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
    else if (e.key === 'Escape' || e.key === 'Tab') closeLangMenu(e.key === 'Escape');
  });
  items.forEach((it) => it.addEventListener('click', () => {
    const l = it.dataset.lang;
    closeLangMenu(true);
    if (l !== getLang()) { store.setLang(l); applyLocale(); route(); $('#langMenu .lm-btn')?.focus(); }
  }));
}
function closeLangMenu(refocus = false) {
  const box = $('#langMenu');
  const list = box && $('.lm-list', box);
  if (!list || list.hidden) return;
  list.hidden = true;
  $('.lm-btn', box).setAttribute('aria-expanded', 'false');
  if (refocus) $('.lm-btn', box).focus();
}

// Mention TMDB obligatoire (logo + phrase exacte des conditions d'utilisation), puis « À propos » repliable
// (confidentialité, marques, mentions légales), en pied de page : visible même sans clé TMDB.
function renderFooter() {
  let f = $('#credits');
  if (!f) { f = document.createElement('footer'); f.id = 'credits'; document.body.appendChild(f); }
  f.innerHTML = `
    <a href="https://www.themoviedb.org" target="_blank" rel="noopener" class="tmdb-logo"><img src="icons/tmdb.svg" alt="TMDB" width="120" height="16"></a>
    <p>${t('tmdbNotice')} This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    <p>${t('justwatch')} <a href="https://www.justwatch.com" target="_blank" rel="noopener">JustWatch</a>.</p>
    <details class="about"><summary>${t('about')}</summary>
      <p>${t('privacyNote')}</p>
      <p>${t('privacyPair')}</p>
      <p>${t('trademarks')}</p>
      <p>${t('legalNotice')}</p>
    </details>`;
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
  const poster = it.poster_path ? `${api.IMG}${isTv() ? 'w500' : 'w342'}${it.poster_path}` : '';
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

// Grille avec bouton « Voir plus » : next(k) charge le k-ième lot suivant (k = 1, 2…) ; les doublons sont ignorés.
function pagedGrid(out, first, next, extra = () => ({}), header = '') {
  if (!out) return; // on a changé de page entre-temps
  const shown = new Set(first.map(store.itemKey));
  out.innerHTML = header + grid(first, extra) + (first.length ? `<div class="more-row"><button type="button" class="more-btn">${t('more')}</button></div>` : '');
  const btn = $('.more-btn', out);
  if (!btn) return;
  let k = 0;
  btn.addEventListener('click', async () => {
    const hadFocus = document.activeElement === btn;
    btn.disabled = true; btn.textContent = t('loading');
    try {
      let fresh = [];
      for (let tries = 0; tries < 3 && !fresh.length; tries++) {
        k++;
        const items = await next(k);
        if (!items.length) break;
        fresh = items.filter((it) => !shown.has(store.itemKey(it)));
      }
      fresh.forEach((it) => shown.add(store.itemKey(it)));
      const g = $('.grid', out);
      g.insertAdjacentHTML('beforeend', fresh.map((it) => card(it, extra(it))).join(''));
      if (!fresh.length) btn.closest('.more-row').innerHTML = `<p class="hint">${t('noMore')}</p>`;
      else { btn.disabled = false; btn.textContent = t('more'); }
      // À la télécommande : on enchaîne sur la première nouvelle affiche.
      if (hadFocus && fresh.length) g.querySelector(`.card[data-type="${fresh[0].media_type}"][data-id="${fresh[0].id}"]`)?.focus();
    } catch (e) { btn.disabled = false; btn.textContent = t('more'); btn.insertAdjacentHTML('afterend', errorBox(e)); }
  });
}

function loading(msg = t('loading')) { return `<p class="loading">${msg}</p>`; }
// Grille d'affiches grises animées pendant le chargement (le texte reste lu par les lecteurs d'écran).
function skeleton(msg = t('loading'), n = 12) {
  return `<p class="sr-only" role="status">${msg}</p><div class="grid skel" aria-hidden="true">${'<div class="sk-card"><div class="sk-poster"></div><div class="sk-line"></div><div class="sk-line short"></div></div>'.repeat(n)}</div>`;
}
function errorBox(e) { return `<p class="error">${esc(e.message || e)}</p>`; }

function langSwitch() {
  return `<div class="seg" id="langSeg">${LANGS.map(([v, l]) => `<button type="button" data-l="${v}" class="${v === getLang() ? 'on' : ''}">${l}</button>`).join('')}</div>`;
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
      ${isTv() ? receivePanel() : ''}
      ${keyForm()}
      ${isTv() ? '' : receivePanel()}
    </section>`;
  bindKeyForm();
  bindLangSwitch(needKey);
  startReceive();
}

// ---------- Transfert par QR code (voir pair.js) ----------
let stopListen = null;
function receivePanel() {
  return `<div class="pairbox" id="pairBox">
      <div class="qr" id="pairQr"></div>
      <div>
        <h3>${t('pairTitle')}</h3>
        <ol>${t('pairSteps').map((s) => `<li>${s}</li>`).join('')}</ol>
        <p class="hint" id="pairMsg" role="status"></p>
      </div>
    </div>`;
}
function startReceive() {
  const box = $('#pairBox');
  if (!box) return;
  stopListen?.();
  const s = pair.newSession();
  const link = pair.pairLink(location.origin + location.pathname, s);
  $('#pairQr').innerHTML = qrSvg(link, { label: t('pairTitle') });
  const msg = $('#pairMsg');
  msg.textContent = t('pairWaiting');
  stopListen = pair.listen(s, (data) => {
    stopListen = null;
    const n = store.importTransfer(data);
    applyTheme(); applyLocale(); api.setCredential(store.getKey()); providerNames = new Map();
    if ($('#pairMsg')) $('#pairMsg').textContent = t('pairGot')(n);
    setTimeout(() => { location.hash = '#envie'; route(); }, 1500);
  }, () => { if ($('#pairMsg')) $('#pairMsg').textContent = t('pairRetry'); });
}

// Page ouverte en scannant le QR code : on envoie la clé, les réglages et (au choix) les listes.
function viewPair(s) {
  document.querySelectorAll('nav a').forEach((a) => a.classList.remove('on'));
  const n = Object.keys(store.getList()).length;
  if (!store.getKey()) {
    view.innerHTML = `<section class="panel"><h2>${t('sendTitle')}</h2><p>${t('sendNoKey')}</p><a class="btn" href="#envie">${t('close')}</a></section>`;
    return;
  }
  view.innerHTML = `
    <section class="panel">
      <h2>${t('sendTitle')}</h2>
      <p>${t('sendIntro')}</p>
      <label class="check"><input type="checkbox" id="sendLists" ${n ? 'checked' : ''}> ${esc(t('sendLists')(n))}</label>
      <div class="row"><button type="button" class="primary" id="sendGo">${t('sendBtn')}</button><a class="btn" href="#envie">${t('cancel')}</a></div>
      <p class="hint" id="sendMsg" role="status"></p>
    </section>`;
  const btn = $('#sendGo');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    $('#sendMsg').textContent = t('sending');
    try {
      await pair.send(s, store.exportTransfer($('#sendLists').checked));
      $('#sendMsg').textContent = t('sendDone');
      btn.remove();
      // Le lien d'appairage ne doit pas resservir : on l'efface de l'historique.
      history.replaceState(null, '', `${location.pathname}#envie`);
    } catch (e) { btn.disabled = false; $('#sendMsg').textContent = `${t('pairErr')} (${e.message})`; }
  });
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
// Noms de secours des plateformes par défaut (avant le chargement de la liste TMDB)
const QUICK = [[8, 'Netflix'], [119, 'Prime Video'], [337, 'Disney+']];
const provName = (id) => providerNames.get(id)?.name || QUICK.find(([q]) => q === id)?.[1] || '';

function filterBar() {
  const type = store.getMediaType();
  // Les puces = mes plateformes (réglages). « Toutes » = toutes mes plateformes.
  const region = api.getRegion();
  const mine = store.getProviders(region);
  const sel = new Set(store.getActive(region).filter((id) => mine.includes(id)));
  const chips = mine.map((id) => ({ id, name: provName(id), logo: providerNames.get(id)?.logo })).filter((p) => p.name);
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
          <a class="more" href="#reglages">${t('addPlatform')}</a>
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
    const region = api.getRegion();
    let next = [];
    if (b.dataset.p !== 'all') {
      const id = Number(b.dataset.p);
      const sel = new Set(store.getActive(region));
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      next = [...sel];
    }
    store.setActive(region, next); api.setProviders(store.effectiveProviders(region));
    bindFilterBar(onChange); onChange();
  }));
}

// Recherche : « par envie » (phrase libre) ou « par titre » (nom d'un film ou d'une série).
let searchMode = 'mood';
let lastTitle = '';
const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const SPEECH_LANG = { en: 'en-US', fr: 'fr-FR', es: 'es-ES', de: 'de-DE', it: 'it-IT', pt: 'pt-PT', ary: 'fr-FR' };
const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

async function viewEnvie() {
  const presets = t('presets');
  const isTitle = searchMode === 'title';
  view.innerHTML = `
    <section class="hero">
      <h2>${t('ask')}</h2>
      <div id="filterBox"></div>
      <div class="seg modes" id="modeSeg" role="group" aria-label="${esc(t('find'))}">${[['mood', `✨ ${t('byMood')}`], ['title', `🔎 ${t('byTitle')}`]].map(([v, l]) => `<button type="button" data-m="${v}" class="${v === searchMode ? 'on' : ''}" aria-pressed="${v === searchMode}">${l}</button>`).join('')}</div>
      <form id="moodForm" class="row searchrow" autocomplete="off">
        <div class="field">
          <input id="moodInput" type="search" enterkeyhint="search" placeholder="${esc(isTitle ? t('titlePh') : t('askPh'))}" value="${esc(isTitle ? lastTitle : lastQuery)}" aria-autocomplete="list" aria-controls="sugg">
          <ul id="sugg" class="sugg" role="listbox" aria-label="${esc(t('suggestions'))}" hidden></ul>
        </div>
        ${SR ? `<button type="button" id="micBtn" class="mic" aria-label="${esc(t('voice'))}" title="${esc(t('voice'))}">🎤</button>` : ''}
        <button class="primary">${t('find')}</button>
      </form>
      <p class="hint" id="voiceMsg" role="status" hidden></p>
      <div class="chips" id="presets" ${isTitle ? 'hidden' : ''}>${presets.map((p) => `<button type="button" class="chip" data-q="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    </section>
    <div id="moodOut"></div>`;
  const input = $('#moodInput');
  const rerun = () => { if (searchMode === 'mood' && lastQuery) runMood(lastQuery); if (searchMode === 'title' && lastTitle) runTitle(lastTitle); };
  bindFilterBar(rerun);
  const go = (q) => { hideSugg(); if (searchMode === 'title') runTitle(q); else runMood(q); };
  $('#moodForm').addEventListener('submit', (e) => { e.preventDefault(); go(input.value); });
  view.querySelectorAll('#presets .chip').forEach((c) => c.addEventListener('click', () => { input.value = c.dataset.q; go(c.dataset.q); }));
  view.querySelectorAll('#modeSeg button').forEach((b) => b.addEventListener('click', () => {
    if (searchMode === b.dataset.m) return;
    searchMode = b.dataset.m; viewEnvie(); $(`#modeSeg [data-m="${searchMode}"]`)?.focus();
  }));
  bindSuggestions(input, go);
  if (SR) $('#micBtn').addEventListener('click', () => startVoice(input, go));
  rerun();
  // Charge logos et noms des plateformes du pays, puis redessine la barre
  if ((!providerNames.size || store.getProviders(api.getRegion()).some((id) => !providerNames.has(id))) && api.hasCredential()) { await loadProviderNames(); if ($('#filterBox')) bindFilterBar(rerun); }
}

// ---------- Suggestions pendant la saisie ----------
let suggTimer = 0;
let suggSeq = 0;
function hideSugg() { const l = $('#sugg'); if (l) { l.hidden = true; l.innerHTML = ''; } }
function bindSuggestions(input, go) {
  const list = $('#sugg');
  const show = (html) => { list.innerHTML = html; list.hidden = !html; };
  input.addEventListener('input', () => {
    clearTimeout(suggTimer);
    const q = input.value.trim();
    const seq = ++suggSeq;
    if (q.length < 2) { hideSugg(); return; }
    if (searchMode === 'mood') {
      // Phrases toutes faites qui contiennent ce qui est tapé (sans tenir compte des accents)
      const words = norm(q).split(/\s+/).filter((w) => w.length > 1);
      const hits = t('presets').filter((p) => words.every((w) => norm(p).includes(w))).slice(0, 5);
      show(hits.map((p) => `<li role="none"><button type="button" role="option" class="sg" data-q="${esc(p)}">✨ ${esc(p)}</button></li>`).join(''));
      return;
    }
    // Par titre : les 6 premiers résultats TMDB, une fois la frappe arrêtée
    suggTimer = setTimeout(async () => {
      try {
        const items = (await api.searchTitle(q)).slice(0, 6);
        if (seq !== suggSeq) return;
        show(items.map((it) => `<li role="none"><button type="button" role="option" class="sg title" data-type="${esc(it.media_type)}" data-id="${esc(it.id)}">
          ${it.poster_path ? `<img src="${esc(`${api.IMG}w92${it.poster_path}`)}" alt="">` : '<span class="noimg-s" aria-hidden="true">🎬</span>'}
          <span><strong>${esc(titleOf(it))}</strong><small>${it.media_type === 'tv' ? t('tv') : t('movie')} · ${esc(year(it)) || '—'}</small></span></button></li>`).join(''));
      } catch { hideSugg(); }
    }, 250);
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.sg');
    if (!b) return;
    if (b.dataset.id) { hideSugg(); openDetail(b.dataset.type, b.dataset.id); return; }
    input.value = b.dataset.q; go(b.dataset.q);
  });
  // Clavier (téléphone / ordinateur) : flèche bas pour entrer dans la liste, Échap pour la fermer.
  const items = () => [...list.querySelectorAll('.sg')];
  input.addEventListener('keydown', (e) => {
    if (isTv()) return;
    if (e.key === 'ArrowDown' && !list.hidden && items().length) { e.preventDefault(); items()[0].focus(); }
    if (e.key === 'Escape') hideSugg();
  });
  list.addEventListener('keydown', (e) => {
    if (isTv()) return;
    const all = items(); const i = all.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); all[Math.min(i + 1, all.length - 1)].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (i <= 0) input.focus(); else all[i - 1].focus(); }
    if (e.key === 'Escape') { hideSugg(); input.focus(); }
  });
}
if (typeof document !== 'undefined') document.addEventListener('click', (e) => { if (!e.target.closest?.('.field')) hideSugg(); });

// ---------- Recherche vocale (si le navigateur la propose) ----------
let recog = null;
function startVoice(input, go) {
  const mic = $('#micBtn');
  const msg = $('#voiceMsg');
  if (recog) { recog.stop(); return; }
  recog = new SR();
  recog.lang = SPEECH_LANG[getLang()] || 'en-US';
  recog.interimResults = true;
  recog.maxAlternatives = 1;
  let finalText = '';
  mic.classList.add('on'); mic.setAttribute('aria-pressed', 'true');
  msg.hidden = false; msg.textContent = t('listening');
  recog.onresult = (e) => {
    const txt = [...e.results].map((r) => r[0].transcript).join('');
    input.value = txt;
    if (e.results[e.results.length - 1].isFinal) finalText = txt;
  };
  recog.onerror = (e) => { msg.textContent = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? t('voiceDenied') : t('voiceErr'); };
  recog.onend = () => {
    recog = null;
    mic.classList.remove('on'); mic.setAttribute('aria-pressed', 'false');
    if (finalText.trim()) { msg.hidden = true; go(finalText); }
  };
  try { recog.start(); } catch { recog = null; msg.textContent = t('voiceErr'); }
}

// ---------- Recherche par titre ----------
async function runTitle(q) {
  lastTitle = q.trim();
  const out = $('#moodOut');
  if (!lastTitle || !out) return;
  out.innerHTML = skeleton(t('searching'));
  try {
    const first = await api.searchTitle(lastTitle);
    pagedGrid(out, first, (k) => api.searchTitle(lastTitle, k + 1), () => ({}), `<p class="hint">${esc(t('titleResults')(lastTitle))}</p>`);
  } catch (e) { out.innerHTML = errorBox(e); }
}

async function runMood(q) {
  lastQuery = q.trim();
  const out = $('#moodOut');
  if (!lastQuery || !out) return;
  const mood = parseMood(lastQuery);
  // Si la phrase ne précise pas film ou série, on suit le choix Films / Séries / Les deux.
  if (mood.type === 'all') mood.type = store.getMediaType();
  const moods = mood.moods.map(moodLabel);
  out.innerHTML = skeleton(t('searching'));
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
    const paramsFor = (type) => {
      const genres = [...(type === 'tv' ? mood.tvGenres : mood.movieGenres)];
      if (!genres.length && !mood.recent && ref) return null;
      const dateKey = type === 'tv' ? 'first_air_date' : 'primary_release_date';
      return {
        with_genres: genres.join('|'),
        without_genres: [...mood.exclude].join(','),
        sort_by: mood.classic ? 'vote_average.desc' : 'popularity.desc',
        'vote_count.gte': mood.classic ? 1500 : 200,
        [`${dateKey}.gte`]: mood.recent ? recentFrom : undefined,
        [`${dateKey}.lte`]: mood.classic ? '2005-12-31' : undefined,
        'with_runtime.lte': mood.short && type === 'movie' ? 105 : undefined,
      };
    };
    const why = moods.length ? t('fits')(moods.join(', ')) : t('popular');
    // Pages p1 et p2 de la recherche TMDB pour chaque type (films / séries)
    const fetchPages = async (p1, p2) => {
      const lists = await Promise.all(types.map((type) => {
        const params = paramsFor(type);
        if (!params) return Promise.resolve([]);
        return Promise.all([api.discover(type, { ...params, page: p1 }), api.discover(type, { ...params, page: p2 })]).then((a) => a.flat());
      }));
      lists.forEach((list) => add(list, why));
    };
    await fetchPages(1, 2);

    const profile = tasteProfile();
    const used = new Set();
    // Classe tout ce qui a été trouvé et pas encore montré
    const ranked = () => {
      let items = [...pool.values()].filter((it) => !used.has(store.itemKey(it)));
      if (recKeys) items.forEach((it) => { if (recKeys.has(store.itemKey(it))) { it._fromSimilar = true; it._why = refWhy; } });
      if (mood.type !== 'all') items = items.filter((it) => it.media_type === mood.type);
      if (ref) items = items.filter((it) => !(it.id === ref.id && it.media_type === ref.media_type));
      return items.sort((a, b) => scoreItem(b, mood, profile) - scoreItem(a, mood, profile));
    };
    const take = (items) => { const sel = items.slice(0, 30); sel.forEach((it) => used.add(store.itemKey(it))); return sel; };
    const first = take(ranked());

    const summary = [
      moods.length ? `${t('mood')} <b>${esc(moods.join(', '))}</b>` : '',
      mood.similarTo ? (ref ? `${t('near')} <b>${esc(titleOf(ref))}</b> (${esc(year(ref))})` : esc(t('notFound')(mood.similarTo))) : '',
      mood.type !== 'all' ? t('only')(mood.type) : '',
      profile.count >= 3 ? `<i>${t('tasteBoost')}</i>` : '',
      api.getProviders().length ? `${t('onWhere').toLowerCase()} <b>${esc(api.getProviders().map((id) => provName(id) || id).join(', '))}</b>` : '',
      mood.recent ? `<b>${t('recent')}</b>` : '', mood.classic ? `<b>${t('classic')}</b>` : '', mood.short ? `<b>${t('short')}</b>` : '',
    ].filter(Boolean).join(' · ');
    // « Voir plus » : d'abord le reste de ce qui a déjà été trouvé, puis les pages TMDB suivantes.
    const next = async (k) => {
      if (ranked().length < 30) await fetchPages(2 * k + 1, 2 * k + 2);
      return take(ranked());
    };
    pagedGrid(out, first, next, (it) => ({ why: it._why }), `<p class="hint">${t('understood')} ${summary || t('nothing')}.</p>`);
  } catch (e) { out.innerHTML = errorBox(e); }
}

// ---------- Vue « Tendances » ----------
let trendType = 'all';
async function viewTendances() {
  view.innerHTML = `
    <section class="toolbar">
      <h2>${t('trends')}</h2>
      <div class="seg">${[['all', t('all')], ['movie', t('movies')], ['tv', t('series')]].map(([v, l]) => `<button data-v="${v}" class="${v === trendType ? 'on' : ''}">${l}</button>`).join('')}</div>
    </section><div id="trendOut">${skeleton()}</div>`;
  view.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { trendType = b.dataset.v; viewTendances(); }));
  try {
    const type = trendType;
    const [p1, p2] = await Promise.all([api.trending(type, 'week', 1), api.trending(type, 'week', 2)]);
    const items = [...p1, ...p2];
    const isNew = store.diffTrending(items);
    const nb = items.filter(isNew).length;
    const header = (api.getProviders().length ? `<p class="hint">${t('trendsAllPlatforms')}</p>` : '') + (nb ? `<p class="hint">${t('newSince')(nb)}</p>` : '');
    const next = (k) => Promise.all([api.trending(type, 'week', 2 * k + 1), api.trending(type, 'week', 2 * k + 2)]).then((a) => a.flat());
    pagedGrid($('#trendOut'), items, next, (it) => ({ isNew: isNew(it) }), header);
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
    <div id="genreOut">${skeleton()}</div>`;
  view.querySelectorAll('#gType button').forEach((b) => b.addEventListener('click', () => { genreState.type = b.dataset.v; viewGenres(); }));
  view.querySelectorAll('#gSort button').forEach((b) => b.addEventListener('click', () => { genreState.sort = b.dataset.v; viewGenres(); }));
  view.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { genreState.genre = Number(c.dataset.g); viewGenres(); }));
  refreshPill();
  try {
    const params = { with_genres: genreState.genre, sort_by: genreState.sort, 'vote_count.gte': genreState.sort.startsWith('vote') ? 1000 : 150 };
    const type = genreState.type;
    const [a, b] = await Promise.all([api.discover(type, params), api.discover(type, { ...params, page: 2 })]);
    const next = (k) => Promise.all([api.discover(type, { ...params, page: 2 * k + 1 }), api.discover(type, { ...params, page: 2 * k + 2 })]).then((r) => r.flat());
    pagedGrid($('#genreOut'), [...a, ...b], next);
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
    <h3>${t('forYou')}</h3><div id="forYou">${skeleton(t('loading'), 6)}</div>`;
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
      <h3>${t('theme')}</h3>
      <div class="seg" id="themeSeg">${[['auto', t('themeAuto')], ['light', `☀️ ${t('themeLight')}`], ['dark', `🌙 ${t('themeDark')}`]].map(([v, l]) => `<button type="button" data-t="${v}" class="${v === store.getTheme() ? 'on' : ''}" aria-pressed="${v === store.getTheme()}">${l}</button>`).join('')}</div>
      <h3>${t('display')}</h3>
      <p class="hint">${t('displayHint')}</p>
      <div class="seg" id="dispSeg">${[['auto', t('dispAuto')], ['screen', t('dispScreen')], ['tv', `📺 ${t('dispTv')}`]].map(([v, l]) => `<button type="button" data-d="${v}" class="${v === store.getDisplay() ? 'on' : ''}" aria-pressed="${v === store.getDisplay()}">${l}</button>`).join('')}</div>
      <h3>${t('country')}</h3>
      <p class="hint">${t('countryHint')}</p>
      ${countrySelect('countrySel')}
      <h3>${t('platforms')}</h3>
      <p class="hint">${t('platformsHint')}</p>
      <div id="provPick">${api.hasCredential() ? loading() : ''}</div>
      <h3>${t('tmdbKey')}</h3>${keyForm()}
      <h3>${t('transfer')}</h3>
      <p class="hint">${t('transferHint')}</p>
      <div id="recvSlot"><button type="button" id="recvBtn">📲 ${t('receiveBtn')}</button></div>
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
  view.querySelectorAll('#themeSeg button').forEach((b) => b.addEventListener('click', () => {
    store.setTheme(b.dataset.t); applyTheme(); viewReglages(); $(`#themeSeg [data-t="${b.dataset.t}"]`)?.focus();
  }));
  $('#recvBtn').addEventListener('click', () => {
    $('#recvSlot').innerHTML = receivePanel();
    startReceive();
    $('#pairBox').scrollIntoView({ block: 'center' });
  });
  view.querySelectorAll('#dispSeg button').forEach((b) => b.addEventListener('click', () => {
    store.setDisplay(b.dataset.d); setTv(resolveTv(b.dataset.d, location.search)); viewReglages(); $(`#dispSeg [data-d="${b.dataset.d}"]`)?.focus();
  }));
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
  const all = await loadProviderNames();
  // les 30 principales du pays, plus celles déjà cochées si elles sont plus loin dans la liste
  const mine = store.getProviders(api.getRegion());
  const list = [...all.slice(0, 30), ...all.slice(30).filter((p) => mine.includes(p.id))];
  if (!$('#provPick')) return;
  const draw = () => {
    const sel = new Set(store.getProviders(api.getRegion()));
    box.innerHTML = `<div class="provs">${list.map((p) => `
      <button type="button" class="prov-pick ${sel.has(p.id) ? 'on' : ''}" data-p="${p.id}" aria-pressed="${sel.has(p.id)}">
        <img src="${esc(`${api.IMG}w92${p.logo}`)}" alt=""><span>${esc(p.name)}</span></button>`).join('')}</div>
      ${sel.size ? `<button type="button" class="link" id="provClear">${t('clearAll')}</button>` : ''}`;
    box.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const id = Number(b.dataset.p);
      const next = sel.has(id) ? [...sel].filter((x) => x !== id) : [...sel, id];
      store.setProviders(api.getRegion(), next); api.setProviders(store.effectiveProviders(api.getRegion())); draw();
    }));
    $('#provClear', box)?.addEventListener('click', () => { store.setProviders(api.getRegion(), []); api.setProviders([]); draw(); });
  };
  draw();
}

// ---------- Fiche détaillée ----------
async function openDetail(type, id) {
  const dlg = $('#detail');
  dlg.innerHTML = `<div class="sheet"><div class="sk-backdrop" aria-hidden="true"></div><div class="body"><p class="sr-only" role="status">${t('loading')}</p><div class="sk-line wide"></div><div class="sk-line"></div><div class="sk-line"></div></div></div>`;
  dlg.showModal();
  // À la fermeture, on vide la fiche : une bande-annonce en cours s'arrête.
  dlg.addEventListener('close', () => { dlg.innerHTML = ''; }, { once: true });
  let playing = false;
  try {
    const d = await api.details(type, id);
    const it = { ...d, media_type: type, genre_ids: d.genres.map((g) => g.id) };
    const provRow = (label, list) => list?.length ? `<div class="prov"><span>${label}</span>${list.map((p) => `<img class="${store.getProviders(api.getRegion()).includes(p.provider_id) ? 'mine' : ''}" title="${esc(p.provider_name)}" alt="${esc(p.provider_name)}" src="${esc(`${api.IMG}w92${p.logo_path}`)}">`).join('')}</div>` : '';
    const trailer = (d.videos?.results || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer') || (d.videos?.results || []).find((v) => v.site === 'YouTube');
    const runtime = d.runtime ? `${Math.floor(d.runtime / 60)}h${String(d.runtime % 60).padStart(2, '0')}` : (d.number_of_seasons ? t('seasons')(d.number_of_seasons) : '');
    const cast = (d.credits?.cast || []).slice(0, 12);
    const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    const castBlock = cast.length ? `<h3>${t('cast')}</h3><ul class="cast">${cast.map((c) => `
      <li><button type="button" class="person" data-person="${esc(c.id)}" aria-label="${esc(t('seePerson')(c.name))}">${c.profile_path ? `<img loading="lazy" src="${esc(`${api.IMG}w185${c.profile_path}`)}" alt="">` : `<span class="noface" aria-hidden="true">${esc(initials(c.name || '?'))}</span>`}
        <strong>${esc(c.name)}</strong>${c.character ? `<small>${esc(c.character)}</small>` : ''}</button></li>`).join('')}</ul>` : '';
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
          ${playing ? `<div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${esc(encodeURIComponent(trailer.key))}?autoplay=1&rel=0&playsinline=1&hl=${esc(getLang())}" title="${esc(`${t('trailer')} : ${titleOf(d)}`)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen tabindex="-1"></iframe></div>
            <p class="hint yt"><a href="https://www.youtube.com/watch?v=${esc(encodeURIComponent(trailer.key))}" target="_blank" rel="noopener">${t('onYoutube')}</a></p>`
    : (d.backdrop_path ? `<img class="backdrop" src="${esc(`${api.IMG}${isTv() ? 'w1280' : 'w780'}${d.backdrop_path}`)}" alt="">` : '')}
          <button class="close" aria-label="${esc(t('close'))}">✕</button>
          <div class="body">
            <h2>${esc(titleOf(d))} <small>${esc(year(d))}</small></h2>
            <p class="hint">${type === 'tv' ? t('tv') : t('movie')}${runtime ? ` · ${runtime}` : ''} · ${esc(d.genres.map((g) => g.name).join(', '))}${d.vote_average ? ` · ★ ${Number(d.vote_average).toFixed(1)}` : ''}</p>
            ${d.tagline ? `<p class="tagline">${esc(d.tagline)}</p>` : ''}
            <p>${esc(d.overview || t('noOverview'))}</p>
            ${director ? `<p class="hint">${t('by')} ${esc(director)}</p>` : ''}
            <div class="row actions">
              <button data-s="towatch" class="${st === 'towatch' ? 'primary' : ''}">${st === 'towatch' ? t('inList') : t('addList')}</button>
              <button data-s="seen" class="${st === 'seen' ? 'primary' : ''}">${st === 'seen' ? t('isSeen') : t('markSeen')}</button>
              ${trailer ? `<button type="button" data-trailer>${playing ? t('closeTrailer') : t('trailer')}</button>` : ''}
              <button data-more>${t('similar')}</button>
            </div>
            <div class="rating">
              <span class="hint">${t('rate')}</span>
              ${[1, 2, 3, 4, 5].map((n) => `<button class="star ${n <= myRating ? 'on' : ''}" data-r="${n}" aria-label="${esc(t('stars')(n))}">★</button>`).join('')}
              ${myRating ? `<button class="link" data-r="0">${t('clearRate')}</button>` : ''}
            </div>
            ${castBlock}
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
        store.setStatus(it, st === b.dataset.s ? null : b.dataset.s);
        // Ajout à « À voir » : on mémorise tout de suite où il est diffusé, pour les alertes à venir.
        if (store.getEntry(it)?.status === 'towatch') store.setSnap(store.itemKey(it), alerts.snapshot(d, api.getRegion()));
        render(); refreshBadges();
      }));
      $('[data-trailer]', dlg)?.addEventListener('click', () => {
        playing = !playing; render();
        $('[data-trailer]', dlg)?.focus();
        if (playing) $('.player', dlg)?.scrollIntoView({ block: 'nearest' });
      });
      dlg.querySelectorAll('[data-person]').forEach((b) => b.addEventListener('click', () => {
        dlg.close(); location.hash = `#personne/${b.dataset.person}`;
      }));
      $('[data-more]', dlg).addEventListener('click', () => {
        dlg.close(); lastQuery = t('likeQ')(titleOf(d)); location.hash = '#envie'; route();
      });
    };
    render();
  } catch (e) { dlg.innerHTML = `<div class="sheet">${errorBox(e)}</div>`; }
}

// ---------- Fiche acteur / actrice ----------
async function viewPerson(id) {
  document.querySelectorAll('nav a').forEach((a) => a.classList.remove('on'));
  view.innerHTML = `<section class="person-head"><div class="sk-face" aria-hidden="true"></div><div><div class="sk-line wide"></div><div class="sk-line"></div></div></section>${skeleton()}`;
  try {
    const p = await api.person(id);
    if (location.hash !== `#personne/${id}`) return; // on est parti entre-temps
    // Rôles (films et séries), sans doublons, les plus connus d'abord
    const seen = new Map();
    for (const c of [...(p.combined_credits?.cast || []), ...(p.combined_credits?.crew || [])]) {
      if (!['movie', 'tv'].includes(c.media_type)) continue;
      const k = `${c.media_type}:${c.id}`;
      if (!seen.has(k)) seen.set(k, { ...c, _role: c.character || c.job || '' });
    }
    const all = [...seen.values()].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
    const fmt = (d) => { try { return new Intl.DateTimeFormat(intlLang(), { dateStyle: 'long' }).format(new Date(d)); } catch { return d; } };
    const age = (from, to = new Date()) => Math.floor((new Date(to) - new Date(from)) / 31557600000);
    const life = [
      p.birthday ? t('born')(fmt(p.birthday), p.deathday ? null : age(p.birthday), p.place_of_birth) : '',
      p.deathday ? t('died')(fmt(p.deathday), p.birthday ? age(p.birthday, p.deathday) : null) : '',
    ].filter(Boolean).join(' · ');
    const bio = (p.biography || '').trim();
    const short = bio.length > 600 ? `${bio.slice(0, bio.lastIndexOf(' ', 560))}…` : bio;
    view.innerHTML = `
      <button type="button" class="link back" id="personBack">← ${t('back')}</button>
      <section class="person-head">
        ${p.profile_path ? `<img class="face" src="${esc(`${api.IMG}w342${p.profile_path}`)}" alt="">` : `<span class="face noface" aria-hidden="true">${esc((p.name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join(''))}</span>`}
        <div>
          <h2>${esc(p.name)}</h2>
          ${life ? `<p class="hint">${esc(life)}</p>` : ''}
          ${bio ? (short === bio ? `<p class="bio">${esc(bio)}</p>` : `<p class="bio" id="bio">${esc(short)}</p><button type="button" class="link" id="bioMore">${t('readMore')}</button>`) : ''}
        </div>
      </section>
      <h3>${t('filmography')(all.length)}</h3>
      <div id="personOut"></div>`;
    $('#personBack').addEventListener('click', () => { if (history.length > 1) history.back(); else { location.hash = '#envie'; } });
    $('#bioMore')?.addEventListener('click', (e) => { $('#bio').textContent = bio; e.target.remove(); });
    let k = 0;
    const page = (n) => all.slice(n * 30, n * 30 + 30);
    pagedGrid($('#personOut'), page(0), async () => page(++k), (it) => ({ why: it._role ? t('as')(it._role) : '' }));
  } catch (e) { view.innerHTML = errorBox(e); }
}

function refreshBadges() { if ((location.hash || '#envie') === '#listes') viewListes(); renderAlerts(); }

// ---------- Alertes « À voir » ----------
// Bandeau en haut des pages Envie et Mes listes.
function renderAlerts() {
  const box = $('#alerts');
  if (!box) return;
  const here = ['', '#envie', '#listes'].includes(location.hash);
  const list = here && api.hasCredential() ? store.getAlerts() : [];
  box.hidden = !list.length;
  if (!list.length) { box.innerHTML = ''; return; }
  const text = (a) => (a.kind === 'season' ? t('alertSeason')(a.title, a.n) : t('alertPlatform')(a.title, a.names.join(', ')));
  box.innerHTML = `
    <div class="alerts-head"><h2>${t('alertsTitle')}</h2><button type="button" class="linkish" data-clear>${t('alertsClear')}</button></div>
    <ul>${list.map((a) => `
      <li><button type="button" class="alert-open" data-type="${esc(a.media_type)}" data-id="${esc(a.id)}" data-key="${esc(a.key)}">
        ${a.poster_path ? `<img src="${esc(`${api.IMG}w92${a.poster_path}`)}" alt="">` : ''}<span>${esc(text(a))}</span></button>
        <button type="button" class="alert-x" data-key="${esc(a.key)}" aria-label="${esc(t('alertHide')(a.title))}">✕</button></li>`).join('')}</ul>`;
}
$('#alerts')?.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.matches('[data-clear]')) store.clearAlerts();
  else if (b.matches('.alert-x')) store.dismissAlert(b.dataset.key);
  else if (b.matches('.alert-open')) { store.dismissAlert(b.dataset.key); openDetail(b.dataset.type, b.dataset.id); }
  renderAlerts();
});

// Vérifie (au plus une fois par jour et par titre, 4 à la fois) les titres « À voir ».
let checking = false;
async function checkAlerts() {
  if (checking || !api.hasCredential()) return;
  checking = true;
  try {
    const region = api.getRegion();
    const mine = store.getProviders(region);
    const snaps = store.getSnaps();
    const list = store.getList();
    const keys = alerts.due(list, snaps);
    const found = [];
    for (let i = 0; i < keys.length; i += 4) {
      await Promise.all(keys.slice(i, i + 4).map(async (k) => {
        const [type, id] = k.split(':');
        try {
          const cur = alerts.snapshot(await api.details(type, id), region);
          alerts.compare(snaps[k], cur, mine).forEach((a) => found.push({ ...a, key: k, id: Number(id), media_type: type, title: list[k].title, poster_path: list[k].poster_path }));
          store.setSnap(k, cur);
        } catch { /* hors ligne ou titre retiré : on réessaiera */ }
      }));
    }
    store.addAlerts(found);
  } finally { checking = false; }
  renderAlerts();
}

// ---------- Navigation ----------
const ROUTES = { '#envie': viewEnvie, '#tendances': viewTendances, '#genres': viewGenres, '#listes': viewListes, '#reglages': viewReglages };
function route() {
  stopListen?.(); stopListen = null;
  const p = pair.parsePair(location.hash);
  renderAlerts();
  if (p) { viewPair(p); window.scrollTo(0, 0); return; }
  const person = /^#personne\/(\d+)$/.exec(location.hash);
  if (person && api.hasCredential()) { viewPerson(person[1]); window.scrollTo(0, 0); return; }
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

applyTheme();
setTv(resolveTv(store.getDisplay(), location.search));
applyLocale();
api.setCredential(store.getKey());
route();
// Alertes : au lancement, puis quand on revient sur l'appli (les titres déjà vérifiés du jour sont sautés).
setTimeout(checkAlerts, 1500);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkAlerts(); });

if ('serviceWorker' in navigator) {
  // Quand une nouvelle version de l'appli est publiée, on recharge une fois pour l'afficher tout de suite.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => r.update()).catch(() => {});
}
