// Multiplayer test harness: several players sharing one in-memory FakeDb, so nothing reaches the live game.
//   node tools/play2.js hooks.js steps.js [players=2]
// hooks.js as for play.js (run inside every player's game). steps.js:
//   module.exports = async (pages, t, db) => { const [A, B] = pages; console.log(await t(A, 'hp')); console.log(db.get('adventure/live/parties')); };
// Players are named Alfa, Bravo, Charlie, Delta. Look remote players up by name, not Object.values(remote)[0].
const { chromium } = require('playwright'); const { FakeDb } = require('./fake-db.js');
const fs = require('fs'), path = require('path');
const HOOK = fs.readFileSync(process.argv[2], 'utf8'), steps = require(path.resolve(process.argv[3])), n = +(process.argv[4] || 2);
const BASE = `window.__t = Object.assign(window.__t || {}, { ready: () => ONLINE.ready,
  near: (x, z) => { walkTarget = null; walkQueue = []; hero.position.set(x, 0, z); heroShadow.position.set(x, 0.06, z); writePresence(true); return 'ok'; },
  who: name => Object.keys(remote).find(id => remote[id].name === name) || null });\n`;
(async () => {
  const db = new FakeDb(), b = await chromium.launch(), pages = [];
  for (const name of ['Alfa', 'Bravo', 'Charlie', 'Delta'].slice(0, n)) {
    const ctx = await b.newContext({ viewport: { width: 900, height: 600 } }), p = await ctx.newPage();   // one context per player
    await db.attach(p); p.on('pageerror', e => console.log(name, 'PAGEERROR', e.message));
    await p.addInitScript(() => { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off', saver: false })); });
    await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text();
      body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + BASE + HOOK); await r.fulfill({ response: resp, body }); });
    await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForSelector('#nameInput', { state: 'visible', timeout: 90000 }); await p.fill('#nameInput', name); await p.click('#joinBtn');
    await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 90000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
    pages.push(p);
  }
  const t = (p, name, ...a) => p.evaluate(([nm, a]) => window.__t[nm](...a), [name, a]);
  try { await steps(pages, t, db); } catch (e) { console.log('STEP ERROR', e.message); }
  await b.close();
})();
