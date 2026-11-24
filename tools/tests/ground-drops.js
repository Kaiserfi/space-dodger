// Monster drops land on the ground: the killer sees them at once, the other player only once they turn public, and only one
// of them can pick a pile up. Serve the repo first: python3 -m http.server 8123
const { chromium } = require('playwright'); const { FakeDb } = require('../fake-db.js');
const HOOK = `window.__t = {
  ready: () => ONLINE.ready,
  kill: () => { const m = MONSTERS.find(q => q.type === 'chicken' && q.state === 'standing'); hero.position.set(m.x + 1.5, 0, m.z); walkTarget = null; killMonster(m); return [m.x, m.z]; },
  go: (x, z) => { hero.position.set(x + 1, 0, z); walkTarget = null; },
  ground: () => GROUND.map(g => g.name + 'x' + g.qty + (g.shown ? '' : '(hidden)') + (g.shared ? '' : '(local)')),
  near: () => { const g = GROUND.find(q => q.shown); hero.position.set(g.x + 1, 0, g.z); walkTarget = null; },
  take: i => { const g = GROUND.filter(q => q.shown)[i || 0]; if (g) pickUp(g); },
  bag: () => bag.map(i => i.name + 'x' + i.qty).join(','),
  toast: () => (document.getElementById('toast') || {}).textContent,
};`;
(async () => {
  const db = new FakeDb(); const b = await chromium.launch(); const pages = [];
  for (const name of ['Anna', 'Ben']) {
    const ctx = await b.newContext({ viewport: { width: 560, height: 360 } }); const p = await ctx.newPage();
    await db.attach(p); p.on('pageerror', e => console.log(name, 'PAGEERROR', e.message));
    await p.addInitScript(n => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off' })); localStorage.setItem('itapName', n); localStorage.setItem('itapId', 'id' + n); } catch (e) {} }, name);
    await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text();
      body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
    await p.goto('http://localhost:8123/adventure/', { waitUntil: 'domcontentloaded', timeout: 90000 }); pages.push(p);
  }
  for (const p of pages) { await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart'); }
  const [A, B] = pages; await A.waitForTimeout(3000);
  const [x, z] = await A.evaluate(() => window.__t.kill()); await B.evaluate(([x, z]) => window.__t.go(x, z), [x, z]);
  await A.waitForTimeout(5000);
  console.log('A bag', await A.evaluate(() => window.__t.bag()), '| A ground', JSON.stringify(await A.evaluate(() => window.__t.ground())));
  console.log('B ground (private)', JSON.stringify(await B.evaluate(() => window.__t.ground())));
  console.log('db', JSON.stringify(db.get('adventure/live/ground')));
  const g = db.get('adventure/live/ground'); for (const k in g) db.set(`adventure/live/ground/${k}/pub`, Date.now() - 1000);   // a minute later
  await B.waitForTimeout(4000); console.log('B ground (public)', JSON.stringify(await B.evaluate(() => window.__t.ground())));
  await Promise.all([A.evaluate(() => window.__t.take(0)), B.evaluate(() => window.__t.take(0))]); await B.waitForTimeout(4000);
  console.log('A', await A.evaluate(() => window.__t.bag()), '|', await A.evaluate(() => window.__t.toast()));
  console.log('B', await B.evaluate(() => window.__t.bag()), '|', await B.evaluate(() => window.__t.toast()));
  console.log('A ground', JSON.stringify(await A.evaluate(() => window.__t.ground())), 'B ground', JSON.stringify(await B.evaluate(() => window.__t.ground())), 'db', JSON.stringify(db.get('adventure/live/ground')));
  await B.evaluate(() => window.__t.near());
  await B.evaluate(() => window.__t.take(0)); await B.waitForTimeout(4000);
  console.log('B takes feathers', await B.evaluate(() => window.__t.bag()), '|', await B.evaluate(() => window.__t.toast()), '| A ground', JSON.stringify(await A.evaluate(() => window.__t.ground())));
  await b.close(); process.exit(0);
})();
