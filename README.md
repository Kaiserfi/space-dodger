# 🚀 Space Dodger

A 90s-style arcade shooter that runs right in your browser. Blast asteroids, chain combos, and beat the HI-SCORE!

## Arcade menu
The game opens on an **arcade menu** with a banner for each game. Choose one with ← / → (or tap the arrows) and press **SPACE** or tap the banner. From a game, **Esc** or the `< ARCADE` link goes back to the menu.

When a newer version of the site is published, open pages notice within a minute and show a banner offering to refresh (ITAP Adventure saves your progress first). This lives in `update-check.js`.

To add a game, add an entry to `GAMES` in `index.html` with its banner theme, title and a `start()` function.

## 🐍 Snake
Grow your snake by eating green orbs. Walls, blocks and your own tail are all deadly.

- **Steer:** arrow keys or WASD. On a phone, swipe in the direction you want, or tap the left or right half of the screen to turn.
- **Gold orbs** (yellow): +50 points and grow by 2, but they vanish after 7 seconds.
- **Poison orbs** (purple **X**): remove 2 segments. Shrinking below 3 segments ends the run.
- **Stages:** every 6 green orbs adds blocks and speeds the snake up.
- **Pause:** the pause button, **P** or **Esc**.

Snake has its own leaderboard. Online scores need the `snake` section of `database.rules.json` published in Firebase.

## 🪱 Crawler
A centipede crawls down through a mushroom field. Shoot it from your zone at the bottom.

- **Move:** arrow keys or WASD, or drag your finger or mouse.
- **Fire:** hold **Space**, or hold the **FIRE** button on the screen. Up to three shots are on screen at once.
- **Splitting:** each hit splits the centipede. Shooting its head is worth 100 points, and each body segment is worth 10.
- **Mushrooms:** they block the centipede and take 4 hits to clear. Each shot segment leaves one behind.
- **Fleas** (pink) drop mushrooms as they fall, and **spiders** (purple) zigzag above your zone from wave 2.
- **Waves:** clearing the whole centipede gives 500 points and starts the next wave, which is faster.

Crawler has its own leaderboard. Its online scores need the `crawler` section of `database.rules.json` published in Firebase.

## 🗺️ ITAP Adventure
A low-poly village to explore, found from the arcade menu (or at `adventure/`).

- **Walk:** click or tap the ground. Routes go round the houses, trees and rocks.
- **Look:** arrow keys or middle-mouse drag turn the camera; the wheel zooms.
- **Skills:** chop trees with the bronze axe, mine copper and tin rocks with the bronze pickaxe, smelt bronze at the furnace, smith at the anvil, and fish at the river.
- **Villagers:** click a villager to talk to them. Doors open and close when clicked.
- **Chat:** press Enter to type. Your line shows above your character in yellow.
- **Settings:** the settings tab (under the Gear tab on the right) has Music and Sounds volume sliders; tap the speaker icon next to either to mute it. Settings are saved in your browser.
- **Log out:** the button in the top left saves your progress and returns you to the arcade.

The village is multiplayer. You choose a name the first time, and you see the other adventurers walking around with their names above them. Trees and rocks are shared: a tree or rock someone takes is gone for everyone until it grows back. Your bag, skills and gear are saved under your browser's player id.

Online features need the `adventure` section of `database.rules.json` published in Firebase.

## How to play
Open `index.html` in any browser (or play the GitHub Pages link).

- **← / → or A / D** — fly (on a phone: drag your finger)
- **Auto-fire** — your ship shoots constantly, so you just steer!
- **M** — mute music and sound effects

## Power-ups
| Orb | What it does |
|---|---|
| **S** | Shield — smash through rocks |
| **T** | Turbo — fly faster |
| **R** | Rapid fire — double shots |
| **D** | Dual fighter — a second ship joins you and fires too. If it gets hit it's destroyed (no life lost) and you go back to one ship |

Power-ups only drop from **destroyed asteroids** (bigger rocks are more likely to drop one).

Big asteroids take several hits and **split into smaller ones**. Destroy rocks back-to-back for **combo multipliers up to x5**. Survive to reach new **stages** — it gets faster!

Built with plain HTML, CSS and JavaScript. All music and sounds are generated in code. Try changing the numbers in `index.html` to make your own version!

## 🏆 Leaderboard
The game asks for a pilot name the first time you play, and shows the top pilots on the game-over screen (press **L** on the title screen for the full list).

By default scores are saved **on that device only**. To make a shared **online** leaderboard so friends can compete:

1. Go to <https://console.firebase.google.com> and create a free project (turn Google Analytics off).
2. Build → **Realtime Database** → Create database (any region, start in locked mode).
3. Open the **Rules** tab and paste the contents of [`database.rules.json`](database.rules.json), then **Publish**.
4. Copy the database URL shown at the top of the Data tab (like `https://your-project-default-rtdb.firebaseio.com`).
5. Paste it into `LEADERBOARD_URL` near the top of the script in `index.html`, commit, and push.

Each name keeps only its best score, and only higher scores can replace it. Note: this is a friends-and-family leaderboard. Anyone technical could still post a fake score, and two people using the same name share one entry.

## 🛡️ Name filter
Pilot names are checked against a block list so the leaderboard stays kid-friendly. Names that match are refused when entered and shown as `*****` if one ever reaches the board. The list (stored encoded in `index.html`) combines a hand-made list with entries from [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words) (CC BY 4.0) and [zacanger/profane-words](https://github.com/zacanger/profane-words) (MIT).
