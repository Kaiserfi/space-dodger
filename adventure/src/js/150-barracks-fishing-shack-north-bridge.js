// ===== the guards' barracks, with the jail joined on its east side: warm cut stone like the hall, battlements, a corner tower
// flying the village flag, and the emblem banners at the door. Static parts are merged by material so it stays cheap to draw.
const BARRACKS = { x0: -50, x1: -26, z0: 60, z1: 84, jx1: -12, jz0: 64, jz1: 82, H: 7, JH: 6, roof: null };
function buildBarracks(){
  const B = BARRACKS, t = 0.9;
  // warm, honey-coloured cut stone, as on the hall
  const stoneCv = document.createElement('canvas'); stoneCv.width = stoneCv.height = 32; const sg = stoneCv.getContext('2d');
  sg.fillStyle = '#7a6a52'; sg.fillRect(0, 0, 32, 32);
  for (let row = 0; row < 4; row++) { const off = row % 2 ? 8 : 0;
    for (let x = -8; x < 32; x += 16) { const v = (row * 7 + x * 3 + 40) % 30; sg.fillStyle = `rgb(${196 + v},${178 + v},${144 + v})`; sg.fillRect(x + off + 1, row * 8 + 1, 14, 6);
      sg.fillStyle = 'rgba(255,250,230,.25)'; sg.fillRect(x + off + 1, row * 8 + 1, 14, 1); sg.fillStyle = 'rgba(60,40,20,.2)'; sg.fillRect(x + off + 1, row * 8 + 6, 14, 1); } }
  const stoneTx = new THREE.CanvasTexture(stoneCv); stoneTx.wrapS = stoneTx.wrapT = THREE.RepeatWrapping; stoneTx.magFilter = THREE.NearestFilter; stoneTx.colorSpace = THREE.SRGBColorSpace;
  const flagCv = document.createElement('canvas'); flagCv.width = flagCv.height = 32; const fg = flagCv.getContext('2d');   // big flagstones for the floors
  fg.fillStyle = '#5a5248'; fg.fillRect(0, 0, 32, 32); for (const [x, y, w, h] of [[1, 1, 14, 14], [17, 1, 14, 9], [17, 12, 14, 19], [1, 17, 14, 14]]) { fg.fillStyle = `rgb(${128 + (x + y) % 18},${120 + (x + y) % 18},${108 + (x + y) % 18})`; fg.fillRect(x, y, w, h); }
  const flagTx = new THREE.CanvasTexture(flagCv); flagTx.wrapS = flagTx.wrapT = THREE.RepeatWrapping; flagTx.magFilter = THREE.NearestFilter; flagTx.colorSpace = THREE.SRGBColorSpace;
  const M = {
    stone: new THREE.MeshStandardMaterial({ map: stoneTx, color: 0xffffff, flatShading: true, roughness: 0.95 }),
    plinth: new THREE.MeshStandardMaterial({ map: stoneTx, color: 0xa89a84, flatShading: true, roughness: 0.95 }),
    floor: new THREE.MeshStandardMaterial({ map: flagTx, color: 0xffffff, roughness: 1 }),
    slab: new THREE.MeshStandardMaterial({ color: 0x6a6258, flatShading: true, roughness: 1 }),
    wood: mat(0x7a5232), dark: mat(0x4a2e18), iron: new THREE.MeshStandardMaterial({ color: 0x3a3a42, flatShading: true, roughness: 0.6, metalness: 0.5 }),
    gold: mat(0xd8b048), green: mat(0x4e7038), straw: mat(0xd8b860), cloth: mat(0x8a3a2a), soot: mat(0x150e08), steel: new THREE.MeshStandardMaterial({ color: 0xb8bcc4, flatShading: true, roughness: 0.4, metalness: 0.6 }),
    glow: new THREE.MeshStandardMaterial({ color: 0xffd48a, emissive: 0xc07a20, emissiveIntensity: 0.8, roughness: 0.4 }),
  };
  GLOW_MATS.push(M.glow);
  const bins = { main: new Map(), roof: new Map() };
  // a box with its texture tiled by size, so stone and flagstones keep the same scale on every wall
  const boxGeo = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0] / 2.4, uv.getY(i) * dims[f][1] / 2.4); } return g; };
  const put = (m, geo, x, y, z, ry = 0, rz = 0, bin = 'main') => { if (rz) geo.rotateZ(rz); if (ry) geo.rotateY(ry); geo.translate(x, y, z); const b = bins[bin]; if (!b.has(m)) b.set(m, []); b.get(m).push(geo.index ? geo.toNonIndexed() : geo); };
  const box = (m, x0, x1, y0, y1, z0, z1, bin) => put(m, boxGeo(x1 - x0, y1 - y0, z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, bin);
  const solid = (x0, x1, z0, z1) => solidBoxes.push({ x0, x1, z0, z1 });
  const wall = (x0, x1, z0, z1, h) => { box(M.stone, x0, x1, 0, h, z0, z1); box(M.plinth, x0 - 0.15, x1 + 0.15, 0, 0.8, z0 - 0.15, z1 + 0.15); solid(x0, x1, z0, z1); };
  // ----- the barracks walls: a wide arched door in the north, a doorway through to the jail in the east -----
  const D0 = -39.8, D1 = -36.2, DH = 5.2;   // the front door: 3.6 wide and 5.2 high, well clear of the tallest hat
  wall(B.x0, D0, B.z0, B.z0 + t, B.H); wall(D1, B.x1, B.z0, B.z0 + t, B.H); box(M.stone, D0, D1, DH + 0.6, B.H, B.z0, B.z0 + t);
  wall(B.x0, B.x1, B.z1 - t, B.z1, B.H); wall(B.x0, B.x0 + t, B.z0, B.z1, B.H);
  const J0 = 71.5, J1 = 74.5, JDH = 4.9;    // through to the jail
  wall(B.x1 - t, B.x1, B.z0, J0, B.H); wall(B.x1 - t, B.x1, J1, B.z1, B.H); box(M.stone, B.x1 - t, B.x1, JDH, B.H, J0, J1);
  // ----- the jail walls -----
  wall(B.x1, B.jx1, B.jz0, B.jz0 + t, B.JH); wall(B.x1, B.jx1, B.jz1 - t, B.jz1, B.JH); wall(B.jx1 - t, B.jx1, B.jz0, B.jz1, B.JH);
  // arched door and jail doorway trims: stone posts and a ring of voussoirs with a pale keystone
  const arch = (cx, cz, half, top, alongX) => { for (const s of [-1, 1]) { if (alongX) box(M.plinth, cx + s * half - 0.3, cx + s * half + 0.3, 0, top, cz - 0.6, cz + 0.6); else box(M.plinth, cx - 0.6, cx + 0.6, 0, top, cz + s * half - 0.3, cz + s * half + 0.3); }
    for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8, g = boxGeo(0.55, 0.4, 1.3); g.rotateZ(Math.atan2(Math.sin(a) * 0.6, Math.cos(a) * half) - Math.PI / 2 + Math.PI / 2 * 0 + (Math.PI / 2 - a) * 0);
      if (!alongX) g.rotateY(Math.PI / 2); g.translate(alongX ? cx + Math.cos(a) * half : cx, top + Math.sin(a) * 0.6, alongX ? cz : cz + Math.cos(a) * half); put(i === 4 ? M.gold : M.plinth, g, 0, 0, 0); } };
  arch((D0 + D1) / 2, B.z0 + t / 2, 1.8, DH, true); arch(B.x1 - t / 2, (J0 + J1) / 2, 1.5, JDH, false);
  // buttresses at every outside corner
  for (const [x, z, h] of [[B.x0, B.z1, B.H], [B.x1, B.z0, B.H], [B.jx1, B.jz0, B.JH], [B.jx1, B.jz1, B.JH], [B.x1, B.z1, B.H]]) { box(M.stone, x - 0.75, x + 0.75, 0, h + 0.3, z - 0.75, z + 0.75); put(M.slab, new THREE.ConeGeometry(1.1, 0.9, 4), x, h + 0.75, z, Math.PI / 4); }
  // ----- the corner tower, north-west, with the flag on top -----
  const TX0 = B.x0 - 1, TX1 = B.x0 + 4.5, TZ0 = B.z0 - 1, TZ1 = B.z0 + 4.5, TH = 11.5;
  box(M.stone, TX0, TX1, 0, TH, TZ0, TZ1); box(M.plinth, TX0 - 0.2, TX1 + 0.2, 0, 0.9, TZ0 - 0.2, TZ1 + 0.2); solid(TX0, TX1, TZ0, TZ1);
  box(M.slab, TX0 - 0.3, TX1 + 0.3, TH, TH + 0.4, TZ0 - 0.3, TZ1 + 0.3);
  for (let i = 0; i < 4; i++) for (const s of [0, 1]) { const u = TX0 - 0.3 + 0.45 + i * ((TX1 - TX0 + 0.6 - 0.9) / 3); box(M.stone, u - 0.45, u + 0.45, TH + 0.4, TH + 1.3, s ? TZ1 - 0.3 : TZ0 - 0.3, s ? TZ1 + 0.3 : TZ0 + 0.3); box(M.stone, s ? TX1 - 0.3 : TX0 - 0.3, s ? TX1 + 0.3 : TX0 + 0.3, TH + 0.4, TH + 1.3, u - (TX0 - TZ0) - 0.45, u - (TX0 - TZ0) + 0.45); }
  for (const [x, z, ry] of [[(TX0 + TX1) / 2, TZ0 - 0.02, 0], [TX0 - 0.02, (TZ0 + TZ1) / 2, Math.PI / 2]]) { const g = boxGeo(0.7, 1.6, 0.2); put(M.soot, g, x, 8.4, z, ry); }   // arrow slits
  // ----- battlements round the barracks and the jail roofs, and the flat roofs themselves (lifted off while you're inside) -----
  const merlons = (x0, x1, z0, z1, h) => { const step = 1.7;
    for (let x = x0 + 0.6; x <= x1 - 0.4; x += step) for (const z of [z0, z1]) box(M.stone, x - 0.45, x + 0.45, h, h + 0.9, z - 0.05, z + t + 0.05 - (z === z1 ? t : 0) * 0 , 'roof');
    for (let z = z0 + 0.6; z <= z1 - 0.4; z += step) for (const x of [x0, x1 - t]) box(M.stone, x - 0.05, x + t + 0.05, h, h + 0.9, z - 0.45, z + 0.45, 'roof'); };
  merlons(B.x0, B.x1, B.z0, B.z1 - t, B.H); merlons(B.x1, B.jx1, B.jz0, B.jz1 - t, B.JH);
  box(M.slab, B.x0 + t, B.x1 - t, B.H - 0.35, B.H - 0.05, B.z0 + t, B.z1 - t, 'roof'); box(M.slab, B.x1, B.jx1 - t, B.JH - 0.35, B.JH - 0.05, B.jz0 + t, B.jz1 - t, 'roof');
  // ----- windows: arched, glowing warm after dark -----
  const win = (x, z, ry, y = 3.0) => { put(M.glow, boxGeo(1.1, 1.6, 0.3), x, y, z, ry); put(M.glow, new THREE.CylinderGeometry(0.55, 0.55, 0.3, 14, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), x, y + 0.8, z, ry);
    put(M.dark, boxGeo(0.1, 2.1, 0.36), x, y + 0.2, z, ry); put(M.dark, boxGeo(1.1, 0.1, 0.36), x, y + 0.2, z, ry); put(M.plinth, boxGeo(1.5, 0.22, 0.6), x, y - 0.9, z, ry); };
  for (const x of [-46, -31]) win(x, B.z0 + t / 2, 0);
  for (const x of [-46, -38, -30]) win(x, B.z1 - t / 2, 0);
  for (const z of [68, 76]) win(B.x0 + t / 2, z, Math.PI / 2);
  for (const z of [67.5, 73, 78.5]) win(B.jx1 - t / 2, z, Math.PI / 2, 3.6);   // small high windows in each cell
  // ----- floors -----
  const floorAt = (w, d, x, z) => { const g = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 3, uv.getY(i) * d / 3); put(M.floor, g, x, 0.08, z); };   /* flagstones about 1.5 units across */
  floorAt(B.x1 - B.x0 - 1.2, B.z1 - B.z0 - 1.2, (B.x0 + B.x1) / 2, (B.z0 + B.z1) / 2); floorAt(B.jx1 - B.x1 - 1, B.jz1 - B.jz0 - 1.2, (B.x1 + B.jx1) / 2, (B.jz0 + B.jz1) / 2);
  floorAt(1.1, J1 - J0, B.x1 - 0.05, (J0 + J1) / 2); floorAt(D1 - D0, 0.7, (D0 + D1) / 2, B.z0 + 0.25);   /* exactly the gaps the main floors leave (x -26.6..-25.5, z 59.9..60.6), so nothing overlaps and flickers */   /* flagstones across both thresholds, so no ground shows in the doorways */
  // ----- inside the barracks -----
  // four bunk beds along the west wall: two decks each, green guard blankets, a chest at the foot
  for (const z of [67, 71.5, 76, 80.5]) {   /* clear of the corner tower */ const x0 = B.x0 + t, x1 = x0 + 2.0, z0 = z - 2.2, z1 = z + 2.2;   /* long enough for a guard to lie in */
    for (const [px, pz] of [[x0 + 0.15, z0 + 0.15], [x1 - 0.15, z0 + 0.15], [x0 + 0.15, z1 - 0.15], [x1 - 0.15, z1 - 0.15]]) box(M.dark, px - 0.15, px + 0.15, 0, 3.4, pz - 0.15, pz + 0.15);
    for (const y of [0.7, 2.5]) { box(M.wood, x0, x1, y, y + 0.2, z0, z1); box(M.green, x0 + 0.1, x1 - 0.1, y + 0.2, y + 0.42, z0 + 0.6, z1 - 0.1); box(M.straw, x0 + 0.2, x1 - 0.2, y + 0.2, y + 0.5, z0 + 0.15, z0 + 0.7); }
    box(M.wood, x1 + 0.2, x1 + 1.4, 0, 0.9, z - 0.6, z + 0.6); box(M.iron, x1 + 0.18, x1 + 1.42, 0.55, 0.65, z - 0.62, z + 0.62);
    solid(x0, x1 + 1.4, z0, z1); }
  // the long mess table and its benches, with mugs and a loaf
  { const x = -38, z0 = 69.5, z1 = 77.5; box(M.wood, x - 1.1, x + 1.1, 1.05, 1.25, z0, z1); for (const zz of [z0 + 0.4, z1 - 0.4]) for (const s of [-1, 1]) box(M.dark, x + s * 0.9 - 0.12, x + s * 0.9 + 0.12, 0, 1.05, zz - 0.12, zz + 0.12);
    for (const s of [-1, 1]) { box(M.wood, x + s * 1.75 - 0.3, x + s * 1.75 + 0.3, 0.6, 0.75, z0 + 0.3, z1 - 0.3); for (const zz of [z0 + 0.8, z1 - 0.8]) box(M.dark, x + s * 1.75 - 0.08, x + s * 1.75 + 0.08, 0, 0.6, zz - 0.08, zz + 0.08); }
    for (const zz of [70.6, 72.4, 74.8, 76.6]) put(M.steel, new THREE.CylinderGeometry(0.12, 0.1, 0.28, 8), x + (zz % 2 > 1 ? 0.5 : -0.5), 1.39, zz);
    put(mat(0xc8843a), new THREE.SphereGeometry(0.35, 8, 6).scale(1.4, 0.7, 0.9), x, 1.45, 73.6);
    solid(x - 2.1, x + 2.1, z0 + 0.2, z1 - 0.2); }
  // the hearth in the south wall: a stone chimney breast, a sooty firebox and a fire that glows (no new light: the night lights find it)
  { const x = -38, z = B.z1 - t; box(M.stone, x - 2.2, x + 2.2, 0, B.H, z - 1.4, z); box(M.soot, x - 1.2, x + 1.2, 0.2, 1.9, z - 1.45, z - 0.9); box(M.dark, x - 2.5, x + 2.5, 2.7, 3.0, z - 1.7, z);
    put(fireMat, boxGeo(1.4, 0.8, 0.2), x, 0.6, z - 1.3); for (const s of [-1, 1]) put(M.dark, new THREE.CylinderGeometry(0.12, 0.12, 1.1, 6).rotateZ(Math.PI / 2), x + s * 0.2, 0.35, z - 1.2, s * 0.4);
    solid(x - 2.2, x + 2.2, z - 1.5, z); LIGHT_SPOTS.push([x, 2.4, z - 2.6]); }
  // a weapon rack on the south wall: swords and spears
  { const x0 = -33.5, x1 = -29, z = B.z1 - t; box(M.dark, x0, x1, 0, 0.25, z - 0.7, z); box(M.dark, x0, x1, 2.4, 2.6, z - 0.4, z); for (const x of [x0 + 0.1, x1 - 0.1]) box(M.dark, x - 0.1, x + 0.1, 0, 2.6, z - 0.6, z - 0.3);
    for (let i = 0; i < 5; i++) { const x = x0 + 0.6 + i * 0.85; if (i % 2) { put(M.dark, new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), x, 1.65, z - 0.45); put(M.steel, new THREE.ConeGeometry(0.13, 0.5, 4), x, 3.45, z - 0.45); }
      else { put(M.steel, boxGeo(0.12, 1.5, 0.04), x, 1.35, z - 0.45); put(M.gold, boxGeo(0.5, 0.08, 0.1), x, 0.58, z - 0.45); put(M.dark, boxGeo(0.08, 0.4, 0.08), x, 0.32, z - 0.45); } }
    solid(x0, x1, z - 0.8, z); }
  // two armour stands just inside the door, wearing guard's iron and the green cloak
  for (const x of [-43.5, -32.5]) { const z = B.z0 + t + 0.8; box(M.dark, x - 0.5, x + 0.5, 0, 0.15, z - 0.5, z + 0.5); box(M.dark, x - 0.06, x + 0.06, 0, 2.6, z - 0.06, z + 0.06);
    box(M.steel, x - 0.55, x + 0.55, 1.5, 2.5, z - 0.35, z + 0.35); box(M.green, x - 0.6, x + 0.6, 1.4, 2.4, z - 0.42, z - 0.36); put(M.steel, new THREE.SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), x, 2.75, z); put(M.gold, new THREE.ConeGeometry(0.08, 0.35, 5), x, 3.2, z);
    solid(x - 0.6, x + 0.6, z - 0.6, z + 0.6); }
  // supply crates and a barrel in the north-east corner
  for (const [x, z, s] of [[-28.6, 62.4, 1.2], [-28.6, 64.0, 1.0], [-30.0, 62.4, 0.9]]) { box(M.wood, x - s / 2, x + s / 2, 0, s, z - s / 2, z + s / 2); }
  put(M.wood, new THREE.CylinderGeometry(0.55, 0.48, 1.3, 10), -28.6, 0.65, 66.2); put(M.iron, new THREE.CylinderGeometry(0.57, 0.57, 0.08, 10), -28.6, 1.1, 66.2);
  solid(-30.5, -27.9, 61.7, 66.8);
  // wall torches: an iron bracket, a stick and a glowing flame
  const sconce = (x, z, ry) => { put(M.iron, boxGeo(0.12, 0.5, 0.4), x, 3.4, z, ry); put(M.dark, new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6), x + Math.sin(ry) * 0.28, 3.75, z + Math.cos(ry) * 0.28); put(fireMat, new THREE.ConeGeometry(0.13, 0.35, 6), x + Math.sin(ry) * 0.28, 4.2, z + Math.cos(ry) * 0.28); };
  sconce(-41.5, B.z0 + t + 0.06, 0); sconce(-34.5, B.z0 + t + 0.06, 0); sconce(B.x0 + t + 0.06, 73.75, Math.PI / 2);
  LIGHT_SPOTS.push([-38, 3, 64], [-44, 3, 73]);
  // ----- the jail: a corridor along the west side, three barred cells to the east -----
  const BX = -20, cells = [[B.jz0 + t, 70.2], [70.6, 75.4], [75.8, B.jz1 - t]];
  box(M.stone, BX, B.jx1 - t, 0, B.JH, 70.2, 70.6); box(M.stone, BX, B.jx1 - t, 0, B.JH, 75.4, 75.8); solid(BX, B.jx1 - t, 70.2, 70.6); solid(BX, B.jx1 - t, 75.4, 75.8);   // the walls between the cells
  for (const [z0, z1] of cells) {
    for (let z = z0 + 0.25; z < z1 - 0.1; z += 0.38) put(M.iron, new THREE.CylinderGeometry(0.05, 0.05, B.JH - 0.4, 6), BX, (B.JH - 0.4) / 2, z);
    for (const y of [0.35, 2.6, B.JH - 0.5]) box(M.iron, BX - 0.08, BX + 0.08, y - 0.08, y + 0.08, z0, z1);
    const cz = (z0 + z1) / 2; box(M.iron, BX - 0.12, BX + 0.12, 0, 4.4, cz - 0.95, cz - 0.8); box(M.iron, BX - 0.12, BX + 0.12, 0, 4.4, cz + 0.8, cz + 0.95); box(M.iron, BX - 0.12, BX + 0.12, 4.3, 4.45, cz - 0.95, cz + 0.95);   // the cell door's frame
    box(M.iron, BX - 0.28, BX - 0.1, 1.8, 2.3, cz + 0.45, cz + 0.75);   // its lock
    solid(BX - 0.15, BX + 0.15, z0, z1);
    // a straw pallet, a stool and a bucket in every cell
    box(M.straw, B.jx1 - t - 2.4, B.jx1 - t - 0.1, 0.05, 0.35, z0 + 0.3, z0 + 1.6); put(M.wood, new THREE.CylinderGeometry(0.28, 0.24, 0.45, 8), BX + 1.0, 0.24, z1 - 0.7);
    put(M.wood, new THREE.CylinderGeometry(0.32, 0.32, 0.12, 8), BX + 2.4, 0.75, z1 - 0.6); for (const a of [0, 2.1, 4.2]) put(M.dark, new THREE.CylinderGeometry(0.04, 0.04, 0.7, 4), BX + 2.4 + Math.cos(a) * 0.22, 0.35, z1 - 0.6 + Math.sin(a) * 0.22);
  }
  sconce(-23, B.jz0 + t + 0.06, 0); sconce(-23, B.jz1 - t - 0.06, Math.PI); LIGHT_SPOTS.push([-23, 3, 73]);
  // ----- merge everything: one mesh per material -----
  const g = new THREE.Group(), roof = new THREE.Group(); g.add(roof); town.add(g);
  for (const [bin, parent] of [['main', g], ['roof', roof]]) for (const [m, geos] of bins[bin]) { const mesh = new THREE.Mesh(mergeGeometries(geos), m); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); }
  B.roof = roof; B.group = g;
  // ----- the banners by the door and the flags on the tower and the jail, all swaying in the wind -----
  const cloth = (W, Hh, swallow) => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = swallow ? 256 : 96; const c = cv.getContext('2d'), w = cv.width, h = cv.height;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); if (swallow) { c.lineTo(w, h); c.lineTo(w / 2, h * 0.84); c.lineTo(0, h); } else { c.lineTo(w, h); c.lineTo(0, h); } c.closePath(); c.fillStyle = '#4e7038'; c.fill();
    c.strokeStyle = '#d8b048'; c.lineWidth = swallow ? 9 : 6; c.stroke(); if (swallow) { c.fillStyle = '#d8b048'; c.fillRect(0, 0, w, 14); }
    drawEmblem(c, w / 2, swallow ? h * 0.42 : h / 2, swallow ? 44 : 32, '#e2b84c', '#4e7038');
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(W, Hh, 8, 12); geo.translate(0, -Hh / 2, 0);
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, alphaTest: 0.5, roughness: 1 })); };
  const sway = (m, ph) => { hallBanners.push({ cloth: m, base: Float32Array.from(m.geometry.attributes.position.array), ph }); };
  for (const x of [-42.2, -33.8]) { const z = B.z0 - 0.05;   // a long banner either side of the door, hanging from an iron pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.3, 6).rotateZ(Math.PI / 2), M.iron); pole.position.set(x, 6.1, z - 0.5); g.add(pole);
    for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M.gold); k.position.set(x + s * 1.18, 6.1, z - 0.5); g.add(k); }
    const b = cloth(2.0, 4.4, true); b.position.set(x, 6.05, z - 0.55); g.add(b); sway(b, x * 0.7); }
  const flag = (x, y, z, ph) => { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6), M.dark); pole.position.set(x, y + 2.25, z); g.add(pole);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M.gold); knob.position.set(x, y + 4.55, z); g.add(knob);
    const f = cloth(1.8, 3.0, false); f.rotation.set(0, 0, Math.PI / 2); f.position.set(x + 0.05, y + 4.3, z); g.add(f); sway(f, ph); };   // the flag streams out sideways from the pole
  flag((TX0 + TX1) / 2, TH + 0.4, (TZ0 + TZ1) / 2, 0.3); flag(B.jx1 - 1.5, B.JH, B.jz0 + 1.5, 2.1);
  // the banners inside, either side of the hearth
  for (const x of [-42, -34]) { const b = cloth(1.5, 3.2, true); b.position.set(x, 5.9, B.z1 - t - 0.06); b.rotation.y = Math.PI; g.add(b); }
  return B;
}
// ----- Jory's fishing shack, on the east bank of the pond south of the barracks: weathered blue-grey planks, open to the south over a counter -----
// Everything is merged into one mesh per material, as the barracks are. The roof lifts while you stand at the counter, so you can see him.
const FISH_SHACK = { x: -63, z: 92, roof: null, talk: { x: -63, z: 96.1 } };
function buildFishShop(){
  const X = FISH_SHACK.x, Z = FISH_SHACK.z, bins = { main: new Map(), roof: new Map() };
  const driftTex = makeTex(c => { for (let x = 0; x < 32; x += 8) { const v = 150 + Math.floor(seeded() * 40); c.fillStyle = `rgb(${v - 8},${v + 6},${v + 14})`; c.fillRect(x, 0, 8, 32); c.fillStyle = 'rgba(40,50,60,.45)'; c.fillRect(x, 0, 1, 32); } });
  const M = { plank: texMat(driftTex, 3, 2), dark: texMat(woodTex(), 2, 2), trim: mat(0xd8d0c0), tub: mat(0x8a6a42), soil: mat(0x5a3a28), fish: mat(0xb8c4c8), rope: mat(0xc8b080), rod: mat(0x8a5a2a),
    net: new THREE.MeshStandardMaterial({ color: 0xc8b890, transparent: true, opacity: 0.55 }), boat: texMat(woodTex(), 2, 2, 0xffb08a), floor: texMat(woodTex(), 4, 3, 0xd8c8b0),
    roof: new THREE.MeshStandardMaterial({ map: roofTex, color: 0x8aa0b0, flatShading: true }) };
  const put = (m, geo, x, y, z, ry = 0, bin = 'main', sc = null, rx = 0, rz = 0) => { if (sc) geo.scale(...sc); if (rz) geo.rotateZ(rz); if (rx) geo.rotateX(rx); if (ry) geo.rotateY(ry); geo.translate(X + x, y, Z + z);
    const b = bins[bin]; if (!b.has(m)) b.set(m, []); const g = geo.index ? geo.toNonIndexed() : geo; b.get(m).push(g); };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  put(M.plank, B(8, 4.8, 0.25), 0, 2.4, -3);   // the back wall, facing the barracks
  for (const sx of [-1, 1]) put(M.plank, B(0.25, 4.8, 6), sx * 4, 2.4, 0);
  for (const sx of [-1, 1]) put(M.dark, B(0.35, 5.0, 0.35), sx * 4, 2.5, 3);   // corner posts at the front
  put(M.floor, B(7.7, 0.06, 5.8), 0, 0.03, 0);
  put(M.dark, B(7.6, 1.15, 0.9), 0, 0.58, 2.4); put(M.trim, B(7.9, 0.12, 1.1), 0, 1.2, 2.4);   // the counter
  put(M.roof, B(9.2, 0.2, 8.4), 0, 5.35, 0.6, 0, 'roof', null, 0.09);   // sloping down to the back
  // on the counter: a tub of worms, a crate of fish and a coil of rope
  put(M.tub, new THREE.CylinderGeometry(0.35, 0.3, 0.4, 10), 2.4, 1.46, 2.4); put(M.soil, new THREE.CylinderGeometry(0.3, 0.3, 0.05, 10), 2.4, 1.64, 2.4);
  put(M.dark, B(1.1, 0.4, 0.7), -2.2, 1.46, 2.4); for (let i = 0; i < 4; i++) put(M.fish, new THREE.SphereGeometry(0.16, 8, 6), -1.85 - i * 0.24, 1.72, 2.4, 0.3 * i, 'main', [1.8, 0.6, 0.7]);
  put(M.rope, new THREE.TorusGeometry(0.26, 0.07, 6, 14), -0.4, 1.3, 2.3, 0, 'main', null, Math.PI / 2);
  // inside: a net on the back wall, rods in the corner, two barrels
  put(M.net, B(3.2, 1.8, 0.05), 1, 3.3, -2.82);
  for (let i = 0; i < 3; i++) put(M.rod, new THREE.CylinderGeometry(0.03, 0.04, 3.4, 5), -3.3 + i * 0.25, 1.7, -2.6, 0, 'main', null, 0, -(0.12 + i * 0.05));
  for (const z of [-2.2, -1.2]) put(M.dark, new THREE.CylinderGeometry(0.45, 0.45, 1.1, 10), 3.2, 0.55, z);
  // outside: an upturned rowboat on the pond side, and crates at the back corner
  put(M.boat, new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), -6, 0, -1.4, 0, 'main', [0.9, 0.55, 2.6]);
  put(M.dark, B(1, 0.8, 1), 5, 0.4, -2.2); put(M.dark, B(0.9, 0.7, 0.9), 5.1, 1.15, -2.1, 0.3);
  const g = new THREE.Group(), roof = new THREE.Group(); g.add(roof); town.add(g);
  for (const [bin, parent] of [['main', g], ['roof', roof]]) for (const [m, geos] of bins[bin]) { const mesh = new THREE.Mesh(mergeGeometries(geos), m); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); }
  FISH_SHACK.roof = roof;
  // solid: the walls, the counter (sealing the front, so only Jory is ever inside), the barrels, the boat and the crates
  solidBoxes.push({ x0: X - 4.2, x1: X + 4.2, z0: Z - 3.2, z1: Z - 2.8 }, { x0: X - 4.2, x1: X - 3.8, z0: Z - 3.2, z1: Z + 3.2 }, { x0: X + 3.8, x1: X + 4.2, z0: Z - 3.2, z1: Z + 3.2 },
    { x0: X - 4.2, x1: X + 4.2, z0: Z + 1.9, z1: Z + 2.95 }, { x0: X + 2.7, x1: X + 3.7, z0: Z - 2.7, z1: Z - 0.7 }, { x0: X - 6.9, x1: X - 5.1, z0: Z - 4.0, z1: Z + 1.2 }, { x0: X + 4.5, x1: X + 5.6, z0: Z - 2.8, z1: Z - 1.6 });
}
// ----- the north: the bridge over the river, a footbridge over the stream, trees, iron rocks, trout, and stones and bushes on the uplands -----
// Everything decorative is merged into one mesh per material. Trees and rocks are ordinary shared nodes, placed from a fixed seed so everyone has the same.
// the village pond: two benches looking out over the water and three lamps along the east bank, for fishing after dark
function buildPondSide(){
  const at = (a, extra) => { const R = pondR(a) + extra; return [POND.x + Math.cos(a) * R, POND.z + Math.sin(a) * R * POND.k]; };
  const clearOf = (x, z, r) => !blocked(x, z) && waterSD(x, z) > 1.5 && !fishSpots.some(f => Math.hypot(f.x - x, f.z - z) < r) && Math.hypot(x - FISH_SHACK.x, z - FISH_SHACK.z) > 7;
  for (const a of [-0.95, 0.95]) { const [x, z] = at(a, 3.6); if (!clearOf(x, z, 4)) continue; const fx = POND.x - x, fz = POND.z - z; bench(x, z, Math.atan2(-fx, -fz)); }
  for (const a of [-0.6, 0.1, 0.7]) { const [x, z] = at(a, 2.4); if (clearOf(x, z, 2.2)) lamp(x, z); }
}
// a point on the north lake's shore in direction a (radians round its middle), out (+) or in (-) from the water's edge by off
function lakeShore(a, off){
  const P = NORTH.pool, dx = Math.cos(a) * P.rx, dz = Math.sin(a) * P.rz; let k = 0.5;
  for (let i = 0; i < 40; i++) { const x = P.x + dx * k, z = P.z + dz * k; if (northWaterSD(x, z) > 0) break; k += 0.025; }   // walk out to the edge
  const L = Math.hypot(dx, dz); return [P.x + dx * k + dx / L * off, P.z + dz * k + dz / L * off];
}
/* the cave in the east hills: a ragged dark opening laid on the spur's face (the ground is a 1-unit grid, so the face runs from the
   last flat column to the next; the opening follows that slope), ferns at its foot, and solid rock. Clicking it: coming soon. */
