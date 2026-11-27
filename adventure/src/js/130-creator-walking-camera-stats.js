// ----- character creator: a panel that floats over the starting tile -----
const creator = document.getElementById('creator');
/* rows only for one build (outfits), and dress colours only while a dress is on */
const lookRowShown = o => (!o.only || look.gender === o.only) && (!o.dress || (look.outfit && look.outfit !== 'none'));
function renderCreator(){
  document.getElementById('crRows').innerHTML = LOOK.filter(lookRowShown).map(o => {
    const v = o.values.find(x => x.id === look[o.key]) || o.values[0];
    return `<div class="crRow"><button data-k="${o.key}" data-d="-1">‹</button><span>${o.label}: ${v.label}</span><button data-k="${o.key}" data-d="1">›</button></div>`;
  }).join('');
}
function openCreator(){
  creator.hidden = false;
  target.set(START.x, 4.6, START.z); dist = 13; renderCreator(); rebuildHero();
}
function closeCreator(){
  lookMade = true; saveLook();
  creator.hidden = true;
  target.set(START.x, 1, START.z); dist = 30; rebuildHero();
}
// keep the panel above the adventurer's head as the camera moves
const headV = new THREE.Vector3();
function placeCreator(){
  if (creator.hidden || !hero) return;
  headV.copy(START).add(new THREE.Vector3(0, 4.2, 0)).project(camera);
  const x = (headV.x + 1) / 2 * innerWidth, y = (-headV.y + 1) / 2 * innerHeight;
  creator.style.left = x + 'px'; creator.style.top = y + 'px';
  /* keep the whole panel on screen: the option list scrolls when it would run off the top */
  const rows = document.getElementById('crRows'), over = 12 - creator.getBoundingClientRect().top;
  if (over > 1) rows.style.maxHeight = Math.max(120, rows.clientHeight - over) + 'px';
}
document.getElementById('crRows').addEventListener('click', e => {
  const b = e.target.closest('[data-k]'); if (!b) return;
  const o = LOOK.find(x => x.key === b.dataset.k), i = o.values.findIndex(x => x.id === look[o.key]);
  look[o.key] = o.values[(i + +b.dataset.d + o.values.length) % o.values.length].id;
  renderCreator(); rebuildHero(); saveLook();
});
document.getElementById('crStart').addEventListener('click', closeCreator);
document.getElementById('crRandom').addEventListener('click', () => {   // a random look: every option picked at random
  for (const o of LOOK) { const v = o.values; look[o.key] = v[Math.floor(Math.random() * v.length)].id; }
  renderCreator(); rebuildHero(); saveLook();
});
document.getElementById('lookBtn').addEventListener('click', openCreator);

// ----- walking: click the ground and the adventurer walks there -----
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let walkTarget = null, walkThen = null, walkTick = 0;
const WALK_SPEED = 0.09;
let pressX = 0, pressY = 0;
// touch: two fingers pinch to zoom and slide together to turn the camera; a tap with one finger still walks
const touches = new Map();   // pointer id -> { x, y }
let twoFingers = false, pinchD = 0, pinchX = 0, pinchY = 0;
renderer.domElement.addEventListener('pointerdown', e => {
  pressX = e.clientX; pressY = e.clientY;
  if (e.pointerType === 'touch') {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size >= 2) {
      twoFingers = true;   // this is a camera gesture, not a walk
      const [a, b] = [...touches.values()];
      pinchD = Math.hypot(a.x - b.x, a.y - b.y); pinchX = (a.x + b.x) / 2; pinchY = (a.y + b.y) / 2;
    }
  }
});
renderer.domElement.addEventListener('pointermove', e => {
  if (e.pointerType !== 'touch' || !touches.has(e.pointerId)) return;
  const prev = touches.get(e.pointerId);
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (touches.size === 1) {
    // one finger dragged across the screen turns the camera (a short tap still walks)
    if (Math.hypot(e.clientX - pressX, e.clientY - pressY) < 10) return;
    yaw -= (e.clientX - prev.x) * 0.008;
    pitch = clampPitch(pitch - (e.clientY - prev.y) * 0.005);
    return;
  }
  const [a, b] = [...touches.values()];
  const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  if (pinchD > 0 && d > 0) { camEase = null; dist = Math.min(60, Math.max(4, dist * (pinchD / d))); }   // spread the fingers to come closer
  yaw -= (mx - pinchX) * 0.008;   // slide them together to turn
  pitch = clampPitch(pitch - (my - pinchY) * 0.005);
  pinchD = d; pinchX = mx; pinchY = my;
});
function touchEnd(e){
  if (e.pointerType !== 'touch') return;
  touches.delete(e.pointerId);
  if (touches.size === 0) setTimeout(() => { twoFingers = false; }, 0);   // the lift-off of the last finger is not a tap
}
renderer.domElement.addEventListener('pointerup', touchEnd);
renderer.domElement.addEventListener('pointercancel', touchEnd);
// where you clicked, as in RuneScape: a yellow cross on the ground for a walk, a red one on something you use, talk to or fight
const clickMarkEl = document.createElement('div'); clickMarkEl.id = 'clickMark'; document.body.appendChild(clickMarkEl);
{ const st = document.createElement('style'); st.textContent = '#clickMark{position:fixed;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:5;display:none}'
    + '#clickMark:before,#clickMark:after{content:"";position:absolute;left:7px;top:-1px;width:4px;height:20px;border-radius:2px;background:var(--cm);box-shadow:0 0 0 1px rgba(0,0,0,.55)}'
    + '#clickMark:before{transform:rotate(45deg)}#clickMark:after{transform:rotate(-45deg)}'
    + '#clickMark.go{display:block;animation:clickMark .55s ease-out forwards}@keyframes clickMark{0%{transform:scale(1.25);opacity:1}70%{opacity:1}100%{transform:scale(.55);opacity:0}}';
  document.head.appendChild(st); }
