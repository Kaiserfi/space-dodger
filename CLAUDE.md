# Project notes

## ITAP Adventure (`adventure/index.html`)

The whole game is one file: a three.js module script inside `adventure/index.html`. Players share a live Firebase Realtime Database, so treat every change as going straight to real players.

It is a RuneScape-style village game based on the owner's phone game, **Idle Tap Adventure (ITAP)**. When a feature exists in ITAP (monsters, delves, warnings, balance), match it: its code is in the `Kaiserfi/idletapadventure` repo (for example `www/js/combat.js` for challenge-mode delves and their wording). When it doesn't, follow how RuneScape does it, adapted to our simpler skills.

### Before you build

- **Ask only when the choice changes what gets built** (single or multi-combat, private or shared ground items). Otherwise pick the sensible default, say which, and go.
- **"Show me" means a mock-up, not a change.** When the owner asks what something would look like, render it with test hooks and send pictures, without changing the game. Offer to build it afterwards.
- **Search before adding a name.** The file is huge and shares one scope: check a new function or `const` name isn't already taken (`roomFor`, `roof` and `SNOW` all clashed once). `node --check` catches a clash at the same level, but not one hidden in an inner scope.
- **Read the owner's messages mid-task.** They often add a request while you work; fold it into the current change, or do it next and say so.

### Characters

- **Characters are 3D chibi figures.** Every character (the hero, villagers, Mara, other players) is built by `makeChibi(look)` and animated by `poseChibi(g, mode, t, tool)` with modes `idle`, `walk` and `swing`. The model is about 2.7 units tall before `CHIBI_SCALE`. Keep the toy style: big round head, big shiny eyes, no nose, toon shading (`toonMat`) and the dark outline from `chibiPart`.
- **Tools must be sized to the character.** A held tool's handle runs about the length of the arm plus forearm (the axe and pickaxe handles are 1.35 in model units) and its head must read clearly next to the hand. Check new tools from the side across the whole swing before shipping.
- **Tools face the right way.** In `makeTool`, the handle runs from the hand along -y and the working end faces -z, the direction the arm travels as it swings down, so an axe's edge and a pickaxe's point lead the blow into the tree or rock.
- **No clipping.** Hair, gear and tools must not pass through the head, body or arms from the front, side, back or 3/4 view, standing, mid-stride or mid-swing. Long hair stays behind the shoulders so the arms swing clear of it.
- **Check clipping by measuring as well as looking.** A side view can make a blade look like it crosses the head when it is beside it, and the reverse. Sample points along the item in world space (`obj.localToWorld`) and compare them with the head's bounding sphere, and render front, side, back and 3/4 views. Also check held items don't go into the ground when standing.
- **Held gear is hidden while the hands are busy.** `poseChibi` hides arm gear (sword, shield, torch) for every pose except `idle`, `walk` and the fight poses, so new skilling or everyday poses are covered automatically. Keep it that way.
- **Every job faces what it works on and has its own pose.** Use `farmAct(pt, ms, label, done, reach)` style: walk to a free side at the right distance (`reach`), turn to face it, play the pose for the job's length, then finish. Filling the can at the trough is an example.
- **Don't change an animation the owner didn't ask about.** If fixing one thing (for example the sword tip) would change another (the swing), ask first or keep the original. The owner chose to keep the original sword swing.
- **Monster models need visible faces.** Eyes and other face parts must sit on the surface of the head mesh, not inside it (the cow's eyes were hidden inside its head box).

### Buildings, stalls and props

- **Measure clearance against the tallest character, in world units.** A standing hero is about 3.95 tall, and NPCs with hats (Tilly, Bram, Ezra, the angry farmers) reach about the same height. Doorways must be at least 4.5 high. Awnings, beams and roofs that anyone stands under need their underside at least 0.15 above the top of the head. Measure with `new THREE.Box3().setFromObject(sprite).max.y` and compare it with the underside at that exact spot (sloped awnings are lower at the front). Don't guess from screenshots. When the owner gives a number ("raise it 1 unit"), use exactly that number.
- **Check a new building from outside and from inside.** Walk the hero through every doorway in a test, and screenshot the outside from street level and the inside with the roof hidden. A roof that hides while you're inside (as the workshop's does) shows sky from close up; that is expected.
- **Keep grass out of floors.** Grass grows wherever the mask in `grassMaskTexture()` allows. `solidBoxes` only clears the walls, so add a `g.fillRect` for the whole floor of any new building. Check with the grass setting on **high**, since tests default to `grass: 'off'`.
- **No signs unless asked.** Don't add painted or text signs to buildings, stalls or posts on your own initiative.
- **Scale buildings to the characters.** Make sure players can't walk through props (beams, rubble, rocks): make them solid in `solidBoxes`, or flat enough to walk over. The ruined farmhouse had to be scaled up 1.6x and made solid.
- **Built after start-up.** The town is built before the later parts of the script run, so a builder called from the town setup can't use `const`/`let` values defined further down (temporal dead zone), and a `var` is still `undefined`. Build such things lazily on the first frame (as `buildSilkworks()` and `buildMarket()` are, from `updateSilkworks()`), but paint their paths with the farm's roads at start-up.
- **Never add a light after start-up.** Adding or removing a `THREE.PointLight` makes three.js rebuild every shader, which freezes the game for a moment (this caused the torch lag). Put new light spots in `LIGHT_SPOTS`, where the shared night lights move to the nearest ones, or reuse an existing light. Prefer emissive materials for glows.
- **Keep it cheap to draw.** Many small meshes cause frame drops on phones. For repeated decoration (crop stages and the like), merge the parts with `mergeGeometries` and vertex colours, and share the geometry between copies (see `cropStages`).
- **Battery saver** (`SETTINGS.saver`, on by default on phones): pixel ratio 1, no bloom, 1024 shadows, and the scene is drawn about 30 times a second while something is happening and 15 when all is still (`shouldDraw`, `busyNow`). Game logic still runs every frame, because walking and many animations move a fixed amount per frame. New long-running activities should be added to `busyNow` so they draw smoothly.
- **Place things where the owner asked.** Directions: -z is north (the river), +z is south, +x is east (the farm, the windmill, then the map edge around x = 118). Check the spot is clear before building there, and move NPC or monster homes that a new building would cover.

