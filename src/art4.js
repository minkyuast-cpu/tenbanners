// r14 새 그림 ④ — 시나리오 보스 31 · 큰 부대원 4 · 일반 몬스터. 64 단위 상자에 그린 것을 큰 몸(96 단위)에는 1.42 배로 얹는다.
// 몸통이 겹치지 않게 보스마다 실루엣을 따로 잡고(짐승·뱀·용·거인·사람·정령·벌레·공성기), 이야기 역할에 맞는 표식을 단다.
//   어스름의 왕 = 지워진 이름들이 모인 형상(겹친 흐린 얼굴들 + 긁힌 이름 패 왕관 + 검은 실), 어스름의 사도 = 옛 대장의 모습을 빌린 그림자(천 없는 깃대).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var T = DS.artTools; if (!T) return;
var part = T.part, mute = T.mute, blob = T.blob, E = T.E, RR = T.RR, poly = T.poly, line = T.line, curve = T.curve, dot = T.dot, mix = T.mix, css = T.css, sh1 = T.sh1, sh2 = T.sh2, lt = T.lt, ink = T.ink;
var HT = DS.artHumanTools, circ = HT.circ, el = HT.el, cap = HT.cap, B3 = DS.artBeasts, MAT = DS.artMAT, ACC = DS.artACC, LEG = DS.artLEG;
function m(c) { return mute(c); }
function eye(g, x, y, r, col, glow) { if (glow) dot(g, x, y, r * 2, css(m(col), 0.28)); dot(g, x, y, r, glow ? css(m(col)) : '#2a2030'); if (!glow) dot(g, x - r * 0.35, y - r * 0.35, r * 0.38, 'rgba(255,250,240,.9)'); }
function W(leg, cat, kind) { var L = LEG[leg] || { m: MAT[7], acc: ACC[7], gem: '#62b0ee' }; return { cat: cat, kind: kind, t: 8, m: L.m, acc: L.acc, gem: L.gem, orb: L.gem, sh: LEG[leg] ? L.sh : null, grade: 5 }; }
function held(g, x, y, a, s, d) { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); DS.artWeapon(g, d); g.restore(); }
function poseA(pose) { return pose === 'atk' ? 1 : pose === 'hit' ? -1 : 0; }

