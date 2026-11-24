// Hand-drawn SVG art for every monster. Each element has 4 pictures: egg, baby, evolved, final.
// Every picture is drawn on a 200 x 200 canvas. Colours and shapes can be edited freely.

export type BaseElement = "fire" | "water" | "electric" | "grass";
export type Element = BaseElement | "hydra"; // the hydra is the secret fifth monster
type P = [number, number];
type Seg = [P, P, P, P];

export const ELEMENT_LIST: BaseElement[] = ["fire", "water", "electric", "grass"];

export const ELEMENTS: Record<Element, { label: string; tagline: string; names: string[] }> = {
  fire: { label: "Fire", tagline: "Bold and fierce", names: ["Ember Egg", "Emberling", "Pyrodon", "Infernodrake"] },
  water: { label: "Water", tagline: "Calm and clever", names: ["Tide Egg", "Ripple", "Torrentail", "Azure Dragon"] },
  electric: { label: "Electric", tagline: "Fast and fearless", names: ["Spark Egg", "Zapcub", "Voltstripe", "Thundertiger"] },
  grass: { label: "Grass", tagline: "Strong and steady", names: ["Seed Egg", "Sproutle", "Mossback", "Elderoak"] },
  hydra: { label: "Hydra", tagline: "The secret guardian", names: ["Prism Egg", "Hydrapup", "Twinfang", "Elemental Hydra"] },
};

// ---------- small helpers ----------
const K = "#161616";
const o = (c = K, w = 3) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const f = (n: number) => n.toFixed(1);

// A point on a curved segment (t goes from 0 to 1)
function bez(s: Seg, t: number): P {
  const u = 1 - t;
  return [0, 1].map((i) => u * u * u * s[0][i] + 3 * u * u * t * s[1][i] + 3 * u * t * t * s[2][i] + t * t * t * s[3][i]) as P;
}
const bodyPath = (segs: Seg[]) => `M${segs[0][0]} ` + segs.map((s) => `C${s[1]} ${s[2]} ${s[3]}`).join(" ");

// Little triangles (spikes) placed along a curve
function spikes(segs: Seg[], per: number, h: number, w: number, color: string, off: number) {
  let out = "";
  for (const s of segs)
    for (let i = 0; i < per; i++) {
      const t = (i + 0.5) / per;
      const p = bez(s, t), a = bez(s, Math.max(0, t - 0.02)), b = bez(s, Math.min(1, t + 0.02));
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const tx = (b[0] - a[0]) / L, ty = (b[1] - a[1]) / L;
      const nx = ty, ny = -tx;
      const bx = p[0] + nx * off, by = p[1] + ny * off;
      out += `<path d="M${f(bx - (tx * w) / 2)} ${f(by - (ty * w) / 2)}L${f(bx + nx * h)} ${f(by + ny * h)}L${f(bx + (tx * w) / 2)} ${f(by + (ty * w) / 2)}Z" fill="${color}"/>`;
    }
  return out;
}

// Spikes around part of a circle (used for the tiger's lightning mane)
function ring(cx: number, cy: number, r: number, h: number, n: number, a0: number, a1: number, color: string) {
  let out = "";
  const step = (a1 - a0) / (n - 1), da = step * 0.45;
  const pt = (deg: number, rad: number) => `${f(cx + rad * Math.cos((deg * Math.PI) / 180))} ${f(cy + rad * Math.sin((deg * Math.PI) / 180))}`;
  for (let i = 0; i < n; i++) {
    const a = a0 + step * i;
    out += `<path d="M${pt(a - da, r)}L${pt(a, r + h)}L${pt(a + da, r)}Z" fill="${color}"/>`;
  }
  return out;
}

const leaf = (x: number, y: number, r: number, s: number, c = "#6ddb6f") =>
  `<path d="M0 0C${-s * 0.7} ${-s * 0.3} ${-s * 0.6} ${-s} 0 ${-s}C${s * 0.6} ${-s} ${s * 0.7} ${-s * 0.3} 0 0Z" fill="${c}" stroke="#1b5e2a" stroke-width="2" transform="translate(${x} ${y}) rotate(${r})"/>`;

