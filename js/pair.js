// Device-to-device transfer by QR code (for example from a phone to a TV), with no account.
//
// 1. The receiving device (the TV) draws a random channel and encryption key, and shows a QR code
//    pointing to ".../#pair=<channel>.<key>". The part after # never leaves the browser.
// 2. The phone scans the QR code, encrypts (AES-GCM) the TMDB key, settings and lists, and posts
//    the ciphertext to ntfy.sh, a free public relay, split into 3 KB chunks.
// 3. The TV polls the channel every 2 s, reassembles the chunks and decrypts them.
// The relay only sees ciphertext, never the key (which stays in the QR code), and deletes it within 12 h.

const RELAY = 'https://ntfy.sh';
const CHUNK = 3000;

// URL-safe base64, converted in slices (String.fromCharCode(...hugeArray) overflows the stack).
function b64u(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const rand = (n) => crypto.getRandomValues(new Uint8Array(n));

// New channel: 18 random bytes for the name (unguessable), 16 for the AES key.
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

// Object -> ciphertext (byte 0: 1 = compressed, 0 = raw; then a 12-byte IV; then the data).
export async function seal(obj, secret) {
  let data = new TextEncoder().encode(JSON.stringify(obj));
  const zip = canZip();
  if (zip) data = await pipe(data, CompressionStream, 'deflate-raw');
  const iv = rand(12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret), data));
  const out = new Uint8Array(13 + ct.length);
  out[0] = zip ? 1 : 0; out.set(iv, 1); out.set(ct, 13);
  return b64u(out);
}
export async function open(text, secret) {
  const all = unb64u(text);
  let data = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(1, 13) }, await aesKey(secret), all.slice(13)));
  if (all[0] === 1) data = await pipe(data, DecompressionStream, 'deflate-raw');
  return JSON.parse(new TextDecoder().decode(data));
}

// Chunk format: "<send id>/<chunk index>/<chunk count>/<text>".
export function split(text, id = b64u(rand(6))) {
  const n = Math.max(1, Math.ceil(text.length / CHUNK));
  return Array.from({ length: n }, (_, i) => `${id}/${i}/${n}/${text.slice(i * CHUNK, (i + 1) * CHUNK)}`);
}
// Reassembles the first complete send found among the received messages (or null).
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
    if (!r.ok) throw new Error(`Relay ${r.status}`);
  }
  return parts.length;
}

// Polls the channel until a complete send arrives. Returns a function that stops listening.
export function listen(session, onData, onError, { relay = RELAY, every = 2000 } = {}) {
  let stopped = false;
  let timer;
  const tick = async () => {
    if (stopped) return;
    try {
      const r = await fetch(`${relay}/${session.topic}/json?poll=1&since=all`);
      if (!r.ok) throw new Error(`Relay ${r.status}`);
      const lines = (await r.text()).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } });
      const text = join(lines.filter((l) => l?.event === 'message').map((l) => l.message));
      if (text && !stopped) { const data = await open(text, session.secret); stopped = true; onData(data); return; }
    } catch (e) { onError?.(e); }
    if (!stopped) timer = setTimeout(tick, every);
  };
  tick();
  return () => { stopped = true; clearTimeout(timer); };
}
