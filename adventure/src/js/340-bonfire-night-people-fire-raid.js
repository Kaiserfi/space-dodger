// ----- speech bubbles over villagers during the night -----
const EVSAY = [];
function evSay(sp, text, ms = 3200){
  if (!sp) return;
  for (const s of EVSAY) if (s.sp === sp) { s.el.remove(); s.dead = true; }
  const el = document.createElement('div'); el.className = 'npcBub'; el.textContent = text; document.body.appendChild(el);
  EVSAY.push({ sp, el, until: performance.now() + ms + text.length * 30 });
}
const evBV = new THREE.Vector3();
function updateEvSay(){
  const now = performance.now();
  for (let i = EVSAY.length - 1; i >= 0; i--) { const s = EVSAY[i];
    if (s.dead || now > s.until) { s.el.remove(); EVSAY.splice(i, 1); continue; }
    s.sp.getWorldPosition(evBV); evBV.y += 4.4 * s.sp.scale.x / CHIBI_SCALE; evBV.project(camera);
    s.el.style.display = evBV.z < 1 ? '' : 'none';
    s.el.style.left = ((evBV.x + 1) / 2 * innerWidth) + 'px'; s.el.style.top = ((1 - evBV.y) / 2 * innerHeight) + 'px'; }
}

// ----- the villagers: borrowed from their rounds for the night, then sent home -----
const npcSp = name => { const b = BARKERS.find(b => b.rec.name === name); return b ? b.sp : null; };
function borrowNpc(name){
  if (EV.npcs[name]) return EV.npcs[name];
  const b = BARKERS.find(b => b.rec.name === name); if (!b) return null;
  const i = WANDER.findIndex(w => w.sp === b.sp); const w = i >= 0 ? WANDER.splice(i, 1)[0] : null;
  const n = EV.npcs[name] = { name, sp: b.sp, b, w, barks: b.rec.barks, home: [b.sp.position.x, b.sp.position.z], mode: 'idle', path: null };
  b.rec.barks = null;   // no random remarks while they're busy with the night
  return n;
}
function releaseNpc(n){
  if (n.w) WANDER.push(n.w);
  n.b.rec.barks = n.barks; n.b.rec.x = n.sp.position.x; n.b.rec.z = n.sp.position.z;
  poseChibi(n.sp, 'idle', 0); n.sp.position.y = 0;
  delete EV.npcs[n.name];
}
// a route along the walkable ground, thinned out, timed at a walking speed
function npcRoute(n, to, t0, speed){
  const from = [n.sp.position.x, n.sp.position.z];
  let p = findPath(new THREE.Vector3(from[0], 0, from[1]), new THREE.Vector3(to[0], 0, to[1])).map(q => [q.x, q.z]);
  if (p.length < 2) p = [from, to]; else { const out = [p[0]]; for (let i = 3; i < p.length - 1; i += 3) out.push(p[i]); out.push(to); p = out; }
  let len = 0; for (let i = 1; i < p.length; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  n.path = { pts: p, t0, t1: t0 + len / speed, speed };
}
function followRoute(n, t){
  const P = n.path, pts = P.pts; let d = segK(t, P.t0, P.t1) * (P.t1 - P.t0) * P.speed, i = 0;
  while (i < pts.length - 2) { const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (d <= L) break; d -= L; i++; }
  const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0) || 1, k = Math.min(1, d / L);
  n.sp.position.set(x0 + (x1 - x0) * k, 0, z0 + (z1 - z0) * k);
  if (t < P.t1) { n.sp.rotation.y = Math.atan2(x1 - x0, z1 - z0); poseChibi(n.sp, 'walk', t * (P.speed > 6 ? 1.6 : 1.1)); return false; }
  return true;
}
function sitPoseAt(g, st, t, seed, child){
  g.position.set(st.x, 0.3, st.z); g.rotation.y = Math.atan2(BF.x - st.x, BF.z - st.z); poseChibi(g, 'idle', t);
  const c = g.userData.chibi, [AL, AR] = c.arms, cold = 1 - fuelNow();
  c.legs.forEach((l, i) => l.rotation.x = -1.45 + (child ? Math.sin(t * 4 + i * Math.PI) * 0.25 : 0));
  c.body.position.y = 0.02 + Math.sin(t * 1.6 + seed) * 0.01; c.body.rotation.x = 0.08 + cold * 0.15; c.body.rotation.z = Math.sin(t * 0.8 + seed) * 0.03;
  AL.rotation.set(-1.15, 0, -0.1); AR.rotation.set(-1.15, 0, 0.1);   // hands held still, out towards the fire
  c.head.rotation.y = Math.sin(t * 0.35 + seed * 2) * 0.45;
}
// who comes to the fire, when they set off after Aldric does, and where they sit (players get every other seat)
const GUESTS = [
  { name: 'Lyra', leave: 1.5, seat: 4, hi: "Ooh, the bonfire's being lit! Wait for me!" },
  { name: 'Fenwick', leave: 3, seat: 7, hi: "That'll be the bonfire. I've got a story for tonight." },
  { name: 'Bram', leave: 4.5, seat: 0, hi: "Come on, love, the fire's lit. Leave the hens for once." },
  { name: 'Hilde', leave: 5, seat: 1, hi: "Coming! Pip, you're coming too!" },
  { name: 'Pip', leave: 7, seat: 10, hi: "Bonfire! Bonfire! Everyone, there's a bonfire!", run: true, child: true },
];
const VILLAGER_SEATS = new Set(GUESTS.map(g => g.seat));
const GUARDS = ['Osric', 'Edda', 'Bertram', 'Godwin'];
const ALD_POST = () => [BF.x - 2.6, BF.z - BF.clearR + 2.2];
const KNEEL = () => [BF.x + 2.4, BF.z - 0.4];
// things villagers say round the fire: a few short exchanges, one every half a minute
const CONVOS = [   // played in order, one every 30 seconds from when the fire's going, so none repeat before the raid
  [['Lyra', "Oh, I love a bonfire. Everyone's faces look so cosy in the firelight."], ['Bram', "Mine looks like a baked potato, Hilde says."], ['Hilde', "A handsome baked potato, dear."]],
  [['Fenwick', "Did I ever tell you lot about the fish as big as a horse?"], ['Bram', "Only every night, Fenwick. Every single night."], ['Lyra', "I'm putting it in a song, actually."], ['Fenwick', "See? Lyra believes me."]],
  [['Pip', "Aldric, have you ever fought a dragon?"], ['Aldric', "Not yet, Pip. Ask me again next week."], ['Pip', "Next week! Everyone heard that!"]],
  [['Hilde', "Henrietta laid another double-yolker this morning."], ['Bram', "She'll be unbearable now."], ['Hilde', "She was unbearable before. Now she's got a reason."]],
  [['Lyra', "Any requests? I know three songs. Well, four."], ['Fenwick', "The one about the big fish!"], ['Lyra', "That's not one of the four, Fenwick."], ['Pip', "Sing the one about the goose!"]],
  [['Bram', "Truffle got into Brenna's flour again today."], ['Hilde', "Came out looking like a ghost, poor thing."], ['Pip', "I thought she was a ghost! I screamed so loud!"]],
  [['Aldric', "It's good to see so many folk out tonight. The village feels busy again."], ['Fenwick', "Busier than my fishing spot, that's for certain."], ['Hilde', "That's because the fish heard you were coming, Fenwick."]],
  [['Pip', "Why does the fire crackle like that?"], ['Hilde', "That's the sap in the wood popping, love."], ['Pip', "So the logs are telling jokes?"], ['Bram', "Better ones than Fenwick's, anyway."]],
  [['Fenwick', "When I was a lad, we had bonfires every week at harvest."], ['Lyra', "Every week? What happened?"], ['Fenwick', "Someone set fire to the mayor's hat. Long story."]],
  [['Hilde', "Has anyone tried Brenna's honey bread? It's wonderful."], ['Bram', "I've had four slices today."], ['Hilde', "Four? I gave you two."], ['Bram', "...Lovely fire, isn't it?"]],
  [['Lyra', "Look at the stars tonight. You can see right across the sky."], ['Pip', "That one looks like a pig!"], ['Bram', "Don't tell Truffle. She'll get ideas."]],
  [['Aldric', "Hobb says the woods have been quiet these last few nights. Too quiet."], ['Fenwick', "Hobb thinks everything's too quiet. Or too loud."], ['Aldric', "Even so. Keep your wits about you tonight."]],
  [['Pip', "Did anyone else hear that? Out past the trees?"], ['Hilde', "It's just the wind, Pip. Come and sit by me."], ['Aldric', "...Maybe. Stay close to the fire, everyone."]],
];
const PANIC = {
  Lyra: ["Help! There are goblins everywhere!", "Somebody stop them, please!", "My lute! Mind my lute!"],
  Fenwick: ["I'm too old for this! Help!", "Get away, you horrible little things!", "Somebody call the guards!"],
  Bram: ["Not near the farm, you don't! Help!", "Somebody grab a pitchfork!", "Hilde! Where are you?"],
  Hilde: ["Pip! Pip, stay close to me!", "Help us, somebody, please!", "Get back, all of you!"],
  Pip: ["Goblins! Real goblins! Help!", "I'm not scared! Okay, I'm a bit scared!", "Mum! Mum, where are you?"],
};