// ---------- eggs ----------
const eggPath = "M100 30C138 30 160 95 160 130C160 168 132 186 100 186C68 186 40 168 40 130C40 95 62 30 100 30Z";
function egg(id: string, base: string, dark: string, behind: string, deco: string) {
  return (
    `<defs><clipPath id="${id}"><path d="${eggPath}"/></clipPath></defs>${behind}` +
    `<path d="${eggPath}" fill="${base}"/><g clip-path="url(#${id})">${deco}</g>` +
    `<path d="${eggPath}" fill="none" stroke="${dark}" stroke-width="4"/>` +
    `<ellipse cx="76" cy="72" rx="8" ry="16" fill="#fff" opacity=".3" transform="rotate(20 76 72)"/>`
  );
}

const fireEgg = egg("e-fire", "#d62828", K,
  `<path d="M82 40L88 12L98 32L106 4L114 32L126 14L122 42Z" fill="${K}"/>`,
  `<path d="M30 120L52 98L70 124L88 98L106 124L124 98L142 124L160 98L172 120V142H30Z" fill="${K}"/>` +
  `<path d="M58 70L66 86L56 92M138 78L130 92L142 100" fill="none" stroke="#9d1111" stroke-width="4" stroke-linecap="round"/>` +
  `<circle cx="84" cy="156" r="4" fill="#ff8a00"/><circle cx="120" cy="150" r="3" fill="#ffd23f"/><circle cx="100" cy="168" r="3" fill="#ff8a00"/>`);

const waterEgg = egg("e-water", "#2a7fdc", "#0b3d91",
  `<path d="M84 40Q86 16 96 30Q100 6 108 30Q118 14 120 40Z" fill="#0b3d91"/>`,
  `<path d="M30 122Q45 108 60 122T90 122T120 122T150 122T180 122V144H30Z" fill="#0b3d91"/>` +
  `<circle cx="72" cy="88" r="6" fill="#19c37d"/><circle cx="124" cy="94" r="5" fill="#19c37d"/><circle cx="98" cy="68" r="4" fill="#19c37d"/>` +
  `<circle cx="84" cy="160" r="5" fill="#19c37d"/><circle cx="124" cy="156" r="4" fill="#19c37d"/>`);

const electricEgg = egg("e-elec", "#ffc928", K,
  `<path d="M84 40L92 14L98 30L106 6L110 28L124 14L120 42Z" fill="#e08a00"/>`,
  `<path d="M108 54L82 112L100 112L88 160L126 98L106 98Z" fill="${K}"/>` +
  `<path d="M42 96Q56 100 62 114M158 96Q144 100 138 114M46 150Q60 146 66 156M154 150Q140 146 134 156" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>` +
  `<path d="M136 56L146 50L142 62L152 56" fill="none" stroke="#3fa9ff" stroke-width="3" stroke-linecap="round"/>`);

const grassEgg = egg("e-grass", "#3fae49", "#1b5e2a",
  `<path d="M100 34V12" stroke="#1b5e2a" stroke-width="4"/>${leaf(100, 18, -40, 22)}${leaf(100, 18, 40, 22)}`,
  `<path d="M30 126Q60 108 100 126T172 122V146H30Z" fill="#1f6b2e"/>` +
  `<path d="M64 76Q76 64 84 78Q72 90 64 76ZM116 88Q128 76 136 90Q124 102 116 88Z" fill="#7be07f"/>` +
  `<path d="M70 156Q80 146 90 158Q80 168 70 156ZM112 154Q122 144 132 156Q122 166 112 154Z" fill="#7be07f"/>`);

// ---------- fire and water dragons share one body: only colours, wings and fins differ ----------
const R = "#d62828", DR = "#9d1111", BEL = "#ffd48a";
type Pal = { main: string; dark: string; belly: string; snout: string; iris: string };
const FIRE: Pal = { main: R, dark: DR, belly: BEL, snout: "#e84a4a", iris: "#ffd23f" };
const WATER: Pal = { main: "#2a7fdc", dark: "#0b3d91", belly: "#cfeaff", snout: "#4a9ae8", iris: "#19c37d" };
const FIN = "#7cc4ff", EMERALD = "#19c37d";
const fin = (d: string) => `<path d="${d}" fill="${FIN}" ${o(WATER.dark, 2.5)}/>`;
const ribs = (d: string) => `<path d="${d}" stroke="${WATER.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

const dragonEyes = (x1: number, x2: number, y: number, iris: string) =>
  [x1, x2].map((x) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="9" fill="#fff"/><circle cx="${x}" cy="${y + 2}" r="6" fill="${iris}"/><circle cx="${x}" cy="${y + 2}" r="3" fill="${K}"/>`).join("");

