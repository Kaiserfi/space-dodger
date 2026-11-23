# Bonfire mockup (not in the game yet)

`bonfire.js` puts a fire pit in the oak grove south-west of the hall: a stone ring, logs, flickering flames, sparks and a warm light that grows at night. Around it are five log benches with a gap where a short path comes in from the hall road, and three villagers sitting to show the pose. It spreads the grove oaks out and keeps the scattered trees out of the clearing. To test it, paste it right after `oakSpots.forEach(...)` in `adventure/index.html`. `day.png` and `night.png` show how it looks.

## Demo scene

`demo.js` is a scripted 33-second scene that shows the animations and sounds: Aldric walks out at dusk, kneels and strikes a flint until the fire catches, the family arrives and sits down, and the player gets up and tosses a log on. It defines every sound as a function of `(ctx, out, t)`, so the same code can play live in the game or render offline. `bonfire-demo.mp4` is the recording, with the soundtrack rendered from the same timeline.

## Demo scene 2: the village comes to the fire

`demo2.js` (54 seconds): as soon as Aldric sets off to light the fire, Lyra, Fenwick, Bram, Hilde and Pip leave what they're doing on a staggered schedule and walk real routes (from the game's pathfinder) to their seats, leaving seats free for players. They chat, Hilde and Aldric warn as the fire gets low, the player throws on a log, and everyone cheers before Lyra plays. `bonfire-demo2.mp4` is the recording.

## Scaled-up layout

`bonfire-big.js` is the bigger version: a larger fire, two rings of log benches (6 benches of two close in, 8 benches of three further out, 36 seats), a clearing about 21 units across, the oaks moved out to the edge, and two ways in, from the hall road and from the green. It fills most seats to show a busy night. `big-day.png` and `big-night.png` show it.
