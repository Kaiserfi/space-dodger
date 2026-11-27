// ----- signing in: every browser gets its own invisible Firebase account (anonymous sign-in), so the database rules can say
// "only you can change your own save". With no key here it stays off and the game works as before.
const FB_KEY = 'AIzaSyANcegZrOyf1O03SbLMBQVTGRJXuNIKLPA';   /* public by design: it only names the project */
const AUTH = { token: '', uid: '', rt: '', at: 0 };
{ const plain = window.fetch.bind(window);   /* every database request carries the sign-in */
  window.fetch = (u, o) => plain(typeof u === 'string' && AUTH.token && u.startsWith(DB) ? u + (u.includes('?') ? '&' : '?') + 'auth=' + AUTH.token : u, o); }
async function authRefresh(){
  const res = await fetch('https://securetoken.googleapis.com/v1/token?key=' + FB_KEY, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(AUTH.rt) });
  if (!res.ok) throw new Error('refresh ' + res.status);
  const d = await res.json(); AUTH.token = d.id_token; AUTH.rt = d.refresh_token; AUTH.uid = d.user_id; AUTH.at = Date.now();
}
async function signIn(){
  if (!FB_KEY) return false;
  try { const s0 = JSON.parse(localStorage.getItem('itapAuth') || 'null'); if (s0 && s0.rt) { AUTH.rt = s0.rt; await authRefresh(); } } catch (e) { AUTH.rt = ''; AUTH.token = ''; }
  if (!AUTH.token) try {
    const res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FB_KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) });
    if (!res.ok) return false;
    const d = await res.json(); AUTH.token = d.idToken; AUTH.rt = d.refreshToken; AUTH.uid = d.localId; AUTH.at = Date.now();
  } catch (e) { return false; }
  try { localStorage.setItem('itapAuth', JSON.stringify({ rt: AUTH.rt, uid: AUTH.uid })); } catch (e) {}
  // the sign-in lasts an hour: renew it well before then, and reopen the live stream with the new one
  setInterval(() => authRefresh().then(() => { try { localStorage.setItem('itapAuth', JSON.stringify({ rt: AUTH.rt, uid: AUTH.uid })); } catch (e) {} if (LIVE.es) { LIVE.es.close(); LIVE.es = null; startLive(); } }).catch(() => {}), 45 * 60000);
  return true;
}
// a player from before sign-ins: their save moves to their new account once. The claim stops anyone else taking it.
async function moveOldSave(oldId){
  if (!oldId || oldId === AUTH.uid) return true;
  try {
    const mine = await fetch(`${DB}/adventure/saves/${AUTH.uid}.json`); if (!mine.ok) return false; if (await mine.json()) return true;   // already moved
    const claim = await fetch(`${DB}/adventure/claimed/${oldId}.json`, { method: 'PUT', body: JSON.stringify(AUTH.uid) });
    if (!claim.ok) { const who = await (await fetch(`${DB}/adventure/claimed/${oldId}.json`)).json(); if (!who) return false; if (who !== AUTH.uid) { showToast("Your old progress couldn't be moved to this browser."); return true; } }
    const old = await (await fetch(`${DB}/adventure/saves/${oldId}.json`)).json(); if (!old) return true;
    return (await fetch(`${DB}/adventure/saves/${AUTH.uid}.json`, { method: 'PUT', body: JSON.stringify(old) })).ok;
  } catch (e) { return false; }
}
const REGROW_MS = 25000;   // a shared tree or rock comes back after this long
const ONLINE = { ok: false, id: '', name: '', ready: false, nodes: {}, chatK: 0, sig: '', lastWrite: 0, saveJson: '', lastSave: 0 };
const remote = {};   // the other players on screen
const joinSeen = {};   // when each player was last on screen, so joins are announced once
const HAMMER_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M7 3 L11 3 L11 7 L7 7 Z" fill="#8a9099" stroke="#434a53" stroke-width="0.8"/><rect x="7.4" y="7" width="1.4" height="7" fill="#7a4d22"/></svg>`;
const COIN_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <circle cx="8" cy="8" r="5.5" fill="#e8c040" stroke="#7a5a10" stroke-width="0.8"/><circle cx="8" cy="8" r="2.5" fill="none" stroke="#b8901c" stroke-width="0.8"/></svg>`;
const HOE_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><rect x="7" y="4" width="1.6" height="11" fill="#7a4d22" transform="rotate(20 8 9)"/><path d="M3 2 L9 2 L9 4.5 L4 5 Z" fill="#8a9099" stroke="#434a53" stroke-width="0.6"/></svg>`;
const CAN_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M4 6 L11 6 L11 14 L4 14 Z" fill="#6a8a5a" stroke="#3a4a30" stroke-width="0.7"/><path d="M11 8 L15 4.5 L15.5 5.5 L12 9.5 Z" fill="#6a8a5a" stroke="#3a4a30" stroke-width="0.5"/><path d="M5 6 Q7.5 2 10 6" fill="none" stroke="#3a4a30" stroke-width="1.2"/></svg>`;
const SEED_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M3 4 L13 4 L12 14 L4 14 Z" fill="#c8a870" stroke="#6a5030" stroke-width="0.7"/><rect x="3" y="4" width="10" height="2" fill="#a08050"/><circle cx="7" cy="10" r="1" fill="#e0c060"/><circle cx="9.5" cy="9" r="1" fill="#e0c060"/><circle cx="8.5" cy="11.5" r="1" fill="#e0c060"/></svg>`;
const WHEAT_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><rect x="7.4" y="7" width="1.2" height="8" fill="#b89040"/><g fill="#e0b850">${[0, 1, 2, 3].map(i => `<ellipse cx="${6.6}" cy="${2.5 + i * 1.4}" rx="1" ry="0.8"/><ellipse cx="${9.4}" cy="${2.5 + i * 1.4}" rx="1" ry="0.8"/>`).join('')}</g><ellipse cx="8" cy="1.6" rx="0.8" ry="1" fill="#e0b850"/></svg>`;
const FLOUR_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M4 5 Q8 3 12 5 L13 14 L3 14 Z" fill="#ece4d0" stroke="#8a7a5a" stroke-width="0.7"/><path d="M5 5 Q8 2 11 5" fill="none" stroke="#8a7a5a" stroke-width="0.8"/><rect x="6" y="8" width="4" height="3" fill="#d8c8a0"/></svg>`;
const DOUGH_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><ellipse cx="8" cy="10" rx="6" ry="3.6" fill="#f0e0c0" stroke="#b09870" stroke-width="0.7"/><ellipse cx="7" cy="9" rx="2.5" ry="1" fill="#fff4dc"/></svg>`;
const LOAF_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M2 11 Q2 5 8 5 Q14 5 14 11 L14 13 L2 13 Z" fill="#c8843a" stroke="#6a4018" stroke-width="0.7"/><path d="M5 7 L6 9 M8 6.5 L8.6 8.8 M11 7 L10.4 9" stroke="#e8b070" stroke-width="0.8"/></svg>`;
const BURNT_LOAF_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M2 11 Q2 5 8 5 Q14 5 14 11 L14 13 L2 13 Z" fill="#3a2a1e" stroke="#1a120a" stroke-width="0.7"/></svg>`;
const FEATHER_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M12 2 Q5 4 4 12 L5 13 Q12 9 12 2 Z" fill="#f4eee0" stroke="#9a8a70" stroke-width="0.6"/><path d="M11 3 L3.5 14" stroke="#9a8a70" stroke-width="0.7"/></svg>`;
const RAW_CHICKEN_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><ellipse cx="7" cy="9" rx="5" ry="4" fill="#f0b0a0" stroke="#a06050" stroke-width="0.7"/><rect x="11" y="4" width="1.6" height="5" fill="#f4e8d8" transform="rotate(30 12 6)"/><circle cx="13" cy="4" r="1.2" fill="#f4e8d8"/></svg>`;
const COOKED_CHICKEN_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><ellipse cx="7" cy="9" rx="5" ry="4" fill="#c8823a" stroke="#6a4018" stroke-width="0.7"/><ellipse cx="6" cy="8" rx="2" ry="1" fill="#e0a860"/><rect x="11" y="4" width="1.6" height="5" fill="#f4e8d8" transform="rotate(30 12 6)"/><circle cx="13" cy="4" r="1.2" fill="#f4e8d8"/></svg>`;
const RAW_BEEF_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M2 8 Q3 3 9 4 Q14 5 14 9 Q13 13 7 13 Q2 12 2 8 Z" fill="#c8383a" stroke="#6a1a1a" stroke-width="0.7"/><path d="M5 6 Q8 8 11 7 M5 10 Q8 9 11 11" stroke="#f0d0c8" stroke-width="0.8" fill="none"/></svg>`;
const COOKED_BEEF_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M2 8 Q3 3 9 4 Q14 5 14 9 Q13 13 7 13 Q2 12 2 8 Z" fill="#7a4020" stroke="#3a1a0a" stroke-width="0.7"/><path d="M5 6 L6 9 M8 5.5 L9 9 M11 6.5 L11.5 10" stroke="#3a1a0a" stroke-width="0.9"/></svg>`;
const BURNT_MEAT_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M2 8 Q3 3 9 4 Q14 5 14 9 Q13 13 7 13 Q2 12 2 8 Z" fill="#2a1e16" stroke="#120a06" stroke-width="0.7"/></svg>`;

