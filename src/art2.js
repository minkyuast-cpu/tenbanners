// r14 새 그림 ② — 사람 (병과 지휘관·사람 부대원·마을 사람): 파츠를 조합해 그린다. 좌표는 64 단위 상자, 오른쪽을 본다, 발은 y=61.5
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var T = DS.artTools, part = T.part, mute = T.mute, blob = T.blob, E = T.E, RR = T.RR, poly = T.poly, line = T.line, curve = T.curve, dot = T.dot, mix = T.mix, rgb = T.rgb, css = T.css, sh1 = T.sh1, sh2 = T.sh2, lt = T.lt, ink = T.ink;
var MAT = DS.artMAT, ACC = DS.artACC, WOOD = '#7a5434', LEATH = '#5e4232', BOOT = '#4a3428';
var DEF = { s: '#f0c8a0', S: '#c99068', a: '#62b0ee', A: '#3572b8', b: '#d8b450', B: '#9c7a3a', h: '#7a5034', H: '#523422', q: '#a8404c', Q: '#6e2834', r: '#b8404c', R: '#7e2834',
  m: '#b4bccb', M: '#7f8798', u: '#5f86b8', U: '#3a5a8a', w: '#e8eef4', l: '#e2dccc', L: '#aea48c', c: '#9fd8e0', C: '#5a9aa8', i: '#d8b450', I: '#9c7a3a', x: '#e04a5a', z: '#2b2440', O: '#4a3a4a', g: '#d8b450', G: '#a07a30', o: '#8a6040' };
function circ(x, y, r) { return function (g) { E(g, x, y, r, r); }; }
function el(x, y, rx, ry, a) { return function (g) { E(g, x, y, rx, ry, a); }; }
function cap(x0, y0, x1, y1, r) {      // 둥근 막대 (팔·다리·자루)
  return function (g) { var a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * r, ny = Math.cos(a) * r; g.moveTo(x0 + nx, y0 + ny); g.lineTo(x1 + nx, y1 + ny); g.arc(x1, y1, r, a + Math.PI / 2, a - Math.PI / 2, true); g.lineTo(x0 - nx, y0 - ny); g.arc(x0, y0, r, a - Math.PI / 2, a + Math.PI / 2, true); g.closePath(); };
}
function pth(fn) { return fn; }
DS.artHumanTools = { circ: circ, el: el, cap: cap, DEF: DEF };

