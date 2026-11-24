// The guards' day: day watch and night watch, sleeping in their bunks, eating at the mess table, walking to and from their posts.
// node guard-schedule.js <hour>  (serve the repo on 8123 first; OUT=<folder> for pictures)
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js'); const fs = require('fs');
const HOUR = process.argv[2] || '3', OUT = process.env.OUT || '.';
const HOOK = `window.__t = {
  ready: () => ONLINE.ready,
  routes: () => { for (const w of WANDER) delete w.routes; const t0 = performance.now(); const out = WANDER.filter(w => GUARD_NAMES.includes(w.rec.name)).map(w => { const r = guardRoutes(w); return w.rec.name + ' to seat ' + r.post2seat.len.toFixed(0) + ' (' + (r.post2seat.len / GUARD_SPEED / 60).toFixed(1) + ' min), seat to bed ' + r.seat2bed.len.toFixed(0); }); return out.concat('worked out in ' + (performance.now() - t0).toFixed(0) + ' ms (already done if 0)'); },
  guards: () => WANDER.filter(w => GUARD_NAMES.includes(w.rec.name)).map(w => w.rec.name + ': ' + guardState(w, hourNow()).mode + ' at ' + w.sp.position.x.toFixed(1) + ',' + w.sp.position.z.toFixed(1) + (w.lying ? ' lying' : '') + (w.sitting ? ' sitting' : '') + ' kit=' + w.kit),
  box: n => { const w = WANDER.find(q => q.rec.name === n); const bx = new THREE.Box3().setFromObject(w.sp); return [bx.min, bx.max].map(v => [v.x, v.y, v.z].map(a => +a.toFixed(2))); },
  click: n => { clickNode(WANDER.find(w => w.rec.name === n).rec); return document.getElementById('toast').textContent; },
  shot: (px, py, pz, lx, ly, lz) => { BARRACKS.roof.visible = false; const cam = new THREE.PerspectiveCamera(50, 1.5, 0.3, 500); cam.position.set(px, py, pz); cam.lookAt(lx, ly, lz); renderer.setSize(1200, 800, false); renderer.render(scene, cam); return renderer.domElement.toDataURL('image/jpeg', 0.85); },
};`;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); await offlineDb(p);
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off', saver: false })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=' + HOUR, { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  await p.waitForTimeout(6000);
  console.log(HOUR + ':00'); for (const l of await p.evaluate(() => window.__t.routes())) console.log('  ' + l);
  for (const l of await p.evaluate(() => window.__t.guards())) console.log('  ' + l);
  console.log('  Edda box', JSON.stringify(await p.evaluate(() => window.__t.box('Edda'))));
  const sleeper = HOUR < 6 ? 'Osric' : 'Edda'; console.log('  click', sleeper + ':', await p.evaluate(n => window.__t.click(n), sleeper));
  for (const [n, a] of Object.entries({ bunks: [-42, 6.5, 81, -48, 3, 76], table: [-31, 4.5, 68, -38, 1, 74] })) { const u = await p.evaluate(a => window.__t.shot(...a), a); fs.writeFileSync(`${OUT}/guards-${n}-${HOUR}b.jpg`, Buffer.from(u.split(',')[1], 'base64')); }
  await b.close();
})();
