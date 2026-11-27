// ----- the village: houses spread out, a smithy building, a woodland, a quarry and a fishing spot -----
const sk = n => levelOf(SKILL_XP[n]);
const VILLAGERS = [
  { name: 'Brenna', title: 'the baker', look: { gender: 'female', skin: 0xe8b48a, hair: 'long', hairCol: 0x7a4a22, shirt: 0xe8e0c0, pants: 0x6a4a3a },
    talks: [
      ['Oh! A new face! Come in, come in — mind the flour, it gets everywhere.', "I'm Brenna. I bake for the whole village, whether they pay me or not.", "Mostly not, if I'm honest. Tobin's owed me for a month of rolls."],
      ["Up before the sun again. Ovens don't light themselves, more's the pity.", "Heading into the woods? Take a crust. Hungry folk make daft choices."],
      ["Have you met Wenna, out on the green? She knows everything that goes on here. And twice as much that doesn't."],
      ["Folk think baking's gentle work. Try kneading forty loaves before breakfast, then tell me that."] ],
    barks: ["Fresh loaves out of the oven, come and get them while they're warm!", "Has anyone seen my rolling pin? I put it down for one minute.", "That's the honey bread nearly done. Can you smell it?"] },
  { name: 'Tobin', title: 'the woodcutter', look: { gender: 'male', skin: 0xd9a070, hair: 'short', hairCol: 0x2a1a10, shirt: 0x3a7a3a, pants: 0x4a3a2a },
    talks: [
      ["Hm? Oh... hello. Sorry. I was just... resting my eyes.", "Tobin. I cut wood. Well... I teach the young ones to cut wood. Same thing, really. Just louder."],
      [() => sk('Woodcutting') < 15 ? "Stick to the young trees for now. The oaks'll just laugh at your axe till you've a few more seasons of chopping behind you." : "Good arms on you. The oaks south of the hall are all yours, and their wood's worth twice the ordinary stuff.", "Swing from the hips... not the shoulders. Saves your back."],
      ["Don't tell Brenna, but... I've been paying her in kindling. She hasn't noticed. I think."],
      ["A good axe is only as good as your grip...", "...and a good grip's only as good as your lunch. Speaking of which..."] ],
    barks: ["I'm not asleep, I'm just resting my eyes for a bit.", "The young trees are best if you're just starting out.", "I'll get back to chopping in a minute. Probably."] },
  { name: 'Ysolde', title: 'the angler', look: { gender: 'female', skin: 0xf0c8a0, hair: 'topknot', hairCol: 0x1a1a1a, shirt: 0x4a6aa0, pants: 0x3a3a4a },
    talks: [
      ["Shh. You'll scare the fish. They can hear you through the walls, you know.", "...They can't, really. But you never know."],
      [() => (sk('Fishing') < 5 ? "Still working out which end of the rod goes in the water, then." : "You've got the patience for it. I can tell."), "Shrimp come up by the bank first thing in the morning."],
      ["Fenwick swears he caught a fish as long as a horse. He didn't. I was there. It was a boot."],
      ["The river's different every day. Some mornings the shrimp practically jump in the net, other days you'll sit here for hours with nothing."] ],
    barks: ["Keep your voice down a little, please. The fish are biting.", "The river's lovely and calm today. Good day for shrimp.", "Fenwick's telling that horse-sized fish story again, isn't he?"] },
  { name: 'Dunmore', title: 'the smith', look: { gender: 'male', skin: 0xc08a60, hair: 'short', hairCol: 0x5a5a5a, shirt: 0x6a4a3a, pants: 0x2a2a2a },
    talks: [
      ["Mind the sparks, and your eyebrows, if you want to keep them.", "I'm Dunmore. I keep the forge hot while the master's away. Been away eleven years, mind."],
      [() => (sk('Smithing') < 4 ? "Start with bars, then daggers. Swords can wait until you've stopped burning your fingers." : "You're getting the feel of the hammer."), "Copper and tin, a lump of each, into the furnace. That's your bronze."],
      ["Always strike the metal while it's still glowing. Let it cool and it'll crack on you, and then you've wasted a good bar."],
      ["Gertrude brings me the best ore in the valley. Don't tell her. Her head's big enough already."] ],
    barks: ["Stand back from the forge, the sparks fly further than you'd think.", "It's hot work in here, I'll tell you that for nothing.", "Has anyone seen my good hammer? I had it a minute ago."] },
];
// the people outside, each with their own place, manner and things to say
const TOWNSFOLK = [
  { name: 'Rennick', title: 'the prisoner', x: -16.6, z: 73, rad: 0.9, s: 1.5,   /* in the middle cell; s keeps the talk spot out in the corridor */
    look: { gender: 'male', skin: 0xe0b088, hair: 'short', hairCol: 0x8a5a2a, shirt: 0x7a6a4a, pants: 0x4a3a2a },
    talks: [
      ["Oh, a visitor! Don't mind the bars, they're mostly for show.", "Rennick. Travelling merchant. Wrongly accused, naturally."],
      ["All I did was offer Bram a very fair price on some cabbages.", "How was I to know they were his? He names them, you know. Took it ever so personally."],
      ["Osric caught me. Well. Osric tripped over me. Came to the same thing, sadly."],
      ["Is Aldric still snoring through his watch? You can hear him from in here on a quiet night."],
      ["Brenna sends bread over. I think she feels sorry for me. I let her."],
      ["I'll be out by morning. I'm always out by morning.", "...It's been three mornings."] ],
    barks: ["Psst! You've got an honest face. Got a spoon?", "I'm innocent! Mostly!", "Lovely day out there, I expect."] },
  { asks: [{ q: "What's out past the farm, to the south?", a: ["The old Haldane farm. Burned down years ago, long before your time.", "Folk say the family dug a cellar under it. Deep. Deeper than any cellar has a right to be.", "If I were you, I'd leave it well alone. But you're not me, are you?"] }],
    name: 'Aldric', title: 'the guard captain', level: 20, x: 11, z: 16, rad: 1.5,
    gear: { head: 'Iron helmet', body: 'Iron chestplate', legs: 'Iron leg armour', feet: 'Iron boots', back: "Villager's cloak", weapon: 'Iron sword', shield: "Iron Guard's shield" },
    look: { gender: 'male', skin: 0xe0b088, hair: 'short', hairCol: 0x8a6a3a, shirt: 0x8a9099, pants: 0x3a3a44 },
    talks: [
      ["Halt. State your business.", "...Exploring. Of course. Everyone's exploring. Nobody's ever smuggling.", "Welcome to the village. Keep to the paths, and keep that axe pointed at trees."],
      ["Quiet day. I like quiet days. Quiet days mean nobody needs a guard.", "Which is worrying, now I think about it."],
      ["Goblins have been seen past the western woods. Probably nothing.", "...Probably."],
      ["I once stood here nine hours without blinking. Pip says it doesn't count because I was asleep. Pip is wrong."] ],
    barks: ["All quiet at the hall today, just how I like it.", "Welcome to the village, traveller. Keep to the paths.", "I was not asleep. I was keeping watch with my eyes closed."] },
  { asks: [{ q: "What's out past the farm, to the south?", a: ["The burnt farm? I don't go down there. Nobody does, if they've any sense.", "Those farmers you see wandering about used to work that land. Ask yourself why they never left.", "And why they're always so angry."] }],
    name: 'Osric', title: 'the guard', level: 15, x: -45, z: 3, rad: 3,
    look: { gender: 'male', skin: 0xd09a70, hair: 'short', hairCol: 0x3a2a1a, shirt: 0x8a9099, pants: 0x3a3a44 },
    gear: { head: 'Iron helmet', body: 'Iron chestplate', legs: 'Iron leg armour', feet: 'Iron boots', back: "Villager's cloak", weapon: 'Iron sword', shield: "Iron Guard's shield" },
    talks: [
      [() => { const h = hourNow(); return (h < 5 || h >= 21 ? "Late to be wandering about, isn't it?" : h < 12 ? "Morning! You're up early." : h < 18 ? "Afternoon. Lovely day for it." : "Evening. Lamps'll be lit soon."); },
       "I'm Osric. I look after the green, which mostly means making sure Pip doesn't fall down the well.",
       "He hasn't yet, touch wood. Came close on Tuesday."],
      ["You've met Mara at the shop? Her prices are fair, honestly.", "Just don't let her hear me say that, or she'll put them up."],
      ["People think a quiet patrol is a boring one.", "Trust me, you want it quiet. When it gets loud round here, it's usually the geese."],
      ["Aldric's been captain since before I joined. Good man. Snores like a bear, mind.", "We all pretend not to notice when he nods off at his post."] ],
    barks: ["Pip, come away from the well, please!", "All clear on the green. Not even the geese are causing trouble.", "Mind how you go, the green gets muddy after rain."] },
  { asks: [{ q: "What's out past the farm, to the south?", a: ["So you've heard the scratching too. Under the ground, near the old chimney.", "I followed it once on patrol and found a pair of cellar doors, chained shut.", "Chained from the outside. I've wondered about that ever since."] }],
    name: 'Edda', title: 'the guard', level: 14, x: -68, z: 13, rad: 3,
    look: { gender: 'female', skin: 0xe8c39c, hair: 'long', hairCol: 0x7a4a22, shirt: 0x8a9099, pants: 0x3a3a44 },
    gear: { head: 'Iron helmet', body: 'Iron chestplate', legs: 'Iron leg armour', feet: 'Iron boots', back: "Villager's cloak", weapon: 'Iron sword', shield: "Iron Guard's shield" },
    talks: [
      ["Stop right there. ...Oh, you're one of ours. Carry on.", "I'm Edda. I keep watch on the west road, so anything that comes out of those woods has to get past me first."],
      ["Hobb swears the goblins are stealing his socks. I've seen his socks. Nobody's stealing those."],
      ["Stay sharp past the woods. Something's been moving out there after dark."] ],
    barks: ["I'm keeping an eye on those woods. Something's been moving out there.", "The west road's clear for now. Stay on it after dark.", "If you're heading into the woods, keep your wits about you."] },
  { asks: [{ q: "What's out past the farm, to the south?", a: ["Truffle won't go anywhere near the place. Pigs know things, you know.", "There's an old man who sits out by the chimney. Ezra. He'll tell you more than I can.", "Whether you'll want to hear it is another matter."] }],
    name: 'Bertram', title: 'the guard', level: 12, x: 35, z: 11, rad: 3,
    look: { gender: 'male', skin: 0xb07a50, hair: 'short', hairCol: 0x1a1a1a, shirt: 0x8a9099, pants: 0x3a3a44 },
    gear: { head: 'Iron helmet', body: 'Iron chestplate', legs: 'Iron leg armour', feet: 'Iron boots', back: "Villager's cloak", weapon: 'Iron sword', shield: "Iron Guard's shield" },
    talks: [
      ["I'm Bertram. I guard the farm road, which mostly means guarding it from Truffle, Bram's pig.", "That pig has escaped four times this month. Four times! I've started to think she's doing it on purpose."],
      ["Bram keeps offering me cabbages, and I'm too polite to say no. I've got so many now I don't know what to do with them."],
      ["Gertrude's fenced off the new quarry past the smithy. Says it keeps the pig out. It doesn't."] ],
    barks: ["If you see a pig running loose, that's Truffle. Shout for me.", "All quiet on the farm road. Just me and the cabbages.", "Bram's offered me another cabbage. That's six this week."] },
  { asks: [{ q: "What's out past the farm, to the south?", a: ["Aldric told me not to talk about it. So I'm not going to.", "Except... the rats have to come from somewhere, don't they? And it isn't the river.", "Please don't tell Aldric I said that."] }],
    name: 'Godwin', title: 'the guard', level: 10, x: 41, z: 60.8, rad: 0.6,
    look: { gender: 'male', skin: 0xf1cba0, hair: 'short', hairCol: 0xc0442a, shirt: 0x8a9099, pants: 0x3a3a44 },
    gear: { head: 'Iron helmet', body: 'Iron chestplate', legs: 'Iron leg armour', feet: 'Iron boots', back: "Villager's cloak", weapon: 'Iron sword', shield: "Iron Guard's shield" },
    talks: [
      ["First week on the job! Godwin. They've put me outside the smithy. Very important post. Probably.", "Dunmore says I'm guarding the forge. I think I'm just standing near it."],
      ["Aldric says one day I'll be as good as him. He also says that to Pip."],
      ["If you see anything suspicious, shout. Loudly. I'm still getting used to the helmet."] ],
    barks: ["Halt! Oh, sorry, I thought you were someone else. Carry on.", "It gets ever so warm standing this close to the forge.", "The quarry's just down that path, if you're after ore."] },
  { name: 'Tilly', title: 'the market keeper', x: 110, z: 2.9, rad: 0.5, s: 1.5, hat: 'straw', shop: 'market',
    look: { gender: 'female', skin: 0xf0c8a0, hair: 'long', hairCol: 0xe0c070, shirt: 0x8ab060, pants: 0x6a4a30 },
    talks: [
      ["Fresh from the fields! Well, fresh-ish. Fresh this morning, anyway.", "I'm Tilly, Hilde's little sister. She runs the farm, I run the market. Somebody has to sell all those turnips.", "Seeds, tools, and I'll buy anything that grows or gets spun round here."],
      ["Hilde says I talk too much. Hilde says that to everyone, so I don't take it personally."],
      ["Bram tried to sell me a cabbage he'd named. I couldn't do it. It's on my windowsill now. Its name is Gerald."],
      ["Pip helps on market days. By helps, I mean he eats the mulberries and tells customers they're poisonous so he can have the rest."],
      ["Those silkworms in the workshop eat like Bram at a harvest supper. Keep 'em in mulberry leaves and they'll keep you in silk."],
      ["Aloe's the clever one. Silk and a bit of aloe leaf, and you've a bandage that'll mend near anything."] ],
    asks: [
      { q: 'What can I grow?', a: ["Wheat, to start with. Anyone can grow wheat.", "Aloe's a bit trickier. Get a few harvests under your belt first.", "Mulberry bushes are fussy things. You'll want a fair bit more time in the fields before they'll take for you.", "I sell the seeds. Plant 'em, water 'em, talk to 'em if you're Bram."] },
      { q: 'How do I make silk?', a: ["Feed mulberry leaves to the silkworms in the workshop, just west of here. Give 'em a minute or two and they'll spin you cocoons.", "Then spin the cocoons into thread on the wheel in there. Lovely stuff. I'll buy it off you, or you can make bandages with aloe."] } ],
    barks: ["Seeds! Fresh seeds! Wheat, aloe and mulberry!", "Selling your harvest? I pay fair, mostly!", "Silk thread wanted, good prices paid!", "Fresh from the fields, come and have a look!"],
    choice: { question: 'Fancy a look at my stall?' } },
  { name: 'Ezra', title: 'the old farmer', x: 75.5, z: 70, rad: 0.6, hat: 'straw',
    look: { gender: 'male', skin: 0xd8a878, hair: 'short', hairCol: 0xc8c8c8, shirt: 0x6a5a40, pants: 0x4a4a52 },
    talks: [
      ["Another one come to gawk at the ruins, eh?", "I'm Ezra. This was my farm, once. Best wheat in the whole valley.", "Then the cellar woke up."],
      [() => cellarOpen() ? "The chain's come off. You've earned it, I'll give you that." : "That cellar's no place for the soft-handed. You'll have to prove yourself first.", "Ten of every creature that roams this land: chickens, cows, the rats, and those farmers. Then the chain will let go."],
      ["My old farmhands worked hard for me once. Now look at them, wandering about with pitchforks, angry at nothing.", "Whatever's down there got into them. Into the rats too."],
      ["I sit here so nobody wanders down there by accident.", "Doing it on purpose, though, that's your own business."] ],
    asks: [
      { q: "What's down in the cellar?", a: ["Trouble. Wave after wave of it, if the old stories are true.", "You go down with whatever you're carrying, and that's all. There's no popping back up for supplies.", "Win, and you'll be well rewarded. Lose, and it'll cost you a quarter of your coin."] },
      { q: "How do I get the chain off?", a: [() => { const left = [['chickens', 'chicken'], ['cows', 'cow'], ['rats', 'rat'], ['my old farmhands', 'farmer']].filter(([, k]) => KILLS[k] < 10).map(([w]) => w);
        return !left.length ? "The padlock's had its fill. Go on, then." : `The padlock keeps count, scratch by scratch. It still wants more of ${left.length > 1 ? left.slice(0, -1).join(', ') + ' and ' + left[left.length - 1] : left[0]} before it lets go.`; }, "Beat ten of each and come back. The chain will know."] } ],
    barks: ["Keep away from that cellar if you value your coin.", "Best wheat in the valley, this was. Best wheat.", "Mind the rats. They bite harder than they look."] },
  { name: 'Jory', title: 'the fishmonger', x: -63, z: 92.4, rad: 0.5, s: 1.6, talkAt: FISH_SHACK.talk, hat: 'souwester', seaDog: true, shop: 'fish',
    look: { gender: 'male', skin: 0xe8b890, hair: 'short', hairCol: 0x9a9a9a, shirt: 0xe8c030, pants: 0x3a4a5a, boots: 0x2a2a2a },
    talks: [
      ["Afternoon. Jory. I keep the shack, and the shack keeps me. More or less.", "Nets, rods, worms. And I'll take any fish you've no use for."],
      ["My Wenna sits on the green all day hearing everyone's news. Then she walks all the way out here to tell it me again.", "Forty years, every evening. I wouldn't change it. Don't tell her."],
      ["Bream in this pond. Bony, but sweet. They won't look at a net, mind. Rod and a worm."],
      ["Fenwick says he caught a fish as long as a horse. He's been saying that since we were boys.", "It was a boot then, too."],
      ["Folk sell me their catch and I sell it on. A man's got to eat. And Wenna likes her ribbons."] ],
    asks: [
      { q: 'What bites in the pond?', a: [() => sk('Fishing') < 10 ? "Bream. But they're canny old things. Get some practice in on the river shrimp first, then come and see me." : "Bream. A rod, a worm on the hook, and patience. I sell the first two.", "Trout? Not in here. Over the bridge and up north, there's a pool in the trees. Mind the rats up there, mind. Big as cats.", "They'll only rise to a fly, and I've no fly rods to sell. Hollis had the last one, and he went poking about in that cave in the hills."] },
      { q: 'How long have you and Wenna been married?', a: ["Forty-one years come spring. She'd say forty-two. She counts the courting.", "Asked her on that bench on the green. She said she'd think about it. Took her a week.", "Longest week of my life, that was."] } ],
    barks: ["Worms! Fresh worms! Well. Lively, anyway.", "Fresh fish on the slab! Fair prices, near enough.", "Nets, rods and bait. Everything but the patience."],
    choice: { question: 'What can I do for you?' } },
  { name: 'Wenna', title: 'the old gossip', x: -30, z: 13.8, rad: 0.01, sit: true,
    look: { gender: 'female', skin: 0xe8c39c, hair: 'topknot', hairCol: 0xd8d8d8, shirt: 0x6a5a8a, pants: 0x4a3a5a },
    talks: [
      ["Come here, dear, sit, sit. Let me have a look at you.", "Hm. You'll do. I'm Wenna. I've lived on this green since before they dug the well.", "My Jory keeps the fishing shack down by the pond. Smells of bream, but he's mine.", "Want to know anything about anyone? Ask me. Want to keep a secret? Then don't tell me, dear."],
      ["Did you hear? Tobin's been paying Brenna in kindling. Oh, she knows. She just likes kindling."],
      ["Aldric snores at his post. Everyone knows. We let him think we don't."],
      ["Jory thinks I don't know he gives Pip worms for nothing. I know everything, dear. Especially about Jory."],
      ["Forty-one years married, and that man still can't fold a net without swearing at it."],
      ["Lyra sings the same three songs. Lovely songs! But it's the same three.", "Don't tell her I said so. Actually... do. She could use a fourth."] ],
    barks: ["Ooh, come here, dear, I've got some news you'll want to hear.", "If you see my Jory, tell him supper's at six. He'll be late anyway.", "In my day, this green was half the size and twice as tidy.", "These old knees don't like the cold, I can tell you that."] },
  { name: 'Pip', title: 'the village kid', x: -40, z: 3, rad: 4.5, child: true,
    look: { gender: 'male', skin: 0xf1cba0, hair: 'short', hairCol: 0xc0442a, shirt: 0xd8a030, pants: 0x4a5a8a },
    talks: [
      ["Are you an ADVENTURER?! You look like an adventurer! Have you fought a dragon?!", "No? Have you fought a GOOSE? Geese are worse. Way worse."],
      ["I can run round the well forty times! Watch! ...Okay, I'll do it later."],
      ["When I grow up I'm gonna be a guard like Aldric! Except awake."],
      ["Mara gave me a sweet for not touching the pickaxes! I touched one a little. Shh!"] ],
    barks: ["Bet you can't catch me! I'm the fastest in the whole village!", "Tag, you're it! No tag-backs!", "Have you ever fought a goose? I have. I lost."] },
  { name: 'Lyra', title: 'the bard', x: -41.5, z: 2.5, rad: 1.2,
    look: { gender: 'female', skin: 0xc9955f, hair: 'long', hairCol: 0x2a1a10, shirt: 0x2a7a6a, pants: 0x5a2a4a },
    talks: [
      ["A traveller! At last, someone who hasn't heard my songs yet!", "I'm Lyra. I sing of heroes. You're not one yet, but I'm patient."],
      ["♪ Oh, the river runs and the axes swing, and the baker bakes, and the smith goes ding... ♪", "...It's a work in progress."],
      ["Wenna says I only know three songs. I know four! The fourth's the third one, just faster."],
      [() => Object.keys(SKILL_XP).reduce((t, n) => t + sk(n), 0) < 50 ? "Turn your hand to a bit of everything, and one day I'll write you a verse. Promise." : "Is there anything you can't do now? Right, that's it. I'm starting on your verse tonight."] ],
    barks: ["♪ Oh, the river runs and the axes swing... ♪", "Any requests? I know three songs. Well, four.", "I'm still looking for a word that rhymes with pickaxe."] },
  { name: 'Hobb', title: 'the forester', x: -82, z: 11, rad: 2.5, hat: 'hood',
    look: { gender: 'male', skin: 0xd09a70, hair: 'short', hairCol: 0x5a3a1a, shirt: 0x4a6a3a, pants: 0x5a4a2a },
    talks: [
      ["Careful in these woods. The roots are older than the village, and twice as grumpy.", "Hobb. I look after the trees. Mostly I apologise to them after Tobin's lot have been through."],
      ["Every tree you cut grows back. That's the deal. Take what you need, not what you can."],
      ["Something's been nicking my socks. I blame goblins. I blame goblins for most things, to be fair."],
      ["Listen. Hear that? No? Me neither. That's what a healthy forest sounds like."] ],
    barks: ["Mind the roots along here, they'll trip you if you're not looking.", "Take only what you need from these woods, and they'll keep giving.", "Who goes there? Oh, it's you. Sorry, I thought you were a goblin."] },
  { name: 'Gertrude', title: 'the miner', x: 15.5, z: 66, rad: 1.2, hat: 'helm',
    look: { gender: 'female', skin: 0xb07a50, hair: 'short', hairCol: 0x3a2a1a, shirt: 0x7a5a3a, pants: 0x3a3a3a },
    talks: [
      ["You here to mine or to stand about? Either's fine. Only one of 'em pays.", "I'm Gertrude. Copper's on the west side, tin's on the east. Melt a bit of both together and you've got bronze."],
      [() => (sk('Mining') < 5 ? "Your hands are still soft, but they'll toughen up soon enough. Just keep swinging." : "You're getting the hang of it. Keep at it and you'll be out-mining me before long.")],
      ["Dunmore pretends he doesn't rate my ore. Keeps the best bits on a shelf, he does. I've seen it."],
      ["Rocks grow back, y'know. Slowly. Like my patience."] ],
    barks: ["Copper's on the west side, tin's on the east. Help yourself.", "Mind your toes round the rocks, I'm not carrying anyone home.", "If a rock's been mined out, give it a minute and it'll come back."] },
  { name: 'Fenwick', title: 'the old fisherman', x: -33, z: -9.6, rad: 1, hat: 'straw',
    look: { gender: 'male', skin: 0xe0b088, hair: 'short', hairCol: 0xb8b8b8, shirt: 0x5a6a7a, pants: 0x4a3a2a },
    talks: [
      ["Ahh, a new angler! Pull up a rock, pull up a rock.", "Fenwick. Forty years on this bank, man and boy. Caught a fish as long as a horse once, you know.", "Ysolde says it was a boot. Ysolde wasn't wearing her spectacles, was she?"],
      ["Trick is to think like a fish. Don't think too hard, mind. Fish don't."],
      ["Some days the river gives, some days it takes. Mostly it takes my bait, the cheeky thing."],
      ["Shrimp by the bank. Bigger ones further out. Much bigger. Horse-sized, some of 'em. I've seen 'em!"],
      [() => (sk('Fishing') < 10 ? "This stream runs down to a pond past Mara's. Bream in there, but they're canny. Cut your teeth on shrimp first." : "You're ready for the pond, past Mara's. Bream won't look at a net, mind. Old Jory sells rods and worms out of his shack.")] ],
    barks: ["Come on, bite, you little rascal. I know you're down there.", "I caught a fish as big as a horse once. Ask anyone. Well, don't ask Ysolde.", "Shrimp are thick by the bank today. Grab yourself a net."] },
];