### NPCs, dialogue and shops

- **Trading is a dialogue option.** A shopkeeper gets `choice: {...}` plus `shop: '<key>'`, and their dialogue menu then starts with "Let's trade.", followed by their `asks` and "Never mind.". Don't add a question at the end of their chat that opens the shop.
- **Shops live in `SHOPS`.** Each has a title, a buy list and a rule for which items it buys. Mara sells tools (axe, pickaxe, hammer, net, fly fishing rod) and buys everything except farm goods. Tilly's farmers' market sells all seeds and farming tools (hoe, watering can) and buys `FARM_GOODS`. New farming items go to Tilly, not Mara, and hint messages must point to the shop that actually sells the item.
- NPCs that stand behind a counter need a small `rad` (they wander within it) and an `s` large enough that the talk spot in front of them is clear of the counter. Shopkeepers inside a building get a `keep` box (the fifth argument of `addNpc`) so they stay in the strip behind their counter, as Mara does.
- **NPC pathing checks their whole body and route.** `pickWanderTarget` only picks spots with room for the villager (`npcHit`, a 0.5 radius) and a clear straight walk there (`npcWayClear`); each step also checks `npcHit`, and a villager already wedged in somewhere can still step out. So **every piece of furniture or prop someone could bump into must be in `solidBoxes`** (in houses, `block()` / `solid()`); anything left out is walked straight through. Seated NPCs (Wenna) sit inside a solid bench on purpose.
- Clicking something the player is already standing beside should act at once, not walk them somewhere first. When walking is needed, go to the nearest free side, never a fixed spot that may be inside a building.
- **NPCs sound like real people, never like a robot or a game manual.** Write every line the way that villager would actually say it out loud:
  - **No game terms.** No skill names with numbers ("Farming 5"), no "XP", "level up", "item", "inventory", "click", "quest step", "requirement" or stat talk. Say it naturally: "You'll want more time in the fields first", "Get a few harvests under your belt", "You look like you could handle yourself now".
  - **No instructions read off a list.** Not "Step 1: till the patch. Step 2: plant the seed." Instead: "Turn the soil over with the hoe, then pop your seed in."
  - **Give them a voice.** Contractions, short sentences, a bit of humour or grumbling, their own opinions, and nods to the other villagers and their lives (Bram's named cabbages, Pip pinching mulberries, Hilde's hens). Match the character: Tilly is chatty and cheerful, Ezra is gruff and weary, Aldric is stern, Brenna is warm and flustered.
  - **Keep it short.** One or two sentences a line, a few lines a conversation. People don't make speeches when you buy turnips.
  - **Read it aloud before shipping.** If it sounds like a tooltip, rewrite it.
  - Exact numbers and requirements belong in the interface (menus, tooltips, toasts, the quest tracker), never in what an NPC says.
