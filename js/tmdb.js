// Small TMDB client (https://developer.themoviedb.org) with configurable language (en-US, fr-FR, es-ES, de-DE, it-IT, pt-PT) and country.
const BASE = 'https://api.themoviedb.org/3';
export const IMG = 'https://image.tmdb.org/t/p/';

let credential = '';
export function setCredential(key) { credential = (key || '').trim(); }
export function hasCredential() { return !!credential; }

let language = 'fr-FR';
let region = 'FR';
export function setLocale(lang, country) {
  language = { en: 'en-US', es: 'es-ES', de: 'de-DE', it: 'it-IT', pt: 'pt-PT' }[lang] || 'fr-FR'; // Darija falls back to French
  if (/^[A-Z]{2}$/.test(country || '')) region = country;
}
export const getRegion = () => region;

// "My services" filter: TMDB ids of the chosen services (empty = all).
let providers = [];
export function setProviders(ids) { providers = (ids || []).map(Number).filter((n) => Number.isInteger(n) && n > 0); }
export const getProviders = () => providers;

// Services available in the chosen country, movies and series combined, by display priority.
export async function providerList() {
  const [m, t] = await Promise.all([
    tmdb('/watch/providers/movie', { watch_region: region }),
    tmdb('/watch/providers/tv', { watch_region: region }),
  ]);
  const byId = new Map();
  for (const p of [...m.results, ...t.results]) {
    const prio = p.display_priorities?.[region] ?? p.display_priority ?? 999;
    const prev = byId.get(p.provider_id);
    if (!prev || prio < prev.prio) byId.set(p.provider_id, { id: p.provider_id, name: p.provider_name, logo: p.logo_path, prio });
  }
  return [...byId.values()].sort((a, b) => a.prio - b.prio);
}

const memo = new Map(); // in-memory cache of requests (promises), per URL

export async function tmdb(path, params = {}) {
  if (!credential) throw Object.assign(new Error('Missing TMDB key'), { code: 'errKeyMissing' });
  const url = new URL(BASE + path);
  const isToken = credential.startsWith('eyJ'); // v4 token (Bearer) vs v3 key
  const all = { language, ...params };
  if (!isToken) all.api_key = credential;
  for (const [k, v] of Object.entries(all)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  const key = url.toString();
  if (memo.has(key)) return memo.get(key);
  const p = fetch(key, { headers: isToken ? { Authorization: `Bearer ${credential}` } : {} })
    .then(async (r) => {
      if (r.status === 401) throw Object.assign(new Error('TMDB key rejected (401)'), { code: 'errKeyRejected' });
      if (!r.ok) throw new Error(`TMDB ${r.status}`);
      return r.json();
    });
  memo.set(key, p);
  p.catch(() => memo.delete(key));
  return p;
}

const withType = (type) => (r) => ({ ...r, media_type: r.media_type || type });

export async function trending(type = 'all', window = 'week', page = 1) {
  const d = await tmdb(`/trending/${type}/${window}`, { page });
  return d.results.filter((r) => r.media_type !== 'person').map(withType(type));
}

export async function discover(type, params) {
  const filter = providers.length ? {
    with_watch_providers: providers.join('|'),
    with_watch_monetization_types: 'flatrate|free|ads',
  } : {};
  const d = await tmdb(`/discover/${type}`, {
    sort_by: 'popularity.desc', 'vote_count.gte': 150, watch_region: region, ...filter, ...params,
  });
  return d.results.map(withType(type));
}

export async function searchTitle(query, page = 1) {
  const d = await tmdb('/search/multi', { query, page });
  if (page > (d.total_pages || 1)) return [];
  return d.results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv');
}

export async function recommendations(type, id) {
  const [rec, sim] = await Promise.all([
    tmdb(`/${type}/${id}/recommendations`),
    tmdb(`/${type}/${id}/similar`),
  ]);
  const seen = new Set();
  return [...rec.results, ...sim.results]
    .filter((r) => !seen.has(r.id) && seen.add(r.id))
    .map(withType(type));
}

export async function details(type, id) {
  return tmdb(`/${type}/${id}`, { append_to_response: 'videos,watch/providers,credits', include_video_language: `${language.slice(0, 2)},en,null` });
}

export async function person(id) {
  return tmdb(`/person/${id}`, { append_to_response: 'combined_credits' });
}
