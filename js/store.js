// Stockage local (navigateur) : clé TMDB, listes « à voir » / « vus », veille des tendances.
const K = { key: 'cine.tmdbKey', list: 'cine.list', trend: 'cine.trendSeen', trendAt: 'cine.trendAt' };

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const getKey = () => localStorage.getItem(K.key) || '';
export const setKey = (v) => localStorage.setItem(K.key, v.trim());

export const itemKey = (it) => `${it.media_type}:${it.id}`;

export function getList() { return read(K.list, {}); }
export function getEntry(it) { return getList()[itemKey(it)] || null; }

export function setStatus(it, status) {
  const list = getList();
  const k = itemKey(it);
  if (!status) delete list[k];
  else {
    list[k] = {
      ...(list[k] || {}),
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