// ----- the fire itself: flames, light and sparks follow the shared fuel, and the light grows as night falls -----
function updateFireLook(){
  const f = fuelNow(), t = performance.now() / 1000;
  for (const { f: m, h, p, s } of BF.flames) { const k = h * f * (0.8 + 0.25 * Math.sin(t * s + p) + 0.1 * Math.sin(t * 13 + p * 3)); m.visible = k > 0.02; m.scale.set(1, Math.max(0.01, k), 1); m.position.y = 0.35 + k / 2; }
  const hr = hourNow(), dark = hr < 6 || hr > 19.5 ? 1 : hr < 7 ? 7 - hr : hr > 18.5 ? hr - 18.5 : 0;
  BF.light.intensity = f * (2 + 20 * dark) * (0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3));
  BF.light.position.set(BF.x + Math.sin(t * 7) * 0.08, 2 + Math.sin(t * 11) * 0.05, BF.z + Math.cos(t * 6) * 0.08);
  BF.sparks.visible = f > 0.05;
  if (BF.sparks.visible) { const sp = BF.sparkPos, life = BF.sparkLife;
    for (let i = 0; i < life.length; i++) { life[i] += 0.016; if (life[i] > 2.5) { life[i] = 0; sp[i * 3] = BF.x + (Math.random() - 0.5) * 1.1; sp[i * 3 + 1] = 0.9; sp[i * 3 + 2] = BF.z + (Math.random() - 0.5) * 1.1; }
      sp[i * 3] += Math.sin(t * 3 + i) * 0.004; sp[i * 3 + 1] += 0.03 * (0.5 + f); }
    BF.sparks.geometry.attributes.position.needsUpdate = true; }
  BF.pit.userData.action = f > 0.02 ? 'Add a log' : 'Fire pit';
  fireSound(f);
}
// the crackle: a breathy roar plus pops, louder the bigger the fire and the closer you are
const FIRE_SND = { bed: null, next: 0 };
function fireSound(f){
  const ctx = audio(); if (!ctx) return;
  const v = f * clamp01(1 - evDist(BF.x, BF.z) / 40);
  if (v > 0.005 && !FIRE_SND.bed) { const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, 2); src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; const g = ctx.createGain(); g.gain.value = 0; src.connect(lp); lp.connect(g); g.connect(sfxOut(ctx)); src.start(); FIRE_SND.bed = { src, lp, g }; }
  if (FIRE_SND.bed) { FIRE_SND.bed.g.gain.value = 0.16 * v; FIRE_SND.bed.lp.frequency.value = 300 + 400 * f;
    if (v <= 0.005) { FIRE_SND.bed.src.stop(); FIRE_SND.bed = null; } }
  const now = performance.now();
  if (v > 0.01 && now > FIRE_SND.next) { FIRE_SND.next = now + 40 + Math.random() * 400 / (0.2 + f); sfx((c, t, out) => { out.gain.value = v; bfSnd.pop(c, out, t); }); }
}
const bfSnd = {
  pop(ctx, out, t){ nz(ctx, out, t, 0.03, 'bandpass', 1500 + Math.random() * 2800, 1200, 2.5, 0.25 + Math.random() * 0.5, 0.001, 0.025); if (Math.random() < 0.15) nz(ctx, out, t, 0.08, 'lowpass', 300, 200, 0.7, 0.3, 0.002, 0.07); },
  flint(ctx, out, t){ ring(ctx, out, t, [[3900, 1, 1], [5700, 0.6, 1.6], [2500, 0.35, 1.2]], 0.22, 0.16); nz(ctx, out, t, 0.05, 'highpass', 5000, 5000, 0.7, 0.5, 0.001, 0.04); nz(ctx, out, t + 0.02, 0.35, 'bandpass', 7000, 6000, 2, 0.08, 0.01, 0.3); },
  catch(ctx, out, t){ nz(ctx, out, t, 1.4, 'bandpass', 250, 1300, 0.8, 0.55, 0.35, 1.0); nz(ctx, out, t, 1.8, 'lowpass', 180, 260, 0.7, 0.45, 0.5, 1.2); },
  sit(ctx, out, t){ nz(ctx, out, t, 0.14, 'lowpass', 260, 160, 0.8, 0.5, 0.004, 0.12);
    const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(190, t + 0.04); o.frequency.linearRampToValueAtTime(140, t + 0.22); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t + 0.04); g.gain.linearRampToValueAtTime(0.05, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(bp); bp.connect(g); g.connect(out); o.start(t + 0.04); o.stop(t + 0.26); },
  toss(ctx, out, t){ nz(ctx, out, t, 0.45, 'bandpass', 700, 300, 1, 0.14, 0.12, 0.3); },
  land(ctx, out, t){ nz(ctx, out, t, 0.22, 'lowpass', 200, 120, 0.8, 0.9, 0.003, 0.2); nz(ctx, out, t, 0.08, 'bandpass', 1200, 900, 1.5, 0.3, 0.002, 0.07);
    for (let i = 0; i < 14; i++) bfSnd.pop(ctx, out, t + 0.05 + Math.random() * 0.6); nz(ctx, out, t + 0.05, 1.8, 'lowpass', 450, 900, 0.7, 0.5, 0.25, 1.4); },
  cheer(ctx, out, t){ nz(ctx, out, t, 0.9, 'bandpass', 900, 1400, 0.8, 0.14, 0.05, 0.8); },
};
const evSound = (name, x = BF.x, z = BF.z) => { const v = clamp01(1 - evDist(x, z) / 45); if (v > 0.02) sfx((c, t, out) => { out.gain.value = v; bfSnd[name](c, out, t); }); };

