// ----- battery saver: fewer pixels, no glow, smaller shadows, and the scene drawn less often (the game itself still runs every frame) -----
const POWER = { last: 0, input: 0, applied: null };
function applyPower(){
  const on = !!SETTINGS.saver; if (POWER.applied === on) return; POWER.applied = on;
  const pr = on ? 1 : Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(pr); composer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight);
  bloom.enabled = !on;
  const half = on ? 24 : 30; Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half }); sun.shadow.camera.updateProjectionMatrix();
  const size = on ? 1024 : 2048; if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  if (typeof fitView === 'function') fitView();
}
for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown']) addEventListener(ev, () => { POWER.input = performance.now(); }, { passive: true });
// is anything happening that's worth drawing smoothly?
function busyNow(now){ return now - POWER.input < 2500 || walkTarget || FIGHT || chop.rec || smelting || cooking || smithing || fishing || farmBusy || milling || spinning || bandaging || (typeof DELVE !== 'undefined' && DELVE) || CAVE || Object.keys(remote).length > 0 && Object.values(remote).some(r => Math.hypot(r.tx - r.sprite.position.x, r.tz - r.sprite.position.z) > 0.05); }
function shouldDraw(now){
  if (!SETTINGS.saver) return true;
  const gap = busyNow(now) ? 33 : 66;   // about 30 a second while something's happening, 15 when all is still
  if (now - POWER.last < gap - 4) return false;
  POWER.last = now; return true;
}
window.__powerReady = true; applyPower();
function frame(){
  updateWalk();
  updateSmelt();
  updateCook();
  updateSmith();
  updateFishing();
  updateQuest();
  updateHeroAnim();
  updateTrees();
  updateDebris();
  updateHouses(); updateBarracks(); updateFishShack(); updateLighting(); updateFires();
  updateFolds();
  updateFish();
  updateOnline();
  updateWanderers();
  updateBarks();
  updateAnimals();
  updateGrass();
  updateDayNight();
  updateHall();
  updateFight();
  updateFightMusic();
  updateBonfire();
  growCrops();
  updateCellar(); updateDelve(); updateCave();
  updateTrade();
  updateFarmPose();
  updateMilling(); updateSpinning(); updateBandage(); updateGround(); renderPartyFrames();
  updateDrops();
  updateTorch();
  checkDialogDistance();
  updateDialog();
  fireMat.emissiveIntensity = 1.1 + 0.3 * Math.sin(performance.now() / 120);   // the fire flickers
  updateDoor();
  turnWithKeys();
  followCharacter();
  placeCamera();
  placeCreator();
  placeHeroChat();
  updateSun();
  const now = performance.now();
  riverTex.offset.x = now * 0.00004; riverTex.offset.y = Math.sin(now * 0.0007) * 0.05;
  clouds.rotation.y = now * 0.000006;
  sky.position.copy(camera.position);
  updateMap(now);
  if (shouldDraw(now)) { farSweep(); if (bloom.enabled) composer.render(); else renderer.render(scene, camera); }   /* without the glow, skip the extra passes entirely */
  requestAnimationFrame(frame);
}
// ----- a held torch: the flame flickers, and at night it lights the ground round you -----
let heroTorchLight = null; const _tp = new THREE.Vector3();
function updateTorch(){
  const t = performance.now() / 1000;
  if (!heroTorchLight) { heroTorchLight = new THREE.PointLight(0xffa050, 0, 14, 1.6); scene.add(heroTorchLight); }
  heroTorchLight.intensity = 0;
  const flick = (T, seed) => { const k = 0.85 + 0.15 * Math.sin(t * 13 + seed) * Math.sin(t * 7.3 + seed); T.flame.scale.set(1, k * (0.9 + 0.1 * Math.sin(t * 21 + seed)), 1); if (T.light) { T.flame.getWorldPosition(_tp); heroTorchLight.position.set(_tp.x, _tp.y + 0.3, _tp.z); heroTorchLight.intensity = (0.5 + 6 * DAY.night) * k; } };
  const c = hero && hero.userData.chibi; if (c && c.torch) flick(c.torch, 0);
  let i = 1; for (const id in remote) { const rc = remote[id].sprite.userData.chibi; if (rc && rc.torch) flick(rc.torch, i++ * 1.7); }
}
// ----- crafting from the bag: click an item that can be made into something, and pick what to make -----
const CRAFTS = { 'Logs': [{ label: 'Light a fire', fire: 'Logs', skill: 'Firemaking', level: 1, xp: 25 }, { label: 'Make a torch', make: 'Torch', skill: 'Firemaking', level: 1, xp: 15, needs: { Logs: 1 } }],
  'Oak logs': [{ label: 'Light a fire', fire: 'Oak logs', skill: 'Firemaking', level: 15, xp: 40 }, { label: 'Make a torch', make: 'Torch', skill: 'Firemaking', level: 1, xp: 20, needs: { 'Oak logs': 1 } }] };
