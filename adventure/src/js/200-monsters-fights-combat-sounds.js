// ----- the farm biome's creatures, from Idle Tap Adventure: chickens, cows, giant rats and angry farmers -----
// The animals are their own toon-shaded models with a pose function; the farmer is one of our chibi people with a pitchfork.
function makeFarmMonster(kind){
  const g = new THREE.Group(), P = (parent, geo, col, x, y, z, ol = true) => chibiPart(parent, geo, col, x, y, z, ol);
  const parts = {}; let pose;
  if (kind === 'chicken') {   // a plump white hen: red comb and wattle, yellow beak and legs, a fan of tail feathers
    const body = new THREE.Group(); g.add(body); parts.body = body;
    P(body, gRound(0.45, 16), 0xf3ead6, 0, 0.72, 0).scale.set(1, 0.88, 1.25);
    for (let i = 0; i < 3; i++) { const f = P(body, geo('henTail', () => new THREE.ConeGeometry(0.16, 0.6, 6)), 0xe6dac0, (i - 1) * 0.14, 1.0, -0.55); f.rotation.x = -0.9; f.rotation.z = (i - 1) * 0.25; }
    parts.wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.4, 0.82, 0.02); body.add(w); P(w, gRound(0.24, 10), 0xe9dcc2, 0, -0.08, -0.06).scale.set(0.35, 0.8, 1.2); return w; });
    const head = new THREE.Group(); head.position.set(0, 1.12, 0.42); body.add(head); parts.head = head;
    P(head, gRound(0.24, 14), 0xf6efe0, 0, 0, 0);
    for (let i = 0; i < 3; i++) P(head, gRound(0.07, 8), 0xd8282a, 0, 0.24 + (i === 1 ? 0.04 : 0), -0.08 + i * 0.09, false);
    P(head, geo('henBeak', () => new THREE.ConeGeometry(0.07, 0.2, 6)), 0xf0b030, 0, -0.02, 0.27).rotation.x = Math.PI / 2;
    P(head, gRound(0.06, 8), 0xc81e22, 0, -0.14, 0.18, false).scale.set(0.8, 1.4, 0.8);
    for (const s of [-1, 1]) P(head, gRound(0.035, 6), 0x15110d, s * 0.17, 0.05, 0.13, false);
    parts.legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * 0.16, 0.42, 0); body.add(l); P(l, geo('henLeg', () => new THREE.CylinderGeometry(0.035, 0.035, 0.38, 5)), 0xe8b030, 0, -0.2, 0);
      for (const a of [-0.5, 0, 0.5]) { const t = P(l, geo('henToe', () => new THREE.BoxGeometry(0.04, 0.03, 0.16)), 0xe8b030, Math.sin(a) * 0.06, -0.4, 0.06, false); t.rotation.y = a; } return l; });
    pose = (mode, k, now) => { const H = parts.head, [WL, WR] = parts.wings, [LL, LR] = parts.legs;
      body.rotation.set(0, 0, 0); body.position.y = 0; H.rotation.set(0, 0, 0); H.position.set(0, 1.12, 0.42); WL.rotation.z = WR.rotation.z = 0; LL.rotation.x = LR.rotation.x = 0;
      if (mode === 'walk') { const s = Math.sin(now * 14); LL.rotation.x = s * 0.6; LR.rotation.x = -s * 0.6; H.position.z = 0.42 + Math.max(0, s) * 0.08; body.position.y = Math.abs(s) * 0.04; }
      else if (mode === 'swing') { const p = k < 0.45 ? k / 0.45 : 1 - (k - 0.45) / 0.55; H.position.set(0, 1.12 - 0.35 * p, 0.42 + 0.35 * p); H.rotation.x = 0.9 * p; body.rotation.x = 0.25 * p; WL.rotation.z = -1.1 * Math.sin(k * Math.PI * 3); WR.rotation.z = 1.1 * Math.sin(k * Math.PI * 3); }   // a sharp peck, wings beating
      else if (mode === 'hurt') { const b = Math.sin(Math.min(1, k) * Math.PI); body.rotation.x = -0.35 * b; WL.rotation.z = -1.3 * b; WR.rotation.z = 1.3 * b; }
      else if (mode === 'block') { const b = Math.sin(Math.min(1, k) * Math.PI); body.position.y = 0.25 * b; WL.rotation.z = -0.9 * b; WR.rotation.z = 0.9 * b; }   // a startled hop
      else if (mode === 'dead') { body.rotation.z = 1.4 * k; body.position.y = 0.2 * k; }
      else if (mode === 'ready') { H.rotation.x = -0.2 + Math.sin(now * 6) * 0.1; WL.rotation.z = -0.3; WR.rotation.z = 0.3; }
      else { const peck = (now % 4) < 0.5 ? Math.sin((now % 4) / 0.5 * Math.PI) : 0; H.rotation.x = peck * 0.8; H.position.z = 0.42 + peck * 0.1; } };   // pecking at the ground now and then
    g.scale.setScalar(1.1);
  } else if (kind === 'cow') {   // a black-and-white dairy cow: patches, a pink muzzle and udder, little horns
    const body = new THREE.Group(); g.add(body); parts.body = body;
    const torso = P(body, gCapsule(0.62, 1.25), 0xf0eee8, 0, 1.3, 0); torso.rotation.x = Math.PI / 2;
    for (const [x, y, z, s] of [[0.5, 1.45, 0.3, 0.42], [-0.52, 1.3, -0.35, 0.48], [0.45, 1.15, -0.75, 0.3], [-0.2, 1.88, 0.2, 0.38], [0.15, 1.85, -0.6, 0.3], [-0.55, 1.4, 0.65, 0.26]]) {
      const pt = P(body, gRound(s, 10), 0x1e1c1a, x, y, z, false); const nx = x / Math.hypot(x, y - 1.3) || 0; pt.scale.set(Math.abs(x) > 0.3 ? 0.35 : 1, Math.abs(x) > 0.3 ? 1 : 0.35, 1.1); }
    const head = new THREE.Group(); head.position.set(0, 1.65, 1.2); body.add(head); parts.head = head;
    P(head, geo('cowHead', () => new THREE.BoxGeometry(0.62, 0.62, 0.72)), 0xf0eee8, 0, 0, 0.1);
    P(head, geo('cowCrown', () => new THREE.BoxGeometry(0.64, 0.24, 0.5)), 0x1e1c1a, 0, 0.22, -0.02, false);
    P(head, geo('cowMuzzle', () => new THREE.BoxGeometry(0.5, 0.34, 0.24)), 0xf0a8a8, 0, -0.16, 0.52);
    for (const s of [-1, 1]) { P(head, gRound(0.04, 6), 0x5a2a2a, s * 0.1, -0.12, 0.65, false); P(head, gRound(0.085, 10), 0x15110d, s * 0.17, 0.1, 0.45, false).scale.set(1, 1.15, 0.6); const gl = new THREE.Mesh(gRound(0.028, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); gl.position.set(s * 0.17 + 0.025, 0.14, 0.5); head.add(gl);   /* big shiny eyes on the face (they used to sit hidden inside the head) */
      const horn = P(head, geo('cowHorn', () => new THREE.ConeGeometry(0.06, 0.28, 6)), 0xe8dcb0, s * 0.28, 0.42, 0); horn.rotation.z = -s * 0.6;
      P(head, gRound(0.12, 8), 0x1e1c1a, s * 0.4, 0.18, -0.12, false).scale.set(1.4, 0.6, 0.5); }
    P(body, gRound(0.26, 10), 0xf0a0a8, 0, 0.72, -0.45).scale.set(1, 0.7, 1);
    for (const [x, z] of [[-0.1, -0.38], [0.1, -0.38], [-0.1, -0.55], [0.1, -0.55]]) P(body, geo('teat', () => new THREE.CylinderGeometry(0.03, 0.025, 0.14, 5)), 0xe88a96, x, 0.55, z, false);
    const tail = new THREE.Group(); tail.position.set(0, 1.6, -1.25); body.add(tail); parts.tail = tail;
    P(tail, geo('cowTail', () => new THREE.CylinderGeometry(0.03, 0.04, 0.9, 5)), 0xf0eee8, 0, -0.45, -0.05); P(tail, gRound(0.09, 8), 0x1e1c1a, 0, -0.92, -0.05, false).scale.set(1, 1.6, 1);
    parts.legs = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Group(); l.position.set(sx * 0.36, 0.85, sz * 0.75); body.add(l);
      P(l, geo('cowLeg', () => new THREE.CylinderGeometry(0.13, 0.11, 0.8, 7)), 0xf0eee8, 0, -0.4, 0); P(l, geo('hoof', () => new THREE.CylinderGeometry(0.12, 0.13, 0.12, 7)), 0x2a2420, 0, -0.82, 0); parts.legs.push(l); }
    pose = (mode, k, now) => { const H = parts.head, L = parts.legs;
      body.rotation.set(0, 0, 0); body.position.set(0, 0, 0); H.rotation.set(0, 0, 0); L.forEach(l => l.rotation.x = 0); parts.tail.rotation.x = Math.sin(now * 2) * 0.3;
      if (mode === 'walk') { const s = Math.sin(now * 6); L[0].rotation.x = L[3].rotation.x = s * 0.35; L[1].rotation.x = L[2].rotation.x = -s * 0.35; H.rotation.x = Math.sin(now * 6) * 0.06; }
      else if (mode === 'swing') { const lower = k < 0.35 ? k / 0.35 : 1, hit = k > 0.35 && k < 0.6 ? Math.sin((k - 0.35) / 0.25 * Math.PI) : 0, back = k >= 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
        H.rotation.x = 0.55 * lower * back; body.position.z = 0.6 * hit - 0.15 * (k < 0.35 ? lower : 0); body.rotation.x = 0.08 * hit; }   // head down, then a charging butt
      else if (mode === 'hurt') { const b = Math.sin(Math.min(1, k) * Math.PI); body.rotation.x = -0.12 * b; H.rotation.x = -0.4 * b; }
      else if (mode === 'block') { const b = Math.sin(Math.min(1, k) * Math.PI); body.rotation.z = 0.08 * b; }
      else if (mode === 'dead') { body.rotation.z = 1.35 * k; body.position.y = 0.35 * k; L.forEach((l, i) => l.rotation.x = (i % 2 ? 0.25 : -0.25) * k); }   // keeled over, stiff legs splayed a little
      else if (mode === 'ready') { H.rotation.x = 0.3; L[0].rotation.x = Math.max(0, Math.sin(now * 5)) * -0.4; }   // head lowered, pawing the ground
      else { H.rotation.x = 0.35 + Math.sin(now * 0.8) * 0.15; } };   // grazing
    g.scale.setScalar(1.05);
  } else if (kind === 'rat') {   // a giant rat: mangy dark grey, hunched, glowing red eyes, bared teeth and a long pink tail
    const body = new THREE.Group(); g.add(body); parts.body = body;
    P(body, gRound(0.55, 16), 0x4a4a50, 0, 0.62, 0).scale.set(1, 0.82, 1.55);
    P(body, gRound(0.4, 12), 0x55555c, 0, 0.92, -0.2).scale.set(1, 0.8, 1.3);   // the hunched back
    for (const [x, y, z] of [[0.48, 0.75, 0.1], [-0.3, 1.05, -0.35], [0.35, 0.6, -0.55]]) P(body, gRound(0.12, 8), 0x9a4a3a, x, y, z, false).scale.set(0.5, 1, 1.4);   // wounds
    const head = new THREE.Group(); head.position.set(0, 0.7, 0.85); body.add(head); parts.head = head;
    P(head, geo('ratSnout', () => new THREE.ConeGeometry(0.3, 0.75, 10)), 0x4e4e55, 0, 0, 0.3).rotation.x = Math.PI / 2;
    P(head, gRound(0.06, 8), 0xd88a8a, 0, 0, 0.68, false);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.12, 0.1); head.add(jaw); parts.jaw = jaw;
    P(jaw, geo('ratJaw', () => new THREE.BoxGeometry(0.28, 0.08, 0.45)), 0x3e3e44, 0, -0.04, 0.22);
    for (const s of [-1, 1]) { P(head, geo('ratFang', () => new THREE.ConeGeometry(0.03, 0.12, 5)), 0xf4ecd8, s * 0.06, -0.12, 0.52, false).rotation.x = Math.PI;
      const eye = new THREE.Mesh(gRound(0.05, 8), new THREE.MeshBasicMaterial({ color: 0xff2a1a })); eye.position.set(s * 0.17, 0.12, 0.25); head.add(eye);
      P(head, gRound(0.12, 8), 0xc8807a, s * 0.22, 0.26, -0.05).scale.set(1, 1, 0.4); }
    const tail = new THREE.Group(); tail.position.set(0, 0.55, -0.82); body.add(tail); parts.tailSegs = [];
    let prev = tail; for (let i = 0; i < 8; i++) { const sg = new THREE.Group(); sg.position.z = i ? -0.22 : 0; prev.add(sg); P(sg, gCapsule(0.06 - i * 0.005, 0.18), 0xc8807a, 0, 0, -0.11).rotation.x = Math.PI / 2; parts.tailSegs.push(sg); prev = sg; }
    parts.legs = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Group(); l.position.set(sx * 0.35, 0.35, sz * 0.5); body.add(l);
      P(l, geo('ratLeg', () => new THREE.CylinderGeometry(0.07, 0.06, 0.34, 6)), 0x3e3e44, 0, -0.15, 0); P(l, geo('ratPaw', () => new THREE.BoxGeometry(0.12, 0.05, 0.16)), 0xc8807a, 0, -0.32, 0.05, false); parts.legs.push(l); }
    pose = (mode, k, now) => { const H = parts.head, L = parts.legs;
      body.rotation.set(0, 0, 0); body.position.set(0, 0, 0); H.rotation.set(0, 0, 0); parts.jaw.rotation.x = 0; L.forEach(l => l.rotation.x = 0);
      parts.tailSegs.forEach((sg, i) => { sg.rotation.y = Math.sin(now * 3 - i * 0.6) * 0.18; sg.rotation.x = 0.06; });
      if (mode === 'walk') { const s = Math.sin(now * 16); L[0].rotation.x = L[3].rotation.x = s * 0.6; L[1].rotation.x = L[2].rotation.x = -s * 0.6; body.position.y = Math.abs(s) * 0.03; }
      else if (mode === 'swing') { const wind = k < 0.4 ? k / 0.4 : 0, lunge = k >= 0.4 && k < 0.65 ? Math.sin((k - 0.4) / 0.25 * Math.PI) : 0;
        body.position.z = -0.25 * wind + 0.7 * lunge; body.rotation.x = -0.15 * wind + 0.15 * lunge; parts.jaw.rotation.x = 0.7 * Math.max(wind, lunge); H.rotation.x = -0.2 * wind; }   // crouch back, then lunge and snap
      else if (mode === 'hurt') { const b = Math.sin(Math.min(1, k) * Math.PI); body.position.z = -0.25 * b; parts.jaw.rotation.x = 0.4 * b; }
      else if (mode === 'block') { const b = Math.sin(Math.min(1, k) * Math.PI); body.position.x = 0.3 * b; }
      else if (mode === 'dead') { body.rotation.z = 1.5 * k; body.position.y = 0.25 * k; L.forEach((l, i) => l.rotation.x = (i % 2 ? 0.3 : -0.3) * k); }
      else if (mode === 'ready') { parts.jaw.rotation.x = 0.35 + Math.sin(now * 9) * 0.1; body.position.y = Math.sin(now * 5) * 0.03; }   // teeth bared, twitching
      else { H.rotation.y = Math.sin(now * 1.3) * 0.35; H.rotation.x = Math.sin(now * 7) * 0.05; } };   // sniffing about
    g.scale.setScalar(1.15);
  } else {   // the angry farmer: one of us, in a straw hat and blue overalls, scowling, gripping a pitchfork
    const f = makeChibi({ gender: 'male', skin: 0xe0b088, hair: 'short', hairCol: 0x5a3a1a, shirt: 0xc8b490, pants: 0x3a5a8a, boots: 0x5a3a22, eye: 0x1e1a2a, cheeks: 'none' });
    wearHat(f, 'straw');
    const c = f.userData.chibi;
    chibiPart(c.body, geo('bib', () => new THREE.BoxGeometry(0.46, 0.42, 0.12)), 0x3a5a8a, 0, 1.08, 0.3);   // the overall bib and its straps
    for (const s of [-1, 1]) chibiPart(c.body, geo('strap', () => new THREE.BoxGeometry(0.08, 0.5, 0.1)), 0x3a5a8a, s * 0.2, 1.32, 0.25, false).rotation.x = -0.2;
    for (const s of [-1, 1]) { const brow = chibiPart(c.head, geo('brow', () => new THREE.BoxGeometry(0.2, 0.05, 0.04)), 0x3a2a1a, s * 0.22, 0.17, 0.56, false); brow.rotation.z = s * 0.45; }   // furious eyebrows
    c.head.children.forEach(m => { if (m.geometry && m.geometry.type === 'TorusGeometry') { m.rotation.z = 0; m.position.y = -0.2; } });   // the smile turned into a scowl
    const fork = new THREE.Group(); fork.userData.isClub = true; fork.position.set(0, -0.45, 0); fork.rotation.x = -Math.PI / 2 + 0.3; c.arms[1].add(fork);
    chibiPart(fork, geo('forkHandle', () => new THREE.CylinderGeometry(0.04, 0.05, 1.9, 6)), 0x8a5a2a, 0, -0.55, 0);
    chibiPart(fork, geo('forkBar', () => new THREE.BoxGeometry(0.36, 0.05, 0.05)), 0x8a9099, 0, -1.5, 0);
    for (const x of [-0.16, 0, 0.16]) chibiPart(fork, geo('forkTine', () => new THREE.CylinderGeometry(0.022, 0.012, 0.42, 5)), 0x9aa0a8, x, -1.72, 0);
    f.userData.farmer = true;
    return f;
  }
  g.userData.pose = pose; g.userData.parts = parts;
  return g;
}
// pose any monster: chibi ones (goblins, farmers) use the people's poses; animals use their own
function monsterPose(m, mode, k = 0){
  const now = performance.now() / 1000, c = m.g.userData.chibi;
  if (c) { if (mode === 'walk' || mode === 'idle') poseChibi(m.g, mode, now); else fightPose(c, mode, k); if (mode === 'walk' || mode === 'idle') c.arms[1].children.forEach(o => { if (o.userData.isClub) o.visible = true; }); return; }
  if (m.g.userData.pose) m.g.userData.pose(mode, k, now);
}