// ----- sitting: click a bench, walk round behind it, sit; any other click stands you up -----
function seatTaken(idx){
  if (VSEAT_TAKEN.has(idx)) return true;   // a villager is sat there today
  if (VILLAGER_SEATS.has(idx) && evActive() && !EV.data.casual) return true;
  for (const id in remote) if (remote[id].st === idx) return true;
  return false;
}
function benchClick(bench){
  const free = bench.seats.filter(s => !seatTaken(s.idx) && s.idx !== EV.seat).sort((a, b) => evDist(a.ax, a.az) - evDist(b.ax, b.az))[0];
  if (!free) { showToast('That bench is full.'); return; }
  if (FIGHT) { showToast("You can't sit down in the middle of a fight!"); return; }
  walkStart(new THREE.Vector3(free.ax, 0, free.az), () => {
    if (seatTaken(free.idx)) { showToast('Someone beat you to that seat.'); return; }
    EV.seat = free.idx; EV.sitT = performance.now(); walkTarget = null; walkQueue = []; evSound('sit'); writePresence(true);
  });
}
function standUp(){ if (EV.seat < 0) return; const st = BF.seats[EV.seat]; EV.seat = -1; if (hero && st) hero.position.set(st.ax, 0, st.az); writePresence(true); }
function heroSeatFrame(){
  if (EV.seat < 0 || !hero) return false;
  const st = BF.seats[EV.seat]; if (!st) { EV.seat = -1; return false; }
  const k = smooth(clamp01((performance.now() - (EV.sitT || 0)) / 450));
  sitPoseAt(hero, st, performance.now() / 1000, 3, false);
  hero.position.y = 0.3 * k; hero.userData.chibi.legs.forEach(l => l.rotation.x *= k);
  heroAnim.yaw = hero.rotation.y;
  return true;
}
function seatRemote(r){
  const st = BF.seats[r.st]; if (!st) return false;
  sitPoseAt(r.sprite, st, performance.now() / 1000, r.name.length, false);
  const v = new THREE.Vector3(st.x, 4.1, st.z).project(camera);
  r.label.style.left = ((v.x + 1) / 2 * innerWidth) + 'px'; r.label.style.top = ((-v.y + 1) / 2 * innerHeight) + 'px';
  const bv = new THREE.Vector3(st.x, 4.6, st.z).project(camera);
  r.bubbleEl.style.left = ((bv.x + 1) / 2 * innerWidth) + 'px'; r.bubbleEl.style.top = ((-bv.y + 1) / 2 * innerHeight) + 'px';
  return true;
}

