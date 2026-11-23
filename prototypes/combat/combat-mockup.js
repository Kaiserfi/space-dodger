// combat mock-up: you and a goblin, locked facing each other, trading turns
(() => {
  window.__fight = true;
  const HX = -12.7, HZ = 31, GX = -15.3, GZ = 31;
  hero.position.set(HX, 0, HZ); hero.rotation.y = -Math.PI / 2;
  equipped.head = 'Bronze helmet'; equipped.body = 'Bronze chestplate'; equipped.legs = 'Bronze leg armour'; equipped.feet = 'Bronze boots'; equipped.weapon = 'Bronze sword'; equipped.shield = 'Bronze shield';
  dressChibi(hero, equipped);
  const gob = makeGoblin({ skin: 0x6a9a3a }); gob.position.set(GX, 0, GZ); gob.rotation.y = Math.PI / 2; scene.add(gob);
  const club = gob.userData.chibi.arms[1].children.find(k => k.userData.isClub);
  const H = hero.userData.chibi, Gc = gob.userData.chibi;
  const rest = (c) => { c.arms[0].rotation.set(0, 0, -0.2); c.arms[1].rotation.set(0, 0, 0.2); c.body.rotation.set(0, 0, 0); c.body.position.set(0, 0, 0); c.legs.forEach(l => l.rotation.set(0, 0, 0)); c.head.rotation.set(0, 0, 0); };
  // health bars and hitsplats, floating over heads
  const bars = {}, splats = [];
  const css = document.createElement('style'); css.textContent = `
    .hpBar{position:fixed;transform:translate(-50%,-100%);width:64px;height:8px;background:#7a1a12;border:1px solid #1a0a06;pointer-events:none;z-index:7}
    .hpBar i{display:block;height:100%;background:linear-gradient(#5ad05a,#2a9a2a)}
    .splat{position:fixed;transform:translate(-50%,-50%);pointer-events:none;z-index:8;width:44px;height:40px;display:flex;align-items:center;justify-content:center;font:bold 20px Georgia,serif;color:#fff;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000}
    .splat:before{content:'';position:absolute;inset:0;z-index:-1;clip-path:polygon(50% 0,62% 22%,88% 12%,80% 38%,100% 50%,80% 62%,88% 88%,62% 78%,50% 100%,38% 78%,12% 88%,20% 62%,0 50%,20% 38%,12% 12%,38% 22%)}
    .splat.hit:before{background:radial-gradient(#e8352a,#8a0e08)} .splat.block:before{background:radial-gradient(#4a8ae8,#1a3a8a)} .splat.miss:before{background:radial-gradient(#9aa0a8,#4a4e56)}
    .splat small{position:absolute;top:100%;font:bold 12px Georgia,serif;white-space:nowrap;color:#bfe0ff}`;
  document.head.appendChild(css);
  for (const k of ['hero', 'gob']) { const el = document.createElement('div'); el.className = 'hpBar'; el.innerHTML = '<i style="width:100%"></i>'; document.body.appendChild(el); bars[k] = el; }
  const V = new THREE.Vector3();
  const place = (el, obj, y, rise = 0) => { obj.getWorldPosition(V); V.y += y + rise; V.project(camera); el.style.left = (V.x + 1) / 2 * innerWidth + 'px'; el.style.top = (-V.y + 1) / 2 * innerHeight + 'px'; };
  window.__fx = {
    hp: (who, f) => { bars[who].firstChild.style.width = f * 100 + '%'; },
    splat: (who, n, kind, rise, label) => { const el = document.createElement('div'); el.className = 'splat ' + kind; el.innerHTML = n + (label ? `<small>${label}</small>` : ''); document.body.appendChild(el); splats.push({ el, who, rise }); },
    clear: () => { splats.splice(0).forEach(s => s.el.remove()); },
    pose: (h, g) => { rest(H); rest(Gc); h && h(H); g && g(Gc); },
  };
  (function tick(){
    place(bars.hero, hero, 4.55); place(bars.gob, gob, 3.9);
    for (const s of splats) place(s.el, s.who === 'hero' ? hero : gob, s.who === 'hero' ? 3.0 : 2.5, s.rise);
    requestAnimationFrame(tick); })();
  // poses
  window.__P = {
    hWind: c => { c.arms[1].rotation.set(-2.9, 0, 0.1); c.body.rotation.x = -0.12; c.legs[0].rotation.x = -0.3; },
    hStrike: c => { c.arms[1].rotation.set(-0.6, 0, -0.1); c.body.rotation.x = 0.2; c.legs[0].rotation.x = -0.4; c.legs[1].rotation.x = 0.25; },
    hBlock: c => { c.arms[0].rotation.set(-1.45, 0.5, 0.1); c.body.rotation.x = 0.06; c.legs[1].rotation.x = 0.3; },
    hHurt: c => { c.body.rotation.x = -0.28; c.head.rotation.z = 0.2; c.arms[0].rotation.set(0.4, 0, -0.6); c.arms[1].rotation.set(0.4, 0, 0.6); c.legs[0].rotation.x = 0.3; },
    gWind: c => { c.arms[1].rotation.set(-3.0, 0, 0.1); c.body.rotation.x = -0.15; },
    gStrike: c => { c.arms[1].rotation.set(-0.7, 0, 0); c.body.rotation.x = 0.25; c.legs[0].rotation.x = -0.4; },
    gHurt: c => { c.body.rotation.x = -0.32; c.head.rotation.z = -0.25; c.arms[0].rotation.set(0.5, 0, -0.7); c.arms[1].rotation.set(0.6, 0, 0.6); },
    gDead: c => { c.body.rotation.x = -1.45; c.body.position.y = -0.62; c.head.rotation.z = 0.4; c.arms[0].rotation.set(-2.6, 0, -0.4); c.arms[1].rotation.set(-2.6, 0, 0.4); c.legs.forEach(l => l.rotation.x = 1.2); },
  };
})();
