// ===== the cave under the east hills: a dungeon of fights, skilling rooms and locked doors, with a cave troll at the end =====
// Solo. It sits far off the map (z 598 to 694): what you drop down here is yours alone, and nobody else is seen (inCaveZone).
// Progress is kept in the save (cd: CAVE_P) until the troll falls, then the next trip starts fresh.
const inCaveZone = (x, z) => z > 550;
const CAVE_GRID = { X0: -70, Z0: 590, NX: 281, NZ: 221 };   // the walking grid down here (x -70..70, z 590..700), half a unit a cell
let CAVE_P = {};
let caveBuilt = false, caveJob = null;
const CAVE_ROOMS = {
  entry: { x0: -7, x1: 7, z0: 680, z1: 694, name: 'The way in' },
  gate: { x0: -10, x1: 10, z0: 658, z1: 676, name: 'The gatehouse' },
  grotto: { x0: -36, x1: -14, z0: 658, z1: 676, name: 'The grotto' },
  hub: { x0: -11, x1: 11, z0: 632, z1: 654, name: 'The rune hall' },
  chasm: { x0: -38, x1: -15, z0: 635, z1: 651, name: 'The chasm' },
  braz: { x0: -60, x1: -42, z0: 633, z1: 653, name: 'The fire shrine' },
  mine: { x0: 15, x1: 37, z0: 635, z1: 651, name: 'The old mine' },
  forge: { x0: 41, x1: 61, z0: 633, z1: 653, name: 'The goblin forge' },
  boss: { x0: -14, x1: 14, z0: 600, z1: 628, name: "The troll's den" },
};
// the passages between the rooms, each 4.4 wide
const CAVE_HALLS = [[-2.2, 2.2, 676, 680], [-2.2, 2.2, 654, 658], [-14, -10, 664.8, 669.2], [-15, -11, 640.8, 645.2], [-42, -38, 640.8, 645.2], [11, 15, 640.8, 645.2], [37, 41, 640.8, 645.2], [-2.2, 2.2, 628, 632]];
const CHASM = { x0: -29, x1: -25, bz0: 640.6, bz1: 645.4 };   // the drop across the chasm room, and where the felled tree bridges it
const PLATES_AT = [0, 1, 2, 3, 4].map(i => { const a = i / 5 * Math.PI * 2; return [Math.sin(a) * 5, 643 + Math.cos(a) * 5]; });
const BRAZIERS = [[-55.5, 637.5], [-46.5, 637.5], [-55.5, 648.5], [-46.5, 648.5]];
const BRAZ_MS = 40000;   // how long a brazier burns once lit
const WEBS = [[-35.6, 673.6, -1], [-17, 675.6, 1], [-32.6, 658.4, 0]];   // [x, z, which wall: -1 west, 1 south, 0 north]
const CV_AT = { arrive: [0, 688.5], rope: [0, 692.2], tree: [-22.8, 643], root: [-51, 651.4], altar: [-51, 635.2], wall: [39, 643], vein: [60.2, 637], furnace: [57.5, 650.5], anvil: [50.5, 650.5],
  pool: [-29.5, 671.5], fire: [-19.5, 671.5], hollis: [-34.2, 664.5], patch: [-21, 660.6], ledge: [-25.5, 658.4], bossChest: [0, 611], bossRope: [0, 602.5] };
Object.assign(MONSTER_TYPES, {   /* the forest's level 15 to 20 range, ITAP's goblin numbers for the goblins */
  caveGoblin: { name: 'Cave goblin', model: 'goblin', skin: 0x7c8a5e, shirt: 0x3a3430, pants: 0x2a2622, level: 15, hp: 35, melee: 15, atk: 15, def: 5, maxHit: 3, speed: 2600, respawn: 0, snd: 'goblin', coins: [8, 24] },
  blindRat: { name: 'Blind rat', model: 'rat', level: 14, hp: 30, melee: 14, atk: 12, def: 8, maxHit: 3, speed: 2300, respawn: 0, snd: 'rat', coins: [0, 0], scale: 1.35 },
  goblinSmith: { name: 'Goblin smith', model: 'goblin', skin: 0x8a8a5a, shirt: 0x4a2a1a, pants: 0x2a1a12, level: 18, hp: 45, melee: 18, atk: 18, def: 12, maxHit: 4, speed: 2600, respawn: 0, snd: 'goblin', coins: [15, 40], scale: 1.15, metal: true },
  caveTroll: { name: 'Cave troll', model: 'goblin', skin: 0x7c8088, shirt: 0x4a3a2a, pants: 0x3a3028, level: 20, hp: 60, melee: 20, atk: 16, def: 10, maxHit: 4, speed: 3200, respawn: 0, snd: 'goblin', coins: [0, 0], scale: 1.7, reach: 3.3, barY: 5.2 },
});
const CAVE_MONS = { gate: [['caveGoblin', -5, 664], ['caveGoblin', 5, 665]], chasm: [['caveGoblin', -34, 639]], mine: [['blindRat', 22, 639], ['blindRat', 31, 647]], forge: [['goblinSmith', 51, 644], ['caveGoblin', 56, 638]] };
const caveRoomAt = (x, z) => Object.keys(CAVE_ROOMS).find(k => { const r = CAVE_ROOMS[k]; return x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1; }) || null;
function caveExitSpot(){ return openSpotNear(NORTH.cave.x - 3.4, NORTH.cave.z + 0.5); }
function caveLoadP(d){ CAVE_P = d && typeof d === 'object' && !Array.isArray(d) ? { ...d } : {}; if (!Array.isArray(CAVE_P.pl) || CAVE_P.pl.length !== 5) CAVE_P.pl = [0, 1, 0, 0, 0]; }
caveLoadP(null);