// ===== fires, as in RuneScape: light logs with a tinderbox where you stand, step aside, and cook on it till it burns down =====
// Everyone up top sees them (adventure/live/fires/<key>: x, z, until). The nearest ones join the shared night lights, so no new lights are made.
const FIRES = [], FIRE_MS = 90000, FIRE_LIGHT_MS = 1600;
let lighting = null;   // { o, t0, x, z }: the tinderbox at work
const fireUrl = key => `${DB}/adventure/live/fires/${key}.json`;
function noFireHere(x, z){
  if (DELVE || CAVE) return "You can't light a fire down here.";
  if (waterSD(x, z) < 1.2) return "You can't light a fire here.";
  const inside = houses.some(h => Math.abs(x - h.x) < h.hw + 0.4 && Math.abs(z - h.z) < h.hd + 0.4) || (Math.abs(x - HALL.x) < 8 * HS && Math.abs(z - HALL.z) < 7 * HS)
    || (x > BARRACKS.x0 && x < BARRACKS.jx1 && z > BARRACKS.z0 && z < BARRACKS.z1) || (Math.abs(x - FISH_SHACK.x) < 4.5 && Math.abs(z - FISH_SHACK.z) < 3.5);
  if (inside) return "You can't light a fire indoors.";
  if (FIRES.some(f => Math.hypot(f.x - x, f.z - z) < 1.6) || Math.hypot(x - BF.x, z - BF.z) < 3) return "There's already a fire here.";
  if (ROADS.some(([x0, z0, x1, z1]) => segDist(x, z, [x0, z0], [x1, z1]) < 1.1)) return "You can't light a fire on the road.";
  return null;
}
function startFire(o){
  if (!hasTool('Tinderbox')) { showToast('You need a tinderbox to light a fire. Mara sells them.'); return; }
  if (levelOf(SKILL_XP.Firemaking) < o.level) { showToast(`You need Firemaking ${o.level} to light ${o.fire.toLowerCase()}.`); return; }
  if (FIGHT) { showToast("You can't do that in the middle of a fight!"); return; }
  const x = hero.position.x, z = hero.position.z, no = noFireHere(x, z); if (no) { showToast(no); return; }
  cancelChop(); stopLighting();
  lighting = { o, t0: performance.now(), x, z };
  heroAnim.mode = 'plant';   // crouched over the logs, striking the tinderbox
  sfx((c, t, out) => { out.gain.value = 0.7; bfSnd.flint(c, out, t); });
  document.getElementById('smeltLabel').textContent = 'Lighting a fire...'; document.getElementById('smeltBar').style.display = 'block';
}
function stopLighting(){ if (!lighting) return; lighting = null; document.getElementById('smeltBar').style.display = 'none'; }
function updateLighting(){
  if (!lighting) return;
  if (Math.hypot(hero.position.x - lighting.x, hero.position.z - lighting.z) > 0.4 || FIGHT) { stopLighting(); return; }   // walked off, or attacked
  const k = (performance.now() - lighting.t0) / FIRE_LIGHT_MS;
  document.getElementById('smeltFill').style.width = Math.min(100, k * 100) + '%'; heroAnim.mode = 'plant';
  if (k < 1) return;
  const { o, x, z } = lighting;
  if (!hasItem(o.fire)) { stopLighting(); return; }
  if (Math.random() > Math.min(1, 0.6 + 0.04 * (levelOf(SKILL_XP.Firemaking) - o.level))) { lighting.t0 = performance.now(); sfx((c, t, out) => { out.gain.value = 0.7; bfSnd.flint(c, out, t); }); return; }   // the spark didn't take: strike again
  stopLighting(); heroAnim.mode = 'idle';
  removeItem(o.fire); addXp('Firemaking', o.xp); renderBag();
  sfx((c, t, out) => { out.gain.value = 0.6; bfSnd.catch(c, out, t); });
  showToast(`The fire catches and the logs begin to burn.  +${o.xp} Firemaking XP`);
  const key = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), until = SNOW() + FIRE_MS;
  addFire(key, x, z, until, true);
  fetch(fireUrl(key), { method: 'PUT', body: JSON.stringify({ x: +x.toFixed(2), z: +z.toFixed(2), until, by: ONLINE.id }) }).catch(() => {});
  for (const [dx, dz] of [[-1.6, 0], [1.6, 0], [0, 1.6], [0, -1.6]]) if (!blocked(x + dx, z + dz)) { walkStart(new THREE.Vector3(x + dx, 0, z + dz)); break; }   // step aside, as in RuneScape
  saveNow(false);
}
let fireGeo = null;
function addFire(key, x, z, until, mine = false){
  if (FIRES.some(f => f.key === key) || until < SNOW()) return;
  if (!fireGeo) { const logs = [], flames = [];
    for (const a of [0.4, -0.4, 1.57]) logs.push(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 6).rotateZ(Math.PI / 2).rotateY(a).translate(0, 0.14, 0).toNonIndexed());
    for (const [r, h, dx, dz] of [[0.32, 0.95, 0, 0], [0.2, 0.65, 0.18, 0.1], [0.18, 0.6, -0.16, -0.08]]) flames.push(new THREE.ConeGeometry(r, h, 6).translate(dx, 0.25 + h / 2, dz).toNonIndexed());
    fireGeo = { logs: mergeGeometries(logs), flames: mergeGeometries(flames), ash: new THREE.CylinderGeometry(0.55, 0.65, 0.06, 10),
      logM: mat(0x5a3a1e), ashM: mat(0x55504a), flameM: new THREE.MeshStandardMaterial({ color: 0xffa030, emissive: 0xff6a00, emissiveIntensity: 1.6, transparent: true, opacity: 0.9, depthWrite: false }) }; }
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const logs = new THREE.Mesh(fireGeo.logs, fireGeo.logM), flame = new THREE.Mesh(fireGeo.flames, fireGeo.flameM); logs.castShadow = true; g.add(logs, flame);
  const rec = { kind: 'range', fire: true, x, z, s: 0.75, state: 'standing' };
  g.userData = { action: 'Cook on', name: 'Fire', rec }; trees.push(g);
  FIRES.push({ key, x, z, until, g, flame, rec, mine, ash: null });
}
function dropFire(f, ashes = true){
  const i = FIRES.indexOf(f); if (i < 0) return; FIRES.splice(i, 1);
  const t = trees.indexOf(f.g); if (t >= 0) trees.splice(t, 1);
  if (cooking && cooking.rec === f.rec) stopCooking('The fire has burnt out.');
  scene.remove(f.g);
  if (ashes) { const a = new THREE.Mesh(fireGeo.ash, fireGeo.ashM); a.position.set(f.x, 0.03, f.z); scene.add(a); setTimeout(() => scene.remove(a), 20000); }   // a ring of ash for a while
  if (f.mine) fetch(fireUrl(f.key), { method: 'DELETE' }).catch(() => {});
}
function updateFires(){
  const now = SNOW(), t = performance.now() / 1000;
  for (const f of FIRES.slice()) {
    if (now > f.until) { dropFire(f); continue; }
    const left = Math.min(1, (f.until - now) / 20000);   // it dies down in its last moments
    f.flame.scale.set(0.6 + 0.4 * left + 0.06 * Math.sin(t * 9 + f.x), (0.5 + 0.5 * left) * (1 + 0.15 * Math.sin(t * 13 + f.z)), 0.6 + 0.4 * left);
    if (Math.random() < 0.02) soundAt(f.x, f.z, () => sfx((c, tt, out) => { out.gain.value = 0.35; bfSnd.pop(c, out, tt); }));
  }
}
function fireApply(key, d){
  const f = FIRES.find(q => q.key === key);
  if (!d) { if (f) dropFire(f); return; }
  if (!f && typeof d.x === 'number' && typeof d.z === 'number' && typeof d.until === 'number' && !DELVE) addFire(key, d.x, d.z, d.until, d.by === ONLINE.id);
}
const itemMenu = document.createElement('div'); itemMenu.id = 'itemMenu'; itemMenu.hidden = true; document.body.appendChild(itemMenu);