// ───────── 무기 (손잡이 = 원점, 위 = -y) ─────────
// d = { cat, kind(그릴 모양), t, m[3], acc, gem, grade, sh }
function wSword(g, d) {
  var m = d.m, big = d.kind === 'gsword', thin = d.kind === 'rapier', L = big ? 25 : thin ? 23 : 20, w = big ? 3.2 : thin ? 1.0 : 2.0;
  if (d.sh === 'club') { part(g, cap(0, 3, 0, -6, 1.3), WOOD, { sd: 0.8 }); part(g, function (g) { blob(g, [-1.6, -6, -3.6, -14, -3, -21, 0, -24, 3, -21, 3.8, -14, 1.8, -6]); }, m[1], { sd: 1.6 }); dot(g, -1.2, -16, 0.7, css(mute(m[0]))); dot(g, 1.4, -11, 0.6, css(mute(m[0]))); return; }
  if (d.sh === 'flail') { part(g, cap(0, 3, 0, -9, 1.2), WOOD, { sd: 0.8 }); line(g, [0, -9, 1.5, -12, 0.5, -15, 2, -17], css(mute('#8a8a94')), 0.9); part(g, circ(2.5, -20.5, 4), m[1], { sd: 1.6 }); for (var k = 0; k < 6; k++) { var a = k / 6 * 6.28; part(g, circ(2.5 + Math.cos(a) * 4.6, -20.5 + Math.sin(a) * 4.6, 0.9), m[2], { sd: 0, hl: 0, ln: 0.6 }); } return; }
  if (d.sh === 'fang') { part(g, cap(0, 4, 0, 0, 1.2), LEATH, { sd: 0.6 }); part(g, function (g) { g.moveTo(-2, -1); g.quadraticCurveTo(-3.5, -12, 2.5, -22); g.quadraticCurveTo(1, -12, 2.4, -1); g.closePath(); }, m[1], { sd: 1.2, gl: function (g) { E(g, -1.2, -9, 0.5, 4, 0.2); } }); part(g, function (g) { RR(g, -3.5, -1.6, 7, 2.2, 1); }, d.acc, { sd: 0.6 }); return; }
  if (d.sh === 'great') { big = true; L = 25; w = 3.4; }
  part(g, cap(0, 4.5, 0, 0, thin ? 0.9 : 1.15), LEATH, { sd: 0.6, hl: 0.3 });
  dot(g, 0, 5.4, big ? 1.6 : 1.2, css(mute(d.acc)));
  part(g, function (g) { g.moveTo(-w, -1.5); g.lineTo(-w, -L + w * 1.6); g.lineTo(0, -L - 1); g.lineTo(w, -L + w * 1.6); g.lineTo(w, -1.5); g.closePath(); }, m[1], { sd: w * 0.9, hl: 0.5, gl: function (g) { RR(g, -w * 0.75, -L + 4, w * 0.5, L - 7, 0.3); } });
  if (!thin && (d.t >= 4 || big)) line(g, [0, -2.5, 0, -L + w * 2.2], css(sh1(mute(m[1]))), big ? 1 : 0.6);
  if (d.sh === 'great') { line(g, [-1.5, -6, 1.2, -10, -1, -14, 1.5, -18], css(mute(d.gem)), 0.9); }
  if (thin) { curve(g, -0.5, -0.5, -4.5, 1, -1, 4.5, css(mute(d.acc)), 1.1); part(g, function (g) { RR(g, -3.2, -2.2, 6.4, 1.6, 0.8); }, d.acc, { sd: 0.5 }); }
  else part(g, function (g) { RR(g, big ? -6.5 : -5, -2.6, big ? 13 : 10, big ? 2.8 : 2.2, 1.1); }, d.acc, { sd: 0.8 });
  if (d.t >= 4 || big) dot(g, 0, -1.4, 0.9, css(mute(d.gem)));
}
function wLance(g, d) {
  var m = d.m, top = -40, bot = 12;
  if (d.kind === 'trident' || d.sh === 'twin') {
    part(g, cap(0, bot, 0, top + 8, 1.05), d.sh === 'twin' ? m[2] : WOOD, { sd: 0.7, hl: 0.3 });
    part(g, function (g) { g.moveTo(-5, top + 7); g.quadraticCurveTo(-5.2, top + 11, 0, top + 11); g.quadraticCurveTo(5.2, top + 11, 5, top + 7); g.lineTo(3.6, top + 7); g.quadraticCurveTo(3.4, top + 9.4, 0, top + 9.4); g.quadraticCurveTo(-3.4, top + 9.4, -3.6, top + 7); g.closePath(); }, m[1], { sd: 0.6, hl: 0 });
    [-4.3, 0, 4.3].forEach(function (x, i) { part(g, function (g) { g.moveTo(x - 0.8, top + 8); g.lineTo(x - 0.8, top + (i === 1 ? 0 : 2.5)); g.lineTo(x, top - (i === 1 ? 3 : 0.5)); g.lineTo(x + 0.8, top + (i === 1 ? 0 : 2.5)); g.lineTo(x + 0.8, top + 8); g.closePath(); }, m[1], { sd: 0.5, hl: 0.3 }); });
    if (d.sh === 'twin') { [-4.3, 0, 4.3].forEach(function (x) { line(g, [x, bot - 1, x, bot + 4], css(mute(m[0])), 1.4); }); }
    return;
  }
  part(g, cap(0, bot, 0, top + 8, 1.05), d.sh === 'harpoon' ? '#6a7c88' : WOOD, { sd: 0.7, hl: 0.3 });
  part(g, function (g) { RR(g, -1.6, top + 7, 3.2, 2.2, 0.8); }, d.acc, { sd: 0.5 });
  if (d.sh === 'pick') { part(g, function (g) { g.moveTo(-10, top + 13); g.quadraticCurveTo(-4, top + 4, 0, top + 5); g.quadraticCurveTo(4, top + 4, 10, top + 13); g.quadraticCurveTo(4, top + 7.5, 0, top + 8.5); g.quadraticCurveTo(-4, top + 7.5, -10, top + 13); g.closePath(); }, m[1], { sd: 1 }); dot(g, 0, top + 6.6, 0.9, css(mute(d.gem))); return; }
  if (d.kind === 'halberd') {
    part(g, function (g) { g.moveTo(0.8, top + 9); g.quadraticCurveTo(10, top + 8, 10.5, top + 15); g.quadraticCurveTo(8, top + 21, 0.8, top + 18.5); g.closePath(); }, m[1], { sd: 1.2, gl: function (g) { E(g, 6, top + 11.5, 2, 0.8, 0.2); } });
    part(g, function (g) { g.moveTo(-0.8, top + 12); g.lineTo(-5, top + 14); g.lineTo(-0.8, top + 15.5); g.closePath(); }, m[2], { sd: 0.3, hl: 0 });
  }
  part(g, function (g) { g.moveTo(0, top - 4); g.quadraticCurveTo(3.4, top + 1, 2, top + 7); g.lineTo(-2, top + 7); g.quadraticCurveTo(-3.4, top + 1, 0, top - 4); g.closePath(); }, m[1], { sd: 1, gl: function (g) { E(g, -0.9, top + 1.5, 0.5, 2.6); } });
  if (d.sh === 'harpoon') { part(g, function (g) { g.moveTo(-2, top + 5); g.lineTo(-4.5, top + 9.5); g.lineTo(-1, top + 7.5); g.closePath(); g.moveTo(2, top + 5); g.lineTo(4.5, top + 9.5); g.lineTo(1, top + 7.5); g.closePath(); }, m[1], { sd: 0.3, hl: 0 }); }
  if (d.t >= 7 && !d.sh) part(g, function (g) { g.moveTo(-1.5, top + 7); g.quadraticCurveTo(-6, top + 6, -6.5, top + 3); g.quadraticCurveTo(-4, top + 9, -1.5, top + 9.5); g.closePath(); g.moveTo(1.5, top + 7); g.quadraticCurveTo(6, top + 6, 6.5, top + 3); g.quadraticCurveTo(4, top + 9, 1.5, top + 9.5); g.closePath(); }, d.acc, { sd: 0.6 });
  if (d.sh === 'tassel') { part(g, function (g) { g.moveTo(0, top + 9.5); g.quadraticCurveTo(-4, top + 13, -2.5, top + 19); g.lineTo(-0.5, top + 18); g.quadraticCurveTo(-1.5, top + 13, 0.8, top + 10); g.closePath(); }, d.acc, { sd: 0.8 }); }
  if (d.sh === 'banner') { part(g, function (g) { g.moveTo(-1, top + 10); g.lineTo(-11, top + 11); g.lineTo(-8.5, top + 14); g.lineTo(-11, top + 17); g.lineTo(-1, top + 17.5); g.closePath(); }, m[1], { sd: 1.4 }); dot(g, -5, top + 13.8, 1.2, css(mute(d.acc))); }
}
function wBow(g, d) {
  var m = d.m, xb = d.kind === 'xbow' || d.sh === 'xbow', big = d.kind === 'lbow', H = big ? 21 : 17, wood = d.grade >= 5 ? m[1] : (d.t >= 6 ? '#8a6440' : WOOD);
  if (xb) {
    part(g, function (g) { RR(g, -12, -2, 16, 3.6, 1.2); }, WOOD, { sd: 1 });
    part(g, function (g) { g.moveTo(3, -13); g.quadraticCurveTo(7.5, 0, 3, 13); g.lineTo(4.6, 13); g.quadraticCurveTo(9.4, 0, 4.6, -13); g.closePath(); }, m[1], { sd: 0.7, hl: 0.4 });
    line(g, [3.4, -12, -3, 0, 3.4, 12], 'rgba(235,228,210,.9)', 0.55); part(g, function (g) { RR(g, -6, -2.8, 12, 1.5, 0.6); }, m[0], { sd: 0.3, hl: 0 }); return;
  }
  line(g, [-0.5, -H + 1.5, -0.5, H - 1.5], 'rgba(235,228,210,.95)', 0.55);
  part(g, function (g) { g.moveTo(-0.6, -H); g.bezierCurveTo(9.5, -H * 0.55, 9.5, H * 0.55, -0.6, H); g.lineTo(0.9, H - 0.3); g.bezierCurveTo(7, H * 0.5, 7, -H * 0.5, 0.9, -H + 0.3); g.closePath(); }, wood, { sd: 1.0, hl: 0.4 });
  part(g, function (g) { RR(g, 4.3, -3, 2.6, 6, 1); }, LEATH, { sd: 0.6, hl: 0 });
  if (d.t >= 7 || d.sh) { dot(g, 6.4, -H * 0.42, 0.9, css(mute(d.gem))); dot(g, 6.4, H * 0.42, 0.9, css(mute(d.gem))); }
  if (d.sh === 'sting') part(g, function (g) { g.moveTo(-0.6, -H); g.quadraticCurveTo(-2, -H - 5, 3.5, -H - 6); g.quadraticCurveTo(0, -H - 3, 1, -H + 1); g.closePath(); }, m[1], { sd: 0.6 });
  if (d.sh === 'feather') { [-1, 1].forEach(function (s) { part(g, function (g) { E(g, 1, s * (H + 1.5), 1.6, 3.2, s * 0.4); }, m[0], { sd: 0.6 }); }); }
}
function wWand(g, d) {
  var m = d.m, k = d.kind;
  if (d.sh === 'censer') { part(g, cap(0, 6, 0, -12, 1), m[2], { sd: 0.5 }); line(g, [0, -12, 3, -14, 4, -9], css(mute('#9a9080')), 0.6); part(g, el(4, -6.5, 3, 2.6), m[1], { sd: 1 }); dot(g, 4, -11.5, 1.2, css(mute(d.gem), 0.5)); dot(g, 5.5, -14.5, 1.6, css(mute(d.gem), 0.35)); return; }
  if (d.sh === 'horn') { part(g, cap(0, 6, 0, -9, 1.1), WOOD, { sd: 0.6 }); part(g, function (g) { g.moveTo(-2, -8); g.quadraticCurveTo(-3, -18, 5, -22); g.quadraticCurveTo(1.5, -16, 2, -8); g.closePath(); }, m[1], { sd: 1 }); return; }
  if (k === 'mace') {
    part(g, cap(0, 6, 0, -9, 1.05), WOOD, { sd: 0.6, hl: 0.3 });
    for (var i = 0; i < 4; i++) { var a = i / 4 * 6.28 + 0.4; part(g, el(Math.cos(a) * 2.8, -12.5 + Math.sin(a) * 1.0, 1.3, 3.3), m[2], { sd: 0.4, hl: 0, ln: 0.7 }); }
    part(g, circ(0, -12.5, 3.2), m[1], { sd: 1.2, gl: function (g) { E(g, -1, -13.6, 0.9, 0.7); } }); dot(g, 0, -16.6, 0.9, css(mute(d.acc))); return;
  }
  if (k === 'wand') { part(g, cap(0, 4, 0, -11, 0.9), d.t >= 4 ? d.acc : WOOD, { sd: 0.5 }); part(g, function (g) { var R = 3.4, r = 1.4; g.moveTo(0, -11 - R * 1.3); for (var j = 1; j < 10; j++) { var q = j / 10 * 6.2832, rr = j & 1 ? r : R * 1.3; g.lineTo(Math.sin(q) * rr, -14 - Math.cos(q) * rr + (j & 1 ? 0 : 0)); } g.closePath(); }, d.gem, { sd: 0.8 }); return; }
  // 성구 지팡이 · 십자 · 홀 (B 형)
  var sc = d.sh === 'scepter';
  part(g, cap(0, 10, 0, -14, 1.0), sc ? d.m[1] : d.acc, { sd: 0.6, hl: 0.4 });
  part(g, function (g) { RR(g, -1.4, -24, 2.8, 11, 0.9); RR(g, -5, -20.5, 10, 2.8, 0.9); }, sc ? d.m[0] : d.acc, { sd: 0.9 });
  dot(g, 0, -19.1, 1.1, css(mute(d.gem)));
  if (sc) part(g, function (g) { g.moveTo(-4, -24); g.lineTo(-2.5, -28); g.lineTo(0, -25); g.lineTo(2.5, -28); g.lineTo(4, -24); g.closePath(); }, d.acc, { sd: 0.5 });
}
function wStaff(g, d) {
  var m = d.m, k = d.kind, top = -30;
  if (d.sh === 'twisty') { part(g, cap(0, 12, 0, top + 4, 1.2), m[1], { sd: 0.6 }); for (var y = 10; y > top + 4; y -= 4) line(g, [-1.1, y, 1.1, y - 2], css(mute(m[0])), 0.9); part(g, function (g) { g.arc(3, top + 3, 4, Math.PI, 0); g.arc(3, top + 3, 2, 0, Math.PI, true); g.closePath(); }, m[1], { sd: 0.7 }); dot(g, 0, top + 9, 1.2, css(mute(d.gem))); return; }
  var wood = k === 'sstaff' ? '#4a3a44' : (d.grade >= 5 ? m[2] : WOOD);
  part(g, function (g) { g.moveTo(-1.1, 12); g.quadraticCurveTo(-0.4, -8, -1.3, top + 5); g.lineTo(1.3, top + 5); g.quadraticCurveTo(1.6, -8, 1.1, 12); g.closePath(); }, wood, { sd: 0.8, hl: 0.4 });
  if (k === 'sstaff') {      // 사교: 비틀린 검은 지팡이 끝에 짐승 뼈와 빛나는 눈
    part(g, function (g) { blob(g, [-4, top + 5, -5, top - 1, -1.5, top - 5, 2.5, top - 4.5, 5, top, 3.8, top + 5]); }, '#d8d0bc', { sd: 1.2 });
    dot(g, -1.4, top + 0.5, 1.1, '#2a2030'); dot(g, 1.9, top + 0.3, 1.1, '#2a2030'); dot(g, -1.4, top + 0.5, 0.6, css(mute(d.gem))); dot(g, 1.9, top + 0.3, 0.6, css(mute(d.gem)));
    curve(g, -4, top + 4, -7, top + 8, -5, top + 12, css(mute('#5a4a3a')), 0.8); return;
  }
  if (d.sh === 'armil') { [0, 1.1, 2.2].forEach(function (r) { g.beginPath(); E(g, 0, top - 1, 6, 2.2, r); g.lineWidth = 0.9; g.strokeStyle = css(mute(d.acc)); g.stroke(); }); part(g, circ(0, top - 1, 2.6), d.gem, { sd: 0.8 }); return; }
  if (k === 'rune' || (d.line === 'B' && !d.sh)) {      // 룬 스태프: 끝에 고리, 자루에 새긴 룬
    g.beginPath(); E(g, 0, top - 1, 4.6, 5.2); g.lineWidth = 1.8; g.strokeStyle = css(ink(mute(d.acc))); g.stroke(); g.lineWidth = 1.0; g.strokeStyle = css(mute(d.acc)); g.stroke();
    part(g, function (g) { poly(g, [0, top - 4.5, 2.4, top - 1, 0, top + 2.5, -2.4, top - 1]); }, d.gem, { sd: 0.6 });
    for (var r = 0; r < 3; r++) line(g, [-0.6, top + 10 + r * 6, 0.6, top + 12 + r * 6], css(mute(d.gem), 0.9), 0.6);
    return;
  }
  var orb = k === 'orb' || d.sh === 'ember';
  part(g, function (g) { g.moveTo(-1.3, top + 6); g.quadraticCurveTo(-6, top + 2, -4.5, top - 3); g.quadraticCurveTo(-2.6, top + 1, 0, top + 2); g.quadraticCurveTo(2.6, top + 1, 4.5, top - 3); g.quadraticCurveTo(6, top + 2, 1.3, top + 6); g.closePath(); }, orb ? d.acc : wood, { sd: 0.7 });
  var oc = orb ? (d.orb || d.gem) : (d.orb || d.gem);
  if (orb) { dot(g, 0, top - 2.5, 6.6, css(lt(mute(oc), 0.2), 0.22)); part(g, circ(0, top - 2.5, 4.4), oc, { sd: 1.6, hl: 0.7, gl: function (g) { E(g, -1.5, top - 4.2, 1.2, 0.9, -0.5); } }); }
  else part(g, function (g) { poly(g, [0, top - 6, 2.6, top - 2, 0, top + 2, -2.6, top - 2]); }, oc, { sd: 1, gl: function (g) { E(g, -0.8, top - 3, 0.6, 1.2); } });
  if (d.sh === 'ember') { [[-2, -9], [1.5, -11], [0, -13.5]].forEach(function (p, i) { dot(g, p[0], top + p[1], 1.4 - i * 0.3, css(mute(i ? '#ff9a3c' : '#ffd24a'), 0.85)); }); }
}
function weapon(g, d) {
  if (!d) return;
  if (d.cat === 'sword') wSword(g, d); else if (d.cat === 'lance') wLance(g, d); else if (d.cat === 'bow') wBow(g, d); else if (d.cat === 'wand') wWand(g, d); else if (d.cat === 'staff') wStaff(g, d);
  else if (d.cat === 'axe') { part(g, cap(0, 6, 0, -14, 1.1), WOOD, { sd: 0.6 }); part(g, function (g) { g.moveTo(0.8, -9); g.quadraticCurveTo(8, -11, 8.5, -16); g.quadraticCurveTo(8, -21, 0.8, -19); g.closePath(); }, d.m[1], { sd: 1.1 }); }
  else if (d.cat === 'club') part(g, function (g) { blob(g, [-1.2, 5, -1.2, -4, -3.4, -12, -2, -17, 2, -17.5, 3.6, -12, 1.4, -4, 1.2, 5]); }, WOOD, { sd: 1.4 });
  if (d.grade === 4) { part(g, function (g) { g.moveTo(-0.5, 5.5); g.quadraticCurveTo(-3, 8, -2, 12.5); g.lineTo(-0.2, 12); g.quadraticCurveTo(-1, 9, 0.8, 6); g.closePath(); }, '#9a6ad0', { sd: 0.7 }); dot(g, 0, 5.8, 1.0, css(mute('#ecdcff'))); }
}
// 꼴 item 이름 → 무기 묘사 (장비가 없을 때: 병과 단의 기본 무기)
var ITEMW = { sword: ['sword', 'sword'], gsword: ['sword', 'gsword'], spear: ['lance', 'spear'], halberd: ['lance', 'halberd'], trident: ['lance', 'trident'], bow: ['bow', 'bow'], lbow: ['bow', 'lbow'],
  staff: ['staff', 'staff'], sstaff: ['staff', 'sstaff'], orb: ['staff', 'orb'], wand: ['wand', 'wand'], cross: ['wand', 'cross'], mace: ['wand', 'mace'], axe: ['axe', 'axe'], club: ['club', 'club'] };
