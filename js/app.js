import { parseMood, scoreItem, MOVIE_GENRES, TV_GENRES } from './mood.js';
import * as api from './tmdb.js';
import * as store from './store.js';

const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const year = (it) => (it.release_date || it.first_air_date || it.date || '').slice(0, 4);
const titleOf = (it) => it.title || it.name || '';
const genreName = (it, g) => (it.media_type === 'tv' ? TV_GENRES : MOVIE_GENRES)[g] || MOVIE_GENRES[g] || TV_GENRES[g];

const PRESETS = [
  'Soirée cosy, drôle avec de l\'intrigue',
  'Un film d\'action récent qui ne se prend pas au sérieux',
  'Une série à suspense comme Dark',
  'Un truc qui fait peur mais pas trop gore',
  'Film familial pour dimanche soir',
  'Une comédie romantique feel good',
  'De la SF qui fait réfléchir comme Interstellar',
  'Un braquage malin dans le style de Ocean\'s Eleven',
];

// ---------- Rendu commun ----------
function card(it, extra = {}) {
  const entry = store.getEntry(it);
  const poster = it.poster_path ? `${api.IMG}w342${it.poster_path}` : '';
  const badges = [
    extra.isNew ? '<span class="badge new">Nouveau</span>' : '',
    entry?.status === 'seen' ? '<span class="badge seen">Vu</span>' : '',
    entry?.status === 'towatch' ? '<span class="badge todo">À voir</span>' : '',
  ].join('');
  const genres = (it.genre_ids || []).slice(0, 2).map((g) => genreName(it, g)).filter(Boolean).join(' · ');
  return `
    <button class="card" data-type="${esc(it.media_type)}" data-id="${esc(it.id)}" title="${esc(titleOf(it))}">
      <div class="poster">${poster ? `<img loading="lazy" src="${esc(poster)}" alt="">` : `<div class="noimg">${esc(titleOf(it))}</div>`}
        <div class="badges">${badges}</div>
        ${it.vote_average ? `<span class="note">★ ${it.vote_average.toFixed(1)}</span>` : ''}
      </div>
      <div class="meta">
        <strong>${esc(titleOf(it))}</strong>
        <small>${it.media_type === 'tv' ? 'Série' : 'Film'} · ${year(it) || '—'}${genres ? ` · ${esc(genres)}` : ''}</small>
        ${extra.why ? `<small class="why">${esc(extra.why)}</small>` : ''}
      </div>
    </button>`;
}

function grid(items, extraFn = () => ({})) {
  if (!items.length) return '<p class="empty">Rien trouvé pour l\'instant.</p>';
  return `<div class="grid">${items.map((it) => card(it, extraFn(it))).join('')}</div>`;
}

function loading(msg = 'Chargement…') { return `<p class="loading">${msg}</p>`; }
function errorBox(e) { return `<p class="error">${esc(e.message || e)}</p>`; }

function needKey() {
  view.innerHTML = `
    <section class="panel">
      <h2>Bienvenue 👋</h2>
      <p>L'appli utilise la base gratuite <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a> pour les tendances, les genres et les plateformes de streaming.</p>
      <ol>
        <li>Crée un compte gratuit sur <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org</a>.</li>
        <li>Va dans <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">Paramètres → API</a> et demande une clé (usage personnel).</li>
        <li>Colle la « Clé d'API » ou le « Jeton d'accès en lecture » ci‑dessous.</li>
      </ol>
      ${keyForm()}
    </section>`;
  bindKeyForm();
}

function keyForm() {
  return `<form id="keyForm" class="row">
    <input id="keyInput" type="password" placeholder="Clé API TMDB" value="${esc(store.getKey())}" autocomplete="off">
    <button class="primary">Enregistrer</button></form><p id="keyMsg" class="hint"></p>`;
}
function bindKeyForm() {
  $('#keyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const k = $('#keyInput').value.trim();
    api.setCredential(k);
    $('#keyMsg').textContent = 'Vérification…';
    try {
      await api.tmdb('/configuration');
      store.setKey(k);
      $('#keyMsg').textContent = 'Clé valide ✔';
      setTimeout(() => { location.hash = '#envie'; route(); }, 400);
    } catch (err) { $('#keyMsg').textContent = err.message; }
  });
}

