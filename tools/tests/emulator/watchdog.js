// The save watchdog (functions/watchdog.js) against the local Firebase emulators (never the live project).
const NS = 'space-dodger-1a558-default-rtdb', DBU = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099';
let fails = 0; const check = (ok, what, extra) => { if (!ok) fails++; console.log((ok ? 'OK   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 240) : '')); };
const signUp = async () => (await (await fetch(`${AU}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"returnSecureToken":true}' })).json());
const db = (path, method, body, tok) => fetch(`${DBU}/${path}.json?ns=${NS}${tok ? '&auth=' + tok : ''}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
const admin = (path, method, body) => fetch(`${DBU}/${path}.json?ns=${NS}`, { method, headers: { Authorization: 'Bearer owner' }, body: body === undefined ? undefined : JSON.stringify(body) }).then(r => r.json());
const wait = ms => new Promise(r => setTimeout(r, ms));
const save = (co, xp, feathers) => ({ v: 2, co, xp: { Melee: 1000, Hitpoints: 2025, Mining: 500, ...xp }, bag: [{ name: 'Logs', qty: 3, s: 0 }, { name: 'Feathers', qty: feathers || 20, s: 1 }], eq: { weapon: 'Bronze sword' } });
(async () => {
  await admin('', 'PUT', {});
  const A = await signUp(), a = A.idToken, id = A.localId, put = async s => { await db(`adventure/saves/${id}`, 'PUT', s, a); await wait(2500); return admin(`adventure/saves/${id}`); };
  let s = await put(save(100));
  const st = await admin(`watch/state/${id}`); check(st && st.prev && st.prev.co === 100, 'the first save is noted as the starting point', st && st.prev);
  s = await put(save(160, { Mining: 650 })); check(s.co === 160 && s.xp.Mining === 650, 'normal gains are left alone', { co: s.co, mining: s.xp.Mining });
  s = await put(save(999999, { Mining: 650 })); check(s.co === 160, 'faked coins are put back', s.co);
  const wd = await admin(`adventure/live/wd/${id}`); check(typeof wd === 'number', "and the player's game is told to reload", wd);
  s = await put(save(160, { Mining: 9999999 })); check(s.xp.Mining === 650, 'faked XP is put back', s.xp.Mining);
  s = await put(save(160, { Mining: 650 }, 1000000)); const f = s.bag.find(i => i.name === 'Feathers'); check(f && f.qty === 20 && s.bag.some(i => i.name === 'Logs'), 'a faked stack of items is trimmed back, the rest of the bag kept', s.bag);
  s = await put(save(0, { Mining: 650 })); s = await put(save(160, { Mining: 650 })); check(s.co === 160, 'losing coins and getting them back (a gravestone) is fine', s.co);
  s = await put(save(5000, { Mining: 650 })); check(s.co === 5000, 'a big but possible gain (selling a bag, a trade) is fine', s.co);
  const flags = await admin(`watch/flags/${id}`); check(flags && Object.keys(flags).length === 3, 'each correction is flagged for the owner', flags && Object.values(flags).map(x => x.bad.map(b => b.what).join(',')));
  await admin(`watch/trust/${id}`, 'PUT', true);
  s = await put(save(800000, { Mining: 650 })); check(s.co === 800000, 'a trusted account (owner gave coins) is left alone', s.co);
  await admin(`watch/trust/${id}`, 'DELETE');
  const r = await db(`watch/state/${id}`, 'GET', undefined, a); check(r.status === 401, "players can't read or change the watchdog's notes", r.status);
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
})();
