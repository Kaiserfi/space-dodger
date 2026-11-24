// Two players on a shared fake database play through the bonfire night: the secret phrase, sitting, a log on the fire,
// the goblin raid, a death and its gravestone, then either a win (node bonfire-night.js win) or a loss with the guards (lose).
// Serve the repo first: python3 -m http.server 8123
const { chromium } = require('playwright'); const { FakeDb } = require('../fake-db.js');
const MODE = process.argv[2] || 'win';
const HOOK = `window.__t = {
  ev: () => ({ ph: evPhase(), fuel: +fuelNow().toFixed(3), st: EV.data && EV.data.raid && EV.data.raid.st, npcs: Object.keys(EV.npcs), seat: EV.seat, gobs: (EV.data && EV.data.gob || []).map(g => g.hp + ':' + g.s + ':' + (g.tg || '').slice(0, 4)), hp: HP.cur, fight: !!FIGHT, host: amHost(), dead: EV.deadNow, remSeats: Object.values(remote).map(r => r.st), graves: Object.keys(GRAVES), bag: bag.map(i => i.name + 'x' + i.qty).join(','), eq: Object.values(equipped).filter(Boolean).join(',') }),
  say: text => { const i = document.getElementById('chatInput'); i.value = text; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); },
  give: () => { addItem('Logs', 5, ICON_FOR['Logs']); addItem('Coins', 40, COIN_ICON); addItem('Bronze axe', 1, ICON_FOR['Bronze axe']); addItem('Copper ore', 3, ICON_FOR['Copper ore']); addItem('Bronze sword', 1, ICON_FOR['Bronze sword']); equipped.head = 'Bronze helmet'; },
  sit: b => benchClick(BF.benches[b]),
  log: () => bonfireClick(),
  near: (dx, dz) => { if (EV.seat >= 0) standUp(); hero.position.set(BF.x + dx, 0, BF.z + dz); walkTarget = null; },
  weak: () => { HP.cur = 1; },
  strong: () => { SKILL_XP.Melee = 25 * 40 * 40; SKILL_XP.Hitpoints = 25 * 40 * 40; HP.cur = maxHp(); },
  smite: () => { for (const m of EV.gobs) if (m && m.hp > 0) raidHit(m, 20); },
  grave: () => { const g = GRAVES[ONLINE.id]; return g ? g.items.map(i => i.name + 'x' + i.qty).join(',') : null; },
  tp: () => { const g = GRAVES[ONLINE.id]; if (g) hero.position.set(g.x + 1.2, 0, g.z + 1.4); },
  loot: id => graveClick(id || ONLINE.id),
  sysLines: () => [...document.querySelectorAll('#chatLog i')].map(e => e.textContent).slice(-6),
  ready: () => ONLINE.ready,
  cam: (d, p, y) => { window.__c = [BF.x, 1, BF.z]; dist = d; pitch = p; yaw = y; },
};`;
(async () => {
  const db = new FakeDb(); const b = await chromium.launch();
  const pages = [];
  for (const name of ['Anna', 'Ben']) {
    const ctx = await b.newContext({ viewport: { width: 560, height: 360 } }); const p = await ctx.newPage();
    await db.attach(p, 'id' + name); p.on('pageerror', e => console.log(name, 'PAGEERROR', e.message));
    await p.addInitScript(n => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off' })); localStorage.setItem('itapName', n); localStorage.setItem('itapId', 'id' + n); } catch (e) {} }, name);
    await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text();
      body = body.replace('function followCharacter(){', () => 'function followCharacter(){ if (window.__c) { target.set(...window.__c); return; }').replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK);
      await r.fulfill({ response: resp, body }); });
    await p.goto('http://localhost:8123/adventure/?hour=21', { waitUntil: 'domcontentloaded', timeout: 90000 });
    pages.push([name, p]);
  }
  for (const [n, p] of pages) { await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart'); }
  const [A, B] = pages.map(x => x[1]); const C = A;
  const until = (p, fn, ms = 60000) => p.waitForFunction(fn, null, { timeout: ms, polling: 500 }).catch(() => console.log('TIMEOUT waiting', fn.toString()));
  const ev = async (p) => p.evaluate(() => window.__t.ev());
  const log = async (label) => { for (const [n, p] of pages) console.log(label, n, JSON.stringify(await ev(p))); };
  await Promise.all(pages.map(([n, p]) => p.evaluate(() => window.__t.give())));
  await A.evaluate(() => window.__t.say('hello everyone'));
  await A.evaluate(() => window.__t.say('Embers beneath the crooked oak'));
  await A.waitForTimeout(3000);
  console.log('db event', JSON.stringify(db.get('adventure/event')).slice(0, 200));
  console.log('A chat lines', JSON.stringify(await A.evaluate(() => [...document.querySelectorAll('#chatLog div')].map(e => e.textContent).slice(-4))));
  console.log('B sys', JSON.stringify(await B.evaluate(() => window.__t.sysLines())));
  await B.waitForTimeout(22000);
  await log('t25');
  await B.evaluate(() => window.__t.near(2.2, 5.6)); await B.evaluate(() => window.__t.sit(2));
  await until(B, () => window.__t.ev().seat >= 0); await until(A, () => window.__t.ev().remSeats.some(s => s >= 0), 15000);
  console.log('B tries to add a log while seated:'); await B.evaluate(() => window.__t.log()); await B.waitForTimeout(300); console.log(await B.evaluate(() => document.getElementById('toast').textContent));
  await C.evaluate(() => window.__t.near(0, -3.2)); const f0 = await C.evaluate(() => window.__t.ev().fuel); await C.evaluate(() => window.__t.log());
  await until(C, () => !document.querySelector('#bagGrid') || window.__t.ev().bag.includes('Logsx4'), 60000); await C.waitForTimeout(2500);
  console.log('fuel before/after log', f0, JSON.stringify(db.get('adventure/event/fuel')));
  await log('sat');
  await A.evaluate(() => window.__t.cam(18, 0.9, 2.9)); await A.screenshot({ path: '/tmp/n1.png' });
  // fast-forward to the raid
  await A.evaluate(() => window.__t.near(3, 3)); await C.evaluate(() => window.__t.near(-3, 2));
  db.set('adventure/event/raidAt', Date.now()); await A.waitForTimeout(4000);
  await log('creep');
  db.set('adventure/event/raid/at', Date.now() - 29000);
  await until(A, () => window.__t.ev().st === 'rush', 30000);
  await log('rush');
  await until(A, () => window.__t.ev().fight, 40000); await A.evaluate(() => window.__t.cam(20, 0.9, 2.9)); await A.waitForTimeout(1500); await A.screenshot({ path: '/tmp/n2.png' });
  await log('fight');
  if (MODE === 'win') {
    await until(B, () => window.__t.ev().fight, 40000); await B.evaluate(() => window.__t.weak());
    await until(B, () => window.__t.ev().graves.length > 0, 40000); await B.waitForTimeout(1500);
    console.log('B grave', await B.evaluate(() => window.__t.grave()), 'db graves', JSON.stringify(db.get('adventure/graves')));
    await log('afterBdies');
    await A.evaluate(() => window.__t.smite()); await until(A, () => window.__t.ev().st === 'over', 30000); await A.waitForTimeout(3000);
    await log('won');
    await A.waitForTimeout(8000); await A.screenshot({ path: '/tmp/n3.png' });
    console.log('coins', JSON.stringify(await Promise.all(pages.map(([n, p]) => p.evaluate(() => window.__t.ev().bag)))));
    console.log('A reads B grave'); await A.evaluate(() => window.__t.loot('idBen')); await A.waitForTimeout(500); console.log(await C.evaluate(() => document.getElementById('toast') && document.getElementById('toast').textContent));
    await B.evaluate(() => window.__t.tp()); await B.evaluate(() => window.__t.loot()); await until(B, () => window.__t.ev().graves.length === 0, 120000); console.log('B after loot', JSON.stringify(await ev(B)), 'db graves', JSON.stringify(db.get('adventure/graves')));
  } else {
    await until(B, () => window.__t.ev().fight, 40000); await until(A, () => window.__t.ev().fight, 40000);
    for (const p of [A, B]) await p.evaluate(() => window.__t.weak());
    await until(A, () => window.__t.ev().st === 'lost', 60000); await A.waitForTimeout(4000); await log('alldown'); await A.evaluate(() => window.__t.cam(22, 0.9, 2.9)); await A.screenshot({ path: '/tmp/n4.png' });
    await until(A, () => window.__t.ev().st === 'over', 120000); await log('guards'); await A.waitForTimeout(16000); await log('home');
  }
  console.log('sys', JSON.stringify(await A.evaluate(() => window.__t.sysLines())));
  await b.close();
})();
