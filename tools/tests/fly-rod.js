// The fly fishing rod: the cave's only reward, the only rod trout will take (with Fishing 15 and feathers), and a toolbelt slot of its own
// under the belt's Fishing tab. Also: bream still take the plain rod, and old saves load right. Offline, phone-sized.
// OUT=/some/scratch/folder node fly-rod.js  (serve the repo on 8123 first)
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js');
const OUT = process.env.OUT || '.';
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); };
const HOOK = `const spots = kind => trees.map(g => g.userData && g.userData.rec).filter(r => r && r.kind === 'fish' && r.fish === kind);
window.__t = {
  ready: () => ONLINE.ready,
  reset: () => { stopFishing(); if (FIGHT) endFight(''); SKILL_XP.Melee = 5e6; SKILL_XP.Hitpoints = 5e6; HP.cur = maxHp(); bag.length = 0; for (const k in toolbelt) toolbelt[k] = null; renderBag(); renderGear(); return true; },
  give: (name, n) => { addItem(name, n || 1, ICON_FOR[name]); renderBag(); return countOf(name); },
  fishLvl: l => { let lo = 0, hi = 1e7; while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (levelOf(m) >= l) hi = m; else lo = m + 1; } SKILL_XP.Fishing = lo; return levelOf(SKILL_XP.Fishing); },   /* the least XP for that level, from the game's own curve */
  /* stand right by a spot and click it; returns the toast, whether fishing started, and the pose */
  fish: kind => { const r = spots(kind)[0]; stopFishing(); document.getElementById('toast').textContent = ''; let at = null; for (let d = 1.5; d < 6 && !at; d += 0.5) for (let a = 0; a < 16 && !at; a++) { const q = { x: r.x + Math.cos(a * Math.PI / 8) * d, z: r.z + Math.sin(a * Math.PI / 8) * d }; if (!blocked(q.x, q.z)) at = q; } hero.position.set(at.x, 0, at.z); walkTarget = null; walkQueue = []; clickNode(r); return true; },
  state: () => ({ toast: document.getElementById('toast').textContent, fishing: !!fishing, fish: fishing ? fishing.rec.fish : null, pose: heroAnim.mode }),
  clickBag: name => { const k = bag.findIndex(i => i.name === name); if (k < 0) return 'none'; document.querySelector('#bagGrid .slot[data-i="' + k + '"]').click(); return true; },
  slots: () => ['Bronze axe', 'Iron axe', 'Bronze pickaxe', 'Hammer', 'Small fishing net', 'Fishing rod', 'Fly fishing rod', 'Hoe', 'Watering can', 'Tinderbox'].map(n => n + ':' + beltSlotFor(n)),
  buyers: () => Object.keys(SHOPS).filter(k => SHOPS[k].buys('Fly fishing rod')),
  count: name => countOf(name),
  belt: () => ({ ...toolbelt }),
  openBelt: () => { document.querySelectorAll('#statsPanel,#bagPanel,#gearPanel,#setPanel,#mapPanel').forEach(p => p.hidden = true); document.getElementById('beltPanel').hidden = false; renderBelt(); return true; },
  beltTab: () => BELT_TAB,
  load: tb => { applySave({ v: 2, xp: { ...SKILL_XP }, bag: [{ name: 'Fly fishing rod', qty: 1, s: 0 }], tb, co: 5 }); return { belt: { ...toolbelt }, bag: bag.map(i => i.name) }; },
  reward: () => { const before = countOf('Fly fishing rod'), runs = CAVE_P.runs || 0, coins = COINS, xp = JSON.stringify(SKILL_XP); grantCaveRewards();
    return { rods: countOf('Fly fishing rod') - before, runs: (CAVE_P.runs || 0) - runs, coins: COINS - coins, xpSame: xp === JSON.stringify(SKILL_XP), boxes: document.querySelectorAll('#questDone .qBox').length }; },
};`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 800 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  await offlineDb(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, saver: true })); localStorage.setItem('itapName', 'Anna'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); const body = (await resp.text()).replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 });
  await p.evaluate(() => { const b = document.getElementById('crStart'); if (b && b.offsetParent) b.click(); });
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  const tryFish = async kind => { await t('fish', kind); await p.waitForFunction(() => { const s = window.__t.state(); return s.fishing || s.toast; }, null, { timeout: 30000, polling: 300 }).catch(() => {}); return t('state'); };

  // trout
  await t('reset'); await t('fishLvl', 20); await t('give', 'Fishing rod'); await t('give', 'Feathers', 20);
  let s = await tryFish('trout'); check(!s.fishing && /fly fishing rod/.test(s.toast), 'trout: a plain fishing rod is turned down', s.toast);
  await t('give', 'Fly fishing rod'); check(await t('fishLvl', 14) === 14, 'set Fishing 14');
  s = await tryFish('trout'); check(!s.fishing && /Fishing 15/.test(s.toast), 'trout: a fly rod below Fishing 15 is turned down', s.toast);
  await t('fishLvl', 15);
  s = await tryFish('trout'); check(s.fishing && s.fish === 'trout' && s.pose === 'fish', 'trout: a fly rod, Fishing 15 and feathers fish, with the rod pose', s);
  await t('reset'); await t('fishLvl', 15); await t('give', 'Fly fishing rod');
  s = await tryFish('trout'); check(!s.fishing || /feathers/.test(s.toast), 'trout: no feathers, no fishing', s.toast);
  // bream still take the plain rod
  await t('reset'); await t('fishLvl', 12); await t('give', 'Fishing rod'); await t('give', 'Worms', 10);
  s = await tryFish('bream'); check(s.fishing && s.fish === 'bream' && s.pose === 'fish', 'bream: the plain rod and worms still fish', s);

  // the toolbelt
  await t('reset'); await t('give', 'Fly fishing rod'); await t('give', 'Fishing rod');
  const slots = await t('slots');
  check(slots.every(x => !/:null$/.test(x)) && new Set(slots.map(x => x.split(':')[1])).size === 9, 'every tool has its own belt slot (and both axes share one)', slots);
  await t('openBelt'); await p.evaluate(() => { document.getElementById('bagPanel').hidden = false; });
  await t('clickBag', 'Fly fishing rod'); await p.waitForTimeout(200); await t('clickBag', 'Fishing rod'); await p.waitForTimeout(300);
  let belt = await t('belt'); check(belt.fly === 'Fly fishing rod' && belt.rod === 'Fishing rod', 'both rods hang on the belt, each in its own slot', belt);
  check(await t('beltTab') === 2, 'the belt opens on the Fishing tab after hanging a rod', await t('beltTab'));
  await p.evaluate(() => { document.getElementById('bagPanel').hidden = true; }); await t('openBelt');
  for (let i = 0; i < 4; i++) { await p.click(`[data-belttab="${i}"]`); await p.waitForTimeout(150); await p.locator('#beltPanel').screenshot({ path: `${OUT}/belt-tab-${i}.png` }); }
  await p.click('[data-belttab="2"]'); await p.click('[data-unbelt="fly"]'); await p.waitForTimeout(200);
  belt = await t('belt'); check(!belt.fly && (await t('count', 'Fly fishing rod')) === 1, 'taking the fly rod off puts it back in the bag', belt);
  // trout fish from the belt too
  await t('reset'); await t('fishLvl', 15); await t('give', 'Fly fishing rod'); await t('clickBag', 'Fly fishing rod'); await t('give', 'Feathers', 5);
  s = await tryFish('trout'); check(s.fishing && s.fish === 'trout', 'trout: the fly rod works from the toolbelt', s);

  // old saves
  let L = await t('load', { rod: 'Fly fishing rod' }); check(L.belt.fly === 'Fly fishing rod' && !L.belt.rod && L.bag.includes('Fly fishing rod'), 'an old save: a fly rod in the plain rod slot moves to its own slot, one in the bag stays a fly rod', L);
  L = await t('load', { rod: 'Fishing rod' }); check(L.belt.rod === 'Fishing rod' && !L.belt.fly, 'an old save: the plain rod stays put', L.belt);

  // the cave's reward
  await t('reset'); const R = await t('reward'); check(R.rods === 1 && R.runs === 1 && R.coins === 0 && R.xpSame && R.boxes === 1, 'the cave chest gives only a fly fishing rod (no coins, no XP) and counts the run', R);
  await p.waitForTimeout(500); await p.locator('#questDone').screenshot({ path: `${OUT}/cave-reward.png` });
  check(JSON.stringify(await t('buyers')) === '["fish"]', 'only Jory buys a spare fly rod, not Mara', await t('buyers'));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await ctx.close(); await b.close();
})();
