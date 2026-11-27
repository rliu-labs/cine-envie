// Transfert d'un appareil à l'autre par QR code (par exemple du téléphone vers la télé), sans compte.
//
// 1. L'appareil qui reçoit (la télé) tire au sort un canal et une clé de chiffrement, et affiche un QR code
//    vers « …/#pair=<canal>.<clé> ». La partie après # ne quitte jamais le navigateur.
// 2. Le téléphone scanne le QR code, chiffre (AES-GCM) la clé TMDB, les réglages et les listes, et dépose
//    le message chiffré sur ntfy.sh, un relais public et gratuit, découpé en morceaux de 3 Ko.
// 3. La télé interroge ce canal toutes les 2 s, recolle les morceaux et déchiffre.
// Le relais ne voit qu'un texte chiffré, sans la clé (restée dans le QR code), et l'efface sous 12 h.

export const RELAY = 'https://ntfy.sh';
const CHUNK = 3000;

const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
// Conversion par tranches (String.fromCharCode(...grand tableau) déborde la pile)
function toB64u(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Nouveau canal : 18 octets aléatoires pour le nom (introuvable), 16 pour la clé AES.
export function newSession() {
  return { topic: `cine-${b64u(rand(18))}`, secret: b64u(rand(16)) };
}
export const pairLink = (base, s) => `${base}#pair=${s.topic}.${s.secret}`;
export function parsePair(hash) {
  const m = /^#pair=(cine-[\w-]{20,40})\.([\w-]{20,30})$/.exec(hash || '');
  return m ? { topic: m[1], secret: m[2] } : null;
}

const aesKey = (secret) => crypto.subtle.importKey('raw', unb64u(secret), 'AES-GCM', false, ['encrypt', 'decrypt']);

async function pipe(bytes, Stream, mode) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new Stream(mode))).arrayBuffer());
}
const canZip = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

// Objet → texte chiffré (1er octet : 1 = compressé, 0 = brut ; puis IV de 12 octets ; puis données)
export async function seal(obj, secret) {
  let data = new TextEncoder().encode(JSON.stringify(obj));
  const zip = canZip();
  if (zip) data = await pipe(data, CompressionStream, 'deflate-raw');
  const iv = rand(12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret), data));
  const out = new Uint8Array(13 + ct.length);
  out[0] = zip ? 1 : 0; out.set(iv, 1); out.set(ct, 13);
  return toB64u(out);
}
export async function open(text, secret) {
  const all = unb64u(text);
  let data = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(1, 13) }, await aesKey(secret), all.slice(13)));
  if (all[0] === 1) data = await pipe(data, DecompressionStream, 'deflate-raw');
  return JSON.parse(new TextDecoder().decode(data));
}

// Découpage : « <envoi>/<n° du morceau>/<nombre de morceaux>/<texte> »
export function split(text, id = b64u(rand(6))) {
  const n = Math.max(1, Math.ceil(text.length / CHUNK));
  return Array.from({ length: n }, (_, i) => `${id}/${i}/${n}/${text.slice(i * CHUNK, (i + 1) * CHUNK)}`);
}
// Recolle le premier envoi complet trouvé parmi les messages reçus (ou null).
export function join(messages) {
  const sends = new Map();
  for (const m of messages) {
    const p = /^([\w-]+)\/(\d+)\/(\d+)\/(.*)$/s.exec(m || '');
    if (!p) continue;
    const [, id, i, n, part] = p;
    if (!sends.has(id)) sends.set(id, { n: Number(n), parts: new Map() });
    sends.get(id).parts.set(Number(i), part);
  }
  for (const s of sends.values()) {
    if (s.parts.size === s.n) return Array.from({ length: s.n }, (_, i) => s.parts.get(i)).join('');
  }
  return null;
}

export async function send(session, obj, relay = RELAY) {
  const parts = split(await seal(obj, session.secret));
  for (const body of parts) {
    const r = await fetch(`${relay}/${session.topic}`, { method: 'POST', body });
    if (!r.ok) throw new Error(`Relais ${r.status}`);
  }
  return parts.length;
}

// Interroge le canal jusqu'à recevoir un envoi complet. Renvoie une fonction pour arrêter.
export function listen(session, onData, onError, { relay = RELAY, every = 2000 } = {}) {
  let stopped = false;
  let timer;
  const tick = async () => {
    if (stopped) return;
    try {
      const r = await fetch(`${relay}/${session.topic}/json?poll=1&since=all`);
      if (!r.ok) throw new Error(`Relais ${r.status}`);
      const lines = (await r.text()).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } });
      const text = join(lines.filter((l) => l?.event === 'message').map((l) => l.message));
      if (text && !stopped) { const data = await open(text, session.secret); stopped = true; onData(data); return; }
    } catch (e) { onError?.(e); }
    if (!stopped) timer = setTimeout(tick, every);
  };
  tick();
  return () => { stopped = true; clearTimeout(timer); };
}