// ----- feeding the fire: throw a log on, and everyone's fire flares -----
let tossLog = null;
async function bonfireClick(){
  const ph = evPhase(), f = fuelNow();
  if (ph === 'none' || (ph === 'casual' && f <= 0.02)) { lightCasualFire(); return; }
  if (f <= 0.02) { showToast('A ring of stones with cold ash in it.'); return; }
  if (ph === 'over' || ph === 'done') { showToast("The fire's burning down for the night now."); return; }
  if (!hasItem('Logs') && !hasItem('Oak logs')) { showToast('You need some logs to put on the fire. The trees by the hall will do.'); return; }
  if (f > 0.97) { showToast("The fire's roaring already. Save your logs for later."); return; }
  if (EV.seat >= 0) { showToast("You'll need to get up off the bench to reach the fire."); return; }   // no tossing logs from your seat
  const dx = hero.position.x - BF.x, dz = hero.position.z - BF.z, L = Math.hypot(dx, dz) || 1;
  walkStart(new THREE.Vector3(BF.x + dx / L * 3, 0, BF.z + dz / L * 3), async () => {
    const log = hasItem('Logs') ? 'Logs' : hasItem('Oak logs') ? 'Oak logs' : null; if (!log) return;   /* ordinary logs first; oak burns longer */
    removeItem(log);
    heroAnim.yaw = yawTo(hero.position.x, hero.position.z, BF.x, BF.z);
    tossLog = { t0: performance.now(), from: hero.position.clone().add(new THREE.Vector3(0, 1.6, 0)) };
    evSound('toss', hero.position.x, hero.position.z);
    addXp('Firemaking', log === 'Oak logs' ? 60 : 40);
    await addFuel(log === 'Oak logs' ? LOG_FUEL * 1.5 : LOG_FUEL);
    setTimeout(() => evSound('land'), 600);
    if (EV.warn > 0) { const b = npcSp('Bram'); if (b) evSay(b, "Ha! Nice one! That's more like it."); EV.warn = 0; }
  });
}
// outside the bonfire night, anyone can light the pit after dark for some light and a place to sit: no villagers, no raid
function isDark(){ const h = hourNow(); return h >= 19.3 || h < 6.2; }
function lightCasualFire(){
  if (!isDark()) { showToast("It's too bright out to need a fire. Come back after sunset."); return; }
  if (!hasItem('Logs') && !hasItem('Oak logs')) { showToast('A ring of stones with cold ash in it. You need some logs to light a fire.'); return; }
  if (EV.seat >= 0) { showToast("You'll need to get up off the bench to reach the fire."); return; }
  const dx = hero.position.x - BF.x, dz = hero.position.z - BF.z, L = Math.hypot(dx, dz) || 1;
  walkStart(new THREE.Vector3(BF.x + dx / L * 3, 0, BF.z + dz / L * 3), async () => {
    const log = hasItem('Logs') ? 'Logs' : hasItem('Oak logs') ? 'Oak logs' : null; if (!log) return;
    try { const cur = await (await fetch(`${DB}/adventure/live/event.json`)).json();   // never step on a real event, or a fire someone just lit
      if (cur && cur.start && !cur.done && Date.now() - cur.start < 75 * 60000 && (!cur.casual || fuelNow() > 0.02)) { bonfireClick(); return; } } catch (e) { return; }
    removeItem(log);
    heroAnim.yaw = yawTo(hero.position.x, hero.position.z, BF.x, BF.z);
    tossLog = { t0: performance.now(), from: hero.position.clone().add(new THREE.Vector3(0, 1.6, 0)) };
    const now = Date.now();
    try { await fetch(`${DB}/adventure/live/event.json`, { method: 'PUT', body: JSON.stringify({ start: now - 13000, casual: 1, by: ONLINE.name, fuel: { f: LOG_FUEL + 0.1, at: now, r: FUEL_RATE }, raid: { st: 'calm' } }) }); } catch (e) {}
    setTimeout(() => evSound('catch'), 500);
    addXp('Firemaking', 25); showToast('You set the log in the pit and get a fire going.  +25 Firemaking XP'); saveNow(false);
  });
}
// add to the shared fire without losing anyone else's log: read it, add, and write it back only if nobody changed it meanwhile
async function addFuel(amount){
  const url = `${DB}/adventure/live/event/fuel.json`;
  for (let tries = 0; tries < 4; tries++) {
    try {
      const r = await fetch(url, { headers: { 'X-Firebase-ETag': 'true' } }); const etag = r.headers.get('ETag'), cur = await r.json();
      if (!cur) return false;
      const now = Date.now(), have = clamp01(cur.f - Math.max(0, now - cur.at) / 1000 * (cur.r || FUEL_RATE));
      const w = await fetch(url, { method: 'PUT', headers: { 'If-Match': etag }, body: JSON.stringify({ f: Math.min(1, have + amount), at: now, r: cur.r || FUEL_RATE }) });
      if (w.ok) return true;
    } catch (e) { return false; }
  }
  return false;
}
const tossMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.9, 7), mat(0x7a5530)); tossMesh.visible = false; scene.add(tossMesh);
function updateToss(){
  if (!tossLog) return;
  const k = (performance.now() - tossLog.t0) / 600, p = tossLog.from;
  if (k >= 1) { tossMesh.visible = false; tossLog = null; return; }
  tossMesh.visible = true;
  tossMesh.position.set(p.x + (BF.x - p.x) * k, p.y + (0.6 - p.y) * k + Math.sin(k * Math.PI) * 1.4, p.z + (BF.z - p.z) * k);
  tossMesh.rotation.set(k * 5, 0.4, Math.PI / 2 + k * 2);
  if (k < 0.4 && hero) { heroAnim.mode = 'work'; }
}