function combatLevel(){ return Math.floor((levelOf(SKILL_XP.Melee) * 2 + levelOf(SKILL_XP.Hitpoints)) / 3); }
function maxHp(){ return levelOf(SKILL_XP.Hitpoints); }
const MONSTERS = [];
const MONSTER_TYPES = {
  goblin: { name: 'Goblin', level: 2, hp: 6, melee: 1, atk: 0, def: 0, maxHit: 1, speed: 2600, respawn: 25000, snd: 'goblin' },
  // the farm biome, from Idle Tap Adventure's monster list (hit points and max hits as there)
  chicken: { name: 'Chicken', level: 1, hp: 5, melee: 1, atk: 0, def: 0, maxHit: 1, speed: 2800, respawn: 20000, snd: 'chicken', coins: [0, 0], drops: [['Raw chicken', 1, 1], ['Feathers', 5, 15]] },
  cow: { name: 'Cow', level: 2, hp: 15, melee: 2, atk: 2, def: 1, maxHit: 1, speed: 3000, respawn: 30000, snd: 'cow', coins: [0, 0], drops: [['Raw beef', 1, 1]] },
  rat: { name: 'Giant Rat', level: 3, hp: 10, melee: 2, atk: 2, def: 2, maxHit: 2, speed: 2400, respawn: 25000, snd: 'rat', coins: [0, 0] },
  // the north: bigger, bolder giant rats that come for you (aggro: they chase anyone whose combat level is at most twice theirs plus one, and leave stronger players alone)
  hillRat: { name: 'Giant Rat', model: 'rat', level: 6, hp: 20, melee: 6, atk: 5, def: 5, maxHit: 2, speed: 2400, respawn: 30000, snd: 'rat', coins: [2, 8], aggro: true },
  caveRat: { name: 'Giant Rat', model: 'rat', level: 9, hp: 28, melee: 9, atk: 8, def: 8, maxHit: 3, speed: 2300, respawn: 35000, snd: 'rat', coins: [4, 14], aggro: true, scale: 1.2 },
  farmer: { name: 'Angry Farmer', level: 10, hp: 25, melee: 10, atk: 10, def: 10, maxHit: 3, speed: 2400, respawn: 60000, snd: 'farmer', coins: [0, 0] },
};
// the classic accuracy roll: compare an attack roll against a defence roll
function hitChance(attRoll, defRoll){ return attRoll > defRoll ? 1 - (defRoll + 2) / (2 * (attRoll + 1)) : attRoll / (2 * (defRoll + 1)); }
function playerRolls(){
  const lv = levelOf(SKILL_XP.Melee) + 8, atk = gearBonus('atk'), def = gearBonus('def');
  return { att: lv * (atk + 64), def: lv * (def + 64), maxHit: Math.max(1, Math.floor(1 + lv * (atk + 64) / 450)) };
}
function monsterRolls(t){ const lv = t.melee + 8; return { att: lv * (t.atk + 64), def: lv * (t.def + 64), maxHit: t.maxHit }; }
function spawnMonster(kind, x, z, rad = 3, box = null){
  const t = MONSTER_TYPES[kind];
  const g = kind === 'goblin' ? makeGoblin({ skin: [0x6a9a3a, 0x7aa848, 0x5a8a34][MONSTERS.length % 3] }) : makeFarmMonster(t.model || kind); g.position.set(x, 0, z); if (t.scale) g.scale.multiplyScalar(t.scale); scene.add(g);
  const rec = { kind: 'monster', type: kind, t, name: `${t.name} (level ${t.level})`, x, z, s: 0.75, state: 'standing', hp: t.hp, home: [x, z], g };
  g.userData.action = 'Attack'; g.userData.name = rec.name; g.userData.rec = rec; trees.push(g);
  rec.bar = document.createElement('div'); rec.bar.className = 'hpBar'; rec.bar.innerHTML = '<i></i>'; rec.bar.style.display = 'none'; document.body.appendChild(rec.bar);
  rec.wander = { tx: x, tz: z, pause: 60 + Math.random() * 200 }; rec.rad = rad; rec.box = box;   // how far from home it wanders, and the pen it stays in
  MONSTERS.push(rec); return rec;
}
let FIGHT = null;
// what others are told you're fighting: a farm monster by its shared id, a party cellar creature by its spawn tag
const fightAct = m => ({ k: 'fight', n: m.name, t: Date.now(), m: m.sid, d: m.delve && DELVE && DELVE.party ? m.sp : undefined });
/* how far apart you stand to fight: the farmer is a full-sized person, so he stands off further than a chicken */
const reachOf = m => m.type === 'farmer' ? 3.0 : m.type === 'cow' ? 2.8 : 2.3;
function startFight(rec){
  if (mobLocked(rec)) { showToast('Someone else is fighting that.'); return; }
  if (rec.state !== 'standing') return;
  if (FIGHT && FIGHT.m === rec) return;
  if (FIGHT) endFight();
  // walk up to it, then lock in: you and it face each other and stay put until one of you falls or you run
  // the nearest free side of it, so a rat by a fence or a dead tree can still be reached
  const base = Math.atan2(hero.position.x - rec.x, hero.position.z - rec.z);
  let spot = null;
  for (let i = 0; i < 8 && !spot; i++) { const a = base + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI / 4, x = rec.x + Math.sin(a) * reachOf(rec), z = rec.z + Math.cos(a) * reachOf(rec); if (!blocked(x, z)) spot = new THREE.Vector3(x, 0, z); }
  if (!spot) spot = new THREE.Vector3(rec.x + Math.sin(base) * reachOf(rec), 0, rec.z + Math.cos(base) * reachOf(rec));
  if (Math.abs(Math.hypot(hero.position.x - rec.x, hero.position.z - rec.z) - reachOf(rec)) < 0.6) spot = hero.position.clone();   // already beside it
  rec.state = 'engaged'; rec.engagedAt = performance.now();
  walkStart(spot, () => {
    if (rec.state !== 'engaged' || Math.hypot(hero.position.x - rec.x, hero.position.z - rec.z) > reachOf(rec) + 1.4) { if (rec.state === 'engaged') rec.state = 'standing'; return; }
    if (mobLocked(rec)) { rec.state = 'standing'; showToast('Someone else is fighting that.'); return; }
    FIGHT = { m: rec, nextP: performance.now() + 300, nextM: performance.now() + 1500, pAnim: null, mAnim: null };
    mobClaim(rec);
    heroAnim.yaw = yawTo(hero.position.x, hero.position.z, rec.x, rec.z);
    rec.g.rotation.y = yawTo(rec.x, rec.z, hero.position.x, hero.position.z);
    setAct(fightAct(rec));
  });
}
function endFight(msg){
  if (!FIGHT) return;
  const m = FIGHT.m; FIGHT = null; m.aggroAt = performance.now() + AGGRO_COOL;   /* got away: an aggressive one gives you a moment */
  if (m.state === 'engaged') m.state = 'standing';
  if (m.state !== 'dying' && m.state !== 'dead') mobRelease(m);
  if (ONLINE.act && ONLINE.act.k === 'fight') setAct(null);
  if (msg) showToast(msg);
}
// poses for one swing: wind up, strike, recover. 'block' raises the shield, 'hurt' flinches back
function fightPose(c, kind, k){
  const [AL, AR] = c.arms;
  AL.rotation.set(0, 0, -0.2); AR.rotation.set(0, 0, 0.2); c.body.rotation.set(0, 0, 0); c.head.rotation.set(0, 0, 0); c.legs.forEach(l => l.rotation.set(0, 0, 0));
  if (c.weapon) { c.weapon.rotation.x = -1.15; c.weapon.rotation.z = 0; }
  const dual = !!(c.weaponL && c.elbows);
  if (c.fightFaces) {   /* the face: a wince when hit or falling, a shout around each blow, a hard stare otherwise */
    const strike = kind === 'swing' && (dual ? (k > 0.2 && k < 0.36) || (k > 0.7 && k < 0.86) : k > 0.4 && k < 0.7);
    setFightFace(c, kind === 'hurt' || kind === 'dead' ? 'wince' : strike ? 'shout' : 'focus'); c.ffUntil = performance.now() + 1000;
  }
  if (dual) {   /* the pair: a guard with both blades out, the lunge stab, and the usual block, flinch and fall from that guard */
    c.body.position.set(0, 0, 0);
    c.weapon.visible = c.weaponL.visible = kind !== 'eat';   /* a bite mid-fight: the blades are lowered out of the way */
    if (kind === 'swing') { dualLunge(c, k); return; }
    if (kind === 'dead') { c.elbows.forEach(e => e.rotation.set(0, 0, 0)); }
    else { dualReady(c); if (kind !== 'ready' && kind !== 'eat') { AL.rotation.z = -0.2; AR.rotation.z = 0.2; c.elbows.forEach(e => e.rotation.set(-0.25, 0, 0)); c.weapon.rotation.x = c.weaponL.rotation.x = -1.15; if (kind === 'block') c.weaponL.rotation.set(DUAL_BLOCK[0], 0, DUAL_BLOCK[1]); } }   /* blocking or flinching: arms nearly straight, so a blade never swings back at the face */
    if (kind === 'ready') { const b = Math.sin(performance.now() / 300) * 0.04; AR.rotation.x += b; dualSettle(c); return; }
  }
  if (kind === 'swing') {
    const a = k < 0.45 ? lerp(-0.4, -2.9, ease(k / 0.45)) : k < 0.6 ? lerp(-2.9, -0.6, (k - 0.45) / 0.15) : lerp(-0.6, -0.4, (k - 0.6) / 0.4);
    AR.rotation.set(a, 0, 0.05);
    if (c.weapon) c.weapon.rotation.x = -0.75;   /* the original swing */
    c.body.rotation.x = k < 0.45 ? -0.12 * ease(k / 0.45) : (k < 0.75 ? 0.2 : 0.2 * (1 - (k - 0.75) / 0.25)); c.legs[0].rotation.x = -0.35;
  } else if (kind === 'block') { const b = Math.sin(Math.min(1, k) * Math.PI); AL.rotation.set(-1.45 * b, 0.5 * b, -0.2 + 0.3 * b); c.body.rotation.x = 0.06 * b; c.legs[1].rotation.x = 0.3 * b; }
  else if (kind === 'hurt') { const b = Math.sin(Math.min(1, k) * Math.PI); c.body.rotation.x = -0.3 * b; c.head.rotation.z = 0.2 * b; AL.rotation.set(0.4 * b, 0, -0.2 - 0.4 * b); AR.rotation.set(0.4 * b, 0, 0.2 + 0.4 * b); }
  else if (kind === 'eat') eatPose(c, k);
  else if (kind === 'dead') { c.body.rotation.x = -1.45 * k; c.body.position.y = -0.62 * k; AL.rotation.set(-2.6 * k, 0, -0.4); AR.rotation.set(-2.6 * k, 0, 0.4); c.legs.forEach(l => l.rotation.x = 1.2 * k); }
  else { const b = Math.sin(performance.now() / 300) * 0.04; c.body.position.y = 0; AR.rotation.x = -0.4 + b; AL.rotation.x = -0.3; }   // ready stance
  if (dual && kind !== 'dead') dualSettle(c);
}
function hitsplat(obj, n, kind, label){
  const el = document.createElement('div'); el.className = 'splat ' + kind; el.innerHTML = n + (label ? `<small>${label}</small>` : '');
  document.body.appendChild(el); SPLATS.push({ el, obj, t0: performance.now(), y: obj === hero ? 3.3 : 2.6 });
}
const SPLATS = [], spV = new THREE.Vector3();
function playerSwing(m){
  const me = playerRolls(), it = monsterRolls(m.t), dual = !!(equipped.weapon && ITEMS[equipped.weapon] && ITEMS[equipped.weapon].twoHand);
  FIGHT.pAnim = { kind: 'swing', t0: performance.now(), dur: dual ? DUAL_MS : 900 };
  combatSound('swing'); mobHit(m, 'ps', 0, '');
  /* the pair stabs twice, right then left: each its own roll, each hitting for a little over half a sword's best */
  if (dual) { setTimeout(() => { if (FIGHT && FIGHT.m === m) combatSound('swing'); }, DUAL_MS * 0.5); for (const at of DUAL_HITS) setTimeout(() => landBlow(m, me, it, Math.max(1, Math.round(me.maxHit * DUAL_MULT))), DUAL_MS * at); }
  else setTimeout(() => landBlow(m, me, it, me.maxHit), 480);
}
function landBlow(m, me, it, maxHit){
    if (!FIGHT || FIGHT.m !== m) return;
    if (Math.random() < hitChance(me.att, it.def)) {
      const dmg = Math.floor(Math.random() * (maxHit + 1));
      if (dmg > 0) { if (m.delve && DELVE) DELVE.dmg = (DELVE.dmg || 0) + dmg; if (m.raid) raidHit(m, dmg); else if (m.ghost) partyHit(m, dmg); else { m.hp = Math.max(0, m.hp - dmg); if (m.delve && DELVE && DELVE.party) threat(m, ONLINE.id, dmg); } hitsplat(m.g, dmg, 'hit'); mobHit(m, 'p', dmg, 'hit'); combatSound('hit'); combatSound((m.t.snd || 'goblin') + 'Hurt'); FIGHT.mAnim = { kind: 'hurt', t0: performance.now(), dur: 450 };
        addXp('Melee', dmg * 4); addXp('Hitpoints', dmg * 4); }   /* the same for both: Melee stands for Attack, Strength and Defence together, and Hitpoints keeps pace with it as it does with each of those in RuneScape */
      else { hitsplat(m.g, 0, 'block', 'Blocked'); combatSound(m.t.metal ? 'clang' : 'thud'); FIGHT.mAnim = { kind: 'block', t0: performance.now(), dur: 500 }; mobHit(m, 'p', 0, 'block'); }
    } else { hitsplat(m.g, 0, 'miss', 'Miss'); combatSound('miss'); FIGHT.mAnim = { kind: 'block', t0: performance.now(), dur: 500 }; mobHit(m, 'p', 0, 'miss'); }
    if (m.hp <= 0) { if (m.raid) { m.state = 'dying'; m.dieT = performance.now(); combatSound('goblinDie'); endFight(); } else if (m.ghost) endFight(); /* the leader's game says when it falls */ else killMonster(m); }
  }