const ALOE_SEED_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M3 4 L13 4 L12 14 L4 14 Z" fill="#a8c8a0" stroke="#4a6a40" stroke-width="0.7"/><rect x="3" y="4" width="10" height="2" fill="#7aa070"/><path d="M8 13 L6.5 8.5 M8 13 L8 7.5 M8 13 L9.5 8.5" stroke="#3a7a4a" stroke-width="1.1"/></svg>`;
const MULBERRY_SEED_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><path d="M3 4 L13 4 L12 14 L4 14 Z" fill="#c8a8c0" stroke="#5a3a52" stroke-width="0.7"/><rect x="3" y="4" width="10" height="2" fill="#a07898"/><g fill="#4a1a3a"><circle cx="7" cy="9.5" r="1"/><circle cx="9" cy="9.5" r="1"/><circle cx="8" cy="11.2" r="1"/></g></svg>`;
const ALOE_ICON = `<svg viewBox="0 0 16 16" width="26" height="26"><path d="M8 15 C5 11 4 6 5 1 C7 5 9 10 8 15 Z" fill="#6aa080" stroke="#2a5a3a" stroke-width="0.7"/><path d="M8 15 C10 11 12 7 13 3 C10 6 8 10 8 15 Z" fill="#7ab090" stroke="#2a5a3a" stroke-width="0.7"/><g fill="#d0e8d0"><circle cx="5.8" cy="6" r="0.5"/><circle cx="6.4" cy="9" r="0.5"/><circle cx="10.6" cy="7" r="0.5"/></g></svg>`;
const MULBERRY_LEAF_ICON = `<svg viewBox="0 0 16 16" width="26" height="26"><path d="M8 15 L8 11" stroke="#4a6a2a" stroke-width="1"/><path d="M8 11 C3 11 1 6 3 3 C5 4 6 2 8 1 C10 2 11 4 13 3 C15 6 13 11 8 11 Z" fill="#5a9a3a" stroke="#2a5a1a" stroke-width="0.7"/><path d="M8 11 L8 3 M8 7 L5 5 M8 7 L11 5" stroke="#3a7a2a" stroke-width="0.6" fill="none"/></svg>`;
const COCOON_ICON = `<svg viewBox="0 0 16 16" width="26" height="26"><ellipse cx="8" cy="8.5" rx="4" ry="6" fill="#f4f0e2" stroke="#a09878" stroke-width="0.7" transform="rotate(-25 8 8.5)"/><path d="M5 6 Q8 8 11 6 M4.6 9 Q8 11 11.4 9 M5.4 12 Q8 13.5 10.6 12" stroke="#d4ccb0" stroke-width="0.6" fill="none" transform="rotate(-25 8 8.5)"/></svg>`;
const THREAD_ICON = `<svg viewBox="0 0 16 16" width="26" height="26"><rect x="4" y="2" width="8" height="2" rx="0.6" fill="#a07848"/><rect x="4" y="12" width="8" height="2" rx="0.6" fill="#a07848"/><rect x="5" y="4" width="6" height="8" fill="#f8f2e6" stroke="#c8bca0" stroke-width="0.5"/><path d="M5 5.5 L11 5.5 M5 7.5 L11 7.5 M5 9.5 L11 9.5 M11 10.5 Q13 12 12 14" stroke="#e0d6c0" stroke-width="0.6" fill="none"/></svg>`;
const BANDAGE_ICON = `<svg viewBox="0 0 16 16" width="26" height="26"><circle cx="7" cy="8" r="5" fill="#f4eee0" stroke="#b0a488" stroke-width="0.7"/><circle cx="7" cy="8" r="2" fill="#e2d8c0" stroke="#b0a488" stroke-width="0.5"/><path d="M11 10 L15 12 L14.4 14 L10 12 Z" fill="#f4eee0" stroke="#b0a488" stroke-width="0.6"/><path d="M5.6 4.6 L5.6 6.2 M4.8 5.4 L6.4 5.4" stroke="#d03030" stroke-width="0.9"/><path d="M7 7.2 Q8 6.6 8.6 7.6" stroke="#7ab090" stroke-width="0.8" fill="none"/></svg>`;
const ICON_FOR = { 'Oak logs': OAK_LOG_ICON, 'Aloe seeds': ALOE_SEED_ICON, 'Mulberry seeds': MULBERRY_SEED_ICON, 'Aloe leaf': ALOE_ICON, 'Mulberry leaves': MULBERRY_LEAF_ICON, 'Silk cocoon': COCOON_ICON, 'Silk thread': THREAD_ICON, 'Bandage': BANDAGE_ICON, 'Logs': LOG_ICON, 'Bronze axe': AXE_ICON, 'Bronze pickaxe': PICK_ICON, 'Copper ore': ORE_ICON, 'Tin ore': TIN_ICON, 'Iron ore': IRON_ORE_ICON, 'Iron axe': ironHead(AXE_ICON), 'Iron pickaxe': ironHead(PICK_ICON), 'Iron bar': IRON_BAR_ICON, 'Iron daggers': ITEMS['Iron daggers'].icon, 'Iron helmet': ITEMS['Iron helmet'].icon, 'Iron chestplate': ITEMS['Iron chestplate'].icon, 'Iron leg armour': ITEMS['Iron leg armour'].icon, 'Iron boots': ITEMS['Iron boots'].icon, 'Iron sword': ITEMS['Iron sword'].icon, 'Iron shield': ITEMS['Iron shield'].icon,
  'Bronze bar': BAR_ICON, 'Bronze daggers': DAGGERS_ICON, 'Bronze sword': SWORD_ICON, 'Bronze shield': SHIELD_ICON,
  'Bronze helmet': HELM_ICON, 'Bronze chestplate': CHEST_ICON, 'Bronze leg armour': LEGS_ICON, 'Bronze boots': BOOTS_ICON, 'Raw shrimp': SHRIMP_ICON, 'Raw trout': TROUT_ICON, 'Trout': COOKED_TROUT_ICON, 'Burnt trout': BURNT_TROUT_ICON, 'Raw bream': BREAM_ICON, 'Bream': COOKED_BREAM_ICON, 'Burnt bream': BURNT_BREAM_ICON, 'Worms': WORMS_ICON, 'Tinderbox': TINDER_ICON,
  'Hammer': HAMMER_ICON, 'Coins': COIN_ICON, 'Small fishing net': NET_ICON, 'Fishing rod': ROD_ICON, 'Fly fishing rod': FLY_ROD_ICON, 'Shrimp': COOKED_SHRIMP_ICON, 'Burnt shrimp': BURNT_ICON,
  "Brenna's bread": BREAD_ICON, "Villager's cloak": CLOAK_ICON, 'Torch': TORCH_ICON,
  'Hoe': HOE_ICON, 'Watering can': CAN_ICON, 'Wheat seeds': SEED_ICON, 'Wheat': WHEAT_ICON, 'Flour': FLOUR_ICON, 'Bread dough': DOUGH_ICON, 'Bread': LOAF_ICON, 'Burnt bread': BURNT_LOAF_ICON,
  'Feathers': FEATHER_ICON, 'Raw chicken': RAW_CHICKEN_ICON, 'Cooked chicken': COOKED_CHICKEN_ICON, 'Burnt chicken': BURNT_MEAT_ICON, 'Raw beef': RAW_BEEF_ICON, 'Cooked beef': COOKED_BEEF_ICON, 'Burnt beef': BURNT_MEAT_ICON };
function nodeKey(x, z){ return 'n' + Math.round(x * 10) + '_' + Math.round(z * 10); }
const setStatus = t => { document.getElementById('onlineStatus').textContent = t; };
function showJoin(msg, withName){
  document.getElementById('online').hidden = false;
  setStatus(msg);
  document.getElementById('nameBox').hidden = !withName;
  document.getElementById('retryBtn').hidden = withName;
}
async function checkServer(){
  // the reason is kept, so the message can say what went wrong
  try { const r = await fetch(DB + '/adventure/live/nodes.json?shallow=true'); ONLINE.ok = r.ok; ONLINE.err = r.ok ? '' : 'HTTP ' + r.status; }
  catch (e) { ONLINE.ok = false; ONLINE.err = 'network error: ' + e.message; }
  return ONLINE.ok;
}
async function bootOnline(){
  showJoin('Connecting...', false);
  if (!(await checkServer())) { showJoin("Can't reach the village server (" + ONLINE.err + "). Check your connection, then try again.", false); return; }
  const name = localStorage.getItem('itapName') || '';
  if (name) enterVillage(name); else showJoin('Choose a name for your adventurer.', true);
}
async function enterVillage(name){
  ONLINE.name = name;
  try { localStorage.setItem('itapName', name); } catch (e) {}
  let id = ''; try { id = localStorage.getItem('itapId') || ''; } catch (e) {}
  setStatus('Joining...');
  if (await signIn()) {   // from now on you're your account; the old id is kept until its save has moved
    let moved = false; try { if (id && id !== AUTH.uid) localStorage.setItem('itapOld', id); moved = await moveOldSave(localStorage.getItem('itapOld')); if (moved) localStorage.removeItem('itapOld'); } catch (e) {}
    if (moved) { id = AUTH.uid; try { localStorage.setItem('itapId', id); } catch (e) {} } }   /* if the move failed, play on the old save and try again next time */
  if (!id) { id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); try { localStorage.setItem('itapId', id); } catch (e) {} }
  ONLINE.id = id;
  try { const r = await fetch(`${DB}/adventure/saves/${id}.json`); applySave(await r.json()); } catch (e) {}
  ONLINE.saveJson = JSON.stringify(currentSave());
  cleanStalePlayers();
  startStreams();
  ONLINE.ready = true; ONLINE.readyAt = Date.now();
  document.getElementById('online').hidden = true;
}
// log out: save everything, including where you are, and leave the village
async function logOut(){
  if (!ONLINE.ready) { location.href = '../'; return; }
  leaveParty(true);
  ONLINE.saveJson = '';
  await saveNow(false);            // the save goes through while we are still in the village
  ONLINE.ready = false;
  try { await fetch(`${DB}/adventure/live/players/${ONLINE.id}.json`, { method: 'DELETE' }); } catch (e) {}
  for (const id in remote) removeRemote(id);
  document.getElementById('nameInput').value = ONLINE.name;
  location.href = '../';   // back to the arcade
}
document.getElementById('logoutBtn').addEventListener('click', logOut);
// remove players left behind by closed browsers (no update for a minute)
async function cleanStalePlayers(){
  try {
    const all = await (await fetch(`${DB}/adventure/live/players.json`)).json() || {};
    const now = Date.now();
    for (const id in all) if (all[id] && all[id].t && now - all[id].t > 60000) fetch(`${DB}/adventure/live/players/${id}.json`, { method: 'DELETE' }).catch(() => {});
  } catch (e) {}
}
// your progress, as saved online
function currentSave(){ return { v: 2, q: QUEST, bag: bag.filter(i => !CAVE_ITEMS.has(i.name)).map(i => ({ name: i.name, qty: i.qty, s: i.slot })), co: COINS, eq: equipped, xp: SKILL_XP, look, dm: DEMAND, kc: KILLS, farm: FARM_PLOTS.map(p => ({ s: p.s, g: p.g, w: p.w ? 1 : 0, t: p.t, c: p.c || 'Wheat' })), hu: SILK.hutch, wc: FARM_CAN.n, tb: toolbelt, dv: DELVE && !DELVE.done ? DELVE.startXp : null, cd: caveSaveP(), pos: hero ? (CAVE || inCaveZone(hero.position.x, hero.position.z) ? caveExitSpot() : DELVE || inDelveZone(hero.position.x, hero.position.z) ? delveExitSpot() : { x: +hero.position.x.toFixed(1), z: +hero.position.z.toFixed(1) }) : null }; }
// the nearest spot the body fits in, so a saved position is never inside a wall or a building
function openSpotNear(x, z){
  if (!blocked(x, z) && !hardHit(x, z)) return { x, z };
  for (let r = 0.5; r <= 12; r += 0.5) for (let a = 0; a < 24; a++) {
    const px = x + Math.cos(a * Math.PI / 12) * r, pz = z + Math.sin(a * Math.PI / 12) * r;
    if (!blocked(px, pz)) return { x: px, z: pz };
  }
  return { x: START.x, z: START.z };
}
function applySave(d){
  if (d && (d.bag || typeof d.co === 'number')) COINS = typeof d.co === 'number' ? d.co : 0;   /* the purse loads even with an empty bag, which Firebase leaves out of the save */
  if (d && d.bag) {
    bag.length = 0;
    d.bag.forEach(it => { if (it && it.name === 'Coins') { if (typeof d.co !== 'number') COINS += it.qty || 0; return; }   /* coins from older saves move out of the bag into the purse */
      if (it && OLD_DAGGERS[it.name]) it = { ...it, name: OLD_DAGGERS[it.name] };   /* a single dagger is a pair now */
      if (it && ICON_FOR[it.name]) bag.push({ name: it.name, qty: it.qty || 1, icon: ICON_FOR[it.name], slot: (it.s >= 0 && it.s < BAG_SIZE && !bag.some(b => b.slot === it.s)) ? it.s : -1 }); });
    bag.forEach(b => { if (b.slot < 0) b.slot = freeSlot(); });
    for (const b of bag.slice()) { const first = bag.find(x => x.name === b.name); if (first !== b && !SINGLE.has(b.name)) { first.qty += b.qty; bag.splice(bag.indexOf(b), 1); } }   /* burnt food saved one to a slot joins back into one stack */
    for (const b of bag.slice()) while (SINGLE.has(b.name) && b.qty > 1 && bag.length < BAG_SIZE) { b.qty--; bag.push({ name: b.name, qty: 1, icon: b.icon, slot: freeSlot() }); }   // food from before it stopped stacking: spread into free slots (any left over stays together)
  }
  if (d && d.eq) Object.keys(equipped).forEach(k => { const n = d.eq[k] && (OLD_DAGGERS[d.eq[k]] || d.eq[k]); equipped[k] = n && ICON_FOR[n] ? n : null; });
  if (equipped.weapon && ITEMS[equipped.weapon] && ITEMS[equipped.weapon].twoHand && equipped.shield && bag.length < BAG_SIZE) { addItem(equipped.shield, 1, ICON_FOR[equipped.shield] || ITEMS[equipped.shield].icon); equipped.shield = null; }   /* the pair takes both hands: a shield worn with an old dagger goes back to the bag */
  if (d && d.q && typeof d.q.hw === 'number') Object.assign(QUEST, d.q);
  if (equipped.body === "Villager's cloak") { equipped.back = equipped.body; equipped.body = null; }   // the cloak moved to its own back slot
  if (d && d.dm) Object.keys(d.dm).forEach(k => { if (d.dm[k] && typeof d.dm[k].n === 'number') DEMAND[k] = d.dm[k]; });   // Mara's prices carry over
  if (d && d.xp && d.v === 2) {
    Object.keys(SKILL_XP).forEach(k => { if (typeof d.xp[k] === 'number') SKILL_XP[k] = d.xp[k]; });   // skills from older saves are ignored
    if (typeof d.xp.Melee !== 'number') SKILL_XP.Melee = Math.max(d.xp.Attack || 0, d.xp.Defence || 0);   // Attack and Defence became Melee
  }
  if (d && Array.isArray(d.farm)) d.farm.forEach((p, i) => { if (FARM_PLOTS[i] && p) Object.assign(FARM_PLOTS[i], { s: p.s || 'grass', g: p.g || 0, w: !!p.w, t: p.t || 0, c: CROPS[p.c] ? p.c : 'Wheat' }); });
  if (d && d.hu && typeof d.hu.n === 'number') SILK.hutch = { n: d.hu.n, t: d.hu.t || 0 };   /* the leaves in your silkworm hutch */   // your crops, as you left them
  if (d && typeof d.wc === 'number') FARM_CAN.n = d.wc;
  for (const k in toolbelt) toolbelt[k] = d && d.tb && typeof d.tb[k] === 'string' ? d.tb[k] : null;
  if (toolbelt.rod === 'Fly fishing rod') { if (!toolbelt.fly) toolbelt.fly = 'Fly fishing rod'; toolbelt.rod = null; }   /* a fly rod from an old save, hung in the plain rod's place */
  if (d && d.dv && typeof d.dv.m === 'number' && !DELVE) {   /* you left mid-delve: that counts as fleeing */
    const lost = Math.floor(COINS * 0.25); COINS -= lost; const lm = Math.max(0, SKILL_XP.Melee - d.dv.m), lh = Math.max(0, SKILL_XP.Hitpoints - d.dv.h);
    SKILL_XP.Melee = Math.min(SKILL_XP.Melee, d.dv.m); SKILL_XP.Hitpoints = Math.min(SKILL_XP.Hitpoints, d.dv.h);
    setTimeout(() => { addSystemLine(`You left the cellar mid-challenge, which counts as fleeing: -${lost.toLocaleString()} coins${lm ? ', -' + lm.toLocaleString() + ' Melee XP' : ''}${lh ? ', -' + lh.toLocaleString() + ' Hitpoints XP' : ''}.`); renderBag(); renderStats(); saveNow(false); }, 1500);
  }
  if (d && d.cd) caveLoadP(d.cd);   /* how far you got in the cave */
  if (!CAVE && bag.some(i => CAVE_ITEMS.has(i.name))) caveStash();   /* the cave's things never come up top */
  if (d && d.kc) for (const k in KILLS) if (typeof d.kc[k] === 'number') KILLS[k] = d.kc[k];
  HP.cur = maxHp();
  if (d && d.look) { look = { ...look, ...d.look }; lookMade = true; saveLook(); creator.hidden = true; rebuildHero(); }
  if (d && d.pos && hero) { const sp = openSpotNear(d.pos.x, d.pos.z); hero.position.set(sp.x, 0, sp.z); heroShadow.position.set(sp.x, 0.06, sp.z); }   // back where you logged out
  renderBag(); renderStats(); renderGear();
}
// the server's save watchdog corrected this save (an impossible jump in coins, XP or an item): load the corrected copy.
// Each correction is handled once (itapWd keeps the last one seen), so reconnecting doesn't reload again.
function watchdogFix(at){
  let seen = 0; try { seen = +(localStorage.getItem('itapWd') || 0); } catch (e) {}
  if (!(at > seen)) return; try { localStorage.setItem('itapWd', String(at)); } catch (e) {}
  if (!ONLINE.ready) return;
  fetch(`${DB}/adventure/saves/${ONLINE.id}.json`).then(r => r.json()).then(d => { if (!d || !d.xp) return; applySave(d); addSystemLine('Your save was put back to how it was: part of it changed faster than the game allows.'); }).catch(() => {});
}
window.beforeUpdateReload = () => ONLINE.ready ? saveNow(false) : null;   // save before refreshing for a new version
async function saveNow(keepalive){
  if (!ONLINE.ready) return;
  const j = JSON.stringify(currentSave());
  if (j === ONLINE.saveJson && !keepalive) return;
  ONLINE.saveJson = j;
  try { await fetch(`${DB}/adventure/saves/${ONLINE.id}.json`, { method: 'PUT', keepalive: !!keepalive, body: j }); } catch (e) {}
}
// your own position, look and chat, shared with the others
function writePresence(force){
  if (!ONLINE.ready || !hero) return;
  const x = +hero.position.x.toFixed(2), z = +hero.position.z.toFixed(2);
  const sig = [x, z, heroFacing, walkTarget ? 1 : 0, ONLINE.chatK, JSON.stringify(look), JSON.stringify(ONLINE.act), EV.seat, ONLINE.rd, JSON.stringify(equipped), JSON.stringify(TRADE.tr), HP.cur, maxHp(), combatLevel(), cellarOpen(), PARTY.id].join('|');
  const now = Date.now();
  if (!force && sig === ONLINE.sig && now - ONLINE.lastWrite < 2000) return;
  if (!force && now - ONLINE.lastWrite < 100) return;
  ONLINE.sig = sig; ONLINE.lastWrite = now;
  const body = { n: ONLINE.name, x, z, f: heroFacing, w: walkTarget ? 1 : 0, l: look, c: ONLINE.chat || null, a: ONLINE.act || null, st: EV.seat >= 0 ? EV.seat : null, rd: ONLINE.rd || null, e: Object.fromEntries(Object.entries(equipped).filter(([k, v]) => v)), tr: TRADE.tr || null, hp: [HP.cur, maxHp()], cb: combatLevel(), dl: cellarOpen() ? 1 : 0, pt: PARTY.id || null, t: now };
  xferMark(body);   // which session this is (only one device plays a profile at a time)   // e: what you're wearing and holding, so others see it
  fetch(`${DB}/adventure/live/players/${ONLINE.id}.json`, { method: 'PUT', body: JSON.stringify(body), keepalive: force }).catch(() => {});
}
function sendChat(text){
  ONLINE.chatK++;
  ONLINE.chat = { t: text.slice(0, 120), k: ONLINE.chatK };
  writePresence(true);
}
// claim a shared node before it falls: only one player wins, and the server says who
async function claimNode(rec){
  if (!ONLINE.ready) return null;
  const url = `${DB}/adventure/live/nodes/${rec.key}.json`;
  try {
    const r = await fetch(url, { headers: { 'X-Firebase-ETag': 'true' } });
    const etag = r.headers.get('ETag'), cur = await r.json();
    if (cur && cur.until > Date.now()) return null;
    const until = Date.now() + REGROW_MS;
    const w = await fetch(url, { method: 'PUT', headers: { 'If-Match': etag, 'Content-Type': 'application/json' }, body: JSON.stringify({ until, by: ONLINE.id }) });
    return w.ok ? until : null;
  } catch (e) { return null; }
}
// a closed browser can't delete its own presence note, so whoever sees a note more than 2 minutes old deletes it:
// after a short random wait (not every game at once), and only if it hasn't changed since we looked (ETag), so someone who has just come back is never removed
const SWEPT = {};
function sweepPresence(id){
  if (!ONLINE.id || id === ONLINE.id || Date.now() - (SWEPT[id] || 0) < 300000) return; SWEPT[id] = Date.now();
  setTimeout(async () => {
    try { const url = `${DB}/adventure/live/players/${id}.json`, r = await fetch(url, { headers: { 'X-Firebase-ETag': 'true' } }), tag = r.headers.get('ETag'), cur = await r.json();
      if (!cur || !tag || !(cur.t && Date.now() - cur.t > 120000)) return;
      await fetch(url, { method: 'DELETE', headers: { 'If-Match': tag } }); } catch (e) {}
  }, 2000 + Math.random() * 10000);
}
// the other players: a sprite with their look, and their name above it
function setRemote(id, p){
  if (id === ONLINE.id) xferCheck(p);
  if (!p || id === ONLINE.id) return;
  if (p.t && Date.now() - p.t > 30000) { removeRemote(id); sweepPresence(id); return; }   // a left-behind entry from a closed browser (and tidy it out of the database)
  let r = remote[id];
  if (!r) {
    // a join line only after the first list, and not again for someone who was just here (a briefly stale entry is not a new arrival)
    if (ONLINE.announce && !(joinSeen[id] && Date.now() - joinSeen[id] < 600000)) addSystemLine(`${p.n || 'A player'} has joined the village.`);
    joinSeen[id] = Date.now();
    const lookJson = JSON.stringify(p.l || {});
    const sprite = makeChibi({ ...look, ...LOOK_PLAIN, ...(p.l || {}) }); sprite.userData.chibi.fightFaces = true;   // their figure, in their look
    scene.add(sprite);
    const label = document.createElement('div');
    label.style.cssText = 'position:fixed;left:0;top:0;transform:translate(-50%,-100%);pointer-events:none;z-index:6;color:#fff;font:13px Georgia,serif;text-shadow:0 0 2px #000,1px 1px 0 #000,-1px -1px 0 #000;white-space:nowrap;display:none;';
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'chatBub'; bubbleEl.style.display = 'none';
    document.body.append(label, bubbleEl);
    r = remote[id] = { eqJson: '', sprite, label, bubbleEl, lookJson, tx: p.x, tz: p.z, face: 1, walk: 0, tick: 0, k: p.c ? p.c.k : 0, bubbleTimer: 0, name: '', seen: 0, yaw: 0, act: null, actJson: 'null', actAt: 0, verb: '' };
    sprite.position.set(p.x, 0, p.z);
  }
  if (JSON.stringify(p.l || {}) !== r.lookJson) {   // the look changed: redraw the frames
    r.lookJson = JSON.stringify(p.l || {});
    const fresh = makeChibi({ ...look, ...LOOK_PLAIN, ...(p.l || {}) }); fresh.userData.chibi.fightFaces = true;
    fresh.position.copy(r.sprite.position); fresh.rotation.y = r.sprite.rotation.y;
    scene.remove(r.sprite); unregisterSprite(r.sprite); scene.add(fresh); r.sprite = fresh; r.eqJson = '';
  }
  const ej = JSON.stringify(p.e || {});
  if (ej !== r.eqJson) { r.eqJson = ej; dressChibi(r.sprite, p.e || {}); }   // their armour, weapon, shield or torch, and cloak
  r.name = p.n && window.isBadName && isBadName(p.n) ? 'Traveller' : (p.n || 'Traveller');
  r.label.textContent = r.name;
  r.tx = p.x; r.tz = p.z;
  r.cb = typeof p.cb === 'number' ? p.cb : null; r.pt = p.pt || null; r.dl = !!p.dl;
  r.st = typeof p.st === 'number' ? p.st : -1; r.rd = p.rd || null; r.tr = p.tr || null; r.hp = Array.isArray(p.hp) ? p.hp : null;
  registerPlayerSprite(id, r);   // clickable, for the player menu   // sitting at the bonfire, and out of the goblin raid
  r.face = p.f === -1 ? -1 : 1;
  const aj = JSON.stringify(p.a || null);
  if (aj !== r.actJson) { r.actJson = aj; r.act = p.a || null; r.actAt = performance.now(); }
  r.seen = performance.now();
  if (p.c && p.c.k !== r.k) {   // a new line from them
    const said = window.cleanText ? cleanText(p.c.t) : p.c.t;   // masked again here, in case they are on an older version
    addChatLine(r.name, said, '#ffffff');
    sayRemote(r, said);
    r.k = p.c.k;
  }
}
function removeRemote(id){
  const r = remote[id]; if (!r) return;
  joinSeen[id] = Date.now();
  scene.remove(r.sprite); unregisterSprite(r.sprite);
  r.label.remove(); r.bubbleEl.remove(); if (r.hpBar) r.hpBar.remove();
  delete remote[id];
}
let nodeMap = null;
function nodeRecByKey(k){ if (!nodeMap) { nodeMap = {}; treeRecs.forEach(rc => { nodeMap[rc.key] = rc; }); } return nodeMap[k]; }
const ACT_LABEL = { eat: 'eating', farm: 'farming', mill: 'milling', chop: 'chopping', mine: 'mining', smelt: 'smelting', fish: 'fishing', cook: 'cooking', talk: 'talking', smith: 'smithing', fight: 'fighting' };
const ACT_TIME = { spin: 3000, heal: 3500, hutch: 1500, eat: 1200, farm: 2500, mill: 3000, chop: 3600, mine: 3600, smelt: 3000, fish: 3600, cook: 2600, talk: 300000, smith: 6000, fight: 300000 };
// a grey line in the chat for things that happen in the village (not from a player)
function addSystemLine(text){
  const line = document.createElement('div');
  const body = document.createElement('i'); body.textContent = text; body.style.color = '#c9b27a';
  line.append(body); chatLog.appendChild(line);
  while (chatLog.children.length > 60) chatLog.removeChild(chatLog.firstChild);
  chatLog.scrollTop = chatLog.scrollHeight;
}
function sayRemote(r, text){
  r.bubbleEl.textContent = text; r.bubbleEl.style.display = 'block';
  clearTimeout(r.bubbleTimer); r.bubbleTimer = setTimeout(() => { r.bubbleEl.style.display = 'none'; }, 6000);
}
function applyPlayersEvent(ev, d){
  if (d.path === '/') {
    const all = d.data || {};
    if (ev === 'put') Object.keys(remote).forEach(id => { if (!(id in all)) removeRemote(id); });
    Object.keys(all).forEach(id => setRemote(id, all[id]));
    ONLINE.announce = true;   // the first list is the people already here
    return;
  }
  const parts = d.path.split('/').filter(Boolean);
  if (parts.length === 1) { if (d.data === null) removeRemote(parts[0]); else setRemote(parts[0], d.data); }
}
function startStreams(){
  if (ONLINE.streamsOn) return;   // one connection, even after logging out and back in
  ONLINE.streamsOn = true;
  const ps = liveFeed('players');
  ps.addEventListener('put', e => applyPlayersEvent('put', JSON.parse(e.data)));
  ps.addEventListener('patch', e => applyPlayersEvent('patch', JSON.parse(e.data)));
  const ns = liveFeed('nodes');
  let nodesReady = false;   // the first snapshot is the state when we join, so it plays no effects
  const applyNodes = (ev, d) => {
    if (d.path === '/') ONLINE.nodes = d.data || {};
    else { const k = d.path.split('/').filter(Boolean)[0]; if (d.data === null) delete ONLINE.nodes[k]; else ONLINE.nodes[k] = d.data; }
    applyNodeStates(ONLINE.nodes, nodesReady);
    if (d.path === '/') nodesReady = true;
  };
  ns.addEventListener('put', e => applyNodes('put', JSON.parse(e.data)));
  ns.addEventListener('patch', e => applyNodes('patch', JSON.parse(e.data)));
  startEventStreams();
  window.addEventListener('pagehide', () => {
    if (ONLINE.ready) try { fetch(`${DB}/adventure/live/players/${ONLINE.id}.json`, { method: 'DELETE', keepalive: true }); } catch (e) {}   /* a game stopped for another device leaves that device's note alone */
    saveNow(true);
  });
}
// once a frame: send our own position, save progress now and then, and move the others
function updateOnline(){
  if (!ONLINE.ready) return;
  writePresence(false);
  const now = Date.now();
  if (now - ONLINE.lastSave > 4000) { ONLINE.lastSave = now; saveNow(false); }
  const t = performance.now();
  for (const id in remote) {
    const r = remote[id];
    if (t - r.seen > 20000) { removeRemote(id); setTimeout(() => sweepPresence(id), 130000); continue; }   // gone quiet: they have left (their note is tidied away once it's 2 minutes old)
    const x = r.sprite.position.x, z = r.sprite.position.z;
    const nx = x + (r.tx - x) * 0.25, nz = z + (r.tz - z) * 0.25;
    const moving = Math.hypot(nx - x, nz - z) > 0.01;
    r.sprite.position.set(nx, 0, nz);
    if (moving) r.tick++;
    // what they are doing: the swing for chopping and mining, and a label for every action
    const act = r.act && t - r.actAt < ACT_TIME[r.act.k] ? r.act : null;
    if (r.healingMe && !(act && act.k === 'heal' && act.p === ONLINE.id)) { r.healingMe = false; if (!bandaging) healFx(null); }
    if (r.healSnd && !(act && act.k === 'heal')) { r.healSnd.stop(); r.healSnd = null; }   /* they stopped bandaging */   /* their bandaging on you has stopped */
    const verb = act ? ACT_LABEL[act.k] : '';
    if (verb !== r.verb) { r.verb = verb; r.label.textContent = r.name + (verb ? ' (' + verb + ')' : ''); }
    if (moving) r.yaw = Math.atan2(nx - x, nz - z);   // face the way they walk
    { const rc = r.sprite.userData.chibi; if (rc && rc.rod) rc.rod.g.visible = false; if (rc && rc.net) rc.net.g.visible = false; }
    if (act && act.k === 'fish' && !act.r && !moving) netPose(r.sprite, Math.min(1, Math.max(0, (Date.now() - (act.t || 0)) / FISH_MS)), false);   // someone scooping with a net
    else if (act && act.k === 'fish' && act.r && !moving) {   // someone fishing with a rod: the same pose, casting each time their line goes in
      const k = (Date.now() - (act.c || act.t || 0)) / FISH_MS; fishPose(r.sprite, t / 1000, k >= 0 && k < 0.22 ? k / 0.22 : 0, true);
    } else if (act && (act.k === 'chop' || act.k === 'mine')) {
      const node = nodeRecByKey(act.n);
      if (node) r.yaw = yawTo(nx, nz, node.x, node.z);   // face the tree or rock
      poseChibi(r.sprite, 'swing', ((t - r.actAt) / 750) % 1, act.k === 'mine' ? 'pick' : 'axe');
    } else if (act && act.k === 'fight' && (act.m !== undefined || act.d !== undefined) && !moving) {
      const mm = act.d !== undefined ? DELVE && DELVE.mons.find(q => q.sp === act.d) : MONSTERS.find(q => q.sid === act.m);   /* a party delve's creatures go by their spawn tag */ if (mm) r.yaw = yawTo(nx, nz, mm.g.position.x, mm.g.position.z);
      const fa = r.fAnim, c = r.sprite.userData.chibi; if (c) fightPose(c, fa && t - fa.t0 < fa.dur ? fa.kind : 'ready', fa ? (t - fa.t0) / fa.dur : 0);
    } else if (act && act.k === 'heal') {   /* someone bandaging: pluses rise over whoever they're healing, you included */
      const who = act.p ? (act.p === ONLINE.id ? hero : remote[act.p] && remote[act.p].sprite) : r.sprite;
      if (who && t - (r.lastPlus || 0) > 380) { r.lastPlus = t; healPlus(who); }
      if (r.healSndAt !== r.actAt) { r.healSndAt = r.actAt; if (r.healSnd) r.healSnd.stop(); r.healSnd = null; soundAt(nx, nz, () => { r.healSnd = bandageSound(); }); }
      if (act.p === ONLINE.id && who) { healFx(hero); r.healingMe = true; }
      poseChibi(r.sprite, 'work', r.tick / 60);
    } else if (act && act.k === 'eat') poseChibi(r.sprite, 'eat', Math.min(1, (t - r.actAt) / EAT_MS));
    else if (act && act.k === 'farm' && !moving) farmPose(r.sprite, act.f, t - r.actAt);
    else if (act && act.k === 'mill' && !moving) poseChibi(r.sprite, 'pour', 0);
    else if (act && act.k === 'talk' && !moving) { const nb = BARKERS.find(b => b.rec.name === act.n); if (nb) r.yaw = yawTo(nx, nz, nb.rec.x, nb.rec.z); poseChibi(r.sprite, 'idle', 0); }
    else poseChibi(r.sprite, act && (act.k === 'smelt' || act.k === 'spin' || act.k === 'heal' || act.k === 'hutch' || act.k === 'cook' || act.k === 'smith' || act.k === 'fish' || act.k === 'farm') ? 'work' : (moving ? 'walk' : 'idle'), r.tick / 60);
    turnChibi(r.sprite, r.yaw);
    { const away = !sameWorld(r); r.sprite.visible = !away; if (away) { r.label.style.display = 'none'; r.bubbleEl.style.display = 'none'; if (r.hpBar) r.hpBar.style.display = 'none'; continue; } }   /* down in their own cellar */
    if (r.st >= 0 && seatRemote(r)) continue;   // sat on a bench at the bonfire
    const v = new THREE.Vector3(nx, 4.4, nz).project(camera);
    const sx = (v.x + 1) / 2 * innerWidth, sy = (-v.y + 1) / 2 * innerHeight;
    r.label.style.left = sx + 'px'; r.label.style.top = sy + 'px'; r.label.style.display = 'block';
    // their health bar, like yours: while they're fighting or hurt
    const hurt = r.hp && r.hp[1] > 0 && (r.hp[0] < r.hp[1] || (act && act.k === 'fight'));
    if (hurt && !r.hpBar) { r.hpBar = document.createElement('div'); r.hpBar.className = 'hpBar'; r.hpBar.innerHTML = '<i></i>'; document.body.appendChild(r.hpBar); }
    if (r.hpBar) { r.hpBar.style.display = hurt ? 'block' : 'none';
      if (hurt) { r.hpBar.firstChild.style.width = Math.max(0, Math.min(100, r.hp[0] / r.hp[1] * 100)) + '%'; const hv = new THREE.Vector3(nx, 4.0, nz).project(camera); r.hpBar.style.left = (hv.x + 1) / 2 * innerWidth + 'px'; r.hpBar.style.top = (-hv.y + 1) / 2 * innerHeight + 'px'; } }
    const bv = new THREE.Vector3(nx, 4.9, nz).project(camera);   // snapped above the name tag
    r.bubbleEl.style.left = ((bv.x + 1) / 2 * innerWidth) + 'px'; r.bubbleEl.style.top = ((-bv.y + 1) / 2 * innerHeight) + 'px';
  }
}
// post-processing: a gentle glow on bright things like the fire and the sun
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(devicePixelRatio, 2));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.6, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());
