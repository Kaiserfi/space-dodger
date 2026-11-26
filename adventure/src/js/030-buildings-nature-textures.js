// ----- buildings -----
// a textured material for a building part: the texture repeats over the part, and the colour tints it
function texMat(tex, rx, ry, color = 0xffffff){
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry);
  return new THREE.MeshStandardMaterial({ map: t, color, flatShading: true, roughness: 0.95 });
}
// the houses: hollow walls with a doorway in the front, a floor, and a roof that lifts off while you are in.
// They are built in their own units and scaled to the hall; rot turns a house by a quarter or half turn.
const houses = [];
const HOUSE_SIZE = 2;   // houses are twice the size of the first ones
// a cast-iron kitchen range (houses and the hall): a black stove with a glowing firebox behind a grate, an oven door with a
// brass knob, two hotplates with a pot and a frying pan, a towel rail and a chimney pipe. Its front faces +z; add(geo, material,
// x, y, z) places a part; returns the stove's body, the part players click to cook
let STOVE_M = null;
function stoveParts(add, x, z, pipeTop = 3.2){
  const M = STOVE_M || (STOVE_M = { iron: new THREE.MeshStandardMaterial({ color: 0x2e2f33, roughness: 0.55, metalness: 0.5, flatShading: true }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc8a048, roughness: 0.35, metalness: 0.7 }), door: mat(0x3a3b40), plate: mat(0x45464c), pot: mat(0x5a5e66), lid: mat(0x6a6e76), soot: mat(0x1a1410) });
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r1, r2, h, n = 14) => new THREE.CylinderGeometry(r1, r2, h, n), f = z + 0.65;
  const body = add(B(2.6, 1.3, 1.3), M.iron, x, 0.75, z); add(B(2.8, 0.12, 1.45), M.iron, x, 1.46, z);
  for (const s of [-1, 1]) for (const t of [-1, 1]) add(B(0.16, 0.12, 0.16), M.iron, x + s * 1.15, 0.06, z + t * 0.5);
  add(B(1.0, 0.8, 0.06), M.door, x + 0.55, 0.8, f + 0.02); add(C(0.07, 0.07, 0.14, 8).rotateX(Math.PI / 2), M.brass, x + 0.95, 0.85, f + 0.07);
  add(B(0.8, 0.5, 0.06), M.soot, x - 0.65, 0.75, f + 0.01); add(B(0.6, 0.3, 0.05), fireMat, x - 0.65, 0.68, f + 0.04);
  for (let i = 0; i < 4; i++) add(B(0.04, 0.5, 0.05), M.iron, x - 0.95 + i * 0.2, 0.75, f + 0.05);
  for (const s of [-1, 1]) add(C(0.36, 0.36, 0.05, 16), M.plate, x + s * 0.6, 1.55, z);
  add(C(0.3, 0.26, 0.45), M.pot, x - 0.6, 1.8, z); add(C(0.31, 0.31, 0.05), M.lid, x - 0.6, 2.04, z);
  add(C(0.32, 0.28, 0.1), M.iron, x + 0.6, 1.63, z); add(B(0.6, 0.05, 0.08), M.iron, x + 1.2, 1.66, z);
  const pipe = pipeTop - 1.5; add(C(0.16, 0.16, pipe, 10), M.iron, x + 0.9, 1.5 + pipe / 2, z - 0.45); add(B(2.7, 0.05, 0.05), M.brass, x, 1.25, f + 0.07);
  return body;
}
function house(x, z, w, d, wall, roofCol, rot = 0, furnish = null){
  const g = new THREE.Group();
  const S = HOUSE_SIZE; w = w * S; d = d * S;
  const t = 0.4, dw = 1.8 * S;   // wall thickness and doorway width, in the house's own units
  const walls = [[0, -d / 2, w / 2, t / 2], [-w / 2, 0, t / 2, d / 2], [w / 2, 0, t / 2, d / 2],
                 [-(w + dw) / 4, d / 2, (w - dw) / 4, t / 2], [(w + dw) / 4, d / 2, (w - dw) / 4, t / 2]];   // back, sides, front either side of the doorway
  // cream plaster walls tinted a little towards the house's colour, framed in dark timber, on a low stone footing
  const plasterCol = new THREE.Color(wall).lerp(new THREE.Color(0xf4ead4), 0.72), timber = 0x4a2e18, WH = 3 * S;
  walls.forEach(([cx, cz, hx, hz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(hx * 2, WH, hz * 2), texMat(plasterTex, Math.max(1, hx / 2), 1.5, plasterCol));
    m.position.set(cx, WH / 2, cz); g.add(m);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(hx * 2 + 0.3, 0.7, hz * 2 + 0.3), texMat(wallStone, Math.max(1, hx / 1.5), 0.5, 0x9a948a));
    foot.position.set(cx, 0.35, cz); g.add(foot);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(dw, 0.8 * S, t), texMat(plasterTex, 1, 1, plasterCol)); lintel.position.set(0, 2.6 * S, d / 2); g.add(lintel);
  const deco = (geo, col, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, typeof col === 'number' ? mat(col) : col); m.position.set(x, y, z); m.rotation.y = ry; m.userData.deco = true; g.add(m); return m; };
  const B = (a, b2, c2) => new THREE.BoxGeometry(a, b2, c2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) deco(B(0.6, WH + 0.2, 0.6), timber, sx * w / 2, WH / 2, sz * d / 2);   // corner posts
  for (const sz of [-1, 1]) deco(B(w + 0.4, 0.4, t + 0.2), timber, 0, WH - 0.1, sz * d / 2);   // top beams
  for (const sx of [-1, 1]) deco(B(t + 0.2, 0.4, d + 0.4), timber, sx * w / 2, WH - 0.1, 0);
  for (const sx of [-1, 1]) deco(B(0.4, 2.3 * S, t + 0.25), timber, sx * (dw / 2 + 0.2), 1.15 * S, d / 2);   // the door frame
  deco(B(dw + 0.8, 0.4, t + 0.25), timber, 0, 2.3 * S, d / 2);
  // windows: a dark frame, warm glass, a cross bar, painted shutters and a flower box
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0x7a5a20, emissiveIntensity: 0.6, roughness: 0.3 }); GLOW_MATS.push(glassMat);
  const shutterCol = new THREE.Color(roofCol).lerp(new THREE.Color(0x3a5a7a), 0.35).getHex();
  const flowerCols = [0xe8506a, 0xf4d03f, 0xffffff, 0xb070e0];
  function windowAt(x, z, side){   // side: 'z' for the front and back walls, 'x' for the side walls; the sign of x or z says which face
    const out = side === 'z' ? Math.sign(z) : Math.sign(x), ry = side === 'z' ? 0 : Math.PI / 2, y = 1.75 * S;
    const ox = side === 'z' ? 1 : 0, oz = side === 'z' ? 0 : 1;   // along the wall
    const nx = side === 'z' ? 0 : out, nz = side === 'z' ? out : 0;   // out of the wall
    deco(B(2.1, 1.9, t + 0.2), timber, x, y, z, ry);
    deco(B(1.7, 1.5, t + 0.26), glassMat, x, y, z, ry);
    deco(B(0.16, 1.5, t + 0.3), timber, x, y, z, ry); deco(B(1.7, 0.16, t + 0.3), timber, x, y, z, ry);
    for (const s2 of [-1, 1]) deco(B(0.85, 1.9, 0.1), shutterCol, x + ox * s2 * 1.5 + nx * (t / 2 + 0.1), y, z + oz * s2 * 1.5 + nz * (t / 2 + 0.1), ry);
    deco(B(2.1, 0.4, 0.55), 0x6a4426, x + nx * (t / 2 + 0.3), y - 1.15, z + nz * (t / 2 + 0.3), ry);
    for (let i = 0; i < 5; i++) deco(B(0.26, 0.26, 0.26), flowerCols[i % 4], x + ox * (-0.8 + i * 0.4) + nx * (t / 2 + 0.3), y - 0.85, z + oz * (-0.8 + i * 0.4) + nz * (t / 2 + 0.3));
  }
  if ((w - dw) / 2 > 3.2) for (const s2 of [-1, 1]) windowAt(s2 * (w + dw) / 4, d / 2, 'z');   // the front, either side of the door
  windowAt(-w / 4, -d / 2, 'z');                                                            // the back
  for (const s2 of [-1, 1]) windowAt(s2 * w / 2, d / 6, 'x');                               // both sides
  // the door fills the doorway: it hangs from a pivot on the left jamb and swings open when clicked
  const doorPivot = new THREE.Group(); doorPivot.position.set(-dw / 2, 0, d / 2); g.add(doorPivot);
  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(dw, 2.2 * S, 0.15), texMat(doorPlanks, 1, 1, 0x8a5a2a));
  doorLeaf.position.set(dw / 2, 1.1 * S, 0); doorPivot.add(doorLeaf);
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.12), mat(0xd9b44a));
  knob.position.set(dw / 2 - 0.25, 0, 0.14); doorLeaf.add(knob);   // on the door face, near the free edge (positions are relative to the door's centre)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - t, d - t).rotateX(-Math.PI / 2), texMat(floorWood, 2, 2, 0xc8a070));
  floor.position.y = 0.06; g.add(floor);
  // a pitched roof: two shingled slopes that overhang the walls, plaster gable ends, a ridge beam and a stone chimney with smoke
  const roof = new THREE.Group(); g.add(roof);
  const ov = 1.2, half = d / 2 + ov, rise = d * 0.42, slope = Math.hypot(half, rise), ang = Math.atan2(rise, half);
  for (const sz of [-1, 1]) {
    const sl = new THREE.Mesh(B(w + ov * 2, 0.35, slope), texMat(roofTex, Math.max(2, w / 3), Math.max(2, slope / 3), roofCol));
    sl.position.set(0, WH + rise / 2 - 0.1, sz * half / 2); sl.rotation.x = sz * ang; roof.add(sl);
  }
  const gableShape = new THREE.Shape(); gableShape.moveTo(-d / 2, 0); gableShape.lineTo(d / 2, 0); gableShape.lineTo(0, rise * (d / 2) / half); gableShape.closePath();
  for (const sx of [-1, 1]) {
    const gm = new THREE.Mesh(new THREE.ExtrudeGeometry(gableShape, { depth: t, bevelEnabled: false }), texMat(plasterTex, 0.25, 0.25, plasterCol));
    gm.rotation.y = Math.PI / 2; gm.position.set(sx * w / 2 - t / 2, WH, 0); roof.add(gm);
    const post = new THREE.Mesh(B(0.35, rise * (d / 2) / half, 0.35), mat(timber)); post.position.set(sx * (w / 2 + 0.05), WH + rise * (d / 2) / half / 2, 0); roof.add(post);
  }
  const ridge = new THREE.Mesh(B(w + ov * 2 + 0.2, 0.45, 0.6), mat(0x3a2414)); ridge.position.set(0, WH + rise + 0.05, 0); roof.add(ridge);
  const chimney = new THREE.Mesh(B(1.3, rise + 1.6, 1.3), texMat(wallStone, 1, 2, 0x8a847a)); chimney.position.set(w / 2 - 2, WH + (rise + 1.6) / 2, -d / 4); roof.add(chimney);
  const cap = new THREE.Mesh(B(1.6, 0.3, 1.6), mat(0x6a645a)); cap.position.set(w / 2 - 2, WH + rise + 1.7, -d / 4); roof.add(cap);
  const smoke = [];
  for (let i = 0; i < 4; i++) { const pf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, transparent: true, opacity: 0.5, depthWrite: false, roughness: 1 }));
    pf.userData = { shadowSet: true, base: new THREE.Vector3(w / 2 - 2, WH + rise + 2.1, -d / 4), ph: i / 4 }; roof.add(pf); smoke.push(pf); }
  const k = HALL_SCALE, c = Math.cos(rot), sn = Math.sin(rot);
  g.scale.setScalar(k); g.position.set(x, 0, z); g.rotation.y = rot; town.add(g);
  const toWorld = (lx, lz) => ({ x: x + (lx * c + lz * sn) * k, z: z + (-lx * sn + lz * c) * k });
  walls.forEach(([cx, cz, hx, hz]) => {
    const p = toWorld(cx, cz);
    const ax = (Math.abs(c) * hx + Math.abs(sn) * hz) * k, az = (Math.abs(sn) * hx + Math.abs(c) * hz) * k;
    solidBoxes.push({ x0: p.x - ax, x1: p.x + ax, z0: p.z - az, z1: p.z + az });
  });
  const hw = (Math.abs(c) * w / 2 + Math.abs(sn) * d / 2) * k, hd = (Math.abs(sn) * w / 2 + Math.abs(c) * d / 2) * k;
  const h = { roof, smoke, x, z, hw, hd, k, toWorld, door: toWorld(0, d / 2 + 0.6) };
  LIGHT_SPOTS.push([x, 2.6, z], [h.door.x, 2.4, h.door.z]);   // light spills from inside the house and out of the door   // the door is just outside the front
  houses.push(h);
  // the closed door blocks the doorway; opening it removes that block
  const dc = toWorld(0, d / 2);
  const dax = (Math.abs(c) * dw / 2 + Math.abs(sn) * t / 2) * k, daz = (Math.abs(sn) * dw / 2 + Math.abs(c) * t / 2) * k;
  const doorRec = { kind: 'door', x: dc.x, z: dc.z, s: 0.6, state: 'standing', pivot: doorPivot, leaf: doorLeaf, open: false,
    box: { x0: dc.x - dax, x1: dc.x + dax, z0: dc.z - daz, z1: dc.z + daz } };
  doorLeaf.userData = { action: 'Open', name: 'Door', rec: doorRec };
  h.doorRec = doorRec;
  doorRec.outside = h.door;
  doorRec.inside = toWorld(0, d / 2 - 1.3);   // a spot just inside the doorway
  trees.push(doorLeaf);
  solidBoxes.push(doorRec.box);
  if (furnish) furnish(g, h);
  if (!g.userData.workshop) furnishHome(g, h, w, d, t, rot);
  return h;
}
// lift the roof off a house while the adventurer is inside, so the inside can be seen
function updateHouses(){
  const t = performance.now() / 1000;
  for (const h of houses) {
    h.roof.visible = !(Math.abs(hero.position.x - h.x) < h.hw && Math.abs(hero.position.z - h.z) < h.hd);
    for (const pf of h.smoke) {   // chimney smoke drifts up, grows and fades, then starts again
      const k = (t * 0.18 + pf.userData.ph) % 1;
      pf.position.copy(pf.userData.base).add(new THREE.Vector3(Math.sin(t + pf.userData.ph * 6) * 0.4 + k * 1.2, k * 4.5, 0));
      pf.scale.setScalar(0.5 + k * 1.1); pf.material.opacity = 0.4 * (1 - k) * Math.min(1, k * 5);
    }
  }
}
// the inside of a home: a bed, a fireplace, a table and stools, a cupboard, a rug and a barrel.
// Each piece blocks walking; the middle of the room and the way in from the door stay clear.
function furnishHome(g, h, w, d, t, rot){
  const room = new THREE.Group(); g.add(room);
  const c = Math.cos(rot), sn = Math.sin(rot);
  const put = (geo, col, x, y, z) => { const m = new THREE.Mesh(geo, typeof col === 'number' ? mat(col) : col); m.position.set(x, y, z); room.add(m); return m; };
  const block = (cx, cz, hx, hz) => { const p = h.toWorld(cx, cz), ax = (Math.abs(c) * hx + Math.abs(sn) * hz) * h.k, az = (Math.abs(sn) * hx + Math.abs(c) * hz) * h.k; solidBoxes.push({ x0: p.x - ax, x1: p.x + ax, z0: p.z - az, z1: p.z + az }); };
  const B = (a, b, c2) => new THREE.BoxGeometry(a, b, c2);
  const wood = 0x7a5232, dark = 0x4a2e18, L = -w / 2 + t / 2, R = w / 2 - t / 2, BK = -d / 2 + t / 2;
  // the bed, in the back left corner: a frame, a straw mattress, a blanket, a pillow and a headboard
  const bx = L + 1.5, bz = BK + 2.1;
  put(B(2.6, 0.7, 3.8), wood, bx, 0.45, bz); put(B(2.4, 0.3, 3.6), 0xe8dcb8, bx, 0.95, bz);
  put(B(2.5, 0.18, 2.4), [0x8a3a3a, 0x3a5a8a, 0x4a7a3a, 0x7a4a8a][houses.length % 4], bx, 1.15, bz + 0.6);
  put(B(1.6, 0.3, 0.8), 0xf4f0e6, bx, 1.2, bz - 1.3); put(B(2.6, 1.6, 0.3), dark, bx, 1.0, BK + 0.15);
  block(bx, bz, 1.3, 1.9);
  h.bed = h.toWorld(bx, bz); h.bedTop = 1.25 * h.k;   // for whoever sleeps in it
  // the kitchen range against the back wall, its chimney pipe going up behind it
  const fx = R - 2.2;
  const stove = stoveParts((geo, m, px, py, pz) => put(geo, m, px, py, pz), fx, BK + 0.8);
  block(fx, BK + 0.7, 1.4, 0.8);
  { const fp = h.toWorld(fx, BK + 1.4), hearth = stove;
    hearth.userData = { action: 'Cook', name: 'Range', rec: { kind: 'range', x: fp.x, z: fp.z, s: 0.9, state: 'standing' } }; trees.push(hearth); }
  // a table and two stools on the right, with a candle and a loaf on it
  const tx = R - 2.4, tz = 0.8;
  put(B(2.6, 0.2, 1.6), wood, tx, 1.5, tz);
  for (const ix of [-1, 1]) for (const iz of [-1, 1]) put(B(0.2, 1.4, 0.2), dark, tx + ix * 1.1, 0.75, tz + iz * 0.6);
  for (const iz of [-1, 1]) { put(new THREE.CylinderGeometry(0.4, 0.4, 0.15, 8), wood, tx - 0.6, 0.95, tz + iz * 1.5); put(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 5), dark, tx - 0.6, 0.45, tz + iz * 1.5); }
  put(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 6), 0xf4eedc, tx + 0.6, 1.78, tz); put(B(0.12, 0.16, 0.12), fireMat, tx + 0.6, 2.02, tz);
  put(new THREE.DodecahedronGeometry(0.35, 0), 0xc8904a, tx - 0.3, 1.75, tz - 0.2).scale.set(1.4, 0.7, 1);
  block(tx, tz, 1.3, 0.8);
  // a cupboard against the left wall, with jars and pots on its shelves
  const cx2 = L + 0.7, cz2 = 1.6;
  put(B(1.1, 3.0, 2.4), wood, cx2, 1.5, cz2);
  for (const y of [1.1, 2.0]) { put(B(1.15, 0.12, 2.3), dark, cx2 + 0.02, y, cz2);
    for (let i = 0; i < 3; i++) put(new THREE.CylinderGeometry(0.18, 0.2, 0.4, 7), [0x6a8aa8, 0xc87a4a, 0xd8c890][i], cx2 + 0.35, y + 0.27, cz2 - 0.7 + i * 0.7); }
  block(cx2, cz2, 0.6, 1.2);
  // a barrel by the door, and a rug in the middle of the floor
  const rx = L + 1.3, rz = d / 2 - 1.6;
  put(new THREE.CylinderGeometry(0.7, 0.6, 1.5, 10), 0x8a5a2a, rx, 0.75, rz);
  for (const y of [0.3, 1.2]) put(new THREE.CylinderGeometry(0.72, 0.72, 0.1, 10), 0x3a3a40, rx, y, rz);
  block(rx, rz, 0.7, 0.7);
  const rug = put(new THREE.PlaneGeometry(4.2, 3.0).rotateX(-Math.PI / 2), 0x8a3a3a, -0.6, 0.08, -0.4);
  rug.material = new THREE.MeshStandardMaterial({ color: [0x8a3a3a, 0x3a5a7a, 0x6a5a2a, 0x5a3a6a][houses.length % 4], roughness: 1 });
  const rug2 = put(new THREE.PlaneGeometry(3.6, 2.4).rotateX(-Math.PI / 2), 0xd8c08a, -0.6, 0.09, -0.4);
}
function smithy(x, z){
  house(x, z, 4.5, 4, 0x9a6a44, 0x7a2e2e, -0.4);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3, 0.7), mat(0x5a5a62));
  chimney.position.set(x + 1.4, 4.2, z - 1.2); town.add(chimney);
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), mat(0x6a7078));
  anvil.position.set(x + 2.6, 0.6, z + 1.8); town.add(anvil);
}
// the keep: a walled corner with four towers
function keep(x, z){
  const wallMat = mat(0x8a8a90);
  [[-4, -4, 8, 0.6], [-4, 4, 8, 0.6]].forEach(([dx, dz, w]) => {}); // (walls below)
  const sides = [[0, -4, 8.4, 0.6], [0, 4, 8.4, 0.6], [-4, 0, 0.6, 8.4], [4, 0, 0.6, 8.4]];
  sides.forEach(([dx, dz, w, d]) => { const s = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), wallMat); s.position.set(x + dx, 1.1, z + dz); town.add(s); });
  [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([dx, dz]) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 4, 6), wallMat); t.position.set(x + dx, 2, z + dz); town.add(t);
    const r = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.4, 6), mat(0x4a3a6a)); r.position.set(x + dx, 4.7, z + dz); town.add(r);
  });
  const gate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 1.4), mat(0x4a2e16)); gate.position.set(x + 4.05, 0.8, z); town.add(gate);
}
// the village well: a round stone wall with dark water inside, two posts holding a winch with a rope and bucket, and a shingled roof
function well(x, z){
  const g = new THREE.Group();
  const stone = texMat(wallStone, 4, 1, 0xb8b2a6), wood = mat(0x6b4a2a), darkWood = mat(0x4a3018);
  // the stone wall: an outer and inner face, a capstone ring on top, and dark water a little way down
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.85, 16, 1, true), stone); outer.position.y = 0.425; g.add(outer);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.85, 16, 1, true), texMat(wallStone, 3, 1, 0x6a645a)); inner.material.side = THREE.BackSide; inner.position.y = 0.425; g.add(inner);
  const cap = new THREE.Mesh(new THREE.RingGeometry(0.72, 1.02, 16).rotateX(-Math.PI / 2), mat(0x9a948a)); cap.position.y = 0.86; g.add(cap);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.87, 0.09, 6, 16).rotateX(Math.PI / 2), mat(0x8a847a)); rim.position.y = 0.88; g.add(rim);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.74, 16).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x1f4a66, roughness: 0.1, metalness: 0.3, emissive: 0x06141e })); water.position.y = 0.35; g.add(water);
  // the posts, the crossbeam and the winch with its crank
  for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.9, 0.14), wood); post.position.set(sx * 0.88, 1.5, 0); g.add(post); }
  const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.6, 10).rotateZ(Math.PI / 2), darkWood); winch.position.y = 1.75; g.add(winch);
  const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.06), darkWood); crankArm.position.set(1.0, 1.62, 0); g.add(crankArm);
  const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 6).rotateZ(Math.PI / 2), darkWood); crank.position.set(1.1, 1.48, 0); g.add(crank);
  // the rope wound on the winch, hanging down to a bucket that sits on the rim
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.4, 10).rotateZ(Math.PI / 2), mat(0xc8b07a)); coil.position.y = 1.75; g.add(coil);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 5), mat(0xc8b07a)); rope.position.set(0, 1.37, 0.14); g.add(rope);
  const bucket = new THREE.Group(); bucket.position.set(0, 0.95, 0.14); g.add(bucket);
  const pail = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.3, 10), mat(0x8a5a2a)); pail.position.y = 0.04; bucket.add(pail);
  for (const y of [-0.06, 0.14]) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(y > 0 ? 0.2 : 0.17, 0.015, 4, 12).rotateX(Math.PI / 2), mat(0x3a3a40)); hoop.position.y = y; bucket.add(hoop); }
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 4, 12, Math.PI), mat(0x3a3a40)); bail.position.y = 0.19; bucket.add(bail);
  // a peaked roof of two shingled slopes on a ridge beam
  const roofMatW = new THREE.MeshStandardMaterial({ map: roofTex, color: 0xb04a3a, flatShading: true, side: THREE.DoubleSide });
  for (const sz of [-1, 1]) {
    const slope = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 0.95), roofMatW);
    slope.position.set(0, 2.68, sz * 0.36); slope.rotation.x = sz * 0.62; g.add(slope);
  }
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.1), darkWood); ridge.position.y = 2.98; g.add(ridge);
  for (const sx of [-1, 1]) { const gable = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), wood); gable.position.set(sx * 0.88, 2.65, 0); g.add(gable); }
  g.scale.setScalar(HALL_SCALE);   // the same scale as the spawn hall
  g.position.set(x, 0, z); g.rotation.y = 0.5; town.add(g);
}
// market stalls
function stall(x, z, col){
  const g = new THREE.Group(), wood = 0x7a5a2a;
  const P = (geo, c, px, py, pz) => { const m = new THREE.Mesh(geo, mat(c)); m.position.set(px, py, pz); g.add(m); return m; };
  P(new THREE.BoxGeometry(3.2, 1.2, 1.6), wood, 0, 0.6, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P(new THREE.BoxGeometry(0.16, 3.2, 0.16), 0x5a3a1e, sx * 1.5, 1.6, sz * 0.7);
  for (let i = 0; i < 6; i++) { const st = P(new THREE.BoxGeometry(3.6 / 6, 0.08, 2.2), i % 2 ? col : 0xf0ead8, -1.5 + i * 0.6, 3.3, 0); st.rotation.x = 0.18; }   // a striped awning
  for (let i = 0; i < 7; i++) P(new THREE.DodecahedronGeometry(0.18, 0), [0xd84a3a, 0xe8b030, 0x6aa83a, 0xc87a3a][i % 4], -1.2 + i * 0.4, 1.35, (i % 2) * 0.4 - 0.2);   // goods
  P(new THREE.BoxGeometry(0.8, 0.5, 0.6), 0x9a7040, 1.0, 1.45, -0.3);
  g.position.set(x, 0, z); town.add(g);
}
const solidAt = (x, z, hx, hz = hx) => solidBoxes.push({ x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz });   // a prop you walk around
function bench(x, z, ry){
  solidAt(x, z, 1.4, 1.4);
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; town.add(g);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.7), mat(0x8a6038)); seat.position.y = 0.6; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 0.12), mat(0x8a6038)); back.position.set(0, 1.05, 0.32); g.add(back);
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.6), mat(0x5a3a1e)); leg.position.set(sx * 1.1, 0.3, 0); g.add(leg); }
}
function signpost(x, z){
  solidAt(x, z, 0.4);
  const g = new THREE.Group(); g.position.set(x, 0, z); town.add(g);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 0.22), mat(0x5a3a1e)); post.position.y = 1.7; g.add(post);
  [[2.9, 0.2], [2.5, 2.2], [2.1, -2.4]].forEach(([y, ry]) => { const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.36, 0.08), mat(0xb08a58)); arm.geometry.translate(0.7, 0, 0); arm.position.y = y; arm.rotation.y = ry; g.add(arm);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 3), mat(0xb08a58)); tip.rotation.z = -Math.PI / 2; tip.position.set(1.55, 0, 0); arm.add(tip); });
}
const lampGlass = new THREE.MeshStandardMaterial({ color: 0xffd070, emissive: 0xffb040, emissiveIntensity: 1.3 });
GLOW_MATS.push(lampGlass);
function lamp(x, z){
  solidAt(x, z, 0.35);
  const g = new THREE.Group(); g.position.set(x, 0, z); town.add(g);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 3.6, 6), mat(0x2e2e34)); post.position.y = 1.8; g.add(post);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), mat(0x2e2e34)); arm.position.set(0.3, 3.5, 0); g.add(arm);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.45, 0.34), lampGlass); glass.position.set(0.6, 3.2, 0); g.add(glass);
  LIGHT_SPOTS.push([x + 0.6, 3.0, z]);
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 4), mat(0x2e2e34)); top.position.set(0.6, 3.55, 0); top.rotation.y = Math.PI / 4; g.add(top);
}
function barrel(x, z){
  solidAt(x, z, 0.6);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.48, 1.2, 10), mat(0x8a5a2a)); b.position.set(x, 0.6, z); town.add(b);
  for (const y of [0.25, 0.95]) { const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.08, 10), mat(0x3a3a40)); hp.position.set(x, y, z); town.add(hp); }
}
function crate(x, z, ry){ solidAt(x, z, 0.7); const c = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), texMat(woodTex(), 1, 1, 0xb08a58)); c.position.set(x, 0.5, z); c.rotation.y = ry; town.add(c); }