// ───────── 거인 (오우거 · 그록 · 바르간 · 토르막 · 문지기) ─────────
function brute(g, K, o, pose, step) {
  var a = m(K.a), d = m(K.A), b = m(K.b), pa = poseA(pose), lean = pa * 0.1;
  [[24, step === 1 ? 2 : 0], [37, step === 2 ? 2 : 0]].forEach(function (L, i) { part(g, function (g) { RR(g, L[0] - 4.4, 48, 8.8, 13.4 - L[1], 3.4); }, i ? a : sh1(a), { sd: 1.6 }); part(g, el(L[0] + 0.8, 60.4 - L[1], 5.4, 2.2), d, { sd: 0.7 }); });
  g.save(); g.translate(31, 52); g.rotate(lean); g.translate(-31, -52);
  part(g, cap(18, 32, 13 - pa * 1, 47, 4.4), sh1(a), { sd: 1.6 });
  part(g, function (g) { blob(g, [14, 34, 19, 25, 31, 22.6, 44, 25, 49, 34, 48, 46, 41, 53.4, 22, 53.4, 15, 46]); }, a, { sd: 4.6, gl: function (g) { E(g, 21, 30, 3.4, 1.4, -0.5); } });
  part(g, function (g) { blob(g, [21, 41, 31, 37, 41, 41, 40, 50, 31, 52.6, 22, 50]); }, lt(a, 0.18), { sd: 1.6, hl: 0 });
  part(g, function (g) { g.moveTo(17.6, 46); g.quadraticCurveTo(31, 50, 45, 46); g.lineTo(45.6, 50); g.lineTo(40, 57); g.lineTo(34, 51.6); g.lineTo(28, 57); g.lineTo(22, 51.6); g.lineTo(17, 50); g.closePath(); }, b, { sd: 1.6 });
  part(g, function (g) { RR(g, 17, 45, 28.6, 3.2, 1.4); }, m('#4a3428'), { sd: 0.6 });
  if (o.lava) { [[20, 32, 26, 38, 24, 44], [36, 30, 33, 36, 39, 42], [28, 44, 31, 48]].forEach(function (l) { line(g, l, css(m('#ffb347')), 1.4); line(g, l, css(m('#fff0a0')), 0.5); }); }
  if (o.obs) { [[22, 30, 27, 33], [37, 28, 41, 34], [33, 40, 38, 44]].forEach(function (l) { line(g, l, css(lt(a, 0.5)), 0.8); }); }
  var hx = 36 + pa * 1.4, hy = 18;
  if (o.head === 'bull') {
    [[-1, 26], [1, 46]].forEach(function (p) { part(g, function (g) { var x = p[1], s = p[0]; g.moveTo(x - s * 1, hy - 4); g.quadraticCurveTo(x + s * 7, hy - 6, x + s * 6.6, hy - 15); g.quadraticCurveTo(x + s * 10, hy - 6, x + s * 2, hy + 1); g.closePath(); }, m('#e2d6bc'), { sd: 1.2 }); });
    part(g, function (g) { blob(g, [hx - 10, hy - 2, hx - 6, hy - 9, hx + 5, hy - 9, hx + 10, hy - 2, hx + 12, hy + 6, hx + 6, hy + 10, hx - 6, hy + 9]); }, a, { sd: 2.4 });
    part(g, el(hx + 6, hy + 5, 6, 4.4), lt(a, 0.25), { sd: 1 }); dot(g, hx + 5, hy + 4.6, 0.8, '#2a2030'); dot(g, hx + 9, hy + 4.6, 0.8, '#2a2030');
    g.beginPath(); E(g, hx + 7, hy + 9, 2.4, 2); g.lineWidth = 1; g.strokeStyle = css(m('#d8b450')); g.stroke();
    eye(g, hx - 1, hy - 2, 1.5, K.x || '#ff4d6d', true); eye(g, hx + 5.6, hy - 2.4, 1.3, K.x || '#ff4d6d', true);
  } else {
    var hc = o.head === 'lava' || o.head === 'obs' ? d : a;
    part(g, function (g) { blob(g, [hx - 10, hy + 2, hx - 9, hy - 7, hx, hy - 11, hx + 9, hy - 8, hx + 11, hy + 1, hx + 8, hy + 9, hx - 6, hy + 9]); }, hc, { sd: 2.6, hl: 0.7 });
    if (o.head === 'orc') { part(g, function (g) { poly(g, [hx - 4, hy - 10, hx - 1, hy - 16, hx + 2, hy - 10.4, hx + 4, hy - 15, hx + 5.6, hy - 9]); }, m('#2b2440'), { sd: 0.6 }); }
    if (o.lump) part(g, circ(hx - 5, hy - 9, 3.4), lt(hc, 0.1), { sd: 1 });
    if (o.head === 'lava') { for (var f = 0; f < 5; f++) part(g, function (g) { var x = hx - 9 + f * 4.4; g.moveTo(x - 2, hy - 6); g.quadraticCurveTo(x - 1, hy - 13 - (f & 1) * 3, x + 1, hy - 15 - (f & 1) * 3); g.quadraticCurveTo(x + 2.4, hy - 10, x + 2, hy - 6); g.closePath(); }, m(f & 1 ? '#ffb347' : '#e0603a'), { sd: 0.8 }); part(g, function (g) { blob(g, [hx - 12, hy + 6, hx, hy + 3, hx + 12, hy + 6, hx + 9, hy + 12, hx - 9, hy + 12]); }, m('#ff8a3a'), { sd: 1 }); }
    if (o.head === 'obs') { part(g, function (g) { poly(g, [hx - 9, hy - 5, hx - 12, hy - 14, hx - 5, hy - 9]); poly(g, [hx + 8, hy - 6, hx + 12, hy - 15, hx + 4, hy - 9.6]); }, m('#2c2740'), { sd: 0.6 }); }
    eye(g, hx + 1, hy - 0.6, 1.6, o.glow ? K.x : null, !!o.glow); eye(g, hx + 7, hy - 1, 1.3, o.glow ? K.x : null, !!o.glow);
    line(g, [hx - 2, hy - 4, hx + 3, hy - 3], css(ink(hc)), 1); line(g, [hx + 5.4, hy - 3.6, hx + 9, hy - 4.2], css(ink(hc)), 1);
    part(g, function (g) { g.moveTo(hx - 1, hy + 4.6); g.quadraticCurveTo(hx + 4, hy + 7.4, hx + 9, hy + 4); g.quadraticCurveTo(hx + 4, hy + 6, hx - 1, hy + 4.6); g.closePath(); }, '#3a2a30', { sd: 0, hl: 0, ln: 0.8 });
    if (o.tusk) { part(g, function (g) { poly(g, [hx, hy + 5, hx + 1, hy + 1.4, hx + 2, hy + 5.2]); poly(g, [hx + 6.6, hy + 4.8, hx + 7.6, hy + 1.2, hx + 8.6, hy + 4.6]); }, m('#f0e6cc'), { sd: 0.3, hl: 0 }); }
  }
  var wx = 47 + pa * 4, wy = 42 - pa * 4, wa = pa > 0 ? 1.3 : pa < 0 ? -0.5 : 0.2;
  if (o.weapon) held(g, wx, wy, wa, 1.5, o.weapon);
  part(g, cap(44, 31, wx, wy, 4.4), a, { sd: 1.8 });
  part(g, circ(wx, wy, 4), lt(a, 0.08), { sd: 1.2 });
  if (o.cuff) part(g, function (g) { RR(g, 40.6, 34, 7.6, 4, 1.4); }, m(o.cuff), { sd: 0.8 });
  g.restore();
}
// ───────── 네발 짐승 (어미늑대 · 무덤지기 석수 · 늑대 · 불도마뱀) ─────────
function quad(g, K, o, pose, step) {
  var a = m(K.a), d = m(K.A), b = m(K.b || K.a), pa = poseA(pose);
  if (o.lizard) part(g, function (g) { g.moveTo(16, 44); g.quadraticCurveTo(6, 46, 3, 56); g.quadraticCurveTo(9, 50, 17, 49); g.closePath(); }, a, { sd: 1.2 });
  else part(g, function (g) { g.moveTo(15, 40); g.quadraticCurveTo(5, 36, 3.6, 26 + (o.lion ? 6 : 0)); g.quadraticCurveTo(9, 33, 14, 33); g.quadraticCurveTo(10, 30, 12, 26); g.quadraticCurveTo(15, 34, 18, 38); g.closePath(); }, o.lion ? d : a, { sd: 1.6 });
  [[18, step === 1 ? 2 : 0], [38, step === 2 ? 2 : 0]].forEach(function (L) { part(g, cap(L[0], 45, L[0] - 0.6, (o.lizard ? 56 : 58.6) - L[1], 2.6), sh1(a), { sd: 0.8 }); });
  part(g, function (g) { blob(g, o.lizard ? [13, 46, 17, 40, 30, 39, 42, 39.4, 49, 43, 46, 50, 30, 52, 17, 51] : [13, 42, 17, 34, 30, 32, 42, 32.4, 49, 38, 46, 48, 30, 50.6, 17, 49]); }, a, { sd: 3.4, gl: function (g) { E(g, 24, 35, 4, 1, -0.1); } });
  part(g, function (g) { blob(g, [24, 47, 34, 44, 44, 45, 42, 49.6, 30, 50.6]); }, b, { sd: 1, hl: 0 });
  if (o.lion) { [[20, 38, 23, 44], [30, 36, 33, 42], [24, 41, 28, 41]].forEach(function (l) { line(g, l, css(sh1(a)), 0.8); }); dot(g, 26, 40, 1.2, css(m(K.x || '#7fe3ff'))); }
  [[22, step === 2 ? 2 : 0], [42, step === 1 ? 2 : 0]].forEach(function (L) { var by = (o.lizard ? 56 : 58.6) - L[1]; part(g, cap(L[0], 45, L[0] + 0.6, by, 2.8), a, { sd: 1 }); part(g, el(L[0] + 1.8, by + 1, 3.2, 1.8), d, { sd: 0.5 }); });
  var hx = 50 + pa * 2, hy = (o.lizard ? 36 : 30) - pa;
  if (o.lion) part(g, function (g) { blob(g, [hx - 13, hy + 2, hx - 11, hy - 8, hx - 3, hy - 13, hx + 6, hy - 11, hx + 9, hy - 3, hx + 6, hy + 8, hx - 4, hy + 12, hx - 12, hy + 10]); }, d, { sd: 2.4 });
  else if (!o.lizard) part(g, function (g) { blob(g, [hx - 12, hy + 4, hx - 10, hy - 4, hx - 4, hy - 6, hx - 2, hy + 6, hx - 6, hy + 11]); }, lt(a, 0.15), { sd: 1.4 });
  part(g, function (g) { blob(g, [hx - 8, hy - 1, hx - 4, hy - 8, hx + 3, hy - 8, hx + 7, hy - 3, hx + 13, hy + 1, hx + 12, hy + 5, hx + 4, hy + 6, hx - 5, hy + 6]); }, a, { sd: 2, hl: 0.7 });
  if (!o.lion && !o.lizard) { part(g, function (g) { poly(g, [hx - 5, hy - 6, hx - 6, hy - 14, hx - 1, hy - 8]); poly(g, [hx, hy - 7.6, hx + 1, hy - 14.6, hx + 4, hy - 7]); }, a, { sd: 0.8 }); }
  dot(g, hx + 12.4, hy + 1.6, 1.1, '#2a2030');
  eye(g, hx + 3, hy - 3, 1.4, K.x || '#ffd24a', true);
  if (pa > 0) part(g, function (g) { g.moveTo(hx + 4, hy + 4); g.lineTo(hx + 13, hy + 4.4); g.lineTo(hx + 10, hy + 8.6); g.closePath(); }, '#7a3a3a', { sd: 0, hl: 0 });
  else line(g, [hx + 5, hy + 4.6, hx + 11, hy + 4.4], css(ink(a)), 0.7);
  if (o.lion) { part(g, function (g) { RR(g, hx - 6, hy - 11.6, 10, 3, 1); }, m(K.b || '#5e8a5a'), { sd: 0.6 }); }
  if (o.mother) { part(g, function (g) { blob(g, [hx - 13, hy + 6, hx - 7, hy + 2, hx - 3, hy + 9, hx - 9, hy + 13]); }, lt(a, 0.3), { sd: 1 }); [[20, 30], [27, 29], [34, 30]].forEach(function (p) { line(g, [p[0], p[1] + 2, p[0] + 2, p[1] - 2, p[0] + 4, p[1] + 2], css(lt(a, 0.35)), 1); }); }
}
// ───────── 뱀 (쌍두 구렁이 · 독니 바실) ─────────
function serpent(g, K, o, pose) {
  var a = m(K.a), d = m(K.A), b = m(K.b), pa = poseA(pose);
  part(g, function (g) { blob(g, [8, 54, 16, 46, 32, 45, 50, 47, 57, 54, 50, 61, 32, 62, 14, 61]); }, d, { sd: 2.6 });
  part(g, function (g) { blob(g, [12, 50, 22, 42, 36, 41, 48, 44, 50, 50, 40, 54, 26, 54, 16, 54]); }, a, { sd: 2.6 });
  for (var i = 0; i < 6; i++) curve(g, 16 + i * 6, 47, 18 + i * 6, 44.6, 20 + i * 6, 47, css(sh1(a)), 0.6);
  var heads = o.heads || 1;
  for (var h = 0; h < heads; h++) (function (h) {
    var bx = heads > 1 ? (h ? 40 : 24) : 34, top = heads > 1 ? (h ? 16 : 20) : 14, lean = heads > 1 ? (h ? 6 : -4) : 4, hx = bx + lean + (pa > 0 ? 3 : 0), hy = top - (pa > 0 ? 2 : 0);
    part(g, function (g) { g.moveTo(bx - 5, 46); g.quadraticCurveTo(bx - 7, top + 18, hx - 3, hy + 6); g.lineTo(hx + 4, hy + 7); g.quadraticCurveTo(bx + 2, top + 18, bx + 5, 46); g.closePath(); }, h ? a : sh1(a), { sd: 2 });
    part(g, function (g) { g.moveTo(bx - 1, 45); g.quadraticCurveTo(bx - 3, top + 18, hx, hy + 8); g.lineTo(hx + 2.6, hy + 8.6); g.quadraticCurveTo(bx + 1, top + 18, bx + 2.6, 45); g.closePath(); }, b, { sd: 0.8, hl: 0 });
    if (o.hood) { part(g, function (g) { blob(g, [hx - 10, hy + 4, hx - 8, hy - 6, hx, hy - 4, hx + 8, hy - 6, hx + 10, hy + 4, hx + 4, hy + 12, hx - 4, hy + 12]); }, a, { sd: 2.4 }); part(g, el(hx, hy + 5, 4.6, 4), b, { sd: 0.8, hl: 0 }); dot(g, hx - 2, hy + 4, 1, '#2a2030'); dot(g, hx + 2, hy + 4, 1, '#2a2030'); }
    part(g, function (g) { blob(g, [hx - 6, hy + 2, hx - 4, hy - 4, hx + 4, hy - 5, hx + 10, hy - 1, hx + 12, hy + 3, hx + 6, hy + 5, hx - 3, hy + 6]); }, a, { sd: 1.8, hl: 0.7 });
    eye(g, hx + 3, hy - 1.6, 1.3, K.x || '#ff4d6d', true);
    if (pa > 0 || o.tongue) line(g, [hx + 11.6, hy + 2.6, hx + 15, hy + 3.4, hx + 16.6, hy + 2, hx + 15, hy + 3.4, hx + 16.4, hy + 5], css(m('#c0303a')), 0.7);
    part(g, function (g) { poly(g, [hx + 6, hy + 3, hx + 7, hy + 6.4, hx + 8, hy + 3]); }, m('#f0e6cc'), { sd: 0, hl: 0, ln: 0.5 });
  })(h);
}
// ───────── 용 (와이번 · 서리용 · 용암용 · 뼈용) ─────────
function wyrm(g, K, o, pose, step) {
  var a = m(K.a), d = m(K.A), b = m(K.b || '#d9c88a'), pa = poseA(pose), bone = !!o.bone;
  B3.membrane(g, bone ? m('#5a5072') : d, 30, 36, 1.25, true);
  part(g, function (g) { g.moveTo(18, 46); g.quadraticCurveTo(6, 46, 4.4, 54); g.quadraticCurveTo(4, 60, 10, 60.6); g.quadraticCurveTo(8, 56, 10.6, 53.6); g.quadraticCurveTo(14, 52, 20, 52); g.closePath(); }, sh1(a), { sd: 1.6 });
  part(g, function (g) { poly(g, [10, 60.6, 4, 62, 7, 57]); }, d, { sd: 0, hl: 0 });
  [[24, step === 1 ? 2 : 0], [38, step === 2 ? 2 : 0]].forEach(function (L) { part(g, cap(L[0], 48, L[0] - 1, 58 - L[1], 3), sh1(a), { sd: 1 }); });
  if (bone) {
    part(g, function (g) { blob(g, [16, 46, 22, 38, 34, 36, 44, 39, 48, 46, 42, 52, 26, 53]); }, sh2(a), { sd: 1, hl: 0 });
    for (var r = 0; r < 5; r++) curve(g, 20 + r * 5, 39, 22 + r * 5, 47, 21 + r * 5, 52, css(a), 1.6);
    line(g, [16, 40, 46, 40], css(a), 2);
    dot(g, 31, 46, 2.6, css(m(K.x || '#b6ff5a'), 0.4)); dot(g, 31, 46, 1.2, css(m(K.x || '#b6ff5a')));
  } else {
    part(g, function (g) { blob(g, [15, 46, 20, 37, 32, 34.6, 44, 37, 49, 44, 45, 52, 30, 54, 19, 52]); }, a, { sd: 3.6, gl: function (g) { E(g, 26, 38, 4, 1.2, -0.1); } });
    part(g, function (g) { blob(g, [26, 51, 36, 47, 45, 46, 44, 51, 34, 53.6]); }, b, { sd: 1, hl: 0 });
    for (var i = 0; i < 3; i++) line(g, [31 + i * 4, 48.6, 31.4 + i * 4, 52.6], css(sh1(b)), 0.5);
  }
  if (o.ice) [[18, 36], [24, 33], [30, 32]].forEach(function (p, i) { part(g, function (g) { poly(g, [p[0] - 2, p[1] + 2, p[0], p[1] - 5 - i, p[0] + 2, p[1] + 2]); }, m('#d8f2ff'), { sd: 0.8 }); });
  if (o.lava) [[22, 42, 26, 46], [34, 40, 38, 45], [28, 48, 32, 50]].forEach(function (l) { line(g, l, css(m('#ffb347')), 1.2); line(g, l, css(m('#fff0a0')), 0.4); });
  [[28, step === 2 ? 2 : 0], [42, step === 1 ? 2 : 0]].forEach(function (L) { part(g, cap(L[0], 48, L[0] + 0.6, 58 - L[1], 3.2), a, { sd: 1.2 }); part(g, el(L[0] + 2, 59.4 - L[1], 3.6, 1.8), d, { sd: 0.5 }); });
  var hx = 50 + pa * 3, hy = 20 - pa * 2;
  part(g, function (g) { g.moveTo(39, 40); g.quadraticCurveTo(42, 28, hx - 4, hy + 4); g.lineTo(hx + 2, hy + 8); g.quadraticCurveTo(48, 32, 47, 44); g.closePath(); }, bone ? sh2(a) : a, { sd: 2.2 });
  if (bone) for (var v = 0; v < 4; v++) dot(g, 41 + v * 2.2, 37 - v * 4.6, 1.5, css(a));
  part(g, function (g) { blob(g, [hx - 6, hy + 1, hx - 3, hy - 5, hx + 4, hy - 5, hx + 12, hy, hx + 13, hy + 4, hx + 6, hy + 7, hx - 3, hy + 7]); }, a, { sd: 2, hl: 0.7 });
  if (pa > 0) { part(g, function (g) { g.moveTo(hx + 2, hy + 4.4); g.lineTo(hx + 13, hy + 4); g.lineTo(hx + 10, hy + 10); g.lineTo(hx, hy + 8); g.closePath(); }, sh1(a), { sd: 0.8 }); dot(g, hx + 15, hy + 5, 2, css(m(o.breath || '#ff9a3c'), 0.6)); }
  else line(g, [hx + 3, hy + 4.4, hx + 12.6, hy + 3.6], css(ink(a)), 0.7);
  var hornC = m(o.horn || '#e2d6bc');
  part(g, function (g) { g.moveTo(hx - 2, hy - 3); g.quadraticCurveTo(hx - 8, hy - 9, hx - 14, hy - 9); g.quadraticCurveTo(hx - 8, hy - 5, hx - 4, hy + 0.6); g.closePath(); }, hornC, { sd: 0.8 });
  part(g, function (g) { g.moveTo(hx + 1, hy - 4); g.quadraticCurveTo(hx - 2, hy - 12, hx - 7, hy - 15); g.quadraticCurveTo(hx - 3, hy - 9, hx - 2, hy - 2); g.closePath(); }, hornC, { sd: 0.8 });
  if (bone) { dot(g, hx + 3, hy - 1, 2.2, '#1e1824'); dot(g, hx + 3, hy - 1, 1, css(m(K.x || '#b6ff5a'))); }
  else eye(g, hx + 3, hy - 1.4, 1.3, o.eye || K.x || '#ffd24a', true);
  B3.membrane(g, bone ? m('#6a6080') : (o.wing ? m(o.wing) : sh1(a)), 33, 38, 1.25, false);
}
// ───────── 정령 (누리: 물 · 수렁의 그림자 · 유령) ─────────
function waterSpirit(g, K, pose) {
  var a = m('#5fb0cf'), d = m('#2f78a0'), l = m('#d6f2f8'), pa = poseA(pose);
  part(g, function (g) { g.moveTo(14, 60); g.quadraticCurveTo(20, 50, 24, 46); g.quadraticCurveTo(22, 38, 26, 32); g.lineTo(38, 32); g.quadraticCurveTo(42, 40, 40, 46); g.quadraticCurveTo(46, 52, 52, 60); g.quadraticCurveTo(33, 63, 14, 60); g.closePath(); }, a, { sd: 3.4, gl: function (g) { E(g, 28, 40, 1.4, 4, 0.2); } });
  curve(g, 18, 58, 26, 54, 32, 58, css(l), 0.9); curve(g, 34, 58, 40, 53, 48, 58, css(l), 0.9); curve(g, 26, 50, 31, 46, 36, 50, css(lt(a, 0.4)), 0.7);
  part(g, function (g) { g.moveTo(22, 20); g.quadraticCurveTo(10, 26, 12, 44); g.quadraticCurveTo(14, 50, 18, 52); g.quadraticCurveTo(16, 40, 24, 30); g.closePath(); }, d, { sd: 1.6 });
  part(g, function (g) { blob(g, [21, 22, 23, 12, 32, 9, 41, 12, 43, 22, 40, 30, 32, 33, 24, 30]); }, lt(a, 0.25), { sd: 2.4 });
  part(g, function (g) { g.moveTo(20, 22); g.quadraticCurveTo(20, 7, 33, 7); g.quadraticCurveTo(45, 8, 44, 21); g.lineTo(40, 16); g.lineTo(36, 18); g.lineTo(31, 14); g.lineTo(26, 18); g.quadraticCurveTo(23, 24, 24, 31); g.lineTo(20, 30); g.closePath(); }, d, { sd: 2, gl: function (g) { E(g, 27, 10, 3, 1, -0.3); } });
  eye(g, 33.6, 22, 1.5, null, false); eye(g, 39.6, 21.8, 1.3, null, false);
  curve(g, 35, 27, 36.6, 28, 38.2, 27, css(ink(a)), 0.7);
  part(g, cap(38, 34, 47 + pa * 4, 30 - pa * 2, 2), lt(a, 0.15), { sd: 0.8 });
  part(g, circ(48 + pa * 4, 27 - pa * 2, 4), l, { sd: 1, gl: function (g) { E(g, 47 + pa * 4, 25.6 - pa * 2, 1, 0.8); } });
  for (var i = 0; i < 4; i++) dot(g, 12 + i * 12, 30 + (i & 1) * 10, 1.1, css(l, 0.8));
}
function specter(g, K, pose, o) {
  var a = m(K.a), d = m(K.A), x = m(K.x || '#ffffff'), pa = poseA(pose);
  part(g, function (g) { g.moveTo(16, 24); g.quadraticCurveTo(14, 10, 30, 7); g.quadraticCurveTo(46, 7, 46, 24); g.quadraticCurveTo(49, 40, 54, 54); g.lineTo(48, 51); g.lineTo(46, 58); g.lineTo(40, 53); g.lineTo(35, 60); g.lineTo(30, 53); g.lineTo(24, 59); g.lineTo(21, 52); g.lineTo(14, 56); g.quadraticCurveTo(15, 40, 16, 24); g.closePath(); }, a, { sd: 4, gl: function (g) { E(g, 22, 14, 3, 1.4, -0.5); } });
  curve(g, 22, 30, 21, 42, 22, 52, css(sh1(a)), 0.8); curve(g, 38, 30, 40, 42, 41, 52, css(sh1(a)), 0.8);
  part(g, function (g) { blob(g, [22, 22, 26, 15, 36, 14, 43, 19, 43, 28, 36, 32, 26, 31]); }, m(K.z || '#0d2329'), { sd: 0, hl: 0 });
  eye(g, 30, 22.6, 1.6, x, true); eye(g, 38, 22.4, 1.4, x, true);
  part(g, cap(40, 34, 50 + pa * 3, 38 - pa * 4, 2.2), a, { sd: 0.8 });
  for (var i = 0; i < 3; i++) line(g, [50 + pa * 3, 38 - pa * 4 + i * 0.4, 52 + pa * 3 + i, 42 - pa * 4 + i * 1.4], css(d), 0.7);
  if (o && o.mud) { for (i = 0; i < 4; i++) dot(g, 18 + i * 9, 55 + (i & 1) * 2, 2.4, css(m('#4a5a3a'), 0.8)); }
}
// ───────── 벌레 (여왕 전갈 · 파리 떼의 왕 · 전갈) ─────────
function scorp(g, K, pose, o) {
  var a = m(K.a), d = m(K.A), pa = poseA(pose);
  for (var l = 0; l < 3; l++) { line(g, [24 + l * 6, 50, 20 + l * 6, 56, 18 + l * 6, 60], css(d), 1.6); line(g, [30 + l * 6, 50, 34 + l * 6, 56, 36 + l * 6, 60], css(sh1(a)), 1.6); }
  part(g, function (g) { g.moveTo(18, 48); g.quadraticCurveTo(8, 46, 8, 34); g.quadraticCurveTo(8, 18, 22, 14); g.quadraticCurveTo(30, 13, 32, 19 + pa * 2); g.lineTo(28, 22); g.quadraticCurveTo(22, 18, 17, 24); g.quadraticCurveTo(13, 30, 15, 38); g.quadraticCurveTo(17, 43, 23, 44); g.closePath(); }, a, { sd: 2.2 });
  for (var s = 0; s < 4; s++) curve(g, 9 + s, 40 - s * 6, 12, 38 - s * 6, 14 - s * 0.4, 41 - s * 6, css(sh1(a)), 0.6);
  part(g, function (g) { g.moveTo(32, 19 + pa * 2); g.quadraticCurveTo(38, 17 + pa * 2, 36, 26 + pa * 2); g.lineTo(31, 22 + pa * 2); g.closePath(); }, m(o && o.queen ? '#e0a040' : '#2a2030'), { sd: 0.6 });
  part(g, function (g) { blob(g, [16, 50, 20, 42, 32, 40, 44, 42, 50, 48, 44, 54, 30, 55, 20, 54]); }, a, { sd: 3, gl: function (g) { E(g, 24, 44, 3, 1, -0.1); } });
  for (s = 0; s < 3; s++) curve(g, 24 + s * 7, 42, 26 + s * 7, 47, 24 + s * 7, 53, css(sh1(a)), 0.6);
  part(g, function (g) { blob(g, [44, 44, 48, 40, 54, 41, 56, 46, 52, 50, 46, 50]); }, a, { sd: 1.6 });
  eye(g, 51, 43, 1, K.x || '#ff4d6d', true); eye(g, 54, 43.6, 0.8, K.x || '#ff4d6d', true);
  [[50, 38], [54, 50]].forEach(function (c, i) { var cx = c[0] + 4 + pa * 3, cy = c[1] - (i ? 0 : 2); part(g, cap(c[0] - 2, c[1] + 2, cx, cy, 1.6), d, { sd: 0.6 }); part(g, function (g) { g.moveTo(cx - 2, cy); g.quadraticCurveTo(cx + 2, cy - 6, cx + 7, cy - 3); g.lineTo(cx + 3, cy - 1); g.lineTo(cx + 7, cy + 2); g.quadraticCurveTo(cx + 2, cy + 4, cx - 2, cy); g.closePath(); }, a, { sd: 1 }); });
  if (o && o.queen) part(g, function (g) { poly(g, [46, 40, 46, 34, 48.6, 37, 50.6, 33, 52.6, 37, 55, 34, 55, 40.4]); }, m('#d8b450'), { sd: 0.8 });
}
function flyKing(g, K, pose) {
  var a = m(K.a), d = m(K.A), w = 'rgba(214,236,224,.55)', pa = poseA(pose);
  [[-0.3], [-0.1]].forEach(function (p) { g.save(); g.translate(30, 30); g.rotate(p[0] - 0.5); g.beginPath(); E(g, -8, -10, 7, 16); g.fillStyle = w; g.fill(); g.lineWidth = 0.8; g.strokeStyle = css(m('#5a6a5a')); g.stroke(); line(g, [-4, 2, -8, -10, -10, -22], css(m('#5a6a5a'), 0.7), 0.5); g.restore(); });
  for (var l = 0; l < 3; l++) line(g, [26 + l * 5, 48, 22 + l * 6, 56, 20 + l * 7, 61], css(d), 1.4);
  part(g, function (g) { blob(g, [14, 46, 18, 38, 30, 36, 40, 40, 40, 50, 30, 56, 18, 54]); }, d, { sd: 2.6 });
  for (var s = 0; s < 3; s++) curve(g, 18 + s * 7, 39, 20 + s * 7, 46, 18 + s * 7, 53, css(m(K.b || '#b6ff5a'), 0.6), 0.7);
  part(g, function (g) { blob(g, [30, 34, 34, 28, 44, 28, 48, 34, 46, 42, 36, 44]); }, a, { sd: 2 });
  part(g, function (g) { blob(g, [38, 24, 42, 16, 52, 16, 57, 24, 54, 32, 44, 33]); }, a, { sd: 2.2 });
  part(g, el(46, 22, 4.6, 5), m('#8a2a3a'), { sd: 1.4, gl: function (g) { E(g, 44.6, 20, 1.2, 1); } });
  part(g, el(53, 22.6, 3.4, 4.2), m('#8a2a3a'), { sd: 1.2 });
  part(g, function (g) { poly(g, [40, 17, 40, 10, 43, 13.6, 46, 8.6, 49, 13.6, 52, 10, 52, 17]); }, m('#c8a040'), { sd: 0.8 });
  line(g, [55, 30, 58 + pa * 2, 36], css(d), 1.2);
  for (var i = 0; i < 7; i++) { var fx = 6 + (i * 37) % 52, fy = 6 + (i * 23) % 40; dot(g, fx, fy, 1.1, css(m('#2a2a20'))); dot(g, fx - 1, fy - 1, 0.8, 'rgba(220,236,224,.6)'); }
}
// ───────── 공성 쇠뇌 (발리스타) ─────────
function ballista(g, K, pose) {
  var wd = m('#8a6440'), dk = m('#5a3e28'), mt = m('#9aa2b2'), pa = poseA(pose);
  [[18, 54], [44, 54]].forEach(function (p) { part(g, circ(p[0], p[1], 7), dk, { sd: 2 }); part(g, circ(p[0], p[1], 2.2), mt, { sd: 0.6 }); for (var i = 0; i < 6; i++) { var q = i / 6 * 6.28; line(g, [p[0] + Math.cos(q) * 2.4, p[1] + Math.sin(q) * 2.4, p[0] + Math.cos(q) * 6, p[1] + Math.sin(q) * 6], css(sh1(dk)), 0.8); } });
  part(g, function (g) { RR(g, 10, 44, 42, 6, 2); }, wd, { sd: 1.6 });
  part(g, function (g) { poly(g, [26, 44, 30, 32, 36, 32, 40, 44]); }, dk, { sd: 1.4 });
  g.save(); g.translate(32, 30); g.rotate(-0.12 - pa * 0.05);
  part(g, function (g) { RR(g, -18, -3, 34, 6, 2); }, wd, { sd: 1.6 });
  part(g, function (g) { g.moveTo(10, -1); g.quadraticCurveTo(6, -18, -2, -22); g.lineTo(0, -24); g.quadraticCurveTo(10, -18, 13, -1); g.closePath(); g.moveTo(10, 1); g.quadraticCurveTo(6, 18, -2, 22); g.lineTo(0, 24); g.quadraticCurveTo(10, 18, 13, 1); g.closePath(); }, dk, { sd: 1 });
  line(g, [-1, -22.6, pa > 0 ? 6 : -10, 0, -1, 22.6], 'rgba(235,228,210,.9)', 0.7);
  if (pa <= 0) { part(g, function (g) { RR(g, -10, -1.2, 30, 2.4, 1); }, m('#6a5038'), { sd: 0.4 }); part(g, function (g) { poly(g, [20, -2.6, 26, 0, 20, 2.6]); }, mt, { sd: 0.6 }); }
  dot(g, -14, 0, 1.6, css(m(K.b || '#d8b450')));
  g.restore();
}
// ───────── 어스름의 왕 — 지워진 이름들이 모인 형상 ─────────
function duskKing(g, K, pose) {
  var a = m('#1e2a30'), d = m('#0e161a'), j = m(K.b || '#7dffb0'), pa = poseA(pose);
  dot(g, 32, 36, 29, 'rgba(110,220,170,.10)'); dot(g, 32, 36, 25, 'rgba(110,220,170,.10)');      // 흐린 비취빛 — 어두운 땅에서도 몸이 읽히게
  part(g, function (g) { g.moveTo(6, 61); g.quadraticCurveTo(8, 40, 14, 28); g.quadraticCurveTo(16, 10, 32, 7); g.quadraticCurveTo(48, 10, 50, 28); g.quadraticCurveTo(56, 40, 58, 61); g.lineTo(52, 56); g.lineTo(47, 61.6); g.lineTo(42, 55); g.lineTo(37, 61.6); g.lineTo(32, 55.6); g.lineTo(27, 61.6); g.lineTo(22, 55); g.lineTo(17, 61.6); g.lineTo(12, 56); g.closePath(); }, a, { sd: 5, hl: 0.6 });
  var F = [[18, 44, 3.4], [28, 50, 3], [41, 48, 3.6], [48, 38, 2.8], [16, 32, 2.6], [36, 38, 2.4], [24, 38, 2.2], [44, 56, 2.4], [20, 55, 2.2]];
  F.forEach(function (f, i) { g.beginPath(); E(g, f[0], f[1], f[2], f[2] * 1.25); g.fillStyle = css(mix(j, [200, 214, 210], 0.6), 0.16 + (i % 3) * 0.05); g.fill(); dot(g, f[0] - f[2] * 0.35, f[1] - 0.3, 0.45, css(j, 0.5)); dot(g, f[0] + f[2] * 0.35, f[1] - 0.3, 0.45, css(j, 0.5)); curve(g, f[0] - 0.8, f[1] + f[2] * 0.6, f[0], f[1] + f[2] * 0.4 + (i & 1 ? 0.5 : -0.3), f[0] + 0.8, f[1] + f[2] * 0.6, css(j, 0.35), 0.4); });
  for (var s = 0; s < 5; s++) curve(g, 12 + s * 10, 60, 10 + s * 11, 50, 16 + s * 8, 42 - s, css(d), 0.9);
  part(g, function (g) { blob(g, [20, 20, 24, 11, 32, 9, 40, 11, 44, 20, 40, 28, 32, 30, 24, 28]); }, d, { sd: 1, hl: 0 });
  eye(g, 28, 19.6, 1.8, K.x || '#ff4d6d', true); eye(g, 36.4, 19.4, 1.8, K.x || '#ff4d6d', true);
  for (var p = 0; p < 5; p++) (function (p) { var px = 19 + p * 6.4, py = 8 - (p === 2 ? 4 : p % 2 ? 2 : 0); g.save(); g.translate(px, py); g.rotate((p - 2) * 0.18);
    part(g, function (g) { RR(g, -2.4, -4, 4.8, 8, 0.6); }, m('#b8b09a'), { sd: 1, hl: 0.4, ln: 0.7 });
    line(g, [-1.4, -2, 1.4, -2], css(m('#5a5040')), 0.5); line(g, [-1.4, 0, 1.2, 0], css(m('#5a5040')), 0.5); line(g, [-1.8, 2.4, 1.8, -2.6], css(m('#3a2a2a')), 0.6);      // 이름 줄 위를 긁은 획
    g.restore(); })(p);
  var hx = 50 + pa * 4, hy = 36 - pa * 3;
  part(g, cap(42, 30, hx, hy, 3), a, { sd: 1.4 });
  part(g, function (g) { blob(g, [hx - 4, hy - 2, hx, hy - 5, hx + 5, hy - 3, hx + 5, hy + 3, hx - 2, hy + 4]); }, d, { sd: 1 });
  dot(g, hx + 2, hy - 6, 2.6, css(j, 0.35)); dot(g, hx + 2, hy - 6, 1.1, css(lt(j, 0.4)));
}
function impP(g, K, pose, kind) {
  var a = m(K.a), d = m(K.A), pa = poseA(pose);
  B3.membrane(g, kind === 2 ? m('#6a7082') : d, 28, 36, 0.8, true);
  [[27], [36]].forEach(function (L) { part(g, cap(L[0], 48, L[0], 59, 2.4), sh1(a), { sd: 0.8 }); part(g, el(L[0] + 1, 60, 3, 1.6), d, { sd: 0.4 }); });
  part(g, function (g) { g.moveTo(24, 50); g.quadraticCurveTo(12, 54, 10, 46); g.quadraticCurveTo(14, 50, 22, 46); g.closePath(); }, a, { sd: 0.8 });
  part(g, function (g) { blob(g, [22, 42, 25, 35, 38, 35, 41, 42, 38, 51, 25, 51]); }, a, { sd: 2.6 });
  part(g, function (g) { blob(g, [18, 24, 20, 13, 31, 10, 42, 13, 45, 23, 41, 32, 31, 35, 22, 32]); }, a, { sd: 2.6, hl: 0.6 });
  [[21, -1], [41, 1]].forEach(function (h) { part(g, function (g) { var x = h[0], s = h[1]; g.moveTo(x - s * 2, 15); g.quadraticCurveTo(x + s * 2, 8, x + s * (kind === 1 ? 5 : 2), 2); g.quadraticCurveTo(x + s * 4, 10, x + s * 3, 16); g.closePath(); }, m(kind === 2 ? '#6a7082' : '#e2d6bc'), { sd: 0.8 }); });
  eye(g, 32, 22, 1.7, K.x, true); eye(g, 39.6, 21.8, 1.5, K.x, true);
  part(g, function (g) { g.moveTo(32, 28); g.quadraticCurveTo(36, 30.6, 41, 27.6); g.quadraticCurveTo(37, 32, 32, 28); g.closePath(); }, '#3a2228', { sd: 0, hl: 0, ln: 0.6 });
  part(g, function (g) { poly(g, [34, 28.4, 35, 30.4, 36, 28.6]); }, m('#f0e6cc'), { sd: 0, hl: 0, ln: 0.4 });
  if (kind === 1) held(g, 46 + pa * 3, 44 - pa * 3, pa > 0 ? 1.2 : 0, 0.9, { cat: 'lance', kind: 'trident', t: 6, m: ['#d8c8a0', '#a08a50', '#6a5430'], acc: '#8a2a3a', gem: '#ffd24a', grade: 0 });
  part(g, cap(39, 39, 46 + pa * 3, 44 - pa * 3, 2), a, { sd: 0.8 });
  B3.membrane(g, kind === 2 ? m('#7a8092') : sh1(a), 31, 38, 0.8, false);
}
function slimeP(g, pose, step) {
  var c = m('#6ab85a'), sq = step ? 1.06 : pose === 'atk' ? 0.9 : pose === 'hit' ? 1.12 : 1;
  g.save(); g.translate(32, 61.5); g.scale(sq, 2 - sq); g.translate(-32, -61.5);
  part(g, function (g) { g.moveTo(12, 61); g.quadraticCurveTo(10, 44, 22, 36); g.quadraticCurveTo(30, 28, 34, 30); g.quadraticCurveTo(38, 26, 42, 32); g.quadraticCurveTo(54, 40, 52, 61); g.quadraticCurveTo(32, 63.6, 12, 61); g.closePath(); }, c, { sd: 5, hl: 1, gl: function (g) { E(g, 22, 42, 3.4, 2, -0.6); } });
  dot(g, 46, 50, 1.6, css(lt(c, 0.4), 0.7));
  eye(g, 30, 47, 2.2, null, false); eye(g, 40, 46.6, 2, null, false);
  curve(g, 33, 53, 35.4, 55, 37.6, 53, css(ink(c)), 0.8);
  g.restore();
}