// Baby dragon. sides = wings (fire) or fins (water); head = horns or head fins
function babyDragon(p: Pal, sides: string, head: string) {
  return (
    `<path d="M132 152C172 164 186 132 172 110C170 134 152 140 132 138Z" fill="${p.main}" ${o()}/>` + sides +
    `<ellipse cx="100" cy="138" rx="38" ry="34" fill="${p.main}" ${o()}/><ellipse cx="100" cy="148" rx="22" ry="22" fill="${p.belly}"/>` +
    `<ellipse cx="76" cy="172" rx="14" ry="7" fill="${p.dark}" ${o()}/><ellipse cx="124" cy="172" rx="14" ry="7" fill="${p.dark}" ${o()}/>` + head +
    `<ellipse cx="100" cy="90" rx="35" ry="30" fill="${p.main}" ${o()}/>` + dragonEyes(86, 114, 86, p.iris) +
    `<ellipse cx="100" cy="106" rx="16" ry="10" fill="${p.snout}" ${o(p.dark, 2)}/><circle cx="94" cy="105" r="1.8" fill="${K}"/><circle cx="106" cy="105" r="1.8" fill="${K}"/>`
  );
}

// Evolved dinosaur-like dragon. back / tail / side / crest are the parts that change per element
function dino(p: Pal, a: { back: string; tail: string; side: string; crest: string }) {
  return (
    `<path d="M54 122C30 124 18 144 8 168C30 160 48 154 64 148Z" fill="${p.main}" ${o()}/>` + a.tail + a.back +
    `<ellipse cx="96" cy="128" rx="46" ry="30" fill="${p.main}" ${o()}/><ellipse cx="102" cy="148" rx="32" ry="11" fill="${p.belly}"/>` + a.side +
    `<path d="M66 126q6 6 12 0M84 132q6 6 12 0M102 126q6 6 12 0M118 134q6 6 12 0M76 140q6 6 12 0" fill="none" stroke="${p.dark}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M62 148L56 178L84 178L86 150Z" fill="${p.dark}" ${o()}/><path d="M108 150L106 178L134 178L134 148Z" fill="${p.dark}" ${o()}/>` +
    `<path d="M122 112L142 76L172 84L150 130Z" fill="${p.main}" ${o()}/>` +
    `<path d="M146 72L186 70L194 86L180 98L150 96Z" fill="${p.main}" ${o()}/>` + a.crest +
    `<path d="M158 96L162 90L166 96ZM170 96L174 90L178 96Z" fill="#fff"/>` +
    `<circle cx="164" cy="80" r="5" fill="${p.iris}"/><circle cx="165" cy="80" r="2.4" fill="${K}"/><circle cx="187" cy="80" r="1.8" fill="${K}"/>`
  );
}

const fire1 = babyDragon(FIRE,
  `<path d="M64 112L32 92L42 116L34 128L58 130Z" fill="${DR}" ${o()}/><path d="M136 112L168 92L158 116L166 128L142 130Z" fill="${DR}" ${o()}/>`,
  `<path d="M78 70L68 44L92 62ZM122 70L132 44L108 62Z" fill="${K}"/>`);

const fire2 = dino(FIRE, {
  tail: `<path d="M30 134L26 120L38 130ZM18 152L12 140L26 148Z" fill="${K}"/>`,
  back: `<path d="M58 112L56 88L74 102ZM76 102L78 76L92 98ZM94 98L98 72L110 98ZM112 100L118 76L126 104Z" fill="${K}"/>`,
  side: `<path d="M92 114L70 82L90 90L84 66L112 106Z" fill="${DR}" ${o()}/>`,
  crest: `<path d="M150 72L142 52L162 68ZM166 70L168 50L180 70Z" fill="${K}"/>`,
});

