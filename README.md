# 🚀 Space Dodger — Arcade Edition

A 90s-style arcade shooter that runs right in your browser. Blast asteroids, chain combos, and beat the HI-SCORE!

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
