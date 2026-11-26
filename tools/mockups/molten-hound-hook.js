/* The Molten Hound mock-up (see CLAUDE.md). Injected after the game's start-up by molten-hound.js; it never changes the game. */
const { ConvexGeometry } = await import('three/addons/geometries/ConvexGeometry.js');
window.__t = (() => {
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
  const flame = (parent, h, r, x, y, z, rx, rz = 0, bend = 0.35, hot = 0.15) => { const m = new THREE.Mesh(flameGeo(h, r, bend, 0.07, hot), flameMat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.scale.x = 0.72; parent.add(m);
    flames.push({ m, rx, rz, ph: R() * 6, sp: 5 + R() * 5 }); return m; };

  function makeHound(){
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
    g.userData.tick = now => { for (const f of flames) { const a = Math.sin(now * f.sp + f.ph); f.m.rotation.x = f.rx + a * 0.07; f.m.rotation.z = f.rz + Math.cos(now * f.sp * 0.7 + f.ph) * 0.06; const fr = g.userData.fire; f.m.scale.set(0.72 * fr, (1 + a * 0.1) * fr, fr); }
      uFire.value = (1 + Math.sin(now * 2.4) * 0.22) * g.userData.fire;
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
  let hound = null, studioScene = null;
  const snap = (sc, cam, w, h) => { renderer.setSize(w, h, false); renderer.render(sc, cam); return renderer.domElement.toDataURL('image/png'); };
  return {
    ready: () => ONLINE.ready,
    build: () => { hound = makeHound(); hound.userData.tick(1.3); let n = 0; hound.traverse(o => { if (o.isMesh) n++; }); const bx = new THREE.Box3().setFromObject(hound), s = bx.getSize(new THREE.Vector3());
      return { meshes: n, size: [+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)], minY: +bx.min.y.toFixed(2), heroTop: +new THREE.Box3().setFromObject(hero).max.y.toFixed(2) }; },
    studio: (px, py, pz, lx, ly, lz, fov) => { if (!studioScene) { studioScene = new THREE.Scene(); studioScene.background = new THREE.Color(0xf4f1ea); studioScene.add(new THREE.AmbientLight(0xffffff, 1.5)); const d = new THREE.DirectionalLight(0xffffff, 2.4); d.position.set(4, 9, 6); studioScene.add(d); }
      studioScene.add(hound); hound.position.set(0, 0, 0); hound.rotation.y = 0; const cam = new THREE.PerspectiveCamera(fov, 1.6, 0.3, 200); cam.position.set(px, py, pz); cam.lookAt(lx, ly, lz); return snap(studioScene, cam, 1600, 1000); },
    place: () => { const x = hero.position.x + 4.2, z = hero.position.z + 0.5; hound.position.set(x, hero.position.y, z); hound.rotation.y = -Math.PI / 2; scene.add(hound); hero.rotation.y = Math.PI / 2;
      return [+x.toFixed(1), +hero.position.y.toFixed(2), +z.toFixed(1)]; },
    anim: (mode, k, now, hx) => { hound.position.x = hero.position.x + hx; hound.userData.pose(mode, k, now); hound.userData.tick(now); const cam = new THREE.PerspectiveCamera(34, 1.6, 0.3, 500); cam.position.set(hero.position.x + 2.4, hero.position.y + 3.0, hero.position.z + 11.5); cam.lookAt(hero.position.x + 2.6, hero.position.y + 1.7, hero.position.z); renderer.setSize(800, 500, false); renderer.render(scene, cam); return renderer.domElement.toDataURL('image/jpeg', 0.92); },
    feet: () => { hound.userData.pose('idle', 0, 0); hound.updateMatrixWorld(true); let lo = 1e9; hound.traverse(o => { if (o.isMesh && o.material !== outlineMat) { const b = new THREE.Box3().setFromObject(o); lo = Math.min(lo, b.min.y); } }); return +(lo - hound.position.y).toFixed(3); },
    world: () => { const cam = new THREE.PerspectiveCamera(34, 1.6, 0.3, 500); cam.position.set(hero.position.x + 2, hero.position.y + 3.2, hero.position.z + 11); cam.lookAt(hero.position.x + 2.2, hero.position.y + 1.7, hero.position.z); return snap(scene, cam, 1600, 1000); },
  };
})();
