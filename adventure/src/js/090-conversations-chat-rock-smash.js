// ----- conversations: one box that switches between whoever is speaking -----
// A script is a list of steps: a string is the NPC talking, { me } is you talking, { opts } is a choice of what to say,
// { run } does something (hands over an item, moves a quest on) and carries straight on. A line can be a function, worked out when shown.
// In an option, [label, steps, true] comes back to the same choice afterwards, so you can ask more than one question.
const GREETINGS = ['Hello there!', 'Hi!', 'Morning!', 'How are you doing?', 'Hey there.', 'Alright?', 'Afternoon!'];
let dlgQ = [], dlgCur = null, dlgTalkT = 0;
function openDialog(npc){
  let script = questTalk(npc.name);
  if (!script) {
    let lines = npc.lines || [];
    if (npc.talks) {
      const n = MET[npc.name] || 0;
      const set = n < npc.talks.length ? npc.talks[n] : npc.talks[1 + Math.floor(Math.random() * Math.max(1, npc.talks.length - 1))] || npc.talks[0];
      lines = set; MET[npc.name] = n + 1; try { localStorage.setItem('itapMet', JSON.stringify(MET)); } catch (e) {}
    }
    script = [{ me: GREETINGS[Math.floor(Math.random() * GREETINGS.length)] }, ...lines];
    /* one menu: trading first for shopkeepers, then anything you can ask about */
    const opts = [];
    if (npc.choice) opts.push(["Let's trade.", [{ me: "Let's trade." }, { run: () => { endDialog(); openShop(npc); } }]]);
    if (npc.asks) opts.push(...npc.asks.map(a => [a.q, [{ me: a.q }, ...a.a.map(l => typeof l === 'function' ? l() : l)]]));
    if (opts.length) script.push({ opts: [...opts, ['Never mind.', []]] });
  }
  dlg = npc; dlgQ = script.slice(); dlgTalkT = performance.now();
  setAct({ k: 'talk', n: npc.name, t: Date.now() });   // others see who you are talking to, so the NPC can face whoever spoke last
  nextStep();
}
function nextStep(){
  while (dlg) {
    const st = dlgQ.shift();
    if (st === undefined) { endDialog(); return; }
    if (st && st.run) { st.run(); continue; }
    dlgCur = st; renderStep(); return;
  }
}
function headImg(look, hat, facing, gear){ return `<img src="${chatHead(look, hat, facing, gear)}" alt="">`; }
function renderStep(){
  const st = dlgCur, L = document.getElementById('dHeadL'), R = document.getElementById('dHeadR');
  const name = document.getElementById('dlgName'), text = document.getElementById('dlgText'), opts = document.getElementById('dlgOpts'), cont = document.getElementById('dlgCont');
  opts.innerHTML = ''; L.innerHTML = ''; R.innerHTML = '';
  if (st.opts) {
    name.textContent = 'Select an option'; text.textContent = ''; cont.style.display = 'none';
    opts.innerHTML = st.opts.map((o, i) => `<div data-o="${i}">${o[0]}</div>`).join('');
  } else if (st.me !== undefined) {
    name.textContent = ONLINE.name || 'You'; text.textContent = typeof st.me === 'function' ? st.me() : st.me; cont.style.display = '';
    R.innerHTML = headImg(look, null, -0.45);
  } else {
    name.textContent = dlg.name + (dlg.level ? ` (level ${dlg.level})` : ''); text.textContent = typeof st === 'function' ? st() : st; cont.style.display = '';
    L.innerHTML = headImg(dlg.look || {}, dlg.hat, 0.45, dlg.gear);
  }
  document.getElementById('dialog').hidden = false;
}
function pickOption(i){
  const st = dlgCur; if (!st || !st.opts || !st.opts[i]) return;
  const [label, steps, back] = st.opts[i];
  dlgQ = [{ me: label }, ...(steps || []), ...(back ? [st] : []), ...dlgQ];
  nextStep();
}
function endDialog(){
  dlg = null; dlgQ = []; dlgCur = null;
  document.getElementById('dialog').hidden = true;
  if (ONLINE.act && ONLINE.act.k === 'talk') setAct(null);
}
const closeDialog = endDialog, closeDialogBox = endDialog;   // older names for the same thing
document.getElementById('dialog').addEventListener('click', e => {
  const o = e.target.closest('[data-o]');
  if (o) { pickOption(+o.dataset.o); return; }
  if (dlgCur && !dlgCur.opts) nextStep();
});
addEventListener('keydown', e => {
  if (!dlg || (document.activeElement && document.activeElement.id === 'chatInput')) return;
  if (e.key === ' ') { e.preventDefault(); if (dlgCur && !dlgCur.opts) nextStep(); }
  else if (/^[1-9]$/.test(e.key) && dlgCur && dlgCur.opts) pickOption(+e.key - 1);
});
// chat heads: the speaker's own model, drawn once into a small picture and kept
const headCache = {};
let headRenderer = null;
function chatHead(look, hat, facing, gear){
  const key = JSON.stringify([look, hat || '', facing, gear || null]);
  if (headCache[key]) return headCache[key];
  const S = 220;
  if (!headRenderer) { headRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); headRenderer.setSize(S, S); headRenderer.toneMapping = THREE.ACESFilmicToneMapping; headRenderer.outputColorSpace = THREE.SRGBColorSpace; }
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xfff4e0, 0x504030, 1.4));
  const key2 = new THREE.DirectionalLight(0xffe8c8, 1.6); key2.position.set(2, 3, 4); sc.add(key2);
  const fig = makeChibi({ gender: 'male', hair: 'short', hairCol: 0x4a2a14, skin: 0xe8c39c, shirt: 0x3d6fb8, pants: 0x5c4a2a, ...look });
  if (hat) wearHat(fig, hat);
  if (gear) dressChibi(fig, gear);
  fig.scale.setScalar(1); fig.rotation.y = facing || 0; poseChibi(fig, 'idle', 0); fig.userData.chibi.body.position.y = 0; sc.add(fig);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  if (hat || (gear && gear.head)) { cam.position.set(0, 2.15, 4.1); cam.lookAt(0, 1.98, 0); } else { cam.position.set(0, 2.05, 3.4); cam.lookAt(0, 1.85, 0); }
  headRenderer.render(sc, cam);
  return headCache[key] = headRenderer.domElement.toDataURL();
}
// while you talk, you face whoever you are talking to
function updateDialog(){ if (dlg && hero && !walkTarget) heroAnim.yaw = yawTo(hero.position.x, hero.position.z, dlg.x, dlg.z); }
function checkDialogDistance(){
  if (!dlg || !hero) return;
  if (Math.hypot(hero.position.x - dlg.x, hero.position.z - dlg.z) > 5.5) endDialog();
}

