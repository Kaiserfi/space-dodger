# Farm prototype (not in the game yet)

Saved for later. Nothing here is loaded by ITAP Adventure.

- `farm.js`: a barn, paddock, crop rows, scarecrow, cows, sheep, a pig, chickens and two farmers, built with the game's own helpers (`mat`, `texMat`, `woodTex`, `roofTex`, `makeChibi`, `chibiPart`, `poseChibi`). It was tested by pasting it into `adventure/index.html` right after `frame();` at the bottom of the script. It places the farm at x 4, z 40, south of the hall.
- `preview.png`: how it looked in the game.
- `animal-sounds.py`: synthesises the moo, baa, oink and cluck (`python3 animal-sounds.py` writes WAV files). In the game these would be Web Audio code like the other sounds.
- `animal-sounds.wav`: all four sounds in a row.

To do before adding it: move the oak grove and random trees out of the farm area, make the pitchfork prongs bigger, decide on interactions (eggs, milk, wool, or a Farming skill).