function buildCaveMouth(){
  const C = NORTH.cave, MZ = C.z, col = Math.floor(C.x + 0.001), slope = spurH(col + 1, MZ);
  const edge = [[-1.75, 0], [-1.6, 1.4], [-1.8, 2.6], [-1.35, 3.6], [-0.9, 4.25], [-0.2, 4.7], [0.5, 4.5], [1.05, 4.0], [1.45, 3.1], [1.4, 2.0], [1.7, 0.9], [1.65, 0]];
  const onFace = (u, v, out) => [col - out + Math.min(1, v / slope), v, MZ + u];
  const g = new THREE.Group(); town.add(g);
  const mouth = (k, out, colr) => { const pos = [], pts = edge.map(([u, v]) => onFace(u * k, 2.2 + (v - 2.2) * k, out)), ctr = onFace(0, 2.0, out);
    for (let i = 0; i < pts.length; i++) pos.push(...ctr, ...pts[i], ...pts[(i + 1) % pts.length]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: colr, side: THREE.DoubleSide })); g.add(m); return m; };
  mouth(1.1, 0.04, 0x231b14);   // a slightly lighter lip round the edge
  const dark = mouth(1.0, 0.08, 0x0b0806);
  dark.userData = { action: 'Enter', name: 'Cave', rec: { kind: 'cave', onClick: () => showToast('Coming soon....') } }; trees.push(dark);
  const fern = mat(0x3f7a2e); fern.side = THREE.DoubleSide;
  for (const [x, z, s2] of [[col - 0.2, MZ - 4.6, 1], [col - 0.1, MZ + 4.5, 0.9], [col - 1.1, MZ + 2.4, 0.6], [col - 1.0, MZ - 2.6, 0.55]]) {
    const f = new THREE.Group(); f.position.set(x, 0.02, z); g.add(f);
    for (let i = 0; i < 6; i++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16 * s2, 1.1 * s2, 3), fern); const piv = new THREE.Group(); piv.rotation.y = i * 1.05; leaf.rotation.x = 0.9; leaf.position.set(0, 0.35 * s2, 0.35 * s2); piv.add(leaf); f.add(piv); } }
  /* the spur is solid: one strip per unit of its width, from its face back into the hill */
  for (let z = MZ - C.hw - 2.5; z < MZ + C.hw + 2.5; z += 1) { let x0 = null; for (let x = C.x - 1; x < C.x + 12; x += 0.25) if (spurH(x, z + 0.5) > 0.8) { x0 = x; break; }
    if (x0 !== null) solidBoxes.push({ x0: x0 - 0.1, x1: C.x + 14, z0: z, z1: z + 1 }); }
}
function buildNorth(){
  const bins = new Map(), wood = texMat(woodTex(), 1, 3), dark = mat(0x4a3220), stoneM = mat(0x7a766c), bushM = mat(0x3e6a2e), bushL = mat(0x5a8a3a), flowerM = mat(0xe0d070), heath = mat(0x8a5a7a);
  const put = (m, geo, x, y, z, ry = 0, sc = null) => { if (sc) geo.scale(...sc); if (ry) geo.rotateY(ry); geo.translate(x, y, z); if (!bins.has(m)) bins.set(m, []); bins.get(m).push(geo.index ? geo.toNonIndexed() : geo); };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  // the bridge: a plank deck on posts from the village bank to the far one, with a rail each side
  const bx = NORTH.bridge.x, z0 = -10.2, z1 = -21.4, L = z0 - z1, zc = (z0 + z1) / 2;
  put(wood, B(4.4, 0.18, L), bx, -0.03, zc);
  for (let z = z1 + 0.4; z <= z0; z += 0.9) put(dark, B(4.5, 0.04, 0.08), bx, 0.07, z);   // the gaps between planks
  for (const sx of [-1, 1]) { put(dark, B(0.16, 0.16, L), bx + sx * 2.1, 1.05, zc); put(dark, B(0.12, 0.12, L), bx + sx * 2.1, 0.55, zc);
    for (let z = z1; z <= z0 + 0.01; z += L / 6) put(dark, B(0.22, 1.9, 0.22), bx + sx * 2.1, 0.2, z); }   // posts down into the water
  // the footbridge over the stream
  { const z = NORTH.ford, x0 = 40.5, x1 = 48.6, l = x1 - x0, xc = (x0 + x1) / 2;
    put(wood, B(l, 0.16, 3.0), xc, -0.03, z); for (const sz of [-1, 1]) { put(dark, B(l, 0.12, 0.12), xc, 0.95, z + sz * 1.4); for (let x = x0; x <= x1 + 0.01; x += l / 3) put(dark, B(0.18, 1.6, 0.18), x, 0.2, z + sz * 1.4); } }
  // stones, bushes and heather, from a fixed seed: thin by the river, thicker up towards the hills
  let q = 9001; const r = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const onPath = (x, z) => NORTH_PATHS.some(pts => pts.some((p, k) => k && segDist(x, z, pts[k - 1], p) < 2));
  for (let i = 0; i < 520; i++) {
    const x = -96 + r() * 192, z = -23 - r() * 72, up = (-z - 23) / 72, kind = r();
    if (onPath(x, z) || northOut(x, z) > -1 || hillH(x, z) > 0.1 || waterSD(x, z) < 1.2 || Math.hypot(x - bx, z + 22) < 4) continue;
    if (kind < 0.25 + up * 0.35) { const s = 0.25 + r() * 0.5; put(stoneM, new THREE.DodecahedronGeometry(s, 0), x, s * 0.35, z, r() * 6, [1, 0.6, 1]); }   // a stone, low enough to step over
    else if (kind < 0.6) { const s = 0.5 + r() * 0.45; put(r() < 0.5 ? bushM : bushL, new THREE.IcosahedronGeometry(s, 0), x, s * 0.55, z, r() * 6, [1.2, 0.75, 1.1]); }   // a bush, just for looks
    else if (kind < 0.8) { for (let k = 0; k < 4; k++) put(up > 0.4 ? heath : flowerM, new THREE.IcosahedronGeometry(0.1, 0), x + (r() - 0.5), 0.12, z + (r() - 0.5)); }
  }
  // boulders on the hillsides, so the hills read as rocky
  for (let i = 0; i < 160; i++) { const x = -118 + r() * 236, z = -20 - r() * 99, h = hillH(x, z); if (h < 0.8 || h > 12) continue; if (Math.hypot(x - NORTH.cave.x - 5, z - NORTH.cave.z) < 18) { r(); r(); continue; }   /* none round the cave; the same draws, so every other boulder stays put */
    const s = 0.8 + r() * 1.6; put(stoneM, new THREE.DodecahedronGeometry(s, 0), x, h + s * 0.2, z, r() * 6, [1, 0.7, 1]); }
  buildCaveMouth();
  // reeds along the lake shore, and a few on the island
  const reedM = mat(0x5a7a2e);
  for (let a = 0; a < Math.PI * 2; a += 0.05) { if (r() < 0.45) continue; const [x, z] = lakeShore(a, -0.3 + r() * 0.6); if (Math.hypot(x - bx, z + 22) < 4) continue;
    for (let k = 0; k < 3; k++) { const h = 0.9 + r() * 0.9; put(reedM, new THREE.CylinderGeometry(0.02, 0.035, h, 4), x + (r() - 0.5) * 0.7, WATER_Y + h / 2, z + (r() - 0.5) * 0.7); } }
  const g = new THREE.Group(); town.add(g);
  for (const [m, geos] of bins) { const mesh = new THREE.Mesh(mergeGeometries(geos), m); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); }
  // the trout pool: trees all round it, leaving the path side open, and two trout spots on its south-west bank
  for (let a = 0; a < Math.PI * 2; a += 0.16) { if (a > 1.5 && a < 3.0) continue; const [sx, sz] = lakeShore(a, 4.5 + (Math.sin(a * 5) + 1) * 1.2), oak = a > 3.4 && a < 6;
    if (!blocked(sx, sz) && !blocked(sx + 1.2, sz) && !blocked(sx - 1.2, sz) && waterSD(sx, sz) > 2 && northOut(sx, sz) < -2 && !treeRecs.some(t => Math.hypot(t.x - sx, t.z - sz) < 4)) makeTree(sx, sz, oak ? 1.5 : 1.4, oak); }   /* trees round the shore, oaks on the far side */
  for (const a of [1.75, 2.05, 2.35, 2.65, 2.95]) { const [x, z] = lakeShore(a, -1.3); addFishSpot(x, z, 'trout'); }   // trout along the south-west bank, by the path
  // copses across the meadow, and oaks further up
  for (let i = 0; i < 70; i++) { const x = -92 + r() * 184, z = -26 - r() * 62, oak = r() < 0.3 + (-z - 26) / 120;
    if (onPath(x, z) || northOut(x, z) > -3 || hillH(x, z) > 0 || waterSD(x, z) < 3 || Math.hypot(x + 49, z + 68) < 11 || Math.hypot(x - bx, z + 22) < 6) continue;
    if (treeRecs.some(t => Math.hypot(t.x - x, t.z - z) < 6) || [-1.5, 0, 1.5].some(d => blocked(x + d, z) || blocked(x, z + d))) continue;
    makeTree(x, z, oak ? 1.5 : 1.3, oak); }
  // the iron rocks, at the foot of the knoll in the north-west
  for (const [x, z] of [[-52, -63], [-47.5, -66.5], [-43, -62.5], [-50, -71.5], [-43.5, -70.5], [-55.5, -68]]) makeRock(x, z, 1, 'iron');
}
// the roof lifts while you stand at his counter, so you can see Jory under it
function updateFishShack(){ if (!FISH_SHACK.roof || !hero) return; const x = hero.position.x - FISH_SHACK.x, z = hero.position.z - FISH_SHACK.z; FISH_SHACK.roof.visible = !(Math.abs(x) < 4.5 && z > -3.5 && z < 6); }
// lift both roofs while you're in the barracks or the jail, so you can see inside
function updateBarracks(){ const B = BARRACKS; if (!B.roof || !hero) return; const x = hero.position.x, z = hero.position.z;
  B.roof.visible = !((x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1) || (x > B.x1 && x < B.jx1 && z > B.jz0 && z < B.jz1)); }
