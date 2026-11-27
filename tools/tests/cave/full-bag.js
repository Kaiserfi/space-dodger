// A full bag refuses (the tree, the wall, the chest) and nothing lands on the ground.
// Serve the repo on 8123, then: node tools/tests/cave/full-bag.js
const fs = require('fs'); const { chromium } = require('playwright'); const { offlineDb } = require('../../offline-db.js');
const HOOK = fs.readFileSync(__dirname + '/hook.js', 'utf8') + `
window.__t.fill = () => { while (bag.length < BAG_SIZE) addItem('Shrimp', 1, ICON_FOR.Shrimp); return bag.length; };
window.__t.free = n => { for (let i = 0; i < n; i++) removeItem('Shrimp'); return bag.length; };
window.__t.win = () => { clearCaveMonsters(); CAVE.mons = []; CAVE.troll = { state: 'dead' }; caveWon(); return true; };
window.__t.misc = () => JSON.stringify({ job: !!caveJob, ground: GROUND.map(g => g.name), inv: CAVE_P.inv, bag: bag.filter(b => /key|web/i.test(b.name)).map(b => b.name + ' x' + b.qty), opened: CAVE && CAVE.opened });`;
(async () => { const b = await chromium.launch(); const p = await (await b.newContext()).newPage(); await offlineDb(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0 })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded', timeout: 90000 }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]), toast = async () => (await t('state')).toast;
  await t('setup'); await t('mouth'); await t('click'); await p.waitForTimeout(1500); console.log('in cave', (await t('state')).cave, 'bag', await t('fill'));
  await t('go', -20.6, 643); await t('call', 'treeClick'); await p.waitForTimeout(500); console.log('tree:', await toast(), await t('misc'));
  await t('go', 35.6, 643); await t('call', 'wallClick'); await p.waitForTimeout(500); console.log('wall:', await toast());
  await t('go', 0, 615); await p.waitForTimeout(800); await t('win'); await p.waitForTimeout(500); await t('call', 'bossChestClick'); await p.waitForTimeout(500); console.log('chest:', await toast(), await t('misc'));
  await b.close(); })();