function clickMark(x, y, act){
  clickMarkEl.style.setProperty('--cm', act ? '#e8322a' : '#f3d23a');
  clickMarkEl.style.left = x + 'px'; clickMarkEl.style.top = y + 'px';
  clickMarkEl.classList.remove('go'); void clickMarkEl.offsetWidth; clickMarkEl.classList.add('go');   // restart the animation on every click
}
renderer.domElement.addEventListener('pointerup', e => {
  lastTap.x = e.clientX; lastTap.y = e.clientY;   // where a menu should pop up
  // a short click (not a drag) sets where to walk
  if (e.button !== 0 || !creator.hidden || twoFingers || Math.hypot(e.clientX - pressX, e.clientY - pressY) > 6) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = new THREE.Vector3();
  if (ray.intersectObject(doorMesh, false).length) { clickMark(e.clientX, e.clientY, true); if (doorOpen) closeDoor(); else useDoor(); return; }
  const treeHit = liveHit(ray.intersectObjects(trees, true));
  if (treeHit) {
    let g = treeHit.object; while (g && !g.userData.rec) g = g.parent;
    if (g && g.userData.rec !== chop.rec) { clickMark(e.clientX, e.clientY, true); clickNode(g.userData.rec); return; }   /* the tree you're already chopping is walked away from: an oak's crown fills the screen round you */
  }
  clickMark(e.clientX, e.clientY, false);
  if (ray.ray.intersectPlane(groundPlane, hit)) walkToGround(hit); else { cancelChop(); if (FIGHT) endFight('You run away.'); }
});
// a click on the ground, in the world or on the map: stop what's in hand, run from a fight, and walk there
function walkToGround(hit){
  cancelChop();
  if (FIGHT) { endFight('You run away.'); }
  {
    // a click on a house (even on its roof) goes to its door, or walks in if the door is already open
    const inside = houses.find(h => Math.abs(hit.x - h.x) < h.hw && Math.abs(hit.z - h.z) < h.hd);
    const here = houses.find(h => Math.abs(hero.position.x - h.x) < h.hw && Math.abs(hero.position.z - h.z) < h.hd);
    if (inside && !inside.doorRec.open) clickNode(inside.doorRec);
    else if (here && here !== inside && !here.doorRec.open) {
      // leaving a shut house: go to its door, open it, then carry on to the point clicked
      const q = here.doorRec.inside, target = hit.clone();
      walkStart(new THREE.Vector3(q.x, 0, q.z), () => { toggleDoor(here.doorRec); walkStart(target, null); });
    }
    else walkStart(hit, null);
  }
}
function updateWalk(){
  if (!hero || !walkTarget) { if (!chop.rec && !smelting && !cooking && !smithing && !fishing && !farmBusy && !milling) setHeroFrame(0, heroFacing); return; }   // the chopping pose is not overwritten by idle
  const dx = walkTarget.x - hero.position.x, dz = walkTarget.z - hero.position.z, dist = Math.hypot(dx, dz);
  if (dist < WALK_SPEED) {
    hero.position.set(walkTarget.x, 0, walkTarget.z);
    if (walkQueue.length) { walkTarget = walkQueue.shift(); return; }   // on to the next waypoint
    walkTarget = null; setHeroFrame(0, heroFacing);
    if (walkThen) { const cb = walkThen; walkThen = null; cb(); }
    return;
  }
  const nx = hero.position.x + dx / dist * WALK_SPEED, nz = hero.position.z + dz / dist * WALK_SPEED;
  // the planner already keeps each route clear of walls (with a body's width), so the walk only stops on a real overlap
  if (hardHit(nx, nz)) {
    // something is in the way: re-plan the route a few times before giving up
    walkTarget = null; walkQueue = [];
    if (walkFinal && walkTries < 3) { walkTries++; walkStart(walkFinal, walkThen, true); return; }
    walkThen = null; setHeroFrame(0, heroFacing); return;
  }   // a wall stops the walk
  hero.position.x = nx; hero.position.z = nz;
  heroShadow.position.set(hero.position.x, 0.06, hero.position.z);
  walkTick++;
  const frame = Math.floor(walkTick / 6) % 4;      // four frames, a new one every six ticks
  heroAnim.yaw = Math.atan2(dx, dz);
  setHeroFrame(frame, screenX(walkTarget.x, walkTarget.z) < screenX(hero.position.x, hero.position.z) ? -1 : 1);
}

