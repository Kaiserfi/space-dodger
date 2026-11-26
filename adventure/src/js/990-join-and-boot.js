  for (const name in EV.npcs) { const n = EV.npcs[name]; n.sp.position.set(n.home[0], 0, n.home[1]); releaseNpc(n); }
  if (EV.seat >= 0) standUp();
  for (const m of EV.gobs) if (m) { m.g.visible = false; m.state = 'dead'; }
  if (FIGHT && FIGHT.m.raid) endFight();
}

const joinName = () => { const n = document.getElementById('nameInput').value.trim().slice(0, 12); if (!n) return;
  if (window.isBadName && isBadName(n)) { setStatus('That name is not allowed. Please choose another.'); return; }
  enterVillage(n); };
document.getElementById('joinBtn').addEventListener('click', joinName);
document.getElementById('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') joinName(); e.stopPropagation(); });
document.getElementById('retryBtn').addEventListener('click', bootOnline);
bootOnline();
frame();
