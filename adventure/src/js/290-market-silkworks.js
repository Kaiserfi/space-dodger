// ===== the farmers' market, east of the windmill: Tilly's long counter under a striped awning, crates of what the farm grows, and a painted sign =====
function buildMarket(){
  const MX = 110, MZ = 4.4, add = (geo, m, x, y, z, parent) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const g = new THREE.Group(); g.position.set(MX, 0, MZ); town.add(g);
  const wood = texMat(woodTex(), 3, 1, 0xa07a4a), dark = mat(0x5a3a1e);
  add(new THREE.BoxGeometry(7, 1.0, 1.1), wood, 0, 0.5, 0, g); add(new THREE.BoxGeometry(7.2, 0.08, 1.3), dark, 0, 1.04, 0, g);   // the counter
  for (const x of [-3.4, 3.4]) for (const z of [-0.5, -2.4]) add(new THREE.BoxGeometry(0.18, 4.1, 0.18), dark, x, 2.05, z, g);   // posts for the awning, tall enough to clear Tilly's hat
  for (let i = 0; i < 8; i++) { const a = add(new THREE.BoxGeometry(7.4 / 8 + 0.01, 0.06, 2.9), i % 2 ? 0xf4ecd8 : 0xc83a2a, -3.7 + 7.4 / 16 + i * 7.4 / 8, 4.05, -1.25, g); a.rotation.x = 0.22; }   // the striped awning
  for (let i = 0; i < 16; i++) { const v = add(new THREE.ConeGeometry(0.24, 0.4, 3), i % 2 ? 0xf4ecd8 : 0xc83a2a, -3.48 + i * 0.465, 3.56, 0.2, g); v.rotation.set(Math.PI, 0, 0); v.scale.z = 0.2; }   // a scalloped edge
  // crates and baskets of produce along the counter
  const crate = (x, col, kind) => { add(new THREE.BoxGeometry(1.0, 0.36, 0.7), texMat(woodTex(), 1, 1, 0x8a6438), x, 1.26, 0.05, g);
    for (let k = 0; k < 9; k++) { const px = x - 0.32 + (k % 3) * 0.32, pz = -0.2 + Math.floor(k / 3) * 0.22;
      if (kind === 'wheat') { const b = add(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 5), col, px, 1.6, pz, g); b.rotation.z = (k % 3 - 1) * 0.25; }
      else if (kind === 'aloe') { const l = add(new THREE.ConeGeometry(0.07, 0.4, 4), col, px, 1.62, pz, g); l.rotation.z = (k % 3 - 1) * 0.5; }
      else add(new THREE.SphereGeometry(kind === 'cocoon' ? 0.1 : 0.08, 7, 5), col, px, 1.5, pz, g).scale.set(1, kind === 'cocoon' ? 0.75 : 1, kind === 'cocoon' ? 1.4 : 1); } };
  crate(-2.6, 0xe0b850, 'wheat'); crate(-1.3, 0x6aa080, 'aloe'); crate(1.3, 0x3a1030, 'berry'); crate(2.6, 0xf4f0e2, 'cocoon');
  const sack = add(new THREE.SphereGeometry(0.42, 10, 8), 0xe8dcc0, 0, 1.45, 0, g); sack.scale.set(1, 0.8, 0.8);   // a sack of seed in the middle
  for (const [x, z] of [[-4.3, 0.5], [4.4, 0.2], [4.2, -0.9]]) { add(new THREE.BoxGeometry(0.9, 0.8, 0.9), texMat(woodTex(), 1, 1, 0x7a5430), x, 0.4, z, g); }   // spare crates at the ends
  add(new THREE.CylinderGeometry(0.42, 0.35, 0.8, 10), 0x8a6a40, -4.4, 0.4, -1.1, g);   // a barrel
  // solid: the counter and the end crates; Tilly stands behind
  solidBoxes.push({ x0: MX - 3.6, x1: MX + 3.6, z0: MZ - 0.6, z1: MZ + 0.6 }, { x0: MX - 4.8, x1: MX - 3.8, z0: MZ - 1.6, z1: MZ + 1.0 }, { x0: MX + 3.9, x1: MX + 4.9, z0: MZ - 1.4, z1: MZ + 0.7 });
}
// ===== silk: a silkworm hutch that turns mulberry leaves into cocoons, and a spinning wheel that spins them into thread =====
var SILK = { built: false, hutch: { n: 0, t: 0 }, HUT: { x: 100.3, z: -5.6 }, WHEEL: { x: 105, z: -4.4 }, SHED: { x: 102.5, z: -4.2, hw: 4.5, hd: 3 } };
const HUTCH_MS = 90000, HUTCH_MAX = 10, SPIN_MS = 2600;
function buildSilkworks(){
  SILK.built = true;
  const add = (geo, m, x, y, z, parent) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const wood = texMat(woodTex(), 1, 1, 0x9a7448), dark = mat(0x5a3e22);
  // the workshop: plank floor, timber walls with a wide doorway on the south side, small windows, and a pitched roof that lifts away while you're inside
  const B = SILK.SHED, shed = new THREE.Group(); shed.position.set(B.x, 0, B.z); town.add(shed);
  const plank = texMat(woodTex(), 3, 2, 0xb08858), wall = texMat(woodTex(), 3, 1, 0x8a6440), beam = mat(0x4a3018);
  add(new THREE.BoxGeometry(B.hw * 2, 0.1, B.hd * 2), plank, 0, 0.05, 0, shed);
  const Hh = 5.2, T = 0.2;   /* tall enough that nobody's head goes through the doorway */
  add(new THREE.BoxGeometry(B.hw * 2, Hh, T), wall, 0, Hh / 2, -B.hd, shed);   // back wall
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(T, Hh, B.hd * 2), wall, sx * B.hw, Hh / 2, 0, shed);   // end walls
  const door = 3.0, side = (B.hw * 2 - door) / 2;
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(side, Hh, T), wall, sx * (door / 2 + side / 2), Hh / 2, B.hd, shed);   // front wall either side of the doorway
  add(new THREE.BoxGeometry(door, 0.7, T), wall, 0, Hh - 0.35, B.hd, shed);   // over the doorway
  for (const [x, z] of [[-B.hw, -B.hd], [B.hw, -B.hd], [-B.hw, B.hd], [B.hw, B.hd], [-door / 2, B.hd], [door / 2, B.hd]]) add(new THREE.BoxGeometry(0.3, Hh + 0.1, 0.3), beam, x, (Hh + 0.1) / 2, z, shed);
  const glass = new THREE.MeshStandardMaterial({ color: 0xffd890, emissive: 0xffa040, emissiveIntensity: 0.5 }); GLOW_MATS.push(glass);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(1.0, 0.7, 0.05), glass, sx * 2.9, 2.5, B.hd + 0.11, shed);   // little windows either side of the door
  const roof = new THREE.Group(); roof.position.y = Hh; shed.add(roof); const roofM = texMat(woodTex(), 4, 2, 0x6a3a22);
  for (const sz of [-1, 1]) { const r = add(new THREE.BoxGeometry(B.hw * 2 + 0.8, 0.14, B.hd + 0.6), roofM, 0, 0.75, sz * (B.hd / 2 + 0.1), roof); r.rotation.x = sz * 0.45; }
  for (const sx of [-1, 1]) { const gab = add(new THREE.CylinderGeometry(0.01, B.hd + 0.1, 1.4, 3, 1), wall, sx * B.hw, 0.7, 0, roof); gab.rotation.y = Math.PI / 2; gab.scale.set(1, 1, 0.14); }
  SILK.roof = roof;
  // walls are solid; the doorway is left open
  const W0 = (x0, x1, z0, z1) => solidBoxes.push({ x0: B.x + x0, x1: B.x + x1, z0: B.z + z0, z1: B.z + z1 });
  W0(-B.hw - 0.15, B.hw + 0.15, -B.hd - 0.15, -B.hd + 0.15); W0(-B.hw - 0.15, -B.hw + 0.15, -B.hd, B.hd); W0(B.hw - 0.15, B.hw + 0.15, -B.hd, B.hd);
  W0(-B.hw, -door / 2, B.hd - 0.15, B.hd + 0.15); W0(door / 2, B.hw, B.hd - 0.15, B.hd + 0.15);
  // the hutch: a roofed rack of three trays where the silkworms munch, against the back wall
  const H = SILK.HUT, hut = new THREE.Group(); hut.position.set(H.x, 0, H.z); town.add(hut);
  for (const [x, z] of [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]]) add(new THREE.BoxGeometry(0.16, 2.4, 0.16), dark, x, 1.2, z, hut);
  const trays = [], worms = [], cocoons = [], leaves = [];
  for (let k = 0; k < 3; k++) { const y = 0.7 + k * 0.55; add(new THREE.BoxGeometry(2.3, 0.08, 1.3), wood, 0, y, 0, hut);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(2.3, 0.14, 0.06), dark, 0, y + 0.08, s * 0.63, hut);
    const lv = add(new THREE.BoxGeometry(2.0, 0.04, 1.0), mat(0x5a9a3a), 0, y + 0.07, 0, hut); lv.visible = false; leaves.push(lv);
    for (let i = 0; i < 4; i++) { const w = add(new THREE.CapsuleGeometry(0.035, 0.14, 2, 6), 0xf2ece0, -0.75 + i * 0.5, y + 0.12, (i % 2 ? 0.2 : -0.2), hut); w.rotation.z = Math.PI / 2; w.visible = false; worms.push(w);
      const c = add(new THREE.SphereGeometry(0.09, 8, 6), 0xf6f2e6, -0.75 + i * 0.5, y + 0.14, (i % 2 ? -0.22 : 0.22), hut); c.scale.set(1, 0.75, 1.5); c.visible = false; cocoons.push(c); } }
  const hutRoof = add(new THREE.BoxGeometry(2.8, 0.1, 1.9), texMat(woodTex(), 2, 1, 0x7a5434), 0, 2.45, 0, hut); hutRoof.rotation.x = 0.12;
  add(new THREE.BoxGeometry(2.3, 1.7, 0.05), mat(0xd8d0b8), 0, 1.4, -0.66, hut);   // a cloth back to keep the wind off
  hut.userData = { action: 'Use', name: 'Silkworm hutch', rec: { kind: 'hutch', state: 'standing', x: H.x, z: H.z, onClick: () => hutchClick() } }; trees.push(hut);
  solidAt(H.x, H.z, 1.3, 0.8);
  Object.assign(SILK, { hut, worms, cocoons, leaves });
  // the bubble that pops up over the hutch when the cocoons are ready, with a cocoon inside
  const bub = document.createElement('div'); bub.className = 'readyBubble'; bub.innerHTML = COCOON_ICON; bub.style.display = 'none'; document.body.appendChild(bub); SILK.bubble = bub;
  // the spinning wheel: a big spoked wheel on a slanted bench, a treadle and a flyer, and a stool
  const W = SILK.WHEEL, wh = new THREE.Group(); wh.position.set(W.x, 0, W.z); wh.rotation.y = Math.PI / 2; town.add(wh);   /* side-on to the east wall, so you sit facing it */
  const bench = add(new THREE.BoxGeometry(1.9, 0.14, 0.42), wood, 0, 0.62, 0, wh); bench.rotation.z = 0.12;
  for (const [x, z] of [[-0.8, 0.15], [0.85, 0.15], [0.85, -0.15]]) { const lg = add(new THREE.CylinderGeometry(0.05, 0.06, 0.66, 6), dark, x, 0.3, z, wh); lg.rotation.x = z > 0 ? 0.2 : -0.2; }
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.08, 1.0, 0.08), dark, -0.35, 1.1, s * 0.12, wh);   // the uprights holding the wheel
  const wheel = new THREE.Group(); wheel.position.set(-0.35, 1.45, 0); wh.add(wheel);
  add(new THREE.TorusGeometry(0.62, 0.05, 6, 28), wood, 0, 0, 0, wheel);
  for (let i = 0; i < 8; i++) { const sp = add(new THREE.CylinderGeometry(0.02, 0.02, 1.24, 4), dark, 0, 0, 0, wheel); sp.rotation.z = i / 8 * Math.PI; }
  add(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8).rotateX(Math.PI / 2), dark, 0, 0, 0, wheel);
  const flyer = new THREE.Group(); flyer.position.set(0.65, 1.05, 0); wh.add(flyer);   // the flyer and bobbin, where the thread winds on
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 6).rotateZ(Math.PI / 2), dark, 0, 0, 0, flyer);
  const bobbin = add(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 10).rotateZ(Math.PI / 2), mat(0xf4eee0), 0.05, 0, 0, flyer);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.04, 0.24, 0.04), dark, 0.05, s * 0.12, 0, flyer).position.y = s * 0.1;
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.95, 4).rotateZ(1.35), mat(0xf8f4ea), 0.15, 1.25, 0, wh);   // the drive band
  const treadle = new THREE.Group(); treadle.position.set(-0.2, 0.12, 0.35); wh.add(treadle);
  add(new THREE.BoxGeometry(0.5, 0.05, 0.3), wood, 0.2, 0, 0, treadle);
  const stool = add(new THREE.CylinderGeometry(0.3, 0.32, 0.12, 10), wood, 1.2, 0.55, 1.5, wh); for (let i = 0; i < 3; i++) { const a = i * 2.1; add(new THREE.CylinderGeometry(0.03, 0.04, 0.55, 5), dark, 1.2 + Math.sin(a) * 0.2, 0.27, 1.5 + Math.cos(a) * 0.2, wh); }   /* a spare stool, off to the side */
  wh.userData = { action: 'Spin', name: 'Spinning wheel', rec: { kind: 'wheel', state: 'standing', x: W.x, z: W.z, onClick: () => wheelClick() } }; trees.push(wh);
  solidAt(W.x, W.z, 0.4, 1.0);
  Object.assign(SILK, { wheel, flyer, bobbin, treadle, wheelGroup: wh });
}
function hutchReady(){ return SILK.hutch.n > 0 && Date.now() - SILK.hutch.t >= HUTCH_MS; }