// ----- nature -----
const nearStart = (x, z) => Math.hypot(x - 4, z - 11) < 7;   // keep the starting tile clear
function tree(x, z){
  if (nearStart(x, z) || (x > 9 && x < 23 && z > -4 && z < 8)) return;   // keep clear of the stone hall
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2, 5), mat(0x6b4a2a)); trunk.position.y = 1; g.add(trunk);
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), mat(0x2f7a3a)); leaves.position.y = 3.2; g.add(leaves);
  g.position.set(x, 0, z); g.rotation.y = rnd() * Math.PI; town.add(g);
}
function rock(x, z){
  if (nearStart(x, z)) return;
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + rnd() * 0.4, 0), mat(0x7b7f88));
  r.position.set(x, 0.4, z); r.rotation.set(rnd(), rnd(), rnd()); town.add(r);
}

// the starting tile: a gold ring under the spot where your adventurer stands
const startRing = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.6, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf0c35a }));

// ----- textures drawn in code: crisp 32px tiles, shown without smoothing -----
const seeded = (() => { let q = 11; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
function makeTex(draw){
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const stoneTex = () => makeTex(g => {
  g.fillStyle = '#5a5c62'; g.fillRect(0, 0, 32, 32);                 // mortar
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 8 : 0;
    for (let x = -8; x < 32; x += 16) {
      const v = 120 + Math.floor(seeded() * 40);
      g.fillStyle = `rgb(${v},${v + 2},${v + 6})`; g.fillRect(x + off + 1, row * 8 + 1, 14, 6);
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + off + 1, row * 8 + 1, 14, 1);   // highlight on the top edge
    }
  }
});
const woodTex = () => makeTex(g => {
  for (let x = 0; x < 32; x += 8) {
    const v = 70 + Math.floor(seeded() * 30);
    g.fillStyle = `rgb(${v + 40},${v + 14},${v - 10})`; g.fillRect(x, 0, 8, 32);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, 0, 1, 32);                  // plank seam
  }
});
const bannerTex = () => makeTex(g => {
  g.fillStyle = '#2a4f9a'; g.fillRect(0, 0, 32, 32);
  g.fillStyle = '#e8e0c0'; g.beginPath(); g.moveTo(8, 10); g.lineTo(16, 18); g.lineTo(24, 10); g.lineTo(24, 14); g.lineTo(16, 22); g.lineTo(8, 14); g.closePath(); g.fill();
});

