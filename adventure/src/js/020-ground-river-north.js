// ----- the ground, a river, a bridge and paths -----
// ----- the water: the river winds along the north, a stream leaves it in the west and runs south into the pond -----
// waterSD(x, z) is how far a point is from the water's edge (below 0 is in the water). The ground, the grass, the solid water
// and the reeds all follow it. The river's south bank stays clear of the walkable edge at z = -11.1, so nothing on land moves.
const POND = { x: -84, z: 85, r: 11, k: 0.85 };   // k squashes it north to south
const pondR = a => POND.r + 1.4 * Math.sin(3 * a + 0.6) + 0.7 * Math.cos(5 * a);
const riverSouth = x => -12.25 + 0.35 * Math.sin(x * 0.23) + 0.2 * Math.sin(x * 0.57 + 1);
const riverWidth = x => 6 + 2.4 * Math.sin(x * 0.04 + 1) + 1 * Math.sin(x * 0.13);   // 2.6 to 9.4 wide, swelling and narrowing as it winds
const STREAM_W = 1.9;   // half its width
// the north's tracks: from the bridge up to the iron rocks, and across the stream to the trout pool
const NORTH_PATHS = [[[-10, -21], [-9, -30], [-20, -45], [-36, -56], [-46, -63]], [[-9, -30], [12, -35], [41, -35], [48, -35], [46, -44], [42, -50]]];
const segDist = (x, z, [x0, z0], [x1, z1]) => { const dx = x1 - x0, dz = z1 - z0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - x0 - dx * t, z - z0 - dz * t); };
// ----- the north, across the river: a meadow by the water rising to rocky uplands, sealed by hills on three sides -----
// Reached only over the bridge from the village. The walkable floor stays flat (everyone walks at height 0); the hills round the
// edge and the knolls inside are raised ground and solid. A stream leaves the river at x 45 for a pool among trees (trout).
const NORTH = {
  zN: x => -92 + 5 * Math.sin(x * 0.07) + 3 * Math.sin(x * 0.19 + 1),   // where the northern hills begin
  xW: z => -98 + 4 * Math.sin(z * 0.11), xE: z => 98 + 4 * Math.sin(z * 0.09 + 1),   // and the western and eastern ones
  knolls: [[-63, -73, 7], [-24, -85, 6], [24, -82, 7], [78, -63, 6], [-82, -47, 5], [6, -66, 4.5], [-34, -38, 3.5], [70, -34, 4]],   // x, z, radius
  stream: [[45, -16.5], [47, -28], [44, -38], [47, -50], [50, -57.5]], STREAM_W: 1.6,
  pool: { x: 60, z: -68, rx: 28, rz: 16, isle: [78, -63, 5] },   // the lake the stream runs into: wide east to west, with a wooded island
  ford: -35,                                    // the footbridge over the stream
  bridge: { x: -10, hw: 2 },                    // the bridge over the river: its middle, and half the gap in the river's solid strip
  cave: { x: 99.6, z: -58, top: 7.2, hw: 7.5 },  // the cave: a rocky spur of the east hills, its face on x, its middle on z
};
const northOut = (x, z) => Math.max(NORTH.zN(x) - z, NORTH.xW(z) - x, x - NORTH.xE(z));   // above 0 is in the hills
function hillH(x, z){
  if (z > -19.5) return 0;
  const o = northOut(x, z); let h = o > 0 ? Math.min(17, o * 0.9 + o * o * 0.025) * (0.85 + 0.15 * Math.sin(x * 0.31 + z * 0.23)) : 0;
  for (const [mx, mz, r] of NORTH.knolls) { const d = Math.hypot(x - mx, z - mz); if (d < r) h = Math.max(h, Math.pow(1 - d / r, 0.8) * r * 0.55 * (0.9 + 0.1 * Math.sin(x + z))); }
  return h;
}
/* the cave's spur: the east hills push out into the meadow as a rocky shoulder that ends in a steep face, the cave mouth in it.
   Kept apart from hillH, which also decides where trees and boulders go (their seeded placement must not change). */
