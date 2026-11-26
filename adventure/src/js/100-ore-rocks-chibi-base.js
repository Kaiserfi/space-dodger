// ----- a copper ore rock: grey-brown stone with copper veins, built from our own shapes -----
const ORES = {
  copper: { label: 'Copper rock', item: 'Copper ore', veins: [0xc2652b, 0xd9773a] },
  tin:    { label: 'Tin rock',    item: 'Tin ore',    veins: [0xb8c4cc, 0xdfe6ea] },
  iron:   { label: 'Iron rock',   item: 'Iron ore',   veins: [0x7a4a32, 0x9a5e42], lvl: 15, xp: 35 }   /* as in the phone game: Mining 15, 35 XP */
};
function makeRock(x, z, s = 1, ore = 'copper'){
  const g = new THREE.Group();
  const stone = [0x6e6a62, 0x5c5850, 0x7d786f, 0x67635b];
  const lumps = [[0, 0.55, 0, 0.9], [0.7, 0.4, 0.3, 0.6], [-0.6, 0.35, -0.3, 0.55], [0.1, 0.3, 0.8, 0.5]];
  lumps.forEach(([dx, dy, dz, r], i) => {
    const geo = new THREE.IcosahedronGeometry(r * s, 0);
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const px = pos.getX(v), py = pos.getY(v), pz = pos.getZ(v);
      const h = Math.sin(px * 12.9898 + py * 78.233 + pz * 37.719 + i * 1.7) * 43758.5453;
      const j = 0.85 + 0.3 * (h - Math.floor(h));
      pos.setXYZ(v, px * j, py * j, pz * j);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat(stone[i]));
    m.position.set(dx * s, dy * s, dz * s); g.add(m);
  });
  // the copper veins: small orange-brown chunks set into the stone
  [[0.5, 0.9, 0.5], [-0.3, 0.8, 0.6], [0.2, 0.7, -0.6], [-0.7, 0.5, -0.1], [0.8, 0.45, -0.1]].forEach(([dx, dy, dz], i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 * s, 0), mat(ORES[ore].veins[i % 2]));
    m.position.set(dx * s, dy * s, dz * s); g.add(m);
  });
  // the rubble left behind after mining
  const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 * s, 0), mat(0x5c5850));
  rubble.scale.set(1, 0.35, 0.9); rubble.position.set(x, 0.12 * s, z); rubble.visible = false; town.add(rubble);
  g.position.set(x, 0, z);
  g.userData.action = 'Mine'; g.userData.name = ORES[ore].label;
  const h = Math.max(1, 0.7 * s);   // at least a 2x2 footprint, centred on the rock
  const box = { x0: x - h, x1: x + h, z0: z - h, z1: z + h };   // the rock blocks walking
  const rec = { kind: 'rock', key: nodeKey(x, z), until: 0, ore, g, x, z, s, box, stump: rubble, state: 'standing', t: 0, dir: 1 };
  g.userData.rec = rec; treeRecs.push(rec);
  trees.push(g); town.add(g); solidBoxes.push(box);
  return g;
}