- **Check everything on a phone-sized screen** (about 412 wide). Text boxes must wrap (no `white-space:nowrap` on messages) and stay inside the screen with a 16px margin.
- Keep dialogue and warnings short. The owner prefers wording that matches the phone game (Idle Tap Adventure) where there is an equivalent, for example the delve warning.

### Items, the bag and saves

- **Saves must stay compatible.** New save fields get a default when missing (old saves load fine), and items that change shape are converted on load. Examples: food that used to stack is spread into slots, coins move from the bag into the purse (`co`), and plots without a crop load as wheat.
- **Food doesn't stack** (`SINGLE`: raw and cooked food, dough, bread). Burnt food and everything else stacks.
- **Coins are in the purse** (`COINS`, shown at the right of the bag footer), not a bag slot. `addItem`, `removeItem`, `countOf` and `hasItem` handle `'Coins'` specially.
- **The toolbelt** holds one of each skilling tool. Check tools with `hasTool(name)` (bag or belt), never `hasItem`, and add new tool types to `beltSlotFor` and `TOOLBELT_SLOTS`.
- **Never hand items over into a full bag.** `addItem` quietly gives only what fits. Before a quest, reward or NPC gives anything, check there's room (`bagRoomFor`). If there isn't, the NPC says so and nothing moves on. And if a player is on a step without the thing they were given, let the NPC hand it over again.
- **Items on the ground** (`GROUND`, `dropToGround`) work as in RuneScape: monster drops land where the monster fell (never straight into the bag), and dropped items, rewards and anything that doesn't fit go on the ground too. Only the owner sees a pile for the first minute (`GROUND_PRIV`), then everyone up top does. Monster drops last two minutes, everything else three. They're shared at `adventure/live/ground/<key>`, and picking one up is first come, first served: the game takes it in the database first, with an ETag `if-match`. Cellar drops stay private. Each item should have a small 3D model in `groundModel` (no bones on meat); anything without one shows as a cloth bundle.
- **Every new item needs** an icon in `ICON_FOR`, a price in `SELL` if it can be sold, and a shop that buys it.
- **New skills** go in `SKILL_XP`. They show in the skills panel automatically, and old saves start them at level 1.

### Actions, timers and loops

- **Walking away cancels whatever is in hand.** `walkStart` stops the farming chain and the current farming job, but only for a walk the player starts: the game re-planning a stuck route (`replan`) must never cancel anything. Any new timed action (a `setTimeout` that finishes a job) must check it wasn't cancelled before doing anything, and every action with a progress bar must stop when the player walks.
- **One progress bar at a time.** Smelting, cooking, milling, spinning and bandaging share `#smeltBar`, so starting one must stop the others.
- **Never automate a choice the player should make.** The farming loop only waters and harvests by itself; planting always goes through the seed menu.
- **Movement must not depend on frame rate.** Scale per-frame movement by the elapsed time (`dt`), and approach targets with a small tolerance (`d > want + 0.1`), or a mover can creep forever without arriving.
- **Up top, clicking another monster mid-fight doesn't switch targets.** It says "You're already in combat!". Only clicking the ground runs away. The cellar is multi-combat, so there clicking another creature switches to it.

