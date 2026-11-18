// r14 새 그림 ③ — 탈것(말·매·천마·용)·부대원 괴물(그리폰·머맨·돌 정령) + 이름 → 그림 연결(DS.artCanvas)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var T = DS.artTools, part = T.part, mute = T.mute, blob = T.blob, E = T.E, RR = T.RR, poly = T.poly, line = T.line, curve = T.curve, dot = T.dot, mix = T.mix, css = T.css, sh1 = T.sh1, sh2 = T.sh2, lt = T.lt, ink = T.ink;
var HT = DS.artHumanTools, circ = HT.circ, el = HT.el, cap = HT.cap;
var MAT = DS.artMAT, ACC = DS.artACC;

// ───────── 말 (기병·랜서·배틀마스터·천마) ─────────
// H = { c 몸빛, mane, cloth(말옷 색), trim, helm(말 투구 금속), horn, wings(날개 빛), step, pose, fly }
function horse(g, H, back) {
  var c = mute(H.c), mn = mute(H.mane || H.c), st = H.step || 0, at = H.pose === 'atk', ht = H.pose === 'hit';
  if (back) {      // 뒤 날개·꼬리 (탄 사람보다 먼저)
    part(g, function (g) { g.moveTo(15.5, 40); g.quadraticCurveTo(7, 41, 6.6, 50); g.quadraticCurveTo(8, 56, 5.4, 59); g.quadraticCurveTo(12, 57.6, 12.4, 50.6); g.quadraticCurveTo(13.6, 46, 17, 45); g.closePath(); }, mn, { sd: 1.8 });
    if (H.wings) bigWing(g, mute(H.wings), 26, 38, 1, H.pose, true);
    return;
  }
  var legs = H.fly ? [[19, 0, 1], [23.5, 0, 0], [39.5, 0, 1], [44, 0, 0]] : [[19.5, st === 1 ? 2.2 : 0, 1], [24, st === 2 ? 2.2 : 0, 0], [39.5, st === 2 ? 2.2 : 0, 1], [44, st === 1 ? 2.2 : 0, 0]];
  legs.forEach(function (L) { if (!L[2]) return; leg(L[0], L[1], sh1(c)); });
  // 몸
  part(g, function (g) { blob(g, [15, 44, 17, 37.4, 28, 36, 40, 36.6, 46.6, 40.4, 46, 48, 38, 51.4, 26, 51.6, 17, 50]); }, c, { sd: 3.4, gl: function (g) { E(g, 24, 39, 4, 1.1, -0.08); } });
  if (H.cloth) {
    part(g, function (g) { g.moveTo(17, 40); g.quadraticCurveTo(28, 37, 41, 38.4); g.lineTo(42.4, 50); g.quadraticCurveTo(38, 54, 36, 51.8); g.quadraticCurveTo(32, 55.6, 29, 52); g.quadraticCurveTo(25, 55.6, 22, 52); g.quadraticCurveTo(18, 54, 16, 50); g.closePath(); }, mute(H.cloth), { sd: 2.6 });
    curve(g, 16.6, 49.6, 29, 52.6, 42.2, 49.2, css(mute(H.trim || '#d8b450')), 1.0);
    for (var i = 0; i < 3; i++) dot(g, 22 + i * 7, 46, 1.0, css(mute(H.trim || '#d8b450')));
  }
  legs.forEach(function (L) { if (L[2]) return; leg(L[0], L[1], c); });
  // 목·머리
  var hy = at ? 1.6 : ht ? -2 : 0, hx = at ? 1.4 : ht ? -1 : 0;
  part(g, function (g) { g.moveTo(37.4, 40); g.quadraticCurveTo(40, 30 + hy, 45 + hx, 24 + hy); g.lineTo(51 + hx, 27 + hy); g.quadraticCurveTo(48, 35, 46, 43); g.closePath(); }, c, { sd: 2.2 });
  part(g, function (g) { blob(g, [43 + hx, 24.6 + hy, 47 + hx, 20.6 + hy, 52 + hx, 22.4 + hy, 58.6 + hx, 29.4 + hy, 58 + hx, 33 + hy, 54.6 + hx, 33.4 + hy, 47.6 + hx, 29.6 + hy]); }, c, { sd: 2, hl: 0.7 });
  part(g, el(57 + hx, 31.6 + hy, 2.2, 1.8), lt(c, 0.12), { sd: 0.6, hl: 0 });
  dot(g, 57.4 + hx, 31 + hy, 0.5, css(ink(c)));
  part(g, function (g) { g.moveTo(46.6 + hx, 22 + hy); g.lineTo(46.2 + hx, 16.4 + hy); g.lineTo(49.4 + hx, 21 + hy); g.closePath(); }, c, { sd: 0.8 });
  dot(g, 51.2 + hx, 25.4 + hy, 1.25, '#2a2030'); dot(g, 50.8 + hx, 24.9 + hy, 0.45, 'rgba(255,250,240,.9)');
  // 갈기
  part(g, function (g) { g.moveTo(45.4 + hx, 21 + hy); g.quadraticCurveTo(41, 22, 38.6, 30); g.quadraticCurveTo(37, 35, 35.6, 39); g.quadraticCurveTo(39, 36, 40, 34); g.quadraticCurveTo(41, 30, 43, 28.6); g.quadraticCurveTo(43, 25, 46.6 + hx, 24 + hy); g.closePath(); }, mn, { sd: 1.4 });
  if (H.helm) { part(g, function (g) { blob(g, [45.4 + hx, 21.8 + hy, 49 + hx, 20.4 + hy, 54 + hx, 23.6 + hy, 56.4 + hx, 28.6 + hy, 52 + hx, 27.6 + hy, 47 + hx, 26.8 + hy]); }, mute(H.helm), { sd: 1, gl: function (g) { E(g, 49 + hx, 22 + hy, 1.4, 0.6); } }); }
  if (H.horn) part(g, function (g) { g.moveTo(48.6 + hx, 21.6 + hy); g.lineTo(55 + hx, 12 + hy); g.lineTo(50.8 + hx, 22.6 + hy); g.closePath(); }, mute(H.horn), { sd: 0.6, hl: 0.4 });
  // 고삐
  line(g, [52 + hx, 29.6 + hy, 44, 36.6], css(mute('#4a3428')), 0.6);
  function leg(x, up, col) {
    part(g, function (g) { g.moveTo(x - 2.4, 45); g.lineTo(x + 2.4, 45); g.lineTo(x + 1.8, 58.6 - up); g.lineTo(x - 1.8, 58.6 - up); g.closePath(); }, col, { sd: 1 });
    part(g, function (g) { RR(g, x - 2.2, 57.6 - up, 4.6, 3.6, 1.2); }, mute('#4a3a34'), { sd: 0.6, hl: 0.3 });
  }
}
function bigWing(g, c, x, y, s, pose, far) {      // 깃털 큰 날개 (천마·매·배틀마스터)
  g.save(); g.translate(x, y); g.scale(s * (far ? 0.86 : 1), s); g.rotate(far ? 0.12 : -0.05);
  var col = far ? sh1(c) : c;
  part(g, function (g) { g.moveTo(2, 2); g.quadraticCurveTo(-4, -14, -14, -24); g.quadraticCurveTo(-22, -27, -27, -22); g.quadraticCurveTo(-22, -20, -24, -15); g.quadraticCurveTo(-19, -14, -20.6, -9); g.quadraticCurveTo(-15, -8.4, -16, -3.6); g.quadraticCurveTo(-11, -3.6, -10.6, 0.6); g.quadraticCurveTo(-5, 0, 2, 6); g.closePath(); }, col, { sd: 2.6 });
  curve(g, -2, 0, -10, -12, -21, -21, css(sh1(col)), 0.6); curve(g, -5, 2, -12, -4, -18, -10, css(sh1(col)), 0.5);
  g.restore();
}
function membrane(g, c, x, y, s, far) {      // 박쥐 날개 (용)
  g.save(); g.translate(x, y); g.scale(s * (far ? 0.86 : 1), s); g.rotate(far ? 0.15 : 0);
  var col = far ? sh1(c) : c, bone = sh2(c);
  part(g, function (g) { g.moveTo(2, 2); g.lineTo(-6, -22); g.quadraticCurveTo(-12, -27, -25, -24); g.quadraticCurveTo(-21, -19, -24, -12); g.quadraticCurveTo(-19, -12, -19, -5); g.quadraticCurveTo(-14, -5.6, -12, 0); g.quadraticCurveTo(-6, -1, 2, 6); g.closePath(); }, col, { sd: 2.4 });
  line(g, [1, 3, -6, -22, -25, -24], css(bone), 1.1); line(g, [-6, -22, -24, -12], css(bone), 0.7); line(g, [-6, -22, -19, -5], css(bone), 0.7);
  g.restore();
}
// ───────── 탄 사람: 사람 그림의 윗몸을 말 등에 얹는다 ─────────
function rider(g, S, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.translate(-31, -51);
  S.ride = 1; DS.artHuman(g, S);
  g.restore();
}
// ───────── 매 (호크나이트) ─────────
function hawk(g, B, back) {
  var c = mute(B.c), w = mute(B.w || B.c), belly = lt(c, 0.35);
  if (back) { bigWing(g, w, 30, 40, 1.1, B.pose, true); part(g, function (g) { g.moveTo(18, 44); g.lineTo(5, 47); g.lineTo(6.4, 51); g.lineTo(4.6, 54); g.lineTo(18, 50.6); g.closePath(); }, sh1(c), { sd: 1.4 }); return; }
  part(g, function (g) { blob(g, [16, 46, 22, 38.4, 34, 37.6, 44, 40, 47, 46, 42, 52, 30, 54, 20, 51.4]); }, c, { sd: 3 });
  part(g, function (g) { blob(g, [28, 48.6, 36, 44.6, 44, 45.6, 42, 51, 34, 53]); }, belly, { sd: 1.2, hl: 0 });
  [[30, 53], [37, 52.6]].forEach(function (p) { line(g, [p[0], p[1], p[0] + 1, p[1] + 4.6], css(mute('#c8a040')), 1.2); line(g, [p[0] - 1, p[1] + 4.6, p[0] + 3, p[1] + 4.6], css(mute('#c8a040')), 1.0); });
  part(g, function (g) { blob(g, [40, 40, 42, 32, 48, 28.6, 54, 31, 54.6, 37, 49, 42]); }, c, { sd: 1.8 });
  part(g, function (g) { g.moveTo(53, 31.4); g.quadraticCurveTo(59.6, 31.6, 59, 37); g.quadraticCurveTo(57.6, 35, 54.6, 35.6); g.closePath(); }, mute('#d8b048'), { sd: 0.8 });
  dot(g, 50.6, 32.2, 1.3, '#2a2030'); dot(g, 50.2, 31.7, 0.45, 'rgba(255,250,240,.9)'); line(g, [48, 30.4, 52.6, 30.6], css(sh2(c)), 0.7);
  if (B.crest) part(g, function (g) { g.moveTo(46, 29.6); g.quadraticCurveTo(42, 23, 38, 24.6); g.quadraticCurveTo(42, 26, 43.6, 31); g.closePath(); }, mute(B.crest), { sd: 0.8 });
  bigWing(g, w, 32, 41, 1.15, B.pose, false);
}
// ───────── 용 (드래곤나이트·와이번 작은 꼴) ─────────
function dragon(g, D, back) {
  var c = mute(D.c), belly = mute(D.belly || '#e0cc9a'), wc = mute(D.wing || D.c), st = D.step || 0;
  if (back) {
    membrane(g, wc, 28, 40, 1.12, true);
    part(g, function (g) { g.moveTo(17, 44); g.quadraticCurveTo(6, 44, 4.4, 52); g.quadraticCurveTo(3.6, 57, 8.6, 58.6); g.quadraticCurveTo(6.6, 54, 9, 51.6); g.quadraticCurveTo(12, 49.6, 18, 50.4); g.closePath(); }, sh1(c), { sd: 1.6 });
    part(g, function (g) { poly(g, [8.6, 58.6, 4, 61, 6.6, 56]); }, sh2(c), { sd: 0, hl: 0 });
    return;
  }
  [[22, 1], [40, 1]].forEach(function (L) { part(g, cap(L[0], 48, L[0] - 1, 57, 2.2), sh1(c), { sd: 0.8 }); });
  part(g, function (g) { blob(g, [15, 46, 19, 39, 30, 37, 41, 38.4, 46, 43, 44, 50, 33, 53, 22, 52.4]); }, c, { sd: 3.2 });
  part(g, function (g) { blob(g, [24, 50.4, 33, 47.4, 42, 46.6, 43, 50, 33, 53]); }, belly, { sd: 1, hl: 0 });
  for (var i = 0; i < 3; i++) line(g, [28 + i * 4.6, 48.6 - i * 0.6, 28.6 + i * 4.6, 52.4 - i * 0.4], css(sh1(belly)), 0.5);
  for (i = 0; i < 4; i++) part(g, function (g) { var x = 20 + i * 5; poly(g, [x, 38.4 - i * 0.3, x + 2, 34.4 - i * 0.3, x + 4, 38 - i * 0.3]); }, sh1(c), { sd: 0, hl: 0, ln: 0.6 });
  [[25, 1], [43, 1]].forEach(function (L) { part(g, cap(L[0], 48, L[0] + 0.6, 57.4, 2.4), c, { sd: 1 }); part(g, el(L[0] + 1.6, 58.4, 3, 1.7), sh1(c), { sd: 0.5 }); });
  // 목·머리
  part(g, function (g) { g.moveTo(37.6, 41); g.quadraticCurveTo(42, 30, 47.6, 25); g.lineTo(52.6, 28.6); g.quadraticCurveTo(48, 34, 46, 44); g.closePath(); }, c, { sd: 2 });
  part(g, function (g) { blob(g, [44.6, 25.6, 48, 20.4, 54, 21.6, 60.6, 26, 60.6, 29.6, 55, 31.4, 49, 30.6]); }, c, { sd: 1.8, hl: 0.7 });
  line(g, [53, 29.4, 60, 28.6], css(ink(c)), 0.6); dot(g, 59, 26, 0.5, css(ink(c)));
  part(g, function (g) { g.moveTo(47.6, 21.6); g.quadraticCurveTo(44, 15, 39, 14.4); g.quadraticCurveTo(43, 18, 45.6, 23.6); g.closePath(); }, mute(D.horn || '#e2d6bc'), { sd: 0.6 });
  part(g, function (g) { g.moveTo(50.4, 20.8); g.quadraticCurveTo(48.6, 14, 44.6, 11.6); g.quadraticCurveTo(47.6, 16, 48.6, 21.4); g.closePath(); }, mute(D.horn || '#e2d6bc'), { sd: 0.6 });
  dot(g, 52.4, 24.4, 1.3, css(mute(D.eye || '#e0b040'))); line(g, [52.4, 23.2, 52.4, 25.6], '#2a2030', 0.6); line(g, [50.4, 22.6, 54.6, 22.8], css(sh2(c)), 0.7);
  membrane(g, wc, 30, 41, 1.12, false);
}
// ───────── 그리폰 (부대원) ─────────
function griffin(g, P, step, pose) {
  var c = mute(P.a), f = mute(P.c), w = mute(P.p);
  bigWing(g, w, 28, 40, 1.0, pose, true);
  part(g, function (g) { g.moveTo(16, 44); g.quadraticCurveTo(7, 42, 6, 50); g.quadraticCurveTo(9, 48, 11.4, 50.4); g.quadraticCurveTo(13, 47, 17, 48); g.closePath(); }, c, { sd: 1 });
  part(g, function (g) { blob(g, [5.4, 49.6, 7.6, 47.4, 9.6, 49.6, 7.6, 52.6]); }, sh1(c), { sd: 0.5 });
  [[20, step === 1 ? 2 : 0], [36, step === 2 ? 2 : 0]].forEach(function (L) { part(g, cap(L[0], 47, L[0], 58 - L[1], 2.1), sh1(c), { sd: 0.6 }); });
  part(g, function (g) { blob(g, [15, 46, 19, 39.4, 30, 38.6, 41, 40, 44, 46, 40, 51.6, 28, 52.6, 18, 51]); }, c, { sd: 3 });
  [[23.6, step === 2 ? 2 : 0], [40, step === 1 ? 2 : 0]].forEach(function (L, i) { part(g, cap(L[0], 48, L[0] + 0.4, 58.4 - L[1], 2.3), c, { sd: 0.9 }); if (i) { line(g, [L[0] - 1, 60.4 - L[1], L[0] + 3.6, 60.4 - L[1]], css(mute('#c8a040')), 1.4); } else part(g, el(L[0] + 1.2, 59.6 - L[1], 2.8, 1.6), sh1(c), { sd: 0.5 }); });
  part(g, function (g) { blob(g, [37, 44, 39, 34, 45, 27.6, 52, 28.4, 54, 35, 50, 42, 43, 46]); }, f, { sd: 2.2 });
  part(g, function (g) { g.moveTo(52, 30); g.quadraticCurveTo(59.6, 30, 59, 36.4); g.quadraticCurveTo(57, 34, 53.6, 35); g.closePath(); }, mute('#d8b048'), { sd: 0.8 });
  part(g, function (g) { g.moveTo(44, 29); g.lineTo(42.6, 22.6); g.lineTo(46.6, 27.6); g.closePath(); }, f, { sd: 0.5 });
  dot(g, 49.6, 31.4, 1.35, '#2a2030'); dot(g, 49.2, 30.9, 0.45, 'rgba(255,250,240,.9)'); line(g, [47, 29.6, 52, 29.8], css(sh2(f)), 0.7);
  bigWing(g, w, 31, 42, 1.0, pose, false);
  if (P.gc) part(g, function (g) { g.moveTo(45, 28.6); g.quadraticCurveTo(41, 21, 36.4, 22.6); g.quadraticCurveTo(41, 24.6, 42.6, 30); g.closePath(); }, mute(P.gc), { sd: 0.8 });
}
// ───────── 머맨 (부대원): 물고기 꼬리 위에 선 비늘 전사 ─────────
function merman(g, P, step, pose, grade, gc) {
  var c = mute(P.a), fin = mute(P.e), finD = mute(P.E), bel = lt(c, 0.35), at = pose === 'atk', ht = pose === 'hit';
  var lean = at ? 0.1 : ht ? -0.14 : 0, sw = step ? (step === 1 ? -1.2 : 1.2) : 0;
  part(g, function (g) { g.moveTo(25, 48); g.quadraticCurveTo(22, 57, 28, 59.6); g.quadraticCurveTo(36, 61.6, 44, 58 + sw); g.lineTo(49.6, 54 + sw); g.lineTo(48.4, 61.4 + sw); g.lineTo(42, 61.6); g.quadraticCurveTo(30, 63.4, 22.4, 59.8); g.quadraticCurveTo(17, 55, 21, 47); g.closePath(); }, c, { sd: 2.4 });
  part(g, function (g) { g.moveTo(44, 58 + sw); g.lineTo(52, 51.6 + sw); g.lineTo(50.6, 58 + sw); g.lineTo(53.4, 63 + sw); g.lineTo(44.6, 61); g.closePath(); }, fin, { sd: 1 });
  g.save(); g.translate(31, 52); g.rotate(lean); g.translate(-31, -52);
  part(g, cap(23.4, 40, 20, 47, 2.3), sh1(c), { sd: 0.8 });
  part(g, function (g) { blob(g, [21, 41, 24, 36.6, 38, 36.4, 41.6, 41, 40, 50, 31, 52.6, 22.4, 50]); }, c, { sd: 3 });
  part(g, function (g) { blob(g, [26, 42, 31, 39.6, 36.6, 42, 36, 49, 31, 51, 26.4, 49]); }, bel, { sd: 1, hl: 0 });
  for (var i = 0; i < 3; i++) line(g, [27, 43 + i * 2.6, 35.6, 43 + i * 2.6], css(sh1(bel)), 0.5);
  part(g, function (g) { RR(g, 21.4, 47.4, 19.4, 2.6, 1.2); }, mute(P.g || '#cdd5e3'), { sd: 0.6 });
  // 머리
  part(g, function (g) { g.moveTo(22, 22); g.quadraticCurveTo(20, 10.4, 30.6, 9.8); g.quadraticCurveTo(29, 6, 35, 4.6); g.quadraticCurveTo(33.6, 8, 36.4, 10.6); g.quadraticCurveTo(42, 13, 42.6, 18); g.closePath(); }, fin, { sd: 1.6 });
  part(g, function (g) { blob(g, [18.6, 25, 20.6, 14.6, 31, 11.6, 42, 14.6, 46.6, 23, 47, 30, 42, 35.6, 31, 37.4, 22, 34]); }, c, { sd: 2.8, hl: 0.6 });
  part(g, function (g) { blob(g, [33, 30, 40, 28.6, 46.6, 29.6, 45, 34.4, 38, 36.4]); }, bel, { sd: 0.8, hl: 0 });
  part(g, function (g) { g.moveTo(21, 22); g.lineTo(13.6, 18.4); g.lineTo(15.6, 23.6); g.lineTo(13, 27.4); g.lineTo(21, 28); g.closePath(); }, finD, { sd: 0.8 });
  dot(g, 37.6, 22.6, 2.2, '#2a2030'); dot(g, 43.4, 22.4, 1.8, '#2a2030'); dot(g, 37, 21.8, 0.7, 'rgba(255,250,240,.9)'); dot(g, 43, 21.7, 0.55, 'rgba(255,250,240,.9)');
  curve(g, 40, 31.6, 42.6, 32.6, 45, 31.4, css(ink(bel)), 0.7);
  for (i = 0; i < 3; i++) curve(g, 23 + i * 2.6, 28, 24 + i * 2.6, 26.4, 25 + i * 2.6, 28, css(sh1(c)), 0.5);
  if (gc) part(g, function (g) { g.moveTo(31, 10.4); g.quadraticCurveTo(30, 3, 37, 1.6); g.quadraticCurveTo(33, 5, 34.4, 10); g.closePath(); }, mute(gc), { sd: 0.6 });
  var hand = at ? [48, 42] : ht ? [42, 45] : [44.6, 47.4];
  var wd = { cat: 'lance', kind: 'trident', t: 3 + grade, m: MAT[Math.min(10, 2 + grade)], acc: ACC[Math.min(10, 2 + grade)], gem: '#62b0ee', grade: 0 };
  g.save(); g.translate(hand[0], hand[1]); g.rotate(at ? 1.25 : ht ? -0.5 : 0); DS.artWeapon(g, wd); g.restore();
  part(g, cap(39.4, 39.6, hand[0], hand[1], 2.3), c, { sd: 1 });
  part(g, circ(hand[0], hand[1], 2.2), c, { sd: 0.7 });
  g.restore();
  return wd;
}
// ───────── 돌 정령 (부대원) ─────────
function golem(g, P, step, pose, gc) {
  var c = mute(P.m), d = mute(P.M), x = mute(P.x), at = pose === 'atk', ht = pose === 'hit', sx = at ? 1.6 : ht ? -1.6 : 0;
  [[24, step === 1 ? 2 : 0], [37, step === 2 ? 2 : 0]].forEach(function (L) { part(g, function (g) { blob(g, [L[0] - 4.6, 52 - L[1], L[0] + 4.6, 51 - L[1], L[0] + 5.6, 61.6 - L[1], L[0] - 5, 61.6 - L[1]]); }, d, { sd: 1.4 }); });
  g.save(); g.translate(sx, ht ? 1 : 0);
  part(g, function (g) { blob(g, [13, 40, 14, 30, 22, 25, 33, 23.6, 44, 26, 50, 33, 50, 44, 44, 53, 31, 55.6, 18, 53]); }, c, { sd: 4, gl: function (g) { E(g, 21, 30, 3.4, 1.4, -0.6); } });
  [[19, 38, 24, 46], [33, 30, 41, 35], [36, 44, 44, 41], [26, 49, 30, 53]].forEach(function (l) { line(g, l, css(sh2(c)), 0.8); });
  part(g, function (g) { blob(g, [5.6, 37, 8, 31, 15, 30, 18, 36, 16, 46, 10, 48, 6, 44]); }, d, { sd: 2 });
  part(g, function (g) { blob(g, [28, 17, 31, 10, 40, 8.6, 47, 13, 47.4, 21, 41, 26, 32, 25.4]); }, c, { sd: 2.4 });
  dot(g, 37.6, 17.4, 2.6, css(x, 0.3)); dot(g, 44, 17, 2.2, css(x, 0.3)); dot(g, 37.6, 17.4, 1.3, css(x)); dot(g, 44, 17, 1.1, css(x));
  part(g, function (g) { poly(g, [28, 37, 31.6, 33.4, 35, 37, 31.6, 41]); }, x, { sd: 0, hl: 0, ln: 0.6 });
  dot(g, 31.6, 37.2, 3.4, css(x, 0.18));
  var hx = at ? 54 : 49, hy = at ? 38 : 45;
  part(g, function (g) { blob(g, [hx - 6, hy - 6, hx + 1, hy - 8, hx + 6, hy - 2, hx + 4, hy + 6, hx - 4, hy + 6]); }, d, { sd: 2 });
  if (gc) part(g, function (g) { poly(g, [30, 10.6, 33, 3.6, 34.6, 10]); }, mute(gc), { sd: 0.5 });
  g.restore();
}
DS.artBeasts = { horse: horse, hawk: hawk, dragon: dragon, griffin: griffin, merman: merman, golem: golem, bigWing: bigWing, membrane: membrane, rider: rider };