// the quarry: a levelled gravel floor of copper and tin rocks, fenced in with a gap facing the smithy road
function buildQuarry(){
  const { x: QX, z: QZ, r: QR } = QUARRY;
  let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(128,112,92,1)'); grd.addColorStop(0.82, 'rgba(120,104,84,1)'); grd.addColorStop(1, 'rgba(120,104,84,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) { const x = R() * S, y = R() * S; if (Math.hypot(x - S / 2, y - S / 2) > S * 0.46) continue;
    const c = 80 + R() * 90; g.fillStyle = `rgba(${c},${c * 0.94},${c * 0.86},.8)`; g.beginPath(); g.ellipse(x, y, 1 + R() * 4, 1 + R() * 3, R() * 3, 0, 7); g.fill(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(QR + 2.5, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  floor.position.set(QX, 0.04, QZ); floor.receiveShadow = true; town.add(floor);
  // a post-and-rail fence round the edge, open towards the smithy road
  const gateA = Math.atan2(-9.6, 8.6), gap = 0.28, N = 36;
  const post = new THREE.BoxGeometry(0.24, 1.45, 0.24), postM = mat(0x7a5a36), railM = mat(0x8a6a42);
  const at = a => [QX + Math.cos(a) * QR, QZ + Math.sin(a) * QR];
  const diff = a => Math.abs(Math.atan2(Math.sin(a - gateA), Math.cos(a - gateA)));
  for (let i = 0; i < N; i++) {
    const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
    if (diff(a0) < gap || diff(a1) < gap) continue;
    const [x0, z0] = at(a0), [x1, z1] = at(a1);
    const p = new THREE.Mesh(post, postM); p.position.set(x0, 0.72, z0); p.castShadow = true; town.add(p);
    if (diff(a1 + 0.01) < gap + 0.2) { const p2 = new THREE.Mesh(post, postM); p2.position.set(x1, 0.72, z1); p2.castShadow = true; town.add(p2); }
    const L = Math.hypot(x1 - x0, z1 - z0);
    for (const y of [0.55, 1.15]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, L), railM); r.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); r.rotation.y = Math.atan2(x1 - x0, z1 - z0); r.castShadow = true; town.add(r); }
    for (const t of [0, 0.5]) solidAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 0.6);
  }
  // a lamp by the way in
  const [lx, lz] = at(gateA + gap + 0.12); lamp(lx + 0.8, lz - 0.8);
  // five copper rocks to the west and five tin to the east
  [[-8, -3, 'copper'], [-9, 2.5, 'copper'], [-6, 7, 'copper'], [-3.5, -7.5, 'copper'], [-2.5, 1.5, 'copper'],
   [3.5, 9, 'tin'], [8, 4.5, 'tin'], [2.5, 4.5, 'tin'], [0.5, -3, 'tin'], [-1, 9.5, 'tin']]
    .forEach(([dx, dz, ore]) => makeRock(QX + dx, QZ + dz, 1.2, ore));
}

