// ----- the paths: worn dirt tracks, drawn with textures made in code -----
const ROADS = [];   // every road segment, so the scattered trees keep clear of them
// a tiling dirt texture: packed earth, darker wheel ruts, grit and pebbles, fading softly to grass at the edges
const dirtTex = (() => {
  const W = 128, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const r = (() => { let q = 11; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
  g.fillStyle = '#9c7f55'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2200; i++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(70,50,28,${0.1 + r() * 0.2})` : `rgba(200,175,130,${0.1 + r() * 0.2})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  for (const x of [W * 0.3, W * 0.7]) { const gr = g.createLinearGradient(x - 10, 0, x + 10, 0); gr.addColorStop(0, 'rgba(60,42,22,0)'); gr.addColorStop(0.5, 'rgba(60,42,22,.28)'); gr.addColorStop(1, 'rgba(60,42,22,0)'); g.fillStyle = gr; g.fillRect(x - 10, 0, 20, H); }   // wheel ruts
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H, rad = 1.5 + r() * 3;
    g.fillStyle = 'rgba(40,30,20,.35)'; g.beginPath(); g.ellipse(x + 1, y + 1, rad, rad * 0.8, 0, 0, 7); g.fill();
    const c = 120 + r() * 70; g.fillStyle = `rgb(${c},${c * 0.95},${c * 0.88})`; g.beginPath(); g.ellipse(x, y, rad, rad * 0.8, r() * 3, 0, 7); g.fill(); }   // pebbles
  // fade the sides so the path blends into the grass
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = Math.abs(x / (W - 1) - 0.5) * 2, wob = Math.sin(y * 0.11) * 0.05 + Math.sin(y * 0.37 + 1) * 0.03;
    d[(y * W + x) * 4 + 3] = 255 * Math.max(0, Math.min(1, (1 - u + wob) / 0.22));
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
})();
const dirtMat = new THREE.MeshStandardMaterial({ map: dirtTex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
// the green round the well: cobbles worn into packed earth the colour of the roads, thinning out at a ragged edge so the roads run in,
// and a ring of big flagstones round the well's foot. Painted once into its own ground layer, like the roads. (It was a round flat disc of
// repeating cobble pattern, which looked stuck on from the game camera.)
const COBBLES = [];   /* the patches kept clear of the painted grass: [x, z, radius] */
const sqRand = (() => { let q = 7; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
const sqEdge = a => Math.sin(a * 3) * 0.35 + Math.sin(a * 7 + 1.3) * 0.22 + Math.sin(a * 13 + 0.4) * 0.12;   /* the ragged edge, round the circle */
function greenSquare(cx, cz){
  COBBLES.push([cx, cz, 5]);
  const R = 5.6, PPU = 40, S = Math.ceil(R * 2 * PPU + 40), cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), r = sqRand;
  // the bed: packed earth, the roads' own colour, fading out at the ragged edge
  const img = g.createImageData(S, S), d = img.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const wx = (x - S / 2) / PPU, wz = (y - S / 2) / PPU, k = Math.max(0, Math.min(1, (R - 0.4 + sqEdge(Math.atan2(wz, wx)) * 0.9 - Math.hypot(wx, wz)) / 0.9));
    const o = (y * S + x) * 4; d[o] = 150; d[o + 1] = 122; d[o + 2] = 82; d[o + 3] = k * 242; }
  g.putImageData(img, 0, 0);
  // the cobbles: rounded stones in loose rows, fewer towards the edge
  for (let row = -R; row <= R; row += 0.3) for (let col = -R; col <= R; col += 0.33) {
    const x = col + (Math.round(row / 0.3) % 2) * 0.165 + (r() - 0.5) * 0.1, z = row + (r() - 0.5) * 0.08, dd = Math.hypot(x, z), edge = R - 0.5 + sqEdge(Math.atan2(z, x)) * 0.9;
    if (dd < 2.55 || dd > edge || (dd > edge - 1.2 && r() < (dd - edge + 1.2) / 1.2)) continue;
    const X = S / 2 + x * PPU, Y = S / 2 + z * PPU, w = (0.13 + r() * 0.05) * PPU, h = (0.11 + r() * 0.04) * PPU, c = 108 + r() * 46, warm = r() * 16;
    g.save(); g.translate(X, Y); g.rotate((r() - 0.5) * 0.5);
    g.fillStyle = 'rgba(30,24,16,.45)'; g.beginPath(); g.ellipse(1.5, 2, w, h, 0, 0, 7); g.fill();
    g.fillStyle = `rgb(${c + warm},${c * 0.96 + warm * 0.5},${c * 0.88})`; g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,250,235,.16)'; g.beginPath(); g.ellipse(-w * 0.3, -h * 0.35, w * 0.45, h * 0.35, 0, 0, 7); g.fill(); g.restore(); }
  // the flagstones round the well
  const N = 14; for (let i = 0; i < N; i++) { const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2 - 0.05, r0 = 2.05, r1 = 2.6 + (i % 3) * 0.06, c = 150 + r() * 30;
    g.fillStyle = 'rgba(30,24,16,.5)'; g.beginPath(); g.arc(S / 2 + 2, S / 2 + 2, r1 * PPU, a0, a1); g.arc(S / 2 + 2, S / 2 + 2, r0 * PPU, a1, a0, true); g.fill();
    g.fillStyle = `rgb(${c},${c * 0.97},${c * 0.92})`; g.beginPath(); g.arc(S / 2, S / 2, r1 * PPU, a0, a1); g.arc(S / 2, S / 2, r0 * PPU, a1, a0, true); g.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(S / PPU, S / PPU).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  m.position.set(cx, 0.05, cz); m.receiveShadow = true; m.renderOrder = 2; town.add(m);
}
// a stone step at a door: a slab under the doorway and two smaller stones before it, all in one mesh. fx, fz: the way the door faces
const STEPS = [];
function doorStep(x, z, fx, fz, wide = 1.8){
  COBBLES.push([x, z, 1.3]);
  const ry = fx ? Math.PI / 2 : 0, r = sqRand, put = (geo, hex, px, pz, rot) => { geo.rotateY(rot); geo.translate(px, 0, pz); geo = geo.toNonIndexed();
    const c = new THREE.Color(hex), n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); STEPS.push(geo); };
  const slab = new THREE.BoxGeometry(wide, 0.1, 0.8); slab.translate(0, 0.05, 0); put(slab, 0x9a948a, x + fx * 0.5, z + fz * 0.5, ry);   /* low enough to walk over */
  for (const [o, sz] of [[1.25, 0.55], [1.95, 0.45]]) { const st = new THREE.CylinderGeometry(sz, sz * 1.05, 0.08, 7); st.translate(0, 0.04, 0);
    put(st, 0x8a847a, x + fx * o + (fz ? (o - 1.5) * 0.3 : 0), z + fz * o + (fx ? (o - 1.5) * 0.3 : 0), o + r() * 0.3); }
}
function buildDoorSteps(){   /* once every door has its step */
  if (!STEPS.length) return;
  const m = new THREE.Mesh(mergeGeometries(STEPS), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true })); m.receiveShadow = true; town.add(m); STEPS.length = 0;
}
// the paths: every path is painted onto one big ground layer, so joins blend together and the ends round off naturally
const pathEdgeSpots = [], PATHS = [];
function roadPath(pts, w = 2.2){
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const n = Math.max(2, Math.ceil(curve.getLength() / 0.5)), sp = curve.getSpacedPoints(n);
  for (let i = 0; i <= n; i++) {
    const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n, i + 1)];
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
    if (i % 3 === 0) pathEdgeSpots.push([sp[i].x, sp[i].z, -dz / L, dx / L, w]);
    if (i) ROADS.push([sp[i - 1].x, sp[i - 1].z, sp[i].x, sp[i].z]);
  }
  PATHS.push({ pts: sp.map(v => [v.x, v.z]), w });
}
function paintPaths(){
  const X0 = -114, X1 = 112, Z0 = -14, Z1 = 84, PPU = 16,   // wide enough for the fields, the windmill and the pens out east
    W = (X1 - X0) * PPU, H = (Z1 - Z0) * PPU;
  const toPx = ([x, z]) => [(x - X0) * PPU, (z - Z0) * PPU];
  const r = (() => { let q = 31; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
  // a mask of every path: a few strokes from wide and faint to the full width, so the edges fade into the grass
  const stroke = (g, extra, alpha, col = '#fff') => {
    g.strokeStyle = col; g.globalAlpha = alpha; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const p of PATHS) { g.lineWidth = (p.w + extra) * PPU; g.beginPath(); p.pts.forEach((pt, i) => { const [x, y] = toPx(pt); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
    g.globalAlpha = 1;
  };
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const mask = mk(), m = mask.getContext('2d');
  stroke(m, 0.9, 0.25); stroke(m, 0.45, 0.5); stroke(m, 0, 1);
  const rim = mk(), rg = rim.getContext('2d');   // a darker rim, a little wider than the path
  stroke(rg, 1.3, 0.2); stroke(rg, 0.8, 0.45);
  // the dirt itself: packed earth with grit and pebbles, and a lighter worn line down the middle of each path
  const out = mk(), o = out.getContext('2d');
  o.fillStyle = '#9a7c52'; o.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 220; i++) { const v = r(); o.fillStyle = v < 0.5 ? `rgba(70,50,28,${0.12 + r() * 0.2})` : `rgba(205,180,135,${0.1 + r() * 0.2})`; o.fillRect(r() * W, r() * H, 1 + r() * 2.5, 1 + r() * 2.5); }
  stroke(o, -1.3, 0.12, '#e8d2a0');
  for (let i = 0; i < W * H / 5000; i++) { const x = r() * W, y = r() * H, rad = 1.5 + r() * 3.5, c = 120 + r() * 70;
    o.fillStyle = 'rgba(40,30,20,.35)'; o.beginPath(); o.ellipse(x + 1, y + 1, rad, rad * 0.8, 0, 0, 7); o.fill();
    o.fillStyle = `rgb(${c},${c * 0.95},${c * 0.88})`; o.beginPath(); o.ellipse(x, y, rad, rad * 0.8, r() * 3, 0, 7); o.fill(); }
  o.globalCompositeOperation = 'destination-in'; o.drawImage(mask, 0, 0);
  // put it together: the rim underneath, the dirt on top
  rg.globalCompositeOperation = 'source-in'; rg.fillStyle = '#4e3e22'; rg.fillRect(0, 0, W, H);
  rg.globalCompositeOperation = 'source-over'; rg.drawImage(out, 0, 0);
  const t = new THREE.CanvasTexture(rim); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  plane.position.set((X0 + X1) / 2, 0.045, (Z0 + Z1) / 2); plane.receiveShadow = true; plane.userData.shadowSet = true; plane.renderOrder = 1;
  town.add(plane);
}
// little stones and wildflowers along the path edges
function decoratePaths(){
  const r = (() => { let q = 77; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
  const stones = [], flowers = [];
  for (const [x, z, nx, nz, w] of pathEdgeSpots) for (const side of [1, -1]) {
    const o = w / 2 + 0.15 + r() * 0.6, px = x + nx * o * side + (r() - 0.5) * 0.6, pz = z + nz * o * side + (r() - 0.5) * 0.6;
    if (solidBoxes.some(b => px > b.x0 - 0.3 && px < b.x1 + 0.3 && pz > b.z0 - 0.3 && pz < b.z1 + 0.3)) continue;
    if (waterSD(px, pz) < 1) continue;   // not in the water
    const v = r(); if (v < 0.35) stones.push([px, pz]); else if (v < 0.6) flowers.push([px, pz]);
  }
  const dummy = new THREE.Object3D();
  const st = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.16, 0), mat(0x9a948a), stones.length);
  stones.forEach(([x, z], i) => { dummy.position.set(x, 0.06, z); dummy.rotation.set(r() * 3, r() * 3, r() * 3); dummy.scale.set(1 + r(), 0.6 + r() * 0.4, 1 + r()); dummy.updateMatrix(); st.setMatrixAt(i, dummy.matrix); st.setColorAt(i, new THREE.Color().setHSL(0.08, 0.08, 0.45 + r() * 0.25)); });
  town.add(st);
  const petals = [0xf4e04d, 0xffffff, 0xe86aa6, 0x9b7be0, 0xf08a4b];
  const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), new THREE.MeshStandardMaterial({ roughness: 0.8, emissive: 0x111111 }), flowers.length);
  const stem = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 3), mat(0x3f7a2e), flowers.length);
  flowers.forEach(([x, z], i) => {
    dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
    dummy.position.set(x, 0.18, z); dummy.updateMatrix(); stem.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 0.38, z); dummy.updateMatrix(); fl.setMatrixAt(i, dummy.matrix); fl.setColorAt(i, new THREE.Color(petals[Math.floor(r() * petals.length)]));
  });
  town.add(fl, stem);
}
// if the adventurer has ended up inside a solid box (a door shutting on them, say), slide them to the nearest clear spot
function unstick(){
  if (!hero || !hardHit(hero.position.x, hero.position.z)) return;
  for (let r = 0.25; r <= 4; r += 0.25) for (let a = 0; a < 16; a++) {
    const x = hero.position.x + Math.cos(a * Math.PI / 8) * r, z = hero.position.z + Math.sin(a * Math.PI / 8) * r;
    if (!hardHit(x, z)) { hero.position.set(x, 0, z); heroShadow.position.set(x, 0.06, z); return; }
  }
}
// open or close a house door: a swing on its hinge, and the doorway is walkable only while it is open
function toggleDoor(rec){
  rec.open = !rec.open;
  if (rec.open === false) unstick();   // never shut a door on the adventurer
  rec.pivot.rotation.y = rec.open ? -Math.PI / 2 : 0;
  creak(rec.open);
  rec.leaf.userData.action = rec.open ? 'Close' : 'Open';
  const i = solidBoxes.indexOf(rec.box);
  if (rec.open && i >= 0) solidBoxes.splice(i, 1);
  if (!rec.open && i < 0) solidBoxes.push(rec.box);
}
// a villager stands inside a house; clicking them walks over and opens their dialogue
// villagers wander a little around their spot: inside their house, or round the green for Mara
const WANDER = [];
/* a villager's body against walls and furniture, with room for their size (world units) */
function npcHit(x, z){ const r = 0.5; return boxesNear(x, z).some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r); }
// is the whole way from here to there clear for them? (checked every 0.4 world units)
function npcWayClear(w, ax, az, bx, bz){ const L = Math.hypot(bx - ax, bz - az) * w.k, n = Math.max(1, Math.ceil(L / 0.4));
  for (let i = 1; i <= n; i++) { const k = i / n; if (npcHit(w.ox + (ax + (bx - ax) * k) * w.k, w.oz + (az + (bz - az) * k) * w.k)) return false; } return true; }
