import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ----- the look options -----
const LOOK = [
  {key: 'gender', label: 'Build', values: [{id: 'male', label: 'Male'}, {id: 'female', label: 'Female'}]},
  {key: 'skin', label: 'Skin', values: [{id: 0xf6d6b8, label: 'Pale'}, {id: 0xf1cba0, label: 'Light'}, {id: 0xe8c39c, label: 'Fair'}, {id: 0xd9a878, label: 'Warm'}, {id: 0xc9955f, label: 'Tan'}, {id: 0xa8744a, label: 'Olive'}, {id: 0x8a5a33, label: 'Dark'}, {id: 0x5e3a22, label: 'Deep'}]},
  {key: 'hair', label: 'Hair', values: [{id: 'short', label: 'Short'}, {id: 'long', label: 'Long'}, {id: 'topknot', label: 'Top knot'}, {id: 'ponytail', label: 'Ponytail'}, {id: 'pigtails', label: 'Pigtails'}, {id: 'bob', label: 'Bob'}, {id: 'braid', label: 'Braid'}, {id: 'spacebuns', label: 'Space buns'}, {id: 'mouseears', label: 'Mouse ears'}, {id: 'lowbun', label: 'Low bun'}, {id: 'waves', label: 'Long waves'}, {id: 'halfup', label: 'Half-up with bow'}, {id: 'spiky', label: 'Spiky'}, {id: 'curly', label: 'Curly'}, {id: 'middlepart', label: 'Middle part'}, {id: 'pompadour', label: 'Pompadour'}, {id: 'fauxhawk', label: 'Faux hawk'}, {id: 'frcrop', label: 'French crop'}, {id: 'longloose', label: 'Long and loose'}, {id: 'buzz', label: 'Buzz cut'}, {id: 'bald', label: 'Bald'}]},
  {key: 'hairCol', label: 'Hair colour', values: [{id: 0x4a2a14, label: 'Brown'}, {id: 0x2e1a0e, label: 'Dark brown'}, {id: 0x1a1a1a, label: 'Black'}, {id: 0xe0c070, label: 'Blonde'}, {id: 0xd9a066, label: 'Strawberry'}, {id: 0x8a4a22, label: 'Auburn'}, {id: 0xa03a1e, label: 'Red'}, {id: 0x9a9aa0, label: 'Grey'}, {id: 0xeeeeee, label: 'White'}, {id: 0x3a6ad0, label: 'Blue'}, {id: 0xe070b0, label: 'Pink'}, {id: 0x3a9a5a, label: 'Green'}, {id: 0x7a4ac0, label: 'Purple'}]},
  {key: 'eye', label: 'Eyes', values: [{id: 0x1e1a2a, label: 'Dark'}, {id: 0x5a3418, label: 'Brown'}, {id: 0x2a5ab0, label: 'Blue'}, {id: 0x2a8a4a, label: 'Green'}, {id: 0x7a6a2a, label: 'Hazel'}, {id: 0x6a7a8a, label: 'Grey'}]},
  {key: 'cheeks', label: 'Cheeks', values: [{id: 'auto', label: 'Natural'}, {id: 'rosy', label: 'Rosy'}, {id: 'lines', label: 'Blush lines'}, {id: 'none', label: 'Plain'}]},
  {key: 'brows', label: 'Eyebrows', values: [{id: 'none', label: 'None'}, {id: 'soft', label: 'Soft'}, {id: 'straight', label: 'Straight'}, {id: 'bold', label: 'Bold'}, {id: 'worried', label: 'Worried'}]},
  {key: 'eyeShape', label: 'Eye shape', values: [{id: 'round', label: 'Round'}, {id: 'lashes', label: 'Lashes'}, {id: 'sparkle', label: 'Sparkle'}, {id: 'sleepy', label: 'Sleepy'}, {id: 'happy', label: 'Happy'}, {id: 'wink', label: 'Wink'}]},
  {key: 'mouth', label: 'Mouth', values: [{id: 'smile', label: 'Smile'}, {id: 'grin', label: 'Grin'}, {id: 'open', label: 'Open'}, {id: 'cat', label: 'Cat'}, {id: 'smirk', label: 'Smirk'}, {id: 'tongue', label: 'Tongue out'}]},
  {key: 'nose', label: 'Nose', values: [{id: 'none', label: 'None'}, {id: 'button', label: 'Button'}, {id: 'dot', label: 'Dot'}, {id: 'line', label: 'Line'}]},
  {key: 'freckles', label: 'Freckles', values: [{id: 'none', label: 'None'}, {id: 'some', label: 'Freckles'}]},
  {key: 'shirt', label: 'Top', values: [{id: 0x3d6fb8, label: 'Blue'}, {id: 0x3f8f4f, label: 'Green'}, {id: 0x8c2f2f, label: 'Red'}, {id: 0x7a5a2a, label: 'Brown'}, {id: 0x8a8f98, label: 'Grey'}, {id: 0xd8b040, label: 'Yellow'}, {id: 0x6a3a8a, label: 'Purple'}, {id: 0x2a8a8a, label: 'Teal'}, {id: 0xe8e4d8, label: 'White'}, {id: 0x2a2a30, label: 'Black'}, {id: 0xd8703a, label: 'Orange'}, {id: 0xd87aa0, label: 'Pink'}]},
  {key: 'pants', label: 'Trousers', values: [{id: 0x5c4a2a, label: 'Brown'}, {id: 0x2a3a5c, label: 'Navy'}, {id: 0x3a3a3a, label: 'Charcoal'}, {id: 0x6a4a8a, label: 'Plum'}, {id: 0x1e1e22, label: 'Black'}, {id: 0x7a7a80, label: 'Grey'}, {id: 0x3a5a2a, label: 'Green'}, {id: 0xb09a6a, label: 'Tan'}, {id: 0x3a5a9a, label: 'Blue'}, {id: 0x7a2a2a, label: 'Red'}]},
  {key: 'outfit', label: 'Outfit', only: 'female', values: [{id: 'none', label: 'Skirt'}, {id: 'gown', label: 'Gown'}, {id: 'pinafore', label: 'Pinafore'}, {id: 'puff', label: 'Puff sleeves'}, {id: 'sash', label: 'Sash and bow'}, {id: 'tiered', label: 'Tiered skirt'}, {id: 'bodice', label: 'Laced bodice'}]},
  {key: 'dressCol', label: 'Dress colour', only: 'female', dress: true, values: [{id: 0xaa4c8a, label: 'Rose'}, {id: 0xd87aa0, label: 'Pink'}, {id: 0x3d6fb8, label: 'Blue'}, {id: 0x2a8a8a, label: 'Teal'}, {id: 0x3f7a4f, label: 'Green'}, {id: 0x6a3a8a, label: 'Purple'}, {id: 0x8c2f2f, label: 'Red'}, {id: 0xd8b040, label: 'Yellow'}, {id: 0xe8e4d8, label: 'White'}, {id: 0x2a2a30, label: 'Black'}, {id: 0x7a5a2a, label: 'Brown'}]},
  {key: 'trimCol', label: 'Trim', only: 'female', dress: true, values: [{id: 0xf2ece0, label: 'White'}, {id: 0xf2c8d8, label: 'Pink'}, {id: 0xd8b048, label: 'Gold'}, {id: 0x2a2a30, label: 'Black'}, {id: 0x3d6fb8, label: 'Blue'}, {id: 0x8c2f2f, label: 'Red'}]},
  {key: 'acc', label: 'Accessory', values: [{id: 'none', label: 'None'}, {id: 'flowers', label: 'Flower crown'}]},
  {key: 'boots', label: 'Boots', values: [{id: 0x5a3a22, label: 'Brown'}, {id: 0x1e1a18, label: 'Black'}, {id: 0x6a6a70, label: 'Grey'}, {id: 0x7a2a22, label: 'Red'}, {id: 0x9a7a4a, label: 'Tan'}]},
];
let look = {gender: 'male', hair: 'short', hairCol: 0x4a2a14, skin: 0xe8c39c, shirt: 0x3d6fb8, pants: 0x5c4a2a, eye: 0x1e1a2a, cheeks: 'auto', boots: 0x5a3a22, outfit: 'none', dressCol: 0xaa4c8a, trimCol: 0xf2ece0, acc: 'none', brows: 'none', eyeShape: 'round', mouth: 'smile', nose: 'none', freckles: 'none'};
const LOOK_PLAIN = { outfit: 'none', acc: 'none', brows: 'none', eyeShape: 'round', mouth: 'smile', nose: 'none', freckles: 'none' };   /* someone whose game doesn't send these yet */
let lookMade = false;
try { const d = JSON.parse(localStorage.getItem('lowpolyLook')); if (d) { look = {...look, ...d.look}; lookMade = !!d.made; } } catch (e) {}
const saveLook = () => { try { localStorage.setItem('lowpolyLook', JSON.stringify({look, made: lookMade})); } catch (e) {} };

