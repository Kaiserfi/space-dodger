// the sword, dagger and shield the hero wears, from the Gear tab
let guardTex = null;
function dressChibi(g, eq){
  const c = g.userData.chibi; c.gear.clear(); c.weapon = null;
  if (!c.cloak) { c.cloak = new THREE.Group(); c.body.add(c.cloak); }
  c.cloak.clear(); if (eq.back === "Villager's cloak") addCape(g);
  for (const a of [...c.arms, ...(c.elbows || [])]) a.children.filter(k => k.userData.isGear).forEach(k => a.remove(k));
  const dual = !!(eq.weapon && ITEMS[eq.weapon] && ITEMS[eq.weapon].twoHand); c.weaponL = null;
  chibiElbows(c, dual);   /* the pair of daggers needs elbows for its stab; everything else keeps the straight arm */
  // armour: every piece is listed so it can be taken off again
  (c.armour || []).forEach(m => m.parent && m.parent.remove(m)); c.armour = [];
  if (c.knot) c.knot.visible = !eq.head;   // a helmet covers the top knot
  // each piece is coloured by its metal: bronze, or iron (the same shapes in cool grey steel tones)
  const METAL = { Bronze: [0xa8682a, 0x5e3416, 0xe0a458, 0xd8904a], Iron: [0x8a9098, 0x3e444c, 0xc4cad2, 0xa8b0b8],
    Steel: [0xb4c0cc, 0x4e5a68, 0xeef4fa, 0xd4dee8],   // brighter than iron, with a cool blue sheen
    // the higher tiers from Idle Tap Adventure: dark stone plates, near-black edges, and trim in the colour of their glowing veins
    Obsidian: [0x3a3440, 0x16131a, 0xa65ae0, 0x5a4a6a], Verdium: [0x46504a, 0x1a201c, 0x4ae06a, 0x5a6a5e], Azurium: [0x3a4450, 0x141a22, 0x4ab0f0, 0x56687a] };
  const pal = n => METAL[(n || '').split(' ')[0]] || METAL.Bronze;
  let [BR, BD, BL] = METAL.Bronze;
  const use = n => { [BR, BD, BL] = pal(n); return true; };
  const is = (n, kind) => n && n.endsWith(kind) && use(n);
  const A = (parent, g2, col, x, y, z, ol = true) => { const m = chibiPart(parent, g2, col, x, y, z, ol); c.armour.push(m); return m; };
  if (is(eq.head, 'helmet')) {
    const h = c.head;
    A(h, geo('helmDome', () => new THREE.SphereGeometry(0.7, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55)), BR, 0, 0.05, -0.02).rotation.x = -0.25;
    A(h, geo('helmBand', () => new THREE.CylinderGeometry(0.71, 0.71, 0.14, 24)), BD, 0, 0.2, 0, false);
    A(h, geo('helmCrest', () => new THREE.ConeGeometry(0.1, 0.32, 6)), BL, 0, 0.82, -0.05);
    for (const sx of [-1, 1]) A(h, geo('helmCheek', () => new THREE.BoxGeometry(0.12, 0.34, 0.3)), BR, sx * 0.64, -0.02, -0.02).rotation.z = sx * 0.1;
    const nk = A(h, geo('helmNeck', () => new THREE.SphereGeometry(0.66, 20, 10, Math.PI * 1.15, Math.PI * 0.7, Math.PI * 0.35, Math.PI * 0.45)), BR, 0, 0, -0.02, false);
    nk.material = nk.material.clone(); nk.material.side = THREE.DoubleSide;
  }
  if (is(eq.body, 'chestplate')) {
    const b = c.body;
    A(b, geo('chest', () => new THREE.CapsuleGeometry(0.41, 0.3, 6, 16)), BR, 0, 1.04, 0).scale.set(1, 1, 0.9);
    A(b, geo('chestRidge', () => new THREE.BoxGeometry(0.06, 0.55, 0.06)), BL, 0, 1.08, 0.37, false);
    A(b, geo('chestBelt', () => new THREE.CylinderGeometry(0.43, 0.43, 0.1, 20)), BD, 0, 0.8, 0, false);
    for (const sx of [-1, 1]) for (const y of [1.25, 0.95]) A(b, geo('rivet', () => new THREE.SphereGeometry(0.035, 6, 5)), BL, sx * 0.22, y, 0.36, false);
    for (const arm of c.arms) { A(arm, geo('pauldron', () => new THREE.SphereGeometry(0.22, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)), BR, 0, 0.02, 0).scale.set(1.1, 0.8, 1.1);
      A(arm, geo('vambrace', () => new THREE.CylinderGeometry(0.13, 0.12, 0.18, 12)), BD, 0, -0.3, 0, false); }
  }
  if (is(eq.legs, 'leg armour')) for (const l of c.legs) {   // plated thighs and shins with a knee guard, nothing hanging at the hips
    A(l, geo('thigh', () => new THREE.CapsuleGeometry(0.165, 0.18, 6, 12)), BR, 0, -0.18, 0);
    A(l, geo('knee', () => new THREE.SphereGeometry(0.11, 10, 8)), BL, 0, -0.33, 0.12);
    A(l, geo('shin', () => new THREE.CylinderGeometry(0.17, 0.15, 0.2, 12)), BR, 0, -0.42, 0);
  }
  if (is(eq.feet, 'boots')) for (const l of c.legs) {   // a bronze shell over each boot, with a darker cuff and a light toe cap
    A(l, geo('bootShell', () => new THREE.SphereGeometry(0.21, 16, 10)), BR, 0, -0.5, 0.07).scale.set(1, 0.62, 1.32);
    A(l, geo('bootCuff', () => new THREE.CylinderGeometry(0.17, 0.18, 0.1, 14)), BD, 0, -0.4, 0, false);
    A(l, geo('bootToe', () => new THREE.SphereGeometry(0.09, 10, 8)), BL, 0, -0.52, 0.3, false).scale.set(1.2, 0.7, 0.8);
  }
  if (eq.weapon) {   // a full-size blade held angled down and forward; the daggers are the same, shorter, one in each hand
    const w = new THREE.Group(); w.userData.isGear = true; w.position.set(0, dual ? -0.23 : -0.45, 0); w.rotation.x = -1.15; (dual ? c.elbows[1] : c.arms[1]).add(w); c.weapon = w;   /* angled forward enough that the point clears the ground when you stand */
    use(eq.weapon); const blade = pal(eq.weapon)[3];
    const len = eq.weapon.endsWith('sword') ? 1.15 : 0.6;
    chibiPart(w, geo('swGrip', () => new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8)), 0x4a2e16, 0, 0.05, 0);
    chibiPart(w, geo('swPommel', () => new THREE.SphereGeometry(0.07, 8, 6)), BL, 0, 0.22, 0, false);
    chibiPart(w, geo('swGuard' + len, () => new THREE.BoxGeometry(len > 1 ? 0.5 : 0.34, 0.08, 0.12)), BD, 0, -0.13, 0);
    chibiPart(w, geo('swBlade' + len, () => new THREE.BoxGeometry(len > 1 ? 0.16 : 0.13, len, 0.04)), blade, 0, -0.17 - len / 2, 0);
    chibiPart(w, geo('swTip2' + len, () => {   /* a flat, sharp point: exactly the blade's width and thickness, tapering to an edge */
      const hw = (len > 1 ? 0.16 : 0.13) / 2, sh = new THREE.Shape(); sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(0, -0.26); sh.closePath();
      return new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }).translate(0, 0, -0.02); }), blade, 0, -0.17 - len, 0);
    chibiPart(w, geo('swFuller' + len, () => new THREE.BoxGeometry(0.03, len * 0.85, 0.05)), BL, 0, -0.17 - len / 2, 0, false);
      if (dual) { const wl = w.clone(true); wl.scale.x = -1; c.elbows[0].add(wl); c.weaponL = wl; }   /* the second dagger, mirrored into the left hand */
  }
  c.torch = null;
  if (eq.shield === 'Torch' && !dual) {   // a torch in the left hand, held forward and up: a wooden stick, a wrapped head, and a flame
    const tg = new THREE.Group(); tg.userData.isGear = true; tg.position.set(-0.04, -0.45, 0.06); tg.rotation.set(0.6, 0, 0.45); c.arms[0].add(tg);   // forward, up, and leaning out away from the head
    chibiPart(tg, geo('torchStick', () => new THREE.CylinderGeometry(0.045, 0.06, 0.95, 7)), 0x7a4d22, 0, 0.3, 0);
    chibiPart(tg, geo('torchWrap', () => new THREE.CylinderGeometry(0.1, 0.08, 0.2, 8)), 0x4a3220, 0, 0.78, 0);
    const flame = new THREE.Group(); flame.position.y = 0.9; tg.add(flame);
    const fo = new THREE.Mesh(geo('torchFlameO', () => new THREE.ConeGeometry(0.13, 0.42, 7).translate(0, 0.21, 0)), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9, depthWrite: false })); flame.add(fo);
    const fi = new THREE.Mesh(geo('torchFlameI', () => new THREE.ConeGeometry(0.07, 0.28, 6).translate(0, 0.14, 0)), new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, depthWrite: false })); flame.add(fi);
    let light = null;
    if (g === hero) light = true;   /* only your own torch lights the ground; the light itself lives in the scene all the time (heroTorchLight), because adding or removing a light makes three.js rebuild every shader */
    c.torch = { flame, light };
  } else if (eq.shield && !dual) {   // a big round shield on the left arm, with a rim, a boss and rivets
    use(eq.shield);
    const sh = new THREE.Group(); sh.userData.isGear = true; sh.position.set(-0.27, -0.42, 0.04); sh.rotation.set(0, 0, 1.62); c.arms[0].add(sh);   /* centred on the hand, as if gripped, and upright, clear of the shoulder (measured idle and mid-stride) */
    chibiPart(sh, geo('shDisc', () => new THREE.CylinderGeometry(0.5, 0.5, 0.08, 24)), BR, 0, 0, 0);
    chibiPart(sh, geo('shRim', () => new THREE.TorusGeometry(0.48, 0.04, 6, 24).rotateX(Math.PI / 2)), BD, 0, -0.05, 0, false);
    if (eq.shield.includes('Guard')) {   // the village guard's shield: painted green with the Oak and the River in gold
      if (!guardTex) { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g2 = cv.getContext('2d'); g2.fillStyle = '#4e7038'; g2.fillRect(0, 0, 256, 256); drawEmblem(g2, 128, 128, 104, '#e2b84c', '#4e7038'); guardTex = new THREE.CanvasTexture(cv); guardTex.colorSpace = THREE.SRGBColorSpace; }
      const face = new THREE.Mesh(geo('shFace', () => new THREE.CircleGeometry(0.43, 32).rotateX(Math.PI / 2)), new THREE.MeshToonMaterial({ map: guardTex, gradientMap: toonRamp }));
      face.position.y = -0.042; face.rotation.y = Math.PI / 2; face.userData.shadowSet = true; sh.add(face);
      const face2 = new THREE.Mesh(geo('shFace2', () => new THREE.CircleGeometry(0.43, 32).rotateX(-Math.PI / 2)), face.material); face2.position.y = 0.042; face2.rotation.y = -Math.PI / 2; face2.userData.shadowSet = true; sh.add(face2);   // the outer face too
    } else chibiPart(sh, geo('shBoss', () => new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)), BL, 0, -0.04, 0, false).rotation.x = Math.PI;
    for (let i = 0; i < 6; i++) chibiPart(sh, geo('rivet', () => new THREE.SphereGeometry(0.035, 6, 5)), BL, Math.cos(i * 1.05) * 0.36, -0.05, Math.sin(i * 1.05) * 0.36, false);
  }
  /* with the pair, anything worn low on the arm (bracers, cuffs) rides on the forearm so it bends with the elbow */
  if (dual) c.arms.forEach((a, i) => { for (const k of a.children.slice()) if (k !== c.elbows[i] && !k.userData.elbowPart && k.position.y <= -0.3) { k.position.y += 0.22; c.elbows[i].add(k); } });
}
/* elbows, for the pair of daggers: each arm splits 0.22 below the shoulder, the forearm and hand moving into the elbow.
   Only figures holding the pair get them (a few more meshes); everyone else keeps the one-piece arm. */
