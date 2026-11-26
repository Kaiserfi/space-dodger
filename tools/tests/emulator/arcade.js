// The real arcade page against the local Firebase emulators. Every live Firebase address is rewritten to the emulators,
// and anything still aimed at the live project is aborted.
const { chromium } = require('playwright');
const NS = 'space-dodger-1a558-default-rtdb', DBU = 'http://127.0.0.1:9000';
const admin = (path, method, body) => fetch(`${DBU}/${path}.json?ns=${NS}`, { method, headers: { Authorization: 'Bearer owner' }, body: body === undefined ? undefined : JSON.stringify(body) }).then(r => r.json());
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); };
const LIVE = /^https?:\/\/[^/]*(firebaseio\.com|googleapis\.com|cloudfunctions\.net)/;
(async () => {
  await admin('', 'PUT', {});
  const b = await chromium.launch(), ctx = await b.newContext(), p = await ctx.newPage();
  let liveHits = 0;
  await ctx.route(LIVE, r => { liveHits++; console.log('BLOCKED live request', r.request().url().slice(0, 90)); return r.abort(); });
  await p.route(/^http:\/\/localhost:8123\/(\?.*)?$/, async r => { const res = await r.fetch(); let body = await res.text();
    body = body.replace("'https://space-dodger-1a558-default-rtdb.firebaseio.com'", "'http://127.0.0.1:9000/x'")   /* the board's reads get the namespace below */
      .replace("'https://us-central1-space-dodger-1a558.cloudfunctions.net'", "'http://localhost:8123/__fn'")
      .split('https://securetoken.googleapis.com').join('http://localhost:8123/__auth/securetoken.googleapis.com')
      .split('https://identitytoolkit.googleapis.com').join('http://localhost:8123/__auth/identitytoolkit.googleapis.com');
    await r.fulfill({ response: res, body }); });
  await p.route(/^http:\/\/127\.0\.0\.1:9000\/x\//, async r => { const u = r.request().url().replace('/x/', '/'); const res = await r.fetch({ url: u + (u.includes('?') ? '&' : '?') + 'ns=' + NS }); await r.fulfill({ response: res }); });
  /* the emulators, served from the page's own address so the browser makes no cross-origin checks */
  await p.route(/^http:\/\/localhost:8123\/__(auth|fn)\//, async r => { const u = r.request().url().replace('http://localhost:8123/__auth/', 'http://127.0.0.1:9099/').replace('http://localhost:8123/__fn/', 'http://127.0.0.1:5001/space-dodger-1a558/us-central1/');
    const res = await r.fetch({ url: u }); await r.fulfill({ response: res }); });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(() => { try { localStorage.setItem('sdName', 'TESTER'); } catch (e) {} });
  await p.goto('http://localhost:8123/', { waitUntil: 'load' }); await p.waitForTimeout(1500);
  // a real game of Space Dodger: started, played for a few seconds, a modest score
  await p.evaluate(() => start()); await p.waitForTimeout(4000);
  await p.evaluate(() => { score = 2600; gameOver(); }); await p.waitForTimeout(4000);
  let board = await admin('scores'); check(board && board.tester && board.tester.score === 2600 && board.tester.uid, 'a real game posts to the board, through the server', board && board.tester);
  const auth = await p.evaluate(() => localStorage.getItem('itapAuth')); check(!!auth && JSON.parse(auth).uid === (board.tester || {}).uid, 'the arcade uses the itapAuth account (shared with ITAP)', auth && JSON.parse(auth).uid);
  // a cheated game: 9,999,999 a second after starting
  await p.evaluate(() => start()); await p.waitForTimeout(1200);
  await p.evaluate(() => { score = 9999999; gameOver(); }); await p.waitForTimeout(4000);
  board = await admin('scores'); check(board.tester.score === 2600, 'a cheated score is turned down', board.tester.score);
  const flags = await admin('arcade/flags'); check(flags && Object.keys(flags).length === 1, 'and flagged for the owner', flags && Object.keys(flags).length);
  // a name that belongs to someone else: the page asks for another, then posts the same score under it
  await admin('arcade/names/bigbert', 'PUT', 'someoneElse');
  await p.evaluate(() => { playerName = 'BIG BERT'; localStorage.setItem('sdName', 'BIG BERT'); start(); }); await p.waitForTimeout(3000);
  await p.evaluate(() => { score = 900; gameOver(); }); await p.waitForTimeout(4000);
  const modal = await p.evaluate(() => ({ open: !document.getElementById('nameModal').hidden, err: document.getElementById('nameErr').textContent }));
  check(modal.open && /another player/.test(modal.err), 'a taken name brings up the name box with a message', modal);
  await p.fill('#nameInput', 'BERTIE'); await p.click('#nameOk'); await p.waitForTimeout(4000);
  board = await admin('scores'); check(board.bertie && board.bertie.score === 900 && !board.bigbert, 'the same score goes in under the new name', { bertie: board.bertie, bigbert: board.bigbert });
  // Snake and the crawler post through the server too
  await p.evaluate(() => { playerName = 'TESTER'; localStorage.setItem('sdName', 'TESTER'); });
  await p.evaluate(() => startSnake ? startSnake() : null).catch(() => null);
  console.log('live requests blocked:', liveHits);
  check(liveHits === 0, 'nothing tried to reach the live project');
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await ctx.close(); await b.close();
})();
