// The whole cave dungeon, offline (offlineDb): entering, every room, puzzle and key, the fights, the troll, the reward, dying
// (gravestone at the mouth), saving inside. Serve the repo on 8123, then: OUT=<scratch folder> node tools/tests/cave/run.js
// It takes about 10 minutes headless. Pictures of each room go to OUT.
const fs = require('fs'); const { chromium } = require('playwright'); const { offlineDb } = require('../../offline-db.js');
const HOOK = fs.readFileSync(__dirname + '/hook.js', 'utf8'), OUT = process.env.OUT || '/tmp/cave-test'; fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; log((ok ? 'OK   ' : 'FAIL ') + what, extra !== undefined ? JSON.stringify(extra) : ''); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 900, height: 600 } }); const p = await ctx.newPage();
  await offlineDb(p); p.on('pageerror', e => log('PAGEERROR', e.message)); p.on('console', m => { if (m.type() === 'error') log('CONSOLE', m.text().slice(0, 300)); });
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, saver: false })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  const wait = ms => p.waitForTimeout(ms);
  const until = async (fn, ms = 30000, step = 400) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await t('state'); if (fn(s)) return s; await wait(step); } return await t('state'); };
  const snap = async (name, cam) => fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from((await t('shot', ...cam, 900, 600)).split(',')[1], 'base64'));
  const game = async name => p.screenshot({ path: `${OUT}/${name}.png` });
  log(await t('setup'));
  // the way in
  const m = await t('mouth'); await wait(1500);
  await t('click');

  await wait(1500);
  let s = await t('state'); check(s.cave && s.room === 'entry', 'in the cave', s.hero);
  check((await t('save')).pos && Math.abs((await t('save')).pos.z - m.z) < 3, 'a save inside puts you at the mouth', await t('save'));
  await wait(2500); await game('01 entry game');
  fs.writeFileSync(`${OUT}/02 map.png`, Buffer.from((await t('top', 1440, 1120)).split(',')[1], 'base64'));
  // walking: a real walk from the entry into the gatehouse, through the passage
  check((await t('path', 0, 688, 0, 668)).n > 2, 'a path from the entry into the gatehouse', await t('path', 0, 688, 0, 668));
  const pv = await t('path', 0, 668, 0, 643); check(pv.end && pv.end[1] > 655, 'the portcullis blocks the way north', pv);
  // the gatehouse fight: the goblins come for you
  await t('go', 0, 672); s = await until(s => s.fight, 40000); check(s.fight && s.room === 'gate', 'the goblins attack in the gatehouse', s.mons);
  await game('03 gate fight');
  await wait(6000); s = await t('state'); { const g = s.mons.filter(m => m[1] === 'gate').map(m => Math.hypot(m[4] - s.hero[0], m[5] - s.hero[1])); check(g.every(d => d < 4.5), 'multi-combat: both goblins come at once', g); }
  await t('kill', 'gate'); s = await until(s => s.P.k_gate, 8000); check(s.P.k_gate, 'gatehouse cleared');
  await wait(3500); const pv2 = await t('path', 0, 668, 0, 643); check(pv2.end && Math.hypot(pv2.end[0], pv2.end[1] - 643) < 1, 'the portcullis is up', pv2);
  // the rune hall
  await t('go', 0, 650); await wait(1500); s = await t('state'); check(s.room === 'hub', 'in the rune hall', s.toast);
  await snap('04 hub', [0, 22, 662, 0, 0, 641]);
  await t('go', 2, 646); await wait(3000); await game('04b hub game');
  check((await t('path', 0, 643, 20, 643)).end[0] < 12, 'the seal blocks the way east');
  for (const i of [0, 2]) { await t('go', [0, 4.75, 2.94, -2.94, -4.75][i] * 0 + Math.sin(i / 5 * Math.PI * 2) * 5 + 0.3, 643 + Math.cos(i / 5 * Math.PI * 2) * 5); await t('call', 'plateClick', i); await wait(2500); }
  s = await t('state'); check(s.P.seal, 'the rune stones solved (0 then 2)', s.P.pl);
  await wait(2000); check((await t('path', 0, 643, 20, 643)).end[0] > 18, 'the seal is gone');
  await snap('05 hub solved', [0, 22, 662, 0, 0, 641]);
  check((await t('path', 0, 640, 0, 615)).end[1] > 628, 'the great door is shut');
  // the chasm
  await t('go', -19, 643); await wait(1500); s = await t('state'); check(s.room === 'chasm', 'in the chasm room', s.toast);
  check((await t('path', -19, 643, -34, 643)).end[0] > -26, 'the chasm blocks the way west');
  await snap('06 chasm', [-14, 16, 660, -27, 0, 643]);
  await t('call', 'treeClick'); s = await until(s => s.P.bridge, 30000); check(s.P.bridge && s.bag.some(x => x.startsWith('Logs')), 'the tree is down, with logs', s.bag);
  await wait(3000); check((await t('path', -19, 643, -34, 643)).end[0] < -33, 'the tree bridges the chasm');
  check(await t('blockedAt', -27, 641.6) && await t('blockedAt', -27, 644.4) && !(await t('blockedAt', -27, 643)), 'only the trunk is walkable over the chasm');
  await snap('07 bridge', [-14, 16, 660, -27, 0, 643]);
  await t('go', -24, 643); await wait(2500); await game('07b bridge game');
  await t('go', -32, 643); s = await until(s => s.fight, 30000); check(s.fight, 'the goblin across the chasm attacks once you cross');
  await t('kill', 'chasm'); await wait(2000);
  // the fire shrine
  await t('go', -51, 643); await wait(1500); s = await t('state'); check(s.room === 'braz', 'in the fire shrine', s.toast);
  await t('go', -46.5 + 2.1, 637.5); await t('call', 'brazierClick', 1); await until(s => !s.job, 15000); await wait(300); s = await t('state'); check(/gutters out at once/.test(s.toast), 'the wrong brazier first puts them out', s.toast); await t('give', 'Logs', 1);
  for (const i of [2, 0, 3, 1]) { const B = [[-55.5, 637.5], [-46.5, 637.5], [-55.5, 648.5], [-46.5, 648.5]][i]; await t('go', B[0] + 2.1, B[1]); await t('call', 'brazierClick', i); await until(s => !s.job, 15000); await wait(300); }
  s = await t('state'); check(s.mons.filter(m => m[1] === 'braz').length === 0, 'the rats wait three seconds', s.toast); await wait(3500);
  s = await t('state'); check(s.mons.filter(m => m[1] === 'braz').length === 3, 'all four lit in order: the rats come', s.toast);
  check(await t('ratSpotsClear'), 'the rats start on clear ground inside the ring');
  await snap('08 shrine', [-51, 18, 660, -51, 0, 642]);
  await game('08b shrine game');
  await t('kill', 'braz'); s = await until(s => s.P.k_braz, 8000); await wait(1500);
  await t('go', -51, 638); await t('call', 'takeKey', 'ember'); s = await t('state'); check(s.P.ember && s.bag.some(x => x.startsWith('Ember key x')), 'the ember key, in the bag', s.toast);
  check(await t('dropKey'), 'keys cannot be dropped');
  // the mine and the forge
  await t('go', 33, 643); await wait(1500); s = await t('state'); check(s.room === 'mine', 'in the mine', s.toast);
  await t('kill', 'mine'); await wait(1000);
  check((await t('path', 33, 643, 50, 643)).end[0] < 39, 'the cracked wall blocks the forge');
  await t('call', 'wallClick'); s = await until(s => s.P.wall, 30000); check(s.P.wall && s.bag.some(x => x.startsWith('Iron ore')), 'the wall is broken, with iron ore', s.bag);
  await wait(2500); check((await t('path', 33, 643, 50, 643)).end[0] > 49, 'the way into the forge is open');
  await t('go', 45, 643); await wait(1500); s = await t('state'); check(s.room === 'forge', 'in the forge');
  await t('call', 'anvilClick'); s = await t('state'); check(/won't let you/.test(s.toast), 'the goblins guard the anvil', s.toast);
  await t('kill', 'forge'); await wait(1500);
  await snap('09 forge', [51, 18, 662, 51, 0, 643]);
  await t('go', 57.5, 647.5); await t('smelt'); s = await until(s => s.bag.some(x => x.startsWith('Iron bar')), 20000); check(s.bag.some(x => x.startsWith('Iron bar')), 'smelted an iron bar at the goblin furnace', s.bag);
  await wait(3000);
  await t('call', 'anvilClick'); s = await until(s => s.P.ironMade, 20000); check(s.P.ironMade && !s.bag.some(x => x.startsWith('Iron key x')) && await t('ironKeyShown'), 'forged the iron key: it floats over the anvil', s.toast);
  await t('call', 'takeKey', 'iron'); s = await t('state'); check(s.P.iron && s.bag.some(x => x.startsWith('Iron key x')) && !(await t('ironKeyShown')), 'took the iron key off the anvil', s.toast);
  await snap('09b iron key', [53.5, 3.6, 647, 50.5, 1.4, 650.5]);
  // the grotto
  await t('go', -17, 667); await wait(1500); s = await t('state'); check(s.room === 'grotto', 'in the grotto', s.toast);
  await snap('10 grotto', [-25, 18, 686, -25, 0, 666]);
  await t('go', -25, 666); await wait(3000); await game('10b grotto game');
  await t('go', -45, 667); await wait(1500); s = await t('state'); check(s.room === 'cell', 'into the jail, west of the grotto', s.toast); check((await t('path', -45, 667, -53, 667)).end[0] > -48.5, 'the bars keep you out of his cell');
  await snap('10c jail', [-44, 5, 671, -52, 1.5, 666]);
  await t('go', -47.4, 667); await t('call', 'hollisClick'); await wait(1500);
  for (let i = 0; i < 8 && await t('dlg'); i++) { log('   ', await t('dlg')); await t('dlgNext'); }
  for (let tries = 0; tries < 6 && !(s => s.bag.some(x => x.startsWith('Raw cave fish x')))(await t('state')); tries++) { await t('go', -25.6, 671.5); await t('call', 'poolClick'); await until(s => !s.job, 20000); await wait(400); }
  s = await t('state'); check(s.bag.some(x => x.startsWith('Raw cave fish x')), 'caught a cave fish, in the bag', s.toast);
  for (let tries = 0; tries < 8 && !(s => s.bag.some(x => x.startsWith('Cave fish x')))(await t('state')); tries++) { if (!(s => s.bag.some(x => x.startsWith('Raw cave fish x')))(await t('state'))) { await t('go', -25.6, 671.5); await t('call', 'poolClick'); await until(s => !s.job, 20000); await wait(400); continue; } await t('go', -19.5, 669.4); await t('call', 'fireClick'); await until(s => !s.job, 20000); await wait(400); log('    cook try:', (await t('state')).toast); }
  s = await t('state'); check(s.bag.some(x => x.startsWith('Cave fish x')), 'cooked it, in the bag', s.toast);
  await t('go', -47.4, 667); await t('call', 'hollisClick'); await wait(1500);
  for (let i = 0; i < 8 && await t('dlg'); i++) { log('   ', await t('dlg')); await t('dlgNext'); }
  s = await t('state'); check(s.bag.some(x => x.startsWith('Glowcap spores x')) && !s.bag.some(x => x.startsWith('Cave fish x')), 'Hollis takes the fish and gives the spores', s.bag);
  await t('call', 'ledgeClick'); s = await t('state'); check(/pitch black/.test(s.toast), 'the ledge is dark', s.toast);
  await t('go', -21, 662.8); await t('call', 'capPatchClick'); s = await until(s => s.P.glow, 15000); check(s.P.glow, 'planted the glowcap');
  for (let i = 0; i < 3; i++) { const W = [[-33.4, 673.6], [-17, 673.4], [-32.6, 660.6]][i]; await t('go', W[0], W[1]); await t('call', 'webClick', i); await until(s => !s.job && (s.P.webs || 0) & (1 << i), 20000); await wait(300); }
  s = await t('state'); check(s.P.webs === 7 && s.bag.includes('Cave web x3'), 'gathered three webs, in the bag', s.bag);
  await wait(8000); await t('go', -25.5, 661.6);
  log('    web menu:', await t('clickItem', 'Cave web')); await p.click('#itemMenu button[data-o="r"]'); s = await until(s => s.bag.some(x => x.startsWith('Web rope x')), 15000); check(s.bag.some(x => x.startsWith('Web rope x')), 'twisted a rope', s.toast);
  await t('call', 'ledgeClick'); await wait(1500); await t('go', -20, 664); await game('11a climbing'); s = await until(s => s.P.tide, 20000); check(s.bag.some(x => x.startsWith('Tide key x')) && s.heroY === 0, 'climbed the ledge: the tide key', s.toast);
  await snap('11 grotto done', [-25, 14, 680, -25, 1, 662]);
  await t('call', 'leaveCave', 'out'); s = await t('state'); check(!s.bag.some(x => / key /.test(x)) && s.P.inv['Tide key'] === 1, 'leaving puts the cave things away', s.P.inv);
  await t('mouth'); await t('click'); await wait(1500); s = await t('state'); check(s.cave && s.bag.some(x => x.startsWith('Ember key x')) && s.bag.some(x => x.startsWith('Tide key x')) && s.bag.some(x => x.startsWith('Iron key x')), 'coming back hands them over', s.bag);
  log('HUD:', s.hud);
  // the great door and the troll
  await t('go', 0, 634.5); await t('call', 'bossDoorClick'); await wait(3000); s = await t('state'); check(s.P.door && !s.bag.some(x => / key /.test(x)), 'the great door opens and takes the keys', s.toast);
  check((await t('path', 0, 640, 0, 615)).end[1] < 616, 'the way into the den is open');
  log('troll maths', await t('trollMath'));
  await t('go', 0, 624); s = await until(s => s.mons.some(m => m[0] === 'caveTroll'), 15000); check(s.mons.some(m => m[0] === 'caveTroll'), 'the troll appears', s.toast);
  s = await until(s => s.fight, 40000); check(s.fight, 'the troll fights');
  await game('12 troll fight'); await snap('13 troll', [7, 9, 627, 0, 2, 612]);
  await t('hurtTroll', 30); s = await until(s => s.mons.filter(m => m[0] === 'blindRat' && m[1] === 'boss').length === 1, 10000); check(s.mons.filter(m => m[1] === 'boss').length === 2, 'hurt, it calls a rat', s.toast);
  await t('kill', 'boss'); s = await until(s => s.P.k_boss, 10000); check(s.P.k_boss, 'the troll is beaten');
  { let bad = 0; for (let i = 0; i < 12; i++) { if (await t('music') === 'battle_theme') bad++; await wait(500); } check(!bad, 'no battle theme after the troll', bad); }
  await wait(2500); const c0 = (await t('state')).coins;
  await t('call', 'bossChestClick'); s = await until(s => s.P.done, 60000); log('    chest:', s.toast, s.hero); check(s.P.done && s.coins === c0 && s.bag.some(x => x.startsWith('Fly fishing rod')), 'the chest gives the fly fishing rod (and nothing else)', { coins: s.coins - c0, bag: s.bag });
  await wait(1200); await game('14 reward');
  await p.evaluate(() => { document.getElementById('questDone').hidden = true; });
  await t('call', 'leaveCave', 'out'); s = await t('state'); check(!s.cave && Object.keys(s.P).length <= 4 && !s.P.door, 'out, and the next trip starts fresh', s.P);
  // dying in the cave
  await t('mouth'); await t('click'); await wait(1500);
  s = await t('state'); check(s.cave && s.mons.length === 7, 'a fresh cave', s.mons.length);
  const g = await t('dieNow'); await wait(2500); s = await t('state');
  check(!s.cave && g && Math.hypot(g.x - m.x, g.z - m.z) < 2, 'dying leaves the gravestone at the mouth', g);
  check(s.hero[1] < 100 && s.hero[1] > 0, 'and you wake in the hall', s.hero);
  log('lights in the cave:', await t('lights'));
  log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await ctx.close(); await b.close();
})();
