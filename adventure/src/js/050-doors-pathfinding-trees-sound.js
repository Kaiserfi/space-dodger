// ----- doors and walls -----
const HS = HALL_SCALE;
const DOOR_WORLD = new THREE.Vector3(HALL.x, 0, HALL.z + 5.5 * HS);
const OUTSIDE = new THREE.Vector3(DOOR_WORLD.x, 0, DOOR_WORLD.z + 1.6 * HS);
const INSIDE = new THREE.Vector3(DOOR_WORLD.x, 0, DOOR_WORLD.z - 2.0 * HS);
const box = (x0, x1, z0, z1) => ({x0: HALL.x + x0 * HS, x1: HALL.x + x1 * HS, z0: HALL.z + z0 * HS, z1: HALL.z + z1 * HS});
const solidBoxes = [
  box(-6.8, 6.8, -5.8, -5.0),      // north wall
  box(-6.8, -1.3, 5.0, 5.8),       // south wall, left of the doorway
  box(1.3, 6.8, 5.0, 5.8),         // south wall, right of the doorway
  box(-6.8, -6.0, -5.8, 5.8),      // west wall
  box(6.0, 6.8, -5.8, 5.8),        // east wall
];
// the centre pillar blocks movement too
solidBoxes.push(box(-0.5, 0.5, -0.5, 0.5));
// the river is solid water: the route goes round the town, not through it
{ const bx = NORTH.bridge.x, hw = NORTH.bridge.hw;
  solidBoxes.push({ x0: -120, x1: bx - hw, z0: -16.9, z1: -11.1 }, { x0: bx + hw, x1: 120, z0: -16.9, z1: -11.1 });   // the bridge crosses the gap
  for (let x = -120; x < 120; x++) { if (x + 1 > bx - hw && x < bx + hw) continue;   // and the river's far half, out to 0.4 past its north bank
    const nb = Math.min(...[x, x + 0.5, x + 1].map(q => riverSouth(q) - riverWidth(q))) - 0.4; solidBoxes.push({ x0: x, x1: x + 1, z0: nb, z1: -16.9 }); }
  // the north stream and pool, like the stream in the west, with a gap at the footbridge
  for (let z = -88; z < -16; z += 0.5) { if (z > NORTH.ford - 1.6 && z < NORTH.ford + 1.6) continue; let run = null;
    for (let x = 30; x <= 92; x += 0.5) { const w = northWaterSD(x + 0.25, z + 0.25) < 0.4;
      if (w && run === null) run = x; if ((!w || x === 92) && run !== null) { solidBoxes.push({ x0: run, x1: w ? x + 0.5 : x, z0: z, z1: z + 0.5 }); run = null; } } }
  // the hills: a strip of boxes for each unit going north, wherever the ground rises; and each knoll
  for (let z = -120; z < -19; z++) { let run = null;
    for (let x = -120; x <= 120; x++) { const w = x < 120 && northOut(x + 0.5, z + 0.5) > -0.3;
      if (w && run === null) run = x; if (!w && run !== null) { solidBoxes.push({ x0: run, x1: x, z0: z, z1: z + 1 }); run = null; } } }
  for (const [mx, mz, r] of NORTH.knolls) solidBoxes.push({ x0: mx - r * 0.62, x1: mx + r * 0.62, z0: mz - r * 0.62, z1: mz + r * 0.62 });
}
// the stream and the pond are solid too: a strip of boxes for each half unit going south, reaching 0.4 past the water's edge
for (let z = -11; z < 98; z += 0.5) { let run = null;
  for (let x = -117; x <= -65; x += 0.5) { const w = waterSD(x + 0.25, z + 0.25) < 0.4;
    if (w && run === null) run = x; if ((!w || x === -65) && run !== null) { solidBoxes.push({ x0: run, x1: w ? x + 0.5 : x, z0: z, z1: z + 0.5 }); run = null; } } }