// ----- building it, once, the first time anyone goes in -----
const CV = {};   // the moving and clickable parts
function buildCave(){
  if (caveBuilt) return; caveBuilt = true;
  let q = 77; const R = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const rockParts = [], darkParts = [], GREYS = [0x5e574e, 0x4e4840, 0x6a6256, 0x45403a], c = new THREE.Color();
  const colour = (g, col, vary = 0.12) => { g = g.index ? g.toNonIndexed() : g; if (g.attributes.uv) g.deleteAttribute('uv'); g.computeVertexNormals(); const a = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < a.length; i += 9) { c.set(col).multiplyScalar(1 - vary + R() * vary * 2); for (let k = 0; k < 9; k += 3) a.set([c.r, c.g, c.b], i + k); } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const rock = (x, y, z, sx, sy, sz, col = GREYS[(R() * 4) | 0]) => { const g = new THREE.IcosahedronGeometry(1, 0); g.scale(sx, sy, sz); g.rotateY(R() * 6); g.translate(x, y, z); rockParts.push(colour(g, col)); };
  const vmat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });
  const merged = (parts, m = vmat) => { const o = new THREE.Mesh(mergeGeometries(parts), m); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
  const add = (geo, m, x, y, z, parent = scene) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  // the floor: a rough stone texture laid by world position, so every room and passage lines up
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g2 = cv.getContext('2d');
  g2.fillStyle = '#6a6258'; g2.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { const v = 70 + R() * 60; g2.fillStyle = `rgba(${v},${v * 0.93},${v * 0.84},.5)`; g2.fillRect(R() * 256, R() * 256, 1 + R() * 4, 1 + R() * 3); }
  for (let i = 0; i < 40; i++) { g2.strokeStyle = 'rgba(40,34,28,.35)'; g2.lineWidth = 1 + R() * 2; g2.beginPath(); let x = R() * 256, y = R() * 256; g2.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 50; y += (R() - 0.5) * 50; g2.lineTo(x, y); } g2.stroke(); }
  const ftex = new THREE.CanvasTexture(cv); ftex.wrapS = ftex.wrapT = THREE.RepeatWrapping; ftex.colorSpace = THREE.SRGBColorSpace;
  const floors = [], rect = (x0, x1, z0, z1) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
    const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 7, p.getZ(i) / 7); floors.push(g); };
  for (const k in CAVE_ROOMS) { const r = CAVE_ROOMS[k]; if (k === 'chasm') { rect(r.x0 - 0.5, CHASM.x0, r.z0 - 0.5, r.z1 + 0.5); rect(CHASM.x1, r.x1 + 0.5, r.z0 - 0.5, r.z1 + 0.5); } else rect(r.x0 - 0.5, r.x1 + 0.5, r.z0 - 0.5, r.z1 + 0.5); }
  for (const [x0, x1, z0, z1] of CAVE_HALLS) rect(x0 - 0.3, x1 + 0.3, z0, z1);
  const floor = new THREE.Mesh(mergeGeometries(floors), new THREE.MeshStandardMaterial({ map: ftex, roughness: 1 })); floor.receiveShadow = true; scene.add(floor);
  // the walls: solid boxes round every room and passage, with gaps where the passages meet them, piled with rough boulders
  const T = 1.4, walls = [];
  const gapsOn = (r, side) => CAVE_HALLS.filter(([x0, x1, z0, z1]) => side === 'n' ? z1 === r.z0 && x1 > r.x0 && x0 < r.x1 : side === 's' ? z0 === r.z1 && x1 > r.x0 && x0 < r.x1 : side === 'w' ? x1 === r.x0 && z1 > r.z0 && z0 < r.z1 : x0 === r.x1 && z1 > r.z0 && z0 < r.z1)
    .map(([x0, x1, z0, z1]) => side === 'n' || side === 's' ? [x0, x1] : [z0, z1]).sort((a, b) => a[0] - b[0]);
  const run = (a, b, gaps, make) => { let s = a; for (const [g0, g1] of gaps) { if (g0 > s) make(s, g0); s = Math.max(s, g1); } if (b > s) make(s, b); };
  for (const k in CAVE_ROOMS) { const r = CAVE_ROOMS[k];
    run(r.x0 - T, r.x1 + T, gapsOn(r, 'n'), (a, b) => walls.push({ x0: a, x1: b, z0: r.z0 - T, z1: r.z0 }));
    run(r.x0 - T, r.x1 + T, gapsOn(r, 's'), (a, b) => walls.push({ x0: a, x1: b, z0: r.z1, z1: r.z1 + T }));
    run(r.z0, r.z1, gapsOn(r, 'w'), (a, b) => walls.push({ x0: r.x0 - T, x1: r.x0, z0: a, z1: b }));
    run(r.z0, r.z1, gapsOn(r, 'e'), (a, b) => walls.push({ x0: r.x1, x1: r.x1 + T, z0: a, z1: b })); }
  for (const [x0, x1, z0, z1] of CAVE_HALLS) { if (Math.abs(x1 - x0 - 4.4) < 0.01) {   /* running north-south: walls either side in x */ walls.push({ x0: x0 - T, x1: x0, z0, z1 }, { x0: x1, x1: x1 + T, z0, z1 }); } else walls.push({ x0, x1, z0: z0 - T, z1: z0 }, { x0, x1, z0: z1, z1: z1 + T }); }
  for (const w of walls) { solidBoxes.push(w); const along = w.x1 - w.x0 > w.z1 - w.z0, L = along ? w.x1 - w.x0 : w.z1 - w.z0, n = Math.max(1, Math.round(L / 1.5));
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = along ? w.x0 + t * (w.x1 - w.x0) : (w.x0 + w.x1) / 2, z = along ? (w.z0 + w.z1) / 2 : w.z0 + t * (w.z1 - w.z0);
      rock(x + (R() - 0.5) * 0.3, 0.7, z + (R() - 0.5) * 0.3, 1.0 + R() * 0.5, 1.2 + R() * 0.4, 1.0 + R() * 0.5);   /* kept low (about 2.3), so the game camera sees over them */
      if (i % 3 === 1) rock(x + (R() - 0.5) * 0.4, 1.8, z + (R() - 0.5) * 0.4, 0.6 + R() * 0.3, 0.5 + R() * 0.3, 0.6 + R() * 0.3); } }
  // stalagmites in the corners, small stones on the floor along the walls
  for (const k in CAVE_ROOMS) { const r = CAVE_ROOMS[k];
    for (const [x, z] of [[r.x0 + 1.2, r.z0 + 1.2], [r.x1 - 1.2, r.z0 + 1.2], [r.x0 + 1.2, r.z1 - 1.2], [r.x1 - 1.2, r.z1 - 1.2]]) { const h = 1.6 + R() * 1.6, g = new THREE.ConeGeometry(0.45 + R() * 0.25, h, 6); g.translate(x, h / 2, z); rockParts.push(colour(g, GREYS[(R() * 4) | 0])); solidBoxes.push({ x0: x - 0.5, x1: x + 0.5, z0: z - 0.5, z1: z + 0.5 }); }
    for (let i = 0; i < 10; i++) { const side = (R() * 4) | 0, t = R(), x = side < 2 ? r.x0 + t * (r.x1 - r.x0) : side === 2 ? r.x0 + 0.5 : r.x1 - 0.5, z = side < 2 ? (side ? r.z1 - 0.5 : r.z0 + 0.5) : r.z0 + t * (r.z1 - r.z0); const s = 0.15 + R() * 0.25; rock(x, s * 0.4, z, s * 1.3, s * 0.7, s); } }
  // the torches on the walls: the only light down here, through the shared lamp lights (no new lights)
  const flames = [];
  for (const k in CAVE_ROOMS) { const r = CAVE_ROOMS[k];
    for (const [x, z, dx, dz] of [[(r.x0 + r.x1) / 2 - (r.x1 - r.x0) / 4, r.z0 + 0.15, 0, 1], [(r.x0 + r.x1) / 2 + (r.x1 - r.x0) / 4, r.z0 + 0.15, 0, 1], [r.x0 + 0.15, (r.z0 + r.z1) / 2 + 4.5, 1, 0], [r.x1 - 0.15, (r.z0 + r.z1) / 2 + 4.5, -1, 0]]) {
      if (k === 'chasm' && dx === 0 && x > CHASM.x0 - 1 && x < CHASM.x1 + 1) continue;
      const s = new THREE.BoxGeometry(0.16, 0.7, 0.16); s.rotateX(dz * 0.4); s.rotateZ(-dx * 0.4); s.translate(x + dx * 0.25, 1.9, z + dz * 0.25); darkParts.push(colour(s, 0x2a2018, 0.05));
      const f = new THREE.ConeGeometry(0.17, 0.5, 6); f.translate(x + dx * 0.42, 2.45, z + dz * 0.42); flames.push(f); LIGHT_SPOTS.push([x + dx * 1.4, 2.8, z + dz * 1.4]); } }
  merged(rockParts); merged(darkParts);
  const flameM = new THREE.MeshBasicMaterial({ color: 0xffa040 }); scene.add(new THREE.Mesh(mergeGeometries(flames), flameM));
  // ----- the way in: a rope hanging down from a shaft of daylight -----
  { const [x, z] = CV_AT.rope; const rope = add(new THREE.CylinderGeometry(0.07, 0.07, 9, 6), 0xa08850, x, 4.5, z);
    const shaft = add(new THREE.CylinderGeometry(1.6, 2.4, 10, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }), x, 5, z); shaft.castShadow = false;
    const hit = add(new THREE.BoxGeometry(1.6, 5, 1.6), new THREE.MeshBasicMaterial({ visible: false }), x, 2.5, z);
    cvClick(hit, 'Climb', 'Rope', () => caveGo(x, z, 1.8, () => leaveCave('You climb the rope back up into the daylight.')), x, z); solidBoxes.push({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3 }); rope.name = 'rope'; }
  // ----- the gatehouse: a portcullis into the rune hall, raised once the goblins are dealt with -----
  { const G = new THREE.Group(); G.position.set(0, 0, 656); scene.add(G); const iron = mat(0x34343a);
    for (let i = 0; i < 7; i++) add(new THREE.BoxGeometry(0.14, 4.2, 0.14), iron, -1.95 + i * 0.65, 2.1, 0, G);
    for (const y of [0.7, 2.0, 3.3]) add(new THREE.BoxGeometry(4.3, 0.14, 0.14), iron, 0, y, 0, G);
    for (let i = 0; i < 7; i++) add(new THREE.ConeGeometry(0.1, 0.3, 4), iron, -1.95 + i * 0.65, -0.05, 0, G).rotation.x = Math.PI;
    add(new THREE.BoxGeometry(6.2, 0.9, 1.2), texMat(wallStone, 2, 1, 0x8a847a), 0, 5.6, 656);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.9, 5.2, 1.2), texMat(wallStone, 1, 2, 0x8a847a), s * 2.65, 2.6, 656);
    CV.portcullis = caveBar(G, { x0: -2.2, x1: 2.2, z0: 655.4, z1: 656.6 }); CV.portcullis.lift = 4.6; }
  // ----- the rune hall: five stones in the floor (step on one and it and its neighbours flip), and the two sealed ways on -----
  { const runeCv = document.createElement('canvas'); runeCv.width = runeCv.height = 128; const rg = runeCv.getContext('2d');
    rg.fillStyle = '#000'; rg.fillRect(0, 0, 128, 128); rg.strokeStyle = '#fff'; rg.lineWidth = 7; rg.lineCap = 'round';
    rg.beginPath(); rg.arc(64, 64, 50, 0, 7); rg.stroke(); rg.beginPath(); rg.moveTo(64, 26); rg.lineTo(64, 102); rg.moveTo(40, 46); rg.lineTo(88, 82); rg.moveTo(88, 46); rg.lineTo(40, 82); rg.stroke();
    const runeTex = new THREE.CanvasTexture(runeCv);
    CV.plates = PLATES_AT.map(([x, z], i) => { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      add(new THREE.CylinderGeometry(1.25, 1.35, 0.14, 16), 0x5a5650, 0, 0.07, 0, g);
      const glow = new THREE.MeshStandardMaterial({ color: 0x223038, emissive: 0x40e0ff, emissiveIntensity: 0, alphaMap: runeTex, transparent: true, depthWrite: false });
      const face = add(new THREE.CircleGeometry(1.0, 24).rotateX(-Math.PI / 2), glow, 0, 0.15, 0, g); face.castShadow = false;
      const hit = add(new THREE.CylinderGeometry(1.3, 1.3, 0.6, 12), new THREE.MeshBasicMaterial({ visible: false }), 0, 0.3, 0, g);
      cvClick(hit, 'Step on', 'Rune stone', () => plateClick(i), x, z); return { g, glow }; });
    // the rune seal over the way east
    const seal = new THREE.Group(); seal.position.set(13, 0, 643); scene.add(seal);
    const sealM = new THREE.MeshStandardMaterial({ color: 0x40505a, emissive: 0x40c8ff, emissiveIntensity: 0.6, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    add(new THREE.PlaneGeometry(4.4, 4.6).rotateY(Math.PI / 2), sealM, 0, 2.3, 0, seal).castShadow = false;
    const sr = add(new THREE.PlaneGeometry(3, 3).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xbff4ff, alphaMap: runeTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), 0.02, 2.3, 0, seal); sr.castShadow = false;
    const sh = add(new THREE.BoxGeometry(1.2, 4.6, 4.4), new THREE.MeshBasicMaterial({ visible: false }), 0, 2.3, 0, seal);
    cvClick(sh, 'Look at', 'Rune seal', () => showToast('A wall of cold blue light. The runes on it match the stones in the floor.'), 13, 643);
    CV.seal = caveBar(seal, { x0: 12.4, x1: 13.6, z0: 640.8, z1: 645.2 }); CV.sealM = sealM;
    // the great door north: three locks
    const door = new THREE.Group(); door.position.set(0, 0, 630); scene.add(door); const oak = texMat(woodTex(), 1, 2, 0x6a4a2c), band = mat(0x3a3a40);
    CV.doorL = new THREE.Group(); CV.doorL.position.set(-2.2, 0, 0); door.add(CV.doorL); CV.doorR = new THREE.Group(); CV.doorR.position.set(2.2, 0, 0); door.add(CV.doorR);
    for (const [leaf, s] of [[CV.doorL, 1], [CV.doorR, -1]]) { add(new THREE.BoxGeometry(2.2, 4.8, 0.3), oak, s * 1.1, 2.4, 0, leaf); for (const y of [0.8, 2.4, 4.0]) add(new THREE.BoxGeometry(2.2, 0.16, 0.36), band, s * 1.1, y, 0, leaf); }
    CV.locks = [['ember', 0xff7a30, -0.9], ['iron', 0x9aa0a8, 0], ['tide', 0x40a0ff, 0.9]].map(([k, col, x]) => { const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.15, roughness: 0.4 });
      const l = add(new THREE.BoxGeometry(0.42, 0.5, 0.12), m, x, 2.5, 0.24, door); add(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 6).rotateX(Math.PI / 2), basic(0x111111), 0, -0.05, 0.03, l); return { k, l, m }; });
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(1.1, 6.2, 1.4), texMat(wallStone, 1, 2, 0x7a746a), s * 2.75, 3.1, 630);
    add(new THREE.BoxGeometry(6.6, 1.1, 1.4), texMat(wallStone, 2, 1, 0x7a746a), 0, 6.3, 630);
    const dh = add(new THREE.BoxGeometry(4.4, 4.8, 1.2), new THREE.MeshBasicMaterial({ visible: false }), 0, 2.4, 630);
    cvClick(dh, 'Open', 'Great door', () => caveGo(0, 630, 2.6, bossDoorClick), 0, 630); CV.doorHit = dh;
    CV.door = caveBar(null, { x0: -2.2, x1: 2.2, z0: 629.4, z1: 630.6 }); }
  // ----- the chasm: a dead tree on the near side, which falls across it as a bridge -----
  { const dark = add(new THREE.PlaneGeometry(CHASM.x1 - CHASM.x0, 17).rotateX(-Math.PI / 2), basic(0x020101), (CHASM.x0 + CHASM.x1) / 2, -0.6, 643); dark.receiveShadow = false;
    const lip = []; for (const x of [CHASM.x0, CHASM.x1]) for (let z = 635.3; z < 651; z += 1.1) { const g = new THREE.IcosahedronGeometry(1, 0); g.scale(0.5, 0.35, 0.6); g.translate(x + (x === CHASM.x0 ? -0.2 : 0.2), -0.05, z); lip.push(colour(g, GREYS[(R() * 4) | 0])); }
    merged(lip);
    CV.chasm = [caveBar(null, { x0: CHASM.x0, x1: CHASM.x1, z0: 634, z1: CHASM.bz0 }), caveBar(null, { x0: CHASM.x0, x1: CHASM.x1, z0: CHASM.bz1, z1: 652 })]; CV.chasmMid = caveBar(null, { x0: CHASM.x0, x1: CHASM.x1, z0: CHASM.bz0, z1: CHASM.bz1 });
    const [tx, tz] = CV_AT.tree, tree = new THREE.Group(); tree.position.set(tx, 0, tz); scene.add(tree); const bark = mat(0x5a4636), barkD = mat(0x3e3026);
    const trunk = new THREE.Group(); tree.add(trunk);   // pivots at its foot, falling west
    add(new THREE.CylinderGeometry(0.75, 1.0, 9, 9).translate(0, 4.5, 0), bark, 0, 0, 0, trunk);
    for (const [y, a, l] of [[5.5, 0.7, 2.6], [6.6, -0.9, 2.2], [7.6, 2.4, 1.8], [4.6, 3.6, 1.9]]) { const b = add(new THREE.CylinderGeometry(0.12, 0.25, l, 6).translate(0, l / 2, 0), barkD, 0, y, 0, trunk); b.rotation.set(0, a, 0.9); }
    const stump = add(new THREE.CylinderGeometry(1.0, 1.15, 0.7, 9), barkD, 0, 0.35, 0, tree); stump.visible = false;
    const hit = add(new THREE.CylinderGeometry(1.2, 1.2, 6, 8), new THREE.MeshBasicMaterial({ visible: false }), 0, 3, 0, tree);
    cvClick(hit, 'Chop down', 'Dead tree', treeClick, tx, tz);
    CV.tree = { tree, trunk, stump, hit, bar: caveBar(null, { x0: tx - 0.6, x1: tx + 0.6, z0: tz - 0.6, z1: tz + 0.6 }) }; }
  // ----- the fire shrine: four braziers to keep burning together, an old root for firewood, and an altar for the key -----
  { const iron = mat(0x34343a), fireM = new THREE.MeshStandardMaterial({ color: 0xffb040, emissive: 0xff7010, emissiveIntensity: 1.6 });
    CV.braz = BRAZIERS.map(([x, z], i) => { add(new THREE.CylinderGeometry(0.16, 0.3, 1.7, 7), iron, x, 0.85, z); add(new THREE.CylinderGeometry(0.85, 0.5, 0.55, 10), iron, x, 1.85, z);
      add(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 10), 0x1a1410, x, 2.06, z); solidBoxes.push({ x0: x - 0.6, x1: x + 0.6, z0: z - 0.6, z1: z + 0.6 });
      const fire = new THREE.Group(); fire.position.set(x, 2.1, z); scene.add(fire); fire.visible = false;
      for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.3 + R() * 0.12, 0.9 + R() * 0.5, 6), fireM); f.position.set((R() - 0.5) * 0.45, 0.4, (R() - 0.5) * 0.45); fire.add(f); }
      const hit = add(new THREE.CylinderGeometry(1, 1, 2.6, 8), new THREE.MeshBasicMaterial({ visible: false }), x, 1.3, z);
      cvClick(hit, 'Light', 'Brazier', () => brazierClick(i), x, z); return { x, z, fire, spot: [x, 3, z] }; });
    const [rx, rz] = CV_AT.root, root = new THREE.Group(); root.position.set(rx, 0, rz); scene.add(root);
    for (let i = 0; i < 5; i++) { const r = add(new THREE.CylinderGeometry(0.16, 0.34, 2.6, 6), 0x4a3a2c, 0, 0.5, 0, root); r.rotation.set(1.2, i * 1.25, 0); r.position.set(Math.sin(i * 1.25) * 0.9, 0.45, Math.cos(i * 1.25) * 0.9); }
    add(new THREE.SphereGeometry(0.9, 8, 6), 0x4a3a2c, 0, 0.5, 0, root).scale.set(1.2, 0.7, 1);
    solidBoxes.push({ x0: rx - 0.9, x1: rx + 0.9, z0: rz - 0.9, z1: rz + 0.9 });
    cvClick(root, 'Chop', 'Old root', rootClick, rx, rz);
    const [ax, az] = CV_AT.altar; add(new THREE.BoxGeometry(2.4, 1.1, 1.2), texMat(wallStone, 1, 1, 0x8a847a), ax, 0.55, az); solidBoxes.push({ x0: ax - 1.2, x1: ax + 1.2, z0: az - 0.6, z1: az + 0.6 });
    CV.emberKey = caveKey(0xff7a30, ax, 1.6, az, () => takeKey('ember')); }
  // ----- the old mine: a cracked wall into the forge -----
  { const [wx, wz] = CV_AT.wall, parts = [];
    for (let i = 0; i < 14; i++) { const g = new THREE.IcosahedronGeometry(1, 0); g.scale(0.7 + R() * 0.5, 0.6 + R() * 0.5, 0.8 + R() * 0.5); g.rotateY(R() * 6); g.translate(wx + (R() - 0.5) * 1.2, 0.5 + (i % 4) * 1.05, wz - 1.8 + ((i * 7) % 5) * 0.9); parts.push(colour(g, 0x5a5048)); }
    const rubble = merged(parts);
    const cracks = add(new THREE.PlaneGeometry(4.4, 4.2).rotateY(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x0a0806, transparent: true, opacity: 0.55 }), wx - 0.95, 2.1, wz); cracks.castShadow = false;
    const hit = add(new THREE.BoxGeometry(2, 4.4, 4.4), new THREE.MeshBasicMaterial({ visible: false }), wx, 2.2, wz);
    cvClick(hit, 'Mine', 'Cracked wall', wallClick, wx, wz);
    CV.wall = caveBar(rubble, { x0: 38.2, x1: 39.8, z0: 640.8, z1: 645.2 }); CV.wallHit = hit; CV.cracks = cracks;
    // ore glinting in the rock here and there
    for (let i = 0; i < 8; i++) { const g = new THREE.OctahedronGeometry(0.12); const m = add(g, new THREE.MeshStandardMaterial({ color: 0xc08060, emissive: 0x3a1a08, metalness: 0.6, roughness: 0.4 }), 16 + R() * 20, 1 + R() * 1.6, R() < 0.5 ? 634.2 : 651.8); m.castShadow = false; } }
  // ----- the goblin forge: their furnace, their anvil, and a seam of iron in the wall -----
  { const [fx, fz] = CV_AT.furnace, F = new THREE.Group(); F.position.set(fx, 0, fz); scene.add(F);
    add(new THREE.BoxGeometry(2.6, 2.4, 2.0), texMat(wallStone, 1, 1, 0x6a645a), 0, 1.2, 0, F); add(new THREE.CylinderGeometry(0.5, 0.7, 2.6, 8), 0x4a4640, 0, 3.6, 0, F);
    add(new THREE.BoxGeometry(1.2, 0.9, 0.1), fireMat, 0, 0.9, -1.02, F);
    solidBoxes.push({ x0: fx - 1.3, x1: fx + 1.3, z0: fz - 1.0, z1: fz + 1.0 }); LIGHT_SPOTS.push([fx, 2, fz - 2]);
    F.userData = { action: 'Smelt', name: 'Goblin furnace', rec: { kind: 'furnace', state: 'standing', x: fx, z: fz, s: 1.0 } }; trees.push(F);
    const [ax, az] = CV_AT.anvil, A = new THREE.Group(); A.position.set(ax, 0, az); scene.add(A);
    add(new THREE.BoxGeometry(0.7, 0.9, 0.7), 0x3a2a1a, 0, 0.45, 0, A); add(new THREE.BoxGeometry(1.5, 0.35, 0.6), mat(0x3a3f46), 0, 1.05, 0, A); add(new THREE.ConeGeometry(0.3, 0.6, 4).rotateZ(Math.PI / 2), mat(0x3a3f46), 1.0, 1.05, 0, A);
    solidBoxes.push({ x0: ax - 0.8, x1: ax + 0.8, z0: az - 0.5, z1: az + 0.5 });
    cvClick(A, 'Smith', 'Goblin anvil', anvilClick, ax, az);
    const [vx, vz] = CV_AT.vein, parts = [];
    for (let i = 0; i < 5; i++) { const g = new THREE.IcosahedronGeometry(1, 0); g.scale(0.7, 0.7 + R() * 0.4, 0.9); g.translate(vx - 0.2, 0.6 + i * 0.4, vz - 1.2 + i * 0.6); parts.push(colour(g, 0x4e4840)); }
    const vein = merged(parts); for (let i = 0; i < 7; i++) { const m = add(new THREE.OctahedronGeometry(0.16), new THREE.MeshStandardMaterial({ color: 0xa08a7a, emissive: 0x2a1a10, metalness: 0.7, roughness: 0.35 }), vx - 0.75 - R() * 0.2, 0.6 + R() * 1.8, vz - 1.2 + R() * 2.6); m.castShadow = false; }
    solidBoxes.push({ x0: vx - 0.9, x1: vx + 0.9, z0: vz - 1.6, z1: vz + 1.6 });
    cvClick(vein, 'Mine', 'Iron seam', veinClick, vx, vz);
    CV.ironKey = caveKey(0xa8aeb6, ax, 1.9, az, () => takeKey('iron')); }
  // ----- the grotto: a pool of blind fish, the prisoner's fire, a damp patch under a dark ledge, and webs -----
  { const [px, pz] = CV_AT.pool;
    const water = add(new THREE.CircleGeometry(3.1, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x14303c, emissive: 0x0a2430, roughness: 0.15, metalness: 0.2 }), px, 0.03, pz); water.castShadow = false;
    const ring = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, g = new THREE.IcosahedronGeometry(1, 0); g.scale(0.55, 0.3, 0.45); g.rotateY(-a); g.translate(px + Math.cos(a) * 3.2, 0.05, pz + Math.sin(a) * 3.2); ring.push(colour(g, GREYS[i % 4])); }
    merged(ring); solidBoxes.push({ x0: px - 2.4, x1: px + 2.4, z0: pz - 2.4, z1: pz + 2.4 });
    CV.fishGlints = []; for (let i = 0; i < 3; i++) { const f = add(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.5 }), px, 0.02, pz); f.scale.set(1, 0.3, 2.4); f.castShadow = false; CV.fishGlints.push(f); }
    const hit = add(new THREE.CylinderGeometry(3, 3, 0.5, 12), new THREE.MeshBasicMaterial({ visible: false }), px, 0.25, pz);
    cvClick(hit, 'Fish', 'Dark pool', poolClick, px, pz);
    const [cx, cz] = CV_AT.fire, camp = new THREE.Group(); camp.position.set(cx, 0, cz); scene.add(camp);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(new THREE.DodecahedronGeometry(0.22, 0), 0x5a544c, Math.cos(a) * 0.75, 0.12, Math.sin(a) * 0.75, camp); }
    for (let i = 0; i < 3; i++) { const l = add(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6), 0x4a3424, 0, 0.18, 0, camp); l.rotation.set(Math.PI / 2, i * 1.05, 0); }
    for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 6), new THREE.MeshStandardMaterial({ color: 0xffb040, emissive: 0xff7010, emissiveIntensity: 1.6 })); f.position.set((k - 1) * 0.15, 0.5, (k % 2) * 0.1); camp.add(f); }
    solidBoxes.push({ x0: cx - 0.8, x1: cx + 0.8, z0: cz - 0.8, z1: cz + 0.8 }); LIGHT_SPOTS.push([cx, 1.6, cz]);
    cvClick(camp, 'Cook', 'Campfire', fireClick, cx, cz);
    // Hollis, chained to the wall on a rock
    const [hx, hz] = CV_AT.hollis; add(new THREE.BoxGeometry(1.6, 1.0, 1.4), 0x4e4840, hx - 0.2, 0.5, hz); solidBoxes.push({ x0: hx - 1.0, x1: hx + 0.7, z0: hz - 0.8, z1: hz + 0.8 });
    const H = makeChibi({ gender: 'male', skin: 0xe0b090, hair: 'short', hairCol: 0x6a5030, shirt: 0x6a7048, pants: 0x4a4030, ...LOOK_PLAIN });
    H.scale.setScalar(CHIBI_SCALE); H.position.set(hx, 0.98, hz); H.rotation.y = Math.PI / 2; scene.add(H); CV.hollis = H;
    { const hc = H.userData.chibi; hc.legs.forEach(l => l.rotation.x = -1.45); hc.body.position.y = 0.02; hc.arms.forEach(a => a.rotation.x = -0.5); hc.head.rotation.x = 0.15; }
    const chain = []; for (let i = 0; i < 6; i++) { const g = new THREE.TorusGeometry(0.12, 0.035, 4, 8); g.rotateY(i % 2 ? Math.PI / 2 : 0); g.translate(hx - 1.6 + i * 0.25, 1.0 - Math.sin(i / 5 * Math.PI) * 0.25, hz + 0.45); chain.push(colour(g, 0x3a3a40, 0.02)); }
    merged(chain);
    cvClick(H, 'Talk-to', 'Hollis', hollisClick, hx, hz);
    // the damp patch, and the glowcap that grows there
    const [mx, mz] = CV_AT.patch;
    const soil = add(new THREE.SphereGeometry(1.1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1, flatShading: true }), mx, -0.02, mz); soil.scale.set(1, 0.28, 1);   /* a low heap of damp earth */
    for (let i = 0; i < 6; i++) add(new THREE.DodecahedronGeometry(0.12 + R() * 0.08, 0), 0x5a544c, mx + Math.cos(i * 1.1) * 1.15, 0.06, mz + Math.sin(i * 1.1) * 1.15);
    cvClick(soil, 'Plant', 'Damp soil', capPatchClick, mx, mz);
    const cap = new THREE.Group(); cap.position.set(mx, 0, mz); scene.add(cap); cap.scale.setScalar(0.01);
    const capM = new THREE.MeshStandardMaterial({ color: 0x60f0d0, emissive: 0x30d0b0, emissiveIntensity: 1.2 }), stemM = new THREE.MeshStandardMaterial({ color: 0xd8e8d0, emissive: 0x304a40 });
    add(new THREE.CylinderGeometry(0.22, 0.38, 3.6, 10).translate(0, 1.8, 0), stemM, 0, 0, 0, cap);
    add(new THREE.SphereGeometry(1.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), capM, 0, 3.5, 0, cap).scale.set(1, 0.55, 1);
    for (let i = 0; i < 5; i++) { const s = add(new THREE.SphereGeometry(0.12, 8, 6), capM, Math.cos(i * 1.3) * 0.7, 0.1, Math.sin(i * 1.3) * 0.7, cap); s.scale.set(1, 0.6, 1); }
    CV.cap = cap; CV.capSpot = [mx, 3.2, mz]; CV.capBox = { x0: mx - 0.5, x1: mx + 0.5, z0: mz - 0.5, z1: mz + 0.5 };
    // the webs, strung in corners of the walls
    const webM = new THREE.MeshBasicMaterial({ color: 0xe8e8f0, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    CV.webs = WEBS.map(([x, z, w], i) => { const g = new THREE.Group(); g.position.set(x, 1.8, z); g.rotation.y = w === -1 ? Math.PI / 2 : 0; scene.add(g);
      const lines = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; lines.push(0, 0, 0, Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0); }
      for (const r of [0.4, 0.8, 1.2]) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, b = (k + 1) / 8 * Math.PI * 2; lines.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(b) * r, Math.sin(b) * r, 0); }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3)); g.add(new THREE.LineSegments(lg, webM));
      const hit = new THREE.Mesh(new THREE.CircleGeometry(1.3, 10), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })); g.add(hit);
      cvClick(hit, 'Gather', 'Web', () => webClick(i), x, z); return g; });
    // the ledge, high on the north wall, with a small chest on it
    const [lx, lz] = CV_AT.ledge; add(new THREE.BoxGeometry(3.6, 0.5, 1.6), 0x5a544c, lx, 3.4, lz + 0.4);
    const chest = new THREE.Group(); chest.position.set(lx, 3.65, lz + 0.4); scene.add(chest);
    add(new THREE.BoxGeometry(0.9, 0.5, 0.55), texMat(woodTex(), 1, 1, 0xa07040), 0, 0.25, 0, chest); add(new THREE.BoxGeometry(0.94, 0.12, 0.6), mat(0x55555c), 0, 0.5, 0, chest);
    const lh = add(new THREE.BoxGeometry(3.6, 3.8, 1.8), new THREE.MeshBasicMaterial({ visible: false }), lx, 1.9, lz + 0.5);
    cvClick(lh, 'Climb', 'Ledge', ledgeClick, lx, lz + 1);
    CV.ledgeChest = chest; CV.tideKey = caveKey(0x40a0ff, lx, 1.8, lz + 2.6, () => takeKey('tide')); }
  // ----- the troll's den: bones, and later a chest and a way out -----
  { const bones = []; for (let i = 0; i < 26; i++) { const g = new THREE.CylinderGeometry(0.06, 0.08, 0.5 + R() * 0.5, 5); g.rotateZ(Math.PI / 2); g.rotateY(R() * 6); g.translate(-12 + R() * 24, 0.08, 602 + R() * 24); bones.push(colour(g, 0xe0d8c0, 0.05)); }
    for (let i = 0; i < 6; i++) { const g = new THREE.SphereGeometry(0.24, 8, 6); g.scale(1, 0.85, 1.2); g.translate(-12 + R() * 24, 0.2, 602 + R() * 24); bones.push(colour(g, 0xe8e0c8, 0.03)); }
    merged(bones);
    const [cx, cz] = CV_AT.bossChest, chest = new THREE.Group(); chest.position.set(cx, 0, cz); scene.add(chest); chest.visible = false;
    const wood = texMat(woodTex(), 1, 1, 0xc08850); wood.emissive = new THREE.Color(0x2a1808); const gold = mat(0xe2b84c); gold.emissive = new THREE.Color(0x5a3a08);
    add(new THREE.BoxGeometry(1.6, 0.9, 1.0), wood, 0, 0.45, 0, chest);
    const lid = new THREE.Group(); lid.position.set(0, 0.9, -0.5); chest.add(lid); add(new THREE.CylinderGeometry(0.5, 0.5, 1.6, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), wood, 0, 0, 0.5, lid);
    for (const x of [-0.55, 0.55]) add(new THREE.BoxGeometry(0.12, 0.92, 1.04), mat(0x55555c), x, 0.45, 0, chest);
    add(new THREE.BoxGeometry(0.22, 0.14, 0.05), gold, 0, 0.8, 0.52, chest);
    cvClick(chest, 'Open', 'Reward chest', bossChestClick, cx, cz); CV.bossChest = { g: chest, lid };
    const [rx, rz] = CV_AT.bossRope, exitG = new THREE.Group(); exitG.position.set(rx, 0, rz); scene.add(exitG); exitG.visible = false;
    add(new THREE.CylinderGeometry(0.07, 0.07, 9, 6), 0xa08850, 0, 4.5, 0, exitG);
    const shaft = add(new THREE.CylinderGeometry(1.6, 2.4, 10, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }), 0, 5, 0, exitG); shaft.castShadow = false;
    const rh = add(new THREE.BoxGeometry(1.6, 5, 1.6), new THREE.MeshBasicMaterial({ visible: false }), 0, 2.5, 0, exitG);
    cvClick(rh, 'Climb', 'Rope', () => caveGo(rx, rz, 1.8, () => leaveCave('You haul yourself up the rope and out into the hills.')), rx, rz); CV.bossRope = exitG; }
}
// a door, wall or drop that is solid until it opens; the mesh (if any) slides or crumbles away
function caveBar(mesh, box){ const b = { mesh, box, open: false, y0: mesh ? mesh.position.y : 0 }; solidBoxes.push(box);
  b.set = (open, quick) => { if (open === b.open) return; b.open = open; const i = solidBoxes.indexOf(box); if (open && i >= 0) solidBoxes.splice(i, 1); if (!open && i < 0) solidBoxes.push(box); b.anim = quick ? null : performance.now();
    if (mesh) { if (!open) { mesh.visible = true; mesh.position.y = b.y0; } else if (quick) { if (b.lift) mesh.position.y = b.y0 + b.lift; else mesh.visible = false; } } };
  return b; }
