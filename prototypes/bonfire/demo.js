// ITAP Adventure bonfire demo: a scripted scene to show the animations and sounds before they go in the game.
// Aldric walks out at dusk and lights the fire, the family sits down round it, and the player throws on a log.
// Paste after `frame();` (with bonfire.js already pasted at the oak grove and window.BONFIRE_DEMO = true set before it).
// The same timeline drives the pictures and the sound, so the sound can be rendered offline and laid under a recording.
(() => {
  const B = window.BONFIRE, { FX, FZ, state } = B;
  state.fuel = 0;
  const LEN = 33;

  // ---------- the cast ----------
  const ald = BARKERS.find(b => b.rec.name === 'Aldric').sp;
  const wi = WANDER.findIndex(w => w.sp === ald); if (wi >= 0) WANDER.splice(wi, 1);   // he follows the script, not his patrol
  nextBark = Infinity;
  hero.visible = false;
  const you = makeChibi({ ...look }); scene.add(you);
  const mum = makeChibi({ gender: 'female', skin: 0xf0c8a0, hair: 'long', hairCol: 0x7a4a22, shirt: 0x7a3a6a, pants: 0x3a2a3a }); scene.add(mum);
  const kid = makeChibi({ gender: 'female', skin: 0xe8c39c, hair: 'topknot', hairCol: 0x3a2a1a, shirt: 0xd8a040, pants: 0x4a6aa0 }); kid.scale.multiplyScalar(0.78); scene.add(kid);
  const seat = a => ({ x: FX + Math.cos(a) * 3.55, z: FZ + Math.sin(a) * 3.55, a });
  const S_YOU = seat(1.2), S_MUM = seat(0), S_KID = seat(2.4);

  // ---------- small helpers ----------
  const clamp01 = v => Math.max(0, Math.min(1, v)), ease = v => v * v * (3 - 2 * v);
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const face = (g, x, z) => { g.rotation.y = Math.atan2(x - g.position.x, z - g.position.z); };
  // walk along a list of points between two times
  function walkPath(g, pts, t0, t1, t){
    const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
    let d = seg(t, t0, t1) * tot, i = 0; while (i < L.length - 1 && d > L[i]) { d -= L[i]; i++; }
    const k = L[i] ? Math.min(1, d / L[i]) : 1, [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
    g.position.set(x0 + (x1 - x0) * k, 0, z0 + (z1 - z0) * k); g.rotation.y = Math.atan2(x1 - x0, z1 - z0);
    poseChibi(g, 'walk', t * 1.1);
  }
  // seated by the fire: legs bent over the log, hands held out to the warmth, a slow sway, now and then a look round
  function sitPose(g, s, t, seed, child){
    g.position.set(s.x, 0.3, s.z); face(g, FX, FZ);
    poseChibi(g, 'idle', t);
    const c = g.userData.chibi, [AL, AR] = c.arms;
    c.legs.forEach((l, i) => l.rotation.x = -1.45 + (child ? Math.sin(t * 4 + i * Math.PI) * 0.25 : 0));   // children swing their legs
    c.body.position.y = 0.02 + Math.sin(t * 1.6 + seed) * 0.01;   // breathing
    c.body.rotation.x = 0.08; c.body.rotation.z = Math.sin(t * 0.8 + seed) * 0.03;
    const rub = Math.sin(t * 3 + seed) * 0.08;   // warming the hands, rubbing them now and then
    AL.rotation.set(-1.15, 0, -0.1 - rub); AR.rotation.set(-1.15, 0, 0.1 + rub);
    c.head.rotation.y = Math.sin(t * 0.35 + seed * 2) * 0.45;   // looking round at the others
  }
  function sitDown(g, s, t, t0, seed, child){   // lowering onto the bench, half a second
    const k = ease(seg(t, t0, t0 + 0.5));
    g.position.set(s.x, 0.3 * k, s.z); face(g, FX, FZ); poseChibi(g, 'idle', t);
    const c = g.userData.chibi; c.legs.forEach(l => l.rotation.x = -1.45 * k); c.body.rotation.x = 0.25 * Math.sin(k * Math.PI);
  }

  // ---------- the log the player throws ----------
  const logMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.9, 7), mat(0x7a5530)); logMesh.castShadow = true;
  logMesh.rotation.z = Math.PI / 2; logMesh.visible = false; you.userData.chibi.arms[1].add(logMesh); logMesh.position.set(0, -0.5, 0.12);
  let flying = null;

  // ---------- flint sparks ----------
  const fl = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(30), 3)), new THREE.PointsMaterial({ color: 0xfff0a0, size: 0.12, transparent: true }));
  fl.visible = false; scene.add(fl);

  // ---------- speech ----------
  const bub = document.createElement('div'); bub.className = 'npcBub'; bub.style.display = 'none'; document.body.appendChild(bub);
  const bv = new THREE.Vector3();
  function say(g, text, show){ bub.style.display = show ? '' : 'none'; if (!show) return; bub.textContent = text;
    g.getWorldPosition(bv); bv.y += 4.4 * g.scale.x / CHIBI_SCALE; bv.project(camera);
    bub.style.left = ((bv.x + 1) / 2 * innerWidth) + 'px'; bub.style.top = ((1 - bv.y) / 2 * innerHeight) + 'px'; }

  // ---------- the script ----------
  const KNEEL = [FX + 1.95, FZ - 0.2], POST = [FX - 2.6, FZ - 5.8];   // he kneels side-on to the camera, then steps off to the side
  const flash = document.createElement('div'); flash.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99999'; document.body.appendChild(flash);   // a sync mark for lining up the recorded sound
  const t0 = performance.now();
  window.DEMO = { start: Date.now(), LEN, done: false };
  (function tick(){
    const t = (performance.now() - t0) / 1000;
    if (flash.isConnected && t > 0.25) flash.remove();
    // the camera circles slowly round the clearing
    // the camera follows Aldric out, then settles on the fire and drifts slowly round it, coming in close for the throw
    const ap = ald.position, fol = 1 - ease(seg(t, 9, 11.5)), thr = ease(seg(t, 22, 23)) * (1 - ease(seg(t, 26.5, 27.5)));
    const cx = ap.x * fol + FX * (1 - fol), cz = ap.z * fol + FZ * (1 - fol);
    window.__c = [cx + (you.position.x - cx) * thr * 0.45, 1, cz + (you.position.z - cz) * thr * 0.45];
    yaw = 2.75 + t * 0.012; pitch = 1.12; dist = 12.5 - 2.5 * thr;

    // Aldric: walks out from his post, kneels, strikes a flint three times, the fire catches, he stands and calls out
    if (t < 6) walkPath(ald, [[9, 15.5], [2, 15], [-0.5, 21], [FX + 2.4, FZ - 2.6], KNEEL], 0, 6, t);
    else if (t < 10) {
      ald.position.set(KNEEL[0], 0, KNEEL[1]); face(ald, FX, FZ); poseChibi(ald, 'idle', t);
      const c = ald.userData.chibi, [L, R] = c.legs, [AL, AR] = c.arms;
      const down = t < 9.4 ? ease(seg(t, 6, 6.6)) : 1 - ease(seg(t, 9.4, 10));
      c.body.position.y = -0.38 * down; L.rotation.x = -1.5 * down; R.rotation.x = 0.9 * down; c.body.rotation.x = 0.3 * down;
      // the strikes at 6.8, 7.4 and 8.0: flint in one hand, steel in the other, brought together sharply
      const ph = (t - 6.8) % 0.6, striking = t > 6.6 && t < 8.3;
      const hit = striking ? Math.exp(-Math.max(0, ph) * 18) : 0;
      AL.rotation.set(-1.1 * down, 0, -0.1); AR.rotation.set((-1.4 + 0.5 * (striking ? Math.sin(ph / 0.6 * Math.PI * 2) * 0.5 + hit : 0)) * down, 0, 0.15);
      fl.visible = striking && ph < 0.18;
      if (fl.visible) { const a = fl.geometry.attributes.position; for (let i = 0; i < 10; i++) a.setXYZ(i, FX + (Math.random() - 0.5) * 0.7 * ph * 6, 0.4 + Math.random() * 0.4 * ph * 6, FZ - 0.6 + (Math.random() - 0.5) * 0.6); a.needsUpdate = true; }
    } else if (t < 11.2) walkPath(ald, [KNEEL, [FX + 1.5, FZ - 4], POST], 10, 11.2, t);
    else { ald.position.set(POST[0], 0, POST[1]); face(ald, FX, FZ); poseChibi(ald, 'idle', t); }
    say(ald, "There we are. Fire's lit, come and warm yourselves!", t > 11 && t < 14.5);

    // the fire: catches at 8.0, grows, burns down a little while everyone sits, flares when the log lands at 25.0
    state.fuel = t < 8 ? 0 : t < 13 ? 0.15 + 0.7 * ease(seg(t, 8, 13)) : t < 25 ? 0.85 - 0.3 * seg(t, 13, 25) : Math.min(1, 0.55 + 0.45 * ease(seg(t, 25, 25.6)) + 0.12 * Math.exp(-(t - 25) * 2));

    // the family arrives and sits down: mum at 15.0, the little one at 16.2
    if (t < 11) mum.visible = kid.visible = false; else mum.visible = kid.visible = true;
    if (t < 14.5) walkPath(mum, [[12, 22], [8, 26], [S_MUM.x + 1, S_MUM.z - 1.5], [S_MUM.x, S_MUM.z]], 11, 14.5, t);
    else if (t < 15) sitDown(mum, S_MUM, t, 14.5, 1); else sitPose(mum, S_MUM, t, 1);
    if (t < 15.7) walkPath(kid, [[-12, 24], [-7, 30], [S_KID.x - 1, S_KID.z + 1.2], [S_KID.x, S_KID.z]], 11.2, 15.7, t);
    else if (t < 16.2) sitDown(kid, S_KID, t, 15.7, 2, true); else sitPose(kid, S_KID, t, 2, true);

    // the player: walks in, sits at 16.8, gets up at 22.8 with a log, throws it at 24.4, sits back down at 26.3
    if (t < 16.3) walkPath(you, [[-1, 16], [-0.6, 22], [-5, 29], [-4, 36], [S_YOU.x - 1, S_YOU.z + 1.2], [S_YOU.x, S_YOU.z]], 10.6, 16.3, t);
    else if (t < 16.8) sitDown(you, S_YOU, t, 16.3, 3);
    else if (t < 22.8) sitPose(you, S_YOU, t, 3);
    else if (t < 26.3) {
      const st = { x: S_YOU.x + (FX - S_YOU.x) * 0.28, z: S_YOU.z + (FZ - S_YOU.z) * 0.28 };   // a step towards the fire
      const k = ease(seg(t, 22.8, 23.4)), back = t > 25.3 ? ease(seg(t, 25.3, 25.8)) : 0;
      you.position.set(S_YOU.x + (st.x - S_YOU.x) * (k - back), 0.3 * (1 - k + back) * (t < 23.4 || t > 25.8 ? 1 : 0), S_YOU.z + (st.z - S_YOU.z) * (k - back)); face(you, FX, FZ);
      poseChibi(you, t < 23.4 || t > 25.3 ? 'walk' : 'idle', t);
      const c = you.userData.chibi, AR = c.arms[1];
      logMesh.visible = t > 22.9 && t < 24.4;
      if (t > 23.5 && t < 24.6) {   // an underarm toss: swing back, then forward and up, letting go at the top
        const w = seg(t, 23.5, 24.1), f = seg(t, 24.1, 24.45);
        AR.rotation.x = w < 1 ? 0.9 * ease(w) : 0.9 - 2.6 * ease(f);
        c.body.rotation.x = w < 1 ? -0.12 * ease(w) : -0.12 + 0.3 * ease(f);
        c.legs[0].rotation.x = -0.35 * (w < 1 ? ease(w) : 1); c.legs[1].rotation.x = 0.2 * (w < 1 ? ease(w) : 1);
      }
      if (t >= 24.4 && !flying) { const p = new THREE.Vector3(); logMesh.getWorldPosition(p); flying = { p }; logMesh.removeFromParent(); scene.add(logMesh); logMesh.visible = true; }
      if (t > 25.8) { const k2 = ease(seg(t, 25.8, 26.3)); you.position.y = 0.3 * k2; c.legs.forEach(l => l.rotation.x = -1.45 * k2); }
    } else sitPose(you, S_YOU, t, 3);
    if (flying) {   // the log arcs into the fire and settles in it
      const k = seg(t, 24.4, 25.0), p = flying.p;
      logMesh.position.set(p.x + (FX - p.x) * k, p.y + (0.55 - p.y) * k + Math.sin(k * Math.PI) * 1.4, p.z + (FZ - p.z) * k);
      logMesh.rotation.set(k * 5, 0.4, Math.PI / 2 + k * 2);
      if (k >= 1) { logMesh.rotation.set(0, 0.4, 1.35); logMesh.material.color.setHex(t < 27 ? 0x7a5530 : 0x3a2414); }
    }
    if (t > LEN) { window.DEMO.done = true; return; }
    requestAnimationFrame(tick);
  })();

  // ---------- the sounds, on the same timeline ----------
  // Every function takes (ctx, out, t) so it plays live in the game or renders offline for the recording.
  const SND = {
    step(ctx, out, t, v = 1){ nz(ctx, out, t, 0.09, 'lowpass', 500, 300, 0.7, 0.22 * v, 0.004, 0.07); nz(ctx, out, t + 0.01, 0.06, 'bandpass', 1800, 1400, 1.2, 0.05 * v, 0.003, 0.05); },
    flint(ctx, out, t){   // a bright tick of steel on flint, with a fizz of sparks
      ring(ctx, out, t, [[3900, 1, 1], [5700, 0.6, 1.6], [2500, 0.35, 1.2]], 0.22, 0.16);
      nz(ctx, out, t, 0.05, 'highpass', 5000, 5000, 0.7, 0.5, 0.001, 0.04);
      nz(ctx, out, t + 0.02, 0.35, 'bandpass', 7000, 6000, 2, 0.08, 0.01, 0.3); },
    catch(ctx, out, t){   // the kindling catching: a soft rising fwoomp
      nz(ctx, out, t, 1.4, 'bandpass', 250, 1300, 0.8, 0.55, 0.35, 1.0);
      nz(ctx, out, t, 1.8, 'lowpass', 180, 260, 0.7, 0.45, 0.5, 1.2); },
    sit(ctx, out, t){   // settling onto a log: a soft thud and a little wooden creak
      nz(ctx, out, t, 0.14, 'lowpass', 260, 160, 0.8, 0.5, 0.004, 0.12);
      const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(190, t + 0.04); o.frequency.linearRampToValueAtTime(140, t + 0.22); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 4;
      g.gain.setValueAtTime(0.0001, t + 0.04); g.gain.linearRampToValueAtTime(0.05, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(t + 0.04); o.stop(t + 0.26); },
    toss(ctx, out, t){ nz(ctx, out, t, 0.45, 'bandpass', 700, 300, 1, 0.14, 0.12, 0.3); },
    land(ctx, out, t){   // the log drops in: a woody knock, a burst of sparks, and the fire roaring up
      nz(ctx, out, t, 0.22, 'lowpass', 200, 120, 0.8, 0.9, 0.003, 0.2);
      nz(ctx, out, t, 0.08, 'bandpass', 1200, 900, 1.5, 0.3, 0.002, 0.07);
      for (let i = 0; i < 14; i++) SND.pop(ctx, out, t + 0.05 + Math.random() * 0.6, 0.9);
      nz(ctx, out, t + 0.05, 1.8, 'lowpass', 450, 900, 0.7, 0.5, 0.25, 1.4); },
    pop(ctx, out, t, v = 1){   // one crackle of the fire: a tiny bright snap, sometimes with a woody knock under it
      nz(ctx, out, t, 0.03, 'bandpass', 1500 + Math.random() * 2800, 1200, 2.5, (0.25 + Math.random() * 0.5) * v, 0.001, 0.025);
      if (Math.random() < 0.15) nz(ctx, out, t, 0.08, 'lowpass', 300, 200, 0.7, 0.3 * v, 0.002, 0.07); },
    // the steady fire: a low breathy roar that follows how big the fire is, with pops scattered through it
    fireBed(ctx, out, t0, t1, fuelAt){
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, 2); src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; const g = ctx.createGain(); g.gain.value = 0;
      src.connect(lp); lp.connect(g); g.connect(out); src.start(t0); src.stop(t1);
      for (let s = t0; s < t1; s += 0.1) { const f = fuelAt(s - t0 + 8); g.gain.linearRampToValueAtTime(0.16 * f, s); lp.frequency.linearRampToValueAtTime(300 + 400 * f, s); }
      let s = t0; while (s < t1) { const f = fuelAt(s - t0 + 8); s += 0.04 + Math.random() * 0.4 / (0.2 + f); SND.pop(ctx, out, s, f); } },
    // crickets in the dark grass: little trills of three, now and then
    crickets(ctx, out, t0, t1){
      for (const [hz, pan] of [[4300, -0.6], [4700, 0.5]]) { let s = t0 + Math.random(); const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(out);
        while (s < t1) { for (let k = 0; k < 3; k++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz; const a = s + k * 0.065;
          g.gain.setValueAtTime(0.0001, a); g.gain.linearRampToValueAtTime(0.025, a + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a + 0.045); o.connect(g); g.connect(p); o.start(a); o.stop(a + 0.05); }
          s += 0.7 + Math.random() * 0.9; } } }
  };
  window.BONFIRE_SND = SND;
  // the whole soundtrack of the scene, laid out on one context starting at time T
  window.demoSoundtrack = (ctx, out, T) => {
    const fuelAt = t => t < 8 ? 0 : t < 13 ? 0.15 + 0.7 * ease(seg(t, 8, 13)) : t < 25 ? 0.85 - 0.3 * seg(t, 13, 25) : Math.min(1, 0.55 + 0.45 * ease(seg(t, 25, 25.6)) + 0.12 * Math.exp(-(t - 25) * 2));
    SND.crickets(ctx, out, T, T + LEN);
    for (let s = 0.15; s < 6; s += 0.36) SND.step(ctx, out, T + s, 1);          // Aldric walking out
    for (const s of [6.8, 7.4, 8.0]) SND.flint(ctx, out, T + s);
    SND.catch(ctx, out, T + 8.0);
    for (let s = 10.1; s < 11.2; s += 0.36) SND.step(ctx, out, T + s, 0.8);    // stepping back
    for (let s = 11.2; s < 16.3; s += 0.4) SND.step(ctx, out, T + s, 0.5);     // the family arriving
    SND.sit(ctx, out, T + 15.0); SND.sit(ctx, out, T + 16.2); SND.sit(ctx, out, T + 16.8);
    SND.toss(ctx, out, T + 24.2); SND.land(ctx, out, T + 25.0); SND.sit(ctx, out, T + 26.3);
    SND.fireBed(ctx, out, T + 8.0, T + LEN, fuelAt);
  };
})();
