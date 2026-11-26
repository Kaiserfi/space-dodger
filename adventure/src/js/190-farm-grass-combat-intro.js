// ----- the farm, east of the hall between the quarry road and the river: a barn, a paddock of animals, crops and the two farmers -----
const ANIMALS = [];
function buildFarm(){
  const fl = (parent, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); parent.add(o); return o; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const planks = (rx, ry, col) => texMat(woodTex(), rx, ry, col);
  // the barn: red plank walls, white trim, X-braced double doors and a gambrel roof in the village shingles, facing the field
  const BX = 51, BZ = -5;
  const barn = new THREE.Group(); barn.position.set(BX, 0, BZ); barn.scale.setScalar(1.45); town.add(barn);
  fl(barn, B(6, 3.4, 5), planks(4, 2, 0xb04434), 0, 1.7, 0);
  fl(barn, B(2.4, 2.6, 0.15), planks(2, 2, 0x8a2e24), 0, 1.3, 2.56);
  for (const d of [-1, 1]) fl(barn, B(0.12, 3.2, 0.06), 0xe8e2d4, 0, 1.3, 2.66).rotation.z = d * 0.74;
  fl(barn, B(2.6, 0.14, 0.1), 0xe8e2d4, 0, 2.66, 2.62); for (const sx of [-1, 1]) fl(barn, B(0.14, 2.7, 0.1), 0xe8e2d4, sx * 1.27, 1.32, 2.62);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fl(barn, B(0.18, 3.4, 0.18), 0xe8e2d4, sx * 3, 1.7, sz * 2.5);
  const rs = new THREE.Shape(); rs.moveTo(-3.4, 0); rs.lineTo(-2.2, 1.4); rs.lineTo(0, 2.4); rs.lineTo(2.2, 1.4); rs.lineTo(3.4, 0); rs.lineTo(-3.4, 0);
  fl(barn, new THREE.ExtrudeGeometry(rs, { depth: 5.6, bevelEnabled: false }), new THREE.MeshStandardMaterial({ map: roofTex, color: 0x6a5a4a, flatShading: true }), 0, 3.4, -2.8);
  const gs = new THREE.Shape(); gs.moveTo(-3, 0); gs.lineTo(-2, 1.2); gs.lineTo(0, 2.1); gs.lineTo(2, 1.2); gs.lineTo(3, 0);
  fl(barn, new THREE.ExtrudeGeometry(gs, { depth: 0.1, bevelEnabled: false }), planks(3, 1, 0xb04434), 0, 3.4, 2.5);
  fl(barn, B(1.0, 0.8, 0.12), 0x2a1a10, 0, 4.25, 2.62); fl(barn, B(0.9, 0.3, 0.3), 0xd8b850, 0, 4.0, 2.7);
  solidBoxes.push({ x0: BX - 4.6, x1: BX + 4.6, z0: BZ - 3.8, z1: BZ + 3.8 });
  // hay bales beside the doors
  for (const [x, z, r] of [[BX - 6, BZ + 2.5, 0.3], [BX - 6.2, BZ - 0.5, -0.2]]) { fl(town, new THREE.CylinderGeometry(0.8, 0.8, 1.3, 9), 0xd8b850, x, 0.8, z).rotation.set(Math.PI / 2, 0, r); solidBoxes.push({ x0: x - 0.9, x1: x + 0.9, z0: z - 0.8, z1: z + 0.8 }); }
  // the paddock: a post-and-rail fence with a gate gap on the village side, and a water trough
  const P0 = [34, -9], P1 = [44, 1], gate = [38.2, 40.6];
  const fence = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.2)), a = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i <= n; i++) fl(town, B(0.24, 1.45, 0.24), 0x7a5a36, x0 + (x1 - x0) * i / n, 0.72, z0 + (z1 - z0) * i / n);
    for (const y of [0.55, 1.15]) { const r = fl(town, B(0.12, 0.14, L), 0x8a6a42, (x0 + x1) / 2, y, (z0 + z1) / 2); r.rotation.y = a; }
    solidBoxes.push({ x0: Math.min(x0, x1) - 0.2, x1: Math.max(x0, x1) + 0.2, z0: Math.min(z0, z1) - 0.2, z1: Math.max(z0, z1) + 0.2 }); };
  fence(P0[0], P0[1], P1[0], P0[1]); fence(P1[0], P0[1], P1[0], P1[1]); fence(P0[0], P0[1], P0[0], P1[1]);
  fence(P0[0], P1[1], gate[0], P1[1]); fence(gate[1], P1[1], P1[0], P1[1]);
  fl(town, B(2.2, 0.7, 0.9), planks(2, 1, 0x7a5a3a), 42, 0.35, -7.6); fl(town, B(2.0, 0.06, 0.7), new THREE.MeshStandardMaterial({ color: 0x3a7ab0, roughness: 0.1 }), 42, 0.68, -7.6);
  solidBoxes.push({ x0: 40.8, x1: 43.2, z0: -8.2, z1: -7 });
  // the field: tilled rows of cabbages, wheat and carrots, and a scarecrow keeping watch
  const field = new THREE.Group(); field.position.set(53, 0, 4.5); town.add(field);
  for (let r = 0; r < 5; r++) {
    fl(field, B(10, 0.22, 1.0), 0x5a3e24, 0, 0.11, r * 1.5);
    for (let i = 0; i < 9; i++) { const x = -4.4 + i * 1.1, z = r * 1.5;
      if (r < 2) fl(field, new THREE.IcosahedronGeometry(0.38, 0), [0x5a9a3a, 0x6aaa48][i % 2], x, 0.45, z).scale.y = 0.75;
      else if (r < 4) for (let k = 0; k < 3; k++) { fl(field, new THREE.CylinderGeometry(0.03, 0.03, 1.05, 4), 0xc8a850, x + (k - 1) * 0.16, 0.7, z); fl(field, new THREE.ConeGeometry(0.08, 0.3, 5), 0xd8b860, x + (k - 1) * 0.16, 1.3, z); }
      else { fl(field, new THREE.ConeGeometry(0.1, 0.22, 5).rotateX(Math.PI), 0xd8702a, x, 0.28, z); for (const s2 of [-1, 1]) fl(field, new THREE.ConeGeometry(0.07, 0.55, 4), 0x3f8a32, x + s2 * 0.07, 0.6, z).rotation.z = s2 * 0.3; } }
  }
  const sc = new THREE.Group(); sc.position.set(59.5, 0, 7.5); sc.scale.setScalar(1.4); town.add(sc);
  fl(sc, B(0.12, 2.4, 0.12), 0x6a4a2a, 0, 1.2, 0); fl(sc, B(1.8, 0.1, 0.1), 0x6a4a2a, 0, 1.8, 0); fl(sc, B(0.7, 0.8, 0.35), 0x4a6a8a, 0, 1.6, 0);
  fl(sc, new THREE.IcosahedronGeometry(0.28, 0), 0xd8c898, 0, 2.35, 0); fl(sc, new THREE.CylinderGeometry(0.5, 0.5, 0.05, 8), 0xd8b860, 0, 2.55, 0); fl(sc, new THREE.CylinderGeometry(0.24, 0.28, 0.25, 8), 0xd8b860, 0, 2.68, 0);
  solidBoxes.push({ x0: 59, x1: 60, z0: 7, z1: 8 });
  // the farm road, off the hall road: to the paddock gate, and on to the barn doors
  roadPath([[22, 16], [28, 16.6], [34, 18]]);
  roadPath([[34, 18], [37.5, 9], [39.4, 3]]);
  roadPath([[37.5, 9], [44, 3.2], [BX, BZ + 5.3]]);
  // ----- the animals: faceted low-poly, like the trees and rocks -----
  const lowBall = (r, d = 0) => new THREE.IcosahedronGeometry(r, d);
  const eyeD = (parent, x, y, z) => fl(parent, B(0.07, 0.09, 0.04), 0x15110d, x, y, z);
  const leg4 = (g, col, w, d, h, r) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) fl(g, new THREE.CylinderGeometry(r, r * 0.85, h, 6), col, sx * w, h / 2, sz * d); };
  const animal = (kind, name, x, z, k, box, info) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.random() * 6; g.scale.setScalar(k); scene.add(g);
    const rec = { kind: 'animal', animal: kind, name, info, x, z, s: 0.8, state: 'standing' };
    g.userData = { action: 'Pet', name, rec }; trees.push(g);
    addWander(g, rec, null, { lx: x, lz: z, rad: 3, box, k: 1, ox: 0, oz: 0 });
    ANIMALS.push({ g, rec }); return g; };
  const pen = { x0: P0[0] + 1.2, x1: P1[0] - 1.2, z0: P0[1] + 1.2, z1: P1[1] - 1.2 }, yard = { x0: 41.5, x1: 46.5, z0: 1.8, z1: 4 };
  function cow(name, x, z, info){ const g = animal('cow', name, x, z, 1.45, pen, info);
    leg4(g, 0xe8e2d6, 0.38, 0.6, 0.8, 0.12); for (const sx of [-1, 1]) for (const sz of [-1, 1]) fl(g, B(0.22, 0.12, 0.24), 0x3a2a20, sx * 0.38, 0.06, sz * 0.6);
    fl(g, B(0.95, 0.75, 1.7), 0xeee8dc, 0, 1.15, 0); fl(g, B(0.97, 0.5, 0.5), 0x2a2622, 0, 1.25, 0.3); fl(g, B(0.6, 0.45, 0.45), 0x2a2622, 0.2, 1.2, -0.45);
    const head = new THREE.Group(); head.position.set(0, 1.45, 1.05); g.add(head);
    fl(head, B(0.55, 0.55, 0.6), 0xeee8dc, 0, 0, 0); fl(head, B(0.5, 0.3, 0.25), 0xd89890, 0, -0.17, 0.35);
    for (const sx of [-1, 1]) { eyeD(head, sx * 0.17, 0.1, 0.31); fl(head, new THREE.ConeGeometry(0.06, 0.25, 5), 0xd8ccb0, sx * 0.22, 0.36, -0.1).rotation.z = sx * -0.5; fl(head, B(0.22, 0.1, 0.1), 0xeee8dc, sx * 0.36, 0.12, -0.05); }
    fl(g, B(0.08, 0.6, 0.08), 0xeee8dc, 0, 1.05, -0.88).rotation.x = 0.3; g.userData.head = head; }
  function sheep(name, x, z, info){ const g = animal('sheep', name, x, z, 1.45, pen, info);
    leg4(g, 0x2a2622, 0.25, 0.35, 0.55, 0.07);
    for (const [px, py, pz, r] of [[0, 0.95, 0, 0.55], [0.25, 1.05, 0.3, 0.38], [-0.25, 1.05, 0.25, 0.38], [0.25, 1.0, -0.3, 0.38], [-0.25, 1.02, -0.3, 0.4], [0, 1.3, 0, 0.36]]) fl(g, lowBall(r), 0xeeece4, px, py, pz);
    const head = new THREE.Group(); head.position.set(0, 1.12, 0.66); g.add(head);
    fl(head, B(0.34, 0.38, 0.42), 0x2e2a26, 0, 0, 0); fl(head, lowBall(0.18), 0xeeece4, 0, 0.24, -0.08);
    for (const sx of [-1, 1]) { fl(head, B(0.04, 0.05, 0.03), 0xd8d0b8, sx * 0.1, 0.06, 0.22); fl(head, B(0.2, 0.08, 0.1), 0x2e2a26, sx * 0.24, 0.08, -0.02); } g.userData.head = head; }
  function pig(name, x, z, info){ const g = animal('pig', name, x, z, 1.45, pen, info);
    leg4(g, 0xe0a0a0, 0.26, 0.4, 0.38, 0.09); fl(g, lowBall(0.6, 1), 0xe8a8a6, 0, 0.75, 0).scale.set(0.85, 0.75, 1.15);
    const head = new THREE.Group(); head.position.set(0, 0.85, 0.65); g.add(head);
    fl(head, lowBall(0.36), 0xe8a8a6, 0, 0, 0); fl(head, new THREE.CylinderGeometry(0.16, 0.16, 0.14, 7).rotateX(Math.PI / 2), 0xd88a88, 0, -0.06, 0.34);
    for (const sx of [-1, 1]) { eyeD(head, sx * 0.15, 0.1, 0.28); const e = fl(head, new THREE.ConeGeometry(0.12, 0.2, 4), 0xd89090, sx * 0.22, 0.3, 0); e.rotation.set(0.4, 0, sx * -0.4); }
    fl(g, new THREE.TorusGeometry(0.08, 0.03, 4, 6, Math.PI * 1.6), 0xd89090, 0, 0.85, -0.72).rotation.y = Math.PI / 2; g.userData.head = head; }
  function chicken(name, x, z, col, info){ const g = animal('chicken', name, x, z, 1.1, yard, info);
    for (const sx of [-1, 1]) fl(g, new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4), 0xd89020, sx * 0.1, 0.15, 0);
    fl(g, lowBall(0.3), col, 0, 0.45, 0).scale.set(0.85, 0.85, 1.1); fl(g, new THREE.ConeGeometry(0.18, 0.32, 5), col, 0, 0.62, -0.3).rotation.x = -0.8;
    const head = new THREE.Group(); head.position.set(0, 0.78, 0.22); g.add(head);
    fl(head, lowBall(0.17), col, 0, 0, 0); fl(head, new THREE.ConeGeometry(0.05, 0.14, 4), 0xe89020, 0, -0.02, 0.2).rotation.x = Math.PI / 2;
    fl(head, B(0.04, 0.1, 0.12), 0xc82828, 0, 0.18, 0.02); fl(head, B(0.04, 0.08, 0.04), 0xc82828, 0, -0.1, 0.15);
    for (const sx of [-1, 1]) eyeD(head, sx * 0.09, 0.04, 0.13); g.userData.head = head; }
  cow('Buttercup', 37, -6, 'Buttercup the cow. She chews slowly and judges you.'); cow('Clover', 41, -3, 'Clover the cow. She has a nose for apples.');
  sheep('Woolsley', 36.5, -2, 'Woolsley the sheep. Extremely fluffy. Mildly suspicious.'); sheep('Bramble', 39, -7.2, 'Bramble the sheep. Has burrs in places burrs should not be.'); sheep('Puff', 42, -5.5, 'Puff the sheep. Mostly wool, a little sheep.');
  pig('Truffle', 39.5, -1.5, 'Truffle the pig. Covered in mud and very proud of it.');
  chicken('Henrietta', 42.5, 2.6, 0xf2eee4, 'Henrietta the hen. In charge of the other hens.'); chicken('Pecks', 44.5, 3.2, 0xb87840, 'Pecks the hen. Pecks.'); chicken('Dot', 45.5, 2.2, 0xf2eee4, 'Dot the hen. Small, loud.'); chicken('Ginger', 43.6, 3.6, 0xb87840, 'Ginger the hen. Thinks she is a rooster.');
  // ----- the farmers -----
  const overalls = fig => { const b = fig.userData.chibi.body; chibiPart(b, new THREE.BoxGeometry(0.5, 0.42, 0.06), 0x3a5a8a, 0, 1.1, 0.33); for (const sx of [-1, 1]) chibiPart(b, new THREE.BoxGeometry(0.08, 0.5, 0.05), 0x3a5a8a, sx * 0.18, 1.4, 0.32, false); };
  const bram = addWorldNpc(50, 13.2, FARMERS[0]); overalls(bram);
  const fork = new THREE.Group(); fork.position.set(0, -0.45, 0.05); bram.userData.chibi.arms[1].add(fork);
  chibiPart(fork, new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6), 0x7a4d22, 0, 0.4, 0.06); chibiPart(fork, new THREE.BoxGeometry(0.42, 0.06, 0.06), 0x9aa0a8, 0, 1.52, 0.06);
  for (const dx of [-0.18, 0, 0.18]) chibiPart(fork, new THREE.CylinderGeometry(0.03, 0.015, 0.55, 5), 0x9aa0a8, dx, 1.8, 0.06, false);
  const hilde = addWorldNpc(44, 5.6, FARMERS[1]);
  const bask = new THREE.Group(); bask.position.set(0.02, -0.55, 0.12); bask.rotation.x = 0.35; hilde.userData.chibi.arms[1].add(bask);   /* hanging level from her right hand by its handle */
  chibiPart(bask, new THREE.CylinderGeometry(0.26, 0.2, 0.24, 12), 0x9a7040, 0, -0.36, 0);
  chibiPart(bask, new THREE.TorusGeometry(0.22, 0.025, 6, 14, Math.PI), 0x7a5430, 0, -0.24, 0, false);
  for (let i = 0; i < 5; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), toonMat(0xf6eee0)); e.scale.y = 1.25; e.position.set(Math.cos(i * 1.3) * 0.12, -0.22, Math.sin(i * 1.3) * 0.12); bask.add(e); }
  NPC_SPOTS.push([BX, BZ], [39, -4], [53, 7.5], [44, 3]);
}
const FARMERS = [
  { name: 'Bram', title: 'the farmer', rad: 3, hat: 'straw', look: { gender: 'male', skin: 0xd9a070, hair: 'short', hairCol: 0x7a4a22, shirt: 0xc8a060, pants: 0x3a5a8a },
    talks: [
      ["Mornin'! You've the look of someone who's never been chased by a goose.", "Bram. This is my farm, and those are my girls — Buttercup and Clover. Best cows in the valley.", "Don't tell Hilde I said that. She reckons the hens are the best. She's wrong, but don't tell her."],
      ["See them cabbages? Grew 'em myself. Talked to every single one. A cabbage likes a bit of chat."],
      ["Truffle got into Brenna's flour sacks last week. Came out looking like a ghost. Squealed for an hour."],
      ["Woolsley's been giving me funny looks. Reckon he knows I sold his winter coat to Mara."],
      ["Hobb says there's goblins out west. If they come for my cabbages, they'll meet my pitchfork."] ],
    barks: ["Come on, girls, dinner time!", "Look at these cabbages. Best crop I've had in years.", "Who left the paddock gate open? Truffle's out again!"] },
  { name: 'Hilde', title: 'the farmer\'s wife', rad: 1.6, hat: 'straw', look: { gender: 'female', skin: 0xf0c8a0, hair: 'lowbun', hairCol: 0xd8b058, eye: 0x5a3418, brows: 'soft', cheeks: 'rosy', shirt: 0xe8e0d0, pants: 0x5a7a40, outfit: 'bodice', dressCol: 0x8a5a3a, trimCol: 0xf0e8d8 },
    after: (sp) => { sp.userData.chibi.arms[1].rotation.set(-0.35, 0, 0.45); },   /* the egg basket held steady at her side by its handle; the other arm swings as she walks */
    talks: [
      ["Mind the chickens — they bite. Well, peck. Same thing, if you ask Pecks.", "I'm Hilde. I run this farm. Bram thinks he runs it, which is sweet.", "Four hens: Henrietta, Pecks, Dot and Ginger. Ginger thinks she's a rooster. We let her."],
      ["Eggs every morning, rain or shine. More reliable than Bram, and they don't talk to the cabbages."],
      ["If Bram tells you his cows are the best in the valley, smile and nod. Keeps him happy."],
      ["Brenna gets her eggs from me. Wenna gets her gossip from me. Everyone gets something from Hilde."],
      ["Henrietta laid a double-yolker yesterday. She's been insufferable ever since."] ],
    barks: ["Here, chick chick chick! Come and get your breakfast.", "Ginger, get down off that fence this minute!", "Bram! Have you seen where Truffle's got to?"] },
];
// farm animals make a sound now and then: one at a time, every half a minute or so, and only when you are nearby
let nextAnimalSound = performance.now() + 20000;
function updateAnimals(){
  const now = performance.now();
  for (const a of ANIMALS) { const h = a.g.userData.head; if (h) h.rotation.x = Math.sin(now / 900 + a.g.id) * 0.12 + (a.rec.animal === 'chicken' ? Math.max(0, Math.sin(now / 300 + a.g.id * 3)) * 0.5 : 0); }
  if (!hero || now < nextAnimalSound) return;
  nextAnimalSound = now + 25000 + Math.random() * 35000;
  const near = ANIMALS.filter(a => a.g.position.distanceTo(hero.position) < 30);
  if (!near.length) return;
  const a = near[Math.floor(Math.random() * near.length)];
  animalSound(a.rec.animal, Math.max(0.15, 1 - a.g.position.distanceTo(hero.position) / 30));
}
function petAnimal(rec){ showToast(rec.info); animalSound(rec.animal, 1); }
// the voices: a buzzing tone shaped by a few vowel-like filters, plus some breath, like the game's other sounds
function animalSound(kind, vol = 1){
  const ctx = audio(); if (!ctx) return; const t = ctx.currentTime + 0.02;
  const out = ctx.createGain(); out.gain.value = 0.5 * vol; out.connect(sfxOut(ctx));
  const voice = (start, dur, f0, f1, formants, tremolo = 0, breath = 0, rough = 0) => {
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0 * (0.95 + Math.random() * 0.1), t + start); o.frequency.linearRampToValueAtTime(f1, t + start + dur);
    if (rough) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 33; lg.gain.value = f0 * rough; l.connect(lg); lg.connect(o.frequency); l.start(t + start); l.stop(t + start + dur); }
    const env = ctx.createGain(); env.gain.setValueAtTime(0.0001, t + start); env.gain.linearRampToValueAtTime(1, t + start + Math.min(0.15, dur * 0.2)); env.gain.setValueAtTime(1, t + start + dur * 0.7); env.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
    if (tremolo) { const l = ctx.createOscillator(), lg = ctx.createGain(), tg = ctx.createGain(); l.frequency.value = tremolo; lg.gain.value = 0.45; tg.gain.value = 0.55; l.connect(lg); lg.connect(tg.gain); env.connect(tg); tg.connect(out); l.start(t + start); l.stop(t + start + dur); }
    else env.connect(out);
    for (const [f, q, g, fEnd] of formants) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(f, t + start); if (fEnd) bp.frequency.linearRampToValueAtTime(fEnd, t + start + dur); bp.Q.value = q; const gg = ctx.createGain(); gg.gain.value = g; o.connect(bp); bp.connect(gg); gg.connect(env); }
    if (breath) { const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, dur); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = formants[0][0]; bp.Q.value = 2; const ng = ctx.createGain(); ng.gain.value = breath; n.connect(bp); bp.connect(ng); ng.connect(env); n.start(t + start); n.stop(t + start + dur); }
    o.start(t + start); o.stop(t + start + dur + 0.05);
  };
  if (kind === 'cow') voice(0, 1.5, 110, 85, [[260, 4, 1.4, 520], [700, 5, 0.5, 900], [2400, 6, 0.05]]);
  if (kind === 'sheep') voice(0, 0.9, 330, 280, [[750, 5, 1.2], [1250, 6, 0.7], [2600, 7, 0.2]], 11);
  if (kind === 'pig') { voice(0, 0.2, 150, 120, [[380, 3, 1.5], [900, 4, 0.6]], 0, 1.2, 0.3); voice(0.3, 0.26, 130, 105, [[380, 3, 1.5], [900, 4, 0.6]], 0, 1.2, 0.3); }
  if (kind === 'chicken') { [0, 0.17, 0.36, 0.5].forEach((s0, i) => voice(s0, 0.07, 600 + i * 20, 760, [[1100, 6, 1.4], [2300, 7, 0.5]])); voice(0.78, 0.38, 520, 880, [[900, 5, 1.3], [1900, 6, 0.7]]); }
}
// ----- the grass, painted onto the ground -----
// A fixed set of blades always surrounds the camera: each blade wraps round the square it lives in, so the field never ends.
// A mask painted over the map keeps grass off paths, floors, the green, the river and the farm field, and shortens it round the village.
let grass = null;
const GM = { x0: -124, x1: 110, z0: -112, z1: 96, ppu: 2 };   /* z0 reaches the north's hills, so its lake and stream can be kept clear */
let grassMask = null;
const WOODS_PATH = [[-84, 6], [-88, 7.2], [-91.5, 11.5], [-94, 16], [-97.2, 19.4], [-101, 17.6], [-104.4, 19.4]];   // the worn footpath in the western woods, out to the stream's stepping stones
function grassMaskTexture(){
  if (grassMask) return grassMask;
  const W = (GM.x1 - GM.x0) * GM.ppu, H = (GM.z1 - GM.z0) * GM.ppu, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const X = x => (x - GM.x0) * GM.ppu, Z = z => (z - GM.z0) * GM.ppu;
  // red: where grass may grow; green: how tall (the village is kept trimmed, the wilds grow long)
  g.fillStyle = 'rgb(255,255,0)'; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgb(255,150,0)'; g.fillRect(X(-100), Z(-12), (62 + 100) * GM.ppu, 74 * GM.ppu);
  g.fillStyle = '#000';
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const pth of PATHS) { g.lineWidth = (pth.w + 0.9) * GM.ppu; g.beginPath(); pth.pts.forEach(([x, z], i) => i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z))); g.stroke(); }
  for (const [x, z, r] of COBBLES) { g.beginPath(); g.arc(X(x), Z(z), (r + 0.3) * GM.ppu, 0, 7); g.fill(); }
  for (const b of solidBoxes) if (b.x1 - b.x0 < 60) g.fillRect(X(b.x0 - 0.3), Z(b.z0 - 0.3), (b.x1 - b.x0 + 0.6) * GM.ppu, (b.z1 - b.z0 + 0.6) * GM.ppu);
  for (const h of houses) g.fillRect(X(h.x - h.hw - 0.5), Z(h.z - h.hd - 0.5), (h.hw * 2 + 1) * GM.ppu, (h.hd * 2 + 1) * GM.ppu);
  g.fillRect(X(HALL.x - 7.5 * HS), Z(HALL.z - 6.5 * HS), 15 * HS * GM.ppu, 13 * HS * GM.ppu);
  g.fillRect(X(47.5), Z(3.5), 11 * GM.ppu, 8 * GM.ppu);   // the farm field
  g.beginPath(); g.arc(X(QUARRY.x), Z(QUARRY.z), (QUARRY.r + 0.8) * GM.ppu, 0, 7); g.fill();   // the quarry floor
  g.beginPath(); g.arc(X(BF.x), Z(BF.z), BF.clearR * GM.ppu, 0, 7); g.fill();   // the bonfire clearing
  g.fillStyle = 'rgba(110,70,0,1)'; g.fillRect(X(62), Z(37), 46 * GM.ppu, 43 * GM.ppu); g.fillStyle = '#000';   // the ruined farm: patchy, stunted grass
  g.lineWidth = 1.6 * GM.ppu; g.beginPath(); WOODS_PATH.forEach(([x, z], i) => i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z))); g.stroke();   // the woods footpath
  g.fillRect(X(97.6), Z(-7.6), 9.8 * GM.ppu, 6.8 * GM.ppu);   // the workshop floor
  g.fillRect(X(50.2), Z(14.2), 5.6 * GM.ppu, 4.0 * GM.ppu);   // the duck pond by the field
  g.fillRect(X(FISH_SHACK.x - 4.5), Z(FISH_SHACK.z - 3.5), 9 * GM.ppu, 7 * GM.ppu);   // Jory's shack
  g.fillRect(X(BARRACKS.x0 - 1.5), Z(BARRACKS.z0 - 1.5), (BARRACKS.jx1 - BARRACKS.x0 + 3) * GM.ppu, (BARRACKS.z1 - BARRACKS.z0 + 3) * GM.ppu);   // the barracks and the jail
  if (FARMLAND) for (const pt of FARMLAND.patches) g.fillRect(X(pt.x - 2.2), Z(pt.z - 2.2), 4.4 * GM.ppu, 4.4 * GM.ppu);   // the farming patches
  for (let pz = -20; pz < 98; pz += 0.5) for (let px = pz > -9 ? -118 : GM.x0; px < (pz > -9 ? -64 : GM.x1); px += 0.5) {   // the water and its muddy banks
    if (waterSD(px, pz) < 0.4) g.fillRect(X(px), Z(pz), GM.ppu * 0.5 + 1, GM.ppu * 0.5 + 1); }
  /* the north, across the river: grass on the meadow, thinning as it gets drier and stonier towards the hills, none on the hills
     themselves (their bare rock shows) or the gravel round the iron rocks; then its lake, stream, banks and dirt tracks are cut out */
  { const rows = Math.ceil(Z(-20.5)), img = g.createImageData(W, rows), d = img.data;
    for (let py = 0; py < rows; py++) for (let px = 0; px < W; px++) {
      const x = GM.x0 + (px + 0.5) / GM.ppu, z = GM.z0 + (py + 0.5) / GM.ppu;
      const dry = Math.min(1, Math.max(0, (-z - 35) / 50)), hill = 1 - Math.min(1, Math.max(0, (hillH(x, z) - 0.15) / 0.9)), ir = Math.hypot(x + 49, z + 68);
      const k = hill * (1 - 0.3 * dry) * (ir < 9 ? Math.min(1, Math.max(0, (ir - 6) / 3)) : 1), i = (py * W + px) * 4;
      d[i] = 255 * k; d[i + 1] = 255; d[i + 2] = 0; d[i + 3] = 255; }
    g.putImageData(img, 0, 0); }
  g.fillStyle = '#000';
  for (let pz = GM.z0; pz < -20; pz += 0.5) for (let px = GM.x0; px < GM.x1; px += 0.5) if (waterSD(px, pz) < 0.4) g.fillRect(X(px), Z(pz), GM.ppu * 0.5 + 1, GM.ppu * 0.5 + 1);
  g.strokeStyle = '#000'; g.lineWidth = 2.8 * GM.ppu; for (const pts of NORTH_PATHS) { g.beginPath(); pts.forEach(([x, z], i) => i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z))); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.flipY = false; t.minFilter = t.magFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return grassMask = t;
}
/* the grass is painted onto the ground: a second copy of the ground, just above it, coloured with brush-stroke clumps in the
   ground's own greens and a soft light wave rolling across, and see-through wherever the mask keeps grass away (paths, floors,
   fields, water). There are no blades, so nothing follows the player round and it costs almost nothing to draw. */
