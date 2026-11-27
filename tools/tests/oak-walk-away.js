// Walking away from an oak stops the chop, whatever the walk is to (another tree, a person, a rock), not only a tap on the ground.
// An oak rarely falls, so before the fix the swing kept facing the oak while you walked off.  (serve the repo on 8123 first)
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js');
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); };
const HOOK = `const recs = () => trees.map(g => g.userData && g.userData.rec).filter(Boolean);
window.__t = {
  ready: () => ONLINE.ready,
  oakNear: () => { const oak = recs().find(n => n.kind === 'tree' && n.level >= 15 && n.state === 'standing'); SKILL_XP.Woodcutting = 99999; addItem('Bronze axe', 1, ICON_FOR['Bronze axe']);
    const p = [[2.4, 0], [-2.4, 0], [0, 2.4], [0, -2.4]].map(([dx, dz]) => ({ x: oak.x + dx * oak.s * 0.85, z: oak.z + dz * oak.s * 0.85 })).find(q => !blocked(q.x, q.z));
    hero.position.set(p.x, 0, p.z); walkTarget = null; walkQueue = []; window.__oak = oak; clickNode(oak); return oak.key; },
  chopping: () => chop.rec ? chop.rec.key + ' t' + chop.t : null,
  act: () => ONLINE.act ? ONLINE.act.k : null,
  goTo: kind => { const far = recs().filter(n => n.kind === kind && n !== window.__oak && (kind !== 'npc' || !n.asleep)).sort((a, b) => Math.hypot(a.x - hero.position.x, a.z - hero.position.z) - Math.hypot(b.x - hero.position.x, b.z - hero.position.z))[0]; clickNode(far); return far.name || far.key; },
  /* the share of taps within R pixels of the hero that land on the oak instead of the ground, from the game camera */
  oakTaps: R => { const r = renderer.domElement.getBoundingClientRect(), v = hero.position.clone().setY(1.5).project(camera), hx = (v.x + 1) / 2 * r.width, hy = (1 - v.y) / 2 * r.height; let n = 0, on = 0;
    for (let dx = -R; dx <= R; dx += 12) for (let dy = -R; dy <= R; dy += 12) { if (Math.hypot(dx, dy) > R) continue; n++;
      ndc.set(((hx + dx) / r.width) * 2 - 1, -((hy + dy) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const h = liveHit(ray.intersectObjects(trees, true)); let g = h && h.object; while (g && !g.userData.rec) g = g.parent; if (g && g.userData.rec === window.__oak) on++; }
    return Math.round(on / n * 100) + '% of taps within ' + R + 'px'; },
  oakPoint: () => { const r = renderer.domElement.getBoundingClientRect(), v = hero.position.clone().setY(1.5).project(camera), hx = (v.x + 1) / 2 * r.width, hy = (1 - v.y) / 2 * r.height;
    for (let R = 60; R < 220; R += 12) for (let a = 0; a < 24; a++) { const x = hx + Math.cos(a * Math.PI / 12) * R, y = hy + Math.sin(a * Math.PI / 12) * R;
      ndc.set((x / r.width) * 2 - 1, -(y / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const h = liveHit(ray.intersectObjects(trees, true)); let g = h && h.object; while (g && !g.userData.rec) g = g.parent;
      if (g && g.userData.rec === window.__oak && document.elementFromPoint(r.left + x, r.top + y) === renderer.domElement) return [r.left + x, r.top + y]; } return null; },
  walking: () => !!(walkTarget || walkQueue.length),
};`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 800 } }); const p = await ctx.newPage();
  await offlineDb(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, saver: true })); localStorage.setItem('itapName', 'Anna'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); const body = (await resp.text()).replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 });
  await p.evaluate(() => { const b = document.getElementById('crStart'); if (b && b.offsetParent) b.click(); });
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  await t('oakNear'); await p.waitForTimeout(2500); console.log('taps on the oak:', await t('oakTaps', 120), '|', await t('oakTaps', 200));
  for (const kind of ['npc', 'tree']) {
    await t('oakNear'); await p.waitForFunction(() => window.__t.chopping(), null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(1500); const was = await t('chopping'); check(was && (await t('act')) === 'chop', 'chopping the oak', was);
    const to = await t('goTo', kind); await p.waitForTimeout(300);
    check(!(await t('chopping')) && (await t('walking')) && (await t('act')) !== 'chop', `walking off to a ${kind} (${to}) stops the chop`, { chop: await t('chopping'), act: await t('act') });
  }
  await t('oakNear'); await p.waitForFunction(() => window.__t.chopping(), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(1500);
  const pt = await t('oakPoint'); check(pt, 'found a tap near the hero that lands on the oak', pt);
  if (pt) { await p.mouse.click(pt[0], pt[1]); await p.waitForTimeout(600);
    check(!(await t('chopping')) && (await t('walking')), 'tapping the oak you are chopping walks you away instead of chopping on', { chop: await t('chopping'), walking: await t('walking') }); }
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await ctx.close(); await b.close();
})();