### Combat and skills

- **Melee stands for RuneScape's Attack, Strength and Defence together.** Each point of damage gives **4 Melee XP and 4 Hitpoints XP**, so the two level together, as each RuneScape combat skill does with Hitpoints. Any new XP source keeps that ratio.
- Levels come from `levelOf(xp) = 1 + floor(sqrt(xp / 25))`. Hitpoints starts at level 10 (2025 XP). Combat level is `(Melee × 2 + Hitpoints) / 3`.
- Farm monsters are passive and drop no coins (meat and feathers only). Their stats come from ITAP's farm biome (`MONSTER_TYPES`).
- **Fighting distance depends on the monster's size** (`reachOf`: farmer 3.0, cow 2.8, others 2.3), so a full-sized foe never stands inside the hero's head.

### The Root Cellar delve

- It is a solo instance far off the map (around z = 400). Saves never put the player there; they load at the cellar doors.
- It matches the phone game: dying or fleeing (including the ladder, or closing the game) costs 25% of coins and rolls back all Melee and Hitpoints XP gained in the delve. The XP from before going down is saved as `dv`, so a mid-delve logout is penalised on the next load. After the last wave the player is safe, and the reward chest gives the rewards.
- Waves 5 to 7 pick two random monsters from chicken, rat and cow only. The angry farmers come only as the final pair. It is multi-combat.
- Down there only the boss theme plays, never the ordinary battle theme.
- Unlocking it needs 10 kills of each farm monster (`KILLS`). The reward chest gives +400 Melee, +400 Hitpoints, ores, feathers and seeds, shown on the reward scroll (`showRewardScroll`).

### Parties and the party delve

- Parties live at `adventure/live/parties/<pid>` (`lead`, members `m`, and while delving `dv`, `hits`, `c`), with invites at `parties/_inv/<player id>`; all on the one live feed (`liveFeed('parties')`). Up to 4 players. Presence carries `cb` (combat level) and `pt` (party id).
- Party frames (`renderPartyFrames`) show each member's name, combat level and health; tapping a member with a bandage heals them.
- **Party delve:** whoever opens the cellar with party members nearby leads it. The leader's game runs the waves, targets and movement and shares them in `dv` (`mons`, `wave`, `next` in server time); everyone else's game shows copies (`m.ghost`) and posts its blows to `hits` for the leader to count. Each player's own game rolls the blows of the creatures targeting them. If the leader falls or leaves, the next player still down takes over.
- **Threat:** the leader counts each player's damage on each creature (`threat`, `m.dmgBy`), and a creature goes for whoever has hurt it most, turning only when someone overtakes its target (`topThreat`). Only that target's game rolls its blows; anyone else hitting it is safe.
- Creatures get `1 + 0.6 × (players - 1)` times their health (`m.maxHp`). No per-creature drops in a party; rewards come from the chest.
- Anyone who falls or flees is out for good (their own 25% coins and delve XP penalty). **No carrying:** at the end, a survivor needs damage plus healing of at least half an even share of the party's total, or they get no reward.
- Other players are only visible when you're in the same world (`sameWorld`): both up top, or both in the same party's cellar.

### Screens and messages

- The delve shows a wave counter at the top centre (`updateWaveHud`), which hides the quest tracker while it's up. Long-lived status like this goes in a small fixed panel, not repeated toasts.
- Toasts wrap and stay up longer for longer messages; anything longer than a line should still be short enough to read in a few seconds.

### Quests

- **Each quest is a number in `QUEST`** (for example `QUEST.hw` for A Hearty Welcome, `QUEST.rt` for Roots and Threads), saved with the rest of the save, so old saves start at 0.
- An NPC's quest lines come from `questTalk(name)` before their normal chat; return `null` when they have nothing to say for this step, so their usual chat and "Let's trade." stay available.
- Steps the player completes by doing something (planting, harvesting, spinning) move on with a one-line `rtAdvance(from, to, text)`-style call at that action. Steps that are a conversation move on in the dialogue's `run()`.
- Give tools only if the player has none in the bag or on the toolbelt (`giveFarmTool`), check bag room first, and replace anything a player lost on a step.
- The tracker (`updateQuest`), the quests tab and the "!" marker all need the new quest added. The completion screen reuses the quest scroll through `showRewardScroll`; `restoreQuestScroll` puts the welcome quest's own text back.