function itemW(items, t, pal) {
  for (var i = 0; i < items.length; i++) { var w = ITEMW[items[i]]; if (w) { var tt = Math.max(1, Math.min(10, t)); return { cat: w[0], kind: w[1], t: tt, m: MAT[Math.min(10, Math.max(2, tt))], acc: ACC[tt], gem: (pal && pal.c) || '#62b0ee', orb: pal && pal.c, grade: 0 }; } }
  return null;
}
function gearW(wd, cls) {      // 장비 묘사 → 모양
  if (!wd) return null;
  var d = {}; for (var k in wd) d[k] = wd[k];
  if (d.cat === 'sword') d.kind = d.line === 'B' ? 'rapier' : (d.sh === 'great' || (!d.sh && d.t >= 7)) ? 'gsword' : 'sword';
  else if (d.cat === 'lance') d.kind = (cls === 'mar' || cls === 'tm') && !d.sh ? 'trident' : d.line === 'B' ? 'halberd' : 'spear';
  else if (d.cat === 'bow') d.kind = d.line === 'B' ? 'xbow' : d.t >= 4 ? 'lbow' : 'bow';
  else if (d.cat === 'wand') d.kind = d.line === 'B' ? 'cross' : 'mace';
  else if (d.cat === 'staff') d.kind = cls === 'sha' && !d.sh ? 'sstaff' : d.line === 'B' ? 'rune' : d.t >= 4 ? 'orb' : 'staff';
  if (d.kind === 'orb' && !d.orb) d.orb = d.gem;
  return d;
}
DS.artWeapon = weapon;

