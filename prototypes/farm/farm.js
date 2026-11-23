// built inside the real game, using its own helpers: mat (faceted), texMat, woodTex, roofTex, dirtMat, makeChibi, chibiPart
(() => {
const FX = 4, FZ = 40;   // the open ground south of the hall
const root = new THREE.Group(); root.position.set(FX, 0, FZ); town.add(root);
const fl = (parent, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); parent.add(o); return o; };
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const planks = (rx, ry, col) => texMat(woodTex(), rx, ry, col);
// the barn: red plank walls, white trim, double doors, a gambrel roof in the game's shingles
const barn = new THREE.Group(); barn.position.set(-7, 0, -6); barn.scale.setScalar(1.45); root.add(barn);
fl(barn, B(6, 3.4, 5), planks(4, 2, 0xb04434), 0, 1.7, 0);
fl(barn, B(2.4, 2.6, 0.15), planks(2, 2, 0x8a2e24), 0, 1.3, 2.56);
for (const d of [-1, 1]) { const x = fl(barn, B(0.12, 3.2, 0.06), 0xe8e2d4, 0, 1.3, 2.66); x.rotation.z = d * 0.74; }
fl(barn, B(2.6, 0.14, 0.1), 0xe8e2d4, 0, 2.66, 2.62); for (const sx of [-1, 1]) fl(barn, B(0.14, 2.7, 0.1), 0xe8e2d4, sx * 1.27, 1.32, 2.62);
for (const sx of [-1, 1]) for (const sz of [-1, 1]) fl(barn, B(0.18, 3.4, 0.18), 0xe8e2d4, sx * 3, 1.7, sz * 2.5);
const rs = new THREE.Shape(); rs.moveTo(-3.4, 0); rs.lineTo(-2.2, 1.4); rs.lineTo(0, 2.4); rs.lineTo(2.2, 1.4); rs.lineTo(3.4, 0); rs.lineTo(-3.4, 0);
const rm = new THREE.MeshStandardMaterial({ map: roofTex, color: 0x6a5a4a, flatShading: true });
fl(barn, new THREE.ExtrudeGeometry(rs, { depth: 5.6, bevelEnabled: false }), rm, 0, 3.4, -2.8);
const gs = new THREE.Shape(); gs.moveTo(-3, 0); gs.lineTo(-2, 1.2); gs.lineTo(0, 2.1); gs.lineTo(2, 1.2); gs.lineTo(3, 0);
fl(barn, new THREE.ExtrudeGeometry(gs, { depth: 0.1, bevelEnabled: false }), planks(3, 1, 0xb04434), 0, 3.4, 2.5);
fl(barn, B(1.0, 0.8, 0.12), 0x2a1a10, 0, 4.25, 2.62); fl(barn, B(0.9, 0.3, 0.3), 0xd8b850, 0, 4.0, 2.7);
// hay bales by the door
for (const [x, z, r] of [[-1.2, 2.2, 0.3], [-0.1, 2.6, -0.2]]) { const h = fl(root, new THREE.CylinderGeometry(0.8, 0.8, 1.3, 9), 0xd8b850, -7 + x * 1.45, 0.8, -6 + z * 1.45 + 2); h.rotation.set(Math.PI / 2, 0, r); }
// the paddock fence
const fence = (x0, z0, x1, z1) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 2.2), L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i <= n; i++) fl(root, B(0.24, 1.45, 0.24), 0x7a5a36, x0 + (x1 - x0) * i / n, 0.72, z0 + (z1 - z0) * i / n);
  for (const y of [0.55, 1.15]) { const r = fl(root, B(0.12, 0.14, L), 0x8a6a42, (x0 + x1) / 2, y, (z0 + z1) / 2); r.rotation.y = a; } };