// ───────── 표 ─────────
function hum(head, body, items, pal, ex) { return { kind: 'human', S: { head: head, body: body, items: items, pal: pal, cls: 'boss', tier: 9, age: ex && ex.age || '', sx: ex && ex.sx || 'm', w: ex && ex.w || null, a: ex && ex.a || null, faded: false }, ex: ex }; }
function A(cat, ln, leg, t) { var L = LEG[leg]; return { cat: cat, line: ln || 'A', t: t || 8, grade: L ? 5 : 3, sh: L ? L.sh : null, m: L ? L.m : MAT[t || 8], acc: L ? L.acc : ACC[t || 8], gem: L ? L.gem : '#62b0ee' }; }
var BOSS = {
  grok: { draw: function (g, p, s) { brute(g, { a: '#6a9a5a', A: '#3e6a3a', b: '#7a5a3a', x: '#ff4d6d' }, { head: 'orc', lump: 1, tusk: 1, weapon: W('grok', 'sword') }, p, s); } },
  shewolf: { draw: function (g, p, s) { quad(g, { a: '#9a9aa4', A: '#62626e', b: '#d0ccc4', x: '#ffd24a' }, { mother: 1 }, p, s); } },
  bargan: { draw: function (g, p, s) { brute(g, { a: '#8a5040', A: '#4a2a28', b: '#5a3a30', x: '#fff0a0' }, { head: 'lava', lava: 1, glow: 1, weapon: { cat: 'wand', kind: 'mace', t: 7, m: LEG.bargan.m, acc: LEG.bargan.acc, gem: '#ffd24a' }, cuff: '#3a3036' }, p, s); } },
  heron: { kind: 'cav', S: { head: 'tricorn', body: 'tunic', items: ['cape', 'spear'], pal: { a: '#7a5a3a', A: '#523a26', h: '#4a3a2a', q: '#8a3a3a', b: '#c8a040' }, cls: 'mar', tier: 8, sx: 'm', age: 'prime', w: W('heron', 'lance', 'spear') }, H: { c: '#7a5034', mane: '#2a1e18', cloth: '#6a2a2a', trim: '#c8a040' } },
  tormak: { draw: function (g, p, s) { brute(g, { a: '#8a5a40', A: '#5a3a28', b: '#4a3a30', x: '#ff4d6d' }, { head: 'bull', weapon: { cat: 'axe', kind: 'axe', t: 6, m: LEG.tormak.m, acc: '#6f4a2c', gem: '#ff4d6d' } }, p, s); } },
  pippin: hum('wizhat', 'robe', ['cape'], { a: '#4f9a6a', A: '#2f6a4a', b: '#c84a4a', q: '#c84a4a', c: '#e0c050', h: '#c87a3a' }, { w: W('pippin', 'staff', 'staff'), sx: 'm', age: 'youth' }),
  twinsnake: { draw: function (g, p) { serpent(g, { a: '#6a9a50', A: '#3e6a34', b: '#d0c870', x: '#ff4d6d' }, { heads: 2 }, p); } },
  volko: hum('tricorn', 'tunic', ['cape'], { a: '#3a4a6a', A: '#262e48', h: '#2a2230', b: '#c8a040', q: '#6a2a2a', B: '#4a3428' }, { w: W('volko', 'lance', 'spear'), age: 'prime' }),
  warden: { draw: function (g, p, s) { B3.golem(g, { m: '#9a96a4', M: '#6a6676', x: '#7fe3ff' }, s, p, null); line(g, [18, 34, 22, 30, 26, 34], css(m('#6a8a5a')), 1.6); dot(g, 20, 44, 2, css(m('#6a8a5a'), 0.9)); dot(g, 40, 30, 1.6, css(m('#6a8a5a'), 0.9)); } },
  nuri: { draw: function (g, p) { waterSpirit(g, {}, p); } },
  shara: { draw: function (g, p) { scorp(g, { a: '#c8783a', A: '#8a4a24', x: '#ff4d6d' }, p, { queen: 1 }); } },
  tombbeast: { draw: function (g, p, s) { quad(g, { a: '#c8b48a', A: '#8a7650', b: '#5e8a5a', x: '#7fe3ff' }, { lion: 1 }, p, s); } },
  king: hum('crown', 'robe', ['cape'], { s: '#b8c0c8', S: '#8a929e', a: '#4a3a6a', A: '#2e2448', b: '#c8a040', q: '#2a2438', h: '#d8d8dc', i: '#c8a040' }, { w: W('king', 'wand', 'cross'), age: 'elder' }),
  mire: { draw: function (g, p) { specter(g, { a: '#4a6a5a', A: '#2a4a3e', x: '#c8f0a0', z: '#0e1e18' }, p, { mud: 1 }); } },
  orbel: hum('hood', 'robe', ['cape'], { a: '#6a4a8a', A: '#462e60', b: '#c8a040', q: '#2a2448' }, { w: W('orbel', 'staff', 'staff'), age: 'elder' }),
  hagen: hum('hood', 'tunic', ['cape'], { a: '#5a6a3a', A: '#3a4624', q: '#4a3a2a', B: '#4a3428' }, { w: W('hagen', 'bow', 'xbow'), a: A('light', 'A', 'shewolf'), age: 'prime' }),
  gatekeeper: { draw: function (g, p, s) { brute(g, { a: '#4a4560', A: '#2c2740', b: '#6a2a3a', x: '#ff4d6d' }, { head: 'obs', obs: 1, glow: 1, weapon: { cat: 'staff', kind: 'staff', t: 6, m: LEG.gate.m, acc: LEG.gate.acc, gem: '#c9a227', sh: 'armil' } }, p, s); } },
  basil: { draw: function (g, p) { serpent(g, { a: '#5a8a3a', A: '#345a24', b: '#d8c060', x: '#ffd24a' }, { hood: 1, tongue: 1 }, p); } },
  belmar: hum('darkhood', 'robe', ['cape', 'mwing'], { a: '#7a2a3a', A: '#4a1626', z: '#14101e', x: '#ffd24a', q: '#1e1828', w: '#3a2a3a', b: '#c8a040' }, { w: W('belmar', 'staff', 'rune') }),
  ilva: hum('tiara', 'robe', ['cape'], { a: '#9ac8dc', A: '#5a8aa8', s: '#e4e8ee', h: '#e8f4fa', q: '#5a7aa0', i: '#c8e0ec', b: '#c8e8f4' }, { w: W('ilva', 'staff', 'orb'), sx: 'f', a: A('robe', 'B', 'ilva') }),
  kardan: hum('horned', 'armor', ['cape'], { a: '#8a2a2a', A: '#5a1a1a', b: '#e0a040', q: '#3a2a2a', m: '#4a3a3a' }, { w: W('kardan', 'sword', 'gsword'), a: A('heavy', 'A', 'kardan'), age: 'prime' }),
  swarm: { draw: function (g, p) { flyKing(g, { a: '#5d7a3a', A: '#3a4f24', b: '#b6ff5a' }, p); } },
  roen: hum('crown', 'armor', ['cape'], { a: '#5a3a8a', A: '#3a2460', b: '#c8a040', q: '#3a2a58', h: '#4a3a30' }, { w: W('dawn', 'lance', 'spear'), a: A('heavy', 'A', 'roen'), age: 'prime' }),
  morga: hum('mask', 'robe', ['cape'], { a: '#57524a', A: '#36322c', O: '#c8c0a8', q: '#3a362e', b: '#8aa83c' }, { w: W('morga', 'wand', 'cross') }),
  bonewyrm: { draw: function (g, p, s) { wyrm(g, { a: '#d8d0bc', A: '#a39a84', x: '#b6ff5a' }, { bone: 1, breath: '#b6ff5a' }, p, s); } },
  apostle: hum('hood', 'robe', ['cape'], { a: '#d8d0bc', A: '#a39a84', b: '#3a2a2a', q: '#5a2a2a' }, { w: W('apostle', 'staff', 'orb'), age: 'elder' }),
  glacia: { draw: function (g, p, s) { wyrm(g, { a: '#7ab0d0', A: '#4a7aa0', b: '#e0f0f8', x: '#c9f1ff' }, { ice: 1, breath: '#c9f1ff', horn: '#e0f4ff', wing: '#5a8ab0' }, p, s); } },
  ignar: { draw: function (g, p, s) { wyrm(g, { a: '#a8402e', A: '#6a2420', b: '#e0a060', x: '#ffd24a' }, { lava: 1, breath: '#ff9a3c', wing: '#6a2a24' }, p, s); } },
  herald: hum('darkhood', 'robe', ['cape'], { a: '#1f5a4c', A: '#0f3a30', z: '#0b1a17', x: '#7dffb0', q: '#14302a', b: '#5a8a6a' }, { w: { cat: 'lance', kind: 'spear', t: 3, m: ['#b8b0a0', '#7a7466', '#4a463e'], acc: '#6a6050', gem: '#7dffb0', grade: 0, sh: 'banner' }, ghost: 1 }),
  duskking: { draw: function (g, p) { duskKing(g, { b: '#7dffb0', x: '#ff4d6d' }, p); } },
  keeper: { draw: function (g, p, s) { B3.golem(g, { m: '#8a8070', M: '#5e5444', x: '#7fe3ff' }, s, p, null); part(g, function (g) { g.moveTo(28, 15); g.quadraticCurveTo(37, 4, 47, 13); g.lineTo(28, 15); g.closePath(); }, m('#c8a040'), { sd: 1 }); dot(g, 38, 9.6, 1.6, css(m('#fff0a0'))); held(g, 52, 44, 0.3, 1.2, W('keeper', 'lance', 'spear')); } }
};
var BIGM = {
  'b_brute|ogre': { draw: function (g, p, s) { brute(g, { a: '#b89a72', A: '#7e6648', b: '#6a4a34', x: '#ff4d6d' }, { head: 'ogre', tusk: 1, weapon: { cat: 'club', kind: 'club', t: 3, m: MAT[3], acc: ACC[3], gem: '#62b0ee' } }, p, s); } },
  'b_dragon|wyv': { draw: function (g, p, s) { wyrm(g, { a: '#4f8a6e', A: '#2f5e4a', b: '#d9d08a', x: '#ffd24a' }, { wing: '#3a6a58' }, p, s); } },
  'b_ballista|wood': { draw: function (g, p) { ballista(g, { b: '#d8b450' }, p); } },
  'b_caster|abbess': hum('veil', 'robe', ['cape'], { a: '#e8e0d0', A: '#b8ae98', b: '#c8a040', q: '#5a6a9a' }, { w: { cat: 'staff', kind: 'orb', t: 6, m: MAT[6], acc: ACC[6], gem: '#fff0a0', orb: '#fff0a0', grade: 0 }, sx: 'f', age: 'prime' })
};
function mon(fn) { return { draw16: fn }; }
var MON = {
  goblin: hum('goblin', 'tunic', ['club'], { a: '#8a5a36', A: '#5e3a22', s: '#7aa860', S: '#4a7a40', b: '#3a3350' }),
  gobArcher: hum('goblin', 'tunic', ['bow'], { a: '#6d4f7a', A: '#4a3356', s: '#7aa860', S: '#4a7a40', b: '#3a3350' }),
  orc: hum('orc', 'armor', ['axe'], { a: '#7a5a3c', A: '#523a25', s: '#5a8a50', S: '#3a6a3a', b: '#4a4258', m: '#6a6478' }),
  mummy: hum('mummy', 'robe', [], { a: '#c8bc9a', A: '#8e8466', s: '#c8bc9a', b: '#8e8466' }),
  wolf: mon(function (g, p, s) { quad(g, { a: '#8e96a8', A: '#5e667a', b: '#c8ccd6', x: '#ffd24a' }, {}, p, s); }),
  harpy: mon(function (g, p, s) { var S = { head: 'harpy', body: 'tunic', items: [], pal: { a: '#d8d0c0', A: '#a8a090', s: '#e8c8a8', h: '#b84a55', H: '#7e2c3a' }, cls: 'harpy', tier: 3, sx: 'f', pose: p, step: s }; B3.bigWing(g, m('#a84a55'), 26, 40, 0.95, p, true); DS.artHuman(g, S); B3.bigWing(g, m('#b85a64'), 30, 42, 0.9, p, false); }),
  lizard: mon(function (g, p, s) { B3.merman(g, { a: '#6a7a4a', e: '#4f9a86', E: '#2f6a5e', g: '#c8a040' }, s, p, 2, null); }),
  golem: mon(function (g, p, s) { B3.golem(g, { m: '#a9a294', M: '#7d766a', x: '#ffd24a' }, s, p, null); }),
  iceGolem: mon(function (g, p, s) { B3.golem(g, { m: '#a8cce0', M: '#6a98b8', x: '#e8f8ff' }, s, p, null); }),
  imp: mon(function (g, p) { impP(g, { a: '#b8404c', A: '#7a2834', x: '#ffd24a' }, p, 0); }),
  demon: mon(function (g, p) { impP(g, { a: '#9a3448', A: '#62203a', x: '#ffd24a' }, p, 1); }),
  gargoyle: mon(function (g, p) { impP(g, { a: '#8a90a2', A: '#5a6072', x: '#ff4d6d' }, p, 2); }),
  ghost: mon(function (g, p) { specter(g, { a: '#bcdce4', A: '#88b4c2', x: '#2a4a5a', z: '#e8f6fa' }, p); }),
  salamander: mon(function (g, p, s) { quad(g, { a: '#c8603a', A: '#8a3a24', b: '#f0b060', x: '#fff0a0' }, { lizard: 1 }, p, s); for (var i = 0; i < 3; i++) dot(g, 22 + i * 8, 38 - i, 1.4, css(m('#ffb347'), 0.9)); }),
  slime: mon(function (g, p, s) { slimeP(g, p, s); }),
  scorpion: mon(function (g, p) { scorp(g, { a: '#8a6a3a', A: '#5a4424', x: '#ff4d6d' }, p); }),
  saber: mon(function (g) { held(g, 32, 50, 0, 1.6, { cat: 'sword', kind: 'sword', t: 7, m: ['#f0c8d0', '#b84a6a', '#6a2a4a'], acc: '#c8a040', gem: '#ff4d6d', grade: 0 }); })
};
// 사람 파츠에 괴물 머리 (고블린 · 오크 · 미라 · 하피) — art2 headFront 가 먼저 묻는다
var headX = { goblin: 1, orc: 1, mummy: 1, harpy: 1 };
function faceShape(g) { g.moveTo(17.6, 24); g.quadraticCurveTo(17.6, 10.8, 31, 10.8); g.quadraticCurveTo(44.6, 10.8, 44.6, 23.4); g.quadraticCurveTo(44.8, 33, 38.6, 36.4); g.quadraticCurveTo(33, 38.6, 26.4, 36.6); g.quadraticCurveTo(17.6, 33.4, 17.6, 24); g.closePath(); }
DS.artHeadX = function (g, S) {
  if (!headX[S.head]) return false;
  var C = S.C, sk = C('s');
  if (S.head === 'harpy') {
    part(g, faceShape, sk, { sd: 2.6 });
    DS.artFace(g, S, 31, 24.5, 1);
    part(g, function (g) { g.moveTo(16, 32); g.quadraticCurveTo(13, 10, 31, 8.6); g.quadraticCurveTo(46, 9, 46, 22); g.lineTo(40, 18); g.lineTo(36, 20); g.lineTo(31, 16); g.lineTo(27, 21); g.quadraticCurveTo(24, 26, 25, 34); g.quadraticCurveTo(20, 40, 12, 40); g.quadraticCurveTo(16, 36, 16, 32); g.closePath(); }, C('h'), { sd: 2.2 });
    return true;
  }
  if (S.head !== 'mummy') part(g, function (g) { g.moveTo(21, 22); g.lineTo(S.head === 'goblin' ? 7 : 12, 15); g.lineTo(20, 30); g.closePath(); }, sk, { sd: 1 });
  part(g, faceShape, sk, { sd: 2.6, hl: 0.6 });
  if (S.head === 'mummy') { for (var i = 0; i < 6; i++) curve(g, 18, 14 + i * 4, 31, 12 + i * 4 + (i & 1) * 2, 44.6, 15 + i * 4, css(sh1(sk)), 0.7); dot(g, 34, 25, 1.6, '#2a2030'); dot(g, 34, 25, 0.7, css(mute('#ffd24a'))); return true; }
  var orc = S.head === 'orc';
  eye(g, 34, 25.6, 1.8, orc ? '#ff4d6d' : null, orc); eye(g, 41, 25.4, 1.5, orc ? '#ff4d6d' : null, orc);
  line(g, [31.6, 21.6, 36, 23], css(ink(sk)), 0.9); line(g, [39, 22.8, 43, 21.6], css(ink(sk)), 0.9);
  if (!orc) { part(g, function (g) { blob(g, [38, 28, 43, 26.6, 47, 29, 43, 31]); }, sk, { sd: 0.8 }); curve(g, 34, 32.6, 38, 34.6, 42, 32.4, css(ink(sk)), 0.7); }
  else { curve(g, 33, 33, 38, 31.6, 43, 33, css(ink(sk)), 0.8); part(g, function (g) { poly(g, [34, 33.2, 35, 29.6, 36, 33]); poly(g, [41, 33, 42, 29.6, 43, 32.6]); }, mute('#f0e6cc'), { sd: 0, hl: 0, ln: 0.5 }); part(g, function (g) { poly(g, [24, 13, 28, 6, 30, 12, 34, 5, 36, 12]); }, mute('#2b2440'), { sd: 0.5 }); }
  return true;
};

