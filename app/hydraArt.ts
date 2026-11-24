// The secret Elemental Hydra. It is built from separate parts, so any combination works:
// 4 bodies x 4 heads x 4 legs x 4 arms x 4 wings, plus colours.
// Every part is drawn on the same 200 x 200 canvas, so they always line up.

export type HydraLook = {
  body: number; head: number; legs: number; arms: number; wings: number; // 0 to 3 each
  bodyColor: number; wingColor: number; // 0 to 7 (see PALETTES)
};
export const DEFAULT_LOOK: HydraLook = { body: 0, head: 0, legs: 0, arms: 0, wings: 0, bodyColor: 4, wingColor: 5 };

export const PART_NAMES = {
  body: ["Round", "Long", "Armored", "Spiky"],
  head: ["Drake", "Serpent", "Ram", "Crown"],
  legs: ["Stubby", "Raptor", "Heavy", "Webbed"],
  arms: ["Claws", "Reachers", "Flippers", "Fists"],
  wings: ["Bat", "Feather", "Insect", "Fan"],
};
export type PartKey = keyof typeof PART_NAMES;
export const PART_LABELS: Record<PartKey, string> = { body: "Body", head: "Heads", legs: "Legs", arms: "Arms", wings: "Wings" };

type Pal = { name: string; main: string; dark: string; light: string };
export const PALETTES: Pal[] = [
  { name: "Ember", main: "#d9534f", dark: "#8a1f1b", light: "#f3a29f" },
  { name: "Ocean", main: "#2a7fdc", dark: "#0b3d91", light: "#9bd0ff" },
  { name: "Storm", main: "#f2b61c", dark: "#8a6200", light: "#ffe27a" },
  { name: "Forest", main: "#3fae49", dark: "#1b5e2a", light: "#a6e8a0" },
  { name: "Shadow", main: "#5b5f73", dark: "#23252f", light: "#a9adc2" },
  { name: "Royal", main: "#7b4fd6", dark: "#3b1f85", light: "#c6a8ff" },
  { name: "Rose", main: "#e86aa6", dark: "#9c2a64", light: "#ffb6d6" },
  { name: "Pearl", main: "#e7e3d8", dark: "#8c8576", light: "#ffffff" },
];

// The four heads always wear the four element colours
const ELEM = {
  fire: { main: "#d62828", dark: "#7a0d0d", light: "#ffd23f" },
  water: { main: "#2a7fdc", dark: "#0b3d91", light: "#9bd0ff" },
  electric: { main: "#ffc928", dark: "#8a6200", light: "#fff3a0" },
  grass: { main: "#3fae49", dark: "#1b5e2a", light: "#a6e8a0" },
};
type ElemKey = keyof typeof ELEM;