const fishSpots = [];
const SHRIMP_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M4 11 Q6 4 11 5 Q9 7 9 9 Q7 12 4 11 Z" fill="#f08a6a" stroke="#7a3a2a" stroke-width="0.8"/><rect x="10" y="4" width="2" height="2" fill="#1a1a1a"/></svg>`;
// a splash when the line goes in
function splashSound(){ sfx((ctx, t, out) => { out.gain.value = 0.55;   // a soft splash: water gently parting and settling, then two faint drips
  nz(ctx, out, t, 0.6, 'bandpass', 1800 * wobble(), 600, 0.9, 0.8, 0.12, 0.45);
  nz(ctx, out, t, 0.5, 'lowpass', 380, 380, 0.7, 0.45, 0.15, 0.3);
  for (const [d, f, v] of [[0.3, 900, 0.1], [0.42, 1200, 0.07]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f + 600, t + d); o.frequency.exponentialRampToValueAtTime(f, t + d + 0.05);
    g.gain.setValueAtTime(v, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.1); o.connect(g); g.connect(out); o.start(t + d); o.stop(t + d + 0.12); } }); }
// fishing takes time: each dip of the net takes a few seconds and may come up empty; it carries on by itself
// until your bag is full. Clicking the spot again while fishing does nothing, and walking away stops it.
let fishing = null;
const FISH_MS = 3000;
// what each spot gives: shrimp in the river, trout in the pond (Fishing 15 and 45 XP in the phone game, scaled to our shrimp)
const FISHES = { shrimp: { raw: 'Raw shrimp', word: 'shrimp', lvl: 1, xp: 10, tool: 'Small fishing net', need: 'a fishing net' }, trout: { raw: 'Raw trout', word: 'trout', lvl: 15, xp: 25, tool: 'Fly fishing rod', need: 'a fly fishing rod', bait: 'Feathers', noBait: 'You need feathers to tie flies with. Chickens drop them.', out: 'You have run out of feathers.' },
  bream: { raw: 'Raw bream', word: 'bream', lvl: 10, xp: 20, tool: 'Fishing rod', need: 'a fishing rod', bait: 'Worms', noBait: 'You need worms for bait. Jory sells them by the pond.', out: 'You have run out of worms.' } };   /* trout take a fly: a rod, and a feather for each cast, as in RuneScape */