function caveKey(col, x, y, z, take){
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g); g.visible = false;
  const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.7, metalness: 0.5, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 6, 14), m); ring.position.y = 0.3; g.add(ring);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), m); stem.position.y = -0.18; g.add(stem);
  for (const y2 of [-0.42, -0.26]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.1), m); t.position.set(0.14, y2, 0); g.add(t); }
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); g.add(hit); g.baseY = y;
  g.userData = { action: 'Take', name: 'Key', rec: { kind: 'cave', state: 'standing', x, z, onClick: () => caveGo(x, z, 2.2, take) } }; trees.push(g);
  return g;
}
function cvClick(obj, action, name, onClick, x, z){ obj.userData = { action, name, rec: { kind: 'cave', state: 'standing', x, z, onClick } }; if (!trees.includes(obj)) trees.push(obj); }

// ----- walking up to things and working on them -----
// walk to the nearest free side of something (or act at once when already beside it), then do it
function caveGo(x, z, reach, then){
  const near = () => Math.hypot(hero.position.x - x, hero.position.z - z) < reach + 1.0;
  const act = () => { if (!CAVE) return; if (!near()) { showToast("You can't reach that from here."); return; } heroAnim.yaw = yawTo(hero.position.x, hero.position.z, x, z); then(); };
  if (near()) { walkTarget = null; walkQueue = []; act(); return; }
  const spots = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; spots.push({ x: x + Math.sin(a) * reach, z: z + Math.cos(a) * reach }); }
  const ok = spots.filter(p => !blocked(p.x, p.z) && caveRoomAt(p.x, p.z) === caveRoomAt(hero.position.x, hero.position.z)).concat(spots.filter(p => !blocked(p.x, p.z)))
    .sort((a, b) => Math.hypot(a.x - hero.position.x, a.z - hero.position.z) - Math.hypot(b.x - hero.position.x, b.z - hero.position.z));
  if (!ok.length) { showToast("You can't reach that from here."); return; }
  walkStart(new THREE.Vector3(ok[0].x, 0, ok[0].z), act);
}
// a job with a progress bar (the same bar as smelting and cooking): stops if you walk off or get attacked
function caveWork(x, z, reach, ms, label, pose, done){
  if (FIGHT) { showToast("You can't do that while you're fighting!"); return; }
  if (caveJob) return;
  caveGo(x, z, reach, () => {
    if (FIGHT) { showToast("You can't do that while you're fighting!"); return; }
    cancelChop();
    caveJob = { t0: performance.now(), ms, pose, x, z, done, beat: -1 };
    document.getElementById('smeltLabel').textContent = label; document.getElementById('smeltFill').style.width = '0%'; document.getElementById('smeltBar').style.display = 'block';
  });
}
function stopCaveJob(msg){ if (!caveJob) return; caveJob = null; document.getElementById('smeltBar').style.display = 'none'; if (msg) showToast(msg); }
function caveJobStep(now){
  const J = caveJob; if (!J) return;
  if (FIGHT) { stopCaveJob(); return; }
  const k = (now - J.t0) / J.ms, since = now - J.t0;
  document.getElementById('smeltFill').style.width = Math.min(100, k * 100) + '%';
  const yaw = heroAnim.yaw = yawTo(hero.position.x, hero.position.z, J.x, J.z); turnChibi(hero, yaw);
  if (J.pose === 'axe' || J.pose === 'pick') { const ph = (since / 1100) % 1, beat = Math.floor(since / 1100 + 0.5); poseChibi(hero, 'swing', ph, J.pose); if (beat !== J.beat && ph > 0.45) { J.beat = beat; J.pose === 'axe' ? chopSound() : mineSound(); } }
  else if (J.pose === 'rod') fishPose(hero, now / 1000, since < 900 ? since / 900 : 0, true);
  else if (J.pose === 'net') netPose(hero, (since / J.ms) % 1, false);
  else if (J.pose === 'anvil') { poseChibi(hero, 'work', 0); const beat = Math.floor(since / 800); if (beat !== J.beat && (since / 800) % 1 > 0.5) { J.beat = beat; anvilSound(); } }
  else poseChibi(hero, J.pose, 0);
  if (k < 1) return;
  caveJob = null; document.getElementById('smeltBar').style.display = 'none'; poseChibi(hero, 'idle', 0); J.done(); saveNow(false);
}
const caveNeed = (skill, lvl, what) => { if (levelOf(SKILL_XP[skill]) >= lvl) return true; showToast(`You need ${skill} ${lvl} to ${what}.`); return false; };
// give something, or drop it at your feet if the bag is full
function caveGive(name, n){ const before = countOf(name); addItem(name, n, ICON_FOR[name]); const got = countOf(name) - before; if (got < n) { dropToGround(name, n - got, hero.position.x, hero.position.z, true); showToast(`Your bag is full, so the ${name.toLowerCase()} drops at your feet.`); } }
function caveRumble(){ sfx((ctx, t, out) => { out.gain.value = 0.6; nz(ctx, out, t, 1.6, 'lowpass', 220, 90, 0.8, 0.9, 0.08, 1.3); nz(ctx, out, t + 0.1, 0.9, 'bandpass', 600, 300, 1.2, 0.25, 0.05, 0.8); }); }
function caveChime(){ sfx((ctx, t, out) => { out.gain.value = 0.18; [659.25, 880, 1046.5].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; const s = t + i * 0.12;
  g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.5, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 1.1); o.connect(g); g.connect(out); o.start(s); o.stop(s + 1.2); }); }); }

