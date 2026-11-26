// ===== Fable's cave: the Ember Deep. The other way in at the cave mouth (the menu in caveClick): a short, hot dungeon with the Molten Hound at the bottom =====
// Solo, like the first cave, and it uses the same switch (`CAVE`, with `CAVE.fable` set), so everything that checks CAVE (darkness, no village music, dying,
// saving at the mouth, nobody else seen, multi-combat) already works. It sits further off the map (x -17..17, z 744..856) with its own walking grid.
// Nothing is kept between trips except how many times it has been beaten (CAVE_P.fb): leaving, dying or reloading starts it again.
//   The Scorched Stair: two magma rats, then the slab north sinks.
//   The Mirror Gallery: turn the mirrors until the beam of light reaches the crystal by the door.
//   The Cinder Pit: ash goblins and a magma rat round a lava pit, and a cold spring to drink from once.
//   The Hound's Furnace: the Molten Hound (ITAP's numbers). Three times it blazes white hot and can't be hurt: pull a sluice lever to douse it before it
//   erupts, and it is left steaming and easy to hit for a few seconds. Each lever works once.
const FABLE_GRID = { X0: -45, Z0: 735, NX: 181, NZ: 251 };   // x -45..45, z 735..860, half a unit a cell
const FB_ROOMS = {
  stair: { x0: -8, x1: 8, z0: 838, z1: 854, name: 'The Scorched Stair', n: 1 },
  gallery: { x0: -12, x1: 12, z0: 810, z1: 830, name: 'The Mirror Gallery', n: 1, s: 1 },
  pit: { x0: -11, x1: 11, z0: 784, z1: 802, name: 'The Cinder Pit', n: 1, s: 1 },
  furnace: { x0: -15, x1: 15, z0: 746, z1: 776, name: "The Hound's Furnace", s: 1 },
};
const FB_HALLS = [[830, 838], [802, 810], [776, 784]];   // each 4.4 wide down the middle (x -2.2..2.2), from one room's north wall to the next room's south wall
const FB_MONS = { stair: [['magmaRat', -4, 843], ['magmaRat', 4, 842]], pit: [['ashGoblin', -6, 790], ['ashGoblin', 6, 789], ['magmaRat', 0, 787]] };
const FB_MIRRORS = [[-4, 824], [-4, 815], [6, 815], [6, 824]], FB_EMIT = [-11.2, 824], FB_CATCH = [6, 810.9];   // the beam leaves the west wall heading east
const FB_LEVERS = [[-12.2, 761], [12.2, 761], [0, 748.8]], FB_FLARE_AT = [0.7, 0.4, 0.15], FB_FLARE_MS = 14000, FB_COOL_MS = 7000;
const FB_AT = { arrive: [0, 850], rope: [0, 853], spring: [8.6, 799.6], hound: [0, 759], chest: [6, 752], rope2: [-6, 750.5] };
const FB = { built: false };   // the things built down there
let FBS = null;                // this trip's state
const fbRoomAt = (x, z) => Object.keys(FB_ROOMS).find(k => { const r = FB_ROOMS[k]; return x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1; }) || null;
Object.assign(MONSTER_TYPES, {   /* the rats and goblins match the first cave's; the hound is ITAP's molten hound: 100 hit points, attack 45, defence 25, max hit 5 */
  magmaRat: { name: 'Magma rat', model: 'rat', level: 14, hp: 30, melee: 14, atk: 12, def: 8, maxHit: 3, speed: 2300, respawn: 0, snd: 'rat', coins: [0, 0], scale: 1.35 },
  ashGoblin: { name: 'Ash goblin', model: 'goblin', skin: 0x6a6660, shirt: 0x7a2a12, pants: 0x2a2420, level: 15, hp: 35, melee: 15, atk: 15, def: 5, maxHit: 3, speed: 2600, respawn: 0, snd: 'goblin', coins: [8, 24] },
  moltenHound: { name: 'Molten Hound', make: () => makeMoltenHound(), level: 45, hp: 100, melee: 45, atk: 45, def: 25, maxHit: 5, speed: 2600, respawn: 0, snd: 'goblin', coins: [0, 0], reach: 4.7, barY: 5.0 },
});

