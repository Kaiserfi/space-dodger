// ----- village music: a soft loop made from synthesised notes (no sound files) -----
const MUSIC = { master: null, timer: 0, nextTime: 0, step: 0, mel: 4 };
// the volume settings, saved in this browser
const SETTINGS = { music: 50, sfx: 80, musicMute: false, sfxMute: false };
try { Object.assign(SETTINGS, JSON.parse(localStorage.getItem('itapSettings')) || {}); } catch (e) {}
delete SETTINGS.grass;   /* the old grass setting (off, low, high) is gone: the grass is painted on now */
if (typeof SETTINGS.bright !== 'number') SETTINGS.bright = 50;
if (typeof SETTINGS.saver !== 'boolean') SETTINGS.saver = matchMedia('(pointer: coarse)').matches;   /* battery saver: on by default on phones and tablets */   // brightness: 50 is as designed; higher lifts the night for dim screens
document.getElementById('volBright').addEventListener('input', e => { SETTINGS.bright = +e.target.value; applySettings(); });
const musicLevel = () => SETTINGS.musicMute ? 0 : SETTINGS.music / 100;
const MUSIC_BEAT = 60 / 76 / 2;                         // an eighth note at 76 beats a minute
const MUSIC_BASS = [146.83, 123.47, 196.0, 220.0];      // the chords: D, B minor, G, A
const MUSIC_NOTES = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880];   // D major pentatonic
function musicPad(root, t, dur){
  const ctx = audio(); if (!ctx || !MUSIC.master) return;
  [root, root * 1.5].forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f * (i ? 1.002 : 0.998);
    lp.type = 'lowpass'; lp.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(MUSIC.master); o.start(t); o.stop(t + dur + 0.05);
  });
}
function musicNote(f, t){
  const ctx = audio(); if (!ctx || !MUSIC.master) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(g); g.connect(MUSIC.master); o.start(t); o.stop(t + 0.75);
}
// schedule a little ahead of the audio clock: a chord each bar, and a melody that wanders up and down the scale
function musicTick(){
  const ctx = audio(); if (!ctx || !MUSIC.master) return;
  while (MUSIC.nextTime < ctx.currentTime + 0.4) {
    const t = MUSIC.nextTime, bar = Math.floor(MUSIC.step / 8) % 4, pos = MUSIC.step % 8;
    if (pos === 0) musicPad(MUSIC_BASS[bar], t, MUSIC_BEAT * 8);
    if (pos % 2 === 0 && Math.random() < 0.7) {
      MUSIC.mel = Math.min(MUSIC_NOTES.length - 1, Math.max(0, MUSIC.mel + [-1, -1, 0, 1, 1, 2, -2][Math.floor(Math.random() * 7)]));
      musicNote(MUSIC_NOTES[MUSIC.mel], t);
    }
    MUSIC.nextTime += MUSIC_BEAT; MUSIC.step++;
  }
}
function startMusic(){
  if (MUSIC.master) return;
  const ctx = audio(); if (!ctx) return;
  MUSIC.master = ctx.createGain(); MUSIC.master.gain.value = musicLevel(); MUSIC.master.connect(ctx.destination);
  MUSIC.nextTime = ctx.currentTime + 0.1;
  MUSIC.timer = setInterval(musicTick, 150);
}
// fight music, from Idle Tap Adventure: the battle theme in a fight, the boss theme in the goblin raid (and, later, the delves).
// The calm village music fades out underneath while a theme plays, and back in a few seconds after the fighting stops.
const FIGHT_MUSIC = { el: {}, want: null, lastFight: -1e9, quietSince: 0 };
function fightTrack(name){
  let a = FIGHT_MUSIC.el[name];
  if (!a) { a = FIGHT_MUSIC.el[name] = new Audio(`music/${name}.mp3`); a.loop = true; a.preload = 'auto'; a.volume = 0; }
  return a;
}
function updateFightMusic(){
  const now = performance.now();
  if (FIGHT) FIGHT_MUSIC.lastFight = now;
  const st = typeof EV !== 'undefined' && EV.data && EV.data.raid && EV.data.raid.st;
  const raid = typeof evActive === 'function' && evActive() && (st === 'rush' || st === 'lost' || evPhase() === 'creep') && hero && Math.hypot(hero.position.x - BF.x, hero.position.z - BF.z) < 40;
  const delve = typeof DELVE !== 'undefined' && DELVE && !DELVE.done;   /* the whole delve, until the last wave falls */
  const below = typeof DELVE !== 'undefined' && (DELVE || (hero && inDelveZone(hero.position.x, hero.position.z)) || (CAVE && CAVE.room === 'boss'));   /* the cellar and the troll's den: never the ordinary battle theme, not even after the boss falls */   /* down in the cellar: never the ordinary battle theme */
  const troll = CAVE && CAVE.troll && CAVE.room === 'boss' && !CAVE.won;   /* the cave troll gets the boss theme; the rest of the cave the usual one */
  const want = raid || delve || troll ? 'boss_battle_theme' : below ? null : (FIGHT || now - FIGHT_MUSIC.lastFight < 5000) ? 'battle_theme' : null;
  const level = musicLevel(); FIGHT_MUSIC.want = want;
  for (const name of ['battle_theme', 'boss_battle_theme']) {
    const on = want === name, a = on ? fightTrack(name) : FIGHT_MUSIC.el[name]; if (!a) continue;
    const target = on ? level * (name === 'battle_theme' ? 0.3 : 0.8) : 0;   /* the battle theme sits well under everything; the boss theme is left loud for now */
    a.volume = Math.max(0, Math.min(1, a.volume + Math.sign(target - a.volume) * Math.min(Math.abs(target - a.volume), 0.02)));   // a gentle fade either way
    if (on && a.paused) { if (now - (a.stoppedAt || 0) > 30000) a.currentTime = 0; a.play().catch(() => {}); }   // back after a long break: start from the top
    if (!on && !a.paused && a.volume <= 0.001) { a.pause(); a.stoppedAt = now; }
  }
  if (MUSIC.master) { const g = MUSIC.master.gain, t = want || CAVE ? 0 : level;   /* the village tune isn't heard down in the cave, which has its own ambience */ g.value = g.value + (t - g.value) * 0.05; }   // the village music ducks out of the way
}
const SPEAKER = muted => `<svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z" fill="#c9b27a"/>${muted
  ? '<path d="M11 5.5l4 5M15 5.5l-4 5" stroke="#d64b3c" stroke-width="1.6"/>'
  : '<path d="M11 5.5q2 2.5 0 5M12.8 3.8q3.5 4.2 0 8.4" fill="none" stroke="#c9b27a" stroke-width="1.3"/>'}</svg>`;
