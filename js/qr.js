// Générateur de QR code minimal (mode octets, correction M, versions 1 à 10 : jusqu'à 213 octets).
// Suffisant pour un lien d'appairage. Renvoie une matrice de booléens (true = module noir).
// Écrit d'après la norme ISO/IEC 18004 ; aucun appel réseau, aucune dépendance.

// Correction M : [codes de correction par bloc, nb blocs groupe 1, octets de données groupe 1, nb blocs groupe 2, octets groupe 2]
const EC_M = [null, [10, 1, 16], [16, 1, 28], [26, 1, 44], [18, 2, 32], [24, 2, 43], [16, 4, 27], [18, 4, 31],
  [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]];
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

// Corps de Galois GF(256), polynôme 0x11D
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function generator(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(g.length + 1).fill(0);
    g.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= mul(c, EXP[i]); });
    g = next;
  }
  return g;
}
function ecBytes(data, n) {
  const g = generator(n);
  const r = [...data, ...new Array(n).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const c = r[i];
    if (c) for (let j = 0; j < g.length; j++) r[i + j] ^= mul(g[j], c);
  }
  return r.slice(data.length);
}

const capacity = (v) => { const [, b1, d1, b2 = 0, d2 = 0] = EC_M[v]; return b1 * d1 + b2 * d2; };

function codewords(bytes, v) {
  const cap = capacity(v);
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, v < 10 ? 8 : 16);
  bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, cap * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let p = 0; data.length < cap; p++) data.push(p % 2 ? 0x11 : 0xec);
  // Blocs, correction, entrelacement
  const [ec, b1, d1, b2 = 0, d2 = 0] = EC_M[v];
  const blocks = [];
  let k = 0;
  for (let i = 0; i < b1 + b2; i++) { const len = i < b1 ? d1 : d2; blocks.push(data.slice(k, k + len)); k += len; }
  const ecs = blocks.map((b) => ecBytes(b, ec));
  const out = [];
  for (let i = 0; i < Math.max(d1, d2); i++) blocks.forEach((b) => { if (i < b.length) out.push(b[i]); });
  for (let i = 0; i < ec; i++) ecs.forEach((e) => out.push(e[i]));
  return out;
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function build(v, cw, mask) {
  const size = v * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => { m[y][x] = dark; fn[y][x] = true; };
  // Motifs de repérage (+ séparateurs)
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx; const y = cy + dy;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      set(x, y, d !== 2 && d !== 4);
    }
  }
  // Lignes de synchronisation
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  // Motifs d'alignement
  const al = ALIGN[v];
  al.forEach((ax, i) => al.forEach((ay, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  // Informations de format (correction M = 00) et module noir
  const data = mask; // (00 << 3) | mask
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const fmt = ((data << 10) | rem) ^ 0x5412;
  const bit = (n, i) => ((n >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) set(8, i, bit(fmt, i));
  set(8, 7, bit(fmt, 6)); set(8, 8, bit(fmt, 7)); set(7, 8, bit(fmt, 8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(fmt, i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(fmt, i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(fmt, i));
  set(8, size - 8, true);
  // Informations de version (à partir de la version 7)
  if (v >= 7) {
    let r = v;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const vb = (v << 12) | r;
    for (let i = 0; i < 18; i++) { const a = size - 11 + (i % 3); const b = Math.floor(i / 3); set(a, b, bit(vb, i)); set(b, a, bit(vb, i)); }
  }
  // Données en zigzag, avec masque
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        if (fn[y][x]) continue;
        let dark = i < cw.length * 8 ? bit(cw[i >>> 3], 7 - (i & 7)) : false;
        i++;
        if (MASKS[mask](x, y)) dark = !dark;
        m[y][x] = dark;
      }
    }
  }
  return m;
}

// Pénalité simplifiée (règles 1, 2 et 4 de la norme) pour choisir le masque le plus lisible.
function penalty(m) {
  const n = m.length;
  let p = 0;
  for (let a = 0; a < n; a++) {
    for (const line of [m[a], m.map((r) => r[a])]) {
      let run = 1;
      for (let i = 1; i <= n; i++) {
        if (i < n && line[i] === line[i - 1]) run++;
        else { if (run >= 5) p += run - 2; run = 1; }
      }
    }
  }
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
    const c = m[y][x];
    if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
  }
  const dark = m.flat().filter(Boolean).length;
  p += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
  return p;
}

export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  let v = 1;
  while (v <= 10 && capacity(v) < bytes.length + (v < 10 ? 2 : 3)) v++;
  if (v > 10) throw new Error('Texte trop long pour le QR code');
  const cw = codewords(bytes, v);
  let best = null;
  let bestP = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = build(v, cw, mask);
    const p = penalty(m);
    if (p < bestP) { bestP = p; best = m; }
  }
  return best;
}

// Image SVG (chaîne) du QR code, avec la marge blanche obligatoire de 4 modules.
export function qrSvg(text, { label = 'QR code' } = {}) {
  const m = qrMatrix(text);
  const n = m.length + 8;
  let d = '';
  m.forEach((row, y) => row.forEach((dark, x) => { if (dark) d += `M${x + 4} ${y + 4}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" role="img" aria-label="${label.replace(/"/g, '&quot;')}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
