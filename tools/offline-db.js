// Test helper: keeps a Playwright page off the live Firebase database.
// Every request to *.firebaseio.com (or any firebase host) is answered here, in the browser, with an empty village,
// so a test never joins the real game, writes a save, deletes a player or posts a score.
//   const { offlineDb } = require('./tools/offline-db');
//   const db = await offlineDb(page);   // call before page.goto
//   ... db.count() is how many database requests were answered locally
async function offlineDb(page){
  let caught = 0;
  await page.route(/firebase(io)?\.(com|app)|googleapis\.com\/.*firebase/i, async route => {
    caught++;
    const req = route.request();
    if (req.method() === 'GET' && (req.headers()['accept'] || '').includes('text/event-stream')) {
      // a live stream: send one empty snapshot and leave it at that
      return route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' }, body: 'event: put\ndata: {"path":"/","data":null}\n\n' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  // a safety net: if any request to the database still leaves the browser (say, another route caught it first and fetched it),
  // stop the test straight away rather than touch the live game
  page.on('request', req => { if (/firebase(io)?\.(com|app)/i.test(req.url()) && !req.url().startsWith('http://localhost')) {
    req.response().then(res => { if (res && res.headers()['server']) { console.error('LIVE DATABASE REQUEST ESCAPED: ' + req.method() + ' ' + req.url()); process.exit(2); } }).catch(() => {}); } });
  return { count: () => caught };
}
module.exports = { offlineDb };
