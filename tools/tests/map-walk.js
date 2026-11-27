// Tapping the map walks you there: with the camera turned, a tap on the map must aim at the same spot the map shows there,
// the hero sets off towards it, and a red flag marks where. Phone-sized, offline.  OUT=/some/scratch/folder node map-walk.js  (serve the repo on 8123 first)
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js');
const OUT = process.env.OUT || '.';
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); };
const HOOK = `window.__t = {
  ready: () => ONLINE.ready,
  tp: (x, z) => { hero.position.set(x, 0, z); walkTarget = null; walkQueue = []; },
  view: y => { yaw = y; },
  hero: () => [+hero.position.x.toFixed(2), +hero.position.z.toFixed(2)],
  dest: () => walkFinal ? [+walkFinal.x.toFixed(2), +walkFinal.z.toFixed(2)] : null,
  walking: () => !!(walkTarget || walkQueue.length),
  /* where drawMap would put a world point on the canvas, in CSS pixels from the canvas centre */
  onMap: (x, z) => { const r = MAPUI.cv.getBoundingClientRect(), k = r.width / MAPUI.span, rx = x - hero.position.x, rz = z - hero.position.z, cy = Math.cos(yaw), sy = Math.sin(yaw); return [(rx * cy - rz * sy) * k, (rx * sy + rz * cy) * k]; },
  toast: () => (document.getElementById('toast') || {}).textContent || '',
};`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 800 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  await offlineDb(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, saver: true })); localStorage.setItem('itapName', 'Anna'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); const body = (await resp.text()).replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 });
  await p.evaluate(() => { const b = document.getElementById('crStart'); if (b && b.offsetParent) b.click(); });
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  await t('tp', 4, 34); await t('view', 0.9);
  await p.click('#tabMap'); await p.waitForTimeout(3000);
  const box = await p.locator('#mapCanvas').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const tap = [55, -35];
  await p.mouse.click(cx + tap[0], cy + tap[1]); await p.waitForTimeout(400);
  const dest = await t('dest'), start = await t('hero');
  check(dest && await t('walking'), 'a tap on the map starts a walk', dest);
  const back = dest ? await t('onMap', dest[0], dest[1]) : [0, 0];
  check(Math.hypot(back[0] - tap[0], back[1] - tap[1]) < 1.5, 'it aims at the spot the map shows under the tap (camera turned)', back.map(v => +v.toFixed(1)));
  await p.waitForTimeout(300); await p.locator('#mapPanel').screenshot({ path: `${OUT}/map-walk-flag.png` });
  await p.waitForTimeout(8000);
  const now = await t('hero'), d0 = Math.hypot(dest[0] - start[0], dest[1] - start[1]), d1 = Math.hypot(dest[0] - now[0], dest[1] - now[1]);
  check(d1 < d0 - 1, 'the hero heads there', { start, now, dest });
  await p.locator('#mapPanel').screenshot({ path: `${OUT}/map-walk-later.png` });
  await t('tp', 4, 34); await t('view', 0);   /* north up: tap straight up, into the river */
  await p.mouse.click(cx, box.y + 6); await p.waitForTimeout(400);
  check(await t('walking') && !/No way/.test(await t('toast')), 'a tap on water walks to the nearest spot you can reach', { dest: await t('dest'), toast: await t('toast') });
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await ctx.close(); await b.close();
})();
