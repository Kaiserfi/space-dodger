// ----- the Bag: 30 slots. Gathering code calls addItem(name, qty, icon) -----
// Item icons are our own small drawings: a cut log with its end rings, and a hand axe.
const LOG_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <rect x="1" y="5" width="12" height="6" rx="1" fill="#8a5a2b"/>
  <rect x="2" y="6" width="10" height="1" fill="#a06d37"/>
  <rect x="2" y="9" width="10" height="1" fill="#6b4220"/>
  <ellipse cx="12.5" cy="8" rx="2.2" ry="3" fill="#e0b97f" stroke="#7a4d22" stroke-width="0.8"/>
  <circle cx="12.5" cy="8" r="1" fill="none" stroke="#a9773f" stroke-width="0.6"/></svg>`;
/* oak logs: darker, heavier bark and a richer heartwood */
const OAK_LOG_ICON = LOG_ICON.replace('#8a5a2b', '#5e3c1c').replace('#a06d37', '#7a5228').replace('#6b4220', '#43290f').replace('#e0b97f', '#c8925a').replace('#a9773f', '#8a5a2b');
const AXE_ICON = `<svg viewBox="0 0 16 16" width="26" height="26"><g transform="translate(-0.8 0.9) rotate(35 8 8) scale(0.92)">
  <rect x="7.1" y="4" width="1.8" height="11.5" rx="0.8" fill="#8a5a2a" stroke="#4a2e14" stroke-width="0.6"/>
  <path d="M6.4 2.6 L9.4 2.6 Q11.2 2.2 13.6 0.9 Q14.6 4.6 13.6 8.4 Q11.4 6.9 9.4 6.6 L6.4 6.6 Z" fill="#cd7f32" stroke="#5a3a1a" stroke-width="0.7" stroke-linejoin="round"/>
  <path d="M13.5 1.4 Q14.3 4.6 13.5 7.9" fill="none" stroke="#f2c28a" stroke-width="0.7"/>
  <rect x="4.9" y="3.1" width="1.7" height="3" rx="0.3" fill="#a8682a" stroke="#5a3a1a" stroke-width="0.6"/></g></svg>`;   /* side on: a flared blade with a short butt behind the handle */
const PICK_ICON = `<svg viewBox="0 0 16 16" width="26" height="26"><g transform="translate(-0.8 0.9) rotate(35 8 8) scale(0.92)">
  <rect x="7.1" y="4.2" width="1.8" height="11.3" rx="0.8" fill="#8a5a2a" stroke="#4a2e14" stroke-width="0.6"/>
  <path d="M0.6 7.4 Q3.5 2.6 8 2.4 Q12.5 2.6 15.4 7.4 Q12.3 4.9 8 4.9 Q3.7 4.9 0.6 7.4 Z" fill="#cd7f32" stroke="#5a3a1a" stroke-width="0.7" stroke-linejoin="round"/>
  <path d="M2.3 5.6 Q5 3.3 8 3.2" fill="none" stroke="#f2c28a" stroke-width="0.6"/>
  <rect x="6.6" y="2.2" width="2.8" height="3" rx="0.5" fill="#a8682a" stroke="#5a3a1a" stroke-width="0.6"/></g></svg>`;   /* a curved head, pointed at both ends */
const ORE_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2.5 10 L4.5 5 L9.5 3.5 L13.5 6.5 L12.5 12 L6 13 Z" fill="#6e6a62" stroke="#3a3833" stroke-width="0.8"/>
  <rect x="6" y="7" width="2" height="2" fill="#d9773a"/><rect x="9" y="9" width="2" height="2" fill="#e8934f"/></svg>`;
const BAR_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2 10 L4.5 5.5 L13.5 5.5 L11 10 Z" fill="#cd7f32" stroke="#5a3a1a" stroke-width="0.8"/>
  <rect x="5" y="6.5" width="4" height="1" fill="#f2c28a"/></svg>`;
const TIN_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2.5 10 L4.5 5 L9.5 3.5 L13.5 6.5 L12.5 12 L6 13 Z" fill="#6e6a62" stroke="#3a3833" stroke-width="0.8"/>
  <rect x="6" y="7" width="2" height="2" fill="#dfe6ea"/><rect x="9" y="9" width="2" height="2" fill="#b8c4cc"/></svg>`;
