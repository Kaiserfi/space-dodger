// ITAP Adventure bonfire demo 2: the village comes to the fire.
// As soon as Aldric sets off to light it, the villagers leave whatever they were doing on a staggered schedule and
// walk the real roads to the clearing. They sit, chat with one another, warn when the fire gets low, and cheer when a log goes on.
// Paste after `frame();` (with bonfire.js pasted at the oak grove and window.BONFIRE_DEMO = true set before it).
(() => {
  const B = window.BONFIRE, { FX, FZ, state } = B;
  state.fuel = 0;
  const LEN = 54, SPEED = 4.5;   // villagers walk at 4.5 units a second

  // ---------- helpers ----------
  const clamp01 = v => Math.max(0, Math.min(1, v)), ease = v => v * v * (3 - 2 * v);
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const face = (g, x, z) => { g.rotation.y = Math.atan2(x - g.position.x, z - g.position.z); };
  function walkPath(g, pts, t0, t1, t, run){
    const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
    let d = seg(t, t0, t1) * tot, i = 0; while (i < L.length - 1 && d > L[i]) { d -= L[i]; i++; }
    const k = L[i] ? Math.min(1, d / L[i]) : 1, [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
    g.position.set(x0 + (x1 - x0) * k, 0, z0 + (z1 - z0) * k); if (L[i]) g.rotation.y = Math.atan2(x1 - x0, z1 - z0);
    poseChibi(g, 'walk', t * (run ? 1.6 : 1.1));
  }
  const pathLen = pts => pts.reduce((s, p, i) => i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
  // a real route along the village's walkable ground, from the pathfinder the player uses
  const route = (from, to) => { const p = findPath(new THREE.Vector3(from[0], 0, from[1]), new THREE.Vector3(to[0], 0, to[1])).map(q => [q.x, q.z]); if (p.length < 2) return [from, to];
    const out = [p[0]]; for (let i = 1; i < p.length - 1; i += 4) out.push(p[i]); out.push(to); return out; };
  // seats: two on each log, side by side
  const seatOf = (a, side) => { const tx = -Math.sin(a), tz = Math.cos(a); return { x: FX + Math.cos(a) * 3.55 + tx * side * 0.55, z: FZ + Math.sin(a) * 3.55 + tz * side * 0.55 }; };
  function sitPose(g, s, t, seed, child){
    g.position.set(s.x, 0.3, s.z); face(g, FX, FZ); poseChibi(g, 'idle', t);
    const c = g.userData.chibi, [AL, AR] = c.arms;
    c.legs.forEach((l, i) => l.rotation.x = -1.45 + (child ? Math.sin(t * 4 + i * Math.PI) * 0.25 : 0));
    c.body.position.y = 0.02 + Math.sin(t * 1.6 + seed) * 0.01; c.body.rotation.x = 0.08; c.body.rotation.z = Math.sin(t * 0.8 + seed) * 0.03;
    const cold = 1 - state.fuel, rub = Math.sin(t * (3 + cold * 6) + seed) * (0.08 + cold * 0.08);   // a dying fire: they huddle and rub their hands faster
    AL.rotation.set(-1.15, 0, -0.1 - rub); AR.rotation.set(-1.15, 0, 0.1 + rub);
    c.body.rotation.x = 0.08 + cold * 0.15;
    c.head.rotation.y = Math.sin(t * 0.35 + seed * 2) * 0.45;
  }
  function sitDown(g, s, t, t0){ const k = ease(seg(t, t0, t0 + 0.5)); g.position.set(s.x, 0.3 * k, s.z); face(g, FX, FZ); poseChibi(g, 'idle', t);
    const c = g.userData.chibi; c.legs.forEach(l => l.rotation.x = -1.45 * k); c.body.rotation.x = 0.25 * Math.sin(k * Math.PI); }

  // ---------- the cast: real villagers, taken off their usual rounds ----------
  nextBark = Infinity; hero.visible = false;
  const npc = name => { const b = BARKERS.find(b => b.rec.name === name); const i = WANDER.findIndex(w => w.sp === b.sp); if (i >= 0) WANDER.splice(i, 1); return b.sp; };
  const ald = npc('Aldric');
  const KNEEL = [FX + 1.95, FZ - 0.2], POST = [FX - 2.6, FZ - 5.8];
  // who comes, when they set off after Aldric does, and which seat they take; a few seats are always left for players
  const GUESTS = [
    { name: 'Lyra',    leave: 1.5, seat: seatOf(0, -1),   hi: "Ooh, the bonfire's being lit! Wait for me!" },
    { name: 'Fenwick', leave: 3.0, seat: seatOf(3.6, 1),  hi: "That'll be the bonfire. I've got a story for tonight." },
    { name: 'Bram',    leave: 4.5, seat: seatOf(2.4, -1), hi: "Come on, love, the fire's lit. Leave the hens for once." },
    { name: 'Hilde',   leave: 5.0, seat: seatOf(2.4, 1),  hi: "Coming! Pip, you're coming too!" },
    { name: 'Pip',     leave: 7.0, seat: seatOf(1.2, 1),  hi: "BONFIRE! BONFIRE! BONFIRE!", run: true, child: true },
  ];
  for (const g of GUESTS) {
    g.sp = npc(g.name); g.from = [g.sp.position.x, g.sp.position.z];
    g.path = route(g.from, [g.seat.x + (g.seat.x - FX) * 0.35, g.seat.z + (g.seat.z - FZ) * 0.35]); g.path.push([g.seat.x, g.seat.z]);
    g.arrive = g.leave + pathLen(g.path) / (g.run ? SPEED * 1.6 : SPEED);
  }
  const pip = GUESTS.find(g => g.name === 'Pip');
  pip.lapUntil = Math.max(pip.arrive + 2, 35.2);   // Pip runs round the fire until he's told to sit
  const you = makeChibi({ ...look }); scene.add(you);
  const S_YOU = seatOf(1.2, -1), YOU_ARRIVE = 24;
  const youPath = [[-1, 15.5], [-0.6, 22], [-5, 29], [-4, 36], [S_YOU.x - 1, S_YOU.z + 1.2], [S_YOU.x, S_YOU.z]];

  // ---------- the conversation, the warnings, and the cheer ----------
  const LINES = [
    [11, 'Aldric', "There we are. Fire's lit, come and warm yourselves!"],
    [28, 'Fenwick', "Did I ever tell you lot about the fish as big as a horse?"],
    [30.6, 'Bram', "Only every night, Fenwick. Every single night."],
    [33.2, 'Lyra', "I'm putting it in a song, actually."],
    [34.6, 'Hilde', "Pip! Come and sit down before you fall in!"],
    [36.4, 'Fenwick', "See? Lyra believes me."],
    [39.2, 'Hilde', "Fire's getting a bit low, isn't it?"],
    [42.0, 'Aldric', "Could someone fetch a log or two? The trees by the hall will do."],
    [47.0, 'Bram', "Ha! Nice one! That's more like it."],
    [49.6, 'Lyra', "Now that's a proper fire. Right, who wants a song?"],
  ];
  const bubs = {};
  const bv = new THREE.Vector3();
  function bubble(name, g, text, show){
    let el = bubs[name]; if (!el) { el = bubs[name] = document.createElement('div'); el.className = 'npcBub'; document.body.appendChild(el); }
    el.style.display = show ? '' : 'none'; if (!show) return; el.textContent = text;
    g.getWorldPosition(bv); bv.y += 4.4 * g.scale.x / CHIBI_SCALE; bv.project(camera);
    el.style.left = ((bv.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - bv.y) / 2 * innerHeight) + 'px';
  }
  const who = name => name === 'Aldric' ? ald : GUESTS.find(g => g.name === name).sp;

  // ---------- the log ----------
  const logMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.9, 7), mat(0x7a5530)); logMesh.castShadow = true;
  logMesh.rotation.z = Math.PI / 2; logMesh.visible = false; you.userData.chibi.arms[1].add(logMesh); logMesh.position.set(0, -0.5, 0.12);
  let flying = null;
  const fl = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(30), 3)), new THREE.PointsMaterial({ color: 0xfff0a0, size: 0.12, transparent: true }));
  fl.visible = false; scene.add(fl);

  // the fire: catches at 8, full by 13, burns down while they talk, nearly embers by 44, roars back when the log lands at 46
  const fuelAt = t => t < 8 ? 0 : t < 13 ? 0.15 + 0.7 * ease(seg(t, 8, 13)) : t < 46 ? 0.85 - 0.6 * seg(t, 13, 44) : Math.min(1, 0.25 + 0.75 * ease(seg(t, 46, 46.7)) + 0.12 * Math.exp(-(t - 46) * 2));
  const THROW = 45.4;   // the moment the log leaves the hand

  const flash = document.createElement('div'); flash.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99999'; document.body.appendChild(flash);   // a sync mark for lining up the recorded sound
  const t0 = performance.now();
  window.DEMO = { start: Date.now(), LEN, done: false };
  (function tick(){
    const t = (performance.now() - t0) / 1000;
    if (flash.isConnected && t > 0.25) flash.remove();

    // the camera: with Aldric as he sets off, then pulled right back over the village to watch everyone converge, then in to the fire
    const wide = ease(seg(t, 4, 7)) * (1 - ease(seg(t, 20, 23)));
    const close = ease(seg(t, 23, 25)), thr = ease(seg(t, 43.5, 44.5)) * (1 - ease(seg(t, 48, 49)));
    const ap = ald.position;
    let cx = ap.x, cz = ap.z;
    cx += (-8 - cx) * wide; cz += (16 - cz) * wide;
    cx += (FX - cx) * close; cz += (FZ - cz) * close;
    cx += (you.position.x - cx) * thr * 0.4; cz += (you.position.z - cz) * thr * 0.4;
    window.__c = [cx, 1, cz];
    yaw = 2.75 + t * 0.008; pitch = 1.12 - 0.55 * wide; dist = 12.5 + 48 * wide - 2.5 * thr;

    // Aldric: walks out, kneels, strikes the flint three times, the fire catches, he steps aside to stand guard
    if (t < 6) walkPath(ald, [[9, 15.5], [2, 15], [-0.5, 21], [FX + 2.4, FZ - 2.6], KNEEL], 0, 6, t);
    else if (t < 10) {
      ald.position.set(KNEEL[0], 0, KNEEL[1]); face(ald, FX, FZ); poseChibi(ald, 'idle', t);
      const c = ald.userData.chibi, [L, R] = c.legs, [AL, AR] = c.arms;
      const down = t < 9.4 ? ease(seg(t, 6, 6.6)) : 1 - ease(seg(t, 9.4, 10));
      c.body.position.y = -0.38 * down; L.rotation.x = -1.5 * down; R.rotation.x = 0.9 * down; c.body.rotation.x = 0.3 * down;
      const ph = (t - 6.8) % 0.6, striking = t > 6.6 && t < 8.3, hit = striking ? Math.exp(-Math.max(0, ph) * 18) : 0;
      AL.rotation.set(-1.1 * down, 0, -0.1); AR.rotation.set((-1.4 + 0.5 * (striking ? Math.sin(ph / 0.6 * Math.PI * 2) * 0.5 + hit : 0)) * down, 0, 0.15);
      fl.visible = striking && ph < 0.18;
      if (fl.visible) { const a = fl.geometry.attributes.position; for (let i = 0; i < 10; i++) a.setXYZ(i, FX + 0.6 + (Math.random() - 0.5) * ph * 4, 0.4 + Math.random() * ph * 2.4, FZ + (Math.random() - 0.5) * 0.6); a.needsUpdate = true; }
    } else if (t < 11.2) walkPath(ald, [KNEEL, [FX + 1.5, FZ - 4], POST], 10, 11.2, t);
    else { ald.position.set(POST[0], 0, POST[1]); face(ald, FX, FZ); poseChibi(ald, 'idle', t); }

    state.fuel = fuelAt(t);

    // the villagers: idle where they were until their time to leave, then walk over, sit, and settle in
    for (const g of GUESTS) {
      const seed = g.name.length;
      if (t < g.leave) poseChibi(g.sp, 'idle', t);
      else if (t < g.arrive) walkPath(g.sp, g.path, g.leave, g.arrive, t, g.run);
      else if (g === pip && t < pip.lapUntil) {   // round and round the fire
        const a = (t - pip.arrive) * 1.3; pip.sp.position.set(FX + Math.cos(a) * 5.2, 0, FZ + Math.sin(a) * 5.2); pip.sp.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)); poseChibi(pip.sp, 'walk', t * 1.6);
      } else if (g === pip && t < pip.lapUntil + 1.2) walkPath(pip.sp, [[pip.sp.position.x, pip.sp.position.z], [g.seat.x, g.seat.z]], pip.lapUntil, pip.lapUntil + 1.2, t, true);
      else { const sitAt = g === pip ? pip.lapUntil + 1.2 : g.arrive; if (t < sitAt + 0.5) sitDown(g.sp, g.seat, t, sitAt); else sitPose(g.sp, g.seat, t, seed, g.child); }
      bubble(g.name + 'hi', g.sp, g.hi, t > g.leave && t < g.leave + 3);
    }

    // the player: arrives last, sits, gets up for a log when Aldric asks, throws it in, sits back down
    if (t < YOU_ARRIVE - 5.5) you.visible = false;
    else if (t < YOU_ARRIVE) { you.visible = true; walkPath(you, youPath, YOU_ARRIVE - 5.5, YOU_ARRIVE, t); }
    else if (t < YOU_ARRIVE + 0.5) sitDown(you, S_YOU, t, YOU_ARRIVE);
    else if (t < 43.6) sitPose(you, S_YOU, t, 3);
    else if (t < 47.3) {
      const st = { x: S_YOU.x + (FX - S_YOU.x) * 0.28, z: S_YOU.z + (FZ - S_YOU.z) * 0.28 };
      const k = ease(seg(t, 43.6, 44.2)), back = t > 46.3 ? ease(seg(t, 46.3, 46.8)) : 0;
      you.position.set(S_YOU.x + (st.x - S_YOU.x) * (k - back), 0, S_YOU.z + (st.z - S_YOU.z) * (k - back)); face(you, FX, FZ);
      poseChibi(you, t < 44.2 || t > 46.3 ? 'walk' : 'idle', t);
      const c = you.userData.chibi, AR = c.arms[1];
      logMesh.visible = t > 43.7 && t < THROW;
      if (t > 44.4 && t < THROW + 0.2) {   // an underarm toss: swing back, then forward and up, letting go at the top
        const w = seg(t, 44.4, 45.05), f = seg(t, 45.05, THROW);
        AR.rotation.x = w < 1 ? 1.0 * ease(w) : 1.0 - 2.9 * ease(f);
        c.body.rotation.x = w < 1 ? -0.15 * ease(w) : -0.15 + 0.35 * ease(f);
        c.legs[0].rotation.x = -0.4 * (w < 1 ? ease(w) : 1); c.legs[1].rotation.x = 0.25 * (w < 1 ? ease(w) : 1);
      }
      if (t >= THROW && !flying) { const p = new THREE.Vector3(); logMesh.getWorldPosition(p); flying = { p }; logMesh.removeFromParent(); scene.add(logMesh); logMesh.visible = true; }
      if (t > 46.8) { const k2 = ease(seg(t, 46.8, 47.3)); you.position.y = 0.3 * k2; c.legs.forEach(l => l.rotation.x = -1.45 * k2); }
    } else sitPose(you, S_YOU, t, 3);
    if (flying) {
      const k = seg(t, THROW, THROW + 0.6), p = flying.p;
      logMesh.position.set(p.x + (FX - p.x) * k, p.y + (0.55 - p.y) * k + Math.sin(k * Math.PI) * 1.4, p.z + (FZ - p.z) * k);
      logMesh.rotation.set(k * 5, 0.4, Math.PI / 2 + k * 2);
      if (k >= 1) { logMesh.rotation.set(0, 0.4, 1.35); logMesh.material.color.setHex(t < 49 ? 0x7a5530 : 0x3a2414); }
    }

    // speech: each line shows for 2.6 seconds over whoever says it
    for (const [at, name, text] of LINES) bubble(name + at, who(name), text, t > at && t < at + 2.6);

    if (t > LEN) { window.DEMO.done = true; return; }
    requestAnimationFrame(tick);
  })();

  // ---------- sounds, on the same timeline ----------
  const SND = {
    step(ctx, out, t, v = 1){ nz(ctx, out, t, 0.09, 'lowpass', 500, 300, 0.7, 0.22 * v, 0.004, 0.07); nz(ctx, out, t + 0.01, 0.06, 'bandpass', 1800, 1400, 1.2, 0.05 * v, 0.003, 0.05); },
    flint(ctx, out, t){ ring(ctx, out, t, [[3900, 1, 1], [5700, 0.6, 1.6], [2500, 0.35, 1.2]], 0.22, 0.16); nz(ctx, out, t, 0.05, 'highpass', 5000, 5000, 0.7, 0.5, 0.001, 0.04); nz(ctx, out, t + 0.02, 0.35, 'bandpass', 7000, 6000, 2, 0.08, 0.01, 0.3); },
    catch(ctx, out, t){ nz(ctx, out, t, 1.4, 'bandpass', 250, 1300, 0.8, 0.55, 0.35, 1.0); nz(ctx, out, t, 1.8, 'lowpass', 180, 260, 0.7, 0.45, 0.5, 1.2); },
    sit(ctx, out, t){ nz(ctx, out, t, 0.14, 'lowpass', 260, 160, 0.8, 0.5, 0.004, 0.12);
      const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(190, t + 0.04); o.frequency.linearRampToValueAtTime(140, t + 0.22); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 4;
      g.gain.setValueAtTime(0.0001, t + 0.04); g.gain.linearRampToValueAtTime(0.05, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(t + 0.04); o.stop(t + 0.26); },
    toss(ctx, out, t){ nz(ctx, out, t, 0.45, 'bandpass', 700, 300, 1, 0.14, 0.12, 0.3); },
    land(ctx, out, t){ nz(ctx, out, t, 0.22, 'lowpass', 200, 120, 0.8, 0.9, 0.003, 0.2); nz(ctx, out, t, 0.08, 'bandpass', 1200, 900, 1.5, 0.3, 0.002, 0.07);
      for (let i = 0; i < 14; i++) SND.pop(ctx, out, t + 0.05 + Math.random() * 0.6, 0.9); nz(ctx, out, t + 0.05, 1.8, 'lowpass', 450, 900, 0.7, 0.5, 0.25, 1.4); },
    pop(ctx, out, t, v = 1){ nz(ctx, out, t, 0.03, 'bandpass', 1500 + Math.random() * 2800, 1200, 2.5, (0.25 + Math.random() * 0.5) * v, 0.001, 0.025);
      if (Math.random() < 0.15) nz(ctx, out, t, 0.08, 'lowpass', 300, 200, 0.7, 0.3 * v, 0.002, 0.07); },
    fireBed(ctx, out, t0, t1, fuelAt){
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, 2); src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; const g = ctx.createGain(); g.gain.value = 0;
      src.connect(lp); lp.connect(g); g.connect(out); src.start(t0); src.stop(t1);
      for (let s = t0; s < t1; s += 0.1) { const f = fuelAt(s); g.gain.linearRampToValueAtTime(0.16 * f, s); lp.frequency.linearRampToValueAtTime(300 + 400 * f, s); }
      let s = t0; while (s < t1) { const f = fuelAt(s); s += 0.04 + Math.random() * 0.4 / (0.2 + f); SND.pop(ctx, out, s, f); } },
    crickets(ctx, out, t0, t1){
      for (const [hz, pan] of [[4300, -0.6], [4700, 0.5]]) { let s = t0 + Math.random(); const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(out);
        while (s < t1) { for (let k = 0; k < 3; k++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz; const a = s + k * 0.065;
          g.gain.setValueAtTime(0.0001, a); g.gain.linearRampToValueAtTime(0.025, a + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a + 0.045); o.connect(g); g.connect(p); o.start(a); o.stop(a + 0.05); }
          s += 0.7 + Math.random() * 0.9; } } },
    // a soft murmur under each line of speech, so a bubble has a voice without words: a few vowel-ish hums at the speaker's pitch
    murmur(ctx, out, t, base){ for (let i = 0; i < 5; i++) { const a = t + i * 0.16 + Math.random() * 0.05, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.25), a); o.frequency.linearRampToValueAtTime(base * (0.85 + Math.random() * 0.2), a + 0.13);
      f.type = 'bandpass'; f.frequency.value = 500 + Math.random() * 900; f.Q.value = 3;
      g.gain.setValueAtTime(0.0001, a); g.gain.linearRampToValueAtTime(0.05, a + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, a + 0.14);
      o.connect(f); f.connect(g); g.connect(out); o.start(a); o.stop(a + 0.16); } },
    cheer(ctx, out, t){ nz(ctx, out, t, 0.9, 'bandpass', 900, 1400, 0.8, 0.12, 0.05, 0.8); SND.murmur(ctx, out, t, 180); SND.murmur(ctx, out, t + 0.1, 260); },
    // Lyra's lute: plucked notes of a simple tune
    lute(ctx, out, t0){ const tune = [0, 4, 7, 12, 7, 4, 5, 9, 12, 9, 5, 4, 2, 7, 11, 7, 0];
      tune.forEach((n, i) => { const a = t0 + i * 0.32, f = 262 * Math.pow(2, n / 12), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
        o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2; lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, a); lp.frequency.exponentialRampToValueAtTime(600, a + 0.5);
        g.gain.setValueAtTime(0.0001, a); g.gain.linearRampToValueAtTime(0.09, a + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, a + 0.9);
        o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(out); o.start(a); o2.start(a); o.stop(a + 1); o2.stop(a + 1); }); }
  };
  const VOICE = { Aldric: 120, Fenwick: 105, Bram: 115, Hilde: 210, Lyra: 240, Pip: 300 };
  window.demoSoundtrack = (ctx, out, T) => {
    const F = s => fuelAt(s);
    SND.crickets(ctx, out, T, T + LEN);
    for (let s = 0.15; s < 6; s += 0.36) SND.step(ctx, out, T + s, 1);
    for (const s of [6.8, 7.4, 8.0]) SND.flint(ctx, out, T + s);
    SND.catch(ctx, out, T + 8.0);
    for (let s = 10.1; s < 11.2; s += 0.36) SND.step(ctx, out, T + s, 0.8);
    for (const g of GUESTS) { const sitAt = g === pip ? pip.lapUntil + 1.2 : g.arrive; SND.sit(ctx, out, T + sitAt); SND.murmur(ctx, out, T + g.leave, VOICE[g.name]);
      for (let s = Math.max(g.leave, g.arrive - 3); s < g.arrive; s += g.run ? 0.25 : 0.38) SND.step(ctx, out, T + s, 0.45); }   // footsteps as they reach the clearing
    for (let s = YOU_ARRIVE - 3; s < YOU_ARRIVE; s += 0.38) SND.step(ctx, out, T + s, 0.6);
    SND.sit(ctx, out, T + YOU_ARRIVE);
    for (const [at, name] of LINES) SND.murmur(ctx, out, T + at, VOICE[name]);
    SND.toss(ctx, out, T + THROW - 0.2); SND.land(ctx, out, T + THROW + 0.6); SND.cheer(ctx, out, T + 46.9); SND.sit(ctx, out, T + 47.3);
    SND.lute(ctx, out, T + 50.5);
    const fb = ctx.createGain(); fb.connect(out); SND.fireBed(ctx, fb, T + 8.0, T + LEN, s => F(s - T));
  };
})();
