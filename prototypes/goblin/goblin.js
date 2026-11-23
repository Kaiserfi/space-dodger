// a goblin, built on the game's own character model: makeChibi, chibiPart, poseChibi
(() => {
const HAIRLESS = 0x10fe01;   // a marker colour: the hair pieces made in it are removed, goblins are bald
function makeGoblin(o = {}){
  const skin = o.skin || 0x6a9a3a;
  const g = makeChibi({ gender: 'male', hair: 'short', hairCol: HAIRLESS, skin, shirt: o.shirt || 0x6a4a2a, pants: o.pants || 0x4a3a22 });
  const c = g.userData.chibi, head = c.head;
  head.children.filter(m => m.material && m.material.color && m.material.color.getHex() === HAIRLESS).forEach(m => head.remove(m));
  head.scale.set(1.08, 0.92, 1.0);                                        // a wider, squatter head
  // long pointed ears, sweeping out and back
  for (const s of [-1, 1]) {
    const ear = chibiPart(head, new THREE.ConeGeometry(0.16, 0.75, 8), skin, s * 0.72, 0.08, -0.05);
    ear.rotation.set(0.25, 0, s * -1.25);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 6), toonMat(0xc86a6a)); inner.position.set(0, 0.03, 0.06); ear.add(inner);
  }
  // a big hooked nose, a heavy scowling brow, a wide grin with two fangs
  const nose = chibiPart(head, new THREE.ConeGeometry(0.11, 0.36, 8), skin, 0, -0.04, 0.68); nose.rotation.x = Math.PI / 2 + 0.35;
  for (const s of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.06), toonMat(0x3a4a1a)); brow.position.set(s * 0.22, 0.17, 0.57); brow.rotation.z = s * 0.4; head.add(brow);
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 5), basic(0xf4f0e0)); fang.position.set(s * 0.1, -0.24, 0.57); fang.rotation.x = Math.PI; head.add(fang);
  }
  // yellow eyes with dark slits, in place of the friendly ones
  c.eyes.forEach((e, i) => { if (i % 2 === 0) { e.material = basic(0xf0d030); const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), basic(0x1a1208)); pupil.scale.set(0.45, 1.3, 0.5); pupil.position.z = 0.09; e.add(pupil); } else e.visible = false; });
  head.children.forEach(m => { if (m.geometry && m.geometry.type === 'TorusGeometry') { m.scale.set(1.9, 1.2, 1); m.material = basic(0x3a1a12); } });   // the grin
  head.children.forEach(m => { if (m.material && m.material.opacity < 1) m.material = basic(0x8a5a3a, 0.4); });   // grubby cheeks
  // a ragged tunic edge, a rope belt and a bone club
  for (let i = 0; i < 6; i++) { const rag = chibiPart(c.body, new THREE.ConeGeometry(0.1, 0.22, 4), o.shirt || 0x6a4a2a, -0.3 + i * 0.12, 0.7, 0.18, false); rag.rotation.x = Math.PI; }
  chibiPart(c.body, new THREE.TorusGeometry(0.39, 0.035, 5, 16).rotateX(Math.PI / 2), 0xb8a070, 0, 0.83, 0, false);
  const club = new THREE.Group(); club.userData.isClub = true; club.position.set(0, -0.45, 0); club.rotation.x = -Math.PI / 2 + 0.3; c.arms[1].add(club);
  chibiPart(club, new THREE.CylinderGeometry(0.06, 0.09, 0.9, 7), 0x6a4a2a, 0, -0.35, 0);
  const knob = chibiPart(club, new THREE.DodecahedronGeometry(0.2, 0), 0x5a3e22, 0, -0.85, 0); knob.scale.set(1, 1.3, 1);
  for (let i = 0; i < 4; i++) { const spike = chibiPart(club, new THREE.ConeGeometry(0.04, 0.16, 4), 0xd8d0b8, Math.cos(i * 1.6) * 0.17, -0.85 - (i % 2) * 0.1, Math.sin(i * 1.6) * 0.17, false); spike.rotation.set(Math.sin(i * 1.6) * 1.5, 0, -Math.cos(i * 1.6) * 1.5); }
  g.scale.setScalar(CHIBI_SCALE * 0.82);   // goblins are a head shorter than people
  return g;
}
const at = (x, z, ry, o) => { const gb = makeGoblin(o); gb.position.set(x, 0, z); gb.rotation.y = ry; scene.add(gb); return gb; };
const W = [-80, 18];   // a goblin camp at the edge of the woods
const g1 = at(W[0], W[1], 0.4), g2 = at(W[0] + 2.6, W[1] + 1.2, -0.5, { skin: 0x7aa848, shirt: 0x5a5a3a }), g3 = at(W[0] - 2.2, W[1] + 1.8, 0.9, { skin: 0x5a8a34, shirt: 0x7a3a2a, pants: 0x3a2a1a });
// their camp: a campfire and a scruffy hide tent
const fire = new THREE.Group(); fire.position.set(W[0] + 0.3, 0, W[1] - 2.4); town.add(fire);
for (let i = 0; i < 8; i++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), mat(0x7a7470)); st.position.set(Math.cos(i * 0.8) * 0.85, 0.15, Math.sin(i * 0.8) * 0.85); fire.add(st); }
for (let i = 0; i < 3; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6), mat(0x5a3a1e)); lg.position.y = 0.15; lg.rotation.set(Math.PI / 2, i * 1.05, 0); fire.add(lg); }
const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 6), new THREE.MeshBasicMaterial({ color: 0xff8a20 })); flame.position.y = 0.6; fire.add(flame);
const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6), new THREE.MeshBasicMaterial({ color: 0xffd040 })); flame2.position.y = 0.5; fire.add(flame2);
const tent = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.2, 5), mat(0x8a6a48)); tent.position.set(W[0] - 3.5, 1.6, W[1] - 4.5); town.add(tent);
const flap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.05), mat(0x3a2a1a)); flap.position.set(W[0] - 3.2, 0.7, W[1] - 2.6); town.add(flap);
// animate: one idles, one swings the club, one hops by the fire
let t = 0;
(function tick(){ t += 1 / 60;
  poseChibi(g1, 'idle', 0);
  poseChibi(g2, 'swing', (t * 0.8) % 1, 'axe'); g2.userData.chibi.tools.axe.visible = false; g2.userData.chibi.arms[1].children.forEach(k => { if (k.userData.isClub) k.visible = true; });
  poseChibi(g3, 'walk', t); g3.position.y = Math.abs(Math.sin(t * 4)) * 0.25;
  flame.scale.y = 1 + Math.sin(t * 13) * 0.15; flame2.scale.y = 1 + Math.cos(t * 17) * 0.2;
  requestAnimationFrame(tick); })();
window.__gob = { pose: ph => { t = ph / 0.8; } };
})();
