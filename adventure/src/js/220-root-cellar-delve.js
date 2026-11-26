// ----- the Root Cellar delve: a solo instance far below the farm, eight waves of the farm's creatures -----
const DELVE_C = { x: 0, z: 400, pit: 14 };
const DELVE_WAVES = [['chicken'], ['rat'], ['cow'], ['farmer'], 'r2', 'r2', 'r2', ['farmer', 'farmer']];
let DELVE = null, delveBuilt = false;
const inDelveZone = (x, z) => z > 300;
function buildDelveArena(){
  if (delveBuilt) return; delveBuilt = true;
  const CX = DELVE_C.x, CZ = DELVE_C.z, PIT = DELVE_C.pit;
  let q = 9; const R = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const root = new THREE.Group(); root.position.set(CX, 0, CZ); scene.add(root);
  const add = (geo, m, x, y, z, parent = root) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const rock = [0x5a544c, 0x4a453e, 0x655e54, 0x3e3a34], wood = mat(0x6a4a2c), darkWood = mat(0x3e2a18), iron = mat(0x3a3a40);
  // the cavern floor, and the sand of the pit, raked smooth with a darker ring where fights have churned it
  add(new THREE.CylinderGeometry(30, 30, 0.3, 40), 0x3a3028, 0, -0.15, 0);
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(256, 256, 40, 256, 256, 256); gr.addColorStop(0, '#c8a878'); gr.addColorStop(0.7, '#b89868'); gr.addColorStop(0.9, '#8a7048'); gr.addColorStop(1, '#6a5438');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3000; i++) { const c = 140 + R() * 80; g.fillStyle = `rgba(${c},${c * 0.82},${c * 0.6},.45)`; g.fillRect(R() * 512, R() * 512, 1 + R() * 3, 1 + R() * 2); }
  for (let i = 0; i < 9; i++) { g.strokeStyle = 'rgba(90,40,30,.35)'; g.lineWidth = 2 + R() * 6; g.beginPath(); g.arc(150 + R() * 210, 150 + R() * 210, 6 + R() * 20, 0, 7); g.stroke(); }   // old stains
  const sandTex = new THREE.CanvasTexture(cv); sandTex.colorSpace = THREE.SRGBColorSpace;
  add(new THREE.CircleGeometry(PIT, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 }), 0, 0.02, 0);
  // the cavern walls: a ring of great rough boulders, stacked high, closing over into darkness
  for (let tier = 0; tier < 3; tier++) for (let i = 0; i < 34; i++) { const a = i / 34 * Math.PI * 2 + tier * 0.09, r = 27 + tier * 1.5 + R() * 1.5, s = 2.6 + R() * 1.6;
    add(new THREE.DodecahedronGeometry(s, 0), rock[(R() * 4) | 0], Math.cos(a) * r, 1 + tier * 3.2, Math.sin(a) * r).rotation.set(R() * 3, R() * 3, R() * 3); }
  // stalactites and roots hanging from the dark above
  for (let i = 0; i < 26; i++) { const a = R() * 7, r = 18 + R() * 9; add(new THREE.ConeGeometry(0.4 + R() * 0.6, 2 + R() * 3, 6), rock[(R() * 4) | 0], Math.cos(a) * r, 9.5, Math.sin(a) * r).rotation.x = Math.PI; }
  // makeshift stands up the cave sides, where shadowy rats crowd to watch
  for (const [a0, a1] of [[0.4, 1.3], [1.8, 2.7], [3.6, 4.4], [5.0, 5.9]]) for (let row = 0; row < 3; row++) for (let a = a0; a < a1; a += 0.16) {
    const r = 18.5 + row * 2.2, y = 0.5 + row * 0.9;
    add(new THREE.BoxGeometry(1.6, 0.18, 0.7), wood, Math.cos(a) * r, y, Math.sin(a) * r).rotation.y = -a;
    add(new THREE.BoxGeometry(0.15, y, 0.15), darkWood, Math.cos(a) * r, y / 2, Math.sin(a) * r);
    if (R() < 0.35) { const rat = new THREE.Group(); rat.position.set(Math.cos(a) * r, y + 0.1, Math.sin(a) * r); rat.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)) + Math.PI / 2; root.add(rat);
      add(new THREE.SphereGeometry(0.35, 8, 6), 0x2a2a2e, 0, 0.3, 0, rat).scale.set(1, 0.9, 1.4);
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3020 })); e.position.set(s * 0.12, 0.45, 0.42); rat.add(e); } }
  }
  // the palisade: sharpened stakes all round the pit, with gaps for the landing steps and the two monster gates
  const gaps = [[-Math.PI / 2, 0.22], [Math.PI / 2, 0.2], [0, 0.2]];   // north (the steps), south and east (the gates)
  const inGap = a => gaps.some(([c, w]) => Math.abs(Math.atan2(Math.sin(a - c), Math.cos(a - c))) < w);
  for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2; if (inGap(a)) continue;
    const h = 2.2 + R() * 0.6, st = add(new THREE.CylinderGeometry(0.16, 0.2, h, 6), wood, Math.cos(a) * PIT, h / 2, Math.sin(a) * PIT);
    add(new THREE.ConeGeometry(0.17, 0.5, 6), darkWood, Math.cos(a) * PIT, h + 0.25, Math.sin(a) * PIT); st.rotation.z = (R() - 0.5) * 0.08; }
  for (const y of [0.7, 1.6]) for (let i = 0; i < 60; i++) { const a = (i + 0.5) / 60 * Math.PI * 2; if (inGap(a)) continue;   // two rope-bound rails round the stakes
    const rl = add(new THREE.BoxGeometry(0.1, 0.12, PIT * 2 * Math.PI / 60), darkWood, Math.cos(a) * (PIT + 0.15), y, Math.sin(a) * (PIT + 0.15)); rl.rotation.y = -a; }
  // the monster gates: heavy barred doors in stone arches, with dark tunnels behind
  for (const a of [Math.PI / 2, 0]) { const G = new THREE.Group(); G.position.set(Math.cos(a) * (PIT + 0.4), 0, Math.sin(a) * (PIT + 0.4)); G.rotation.y = -a + Math.PI / 2; root.add(G);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(1, 4, 1), texMat(wallStone, 1, 2, 0x8a847a), s * 2.2, 2, 0, G);
    add(new THREE.BoxGeometry(5.4, 1, 1), texMat(wallStone, 2, 1, 0x8a847a), 0, 4.3, 0, G);
    add(new THREE.BoxGeometry(3.4, 3.8, 0.1), new THREE.MeshBasicMaterial({ color: 0x050302 }), 0, 1.9, 0.6, G);   // the tunnel's mouth
    for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.14, 3.6, 0.14), iron, -1.5 + i * 0.6, 1.9, -0.1, G);   // portcullis bars
    for (const y of [0.8, 2.2, 3.4]) add(new THREE.BoxGeometry(3.4, 0.14, 0.14), iron, 0, y, -0.1, G);
    for (let i = 0; i < 2; i++) { const sk = add(new THREE.SphereGeometry(0.28, 8, 6), 0xe8e0c8, (i ? 1 : -1) * 2.2, 4.95, -0.3, G); sk.scale.set(1, 0.85, 1.2); }   // cow skulls over the arch
  }
  // the landing: a raised wooden platform under the ladder, with steps down into the pit
  const P = new THREE.Group(); P.position.set(0, 0, -PIT - 3.5); root.add(P);
  add(new THREE.BoxGeometry(8, 1.2, 5), texMat(woodTex(), 4, 3, 0x8a6a48), 0, 0.6, 0, P);
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(3.2, 0.3, 0.8), wood, 0, 1.05 - i * 0.3, 2.9 + i * 0.75, P);   // steps down onto the sand
  for (const s of [-1, 1]) for (const z of [-2.2, 2.2]) add(new THREE.BoxGeometry(0.25, 2.6, 0.25), darkWood, s * 3.8, 1.3, z, P);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.12, 4.6), darkWood, s * 3.8, 2.3, 0, P);
  const L = new THREE.Group(); L.position.set(0, 1.2, -2.3); P.add(L);   // the ladder up to the hatch: the way out
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.14, 8, 0.14), darkWood, s * 0.5, 4, 0, L);
  for (let i = 0; i < 15; i++) add(new THREE.BoxGeometry(1, 0.08, 0.12), darkWood, 0, 0.4 + i * 0.52, 0, L);
  /* (the light shaft from the mockup is left out: it hid the ladder) */
  // braziers round the pit, and torches on the palisade: the only light down here
  const fireM = new THREE.MeshBasicMaterial({ color: 0xffa040 });
  for (const a of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) { const x = Math.cos(a) * (PIT - 1.6), z = Math.sin(a) * (PIT - 1.6);
    add(new THREE.CylinderGeometry(0.12, 0.2, 1.5, 6), iron, x, 0.75, z); add(new THREE.CylinderGeometry(0.75, 0.45, 0.5, 10), iron, x, 1.6, z);
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.28 + R() * 0.15, 0.8 + R() * 0.5, 6), fireM); f.position.set(CX + x + (R() - 0.5) * 0.5, 2.15, CZ + z + (R() - 0.5) * 0.5); root.add(f); f.position.x -= CX; f.position.z -= CZ; }
    LIGHT_SPOTS.push([CX + x, 3, CZ + z]); }   /* lit by the shared lamp lights, so no new lights (and no shader rebuild) */
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3; if (inGap(a)) continue; const x = Math.cos(a) * (PIT + 0.3), z = Math.sin(a) * (PIT + 0.3);
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 5), fireM); f.position.set(CX + x, 3.25, CZ + z); root.add(f); f.position.x -= CX; f.position.z -= CZ; add(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 5), darkWood, x, 2.85, z); }
  // farm junk turned into arena dressing: hay-bale barricades, cart wheels on the stakes, pitchforks, a scarecrow trophy, chains
  for (const [a, r] of [[0.9, 9], [2.3, 8.5], [4.0, 9.5], [5.4, 8]]) { const x = Math.cos(a) * r, z = Math.sin(a) * r;
    add(new THREE.BoxGeometry(2.2, 1, 1.1), 0xd8b850, x, 0.5, z).rotation.y = a; add(new THREE.BoxGeometry(1.1, 1, 1), 0xc8a840, x + Math.cos(a + 1.6) * 0.3, 1.5, z + Math.sin(a + 1.6) * 0.3).rotation.y = a + 0.3; }
  for (const a of [1.1, 2.0, 4.6, 5.6]) { const w = add(new THREE.TorusGeometry(0.8, 0.09, 5, 12), wood, Math.cos(a) * (PIT + 0.35), 1.6, Math.sin(a) * (PIT + 0.35)); w.rotation.y = -a + Math.PI / 2;
    for (let k = 0; k < 4; k++) { const sp = add(new THREE.BoxGeometry(0.06, 1.5, 0.06), wood, Math.cos(a) * (PIT + 0.35), 1.6, Math.sin(a) * (PIT + 0.35)); sp.rotation.set(0, -a + Math.PI / 2, k * Math.PI / 4); } }
  for (const a of [3.1, 3.4]) { const pf = add(new THREE.CylinderGeometry(0.04, 0.05, 2.4, 5), wood, Math.cos(a) * (PIT + 0.5), 1.4, Math.sin(a) * (PIT + 0.5)); pf.rotation.z = 0.35; }
  const sc = new THREE.Group(); sc.position.set(Math.cos(3.25) * (PIT + 1.6), 0, Math.sin(3.25) * (PIT + 1.6)); root.add(sc);
  add(new THREE.BoxGeometry(0.14, 3.2, 0.14), darkWood, 0, 1.6, 0, sc); add(new THREE.BoxGeometry(2.2, 0.12, 0.12), darkWood, 0, 2.5, 0, sc);
  add(new THREE.BoxGeometry(0.8, 1, 0.4), 0x5a4a3a, 0, 2.2, 0, sc); add(new THREE.SphereGeometry(0.4, 8, 6), 0xd8c898, 0, 3.1, 0, sc); add(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 10), 0xc8a850, 0, 3.4, 0, sc);
  for (let i = 0; i < 8; i++) { const a = R() * 7, l = add(new THREE.TorusGeometry(0.12, 0.03, 4, 8), iron, Math.cos(a) * (PIT + 0.2), 2.4 - i * 0.18, Math.sin(a) * (PIT + 0.2)); l.rotation.y = i % 2 ? 1.5 : 0; }
  // the ladder is the way out: click it to climb
  const lad = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8, 1.2), new THREE.MeshBasicMaterial({ visible: false })); lad.position.set(CX, 4, CZ - PIT - 5.8); scene.add(lad);
  lad.userData = { action: 'Climb', name: 'Ladder', rec: { kind: 'ladder', state: 'standing', x: CX, z: CZ - PIT + 1.5, onClick: () => delveLadder() } }; trees.push(lad);
}
// a small yes / no box
function delveAsk(html, yes, onYes, no = 'Not yet'){
  let el = document.getElementById('delveAsk');
  if (!el) { el = document.createElement('div'); el.id = 'delveAsk'; el.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:300px;max-width:calc(100vw - 32px);background:linear-gradient(180deg,rgba(48,36,20,.97),rgba(22,16,9,.97));border:2px solid #a07a3c;border-radius:6px;z-index:12;font:14px Georgia,serif;color:#e8efe6;padding:12px 14px;box-shadow:0 8px 24px rgba(0,0,0,.55)'; document.body.appendChild(el); }
  el.innerHTML = `${html}<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button data-a="n" style="font:inherit;padding:5px 12px;background:#3a2c18;color:#e8efe6;border:1px solid #7a5a2c;border-radius:4px;cursor:pointer">${no}</button><button data-a="y" style="font:inherit;padding:5px 12px;background:#7a5a24;color:#fff4d8;border:1px solid #c9a050;border-radius:4px;cursor:pointer">${yes}</button></div>`;
  el.hidden = false; el.onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; el.hidden = true; if (b.dataset.a === 'y') onYes(); };
}
function delveExitSpot(){ return { x: RUIN.cellar.x, z: RUIN.cellar.z + 2.7 }; }
function askDelve(){
  const pd = PARTY.d && PARTY.d.dv;
  if (pd && SNOW() - pd.on < 40 * 60000 && !pd.done && Object.keys(pd.who || {}).some(id => id !== ONLINE.id && !(pd.left && pd.left[id]) && !(pd.dead && pd.dead[id]) && remote[id] && inDelveZone(remote[id].tx, remote[id].tz))) { showToast("Your party is already down there. Wait for them to come back up."); return; }
  const near = partyNearCellar(), shut = partyNearCellar(true).filter(id => !near.includes(id)).map(id => escapeHtml(remote[id].name));
  const left = shut.length ? `<br><br>${shut.join(', ')} ${shut.length > 1 ? "haven't" : "hasn't"} unlocked the cellar yet and will stay up top.` : '';
  if (near.length) {
    delveAsk(`<div style="color:#f0c35a;font-size:16px;margin-bottom:6px;text-align:center">&#9888;&#65039; CELLAR CHALLENGE &#9888;&#65039;</div><div style="text-align:center">Lead your party down: ${near.map(id => escapeHtml(remote[id].name)).join(', ')} will be asked to join you.${left}<br><br>The creatures grow tougher with every one of you. Anyone who falls is out, and only those who pull their weight share the reward.<br><br>If defeated, you lose 25% of your coins and all delve XP.<br><br>Do you accept?</div>`, 'Accept', () => startPartyDelve(near), 'Cancel');
    return;
  }
  delveAsk(`<div style="color:#f0c35a;font-size:16px;margin-bottom:6px;text-align:center">&#9888;&#65039; CELLAR CHALLENGE &#9888;&#65039;</div><div style="text-align:center">Defeat 8 grueling waves using only what's in your bag!<br><br>If defeated, you lose 25% of your coins and all delve XP.<br><br>Do you accept?</div>`, 'Accept', startDelve, 'Cancel');
}
function startDelve(opts = {}){
  buildDelveArena(); if (FIGHT) endFight(); cancelChop(); if (EV.seat >= 0) standUp();
  walkTarget = null; walkQueue = []; walkThen = null;
  hero.position.set(DELVE_C.x, 0, DELVE_C.z - DELVE_C.pit + 2); heroShadow.position.set(hero.position.x, 0.06, hero.position.z); heroAnim.yaw = 0;
  DELVE = { wave: -1, mons: [], next: performance.now() + 4000, done: false, startXp: { m: SKILL_XP.Melee, h: SKILL_XP.Hitpoints }, party: opts.party || null, on: opts.on || 0, dmg: 0, heal: 0 };
  if (DELVE.party) hero.position.x += (Math.random() - 0.5) * 3;   /* not all on the same spot */   /* combat XP from the waves is only kept if you win */
  showToast(DELVE.party ? 'You climb down into the dark with your party. Something stirs behind the gates...' : 'You climb down into the dark. Something stirs behind the gates...'); addSystemLine('The Cellar: survive eight waves. The ladder behind you leads back up.');
  writePresence(true);
}
function spawnWave(){
  const w = DELVE_WAVES[DELVE.wave], kinds = w === 'r2' ? [0, 1].map(() => ['chicken', 'rat', 'cow'][Math.floor(Math.random() * 3)]) : w;
  const gates = [[DELVE_C.x, DELVE_C.z + DELVE_C.pit - 1.2], [DELVE_C.x + DELVE_C.pit - 1.2, DELVE_C.z]];
  DELVE.mons = kinds.map((k, i) => { const m = spawnMonster(k, gates[i % 2][0], gates[i % 2][1], 0); m.delve = true; return m; });
  showToast(`Wave ${DELVE.wave + 1} of 8: ${kinds.map(k => MONSTER_TYPES[k].name.toLowerCase()).join(' and ')}!`);
}
function clearDelveMonsters(){
  for (const m of DELVE ? DELVE.mons : []) { scene.remove(m.g); const i = trees.indexOf(m.g); if (i >= 0) trees.splice(i, 1); m.bar.remove(); const j = MONSTERS.indexOf(m); if (j >= 0) MONSTERS.splice(j, 1); }
}
function leaveDelve(msg){
  if (DELVE && DELVE.party) partyMark('left');
  if (FIGHT) endFight(); clearDelveMonsters(); if (DELVE && DELVE.chest) { scene.remove(DELVE.chest.g); const i = trees.indexOf(DELVE.chest.g); if (i >= 0) trees.splice(i, 1); } DELVE = null;
  const sp = delveExitSpot(); walkTarget = null; walkQueue = []; walkThen = null;
  hero.position.set(sp.x, 0, sp.z); heroShadow.position.set(sp.x, 0.06, sp.z);
  if (msg) showToast(msg); writePresence(true); saveNow(false);
}
function delveLadder(){
  if (!DELVE) return;
  if (DELVE.done && DELVE.chest && !DELVE.chest.opened) { delveAsk("You haven't opened the reward chest yet. Leave it behind?", 'Leave it', () => leaveDelve('You climb back up, leaving the chest unopened.'), 'Go back'); return; }
  if (DELVE.done) { leaveDelve('You climb back up into the daylight, your pack heavier than before.'); return; }
  delveAsk('<div style="color:#f0c35a;font-size:16px;margin-bottom:6px;text-align:center">&#9888;&#65039; FLEEING THE CHALLENGE &#9888;&#65039;</div><div style="text-align:center">Fleeing counts as a defeat! You will lose 25% of your coins and all delve XP.<br><br>Are you sure you want to flee?</div>', 'Flee', () => delveFailed(true), 'Keep fighting');
}
// a monster you aren't fighting still gets its blows in
function sideSwing(m){
  m.anim = { kind: 'swing', t0: performance.now(), dur: 900 }; combatSound((m.t.snd || 'goblin') + 'Attack'); mobHit(m, 'ms', 0, '');
  setTimeout(() => {
    if (!DELVE || m.state === 'dying' || m.state === 'dead' || HP.cur <= 0) return;
    const hp0 = HP.cur;
    const me = playerRolls(), it = monsterRolls(m.t);
    if (Math.random() < hitChance(it.att, me.def)) {
      const dmg = Math.floor(Math.random() * (it.maxHit + 1));
      if (dmg > 0) { HP.cur = Math.max(0, HP.cur - dmg); hitsplat(hero, dmg, 'hit'); combatSound('hit'); combatSound(look.gender === 'female' ? 'hurtF' : 'hurtM'); if (FIGHT) FIGHT.pAnim = { kind: 'hurt', t0: performance.now(), dur: 450 }; renderStats(); }
      else { hitsplat(hero, 0, 'block', 'Blocked'); combatSound(equipped.shield && equipped.shield !== 'Torch' || equipped.body || equipped.head ? 'clang' : 'thud'); }
    } else { hitsplat(hero, 0, 'miss', 'Miss'); combatSound('miss'); }
    mobHit(m, 'm', hp0 - HP.cur, HP.cur < hp0 ? 'hit' : 'miss');
    if (HP.cur <= 0) playerDies();
  }, 480);
}
function delveFailed(fled){
  if (DELVE && DELVE.party) partyMark(fled ? 'left' : 'dead');
  const lost = Math.floor(COINS * 0.25); COINS -= lost;
  const sx = DELVE.startXp, lm = Math.max(0, SKILL_XP.Melee - sx.m), lh = Math.max(0, SKILL_XP.Hitpoints - sx.h);
  SKILL_XP.Melee = Math.min(SKILL_XP.Melee, sx.m); SKILL_XP.Hitpoints = Math.min(SKILL_XP.Hitpoints, sx.h);
  renderBag(); leaveDelve(); HP.cur = maxHp(); renderStats();
  const xpBits = [lm && `${lm.toLocaleString()} Melee XP`, lh && `${lh.toLocaleString()} Hitpoints XP`].filter(Boolean);
  showToast(`${fled ? 'You flee the cellar.' : 'You black out... and wake up by the cellar doors.'} You lost ${lost.toLocaleString()} coins${xpBits.length ? ' and ' + xpBits.join(' and ') : ''}.`);
  addSystemLine(`Cellar challenge failed: -${lost.toLocaleString()} coins${xpBits.map(b => ', -' + b).join('')}.`);
}
function delveWon(){
  clearDelveMonsters(); DELVE.done = true; DELVE.mons = [];
  showToast('The cellar falls quiet. You have cleared all eight waves! A chest rises out of the sand...');
  addSystemLine('Open the chest in the middle of the pit to claim your reward.');
  spawnDelveChest();
}
// the reward chest: banded wood, a domed lid that swings open, and a golden glow inside
function spawnDelveChest(){
  const g = new THREE.Group(), cx = DELVE_C.x, cz = DELVE_C.z; g.position.set(cx, 0, cz); scene.add(g);
  const wood = texMat(woodTex(), 1, 1, 0xc08850), band = mat(0x55555c), gold = mat(0xe2b84c);
  wood.emissive = new THREE.Color(0x2a1808); gold.emissive = new THREE.Color(0x5a3a08);   /* a little glow of its own, so it reads in the dark pit */
  const add = (geo, m, x, y, z, parent = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  // a hollow box: floor and four walls, so there is a real inside
  const inner = mat(0x3a2414), T = 0.08, W = 1.6, D = 1.0, H = 0.9;
  add(new THREE.BoxGeometry(W, T, D), wood, 0, T / 2, 0);
  for (const z of [-1, 1]) add(new THREE.BoxGeometry(W, H, T), wood, 0, H / 2, z * (D - T) / 2);
  for (const x of [-1, 1]) add(new THREE.BoxGeometry(T, H, D - 2 * T), wood, x * (W - T) / 2, H / 2, 0);
  add(new THREE.BoxGeometry(W - 2 * T, 0.02, D - 2 * T), inner, 0, T + 0.01, 0);
  // iron bands round the outside walls only, never across the opening
  for (const x of [-0.55, 0.55]) { for (const z of [-1, 1]) add(new THREE.BoxGeometry(0.12, H - 0.04, 0.03), band, x, (H - 0.04) / 2, z * (D / 2 + 0.015)); add(new THREE.BoxGeometry(0.12, 0.03, D + 0.06), band, x, 0.015, 0); }
  add(new THREE.BoxGeometry(0.22, 0.12, 0.05), gold, 0, H - 0.08, D / 2 + 0.03);   // the catch on the front
  // the treasure: a heap of coins and a few gems, glowing softly once the lid is up
  const glow = new THREE.Group(); g.add(glow); glow.visible = false;
  const coinM = new THREE.MeshStandardMaterial({ color: 0xf0c040, emissive: 0x8a5a10, metalness: 0.6, roughness: 0.35, flatShading: true });
  const heap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), coinM); heap.scale.set(1.15, 0.45, 0.62); heap.position.y = 0.5; glow.add(heap);
  let qq = 5; const rr = () => (qq = (qq * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 26; k++) { const c = new THREE.Mesh(geo('chestCoin', () => new THREE.CylinderGeometry(0.075, 0.075, 0.02, 10)), coinM); const a = rr() * 6.28, rad = rr() * 0.6;
    c.position.set(Math.cos(a) * rad, 0.5 + 0.27 * (1 - rad / 0.6) * 1.0 + 0.02, Math.sin(a) * rad * 0.55); c.rotation.set(rr() * 0.8, rr() * 3, rr() * 0.8); glow.add(c); }
  for (const [col, x, z] of [[0xd02040, -0.3, 0.1], [0x2060e0, 0.25, -0.12], [0x30c060, 0.05, 0.18]]) { const gm = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4, metalness: 0.2, roughness: 0.2, flatShading: true })); gm.position.set(x, 0.74, z); glow.add(gm); }
  // the domed lid, hinged at the back: a closed half-cylinder with end caps, seen from both sides
  const lid = new THREE.Group(); lid.position.set(0, H, -D / 2); g.add(lid);
  const lidWood = wood.clone(); lidWood.side = THREE.DoubleSide;
  add(new THREE.CylinderGeometry(D / 2, D / 2, W, 14, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), lidWood, 0, 0, D / 2, lid);
  for (const x of [-1, 1]) { const cap = add(new THREE.CircleGeometry(D / 2, 14, 0, Math.PI), lidWood, x * W / 2, 0, D / 2, lid); cap.rotation.y = Math.PI / 2; }
  add(new THREE.BoxGeometry(W - 0.04, 0.03, D - 0.04), inner, 0, 0.015, D / 2, lid);   // the underside, dark wood
  for (const x of [-0.55, 0.55]) add(new THREE.CylinderGeometry(D / 2 + 0.02, D / 2 + 0.02, 0.12, 14, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), Object.assign(band.clone(), { side: THREE.DoubleSide }), x, 0, D / 2, lid);
  add(new THREE.BoxGeometry(0.2, 0.26, 0.05), gold, 0, 0.02, D + 0.03, lid);   // the clasp, hanging over the catch
  g.rotation.y = Math.PI;   // facing the ladder, where you come from
  g.scale.setScalar(0.01);
  const rec = { kind: 'chest', state: 'standing', x: cx, z: cz, s: 0.9, onClick: () => openDelveChest() };
  g.userData = { action: 'Open', name: 'Reward chest', rec }; trees.push(g);
  DELVE.chest = { g, lid, glow, born: performance.now(), opened: false, openAt: 0 };
  if (!LIGHT_SPOTS.some(p => p[0] === cx && p[2] === cz)) LIGHT_SPOTS.push([cx, 2.5, cz]);   /* a lamp light over the chest */
  updateDayNight.next = 0;
}
function chestSound(){
  const ctx = audio(); if (!ctx) return; const t = ctx.currentTime + 0.01;
  const out = ctx.createGain(); out.gain.value = 0.5; out.connect(sfxOut(ctx));
  // the latch clicks, the hinges creak, then a little shimmer of gold
  const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, 0.05); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500; const ng = ctx.createGain(); ng.gain.value = 0.7; n.connect(hp); hp.connect(ng); ng.connect(out); n.start(t);
  creak(true); setTimeout(() => creak(true), 380);
  [1318.5, 1568, 1975.5, 2637].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; const s0 = t + 0.9 + i * 0.09;
    g.gain.setValueAtTime(0.0001, s0); g.gain.linearRampToValueAtTime(0.25, s0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s0 + 0.9); o.connect(g); g.connect(out); o.start(s0); o.stop(s0 + 1); });
}
function openDelveChest(){
  const C = DELVE && DELVE.chest; if (!C || C.opened) return;
  // open it from whichever side you're nearest, at once if you're already beside it
  const cx = C.g.position.x, cz = C.g.position.z;
  const open = () => {
    if (C.opened) return; C.opened = true; C.openAt = performance.now();
    heroAnim.yaw = yawTo(hero.position.x, hero.position.z, C.g.position.x, C.g.position.z);
    chestSound();
    setTimeout(() => grantDelveRewards(), 1600);   // once the lid is up
  };
  if (Math.abs(hero.position.x - cx) < 2.4 && Math.abs(hero.position.z - cz) < 2.2) { walkTarget = null; walkQueue = []; open(); return; }
  const spot = [[0, -2.0], [0, 2.0], [-2.2, 0], [2.2, 0]].map(([dx, dz]) => ({ x: cx + dx, z: cz + dz })).filter(q => !blocked(q.x, q.z))
    .sort((a, b) => Math.hypot(a.x - hero.position.x, a.z - hero.position.z) - Math.hypot(b.x - hero.position.x, b.z - hero.position.z))[0] || { x: cx, z: cz - 2.0 };
  walkStart(new THREE.Vector3(spot.x, 0, spot.z), open);
}
function grantDelveRewards(){
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  quietLevelUps = true; addXp('Melee', 400); addXp('Hitpoints', 400); quietLevelUps = false;
  const rows = [], left = [];
  for (const [name, n] of [['Copper ore', r(5, 10)], ['Tin ore', r(5, 10)], ['Feathers', r(25, 50)], ['Wheat seeds', r(5, 10)]]) {
    const before = countOf(name); addItem(name, n, ICON_FOR[name]); const ok = countOf(name) - before >= n; if (!ok) dropToGround(name, n - (countOf(name) - before), DELVE_C.x + 1.5, DELVE_C.z - 1.5, true); rows.push(`<div class="qr"><span class="qi">${ICON_FOR[name]}</span>${n} ${name.toLowerCase()}${ok ? '' : ' <small style="color:#c05030">(on the ground)</small>'}</div>`); if (!ok) left.push(name);
  }
  if (DELVE && DELVE.chest) { const i = trees.indexOf(DELVE.chest.g); if (i >= 0) trees.splice(i, 1); DELVE.chest.g.userData.action = null; }
  questJingle(); renderStats(); saveNow(false);
  showRewardScroll({ banner: 'Delve complete', title: 'The Cellar', sub: 'All eight waves beaten, alone in the dark.',
    rewards: rows.join(''), xp: '<div class="qr">Melee<b>+400</b></div><div class="qr">Hitpoints<b>+400</b></div>',
    quote: '&ldquo;Cleared the whole cellar? On your own? Well I never. Keep whatever you found down there, you earned it.&rdquo; &mdash; Ezra' });
  if (left.length) addSystemLine('Your bag was too full for some of it, so it spilled onto the sand by the chest.');
  addSystemLine('Climb the ladder to leave the cellar.');
}
// the quest-complete scroll, reused for other rewards (the welcome quest's own text is put back when it is needed)
let QD_ORIG = null;
function showRewardScroll(o){
  const d = document.getElementById('questDone'), q = sel => d.querySelector(sel);
  if (!QD_ORIG) QD_ORIG = { banner: q('.qBanner').innerHTML, title: q('h1').innerHTML, sub: q('.qSub').innerHTML, cols: q('.qCols').innerHTML, quote: q('.qQuote').innerHTML };
  q('.qBanner').innerHTML = o.banner; q('h1').innerHTML = o.title; q('.qSub').innerHTML = o.sub;
  q('.qCols').innerHTML = `<div class="qBox"><h3>Rewards</h3>${o.rewards}</div><div class="qBox"><h3>Experience</h3>${o.xp}</div>`; q('.qQuote').innerHTML = o.quote;
  d.hidden = false;
}
function restoreQuestScroll(){ if (!QD_ORIG) return; const d = document.getElementById('questDone'), q = sel => d.querySelector(sel);
  q('.qBanner').innerHTML = QD_ORIG.banner; q('h1').innerHTML = QD_ORIG.title; q('.qSub').innerHTML = QD_ORIG.sub; q('.qCols').innerHTML = QD_ORIG.cols; q('.qQuote').innerHTML = QD_ORIG.quote; }