// materials for the smithy
const fireMat = new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 1.2, flatShading: true });
const stoneDark = mat(0x5a5650), ironDark = mat(0x3a3f46), steelTop = mat(0x6a7078);
const doorBox = box(-1.3, 1.3, 5.4, 5.6);   // only solid while shut
let doorOpen = false, doorTargetAngle = 0, doorCloseIn = 0;
// solid boxes are filed into 4-unit squares, so a check only looks at the few boxes nearby. The index is rebuilt whenever a box is added or removed.
let boxVer = 0, boxIdx = null, boxIdxVer = -1;
solidBoxes.push = function(...a){ boxVer++; return Array.prototype.push.apply(this, a); };
solidBoxes.splice = function(...a){ boxVer++; return Array.prototype.splice.apply(this, a); };
const BUCKET = 4, bKey = (bx, bz) => bx * 4096 + bz;
function boxesNear(x, z){
  if (boxIdxVer !== boxVer) {
    boxIdx = new Map(); boxIdxVer = boxVer;
    for (const b of solidBoxes) for (let bx = Math.floor((b.x0 - 1) / BUCKET); bx <= Math.floor((b.x1 + 1) / BUCKET); bx++)
      for (let bz = Math.floor((b.z0 - 1) / BUCKET); bz <= Math.floor((b.z1 + 1) / BUCKET); bz++) { const k = bKey(bx, bz); let l = boxIdx.get(k); if (!l) boxIdx.set(k, l = []); l.push(b); }
  }
  return boxIdx.get(bKey(Math.floor(x / BUCKET), Math.floor(z / BUCKET))) || [];
}
const blocked = (x, z) => {
  const r = 1.0;    // the adventurer's visible body is about 2 units wide, so it stops this far from walls and pillars
  if (boxesNear(x, z).some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r)) return true;
  return !doorOpen && x > doorBox.x0 - r && x < doorBox.x1 + r && z > doorBox.z0 - r && z < doorBox.z1 + r;
};
let walkQueue = [];   // the rest of the route after the current waypoint
let walkFinal = null, walkTries = 0;   // where the walk is meant to end, and how many times it has re-planned
// ----- pathfinding: a grid of half-unit cells, A* around every solid box -----
const PATH = { C: 0.5, X0: -120, Z0: -120, NX: 481, NZ: 481 };   // the whole ground, half a unit a cell
const cellX = ix => PATH.X0 + ix * PATH.C, cellZ = iz => PATH.Z0 + iz * PATH.C;
const cellFree = (ix, iz) => !blocked(cellX(ix), cellZ(iz));
// does the body overlap a solid box right here (no clearance margin)? used to let a character step out of a tight spot
/* a monster's body against walls and solid things, with room for its size */
function monsterHit(x, z){ const r = 0.7; return boxesNear(x, z).some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r); }
function hardHit(x, z){ return boxesNear(x, z).some(bx => x > bx.x0 - 0.05 && x < bx.x1 + 0.05 && z > bx.z0 - 0.05 && z < bx.z1 + 0.05); }   // overlapping a box, with only a hair of tolerance
// A* over the grid. If the target cannot be reached, the route goes to the reachable cell nearest to it.
let CAVE = null;   // the cave dungeon while you're in it (345-cave-dungeon)
function findPath(fromV, toV){
  if (DELVE) { let x = toV.x - DELVE_C.x, z = toV.z - DELVE_C.z; const d = Math.hypot(x, z), m = DELVE_C.pit - 1.2; if (d > m) { x *= m / d; z *= m / d; } return [{ x: fromV.x, z: fromV.z }, { x: DELVE_C.x + x, z: DELVE_C.z + z }]; }
  if (fromV.z > 550 && !PATH.cave) { const keep = { X0: PATH.X0, Z0: PATH.Z0, NX: PATH.NX, NZ: PATH.NZ };   /* down in the cave: its own smaller grid */
    Object.assign(PATH, CAVE_GRID, { cave: true }); try { return findPath(fromV, toV); } finally { Object.assign(PATH, keep, { cave: false }); } }
  const { NX, NZ } = PATH;
  const sx = Math.round((fromV.x - PATH.X0) / PATH.C), sz = Math.round((fromV.z - PATH.Z0) / PATH.C);
  const gx = Math.min(NX - 1, Math.max(0, Math.round((toV.x - PATH.X0) / PATH.C)));
  const gz = Math.min(NZ - 1, Math.max(0, Math.round((toV.z - PATH.Z0) / PATH.C)));
  // a cell is usable if the body fits there; right next to where we stand, any cell we are not actually inside is usable, so a tight spot can be left
  const free = new Int8Array(NX * NZ).fill(-1);   // which cells the body fits in, worked out only for the cells the search reaches
  const isFree = i => { if (free[i] < 0) { const ix = i % NX; free[i] = blocked(cellX(ix), cellZ((i - ix) / NX)) ? 0 : 1; } return free[i] === 1; };
  const usable = (ix, iz) => isFree(iz * NX + ix) || (Math.hypot(ix - sx, iz - sz) < 6 && !hardHit(cellX(ix), cellZ(iz)));
  const N = NX * NZ, g = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const h = (ix, iz) => { const dx = Math.abs(ix - gx), dz = Math.abs(iz - gz); return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz); };
  const heap = [];   // a small binary heap of [score, cell]
  const hpush = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const q = (k - 1) >> 1; if (heap[q][0] <= heap[k][0]) break; [heap[q], heap[k]] = [heap[k], heap[q]]; k = q; } };
  const hpop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const start = sz * NX + sx, goal = gz * NX + gx;
  g[start] = 0; hpush(h(sx, sz), start);
  const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  let best = start, bestD = Infinity;   // the reachable cell nearest the target
  while (heap.length) {
    const cur = hpop()[1];
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % NX, cz = (cur - cx) / NX;
    const dd = Math.hypot(cx - gx, cz - gz);
    if (dd < bestD) { bestD = dd; best = cur; }
    if (cur === goal) break;
    for (const [dx, dz, cost] of dirs) {
      const nx = cx + dx, nz = cz + dz;
      if (nx < 0 || nz < 0 || nx >= NX || nz >= NZ) continue;
      const ni = nz * NX + nx;
      if (closed[ni] || !usable(nx, nz)) continue;
      if (dx && dz && (!usable(cx + dx, cz) || !usable(cx, cz + dz))) continue;   // no cutting corners
      const ng = g[cur] + cost;
      if (ng < g[ni]) { g[ni] = ng; from[ni] = cur; hpush(ng + h(nx, nz), ni); }
    }
  }
  const target = closed[goal] ? goal : best;
  if (target === start && start !== goal) return [];   // not a single step can be taken towards it
  const pts = [];
  for (let c = target; c !== -1; c = from[c]) { const ix = c % NX, iz = (c - ix) / NX; pts.push({ x: cellX(ix), z: cellZ(iz) }); if (c === start) break; }
  pts.reverse();
  pts[0] = { x: fromV.x, z: fromV.z };
  return pts;
}
function walkStart(point, then, replan = false){
  if (!replan) {   /* only a walk the player starts; the game re-planning a route round something is not walking away */
    if (typeof farmChain !== 'undefined') farmChain = null;   // a new walk ends any farming run
    if (typeof farmBusy !== 'undefined' && farmBusy) { farmBusy.cancelled = true; farmBusy = null; if (ONLINE.act && ONLINE.act.k === 'farm') setAct(null); }   /* and stops the job in hand: walking away means it doesn't get done */
  }
  if (EV.seat >= 0) standUp();   // any walk gets you up off the bench
  if (!replan && typeof stopLighting === 'function') stopLighting();
  if (!replan && typeof stopCaveJob === 'function') stopCaveJob();   /* walking off stops a job in the cave */
  unstick();
  const path = findPath(hero.position, point);
  if (!replan) walkTries = 0;   // a new click starts with fresh re-plans
  walkFinal = point;
  walkThen = then || null;
  if (path.length === 0) { walkTarget = null; walkQueue = []; walkThen = null; showToast('No way through there.'); return; }
  if (path.length === 1) { walkTarget = point.clone(); walkQueue = []; return; }
  walkTarget = new THREE.Vector3(path[1].x, 0, path[1].z);
  walkQueue = path.slice(2).map(q => new THREE.Vector3(q.x, 0, q.z));
}
// door creaks, like a floorboard: wood rubbing in tiny stick-slip catches, rung through a few woody tones.
// Opening rises, closing falls. The catches are worked out once and kept.
const creakBufs = {};
function creakBuffer(ctx, open){
  const key = open ? 'o' : 'c'; if (creakBufs[key]) return creakBufs[key];
  const d = open ? 0.42 : 0.34, r0 = open ? 150 : 250, r1 = open ? 260 : 140, n = Math.floor(d * ctx.sampleRate);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), x = buf.getChannelData(0);
  let t = 0, seed = open ? 3 : 8; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (;;) { const k = t / d, rate = r0 + (r1 - r0) * k + 8 * Math.sin(k * 11); t += (1 / rate) * (0.85 + 0.3 * rnd());
    const i = Math.floor(t * ctx.sampleRate); if (i >= n) break; x[i] += 0.6 + 0.4 * rnd(); }
  for (let i = 0; i < n; i++) x[i] += (rnd() * 2 - 1) * 0.02;
  return creakBufs[key] = buf;
}
function creak(open = true){
  try {
    sfx((ctx, t, out) => {
      const src = ctx.createBufferSource(); src.buffer = creakBuffer(ctx, open); src.playbackRate.value = wobble();
      const d = src.buffer.duration / src.playbackRate.value, env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(1.6, t + d * 0.18); env.gain.setValueAtTime(1.6, t + d * 0.75); env.gain.exponentialRampToValueAtTime(0.0001, t + d);
      for (const [f, q, g] of [[760, 5, 1], [1450, 6, 0.7], [2600, 7, 0.35]]) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const gg = ctx.createGain(); gg.gain.value = g; src.connect(bp); bp.connect(gg); gg.connect(env); }
      env.connect(out); out.gain.value = 0.9; src.start(t); src.stop(t + d + 0.02);
    });
  } catch (e) {}
}
function openDoor(){ if (doorOpen) return; doorOpen = true; doorTargetAngle = Math.PI / 2; creak(true); }
function closeDoor(){ if (!doorOpen) return; doorOpen = false; doorTargetAngle = 0; creak(false); }
// walk to the door's near side, open it, walk through, then it shuts again a few seconds later
function useDoor(){
  if (!hero) return;
  const inside = hero.position.z < DOOR_WORLD.z;     // north of the door is inside the hall
  const front = inside ? INSIDE : OUTSIDE, beyond = inside ? OUTSIDE : INSIDE;
  walkStart(front, () => { openDoor(); walkStart(beyond, () => { doorCloseIn = 240; }); });
}
function updateDoor(){
  // while the adventurer is inside, the stone turns see-through so they can be seen
  if (hero) {
    const inside = Math.abs(hero.position.x - HALL.x) < 7 * HS && Math.abs(hero.position.z - HALL.z) < 6 * HS;
    roofMesh.visible = !inside;   // the roof lifts away while you are inside, and comes back outside
  }
  doorPivot.rotation.y += (doorTargetAngle - doorPivot.rotation.y) * 0.2;   // the door eases open or shut
  if (doorOpen && doorCloseIn > 0) {
    const nearDoor = hero && Math.abs(hero.position.z - DOOR_WORLD.z) < 1.2 && Math.abs(hero.position.x - DOOR_WORLD.x) < 2;
    if (!nearDoor) doorCloseIn--;
    if (doorCloseIn === 0) closeDoor();
  }
}

