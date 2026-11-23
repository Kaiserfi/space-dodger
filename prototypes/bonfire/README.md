# Bonfire mockup (not in the game yet)

`bonfire.js` puts a fire pit in the oak grove south-west of the hall: a stone ring, logs, flickering flames, sparks and a warm light that grows at night. Around it are five log benches with a gap where a short path comes in from the hall road, and three villagers sitting to show the pose. It spreads the grove oaks out and keeps the scattered trees out of the clearing. To test it, paste it right after `oakSpots.forEach(...)` in `adventure/index.html`. `day.png` and `night.png` show how it looks.

## Demo scene

`demo.js` is a scripted 33-second scene that shows the animations and sounds: Aldric walks out at dusk, kneels and strikes a flint until the fire catches, the family arrives and sits down, and the player gets up and tosses a log on. It defines every sound as a function of `(ctx, out, t)`, so the same code can play live in the game or render offline. `bonfire-demo.mp4` is the recording, with the soundtrack rendered from the same timeline.