const K = "#161616";
const sk = (c: string, w = 3) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const mir = (s: string) => `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
const pick = (n: number, len: number) => (Number.isInteger(n) && n >= 0 && n < len ? n : 0);

// ---------- wings (left side drawn, right side mirrored; shoulder at 84,110) ----------
function wing(k: number, p: Pal): string {
  const s = sk(p.dark);
  if (k === 0)
    return `<path d="M84 112L26 98Q40 92 38 80L22 62Q42 62 46 50L44 32Q64 42 70 62L84 100Z" fill="${p.main}" ${s}/>` +
      `<path d="M84 108L44 36M84 108L24 64M84 108L28 96" fill="none" stroke="${p.dark}" stroke-width="2.5" stroke-linecap="round"/>`;
  if (k === 1)
    return [-80, -58, -36, -14, 8].map((a, i) => `<g transform="translate(84 110) rotate(${a})"><ellipse cx="-34" cy="0" rx="36" ry="9" fill="${i % 2 ? p.light : p.main}" ${sk(p.dark, 2)}/></g>`).join("");
  if (k === 2)
    return `<path d="M84 108C62 84 40 52 20 58C24 82 52 104 84 112Z" fill="${p.light}" fill-opacity=".75" ${s}/>` +
      `<path d="M84 114C64 114 40 124 34 144C60 146 80 132 84 114Z" fill="${p.light}" fill-opacity=".75" ${s}/>` +
      `<path d="M84 110L26 62M84 112L38 140" fill="none" stroke="${p.dark}" stroke-width="2"/>`;
  return `<path d="M84 110L22 62Q8 92 26 128Q44 120 84 110Z" fill="${p.main}" ${s}/>` +
    `<path d="M84 110L22 64M84 110L12 92M84 110L20 114M84 110L28 126" fill="none" stroke="${p.dark}" stroke-width="2"/>`;
}

// ---------- legs (left side drawn, right side mirrored; hip at 76,150) ----------
function legs(k: number, p: Pal): string {
  const s = sk(p.dark);
  if (k === 0) return `<path d="M62 146C56 160 56 172 62 178H92V146Z" fill="${p.main}" ${s}/><ellipse cx="76" cy="179" rx="19" ry="7" fill="${p.dark}" ${s}/>`;
  if (k === 1)
    return `<path d="M66 144L56 164L70 170L62 180H90L84 172L88 144Z" fill="${p.main}" ${s}/>` +
      `<path d="M62 180L52 183L62 173ZM74 180L68 185L77 173Z" fill="${p.light}" ${sk(p.dark, 1.5)}/>`;
  if (k === 2)
    return `<path d="M58 142H96V174Q96 182 88 182H66Q58 182 58 174Z" fill="${p.main}" ${s}/><ellipse cx="77" cy="158" rx="14" ry="8" fill="${p.dark}"/>` +
      `<path d="M64 182L66 176L70 182ZM75 182L77 176L81 182ZM86 182L88 176L92 182Z" fill="${p.light}"/>`;
  return `<path d="M66 144H88L84 168H70Z" fill="${p.main}" ${s}/><path d="M52 180Q60 164 77 168Q94 164 102 180Z" fill="${p.dark}" ${s}/>` +
    `<path d="M62 180L66 170M77 180V170M92 180L88 170" stroke="${p.light}" stroke-width="2" fill="none"/>`;
}

// ---------- arms (left side drawn, right side mirrored; shoulder at 66,112) ----------
function arms(k: number, p: Pal): string {
  const s = sk(p.dark);
  if (k === 0)
    return `<path d="M70 108C54 110 42 122 44 138C50 134 54 136 56 142C60 136 64 136 68 140C66 130 70 120 74 118Z" fill="${p.main}" ${s}/>` +
      `<path d="M44 138L40 148L50 142ZM56 142L54 152L62 144Z" fill="${p.light}" ${sk(p.dark, 1.5)}/>`;
  if (k === 1)
    return `<path d="M68 112C46 118 34 138 40 158" fill="none" stroke="${p.dark}" stroke-width="14" stroke-linecap="round"/>` +
      `<path d="M68 112C46 118 34 138 40 158" fill="none" stroke="${p.main}" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M40 158L32 168M40 158L40 170M40 158L48 168" stroke="${p.dark}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (k === 2)
    return `<path d="M70 108C48 112 32 130 38 150C54 146 68 134 74 120Z" fill="${p.main}" ${s}/>` +
      `<path d="M66 114L42 138M68 120L48 146M70 126L56 148" stroke="${p.dark}" stroke-width="2" fill="none"/>`;
  return `<path d="M68 110C56 116 52 128 54 138" fill="none" stroke="${p.dark}" stroke-width="15" stroke-linecap="round"/>` +
    `<path d="M68 110C56 116 52 128 54 138" fill="none" stroke="${p.main}" stroke-width="10" stroke-linecap="round"/>` +
    `<circle cx="54" cy="144" r="11" fill="${p.main}" ${s}/><path d="M44 140L36 138L44 148ZM48 132L42 124L54 130Z" fill="${p.light}" ${sk(p.dark, 1.5)}/>`;
}

// ---------- bodies (with a tail) ----------
function body(k: number, p: Pal): string {
  const s = sk(p.dark);
  const tail = `<path d="M140 140C170 140 186 156 182 176C170 164 158 160 140 158Z" fill="${p.main}" ${s}/><path d="M182 176L190 184L176 180Z" fill="${p.light}"/>`;
  if (k === 0) return tail + `<ellipse cx="100" cy="130" rx="48" ry="38" fill="${p.main}" ${s}/><ellipse cx="100" cy="142" rx="28" ry="24" fill="${p.light}"/>`;
  if (k === 1)
    return tail + `<ellipse cx="100" cy="134" rx="56" ry="28" fill="${p.main}" ${s}/><ellipse cx="100" cy="142" rx="36" ry="16" fill="${p.light}"/>` +
      `<path d="M70 124Q76 132 70 140M130 124Q124 132 130 140" fill="none" stroke="${p.dark}" stroke-width="3" stroke-linecap="round"/>`;
  if (k === 2)
    return tail + `<path d="M54 104Q54 96 66 96H134Q146 96 146 104V150Q146 170 126 170H74Q54 170 54 150Z" fill="${p.main}" ${s}/>` +
      `<rect x="76" y="108" width="48" height="12" rx="5" fill="${p.light}"/><rect x="76" y="124" width="48" height="12" rx="5" fill="${p.light}"/><rect x="76" y="140" width="48" height="12" rx="5" fill="${p.light}"/>` +
      `<path d="M56 122H74M126 122H144M56 138H74M126 138H144M58 154H74M126 154H142" stroke="${p.dark}" stroke-width="3" fill="none"/>`;
  return tail + `<path d="M52 124L38 112L58 112ZM60 104L52 88L70 100ZM140 104L148 88L130 100ZM148 124L162 112L142 112Z" fill="${p.dark}"/>` +
    `<path d="M52 120Q60 98 100 94Q140 98 148 120L142 160Q130 172 100 172Q70 172 58 160Z" fill="${p.main}" ${s}/><ellipse cx="100" cy="144" rx="26" ry="20" fill="${p.light}"/>`;
}