function pickWanderTarget(w){
  const x = w.sp.position.x, z = w.sp.position.z;
  for (let i = 0; i < 16; i++) {
    const tx = w.lx + (Math.random() * 2 - 1) * w.rad, tz = w.lz + (Math.random() * 2 - 1) * w.rad;
    if (tx < w.box.x0 || tx > w.box.x1 || tz < w.box.z0 || tz > w.box.z1) continue;
    if (npcHit(w.ox + tx * w.k, w.oz + tz * w.k)) continue;   // the spot itself must have room for them
    if (!npcWayClear(w, x, z, tx, tz)) continue;              // and so must the walk there
    w.tx = tx; w.tz = tz; return;
  }
  w.tx = w.sp.position.x; w.tz = w.sp.position.z;   // nowhere better: stay put
}
function addWander(sp, rec, frames, o){
  WANDER.push({ sp, rec, frames, lx: o.lx, lz: o.lz, rad: o.rad, box: o.box, k: o.k, ox: o.ox, oz: o.oz,
    tx: o.lx, tz: o.lz, pause: 60 + Math.random() * 120, tick: 0, face: 1, yaw: 0, parentYaw: o.parentYaw || 0 });
}
// who is talking to this NPC: you, or another player; if more than one, whoever started talking most recently
function talkerOf(rec){
  let best = null;
  if (dlg === rec && hero) best = { x: hero.position.x, z: hero.position.z, t: dlgTalkT };
  const now = performance.now();
  for (const id in remote) { const r = remote[id];
    if (r.act && r.act.k === 'talk' && r.act.n === rec.name && now - r.actAt < ACT_TIME.talk && (!best || r.actAt > best.t))
      best = { x: r.sprite.position.x, z: r.sprite.position.z, t: r.actAt }; }
  return best;
}
// ----- the guards' day: on watch at their post, out patrolling their stretch of road, a torch after dark.
// Worked out from the clock alone, so every player sees each guard in the same place.
const GUARD_DAY = [[0, 6, 'post'], [6, 7.5, 'post'], [7.5, 12, 'patrol'], [12, 13, 'post'], [13, 19, 'patrol'], [19, 22, 'patrol'], [22, 24, 'post']];
const GUARD_NAMES = ['Osric', 'Edda', 'Bertram', 'Godwin'], GUARD_SPEED = 1.5, GUARD_REST = 5000;
const guardDark = h => h >= 19.5 || h < 6.5;
// their beat: the road beside their post, as far as about 18 units one way (the other way if that's too short)
function guardBeat(w){
  if (w.beat !== undefined) return w.beat;
  const px = w.lx, pz = w.lz; let bi = -1, bd = 1e9, bq = null;
  ROADS.forEach(([x0, z0, x1, z1], i) => { const dx = x1 - x0, dz = z1 - z0, t = Math.max(0, Math.min(1, ((px - x0) * dx + (pz - z0) * dz) / (dx * dx + dz * dz || 1))), qx = x0 + dx * t, qz = z0 + dz * t, d = Math.hypot(px - qx, pz - qz); if (d < bd) { bd = d; bi = i; bq = [qx, qz]; } });
  if (bi < 0 || bd > 8) return (w.beat = null);
  const walk = dir => { const pts = [bq]; let len = 0, i = bi, end = dir > 0 ? [ROADS[i][2], ROADS[i][3]] : [ROADS[i][0], ROADS[i][1]];
    for (let n = 0; n < 40 && len < 18; n++) { const last = pts[pts.length - 1], seg = Math.hypot(end[0] - last[0], end[1] - last[1]);
      if (len + seg > 18) { const k = (18 - len) / seg; pts.push([last[0] + (end[0] - last[0]) * k, last[1] + (end[1] - last[1]) * k]); len = 18; break; }
      pts.push(end); len += seg; const nx = ROADS[i + dir]; if (!nx) break;
      const join = dir > 0 ? [nx[0], nx[1]] : [nx[2], nx[3]]; if (Math.hypot(join[0] - end[0], join[1] - end[1]) > 0.05) break;
      i += dir; end = dir > 0 ? [nx[2], nx[3]] : [nx[0], nx[1]]; }
    return { pts, len }; };
  let b = walk(1); if (b.len < 10) { const b2 = walk(-1); if (b2.len > b.len) b = b2; }
  // keep only the part someone can walk along without bumping into anything
  const ok = [b.pts[0]]; let len = 0;
  for (let i = 1; i < b.pts.length; i++) { const [ax, az] = ok[ok.length - 1], [bx, bz] = b.pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 0.4)); let cut = -1;
    for (let j = 1; j <= n; j++) if (npcHit(ax + (bx - ax) * j / n, az + (bz - az) * j / n)) { cut = j - 1; break; }
    if (cut >= 0) { if (cut > 0) { ok.push([ax + (bx - ax) * cut / n, az + (bz - az) * cut / n]); len += L * cut / n; } break; }
    ok.push([bx, bz]); len += L; }
  return (w.beat = len > 4 ? { pts: ok, len } : null);
}
function beatPoint(b, d){ for (let i = 1; i < b.pts.length; i++) { const [ax, az] = b.pts[i - 1], [bx, bz] = b.pts[i], L = Math.hypot(bx - ax, bz - az); if (d <= L || i === b.pts.length - 1) { const k = L ? Math.min(1, d / L) : 0; return [ax + (bx - ax) * k, az + (bz - az) * k]; } d -= L; } return b.pts[0]; }
// where the timetable has them right now: up and down the beat with a rest at each end, or at the post
function guardWhere(w, h){
  const slot = GUARD_DAY.find(([a, b2]) => h >= a && h < b2), b = guardBeat(w);
  if (!slot || slot[2] !== 'patrol' || !b) return [w.lx, w.lz];
  const leg = b.len / GUARD_SPEED * 1000, cycle = 2 * (leg + GUARD_REST), t = (SNOW() + GUARD_NAMES.indexOf(w.rec.name) * 9173) % cycle;
  const d = t < GUARD_REST ? 0 : t < GUARD_REST + leg ? (t - GUARD_REST) / leg * b.len : t < 2 * GUARD_REST + leg ? b.len : b.len * (1 - (t - 2 * GUARD_REST - leg) / leg);
  return beatPoint(b, d);
}
// ----- the guards' day: two on the day watch, two on the night watch. Each sleeps in their bunk at the barracks, eats at the
// mess table, and walks the roads between there and their post. Everything comes from the clock, so every player sees the same.
const GUARD_SHIFT = { Osric: 'day', Bertram: 'day', Edda: 'night', Godwin: 'night' };
const GUARD_HOME = { Osric: { bunk: 67, seat: [-39.75, 72.4] }, Bertram: { bunk: 71.5, seat: [-36.25, 72.4] }, Edda: { bunk: 76, seat: [-39.75, 75] }, Godwin: { bunk: 80.5, seat: [-36.25, 75] } };
// [hour, what they set off to do (a route), what they do once there]
const GUARD_EVENTS = { day: [[0, 'sleep'], [6, 'bed2seat', 'eat'], [7.5, 'seat2post', 'duty'], [18.5, 'post2seat', 'eat'], [21, 'seat2bed', 'sleep']],
  night: [[0, 'duty'], [6, 'post2seat', 'eat'], [7.5, 'seat2bed', 'sleep'], [16.5, 'bed2seat', 'eat'], [18, 'seat2post', 'duty']] };