function applySettings(){
  if (MUSIC.master && !FIGHT_MUSIC.want) MUSIC.master.gain.value = musicLevel();
  if (audioCtx) sfxOut(audioCtx);
  for (const [k, id] of [['music', 'Music'], ['sfx', 'Sfx']]) {
    const m = SETTINGS[k + 'Mute'], b = document.getElementById('mute' + id);
    b.innerHTML = SPEAKER(m); b.classList.toggle('muted', m); b.title = m ? 'Unmute' : 'Mute';
    document.getElementById('vol' + id).value = SETTINGS[k];
  }
  document.querySelectorAll('#saverOpts button').forEach(b => b.classList.toggle('on', (b.dataset.s === 'on') === SETTINGS.saver));
  if (window.__powerReady) applyPower();   /* not before the renderer's effects are set up */
  document.getElementById('volBright').value = SETTINGS.bright;
  try { localStorage.setItem('itapSettings', JSON.stringify(SETTINGS)); } catch (e) {}
}
document.getElementById('saverOpts').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; SETTINGS.saver = b.dataset.s === 'on'; applySettings(); });
for (const [k, id] of [['music', 'Music'], ['sfx', 'Sfx']]) {
  document.getElementById('vol' + id).addEventListener('input', e => { SETTINGS[k] = +e.target.value; SETTINGS[k + 'Mute'] = false; applySettings(); });
  document.getElementById('mute' + id).addEventListener('click', () => { SETTINGS[k + 'Mute'] = !SETTINGS[k + 'Mute']; applySettings(); });
}
document.getElementById('tabSettings').addEventListener('click', () => togglePanel('setPanel', 'tabSettings'));
applySettings();
addEventListener('pointerdown', startMusic, { once: true });   // browsers only allow sound after a click