function chibiElbows(c, on){
  if (on && !c.elbows) {
    c.elbows = c.arms.map(arm => {
      const sleeve = arm.children[0], hand = arm.children[1], mat = sleeve.material;
      sleeve.visible = false;
      const part = (par, g, y) => { const m = chibiPart(par, g, mat.color.getHex(), 0, y, 0); m.material = mat; m.userData.elbowPart = true; return m; };
      part(arm, gCapsule(0.11, 0.1), -0.11);
      const el = new THREE.Group(); el.position.set(0, -0.22, 0); el.userData.elbowPart = true; arm.add(el);
      part(el, gRound(0.115, 12), 0); part(el, gCapsule(0.105, 0.1), -0.11);
      hand.position.y += 0.22; el.add(hand); el.userData.hand = hand; arm.userData.sleeve = sleeve;
      return el;
    });
  } else if (!on && c.elbows) {
    c.arms.forEach((arm, i) => { const el = c.elbows[i], hand = el.userData.hand;
      for (const k of el.children.slice()) if (k !== hand && !k.userData.elbowPart && k.position.y <= -0.08) { k.position.y -= 0.22; arm.add(k); }   /* anything that rode on the forearm goes back to the arm */
      hand.position.y -= 0.22; arm.add(hand); arm.remove(el);
      for (const k of arm.children.slice()) if (k.userData.elbowPart) arm.remove(k);
      arm.userData.sleeve.visible = true; });
    c.elbows = null;
  }
}
/* the pair of daggers in a fight: a ready guard with both blades out, and the lunge stab, right then left, over one attack (DUAL_MS) */
const DUAL_BLOCK = [-0.5, 0]; const DUAL_MS = 1500, DUAL_HITS = [0.27, 0.77], DUAL_MULT = 0.55;   /* when each stab lands, as a share of the attack; each stab's max hit against a sword's */
function dualReady(c){
  const [AL, AR] = c.arms, [EL, ER] = c.elbows;
  for (const [A, E, sd] of [[AL, EL, -1], [AR, ER, 1]]) { A.rotation.set(-0.35, 0, sd * 0.18); E.rotation.set(-1.0, 0, 0); }
  c.weapon.rotation.set(-0.55, 0, 0); c.weaponL.rotation.set(-0.55, 0, 0);
  c.body.rotation.set(0, 0, 0); c.body.position.set(0, 0, 0); c.legs[0].rotation.set(-0.15, 0, 0); c.legs[1].rotation.set(0.15, 0, 0); c.head.rotation.set(0, 0, 0);
}
function dualLunge(c, k){
  dualReady(c);
  const ease = x => x * x * (3 - 2 * x), S = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  const [AL, AR] = c.arms, [EL, ER] = c.elbows, [LL, LR] = c.legs;
  const stab = (A, E, W, front, back, t, sd) => {
    const ch = ease(S(t, 0, 0.38)), go = ease(S(t, 0.42, 0.58)), rec = ease(S(t, 0.68, 1));
    /* the arm: back and slightly out into an L, then driven straight forward, then home */
    let ux = lerp(-0.35, 0.85, ch), uz = lerp(sd * 0.18, sd * 0.38, ch), ex = lerp(-1.0, -2.05, ch);
    ux = lerp(lerp(ux, -1.5, go), -0.35, rec); uz = lerp(lerp(uz, sd * 0.02, go), sd * 0.18, rec); ex = lerp(lerp(ex, -0.08, go), -1.0, rec);
    A.rotation.set(ux, 0, uz); E.rotation.set(ex, 0, 0); W.rotation.set(lerp(lerp(-0.55, -0.1, ch), 0, go) * (1 - rec) - 0.55 * rec, 0, 0);
    /* the body: weight back and turned away while it chambers, then the step in and the twist into the blow */
    const twist = lerp(lerp(0, sd * 0.3, ch), sd * -0.35, go) * (1 - rec), lean = lerp(lerp(0, -0.08, ch), 0.18, go) * (1 - rec), step = lerp(lerp(0, -0.08, ch), 0.42, go) * (1 - rec);
    front.rotation.x = lerp(lerp(-0.15 * sd, 0.1, ch), -0.62, go) * (1 - rec) + -0.15 * sd * rec;   /* the same-side foot steps out front, the back leg stretches behind */
    back.rotation.x = lerp(lerp(0.15 * sd, -0.05, ch), 0.5, go) * (1 - rec) + 0.15 * sd * rec;
    c.body.rotation.set(lean, twist, 0); c.head.rotation.y = -twist * 0.6;   /* the eyes stay on the target */
    c.body.position.set(0, 0, step);
  };
  if (k < 0.5) stab(AR, ER, c.weapon, LR, LL, k / 0.5, 1); else stab(AL, EL, c.weaponL, LL, LR, (k - 0.5) / 0.5, -1);
  dualSettle(c);
}
/* keep the boots on the ground: measure the lowest boot point and lift or drop the body to where it rests standing */
function dualSettle(c){
  const lowest = () => { c.body.parent.updateMatrixWorld(true); let lo = 9; for (const l of c.legs) l.traverse(m => { if (m.isMesh && m.material !== outlineMat) lo = Math.min(lo, dualBox.setFromObject(m).min.y); }); return lo - c.body.parent.position.y; };
  if (c.footRest === undefined) { const keep = [c.body.position.z, c.body.rotation.x, c.legs[0].rotation.x, c.legs[1].rotation.x]; c.body.position.z = 0; c.body.rotation.x = 0; c.legs[0].rotation.x = 0; c.legs[1].rotation.x = 0; c.footRest = lowest();   /* where the boots rest standing */ [c.body.position.z, c.body.rotation.x, c.legs[0].rotation.x, c.legs[1].rotation.x] = keep; }
  c.body.position.y += (c.footRest - lowest()) / (c.body.parent.scale.y || 1);
}
const dualBox = new THREE.Box3();
/* fighting faces: a hard stare between blows, a shout on each blow, and a wince when hit. Built once per figure, then only shown or hidden.
   They replace the creator's brows, eye shapes and mouth while fighting; nose, freckles and cheeks stay. */
