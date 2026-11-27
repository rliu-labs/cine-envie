// Alertes « À voir » : un titre de la liste arrive sur une de mes plateformes, ou une série a une nouvelle saison.
// Chaque titre garde un « instantané » (plateformes où il est inclus dans l'abonnement, saisons déjà diffusées).
// Le premier passage ne fait que mémoriser l'état : seules les nouveautés ultérieures donnent une alerte.

// Instantané d'une fiche TMDB (détails + watch/providers) pour un pays.
export function snapshot(d, region, today = new Date().toISOString().slice(0, 10)) {
  const p = d?.['watch/providers']?.results?.[region] || {};
  const offers = [...(p.flatrate || []), ...(p.free || []), ...(p.ads || [])];
  const names = {};
  offers.forEach((o) => { names[o.provider_id] = o.provider_name; });
  // Saisons déjà diffusées (on ignore les « épisodes spéciaux » et les saisons annoncées).
  const aired = (d?.seasons || []).filter((s) => s.season_number > 0 && s.air_date && s.air_date <= today).map((s) => s.season_number);
  const last = d?.last_episode_to_air?.season_number || 0;
  return { region, prov: [...new Set(offers.map((o) => o.provider_id))].sort((a, b) => a - b), names, seasons: Math.max(0, last, ...aired) };
}

// Compare l'ancien et le nouvel instantané. mine = mes plateformes dans ce pays.
// Renvoie [{ kind: 'platform', ids, names } | { kind: 'season', n }].
export function compare(prev, cur, mine = []) {
  if (!prev || prev.region !== cur.region) return [];
  const out = [];
  const before = new Set(prev.prov || []);
  const ids = cur.prov.filter((id) => !before.has(id) && mine.includes(id));
  if (ids.length) out.push({ kind: 'platform', ids, names: ids.map((id) => cur.names[id]).filter(Boolean) });
  if (cur.seasons > (prev.seasons || 0)) out.push({ kind: 'season', n: cur.seasons });
  return out;
}

// Titres à vérifier : ceux de la liste « À voir » dont l'instantané date de plus de `maxAge`, les plus récents d'abord.
export function due(list, snaps, now = Date.now(), { maxAge = 20 * 3600e3, limit = 30 } = {}) {
  return Object.entries(list)
    .filter(([, e]) => e?.status === 'towatch')
    .filter(([k]) => !snaps[k] || now - (snaps[k].at || 0) > maxAge)
    .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
    .slice(0, limit)
    .map(([k]) => k);
}
