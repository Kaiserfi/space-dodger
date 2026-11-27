window.__t = { ready: () => ONLINE.ready };
(() => {
  const T = window.__t;
  T.setup = () => { QUEST.gw = Math.max(QUEST.gw || 0, 2);   /* the cave opens once Tobin asks you to find Hollis */ for (const k in SKILL_XP) SKILL_XP[k] = XP_AT[k === 'Smithing' ? 45 : 22]; HP.cur = maxHp();
    for (const n of [AXE_NAME, PICK_NAME, 'Hammer', 'Tinderbox', 'Small fishing net']) addItem(n, 1, ICON_FOR[n]); for (let i = 0; i < 4; i++) addItem('Shrimp', 1, ICON_FOR.Shrimp); renderBag(); renderStats(); return bag.map(b => b.name); };
  T.go = (x, z) => { hero.position.set(x, 0, z); heroShadow.position.set(x, 0.06, z); walkTarget = null; walkQueue = []; walkThen = null; target.set(x, 1, z); camEase = null; };
  T.mouth = () => { const s = caveExitSpot(); T.go(s.x + 0.5, s.z); return s; };
  T.click = () => { caveClick(); return true; };
  T.state = () => ({ cave: !!CAVE, room: CAVE && CAVE.room, P: JSON.parse(JSON.stringify(CAVE_P)), hero: [+hero.position.x.toFixed(2), +hero.position.z.toFixed(2)], heroY: hero.position.y, hp: HP.cur, fight: !!FIGHT, job: !!caveJob,
    mons: CAVE ? CAVE.mons.map(m => [m.type, m.croom, m.state, m.hp, +m.g.position.x.toFixed(1), +m.g.position.z.toFixed(1)]) : [], bag: bag.map(b => b.name + ' x' + b.qty), coins: COINS,
    toast: document.getElementById('toast').textContent, hud: document.getElementById('caveHud').hidden ? null : document.getElementById('caveHud').textContent });
  T.kill = room => { for (const m of CAVE.mons) if (m.croom === room && m.state !== 'dying' && m.state !== 'dead') { m.hp = 0; if (FIGHT && FIGHT.m !== m) endFight(); killMonster(m); } return CAVE.mons.filter(m => m.croom === room).map(m => m.state); };
  T.blockedAt = (x, z) => blocked(x, z);
  T.path = (ax, az, bx, bz) => { const p = findPath(new THREE.Vector3(ax, 0, az), new THREE.Vector3(bx, 0, bz)); const l = p[p.length - 1]; return { n: p.length, end: l ? [l.x, l.z] : null }; };
  T.call = (name, ...a) => { const f = { plateClick, treeClick, rootClick, brazierClick, wallClick, veinClick, anvilClick, poolClick, fireClick, hollisClick, capPatchClick, webClick, ledgeClick, takeKey, bossDoorClick, bossChestClick, leaveCave, playerDies }[name]; f(...a); return true; };
  T.smelt = () => { const F = trees.find(o => o.userData && o.userData.name === 'Goblin furnace'); clickNode(F.userData.rec); return true; };
  T.dlg = () => { const d = document.getElementById('dialog'); return d.hidden ? null : document.getElementById('dlgName').textContent + ': ' + document.getElementById('dlgText').textContent; };
  T.dlgNext = () => { if (dlgCur && !dlgCur.opts) nextStep(); return T.dlg(); };
  T.grave = () => GRAVES[ONLINE.id] ? { x: GRAVES[ONLINE.id].x, z: GRAVES[ONLINE.id].z, n: (GRAVES[ONLINE.id].items || []).length } : null;
  T.dieNow = () => { playerDies(); return T.grave(); };
  T.music = () => FIGHT_MUSIC.want;
  T.dropKey = () => { const it = bag.find(b => b.name === 'Ember key'); dropItem(it, false); return bag.includes(it); };
  T.unbeat = () => { caveLoadP({ v: 2 }); return true; };   /* forget that the cave was beaten, for tests that need its creatures again */
  T.give = (n, q) => { addItem(n, q, ICON_FOR[n]); return countOf(n); };
  T.clickItem = name => { const i = bag.findIndex(b => b.name === name); const el = document.querySelector('#bagGrid .slot[data-i="' + i + '"]'); if (!el) return false; const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.x + 10, clientY: r.y + 10 })); return document.getElementById('itemMenu').hidden ? null : document.getElementById('itemMenu').textContent; };
  T.ironKeyShown = () => !!(CV.ironKey && CV.ironKey.visible);
  T.ratSpotsClear = () => [[-51, 640.2], [-53.6, 645.4], [-48.4, 645.4]].every(([x, z]) => !monsterHit(x, z));
  T.save = () => { const s = currentSave(); return { cd: s.cd, pos: s.pos }; };
  T.hurtTroll = hp => { CAVE.troll.hp = hp; return hp; };
  T.lights = () => LIGHT_SPOTS.filter(p => p[2] > 550).length;
  T.trollMath = () => { const me = playerRolls(), t = MONSTER_TYPES.caveTroll, it = monsterRolls(t); return { myHit: hitChance(me.att, it.def), myMax: me.maxHit, itsHit: hitChance(it.att, me.def), itsMax: it.maxHit, hp: t.hp, myHp: maxHp(), cb: combatLevel() }; };
  T.setMelee = lv => { SKILL_XP.Melee = XP_AT[lv]; SKILL_XP.Hitpoints = XP_AT[lv]; HP.cur = maxHp(); return combatLevel(); };
  T.shot = (cx, cy, cz, lx, ly, lz, W, H) => { const cam = new THREE.PerspectiveCamera(42, W / H, 0.1, 300); cam.position.set(cx, cy, cz); cam.lookAt(lx, ly, lz);
    const was = [renderer.getSize(new THREE.Vector2()), renderer.getPixelRatio()]; renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.render(scene, cam); const u = renderer.domElement.toDataURL('image/png'); renderer.setSize(was[0].x, was[0].y, false); renderer.setPixelRatio(was[1]); return u; };
  T.top = (W, H) => { const cam = new THREE.OrthographicCamera(-72, 72, 56, -56, 0.1, 400); cam.position.set(0, 120, 646); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 646); const f = scene.fog; scene.fog = null;
    const was = [renderer.getSize(new THREE.Vector2()), renderer.getPixelRatio()]; renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.render(scene, cam); const u = renderer.domElement.toDataURL('image/png'); renderer.setSize(was[0].x, was[0].y, false); renderer.setPixelRatio(was[1]); scene.fog = f; return u; };
})();
