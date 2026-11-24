// ITAP Adventure Root Cellar mockup: the instanced arena under the ruined farm.
// Built far off the main map (it would be its own instance), sized for a party of four and a wave of monsters.
// Paste after `frame();` to look at it; window.CELLAR has its centre and size.
(() => {
  const CX = 0, CZ = 400, W = 24, D = 18;   // the room's centre and size
  let q = 5; const R = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const root = new THREE.Group(); root.position.set(CX, 0, CZ); scene.add(root);
  const add = (geo, m, x, y, z, parent = root) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const stoneM = texMat(wallStone, 3, 1, 0x8a847a), earth = mat(0x4a3a2a), beam = mat(0x5a4028), plank = texMat(woodTex(), 6, 4, 0x8a6a48);
  // the floor: packed earth with a worn plank area in the middle
  add(new THREE.BoxGeometry(W, 0.2, D), earth, 0, -0.1, 0);
  add(new THREE.BoxGeometry(W - 6, 0.06, D - 6), plank, 0, 0.02, 0);
  // walls: rough stone low down, packed earth above, with timber posts and a beam along the top
  const H = 4.2;
  for (const [x, z, w, d] of [[0, -D / 2, W, 0.6], [0, D / 2, W, 0.6], [-W / 2, 0, 0.6, D], [W / 2, 0, 0.6, D]]) {
    add(new THREE.BoxGeometry(w, 1.6, d), stoneM, x, 0.8, z); add(new THREE.BoxGeometry(w, H - 1.6, d), earth, x, 1.6 + (H - 1.6) / 2, z); }
  for (let i = -2; i <= 2; i++) for (const z of [-D / 2 + 0.5, D / 2 - 0.5]) add(new THREE.BoxGeometry(0.35, H, 0.35), beam, i * (W / 5), H / 2, z);
  for (let i = -1; i <= 1; i++) for (const x of [-W / 2 + 0.5, W / 2 - 0.5]) add(new THREE.BoxGeometry(0.35, H, 0.35), beam, x, H / 2, i * (D / 3.2));
  for (let i = -2; i <= 2; i++) add(new THREE.BoxGeometry(0.3, 0.3, D), beam, i * (W / 5), H, 0);   // ceiling joists (the ceiling itself is left open so the camera can see in)
  // the ladder up to the hatch, on the north wall, with daylight falling down it
  const L = new THREE.Group(); L.position.set(-6, 0, -D / 2 + 0.6); root.add(L);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.12, 4.6, 0.12), beam, s * 0.45, 2.3, 0, L);
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.9, 0.07, 0.1), beam, 0, 0.35 + i * 0.48, 0, L);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 4.2, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  shaft.position.set(-6, 2.1, -D / 2 + 1.4); root.add(shaft);
  add(new THREE.CircleGeometry(1.4, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.18 }), -6, 0.06, -D / 2 + 1.6);
  // the tunnel the waves come out of, at the south end: a crumbled hole in the wall with rubble
  add(new THREE.CircleGeometry(1.7, 14), new THREE.MeshBasicMaterial({ color: 0x050302 }), 4, 1.5, D / 2 - 0.32).rotation.y = Math.PI;
  for (let i = 0; i < 14; i++) add(new THREE.DodecahedronGeometry(0.25 + R() * 0.35, 0), R() < 0.5 ? 0x6a645a : 0x4a3a2a, 4 + (R() - 0.5) * 4, 0.2, D / 2 - 1 - R() * 1.6).castShadow = false;
  // stores round the edges: crates, barrels, grain sacks, hay, and shelves of jars
  const crateM = texMat(woodTex(), 1, 1, 0xa07a50);
  for (const [x, z, s, r] of [[-10.5, 7, 1.1, 0.2], [-9.3, 7.4, 0.9, -0.3], [-10.4, 5.6, 0.8, 0.5], [10.4, -7, 1.1, 0.1], [9.4, -7.3, 0.8, 0.6]]) add(new THREE.BoxGeometry(s, s, s), crateM, x, s / 2, z).rotation.y = r;
  for (const [x, z] of [[10.6, 6.8], [9.6, 7.3], [10.7, 5.6]]) { add(new THREE.CylinderGeometry(0.5, 0.44, 1.1, 10), 0x7a5028, x, 0.55, z); add(new THREE.CylinderGeometry(0.52, 0.52, 0.07, 10), 0x3a3a40, x, 0.85, z); }
  for (const [x, z] of [[-10.6, -2], [-10.3, -0.9], [-10.7, 0.2]]) add(new THREE.SphereGeometry(0.5, 8, 6), 0xc8b484, x, 0.4, z).scale.set(1, 0.85, 0.8);
  for (const [x, z] of [[2, -7.6], [-1, 7.6]]) add(new THREE.CylinderGeometry(1.1, 1.3, 0.8, 9), 0xd8b850, x, 0.4, z).scale.set(1, 1, 0.55);
  const shelf = new THREE.Group(); shelf.position.set(6, 0, -D / 2 + 0.6); root.add(shelf);
  for (const y of [0.6, 1.3, 2.0]) add(new THREE.BoxGeometry(3, 0.08, 0.5), beam, 0, y, 0, shelf);
  for (let i = 0; i < 12; i++) add(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8), new THREE.MeshStandardMaterial({ color: [0x7aa04a, 0xc0603a, 0xd8b040][i % 3], transparent: true, opacity: 0.85 }), -1.2 + (i % 6) * 0.48, 0.78 + Math.floor(i / 6) * 0.7, 0, shelf);
  // lanterns on the posts: warm pools of light, the only light down here
  const glow = new THREE.MeshStandardMaterial({ color: 0xffd08a, emissive: 0xffa040, emissiveIntensity: 2 });
  for (const [x, z] of [[-W / 2 + 0.9, -4], [-W / 2 + 0.9, 4], [W / 2 - 0.9, -4], [W / 2 - 0.9, 4], [0, -D / 2 + 0.9], [0, D / 2 - 0.9]]) {
    add(new THREE.BoxGeometry(0.28, 0.36, 0.28), glow, x, 2.6, z);
    const Lt = new THREE.PointLight(0xffa860, 22, 15, 1.5); Lt.position.set(CX + x, 2.4, CZ + z); scene.add(Lt);
  }
  const fill = new THREE.PointLight(0xffc890, 30, 26, 1.2); fill.position.set(CX, 6, CZ); scene.add(fill);   // a soft fill from the lanterns all round
  // hanging roots and cobwebs, for atmosphere
  for (let i = 0; i < 16; i++) { const r = add(new THREE.CylinderGeometry(0.02, 0.05, 0.6 + R() * 0.8, 4), 0x5a4228, (R() - 0.5) * (W - 3), H - 0.4, (R() - 0.5) * (D - 3)); r.castShadow = false; }
  // a party of four and a wave on its way, to show the scale
  const party = [[-2, -2, { shirt: 0x3d6fb8 }], [1, -3, { gender: 'female', hair: 'long', hairCol: 0xa03a1e, shirt: 0x6a3a8a }], [-4, 0, { hair: 'spiky', hairCol: 0x1a1a1a, shirt: 0x3f8f4f }], [2.5, -0.5, { gender: 'female', hair: 'ponytail', hairCol: 0xe0c070, shirt: 0xd8a040 }]];
  for (const [x, z, l] of party) { const f = makeChibi({ ...look, ...l }); f.position.set(CX + x, 0, CZ + z); f.rotation.y = 0; dressChibi(f, { head: 'Bronze helmet', body: 'Bronze chestplate', weapon: 'Bronze sword', shield: 'Bronze shield' }); poseChibi(f, 'idle', 0); scene.add(f); }
  for (const [k, x, z] of [['farmer', 3, 5], ['rat', 5.5, 6.2], ['rat', 1.5, 6.8], ['cow', -2, 6]]) { const g = makeFarmMonster(k); g.position.set(CX + x, 0, CZ + z); g.rotation.y = Math.PI; scene.add(g); if (g.userData.pose) g.userData.pose('ready', 0, 0); }
  window.CELLAR = { CX, CZ, W, D };
})();
