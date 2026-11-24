// Tobin, Ysolde and Dunmore's day: where each is and what they're doing at a given hour, plus pictures.
// node villager-day.js <hour>   (serve the repo on 8123 first; OUT=<folder> for pictures)
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js'); const fs = require('fs');
const HOUR = process.argv[2] || '9', OUT = process.env.OUT || '/tmp';
const HOOK = `window.__t = {
  ready: () => ONLINE.ready,
  state: () => WANDER.filter(w => VILLAGER_DAY[w.rec.name]).map(w => { const s = villagerState(w, hourNow()); return w.rec.name + ': ' + s.mode + (s.where ? ' @' + s.where : '') + ' at ' + w.sp.position.x.toFixed(1) + ',' + w.sp.position.z.toFixed(1) + (w.rec.asleep ? ' (asleep)' : '') + ' routes ' + Object.entries(w.vroutes || {}).map(([k, r]) => k + '=' + r.len.toFixed(0)).join(' '); }),
  click: n => { clickNode(WANDER.find(w => w.rec.name === n).rec); return document.getElementById('toast').textContent; },
  seats: () => [...VSEAT_TAKEN],
  bed: () => { const w = WANDER.find(q => q.rec.name === 'Tobin'); const bx = new THREE.Box3(), tmp = new THREE.Box3(); w.sp.updateMatrixWorld(true); w.sp.traverseVisible(o => { if (o.isMesh) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bx.union(tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } }); let top = 0; const room = w.house.roof.parent; room.traverse(o => { if (o.isMesh && Math.hypot(o.getWorldPosition(new THREE.Vector3()).x - w.house.bed.x, o.getWorldPosition(new THREE.Vector3()).z - w.house.bed.z) < 2.5) top = Math.max(top, new THREE.Box3().setFromObject(o).max.y < 3 ? new THREE.Box3().setFromObject(o).max.y : top); }); return { lieDz: w.lieDz, rx: +w.sp.rotation.x.toFixed(2), here: w.rec.asleep, bedTop: w.house.bedTop, k: w.house.k, lieFix: w.lieFix, figMin: bx.min.y, figMax: bx.max.y, measuredBedTop: top, y: w.sp.position.y }; },
  shot: (n, ox, oy, oz) => { const w = WANDER.find(q => q.rec.name === n), p = w.sp.position; for (const h of houses) h.roof.visible = false; const cam = new THREE.PerspectiveCamera(50, 1.5, 0.3, 500); cam.position.set(p.x + ox, oy, p.z + oz); cam.lookAt(p.x, Math.max(1.5, p.y), p.z); renderer.setSize(1200, 800, false); renderer.render(scene, cam); return renderer.domElement.toDataURL('image/jpeg', 0.85); },
};`;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); await offlineDb(p);
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off', saver: false })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=' + HOUR, { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  await p.waitForTimeout(8000);
  console.log(HOUR + ':00  seats taken', JSON.stringify(await p.evaluate(() => window.__t.seats()))); for (const l of await p.evaluate(() => window.__t.state())) console.log('  ' + l);
  if (+HOUR === 15) console.log('  bed', JSON.stringify(await p.evaluate(() => window.__t.bed())));
  if (+HOUR < 6) console.log('  click Tobin:', await p.evaluate(() => window.__t.click('Tobin')));
  for (const [n, a] of Object.entries({ Ysolde: [-5, 3.5, 3], Tobin: (+HOUR > 6 && +HOUR < 12 ? [-4, 3.5, 4] : [4.5, 2.6, 0.5]) })) { const u = await p.evaluate(([n, a]) => window.__t.shot(n, ...a), [n, a]); fs.writeFileSync(`${OUT}/v-${n}-${HOUR}.jpg`, Buffer.from(u.split(',')[1], 'base64')); }
  await b.close();
})();
