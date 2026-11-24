# Project notes

## ITAP Adventure (`adventure/index.html`)

The whole game is one file: a three.js module script inside `adventure/index.html`. Players share a live Firebase Realtime Database, so treat every change as going straight to real players.

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
- **Place things where the owner asked.** Directions: -z is north (the river), +z is south, +x is east (the farm, the windmill, then the map edge around x = 118). Check the spot is clear before building there, and move NPC or monster homes that a new building would cover.

### NPCs, dialogue and shops

- **Trading is a dialogue option.** A shopkeeper gets `choice: {...}` plus `shop: '<key>'`, and their dialogue menu then starts with "Let's trade.", followed by their `asks` and "Never mind.". Don't add a question at the end of their chat that opens the shop.
- **Shops live in `SHOPS`.** Each has a title, a buy list and a rule for which items it buys. Mara sells tools (axe, pickaxe, hammer, net) and buys everything except farm goods. Tilly's farmers' market sells all seeds and farming tools (hoe, watering can) and buys `FARM_GOODS`. New farming items go to Tilly, not Mara, and hint messages must point to the shop that actually sells the item.
- NPCs that stand behind a counter need a small `rad` (they wander within it) and an `s` large enough that the talk spot in front of them is clear of the counter.
- Clicking something the player is already standing beside should act at once, not walk them somewhere first. When walking is needed, go to the nearest free side, never a fixed spot that may be inside a building.
- **NPCs sound like real people, never like a robot or a game manual.** Write every line the way that villager would actually say it out loud:
  - **No game terms.** No skill names with numbers ("Farming 5"), no "XP", "level up", "item", "inventory", "click", "quest step", "requirement" or stat talk. Say it naturally: "You'll want more time in the fields first", "Get a few harvests under your belt", "You look like you could handle yourself now".
  - **No instructions read off a list.** Not "Step 1: till the patch. Step 2: plant the seed." Instead: "Turn the soil over with the hoe, then pop your seed in."
  - **Give them a voice.** Contractions, short sentences, a bit of humour or grumbling, their own opinions, and nods to the other villagers and their lives (Bram's named cabbages, Pip pinching mulberries, Hilde's hens). Match the character: Tilly is chatty and cheerful, Ezra is gruff and weary, Aldric is stern, Brenna is warm and flustered.
  - **Keep it short.** One or two sentences a line, a few lines a conversation. People don't make speeches when you buy turnips.
  - **Read it aloud before shipping.** If it sounds like a tooltip, rewrite it.
  - Exact numbers and requirements belong in the interface (menus, tooltips, toasts, the quest tracker), never in what an NPC says.
- Keep dialogue and warnings short. The owner prefers wording that matches the phone game (Idle Tap Adventure) where there is an equivalent, for example the delve warning.

### Items, the bag and saves

- **Saves must stay compatible.** New save fields get a default when missing (old saves load fine), and items that change shape are converted on load. Examples: food that used to stack is spread into slots, coins move from the bag into the purse (`co`), and plots without a crop load as wheat.
- **Food doesn't stack** (`SINGLE`: raw and cooked food, dough, bread). Burnt food and everything else stacks.
- **Coins are in the purse** (`COINS`, shown at the right of the bag footer), not a bag slot. `addItem`, `removeItem`, `countOf` and `hasItem` handle `'Coins'` specially.
- **The toolbelt** holds one of each skilling tool. Check tools with `hasTool(name)` (bag or belt), never `hasItem`, and add new tool types to `beltSlotFor` and `TOOLBELT_SLOTS`.
- **Never hand items over into a full bag.** `addItem` quietly gives only what fits. Before a quest, reward or NPC gives anything, check there's room (`bagRoomFor`). If there isn't, the NPC says so and nothing moves on. And if a player is on a step without the thing they were given, let the NPC hand it over again.
- **Items on the ground** (`GROUND`, `dropToGround`) are private to you and last three minutes. Drops, rewards and anything that doesn't fit in the bag go on the ground instead of vanishing. Each item should have a small 3D model in `groundModel` (no bones on meat); anything without one shows as a cloth bundle.
- **Every new item needs** an icon in `ICON_FOR`, a price in `SELL` if it can be sold, and a shop that buys it.
- **New skills** go in `SKILL_XP`. They show in the skills panel automatically, and old saves start them at level 1.