// ----- the puzzles -----
function plateClick(i){
  if (CAVE_P.seal) { showToast('The stones have gone quiet.'); return; }
  const [x, z] = PLATES_AT[i];
  walkStart(new THREE.Vector3(x, 0, z), () => {
    if (!CAVE || Math.hypot(hero.position.x - x, hero.position.z - z) > 1.2 || CAVE_P.seal) return;
    for (const j of [i - 1, i, i + 1]) { const k = (j + 5) % 5; CAVE_P.pl[k] = CAVE_P.pl[k] ? 0 : 1; }
    sfx((ctx, t, out) => { out.gain.value = 0.4; nz(ctx, out, t, 0.25, 'lowpass', 400, 200, 1, 0.8, 0.005, 0.2); });
    caveSync();
    if (CAVE_P.pl.every(v => v)) { CAVE_P.seal = 1; caveChime(); setTimeout(caveRumble, 400); CV.seal.set(true); showToast('All five stones blaze with light. The seal on the east passage fades away.'); saveNow(false); }
  });
}
function treeClick(){
  if (CAVE_P.bridge) return;
  if (!hasAxe()) { showToast('You need an axe to chop this tree.'); return; }
  if (!caveNeed('Woodcutting', 15, 'chop down this tree')) return;
  caveWork(...CV_AT.tree, 2.2, 5000, 'Chopping...', 'axe', () => {
    CAVE_P.bridge = 1; addXp('Woodcutting', 80); fallSound(); CV.tree.fallAt = performance.now();
    setTimeout(() => { caveRumble(); caveSync(); }, 1100);
    showToast('The dead tree creaks, leans... and crashes down across the chasm!  +80 Woodcutting XP');
    caveGive('Logs', 4);
  });
}
function rootClick(){
  if (!hasAxe()) { showToast('You need an axe to chop this root.'); return; }
  if (!caveNeed('Woodcutting', 15, 'chop this root')) return;
  if (bag.length >= BAG_SIZE && !hasItem('Logs')) { showToast('Your bag is full.'); return; }
  caveWork(...CV_AT.root, 2.2, 2600, 'Chopping...', 'axe', () => { caveGive('Logs', 1); addXp('Woodcutting', 20); showToast('You hack a log off the old root.  +20 Woodcutting XP'); });
}
function brazierClick(i){
  const B = CV.braz[i];
  if (CAVE_P.ember || B.lit && B.lit > performance.now()) { showToast('It\'s burning nicely.'); return; }
  if (!hasTool('Tinderbox')) { showToast('You need a tinderbox to light it.'); return; }
  if (!caveNeed('Firemaking', 10, 'light the braziers')) return;
  const log = hasItem('Logs') ? 'Logs' : hasItem('Oak logs') ? 'Oak logs' : null;
  if (!log) { showToast('You need some logs to burn in it.'); return; }
  caveWork(B.x, B.z, 2.1, 1500, 'Lighting...', 'plant', () => {
    if (!removeItem(log)) return;
    B.lit = performance.now() + BRAZ_MS; addXp('Firemaking', 30); sfx((ctx, t, out) => { out.gain.value = 0.5; nz(ctx, out, t, 0.8, 'bandpass', 900, 500, 0.8, 0.6, 0.02, 0.7); });
    if (!LIGHT_SPOTS.includes(B.spot)) LIGHT_SPOTS.push(B.spot); updateDayNight.next = 0;
    const n = CV.braz.filter(b => b.lit > performance.now()).length;
    showToast(n < 4 ? `The brazier roars into life. (${n} of 4 burning)  +30 Firemaking XP` : 'All four braziers blaze at once! Something scrabbles in the dark...');
    if (n === 4) brazierAmbush();
  });
}
function brazierAmbush(){
  if (CAVE.ambush) return; CAVE.ambush = true;
  for (const b of CV.braz) b.lit = Infinity;
  [[-58, 643], [-44, 636], [-44, 650]].forEach(([x, z]) => caveSpawn('blindRat', x, z, 'braz'));
}
function wallClick(){
  if (CAVE_P.wall) return;
  if (!hasPick()) { showToast('You need a pickaxe to break through.'); return; }
  if (!caveNeed('Mining', 15, 'break through this wall')) return;
  caveWork(...CV_AT.wall, 2.6, 5500, 'Mining...', 'pick', () => {
    CAVE_P.wall = 1; addXp('Mining', 90); caveRumble(); CV.wall.set(true); CV.cracks.visible = false; const i = trees.indexOf(CV.wallHit); if (i >= 0) trees.splice(i, 1);
    showToast('The cracked wall gives way in a shower of rock. There\'s iron ore in the rubble!  +90 Mining XP');
    caveGive('Iron ore', 2);
  });
}
function veinClick(){
  if (!hasPick()) { showToast('You need a pickaxe to mine this seam.'); return; }
  if (!caveNeed('Mining', 15, 'mine this iron')) return;
  if (bag.length >= BAG_SIZE && !hasItem('Iron ore')) { showToast('Your bag is full.'); return; }
  caveWork(...CV_AT.vein, 2.3, 3200, 'Mining...', 'pick', () => { caveGive('Iron ore', 1); addXp('Mining', 35); showToast('You mine some iron ore.  +35 Mining XP'); });
}
function anvilClick(){
  if (CAVE_P.iron) { showToast("You've already made the key."); return; }
  if (CAVE.mons.some(m => m.croom === 'forge' && m.state !== 'dying' && m.state !== 'dead')) { showToast("The goblins won't let you near their anvil!"); return; }
  if (!hasTool('Hammer')) { showToast('You need a hammer to work the metal.'); return; }
  if (!caveNeed('Smithing', 15, 'forge this key')) return;
  if (!hasItem('Iron bar')) { showToast('A key mould sits on the anvil, shaped for an iron key. You need an iron bar.'); return; }
  caveWork(...CV_AT.anvil, 2.2, 3600, 'Smithing...', 'anvil', () => {
    if (!removeItem('Iron bar')) return;
    addXp('Smithing', 60); CAVE_P.ironMade = 1; CV.ironKey.visible = true; showToast('You hammer the bar into the mould and knock out an iron key.  +60 Smithing XP');
  });
}
function poolClick(){
  if (!caveNeed('Fishing', 10, 'catch the fish here')) return;
  const tool = hasTool('Fishing rod') ? 'rod' : hasTool('Small fishing net') ? 'net' : null;
  if (!tool) { showToast('You need a fishing net or a rod to fish here.'); return; }
  if (CAVE_P.fish || CAVE_P.cooked) { showToast("You've got one already. One's plenty."); return; }
  caveWork(...CV_AT.pool, 3.9, 4000, 'Fishing...', tool, () => {
    splashSound();
    if (Math.random() < Math.min(0.9, 0.55 + (levelOf(SKILL_XP.Fishing) - 10) * 0.03)) { CAVE_P.fish = 1; addXp('Fishing', 40); showToast('You catch a pale, blind cave fish.  +40 Fishing XP'); }
    else showToast('Something brushes past, but it gets away.');
  });
}
function fireClick(){
  if (!CAVE_P.fish) { showToast(CAVE_P.cooked ? "That fish is cooked already." : 'You have nothing to cook on it.'); return; }
  if (!caveNeed('Cooking', 10, 'cook the cave fish')) return;
  caveWork(...CV_AT.fire, 2.1, 2200, 'Cooking...', 'work', () => {
    CAVE_P.fish = 0;
    if (Math.random() < Math.max(0.05, 0.3 - (levelOf(SKILL_XP.Cooking) - 10) * 0.025)) { sizzleSound(true); showToast("Oops. You burn the cave fish. It's charcoal now."); }
    else { CAVE_P.cooked = 1; addXp('Cooking', 40); sizzleSound(false); showToast('You cook the cave fish.  +40 Cooking XP'); }
  });
}
function hollisClick(){
  const [hx, hz] = CV_AT.hollis;
  caveGo(hx, hz, 2.4, () => {
    const me = t => ({ me: t }), run = f => ({ run: f }), P = CAVE_P;
    const npc = { name: 'Hollis', x: hx, z: hz, look: { gender: 'male', skin: 0xe0b090, hair: 'short', hairCol: 0x6a5030, shirt: 0x6a7048, pants: 0x4a4030, ...LOOK_PLAIN } };
    let script;
    if (!P.met) script = [me('Hello? Are you alright?'), "Oh thank goodness, a person! I came down after glowcaps and the goblins grabbed me.", "They've had me chained up for days. I'm so hungry I could eat my own boots.",
      "There's fish in that pool, if you've got the gear. Blind as moles, but they taste alright cooked.", me("I'll see what I can do."), run(() => { P.met = 1; })];
    else if (P.spores || P.glow) script = P.tide ? ["Got the key? Good. Now go and give that troll a headache for me.", "I'll find my own way out once these goblins are gone. Probably."]
      : ["The ledge up there is where they hid their key. Get that glowcap growing so you can see what you're grabbing.", "And you'll want a rope. Those webs are good and strong, if you don't mind the spiders."];
    else if (P.cooked) script = [me('Here, I cooked you a fish.'), run(() => { P.cooked = 0; P.spores = 1; eatSound(); }), "Oh, you beauty. That's the best thing I've ever eaten, and I've had Brenna's pies.",
      "Here, take these. Glowcap spores, the whole reason I came down. Plant them in the damp under that ledge.", "They grow fast and glow bright. The goblins keep their key up there in the dark.", "And bring a rope. Those webs are good and strong if you twist them together."];
    else script = ["Any luck with that fish? I'd settle for one that's only a bit raw.", "Don't bring it to me burnt, mind. I've had enough charcoal for one week."];
    CAVE.hollisSay = script; openDialog(npc);
  });
}
function hollisTalk(){ const s = CAVE && CAVE.hollisSay; if (CAVE) CAVE.hollisSay = null; return s || null; }
function capPatchClick(){
  if (CAVE_P.glow) { showToast('The glowcap is growing nicely.'); return; }
  if (!CAVE_P.spores) { showToast("It's soft and damp, but you've nothing to plant in it."); return; }
  if (!caveNeed('Farming', 5, 'grow these spores')) return;
  caveWork(...CV_AT.patch, 2.2, 2200, 'Planting...', 'plant', () => {
    CAVE_P.spores = 0; CAVE_P.glow = Date.now(); if (!solidBoxes.includes(CV.capBox)) solidBoxes.push(CV.capBox); addXp('Farming', 50); farmSound('plant');
    showToast('You press the spores into the damp soil. Almost at once, something pale pushes up.  +50 Farming XP');
  });
}
function webClick(i){
  if ((CAVE_P.webs || 0) & (1 << i)) return;
  const [x, z] = WEBS[i];
  caveWork(x, z, 2.2, 1600, 'Gathering...', 'work', () => {
    CAVE_P.webs = (CAVE_P.webs || 0) | (1 << i); caveSync(); silkSound('spin');
    const n = [0, 1, 2].filter(k => CAVE_P.webs & (1 << k)).length;
    showToast(n < 3 ? `You pull down a sticky web. (${n} of 3)` : 'You pull down the last of the webs. That should be enough for a rope.');
  });
}
function ledgeClick(){
  if (CAVE_P.tide || CAVE_P.tideDown) { showToast("There's nothing else up there."); return; }
  const lit = CAVE_P.glow && Date.now() - CAVE_P.glow > 12000;
  if (!lit) { showToast(CAVE_P.glow ? "Give the glowcap a moment to grow. It's still too dark up there." : "It's pitch black up there. You can't see a thing to grab onto."); return; }
  if (!CAVE_P.rope) {
    const webs = [0, 1, 2].filter(k => (CAVE_P.webs || 0) & (1 << k)).length;
    if (webs < 3) { showToast("It's too high to climb bare-handed. A rope would do it."); return; }
    if (!caveNeed('Crafting', 5, 'twist the webs into a rope')) return;
    caveWork(CV_AT.ledge[0], CV_AT.ledge[1] + 1, 2.6, 3200, 'Crafting...', 'work', () => { CAVE_P.rope = 1; addXp('Crafting', 60); craftSound(); showToast('You twist the webs into a sticky but sturdy rope.  +60 Crafting XP'); });
    return;
  }
  caveWork(CV_AT.ledge[0], CV_AT.ledge[1] + 1, 2.6, 2400, 'Climbing...', 'work', () => {
    creak(true); CAVE_P.tideDown = 1; CV.tideKey.visible = true;
    showToast('You hook the rope over a rock and climb up. The chest holds a blue key, which you toss down.');
  });
}
function takeKey(k){
  if (CAVE_P[k]) return;
  CAVE_P[k] = 1; caveChime(); caveSync(); saveNow(false);
  const left = ['ember', 'iron', 'tide'].filter(q => !CAVE_P[q]).length;
  showToast(`You take the ${k} key. ${left ? `${left} more to find.` : 'That\'s all three. The great door in the rune hall awaits.'}`);
}
function bossDoorClick(){
  if (CAVE_P.door) return;
  const have = ['ember', 'iron', 'tide'].filter(k => CAVE_P[k]);
  if (have.length < 3) { showToast(`The great door has three locks: one orange, one iron grey, one sea blue. You have ${have.length ? have.length + ' of the keys' : 'none of the keys'}.`); return; }
  CAVE_P.door = 1; creak(true); setTimeout(caveRumble, 300); CV.door.set(true); CV.doorOpenAt = performance.now(); saveNow(false);
  showToast('The three keys turn with a heavy clunk. The great door swings open, and something huge grunts in the dark beyond.');
}
function bossChestClick(){
  if (!CAVE || !CAVE.won || CAVE.opened || CAVE_P.done) return;
  caveGo(...CV_AT.bossChest, 2.0, () => { if (CAVE.opened) return; CAVE.opened = performance.now(); chestSound(); setTimeout(grantCaveRewards, 1500); });
}
function grantCaveRewards(){
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), coins = r(400, 700), rows = [];
  quietLevelUps = true; addXp('Melee', 600); addXp('Hitpoints', 600); for (const s of ['Woodcutting', 'Mining', 'Fishing', 'Smithing', 'Cooking', 'Firemaking', 'Farming', 'Crafting']) addXp(s, 150); quietLevelUps = false;
  addItem('Coins', coins); rows.push(`<div class="qr"><span class="qi">${ICON_FOR.Coins || ''}</span>${coins} coins</div>`);
  for (const [name, n] of [['Iron bar', 3], ['Feathers', r(30, 60)]]) { const before = countOf(name); addItem(name, n, ICON_FOR[name]); const ok = countOf(name) - before >= n; if (!ok) dropToGround(name, n - (countOf(name) - before), hero.position.x, hero.position.z, true);
    rows.push(`<div class="qr"><span class="qi">${ICON_FOR[name] || ''}</span>${n} ${name.toLowerCase()}${ok ? '' : ' <small style="color:#c05030">(on the ground)</small>'}</div>`); }
  CAVE_P.done = 1; CAVE_P.runs = (CAVE_P.runs || 0) + 1;   /* the next trip down starts fresh (caveFresh) */
  questJingle(); renderStats(); renderBag(); saveNow(false);
  showRewardScroll({ banner: 'Dungeon complete', title: 'The Cave', sub: 'Three keys found, the great door opened, and the cave troll beaten.',
    rewards: rows.join(''), xp: '<div class="qr">Melee<b>+600</b></div><div class="qr">Hitpoints<b>+600</b></div><div class="qr">Every other skill<b>+150</b></div>',
    quote: '&ldquo;You got rid of the troll? And the goblins? I\'ll tell everyone in the village. Well, after a bath.&rdquo; &mdash; Hollis' });
  addSystemLine('Climb the rope out of the den when you\'re ready.');
}