// their routes, worked out once at the start (all doors shut, the same for everyone): post to the barracks door to their seat, and seat to bunk
function guardRoutes(w){
  if (w.routes) return w.routes;
  const H = GUARD_HOME[w.rec.name], V = (x, z) => new THREE.Vector3(x, 0, z);
  const seat = H.seat, west = seat[0] < -38, sApp = [seat[0] + (west ? -1.6 : 1.6), seat[1]], bed = [-48.1, H.bunk], bApp = [-44.3, H.bunk];
  const path = (a, b) => findPath(V(a[0], a[1]), V(b[0], b[1])).map(q => [q.x, q.z]);
  const mk = pts => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; };
  const toSeat = [...path([w.lx, w.lz], [-38, 56.4]), [-38, 62.6], ...path([-38, 62.6], sApp), seat], toBed = [seat, ...path(sApp, bApp), bed];
  w.routes = { post2seat: mk(toSeat), seat2post: mk(toSeat.slice().reverse()), seat2bed: mk(toBed), bed2seat: mk(toBed.slice().reverse()), bed, seat, faceX: west ? 1 : -1 };
  return w.routes;
}
function routeAt(r, d){ for (let i = 1; i < r.pts.length; i++) if (d <= r.cum[i] || i === r.pts.length - 1) { const k = Math.min(1, (d - r.cum[i - 1]) / ((r.cum[i] - r.cum[i - 1]) || 1)), a = r.pts[i - 1], b = r.pts[i]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } return r.pts[0]; }
// what a guard is doing at this hour, and where
function guardState(w, h){
  const R = guardRoutes(w), ev = GUARD_EVENTS[GUARD_SHIFT[w.rec.name]]; let e = ev[0]; for (const x of ev) if (x[0] <= h) e = x;
  let mode = e[2] || e[1];
  if (e[2]) { const r = R[e[1]], d = (h - e[0]) * 3600 * GUARD_SPEED; if (d < r.len) return { mode: 'walk', at: routeAt(r, d), out: e[2] === 'duty' }; }
  return mode === 'sleep' ? { mode, at: R.bed } : mode === 'eat' ? { mode, at: R.seat } : { mode: 'duty', at: guardWhere(w, h) };
}
let ZZZ_MAT = null;
function zzzMat(){   // the floating Zs over a sleeper, drawn once and shared
  if (!ZZZ_MAT) { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const g2 = cv.getContext('2d'); g2.fillStyle = '#e8eefa'; g2.strokeStyle = '#2a3048'; g2.lineWidth = 3; g2.font = 'bold 26px Georgia';
    g2.strokeText('z', 8, 56); g2.fillText('z', 8, 56); g2.font = 'bold 34px Georgia'; g2.strokeText('Z', 30, 34); g2.fillText('Z', 30, 34); const tx2 = new THREE.CanvasTexture(cv); tx2.colorSpace = THREE.SRGBColorSpace; ZZZ_MAT = new THREE.SpriteMaterial({ map: tx2, transparent: true, depthWrite: false }); }
  return ZZZ_MAT; }