function monsterSwing(m){
  const me = playerRolls(), it = monsterRolls(m.t);
  FIGHT.mAnim = { kind: 'swing', t0: performance.now(), dur: 900 };
  combatSound((m.t.snd || 'goblin') + 'Attack'); mobHit(m, 'ms', 0, '');
  setTimeout(() => {
    if (!FIGHT || FIGHT.m !== m) return;
    if (Math.random() < hitChance(it.att, me.def)) {
      const dmg = Math.floor(Math.random() * (it.maxHit + 1));
      if (dmg > 0) { HP.cur = Math.max(0, HP.cur - dmg); hitsplat(hero, dmg, 'hit'); combatSound('hit'); combatSound(look.gender === 'female' ? 'hurtF' : 'hurtM'); FIGHT.pAnim = { kind: 'hurt', t0: performance.now(), dur: 450 }; renderStats(); mobHit(m, 'm', dmg, 'hit'); }
      else { hitsplat(hero, 0, 'block', 'Blocked'); combatSound(equipped.shield && equipped.shield !== 'Torch' || equipped.body || equipped.head ? 'clang' : 'thud'); FIGHT.pAnim = { kind: 'block', t0: performance.now(), dur: 500 }; mobHit(m, 'm', 0, 'block'); }
    } else { hitsplat(hero, 0, 'miss', 'Miss'); combatSound('miss'); FIGHT.pAnim = { kind: 'block', t0: performance.now(), dur: 500 }; mobHit(m, 'm', 0, 'miss'); }
    if (HP.cur <= 0) playerDies();
  }, 480);
}
function killMonster(m){
  if (m.delve && DELVE && DELVE.party) { m.state = 'dying'; m.dieT = performance.now(); combatSound((m.t.snd || 'goblin') + 'Die'); endFight(); return; }   /* party delves: rewards come from the chest */
  mobDead(m);
  if (m.type in KILLS) { KILLS[m.type]++; if (cellarOpen() && KILLS[m.type] === 10) setTimeout(() => addSystemLine('Somewhere to the south, a chain rattles loose.'), 1500); }
  m.state = 'dying'; m.dieT = performance.now(); combatSound((m.t.snd || 'goblin') + 'Die');
  const [c0, c1] = m.t.coins || [3, 10], coins = c0 + Math.floor(Math.random() * (c1 - c0 + 1));
  const dx = m.x, dz = m.z;   /* as in RuneScape, the drop lands where it fell: yours alone for a minute, then anyone's, gone after two */
  setTimeout(() => {
    if (coins > 0) dropToGround('Coins', coins, dx, dz, true, true);
    for (const [name, lo, hi] of m.t.drops || []) dropToGround(name, lo + Math.floor(Math.random() * (hi - lo + 1)), dx, dz, true, true);
    showToast(`The ${m.t.name.toLowerCase()} is defeated!`);
  }, 900);
  endFight();
}
function playerDies(){
  if (DELVE && !DELVE.done) { endFight(); delveFailed(false); return; }
  endFight(); showToast('Oh dear, you are dead! You wake up in the hall.');
  if (EV.seat >= 0) standUp();
  dropOnDeath();
  if (evActive() && EV.data.raid && EV.data.raid.part && EV.data.raid.part[ONLINE.id]) { EV.deadNow = true; ONLINE.rd = EV.data.start; writePresence(true); }   // out of the raid
  setTimeout(() => { hero.position.copy(START); walkTarget = null; HP.cur = maxHp(); renderStats(); }, 1200);
}
let hpRegen = 0;
function updateFight(){
  const now = performance.now();
  if (!FIGHT && hero && HP.cur < maxHp() && now > hpRegen) { hpRegen = now + 6000; HP.cur++; renderStats(); }   // health comes back slowly out of combat
  else if (FIGHT) hpRegen = now + 6000;
  // monsters: wander near home, fall over when beaten, come back later
  for (const m of MONSTERS) {
    const c = m.g.userData.chibi;
    if ((m.raid || m.delve) && m.state !== 'dying' && m.state !== 'dead') { /* raiders are moved by updateRaiders, the cellar's creatures by updateDelve */ }
    else if (m.state === 'dying') { const k = Math.min(1, (now - m.dieT) / 700); monsterPose(m, 'dead', k); if (now - m.dieT > 3000) { m.g.visible = false; m.state = 'dead'; } }
    else if (m.state === 'dead') { if (!m.raid && !m.delve && (m.sid !== undefined ? !mobDeadNow(m) && now - m.dieT > 3200 : now - m.dieT > m.t.respawn)) { m.hp = m.t.hp; m.state = 'standing'; m.g.visible = true; m.g.position.set(m.home[0], 0, m.home[1]); monsterPose(m, 'idle'); } }
    else if (m.sid !== undefined && (!FIGHT || FIGHT.m !== m)) mobUpdate(m, now);
    else if (!FIGHT || FIGHT.m !== m) {
      if (m.state === 'standing') {
        const w = m.wander, x = m.g.position.x, z = m.g.position.z;
        if (w.pause > 0) { w.pause--; monsterPose(m, 'idle'); }
        else { const dx = w.tx - x, dz = w.tz - z, d = Math.hypot(dx, dz);
          if (d < 0.05) { for (let tries = 0; tries < 6; tries++) {   // somewhere near home, inside its pen, and not inside anything solid
              let tx = m.home[0] + (Math.random() * 2 - 1) * (m.rad || 3), tz = m.home[1] + (Math.random() * 2 - 1) * (m.rad || 3);
              if (m.box) { tx = Math.max(m.box.x0, Math.min(m.box.x1, tx)); tz = Math.max(m.box.z0, Math.min(m.box.z1, tz)); }
              if (!monsterHit(tx, tz)) { w.tx = tx; w.tz = tz; break; } }
            w.pause = 120 + Math.random() * 200; }
          else { const st = Math.min(d, 0.022), nx = x + dx / d * st, nz = z + dz / d * st;
            if (monsterHit(nx, nz) && !monsterHit(x, z)) { w.tx = x; w.tz = z; w.pause = 30; }   /* a wall in the way: stop, and pick somewhere else next time */
            else { m.g.position.x = nx; m.g.position.z = nz; turnChibi(m.g, Math.atan2(dx, dz)); monsterPose(m, 'walk'); } } }
        m.x = m.g.position.x; m.z = m.g.position.z;
      } else if (m.state === 'engaged' && !walkTarget && now - (m.engagedAt || 0) > 1500) { m.state = 'standing'; }   // you never reached it (or walked off): it goes back to its business
      else if (m.state === 'engaged') { monsterPose(m, 'ready'); m.g.rotation.y = yawTo(m.x, m.z, hero.position.x, hero.position.z); }
      if (c) c.arms[1].children.forEach(k => { if (k.userData.isClub) k.visible = true; });
    }
    // the health bar shows while it is hurt or fighting
    const show = m.state !== 'dead' && (m.hp < (m.maxHp || m.t.hp) || (FIGHT && FIGHT.m === m) || m.foreign);
    m.bar.style.display = show ? 'block' : 'none';
    if (show) { m.bar.firstChild.style.width = (m.hp / (m.maxHp || m.t.hp) * 100) + '%'; m.g.getWorldPosition(spV); spV.y += 3.1; spV.project(camera); m.bar.style.left = (spV.x + 1) / 2 * innerWidth + 'px'; m.bar.style.top = (-spV.y + 1) / 2 * innerHeight + 'px'; }
  }
  // your own health bar, while fighting or hurt
  const hb = document.getElementById('heroHp'), showH = hero && (FIGHT || HP.cur < maxHp());
  hb.style.display = showH ? 'block' : 'none';
  if (showH) { hb.firstChild.style.width = (HP.cur / maxHp() * 100) + '%'; hero.getWorldPosition(spV); spV.y += 4.0; spV.project(camera); hb.style.left = (spV.x + 1) / 2 * innerWidth + 'px'; hb.style.top = (-spV.y + 1) / 2 * innerHeight + 'px'; }
  // the hitsplats rise and fade
  for (let i = SPLATS.length - 1; i >= 0; i--) { const sp = SPLATS[i], k = (now - sp.t0) / 1300;
    if (k >= 1) { sp.el.remove(); SPLATS.splice(i, 1); continue; }
    sp.obj.getWorldPosition(spV); spV.y += sp.y + k * 1.2; spV.project(camera);
    sp.el.style.left = (spV.x + 1) / 2 * innerWidth + 'px'; sp.el.style.top = (-spV.y + 1) / 2 * innerHeight + 'px'; sp.el.style.opacity = k > 0.7 ? (1 - k) / 0.3 : 1; }
  if (!FIGHT) return;
  const m = FIGHT.m;
  if (!hero || Math.hypot(hero.position.x - m.x, hero.position.z - m.z) > reachOf(m) + 1.9) { endFight(); return; }
  heroAnim.mode = 'fight';
  heroAnim.yaw = yawTo(hero.position.x, hero.position.z, m.x, m.z);
  if (m.sid !== undefined && now - (FIGHT.hb || 0) > 4000) { FIGHT.hb = now; mobPatch(m.sid, { t: SNOW(), hp: m.hp }); }   /* still fighting it */
  if (now > FIGHT.nextP) { FIGHT.nextP = now + 2400; playerSwing(m); }
  const busyElsewhere = m.delve && DELVE && DELVE.party && m.tg && m.tg !== ONLINE.id;   /* in a party, a creature fights one of you at a time: hitting it from the side is safe */
  if (FIGHT && now > FIGHT.nextM) { FIGHT.nextM = now + m.t.speed; if (!busyElsewhere) monsterSwing(m); }
  if (!FIGHT) return;
  const anim = (a, c) => { if (a && now - a.t0 < a.dur) fightPose(c, a.kind, (now - a.t0) / a.dur); else fightPose(c, 'ready', 0); };
  anim(FIGHT.pAnim, hero.userData.chibi);
  if (FIGHT.mAnim && now - FIGHT.mAnim.t0 < FIGHT.mAnim.dur) monsterPose(m, FIGHT.mAnim.kind, (now - FIGHT.mAnim.t0) / FIGHT.mAnim.dur); else monsterPose(m, 'ready');
}
// combat sounds, made in code like the rest
function combatSound(kind){
  const ctx = audio(); if (!ctx) return; const t = ctx.currentTime + 0.01;
  const out = ctx.createGain(); out.gain.value = 0.55; out.connect(sfxOut(ctx));
  const noiseThrough = (dur, type, f0, f1, q, vol, att = 0.01) => { const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, dur); const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.linearRampToValueAtTime(f1, t + dur); f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + dur); };
  const osc = (dur, type, f0, f1, vol, at = 0) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
    g.gain.setValueAtTime(vol, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur); o.connect(g); g.connect(out); o.start(t + at); o.stop(t + at + dur + 0.02); };
  const voice = (dur, f0, f1, forms, vol = 0.8, rough = 0) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur);
    if (rough) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 37; lg.gain.value = f0 * rough; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur); }
    const env = ctx.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(vol, t + 0.03); env.gain.exponentialRampToValueAtTime(0.0001, t + dur); env.connect(out);
    for (const [f, q, gg] of forms) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const g2 = ctx.createGain(); g2.gain.value = gg; o.connect(bp); bp.connect(g2); g2.connect(env); }
    o.start(t); o.stop(t + dur + 0.05); };
  if (kind === 'swing') noiseThrough(0.32, 'bandpass', 500, 2400, 1.4, 0.5, 0.12);
  if (kind === 'miss') noiseThrough(0.28, 'bandpass', 1800, 700, 1.0, 0.45, 0.05);
  if (kind === 'hit') { noiseThrough(0.18, 'lowpass', 900, 600, 0.7, 0.8, 0.002); osc(0.15, 'sine', 120, 60, 0.7); }
  if (kind === 'thud') { noiseThrough(0.14, 'lowpass', 500, 250, 0.8, 0.55, 0.003); osc(0.12, 'sine', 140, 70, 0.4); }   // a soft, dull blocked blow: no metal involved
  if (kind === 'clang') { for (const [f, v] of [[620, 0.35], [1544, 0.2], [2490, 0.14], [3711, 0.08]]) osc(0.9, 'sine', f, f * 0.998, v); noiseThrough(0.05, 'highpass', 3000, 3000, 0.7, 0.3, 0.001); }
  if (kind === 'hurtM') voice(0.32, 150, 105, [[500, 4, 1.2], [1100, 5, 0.6], [2400, 6, 0.2]]);
  if (kind === 'hurtF') voice(0.3, 290, 220, [[800, 4, 1.2], [1300, 5, 0.7], [2800, 6, 0.25]]);
  if (kind === 'goblinAttack') voice(0.42, 230, 330, [[700, 3, 1.2], [1600, 4, 0.7]], 0.6, 0.25);
  if (kind === 'goblinHurt') voice(0.28, 520, 760, [[1000, 4, 1.2], [2200, 5, 0.7]], 0.6, 0.12);
  if (kind === 'goblinDie') voice(0.9, 420, 140, [[800, 4, 1.2], [1800, 5, 0.6]], 0.7, 0.15);
  // the farm's creatures: a squawking hen, a bellowing cow, a screeching rat, and a farmer who shouts at you
  if (kind === 'chickenAttack') { voice(0.18, 900, 1300, [[1500, 5, 1.2], [3000, 6, 0.6]], 0.55, 0.3); setTimeout(() => voice(0.14, 1100, 900, [[1700, 5, 1]], 0.4, 0.3), 120); }
  if (kind === 'chickenHurt') voice(0.35, 1300, 800, [[1600, 4, 1.2], [3200, 6, 0.5]], 0.65, 0.4);
  if (kind === 'chickenDie') voice(0.7, 1200, 500, [[1400, 4, 1.1], [2800, 6, 0.4]], 0.6, 0.35);
  if (kind === 'cowAttack') voice(0.7, 120, 95, [[300, 4, 1.4], [800, 5, 0.6]], 0.9, 0.08);
  if (kind === 'cowHurt') voice(0.45, 160, 120, [[350, 4, 1.3], [900, 5, 0.5]], 0.8, 0.1);
  if (kind === 'cowDie') voice(1.3, 140, 70, [[300, 4, 1.4], [700, 5, 0.5]], 0.8, 0.08);
  if (kind === 'ratAttack') { voice(0.25, 2200, 2800, [[3000, 6, 1], [5500, 7, 0.5]], 0.45, 0.35); noiseThrough(0.3, 'highpass', 3000, 4000, 0.7, 0.35, 0.01); }
  if (kind === 'ratHurt') voice(0.22, 2600, 1800, [[3200, 6, 1]], 0.5, 0.4);
  if (kind === 'ratDie') voice(0.5, 2400, 900, [[2800, 6, 1], [5000, 7, 0.4]], 0.5, 0.4);
  if (kind === 'farmerAttack') { voice(0.3, 140, 110, [[600, 4, 1.2], [1200, 5, 0.6], [2500, 6, 0.2]], 0.8, 0.06); noiseThrough(0.3, 'bandpass', 600, 2200, 1.4, 0.45, 0.1); }   // a shout and the whoosh of the fork
  if (kind === 'farmerHurt') voice(0.3, 160, 115, [[520, 4, 1.2], [1150, 5, 0.6]], 0.8, 0.05);
  if (kind === 'farmerDie') voice(0.9, 150, 80, [[500, 4, 1.2], [1100, 5, 0.5]], 0.8, 0.05);
}
