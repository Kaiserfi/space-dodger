// ITAP Adventure Root Cellar arena mockup: the instanced fighting pit under the ruined farm.
// A big cavern with a round sand pit ringed by a stake palisade, two barred monster gates, braziers,
// a raised landing platform under the ladder, and makeshift stands where rats watch. Built far off the main map.
// Paste after `frame();` to look at it; window.CELLAR has its centre and the pit's radius.
(() => {
  const CX = 0, CZ = 400, PIT = 14;   // the pit's centre and radius
  let q = 9; const R = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const root = new THREE.Group(); root.position.set(CX, 0, CZ); scene.add(root);
  const add = (geo, m, x, y, z, parent = root) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const rock = [0x5a544c, 0x4a453e, 0x655e54, 0x3e3a34], wood = mat(0x6a4a2c), darkWood = mat(0x3e2a18), iron = mat(0x3a3a40);
  // the cavern floor, and the sand of the pit, raked smooth with a darker ring where fights have churned it
  add(new THREE.CylinderGeometry(30, 30, 0.3, 40), 0x3a3028, 0, -0.15, 0);
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(256, 256, 40, 256, 256, 256); gr.addColorStop(0, '#c8a878'); gr.addColorStop(0.7, '#b89868'); gr.addColorStop(0.9, '#8a7048'); gr.addColorStop(1, '#6a5438');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3000; i++) { const c = 140 + R() * 80; g.fillStyle = `rgba(${c},${c * 0.82},${c * 0.6},.45)`; g.fillRect(R() * 512, R() * 512, 1 + R() * 3, 1 + R() * 2); }
  for (let i = 0; i < 9; i++) { g.strokeStyle = 'rgba(90,40,30,.35)'; g.lineWidth = 2 + R() * 6; g.beginPath(); g.arc(150 + R() * 210, 150 + R() * 210, 6 + R() * 20, 0, 7); g.stroke(); }   // old stains
  const sandTex = new THREE.CanvasTexture(cv); sandTex.colorSpace = THREE.SRGBColorSpace;
  add(new THREE.CircleGeometry(PIT, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 }), 0, 0.02, 0);
  // the cavern walls: a ring of great rough boulders, stacked high, closing over into darkness
  for (let tier = 0; tier < 3; tier++) for (let i = 0; i < 34; i++) { const a = i / 34 * Math.PI * 2 + tier * 0.09, r = 27 + tier * 1.5 + R() * 1.5, s = 2.6 + R() * 1.6;
    add(new THREE.DodecahedronGeometry(s, 0), rock[(R() * 4) | 0], Math.cos(a) * r, 1 + tier * 3.2, Math.sin(a) * r).rotation.set(R() * 3, R() * 3, R() * 3); }
  // stalactites and roots hanging from the dark above
  for (let i = 0; i < 26; i++) { const a = R() * 7, r = 18 + R() * 9; add(new THREE.ConeGeometry(0.4 + R() * 0.6, 2 + R() * 3, 6), rock[(R() * 4) | 0], Math.cos(a) * r, 9.5, Math.sin(a) * r).rotation.x = Math.PI; }
  // makeshift stands up the cave sides, where shadowy rats crowd to watch
  for (const [a0, a1] of [[0.4, 1.3], [1.8, 2.7], [3.6, 4.4], [5.0, 5.9]]) for (let row = 0; row < 3; row++) for (let a = a0; a < a1; a += 0.16) {
    const r = 18.5 + row * 2.2, y = 0.5 + row * 0.9;
    add(new THREE.BoxGeometry(1.6, 0.18, 0.7), wood, Math.cos(a) * r, y, Math.sin(a) * r).rotation.y = -a;
    add(new THREE.BoxGeometry(0.15, y, 0.15), darkWood, Math.cos(a) * r, y / 2, Math.sin(a) * r);
    if (R() < 0.35) { const rat = new THREE.Group(); rat.position.set(Math.cos(a) * r, y + 0.1, Math.sin(a) * r); rat.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)) + Math.PI / 2; root.add(rat);
      add(new THREE.SphereGeometry(0.35, 8, 6), 0x2a2a2e, 0, 0.3, 0, rat).scale.set(1, 0.9, 1.4);
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3020 })); e.position.set(s * 0.12, 0.45, 0.42); rat.add(e); } }
  }
  // the palisade: sharpened stakes all round the pit, with gaps for the landing steps and the two monster gates
  const gaps = [[-Math.PI / 2, 0.22], [Math.PI / 2, 0.2], [0, 0.2]];   // north (the steps), south and east (the gates)
  const inGap = a => gaps.some(([c, w]) => Math.abs(Math.atan2(Math.sin(a - c), Math.cos(a - c))) < w);
  for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2; if (inGap(a)) continue;
    const h = 2.2 + R() * 0.6, st = add(new THREE.CylinderGeometry(0.16, 0.2, h, 6), wood, Math.cos(a) * PIT, h / 2, Math.sin(a) * PIT);
    add(new THREE.ConeGeometry(0.17, 0.5, 6), darkWood, Math.cos(a) * PIT, h + 0.25, Math.sin(a) * PIT); st.rotation.z = (R() - 0.5) * 0.08; }
  for (const y of [0.7, 1.6]) for (let i = 0; i < 60; i++) { const a = (i + 0.5) / 60 * Math.PI * 2; if (inGap(a)) continue;   // two rope-bound rails round the stakes
    const rl = add(new THREE.BoxGeometry(0.1, 0.12, PIT * 2 * Math.PI / 60), darkWood, Math.cos(a) * (PIT + 0.15), y, Math.sin(a) * (PIT + 0.15)); rl.rotation.y = -a; }
  // the monster gates: heavy barred doors in stone arches, with dark tunnels behind
  for (const a of [Math.PI / 2, 0]) { const G = new THREE.Group(); G.position.set(Math.cos(a) * (PIT + 0.4), 0, Math.sin(a) * (PIT + 0.4)); G.rotation.y = -a + Math.PI / 2; root.add(G);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(1, 4, 1), texMat(wallStone, 1, 2, 0x8a847a), s * 2.2, 2, 0, G);
    add(new THREE.BoxGeometry(5.4, 1, 1), texMat(wallStone, 2, 1, 0x8a847a), 0, 4.3, 0, G);
    add(new THREE.BoxGeometry(3.4, 3.8, 0.1), new THREE.MeshBasicMaterial({ color: 0x050302 }), 0, 1.9, 0.6, G);   // the tunnel's mouth
    for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.14, 3.6, 0.14), iron, -1.5 + i * 0.6, 1.9, -0.1, G);   // portcullis bars
    for (const y of [0.8, 2.2, 3.4]) add(new THREE.BoxGeometry(3.4, 0.14, 0.14), iron, 0, y, -0.1, G);
    for (let i = 0; i < 2; i++) { const sk = add(new THREE.SphereGeometry(0.28, 8, 6), 0xe8e0c8, (i ? 1 : -1) * 2.2, 4.95, -0.3, G); sk.scale.set(1, 0.85, 1.2); }   // cow skulls over the arch
  }
  // the landing: a raised wooden platform under the ladder, with steps down into the pit
  const P = new THREE.Group(); P.position.set(0, 0, -PIT - 3.5); root.add(P);
  add(new THREE.BoxGeometry(8, 1.2, 5), texMat(woodTex(), 4, 3, 0x8a6a48), 0, 0.6, 0, P);
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(3.2, 0.3, 0.8), wood, 0, 1.05 - i * 0.3, 2.9 + i * 0.75, P);   // steps down onto the sand
  for (const s of [-1, 1]) for (const z of [-2.2, 2.2]) add(new THREE.BoxGeometry(0.25, 2.6, 0.25), darkWood, s * 3.8, 1.3, z, P);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.12, 4.6), darkWood, s * 3.8, 2.3, 0, P);
  const L = new THREE.Group(); L.position.set(0, 1.2, -2.3); P.add(L);   // the ladder up to the hatch: the way out
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.14, 8, 0.14), darkWood, s * 0.5, 4, 0, L);
  for (let i = 0; i < 15; i++) add(new THREE.BoxGeometry(1, 0.08, 0.12), darkWood, 0, 0.4 + i * 0.52, 0, L);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.4, 9, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }));
  shaft.position.set(0, 5.6, -PIT - 5.6); root.add(shaft);
  // braziers round the pit, and torches on the palisade: the only light down here
  const fireM = new THREE.MeshBasicMaterial({ color: 0xffa040 });
  for (const a of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) { const x = Math.cos(a) * (PIT - 1.6), z = Math.sin(a) * (PIT - 1.6);
    add(new THREE.CylinderGeometry(0.12, 0.2, 1.5, 6), iron, x, 0.75, z); add(new THREE.CylinderGeometry(0.75, 0.45, 0.5, 10), iron, x, 1.6, z);
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.28 + R() * 0.15, 0.8 + R() * 0.5, 6), fireM); f.position.set(CX + x + (R() - 0.5) * 0.5, 2.15, CZ + z + (R() - 0.5) * 0.5); scene.add(f); }
    const Lt = new THREE.PointLight(0xff9a40, 40, 22, 1.4); Lt.position.set(CX + x, 3, CZ + z); scene.add(Lt); }
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3; if (inGap(a)) continue; const x = Math.cos(a) * (PIT + 0.3), z = Math.sin(a) * (PIT + 0.3);
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 5), fireM); f.position.set(CX + x, 3.25, CZ + z); scene.add(f); add(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 5), darkWood, x, 2.85, z); }
  const fill = new THREE.PointLight(0xffc890, 60, 40, 1.1); fill.position.set(CX, 10, CZ); scene.add(fill);
  // farm junk turned into arena dressing: hay-bale barricades, cart wheels on the stakes, pitchforks, a scarecrow trophy, chains
  for (const [a, r] of [[0.9, 9], [2.3, 8.5], [4.0, 9.5], [5.4, 8]]) { const x = Math.cos(a) * r, z = Math.sin(a) * r;
    add(new THREE.BoxGeometry(2.2, 1, 1.1), 0xd8b850, x, 0.5, z).rotation.y = a; add(new THREE.BoxGeometry(1.1, 1, 1), 0xc8a840, x + Math.cos(a + 1.6) * 0.3, 1.5, z + Math.sin(a + 1.6) * 0.3).rotation.y = a + 0.3; }
  for (const a of [1.1, 2.0, 4.6, 5.6]) { const w = add(new THREE.TorusGeometry(0.8, 0.09, 5, 12), wood, Math.cos(a) * (PIT + 0.35), 1.6, Math.sin(a) * (PIT + 0.35)); w.rotation.y = -a + Math.PI / 2;
    for (let k = 0; k < 4; k++) { const sp = add(new THREE.BoxGeometry(0.06, 1.5, 0.06), wood, Math.cos(a) * (PIT + 0.35), 1.6, Math.sin(a) * (PIT + 0.35)); sp.rotation.set(0, -a + Math.PI / 2, k * Math.PI / 4); } }
  for (const a of [3.1, 3.4]) { const pf = add(new THREE.CylinderGeometry(0.04, 0.05, 2.4, 5), wood, Math.cos(a) * (PIT + 0.5), 1.4, Math.sin(a) * (PIT + 0.5)); pf.rotation.z = 0.35; }
  const sc = new THREE.Group(); sc.position.set(Math.cos(3.25) * (PIT + 1.6), 0, Math.sin(3.25) * (PIT + 1.6)); root.add(sc);
  add(new THREE.BoxGeometry(0.14, 3.2, 0.14), darkWood, 0, 1.6, 0, sc); add(new THREE.BoxGeometry(2.2, 0.12, 0.12), darkWood, 0, 2.5, 0, sc);
  add(new THREE.BoxGeometry(0.8, 1, 0.4), 0x5a4a3a, 0, 2.2, 0, sc); add(new THREE.SphereGeometry(0.4, 8, 6), 0xd8c898, 0, 3.1, 0, sc); add(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 10), 0xc8a850, 0, 3.4, 0, sc);
  for (let i = 0; i < 8; i++) { const a = R() * 7, l = add(new THREE.TorusGeometry(0.12, 0.03, 4, 8), iron, Math.cos(a) * (PIT + 0.2), 2.4 - i * 0.18, Math.sin(a) * (PIT + 0.2)); l.rotation.y = i % 2 ? 1.5 : 0; }
  // a party of four on the sand, and a wave coming through the south gate
  const party = [[-3, -7, { shirt: 0x3d6fb8 }], [0, -8, { gender: 'female', hair: 'long', hairCol: 0xa03a1e, shirt: 0x6a3a8a }], [3, -7, { hair: 'spiky', hairCol: 0x1a1a1a, shirt: 0x3f8f4f }], [0.5, -5.5, { gender: 'female', hair: 'ponytail', hairCol: 0xe0c070, shirt: 0xd8a040 }]];
  for (const [x, z, l] of party) { const f = makeChibi({ ...look, ...l }); f.position.set(CX + x, 0, CZ + z); dressChibi(f, { head: 'Bronze helmet', body: 'Bronze chestplate', weapon: 'Bronze sword', shield: 'Bronze shield' }); poseChibi(f, 'idle', 0); scene.add(f); }
  for (const [k, x, z] of [['farmer', -1.5, 9], ['farmer', 2, 10.5], ['rat', 4.5, 8], ['rat', -4, 10]]) { const gm = makeFarmMonster(k); gm.position.set(CX + x, 0, CZ + z); gm.rotation.y = Math.PI; scene.add(gm); if (gm.userData.pose) gm.userData.pose('ready', 0, 0); }
  window.CELLAR = { CX, CZ, PIT };
})();