// ---------- Vue « Envie du moment » ----------
let lastQuery = '';
async function viewEnvie() {
  view.innerHTML = `
    <section class="hero">
      <h2>Tu as envie de quoi ce soir ?</h2>
      <form id="moodForm" class="row">
        <input id="moodInput" placeholder="ex. soirée cosy, drôle, avec de l'intrigue, comme À couteaux tirés" value="${esc(lastQuery)}">
        <button class="primary">Trouver</button>
      </form>
      <div class="chips">${PRESETS.map((p) => `<button class="chip" data-q="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    </section>
    <div id="moodOut"></div>`;
  $('#moodForm').addEventListener('submit', (e) => { e.preventDefault(); runMood($('#moodInput').value); });
  view.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { $('#moodInput').value = c.dataset.q; runMood(c.dataset.q); }));
  if (lastQuery) runMood(lastQuery);
}

async function runMood(q) {
  lastQuery = q.trim();
  const out = $('#moodOut');
  if (!lastQuery) return;
  const mood = parseMood(lastQuery);
  out.innerHTML = loading('Je cherche des idées…');
  try {
    const pool = new Map();
    const add = (list, why) => list.forEach((it) => {
      const k = store.itemKey(it);
      if (!pool.has(k)) pool.set(k, { ...it, _why: why });
      else if (it._fromSimilar) pool.get(k)._fromSimilar = true;
    });
    let ref = null;

    if (mood.similarTo) {
      const found = await api.searchTitle(mood.similarTo);
      ref = found[0];
      if (ref) {
        const recs = await api.recommendations(ref.media_type, ref.id);
        add(recs.map((r) => ({ ...r, _fromSimilar: true })), `Proche de ${titleOf(ref)}`);
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
    found.forEach((list) => add(list, mood.moods.length ? `Colle à : ${mood.moods.join(', ')}` : 'Populaire en ce moment'));

    let items = [...pool.values()];
    if (mood.type !== 'all') items = items.filter((it) => it.media_type === mood.type);
    if (ref) items = items.filter((it) => !(it.id === ref.id && it.media_type === ref.media_type));
    items.sort((a, b) => scoreItem(b, mood) - scoreItem(a, mood));
    items = items.slice(0, 30);

    const summary = [
      mood.moods.length ? `humeur : <b>${esc(mood.moods.join(', '))}</b>` : '',
      mood.similarTo ? (ref ? `proche de <b>${esc(titleOf(ref))}</b> (${year(ref)})` : `titre « ${esc(mood.similarTo)} » introuvable`) : '',
      mood.type !== 'all' ? `<b>${mood.type === 'tv' ? 'séries' : 'films'}</b> uniquement` : '',
      mood.recent ? '<b>récents</b>' : '', mood.classic ? '<b>classiques</b>' : '', mood.short ? '<b>courts</b>' : '',
    ].filter(Boolean).join(' · ');
    out.innerHTML = `<p class="hint">J'ai compris : ${summary || 'pas de critère précis, voici les incontournables du moment'}.</p>${grid(items, (it) => ({ why: it._why }))}`;
  } catch (e) { out.innerHTML = errorBox(e); }
}

// ---------- Vue « Tendances » ----------
let trendType = 'all';
async function viewTendances() {
  view.innerHTML = `
    <section class="toolbar">
      <h2>Tendances de la semaine</h2>
      <div class="seg">${[['all', 'Tout'], ['movie', 'Films'], ['tv', 'Séries']].map(([v, l]) => `<button data-v="${v}" class="${v === trendType ? 'on' : ''}">${l}</button>`).join('')}</div>
    </section><div id="trendOut">${loading()}</div>`;
  view.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { trendType = b.dataset.v; viewTendances(); }));
  try {
    const [p1, p2] = await Promise.all([api.trending(trendType, 'week', 1), api.trending(trendType, 'week', 2)]);
    const items = [...p1, ...p2];
    const isNew = store.diffTrending(items);
    const nb = items.filter(isNew).length;
    $('#trendOut').innerHTML = (nb ? `<p class="hint">${nb} nouveauté${nb > 1 ? 's' : ''} depuis ta dernière visite.</p>` : '') + grid(items, (it) => ({ isNew: isNew(it) }));
  } catch (e) { $('#trendOut').innerHTML = errorBox(e); }
}