// ═════════ 이름 → 모습 표 ═════════
function L(head, body, items, pal) { return [head, body, items, pal]; }
var CAVP = [{ a: '#b5814f', A: '#7f5632', h: '#a8754a', H: '#6f4a2c' }, { a: '#5b8fd6', A: '#3a62a8', h: '#a8754a', H: '#6f4a2c' },
  { a: '#cdd5e3', A: '#8f9ab3', h: '#f1ead9', H: '#cfc4a8', m: '#ffffff', M: '#cdd5e3' }, { a: '#c0525e', A: '#8a3040', h: '#3a3350', H: '#262036' },
  { a: '#e8bb45', A: '#b07f2a', h: '#f1ead9', H: '#cfc4a8', m: '#f6cf57', M: '#c08f2c' }, { a: '#7d55c0', A: '#4f3288', h: '#f1ead9', H: '#cfc4a8', m: '#f6cf57', M: '#c08f2c' },
  { a: '#f7f2e6', A: '#cfc6ae', h: '#e8bb45', H: '#b07f2a', m: '#f6cf57', M: '#c08f2c', w: '#c9f1ff' }];
var CAVQ = [null, null, { q: '#5b8fd6' }, { q: '#8a3040', r: '#f6cf57' }, { q: '#c0525e' }, { q: '#f6cf57', r: '#ffffff' }, { q: '#62b0ee' }];
var HORSE = ['#8a5a36', '#a8754a', '#e9e2d6', '#3a3350', '#e9e2d6', '#d8d0c4', '#efe8dc'], MANE = ['#4a3020', '#5e3a22', '#c8bca8', '#1e1a26', '#d8b450', '#7d55c0', '#d8b450'];
var FLYP = [{ a: '#c86a8a', A: '#8f4462', b: '#f0e0a0', mount: 'hawk', c: '#a8784a', w: '#8a6040', cr: '#c86a8a' },
  { a: '#5b8fd6', A: '#3a62a8', b: '#d8b450', mount: 'peg', c: '#efe8dc', w: '#f4efe6', mane: '#c8d4e4' },
  { a: '#d890a8', A: '#a86880', b: '#d8b450', mount: 'peg', c: '#f4f0ea', w: '#f6f2ea', mane: '#e8c870', horn: '#e8c870' },
  { a: '#cdd5e3', A: '#8f9ab3', b: '#b8404c', mount: 'dragon', c: '#4f9a86', wing: '#3d7a6e', belly: '#d9d08a' },
  { a: '#3a3350', A: '#262036', b: '#d8b450', mount: 'dragon', c: '#b84a36', wing: '#8a3428', belly: '#e0b070' },
  { a: '#d8b450', A: '#a07a30', b: '#ffffff', mount: 'dragon', c: '#36304a', wing: '#4a2f3e', belly: '#c08a54', eye: '#e04a5a', horn: '#d8b450' }];
