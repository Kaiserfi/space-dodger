// Moving a profile to another device with a one-time code (ITAP Adventure's settings: "Get code" / "Enter code").
//   transferCreate - the device that has the profile asks for a code. The server checks the sign-in it sends really is
//                    this account, and keeps it under the code for 10 minutes (transfer/codes/<code>, never readable by a browser).
//   transferRedeem - the other device sends the code and gets that sign-in back, once. From then on both devices are the
//                    same account, so the save, the arcade names and everything else come along.
// One code per account at a time (a new one cancels the old), and each device gets a few tries every 10 minutes.
'use strict';
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const crypto = require('crypto');

const FB_KEY = 'AIzaSyANcegZrOyf1O03SbLMBQVTGRJXuNIKLPA';   // the project's public web key, as in the game
const TTL_MS = 10 * 60000, TRIES = 10, TRY_WINDOW_MS = 10 * 60000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no I, O, 0 or 1, which are easy to mix up
const db = () => admin.database();
const tokenHost = () => process.env.FIREBASE_AUTH_EMULATOR_HOST ? `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/securetoken.googleapis.com` : 'https://securetoken.googleapis.com';

async function signedIn(req){
  const uid = req.auth && req.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Not signed in.');
  if ((await db().ref('banned/' + uid).get()).exists()) throw new HttpsError('permission-denied', 'This account is banned.');
  return uid;
}
const newCode = () => Array.from({ length: 8 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
const cleanCode = c => typeof c === 'string' ? c.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

exports.transferCreate = onCall(async req => {
  const uid = await signedIn(req), d = req.data || {};
  const rt = typeof d.rt === 'string' ? d.rt : '', name = typeof d.name === 'string' ? d.name.slice(0, 12) : '';
  if (!rt || rt.length > 2000) throw new HttpsError('invalid-argument', 'Bad sign-in.');
  // the sign-in must belong to this account, so nobody can hand out someone else's
  const r = await fetch(`${tokenHost()}/v1/token?key=${FB_KEY}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(rt) });
  const j = r.ok ? await r.json() : null;
  if (!j || j.user_id !== uid) throw new HttpsError('permission-denied', "That sign-in isn't yours.");
  const now = Date.now(), codes = db().ref('transfer/codes');
  // tidy: this account's old code, and anyone's that ran out
  const all = (await codes.get()).val() || {}, gone = {};
  for (const k in all) if (!all[k] || all[k].uid === uid || all[k].exp < now) gone[k] = null;
  if (Object.keys(gone).length) await codes.update(gone);
  let code = newCode(); while (all[code] && !(code in gone)) code = newCode();
  const exp = now + TTL_MS;
  await codes.child(code).set({ uid, rt: j.refresh_token || rt, name, exp });
  return { code, exp };
});

exports.transferRedeem = onCall(async req => {
  const me = await signedIn(req), code = cleanCode(req.data && req.data.code), now = Date.now();
  // a few tries per device, so codes can't be guessed
  const tries = await db().ref(`transfer/tries/${me}`).transaction(cur => {
    if (!cur || now - cur.t > TRY_WINDOW_MS) return { n: 1, t: now };
    return { n: cur.n + 1, t: cur.t };
  });
  if (tries.snapshot.val().n > TRIES) throw new HttpsError('resource-exhausted', 'Too many tries. Wait a few minutes.');
  if (code.length !== 8) throw new HttpsError('not-found', "That code isn't right, or it has run out.");
  const ref = db().ref(`transfer/codes/${code}`), v = (await ref.get()).val();
  if (!v || !v.rt || v.exp < now) { if (v) await ref.remove(); throw new HttpsError('not-found', "That code isn't right, or it has run out."); }
  await ref.remove();   // it works once
  if ((await db().ref('banned/' + v.uid).get()).exists()) throw new HttpsError('permission-denied', 'This account is banned.');
  return { rt: v.rt, uid: v.uid, name: v.name || '' };
});
