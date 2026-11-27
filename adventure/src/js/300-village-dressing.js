// the village green dressed up: flower beds, the meeting oak and its seat, bunting over the stalls, Brenna's garden and woodpile, Wenna's cat and tubs, Lyra's stump
// built on the first frame (after the stalls, benches and NPC spots exist); everything comes from a fixed seed so every player has the same solid ground
function buildGreen(){
  const bins = new Map();
  const col = (geo, hex) => { geo = geo.index ? geo.toNonIndexed() : geo; const c = new THREE.Color(hex), n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i*3] = c.r; a[i*3+1] = c.g; a[i*3+2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; };
  /* add a coloured part to a merge bin: geo, colour, position, rotation y, extra rot x/z, scale */
  const put = (bin, geo, hex, x, y, z, ry = 0, rx = 0, rz = 0, sc = null) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.set(rx, ry, rz, 'YXZ'); if (sc) o.scale.set(...sc); o.updateMatrix(); const g = col(geo.clone(), hex); g.applyMatrix4(o.matrix); (bins.get(bin) || bins.set(bin, []).get(bin)).push(g); };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const rnd = (() => { let q = 4242; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
  const roadD = (x, z) => { let best = 1e9; for (const [x1, z1, x2, z2] of ROADS) { const dx = x2 - x1, dz = z2 - z1, L = dx*dx + dz*dz || 1, t = Math.max(0, Math.min(1, ((x-x1)*dx + (z-z1)*dz) / L)); best = Math.min(best, Math.hypot(x - x1 - dx*t, z - z1 - dz*t)); } return best; };
  const check = () => {};
  const FLOW = [0xe85a6a, 0xf0c040, 0xf4f0e8, 0xa070d0, 0xf08a3a];

  /* 1. flower beds in a broken ring round the cobbled green, only in the gaps between the roads */
  const G = [-36, 8], R = 6.3, STEP = 0.07; let runs = [], cur = [];
  for (let a = 0; a < Math.PI * 2; a += STEP) { const x = G[0] + Math.cos(a) * R, z = G[1] + Math.sin(a) * R;
    const ok = roadD(x, z) > 1.8 && !blocked(x, z) && !solidBoxes.some(b => x > b.x0 - 0.6 && x < b.x1 + 0.6 && z > b.z0 - 0.6 && z < b.z1 + 0.6) && NPC_SPOTS.every(s => Math.hypot(s[0] - x, s[1] - z) > 1.8);
    if (ok) cur.push(a); else if (cur.length) { runs.push(cur); cur = []; } }
  if (cur.length) runs.push(cur);
  runs = runs.filter(r => r.length >= 4);
  for (const run of runs) run.forEach((a, i) => { const x = G[0] + Math.cos(a) * R, z = G[1] + Math.sin(a) * R, ry = -a + Math.PI / 2, seg = R * STEP + 0.04;
    const end = i === 0 || i === run.length - 1;
    for (const off of [-0.55, 0.55]) put('bed', B(seg, 0.32, 0.22), (i + (off > 0)) % 2 ? 0x9a948a : 0x86817a, x + Math.cos(a) * off, 0.16, z + Math.sin(a) * off, ry);   /* stone kerbs, inner and outer */
    if (end) put('bed', B(0.22, 0.32, 1.32), 0x8c867e, x, 0.16, z, ry);
    put('bed', B(seg, 0.26, 0.9), 0x5a3e26, x, 0.13, z, ry);   /* soil */
    if (!end) for (let k = 0; k < 2; k++) { const fx = x + Math.cos(a) * (rnd() - 0.5) * 0.6, fz = z + Math.sin(a) * (rnd() - 0.5) * 0.6;
      put('bed', new THREE.IcosahedronGeometry(0.24, 0), [0x3f7a2c, 0x4f8a34][k], fx, 0.38, fz, rnd() * 6, 0, 0, [1, 0.7, 1]);
      put('bed', new THREE.DodecahedronGeometry(0.1, 0), FLOW[Math.floor(rnd() * FLOW.length)], fx + (rnd() - 0.5) * 0.2, 0.55, fz + (rnd() - 0.5) * 0.2); } });

  /* 2. the meeting oak west of the stalls, with a round seat about its trunk */
  const OX = -55, OZ = 16; check('oak', OX, OZ); for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) check('oak ring', OX + dx, OZ + dz);
  put('oak', new THREE.CylinderGeometry(0.55, 0.85, 4.6, 8), 0x5a3a1e, OX, 2.3, OZ);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3; put('oak', new THREE.ConeGeometry(0.4, 1.3, 5), 0x4a2e16, OX + Math.cos(a) * 0.75, 0.35, OZ + Math.sin(a) * 0.75, -a, 0, 0, null);
  }
  for (const [ang, len, y] of [[0.4, 3.2, 4.2], [2.5, 2.8, 4.6], [4.3, 3.0, 4.0]]) { const g = new THREE.CylinderGeometry(0.18, 0.32, len, 6); g.translate(0, len / 2, 0); put('oak', g, 0x5a3a1e, OX, y, OZ, -ang, 0, -1.0); }
  const leaves = [[0, 7.2, 0, 3.0], [2.6, 6.6, 0.8, 2.3], [-2.4, 6.8, -0.6, 2.4], [0.4, 7.4, -2.5, 2.2], [-0.8, 7.6, 2.3, 2.2], [1.6, 8.4, -1.0, 1.8], [-1.6, 8.3, 1.0, 1.7], [0, 9.0, 0, 1.6]];
  leaves.forEach(([dx, dy, dz, r], i) => { const geo = new THREE.IcosahedronGeometry(r, 0); const p = geo.attributes.position; for (let v = 0; v < p.count; v++) { const h = Math.sin(p.getX(v) * 12.9 + p.getY(v) * 78.2 + p.getZ(v) * 37.7 + i) * 43758.5; const j = 0.85 + 0.3 * (h - Math.floor(h)); p.setXYZ(v, p.getX(v) * j, p.getY(v) * j, p.getZ(v) * j); } geo.computeVertexNormals();
    put('oak', geo, [0x3f6e2a, 0x4f7f32, 0x2e5a22, 0x5a8a3a][i % 4], OX + dx, dy, OZ + dz); });
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const sx = OX + Math.cos(a) * 1.55, sz = OZ + Math.sin(a) * 1.55;
    put('oak', B(1.25, 0.12, 0.6), 0x8a6038, sx, 0.62, sz, -a + Math.PI / 2); put('oak', B(0.12, 0.56, 0.12), 0x5a3a1e, OX + Math.cos(a) * 1.75, 0.28, OZ + Math.sin(a) * 1.75); }
  /* acorns and fallen leaves in the grass under it */
  for (let i = 0; i < 26; i++) { const a = rnd() * 6.28, r = 2.3 + rnd() * 2.6; put('oak', B(0.22, 0.02, 0.15), [0x6a8a2a, 0xa08030, 0x8a5a2a][i % 3], OX + Math.cos(a) * r, 0.02, OZ + Math.sin(a) * r, rnd() * 6); }

  /* 3. bunting strung high between the two stalls, on poles that lift it clear of the tallest hat */
  const poles = [[-45.0, 12.7], [-45.5, 16.3], [-48.0, 12.7], [-48.5, 16.3]];
  for (const [px, pz] of poles) put('bunt', new THREE.CylinderGeometry(0.06, 0.07, 2.2, 6), 0x5a3a1e, px, 4.2, pz);
  for (const [px, pz] of poles) put('bunt', new THREE.SphereGeometry(0.11, 6, 4), 0xd8b040, px, 5.33, pz);
  const string = (a, b, sag, n) => { for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, y = 5.2 - sag * 4 * t * (1 - t);
      if (i < n) { const t2 = (i + 1) / n, x2 = a[0] + (b[0] - a[0]) * t2, z2 = a[1] + (b[1] - a[1]) * t2, y2 = 5.2 - sag * 4 * t2 * (1 - t2); const L = Math.hypot(x2 - x, y2 - y, z2 - z);
        const g = new THREE.CylinderGeometry(0.015, 0.015, L, 3); g.rotateZ(Math.PI / 2); put('bunt', g, 0xe8e0c8, (x + x2) / 2, (y + y2) / 2, (z + z2) / 2, -Math.atan2(z2 - z, x2 - x), 0, Math.atan2(y2 - y, Math.hypot(x2 - x, z2 - z)));
        const fl = new THREE.ConeGeometry(0.17, 0.42, 3); fl.rotateX(Math.PI); fl.scale(1, 1, 0.15); put('bunt', fl, [0xc84a3a, 0xf0c040, 0x3a6a9a, 0xf4f0e8, 0x5a9a4a][(i + n) % 5], (x + x2) / 2, (y + y2) / 2 - 0.22, (z + z2) / 2, -Math.atan2(z2 - z, x2 - x)); } } };
  string(poles[0], poles[1], 0.55, 9); string(poles[2], poles[3], 0.55, 9); string(poles[0], poles[3], 0.6, 11); string(poles[2], [-44.6, 11.3], 0.3, 7);

  /* 4. Brenna's front garden: a picket fence round herb rows west of her door, and a woodpile on the west wall */
  const FX0 = -69.4, FX1 = -65.6, FZ0 = 4.0, FZ1 = 5.6; for (const [x, z] of [[FX0, FZ0], [FX1, FZ1], [FX0, FZ1], [FX1, FZ0]]) check('garden', x, z, 1.4);
  for (let x = FX0; x <= FX1 + 0.01; x += 0.38) { put('gard', B(0.1, 0.75, 0.06), 0xf0e8d8, x, 0.38, FZ1); put('gard', new THREE.ConeGeometry(0.07, 0.14, 4), 0xf0e8d8, x, 0.82, FZ1, Math.PI / 4); }
  for (let z = FZ0; z < FZ1; z += 0.38) for (const x of [FX0, FX1]) { put('gard', B(0.06, 0.75, 0.1), 0xf0e8d8, x, 0.38, z); put('gard', new THREE.ConeGeometry(0.07, 0.14, 4), 0xf0e8d8, x, 0.82, z, Math.PI / 4); }
  for (const y of [0.25, 0.6]) { put('gard', B(FX1 - FX0, 0.07, 0.04), 0xe0d8c8, (FX0 + FX1) / 2, y, FZ1 - 0.05); for (const x of [FX0, FX1]) put('gard', B(0.04, 0.07, FZ1 - FZ0), 0xe0d8c8, x + (x < -67 ? 0.05 : -0.05), y, (FZ0 + FZ1) / 2); }
  put('gard', B(FX1 - FX0 - 0.2, 0.1, FZ1 - FZ0 - 0.15), 0x5a3e26, (FX0 + FX1) / 2, 0.05, (FZ0 + FZ1) / 2);
  const herbs = [0x4a8a3a, 0x3f7a2c, 0x2e6a2a, 0x5a9a3a];   /* all leafy greens: the paler ones read as white */ for (let r = 0; r < 3; r++) for (let x = FX0 + 0.4; x < FX1 - 0.2; x += 0.5) { const z = FZ0 + 0.4 + r * 0.55;
    put('gard', new THREE.IcosahedronGeometry(0.2, 0), herbs[Math.abs(r + Math.round(x * 2)) % 4], x, 0.22, z, rnd() * 6, 0, 0, [1, r === 1 ? 1.5 : 0.8, 1]); if (r === 1 && rnd() < 0.5) put('gard', new THREE.DodecahedronGeometry(0.06, 0), 0xb090e0, x, 0.52, z); }
  /* the woodpile: split logs stacked under a little lean-to against the outside of her west wall */
  const WX = -71.2; check('woodpile', WX, -6, 0);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9 - row; i++) { const g = new THREE.CylinderGeometry(0.22, 0.22, 1.1, 7); g.rotateX(Math.PI / 2); g.rotateY(Math.PI / 2);
    put('gard', g, [0x8a5a2a, 0x7a4e24, 0x9a6a34][(i + row) % 3], WX, 0.22 + row * 0.4, -7.6 + i * 0.44 + row * 0.22, 0, 0, 0); { const c = new THREE.CylinderGeometry(0.19, 0.19, 0.04, 7); c.rotateZ(Math.PI / 2); put('gard', c, 0xf0d8a0, WX - 0.56, 0.22 + row * 0.4, -7.6 + i * 0.44 + row * 0.22); } }
  put('gard', B(1.5, 0.1, 4.6), 0x6a4a2a, WX - 0.1, 2.2, -5.8, 0, 0, 0.3); for (const z of [-8.0, -3.6]) put('gard', B(0.12, 2.1, 0.12), 0x5a3a1e, WX - 0.7, 1.05, z);
  put('gard', new THREE.CylinderGeometry(0.4, 0.45, 0.5, 9), 0x7a5a2a, WX - 0.4, 0.25, -2.6); { const ax = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 5); put('gard', ax, 0x8a5a2a, WX - 0.4, 0.85, -2.6, 0, 0, 0.5); put('gard', B(0.06, 0.25, 0.3), 0xa0a4a8, WX - 0.6, 1.2, -2.6, 0, 0, 0.5); }

  /* 5. Wenna's corner: her cat curled at the end of her bench, a tub of geraniums each side; Lyra's tree-stump stage by her spot */
  const bn = NPC_SPOTS.find(s => Math.abs(s[0] + 31.58) < 0.1 && Math.abs(s[1] - 16.2) < 0.1) || [-31.58, 16.2];
  const cx = bn[0] + 0.95, cz = bn[1] + 0.02, FUR = 0xe08a3a;   /* curled at Wenna's left, face to the green */
  { put('cat', new THREE.SphereGeometry(0.3, 12, 8), FUR, cx, 0.86, cz, 0, 0, 0, [1.2, 0.62, 0.95]);
    const hx = cx - 0.22, hz = cz + 0.24, hy = 0.98; put('cat', new THREE.SphereGeometry(0.21, 12, 8), FUR, hx, hy, hz);
    for (const s of [-1, 1]) put('cat', new THREE.ConeGeometry(0.075, 0.17, 4), FUR, hx + s * 0.11, hy + 0.2, hz - 0.02, 0, 0, -s * 0.35);
    put('cat', new THREE.SphereGeometry(0.1, 8, 6), 0xf8f0e0, hx, hy - 0.07, hz + 0.15, 0, 0, 0, [1.1, 0.75, 0.6]);
    put('cat', new THREE.SphereGeometry(0.025, 6, 4), 0xd87080, hx, hy - 0.02, hz + 0.21);
    for (const s of [-1, 1]) put('cat', B(0.1, 0.018, 0.02), 0x2a1a10, hx + s * 0.085, hy + 0.04, hz + 0.19, 0, 0, s * 0.2);   /* shut, contented eyes on the face */
    const tail = new THREE.TorusGeometry(0.3, 0.06, 5, 10, Math.PI); tail.rotateX(Math.PI / 2); put('cat', tail, 0xc86a2a, cx + 0.02, 0.76, cz + 0.02, Math.PI * 1.05);
    for (let i = 0; i < 3; i++) put('cat', B(0.045, 0.012, 0.36), 0xb85a22, cx - 0.05 + i * 0.13, 1.04, cz - 0.02, 0.15); }
  for (const [tx, tz] of [[bn[0] - 2.0, bn[1] + 0.2], [bn[0] + 1.7, bn[1] + 0.2]]   /* the east one kept off the road */) { check('tub', tx, tz, 1.4);
    put('cat', new THREE.CylinderGeometry(0.38, 0.3, 0.5, 9), 0x8a5a2a, tx, 0.25, tz); put('cat', new THREE.CylinderGeometry(0.4, 0.4, 0.06, 9), 0x5a3a1e, tx, 0.5, tz);
    for (let k = 0; k < 5; k++) { const a = k * 1.26; put('cat', new THREE.IcosahedronGeometry(0.16, 0), 0x3f7a2c, tx + Math.cos(a) * 0.18, 0.62, tz + Math.sin(a) * 0.18); put('cat', new THREE.DodecahedronGeometry(0.08, 0), 0xe03a3a, tx + Math.cos(a) * 0.2, 0.78, tz + Math.sin(a) * 0.2); } }
  const LX = -43.6, LZ = 0.8; check('stump', LX, LZ, 1.6);
  put('stump', new THREE.CylinderGeometry(0.8, 0.95, 0.55, 10), 0x6b4a2a, LX, 0.27, LZ); put('stump', new THREE.CylinderGeometry(0.72, 0.72, 0.02, 10), 0xd8b880, LX, 0.56, LZ);
  put('stump', new THREE.TorusGeometry(0.42, 0.02, 3, 16), 0xa07a48, LX, 0.575, LZ, 0, Math.PI / 2); put('stump', new THREE.TorusGeometry(0.22, 0.02, 3, 12), 0xa07a48, LX, 0.575, LZ, 0, Math.PI / 2);
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5; put('stump', new THREE.ConeGeometry(0.22, 0.6, 5), 0x5a3a1e, LX + Math.cos(a) * 0.85, 0.15, LZ + Math.sin(a) * 0.85, -a, 0, 0); }
  { const hat = new THREE.CylinderGeometry(0.32, 0.4, 0.2, 10, 1, true); put('stump', hat, 0x7a3a6a, LX + 1.1, 0.1, LZ + 0.5, 0, Math.PI); put('stump', new THREE.CircleGeometry(0.4, 10), 0x5a2a4a, LX + 1.1, 0.2, LZ + 0.5, 0, -Math.PI / 2); }
  for (let i = 0; i < 3; i++) put('stump', new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8), 0xe8c040, LX + 1.05 + (i - 1) * 0.1, 0.03 + i * 0.022, LZ + 0.4);   /* her hat, upturned on the grass for coins */
  // what you walk round: the oak and its seat, Brenna's fence and woodpile, Wenna's tubs and Lyra's stump (the low flower beds are stepped over, the cat is on the solid bench)
  solidBoxes.push({ x0: OX - 2.2, x1: OX + 2.2, z0: OZ - 2.2, z1: OZ + 2.2 }, { x0: FX0, x1: FX1, z0: FZ0, z1: FZ1 }, { x0: WX - 0.8, x1: -70.3, z0: -8, z1: -2.1 });
  solidAt(bn[0] - 2.0, bn[1] + 0.2, 0.45); solidAt(bn[0] + 1.7, bn[1] + 0.2, 0.45); solidAt(LX, LZ, 1.0);
  const vmat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0 }), grp = new THREE.Group(); town.add(grp);
  for (const list of bins.values()) { const m = new THREE.Mesh(mergeGeometries(list), vmat); m.castShadow = m.receiveShadow = true; grp.add(m); }
}
// Farm dressing (owner-approved mock-up): a dry-stone wall along the windmill lane with gaps for the pen paths, the hay wain, a grazing donkey
// and haystacks behind the barn, bee skeps on a bench by the windmill, and a duck pond south of the field. One merged vertex-coloured mesh,
// seeded random only, so it is the same for every player. Built on the first frame (as buildGreen).
const FARMDRESS = { built: false };
function buildFarmDress(){
  FARMDRESS.built = true;
  const root = new THREE.Group(); town.add(root); let q = 7; const rr = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const parts = [];
  const V = (geo, col, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { let g = geo.index ? geo.toNonIndexed() : geo; g.deleteAttribute('uv');
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)));
    const c = new THREE.Color(col), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); parts.push(g); return g; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), stoneCols = [0x9a958a, 0x86827a, 0xa8a294, 0x7a766e];
  const checks = [];   /* spots the designer checked against roads, water and solids */
  /* 1. dry-stone wall south of the windmill lane, with a gap at each pen path and a stone stile */
  const wall = (x0, x1, z) => { checks.push([x0, z], [x1, z], [(x0 + x1) / 2, z]); V(B(x1 - x0, 0.78, 0.5), 0x7e7a70, (x0 + x1) / 2, 0.39, z);
    for (let row = 0; row < 3; row++) for (let x = x0 + (row % 2) * 0.35; x < x1 - 0.2; x += 0.62 + rr() * 0.15) {
      const s = 0.3 - row * 0.03; V(new THREE.DodecahedronGeometry(s, 0), stoneCols[Math.floor(rr() * 4)], x, 0.2 + row * 0.3, z + (rr() - 0.5) * 0.06, 0, rr() * 0.6, (rr() - 0.5) * 0.3, 1.25, 0.62, 0.95); }
    for (let x = x0; x < x1 - 0.2; x += 0.3) V(B(0.12, 0.34, 0.5), rr() < 0.5 ? 0x8a8478 : 0x9a958a, x + 0.15, 0.9, z, 0, 0, (rr() - 0.5) * 0.35);   /* coping stones on their edge */
    for (let x = x0 + 0.5; x < x1; x += 1.3 + rr()) { if (rr() < 0.5) V(new THREE.IcosahedronGeometry(0.28, 0), rr() < 0.5 ? 0x5e8a3a : 0x4e7a32, x, 0.18, z + 0.55, 0, rr() * 3, 0, 1.3, 0.7, 1);   /* tufts at the foot */
      if (rr() < 0.35) { V(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 4), 0x4e7a32, x + 0.3, 0.45, z + 0.6); for (let k = 0; k < 4; k++) V(new THREE.ConeGeometry(0.09, 0.16, 5), 0xc070b8, x + 0.3, 0.55 + k * 0.12, z + 0.66, Math.PI, 0, 0); } } };
  wall(63.2, 69.4, 13.8); wall(72.6, 78.6, 13.8); wall(82.6, 91.4, 13.8);
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) V(B(0.9, 0.12, 0.42), 0x8e897e, 87, 0.3 + k * 0.32, 13.8 + s * (0.55 + (1 - k) * 0.35));   /* through-stones sticking out both sides: a step stile */
  /* 2. the hay wain and donkey, east of the barn, with two haystacks */
  const CX = 59.2, CZ = -5; const wood = 0x8a6038, dk = 0x5a3a1e; checks.push([CX, CZ], [CX, CZ - 1.6], [CX, CZ + 1.6], [CX - 3.4, CZ]);
  V(B(2.2, 0.16, 3.4), wood, CX, 1.0, CZ); for (const s of [-1, 1]) { V(B(0.1, 0.55, 3.4), dk, CX + s * 1.1, 1.32, CZ); for (const zz of [-1.2, 1.2]) { const w = V(new THREE.CylinderGeometry(0.62, 0.62, 0.14, 10), dk, CX + s * 1.22, 0.62, CZ + zz, 0, 0, Math.PI / 2); V(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 8), 0x3a2a1a, CX + s * 1.25, 0.62, CZ + zz, 0, 0, Math.PI / 2); } }
  for (const zz of [-1.2, 1.2]) V(B(2.5, 0.1, 0.1), 0x3a2a1a, CX, 0.62, CZ + zz);
  V(new THREE.DodecahedronGeometry(1.05, 1), 0xe0c060, CX, 1.55, CZ, 0, 0.3, 0, 1.0, 0.55, 1.55);   /* a heaped load of hay */
  for (const s of [-1, 1]) V(B(0.09, 0.09, 2.6), dk, CX + s * 0.45, 0.95, CZ - 2.9, -0.2, 0, 0);   /* the shafts, resting low to the north */
  /* the donkey, unhitched and grazing beside the shafts */
  const DX = CX - 2.6, DZ = CZ - 2.2, grey = 0x9a8e84, pale = 0xd8d0c4; checks.push([DX, DZ]);
  V(new THREE.IcosahedronGeometry(0.62, 1), grey, DX, 1.05, DZ, 0, 0, 0, 0.75, 0.72, 1.35);
  for (const [lx, lz] of [[-0.25, -0.5], [0.25, -0.5], [-0.25, 0.5], [0.25, 0.5]]) { V(B(0.16, 0.78, 0.16), grey, DX + lx, 0.4, DZ + lz); V(B(0.18, 0.12, 0.18), 0x3a3230, DX + lx, 0.05, DZ + lz); }
  V(B(0.26, 0.62, 0.3), grey, DX, 1.0, DZ - 0.95, 0.9, 0, 0); const hz = DZ - 1.35;   /* the neck, bent down to graze */
  V(new THREE.IcosahedronGeometry(0.3, 1), grey, DX, 0.62, hz, 0, 0, 0, 0.85, 0.8, 1.15); V(new THREE.IcosahedronGeometry(0.2, 1), pale, DX, 0.45, hz - 0.28, 0, 0, 0, 1, 0.8, 1);
  for (const s of [-1, 1]) { V(new THREE.ConeGeometry(0.09, 0.62, 5), grey, DX + s * 0.14, 0.95, hz + 0.12, -0.5, 0, s * -0.35); V(B(0.07, 0.09, 0.04), 0x15110d, DX + s * 0.22, 0.7, hz - 0.12); }
  V(B(0.06, 0.5, 0.06), grey, DX, 1.0, DZ + 0.88, -0.3, 0, 0); V(new THREE.ConeGeometry(0.08, 0.2, 5), 0x3a3230, DX, 0.72, DZ + 0.96, Math.PI, 0, 0);
  V(B(0.08, 0.18, 1.1), 0x4a4440, DX, 1.48, DZ - 0.2);   /* dark stripe of mane down the back */
  for (const [x, z, s] of [[57.2, -9.4, 1], [60.4, -9.6, 0.85]]) { checks.push([x, z]); V(new THREE.CylinderGeometry(1.1 * s, 1.25 * s, 1.3 * s, 9), 0xd8b850, x, 0.65 * s, z); V(new THREE.ConeGeometry(1.2 * s, 1.3 * s, 9), 0xe0c060, x, 1.95 * s, z); V(new THREE.CylinderGeometry(0.06, 0.06, 0.5 * s, 4), dk, x, 2.75 * s, z); }
  /* 3. bee skeps on a plank bench between the fields and the windmill, with lavender */
  const HX = 89.4; for (const z of [-7.2, -5.8, -4.4]) checks.push([HX, z]);
  V(B(1.1, 0.12, 4.2), wood, HX, 0.7, -5.8); for (const z of [-7.5, -4.1]) for (const s of [-1, 1]) V(B(0.12, 0.7, 0.12), dk, HX + s * 0.4, 0.35, z);
  for (const z of [-7.2, -5.8, -4.4]) { for (let k = 0; k < 4; k++) { const r = 0.5 - k * 0.1; V(new THREE.TorusGeometry(r, 0.09, 5, 12), k % 2 ? 0xc89a48 : 0xd8b060, HX, 0.85 + k * 0.17, z, Math.PI / 2, 0, 0); }
    V(new THREE.SphereGeometry(0.16, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0xd8b060, HX, 1.42, z); V(B(0.05, 0.12, 0.2), 0x2a1a10, HX + 0.53, 0.86, z);
    for (let k = 0; k < 3; k++) V(new THREE.SphereGeometry(0.05, 5, 4), k % 2 ? 0x2a2010 : 0xe8c030, HX + 0.8 + rr() * 0.5, 1.1 + rr() * 0.6, z + (rr() - 0.5) * 0.8); }
  for (let i = 0; i < 14; i++) { const x = HX - 1.0 - rr() * 0.6, z = -7.6 + i * 0.27; V(new THREE.IcosahedronGeometry(0.22, 0), 0x6a8a5a, x, 0.2, z, 0, rr() * 3, 0, 1, 0.8, 1); for (let k = 0; k < 3; k++) V(new THREE.ConeGeometry(0.05, 0.32, 4), 0x9070c8, x + (rr() - 0.5) * 0.3, 0.5, z + (rr() - 0.5) * 0.2); }
  /* 4. a duck pond in the corner between the farm road and the field lane */
  const PX = 53, PZ = 16.2, PR = 2.6; checks.push([PX, PZ], [PX - PR - 0.6, PZ], [PX + PR + 0.6, PZ], [PX, PZ - PR * 0.7 - 0.6], [PX, PZ + PR * 0.7 + 0.6]);
  for (let a = 0; a < 6.28; a += 0.32) { const x = PX + Math.cos(a) * (PR + 0.25), z = PZ + Math.sin(a) * (PR * 0.72 + 0.25); if (rr() < 0.8) V(new THREE.DodecahedronGeometry(0.22 + rr() * 0.15, 0), stoneCols[Math.floor(rr() * 4)], x, 0.08, z, rr() * 3, rr() * 3, 0, 1, 0.5, 0.8);
    if (a > 3.6 && a < 5.6) for (let k = 0; k < 3; k++) V(new THREE.CylinderGeometry(0.02, 0.035, 0.9 + rr() * 0.5, 4), 0x5a7a2e, x + (rr() - 0.5) * 0.4 - Math.cos(a) * 0.4, 0.5, z - Math.sin(a) * 0.3 + (rr() - 0.5) * 0.3, (rr() - 0.5) * 0.3, 0, (rr() - 0.5) * 0.3); }
  V(new THREE.CylinderGeometry(PR + 0.15, PR + 0.15, 0.04, 24), 0x6a5a3a, PX, 0.03, PZ, 0, 0, 0, 1, 1, 0.72);   /* muddy rim */
  for (const [x, z, ry, s] of [[52, 15.6, 0.6, 1], [54.2, 17.0, 2.2, 0.9], [51.2, 17.2, -0.9, 0.62]]) {   /* two ducks and a duckling */
    const dx = Math.sin(ry), dz = Math.cos(ry); V(new THREE.IcosahedronGeometry(0.3 * s, 1), 0xf4f0e6, x, 0.18, z, 0, ry, 0, 0.8, 0.6, 1.25); V(new THREE.IcosahedronGeometry(0.17 * s, 1), s < 0.7 ? 0xf0d860 : 0x3a7a4a, x + dx * 0.3 * s, 0.42 * s + 0.1, z + dz * 0.3 * s);
    V(B(0.12 * s, 0.05 * s, 0.16 * s), 0xe89030, x + dx * 0.46 * s, 0.4 * s + 0.1, z + dz * 0.46 * s, 0, ry, 0); }
  const geo = mergeGeometries(parts); const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 })); mesh.castShadow = mesh.receiveShadow = true; root.add(mesh);
  const water = new THREE.Mesh(new THREE.CircleGeometry(PR, 28).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4f8db5, roughness: 0.12, metalness: 0.1 })); water.position.set(PX, 0.07, PZ); water.scale.z = 0.72; root.add(water);
  const padMat = mat(0x4e8a34); for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.3, 8).rotateX(-Math.PI / 2), padMat); p.position.set(PX + 1.2 - i * 0.35, 0.09, PZ - 0.9 + (i % 2) * 0.5); root.add(p); }
  /* solid for walkers and monster paths; low tufts, lavender, rims and stones stay walkable */
  for (const [x0, x1] of [[63.2, 69.4], [72.6, 78.6], [82.6, 91.4]]) solidBoxes.push({ x0, x1, z0: 13.5, z1: 14.1 });
  solidBoxes.push({ x0: CX - 1.35, x1: CX + 1.35, z0: CZ - 4.2, z1: CZ + 1.75 }, { x0: HX - 0.6, x1: HX + 0.6, z0: -7.65, z1: -3.95 }, { x0: PX - PR, x1: PX + PR, z0: PZ - PR * 0.72, z1: PZ + PR * 0.72 });
  solidAt(DX, DZ - 0.3, 0.45, 1.2); solidAt(57.2, -9.4, 1.25); solidAt(60.4, -9.6, 1.07);
}

