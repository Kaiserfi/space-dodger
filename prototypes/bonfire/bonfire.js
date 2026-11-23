// ITAP Adventure bonfire mockup: a fire pit in the oak grove south-west of the hall, ringed by log benches.
// Paste right after the oak grove line (`oakSpots.forEach(...)`) in the game's script.
(() => {
  const FX = 1, FZ = 32;   // the fire, in the middle of the three oaks
  // spread the three oaks out round the clearing so their crowns frame the fire instead of covering it
  const oaks = treeRecs.filter(t => t.kind === 'tree' && Math.hypot(t.x - FX, t.z - FZ) < 8);
  [[-2.3, 9], [-0.6, 9.5], [1.2, 9]].forEach(([a, r], i) => { const t = oaks[i]; if (!t) return;
    const x = FX + Math.cos(a) * r, z = FZ + Math.sin(a) * r, dx = x - t.x, dz = z - t.z;
    t.x = x; t.z = z; t.g.position.x += dx; t.g.position.z += dz; t.stump.position.x += dx; t.stump.position.z += dz;
    t.box.x0 += dx; t.box.x1 += dx; t.box.z0 += dz; t.box.z1 += dz; });
  // and keep the village's scattered trees out of the clearing
  const baseTree = makeTree;
  makeTree = (x, z, ...rest) => Math.hypot(x - FX, z - FZ) < 11 ? null : baseTree(x, z, ...rest);
  let seed = 11; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const add = (geo, m, x, y, z, parent = town) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };

  // trodden earth round the fire, fading into the grass, and no grass growing on it
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(110,86,58,1)'); grd.addColorStop(0.75, 'rgba(118,94,64,.9)'); grd.addColorStop(1, 'rgba(118,94,64,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) { const x = R() * S, y = R() * S; if (Math.hypot(x - S / 2, y - S / 2) > S * 0.42) continue; const c = 70 + R() * 60; g.fillStyle = `rgba(${c},${c * 0.85},${c * 0.65},.7)`; g.fillRect(x, y, 2 + R() * 3, 2 + R() * 2); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(5.6, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  floor.position.set(FX, 0.03, FZ); floor.receiveShadow = true; town.add(floor);
  const baseMask = grassMaskTexture;
  grassMaskTexture = () => { const t = baseMask(); if (!t.fire) { const c2 = t.image.getContext('2d'); c2.fillStyle = '#000'; c2.beginPath(); c2.arc((FX - GM.x0) * GM.ppu, (FZ - GM.z0) * GM.ppu, 5 * GM.ppu, 0, 7); c2.fill(); t.needsUpdate = true; t.fire = true; } return t; };
  roadPath([[-1, 13.5], [-0.5, 21], [FX, 26.6]]);   // a short path in from the hall road

  // the pit: a ring of stones round a stack of logs
  const stone = [0x6e6a62, 0x5c5850, 0x7d786f];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(new THREE.DodecahedronGeometry(0.26 + R() * 0.08, 0), mat(stone[i % 3]), FX + Math.cos(a) * 1.15, 0.15, FZ + Math.sin(a) * 1.15); }
  add(new THREE.CircleGeometry(1.05, 20).rotateX(-Math.PI / 2), mat(0x241a14), FX, 0.05, FZ);   // ash
  const logM = mat(0x5a3a20), charM = mat(0x2a1a12);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, l = add(new THREE.CylinderGeometry(0.11, 0.13, 1.4, 6), i % 2 ? logM : charM, FX + Math.cos(a) * 0.3, 0.42, FZ + Math.sin(a) * 0.3);
    l.rotation.set(0, -a, 0); l.rotateZ(0.95); }   // leaning together like a tent
  solidAt(FX, FZ, 1.4);

  // the flames: glowing cones that flicker, with an orange light that dances with them
  const flameM = [0xffd27a, 0xff9a2a, 0xff5a14].map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, depthWrite: false }));
  const flames = [];
  for (let i = 0; i < 9; i++) { const a = R() * 7, d = i ? 0.15 + R() * 0.3 : 0;
    const f = add(new THREE.ConeGeometry(0.22 + R() * 0.12, 1, 6), flameM[i < 3 ? 0 : i < 6 ? 1 : 2], FX + Math.cos(a) * d, 0, FZ + Math.sin(a) * d); f.castShadow = false;
    flames.push({ f, h: 0.9 + R() * 0.8, p: R() * 7, s: 4 + R() * 4 }); }
  const fireLight = new THREE.PointLight(0xff8a3a, 0, 16, 1.6); fireLight.position.set(FX, 1.4, FZ); scene.add(fireLight);
  // sparks drifting up
  const NS = 40, sparkGeo = new THREE.BufferGeometry(), sp = new Float32Array(NS * 3), life = new Float32Array(NS);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffb04a, size: 0.09, transparent: true, depthWrite: false })); scene.add(sparks);
  for (let i = 0; i < NS; i++) life[i] = R() * 3;

  // log benches in a ring, facing the fire, with a gap where the path comes in
  const benches = [];
  for (const a of [0, 1.2, 2.4, 3.6, 5.85])   // the gap at the north is the way in {
    const bx = FX + Math.cos(a) * 3.4, bz = FZ + Math.sin(a) * 3.4;
    const b = new THREE.Group(); b.position.set(bx, 0, bz); b.rotation.y = -a; town.add(b);
    const seat = add(new THREE.CylinderGeometry(0.32, 0.32, 2.2, 8), mat(0x7a5530), 0, 0.42, 0, b); seat.rotation.x = Math.PI / 2;
    add(new THREE.BoxGeometry(0.62, 0.04, 2.1), mat(0x9a7448), 0, 0.73, 0, b);   // the flat top it was cut to
    for (const s of [-0.75, 0.75]) add(new THREE.BoxGeometry(0.5, 0.3, 0.25), mat(0x5a3a20), 0, 0.15, s, b);
    solidAt(bx, bz, 0.7);
    benches.push({ a, bx, bz });
  }

  // three villagers sat round it, to show how sitting would look
  const sitters = [[0, { gender: 'female', skin: 0xf0c8a0, hair: 'long', hairCol: 0xa03a1e, shirt: 0x7a3a6a, pants: 0x3a2a3a }],
                   [2.4, { gender: 'male', skin: 0xd9a070, hair: 'short', hairCol: 0x2a1a10, shirt: 0x3a7a3a, pants: 0x4a3a2a }],
                   [3.6, { gender: 'female', skin: 0xe8c39c, hair: 'topknot', hairCol: 0x1a1a1a, shirt: 0x4a6aa0, pants: 0x3a3a4a }]];
  const figs = sitters.map(([a, look]) => {
    const fig = makeChibi(look); const r = 3.55;
    fig.position.set(FX + Math.cos(a) * r, 0.3, FZ + Math.sin(a) * r);
    fig.rotation.y = Math.atan2(FX - fig.position.x, FZ - fig.position.z); scene.add(fig); return fig;
  });
  const seatPose = fig => { const c = fig.userData.chibi; c.legs.forEach(l => l.rotation.x = -1.45); c.body.position.y = 0.02; c.body.rotation.x = -0.05; c.arms.forEach(a => a.rotation.x = -0.9); };

  // each frame: flicker the flames and light, lift the sparks; the light grows as night falls
  const fuel = 1;   // a full fire; the real one would burn down unless logs are added
  (function tick(){
    const t = performance.now() / 1000;
    for (const { f, h, p, s } of flames) { const k = h * fuel * (0.8 + 0.25 * Math.sin(t * s + p) + 0.1 * Math.sin(t * 13 + p * 3)); f.scale.set(1, k, 1); f.position.y = 0.35 + k / 2; }
    const dark = typeof hourNow === 'function' ? (() => { const h = hourNow(); return h < 6 || h > 19.5 ? 1 : h < 7 ? 7 - h : h > 18.5 ? h - 18.5 : 0; })() : 0;
    fireLight.intensity = fuel * (2 + 20 * dark) * (0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3));
    fireLight.position.set(FX + Math.sin(t * 7) * 0.08, 1.4 + Math.sin(t * 11) * 0.05, FZ + Math.cos(t * 6) * 0.08);
    for (let i = 0; i < NS; i++) { life[i] += 0.016; if (life[i] > 2.5) { life[i] = 0; sp[i * 3] = FX + (R() - 0.5) * 0.6; sp[i * 3 + 1] = 0.6; sp[i * 3 + 2] = FZ + (R() - 0.5) * 0.6; }
      sp[i * 3] += Math.sin(t * 3 + i) * 0.004; sp[i * 3 + 1] += 0.03; }
    sparkGeo.attributes.position.needsUpdate = true;
    figs.forEach(seatPose);
    requestAnimationFrame(tick);
  })();
  window.BONFIRE = { FX, FZ };
})();
