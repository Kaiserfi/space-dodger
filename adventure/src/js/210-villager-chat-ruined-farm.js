// remarks villagers say out loud now and then when you are nearby
const BARKERS = [], NPC_SPOTS = [];
let nextBark = performance.now() + 5000;
const barkV = new THREE.Vector3();
// guards sat at the mess table chat with each other instead of calling out: a random exchange, line by line, in their bubbles
const TABLE_TALK = [
  [[0, "Pass the bread."], [1, "Brenna's?"], [0, "Is there any other kind?"]],
  [[0, "Rennick asked me for a spoon again."], [1, "Don't you dare."], [0, "I gave him a fork. Seemed safer."]],
  [[0, "Pip's been at the well again."], [1, "Of course he has."], [0, "Said he was looking for frogs."], [1, "In a well?"]],
  [[0, "Heard something out past the woods last night."], [1, "Goblins?"], [0, "Or Hobb's socks. Hard to say."]],
  [[0, "Aldric snored through the whole bell this morning."], [1, "Don't let him hear you say that."], [0, "He wouldn't. He's asleep."]],
  [[0, "Bram tried to give me another cabbage."], [1, "Did it have a name?"], [0, "Gerald."], [1, "Poor Gerald."]],
  [[0, "This stew's cold."], [1, "That's breakfast."], [0, "...Oh."]],
  [[0, "Truffle got out again."], [1, "Where'd she end up?"], [0, "Mara's shop. Sat in the bucket aisle like she owned it."]],
  [[0, "My boots are still wet from that rain."], [1, "Stuff 'em with straw."], [0, "Then my feet'll itch."], [1, "Then don't complain."]],
  [[0, "Think Rennick's actually innocent?"], [1, "Did you see him sell Bram his own cabbages?"], [0, "Fair point."]],
  [[0, "Hilde's hens were loose by the bonfire."], [1, "All of them?"], [0, "All but the brown one. She's got sense."]],
  [[0, "Quiet night."], [1, "Don't say that."], [0, "Why?"], [1, "Because then it won't be."]],
];
// round the bonfire in the evening: Tobin, Ysolde and Dunmore, each in their own voice (only chats whose speakers are all there)
const BONFIRE_TALK = [
  [['Dunmore', "Catch anything today, Ysolde?"], ['Ysolde', "Three bream and Fenwick's pride."], ['Tobin', "Again?"]],
  [['Tobin', "Chopped four trees today."], ['Dunmore', "Four?"], ['Tobin', "Well. One. Four times."]],
  [['Ysolde', "Fenwick's telling everyone he caught a fish as long as a horse."], ['Dunmore', "Wasn't it a boot?"], ['Ysolde', "It's grown. Now it's a horse-sized boot."]],
  [['Dunmore', "Still no word from the master."], ['Tobin', "Eleven years now, isn't it?"], ['Dunmore', "Twelve, come spring. I've stopped setting his place."]],
  [['Tobin', "Lovely and warm, this."], ['Ysolde', "You're asleep, Tobin."], ['Tobin', "Resting my eyes."]],
  [['Ysolde', "Jory took my whole catch today."], ['Dunmore', "What's he want with that much bream?"], ['Ysolde', "Sells it on. I took the coin."]],
  [['Dunmore', "Lost another eyebrow at the forge."], ['Ysolde', "Which one?"], ['Dunmore', "The good one."]],
  [['Tobin', "Pip asked for a go with my axe."], ['Dunmore', "Tell me you said no."], ['Tobin', "I told him to ask Brenna. Same thing."]],
  [['Ysolde', "Something big's been rippling the pond."], ['Tobin', "Fish?"], ['Ysolde', "Hope so."]],
  [['Dunmore', "Bertram's brought his sword in for grinding again."], ['Tobin', "What's he been hitting?"], ['Dunmore', "Cabbages, I reckon."]],
  [['Tobin', "Think Rennick did it?"], ['Ysolde', "He tried to sell me my own net last week."], ['Tobin', "So yes."]],
  [['Ysolde', "Mind your boots, Dunmore, they're smoking."], ['Dunmore', "They always smoke."], ['Ysolde', "More than usual."]],
];
const TALK_AT = { table: { pool: () => TABLE_TALK }, bonfire: { pool: () => BONFIRE_TALK } };
// people sat together chat with each other instead of calling out: a random exchange, line by line, in their bubbles.
// Each place (the mess table, the bonfire) runs its own chat. Lines go to a role (0, 1) or to someone by name.
for (const k in TALK_AT) Object.assign(TALK_AT[k], { lines: null, i: 0, who: null, next: performance.now() + 4000, last: -1 });
function tableTalk(now){
  if (!hero) return;
  for (const at in TALK_AT) { const T = TALK_AT[at];
    if (!T.lines) {
      if (now < T.next) continue;
      const sat = BARKERS.filter(b => b.rec.sitting && b.rec.chatAt === at && !b.el && b.sp.getWorldPosition(barkV).distanceTo(hero.position) < 24 && dlg !== b.rec);
      const pool = T.pool().map((c, k) => [c, k]).filter(([c]) => typeof c[0][0] === 'number' ? sat.length >= 2 : c.every(([n]) => sat.some(b => b.rec.name === n)));
      if (!pool.length) { T.next = now + 3000; continue; }
      let pick = pool[Math.floor(Math.random() * pool.length)]; if (pick[1] === T.last && pool.length > 1) pick = pool.find(p => p[1] !== T.last);
      const [c, k] = pick; T.last = k; T.lines = c; T.i = 0; T.next = now;
      if (typeof c[0][0] === 'number') { const a = sat.splice(Math.floor(Math.random() * sat.length), 1)[0]; T.who = [a, sat[Math.floor(Math.random() * sat.length)]]; }
      else T.who = Object.fromEntries(sat.map(b => [b.rec.name, b]));
    }
    if (now < T.next) continue;
    const [who, text] = T.lines[T.i] || [], b = who !== undefined && T.who[who];
    if (!b || !b.rec.sitting || dlg === b.rec) { T.lines = null; T.next = now + 8000; continue; }   // someone got up (or is being talked to): the chat ends
    if (b.el) b.el.remove();
    b.el = document.createElement('div'); b.el.className = 'npcBub'; b.el.textContent = text; document.body.appendChild(b.el);
    b.until = now + 2200 + text.length * 55; T.next = b.until + 300; T.i++;
    if (T.i >= T.lines.length) { T.lines = null; T.next = b.until + 9000 + Math.random() * 9000; }   // a pause before the next chat
  }
}
function updateBarks(){
  const now = performance.now();
  tableTalk(now);
  if (hero && now > nextBark) {
    nextBark = now + 5000 + Math.random() * 8000;
    const near = BARKERS.filter(b => b.rec.barks && !b.rec.asleep && !b.rec.sitting && !b.el && b.sp.getWorldPosition(barkV).distanceTo(hero.position) < 24 && dlg !== b.rec);
    if (near.length) {
      const b = near[Math.floor(Math.random() * near.length)];
      b.el = document.createElement('div'); b.el.className = 'npcBub'; b.el.textContent = b.rec.barks[Math.floor(Math.random() * b.rec.barks.length)];
      document.body.appendChild(b.el); b.until = now + 3000 + b.el.textContent.length * 55;   // longer lines stay up longer
    }
  }
  for (const b of BARKERS) {
    if (!b.el) continue;
    if (now > b.until) { b.el.remove(); b.el = null; continue; }
    b.sp.getWorldPosition(barkV); barkV.y += 4.4 * (b.sp.scale.x / CHIBI_SCALE);
    barkV.project(camera);
    b.el.style.display = barkV.z < 1 ? 'block' : 'none';
    b.el.style.left = (barkV.x + 1) / 2 * innerWidth + 'px'; b.el.style.top = (-barkV.y + 1) / 2 * innerHeight + 'px';
    b.el.style.opacity = Math.min(1, (b.until - now) / 400);
  }
}
function populateVillage(){
  // the village green, in the open ground west of the hall
  const hub = [-36, 8];
  well(hub[0], hub[1]);
  solidBoxes.push({ x0: hub[0] - 1.5, x1: hub[0] + 1.5, z0: hub[1] - 1.5, z1: hub[1] + 1.5 });   // at least 2x2 round the well
  // houses, spread well apart
  const h1 = house(-62, -4, 5.5, 5, 0x9a6a44, 0x7a2e2e, 0, (g, h) => addNpc(g, h, 0.5, -0.8, VILLAGERS[0]));
  const h2 = house(-52, 34, 5, 5.5, 0x8a7a5a, 0x3a5a7a, 0, (g, h) => addNpc(g, h, 0.4, -0.6, VILLAGERS[1]));
  const h3 = house(-22, -4, 5, 4.5, 0x9a7a5a, 0x5a3a7a, 0, (g, h) => addNpc(g, h, -0.4, -0.6, VILLAGERS[2]));
  const h4 = house(-30, 40, 5.5, 4.5, 0x7a6a5a, 0x6a3a2a, Math.PI / 2);   // turned, with its doorway facing the hall
  const smithyHouse = house(38, 46, 6, 5, 0x8a6a4a, 0x5a3a2a, 0, furnishSmithy);   // the smithy, its own building
  const store = house(-75, 52, 4.5, 3.8, 0x8a7a6a, 0x3a6a5a, Math.PI / 2, furnishStore);
  buildBarracks();   // the guards' barracks and the jail, south-west of the bonfire
  buildFishShop();   // Jory's fishing shack, by the pond   // Mara's general store, out in the open ground to the south-west, its door facing east
  // the roads: one network from the village green, each house reached by its front door
  const G = hub;
  const D = h => [h.door.x, h.door.z];
  // a short straight run out from each door, so every path meets its doorway head on
  const out = (h, n = 3) => { const dx = h.door.x - h.x, dz = h.door.z - h.z, L = Math.hypot(dx, dz) || 1;
    const fx = Math.abs(dx) > Math.abs(dz) ? Math.sign(dx) : 0, fz = fx ? 0 : Math.sign(dz);   // the door faces along one axis
    return [h.door.x + fx * n, h.door.z + fz * n]; };
  cobbleDisc(G[0], G[1], 5);                                           // the cobbled green round the well
  for (const h of [h1, h2, h3, h4, smithyHouse, store]) cobbleDisc(h.door.x, h.door.z, 1.3);   // a stone step at every door
  roadPath([G, [-48, 7], out(h1), D(h1)]);                             // the far west house
  roadPath([G, [-28, 5], out(h3), D(h3)]);                             // the north house
  roadPath([G, [-42, 20], [-42, 44], [-46, 47], out(h2), D(h2)]);      // the south-west house, between the two southern houses
  roadPath([G, [-26, 18], [-18, 28], out(h4), D(h4)]);                 // the turned house, round its east side
  roadPath([[-46, 47], [-40, 52], [-28, 53], [-18, 48], out(h4)]);      // a back lane joining the two southern houses
  roadPath([out(h1), [-62, 9], [-72, 7], [-84, 6]]);                   // west past the first house to the woods
  roadPath([G, [-24, 12], [-6, 14], [6, 13], [14.5, 12]]);              // east to the hall door
  roadPath([[14.5, 12], [22, 16], [26, 30], [26, 54], [30, 58], out(smithyHouse), D(smithyHouse)]);   // the smithy, out to the south-east
  roadPath([[26, 54], [23, 59], [QUARRY.x + 8.6, QUARRY.z - 9.6]]);   // south-west to the quarry gate
  roadPath([G, [-34, -2], [-36, -9.5]]);                               // north to the fishing bank
  roadPath([[-13, 13.2], [-11.5, 6], [-10, -2], [-10, -10.4]]);         // off the hall road, north to the bridge, clear of the north house
  roadPath([[-58, 51], [-61, 60], [-66, 69], [-72.5, 78]]);            // south from the back lane to the pond
  roadPath([[-66, 69], [-57, 80], [-55.5, 90], [-56.5, 97.6], [-63, 97.6]]);   // round the east side of Jory's shack to his counter
  roadPath([[-46, 47], [-58, 51], out(store), D(store)]);
  roadPath([[-40, 52], [-38, 55], [-38, 58.6]]); cobbleDisc(-38, 58.4, 2.2);   // off the back lane to the barracks door           // Mara's store, off the back lane to the south-west
  // the woodland, far to the west
  [[-96, -6], [-92, 4], [-98, 14], [-90, 24], [-94, 34], [-86, -12], [-100, 44], [-88, 30]].forEach(([x, z]) => makeTree(x, z, 1.6));
  buildQuarry();
  // the fishing spot in the river
  // the townsfolk, out and about
  // props step off the paths (a path is 2.2 wide, so its edge is 1.1 from the centre line)
  buildFarmland(); farmRoads(); buildFarmPens(); buildRuinedFarm();   // the fields east of the farm, before the props are placed
  bonfireRoads();   // laid before the props, so lamps, benches and barrels keep off these paths too
  const off = (x, z, r) => offPath(x, z, 1.1 + r);
  const [wbx, wbz] = off(-30, 14.6, 1.6);
  const wenna = TOWNSFOLK.find(f => f.name === 'Wenna'); wenna.x = wbx; wenna.z = wbz;
  for (const f of TOWNSFOLK) addWorldNpc(f.x, f.z, f);
  buildFarm();
  spawnFarmMonsters();
  // trees and oaks scattered between the hall, the farm and the smithy, kept clear of roads and buildings
  const nearRoad = (x, z) => ROADS.some(([x0, z0, x1, z1]) => { const dx = x1 - x0, dz = z1 - z0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - x0 - dx * t, z - z0 - dz * t) < 3.2; });
  [[30, 25], [33, 30, 1], [25, 28], [29, 36], [40, 27], [46, 22, 1], [50, 28], [55, 21], [57, 32, 1], [45, 35], [50, 40], [54, 37, 1], [60, 26],
   [64, 52, 1], [58, 60], [70, 57], [62, 68, 1], [53, 73], [72, 45], [69, 77], [57, 82, 1], [77, 66], [78, 52, 1]]
    .forEach(([x, z, oak]) => { if (!treeRecs.some(t => t.kind === 'tree' && Math.hypot(t.x - x, t.z - z) < 8) && !nearRoad(x, z) && !blocked(x, z) && !blocked(x + 1.5, z) && !blocked(x - 1.5, z) && !blocked(x, z + 1.5) && !blocked(x, z - 1.5)) makeTree(x, z, oak ? 1.5 : 1.3, !!oak); });
  // things that make the green feel lived in: market stalls, benches, a signpost, lamps, barrels and crates
  const spots = [];
  for (const [sx, sz, col] of [[-46.5, 12, 0xb04a3a], [-47, 17, 0x3a6a9a]]) { const [x, z] = off(sx, sz, 1.9); stall(x, z, col); solidBoxes.push({ x0: x - 1.7, x1: x + 1.7, z0: z - 1, z1: z + 1 }); spots.push([x, z]); }
  bench(wbx, wbz, Math.PI); spots.push([wbx, wbz]);
  { const [x, z] = off(-33.5, 1.2, 1.6); bench(x, z, 0.4); spots.push([x, z]); }
  { const [x, z] = off(-27.5, 16.2, 1.8); signpost(x, z); spots.push([x, z]); }
  for (const [lx, lz] of [[-18, 16.2], [-4, 16.8], [7.5, 16.2], [-31.5, 4], [-41.5, 11], [24.5, 13]]) { const [x, z] = off(lx, lz, 1.0); lamp(x, z); }
  for (const [bx, bz] of [[-57.5, 6], [-56.4, 6.8], [34, 56.5], [35.2, 57.5], [-46.5, 46], [-20, 44]]) { const [x, z] = off(bx, bz, 0.7); barrel(x, z); }
  for (const [cx, cz, ry] of [[-45, 14.5, 0.2], [-44.6, 15.6, 0.7], [41.5, 57, 0.3]]) { const [x, z] = off(cx, cz, 0.8); crate(x, z, ry); }
  NPC_SPOTS.push(...spots);
  addFishSpot(-36, -13.4);
  for (const a of [-0.2, 0.4]) { const r = pondR(a) - 1.1; addFishSpot(POND.x + Math.cos(a) * r, POND.z + Math.sin(a) * r * POND.k, 'bream'); }   // bream in the pond, off its east bank, near Jory's shack
  buildWaterside();
  buildPondSide();
  buildNorth();   // across the river: the bridge, the uplands, iron, trout and the rats' ground
  scatterOaks();
  paintPaths();
  setTimeout(buildGrass, 0);   // once the farm, props and paths are all placed
  decoratePaths();
}
// ----- the ruined farm: dead land south of the pens, where the rats and the angry farmers roam, and the burnt farmhouse with its root cellar -----
const RUIN = { x0: 60, x1: 110, z0: 35, z1: 82, house: { x: 86, z: 74 }, cellar: { x: 86, z: 83.2 } };   /* the cellar sits just south of the farmhouse */
const RUIN_S = 1.6;   /* the farmhouse ruin is built at this scale */
const inRuin = (x, z) => x > RUIN.x0 && x < RUIN.x1 && z > RUIN.z0 && z < RUIN.z1;
const KILLS = { chicken: 0, cow: 0, rat: 0, farmer: 0 };   // how many of each farm creature you've beaten, for the cellar's padlock
const cellarOpen = () => ['chicken', 'cow', 'rat', 'farmer'].every(k => KILLS[k] >= 10);
function buildRuinedFarm(){
  let q = 77; const R = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const add = (geo, m, x, y, z, parent = town) => { const o = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const charred = mat(0x2a221c), oldWood = mat(0x6a5a48), stoneM = texMat(wallStone, 1, 1, 0x9a948a);
  // abandoned fields: dry furrows with a few withered stalks still standing
  for (const [fx, fz, rows] of [[70, 44, 5], [97, 48, 4], [72, 62, 4]]) for (let r = 0; r < rows; r++) {
    add(new THREE.BoxGeometry(9, 0.16, 0.9), 0x5a4632, fx, 0.08, fz + r * 1.6);
    for (let i = 0; i < 9; i++) if (R() < 0.45) { const st = add(new THREE.CylinderGeometry(0.025, 0.03, 0.6 + R() * 0.5, 4), 0x9a8a62, fx - 4 + i, 0.4, fz + r * 1.6); st.rotation.z = (R() - 0.5) * 0.9; st.castShadow = false; }
  }
  // broken fences: leaning posts and the odd rail left hanging
  for (const [x0, z0, x1, z1] of [[64, 52, 76, 52], [100, 40, 108, 46], [66, 70, 66, 78], [102, 60, 108, 70]]) {
    const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 2.2);
    for (let i = 0; i <= n; i++) { if (R() < 0.25) continue; const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n;
      const p = add(new THREE.BoxGeometry(0.22, 1.3, 0.22), 0x5a4a38, x, 0.6, z); p.rotation.set((R() - 0.5) * 0.5, 0, (R() - 0.5) * 0.6);
      if (i < n && R() < 0.5) { const L = Math.hypot(x1 - x0, z1 - z0) / n, rl = add(new THREE.BoxGeometry(0.1, 0.12, L), 0x6a5a44, x + (x1 - x0) / n / 2, 0.5 + R() * 0.5, z + (z1 - z0) / n / 2); rl.rotation.y = Math.atan2(x1 - x0, z1 - z0); rl.rotation.x = (R() - 0.5) * 0.5; } }
  }
  // dead trees: bare grey trunks with a few crooked branches
  for (const [x, z] of [[63, 40], [107, 36], [78, 54], [104, 76], [64, 66], [92, 58], [74, 79]]) {
    const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = R() * 6; town.add(t);
    add(new THREE.CylinderGeometry(0.22, 0.38, 3.6, 6), 0x4a4038, 0, 1.8, 0, t);
    for (let i = 0; i < 4; i++) { const b = add(new THREE.CylinderGeometry(0.05, 0.12, 1.6, 5), 0x4a4038, 0, 2.6 + i * 0.3, 0, t); b.rotation.set(0.6 + R() * 0.5, i * 1.7, 0); b.position.x = Math.sin(i * 1.7) * 0.45; b.position.z = Math.cos(i * 1.7) * 0.45; }
    solidAt(x, z, 0.5);
  }
  // a cart on its side with a wheel off, and a fallen scarecrow
  const cart = new THREE.Group(); cart.position.set(100, 0, 56); cart.rotation.set(0, 0.6, 1.3); town.add(cart);
  add(new THREE.BoxGeometry(2.4, 0.9, 1.4), oldWood, 0, 0.5, 0, cart); add(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 10).rotateX(Math.PI / 2), oldWood, 0.6, -0.1, 0.8, cart);
  add(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 10), oldWood, 98.2, 0.06, 58.4); solidAt(100, 56, 1.3);
  const sc = new THREE.Group(); sc.position.set(70, 0.2, 48); sc.rotation.set(0, 0.4, Math.PI / 2 - 0.1); town.add(sc);
  add(new THREE.BoxGeometry(0.12, 2.4, 0.12), 0x5a4a38, 0, 1.2, 0, sc); add(new THREE.BoxGeometry(1.8, 0.1, 0.1), 0x5a4a38, 0, 1.8, 0, sc); add(new THREE.BoxGeometry(0.7, 0.8, 0.35), 0x5a5a62, 0, 1.6, 0, sc); add(new THREE.IcosahedronGeometry(0.28, 0), 0xb0a080, 0, 2.35, 0, sc);
  // the burnt farmhouse: a scorched floor, the stubs of stone walls, a standing chimney and charred beams
  const H = RUIN.house, S = RUIN_S, house = new THREE.Group(); house.position.set(H.x, 0, H.z); house.scale.setScalar(S); town.add(house);
  add(new THREE.BoxGeometry(10, 0.12, 8), 0x2e2620, 0, 0.06, 0, house);
  for (const [x, z, w, d, h] of [[-5, 0, 0.5, 8, 1.2], [5, 0, 0.5, 8, 0.6], [-2.5, -4, 5, 0.5, 1.6], [3.2, -4, 3.6, 0.5, 0.8], [-3.8, 4, 2.4, 0.5, 0.9], [3.6, 4, 2.8, 0.5, 0.5]]) add(new THREE.BoxGeometry(w, h, d), stoneM, x, h / 2, z, house);
  add(new THREE.BoxGeometry(1.5, 7, 1.5), stoneM, -3.8, 3.5, -3.2, house); add(new THREE.BoxGeometry(1.8, 0.5, 1.8), mat(0x6a645a), -3.8, 7.1, -3.2, house);   // the chimney, all that stands
  for (const [x, z, a, b] of [[-1, -1, 0.9, 0.3], [1.5, 1, -0.7, 1.1], [0, 2.4, 0.4, -0.5], [2.8, -1.8, -1.1, 0.2]]) { const bm = add(new THREE.BoxGeometry(0.35, 0.35, 5), charred, x, 1.2, z, house); bm.rotation.set(a, b, 0.2); }
  for (let i = 0; i < 18; i++) { const rb = add(new THREE.DodecahedronGeometry(0.2 + R() * 0.25, 0), R() < 0.5 ? 0x2a221c : 0x5a544c, (R() - 0.5) * 9, 0.06, (R() - 0.5) * 7, house); rb.castShadow = false; rb.scale.y = 0.35; }   // ash and rubble, trodden flat enough to walk over
  /* the walls, the chimney and the fallen beams are all solid, so you walk round them rather than through them */
  for (const [x, z, hx, hz] of [[-5, 0, 0.3, 4], [5, 0, 0.3, 4], [-2.5, -4, 2.5, 0.3], [3.2, -4, 1.8, 0.3], [-3.8, 4, 1.2, 0.3], [3.6, 4, 1.4, 0.3], [-3.8, -3.2, 0.75, 0.75],
    [-1, -1, 0.7, 1.6], [1.5, 1, 1.4, 1.1], [0, 2.4, 0.9, 1.4], [2.8, -1.8, 0.6, 1.7]]) solidBoxes.push({ x0: H.x + (x - hx) * S, x1: H.x + (x + hx) * S, z0: H.z + (z - hz) * S, z1: H.z + (z + hz) * S });
  // the root cellar: two weathered doors set slanting into the ground, chained and padlocked until you've proved yourself
  const C = RUIN.cellar, cel = new THREE.Group(); cel.position.set(C.x, 0, C.z); town.add(cel);
  add(new THREE.BoxGeometry(3.4, 0.5, 2.8), stoneM, 0, 0.25, 0, cel);   // the stone frame round the hatch
  const pit = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.02, 2.3), new THREE.MeshBasicMaterial({ color: 0x000000 })); pit.position.y = 0.515; cel.add(pit);   // the black drop beneath the doors
  for (let i = 0; i < 4; i++) { const rung = add(new THREE.BoxGeometry(0.9, 0.06, 0.08), 0x3a2a1a, 0, 0.52, -0.9 + i * 0.12, cel); rung.castShadow = false; rung.visible = false; pit['r' + i] = rung; }   // the top of the ladder going down
  const doors = [-1, 1].map(s => { const hinge = new THREE.Group(); hinge.position.set(s * 1.45, 0.58, 0); cel.add(hinge);   // hinged at the outer edges
    add(new THREE.BoxGeometry(1.42, 0.12, 2.4), texMat(woodTex(), 1, 2, 0x7a6248), -s * 0.72, 0, 0, hinge); return hinge; });
  RUIN.pit = pit;
  const chain = new THREE.Group(); cel.add(chain);
  for (let i = 0; i < 9; i++) { const l = add(new THREE.TorusGeometry(0.09, 0.025, 4, 8), 0x6a6a70, -0.8 + i * 0.2, 0.86, 0.1 * Math.sin(i), chain); l.rotation.y = i % 2 ? Math.PI / 2 : 0; l.castShadow = false; }
  const lock = add(new THREE.BoxGeometry(0.32, 0.36, 0.14), 0x8a7a4a, 0, 0.72, 0.3, chain); add(new THREE.TorusGeometry(0.11, 0.03, 4, 8, Math.PI), 0x6a6a70, 0, 0.92, 0.3, chain);
  const lantern = new THREE.MeshStandardMaterial({ color: 0xffd08a, emissive: 0xffa040, emissiveIntensity: 1 }); GLOW_MATS.push(lantern);
  add(new THREE.BoxGeometry(0.1, 1.6, 0.1), 0x3a2a1a, 1.9, 0.8, 1.2, cel); add(new THREE.BoxGeometry(0.26, 0.32, 0.26), lantern, 1.9, 1.7, 1.2, cel); LIGHT_SPOTS.push([C.x + 1.9, 1.7, C.z + 1.2]);
  solidAt(C.x, C.z, 1.6, 1.4);
  RUIN.chain = chain; RUIN.doors = doors;
  cel.userData = { action: 'Open', name: 'Cellar', rec: { kind: 'cellar', state: 'standing', x: C.x, z: C.z, onClick: () => cellarClick() } }; trees.push(cel);
  // the old track down from the windmill path, between the pens, to the farmhouse
  roadPath([[81, 11], [81, 34], [83, 52], [85, 62], [H.x + 1, H.z - 4.6 * S]]);
  buildScorchedYard();
}

