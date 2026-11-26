// ===== The bonfire night: a one-off village event, started with a secret phrase in chat =====
// Aldric walks out and lights the fire, villagers come over and chat, players sit and keep it fed with logs.
// 10 to 15 minutes in, goblins creep up from the south and rush the clearing, forcing a fight on everyone there.
// The shared state lives at adventure/live/event; one player's game (the host) runs the goblins and the guards and shares them.
const EVENT_HASH = 'bb1914976d5ceed67b0cc65637f065461f9145124d9aa8f4cfb72124b836502d';   // the phrase itself is never in the code
const RAIDER = { name: 'Goblin raider', level: 5, hp: 10, melee: 4, atk: 4, def: 2, maxHit: 2, speed: 2400 };
const FUEL_RATE = 1 / 600;     // a full fire burns for ten minutes
const LOG_FUEL = 0.25;         // a log adds two and a half minutes
const EV = { data: null, seat: -1, gobs: [], said: {}, warn: 0, saysUntil: 0, npcs: {}, lastHostWrite: 0, hostHits: {}, raidSeen: '', lastFuel: 1, lostMsg: false, startSeen: 0 };
const evNow = () => Date.now();
const evT = () => EV.data ? (evNow() - EV.data.start) / 1000 : -1;
const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = v => v * v * (3 - 2 * v);
const segK = (t, a, b) => clamp01((t - a) / (b - a));
function evActive(){ const d = EV.data; return !!(d && d.start && !d.done && evNow() - d.start < 75 * 60000 && evNow() >= d.start - 5000); }
function evPhase(){ const d = EV.data; if (!evActive()) return 'none'; if (d.casual) return 'casual'; const st = d.raid && d.raid.st || 'calm';
  if (st === 'calm' && evNow() >= d.raidAt) return 'creep'; return st; }
function fuelNow(){
  const d = EV.data; if (!evActive() || !d.fuel) return 0;
  const t = evT(); if (t < 8) return 0;
  const f = clamp01(d.fuel.f - Math.max(0, evNow() - d.fuel.at) / 1000 * (d.fuel.r || FUEL_RATE));
  return t < 13 ? Math.min(f, 0.15 + 0.7 * smooth(segK(t, 8, 13))) : f;   // the kindling catches and grows
}
const evDist = (x, z) => hero ? Math.hypot(hero.position.x - x, hero.position.z - z) : 99;
const inClearing = (x, z) => Math.hypot(x - BF.x, z - BF.z) < BF.clearR + 6;

