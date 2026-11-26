# Server checks (Firebase Cloud Functions)

The arcade's leaderboards are written only by the server, never by a browser:

- `arcadeStart` runs when a game begins and notes the time (`arcade/runs/<uid>/<game>`).
- `arcadeSubmit` runs at game over. Before writing the score to the board (`scores`, `snake` or `crawler`), it checks:
  - the account is signed in and not banned
  - the name is allowed, and belongs to this account (`arcade/names/<key>`: the first account to post a name owns it)
  - the score isn't more than a real game of that length could reach (`GAMES` in `index.js`)

A score that's impossible for its game's length is turned down and recorded in `arcade/flags/<uid>`.

**The save watchdog** (`watchdog.js`, `watchSave`) runs every time an ITAP save is written.
- **What it checks:** if coins, a skill's XP or an item jumped further than real play allows in the time since the last save, it puts them back to the last good values and records the account in `watch/flags/<uid>`. The player's game reloads the corrected save.
- **What it always allows:** losses, and climbing back to your own best. An account's first save is just noted.
- **Exempting an account:** add `watch/trust/<uid> = true`, for example before giving someone coins by hand in the console, or the watchdog will take them back.

The name filter in `filter.js` is copied from `index.html` and `word-filter.js` by `node tools/build-functions.js`. Don't edit it by hand: the build check fails if it's out of date.

## Deploying (from your own computer)

You need Node 22 and the Firebase CLI (`npm install -g firebase-tools`), signed in as the project owner (`firebase login`). From the repository's top folder:

```bash
cd functions
```

```bash
npm install
```

```bash
cd ..
```

```bash
firebase deploy --only functions
```

The first deploy may ask to turn on some Google Cloud services (Cloud Functions, Cloud Build, Artifact Registry); say yes. `firebase.json` has no database rules in it on purpose, so a deploy never changes the rules. Rules are pasted into the console by hand.

## Banning someone

In the Firebase console, open Realtime Database, add a child `banned` at the top level if it isn't there, and under it add the player's account id with the value `true`. Their id is the key of their entry in `adventure/live/players` or `adventure/saves`, or the `uid` on their leaderboard entries.

With the rules in `database.rules.json` (published), a banned account can't save, show up online, or write anything. The server also refuses its scores.

## Testing against the emulators

Nothing here touches the live project. Download the Firebase CLI into a scratch folder and start the emulators from the repository's top folder with the test config (`firebase.emu.json`, which loads `database.rules.json`):

```bash
firebase emulators:start --config firebase.emu.json --project space-dodger-1a558
```

Then serve the repository on port 8123 and run the tests:
- `tools/tests/emulator/rules.js`: the rules and both functions, directly
- `tools/tests/emulator/arcade.js`: the arcade page
- `tools/tests/emulator/itap.js`: ITAP Adventure with two players, including a faked-coins check
- `tools/tests/emulator/watchdog.js`: the save watchdog

The tests rewrite every live Firebase address to the emulators and abort anything still aimed at the live project.

In the session's cloud sandbox, start the emulators with the proxy variables removed (`env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy ...`), or the CLI sends its own local requests through the proxy and fails with "refusing to ...". The ITAP test needs the proxy for the CDN, so it launches Chromium with the proxy but bypasses it for localhost. Its live stream can't be relayed to the emulator, so two test players don't see each other.