// ----- chat: type a line and press Enter; it goes in the log, and shows in yellow above the adventurer -----
const chatLog = document.getElementById('chatLog'), chatInput = document.getElementById('chatInput'), heroChat = document.getElementById('heroChat');
let heroChatTimer = 0;
function addChatLine(who, text, color){
  const line = document.createElement('div');
  const name = document.createElement('b'); name.textContent = who + ': '; name.style.color = color;
  const body = document.createElement('span'); body.textContent = text;   // textContent, so nothing typed is read as HTML
  line.append(name, body); chatLog.appendChild(line);
  while (chatLog.children.length > 60) chatLog.removeChild(chatLog.firstChild);
  chatLog.scrollTop = chatLog.scrollHeight;
}
function sayAbove(text){
  heroChat.textContent = text; heroChat.style.display = 'block';
  clearTimeout(heroChatTimer); heroChatTimer = setTimeout(() => { heroChat.style.display = 'none'; }, 6000);
}
const heroChatV = new THREE.Vector3();
function placeHeroChat(){
  if (heroChat.style.display !== 'block' || !hero) return;
  heroChatV.copy(hero.position).add(new THREE.Vector3(0, 4.2, 0)).project(camera);
  heroChat.style.left = ((heroChatV.x + 1) / 2 * innerWidth) + 'px';
  heroChat.style.top = ((-heroChatV.y + 1) / 2 * innerHeight) + 'px';
}
chatInput.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter') {
    const raw = chatInput.value.trim();
    chatInput.value = ''; chatInput.blur();
    (async () => {
      if (raw && await isEventPhrase(raw)) { startBonfireNight(); return; }   // the secret phrase is never shown or sent
      let text = raw;
      if (text && window.cleanText) text = cleanText(text);   // rude words are masked before anyone sees them
      if (text) { addChatLine(ONLINE.name || 'You', text, '#ffe14d'); sayAbove(text); sendChat(text); }
    })();
  } else if (e.key === 'Escape') chatInput.blur();
});
addEventListener('keydown', e => {   // Enter starts typing, when the creator is not open
  if (e.key === 'Enter' && document.activeElement !== chatInput && creator.hidden) { e.preventDefault(); chatInput.focus(); }
});