### The map and the water

- **Where things are** (world units; the ground runs from -120 to 120 each way, with black void beyond): the spawn hall at (16, 2), the bonfire clearing with the barracks south-west of it, the quarry at (12, 72), Fenwick's shrimp spot at (-36, -13.4), the woods around x = -90 to -100, Mara's store at (-75, 52), the trout pond at (-84, 85), the farm at x 30 to 62 by z -13 to 14, the fields and workshop further east (to about x = 112), and the ruined farm and cellar doors at x 60 to 110 by z 35 to 82. To get your bearings, render a top-down map: an `OrthographicCamera` at y = 200 looking down, with `scene.fog` off and the clouds (meshes above y = 15) hidden.
- **All the water comes from one function, `waterSD(x, z)`**: how far a point is from the water's edge, below 0 in the water. It combines the winding river (`riverSouth`, `riverWidth`), the stream (`STREAM`, a smooth line, `STREAM_W` half-wide) and the pond (`POND`, `pondR`). The ground's dips and banks, the bank colours, the grass mask, the solid water boxes, the reeds and the path decorations all follow it. To reshape water, change these and everything follows.
- The water surface is one mesh (`river`, kept out of shadow casting) made of the sheets in `WATER_RECTS`, at `WATER_Y` (-0.3). Near the water, dry ground never dips below -0.05, so the surface can't show through the land. Anything that floats (fishing rings, lily pads) goes at `WATER_Y` plus a little.
- **The river's walkable south bank is fixed at z = -11.1** (the long solid box), and its water edge never comes closer than about -11.7. The stream and pond are solid as half-unit strips reaching 0.4 past the edge. `blocked()` keeps a body 1 unit from any box, so a fishing spot must sit about 1.1 inside the edge for its stand spots (2.4 × `s` away) to be free. Check this with `blocked()` when adding one.
- Bank dressing (`buildWaterside`) is one merged vertex-coloured mesh: reeds, stones, lily pads. It keeps the shrimp spot, Fenwick's jetty and the pond's east bank (the trout spots) clear.

### What's in the game (so you don't rebuild it)

- **Fishing and cooking:** `FISHES` holds each spot's catch (shrimp in the river with the net; trout in the pond at Fishing 15 with the fly fishing rod and feathers as bait), and `addFishSpot(x, z, fish)` makes a spot. `COOKS` holds what each raw food becomes, its XP and its level (`lvl`, trout 15). `nextToCook` skips food you're too low to cook, `nothingToCookMsg` says why, and burning eases off as you pass the food's level. Trout follow ITAP: Fishing 15 (25 XP, ITAP's 45 scaled like shrimp), Cooking 15 (40 XP), heals 6.
- **Click marker:** every tap or click on the game screen shows a cross (`clickMark(x, y, act)`), yellow for a walk and red for an action (a node, NPC, monster or door). It's a single page element, not a 3D object. Any new way of clicking things in the world should call it too.

