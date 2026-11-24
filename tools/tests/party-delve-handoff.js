// Two players go down the cellar as a party; the leader's game then stops (a hidden tab), and the other player should take
// over the waves, and see the leader's fight stance before that. Serve the repo first: python3 -m http.server 8123
const { chromium } = require('playwright'); const { FakeDb } = require('../fake-db.js');
const HOOK = `window.__t = {
  ready: () => ONLINE.ready,
  st: () => { const dv = PARTY.d && PARTY.d.dv; return { nx: dv && dv.next, now: SNOW(), wf: DELVE && DELVE.waitFor, alive: dv && partyAlive(dv), toast: (document.getElementById('toast')||{}).textContent, pid: PARTY.id, delve: !!DELVE, wave: dv && dv.wave, host: dv && dv.host, done: dv && dv.done, mons: DELVE ? DELVE.mons.map(m => m.sp + ':' + m.hp + ':' + m.state + ':' + (m.ghost ? 'g' : 'h')) : [], fight: !!FIGHT, act: ONLINE.act && ONLINE.act.d }; },
  invite: id => inviteToParty(id),
  yes: () => { const el = document.getElementById('delveAsk'); if (el && !el.hidden) el.querySelector('[data-a=y]').click(); return !!el; },
  cellar: () => { hero.position.set(RUIN.cellar.x + 1, 0, RUIN.cellar.z + 3); walkTarget = null; },
  lead: () => startPartyDelve(partyNearCellar()),
  strong: () => { SKILL_XP.Melee = 25 * 60 * 60; SKILL_XP.Hitpoints = 25 * 60 * 60; HP.cur = maxHp(); },
  smite: () => { for (const m of DELVE.mons) if (m.state !== 'dying' && m.state !== 'dead') { if (m.ghost) partyHit(m, 50); else { m.hp = 0; m.state = 'dying'; m.dieT = performance.now(); } } },
  fx: () => JSON.stringify(fxSeen),
  remPose: () => Object.values(remote).map(r => r.name + ':' + (r.act && r.act.k) + ':' + (r.act && r.act.d)),
};`;
(async () => {
  const db = new FakeDb(); const b = await chromium.launch(); const pages = [];
  for (const name of ['Anna', 'Ben']) {
    const ctx = await b.newContext({ viewport: { width: 560, height: 360 } }); const p = await ctx.newPage();
    await db.attach(p); p.on('pageerror', e => console.log(name, 'PAGEERROR', e.message));
    await p.addInitScript(n => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off' })); localStorage.setItem('itapName', n); localStorage.setItem('itapId', 'id' + n); } catch (e) {} }, name);
    await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text();
      body = body.replace('function frame(){', () => 'function frame(){ if (window.__freeze) { setTimeout(() => requestAnimationFrame(frame), 200); return; }').replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK);
      await r.fulfill({ response: resp, body }); });
    await p.goto('http://localhost:8123/adventure/', { waitUntil: 'domcontentloaded', timeout: 90000 }); pages.push(p);
  }
  for (const p of pages) { await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart'); }
  const [A, B] = pages, st = p => p.evaluate(() => window.__t.st());
  const until = (p, fn, ms = 60000) => p.waitForFunction(fn, null, { timeout: ms, polling: 500 }).then(() => true).catch(() => { console.log('TIMEOUT', fn.toString()); return false; });
  for (const p of pages) await p.evaluate(() => window.__t.strong());
  await A.waitForTimeout(4000); await A.evaluate(() => window.__t.invite('idBen'));
  await until(B, () => window.__t.yes() && document.getElementById('delveAsk').hidden === false || window.__t.st().pid, 30000); await B.evaluate(() => window.__t.yes());
  await until(B, () => window.__t.st().pid, 20000);
  for (const p of pages) await p.evaluate(() => window.__t.cellar());
  await A.waitForTimeout(5000); await A.evaluate(() => window.__t.lead()); await A.waitForTimeout(500); await A.evaluate(() => window.__t.yes());
  await until(B, () => { const el = document.getElementById('delveAsk'); return el && !el.hidden; }, 30000); await B.evaluate(() => window.__t.yes());
  await until(A, () => window.__t.st().wave === 0, 60000); await A.waitForTimeout(3000);
  console.log('wave0 A', JSON.stringify(await st(A))); console.log('wave0 B', JSON.stringify(await st(B)));
  await until(B, () => window.__t.st().fight || false, 40000); await A.waitForTimeout(3000);
  console.log('A sees', JSON.stringify(await A.evaluate(() => window.__t.remPose())), 'fx from Ben', await A.evaluate(() => window.__t.fx()));
  // the leader's tab goes to sleep
  await A.evaluate(() => { window.__freeze = true; });
  const took = await until(B, () => window.__t.st().host === 'idBen', 30000); console.log('B took over:', took, JSON.stringify(await st(B)));
  await B.evaluate(() => window.__t.smite());
  const moved = await until(B, () => window.__t.st().wave >= 1, 40000); console.log('wave moved on:', moved, JSON.stringify(await st(B)));
  await A.evaluate(() => { window.__freeze = false; }); await A.waitForTimeout(6000);
  console.log('A after waking', JSON.stringify(await st(A))); console.log('B', JSON.stringify(await st(B)));
  await b.close(); process.exit(0);
})();
