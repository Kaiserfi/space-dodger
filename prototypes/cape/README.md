# Villager's cloak and the village emblem (not in the game yet)

- `emblem.js`: `drawEmblem(ctx, x, y, radius, gold, background)` draws the village emblem, "The Oak and the River" (an oak in a ring above two river waves), and `capeTexture()` paints the cloak cloth with gold trim on every edge and the emblem in the middle.
- `cape.js`: `addCape(figure)` puts the cloak on a character made by `makeChibi` (load `emblem.js` first).
- `emblem.png`, `preview.png`: how they look.
- `quest-complete-jingle.py` / `.wav`: the quest-complete fanfare for A Hearty Welcome.
