// the village emblem, "The Oak and the River": a gold oak in a ring above two river waves
window.drawEmblem = (g, cx, cy, R, gold = '#e2b84c', dark = '#3a4a24') => {
  g.save(); g.translate(cx, cy);
  g.lineWidth = R * 0.09; g.strokeStyle = gold; g.beginPath(); g.arc(0, 0, R, 0, 7); g.stroke();      // the ring
  g.lineWidth = R * 0.03; g.beginPath(); g.arc(0, 0, R * 0.86, 0, 7); g.stroke();
  g.fillStyle = gold;
  // a broad oak: a wide, knobbly crown on a stout trunk that forks into branches, with roots spreading at the base
  for (const [x, y, r] of [[0, -0.36, 0.2], [-0.24, -0.3, 0.18], [0.24, -0.3, 0.18], [-0.42, -0.14, 0.16], [0.42, -0.14, 0.16], [-0.26, -0.08, 0.19], [0.26, -0.08, 0.19], [0, -0.14, 0.22], [-0.12, -0.46, 0.13], [0.12, -0.46, 0.13]]) { g.beginPath(); g.arc(x * R, y * R, r * R, 0, 7); g.fill(); }
  g.strokeStyle = gold; g.lineCap = 'round';
  g.lineWidth = R * 0.15; g.beginPath(); g.moveTo(0, R * 0.36); g.lineTo(0, R * 0.0); g.stroke();                 // trunk
  g.lineWidth = R * 0.07; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(0, R * 0.1); g.quadraticCurveTo(s2 * R * 0.1, R * 0.02, s2 * R * 0.2, R * 0.04); g.stroke(); }   // branches under the crown
  g.lineWidth = R * 0.05; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(0, R * 0.3); g.quadraticCurveTo(s2 * R * 0.1, R * 0.36, s2 * R * 0.22, R * 0.38); g.stroke(); }   // roots
  // gaps between the crown and the branches, so the tree reads as a tree and not a cloud
  g.fillStyle = dark; for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(s2 * R * 0.13, R * 0.13, R * 0.07, R * 0.05, 0, 0, 7); g.fill(); }
  g.fillStyle = gold;
  // two river waves beneath
  g.strokeStyle = gold; g.lineWidth = R * 0.07; g.lineCap = 'round';
  for (const y of [0.52, 0.67]) { g.beginPath(); for (let i = 0; i <= 24; i++) { const x = -0.55 + i * 1.1 / 24; const yy = y + Math.sin(i / 24 * Math.PI * 3) * 0.04; i ? g.lineTo(x * R, yy * R) : g.moveTo(x * R, yy * R); } g.stroke(); }
  g.restore();
};
// the cape's cloth: moss green with a fine weave, a gold border on all four edges, and the emblem in the middle
window.capeTexture = () => {
  const W = 512, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#5c7e44'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 4000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(30,50,20,.12)' : 'rgba(200,230,160,.08)'; g.fillRect(Math.random() * W, Math.random() * H, 2, 1); }
  const b = 26; g.fillStyle = '#d8b048'; g.fillRect(0, 0, W, b); g.fillRect(0, H - b, W, b); g.fillRect(0, 0, b, H); g.fillRect(W - b, 0, b, H);
  g.fillStyle = '#a07a2c'; for (const [x, y, w, h] of [[0, b - 4, W, 4], [0, H - b, W, 4], [b - 4, 0, 4, H], [W - b, 0, 4, H]]) g.fillRect(x, y, w, h);
  drawEmblem(g, W / 2, H * 0.47, 120, '#e2b84c', '#5c7e44');
  return cv;
};