// ---------- Vue « Par genre » ----------
const genreState = { type: 'movie', genre: 35, sort: 'popularity.desc' };
async function viewGenres() {
  const map = genreState.type === 'tv' ? TV_GENRES : MOVIE_GENRES;
  if (!map[genreState.genre]) genreState.genre = Number(Object.keys(map)[0]);
  view.innerHTML = `
    <section class="toolbar">
      <h2>Par thématique</h2>
      <div class="seg" id="gType">${[['movie', 'Films'], ['tv', 'Séries']].map(([v, l]) => `<button data-v="${v}" class="${v === genreState.type ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="seg" id="gSort">${[['popularity.desc', 'Populaires'], ['vote_average.desc', 'Mieux notés']].map(([v, l]) => `<button data-v="${v}" class="${v === genreState.sort ? 'on' : ''}">${l}</button>`).join('')}</div>
    </section>
    <div class="chips">${Object.entries(map).map(([id, n]) => `<button class="chip ${Number(id) === genreState.genre ? 'on' : ''}" data-g="${id}">${n}</button>`).join('')}</div>
    <div id="genreOut">${loading()}</div>`;
  view.querySelectorAll('#gType button').forEach((b) => b.addEventListener('click', () => { genreState.type = b.dataset.v; viewGenres(); }));
  view.querySelectorAll('#gSort button').forEach((b) => b.addEventListener('click', () => { genreState.sort = b.dataset.v; viewGenres(); }));
  view.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { genreState.genre = Number(c.dataset.g); viewGenres(); }));
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
      <h2>Ma cinémathèque</h2>
      <div class="seg">${[['towatch', `À voir (${count('towatch')})`], ['seen', `Vus (${count('seen')})`]].map(([v, l]) => `<button data-v="${v}" class="${v === listTab ? 'on' : ''}">${l}</button>`).join('')}</div>
    </section>${grid(items)}`;
  view.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { listTab = b.dataset.v; viewListes(); }));
}

// ---------- Vue « Réglages » ----------
function viewReglages() {
  view.innerHTML = `
    <section class="panel">
      <h2>Réglages</h2>
      <h3>Clé TMDB</h3>${keyForm()}
      <h3>Sauvegarde de mes listes</h3>
      <p class="hint">Tes listes sont stockées dans ce navigateur. Exporte-les pour les transférer sur un autre appareil.</p>
      <div class="row"><button id="exp">Exporter (.json)</button><label class="btn">Importer<input id="imp" type="file" accept="application/json" hidden></label></div>
      <p id="ioMsg" class="hint"></p>
      <h3>Installer l'appli</h3>
      <p class="hint">Sur Chrome/Edge (Windows, Mac, Android) : menu ⋮ → « Installer l'application ». Sur iPhone (Safari) : Partager → « Sur l'écran d'accueil ».</p>
      <p class="tmdb">Données fournies par TMDB. Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB. Disponibilités streaming : JustWatch via TMDB.</p>
    </section>`;
  bindKeyForm();
  $('#exp').addEventListener('click', () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `cinematheque-${new Date().toISOString().slice(0, 10)}.json` });
    a.click(); URL.revokeObjectURL(a.href);
  });
  $('#imp').addEventListener('change', async (e) => {
    try { const n = store.importData(await e.target.files[0].text()); $('#ioMsg').textContent = `${n} titres importés ✔`; } catch (err) { $('#ioMsg').textContent = err.message; }
  });
}

