// "To watch" alerts: a title from the list arrives on one of my services, or a series gets a new season.
// Each title keeps a "snapshot" (services where it is included in the subscription, seasons already aired).
// The first check only records the state: only later changes raise an alert.

// Snapshot of a TMDB title (details + watch/providers) for one country.
export function snapshot(d, region, today = new Date().toISOString().slice(0, 10)) {
  const p = d?.['watch/providers']?.results?.[region] || {};
  const offers = [...(p.flatrate || []), ...(p.free || []), ...(p.ads || [])];
  const names = {};
  offers.forEach((o) => { names[o.provider_id] = o.provider_name; });
  // Seasons already aired (specials and announced seasons are ignored).
  const aired = (d?.seasons || []).filter((s) => s.season_number > 0 && s.air_date && s.air_date <= today).map((s) => s.season_number);
  const last = d?.last_episode_to_air?.season_number || 0;
  return { region, prov: [...new Set(offers.map((o) => o.provider_id))].sort((a, b) => a - b), names, seasons: Math.max(0, last, ...aired) };
}

// Compares the previous and current snapshots. mine = my services in this country.
// Returns [{ kind: 'platform', ids, names } | { kind: 'season', n }].
export function compare(prev, cur, mine = []) {
  if (!prev || prev.region !== cur.region) return [];
  const out = [];
  const before = new Set(prev.prov || []);
  const ids = cur.prov.filter((id) => !before.has(id) && mine.includes(id));
  if (ids.length) out.push({ kind: 'platform', ids, names: ids.map((id) => cur.names[id]).filter(Boolean) });
  if (cur.seasons > (prev.seasons || 0)) out.push({ kind: 'season', n: cur.seasons });
  return out;
}

// Titles to check: those in "to watch" whose snapshot is older than `maxAge`, most recently added first.
export function due(list, snaps, now = Date.now(), { maxAge = 20 * 3600e3, limit = 30 } = {}) {
  return Object.entries(list)
    .filter(([, e]) => e?.status === 'towatch')
    .filter(([k]) => !snaps[k] || now - (snaps[k].at || 0) > maxAge)
    .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
    .slice(0, limit)
    .map(([k]) => k);
}
