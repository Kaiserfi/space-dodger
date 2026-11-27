// ----- the map: the button at the top of the tab bar opens a small map centred on you -----
// It turns with the camera, so up on the map is always the way you are looking. You are the gold arrow; other players nearby are white dots
// with their names. The compass on its corner turns with it, and tapping the compass swings the camera round to face north.
// The picture is taken once, from straight above with everyone taken out (bakeMap), so the map costs no extra drawing of the world afterwards.
// It covers the surface only: there is no map in the Root Cellar or the cave.
const MAPUI = { half: 125, size: 1500, span: 88, shot: null, goal: null, last: 0, t: 0, panel: document.getElementById('mapPanel'), cv: document.getElementById('mapCanvas'), rose: document.getElementById('mapRose') };
const mapUnder = () => !!(DELVE || CAVE || (hero && hero.position.z > 300));
function bakeMap(){
  const S = MAPUI.size, H = MAPUI.half, shot = document.createElement('canvas'); shot.width = shot.height = S;
  const cam = new THREE.OrthographicCamera(-H, H, H, -H, 1, 800); cam.position.set(0, 400, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);   /* north (-z) at the top */
  const hid = [hero, clouds, ...MONSTERS.map(m => m.g), ...WANDER.map(w => w.sp), ...Object.values(remote).map(r => r.sprite)]; scene.traverse(o => { if (o.isPoints) hid.push(o); });   /* no people, creatures, clouds, pollen or fireflies */
  for (let i = hid.length - 1; i >= 0; i--) if (!hid[i] || !hid[i].visible) hid.splice(i, 1); hid.forEach(o => o.visible = false);
  const keep = { fn: scene.fog.near, ff: scene.fog.far, sp: sun.position.clone(), st: sun.target.position.clone(), sc: sun.color.clone(), si: sun.intensity, hc: hemi.color.clone(), hg: hemi.groundColor.clone(), hi: hemi.intensity, pr: renderer.getPixelRatio() };
  scene.fog.near = 1e5; scene.fog.far = 1e6;   /* no fog, and noon light whatever the hour */
  sun.target.position.set(0, 5000, 0); sun.position.set(18, 5033, 12); sun.target.updateMatrixWorld();   /* the shadow box is moved off into the sky, so the picture has no patch of shadows round where you stood */
  sun.color.set(0xffe7c2); sun.intensity = 2.1; hemi.color.set(0xdff0ff); hemi.groundColor.set(0x4a5a2a); hemi.intensity = 1.1;
  for (const o of FARCULL.list) o.layers.mask = 1;   /* far things too: farSweep hides them again before the next frame is drawn */
  renderer.setPixelRatio(1); renderer.setSize(S, S, false); renderer.render(scene, cam); shot.getContext('2d').drawImage(renderer.domElement, 0, 0, S, S);
  scene.fog.near = keep.fn; scene.fog.far = keep.ff; sun.position.copy(keep.sp); sun.target.position.copy(keep.st); sun.target.updateMatrixWorld(); sun.color.copy(keep.sc); sun.intensity = keep.si; hemi.color.copy(keep.hc); hemi.groundColor.copy(keep.hg); hemi.intensity = keep.hi;
  hid.forEach(o => o.visible = true); renderer.setPixelRatio(keep.pr); fitView();
  POWER.last = 0;   /* draw the game again this very frame, so the top-down picture never shows on screen */
  return shot;
}
function drawMap(){
  const cv = MAPUI.cv, want = Math.round(cv.clientWidth * Math.min(devicePixelRatio || 1, 2)); if (!want) return; if (cv.width !== want) cv.width = cv.height = want;
  const ctx = cv.getContext('2d'), W = cv.width, c = W / 2, k = W / MAPUI.span, K = MAPUI.size / (MAPUI.half * 2), hx = hero.position.x, hz = hero.position.z, cy = Math.cos(yaw), sy = Math.sin(yaw);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#16120c'; ctx.fillRect(0, 0, W, W);
  ctx.translate(c, c); ctx.rotate(yaw); ctx.scale(k / K, k / K); ctx.drawImage(MAPUI.shot, -(hx + MAPUI.half) * K, -(hz + MAPUI.half) * K);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const u = W / 264; ctx.font = `bold ${Math.round(10 * u)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  for (const id in remote) { const r = remote[id]; if (!r.sprite || !r.sprite.visible) continue;
    const rx = r.sprite.position.x - hx, rz = r.sprite.position.z - hz, x = c + (rx * cy - rz * sy) * k, y = c + (rx * sy + rz * cy) * k; if (x < 0 || y < 0 || x > W || y > W) continue;
    ctx.beginPath(); ctx.arc(x, y, 4 * u, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 1.5 * u; ctx.strokeStyle = '#1c140a'; ctx.stroke();
    if (r.name) { ctx.lineWidth = 2.5 * u; ctx.strokeStyle = 'rgba(20,14,8,.85)'; ctx.strokeText(r.name, x, y - 7 * u); ctx.fillStyle = '#fff'; ctx.fillText(r.name, x, y - 7 * u); } }
  if (walkFinal && (walkTarget || walkQueue.length)) { const fx = walkFinal.x - hx, fz = walkFinal.z - hz, x = c + (fx * cy - fz * sy) * k, y = c + (fx * sy + fz * cy) * k;   /* where you're walking to: a little red flag */
    if (x > 0 && y > 0 && x < W && y < W) { ctx.lineWidth = 1.6 * u; ctx.strokeStyle = '#1c140a'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 11 * u); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 11 * u); ctx.lineTo(x + 7 * u, y - 8.5 * u); ctx.lineTo(x, y - 6 * u); ctx.closePath(); ctx.fillStyle = '#e8322a'; ctx.fill(); ctx.lineWidth = 1 * u; ctx.stroke(); } }
  ctx.save(); ctx.translate(c, c); ctx.rotate(Math.PI - (hero.rotation.y - yaw)); ctx.beginPath(); ctx.moveTo(0, -8.5 * u); ctx.lineTo(6 * u, 6.5 * u); ctx.lineTo(0, 3 * u); ctx.lineTo(-6 * u, 6.5 * u); ctx.closePath();
  ctx.fillStyle = '#f0c35a'; ctx.fill(); ctx.lineWidth = 1.75 * u; ctx.strokeStyle = '#1c140a'; ctx.stroke(); ctx.restore();
  const g = ctx.createRadialGradient(c, c, W * 0.42, c, c, W * 0.72); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
}
// every frame: ease the camera round to north if the compass was tapped, and redraw the open map about twenty times a second
function updateMap(now){
  const dt = Math.min(0.1, (now - MAPUI.t) / 1000); MAPUI.t = now;
  if (MAPUI.goal !== null) { yaw += (MAPUI.goal - yaw) * (1 - Math.exp(-dt * 9)); if (Math.abs(MAPUI.goal - yaw) < 0.003) { yaw = MAPUI.goal; MAPUI.goal = null; } POWER.input = now; }
  if (MAPUI.panel.hidden) return;
  if (!hero || mapUnder()) { MAPUI.panel.hidden = true; document.getElementById('tabMap').classList.remove('on'); return; }
  if (now - MAPUI.last < 50) return; MAPUI.last = now;
  if (!MAPUI.shot) MAPUI.shot = bakeMap();
  MAPUI.rose.setAttribute('transform', `rotate(${(yaw * 180 / Math.PI).toFixed(1)} 16 16)`);
  drawMap();
}
document.getElementById('tabMap').addEventListener('click', () => {
  if (MAPUI.panel.hidden && mapUnder()) { showToast("There's no map down here."); return; }
  togglePanel('mapPanel', 'tabMap');
});
document.getElementById('mapCompass').addEventListener('click', e => { e.stopPropagation(); MAPUI.goal = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2; });   /* the shortest way round to north */
renderer.domElement.addEventListener('pointerdown', () => { MAPUI.goal = null; });   /* turning the camera yourself takes over */
// tapping the map walks you there, the same as tapping the ground (the map turns with the camera, so the tap is turned back by yaw)
MAPUI.cv.addEventListener('click', e => {
  if (!hero || !creator.hidden || mapUnder()) return;
  const r = MAPUI.cv.getBoundingClientRect(), k = r.width / MAPUI.span, dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2, cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x = hero.position.x + (dx * cy + dy * sy) / k, z = hero.position.z + (-dx * sy + dy * cy) / k;
  walkToGround(new THREE.Vector3(x, 0, z)); MAPUI.last = 0;
});