fence(2, -10, 14, -10); fence(14, -10, 14, 2); fence(14, 2, 9, 2); fence(6, 2, 2, 2); fence(2, 2, 2, -10);
fl(root, B(2.2, 0.7, 0.9), planks(2, 1, 0x7a5a3a), 12, 0.35, -8.6); fl(root, B(2.0, 0.06, 0.7), new THREE.MeshStandardMaterial({ color: 0x3a7ab0, roughness: 0.1 }), 12, 0.68, -8.6);
// crop rows of tilled soil, in the path's dirt
const field = new THREE.Group(); field.position.set(-4, 0, 5); root.add(field);
for (let r = 0; r < 5; r++) {
  const row = new THREE.Mesh(B(10, 0.22, 1.0), mat(0x5a3e24)); row.position.set(0, 0.11, r * 1.5); field.add(row);
  for (let i = 0; i < 9; i++) { const x = -4.4 + i * 1.1, z = r * 1.5;
    if (r < 2) { const c = fl(field, new THREE.IcosahedronGeometry(0.38, 0), [0x5a9a3a, 0x6aaa48][i % 2], x, 0.45, z); c.scale.y = 0.75; }
    else if (r < 4) for (let k = 0; k < 3; k++) { fl(field, new THREE.CylinderGeometry(0.03, 0.03, 1.05, 4), 0xc8a850, x + (k - 1) * 0.16, 0.7, z); fl(field, new THREE.ConeGeometry(0.08, 0.3, 5), 0xd8b860, x + (k - 1) * 0.16, 1.3, z); }
    else { fl(field, new THREE.ConeGeometry(0.1, 0.22, 5).rotateX(Math.PI), 0xd8702a, x, 0.28, z); for (const s2 of [-1, 1]) { const lf = fl(field, new THREE.ConeGeometry(0.07, 0.55, 4), 0x3f8a32, x + s2 * 0.07, 0.6, z); lf.rotation.z = s2 * 0.3; } } }
}
const sc = new THREE.Group(); sc.position.set(3.2, 0, 8); sc.scale.setScalar(1.4); root.add(sc);
fl(sc, B(0.12, 2.4, 0.12), 0x6a4a2a, 0, 1.2, 0); fl(sc, B(1.8, 0.1, 0.1), 0x6a4a2a, 0, 1.8, 0);
fl(sc, B(0.7, 0.8, 0.35), 0x4a6a8a, 0, 1.6, 0); fl(sc, new THREE.IcosahedronGeometry(0.28, 0), 0xd8c898, 0, 2.35, 0);
fl(sc, new THREE.CylinderGeometry(0.5, 0.5, 0.05, 8), 0xd8b860, 0, 2.55, 0); fl(sc, new THREE.CylinderGeometry(0.24, 0.28, 0.25, 8), 0xd8b860, 0, 2.68, 0);
// ----- animals in the world's faceted low-poly style: flat-shaded, no outline, a few big facets -----
const lowBall = (r, detail = 0) => new THREE.IcosahedronGeometry(r, detail);
const eyeD = (parent, x, y, z) => fl(parent, B(0.07, 0.09, 0.04), 0x15110d, x, y, z);
const leg4 = (g, col, w, d, h, r) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) fl(g, new THREE.CylinderGeometry(r, r * 0.85, h, 6), col, sx * w, h / 2, sz * d); };
const animal = (x, z, ry, k) => { const g = new THREE.Group(); g.position.set(FX + x, 0, FZ + z); g.rotation.y = ry; g.scale.setScalar(k); scene.add(g); return g; };
function cow(x, z, ry){ const g = animal(x, z, ry, 1.45);
  leg4(g, 0xe8e2d6, 0.38, 0.6, 0.8, 0.12); for (const sx of [-1, 1]) for (const sz of [-1, 1]) fl(g, B(0.22, 0.12, 0.24), 0x3a2a20, sx * 0.38, 0.06, sz * 0.6);
  const body = fl(g, B(0.95, 0.75, 1.7), 0xeee8dc, 0, 1.15, 0); 
  fl(g, B(0.97, 0.5, 0.5), 0x2a2622, 0, 1.25, 0.3); fl(g, B(0.6, 0.45, 0.45), 0x2a2622, 0.2, 1.2, -0.45);   // patches
  const head = new THREE.Group(); head.position.set(0, 1.45, 1.05); g.add(head);
  fl(head, B(0.55, 0.55, 0.6), 0xeee8dc, 0, 0, 0); fl(head, B(0.5, 0.3, 0.25), 0xd89890, 0, -0.17, 0.35);
  for (const s of [-1, 1]) { eyeD(head, s * 0.17, 0.1, 0.31); const h = fl(head, new THREE.ConeGeometry(0.06, 0.25, 5), 0xd8ccb0, s * 0.22, 0.36, -0.1); h.rotation.z = s * -0.5; fl(head, B(0.22, 0.1, 0.1), 0xeee8dc, s * 0.36, 0.12, -0.05); }
  fl(g, B(0.08, 0.6, 0.08), 0xeee8dc, 0, 1.05, -0.88).rotation.x = 0.3; return g; }
