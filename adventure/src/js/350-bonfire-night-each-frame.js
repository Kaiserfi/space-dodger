// ----- each frame: the whole night, worked out from the shared state and the time since it began -----
let evWasActive = false, raidSys = '';
function updateBonfire(){
  updateFireLook(); updateToss(); updateEvSay(); updateGraves();
  const active = evActive();
  if (!active) {
    if (evWasActive) endNight();
    evWasActive = false; updateRaiders(); return;
  }
  const d = EV.data, t = evT(), ph = evPhase(), st = (d.raid && d.raid.st) || 'calm';
  if (EV.curStart !== d.start) { EV.curStart = d.start; evWasActive = false; EV.chat = null; EV.chatsDone = []; EV.nextChat = undefined; }   // a new fire (say, the night proper starting over a casual one)
  if (d.casual) {
    if (!evWasActive) { evWasActive = true; if (Date.now() - d.start < 30000) addSystemLine(`${d.by || 'Someone'} has lit the bonfire in the oak grove.`); }
    if (fuelNow() <= 0 && Date.now() - d.start > 20000 && !d.done) { d.done = true; evPatch({ done: true }); }   // burnt out: whoever notices first says so
    casualVisitors(t);
    return;
  }
  if (!evWasActive) { evWasActive = true; EV.said = {}; EV.warn = 0; EV.joinT = t; EV.deadNow = false; raidSys = '';
    if (t < 60) addSystemLine('Aldric is lighting a bonfire in the oak grove, south-west of the hall. Come and warm yourselves!');
    else addSystemLine('A bonfire is burning in the oak grove, south-west of the hall.'); }
  if (ONLINE.ready && amHost()) hostTick();
  // a line the host asked everyone to show
  if (d.say && d.say.k !== EV.sayK) { EV.sayK = d.say.k; if (Date.now() - d.say.k < 10000) evSay(npcSp(d.say.who), d.say.text); }
  // the raid's news, once each
  if (st !== raidSys) {
    if (ph === 'creep' && raidSys !== 'creep') { addSystemLine('Something is moving in the darkness south of the bonfire...'); evSay(npcSp('Aldric'), "Hold on... something's moving out past the trees."); }
    if (st === 'rush') { addSystemLine('Goblins are attacking the bonfire!'); for (let i = 0; i < 4; i++) setTimeout(() => soundAt(BF.x, BF.z, () => combatSound('goblinAttack')), i * 140); }
    if (st === 'lost') { addSystemLine('Everyone at the fire has fallen! The village guards are coming!'); evSay(npcSp('Osric'), "Guards, to the bonfire! Now!"); }
    if (st === 'over') raidOver(d);
    raidSys = ph === 'creep' ? 'creep' : st;
  }
  // you only fight if you were at the fire when they charged, and you're out of it once you've fallen
  const part = d.raid && d.raid.part && d.raid.part[ONLINE.id];
  if (part && (st === 'rush') && HP.cur <= 0) EV.deadNow = true;
  updateNightNpcs(t, ph, st);
  updateRaiders();
  // the fire getting low: the villagers say so, a little more urgently each time
  const f = fuelNow();
  if (st === 'calm' && ph === 'calm' && t > 25) {
    if (f < 0.45 && EV.warn < 1) { EV.warn = 1; evSay(npcSp('Hilde'), "The fire's getting a bit low, isn't it?"); }
    if (f < 0.25 && EV.warn < 2) { EV.warn = 2; evSay(npcSp('Aldric'), "Could someone fetch a log or two? The trees by the hall will do nicely."); }
    if (f < 0.1 && EV.warn < 3) { EV.warn = 3; evSay(npcSp('Fenwick'), "Quick, it's nearly out! Somebody throw a log on!"); }
    if (f > 0.5) EV.warn = Math.min(EV.warn, 0);
  }
  EV.lastFuel = f;
}
function raidOver(d){
  const won = d.raid && d.raid.won, mine = d.raid && d.raid.part && d.raid.part[ONLINE.id];
  if (won) {
    addSystemLine('The goblins have been driven off! The village is safe.');
    evSound('cheer');
    const lines = [['Aldric', "Well fought, all of you. The village owes you one tonight."], ['Hilde', "Oh, thank goodness. Thank you, thank you all!"], ['Bram', "Did you see that? They sent them running!"], ['Lyra', "Now that's a song worth writing. Thank you!"], ['Pip', "That was the best night EVER! Thank you!"], ['Fenwick', "I'd have had them myself, mind. But thank you all the same."]];
    lines.forEach(([who, text], i) => setTimeout(() => evSay(npcSp(who), text), 2500 + i * 2800));
    let paid = ''; try { paid = localStorage.getItem('itapNightPaid') || ''; } catch (e) {}
    if (mine && paid !== String(d.start)) { try { localStorage.setItem('itapNightPaid', String(d.start)); } catch (e) {}
      const coins = 150; if (addItem('Coins', coins, COIN_ICON)) showToast(`The village thanks you with ${coins} coins.`); saveNow(false); }
  } else {
    addSystemLine('The village guards have driven the goblins off.');
    [['Osric', "That's the last of them. Everyone all right?"], ['Edda', "They won't come back here in a hurry."], ['Aldric', "Next time, we'll be ready for them."]].forEach(([who, text], i) => setTimeout(() => evSay(npcSp(who), text), 2000 + i * 2800));
  }
}
// where every villager is and what they're doing tonight
function updateNightNpcs(t, ph, st){
  const now = performance.now() / 1000;
  const raiding = st === 'rush' || st === 'lost' || (ph === 'creep' && Date.now() - EV.data.raidAt > 26000);
  const over = st === 'over', ending = over && Date.now() - EV.data.raid.at > 20000;
  // Aldric: walks out, kneels and strikes the flint, then stands guard by the way in; in the raid he fights
  const ald = ending && !EV.npcs.Aldric ? null : borrowNpc('Aldric');   // once sent home, they stay home
  if (ald) {
    const gd = EV.data.gd && EV.data.gd.Aldric;
    if ((st === 'rush' || st === 'lost') && gd) guardFrame(ald, gd);
    else if (ending) goHome(ald, t);
    else if (t < 6 && EV.joinT < 6) { if (!ald.path || ald.path.tag !== 'out') { npcRoute(ald, KNEEL(), 0, 4.5); ald.path.tag = 'out'; ald.path.t1 = Math.max(ald.path.t1, 0.1); const k = 6 / ald.path.t1; ald.path.speed /= k; ald.path.t1 = 6; } followRoute(ald, t); }
    else if (t < 10 && EV.joinT < 10) kneelFrame(ald, t);
    else { if (!ald.path || ald.path.tag !== 'post') { npcRoute(ald, ALD_POST(), Math.max(t, 10), 4.5); ald.path.tag = 'post'; } if (followRoute(ald, t)) { ald.sp.rotation.y = yawTo(ald.sp.position.x, ald.sp.position.z, BF.x, BF.z); poseChibi(ald.sp, 'idle', now); } }
  }
  for (const gst of GUESTS) {
    if (ending && !EV.npcs[gst.name]) continue;   // already sent home: don't take them back
    const n = borrowNpc(gst.name); if (!n) continue;
    const seat = BF.seats[gst.seat], seed = gst.name.length;
    if (ending) { goHome(n, t); continue; }
    if (raiding) { panicFrame(n, gst, now); continue; }
    if (t < gst.leave) { poseChibi(n.sp, 'idle', now); continue; }
    if (!n.path || n.path.tag !== 'seat') { if (t - gst.leave > 25) n.sp.position.set(seat.ax, 0, seat.az);   // joining late: they're already sat down
      npcRoute(n, [seat.ax, seat.az], Math.max(gst.leave, t), gst.run ? 7 : 4.5); n.path.tag = 'seat'; if (t - gst.leave < 3) evSay(n.sp, gst.hi); }
    if (!followRoute(n, t)) continue;
    if (!n.satT) { n.satT = now; evSound('sit', seat.x, seat.z); }
    sitPoseAt(n.sp, seat, now, seed, gst.child);
    const k = smooth(clamp01((now - n.satT) / 0.45)); n.sp.position.y = 0.3 * k;
  }
  // guards come running if everyone at the fire has fallen
  if (st === 'lost') for (const name of GUARDS) { const n = borrowNpc(name), gd = EV.data.gd && EV.data.gd[name]; if (n && gd) guardFrame(n, gd); }
  if (over) for (const name of GUARDS) { const n = EV.npcs[name]; if (n) { if (ending || Date.now() - EV.data.raid.at > 12000) goHome(n, t); else { poseChibi(n.sp, 'idle', now); } } }
  // conversations while everyone's settled
  if (st === 'calm' && ph === 'calm' && t > 22) {
    const slot = Math.floor((t - 22) / 30), conv = CONVOS[Math.min(slot, CONVOS.length - 1)], into = (t - 22) - slot * 30;
    if (slot < CONVOS.length) conv.forEach(([who, text], i) => { const key = slot + ':' + i; if (into > i * 3.2 && into < i * 3.2 + 1 && !EV.said[key]) { EV.said[key] = 1; evSay(npcSp(who), text); } });
  }
}
// while a fire someone lit stays going, a villager or two wanders over now and then, sits a while, and heads home.
// Who comes and when is worked out from when the fire was lit, so everyone sees the same visitors.
const VISIT = {
  Lyra: ["Ooh, a fire! Mind if I warm my hands for a bit?", "Nothing beats a fire on a cold night. I might write a song about this one."],
  Fenwick: ["Is this seat taken? My old bones could use the warmth.", "Reminds me of the nights we fished till dawn. Lovely."],
  Bram: [here => here.Hilde ? "There you are, love. Thought I'd find you here." : "Saw the glow from the farm. Thought I'd come and see who's about.", "The cows are tucked in. Time for a proper sit down."],
  Hilde: [here => here.Bram ? "So this is where you got to, Bram! I've been looking everywhere." : "Lovely fire. Bram's snoring, so I came out here for some peace.", "Don't let it go out, dears. It's ever so cosy."],
  Pip: ["A fire! Can I sit with you? Mum said I can stay for a bit.", "Look, the sparks are going all the way up to the stars!"],
};
// little chats between whoever's sat at a lit fire: at least one for every pair, so nobody talks to someone who isn't there
const FIRESIDE = [
  [['Lyra', "Fenwick, tell me a story for my next song. A true one, mind."], ['Fenwick', "They're all true, Lyra. Especially the one about the horse-sized fish."], ['Lyra', "Not that one, then."]],
  [['Lyra', "Bram, do your cows like music?"], ['Bram', "Buttercup does. Clover walks off whenever I sing."], ['Lyra', "Clover sounds like a fair critic."]],
  [['Hilde', "Lyra, that song you sang at market the other day. It's been stuck in my head all week."], ['Lyra', "Oh, I'm so sorry. Or, actually, you're welcome."]],
  [['Pip', "Lyra, can you teach me to sing?"], ['Lyra', "Of course! First rule: sing like nobody's listening."], ['Pip', "But everyone's always listening to me!"]],
  [['Fenwick', "Bram, you ever been fishing?"], ['Bram', "Once. Caught my own hat."], ['Fenwick', "That's further than most get, to be fair."]],
  [['Hilde', "Fenwick, you look half frozen. Shuffle closer to the fire."], ['Fenwick', "Bless you, Hilde. These old bones aren't what they were."]],
  [['Pip', "Fenwick, is it true you caught a fish as big as a horse?"], ['Fenwick', "Bigger, Pip. And it looked right at me."], ['Pip', "Woah. What did it say?"], ['Fenwick', "...Fish don't talk, Pip."]],
  [['Bram', "Lovely evening for it, love."], ['Hilde', "It is. Even the hens have gone quiet."], ['Bram', "That's a first."]],
  [['Hilde', "Did you shut the paddock gate before you came out?"], ['Bram', "...I'm almost certain I did."], ['Hilde', "Bram."]],
  [['Pip', "Bram, can Truffle come to the next bonfire?"], ['Bram', "Only if she promises not to eat the logs."], ['Pip', "I'll ask her!"]],
  [['Hilde', "Pip, not so close to the fire, love."], ['Pip', "I'm just looking at the sparks!"], ['Hilde', "Look at them from back here, then."]],
  [['Lyra', "Isn't it peaceful out here at night?"], ['Hilde', "It is. You can hear the river from here if you listen."]],
  [['Bram', "Fenwick, if you catch anything big tomorrow, I'll swap you a cabbage for it."], ['Fenwick', "A cabbage? For a fish as big as a horse?"], ['Bram', "Two cabbages, then."]],
  [['Pip', "Bram, why do cows go moo?"], ['Bram', "Because they can't say baa, Pip. That's the sheep's word."]],
];
function firesideChat(t){
  const seated = Object.keys(EV.npcs).filter(k => { const n = EV.npcs[k]; return n.casual && n.satT && !n.bye; });
  if (seated.length < 2) { EV.chat = null; return; }
  if (EV.chat) {   // a chat under way: each line three and a half seconds apart
    const c = EV.chat, i = Math.floor((t - c.at) / 3.5);
    if (i >= c.lines.length) { EV.chat = null; EV.nextChat = t + 30 + Math.random() * 20; return; }
    if (i > c.said && c.lines[i]) { c.said = i; const sp = EV.npcs[c.lines[i][0]] && EV.npcs[c.lines[i][0]].sp; if (sp) evSay(sp, c.lines[i][1]); }
    return;
  }
  if (t < (EV.nextChat || 0)) return;
  const fits = FIRESIDE.filter(c => c.every(([who]) => seated.includes(who)) && !(EV.chatsDone || []).includes(c));
  if (!fits.length) { EV.nextChat = t + 30; return; }
  const c = fits[Math.floor(Math.random() * fits.length)]; (EV.chatsDone = EV.chatsDone || []).push(c);
  EV.chat = { lines: c, at: t, said: 0 }; evSay(EV.npcs[c[0][0]].sp, c[0][1]);
}
function casualVisitors(t){
  if (EV.nextChat === undefined) EV.nextChat = t + 15;
  firesideChat(t);
  const now = performance.now() / 1000, burning = fuelNow() > 0.05, want = {};
  if (burning) for (let k = 0; k < 2; k++) {   // two overlapping visits: one every three minutes from a minute in, the second half a cycle later
    const tt = t - 60 - k * 90; if (tt < 0) continue;
    const slot = Math.floor(tt / 180), into = tt - slot * 180; if (into > 150) continue;
    const g = GUESTS[(slot * 2 + k + Math.floor(EV.data.start / 1000)) % GUESTS.length];
    if (!want[g.name]) want[g.name] = { g, at: t - into, into };
  }
  for (const name in EV.npcs) if (!want[name]) { const n = EV.npcs[name]; if (n.casual && !n.bye) { n.bye = 1; evSay(n.sp, "Right, that's me off to bed. Night, all!"); } goHome(n, t); }
  for (const name in want) {
    const { g, into } = want[name], seat = BF.seats[g.seat];
    if (!EV.npcs[name] && into > 140) continue;   // too late in their visit to bother coming now
    const n = borrowNpc(name); if (!n) continue; n.casual = 1;
    if (!n.path || n.path.tag !== 'seat') { npcRoute(n, [seat.ax, seat.az], t, g.run ? 7 : 4.5); n.path.tag = 'seat'; n.bye = 0; n.said2 = 0; n.satT = 0;
      const here = {}; for (const k in EV.npcs) if (k !== name && EV.npcs[k].path && EV.npcs[k].path.tag === 'seat') here[k] = 1;   // who's already there, or on the way
      const hi = VISIT[name][0]; evSay(n.sp, typeof hi === 'function' ? hi(here) : hi); }
    if (!followRoute(n, t)) continue;
    if (!n.satT) { n.satT = now; evSound('sit', seat.x, seat.z); }
    sitPoseAt(n.sp, seat, now, name.length, g.child); n.sp.position.y = 0.3 * smooth(clamp01((now - n.satT) / 0.45));
    if (into > 70 && !n.said2) { n.said2 = 1; evSay(n.sp, VISIT[name][1]); }
  }
}
function kneelFrame(n, t){
  const [kx, kz] = KNEEL(); n.sp.position.set(kx, 0, kz); n.sp.rotation.y = yawTo(kx, kz, BF.x, BF.z); poseChibi(n.sp, 'idle', t);
  const c = n.sp.userData.chibi, [L, R] = c.legs, [AL, AR] = c.arms;
  const down = t < 9.4 ? smooth(segK(t, 6, 6.6)) : 1 - smooth(segK(t, 9.4, 10));
  c.body.position.y = -0.38 * down; L.rotation.x = -1.5 * down; R.rotation.x = 0.9 * down; c.body.rotation.x = 0.3 * down;
  const ph = (t - 6.8) % 0.6, striking = t > 6.6 && t < 8.3, hit = striking ? Math.exp(-Math.max(0, ph) * 18) : 0;
  AL.rotation.set(-1.1 * down, 0, -0.1); AR.rotation.set((-1.4 + 0.5 * (striking ? Math.sin(ph / 0.6 * Math.PI * 2) * 0.5 + hit : 0)) * down, 0, 0.15);
  for (const s of [6.8, 7.4, 8.0]) if (t >= s && !EV.said['flint' + s]) { EV.said['flint' + s] = 1; evSound('flint'); }
  if (t >= 8 && !EV.said.catch) { EV.said.catch = 1; evSound('catch'); }
  if (t >= 11 && !EV.said.lit) { EV.said.lit = 1; evSay(n.sp, "There we are. Fire's lit, come and warm yourselves!"); }
}
function guardFrame(n, gd){
  const ox = n.sp.position.x, oz = n.sp.position.z, nx = ox + (gd.x - ox) * 0.2, nz = oz + (gd.z - oz) * 0.2;
  n.sp.position.set(nx, 0, nz); n.path = null;
  const g = EV.gobs[gd.tg], moving = Math.hypot(gd.x - ox, gd.z - oz) > 0.05;
  if (moving) { n.sp.rotation.y = Math.atan2(gd.x - ox, gd.z - oz); poseChibi(n.sp, 'walk', performance.now() / 500); }
  else if (g && g.g.visible) { n.sp.rotation.y = yawTo(nx, nz, g.x, g.z);
    const k = gd.hit ? (Date.now() - gd.hit) / 900 : 2; if (k < 1) { fightPose(n.sp.userData.chibi, 'swing', k); if (!n.lastHit || n.lastHit !== gd.hit) { n.lastHit = gd.hit; setTimeout(() => { combatSound(gd.dmg ? 'hit' : 'miss'); if (gd.dmg) hitsplat(g.g, gd.dmg, 'hit'); }, 430); } } else fightPose(n.sp.userData.chibi, 'ready', 0); }
}
function panicFrame(n, gst, now){
  n.path = null; n.satT = 0;
  const slot = Math.floor(now / 1.4 + gst.leave), h = Math.sin(slot * 12.9898 + gst.name.length * 78.233) * 43758.5453, r = h - Math.floor(h), h2 = Math.sin(slot * 39.3 + gst.name.length) * 9631.7, r2 = h2 - Math.floor(h2);
  const tx = BF.x + Math.cos(r * 6.283) * (5 + r2 * 9), tz = BF.z + Math.sin(r * 6.283) * (5 + r2 * 9);
  const x = n.sp.position.x, z = n.sp.position.z, dx = tx - x, dz = tz - z, dd = Math.hypot(dx, dz);
  n.sp.position.y = 0;
  if (dd > 0.2) { const step = Math.min(dd, 0.12); n.sp.position.x += dx / dd * step; n.sp.position.z += dz / dd * step; n.sp.rotation.y = Math.atan2(dx, dz); poseChibi(n.sp, 'walk', now * 1.7); }
  else poseChibi(n.sp, 'idle', now);
  const c = n.sp.userData.chibi; c.arms.forEach(a => { a.rotation.x = -2.6 + Math.sin(now * 14 + gst.leave) * 0.4; });   // arms in the air
  if (!n.nextShout || now > n.nextShout) { n.nextShout = now + 5 + (gst.leave % 3) * 2 + Math.random() * 4; const lines = PANIC[gst.name]; evSay(n.sp, lines[Math.floor(Math.random() * lines.length)], 2200); }
}
function goHome(n, t){
  if (!n.path || n.path.tag !== 'home') { n.sp.position.y = 0; npcRoute(n, n.home, t, 4.5); n.path.tag = 'home'; }
  if (followRoute(n, t)) releaseNpc(n);
}
function endNight(){