const GRASS_T = { value: 0 };
function buildGrass(){
  if (grass) return;
  const mat2 = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mask = grassMaskTexture(), box = new THREE.Vector4(GM.x0, GM.z0, GM.x1 - GM.x0, GM.z1 - GM.z0);
  mat2.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { gTime: GRASS_T, gMask: { value: mask }, gBox: { value: box } });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vGXZ;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec2 vGXZ; uniform float gTime; uniform sampler2D gMask; uniform vec4 gBox;
      float gh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gh(i), gh(i + vec2(1, 0)), f.x), mix(gh(i + vec2(0, 1)), gh(i + vec2(1, 1)), f.x), f.y); }
      float gf(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * gn(p); p = p * 2.03 + 1.7; a *= 0.5; } return v; }`).replace('#include <color_fragment>', `#include <color_fragment>
      float allow = smoothstep(0.35, 0.75, texture2D(gMask, (vGXZ - gBox.xy) / gBox.zw).r);
      if (abs(vGXZ.x) > 119.5 || abs(vGXZ.y) > 119.5) allow = 0.0;   /* nothing past the edge of the map */
      vec2 q = vec2(vGXZ.x * 0.9 + vGXZ.y * 0.4, vGXZ.y * 0.9 - vGXZ.x * 0.4);   /* strokes stretched along the wind */
      float clump = gf(q * vec2(0.9, 2.6)), fine = gn(q * vec2(4.0, 11.0)), big = gf(vGXZ * 0.06);
      vec3 col = mix(vec3(0.045, 0.195, 0.034), vec3(0.078, 0.323, 0.045), smoothstep(0.3, 0.75, clump));   /* the ground's own greens, in linear light */
      col = mix(col, vec3(0.04, 0.17, 0.03), big * 0.5);
      col = mix(col, vec3(0.212, 0.423, 0.062), smoothstep(0.82, 0.95, fine) * 0.6);
      col += vec3(0.02, 0.05, 0.01) * smoothstep(0.65, 1.0, sin(dot(vGXZ, vec2(0.13, 0.08)) - gTime * 0.9) * 0.5 + 0.5);   /* the wind's light wave */
      diffuseColor = vec4(col, allow);`);
  };
  const mesh = new THREE.Mesh(groundGeo, mat2); mesh.position.copy(groundMesh.position); mesh.position.y += 0.005; mesh.receiveShadow = true; mesh.userData.shadowSet = true; scene.add(mesh);
  grass = { mesh };
}
window.buildGrass = buildGrass;
function updateGrass(){ GRASS_T.value = performance.now() / 1000; }
// ----- melee combat: turn based, like the classic MMOs. You and the monster lock in place and take turns swinging -----
// One Melee skill covers attacking, strength and defending; Hitpoints levels alongside it.
const HAIRLESS = 0x10fe01;   // a marker colour: the hair pieces made in it are removed, goblins are bald
function makeGoblin(o = {}){
  const skin = o.skin || 0x6a9a3a;
  const g = makeChibi({ gender: 'male', hair: 'short', hairCol: HAIRLESS, skin, shirt: o.shirt || 0x6a4a2a, pants: o.pants || 0x4a3a22 });
  const c = g.userData.chibi, head = c.head;
  head.children.filter(m => m.material && m.material.color && m.material.color.getHex() === HAIRLESS).forEach(m => head.remove(m));
  head.scale.set(1.08, 0.92, 1.0);                                        // a wider, squatter head
  // long pointed ears, sweeping out and back
  for (const s of [-1, 1]) {
    const ear = chibiPart(head, new THREE.ConeGeometry(0.16, 0.75, 8), skin, s * 0.72, 0.08, -0.05);
    ear.rotation.set(0.25, 0, s * -1.25);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 6), toonMat(0xc86a6a)); inner.position.set(0, 0.03, 0.06); ear.add(inner);
  }
  // a big hooked nose, a heavy scowling brow, a wide grin with two fangs
  const nose = chibiPart(head, new THREE.ConeGeometry(0.11, 0.36, 8), skin, 0, -0.04, 0.68); nose.rotation.x = Math.PI / 2 + 0.35;
  for (const s of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.06), toonMat(0x3a4a1a)); brow.position.set(s * 0.22, 0.17, 0.57); brow.rotation.z = s * 0.4; head.add(brow);
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 5), basic(0xf4f0e0)); fang.position.set(s * 0.1, -0.24, 0.57); fang.rotation.x = Math.PI; head.add(fang);
  }
  // yellow eyes with dark slits, in place of the friendly ones
  c.eyes.forEach((e, i) => { if (i % 2 === 0) { e.material = basic(0xf0d030); const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), basic(0x1a1208)); pupil.scale.set(0.45, 1.3, 0.5); pupil.position.z = 0.09; e.add(pupil); } else e.visible = false; });
  head.children.forEach(m => { if (m.geometry && m.geometry.type === 'TorusGeometry') { m.scale.set(1.9, 1.2, 1); m.material = basic(0x3a1a12); } });   // the grin
  head.children.forEach(m => { if (m.material && m.material.opacity < 1) m.material = basic(0x8a5a3a, 0.4); });   // grubby cheeks
  // a ragged tunic edge, a rope belt and a bone club
  for (let i = 0; i < 6; i++) { const rag = chibiPart(c.body, new THREE.ConeGeometry(0.1, 0.22, 4), o.shirt || 0x6a4a2a, -0.3 + i * 0.12, 0.7, 0.18, false); rag.rotation.x = Math.PI; }
  chibiPart(c.body, new THREE.TorusGeometry(0.39, 0.035, 5, 16).rotateX(Math.PI / 2), 0xb8a070, 0, 0.83, 0, false);
  const club = new THREE.Group(); club.userData.isClub = true; club.position.set(0, -0.45, 0); club.rotation.x = -Math.PI / 2 + 0.3; c.arms[1].add(club);
  chibiPart(club, new THREE.CylinderGeometry(0.06, 0.09, 0.9, 7), 0x6a4a2a, 0, -0.35, 0);
  const knob = chibiPart(club, new THREE.DodecahedronGeometry(0.2, 0), 0x5a3e22, 0, -0.85, 0); knob.scale.set(1, 1.3, 1);
  for (let i = 0; i < 4; i++) { const spike = chibiPart(club, new THREE.ConeGeometry(0.04, 0.16, 4), 0xd8d0b8, Math.cos(i * 1.6) * 0.17, -0.85 - (i % 2) * 0.1, Math.sin(i * 1.6) * 0.17, false); spike.rotation.set(Math.sin(i * 1.6) * 1.5, 0, -Math.cos(i * 1.6) * 1.5); }
  g.scale.setScalar(CHIBI_SCALE * 0.82);   // goblins are a head shorter than people
  return g;
}

