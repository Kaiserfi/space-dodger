// The barracks and jail: walk in through the front door and on into the jail, try to get into a cell (you can't), talk to
// Rennick through the bars, and take pictures outside and in with the grass on high. node barracks.js  (serve the repo on 8123 first)
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js'); const fs = require('fs');
const OUT = process.env.OUT || '.';
const HOOK = `window.__t = {
  ready: () => ONLINE.ready,
  tp: (x, z) => { hero.position.set(x, 0, z); walkTarget = null; walkQueue = []; },
  walk: (x, z) => walkStart(new THREE.Vector3(x, 0, z), null),
  at: () => [+hero.position.x.toFixed(2), +hero.position.z.toFixed(2), !!walkTarget],
  ren: () => { const w = WANDER.find(q => q.rec.name === 'Rennick'); return [+w.rec.x.toFixed(2), +w.rec.z.toFixed(2)]; },
  talk: () => clickNode(WANDER.find(q => q.rec.name === 'Rennick').rec),
  dlg: () => !!dlg && dlg.name,
  heroTop: () => +new THREE.Box3().setFromObject(hero).max.y.toFixed(2),
  roof: () => BARRACKS.roof.visible,
  shot: (px, py, pz, lx, ly, lz) => { const cam = new THREE.PerspectiveCamera(50, 1.5, 0.3, 500); cam.position.set(px, py, pz); cam.lookAt(lx, ly, lz); renderer.setSize(1200, 800, false); renderer.render(scene, cam); return renderer.domElement.toDataURL('image/jpeg', 0.85); },
};`;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); await offlineDb(p);
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'high', saver: false })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  const walkTo = async (x, z, label) => { await t('walk', x, z); await p.waitForFunction(() => !window.__t.at()[2], null, { timeout: 120000, polling: 300 }).catch(() => {}); console.log(label, JSON.stringify(await t('at')), 'roof shown:', await t('roof')); };
  await t('tp', -38, 52); await p.waitForTimeout(1500);
  console.log('hero height', await t('heroTop'), '(front door 5.2, jail door 4.9)');
  await walkTo(-38, 70, 'through the front door ->');
  await walkTo(-23, 73, 'on into the jail corridor ->');
  await walkTo(-16, 73, 'into the middle cell (should stop short) ->');
  await walkTo(-16, 67, 'into the first cell (should stop short) ->');
  console.log('Rennick at', JSON.stringify(await t('ren'))); await p.waitForTimeout(8000); console.log('Rennick later', JSON.stringify(await t('ren')));
  await t('tp', -23, 66); await t('talk'); await p.waitForFunction(() => window.__t.dlg(), null, { timeout: 60000, polling: 300 }).catch(() => {}); console.log('talking to', await t('dlg'), 'from', JSON.stringify(await t('at')));
  await p.keyboard.press('Escape');
  const shots = { out: [-30, 3.2, 47, -38, 4.2, 62], hall: [-44, 5.5, 63, -34, 1, 78], jailin: [-24, 5.5, 66, -16, 1, 74] };
  await t('tp', -38, 75); await p.waitForTimeout(800);
  for (const [n, a] of Object.entries(shots)) { const u = await t('shot', ...a); fs.writeFileSync(`${OUT}/barracks-${n}.jpg`, Buffer.from(u.split(',')[1], 'base64')); }
  await b.close();
})();