// ----- talking: a line at a time, in the panel at the bottom -----
let dlg = null;
// ----- quests -----
// A Hearty Welcome: Brenna's oven is cold. A walk round the village that hands out each tool as it is needed.
const QUEST = { hw: 0, qp: 0, rt: 0, gw: 0 };   /* gw: Gone for Willow, Tobin's quest (346) */
const HW_STEPS = 9;   // 9 means done
/* Roots and Threads, Tilly's farming quest: 0 not started, 1 plant wheat, 2 talk to Tilly, 3 grow and harvest, 4 show Tilly, 5 feed the silkworms,
   6 collect the cocoons, 7 spin silk, 8 show Tilly the thread, 9 done */
const RT_DONE = 9;
const cnt = n => countOf(n);
function giveTool(name, icon){ if (hasItem(name)) return false; addItem(name, 1, icon); return true; }
/* how many free bag slots handing over these things would take (stacks you already have need no new slot; tools you already own aren't given) */
function slotsFor(list){ let n = 0; for (const name of list) { if (beltSlotFor(name) && hasTool(name)) continue; if (SINGLE.has(name) || !hasItem(name)) n++; } return n; }
const bagRoomFor = list => bag.length + slotsFor(list) <= BAG_SIZE;
const FULL_HANDS = () => [{ me: "Sorry, I've got my hands full." }, "Your pack's stuffed to bursting! Clear a bit of space and come back, and I'll sort you out."];
function rtTalk(){
  const s = QUEST.rt || 0, me = t => ({ me: t }), run = f => ({ run: f });
  // anything that should have been handed over but went missing (a full bag, sold off): Tilly hands it over again
  const missing = s === 1 ? ['Hoe', 'Wheat seeds'].filter(n => n === 'Hoe' ? !hasTool(n) : !hasItem(n))
    : s === 3 ? (hasTool('Watering can') ? [] : ['Watering can'])
    : s === 5 ? (hasItem('Mulberry leaves') ? [] : ['Mulberry leaves']) : [];
  if (missing.length) {
    if (!bagRoomFor(missing)) return FULL_HANDS();
    return [me("I seem to have lost what you gave me."), "Lost it? Already? Honestly, you're as bad as Pip. Here, have another go.",
      run(() => { for (const n of missing) { if (n === 'Hoe' || n === 'Watering can') { addItem(n, 1, ICON_FOR[n]); if (n === 'Watering can') { FARM_CAN.n = CAN_MAX; renderBag(); } } else addItem(n, n === 'Mulberry leaves' ? 6 : 5, ICON_FOR[n]); }
        showToast(`Tilly gives you ${missing.map(n => n.toLowerCase()).join(' and ')}.`); saveNow(false); })];
  }
  // before handing anything over, make sure it'll fit
  const gives = s === 0 ? ['Hoe', 'Wheat seeds'] : s === 2 ? ['Watering can'] : s === 4 ? ['Mulberry leaves'] : s === 8 ? ['Wheat seeds', 'Aloe seeds', 'Mulberry seeds'] : [];
  if (gives.length && !bagRoomFor(gives)) return FULL_HANDS();
  if (s === 0) return [me('Hello! Are you the one who runs this market?'), "That's me! Tilly, Hilde's little sister. You look like someone who's never grown so much as a cress.",
    { opts: [["Could you teach me to farm?", ["Oh, would I! Right. First things first: you'll want a hoe and some seed.",
        run(() => { const got = []; if (giveFarmTool('Hoe', HOE_ICON)) got.push('a hoe'); addItem('Wheat seeds', 5, ICON_FOR['Wheat seeds']); got.push('5 wheat seeds');
          showToast(`Tilly gives you ${got.join(' and ')}.`); }),
        "Take a patch in the fields by the windmill. Turn the soil over with the hoe, then plant your seed.", me("Till it, then plant it. Got it."), "Off you go! Come back once it's in the ground.",
        run(() => { QUEST.rt = 1; questStep('Till a patch in the fields and plant some wheat seeds.'); })]],
      ["Not right now.", ["Suit yourself! The fields aren't going anywhere."]]] }];
  if (s === 2) return [me("I've planted the wheat!"), "Look at you, soil under your nails already! Now, seed won't grow on wishes.",
    run(() => { if (giveFarmTool('Watering can', CAN_ICON)) { FARM_CAN.n = CAN_MAX; renderBag(); renderBelt && renderBelt(); showToast('Tilly gives you a watering can, already full.'); } }),
    "Water it, and every time it grows a little, water it again. When it's golden, harvest it.", "If the can runs dry, there's a trough by the field gate.",
    run(() => { QUEST.rt = 3; questStep('Water your wheat each time it grows, then harvest it.'); })];
  if (s === 4) return [me('My first harvest!'), "Would you look at that! Bram'll be jealous.", "Now for the clever bit. Wheat feeds us, but silk pays. Here, mulberry leaves from my own bushes.",
    run(() => { addItem('Mulberry leaves', 6, ICON_FOR['Mulberry leaves']); showToast('Tilly gives you 6 mulberry leaves.'); }),
    "The silkworms in the workshop, just west of here, eat nothing else. Feed them those and they'll spin you cocoons.",
    run(() => { QUEST.rt = 5; questStep('Feed the mulberry leaves to the silkworms in the workshop.'); })];
  if (s === 8) return [me("I spun my first silk thread!"), "Ooh, let me see. That's lovely and even! You've a knack for this.",
    "You've grown it, fed it and spun it. That's farming, start to finish.", "Here, seed for whatever you fancy growing next. Aloe and silk make a fine bandage, by the way.",
    run(() => completeRootsAndThreads())];
  return null;   /* nothing to hand over at this step: her usual chat, and her stall */
}
/* only if you don't have one already, in your bag or on your toolbelt */
function giveFarmTool(name, icon){ if (hasTool(name)) return false; addItem(name, 1, icon); return true; }
function rtAdvance(from, to, text){ if ((QUEST.rt || 0) === from) { QUEST.rt = to; questStep(text); } }
function completeRootsAndThreads(){
  if ((QUEST.rt || 0) >= RT_DONE) return;
  QUEST.rt = RT_DONE; QUEST.qp = (QUEST.qp || 0) + 1;
  closeDialogBox();
  for (const n of ['Wheat seeds', 'Aloe seeds', 'Mulberry seeds']) addItem(n, 5, ICON_FOR[n]);
  quietLevelUps = true; addXp('Farming', 250); addXp('Crafting', 100); quietLevelUps = false;
  questJingle();
  const row = (icon, text) => `<div class="qr"><span class="qi">${icon}</span>${text}</div>`;
  showRewardScroll({ banner: 'Quest complete', title: 'Roots and Threads', sub: 'From seed to silk, with a little help from Tilly.',
    rewards: row(ICON_FOR['Wheat seeds'], '5 wheat seeds') + row(ICON_FOR['Aloe seeds'], '5 aloe seeds') + row(ICON_FOR['Mulberry seeds'], '5 mulberry seeds') + row('<span style="color:#a07a2c">&#9733;</span>', '1 quest point'),
    xp: '<div class="qr">Farming<b>+250</b></div><div class="qr">Crafting<b>+100</b></div>',
    quote: '&ldquo;Come and sell me some of that silk when you have it. I pay fair. Mostly.&rdquo; &mdash; Tilly' });
  renderStats(); saveNow(false);
}
function questTalk(name){
  if (name === 'Hollis') return CAVE ? hollisTalk() : gwTalk('Hollis');   /* the prisoner in the cave, or home at Tobin's yard */
  if (name === 'Tobin') { const g = gwTalk('Tobin'); if (g) return g; }
  if (name === 'Tilly') { const r = rtTalk(); if (r) return r; }
  const s = QUEST.hw, me = t => ({ me: t }), run = f => ({ run: f });
  if (s >= HW_STEPS) return null;
  if (name === 'Aldric' && s === 0) return [me("Hi! I'm new here."), 'Halt. State your business.', me("...I just did. I'm new here."),
    'A newcomer. No tools, no plan, no idea. Wonderful.', "Go and see Brenna the baker — far west cottage. Her oven's gone cold and she won't stop going on about it.",
    { opts: [["Sure, I'll go and help her.", ["Good. Maybe this village'll make something of you yet."]],
             ["Why can't she fix it herself?", ["She's a baker, not a woodcutter. Or a fisherman. Or a smith. You'll see."]]] },
    run(() => { QUEST.hw = 1; questStep('Talk to Brenna the baker, in the far west cottage.'); })];
  if (name === 'Brenna') {
    if (s <= 1) return ['Oh! A new face! Come in, come in — mind the flour.', me("Aldric sent me. Said your oven's gone cold?"),
      "Stone cold. And the whole village is waiting on their bread!",
      { opts: [
        ["I'll help. What do you need?", ["Oh, bless you! I need five good logs to get it going again.", "You'll want an axe for that. Mara's got a spare. Her store's the cottage out south-west, past the last houses. Tell her I sent you.",
          me("Five logs. I can do that."), 'Lovely. And mind the flour on your way out!', run(() => { QUEST.hw = 2; questStep("Get an axe from Mara at her general store, south-west of the village."); })]],
        ['What happened to your oven?', ["The fire went out in the night, and I've no wood left to light it.", "Tobin usually brings me kindling. But Tobin's usually asleep."], true],
        ['Tell me about the village.', ["Small. Friendly. Nosy. Wenna on the green knows everyone's business.", "Mara sells tools, Dunmore keeps the forge going, and the farm out east keeps us all fed."], true],
        ["Sorry, I'm busy right now.", ["Oh. Well, pop back when you've a minute. The oven's not going anywhere."]] ] }];
    if (s <= 3) {
      if (cnt('Logs') >= 5) return [me("Got your five logs!"), 'Five logs! Look at you, all sawdust and pride.',
        run(() => { for (let i = 0; i < 5; i++) removeItem('Logs'); }), "There — the fire's going!", "Now I need a filling for my pies. Three cooked shrimp.",
        me("Where do I get shrimp?"), "Fenwick, down on the riverbank. He's got a spare net. Catch 'em, cook 'em on a fireplace, and bring 'em here.",
        me("Any fireplace?"), "Any one in the village. Mine included.", run(() => { QUEST.hw = 4; questStep('Get a fishing net from Fenwick, by the river.'); })];
      return [me("How's the oven?"), () => "Still cold, dear. A few more logs and we'll be away.", s === 2 ? "Mara's got an axe for you. Her store's out south-west, past the last houses." : 'The young trees round the village chop nice and easy.'];
    }
    if (s <= 5) {
      if (cnt('Shrimp') >= 3) return [me("Three cooked shrimp, as promised."), "Ooh, they smell wonderful! And you didn't burn them all. I'm impressed.",
        run(() => { for (let i = 0; i < 3; i++) removeItem('Shrimp'); }), me("Is that everything?"), "Nearly. The oven door's come off its hinge. Dunmore can fix it, but he'll need a bronze bar.",
        me("And where do I get one of those?"), "Gertrude, up at the quarry. She'll lend you a pickaxe. Copper and tin, melted down together — you'll see.",
        run(() => { QUEST.hw = 6; questStep('Get a pickaxe from Gertrude at the quarry.'); })];
      return [me("Still working on the shrimp."), () => "Not quite enough yet, dear. Three cooked ones, and don't eat any on the way.", s === 4 ? "Fenwick on the riverbank has a spare net." : "Cook 'em on a fireplace — there's one in every cottage."];
    }
    if (s <= 7) return [me("About that hinge..."), "Dunmore needs a bronze bar to fix it, dear.", s === 6 ? "Gertrude at the quarry will lend you a pickaxe." : "Dig out a bit of copper and tin, melt them down at the smithy furnace, and Dunmore will do the rest."];
    if (s === 8) return [me("Dunmore's fixed your oven door!"), "He has! The door shuts, the fire's roaring, and the whole village smells of bread again.",
      "You chopped, you fished, you cooked, you mined and you smelted. Not bad for a newcomer!", me("I had a lot of help."),
      "Here — this is for you. A villager's cloak, with our oak and river on the back. You're one of us now.", run(completeHeartyWelcome)];
  }
  if (name === 'Mara' && s === 2) return [me("Brenna sent me. Said you might have an axe?"),
    () => hasAxe() ? "You've already got one! Then you're ahead of most." : "Brenna sent you? Then this one's on the house. Don't tell anyone — I've a reputation.",
    run(() => { if (!hasAxe()) giveTool(AXE_NAME, AXE_ICON); }), me("Thanks, Mara!"), "Five logs, was it? The young trees round the green chop easy. Off you go.",
    run(() => { QUEST.hw = 3; questStep('Chop 5 logs and bring them to Brenna.'); })];
  if (name === 'Fenwick' && s === 4) return [me("Brenna needs shrimp. She said you might have a net?"),
    () => hasTool('Small fishing net') ? "Got a net already? Good. Mine's got a hole in it anyway." : "Brenna wants shrimp, does she? Here — take my old net.",
    run(() => { giveTool('Small fishing net', NET_ICON); }), "Caught a fish as long as a horse with that net, once.", me("Really?"), "Ysolde says it was a boot. It wasn't a boot.",
    "Shrimp come up by the bank. Dip the net, wait, lift. Then cook 'em — unless you like 'em wriggling.",
    run(() => { QUEST.hw = 5; questStep('Catch 3 shrimp, cook them on a fireplace, and bring them to Brenna.'); })];
  if (name === 'Gertrude' && s === 6) return [me("I need a bronze bar for Brenna's oven door."),
    () => hasPick() ? "Got your own pickaxe? Good. Saves me a lecture." : "For Brenna's oven? Fine. Take this pickaxe. Bring it back sharp, or don't bring it back.",
    run(() => { if (!hasPick()) giveTool(PICK_NAME, PICK_ICON); }), me("How do I make a bar?"), "Copper over there, tin over here. Melt 'em down together at the smithy furnace and you've got your bar.",
    run(() => { QUEST.hw = 7; questStep('Mine copper and tin, smelt a bronze bar, and give it to Dunmore.'); })];
  if (name === 'Dunmore' && s === 7) {
    if (cnt('Bronze bar') >= 1) return [me("Got a bronze bar for Brenna's oven hinge."), "Bronze bar, eh? Leave it with me.",
      run(() => { removeItem('Bronze bar'); }), '*clang* *clang* ...There. Good as new. Better, if I\'m honest.', me("That was quick!"),
      "Keep this hammer. Every smith needs one, and you've got the look of one.", run(() => { giveTool('Hammer', HAMMER_ICON); QUEST.hw = 8; questStep('Go back to Brenna.'); })];
    return [me("Brenna's oven door needs fixing."), "No bar, no hinge. Copper and tin — smelt 'em at the furnace back there."];
  }
  return null;
}
function questStep(text){ showToast('Quest updated: ' + text); renderStats(); saveNow && saveNow(false); }
// what to do next, for the tracker and the quest tab
function questObjective(){
  const s = QUEST.hw;
  return ['Talk to Aldric the guard at the hall door.', 'Talk to Brenna the baker, in the far west cottage.', "Get an axe from Mara at her general store, south-west of the village.",
    `Chop logs for Brenna (${Math.min(5, cnt('Logs'))}/5).`, 'Get a fishing net from Fenwick, by the river.',
    `Catch and cook shrimp for Brenna (${Math.min(3, cnt('Shrimp'))}/3 cooked).`, 'Get a pickaxe from Gertrude at the quarry.',
    cnt('Bronze bar') ? 'Give the bronze bar to Dunmore at the smithy.' : 'Mine copper and tin, then smelt a bronze bar.', 'Go back to Brenna.', 'Complete!'][Math.min(s, 9)];
}
function questTarget(){
  const s = QUEST.hw;
  return [s === 0 && 'Aldric', s === 1 && 'Brenna', s === 2 && 'Mara', s === 3 && cnt('Logs') >= 5 && 'Brenna', s === 4 && 'Fenwick',
    s === 5 && cnt('Shrimp') >= 3 && 'Brenna', s === 6 && 'Gertrude', s === 7 && cnt('Bronze bar') && 'Dunmore', s === 8 && 'Brenna'].find(Boolean) || null;
}
let questShown = '', qMark = null;
const qV = new THREE.Vector3();
function rtObjective(){ return ['Talk to Tilly at the farmers\' market, east of the windmill.', 'Till a patch in the fields and plant some wheat seeds.', 'Talk to Tilly at the farmers\' market.',
  'Water your wheat each time it grows, then harvest it.', 'Show Tilly your harvest.', 'Feed the mulberry leaves to the silkworms in the workshop.',
  'Collect the cocoons from the hutch when the silkworms are done.', 'Spin a cocoon into silk thread at the spinning wheel.', 'Show Tilly your silk thread.', 'Complete!'][Math.min(QUEST.rt || 0, RT_DONE)]; }