// ----- renderer, scene, camera -----
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const HORIZON = 0xcfe6ea;
const GLOW_MATS = [], LIGHT_SPOTS = [];   // window and lamp glass, and where light comes from at night
scene.background = new THREE.Color(HORIZON);
scene.fog = new THREE.Fog(HORIZON, 50, 120);
// a gradient sky dome with a soft sun glow
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x3d7fc9) }, mid: { value: new THREE.Color(0x8cc4e6) }, bot: { value: new THREE.Color(HORIZON) }, sunDir: { value: new THREE.Vector3(12, 22, 8).normalize() }, sunCol: { value: new THREE.Color(1, 0.85, 0.6) } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 top, mid, bot, sunDir, sunCol; varying vec3 vP;
    void main(){ float h = vP.y; vec3 c = h > 0.25 ? mix(mid, top, smoothstep(0.25, 0.9, h)) : mix(bot, mid, smoothstep(-0.05, 0.25, h));
      float s = max(dot(vP, sunDir), 0.0); c += sunCol * (pow(s, 64.0) * 0.9 + pow(s, 6.0) * 0.18);
      gl_FragColor = vec4(c, 1.0); }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), skyMat);
scene.add(sky);
// soft puffy clouds drifting overhead
const clouds = new THREE.Group(); scene.add(clouds);
{
  const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdde8f0, emissiveIntensity: 0.35, flatShading: true, roughness: 1, fog: false });
  const cr = (() => { let q = 3; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 4 + cr() * 3; j++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(3 + cr() * 3, 0), cm);
      b.position.set(j * 4 - 6 + cr() * 2, cr() * 2, cr() * 3); b.scale.y = 0.55; c.add(b);
    }
    const a = cr() * Math.PI * 2, r = 70 + cr() * 60;
    c.position.set(Math.cos(a) * r, 45 + cr() * 15, Math.sin(a) * r); c.rotation.y = cr() * 3;
    clouds.add(c);
  }
}
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 200);
let yaw = 0.6, pitch = 0.95, dist = 30;
const target = new THREE.Vector3(0, 1, 0);
function placeCamera(){
  camera.position.set(
    target.x + dist * Math.sin(yaw) * Math.sin(pitch),
    target.y + dist * Math.cos(pitch),
    target.z + dist * Math.cos(yaw) * Math.sin(pitch));
  camera.lookAt(target);
}
const hemi = new THREE.HemisphereLight(0xdff0ff, 0x4a5a2a, 0.9); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe7c2, 2.1);
sun.position.set(12, 22, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 90 });
scene.add(sun, sun.target);
// keep the shadow area centred on the player and give new meshes shadows
const SUN_OFF = new THREE.Vector3(18, 33, 12);   // moved round by the day and night cycle
let shadowScan = 0;
function updateSun(){
  sun.position.copy(target).add(SUN_OFF); sun.target.position.copy(target);
  if (performance.now() > shadowScan) {
    shadowScan = performance.now() + 1500;
    scene.traverse(o => { if (o.isMesh && !o.userData.shadowSet && o !== sky && o.parent !== clouds) {
      o.userData.shadowSet = true; o.castShadow = o !== groundMesh && o !== river; o.receiveShadow = true; } });
  }
}

const mat = c => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9, metalness: 0 });
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const town = new THREE.Group();
scene.add(town);