const fire3Dragon =
  `<path d="M70 96L58 18L80 50L96 24L98 86Z" fill="#7a0d0d" ${o()}/>` +
  `<path d="M54 104L8 26L30 56L6 52L40 94L22 92L50 120Z" fill="${DR}" ${o()}/><path d="M54 104L10 28M54 104L24 58" stroke="${K}" stroke-width="2" fill="none"/>` +
  `<path d="M30 146C12 150 6 164 4 184C22 178 34 172 46 164Z" fill="${R}" ${o()}/><path d="M8 176L2 164L16 172Z" fill="${K}"/>` +
  `<path d="M30 116L24 92L46 108ZM46 106L46 78L62 102ZM62 102L68 72L78 100ZM78 102L90 78L96 106Z" fill="${K}"/>` +
  `<ellipse cx="68" cy="134" rx="46" ry="34" fill="${R}" ${o()}/><ellipse cx="76" cy="152" rx="28" ry="15" fill="${BEL}"/>` +
  `<path d="M60 144H90M62 152H92M66 160H88" stroke="#e0a860" stroke-width="2" fill="none"/>` +
  `<path d="M36 152L28 180L62 180L64 154Z" fill="${DR}" ${o()}/><path d="M80 154L80 180L112 180L108 148Z" fill="${DR}" ${o()}/>` +
  `<path d="M92 112C104 96 112 80 112 60L138 62C136 84 126 108 112 132Z" fill="${R}" ${o()}/>` +
  `<path d="M112 70L142 72L160 92L116 90Z" fill="${R}" ${o()}/><path d="M130 66L172 58L160 90L128 76Z" fill="#5a0000"/>` +
  `<path d="M108 58L146 40L170 50L174 62L134 68Z" fill="${R}" ${o()}/><path d="M138 67L142 76L147 66ZM150 64L154 73L159 63Z" fill="#fff"/>` +
  `<path d="M112 52L98 30L124 46ZM126 46L120 24L138 44Z" fill="${K}"/>` +
  `<circle cx="128" cy="55" r="5" fill="#ffd23f"/><circle cx="129" cy="55" r="2.4" fill="${K}"/><circle cx="166" cy="53" r="2" fill="${K}"/>`;

const fire3 =
  `<g transform="translate(-6 14) scale(.9)">${fire3Dragon}</g>` +
  `<path d="M144 62C156 46 160 56 168 40C172 54 180 50 186 42C190 58 184 62 196 66C190 74 196 82 186 92C182 82 172 88 164 80C156 84 148 78 144 70Z" fill="#ff8a00"/>` +
  `<path d="M148 64C158 56 162 62 168 54C170 64 176 62 180 58C182 68 180 72 186 76C178 78 176 84 170 82C164 80 156 78 148 70Z" fill="#ffd23f"/>` +
  `<circle cx="190" cy="40" r="3" fill="#ff8a00"/><circle cx="178" cy="30" r="2.2" fill="#ffd23f"/><circle cx="196" cy="98" r="2.5" fill="#ff8a00"/>`;

// ---------- water ----------
const emeraldEye = (x: number, y: number, r: number) =>
  `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.85}" fill="#19c37d" stroke="#0b3d91" stroke-width="1.5"/><circle cx="${x + 1}" cy="${y}" r="${r * 0.42}" fill="${K}"/><circle cx="${x + r * 0.5}" cy="${y - r * 0.4}" r="${r * 0.2}" fill="#fff"/>`;

const water1 = babyDragon(WATER,
  fin("M70 116C50 92 26 90 12 100C24 108 22 118 14 130C28 128 36 134 38 146C52 140 62 132 68 128Z") +
  ribs("M68 122L22 104M68 126L24 126M66 130L40 142") +
  fin("M130 116C150 92 174 90 188 100C176 108 178 118 186 130C172 128 164 134 162 146C148 140 138 132 132 128Z") +
  ribs("M132 122L178 104M132 126L176 126M134 130L160 142") +
  fin("M172 112L192 92L192 116L198 128L170 130Z"),
  fin("M70 82L38 64L46 94Z") + fin("M130 82L162 64L154 94Z") +
  `<path d="M92 64L100 38L108 64Z" fill="${EMERALD}" ${o(WATER.dark, 2.5)}/>`);

const water2 = dino(WATER, {
  tail: fin("M10 168L2 146C10 150 16 148 20 142C22 150 30 152 38 150L22 160Z"),
  back: fin("M56 114C54 92 58 74 52 60C66 70 72 74 76 62C84 76 90 76 98 58C104 74 112 76 122 62C124 78 126 92 128 108Z") +
    ribs("M64 106L56 70M82 100L78 70M100 98L100 66M118 102L122 70"),
  side: fin("M96 118C80 100 64 96 52 104C62 110 62 120 56 130C70 128 80 130 88 138Z") + ribs("M94 120L58 108M92 126L60 124M90 132L66 134"),
  crest: fin("M150 72L136 48L164 66ZM164 68L170 44L184 68Z") + fin("M150 92L134 106L154 102Z"),
});

