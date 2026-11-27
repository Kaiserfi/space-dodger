// ===== Farming: fenced fields east of the farm, where you till, plant, water and harvest wheat; and a windmill to grind it =====
// Each player's crops are their own (saved with them), like allotments: everyone sees their own wheat on the same patches.
var FARMLAND, FARM_PLOTS, FARM_CAN, CAN_MAX;   // var, so the town can build them before this part of the script runs
const GROW_S = 80;   // seconds per growth stage, while watered
function buildFarmland(){
  CAN_MAX = 10; FARM_CAN = FARM_CAN || { n: 0 };
  const F = FARMLAND = { X0: 63.5, X1: 86.5, Z0: -8.5, Z1: 8.5, patches: [], mill: { x: 93, z: 1 } };
  const add = (geo, m, x, y, z, parent = town) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  // the fence, with a gate on the west side facing the barn
  const fence = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.2)), a = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i <= n; i++) add(new THREE.BoxGeometry(0.24, 1.45, 0.24), 0x7a5a36, x0 + (x1 - x0) * i / n, 0.72, z0 + (z1 - z0) * i / n);
    for (const y of [0.55, 1.15]) add(new THREE.BoxGeometry(0.12, 0.14, L), 0x8a6a42, (x0 + x1) / 2, y, (z0 + z1) / 2).rotation.y = a;
    solidBoxes.push({ x0: Math.min(x0, x1) - 0.2, x1: Math.max(x0, x1) + 0.2, z0: Math.min(z0, z1) - 0.2, z1: Math.max(z0, z1) + 0.2 }); };
  fence(F.X0, F.Z0, F.X1, F.Z0); fence(F.X0, F.Z1, F.X1, F.Z1); fence(F.X1, F.Z0, F.X1, F.Z1);
  fence(F.X0, F.Z0, F.X0, -1.8); fence(F.X0, 1.8, F.X0, F.Z1);
  // a water trough just inside the gate, for filling watering cans
  add(new THREE.BoxGeometry(2.2, 0.7, 0.9), texMat(woodTex(), 2, 1, 0x7a5a3a), 65.8, 0.35, -6.6);
  add(new THREE.BoxGeometry(2.0, 0.06, 0.7), new THREE.MeshStandardMaterial({ color: 0x3a7ab0, roughness: 0.1 }), 65.8, 0.68, -6.6);
  solidBoxes.push({ x0: 64.6, x1: 67, z0: -7.2, z1: -6 });
  const tr = new THREE.Group(); tr.position.set(65.8, 0, -6.6); town.add(tr); add(new THREE.BoxGeometry(2.4, 1, 1.1), new THREE.MeshBasicMaterial({ visible: false }), 0, 0.5, 0, tr);
  tr.userData = { action: 'Fill can', name: 'Water trough', rec: { kind: 'trough', state: 'standing', x: 65.8, z: -6.6, onClick: () => troughClick(65.8, -6.6) } }; trees.push(tr);
  // twelve patches in three rows
  const soil = mat(0x6a4a2c), grassy = mat(0x5a8a3a), wet = mat(0x3e2a18);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const x = 69 + c * 5, z = -5 + r * 5, g = new THREE.Group(); g.position.set(x, 0, z); town.add(g);
    const bed = add(new THREE.BoxGeometry(3.8, 0.18, 3.8), grassy, 0, 0.09, 0, g);
    const furrows = []; for (let k = 0; k < 4; k++) furrows.push(add(new THREE.BoxGeometry(3.4, 0.12, 0.45), soil, 0, 0.22, -1.3 + k * 0.87, g));
    const crops = [[], [], [], []];   // what shows at each stage: seeds, sprouts, young wheat, ripe wheat
    for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) { const px = -1.4 + j * 0.7, pz = -1.3 + k * 0.87;
      crops[0].push(add(new THREE.SphereGeometry(0.06, 5, 4), 0xd8c070, px, 0.3, pz, g));
      const sp = add(new THREE.ConeGeometry(0.08, 0.35, 4), 0x6aaa48, px, 0.45, pz, g); crops[1].push(sp);
      const yg = add(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 4), 0x5a9a3a, px, 0.7, pz, g); crops[2].push(yg);
      const st = add(new THREE.CylinderGeometry(0.035, 0.045, 1.2, 4), 0xc8a850, px, 0.85, pz, g); crops[3].push(st);
      const ear = add(new THREE.ConeGeometry(0.09, 0.36, 5), 0xe0b850, px, 1.55, pz, g); ear.rotation.x = Math.PI; crops[3].push(ear); }
    for (const list of crops) for (const m of list) m.visible = false;
    const pt = { x, z, g, bed, furrows, crops, grassy, soil, wet, i: F.patches.length };
    pt.sets = { Wheat: crops, Aloe: cropStages('Aloe', g), Mulberry: cropStages('Mulberry', g) };
    g.userData = { action: 'Till', name: 'Farming patch', rec: { kind: 'patch', state: 'standing', x, z, onClick: () => patchClick(pt) } }; trees.push(g);
    F.patches.push(pt);
  }
  FARM_PLOTS = F.patches.map(() => ({ s: 'grass', g: 0, w: false, t: 0 }));
  // the windmill: a round stone tower, a wooden cap, and four sails turning in the wind
  const M = F.mill, mill = new THREE.Group(); mill.position.set(M.x, 0, M.z); town.add(mill);
  add(new THREE.CylinderGeometry(2.4, 3.1, 7.5, 12), texMat(wallStone, 3, 3, 0xd8d0c0), 0, 3.75, 0, mill);
  add(new THREE.ConeGeometry(2.9, 2.6, 12), new THREE.MeshStandardMaterial({ map: roofTex, color: 0x6a4a3a, flatShading: true }), 0, 8.8, 0, mill);
  add(new THREE.BoxGeometry(1.4, 2.2, 0.3), texMat(woodTex(), 1, 2, 0x8a5a2a), 0, 1.1, 3.0, mill);   // the door, facing south
  add(new THREE.BoxGeometry(0.7, 0.7, 0.2), mat(0x2a1a10), 0, 5.2, 2.6, mill);   // a little window
  const hub = new THREE.Group(); hub.position.set(0, 6.8, 2.9); mill.add(hub); add(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 10).rotateX(Math.PI / 2), mat(0x5a3a20), 0, 0, 0, hub);
  for (let i = 0; i < 4; i++) { const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; hub.add(arm);
    add(new THREE.BoxGeometry(0.18, 5, 0.12), mat(0x6a4a2a), 0, 2.6, 0.2, arm);
    add(new THREE.BoxGeometry(1.1, 3.8, 0.05), mat(0xe8e0cc), 0.62, 3.0, 0.25, arm); }
  F.sails = hub;
  solidBoxes.push({ x0: M.x - 3, x1: M.x + 3, z0: M.z - 3, z1: M.z + 3 });
  // the hopper by the door: put wheat in, flour comes out
  const hop = new THREE.Group(); hop.position.set(M.x + 1.9, 0, M.z + 3.4); town.add(hop);
  add(new THREE.BoxGeometry(1.0, 1.0, 1.0), texMat(woodTex(), 1, 1, 0x9a7448), 0, 0.5, 0, hop);
  add(new THREE.CylinderGeometry(0.75, 0.35, 0.8, 4), texMat(woodTex(), 1, 1, 0x8a6438), 0, 1.4, 0, hop).rotation.y = Math.PI / 4;
  solidAt(M.x + 1.9, M.z + 3.4, 0.6);
  hop.userData = { action: 'Mill wheat', name: 'Windmill hopper', rec: { kind: 'hopper', state: 'standing', x: M.x + 1.9, z: M.z + 3.4, onClick: () => hopperClick() } }; trees.push(hop);
}
// the farm biome, south of the windmill path: a chicken pen and a cow pen, giant rats loose about the place, and angry farmers on patrol.
// None of them start a fight; they only fight back.
function buildFarmPens(){
  const add = (geo, m, x, y, z, parent = town) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const fence = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.2)), a = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i <= n; i++) add(new THREE.BoxGeometry(0.24, 1.45, 0.24), 0x7a5a36, x0 + (x1 - x0) * i / n, 0.72, z0 + (z1 - z0) * i / n);
    for (const y of [0.55, 1.15]) add(new THREE.BoxGeometry(0.12, 0.14, L), 0x8a6a42, (x0 + x1) / 2, y, (z0 + z1) / 2).rotation.y = a;
    solidBoxes.push({ x0: Math.min(x0, x1) - 0.2, x1: Math.max(x0, x1) + 0.2, z0: Math.min(z0, z1) - 0.2, z1: Math.max(z0, z1) + 0.2 }); };
  const pen = (X0, X1, Z0, Z1, gx) => { fence(X0, Z0, gx - 1.3, Z0); fence(gx + 1.3, Z0, X1, Z0); fence(X0, Z1, X1, Z1); fence(X0, Z0, X0, Z1); fence(X1, Z0, X1, Z1); };   // the gate faces the path to the north
  // the chicken pen, with a little coop in the corner
  pen(64, 78, 17, 27, 71);
  const coop = new THREE.Group(); coop.position.set(75, 0, 24.3); town.add(coop);
  add(new THREE.BoxGeometry(2.6, 1.6, 2), texMat(woodTex(), 2, 1, 0xb08458), 0, 0.8, 0, coop);
  add(new THREE.BoxGeometry(0.6, 0.6, 0.06), mat(0x2a1a10), -0.6, 0.5, 1.02, coop);
  const roof = add(new THREE.ConeGeometry(2.05, 1.1, 4), new THREE.MeshStandardMaterial({ map: roofTex, color: 0x7a4a3a, flatShading: true }), 0, 2.15, 0, coop); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.8);
  add(new THREE.BoxGeometry(0.2, 0.08, 1.4), mat(0x7a5530), -0.6, 0.12, 1.6, coop).rotation.x = -0.35;   // a ramp up to the hatch
  solidBoxes.push({ x0: 73.4, x1: 76.6, z0: 23, z1: 25.6 });
  // the cow pen, with a trough and hay
  pen(84, 104, 17, 33, 93);
  add(new THREE.BoxGeometry(2.6, 0.7, 0.9), texMat(woodTex(), 2, 1, 0x7a5a3a), 100, 0.35, 19.6); add(new THREE.BoxGeometry(2.4, 0.06, 0.7), new THREE.MeshStandardMaterial({ color: 0x3a7ab0, roughness: 0.1 }), 100, 0.68, 19.6);
  solidBoxes.push({ x0: 98.6, x1: 101.4, z0: 19, z1: 20.2 });
  for (const [x, z, r] of [[87, 30.5, 0.3], [89.2, 31, -0.2]]) { add(new THREE.CylinderGeometry(0.8, 0.8, 1.3, 9), 0xd8b850, x, 0.8, z).rotation.set(Math.PI / 2, 0, r); solidAt(x, z, 0.9); }
  // paths from the windmill path down to each gate
  roadPath([[71, 11], [71, 16.2]]); roadPath([[93, 11], [93, 16.2]]);
}
function spawnFarmMonsters(){
  [[68, 20], [70, 23.5], [73, 20.5], [67, 25], [72, 25.5], [75.5, 20]].forEach(([x, z]) => spawnMonster('chicken', x, z, 2.5, { x0: 65, x1: 77, z0: 18, z1: 26 }));
  [[88, 21], [96, 23], [100, 28], [91, 28]].forEach(([x, z]) => spawnMonster('cow', x, z, 4, { x0: 85.5, x1: 102.5, z0: 18.5, z1: 31.5 }));
  [[68, 41], [80, 46], [96, 44], [104, 52], [72, 58], [90, 62], [100, 68], [71, 73]].forEach(([x, z]) => spawnMonster('rat', x, z, 5, { x0: 62, x1: 108, z0: 37, z1: 80 }));
  [[76, 50, 7], [96, 56, 7], [84, 59, 6]].forEach(([x, z, r]) => spawnMonster('farmer', x, z, r, { x0: 62, x1: 108, z0: 37, z1: 80 }));
  // the north, after all the farm's (so their shared ids never move): the meadow's rats, and the bigger ones by the iron rocks and the trout pool
  [[-25, -35], [-10, -45], [5, -31], [18, -48], [-28, -52], [26, -29]].forEach(([x, z]) => spawnMonster('hillRat', x, z, 5, { x0: -36, x1: 31, z0: -57, z1: -26 }));
  /* homes must be clear ground: a tree on one (-57,-59 and 66,-46) or the lake (92,-66) left a rat stuck there for good */
  [[-46, -77], [-37, -66], [-53, -57]].forEach(([x, z]) => spawnMonster('caveRat', x, z, 5, { x0: -62, x1: -34, z0: -82, z1: -56 }));
  [[32, -58], [61, -49], [88, -48]].forEach(([x, z]) => spawnMonster('caveRat', x, z, 5, { x0: 28, x1: 96, z0: -88, z1: -42 }));
  MONSTERS.forEach((m, i) => { m.sid = i; });   /* shared with everyone: same id, same wandering path, one fight at a time */
}
function farmRoads(){
  roadPath([[51, 0.6], [58, 1], [62.5, 0]]);                                                  // from the barn doors to the field gate
  roadPath([[62.5, 0], [61.5, 10.5], [80, 11], [FARMLAND.mill.x, 11], [FARMLAND.mill.x, FARMLAND.mill.z + 4.2]]);   // round the field to the windmill
  roadPath([[FARMLAND.mill.x, 11], [99, 10.5], [104, 9.5], [110, 8.5]]);   // on east to the farmers' market
  roadPath([[100.5, 10.3], [102, 5], [102.5, 0.4]]);   // and up to the workshop door
}
// how a patch looks right now, for you
function drawPatch(i){
  const pt = FARMLAND.patches[i], p = FARM_PLOTS[i];
  pt.bed.material = p.s === 'grass' ? pt.grassy : (p.w ? pt.wet : pt.soil);
  for (const f of pt.furrows) { f.visible = p.s !== 'grass'; f.material = p.w ? pt.wet : pt.soil; }
  const crop = p.c || 'Wheat'; for (const c in pt.sets) pt.sets[c].forEach((list, st) => list.forEach(m => { m.visible = p.s === 'planted' && p.g === st && c === crop; }));
  pt.g.userData.action = { grass: 'Till', tilled: 'Plant', planted: p.g >= 3 ? 'Harvest' : (p.w ? 'Check' : 'Water') }[p.s] || 'Till';
}

