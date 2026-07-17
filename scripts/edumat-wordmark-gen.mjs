// edumat wordmark — aceleași litere geometrice minuscule cu contrast
// caligrafic gros/subțire ca wordmark-ul educode (lab/scripts/
// educode-wordmark-gen.mjs), plus motivul emblemei Kulturosfera: steaua
// concavă în 4 colțuri, așezată de data aceasta în bolul lui „a".
//
//   node scripts/edumat-wordmark-gen.mjs > /tmp/edumat.svg
//
// Output-ul se lipește în componenta de navbar (fill="currentColor").

const X = 30 // x-height top
const B = 100 // baseline
const ASC = 6 // ascender top (d)
const R = 35 // bowl outer radius
const CY = (X + B) / 2 // bowl center y = 65
const OFF = 5 // inner-circle x offset -> thick left, thin right
const RIN = 24 // bowl inner radius
const STEM = 13 // thick stem width
const THIN = 6 // thin stem width
const GAP = 14 // letter spacing

const fmt = (n) => (Math.round(n * 100) / 100).toString()
const rad = (deg) => (deg * Math.PI) / 180
const pt = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))]
const M = (p) => `${fmt(p[0])} ${fmt(p[1])}`

function annulus(cx) {
  const o = R
  const icx = cx + OFF
  return (
    `M ${fmt(cx - o)} ${CY} A ${o} ${o} 0 1 1 ${fmt(cx + o)} ${CY} A ${o} ${o} 0 1 1 ${fmt(cx - o)} ${CY} Z ` +
    `M ${fmt(icx - RIN)} ${CY} A ${RIN} ${RIN} 0 1 0 ${fmt(icx + RIN)} ${CY} A ${RIN} ${RIN} 0 1 0 ${fmt(icx - RIN)} ${CY} Z`
  )
}

function band(cx, a1, a2) {
  const icx = cx + OFF
  const o1 = pt(cx, CY, R, a1)
  const o2 = pt(cx, CY, R, a2)
  const i1 = pt(icx, CY, RIN, a1)
  const i2 = pt(icx, CY, RIN, a2)
  return (
    `M ${M(o2)} A ${R} ${R} 0 1 1 ${M(o1)} ` +
    `L ${M(i1)} A ${RIN} ${RIN} 0 1 0 ${M(i2)} Z`
  )
}

const rect = (x, y, w, h) =>
  `M ${fmt(x)} ${fmt(y)} L ${fmt(x + w)} ${fmt(y)} L ${fmt(x + w)} ${fmt(y + h)} L ${fmt(x)} ${fmt(y + h)} Z`

function star4(cx, cy, outer, waist) {
  const pts = []
  for (let i = 0; i < 4; i++) {
    const tipDeg = i * 90 - 90
    const t = pt(cx, cy, outer, tipDeg)
    const w = pt(cx, cy, waist, tipDeg + 45)
    pts.push(`${i === 0 ? 'M' : 'L'} ${M(t)}`)
    pts.push(`Q ${fmt(cx)} ${fmt(cy)} ${M(w)}`)
  }
  return pts.join(' ') + ' Z'
}

// ---- literele educode refolosite -------------------------------------------

function letterE() {
  const cx = R
  const bar = rect(cx - R + 6, CY - 11, 2 * R - 8, 11)
  return { w: 2 * R, d: band(cx, 14, 52) + ' ' + bar }
}

function letterD() {
  const cx = R
  const stem = rect(2 * R - STEM, ASC, STEM, B - ASC)
  return { w: 2 * R, d: annulus(cx) + ' ' + stem }
}

function letterU() {
  const w = 2 * R
  const irL = STEM
  const irR = w - THIN
  const ir = (irR - irL) / 2
  return {
    w,
    d:
      `M 0 ${X} L 0 ${CY} A ${R} ${R} 0 0 0 ${w} ${CY} L ${w} ${X} ` +
      `L ${fmt(irR)} ${X} L ${fmt(irR)} ${CY} A ${fmt(ir)} ${fmt(ir)} 0 0 1 ${fmt(irL)} ${CY} L ${fmt(irL)} ${X} Z`,
  }
}

// ---- literele noi: m, a, t --------------------------------------------------

// m: două arcade (u răsturnat, dublat) — perete stâng gros, stâlpi mijlociu și
// drept subțiri; arcadele pornesc de la înălțimea centrului arcului.
function letterM() {
  const r = 26 // raza exterioară a unei arcade
  const w = 4 * r // două arcade lipite
  const top = X + r // centrul arcelor
  // conturul exterior: sus două bumuri, pereții exteriori până la baseline
  const outer =
    `M 0 ${B} L 0 ${fmt(top)} ` +
    `A ${r} ${r} 0 0 1 ${2 * r} ${fmt(top)} ` +
    `A ${r} ${r} 0 0 1 ${w} ${fmt(top)} L ${w} ${B} Z`
  // scobitura 1: între stâlpul gros (stânga) și stâlpul mijlociu (subțire)
  const n1L = STEM
  const n1R = 2 * r - THIN / 2
  const r1 = (n1R - n1L) / 2
  const notch1 =
    `M ${fmt(n1L)} ${B} L ${fmt(n1R)} ${B} L ${fmt(n1R)} ${fmt(top)} ` +
    `A ${fmt(r1)} ${fmt(r1)} 0 0 0 ${fmt(n1L)} ${fmt(top)} Z`
  // scobitura 2: între stâlpul mijlociu și peretele drept (subțire)
  const n2L = 2 * r + THIN / 2
  const n2R = w - THIN
  const r2 = (n2R - n2L) / 2
  const notch2 =
    `M ${fmt(n2L)} ${B} L ${fmt(n2R)} ${B} L ${fmt(n2R)} ${fmt(top)} ` +
    `A ${fmt(r2)} ${fmt(r2)} 0 0 0 ${fmt(n2L)} ${fmt(top)} Z`
  return { w, d: outer + ' ' + notch1 + ' ' + notch2 }
}

// a: bol + stâlp gros pe dreapta de la x-height la baseline; steaua emblemei
// stă în bolul lui — semnătura edumat.
function letterA({ star = false } = {}) {
  const stem = rect(2 * R - STEM, X, STEM, B - X)
  let d = annulus(R) + ' ' + stem
  if (star) {
    // steluțele Kulturosfera: brațe zvelte (talie mică) — scânteie, nu shuriken
    d += ' ' + star4(R + OFF, CY + 2, 15, 4.5)
    d += ' ' + star4(R + OFF + 11, CY - 12, 6, 1.8)
  }
  return { w: 2 * R, d }
}

// t: stâlp gros cu ascender scurt + bară transversală la x-height.
function letterT() {
  const asc = 12 // ascender mai scurt decât d
  const stem = rect(0, asc, STEM, B - asc)
  const bar = rect(-3, X, 2 * R - 26, 11)
  return { w: 2 * R - 26 - 3, d: stem + ' ' + bar }
}

// -----------------------------------------------------------------------------

const word = [letterE(), letterD(), letterU(), letterM(), letterA({ star: true }), letterT()]

let x = 12
const groups = []
for (const L of word) {
  groups.push(`<g transform="translate(${x} 0)"><path fill-rule="nonzero" d="${L.d}"/></g>`)
  x += L.w + GAP
}
const W = x - GAP + 6

console.log(
  `<svg viewBox="0 0 ${W} 108" xmlns="http://www.w3.org/2000/svg" fill="currentColor" role="img" aria-label="edumat">
${groups.join('\n')}
</svg>`
)
console.error('width:', W)
