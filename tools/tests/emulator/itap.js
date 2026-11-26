// ITAP Adventure under the new strict rules, against the local Firebase emulators. Two players.
// Every live Firebase address is rewritten to the emulators, anything still aimed at the live project is aborted,
// and every database request the rules refuse (401/403) is listed.
const { chromium } = require('playwright');
const NS = 'space-dodger-1a558-default-rtdb', DBU = 'http://127.0.0.1:9000';
const admin = (path, method, body) => fetch(`${DBU}/${path}.json?ns=${NS}`, { method, headers: { Authorization: 'Bearer owner' }, body: body === undefined ? undefined : JSON.stringify(body) }).then(r => r.json());
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 300) : '')); };
const LIVE = /^https?:\/\/[^/]*(firebaseio\.com|googleapis\.com|cloudfunctions\.net)/;
const HOOK = `window.__t = { ready: () => ONLINE.ready, id: () => ONLINE.id,
  go: (x, z) => { hero.position.set(x, 0, z); walkTarget = null; return true; },
  save: () => { saveNow(false); return true; },
  drop: () => { dropToGround('Logs', 2, hero.position.x + 1, hero.position.z, true); return GROUND.length; },
  pick: () => { const g = GROUND.find(x => x.name === 'Logs'); if (g) pickUp(g); return !!g; },
  ground: () => GROUND.map(g => g.name + ':' + g.by),
  fish: async () => { const r = await changeFishStock('Raw shrimp', 1); return r; },
  fire: () => { addItem('Logs', 1, ICON_FOR.Logs); addItem('Tinderbox', 1, ICON_FOR.Tinderbox); SKILL_XP.Firemaking = 1000; const o = CRAFTS.Logs[0]; startFire(o); return true; },
  fires: () => FIRES.map(f => f.key),
  die: () => { addItem('Copper ore', 3, ICON_FOR['Copper ore']); dropOnDeath(); return !!GRAVES[ONLINE.id]; },
  invite: id => { inviteToParty(id); return true; },
  party: () => PARTY && PARTY.id ? PARTY.id : (PARTY && PARTY.d ? 'd' : null),
  heal: id => { const r = remote[id]; fetch(DB + '/adventure/live/mobs/_heals/' + id + '.json', { method: 'POST', body: JSON.stringify({ amt: 2, by: ONLINE.id, t: Date.now() }) }); return !!r; },
  remotes: () => Object.values(remote).map(r => r.name),
  mobFight: () => { const m = MONSTERS.find(q => q.sid !== undefined); mobClaim(m); return m.sid; },
  logout: () => { logOut(); return true; },
  coins: () => COINS, cheat: () => { COINS += 999999; saveNow(false); return COINS; }, fix: at => { watchdogFix(at); return true; } };`;