- **Guards:** Osric and Bertram keep the day watch, Edda and Godwin the night watch (`GUARD_SHIFT`, `GUARD_EVENTS`). They sleep on the top decks of the barracks bunks, eat at the mess table, and walk routes worked out once at start-up between their post and the barracks (`guardRoutes`). Sleeping guards can't be talked to ("… is fast asleep.") and don't call out.
- **Villagers' days** (`VILLAGER_DAY`): Tobin chops in the woods, Ysolde fishes at the river (with a rod: `fishPose`) and visits the pond and the market, Dunmore works the forge all day; all three sit at the bonfire in the evening and sleep at home (in their bed if the house has one). Their routes are worked out once with every house door open (`villagerRoute`), and they open shut doors on their way (`openDoorQuiet`). Brenna and Mara stay home.
- **The barracks** (`buildBarracks`), south-west of the bonfire, with the jail and Rennick in the middle cell. The cells are solid and can't be opened.
- **Farming:** patches east of the farm, the seed menu (`SEEDS`, `CROPS`: wheat, aloe at Farming 3, mulberry at 5), the windmill (flour), the trough, and crafting bread dough.
- **Silk:** the workshop next to Tilly's market holds the silkworm hutch (mulberry leaves to cocoons, with a ready bubble) and the spinning wheel (cocoons to silk thread). Silk thread and aloe make **bandages** (Crafting).
- **Shops:** Mara (tools) and Tilly (seeds, farming tools, farm goods). The anvil makes 1 / 5 / X / All at a time.
- **Multiplayer:** shared monsters, other players' fights and health bars, healing other players, trading, the bonfire night and raid, gravestones.

### Shared monsters (multiplayer)

- Farm monsters have a shared id (`m.sid`, in spawn order). Each game works out their wandering with `mobPath()` from a seeded random and the server clock (`SNOW()`). So spawn order, homes and everything solid near them must be identical for every player; nothing random or local may change them.
- Only fights go through the database, at `adventure/live/mobs/<sid>`: the fighter (with a heartbeat), health, position, each blow, and dead-until. It is single combat ("Someone else is fighting that."). Anything shown to other players (fight status, poses) must carry the monster's `sid`.
- **Database rules:** a new database path needs a rule in `database.rules.json`, and the owner has to paste the rules into the Firebase console and publish them. Say so whenever the rules change, and give the full rules to paste. Compare with the owner's current console rules first, so nothing of theirs is lost.
- **When a missing rule is harmless:** a brand-new path with no rule just has its writes refused (the feature stays off) and nothing else breaks, so merging before the rule is published is fine. Moving existing data to new paths is not: publish rules with old and new sections first.
- **Roll database changes out in the right order.** Rules with no entry for a path refuse every write to it. When code moves to new paths, give the owner rules that keep the old sections **and** add the new ones, wait until they say they've published, and only then merge. Old sections can be removed later, once everyone has refreshed.
- **Watch for side effects of a rule.** Publishing a rule can switch on code that was quietly failing before (the heals stream only connected, and broke everything, once its rule existed). Test the code as it will run *with* the rules published.

### Healing other players

- Clicking a bandage opens **Heal / Heal other**. Heal other lists hurt players within 14 units (their health comes from presence, `hp: [cur, max]`). Picking one heals on the spot if they're within 4 units, otherwise you walk up first; aim at their real position (`r.tx/r.tz`), not their sliding figure.
- The heal is sent as a note to `adventure/live/mobs/_heals/<their id>` (capped at 12 by the receiver); it rides on the monsters' stream, and their game fetches, applies and deletes it.

### One live feed

- Everything shared live sits under `adventure/live/` (players, nodes, event, graves, mobs), and the game keeps **exactly one** stream open on it (`startLive`). Each part subscribes with `liveFeed('<part>')`, which behaves like its own `EventSource` (put/patch events with paths relative to that part).
- Browsers allow only about six connections to the database; a second stream starves saves, presence and logout. New live data goes in a new folder under `adventure/live/` with `liveFeed`, never a new `EventSource`. Saves (`adventure/saves`) stay outside `live`, since nobody needs them streamed.

### Sound and music

