// ----- the stone hall -----
const HALL = new THREE.Vector3(16, 0, 2);      // east of the starting tile
const HALL_SCALE = 1.45;   // the whole hall is built at its own size and scaled up, so it stays symmetrical
const hallGroup = new THREE.Group(); hallGroup.position.copy(HALL); hallGroup.scale.setScalar(HALL_SCALE); scene.add(hallGroup);
const wallStone = stoneTex(), floorWood = woodTex(), bannerMap = bannerTex();
// lime plaster for the cottage walls: a warm off-white with speckles and faint weather stains
const plasterTex = (() => {
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const r = (() => { let q = 13; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
  g.fillStyle = '#ece2cc'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? `rgba(150,130,100,${0.06 + r() * 0.1})` : `rgba(255,255,245,${0.08 + r() * 0.1})`; g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 5; i++) { const x = r() * S, gr = g.createLinearGradient(x, 0, x, S); gr.addColorStop(0, 'rgba(120,100,70,0)'); gr.addColorStop(1, 'rgba(120,100,70,.12)'); g.fillStyle = gr; g.fillRect(x, S * 0.4, 6 + r() * 10, S * 0.6); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const hallWallMats = [];   // the hall's stone, so it can fade out while you are inside
function block(x, y, z, w, h, d, tex, rx = 1, ry = 1, fades = true){
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, w / 2) * rx, Math.max(1, h / 2) * ry);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: t, flatShading: true, roughness: 0.95 }));
  m.position.set(x, y + h / 2, z); hallGroup.add(m); if (fades) hallWallMats.push(m.material); return m;
}
// floor
const hallFloor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: (() => { const t = floorWood.clone(); t.needsUpdate = true; t.repeat.set(3, 2.5); return t; })(), flatShading: true }));
hallFloor.position.y = 0.06; hallGroup.add(hallFloor);
// walls: north and east/west are solid; the south wall has a doorway in the middle
block(0, 0, -5.4, 13.6, 4.5, 0.8, wallStone);
block(-4.05, 0, 5.4, 5.5, 4.5, 0.8, wallStone);   // south wall, left of the doorway
block(4.05, 0, 5.4, 5.5, 4.5, 0.8, wallStone);   // south wall, right of the doorway
block(-6.4, 0, 0, 0.8, 4.5, 11.6, wallStone);
block(6.4, 0, 0, 0.8, 4.5, 11.6, wallStone);
block(0, 3.8, 5.4, 2.6, 0.7, 0.8, wallStone);                  // wall above the door, flush with the wall
// door
// the door fills the doorway up to the lintel, with wood planks, iron bands and a handle
const doorPlanks = woodTex(); doorPlanks.repeat.set(1, 1.6); doorPlanks.needsUpdate = true;
const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.8, 0.2), new THREE.MeshStandardMaterial({ map: doorPlanks, flatShading: true }));
const ironMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, flatShading: true });
[-1.2, 1.2].forEach(y => { const band = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.14, 0.26), ironMat); band.position.set(0, y, 0); doorMesh.add(band); });
const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.22), new THREE.MeshStandardMaterial({ color: 0xd9b44a, flatShading: true }));
handle.position.set(0.95, 0, 0.1); doorMesh.add(handle);
const doorPivot = new THREE.Group(); doorPivot.position.set(-1.3, 0, 5.5); hallGroup.add(doorPivot);   // the hinge is on the left edge
doorMesh.position.set(1.3, 1.9, 0); doorPivot.add(doorMesh);
// pillars
block(0, 0, 0, 1, 4.5, 1, wallStone, 0.5, 1, false);   // one pillar in the middle of the hall
// banners on the north wall