var BMP = [{ a: '#e8bb45', A: '#b07f2a', h: '#3a3350', m: '#f6cf57', q: '#c0525e', w: '#d8d0c8' }, { a: '#f7f2e6', A: '#cfc6ae', h: '#c0525e', m: '#f6cf57', q: '#f6cf57', w: '#f4efe6' },
  { a: '#2b2440', A: '#1b1626', h: '#f7f2e6', m: '#ff4d6d', q: '#b8404c', w: '#3a3048', s: '#f3c9a1' }];
var HUM = {      // LOOKP 에 없는 사람 모습 (합일 8~10단)
  tm_8: L('hood', 'armor', ['mwing', 'cape', 'trident'], { a: '#3fa88a', A: '#27705c', b: '#f6cf57', q: '#2f86a6', Q: '#1f5d78', w: '#f6cf57' }),
  tm_9: L('horned', 'armor', ['mwing', 'cape', 'lbow'], { a: '#e8bb45', A: '#b07f2a', b: '#ffffff', q: '#3fa88a', Q: '#27705c', w: '#ffffff' }),
  tm_10: L('crown', 'armor', ['mwing2', 'cape', 'lbow'], { a: '#f7f2e6', A: '#cfc6ae', b: '#62b0ee', q: '#e8bb45', Q: '#b07f2a', h: '#3fa88a', H: '#27705c', w: '#9fe8ec' }),
  mm_8: L('wizhat', 'robe', ['mwing', 'cape', 'orb'], { a: '#e8bb45', A: '#b07f2a', b: '#8d6be0', q: '#8d6be0', Q: '#5f41ad', c: '#ffffff', C: '#b181e6' }),
  mm_9: L('crown', 'robe', ['mwing', 'cape', 'orb'], { a: '#8d6be0', A: '#5f41ad', b: '#f6cf57', q: '#f7f2e6', Q: '#cfc6ae', c: '#fff0a0', C: '#f6cf57', h: '#f7f2e6', H: '#cfc6ae' }),
  mm_10: L('crown', 'robe', ['mwing2', 'cape', 'orb'], { a: '#f7f2e6', A: '#cfc6ae', b: '#f6cf57', q: '#f6cf57', Q: '#c08f2c', c: '#ffffff', C: '#9fe8ec', h: '#b181e6', H: '#7446ad' }),
  // 마을 사람·옛 병과 그림 (적 사람형도)
  fighter: L('helm', 'armor', ['sword', 'shield'], { a: '#6f8fc0', A: '#4a6494' }), knight: null, hawk: null,
  captain: L('tricorn', 'tunic', ['trident'], { a: '#2f86a6', A: '#1f5d78', h: '#5e3a22' }), sniper: L('hood', 'tunic', ['bow'], { a: '#5fae5a', A: '#3a7d42' }),
  magician: L('wizhat', 'robe', ['staff'], { a: '#8d6be0', A: '#5f41ad', c: '#ff9de1' }), monk: L('bald', 'tunic', ['beads'], { a: '#f09a4a', A: '#b8642a', b: '#e0525e' }),
  lord: L('plume', 'armor', ['spear'], { a: '#5fae5a', A: '#3a7d42' }),
  soldier: L('helm', 'armor', ['spear'], { a: '#8a5a4a', A: '#5e3a2e', b: '#a0a0a8', m: '#8a8a94' }), archer: L('hood', 'tunic', ['bow'], { a: '#7a5a48', A: '#523a2e' }),
  darkKnight: L('horned', 'armor', ['gsword'], { a: '#3a3350', A: '#262036', b: '#b8404c', m: '#4a4458', w: '#ff9a9a' }), darkMage: L('darkhood', 'robe', ['sstaff'], { a: '#4a3a6a', A: '#2e2448', x: '#e04a8a', z: '#1b1626' }),
  darkPriest: L('darkhood', 'robe', ['cross'], { a: '#5a2a3a', A: '#3a1a26', x: '#ffd24a', b: '#c0303a' }), skeleton: L('skull', 'bones', ['sword'], { l: '#d8d0bc', L: '#a09a88' }),
  skelArcher: L('skull', 'bones', ['bow'], { l: '#d8d0bc', L: '#a09a88' }),
  elder: L('bald', 'robe', ['staff'], { a: '#8a7a5a', A: '#5e5236', c: '#9fe8ec' }), elder_mundong: L('bald', 'robe', ['staff'], { a: '#6a7a5a', A: '#46523a', c: '#d8b450' }),
  npc_0: L('', 'tunic', [], { a: '#b86a48', A: '#7e4630', h: '#6a4228' }), npc_1: L('', 'robe', [], { a: '#6a8a5a', A: '#46603a', h: '#3a2a20', b: '#e9e2d0' }),
  npc_2: L('', 'tunic', [], { a: '#5a6a9a', A: '#3a4670', h: '#a87848' }), npc_3: L('', 'robe', [], { a: '#a85a6a', A: '#783a48', h: '#d8b46a', b: '#f0e6d0' })
};
var NPC_SX = { npc_1: 'f', npc_3: 'f', elder: 'm' }, NPC_AGE = { elder: 'elder', elder_mundong: 'elder', npc_2: 'teen' };
// 용병 (사람형 넷) — sprites2 merc() 와 같은 생김새
var SK2 = { s: '#d9a877', S: '#a8754a' }, SK3 = { s: '#9a6a46', S: '#6e4a30' }, SK1 = { s: '#f3c9a1', S: '#cf9670' };
function mx(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
var MERC = {
  m_sword: [L('helm', 'armor', ['sword', 'shield'], { a: '#8a94a8', A: '#5b6480', u: '#8a94a8', U: '#5b6480' }), L('plume', 'armor', ['sword', 'shield'], mx(SK2, { a: '#7a6a58', A: '#52463a', u: '#b84a55', U: '#7e2c3a', r: '#e0525e' })),
    L('hood', 'tunic', ['sword'], mx(SK1, { a: '#5a6a8a', A: '#3a4660', B: '#6f4a2c' })), L('horned', 'armor', ['axe'], mx(SK3, { a: '#6a5a4a', A: '#463a2e', m: '#a8a294', M: '#7d766a' }))],
  m_pike: [L('helm', 'armor', ['spear'], { a: '#7a9a6a', A: '#4f6b42' }), L('plume', 'armor', ['halberd'], mx(SK2, { a: '#6a8a9a', A: '#42606b', r: '#f6cf57' })),
    L('hood', 'tunic', ['spear'], mx(SK3, { a: '#8a7a4a', A: '#5e522e', B: '#6f4a2c' })), L('horned', 'armor', ['halberd'], { a: '#5a6a5a', A: '#3a463a' })],
  m_archer: [L('hood', 'tunic', ['bow'], { a: '#8a9a6a', A: '#5e6b42', B: '#6f4a2c' }), L('hood', 'tunic', ['lbow'], mx(SK2, { a: '#8a6a4a', A: '#5e452e', B: '#3a3350' })),
    L('helm', 'tunic', ['bow'], { a: '#6a7a9a', A: '#424e6b', B: '#6f4a2c' }), L('mask', 'tunic', ['bow'], mx(SK3, { a: '#4a4a5a', A: '#2e2e3a', B: '#3a3350' }))],
  m_sister: [L('veil', 'robe', ['wand'], { a: '#dfeaf6', A: '#a9bcd6' }), L('veil', 'robe', ['cross'], mx(SK2, { a: '#f4e6c8', A: '#cfb98a' })),
    L('tiara', 'robe', ['wand'], { a: '#cfe6d6', A: '#8fbba0', h: '#8a5a36', H: '#5e3a22', i: '#f6cf57' }), L('veil', 'robe', ['orb'], mx(SK3, { a: '#e6d6ea', A: '#b99ac0', c: '#fff0a0' }))],
  m_templar: [L('helm', 'armor', ['mace', 'shield'], { a: '#e9e2d0', A: '#b9ae96', u: '#e9e2d0', U: '#b9ae96' }), L('plume', 'armor', ['mace', 'shield'], mx(SK2, { a: '#d8dce6', A: '#9aa2b6', u: '#62b0ee', r: '#62b0ee' })),
    L('horned', 'armor', ['cross', 'shield'], { a: '#f1e6c0', A: '#c4b07a', u: '#f6cf57' }), L('mitre', 'armor', ['mace'], mx(SK3, { a: '#e9e2d0', A: '#b9ae96', h: '#e9e2d0' }))],
  m_skeleton: [L('skull', 'bones', ['sword'], { l: '#cfd6c0', L: '#8fa08a' }), L('skull', 'bones', ['axe'], { l: '#d8cfb6', L: '#a39a84' }), L('skull', 'bones', ['spear'], { l: '#c0cfd6', L: '#8a9aa0' }), L('skull', 'bones', ['sword', 'shield'], { l: '#d6c0c0', L: '#a08a8a', u: '#5b6480' })]
};
var M_LANCER = [{ a: '#8a94a8', A: '#5b6480', h: '#8a6a4a' }, { a: '#7a5a4a', A: '#523a2e', h: '#d8cfb6' }, mx(SK2, { a: '#4a6a5a', A: '#2e463a', h: '#3a3350' }), mx(SK3, { a: '#8a6a3a', A: '#5e4522', h: '#b5814f' })];
var M_GRIF = [{ a: '#d8b46a', p: '#a8843f', c: '#f1ead9' }, { a: '#b0a08a', p: '#7d6a50', c: '#8a94a8' }, { a: '#e9e2d0', p: '#62b0ee', c: '#ffffff' }, { a: '#8a5a36', p: '#e0525e', c: '#d8b46a' }];
var M_MER = [{ a: '#3a6a8a', e: '#62b0ee', E: '#3572b8', g: '#cdd5e3' }, { a: '#2f6b5a', e: '#4fd0a0', E: '#2f9a6a', g: '#f6cf57' }, { a: '#5a4a8a', e: '#9fe8ec', E: '#58a0b0', g: '#e9e2d0' }, { a: '#3a4a6a', e: '#8fa0d0', E: '#5b6aa0', g: '#b5814f' }];
var M_GOL = [{ m: '#b9a58a', M: '#8a765c', x: '#62e0ff' }, { m: '#9aa8a0', M: '#6b7a72', x: '#b6ff5a' }, { m: '#b08a7a', M: '#7d5a4c', x: '#ffd24a' }, { m: '#8a8aa8', M: '#5c5c7a', x: '#ff9de1' }];
var GR = ['', '#9a7048', '#6aa85a', '#5a92c8', '#9a72c8', '#d8b450'];
DS.ART_TABLE = { HUM: HUM, MERC: MERC };

// 방어구 장비 → 묘사
function aDesc(id) {
  var A = DS.ARTP.gearOf(id); if (!A) return null;
  var lg = A.grade >= 5 && DS.artWDesc ? DS.artWDesc(id) : null, t = Math.max(1, Math.min(10, A.mat || A.tier || 1));      // 2.1.0: 강화 단계(g.mat)
  return { cat: A.cat, line: A.line, t: t, grade: A.grade || 0, sh: lg ? lg.sh : null, m: lg ? lg.m : MAT[t], acc: lg ? lg.acc : ACC[t], gem: lg ? lg.gem : (A.grade === 4 ? '#b181e6' : '#62b0ee') };
}
// 이름 + 옷차림 → 그리기 묘사 { kind, S, lw }
function specOf(name, palKey, dress) {
  var o = dress && DS.dressParse ? DS.dressParse(dress) : {}, m, look;
  var base = { age: o.g || '', sx: o.x || '', faded: !!o.f, w: o.w ? DS.artWDesc(o.w) : null, a: o.a ? aDesc(o.a) : null };
  if ((m = /^([a-z]+)_(\d+)$/.exec(name))) {
    var cls = m[1], t = +m[2];
    look = (DS.LOOKP && DS.LOOKP[name]) || HUM[name];
    if (look) return { kind: 'human', S: mx(base, { head: look[0], body: look[1], items: look[2], pal: look[3], cls: cls, tier: t }) };
    if (cls === 'cav') { var cp = mx(CAVP[t - 1] || CAVP[0], CAVQ[t - 1] || {}); return { kind: 'cav', S: mx(base, { head: t >= 7 ? 'crown' : t >= 2 ? 'plume' : 'helm', body: 'armor', items: t >= 5 ? ['cape', 'spear'] : ['spear'], pal: cp, cls: 'cav', tier: t }), H: { c: HORSE[t - 1], mane: MANE[t - 1], cloth: t >= 3 ? (cp.q || '#5b8fd6') : null, trim: '#d8b450', helm: t >= 4 ? (cp.m || '#cdd5e3') : null, horn: t >= 7 ? '#e8d8a8' : null } }; }
    if (cls === 'bm') { var bp = BMP[t - 8] || BMP[0]; return { kind: 'cav', S: mx(base, { head: 'crown', body: 'armor', items: ['cape', 'spear'], pal: bp, cls: 'bm', tier: t }), H: { c: bp.h, mane: bp.m, cloth: bp.q, trim: '#d8b450', helm: bp.m, horn: t >= 9 ? '#e8d8a8' : null, wings: bp.w } }; }
    if (cls === 'fly') { var fp = FLYP[t - 2] || FLYP[0]; return { kind: 'fly', S: mx(base, { head: t >= 7 ? 'crown' : 'plume', body: 'armor', items: t >= 6 ? ['cape', 'spear'] : ['spear'], pal: mx(fp, { r: fp.b, q: fp.A }), cls: 'fly', tier: t }), F: fp }; }
    return null;
  }
  if ((m = /^(m_[a-z]+)_(\d)_(\d)$/.exec(name)) || (m = /^(m_[a-z]+)_(\d)$/.exec(name))) {
    var ty = m[1], gr = +m[2], v = +(m[3] || 0), gc = gr >= 4 ? GR[gr] : null;
    base.w = null; base.a = null;
    if (MERC[ty]) { var lk = MERC[ty][v] || MERC[ty][0]; return { kind: 'human', S: mx(base, { head: lk[0], body: lk[1], items: lk[2], pal: mx(lk[3], { b: GR[gr] }), cls: ty, tier: 1 + gr, grade: gr, gc: gc }) }; }
    if (ty === 'm_lancer') { var lp = M_LANCER[v] || M_LANCER[0]; return { kind: 'cav', S: mx(base, { head: 'helm', body: 'armor', items: ['spear'], pal: mx(lp, { b: GR[gr] }), cls: ty, tier: 1 + gr, grade: gr, gc: gc }), H: { c: lp.h, mane: '#3a2a20', cloth: gr >= 5 ? '#d8b450' : null, trim: GR[gr] } }; }
    if (ty === 'm_griffin') return { kind: 'griffin', P: mx(M_GRIF[v] || M_GRIF[0], { gc: gc }), grade: gr };
    if (ty === 'm_merman') return { kind: 'merman', P: M_MER[v] || M_MER[0], grade: gr, gc: gc };
    if (ty === 'm_spirit') return { kind: 'golem', P: M_GOL[v] || M_GOL[0], grade: gr, gc: gc };
    return null;
  }
  if (HUM[name]) { var hl = HUM[name]; return { kind: 'human', S: mx(base, { head: hl[0], body: hl[1], items: hl[2], pal: hl[3], cls: name, tier: 3, sx: NPC_SX[name] || base.sx, age: NPC_AGE[name] || base.age }) }; }
  if (DS.artSpec2) return DS.artSpec2(name, palKey, base);
  return null;
}
DS.artSpecOf = specOf;

// 묘사 → 그림 층 (lw 단위)
function paint(sp, opt, maskOnly) {
  var lw = sp.lw || 16, cv = T.layer(lw), g = cv.getContext('2d'), S = sp.S, pose = opt.pose || '', step = opt.step || 0;
  if (sp.draw) { sp.draw(g, pose, step, maskOnly); return cv; }
  if (lw !== 16) { g.translate(48, 95.5); g.scale(1.42, 1.42); g.translate(-32, -61.5); }
  if (S) { S.pose = pose; S.step = step; S.maskOnly = maskOnly; }
  if (sp.kind === 'human') DS.artHuman(g, S);
  else if (sp.kind === 'cav') {
    var H = mx(sp.H, { step: step, pose: pose });
    if (!maskOnly) horse(g, H, true);
    if (!maskOnly) horse(g, H);
    S.ride = 1; rider(g, S, 27.6, 44.6, 0.8);
  } else if (sp.kind === 'fly') {
    var F = sp.F, B = { c: F.c, w: F.w, crest: F.cr, pose: pose, wing: F.wing, belly: F.belly, eye: F.eye, horn: F.horn, mane: F.mane, fly: 1 };
    if (!maskOnly) { if (F.mount === 'hawk') hawk(g, B, true); else if (F.mount === 'dragon') dragon(g, B, true); else horse(g, { c: F.c, mane: F.mane, wings: F.w, horn: F.horn, fly: 1, pose: pose }, true); }
    if (!maskOnly) { if (F.mount === 'hawk') hawk(g, B); else if (F.mount === 'dragon') dragon(g, B); else horse(g, { c: F.c, mane: F.mane, horn: F.horn, fly: 1, pose: pose, cloth: S.tier >= 4 ? S.pal.A : null, trim: '#d8b450' }); }
    if (!maskOnly && F.mount === 'peg') bigWing(g, mute(F.w), 28, 41, 1.05, pose, false);
    S.ride = 1; rider(g, S, 28.6, 43.4, 0.78);
  } else if (sp.kind === 'griffin') { if (!maskOnly) griffin(g, sp.P, step, pose); }
  else if (sp.kind === 'merman') { if (!maskOnly) merman(g, sp.P, step, pose, sp.grade, sp.gc); }
  else if (sp.kind === 'golem') { if (!maskOnly) golem(g, sp.P, step, pose, sp.gc); }
  return cv;
}
// ═════════ 굽기 + 캐시 (sprites.js hdCanvas 가 부른다) ═════════
var AC = {}, specC = {};
DS.artFlush = function () { AC = {}; specC = {}; };
function tintOf(src, col) { var cv = T.mk(src.width), g = cv.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, cv.width, cv.height); return T.tag(cv, src.lw); }
function flipOf(src) { var cv = T.mk(src.width), g = cv.getContext('2d'); g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return T.tag(cv, src.lw); }
DS.artCanvas = function (name, palKey, opt) {
  if (DS.ART !== 'new') return null;
  opt = opt || {};
  var hs = name.indexOf('#'), dress = hs > 0 ? name.slice(hs + 1) : '', base = hs > 0 ? name.slice(0, hs) : name;
  var sk = name + '|' + (palKey || '');
  var sp = specC[sk]; if (sp === undefined) { try { sp = specOf(base, palKey, dress); } catch (e) { sp = null; } specC[sk] = sp; }
  if (!sp) return null;
  var key = sk + '|' + (opt.flip ? 1 : 0) + '|' + (opt.tint || '') + '|' + (opt.step || 0) + '|' + (opt.pose || '') + '|' + (opt.mask ? 'M' : '') + '|' + (opt.rim || '') + '|' + (opt.bust ? 'B' : '');
  if (key in AC) return AC[key];
  var t0 = performance.now(), out;
  if (opt.tint) out = tintOf(DS.artCanvas(name, palKey, { flip: opt.flip, step: opt.step, pose: opt.pose }), opt.tint);
  else if (opt.flip) { var o2 = {}; for (var k in opt) o2[k] = opt[k]; o2.flip = false; var b = DS.artCanvas(name, palKey, o2); out = b ? flipOf(b) : null; }
  else if (opt.mask) {
    var lay = paint(sp, opt, true), W = lay.width, mg = lay.getContext('2d'), d = mg.getImageData(0, 0, W, W).data, any = 0;
    for (var i = 3; i < d.length; i += 16) if (d[i] > 96) { any = 1; break; }
    if (any) { mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#ffffff'; mg.fillRect(0, 0, W, W); out = T.tag(lay, sp.lw || 16); } else out = null;
  } else if (opt.bust) out = DS.artBust ? DS.artBust(sp, opt) : null;
  else out = T.finish(paint(sp, opt, false), sp.lw || 16, { rim: opt.rim, olw: sp.olw });
  if (out && !opt.tint && !opt.mask && !opt.step && !opt.pose && !opt.bust) reg(out, name, palKey, sp, !!opt.flip);
  T.stat.ms += performance.now() - t0;
  return (AC[key] = out);
};
// ── 초상: 창 속 그림(<i data-spr> → canvas.px)은 굽힌 그림을 그대로 베낀 것이라, 화소 서명으로 어느 그림인지 알아내 가슴 위 큰 그림으로 바꾼다 ──
var SIG = {};
function sigOf(cv) {
  try { var W = cv.width, d = cv.getContext('2d').getImageData(0, 0, W, cv.height).data, h = 2166136261, n = d.length >> 2; for (var i = 0; i < n; i += 37) { var j = i << 2; h ^= d[j] | (d[j + 1] << 8) | (d[j + 2] << 16) | (d[j + 3] << 24); h = Math.imul(h, 16777619) >>> 0; } return W + ':' + h; } catch (e) { return null; }
}
function reg(cv, name, pal, sp, flip) { var k = sigOf(cv); if (k) SIG[k] = { name: name, pal: pal, sp: sp, flip: flip, lw: cv.lw }; }
DS.artLookup = function (cv) { if (DS.ART !== 'new' || !cv || !cv.width) return null; var k = sigOf(cv); return k ? SIG[k] || null : null; };
DS.artBust = function (sp, opt) {
  if (sp.kind !== 'human') return null;
  var Z = 144, s = Z / 50, cv = T.mk(Z), g = cv.getContext('2d');
  g.scale(s, s); g.translate(-7, -3);
  var S = sp.S; S.pose = ''; S.step = 0; S.maskOnly = false; S.bust = 1;
  DS.artHuman(g, S); S.bust = 0;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';      // 가슴 아래는 부드럽게 스러진다
  var gr = g.createLinearGradient(0, Z * 0.8, 0, Z); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(0, Z * 0.8, Z, Z * 0.2);
  var out = T.finish(cv, 16, { r: 1.3 * s });
  if (opt.flip) { var f = T.mk(Z), fg = f.getContext('2d'); fg.translate(Z, 0); fg.scale(-1, 1); fg.drawImage(out, 0, 0); out = T.tag(f, 16); }
  out.bust = 1; return out;
};
DS.artBustFor = function (c) {      // 창 속 canvas.px → { lw, bust } (새 그림이 아니면 null)
  var r = DS.artLookup(c); if (!r) return null;
  var b = null; try { b = DS.artCanvas(r.name, r.pal, { bust: 1, flip: r.flip }); } catch (e) { b = null; }
  return { lw: r.lw || 16, bust: b };
};
DS.artPaint = paint;
})();
