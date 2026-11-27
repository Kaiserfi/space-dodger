// Gone for Willow, Tobin's quest, end to end through the real dialogue box: locked until the first two quests are done, the wood,
// the cave opening, Hollis owning up, the cave goblin's cell key, freeing him, and finishing at Tobin's yard. Also the renames, the
// "!" markers, a save, and a player who had beaten the cave before the quest. Offline, phone-sized.
// Serve the repo on 8123, then: OUT=/some/folder node tools/tests/gone-for-willow.js
const fs = require('fs'); const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js');
const OUT = process.env.OUT || '.';
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 260) : '')); };
const HOOK = fs.readFileSync(__dirname + '/cave/hook.js', 'utf8') + `
const W = window.__t;
W.q = () => ({ ...QUEST });
W.setQ = o => { Object.assign(QUEST, o); renderStats(); return { ...QUEST }; };
W.tobinAt = () => { const b = BARKERS.find(x => x.rec.name === 'Tobin'); const p = new THREE.Vector3(); b.sp.getWorldPosition(p); return [+p.x.toFixed(1), +p.z.toFixed(1), !!b.rec.asleep]; };
W.mark = () => { const t = gwMarkTarget(); if (!t) return null; if (CAVE && t === CV.hollis) return 'Hollis (cell)'; if (HOLLIS_HOME && t === HOLLIS_HOME.sp) return 'Hollis (yard)'; const b = BARKERS.find(x => x.sp === t); return b ? b.rec.name : '?'; };
W.markShown = () => { updateQuest(); return document.getElementById('qMark').style.display; };
/* talk through the real dialogue box, picking option 'pick' wherever there's a choice, and return what was said */
W.talk = (who, pick) => { const said = [];
  if (who === 'Hollis-cell') { W.go(CV_AT.bars + 1.5, CV_AT.hollis[1]); hollisClick(); }
  else { const rec = who === 'Hollis' ? HOLLIS_HOME.rec : BARKERS.find(x => x.rec.name === who).rec; openDialog(rec); }
  for (let i = 0; i < 80 && dlg; i++) { const st = dlgCur; if (!st) { nextStep(); continue; } if (st.opts) { said.push('[' + st.opts[pick || 0][0] + ']'); pickOption(pick || 0); continue; } said.push(st.me !== undefined ? 'Me: ' + (typeof st.me === 'function' ? st.me() : st.me) : (typeof st === 'function' ? st() : st)); nextStep(); }
  return said; };
W.cellKey = () => !!(CV.cellKey && CV.cellKey.visible);
W.takeCellKey = () => { W.go(0, 609.8); CV.cellKey.userData.rec.onClick(); return countOf('Cell key'); };
W.hollisInCell = () => !!(CV.hollis && CV.hollis.visible && trees.includes(CV.hollis));
W.padlock = () => !!(CV.padlock && CV.padlock.visible);
W.yard = () => HOLLIS_HOME ? { shown: HOLLIS_HOME.sp.visible, x: +HOLLIS_HOME.sp.position.x.toFixed(1), z: +HOLLIS_HOME.sp.position.z.toFixed(1), clear: !blocked(GW_YARD.x, GW_YARD.z) } : null;
W.names = () => [MONSTER_TYPES.caveTroll.name, MONSTER_TYPES.caveGoblin.name, CAVE_ROOMS.boss.name];
W.win = () => { clearCaveMonsters(); CAVE.mons = []; CAVE.troll = { state: 'dead' }; caveWon(); return true; };
W.out = () => { leaveCave('out'); return true; };
W.saveQ = () => currentSave().q;
W.panel = id => { document.querySelectorAll('#statsPanel,#bagPanel,#gearPanel,#beltPanel,#setPanel,#mapPanel').forEach(p => p.hidden = true); if (id) { const el = document.getElementById(id); el.hidden = false; } statsSub = 'quests'; renderStats(); return true; };
W.openTobin = n => { const b = BARKERS.find(x => x.rec.name === 'Tobin'); openDialog(b.rec); for (let i = 0; i < n; i++) nextStep(); return true; };
W.closeTalk = () => { endDialog(); return true; };
W.beatenBefore = () => { caveLoadP({ v: 2, beat: 1, rod: 1, runs: 1 }); return true; };
W.camAt = (x, z) => { target.set(x, 1, z); return true; };`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 800 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  await offlineDb(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, saver: true })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); const body = (await resp.text()).replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=9', { waitUntil: 'domcontentloaded', timeout: 90000 }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 });
  await p.evaluate(() => { const b = document.getElementById('crStart'); if (b && b.offsetParent) b.click(); });
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  const enter = async () => { await t('mouth'); await t('click'); await p.waitForTimeout(1200); return (await t('state')).cave; };
  const shot = async name => { await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/${name}.png` }); };

  check(JSON.stringify(await t('names')) === JSON.stringify(['Cave goblin', 'Goblin', "The goblin's den"]), 'the boss is the Cave goblin, the others plain Goblins', await t('names'));
  await t('setup');
  // 1. locked until the first two quests are done
  check(!(await t('mark')), 'before the first two quests, no mark over Tobin');
  let said = await t('talk', 'Tobin'); check(!said.some(l => /lend a hand/.test(l)), "and Tobin doesn't ask yet", said[1]);
  check(!(await enter()) && /pitch black/.test((await t('state')).toast), 'and the cave is shut', (await t('state')).toast);
  await t('setQ', { hw: 9, rt: 9 });
  console.log('   Tobin is at', JSON.stringify(await t('tobinAt')));
  check((await t('mark')) === 'Tobin', 'with both done, the mark floats over Tobin', await t('mark'));
  // 2. the wood
  await t('go', ...(await t('tobinAt')).slice(0, 1), (await t('tobinAt'))[1] + 3);
  await t('openTobin', 3); await shot('gw-01-tobin-asks'); await t('closeTalk');
  said = await t('talk', 'Tobin', 0); check((await t('q')).gw === 1 && said.some(l => /Twenty logs/.test(l)), 'Tobin asks for wood', said);
  check(!(await t('mark')), 'no mark while you gather it');
  await t('give', 'Logs', 20); check((await t('mark')) === 'Tobin', 'with 20 logs, the mark comes back');
  const logs = (await t('state')).bag.filter(x => x.startsWith('Logs')); said = await t('talk', 'Tobin');
  check((await t('q')).gw === 2 && !(await t('state')).bag.some(x => x.startsWith('Logs')) && said.some(l => /willow/.test(l)), 'handing them over, he tells of Hollis and the willow', { logs, said: said.slice(-4) });
  // 3. the cave opens; Hollis owns up
  check(await enter(), 'now the cave opens');
  check((await t('mark')) === 'Hollis (cell)', 'the mark floats over Hollis in his cell', await t('mark'));
  await t('go', -47.5, 667); await t('camAt', -52.6, 667); await shot('gw-02-hollis-cell-mark');
  said = await t('talk', 'Hollis-cell'); check((await t('q')).gw === 3 && said.some(l => /glowcaps/.test(l)) && said.some(l => /key to this cell/.test(l)), 'Hollis owns up (glowcaps, not willow) and names the key', said.slice(2, 5));
  check(!(await t('mark')), 'no mark until you have the key');
  // 4. the cave goblin falls and drops the key
  await t('go', 0, 615); await t('win'); check(await t('cellKey'), 'the cave goblin drops the cell key');
  check((await t('takeCellKey')) === 1 && (await t('q')).gw === 4, 'taking it moves the quest on', await t('q'));
  check((await t('mark')) === 'Hollis (cell)', 'and Hollis is marked again');
  said = await t('talk', 'Hollis-cell'); await p.waitForTimeout(1500);
  check((await t('q')).gw === 5 && !(await t('hollisInCell')) && !(await t('padlock')) && !(await t('state')).bag.some(x => x.startsWith('Cell key')), 'unlocking the cell frees him: the key, the padlock and Hollis are gone', said);
  await t('out'); check(!(await t('state')).cave, 'out of the cave');
  // 5. home at the yard
  let y = await t('yard'); check(y && y.shown && y.clear, 'Hollis waits at Tobin\'s woodyard, on clear ground', y);
  check((await t('mark')) === 'Hollis (yard)', 'marked there for the hand-in', await t('mark'));
  await t('go', y.x + 2, y.z + 1.5); await t('camAt', y.x, y.z); await shot('gw-03-hollis-home');
  const c0 = (await t('state')).coins; said = await t('talk', 'Tobin');
  const q = await t('q'); check(q.gw === 6 && q.qp === 1 && (await t('state')).coins === c0 + 150, 'Tobin finishes the quest: a quest point and the reward', { q, coins: (await t('state')).coins - c0 });
  await shot('gw-04-complete'); await p.evaluate(() => { document.getElementById('questDone').hidden = true; });
  said = await t('talk', 'Hollis'); check(said.length >= 2 && !said.some(l => /promise/.test(l)), 'afterwards Hollis just chats', said);
  check((await t('saveQ')).gw === 6, 'the quest is in the save');
  await t('panel', 'statsPanel'); await p.waitForTimeout(300); await p.locator('#statsPanel').screenshot({ path: `${OUT}/gw-05-quests-tab.png` }); await t('panel', null);
  check(await enter() && !(await t('hollisInCell')), 'back in the cave, his cell is empty'); await t('out');
  // 6. a player who beat the cave before the quest
  await t('beatenBefore');
  await t('setQ', { gw: 2 });
  check(await enter(), 'a beaten cave opens once Tobin has asked');
  check(await t('hollisInCell') && await t('padlock') && await t('cellKey'), 'Hollis is still locked up, and the key waits in the den', { cell: await t('hollisInCell'), key: await t('cellKey') });
  said = await t('talk', 'Hollis-cell'); check((await t('q')).gw === 3 && !said.some(l => /fish in the pool/.test(l)), 'he owns up (no talk of fish: the cave is beaten)', said.slice(-2));
  await t('takeCellKey'); said = await t('talk', 'Hollis-cell'); await p.waitForTimeout(1200); check((await t('q')).gw === 5 && !(await t('hollisInCell')), 'and is freed the same way');
  await t('out');
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close();
})();
