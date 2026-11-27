import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSession, pairLink, parsePair, seal, open, split, join, send, listen } from '../js/pair.js';
import { qrMatrix } from '../js/qr.js';

test('lien d\'appairage : aller-retour et refus des liens bizarres', () => {
  const s = newSession();
  const link = pairLink('https://x.test/app/', s);
  assert.deepEqual(parsePair(new URL(link).hash), s);
  assert.equal(parsePair('#envie'), null);
  assert.equal(parsePair('#pair=evil.abc'), null);
  assert.equal(parsePair(`#pair=${s.topic}.${s.secret}<script>`), null);
});

test('chiffrement : seul le bon secret ouvre le message', async () => {
  const s = newSession();
  const obj = { v: 1, key: 'abc', list: { 'movie:1': { title: 'Été 85 🎬' } } };
  const text = await seal(obj, s.secret);
  assert.ok(!text.includes('abc'));
  assert.deepEqual(await open(text, s.secret), obj);
  await assert.rejects(open(text, newSession().secret));
});

test('découpage en morceaux, dans le désordre et mélangé à d\'autres envois', () => {
  const text = 'x'.repeat(7000);
  const parts = split(text, 'A');
  assert.equal(parts.length, 3);
  assert.equal(join([parts[2], 'B/0/2/zz', parts[0]]), null);
  assert.equal(join([parts[2], 'B/0/2/zz', parts[0], parts[1]]), text);
});

test('envoi puis réception par le relais (relais simulé)', async () => {
  const msgs = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, opt = {}) => {
    if (opt.method === 'POST') { msgs.push({ event: 'message', message: opt.body }); return new Response('{}'); }
    return new Response([{ event: 'open' }, ...msgs].map((m) => JSON.stringify(m)).join('\n'));
  };
  try {
    const s = newSession();
    const big = Object.fromEntries(Array.from({ length: 400 }, (_, i) => [`movie:${i}`, { id: i, title: `Titre ${i} ${Math.random()}`, status: 'seen' }]));
    const got = new Promise((resolve, reject) => listen(s, resolve, reject, { relay: 'https://relay.test', every: 5 }));
    const n = await send(s, { v: 1, key: 'k', list: big }, 'https://relay.test');
    assert.ok(n > 1, `${n} morceaux`);
    assert.equal(Object.keys((await got).list).length, 400);
  } finally { globalThis.fetch = realFetch; }
});

test('QR code : taille selon la longueur, limite respectée', () => {
  assert.equal(qrMatrix('hi').length, 21);
  assert.equal(qrMatrix('https://rliu-labs.github.io/cine-envie/#pair=cine-abcdefghijklmnopqrstuvwx.abcdefghijklmnopqrstuv').length, 41); // version 6
  assert.throws(() => qrMatrix('x'.repeat(300)));
});
