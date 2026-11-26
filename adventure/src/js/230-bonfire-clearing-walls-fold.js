// ----- the bonfire clearing in the oak grove, south-west of the hall: a stone fire pit, two rings of log benches and two ways in -----
const BF = { x: 1, z: 33, inR: 4.4, outR: 8, clearR: 10.5, north: -Math.PI / 2, green: Math.atan2(10 - 33, -40 - 1), seats: [], benches: [] };
function bonfireRoads(){
  roadPath([[-1, 13.5], [-0.5, 20], [BF.x, BF.z - BF.clearR + 1]]);   // in from the hall road
  roadPath([[-24, 12], [-15, 19], [BF.x + Math.cos(BF.green) * (BF.clearR - 1), BF.z + Math.sin(BF.green) * (BF.clearR - 1)]]);   // in from the green
}
function buildBonfire(){
  let q = 11; const R = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const add = (geo, m, x, y, z, parent = town) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  // trodden earth, fading into the grass at the edge
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(110,86,58,1)'); grd.addColorStop(0.75, 'rgba(118,94,64,.9)'); grd.addColorStop(1, 'rgba(118,94,64,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) { const x = R() * S, y = R() * S; if (Math.hypot(x - S / 2, y - S / 2) > S * 0.42) continue; const c = 70 + R() * 60; g.fillStyle = `rgba(${c},${c * 0.85},${c * 0.65},.7)`; g.fillRect(x, y, 2 + R() * 3, 2 + R() * 2); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(BF.clearR + 1, 56).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  floor.position.set(BF.x, 0.03, BF.z); floor.receiveShadow = true; town.add(floor);
  // the pit: a ring of stones, ash, and a tent of logs; clicking it adds a log while the fire burns
  const pit = new THREE.Group(); pit.position.set(BF.x, 0, BF.z); town.add(pit);
  const stone = [0x6e6a62, 0x5c5850, 0x7d786f];
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; add(new THREE.DodecahedronGeometry(0.34 + R() * 0.1, 0), mat(stone[i % 3]), Math.cos(a) * 1.7, 0.2, Math.sin(a) * 1.7, pit); }
  add(new THREE.CircleGeometry(1.6, 24).rotateX(-Math.PI / 2), mat(0x241a14), 0, 0.05, 0, pit);
  const logM = mat(0x5a3a20), charM = mat(0x2a1a12);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, l = add(new THREE.CylinderGeometry(0.15, 0.18, 2.1, 6), i % 2 ? logM : charM, Math.cos(a) * 0.45, 0.62, Math.sin(a) * 0.45, pit);
    l.rotation.set(0, -a, 0); l.rotateZ(0.95); }
  solidAt(BF.x, BF.z, 1.4);
  BF.pit = pit; pit.userData.action = 'Fire pit'; pit.userData.name = 'Bonfire';
  BF.rec = { kind: 'bonfire', state: 'standing', x: BF.x, z: BF.z, onClick: () => bonfireClick() }; pit.userData.rec = BF.rec; trees.push(pit);
  // the flames: glowing cones that flicker, an orange light that dances with them, and sparks drifting up
  const flameM = [0xffd27a, 0xff9a2a, 0xff5a14].map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, depthWrite: false }));
  BF.flames = [];
  for (let i = 0; i < 14; i++) { const a = R() * 7, d = i ? 0.2 + R() * 0.55 : 0;
    const f = add(new THREE.ConeGeometry(0.3 + R() * 0.18, 1, 6), flameM[i < 4 ? 0 : i < 9 ? 1 : 2], BF.x + Math.cos(a) * d, 0, BF.z + Math.sin(a) * d); f.castShadow = false; f.visible = false;
    BF.flames.push({ f, h: 1.4 + R() * 1.3, p: R() * 7, s: 4 + R() * 4 }); }
  BF.light = new THREE.PointLight(0xff8a3a, 0, 26, 1.5); BF.light.position.set(BF.x, 2, BF.z); scene.add(BF.light);
  const NS = 70; BF.sparkPos = new Float32Array(NS * 3); BF.sparkLife = new Float32Array(NS); for (let i = 0; i < NS; i++) { BF.sparkLife[i] = R() * 3; BF.sparkPos[i * 3 + 1] = -5; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(BF.sparkPos, 3));
  BF.sparks = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffb04a, size: 0.09, transparent: true, depthWrite: false })); BF.sparks.frustumCulled = false; scene.add(BF.sparks);
  // log benches: six of two close in, eight of three further out, with gaps for the two ways in
  const near = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const bfBench = (a, r, len, seats) => {
    const bx = BF.x + Math.cos(a) * r, bz = BF.z + Math.sin(a) * r;
    const b = new THREE.Group(); b.position.set(bx, 0, bz); b.rotation.y = -a; town.add(b);
    const seat = add(new THREE.CylinderGeometry(0.32, 0.32, len, 8), mat(0x7a5530), 0, 0.42, 0, b); seat.rotation.x = Math.PI / 2;
    add(new THREE.BoxGeometry(0.62, 0.04, len - 0.1), mat(0x9a7448), 0, 0.73, 0, b);
    for (const sd of [-1, 1]) add(new THREE.BoxGeometry(0.5, 0.3, 0.25), mat(0x5a3a20), 0, 0.15, sd * (len / 2 - 0.35), b);
    const tx = -Math.sin(a), tz = Math.cos(a);
    const bench = { a, seats: [] };
    for (let i = 0; i < seats; i++) { const o = (i - (seats - 1) / 2) * (len / seats), idx = BF.seats.length;
      const st = { idx, a, x: BF.x + Math.cos(a) * (r + 0.15) + tx * o, z: BF.z + Math.sin(a) * (r + 0.15) + tz * o };
      st.ax = st.x + Math.cos(a) * 1.15; st.az = st.z + Math.sin(a) * 1.15;   // where you stand to sit down: just behind the log
      BF.seats.push(st); bench.seats.push(st); }
    b.userData.action = 'Sit'; b.userData.name = 'Log bench';
    b.userData.rec = { kind: 'bench', state: 'standing', x: bx, z: bz, onClick: () => benchClick(bench) }; trees.push(b);
    BF.benches.push(bench);
  };
  for (let i = 1; i < 7; i++) bfBench(BF.north + i * Math.PI * 2 / 7, BF.inR, 2.3, 2);
  for (let i = 0; i < 10; i++) { const a = BF.north + i * Math.PI * 2 / 10; if (near(a, BF.north) > 0.3 && near(a, BF.green) > 0.32) bfBench(a, BF.outR, 3.3, 3); }
}
// random oaks through the village: a seeded spread, kept clear of buildings, roads, the hall, the well and the river
function scatterOaks(){
  const rand = (() => { let q = 2024; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
  const segDist = (px, pz, [x1, z1, x2, z2]) => {
    const dx = x2 - x1, dz = z2 - z1, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / L));
    return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
  };
  const clear = (x, z) => {
    if (x < -100 || x > 52 || z < -8 || z > 58) return false;
    if (Math.hypot(x - BF.x, z - BF.z) < 19) return false;   // the bonfire clearing and its ring of oaks
    if (x > 30 && x < 62 && z > -13 && z < 14) return false;   // the farm
    if (x > 24 && x < 56 && z > 33 && z < 64) return false;   // open ground round the smithy
    if (solidBoxes.some(b => x > b.x0 - 5 && x < b.x1 + 5 && z > b.z0 - 5 && z < b.z1 + 5)) return false;   // houses, nodes and the well: a canopy's width plus room to walk round
    if (x > -1 && x < 34 && z > -12 && z < 18) return false;     // the hall and its doorway, with room round the walls
    if (ROADS.some(r => segDist(x, z, r) < 3.5)) return false;   // roads
    if (oakSpots.some(o => Math.hypot(o[0] - x, o[1] - z) < 6)) return false;   // trees keep room between them
    if (NPC_SPOTS.some(o => Math.hypot(o[0] - x, o[1] - z) < 5)) return false;   // and from the townsfolk, stalls and benches
    return true;
  };
  // three oaks round the far side of the bonfire clearing, south-west of the spawn hall
  const oakSpots = [[0.5, 16.5], [1.6, 17], [2.6, 16.5]].map(([a, r]) => [BF.x + Math.cos(a) * r, BF.z + Math.sin(a) * r]);
  oakSpots.forEach(([x, z]) => makeTree(x, z, 1.5, true));
  buildBonfire();
  // the rest of the village trees are ordinary trees
  let placed = 0, tries = 0;
  while (placed < 21 && tries < 4000) {
    tries++;
    const x = -100 + rand() * 152, z = -8 + rand() * 66;
    if (!clear(x, z)) continue;
    makeTree(x, z, 1.4 + rand() * 0.3, false);
    placed++;
  }
}
populateVillage();
// ----- walls fold flat while you're inside: the walls and door fade away, leaving a low outline of each wall on the floor -----
const FOLDS = [];
function addFold(group, parts, isInside){
  const mats = [], outline = new THREE.Group(); group.add(outline);
  for (const p of parts) p.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); mats.push(m.material); } });
  for (const w of parts) {
    if (!w.isMesh || w.geometry.type !== 'BoxGeometry' || w.userData.deco) continue;
    const g = w.geometry.parameters; if (g.height < 2) continue;   // only the full-height walls get an outline, not lintels
    const col = (w.material.color ? w.material.color.clone() : new THREE.Color(0x888888)).multiplyScalar(0.55);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(g.width, 0.14, g.depth), new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, transparent: true, opacity: 0 }));
    strip.position.set(w.position.x, 0.07, w.position.z); strip.rotation.y = w.rotation.y; strip.userData.shadowSet = true; outline.add(strip);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(strip.geometry), new THREE.LineBasicMaterial({ color: 0xf0c35a, transparent: true, opacity: 0 }));
    edge.position.copy(strip.position); edge.rotation.copy(strip.rotation); outline.add(edge);
  }
  outline.visible = false;
  FOLDS.push({ parts, mats, outline, isInside, k: 1 });
}
for (const h of houses) {
  const g = h.roof.parent;
  const parts = g.children.filter(m => (m.isMesh && m !== h.roof && m.geometry.type === 'BoxGeometry' && m.position.y > 0.5) || (m.isGroup && m.children.some(c => c.userData && c.userData.action === 'Open')));
  addFold(g, parts, () => Math.abs(hero.position.x - h.x) < h.hw && Math.abs(hero.position.z - h.z) < h.hd);
}
hallOverhaul();
addFold(hallGroup, hallGroup.children.filter(m => (m.isMesh && (hallWallMats.includes(m.material) || m.material.map === bannerMap)) || m === doorPivot || (m.isGroup && m.children.some(c => hallWallMats.includes(c.material)))), () => Math.abs(hero.position.x - HALL.x) < 7 * HS && Math.abs(hero.position.z - HALL.z) < 6 * HS);
// the camera: inside, it eases in closer so the room fills the screen; outside it goes back to where you had it
let indoor = false, savedDist = 30, camEase = null, foldT = performance.now();
function updateFolds(){
  if (!hero) return;
  const now = performance.now(), step = 1 - Math.exp(-(now - foldT) / 90);   // about a third of a second, however fast the screen draws
  foldT = now;
  let any = false;
  for (const f of FOLDS) {
    const inside = f.isInside(); any = any || inside;
    f.k += ((inside ? 0 : 1) - f.k) * step;
    if (Math.abs(f.k - (inside ? 0 : 1)) < 0.03) f.k = inside ? 0 : 1;
    const k = f.k;
    for (const m of f.mats) { m.opacity = k; m.transparent = k < 1; m.depthWrite = k > 0.5; }
    for (const p of f.parts) p.visible = k > 0.02;
    f.outline.visible = k < 0.98;
    f.outline.children.forEach(o => { o.material.opacity = 1 - k; });
  }
  if (!creator.hidden) { indoor = false; camEase = null; return; }   // the character creator frames its own shot
  if (any && !indoor) { indoor = true; savedDist = dist; camEase = Math.min(dist, 15); }
  if (!any && indoor) { indoor = false; camEase = savedDist; }
  if (camEase !== null) { dist += (camEase - dist) * Math.min(1, step * 0.6); if (Math.abs(camEase - dist) < 0.05) camEase = null; }
}

// ----- start -----
renderCreator();
rebuildHero();
if (lookMade) { target.set(START.x, 1, START.z); dist = 30; }
else openCreator();

// ----- online: the village is shared. Players, trees and rocks, and progress are kept in the database -----
const DB = 'https://space-dodger-1a558-default-rtdb.firebaseio.com';