### Actions, timers and loops

- **Walking away cancels whatever is in hand.** `walkStart` stops the farming chain and the current farming job, but only for a walk the player starts: the game re-planning a stuck route (`replan`) must never cancel anything. Any new timed action (a `setTimeout` that finishes a job) must check it wasn't cancelled before doing anything, and every action with a progress bar must stop when the player walks.
- **One progress bar at a time.** Smelting, cooking, milling, spinning and bandaging share `#smeltBar`, so starting one must stop the others.
- **Never automate a choice the player should make.** The farming loop only waters and harvests by itself; planting always goes through the seed menu.
- **Movement must not depend on frame rate.** Scale per-frame movement by the elapsed time (`dt`), and approach targets with a small tolerance (`d > want + 0.1`), or a mover can creep forever without arriving.
- **In combat, clicking another monster doesn't switch targets.** It says "You're already in combat!". Only clicking the ground runs away.

### The Root Cellar delve

- It is a solo instance far off the map (around z = 400). Saves never put the player there; they load at the cellar doors.
- It matches the phone game: dying or fleeing (including the ladder, or closing the game) costs 25% of coins and rolls back all Melee and Hitpoints XP gained in the delve. The XP from before going down is saved as `dv`, so a mid-delve logout is penalised on the next load. After the last wave the player is safe, and the reward chest gives the rewards.
- Waves 5 to 7 pick two random monsters from chicken, rat and cow only. The angry farmers come only as the final pair. It is multi-combat.
- Down there only the boss theme plays, never the ordinary battle theme.

### Shared monsters (multiplayer)

- Farm monsters have a shared id (`m.sid`, in spawn order). Each game works out their wandering with `mobPath()` from a seeded random and the server clock (`SNOW()`). So spawn order, homes and everything solid near them must be identical for every player; nothing random or local may change them.
- Only fights go through the database, at `adventure/live/mobs/<sid>`: the fighter (with a heartbeat), health, position, each blow, and dead-until. It is single combat ("Someone else is fighting that."). Anything shown to other players (fight status, poses) must carry the monster's `sid`.
- **Database rules:** a new database path needs a rule in `database.rules.json`, and the owner has to paste the rules into the Firebase console and publish them. Say so whenever the rules change, and give the full rules to paste. Compare with the owner's current console rules first, so nothing of theirs is lost.

### Healing other players

- Clicking a bandage opens **Heal / Heal other**. Heal other lists hurt players within 14 units (their health comes from presence, `hp: [cur, max]`). Picking one heals on the spot if they're within 4 units, otherwise you walk up first; aim at their real position (`r.tx/r.tz`), not their sliding figure.
- The heal is sent as a note to `adventure/live/mobs/_heals/<their id>` (capped at 12 by the receiver); it rides on the monsters' stream, and their game fetches, applies and deletes it.

### One live feed

- Everything shared live sits under `adventure/live/` (players, nodes, event, graves, mobs), and the game keeps **exactly one** stream open on it (`startLive`). Each part subscribes with `liveFeed('<part>')`, which behaves like its own `EventSource` (put/patch events with paths relative to that part).
- Browsers allow only about six connections to the database; a second stream starves saves, presence and logout. New live data goes in a new folder under `adventure/live/` with `liveFeed`, never a new `EventSource`. Saves (`adventure/saves`) stay outside `live`, since nobody needs them streamed.

### Sound and music

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
- Check the script parses before testing: extract the module script and run `node --check` on it.

## Workflow

- Develop on the session's branch, then open a pull request and squash-merge it into `main` without asking. Say what changed in the PR, and note anything the owner must do by hand, such as publishing database rules.
- After a squash merge the branch's remote copy still holds the old commits. Merge it with `-s ours` (your copy already contains them) before pushing, rather than force-pushing.
- Report honestly what was tested and what wasn't (sounds, timers skipped in tests, untested paths).