// a tiled roof with an overhang, and a stone base along the walls
const shingleTex = () => makeTex(g => {
  g.fillStyle = '#6a2f22'; g.fillRect(0, 0, 32, 32);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 8 : 0;
    for (let x = -8; x < 32; x += 16) {
      const v = Math.floor(seeded() * 30);
      g.fillStyle = `rgb(${150 + v},${72 + Math.floor(v / 2)},${52})`; g.fillRect(x + off + 1, row * 8 + 1, 14, 6);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + off + 1, row * 8 + 7, 14, 1);   // the shadow under each row
    }
  }
});
const roofTex = shingleTex(); roofTex.repeat.set(3, 2); roofTex.needsUpdate = true;
const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, flatShading: true, side: THREE.DoubleSide });
hallWallMats.push(roofMat);                                   // the roof fades inside too
// hip roof: four sloping faces that start at the wall tops and meet at a point
const roofGeo = (() => {
  const a = 7.7, b = 6.7, h = 3.5, y = 4.5;   // wider overhang and a steeper pitch
  const P = [[-a, y, -b], [a, y, -b], [a, y, b], [-a, y, b]], apex = [0, y + h, 0];
  // one top-down projection for every face, so the shingles line up around the whole roof
  const uvOf = p => [(p[0] + a) / (2 * a), (p[2] + b) / (2 * b)];
  const pos = [], uvs = [];
  for (let i = 0; i < 4; i++) {
    const p0 = P[i], p1 = P[(i + 1) % 4];
    pos.push(...apex, ...p0, ...p1);
    uvs.push(0.5, 0.5, ...uvOf(p0), ...uvOf(p1));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return g;
})();
const roofMesh = new THREE.Mesh(roofGeo, roofMat); hallGroup.add(roofMesh);

// stone frame around the doorway: two posts and a wider lintel
// windows: a stone surround with dark glass, set into the outside of each wall
const glassMat = new THREE.MeshStandardMaterial({ color: 0x2a3a52, emissive: 0x2a1f0e, flatShading: true });
function windowAt(x, y, z, facesZ){
  const glass = new THREE.Mesh(new THREE.BoxGeometry(facesZ ? 0.9 : 0.1, 1.1, facesZ ? 0.1 : 0.9), glassMat);
  glass.position.set(x, y, z); hallGroup.add(glass);   // flush with the wall face
}
// ----- day and night, on Eastern time: the sun rises about 6am and sets about 7:30pm, crossing the sky from east to west;
// at night the moon comes up, the stars come out, the world goes dark blue, and lamps and windows light the village.
// For testing, ?hour=21 in the address sets the time.
const HOUR_OVERRIDE = (() => { const h = parseFloat(new URLSearchParams(location.search).get('hour')); return isNaN(h) ? null : h; })();
function hourNow(){
  if (HOUR_OVERRIDE !== null) return HOUR_OVERRIDE;
  try { const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    return +p.find(x => x.type === 'hour').value + p.find(x => x.type === 'minute').value / 60; } catch (e) { return new Date().getHours(); }
}
const SKY = { day: [0x3d7fc9, 0x8cc4e6, 0xcfe6ea], dusk: [0x2e3c7a, 0xe0906a, 0xf2b880], night: [0x0b1534, 0x1c2c5c, 0x2a3c6e], cellar: [0x050816, 0x0c1530, 0x18223e] };   /* cellar: the old, darker night, kept for the delve */
const NIGHT_GROUND = new THREE.Color(0x4a5a2a), NIGHT_GROUND_TO = new THREE.Color(0x2e3a5a), _skyA = new THREE.Color(), _skyB = new THREE.Color();
const nightLights = [];
let stars = null, moon = null, DAY = { light: 1, night: 0 };
function updateDayNight(){
  const h = DELVE ? 0 : hourNow(), RISE = 6, SET = 19.5;   /* always dark in the cellar, lit by its braziers */
  const dayFrac = (h - RISE) / (SET - RISE), up = dayFrac >= 0 && dayFrac <= 1;
  const elev = up ? Math.sin(Math.PI * dayFrac) : -Math.sin(Math.PI * (((h - SET) + 24) % 24) / (24 - (SET - RISE)));
  const light = THREE.MathUtils.smoothstep(elev, -0.08, 0.3), night = 1 - THREE.MathUtils.smoothstep(elev, -0.1, 0.25), dusk = Math.max(0, 1 - Math.abs(elev) / 0.3);
  DAY = { light, night };
  const nb = DELVE ? 0 : night;   /* the brighter moonlit night up top; the Root Cellar stays as dark as ever */
  // the sun (or, at night, the moon) travels from east to west across the southern sky
  const f = up ? dayFrac : (((h - SET) + 24) % 24) / (24 - (SET - RISE));
  const dir = new THREE.Vector3(Math.cos(Math.PI * f), Math.max(0.12, Math.abs(Math.sin(Math.PI * f))), 0.45).normalize();
  SUN_OFF.copy(dir).multiplyScalar(40);
  sun.color.set(up ? (dusk > 0.5 ? 0xffb070 : 0xffe7c2) : 0x9ab0e0);
  sun.intensity = up ? 0.3 + 1.8 * light : 0.35;
  if (nb > 0.5 && sun.intensity < 1) { sun.intensity = 0.35 + 0.85 * nb; sun.color.set(0xb0c4f0); }   /* moonlight */
  const bk = (SETTINGS.bright - 50) / 100;   // the brightness setting, -0.5 to +0.5: mostly lifts the dark, barely touches the day
  hemi.intensity = 0.18 + 0.72 * light + nb * 0.38 + night * 1.4 * Math.max(0, bk); hemi.color.set(light > 0.3 ? 0xdff0ff : (DELVE ? 0x6a80b0 : 0x7890d0));
  hemi.groundColor.copy(NIGHT_GROUND).lerp(NIGHT_GROUND_TO, nb);
  renderer.toneMappingExposure = (0.85 + 0.2 * light) * (1 + bk * (0.25 + 0.45 * night)) * (1 + 0.15 * nb);
  // sky colours: day, sunset and night, blended
  const NS = DELVE ? SKY.cellar : SKY.night, c = (i) => _skyA.set(NS[i]).lerp(_skyB.set(SKY.day[i]), light).lerp(_skyB.set(SKY.dusk[i]), dusk * 0.7);
  skyMat.uniforms.top.value.copy(c(0)); skyMat.uniforms.mid.value.copy(c(1)); skyMat.uniforms.bot.value.copy(c(2));
  skyMat.uniforms.sunDir.value.copy(dir); skyMat.uniforms.sunCol.value.setRGB(1, 0.85, 0.6).multiplyScalar(up ? 1 : 0.15);
  scene.fog.color.copy(c(2)); scene.background.copy(c(2));
  clouds.traverse(o => { if (o.isMesh) { o.material.emissiveIntensity = 0.05 + 0.3 * light; o.material.color.setScalar(0.35 + 0.65 * light); } });
  // stars and the moon
  if (!stars) {
    const pos = []; for (let i = 0; i < 700; i++) { const a = Math.random() * Math.PI * 2, y = 0.1 + Math.random() * 0.9, r = Math.sqrt(1 - y * y); pos.push(Math.cos(a) * r * 170, y * 170, Math.sin(a) * r * 170); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); sky.add(stars); stars.scale.setScalar(1 / 180);
    moon = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf0f0e0, fog: false, transparent: true })); sky.add(moon); moon.scale.setScalar(1 / 180);
  }
  stars.material.opacity = night; moon.material.opacity = night; moon.visible = night > 0.02;
  if (!up) moon.position.copy(dir).multiplyScalar(150 / 180 * 180);
  // windows and lamps glow brighter after dark, and the nearest few actually light the ground round them
  for (const m of GLOW_MATS) m.emissiveIntensity = (m === lampGlass ? 0.5 : 0.5) + 2.4 * night + 0.8 * nb;
  if (!nightLights.length) for (let i = 0; i < 8; i++) { const L = new THREE.PointLight(0xffb060, 0, 13, 1.6); scene.add(L); nightLights.push(L); }
  const now = performance.now();
  if (!updateDayNight.next || now > updateDayNight.next) { updateDayNight.next = now + 700;
    const c0 = hero ? hero.position : target;
    const spots = LIGHT_SPOTS.map(p => ({ p, d: Math.hypot(p[0] - c0.x, p[2] - c0.z) }));
    for (const id in remote) { const sp = remote[id].sprite, c = sp.userData.chibi;   // other players' torches, ahead of lamps the same distance away
      if (c && c.torch) spots.push({ follow: sp, d: Math.hypot(sp.position.x - c0.x, sp.position.z - c0.z) - 8 }); }
    for (const w of WANDER) if (w.dark && w.k === 1 && GUARD_NAMES.includes(w.rec.name)) { const sp = w.sp;   // the guards' torches too
      spots.push({ follow: sp, d: Math.hypot(sp.position.x - c0.x, sp.position.z - c0.z) - 8 }); }
    for (const f of FIRES) spots.push({ p: [f.x, 1.3, f.z], d: Math.hypot(f.x - c0.x, f.z - c0.z) - 6 });   // campfires
    spots.sort((a, b) => a.d - b.d);
    nightLights.forEach((L, i) => { const sp = spots[i]; L.follow = sp && sp.follow || null; if (sp && sp.p) L.position.set(sp.p[0], sp.p[1], sp.p[2]); }); }
  for (const L of nightLights) if (L.follow) L.position.set(L.follow.position.x, 2.6, L.follow.position.z);   // a carried torch's light moves with them
  nightLights.forEach(L => { L.distance = DELVE ? 13 : 18; L.intensity = (DELVE ? 6 : 9) * night * (0.92 + Math.random() * 0.08); });
}
// ----- the hall's facelift: warm cut stone, buttresses, an arched doorway, glowing windows, a bell tower,
// village banners waving outside, and a proper great hall inside (built once the emblem drawing is ready)
let hallBanners = [], hallLight = null;
function hallOverhaul(){
  const H = hallGroup, folds = [];
  const P = (geo, m, x, y, z, fold = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); H.add(o); if (fold) hallWallMats.push(o.material); return o; };
  const M = c => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9 });
  const stoneM = (rx, ry, col) => { const t = wallStone.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: t, color: col, flatShading: true, roughness: 0.95 }); };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  // warm, honey-coloured stone instead of cold grey
  const warm = document.createElement('canvas'); warm.width = warm.height = 32; const wg = warm.getContext('2d');
  wg.fillStyle = '#7a6a52'; wg.fillRect(0, 0, 32, 32);   // warm mortar
  for (let row = 0; row < 4; row++) { const off = row % 2 ? 8 : 0;
    for (let x = -8; x < 32; x += 16) { const v = Math.floor(seeded() * 30); wg.fillStyle = `rgb(${200 + v},${182 + v},${148 + v})`; wg.fillRect(x + off + 1, row * 8 + 1, 14, 6);
      wg.fillStyle = 'rgba(255,250,230,.25)'; wg.fillRect(x + off + 1, row * 8 + 1, 14, 1); wg.fillStyle = 'rgba(60,40,20,.2)'; wg.fillRect(x + off + 1, row * 8 + 6, 14, 1); } }
  for (const m of hallWallMats) if (m.map && m.map.image === wallStone.image) { m.map.image = warm; m.map.needsUpdate = true; }   // honey-coloured cut stone instead of cold grey
  // a darker plinth course round the base, and buttresses at the corners
  for (const [x, z, w, d] of [[0, -5.45, 13.9, 0.95], [-6.45, 0, 0.95, 11.7], [6.45, 0, 0.95, 11.7], [-4.05, 5.45, 5.6, 0.95], [4.05, 5.45, 5.6, 0.95]]) P(B(w, 0.7, d), stoneM(w / 2, 0.4, 0x9a8c78), x, 0.35, z);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const b = P(B(1.3, 5.2, 1.3), stoneM(0.6, 2, 0xcbbb9c), sx * 6.6, 2.6, sz * 5.6); const cap = P(new THREE.ConeGeometry(0.95, 0.9, 4), M(0x8a7a64), sx * 6.6, 5.6, sz * 5.6); cap.rotation.y = Math.PI / 4; }
  // an arched stone doorway: two posts and a rounded arch of voussoirs over the door, with a keystone
  for (const sx of [-1, 1]) P(B(0.55, 3.9, 0.35), stoneM(0.3, 2, 0xc8b898), sx * 1.6, 1.95, 5.9);
  for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8, v = P(B(0.5, 0.36, 0.36), M(i === 4 ? 0xe0c890 : 0xbcae92), Math.cos(a) * 1.6, 3.82 + Math.sin(a) * 0.42, 5.92); v.rotation.z = Math.atan2(Math.sin(a) * 0.42, Math.cos(a) * 1.6) - Math.PI / 2; }   // a low, flattened arch under the eaves
  // arched windows with a warm glow: either side of the door, on each side wall and on the back
  const glow = new THREE.MeshStandardMaterial({ color: 0xffd48a, emissive: 0xc07a20, emissiveIntensity: 0.8, roughness: 0.4 });
  const win = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 2.35, z); g.rotation.y = ry; H.add(g);
    const add = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); g.add(o); hallWallMats.push(o.material); folds.push(o); return o; };
    GLOW_MATS.push(add(B(1.1, 1.5, 0.2), glow.clone(), 0, 0, 0).material, add(new THREE.CylinderGeometry(0.55, 0.55, 0.2, 16, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), glow.clone(), 0, 0.75, 0).material);
    add(B(0.08, 2, 0.24), M(0x3a2a1a), 0, 0.25, 0); add(B(1.1, 0.08, 0.24), M(0x3a2a1a), 0, 0.2, 0);
    add(B(1.45, 0.2, 0.4), stoneM(0.6, 0.2, 0xb0a288), 0, -0.85, 0.06); };
  LIGHT_SPOTS.push([HALL.x, 2.6, HALL.z], [HALL.x, 2.6, HALL.z + 9]);
  win(-4.1, 5.85, 0); win(4.1, 5.85, 0); win(-6.85, -1.8, Math.PI / 2); win(-6.85, 2.2, Math.PI / 2); win(6.85, -1.8, -Math.PI / 2); win(6.85, 2.2, -Math.PI / 2); win(-3.4, -5.85, Math.PI); win(3.4, -5.85, Math.PI);
  // a little bell tower on the roof ridge (it rides on the roof, so it lifts away with it indoors)
  const tower = new THREE.Group(); tower.position.set(0, 7.2, 0); roofMesh.add(tower);
  const t1 = new THREE.Mesh(B(1.6, 1.4, 1.6), stoneM(0.8, 0.7, 0xd8c8a8)); t1.position.y = 0.7; tower.add(t1);
  for (const [x, z] of [[0, 0.81], [0, -0.81], [0.81, 0], [-0.81, 0]]) { const o = new THREE.Mesh(B(Math.abs(x) ? 0.05 : 0.7, 0.8, Math.abs(x) ? 0.7 : 0.05), M(0x1a1410)); o.position.set(x, 0.85, z); tower.add(o); }
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 10), M(0xc8962e)); bell.position.y = 0.95; tower.add(bell);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.6, 4), new THREE.MeshStandardMaterial({ map: roofTex, color: 0xb0503a, flatShading: true })); spire.position.y = 2.2; spire.rotation.y = Math.PI / 4; tower.add(spire);
  const vane = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 6), M(0xd8b048)); vane.position.y = 3.2; tower.add(vane);
  // the village banner: green cloth, gold trim and the Oak and the River, cut to a swallowtail at the bottom
  const bannerTexV = (() => { const W = 128, Hh = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d');
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, Hh); g.lineTo(W / 2, Hh * 0.84); g.lineTo(0, Hh); g.closePath(); g.fillStyle = '#4e7038'; g.fill();
    g.strokeStyle = '#d8b048'; g.lineWidth = 9; g.stroke(); g.fillStyle = '#d8b048'; g.fillRect(0, 0, W, 14);
    drawEmblem(g, W / 2, Hh * 0.42, 44, '#e2b84c', '#4e7038');
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const clothM = new THREE.MeshStandardMaterial({ map: bannerTexV, side: THREE.DoubleSide, alphaTest: 0.5, roughness: 1 });
  // outside, either side of the door: an iron pole sticking out of the wall, the banner hanging and drooping off it
  for (const sx of [-1, 1]) {
    const x = sx * 3.3, z = 5.95;
    P(B(0.08, 0.08, 0.9), M(0x2a2a30), x, 4.15, z + 0.4);
    P(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6).rotateZ(Math.PI / 2), M(0x2a2a30), x, 4.15, z + 0.82);
    for (const ex of [-0.78, 0.78]) P(new THREE.SphereGeometry(0.09, 8, 6), M(0xd8b048), x + ex, 4.15, z + 0.82);
    const geo = new THREE.PlaneGeometry(1.4, 2.8, 8, 16); geo.translate(0, -1.4, 0);
    const cloth = new THREE.Mesh(geo, clothM.clone()); cloth.position.set(x, 4.1, z + 0.85); H.add(cloth); hallWallMats.push(cloth.material);
    hallBanners.push({ cloth, base: Float32Array.from(geo.attributes.position.array), ph: sx * 1.3 });
  }
  // ----- inside -----
  // a long red runner with a gold border, from the door to the hearth
  const runner = (() => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = '#7a1e1a'; g.fillRect(0, 0, 64, 256); g.strokeStyle = '#d8b048'; g.lineWidth = 6; g.strokeRect(5, 5, 54, 246);
    for (let y = 30; y < 256; y += 40) { g.fillStyle = '#a8342a'; g.beginPath(); g.moveTo(32, y - 12); g.lineTo(44, y); g.lineTo(32, y + 12); g.lineTo(20, y); g.closePath(); g.fill(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  P(new THREE.PlaneGeometry(1.9, 9.2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: runner, roughness: 1 }), 0, 0.075, 0.4, false);
  // the hall's kitchen range against the north wall, for cooking
  const fire = stoveParts((geo, m, px, py, pz) => P(geo, m, px, py, pz, false), 0, -4.3, 4.2), hearth = fire;   // the hall's kitchen range, against the north wall
  fire.userData = { action: 'Cook', name: 'Range', rec: { kind: 'range', x: HALL.x, z: HALL.z - 3.0 * HS, s: 1.2, state: 'standing' } }; trees.push(fire);
  solidBoxes.push(box(-1.8, 1.8, -5.0, -3.8));
  hallLight = new THREE.PointLight(0xff9a40, 2.2, 14, 1.6); hallLight.position.set(0, 1.4, -3.0); H.add(hallLight);
  // tapestries of the village emblem either side of the hearth
  // two long feasting tables with benches, set with candles, bread and mugs
  const wood = 0x7a5232, dark = 0x4a2e18;
  for (const sx of [-1, 1]) {
    const tx = sx * 4.4;
    P(B(1.4, 0.18, 5.4), M(wood), tx, 1.15, -0.4, false);
    for (const iz of [-2.4, 0, 2.4]) for (const ix of [-0.5, 0.5]) P(B(0.16, 1.1, 0.16), M(dark), tx + ix, 0.55, -0.4 + iz, false);
    for (const bx of [-1, 1]) { P(B(0.45, 0.12, 5.0), M(wood), tx + bx * 0.95, 0.7, -0.4, false); for (const iz of [-2, 2]) P(B(0.12, 0.65, 0.12), M(dark), tx + bx * 0.95, 0.33, -0.4 + iz, false); }
    for (const iz of [-1.8, 0.2, 2.0]) { P(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 6), M(0xf4eedc), tx, 1.42, -0.4 + iz, false); P(B(0.08, 0.12, 0.08), fireMat, tx, 1.65, -0.4 + iz, false); }
    for (const iz of [-1.0, 1.1]) { P(new THREE.DodecahedronGeometry(0.25, 0), M(0xc8904a), tx - 0.25, 1.38, -0.4 + iz, false).scale.set(1.4, 0.7, 1); P(new THREE.CylinderGeometry(0.1, 0.09, 0.22, 8), M(0x8a8a92), tx + 0.3, 1.35, -0.4 + iz + 0.3, false); }
    solidBoxes.push(box(tx - 1.2, tx + 1.2, -3.2, 2.4));
  }
  // torches in iron brackets on the side walls
  for (const sx of [-1, 1]) for (const z of [-2.6, 2.6]) { P(B(0.35, 0.12, 0.12), M(0x2a2a30), sx * 5.85, 2.9, z); P(new THREE.CylinderGeometry(0.06, 0.05, 0.6, 6), M(0x5a3a1e), sx * 5.7, 3.1, z); P(new THREE.ConeGeometry(0.12, 0.35, 6), fireMat.clone(), sx * 5.7, 3.55, z); }   // on the walls, so they fold away with them
  // barrels in the front corners
  for (const sx of [-1, 1]) { for (const dz of [0, 0.95]) { P(new THREE.CylinderGeometry(0.42, 0.37, 0.95, 10), M(0x8a5a2a), sx * 5.2, 0.48, 3.6 + dz, false); P(new THREE.CylinderGeometry(0.44, 0.44, 0.07, 10), M(0x2a2a30), sx * 5.2, 0.75, 3.6 + dz, false); }
    solidBoxes.push(box(sx * 5.2 - 0.5, sx * 5.2 + 0.5, 3.1, 5.0)); }
  // a stone base and capital on the centre pillar
  P(B(1.4, 0.4, 1.4), stoneM(0.6, 0.2, 0xb0a288), 0, 0.2, 0, false); P(B(1.4, 0.35, 1.4), stoneM(0.6, 0.2, 0xb0a288), 0, 4.3, 0, false);
}
// the outside banners sway and ripple, more towards the bottom; the hearth light flickers
function updateHall(){
  const t = performance.now() / 1000;
  for (const b of hallBanners) {
    const pos = b.cloth.geometry.attributes.position, a = pos.array, base = b.base;
    for (let i = 0; i < a.length; i += 3) { const x = base[i], y = base[i + 1], down = Math.min(1, -y / 2.8);
      a[i + 2] = base[i + 2] + down * down * (0.35 * Math.sin(t * 1.6 + b.ph) + 0.12 * Math.sin(t * 3.7 + x * 3 + y * 2 + b.ph));
      a[i] = x + down * down * 0.12 * Math.sin(t * 1.1 + b.ph); }
    pos.needsUpdate = true; b.cloth.geometry.computeVertexNormals();
  }
  if (hallLight) hallLight.intensity = 2.0 + Math.sin(t * 11) * 0.25 + Math.sin(t * 17) * 0.15;
}
