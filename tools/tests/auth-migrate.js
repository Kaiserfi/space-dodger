// Sign-in and moving an old save: a player from before sign-ins keeps their progress on their new account, every database
// request carries the sign-in, and the claim stops a second account taking the same old save. Google's sign-in is faked here.
// Serve the repo first: python3 -m http.server 8123
const { chromium } = require('playwright'); const { FakeDb } = require('../fake-db.js');
(async () => {
  const db = new FakeDb(); db.set('adventure/saves/oldPlayer1', { bag: [{ name: 'Bronze axe', qty: 1 }], xp: { Woodcutting: 900 }, co: 77 });
  const b = await chromium.launch(); const urls = [];
  const run = async (uid, oldId) => {
    const ctx = await b.newContext({ viewport: { width: 560, height: 360 } }); const p = await ctx.newPage();
    await db.attach(p); p.on('pageerror', e => console.log('PAGEERROR', e.message));
    p.on('request', r => { if (/firebaseio/.test(r.url())) urls.push(r.url()); });
    await p.route(/identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ idToken: 'tok-' + uid, id_token: 'tok-' + uid, refreshToken: 'rt-' + uid, refresh_token: 'rt-' + uid, localId: uid, user_id: uid }) }));
    await p.addInitScript(o => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0, grass: 'off' })); localStorage.setItem('itapName', 'Oldie'); localStorage.setItem('itapId', o); } catch (e) {} }, oldId);
    await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const resp = await r.fetch(); let body = await resp.text();
      body = body.replace("const FB_KEY = '';", "const FB_KEY = 'test-key';").replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\nwindow.__t = { ready: () => ONLINE.ready, me: () => ({ id: ONLINE.id, coins: COINS, bag: bag.map(i => i.name).join(","), old: localStorage.getItem("itapOld") }) };');
      await r.fulfill({ response: resp, body }); });
    await p.goto('http://localhost:8123/adventure/', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 }); await p.waitForTimeout(3000);
    console.log(uid, JSON.stringify(await p.evaluate(() => window.__t.me()))); await ctx.close();
  };
  await run('uidAAAA', 'oldPlayer1');
  console.log('claimed', JSON.stringify(db.get('adventure/claimed')), '| new save coins', JSON.stringify((db.get('adventure/saves/uidAAAA') || {}).co));
  await run('uidBBBB', 'oldPlayer1');   // someone else with the same old id
  console.log('B save', JSON.stringify(db.get('adventure/saves/uidBBBB') && db.get('adventure/saves/uidBBBB').co));
  const noAuth = urls.filter(u => !/auth=tok-/.test(u)); console.log('db requests', urls.length, 'without sign-in', noAuth.length, noAuth.slice(0, 3));
  await b.close(); process.exit(0);
})();