const DAGGER_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M7 2 L9 2 L9.5 9 L6.5 9 Z" fill="#cd7f32" stroke="#5a3a1a" stroke-width="0.8"/>
  <rect x="5" y="9" width="6" height="1.5" fill="#7a4d22"/><rect x="7" y="10.5" width="2" height="3.5" fill="#5a3a1a"/></svg>`;
/* the pair: the same dagger twice, leaning out from each other */
const DAGGERS_ICON = (() => { const inner = DAGGER_ICON.replace(/^<svg[^>]*>|<\/svg>$/g, ''); return `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges"><g transform="translate(-2.2 0.6) rotate(-16 8 9)">${inner}</g><g transform="translate(18.2 0.6) scale(-1 1) rotate(-16 8 9)">${inner}</g></svg>`; })();
const SWORD_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M7.5 1 L8.5 1 L9.2 10 L6.8 10 Z" fill="#cd7f32" stroke="#5a3a1a" stroke-width="0.8"/>
  <rect x="4.5" y="10" width="7" height="1.5" fill="#7a4d22"/><rect x="7.2" y="11.5" width="1.6" height="3" fill="#5a3a1a"/></svg>`;
const SHIELD_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M4 3 L12 3 L12 8 Q12 12 8 14 Q4 12 4 8 Z" fill="#cd7f32" stroke="#5a3a1a" stroke-width="0.8"/>
  <rect x="7.5" y="5" width="1" height="6" fill="#f2c28a"/></svg>`;