// where a point in the world lands across the screen (-1 left, +1 right), so facing matches what the camera shows
const screenV = new THREE.Vector3();
function screenX(x, z){ screenV.set(x, 1, z).project(camera); return screenV.x; }
function updateTrees(){
  const now = Date.now();
  for (const rec of treeRecs) {
    if (rec.state === 'felled' && (!rec.until || rec.until <= now)) regrowNode(rec);   // the shared timer is up: grow back
    if (rec.state === 'growing') {
      rec.t++;
      const k = Math.min(1, rec.t / 60), e = 1 - Math.pow(1 - k, 3);
      rec.g.scale.setScalar(0.05 + 0.95 * e);
      if (k >= 1) rec.state = 'standing';
    } else if (rec.state === 'falling') {
      rec.t++;
      const k = Math.min(1, rec.t / 40);
      rec.g.rotation.z = rec.dir * (Math.PI / 2) * k * k;
      if (k >= 1) { hideNode(rec); if (rec.remoteFall) { soundAt(rec.x, rec.z, fallSound); rec.remoteFall = false; } else { fallSound(); giveLogs(rec); } }
    }
  }
  if (chop.rec) {
    const rec = chop.rec;
    if (rec.state !== 'standing') { chop.rec = null; return; }
    chop.t++;
    rec.g.rotation.z = Math.sin(chop.t * 0.5) * 0.025;   // the node shakes under each blow
    const phase = (chop.t % 45) / 45;              // one full swing every 45 frames
    const facing = screenX(rec.x, rec.z) < screenX(hero.position.x, hero.position.z) ? -1 : 1;   // face the node as the camera sees it
    heroFacing = facing;
    setHeroSwing(phase, rec.kind === 'rock' ? 'pick' : 'axe', yawTo(hero.position.x, hero.position.z, rec.x, rec.z));   // face the node: the arms wind up, strike and recover
    if (chop.t % 45 === 25) { if (rec.kind === 'rock') mineSound(); else chopSound(); }   // the blow lands as the tool comes down
    if (chop.t >= chopFrames(rec) && rec.kind !== 'rock' && rec.level >= 15 && Math.random() >= OAK_FELL_CHANCE) {
      /* an oak, as in OSRS: each log has a 1 in 8 chance to fell it, otherwise the tree stands and you keep chopping */
      chop.t = 0; rec.g.rotation.z = 0;
      if (!bagRoomFor(['Oak logs'])) { chop.rec = null; setAct(null); showToast('Your bag is full.'); return; }
      giveLogs(rec);
    } else if (chop.t >= chopFrames(rec)) {
      // the node is claimed on the server first: if someone else got there, nothing falls
      chop.rec = null; rec.g.rotation.z = 0; rec.state = 'claiming'; setAct(null);
      claimNode(rec).then(until => {
        if (!until) { rec.state = 'standing'; showToast(ONLINE.ok ? 'Someone got there first.' : "Can't reach the village."); return; }
        rec.until = until;
        if (rec.kind === 'rock') mineDone(rec);
        else { rec.state = 'falling'; rec.t = 0; rec.dir = hero.position.x < rec.x ? -1 : 1; creakSound(0.7); }
      });
    }
  }
}
// a node that is down: hidden, with its stump showing
function hideNode(rec){
  rec.state = 'felled';
  rec.g.visible = false; rec.g.rotation.z = 0;
  const i = solidBoxes.indexOf(rec.box); if (i >= 0) solidBoxes.splice(i, 1);
  const j = trees.indexOf(rec.g); if (j >= 0) trees.splice(j, 1);
  rec.stump.visible = true;
}
// a node growing back from a sapling
function regrowNode(rec){
  rec.g.visible = true; rec.g.rotation.z = 0; rec.g.scale.setScalar(0.05);
  rec.stump.visible = false; solidBoxes.push(rec.box); trees.push(rec.g);
  rec.state = 'growing'; rec.t = 0;
}
// the shared state from the database: nodes someone else took are hidden here too
function applyNodeStates(nodes, animate){
  const now = Date.now();
  for (const rec of treeRecs) {
    const n = nodes && nodes[rec.key];
    rec.until = n && n.until ? n.until : 0;
    if (!(rec.until > now && (rec.state === 'standing' || rec.state === 'growing'))) continue;
    if (!animate) hideNode(rec);   // the state when we join: no effects
    else if (rec.state === 'standing' && rec.kind === 'rock') { burstRock(rec); soundAt(rec.x, rec.z, explosionSound); hideNode(rec); }   /* someone else's rock or tree: heard from where it is */
    else if (rec.state === 'standing') { rec.remoteFall = true; rec.state = 'falling'; rec.t = 0; rec.dir = hero.position.x < rec.x ? -1 : 1; soundAt(rec.x, rec.z, () => creakSound(0.7)); }
    else hideNode(rec);
  }
}
const OAK_FELL_CHANCE = 1 / 8;   /* OSRS: an oak falls on 1 log in 8 */
function giveLogs(rec){
  const oak = rec.level >= 15, name = oak ? 'Oak logs' : 'Logs';   /* oaks give oak logs */
  if (addItem(name, 1, oak ? OAK_LOG_ICON : LOG_ICON)) { addXp('Woodcutting', rec.xp); showToast(`You get some ${oak ? 'oak logs' : 'logs'}.  +${rec.xp} Woodcutting XP`); }
  else showToast('Your bag is full.');
}
// a rock that has been mined leaves rubble, gives ore, and comes back later
function mineDone(rec){
  burstRock(rec); explosionSound();
  hideNode(rec);
  const oreName = ORES[rec.ore].item, icon = ICON_FOR[oreName], xp = ORES[rec.ore].xp || 20;
  if (addItem(oreName, 1, icon)) { addXp('Mining', xp); showToast(`You get some ${oreName.toLowerCase()}.  +${xp} Mining XP`); }
  else showToast('Your bag is full.');
}