function updateQuest(){
  const rtOn = (QUEST.rt || 0) > 0 && QUEST.rt < RT_DONE;   /* Tilly's quest, once started, takes the tracker */
  const gwOn = !rtOn && (QUEST.gw || 0) > 0 && QUEST.gw < GW_DONE;   /* then Tobin's */
  const title = rtOn ? 'Roots and Threads' : gwOn ? 'Gone for Willow' : 'A Hearty Welcome';
  const text = rtOn ? rtObjective() : gwOn ? gwObjective() : QUEST.hw >= HW_STEPS ? '' : questObjective();
  gwVillageFrame(performance.now());   /* Hollis at Tobin's yard, once he's home */
  if (text + title !== questShown) { questShown = text + title; const el = document.getElementById('questTrack'); el.hidden = !text; el.innerHTML = text ? `<b>${title}</b><br>${text}` : ''; if (statsSub === 'quests') renderStats(); }
  if (!qMark) { qMark = document.createElement('div'); qMark.id = 'qMark'; qMark.textContent = '!'; document.body.appendChild(qMark); }
  const rs = QUEST.rt || 0, who = (rs === 2 || rs === 4 || rs === 8 || (rs === 0 && QUEST.hw >= HW_STEPS)) ? 'Tilly' : questTarget(), b0 = who && BARKERS.find(x => x.rec.name === who);
  const gsp = gwMarkTarget(), b = b0 || (gsp ? { sp: gsp } : null);   /* Tobin's quest only marks someone once it has something for you */
  if (!b || dlg) { qMark.style.display = 'none'; return; }
  b.sp.getWorldPosition(qV); qV.y += 5.2 * (b.sp.scale.x / CHIBI_SCALE) + Math.sin(performance.now() / 250) * 0.15;
  qV.project(camera);
  qMark.style.display = qV.z < 1 ? 'block' : 'none';
  qMark.style.left = (qV.x + 1) / 2 * innerWidth + 'px'; qMark.style.top = (-qV.y + 1) / 2 * innerHeight + 'px';
}
function completeHeartyWelcome(){
  if (QUEST.hw >= HW_STEPS) return;
  QUEST.hw = HW_STEPS; QUEST.qp = (QUEST.qp || 0) + 1;
  closeDialogBox();
  addItem('Coins', 50, COIN_ICON); addItem("Brenna's bread", 3, BREAD_ICON); addItem("Villager's cloak", 1, CLOAK_ICON);
  quietLevelUps = true;
  for (const [k, v] of [['Woodcutting', 60], ['Fishing', 60], ['Cooking', 60], ['Mining', 60], ['Smithing', 80]]) addXp(k, v);
  quietLevelUps = false;
  questJingle(); restoreQuestScroll();
  document.getElementById('questDone').hidden = false;
  renderStats(); saveNow(false);
}
let quietLevelUps = false;
// the quest-complete fanfare: a rising pickup, "ta-ta-ta TAAA, da-da", then a held chord with bell sparkles
function questJingle(){
  const ctx = audio(); if (!ctx) return; const t0 = ctx.currentTime + 0.05;
  const out = ctx.createGain(); out.gain.value = 0.5; out.connect(sfxOut(ctx));
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const brass = (m, at, dur, vol = 0.16, bright = 2600) => {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright;
    const g = ctx.createGain(), s = t0 + at;
    g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(vol, s + 0.025); g.gain.setValueAtTime(vol * 0.85, s + Math.max(0.03, dur - 0.12)); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    lp.connect(g); g.connect(out);
    for (const [type, mul, v] of [['sawtooth', 1, 0.6], ['square', 1.002, 0.25], ['sine', 0.5, 0.35]]) {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = hz(m) * mul; og.gain.value = v;
      if (dur > 0.5) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = hz(m) * 0.006; l.connect(lg); lg.connect(o.frequency); l.start(s + 0.25); l.stop(s + dur); }
      o.connect(og); og.connect(lp); o.start(s); o.stop(s + dur + 0.05);
    }
  };
  const bell = (m, at, vol = 0.1) => { const s = t0 + at; for (const [mul, v] of [[1, 1], [2.76, 0.4]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz(m) * mul; g.gain.setValueAtTime(vol * v, s); g.gain.exponentialRampToValueAtTime(0.0001, s + 1.2); o.connect(g); g.connect(out); o.start(s); o.stop(s + 1.25); } };
  const drum = (at, vol, f) => { const s = t0 + at, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f, s); o.frequency.exponentialRampToValueAtTime(f * 0.85, s + 0.2); g.gain.setValueAtTime(vol, s); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.7); o.connect(g); g.connect(out); o.start(s); o.stop(s + 0.75); };
  [[67, 0], [72, 0.15], [76, 0.3]].forEach(([m, a]) => brass(m, a, 0.13));
  drum(0, 0.3, 98); drum(0.45, 0.5, 98);
  brass(79, 0.45, 0.42); brass(76, 0.9, 0.16); brass(79, 1.08, 0.16);
  drum(1.25, 0.55, 82);
  for (const m of [72, 76, 79, 84]) brass(m, 1.25, 2.6, 0.12, 2200);
  brass(48, 1.25, 2.6, 0.16, 900);
  [84, 88, 91, 96].forEach((m, k) => bell(m, 1.3 + k * 0.09)); bell(96, 2.0, 0.07); bell(91, 2.25, 0.05);
}
// villagers remember how often you have talked to them: the first chats run in order, then they pick something to say.
// A line can be a function, so it can mention your skills.
const MET = (() => { try { return JSON.parse(localStorage.getItem('itapMet')) || {}; } catch (e) { return {}; } })();