// ----- the goblin raiders: drawn from the shared list the host keeps -----
function raiderRec(i){
  let m = EV.gobs[i]; if (m) return m;
  const g = makeGoblin({ skin: [0x5a8a34, 0x6a9a3a, 0x4a7a2a][i % 3] }); g.visible = false; scene.add(g);
  m = { kind: 'monster', raid: true, idx: i, t: RAIDER, name: `${RAIDER.name} (level ${RAIDER.level})`, x: 0, z: 0, s: 0.75, state: 'standing', hp: RAIDER.hp, g, tg: '' };
  g.userData.action = 'Attack'; g.userData.name = m.name; g.userData.rec = m; trees.push(g);
  m.bar = document.createElement('div'); m.bar.className = 'hpBar'; m.bar.innerHTML = '<i></i>'; m.bar.style.display = 'none'; document.body.appendChild(m.bar);
  MONSTERS.push(m); EV.gobs[i] = m; return m;
}
function updateRaiders(){
  const d = EV.data, list = (evActive() && d.gob) || [], now = performance.now();
  for (let i = 0; i < Math.max(list.length, EV.gobs.length); i++) {
    const s = list[i], m = s ? raiderRec(i) : EV.gobs[i]; if (!m) continue;
    if (s && d.raid && d.raid.st === 'over' && s.hp > 0) s.hp = 0;   // the raid is over: none are left standing
    if (!s) { m.g.visible = false; m.state = 'dead'; if (FIGHT && FIGHT.m === m) endFight(); continue; }
    if (s.hp <= 0 || s.s === 'dead') {
      if (m.state !== 'dying' && m.state !== 'dead') { m.state = 'dying'; m.dieT = now; soundAt(m.x, m.z, () => combatSound('goblinDie')); if (FIGHT && FIGHT.m === m) endFight(); }
      m.hp = 0; continue;
    }
    if (s.s === 'lurk' && EV.data.raid && (Date.now() - EV.data.raid.at) / 1000 < (s.ap || 0)) { m.g.visible = false; continue; }   // they appear out of the dark one by one
    if (m.pendingHp === undefined || now - m.pendingAt > 1500) m.hp = s.hp; else m.hp = Math.min(m.pendingHp, s.hp);
    if (m.hp <= 0) { if (m.state !== 'dying' && m.state !== 'dead') { m.state = 'dying'; m.dieT = now; } continue; }
    if (!m.g.visible) { m.g.visible = true; m.g.position.set(s.x, 0, s.z); m.state = 'standing'; }
    if (m.state === 'dying' || m.state === 'dead') { m.state = 'standing'; m.g.visible = true; }
    const ox = m.g.position.x, oz = m.g.position.z;
    const nx = ox + (s.x - ox) * 0.2, nz = oz + (s.z - oz) * 0.2, moving = Math.hypot(s.x - ox, s.z - oz) > 0.05;
    m.g.position.set(nx, 0, nz); m.x = nx; m.z = nz; m.tg = s.tg || '';
    if (!(FIGHT && FIGHT.m === m)) {
      if (moving) { turnChibi(m.g, Math.atan2(s.x - ox, s.z - oz)); poseChibi(m.g, 'walk', now / (s.s === 'rush' ? 600 : 1000)); }
      else { poseChibi(m.g, 'idle', 0); const tgt = m.tg === ONLINE.id ? hero : (remote[m.tg] && remote[m.tg].sprite); if (tgt) turnChibi(m.g, yawTo(nx, nz, tgt.position.x, tgt.position.z)); }
      m.g.userData.chibi.arms[1].children.forEach(k => { if (k.userData.isClub) k.visible = true; });
    }
    // a raider that has reached you forces the fight: you're pulled up off the bench and can't just walk past it
    if (s.s === 'rush' && m.tg === ONLINE.id && !EV.deadNow && HP.cur > 0 && (!FIGHT || FIGHT.m.state === 'dying') && Math.hypot(hero.position.x - nx, hero.position.z - nz) < 2.6) {
      if (EV.seat >= 0) standUp();
      walkTarget = null; walkQueue = []; cancelChop();
      FIGHT = { m, nextP: now + 700, nextM: now + 900, pAnim: null, mAnim: null };
      heroAnim.yaw = yawTo(hero.position.x, hero.position.z, nx, nz);
      setAct({ k: 'fight', n: m.name, t: Date.now() });
    }
  }
}
// your blow lands on a raider: shown at once here, and sent for the host to count
function raidHit(m, dmg){
  m.pendingHp = Math.max(0, (m.pendingHp !== undefined && performance.now() - m.pendingAt < 1500 ? m.pendingHp : m.hp) - dmg); m.pendingAt = performance.now(); m.hp = m.pendingHp;
  fetch(`${DB}/adventure/live/event/hits.json`, { method: 'POST', body: JSON.stringify({ g: m.idx, d: dmg, by: ONLINE.id }) }).catch(() => {});
}