const snake = (w: number, segs: Seg[]) =>
  `<path d="${bodyPath(segs)}" fill="none" stroke="#0b3d91" stroke-width="${w + 6}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${bodyPath(segs)}" fill="none" stroke="#2a7fdc" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${bodyPath(segs)}" fill="none" stroke="#7cc4ff" stroke-width="${w / 4}" stroke-linecap="round" opacity=".55" transform="translate(0 ${-w / 4})"/>`;

const E: Seg[] = [
  [[8, 170], [32, 192], [84, 186], [94, 158]],
  [[94, 158], [104, 136], [50, 130], [72, 114]],
  [[72, 114], [86, 96], [108, 110], [124, 94]],
];
const water3 =
  // glowing ring behind the upper body
  `<circle cx="130" cy="86" r="58" fill="none" stroke="${FIN}" stroke-width="12" opacity=".25"/>` +
  `<circle cx="130" cy="86" r="58" fill="none" stroke="#bff0ff" stroke-width="5"/>` +
  `<circle cx="130" cy="86" r="49" fill="none" stroke="${EMERALD}" stroke-width="2" stroke-dasharray="4 5"/>` +
  `<path d="M88 160L78 178L86 180L96 168ZM62 116L50 128L58 132L70 122Z" fill="${FIN}" ${o(WATER.dark, 2)}/>` +
  fin("M10 168L0 152L18 158L16 142L34 156Z") +
  spikes(E, 4, 13, 10, EMERALD, 10) + snake(22, E) +
  // big mane at the sides of the face
  `<path d="M146 68C122 62 108 44 110 22C122 38 134 46 154 56Z M140 76C112 74 90 62 84 40C100 54 120 60 148 66Z M140 90C112 96 92 112 94 134C108 122 124 114 150 104Z M146 98C124 112 120 132 126 150C134 134 146 126 160 112Z" fill="${FIN}"/>` +
  `<path d="M146 68C128 62 118 50 118 36C128 46 138 52 152 58Z M144 92C124 98 110 108 112 122C122 114 134 108 154 102Z" fill="#cfeaff"/>` +
  // big horns
  `<path d="M150 56C146 34 158 12 184 4C172 20 172 38 170 58Z M140 58C128 40 128 20 142 6C140 24 148 40 152 58Z" fill="#f6e6b4" ${o(WATER.dark, 2.5)}/>` +
  `<path d="M128 88C126 64 150 54 172 60C186 64 198 72 198 82C192 80 188 90 176 92C164 104 134 106 128 88Z" fill="#2a7fdc" ${o(WATER.dark)}/>` +
  emeraldEye(160, 72, 6) + `<path d="M150 64L170 69" stroke="${WATER.dark}" stroke-width="3" stroke-linecap="round"/>` +
  `<circle cx="191" cy="75" r="1.8" fill="${K}"/><path d="M168 91L172 100L177 90Z" fill="#fff"/>` +
  `<path d="M186 88C198 96 200 110 190 120M176 94C182 108 176 120 164 124" fill="none" stroke="#cfeaff" stroke-width="3" stroke-linecap="round"/>`;

// ---------- electric: tiger cub, tiger, thunder tiger ----------
const Y = "#ffc928", W = "#fff6d6", B = "#3fa9ff";
const bolt = (x: number, y: number) => `<path d="M${x} ${y}l10 12l-8 3l10 15" fill="none" stroke="${K}" stroke-width="5" stroke-linejoin="miter"/>`;
const tigerEye = (x: number, y: number) =>
  `<ellipse cx="${x}" cy="${y}" rx="7" ry="8" fill="${B}" ${o(K, 2)}/><ellipse cx="${x}" cy="${y}" rx="2.5" ry="5" fill="${K}"/><circle cx="${x + 2}" cy="${y - 3}" r="1.6" fill="#fff"/>`;

