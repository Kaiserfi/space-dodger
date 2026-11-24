// The guards' timetable: where each one's beat runs, that they walk it, and the torch after dark. node guard-day.js 9 (or 21, 3)
// Serve the repo first: python3 -m http.server 8123
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js');
const HOUR = process.argv[2] || '9';
const HOOK = `window.__t = {
  ready: () => ONLINE.ready,
  guards: () => WANDER.filter(w => GUARD_NAMES.includes(w.rec.name)).map(w => ({ n: w.rec.name, at: [+w.sp.position.x.toFixed(1), +w.sp.position.z.toFixed(1)], post: [w.lx, w.lz], beat: w.beat ? { len: +w.beat.len.toFixed(1), from: w.beat.pts[0].map(v => +v.toFixed(1)), to: w.beat.pts[w.beat.pts.length - 1].map(v => +v.toFixed(1)) } : w.beat, torch: !!w.dark, hit: npcHit(w.sp.position.x, w.sp.position.z) })),
  clear: () => WANDER.filter(w => GUARD_NAMES.includes(w.rec.name) && w.beat).map(w => { const [bx, bz] = w.beat.pts[0]; let bad = 0; for (let i = 0; i <= 30; i++) if (npcHit(w.lx + (bx - w.lx) * i / 30, w.lz + (bz - w.lz) * i / 30)) bad++; return w.rec.name + ' post-to-beat blocked samples: ' + bad; }),
  shot: (n, file) => { const w = WANDER.find(q => q.rec.name === n); const cam = new THREE.PerspectiveCamera(45, 1.5, 0.1, 400); const p = w.sp.position; const a = w.sp.rotation.y + (window.__ang || 0); cam.position.set(p.x + Math.sin(a) * 6, 4, p.z + Math.cos(a) * 6); cam.lookAt(p.x, 1.5, p.z); renderer.render(scene, cam); return renderer.domElement.toDataURL('image/png'); },
};`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 600, height: 400 } }); const p = await ctx.newPage();
  await offlineDb(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off' })); localStorage.setItem('itapName', 'Tester'); localStorage.setItem('itapId', 'idTester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text();
    body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=' + HOUR, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  await p.waitForTimeout(4000); console.log(JSON.stringify(await p.evaluate(() => window.__t.guards())));
  await p.waitForTimeout(15000); console.log(JSON.stringify(await p.evaluate(() => window.__t.guards().map(g => g.n + ' ' + g.at + ' hit:' + g.hit))));
  console.log(JSON.stringify(await p.evaluate(() => window.__t.clear())));
  for (const n of ['Osric', 'Edda']) { const u = await p.evaluate(([n]) => window.__t.shot(n), [n]); require('fs').writeFileSync(`${process.env.OUT || '.'}/guard-${n}-${HOUR}.png`, Buffer.from(u.split(',')[1], 'base64')); }
  await b.close();
})();