// ----- talking to the database -----
async function evPatch(obj){ try { await fetch(`${DB}/adventure/live/event.json`, { method: 'PATCH', body: JSON.stringify(obj) }); } catch (e) {} }
function evApply(d){
  const parts = d.path.split('/').filter(Boolean);
  if (!parts.length) { EV.data = d.data; return; }
  if (!EV.data) EV.data = {};
  let o = EV.data; for (let i = 0; i < parts.length - 1; i++) { if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
  if (d.data === null) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = d.data;
}
function evMerge(d){   // a patch: several children of one place at once
  const parts = d.path.split('/').filter(Boolean);
  for (const k in d.data) evApply({ path: '/' + parts.concat(k).join('/'), data: d.data[k] });
}

// ===== one live feed for everything shared: adventure/live/{players,nodes,event,graves,mobs} =====
// Browsers allow only about six open connections to the database, so the game keeps exactly one stream open and
// routes each change to the part of the game that handles it, as if each part had its own stream.
const LIVE = { subs: {}, es: null };
function liveFeed(part){
  const sub = LIVE.subs[part] || (LIVE.subs[part] = { put: [], patch: [] });
  if (!LIVE.es) setTimeout(startLive, 0);   // opened once, after everyone has subscribed
  return { addEventListener: (type, fn) => { if (sub[type]) sub[type].push(fn); } };
}
function liveSend(part, type, path, data){ const sub = LIVE.subs[part]; if (!sub) return; const e = { data: JSON.stringify({ path, data }) }; for (const fn of sub[type]) { try { fn(e); } catch (err) { console.error(err); } } }
function startLive(){
  if (LIVE.es) return;
  LIVE.es = new EventSource(DB + '/adventure/live.json' + (AUTH.token ? '?auth=' + AUTH.token : ''));
  LIVE.es.addEventListener('auth_revoked', () => authRefresh().then(() => { LIVE.es.close(); LIVE.es = null; startLive(); }).catch(() => {}));   /* the sign-in ran out: renew it and reconnect */
  LIVE.es.addEventListener('put', e => { const d = JSON.parse(e.data), parts = d.path.split('/').filter(Boolean);
    if (!parts.length) { for (const part in LIVE.subs) liveSend(part, 'put', '/', d.data ? (d.data[part] ?? null) : null); return; }   // the whole snapshot: everyone gets their share
    liveSend(parts[0], 'put', '/' + parts.slice(1).join('/'), d.data); });
  LIVE.es.addEventListener('patch', e => { const d = JSON.parse(e.data), parts = d.path.split('/').filter(Boolean);
    if (!parts.length) { for (const part in d.data) liveSend(part, d.data[part] === null ? 'put' : 'patch', '/', d.data[part]); return; }   // a change across several parts
    liveSend(parts[0], 'patch', '/' + parts.slice(1).join('/'), d.data); });
}
const GRAVES = {};

// ===== shared farm monsters =====
// Every game works out each monster's wandering path from the same seed and the server's clock, so they wander in step for everyone without sending anything.
// Only fights go through the database (adventure/live/mobs/<id>): who is fighting it, its health, each blow, and until when it's dead.
let CLOCK_OFF = 0; const SNOW = () => Date.now() + CLOCK_OFF;
const MOBST = {};   // id -> { f: fighter, t: last seen, hp, x, z, h: { k, w, d, ty, by }, dead: until }
const MOB_P = 9000;   // each leg of a wander takes this long, walking then pausing
function mobPatch(sid, obj){ const st = MOBST[sid] || (MOBST[sid] = {}); for (const k in obj) { if (obj[k] === null) delete st[k]; else st[k] = obj[k]; }
  fetch(`${DB}/adventure/live/mobs/${sid}.json`, { method: 'PATCH', body: JSON.stringify(obj) }).catch(() => {}); }
function mobFresh(st){ return st && st.f && SNOW() - (st.t || 0) < 12000; }
function mobDeadNow(m){ const st = MOBST[m.sid]; return !!(st && st.dead && st.dead > SNOW()); }
function mobLocked(m){ if (m.sid === undefined) return false; const st = MOBST[m.sid]; return mobFresh(st) && st.f !== ONLINE.id && !mobDeadNow(m); }
function mobClaim(m){ if (m.sid === undefined) return; mobPatch(m.sid, { f: ONLINE.id, t: SNOW(), hp: m.hp, x: +m.x.toFixed(2), z: +m.z.toFixed(2), dead: null }); }
function mobRelease(m){ if (m.sid === undefined) return; const st = MOBST[m.sid]; if (st && st.f === ONLINE.id) mobPatch(m.sid, { f: null, t: SNOW(), hp: m.hp }); }
let mobHitK = 0;
function mobHit(m, w, d, ty){ if (m.sid === undefined) { if (m.delve && DELVE && DELVE.party) partyFx(m, w, d, ty); return; } mobPatch(m.sid, { t: SNOW(), hp: m.hp, h: { k: ++mobHitK + '-' + ONLINE.id, w, d, ty, by: ONLINE.id } }); }
function mobDead(m){ if (m.sid === undefined) return; mobPatch(m.sid, { f: null, hp: null, h: null, dead: SNOW() + m.t.respawn }); }
// a seeded random number: the same on every game for the same monster, leg and try
function mobRand(a, b, c){ let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function mobLineClear(ax, az, bx, bz){ const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 0.5); for (let i = 1; i <= n; i++) { const k = i / n; if (monsterHit(ax + (bx - ax) * k, az + (bz - az) * k)) return false; } return true; }
function mobSpot(m, n){
  const c = m.spots || (m.spots = new Map()); if (c.has(n)) return c.get(n);
  const [hx, hz] = m.home, r = m.rad || 3; let out = [hx, hz];
  for (let tr = 0; tr < 8; tr++) { let tx = hx + (mobRand(m.sid, n, tr * 2) * 2 - 1) * r, tz = hz + (mobRand(m.sid, n, tr * 2 + 1) * 2 - 1) * r;
    if (m.box) { tx = Math.max(m.box.x0, Math.min(m.box.x1, tx)); tz = Math.max(m.box.z0, Math.min(m.box.z1, tz)); }
    if (!monsterHit(tx, tz) && mobLineClear(hx, hz, tx, tz)) { out = [tx, tz]; break; } }
  c.set(n, out); if (c.size > 6) c.delete(c.keys().next().value); return out;
}
// where a monster is on its shared path right now: from the last spot to the next, round by its home if a wall is in the way, then a rest
function mobPath(m, T){
  const n = Math.floor(T / MOB_P), a = mobSpot(m, n - 1), b = mobSpot(m, n);
  const pts = mobLineClear(a[0], a[1], b[0], b[1]) ? [a, b] : [a, m.home, b];
  let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let go = (T - n * MOB_P) / 1000 * Math.max(1.1, L / 6.5);
  for (let i = 1; i < pts.length; i++) { const [x0, z0] = pts[i - 1], [x1, z1] = pts[i], l = Math.hypot(x1 - x0, z1 - z0);
    if (go <= l && l > 0) { const k = go / l; return { x: x0 + (x1 - x0) * k, z: z0 + (z1 - z0) * k, yaw: Math.atan2(x1 - x0, z1 - z0), moving: true }; } go -= l; }
  return { x: b[0], z: b[1], moving: false };
}
// an aggressive monster that has noticed you runs at you, and starts the fight itself when it gets there
const AGGRO_RANGE = 6, AGGRO_COOL = 10000;   // how near before it notices you; how long after you get away before it tries again
let CHASER = null;
function aggroCheck(m, now){
  if (!m.t.aggro || FIGHT || DELVE || CAVE || CHASER || !hero || HP.cur <= 0 || m.state !== 'standing' || now < (m.aggroAt || 0)) return;
  if (combatLevel() > m.t.level * 2 + 1 || mobLocked(m)) return;   /* anyone stronger than twice its level plus one, it leaves alone */
  const hx = hero.position.x, hz = hero.position.z, b = m.box;
  if (b && (hx < b.x0 - 3 || hx > b.x1 + 3 || hz < b.z0 - 3 || hz > b.z1 + 3)) return;   // it doesn't leave its ground for you
  if (Math.hypot(hx - m.x, hz - m.z) < AGGRO_RANGE) { m.chase = true; CHASER = m; }
}
function chaseStep(m, now, dt){   // true while it's chasing (it moves itself), false to go back to its usual wandering
  const hx = hero.position.x, hz = hero.position.z, dx = hx - m.g.position.x, dz = hz - m.g.position.z, d = Math.hypot(dx, dz);
  const give = FIGHT || DELVE || CAVE || HP.cur <= 0 || mobLocked(m) || mobDeadNow(m) || d > AGGRO_RANGE + 8 || Math.hypot(m.g.position.x - m.home[0], m.g.position.z - m.home[1]) > m.rad + 12;
  if (give) { m.chase = false; if (CHASER === m) CHASER = null; m.aggroAt = now + 3000; return false; }
  if (d > reachOf(m) + 0.1) { const step = Math.min(d - reachOf(m), 4.2 * dt), nx = m.g.position.x + dx / d * step, nz = m.g.position.z + dz / d * step;
    if (!monsterHit(nx, nz)) { m.g.position.x = nx; m.g.position.z = nz; } else if (!monsterHit(nx, m.g.position.z)) m.g.position.x = nx; else if (!monsterHit(m.g.position.x, nz)) m.g.position.z = nz;
    turnChibi(m.g, Math.atan2(dx, dz)); monsterPose(m, 'walk'); m.x = m.g.position.x; m.z = m.g.position.z; return true; }
  // it has reached you: the fight is on, wherever you were going and whatever you were doing
  m.chase = false; if (CHASER === m) CHASER = null;
  cancelChop(); stopFishing(); walkTarget = null; walkThen = null; walkQueue = []; walkFinal = null; heroAnim.mode = 'idle';
  m.state = 'engaged'; m.engagedAt = now;
  FIGHT = { m, nextP: now + 900, nextM: now + 700, pAnim: null, mAnim: null };
  mobClaim(m); heroAnim.yaw = yawTo(hx, hz, m.x, m.z); m.g.rotation.y = yawTo(m.x, m.z, hx, hz); setAct(fightAct(m));
  return true;
}
function mobUpdate(m, now){
  const st = MOBST[m.sid], dt = Math.min(0.1, (now - (m.lastT || now)) / 1000); m.lastT = now;
  if (mobDeadNow(m)) { if (m.state === 'standing' || m.state === 'engaged') { m.state = 'dying'; m.dieT = now; soundAt(m.x, m.z, () => combatSound((m.t.snd || 'goblin') + 'Die')); } m.foreign = false; return; }
  const theirs = mobFresh(st) && st.f !== ONLINE.id;
  m.foreign = theirs;
  if (theirs) {   // someone else is fighting it: it stands where the fight is, facing them, and its health is theirs to tell
    const tx = st.x ?? m.x, tz = st.z ?? m.z; m.g.position.x += (tx - m.g.position.x) * 0.2; m.g.position.z += (tz - m.g.position.z) * 0.2;
    const r = remote[st.f]; if (r) m.g.rotation.y = yawTo(m.g.position.x, m.g.position.z, r.sprite.position.x, r.sprite.position.z);
    if (typeof st.hp === 'number' && st.hp > 0) m.hp = st.hp;
    if (m.anim && now - m.anim.t0 < m.anim.dur) monsterPose(m, m.anim.kind, (now - m.anim.t0) / m.anim.dur); else monsterPose(m, 'ready');
    m.x = m.g.position.x; m.z = m.g.position.z; return;
  }
  if (m.chase && chaseStep(m, now, dt)) return;
  if (m.state === 'standing') aggroCheck(m, now);
  if (m.state === 'engaged') { if (!walkTarget && now - (m.engagedAt || 0) > 1500) m.state = 'standing'; else { monsterPose(m, 'ready'); m.g.rotation.y = yawTo(m.x, m.z, hero.position.x, hero.position.z); return; } }
  // its health: hurt in a recent fight, otherwise back to full
  m.hp = st && typeof st.hp === 'number' && st.hp > 0 && SNOW() - (st.t || 0) < 60000 && !(st.dead && (st.t || 0) <= st.dead) ? st.hp : m.t.hp;   /* a killing blow that landed after the death note mustn't bring it back at 0 */
  const p = mobPath(m, SNOW()), dx = p.x - m.g.position.x, dz = p.z - m.g.position.z, d = Math.hypot(dx, dz);
  if (d > 14) { m.g.position.x = p.x; m.g.position.z = p.z; }   // far off its path (just respawned): straight there
  else if (d > 0.03) { const step = Math.min(d, 3.2 * dt); m.g.position.x += dx / d * step; m.g.position.z += dz / d * step; }   // catching up after a fight, or walking with its path
  if (p.moving || d > 0.08) { turnChibi(m.g, p.moving && d < 0.5 ? p.yaw : Math.atan2(dx, dz)); monsterPose(m, 'walk'); } else monsterPose(m, 'idle');
  m.x = m.g.position.x; m.z = m.g.position.z;
}
// a change from the database: keep it, and play any new blow someone else struck
function mobApply(sid, st){
  const m = MONSTERS.find(q => q.sid === sid); MOBST[sid] = st || {}; if (!m || !st || !st.h) return;
  const h = st.h; if (h.k === m.lastK) return; m.lastK = h.k; if (h.by === ONLINE.id) return;
  const r = remote[h.by], now = performance.now();
  if (h.w === 'ps' && r) r.fAnim = { kind: 'swing', t0: now, dur: r.sprite.userData.chibi && r.sprite.userData.chibi.weaponL ? DUAL_MS : 900 };
  if (h.w === 'ms') { m.anim = { kind: 'swing', t0: now, dur: 900 }; soundAt(m.x, m.z, () => combatSound((m.t.snd || 'goblin') + 'Attack')); }
  if (h.w === 'p') { hitsplat(m.g, h.d, h.ty, h.ty === 'block' ? 'Blocked' : h.ty === 'miss' ? 'Miss' : ''); m.anim = { kind: h.ty === 'hit' ? 'hurt' : 'block', t0: now, dur: 450 }; soundAt(m.x, m.z, () => combatSound(h.ty === 'hit' ? 'hit' : h.ty === 'block' ? 'thud' : 'miss')); }
  if (h.w === 'm' && r) { hitsplat(r.sprite, h.d, h.ty, h.ty === 'block' ? 'Blocked' : h.ty === 'miss' ? 'Miss' : ''); r.fAnim = { kind: h.ty === 'hit' ? 'hurt' : 'block', t0: now, dur: 450 }; }
}
// heals other players send you: added once, then cleared
let checkHeals = () => {};
function startHealStream(){
  /* no stream of its own: browsers allow only about six open connections to the database, and every extra stream starves saves and presence.
     Heals ride on the monsters' stream (adventure/live/mobs/_heals/<id>); when it says something changed there, fetch ours once. */
  checkHeals = () => fetch(`${DB}/adventure/live/mobs/_heals/${ONLINE.id}.json`).then(r => r.json()).then(take).catch(() => {});
  const take = data => { if (!data || typeof data !== 'object') return; for (const k in data) { const h = data[k]; fetch(`${DB}/adventure/live/mobs/_heals/${ONLINE.id}/${k}.json`, { method: 'DELETE' }).catch(() => {});
      if (!h || typeof h.a !== 'number' || Date.now() - (h.t || 0) > 30000) continue;   // stale ones are dropped
      const before = HP.cur; HP.cur = Math.min(maxHp(), HP.cur + Math.min(BANDAGE_HEAL, Math.max(0, h.a))); renderStats(); writePresence(true);
      hitsplat(hero, HP.cur - before, 'heal'); bandageChime(); healFx(hero); setTimeout(() => { if (!bandaging) healFx(null); }, 1200); for (let i = 0; i < 4; i++) setTimeout(() => healPlus(hero), i * 200);
      showToast(`${String(h.by || 'Someone').slice(0, 12)} bandaged you. (+${HP.cur - before} health)`); } };
}
function startMobStream(){
  startHealStream();
  // the server's clock, so everyone's monsters walk the same path at the same moment
  const t0 = Date.now();
  fetch(`${DB}/adventure/live/mobs/_clock/${ONLINE.id}.json`, { method: 'PUT', body: JSON.stringify({ '.sv': 'timestamp' }) }).then(r => r.json()).then(v => {
    if (typeof v === 'number') CLOCK_OFF = v - (t0 + Date.now()) / 2;
    fetch(`${DB}/adventure/live/mobs/_clock/${ONLINE.id}.json`, { method: 'DELETE' }).catch(() => {}); }).catch(() => {});
  const es = liveFeed('mobs');
  const apply = d => { const parts = d.path.split('/').filter(Boolean);
    if (!parts.length) { for (const k in (d.data || {})) if (/^\d+$/.test(k)) mobApply(+k, d.data[k]); if (d.data && d.data._heals && d.data._heals[ONLINE.id]) checkHeals(); return; }
    if (parts[0] === '_heals') { if (!parts[1] || parts[1] === ONLINE.id) checkHeals(); return; }   // a heal for someone: ours, maybe
    if (!/^\d+$/.test(parts[0])) return; const sid = +parts[0];
    if (parts.length === 1) { mobApply(sid, d.data); return; }
    const st = JSON.parse(JSON.stringify(MOBST[sid] || {})); let o = st; for (let i = 1; i < parts.length - 1; i++) o = o[parts[i]] || (o[parts[i]] = {});
    if (d.data === null) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = d.data; mobApply(sid, st); };
  es.addEventListener('put', e => apply(JSON.parse(e.data)));
  es.addEventListener('patch', e => { const d = JSON.parse(e.data); const parts = d.path.split('/').filter(Boolean);
    if (parts[0] === '_heals') { checkHeals(); return; }
    if (parts.length === 1 && /^\d+$/.test(parts[0])) { const sid = +parts[0], st = Object.assign({}, MOBST[sid] || {}); for (const k in d.data) { if (d.data[k] === null) delete st[k]; else st[k] = d.data[k]; } mobApply(sid, st); }
    else for (const k in d.data) apply({ path: d.path + '/' + k, data: d.data[k] }); });
}
function startEventStreams(){
  startMobStream();
  startPartyFeed();
  const es = liveFeed('event');
  es.addEventListener('put', e => { evApply(JSON.parse(e.data)); });
  es.addEventListener('patch', e => { evMerge(JSON.parse(e.data)); });
  const ff = liveFeed('fires'), fa = d => { const parts = d.path.split('/').filter(Boolean);
    if (!parts.length) { for (const f of FIRES.slice()) if (!f.mine && !(d.data && d.data[f.key])) dropFire(f, false); for (const k in (d.data || {})) fireApply(k, d.data[k]); return; }
    if (parts.length === 1) fireApply(parts[0], d.data); else fetch(fireUrl(parts[0])).then(r => r.json()).then(v => fireApply(parts[0], v)).catch(() => {}); };
  ff.addEventListener('put', e => fa(JSON.parse(e.data)));
  ff.addEventListener('patch', e => { const d = JSON.parse(e.data); for (const k in d.data) fa({ path: d.path + '/' + k, data: d.data[k] }); });
  const gs = liveFeed('graves');
  const ga = d => { const parts = d.path.split('/').filter(Boolean);
    if (!parts.length) { for (const k in GRAVES) if (!d.data || !d.data[k]) dropGrave(k); for (const k in (d.data || {})) setGrave(k, d.data[k]); return; }
    const id = parts[0]; if (parts.length === 1) { if (d.data === null) dropGrave(id); else setGrave(id, d.data); } else fetch(`${DB}/adventure/live/graves/${id}.json`).then(r => r.json()).then(g => g ? setGrave(id, g) : dropGrave(id)).catch(() => {}); };
  gs.addEventListener('put', e => ga(JSON.parse(e.data)));
  const gf = liveFeed('ground'), gapply = d => { const parts = d.path.split('/').filter(Boolean);
    if (!parts.length) { for (const gi of GROUND.slice()) if (gi.shared && gi.key && !(d.data && d.data[gi.key])) removeGround(gi); for (const k in (d.data || {})) groundApply(k, d.data[k]); return; }
    if (parts.length === 1) groundApply(parts[0], d.data);
    else fetch(groundUrl(parts[0])).then(r => r.json()).then(v => groundApply(parts[0], v)).catch(() => {}); };
  gf.addEventListener('put', e => gapply(JSON.parse(e.data)));
  gf.addEventListener('patch', e => { const d = JSON.parse(e.data); for (const k in d.data) gapply({ path: d.path + '/' + k, data: d.data[k] }); });
  gs.addEventListener('patch', e => { const d = JSON.parse(e.data); for (const k in d.data) ga({ path: d.path + '/' + k, data: d.data[k] }); });
}

// ----- the secret phrase: checked against its fingerprint, then the night begins -----
async function isEventPhrase(text){
  try { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text.trim().toLowerCase()));
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('') === EVENT_HASH; } catch (e) { return false; }
}
async function startBonfireNight(){
  if (!ONLINE.ready) return;
  try { const cur = await (await fetch(`${DB}/adventure/live/event.json`)).json();
    if (cur && cur.start && !cur.done && !cur.casual && Date.now() - cur.start < 75 * 60000) { showToast('The bonfire night is already under way.'); return; } } catch (e) { return; }
  const now = Date.now();
  const ev = { start: now, raidAt: now + 7 * 60000,   // the goblins come seven minutes in
    host: ONLINE.id, fuel: { f: 0.85, at: now + 13000, r: FUEL_RATE }, raid: { st: 'calm' } };
  try { const r = await fetch(`${DB}/adventure/live/event.json`, { method: 'PUT', body: JSON.stringify(ev) }); if (!r.ok) { showToast("The bonfire couldn't be started (the server said no)."); return; } } catch (e) { return; }
  showToast('The bonfire night begins.');
}

