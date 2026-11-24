// Trout need a fly fishing rod and a feather per catch; the net no longer works on them. Serve the repo first: python3 -m http.server 8123
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js');
const HOOK = `window.__t = {
  ready: () => ONLINE.ready,
  setup: (rod, feathers) => { SKILL_XP.Fishing = 25 * 20 * 20; bag.length = 0; addItem('Small fishing net', 1, ICON_FOR['Small fishing net']); if (rod) addItem('Fly fishing rod', 1, ICON_FOR['Fly fishing rod']); if (feathers) addItem('Feathers', feathers, ICON_FOR['Feathers']);
    const s = fishSpots.find(f => f.fish === 'trout'); hero.position.set(s.x + 2.2, 0, s.z); walkTarget = null; return s; },
  fish: () => clickNode(fishSpots.find(f => f.fish === 'trout')),
  st: () => ({ bag: bag.map(i => i.name + 'x' + i.qty).join(','), toast: document.getElementById('toast').textContent, fishing: !!fishing, belt: Object.keys(TOOLBELT_SLOTS).join(',') }),
};`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 600, height: 400 } }); const p = await ctx.newPage();
  await offlineDb(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off' })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text();
    body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  const t = (f, a) => p.evaluate(([f, a]) => window.__t[f](...(a || [])), [f, a]);
  await t('setup', [false, 0]); await t('fish'); await p.waitForTimeout(800); console.log('net only:', JSON.stringify(await t('st')));
  await t('setup', [true, 0]); await t('fish'); await p.waitForTimeout(800); console.log('rod, no feathers:', JSON.stringify(await t('st')));
  await t('setup', [true, 3]); await t('fish'); await p.waitForFunction(() => window.__t.st().fishing, null, { timeout: 60000, polling: 300 }).catch(() => console.log('never started')); console.log('rod and 3 feathers, started:', JSON.stringify(await t('st')));
  await p.waitForFunction(() => !window.__t.st().fishing || /trout/i.test(window.__t.st().bag), null, { timeout: 120000, polling: 500 }).catch(() => {}); await p.waitForTimeout(1000);
  console.log('after a while:', JSON.stringify(await t('st')));
  await b.close();
})();