// ───────── 사람 ─────────
// S = { head, body, items, pal, cls, tier, w(무기 묘사), a(방어구 묘사), age, sx, faded, pose, step, grade(용병 등급), gc(등급색) }
function human(g, S) {
  var pal = S.pal || {}, pose = S.pose || '', age = S.age || '', child = age === 'child';
  function C(k) { var v = pal[k] || DEF[k], c = mute(v); if (S.faded) c = mix(c, [176, 182, 192], 0.32); return c; }
  S.C = C;
  var items = S.items || [], has = function (n) { return items.indexOf(n) >= 0; };
  var w = child ? null : S.w ? gearW(S.w, S.cls) : itemW(items, S.tier || 1, pal);
  var shield = !child && has('shield') && !(S.w && S.w.cat !== 'sword' && S.w.cat !== 'wand');
  var bs = child ? 0.74 : age === 'teen' ? 0.9 : 1, hs = child ? 0.92 : age === 'teen' ? 0.96 : 1, bend = age === 'elder' ? 0.15 : 0;
  var lean = pose === 'atk' ? 0.12 : pose === 'hit' ? -0.17 : pose === 'cast' ? -0.05 : 0, dx = pose === 'hit' ? -1.6 : pose === 'atk' ? 1.2 : 0;
  var robe = !S.ride && (S.body === 'robe' || (S.a && S.a.cat === 'robe'));
  var step = S.step || 0;
  g.save(); g.translate(32 + dx, 61.5); g.scale(bs, bs); g.translate(-32, -61.5);
  function upper(fn) { g.save(); g.translate(31, 51); g.rotate(lean + bend); g.translate(-31, -51); fn(); g.restore(); }
  function headT(fn) { upper(function () { g.save(); g.translate(31, 37); if (bend) g.translate(1.2, 1.4); g.rotate(pose === 'hit' ? -0.12 : pose === 'atk' ? 0.06 : bend * 0.4); g.scale(hs / bs, hs / bs); g.translate(-31, -37); fn(); g.restore(); }); }
  // 손 자리 (자세마다)
  var hand = pose === 'atk' ? [48.5, 42] : pose === 'cast' ? [43.5, 33] : pose === 'hit' ? [42, 45.5] : [44.5, 47.5];
  var ang = 0;
  if (w) {
    var long = w.cat === 'lance' || w.cat === 'staff';
    if (pose === 'atk') ang = w.cat === 'bow' ? 0 : long ? 1.25 : 1.15;
    else if (pose === 'cast') ang = -0.12;
    else if (pose === 'hit') ang = -0.55;
    else ang = w.cat === 'sword' || w.cat === 'axe' || w.cat === 'club' ? 0.32 : w.cat === 'wand' && w.kind === 'mace' ? 0.25 : 0;
    if (w.cat === 'bow' && pose === 'atk') hand = [50, 40];
  }
  S._hand = hand; S._ang = ang; S._wd = w;
  if (S.maskOnly) { upper(function () { if (w) { g.save(); g.translate(hand[0], hand[1]); g.rotate(ang); weapon(g, w); g.restore(); } }); g.restore(); return; }
  // ── 뒤: 망토 · 날개 · 긴 머리
  upper(function () {
    if (has('mwing') || has('mwing2')) wings(g, C('w'), has('mwing2'), pose);
    if (S.a && S.a.sh === 'wings') wings(g, mute(S.a.m[1]), false, pose);
    if (has('cape')) cape(g, C('q'), C('b'), pose, step);
    if (S.a && S.a.cat === 'light' && S.a.line === 'B') smallWings(g, mute(S.a.m[0]));
  });
  headT(function () { headBack(g, S); });
  // ── 다리
  if (S.bust) {}
  else if (S.ride) rideLeg(g, S);
  else if (!robe) legs(g, S, step);
  else robeFeet(g, S, step);
  upper(function () {
    backArm(g, S, shield, pose);
    torso(g, S, robe);
    if (shield) shieldP(g, S, pose);
  });
  headT(function () { headFront(g, S); });
  upper(function () {
    if (w) { g.save(); g.translate(hand[0], hand[1]); g.rotate(ang); weapon(g, w); g.restore(); }
    frontArm(g, S, hand, w);
    if (has('beads')) for (var bi = 0; bi < 9; bi++) { var ba = 0.2 + bi / 8 * 2.7; part(g, circ(31 + Math.cos(ba) * 7, 37.6 + Math.sin(ba) * 4.6, bi === 4 ? 1.6 : 1.15), bi === 4 ? '#c0404c' : '#7a5034', { sd: 0.4, hl: 0.4, ln: 0.6 }); }
    if (has('kunai')) { part(g, function (g) { g.moveTo(22, 49); g.lineTo(18, 54.5); g.lineTo(19.5, 55); g.closePath(); }, '#c4ccd8', { sd: 0.3 }); }
  });
  g.restore();
}
DS.artHuman = human;