const trees = [];   // the trees that can be clicked or hovered right now
const treeRecs = []; // every tree's state, standing or not
// ----- a tree built from our own shapes: a tapered trunk with root flares and a lumpy, leafy crown -----
// The crown's vertices are nudged by a hash of their position, so the blobs look uneven but still join up.
// a tree is one solid thing, so its trunk, roots and leaves are joined into a single mesh coloured per corner (eleven draws become one)
const TREE_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0 });
function mergeTree(g){
  const geos = g.children.map(m => { m.updateMatrix(); const q = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); q.applyMatrix4(m.matrix);
    const n = q.attributes.position.count, col = new Float32Array(n * 3), c = m.material.color; for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    q.setAttribute('color', new THREE.BufferAttribute(col, 3)); return q; });
  const all = mergeGeometries(geos); if (!all) return;
  g.children.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); g.clear(); g.add(new THREE.Mesh(all, TREE_MAT));
}
function makeTree(x, z, s = 1, oak = false){
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.34 * s, 2.8 * s, 7), mat(0x5a3a1e));
  trunk.position.y = 1.4 * s; g.add(trunk);
  for (let i = 0; i < 4; i++) {                       // root flares at the base
    const a = i * Math.PI / 2 + 0.4;
    const root = new THREE.Mesh(new THREE.ConeGeometry(0.16 * s, 0.6 * s, 5), mat(0x4a2e16));
    root.position.set(Math.cos(a) * 0.3 * s, 0.18 * s, Math.sin(a) * 0.3 * s);
    root.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(root);
  }
  const greens = oak ? [0x3f6e2a, 0x4f7f32, 0x2e5a22, 0x5a8a3a] : [0x2f7a2c, 0x3d8f34, 0x26662a, 0x4a9e3a];
  const blobs = oak
    ? [[0, 0, 0, 1.7], [1.3, 0.3, 0.4, 1.4], [-1.2, 0.4, -0.3, 1.5], [0.2, 0.9, -1.2, 1.3], [-0.4, 1.1, 0.9, 1.3], [0.9, 1.4, -0.6, 1.1]]
    : [[0, 0, 0, 1.25], [0.9, 0.5, 0.3, 0.95], [-0.8, 0.6, -0.2, 1.0], [0.1, 0.9, -0.8, 0.9], [-0.3, 1.0, 0.7, 0.85], [0.6, 1.2, -0.5, 0.7]];
  blobs.forEach(([dx, dy, dz, r], i) => {
    const geo = new THREE.IcosahedronGeometry(r * s, 0);
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const px = pos.getX(v), py = pos.getY(v), pz = pos.getZ(v);
      const h = Math.sin(px * 12.9898 + py * 78.233 + pz * 37.719 + i * 1.7) * 43758.5453;
      const j = 0.85 + 0.3 * (h - Math.floor(h));
      pos.setXYZ(v, px * j, py * j, pz * j);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat(greens[i % greens.length]));
    m.position.set(dx * s, (2.5 + dy) * s, dz * s); g.add(m);
  });
  mergeTree(g);
  g.position.set(x, 0, z);                    // the origin is the base, so the tree falls over from its roots
  g.userData.action = 'Chop'; g.userData.name = oak ? 'Oak tree' : 'Tree';
  const h = Math.max(1, 0.35 * s);   // at least a 2x2 footprint, centred on the tree
  const box = { x0: x - h, x1: x + h, z0: z - h, z1: z + h };   // the trunk blocks walking
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.36 * s, 0.5 * s, 7), mat(0x6b4a2a));
  stump.position.set(x, 0.25 * s, z); stump.visible = false; town.add(stump);
  const rec = { kind: 'tree', key: nodeKey(x, z), until: 0, g, x, z, s, box, stump, state: 'standing', t: 0, dir: 1, level: oak ? 15 : 1, xp: oak ? 40 : 25 };   // oaks need Woodcutting 15
  g.userData.rec = rec; treeRecs.push(rec);
  trees.push(g); town.add(g); solidBoxes.push(box);
  return g;
}

