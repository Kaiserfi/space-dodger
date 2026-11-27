// The cave is beaten once, for good; until then, leaving in any way resets it and takes back what was found down there.
// Checks every way out (the rope, dying, closing the game), dropped piles, the troll falling, re-entering a beaten cave,
// the chest's one fly rod, and old saves (beaten before, and an unfinished run from the old saved-progress cave).
// Serve the repo on 8123, then: node tools/tests/cave/one-time.js
const fs = require('fs'); const { chromium } = require('playwright'); const { offlineDb } = require('../../offline-db.js');
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 260) : '')); };
const HOOK = fs.readFileSync(__dirname + '/hook.js', 'utf8') + `
window.__t.win = () => { clearCaveMonsters(); CAVE.mons = []; CAVE.troll = { state: 'dead' }; caveWon(); return true; };
window.__t.n = name => countOf(name) + Object.values(toolbelt).filter(v => v === name).length;
window.__t.melee = () => SKILL_XP.Melee;
window.__t.find = () => { addItem('Logs', 4, ICON_FOR.Logs); addItem('Iron ore', 1, ICON_FOR['Iron ore']); addItem('Ember key', 1, ICON_FOR['Ember key']); addXp('Melee', 300); return true; };
window.__t.dropHere = () => { dropToGround('Logs', 2, hero.position.x + 1, hero.position.z, true); return GROUND.filter(g => inCaveZone(g.x, g.z)).length; };
window.__t.caveGround = () => GROUND.filter(g => inCaveZone(g.x, g.z)).length;
window.__t.out = () => { leaveCave('out'); return true; };
window.__t.alive = () => CAVE ? CAVE.mons.filter(m => m.state !== 'dying' && m.state !== 'dead').map(m => m.type) : null;
window.__t.chest = () => !!(CV.bossChest && CV.bossChest.g && CV.bossChest.g.parent);
/* closing the game down there: take the save as it was sent, throw the cave away as a closed tab would, and load the save again */
window.__t.closeAndLoad = () => { const s = JSON.parse(JSON.stringify(currentSave())); stopCaveJob(); if (FIGHT) endFight(); clearCaveMonsters(); CAVE = null; applySave(s); return { at: !!(s.cd && s.cd.at), P: JSON.parse(JSON.stringify(CAVE_P)) }; };
window.__t.loadCd = cd => { const s = JSON.parse(JSON.stringify(currentSave())); s.cd = cd; applySave(s); return JSON.parse(JSON.stringify(CAVE_P)); };
/* the stone as it was made: the offline database's empty live snapshot can clear GRAVES afterwards */
dropOnDeath = (orig => () => { orig(); window.__grave = JSON.parse(JSON.stringify(GRAVES[ONLINE.id] || null)); })(dropOnDeath);
window.__t.graveLogs = () => { const g = window.__grave; return g ? (g.items || []).filter(i => i.name === 'Logs').reduce((a, i) => a + (i.qty || 1), 0) : null; };`;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage(); await offlineDb(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0 })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); const body = (await resp.text()).replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded', timeout: 90000 }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 });
  await p.evaluate(() => { const b = document.getElementById('crStart'); if (b && b.offsetParent) b.click(); });
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  const enter = async () => { await t('mouth'); await t('click'); await p.waitForFunction(() => window.__t.state().cave, null, { timeout: 30000 }); await p.waitForTimeout(800); };
  await t('setup'); await t('give', 'Logs', 3);
  const logs0 = await t('n', 'Logs'), ore0 = await t('n', 'Iron ore');

  // 1. the rope out, unfinished
  await enter(); let s = await t('state'); check(s.P.at && s.P.at.Logs === logs0, 'going in notes the bag', s.P.at && s.P.at.Logs);
  check((await t('alive')).length >= 2, 'a fresh cave has its creatures', await t('alive'));
  await t('kill', 'gate'); await p.waitForTimeout(1500); s = await t('state'); check(s.P.k_gate, 'the gatehouse is cleared');
  await t('find'); const xp = await t('melee'); check((await t('dropHere')) > 0, 'a pile is dropped down there');
  await t('out'); s = await t('state');
  check(!s.cave && (await t('n', 'Logs')) === logs0 && (await t('n', 'Iron ore')) === ore0 && !(await t('n', 'Ember key')), 'leaving early takes back what was found (logs, ore, the key)', { logs: await t('n', 'Logs'), ore: await t('n', 'Iron ore') });
  check(!s.P.k_gate && !s.P.at && !s.P.beat, 'and the cave resets', s.P);
  check((await t('caveGround')) === 0, 'and the pile left down there is gone');
  check((await t('melee')) === xp, 'the XP earned is kept', { now: await t('melee'), was: xp });
  check(/stays there/.test(s.toast), 'with a short message', s.toast);
  await enter(); check((await t('alive')).length >= 2 && !(await t('state')).P.k_gate, 'going back in starts from the beginning', await t('alive'));

  // 2. closing the game down there
  await t('find'); await p.waitForTimeout(300);
  const C = await t('closeAndLoad'); check(C.at, 'the save sent from down there carries the note of the bag');
  check((await t('n', 'Logs')) === logs0 && (await t('n', 'Iron ore')) === ore0 && !(await t('n', 'Ember key')) && !C.P.k_gate && !C.P.at, 'loading it again takes back what was found and resets the cave', { logs: await t('n', 'Logs'), P: C.P });

  // 3. dying down there
  await enter(); await t('find'); await t('dieNow'); await p.waitForTimeout(2500); s = await t('state');
  const gl = await t('graveLogs'); check(!s.cave && gl !== null && gl <= logs0, "dying: the gravestone holds only what you brought, not what you found", { graveLogs: gl, brought: logs0 });
  check(!s.P.at && !s.P.beat && !s.P.k_gate, 'and the cave resets', s.P);
  await t('setup'); await t('give', 'Logs', 3);

  // 4. the troll falls: beaten for good
  await enter(); await t('find'); await t('go', 0, 615); await p.waitForTimeout(500); await t('win'); s = await t('state');
  check(s.P.beat === 1 && s.P.runs >= 1 && !s.P.at, 'the troll falling marks the cave beaten, for good', { beat: s.P.beat, runs: s.P.runs });
  const keptLogs = await t('n', 'Logs');
  await t('out'); s = await t('state'); check((await t('n', 'Logs')) === keptLogs && s.P.beat, 'leaving after the troll keeps what you found, even with the chest unopened', { logs: await t('n', 'Logs') });
  await enter(); s = await t('state');
  check((await t('alive')).length === 0 && s.P.door && s.P.seal && s.P.bridge && s.P.wall, 'a beaten cave: no creatures, every door open', { alive: await t('alive'), door: s.P.door });
  check(await t('chest'), "the chest still waits, since its rod wasn't taken");
  await t('go', 0, 613.5); await t('call', 'bossChestClick'); await p.waitForFunction(() => window.__t.state().P.rod, null, { timeout: 30000 }).catch(() => {});
  check((await t('n', 'Fly fishing rod')) === 1 && (await t('state')).P.rod, 'opening it gives the fly rod', await t('n', 'Fly fishing rod'));
  await p.evaluate(() => { const d = document.getElementById('questDone'); if (d) d.hidden = true; });
  await t('out'); await enter();
  check(!(await t('chest')) && (await t('alive')).length === 0, 'next time in: no chest, nothing to fight', { chest: await t('chest') });
  await t('call', 'bossChestClick'); await p.waitForTimeout(1500); check((await t('n', 'Fly fishing rod')) === 1, 'and no second rod');
  await t('out');

  // 5. old saves
  let P = await t('loadCd', { v: 2, runs: 2, done: 1, k_gate: 1 }); check(P.beat === 1 && !P.rod, 'an old save that beat the cave is beaten, with the rod still to collect', P);
  P = await t('loadCd', { v: 2, k_gate: 1, seal: 1, bridge: 1, ember: 1, inv: { 'Ember key': 1, 'Cave web': 2 } }); check(!P.beat && !P.k_gate && !P.seal && !(P.inv && Object.keys(P.inv).length), 'an old unfinished run (from the cave that kept progress) starts over', P);
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close();
})();
