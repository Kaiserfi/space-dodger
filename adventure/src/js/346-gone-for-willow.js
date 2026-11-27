// ----- Gone for Willow: Tobin's quest, which ties the cave into the village -----
// Once A Hearty Welcome and Roots and Threads are done, Tobin the woodcutter takes notice and asks for wood. After the wood he admits his
// younger brother Hollis went north "for willow" a week ago and never came back, and asks you to look for him. The cave stays shut until then.
// In the cave Hollis owns up: it was glowcaps, not willow. The cave goblin (the boss) carries the key to his cell; once it falls the key lies in
// its den, you let him out, and he goes home. Back at Tobin's woodyard the two of them finish the quest.
// QUEST.gw: 0 not started, 1 bring the logs, 2 find Hollis, 3 found him (beat the cave goblin for the key), 4 got the key, 5 freed (go back), 6 done
const GW_DONE = 6, GW_LOGS = 20;
const GW_YARD = { x: -87, z: 5 };   /* where Hollis waits at Tobin's woodyard, behind Tobin's chopping spot (checked clear, with room round it) */
const gwReady = () => QUEST.hw >= HW_STEPS && (QUEST.rt || 0) >= RT_DONE;   /* the first two quests done: Tobin has heard of you */
const gwCaveOpen = () => (QUEST.gw || 0) >= 2;
function gwObjective(){ const s = QUEST.gw || 0;
  return ['Talk to Tobin, the woodcutter in the western woods.', `Bring Tobin ${GW_LOGS} logs (${Math.min(GW_LOGS, cnt('Logs'))}/${GW_LOGS}).`,
    'Look for Hollis in the cave in the east hills, past the north lake.', "Get Hollis out. The cave goblin in the den must have the key to his cell.",
    "Unlock Hollis's cell.", "Go back to Tobin's woodyard in the western woods.", 'Complete!'][Math.min(s, GW_DONE)]; }
