// ----- extra looks: more hairstyles, the dresses and the flower crown, and the painted hair and cloth -----
/* hair cut into the skull: a sphere pushed out by each style's thickness over the head, the rest tucked inside it (front +z, up +y) */
const chibiSS = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const chibiG = (v, s) => Math.exp(-v * v / (2 * s * s));
const chibiLine = (z, front, side = 0.08, back = -0.5) => front * Math.max(z, 0) ** 1.2 + back * Math.max(-z, 0) ** 1.5 + side * (1 - Math.abs(z));
const CHIBI_SHELLS = (() => { const ss = chibiSS, G = chibiG, L = chibiLine; return {
  frcrop: (x, y, z) => { const h = L(z, 0.28); return ss(h, h + 0.02, y) * (0.08 + 0.08 * ss(0.4, 0.9, y) + 0.06 * G(z - 0.88, 0.18)); },
  middlepart: (x, y, z) => { const h = L(z, 0.22) + 0.32 * G(x, 0.1) * Math.max(z, 0); return ss(h, h + 0.04, y) * (0.07 + 0.12 * ss(0.3, 0.85, y) + 0.1 * Math.max(z, 0) * (1 - G(x, 0.1)) * ss(0.2, 0.55, y)); },
  pompadour: (x, y, z) => { const h = L(z, 0.52); return ss(h, h + 0.04, y) * (0.03 + 0.08 * ss(0.4, 0.8, y) + 0.5 * G(z - 0.5, 0.25) * G(y - 0.78, 0.2) * G(x, 0.42)); },
  fauxhawk: (x, y, z) => { const h = L(z, 0.5); return ss(h, h + 0.04, y) * (0.02 + 0.42 * G(x, 0.14) * ss(0.3, 0.8, y) * (0.5 + 0.5 * Math.max(z, 0))); },
  longloose: (x, y, z) => { const h = L(z, 0.48, -0.5, -1.2); return ss(h, h + 0.04, y) * (0.07 + 0.1 * ss(0.3, 0.9, y) + 0.32 * ss(0.3, -0.6, y) * Math.max(-z + 0.2, 0)); },
}; })();
function chibiShellGeo(hs, out){
  return geo('shell|' + hs + (out ? '|o' : ''), () => {
    const g = new THREE.SphereGeometry(1, 128, 96), p = g.attributes.position, v = new THREE.Vector3(), fn = CHIBI_SHELLS[hs];
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const t = fn(v.x, v.y, v.z), r = t > 0.002 ? 1 + t + (out ? 0.035 : 0.004) : 0.93; p.setXYZ(i, v.x * r * 0.651, v.y * r * 0.589, v.z * r * 0.62); }
    g.computeVertexNormals(); return g;
  });
}
function chibiShell(head, hs, hc){
  const m = new THREE.Mesh(chibiShellGeo(hs), toonMat(hc)); m.castShadow = true; m.userData.shadowSet = true; head.add(m);
  const o = new THREE.Mesh(chibiShellGeo(hs, true), outlineMat); o.userData.shadowSet = true; head.add(o);
}
function chibiBow(p, x, y, z, col, s = 1){
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); p.add(g); chibiPart(g, gRound(0.06, 10), col, 0, 0, 0);
  for (const k of [-1, 1]) { chibiPart(g, gRound(0.11, 12), col, k * 0.14, 0.02, 0).scale.set(1.3, 0.8, 0.5); chibiPart(g, gCapsule(0.035, 0.14), col, k * 0.07, -0.13, 0).rotation.z = k * 0.4; }
  return g;
}
const chibiTwoSided = m => { m.material = m.material.clone(); m.material.side = THREE.DoubleSide; return m; };
function chibiExtras(o, female, outfit, body, torso, head, arms, legs, hs, hc){
  const P = chibiPart, R = gRound, C = gCapsule, CY = (a, b, h, n = 20, open = false) => geo(`cy|${a}|${b}|${h}|${n}|${open}`, () => new THREE.CylinderGeometry(a, b, h, n, 1, open));
  // the new hairstyles that sit over the round cap
  const fall = () => P(head, R(0.56, 28), hc, 0, -0.26, -0.2).scale.set(1.22, 1.22, 0.78);
  if (hs === 'braid') { P(head, R(0.15, 12), hc, 0, -0.05, -0.64); for (let i = 0; i < 6; i++) P(head, R(0.13 - i * 0.008, 12), hc, i % 2 ? 0.03 : -0.03, -0.22 - i * 0.17, -0.66 - i * 0.015).scale.set(1, 1.15, 0.9); P(head, R(0.07, 10), 0xd04a6a, 0, -1.2, -0.75); }
  if (hs === 'spacebuns') for (const s of [-1, 1]) P(head, R(0.21, 16), hc, s * 0.4, 0.55, -0.1);
  if (hs === 'mouseears') for (const s of [-1, 1]) { const e = P(head, R(0.26, 20), hc, s * 0.46, 0.62, -0.12); e.scale.set(1, 1, 0.6); e.rotation.z = -s * 0.35; }
  if (hs === 'lowbun') { P(head, R(0.24, 16), hc, 0, -0.18, -0.66).scale.set(1.2, 1, 0.9); P(head, C(0.03, 0.42), 0xd8b048, 0.05, -0.12, -0.84).rotation.z = 1.2; }
  if (hs === 'waves') { P(head, R(0.56, 28), hc, 0, -0.2, -0.22).scale.set(1.2, 1.1, 0.75); for (let i = 0; i < 5; i++) { const x = -0.3 + i * 0.15; P(head, R(0.14, 12), hc, x, -0.58 - (i % 2) * 0.07, -0.55 - Math.abs(x) * 0.08); }   /* curls tucked behind, clear of the arms */ }
  if (hs === 'halfup') { fall(); chibiBow(head, 0, 0.18, -0.68, 0xe070a0, 1); }
  // the flower crown
  if (o.acc === 'flowers') for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; P(head, R(0.075, 8), [0xf2f2f2, 0xf0a0c0, 0xf0d060, 0xa0c0f0][i % 4], Math.cos(a) * 0.58, 0.42 + Math.sin(a) * 0.08, Math.sin(a) * 0.58 - 0.04, false); P(head, R(0.05, 6), 0x4a8a3a, Math.cos(a + 0.2) * 0.6, 0.41, Math.sin(a + 0.2) * 0.6 - 0.04, false); }
  // the dresses (the plain skirt is left out when one is on)
  const d = o.dressCol || 0xaa4c8a, tr = o.trimCol || 0xf2ece0, cream = 0xf2ece0;
  if (outfit === 'gown') { chibiTwoSided(P(body, CY(0.34, 0.66, 0.85, 24, true), d, 0, 0.42, 0)); P(body, geo('gownHem', () => new THREE.TorusGeometry(0.64, 0.04, 8, 32)), tr, 0, 0.04, 0).rotation.x = Math.PI / 2; P(body, CY(0.37, 0.37, 0.09), tr, 0, 0.84, 0); for (const l of legs) l.children[0].visible = false; }
  if (outfit === 'pinafore') { P(body, CY(0.34, 0.54, 0.48), d, 0, 0.72, 0); chibiTwoSided(P(body, geo('apron', () => new THREE.CylinderGeometry(0.36, 0.56, 0.46, 20, 1, true, -0.7, 1.4)), cream, 0, 0.71, 0.01)); P(body, geo('bib', () => new THREE.BoxGeometry(0.34, 0.3, 0.06)), cream, 0, 1.05, 0.3).rotation.x = -0.15; for (const s of [-1, 1]) P(body, geo('strap', () => new THREE.BoxGeometry(0.06, 0.4, 0.06)), cream, s * 0.18, 1.18, 0.22, false).rotation.x = -0.3; }
  if (outfit === 'puff') { P(body, CY(0.34, 0.52, 0.44), d, 0, 0.74, 0); for (const a of arms) P(a, R(0.17, 14), d, 0, -0.05, 0); P(body, geo('collar', () => new THREE.TorusGeometry(0.3, 0.05, 8, 24)), tr, 0, 1.38, 0.02).rotation.x = Math.PI / 2; }
  if (outfit === 'sash') { P(body, CY(0.34, 0.56, 0.5), d, 0, 0.71, 0); P(body, CY(0.385, 0.385, 0.12), tr, 0, 0.92, 0); chibiBow(body, 0, 0.92, -0.38, tr, 1.2); }
  if (outfit === 'tiered') { P(body, CY(0.34, 0.46, 0.22), d, 0, 0.84, 0); P(body, CY(0.47, 0.58, 0.24), tr, 0, 0.62, 0); P(body, geo('tierHem', () => new THREE.TorusGeometry(0.58, 0.035, 6, 30)), cream, 0, 0.5, 0).rotation.x = Math.PI / 2; }
  if (outfit === 'bodice') { P(body, CY(0.34, 0.6, 0.62, 22), d, 0, 0.62, 0); P(body, CY(0.38, 0.4, 0.34), tr, 0, 1.0, 0).scale.set(1, 1, 0.88); for (let i = 0; i < 4; i++) P(body, geo('lace', () => new THREE.BoxGeometry(0.16, 0.02, 0.02)), cream, 0, 0.88 + i * 0.07, 0.35, false); }
  if (outfit === 'puff' || outfit === 'gown') for (const a of arms) a.children[0].material = toonMat(d);   // sleeves in the dress colour
  if (outfit && outfit !== 'pinafore') torso.material = toonMat(outfit === 'bodice' || outfit === 'tiered' ? o.shirt : d);
  // painted strands on the hair, and cloth on the clothes
  const hex = c => new THREE.Color(c).getHex(), skin = hex(o.skin);
  if (hex(hc) !== skin) head.traverse(m => { if (m.isMesh && m.material && m.material.isMeshToonMaterial && m.material.color.getHex() === new THREE.Color(hc).getHex()) m.material = chibiTexMat(hc, 'hair', m.material.side); });
  body.traverse(m => { if (!m.isMesh || !m.material || !m.material.isMeshToonMaterial || m.material.map) return; const c = m.material.color.getHex(), side = m.material.side;
    for (let a = m.parent; a; a = a.parent) if (a === head) return;   /* the hair and face are done above */
    if (c === skin) return;
    const kind = c === new THREE.Color(o.pants).getHex() ? 'twill' : c === new THREE.Color(o.boots || 0x5a3a22).getHex() ? 'leather' : (c === new THREE.Color(o.shirt).getHex() || (outfit && (c === new THREE.Color(d).getHex() || c === new THREE.Color(tr).getHex()))) ? 'linen' : null;
    if (kind) m.material = chibiTexMat(c, kind, side); });
}
/* the shared pictures: greyscale, so they tint to any colour; one per kind, one material per colour and kind */
const CHIBI_TEX = {}, chibiTexCache = {};
function chibiTexture(kind){
  if (CHIBI_TEX[kind]) return CHIBI_TEX[kind];
  let seed = { hair: 7, linen: 11, twill: 13, leather: 17 }[kind]; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const W = kind === 'hair' ? 1024 : 256, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  if (kind === 'hair') for (let i = 0; i < 260; i++) { const x = rnd() * W, w = 1 + rnd() * 3, dark = rnd() < 0.75; g.strokeStyle = dark ? `rgba(60,40,30,${0.18 + rnd() * 0.22})` : `rgba(255,255,255,${0.25 + rnd() * 0.25})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, rnd() * 40); g.bezierCurveTo(x + (rnd() - 0.5) * 14, 90, x + (rnd() - 0.5) * 14, 170, x + (rnd() - 0.5) * 10, H - rnd() * 40); g.stroke(); }
  if (kind === 'linen') { for (let y = 0; y < H; y += 8) { g.fillStyle = `rgba(0,0,0,${0.06 + rnd() * 0.05})`; g.fillRect(0, y, W, 3); } for (let x = 0; x < W; x += 8) { g.fillStyle = `rgba(0,0,0,${0.05 + rnd() * 0.04})`; g.fillRect(x, 0, 3, H); } for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.22})`; g.fillRect(rnd() * W, rnd() * H, 5, 2); } }
  if (kind === 'twill') { g.lineWidth = 4; for (let i = -H; i < W; i += 10) { g.strokeStyle = `rgba(0,0,0,${0.09 + rnd() * 0.07})`; g.beginPath(); g.moveTo(i, H); g.lineTo(i + H, 0); g.stroke(); } for (let i = 0; i < 250; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.18})`; g.fillRect(rnd() * W, rnd() * H, 3, 3); } }
  if (kind === 'leather') { for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.12})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, 6 + rnd() * 22, 0, 7); g.fill(); } g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1.5; for (let i = 0; i < 40; i++) { const x = rnd() * W, y = rnd() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 30, y + (rnd() - 0.5) * 10); g.stroke(); } }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  t.repeat.set(...({ hair: [2, 1], linen: [2, 2], twill: [2, 2], leather: [1, 1] }[kind])); return (CHIBI_TEX[kind] = t);
}
function chibiTexMat(c, kind, side = THREE.FrontSide){
  const k = c + '|' + kind + '|' + side;
  return chibiTexCache[k] || (chibiTexCache[k] = new THREE.MeshToonMaterial({ color: c, gradientMap: toonRamp, map: chibiTexture(kind), side }));
}

/* the face options: drawn flat on the skin (a 0.62 sphere scaled 1.05, 0.95, 1), so nothing pokes out */
const faceOn = (x, y, lift) => new THREE.Vector3(x, y, 0.62 * Math.sqrt(Math.max(0, 1 - (x / 0.651) ** 2 - (y / 0.589) ** 2)) + lift);
const faceGeo = {
  arc: (r, t, a) => geo(`fArc|${r}|${t}|${a}`, () => new THREE.TorusGeometry(r, t, 6, 16, a)),
  cap: (r, l) => geo(`fCap|${r}|${l}`, () => new THREE.CapsuleGeometry(r, l, 4, 8)),
  disc: (r, a = 0, b = Math.PI * 2) => geo(`fDisc|${r}|${a}|${b}`, () => new THREE.CircleGeometry(r, 18, a, b)),
};
let faceShadeTex = null;
function chibiFace(o, head, eyes, smile, hc){
  /* the expression (brows, eye shapes, mouth) goes in one group so a fight face can hide it; nose, freckles and cheeks sit on the head */
  const parts = new THREE.Group(); head.add(parts); let into = parts; const allEyes = eyes.slice();
  const put = (g, col, x, y, lift, rz = 0, op = 1) => { const m = new THREE.Mesh(g, basic(col, op)); m.position.copy(faceOn(x, y, lift)); m.lookAt(m.position.clone().multiplyScalar(2)); m.rotateZ(rz); into.add(m); return m; };
  const INK = 0x1a1410, LIP = 0x5a2a2a, skinC = new THREE.Color(o.skin || 0xe8c39c);
  const browC = hc === 0x10fe01 || o.hair === 'bald' ? 0x3a2a1a : new THREE.Color(hc).multiplyScalar(0.7).getHex();
  const drop = list => { for (const m of list) { m.visible = false; eyes.splice(eyes.indexOf(m), 1); } };   /* hidden, not thrown away: a fight face opens them again */
  // eyebrows
  const b = o.brows;
  if (b === 'soft') for (const s of [-1, 1]) put(faceGeo.arc(0.1, 0.018, 2.0), browC, s * 0.23, 0.17, 0.006, Math.PI / 2 - 1.0);
  if (b === 'straight') for (const s of [-1, 1]) put(faceGeo.cap(0.02, 0.14), browC, s * 0.23, 0.2, 0.01, Math.PI / 2 + s * 0.08);
  if (b === 'bold') for (const s of [-1, 1]) put(faceGeo.cap(0.032, 0.15), browC, s * 0.23, 0.2, 0.01, Math.PI / 2 - s * 0.25);
  if (b === 'worried') for (const s of [-1, 1]) put(faceGeo.cap(0.02, 0.13), browC, s * 0.23, 0.21, 0.01, Math.PI / 2 + s * 0.35);
  // eye shapes (the round eye is the default; blinking only touches what's left in eyes)
  const e = o.eyeShape;
  if (e === 'lashes') for (const s of [-1, 1]) { put(faceGeo.arc(0.1, 0.016, 2.4), INK, s * 0.22, 0.04, 0.03, Math.PI / 2 - 1.2); for (let k = 0; k < 2; k++) put(faceGeo.cap(0.012, 0.05), INK, s * (0.3 + k * 0.03), 0.12 - k * 0.04, 0.03, s * (0.9 + k * 0.4)); }
  if (e === 'sparkle') for (let i = 0; i < eyes.length; i += 2) { eyes[i].scale.x *= 1.15; eyes[i].scale.z *= 1.15; const sh = new THREE.Mesh(gRound(0.022, 8), basic(0xffffff)); sh.position.set(-0.03 / 0.92, -0.06 / 1.15, 0.12); sh.scale.set(1 / 0.92, 1 / 1.15, 1); eyes[i].add(sh); }
  if (e === 'sleepy') for (const s of [-1, 1]) { put(faceGeo.disc(0.105, 0, Math.PI), skinC.getHex(), s * 0.22, 0.03, 0.075); put(faceGeo.cap(0.013, 0.17), INK, s * 0.22, 0.03, 0.08, Math.PI / 2); }
  if (e === 'happy') { drop(eyes.slice()); for (const s of [-1, 1]) put(faceGeo.arc(0.08, 0.02, Math.PI), INK, s * 0.22, -0.01, 0.012); }
  if (e === 'wink') { drop(eyes.slice(2, 4)); put(faceGeo.arc(0.08, 0.02, Math.PI), INK, 0.22, -0.01, 0.012); }
  // mouths (the smile is the default)
  const mo = o.mouth;
  if (mo && mo !== 'smile' && mo !== 'tongue') smile.visible = false;
  if (mo === 'grin') { put(faceGeo.disc(0.09, Math.PI, Math.PI), LIP, 0, -0.13, 0.006); put(faceGeo.disc(0.075, Math.PI + 0.25, Math.PI - 0.5), 0xffffff, 0, -0.14, 0.009).scale.y = 0.45; }
  if (mo === 'open') { put(faceGeo.disc(0.05), LIP, 0, -0.16, 0.006).scale.y = 1.2; put(faceGeo.disc(0.03), 0xe06a6a, 0, -0.185, 0.009).scale.y = 0.6; }
  if (mo === 'cat') for (const s of [-1, 1]) put(faceGeo.arc(0.035, 0.014, Math.PI), LIP, s * 0.035, -0.13, 0.006, Math.PI);
  if (mo === 'smirk') put(faceGeo.arc(0.06, 0.02, 2.0), LIP, 0.04, -0.15, 0.006, Math.PI + 0.6);
  if (mo === 'tongue') put(faceGeo.disc(0.035, Math.PI, Math.PI), 0xe06a6a, 0, -0.165, 0.008).scale.y = 1.3;
  // nose, freckles and blush lines
  into = head;
  const dk = skinC.clone().multiplyScalar(0.72).getHex();
  if (o.nose === 'button') chibiPart(head, gRound(0.075, 12), skinC.clone().multiplyScalar(0.9).getHex(), 0, -0.05, 0.6).scale.set(1.1, 0.85, 0.7);
  if (o.nose === 'dot') put(faceGeo.disc(0.022), dk, 0, -0.05, 0.004).scale.x = 1.4;
  if (o.nose === 'line') put(faceGeo.cap(0.01, 0.06), dk, 0.02, -0.03, 0.004, 0.15);
  if (o.freckles === 'some') for (const s of [-1, 1]) for (const [x, y] of [[0.3, -0.12], [0.36, -0.08], [0.33, -0.17], [0.4, -0.14], [0.27, -0.07], [0.42, -0.06]]) put(faceGeo.disc(0.012), 0x9a5a3a, s * x, y, 0.004, 0, 0.7);
  if (o.cheeks === 'lines') for (const s of [-1, 1]) for (let k = 0; k < 3; k++) put(faceGeo.cap(0.008, 0.05), 0xe06a7a, s * (0.33 + k * 0.035), -0.15, 0.03, -0.5, 0.8);
  // soft shading for everyone: a touch lighter on the brow, warmer low on the cheeks and chin
  if (!faceShadeTex) { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 256; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#fff8f2'); gr.addColorStop(0.62, '#ffe8dc'); gr.addColorStop(1, '#f2c8b8'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
    faceShadeTex = new THREE.CanvasTexture(cv); faceShadeTex.colorSpace = THREE.SRGBColorSpace; }
  const skinMesh = head.children[0]; if (skinMesh && skinMesh.material && skinMesh.material.isMeshToonMaterial) { const k = (o.skin || 0) + '|faceShade'; skinMesh.material = chibiTexCache[k] || (chibiTexCache[k] = new THREE.MeshToonMaterial({ color: skinMesh.material.color.clone(), gradientMap: toonRamp, map: faceShadeTex })); }
  return { parts, allEyes, eyes: eyes.slice(), smileOn: smile.visible };
}
function makeChibi(o){
  const g = new THREE.Group(), body = new THREE.Group(), female = o.gender === 'female';
  g.add(body);
  const legs = [], arms = [];
  for (const x of [-0.2, 0.2]) {
    const leg = new THREE.Group(); leg.position.set(x, 0.62, 0); body.add(leg); legs.push(leg);
    chibiPart(leg, gCapsule(0.15, 0.3), o.pants, 0, -0.25, 0);
    chibiPart(leg, gRound(0.19, 16), o.boots || 0x5a3a22, 0, -0.5, 0.06).scale.set(1, 0.65, 1.3);   // boots
  }
  const torso = chibiPart(body, gCapsule(female ? 0.36 : 0.38, 0.35), o.shirt, 0, 1.0, 0); torso.scale.set(1, 1, 0.85);
  const outfit = female && o.outfit && o.outfit !== 'none' ? o.outfit : null;
  if (female && !outfit) chibiPart(body, geo('skirt', () => new THREE.CylinderGeometry(0.34, 0.5, 0.4, 20)), o.pants, 0, 0.75, 0);
  else {
    // the trousers come right up to the belt: a rounded hip piece covers the bottom of the shirt
    chibiPart(body, geo('hips', () => new THREE.SphereGeometry(0.41, 20, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5)), o.pants, 0, 0.82, 0).scale.set(1, 1, 0.9);
    chibiPart(body, geo('belt', () => new THREE.CylinderGeometry(0.385, 0.385, 0.1, 20)), 0x5a3a1a, 0, 0.8, 0, false);
  }
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * 0.42, 1.25, 0); body.add(arm); arms.push(arm);
    chibiPart(arm, gCapsule(0.11, 0.3), o.shirt, 0, -0.2, 0);
    chibiPart(arm, gRound(0.14, 14), o.skin, 0, -0.45, 0);
  }
  // the head: big eyes with a shine, rosy cheeks and a smile
  const head = new THREE.Group(); head.position.set(0, 1.95, 0); body.add(head);
  chibiPart(head, gRound(0.62), o.skin, 0, 0, 0).scale.set(1.05, 0.95, 1);
  const eyes = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(gRound(0.12, 16), basic(o.eye || 0x1e1a2a)); eye.scale.set(0.8, 1.15, 0.5); eye.position.set(s * 0.22, 0.02, 0.56); head.add(eye); eyes.push(eye);
    const shine = new THREE.Mesh(gRound(0.04, 8), basic(0xffffff)); shine.position.set(s * 0.22 + 0.03, 0.08, 0.62); head.add(shine); eyes.push(shine);
    if (o.cheeks !== 'lines' && (o.cheeks === 'rosy' || ((!o.cheeks || o.cheeks === 'auto') && female))) { const cheek = new THREE.Mesh(gRound(0.08, 12), basic(0xff8f8f, 0.55)); cheek.scale.set(1.3, 0.7, 0.3); cheek.position.set(s * 0.36, -0.16, 0.5); head.add(cheek); }   // rosy cheeks on the female build only
  }
  const smile = g.userData.smile = new THREE.Mesh(geo('smile', () => new THREE.TorusGeometry(0.07, 0.018, 6, 12, Math.PI)), basic(0x5a2a2a)); smile.rotation.z = Math.PI; smile.position.set(0, -0.14, 0.6); head.add(smile);
  // hair: a rounded cap tipped forward over the brow, and a patch behind the ears down to the nape so no scalp shows
  const hs = o.hair || 'short', hc = o.hairCol;
  if (hs !== 'bald') {
    if (CHIBI_SHELLS[hs]) chibiShell(head, hs, hc);
    else if (hs === 'buzz') chibiPart(head, geo('buzzCap', () => new THREE.SphereGeometry(0.64, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.46)), hc, 0, 0.02, -0.04).rotation.x = -0.2;   // close-cropped, no fringe
    else chibiPart(head, geo('cap', () => new THREE.SphereGeometry(0.66, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5)), hc, 0, 0.04, -0.03).rotation.x = -0.35;
    if (!CHIBI_SHELLS[hs]) { const nape = chibiPart(head, geo('nape', () => new THREE.SphereGeometry(0.655, 24, 12, Math.PI * 1.14, Math.PI * 0.72, Math.PI * 0.2, Math.PI * 0.55)), hc, 0, 0.02, -0.02, false);
    nape.material = nape.material.clone(); nape.material.side = THREE.DoubleSide; }
  }
  if (hs === 'long') chibiPart(head, gRound(0.56, 28), hc, 0, -0.26, -0.2).scale.set(1.22, 1.22, 0.78);   // one smooth fall behind the head
  if (hs === 'ponytail') {   // tied high at the back with a ribbon, curving down behind the neck, clear of the shoulders
    chibiPart(head, gRound(0.15, 12), hc, 0, 0.36, -0.62); chibiPart(head, gRound(0.07, 10), 0xe05a8a, 0, 0.3, -0.74);
    const tail = new THREE.Group(); tail.position.set(0, 0.3, -0.76); tail.rotation.x = 0.45; head.add(tail);
    for (let i = 0; i < 5; i++) chibiPart(tail, gRound(0.17 - i * 0.022, 12), hc, 0, -0.12 - i * 0.16, -0.04 * i).scale.set(1, 1.3, 0.85);
  }
  if (hs === 'pigtails') for (const s of [-1, 1]) {   // two braided bunches tied with ribbons, hanging behind the shoulders
    chibiPart(head, gRound(0.14, 12), hc, s * 0.56, 0.12, -0.32); chibiPart(head, gRound(0.065, 10), 0xe05a8a, s * 0.64, 0.02, -0.36);
    for (let i = 0; i < 4; i++) chibiPart(head, gRound(0.13 - i * 0.015, 12), hc, s * (0.7 + i * 0.03), -0.1 - i * 0.17, -0.4 - i * 0.02).scale.set(0.9, 1.25, 0.9);
  }
  if (hs === 'bob') {   // a rounded bob down to the jaw, open at the face
    const bob = chibiPart(head, geo('bob', () => new THREE.SphereGeometry(0.7, 28, 14, Math.PI * 0.8, Math.PI * 1.4, Math.PI * 0.22, Math.PI * 0.46)), hc, 0, 0.02, -0.02, false);
    bob.material = bob.material.clone(); bob.material.side = THREE.DoubleSide; bob.scale.set(1.04, 1, 1.02);
  }
  if (hs === 'spiky') for (let i = 0; i < 9; i++) {   // spikes standing up off the crown
    const a = i / 9 * Math.PI * 2, r = i % 2 ? 0.4 : 0.22, sp = chibiPart(head, geo('spike', () => new THREE.ConeGeometry(0.15, 0.5, 6)), hc, Math.cos(a) * r, 0.7 - r * 0.35, Math.sin(a) * r - 0.08);
    sp.rotation.set(Math.sin(a) * r * 1.6, 0, -Math.cos(a) * r * 1.6);
  }
  if (hs === 'curly') for (let i = 0; i < 16; i++) {   // a mop of round curls over the top and back
    const a = i * 2.39996, y = 0.1 + (i % 4) * 0.13, rr = Math.sqrt(Math.max(0, 0.68 * 0.68 - y * y));
    const z = Math.sin(a) * rr; if (z > 0.38 && y < 0.35) continue;   // keep the face clear
    chibiPart(head, gRound(0.17, 10), hc, Math.cos(a) * rr, y, z - 0.04);
  }
  chibiExtras(o, female, outfit, body, torso, head, arms, legs, hs, hc);
  const face = chibiFace(o, head, eyes, smile, hc);
  const knot = hs === 'topknot' ? chibiPart(head, gRound(0.2, 14), hc, 0, 0.7, -0.15) : null;
  // tools and worn gear
  const tools = { axe: makeTool('axe'), pick: makeTool('pick'), hoe: makeTool('hoe'), can: makeTool('can') };
  for (const t of Object.values(tools)) { t.position.set(0, -0.45, 0); arms[1].add(t); }
  const gear = new THREE.Group(); body.add(gear);
  g.scale.setScalar(CHIBI_SCALE);
  g.userData.chibi = { knot, body, legs, arms, head, eyes, tools, gear, face, smile, look: o, blink: 2 + Math.random() * 3, seed: Math.random() * 10 };
  return g;
}
// the village emblem, "The Oak and the River", and the cloth of the villager's cloak
// the village emblem, "The Oak and the River": a gold oak in a ring above two river waves
window.drawEmblem = (g, cx, cy, R, gold = '#e2b84c', dark = '#3a4a24') => {
  g.save(); g.translate(cx, cy);
  g.lineWidth = R * 0.09; g.strokeStyle = gold; g.beginPath(); g.arc(0, 0, R, 0, 7); g.stroke();      // the ring
  g.lineWidth = R * 0.03; g.beginPath(); g.arc(0, 0, R * 0.86, 0, 7); g.stroke();
  g.fillStyle = gold;
  // a broad oak: a wide, knobbly crown on a stout trunk that forks into branches, with roots spreading at the base
  for (const [x, y, r] of [[0, -0.36, 0.2], [-0.24, -0.3, 0.18], [0.24, -0.3, 0.18], [-0.42, -0.14, 0.16], [0.42, -0.14, 0.16], [-0.26, -0.08, 0.19], [0.26, -0.08, 0.19], [0, -0.14, 0.22], [-0.12, -0.46, 0.13], [0.12, -0.46, 0.13]]) { g.beginPath(); g.arc(x * R, y * R, r * R, 0, 7); g.fill(); }
  g.strokeStyle = gold; g.lineCap = 'round';
  g.lineWidth = R * 0.15; g.beginPath(); g.moveTo(0, R * 0.36); g.lineTo(0, R * 0.0); g.stroke();                 // trunk
  g.lineWidth = R * 0.07; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(0, R * 0.1); g.quadraticCurveTo(s2 * R * 0.1, R * 0.02, s2 * R * 0.2, R * 0.04); g.stroke(); }   // branches under the crown
  g.lineWidth = R * 0.05; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(0, R * 0.3); g.quadraticCurveTo(s2 * R * 0.1, R * 0.36, s2 * R * 0.22, R * 0.38); g.stroke(); }   // roots
  // gaps between the crown and the branches, so the tree reads as a tree and not a cloud
  g.fillStyle = dark; for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(s2 * R * 0.13, R * 0.13, R * 0.07, R * 0.05, 0, 0, 7); g.fill(); }
  g.fillStyle = gold;
  // two river waves beneath
  g.strokeStyle = gold; g.lineWidth = R * 0.07; g.lineCap = 'round';
  for (const y of [0.52, 0.67]) { g.beginPath(); for (let i = 0; i <= 24; i++) { const x = -0.55 + i * 1.1 / 24; const yy = y + Math.sin(i / 24 * Math.PI * 3) * 0.04; i ? g.lineTo(x * R, yy * R) : g.moveTo(x * R, yy * R); } g.stroke(); }
  g.restore();
};
// the cape's cloth: moss green with a fine weave, a gold border on all four edges, and the emblem in the middle
window.capeTexture = () => {
  const W = 512, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#5c7e44'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 4000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(30,50,20,.12)' : 'rgba(200,230,160,.08)'; g.fillRect(Math.random() * W, Math.random() * H, 2, 1); }
  const b = 26; g.fillStyle = '#d8b048'; g.fillRect(0, 0, W, b); g.fillRect(0, H - b, W, b); g.fillRect(0, 0, b, H); g.fillRect(W - b, 0, b, H);
  g.fillStyle = '#a07a2c'; for (const [x, y, w, h] of [[0, b - 4, W, 4], [0, H - b, W, 4], [b - 4, 0, 4, H], [W - b, 0, 4, H]]) g.fillRect(x, y, w, h);
  drawEmblem(g, W / 2, H * 0.47, 120, '#e2b84c', '#5c7e44');
  return cv;
};

let capeTex = null;
function addCape(fig){
  const c = fig.userData.chibi, b = c.cloak;
  if (!capeTex) { capeTex = new THREE.CanvasTexture(capeTexture()); capeTex.colorSpace = THREE.SRGBColorSpace; capeTex.anisotropy = 8; }
  const cape = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.62, 1.15, 20, 1, true, Math.PI - 1.25, 2.5), new THREE.MeshToonMaterial({ map: capeTex, gradientMap: toonRamp, side: THREE.DoubleSide }));
  cape.position.set(0, 0.92, -0.04); cape.castShadow = true; cape.userData.shadowSet = true; b.add(cape);
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.625, 1.16, 20, 1, true, Math.PI - 1.25, 2.5), outlineMat); edge.scale.set(1.04, 1.01, 1.04); edge.userData.shadowSet = true; cape.add(edge);
  const collar = chibiPart(b, new THREE.TorusGeometry(0.33, 0.08, 8, 20), 0x5c7e44, 0, 1.45, -0.02); collar.rotation.x = Math.PI / 2; collar.scale.set(1.1, 0.95, 1);
  const clasp = chibiPart(b, new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10), 0xd8b048, 0, 1.4, 0.33, false); clasp.rotation.x = Math.PI / 2;
}
