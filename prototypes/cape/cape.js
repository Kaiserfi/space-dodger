window.addCape = (fig) => {
  const c = fig.userData.chibi, b = c.body;
  const cloth = 0x5c7e44, trim = 0xd8b048;
  // a cape hanging from the shoulders: a slice of a cone behind the back, flaring towards the hem
  const geo = new THREE.CylinderGeometry(0.4, 0.62, 1.15, 20, 1, true, Math.PI - 1.25, 2.5);
  const tex = new THREE.CanvasTexture(capeTexture()); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const capeMat = new THREE.MeshToonMaterial({ map: tex, gradientMap: toonRamp, side: THREE.DoubleSide });
  const cape = new THREE.Mesh(geo, capeMat); cape.position.set(0, 0.92, -0.04); cape.castShadow = true; b.add(cape);
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.625, 1.16, 20, 1, true, Math.PI - 1.25, 2.5), new THREE.MeshBasicMaterial({ color: 0x1a1410, side: THREE.BackSide })); edge.scale.set(1.04, 1.01, 1.04); cape.add(edge);
  // a collar round the shoulders and a brass clasp at the front
  const collar = chibiPart(b, new THREE.TorusGeometry(0.33, 0.08, 8, 20), cloth, 0, 1.45, -0.02); collar.rotation.x = Math.PI / 2; collar.scale.set(1.1, 0.95, 1);
  const clasp = chibiPart(b, new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10), trim, 0, 1.4, 0.33, false); clasp.rotation.x = Math.PI / 2;
  c.cape = cape;
};