// ───────── 묘사 연결 ─────────
function bigDraw(fn) { return function (g, pose, step, mask) { if (mask) return; g.save(); g.translate(48, 95.5); g.scale(1.42, 1.42); g.translate(-32, -61.5); fn(g, pose, step); g.restore(); }; }
function smallDraw(fn) { return function (g, pose, step, mask) { if (mask) return; fn(g, pose, step); }; }
function clone(sp) { var o = {}, k; for (k in sp) o[k] = sp[k]; if (sp.S) { o.S = {}; for (k in sp.S) o.S[k] = sp.S[k]; } return o; }
function toSpec(d, lw) {
  if (!d) return null;
  if (d.draw) return { lw: lw, draw: lw > 16 ? bigDraw(d.draw) : smallDraw(d.draw), olw: lw > 16 ? 1.25 : 1.45 };
  if (d.draw16) return { lw: lw, draw: lw > 16 ? bigDraw(d.draw16) : smallDraw(d.draw16) };
  var sp = clone(d); sp.lw = lw; if (lw > 16) sp.olw = 1.25;
  if (d.ex && d.ex.ghost) { var S0 = sp.S; sp.draw = function (g, pose, step, mask) { if (mask) return; g.save(); g.translate(48, 95.5); g.scale(1.42, 1.42); g.translate(-32, -61.5); S0.pose = pose; S0.step = step; DS.artHuman(g, S0); g.restore(); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(30,80,70,.3)'; g.fillRect(0, 0, 999, 999); g.restore(); }; }
  return sp;
}
DS.artSpec2 = function (name, palKey) {
  if (DS.BIG && DS.BIG[name]) {
    var bk = null; if (DS.BOSSES) for (var k in DS.BOSSES) if (DS.BOSSES[k].sprite === name && (DS.BOSSES[k].pal || k) === palKey) { bk = k; break; }
    if (bk && BOSS[bk]) return toSpec(BOSS[bk], 24);
    if (BIGM[name + '|' + palKey]) return toSpec(BIGM[name + '|' + palKey], 24);
    return null;
  }
  if (MON[name]) return toSpec(MON[name], 16);
  return null;
};
DS.ART_BOSS = BOSS; DS.ART_MON = MON;
DS.artKit = { brute: brute, quad: quad, serpent: serpent, wyrm: wyrm, waterSpirit: waterSpirit, specter: specter, scorp: scorp, flyKing: flyKing, ballista: ballista, duskKing: duskKing, impP: impP, slimeP: slimeP, eye: eye, held: held, W: W, hum: hum, toSpec: toSpec };      // 2.3.0: art5 (새 몬스터 · 큰 보스) 가 같은 몸을 다시 쓴다
})();