// ---------- heads (drawn around 0,0 and always in their element colour) ----------
function ornament(el: ElemKey): string {
  if (el === "fire") return `<path d="M0 -10C-6 -4 -5 2 0 6C5 2 6 -4 0 -10Z" fill="#ff8a00"/><path d="M0 -4C-2 -1 -2 2 0 4C2 2 2 -1 0 -4Z" fill="#ffd23f"/>`;
  if (el === "water") return `<path d="M0 -10C5 -3 6 1 0 6C-6 1 -5 -3 0 -10Z" fill="#bff0ff" ${sk("#0b3d91", 1.5)}/>`;
  if (el === "electric") return `<path d="M2 -11L-5 1L0 1L-2 8L6 -4L1 -4Z" fill="#fff3a0" ${sk("#8a6200", 1.2)}/>`;
  return `<path d="M0 6C-8 2 -8 -6 0 -9C8 -6 8 2 0 6Z" fill="#a6e8a0" ${sk("#1b5e2a", 1.5)}/><path d="M0 5V-6" stroke="#1b5e2a" stroke-width="1.2"/>`;
}
function head(k: number, el: ElemKey): string {
  const c = ELEM[el], s = sk(c.dark, 2.5);
  const eye = (x: number) => `<circle cx="${x}" cy="-2" r="4.2" fill="#fff"/><circle cx="${x}" cy="-1.5" r="2.4" fill="${c.light}"/><circle cx="${x}" cy="-1.5" r="1.2" fill="${K}"/>`;
  const slit = (x: number) => `<ellipse cx="${x}" cy="-3" rx="3.6" ry="4" fill="${c.light}"/><ellipse cx="${x}" cy="-3" rx="1" ry="3.4" fill="${K}"/>`;
  let h = "";
  if (k === 0)
    h = `<path d="M-12 -10L-18 -24L-6 -13ZM12 -10L18 -24L6 -13Z" fill="${c.dark}"/><ellipse rx="17" ry="14" fill="${c.main}" ${s}/><ellipse cy="7" rx="9" ry="6" fill="${c.light}"/>` +
      `<circle cx="-3" cy="7" r="1.2" fill="${K}"/><circle cx="3" cy="7" r="1.2" fill="${K}"/>` + eye(-8) + eye(8);
  else if (k === 1)
    h = `<path d="M-12 -2L-26 -8L-22 6ZM12 -2L26 -8L22 6Z" fill="${c.light}" ${sk(c.dark, 2)}/><ellipse rx="13" ry="17" fill="${c.main}" ${s}/>` +
      slit(-6) + slit(6) + `<path d="M0 16V22M0 22L-3 25M0 22L3 25" stroke="#e0405a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  else if (k === 2)
    h = `<path d="M-12 -6C-30 -14 -34 8 -20 10M12 -6C30 -14 34 8 20 10" fill="none" stroke="${c.dark}" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M-12 -6C-30 -14 -34 8 -20 10M12 -6C30 -14 34 8 20 10" fill="none" stroke="#f2e4b8" stroke-width="4.5" stroke-linecap="round"/>` +
      `<ellipse rx="17" ry="13" fill="${c.main}" ${s}/><ellipse cy="7" rx="8" ry="5" fill="${c.light}"/>` + eye(-8) + eye(8);
  else
    h = `<ellipse rx="16" ry="15" fill="${c.main}" ${s}/><path d="M-13 -9L-12 -24L-6 -12L0 -28L6 -12L12 -24L13 -9Z" fill="${c.light}" ${sk(c.dark, 2)}/>` +
      eye(-7) + eye(7) + `<path d="M-12 -8L-4 -4M12 -8L4 -4" stroke="${c.dark}" stroke-width="2.5" stroke-linecap="round"/><ellipse cy="8" rx="7" ry="4" fill="${c.light}"/>`;
  return h + `<g transform="translate(0 -9) scale(.9)">${ornament(el)}</g>`;
}

