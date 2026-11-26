// Fable's cave, the Ember Deep, end to end: the menu at the cave mouth, each room, the mirrors, the hound's flare, douse and eruption, the chest and the way out.
// OUT=/some/scratch/folder node run.js  (serve the repo on 8123 first). The hero is teleported next to things, since headless walking is slow.
const { chromium } = require('playwright'); const { offlineDb } = require('../../offline-db.js'); const fs = require('fs');
const OUT = process.env.OUT || '.', HOOK = fs.readFileSync(__dirname + '/hook.js', 'utf8');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 800 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); await offlineDb(p);
  p.on('pageerror', e => console.log('PAGEERROR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off', saver: true })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  await p.waitForTimeout(2500);
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]), st = async l => console.log(l, JSON.stringify(await t('state'))), shot = n => p.screenshot({ path: `${OUT}/fable-${n}.png` });
  const until = (fn, ms = 60000) => p.waitForFunction(fn, null, { timeout: ms, polling: 300 }).catch(() => console.log('  (timed out waiting)'));
  await t('strong'); console.log('menu', JSON.stringify(await t('mouth'))); await shot('menu'); await t('pick', 'f'); await until(() => window.__t.state().fable); await p.waitForTimeout(1500);
  await st('in'); await t('view', 0.95, 0, 26); await p.waitForTimeout(1200); await shot('stair'); console.log('draw calls', await t('calls'));
  await t('kill', 'stair'); await until(() => window.__t.state().gates[0]); await st('stair cleared');
  await t('walk', 0, 826); await until(() => window.__t.state().room === 'gallery', 150000); await st('walked into the gallery'); await t('tp', 0, 826); await p.waitForTimeout(1200); await shot('gallery');
  for (const i of [3, 0, 1, 2]) { await t('mirror', i); await p.waitForTimeout(700); } await until(() => window.__t.state().gates[1]); await st('mirrors'); await t('tp', 0, 822); await p.waitForTimeout(1500); await shot('gallery-lit');
  await t('tp', 0, 800); await p.waitForTimeout(1500); await st('pit'); await shot('pit'); console.log('spring heals 3 ->', await t('spring'), '| after', (await t('state')).hp);
  await t('kill', 'pit'); await until(() => window.__t.state().gates[2]); await st('pit cleared');
  await t('tp', 0, 772); await p.waitForTimeout(2000); await st('furnace'); await t('view', 0.8, 0, 34); await p.waitForTimeout(1200); await shot('furnace'); console.log('hound', JSON.stringify(await t('houndInfo')), 'draw calls', await t('calls'));
  await t('attack'); await until(() => window.__t.state().fight, 90000); await st('fighting'); await shot('fight');
  await t('hound', 69); await until(() => window.__t.state().flare); await st('flare 1'); console.log('hound', JSON.stringify(await t('houndInfo'))); await p.waitForTimeout(1500); await shot('flare');
  await t('lever', 0); await until(() => window.__t.state().cool, 30000); await st('doused'); await p.waitForTimeout(600); await shot('doused'); console.log('hound', JSON.stringify(await t('houndInfo')), '|', await t('toast'));
  await until(() => !window.__t.state().cool, 30000); await t('hound', 39); await until(() => window.__t.state().flare); const hp0 = (await t('state')).hp; await st('flare 2 (left to erupt)');
  await until(() => !window.__t.state().flare, 40000); await st('erupted'); console.log('health', hp0, '->', (await t('state')).hp, '|', await t('toast'));
  await t('kill', 'furnace'); await until(() => window.__t.state().won); await p.waitForTimeout(3500); await st('won'); await t('tp', 2, 756); await p.waitForTimeout(1500); await shot('won');
  await t('chest'); await until(() => window.__t.scroll(), 30000); console.log('scroll:', await t('scroll')); await shot('reward');
  await t('rope'); await p.waitForTimeout(1500); await st('out');
  console.log('second trip menu', JSON.stringify(await t('mouth'))); await t('pick', 'f'); await until(() => window.__t.state().fable); await st('in again (fresh)'); await t('rope');
  await t('mouth'); await t('pick', 'o'); await until(() => window.__t.state().room === 'entry', 30000); const o = await t('state'); console.log("Opus's choice goes to the first cave:", JSON.stringify({ fable: o.fable, room: o.room, hud: o.hud }));
  await b.close();
})();