// ----- going in and coming out -----
let CAVE_HUD_KEY = '';
function caveClick(){
  const sp = caveExitSpot();
  const ask = () => { if (!hero) return; heroAnim.yaw = yawTo(hero.position.x, hero.position.z, NORTH.cave.x, NORTH.cave.z); askCave(); };
  if (Math.hypot(hero.position.x - sp.x, hero.position.z - sp.z) < 3.5) { walkTarget = null; walkQueue = []; ask(); return; }
  walkStart(new THREE.Vector3(sp.x, 0, sp.z), ask);
}
function askCave(){
  if (FIGHT) { showToast("You can't go in there while you're fighting!"); return; }
  if (DELVE || CAVE) return;
  startCave();   /* no warning: the owner wants people to just go in and explore */
}
function caveFresh(){ if (CAVE_P.done) caveLoadP({ runs: CAVE_P.runs || 1 }); }
function startCave(){
  caveFresh(); buildCave(); if (FIGHT) endFight(); cancelChop(); if (EV.seat >= 0) standUp();
  walkTarget = null; walkQueue = []; walkThen = null;
  CAVE = { room: 'entry', mons: [], seen: {}, cleared: {}, ambush: false, won: false, opened: 0, last: performance.now() };
  hero.position.set(CV_AT.arrive[0], 0, CV_AT.arrive[1]); heroShadow.position.set(hero.position.x, 0.06, hero.position.z); heroAnim.yaw = Math.PI;
  for (const k in CAVE_MONS) if (!CAVE_P['k_' + k]) for (const [t, x, z] of CAVE_MONS[k]) caveSpawn(t, x, z, k);
  for (const b of CV.braz) b.lit = 0;
  caveSync(true);
  showToast('You climb down the rope into the dark. Somewhere ahead, goblins are arguing.');
  addSystemLine('The Cave: find the three keys to the great door. The rope behind you leads back up.');
  writePresence(true); updateDayNight.next = 0;
}
/* in each room they come at you one after another (order): the next waits by the wall until the one before it falls */
function caveSpawn(kind, x, z, room, order){ const m = spawnMonster(kind, x, z, 0); m.delve = true; m.cave = true; m.croom = room; m.order = order !== undefined ? order : CAVE.mons.filter(o => o.croom === room).length; CAVE.mons.push(m); return m; }
function clearCaveMonsters(){
  for (const m of CAVE ? CAVE.mons : []) { scene.remove(m.g); const i = trees.indexOf(m.g); if (i >= 0) trees.splice(i, 1); m.bar.remove(); const j = MONSTERS.indexOf(m); if (j >= 0) MONSTERS.splice(j, 1); }
}
function leaveCave(msg, dead){
  stopCaveJob(); if (FIGHT) endFight(); clearCaveMonsters(); CAVE = null; caveFresh();
  for (const b of CV.braz || []) { b.lit = 0; const i = LIGHT_SPOTS.indexOf(b.spot); if (i >= 0) LIGHT_SPOTS.splice(i, 1); }
  const sp = caveExitSpot(); walkTarget = null; walkQueue = []; walkThen = null;
  hero.position.set(sp.x, 0, sp.z); heroShadow.position.set(sp.x, 0.06, sp.z); heroAnim.yaw = -Math.PI / 2;
  if (dead) dropOnDeath();   /* before the save, so nothing is both in the bag and in the gravestone */
  if (msg) showToast(msg); writePresence(true); saveNow(false); updateDayNight.next = 0; updateCaveHud();
}
// dying down here: your gravestone goes up at the cave mouth, and you wake in the hall as usual
function caveDied(){
  endFight(); stopCaveJob();
  showToast('Oh dear, you are dead! You wake up in the hall. Your things are in a gravestone at the cave mouth.');
  leaveCave(null, true);
  setTimeout(() => { hero.position.copy(START); heroShadow.position.set(START.x, 0.06, START.z); walkTarget = null; HP.cur = maxHp(); renderStats(); }, 1200);
}
// put every door, key and prop in the state the save says
function caveSync(entering){
  if (!caveBuilt) return; const P = CAVE_P, now = performance.now();
  CV.portcullis.set(!!P.k_gate, entering); CV.seal.set(!!P.seal, entering); CV.wall.set(!!P.wall, entering); if (P.wall) { CV.cracks.visible = false; const i = trees.indexOf(CV.wallHit); if (i >= 0) trees.splice(i, 1); }
  CV.door.set(!!P.door, entering); if (entering) CV.doorOpenAt = P.door ? -1e9 : 0;
  CV.chasmMid.set(!!P.bridge, true);
  if (P.bridge && !CV.tree.fallAt) CV.tree.fallAt = -1e9;
  CV.tree.bar.set(!!P.bridge, true);
  CV.plates.forEach((p, i) => { p.glow.emissiveIntensity = P.seal || P.pl[i] ? 2.2 : 0; });
  CV.sealM.opacity = 0.85;
  CV.emberKey.visible = !!P.k_braz && !P.ember;
  CV.ironKey.visible = !!P.ironMade && !P.iron;
  CV.tideKey.visible = !!P.tideDown && !P.tide;
  if (P.glow && !solidBoxes.includes(CV.capBox)) solidBoxes.push(CV.capBox);
  if (P.door) { const i = trees.indexOf(CV.doorHit); if (i >= 0) trees.splice(i, 1); }
  if (entering) { CV.bossChest.g.visible = false; CV.bossChest.lid.rotation.x = 0; CV.bossRope.visible = false; const i = solidBoxes.indexOf(CV.chestBox); if (i >= 0) solidBoxes.splice(i, 1); }
  if (P.k_braz) for (const b of CV.braz) { b.lit = Infinity; if (!LIGHT_SPOTS.includes(b.spot)) LIGHT_SPOTS.push(b.spot); }
  CV.webs.forEach((w, i) => { w.visible = !((P.webs || 0) & (1 << i)); });
  CV.ledgeChest.visible = true;
}
// what's left to do, in a small panel at the top of the screen
function updateCaveHud(){
  const el = document.getElementById('caveHud'); if (!el) return;
  if (!CAVE) { if (!el.hidden) { el.hidden = true; CAVE_HUD_KEY = ''; } return; }
  const P = CAVE_P, keys = ['ember', 'iron', 'tide'].map(k => `<i class="ck ${k}${P[k] ? ' got' : ''}"></i>`).join('');
  const webs = [0, 1, 2].filter(k => (P.webs || 0) & (1 << k)).length;
  const bits = [P.fish && 'Cave fish', P.cooked && 'Cooked cave fish', P.spores && 'Glowcap spores', !P.rope && webs && `Webs ${webs}/3`, P.rope && !P.tide && 'Silk rope'].filter(Boolean);
  const room = CAVE_ROOMS[CAVE.room] ? CAVE_ROOMS[CAVE.room].name : '';
  const burning = !P.ember && CAVE.room === 'braz' ? CV.braz.filter(b => b.lit > performance.now()) : [];
  const sub = burning.length && burning.length < 4 ? `Braziers burning: ${burning.length} of 4, ${Math.max(0, Math.ceil(Math.min(...burning.map(b => b.lit)) / 1000 - performance.now() / 1000))}s` : bits.join(' · ');
  const key = room + keys + sub; if (key === CAVE_HUD_KEY) return; CAVE_HUD_KEY = key;
  el.innerHTML = `<div class="wTitle">${room}</div><div class="cKeys">${keys}</div>${sub ? `<div class="wSub">${sub}</div>` : ''}`; el.hidden = false;
}