function sheep(x, z, ry){ const g = animal(x, z, ry, 1.45);
  leg4(g, 0x2a2622, 0.25, 0.35, 0.55, 0.07);
  for (const [px, py, pz, r] of [[0, 0.95, 0, 0.55], [0.25, 1.05, 0.3, 0.38], [-0.25, 1.05, 0.25, 0.38], [0.25, 1.0, -0.3, 0.38], [-0.25, 1.02, -0.3, 0.4], [0, 1.3, 0, 0.36]]) fl(g, lowBall(r, 0), 0xeeece4, px, py, pz);
  const head = new THREE.Group(); head.position.set(0, 1.12, 0.66); g.add(head);
  fl(head, B(0.34, 0.38, 0.42), 0x2e2a26, 0, 0, 0); fl(head, lowBall(0.18), 0xeeece4, 0, 0.24, -0.08);
  for (const s of [-1, 1]) { fl(head, B(0.04, 0.05, 0.03), 0xd8d0b8, s * 0.1, 0.06, 0.22); fl(head, B(0.2, 0.08, 0.1), 0x2e2a26, s * 0.24, 0.08, -0.02); } return g; }
function pig(x, z, ry){ const g = animal(x, z, ry, 1.45);
  leg4(g, 0xe0a0a0, 0.26, 0.4, 0.38, 0.09);
  fl(g, lowBall(0.6, 1), 0xe8a8a6, 0, 0.75, 0).scale.set(0.85, 0.75, 1.15);
  const head = new THREE.Group(); head.position.set(0, 0.85, 0.65); g.add(head);
  fl(head, lowBall(0.36, 0), 0xe8a8a6, 0, 0, 0); fl(head, new THREE.CylinderGeometry(0.16, 0.16, 0.14, 7).rotateX(Math.PI / 2), 0xd88a88, 0, -0.06, 0.34);
  for (const s of [-1, 1]) { eyeD(head, s * 0.15, 0.1, 0.28); const e = fl(head, new THREE.ConeGeometry(0.12, 0.2, 4), 0xd89090, s * 0.22, 0.3, 0); e.rotation.set(0.4, 0, s * -0.4); }
  const t = fl(g, new THREE.TorusGeometry(0.08, 0.03, 4, 6, Math.PI * 1.6), 0xd89090, 0, 0.85, -0.72); t.rotation.y = Math.PI / 2; return g; }
function chicken(x, z, ry, col){ const g = animal(x, z, ry, 1.1);
  for (const s of [-1, 1]) fl(g, new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4), 0xd89020, s * 0.1, 0.15, 0);
  fl(g, lowBall(0.3, 0), col, 0, 0.45, 0).scale.set(0.85, 0.85, 1.1);
  const tl = fl(g, new THREE.ConeGeometry(0.18, 0.32, 5), col, 0, 0.62, -0.3); tl.rotation.x = -0.8;
  const head = new THREE.Group(); head.position.set(0, 0.78, 0.22); g.add(head);
  fl(head, lowBall(0.17, 0), col, 0, 0, 0); const bk = fl(head, new THREE.ConeGeometry(0.05, 0.14, 4), 0xe89020, 0, -0.02, 0.2); bk.rotation.x = Math.PI / 2;
  fl(head, B(0.04, 0.1, 0.12), 0xc82828, 0, 0.18, 0.02); fl(head, B(0.04, 0.08, 0.04), 0xc82828, 0, -0.1, 0.15);
  for (const s of [-1, 1]) eyeD(head, s * 0.09, 0.04, 0.13); return g; }