// ----- the Molten Hound's model: the approved mock-up (tools/mockups/molten-hound-hook.js, and the notes in CLAUDE.md), with `heat` added so the fight can make it blaze or gutter -----
const makeMoltenHound = (() => {
  let seed = 4242; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 60; i++) R();   /* keeps the flames' random shapes the same as in the approved pictures */
  /* one rock for the whole animal: the cracks are a 3D pattern in the hound's own space, so a seam runs on unbroken from chest to shoulder to leg and nothing stretches */
  const uFire = { value: 1 };
  const ROCK = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonRamp });
  ROCK.onBeforeCompile = sh => { sh.uniforms.uFire = uFire;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 rest;\nvarying vec3 vRest;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = rest;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uFire; varying vec3 vRest; vec3 lavaGlow = vec3(0.0);
      vec3 h3(vec3 p){ p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453); }`)
    .replace('#include <map_fragment>', `
      vec3 q = vRest * vec3(1.9, 1.35, 1.9) + 7.3; vec3 ip = floor(q), fp = fract(q); float d1 = 9.0, d2 = 9.0; vec3 c1 = vec3(0.0), c2 = vec3(0.0), r1 = vec3(0.0);
      for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) for (int k = -1; k <= 1; k++) { vec3 gg = vec3(float(i), float(j), float(k)); vec3 r = gg + h3(ip + gg) - fp; float d = dot(r, r);
        if (d < d1) { d2 = d1; c2 = c1; d1 = d; c1 = ip + gg; r1 = r; } else if (d < d2) { d2 = d; c2 = ip + gg; } }
      float e = sqrt(d2) - sqrt(d1), w = 0.05;
      float hot = step(0.3, fract(sin(dot(c1 + c2, vec3(12.9898, 78.233, 37.719))) * 43758.5453));
      float core = 1.0 - smoothstep(0.0, w, e), inC = 1.0 - smoothstep(w * 0.8, w, e), halo = (1.0 - smoothstep(w, w * 2.1, e)) * hot;
      float lift = clamp(-r1.y * 0.9 + r1.z * 0.3, -0.45, 0.5);
      vec3 rockc = vec3(0.034, 0.034, 0.042) * (0.75 + h3(c1).x * 0.5 + lift * 1.1) * (1.0 - 0.55 * halo);
      vec3 lava = mix(vec3(0.8, 0.08, 0.0), vec3(1.0, 0.7, 0.12), core * core);
      float cold = (1.0 - hot) * (1.0 - smoothstep(w * 0.3, w * 0.45, e));
      diffuseColor.rgb = mix(mix(rockc, vec3(0.008), cold), lava, inC * hot);
      lavaGlow = lava * inC * hot + vec3(0.45, 0.05, 0.0) * halo * (1.0 - inC);`)
    .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance = lavaGlow * (1.25 * uFire);'); };
  const rock = () => ROCK, rockMats = {};
  const plain = c => new THREE.MeshToonMaterial({ color: c, gradientMap: toonRamp });
  const glow = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const darkRock = plain(0x2b2a2f), fang = plain(0xf2dfa0), clawMat = new THREE.MeshToonMaterial({ color: 0xffa01e, emissive: 0xff7a10, emissiveIntensity: 0.9, gradientMap: toonRamp });
  const part = (parent, g, mat, x, y, z, ol = true) => { const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); if (ol) { const o = new THREE.Mesh(g, outlineMat); o.scale.setScalar(1.045); m.add(o); } return m; };
  const UP = new THREE.Vector3(0, 1, 0);
  const hull = pts => { const v = []; for (const [x, y, z] of pts) { v.push(new THREE.Vector3(x, y, z)); if (x) v.push(new THREE.Vector3(-x, y, z)); } return new ConvexGeometry(v); };
  const limb = (parent, a, b, r1, r2, mat, ol = true) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
    const m = part(parent, new THREE.CylinderGeometry(r2, r1, L, 9), mat, (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2, ol); m.quaternion.setFromUnitVectors(UP, d.normalize()); return m; };
  /* a tongue of flame: a bent teardrop, yellow at the root, orange, then red at the tip */
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const flames = [];
  function flameGeo(h, r, bend, wob, hot){
    const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(Math.max(0.002, r * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.52)), 0.85) * (1 - 0.25 * t)), t * h)); }
    const g = new THREE.LatheGeometry(pts, 8), p = g.attributes.position, col = new Float32Array(p.count * 3), ph = R() * 6;
    for (let i = 0; i < p.count; i++) { const t = p.getY(i) / h; p.setZ(i, p.getZ(i) - bend * h * t * t + Math.sin(t * 6 + ph) * wob * h * t); p.setX(i, p.getX(i) + Math.cos(t * 5 + ph) * wob * 0.6 * h * t);
      const u = Math.min(1, Math.max(0, t * 1.15 - hot)); let cr, cg, cb; if (u < 0.4) { const k = u / 0.4; cr = 1; cg = 0.78 - 0.34 * k; cb = 0.1 - 0.08 * k; } else { const k = (u - 0.4) / 0.6; cr = 1 - 0.12 * k; cg = 0.44 - 0.3 * k; cb = 0.02; }
      const c = new THREE.Color().setRGB(cr, cg, cb, THREE.SRGBColorSpace); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  }
  const flame = (parent, h, r, x, y, z, rx, rz = 0, bend = 0.35, hot = 0.15) => { const m = new THREE.Mesh(flameGeo(h, r, bend, 0.07, hot), flameMat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.scale.x = 0.72; m.userData.shadowSet = true; parent.add(m);   /* fire casts no shadow */
    flames.push({ m, rx, rz, ph: R() * 6, sp: 5 + R() * 5 }); return m; };

  function makeHound(){
    flames.length = 0;   /* one hound at a time: the flames belong to the newest */
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const R1 = rock(2, 1), R2 = rock(1.3, 0.65), R3 = rock(0.8, 0.4), RH = rock(1.1, 0.55);
    /* trunk: deep chest, tucked waist, strong hips, all slung low and forward */
    part(body, new THREE.SphereGeometry(0.86, 20, 14), R1, 0, 1.72, 0.75).scale.set(0.92, 1.0, 1.18);
    limb(body, [0, 1.74, 0.5], [0, 1.82, -0.95], 0.66, 0.58, R1);
    part(body, new THREE.SphereGeometry(0.7, 18, 12), R1, 0, 1.82, -1.05).scale.set(0.9, 0.95, 1.1);
    /* broken plates of rock riding the shoulders and spine */
    for (const [x, y, z, s, rx, rz] of [[0.42, 2.38, 0.9, 0.42, -0.5, -0.5], [-0.42, 2.38, 0.9, 0.42, -0.5, 0.5], [0.36, 2.42, 0.25, 0.36, -0.7, -0.4], [-0.36, 2.42, 0.25, 0.36, -0.7, 0.4], [0.3, 2.38, -0.4, 0.3, -0.8, -0.35], [-0.3, 2.38, -0.4, 0.3, -0.8, 0.35], [0.3, 2.4, -1.0, 0.3, -0.9, -0.3], [-0.3, 2.4, -1.0, 0.3, -0.9, 0.3], [0.78, 2.0, 0.95, 0.34, -0.3, -1.1], [-0.78, 2.0, 0.95, 0.34, -0.3, 1.1]]) {
      const pl = part(body, new THREE.ConeGeometry(s, s * 1.5, 4), darkRock, x, y, z); pl.rotation.set(rx, 0.78, rz); pl.scale.set(1, 1, 0.45); }
    /* neck and head, carried low */
    limb(body, [0, 1.95, 1.2], [0, 1.64, 2.0], 0.56, 0.44, R2);
    const head = new THREE.Group(); head.position.set(0, 1.54, 2.3); head.rotation.x = 0.12; body.add(head);
    /* a carved wolf skull: flat planes, a brow ridge that is part of the bone and overhangs the eyes, a short deep muzzle */
    part(head, hull([[0.4, 0.28, -0.5], [0.44, -0.24, -0.5], [0.22, 0.5, -0.4], [0.2, 0.52, 0.0], [0.42, 0.44, 0.16], [0.1, 0.34, 0.4], [0.5, 0.0, 0.1], [0.42, -0.26, 0.22], [0.3, 0.04, 0.3], [0, 0.4, 0.36]]), ROCK, 0, 0, 0);
    part(head, hull([[0.2, 0.2, 0.15], [0.3, -0.2, 0.15], [0.19, 0.17, 0.6], [0.13, 0.11, 0.98], [0.17, -0.1, 1.0], [0.29, -0.2, 0.5], [0, 0.22, 0.5], [0, 0.14, 1.0]]), ROCK, 0, 0, 0);
    part(head, hull([[0.1, 0.16, 0.96], [0.11, 0.04, 1.04], [0, 0.17, 1.06], [0, 0.02, 1.08], [0.08, 0.02, 0.94]]), plain(0x121014), 0, 0, 0);   /* a small flat nose, not a ball */
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glow(0xff6a08)); eye.position.set(s * 0.3, 0.2, 0.27); eye.scale.set(1.6, 0.4, 0.7); eye.rotation.set(0, s * 0.75, -s * 0.6); head.add(eye);   /* small and hot, tucked under the brow */
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), glow(0xffe890)); core.position.set(s * 0.325, 0.195, 0.3); core.scale.set(2.0, 0.42, 0.7); core.rotation.set(0, s * 0.75, -s * 0.6); head.add(core);
      const ear = part(head, hull([[0.16, 0, 0.1], [-0.16, 0, 0.06], [0, 0, -0.14], [0, 0.78, -0.12]]), darkRock, s * 0.3, 0.42, -0.2); ear.rotation.set(-0.45, 0, -s * 0.3);   /* tall pointed ears, swept back */
      const inner = new THREE.Mesh(hull([[0.08, 0.08, 0.1], [-0.08, 0.08, 0.08], [0, 0.55, -0.05], [0, 0.1, 0.02]]), glow(0xd84a0a)); inner.position.set(s * 0.3, 0.43, -0.185); inner.rotation.set(-0.45, 0, -s * 0.3); head.add(inner);
      part(head, new THREE.ConeGeometry(0.055, 0.3, 6), fang, s * 0.15, -0.26, 0.9, false).rotation.x = Math.PI;
      for (let i = 0; i < 4; i++) part(head, new THREE.ConeGeometry(0.036, 0.13 - i * 0.012, 5), fang, s * (0.2 + i * 0.022), -0.24, 0.76 - i * 0.12, false).rotation.x = Math.PI;
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.75), glow(0xa02804)); roof.position.set(0, -0.19, 0.55); head.add(roof);
    const throat = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), glow(0xff9a1c)); throat.position.set(0, -0.26, 0.16); head.add(throat);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.22, 0.05); jaw.rotation.x = 0.5; head.add(jaw);
    part(jaw, hull([[0.31, 0.02, 0], [0.28, -0.17, 0], [0.26, 0.02, 0.45], [0.14, 0.02, 0.9], [0.12, -0.09, 0.9], [0.2, -0.15, 0.4], [0, -0.12, 0.92]]), ROCK, 0, 0, 0);
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.72), glow(0xd8440a)); tongue.position.set(0, 0.035, 0.42); jaw.add(tongue);
    const hotT = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.5), glow(0xff8a1a)); hotT.position.set(0, 0.045, 0.3); jaw.add(hotT);
    for (const s of [-1, 1]) { part(jaw, new THREE.ConeGeometry(0.05, 0.24, 6), fang, s * 0.12, 0.14, 0.8, false);
      for (let i = 0; i < 3; i++) part(jaw, new THREE.ConeGeometry(0.032, 0.11, 5), fang, s * (0.17 + i * 0.025), 0.07, 0.62 - i * 0.13, false); }
    /* legs: thick shoulders and haunches, big paws, long glowing claws */
    const seamMat = glow(0xff8a1a);
    const paw = (l, x, y, z) => { part(l, new THREE.SphereGeometry(0.3, 12, 9), darkRock, x, y, z).scale.set(1, 0.6, 1.2);   /* one paw, the same on every leg: plain rock pad, four knuckles, four claws, molten lines between the toes and a ring at the ankle */
      for (const cx of [-0.127, 0, 0.127]) { const sm = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.12, 0.3), seamMat); sm.position.set(x + cx, y + 0.075 - Math.abs(cx) * 0.25, z + 0.2); sm.rotation.x = 0.45; l.add(sm); }
      for (const cx of [-0.19, -0.065, 0.065, 0.19]) { const tz = z + 0.3 - Math.abs(cx) * 0.3; part(l, new THREE.SphereGeometry(0.105, 8, 6), darkRock, x + cx, y - 0.05, tz).scale.set(1, 0.95, 1.35);
        const c = part(l, new THREE.ConeGeometry(0.075, 0.3, 6), clawMat, x + cx, y - 0.08, tz + 0.2); c.rotation.set(Math.PI / 2 + 0.5, 0, -cx * 0.8); } };
    const FL = [], FK = [], HL = [], HK = [];
    for (const s of [-1, 1]) {
      const f = new THREE.Group(); f.position.set(s * 0.6, 1.6, 0.95); body.add(f); FL.push(f);
      part(f, new THREE.SphereGeometry(0.46, 14, 10), R2, 0, 0.05, 0).scale.set(0.8, 1.2, 1.05);
      limb(f, [0, -0.1, 0.02], [s * 0.06, -0.85, 0.3], 0.3, 0.23, R3);
      const fk = new THREE.Group(); fk.position.set(s * 0.06, -0.8, 0.3); f.add(fk); FK.push(fk);   /* the elbow: everything below it bends */
      part(fk, new THREE.SphereGeometry(0.235, 10, 8), darkRock, 0, 0, 0); limb(fk, [0, 0, 0], [s * 0.04, -0.58, 0.12], 0.23, 0.2, R3); paw(fk, s * 0.04, -0.62, 0.22);
      flame(f, 0.6, 0.17, s * 0.12, -0.75, 0.12, -1.9, 0, 0.3); flame(f, 0.42, 0.13, s * 0.12, -0.95, 0.14, -2.1, 0, 0.3);
      const h = new THREE.Group(); h.position.set(s * 0.56, 1.72, -1.1); body.add(h); HL.push(h);
      part(h, new THREE.SphereGeometry(0.52, 14, 10), R2, 0, -0.1, 0.05).scale.set(0.75, 1.25, 1.15);
      limb(h, [0, -0.3, 0.1], [s * 0.04, -0.85, 0.3], 0.3, 0.22, R3);
      const hk = new THREE.Group(); hk.position.set(s * 0.04, -0.8, 0.3); h.add(hk); HK.push(hk);   /* the stifle */
      part(hk, new THREE.SphereGeometry(0.225, 10, 8), darkRock, 0, 0, 0); limb(hk, [0, 0, 0], [s * 0.04, -0.45, -0.52], 0.21, 0.17, R3); limb(hk, [s * 0.04, -0.4, -0.52], [s * 0.06, -0.72, -0.35], 0.17, 0.18, R3); paw(hk, s * 0.06, -0.74, -0.22);
      flame(hk, 0.55, 0.16, s * 0.04, -0.3, -0.6, -1.7, 0, 0.3);
    }
    /* the mane: fire pouring back off the skull, neck and shoulders */
    const spine = z => z > 1.9 ? 1.95 + (2.5 - z) * 0.35 : z > 0.5 ? 2.42 + (1.9 - z) * 0.1 : 2.5 - (0.5 - z) * 0.04;
    for (let i = 0; i < 17; i++) { const z = 2.35 - i * 0.2, big = Math.sin(Math.min(1, i / 7) * Math.PI * 0.5), hgt = 0.8 + big * 0.9 - Math.max(0, i - 9) * 0.17;
      flame(body, hgt, 0.24 + big * 0.1, (i % 2 ? 0.16 : -0.16) * (0.4 + big), spine(z) - 0.1, z, -0.45 - R() * 0.3 - Math.max(0, i - 8) * 0.06, (i % 2 ? -1 : 1) * 0.12, 0.5);
      if (i % 2 === 0 && i < 14) flame(body, hgt * 0.55, 0.16, (i % 4 ? 0.3 : -0.3), spine(z) - 0.05, z + 0.1, -0.55, (i % 4 ? -1 : 1) * 0.4, 0.3, -0.25); }
    for (const s of [-1, 1]) { for (let i = 0; i < 5; i++) flame(body, 0.75 - i * 0.05, 0.2, s * (0.42 + i * 0.03), 1.95 - i * 0.14, 1.95 - i * 0.1, -1.15 - i * 0.12, -s * (0.55 + i * 0.12), 0.35);   /* the ruff round the neck */
      flame(head, 0.5, 0.15, s * 0.42, 0.0, -0.05, -1.5, -s * 0.9, 0.3); flame(head, 0.4, 0.12, s * 0.36, -0.2, 0.0, -1.9, -s * 0.8, 0.3); }
    /* the tail: a rope of fire that lifts and curls */
    const tail = new THREE.Group(); tail.position.set(0, 2.0, -1.65); body.add(tail); const segs = []; let prev = tail;
    const curl = [0.15, 0.2, 0.3, 0.3, 0.1, -0.3, -0.35, 0.2, 0.55];
    curl.forEach((c, i) => { const sg = new THREE.Group(); sg.position.z = i ? -0.33 : 0; sg.rotation.x = c; prev.add(sg); const w = 1 - Math.abs(i - 3.5) / 9;
      flame(sg, 0.9 * w + 0.25, 0.4 * w, 0, 0, 0.12, -Math.PI / 2, 0, 0.12, i < 2 ? 0.1 : -0.05); flame(sg, 0.5 * w + 0.15, 0.2 * w, (i % 2 ? 0.1 : -0.1), 0.05, 0, -Math.PI / 2 + 0.7, 0, 0.3, -0.3); segs.push([sg, c]); prev = sg; });
    g.userData.tick = now => { for (const f of flames) { const a = Math.sin(now * f.sp + f.ph); f.m.rotation.x = f.rx + a * 0.07; f.m.rotation.z = f.rz + Math.cos(now * f.sp * 0.7 + f.ph) * 0.06; const fr = g.userData.fire * (g.userData.heat || 1); f.m.scale.set(0.72 * fr, (1 + a * 0.1) * fr, fr); }
      uFire.value = (1 + Math.sin(now * 2.4) * 0.22) * g.userData.fire * (g.userData.heat || 1);
      segs.forEach(([sg, c], i) => { sg.rotation.x = c + Math.sin(now * 2.2 - i * 0.7) * 0.1; sg.rotation.y = Math.sin(now * 1.7 - i * 0.6) * 0.1; }); };
    g.userData.fire = 1;
    g.updateMatrixWorld(true); g.traverse(o => { if (o.isMesh && o.material === ROCK) { const ps = o.geometry.attributes.position, a = new Float32Array(ps.count * 3), v = new THREE.Vector3(); for (let i = 0; i < ps.count; i++) { v.fromBufferAttribute(ps, i).applyMatrix4(o.matrixWorld); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; } o.geometry.setAttribute('rest', new THREE.BufferAttribute(a, 3)); } });   /* where each point sits on the standing hound: the pattern is pinned there, so it moves with the limb */
    /* the poses, in the same shape as the other animals: pose(mode, k, now) */
    g.userData.pose = (mode, k, now) => {
      body.position.set(0, 0, 0); body.rotation.set(0, 0, 0); head.rotation.set(0.12, 0, 0); head.position.set(0, 1.54, 2.3); jaw.rotation.x = 0.5; tail.rotation.set(0, 0, 0); g.userData.fire = 1;
      [...FL, ...HL, ...FK, ...HK].forEach(l => l.rotation.set(0, 0, 0));
      if (mode === 'walk') { const w = now * 7.5;   /* a prowling trot: diagonal pairs, each paw lifting as it comes forward */
        [[FL[0], FK[0], 0], [FL[1], FK[1], Math.PI], [HL[0], HK[0], Math.PI], [HL[1], HK[1], 0]].forEach(([L, K, ph], i) => { const a = Math.sin(w + ph), lift = Math.max(0, -Math.cos(w + ph)); L.rotation.x = a * 0.42 - (i < 2 ? lift * 0.18 : 0); K.rotation.x = lift * (i < 2 ? 0.85 : 0.6); });
        body.position.y = Math.sin(w * 2) * 0.035 - 0.03; body.rotation.z = Math.sin(w) * 0.025; body.rotation.x = Math.sin(w * 2 + 0.6) * 0.012; head.rotation.x = 0.16 + Math.sin(w * 2 + 1) * 0.04; head.rotation.y = Math.sin(w) * 0.05; jaw.rotation.x = 0.3; tail.rotation.y = Math.sin(w) * 0.2; }
      else if (mode === 'swing') { const e = x => x * x * (3 - 2 * x), wind = k < 0.4 ? e(k / 0.4) : k < 0.5 ? 1 : 0, lunge = k >= 0.5 && k < 0.72 ? Math.sin((k - 0.5) / 0.22 * Math.PI * 0.5) : k >= 0.72 ? 1 - e((k - 0.72) / 0.28) : 0, cr = wind + (k >= 0.5 ? 0 : 0);   /* sink back on the haunches, jaws wide, then spring and snap */
        body.position.z = -0.35 * wind + 1.0 * lunge; body.position.y = -0.2 * wind + 0.1 * lunge; body.rotation.x = -0.12 * wind + 0.1 * lunge;
        head.rotation.x = 0.12 - 0.35 * wind + 0.3 * lunge; jaw.rotation.x = 0.45 + 0.6 * wind + (k >= 0.5 ? 0.6 * Math.max(0, 1 - (k - 0.5) / 0.14) - 0.3 * lunge : 0);
        FL.forEach(l => l.rotation.x = -0.3 * wind - 0.55 * lunge); FK.forEach(l => l.rotation.x = 0.55 * wind + 0.2 * lunge); HL.forEach(l => l.rotation.x = -0.25 * wind + 0.5 * lunge); HK.forEach(l => l.rotation.x = 0.4 * wind - 0.15 * lunge); tail.rotation.x = 0.3 * wind - 0.2 * lunge; g.userData.fire = 1 + 0.25 * lunge; }
      else if (mode === 'hurt') { const b = Math.sin(Math.min(1, k) * Math.PI); body.position.z = -0.35 * b; body.rotation.x = -0.1 * b; head.rotation.x = 0.12 - 0.3 * b; head.rotation.y = 0.5 * b; jaw.rotation.x = 0.45 + 0.4 * b; FL.forEach(l => l.rotation.x = -0.2 * b); g.userData.fire = 1 - 0.3 * b; }
      else if (mode === 'block') { const b = Math.sin(Math.min(1, k) * Math.PI); body.position.x = 0.35 * b; body.rotation.y = -0.15 * b; head.rotation.y = 0.3 * b; }
      else if (mode === 'dead') { const e = k * k * (3 - 2 * k); body.rotation.z = 1.42 * e; body.position.y = 0.55 * e; head.rotation.x = 0.12 + 0.3 * e; jaw.rotation.x = 0.45 - 0.25 * e; FL.forEach((l, i) => l.rotation.x = (i ? 0.3 : -0.25) * e); HL.forEach((l, i) => l.rotation.x = (i ? -0.3 : 0.25) * e); FK.forEach(l => l.rotation.x = 0.4 * e); g.userData.fire = 1 - 0.85 * e; }   /* keels over and the fire goes out */
      else if (mode === 'ready') { const br = Math.sin(now * 3); body.position.y = -0.1 + br * 0.02; body.rotation.x = 0.04; head.rotation.x = 0.2; head.rotation.y = Math.sin(now * 1.1) * 0.06; jaw.rotation.x = 0.5 + Math.sin(now * 9) * 0.06; FL.forEach(l => l.rotation.x = -0.15); FK.forEach(l => l.rotation.x = 0.3); FL[1].rotation.x = -0.15 - Math.max(0, Math.sin(now * 4)) * 0.3; FK[1].rotation.x = 0.3 + Math.max(0, Math.sin(now * 4)) * 0.5; tail.rotation.y = Math.sin(now * 6) * 0.15; }   /* low and snarling, one paw raking the ground */
      else { const br = Math.sin(now * 1.8); body.position.y = br * 0.03; body.rotation.x = br * 0.008; head.rotation.x = 0.12 + Math.sin(now * 1.8 + 0.8) * 0.05; head.rotation.y = Math.sin(now * 0.6) * 0.28; jaw.rotation.x = 0.4 + Math.max(0, br) * 0.14; tail.rotation.y = Math.sin(now * 1.4) * 0.22; FL.forEach(l => l.rotation.x = -br * 0.012); HL.forEach(l => l.rotation.x = -br * 0.012); }   /* breathing, looking about, the tail swaying */
    };
    return g;
  }
  return makeHound;
})();

function buildFable(){
  if (FB.built) return; FB.built = true;
  let seed = 9173; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const bins = { rock: [], floor: [], lava: [] }, M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(), C = new THREE.Color();
  const put = (bin, geo, col, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) => {   /* everything that never moves is merged into one mesh per bin, coloured per corner */
    const q = geo.index ? geo.toNonIndexed() : geo.clone(); q.applyMatrix4(M4.compose(P.set(x, y, z), Q.setFromEuler(E.set(0, ry, 0)), S.set(sx, sy, sz)));
    const n = q.attributes.position.count, a = new Float32Array(n * 3); C.set(col); for (let i = 0; i < n; i++) { a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b; }
    q.setAttribute('color', new THREE.BufferAttribute(a, 3)); bins[bin].push(q); };
  const box = new THREE.BoxGeometry(1, 1, 1), lump = new THREE.DodecahedronGeometry(1, 0), ROCKS = [0x5a4e46, 0x66584e, 0x70625a, 0x4e443c];
  const wall = (x0, x1, z0, z1) => { if (x1 - x0 < 0.1 || z1 - z0 < 0.1) return; solidBoxes.push({ x0, x1, z0, z1 });
    put('rock', box, 0x443a34, (x0 + x1) / 2, 0.6, (z0 + z1) / 2, x1 - x0, 1.2, z1 - z0);   /* kept low, about 2.2 at the highest, so the game camera sees over the near wall */
    const along = x1 - x0 > z1 - z0, L = along ? x1 - x0 : z1 - z0;
    for (let d = 0.6; d < L; d += 0.95 + R() * 0.4) { const r = 0.7 + R() * 0.35; put('rock', lump, ROCKS[Math.floor(R() * 4)], along ? x0 + d : (x0 + x1) / 2 + (R() - 0.5) * 0.4, 0.7 + R() * 0.45, along ? (z0 + z1) / 2 + (R() - 0.5) * 0.4 : z0 + d, r, r * (0.8 + R() * 0.3), r, R() * 6); } };
  const floor = (x0, x1, z0, z1) => { for (let x = x0; x < x1 - 0.01; x += 2) for (let z = z0; z < z1 - 0.01; z += 2) { const w = Math.min(2, x1 - x), d = Math.min(2, z1 - z), v = 0.3 + R() * 0.08; put('floor', box, C.setRGB(v * 1.08, v, v * 0.92).getHex(), x + w / 2, -0.05, z + d / 2, w - 0.04, 0.1, d - 0.04); } };
  const lava = (x0, x1, z0, z1, solid = true) => { put('lava', box, 0xff5a0a, (x0 + x1) / 2, 0.03, (z0 + z1) / 2, x1 - x0, 0.06, z1 - z0); put('lava', box, 0xffc23a, (x0 + x1) / 2, 0.05, (z0 + z1) / 2, Math.max(0.2, x1 - x0 - 0.8), 0.06, Math.max(0.2, z1 - z0 - 0.8)); if (solid) solidBoxes.push({ x0, x1, z0, z1 }); };
  const T = 1.4, G = 2.2;
  for (const k in FB_ROOMS) { const r = FB_ROOMS[k]; floor(r.x0, r.x1, r.z0, r.z1);
    wall(r.x0 - T, r.x0, r.z0 - T, r.z1 + T); wall(r.x1, r.x1 + T, r.z0 - T, r.z1 + T);
    if (r.n) { wall(r.x0, -G, r.z0 - T, r.z0); wall(G, r.x1, r.z0 - T, r.z0); } else wall(r.x0, r.x1, r.z0 - T, r.z0);
    if (r.s) { wall(r.x0, -G, r.z1, r.z1 + T); wall(G, r.x1, r.z1, r.z1 + T); } else wall(r.x0, r.x1, r.z1, r.z1 + T); }
  for (const [za, zb] of FB_HALLS) { floor(-G, G, za, zb); wall(-G - T, -G, za + T, zb - T); wall(G, G + T, za + T, zb - T); }
  // lava: runnels down the sides of the stair, the pit in the middle of the Cinder Pit, and a moat round the furnace
  lava(-8, -6.4, 840, 852); lava(6.4, 8, 840, 852); lava(-2.4, 2.4, 791, 796);
  lava(-15, -13, 746, 776); lava(13, 15, 746, 776); lava(-13, 13, 746, 748); lava(-13, -G, 774, 776); lava(G, 13, 774, 776);
  for (const [x, z, r] of [[-5, 765, 0.5], [6, 768, 0.4], [-7, 753, 0.45], [8, 756, 0.5], [3, 770, 0.35], [-3, 751, 0.4]]) put('lava', new THREE.CylinderGeometry(r, r, 0.04, 7), 0xff7a14, x, 0.02, z, 1.6, 1, 0.5, R() * 3);   /* glowing cracks in the furnace floor */
  const mk = (bin, m) => { const mesh = new THREE.Mesh(mergeGeometries(bins[bin]), m); mesh.receiveShadow = true; mesh.userData.shadowSet = true; scene.add(mesh); return mesh; };
  mk('rock', new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0, emissive: 0x2a180e })); mk('floor', new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0, emissive: 0x24160e }));   /* a warm glow of their own, as if lit by the lava: the cave's darkness alone left them black */
  FB.lavaM = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }); mk('lava', FB.lavaM);
  LIGHT_SPOTS.push([-6, 2, 846], [6, 2, 846], [0, 2.4, 820], [-10, 2.2, 824], [6, 2.2, 812], [0, 2, 793.5], [-12, 2.2, 761], [12, 2.2, 761], [0, 2.2, 750], [0, 3, 761], [0, 2.2, 772], [8.6, 2, 799.6]);
  const solid = (x, z, h) => solidBoxes.push({ x0: x - h, x1: x + h, z0: z - h, z1: z + h });
  const stone = mat(0x4a4642), dark = mat(0x1c1a1e), iron = mat(0x55555c), ropeM = mat(0xb89a5a);
  const hit = (x, z, w, h) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); m.position.set(x, h / 2, z); scene.add(m); return m; };
  // the ropes: the one you came down, and one that drops into the furnace once the hound is beaten
  const rope = (x, z, msg) => { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 9, 6), ropeM); r.position.y = 4.5; g.add(r);
    const c = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 12).rotateX(Math.PI / 2), ropeM); c.position.y = 0.08; g.add(c); const h = hit(x, z, 1.1, 4); g.add(h); h.position.set(0, 2, 0);
    cvClick(h, 'Climb', 'Rope', () => { if (g.visible) caveGo(x, z, 1.8, () => leaveCave(msg)); }, x, z); return g; };
  rope(...FB_AT.rope, 'You climb the rope back up into the daylight.'); FB.rope2 = rope(...FB_AT.rope2, 'You haul yourself up the rope, smelling of smoke.'); FB.rope2.visible = false;
  // the three slabs that shut the passages
  FB.gates = FB_HALLS.map(([za, zb]) => { const z = (za + zb) / 2, mesh = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.2, 0.9), dark); mesh.position.set(0, 1.6, z); mesh.castShadow = true; scene.add(mesh);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.94), new THREE.MeshBasicMaterial({ color: 0xff6a10, toneMapped: false })); glow.position.y = 0.6; mesh.add(glow);
    return { mesh, box: { x0: -G, x1: G, z0: z - 0.5, z1: z + 0.5 }, open: false, at: 0 }; });
  // the Mirror Gallery: the lamp in the west wall, four mirrors on pedestals, the crystal by the door, and the beam itself
  const beamM = FB.beamM = new THREE.MeshBasicMaterial({ color: 0xfff2b0, toneMapped: false, transparent: true, opacity: 0.9 });
  { const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), beamM); lamp.position.set(FB_EMIT[0], 1.7, FB_EMIT[1]); scene.add(lamp); FB.lamp = lamp; }
  FB.mirrors = FB_MIRRORS.map(([x, z], i) => { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.15, 8), stone); ped.position.y = 0.58; ped.castShadow = true; g.add(ped);
    const turn = new THREE.Group(); turn.position.y = 1.7; g.add(turn); const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.15, 0.12), iron); frame.castShadow = true; turn.add(frame);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 0.16), new THREE.MeshBasicMaterial({ color: 0xbfe6f2, toneMapped: false })); turn.add(glass);
    const h = hit(x, z, 1.5, 2.6); cvClick(h, 'Turn', 'Mirror', () => fbMirrorClick(i), x, z); solid(x, z, 0.5); return { turn, x, z }; });
  { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), new THREE.MeshBasicMaterial({ color: 0x3a4a58, toneMapped: false })); c.position.set(FB_CATCH[0], 1.7, FB_CATCH[1]); scene.add(c); FB.catch = c;
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.1, 7), stone); ped.position.set(FB_CATCH[0], 0.55, FB_CATCH[1]); scene.add(ped); solid(FB_CATCH[0], FB_CATCH[1], 0.4); }
  FB.beams = []; for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(box, beamM); b.visible = false; b.userData.shadowSet = true; scene.add(b); FB.beams.push(b); }
  // the cold spring in the Cinder Pit
  { const [x, z] = FB_AT.spring, g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.5, 9), stone); rim.position.y = 0.25; rim.castShadow = true; g.add(rim);
    const w = FB.springW = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 9), new THREE.MeshBasicMaterial({ color: 0x4ab8e8, toneMapped: false })); w.position.y = 0.5; g.add(w);
    const h = hit(x, z, 2, 1.2); cvClick(h, 'Drink', 'Cold spring', () => fbSpringClick(), x, z); solid(x, z, 1.0); }
  // the sluice levers round the furnace, each under a stone spout
  FB.levers = FB_LEVERS.map(([x, z], i) => { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 0.7), stone); post.position.y = 0.6; post.castShadow = true; g.add(post);
    const arm = new THREE.Group(); arm.position.y = 1.2; g.add(arm); const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), iron); bar.position.y = 0.6; arm.add(bar);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0x4ab8e8, toneMapped: false })); knob.position.y = 1.2; arm.add(knob);
    const h = hit(x, z, 1.3, 2.8); cvClick(h, 'Pull', 'Sluice lever', () => fbLeverClick(i), x, z); solid(x, z, 0.45); return { arm, knob, x, z }; });
  FB.steam = []; for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.7, 7, 5), new THREE.MeshBasicMaterial({ color: 0xe8eef2, transparent: true, opacity: 0, depthWrite: false })); s.visible = false; s.userData.shadowSet = true; scene.add(s); FB.steam.push(s); }
}

// ----- going in -----
function caveMenu(){   /* two caves behind the one mouth: the first one, and this one */
  itemMenu.innerHTML = '<div class="imHead">The cave</div><button data-o="o">Opus\'s cave</button><button data-o="f">Fable\'s cave</button><button data-o="x">Cancel</button>';
  itemMenu.hidden = false; itemMenu.style.left = Math.max(8, Math.min(innerWidth - 180, lastPtr.x + 6)) + 'px'; itemMenu.style.top = Math.max(8, Math.min(innerHeight - itemMenu.offsetHeight - 8, lastPtr.y - 10)) + 'px';
  itemMenu.onclick = e => { const b = e.target.closest('button'); if (!b) return; itemMenu.hidden = true; if (b.dataset.o === 'o') caveWalkIn(askCave); else if (b.dataset.o === 'f') caveWalkIn(askFable); };
}
function askFable(){
  if (FIGHT) { showToast("You can't go in there while you're fighting!"); return; }
  if (DELVE || CAVE) return;
  buildFable(); if (FIGHT) endFight(); cancelChop(); if (EV.seat >= 0) standUp();
  walkTarget = null; walkQueue = []; walkThen = null;
  CAVE = { fable: true, room: 'stair', mons: [], seen: { stair: 1 }, cleared: {}, won: false, opened: 0, last: performance.now() };
  FBS = { mir: [1, 1, 1, 0], lit: false, levers: [0, 0, 0], flares: 0, flare: null, cool: 0, heat: 1, drank: false, hound: null, told: 0, steamAt: 0 };
  hero.position.set(FB_AT.arrive[0], 0, FB_AT.arrive[1]); heroShadow.position.set(hero.position.x, 0.06, hero.position.z); heroAnim.yaw = Math.PI;
  for (const k in FB_MONS) for (const [t, x, z] of FB_MONS[k]) { const m = caveSpawn(t, x, z, k); if (t === 'magmaRat') fbMagma(m); }
  FBS.hound = caveSpawn('moltenHound', FB_AT.hound[0], FB_AT.hound[1], 'furnace'); FBS.hound.g.rotation.y = 0; FBS.base = MONSTER_TYPES.moltenHound;
  FB.gates.forEach(g => { g.open = false; g.at = 0; g.mesh.visible = true; g.mesh.position.y = 1.6; if (!solidBoxes.includes(g.box)) solidBoxes.push(g.box); });
  FB.levers.forEach(L => { L.arm.rotation.x = 0; L.knob.material.color.set(0x4ab8e8); }); FB.springW.visible = true; FB.rope2.visible = false; FB.steam.forEach(s => s.visible = false);
  if (FB.chest) { scene.remove(FB.chest.g); const i = trees.indexOf(FB.chest.g); if (i >= 0) trees.splice(i, 1); FB.chest = null; } if (FB.chestBox) { const i = solidBoxes.indexOf(FB.chestBox); if (i >= 0) solidBoxes.splice(i, 1); }
  fbBeam();
  addSystemLine('The Ember Deep: something burns at the bottom. The rope behind you leads back up.');
  writePresence(true); updateDayNight.next = 0;
}
// a magma rat is a cave rat gone dark, with embers along its back
function fbMagma(m){ const body = m.g.userData.parts && m.g.userData.parts.body; if (!body) return;
  m.g.traverse(o => { if (o.isMesh && o.material && o.material.isMeshToonMaterial) o.material = toonMat(0x2a2624); });
  for (const [x, y, z] of [[0, 1.2, -0.2], [0.25, 1.05, 0.2], [-0.28, 1.0, -0.5], [0.1, 1.1, -0.7]]) { const e = new THREE.Mesh(gRound(0.1, 8), new THREE.MeshBasicMaterial({ color: 0xff7a14, toneMapped: false })); e.position.set(x, y, z); e.scale.set(1, 0.5, 1.6); e.userData.shadowSet = true; body.add(e); } }
function fbGate(i, open){ const g = FB.gates[i]; if (g.open === open) return; g.open = open; g.at = performance.now(); const j = solidBoxes.indexOf(g.box); if (open && j >= 0) solidBoxes.splice(j, 1); if (open) { caveRumble(); caveChime(); } }

// ----- the Mirror Gallery -----
// A mirror is one of two ways round. Seen from above with north at the top, 0 is "/" (east turns north, north turns east) and 1 is "\" (east turns south, north turns west).
function fbBeam(){
  let x = FB_EMIT[0], z = FB_EMIT[1], dx = 1, dz = 0, n = 0, lit = false; const R = FB_ROOMS.gallery;
  FB.beams.forEach(b => b.visible = false);
  for (let step = 0; step < 6; step++) {
    let best = null, bd = 1e9; FB_MIRRORS.forEach(([mx, mz], i) => { const d = (mx - x) * dx + (mz - z) * dz, off = Math.abs((mx - x) * dz) + Math.abs((mz - z) * dx); if (d > 0.3 && off < 0.2 && d < bd) { bd = d; best = i; } });
    const cd = (FB_CATCH[0] - x) * dx + (FB_CATCH[1] - z) * dz, coff = Math.abs((FB_CATCH[0] - x) * dz) + Math.abs((FB_CATCH[1] - z) * dx);
    let len, next = null;
    if (cd > 0.3 && coff < 0.2 && cd < bd) { len = cd; lit = true; }
    else if (best !== null) { len = bd; next = best; }
    else len = dx > 0 ? R.x1 - x : dx < 0 ? x - R.x0 : dz > 0 ? R.z1 - z : z - R.z0;
    const b = FB.beams[n++]; b.visible = true; b.position.set(x + dx * len / 2, 1.7, z + dz * len / 2); b.scale.set(dx ? len : 0.1, 0.1, dz ? len : 0.1);
    if (next === null) break;
    x = FB_MIRRORS[next][0]; z = FB_MIRRORS[next][1]; const t = FBS.mir[next], ox = dx; if (t === 0) { dx = -dz; dz = -ox; } else { dx = dz; dz = ox; }
  }
  FB.catch.material.color.set(lit ? 0xfff2b0 : 0x3a4a58);
  if (lit && !FBS.lit) { FBS.lit = true; setTimeout(() => { if (CAVE && CAVE.fable) { fbGate(1, true); showToast('The crystal fills with light, and the slab to the north sinks into the floor.'); } }, 500); }
}
function fbMirrorClick(i){ if (!CAVE || !CAVE.fable) return; const [x, z] = FB_MIRRORS[i];
  caveGo(x, z, 1.7, () => { if (FBS.lit) { showToast('The mirrors have locked in place.'); return; } FBS.mir[i] ^= 1; creakSound(0.35); fbBeam(); }); }
function fbSpringClick(){ if (!CAVE || !CAVE.fable) return; if (FIGHT) { showToast("You can't do that while you're fighting!"); return; }
  caveGo(...FB_AT.spring, 2.0, () => { if (FBS.drank) { showToast('The spring has run dry.'); return; } if (HP.cur >= maxHp()) { showToast('You are not hurt.'); return; }
    FBS.drank = true; FB.springW.visible = false; HP.cur = maxHp(); renderStats(); showToast('You drink. The water is ice cold, and you feel whole again.'); }); }

// ----- the Molten Hound -----
function fbLeverClick(i){ if (!CAVE || !CAVE.fable) return; const L = FB.levers[i];
  if (FBS.levers[i]) { showToast('That sluice has run dry.'); return; }
  if (!FBS.flare) { showToast('Save the water for when the hound burns hottest.'); return; }
  caveWork(L.x, L.z, 1.5, 1100, 'Pulling the lever', 'work', () => { if (!CAVE || !CAVE.fable || FBS.levers[i] || !FBS.flare) return; FBS.levers[i] = performance.now(); L.knob.material.color.set(0x3a3f44); fbFlareEnd(true); }); }
function fbFlareStart(now){ const H = FBS.hound;
  if (FIGHT && FIGHT.m === H) endFight(); H.state = 'standing'; H.croom = '_hold'; H.t = { ...FBS.base, def: 9999 };
  FBS.flare = { until: now + FB_FLARE_MS }; caveRumble();
  showToast(FBS.levers.every(v => v) ? 'The hound blazes white hot. There is no water left: get back!' : 'The hound blazes white hot, and nothing can touch it. Pull a sluice lever before it erupts!'); }
function fbFlareEnd(doused){ const H = FBS.hound, now = performance.now(); FBS.flare = null; FBS.flares++; H.croom = 'furnace';
  if (doused) { FBS.cool = now + FB_COOL_MS; H.t = { ...FBS.base, def: 0 }; FBS.steamAt = now; sfx((ctx, t, out) => { out.gain.value = 0.5; nz(ctx, out, t, 1.8, 'highpass', 2600, 900, 0.7, 0.6, 0.03, 1.6); }); H.anim = { kind: 'hurt', t0: now, dur: 700 };
    showToast('Water crashes down and the hound vanishes in steam. Its fire gutters: strike now!'); }
  else { H.t = FBS.base; caveRumble(); H.anim = { kind: 'swing', t0: now, dur: 900 };
    if (CAVE.room === 'furnace' && HP.cur > 0) { const dmg = 5 + Math.floor(Math.random() * 5); HP.cur = Math.max(0, HP.cur - dmg); hitsplat(hero, dmg, 'hit'); combatSound('hit'); combatSound(look.gender === 'female' ? 'hurtF' : 'hurtM'); renderStats(); showToast('The hound erupts, and the blast throws you back!'); if (HP.cur <= 0) playerDies(); } } }
function fbHound(now, dt){ const H = FBS.hound; if (!H) return;
  const alive = H.state !== 'dying' && H.state !== 'dead';
  if (alive) {
    if (FBS.flare) {
      if (FIGHT && FIGHT.m === H) { endFight(); H.state = 'standing'; if (now > FBS.told) { FBS.told = now + 2500; showToast('It is too hot to get near. Pull a sluice lever!'); } }
      if (CAVE.room !== 'furnace') { FBS.flare = null; H.croom = 'furnace'; H.t = FBS.base; }   /* you ran: it settles, and will flare again */
      else if (now > FBS.flare.until) fbFlareEnd(false);
    } else if (FBS.cool) { if (now > FBS.cool) { FBS.cool = 0; H.t = FBS.base; } else if (FIGHT && FIGHT.m === H) FIGHT.nextM = Math.max(FIGHT.nextM, now + 700); }   /* steaming: it can't strike back */
    else if (FBS.flares < FB_FLARE_AT.length && H.hp <= FBS.base.hp * FB_FLARE_AT[FBS.flares] && CAVE.room === 'furnace') fbFlareStart(now);
  }
  const want = !alive ? 1 : FBS.flare ? 1.6 : FBS.cool ? 0.4 : 1; FBS.heat += (want - FBS.heat) * Math.min(1, dt * 4); H.g.userData.heat = FBS.heat;
  if (!alive && !CAVE.won) fbWon();
}
function fbWon(){ CAVE.won = true; FBS.flare = null; FBS.cool = 0; FB.rope2.visible = true;
  const [cx, cz] = FB_AT.chest, C = buildRewardChest(cx, cz); C.g.userData = { action: 'Open', name: 'Reward chest', rec: { kind: 'chest', state: 'standing', x: cx, z: cz, onClick: fbChestClick } }; trees.push(C.g); FB.chest = { ...C, born: performance.now(), opened: false, openAt: 0 };
  FB.chestBox = { x0: cx - 0.9, x1: cx + 0.9, z0: cz - 0.6, z1: cz + 0.6 }; solidBoxes.push(FB.chestBox);
  setTimeout(() => { if (CAVE && CAVE.fable) { showToast('The Molten Hound falls, and its fire goes out. A chest stands in the ash, and a rope drops from above.'); addSystemLine('Open the chest to claim your reward.'); } }, 1200); }
function fbChestClick(){ if (!CAVE || !CAVE.fable || !CAVE.won || CAVE.opened) return;
  caveGo(...FB_AT.chest, 2.2, () => { if (CAVE.opened || !FB.chest) return; CAVE.opened = performance.now(); FB.chest.opened = true; FB.chest.openAt = performance.now(); chestSound(); setTimeout(fbRewards, 1600); }); }
function fbRewards(){
  const coins = 500 + Math.floor(Math.random() * 401);
  quietLevelUps = true; addXp('Melee', 800); addXp('Hitpoints', 800); addXp('Firemaking', 300); quietLevelUps = false;
  addItem('Coins', coins); CAVE_P.fb = (CAVE_P.fb || 0) + 1;
  questJingle(); renderStats(); renderBag(); saveNow(false);
  showRewardScroll({ banner: 'Dungeon complete', title: 'The Ember Deep', sub: 'The mirrors turned, the sluices pulled, and the Molten Hound put out.',
    rewards: `<div class="qr"><span class="qi">${ICON_FOR.Coins || ''}</span>${coins} coins</div>`, xp: '<div class="qr">Melee<b>+800</b></div><div class="qr">Hitpoints<b>+800</b></div><div class="qr">Firemaking<b>+300</b></div>',
    quote: `Times beaten: ${CAVE_P.fb}` });
  addSystemLine('Climb the rope out of the furnace when you\'re ready.');
}

// ----- every frame while you're down here (from updateCave) -----
function fableHud(el){
  const r = FB_ROOMS[CAVE.room], H = FBS && FBS.hound, boss = CAVE.room === 'furnace' && H && !CAVE.won;
  const left = boss ? FBS.levers.filter(v => !v).length : 0, secs = boss && FBS.flare ? Math.max(0, Math.ceil((FBS.flare.until - performance.now()) / 1000)) : 0;
  const sub = !boss ? '' : FBS.flare ? `It erupts in ${secs}` : FBS.cool ? 'Doused: strike now' : `Sluices left: ${left}`;
  const key = (r ? r.name : '') + '|' + sub; if (key === CAVE_HUD_KEY) return; CAVE_HUD_KEY = key;
  el.innerHTML = `<div class="wTitle">${r ? r.name : 'The Ember Deep'}</div>${sub ? `<div class="wSub">${sub}</div>` : ''}`; el.hidden = false;
}
function updateFable(){
  const now = performance.now(), dt = Math.min(0.25, (now - CAVE.last) / 1000); CAVE.last = now;
  const rm = fbRoomAt(hero.position.x, hero.position.z);
  if (rm && rm !== CAVE.room) { CAVE.room = rm; if (!CAVE.seen[rm]) { CAVE.seen[rm] = 1;
    if (rm === 'gallery') showToast('A beam of light crosses the hall, and stops short. The mirrors can be turned.');
    if (rm === 'pit') showToast('Things stir in the ash round the pit.');
    if (rm === 'furnace') { showToast('The Molten Hound lifts its head.'); caveRumble(); } } }
  caveJobStep(now);
  // a room is cleared once everything in it is down: the slab beyond it sinks
  for (const [k, gi] of [['stair', 0], ['pit', 2]]) if (!CAVE.cleared[k] && !CAVE.mons.some(m => m.croom === k && m.state !== 'dying' && m.state !== 'dead')) { CAVE.cleared[k] = 1; setTimeout(() => { if (CAVE && CAVE.fable) { fbGate(gi, true); showToast(k === 'stair' ? 'The slab to the north grinds down into the floor.' : 'The last slab sinks. Heat rolls up the passage.'); } }, 700); }
  // the moving parts
  FB.gates.forEach(g => { if (g.open) { const k = Math.min(1, (now - g.at) / 1500); g.mesh.position.y = 1.6 - 3.4 * k; g.mesh.visible = k < 1; } });
  FB.mirrors.forEach((m, i) => { const want = FBS.mir[i] ? -Math.PI / 4 : Math.PI / 4; m.turn.rotation.y += (want - m.turn.rotation.y) * Math.min(1, dt * 9); });
  FB.lavaM.color.setScalar(0.82 + 0.18 * Math.sin(now / 700)); FB.beamM.opacity = 0.75 + 0.2 * Math.sin(now / 160); FB.lamp.rotation.y = now / 900; FB.catch.rotation.y = -now / 1200;
  FB.levers.forEach((L, i) => { const want = FBS.levers[i] ? 1.9 : 0; L.arm.rotation.x += (want - L.arm.rotation.x) * Math.min(1, dt * 8); });
  { const t = (now - FBS.steamAt) / 2600, on = FBS.steamAt && t < 1, H = FBS.hound; FB.steam.forEach((s, i) => { s.visible = !!on; if (!on) return; const a = i * 2.4, u = Math.min(1, t * (1 + i * 0.07));
      s.position.set(H.g.position.x + Math.sin(a) * (0.6 + u * 2.2), 1.2 + u * (3 + (i % 3)), H.g.position.z + Math.cos(a) * (0.6 + u * 2.2)); s.scale.setScalar(0.8 + u * 1.8); s.material.opacity = 0.75 * (1 - u); }); }
  if (FB.chest) { const C = FB.chest, k = Math.min(1, (now - C.born) / 900); C.g.scale.setScalar(1.5 * Math.max(0.01, 1 - Math.pow(1 - k, 3))); animRewardChest(C, now); }
  fbHound(now, dt);
  caveMobs(now, dt);
  const H = FBS.hound; if (H && H.g.parent) { if (FBS.flare && (!H.anim || now - H.anim.t0 >= H.anim.dur)) { monsterPose(H, 'ready'); H.g.rotation.y = yawTo(H.g.position.x, H.g.position.z, hero.position.x, hero.position.z); } H.g.userData.tick(now / 1000); }
}