// ----- every frame while you're down here -----
function updateCave(){
  updateCaveHud(); caveAmbience(!!CAVE);
  if (!CAVE || !hero) return;
  const now = performance.now(), dt = Math.min(0.25, (now - CAVE.last) / 1000); CAVE.last = now;
  const rm = caveRoomAt(hero.position.x, hero.position.z); if (rm && rm !== CAVE.room) { CAVE.room = rm; caveEnterRoom(rm); }
  caveJobStep(now);
  // the moving parts: the portcullis and seal lift, the tree falls, the door swings, the braziers burn down, the glowcap grows
  for (const b of [CV.portcullis, CV.wall]) if (b.anim && b.mesh) { const k = Math.min(1, (now - b.anim) / 1600); if (b === CV.portcullis) b.mesh.position.y = b.y0 + (b.open ? k : 1 - k) * 4.6; else { b.mesh.position.y = b.y0 - (b.open ? k : 0) * 4.5; if (k >= 1 && b.open) b.mesh.visible = false; } if (k >= 1) b.anim = null; }
  if (CV.portcullis.open && !CV.portcullis.anim) CV.portcullis.mesh.position.y = CV.portcullis.y0 + 4.6;
  if (CV.seal.mesh) { const k = CV.seal.anim ? Math.min(1, (now - CV.seal.anim) / 1500) : 1; CV.sealM.opacity = CV.seal.open ? 0.85 * (1 - k) : 0.7 + Math.sin(now / 400) * 0.15; CV.seal.mesh.visible = !CV.seal.open || k < 1; }
  { const T = CV.tree; if (T.fallAt) { const k = Math.min(1, (now - T.fallAt) / 1300); T.trunk.rotation.z = (Math.PI / 2 - 0.02) * k * k; T.trunk.position.y = -0.72 * Math.min(1, k * k); if (k >= 1) { const i = trees.indexOf(T.hit); if (i >= 0) trees.splice(i, 1); } } }
  { const a = CV.doorOpenAt ? Math.min(1, (now - CV.doorOpenAt) / 1800) : 0; CV.doorL.rotation.y = 1.6 * a; CV.doorR.rotation.y = -1.6 * a; CV.locks.forEach(L => { L.m.emissiveIntensity = CAVE_P[L.k] ? 0.9 : 0.15; L.l.visible = a < 0.05; }); }
  for (const b of CV.braz) { const on = b.lit > now; b.fire.visible = on; if (on) b.fire.children.forEach((f, i) => { f.scale.y = 0.85 + 0.2 * Math.sin(now / 90 + i * 2); });
    if (!on && b.lit) { b.lit = 0; const i = LIGHT_SPOTS.indexOf(b.spot); if (i >= 0) LIGHT_SPOTS.splice(i, 1); updateDayNight.next = 0; if (CAVE.room === 'braz') showToast('A brazier gutters and goes out.'); } }
  if (CAVE_P.glow) { const k = Math.min(1, (Date.now() - CAVE_P.glow) / 12000); CV.cap.scale.setScalar(Math.max(0.01, k)); if (k > 0.3 && !LIGHT_SPOTS.includes(CV.capSpot)) { LIGHT_SPOTS.push(CV.capSpot); updateDayNight.next = 0; } } else CV.cap.scale.setScalar(0.01);
  CV.fishGlints.forEach((f, i) => { const a = now / (1400 + i * 300) + i * 2; f.position.set(CV_AT.pool[0] + Math.cos(a) * (1.2 + i * 0.5), 0.05, CV_AT.pool[1] + Math.sin(a) * (1.2 + i * 0.5)); f.rotation.y = -a; f.visible = !CAVE_P.fish && !CAVE_P.cooked || i > 0; });
  for (const k of [CV.emberKey, CV.ironKey, CV.tideKey]) if (k.visible) { k.rotation.y = now / 600; k.position.y = k.baseY + Math.sin(now / 400) * 0.12; }
  if (CAVE.won && CV.bossChest.g.visible) { const a = CAVE.opened ? Math.min(1, (now - CAVE.opened) / 1200) : 0; CV.bossChest.lid.rotation.x = -1.8 * a; const k = Math.min(1, (now - CAVE.wonAt) / 900); CV.bossChest.g.scale.setScalar(1.3 * Math.max(0.01, 1 - Math.pow(1 - k, 3))); }
  caveMobs(now, dt);
}
function caveEnterRoom(rm){
  if (CAVE.seen[rm]) return; CAVE.seen[rm] = true;
  const P = CAVE_P;
  if (rm === 'hub' && !P.seal) showToast('Five stones are set in the floor, carved with runes. Some of them glow. The way east is sealed with the same runes.');
  if (rm === 'chasm' && !P.bridge) showToast('A deep crack splits the cave in two. A dead tree leans at the edge.');
  if (rm === 'braz' && !P.ember) showToast('Four cold braziers stand round an empty altar.');
  if (rm === 'mine' && !P.wall) showToast('An old mine. Light glints through a crack in the far wall.');
  if (rm === 'grotto' && !P.met) showToast('Someone groans by the far wall. A man, chained to a rock!');
  if (rm === 'boss' && !P.k_boss) { setTimeout(() => { if (CAVE && CAVE.room === 'boss' && !CAVE.troll) { CAVE.troll = caveSpawn('caveTroll', 0, 609, 'boss'); combatSound('goblinAttack'); showToast('A cave troll heaves itself up from a pile of bones!'); } }, 600); }
}
// the creatures: whoever is in the room with you comes for you, round anything in the way; everyone you aren't fighting still swings at you
function caveMobs(now, dt){
  const alive = CAVE.mons.filter(m => m.state !== 'dying' && m.state !== 'dead');
  // a room is cleared once everything in it is down
  for (const k of ['gate', 'chasm', 'mine', 'forge', 'braz', 'boss']) {
    if (CAVE_P['k_' + k] || CAVE.cleared[k] || !CAVE.mons.some(m => m.croom === k) || alive.some(m => m.croom === k)) continue;
    if (k === 'boss' && !(CAVE.troll && CAVE.troll.state !== 'standing' && CAVE.troll.state !== 'engaged')) continue;
    CAVE_P['k_' + k] = 1; CAVE.cleared[k] = 1; saveNow(false);
    if (k === 'gate') { setTimeout(() => { caveRumble(); creakSound(1.2); CV.portcullis.set(true); }, 800); setTimeout(() => showToast('With the goblins beaten, the portcullis to the north grinds open.'), 900); }
    if (k === 'braz') { CV.emberKey.visible = true; setTimeout(() => showToast('The rats are dead, and the fires burn steady. An orange key glows on the altar.'), 1000); }
    if (k === 'forge') setTimeout(() => showToast('The forge is yours. A key mould sits on their anvil.'), 1000);
    if (k === 'boss') caveWon();
  }
  // the troll calls for help when it's hurt
  const T = CAVE.troll; if (T && !CAVE.helped && T.state !== 'dying' && T.state !== 'dead' && T.hp <= T.t.hp / 2) { CAVE.helped = true; showToast('The troll bellows, and a blind rat scuttles out of a crack!'); caveSpawn('blindRat', -11, 604, 'boss', 0); }
  const here = alive.filter(m => m.croom === CAVE.room);
  const lead = FIGHT && here.includes(FIGHT.m) ? FIGHT.m : null;
  const leadA = lead ? Math.atan2(lead.g.position.x - hero.position.x, lead.g.position.z - hero.position.z) : 0;
  alive.forEach((m, i) => {
    if (m.anim && now - m.anim.t0 < m.anim.dur) monsterPose(m, m.anim.kind, (now - m.anim.t0) / m.anim.dur);
    if (lead === m) return;
    const waiting = alive.some(o => o !== m && o.croom === m.croom && o.order < m.order);
    if (m.croom !== CAVE.room || HP.cur <= 0 || waiting) { if (waiting && m.croom === CAVE.room && !caveStep(m, m.home[0], m.home[1], 0.2, now, dt)) { m.g.rotation.y = yawTo(m.g.position.x, m.g.position.z, hero.position.x, hero.position.z); if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'ready'); m.x = m.g.position.x; m.z = m.g.position.z; return; } if (!caveStep(m, m.home[0], m.home[1], 0.2, now, dt) && (!m.anim || now - m.anim.t0 >= m.anim.dur)) monsterPose(m, 'idle'); m.x = m.g.position.x; m.z = m.g.position.z; return; }
    const reach = reachOf(m);
    let tx = hero.position.x, tz = hero.position.z, want = reach;
    if (lead) { const a = leadA + (i % 2 ? 1 : -1) * Math.PI * 0.6; tx += Math.sin(a) * reach; tz += Math.cos(a) * reach; want = 0.15; if (monsterHit(tx, tz)) { tx = hero.position.x; tz = hero.position.z; want = reach; } }
    if (!caveStep(m, tx, tz, want, now, dt)) {
      m.g.rotation.y = yawTo(m.g.position.x, m.g.position.z, hero.position.x, hero.position.z);
      if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'ready');
      const d = Math.hypot(hero.position.x - m.g.position.x, hero.position.z - m.g.position.z);
      if (!FIGHT && !walkTarget && m.state === 'standing' && d < reach + 0.6) { m.state = 'engaged'; FIGHT = { m, nextP: now + 600, nextM: now + 1200, pAnim: null, mAnim: null }; heroAnim.yaw = yawTo(hero.position.x, hero.position.z, m.g.position.x, m.g.position.z); setAct({ k: 'fight', n: m.name, t: Date.now() }); }
      else if (FIGHT && FIGHT.m !== m && d < reach + 0.6) { if (!m.nextHit) m.nextHit = now + 900 + Math.random() * 600; if (now > m.nextHit) { m.nextHit = now + m.t.speed; sideSwing(m); } }
    }
    m.x = m.g.position.x; m.z = m.g.position.z;
  });
}
// one step towards a spot: straight there if the way is clear, otherwise along a route round whatever is in the way. False once it's there.
function caveStep(m, tx, tz, want, now, dt){
  const p = m.g.position; let dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  if (d <= want + 0.1) { m.route = null; return false; }
  let clear = true; for (let s = 0.5; s < d && clear; s += 0.5) if (monsterHit(p.x + dx / d * s, p.z + dz / d * s)) clear = false;
  let gx = tx, gz = tz, gw = want;
  if (!clear) {
    if (!m.route || now - (m.routeAt || 0) > 900) { m.routeAt = now; m.route = findPath(p, new THREE.Vector3(tx, 0, tz)).slice(1); }
    while (m.route.length && Math.hypot(m.route[0].x - p.x, m.route[0].z - p.z) < 0.3) m.route.shift();
    if (!m.route.length) { if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'ready'); m.g.rotation.y = yawTo(p.x, p.z, hero.position.x, hero.position.z); return true; }   /* no way through (the chasm): it glares from the edge */
    gx = m.route[0].x; gz = m.route[0].z; gw = 0;
  }
  dx = gx - p.x; dz = gz - p.z; d = Math.hypot(dx, dz); if (d < 0.01) return true;
  const st = Math.min(Math.max(0.01, d - gw), 3.2 * dt), nx = p.x + dx / d * st, nz = p.z + dz / d * st;
  if (monsterHit(nx, nz) && !monsterHit(p.x, p.z)) { m.route = null; m.routeAt = 0; }
  else { p.x = nx; p.z = nz; }
  turnChibi(m.g, Math.atan2(dx, dz)); if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'walk');
  return true;
}
function caveWon(){
  CAVE.won = true; CAVE.wonAt = performance.now(); CV.bossChest.g.visible = true; CV.bossChest.g.scale.setScalar(0.01); CV.bossRope.visible = true;
  CV.chestBox = CV.chestBox || { x0: CV_AT.bossChest[0] - 0.9, x1: CV_AT.bossChest[0] + 0.9, z0: CV_AT.bossChest[1] - 0.6, z1: CV_AT.bossChest[1] + 0.6 }; if (!solidBoxes.includes(CV.chestBox)) solidBoxes.push(CV.chestBox);
  if (!LIGHT_SPOTS.some(p => p[0] === CV_AT.bossChest[0] && p[2] === CV_AT.bossChest[1])) LIGHT_SPOTS.push([CV_AT.bossChest[0], 2.5, CV_AT.bossChest[1]]);
  updateDayNight.next = 0;
  setTimeout(() => { showToast('The cave troll crashes to the ground. A chest lies among the bones, and a rope hangs down from a crack of daylight.'); addSystemLine('Open the chest to claim your reward.'); }, 1200);
}

