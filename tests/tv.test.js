import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectTv, resolveTv, pickNext } from '../js/tv.js';

test('TV and set-top box detection', () => {
  assert.ok(detectTv('Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/537.36 SamsungBrowser/4.0 TV Safari/537.36'));
  assert.ok(detectTv('Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 Chrome/79.0 Safari/537.36 WebAppManager'));
  assert.ok(detectTv('Mozilla/5.0 (Linux; Android 9; AFTMM Build/PS7233) AppleWebKit/537.36 Chrome/112.0 Mobile Safari/537.36'));
  assert.ok(detectTv('Mozilla/5.0 (Linux; Android 12; BRAVIA 4K VH2 Build/STT1) AppleWebKit/537.36 Chrome/114.0 Safari/537.36'));
  assert.ok(!detectTv('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'));
  assert.ok(!detectTv('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'));
  assert.ok(!detectTv('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'));
});

test('mode choice: address > setting > detection', () => {
  const tv = 'Mozilla/5.0 (SMART-TV; Tizen 6.0)';
  const pc = 'Mozilla/5.0 (Windows NT 10.0)';
  assert.equal(resolveTv('auto', '', tv), true);
  assert.equal(resolveTv('auto', '', pc), false);
  assert.equal(resolveTv('tv', '', pc), true);
  assert.equal(resolveTv('screen', '', tv), false);
  assert.equal(resolveTv('screen', '?tv=1', tv), true);
  assert.equal(resolveTv('tv', '?tv=0', tv), false);
});

test('arrow navigation in a grid', () => {
  // 3 columns × 2 rows of 100×150 posters, plus a wide button above
  const r = (x, y, w = 100, h = 150) => ({ x, y, w, h });
  const rects = [r(0, 0, 320, 40), r(0, 60), r(110, 60), r(220, 60), r(0, 220), r(110, 220), r(220, 220)];
  assert.equal(pickNext(1, rects, 'right'), 2);
  assert.equal(pickNext(3, rects, 'right'), -1);
  assert.equal(pickNext(2, rects, 'down'), 5);
  assert.equal(pickNext(6, rects, 'up'), 3);
  assert.equal(pickNext(5, rects, 'left'), 4);
  assert.equal(pickNext(2, rects, 'up'), 0);
  assert.equal(pickNext(0, rects, 'down'), 2); // right below the centre
  // Shorter next row: go to the closest one, not a far diagonal
  const ragged = [r(0, 0), r(110, 0), r(220, 0), r(0, 160)];
  assert.equal(pickNext(2, ragged, 'down'), 3);
});
