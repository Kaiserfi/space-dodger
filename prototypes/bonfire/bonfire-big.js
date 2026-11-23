// ITAP Adventure bonfire mockup, scaled up: a big village bonfire in the oak grove south-west of the hall,
// with two rings of log benches (12 seats close in, 24 further out) and two ways in, from the hall road and from the green.
// Paste right after the oak grove line (`oakSpots.forEach(...)`) in the game's script.
(() => {
  const FX = 1, FZ = 33;   // the fire, in the middle of the oak grove
  const IN_R = 4.4, OUT_R = 8, CLEAR_R = 10.5, NORTH = -Math.PI / 2, GREEN = Math.atan2(10 - 33, -40 - 1);   // the two ways in
  // spread the three oaks out round the clearing so their crowns frame the fire instead of covering it
  const oaks = treeRecs.filter(t => t.kind === 'tree' && Math.hypot(t.x - FX, t.z - FZ) < 8);
  [[0.5, 16.5], [1.6, 17], [2.6, 16.5]].forEach(([a, r], i) => { const t = oaks[i]; if (!t) return;
    const x = FX + Math.cos(a) * r, z = FZ + Math.sin(a) * r, dx = x - t.x, dz = z - t.z;
    t.x = x; t.z = z; t.g.position.x += dx; t.g.position.z += dz; t.stump.position.x += dx; t.stump.position.z += dz;
    t.box.x0 += dx; t.box.x1 += dx; t.box.z0 += dz; t.box.z1 += dz; });
  // and keep the village's scattered trees out of the clearing
  const baseTree = makeTree;
  makeTree = (x, z, ...rest) => Math.hypot(x - FX, z - FZ) < 19 ? null : baseTree(x, z, ...rest);
  let seed = 11; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const add = (geo, m, x, y, z, parent = town) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };

  // trodden earth round the fire, fading into the grass, and no grass growing on it
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(110,86,58,1)'); grd.addColorStop(0.75, 'rgba(118,94,64,.9)'); grd.addColorStop(1, 'rgba(118,94,64,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) { const x = R() * S, y = R() * S; if (Math.hypot(x - S / 2, y - S / 2) > S * 0.42) continue; const c = 70 + R() * 60; g.fillStyle = `rgba(${c},${c * 0.85},${c * 0.65},.7)`; g.fillRect(x, y, 2 + R() * 3, 2 + R() * 2); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(CLEAR_R + 1, 56).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  floor.position.set(FX, 0.03, FZ); floor.receiveShadow = true; town.add(floor);
  const baseMask = grassMaskTexture;
  grassMaskTexture = () => { const t = baseMask(); if (!t.fire) { const c2 = t.image.getContext('2d'); c2.fillStyle = '#000'; c2.beginPath(); c2.arc((FX - GM.x0) * GM.ppu, (FZ - GM.z0) * GM.ppu, CLEAR_R * GM.ppu, 0, 7); c2.fill(); t.needsUpdate = true; t.fire = true; } return t; };
  roadPath([[-1, 13.5], [-0.5, 20], [FX, FZ - CLEAR_R + 1]]);   // in from the hall road
  roadPath([[-24, 12], [-15, 19], [FX + Math.cos(GREEN) * (CLEAR_R - 1), FZ + Math.sin(GREEN) * (CLEAR_R - 1)]]);   // in from the green

  // the pit: a ring of stones round a stack of logs
  const stone = [0x6e6a62, 0x5c5850, 0x7d786f];
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; add(new THREE.DodecahedronGeometry(0.34 + R() * 0.1, 0), mat(stone[i % 3]), FX + Math.cos(a) * 1.7, 0.2, FZ + Math.sin(a) * 1.7); }
  add(new THREE.CircleGeometry(1.6, 24).rotateX(-Math.PI / 2), mat(0x241a14), FX, 0.05, FZ);   // ash
  const logM = mat(0x5a3a20), charM = mat(0x2a1a12);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, l = add(new THREE.CylinderGeometry(0.15, 0.18, 2.1, 6), i % 2 ? logM : charM, FX + Math.cos(a) * 0.45, 0.62, FZ + Math.sin(a) * 0.45);
    l.rotation.set(0, -a, 0); l.rotateZ(0.95); }   // leaning together like a tent
  solidAt(FX, FZ, 2);

  // the flames: glowing cones that flicker, with an orange light that dances with them
  const flameM = [0xffd27a, 0xff9a2a, 0xff5a14].map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, depthWrite: false }));
  const flames = [];
  for (let i = 0; i < 14; i++) { const a = R() * 7, d = i ? 0.2 + R() * 0.55 : 0;
    const f = add(new THREE.ConeGeometry(0.3 + R() * 0.18, 1, 6), flameM[i < 3 ? 0 : i < 6 ? 1 : 2], FX + Math.cos(a) * d, 0, FZ + Math.sin(a) * d); f.castShadow = false;
    flames.push({ f, h: 1.4 + R() * 1.3, p: R() * 7, s: 4 + R() * 4 }); }
  const fireLight = new THREE.PointLight(0xff8a3a, 0, 26, 1.5); fireLight.position.set(FX, 2, FZ); scene.add(fireLight);
  // sparks drifting up
  const NS = 70, sparkGeo = new THREE.BufferGeometry(), sp = new Float32Array(NS * 3), life = new Float32Array(NS);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffb04a, size: 0.09, transparent: true, depthWrite: false })); scene.add(sparks);
  for (let i = 0; i < NS; i++) life[i] = R() * 3;

  // log benches in a ring, facing the fire, with a gap where the path comes in
  const benches = [];
  const near = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  function bench(a, r, len, seats){
    const bx = FX + Math.cos(a) * r, bz = FZ + Math.sin(a) * r;
    const b = new THREE.Group(); b.position.set(bx, 0, bz); b.rotation.y = -a; town.add(b);
    const seat = add(new THREE.CylinderGeometry(0.32, 0.32, len, 8), mat(0x7a5530), 0, 0.42, 0, b); seat.rotation.x = Math.PI / 2;
    add(new THREE.BoxGeometry(0.62, 0.04, len - 0.1), mat(0x9a7448), 0, 0.73, 0, b);   // the flat top it was cut to
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.5, 0.3, 0.25), mat(0x5a3a20), 0, 0.15, s * (len / 2 - 0.35), b);
    const tx = -Math.sin(a), tz = Math.cos(a);
    for (let k = -len / 2 + 0.4; k <= len / 2 - 0.4; k += 0.8) solidAt(bx + tx * k, bz + tz * k, 0.45);
    for (let i = 0; i < seats; i++) { const o = (i - (seats - 1) / 2) * (len / seats); benches.push({ a, x: FX + Math.cos(a) * (r + 0.15) + tx * o, z: FZ + Math.sin(a) * (r + 0.15) + tz * o }); }
  }
  // the inner ring: six benches of two, close to the fire, open towards the hall road
  for (let i = 0; i < 7; i++) { const a = NORTH + i * Math.PI * 2 / 7; if (i) bench(a, IN_R, 2.3, 2); }
  // the outer ring: eight longer benches of three, open towards the hall road and the green
  for (let i = 0; i < 10; i++) { const a = NORTH + i * Math.PI * 2 / 10; if (near(a, NORTH) > 0.3 && near(a, GREEN) > 0.32) bench(a, OUT_R, 3.3, 3); }

  // three villagers sat round it, to show how sitting would look
  const sitters = [[0, { gender: 'female', skin: 0xf0c8a0, hair: 'long', hairCol: 0xa03a1e, shirt: 0x7a3a6a, pants: 0x3a2a3a }],
                   [2.4, { gender: 'male', skin: 0xd9a070, hair: 'short', hairCol: 0x2a1a10, shirt: 0x3a7a3a, pants: 0x4a3a2a }],
                   [3.6, { gender: 'female', skin: 0xe8c39c, hair: 'topknot', hairCol: 0x1a1a1a, shirt: 0x4a6aa0, pants: 0x3a3a4a }]];
  // fill most seats, to show a busy night: a mix of looks, as players and villagers would be
  const skins = [0xf0c8a0, 0xe8c39c, 0xd9a070, 0xb07a50, 0x8a5a3a], hairs = ['short', 'long', 'topknot'], cols = [0x7a3a6a, 0x3a7a3a, 0x4a6aa0, 0xd8a040, 0x8a3a3a, 0x3d6fb8, 0xc8a060, 0x6a5a8a];
  const figs = window.BONFIRE_DEMO ? [] : benches.filter((s, i) => i % 5 !== 3).map((s, i) => {
    const fig = makeChibi({ gender: R() < 0.5 ? 'female' : 'male', skin: skins[(R() * 5) | 0], hair: hairs[(R() * 3) | 0], hairCol: [0x1a1a1a, 0x5a3a1a, 0xa03a1e, 0xd8b058][(R() * 4) | 0], shirt: cols[(R() * 8) | 0], pants: [0x3a3a44, 0x4a3a2a, 0x3a5a8a][(R() * 3) | 0] });
    if (R() < 0.15) fig.scale.multiplyScalar(0.78);
    fig.position.set(s.x, 0.3, s.z); fig.rotation.y = Math.atan2(FX - s.x, FZ - s.z); scene.add(fig); return fig;
  });
  const seatPose = fig => { const c = fig.userData.chibi; c.legs.forEach(l => l.rotation.x = -1.45); c.body.position.y = 0.02; c.body.rotation.x = 0.08; c.arms.forEach(a => a.rotation.x = -1.15); };

  // each frame: flicker the flames and light, lift the sparks; the light grows as night falls
  const state = { fuel: 1, ember: 0 };   // fuel 0..1; the real fire burns down unless logs are added
  window.BONFIRE = { FX, FZ, state, figs, benches, fireLight };
  (function tick(){
    const t = performance.now() / 1000;
    for (const { f, h, p, s } of flames) { const fuel = state.fuel; const k = h * fuel * (0.8 + 0.25 * Math.sin(t * s + p) + 0.1 * Math.sin(t * 13 + p * 3)); f.scale.set(1, k, 1); f.position.y = 0.35 + k / 2; }
    const dark = typeof hourNow === 'function' ? (() => { const h = hourNow(); return h < 6 || h > 19.5 ? 1 : h < 7 ? 7 - h : h > 18.5 ? h - 18.5 : 0; })() : 0;
    const fuel = state.fuel; sparks.visible = fuel > 0.05;
    fireLight.intensity = fuel * (2 + 20 * dark) * (0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3));
    fireLight.position.set(FX + Math.sin(t * 7) * 0.08, 1.4 + Math.sin(t * 11) * 0.05, FZ + Math.cos(t * 6) * 0.08);
    for (let i = 0; i < NS; i++) { life[i] += 0.016; if (life[i] > 2.5) { life[i] = 0; sp[i * 3] = FX + (R() - 0.5) * 1.1; sp[i * 3 + 1] = 0.9; sp[i * 3 + 2] = FZ + (R() - 0.5) * 1.1; }
      sp[i * 3] += Math.sin(t * 3 + i) * 0.004; sp[i * 3 + 1] += 0.03; }
    sparkGeo.attributes.position.needsUpdate = true;
    figs.forEach(seatPose);
    requestAnimationFrame(tick);
  })();
})();
