// ===== parties: up to four players who can go down the cellar together. All of it lives at adventure/live/parties, on the one live feed =====
const PARTY_MAX = 4;
let PARTY = { id: null, d: null }, PT = {};
const partyPath = (pid, sub = '') => `${DB}/adventure/live/parties/${pid}${sub}.json`;
const pput = (url, body, method = 'PUT') => fetch(url, { method, body: JSON.stringify(body) }).catch(() => {});
function treeSet(root, parts, v){ if (!parts.length) return v === undefined ? null : v; root = root && typeof root === 'object' ? root : {}; const [k, ...rest] = parts; const nv = treeSet(root[k], rest, v); if (nv === null) delete root[k]; else root[k] = nv; return root; }
// whether another player is in the same world as you: both up top, or both in the same party's cellar
function sameWorld(r){ if (CAVE || inCaveZone(r.tx, r.tz)) return false;   /* the cave is solo */
  const down = inDelveZone(r.tx, r.tz); return down ? !!(DELVE && DELVE.party && r.pt === DELVE.party) : !DELVE; }
function startPartyFeed(){
  const f = liveFeed('parties');
  f.addEventListener('put', e => { const d = JSON.parse(e.data); PT = treeSet(PT, d.path.split('/').filter(Boolean), d.data) || {}; onParties(); });
  f.addEventListener('patch', e => { const d = JSON.parse(e.data), parts = d.path.split('/').filter(Boolean); for (const k in d.data) PT = treeSet(PT, [...parts, k], d.data[k]) || {}; onParties(); });
}
let invSeen = 0, dvAskSeen = 0;
function onParties(){
  const me = ONLINE.id; if (!me) return;
  // which party am I in?
  let pid = null; for (const k in PT) if (k !== '_inv' && PT[k] && PT[k].m && PT[k].m[me]) pid = k;
  if (pid !== PARTY.id) { PARTY.id = pid; writePresence(true); }
  PARTY.d = pid ? PT[pid] : null;
  // an invitation for me
  const inv = PT._inv && PT._inv[me];
  if (inv && inv.t !== invSeen && SNOW() - inv.t < 60000 && PT[inv.pid] && inv.pid !== PARTY.id) {
    invSeen = inv.t;
    delveAsk(`<div style="color:#f0c35a;font-size:16px;margin-bottom:6px">Party invitation</div>${escapeHtml(String(inv.by || 'Someone').slice(0, 12))} invites you to join their party.`, 'Join', () => joinParty(inv), 'Decline');
    fetch(`${DB}/adventure/live/parties/_inv/${me}.json`, { method: 'DELETE' }).catch(() => {});
  }
  // my party is going down the cellar, and I've been asked along
  const dv = PARTY.d && PARTY.d.dv;
  if (dv && dv.ask && dv.ask[me] && !DELVE && !CAVE && dv.on !== dvAskSeen && SNOW() - dv.on < 25000 && !(dv.who && dv.who[me])) {
    dvAskSeen = dv.on;
    if (!cellarOpen()) { showToast("Your party is heading down into the cellar, but you haven't unlocked it yet."); return; } const lead = remote[dv.host] ? remote[dv.host].name : 'Your party leader';
    delveAsk(`<div style="color:#f0c35a;font-size:16px;margin-bottom:6px;text-align:center">&#9888;&#65039; CELLAR CHALLENGE &#9888;&#65039;</div><div style="text-align:center">${escapeHtml(lead)} is leading your party down into the cellar.<br><br>Anyone who falls is out, and only those who pull their weight share the reward.<br><br>If defeated, you lose 25% of your coins and all delve XP.<br><br>Will you go with them?</div>`, 'Accept', () => {
      const d2 = PARTY.d && PARTY.d.dv; if (!d2 || d2.on !== dv.on || d2.done) { showToast("Too late, they've gone ahead."); return; }
      pput(partyPath(PARTY.id, '/dv/who/' + me), 1); startDelve({ party: PARTY.id, on: dv.on }); }, 'Stay behind');
  }
  // the leader counts the blows everyone else lands
  if (DELVE && DELVE.party && dv && dv.host === me && PARTY.d.hits) for (const k in PARTY.d.hits) { const h = PARTY.d.hits[k]; delete PARTY.d.hits[k];
    fetch(partyPath(PARTY.id, '/hits/' + k), { method: 'DELETE' }).catch(() => {});
    const m = DELVE.mons.find(q => q.sp === h.sp); if (m && m.state !== 'dying' && m.state !== 'dead') { m.hp = Math.max(0, m.hp - Math.max(0, Math.min(50, h.d || 0))); threat(m, h.by, Math.max(0, Math.min(50, h.d || 0))); if (m.hp <= 0) { m.state = 'dying'; m.dieT = performance.now(); combatSound((m.t.snd || 'goblin') + 'Die'); } } }
  partyFramesDirty = true;
}
function inviteToParty(id){
  const r = remote[id]; if (!r) return;
  let pid = PARTY.id;
  if (!pid) { pid = 'p' + ONLINE.id.slice(0, 6) + Date.now().toString(36); pput(partyPath(pid), { lead: ONLINE.id, m: { [ONLINE.id]: { n: ONLINE.name } } }); PARTY.id = pid; writePresence(true); }
  else if (Object.keys(PARTY.d && PARTY.d.m || {}).length >= PARTY_MAX) { showToast('Your party is full.'); return; }
  // only say it's sent once the database has taken it, so a refused write isn't passed off as an invite
  fetch(`${DB}/adventure/live/parties/_inv/${id}.json`, { method: 'PUT', body: JSON.stringify({ pid, by: ONLINE.name, t: SNOW() }) })
    .then(res => showToast(res.ok ? `You invite ${r.name} to your party.` : "Your invite couldn't be sent. Try again in a moment."))
    .catch(() => showToast("Your invite couldn't be sent. Try again in a moment."));
}
function joinParty(inv){
  const d = PT[inv.pid]; if (!d) { showToast('That party has broken up.'); return; }
  if (Object.keys(d.m || {}).length >= PARTY_MAX) { showToast('That party is full.'); return; }
  if (PARTY.id && PARTY.id !== inv.pid) leaveParty(true);
  pput(partyPath(inv.pid, '/m/' + ONLINE.id), { n: ONLINE.name }); PARTY.id = inv.pid; writePresence(true);
  showToast(`You join ${String(inv.by || 'their').slice(0, 12)}'s party.`);
}
function leaveParty(quiet){
  const pid = PARTY.id; if (!pid) return; const d = PT[pid];
  const others = Object.keys(d && d.m || {}).filter(k => k !== ONLINE.id);
  if (!others.length) fetch(partyPath(pid), { method: 'DELETE' }).catch(() => {});
  else { fetch(partyPath(pid, '/m/' + ONLINE.id), { method: 'DELETE' }).catch(() => {}); if (d && d.lead === ONLINE.id) pput(partyPath(pid, '/lead'), others.sort()[0]); }
  PARTY = { id: null, d: null }; writePresence(true); partyFramesDirty = true;
  if (!quiet) showToast('You leave the party.');
}
function partyMark(what){ if (DELVE && DELVE.party) pput(partyPath(DELVE.party, `/dv/${what}/${ONLINE.id}`), 1); }
// party members (online) waiting by the cellar doors
function partyNearCellar(all){   /* only those who've earned their way in, unless all is asked for */
  if (!PARTY.d) return [];
  return Object.keys(PARTY.d.m || {}).filter(id => id !== ONLINE.id && remote[id] && (all || remote[id].dl) && Math.hypot(remote[id].tx - RUIN.cellar.x, remote[id].tz - RUIN.cellar.z) < 18);
}
// ----- party frames: each member's name, combat level and health, down the left of the screen -----
let partyFramesDirty = true, partyFramesAt = 0;
function renderPartyFrames(){
  const now = performance.now(); if (!partyFramesDirty && now - partyFramesAt < 400) return; partyFramesDirty = false; partyFramesAt = now;
  const el = document.getElementById('partyFrames');
  if (!PARTY.d) { el.hidden = true; return; }
  const ids = Object.keys(PARTY.d.m || {}).sort((a, b) => (a === ONLINE.id ? -1 : b === ONLINE.id ? 1 : 0));
  const dv = PARTY.d.dv, row = id => {
    const mine = id === ONLINE.id, r = remote[id], name = mine ? ONLINE.name : (r ? r.name : (PARTY.d.m[id].n || '?'));
    const hp = mine ? [HP.cur, maxHp()] : r && r.hp, cb = mine ? combatLevel() : r && r.cb, gone = !mine && !r;
    const fell = DELVE && DELVE.party && dv && dv.dead && dv.dead[id];
    const pct = hp ? Math.max(0, Math.min(100, hp[0] / hp[1] * 100)) : 0;
    return `<div class="pfRow${gone || fell ? ' pfGone' : ''}" data-p="${mine ? '' : id}"><div class="pfTop"><span>${PARTY.d.lead === id ? '&#9819; ' : ''}${escapeHtml(name)}</span><small>${cb ? 'Lv ' + cb : ''}</small></div>
      <div class="pfBar"><i style="width:${pct.toFixed(0)}%"></i></div><div class="pfHp">${fell ? 'Fallen' : gone ? 'Away' : hp ? hp[0] + ' / ' + hp[1] : ''}</div></div>`; };
  el.innerHTML = `<div class="pfHead">Party</div>${ids.map(row).join('')}<button class="pfLeave">Leave party</button>`;
  el.hidden = false;
}
document.addEventListener('click', e => {
  const el = document.getElementById('partyFrames'); if (!el || !el.contains(e.target)) return;
  if (e.target.closest('.pfLeave')) { leaveParty(false); return; }
  if (e.target.closest('.pfHead')) { el.classList.toggle('pfOpen'); return; }
  const rowEl = e.target.closest('.pfRow[data-p]'); const id = rowEl && rowEl.dataset.p; if (!id) return;
  const b = bag.find(i => i.name === 'Bandage'); if (!b) { showToast('You need a bandage to patch them up.'); return; }
  if (!remote[id] || !sameWorld(remote[id])) { showToast("They're not here."); return; }
  healOther(b, id);
});
// ===== the party delve: the leader's game runs the waves and the creatures and shares them; everyone fights them =====
function startPartyDelve(ids){
  const on = SNOW();
  pput(partyPath(PARTY.id, '/dv'), { on, host: ONLINE.id, ask: Object.fromEntries(ids.map(i => [i, 1])), who: { [ONLINE.id]: 1 }, wave: -1, next: on + 12000, mons: [] });
  startDelve({ party: PARTY.id, on });
  showToast('You climb down. Your party has a few seconds to follow you...');
}
// every swing, blow, block and miss down the cellar goes to the party too, so everyone sees the whole fight
let fxK = 0, fxQ = [];
const fxSeen = {};
function partyFx(m, w, d, ty){
  fxQ.push({ k: ++fxK, on: DELVE.on, sp: m.sp, w, d: d || 0, ty: ty || '' }); if (fxQ.length > 6) fxQ.shift();
  pput(partyPath(DELVE.party, '/fx/' + ONLINE.id), { k: fxK, e: fxQ });
}
function partyFxApply(){
  const fx = PARTY.d && PARTY.d.fx; if (!fx || !DELVE || !DELVE.party) return;
  const now = performance.now();
  for (const by in fx) { if (by === ONLINE.id || !fx[by]) continue;
    const list = Array.isArray(fx[by].e) ? fx[by].e : Object.values(fx[by].e || {}), key = by + '@' + DELVE.on;
    if (fxSeen[key] === undefined) fxSeen[key] = 0;   /* blows from an earlier delve carry another 'on' and are skipped */
    for (const h of list) { if (!h || h.on !== DELVE.on || h.k <= fxSeen[key]) continue; fxSeen[key] = h.k;
      const m = DELVE.mons.find(q => q.sp === h.sp), r = remote[by]; if (!m || !m.g) continue;
      const lbl = h.ty === 'block' ? 'Blocked' : h.ty === 'miss' ? 'Miss' : '';
      if (h.w === 'ps' && r) { r.fAnim = { kind: 'swing', t0: now, dur: r.sprite.userData.chibi && r.sprite.userData.chibi.weaponL ? DUAL_MS : 900 }; soundAt(m.x, m.z, () => combatSound('swing')); }
      if (h.w === 'ms') { m.anim = { kind: 'swing', t0: now, dur: 900 }; soundAt(m.x, m.z, () => combatSound((m.t.snd || 'goblin') + 'Attack')); }
      if (h.w === 'p') { hitsplat(m.g, h.d, h.ty, lbl); m.anim = { kind: h.ty === 'hit' ? 'hurt' : 'block', t0: now, dur: 450 }; soundAt(m.x, m.z, () => combatSound(h.ty === 'hit' ? 'hit' : h.ty === 'block' ? 'thud' : 'miss')); }
      if (h.w === 'm' && r) { hitsplat(r.sprite, h.d, h.ty, lbl); r.fAnim = { kind: h.ty === 'hit' ? 'hurt' : 'block', t0: now, dur: 450 }; soundAt(m.x, m.z, () => combatSound(h.ty === 'hit' ? 'hit' : 'miss')); }
    } }
}
// threat: each creature goes for whoever has hurt it most, and only turns when someone overtakes its current target
function threat(m, id, d){ if (!id || !(d > 0)) return; (m.dmgBy || (m.dmgBy = {}))[id] = (m.dmgBy[id] || 0) + d; }
function topThreat(m, alive){ let best = null, bd = 0; for (const id in (m.dmgBy || {})) if (alive.includes(id) && m.dmgBy[id] > bd) { bd = m.dmgBy[id]; best = id; }
  return best && (!m.tg || !alive.includes(m.tg) || bd > ((m.dmgBy || {})[m.tg] || 0)) ? best : null; }