function legs(g, S, step) {
  var C = S.C, armor = S.body === 'armor' || (S.a && S.a.cat === 'heavy'), bones = S.body === 'bones';
  var pant = bones ? C('l') : armor ? sh1(C('a')) : S.body === 'tunic' ? mute('#5a4a3e') : sh1(C('a')), boot = bones ? C('L') : armor ? (S.a ? mute(S.a.m[1]) : C('m')) : mute(BOOT);
  [[27.4, step === 1 ? 2.6 : 0, -0.6], [35, step === 2 ? 2.6 : 0, 0.6]].forEach(function (L, i) {
    var x = L[0], up = L[1], k = L[2];
    if (bones) { part(g, cap(x, 50, x + k, 58 - up, 1.2), pant, { sd: 0.5 }); part(g, el(x + k + 0.8, 59.8 - up, 2.8, 1.8), boot, { sd: 0.6 }); return; }
    part(g, function (g) { RR(g, x - 2.8, 49, 5.6, 8 - up, 2); }, i ? pant : sh1(pant), { sd: 1.0 });
    part(g, function (g) { g.moveTo(x - 3, 55 - up); g.lineTo(x + 2.6, 55 - up); g.quadraticCurveTo(x + 5.6, 57 - up, x + 5, 61.6 - up); g.lineTo(x - 3.2, 61.6 - up); g.closePath(); }, i ? boot : sh1(boot), { sd: 1.0, gl: armor ? function (g) { E(g, x - 0.8, 56.6 - up, 1, 0.6); } : null });
  });
}
function rideLeg(g, S) {
  var C = S.C, armor = S.body === 'armor' || (S.a && S.a.cat === 'heavy'), pant = armor ? sh1(C('a')) : mute('#5a4a3e'), boot = armor ? (S.a ? mute(S.a.m[1]) : C('m')) : mute(BOOT);
  part(g, cap(31, 49.5, 33.6, 56, 2.8), pant, { sd: 1 });
  part(g, function (g) { g.moveTo(31, 55); g.lineTo(36, 55); g.quadraticCurveTo(39.6, 57, 39, 60.6); g.lineTo(31.2, 60.6); g.closePath(); }, boot, { sd: 0.9 });
}
function robeFeet(g, S, step) {
  var b = mute(BOOT);
  [[27.6, step === 1 ? 1.5 : 0], [35.4, step === 2 ? 1.5 : 0]].forEach(function (L) { part(g, function (g) { E(g, L[0] + 1, 60.4 - L[1], 3.3, 1.8); }, b, { sd: 0.5 }); });
}
function cape(g, c, trim, pose, step) {
  var sw = pose === 'atk' ? -3 : pose === 'hit' ? 2 : step ? -1 : 0;
  part(g, function (g) { g.moveTo(24, 37); g.quadraticCurveTo(15 + sw, 46, 12 + sw * 1.4, 58.5); g.quadraticCurveTo(17, 57, 19 + sw * 0.6, 60); g.quadraticCurveTo(24, 57.5, 30, 59); g.lineTo(37, 38); g.closePath(); }, c, { sd: 3.2 });
  curve(g, 22, 42, 18 + sw * 0.5, 50, 16 + sw, 57, css(sh2(c)), 0.7);
  curve(g, 26.5, 43, 24, 52, 23.5 + sw * 0.4, 58.5, css(sh1(c)), 0.6);
}
function wings(g, c, big, pose) {
  var s = big ? 1.25 : 1, f = pose === 'atk' ? -0.15 : 0;
  [[-1, 0], [1, 1]].forEach(function (W) {
    g.save(); g.translate(W[1] ? 28 : 24, 40); g.rotate((W[1] ? 0.35 : -0.25) + f); g.scale(s * (W[1] ? 0.85 : 1), s);
    part(g, function (g) { g.moveTo(0, 0); g.quadraticCurveTo(-6, -14, -14, -16); g.quadraticCurveTo(-19, -15, -21, -11); g.quadraticCurveTo(-17, -10, -18, -6); g.quadraticCurveTo(-14, -6, -14, -2); g.quadraticCurveTo(-10, -2, -9, 2); g.quadraticCurveTo(-5, 1, 0, 4); g.closePath(); }, W[1] ? sh1(c) : c, { sd: 2 });
    curve(g, -3, 1, -9, -6, -15, -12, css(sh1(c)), 0.6); g.restore();
  });
}
function smallWings(g, c) { [20.5, 41.5].forEach(function (x, i) { part(g, function (g) { var d = i ? 1 : -1; g.moveTo(x, 39); g.quadraticCurveTo(x + d * 5, 33, x + d * 7, 31.5); g.quadraticCurveTo(x + d * 6, 36, x + d * 2.4, 40.5); g.closePath(); }, c, { sd: 0.8 }); }); }
function torso(g, S, robe) {
  var C = S.C, a = C('a'), b = C('b'), A = S.a, body = S.body, bones = body === 'bones';
  var main = a, trim = b;
  var plate = A && A.cat === 'heavy' ? mute(A.m[1]) : null;      // 중갑: 겉옷(병과 색) 위에 재질 빛깔의 가슴판·어깨받이
  if (A) trim = mute(A.acc);
  if (A && A.grade >= 5 && A.cat !== 'heavy') main = mix(main, mute(A.m[1]), 0.6);
  if (bones) {
    part(g, function (g) { RR(g, 24, 37, 14, 13, 4); }, sh2(C('l')), { sd: 0.8, hl: 0 });
    for (var r = 0; r < 4; r++) part(g, function (g) { g.moveTo(25, 39.5 + r * 3); g.quadraticCurveTo(31, 37.8 + r * 3, 37, 39.5 + r * 3); g.lineTo(37, 41 + r * 3); g.quadraticCurveTo(31, 39.3 + r * 3, 25, 41 + r * 3); g.closePath(); }, C('l'), { sd: 0.4, hl: 0, ln: 0.6 });
    part(g, function (g) { RR(g, 30, 37, 2.2, 14, 1); }, C('l'), { sd: 0.4, hl: 0, ln: 0.6 });
    part(g, el(31, 51, 6, 2.6), C('L'), { sd: 0.6 }); return;
  }
  if (robe) {
    part(g, function (g) { g.moveTo(23.5, 37); g.lineTo(38.5, 37); g.quadraticCurveTo(42, 38, 42, 43); g.quadraticCurveTo(43.5, 53, 45, 60.3); g.quadraticCurveTo(31, 62.4, 17.5, 60.3); g.quadraticCurveTo(19.5, 52, 20, 43); g.quadraticCurveTo(20, 38, 23.5, 37); g.closePath(); }, main, { sd: 3.6 });
    curve(g, 27, 46, 25, 53, 23.5, 60, css(sh1(main)), 0.7); curve(g, 36, 47, 37.5, 54, 38.5, 60.5, css(sh1(main)), 0.7);
    part(g, function (g) { g.moveTo(17.6, 59); g.quadraticCurveTo(31, 61.2, 44.8, 59); g.lineTo(45.2, 61); g.quadraticCurveTo(31, 63.2, 17.3, 61); g.closePath(); }, trim, { sd: 0.5, hl: 0.3 });
    part(g, function (g) { RR(g, 29.6, 38, 3.4, 22.5, 1.4); }, trim, { sd: 0.7 });
    if (A && A.line === 'B') { for (var i = 0; i < 4; i++) curve(g, 22 + i * 5, 44 + i, 25 + i * 5, 50 + i, 23 + i * 5, 56, css(lt(main, 0.25), 0.7), 0.5); part(g, function (g) { g.moveTo(18.2, 56.4); g.quadraticCurveTo(31, 58.6, 44.2, 56.4); g.lineTo(44.4, 57.6); g.quadraticCurveTo(31, 59.8, 18, 57.6); g.closePath(); }, trim, { sd: 0.3, hl: 0 }); }
    part(g, function (g) { RR(g, 21.5, 46, 19, 2.6, 1.2); }, S.cls === 'mon' ? mute('#7a4a2a') : sh1(trim), { sd: 0.6 });
    part(g, function (g) { g.moveTo(26, 37); g.lineTo(31, 42.5); g.lineTo(36, 37); g.closePath(); }, lt(main, 0.15), { sd: 0.5 });
  } else {
    part(g, function (g) { g.moveTo(23, 37); g.lineTo(39, 37); g.quadraticCurveTo(42, 37.5, 41.6, 42); g.lineTo(40.6, 52.6); g.quadraticCurveTo(31, 55.2, 21.4, 52.6); g.lineTo(20.4, 42); g.quadraticCurveTo(20, 37.5, 23, 37); g.closePath(); }, main, { sd: 3.2, gl: (A && A.cat === 'heavy') || body === 'armor' ? function (g) { E(g, 26, 41, 1.6, 1.0, -0.4); } : null });
    if (plate) part(g, function (g) { g.moveTo(23.4, 37.6); g.lineTo(38.6, 37.6); g.quadraticCurveTo(40.4, 38.4, 40, 42); g.lineTo(38.4, 47.4); g.quadraticCurveTo(31, 49.6, 23.6, 47.4); g.lineTo(22, 42); g.quadraticCurveTo(21.6, 38.4, 23.4, 37.6); g.closePath(); }, plate, { sd: 2.4, hl: 0.8, gl: function (g) { E(g, 26.6, 40.6, 1.7, 1.0, -0.4); } });
    if (body === 'armor' || (A && A.cat === 'heavy')) {
      if (plate) main = plate;
      part(g, function (g) { g.moveTo(25, 37.5); g.quadraticCurveTo(31, 41.5, 37, 37.5); g.lineTo(37, 39.4); g.quadraticCurveTo(31, 43.4, 25, 39.4); g.closePath(); }, trim, { sd: 0.5 });
      if (A && A.line === 'B') { g.save(); g.beginPath(); RR(g, 21, 41, 20, 9, 2); g.clip(); for (var y = 41.5; y < 50; y += 1.6) for (var x = 21 + (y * 0.625 % 1.6); x < 41; x += 1.6) dot(g, x, y, 0.45, css(lt(main, 0.3), 0.8)); g.restore(); }
      else line(g, [31, 41.5, 31, 49], css(sh1(main)), 0.6);
      [[22, 50.5, 5.8], [27.6, 51.4, 6.6], [34, 51.4, 6.6]].forEach(function (t) { part(g, function (g) { RR(g, t[0], t[1], t[2], 4.6, 1.4); }, plate ? a : sh1(main), { sd: 0.8, hl: 0.4 }); });
      // 어깨받이 — 중갑 A 는 크게
      var big = A && A.cat === 'heavy' && A.line !== 'B' ? 1.25 : 1, pc = S.grade >= 5 ? mute('#d8b450') : main;
      part(g, el(22.2, 39.2, 4.8 * big, 3.6 * big, -0.2), pc, { sd: 1.4, gl: function (g) { E(g, 20.8, 37.8, 1.2, 0.7); } });
    } else {
      part(g, function (g) { g.moveTo(26.4, 37); g.lineTo(31, 41.5); g.lineTo(35.6, 37); g.closePath(); }, trim, { sd: 0.4 });
      if (body === 'tunic') { part(g, function (g) { g.moveTo(21.6, 49); g.lineTo(40.4, 49); g.lineTo(41, 54); g.quadraticCurveTo(31, 56.3, 21, 54); g.closePath(); }, sh1(main), { sd: 1.0 }); curve(g, 26, 50, 25.5, 52.5, 25, 55, css(sh2(main)), 0.5); curve(g, 35, 50, 35.5, 52.5, 36, 55, css(sh2(main)), 0.5); }
      if (A && A.cat === 'light') { part(g, function (g) { g.moveTo(23, 38.4); g.lineTo(27.6, 38.4); g.lineTo(31, 44); g.lineTo(34.4, 38.4); g.lineTo(39, 38.4); g.quadraticCurveTo(40.4, 43, 39.4, 48); g.lineTo(22.6, 48); g.quadraticCurveTo(21.6, 43, 23, 38.4); g.closePath(); }, A.grade >= 5 ? mute(A.m[1]) : mute(A.line === 'B' ? '#6a5040' : '#7a5636'), { sd: 1.6 }); line(g, [24, 38.5, 37.5, 48], css(mute('#4a3428')), 1.0); dot(g, 30.8, 43.2, 0.9, css(mute(A.acc))); }
    }
    part(g, function (g) { RR(g, 21, 47, 20, 2.8, 1.2); }, mute(body === 'armor' ? '#5a4436' : (S.pal && S.pal.B) || '#6f4a2c'), { sd: 0.6 });
    part(g, function (g) { RR(g, 29.4, 46.6, 3.6, 3.6, 0.8); }, trim, { sd: 0.6 });
  }
  if (A && A.grade >= 4 && A.sh !== 'crest') part(g, el(31, 44, 1.5, 1.3), A.grade === 4 ? '#9a6ad0' : A.gem || '#62b0ee', { sd: 0.5, gl: function (g) { E(g, 30.5, 43.4, 0.5, 0.4); } });
  if (A && A.sh === 'crest') part(g, function (g) { g.moveTo(27.5, 40); g.lineTo(34.5, 40); g.lineTo(34.5, 44); g.quadraticCurveTo(31, 48, 27.5, 44); g.closePath(); }, A.acc, { sd: 0.8 });
  if (A && (A.sh === 'fur' || A.sh === 'mane')) part(g, function (g) { blob(g, [20, 38, 24, 35.5, 31, 37, 38, 35.5, 42, 38, 38, 40.5, 31, 39.8, 24, 40.5]); }, A.m[1], { sd: 0.8 });
  if (has2(S, 'cape') && (S.tier >= 6 || S.head === 'crown')) part(g, function (g) { blob(g, [19.6, 39, 22, 35.4, 31, 37.4, 40, 35.4, 42.4, 39, 38, 41.4, 31, 40.2, 24, 41.4]); }, mute('#ece4d4'), { sd: 1, hl: 0.4 });      // 왕관 단: 흰 털 깃
  if (S.tier >= 4 && !bones && S.cls && S.cls.indexOf('m_') !== 0) { line(g, [26.4, 44.6, 31, 46, 35.6, 44.6], css(lt(trim, 0.2), 0.9), 0.6); if (S.tier >= 7) { dot(g, 31, 45.4, 0.9, css(mute(S.tier >= 8 ? '#e04a5a' : '#5a8ac0'))); } }
  if (S.faded) { g.save(); g.translate(27, 43); g.beginPath(); for (var k = 0; k < 8; k++) { var q = k / 8 * 6.2832, rr = k & 1 ? 0.6 : 1.8; g.lineTo(Math.cos(q) * rr, Math.sin(q) * rr); } g.closePath(); g.fillStyle = 'rgba(214,226,232,.95)'; g.fill(); g.restore(); }      // 돌아온 이: 가슴에 빛바랜 별빛 한 점
}
function has2(S, n) { return (S.items || []).indexOf(n) >= 0; }
function backArm(g, S, shield, pose) {
  var C = S.C, sl = C('a'), hd = pose === 'atk' ? [21.5, 45] : pose === 'hit' ? [17.5, 42] : [19.5, 47];
  if (S.body === 'bones') { part(g, cap(24, 39, hd[0], hd[1], 1.1), C('l'), { sd: 0.4 }); return; }
  part(g, cap(23.4, 39.5, hd[0], hd[1], 2.4), sh1(sl), { sd: 1 });
  if (!shield) part(g, circ(hd[0], hd[1] + 0.6, 2.1), sh1(C('s')), { sd: 0.6 });
}
function frontArm(g, S, hand, w) {
  var C = S.C, sl = C('a'), pl = S.a && S.a.cat === 'heavy' ? mute(S.a.m[1]) : sl, sx = 39.2, sy = 39.6;
  if (S.body === 'bones') { part(g, cap(sx, sy, hand[0], hand[1], 1.1), C('l'), { sd: 0.4 }); part(g, circ(hand[0], hand[1], 1.6), C('l'), { sd: 0.4 }); return; }
  var mx = (sx + hand[0]) / 2 + 1, my = (sy + hand[1]) / 2;
  part(g, cap(sx, sy, mx, my, 2.5), sl, { sd: 1.1 });
  part(g, cap(mx, my, hand[0], hand[1], 2.2), sl, { sd: 1 });
  if (S.body === 'armor' || (S.a && S.a.cat === 'heavy')) { var big = S.a && S.a.cat === 'heavy' && S.a.line !== 'B' ? 1.25 : 1; part(g, el(40.2, 39.2, 4.8 * big, 3.6 * big, 0.2), S.grade >= 5 ? mute('#d8b450') : pl, { sd: 1.4, gl: function (g) { E(g, 38.8, 37.8, 1.2, 0.7); } }); }
  part(g, circ(hand[0], hand[1], 2.15), (S.body === 'armor' || (S.a && S.a.cat === 'heavy')) ? mute('#6a5444') : C('s'), { sd: 0.8 });
}
function shieldP(g, S, pose) {
  var C = S.C, u = C('u'), x = pose === 'atk' ? 20.5 : pose === 'hit' ? 17 : 18.6, y = pose === 'hit' ? 42 : 46;
  part(g, function (g) { g.moveTo(x - 6, y - 7); g.quadraticCurveTo(x, y - 8.6, x + 6, y - 7); g.quadraticCurveTo(x + 6.4, y + 3, x, y + 8.4); g.quadraticCurveTo(x - 6.4, y + 3, x - 6, y - 7); g.closePath(); }, u, { sd: 2.6, gl: function (g) { E(g, x - 3, y - 4.5, 1.6, 0.9, -0.3); } });
  part(g, function (g) { g.moveTo(x - 4.4, y - 5.6); g.quadraticCurveTo(x, y - 6.8, x + 4.4, y - 5.6); g.quadraticCurveTo(x + 4.6, y + 2.2, x, y + 6.4); g.quadraticCurveTo(x - 4.6, y + 2.2, x - 4.4, y - 5.6); g.closePath(); }, sh1(u), { sd: 0, hl: 0, ln: 0.5 });
  part(g, function (g) { RR(g, x - 0.9, y - 5.4, 1.8, 10.6, 0.8); RR(g, x - 4, y - 2.2, 8, 1.8, 0.8); }, C('b'), { sd: 0.5 });
  dot(g, x, y - 1.3, 0.9, css(lt(C('b'), 0.3)));
}