// what the fire left round the farm: charred stakes with ember tips, a scorched scarecrow with crows, a sooted well and embers at the chimney's foot
function buildScorchedYard(){
  let q = 311; const R = () => (q = (q * 16807) % 2147483647) / 2147483647;   // seeded: the same yard for every player
  const bins = new Map(), put = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); o.updateMatrix(); let g2 = geo.index ? geo.toNonIndexed() : geo.clone(); g2.applyMatrix4(o.matrix); for (const k of Object.keys(g2.attributes)) if (k !== 'position' && k !== 'normal') g2.deleteAttribute(k); if (!bins.has(m)) bins.set(m, []); bins.get(m).push(g2); };
  const roadNear = (x, z, r) => ROADS.some(([ax, az, bx, bz]) => { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); return Math.hypot(x - ax - t * dx, z - az - t * dz) < r; });
  const char = mat(0x221a15), charB = mat(0x3a2e24), cloth = mat(0x5a4a3a), sack = mat(0x9a8a62), crowM = mat(0x16161c), beakM = mat(0x5a5040), stone = mat(0x7a746a), soot = mat(0x3a3632), rope = mat(0x8a7a5a), iron = mat(0x3a3a40);
  const ember = new THREE.MeshStandardMaterial({ color: 0xff7a30, emissive: 0xff4a10, emissiveIntensity: 1.6 }); GLOW_MATS.push(ember);
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (a, b, h, n = 6) => new THREE.CylinderGeometry(a, b, h, n);
  /* charred stakes with snapped tops along the old west track */
  for (let i = 0; i < 9; i++) { const z = 44 + i * 2.6, x = 77.0 + (z - 44) * 0.06, h = 0.8 + R() * 0.9, a = (R() - 0.5) * 0.3, b = (R() - 0.5) * 0.35, ry = R(); if (i === 4 || roadNear(x, z, 1.4)) continue;
    put(C(0.1, 0.16, h), char, x, h / 2, z, a, 0, b); put(new THREE.ConeGeometry(0.11, 0.3, 5), ember, x - Math.sin(b) * h, h * Math.cos(a) + 0.03, z + Math.sin(a) * h, 0, ry, 0, 1, 0.3, 1); solidAt(x, z, 0.25); }
  /* the scorched scarecrow, still standing in the east field */
  const SX = 98, SZ = 51;
  put(C(0.09, 0.12, 3.6), charB, SX, 1.8, SZ); put(B(2.6, 0.12, 0.12), charB, SX, 2.7, SZ, 0, 0, 0.12);
  put(B(0.95, 1.1, 0.45), cloth, SX, 2.35, SZ, 0, 0, 0.06); for (let i = 0; i < 5; i++) put(B(0.22, 0.5 + R() * 0.4, 0.08), cloth, SX - 0.45 + i * 0.22, 1.6, SZ + 0.18, 0.1, 0, (R() - 0.5) * 0.4);
  put(B(0.5, 0.35, 0.3), cloth, SX - 1.0, 2.62, SZ, 0, 0, 0.12); put(B(0.5, 0.35, 0.3), cloth, SX + 1.0, 2.86, SZ, 0, 0, 0.12);
  put(new THREE.IcosahedronGeometry(0.42, 0), sack, SX + 0.05, 3.3, SZ, 0, 0, 0.35);
  put(new THREE.ConeGeometry(0.75, 0.25, 7), char, SX + 0.1, 3.62, SZ, 0, 0, 0.35); put(C(0.3, 0.38, 0.4, 7), char, SX + 0.14, 3.78, SZ, 0, 0, 0.35);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xffb040 }); for (const s of [-1, 1]) put(new THREE.SphereGeometry(0.06, 6, 4), eyeM, SX + s * 0.15 - 0.02, 3.3, SZ + 0.4);
  solidAt(SX, SZ, 0.4);
  /* crows: on the scarecrow's arms, the chimney top and pecking in the dirt */
  const crow = (x, y, z, ry, peck) => { put(new THREE.SphereGeometry(0.22, 7, 5), crowM, x, y + 0.2, z, 0, ry, 0, 0.8, 0.8, 1.3); put(new THREE.SphereGeometry(0.13, 7, 5), crowM, x + Math.sin(ry) * 0.25, y + (peck ? 0.2 : 0.42), z + Math.cos(ry) * 0.25, 0, ry);
    put(new THREE.ConeGeometry(0.05, 0.16, 4), beakM, x + Math.sin(ry) * 0.4, y + (peck ? 0.12 : 0.42), z + Math.cos(ry) * 0.4, Math.PI / 2 + (peck ? 0.8 : 0), ry, 0);
    put(B(0.16, 0.04, 0.3), crowM, x - Math.sin(ry) * 0.28, y + 0.22, z - Math.cos(ry) * 0.28, -0.3, ry); };
  crow(SX - 1.05, 2.8, SZ, 0.4); crow(SX + 1.1, 3.05, SZ, -0.9);
  const H = RUIN.house, S = RUIN_S; crow(H.x - 3.8 * S, 7.35 * S, H.z - 3.2 * S, 2.2);   // on top of the chimney
  for (const [x, z, ry] of [[92.5, 63, 1], [93.3, 62.2, -2], [74.6, 60.5, 2.6], [104, 52, 0.3]]) if (!roadNear(x, z, 1)) crow(x, 0, z, ry, true);
  /* the old well: soot-stained stone, a snapped windlass, a rope running down into the dark */
  const WX = 99, WZ = 70;
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28, h = 0.8 + R() * 0.25; if (i === 3 || i === 4) continue; put(B(0.62, h, 0.42), i % 3 ? stone : soot, WX + Math.cos(a) * 1.05, h / 2, WZ + Math.sin(a) * 1.05, 0, -a, 0); }
  put(B(0.6, 0.3, 0.4), stone, WX + 1.6, 0.15, WZ + 0.9, 0.4, 1, 0); put(B(0.5, 0.25, 0.4), soot, WX + 1.3, 0.12, WZ + 1.5, 0, 0.3, 0.3);
  put(C(0.95, 0.95, 0.02, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }), WX, 0.5, WZ);
  for (const s of [-1, 1]) put(B(0.2, s < 0 ? 2.4 : 1.3, 0.2), char, WX + s * 1.1, s < 0 ? 1.2 : 0.65, WZ, 0, 0, s < 0 ? 0.06 : 0);
  put(C(0.12, 0.12, 1.3, 7), charB, WX - 0.45, 1.95, WZ, 0, 0, Math.PI / 2 + 0.5);
  put(C(0.03, 0.03, 1.5, 4), rope, WX - 0.2, 1.1, WZ, 0, 0, 0.12);
  put(C(0.3, 0.24, 0.45, 8), charB, WX + 2.1, 0.3, WZ - 1.1, 1.4, 0.4, 0); put(new THREE.TorusGeometry(0.29, 0.025, 4, 10), iron, WX + 2.1, 0.3, WZ - 1.0);
  solidAt(WX, WZ, 1.4); solidAt(WX + 2.1, WZ - 1.1, 0.35);
  /* smouldering embers at the chimney's foot (emissive only, no light) */
  for (let i = 0; i < 14; i++) { const x = 81.8 + R() * 2.6, z = 70.6 + R() * 2.2, s = 0.1 + R() * 0.1; put(new THREE.DodecahedronGeometry(s, 0), ember, x, 0.13, z, R(), R(), R(), 1, 0.5, 1); }
  for (const [m, geos] of bins) { const mesh = new THREE.Mesh(mergeGeometries(geos), m); mesh.castShadow = m !== ember && m.type !== 'MeshBasicMaterial'; mesh.receiveShadow = true; town.add(mesh); }
}