/* aloe and mulberry plants: every part of a growth stage is merged into one mesh (with its colours baked in), shared by all the patches, to keep the farm cheap to draw */
function cropStages(kind, parent){
  const C = cropStages.cache || (cropStages.cache = {});
  if (!C[kind]) {
    const parts = [], piece = (g, col, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => {
      g = g.toNonIndexed(); const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)); g.applyMatrix4(m);
      const c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k); parts.push(g); };
    const stage = fill => { parts.length = 0; fill(); return mergeGeometries(parts); };
    const seeds = () => { for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) piece(new THREE.SphereGeometry(0.06, 5, 4), kind === 'Aloe' ? 0x8a9a60 : 0x6a3a50, -1.4 + j * 0.7, 0.3, -1.3 + k * 0.87); };
    const spots = kind === 'Aloe' ? [[-1.1, -0.85], [0, -0.85], [1.1, -0.85], [-1.1, 0.85], [0, 0.85], [1.1, 0.85]] : [[-0.85, 0], [0.85, 0]];
    let geos;
    if (kind === 'Aloe') {
      const rosette = (n, len, w, lean, col) => { for (const [x, z] of spots) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + x; piece(new THREE.ConeGeometry(w, len, 4).translate(0, len / 2, 0), i % 2 ? col : 0x5a9070, x, 0.22, z, Math.cos(a) * lean, 0, -Math.sin(a) * lean, 1, 1, 0.55); }
        for (const [x, z] of spots) piece(new THREE.ConeGeometry(w * 0.8, len * 0.9, 4).translate(0, len * 0.45, 0), col, x, 0.22, z); };
      geos = [stage(seeds), stage(() => rosette(3, 0.3, 0.05, 0.4, 0x7ab088)), stage(() => rosette(5, 0.6, 0.09, 0.55, 0x6aa080)),
        stage(() => { rosette(7, 1.0, 0.14, 0.7, 0x7ab590); for (const [x, z] of spots) for (let i = 0; i < 5; i++) { const a = i * 1.3 + x; piece(new THREE.SphereGeometry(0.03, 4, 3), 0xd8f0d8, x + Math.sin(a) * 0.28, 0.55, z + Math.cos(a) * 0.28); } })];
    } else {
      const bush = (r, h, col, berries) => { for (const [x, z] of spots) { piece(new THREE.CylinderGeometry(0.06, 0.08, h, 5), 0x6a4a2a, x, 0.22 + h / 2, z);
          if (r) for (const [dx, dy, dz, s] of [[0, 0, 0, 1], [0.3, -0.15, 0.1, 0.75], [-0.28, -0.1, -0.15, 0.8], [0.05, 0.25, -0.2, 0.7]]) piece(new THREE.IcosahedronGeometry(r * s, 0), col, x + dx * r * 2, 0.22 + h + dy * r * 2, z + dz * r * 2);
          if (berries) for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = r * (0.75 + (i % 3) * 0.1); piece(new THREE.SphereGeometry(0.07, 5, 4).scale(1, 1.4, 1), i % 3 ? 0x3a1030 : 0x8a2050, x + Math.sin(a) * rr, 0.22 + h + Math.cos(i * 1.7) * r * 0.5, z + Math.cos(a) * rr); } } };
      geos = [stage(seeds), stage(() => { for (const [x, z] of spots) { piece(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 5), 0x6a8a3a, x, 0.42, z); for (const s of [-1, 1]) piece(new THREE.SphereGeometry(0.12, 6, 4).scale(1, 0.3, 0.6), 0x6aaa48, x + s * 0.12, 0.6, z, 0, 0, s * 0.4); } }),
        stage(() => bush(0.45, 0.5, 0x5a9a3a, false)), stage(() => bush(0.7, 0.7, 0x4a8a30, true))];
    }
    C[kind] = { geos, mat: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 }) };
  }
  return C[kind].geos.map(geo => { const m = new THREE.Mesh(geo, C[kind].mat); m.castShadow = true; m.visible = false; parent.add(m); return [m]; });
}
// crops grow a stage for each watering, once enough time has passed; the soil dries as they do
function growCrops(){
  if (!FARM_PLOTS) return;
  const now = Date.now();
  FARM_PLOTS.forEach((p, i) => {
    if (p.s === 'planted' && p.w && p.g < 3 && now - p.t > GROW_S * 1000) { p.g++; p.w = false; p.t = now; if (p.g === 3) addSystemLine(`Some of your ${(CROPS[p.c] || CROPS.Wheat).say} is ready to harvest.`); }
    drawPatch(i);
  });
  if (FARMLAND && FARMLAND.sails) FARMLAND.sails.rotation.z -= 0.004;
  updateSilkworks(); updateRiverLife();
}
let farmBusy = null;
let farmChain = null;   // the patch you're working through, one job after another, until you click somewhere else
function farmAct(pt, ms, label, done, reach = 2.7){   /* reach: how far from it you stand */
  if (farmBusy) return;
  const go = () => {
    const job = farmBusy = { t0: performance.now(), ms, done, kind: label }; heroAnim.yaw = yawTo(hero.position.x, hero.position.z, pt.x, pt.z);
    if (label === 'fill') farmSound('fill');
    setAct({ k: 'farm', f: label, t: Date.now() });
    setTimeout(() => {
      if (job.cancelled) return;   /* you walked off before it was done */
      farmBusy = null; if (ONLINE.act && ONLINE.act.k === 'farm') setAct(null); done(); saveNow(false);
      if (farmChain === pt && !walkTarget) setTimeout(() => { if (farmChain === pt && !walkTarget && !farmBusy) patchClick(pt, true); }, 250);   // straight on to the next job
    }, ms);
  };
  // already beside it: start at once; otherwise walk to the nearest free side of the patch
  if (Math.max(Math.abs(hero.position.x - pt.x), Math.abs(hero.position.z - pt.z)) < reach + 0.7) { walkTarget = null; walkQueue = []; go(); return; }
  const sides = [[-reach, 0], [reach, 0], [0, -reach], [0, reach]].map(([dx, dz]) => [pt.x + dx, pt.z + dz]).filter(([x, z]) => !blocked(x, z))
    .sort((a, b) => Math.hypot(a[0] - hero.position.x, a[1] - hero.position.z) - Math.hypot(b[0] - hero.position.x, b[1] - hero.position.z));
  const [sx, sz] = sides[0] || [pt.x - 2.7, pt.z];
  walkStart(new THREE.Vector3(sx, 0, sz), go);
  if (pt.i !== undefined) farmChain = pt;   // walkStart clears the chain, so set it again after (only for a patch: the trough is a one-off job)
}
function farmPose(g, kind, since){   // the pose for each farming job, for you and for others watching
  if (kind === 'till') poseChibi(g, 'swing', (since / 900) % 1, 'hoe');
  else if (kind === 'water') poseChibi(g, 'water', 0);
  else if (kind === 'fill') poseChibi(g, 'fill', 0);
  else poseChibi(g, 'plant', 0);   // planting and harvesting: down low at the crops
}
function updateFarmPose(){
  if (!farmBusy || !hero) return;
  const since = performance.now() - farmBusy.t0;
  if (farmBusy.kind === 'till') setHeroSwing((since / 900) % 1, 'hoe', heroAnim.yaw);
  else heroAnim.mode = farmBusy.kind === 'water' ? 'water' : farmBusy.kind === 'fill' ? 'fill' : 'plant';
}
// water pouring from the spout of any can being tipped, yours or another player's
const DROPS = { n: 60, pos: null, vel: [], life: [], i: 0, pts: null }, dropV = new THREE.Vector3();
function updateDrops(){
  if (!DROPS.pts) { DROPS.pos = new Float32Array(DROPS.n * 3).fill(-50); for (let i = 0; i < DROPS.n; i++) { DROPS.vel.push(new THREE.Vector3()); DROPS.life.push(0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(DROPS.pos, 3));
    DROPS.pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9ad0ff, size: 0.07, transparent: true, opacity: 0.85 })); DROPS.pts.frustumCulled = false; scene.add(DROPS.pts); }
  const pourers = [hero, ...Object.values(remote).map(r => r.sprite)].filter(g => g && g.userData.chibi && g.userData.chibi.tools.can.visible);
  for (const g of pourers) for (let k = 0; k < 2; k++) {
    g.userData.chibi.tools.can.userData.spout.getWorldPosition(dropV);
    const i = DROPS.i = (DROPS.i + 1) % DROPS.n; DROPS.pos.set([dropV.x, dropV.y, dropV.z], i * 3);
    const f = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)); DROPS.vel[i].set(f.x * 0.03 + (Math.random() - 0.5) * 0.01, -0.01, f.z * 0.03 + (Math.random() - 0.5) * 0.01); DROPS.life[i] = 1;
  }
  for (let i = 0; i < DROPS.n; i++) { if (DROPS.life[i] <= 0) continue; DROPS.vel[i].y -= 0.006; DROPS.pos[i * 3] += DROPS.vel[i].x; DROPS.pos[i * 3 + 1] += DROPS.vel[i].y; DROPS.pos[i * 3 + 2] += DROPS.vel[i].z;
    if (DROPS.pos[i * 3 + 1] < 0.2) { DROPS.life[i] = 0; DROPS.pos[i * 3 + 1] = -50; } }
  DROPS.pts.geometry.attributes.position.needsUpdate = true;
}
function patchClick(pt, auto){
  const p = FARM_PLOTS[pt.i];
  farmChain = pt;
  if (auto) {   // carrying on by itself: only the jobs you have what you need for, and stop quietly otherwise
    const can = p.s === 'tilled' ? false /* planting is always your choice, from the seed menu */ : p.s === 'planted' && p.g < 3 && !p.w ? hasTool('Watering can') && FARM_CAN.n > 0 : false;
    if (!can) { farmChain = null; return; }
  }
  if (FIGHT) { showToast("You can't do that in the middle of a fight!"); return; }
  if (p.s === 'grass') {
    if (!hasTool('Hoe')) { showToast('You need a hoe to till this patch. Tilly sells them at the farmers\' market.'); return; }
    farmAct(pt, 1800, 'till', () => { p.s = 'tilled'; p.w = false; addXp('Farming', 5); farmSound('till'); showToast('You turn over the soil.  +5 Farming XP'); });
  } else if (p.s === 'tilled') {
    openSeedMenu(pt);
  } else if (p.s === 'planted' && p.g >= 3) {
    const cr = CROPS[p.c] || CROPS.Wheat;
    if (bag.length >= BAG_SIZE && !hasItem(cr.item)) { showToast('Your bag is full.'); return; }
    farmAct(pt, 2000, 'harvest', () => { const n = cr.n[0] + Math.floor(Math.random() * (cr.n[1] - cr.n[0] + 1)); addItem(cr.item, n, ICON_FOR[cr.item]); p.s = 'tilled'; p.g = 0; p.w = false; addXp('Farming', cr.xpEach * n); farmSound('harvest'); if (cr.item === 'Wheat') rtAdvance(3, 4, 'Show Tilly your harvest.'); showToast(`You harvest ${n} ${cr.item.toLowerCase()}.  +${cr.xpEach * n} Farming XP`); });
  } else if (p.s === 'planted' && !p.w) {
    if (!hasTool('Watering can')) { showToast('These need watering. You need a watering can. Tilly sells them at the farmers\' market.'); return; }
    if (FARM_CAN.n <= 0) { showToast('Your watering can is empty. Fill it at the trough by the gate, or at any water nearby.'); return; }
    farmAct(pt, 1300, 'water', () => { FARM_CAN.n--; p.w = true; p.t = Date.now(); renderBag(); renderGear(); addXp('Farming', 3); farmSound('water'); showToast(`You water the ${(CROPS[p.c] || CROPS.Wheat).say}. (${FARM_CAN.n} waterings left in the can)  +3 Farming XP`); });
  } else {
    const left = Math.max(0, Math.ceil((GROW_S * 1000 - (Date.now() - p.t)) / 1000));
    showToast(['The seeds are watered. They should sprout soon', 'The sprouts are watered and growing', `The ${(CROPS[p.c] || CROPS.Wheat).say} is watered and coming along nicely`][p.g] + ` (about ${left} seconds).`);
  }
}
/* what can be planted: more seed types slot in here as they are added */
const SEEDS = [{ name: 'Wheat seeds', crop: 'Wheat', level: 1 }, { name: 'Aloe seeds', crop: 'Aloe', level: 3 }, { name: 'Mulberry seeds', crop: 'Mulberry', level: 5 }];
var CROPS = { Wheat: { item: 'Wheat', n: [3, 5], plantXp: 8, xpEach: 15, say: 'wheat' }, Aloe: { item: 'Aloe leaf', n: [2, 4], plantXp: 10, xpEach: 18, say: 'aloe' }, Mulberry: { item: 'Mulberry leaves', n: [3, 6], plantXp: 12, xpEach: 20, say: 'mulberry' } };
let lastPtr = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('pointerdown', e => { lastPtr = { x: e.clientX, y: e.clientY }; }, true);
function plantPatch(pt, seed){
  const p = FARM_PLOTS[pt.i]; if (p.s !== 'tilled') return;
  if (FIGHT) { showToast("You can't do that in the middle of a fight!"); return; }
  farmChain = pt;   /* from here the loop carries on by itself: watering, then harvesting */
    farmAct(pt, 1400, 'plant', () => { if (p.s !== 'tilled' || !hasItem(seed.name)) return; removeItem(seed.name); const cr = CROPS[seed.crop]; p.s = 'planted'; if (seed.crop === 'Wheat') rtAdvance(1, 2, 'Talk to Tilly at the farmers\' market.'); p.c = seed.crop; p.g = 0; p.w = false; p.t = Date.now(); addXp('Farming', cr.plantXp); farmSound('plant'); showToast(`You plant some ${seed.name.toLowerCase()}. Now give them some water.  +${cr.plantXp} Farming XP`); });
}
function openSeedMenu(pt){
  const lv = levelOf(SKILL_XP.Farming);
  itemMenu.innerHTML = '<div class="imHead">What to plant?</div>' + SEEDS.map((sd, i) => {
    const n = countOf(sd.name), ok = n > 0 && lv >= sd.level;
    const why = lv < sd.level ? `needs Farming ${sd.level}` : n ? `${n} in bag` : 'none in bag';
    return `<button data-o="${i}" ${ok ? '' : 'disabled style="opacity:.45;cursor:default"'}><span style="display:inline-flex;vertical-align:middle;width:22px;height:22px;margin-right:6px">${ICON_FOR[sd.name] || ''}</span>${sd.crop} <small style="color:#c9b27a">(${why})</small></button>`;
  }).join('') + '<button data-o="x">Cancel</button>';
  itemMenu.hidden = false;
  itemMenu.querySelectorAll('svg').forEach(v => { v.setAttribute('width', 22); v.setAttribute('height', 22); });
  itemMenu.style.left = Math.max(8, Math.min(innerWidth - 220, lastPtr.x + 6)) + 'px'; itemMenu.style.top = Math.max(8, Math.min(innerHeight - itemMenu.offsetHeight - 8, lastPtr.y - 10)) + 'px';
  itemMenu.onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; itemMenu.hidden = true; if (b.dataset.o === 'x') return;
    plantPatch(pt, SEEDS[+b.dataset.o]); };
}



