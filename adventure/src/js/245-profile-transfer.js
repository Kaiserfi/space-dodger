// ----- moving your profile to another device (Settings: "Get code" here, "Enter code" there). The server keeps this
// device's sign-in under a one-time code for 10 minutes (functions/transfer.js); the other device swaps the code for it and
// becomes the same account, so it loads the same save. Only one device plays a profile at a time: every game marks its
// presence note with its own session (ss) and when it started (s0, server time); a game that sees a newer session of
// its own account stops, so two devices never overwrite each other's saves.
const FN_URL = 'https://us-central1-space-dodger-1a558.cloudfunctions.net';
const XFER = { ss: Math.random().toString(36).slice(2, 10), s0: 0, kicked: false };
async function fnCall(name, data){
  const r = await fetch(FN_URL + '/' + name, { method: 'POST', headers: { 'content-type': 'application/json', Authorization: 'Bearer ' + AUTH.token }, body: JSON.stringify({ data }) });
  const j = await r.json().catch(() => ({}));
  if (j.error) throw new Error(j.error.message || 'Something went wrong.');
  if (!r.ok) throw new Error("Can't reach the server.");
  return j.result;
}
function xferBox(html){ const b = document.getElementById('xferBox'); b.innerHTML = html; b.hidden = !html; return b; }
document.getElementById('xferGet').addEventListener('click', async () => {
  if (!ONLINE.ready || !AUTH.token) { showToast("You're not connected."); return; }
  xferBox('<div class="xferNote">Getting a code...</div>');
  try {
    ONLINE.saveJson = ''; await saveNow(false);   // the other device loads everything up to now
    const r = await fnCall('transferCreate', { rt: AUTH.rt, name: ONLINE.name });
    xferBox(`<div class="xferCode">${r.code.slice(0, 4)}-${r.code.slice(4)}</div><div class="xferNote">Enter this on your other device. It works once, within 10 minutes.</div>`);
  } catch (e) { xferBox(''); showToast(e.message); }
});
document.getElementById('xferEnter').addEventListener('click', () => {
  const b = xferBox('<input id="xferIn" maxlength="9" placeholder="Code" autocomplete="off" autocapitalize="characters" spellcheck="false"><button id="xferGo">Log in</button><div class="xferNote">This device\'s own progress will be replaced.</div>');
  const inp = b.querySelector('#xferIn'), go = b.querySelector('#xferGo');
  inp.focus();
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go.click(); });
  go.addEventListener('click', async () => {
    if (!AUTH.token) { showToast("You're not connected."); return; }
    go.disabled = true;
    try {
      const r = await fnCall('transferRedeem', { code: inp.value });
      ONLINE.ready = false;   // stop saving this device's own progress
      try { await fetch(`${DB}/adventure/live/players/${ONLINE.id}.json`, { method: 'DELETE' }); } catch (e) {}
      try {
        localStorage.setItem('itapAuth', JSON.stringify({ rt: r.rt, uid: r.uid }));
        localStorage.setItem('itapId', r.uid); localStorage.removeItem('itapOld');
        if (r.name) localStorage.setItem('itapName', r.name);
      } catch (e) {}
      location.reload();
    } catch (e) { go.disabled = false; showToast(e.message); }
  });
});
// presence: who this session is (s0 waits a few seconds, until the server clock is known)
function xferMark(body){
  if (!XFER.s0 && ONLINE.readyAt && Date.now() - ONLINE.readyAt > 5000) XFER.s0 = Math.floor(SNOW());
  body.ss = XFER.ss; if (XFER.s0) body.s0 = XFER.s0;
}
// our own account's note, written by another device: the newer session plays on, the older one stops
function xferCheck(p){
  if (XFER.kicked || !ONLINE.ready || !p || !p.ss || p.ss === XFER.ss || !p.s0) return;
  if (!XFER.s0 || p.s0 <= XFER.s0) return;   /* a game just started is the newest; an older session never stops this one */
  XFER.kicked = true; ONLINE.ready = false;
  showJoin('Your profile is now playing on another device.', false);
  document.getElementById('retryBtn').hidden = true;
  document.getElementById('playHereBtn').hidden = false;
}
document.getElementById('playHereBtn').addEventListener('click', () => location.reload());
