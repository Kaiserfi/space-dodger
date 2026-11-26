// ===== Players: click someone for a menu, and trade with them =====
// Trade offers travel with each player's own presence (tr), so no new database rules are needed. Steps (s):
// -1 asked, 0 offering, 1 accepted the offers, 2 confirmed (with a fingerprint h of both offers), 3 done.
const TRADE = { tr: null, lastTheirs: '', open: false, asked: {}, doneAt: 0 };
const lastTap = { x: innerWidth / 2, y: innerHeight / 2 };
const playerMenu = document.createElement('div'); playerMenu.id = 'playerMenu'; playerMenu.hidden = true; document.body.appendChild(playerMenu);
function registerPlayerSprite(id, r){
  r.sprite.userData.action = 'Trade with'; r.sprite.userData.name = r.name || 'Traveller';
  r.sprite.userData.rec = { kind: 'player', state: 'standing', id, onClick: () => openPlayerMenu(id) };
  if (!trees.includes(r.sprite)) trees.push(r.sprite);
}
function unregisterSprite(sp){ const i = trees.indexOf(sp); if (i >= 0) trees.splice(i, 1); }
function openPlayerMenu(id){
  const r = remote[id]; if (!r) return;
  // someone has already asked you: clicking them accepts, like in RuneScape
  if (r.tr && r.tr.to === ONLINE.id && r.tr.s === -1 && !TRADE.tr) { acceptTrade(id); return; }
  const inMine = PARTY.id && r.pt === PARTY.id, full = PARTY.d && Object.keys(PARTY.d.m || {}).length >= PARTY_MAX;
  playerMenu.innerHTML = `<div class="imHead">${escapeHtml(r.name)}${r.cb ? ` <small style="color:#c9b27a">(level ${r.cb})</small>` : ''}</div><button data-o="trade">Trade with ${escapeHtml(r.name)}</button>${inMine ? '' : full ? '<button disabled style="opacity:.45;cursor:default">Your party is full</button>' : `<button data-o="party">Invite to party</button>`}<button data-o="x">Cancel</button>`;
  playerMenu.hidden = false;
  playerMenu.style.left = Math.min(innerWidth - 180, lastTap.x + 6) + 'px'; playerMenu.style.top = Math.min(innerHeight - 110, lastTap.y - 10) + 'px';
  playerMenu.onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; playerMenu.hidden = true; if (b.dataset.o === 'trade') requestTrade(id); if (b.dataset.o === 'party') inviteToParty(id); };
}
addEventListener('pointerdown', e => { if (!playerMenu.hidden && !playerMenu.contains(e.target)) playerMenu.hidden = true; });
const escapeHtml = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function setTrade(tr){ TRADE.tr = tr; writePresence(true); }
function requestTrade(id){
  const r = remote[id]; if (!r) return;
  if (TRADE.tr && TRADE.tr.s >= 0) { showToast("You're already trading with someone."); return; }
  if (Math.hypot(r.tx - hero.position.x, r.tz - hero.position.z) > 20) { showToast(`${r.name} is too far away. Get a bit closer.`); return; }
  if (FIGHT) { showToast("You can't trade in the middle of a fight!"); return; }
  // if they've asked you too, that's a yes from both
  if (r.tr && r.tr.to === ONLINE.id && r.tr.s === -1) { acceptTrade(id); return; }
  setTrade({ to: id, s: -1, o: [] });
  addSystemLine(`You ask ${r.name} to trade.`);
  setTimeout(() => { if (TRADE.tr && TRADE.tr.to === id && TRADE.tr.s === -1) { setTrade(null); addSystemLine(`${r.name} didn't answer your trade request.`); } }, 30000);
}
function acceptTrade(id){ hideTradeAsk(); setTrade({ to: id, s: 0, o: [] }); }
function cancelTrade(msg){ if (TRADE.tr) setTrade(null); closeTradeWindow(); if (msg) showToast(msg); }
// an incoming request: a line in chat and a little box to answer it
const tradeAsk = document.createElement('div'); tradeAsk.id = 'tradeAsk'; tradeAsk.hidden = true; document.body.appendChild(tradeAsk);
function showTradeAsk(id){
  const r = remote[id]; if (!r) return;
  tradeAsk.innerHTML = `<span>${escapeHtml(r.name)} wants to trade with you.</span><button data-a="yes">Accept</button><button data-a="no">Decline</button>`;
  tradeAsk.hidden = false;
  tradeAsk.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'yes') acceptTrade(id); else { hideTradeAsk(); TRADE.asked[id] = 'declined'; } };
}
function hideTradeAsk(){ tradeAsk.hidden = true; }
// the trade window
const tradePanel = document.createElement('div'); tradePanel.id = 'tradePanel'; tradePanel.hidden = true; document.body.appendChild(tradePanel);
const offerKey = o => JSON.stringify((o || []).slice().sort((a, b) => a.name < b.name ? -1 : 1));
const offerHash = (mine, theirs, otherId) => { const a = offerKey(mine), b = offerKey(theirs), j = ONLINE.id < otherId ? a + '|' + b : b + '|' + a; /* the same on both sides: ordered by player, not by whose it is */ let h = 0; for (let i = 0; i < j.length; i++) h = (h * 31 + j.charCodeAt(i)) | 0; return h; };
function offered(name){ const o = (TRADE.tr && TRADE.tr.o || []).find(x => x.name === name); return o ? o.qty : 0; }
function changeOffer(name, delta){
  const tr = TRADE.tr; if (!tr || tr.s < 0 || tr.s >= 2) return;
  const have = countOf(name), cur = offered(name), next = Math.max(0, Math.min(have, cur + delta));
  tr.o = (tr.o || []).filter(x => x.name !== name); if (next > 0) tr.o.push({ name, qty: next });
  tr.s = 0; setTrade(tr); renderTrade();   // any change means both have to accept again
}
function itemRow(it, side){
  const icon = ICON_FOR[it.name] || '';
  return `<div class="trRow" ${side === 'mine' ? `data-take="${escapeHtml(it.name)}"` : ''}>${icon}<span>${escapeHtml(it.name)}</span><b>${it.qty > 1 ? 'x' + it.qty : ''}</b></div>`;
}
function renderTrade(){
  const tr = TRADE.tr, r = tr && remote[tr.to]; if (!tr || !r) return;
  const theirs = (r.tr && r.tr.o) || [], mine = tr.o || [];
  const confirming = tr.s >= 1 && r.tr && r.tr.s >= 1;
  const status = tr.s === 2 ? `Waiting for ${escapeHtml(r.name)} to confirm...` : confirming ? 'Check the trade carefully, then confirm.'
    : tr.s === 1 ? `Waiting for ${escapeHtml(r.name)} to accept...` : (r.tr && r.tr.s === 1) ? `${escapeHtml(r.name)} has accepted.` : '';
  if (confirming) {
    tradePanel.innerHTML = `<div class="trHead">Trading with ${escapeHtml(r.name)}</div>
      <div class="trCols"><div><h4>You give</h4>${mine.map(i => itemRow(i)).join('') || '<i>Nothing</i>'}</div><div><h4>You get</h4>${theirs.map(i => itemRow(i)).join('') || '<i>Nothing</i>'}</div></div>
      <div class="trStatus">${status}</div>
      <div class="trBtns"><button data-t="confirm" ${tr.s === 2 ? 'disabled' : ''}>Confirm trade</button><button data-t="decline">Decline</button></div>`;
  } else {
    const grouped = []; for (const it of bag) { const g = grouped.find(x => x.name === it.name); if (g) g.qty += it.qty; else grouped.push({ name: it.name, qty: it.qty, icon: it.icon }); }   /* food sits a piece to a slot: list it once, with the whole count */
    const bagRows = [...(COINS > 0 ? [{ name: 'Coins', qty: COINS, icon: COIN_ICON }] : []), ...grouped].map(i => { const left = i.qty - offered(i.name); if (left <= 0) return '';
      return `<div class="trBag">${i.icon}<span>${escapeHtml(i.name)}${left > 1 ? ' x' + left : ''}</span><button data-add="${escapeHtml(i.name)}" data-n="1">+1</button>${left > 1 ? `<button data-add="${escapeHtml(i.name)}" data-n="all">All</button>` : ''}</div>`; }).join('');
    tradePanel.innerHTML = `<div class="trHead">Trading with ${escapeHtml(r.name)}</div>
      <div class="trCols"><div><h4>Your offer</h4>${mine.map(i => itemRow(i, 'mine')).join('') || '<i>Click items below to offer them</i>'}</div><div><h4>${escapeHtml(r.name)}'s offer</h4>${theirs.map(i => itemRow(i)).join('') || '<i>Nothing yet</i>'}</div></div>
      <h4 style="margin:8px 10px 2px">Your bag</h4><div class="trBagList">${bagRows || '<i>Your bag is empty</i>'}</div>
      <div class="trStatus">${status}</div>
      <div class="trBtns"><button data-t="accept" ${tr.s === 1 ? 'disabled' : ''}>Accept</button><button data-t="decline">Decline</button></div>`;
  }
  tradePanel.hidden = false; TRADE.open = true;
}
tradePanel.addEventListener('click', e => {
  const tr = TRADE.tr; if (!tr) return;
  const add = e.target.closest('[data-add]'); if (add) { changeOffer(add.dataset.add, add.dataset.n === 'all' ? 9999 : 1); return; }
  const take = e.target.closest('[data-take]'); if (take) { changeOffer(take.dataset.take, -9999); return; }
  const b = e.target.closest('[data-t]'); if (!b) return;
  if (b.dataset.t === 'decline') { cancelTrade('You decline the trade.'); return; }
  if (b.dataset.t === 'accept') { tr.s = 1; setTrade(tr); renderTrade(); return; }
  if (b.dataset.t === 'confirm') {
    const r = remote[tr.to]; if (!r || !r.tr) return;
    if (!roomFor(tr.o || [], r.tr.o || [])) { showToast("You don't have enough room in your bag for this trade."); return; }
    tr.s = 2; tr.h = offerHash(tr.o, r.tr.o, tr.to); setTrade(tr); renderTrade();
  }
});
function closeTradeWindow(){ tradePanel.hidden = true; TRADE.open = false; }
// will everything you're getting fit, once what you're giving has gone?
function roomFor(give, get){
  const left = {}; for (const it of bag) left[it.name] = (left[it.name] || 0) + it.qty; for (const g of give) left[g.name] -= g.qty; for (const g of get) left[g.name] = (left[g.name] || 0) + g.qty;
  let used = 0; for (const n in left) if (left[n] > 0 && n !== 'Coins') used += SINGLE.has(n) ? left[n] : 1;   // a slot per piece of food, a slot per stack of anything else
  return used <= BAG_SIZE;
}
// the swap itself: give what you offered, take what they offered
function completeTrade(theirs){
  const tr = TRADE.tr, r = remote[tr.to], name = r ? r.name : 'them';
  if ((tr.o || []).some(g => countOf(g.name) < g.qty)) { cancelTrade("Something you offered isn't in your bag any more, so the trade was cancelled."); return; }
  for (const g of tr.o || []) for (let i = 0; i < g.qty; i++) removeItem(g.name);
  for (const g of theirs) addItem(g.name, g.qty, ICON_FOR[g.name] || '');
  tr.s = 3; setTrade(tr); TRADE.doneAt = Date.now();
  setTimeout(() => { if (TRADE.tr && TRADE.tr.s === 3) setTrade(null); }, 4000);   // stay "done" long enough for them to see it
  closeTradeWindow(); renderBag(); saveNow(false);
  showToast(`Trade with ${name} complete.`); addSystemLine(`You traded with ${name}.`);
}
// each frame: answer requests, open and keep the window up to date, and finish or cancel as the other side does
function updateTrade(){
  const tr = TRADE.tr;
  // incoming requests
  for (const id in remote) { const r = remote[id];
    if (r.tr && r.tr.to === ONLINE.id && r.tr.s === -1 && !TRADE.asked[id] && !(tr && tr.s >= 0)) { TRADE.asked[id] = 'shown'; addSystemLine(`${r.name} wants to trade with you.`); showTradeAsk(id); }
    if (!(r.tr && r.tr.to === ONLINE.id && r.tr.s === -1) && TRADE.asked[id]) { delete TRADE.asked[id]; if (!tradeAsk.hidden && tradeAsk.textContent.includes(r.name)) hideTradeAsk(); }
  }
  if (!tr) { if (TRADE.open) closeTradeWindow(); return; }
  const r = remote[tr.to];
  if (!r) { cancelTrade('The other player has left.'); return; }
  const theirs = r.tr && r.tr.to === ONLINE.id ? r.tr : null;
  if (tr.s === 3) return;
  if (tr.s === -1) { if (theirs && theirs.s >= 0) { tr.s = 0; setTrade(tr); } return; }   // they said yes
  if (!theirs) { if (TRADE.open || Date.now() - (TRADE.since || 0) > 8000) cancelTrade(`${r.name} declined the trade.`); return; }
  if (Math.hypot(r.tx - hero.position.x, r.tz - hero.position.z) > 25) { cancelTrade('You walked too far away, so the trade was cancelled.'); return; }
  // their offer changed: everyone accepts again
  const tk = offerKey(theirs.o);
  if (tk !== TRADE.lastTheirs) { TRADE.lastTheirs = tk; if (tr.s > 0 && tr.s < 3) { tr.s = 0; setTrade(tr); } if (TRADE.open) renderTrade(); }
  // both confirmed the same thing: swap
  if (tr.s === 2 && (theirs.s === 2 || theirs.s === 3) && theirs.h === tr.h) { completeTrade(theirs.o || []); return; }
  if (!TRADE.open) { TRADE.since = Date.now(); renderTrade(); }
  else if ((TRADE.lastStatus || '') !== tr.s + ':' + theirs.s) { TRADE.lastStatus = tr.s + ':' + theirs.s; renderTrade(); }
}