const equipped = { head: null, back: null, body: null, legs: null, feet: null, weapon: null, shield: null };   // what is worn in each slot
// ----- the adventurer -----
const START = new THREE.Vector3(HALL.x, 0, HALL.z + 2.4 * HALL_SCALE);   // the spawn point: inside the hall, just south of the centre pillar
const hex = n => '#' + n.toString(16).padStart(6, '0');
// shade a colour: amt > 0 lightens, amt < 0 darkens
function shade(rgb, amt){
  const f = v => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  return `rgb(${f(rgb[0])},${f(rgb[1])},${f(rgb[2])})`;
}
const rgbOf = n => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
// ----- the adventurers: chibi toy figures (big round heads, shiny eyes, smooth toon shading and a dark outline) -----
// Every character, the hero, villagers and other players, is built by makeChibi and moved by poseChibi.
const CHIBI_SCALE = 1.35;   // the model is built about 2.7 tall; this makes it about 3.6, the height of the old sprites
const toonRamp = (() => { const t = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toonCache = {}, geoCache = {};
const toonMat = c => toonCache[c] || (toonCache[c] = new THREE.MeshToonMaterial({ color: c, gradientMap: toonRamp }));
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x1a1410, side: THREE.BackSide });
const geo = (key, make) => geoCache[key] || (geoCache[key] = make());
const gRound = (r, seg = 24) => geo('s' + r + '|' + seg, () => new THREE.SphereGeometry(r, seg, Math.round(seg * 3 / 4)));
const gCapsule = (r, l) => geo('c' + r + '|' + l, () => new THREE.CapsuleGeometry(r, l, 6, 14));
function chibiPart(parent, g, col, x, y, z, outline = true){
  const m = new THREE.Mesh(g, toonMat(col)); m.position.set(x, y, z); m.castShadow = true; m.userData.shadowSet = true; parent.add(m);
  if (outline) { const o = new THREE.Mesh(g, outlineMat); o.scale.setScalar(1.07); o.userData.shadowSet = true; m.add(o); }
  return m;
}
const flatMat = {};
const basic = (c, op = 1) => flatMat[c + '|' + op] || (flatMat[c + '|' + op] = new THREE.MeshBasicMaterial({ color: c, transparent: op < 1, opacity: op }));
// the tools, held in the right hand: the handle runs from the hand along -y, and the working end faces -z,
// which is the way the arm travels as it swings down (so the axe edge and the pick point lead the blow)
function makeTool(kind){
  const t = new THREE.Group();
  chibiPart(t, geo('handle', () => new THREE.CylinderGeometry(0.045, 0.055, 1.35, 6)), 0x7a4d22, 0, -0.5, 0);
  if (kind === 'hoe') {   // a flat iron blade at right angles to the handle, its edge facing -z so it bites into the soil on the down stroke
    chibiPart(t, geo('hoeNeck', () => new THREE.BoxGeometry(0.07, 0.07, 0.2)), 0x5a5a62, 0, -1.15, -0.08);
    chibiPart(t, geo('hoeBlade', () => new THREE.BoxGeometry(0.34, 0.26, 0.04)), 0x8a9099, 0, -1.28, -0.18).rotation.x = 0.35;
  } else if (kind === 'can') {   // a watering can, upright in the hand: a green tin body, a long spout forward, a handle over the top
    t.children[0].visible = false;   // no wooden handle on this one
    chibiPart(t, geo('canBody', () => new THREE.CylinderGeometry(0.2, 0.22, 0.36, 12)), 0x6a8a5a, 0, -0.1, 0.12);
    const sp = chibiPart(t, geo('canSpout', () => new THREE.CylinderGeometry(0.03, 0.05, 0.5, 6)), 0x6a8a5a, 0, -0.02, 0.48); sp.rotation.x = 1.0;
    chibiPart(t, geo('canRose', () => new THREE.CylinderGeometry(0.07, 0.04, 0.06, 8)), 0x5a7a4a, 0, 0.1, 0.7).rotation.x = 1.0;
    chibiPart(t, geo('canGrip', () => new THREE.TorusGeometry(0.14, 0.025, 5, 10, Math.PI)), 0x4a6a3a, 0, 0.08, 0.12, false).rotation.y = Math.PI / 2;
    t.userData.spout = new THREE.Object3D(); t.userData.spout.position.set(0, 0.1, 0.74); t.add(t.userData.spout);
  } else if (kind === 'pick') {
    chibiPart(t, geo('pickHead', () => new THREE.BoxGeometry(0.12, 0.12, 0.7)), 0xcd7f32, 0, -1.12, 0);
    for (const s of [-1, 1]) { const tip = chibiPart(t, geo('pickTip', () => new THREE.ConeGeometry(0.065, 0.3, 6)), 0xcd7f32, 0, -1.16, s * 0.48); tip.rotation.x = s * (Math.PI / 2 + 0.3); }
  } else {
    // a real axe head, seen side on: the eye round the handle, a narrow neck, then the blade flaring out to a wide, slightly curved edge
    // that drops into a beard at the bottom; flat along x, the edge facing -z
    const head = chibiPart(t, geo('axeHead2', () => { const sh = new THREE.Shape();
      sh.moveTo(-0.07, 0.11); sh.lineTo(0.2, 0.1); sh.quadraticCurveTo(0.34, 0.11, 0.46, 0.15);   // the straight top, lifting a touch to the toe
      sh.quadraticCurveTo(0.5, -0.05, 0.44, -0.27);   // the edge, bowed out a little
      sh.quadraticCurveTo(0.3, -0.17, 0.2, -0.08); sh.lineTo(0.12, -0.1); sh.lineTo(-0.07, -0.1); sh.lineTo(-0.07, 0.11);   // the beard sweeping back to the neck and eye
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1, curveSegments: 6 });
      g.translate(0, 0, -0.04); g.rotateY(Math.PI / 2); return g; }), 0xcd7f32, 0, -1.08, -0.02);
    chibiPart(t, geo('axePoll', () => new THREE.BoxGeometry(0.1, 0.2, 0.1)), 0x9a5e22, 0, -1.08, 0.09);   // the butt behind the handle
  }
  t.visible = false;
  return t;
}
