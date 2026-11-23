// ITAP Adventure quarry mockup: a working mining site south-west of the smithy.
// Paste right after `spawnMonster('goblin', 37, 30);` in the game's script, and widen the grass mask (GM.z1) to 96. It moves the existing ore rocks and the goblin here.
(() => {
  const QX = 12, QZ = 72;   // the middle of the quarry floor
  const R = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const add = (geo, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; town.add(o); return o; };
  const wood = mat(0x7a5530), darkWood = mat(0x4a3220), iron = mat(0x3a3a40);

  // level the ground where the quarry is dug out
  for (let i = 0; i < gp.count; i++) { const d = Math.hypot(gp.getX(i) - QX, gp.getZ(i) - QZ); if (d < 18) gp.setY(i, gp.getY(i) * Math.max(0, (d - 15) / 3) - 0.02); }
  gp.needsUpdate = true; groundGeo.computeVertexNormals();
  // the quarry floor: packed grey-brown earth and gravel, with a soft edge into the grass
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(128,112,92,1)'); grd.addColorStop(0.82, 'rgba(120,104,84,1)'); grd.addColorStop(1, 'rgba(120,104,84,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) { const x = R() * S, y = R() * S, d = Math.hypot(x - S / 2, y - S / 2); if (d > S * 0.46) continue;
    const c = 80 + R() * 90; g.fillStyle = `rgba(${c},${c * 0.94},${c * 0.86},.8)`; g.beginPath(); g.ellipse(x, y, 1 + R() * 4, 1 + R() * 3, R() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 0; i++) { g.strokeStyle = 'rgba(70,60,48,.35)'; g.lineWidth = 6 + R() * 8; g.beginPath(); const a = R() * 7; g.moveTo(S / 2, S / 2); g.lineTo(S / 2 + Math.cos(a) * S * 0.4, S / 2 + Math.sin(a) * S * 0.4); g.stroke(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const floor = add(new THREE.CircleGeometry(16, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }), QX, 0.04, QZ);
  floor.castShadow = false;
  // keep the grass off the quarry floor
  const baseMask = grassMaskTexture;
  grassMaskTexture = () => { const t = baseMask(); if (!t.quarry) { const c2 = t.image.getContext('2d');
    c2.fillStyle = '#000'; c2.beginPath(); c2.arc((QX - GM.x0) * GM.ppu, (QZ - GM.z0) * GM.ppu, 14.5 * GM.ppu, 0, 7); c2.fill(); t.needsUpdate = true; t.quarry = true; } return t; };

  // the cut rock face: stepped grey cliffs wrapping the south and west sides, like the hillside has been dug away
  const stones = [0x7a756c, 0x6a665e, 0x837d72, 0x5e5a53];
  for (let a = 0.15; a < 3.4; a += 0.16) {
    const ang = Math.PI * 0.25 + a;   // from south-east round to north-west
    for (let tier = 0; tier < 2; tier++) {
      const rr = 14.5 + tier * 3.2, h = (tier ? 6.5 : 3.6) + R() * 1.6;
      const x = QX + Math.cos(ang) * rr, z = QZ + Math.sin(ang) * rr;
      const b = add(new THREE.BoxGeometry(3.4 + R(), h, 2.6 + R()), mat(stones[(R() * 4) | 0]), x, h / 2 - 0.2, z, -ang + (R() - 0.5) * 0.3);
      b.rotation.z = (R() - 0.5) * 0.12;
      if (!tier) solidBoxes.push({ x0: x - 1.6, x1: x + 1.6, z0: z - 1.6, z1: z + 1.6 });
      if (R() < 0.35) add(new THREE.DodecahedronGeometry(0.5 + R() * 0.6, 0), mat(stones[(R() * 4) | 0]), x + (R() - 0.5) * 2, h + 0.1, z + (R() - 0.5) * 2);
    }
  }
  // tool marks: a few pale freshly-cut faces on the cliff
  for (let i = 0; i < 6; i++) { const ang = Math.PI * 0.5 + i * 0.45, x = QX + Math.cos(ang) * 13.1, z = QZ + Math.sin(ang) * 13.1;
    add(new THREE.BoxGeometry(1.6, 1.8, 0.1), mat(0x9c968a), x, 1.6 + R(), z, -ang + Math.PI / 2); }

  // the mine entrance in the west face, shored up with timber
  const ang = Math.PI * 1.05, ex = QX + Math.cos(ang) * 13.4, ez = QZ + Math.sin(ang) * 13.4, er = -ang + Math.PI / 2;
  const ent = new THREE.Group(); ent.position.set(ex, 0, ez); ent.rotation.y = er; town.add(ent);
  const put = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; ent.add(o); return o; };
  put(new THREE.BoxGeometry(2.6, 3, 0.2), new THREE.MeshBasicMaterial({ color: 0x050403 }), 0, 1.5, -0.6);
  put(new THREE.BoxGeometry(0.35, 3.3, 0.35), wood, -1.45, 1.65, 0); put(new THREE.BoxGeometry(0.35, 3.3, 0.35), wood, 1.45, 1.65, 0);
  put(new THREE.BoxGeometry(3.6, 0.4, 0.45), wood, 0, 3.35, 0);
  put(new THREE.BoxGeometry(0.25, 2.2, 0.25), darkWood, -1.45, 1.1, -1.1); put(new THREE.BoxGeometry(0.25, 2.2, 0.25), darkWood, 1.45, 1.1, -1.1);
  const lanternGlow = new THREE.MeshStandardMaterial({ color: 0xffd08a, emissive: 0xffa040, emissiveIntensity: 1.2 }); GLOW_MATS.push(lanternGlow);
  put(new THREE.BoxGeometry(0.28, 0.36, 0.28), lanternGlow, 1.9, 2.7, 0.15); LIGHT_SPOTS.push([ex, 2.7, ez]);

  // rails from the mine mouth across the floor to the loading area, with a minecart full of ore
  const rails = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; rails.push(new THREE.Vector3(ex + (QX + 4 - ex) * t, 0.08, ez + (QZ + 3 - ez) * t + Math.sin(t * 3.14) * 2.5)); }
  const curve = new THREE.CatmullRomCurve3(rails);
  const pts = curve.getSpacedPoints(30);
  pts.forEach((p, i) => { if (i === pts.length - 1) return; const q = pts[i + 1], ry = Math.atan2(q.x - p.x, q.z - p.z);
    add(new THREE.BoxGeometry(1.3, 0.1, 0.25), darkWood, p.x, 0.07, p.z, ry + Math.PI / 2);
    for (const s of [-0.45, 0.45]) { const L = p.distanceTo(q), mx = (p.x + q.x) / 2 + Math.cos(ry) * s, mz = (p.z + q.z) / 2 - Math.sin(ry) * s;
      add(new THREE.BoxGeometry(0.08, 0.1, L + 0.02), iron, mx, 0.15, mz, ry); } });
  const cp = curve.getPointAt(0.62), cq = curve.getPointAt(0.66), cry = Math.atan2(cq.x - cp.x, cq.z - cp.z);
  const cart = new THREE.Group(); cart.position.set(cp.x, 0.2, cp.z); cart.rotation.y = cry; town.add(cart); solidBoxes.push({ x0: cp.x - 1, x1: cp.x + 1, z0: cp.z - 1, z1: cp.z + 1 });
  const cput = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; cart.add(o); return o; };
  cput(new THREE.BoxGeometry(1.2, 0.8, 1.7), mat(0x5a5048), 0, 0.65, 0);
  cput(new THREE.BoxGeometry(1.26, 0.12, 1.76), iron, 0, 1.05, 0);
  for (const [x, z] of [[-0.62, -0.5], [0.62, -0.5], [-0.62, 0.5], [0.62, 0.5]]) cput(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 10).rotateZ(Math.PI / 2), iron, x, 0.2, z);
  for (let i = 0; i < 9; i++) cput(new THREE.IcosahedronGeometry(0.22, 0), mat(i % 3 ? 0x6e6a62 : 0xc2652b), (R() - 0.5) * 0.8, 1.1 + R() * 0.2, (R() - 0.5) * 1.2);

  // a timber hoist with a rope and bucket by the loading area
  const hx = QX + 6.5, hz = QZ - 3;
  add(new THREE.BoxGeometry(0.4, 5.5, 0.4), wood, hx, 2.75, hz); solidAt(hx, hz, 0.4);
  const boom = add(new THREE.BoxGeometry(0.3, 0.3, 4), wood, hx, 5.3, hz + 1.6); boom.rotation.x = 0.12;
  add(new THREE.BoxGeometry(0.25, 2.6, 0.25), wood, hx, 4.1, hz + 0.9).rotation.x = -0.75;
  add(new THREE.CylinderGeometry(0.025, 0.025, 3.2, 4), mat(0xc8b48a), hx, 3.6, hz + 3.4);
  add(new THREE.CylinderGeometry(0.4, 0.32, 0.55, 10), wood, hx, 1.75, hz + 3.4);
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 10).rotateZ(Math.PI / 2), darkWood, hx, 1.2, hz - 0.5);   // the winch drum

  // heaps of mined ore and spoil
  const heap = (x, z, cols, n, r) => { for (let i = 0; i < n; i++) { const a = R() * 7, d = R() * r, y = (1 - d / r) * r * 0.55;
    add(new THREE.IcosahedronGeometry(0.22 + R() * 0.2, 0), mat(cols[(R() * cols.length) | 0]), x + Math.cos(a) * d, 0.1 + y, z + Math.sin(a) * d); } solidAt(x, z, r * 0.8); };
  heap(QX + 9, QZ + 1.5, [0xc2652b, 0xd9773a, 0x6e6a62], 40, 1.4);
  heap(QX + 9.2, QZ + 5, [0xb8c4cc, 0xdfe6ea, 0x6e6a62], 40, 1.4);
  heap(QX - 3, QZ + 9.5, [0x6e6a62, 0x5c5850, 0x837d72], 60, 2.2);   // spoil
  // supplies at the quarry's mouth, where the path comes in
  crate(QX + 8, QZ - 6.5, 0.3); crate(QX + 9.1, QZ - 6, -0.2); barrel(QX + 3, QZ - 8);
  // a rack of spare pickaxes
  add(new THREE.BoxGeometry(2, 0.15, 0.15), wood, QX - 1, 1.3, QZ - 9.2); for (const x of [-1.9, -0.1]) add(new THREE.BoxGeometry(0.15, 1.4, 0.15), wood, QX + x, 0.7, QZ - 9.2);
  for (let i = 0; i < 3; i++) { const px = QX - 1.6 + i * 0.6; add(new THREE.BoxGeometry(0.07, 1.2, 0.07), mat(0x9a6a3a), px, 0.75, QZ - 9.05).rotation.z = 0.15;
    add(new THREE.BoxGeometry(0.6, 0.08, 0.08), iron, px + 0.09, 1.32, QZ - 9.0).rotation.z = 0.25; }
  lamp(QX + 4.5, QZ - 9.5); lamp(QX - 8, QZ + 2);
  // the road in from the smithy road
  roadPath([[26, 54], [22, 60], [QX + 5, QZ - 11], [QX + 3, QZ - 7]]);

  // move the ore rocks onto the quarry floor: copper along the west face, tin along the south
  const spots = { copper: [[QX - 8, QZ - 3], [QX - 9, QZ + 2], [QX - 6.5, QZ + 6], [QX - 3, QZ - 6]], tin: [[QX - 2, QZ + 9], [QX + 3, QZ + 9.5], [QX + 1, QZ - 5], [QX + 4.5, QZ + 5.5]] };
  const used = { copper: 0, tin: 0 };
  for (const rec of treeRecs) if (rec.kind === 'rock') { const p = spots[rec.ore][used[rec.ore]++]; if (!p) continue;
    const dx = p[0] - rec.x, dz = p[1] - rec.z; rec.x = p[0]; rec.z = p[1]; rec.g.position.set(p[0], 0, p[1]); rec.stump.position.x += dx; rec.stump.position.z += dz;
    rec.box.x0 += dx; rec.box.x1 += dx; rec.box.z0 += dz; rec.box.z1 += dz; }
  // and the goblin, lurking at the quarry's eastern edge
  for (const m of MONSTERS) { m.x = m.home[0] = QX + 10; m.z = m.home[1] = QZ + 9; m.g.position.set(m.x, 0, m.z); m.wander.tx = m.x; m.wander.tz = m.z; }
  window.QUARRY = { QX, QZ };
})();
