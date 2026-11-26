// How much the game draws: draw calls (with and without the shadow pass) and triangles at three spots, from top-down to a flat camera,
// on a phone-sized screen with battery saver and on a desktop-sized one, plus a screenshot of each view to compare before and after a change.
// OUT=/some/scratch/folder node draw-calls.js  (serve the repo on 8123 first)
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js'); const fs = require('fs');
const OUT = process.env.OUT || '.'; fs.mkdirSync(OUT, { recursive: true });
const HOOK = `window.__t = {
  ready: () => ONLINE.ready,
  tp: (x, z) => { hero.position.set(x, 0, z); walkTarget = null; walkQueue = []; },
  view: (p, y, d) => { pitch = p; yaw = y; dist = d; },
  calls: () => { const I = renderer.info; I.autoReset = false; I.reset(); renderer.render(scene, camera); const r = [I.render.calls, I.render.triangles]; I.autoReset = true; return r; },
  noShadowCalls: () => { const I = renderer.info; sun.castShadow = false; I.autoReset = false; I.reset(); renderer.render(scene, camera); const r = [I.render.calls, I.render.triangles]; I.autoReset = true; sun.castShadow = true; return r; },
};`;
(async () => {
  const b = await chromium.launch();
  for (const [hour, saver] of [[13, true], [13, false], [23, true]]) {
    const ctx = await b.newContext({ viewport: saver ? { width: 412, height: 800 } : { width: 1100, height: 700 } }); const p = await ctx.newPage(); await offlineDb(p);
    p.on('pageerror', e => console.log('PAGEERROR', e.message));
    await p.addInitScript(s => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off', saver: s })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} }, saver);
    await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
    await p.goto('http://localhost:8123/adventure/?hour=' + hour, { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
    await p.waitForTimeout(4000);
    const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
    for (const [x, z] of [[0, 30], [70, 40], [-20, -60]]) { await t('tp', x, z);
      for (const [n, pt, yw, d] of [['top', 0.15, 0.6, 30], ['default', 0.95, 0.6, 30], ['flat', 1.5, 0.6, 30], ['flat2', 1.5, 3.7, 30], ['zoomout', 1.2, 2.2, 60]]) { await t('view', pt, yw, d); await p.waitForTimeout(1800);
        const a = await t('calls'), ns = await t('noShadowCalls'); console.log(hour, saver ? 'saver' : 'full', x, z, n, 'calls', a[0], 'main', ns[0], 'shadow', a[0] - ns[0], 'tris', a[1]);
        if (n !== 'top') await p.screenshot({ path: `${OUT}/${hour}-${saver ? 's' : 'f'}-${x}_${z}-${n}.png` }); } }
    await ctx.close();
  }
  await b.close();
})();
