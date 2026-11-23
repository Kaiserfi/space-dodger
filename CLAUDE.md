# Project notes

## ITAP Adventure (`adventure/index.html`)

- **Tools must be sized to the character.** The adventurer is a 24x32 pixel sprite. Any held tool, and every frame of its animation, should look real-world sized against that body: a handle about the length of the torso plus forearm (roughly 9-10 px, 2 px thick) and a head big enough to read (pickaxe head ~8 px across, axe blade ~4-5 px square). The hand is drawn over the handle so it looks gripped. See the axe and pickaxe in `adventurerSide()` for the reference sizes, and check new tools at a large scale before shipping.
- **Tools face the right way.** Side sprites face right (they are mirrored to face left), so a tool's working end points forward, toward +x, in the swing and strike frames: an axe's cutting edge faces the tree, a pickaxe's point bites forward/down.
