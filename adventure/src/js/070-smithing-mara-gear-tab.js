// ----- smithing at the anvil: bronze bars become gear, and gear is worn from the bag -----
const aOrAn = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
// the anvil's recipes come in tabs, one per metal; it opens on the best metal you have bars of
let SMITH_TAB = null;
const smithTabs = () => [...new Set(RECIPES.map(r => r.bar || 'Bronze bar'))];
function openSmithing(){
  const tabs = smithTabs(), have = tabs.filter(b => barCount(b) > 0);
  SMITH_TAB = have.length ? have[have.length - 1] : (SMITH_TAB || tabs[0]);
  document.getElementById('smithPanel').hidden = false; renderSmith(); }
function barCount(name = 'Bronze bar'){ const b = bag.find(i => i.name === name); return b ? b.qty : 0; }
const barOf = r => r.bar || 'Bronze bar';
function renderSmith(){
  const lvl = levelOf(SKILL_XP.Smithing), tab = SMITH_TAB || 'Bronze bar';
  const tabs = smithTabs().map(b => `<button data-tab="${b}" style="flex:1;font:inherit;padding:6px 4px;cursor:pointer;border:1px solid #5b4324;border-radius:6px 6px 0 0;border-bottom:${b === tab ? 'none' : '1px solid #5b4324'};background:${b === tab ? '#3a2a14' : '#1d150b'};color:${b === tab ? '#f0c35a' : '#c9b27a'}">${b.replace(' bar', '')} <small>(${barCount(b)})</small></button>`).join('');
  document.getElementById('smithList').innerHTML = `<div style="display:flex;gap:4px;margin-bottom:6px">${tabs}</div>` + RECIPES.map((r, i) => {
    if (barOf(r) !== tab) return '';
    const bars = barCount(barOf(r)), ok = lvl >= r.level && bars >= r.bars, most = Math.floor(bars / r.bars);
    const btn = (n, label) => `<button data-r="${i}" data-n="${n}" ${ok ? '' : 'disabled'} style="font:inherit;background:#1d150b;color:#e8efe6;border:1px solid #5b4324;border-radius:5px;padding:3px 7px;cursor:pointer;${ok ? '' : 'opacity:.45;cursor:default'}">${label}</button>`;
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0"><span style="${ok ? '' : 'opacity:.4;filter:grayscale(1)'}">${iconOf(r.name)}</span>
      <span style="flex:1;${ok ? '' : 'opacity:.45;filter:grayscale(1)'}">${r.name}<br><small style="color:#c9b27a">${r.bars} ${barOf(r).toLowerCase()}${r.bars > 1 ? 's' : ''} &middot; Smithing ${r.level}</small></span>
      <span style="display:flex;gap:3px;flex-wrap:wrap;justify-content:flex-end;max-width:112px">${btn(1, '1')}${btn(5, '5')}${btn('x', 'X')}${btn('all', 'All' + (ok ? ' (' + most + ')' : ''))}</span></div>`;
  }).join('');
}
function makeGear(r, n = 1){
  if (!hasTool('Hammer')) { showToast('You need a hammer to work the metal.'); return; }
  if (levelOf(SKILL_XP.Smithing) < r.level) { showToast(`You need Smithing ${r.level} to make ${aOrAn(r.name)} ${r.name.toLowerCase()}.`); return; }
  if (barCount(barOf(r)) < r.bars) { showToast(`You need ${r.bars} ${barOf(r).toLowerCase()}${r.bars > 1 ? 's' : ''}.`); return; }
  if (bag.length >= BAG_SIZE && !hasItem(r.name)) { showToast('Your bag is full.'); return; }
  if (smithing || smelting || cooking) return;
  // hammering takes a moment: the bars are used when the piece is finished, so walking away wastes nothing
  document.getElementById('smithPanel').hidden = true;
  const anvil = trees.find(t => t.userData.rec && t.userData.rec.kind === 'anvil');
  smithing = { r, t0: performance.now(), rec: anvil && anvil.userData.rec, hits: 0, left: n, total: n };   /* a batch: one piece after another */
  smithLabel();
  document.getElementById('smeltBar').style.display = 'block';
  setAct({ k: 'smith', t: Date.now() });
}
let smithing = null;
function smithLabel(){ const s = smithing; document.getElementById('smeltLabel').textContent = s.total > 1 ? `Smithing ${s.r.name.toLowerCase()}s (${s.total - s.left + 1} of ${s.total})...` : `Smithing ${aOrAn(s.r.name)} ${s.r.name.toLowerCase()}...`; }
function smithTime(r){ return 1800 + r.bars * 700; }
function stopSmithing(){ if (!smithing) return; smithing = null; document.getElementById('smeltBar').style.display = 'none'; if (ONLINE.act && ONLINE.act.k === 'smith') setAct(null); }
function updateSmith(){
  if (!smithing) return;
  const T = smithTime(smithing.r), k = (performance.now() - smithing.t0) / T;
  document.getElementById('smeltFill').style.width = Math.min(100, k * 100) + '%';
  if (hero && smithing.rec) heroAnim.yaw = yawTo(hero.position.x, hero.position.z, smithing.rec.x, smithing.rec.z);
  heroAnim.mode = 'work';
  const hits = Math.floor(k * 4); if (hits > smithing.hits && k < 1) { smithing.hits = hits; anvilSound(); }   // a clang every so often
  if (k < 1) return;
  const r = smithing.r;
  if (barCount(barOf(r)) < r.bars) { stopSmithing(); showToast(`You need ${r.bars} ${barOf(r).toLowerCase()}${r.bars > 1 ? 's' : ''}.`); return; }
  if (bag.length >= BAG_SIZE && !hasItem(r.name)) { stopSmithing(); showToast('Your bag is full.'); return; }
  for (let i = 0; i < r.bars; i++) removeItem(barOf(r));
  addItem(r.name, 1, iconOf(r.name)); addXp('Smithing', r.xp); anvilSound();
  showToast(`You make ${aOrAn(r.name)} ${r.name.toLowerCase()}${statText(r.name) ? ' (' + statText(r.name) + ')' : ''}.  +${r.xp} Smithing XP`);
  smithing.left--;
  if (smithing.left <= 0 || barCount(barOf(r)) < r.bars || (bag.length >= BAG_SIZE && !hasItem(r.name))) { stopSmithing(); return; }   // done, or out of bars or room
  smithing.t0 = performance.now(); smithing.hits = 0; smithLabel(); setAct({ k: 'smith', t: Date.now() });   // straight on to the next one
}
function equip(name){
  const def = ITEMS[name], old = equipped[def.slot];
  if (def.req && levelOf(SKILL_XP.Melee) < def.req) { showToast(`You need Melee ${def.req} to use ${aOrAn(name)} ${name.toLowerCase()}.`); return; }
  /* the pair of daggers takes both hands: putting it on takes the shield off, and a shield (or torch) takes the pair off */
  const clash = def.twoHand ? 'shield' : def.slot === 'shield' && equipped.weapon && ITEMS[equipped.weapon] && ITEMS[equipped.weapon].twoHand ? 'weapon' : null;
  const also = clash && equipped[clash];
  if (also && BAG_SIZE - bag.length + 1 < (old ? 1 : 0) + 1) { showToast('Your bag is full.'); return; }
  removeItem(name);
  if (old) addItem(old, 1, ITEMS[old].icon);   // the piece it replaces goes back to the bag
  if (also) { addItem(also, 1, ITEMS[also].icon); equipped[clash] = null; }
  equipped[def.slot] = name;
  heroFrame = '';   // redraw the sprite with the new gear
  renderBag(); renderStats(); renderGear();
  showToast(`Equipped ${name.toLowerCase()}${statText(name) ? ' (' + statText(name) + ')' : ''}.`);
}
// an item's bonuses, as text: "+6 Attack", "+2 Defence"
function statText(name){ const d = ITEMS[name]; if (!d) return ''; return [d.atk && `+${d.atk} Attack`, d.def && `+${d.def} Defence`, d.req && `Melee ${d.req}`].filter(Boolean).join(', '); }
function gearBonus(stat){
  return Object.values(equipped).reduce((t, n) => t + (n && ITEMS[n][stat] ? ITEMS[n][stat] : 0), 0);
}
document.getElementById('smithClose').addEventListener('click', () => { document.getElementById('smithPanel').hidden = true; });
document.getElementById('smithList').addEventListener('click', e => {
  const tb = e.target.closest('button[data-tab]'); if (tb) { SMITH_TAB = tb.dataset.tab; renderSmith(); return; }
  const b = e.target.closest('button[data-r]'); if (!b || b.disabled) return;
  const r = RECIPES[+b.dataset.r], most = Math.floor(barCount(barOf(r)) / r.bars), v = b.dataset.n;
  let n = v === 'all' ? most : v === 'x' ? parseInt(prompt(`How many ${r.name.toLowerCase()}s? (up to ${most})`, String(most)), 10) : +v;
  if (!(n > 0)) return; makeGear(r, Math.min(n, most));
});
// drag an item to another slot to move it; dropping it on another item swaps the two
let bagDrag = null, bagDragged = false;
document.getElementById('bagGrid').addEventListener('pointerdown', e => {
  const cell = e.target.closest('.slot[data-i]'); if (!cell || e.button > 0) return;
  bagDrag = { it: bag[+cell.dataset.i], cell, x: e.clientX, y: e.clientY, ghost: null, over: null };
  const d = bagDrag; clearTimeout(bagHold); bagHold = setTimeout(() => { if (bagDrag === d && !d.ghost) { bagDrag = null; bagDragged = true; setTimeout(() => { bagDragged = false; }, 400); openDropMenu(d.it, d.x + 6, d.y - 10); } }, 550);   /* a long press: the drop menu */
});
let bagHold = 0;
document.getElementById('bagGrid').addEventListener('contextmenu', e => { e.preventDefault(); const cell = e.target.closest('.slot[data-i]'); if (!cell) return; clearTimeout(bagHold); bagDrag = null; const it = bag[+cell.dataset.i]; if (it) openDropMenu(it, e.clientX + 6, e.clientY - 10); });
addEventListener('pointermove', e => {
  const d = bagDrag; if (!d) return;
  if (!d.ghost) {
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
    clearTimeout(bagHold);
    d.ghost = document.createElement('div'); d.ghost.id = 'dragGhost'; d.ghost.innerHTML = d.it.icon; document.body.appendChild(d.ghost);
    d.cell.classList.add('lifted');
  }
  d.ghost.style.left = e.clientX + 'px'; d.ghost.style.top = e.clientY + 'px';
  const under = document.elementFromPoint(e.clientX, e.clientY), over = under && under.closest('#bagGrid .slot');
  if (over !== d.over) { if (d.over) d.over.classList.remove('dropOn'); d.over = over; if (over) over.classList.add('dropOn'); }
  d.outside = !(under && under.closest('#bagPanel'));   // dragged right out of the bag: it goes on the ground
});
function endBagDrag(drop){
  const d = bagDrag; bagDrag = null; if (!d || !d.ghost) return;
  d.ghost.remove(); bagDragged = true; setTimeout(() => { bagDragged = false; }, 0);
  if (drop && d.outside && bag.includes(d.it)) { d.cell.classList.remove('lifted'); dropItem(d.it, false); return; }
  if (drop && d.over && bag.includes(d.it)) {
    const to = +d.over.dataset.s, other = bag.find(x => x.slot === to);
    if (other) other.slot = d.it.slot;
    d.it.slot = to;
  }
  renderBag();
}
addEventListener('pointerup', () => endBagDrag(true));
addEventListener('pointercancel', () => endBagDrag(false));
document.getElementById('bagGrid').addEventListener('click', e => {
  if (bagDragged) return;
  const cell = e.target.closest('.slot[data-i]'); if (!cell) return;
  const it = bag[+cell.dataset.i];
  if (it && openItemMenu(it.name, e.clientX + 6, e.clientY - 10)) return;   // something you can make things from
  if (it && caveItemClick(it, e.clientX + 6, e.clientY - 10)) return;   /* the cave's things: what they're for */
  if (it && it.name === 'Watering can') { openCanMenu(it, e.clientX + 6, e.clientY - 10); return; }   /* fill it at any water nearby, or hang it on the belt */
  if (it && beltSlotFor(it.name) && !ITEMS[it.name]) { const sl = beltSlotFor(it.name); if (toolbelt[sl]) { showToast(`Your toolbelt already holds a ${toolbelt[sl].toLowerCase()}.`); return; } BELT_TAB = beltTabOf(sl); toolbelt[sl] = it.name; removeItem(it.name, it); renderBag(); renderGear(); showToast(`You hang the ${it.name.toLowerCase()} on your toolbelt.`); saveNow(false); return; }
  if (it && FOOD[it.name] && performance.now() < eatReadyAt) return;   /* as in RuneScape: one bite every 1.8 seconds, however fast you click */
  if (it && FOOD[it.name]) { eatReadyAt = performance.now() + EAT_DELAY; if (FIGHT) FIGHT.nextP = Math.max(FIGHT.nextP, performance.now() + EAT_DELAY);   /* and eating in a fight holds back your next swing */
    startEatAnim(); removeItem(it.name, it); /* the very piece you clicked */ const before = HP.cur; HP.cur = Math.min(maxHp(), HP.cur + (HEALS[it.name] || 0)); showToast((/'s /.test(it.name) ? `You eat ${it.name}.` : `You eat the ${it.name.toLowerCase()}.`) + (HP.cur > before ? ` (+${HP.cur - before} health)` : '')); eatSound(); if (FIGHT) FIGHT.nextP = Math.max(FIGHT.nextP, performance.now() + 1200); renderStats(); return; }
  if (it && it.name === 'Bandage') { startBandage(it); return; }
  if (it && ITEMS[it.name]) equip(it.name);
});

// ----- Mara's shop: tools for coins -----
const SHOP = [{ name: 'Bronze axe', price: 20 }, { name: 'Bronze pickaxe', price: 20 }, { name: 'Hammer', price: 10 }, { name: 'Tinderbox', price: 2 }];   /* farming gear and seeds are at Tilly's market, fishing gear at Jory's shack by the pond */
/* Tilly's farmers' market: seeds and farm tools to buy, and she buys what the farm grows and makes */
const MARKET_BUY = [{ name: 'Wheat seeds', price: 3, qty: 5 }, { name: 'Aloe seeds', price: 4, qty: 5 }, { name: 'Mulberry seeds', price: 6, qty: 5 }, { name: 'Hoe', price: 8 }, { name: 'Watering can', price: 12 }];   // seeds come five to a packet
const FARM_GOODS = new Set(['Wheat', 'Flour', 'Bread dough', 'Bread', 'Aloe leaf', 'Mulberry leaves', 'Silk cocoon', 'Silk thread', 'Bandage', 'Feathers', 'Raw chicken', 'Raw beef', 'Cooked chicken', 'Cooked beef']);
/* Jory's fishing shack by the pond: nets, rods and worms, and he buys fish. Raw fish sold to him goes into one shared stock
   (adventure/live/fishstock) that every player can buy from, at twice what he paid: he's a merchant, after all */
const FISH_SHOP = [{ name: 'Small fishing net', price: 5 }, { name: 'Fishing rod', price: 5 }, { name: 'Worms', price: 5, qty: 10 }];
const FISH_GOODS = new Set(['Raw shrimp', 'Shrimp', 'Raw trout', 'Trout', 'Raw bream', 'Bream']);
const FISH_RAW = ['Raw shrimp', 'Raw bream', 'Raw trout'];   // what goes into his stock
const FISH_STOCK = {}, FISH_STOCK_MAX = 200;
const stockKey = n => n.replace(/ /g, '_');
const stockPrice = n => SELL[n] * 2;
async function loadFishStock(){
  try { const r = await fetch(`${DB}/adventure/live/fishstock.json`); const d = await r.json();
    for (const n of FISH_RAW) FISH_STOCK[n] = d && typeof d[stockKey(n)] === 'number' ? Math.max(0, Math.min(FISH_STOCK_MAX, d[stockKey(n)])) : 0; } catch (e) {}
  if (!document.getElementById('shopPanel').hidden && CUR_SHOP === SHOPS.fish) renderShop();
}
// change one fish's count in the shared stock, safely against other players doing the same (a few tries with the server's ETag); returns the new count, or null
async function changeFishStock(name, by){
  const url = `${DB}/adventure/live/fishstock/${stockKey(name)}.json`;
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(url, { headers: { 'X-Firebase-ETag': 'true' } }); const tag = r.headers.get('ETag'), cur = Math.max(0, +(await r.json()) || 0);
      const next = Math.min(FISH_STOCK_MAX, cur + by); if (next < 0) { FISH_STOCK[name] = cur; return null; }
      const w = await fetch(url, { method: 'PUT', headers: { 'If-Match': tag, 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      if (w.ok) { FISH_STOCK[name] = next; return next; }
      if (w.status !== 412) return null; } catch (e) { return null; }
  }
  return null;
}
let stockBusy = false;
async function buyFromStock(name){
  if (stockBusy) return;
  const price = stockPrice(name);
  if (coinCount() < price) { showToast(`A ${name.toLowerCase()} costs ${price} coins. You have ${coinCount()}.`); return; }
  if (!roomForOne(name)) { showToast('Your bag is full.'); return; }
  stockBusy = true; const left = await changeFishStock(name, -1); stockBusy = false;
  if (left === null) { showToast('Someone got there first.'); renderShop(); return; }
  if (coinCount() < price || !roomForOne(name)) { changeFishStock(name, 1); renderShop(); return; }   /* spent or filled up while we waited: put it back */
  COINS -= price; addItem(name, 1, ICON_FOR[name]); showToast(`You buy a ${name.toLowerCase()} for ${price} coins.`); renderShop(); renderBag();
}
const SHOPS = { mara: { title: "Mara's shop", who: 'Mara', buy: SHOP, buys: n => !FARM_GOODS.has(n) && !FISH_GOODS.has(n), hint: 'Bring me logs, ores, bars or your bronze gear.' },
  market: { title: "Tilly's market stall", who: 'Tilly', buy: MARKET_BUY, buys: n => FARM_GOODS.has(n), hint: 'Bring me wheat, flour, leaves, silk, meat or feathers.' },
  fish: { title: "Jory's fishing shack", who: 'Jory', buy: FISH_SHOP, buys: n => FISH_GOODS.has(n), stock: true, hint: 'Bring me shrimp, bream or trout.' } };
let CUR_SHOP = SHOPS.mara;
function openShop(npc){ CUR_SHOP = SHOPS[npc && npc.shop] || SHOPS.mara; if (CUR_SHOP.stock) loadFishStock(); document.getElementById('shopTitle').textContent = CUR_SHOP.title; document.getElementById('shopPanel').hidden = false; renderShop(); }
function coinCount(){ return COINS; }
// what Mara buys: logs, ores, bars and the bronze weapons and shield, for coins
const OLD_DAGGERS = { 'Bronze dagger': 'Bronze daggers', 'Iron dagger': 'Iron daggers' };
const SELL = { 'Bronze axe': 6, 'Bronze pickaxe': 6, 'Iron axe': 16, 'Iron pickaxe': 16, 'Tinderbox': 1, 'Fly fishing rod': 20, 'Iron ore': 8, 'Iron bar': 18, 'Iron daggers': 22, 'Iron boots': 22, 'Iron helmet': 26, 'Iron sword': 50, 'Iron shield': 50, 'Iron leg armour': 75, 'Iron chestplate': 120, 'Raw trout': 5, 'Trout': 8, 'Raw bream': 4, 'Bream': 6, 'Aloe leaf': 4, 'Mulberry leaves': 3, 'Silk cocoon': 6, 'Silk thread': 10, 'Bandage': 14, 'Logs': 4, 'Oak logs': 9, 'Torch': 6, 'Wheat': 3, 'Flour': 4, 'Bread dough': 3, 'Bread': 6, 'Feathers': 1, 'Raw chicken': 2, 'Cooked chicken': 4, 'Raw beef': 2, 'Cooked beef': 5, 'Copper ore': 3, 'Tin ore': 3, 'Bronze bar': 8, 'Bronze daggers': 10, 'Bronze sword': 25, 'Bronze shield': 25, 'Bronze boots': 10, 'Bronze helmet': 12, 'Bronze leg armour': 36, 'Bronze chestplate': 60 };
function countOf(name){ if (name === 'Coins') return COINS; let n = 0; for (const it of bag) if (it.name === name) n += it.qty; return n; }
// how many of each item Mara has been sold lately: each sale lowers her price, and it recovers over time
const DEMAND = {};   // name -> { n, t }
function demandNow(name){ const d = DEMAND[name]; return d ? Math.max(0, d.n - Math.floor((Date.now() - d.t) / 90000)) : 0; }   // one sale fades every 90 seconds
function sellPrice(name, extra = 0){ const f = Math.max(0.4, 1 - 0.05 * (demandNow(name) + extra)); return Math.max(1, Math.round(SELL[name] * f)); }
function sellQuote(name, n){ let t = 0; for (let i = 0; i < n; i++) t += sellPrice(name, i); return t; }   // each unit in a big sale pays a little less
function renderShop(){
  const S = CUR_SHOP;
  const buyRows = S.buy.map((it, i) => `<div style="display:flex;align-items:center;gap:8px;padding:5px 0">${ICON_FOR[it.name]}
    <span style="flex:1">${it.name}${it.qty ? ' (' + it.qty + ')' : ''}<br><small style="color:#c9b27a">${it.price} coins</small></span>
    <button data-s="${i}" style="font:inherit;background:#1d150b;color:#e8efe6;border:1px solid #5b4324;border-radius:5px;padding:3px 10px;cursor:pointer">Buy</button></div>`).join('');
  const sellRows = Object.keys(SELL).filter(n => countOf(n) > 0 && S.buys(n)).map(n => `<div style="display:flex;align-items:center;gap:6px;padding:5px 0">${ICON_FOR[n]}
    <span style="flex:1">${n}<br><small style="color:#c9b27a">x${countOf(n)} &middot; ${sellPrice(n)} each now <span style="opacity:.7">(base ${SELL[n]})</span></small></span>
    <button data-sell="${n}|1" style="font:inherit;background:#1d150b;color:#e8efe6;border:1px solid #5b4324;border-radius:5px;padding:3px 8px;cursor:pointer">Sell 1</button>
    <button data-sell="${n}|all" style="font:inherit;background:#1d150b;color:#e8efe6;border:1px solid #5b4324;border-radius:5px;padding:3px 8px;cursor:pointer">All</button></div>`).join('')
    || `<div style="color:#c9b27a;padding:5px 0">${S.hint}</div>`;
  const stockRows = !S.stock ? '' : `<div style="color:#f0c35a;margin-top:10px">Fresh catch</div>` + (FISH_RAW.filter(n => FISH_STOCK[n] > 0).map(n => `<div style="display:flex;align-items:center;gap:8px;padding:5px 0">${ICON_FOR[n]}
    <span style="flex:1">${n} <small style="color:#9ac87a">(${FISH_STOCK[n]} in stock)</small><br><small style="color:#c9b27a">${stockPrice(n)} coins</small></span>
    <button data-stock="${n}" style="font:inherit;background:#1d150b;color:#e8efe6;border:1px solid #5b4324;border-radius:5px;padding:3px 10px;cursor:pointer">Buy</button></div>`).join('')
    || `<div style="color:#c9b27a;padding:5px 0">Nothing on the slab right now.</div>`);
  document.getElementById('shopList').innerHTML = `<div style="color:#f0c35a;margin-top:2px">Buy</div>${buyRows}${stockRows}
    <div style="color:#f0c35a;margin-top:10px">Sell to ${S.who}</div>${sellRows}
    <div style="margin-top:8px;color:#c9b27a">You have ${coinCount()} coins.</div>`;
}
// sell some of an item to Mara for coins
function sellItem(name, all){
  const have = countOf(name);
  if (!have) { showToast(`You have no ${name.toLowerCase()} to sell.`); return; }
  const n = all ? have : 1;
  const coins = sellQuote(name, n);
  for (let k = 0; k < n; k++) removeItem(name);
  DEMAND[name] = { n: demandNow(name) + n, t: Date.now() };
  addItem('Coins', coins, COIN_ICON);
  showToast(`You sell ${n} ${name.toLowerCase()} for ${coins} coins.`);
  if (CUR_SHOP.stock && FISH_RAW.includes(name)) changeFishStock(name, n).then(() => renderShop());   /* onto his slab, for anyone to buy */
  renderShop(); renderBag();
}
function buyItem(it){
  if (!it.qty && hasTool(it.name)) { showToast(`You already have a ${it.name.toLowerCase()}.`); return; }
  if (coinCount() < it.price) { showToast(`A ${it.name.toLowerCase()} costs ${it.price} coins. You have ${coinCount()}.`); return; }
  if (bag.length >= BAG_SIZE && !hasItem(it.name)) { showToast('Your bag is full, so there is no room for another item.'); return; }
  COINS -= it.price;
  addItem(it.name, it.qty || 1, ICON_FOR[it.name]);
  showToast(it.qty ? `You buy a packet of ${it.qty} ${it.name.toLowerCase()} for ${it.price} coins.` : `You buy a ${it.name.toLowerCase()} for ${it.price} coins.`);
  renderShop();
}
document.getElementById('shopClose').addEventListener('click', () => { document.getElementById('shopPanel').hidden = true; });
document.getElementById('shopList').addEventListener('click', e => {
  const b = e.target.closest('button[data-s]'); if (b) buyItem(CUR_SHOP.buy[+b.dataset.s]);
  const st = e.target.closest('button[data-stock]'); if (st) buyFromStock(st.dataset.stock);
  const sb = e.target.closest('button[data-sell]');
  if (sb) { const [name, mode] = sb.dataset.sell.split('|'); sellItem(name, mode === 'all'); }
});

// ----- the gear tab: each slot and what is worn in it -----
const SLOT_NAMES = { head: 'Head', back: 'Back', body: 'Body', legs: 'Legs', feet: 'Feet', weapon: 'Weapon', shield: 'Shield' };
function renderGear(){
  document.getElementById('gearList').innerHTML = Object.keys(SLOT_NAMES).map(slot => {
    const worn = equipped[slot];
    return `<div class="gearRow"><span>${SLOT_NAMES[slot]}</span>${worn
      ? `<b data-unequip="${slot}" title="Take off" style="cursor:pointer;text-align:right">${worn} &times;<br><small style="color:#9ac87a">${statText(worn)}</small></b>`
      : '<span style="color:#7a6a4a">empty</span>'}</div>`;
  }).join('') + `<div class="gearRow" style="border:0;margin-top:4px"><span>Total</span><b>+${gearBonus('atk')} Attack, +${gearBonus('def')} Defence</b></div>`;
  renderBelt();
}
// the toolbelt's tabs: a skill (or two related ones) each, its tools in order. The tab shows a tool's icon; the panel opens on the last tab used
const BELT_TABS = [
  { name: 'Woodcutting & Firemaking', icon: 'Bronze axe', slots: ['axe', 'tinder'] },
  { name: 'Mining & Smithing', icon: 'Bronze pickaxe', slots: ['pick', 'hammer'] },
  { name: 'Fishing', icon: 'Fishing rod', slots: ['net', 'rod', 'fly'] },
  { name: 'Farming', icon: 'Hoe', slots: ['hoe', 'can'] } ];
let BELT_TAB = 0;
const beltTabOf = sl => Math.max(0, BELT_TABS.findIndex(t => t.slots.includes(sl)));
function renderBelt(){
  const T = BELT_TABS[BELT_TAB] || BELT_TABS[0];
  const tabs = BELT_TABS.map((t, i) => { const on = i === BELT_TAB, n = t.slots.filter(sl => toolbelt[sl]).length;
    return `<button data-belttab="${i}" title="${t.name}" style="flex:1;padding:4px 2px 2px;cursor:pointer;border:1px solid #5b4324;border-radius:6px 6px 0 0;border-bottom:${on ? 'none' : '1px solid #5b4324'};background:${on ? '#3a2a14' : '#1d150b'};color:${on ? '#f0c35a' : '#c9b27a'};font:11px Georgia,serif;line-height:1">${ICON_FOR[t.icon] || ''}<br>${n}/${t.slots.length}</button>`; }).join('');
  document.getElementById('beltList').innerHTML = `<div style="display:flex;gap:3px;margin-bottom:4px">${tabs}</div><div style="color:#f0c35a;font-size:12px;padding:2px 2px 4px">${T.name}</div>` + T.slots.map(sl => {
    const t = toolbelt[sl];
    return `<div class="gearRow"><span>${TOOLBELT_SLOTS[sl]}</span>${t ? `<b data-unbelt="${sl}" title="Put in bag" style="cursor:pointer;text-align:right">${t}${sl === 'can' ? ` <small style="color:#7ab8f0">(${FARM_CAN.n}/${CAN_MAX})</small>` : ''} &times;</b>` : '<span style="color:#7a6a4a">empty</span>'}</div>`;
  }).join('') + `<div style="color:#9a8a6a;font-size:12px;padding:4px 2px">Click a tool in your bag to hang it here.</div>`;
}
function unbelt(sl){
  const name = toolbelt[sl]; if (!name) return;
  if (bag.length >= BAG_SIZE) { showToast('Your bag is full.'); return; }
  toolbelt[sl] = null; addItem(name, 1, ICON_FOR[name] || ''); renderBag(); renderGear(); saveNow(false);
}
function unequip(slot){
  const name = equipped[slot]; if (!name) return;
  if (bag.length >= BAG_SIZE) { showToast('Your bag is full.'); return; }
  equipped[slot] = null; addItem(name, 1, ITEMS[name].icon);
  heroFrame = '';
  renderBag(); renderStats(); renderGear();
}
document.getElementById('gearList').addEventListener('click', e => {
  const b = e.target.closest('[data-unequip]'); if (b) unequip(b.dataset.unequip);
});
document.getElementById('tabGear').addEventListener('click', () => { togglePanel('gearPanel', 'tabGear'); renderGear(); });
document.getElementById('beltList').addEventListener('click', e => { const tb = e.target.closest('[data-belttab]'); if (tb) { BELT_TAB = +tb.dataset.belttab; renderBelt(); return; } const u = e.target.closest('[data-unbelt]'); if (u) unbelt(u.dataset.unbelt); });
document.getElementById('tabBelt').addEventListener('click', () => { togglePanel('beltPanel', 'tabBelt'); renderBelt(); });

