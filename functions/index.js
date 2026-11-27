// Server checks for the arcade leaderboards. The browser can't be trusted with its own score, so:
//   arcadeStart  - called when a game begins: the server notes the time (one run per player per game at a time)
//   arcadeSubmit - called at game over: the server checks the account, the ban list, the name and the score,
//                  then writes the leaderboard entry itself. The database rules let no browser write the boards.
// A score is turned down if no real game of that length could reach it (CAPS: generous, so honest players on
// fast 144-240 Hz screens, where the games run faster, never hit them). Each entry keeps the run's length
// (secs), so the limits can be tightened later from real games.
'use strict';
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { badName, nameKey } = require('./filter');

admin.initializeApp({ databaseURL: 'https://space-dodger-1a558-default-rtdb.firebaseio.com' });   /* named outright, so the emulator uses the same database too */
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

// the ITAP save watchdog (see watchdog.js)
exports.watchSave = require('./watchdog').watchSave;
// moving a profile to another device with a one-time code (see transfer.js)
Object.assign(exports, require('./transfer'));

// each game: its board in the database, the most points a second of play could give, and a head start for bonuses
const GAMES = {
  scores: { perSec: 6000, base: 2000 },   // Space Dodger
  snake: { perSec: 60, base: 100 },
  crawler: { perSec: 400, base: 1500 },
};
const MAX_SCORE = 9999999, MAX_RUN_MS = 6 * 3600 * 1000;   // nothing on the boards above this; a run older than 6 hours has expired
const db = () => admin.database();

async function who(req){
  const uid = req.auth && req.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Not signed in.');
  if ((await db().ref('banned/' + uid).get()).exists()) throw new HttpsError('permission-denied', 'This account is banned.');
  return uid;
}
const gameOf = g => { if (typeof g !== 'string' || !GAMES[g]) throw new HttpsError('invalid-argument', 'Unknown game.'); return g; };

exports.arcadeStart = onCall(async req => {
  const uid = await who(req), game = gameOf(req.data && req.data.game);
  const id = Math.random().toString(36).slice(2, 12);
  await db().ref(`arcade/runs/${uid}/${game}`).set({ id, t0: Date.now() });
  return { id };
});

exports.arcadeSubmit = onCall(async req => {
  const uid = await who(req), d = req.data || {}, game = gameOf(d.game), G = GAMES[game];
  const score = d.score, name = typeof d.name === 'string' ? d.name.trim() : '';
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) throw new HttpsError('invalid-argument', 'Bad score.');
  if (!/^[A-Za-z0-9 _-]{1,12}$/.test(name)) throw new HttpsError('invalid-argument', 'Bad name.');   /* the same letters the page allows */
  if (badName(name)) throw new HttpsError('invalid-argument', "That name isn't allowed.");
  // a name someone else owns is turned down first, before the run is used up, so the player can pick another and send the same score again
  const key = nameKey(name), owner = (await db().ref(`arcade/names/${key}`).get()).val();
  if (owner && owner !== uid) throw new HttpsError('already-exists', 'That name belongs to another player.');
  // the run: started on the server, not too old, and used once
  const runRef = db().ref(`arcade/runs/${uid}/${game}`), run = (await runRef.get()).val();
  if (!run || run.id !== d.id) throw new HttpsError('failed-precondition', 'No game in progress.');
  await runRef.remove();
  const ms = Date.now() - run.t0;
  if (ms > MAX_RUN_MS) throw new HttpsError('failed-precondition', 'That game is too old.');
  const secs = Math.max(0, ms / 1000);
  if (score > G.base + G.perSec * secs) {
    await db().ref(`arcade/flags/${uid}`).push({ game, score, secs: Math.round(secs), name, at: Date.now() });   // for the owner to look at
    throw new HttpsError('failed-precondition', 'That score is not possible in the time played.');
  }
  // the name: the first account to post it owns it
  const own = await db().ref(`arcade/names/${key}`).transaction(cur => cur === null || cur === uid ? uid : undefined);
  if (!own.committed) throw new HttpsError('already-exists', 'That name belongs to another player.');
  // the board: only a new best for this name replaces the old one
  const entry = { name: name.toUpperCase(), score, ts: Date.now(), uid, secs: Math.round(secs) };
  const res = await db().ref(`${game}/${key}`).transaction(cur => !cur || typeof cur.score !== 'number' || score > cur.score ? entry : undefined);
  return { ok: true, best: res.committed ? score : (res.snapshot.val() || {}).score };
});