function partyHit(m, dmg){ m.hp = Math.max(0, m.hp - dmg); m.pendAt = performance.now(); fetch(partyPath(DELVE.party, '/hits'), { method: 'POST', body: JSON.stringify({ sp: m.sp, d: dmg, by: ONLINE.id }) }).catch(() => {}); }
function partyAlive(dv){ const me = ONLINE.id; return Object.keys(dv.who || {}).filter(id => !(dv.dead && dv.dead[id]) && !(dv.left && dv.left[id]) && (id === me || (remote[id] && inDelveZone(remote[id].tx, remote[id].tz)))); }
function updatePartyDelve(){
  const now = performance.now(), dt = Math.min(0.25, (now - (DELVE.last || now)) / 1000); DELVE.last = now;
  const dv = PARTY.d && PARTY.d.dv;
  if (!dv || dv.on !== DELVE.on) { if (!DELVE.done && !DELVE.orphanAt) DELVE.orphanAt = now; if (DELVE.orphanAt && now - DELVE.orphanAt > 6000) { DELVE.done = true; clearDelveMonsters(); DELVE.mons = []; showToast('Your party has broken up. The cellar falls quiet; climb the ladder to leave.'); } return; }
  DELVE.orphanAt = 0;
  const me = ONLINE.id, alive = partyAlive(dv);
  // the leader fell or left: the next one down takes over the creatures
  // ...or their game has stopped (a hidden tab or a phone put down): no word from it for a few seconds, so the next one takes over
  const stale = dv.host !== me && dv.hb && SNOW() - dv.hb > 6000, claim = dv.host + ':' + (dv.hb || 0);
  if ((!alive.includes(dv.host) || stale) && alive.filter(id => id !== dv.host).sort()[0] === me && DELVE.claimed !== claim) {
    DELVE.claimed = claim; pput(partyPath(DELVE.party, '/dv'), { host: me, hb: SNOW() }, 'PATCH'); dv.host = me; dv.hb = SNOW(); for (const m of DELVE.mons) m.ghost = false; }
  const host = dv.host === me;
  if (!host) { for (const m of DELVE.mons) m.ghost = true; DELVE.hw = undefined; }   /* someone else took over while my game was asleep: their count wins now */
  DELVE.wave = dv.wave; DELVE.next = dv.next && dv.next > SNOW() ? now + (dv.next - SNOW()) : 0;
  if (dv.done) { if (!DELVE.done) finishPartyDelve(dv); updateDelveChest(); return; }
  if (DELVE.done) { updateDelveChest(); return; }
  if (host) hostPartyDelve(dv, now, dt, alive); else followPartyDelve(dv, now, dt);
  if (!host && dv.wave !== DELVE.toldWave) { const was = DELVE.toldWave; DELVE.toldWave = dv.wave;   // the others hear what the leader's game says
    const list = Array.isArray(dv.mons) ? dv.mons : Object.values(dv.mons || {});
    if (was !== undefined && dv.wave >= 0 && list.length) showToast(`Wave ${dv.wave + 1} of ${DELVE_WAVES.length}: ${list.map(s => MONSTER_TYPES[s.k].name.toLowerCase()).join(' and ')}!`); }
  if (host) DELVE.toldWave = DELVE.hw;
  partyFight(now, dt, host); partyFxApply();
  for (const m of DELVE.mons) if (m.tg !== me && m.state !== 'dying' && m.state !== 'dead' && m.anim && now - m.anim.t0 < m.anim.dur) monsterPose(m, m.anim.kind, (now - m.anim.t0) / m.anim.dur);   /* their swings and flinches at someone else */
  faceTargets();
  if (now - (DELVE.cAt || 0) > 2000) { DELVE.cAt = now; pput(partyPath(DELVE.party, '/c/' + me), { d: DELVE.dmg || 0, h: DELVE.heal || 0 }); }
}
// the leader: waves, targets, movement, and sharing it all a few times a second
function hostPartyDelve(dv, now, dt, alive){
  // the leader keeps its own wave and timer and sends them every time, rather than waiting to read its own writes back:
  // one lost write or a slow stream used to leave the party stuck between waves
  if (DELVE.hw === undefined || DELVE.hFor !== DELVE.on) { DELVE.hFor = DELVE.on; DELVE.hw = dv.wave; DELVE.hn = dv.next || 0; }
  dv = { ...dv, wave: DELVE.hw, next: DELVE.hn };
  const N = DELVE_WAVES.length, live = DELVE.mons.filter(m => m.state !== 'dying' && m.state !== 'dead'), write = {};
  if (!live.length) {
    const finished = DELVE.mons.every(m => m.state === 'dead' || (m.state === 'dying' && now - m.dieT > 1400));
    if (dv.wave >= 0 && !(dv.next > SNOW()) && finished && (DELVE.waitFor !== dv.wave || (dv.wave >= N - 1 && now - (DELVE.waitAt || 0) > 3000))) {
      DELVE.waitFor = dv.wave; DELVE.waitAt = now;   /* the end of the delve is sent again every few seconds until it lands */
      if (dv.wave >= N - 1) {   // the last wave falls: who pulled their weight?
        const c = PARTY.d.c || {}, score = id => ((c[id] && c[id].d) || 0) + ((c[id] && c[id].h) || 0) + (id === ONLINE.id ? 0 : 0);
        c[ONLINE.id] = { d: DELVE.dmg || 0, h: DELVE.heal || 0 };
        const total = alive.reduce((t, id) => t + score(id), 0), fair = alive.length ? total / alive.length : 0;
        const ok = Object.fromEntries(alive.filter(id => score(id) > 0 && score(id) >= fair * 0.5).map(id => [id, 1]));
        pput(partyPath(DELVE.party, '/dv'), { done: 1, ok }, 'PATCH'); return;
      }
      write.next = DELVE.hn = dv.next = SNOW() + 5000; showToast(`Wave ${dv.wave + 1} beaten! The next one comes in 5 seconds.`);
    }
    if (dv.next && SNOW() > dv.next && finished) {   // the next wave
      clearDelveMonsters(); DELVE.mons = [];
      const wave = dv.wave + 1, w = DELVE_WAVES[wave], kinds = w === 'r2' ? [0, 1].map(() => ['chicken', 'rat', 'cow'][Math.floor(Math.random() * 3)]) : w;
      const gates = [[DELVE_C.x, DELVE_C.z + DELVE_C.pit - 1.2], [DELVE_C.x + DELVE_C.pit - 1.2, DELVE_C.z]], mult = 1 + 0.6 * (Math.max(1, alive.length) - 1);
      DELVE.mons = kinds.map((k, i) => { const m = spawnMonster(k, gates[i % 2][0], gates[i % 2][1], 0); m.delve = true; m.sp = wave + '-' + i; m.maxHp = m.hp = Math.round(m.t.hp * mult); return m; });
      write.wave = DELVE.hw = wave; write.next = DELVE.hn = 0; showToast(`Wave ${wave + 1} of ${N}: ${kinds.map(k => MONSTER_TYPES[k].name.toLowerCase()).join(' and ')}!`);
    }
  }
  // each creature picks someone still standing and goes for them
  for (const m of DELVE.mons) { if (m.state === 'dying' || m.state === 'dead') continue;
    const top = topThreat(m, alive); if (top && top !== m.tg) m.tg = top;   /* the one hurting it most */
    if (!m.tg || !alive.includes(m.tg)) { let best = null, bd = 1e9; for (const id of alive) { const q = playerPos(id); if (!q) continue; const d = Math.hypot(q[0] - m.x, q[1] - m.z) + (DELVE.mons.filter(o => o.tg === id).length * 3); if (d < bd) { bd = d; best = id; } } m.tg = best; }
    if (m.tg && m.tg !== ONLINE.id) { const q = playerPos(m.tg); if (q) { const dx = q[0] - m.g.position.x, dz = q[1] - m.g.position.z, d = Math.hypot(dx, dz), want = reachOf(m);
      if (d > want + 0.1) { const st = Math.min(d - want, 3.2 * dt); m.g.position.x += dx / d * st; m.g.position.z += dz / d * st; turnChibi(m.g, Math.atan2(dx, dz)); if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'walk'); }
      else { m.g.rotation.y = yawTo(m.g.position.x, m.g.position.z, q[0], q[1]); if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'ready'); }
      m.x = m.g.position.x; m.z = m.g.position.z; } } }
  if (now - (DELVE.shareAt || 0) > 220 || write.wave !== undefined) { DELVE.shareAt = now;
    write.hb = SNOW(); write.wave = DELVE.hw; write.next = DELVE.hn; write.mons = DELVE.mons.map(m => ({ k: m.type, sp: m.sp, x: +m.g.position.x.toFixed(2), z: +m.g.position.z.toFixed(2), hp: m.hp, mx: m.maxHp || m.t.hp, tg: m.tg || '', st: m.state === 'dying' || m.state === 'dead' ? 'd' : 'a' }));
    pput(partyPath(DELVE.party, '/dv'), write, 'PATCH'); }
}
// everyone else: the creatures are where the leader says, with the health the leader says
function followPartyDelve(dv, now, dt){
  const list = Array.isArray(dv.mons) ? dv.mons : Object.values(dv.mons || {});
  if (DELVE.mons.length !== list.length || DELVE.mons.some((m, i) => !list[i] || m.sp !== list[i].sp)) {
    clearDelveMonsters();
    DELVE.mons = list.map(s => { const m = spawnMonster(s.k, s.x, s.z, 0); m.delve = true; m.ghost = true; m.sp = s.sp; m.maxHp = s.mx; m.hp = s.hp; return m; });
  }
  DELVE.mons.forEach((m, i) => { const s = list[i]; m.tg = s.tg; m.maxHp = s.mx;
    if (!(m.pendAt && now - m.pendAt < 1500)) m.hp = s.hp; else m.hp = Math.min(m.hp, s.hp);   // my own blow shows at once; the leader's count wins after
    if (s.st === 'd' && m.state !== 'dying' && m.state !== 'dead') { m.state = 'dying'; m.dieT = now; combatSound((m.t.snd || 'goblin') + 'Die'); if (FIGHT && FIGHT.m === m) endFight(); }
    if (m.state === 'dying' || m.state === 'dead') return;
    if (!(FIGHT && FIGHT.m === m && m.tg === ONLINE.id)) { const dx = s.x - m.g.position.x, dz = s.z - m.g.position.z, d = Math.hypot(dx, dz);
      if (d > 0.05) { const st = Math.min(d, Math.max(3.2 * dt, d * 0.25)); m.g.position.x += dx / d * st; m.g.position.z += dz / d * st; if (d > 0.3) { turnChibi(m.g, Math.atan2(dx, dz)); if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'walk'); } } }
    m.x = m.g.position.x; m.z = m.g.position.z; });
}
// the creatures coming for you: walk up, fight, and strike as in the solo delve (your own game rolls their blows against you)
// a creature always faces whoever it's after: when it's close enough to fight, it turns to them whatever else is going on
function faceTargets(){
  for (const m of DELVE.mons) { if (m.state === 'dying' || m.state === 'dead' || !m.tg) continue;
    const q = m.tg === ONLINE.id ? hero && [hero.position.x, hero.position.z] : remote[m.tg] && [remote[m.tg].sprite.position.x, remote[m.tg].sprite.position.z]; if (!q) continue;
    if (Math.hypot(q[0] - m.g.position.x, q[1] - m.g.position.z) < reachOf(m) + 1.5) turnChibi(m.g, yawTo(m.g.position.x, m.g.position.z, q[0], q[1])); }
}
function partyFight(now, dt, host){
  const mine = DELVE.mons.filter(m => m.state !== 'dying' && m.state !== 'dead' && m.tg === ONLINE.id);
  const lead = FIGHT && mine.includes(FIGHT.m) ? FIGHT.m : null, leadA = lead ? Math.atan2(lead.g.position.x - hero.position.x, lead.g.position.z - hero.position.z) : 0;
  mine.forEach((m, i) => { const reach = reachOf(m);
    if (m.anim && now - m.anim.t0 < m.anim.dur) monsterPose(m, m.anim.kind, (now - m.anim.t0) / m.anim.dur);
    if (lead === m) return;
    let tx = hero.position.x, tz = hero.position.z, want = reach;
    if (lead) { const a = leadA + (i % 2 ? 1 : -1) * Math.PI * 0.6; tx += Math.sin(a) * reach; tz += Math.cos(a) * reach; want = 0.15; }
    const dx = tx - m.g.position.x, dz = tz - m.g.position.z, d = Math.hypot(dx, dz);
    if (host && d > want + 0.1) { const st = Math.min(d - want, 3.2 * dt); m.g.position.x += dx / d * st; m.g.position.z += dz / d * st; turnChibi(m.g, Math.atan2(dx, dz)); if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'walk'); }
    else if (Math.hypot(hero.position.x - m.g.position.x, hero.position.z - m.g.position.z) < reach + 0.6) {
      m.g.rotation.y = yawTo(m.g.position.x, m.g.position.z, hero.position.x, hero.position.z);
      if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'ready');
      if (!FIGHT && !walkTarget && m.state === 'standing') { m.state = 'engaged'; FIGHT = { m, nextP: now + 600, nextM: now + 1200, pAnim: null, mAnim: null }; heroAnim.yaw = yawTo(hero.position.x, hero.position.z, m.g.position.x, m.g.position.z); setAct(fightAct(m)); }
      else if (FIGHT && FIGHT.m !== m) { if (!m.nextHit) m.nextHit = now + 900 + Math.random() * 600; if (now > m.nextHit) { m.nextHit = now + m.t.speed; sideSwing(m); } }
    }
    m.x = m.g.position.x; m.z = m.g.position.z; });
}
function finishPartyDelve(dv){
  if (dv.ok && dv.ok[ONLINE.id]) { delveWon(); return; }
  clearDelveMonsters(); DELVE.done = true; DELVE.mons = [];
  showToast("The cellar falls quiet. Your party won through, but you barely lifted a finger. There's no reward for you this time.");
  addSystemLine('Climb the ladder to leave the cellar.');
}
