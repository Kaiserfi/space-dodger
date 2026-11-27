// One profile, one device at a time: two pages signed in as the same account (FakeDb, never the live game).
// The newer one plays on; the older one stops saving and offers "Play here", which takes the profile back.
const { chromium } = require('playwright');
const { FakeDb } = require('../fake-db');
const OUT = process.env.OUT || '.';
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 200) : '')); };
const HOOK = `window.__t = { ready: () => ONLINE.ready, s0: () => XFER.s0, setCoins: n => { COINS = n; ONLINE.saveJson = ''; saveNow(false); return n; } };`;
const db = new FakeDb();
async function open(b, ctx){
  ctx = ctx || await b.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); await db.attach(p, 'idAnna');
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?.*)?$/, async r => { const res = await r.fetch(); const body = (await res.text()).replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: res, body }); });
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0 })); localStorage.setItem('itapName', 'Anna'); } catch (e) {} });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => window.__t && window.__t.ready() && window.__t.s0() > 0, null, { timeout: 120000 });
  return { p, ctx, t: (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]) };
}
(async () => {
  const b = await chromium.launch();
  const A = await open(b); await A.t('setCoins', 50); await A.p.waitForTimeout(1500);
  const B = await open(b);
  await A.p.waitForFunction(() => !window.__t.ready(), null, { timeout: 60000 }).catch(() => {});
  check(!(await A.t('ready')), 'the older device stops when the profile opens on another');
  check(await A.p.isVisible('#playHereBtn'), 'and offers to play there instead', await A.p.textContent('#onlineStatus'));
  await A.p.screenshot({ path: OUT + '/one-device-stopped.png' });
  check(await B.t('ready'), 'the newer device plays on');
  await A.t('setCoins', 999); await A.p.waitForTimeout(3000);
  check((db.get('adventure/saves/idAnna') || {}).co !== 999, "the stopped device doesn't save", (db.get('adventure/saves/idAnna') || {}).co);
  await A.p.click('#playHereBtn'); await A.p.waitForTimeout(3000);
  await A.p.waitForFunction(() => window.__t && window.__t.ready() && window.__t.s0() > 0, null, { timeout: 120000 });
  await B.p.waitForFunction(() => !window.__t.ready(), null, { timeout: 60000 }).catch(() => {});
  check(!(await B.t('ready')) && await A.t('ready'), '"Play here" takes the profile back');
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await A.ctx.close(); await B.ctx.close(); await b.close();
})();
