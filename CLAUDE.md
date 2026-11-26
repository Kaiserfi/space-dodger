# Project notes

## ITAP Adventure (`adventure/src/`, built into `adventure/index.html`)

The game is one three.js module script, kept as **source pieces in `adventure/src/`** and joined by `node tools/build-adventure.js` into **`adventure/index.html`**, the page players load (GitHub Pages serves it straight from `main`). Players share a live Firebase Realtime Database, so treat every change as going straight to real players.

### Editing the game: the source files and the build

- **Edit `adventure/src/`, never `adventure/index.html`.** Then run `node tools/build-adventure.js` and commit both the source files and the rebuilt `index.html`. A check on every push and pull request (`.github/workflows/adventure-build.yml`, which runs `node tools/build-adventure.js --check`) fails if `index.html` doesn't match its sources.
- **The pieces:**
  - `adventure/src/page.html`: the page around the game (head, the panels' markup, the import map), with the marker lines `/*@@style.css@@*/` and `//@@js@@`.
  - `adventure/src/style.css`: the page's styles.
  - `adventure/src/js/NNN-name.js`: the game script, joined in file-name order.
- **It is still one module with one shared scope.** A name defined in one file can be used in any other, and order matters exactly as before: start-up code runs file by file, so a builder can't use a `const`/`let` from a later file at start-up (temporal dead zone). The pieces were cut from the old single file without changing a byte, so the order is the old file's order.
- **Every build checks** that the script parses (errors point at `adventure/src/js/<file>:<line>`) and that no top-level name is defined twice, in one file or across two. It doesn't see a clash hidden in an inner scope, or the second name in a comma list (`const a = 1, b = 2`), though a same-level clash still fails the parse check.
- **A new piece** gets a number between its neighbours (for example `175-...` between `170` and `180`), at the point in the order where it must run.
- **When git reports a conflict in `index.html`**, don't resolve it by hand: resolve the source files, then rebuild.
- **Tests are unchanged:** they serve the built `adventure/index.html` and inject their hooks at `bootOnline();\nframe();` (the last lines of `990-join-and-boot.js`). Rebuild before running a test.
- **Where things are** (each file is a stretch of the old file, so some hold more than their name says):

| File | What's in it |
|---|---|
| `010-setup-looks-renderer` | imports, the creator's `LOOK` options, renderer, scene, camera, `LIGHT_SPOTS` |
| `020-ground-river-north` | the ground, the river and stream, the north (`NORTH`, `hillH`, `northOut`) |
| `030-buildings-nature-textures` | houses, nature props, textures drawn in code |
| `040-hall-daynight-facelift` | the stone hall, day and night (`hourNow`, sky, lights), the hall's facelift |
| `050-doors-pathfinding-trees-sound` | doors and walls, `findPath`, `walkStart`, `makeTree`, `sfx` and `soundAt` |
| `060-skilling-chop-mine-smelt-cook` | skilling sounds, chopping, mining, smelting, cooking, eating (`EAT_MP3`) |
| `070-smithing-mara-gear-tab` | the anvil, `SHOPS` and Mara's shop, Jory's fish stock, `equip`, the gear tab |
| `080-music-talking-quests` | village music, the talk panel, quests (`QUEST`, `questTalk`) |
| `090-conversations-chat-rock-smash` | the dialogue box, chat, the rock smash |
| `100-ore-rocks-chibi-base` | ore rocks, `toonMat`, `chibiPart` |
| `110-chibi-looks-faces-cape` | `chibiExtras`, `CHIBI_SHELLS`, `chibiTexMat`, `chibiFace`, `makeChibi`, the emblem and cape |
| `120-chibi-gear-daggers-poses` | `dressChibi`, elbows and the pair of daggers, fight faces, `poseChibi` |
| `130-creator-walking-camera-stats` | the character creator, walking and the click marker, camera, the Stats tab |
| `140-bag-icons-items-toolbelt` | the bag (`addItem`), item icons, `ITEMS`, `RECIPES`, food, the toolbelt |
| `150-barracks-fishing-shack-north-bridge` | the barracks and jail, Jory's shack, the north's bridge and trees |
| `160-village` | the village layout, the villagers' lines, `FISHES` |
| `170-paths-guards` | the paths, the guards' schedules |
| `180-villagers-day` | `VILLAGER_DAY`, villager routes, `addNpc`, `fishPose` |
| `190-farm-grass-combat-intro` | the farm, the grass (`grassMaskTexture`), the start of combat |
| `200-monsters-fights-combat-sounds` | `MONSTER_TYPES`, animal models, `fightPose`, fights (`playerSwing`, `landBlow`, `hitsplat`), combat sounds |
| `210-villager-chat-ruined-farm` | villagers' remarks and `tableTalk`, the ruined farm |
| `220-root-cellar-delve` | the Root Cellar delve, `showRewardScroll` |
| `230-bonfire-clearing-walls-fold` | the bonfire clearing, walls folding while inside, start |
| `240-online-signin-presence-players` | sign-in (`signIn`), saves (`saveNow`, `applySave`), presence, other players |
| `250-battery-saver-main-loop-torch-fires` | battery saver, the main loop (`frame`), the torch, fires |
| `260-ground-items` | items on the ground (`GROUND`) |
| `270-farming-pens-crops` | farming, the pens, crops |
| `280-parties-party-delve` | parties, party frames, the party delve |
| `290-market-silkworks` | Tilly's market, the silkworks |
| `300-village-dressing` | the green, farm and woods dressing, river life |
| `310-spinning-bandages-milling` | spinning, bandages, milling and dough |
| `320-trading` | player menus and trading |
| `330-bonfire-night-database-phrase` | the bonfire night's setup; **all the database code**: the one live feed (`startLive`, `liveFeed`), shared monsters (`mobPath`); the secret phrase |
| `340-bonfire-night-people-fire-raid` | the night's villagers, the fire, sitting, goblins, graves, the host |
| `350-bonfire-night-each-frame` | the bonfire night's each-frame update |
| `990-join-and-boot` | the join button, `bootOnline(); frame();` |

  Find a name with `grep -n "name" adventure/src/js/*.js`.

It is a RuneScape-style village game based on the owner's phone game, **Idle Tap Adventure (ITAP)**. When a feature exists in ITAP (monsters, delves, warnings, balance), match it: its code is in the `Kaiserfi/idletapadventure` repo (for example `www/js/combat.js` for challenge-mode delves and their wording). When it doesn't, follow how RuneScape does it, adapted to our simpler skills.

### Before you build

- **Ask only when the choice changes what gets built** (single or multi-combat, private or shared ground items). Otherwise pick the sensible default, say which, and go.
- **"Show me" means a mock-up, not a change.** When the owner asks what something would look like, render it with test hooks and send pictures, without changing the game. Offer to build it afterwards.
- **Search before adding a name.** All the pieces share one scope: check a new function or `const` name isn't already taken (`roomFor`, `roof` and `SNOW` all clashed once) with `grep -n "name" adventure/src/js/*.js`. The build catches a clash at the top level, but not one hidden in an inner scope.
- **Ask before placing a new building.** Show the owner a top-down map with the candidate spots marked first (render the whole map with an orthographic camera looking straight down, fog off, and draw a labelled grid on it with PIL), then a mock-up of the building, and only build once they've approved both.
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
- **Looks:** the creator rows come from `LOOK`; a row with `only: 'female'` shows for that build, and `dress: true` rows only while an outfit is on (`lookRowShown`). Extra hair, the dresses (`outfit`, `dressCol`, `trimCol`) and the flower crown (`acc`) are built in `chibiExtras`. Hair styles in `CHIBI_SHELLS` are cut into a skull-shaped shell instead of the round cap. Hair gets painted strands and clothes get linen, twill or leather (`chibiTexMat`, one shared greyscale texture per kind, tinted by colour). Face options (`brows`, `eyeShape`, `mouth`, `nose`, `freckles`, cheeks `lines`) are flat shapes on the skin, drawn by `chibiFace`; Happy and Wink take eyes out of `c.eyes` so blinking can't bring them back. Everyone gets the soft face shading. Other players' looks are filled from `LOOK_PLAIN`, never from your own look, so a player whose game doesn't send a field shows plain.
- **The pair of daggers** (`Bronze daggers`, `Iron daggers`, `twoHand: true`) fills both hand slots: equipping it takes the shield (or torch) off, and a shield takes the pair off. One bar makes a pair; old single daggers convert on load and on pick-up (`OLD_DAGGERS`). An attack is two stabs, right then left, over `DUAL_MS`, each rolled on its own at `DUAL_HITS` with `DUAL_MULT` (55%) of a sword's max hit (`landBlow`).
- **Elbows** exist only on a figure holding the pair (`chibiElbows`): the arm splits 0.22 below the shoulder, and the hand, blade and anything worn low on the arm move into the forearm. Every other pose keeps the one-piece arm. The lunge stab (`dualLunge`) keeps the boots on the ground by measuring them (`dualSettle`); blades stay at least 0.26 clear of the head, and the block tips the left blade away (`DUAL_BLOCK`).
- **Fighting faces** (`setFightFace`, built once by `buildFightFaces`): players (`c.fightFaces`, the hero and other players' figures, not monsters) show a hard stare in a fight, a shout around each blow, and a wince when hit or falling (the brows drop to squeeze the shut eyes). They hide the creator's brows, eye shapes and mouth (`c.face.parts`) and come back a second after the fight. Narrowed eyes keep blinking through `c.squash`; shut eyes stay shut (`c.shut`). The bow's aiming squint and breath-out are drafted for when archery is built.
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

### Daily routines and chats

- **Everyone who keeps a timetable is driven by the clock, not by local wandering:** guards (`GUARD_SHIFT`, `GUARD_EVENTS`, `guardState`) and villagers (`VILLAGER_DAY`, `villagerState`). An event is `[hour, where, what]`. Where they are comes from `hourNow()` plus the distance along a route at `GUARD_SPEED`, so every player sees the same thing without sending anything. Movement catches up with `dt`, and any real movement plays the walk (`step > 0.2 * dt`), or they glide.
- **Routes are worked out once and kept** (`guardRoutes`, `villagerRoute`) with `findPath`. They must be the same for everyone, so compute them with every house door treated as open (doors are local, see below), never from anything a player can change.
- **Quest givers and shopkeepers stay where players expect them** (Aldric, Brenna, Tilly, Mara, and Dunmore at the forge in the daytime).
- **Poses for routines:** sitting reuses Wenna's legs (`legs.rotation.x = -1.45`) or `sitPoseAt` on a bonfire seat. A villager on a seat marks it in `VSEAT_TAKEN` so players can't sit on them. Chopping is `poseChibi(sp, 'swing', t, 'axe')`; fishing is `fishPose` (a rod in the right hand, the line kept vertical in world space).
- **Lying down:** a chibi's head is far bigger than its body, so lying flat it is about 2.3 tall and the legs float. Tilt it (`rotation.x = -π/2 + 0.3`), then measure the visible parts only (`traverseVisible`, since the hidden tools hang lower and `Box3.setFromObject` counts invisible meshes) and set its height so the lowest point rests on the mattress. Guards sleep on the top bunks because there's no room under them. Shut the eyes (`eyes`: scale the white, hide the shine) and show the shared Zs (`zzzMat()`).
- **Sleeping NPCs can't be talked to** (`rec.asleep`: "… is fast asleep.") and don't call out.
- **Chats between NPCs sat together** (`tableTalk`, `TALK_AT`): each place (`rec.chatAt`: the mess table, the bonfire) runs its own exchange, line by line in their bubbles, and sitters don't call out. `TABLE_TALK` lines go to roles (0, 1) for any two guards; `BONFIRE_TALK` lines go to people by name and are only picked when they're all there. Write them in each character's voice.
- **Doors are local to each player** (`toggleDoor`). Villagers open them quietly as they pass (`openDoorQuiet`). Syncing doors would need a new `live/doors` path and rule.

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

### Planned: Fletching and Archery (agreed with the owner, not built yet)

- **Order:** Fletching first (bowstrings spun from silk thread, shafts from logs, arrowtips at the anvil, 15 per bar as in ITAP, a feather per arrow, bows from logs and oak logs), then Archery.
- **Match ITAP:** an ammo slot, one arrow per shot ("You have run out of arrows!"), Accurate / Rapid / Longrange styles, ITAP's archery damage formula and bow bonuses, a two-handed bow (no shield). Combat level uses the higher of Melee and Archery.
- **The shot:** a draw pose (bow in the left hand pointing at the target, the right hand pulled back under the chin, the string drawn from the bow tips to the hand), hit and damage rolled at release and applied when the arrow lands (flight about 0.35 s at 7 units). One pooled, merged arrow mesh flies a gentle arc, about 1.6x life size so it reads from the game camera. A hit sticks where the shot meets the body (raycast) and fades; a miss sticks in the ground beside it. About 80% of arrows drop at the monster's feet as a ground pile. The mock-ups are in the session history; check the arrow size from the real game camera.
- **Sounds** are in `tools/sound-drafts/archery.html` (see Sound and music). The flight is silent.
- **Range and line of sight:** shoot from about 7 units (10 on Longrange). Solid boxes have no height, so mark low ones (fences, troughs, hay bales, low rocks, pen walls) `low: true`: they block walking but not arrows. Tall ones (walls, trees, buildings, hills) block the shot, and the hero steps to the nearest spot with a clear line.
- **Safespotting is allowed up top**, as in RuneScape: in a fight a monster walks straight at you (as `chaseStep` does) and only hits once it's within reach, so a fence can hold it off. Shooting into the farm pens is fine.
- **Never in delves:** in the Root Cellar and any future challenge delve, nothing may stop a creature reaching its target. Creatures there route round obstacles (`findPath`), and delve arenas stay free of anything that makes a safespot.
- **Party roles:** archers, melee and bandage healers should work together in a party delve. Keep the existing threat system and add: melee hits count 1.5x towards threat (so a fighter holds creatures), and healing adds 0.5 threat per point healed on each creature attacking the healed player. Tune both in play. Arrows, swings and heals all go through `partyFx`; the no-carrying rule already counts damage plus healing.

### Planned: the Molten Hound (mock-up approved by the owner, not in the game yet)

A 3D version of ITAP's molten hound sprite. The approved look is `tools/mockups/molten-hound.jpg`. The code is a test hook, not game code:

- **Files:** `tools/mockups/molten-hound-hook.js` holds `makeHound()`; `molten-hound.js` renders it (studio views on a plain background, then beside the hero by day and night); `molten-hound-anim.js` renders the poses as frames. Serve the repo on 8123 and run with `OUT=<scratch folder>`. They use `offlineDb` and never change the game.
- **Size:** about 7.2 long and 4.3 tall with the mane (the hero is 3.95), facing +z like the other animals.
- **Body:** a chunky build (the owner turned down a slimmer one): a chest sphere, a waist cylinder and a hip sphere, with rock spikes (flattened 4-sided cones) on the shoulders and spine. `limb(parent, a, b, r1, r2, mat)` puts a tapered cylinder between two points.
- **The cracks are one 3D pattern, not a texture.** `ROCK` is a single `MeshToonMaterial` whose shader (`onBeforeCompile`) draws 3D Voronoi cells in the hound's own space: the gap between the two nearest cell points is a seam, about 70% of seams are molten (yellow core, orange edge, a red halo) and the rest are cold dark cracks; each plate gets its own grey and a lighter top edge. Every rock mesh carries a `rest` attribute (each vertex's place on the standing hound, set once after building), so seams run unbroken from part to part and stay pinned to a limb as it moves. `uFire` pulses the glow. Don't go back to a UV texture per part: seams stopped at every join and smeared at the sphere poles.
- **Fire:** `flameGeo` is a bent teardrop (a lathe) with vertex colours from yellow root to red tip, drawn with an unlit `MeshBasicMaterial` with `toneMapped: false` (tone mapping washed the yellow out). Flames make the mane (head to mid-back), a neck ruff, cheek tufts, elbow and hock tufts, and the tail (nine chained segments that curl up). `tick(now)` flickers them and sways the tail; `userData.fire` scales all the fire and the glow (it drops to 0.15 as he dies).
- **Head:** carved from flat planes with `ConvexGeometry` (`hull(points)`, mirrored in x): a skull whose brow ridge is part of the bone and overhangs the eyes, a short deep muzzle, a small flat nose, a jaw, and tall pointed ears swept back. Eyes are small glowing slits under the brow. The mouth is lit inside (roof, tongue, throat) with cream fangs and a row of teeth.
- **Legs:** shoulder and hip groups (`FL`, `HL`) with a second group at the elbow and stifle (`FK`, `HK`), so paws lift in the walk. All four feet use the same `paw()`: a plain dark pad, four knuckles, four claws, glowing lines between the toes.
- **Poses:** `userData.pose(mode, k, now)` in the same shape as the other animals: `idle`, `walk` (diagonal pairs), `ready`, `swing` (sink back, spring, snap), `hurt`, `block`, `dead` (keels over, the fire goes out).
- **What the owner turned down:** blocks over the eyes for brows, glowing rings at the ankles, paws that differ from each other, sabre fangs, glowing dashes on the snout, a ball head with a tube snout ("derpy"), and the slim body.
- **Before it goes in the game:**
  - Ask the owner where it lives, and take its stats from ITAP's code.
  - Merge the parts (it is about 250 meshes now) into a few meshes per moving group, as `cropStages` and the barracks do.
  - Check the crack shader's cost on a phone (27 cell look-ups a pixel); bake it into vertex colours or a texture if it's slow.
  - Give it no light of its own: use `LIGHT_SPOTS` or the emissive glow.
  - `ConvexGeometry` comes from `three/addons/geometries/ConvexGeometry.js`; import it at the top of the game module or bake the head's triangles.
  - The pose clips were only checked as still frames, with the older head. Check them in motion.

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
- **Leader handover:** the leader writes a heartbeat (`dv.hb`) with every share. If it goes quiet for 6 seconds (a hidden tab), the next player down takes over. The leader keeps its own wave and timer (`DELVE.hw`, `DELVE.hn`) and resends them with every share, so one lost write can't stall the waves. Everyone gets the wave messages.
- **Every blow is shared** at `parties/<pid>/fx/<id>` (`partyFx`, `partyFxApply`): swings, hits, blocks and misses, theirs and the creatures'. Fight status for a cellar creature carries its spawn tag (`fightAct(m)`: `m` for a farm monster's `sid`, `d` for a party creature's `sp`).
- Creatures face whoever they're after (`faceTargets`). Only party members who've unlocked the cellar are asked down (presence `dl`).
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

### What's in the game (so you don't rebuild it)

- **Guards:** Osric and Bertram keep the day watch, Edda and Godwin the night watch (`GUARD_SHIFT`, `GUARD_EVENTS`). They sleep on the top decks of the barracks bunks, eat at the mess table, and walk routes worked out once at start-up between their post and the barracks (`guardRoutes`). Sleeping guards can't be talked to ("… is fast asleep.") and don't call out.
- **Villagers' days** (`VILLAGER_DAY`): Tobin chops in the woods, Ysolde fishes at the river (with a rod: `fishPose`) and visits the pond and the market, Dunmore works the forge all day; all three sit at the bonfire in the evening and sleep at home (in their bed if the house has one). Their routes are worked out once with every house door open (`villagerRoute`), and they open shut doors on their way (`openDoorQuiet`). Brenna and Mara stay home.
- **The barracks** (`buildBarracks`, `BARRACKS`: x -50..-26, z 60..84, with the jail wing x -26..-12, z 64..82), south-west of the bonfire, with the jail and Rennick in the middle cell. The cells are solid and can't be opened. Its static parts are merged into one mesh per material (`put`/`box` into bins, then `mergeGeometries`), which is the pattern to copy for any big building. The ground under it is flattened in the terrain loop, and both roofs lift while you're inside (`updateBarracks`).
- **ITAP has no houses, land or animal husbandry.** The owner wants anything like that to be ITAP-unique, not RuneScape's portals and instanced houses.
- **Fishing:** shrimp with the net at the river, trout with the fly fishing rod (Mara) and a feather per catch at the pond (`FISHES`: `tool`, `bait`, Fishing 15 as in ITAP). Each fill of the bar is a roll: 47% at the fish's level, +2% a level, at most 90%. Misses are silent, as in RuneScape.
- **Farming:** patches east of the farm, the seed menu (`SEEDS`, `CROPS`: wheat, aloe at Farming 3, mulberry at 5), the windmill (flour), the trough, and crafting bread dough.
- **Silk:** the workshop next to Tilly's market holds the silkworm hutch (mulberry leaves to cocoons, with a ready bubble) and the spinning wheel (cocoons to silk thread). Silk thread and aloe make **bandages** (Crafting).
- **Shops:** Mara (tools) and Tilly (seeds, farming tools, farm goods). The anvil makes 1 / 5 / X / All at a time.
- **Multiplayer:** shared monsters, other players' fights and health bars, healing other players, trading, the bonfire night and raid, gravestones.

### Shared monsters (multiplayer)

- Farm monsters have a shared id (`m.sid`, in spawn order). Each game works out their wandering with `mobPath()` from a seeded random and the server clock (`SNOW()`). So spawn order, homes and everything solid near them must be identical for every player; nothing random or local may change them.
- A kill sends the killing blow (`hp: 0`) and the death note (`hp: null, dead`) as two patches, and they can land in either order. So never trust a stored health of 0, or a blow timed before `dead` (`mobUpdate`), or monsters respawn at 0 health.
- Only fights go through the database, at `adventure/live/mobs/<sid>`: the fighter (with a heartbeat), health, position, each blow, and dead-until. It is single combat ("Someone else is fighting that."). Anything shown to other players (fight status, poses) must carry the monster's `sid`.
- **Database rules:** a new database path needs a rule in `database.rules.json`, and the owner has to paste the rules into the Firebase console and publish them. Say so whenever the rules change, and give the full rules to paste. Compare with the owner's current console rules first, so nothing of theirs is lost.
- **When a missing rule is harmless:** a brand-new path with no rule just has its writes refused (the feature stays off) and nothing else breaks, so merging before the rule is published is fine. Moving existing data to new paths is not: publish rules with old and new sections first.
- **Roll database changes out in the right order.** Rules with no entry for a path refuse every write to it. When code moves to new paths, give the owner rules that keep the old sections **and** add the new ones, wait until they say they've published, and only then merge. Old sections can be removed later, once everyone has refreshed.
- **Watch for side effects of a rule.** Publishing a rule can switch on code that was quietly failing before (the heals stream only connected, and broke everything, once its rule existed). Test the code as it will run *with* the rules published.

### Sign-in and database rules

- **Every browser signs in anonymously** to Firebase Auth through the REST API (`signIn`, `FB_KEY` is the project's public web key). The refresh token is in `itapAuth` and renewed every 45 minutes, and the live stream reopens with the new token (also on `auth_revoked`). A `fetch` wrapper adds `?auth=` to every database request, and `ONLINE.id` is the account's uid.
- **Old saves move once:** the first load claims `adventure/claimed/<old id>` (write-once) and copies `saves/<old id>` to `saves/<uid>`. If that fails, the player keeps the old id for that session and it tries again (`itapOld`).
- **Rules rollout:** `database.rules.json` is what's published now: the owner's console rules plus `claimed` and `ground`. The console still has old top-level copies of players, nodes, event, graves and mobs, so keep them in any rules you hand over. `database.rules.next.json` is the strict step: only your own account writes your save, presence and grave; everything else needs a sign-in. It's not published yet; check with the owner before telling them to publish it.
- Anything deeper (stopping players editing their own save or one-shotting monsters) needs a server: Cloud Functions on the Blaze plan, checking actions instead of trusting the browser. That's discussed but not started; shops and coins would go first.

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
- **Approved drafts waiting for their feature** live in `tools/sound-drafts/`. `archery.html` holds the bow: the draw creak, the release "thwip" (raised 30%), a "thock" for a hit and a soft ground thud for a miss. The arrow's flight is silent (the owner removed the whistle).
- Music levels: the battle theme plays at 30% of the music setting, the boss theme at 80%.
- Headless tests have no audio, so say when a sound hasn't been heard.

### Added in the north and fishing update (so you don't rebuild it)

- **The north** (`NORTH`, across the river): reached only by the bridge at x -10. The river's solid strip has a gap there, and the whole river is now solid. It's a flat meadow at height 0 (everyone walks at 0) rising to solid hills on the north, west and east (`hillH`, `northOut`, strips of solid boxes), with solid knolls inside. A stream leaves the river at x 45 for a big lake (`NORTH.pool`, 56 by 32, with an island) that has trout spots on its south-west bank (`lakeShore`). Iron rocks sit in the north-west. The path painter only covers the village, so the north's tracks are tinted into the ground's vertex colours (`NORTH_PATHS`). The north does have grass: the grass mask (`GM`, `grassMaskTexture`) used to stop at z -20, so the north grew grass in north-south strips copied from that edge row, even over the lake. The mask now reaches z -112: the edge row is still copied north (so the meadow keeps its old strips), and the lake, the stream and their banks are cut out. Anything new in the north that grass shouldn't grow through needs painting into the mask too. New monsters spawn **after** the farm's, so existing shared ids never move.
- **Aggressive monsters** (`aggro: true`; the north's `hillRat`, level 6, and `caveRat`, level 9). They notice you within 6 units (`AGGRO_RANGE`), **but only if your combat level is at most twice their level plus one**; they ignore stronger players. They run at you (`chaseStep`) and start the fight themselves. They never leave their own ground, and once you run off they leave you alone for 10 s (`AGGRO_COOL`). A type can borrow another's model (`model: 'rat'`) and be scaled (`scale`).
- **Fishing:**
  - **Spots:** shrimp in the river (net), bream in the village pond (Fishing 10, rod and worms), trout at the north lake (Fishing 15, rod and feathers).
  - **The rod:** the old fly fishing rod is now the "Fishing rod" (converted on load).
  - **Poses:** players cast once when they start (`fishing.cast0`), then the line stays in the water. They hold the rod with both arms out and the left hand just under it (`fishPose(..., twoHands)`, `TWO_HAND`). Net fishing uses `netPose`. Each try's catch is rolled at its start (`fishRoll`), so a shrimp can show in the net. Ysolde keeps her own one-handed pose.
  - **The pond:** it has benches and lamps for night fishing (`buildPondSide`).
- **Jory's shack:**
  - **Who and where:** Jory, Wenna's husband, keeps the fishing shack east of the pond (`FISH_SHACK`, x -63, z 92; talk only from the front, `talkAt`). Only he has ears, a nose and a beard (`seaDogFace`).
  - **His shop:** he sells the net, the rod and worms, and buys fish (`FISH_GOODS`). Mara no longer sells fishing gear or buys fish.
  - **Shared stock:** raw fish sold to Jory goes into a stock at `adventure/live/fishstock/<item>`, a number from 0 to 200 changed with an ETag loop (`changeFishStock`). Every player can buy from it at twice his price.
- **Iron and tools:**
  - **Mining and smelting:** iron rocks need Mining 15 (`ORES.iron`). The furnace smelts bronze while you have copper and tin, then iron at Smithing 15 (success 50%, rising to 100% at 45, as in ITAP).
  - **Iron gear:** Smithing 15 to 25, and it needs Melee 10 to use.
  - **Axes and pickaxes** are smithed at each tier's dagger level. Check for them with `hasAxe()` / `hasPick()`, never `hasTool(AXE_NAME)`. Iron ones work faster (`chopFrames`).
  - **Icons:** iron tools use `ironHead` (only the head goes grey), iron armour uses `ironIcon`, and `iconOf(name)` finds the icon for things that aren't equipment.
- **The smithing screen:**
  - **Tabs:** one tab per metal (`smithTabs`, from each recipe's `bar`), opening on the best metal you have bars of.
  - **Rows:** rows you can't make are greyed out. Each row shows only the name, the bars and the level (the owner wants no stat lines there).
- **The level chop:** the axe chop is a level lumberjack swing (`axeChop`, impact at `AXE_HIT` with the chop sound). The back foot stays planted and the legs stay square while the upper body twists. The hero stands at 0.85 of the usual distance from trees. The pickaxe and hoe keep the overhead swing.
- **Fires (Firemaking):** "Light a fire" on logs in the bag (Firemaking 1, or 15 for oak), with a tinderbox (Mara; toolbelt `tinder` slot).
  - **Burning and cooking:** a fire burns for 90 s and can be cooked on (its rec is `kind: 'range'`).
  - **Light and sharing:** it joins the shared night lights, and it's shared at `adventure/live/fires/<key>` through `liveFeed('fires')`.
  - **Where you can't light one:** indoors, on roads, in water, on another fire or in the cellar (`noFireHere`).
- **Eating:** 1.8 s between bites (`EAT_DELAY`), and eating in a fight pushes your next swing back. Food messages are plain: "You eat the shrimp." plus the health gained.
- **Night lighting** is brighter up top: moonlight, a dark blue sky and fog, and wider lamp pools, all scaled by `nb = DELVE ? 0 : night`. The Root Cellar keeps the old darkness (`SKY.cellar`). To fix darkness, raise these levels; never add lights.
- **The village dressing:** `buildGreen`, `buildRiverLife` (jetty, watermill, ducks, punt, stepping stones, mist), the farm and woods builders, and `buildScorchedYard`. They run on the first frame from `updateSilkworks()`, so NPC routes worked out at start-up don't know their solid boxes. Put props near NPC routes in at start-up instead.
- **The toolbelt:** every key in `TOOLBELT_SLOTS` must also be in the `toolbelt` object, or that tool is dropped on the next load. A missing `rod` key once lost players' rods.
- **Database paths added:** `live/fishstock` (published) and `live/fires` (given to the owner to publish; confirm it's in their console). When the owner pastes their console rules, compare them with `database.rules.json` and hand back the full set with only the new block added.

### Lessons from these sessions

- **Monster homes must be clear ground.** A home inside a tree, a hill or the lake leaves that monster stuck there for good (`mobSpot` finds no clear line out). The north's trees are scattered at random, so after moving trees or homes, check every home with `monsterHit(x, z)` and that `mobSpot` finds spots away from it.
- **Check placement against what's already there.** Before placing a prop or a villager stop, make sure it doesn't cover a fishing spot or a talk spot, and isn't inside a house. Fenwick's jetty once covered the shrimp spot, and Ysolde's river stop was inside the north house (she fished through the wall). Test with `houses.findIndex(h => Math.abs(x - h.x) < h.hw && Math.abs(z - h.z) < h.hd)` and `fishSpots` distances.
- **No flat dark discs on the ground** for ash, puddles or shadows: from the game camera they read as round blobs. Tint the ground's vertex colours, with ragged edges, instead.
- **Chibi arms are short.** They reach about 0.45 from the shoulder, and armour makes the chest about 0.44 deep, so two hands can't meet on one object in front of the body without clipping. Grid-search the arm angles in a test, and measure forearm and hand points against the torso box with armour on, before posing hands on anything.
- **The owner's taste:**
  - **Plain wording:** no flavour text, no stat lines in menus.
  - **Real-looking shapes:** a proper axe head, a lake that is actually big.
  - **ITAP's numbers** wherever ITAP has the feature.
- **Mock-up rounds with several agents work well.** For "what could X look like" questions, run a workflow with one agent per area. Each makes a mock-up in a scratch test (never touching the game), with before/after renders, and you send the owner a gallery. Build the approved picks with one agent at a time (they all edit the same file), then have a fresh reviewer check roads, fishing spots, NPC spots, lights, `Math.random` and frame time. Look at the builders' pictures yourself before merging.

## Testing

- **Never join the live game from a test.** ITAP Adventure and the arcade leaderboards talk to a real Firebase database that players use. Any headless-browser test must call `offlineDb(page)` from `tools/offline-db.js` before `page.goto`, so every database request is answered locally with an empty village. Don't test against the published site (kaiserfi.github.io) with a login either; serve the repo locally (`python3 -m http.server`) and use the helper.
- When a test also intercepts the page itself (to inject test hooks), match **only** the local page URL (e.g. a regex for `http://localhost:8123/adventure/` and its query string). A broad glob such as `**/adventure/**` also matches the database's `/adventure/...` paths, and a route registered after `offlineDb` wins, sending real requests to the live game. `offlineDb` now exits the test if a live database response ever comes back.
- Never call `page.unrouteAll()` or `page.unroute()` while a game page is open: the game keeps sending presence updates and a save when it closes. `offlineDb` also routes the whole browser context now, but close the context instead of removing routes.
- **Multiplayer tests** use `FakeDb` from `tools/fake-db.js`, with one browser context per player, so the players share data without touching the live database.
- **Test hooks run inside the game module.** Game internals aren't on `window`, so put helper functions in code injected after `bootOnline();\nframe();` and call them through `window.__t`. Don't write a literal line break inside a string in injected code (it breaks the whole page), and don't give two helpers the same name (the later one silently wins).
- **Headless runs at only a few frames per second.** Walking and wandering are slow there, so teleport the hero next to things for checks, and allow long waits.
- **Render pictures with a separate camera** (`renderer.render(scene, cam)` then `toDataURL`) to look at an object up close; the game camera follows the hero.
- Before testing, run `node tools/build-adventure.js`: it rebuilds the page the tests load, checks the script parses and checks for name clashes.
- **Tests fake the sign-in too:** `FakeDb.attach(page, uid)` signs that page in as `uid` (use fixed ids like `'id' + name`), and `offlineDb` signs in as `offlineTester`. Never let a test reach Google's real sign-in: it creates real accounts on the project.
- **The local server stops when the session restarts.** If a test fails to load `localhost:8123`, start `python3 -m http.server 8123` again from the repo.
- **Test scripts worth reusing** in `tools/tests/`: `party-delve-handoff.js` (`fight`, `threat` or the default leader-asleep run), `ground-drops.js` (`time` for real-time), `fly-fishing.js`, `guard-schedule.js <hour>`, `villager-day.js <hour>`, `barracks.js`, `guard-day.js <hour>`, `auth-migrate.js`, `bonfire-night.js`. Pass pictures to a scratch folder with `OUT=`; without it some scripts write into the repo folder.
- **Testing traps that wasted time:**
  - A `//` comment added in the middle of a long one-line statement silently comments out the rest of that line. Use `/* */` inside lines.
  - `Box3.setFromObject` counts hidden meshes (the chibi's tools hang at the hands), so measure with `traverseVisible` when the answer matters.
  - Strong test characters kill a creature in one blow, so test threat, targeting or fights by calling the logic directly.
  - Logout navigates to the arcade page, so check `page.url()` after waiting for the navigation, not for the name box.
  - Wrapping a game function from `page.evaluate` runs outside the game's scope, so game variables look "not defined" there; put the wrapper in the injected hook instead.
  - `Object.values(remote)[0]` isn't always the player you mean; look them up by name.
  - The first presence write can overwrite an early test change (for example a player hurt before joining finished); wait until the other player actually sees the change.
  - `FakeDb` leaves an empty `{}` behind after a delete; real Firebase removes empty nodes.
  - A headless walk of a couple of units takes several seconds, and clicks land on the canvas unless they hit a menu; check where `elementFromPoint` lands before blaming the code.
- **More testing traps:**
  - "Spam click" tests must dispatch the clicks inside one `page.evaluate` (`el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX, clientY }))`). Each separate click and evaluate can take over a second headless, so the clicks are never actually fast.
  - A camera inside a roof or tree canopy renders a flat colour; move it rather than trusting the picture. A top-down orthographic render (fog and clouds off) is the quickest way to check placement.
  - For two players, use `FakeDb` with fixed ids (`idAnna`, `idBen`), as the fish-stock and fire tests did.
  - If the safety check refuses a long shell command that only writes and runs a test, write the test with the Write tool and run it with a plain `node file.js`.
  - GitHub in these sessions goes through the MCP tools (load them with ToolSearch); `gh` is only for search.
- When the owner says they'll test something themselves, stop your own test of it.

## Workflow

- Develop on the session's branch, then open a pull request and squash-merge it into `main` without asking. Say what changed in the PR, and note anything the owner must do by hand, such as publishing database rules.
- After a squash merge the branch's remote copy still holds the old commits. Merge it with `-s ours` (your copy already contains them) before pushing, rather than force-pushing.
- **Never overwrite other sessions' work on `main`.** Other sessions merge into `main` too. A branch that is behind `main` and then squash-merged writes its older copy of the whole file over theirs. This happened once: a one-line shield fix (#173) undid #165 to #171 (oak logs, the XP curve, hairstyles, face options, a rat fix, archery sounds).
  - **Before you start any change:** `git fetch origin main` and merge it into your branch for real (`git merge origin/main`, never `-s ours`).
  - **The `-s ours` merge is only safe straight after your own PR has merged**, when `main` holds nothing your branch lacks. Check first with `git log HEAD..origin/main`: if it lists any commit that isn't your own just-merged PR, do a real merge instead.
  - **Before every PR merge, check the diff against the latest `main`** (`git fetch origin main && git diff origin/main --stat`). It must touch only the files and roughly the number of lines you meant to change. A small fix showing hundreds of lines, or files you never edited, means you're about to revert someone else's work: stop and merge `main` in properly.
  - **If it happens anyway:** restore the files from the last good commit (`git checkout <good commit> -- .`), reapply only your own change, check `git diff <good commit>` shows just that, and merge it as a fix straight away. Tell the owner exactly what was undone and for how long.
- Report honestly what was tested and what wasn't (sounds, timers skipped in tests, untested paths).
- **Don't merge anything that breaks the live game.** If a merge depends on the owner doing something first (publishing rules), say so and wait for them.
- When the owner reports a live bug, stop other work, find the cause, and fix it first; hold back unrelated changes until the fix is in.