// ----- camera: arrow keys or middle-mouse drag rotate it around the character; the wheel zooms; it always follows the character -----
const turnKeys = {};
addEventListener('keydown', e => { if (document.activeElement && document.activeElement.id === 'chatInput') return; if (e.key.startsWith('Arrow')) { turnKeys[e.key] = true; e.preventDefault(); } });
addEventListener('keyup', e => { delete turnKeys[e.key]; });
let turning = false, turnX = 0, turnY = 0;
const clampPitch = p => Math.min(1.4, Math.max(0.35, p));
renderer.domElement.addEventListener('pointerdown', e => {
  if (e.button === 1) { turning = true; turnX = e.clientX; turnY = e.clientY; e.preventDefault(); }
});
renderer.domElement.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });   // no browser autoscroll
renderer.domElement.addEventListener('auxclick', e => e.preventDefault());
addEventListener('pointerup', e => { if (e.button === 1) turning = false; });
addEventListener('pointermove', e => {
  if (!turning) return;
  const dx = e.clientX - turnX, dy = e.clientY - turnY; turnX = e.clientX; turnY = e.clientY;
  yaw -= dx * 0.008;
  pitch = clampPitch(pitch - dy * 0.005);
});
renderer.domElement.addEventListener('wheel', e => { camEase = null; dist = Math.min(60, Math.max(4, dist + e.deltaY * 0.02)); if (indoor) savedDist = Math.max(savedDist, dist); e.preventDefault(); }, { passive: false });
// fit the view to the screen. Phones report the new size late after a rotation, so it is checked again after a moment
function fitView(){
  const vv = window.visualViewport;   // the visible screen, which is right even mid-rotation
  const w = Math.round(vv ? vv.width : innerWidth), h = Math.round(vv ? vv.height : innerHeight);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h, true);
  composer.setSize(w, h); bloom.setSize(w, h);
}
addEventListener('resize', fitView);
// a rotation can lose finger lift-offs, so forget any touches still being tracked
function resetTouches(){ touches.clear(); twoFingers = false; }
addEventListener('orientationchange', () => { resetTouches(); fitView(); setTimeout(fitView, 250); setTimeout(fitView, 700); });
addEventListener('visibilitychange', resetTouches);
if (window.visualViewport) visualViewport.addEventListener('resize', fitView);
/* the first thing under the pointer that is really there. The ray also finds hidden objects, so a fallen monster waiting to
   respawn (hidden, not removed) kept saying "Attack" and swallowed clicks on the ground where it fell. Hidden objects are skipped
   (invisible click targets hide only their material, so they still count), and so are monsters that are dying or dead. */