// ----- sound: small sounds made with Web Audio, so there are no sound files to license -----
let audioCtx = null;
function audio(){
  try {
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); setTimeout(() => loadEatSound(audioCtx), 0); }   /* decode the eating sound early, ready for the first bite */
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (e) { return null; }
}
// all sound effects go through one gain, so the Sounds slider sets their volume
function sfxOut(ctx){
  if (!ctx.sfxBus) { ctx.sfxBus = ctx.createGain(); ctx.sfxBus.connect(ctx.destination); }
  ctx.sfxBus.gain.value = SETTINGS.sfxMute ? 0 : SETTINGS.sfx / 100;
  if (SOUND_AT && hero) {   /* a sound from somewhere in the world: quieter the further it is from you */
    const g = ctx.createGain(); g.gain.value = soundFalloff(Math.hypot(SOUND_AT.x - hero.position.x, SOUND_AT.z - hero.position.z)); g.connect(ctx.sfxBus); return g; }
  return ctx.sfxBus;
}
// sounds made somewhere else (other players' rocks, trees and fights): full within 8 units, fading to silence at 40
let SOUND_AT = null;
const soundFalloff = d => d <= 8 ? 1 : Math.pow(Math.max(0, 1 - (d - 8) / 32), 1.6);
function soundAt(x, z, play){
  if (hero && soundFalloff(Math.hypot(x - hero.position.x, z - hero.position.z)) <= 0) return;   // too far away to hear at all
  const prev = SOUND_AT; SOUND_AT = { x, z }; try { play(); } finally { SOUND_AT = prev; }
}
function noiseBuffer(ctx, dur){
  const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
// a short wooden "thock": a band of noise plus a low knock
function chopSound(){
  const ctx = audio(); if (!ctx) return; const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, 0.2);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 1.2;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  src.connect(bp); bp.connect(g); g.connect(sfxOut(ctx)); src.start(t); src.stop(t + 0.2);
  const o = ctx.createOscillator(), og = ctx.createGain();
  o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
  og.gain.setValueAtTime(0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  o.connect(og); og.connect(sfxOut(ctx)); o.start(t); o.stop(t + 0.15);
}
// a sharp clink for striking stone
