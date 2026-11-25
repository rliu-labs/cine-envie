// Stockage local (navigateur) : langue, pays, clé TMDB, listes « à voir » / « vus », veille des tendances.
const K = { providers: 'cine.providers', mediaType: 'cine.mediaType', lang: 'cine.lang', region: 'cine.region', key: 'cine.tmdbKey', list: 'cine.list', trend: 'cine.trendSeen', trendAt: 'cine.trendAt' };

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const getKey = () => localStorage.getItem(K.key) || '';
export const setKey = (v) => localStorage.setItem(K.key, v.trim());

export const getLang = () => localStorage.getItem(K.lang) || '';
export const setLang = (v) => localStorage.setItem(K.lang, v);
export const getRegion = () => localStorage.getItem(K.region) || '';
export const setRegion = (v) => localStorage.setItem(K.region, v);

// Plateformes choisies, mémorisées par pays : { FR: [8, 119], BE: [...] }
export const getProviders = (region) => (read(K.providers, {})[region] || []);
export function setProviders(region, ids) {
  const all = read(K.providers, {});
  all[region] = [...new Set(ids.map(Number))];
  write(K.providers, all);
}
// Préférence Films / Séries / Les deux pour la recherche par envie
export const getMediaType = () => (['movie', 'tv', 'all'].includes(read(K.mediaType, 'all')) ? read(K.mediaType, 'all') : 'all');
export const setMediaType = (v) => write(K.mediaType, v);

export const itemKey = (it) => `${it.media_type}:${it.id}`;

export function getList() { return read(K.list, {}); }
export function getEntry(it) { return getList()[itemKey(it)] || null; }

// Note de 1 à 5 sur un titre vu (0 pour l'effacer). Noter un titre le marque comme vu.
export function setRating(it, rating) {
  if (!getEntry(it) || getEntry(it).status !== 'seen') setStatus(it, 'seen');
  const list = getList();
  const k = itemKey(it);
  if (rating >= 1 && rating <= 5) list[k].rating = Math.round(rating);
  else delete list[k].rating;
  list[k].updatedAt = Date.now();
  write(K.list, list);
}

export function setStatus(it, status) {
  const list = getList();
  const k = itemKey(it);
  if (!status) delete list[k];
  else {
    list[k] = {
      ...(list[k] || {}),
      ...(status !== 'seen' ? { rating: undefined } : {}),
      id: it.id, media_type: it.media_type,
      title: it.title || it.name, poster_path: it.poster_path,
      date: it.release_date || it.first_air_date || '',
      vote_average: it.vote_average, genre_ids: it.genre_ids || (it.genres || []).map((g) => g.id),
      status, updatedAt: Date.now(),
    };
  }
  write(K.list, list);
}

// Veille : renvoie l'ensemble des ids de tendances déjà vus avant cette visite, puis mémorise les actuels.
export function diffTrending(items) {
  const before = new Set(read(K.trend, []));
  const firstRun = before.size === 0;
  const merged = new Set([...before, ...items.map(itemKey)]);
  write(K.trend, [...merged].slice(-600));
  write(K.trendAt, Date.now());
  return (it) => !firstRun && !before.has(itemKey(it));
}

export function exportData() {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), list: getList() }, null, 2);
}
export function importData(json) {
  const data = JSON.parse(json);
  if (!data || typeof data.list !== 'object') throw new Error('Fichier non reconnu');
  write(K.list, { ...getList(), ...data.list });
  return Object.keys(data.list).length;
}
