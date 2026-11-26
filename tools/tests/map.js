// The map button: opens the map with the other player on it, the compass turns the camera north, another panel closes it,
// and there is no map underground. Two players on a phone-sized screen.  OUT=/some/scratch/folder node map.js [hour]  (serve the repo on 8123 first)
const { chromium } = require('playwright'); const { FakeDb } = require('../fake-db.js'); const fs = require('fs');
const OUT = process.env.OUT || '.', HOUR = process.argv[2] || '13';
const HOOK = `window.__t = {
  ready: () => ONLINE.ready,
  tp: (x, z) => { hero.position.set(x, 0, z); walkTarget = null; walkQueue = []; },
  view: (p, y, d) => { pitch = p; yaw = y; dist = d; },
  yaw: () => +yaw.toFixed(3),
  others: () => Object.values(remote).map(r => [r.name, Math.round(r.sprite.position.x), Math.round(r.sprite.position.z), r.sprite.visible]),
  map: () => ({ open: !MAPUI.panel.hidden, baked: !!MAPUI.shot, on: document.getElementById('tabMap').classList.contains('on'), tracker: getComputedStyle(document.getElementById('questTrack')).display, canvas: MAPUI.cv.width, box: (r => [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)])(MAPUI.panel.getBoundingClientRect()), size: [renderer.domElement.width, renderer.domElement.height, innerWidth, innerHeight], sun: [sun.intensity.toFixed(2), sun.position.y.toFixed(0)], fog: scene.fog.far }),
  toast: () => (document.getElementById('toast') || {}).textContent,
};`;
(async () => {
  const db = new FakeDb(); const b = await chromium.launch(); const pages = {};
  for (const name of ['Anna', 'Ben']) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 800 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await db.attach(p, 'id' + name); p.on('pageerror', e => console.log(name, 'PAGEERROR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
    await p.addInitScript(n => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off', saver: true })); localStorage.setItem('itapName', n); localStorage.setItem('itapId', 'id' + n); } catch (e) {} }, name);
    await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text();
      body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
    await p.goto('http://localhost:8123/adventure/?hour=' + HOUR, { waitUntil: 'domcontentloaded', timeout: 90000 }); pages[name] = p;
  }
  for (const p of Object.values(pages)) { await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart'); }
  const A = pages.Anna, B = pages.Ben, t = (p, f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  await t(A, 'tp', 4, 34); await t(B, 'tp', 14, 24); await t(A, 'view', 0.95, 0.6, 30);
  await A.waitForFunction(() => window.__t.others().some(o => o[0] === 'Ben' && Math.abs(o[1] - 14) < 2), null, { timeout: 120000, polling: 500 });
  console.log('Anna sees', JSON.stringify(await t(A, 'others')));
  console.log('before', JSON.stringify(await t(A, 'map')));
  await A.click('#tabMap'); await A.waitForTimeout(2500); console.log('open', JSON.stringify(await t(A, 'map'))); await A.screenshot({ path: `${OUT}/map-${HOUR}-open.png` });
  await t(A, 'view', 0.95, 2.4, 30); await A.waitForTimeout(1500); await A.screenshot({ path: `${OUT}/map-${HOUR}-turned.png` });
  await A.click('#mapCompass'); await A.waitForFunction(() => Math.abs(window.__t.yaw()) < 0.01, null, { timeout: 60000, polling: 300 }).catch(() => {}); console.log('yaw after the compass', await t(A, 'yaw')); await A.waitForTimeout(800); await A.screenshot({ path: `${OUT}/map-${HOUR}-north.png` });
  await A.click('#tabBag'); await A.waitForTimeout(600); console.log('bag opened', JSON.stringify(await t(A, 'map'))); await A.screenshot({ path: `${OUT}/map-${HOUR}-bag.png` });
  await A.click('#tabMap'); await A.waitForTimeout(600); console.log('map again', JSON.stringify(await t(A, 'map')));
  await A.click('#tabMap'); await A.waitForTimeout(400); console.log('closed', JSON.stringify(await t(A, 'map')));
  await t(A, 'tp', 0, 400); await A.waitForTimeout(500); await A.click('#tabMap'); await A.waitForTimeout(500); console.log('underground:', await t(A, 'toast'), JSON.stringify((await t(A, 'map')).open));
  await b.close();
})();
