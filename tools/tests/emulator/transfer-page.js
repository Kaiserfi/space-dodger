// Moving a profile between two devices in ITAP Adventure's settings, against the local Firebase emulators (never the live project).
// Device A gets a code, device B enters it, reloads, and must come back as A's account with A's save and name.
// Pictures of the settings panel go to OUT (default: the current folder).
const { chromium } = require('playwright');
const NS = 'space-dodger-1a558-default-rtdb', DBU = 'http://127.0.0.1:9000', OUT = process.env.OUT || '.';
const admin = (path, method, body) => fetch(`${DBU}/${path}.json?ns=${NS}`, { method, headers: { Authorization: 'Bearer owner' }, body: body === undefined ? undefined : JSON.stringify(body) }).then(r => r.json());
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 300) : '')); };
const LIVE = /^https?:\/\/[^/]*(firebaseio\.com|googleapis\.com|cloudfunctions\.net)/;
const HOOK = `window.__t = { ready: () => ONLINE.ready, id: () => ONLINE.id, name: () => ONLINE.name, coins: () => COINS,
  setCoins: n => { COINS = n; ONLINE.saveJson = ''; saveNow(false); return COINS; },
  panel: () => { document.getElementById('setPanel').hidden = false; return true; } };`;
async function device(b, name){
  const ctx = await b.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2 }), p = await ctx.newPage();
  await ctx.route(LIVE, r => { console.log('BLOCKED live request', r.request().url().slice(0, 90)); return r.abort(); });
  await p.route(/^http:\/\/localhost:8123\/adventure\/(\?(?!vcheck).*)?$/, async r => { const res = await r.fetch(); let body = await res.text();
    body = body.split("'https://space-dodger-1a558-default-rtdb.firebaseio.com'").join("'http://localhost:8123/__db'")
      .split("'https://us-central1-space-dodger-1a558.cloudfunctions.net'").join("'http://localhost:8123/__fn'")
      .split('https://securetoken.googleapis.com').join('http://localhost:8123/__auth/securetoken.googleapis.com')
      .split('https://identitytoolkit.googleapis.com').join('http://localhost:8123/__auth/identitytoolkit.googleapis.com')
      .replace('bootOnline();\nframe();', () => 'bootOnline();\nframe();\n' + HOOK);
    await r.fulfill({ response: res, body }); });
  await p.route(/^http:\/\/localhost:8123\/__(auth|fn)\//, async r => { const u = r.request().url().replace('http://localhost:8123/__auth/', 'http://127.0.0.1:9099/').replace('http://localhost:8123/__fn/', 'http://127.0.0.1:5001/space-dodger-1a558/us-central1/');
    const res = await r.fetch({ url: u }); await r.fulfill({ response: res }); });
  await p.route(/^http:\/\/localhost:8123\/__db\//, async r => { const u = r.request().url().replace('http://localhost:8123/__db/', DBU + '/'); const url = u + (u.includes('?') ? '&' : '?') + 'ns=' + NS;
    if ((r.request().headers().accept || '').includes('text/event-stream')) return r.continue({ url });
    await r.fulfill({ response: await r.fetch({ url }) }); });
  p.on('pageerror', e => console.log(name, 'PAGEERROR', e.message));
  await p.addInitScript(n => { try { localStorage.setItem('itapSettings', JSON.stringify({ music: 0, sfx: 0 })); if (!localStorage.getItem('itapName')) localStorage.setItem('itapName', n); } catch (e) {} }, name);
  await p.goto('http://localhost:8123/adventure/?hour=13', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => window.__t && window.__t.ready(), null, { timeout: 120000 });
  const t = (f, ...a) => p.evaluate(([f, a]) => window.__t[f](...a), [f, a]);
  return { p, ctx, t };
}
const shot = async (p, file) => { const box = await p.locator('#setPanel').boundingBox(); await p.screenshot({ path: `${OUT}/${file}`, clip: box }); };
(async () => {
  await admin('', 'PUT', {});
  const b = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {});
  const A = await device(b, 'Anna'), B = await device(b, 'Ben');
  const ida = await A.t('id'), idb = await B.t('id'); check(ida && idb && ida !== idb, 'two devices, two accounts', [ida, idb]);
  await A.t('setCoins', 1234); await A.p.waitForTimeout(1500);
  await A.t('panel'); await A.p.click('#xferGet');
  await A.p.waitForSelector('.xferCode', { timeout: 30000 }); const code = (await A.p.textContent('.xferCode')).trim();
  check(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code), 'device A shows a code', code); await shot(A.p, 'transfer-code.png');
  await B.t('panel'); await B.p.click('#xferEnter'); await B.p.fill('#xferIn', 'WRONGCOD'); await B.p.click('#xferGo');
  await B.p.waitForTimeout(3000); check(await B.t('id') === idb, 'a wrong code changes nothing');
  await B.p.fill('#xferIn', code.toLowerCase()); await shot(B.p, 'transfer-enter.png');
  await B.p.click('#xferGo'); await B.p.waitForTimeout(4000);   /* the page reloads as the new account */
  await B.p.waitForFunction(old => window.__t && window.__t.ready() && window.__t.id() !== old, idb, { timeout: 120000 });
  check(await B.t('id') === ida, 'device B is now the same account', await B.t('id'));
  check(await B.t('name') === 'Anna', "with the profile's name", await B.t('name'));
  check(await B.t('coins') === 1234, 'and its save', await B.t('coins'));
  const left = await admin(`adventure/saves/${idb}`); check(!left || left.co !== 1234, "B's old account was left alone");
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await A.ctx.close(); await B.ctx.close(); await b.close();
})();