const caveFaceN = z => (Math.sin(z * 0.9) * 0.35 + Math.sin(z * 2.3 + 1) * 0.2) * Math.min(1, Math.max(0, (Math.abs(z - NORTH.cave.z) - 2.5) / 2));   // straight across the mouth
function spurH(x, z){
  const C = NORTH.cave, dz = Math.abs(z - C.z), fx = C.x + caveFaceN(z) + dz * dz * 0.035;   // the face curves back at its ends, like a buttress
  if (x < fx || dz > C.hw + 3 || z > -19.5) return 0;
  const side = 1 - Math.min(1, Math.max(0, (dz - (C.hw - 3.5 + (x - fx) * 0.15)) / 3.5));
  const top = C.top + (x - fx) * 0.25 + Math.sin(x * 0.8 + z * 0.6) * 0.35;
  return Math.max(0, top * side * side * (3 - 2 * side));
}
function northWaterSD(x, z){
  let m = Infinity; const S = NORTH.stream;
  for (let i = 0; i < S.length - 1; i++) { const [x0, z0] = S[i], [x1, z1] = S[i + 1], dx = x1 - x0, dz = z1 - z0;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz))); m = Math.min(m, Math.hypot(x - x0 - dx * t, z - z0 - dz * t)); }
  const P = NORTH.pool, ex = (x - P.x) / P.rx, ez = (z - P.z) / P.rz, a = Math.atan2(ez, ex);
  let lake = (Math.hypot(ex, ez) - 1 - 0.05 * Math.sin(3 * a + 1) - 0.035 * Math.cos(5 * a) - 0.025 * Math.sin(7 * a + 2)) * Math.min(P.rx, P.rz);   // an uneven shore
  lake = Math.max(lake, P.isle[2] - Math.hypot(x - P.isle[0], z - P.isle[1]));   // the island
  return Math.min(m - NORTH.STREAM_W, lake);
}
const STREAM = (() => {   // a smooth line through these bends, from the river down to the pond
  const c = [[-106, -16], [-107, -8], [-110, 2], [-106, 13], [-109, 25], [-104, 37], [-107, 49], [-101, 61], [-94, 70], [-87, 79]], out = [];
  for (let i = 0; i < c.length - 1; i++) { const p0 = c[Math.max(0, i - 1)], p1 = c[i], p2 = c[i + 1], p3 = c[Math.min(c.length - 1, i + 2)];
    for (let j = 0; j < 8; j++) { const t = j / 8, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3))); } }
  out.push(c[c.length - 1]); return out;
})();
function pondSD(x, z){ const dx = x - POND.x, dz = (z - POND.z) / POND.k; return Math.hypot(dx, dz) - pondR(Math.atan2(dz, dx)); }
function streamSD(x, z){
  let m = Infinity;
  for (let i = 0; i < STREAM.length - 1; i++) { const [x0, z0] = STREAM[i], [x1, z1] = STREAM[i + 1], dx = x1 - x0, dz = z1 - z0;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz))); m = Math.min(m, Math.hypot(x - x0 - dx * t, z - z0 - dz * t)); }
  return m - STREAM_W;
}
function waterSD(x, z){
  const s = riverSouth(x); let d = Math.max(z - s, s - riverWidth(x) - z);
  if (x > -116 && x < -66 && z > -20 && z < 100) d = Math.min(d, streamSD(x, z), pondSD(x, z));
  if (x > 30 && x < 92 && z > -88 && z < -15) d = Math.min(d, northWaterSD(x, z));   // the north stream and its lake
  return d;
}
// the water surface: a strip along the river and a sheet over the stream and pond; the ground dips under it only where there is water
const WATER_Y = -0.3, WATER_RECTS = [[-120, 120, -21, -10], [-117, -65, -11, 98], [30, 92, -88, -20]];
const QUARRY = { x: 12, z: 72, r: 13.5 };   // the quarry, south-west of the smithy
const groundGeo = new THREE.PlaneGeometry(240, 240, 240, 240);   // a fine grid so the hall's flat patch lines up
groundGeo.rotateX(-Math.PI / 2);
const gp = groundGeo.attributes.position;
for (let i = 0; i < gp.count; i++) {
  const x = gp.getX(i), z = gp.getZ(i);
  const inHall = Math.abs(x - 16) < 11.2 && Math.abs(z - 2) < 9.8;   // the hall's floor sits on flat ground
  const inVillage = (x > -110 && x < 62 && z > -11.6 && z < 60) || (x > -54 && x < -8 && z > 56 && z < 88) || (x > 58 && x < 112 && z > -11 && z < 84);   // the village, the fields, the pens and the ruined farm   // the village, and the new fields and windmill east of the farm   // the village and its roads are flat, so the paths lie on the ground   // the village is flat, so grass cannot poke through the houses
  const qd = Math.hypot(x - QUARRY.x, z - QUARRY.z);   // the quarry floor is dug level
  if (qd < 17) { gp.setY(i, qd < 14 ? -0.02 : (Math.sin(x * 0.2) * 0.12 + Math.cos(z * 0.17) * 0.12) * (qd - 14) / 3); continue; }
  let y = inHall || inVillage ? 0 : Math.sin(x * 0.2) * 0.12 + Math.cos(z * 0.17) * 0.12;
  if (z < -19.5) { const hh = Math.max(hillH(x, z), spurH(x, z)); y = hh > 0.05 ? hh : y * 0.5; }   /* the north: a flat floor to walk on, and the hills and knolls */
  if (WATER_RECTS.some(([x0, x1, z0, z1]) => x > x0 - 1 && x < x1 + 1 && z > z0 - 1 && z < z1 + 1)) {   // round the water: never dip below its surface on dry land, and slope into it at the banks
    const sd = waterSD(x, z); y = sd > 0.6 ? Math.max(y, -0.05) : Math.min(y, Math.max(-0.66, WATER_Y + sd * 0.5)); }
  gp.setY(i, y);
}
groundGeo.computeVertexNormals();
// past the edge of the map is an empty black void, until more land is added there
const voidPlane = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
voidPlane.position.y = -3; scene.add(voidPlane);
// tint the grass with gentle patches of light and dark green
{
  const cols = new Float32Array(gp.count * 3), c = new THREE.Color(), a = new THREE.Color(0x4f9a3c), b = new THREE.Color(0x7fae46), d = new THREE.Color(0x3c7a34);
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i);
    const n = Math.sin(x * 0.11 + Math.cos(z * 0.07) * 2) * 0.5 + Math.sin(z * 0.13 - x * 0.05) * 0.5;
    const f = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
    c.copy(a).lerp(n > 0 ? b : d, Math.abs(n) * 0.7).multiplyScalar(0.94 + f * 0.1);
    if (x > 60 && x < 110 && z > 35 && z < 82) {   // the ruined farm: dry, dead earth, fading back to green at the edges
      const edge = Math.min(x - 60, 110 - x, z - 35, 82 - z), k = Math.min(1, edge / 6) * (0.75 + 0.25 * Math.abs(n));
      c.lerp(new THREE.Color(0x8a7a52), k * 0.85); }
    if (z < -19.5) {   // the north: greener by the river, drier and stonier towards the hills, bare rock up on them, and its dirt tracks
      c.lerp(new THREE.Color(0x7a8a4a), Math.min(1, Math.max(0, (-z - 35) / 50)) * 0.55);
      const hh = Math.max(hillH(x, z), spurH(x, z)); if (hh > 0.2) c.lerp(new THREE.Color(f > 0.5 ? 0x7a7466 : 0x6a665c), Math.min(0.9, hh / 5));
      const sp = spurH(x, z), C = NORTH.cave; if (sp > 0.15) c.lerp(new THREE.Color(0x56524a), (sp > 1 && x < C.x + 1.6 ? 0.25 + 0.2 * (Math.sin(sp * 3.1) * 0.5 + 0.5) : 0) + 0.15);   /* darker rock bands in the cave's face */
      { const d = Math.hypot((x - C.x) * 1.4, z - C.z) + Math.sin(x * 1.7 + z) * 0.8; if (x < C.x + 0.5 && d < 6) c.lerp(new THREE.Color(0x8a7458), Math.min(1, (6 - d) / 2.5) * 0.8); }   /* trodden earth in front of the mouth */
      if (NORTH_PATHS.some(pts => pts.some((p, k) => k && segDist(x, z, pts[k - 1], p) < 1.3))) c.lerp(new THREE.Color(0xa48a5e), 0.75);
      if (Math.hypot(x + 49, z + 68) < 9) c.lerp(new THREE.Color(0x8a8478), 0.6 * Math.min(1, (9 - Math.hypot(x + 49, z + 68)) / 3));   // gravel round the iron rocks
    }
    if (WATER_RECTS.some(([x0, x1, z0, z1]) => x > x0 - 2 && x < x1 + 2 && z > z0 - 2 && z < z1 + 2)) {   // damp earth and a little sand along the banks, darker under the water
      const sd = waterSD(x, z); if (sd < 1.6) c.lerp(new THREE.Color(sd < 0 ? 0x4a4630 : 0x9a8a5c), Math.min(1, (1.6 - sd) / 1.4) * (0.55 + 0.25 * f)); }
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  groundGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
}
// a fine grass texture: blades and speckles that the patch colours tint
const grassTex = (() => {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const r = (() => { let q = 19; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
  g.fillStyle = '#c8d8b0'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 5000; i++) {
    const x = r() * S, y = r() * S, l = 2 + r() * 5, v = r();
    g.strokeStyle = v < 0.5 ? `rgba(60,90,40,${0.2 + r() * 0.3})` : `rgba(240,255,210,${0.15 + r() * 0.3})`; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 2, y - l); g.stroke();
  }
  for (let i = 0; i < 12; i++) { const x = r() * S, y = r() * S, gr = g.createRadialGradient(x, y, 0, x, y, 20 + r() * 30);
    gr.addColorStop(0, `rgba(${r() < 0.5 ? '90,120,50' : '230,240,190'},.25)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 60); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
})();
const groundMesh = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ map: grassTex, color: 0xffffff, vertexColors: true, roughness: 1, metalness: 0 }));
/* the grass texture is stretched into streaks up a steep face, so on the cave's cliff it fades to plain rock */
groundMesh.material.onBeforeCompile = sh => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vGSteep;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGSteep = (position.x > ' + (NORTH.cave.x - 1.5).toFixed(1) + ' && abs(position.z - (' + NORTH.cave.z.toFixed(1) + ')) < ' + (NORTH.cave.hw + 4).toFixed(1) + ') ? 1.0 - normal.y : 0.0;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGSteep;').replace('#include <map_fragment>', 'vec4 sampledDiffuseColor = texture2D( map, vMapUv ); sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, vec3(0.82), smoothstep(0.3, 0.55, vGSteep)); diffuseColor *= sampledDiffuseColor;');
};
town.add(groundMesh);
// the river ripples: a moving wave pattern with sparkles where the sun catches it
const riverTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  g.fillStyle = '#2f78ad'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(${170 + Math.random() * 80},${220 + Math.random() * 35},255,${0.15 + Math.random() * 0.35})`; g.lineWidth = 1 + Math.random() * 1.5;
    const x = Math.random() * 128, y = Math.random() * 128, w = 8 + Math.random() * 18; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 3, x + w, y); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(40, 1); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
riverTex.repeat.set(1 / 6, 1 / 4.2);   // one ripple tile every 6 by 4.2 units, as before
const river = new THREE.Mesh(mergeGeometries(WATER_RECTS.map(([x0, x1, z0, z1]) => {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, WATER_Y, (z0 + z1) / 2), uv = g.attributes.uv, ps = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, ps.getX(i), -ps.getZ(i));   // world-sized UVs, so the ripples line up across both sheets
    return g; })),
  new THREE.MeshStandardMaterial({ map: riverTex, color: 0xbfe4ff, roughness: 0.15, metalness: 0.2, emissive: 0x0a2a44, emissiveIntensity: 0.4 }));
town.add(river);
function path(x, z, w, l, rot){
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, l).rotateX(-Math.PI / 2), mat(0xa48a5e));
  p.position.set(x, 0.05, z); p.rotation.z = rot; town.add(p);
}