// the western woods: Hobb's Old Stone (its spiral glows, emissive only), Tobin's woodcutting yard, a fallen hollow trunk, a fairy ring,
// a worn footpath out to the stream's stepping stones, and ferns. Seeded random only, the same for every player. Built on the first frame.
function buildWestWoods(){
  const root = new THREE.Group(); town.add(root); const bins = new Map(); let rs = 7;
  const rnd = () => { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; };
  const add = (geo, col, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, glow = 0) => {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()); g.applyMatrix4(m); for (const a of Object.keys(g.attributes)) if (a !== 'position' && a !== 'normal') g.deleteAttribute(a);
    const k = col + ':' + glow; if (!bins.has(k)) bins.set(k, []); bins.get(k).push(g); };
  const Cy = (a, b, h, n = 8, hs = 1, open = false, t0 = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(a, b, h, n, hs, open, t0, tl), Bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const Sp = (r, w = 8, h = 6, p0 = 0, pl = Math.PI * 2, t0 = 0, tl = Math.PI) => new THREE.SphereGeometry(r, w, h, p0, pl, t0, tl), Co = (r, h, n = 6) => new THREE.ConeGeometry(r, h, n);
  const solids = [];
  /* Hobb's Old Stone: a leaning mossy standing stone with a faint glowing spiral, an offering slab and a ring of low stones */
  { const X = -100, Z = 20;
    add(Cy(0.55, 0.95, 4.4, 6), 0x8c8a80, X, 2.1, Z, 0.05, 0.3, -0.07);
    add(Sp(0.75, 8, 5), 0x4f8a34, X - 0.12, 4.3, Z, 0, 0, 0, 1.0, 0.45, 1.05);
    add(Sp(0.5, 8, 5), 0x5a9a3c, X + 0.5, 0.35, Z - 0.6, 0, 0, 0, 1.2, 0.5, 1.0);
    add(new THREE.TorusGeometry(0.28, 0.05, 4, 16, Math.PI * 3.2), 0x9ff0b8, X + 0.74, 2.3, Z, 0, Math.PI / 2, -0.07, 1, 1, 1, 1);
    add(new THREE.TorusGeometry(0.12, 0.045, 4, 12, Math.PI * 1.6), 0x9ff0b8, X + 0.75, 2.3, Z, 0, Math.PI / 2, 0, 1, 1, 1, 1);
    add(Bx(1.6, 0.45, 0.9), 0x7a7870, X + 2.0, 0.22, Z, 0, 0.1);
    add(Sp(0.14, 6, 4), 0xc83a2a, X + 1.7, 0.55, Z - 0.15); add(Sp(0.14, 6, 4), 0xd85a2a, X + 1.95, 0.55, Z + 0.2);
    add(Cy(0.09, 0.07, 0.16, 6), 0x8a5a2a, X + 2.35, 0.53, Z - 0.1); add(Sp(0.1, 6, 4), 0x6a4a22, X + 2.35, 0.64, Z - 0.1, 0, 0, 0, 1, 0.6, 1);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + 0.2; add(Cy(0.25, 0.38, 0.4, 5), 0x9a988e, X + Math.cos(a) * 3.4, 0.18, Z + Math.sin(a) * 3.4, 0, a, 0.05); }
    solids.push([X - 1, Z - 1, X + 1, Z + 1], [X + 1.2, Z - 0.45, X + 2.8, Z + 0.45]); }
  /* Tobin's yard: a stacked log pile, a sawhorse with a half-sawn log and saw, a chopping block with an axe and split logs */
  const log = (x, y, z, ry, L, r) => { add(Cy(r, r, L, 9), 0x6a4422, x, y, z, Math.PI / 2, ry, 0); for (const s of [-1, 1]) add(Cy(r * 0.92, r * 0.92, 0.02, 9), 0xd8b478, x + Math.sin(ry) * s * L / 2, y, z + Math.cos(ry) * s * L / 2, Math.PI / 2, ry, 0); };
  { const X = -90.5, Z = 10;
    [4, 3, 2].forEach((n, r) => { for (let i = 0; i < n; i++) log(X - (n - 1) * 0.36 + i * 0.72, 0.36 + r * 0.62, Z, 0, 2.6, 0.36); });
    for (const s of [-1, 1]) add(Bx(0.18, 1.8, 0.18), 0x4a3018, X + s * 1.7, 0.9, Z, 0, 0, s * -0.05);
    const SX = -86.8, SZ = 14.2;
    for (const s of [-1, 1]) { add(Bx(0.12, 1.4, 0.12), 0x7a5430, SX + s * 0.7, 0.6, SZ - 0.35, 0.35, 0, 0); add(Bx(0.12, 1.4, 0.12), 0x7a5430, SX + s * 0.7, 0.6, SZ + 0.35, -0.35, 0, 0); }
    add(Bx(1.8, 0.14, 0.14), 0x7a5430, SX, 1.15, SZ);
    log(SX - 0.2, 1.48, SZ, Math.PI / 2, 2.4, 0.26);
    add(Bx(0.04, 0.26, 0.7), 0xb8bcc0, SX + 0.25, 1.68, SZ + 0.1); add(Bx(0.08, 0.1, 0.25), 0x8a5a2a, SX + 0.25, 1.8, SZ + 0.55);
    const CX = -87, CZ = 8.6;
    add(Cy(0.55, 0.62, 0.8, 10), 0x6a4422, CX, 0.4, CZ); add(Cy(0.52, 0.52, 0.02, 10), 0xd8b478, CX, 0.81, CZ);
    add(Cy(0.05, 0.05, 1.3, 6), 0x8a5a2a, CX + 0.25, 1.35, CZ, 0, 0, 0.6); add(Bx(0.5, 0.28, 0.06), 0xb8bcc0, CX - 0.08, 0.86, CZ, 0, 0, 0.6);
    for (let i = 0; i < 6; i++) { const a = i * 1.1 + 0.4, d = 1.0 + (i % 2) * 0.35; add(Cy(0.2, 0.2, 0.7, 3), 0xc89a5a, CX + Math.cos(a) * d, 0.14, CZ + Math.sin(a) * d, Math.PI / 2, a, 0); }
    add(Bx(0.6, 0.08, 0.6), 0xd8b478, CX + 0.2, 0.03, CZ - 1.4, 0, 0.5);
    solids.push([X - 1.9, Z - 1.4, X + 1.9, Z + 1.4], [SX - 1, SZ - 0.6, SX + 1, SZ + 0.6], [CX - 0.6, CZ - 0.6, CX + 0.6, CZ + 0.6]); }
  /* a fallen hollow trunk with shelf fungus, moss and a sapling growing from it */
  { const X = -97, Z = 31, ry = 0.9, L = 6;
    add(Cy(0.62, 0.72, L, 10, 1, true), 0x5a3a20, X, 0.6, Z, Math.PI / 2, ry, 0);
    for (const s of [-1, 1]) add(new THREE.RingGeometry(0.36, 0.7, 10), 0xc8a068, X + Math.sin(ry) * s * L / 2, 0.6, Z + Math.cos(ry) * s * L / 2, 0, ry + (s < 0 ? Math.PI : 0), 0);
    for (const s of [-1, 1]) add(Cy(0.4, 0.4, 0.02, 10), 0x1a120a, X + Math.sin(ry) * s * (L / 2 - 0.15), 0.6, Z + Math.cos(ry) * s * (L / 2 - 0.15), Math.PI / 2, ry, 0);
    for (let i = 0; i < 4; i++) { const t = -2 + i * 1.3; add(Sp(0.7, 8, 5), 0x4f8a34, X + Math.sin(ry) * t, 1.12, Z + Math.cos(ry) * t, 0, ry, 0, 0.9, 0.3, 1.3); }
    for (let i = 0; i < 5; i++) { const t = -2.2 + i * 1.0, h = 0.35 + (i % 3) * 0.2; add(Cy(0.32, 0.36, 0.08, 8, 1, false, 0, Math.PI), 0xe0a050, X + Math.sin(ry) * t + Math.cos(ry) * 0.62, h, Z + Math.cos(ry) * t - Math.sin(ry) * 0.62, 0, ry + Math.PI / 2, 0); }
    add(Cy(0.04, 0.06, 1.2, 5), 0x5a3a1e, X + 0.4, 1.7, Z + 0.2); add(Co(0.5, 1.0, 6), 0x3d8f34, X + 0.4, 2.5, Z + 0.2);
    for (let i = -1; i <= 1; i += 2) add(Cy(0.08, 0.14, 1.2, 5), 0x4a2e16, X + Math.sin(ry) * 2.6 + i * 0.3, 0.4, Z + Math.cos(ry) * 2.6, 0.9 * i, ry, 0.5);
    const c = Math.cos(ry), s = Math.sin(ry); solids.push([X - Math.abs(s) * 3 - 0.6, Z - Math.abs(c) * 3 - 0.6, X + Math.abs(s) * 3 + 0.6, Z + Math.abs(c) * 3 + 0.6]); }
  /* a fairy ring of red toadstools with softly glowing spots (low enough to walk through) */
  { const X = -91, Z = 40;
    for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, k = 0.7 + rnd() * 0.6, x = X + Math.cos(a) * 1.8, z = Z + Math.sin(a) * 1.8;
      add(Cy(0.08 * k, 0.11 * k, 0.4 * k, 6), 0xf0e6d0, x, 0.2 * k, z);
      add(Sp(0.26 * k, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0xd8302a, x, 0.38 * k, z, 0, 0, 0, 1, 0.75, 1);
      for (let j = 0; j < 3; j++) { const b = j * 2.1 + a; add(Sp(0.05 * k, 4, 3), 0xfff4c8, x + Math.cos(b) * 0.15 * k, 0.5 * k, z + Math.sin(b) * 0.15 * k, 0, 0, 0, 1, 1, 1, 1); } } }
  /* the worn footpath (flat, walkable) */
  const pts = WOODS_PATH;
  for (let i = 1; i < pts.length; i++) { const [x0, z0] = pts[i - 1], [x1, z1] = pts[i], L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 0.9);
    for (let j = 0; j < n; j++) { const t = (j + 0.5) / n; add(Cy(0.75 + rnd() * 0.25, 0.85, 0.02, 7), j % 2 ? 0x8a6a44 : 0x7e6040, x0 + (x1 - x0) * t + (rnd() - 0.5) * 0.3, 0.025 + j * 0.0005, z0 + (z1 - z0) * t + (rnd() - 0.5) * 0.3, 0, rnd() * 3); } }
  /* fern clumps on clear ground (walkable) */
  let ferns = 0;
  for (let tries = 0; tries < 600 && ferns < 34; tries++) { const x = -102 + rnd() * 20, z = -6 + rnd() * 50;
    if (blocked(x, z) || waterSD(x, z) < 1.5 || Math.hypot(x + 82, z - 11) < 3.5 || solids.some(b => x > b[0] - 0.8 && x < b[2] + 0.8 && z > b[1] - 0.8 && z < b[3] + 0.8) || pts.some(p => Math.hypot(x - p[0], z - p[1]) < 2)) continue;
    ferns++; const k = 0.7 + rnd() * 0.5, col = rnd() < 0.5 ? 0x3d8f34 : 0x2f7a2c;
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + rnd(); add(Co(0.16 * k, 1.2 * k, 4), col, x + Math.cos(a) * 0.35 * k, 0.32 * k, z + Math.sin(a) * 0.35 * k, Math.sin(a) * 1.05, 0, -Math.cos(a) * 1.05, 1, 1, 0.35); } }
  const mats = new Map();
  for (const [k, geos] of bins) { const [col, glow] = k.split(':').map(Number);
    const m = mats.get(k) || new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: 0.9, side: THREE.DoubleSide, emissive: glow ? col : 0x000000, emissiveIntensity: glow ? 0.9 : 0 });
    const mesh = new THREE.Mesh(mergeGeometries(geos), m); mesh.castShadow = !(col === 0x8a6a44 || col === 0x7e6040); mesh.receiveShadow = true; root.add(mesh); }
  for (const b of solids) solidBoxes.push({ x0: b[0], z0: b[1], x1: b[2], z1: b[3] });
}
// on the water: Fenwick's jetty and rowboat, the mooring posts and punt by the bridge, the watermill on the west bank, ducks on the pond,
// stepping stones over the west stream, and a little mist on the river. Built on the first frame (as buildGreen), the same for everyone.
const RIVERLIFE = { built: false, wheel: null, ducks: [] };
function buildRiverLife(){
  RIVERLIFE.built = true;
  const W = WATER_Y, g = new THREE.Group(); town.add(g);
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), Cy = (a, b, h, n = 8) => new THREE.CylinderGeometry(a, b, h, n);
  const wood = texMat(woodTex(), 2, 2, 0xffffff), dark = texMat(woodTex(), 2, 2, 0x8a6a50), cols = new Map(), bins = new Map();
  const cm = c => cols.get(c) || (cols.set(c, mat(c)), cols.get(c));
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); o.updateMatrix();
    const q = (geo.index ? geo.toNonIndexed() : geo).applyMatrix4(o.matrix); for (const a of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(a)) q.deleteAttribute(a);
    if (!q.attributes.uv) q.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2));
    const mm = typeof m === 'number' ? cm(m) : m; if (!bins.has(mm)) bins.set(mm, []); bins.get(mm).push(q); };
  // Fenwick's jetty, a plank deck out over the river from his bank, with a pail, a stool and his rowboat tied alongside
  { const jx = -42,   /* west of the shrimp spot at x -36, so its ripples stay in open water */ z0 = riverSouth(jx) + 0.6, z1 = z0 - 4.4;
    for (let z = z0; z > z1; z -= 0.55) add(B(2.2, 0.12, 0.48), wood, jx + (Math.round(z * 7) % 2) * 0.04, 0.12, z - 0.25, 0, (Math.round(z * 13) % 3 - 1) * 0.03);
    for (const s of [-1, 1]) { add(B(0.14, 0.14, z0 - z1), dark, jx + s * 0.95, 0.02, (z0 + z1) / 2); for (const z of [z0 - 0.3, (z0 + z1) / 2, z1 + 0.25]) add(Cy(0.13, 0.15, 1.6), dark, jx + s * 0.95, -0.4, z); }
    add(Cy(0.15, 0.17, 1.2), dark, jx + 0.95, 0.6, z1 + 0.25); add(new THREE.TorusGeometry(0.17, 0.05, 5, 10), 0xc8b080, jx + 0.95, 0.75, z1 + 0.25, Math.PI / 2);
    add(Cy(0.26, 0.22, 0.42, 10), 0x7a8a90, jx - 0.5, 0.39, z1 + 0.9); add(Cy(0.27, 0.27, 0.04, 10), 0x3a5a70, jx - 0.5, 0.58, z1 + 0.9);
    add(B(0.5, 0.06, 0.5), wood, jx + 0.4, 0.6, z1 + 1.6); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(B(0.06, 0.42, 0.06), dark, jx + 0.4 + a * 0.2, 0.39, z1 + 1.6 + b * 0.2);
    const bm = texMat(woodTex(), 2, 2, 0x4a7a9a), bx = jx + 2.2, bz = z1 + 1.6;
    add(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bm, bx, W + 0.42, bz, 0, 0.05, 0, 0.75, 0.42, 2.0);
    add(B(1.2, 0.07, 0.3), wood, bx, W + 0.36, bz + 0.3, 0, 0.05); add(B(0.08, 0.06, 2.4), wood, bx + 0.25, W + 0.4, bz - 0.4, 0, 0.05, 0.25);
    add(Cy(0.025, 0.025, 1.4, 4), 0xc8b080, (jx + 0.95 + bx) / 2, 0.45, bz - 0.9, 0, 0, Math.PI / 2 - 0.25); }
  // two mooring posts on the bank east of the bridge, and a punt tied to them
  { const z0 = riverSouth(-5) + 0.3;
    for (const x of [-6, -3.6]) { add(Cy(0.16, 0.19, 1.3), dark, x, 0.45, z0); add(Cy(0.19, 0.19, 0.08), 0x4a3a2a, x, 1.12, z0); solidAt(x, z0, 0.3); }
    const px = -4.8, pz = z0 - 2.0; add(B(1.2, 0.3, 3.4), texMat(woodTex(), 2, 2, 0xb06a40), px, W + 0.15, pz); add(B(1.0, 0.1, 3.2), wood, px, W + 0.32, pz);
    add(Cy(0.025, 0.025, 2.0, 4), 0xc8b080, -5.4, 0.35, z0 - 0.9, 0.9); add(Cy(0.025, 0.025, 2.0, 4), 0xc8b080, -4.2, 0.35, z0 - 0.9, 0.9); }
  // the watermill where the river bends south: a stone-and-timber house on the bank and its wheel dipping in the water
  { const mx = -99.5, bz = riverSouth(mx), stone = cm(0xa8a49a), plaster = cm(0xece2cc), roofM = new THREE.MeshStandardMaterial({ map: roofTex, color: 0xa86a4a, flatShading: true });
    add(B(6.4, 1.0, 5.6), stone, mx, 0.5, bz + 3.6); add(B(6, 3.4, 5.2), plaster, mx, 2.7, bz + 3.6);
    for (const x of [-3, 3]) for (const z of [-2.6, 2.6]) add(B(0.3, 3.6, 0.3), dark, mx + x, 2.8, bz + 3.6 + z);
    add(B(6.2, 0.3, 0.3), dark, mx, 4.4, bz + 1.0); add(B(6.2, 0.3, 0.3), dark, mx, 2.4, bz + 1.0);
    for (const s of [-1, 1]) add(B(7, 0.22, 3.6), roofM, mx, 5.5, bz + 3.6 + s * 1.55, s * 0.62);
    add(B(1.4, 0.9, 0.12), 0x3a4a5a, mx + 1.6, 3.0, bz + 0.96); add(B(1.4, 0.9, 0.12), 0x3a4a5a, mx - 1.6, 3.0, bz + 0.96);
    add(B(0.4, 0.4, 1.6), dark, mx - 3.4, 2.4, bz - 0.3); add(B(0.25, 3.3, 0.25), dark, mx - 3.4, 0.9, bz - 1.2);
    solidBoxes.push({ x0: mx - 3.4, x1: mx + 3.4, z0: bz + 0.7, z1: bz + 6.5 });
    const wheel = new THREE.Group(); wheel.position.set(mx - 3.4, 2.4, bz - 1.4); g.add(wheel);
    const wm = new THREE.Mesh(mergeGeometries([new THREE.TorusGeometry(2.3, 0.12, 5, 20), new THREE.TorusGeometry(1.2, 0.1, 5, 16), Cy(0.35, 0.35, 0.8, 8).rotateX(Math.PI / 2)]
      .concat(Array.from({ length: 10 }, (_, i) => B(0.12, 0.5, 0.9).translate(0, 2.45, 0).applyMatrix4(new THREE.Matrix4().makeRotationZ(i / 10 * Math.PI * 2))))
      .concat(Array.from({ length: 5 }, (_, i) => B(0.1, 4.6, 0.12).applyMatrix4(new THREE.Matrix4().makeRotationZ(i / 5 * Math.PI)))).map(q => { q = q.index ? q.toNonIndexed() : q; return q; })), dark);
    wm.rotation.y = Math.PI / 2; wm.castShadow = true; wheel.add(wm); RIVERLIFE.wheel = wheel; }
  // stepping stones across the west stream
  for (let i = 0; i < 5; i++) add(Cy(0.55, 0.65, 0.5, 7), 0x9a968c, -110.4 + i * 1.25, W + 0.12, 19.6 + Math.sin(i * 2) * 0.25, 0, i, 0, 1, 1, 0.85);
  for (const [m, list] of bins) { const o = new THREE.Mesh(mergeGeometries(list), m); o.castShadow = o.receiveShadow = true; g.add(o); }
  // a family of ducks on the pond: two grown-ups and four ducklings
  const mk = (s, col) => { const d = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), toonMat(col)); body.scale.set(0.8, 0.6, 1.15); body.position.y = 0.1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), toonMat(s < 1 ? col : 0x2a7a4a)); head.position.set(0, 0.5, 0.36);
    const bill = new THREE.Mesh(B(0.14, 0.06, 0.2), toonMat(0xf0a020)); bill.position.set(0, 0.47, 0.6);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 5), toonMat(col)); tail.rotation.x = -2.2; tail.position.set(0, 0.25, -0.46);
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), cm(0x111111)); e.position.set(sx * 0.15, 0.55, 0.5); d.add(e); }
    d.add(body, head, bill, tail); d.scale.setScalar(s * 1.7); g.add(d); return d; };
  RIVERLIFE.ducks = [mk(1, 0x9a7a5a), mk(1.05, 0xb08a60), mk(0.5, 0xe8d070), mk(0.5, 0xe8d070), mk(0.5, 0xe8d070), mk(0.5, 0xe8d070)];
  // soft mist lying on the river (lit, so it darkens at night)
  const mist = new THREE.Mesh(mergeGeometries(Array.from({ length: 18 }, (_, i) => { const x = -100 + i * 11 + Math.sin(i * 3) * 3; return new THREE.PlaneGeometry(9, 3.2).rotateX(-Math.PI / 2).translate(x, W + 0.35 + (i % 3) * 0.12, riverSouth(x) - riverWidth(x) / 2 + Math.sin(i) * 0.8); })),
    new THREE.MeshLambertMaterial({ color: 0xf4f6f8, transparent: true, opacity: 0.22, depthWrite: false, map: makeTex(c => { const gr = c.createRadialGradient(16, 16, 1, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32); }) }));
  g.add(mist);
}
// the wheel turns slowly and the ducks paddle round in a slow loop, bobbing (from the clock, so everyone sees much the same)
function updateRiverLife(){
  if (!RIVERLIFE.built) return; const t = Date.now() / 1000;
  RIVERLIFE.wheel.rotation.x = -t * 0.6;
  const a0 = t * 0.03;
  RIVERLIFE.ducks.forEach((d, i) => { const a = a0 - (i < 2 ? i * 0.3 : 0.55 + (i - 2) * 0.13), R = 6 - (i % 2) * 0.7, x = POND.x + Math.cos(a) * R, z = POND.z + Math.sin(a) * R * POND.k;
    d.position.set(x, -0.38 + Math.sin(t * 2 + i) * 0.03, z); d.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a) * POND.k); });
}
function updateSilkworks(){
  if (!SILK.built) { buildSilkworks(); buildMarket(); buildGreen(); buildRiverLife(); buildFarmDress(); buildWestWoods(); return; }   /* built on the first frame: the town is put up before this part of the script has run */
  const H = SILK.hutch, ready = hutchReady(), busy = H.n > 0 && !ready, t = performance.now() / 1000;
  const B = SILK.SHED, inside = hero && Math.abs(hero.position.x - B.x) < B.hw + 0.5 && Math.abs(hero.position.z - B.z) < B.hd + 0.5; SILK.roof.visible = !inside;   /* see in while you're inside */
  // leaves on the trays while they're being eaten; the worms wriggle; cocoons once they're ready
  SILK.leaves.forEach((l, k) => { l.visible = busy && k < Math.ceil(H.n / 4); l.scale.x = busy ? Math.max(0.15, 1 - (Date.now() - H.t) / HUTCH_MS) : 1; });
  SILK.worms.forEach((w, i) => { w.visible = busy || H.n === 0; w.position.x = -0.75 + (i % 4) * 0.5 + Math.sin(t * 2 + i) * (busy ? 0.06 : 0.01); w.rotation.y = Math.sin(t * 3 + i * 1.7) * 0.5; });
  SILK.cocoons.forEach((c, i) => { c.visible = ready && i < H.n; });
  // the "ready" bubble, bobbing over the hutch
  const bub = SILK.bubble;
  if (ready) { const v = new THREE.Vector3(SILK.HUT.x, 3.6 + Math.sin(t * 3) * 0.12, SILK.HUT.z).project(camera);
    if (v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1) { bub.style.display = 'flex'; bub.style.left = (v.x + 1) / 2 * innerWidth + 'px'; bub.style.top = (-v.y + 1) / 2 * innerHeight + 'px'; } else bub.style.display = 'none'; }
  else bub.style.display = 'none';
  if (ready && !SILK.toldReady) { SILK.toldReady = true; addSystemLine('Your silkworms have spun their cocoons. They are ready to collect at the hutch.'); }
  if (!ready) SILK.toldReady = false;
}
function hutchClick(){
  const H = SILK.hutch, here = SILK.HUT, spot = new THREE.Vector3(here.x, 0, here.z + 2.1);
  if (hutchReady()) {
    walkStart(spot, () => {
      if (!hutchReady()) return;
      if (!addItem('Silk cocoon', H.n, COCOON_ICON)) { showToast('Your bag is full.'); return; }
      const n = H.n; SILK.hutch = { n: 0, t: 0 }; addXp('Crafting', 4 * n); rtAdvance(6, 7, 'Spin a cocoon into silk thread at the spinning wheel.'); silkSound('collect'); heroAnim.yaw = yawTo(hero.position.x, hero.position.z, here.x, here.z);
      showToast(`You gather ${n} silk cocoon${n > 1 ? 's' : ''} from the trays.  +${4 * n} Crafting XP`); saveNow(false); });
    return;
  }
  if (H.n > 0) { const left = Math.ceil((HUTCH_MS - (Date.now() - H.t)) / 1000); showToast(`The silkworms are munching through ${H.n} mulberry leaves. Their cocoons will be ready in about ${left} seconds.`); return; }
  if (!hasItem('Mulberry leaves')) { showToast('A hutch full of hungry silkworms. Feed them mulberry leaves and they will spin silk cocoons.'); return; }
  walkStart(spot, () => {
    const n = Math.min(HUTCH_MAX, countOf('Mulberry leaves')); if (!n || SILK.hutch.n) return;
    for (let i = 0; i < n; i++) removeItem('Mulberry leaves');
    SILK.hutch = { n, t: Date.now() }; rtAdvance(5, 6, 'Collect the cocoons from the hutch when the silkworms are done.'); heroAnim.yaw = yawTo(hero.position.x, hero.position.z, here.x, here.z);
    setAct({ k: 'hutch', t: Date.now() }); setTimeout(() => { if (ONLINE.act && ONLINE.act.k === 'hutch') setAct(null); }, 1400);
    silkSound('feed'); showToast(`You spread ${n} mulberry leaves over the trays. The silkworms set to work.`); saveNow(false);
  });
}