// ----- dying: everything but your three most valuable things stays in a gravestone where you fell, for ten minutes -----
const GRAVE_MS = 10 * 60000;
const itemValue = n => n === 'Coins' ? 1 : (SELL[n] || (SHOP.find(s => s.name === n) || {}).price || (ITEMS[n] ? 15 : 2));
function dropOnDeath(){
  // every single item counts separately; the three worth most are kept
  const units = [];
  for (const it of bag) for (let i = 0; i < Math.min(it.qty, 200); i++) units.push({ name: it.name, v: itemValue(it.name), from: 'bag' });
  for (const k in equipped) if (equipped[k]) units.push({ name: equipped[k], v: itemValue(equipped[k]), from: k });
  units.sort((a, b) => b.v - a.v);
  const keep = units.slice(0, 3), lost = {};
  const keepBag = {}, keepEq = {};
  for (const u of keep) { if (u.from === 'bag') keepBag[u.name] = (keepBag[u.name] || 0) + 1; else keepEq[u.from] = true; }
  for (const it of bag) { const kq = Math.min(it.qty, keepBag[it.name] || 0); keepBag[it.name] = (keepBag[it.name] || 0) - kq; const lq = it.qty - kq; if (lq > 0) lost[it.name] = (lost[it.name] || 0) + lq; it.qty = kq; }
  for (let i = bag.length - 1; i >= 0; i--) if (bag[i].qty <= 0) bag.splice(i, 1);
  if (COINS > 0) { lost.Coins = COINS; COINS = 0; }
  for (const k in equipped) if (equipped[k] && !keepEq[k]) { lost[equipped[k]] = (lost[equipped[k]] || 0) + 1; equipped[k] = null; }
  dressChibi(hero, equipped); renderBag(); renderGear(); renderStats();
  const items = Object.keys(lost).map(name => ({ name, qty: lost[name] }));
  if (!items.length) return;
  const mine = GRAVES[ONLINE.id];
  if (mine && mine.until > Date.now()) for (const it of mine.items || []) { const h = items.find(x => x.name === it.name); if (h) h.qty += it.qty; else items.push({ ...it }); }   // a second death adds to the same stone
  const g = { n: ONLINE.name, x: +hero.position.x.toFixed(2), z: +hero.position.z.toFixed(2), items, until: Date.now() + GRAVE_MS };
  GRAVES[ONLINE.id] = g;
  fetch(`${DB}/adventure/live/graves/${ONLINE.id}.json`, { method: 'PUT', body: JSON.stringify(g) }).catch(() => {});
  addSystemLine(`Your things are in a gravestone where you fell. Only you can collect them, within 10 minutes.`);
}
const graveGeo = { slab: new THREE.BoxGeometry(0.9, 1.2, 0.25), base: new THREE.BoxGeometry(1.2, 0.2, 0.6) };
function setGrave(id, g){
  if (!g || !g.items) { dropGrave(id); return; }
  let o = GRAVES[id] && GRAVES[id].mesh ? GRAVES[id] : null;
  if (!o) {
    const mesh = new THREE.Group();
    const slab = new THREE.Mesh(graveGeo.slab, mat(0x8a8a90)); slab.position.y = 0.75; slab.castShadow = true; mesh.add(slab);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 12, 1, false, 0, Math.PI), mat(0x8a8a90)); top.rotation.set(Math.PI / 2, 0, Math.PI / 2); top.position.y = 1.35; mesh.add(top);
    const base = new THREE.Mesh(graveGeo.base, mat(0x6a6a70)); base.position.y = 0.1; mesh.add(base);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.04), mat(0x4a4a50)); cross.position.set(0, 0.95, 0.14); mesh.add(cross);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.04), mat(0x4a4a50)); cross2.position.set(0, 1.03, 0.14); mesh.add(cross2);
    scene.add(mesh);
    o = { mesh };
    mesh.userData.rec = { kind: 'grave', state: 'standing', onClick: () => graveClick(id) };
    trees.push(mesh);
  }
  Object.assign(o, g); GRAVES[id] = o;
  o.mesh.position.set(g.x, 0, g.z); o.mesh.visible = g.until > Date.now();
  o.mesh.userData.action = id === ONLINE.id ? 'Collect' : 'Read'; o.mesh.userData.name = `Grave of ${window.isBadName && isBadName(g.n || '') ? 'a traveller' : (g.n || 'a traveller')}`;
  o.mesh.userData.rec.x = g.x; o.mesh.userData.rec.z = g.z;
}
function dropGrave(id){ const o = GRAVES[id]; if (o && o.mesh) { scene.remove(o.mesh); const i = trees.indexOf(o.mesh); if (i >= 0) trees.splice(i, 1); } delete GRAVES[id]; }
function graveClick(id){
  const g = GRAVES[id]; if (!g) return;
  const mins = Math.max(0, Math.ceil((g.until - Date.now()) / 60000));
  if (id !== ONLINE.id) { showToast(`Here lies ${g.n || 'a traveller'}. Their things are safe in the stone for ${mins} more minute${mins === 1 ? '' : 's'}.`); return; }
  walkStart(new THREE.Vector3(g.x + 1.2, 0, g.z + 1.2), () => {
    const left = [];
    for (const it of g.items || []) { const before = countOf(it.name); addItem(it.name, it.qty, ICON_FOR[it.name] || ''); const got = countOf(it.name) - before; if (got < it.qty) left.push({ name: it.name, qty: it.qty - got }); }
    if (left.length) { g.items = left; fetch(`${DB}/adventure/live/graves/${id}.json`, { method: 'PUT', body: JSON.stringify({ n: g.n, x: g.x, z: g.z, items: left, until: g.until }) }).catch(() => {}); showToast('Your bag is full. The rest is still in the stone.'); }
    else { fetch(`${DB}/adventure/live/graves/${id}.json`, { method: 'DELETE' }).catch(() => {}); dropGrave(id); showToast('You collect your things from the gravestone.'); }
    saveNow(false);
  });
}
function updateGraves(){ const now = Date.now(); for (const id in GRAVES) { const g = GRAVES[id]; if (g.mesh) g.mesh.visible = g.until > now;
  if (g.until <= now && id === ONLINE.id) { fetch(`${DB}/adventure/live/graves/${id}.json`, { method: 'DELETE' }).catch(() => {}); dropGrave(id); addSystemLine('Your gravestone has crumbled away, and everything in it is gone.'); } } }