- **Drafting a new sound:** build it with Web Audio in a blank page, render it with an `OfflineAudioContext` to a WAV, and send the file for the owner to listen to before putting it in the game (you can't hear it yourself). Keep it soft: no rising pitch into high frequencies, sparkles and chimes around 500 to 1300 Hz, quiet overall. Time it to the action it goes with (the bandage sound stretches to `BANDAGE_MS`), and make it stoppable when the action is cancelled.
- Sound effects are made in code (`sfx`, `nz`, oscillators). An audio file the owner gives you for a sound effect is embedded as base64 and decoded once through Web Audio (see `EAT_MP3`); don't make the browser fetch it.
- **Sounds from elsewhere fade with distance.** Any sound caused by another player or happening away from the hero (their rocks and trees, their fights, raid goblins) must be played through `soundAt(x, z, () => ...)`: full volume within 8 units, silent beyond 40. Only your own actions play at full volume everywhere.
- Music levels: the battle theme plays at 30% of the music setting, the boss theme at 80%.
- Headless tests have no audio, so say when a sound hasn't been heard.

## Testing

- **Never join the live game from a test.** ITAP Adventure and the arcade leaderboards talk to a real Firebase database that players use. Any headless-browser test must call `offlineDb(page)` from `tools/offline-db.js` before `page.goto`, so every database request is answered locally with an empty village. Don't test against the published site (kaiserfi.github.io) with a login either; serve the repo locally (`python3 -m http.server`) and use the helper.
- When a test also intercepts the page itself (to inject test hooks), match **only** the local page URL (e.g. a regex for `http://localhost:8123/adventure/` and its query string). A broad glob such as `**/adventure/**` also matches the database's `/adventure/...` paths, and a route registered after `offlineDb` wins, sending real requests to the live game. `offlineDb` now exits the test if a live database response ever comes back.
- Never call `page.unrouteAll()` or `page.unroute()` while a game page is open: the game keeps sending presence updates and a save when it closes. `offlineDb` also routes the whole browser context now, but close the context instead of removing routes.
- **Multiplayer tests** use `FakeDb` from `tools/fake-db.js`, with one browser context per player, so the players share data without touching the live database.
- **Test hooks run inside the game module.** Game internals aren't on `window`, so put helper functions in code injected after `bootOnline();\nframe();` and call them through `window.__t`. Don't write a literal line break inside a string in injected code (it breaks the whole page), and don't give two helpers the same name (the later one silently wins).
- **Headless runs at only a few frames per second.** Walking and wandering are slow there, so teleport the hero next to things for checks, and allow long waits.
- **Render pictures with a separate camera** (`renderer.render(scene, cam)` then `toDataURL`) to look at an object up close; the game camera follows the hero.
- **Start the local server again in every new session** (`python3 -m http.server 8123` from the repo root). The container is fresh, and a test against a dead server fails with an unhelpful error.
- **Short CSS animations are often over before a screenshot is taken in headless runs.** Pause them first (`style.animationPlayState = 'paused'`), or check the element's class and style instead.
- Check the script parses before testing: extract the module script and run `node --check` on it.
- **Testing traps that wasted time:**
  - Logout navigates to the arcade page, so check `page.url()` after waiting for the navigation, not for the name box.
  - Wrapping a game function from `page.evaluate` runs outside the game's scope, so game variables look "not defined" there; put the wrapper in the injected hook instead.
  - `Object.values(remote)[0]` isn't always the player you mean; look them up by name.
  - The first presence write can overwrite an early test change (for example a player hurt before joining finished); wait until the other player actually sees the change.
  - `FakeDb` leaves an empty `{}` behind after a delete; real Firebase removes empty nodes.
  - A headless walk of a couple of units takes several seconds, and clicks land on the canvas unless they hit a menu; check where `elementFromPoint` lands before blaming the code.
- When the owner says they'll test something themselves, stop your own test of it.

## Workflow

- Develop on the session's branch, then open a pull request and squash-merge it into `main` without asking. Say what changed in the PR, and note anything the owner must do by hand, such as publishing database rules.
- **Always start a change from the latest `main`** (`git fetch origin && git checkout -B <branch> origin/main`). A PR built on an older copy silently undoes everything merged since: #116 wiped out the click marker from #114 this way. Before merging, read the PR's diff for removed lines you didn't mean to remove.
- After a squash merge the branch's remote copy still holds the old commits. Merge it with `-s ours` (your copy already contains them) before pushing, rather than force-pushing.
- Report honestly what was tested and what wasn't (sounds, timers skipped in tests, untested paths).
- **Don't merge anything that breaks the live game.** If a merge depends on the owner doing something first (publishing rules), say so and wait for them.
- When the owner reports a live bug, stop other work, find the cause, and fix it first; hold back unrelated changes until the fix is in.
