// Level-ups from a reward (a quest, the cellar's chest) wait until the reward scroll is closed, then each skill gets its own fanfare and
// message, one at a time. An ordinary level-up still comes at once. Offline.  Serve the repo on 8123, then: node tools/tests/reward-levelups.js
const { chromium } = require('playwright'); const { offlineDb } = require('../offline-db.js');
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); };
const HOOK = `window.__fanfares = 0; levelUpSound = (orig => () => { window.__fanfares++; orig(); })(levelUpSound);
window.__t = { ready: () => ONLINE.ready,
  nearLevel: (skill, lv) => { SKILL_XP[skill] = XP_AT[lv] - 5; renderStats(); return levelOf(SKILL_XP[skill]); },
  finishQuest: () => { QUEST.hw = HW_STEPS; QUEST.rt = RT_DONE; QUEST.gw = 5; completeGoneForWillow(); return true; },
  state: () => ({ toast: document.getElementById('toast').style.display === 'none' ? '' : document.getElementById('toast').textContent, fanfares: window.__fanfares, queued: LEVEL_Q.list.map(e => e.skill + ' ' + e.level), scroll: !document.getElementById('questDone').hidden }),
  close: () => { document.getElementById('questDoneBtn').click(); return true; },
  chop: () => { addXp('Woodcutting', 5000); return levelOf(SKILL_XP.Woodcutting); } };`;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 412, height: 800 } })).newPage();
  await offlineDb(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, saver: true })); localStorage.setItem('itapName', 'Tester'); } catch (e) {} });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); const body = (await resp.text()).replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK); await r.fulfill({ response: resp, body }); });
  await p.goto('http://localhost:8123/adventure/?hour=9', { waitUntil: 'domcontentloaded', timeout: 90000 }); await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 });
  await p.evaluate(() => { const b = document.getElementById('crStart'); if (b && b.offsetParent) b.click(); });
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  await t('nearLevel', 'Woodcutting', 12); await t('nearLevel', 'Firemaking', 6);
  await p.evaluate(() => { document.getElementById('toast').textContent = ''; document.getElementById('toast').style.display = 'none'; });
  await t('finishQuest'); await p.waitForTimeout(2500); let s = await t('state');
  check(s.scroll && s.fanfares === 0 && !/Congratulations/.test(s.toast) && s.queued.length === 2, 'while the reward scroll is up: no fanfare, no message, both level-ups waiting', s);
  await t('close'); await p.waitForTimeout(600); s = await t('state');
  check(!s.scroll && s.fanfares === 1 && /Woodcutting level is now/.test(s.toast), 'closing it: the first skill, with its fanfare', s);
  await p.waitForTimeout(1500); s = await t('state'); check(s.fanfares === 1 && /Woodcutting/.test(s.toast), 'one at a time: the next waits its turn', s);
  await p.waitForTimeout(2500); s = await t('state'); check(s.fanfares === 2 && /Firemaking level is now/.test(s.toast) && !s.queued.length, 'then the second, with its own fanfare', s);
  const lv = await t('chop'); await p.waitForTimeout(300); s = await t('state'); check(s.fanfares === 3 && new RegExp('Woodcutting level is now ' + lv).test(s.toast), 'an ordinary level-up still comes at once', s);
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await b.close();
})();
