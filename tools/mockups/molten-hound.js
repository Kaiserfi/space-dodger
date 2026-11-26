// Mock-up only: builds the Molten Hound in a test hook and renders it (studio views, then beside the hero by day and night).
// Never touches the game file or the live database. Serve the repo on 8123 first:  OUT=/some/scratch/folder node molten-hound.js
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js'); const fs = require('fs');
const OUT = process.env.OUT || '.';
const HOOK = fs.readFileSync(__dirname + '/molten-hound-hook.js', 'utf8');
(async () => {
  const b = await chromium.launch();
  for (const hour of (process.env.HOURS || '13,23').split(',')) {
    const ctx = await b.newContext({ viewport: { width: 1000, height: 700 } }); const p = await ctx.newPage(); await offlineDb(p);
    p.on('pageerror', e => console.log('PAGEERROR', e.message)); p.on('console', m => { if (m.text().startsWith('HOUND')) console.log(m.text()); });
    await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off', saver: false })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
    await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
    await p.goto('http://localhost:8123/adventure/?hour=' + hour, { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
    const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
    const save = (n, u) => fs.writeFileSync(`${OUT}/hound-${n}.png`, Buffer.from(u.split(',')[1], 'base64'));
    await p.waitForTimeout(1500);
    if (hour === '13') {
      console.log('size', JSON.stringify(await t('build')));
      const views = { side: [9, 1.7, 0.2, 0, 1.6, 0.2, 30], q34: [6.5, 2.6, 6.5, 0, 1.5, 0.3, 32], front: [0.8, 1.6, 10, 0, 1.6, 0, 30], back: [-5.5, 3.2, -7, 0, 1.5, 0, 32], top: [5, 8, 3, 0, 1.2, 0, 32], shoulder: [4.2, 1.9, 2.2, 0, 1.4, 0.7, 30], haunch: [-3.5, 2.0, -4.2, 0, 1.3, -0.9, 32], headside: [5, 1.7, 2.6, 0, 1.6, 2.5, 28], headq: [3, 2.2, 5.6, 0, 1.6, 2.4, 28], headfront: [0, 1.7, 7.5, 0, 1.6, 2.4, 26], feetside: [6, 0.9, 0, 0, 0.5, 0, 28], feetq: [4.5, 1.6, 5.5, 0, 0.3, 0.3, 30], feetback: [-4.5, 1.6, -5.5, 0, 0.3, 0, 30] };
      for (const [n, a] of Object.entries(views)) save('studio-' + n, await t('studio', ...a));
    } else await t('build');
    console.log('placed', JSON.stringify(await t('place')));
    await p.waitForTimeout(2500);
    save('world-' + hour, await t('world'));
    await p.screenshot({ path: `${OUT}/hound-game-${hour}.png` });
    await ctx.close();
  }
  await b.close();
})();