// ---------- the whole hydra: stage 1, 2 or 3 (0 is the egg) ----------
const LAYOUT = [
  { s: 0.74, w: 0.5, heads: [{ x: 100, y: 70, r: 0, el: "fire", bx: 100 }] },
  { s: 0.88, w: 0.75, heads: [{ x: 80, y: 52, r: -6, el: "fire", bx: 90 }, { x: 120, y: 52, r: 6, el: "water", bx: 110 }] },
  { s: 1, w: 1, heads: [
    { x: 46, y: 62, r: -16, el: "fire", bx: 66 }, { x: 80, y: 40, r: -5, el: "water", bx: 88 },
    { x: 120, y: 40, r: 5, el: "electric", bx: 112 }, { x: 154, y: 62, r: 16, el: "grass", bx: 134 },
  ] },
];

export function clampLook(l?: Partial<HydraLook> | null): HydraLook {
  const d = DEFAULT_LOOK, x = l ?? {};
  return {
    body: pick(x.body ?? d.body, 4), head: pick(x.head ?? d.head, 4), legs: pick(x.legs ?? d.legs, 4),
    arms: pick(x.arms ?? d.arms, 4), wings: pick(x.wings ?? d.wings, 4),
    bodyColor: pick(x.bodyColor ?? d.bodyColor, 8), wingColor: pick(x.wingColor ?? d.wingColor, 8),
  };
}

const eggPath = "M100 30C138 30 160 95 160 130C160 168 132 186 100 186C68 186 40 168 40 130C40 95 62 30 100 30Z";
const GOLD = "#f2c94c";
export const HYDRA_EGG =
  `<defs><clipPath id="e-hydra"><path d="${eggPath}"/></clipPath></defs>` +
  `<path d="M82 40L88 12L100 30L112 12L118 40Z" fill="${GOLD}" ${sk("#a67c00", 2)}/>` +
  `<g clip-path="url(#e-hydra)"><rect x="30" y="20" width="70" height="100" fill="#d62828"/><rect x="100" y="20" width="70" height="100" fill="#ffc928"/>` +
  `<rect x="30" y="120" width="70" height="80" fill="#2a7fdc"/><rect x="100" y="120" width="70" height="80" fill="#3fae49"/>` +
  `<path d="M30 112L50 98L70 112L90 98L110 112L130 98L150 112L170 98" fill="none" stroke="${GOLD}" stroke-width="5"/>` +
  `<path d="M100 66L108 84L126 90L108 96L100 114L92 96L74 90L92 84Z" fill="#fff" opacity=".9"/></g>` +
  `<path d="${eggPath}" fill="none" stroke="${GOLD}" stroke-width="5"/>` +
  `<ellipse cx="76" cy="72" rx="8" ry="16" fill="#fff" opacity=".35" transform="rotate(20 76 72)"/>`;

// Shown in the egg picker until all four normal monsters are fully grown
export const LOCKED_EGG =
  `<path d="${eggPath}" fill="#343a46" stroke="#1b1f27" stroke-width="4"/>` +
  `<ellipse cx="76" cy="72" rx="8" ry="16" fill="#fff" opacity=".12" transform="rotate(20 76 72)"/>` +
  `<path d="M90 112V102Q90 90 100 90Q110 90 110 102V112" fill="none" stroke="#9aa3b5" stroke-width="6" stroke-linecap="round"/>` +
  `<rect x="82" y="110" width="36" height="30" rx="6" fill="#9aa3b5"/><circle cx="100" cy="123" r="4.5" fill="#343a46"/><rect x="98" y="125" width="4" height="9" rx="2" fill="#343a46"/>`;

export function hydraSvg(look: Partial<HydraLook> | null | undefined, stage: number): string {
  if (stage <= 0) return HYDRA_EGG;
  const L = clampLook(look), bp = PALETTES[L.bodyColor], wp = PALETTES[L.wingColor];
  const lay = LAYOUT[Math.min(stage, 3) - 1];
  const wingG = (inner: string) => `<g transform="translate(84 110) scale(${lay.w}) translate(-84 -110)">${inner}</g>`;
  const necks = lay.heads.map((h) => {
    const d = `M${h.bx} 124C${h.bx} ${h.y + 52} ${h.x} ${h.y + 42} ${h.x} ${h.y + 14}`;
    return `<path d="${d}" fill="none" stroke="${bp.dark}" stroke-width="20" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${bp.main}" stroke-width="14" stroke-linecap="round"/>`;
  }).join("");
  const heads = lay.heads.map((h) => `<g transform="translate(${h.x} ${h.y}) rotate(${h.r})">${head(L.head, h.el as ElemKey)}</g>`).join("");
  const both = (s: string) => s + mir(s);
  return (
    `<g transform="translate(100 180) scale(${lay.s}) translate(-100 -180)">` +
    wingG(wing(L.wings, wp)) + mir(wingG(wing(L.wings, wp))) +
    both(legs(L.legs, bp)) + necks + body(L.body, bp) + both(arms(L.arms, bp)) + heads + `</g>`
  );
}