const tiger1 =
  `<path d="M134 156L160 150L152 138L184 128L158 124L166 112L136 136Z" fill="${Y}" ${o()}/>` +
  `<ellipse cx="100" cy="142" rx="34" ry="30" fill="${Y}" ${o()}/><ellipse cx="100" cy="150" rx="16" ry="18" fill="${W}"/>` +
  `<path d="M68 130q10 4 12 14M132 130q-10 4-12 14M70 150q8 0 12 8M130 150q-8 0-12 8" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/>` +
  `<ellipse cx="78" cy="170" rx="14" ry="7" fill="${Y}" ${o()}/><ellipse cx="122" cy="170" rx="14" ry="7" fill="${Y}" ${o()}/>` +
  `<circle cx="68" cy="62" r="14" fill="${Y}" ${o()}/><circle cx="132" cy="62" r="14" fill="${Y}" ${o()}/><circle cx="68" cy="64" r="7" fill="${K}"/><circle cx="132" cy="64" r="7" fill="${K}"/>` +
  `<ellipse cx="100" cy="88" rx="40" ry="34" fill="${Y}" ${o()}/>` +
  `<path d="M100 56V70M88 58L92 70M112 58L108 70M62 90l12 3M62 100l12-2M138 90l-12 3M138 100l-12-2" stroke="${K}" stroke-width="4" stroke-linecap="round"/>` +
  `<ellipse cx="100" cy="102" rx="18" ry="12" fill="${W}"/><path d="M94 96L106 96L100 104Z" fill="#c2415d"/><path d="M100 104V108M92 110Q100 116 100 108Q100 116 108 110" fill="none" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>` +
  tigerEye(84, 84) + tigerEye(116, 84) +
  `<path d="M40 70L50 62L46 76L56 68M150 30L158 24L156 36L166 30" fill="none" stroke="${B}" stroke-width="3" stroke-linecap="round"/>`;

function tigerSide(big: boolean) {
  const body =
    `<path d="M54 118L30 116L38 102L12 94L44 90L36 78L62 106Z" fill="${Y}" ${o()}/>` +
    `<path d="M72 140L70 172L92 172L92 142Z" fill="#e0a000" ${o()}/>` +
    `<ellipse cx="104" cy="126" rx="52" ry="30" fill="${Y}" ${o()}/><ellipse cx="108" cy="146" rx="34" ry="10" fill="${W}"/>` +
    bolt(80, 100) + bolt(96, 98) + bolt(112, 98) + bolt(128, 102) +
    `<path d="M62 142L56 178L86 178L88 148Z" fill="${Y}" ${o()}/><path d="M118 146L116 178L146 178L142 148Z" fill="${Y}" ${o()}/>` +
    `<ellipse cx="70" cy="177" rx="16" ry="5" fill="${W}" ${o(K, 2)}/><ellipse cx="131" cy="177" rx="16" ry="5" fill="${W}" ${o(K, 2)}/>`;
  const head =
    `<circle cx="134" cy="66" r="10" fill="${Y}" ${o()}/><circle cx="168" cy="64" r="10" fill="${Y}" ${o()}/>` +
    `<circle cx="150" cy="92" r="30" fill="${Y}" ${o()}/>` +
    `<path d="M142 66L146 78M152 64L154 76M162 66L160 78M122 90L134 92M122 100L134 98" stroke="${K}" stroke-width="4" stroke-linecap="round"/>` +
    `<ellipse cx="168" cy="104" rx="16" ry="11" fill="${W}"/><path d="M164 98L176 98L170 106Z" fill="#c2415d"/>` +
    `<path d="M170 106V110M170 110Q164 116 158 110M170 110Q176 116 182 110" fill="none" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>` + tigerEye(160, 88);
  if (!big) return body + head + `<path d="M24 50L34 44L30 56L40 50" fill="none" stroke="${B}" stroke-width="3" stroke-linecap="round"/>`;
  const mane = ring(150, 92, 28, 22, 9, 100, 290, B) + ring(150, 92, 28, 12, 9, 110, 280, "#ffe66d");
  const sparks = [[14, 40], [46, 22], [176, 22], [188, 50], [120, 18]]
    .map(([x, y]) => `<path d="M${x} ${y}l8-8l-2 10l8-6" fill="none" stroke="${B}" stroke-width="3" stroke-linecap="round"/>`).join("");
  const fangs = `<path d="M162 112L165 124L169 112ZM174 112L177 124L181 112Z" fill="#fff" ${o(K, 1.5)}/>`;
  return `<g transform="translate(100 178) scale(1.12) translate(-100 -178)">${body}${mane}${head}${fangs}</g>${sparks}`;
}

