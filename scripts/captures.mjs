// Génère les captures d'écran et le GIF de démonstration du README avec de vraies données TMDB.
//
//   npm install
//   npx playwright install chromium
//   TMDB_KEY=ta_cle npm run captures        (PowerShell : $env:TMDB_KEY="ta_cle"; npm run captures)
//
// La clé n'est lue que depuis la variable d'environnement : elle n'est écrite nulle part
// et n'apparaît sur aucune capture. Résultat : docs/captures/*.png et docs/captures/demo.gif

import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';
import gifenc from 'gifenc';
import { PNG } from 'pngjs';

const { GIFEncoder, quantize, applyPalette } = gifenc;
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'docs', 'captures');
const KEY = process.env.TMDB_KEY;
const LANG = process.env.LANG_UI === 'en' ? 'en' : 'fr';
if (!KEY) { console.error('Définis la variable TMDB_KEY avec ta clé TMDB.'); process.exit(1); }

// Petit serveur statique local (pas besoin de Python)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(ROOT, `.${path}`);
  if (!file.startsWith(resolve(ROOT) + sep)) { res.writeHead(403).end(); return; }
  try {
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(await readFile(file));
  } catch { res.writeHead(404).end(); }
}).listen(0);
const APP = `http://localhost:${server.address().port}/`;
const LOCALE = LANG === 'en' ? 'en-GB' : 'fr-FR';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = [];
async function frame(page, delay = 120) {
  const png = PNG.sync.read(await page.screenshot());
  frames.push({ data: png.data, width: png.width, height: png.height, delay });
}

async function openApp(ctx, hash) {
  const page = await ctx.newPage();
  await page.goto(APP);
  await page.evaluate(([k, l]) => { localStorage.setItem('cine.tmdbKey', k); localStorage.setItem('cine.lang', l); }, [KEY, LANG]);
  await page.goto(`${APP}${hash}`);
  await page.reload();
  return page;
}

const browser = await chromium.launch();
try {
  await mkdir(OUT, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 600 }, locale: LOCALE, serviceWorkers: 'block' });
  const page = await openApp(ctx, '#envie');
  await page.waitForSelector('#moodInput');

  // 1. On tape une envie (lettre par lettre pour le GIF)
  const query = LANG === 'en'
    ? 'A cozy, funny night with some mystery, like Knives Out'
    : 'Soirée cosy, drôle avec de l\'intrigue comme À couteaux tirés';
  await frame(page, 900);
  for (let i = 3; i < query.length + 3; i += 3) {
    await page.fill('#moodInput', query.slice(0, i));
    await frame(page, 70);
  }
  await page.press('#moodInput', 'Enter');
  await page.waitForSelector('#moodOut .card img', { timeout: 20000 });
  await wait(1500);
  await frame(page, 1600);
  await page.mouse.wheel(0, 330); await wait(500);
  await frame(page, 1600);
  await page.screenshot({ path: join(OUT, 'envie.png') });

  // 2. Fiche détaillée, note, changement de pays
  await page.click('#moodOut .card');
  await page.waitForSelector('#detail .rating'); await wait(1200);
  await frame(page, 1800);
  await page.screenshot({ path: join(OUT, 'fiche.png') });
  await page.click('#detail .star[data-r="5"]'); await wait(300);
  await frame(page, 1200);
  await page.selectOption('#detailCountry', 'BE'); await wait(400);
  await frame(page, 1500);
  await page.selectOption('#detailCountry', 'FR');
  await page.click('#detail .close');

  // 3. Quelques notes de plus, puis le profil de goûts
  const cards = await page.$$('#moodOut .card');
  for (const [i, r] of [[1, 4], [2, 5], [5, 2]]) {
    if (!cards[i]) continue;
    await cards[i].click();
    await page.waitForSelector('#detail .rating');
    await page.click(`#detail .star[data-r="${r}"]`);
    await page.click('#detail .close');
  }
  await page.evaluate(() => { location.hash = '#listes'; });
  await page.click('.seg button[data-v="taste"]');
  await page.waitForSelector('#forYou .card img', { timeout: 20000 }); await wait(1500);
  await frame(page, 2200);
  await page.screenshot({ path: join(OUT, 'gouts.png') });

  // 4. Tendances
  await page.evaluate(() => { location.hash = '#tendances'; });
  await page.waitForSelector('#trendOut .card img', { timeout: 20000 }); await wait(1500);
  await frame(page, 1800);
  await ctx.close();

  // 5. Mobile
  const mctx = await browser.newContext({ ...devices['iPhone 13'], locale: LOCALE, serviceWorkers: 'block' });
  const m = await openApp(mctx, '#tendances');
  await m.waitForSelector('#trendOut .card img', { timeout: 20000 }); await wait(1500);
  await m.screenshot({ path: join(OUT, 'mobile.png') });
  await mctx.close();

  // GIF animé
  const gif = GIFEncoder();
  for (const f of frames) {
    const palette = quantize(f.data, 256);
    gif.writeFrame(applyPalette(f.data, palette), f.width, f.height, { palette, delay: f.delay });
  }
  gif.finish();
  await writeFile(join(OUT, 'demo.gif'), gif.bytes());
  console.log(`OK : ${frames.length} images dans le GIF, captures dans docs/captures/`);
} finally {
  await browser.close();
  server.close();
}