function updateDelveChest(){
  const C = DELVE && DELVE.chest; if (!C) return;
  const now = performance.now(), k = Math.min(1, (now - C.born) / 900);
  C.g.scale.setScalar(1.5 * Math.max(0.01, 1 - Math.pow(1 - k, 3)));   // pops up out of the sand
  if (C.opened) { const o = Math.min(1, (now - C.openAt) / 1300); const e = o < 0.25 ? o * 0.3 : 0.075 + (1 - Math.pow(1 - (o - 0.25) / 0.75, 2)) * 0.925;   // a stiff first lift, then it swings up
    C.lid.rotation.x = -1.9 * e; C.glow.visible = o > 0.2; }
}
// the wave counter at the top of the screen, for the whole delve
let waveHudKey = '';
function updateWaveHud(){
  const el = document.getElementById('waveHud'), now = performance.now();
  if (!DELVE) { if (!el.hidden) { el.hidden = true; waveHudKey = ''; } return; }
  const N = DELVE_WAVES.length, alive = DELVE.mons.filter(m => m.state !== 'dying' && m.state !== 'dead').length;
  const beaten = DELVE.done ? N : Math.max(0, DELVE.wave + (DELVE.wave >= 0 && !alive ? 1 : 0)), cur = DELVE.done ? -1 : (alive ? DELVE.wave : -1);
  const title = DELVE.done ? 'Cellar cleared!' : DELVE.wave < 0 ? 'Get ready...' : `Wave ${Math.min(N, DELVE.wave + 1)} of ${N}`;
  const wait = DELVE.next && isFinite(DELVE.next) ? Math.max(0, Math.ceil((DELVE.next - now) / 1000)) : 0;
  const next = DELVE_WAVES[DELVE.wave + 1], say = w => w === 'r2' ? 'two creatures' : w.length > 1 ? 'two angry farmers' : 'a ' + MONSTER_TYPES[w[0]].name.toLowerCase();
  const sub = DELVE.done ? (DELVE.chest && !DELVE.chest.opened ? 'Open the chest to claim your reward' : 'Climb the ladder to leave') : alive ? `${alive} left` : wait ? `Next: ${next ? say(next) : '...'} in ${wait}` : '';
  const key = title + '|' + beaten + '|' + cur + '|' + sub; if (key === waveHudKey) return; waveHudKey = key;
  el.innerHTML = `<div class="wTitle">${title}</div><div class="wPips">${Array.from({ length: N }, (_, i) => `<i class="${i < beaten ? 'done' : i === cur ? 'now' : ''}"></i>`).join('')}</div>${sub ? `<div class="wSub">${sub}</div>` : ''}`;
  el.hidden = false;
}
function updateDelve(){
  updateWaveHud();
  if (!DELVE || !hero) return;
  if (DELVE.party) { updatePartyDelve(); return; }
  const now = performance.now(), dt = Math.min(0.25, (now - (DELVE.last || now)) / 1000); DELVE.last = now;
  if (DELVE.done) { updateDelveChest(); return; }
  const alive = DELVE.mons.filter(m => m.state !== 'dying' && m.state !== 'dead');
  if (!alive.length) {
    if (DELVE.wave >= 0 && !DELVE.next) { if (DELVE.wave === DELVE_WAVES.length - 1) { setTimeout(() => DELVE && delveWon(), 1500); DELVE.next = Infinity; return; } DELVE.next = now + 5000; showToast(`Wave ${DELVE.wave + 1} beaten! The next one comes in 5 seconds.`); }
    if (now > DELVE.next) { const dead = DELVE.mons; clearDelveMonsters(); DELVE.mons = []; DELVE.wave++; DELVE.next = 0; spawnWave(); }
    return;
  }
  // multi-combat: they all come for you, each from its own side; you fight one, the others hit you too
  const lead = FIGHT && alive.includes(FIGHT.m) ? FIGHT.m : null;
  const leadA = lead ? Math.atan2(lead.g.position.x - hero.position.x, lead.g.position.z - hero.position.z) : 0;
  alive.forEach((m, i) => {
    const reach = reachOf(m);
    if (m.anim && now - m.anim.t0 < m.anim.dur) monsterPose(m, m.anim.kind, (now - m.anim.t0) / m.anim.dur);
    if (lead === m) return;
    // where to stand: straight at you if nobody is fighting you yet, otherwise round your other side
    let tx = hero.position.x, tz = hero.position.z, want = reach;
    if (lead) { const a = leadA + (i % 2 ? 1 : -1) * Math.PI * 0.6; tx += Math.sin(a) * reach; tz += Math.cos(a) * reach; want = 0.15; }
    const dx = tx - m.g.position.x, dz = tz - m.g.position.z, d = Math.hypot(dx, dz);
    if (d > want + 0.1) { const st = Math.min(d - want, 3.2 * dt); m.g.position.x += dx / d * st; m.g.position.z += dz / d * st; turnChibi(m.g, Math.atan2(dx, dz)); if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'walk'); }
    else {
      m.g.rotation.y = yawTo(m.g.position.x, m.g.position.z, hero.position.x, hero.position.z);
      if (!m.anim || now - m.anim.t0 >= m.anim.dur) monsterPose(m, 'ready');
      if (!FIGHT && !walkTarget && m.state === 'standing') { m.state = 'engaged'; FIGHT = { m, nextP: now + 600, nextM: now + 1200, pAnim: null, mAnim: null }; heroAnim.yaw = yawTo(hero.position.x, hero.position.z, m.g.position.x, m.g.position.z); setAct({ k: 'fight', n: m.name, t: Date.now() }); }
      else if (FIGHT && FIGHT.m !== m && Math.hypot(hero.position.x - m.g.position.x, hero.position.z - m.g.position.z) < reach + 0.5) {
        if (!m.nextHit) m.nextHit = now + 900 + Math.random() * 600;
        if (now > m.nextHit) { m.nextHit = now + m.t.speed; sideSwing(m); }
      }
    }
    m.x = m.g.position.x; m.z = m.g.position.z;
  });
}
function cellarClick(){
  if (!cellarOpen()) {
    showToast(`The cellar doors are chained shut. The padlock is scratched with marks: Chickens ${Math.min(10, KILLS.chicken)}/10, Cows ${Math.min(10, KILLS.cow)}/10, Giant rats ${Math.min(10, KILLS.rat)}/10, Angry farmers ${Math.min(10, KILLS.farmer)}/10.`);
    return;
  }
  const C = RUIN.cellar;
  if (Math.hypot(hero.position.x - C.x, hero.position.z - C.z) < 3.6) { walkTarget = null; walkQueue = []; heroAnim.yaw = yawTo(hero.position.x, hero.position.z, C.x, C.z); askDelve(); return; }
  const spots = [[0, 2.7], [2.9, 0], [-2.9, 0], [2.4, 2.2], [-2.4, 2.2]].map(([dx, dz]) => ({ x: C.x + dx, z: C.z + dz })).filter(q => !blocked(q.x, q.z))
    .sort((a, b) => Math.hypot(a.x - hero.position.x, a.z - hero.position.z) - Math.hypot(b.x - hero.position.x, b.z - hero.position.z));
  const q = spots[0] || { x: C.x, z: C.z + 2.7 };
  walkStart(new THREE.Vector3(q.x, 0, q.z), askDelve);
}
function updateCellar(){ if (RUIN.chain) { const open = cellarOpen(); RUIN.chain.visible = !open; RUIN.doors.forEach((d, i) => { d.rotation.z = open ? (i ? -1.95 : 1.95) : 0; }); for (let i = 0; i < 4; i++) RUIN.pit['r' + i].visible = open; } }   /* thrown right open, showing the dark below */