// ---------- grass: turtle with a growing garden on its shell ----------
const TURTLE_SKIN = "#9ad45a", GD = "#1b5e2a";
function turtle(level: 1 | 2 | 3) {
  const sc = [0.86, 0.94, 1.02][level - 1];
  let extra = `<path d="M100 94V78" stroke="${GD}" stroke-width="3"/>${leaf(100, 80, -35, 16)}${leaf(100, 80, 35, 16)}`;
  if (level === 2)
    extra = `<path d="M100 94V70" stroke="${GD}" stroke-width="3"/>${leaf(100, 72, -40, 20)}${leaf(100, 72, 40, 20)}${leaf(100, 72, 0, 18, "#8be88f")}` +
      `${leaf(70, 108, -50, 14)}${leaf(130, 108, 50, 14)}<circle cx="100" cy="64" r="5" fill="#ff8fb1" ${o("#c2415d", 1.5)}/>`;
  if (level === 3)
    extra = `<ellipse cx="62" cy="116" rx="9" ry="6" fill="#8a9a8f" ${o(GD, 1.5)}/><ellipse cx="140" cy="122" rx="8" ry="5" fill="#8a9a8f" ${o(GD, 1.5)}/>` +
      `<path d="M95 96L97 58L103 58L105 96Z" fill="#7a4e2a" ${o("#4a2f18", 2)}/>` +
      `<circle cx="82" cy="52" r="15" fill="#2f9e44" ${o(GD, 2)}/><circle cx="118" cy="52" r="15" fill="#3fb454" ${o(GD, 2)}/><circle cx="100" cy="40" r="20" fill="#4cc261" ${o(GD, 2)}/>` +
      `<circle cx="90" cy="44" r="3" fill="#ff8fb1"/><circle cx="112" cy="48" r="3" fill="#ff8fb1"/><circle cx="100" cy="32" r="3" fill="#ffd23f"/>${leaf(70, 108, -50, 14)}${leaf(132, 108, 50, 14)}`;
  const plates =
    `<path d="M90 104L110 104L120 118L110 132L90 132L80 118Z" fill="#5fcf62" ${o(GD, 2)}/>` +
    `<path d="M62 116L78 116L84 130L76 142L56 142L50 128Z" fill="#4cc261" ${o(GD, 2)}/><path d="M138 116L122 116L116 130L124 142L144 142L150 128Z" fill="#4cc261" ${o(GD, 2)}/>`;
  return (
    `<g transform="translate(100 178) scale(${sc}) translate(-100 -178)">` +
    `<path d="M40 150L22 158L40 162Z" fill="${TURTLE_SKIN}" ${o(GD, 2)}/>` +
    `<ellipse cx="66" cy="164" rx="17" ry="14" fill="${TURTLE_SKIN}" ${o(GD, 2.5)}/><ellipse cx="134" cy="164" rx="17" ry="14" fill="${TURTLE_SKIN}" ${o(GD, 2.5)}/>` +
    `<ellipse cx="152" cy="140" rx="16" ry="14" fill="${TURTLE_SKIN}" ${o(GD, 2.5)}/><circle cx="172" cy="126" r="17" fill="${TURTLE_SKIN}" ${o(GD, 2.5)}/>` +
    `<circle cx="178" cy="122" r="3.6" fill="${K}"/><circle cx="179.2" cy="120.8" r="1.2" fill="#fff"/><circle cx="170" cy="132" r="3.5" fill="#ff8fb1" opacity=".7"/><path d="M176 133Q182 136 187 131" fill="none" stroke="${GD}" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M42 148C42 76 158 76 158 148Z" fill="#2f9e44" ${o(GD)}/>${plates}` +
    `<path d="M38 146H162Q162 160 142 160H58Q38 160 38 146Z" fill="#d9b97a" ${o(GD)}/>${extra}</g>`
  );
}

// ---------- all pictures: [egg, baby, evolved, final] ----------
export const ART: Record<BaseElement, string[]> = {
  fire: [fireEgg, fire1, fire2, fire3],
  water: [waterEgg, water1, water2, water3],
  electric: [electricEgg, tiger1, tigerSide(false), tigerSide(true)],
  grass: [grassEgg, turtle(1), turtle(2), turtle(3)],
};