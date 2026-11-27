// Mock-up only: renders the hound's idle, walk and fight poses as numbered frames in OUT/frames (join them with ffmpeg).  OUT=/some/scratch/folder node molten-hound-anim.js
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js'); const fs = require('fs');
const OUT = (process.env.OUT || '.') + '/frames'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
const HOOK = fs.readFileSync(__dirname + '/molten-hound-hook.js', 'utf8');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 700 } }); const p = await ctx.newPage(); await offlineDb(p);
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off', saver: false })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=23', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  await p.waitForTimeout(1500); console.log(JSON.stringify(await t('build'))); await t('place'); console.log('lowest point standing', await t('feet'));
  const FPS = 15, clips = { idle: [], walk: [], fight: [] };
  for (let i = 0; i < 52; i++) clips.idle.push(['idle', 0, i / FPS * (Math.PI * 2 / 1.8 * 3 / (52 / FPS)) / (Math.PI * 2 / 1.8) * 1, 4.2]);
  for (let i = 0; i < 25; i++) clips.walk.push(['walk', 0, i / 25 * (Math.PI * 2 / 7.5) * 2, 4.6]);
  for (let i = 0; i < 12; i++) clips.fight.push(['ready', 0, i / FPS, 4.6]);
  for (let i = 0; i < 18; i++) clips.fight.push(['swing', i / 17, 0.8 + i / FPS, 4.6]);
  for (let i = 0; i < 8; i++) clips.fight.push(['ready', 0, 2 + i / FPS, 4.6]);
  for (let i = 0; i < 7; i++) clips.fight.push(['hurt', i / 6, 2.6 + i / FPS, 4.6]);
  for (let i = 0; i < 8; i++) clips.fight.push(['ready', 0, 3.1 + i / FPS, 4.6]);
  for (let i = 0; i < 16; i++) clips.fight.push(['dead', i / 15, 3.7 + i / FPS, 4.6]);
  for (let i = 0; i < 12; i++) clips.fight.push(['dead', 1, 4.8 + i / FPS, 4.6]);
  for (const [n, fr] of Object.entries(clips)) { for (let i = 0; i < fr.length; i++) { const u = await t('anim', ...fr[i]); fs.writeFileSync(`${OUT}/${n}-${String(i).padStart(3, '0')}.jpg`, Buffer.from(u.split(',')[1], 'base64')); } console.log(n, fr.length); }
  await ctx.close(); await b.close();
})();
