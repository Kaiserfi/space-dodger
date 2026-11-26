// spinning: a bar fills for each cocoon while the wheel turns and the thread winds onto the bobbin
let spinning = null;
function wheelClick(){
  if (!hasItem('Silk cocoon')) { showToast('A spinning wheel. Spin silk cocoons into thread here.'); return; }
  if (spinning) return;
  const W = SILK.WHEEL;
  walkStart(new THREE.Vector3(W.x - 1.7, 0, W.z), () => {   /* standing at the wheel, facing it */
    if (!hasItem('Silk cocoon')) return;
    spinning = { t0: performance.now(), last: 0 }; setAct({ k: 'spin', t: Date.now() });
    document.getElementById('smeltLabel').textContent = 'Spinning silk...'; document.getElementById('smeltBar').style.display = 'block';
    silkSound('spin');
  });
}
function stopSpinning(){ if (!spinning) return; spinning = null; document.getElementById('smeltBar').style.display = 'none'; if (ONLINE.act && ONLINE.act.k === 'spin') setAct(null); }
function updateSpinning(){
  if (!SILK.built) return;
  const now = performance.now();
  SILK.spin = (SILK.spin || 0) + (spinning ? 0.12 : 0) ; SILK.wheel.rotation.z = -SILK.spin; SILK.flyer.rotation.x = SILK.spin * 3.2;   // the flyer turns much faster than the big wheel
  SILK.treadle.rotation.z = spinning ? Math.sin(SILK.spin * 1.0) * 0.25 : 0;   // your foot working the treadle
  if (!spinning || !hero) return;
  const W = SILK.WHEEL;
  if (walkTarget || Math.hypot(hero.position.x - W.x + 1.7, hero.position.z - W.z) > 2.5) { stopSpinning(); return; }
  const k = (now - spinning.t0) / SPIN_MS;
  document.getElementById('smeltFill').style.width = Math.min(100, k * 100) + '%';
  SILK.bobbin.scale.set(1, 1 + 0.6 * Math.min(1, k), 1 + 0.6 * Math.min(1, k));   // thread building up on the bobbin
  heroAnim.yaw = yawTo(hero.position.x, hero.position.z, W.x, W.z); heroAnim.mode = 'work';
  if (k < 1) return;
  if (!hasItem('Silk cocoon')) { stopSpinning(); return; }
  removeItem('Silk cocoon'); addItem('Silk thread', 1, THREAD_ICON); addXp('Crafting', 12); silkSound('done'); rtAdvance(7, 8, 'Show Tilly your silk thread.');
  showToast(`You spin the cocoon into a fine silk thread (${countOf('Silk thread')}).  +12 Crafting XP`); SILK.bobbin.scale.set(1, 1, 1);
  if (!hasItem('Silk cocoon')) { stopSpinning(); saveNow(false); return; }
  spinning.t0 = performance.now(); setAct({ k: 'spin', t: Date.now() }); silkSound('spin');
}
function silkSound(kind){ sfx((ctx, t, out) => {
  if (kind === 'feed') { for (let i = 0; i < 6; i++) nz(ctx, out, t + i * 0.09, 0.12, 'bandpass', 2200 + i * 150, 1800, 1.2, 0.25, 0.01, 0.1); }   // a rustle of leaves
  if (kind === 'collect') { for (let i = 0; i < 4; i++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(700 + i * 120, t + i * 0.1); o.frequency.exponentialRampToValueAtTime(1100 + i * 120, t + i * 0.1 + 0.08);
    g.gain.setValueAtTime(0.0001, t + i * 0.1); g.gain.linearRampToValueAtTime(0.18, t + i * 0.1 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.15); o.connect(g); g.connect(out); o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.2); } }   // soft pops as the cocoons come free
  if (kind === 'spin') {   // the wheel's whirr, rising and falling with each push of the treadle, and the creak of the treadle
    for (let i = 0; i < 4; i++) { nz(ctx, out, t + i * 0.62, 0.62, 'bandpass', 500, 900, 2.5, 0.16, 0.2, 0.4); nz(ctx, out, t + i * 0.62, 0.06, 'lowpass', 400, 250, 1, 0.22, 0.004, 0.05); }
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(110, t); o.frequency.linearRampToValueAtTime(150, t + 1.2); o.frequency.linearRampToValueAtTime(130, t + 2.5);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.3); g.gain.setValueAtTime(0.05, t + 2.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.55); o.connect(g); g.connect(out); o.start(t); o.stop(t + 2.6); }
  if (kind === 'done') { nz(ctx, out, t, 0.12, 'highpass', 3000, 4000, 1, 0.2, 0.005, 0.1); }   // the thread snapped off the bobbin
}); }
function craftSound(){ sfx((c, t, out) => { for (let i = 0; i < 3; i++) nz(c, out, t + i * 0.18, 0.16, 'bandpass', 1400 + i * 300, 1000, 1.4, 0.3, 0.02, 0.13); }); }   // cloth being wrapped and tied