// ----- the host: one player's game runs the goblins, Aldric and the guards, and shares where they are -----
function onlineIds(){ const ids = [ONLINE.id]; for (const id in remote) ids.push(id); return ids; }
function amHost(){
  const d = EV.data; if (!d) return false;
  const ids = onlineIds();
  if (d.host && ids.includes(d.host)) return d.host === ONLINE.id;
  const me = ids.sort()[0] === ONLINE.id;
  if (me && d.host !== ONLINE.id) { d.host = ONLINE.id; evPatch({ host: ONLINE.id }); }
  return me;
}
function playerPos(id){ if (id === ONLINE.id) return hero ? [hero.position.x, hero.position.z] : null; const r = remote[id]; return r ? [r.tx, r.tz] : null; }
function playerOut(id){ if (id === ONLINE.id) return EV.deadNow || HP.cur <= 0; const r = remote[id]; return !r || r.rd === EV.data.start; }
const HOST = { gob: [], gd: {}, paths: {}, last: 0, ald: null };
function hostTick(){
  const d = EV.data, now = Date.now(), ph = evPhase(), t = evT();
  const dt = Math.min(0.1, (now - (HOST.last || now)) / 1000); HOST.last = now;
  if (!HOST.gob.length && d.gob) HOST.gob = d.gob.map(g => ({ ...g }));   // taking over from another host
  if (!Object.keys(HOST.gd).length && d.gd) HOST.gd = JSON.parse(JSON.stringify(d.gd));
  const write = {};
  // the backup log: if nobody feeds it, Aldric puts one on himself, once
  if (ph === 'calm' && t > 20 && fuelNow() < 0.04 && !d.backup) { write.backup = 1; write.fuel = { f: 0.3, at: now, r: FUEL_RATE }; write.say = { k: now, who: 'Aldric', text: "Fine, I'll put one on myself. Don't let it happen again!" }; }
  // the raid begins: goblins gather in the dark to the south, one per player online plus one
  if (ph === 'creep' && !(d.raid && d.raid.st === 'creep')) {
    const n = Math.max(2, Math.min(12, onlineIds().length + 1));
    HOST.gob = []; for (let i = 0; i < n; i++) { const a = (i / Math.max(1, n - 1) - 0.5) * 1.6; HOST.gob.push({ x: +(BF.x + Math.sin(a) * 22).toFixed(2), z: +(BF.z + Math.cos(a) * 22).toFixed(2), hp: RAIDER.hp, s: 'lurk', tg: '', ap: Math.round(i * 25 / n) }); }
    write.raid = { st: 'creep', at: now }; write.gob = HOST.gob;
  }
  // the rush: every goblin picks a player at the bonfire and charges
  if (ph === 'creep' && d.raid && d.raid.st === 'creep' && now - d.raid.at > 30000) {
    const part = {}; for (const id of onlineIds()) { const p = playerPos(id); if (p && Math.hypot(p[0] - BF.x, p[1] - BF.z) < BF.clearR + 8 && !playerOut(id)) part[id] = id === ONLINE.id ? ONLINE.name : remote[id].name; }
    const ids = Object.keys(part);
    HOST.gob.forEach((g, i) => { g.s = 'rush'; g.tg = ids.length ? ids[i % ids.length] : ''; });
    write.raid = { st: ids.length ? 'rush' : 'lost', at: now, part, n: HOST.gob.length }; write.gob = HOST.gob;
    if (!ids.length) HOST.gd = guardsStart();
    if (!ids.length) write.gd = HOST.gd;
  }
  const st = d.raid && d.raid.st;
  if (st === 'rush' || st === 'lost') {
    // count the blows players have landed
    for (const k in (d.hits || {})) { const h = d.hits[k]; const g = HOST.gob[h.g]; if (g && g.hp > 0) { g.hp = Math.max(0, g.hp - (h.d || 0)); if (g.hp <= 0) g.s = 'dead'; }
      delete d.hits[k]; fetch(`${DB}/adventure/live/event/hits/${k}.json`, { method: 'DELETE' }).catch(() => {}); }
    const alive = HOST.gob.filter(g => g.hp > 0);
    const part = Object.keys((d.raid && d.raid.part) || {}), standing = part.filter(id => !playerOut(id));
    for (const g of alive) {
      if (st === 'rush') {
        if (!g.tg || playerOut(g.tg)) g.tg = standing.length ? standing[Math.floor(Math.random() * standing.length)] : '';
        const p = g.tg && playerPos(g.tg);
        if (p) moveGob(g, p, dt, true);
      } else {   // the players are all down: the goblins stand about gloating until the guards arrive
        const gd = Object.values(HOST.gd).sort((a, b) => Math.hypot(a.x - g.x, a.z - g.z) - Math.hypot(b.x - g.x, b.z - g.z))[0];
        if (gd) moveGob(g, [gd.x, gd.z], dt, false);
      }
    }
    // Aldric (and, if everyone's down, the other guards) fight the nearest goblins
    if (!HOST.gd.Aldric && st === 'rush') HOST.gd.Aldric = { x: ALD_POST()[0], z: ALD_POST()[1], next: now + 2000 };
    for (const name in HOST.gd) { const gd = HOST.gd[name];
      const g = alive.sort((a, b) => Math.hypot(a.x - gd.x, a.z - gd.z) - Math.hypot(b.x - gd.x, b.z - gd.z))[0];
      if (!g) continue;
      const dd = Math.hypot(g.x - gd.x, g.z - gd.z);
      if (dd > 1.9) { const sp = (st === 'lost' ? 7 : 4.5) * dt; gd.x += (g.x - gd.x) / dd * Math.min(sp, dd - 1.8); gd.z += (g.z - gd.z) / dd * Math.min(sp, dd - 1.8); gd.f = 0; }
      else { gd.f = g.x - gd.x > 0 ? 1 : -1; gd.tg = HOST.gob.indexOf(g);
        if (now > (gd.next || 0)) { gd.next = now + (st === 'lost' ? 1600 : 2600); gd.hit = now; const dmg = st === 'lost' ? 2 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 3); g.hp = Math.max(0, g.hp - dmg); if (g.hp <= 0) g.s = 'dead'; gd.dmg = dmg; } }
      gd.x = +gd.x.toFixed(2); gd.z = +gd.z.toFixed(2); }
    if (!HOST.gob.some(g => g.hp > 0)) { write.raid = { ...d.raid, st: 'over', at: now, won: st === 'rush' ? 1 : 0 }; write.gob = HOST.gob.map(g => ({ x: +g.x.toFixed(2), z: +g.z.toFixed(2), hp: 0, s: 'dead', tg: g.tg })); }
    else if (st === 'rush' && part.length && !standing.length) { write.raid = { ...d.raid, st: 'lost', at: now }; Object.assign(HOST.gd, guardsStart()); }
    if (now - EV.lastHostWrite > 250) { EV.lastHostWrite = now; write.gob = HOST.gob.map(g => ({ x: +g.x.toFixed(2), z: +g.z.toFixed(2), hp: g.hp, s: g.s, tg: g.tg })); write.gd = HOST.gd; }
  }
  // after the raid the fire is left to burn down; when it's out, the night is over
  if (st === 'over' && d.fuel && (d.fuel.r || FUEL_RATE) < 1 / 200) write.fuel = { f: fuelNow(), at: now, r: 1 / 120 };
  if (st === 'over' && now - d.raid.at > 20000 && fuelNow() <= 0) write.done = true;
  if (Object.keys(write).length) { Object.assign(d, write); evPatch(write); }
}
function guardsStart(){ const o = {}; for (const name of ['Aldric', ...GUARDS]) { const sp = npcSp(name); if (sp) o[name] = { x: +sp.position.x.toFixed(2), z: +sp.position.z.toFixed(2), next: Date.now() + 4000 }; } return o; }
// goblins run at twice a player's walking speed while they're chasing, and stop to fight once they're close
function moveGob(g, p, dt, chase){
  const dx = p[0] - g.x, dz = p[1] - g.z, dd = Math.hypot(dx, dz); if (dd < 1.8) return;
  const sp = (chase && dd > 3 ? WALK_SPEED * 60 * 2 : 4.5) * dt;
  const key = g.tg || 'x', P = HOST.paths[HOST.gob.indexOf(g)];
  if (!P || Date.now() - P.at > 900 || Math.hypot(P.to[0] - p[0], P.to[1] - p[1]) > 2) {
    const path = dd > 4 ? findPath(new THREE.Vector3(g.x, 0, g.z), new THREE.Vector3(p[0], 0, p[1])) : [];
    HOST.paths[HOST.gob.indexOf(g)] = { at: Date.now(), to: p.slice(), pts: path.slice(1).map(q => [q.x, q.z]), i: 0 };
  }
  const Q = HOST.paths[HOST.gob.indexOf(g)];
  let tx = p[0], tz = p[1];
  while (Q.pts.length && Q.i < Q.pts.length && Math.hypot(Q.pts[Q.i][0] - g.x, Q.pts[Q.i][1] - g.z) < 0.6) Q.i++;
  if (Q.pts.length && Q.i < Q.pts.length - 2) { tx = Q.pts[Q.i][0]; tz = Q.pts[Q.i][1]; }
  const ex = tx - g.x, ez = tz - g.z, el = Math.hypot(ex, ez) || 1, step = Math.min(sp, Math.max(0, dd - 1.8));
  g.x += ex / el * step; g.z += ez / el * step;
}