// ----- the rock smash: the rock breaks into chunks and dust that fly out, bounce, and fade -----
const debris = [];   // { mesh, vel, life, max, grav, spin, s, dust }
function burstRock(rec){
  const cx = rec.x, cz = rec.z, s = rec.s;
  const stone = [0x6e6a62, 0x5c5850, 0x7d786f, 0x67635b, ...ORES[rec.ore].veins];   // the chunks take the ore's colours
  for (let i = 0; i < 12; i++) {
    const size = (0.12 + Math.random() * 0.2) * s;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), mat(stone[i % stone.length]));
    m.position.set(cx + (Math.random() - 0.5) * 0.4 * s, 0.6 * s, cz + (Math.random() - 0.5) * 0.4 * s);
    scene.add(m);
    const a = Math.random() * Math.PI * 2, sp = (0.035 + Math.random() * 0.045) * s;
    debris.push({ mesh: m, vel: new THREE.Vector3(Math.cos(a) * sp, 0.1 + Math.random() * 0.1, Math.sin(a) * sp),
      life: 150 + Math.random() * 60, max: 210, grav: 0.012, spin: (Math.random() - 0.5) * 0.3, s: size, dust: false });
  }
  for (let i = 0; i < 6; i++) {                       // a puff of dust that spreads and fades
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.25 * s, 8, 6), new THREE.MeshBasicMaterial({ color: 0xbdb6a8, transparent: true, opacity: 0.7, depthWrite: false }));
    m.position.set(cx, 0.4 * s, cz); scene.add(m);
    const a = Math.random() * Math.PI * 2, sp = (0.012 + Math.random() * 0.015) * s;
    debris.push({ mesh: m, vel: new THREE.Vector3(Math.cos(a) * sp, 0.01, Math.sin(a) * sp), life: 60, max: 60, grav: 0, spin: 0, s: 0.25 * s, dust: true });
  }
}
function updateDebris(){
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i];
    d.life--;
    d.mesh.position.add(d.vel);
    if (!d.dust) {
      d.vel.y -= d.grav;
      if (d.mesh.position.y < d.s * 0.5) { d.mesh.position.y = d.s * 0.5; d.vel.y *= -0.4; d.vel.x *= 0.6; d.vel.z *= 0.6; }   // bounce and slow down
      d.mesh.rotation.x += d.spin; d.mesh.rotation.y += d.spin * 0.7;
      if (d.life < 40) d.mesh.scale.setScalar(Math.max(0.01, d.life / 40));
    } else {
      const k = 1 - d.life / d.max;
      d.mesh.scale.setScalar(1 + k * 0.8); d.mesh.material.opacity = 0.7 * (1 - k);
    }
    if (d.life <= 0) { scene.remove(d.mesh); d.mesh.geometry.dispose(); d.mesh.material.dispose(); debris.splice(i, 1); }
  }
}
// the blast: a crack of noise that drops into a low rumble, a boom, then stone pieces clattering down
function explosionSound(){
  const ctx = audio(); if (!ctx) return; const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, 0.8);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2500, t); lp.frequency.exponentialRampToValueAtTime(180, t + 0.7);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  src.connect(lp); lp.connect(g); g.connect(sfxOut(ctx)); src.start(t); src.stop(t + 0.8);
  const o = ctx.createOscillator(), og = ctx.createGain();
  o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(35, t + 0.5);
  og.gain.setValueAtTime(0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  o.connect(og); og.connect(sfxOut(ctx)); o.start(t); o.stop(t + 0.6);
  for (let i = 0; i < 6; i++) {
    const tt = t + 0.12 + Math.random() * 0.5;
    const s2 = ctx.createBufferSource(); s2.buffer = noiseBuffer(ctx, 0.08);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500 + Math.random() * 2500; bp.Q.value = 4;
    const cg = ctx.createGain(); cg.gain.setValueAtTime(0.35, tt); cg.gain.exponentialRampToValueAtTime(0.001, tt + 0.08);
    s2.connect(bp); bp.connect(cg); cg.connect(sfxOut(ctx)); s2.start(tt); s2.stop(tt + 0.09);
  }
}