// what each smithing recipe makes, and what each piece of gear adds
const NET_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <rect x="7" y="9" width="1.4" height="6" fill="#7a4d22"/><path d="M3 2 Q8 0 13 2 L11 9 L5 9 Z" fill="none" stroke="#d8c890" stroke-width="1"/><path d="M4 4 L12 4 M4.6 6.5 L11.4 6.5 M6 2 L6.5 9 M8 1.5 L8 9 M10 2 L9.5 9" stroke="#b8a870" stroke-width="0.6"/></svg>`;
const ROD_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2 14 L13 2" stroke="#7a4d22" stroke-width="1.3"/><path d="M13 2 Q15 7 12 12" fill="none" stroke="#e8e0c8" stroke-width="0.6"/><rect x="11" y="11.5" width="2" height="1.5" fill="#e04a3a"/><rect x="3.5" y="11" width="2" height="2" fill="#5a5a60"/></svg>`;
const COOKED_SHRIMP_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M4 11 Q6 4 11 5 Q9 7 9 9 Q7 12 4 11 Z" fill="#e8622a" stroke="#7a2a12" stroke-width="0.8"/><path d="M6 6.5 L8 8 M5.5 8.5 L7.5 10" stroke="#a83a12" stroke-width="0.8"/><rect x="10" y="4" width="2" height="2" fill="#1a1a1a"/></svg>`;
const TROUT_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2 8 Q6 4 11 7 L14 4.5 L13.5 8 L14 11.5 L11 9 Q6 12 2 8 Z" fill="#9aae86" stroke="#3e4a32" stroke-width="0.8"/><path d="M4 8.2 Q7 7.4 10.5 8" stroke="#e48a8a" stroke-width="1"/><rect x="4" y="6.6" width="1.2" height="1.2" fill="#1a1a1a"/></svg>`;
const COOKED_TROUT_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2 8 Q6 4 11 7 L14 4.5 L13.5 8 L14 11.5 L11 9 Q6 12 2 8 Z" fill="#c8823a" stroke="#5a3012" stroke-width="0.8"/><path d="M5.5 6 L6.5 10 M8 5.8 L9 10" stroke="#7a4216" stroke-width="0.8"/><rect x="4" y="6.6" width="1.2" height="1.2" fill="#2a1a0a"/></svg>`;
const BREAM_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2 8 Q6 2.5 10.5 6.5 L14 4.5 L13.5 8 L14 11.5 L10.5 9.5 Q6 13.5 2 8 Z" fill="#b8a86a" stroke="#4a4226" stroke-width="0.8"/><path d="M6 4.6 L8.5 3.8 L9 5.6" fill="#8a7a46" stroke="#4a4226" stroke-width="0.5"/><rect x="4" y="6.6" width="1.2" height="1.2" fill="#1a1a1a"/></svg>`;
const COOKED_BREAM_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2 8 Q6 2.5 10.5 6.5 L14 4.5 L13.5 8 L14 11.5 L10.5 9.5 Q6 13.5 2 8 Z" fill="#c8823a" stroke="#5a3012" stroke-width="0.8"/><path d="M5.5 5.5 L6.5 10.5 M8 5.2 L9 10.5" stroke="#7a4216" stroke-width="0.8"/><rect x="4" y="6.6" width="1.2" height="1.2" fill="#2a1a0a"/></svg>`;
const BURNT_BREAM_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2 8 Q6 2.5 10.5 6.5 L14 4.5 L13.5 8 L14 11.5 L10.5 9.5 Q6 13.5 2 8 Z" fill="#2a2420" stroke="#0a0806" stroke-width="0.8"/><rect x="7" y="7" width="1" height="1" fill="#5a3a20"/></svg>`;
const TINDER_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <rect x="3" y="6" width="10" height="7" rx="1" fill="#8a6a3a" stroke="#3a2a14" stroke-width="0.8"/><rect x="3" y="5" width="10" height="2" fill="#a8844a" stroke="#3a2a14" stroke-width="0.6"/><path d="M6 3 L8 1 L9 3.5 L11 2.5 L10 5 Z" fill="#f0a030"/><rect x="7" y="9" width="2" height="2" fill="#c8c8c8"/></svg>`;
const WORMS_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M3 10 L13 10 L12 14 L4 14 Z" fill="#8a6a42" stroke="#3a2a18" stroke-width="0.8"/><path d="M3.5 10 Q5 5 7 8 Q8.5 4 10 7.5 Q11.5 5 12.5 9" fill="none" stroke="#d87a7a" stroke-width="1.4"/><rect x="4" y="10" width="8" height="1" fill="#4a3018"/></svg>`;
const BURNT_TROUT_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2 8 Q6 4 11 7 L14 4.5 L13.5 8 L14 11.5 L11 9 Q6 12 2 8 Z" fill="#2a2420" stroke="#0a0806" stroke-width="0.8"/><rect x="7" y="7" width="1" height="1" fill="#5a3a20"/></svg>`;
const BURNT_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M4 11 Q6 4 11 5 Q9 7 9 9 Q7 12 4 11 Z" fill="#2a2420" stroke="#0a0806" stroke-width="0.8"/><rect x="6" y="7" width="1" height="1" fill="#5a3a20"/></svg>`;
const BREAD_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2 10 Q2 4 8 4 Q14 4 14 10 L13 12 L3 12 Z" fill="#c8883a" stroke="#6a3a12" stroke-width="0.8"/><path d="M5 6 L6 8 M8 5.5 L8.5 7.5 M11 6 L10.5 8" stroke="#f0c870" stroke-width="0.8"/></svg>`;
const CLOAK_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M5 2 L11 2 L14 14 L2 14 Z" fill="#5c7e44" stroke="#d8b048" stroke-width="1"/><circle cx="8" cy="8" r="2" fill="none" stroke="#e2b84c" stroke-width="0.8"/><rect x="7.4" y="2" width="1.2" height="1.2" fill="#e2b84c"/></svg>`;
// food you can eat from the bag
const FOOD = { 'Trout': 'You eat the trout. Flaky and buttery.', 'Burnt trout': 'You eat the burnt trout. Mostly charcoal.', 'Bream': 'You eat the bream. A bit bony, but sweet.', 'Burnt bream': 'You eat the burnt bream. Crunchy, in the wrong way.', 'Shrimp': 'You eat the shrimp. Sweet and smoky.', "Brenna's bread": "You eat a hunk of Brenna's bread. Still warm, somehow.", 'Burnt shrimp': 'You eat the burnt shrimp. Crunchy. Very crunchy.' };
const HEALS = { 'Trout': 6, 'Burnt trout': 0, 'Bream': 5, 'Burnt bream': 0, 'Shrimp': 3, "Brenna's bread": 5, 'Burnt shrimp': 0, 'Bread': 4, 'Burnt bread': 0, 'Cooked chicken': 3, 'Cooked beef': 3, 'Burnt chicken': 0, 'Burnt beef': 0 };
FOOD['Bread'] = 'You eat the bread. Simple, but it fills you up.'; FOOD['Cooked chicken'] = 'You eat the roast chicken. Juicy and golden.'; FOOD['Cooked beef'] = 'You eat the beef. Hearty and filling.'; FOOD['Burnt chicken'] = 'You eat the burnt chicken. Charcoal with a hint of bird.'; FOOD['Burnt beef'] = 'You eat the burnt beef. It crunches.'; FOOD['Burnt bread'] = 'You eat the burnt bread. It tastes like the bottom of a fireplace.';
const HELM_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M3 10 Q3 3 8 3 Q13 3 13 10 L13 12 L11 12 L11 9 L5 9 L5 12 L3 12 Z" fill="#b8742e" stroke="#5a3a1a" stroke-width="0.8"/><rect x="3" y="8" width="10" height="1.4" fill="#6a3c18"/><path d="M7.4 1.2 L8.6 1.2 L8 3 Z" fill="#e0a458"/></svg>`;
const CHEST_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M5 2 L11 2 L14 5 L12.5 7 L12 14 L4 14 L3.5 7 L2 5 Z" fill="#b8742e" stroke="#5a3a1a" stroke-width="0.8"/><rect x="7.5" y="4" width="1" height="8" fill="#e0a458"/><rect x="4" y="11" width="8" height="1.2" fill="#6a3c18"/></svg>`;
const LEGS_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M4 2 L12 2 L12.5 14 L9 14 L8 6 L7 14 L3.5 14 Z" fill="#b8742e" stroke="#5a3a1a" stroke-width="0.8"/><rect x="4" y="2" width="8" height="1.4" fill="#6a3c18"/><circle cx="5.5" cy="9" r="0.9" fill="#e0a458"/><circle cx="10.5" cy="9" r="0.9" fill="#e0a458"/></svg>`;
const BOOTS_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <path d="M2 4 L6 4 L6 10 L8 11 L8 13 L2 13 Z M9 4 L13 4 L13 10 L15 11 L15 13 L9 13 Z" fill="#b8742e" stroke="#5a3a1a" stroke-width="0.8"/><rect x="2" y="5.5" width="4" height="1" fill="#6a3c18"/><rect x="9" y="5.5" width="4" height="1" fill="#6a3c18"/></svg>`;
const TORCH_ICON = `<svg viewBox="0 0 16 16" width="26" height="26" shape-rendering="crispEdges">
  <rect x="7" y="6" width="2" height="9" fill="#7a4d22"/><rect x="6" y="5" width="4" height="2" fill="#4a3220"/>
  <path d="M8 0.5 Q11 3 10 5 L6 5 Q5 3 8 0.5 Z" fill="#ff9a2a"/><path d="M8 2 Q9.5 3.5 9 5 L7 5 Q6.5 3.5 8 2 Z" fill="#ffe07a"/></svg>`;
const ITEMS = {
  'Torch': { slot: 'shield', icon: TORCH_ICON, light: true },
  "Villager's cloak": { slot: 'back', def: 1, icon: CLOAK_ICON },
  'Bronze daggers': { slot: 'weapon', atk: 3, twoHand: true, icon: DAGGERS_ICON },   /* a pair: both hands, so no shield */
  'Bronze helmet': { slot: 'head', def: 2, icon: HELM_ICON },
  'Bronze chestplate': { slot: 'body', def: 8, icon: CHEST_ICON },
  'Bronze leg armour': { slot: 'legs', def: 5, icon: LEGS_ICON },
  'Bronze boots': { slot: 'feet', def: 1, icon: BOOTS_ICON },
  'Bronze sword':  { slot: 'weapon', atk: 6, icon: SWORD_ICON },
  'Bronze shield': { slot: 'shield', def: 6, icon: SHIELD_ICON },
  'Iron daggers': { slot: 'weapon', atk: 5, req: 10, twoHand: true, icon: ironIcon(DAGGERS_ICON) },
  'Iron helmet': { slot: 'head', def: 4, req: 10, icon: ironIcon(HELM_ICON) },
  'Iron chestplate': { slot: 'body', def: 13, req: 10, icon: ironIcon(CHEST_ICON) },
  'Iron leg armour': { slot: 'legs', def: 8, req: 10, icon: ironIcon(LEGS_ICON) },
  'Iron boots': { slot: 'feet', def: 2, req: 10, icon: ironIcon(BOOTS_ICON) },
  'Iron sword':  { slot: 'weapon', atk: 10, req: 10, icon: ironIcon(SWORD_ICON) },
  'Iron shield': { slot: 'shield', def: 10, req: 10, icon: ironIcon(SHIELD_ICON) }
};
// iron's icons are bronze's, in cool grey: every colour keeps its brightness and loses its warmth
function ironIcon(svg){ return svg.replace(/#([0-9a-f]{6})\b/gi, (_, h) => { const n = parseInt(h, 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (Math.abs(r - g) < 12 && Math.abs(g - b) < 12) return '#' + h;   /* already grey (outlines, shine): leave it */
  const l = Math.round(0.3 * r + 0.55 * g + 0.15 * b), c = v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'); return '#' + c(l - 6) + c(l + 2) + c(l + 12); }); }
// iron tools: only the metal head goes grey, the wooden handle stays wood
const ironHead = svg => svg.replace(/#(cd7f32|5a3a1a|f2c28a|a8682a)\b/gi, m => ironIcon(m));
const IRON_ORE_ICON = ironIcon(ORE_ICON).replace(/#c2652b|#d9773a/gi, '#8a5a42'), IRON_BAR_ICON = ironIcon(BAR_ICON);
const RECIPES = [
  { name: 'Bronze daggers',    bars: 1, level: 1, xp: 12.5 },   /* a pair from one bar */
  { name: 'Bronze axe',        bars: 1, level: 1, xp: 12.5 },
  { name: 'Bronze pickaxe',    bars: 1, level: 1, xp: 12.5 },
  { name: 'Bronze boots',      bars: 1, level: 3, xp: 12.5 },
  { name: 'Bronze helmet',     bars: 2, level: 8, xp: 25 },
  { name: 'Bronze sword',      bars: 1, level: 1, xp: 12.5 },
  { name: 'Bronze shield',     bars: 2, level: 5, xp: 25 },
  { name: 'Bronze leg armour', bars: 3, level: 12, xp: 37.5 },
  { name: 'Bronze chestplate', bars: 5, level: 15, xp: 62.5 },
  // iron, from the north's rocks: the step up from bronze, for the forest beyond
  { name: 'Iron daggers',      bars: 1, level: 15, xp: 25, bar: 'Iron bar' },
  { name: 'Iron axe',          bars: 1, level: 15, xp: 25, bar: 'Iron bar' },
  { name: 'Iron pickaxe',      bars: 1, level: 15, xp: 25, bar: 'Iron bar' },
  { name: 'Iron boots',        bars: 1, level: 17, xp: 25, bar: 'Iron bar' },
  { name: 'Iron helmet',       bars: 2, level: 22, xp: 50, bar: 'Iron bar' },
  { name: 'Iron sword',        bars: 1, level: 15, xp: 25, bar: 'Iron bar' },
  { name: 'Iron shield',       bars: 2, level: 19, xp: 50, bar: 'Iron bar' },
  { name: 'Iron leg armour',   bars: 3, level: 26, xp: 75, bar: 'Iron bar' },
  { name: 'Iron chestplate',   bars: 5, level: 29, xp: 125, bar: 'Iron bar' }
];
const BAG_SIZE = 30;
const bag = [];
let COINS = 0;   /* the purse: coins have their own counter beside the bag, and take no slot */
const AXE_NAME = "Bronze axe";
const PICK_NAME = 'Bronze pickaxe';
// any axe or pickaxe will do; iron ones work a little faster
const hasAxe = () => hasTool('Iron axe') || hasTool(AXE_NAME), hasPick = () => hasTool('Iron pickaxe') || hasTool(PICK_NAME);
const chopFrames = rec => (rec.kind === 'rock' ? hasTool('Iron pickaxe') : hasTool('Iron axe')) ? 150 : CHOP_FRAMES;
const iconOf = n => (ITEMS[n] && ITEMS[n].icon) || ICON_FOR[n] || '';
const ORE_NAME = 'Copper ore';
// food doesn't stack: every piece takes its own slot, so the bag limits how much you can carry into a fight
const SINGLE = new Set(['Raw shrimp', 'Shrimp', 'Raw trout', 'Trout', 'Raw bream', 'Bream', 'Raw chicken', 'Cooked chicken', 'Raw beef', 'Cooked beef', 'Bread dough', 'Bread', "Brenna's bread"]);   /* burnt food can't be eaten, so it stacks */
const roomForOne = name => bag.length < BAG_SIZE || (!SINGLE.has(name) && hasItem(name));
function addItem(name, qty = 1, icon = '') {
  if (OLD_DAGGERS[name]) { name = OLD_DAGGERS[name]; icon = ICON_FOR[name]; }   /* from an older game: a single dagger is a pair now */
  if (name === 'Coins') { COINS += qty; renderBag(); return true; }
  if (SINGLE.has(name)) {   // one slot each; as many as fit (and false if not all of them did)
    const n = Math.min(qty, BAG_SIZE - bag.length);
    for (let i = 0; i < n; i++) bag.push({ name, qty: 1, icon, slot: freeSlot() });
    if (n > 0) renderBag();
    return n === qty;
  }
  const have = bag.find(i => i.name === name);
  if (have) have.qty += qty;
  else if (bag.length < BAG_SIZE) bag.push({ name, qty, icon, slot: freeSlot() });
  else return false;
  renderBag();
  return true;
}
// each item keeps its own slot, so you can arrange your bag how you like
function freeSlot(){ for (let i = 0; i < BAG_SIZE; i++) if (!bag.some(it => it.slot === i)) return i; return -1; }
function hasItem(name){ if (name === 'Coins') return COINS > 0; return bag.some(i => i.name === name); }
/* the toolbelt: one of each skilling tool, kept out of the bag; skilling works from the bag or the belt */
const TOOLBELT_SLOTS = { axe: 'Axe', pick: 'Pickaxe', hammer: 'Hammer', net: 'Fishing net', rod: 'Fishing rod', hoe: 'Hoe', can: 'Watering can', tinder: 'Tinderbox' };
const toolbelt = { axe: null, pick: null, hammer: null, net: null, rod: null, hoe: null, can: null, tinder: null };
function beltSlotFor(name){ return /axe$/.test(name) && !/pickaxe$/.test(name) ? 'axe' : /pickaxe$/.test(name) ? 'pick' : name === 'Hammer' ? 'hammer' : /fishing net$/.test(name) ? 'net' : /fishing rod$/.test(name) ? 'rod' : name === 'Hoe' ? 'hoe' : name === 'Watering can' ? 'can' : name === 'Tinderbox' ? 'tinder' : null; }
function hasTool(name){ return hasItem(name) || Object.values(toolbelt).includes(name); }
function renderBag() {
  let html = '';
  for (let i = 0; i < BAG_SIZE; i++) {
    const k = bag.findIndex(x => x.slot === i), it = bag[k];
    html += it
      ? it.name === 'Watering can' ? `<div class="slot full" data-i="${k}" data-s="${i}" title="Watering can (${FARM_CAN.n} of ${CAN_MAX} waterings left)">${it.icon}<span class="qty" style="color:#7ab8f0">${FARM_CAN.n}</span></div>`
      : `<div class="slot full" data-i="${k}" data-s="${i}" title="${it.name}${statText(it.name) ? ' (' + statText(it.name) + ')' : ''}">${it.icon}<span class="qty">${it.qty > 1 ? it.qty : ''}</span></div>`
      : `<div class="slot" data-s="${i}"></div>`;
  }
  document.getElementById('bagGrid').innerHTML = html;
  document.getElementById('bagFoot').innerHTML = `<span>${bag.length} / ${BAG_SIZE} slots used</span><span class="purse" title="Coins">${COIN_ICON}<b>${COINS.toLocaleString()}</b></span>`;
}
// no starting kit: the tools are handed out during A Hearty Welcome
setTimeout(() => { const d = document.getElementById('questDone');
  d.innerHTML = d.innerHTML.replace('COIN', COIN_ICON).replace('BREAD', BREAD_ICON).replace('CLOAK', CLOAK_ICON);
  drawEmblem(document.getElementById('qEmblem').getContext('2d'), 60, 60, 54, '#3a5a2a', '#efdcb2');
  document.getElementById('questDoneBtn').addEventListener('click', () => { d.hidden = true; }); }, 0);   // after the icons below are defined
document.querySelectorAll('.subTabs button').forEach(b => b.addEventListener('click', () => {
  statsSub = b.dataset.sub;
  document.querySelectorAll('.subTabs button').forEach(x => x.classList.toggle('on', x === b));
  renderStats();
}));
renderStats();