function gwStep(to, text){ QUEST.gw = to; questStep(text); }
// who the "!" floats over: Tobin when he has something for you, Hollis in his cell when he does, Hollis at the yard at the end
function gwMarkTarget(){
  const s = QUEST.gw || 0;
  if (CAVE) return (s === 2 || s === 4) && CV.hollis && CV.hollis.visible ? CV.hollis : null;
  if ((s === 0 && gwReady()) || (s === 1 && cnt('Logs') >= GW_LOGS)) { const b = BARKERS.find(x => x.rec.name === 'Tobin'); return b && !b.rec.asleep ? b.sp : null; }
  if (s === 5) return HOLLIS_HOME && HOLLIS_HOME.sp.visible ? HOLLIS_HOME.sp : null;
  return null;
}
function gwTalk(name){
  const s = QUEST.gw || 0, me = t => ({ me: t }), run = f => ({ run: f });
  if (name === 'Tobin') {
    if (s === 0 && gwReady()) return [me('Hello, Tobin.'), "Hm? Oh. You're the one who got Brenna's oven going. And Tilly won't stop talking about you.",
      "I'm behind on wood for the winter, and my eyes need resting more than they used to. Could you lend a hand?",
      { opts: [["I'll help.", ["Bless you. Twenty logs ought to do it. Bring them here to the yard.", run(() => gwStep(1, `Bring Tobin ${GW_LOGS} logs.`))]],
        ["Not right now.", ["No rush. The trees aren't going anywhere. Well. Not far."]]] }];
    if (s === 1) {
      if (cnt('Logs') < GW_LOGS) return ["Twenty logs, when you've got them. No hurry. Well. Some hurry. It's getting cold."];
      return [me("Here's your wood."), run(() => { for (let i = 0; i < GW_LOGS; i++) removeItem('Logs'); renderBag(); }), "That's a lovely stack. Thank you.",
        "Can I ask you something? My little brother Hollis went north a week back. Said he was off to cut willow logs.",
        "There are willow trees just past the bridge. A morning's work. He should've been home by supper.", "I've walked the meadow twice. Nothing. Folk say there's a cave in the east hills.",
        "If anyone can find him, it's you. Would you look?", me("I'll find him."), run(() => gwStep(2, 'Look for Hollis in the cave in the east hills, past the north lake.'))];
    }
    if (s === 2) return ["Any sign of Hollis? The cave in the east hills, past the lake. Please."];
    if (s === 3 || s === 4) return [me('I found Hollis. Goblins have him locked in a cell.'), "Goblins! What was he doing in a cave?", me('Picking glowcaps, apparently.'),
      "Glowcaps. Of course it was.", "Get him out of there. I'd come, but I'd only fall asleep on the way."];
    if (s === 5) return [me('Hollis is home.'), "He is. Turned up at the yard looking like something the cat dragged in.",
      "Told me the truth about the willow logs, too. Took him an hour to get to it.", "Thank you. Truly. Here, this is for you.", run(() => completeGoneForWillow())];
    return null;
  }
  if (name === 'Hollis') {   /* at Tobin's woodyard, after he's free */
    if (s === 5) return [me('Feeling better?'), "Much. Tobin's made me promise. No more caves. For a month, anyway.", "Thanks for coming for me. I owe you one.", run(() => completeGoneForWillow())];
    return null;
  }
  return null;
}
// in the cave: what Hollis says about the quest, before his own talk about fish and glowcaps (null: nothing quest-wise to say)
function gwCellTalk(){
  const s = QUEST.gw || 0, P = CAVE_P, me = t => ({ me: t }), run = f => ({ run: f });
  if (s >= 2 && s < 5 && hasItem('Cell key')) return [me("I've got the key to your cell."), "You've got it! Quick, before something else decides I'm dinner.",
    run(() => gwFree()), "I'm going straight home to Tobin. Come and find us at his yard. I owe you."];
  if (s === 2) {
    const intro = [me('Hollis? Tobin sent me.'), "Tobin? Oh, thank goodness. He's worried, isn't he. He's always worried.", me('He says you went north to cut willow logs.'),
      "Willow logs. Yes. Well. I may have stretched that a bit.", "I came down after glowcaps. Tobin thinks they're daft. He's not wrong. There were goblins."];
    const tail = P.met ? ["The big cave goblin in the den keeps the key to this cell. Get past that and I'm a free man."]
      : ["They've had me locked up for days. I'm so hungry I could eat my own boots.", "There's fish in the pool next door, if you've got the gear. Blind as moles, but they taste alright cooked.",
        "And the big cave goblin in the den keeps the key to this cell.", me("I'll see what I can do.")];
    return [...intro, ...tail, run(() => { P.met = 1; gwStep(3, "Get Hollis out. The cave goblin in the den must have the key to his cell."); })];
  }
  return null;
}
// the cell key: the cave goblin drops it in its den; it lies there until taken while Hollis is still locked up
function gwDropKey(){
  const s = QUEST.gw || 0; if (!CAVE || s < 2 || s >= 5 || hasItem('Cell key')) return;
  if (!CV.cellKey) CV.cellKey = caveKey(0xc8a050, 0, 1.4, 608, () => {
    if (!CAVE || !CV.cellKey.visible || hasItem('Cell key')) return;
    if (!bagRoomFor(['Cell key'])) { showToast('Your bag is full.'); return; }
    addItem('Cell key', 1, ICON_FOR['Cell key']); CV.cellKey.visible = false; caveChime(); renderBag();
    if ((QUEST.gw || 0) < 4) gwStep(4, "Unlock Hollis's cell."); else showToast("You pick up the key to Hollis's cell.");
  });
  CV.cellKey.visible = true;
}
function gwFree(){
  if (!removeItem('Cell key')) return;
  if (CV.padlock) CV.padlock.visible = false; creak(true); caveChime();
  gwStep(5, "Go back to Tobin's woodyard in the western woods.");
  setTimeout(() => { if (CV.hollis) { CV.hollis.visible = false; const i = trees.indexOf(CV.hollis); if (i >= 0) trees.splice(i, 1); } showToast('Hollis squeezes out of the cell and hurries off towards daylight.'); }, 900);
}
// going in: a freed Hollis isn't in his cell any more, and a beaten cave still has the key if he needs it
function gwCaveEnter(){
  const freed = (QUEST.gw || 0) >= 5;
  if (CV.hollis) { CV.hollis.visible = !freed; if (freed) { const i = trees.indexOf(CV.hollis); if (i >= 0) trees.splice(i, 1); } else if (!trees.includes(CV.hollis)) trees.push(CV.hollis); }
  if (CV.padlock) CV.padlock.visible = !freed;
  if (CV.cellKey) CV.cellKey.visible = false;
  if (CAVE_P.beat) gwDropKey();
}
function gwCaveFrame(now){ const k = CV.cellKey; if (k && k.visible) { k.rotation.y = now / 600; k.position.y = k.baseY + Math.sin(now / 400) * 0.12; } }
// Hollis at Tobin's woodyard, once he's home: built the first time he's needed
let HOLLIS_HOME = null;
function gwVillageFrame(now){
  const home = (QUEST.gw || 0) >= 5;
  if (!home && !HOLLIS_HOME) return;
  if (!HOLLIS_HOME) {
    const look = { gender: 'male', skin: 0xe0b090, hair: 'short', hairCol: 0x6a5030, shirt: 0x6a7048, pants: 0x4a4030, ...LOOK_PLAIN, brows: 'soft' }, sp = makeChibi(look);
    sp.scale.setScalar(CHIBI_SCALE); sp.position.set(GW_YARD.x, 0, GW_YARD.z); scene.add(sp);
    const rec = { kind: 'npc', name: 'Hollis', title: "Tobin's brother", look, x: GW_YARD.x, z: GW_YARD.z, s: 0.7, state: 'standing',
      talks: [["Tobin's had me splitting logs all week. Penance, he calls it.", "I call it Tuesday."], ["Don't tell Tobin, but I saw more glowcaps up north."], ["Brenna gave me a whole pie when I got back. I nearly cried."]] };
    Object.assign(sp.userData, { action: 'Talk', name: 'Hollis', rec }); trees.push(sp);
    HOLLIS_HOME = { sp, rec };
  }
  const sp = HOLLIS_HOME.sp; sp.visible = home && !CAVE && !DELVE;
  if (!sp.visible) return;
  const tob = BARKERS.find(x => x.rec.name === 'Tobin'), q = new THREE.Vector3();
  let face = Math.PI / 2;
  if (hero && Math.hypot(hero.position.x - GW_YARD.x, hero.position.z - GW_YARD.z) < 7) face = Math.atan2(hero.position.x - GW_YARD.x, hero.position.z - GW_YARD.z);   /* he turns to whoever comes over */
  else if (tob) { tob.sp.getWorldPosition(q); if (Math.hypot(q.x - GW_YARD.x, q.z - GW_YARD.z) < 12) face = Math.atan2(q.x - GW_YARD.x, q.z - GW_YARD.z); }
  turnChibi(sp, face); poseChibi(sp, 'idle', now / 1000);
}
function completeGoneForWillow(){
  if ((QUEST.gw || 0) >= GW_DONE) return;
  QUEST.gw = GW_DONE; QUEST.qp = (QUEST.qp || 0) + 1;
  closeDialogBox();
  addItem('Coins', 150, COIN_ICON);
  quietLevelUps = true; addXp('Woodcutting', 600); addXp('Firemaking', 200); quietLevelUps = false;
  questJingle();
  const row = (icon, text) => `<div class="qr"><span class="qi">${icon}</span>${text}</div>`;
  showRewardScroll({ banner: 'Quest complete', title: 'Gone for Willow', sub: "Hollis is home, and Tobin knows the truth about the willow logs.",
    rewards: row(COIN_ICON, '150 coins') + row('<span style="color:#a07a2c">&#9733;</span>', '1 quest point'),
    xp: '<div class="qr">Woodcutting<b>+600</b></div><div class="qr">Firemaking<b>+200</b></div>',
    quote: '&ldquo;Willow logs. Honestly. Next time just tell me, and I\'ll come with you.&rdquo; &mdash; Tobin' });
  renderBag(); renderStats(); saveNow(false);
}