cow(6, -7, -0.6); cow(11, -3, 2.6); sheep(4.5, -2.5, 0.8); sheep(6.5, -0.8, 1.6); sheep(11.5, -7.5, -0.4); pig(9, 0.2, 0.3);
chicken(-3, -1, 0.4, 0xf2eee4); chicken(-2, 0.2, -0.8, 0xb87840); chicken(-4.4, 0.6, 1.8, 0xf2eee4); chicken(-1.2, -1.6, 2.6, 0xb87840);
// ----- the farmers: the in-game character model, with a straw hat, overalls or an apron -----
function strawHat(fig){ const h = fig.userData.chibi.head;
  chibiPart(h, new THREE.CylinderGeometry(0.98, 1.02, 0.06, 24), 0xe0c470, 0, 0.42, -0.02); chibiPart(h, new THREE.CylinderGeometry(0.48, 0.56, 0.4, 20), 0xe0c470, 0, 0.62, -0.02);
  chibiPart(h, new THREE.CylinderGeometry(0.565, 0.565, 0.1, 20), 0xa84434, 0, 0.48, -0.02, false); }
const farmer = makeChibi({ gender: 'male', hair: 'short', hairCol: 0x7a4a22, skin: 0xd9a070, shirt: 0xc8a060, pants: 0x3a5a8a });
farmer.position.set(FX - 5, 0, FZ + 1.5); farmer.rotation.y = 0.6; scene.add(farmer); strawHat(farmer);
const fb = farmer.userData.chibi.body; chibiPart(fb, new THREE.BoxGeometry(0.5, 0.42, 0.06), 0x3a5a8a, 0, 1.1, 0.33); for (const s of [-1, 1]) chibiPart(fb, new THREE.BoxGeometry(0.08, 0.5, 0.05), 0x3a5a8a, s * 0.18, 1.4, 0.32, false);
const fork = new THREE.Group(); farmer.userData.chibi.arms[1].add(fork); fork.position.set(0, -0.45, 0.05);
chibiPart(fork, new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6), 0x7a4d22, 0, 0.4, 0.06); chibiPart(fork, new THREE.BoxGeometry(0.34, 0.05, 0.05), 0x9aa0a8, 0, 1.5, 0.06);
for (const dx of [-0.14, 0, 0.14]) chibiPart(fork, new THREE.CylinderGeometry(0.022, 0.012, 0.45, 5), 0x9aa0a8, dx, 1.74, 0.06, false);
const wife = makeChibi({ gender: 'female', hair: 'long', hairCol: 0xd8b058, skin: 0xf0c8a0, shirt: 0xe8e0d0, pants: 0x5a7a40 });
wife.position.set(FX - 2, 0, FZ + 2.6); wife.rotation.y = -0.3; scene.add(wife); strawHat(wife);
chibiPart(wife.userData.chibi.body, new THREE.BoxGeometry(0.52, 0.5, 0.05), 0xf0ece0, 0, 0.82, 0.42);
const wa = wife.userData.chibi.arms; wa[0].rotation.x = -0.9; wa[1].rotation.x = -0.9;
const bask = new THREE.Group(); bask.position.set(0, 0.92, 0.7); wife.userData.chibi.body.add(bask);
chibiPart(bask, new THREE.CylinderGeometry(0.3, 0.24, 0.26, 12), 0x9a7040, 0, 0, 0); for (let i = 0; i < 5; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), toonMat(0xf6eee0)); e.scale.y = 1.25; e.position.set(Math.cos(i * 1.3) * 0.14, 0.15, Math.sin(i * 1.3) * 0.14); bask.add(e); }
window.__farm = { farmer, wife, poseLoop: () => { poseChibi(farmer, 'idle', 0); } };
// keep their idle animation going
const tick = () => { poseChibi(farmer, 'idle', 0); poseChibi(wife, 'idle', 0); wa[0].rotation.x = -0.9; wa[1].rotation.x = -0.9; requestAnimationFrame(tick); }; tick();
})();