function buildFightFaces(c){
  const h = c.head, look = c.look || {}, INK = 0x1a1410, LIP = 0x5a2a2a;
  const bc = new THREE.Color(look.hairCol === 0x10fe01 || look.hair === 'bald' || look.hairCol === undefined ? 0x3a2a1a : look.hairCol).multiplyScalar(0.6);
  const hsl = {}; bc.getHSL(hsl); if (hsl.l > 0.3) bc.setHSL(hsl.h, hsl.s, 0.3);   /* light hair still gives brows that read */
  const browC = bc.getHex(), mk = () => { const g = new THREE.Group(); g.visible = false; h.add(g); return g; };
  const P = (g, geo, col, x, y, lift, rz = 0) => { const m = new THREE.Mesh(geo, basic(col)); m.position.copy(faceOn(x, y, lift)); m.lookAt(m.position.clone().multiplyScalar(2)); m.rotateZ(rz); g.add(m); return m; };
  const brow = (g, tilt, y) => { for (const s of [-1, 1]) P(g, faceGeo.cap(0.028, 0.15), browC, s * 0.22, y, 0.014, Math.PI / 2 + s * tilt); };
  const F = { focus: mk(), shout: mk(), wince: mk() };
  brow(F.focus, 0.42, 0.125); P(F.focus, faceGeo.cap(0.014, 0.1), LIP, 0, -0.15, 0.006, Math.PI / 2 + 0.05);   /* a hard stare, the jaw set */
  brow(F.shout, 0.55, 0.11);   /* teeth bared in a shout */
  P(F.shout, faceGeo.disc(0.085, Math.PI, Math.PI), LIP, 0, -0.12, 0.006).scale.set(1.1, 1.25, 1);
  P(F.shout, faceGeo.disc(0.07, Math.PI + 0.2, Math.PI - 0.4), 0xffffff, 0, -0.125, 0.009).scale.set(1.05, 0.38, 1);
  P(F.shout, faceGeo.disc(0.032, 0, Math.PI), 0xd86a6a, 0, -0.205, 0.009).scale.y = 0.6;
  for (const s of [-1, 1]) { P(F.wince, faceGeo.cap(0.03, 0.14), browC, s * 0.22, 0.065, 0.014, Math.PI / 2 + s * 0.38); P(F.wince, faceGeo.arc(0.05, 0.012, Math.PI * 0.7), INK, s * 0.22, -0.055, 0.012, Math.PI * 0.15); }   /* eyes screwed shut, the brows doing the squeeze */
  P(F.wince, faceGeo.arc(0.05, 0.017, Math.PI * 0.8), LIP, 0, -0.18, 0.006, Math.PI * 0.1);
  c.ff = F;
}
function setFightFace(c, kind){
  if (!c || !c.face || (c.ffKind || null) === (kind || null)) return;
  if (kind && !c.ff) buildFightFaces(c);
  c.ffKind = kind || null;
  const fc = c.face, all = fc.allEyes;
  if (c.ff) for (const k in c.ff) c.ff[k].visible = k === kind;
  fc.parts.visible = !kind; c.smile.visible = kind ? false : fc.smileOn;
  /* the eyes: narrowed for focus and the shout, shut for the wince, and back to the creator's for none */
  const squash = kind === 'focus' ? 0.3 : kind === 'shout' ? 0.4 : 0;
  c.eyes = kind ? all : fc.eyes; c.squash = squash; c.shut = kind === 'wince';
  for (let i = 0; i < all.length; i += 2) {
    const e = all[i], sh = all[i + 1], mine = fc.eyes.includes(e), show = kind ? kind !== 'wince' : mine;
    e.visible = sh.visible = show; e.position.y = 0.02 - 0.03 * squash; e.scale.y = 1.15 * (1 - squash);
    sh.position.y = squash ? e.position.y + 0.015 : 0.08; sh.scale.setScalar(squash ? 0.6 : 1);
  }
}
const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const lerp = (a, b, k) => a + (b - a) * k;
// one swing of an axe or pickaxe, p from 0 to 1: wind up over the shoulder (to 0.4), strike (by 0.55, when the blow sounds), recover
// the axe chop, 0-1: wound back round to the right, a fast level swing that bites at AXE_HIT (the chop sound), a short jolt, then pulled free
const AXE_HIT = 25 / 45;
function axeChop(p){
  const back = 1.6, bite = 0.2, ready = 0.45;
  if (p < 0.4) return { twist: lerp(ready, back, ease(p / 0.4)), lunge: 0, step: 0 };
  if (p < AXE_HIT) { const k = (p - 0.4) / (AXE_HIT - 0.4); return { twist: lerp(back, bite, k * k), lunge: 0.35 * k * k, step: Math.sin(k * Math.PI) }; }
  if (p < 0.72) { const k = (p - AXE_HIT) / (0.72 - AXE_HIT); return { twist: bite + 0.04 * Math.sin(k * Math.PI * 3) * (1 - k), lunge: 0.35, step: 0 }; }   // stuck in the wood a moment
  const k = ease((p - 0.72) / 0.28); return { twist: lerp(bite, ready, k), lunge: 0.35 * (1 - k), step: Math.sin(k * Math.PI) };
}
function swingArm(p, tool){
  const rest = -0.55, up = tool === 'hoe' ? -2.7 : -3.25, hit = tool === 'pick' ? -0.75 : tool === 'hoe' ? -0.55 : -1.35;   // the hoe chops low into the soil in front of the feet
  if (p < 0.4) return lerp(rest, up, ease(p / 0.4));
  if (p < 0.55) { const k = (p - 0.4) / 0.15; return lerp(up, hit, k * k); }
  return lerp(hit, rest, ease((p - 0.55) / 0.45));
}
// pose a character: mode is 'idle', 'walk' or 'swing'; t is the time in seconds (or the swing's 0-1 phase); tool is 'axe' or 'pick'
// eating: the right hand brings a bite up to the mouth twice, with a little nod as you chew
const EAT_MS = 1100;
function eatPose(c, k){
  const lift = Math.sin(Math.min(1, k) * Math.PI * 2) > 0 ? Math.sin(Math.min(1, k) * Math.PI * 2) : 0.4 * Math.sin(Math.min(1, k) * Math.PI);
  const [AL, AR] = c.arms;
  AR.rotation.set(-0.6 - 1.7 * lift, 0, 0.75 * lift); AL.rotation.set(-0.25, 0, -0.2);
  c.head.rotation.x = 0.12 * Math.abs(Math.sin(k * Math.PI * 6));
  if (!c.bite) { c.bite = chibiPart(c.arms[1], geo('bite', () => new THREE.SphereGeometry(0.11, 8, 6)), 0xc8843a, 0, -0.5, 0.12, false); }
  c.bite.visible = k < 0.85; c.bite.scale.setScalar(1 - 0.6 * k);   // it gets smaller as you eat it
}
let eatUntil = 0, eatReadyAt = 0;
const EAT_DELAY = 1800;   // the gap between bites, and how long eating holds back your next swing (three game ticks in RuneScape)
function startEatAnim(){
  eatUntil = performance.now() + EAT_MS;
  if (FIGHT) FIGHT.pAnim = { kind: 'eat', t0: performance.now(), dur: EAT_MS };
  setAct({ k: 'eat', t: Date.now() });
  setTimeout(() => { if (ONLINE.act && ONLINE.act.k === 'eat') setAct(FIGHT ? fightAct(FIGHT.m) : null); }, EAT_MS);
}
function poseChibi(g, mode, t, tool = 'axe'){
  const c = g.userData.chibi; if (!c) return;
  const now = performance.now() / 1000;
  c.tools.axe.visible = mode === 'swing' && tool === 'axe';
  c.tools.pick.visible = mode === 'swing' && tool === 'pick';
  c.tools.hoe.visible = mode === 'swing' && tool === 'hoe';
  c.tools.can.visible = mode === 'water' || mode === 'fill';
  c.gear.visible = mode !== 'swing';
  const handsBusy = !['idle', 'walk', 'fight', 'ready', 'block', 'hurt', 'dead'].includes(mode);   /* any skilling or everyday job: the sword, shield or torch is put away for the moment */
  for (const a of c.arms) a.traverse(k => { if (k.userData.isGear) k.visible = !handsBusy; });
  if (c.elbows) { for (const e of c.elbows) e.rotation.set(0, 0, 0); if (c.weaponL) c.weaponL.rotation.set(-1.15, 0, 0); }   /* out of a fight the arms hang straight */
  if (c.ffKind && performance.now() > (c.ffUntil || 0)) setFightFace(c, null);   /* a second after the fight, your own face comes back */
  const [L, R] = c.legs, [AL, AR] = c.arms;
  for (const leg of c.legs) { if (!leg.userData.hip) leg.userData.hip = leg.position.clone(); leg.position.copy(leg.userData.hip); leg.rotation.y = 0; leg.children[1].rotation.x = 0; }
  c.body.position.y = 0; c.body.position.z = 0; c.body.rotation.set(0, 0, 0); c.head.rotation.set(0, 0, 0);
  c.tools.axe.rotation.y = mode === 'swing' && tool === 'axe' ? Math.PI / 2 : 0;   /* the level chop turns the blade's edge to lead the swing */
  AL.rotation.set(0, 0, -0.2); AR.rotation.set(0, 0, 0.2);
  if (c.bite) c.bite.visible = false;
  if (mode === 'eat') { eatPose(c, t); return; }
  if (mode === 'water') {   // the can held out and tipped over the crops, swaying gently along the row
    const sw = Math.sin(now * 2.2) * 0.25;
    AR.rotation.set(-1.15, sw * 0.4, 0.25); AL.rotation.set(-0.5, 0, -0.3);
    c.tools.can.rotation.set(1.15 + 0.55, 0, 0);   // back to upright against the raised arm, then tipped forward to pour
    c.body.rotation.x = 0.12; c.head.rotation.x = 0.3; c.head.rotation.y = sw * 0.3;
    L.rotation.x = -0.15; R.rotation.x = 0.1;
    return;
  }
  if (mode === 'pour') {   // both hands lift a bundle of wheat up over the hopper's lip and tip it in, then back down for the next
    const ph = (now % 1.8) / 1.8, lift = ph < 0.45 ? ease(ph / 0.45) : ph < 0.7 ? 1 : 1 - ease((ph - 0.7) / 0.3);
    const tip = ph > 0.45 && ph < 0.7 ? Math.sin((ph - 0.45) / 0.25 * Math.PI) : 0;
    AR.rotation.set(-0.5 - 1.6 * lift - 0.3 * tip, 0, 0.2); AL.rotation.set(-0.5 - 1.6 * lift - 0.3 * tip, 0, -0.2);
    c.body.rotation.x = -0.08 * lift + 0.12 * tip; c.head.rotation.x = -0.15 * lift;
    L.rotation.x = -0.2 * lift; R.rotation.x = 0.15 * lift;
    if (!c.sheaf) { c.sheaf = new THREE.Group(); c.sheaf.position.set(-0.42, -0.5, 0.22); c.arms[1].add(c.sheaf);   // the wheat, held between both hands
      for (let i = 0; i < 7; i++) { const st = chibiPart(c.sheaf, geo('sheafStalk', () => new THREE.CylinderGeometry(0.02, 0.025, 0.7, 4)), 0xc8a850, (i - 3) * 0.05, 0, 0, false); st.rotation.z = (i - 3) * 0.06;
        chibiPart(c.sheaf, geo('sheafEar', () => new THREE.ConeGeometry(0.05, 0.18, 5)), 0xe0b850, (i - 3) * 0.07, 0.42, 0, false); } c.sheaf.rotation.x = Math.PI / 2; }
    c.sheaf.visible = true;
    return;
  }
  if (c.sheaf) c.sheaf.visible = false;
  if (mode === 'fill') {   // bent over the trough, the can held down in the water and tipped on its side to fill
    const bob = Math.sin(now * 3) * 0.08;
    c.body.position.y = -0.18; c.body.rotation.x = 0.45; c.head.rotation.x = 0.3;
    L.rotation.x = -0.5; R.rotation.x = 0.35;
    AR.rotation.set(-1.15 + bob, 0, 0.2); AL.rotation.set(-1.05 - bob, 0, -0.2);
    c.tools.can.rotation.set(1.0, 0, 1.1);   // held out over the water, on its side, its mouth dipped under the surface
    return;
  }
  if (mode === 'plant') {   // crouched low, one hand pressing seeds into the soil, a little dip each time
    const dip = Math.abs(Math.sin(now * 4)) * 0.25;
    c.body.position.y = -0.32; c.body.rotation.x = 0.35 + dip * 0.4;
    L.rotation.x = -1.2; R.rotation.x = 0.5;
    AR.rotation.set(-0.9 - dip, 0, 0.15); AL.rotation.set(-0.6, 0, -0.35);
    c.head.rotation.x = 0.25;
    return;
  }
  if (mode === 'walk') {
    const s = Math.sin(t * 9);
    L.rotation.x = s * 0.6; R.rotation.x = -s * 0.6;
    AL.rotation.x = -s * 0.55; AR.rotation.x = s * 0.55;
    c.body.position.y = Math.abs(Math.cos(t * 9)) * 0.07;   // a little hop in each step
    c.head.rotation.z = s * 0.05;
  } else if (mode === 'work') {
    // tending the furnace: both hands forward, working the bellows
    const w = Math.sin(now * 5);
    AL.rotation.set(-1.1 + w * 0.15, 0, -0.15); AR.rotation.set(-1.1 - w * 0.15, 0, 0.15);
    c.body.rotation.x = 0.08; c.body.position.y = Math.abs(w) * 0.02;
    L.rotation.x = R.rotation.x = 0;
  } else if (mode === 'swing' && tool === 'axe') {   // a lumberjack's chop: twist back, swing level into the trunk, a jolt as it bites, pull free
    const k = axeChop(t), lift = 0.12 * Math.sin(Math.max(0, Math.min(1, t / AXE_HIT)) * Math.PI);
    c.body.rotation.y = k.twist; c.body.position.z = k.lunge; c.head.rotation.y = -k.twist * 0.75;   // the head keeps its eyes on the cut
    AR.rotation.set(-1.5 - lift, 0, -0.1); AL.rotation.set(-1.55 - lift, 0, 0.55);   // both hands on the handle, held out level
    c.body.rotation.x = 0.06 + k.lunge * 0.4;
    // a real step: the back foot stays put while the hips go forward, the front foot lifts and lands further ahead (legs hang 0.55 from the hip)
    const LEG = 0.55, f0 = 0.136, b0 = -0.11, front = f0 + 1.6 * k.lunge;
    const aF = -Math.asin(Math.min(0.95, (front - k.lunge) / LEG)) - 0.3 * k.step, aB = Math.asin(Math.min(0.95, (k.lunge - b0) / LEG));
    L.rotation.x = aF; R.rotation.x = aB;
    c.body.position.y = -LEG * (1 - Math.cos(Math.min(Math.abs(aF), aB)));   // the hips drop as the stride opens, just enough that neither foot sinks
    for (const leg of c.legs) {   // the twist is the upper body's: the hips and legs stay square to the ground, so the planted foot doesn't slide
      const h = leg.userData.hip; leg.rotation.order = 'YXZ'; leg.rotation.y = -k.twist;
      leg.position.set(h.x * Math.cos(k.twist), h.y, h.x * Math.sin(k.twist)); leg.children[1].rotation.x = -leg.rotation.x * 0.8; }   /* boots stay flat on the ground */
  } else if (mode === 'swing') {
    const arm = swingArm(t, tool);
    AR.rotation.set(arm, 0, -0.08); AL.rotation.set(arm + 0.12, 0, 0.32);   // both hands on the handle
    const lean = t > 0.4 && t < 0.75 ? Math.sin((t - 0.4) / 0.35 * Math.PI) * 0.22 : (t < 0.4 ? -ease(t / 0.4) * 0.1 : 0);
    c.body.rotation.x = lean;   // rock back on the wind-up, lean into the blow
    L.rotation.x = -lean * 0.8; R.rotation.x = lean * 0.4;
  } else {
    const b = Math.sin(now * 2 + c.seed);   // breathing and a gentle sway
    c.body.position.y = b * 0.012; c.head.rotation.z = Math.sin(now * 0.7 + c.seed) * 0.04;
    AL.rotation.z = -0.2 - b * 0.03; AR.rotation.z = 0.2 + b * 0.03;
    L.rotation.x = R.rotation.x = 0;
  }
  // blink every few seconds
  c.blink -= 1 / 60;
  const closed = c.blink < 0.12;
  if (c.blink < 0) c.blink = 2 + Math.random() * 4;
  if (!c.shut) c.eyes.forEach((e, i) => { if (i % 2 === 0) e.scale.y = closed ? 0.15 : 1.15 * (1 - (c.squash || 0)); else e.visible = !closed; });
}
// turn a character smoothly to face a heading (radians, 0 = +z)
function turnChibi(g, yaw){
  let d = yaw - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
  g.rotation.y += d * 0.25;
}
const yawTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);

