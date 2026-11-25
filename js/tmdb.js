// Petit client TMDB (https://developer.themoviedb.org). Langue et pays réglables (fr-FR / en-US, pays européen).
const BASE = 'https://api.themoviedb.org/3';
export const IMG = 'https://image.tmdb.org/t/p/';

let credential = '';
export function setCredential(key) { credential = (key || '').trim(); }
export function hasCredential() { return !!credential; }

let language = 'fr-FR';
let region = 'FR';
export function setLocale(lang, country) {
  language = lang === 'en' ? 'en-US' : 'fr-FR';
  if (/^[A-Z]{2}$/.test(country || '')) region = country;
}
export const getRegion = () => region;

const memo = new Map();

export async function tmdb(path, params = {}) {
  if (!credential) throw new Error('Clé TMDB manquante');
  const url = new URL(BASE + path);
  const isToken = credential.startsWith('eyJ'); // jeton v4 (Bearer) vs clé v3
  const all = { language, ...params };
  if (!isToken) all.api_key = credential;
  for (const [k, v] of Object.entries(all)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  const key = url.toString();
  if (memo.has(key)) return memo.get(key);
  const p = fetch(key, { headers: isToken ? { Authorization: `Bearer ${credential}` } : {} })
    .then(async (r) => {
      if (r.status === 401) throw new Error('Clé TMDB refusée (401). Vérifie-la dans Réglages.');
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
  const d = await tmdb(`/discover/${type}`, {
    sort_by: 'popularity.desc', 'vote_count.gte': 150, watch_region: region, ...params,
  });
  return d.results.map(withType(type));
}

export async function searchTitle(query) {
  const d = await tmdb('/search/multi', { query });
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