const GUARD_LIE = { y: 4.2, dz: 1.6 };   /* where a sleeping guard's figure goes, from their bunk's middle: up on the top deck, nudged towards the foot */
function updateGuard(w, talker, dt){
  const sp = w.sp, h = hourNow(), st = guardState(w, h), [tx, tz] = st.at, c = sp.userData.chibi;
  const asleep = st.mode === 'sleep', sitting = st.mode === 'eat';
  w.rec.asleep = asleep;
  if (w.lying) sp.position.z -= GUARD_LIE.dz;   // measure from where they really are, not from the lying-down offset
  let dx = tx - sp.position.x, dz = tz - sp.position.z, d = Math.hypot(dx, dz), moving = false;
  if (!(talker && !asleep) && d > 0.1) { if (d > 40) sp.position.set(tx, 0, tz); else { const sp2 = st.mode === 'walk' ? GUARD_SPEED * 1.15 : d > 2 ? 3 : GUARD_SPEED, step = Math.min(d, sp2 * dt); sp.position.x += dx / d * step; sp.position.z += dz / d * step; moving = step > 0.2 * dt; w.dx = dx; w.dz = dz; w.tick += dt * 60; } }   /* walking their route, or catching up after a chat */
  // what they wear: off duty the helmet, sword and shield go on the rack; after dark on duty, a torch instead of the shield
  const kit = asleep || sitting ? 'off' : guardDark(h) ? 'torch' : 'duty';
  if (w.kit !== kit) { w.kit = kit; w.dark = kit === 'torch'; const gear = w.rec.gear; if (gear) dressChibi(sp, kit === 'off' ? { ...gear, head: null, weapon: null, shield: null } : kit === 'torch' ? { ...gear, shield: 'Torch' } : gear); }
  // lying in the bunk, head on the pillow, with Zs floating up
  const lying = asleep && d < 0.3;
  sp.rotation.x = lying ? -Math.PI / 2 : 0; sp.position.y = lying ? GUARD_LIE.y : 0;   // on the top deck: a lying chibi is too tall for the gap under it
  if (lying) sp.position.z = tz + GUARD_LIE.dz;   // the feet towards the foot of the bunk, the head on the pillow
  if (lying && !w.zzz) { zzzMat(); if (!ZZZ_MAT) { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const g2 = cv.getContext('2d'); g2.fillStyle = '#e8eefa'; g2.strokeStyle = '#2a3048'; g2.lineWidth = 3; g2.font = 'bold 26px Georgia';
      g2.strokeText('z', 8, 56); g2.fillText('z', 8, 56); g2.font = 'bold 34px Georgia'; g2.strokeText('Z', 30, 34); g2.fillText('Z', 30, 34); const tx2 = new THREE.CanvasTexture(cv); tx2.colorSpace = THREE.SRGBColorSpace; ZZZ_MAT = new THREE.SpriteMaterial({ map: tx2, transparent: true, depthWrite: false }); }
    w.zzz = new THREE.Sprite(ZZZ_MAT.clone()); w.zzz.scale.set(0.9, 0.9, 1); scene.add(w.zzz); }
  if (w.zzz) { w.zzz.visible = lying; if (lying) { const k = (performance.now() / 2400 + GUARD_NAMES.indexOf(w.rec.name) * 0.3) % 1; w.zzz.position.set(tx + 0.3, 5.6 + k * 1.2, tz - 1.4 - k * 0.3); w.zzz.material.opacity = Math.sin(k * Math.PI); } }
  w.sitting = sitting && d < 0.3; w.lying = lying; w.rec.sitting = w.sitting; w.rec.chatAt = 'table';
  return moving;
}
