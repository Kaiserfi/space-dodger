// The save watchdog: every time an ITAP save is written (adventure/saves/<uid>), compare it with the last good one.
// Coins, XP or an item jumping further than real play could take it in the time since the last save are put back to the
// last good value, the save is rewritten, and the account is flagged (watch/flags/<uid>) for the owner to look at.
// Losses are always fine (dying, the cellar's penalty, spending). Climbing back to your own best is always fine too
// (a gravestone picked up, XP the cellar took earned again), so the limits only bite on gains past anything seen before.
// The first time an account is seen, its save is just noted as the starting point: existing progress is never questioned.
// When a save is corrected, adventure/live/wd/<uid> gets the time, and the player's game reloads the corrected save,
// so an honest player is never stuck re-sending a value the server keeps turning down.
// The owner can exempt an account (for example after giving coins by hand in the console) with watch/trust/<uid> = true.
'use strict';
const { onValueWritten } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');

const LIMITS = {
  xp: { burst: 3000, perSec: 60 },      // per skill: the cave chest is +600, a quest a few hundred; fighting and skilling far under 60 a second
  coins: { burst: 25000, perSec: 50 },  // selling a full bag is a few thousand; a trade or the reward chests less than that
  item: { burst: 3000, perSec: 30 },    // per item name: feathers come 5 to 15 a chicken, ores and logs one at a time
  maxGapSecs: 120,                      // time between saves counts for at most this much (saves come every few seconds while playing)
};
const db = () => admin.database();

// a save boiled down to what the watchdog checks
function summary(s){
  const items = {}, add = (n, q) => { if (typeof n === 'string' && n) items[n] = (items[n] || 0) + (Number.isFinite(q) && q > 0 ? q : 0); };
  for (const it of Array.isArray(s.bag) ? s.bag : Object.values(s.bag || {})) if (it) add(it.name, it.qty || 1);
  for (const k in s.eq || {}) add(s.eq[k], 1);
  for (const k in s.tb || {}) add(s.tb[k], 1);
  const xp = {}; for (const k in s.xp || {}) if (Number.isFinite(s.xp[k])) xp[k] = s.xp[k];
  return { co: Number.isFinite(s.co) ? s.co : 0, xp, items };
}
const higher = (a, b) => { const o = { co: Math.max(a.co, b.co), xp: { ...a.xp }, items: { ...a.items } };
  for (const k in b.xp) o.xp[k] = Math.max(o.xp[k] || 0, b.xp[k]); for (const k in b.items) o.items[k] = Math.max(o.items[k] || 0, b.items[k]); return o; };
const allowed = (prev, peak, L, secs) => Math.max(prev || 0, peak || 0) + L.burst + L.perSec * secs;

exports.watchSave = onValueWritten({ ref: '/adventure/saves/{uid}', instance: 'space-dodger-1a558-default-rtdb', region: 'us-central1' }, async event => {
  const after = event.data.after.val(), uid = event.params.uid;
  if (!after || typeof after !== 'object') return;
  if ((await db().ref(`watch/trust/${uid}`).get()).exists()) return;
  const now = Date.parse(event.time) || Date.now(), stRef = db().ref(`watch/state/${uid}`), st = (await stRef.get()).val(), cur = summary(after);
  if (!st || !st.prev) { await stRef.set({ t: now, prev: cur, peak: cur }); return; }   // first sight: the starting point
  const secs = Math.min(LIMITS.maxGapSecs, Math.max(1, (now - (st.t || now)) / 1000)), prev = st.prev, peak = st.peak || st.prev;
  prev.xp = prev.xp || {}; prev.items = prev.items || {}; peak.xp = peak.xp || {}; peak.items = peak.items || {};
  const bad = [], fixed = JSON.parse(JSON.stringify(after));
  if (cur.co > allowed(prev.co, peak.co, LIMITS.coins, secs)) { bad.push({ what: 'coins', was: prev.co, now: cur.co }); fixed.co = prev.co; }
  for (const k in cur.xp) if (cur.xp[k] > allowed(prev.xp[k], peak.xp[k], LIMITS.xp, secs)) {
    bad.push({ what: 'xp ' + k, was: prev.xp[k] || 0, now: cur.xp[k] }); fixed.xp[k] = prev.xp[k] !== undefined ? prev.xp[k] : 0; }
  for (const name in cur.items) if (cur.items[name] > allowed(prev.items[name], peak.items[name], LIMITS.item, secs)) {
    bad.push({ what: 'item ' + name, was: prev.items[name] || 0, now: cur.items[name] });
    let keep = prev.items[name] || 0;   /* trim that item in the bag back to what it was */
    const bag = Array.isArray(fixed.bag) ? fixed.bag : Object.values(fixed.bag || {});
    fixed.bag = bag.map(it => { if (!it || it.name !== name) return it; const q = Math.min(it.qty || 1, keep); keep -= q; return q > 0 ? { ...it, qty: q } : null; }).filter(Boolean);
  }
  if (!bad.length) { await stRef.set({ t: now, prev: cur, peak: higher(peak, cur) }); return; }
  const good = summary(fixed);
  await stRef.set({ t: now, prev: good, peak: higher(peak, good) });   // noted first, so the rewrite below passes straight through
  await db().ref(`adventure/saves/${uid}`).set(fixed);   /* through the one connection: the trigger's own ref is a second, differently addressed one, which Firebase refuses */
  await db().ref(`watch/flags/${uid}`).push({ at: now, secs: Math.round(secs), bad });
  await db().ref(`adventure/live/wd/${uid}`).set(now);   // the player's game reloads the corrected save
});