async function player(b, name){
  const ctx = await b.newContext(), p = await ctx.newPage(), refused = [];
  await ctx.route(LIVE, r => { console.log('BLOCKED live request', r.request().url().slice(0, 90)); return r.abort(); });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const res = await r.fetch(); let body = await res.text();
    body = body.split("'https://space-dodger-1a558-default-rtdb.firebaseio.com'").join("'http://localhost:8123/__db'")
      .split('https://securetoken.googleapis.com').join('http://localhost:8123/__auth/securetoken.googleapis.com')
      .split('https://identitytoolkit.googleapis.com').join('http://localhost:8123/__auth/identitytoolkit.googleapis.com')
      .replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK);
    await r.fulfill({ response: res, body }); });
  /* the emulators, served from the page's own address (no cross-origin checks); the live stream is passed through as it comes */
  await p.route(/^http:\/\/localhost:8123\/__auth\//, async r => { const res = await r.fetch({ url: r.request().url().replace('http://localhost:8123/__auth/', 'http://127.0.0.1:9099/') }); await r.fulfill({ response: res }); });
  await p.route(/^http:\/\/localhost:8123\/__db\//, async r => { const u = r.request().url().replace('http://localhost:8123/__db/', DBU + '/'); const url = u + (u.includes('?') ? '&' : '?') + 'ns=' + NS;
    if ((r.request().headers().accept || '').includes('text/event-stream')) return r.continue({ url });   /* the live stream goes straight to the emulator */
    const res = await r.fetch({ url }); if (r.request().method() !== 'GET') console.log('   ', name, r.request().method(), res.status(), u.replace(DBU, '').split('?')[0].slice(0, 70)); if (res.status() === 401 || res.status() === 403) refused.push(r.request().method() + ' ' + u.replace(DBU, '').split('?')[0]);
    await r.fulfill({ response: res }); });
  p.on('requestfailed', r => { if (/live\.json/.test(r.url())) console.log('   ', name, 'stream failed:', r.failure() && r.failure().errorText); });
  p.on('pageerror', e => console.log(name, 'PAGEERROR', e.message));
  await p.addInitScript(n => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0 })); localStorage.setItem('itapName', n); } catch (e) {} }, name);
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); if (await p.isVisible('#crStart')) await p.click('#crStart');
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  return { p, ctx, t, refused, name };
}
(async () => {
  await admin('', 'PUT', {});
  const b = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {}); const A = await player(b, 'Anna'), B = await player(b, 'Ben');
  const ida = await A.t('id'), idb = await B.t('id'); check(ida && idb && ida !== idb && ida.length > 20, 'both signed in with their own accounts', [ida, idb]);
  await A.t('go', 10, 20); await B.t('go', 12, 20); await A.p.waitForTimeout(5000);
  await A.t('save'); await B.t('save'); await A.p.waitForTimeout(3000);
  const saves = await admin('adventure/saves'); check(saves && saves[ida] && saves[idb], 'both saves are written', saves && Object.keys(saves));
  const pres = await admin('adventure/live/players'); check(pres && pres[ida] && pres[idb], 'both show up online', pres && Object.keys(pres));
  check((await A.t('drop')) > 0, 'Anna drops logs'); await A.p.waitForTimeout(3000);
  const gr = await admin('adventure/live/ground'); check(gr && Object.keys(gr).length > 0, 'the pile is shared', gr && Object.values(gr).map(x => x.n));
  await A.p.waitForTimeout(500); await A.t('pick'); await A.p.waitForTimeout(3000); const gr2 = await admin('adventure/live/ground'); check(!gr2 || !Object.keys(gr2).length, 'and picked up again', gr2);
  const fish = await A.t('fish'); check(fish !== null && fish !== undefined, 'the fish stock changes', fish);
  await A.t('go', 30, 30); await A.t('fire'); await A.p.waitForTimeout(6000); const fires = await admin('adventure/live/fires'); check(fires && Object.keys(fires).length, 'a fire is lit and shared', fires && Object.keys(fires));
  check(await A.t('die'), 'Anna dies'); await A.p.waitForTimeout(3000); const graves = await admin('adventure/live/graves'); check(graves && graves[ida], 'her gravestone is shared', graves && Object.keys(graves));
  const sid = await A.t('mobFight'); await A.p.waitForTimeout(2000); const mob = await admin('adventure/live/mobs/' + sid); check(mob && mob.f === ida, 'a shared monster fight is claimed', mob);
  await B.t('heal', ida); await A.p.waitForTimeout(4000); const heals = await admin('adventure/live/mobs/_heals'); check(true, 'a heal note was sent (and taken)', heals);
  console.log('   Anna sees:', JSON.stringify(await A.t('remotes')), '| Ben sees:', JSON.stringify(await B.t('remotes')));
  await A.t('invite', idb); await A.p.waitForTimeout(3000); const inv = await admin('adventure/live/parties'); check(inv && Object.keys(inv).length, 'a party invite is written', inv && Object.keys(inv));
  await B.t('logout'); await A.p.waitForTimeout(4000); const pres2 = await admin('adventure/live/players'); check(pres2 && !pres2[idb], 'logging out removes Ben from online', pres2 && Object.keys(pres2));
  const flags0 = await admin('watch/flags'); check(!flags0, 'normal play raised no watchdog flags', flags0);
  const before = await A.t('coins'); await A.t('cheat'); await A.p.waitForTimeout(4000);
  const sv = await admin('adventure/saves/' + ida), wd = await admin('adventure/live/wd/' + ida); check(sv.co === before && typeof wd === 'number', 'faked coins in the game are put back on the server', { saved: sv.co, before });
  await A.t('fix', wd); await A.p.waitForTimeout(3000); check(await A.t('coins') === before, "and the player's game reloads the corrected save", await A.t('coins'));
  for (const P of [A, B]) check(!P.refused.length, `${P.name}: nothing the game sent was refused by the rules`, P.refused);
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await A.ctx.close(); await B.ctx.close(); await b.close();
})();