let hero = null, heroShadow = null, heroFrame = -1, heroFacing = 1;
// the hero's animation: walking, idle or swinging a tool, and which way they face
const heroAnim = { mode: 'idle', phase: 0, tool: 'axe', yaw: 0 };
// kept for the old callers: a pose means the swing, anything else is walking or standing
function setHeroFrame(frame, facing, pose = null, tool = 'axe'){
  if (!hero) return;
  heroFacing = facing;
  if (!pose) heroAnim.mode = walkTarget ? 'walk' : 'idle';
  if (heroFrame === '') { heroFrame = 0; dressChibi(hero, equipped); }   // the gear changed
}
function setHeroSwing(phase, tool, yaw){ heroAnim.mode = 'swing'; heroAnim.phase = phase; heroAnim.tool = tool; heroAnim.yaw = yaw; }
function updateHeroAnim(){
  if (!hero) return;
  if (!FIGHT && performance.now() < eatUntil) { turnChibi(hero, heroAnim.yaw); poseChibi(hero, 'eat', 1 - (eatUntil - performance.now()) / EAT_MS); return; }
  if (heroSeatFrame()) return;   // sat at the bonfire
  { const c = hero.userData.chibi; if (c && c.rod) c.rod.g.visible = false; if (c && c.net) c.net.g.visible = false; }
  if (heroAnim.mode === 'net') { if (!fishing) heroAnim.mode = 'idle'; else { turnChibi(hero, heroAnim.yaw); netPose(hero, Math.min(1, (performance.now() - fishing.t0) / FISH_MS), fishing.will); return; } }
  if (heroAnim.mode === 'fish') {   // fishing with a rod: the cast at the start of each try, then the line waits in the water
    if (!fishing) heroAnim.mode = 'idle';
    else { const k = (performance.now() - fishing.cast0) / FISH_MS; turnChibi(hero, heroAnim.yaw); fishPose(hero, performance.now() / 1000, k < 0.22 ? k / 0.22 : 0, true); return; }   /* one cast when you start, then the line stays in */
  }
  if (FIGHT && heroAnim.mode === 'fight') { turnChibi(hero, heroAnim.yaw); return; }
  if (heroFrame === '') { heroFrame = 0; dressChibi(hero, equipped); }
  turnChibi(hero, heroAnim.yaw);
  poseChibi(hero, heroAnim.mode, heroAnim.mode === 'swing' ? heroAnim.phase : (heroAnim.mode === 'walk' ? walkTick / 60 : 0), heroAnim.tool);
}
function rebuildHero(){
  if (hero) scene.remove(hero);
  hero = makeChibi(look); hero.userData.chibi.fightFaces = true;
  dressChibi(hero, equipped);
  hero.position.copy(START);
  hero.rotation.y = heroAnim.yaw = 0;   // facing the camera's side of the hall
  scene.add(hero);
  if (!heroShadow) {                          // a soft contact shadow under the feet, on top of the sun's shadow
    heroShadow = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }));
    heroShadow.userData.shadowSet = true;
    scene.add(heroShadow);
  }
  heroShadow.position.set(START.x, 0.06, START.z);
}

