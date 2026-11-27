// Stockage local (navigateur) : langue, pays, clé TMDB, listes « à voir » / « vus », veille des tendances.
const K = { active: 'cine.activeProviders', providers: 'cine.providers', mediaType: 'cine.mediaType', lang: 'cine.lang', region: 'cine.region', key: 'cine.tmdbKey', list: 'cine.list', trend: 'cine.trendSeen', trendAt: 'cine.trendAt', display: 'cine.display', theme: 'cine.theme', snaps: 'cine.watchSnaps', alerts: 'cine.alerts' };

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const getKey = () => localStorage.getItem(K.key) || '';
export const setKey = (v) => localStorage.setItem(K.key, v.trim());

export const getLang = () => localStorage.getItem(K.lang) || '';
export const setLang = (v) => localStorage.setItem(K.lang, v);
// Affichage : 'auto' (détection), 'screen' (téléphone / ordinateur) ou 'tv'.
export const getDisplay = () => (['auto', 'screen', 'tv'].includes(localStorage.getItem(K.display)) ? localStorage.getItem(K.display) : 'auto');
export const setDisplay = (v) => localStorage.setItem(K.display, v);
// Thème : 'auto' (celui du système), 'light' ou 'dark'.
export const getTheme = () => (['auto', 'light', 'dark'].includes(localStorage.getItem(K.theme)) ? localStorage.getItem(K.theme) : 'auto');
export const setTheme = (v) => localStorage.setItem(K.theme, v);
export const getRegion = () => localStorage.getItem(K.region) || '';
export const setRegion = (v) => localStorage.setItem(K.region, v);

// Mes plateformes (abonnements), mémorisées par pays : { FR: [8, 119], BE: [...] }.
// Par défaut : Netflix, Prime Video et Disney+.
export const DEFAULT_PROVIDERS = [8, 119, 337];
export function getProviders(region) {
  const all = read(K.providers, {});
  return Array.isArray(all[region]) ? all[region] : [...DEFAULT_PROVIDERS];
}
export function setProviders(region, ids) {
  const all = read(K.providers, {});
  all[region] = [...new Set(ids.map(Number))];
  write(K.providers, all);
  setActive(region, getActive(region).filter((id) => all[region].includes(id)));
}
// Sélection en cours sur la page de recherche (sous-ensemble de mes plateformes ; vide = « Toutes »)
export const getActive = (region) => (read(K.active, {})[region] || []);
export function setActive(region, ids) {
  const all = read(K.active, {});
  all[region] = [...new Set(ids.map(Number))];
  write(K.active, all);
}
// Plateformes réellement utilisées pour filtrer : la sélection en cours, sinon toutes mes plateformes.
export function effectiveProviders(region) {
  const mine = getProviders(region);
  const active = getActive(region).filter((id) => mine.includes(id));
  return active.length ? active : mine;
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

// Alertes « À voir » : instantanés par titre ({ 'tv:1399': { region, prov, names, seasons, at } }) et alertes en attente.
export const getSnaps = () => read(K.snaps, {});
export function setSnap(key, snap) {
  const all = getSnaps();
  all[key] = { ...snap, at: Date.now() };
  // On oublie les titres sortis de la liste « À voir ».
  const list = getList();
  for (const k of Object.keys(all)) if (list[k]?.status !== 'towatch') delete all[k];
  write(K.snaps, all);
}
// Alertes encore valables (le titre est toujours dans « À voir »).
export function getAlerts() {
  const list = getList();
  return read(K.alerts, []).filter((a) => list[a.key]?.status === 'towatch');
}
export function addAlerts(items) {
  if (!items.length) return;
  const keep = getAlerts().filter((a) => !items.some((b) => b.key === a.key && b.kind === a.kind));
  write(K.alerts, [...items.map((a) => ({ ...a, at: Date.now() })), ...keep].slice(0, 30));
}
export const dismissAlert = (key) => write(K.alerts, getAlerts().filter((a) => a.key !== key));
export const clearAlerts = () => write(K.alerts, []);

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

// Transfert vers un autre appareil (QR code) : clé TMDB, langue, pays, plateformes, thème et, au choix, les listes.
export function exportTransfer(withLists = true) {
  return {
    v: 1, key: getKey(), lang: getLang(), region: getRegion(), theme: getTheme(),
    providers: read(K.providers, null), mediaType: read(K.mediaType, null),
    ...(withLists ? { list: getList() } : {}),
  };
}
// Applique un transfert reçu. Les listes sont fusionnées (la version la plus récente de chaque titre gagne).
// Renvoie le nombre de titres reçus.
export function importTransfer(d) {
  if (!d || d.v !== 1) throw new Error('Transfert non reconnu');
  if (typeof d.key === 'string' && d.key.trim()) setKey(d.key);
  if (typeof d.lang === 'string' && d.lang) setLang(d.lang);
  if (/^[A-Z]{2}$/.test(d.region || '')) setRegion(d.region);
  if (['auto', 'light', 'dark'].includes(d.theme)) setTheme(d.theme);
  if (d.providers && typeof d.providers === 'object') write(K.providers, d.providers);
  if (['movie', 'tv', 'all'].includes(d.mediaType)) setMediaType(d.mediaType);
  if (!d.list || typeof d.list !== 'object') return 0;
  const list = getList();
  for (const [k, e] of Object.entries(d.list)) {
    if (!/^(movie|tv):\d+$/.test(k) || !e || typeof e !== 'object') continue;
    if (!list[k] || (e.updatedAt || 0) > (list[k].updatedAt || 0)) list[k] = e;
  }
  write(K.list, list);
  return Object.keys(d.list).length;
}