// ===== bandages: kneel and bind the wound; a bar fills, green sparkles swirl and red pluses rise over whoever is healed =====
const BANDAGE_MS = 3200, BANDAGE_HEAL = 12;
let bandaging = null;
function startBandage(it){
  if (bandaging) return;
  openBandageMenu(it);
}
const HEAL_RANGE = 14;   // how near another player must be to bandage them
function openBandageMenu(it){
  itemMenu.innerHTML = '<div class="imHead">Bandage</div><button data-o="me">Heal</button><button data-o="other">Heal other</button><button data-o="x">Cancel</button>';
  itemMenu.hidden = false; itemMenu.style.left = Math.max(8, Math.min(innerWidth - 220, lastPtr.x + 6)) + 'px'; itemMenu.style.top = Math.max(8, Math.min(innerHeight - itemMenu.offsetHeight - 8, lastPtr.y - 10)) + 'px';
  itemMenu.onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.o === 'x') { itemMenu.hidden = true; return; }
    if (b.dataset.o === 'me') { itemMenu.hidden = true; if (HP.cur >= maxHp()) { showToast('You are not hurt.'); return; } beginBandage(it, null); return; }
    if (b.dataset.o === 'other') {   // the hurt players nearby, nearest first
      const near = Object.entries(remote).map(([id, r]) => ({ id, r, d: Math.hypot(r.sprite.position.x - hero.position.x, r.sprite.position.z - hero.position.z) }))
        .filter(o => o.d < HEAL_RANGE && o.r.hp && o.r.hp[0] < o.r.hp[1] && sameWorld(o.r)).sort((a, b) => a.d - b.d);
      itemMenu.innerHTML = '<div class="imHead">Heal who?</div>' + (near.length ? near.map(o => `<button data-p="${o.id}">${escapeHtml(o.r.name)} <small style="color:#c9b27a">(${o.r.hp[0]}/${o.r.hp[1]})</small></button>`).join('') : '<div style="padding:6px 8px;color:#c9b27a">Nobody nearby is hurt.</div>') + '<button data-o="x">Cancel</button>';
      itemMenu.onclick = e2 => { const b2 = e2.target.closest('button'); if (!b2) return; itemMenu.hidden = true; if (b2.dataset.p) healOther(it, b2.dataset.p); };
      e.stopPropagation();
    } };
}
function healOther(it, id){
  const r = remote[id]; if (!r) { showToast("They've wandered off."); return; }
  const go = () => { const r2 = remote[id]; if (!r2) return; heroAnim.yaw = yawTo(hero.position.x, hero.position.z, r2.sprite.position.x, r2.sprite.position.z); beginBandage(it, id); };
  const x = r.tx ?? r.sprite.position.x, z = r.tz ?? r.sprite.position.z, d = Math.hypot(x - hero.position.x, z - hero.position.z);   /* where they really are, not where their figure is still sliding to */
  if (d < 4) { go(); return; }
  walkStart(new THREE.Vector3(x + (hero.position.x - x) / d * 2, 0, z + (hero.position.z - z) / d * 2), go);   /* walk up beside them */
}
function beginBandage(it, who){
  if (bandaging) return;
  walkTarget = null; walkQueue = []; cancelChop(); stopSpinning(); stopMilling();
  const target = who ? remote[who].sprite : hero;
  bandaging = { t0: performance.now(), item: it, target, who, lastPlus: 0 };   /* who: another player's id, or nobody for yourself */
  if (FIGHT) FIGHT.nextP = Math.max(FIGHT.nextP, performance.now() + BANDAGE_MS + 300);
  setAct({ k: 'heal', t: Date.now(), p: who || null });
  document.getElementById('smeltLabel').textContent = who ? `Bandaging ${remote[who].name}...` : 'Applying bandage...'; document.getElementById('smeltBar').style.display = 'block';
  bandaging.snd = bandageSound();
}

