// ----- the villagers' day: Tobin, Ysolde and Dunmore leave their houses to work, eat, fish, shop and sit at the bonfire,
// and come home to sleep. Like the guards, it all comes from the clock and routes worked out once, so everyone sees the same.
const VSEAT_TAKEN = new Set();
const VILLAGER_DAY = {
  Tobin: { seat: 2, ev: [[0, 'home', 'sleep'], [7, 'woods', 'chop'], [12, 'seat', 'sit'], [13, 'home', 'sleep'], [16, 'woods', 'chop'], [18.5, 'seat', 'sit'], [22, 'home', 'sleep']] },
  Ysolde: { seat: 5, ev: [[0, 'home', 'sleep'], [6.5, 'river', 'fish'], [12, 'pond', 'look'], [14, 'market', 'look'], [17, 'river', 'fish'], [19, 'seat', 'sit'], [22.5, 'home', 'sleep']] },
  Dunmore: { seat: 8, ev: [[0, 'home', 'sleep'], [7, 'home', 'work'], [18.5, 'seat', 'sit'], [22, 'home', 'sleep']] },
};
const VSTOPS = { woods: { x: -89.6, z: 4, yaw: -Math.PI / 2 }, river: { x: -31.2, z: -10.4, yaw: Math.PI }, pond: { x: -71, z: 80, yaw: -Math.PI / 2 }, market: { x: 107.5, z: 6.6, yaw: Math.PI } };
// a door swung open without a sound, for a villager walking through it (doors are each player's own, so this is only on your screen)
function openDoorQuiet(rec){ if (rec.open) return; rec.open = true; rec.pivot.rotation.y = -Math.PI / 2; rec.leaf.userData.action = 'Close'; const i = solidBoxes.indexOf(rec.box); if (i >= 0) solidBoxes.splice(i, 1); }
function vStop(w, name){
  if (name === 'home') return { x: w.home[0], z: w.home[1] };
  if (name === 'seat') { const st = BF.seats[VILLAGER_DAY[w.rec.name].seat]; return { x: st.ax, z: st.az, seat: st }; }
  return VSTOPS[name];
}
// the route between two stops, with every house door open so it can leave and enter homes: worked out once, then kept
function villagerRoute(w, a, b){
  const key = a + '>' + b; w.vroutes = w.vroutes || {}; if (w.vroutes[key]) return w.vroutes[key];
  const A = vStop(w, a), Bp = vStop(w, b), doors = houses.map(h => h.doorRec && h.doorRec.box).filter(x => x && solidBoxes.includes(x));
  for (const d of doors) solidBoxes.splice(solidBoxes.indexOf(d), 1);
  const pts = a === b ? [[A.x, A.z], [Bp.x, Bp.z]] : [...findPath(new THREE.Vector3(A.x, 0, A.z), new THREE.Vector3(Bp.x, 0, Bp.z)).map(q => [q.x, q.z]), [Bp.x, Bp.z]];
  for (const d of doors) solidBoxes.push(d);
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return (w.vroutes[key] = { pts, cum, len: cum[cum.length - 1] });
}
// where they are and what they're doing at this hour
function villagerState(w, h){
  const ev = VILLAGER_DAY[w.rec.name].ev; let i = 0; for (let k = 0; k < ev.length; k++) if (ev[k][0] <= h) i = k;
  const e = ev[i], prev = ev[(i - 1 + ev.length) % ev.length], r = villagerRoute(w, prev[1], e[1]), d = (h - e[0]) * 3600 * GUARD_SPEED;
  if (prev[1] !== e[1] && d < r.len) return { mode: 'walk', at: routeAt(r, d) };
  const st = vStop(w, e[1]); return { mode: e[2], at: [st.x, st.z], stop: st, where: e[1] };
}
// Ysolde's fly rod: held out over the water from her right hand, with the line hanging straight down to a float
function fishRod(c){
  if (c.rod) return c.rod;
  const g = new THREE.Group(); g.position.set(0, -0.45, 0); g.rotation.x = 2.15; c.arms[1].add(g);   // from the hand, forward and up over the water
  chibiPart(g, new THREE.CylinderGeometry(0.03, 0.06, 3.4, 6).translate(0, 1.7, 0), 0x7a4d22, 0, 0, 0);
  chibiPart(g, new THREE.CylinderGeometry(0.09, 0.09, 0.14, 10).rotateZ(Math.PI / 2), 0x5a5a60, 0, 0.35, 0.08);   // the reel
  const line = new THREE.Group(); line.position.set(0, 3.4, 0); g.add(line);
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 4).translate(0, -0.5, 0), new THREE.MeshBasicMaterial({ color: 0xe8e0c8 })); line.add(thread);
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xe04a3a })); line.add(bob);
  c.rod = { g, line, thread, bob }; return c.rod;
}
const rodQ = new THREE.Quaternion(), rodV = new THREE.Vector3();
// the small fishing net, held: a pole from the hands with a hoop and a mesh bag at the end, and a shrimp that shows when one's caught
function heldNet(c){
  if (c.net) return c.net;
  const g = new THREE.Group(); g.position.set(0, -0.45, 0); c.arms[1].add(g);
  chibiPart(g, geo('netPole', () => new THREE.CylinderGeometry(0.04, 0.05, 2.0, 6)), 0x8a5a2a, 0, -0.85, 0);
  const hoop = new THREE.Group(); hoop.position.set(0, -1.95, 0); g.add(hoop);
  chibiPart(hoop, geo('netHoop', () => new THREE.TorusGeometry(0.42, 0.035, 6, 20)), 0x6a4a2a, 0, 0, 0).rotation.x = Math.PI / 2;
  const bag = new THREE.Mesh(geo('netBag', () => new THREE.ConeGeometry(0.42, 0.6, 14, 1, true)), heldNet.mat || (heldNet.mat = new THREE.MeshStandardMaterial({ color: 0xd8ccaa, transparent: true, opacity: 0.6, side: THREE.DoubleSide })));
  bag.rotation.x = Math.PI; bag.position.y = -0.3; hoop.add(bag);
  const shrimp = chibiPart(hoop, geo('netShrimp', () => new THREE.CapsuleGeometry(0.06, 0.16, 4, 8)), 0xf08a6a, 0, -0.35, 0); shrimp.rotation.z = 1.2;
  c.net = { g, hoop, shrimp }; return c.net;
}
// scooping with the net, once a try (k: 0 to 1): reach out and dip it under the surface, sweep it through, lift it out, a little shake
function netPose(sp, k, caught){
  const c = sp.userData.chibi; poseChibi(sp, 'idle', 0); const N = heldNet(c); N.g.visible = true;
  for (const a of c.arms) a.children.forEach(o => { if (o.userData.isGear) o.visible = false; });
  const [L, R] = c.legs, [AL, AR] = c.arms; let arm, crouch, sweep = 0, shake = 0;
  if (k < 0.25) { const e = ease(k / 0.25); arm = lerp(-1.25, -0.8, e); crouch = e; }
  else if (k < 0.65) { arm = -0.8; crouch = 1; sweep = Math.sin((k - 0.25) / 0.4 * Math.PI) * 0.35; }
  else if (k < 0.85) { const e = ease((k - 0.65) / 0.2); arm = lerp(-0.8, -1.35, e); crouch = 1 - e * 0.7; }
  else { const e = (k - 0.85) / 0.15; arm = -1.35 + Math.sin(e * Math.PI * 4) * 0.08; crouch = 0.3 * (1 - e); shake = Math.sin(e * Math.PI * 6) * 0.15; }
  c.body.position.y = -0.28 * crouch; c.body.rotation.x = 0.35 * crouch; c.body.rotation.y = sweep * 0.6; c.head.rotation.x = 0.25 * crouch; c.head.rotation.y = -sweep * 0.4;
  L.rotation.x = -0.9 * crouch; R.rotation.x = 0.45 * crouch;
  AR.rotation.set(arm, 0, -0.1); AL.rotation.set(arm + 0.05, 0, 0.15);   // both arms out on the pole, clear of the chest
  const tip = 0.75 * Math.min(1, crouch + 0.3); N.g.rotation.set(-tip, 0, shake);   // the pole tipped out past the hands, over the water
  N.hoop.rotation.x = -arm + tip - Math.PI / 2 + 0.2;   // the hoop kept roughly level, mouth up
  N.shrimp.visible = !!caught && k > 0.7;
}
const TWO_HAND = { ry: 0, rz: 0.1, lx: -0.1, ly: -0.4, lz: -0.1 };   /* measured with armour on: both arms out in front, clear of the chest; the left hand just under the rod (chibi arms can't quite meet on it) */
function fishPose(sp, t, castK, twoHands = false){   /* castK: where a cast is (0 to 1, or 0 for none), for players' own timing; villagers cast every nine seconds */
  const c = sp.userData.chibi, R = fishRod(c); R.g.visible = true; poseChibi(sp, 'idle', t);
  for (const a of c.arms) a.children.forEach(o => { if (o.userData.isGear) o.visible = false; });   // sword and shield put away, both hands on the job
  const k = (t % 9) / 9, cast = castK !== undefined ? castK : k > 0.9 ? (k - 0.9) / 0.1 : 0;   // draw the rod back over the shoulder and flick it out again
  c.arms[1].rotation.set(cast ? -1.1 - Math.sin(cast * Math.PI) * 1.3 : -1.1 + Math.sin(t * 1.3) * 0.04, 0, 0.12);
  if (!R.base) R.base = R.g.quaternion.clone(); R.g.quaternion.copy(R.base);
  if (twoHands) {   // players: both hands on the rod, brought in to the middle of the body, with the rod still pointing out over the water
    sp.updateMatrixWorld(true); const want = R.g.getWorldQuaternion(new THREE.Quaternion()), ax = c.arms[1].rotation.x;
    c.arms[1].rotation.set(ax, TWO_HAND.ry, TWO_HAND.rz); c.arms[0].rotation.set(ax + TWO_HAND.lx, TWO_HAND.ly, TWO_HAND.lz);
    c.arms[1].updateMatrixWorld(true); R.g.quaternion.copy(c.arms[1].getWorldQuaternion(new THREE.Quaternion()).invert().multiply(want));
  }
  else c.arms[0].rotation.set(-0.7, 0, -0.25);   // the other hand steadies the line
  sp.updateMatrixWorld(true);
  R.line.getWorldQuaternion(rodQ); R.line.quaternion.multiply(rodQ.invert());   // the line hangs straight down whatever the rod does
  R.line.getWorldPosition(rodV); const s = R.line.getWorldScale(new THREE.Vector3()).y, drop = Math.max(0.3, rodV.y - WATER_Y + Math.sin(t * 2) * 0.03) / s;
  R.thread.scale.y = cast ? drop * 0.3 : drop; R.bob.position.y = -(cast ? drop * 0.3 : drop);
}
function updateVillager(w, talker, dt){
  const sp = w.sp, c = sp.userData.chibi, now = performance.now(), t = now / 1000;
  if (sp.parent !== scene) {   // first time: lift them out of their house's group, into the world, so they can walk out of the door
    const p = sp.getWorldPosition(new THREE.Vector3()); sp.removeFromParent(); scene.add(sp); sp.position.set(p.x, 0, p.z); sp.scale.setScalar(CHIBI_SCALE);
    w.k = 1; w.ox = 0; w.oz = 0; w.parentYaw = 0; w.home = [p.x, p.z]; w.house = houses.find(h => Math.abs(p.x - h.x) < h.hw && Math.abs(p.z - h.z) < h.hd) || null; }
  const st = villagerState(w, hourNow()), asleep = st.mode === 'sleep';
  let [tx, tz] = st.at; const bed = asleep && w.house && w.house.bed; if (bed) { tx = bed.x; tz = bed.z; }
  // undo last frame's lying or sitting offsets before measuring where they are
  sp.rotation.x = 0; sp.position.y = 0; if (w.lieDz) { sp.position.z -= w.lieDz; w.lieDz = 0; } if (w.seatAt) { sp.position.x = w.seatAt[0]; sp.position.z = w.seatAt[1]; w.seatAt = null; }
  const dx = tx - sp.position.x, dz = tz - sp.position.z, d = Math.hypot(dx, dz); let moving = false;
  if (!(talker && !asleep) && d > 0.1) { if (d > 40) sp.position.set(tx, 0, tz); else { const step = Math.min(d, (st.mode === 'walk' ? GUARD_SPEED * 1.15 : d > 2 ? 3 : GUARD_SPEED) * dt); sp.position.x += dx / d * step; sp.position.z += dz / d * step; moving = step > 0.2 * dt; w.dx = dx; w.dz = dz; w.tick += dt * 60; } }
  for (const h of houses) if (h.doorRec && !h.doorRec.open && Math.hypot(h.doorRec.x - sp.position.x, h.doorRec.z - sp.position.z) < 2.2) openDoorQuiet(h.doorRec);   // let themselves out (and in)
  const here = d < 0.3, rod = c.rod; if (rod) rod.g.visible = false;
  w.rec.asleep = asleep && here; const seatSt = st.stop && st.stop.seat; w.rec.sitting = st.mode === 'sit' && here; w.rec.chatAt = 'bonfire';
  if (seatSt) { if (here) VSEAT_TAKEN.add(seatSt.idx); else VSEAT_TAKEN.delete(seatSt.idx); } else VSEAT_TAKEN.delete(BF.seats[VILLAGER_DAY[w.rec.name].seat].idx);
  if (w.zzz) w.zzz.visible = false;
  if (moving || !here) { if (moving) w.yaw = Math.atan2(w.dx, w.dz); turnChibi(sp, w.yaw || 0); poseChibi(sp, moving ? 'walk' : 'idle', w.tick / 90); }
  else if (talker && !asleep) { turnChibi(sp, yawTo(sp.position.x, sp.position.z, talker.x, talker.z)); poseChibi(sp, 'idle', t); }
  else if (st.mode === 'sit') { w.seatAt = [sp.position.x, sp.position.z]; sitPoseAt(sp, seatSt, t, w.rec.name.length, false); }
  else if (st.mode === 'chop') { turnChibi(sp, st.stop.yaw); poseChibi(sp, 'swing', (t / 0.75) % 1, 'axe'); }
  else if (st.mode === 'fish') { turnChibi(sp, st.stop.yaw); fishPose(sp, t); }
  else if (asleep) {   // in bed, or for Dunmore (the smithy has no bed) nodding off sat by the forge
    poseChibi(sp, 'idle', 0); c.eyes.forEach((e, i) => { if (i % 2 === 0) e.scale.y = 0.15; else e.visible = false; });
    if (bed) { sp.rotation.set(-Math.PI / 2 + 0.3, 0, 0);   /* propped up on the pillow: the big head would otherwise hold the legs in the air */ sp.position.y = w.house.bedTop + 1.28 + (w.lieFix || 0); w.lieDz = 1.6 * w.house.k / 1.3; sp.position.z += w.lieDz;
      if (w.lieFix === undefined) { sp.updateMatrixWorld(true); const bx = new THREE.Box3(), tmp = new THREE.Box3(); sp.traverseVisible(o => { if (o.isMesh) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bx.union(tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });   /* visible parts only: their hidden tools hang lower */
        w.lieFix = w.house.bedTop - bx.min.y - 0.05; sp.position.y += w.lieFix; }   /* resting on the blanket */ }   // measured once, so they lie right on the mattress
    else { c.legs.forEach(l => l.rotation.x = -1.45); c.head.rotation.x = 0.35; }
    if (!w.zzz) { w.zzz = new THREE.Sprite(zzzMat().clone()); w.zzz.scale.set(0.9, 0.9, 1); scene.add(w.zzz); }
    const k = (t / 2.4 + w.rec.name.length * 0.3) % 1; w.zzz.visible = true; w.zzz.position.set(tx + 0.3, (bed ? w.house.bedTop + 2.6 : 3.6) + k * 1.2, tz - (bed ? 1.4 : 0) - k * 0.3); w.zzz.material.opacity = Math.sin(k * Math.PI); }
  else { turnChibi(sp, st.stop && st.stop.yaw !== undefined ? st.stop.yaw : (hero && Math.hypot(hero.position.x - sp.position.x, hero.position.z - sp.position.z) < 7 ? yawTo(sp.position.x, sp.position.z, hero.position.x, hero.position.z) : sp.rotation.y)); poseChibi(sp, 'idle', t); }
  w.rec.x = w.seatAt ? w.seatAt[0] : sp.position.x; w.rec.z = w.seatAt ? w.seatAt[1] : sp.position.z - (w.lieDz || 0);
}
function updateWanderers(){
  const nowW = performance.now(), dtW = Math.min(0.25, (nowW - (updateWanderers.last || nowW)) / 1000); updateWanderers.last = nowW;
  for (const w of WANDER) {
    const sp = w.sp, x = sp.position.x, z = sp.position.z;
    if (VILLAGER_DAY[w.rec.name]) { updateVillager(w, talkerOf(w.rec), dtW); continue; }
    if (GUARD_NAMES.includes(w.rec.name) && w.k === 1) { const talker = talkerOf(w.rec), moving = updateGuard(w, talker, dtW);
      const wx = sp.position.x, wz = sp.position.z;
      if (w.lying) w.yaw = 0; else if (w.sitting) w.yaw = Math.atan2(guardRoutes(w).faceX, 0); else if (talker) w.yaw = yawTo(wx, wz, talker.x, talker.z); else if (moving) w.yaw = Math.atan2(w.dx, w.dz); else if (hero && Math.hypot(hero.position.x - wx, hero.position.z - wz) < 7) w.yaw = yawTo(wx, wz, hero.position.x, hero.position.z);
      if (w.lying) sp.rotation.y = 0; else turnChibi(sp, w.yaw || 0);
      poseChibi(sp, moving ? 'walk' : 'idle', w.tick / 90);
      if (w.lying) sp.userData.chibi.eyes.forEach((e, i) => { if (i % 2 === 0) e.scale.y = 0.15; else e.visible = false; });   // eyes shut, as in a blink
      if (w.sitting) { const c2 = sp.userData.chibi; c2.legs.forEach(l => l.rotation.x = -1.45); c2.body.position.y = 0.02; c2.arms.forEach(a => a.rotation.x = -0.6); }   // sat at the table, as Wenna sits on her bench
      w.rec.x = wx; w.rec.z = w.lying ? wz - GUARD_LIE.dz : wz; continue; }   /* (while lying, the figure is shifted towards the foot of the bunk) */
    let moving = false;
    const talker = talkerOf(w.rec);   // someone is talking to them: stand still and face whoever spoke to them last
    if (talker) w.pause = Math.max(w.pause, 40);
    if (w.pause > 0) w.pause--;
    else {
      const dx = w.tx - x, dz = w.tz - z, dist = Math.hypot(dx, dz);
      if (dist < 0.03) { pickWanderTarget(w); w.pause = 150 + Math.random() * 240; }   // arrived: rest, then pick somewhere else
      else {
        const step = Math.min(dist, 0.02), nx = x + dx / dist * step, nz = z + dz / dist * step;
        if (npcHit(w.ox + nx * w.k, w.oz + nz * w.k) && !npcHit(w.ox + x * w.k, w.oz + z * w.k)) { w.tx = x; w.tz = z; w.pause = 20; }   // something in the way: stop and pick elsewhere (but someone already wedged in can step out)
        else { sp.position.set(nx, 0, nz); moving = true; w.dx = dx; w.dz = dz; w.tick++; }
      }
    }
    // face the way they walk; standing, they turn to look at the hero when the hero comes close
    const wx = w.ox + sp.position.x * w.k, wz = w.oz + sp.position.z * w.k;
    if (talker) w.yaw = yawTo(wx, wz, talker.x, talker.z) - (w.parentYaw || 0);
    else if (moving) w.yaw = Math.atan2(w.dx, w.dz);
    else if (hero && Math.hypot(hero.position.x - wx, hero.position.z - wz) < 7) w.yaw = yawTo(wx, wz, hero.position.x, hero.position.z) - (w.parentYaw || 0);
    turnChibi(sp, w.yaw || 0);
    poseChibi(sp, moving ? 'walk' : 'idle', w.tick / 90);
    if (w.rec.after) w.rec.after(sp, moving, w.tick);
    if (w.rec.name === 'Wenna') { const c2 = sp.userData.chibi; c2.legs.forEach(l => l.rotation.x = -1.45); c2.body.position.y = 0.02; c2.body.rotation.x = -0.05; c2.arms.forEach(a => a.rotation.x = -0.5); sp.rotation.y = 0;
      if (talker) c2.head.rotation.y = Math.max(-1, Math.min(1, Math.atan2(Math.sin(yawTo(wx, wz, talker.x, talker.z)), Math.cos(yawTo(wx, wz, talker.x, talker.z))))); }   // seated, she turns her head
    w.rec.x = w.ox + sp.position.x * w.k; w.rec.z = w.oz + sp.position.z * w.k;
  }
}
function addNpc(g, h, lx, lz, npc, keep = null){   /* keep: a box (in the house's own units) they stay inside, for shopkeepers behind a counter */
  const frames = null;
  const sp = makeChibi({ ...npc.look, pants: npc.look.pants || 0x3a3a3a });
  sp.scale.setScalar(CHIBI_SCALE / h.k);   // the house group is scaled up, so the villager is scaled back to its normal size
  sp.position.set(lx, 0, lz);
  g.add(sp);
  const p = h.toWorld(lx, lz);
  const rec = { kind: 'npc', name: npc.name, title: npc.title, look: npc.look, hat: npc.hat, talks: npc.talks, barks: npc.barks, lines: npc.lines || [], choice: npc.choice, x: p.x, z: p.z, s: 0.7, state: 'standing' };
  BARKERS.push({ sp, rec });
  Object.assign(sp.userData, { action: 'Talk', name: npc.name, rec });
  trees.push(sp);
  const hwL = h.hw / h.k, hdL = h.hd / h.k;   // the inside of the house, in its own units
  addWander(sp, rec, frames, { parentYaw: g.rotation.y, lx, lz, rad: keep ? 1.2 : 1.6, box: keep || { x0: -hwL + 0.9, x1: hwL - 0.9, z0: -hdL + 0.9, z1: hdL - 0.9 }, k: h.k, ox: h.x, oz: h.z });
}
const MARA = { name: 'Mara', title: 'the trader', look: { gender: 'female', skin: 0xf0c8a0, hair: 'long', hairCol: 0xa03a1e, shirt: 0x7a3a6a, pants: 0x3a2a3a },
    talks: [
      ["Welcome to my little store, traveller! Mind the step, it catches everyone.", "I'm Mara. Axes, pickaxes, hammers... if it helps you work, I sell it. Fishing gear's Jory's line, down by the pond.", "My prices are fair. Well, mostly fair. Fair enough, anyway."],
      ["Back again? Business must be good. Or bad. Either way, you'll be needing tools."],
      ["Pip keeps touching my pickaxes. I keep a sweet in my pocket to bribe him off."],
      ["Dunmore buys his hammers from me, then tells everyone he made 'em himself."] ],
    barks: ["Axes, pickaxes and hammers! Everything you need to get to work!", "Best prices in the village, and the only prices in the village!", "Need a tool? Come and have a look, no charge for looking."],
    choice: { question: 'Fancy a look at what I\'ve got?' } };
// Mara's general store: a cottage in the open ground south-west of the village, with a counter, shelves of tools, and a painted sign over the door
function furnishStore(g, h){
  g.userData.workshop = true;   // a shop, not a home: no bed or table
  const S = HOUSE_SIZE, f = new THREE.Group(); f.scale.setScalar(S); g.add(f);
  const wood = texMat(woodTex(), 1, 1, 0xb08a58), dark = mat(0x5a3a20);
  const put = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; f.add(o); return o; };
  // the counter, across the room, with Mara behind it
  put(new THREE.BoxGeometry(2.6, 0.5, 0.5), wood, 0, 0.25, -0.35); put(new THREE.BoxGeometry(2.8, 0.06, 0.62), dark, 0, 0.52, -0.35);
  const W = S * h.k;   // furniture units to world: S, then the house's own scale
  const ux = (h.toWorld(1, 0).x - h.x) / h.k, uz = (h.toWorld(1, 0).z - h.z) / h.k;   // which way the house is turned
  const solid = (lx, lz, hx, hz) => { const p = h.toWorld(lx * S, lz * S), ax = (Math.abs(ux) * hx + Math.abs(uz) * hz) * W, az = (Math.abs(uz) * hx + Math.abs(ux) * hz) * W; solidBoxes.push({ x0: p.x - ax, x1: p.x + ax, z0: p.z - az, z1: p.z + az }); };
  solid(0, -0.35, 1.35, 0.3);
  put(new THREE.BoxGeometry(0.22, 0.14, 0.16), mat(0xd8b040), -0.8, 0.62, -0.35);   // a little coin tray
  // shelves on the back wall, stocked with what she sells
  for (const y of [0.45, 0.95, 1.45]) put(new THREE.BoxGeometry(3.4, 0.06, 0.4), dark, 0, y, -1.75);
  solid(0, -1.75, 1.75, 0.22);   // the shelves
  for (const x of [-1.7, 0, 1.7]) put(new THREE.BoxGeometry(0.08, 1.7, 0.42), dark, x, 0.85, -1.75);
  const stock = (kind, x, y) => { const t = makeTool(kind); t.scale.setScalar(0.42); t.rotation.set(0, 0, Math.PI / 2 + 0.2); t.position.set(x, y + 0.2, -1.72); f.add(t); };
  for (const [k, x] of [['axe', -1.3], ['axe', -0.9], ['pick', -0.4], ['pick', 0.4]]) stock(k, x, 0.95);
  for (let i = 0; i < 3; i++) { put(new THREE.BoxGeometry(0.12, 0.45, 0.12), mat(0x7a4d22), 0.9 + i * 0.3, 1.75, -1.72); put(new THREE.BoxGeometry(0.28, 0.12, 0.14), mat(0x8a9099), 0.9 + i * 0.3, 1.98, -1.72); }   // hammers
  for (let i = 0; i < 2; i++) { const net = put(new THREE.TorusGeometry(0.16, 0.025, 5, 12), mat(0xc8b48a), -1.2 + i * 0.5, 0.65, -1.7); net.rotation.y = 0.3; }   // nets
  for (const [x, c] of [[-0.6, 0xc2652b], [-0.2, 0xb8c4cc], [0.3, 0x8a5a2b]]) put(new THREE.BoxGeometry(0.3, 0.26, 0.3), mat(c), x, 0.62, -1.72);   // boxes of goods
  // barrels and a crate by the door
  for (const [x, z] of [[-1.7, 1.2], [1.75, 1.3]]) { put(new THREE.CylinderGeometry(0.28, 0.24, 0.6, 10), mat(0x8a5a2a), x, 0.3, z); solid(x, z, 0.28, 0.28); }
  put(new THREE.BoxGeometry(0.5, 0.5, 0.5), wood, 1.7, 0.25, 0.4).rotation.y = 0.3; solid(1.7, 0.4, 0.32, 0.32);   // the crate
  // the sign over the door, painted on both sides
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const c = cv.getContext('2d');
  c.fillStyle = '#5a3a20'; c.fillRect(0, 0, 512, 160); c.fillStyle = '#7a5530'; c.fillRect(10, 10, 492, 140);
  c.strokeStyle = '#e2b84c'; c.lineWidth = 6; c.strokeRect(18, 18, 476, 124);
  c.fillStyle = '#f3d27a'; c.font = 'bold 58px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('General Store', 256, 84);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.53, 0.06), new THREE.MeshStandardMaterial({ map: tex }));   // one material, so it folds away with the walls
  sign.scale.setScalar(S); sign.position.set(0, 2.55 * S, (h.hd / W + 0.12) * S); sign.castShadow = true; g.add(sign);   // on the wall itself, so it folds away with the walls when you go in
  sign.userData.deco = true;
  addNpc(g, h, 0, -1.1 * S, MARA, { x0: -1.2 * S, x1: 1.2 * S, z0: -1.3 * S, z1: -0.95 * S });   /* behind the counter, clear of it and of the shelves */
}
// the smithy's furnace and anvil, inside its walls
function furnishSmithy(g, h){
  g.userData.workshop = true;   // a workshop, not a home: no bed or table
  const S = HOUSE_SIZE;
  const f = new THREE.Group(); f.scale.setScalar(S); g.add(f);   // the furnishings are drawn at the house's own units, then scaled
  const fx = -1.6, fz = -1.8, ax = 1.4, az = -0.4;
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.0), texMat(wallStone, 1, 1, 0xa0a0a0)); body.position.set(fx, 0.8, fz); f.add(body);
  const fire = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.05), fireMat); fire.position.set(fx, 0.6, fz + 0.52); f.add(fire);
  const fp = h.toWorld(fx * S, fz * S);
  body.userData = { action: 'Smelt', name: 'Furnace', rec: { kind: 'furnace', x: fp.x, z: fp.z, s: 1, state: 'standing' } };
  trees.push(body);
  solidBoxes.push({ x0: fp.x - 1, x1: fp.x + 1, z0: fp.z - 1, z1: fp.z + 1 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), ironDark); base.position.set(ax, 0.2, az); f.add(base);
  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.4), ironDark); waist.position.set(ax, 0.5, az); f.add(waist);
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.5), steelTop); face.position.set(ax, 0.7, az); f.add(face);
  const apt = h.toWorld(ax * S, az * S);
  base.userData = { action: 'Smith', name: 'Anvil', rec: { kind: 'anvil', x: apt.x, z: apt.z, s: 1, state: 'standing' } };
  trees.push(base);
  { const hit = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.set(ax, 0.7, az); f.add(hit);
    hit.userData = base.userData; trees.push(hit); }   // a bigger, invisible box round the anvil, so it's easy to click
  solidBoxes.push({ x0: apt.x - 1, x1: apt.x + 1, z0: apt.z - 1, z1: apt.z + 1 });
  addNpc(g, h, 0.6 * S, 1.0 * S, VILLAGERS[3]);
}
// a villager who stands out in the open, with a choice at the end of her talk
function addWorldNpc(x, z, npc){
  const frames = null;
  const sp = makeChibi(npc.look);
  sp.position.set(x, 0, z);
  scene.add(sp);
  const rec = { kind: 'npc', asks: npc.asks, name: npc.name, level: npc.level, title: npc.title, look: npc.look, hat: npc.hat, gear: npc.gear, talks: npc.talks, barks: npc.barks, lines: npc.lines || [], choice: npc.choice, shop: npc.shop, after: npc.after, x, z, s: npc.s || 0.7, talkAt: npc.talkAt, state: 'standing' };
  BARKERS.push({ sp, rec });
  Object.assign(sp.userData, { action: 'Talk', name: npc.level ? `${npc.name} (level ${npc.level})` : npc.name, rec });
  trees.push(sp);
  const rad = npc.rad !== undefined ? npc.rad : 2.5;
  addWander(sp, rec, frames, { lx: x, lz: z, rad, box: { x0: x - rad, x1: x + rad, z0: z - rad, z1: z + rad }, k: 1, ox: 0, oz: 0 });
  if (npc.child) sp.scale.setScalar(CHIBI_SCALE * 0.72);
  if (npc.hat) wearHat(sp, npc.hat);
  if (npc.seaDog) seaDogFace(sp, npc.look.skin);
  if (npc.gear) dressChibi(sp, npc.gear);
  NPC_SPOTS.push([x, z]);
  return sp;
}
// keep a prop off the paths: if it is within `clear` of any path's centre line, push it straight out to the side
const PROPS_MOVED = [];
function offPath(x, z, clear){
  const ox = x, oz = z;
  for (let i = 0; i < 60; i++) {
    let best = 1e9, px = 0, pz = 0;
    for (const [x1, z1, x2, z2] of ROADS) {
      const dx = x2 - x1, dz = z2 - z1, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / L));
      const cx = x1 + t * dx, cz = z1 + t * dz, d = Math.hypot(x - cx, z - cz);
      if (d < best) { best = d; px = cx; pz = cz; }
    }
    if (best >= clear) break;
    const ax = x - px, az = z - pz, L = Math.hypot(ax, az) || 1;
    x += ax / L * 0.25 || 0.25; z += az / L * 0.25;
  }
  if (x !== ox || z !== oz) PROPS_MOVED.push([ox, oz, +x.toFixed(2), +z.toFixed(2)]);
  return [x, z];
}
// hats for the townsfolk
function wearHat(fig, kind){
  const h = fig.userData.chibi.head;
  if (kind === 'straw') { chibiPart(h, new THREE.CylinderGeometry(0.98, 1.02, 0.06, 24), 0xe0c470, 0, 0.42, -0.02); chibiPart(h, new THREE.CylinderGeometry(0.48, 0.56, 0.4, 20), 0xe0c470, 0, 0.62, -0.02); chibiPart(h, new THREE.CylinderGeometry(0.565, 0.565, 0.1, 20), 0xa84434, 0, 0.48, -0.02, false); }
  if (kind === 'helm') { chibiPart(h, new THREE.SphereGeometry(0.7, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), 0x9aa0a8, 0, 0.06, -0.02).rotation.x = -0.3; chibiPart(h, new THREE.CylinderGeometry(0.72, 0.72, 0.12, 20), 0x6a7078, 0, 0.12, 0, false); }
  if (kind === 'souwester') {   // a fisherman's yellow oilskin hat, its brim longer at the back to keep the rain off his neck
    chibiPart(h, new THREE.SphereGeometry(0.7, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), 0xe8c030, 0, 0.08, -0.02).rotation.x = -0.25;
    const brim = chibiPart(h, new THREE.CylinderGeometry(0.95, 1.0, 0.05, 24), 0xe8c030, 0, 0.16, -0.18); brim.rotation.x = -0.32; brim.scale.set(1, 1, 1.15); }
  if (kind === 'hood') { const hd = chibiPart(h, new THREE.SphereGeometry(0.74, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), 0x3a5a2a, 0, 0.02, -0.06); hd.rotation.x = -0.55; chibiPart(h, new THREE.ConeGeometry(0.2, 0.5, 8), 0x3a5a2a, 0, 0.3, -0.7, false).rotation.x = -1.8; }
}
// an old sailor's face: a big soft beard in puffs along the jaw, sideburns, a curled moustache that runs down into the beard,
// ears tucked back behind the sideburns, and a button nose (only Jory has these)
function seaDogFace(fig, skin){
  const h = fig.userData.chibi.head, W = 0xeeeeea;
  const puff = (r, x, y, z, sx = 1, sy = 1, sz = 1) => chibiPart(h, gRound(r, 14), W, x, y, z).scale.set(sx, sy, sz);
  for (let i = -3; i <= 3; i++) { const a = i * 0.36; puff(0.2 + 0.05 * (3 - Math.abs(i)), Math.sin(a) * 0.56, -0.36 - 0.14 * Math.cos(a) * (1 - Math.abs(i) / 4), Math.cos(a) * 0.4); }
  puff(0.26, 0, -0.62, 0.34, 1.2, 1, 0.8);
  for (const sd of [-1, 1]) {
    const t = chibiPart(h, gRound(0.13, 14), W, sd * 0.12, -0.06, 0.6); t.scale.set(1.25, 0.55, 0.6); t.rotation.z = sd * -0.35;   // the moustache
    const d = chibiPart(h, gRound(0.09, 12), W, sd * 0.3, -0.16, 0.53); d.scale.set(0.85, 1.5, 0.7); d.rotation.z = sd * 0.25;      // its ends, down into the beard
    puff(0.15, sd * 0.6, -0.02, 0.1, 0.55, 1.3, 0.95); puff(0.15, sd * 0.6, -0.2, 0.16, 0.6, 1.1, 1);                                  // sideburns
    const ear = chibiPart(h, gRound(0.16, 12), skin, sd * 0.6, -0.04, -0.2); ear.scale.set(0.38, 0.9, 0.75); ear.rotation.y = sd * -0.35;
    const inner = chibiPart(h, gRound(0.09, 10), 0xc88a70, sd * 0.645, -0.04, -0.19, false); inner.scale.set(0.25, 0.9, 0.65); inner.rotation.y = sd * -0.35;
  }
  chibiPart(h, gRound(0.1, 12), 0xe0a080, 0, 0, 0.63).scale.set(1.1, 0.9, 0.8);
}