// ---------- Fiche détaillée ----------
async function openDetail(type, id) {
  const dlg = $('#detail');
  dlg.innerHTML = `<div class="sheet">${loading()}</div>`;
  dlg.showModal();
  try {
    const d = await api.details(type, id);
    const it = { ...d, media_type: type, genre_ids: d.genres.map((g) => g.id) };
    const prov = d['watch/providers']?.results?.FR || {};
    const provRow = (label, list) => list?.length ? `<div class="prov"><span>${label}</span>${list.map((p) => `<img title="${esc(p.provider_name)}" alt="${esc(p.provider_name)}" src="${esc(`${api.IMG}w92${p.logo_path}`)}">`).join('')}</div>` : '';
    const trailer = (d.videos?.results || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer') || (d.videos?.results || []).find((v) => v.site === 'YouTube');
    const runtime = d.runtime ? `${Math.floor(d.runtime / 60)}h${String(d.runtime % 60).padStart(2, '0')}` : (d.number_of_seasons ? `${d.number_of_seasons} saison${d.number_of_seasons > 1 ? 's' : ''}` : '');
    const cast = (d.credits?.cast || []).slice(0, 5).map((c) => c.name).join(', ');
    const director = (d.credits?.crew || []).find((c) => c.job === 'Director')?.name || (d.created_by || []).map((c) => c.name).join(', ');
    const render = () => {
      const st = store.getEntry(it)?.status;
      dlg.innerHTML = `
        <div class="sheet">
          ${d.backdrop_path ? `<img class="backdrop" src="${esc(`${api.IMG}w780${d.backdrop_path}`)}" alt="">` : ''}
          <button class="close" aria-label="Fermer">✕</button>
          <div class="body">
            <h2>${esc(titleOf(d))} <small>${year(d)}</small></h2>
            <p class="hint">${type === 'tv' ? 'Série' : 'Film'}${runtime ? ` · ${runtime}` : ''} · ${esc(d.genres.map((g) => g.name).join(', '))}${d.vote_average ? ` · ★ ${d.vote_average.toFixed(1)}` : ''}</p>
            ${d.tagline ? `<p class="tagline">${esc(d.tagline)}</p>` : ''}
            <p>${esc(d.overview || 'Pas de résumé en français.')}</p>
            ${director ? `<p class="hint">De ${esc(director)}${cast ? ` · avec ${esc(cast)}` : ''}</p>` : ''}
            <div class="row actions">
              <button data-s="towatch" class="${st === 'towatch' ? 'primary' : ''}">${st === 'towatch' ? '✔ Dans ma liste' : '+ À voir'}</button>
              <button data-s="seen" class="${st === 'seen' ? 'primary' : ''}">${st === 'seen' ? '✔ Vu' : 'Marquer vu'}</button>
              ${trailer ? `<a class="btn" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${esc(trailer.key)}">▶ Bande-annonce</a>` : ''}
              <button data-more>Des idées similaires</button>
            </div>
            <h3>Où le regarder en France</h3>
            ${provRow('Abonnement', prov.flatrate) + provRow('Gratuit', [...(prov.free || []), ...(prov.ads || [])]) + provRow('Location', prov.rent) + provRow('Achat', prov.buy) || '<p class="hint">Aucune offre légale référencée pour l\'instant (souvent le cas des films encore au cinéma).</p>'}
            ${prov.link ? `<p class="hint"><a href="${esc(prov.link)}" target="_blank" rel="noopener">Voir toutes les offres (JustWatch)</a></p>` : ''}
          </div>
        </div>`;
      $('.close', dlg).addEventListener('click', () => dlg.close());
      dlg.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
        store.setStatus(it, st === b.dataset.s ? null : b.dataset.s); render(); refreshBadges();
      }));
      $('[data-more]', dlg).addEventListener('click', () => {
        dlg.close(); lastQuery = `comme ${titleOf(d)}`; location.hash = '#envie'; route();
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

api.setCredential(store.getKey());
route();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