function catchFish(rec){
  if (fishing) return;
  rec = rec || trees.find(t => t.userData.rec && t.userData.rec.kind === 'fish').userData.rec;
  if (!roomForOne(FISHES[rec.fish].raw)) { showToast('Your bag is full.'); return; }
  fishing = { rec, t0: performance.now(), cast0: performance.now(), c: Date.now() }; fishing.will = fishRoll(FISHES[rec.fish]);
  showToast(FISHES[rec.fish].bait ? 'You cast your line out over the water...' : 'You dip your net in the water...'); splashSound();
  setAct({ k: 'fish', t: Date.now(), r: FISHES[rec.fish].tool !== 'Small fishing net' ? 1 : 0, c: fishing.c });
  document.getElementById('smeltLabel').textContent = 'Fishing...'; document.getElementById('smeltBar').style.display = 'block';
}
const fishRoll = F => Math.random() < Math.min(0.9, 0.45 + (levelOf(SKILL_XP.Fishing) - F.lvl + 1) * 0.02);   // a catch is more likely the better you are
function stopFishing(msg){ if (!fishing) return; fishing = null; document.getElementById('smeltBar').style.display = 'none'; if (ONLINE.act && ONLINE.act.k === 'fish') setAct(null); if (msg) showToast(msg); }
function updateFishing(){
  if (!fishing) return;
  const k = (performance.now() - fishing.t0) / FISH_MS;
  document.getElementById('smeltFill').style.width = Math.min(100, k * 100) + '%';
  if (hero) heroAnim.yaw = yawTo(hero.position.x, hero.position.z, fishing.rec.x, fishing.rec.z);
  heroAnim.mode = FISHES[fishing.rec.fish].tool !== 'Small fishing net' ? 'fish' : 'net';
  if (k < 1) return;
  // a catch is more likely the better you are at fishing
  const F = FISHES[fishing.rec.fish];
  if (fishing.will) {
    if (F.bait && !hasItem(F.bait)) { stopFishing(F.out); return; }
    if (!addItem(F.raw, 1, ICON_FOR[F.raw])) { stopFishing('Your bag is full.'); return; }
    if (F.bait) removeItem(F.bait);   // the fly is used up with the catch
    addXp('Fishing', F.xp); showToast(`You catch a raw ${F.word} (${countOf(F.raw)}).  +${F.xp} Fishing XP`);
  }
  if (!roomForOne(F.raw)) { stopFishing('Your bag is full.'); return; }
  fishing.t0 = performance.now(); fishing.will = fishRoll(F); if (!F.bait) splashSound(); setAct({ k: 'fish', t: Date.now(), r: F.tool !== 'Small fishing net' ? 1 : 0, c: fishing.c });   // the net goes in again
}
function updateFish(){
  const pulse = 1 + 0.08 * Math.sin(performance.now() / 400);   // the ripples pulse
  for (const f of fishSpots) f.ring.scale.setScalar(pulse);
}
function addFishSpot(x, z, fish = 'shrimp'){
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.7, depthWrite: false }));
  ring.position.set(x, WATER_Y + 0.05, z); town.add(ring);
  const hit = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hit.position.set(x, 0.1, z); town.add(hit);
  const rec = { kind: 'fish', fish, x, z, s: 1.6, state: 'standing', ring };
  hit.userData = { action: 'Fish', name: fish === 'trout' ? 'Trout spot' : fish === 'bream' ? 'Bream spot' : 'Fishing spot', rec }; trees.push(hit);
  fishSpots.push(rec);
}
// reeds and stones along the banks, lily pads on the pond, and a few trees round it: one merged mesh, as it is all decoration
function buildWaterside(){
  const r = (() => { let q = 4242; return () => (q = (q * 16807) % 2147483647) / 2147483647; })(), parts = [];
  const add = (geo, col, x, y, z, ry = 0) => { const g = geo.index ? geo.toNonIndexed() : geo; g.deleteAttribute('uv'); g.rotateY(ry); g.translate(x, y, z);
    const c = new THREE.Color(col), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); parts.push(g); };
  const reeds = (x, z) => { const n = 3 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) { const h = 0.9 + r() * 0.9, px = x + (r() - 0.5) * 0.7, pz = z + (r() - 0.5) * 0.7, lean = (r() - 0.5) * 0.25;
      const stalk = new THREE.CylinderGeometry(0.018, 0.035, h, 4).translate(0, h / 2, 0).rotateZ(lean); add(stalk, r() < 0.5 ? 0x5a7a2e : 0x6e8a36, px, WATER_Y, pz, r() * 6);
      if (r() < 0.45) add(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 5).translate(-Math.sin(lean) * h, h - 0.05, 0).rotateZ(0), 0x6a4426, px, WATER_Y, pz, 0); } };
  const stone = (x, z) => { const g = new THREE.DodecahedronGeometry(0.22 + r() * 0.2, 0); g.scale(1, 0.45, 0.8); add(g, r() < 0.5 ? 0x8a867c : 0x6e6a62, x, WATER_Y + 0.12, z, r() * 6); };
  const bank = (x, z, inWater) => { if (Math.abs(x + 36) < 5 || Math.abs(x + 24) < 10 && z < -10) return;   // keep the shrimp spot and Fenwick's jetty open
    if (inWater) { if (r() < 0.7) reeds(x, z); } else if (r() < 0.5) stone(x, z); };
  for (let x = -119; x < 118; x += 1.6) { const s = riverSouth(x); if (r() < 0.35) bank(x, s - 0.3, true); if (r() < 0.25) bank(x + 0.8, s + 0.1, false); }
  for (let i = 0; i < STREAM.length - 1; i += 1) { const [x0, z0] = STREAM[i], [x1, z1] = STREAM[i + 1], L = Math.hypot(x1 - x0, z1 - z0), nx = -(z1 - z0) / L, nz = (x1 - x0) / L;
    for (const side of [1, -1]) { if (r() < 0.45) bank(x0 + nx * side * (STREAM_W - 0.3), z0 + nz * side * (STREAM_W - 0.3), true); if (r() < 0.3) bank(x0 + nx * side * (STREAM_W + 0.2), z0 + nz * side * (STREAM_W + 0.2), false); } }
  for (let a = 0; a < Math.PI * 2; a += 0.12) { const R = pondR(a), at = d => [POND.x + Math.cos(a) * d, POND.z + Math.sin(a) * d * POND.k];
    if (Math.abs(a) < 0.75 || Math.abs(a - Math.PI * 2) < 0.75) { if (r() < 0.3) stone(...at(R + 0.25)); continue; }   // the east bank stays open for fishing
    if (r() < 0.75) reeds(...at(R - 0.35)); if (r() < 0.35) stone(...at(R + 0.25)); }
  for (let i = 0; i < 26; i++) {   // lily pads, a few with a pink flower
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * (pondR(a) - 1.2), x = POND.x + Math.cos(a) * d, z = POND.z + Math.sin(a) * d * POND.k;
    if (fishSpots.some(f => Math.hypot(f.x - x, f.z - z) < 1.8)) continue;
    const sz = 0.35 + r() * 0.3; add(new THREE.CircleGeometry(sz, 10, 0.4, Math.PI * 2 - 0.8).rotateX(-Math.PI / 2), r() < 0.5 ? 0x4e8a34 : 0x5f9a3a, x, WATER_Y + 0.025, z, r() * 6);
    if (r() < 0.3) { add(new THREE.ConeGeometry(0.13, 0.16, 6, 1, true), 0xf2a6c4, x, WATER_Y + 0.1, z); add(new THREE.SphereGeometry(0.05, 5, 4), 0xf7e07a, x, WATER_Y + 0.13, z); } }
  const m = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, side: THREE.DoubleSide }));
  m.castShadow = true; town.add(m);
  for (const [x, z] of [[-99, 92], [-69, 95], [-100, 77], [-96, 100]]) makeTree(x, z, 1.4);   // trees round the pond
}