// ----- the cave's ambience, made in code from filtered noise and a long echo (no tones, which sounded like an arcade): room tone, a cold draught, water dripping and the odd groan from deep in the rock.
// It plays at the music volume, and the village music fades out while you're down here (updateFightMusic). -----
const CAVE_AMB = { g: null };
// noise, white or brown (white noise summed and leaked, so it's all rumble); and a cave's echo: a long, dark, decaying tail
function caveNoise(ctx, dur, brown){ const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let v = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { v = (v + 0.02 * w) / 1.02; d[i] = v * 3.5; } else d[i] = w; } return b; }
function caveReverb(ctx){ const sr = ctx.sampleRate, n = Math.floor(sr * 3.2), b = ctx.createBuffer(2, n, sr);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { lp += 0.25 * ((Math.random() * 2 - 1) - lp); d[i] = lp * Math.pow(1 - i / n, 3.2) * (i < sr * 0.012 ? i / (sr * 0.012) : 1); } }
  const cv = ctx.createConvolver(); cv.buffer = b; return cv; }
function caveAmbBed(ctx, out){
  const loop = (buf, f0, type, q, vol) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = f0; f.Q.value = q; const g = ctx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(out); s.start(); return { f, g }; };
  const brown = caveNoise(ctx, 6, true);   /* no wind and no trickle: the owner turned both down */
  loop(brown, 110, 'lowpass', 0.5, 0.55);   // the room tone: the deep, still hum of a big space underground
  const rv = caveReverb(ctx), wet = ctx.createGain(); wet.gain.value = 0.9; rv.connect(wet); wet.connect(out); CAVE_AMB.rv = rv;   /* the drips and the shifting rock ring in this */
}
function caveDrip(ctx, out, t, near = 0, pitch = 0){   // a drop hitting a pool somewhere: a tiny tick of noise, ringing at the water's note, mostly heard in the echo
  const rv = CAVE_AMB.rv, s = ctx.createBufferSource(); s.buffer = caveNoise(ctx, 0.05, false);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 18; const f = pitch || 650 + Math.random() * 600; bp.frequency.setValueAtTime(f, t); bp.frequency.linearRampToValueAtTime(f * 1.25, t + 0.04);
  const g = ctx.createGain(), v = (0.25 + Math.random() * 0.25) * (near ? 1.3 : 0.6); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  const dry = ctx.createGain(); dry.gain.value = near ? 0.7 : 0.12; s.connect(bp); bp.connect(g); g.connect(dry); dry.connect(out); if (rv) g.connect(rv); s.start(t); s.stop(t + 0.06);
}
function caveGroan(ctx, out, t){   // rock shifting far off: a low slow surge of rumble, and a few small stones skittering down after it
  const rv = CAVE_AMB.rv, s = ctx.createBufferSource(); s.buffer = caveNoise(ctx, 4, true);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(90, t); lp.frequency.linearRampToValueAtTime(160, t + 1.4); lp.frequency.linearRampToValueAtTime(70, t + 3.8);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.7, t + 1.3); g.gain.linearRampToValueAtTime(0.0001, t + 3.8);
  s.connect(lp); lp.connect(g); g.connect(out); if (rv) g.connect(rv); s.start(t); s.stop(t + 4);
  for (let i = 0; i < 5; i++) { const at = t + 1.6 + i * (0.12 + Math.random() * 0.25), c = ctx.createBufferSource(); c.buffer = caveNoise(ctx, 0.03, false);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500 + Math.random() * 500; bp.Q.value = 4; const cg = ctx.createGain(); cg.gain.setValueAtTime(0.05 + Math.random() * 0.05, at); cg.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    c.connect(bp); bp.connect(cg); if (rv) cg.connect(rv); c.start(at); c.stop(at + 0.04); }
}
function cavePebble(ctx, out, t){   // a pebble working loose: a couple of small knocks off the rock
  const rv = CAVE_AMB.rv; for (let i = 0; i < 3; i++) { const at = t + i * (0.09 + Math.random() * 0.12), c = ctx.createBufferSource(); c.buffer = caveNoise(ctx, 0.03, false);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700 + Math.random() * 500; bp.Q.value = 6; const g = ctx.createGain(); g.gain.setValueAtTime(0.12 / (i + 1), at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    c.connect(bp); bp.connect(g); g.connect(out); if (rv) g.connect(rv); c.start(at); c.stop(at + 0.04); } }
function caveBats(ctx, out, t){   // bats somewhere off in the dark: soft quick wingbeats passing by, fading in and out
  const rv = CAVE_AMB.rv, n = 10 + Math.floor(Math.random() * 8), rate = 0.075 + Math.random() * 0.02;
  for (let i = 0; i < n; i++) { const at = t + i * rate + Math.random() * 0.01, env = Math.sin(Math.PI * (i + 0.5) / n), c = ctx.createBufferSource(); c.buffer = caveNoise(ctx, 0.05, false);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 + Math.random() * 300; bp.Q.value = 1.2; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.05 * env, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    c.connect(bp); bp.connect(g); g.connect(out); if (rv) g.connect(rv); c.start(at); c.stop(at + 0.06); } }
// what happens next and when (now: a clock in ms): drips near and far, a spot that drips steadily for a while, a pebble, bats, the rock shifting
function caveAmbTick(ctx, out, t, now){
  const A = CAVE_AMB, rnd = (a, b) => a + Math.random() * (b - a);
  if (!A.far) Object.assign(A, { far: now + 500, near: now + rnd(3000, 7000), spot: now + rnd(8000, 15000), peb: now + rnd(15000, 30000), bats: now + rnd(30000, 60000), groan: now + rnd(12000, 20000) });
  if (now > A.far) { A.far = now + rnd(500, 2200); caveDrip(ctx, out, t + rnd(0, 0.05)); }
  if (now > A.near) { A.near = now + rnd(4000, 9000); caveDrip(ctx, out, t, 1); }
  if (now > A.spot) { A.spot = now + rnd(20000, 35000); const gap = rnd(0.6, 0.9), n = 5 + Math.floor(Math.random() * 5), f0 = rnd(700, 1150); for (let i = 0; i < n; i++) caveDrip(ctx, out, t + i * gap * rnd(0.95, 1.05), 1, f0 * rnd(0.97, 1.03)); }   /* the same drop, again and again */
  if (now > A.peb) { A.peb = now + rnd(20000, 40000); cavePebble(ctx, out, t); }
  if (now > A.bats) { A.bats = now + rnd(45000, 90000); caveBats(ctx, out, t); }
  if (now > A.groan) { A.groan = now + rnd(30000, 55000); caveGroan(ctx, out, t + 0.05); }
}
function caveAmbience(on){
  if (!on && !CAVE_AMB.g) return;
  const ctx = audio(); if (!ctx) return;
  if (!CAVE_AMB.g) { CAVE_AMB.g = ctx.createGain(); CAVE_AMB.g.gain.value = 0; CAVE_AMB.g.connect(ctx.destination); caveAmbBed(ctx, CAVE_AMB.g); }
  const want = on ? 0.6 * musicLevel() : 0; if (Math.abs(CAVE_AMB.want - want) > 0.001 || CAVE_AMB.want === undefined) { CAVE_AMB.want = want; CAVE_AMB.g.gain.setTargetAtTime(want, ctx.currentTime, 0.8); }
  if (!on) return;
  caveAmbTick(ctx, CAVE_AMB.g, ctx.currentTime + 0.02, performance.now());
}