// ── 머리 ──
var HAIRLESS = { helm: 1, plume: 1, horned: 1, hood: 1, mask: 1, veil: 1, darkhood: 1, skull: 1, bald: 1 };
function hairCol(S) { var h = S.head; if (S.age === 'elder') return mute('#e6e2da'); if (h === 'tricorn' || h === 'mitre' || h === 'wizhat') return mute(S.pal.hair || '#6b4a32'); return S.C('h'); }
function isF(S) { return S.sx === 'f' || (!S.sx && (S.head === 'tiara' || S.head === 'veil')); }
function headBack(g, S) {
  var C = S.C, h = S.head, hc = hairCol(S);
  if (h === 'veil') { part(g, function (g) { g.moveTo(17, 22); g.quadraticCurveTo(15, 34, 17.5, 42); g.quadraticCurveTo(24, 44, 29, 41); g.lineTo(40, 33); g.lineTo(44, 22); g.quadraticCurveTo(31, 6, 17, 22); g.closePath(); }, C('a'), { sd: 2.6 }); return; }
  if (h === 'hood' || h === 'mask' || h === 'darkhood') { var hcC = h === 'darkhood' ? C('a') : C('a'); part(g, function (g) { g.moveTo(15.5, 26); g.quadraticCurveTo(14, 14, 25, 10); g.quadraticCurveTo(38, 7, 45, 17); g.quadraticCurveTo(47.5, 28, 44, 36); g.quadraticCurveTo(32, 41, 18.5, 38); g.quadraticCurveTo(15, 34, 15.5, 26); g.closePath(); }, sh1(hcC), { sd: 2 }); return; }
  if (isF(S) && (h === 'helm' || h === 'plume' || h === 'horned')) { part(g, function (g) { g.moveTo(19, 22); g.quadraticCurveTo(9, 24, 10.6, 37); g.quadraticCurveTo(12.6, 42, 16.4, 41); g.quadraticCurveTo(13.6, 33, 21, 28); g.closePath(); }, hc, { sd: 1.4 }); return; }
  if (HAIRLESS[h]) return;
  if (isF(S)) part(g, function (g) { g.moveTo(17, 22); g.quadraticCurveTo(13.5, 34, 16, 43); g.quadraticCurveTo(20, 45.5, 25, 43); g.lineTo(30, 30); g.lineTo(30, 14); g.quadraticCurveTo(20, 13, 17, 22); g.closePath(); }, sh1(hc), { sd: 1.6 });
}
function face(g, S, cx, cy, sc) {      // 오른쪽 3/4 얼굴: 눈 둘 · 눈썹 · 입 · 볼
  var pose = S.pose || '', el = S.age === 'elder', f = isF(S), skin = S.C('s');
  var ex = [cx + 1.8, cy + 1.6], ex2 = [cx + 9.2, cy + 1.4], ry = (f ? 3.3 : 3.0) * sc, rx = 2.05 * sc, iris = mute(S.pal.eye || (S.cls === 'sha' ? '#7a3a5a' : S.cls === 'mar' ? '#2f6a7a' : '#4a3424'));
  var linec = css(ink(skin));
  if (pose === 'hit') { [ex, ex2].forEach(function (e, i) { line(g, [e[0] - 1.7, e[1] - 1.6, e[0] + 1.3 * (i ? -1 : 1) * 0 + 1.2, e[1], e[0] - 1.7, e[1] + 1.6], linec, 1.0); }); curve(g, cx + 4, cy + 7.6, cx + 5.5, cy + 6.2, cx + 7, cy + 7.6, linec, 0.8); return; }
  if (pose === 'cast' || el && pose !== 'atk') {
    [ex, ex2].forEach(function (e, i) { var w = i ? 0.82 : 1; curve(g, e[0] - 1.9 * w, e[1] + (el ? 0.2 : 0.6), e[0], e[1] + (el ? 1.4 : -1), e[0] + 1.9 * w, e[1] + (el ? 0.2 : 0.6), linec, 1.0); });
    if (el) { curve(g, ex[0] - 2.4, ex[1] - 2.8, ex[0], ex[1] - 3.8, ex[0] + 2.4, ex[1] - 2.8, css(mute('#e6e2da')), 1.1); curve(g, ex2[0] - 2, ex2[1] - 2.8, ex2[0], ex2[1] - 3.6, ex2[0] + 2, ex2[1] - 2.8, css(mute('#e6e2da')), 1.0); line(g, [cx - 1.5, cy + 4.8, cx + 0.4, cy + 5.4], css(sh1(skin)), 0.5); }
  } else {
    [ex, ex2].forEach(function (e, i) {
      var w = i ? 0.8 : 1; g.beginPath(); E(g, e[0], e[1], rx * w, ry); g.fillStyle = '#2a2030'; g.fill();
      g.save(); g.beginPath(); E(g, e[0], e[1], rx * w, ry); g.clip(); g.beginPath(); E(g, e[0], e[1] + ry * 0.75, rx * 1.1, ry * 0.7); g.fillStyle = css(iris); g.fill(); g.restore();
      dot(g, e[0] - 0.55 * w, e[1] - ry * 0.42, 0.75 * sc, 'rgba(255,250,240,.92)');
      if (f) line(g, [e[0] + rx * w * 0.7, e[1] - ry * 0.75, e[0] + rx * w + 0.9, e[1] - ry - 0.2], '#2a2030', 0.6);
      var by = e[1] - ry - 1.4, tilt = pose === 'atk' ? 0.9 : 0;
      line(g, [e[0] - 1.8 * w, by - (i ? tilt : -tilt) * 0 - (i ? 0 : 0) + (i ? 0 : -tilt * 0.4), e[0] + 1.8 * w, by + (i ? -tilt : tilt)], el ? css(mute('#e6e2da')) : css(ink(hairCol(S))), 0.9);
    });
  }
  if (pose === 'atk') { part(g, function (g) { g.moveTo(cx + 4, cy + 6.8); g.quadraticCurveTo(cx + 6, cy + 6.2, cx + 7.6, cy + 6.6); g.quadraticCurveTo(cx + 6.6, cy + 9.4, cx + 4.6, cy + 8.6); g.closePath(); }, '#7a3a3a', { sd: 0, hl: 0, ln: 0.6 }); }
  else curve(g, cx + 4.6, cy + 7.2, cx + 6, cy + 7.9, cx + 7.4, cy + 7.0, linec, 0.75);
  if (S.age !== 'elder') { g.fillStyle = 'rgba(214,110,110,.2)'; g.beginPath(); E(g, ex[0] - 1.2, ex[1] + 4.2, 1.9, 1.0); g.fill(); }
}
function headFront(g, S) {
  var C = S.C, h = S.head, hc = hairCol(S), skin = C('s'), f = isF(S), el = S.age === 'elder', male = !f;
  var cx = 31, cy = 24.5;
  if (DS.artHeadX && DS.artHeadX(g, S)) return;
  if (h === 'skull') {
    part(g, function (g) { blob(g, [18, 24, 20, 13, 31, 10, 42, 13, 45, 23, 43, 30, 39, 31, 38, 36, 30, 36, 28, 31, 20, 30]); }, C('l'), { sd: 2.6 });
    dot(g, 33.5, 25, 2.8, '#1e1824'); dot(g, 40.5, 24.6, 2.4, '#1e1824'); dot(g, 33.5, 25.3, 1.0, css(mute(S.pal.x || '#9fe0b0'))); dot(g, 40.5, 24.9, 0.9, css(mute(S.pal.x || '#9fe0b0')));
    for (var t = 0; t < 4; t++) line(g, [31 + t * 2.2, 33, 31 + t * 2.2, 35.4], '#4a4038', 0.5);
    line(g, [37, 29, 36, 30.6, 38, 30.6], '#3a3038', 0.6); headGear(g, S, C); return;
  }
  if (h === 'darkhood') {
    part(g, function (g) { blob(g, [21, 26, 25, 17, 35, 15.5, 43.5, 20, 44.5, 30, 38, 36.5, 26, 35.5]); }, mute(S.pal.z || '#1f1a2a'), { sd: 1.4, hl: 0 });
    var gx = mute(S.pal.x || '#b6ff5a'); dot(g, 34.5, 27, 2.3, css(gx, 0.25)); dot(g, 41.2, 26.8, 2, css(gx, 0.25)); part(g, el2(34.5, 27, 1.2, 1.6), gx, { sd: 0, hl: 0, ln: 0 }); part(g, el2(41.2, 26.8, 1.0, 1.4), gx, { sd: 0, hl: 0, ln: 0 });
    headGear(g, S, C); return;
  }
  // 얼굴
  part(g, function (g) { g.moveTo(17.6, 24); g.quadraticCurveTo(17.6, 10.8, 31, 10.8); g.quadraticCurveTo(44.6, 10.8, 44.6, 23.4); g.quadraticCurveTo(44.8, 33, 38.6, 36.4); g.quadraticCurveTo(33, 38.6, 26.4, 36.6); g.quadraticCurveTo(17.6, 33.4, 17.6, 24); g.closePath(); }, skin, { sd: 2.6, hl: 0.6 });
  if (!{ hood: 1, mask: 1, veil: 1, helm: 1, plume: 1, horned: 1 }[h]) part(g, el2(23.2, 27.2, 2.2, 2.8), skin, { sd: 0.8 });
  if (S.age === 'prime' && male && h !== 'mask') { g.fillStyle = css(sh1(skin), 0.45); g.beginPath(); g.moveTo(26, 34); g.quadraticCurveTo(33, 38.6, 41, 33.4); g.quadraticCurveTo(39, 37.4, 33, 37.8); g.quadraticCurveTo(28, 37.6, 26, 34); g.fill(); }
  face(g, S, cx, cy, 1);
  if (el && male && h !== 'mask') part(g, function (g) { g.moveTo(27, 32.5); g.quadraticCurveTo(33.5, 35, 41.5, 31); g.quadraticCurveTo(41, 38, 35, 40.5); g.quadraticCurveTo(29, 39.5, 27, 32.5); g.closePath(); }, mute('#e6e2da'), { sd: 1.4 });
  if (el) line(g, [37, 18.5, 40.5, 18.2], css(sh1(skin)), 0.5);
  // 머리카락 (앞)
  if (!HAIRLESS[h] && !(h === 'wizhat' && false)) {
    part(g, function (g) {
      g.moveTo(16.8, 31); g.quadraticCurveTo(15.6, 9.6, 31, 9.4); g.quadraticCurveTo(45.6, 9.6, 45.4, 22);
      g.lineTo(43.6, 20.4); g.lineTo(42.6, 23); g.lineTo(39.8, 19.2); g.lineTo(37.4, 22.2); g.lineTo(34.6, 18.6); g.lineTo(31.6, 21.6); g.lineTo(28.8, 18.8); g.quadraticCurveTo(25.6, 22, 25.6, 26);
      if (f) { g.quadraticCurveTo(26.4, 33, 25, 39.5); g.quadraticCurveTo(22, 40, 20.5, 38); }
      else { g.lineTo(23.5, 29.5); g.lineTo(21.4, 33.2); }
      g.closePath();
    }, hc, { sd: 2.2, hl: 0.7, gl: function (g) { E(g, 26, 13.6, 4.2, 1.1, -0.35); } });
    curve(g, 33, 11.5, 30, 15, 29.2, 18.4, css(sh1(hc)), 0.6); curve(g, 38.5, 12, 37.6, 16, 37.6, 20, css(sh1(hc)), 0.55);
    if (f && S.head !== 'tiara' && S.head !== 'crown') part(g, function (g) { g.moveTo(18, 17); g.quadraticCurveTo(10, 18, 9.8, 26); g.quadraticCurveTo(12.6, 23, 16.6, 23.6); g.closePath(); }, hc, { sd: 1 });
  }
  if (h === 'bald') { g.fillStyle = css(lt(skin, 0.5), 0.8); g.beginPath(); E(g, 26, 14.6, 3.6, 1.6, -0.4); g.fill(); if (S.pal.b) dot(g, 33.5, 16.5, 0.95, css(mute(S.pal.b))); }
  headGear(g, S, C);
}
function el2(x, y, rx, ry, a) { return function (g) { E(g, x, y, rx, ry, a); }; }
function helmDome(g, metal, trim) {
  part(g, function (g) { g.moveTo(16, 33); g.lineTo(16, 23.5); g.ellipse(31, 23.5, 15, 13.6, 0, Math.PI, 2 * Math.PI); g.lineTo(46, 21.8); g.lineTo(30.5, 21.8); g.quadraticCurveTo(26.4, 22.4, 26, 27.5); g.lineTo(25.2, 34); g.closePath(); }, metal, { sd: 3, hl: 0.8, gl: function (g) { E(g, 24, 14.4, 3.4, 1.4, -0.5); } });
  part(g, function (g) { g.moveTo(30.2, 19.4); g.lineTo(46.2, 19.4); g.lineTo(46.2, 22.4); g.lineTo(30.2, 22.4); g.quadraticCurveTo(28.2, 22.6, 27.2, 24.6); g.lineTo(26.4, 21.6); g.quadraticCurveTo(27.6, 19.5, 30.2, 19.4); g.closePath(); }, trim, { sd: 0.8 });
  dot(g, 21, 26, 0.8, css(lt(trim, 0.3))); dot(g, 21, 30, 0.8, css(lt(trim, 0.3)));
}
function headGear(g, S, C) {
  var h = S.head, gc = S.gc ? mute(S.gc) : null;
  var metal = mute(S.pal.m || '#aab2c2'), trim = C('b');
  if (S.a && S.a.cat === 'heavy' && (h === 'helm' || h === 'plume' || h === 'horned')) { metal = mute(S.a.m[1]); trim = mute(S.a.acc); }
  if (h === 'helm' || h === 'plume' || h === 'horned') {
    if (h === 'horned') [[19, -1], [43, 1]].forEach(function (p) { part(g, function (g) { var x = p[0], d = p[1]; g.moveTo(x - 2.6 * d, 15); g.quadraticCurveTo(x + 4 * d, 9, x + 4.6 * d, 1.5); g.quadraticCurveTo(x + 6.4 * d, 10, x + 2.6 * d, 18); g.closePath(); }, mute(S.pal.w && S.cls !== 'mar' ? '#e2d6bc' : '#e2d6bc'), { sd: 1.3 }); });
    helmDome(g, metal, trim);
    if (h === 'plume' || gc) { var pc = gc || C('r'); part(g, function (g) { g.moveTo(30, 11); g.quadraticCurveTo(29, 3, 36, 1.6); g.quadraticCurveTo(31.6, 4.6, 33.4, 7.6); g.quadraticCurveTo(24, 3.4, 15.4, 10.6); g.quadraticCurveTo(20, 13, 21.6, 16.6); g.quadraticCurveTo(26, 10.6, 30, 11); g.closePath(); }, pc, { sd: 1.8 }); curve(g, 31, 5.5, 25, 7.4, 19, 11.8, css(sh1(pc)), 0.6); }
  } else if (h === 'crown') {
    var gold = mute(S.pal.i || '#d8b450');
    part(g, function (g) { g.moveTo(20.6, 15.6); g.lineTo(20, 7.6); g.lineTo(24.6, 11.2); g.lineTo(28.2, 4.6); g.lineTo(31.6, 10.4); g.lineTo(35.6, 4.8); g.lineTo(38.4, 11.2); g.lineTo(42.6, 7.4); g.lineTo(42.2, 15.8); g.quadraticCurveTo(31.4, 13.4, 20.6, 15.6); g.closePath(); }, gold, { sd: 1.4, hl: 0.7 });
    [[28.2, 6.4], [35.6, 6.6]].forEach(function (p) { dot(g, p[0], p[1], 0.85, css(lt(gold, 0.5))); });
    part(g, el2(31.6, 13.2, 1.5, 1.3), C('r'), { sd: 0.5, gl: function (g) { E(g, 31.1, 12.7, 0.45, 0.35); } }); part(g, el2(25, 13.6, 1.0, 1.0), '#5a8ac0', { sd: 0.3 });
    if (gc) part(g, el2(38.6, 13.6, 1.0, 1.0), gc, { sd: 0.3 });
  } else if (h === 'tiara') {
    var tg = mute(S.pal.i || '#d8b450');
    part(g, function (g) { g.moveTo(22, 14.8); g.quadraticCurveTo(31, 9.6, 41.8, 14.4); g.lineTo(41.4, 16.2); g.quadraticCurveTo(31, 12, 22.4, 16.6); g.closePath(); }, tg, { sd: 0.5 });
    part(g, function (g) { g.moveTo(31.4, 7.6); g.lineTo(33.6, 11.6); g.lineTo(31.4, 14.2); g.lineTo(29.2, 11.6); g.closePath(); }, S.pal.b || '#62b0ee', { sd: 0.7 });
  } else if (h === 'hood' || h === 'mask') {
    var hcC = C('a');
    part(g, function (g) { g.moveTo(15.5, 26); g.quadraticCurveTo(14, 14, 25, 9.8); g.quadraticCurveTo(38, 7, 45.4, 17.4); g.quadraticCurveTo(47.6, 25, 45.6, 28.2); g.quadraticCurveTo(45, 18.6, 34, 17.4); g.quadraticCurveTo(26.6, 17.6, 25.6, 26); g.quadraticCurveTo(25.2, 33, 27, 37.8); g.quadraticCurveTo(19, 38, 16.6, 33.8); g.closePath(); }, hcC, { sd: 2.6, gl: function (g) { E(g, 22, 13.4, 3.2, 1.3, -0.5); } });
    curve(g, 18.6, 30, 19.6, 20, 27, 13.6, css(sh1(hcC)), 0.6);
    if (h === 'mask') part(g, function (g) { g.moveTo(26, 28.4); g.quadraticCurveTo(36, 30.6, 45.4, 27.2); g.quadraticCurveTo(45, 34.8, 38.6, 37.2); g.quadraticCurveTo(31, 39.2, 26.6, 36.6); g.closePath(); }, mute(S.pal.O || '#3a3048'), { sd: 1.2 });
  } else if (h === 'veil') {
    var vc = C('a');
    part(g, function (g) { g.moveTo(16, 30); g.quadraticCurveTo(14.6, 11, 31, 9.4); g.quadraticCurveTo(46.6, 9.6, 46, 25); g.quadraticCurveTo(43.6, 18.4, 36, 17.6); g.quadraticCurveTo(27.4, 17.2, 25.6, 25.6); g.quadraticCurveTo(25, 34, 27.6, 40); g.quadraticCurveTo(19, 41, 16, 30); g.closePath(); }, vc, { sd: 2.6 });
    part(g, function (g) { g.moveTo(25.4, 21.5); g.quadraticCurveTo(33, 15.4, 45.8, 19.6); g.lineTo(46, 22.4); g.quadraticCurveTo(34, 18.6, 25.8, 24.6); g.closePath(); }, C('b'), { sd: 0.5 });
  } else if (h === 'tricorn') {
    var tc = C('h');
    part(g, function (g) { blob(g, [21, 13, 26, 4.6, 36, 4.6, 41.6, 13]); }, tc, { sd: 1.6 });
    part(g, function (g) { g.moveTo(11.6, 14.2); g.quadraticCurveTo(14, 9.2, 19, 12.4); g.quadraticCurveTo(31, 7.6, 43, 12.4); g.quadraticCurveTo(48.6, 9.6, 50.4, 14.4); g.quadraticCurveTo(31, 20.6, 11.6, 14.2); g.closePath(); }, tc, { sd: 1.2, hl: 0.6 });
    curve(g, 14, 13.8, 31, 18.2, 48, 13.8, css(C('b')), 0.9); part(g, el2(33, 13.6, 1.5, 1.4), C('B') || C('b'), { sd: 0.4 });
  } else if (h === 'mitre') {
    var mc = C('h');
    part(g, function (g) { g.moveTo(21.4, 15.6); g.quadraticCurveTo(21, 6, 31.2, -0.4); g.quadraticCurveTo(41.6, 6, 41.2, 15.6); g.quadraticCurveTo(31.2, 13.4, 21.4, 15.6); g.closePath(); }, mc, { sd: 2 });
    part(g, function (g) { RR(g, 30, 2.4, 2.6, 11, 1); RR(g, 27, 5.8, 8.6, 2.4, 1); }, C('b'), { sd: 0.6 });
    part(g, function (g) { g.moveTo(21.2, 14.2); g.quadraticCurveTo(31.2, 12, 41.4, 14.2); g.lineTo(41.4, 16.6); g.quadraticCurveTo(31.2, 14.4, 21.2, 16.6); g.closePath(); }, C('b'), { sd: 0.4 });
  } else if (h === 'wizhat') {
    var wc = C('a'), pose = S.pose;
    part(g, function (g) { g.moveTo(20, 15); g.quadraticCurveTo(22, 6, 26.4, 3); g.quadraticCurveTo(21 - (pose === 'hit' ? 3 : 0), 3.6, 12.6 - (pose === 'atk' ? 1.6 : 0), 4.4); g.quadraticCurveTo(26, -1.4, 33.6, 3.4); g.quadraticCurveTo(39, 7, 42, 15); g.closePath(); }, wc, { sd: 2.6, gl: function (g) { E(g, 25, 6.5, 1.2, 3.2, 0.4); } });
    part(g, function (g) { g.moveTo(8.6, 16.4); g.quadraticCurveTo(15, 11.6, 31, 12.4); g.quadraticCurveTo(47, 11.8, 52.6, 16.2); g.quadraticCurveTo(31, 22, 8.6, 16.4); g.closePath(); }, wc, { sd: 1.4, hl: 0.6 });
    part(g, function (g) { g.moveTo(19.6, 12.6); g.quadraticCurveTo(31, 10, 42.4, 12.6); g.lineTo(42.8, 15.2); g.quadraticCurveTo(31, 12.8, 19.4, 15.2); g.closePath(); }, C('b'), { sd: 0.5 });
    part(g, function (g) { poly(g, [30.6, 9.6, 31.6, 11.6, 33.6, 12, 32, 13.2, 32.4, 15.2, 30.6, 14.1, 28.8, 15.2, 29.2, 13.2, 27.6, 12, 29.6, 11.6]); }, S.pal.c || '#d8b450', { sd: 0.4, hl: 0, ln: 0.5 });
  } else if (h === 'darkhood') {
    var dc = C('a');
    part(g, function (g) { g.moveTo(14.6, 30); g.quadraticCurveTo(12, 10, 28, 6.2); g.quadraticCurveTo(36, 4.8, 41, 9); g.quadraticCurveTo(44, 7, 47, 3.6); g.quadraticCurveTo(48, 10, 46.6, 15); g.quadraticCurveTo(49, 24, 46, 33); g.quadraticCurveTo(44.6, 22, 36, 18.4); g.quadraticCurveTo(26, 17, 23.6, 27); g.quadraticCurveTo(23, 34, 25, 40); g.quadraticCurveTo(17, 39, 14.6, 30); g.closePath(); }, dc, { sd: 2.8 });
    curve(g, 18, 32, 17.6, 18, 27, 10, css(sh1(dc)), 0.6);
    if (S.pal.b) curve(g, 23.4, 33, 25, 19, 38, 17.6, css(mute(S.pal.b)), 0.8);
  }
}
DS.artFace = face;
})();
