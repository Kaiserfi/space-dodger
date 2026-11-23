// Test helper: a shared, in-memory stand-in for the Firebase database, for testing several players at once.
// Every page given the same store sees the same data. Nothing ever reaches the live game.
//   const { FakeDb } = require('./tools/fake-db');
//   const db = new FakeDb();
//   await db.attach(page);   // call before page.goto, once per page
//   db.get('adventure/event'), db.set('adventure/event/raidAt', Date.now())
// Live streams are answered with a snapshot and a short retry, so the browser reconnects about three times a second.
const DB_HOSTS = /firebase(io)?\.(com|app)|googleapis\.com\/.*firebase/i;
class FakeDb {
  constructor(){ this.root = {}; this.ver = 1; }
  parts(path){ return path.split('/').filter(Boolean); }
  get(path){ let o = this.root; for (const k of this.parts(path)) { if (o == null || typeof o !== 'object') return null; o = o[k]; } return o === undefined ? null : o; }
  set(path, val){
    const ps = this.parts(path); this.ver++;
    if (!ps.length) { this.root = val || {}; return; }
    let o = this.root; for (let i = 0; i < ps.length - 1; i++) { if (!o[ps[i]] || typeof o[ps[i]] !== 'object') o[ps[i]] = {}; o = o[ps[i]]; }
    if (val === null || val === undefined) delete o[ps[ps.length - 1]]; else o[ps[ps.length - 1]] = JSON.parse(JSON.stringify(val));
  }
  async attach(page){
    const answer = async route => {
      const req = route.request(), url = new URL(req.url()), path = decodeURIComponent(url.pathname.replace(/\.json$/, '')), m = req.method();
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,PUT,PATCH,POST,DELETE', 'access-control-expose-headers': 'ETag' };
      if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const etag = () => { const j = JSON.stringify(this.get(path)); let h = 0; for (let i = 0; i < j.length; i++) h = (h * 31 + j.charCodeAt(i)) | 0; return '"' + h + '"'; };   // like Firebase: changes only when this spot's value does
      if (m === 'GET' && (req.headers()['accept'] || '').includes('text/event-stream'))
        return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'text/event-stream', 'cache-control': 'no-cache' }, body: 'retry: 300\nevent: put\ndata: ' + JSON.stringify({ path: '/', data: this.get(path) }) + '\n\n' });
      if (m === 'GET') { let v = this.get(path); if (url.searchParams.get('shallow') && v && typeof v === 'object') v = Object.fromEntries(Object.keys(v).map(k => [k, true]));
        return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json', 'ETag': etag() }, body: JSON.stringify(v) }); }
      const ifm = req.headers()['if-match'];
      if (ifm && ifm !== etag()) return route.fulfill({ status: 412, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(this.get(path)) });
      let body = null; try { body = JSON.parse(req.postData() || 'null'); } catch (e) {}
      if (m === 'PUT') this.set(path, body);
      else if (m === 'PATCH') for (const k in (body || {})) this.set(path + '/' + k, body[k]);
      else if (m === 'POST') { const k = '-k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); this.set(path + '/' + k, body); return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ name: k }) }); }
      else if (m === 'DELETE') this.set(path, null);
      return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    };
    await page.route(DB_HOSTS, answer);
    await page.context().route(DB_HOSTS, answer);   // the whole context too, so removing page routes can't open a gap
    page.on('request', req => { if (DB_HOSTS.test(req.url())) req.response().then(res => { if (res && res.headers()['server']) { console.error('LIVE DATABASE REQUEST ESCAPED: ' + req.method() + ' ' + req.url()); process.exit(2); } }).catch(() => {}); });
  }
}
module.exports = { FakeDb };
