# Project notes

## ITAP Adventure (`adventure/index.html`)

- **Characters are 3D chibi figures.** Every character (the hero, villagers, Mara, other players) is built by `makeChibi(look)` and animated by `poseChibi(g, mode, t, tool)` with modes `idle`, `walk` and `swing`. The model is about 2.7 units tall before `CHIBI_SCALE`. Keep the toy style: big round head, big shiny eyes, no nose, toon shading (`toonMat`) and the dark outline from `chibiPart`.
- **Tools must be sized to the character.** A held tool's handle runs about the length of the arm plus forearm (the axe and pickaxe handles are 1.35 in model units) and its head must read clearly next to the hand. Check new tools from the side across the whole swing before shipping.
- **Tools face the right way.** In `makeTool`, the handle runs from the hand along -y and the working end faces -z, the direction the arm travels as it swings down, so an axe's edge and a pickaxe's point lead the blow into the tree or rock.
- **No clipping.** Hair, gear and tools must not pass through the head, body or arms from the front, side, back or 3/4 view, standing, mid-stride or mid-swing. Long hair stays behind the shoulders so the arms swing clear of it.

## Testing

- **Never join the live game from a test.** ITAP Adventure and the arcade leaderboards talk to a real Firebase database that players use. Any headless-browser test must call `offlineDb(page)` from `tools/offline-db.js` before `page.goto`, so every database request is answered locally with an empty village. Don't test against the published site (kaiserfi.github.io) with a login either; serve the repo locally (`python3 -m http.server`) and use the helper.
