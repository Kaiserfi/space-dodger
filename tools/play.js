// One-player test harness for ITAP Adventure. Never touches the live database (offlineDb answers everything locally).
//   python3 -m http.server 8123 &      (from the repo root, once)
//   node tools/play.js hooks.js steps.js [hour]
// hooks.js: plain JS run INSIDE the game module after start-up, so game internals are in scope. Define helpers on window.__t:
//     window.__t = Object.assign(window.__t || {}, { hp: () => HP.cur + '/' + maxHp() });
// steps.js: module.exports = async (page, t, shot) => { console.log(await t('hp')); await shot('a.png', [x, y, z, lookX, lookY, lookZ, fov]); };
//   t(name, ...args) calls window.__t[name]; shot() renders a frame from a camera you place (the game camera follows the hero).
const { chromium } = require('playwright'); const { offlineDb } = require('./offline-db.js');
const fs = require('fs'), path = require('path');
const HOOK = fs.readFileSync(process.argv[2], 'utf8'), steps = require(path.resolve(process.argv[3])), hour = process.argv[4] || '13';
const BASE = `window.__t = Object.assign(window.__t || {}, { ready: () => ONLINE.ready,
  shot: (x, y, z, lx, ly, lz, fov = 40) => { const cam = new THREE.PerspectiveCamera(fov, 4 / 3, 0.1, 300); cam.position.set(x, y, z); cam.lookAt(lx, ly, lz); renderer.setSize(800, 600, false); renderer.render(scene, cam); return renderer.domElement.toDataURL('image/png'); },
  near: (x, z) => { walkTarget = null; walkQueue = []; hero.position.set(x, 0, z); heroShadow.position.set(x, 0.06, z); writePresence(true); return 'ok'; } });\n`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 600 } });
  await offlineDb(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off', saver: false })); });
  // only the local page is rewritten to add the hooks; never a broad glob that would also catch the database's /adventure/ paths
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text();
    body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + BASE + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=' + hour, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('#nameInput', { state: 'visible', timeout: 90000 }); await p.fill('#nameInput', 'Tester'); await p.click('#joinBtn');
  await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 90000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  const t = (name, ...a) => p.evaluate(([n, a]) => window.__t[n](...a), [name, a]);
  const shot = async (file, a) => { const d = await t('shot', ...a); fs.writeFileSync(file, Buffer.from(d.split(',')[1], 'base64')); };
  try { await steps(p, t, shot); } catch (e) { console.log('STEP ERROR', e.message); }
  await b.close();
})();