function liveHit(hits){
  for (const h of hits) {
    let shown = true, g = null;
    for (let a = h.object; a; a = a.parent) { if (!a.visible) { shown = false; break; } if (!g && a.userData && (a.userData.action || a.userData.rec)) g = a; }
    if (!shown) continue;
    const rec = g && g.userData.rec;
    if (rec && rec.kind === 'monster' && (rec.state === 'dying' || rec.state === 'dead')) continue;
    return h;
  }
  return null;
}
// hovering the door says what a click does, as in the classic game
const tip = document.getElementById('tip');
renderer.domElement.addEventListener('pointermove', e => {
  const r = renderer.domElement.getBoundingClientRect();
  let label = null;   // what a click would do here, or null
  if (!turning && creator.hidden && !e.buttons) {
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(doorMesh, false).length > 0) label = { name: 'Door', action: doorOpen ? 'Close' : 'Open' };
    else {
      const hit = liveHit(ray.intersectObjects(trees, true));
      if (hit) { let g = hit.object; while (g && !g.userData.action) g = g.parent; if (g) label = { name: g.userData.name, action: g.userData.action }; }
    }
  }
  renderer.domElement.style.cursor = label ? 'pointer' : '';
  if (label) {
    tip.innerHTML = `<span style="color:#7fe8ff">${label.name}:</span> ${label.action}`;
    tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; tip.style.display = 'block';
  }
  else tip.style.display = 'none';
});
const camHold = {};
// the camera buttons show on touch screens; holding one keeps turning or zooming
if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) { document.getElementById('camPad').hidden = false; document.getElementById('hint').textContent = 'Tap to walk. Drag to turn, pinch or + / \u2212 to zoom.'; }
document.querySelectorAll('#camPad button').forEach(b => {
  const k = b.dataset.cam;
  b.addEventListener('pointerdown', e => { camHold[k] = true; e.preventDefault(); e.stopPropagation(); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => { camHold[k] = false; });
});
function turnWithKeys(){
  const speed = 0.03;
  if (camHold.left) yaw -= speed; if (camHold.right) yaw += speed;
  if (camHold.in) { camEase = null; dist = Math.max(4, dist - 0.35); }
  if (camHold.out) { camEase = null; dist = Math.min(60, dist + 0.35); }
  if (turnKeys.ArrowLeft) yaw -= speed;
  if (turnKeys.ArrowRight) yaw += speed;
  if (turnKeys.ArrowUp) pitch = clampPitch(pitch - speed);
  if (turnKeys.ArrowDown) pitch = clampPitch(pitch + speed);
}
// the camera always centres on the character
function followCharacter(){
  if (!creator.hidden) return;                 // the creator sets its own framing
  const base = hero ? hero.position : START;
  target.set(base.x, 1, base.z);
}

// ----- the Stats tab: our own skill list and summaries -----
const HP = { cur: 10 };   // your current health; the most is your Hitpoints level
const SKILL_XP = {Melee: 0, Hitpoints: 1154, Woodcutting: 0, Mining: 0, Fishing: 0, Smithing: 0, Cooking: 0, Firemaking: 0, Farming: 0, Crafting: 0};   // everyone starts at level 1, and Hitpoints at 10
/* the phone game's XP curve (RuneScape's), capped at 99: XP_AT[l] is where level l starts (level 10 is 1154, 99 is 13,034,431) */
const XP_AT = [0, 0]; for (let l = 2, pts = 0; l <= 100; l++) { pts += Math.floor(l - 1 + 300 * Math.pow(2, (l - 1) / 7)); XP_AT[l] = Math.floor(pts / 4); }
const levelOf = xp => { let l = 1; while (l < 99 && xp >= XP_AT[l + 1]) l++; return l; };
let statsSub = 'skills';
function renderStats(){
  const body = document.getElementById('statsBody');
  if (statsSub === 'quests') {
    const done = QUEST.hw >= HW_STEPS;
    body.innerHTML = `<h4>Quests</h4>
      <div class="qRow ${done ? 'qDone' : QUEST.hw ? 'qOn' : ''}">${done ? '&#10003;' : QUEST.hw ? '&#9679;' : '&#9675;'} A Hearty Welcome</div>
      <div class="qStep">${done ? 'Completed. Brenna\'s oven roars again.' : questObjective()}</div>
      <div class="qRow ${QUEST.rt >= RT_DONE ? 'qDone' : QUEST.rt ? 'qOn' : ''}">${QUEST.rt >= RT_DONE ? '&#10003;' : QUEST.rt ? '&#9679;' : '&#9675;'} Roots and Threads</div>
      <div class="qStep">${QUEST.rt >= RT_DONE ? 'Completed. Tilly says you have a knack for it.' : rtObjective()}</div>
      <div class="qRow ${QUEST.gw >= GW_DONE ? 'qDone' : QUEST.gw ? 'qOn' : gwReady() ? '' : 'qLock'}">${QUEST.gw >= GW_DONE ? '&#10003;' : QUEST.gw ? '&#9679;' : gwReady() ? '&#9675;' : '&#128274;'} Gone for Willow</div>
      <div class="qStep">${QUEST.gw >= GW_DONE ? 'Completed. Hollis is home, for now.' : gwReady() || QUEST.gw ? gwObjective() : 'Finish A Hearty Welcome and Roots and Threads first.'}</div>
      <div class="qRow qLock">&#128274; More quests are coming</div>
      <div class="statRow" style="margin-top:8px"><span>Quest points</span><b>${QUEST.qp || 0}</b></div>`;
    return;
  }
  const names = Object.keys(SKILL_XP);
  // a row per skill: its level, a bar filling towards the next level, and the XP still needed
  const xpFor = lvl => XP_AT[Math.min(lvl, 100)];   // the XP where a level starts
  const row = n => {
    const xp = SKILL_XP[n], lvl = levelOf(xp), from = xpFor(lvl), to = xpFor(lvl + 1);
    const pct = Math.min(100, (xp - from) / (to - from) * 100);
    const f = v => Math.floor(v).toLocaleString();   /* XP can have halves (smithing gives 12.5 a bar) */
    if (lvl >= 99) return `<div class="skRow" title="${n}: ${f(xp)} XP."><div class="skTop"><span>${n}</span><b>Lv 99</b></div><div class="skBar"><i style="width:100%"></i></div><div class="skXp">${f(xp)} XP</div></div>`;
    return `<div class="skRow" title="${n}: ${f(xp)} XP. Level ${lvl + 1} at ${f(to)} XP.">
      <div class="skTop"><span>${n}</span><b>Lv ${lvl}</b></div>
      <div class="skBar"><i style="width:${pct.toFixed(1)}%"></i></div>
      <div class="skXp">${f(xp - from)} / ${f(to - from)} XP &middot; ${Math.ceil(to - xp).toLocaleString()} to level ${lvl + 1}</div>
    </div>`;
  };
  const total = names.reduce((t, n) => t + levelOf(SKILL_XP[n]), 0);
  const combat = combatLevel();
  const totalXp = names.reduce((t, n) => t + SKILL_XP[n], 0);
  body.innerHTML = `
    <h4>Skills</h4>
    <div class="skList">${names.map(row).join('')}</div>
    <h4>Equipment status</h4>
    <div class="statRow"><span>Health</span><b>${HP.cur} / ${maxHp()}</b></div>
    <div class="statRow"><span>Attack bonus</span><b>+${gearBonus('atk')}</b></div>
    <div class="statRow"><span>Weapon</span><b>${equipped.weapon || 'none'}</b></div>
    <div class="statRow"><span>Defence bonus</span><b>+${gearBonus('def')}</b></div>
    <div class="statRow"><span>Shield</span><b>${equipped.shield || 'none'}</b></div>
    <h4>Overall</h4>
    <div class="statRow"><span>Skill total</span><b>${total}</b></div>
    <div class="statRow"><span>Total XP</span><b>${Math.floor(totalXp).toLocaleString()}</b></div>
    <div class="statRow"><span>Combat level</span><b>${combat}</b></div>`;
}
// Only one side panel is open at a time; each tab button toggles its own panel.
function togglePanel(panelId, btnId) {
  const open = document.getElementById(panelId).hidden;
  document.querySelectorAll('#statsPanel,#bagPanel,#gearPanel,#beltPanel,#setPanel,#mapPanel').forEach(p => p.hidden = true);
  document.querySelectorAll('.tabIcon').forEach(b => b.classList.remove('on'));
  if (open) { document.getElementById(panelId).hidden = false; document.getElementById(btnId).classList.add('on'); }
}
document.getElementById('tabStats').addEventListener('click', () => togglePanel('statsPanel', 'tabStats'));
document.getElementById('tabBag').addEventListener('click', () => togglePanel('bagPanel', 'tabBag'));