// the bandaging sound: three cloth wraps pulled snug and a tie-off, over a soft steady chord with a few sparkles.
// Stretched to the bandage's length, returned so it can be cut off if the bandaging stops; the chime is played when it finishes.
function bandageSound(){
  const ctx = audio(); if (!ctx) return null;
  const out = ctx.createGain(); out.gain.value = 0.55; out.connect(sfxOut(ctx));
  const T = BANDAGE_MS / 1000, k = T / 3.2, t0 = ctx.currentTime + 0.02, nodes = [];
  const keep = n => (nodes.push(n), n);
  const noise = d => noiseBuffer(ctx, d);
  const swish = (t, dur, f0, f1, vol, pan) => { const s = keep(ctx.createBufferSource()); s.buffer = noise(dur); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const pn = ctx.createStereoPanner(); pn.pan.setValueAtTime(-pan, t); pn.pan.linearRampToValueAtTime(pan, t + dur); s.connect(bp); bp.connect(g); g.connect(pn); pn.connect(out); s.start(t); s.stop(t + dur); };
  const snug = (t, vol) => { const s = keep(ctx.createBufferSource()); s.buffer = noise(0.07); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07); s.connect(lp); lp.connect(g); g.connect(out); s.start(t); s.stop(t + 0.08); };
  for (const [a, v] of [[0.15, 0.26], [0.95, 0.24], [1.75, 0.22]]) { swish(t0 + a * k, 0.55, 500, 1500, v, 0.4); snug(t0 + a * k + 0.52, 0.22); }
  swish(t0 + 2.45 * k, 0.18, 1200, 700, 0.18, 0.2); snug(t0 + 2.6 * k, 0.35); snug(t0 + 2.68 * k, 0.25);   // the tie-off
  const pad = ctx.createGain(); pad.gain.setValueAtTime(0.0001, t0); pad.gain.linearRampToValueAtTime(0.08, t0 + 1.2 * k); pad.gain.setValueAtTime(0.08, t0 + T - 0.4); pad.gain.exponentialRampToValueAtTime(0.0001, t0 + T + 0.4);
  const warm = ctx.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.setValueAtTime(700, t0); warm.frequency.linearRampToValueAtTime(1300, t0 + T - 0.4); pad.connect(warm); warm.connect(out);
  for (const [f, det] of [[261.6, -4], [329.6, 3], [392, -2]]) for (const d of [det, -det]) { const o = keep(ctx.createOscillator()); o.type = 'triangle'; o.frequency.value = f; o.detune.value = d;
    const lfo = keep(ctx.createOscillator()), lg = ctx.createGain(); lfo.frequency.value = 3.5; lg.gain.value = 2; lfo.connect(lg); lg.connect(o.detune); lfo.start(t0); lfo.stop(t0 + T + 0.5); o.connect(pad); o.start(t0); o.stop(t0 + T + 0.5); }
  const notes = [784, 880, 987.8, 1174.7, 1318.5];
  for (let i = 0; i < 10; i++) { const at = t0 + (0.6 + i * 0.24) * k + Math.random() * 0.05, o = keep(ctx.createOscillator()), g = ctx.createGain(), pn = ctx.createStereoPanner(); o.type = 'sine'; o.frequency.value = notes[(i * 3 + (i >> 2)) % notes.length];
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.025 + 0.01 * i / 10, at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.45); pn.pan.value = Math.random() * 1.4 - 0.7; o.connect(g); g.connect(pn); pn.connect(out); o.start(at); o.stop(at + 0.5); }
  return { stop(){ try { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(0, ctx.currentTime, 0.04); setTimeout(() => out.disconnect(), 300); } catch (e) {} } };
}
// the bright little chime as the wound closes
function bandageChime(){ sfx((ctx, t, out) => { out.gain.value = 0.55; for (const [f, at, v] of [[523.3, 0, 0.09], [784, 0.07, 0.07], [1046.5, 0.14, 0.05]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t + at); g.gain.linearRampToValueAtTime(v, t + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.55); o.connect(g); g.connect(out); o.start(t + at); o.stop(t + at + 0.6); } }); }
function stopBandage(msg){ if (!bandaging) return; if (bandaging.snd) bandaging.snd.stop(); bandaging = null; document.getElementById('smeltBar').style.display = 'none'; healFx(null); if (ONLINE.act && ONLINE.act.k === 'heal') setAct(null); if (msg) showToast(msg); }
function updateBandage(){
  const now = performance.now();
  updateHealFx(now);
  if (!bandaging || !hero) return;
  if (walkTarget) { stopBandage('You stop bandaging.'); return; }
  if (bandaging.who) { const r = remote[bandaging.who]; if (!r || Math.hypot(r.sprite.position.x - hero.position.x, r.sprite.position.z - hero.position.z) > 4.5) { stopBandage(r ? 'They moved out of reach.' : "They've gone."); return; } heroAnim.yaw = yawTo(hero.position.x, hero.position.z, r.sprite.position.x, r.sprite.position.z); }
  const k = (now - bandaging.t0) / BANDAGE_MS;
  document.getElementById('smeltFill').style.width = Math.min(100, k * 100) + '%';
  if (!FIGHT) heroAnim.mode = 'work';
  healFx(bandaging.target);
  if (now - bandaging.lastPlus > 380) { bandaging.lastPlus = now; healPlus(bandaging.target); }
  if (k < 1) return;
  const it = bandaging.item; updateBandage.who = bandaging.who; bandaging = null; document.getElementById('smeltBar').style.display = 'none'; healFx(null);
  if (!removeItem('Bandage', it)) { if (ONLINE.act && ONLINE.act.k === 'heal') setAct(null); return; }
  const who = updateBandage.who; updateBandage.who = null;
  if (who) {   /* someone else: send them the heal; their game adds it */
    const r = remote[who]; fetch(`${DB}/adventure/live/mobs/_heals/${who}.json`, { method: 'POST', body: JSON.stringify({ a: BANDAGE_HEAL, by: ONLINE.name, t: Date.now() }) }).catch(() => {});
    if (ONLINE.act && ONLINE.act.k === 'heal') setAct(null); const gain = r && r.hp ? Math.max(0, Math.min(BANDAGE_HEAL, r.hp[1] - r.hp[0])) : BANDAGE_HEAL; if (r) hitsplat(r.sprite, gain, 'heal'); if (DELVE && DELVE.party) DELVE.heal = (DELVE.heal || 0) + gain;   /* what they'll really gain, the same number they see */ bandageChime();
    showToast(`You bandage ${r ? r.name : 'them'} up.  +10 Crafting XP`); saveNow(false); return; }
  const before = HP.cur; HP.cur = Math.min(maxHp(), HP.cur + BANDAGE_HEAL); renderStats();
  if (ONLINE.act && ONLINE.act.k === 'heal') setAct(FIGHT ? fightAct(FIGHT.m) : null);
  hitsplat(hero, HP.cur - before, 'heal'); bandageChime();
  showToast(`The aloe soothes the wound and the silk holds it closed. (+${HP.cur - before} health)`);
}
// the healing sparkles: one small cloud of green points, reused, swirling up round the one being healed
let healCloud = null;
function healFx(target){
  if (!healCloud) { const n = 40, pos = new Float32Array(n * 3); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const cv = document.createElement('canvas'); cv.width = cv.height = 32; const cx = cv.getContext('2d'), gr = cx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 32, 32);   /* a soft round glow, not a square */
    healCloud = new THREE.Points(g, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(cv), color: 0x2aff4a, size: 0.42, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending })); healCloud.visible = false; healCloud.frustumCulled = false; scene.add(healCloud);
    healCloud.userData.seed = Array.from({ length: n }, () => [Math.random() * 6.28, Math.random(), 0.5 + Math.random() * 0.6]); }
  healCloud.userData.target = target; healCloud.visible = !!target;
}
function updateHealFx(now){
  if (!healCloud || !healCloud.visible) return; const tg = healCloud.userData.target; if (!tg) return;
  const a = healCloud.geometry.attributes.position, t = now / 1000;
  healCloud.userData.seed.forEach(([ph, h0, r], i) => { const h = (h0 + t * 0.45) % 1, ang = ph + t * 2.2;
    a.setXYZ(i, tg.position.x + Math.cos(ang) * r * (1 - h * 0.4), 0.3 + h * 3.2, tg.position.z + Math.sin(ang) * r * (1 - h * 0.4)); });
  a.needsUpdate = true; healCloud.material.opacity = 0.8 + 0.2 * Math.sin(t * 8);
}
function healPlus(target){
  const el = document.createElement('div'); el.className = 'healPlus'; el.textContent = '+';
  el.style.marginLeft = (Math.random() * 60 - 30) + 'px'; document.body.appendChild(el);
  SPLATS.push({ el, obj: target, t0: performance.now(), y: 2.4 + Math.random() * 0.6 });
}
function troughClick(x, z){
  if (!hasTool('Watering can')) { showToast('A trough of clean water. You could fill a watering can here.'); return; }
  if (FARM_CAN.n >= CAN_MAX) { showToast('Your watering can is already full.'); return; }
  farmAct({ x, z }, 1500, 'fill', () => { FARM_CAN.n = CAN_MAX; renderBag(); renderGear(); renderBelt(); showToast(`You fill the watering can. (${CAN_MAX} waterings)`); }, 2.0);   /* step right up, face the trough, and dip the can in */
}
// milling: like cooking, a bar fills for each sack of wheat while you tip it into the hopper, and the sails turn faster
const MILL_MS = 1800;
let milling = null;
function hopperClick(){
  if (!hasItem('Wheat')) { showToast('The windmill grinds wheat into flour. Put some wheat in the hopper.'); return; }
  if (milling) return;
  const M = FARMLAND.mill;
  walkStart(new THREE.Vector3(M.x + 1.9, 0, M.z + 5), () => {
    if (!hasItem('Wheat')) return;
    milling = { t0: performance.now() };
    setAct({ k: 'mill', t: Date.now() });
    document.getElementById('smeltLabel').textContent = 'Milling...';
    document.getElementById('smeltBar').style.display = 'block';
  });
}
function stopMilling(msg){
  if (!milling) return;
  milling = null; document.getElementById('smeltBar').style.display = 'none';
  if (ONLINE.act && ONLINE.act.k === 'mill') setAct(null);
  if (msg) showToast(msg); saveNow(false);
}
function updateMilling(){
  if (FARMLAND && FARMLAND.sails) FARMLAND.sails.rotation.z -= milling ? 0.02 : 0;   // the sails turn faster while the stones grind
  if (!milling || !hero) return;
  const M = FARMLAND.mill;
  if (walkTarget || Math.hypot(hero.position.x - M.x - 1.9, hero.position.z - M.z - 5) > 3) { stopMilling(); return; }
  const k = (performance.now() - milling.t0) / MILL_MS;
  document.getElementById('smeltFill').style.width = Math.min(100, k * 100) + '%';
  heroAnim.yaw = yawTo(hero.position.x, hero.position.z, M.x + 1.9, M.z + 3.4);
  heroAnim.mode = 'pour';
  if (k < 1) return;
  if (!hasItem('Wheat')) { stopMilling(); return; }
  removeItem('Wheat'); addItem('Flour', 1, FLOUR_ICON); addXp('Farming', 4); farmSound('mill');
  showToast(`The millstones grind the wheat into flour (${countOf('Flour')}).  +4 Farming XP`);
  if (!hasItem('Wheat')) { stopMilling(); return; }
  milling.t0 = performance.now(); setAct({ k: 'mill', t: Date.now() });
}
// flour and a splash of water from the can make bread dough
CRAFTS['Silk thread'] = CRAFTS['Aloe leaf'] = [{ label: 'Make a bandage', make: 'Bandage', skill: 'Crafting', level: 1, xp: 20, needs: { 'Silk thread': 1, 'Aloe leaf': 1 }, msg: 'You wrap aloe leaf in a strip of silk and make a soothing bandage.' }];
CRAFTS['Flour'] = [{ label: 'Make bread dough', make: 'Bread dough', skill: 'Cooking', level: 1, xp: 10, needs: { Flour: 1 }, water: 1 }];
function farmSound(kind){ sfx((ctx, t, out) => {
  if (kind === 'till') { nz(ctx, out, t, 0.25, 'lowpass', 600, 300, 0.8, 0.6, 0.01, 0.2); nz(ctx, out, t + 0.5, 0.25, 'lowpass', 600, 300, 0.8, 0.5, 0.01, 0.2); }
  if (kind === 'plant') { for (let i = 0; i < 5; i++) nz(ctx, out, t + i * 0.08, 0.04, 'bandpass', 2500, 2000, 2, 0.25, 0.002, 0.03); }
  if (kind === 'water') { nz(ctx, out, t, 1.0, 'bandpass', 1800, 1200, 0.6, 0.35, 0.15, 0.8); for (let i = 0; i < 8; i++) nz(ctx, out, t + 0.1 + Math.random() * 0.8, 0.03, 'bandpass', 3000 + Math.random() * 2000, 2500, 3, 0.2, 0.002, 0.025); }
  if (kind === 'fill') { nz(ctx, out, t, 1.2, 'bandpass', 700, 1600, 0.8, 0.4, 0.2, 0.9); }
  if (kind === 'harvest') { for (let i = 0; i < 6; i++) nz(ctx, out, t + i * 0.12, 0.12, 'highpass', 3000, 2000, 0.7, 0.3, 0.005, 0.1); }
  if (kind === 'mill') { nz(ctx, out, t, 1.2, 'lowpass', 200, 160, 0.8, 0.7, 0.1, 1.0); nz(ctx, out, t, 1.0, 'bandpass', 900, 700, 1, 0.15, 0.1, 0.8); }
}); }

