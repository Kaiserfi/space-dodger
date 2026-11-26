// ===== items on the ground, as in RuneScape: a monster's drop, something dropped from the bag, or a reward that didn't fit.
// Only you see yours for the first minute, then everyone up top does. Monster drops go after two minutes, everything else after three.
// Shared through adventure/live/ground/<key>; down the cellar they stay yours alone.
const GROUND = [], GROUND_MS = 180000, GROUND_MOB_MS = 120000, GROUND_PRIV = 60000;
let groundK = 0;
const groundUrl = key => `${DB}/adventure/live/ground/${key}.json`;
function groundShare(gi){
  if (!ONLINE.id || inDelveZone(gi.x, gi.z) || inCaveZone(gi.x, gi.z)) return;
  fetch(groundUrl(gi.key), { method: 'PUT', body: JSON.stringify({ n: gi.name, q: gi.qty, x: +gi.x.toFixed(2), z: +gi.z.toFixed(2), by: gi.by, pub: gi.pub, until: gi.until }) })
    .then(res => { if (res.ok) gi.shared = true; }).catch(() => {});
}
function groundModel(name){
  const g = new THREE.Group(), P = (geo, col, x, y, z, outline = true) => chibiPart(g, geo, col, x, y, z, outline);
  const meat = (col, seared) => {   /* a plain steak: just the meat, seared or raw, no fat or bone */
    const m = P(new THREE.CylinderGeometry(0.34, 0.36, 0.12, 16), col, 0, 0.07, 0); m.scale.set(1.2, 1, 0.8);
    if (seared) for (const k of [-0.15, 0, 0.15]) P(new THREE.BoxGeometry(0.42, 0.01, 0.04), 0x3a1a0a, k * 0.5, 0.135, k, false).rotation.y = 0.7; };
  const roast = (col) => { const b = P(new THREE.SphereGeometry(0.3, 12, 9), col, 0, 0.2, 0); b.scale.set(1.15, 0.75, 0.9); for (const s of [-1, 1]) P(new THREE.SphereGeometry(0.12, 8, 6), col, s * 0.22, 0.12, 0.2).scale.set(0.8, 0.7, 1.3); };
  const sack = (col, tie) => { const b = P(new THREE.SphereGeometry(0.3, 12, 9), col, 0, 0.24, 0); b.scale.set(1, 0.9, 1); P(new THREE.CylinderGeometry(0.06, 0.12, 0.16, 8), col, 0, 0.5, 0); P(new THREE.TorusGeometry(0.08, 0.025, 5, 10).rotateX(Math.PI / 2), tie, 0, 0.47, 0, false); };
  if (name === 'Cooked beef') meat(0x7a3a1e, true); else if (name === 'Raw beef') meat(0xc04a44, false); else if (name === 'Burnt beef' || name === 'Burnt chicken') meat(0x2a1a12, false);
  else if (name === 'Cooked chicken') roast(0xb86a2a); else if (name === 'Raw chicken') roast(0xf0b8a8);
  else if (/trout|bream/i.test(name)) { const col = name === 'Raw trout' ? 0x9aae86 : name === 'Raw bream' ? 0xb8a86a : /^(Trout|Bream)$/.test(name) ? 0xc8823a : 0x2a1a12;   /* a fish lying on its side, with a tail */
    const b = P(new THREE.SphereGeometry(0.22, 12, 8), col, 0, 0.1, 0); b.scale.set(1.6, 0.55, 0.7); P(new THREE.ConeGeometry(0.14, 0.24, 6).rotateZ(Math.PI / 2), col, 0.44, 0.1, 0).scale.set(1, 0.4, 1); }
  else if (/shrimp/i.test(name)) { const col = name === 'Raw shrimp' ? 0xe8a090 : name === 'Shrimp' ? 0xf06a3a : 0x2a1a12; const sh = P(new THREE.TorusGeometry(0.2, 0.08, 6, 12, Math.PI * 1.3), col, 0, 0.1, 0); sh.rotation.x = Math.PI / 2; }
  else if (/bread|Bread|dough/i.test(name)) { const col = name === 'Bread dough' ? 0xf0e0c0 : name === 'Burnt bread' ? 0x3a2a1e : 0xc8843a; const l = P(new THREE.SphereGeometry(0.3, 12, 8), col, 0, 0.18, 0); l.scale.set(1.4, 0.7, 0.85); }
  else if (name === 'Logs' || name === 'Oak logs') { for (const [z, y] of [[-0.14, 0.12], [0.14, 0.12], [0, 0.32]]) P(new THREE.CylinderGeometry(0.12, 0.12, 0.75, 8).rotateZ(Math.PI / 2), name === 'Oak logs' ? 0x5e3c1c : 0x8a5a2a, 0, y, z); }
  else if (/ore$/.test(name)) { const r = P(new THREE.DodecahedronGeometry(0.24, 0), 0x6a645c, 0, 0.2, 0); for (let i = 0; i < 4; i++) P(new THREE.SphereGeometry(0.06, 5, 4), name.startsWith('Tin') ? 0xd8dce0 : 0xd8783a, Math.cos(i * 1.6) * 0.18, 0.22 + (i % 2) * 0.08, Math.sin(i * 1.6) * 0.18, false); }
  else if (/bar$/.test(name)) P(new THREE.BoxGeometry(0.5, 0.14, 0.24), 0xc88a3a, 0, 0.07, 0);
  else if (name === 'Wheat') { for (let i = 0; i < 5; i++) { const st = P(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 4).rotateZ(Math.PI / 2), 0xd8b050, 0, 0.06 + (i % 2) * 0.05, -0.12 + i * 0.06, false); st.rotation.y = (i - 2) * 0.08; } P(new THREE.TorusGeometry(0.09, 0.025, 4, 8).rotateY(Math.PI / 2), 0x8a6a30, 0, 0.1, 0, false); }
  else if (name === 'Feathers') { for (let i = 0; i < 3; i++) { const f = P(new THREE.SphereGeometry(0.16, 8, 5), 0xf6f2ea, (i - 1) * 0.14, 0.04, (i % 2) * 0.1, false); f.scale.set(0.4, 0.12, 1.3); f.rotation.y = (i - 1) * 0.5; } }
  else if (name === 'Aloe leaf') { for (const a of [-0.5, 0, 0.5]) { const l = P(new THREE.ConeGeometry(0.08, 0.6, 4).rotateZ(Math.PI / 2), 0x6aa080, 0, 0.06, 0); l.rotation.y = a; l.scale.z = 0.5; } }
  else if (name === 'Mulberry leaves') { for (const a of [-0.6, 0.1, 0.8]) { const l = P(new THREE.SphereGeometry(0.2, 8, 5), 0x5a9a3a, Math.cos(a) * 0.12, 0.03, Math.sin(a) * 0.12, false); l.scale.set(1, 0.12, 0.75); l.rotation.y = a; } }
  else if (name === 'Silk cocoon') { for (const x of [-0.12, 0.12]) P(new THREE.SphereGeometry(0.12, 8, 6), 0xf6f2e6, x, 0.1, 0).scale.set(0.75, 0.75, 1.3); }
  else if (name === 'Silk thread') { P(new THREE.CylinderGeometry(0.14, 0.14, 0.26, 10).rotateZ(Math.PI / 2), 0xf8f2e6, 0, 0.14, 0); for (const x of [-0.16, 0.16]) P(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 10).rotateZ(Math.PI / 2), 0xa07848, x, 0.14, 0); }
  else if (name === 'Fishing rod') { P(new THREE.CylinderGeometry(0.025, 0.04, 1.4, 6).rotateZ(Math.PI / 2), 0x7a4d22, 0, 0.05, 0); P(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10).rotateX(Math.PI / 2), 0x5a5a60, -0.45, 0.08, 0.05); }
  else if (name === 'Bandage') { P(new THREE.TorusGeometry(0.16, 0.08, 6, 12).rotateX(Math.PI / 2), 0xf4eee0, 0, 0.08, 0); }
  else if (/seeds/.test(name)) sack(name.startsWith('Aloe') ? 0xa8c8a0 : name.startsWith('Mulberry') ? 0xc8a8c0 : 0xc8a870, 0x6a5030);
  else if (name === 'Flour') sack(0xece4d0, 0x8a7a5a);
  else if (name === 'Coins') { for (const [x, z, y] of [[0, 0, 0], [0.16, 0.1, 0], [-0.14, 0.12, 0], [0.02, 0.04, 0.06]]) P(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 12), 0xf0c040, x, 0.03 + y, z); }
  else sack(0x9a7448, 0x4a3018);   // anything else: wrapped in a cloth bundle
  return g;
}
let groundGlow = null;
function dropToGround(name, qty, x, z, quiet, mob){
  if (!qty) return;
  const near = GROUND.find(gi => gi.name === name && gi.by === ONLINE.id && SNOW() < gi.pub && Math.hypot(gi.x - x, gi.z - z) < 0.8);
  if (near) { near.qty += qty; near.until = Math.max(near.until, SNOW() + (mob ? GROUND_MOB_MS : GROUND_MS)); groundShare(near); return; }   // onto your own pile
  const now = SNOW();
  return groundMake({ key: 'g' + String(ONLINE.id || 'x').slice(-6) + Math.floor(now).toString(36) + (groundK++).toString(36),   /* whole milliseconds: the server clock can carry a half, and a dot in a key is refused */ name, qty, x, z, by: ONLINE.id, pub: now + GROUND_PRIV, until: now + (mob ? GROUND_MOB_MS : GROUND_MS) }, quiet, true);
}
// builds a pile, yours (share it) or someone else's from the live feed
function groundMake(o, quiet, share){
  let { name, qty, x, z } = o;
  if (!groundGlow) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'), gr = c.createRadialGradient(32, 32, 4, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,230,150,.55)'); gr.addColorStop(0.6, 'rgba(255,210,120,.22)'); gr.addColorStop(1, 'rgba(255,210,120,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
    groundGlow = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }); }
  for (let k = 0; k < 8 && GROUND.some(o => Math.hypot(o.x - x, o.z - z) < 0.9); k++) { const a = k * 2.4; x += Math.cos(a) * 0.9; z += Math.sin(a) * 0.9; }   // beside, not on top of, other things lying there
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9).rotateX(-Math.PI / 2), groundGlow); ring.position.y = 0.05; g.add(ring);
  const m = groundModel(name); m.scale.setScalar(1.6); m.rotation.y = Math.random() * 6.28; g.add(m);
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.9, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.45; g.add(hit);   // easy to click
  const gi = { name, qty, x, z, g, m, key: o.key, by: o.by, pub: o.pub, until: o.until, shared: !share, born: performance.now(), shown: true };
  g.userData = { action: 'Take', name, rec: { kind: 'ground', state: 'standing', x, z, onClick: () => pickUp(gi) } }; trees.push(g);
  GROUND.push(gi); if (share) groundShare(gi);
  if (!groundSeen(gi)) groundShow(gi, false);
  if (!quiet) sfx((c, t, out) => nz(c, out, t, 0.12, 'lowpass', 500, 250, 0.8, 0.4, 0.004, 0.1));   // a soft thump on the grass
}
// someone else's pile shows only once it's public, and only up top
const groundSeen = gi => gi.by === ONLINE.id || (SNOW() >= gi.pub && !DELVE);
function groundShow(gi, on){ if (gi.shown === on) return; gi.shown = on; gi.g.visible = on; const i = trees.indexOf(gi.g); if (on && i < 0) trees.push(gi.g); if (!on && i >= 0) trees.splice(i, 1); if (on) gi.born = performance.now(); }
// the live feed: piles appear, change and go
function groundApply(key, d){
  const gi = GROUND.find(q => q.key === key);
  if (!d) { if (gi) removeGround(gi); return; }
  if (!d.n || !(d.q > 0) || !(d.until > SNOW())) return;
  if (gi) { if (gi.by !== ONLINE.id || gi.shared) { gi.qty = d.q; gi.pub = d.pub || 0; gi.until = d.until; } return; }
  groundMake({ key, name: String(d.n), qty: d.q, x: +d.x || 0, z: +d.z || 0, by: d.by, pub: d.pub || 0, until: d.until }, true, false);
}
function removeGround(gi){ scene.remove(gi.g); const i = trees.indexOf(gi.g); if (i >= 0) trees.splice(i, 1); const j = GROUND.indexOf(gi); if (j >= 0) GROUND.splice(j, 1); }
function pickUp(gi){
  if (!GROUND.includes(gi)) return;
  const gotIt = got => { sfx((c, t, out) => nz(c, out, t, 0.1, 'bandpass', 1800, 2600, 1.2, 0.3, 0.005, 0.08));
    showToast(gi.name === 'Coins' ? `You pick up ${got} coins.` : got > 1 ? `You pick up ${got} ${gi.name.toLowerCase()}.` : `You pick up the ${gi.name.toLowerCase()}.`); };
  const room = () => gi.name === 'Coins' ? gi.qty : SINGLE.has(gi.name) ? Math.max(0, Math.min(gi.qty, BAG_SIZE - bag.length)) : bag.some(i => i.name === gi.name) || bag.length < BAG_SIZE ? gi.qty : 0;   /* how much would fit */
  const take = () => {
    if (!GROUND.includes(gi) || gi.taking) return;
    const fit = room(); if (!fit) { showToast('Your bag is full.'); return; }
    if (!gi.shared) {   // only ever yours: no one else can have taken it
      addItem(gi.name, fit, ICON_FOR[gi.name] || ''); gi.qty -= fit; if (gi.qty <= 0) removeGround(gi); gotIt(fit); return; }
    // anyone might grab it: take it in the database first, and only if it's still as we saw it
    gi.taking = true; const url = groundUrl(gi.key), done = () => { gi.taking = false; };
    fetch(url, { headers: { 'X-Firebase-ETag': 'true' } }).then(async res => {
      const tag = res.headers.get('ETag'), d = await res.json();
      if (!d || !(d.q > 0)) { removeGround(gi); showToast('Too late, someone else picked that up.'); return done(); }
      const n = Math.min(fit, d.q), left = d.q - n;
      const w = await fetch(url, left > 0 ? { method: 'PUT', headers: { 'if-match': tag }, body: JSON.stringify({ ...d, q: left }) } : { method: 'DELETE', headers: { 'if-match': tag } });
      if (w.status === 412) { done(); return take(); }   // it changed under us: look again
      if (!w.ok) { showToast("You couldn't pick that up. Try again in a moment."); return done(); }
      addItem(gi.name, n, ICON_FOR[gi.name] || ''); gi.qty = left; if (left <= 0) removeGround(gi); gotIt(n); done();
    }).catch(() => { showToast("You couldn't pick that up. Try again in a moment."); done(); });
  };
  if (Math.hypot(hero.position.x - gi.x, hero.position.z - gi.z) < 1.8) { walkTarget = null; walkQueue = []; take(); return; }
  walkStart(new THREE.Vector3(gi.x, 0, gi.z), take);
}
function updateGround(){
  const now = SNOW(), t = performance.now() / 1000;
  for (let i = GROUND.length - 1; i >= 0; i--) { const gi = GROUND[i];
    if (now > gi.until) { if (gi.shared && (gi.by === ONLINE.id || now > gi.until + 5000)) fetch(groundUrl(gi.key), { method: 'DELETE' }).catch(() => {}); removeGround(gi); continue; }
    groundShow(gi, groundSeen(gi)); if (!gi.shown) continue;
    const k = Math.min(1, (performance.now() - gi.born) / 250); gi.m.position.y = 0.06 + Math.abs(Math.sin(t * 2 + i)) * 0.06 + (1 - k) * 0.8;   // drops in, then a gentle bob
    gi.m.rotation.y += 0.004; }
}
// drop something from the bag at your feet (just in front of you)
function dropItem(it, all){
  if (!it || !bag.includes(it)) return;
  if (FIGHT) { showToast("You can't do that in the middle of a fight!"); return; }
  if (CAVE_ITEMS.has(it.name)) { showToast("You'd better hang on to that."); return; }   /* the cave's things can't be dropped (and lost) */
  const name = it.name, n = all ? countOf(name) : SINGLE.has(name) ? 1 : it.qty;
  const a = heroAnim.yaw || 0, x = hero.position.x + Math.sin(a) * 1.1, z = hero.position.z + Math.cos(a) * 1.1;
  if (all) for (const b of bag.filter(b => b.name === name)) bag.splice(bag.indexOf(b), 1);
  else bag.splice(bag.indexOf(it), 1);
  renderBag(); dropToGround(name, n, x, z); saveNow(false);
}
function openDropMenu(it, x, y){
  const many = countOf(it.name) > 1;
  itemMenu.innerHTML = `<div class="imHead">${it.name}</div><button data-o="d">Drop</button>${many ? '<button data-o="a">Drop all</button>' : ''}<button data-o="x">Cancel</button>`;
  itemMenu.hidden = false; itemMenu.style.left = Math.min(innerWidth - 170, x) + 'px'; itemMenu.style.top = Math.min(innerHeight - itemMenu.offsetHeight - 8, y) + 'px';
  itemMenu.onclick = e => { const b = e.target.closest('button'); if (!b) return; itemMenu.hidden = true; if (b.dataset.o === 'd') dropItem(it, false); else if (b.dataset.o === 'a') dropItem(it, true); };
}
function openItemMenu(name, x, y){
  const opts = CRAFTS[name]; if (!opts) return false;
  itemMenu.innerHTML = `<div class="imHead">${name}</div>` + opts.map((o, i) => `<button data-o="${i}">${o.label}</button>`).join('') + '<button data-o="x">Cancel</button>';
  itemMenu.hidden = false;
  itemMenu.style.left = Math.min(innerWidth - 170, x) + 'px'; itemMenu.style.top = Math.min(innerHeight - itemMenu.offsetHeight - 8, y) + 'px';
  itemMenu.onclick = e => { const b = e.target.closest('button'); if (!b) return; itemMenu.hidden = true; if (b.dataset.o !== 'x') craftItem(opts[+b.dataset.o]); };
  return true;
}
addEventListener('pointerdown', e => { if (!itemMenu.hidden && !e.composedPath().includes(itemMenu) && !e.target.closest('#bagGrid')) itemMenu.hidden = true; });   /* by the click's path, so a menu redrawn under the pointer still counts as inside */
// the watering can in the bag: fill it at whatever water is close by, or hang it back on the toolbelt
function openCanMenu(it, x, y){
  itemMenu.innerHTML = `<div class="imHead">Watering can (${FARM_CAN.n}/${CAN_MAX})</div><button data-o="f">Fill</button><button data-o="b">Put on toolbelt</button><button data-o="x">Cancel</button>`;
  itemMenu.hidden = false;
  itemMenu.style.left = Math.min(innerWidth - 170, x) + 'px'; itemMenu.style.top = Math.min(innerHeight - itemMenu.offsetHeight - 8, y) + 'px';
  itemMenu.onclick = e => { const b = e.target.closest('button'); if (!b) return; itemMenu.hidden = true;
    if (b.dataset.o === 'f') fillCanNearby();
    if (b.dataset.o === 'b') { if (toolbelt.can) { showToast(`Your toolbelt already holds a ${toolbelt.can.toLowerCase()}.`); return; } if (!bag.includes(it)) return; toolbelt.can = it.name; removeItem(it.name, it); renderBag(); renderGear(); showToast('You hang the watering can on your toolbelt.'); saveNow(false); } };
}
const CAN_REACH = 6;   // how far off the water can be: a few steps
function nearestWater(){
  const hx = hero.position.x, hz = hero.position.z; let best = null;
  const take = (x, z) => { const d = Math.hypot(x - hx, z - hz); if (d <= CAN_REACH && (!best || d < best.d)) best = { x, z, d }; };
  if (typeof CAVE !== 'undefined' && CAVE) take(CV_AT.pool[0], CV_AT.pool[1]);   /* the cave's pool */
  else { take(65.8, -6.6);   /* the farm trough */
    for (let r = 0.5; r <= CAN_REACH; r += 0.5) for (let a = 0; a < 24; a++) { const x = hx + Math.cos(a / 24 * Math.PI * 2) * r, z = hz + Math.sin(a / 24 * Math.PI * 2) * r; if (waterSD(x, z) < -0.3) take(x, z); } }   /* the river, the stream, the pond, the north's stream and lake */
  return best;
}
function fillCanNearby(){
  if (FIGHT) { showToast("You can't do that in the middle of a fight!"); return; }
  if (!hasTool('Watering can')) return;
  if (FARM_CAN.n >= CAN_MAX) { showToast('Your watering can is already full.'); return; }
  const w = nearestWater(); if (!w) { showToast("There's no water close enough to fill it from."); return; }
  cancelChop();
  farmAct({ x: w.x, z: w.z }, 1500, 'fill', () => { FARM_CAN.n = CAN_MAX; renderBag(); renderGear(); renderBelt(); showToast(`You fill the watering can. (${CAN_MAX} waterings)`); }, 2.4);
}
function craftItem(o){
  if (o.fire) { startFire(o); return; }
  if (levelOf(SKILL_XP[o.skill]) < o.level) { showToast(`You need ${o.skill} ${o.level} to do that.`); return; }
  for (const n in o.needs) if (countOf(n) < o.needs[n]) { showToast(`You need ${o.needs[n]} ${n.toLowerCase()} to make a ${o.make.toLowerCase()}.`); return; }
  if (o.water && (!hasTool('Watering can') || FARM_CAN.n < o.water)) { showToast('You need some water for that. Fill a watering can at any water nearby.'); return; }
  if (FIGHT) { showToast("You can't do that in the middle of a fight!"); return; }
  for (const n in o.needs) for (let i = 0; i < o.needs[n]; i++) removeItem(n);
  if (!addItem(o.make, 1, ICON_FOR[o.make])) { for (const n in o.needs) addItem(n, o.needs[n], ICON_FOR[n]); showToast('Your bag is full.'); return; }
  if (o.water) { FARM_CAN.n -= o.water; renderBag(); }
  addXp(o.skill, o.xp);
  if (o.msg) { craftSound(); showToast(`${o.msg}  +${o.xp} ${o.skill} XP`); saveNow(false); return; }
  if (o.make === 'Bread dough') { showToast(`You mix the flour with a splash of water and knead it into dough.  +${o.xp} ${o.skill} XP`); saveNow(false); return; }
  sfx((c, t, out) => { nz(c, out, t, 0.35, 'bandpass', 1800, 900, 1, 0.35, 0.02, 0.3); nz(c, out, t + 0.25, 0.5, 'bandpass', 300, 1200, 0.8, 0.3, 0.15, 0.35); });   // a scrape of bark, then the rag catching
  showToast(`You bind some rags to the end of the log and light it. You make a torch.  +${o.xp} ${o.skill} XP`);
  saveNow(false);
}
