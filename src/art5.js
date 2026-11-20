// 전민 — 2.3.0 새 그림: 새 몬스터 열둘 (16px 몸 — 새 그림 표에 얹는다) · 큰 보스 (몸이 차지하는 칸 그대로의 큰 그림 — DS.bigCanvas)
//   같은 칠 함수(art.js part · 윤곽 · 테 빛)와 같은 몸(art4 DS.artKit — 거인 · 짐승 · 뱀 · 용 · 정령 · 벌레)을 쓴다. 큰 보스는 옛 몸을 몸 크기로 키우고 덧그림을 얹거나(1×2 · 2×1 · 2×2),
//   긴 몸(4×2 용 · 뱀 · 지렁이)과 높은 몸(2×4 어스름의 왕 · 갱도 거신)은 새로 그렸다.
//   큰 그림 캔버스: 논리 크기 = 몸 폭 × 16 + 양옆 여백 · 몸 높이 × 16 + 머리 위 여백. 자세(서기 · 공격 · 피격 · 시전) × 뒤집기 × 단색(흰 번쩍임 · 격노 붉은 테)마다 한 번 굽는다.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var T = DS.artTools, KT = DS.artKit, HT = DS.artHumanTools, B3 = DS.artBeasts; if (!T || !KT || !HT || typeof document === 'undefined') return;
var part = T.part, mute = T.mute, blob = T.blob, E = T.E, RR = T.RR, poly = T.poly, line = T.line, curve = T.curve, dot = T.dot, mix = T.mix, css = T.css, sh1 = T.sh1, sh2 = T.sh2, lt = T.lt, ink = T.ink;
var circ = HT.circ, el = HT.el, cap = HT.cap, AX = DS.ART_X || 6, BOSS = DS.ART_BOSS || {}, MON = DS.ART_MON || {};
function m(c) { return mute(c); }
function eye(g, x, y, r, col, glow) { KT.eye(g, x, y, r, col, glow); }
function pA(pose) { return pose === 'atk' ? 1 : pose === 'hit' ? -1 : 0; }
function clone(o) { var r = {}, k; for (k in o) r[k] = o[k]; return r; }
function humD(S0, extra) { return function (g, pose, step) { var S = clone(S0); S.pose = pose; S.step = step; DS.artHuman(g, S); if (extra) extra(g, pose, step); }; }

// ═════════ 새 몬스터 (64 단위 상자 — 16px 몸) ═════════
function boomerP(g, pose, step) {
  var c = m('#c8502a'), d = m('#7a2a1a'), sw = pose === 'cast' ? 1.12 : pose === 'hit' ? 0.94 : 1;
  part(g, el(25, 59.4 - (step === 1 ? 1.4 : 0), 4.6, 2.4), d, { sd: 0.8 }); part(g, el(39, 59.4 - (step === 2 ? 1.4 : 0), 4.6, 2.4), d, { sd: 0.8 });
  g.save(); g.translate(32, 60); g.scale(sw, 2 - sw); g.translate(-32, -60);
  part(g, circ(32, 44, 15), c, { sd: 4.4, gl: function (g) { E(g, 25, 37, 3.6, 2, -0.6); } });
  [[22, 47, 27, 43, 25, 38], [38, 53, 41, 47, 46, 45], [30, 56, 33, 51]].forEach(function (l) { line(g, l, css(m(pose === 'cast' ? '#fff0a0' : '#ffb347')), 1.5); line(g, l, css(m('#fff6d0')), 0.5); });
  part(g, function (g) { poly(g, [21, 33, 18, 25, 26, 31]); poly(g, [43, 31, 47, 23, 41, 29]); }, d, { sd: 0.8 });
  eye(g, 34, 41, 2.1, '#fff0a0', true); eye(g, 41.4, 40.6, 1.9, '#fff0a0', true);
  part(g, function (g) { g.moveTo(30, 47); g.quadraticCurveTo(37, 53, 45, 46.4); g.quadraticCurveTo(37, 50, 30, 47); g.closePath(); }, '#3a1410', { sd: 0, hl: 0, ln: 0.6 });
  curve(g, 30, 30, 26, 24, 28, 18, css(m('#5a4030')), 1.7);
  part(g, function (g) { blob(g, [28, 20, 24.6, 15, 28, 7, 30.6, 13, 33, 10, 31.6, 18]); }, m('#ff9a3c'), { sd: 0.8, hl: 0 }); dot(g, 28.6, 15, 1.7, css(m('#fff0a0')));
  if (pose === 'cast') { dot(g, 32, 44, 18, 'rgba(255,200,90,.22)'); }
  g.restore();
}
function bigSlimeP(g, pose, step) {
  var c = m('#7a6ad8'), d = m('#4a3a9a'), sq = step ? 1.06 : pose === 'atk' ? 0.9 : pose === 'hit' ? 1.12 : 1;
  g.save(); g.translate(32, 61.5); g.scale(sq * 1.08, (2 - sq) * 1.08); g.translate(-32, -61.5);
  part(g, function (g) { g.moveTo(9, 61); g.quadraticCurveTo(7, 42, 20, 33); g.quadraticCurveTo(29, 26, 34, 28); g.quadraticCurveTo(40, 24, 45, 31); g.quadraticCurveTo(57, 39, 55, 61); g.quadraticCurveTo(32, 64, 9, 61); g.closePath(); }, c, { sd: 5.4, hl: 1.2, gl: function (g) { E(g, 21, 40, 3.4, 2.2, -0.7); } });
  part(g, el(41, 53, 6, 4.4), lt(c, 0.25), { sd: 1.2, hl: 0 });      // 몸 안의 작은 덩이 (갈라질 것)
  part(g, el(24, 54, 4.6, 3.4), lt(c, 0.2), { sd: 1, hl: 0 });
  eye(g, 29, 44, 2.4, null, false); eye(g, 40, 43.4, 2.2, null, false);
  curve(g, 31, 51, 34.6, 53.6, 38, 51, css(ink(c)), 0.9);
  part(g, function (g) { poly(g, [24, 29, 25, 21, 29, 25.6, 32.4, 19, 35.6, 25.6, 39, 21, 40, 29]); }, m('#d8b450'), { sd: 0.8, gl: function (g) { E(g, 28, 25, 1, 0.8); } });      // 왕관
  dot(g, 32.4, 22.6, 1.1, css(m('#e0525e')));
  g.restore();
}
function wormP(g, pose, step, K) {      // 모래 벌레 · (큰 그림에서 몸만 길게)
  var a = m(K && K.a || '#c8a070'), d = m(K && K.A || '#8a6a44'), pa = pA(pose);
  part(g, function (g) { blob(g, [8, 61, 14, 52, 32, 49, 50, 52, 56, 61, 32, 63.4]); }, m(K && K.s || '#d8c08a'), { sd: 2, hl: 0 });      // 모래 둔덕
  for (var i = 0; i < 5; i++) dot(g, 12 + i * 10, 58 + (i & 1), 1.2, css(m('#a8885a'), 0.8));
  var hx = 36 + pa * 4, hy = 20 - pa * 2;
  part(g, function (g) { g.moveTo(20, 56); g.quadraticCurveTo(18, 36, hx - 8, hy + 6); g.lineTo(hx + 8, hy + 8); g.quadraticCurveTo(34, 38, 40, 56); g.closePath(); }, a, { sd: 3 });
  for (i = 0; i < 6; i++) curve(g, 20 + i * 1.4, 52 - i * 6, 28 + i * 1.8, 50 - i * 6.6, 37 + i * 0.6, 52 - i * 6.2, css(sh1(a)), 0.7);
  part(g, el(hx, hy + 2, 9.6, 8), a, { sd: 2.4 });
  part(g, el(hx + 1, hy + 2.4, 6, 4.8), m('#5a2a2a'), { sd: 1, hl: 0 });      // 둥근 입
  for (i = 0; i < 8; i++) { var q = i / 8 * 6.2832; part(g, function (g) { var x = hx + 1 + Math.cos(q) * 5.4, y = hy + 2.4 + Math.sin(q) * 4.2; poly(g, [x, y, x - Math.cos(q) * 2.4 + Math.sin(q) * 0.8, y - Math.sin(q) * 2 - Math.cos(q) * 0.8, x - Math.cos(q) * 2.4 - Math.sin(q) * 0.8, y - Math.sin(q) * 2 + Math.cos(q) * 0.8]); }, m('#f0e6cc'), { sd: 0, hl: 0, ln: 0.4 }); }
  dot(g, hx - 6, hy - 3, 1, css(d));
}
function toadP(g, pose, step) {
  var a = m('#6a8a3a'), d = m('#3e5a24'), b = m('#c8c870'), pa = pA(pose), sq = pose === 'atk' ? 0.94 : 1;
  g.save(); g.translate(32, 61); g.scale(2 - sq, sq); g.translate(-32, -61);
  [[16, 1], [46, 2]].forEach(function (L) { part(g, el(L[0], 58 - (step === L[1] ? 1.2 : 0), 7, 4), d, { sd: 1.2 }); });
  part(g, function (g) { blob(g, [9, 52, 12, 38, 24, 30, 40, 30, 52, 38, 56, 52, 48, 60, 16, 60]); }, a, { sd: 4.6, gl: function (g) { E(g, 20, 37, 4, 1.6, -0.4); } });
  part(g, function (g) { blob(g, [20, 52, 32, 47, 44, 52, 40, 58, 24, 58]); }, b, { sd: 1, hl: 0 });
  [[20, 42], [28, 36], [44, 40], [38, 46], [15, 48], [49, 47]].forEach(function (p) { part(g, circ(p[0], p[1], 1.8), lt(a, 0.15), { sd: 0.5, hl: 0, ln: 0.5 }); dot(g, p[0], p[1], 0.7, css(m('#b6ff5a'), 0.9)); });
  part(g, circ(25, 31, 5), a, { sd: 1.4 }); part(g, circ(39, 31, 5), a, { sd: 1.4 });
  eye(g, 25.6, 30.6, 2.6, '#ffd24a', true); eye(g, 39.6, 30.6, 2.6, '#ffd24a', true);
  if (pa > 0) part(g, function (g) { g.moveTo(22, 44); g.quadraticCurveTo(32, 50, 42, 44); g.quadraticCurveTo(32, 46, 22, 44); g.closePath(); }, '#7a2a3a', { sd: 0, hl: 0 });
  else curve(g, 20, 43, 32, 47.4, 44, 43, css(ink(a)), 0.9);
  for (var i = 0; i < 3; i++) dot(g, 26 + i * 6, 26 - (i & 1) * 3, 1.1, 'rgba(182,255,90,.55)');
  g.restore();
}
function wispP(g, pose) {
  var c = m('#9fd8f0'), w = m('#e8fbff'), d = m('#4a8ab8'), pa = pA(pose);
  dot(g, 32, 36, 20, 'rgba(160,220,255,.16)');
  part(g, function (g) { g.moveTo(32, 60); g.quadraticCurveTo(16, 54, 17, 40); g.quadraticCurveTo(18, 26, 26, 18); g.quadraticCurveTo(25, 26, 29, 27); g.quadraticCurveTo(30, 14, 37, 6); g.quadraticCurveTo(36, 18, 41, 22); g.quadraticCurveTo(44, 16, 45, 12); g.quadraticCurveTo(50, 26, 48, 40); g.quadraticCurveTo(48, 54, 32, 60); g.closePath(); }, c, { sd: 4, hl: 1 });
  part(g, function (g) { blob(g, [32, 56, 23, 49, 25, 38, 32, 33, 39, 38, 41, 49]); }, w, { sd: 1.4, hl: 0 });
  eye(g, 29, 43, 1.8, '#2a4a7a', false); eye(g, 36.4, 43, 1.8, '#2a4a7a', false);
  curve(g, 29, 49, 32.6, 51 + pa, 36, 49, css(d), 0.8);
  [[14, 26], [52, 30], [20, 14], [50, 52], [12, 50]].forEach(function (p, i) { part(g, function (g) { poly(g, [p[0], p[1] - 2.4, p[0] + 1, p[1], p[0], p[1] + 2.4, p[0] - 1, p[1]]); }, i & 1 ? w : c, { sd: 0, hl: 0, ln: 0.4 }); });
}
function hellhoundP(g, pose, step) {
  KT.quad(g, { a: '#4a2a2e', A: '#2a161c', b: '#8a3a2a', x: '#ff9a3c' }, {}, pose, step);
  var pa = pA(pose), hx = 50 + pa * 2, hy = 30 - pa;
  for (var i = 0; i < 5; i++) part(g, function (g) { var x = 16 + i * 6, y = 33 - (i % 2) * 2; g.moveTo(x - 2.6, y + 3); g.quadraticCurveTo(x - 2, y - 5, x + 1, y - 10 - (i % 2) * 3); g.quadraticCurveTo(x + 3, y - 4, x + 3, y + 3); g.closePath(); }, m(i % 2 ? '#ffb347' : '#e0603a'), { sd: 0.8, hl: 0 });      // 등의 불갈기
  part(g, function (g) { poly(g, [hx - 4, hy - 6, hx - 7, hy - 13, hx - 1, hy - 7.6]); }, m('#2a2030'), { sd: 0.6 });
  dot(g, hx + 13, hy + 2, pa > 0 ? 2.4 : 1.2, css(m('#ff9a3c'), 0.8));
}
// 사람형: 새 그림의 사람 몸에 덧그림
var MON5 = {
  boomer: { draw16: boomerP },
  bigSlime: { draw16: bigSlimeP },
  sandworm: { draw16: function (g, p, s) { wormP(g, p, s); } },
  toad: { draw16: toadP },
  frostWisp: { draw16: wispP },
  hellhound: { draw16: hellhoundP },
  gobShaman: { draw16: humD({ head: 'goblin', body: 'robe', items: ['sstaff', 'beads'], pal: { a: '#6a4a8a', A: '#46305e', s: '#7aa860', S: '#4a7a40', b: '#c8a040', c: '#b6ff5a' }, cls: 'mon', tier: 3, sx: 'm' },
    function (g) { part(g, function (g) { g.moveTo(24, 12); g.quadraticCurveTo(18, 2, 20, -2); g.quadraticCurveTo(24, 4, 27, 11); g.closePath(); }, m('#e0525e'), { sd: 0.6 }); part(g, function (g) { g.moveTo(27, 11); g.quadraticCurveTo(26, 1, 30, -3); g.quadraticCurveTo(30, 5, 30, 11); g.closePath(); }, m('#f6cf57'), { sd: 0.6 }); }) },
  skelGuard: { draw16: humD({ head: 'skull', body: 'bones', items: ['sword', 'shield'], pal: { l: '#d8d0bc', L: '#a09a88', u: '#6a5a4a', U: '#463a2e', m: '#8a8e9a', M: '#5e6274' }, cls: 'inf', tier: 3, sx: 'm' },
    function (g) { dot(g, 35, 24.6, 1.2, css(m('#7fe3ff'))); dot(g, 40.6, 24.4, 1.1, css(m('#7fe3ff'))); }) },
  shade: { draw16: humD({ head: 'darkhood', body: 'robe', items: ['kunai', 'scarf'], pal: { a: '#2a2438', A: '#16121e', x: '#ff4d6d', z: '#0e0b14', q: '#5a2a4a' }, cls: 'sha', tier: 4, sx: 'm', faded: true },
    function (g) { for (var i = 0; i < 4; i++) dot(g, 12 + i * 4, 30 + i * 6, 2.2 - i * 0.3, 'rgba(40,30,60,' + (0.5 - i * 0.1) + ')'); }) },
  stormcaller: { draw16: humD({ head: 'hood', body: 'robe', items: ['staff', 'cape'], pal: { a: '#2f6a8a', A: '#1f4a66', q: '#4fb6d9', b: '#d6fbff', c: '#d6fbff', h: '#1a3a4a' }, cls: 'mag', tier: 4, sx: 'f' },
    function (g, pose) { var pa = pose === 'cast' || pose === 'atk' ? 1 : 0; line(g, [44, 18, 47, 12, 45, 9, 49, 3], css(m('#fff0a0'), 0.6 + pa * 0.4), 1.1); line(g, [44, 18, 47, 12, 45, 9, 49, 3], css(m('#ffffff')), 0.4); dot(g, 49, 3, 1.6 + pa, 'rgba(255,240,160,.5)'); }) },
  banshee: { draw16: function (g, p) { KT.specter(g, { a: '#d8dcec', A: '#9aa2c0', x: '#7a2a4a', z: '#3a2a4a' }, p); part(g, function (g) { g.moveTo(16, 20); g.quadraticCurveTo(8, 34, 10, 52); g.quadraticCurveTo(14, 42, 18, 36); g.quadraticCurveTo(16, 28, 20, 22); g.closePath(); }, m('#b8b0d0'), { sd: 1.4 }); part(g, el(34, 28.6, 2.4, p === 'cast' || p === 'atk' ? 3.4 : 1.6), '#2a1a2a', { sd: 0, hl: 0, ln: 0.5 }); } },
  cultist: { draw16: humD({ head: 'darkhood', body: 'robe', items: ['sstaff'], pal: { a: '#6a1e1e', A: '#3e1010', x: '#ffb347', z: '#1a0e0e', b: '#ff9a3c' }, cls: 'sha', tier: 4, sx: 'm' },
    function (g, pose) { [[44, 14], [47, 9], [43, 6]].forEach(function (q, i) { dot(g, q[0], q[1], 1.6 - i * 0.3 + (pose === 'cast' ? 0.6 : 0), css(m(i ? '#ff9a3c' : '#ffd24a'), 0.85)); }); }) }
};
// 화면이 픽셀 그림으로 바뀌어도(설정 밖 · 시험) 비슷한 옛 몸으로 보이게
var PX_ALIAS = { boomer: 'imp', bigSlime: 'slime', gobShaman: 'darkMage', skelGuard: 'skeleton', sandworm: 'scorpion', shade: 'darkMage', stormcaller: 'darkMage', toad: 'slime', frostWisp: 'ghost', banshee: 'ghost', cultist: 'darkPriest', hellhound: 'wolf' };
if (DS.SPR) for (var pk in PX_ALIAS) if (!DS.SPR[pk] && DS.SPR[PX_ALIAS[pk]]) DS.SPR[pk] = DS.SPR[PX_ALIAS[pk]];

// ═════════ 큰 보스 ═════════
// 큰 그림의 표: k → { draw(g, W, H, pose, step), side(양옆 px), up(머리 위 px), olw(윤곽 굵기) }
//   W × H 는 단위 상자(논리 1px = 4 단위). 몸이 차지하는 칸은 (side*4, up*4) 에서 (W - side*4, H - 8).
function fit(fn, s, dx, dy) {      // 64 단위 상자에 그린 옛 몸을 큰 상자 바닥 가운데에 s 배로
  return function (g, W, H, pose, step) { g.save(); g.translate(W / 2 + (dx || 0), H - 8 + (dy || 0)); g.scale(s, s); g.translate(-32, -61.5); fn(g, pose, step); g.restore(); };
}
function both(a, b) { return function (g, W, H, pose, step) { a(g, W, H, pose, step); b(g, W, H, pose, step); }; }
function bossFn(k) { var B = BOSS[k]; if (!B) return null; if (B.draw) return B.draw; if (B.kind === 'human') return humD(B.S); return null; }
// ── 덧그림 (큰 몸에만) ──
function embers(cols, n, y0) { return function (g, W, H) { for (var i = 0; i < n; i++) { var x = W * (0.18 + 0.64 * ((i * 0.618) % 1)), y = (y0 || H * 0.3) + ((i * 37) % 40); dot(g, x, y, 1.6 + (i % 3) * 0.6, css(m(cols[i % cols.length]), 0.75)); } }; }
function runes(col) { return function (g, W, H) { var cx = W / 2, cy = H * 0.62; for (var i = 0; i < 6; i++) { var a = i / 6 * 6.2832; line(g, [cx + Math.cos(a) * 18, cy + Math.sin(a) * 9, cx + Math.cos(a) * 24, cy + Math.sin(a) * 12], css(m(col), 0.7), 1.4); } }; }
function crown(x, y, s, col, gem) { return function (g) { g.save(); g.translate(x, y); g.scale(s, s); part(g, function (g) { poly(g, [-9, 4, -10, -6, -5, -1, 0, -9, 5, -1, 10, -6, 9, 4]); }, m(col || '#d8b450'), { sd: 1, gl: function (g) { E(g, -4, -1, 1.2, 0.8); } }); dot(g, 0, -1.6, 1.6, css(m(gem || '#e0525e'))); g.restore(); }; }

// ── 긴 용 (4×2): 몸통 · 긴 꼬리 · 목과 머리 · 두 날개 · 네 다리 ──
function longWyrm(K) {
  return function (g, W, H, pose, step) {
    var a = m(K.a), d = m(K.A), b = m(K.b || '#d9c88a'), wc = m(K.w || K.A), x0 = 24, gy = H - 8, fw = W - 48, pa = pA(pose), cast = pose === 'cast';
    var bx = x0 + fw * 0.46, by = gy - 46, hx = x0 + fw * 0.84 + pa * 8, hy = gy - 92 - pa * 4 + (pose === 'hit' ? 6 : 0);
    // 뒷날개
    g.save(); g.translate(bx + 10, by - 26); g.scale(cast ? 3.4 : 3.1, cast ? 3.4 : 3.0); g.rotate(-0.25); B3.membrane(g, sh1(wc), 0, 0, 1, true); g.restore();
    // 꼬리: 몸통 왼쪽에서 땅을 쓸며 왼쪽 끝으로, 끝이 말려 오른다
    part(g, function (g) { g.moveTo(bx - 40, by - 8); g.quadraticCurveTo(x0 + 40, gy - 50, x0 + 16, gy - 18); g.quadraticCurveTo(x0 + 2, gy - 6, x0 - 4, gy - 30); g.quadraticCurveTo(x0 + 10, gy - 16, x0 + 26, gy - 26); g.quadraticCurveTo(x0 + 52, gy - 28, bx - 30, by + 18); g.closePath(); }, a, { sd: 4 });
    part(g, function (g) { poly(g, [x0 - 4, gy - 30, x0 - 18, gy - 44, x0 - 2, gy - 40, x0 + 2, gy - 52]); }, d, { sd: 1.6 });      // 꼬리 끝 가시
    for (var i = 0; i < 6; i++) part(g, function (g) { var t = i / 6, x = bx - 36 - t * (bx - x0 - 30), y = by - 10 + t * 20 - Math.sin(t * 3) * 8; poly(g, [x - 4, y + 2, x, y - 8, x + 4, y + 2]); }, d, { sd: 0.6, hl: 0 });
    // 뒷다리 둘
    [[bx - 26, step === 1 ? 4 : 0], [bx + 24, step === 2 ? 4 : 0]].forEach(function (L) { part(g, cap(L[0], by + 10, L[0] - 4, gy - 4 - L[1], 8), sh1(a), { sd: 2 }); part(g, el(L[0] - 2, gy - 2 - L[1], 11, 4.4), d, { sd: 1 }); });
    // 몸통
    part(g, function (g) { blob(g, [bx - 58, by + 6, bx - 46, by - 24, bx - 10, by - 36, bx + 34, by - 32, bx + 56, by - 14, bx + 54, by + 18, bx + 20, by + 32, bx - 34, by + 30]); }, a, { sd: 7, gl: function (g) { E(g, bx - 22, by - 20, 12, 4, -0.15); } });
    part(g, function (g) { blob(g, [bx - 40, by + 20, bx - 6, by + 12, bx + 40, by + 12, bx + 46, by + 24, bx + 10, by + 32, bx - 30, by + 30]); }, b, { sd: 2, hl: 0 });
    for (i = 0; i < 6; i++) line(g, [bx - 30 + i * 13, by + 15, bx - 28 + i * 13, by + 29], css(sh1(b)), 1);
    if (K.bone) { for (i = 0; i < 6; i++) curve(g, bx - 34 + i * 12, by - 22, bx - 30 + i * 12, by, bx - 32 + i * 12, by + 20, css(lt(a, 0.3)), 3); dot(g, bx + 4, by - 2, 10, css(m(K.x), 0.3)); dot(g, bx + 4, by - 2, 4, css(m(K.x))); }
    if (K.ice) for (i = 0; i < 5; i++) part(g, function (g) { var x = bx - 40 + i * 18, y = by - 30 + Math.abs(i - 2) * 4; poly(g, [x - 5, y + 6, x, y - 14 - (i % 2) * 6, x + 5, y + 6]); }, m('#d8f2ff'), { sd: 1.4 });
    if (K.lava) [[bx - 34, by - 12, bx - 20, by + 4, bx - 26, by + 18], [bx + 6, by - 20, bx + 16, by - 4, bx + 8, by + 10], [bx + 30, by - 10, bx + 40, by + 6]].forEach(function (l) { line(g, l, css(m('#ffb347')), 3.4); line(g, l, css(m('#fff0a0')), 1.2); });
    if (K.ash) for (i = 0; i < 7; i++) dot(g, bx - 40 + i * 14, by - 12 + (i % 3) * 10, 2.2, css(m('#5a5248'), 0.7));
    // 앞다리 둘
    [[bx - 16, step === 2 ? 4 : 0], [bx + 36, step === 1 ? 4 : 0]].forEach(function (L) { part(g, cap(L[0], by + 14, L[0] + 2, gy - 4 - L[1], 8.6), a, { sd: 2.4 }); part(g, el(L[0] + 4, gy - 2 - L[1], 12, 4.6), d, { sd: 1 }); for (var c = 0; c < 3; c++) part(g, function (g) { var x = L[0] + 10 + c * 4; poly(g, [x, gy - 4 - L[1], x + 4, gy - L[1], x, gy - L[1]]); }, m('#f0e6cc'), { sd: 0, hl: 0, ln: 0.5 }); });
    // 목 · 머리
    part(g, function (g) { g.moveTo(bx + 30, by - 20); g.quadraticCurveTo(bx + 54, by - 70, hx - 18, hy + 10); g.lineTo(hx - 2, hy + 24); g.quadraticCurveTo(bx + 70, by - 40, bx + 54, by + 4); g.closePath(); }, a, { sd: 5 });
    for (i = 0; i < 4; i++) curve(g, bx + 36 + i * 6, by - 18 - i * 14, bx + 46 + i * 6, by - 22 - i * 14, bx + 52 + i * 5, by - 14 - i * 14, css(b), 1.6);
    part(g, function (g) { blob(g, [hx - 22, hy + 6, hx - 14, hy - 14, hx + 6, hy - 16, hx + 30, hy - 2, hx + 34, hy + 10, hx + 16, hy + 20, hx - 10, hy + 20]); }, a, { sd: 4.4, hl: 1.4 });
    var mo = pa > 0 || cast;
    if (mo) { part(g, function (g) { g.moveTo(hx + 4, hy + 10); g.lineTo(hx + 34, hy + 12); g.lineTo(hx + 26, hy + 30); g.lineTo(hx - 2, hy + 22); g.closePath(); }, sh1(a), { sd: 1.6 }); dot(g, hx + 40, hy + 16, cast ? 12 : 8, css(m(K.breath || '#ff9a3c'), 0.55)); dot(g, hx + 38, hy + 16, cast ? 6 : 4, css(lt(m(K.breath || '#ff9a3c'), 0.4))); for (var tq = 0; tq < 4; tq++) part(g, function (g) { var x = hx + 8 + tq * 6; poly(g, [x, hy + 12, x + 2, hy + 18, x + 4, hy + 12]); }, m('#f0e6cc'), { sd: 0, hl: 0, ln: 0.5 }); }
    else line(g, [hx + 6, hy + 10, hx + 32, hy + 8], css(ink(a)), 1.4);
    var hc = m(K.horn || '#e2d6bc');
    part(g, function (g) { g.moveTo(hx - 8, hy - 8); g.quadraticCurveTo(hx - 28, hy - 26, hx - 46, hy - 24); g.quadraticCurveTo(hx - 28, hy - 14, hx - 14, hy + 2); g.closePath(); }, hc, { sd: 1.6 });
    part(g, function (g) { g.moveTo(hx + 2, hy - 12); g.quadraticCurveTo(hx - 6, hy - 34, hx - 20, hy - 44); g.quadraticCurveTo(hx - 8, hy - 28, hx - 6, hy - 8); g.closePath(); }, hc, { sd: 1.6 });
    if (K.bone) { dot(g, hx + 8, hy - 2, 6, '#1e1824'); dot(g, hx + 8, hy - 2, 2.6, css(m(K.x))); } else eye(g, hx + 8, hy - 3, 3.4, K.x || '#ffd24a', true);
    // 앞날개
    g.save(); g.translate(bx + 22, by - 22); g.scale(cast ? 3.6 : 3.2, cast ? 3.6 : 3.1); g.rotate(-0.1); B3.membrane(g, wc, 0, 0, 1, false); g.restore();
  };
}
// ── 긴 뱀 · 지렁이 (4×2): 땅을 가르는 혹 셋과 솟아오른 머리 ──
function longSerpent(K) {
  return function (g, W, H, pose) {
    var a = m(K.a), d = m(K.A), b = m(K.b || '#d0c870'), x0 = 24, gy = H - 8, fw = W - 48, pa = pA(pose), cast = pose === 'cast', worm = !!K.worm, i;
    var hx = x0 + fw * 0.82 + pa * 10, hy = gy - 100 - pa * 6 + (pose === 'hit' ? 8 : 0);
    if (worm) { part(g, function (g) { blob(g, [x0 - 6, gy, x0 + 20, gy - 18, x0 + fw * 0.5, gy - 24, x0 + fw - 10, gy - 18, x0 + fw + 8, gy, x0 + fw * 0.5, gy + 4]); }, m(K.s || '#8a7a5a'), { sd: 3, hl: 0 }); for (i = 0; i < 8; i++) dot(g, x0 + 10 + i * fw / 8, gy - 6 - (i % 2) * 6, 3, css(m('#5a4a36'), 0.8)); }
    // 혹 (땅 위로 솟은 몸 둘레) — 왼쪽에서 오른쪽으로 작아졌다 커진다
    [[0.12, 22], [0.34, 34], [0.56, 30]].forEach(function (q, j) {
      var cx = x0 + fw * q[0], r = q[1];
      part(g, function (g) { g.moveTo(cx - r * 1.3, gy - 4); g.quadraticCurveTo(cx - r * 1.2, gy - r * 2.2, cx, gy - r * 2.3); g.quadraticCurveTo(cx + r * 1.2, gy - r * 2.2, cx + r * 1.3, gy - 4); g.lineTo(cx + r * 0.7, gy - 4); g.quadraticCurveTo(cx + r * 0.6, gy - r * 1.4, cx, gy - r * 1.4); g.quadraticCurveTo(cx - r * 0.6, gy - r * 1.4, cx - r * 0.7, gy - 4); g.closePath(); }, j % 2 ? a : sh1(a), { sd: 5 });
      for (var s = 0; s < 4; s++) curve(g, cx - r * 1.05 + s * r * 0.5, gy - r * 1.7 - (s === 1 || s === 2 ? r * 0.35 : 0), cx - r * 0.9 + s * r * 0.5, gy - r * 2.0, cx - r * 0.75 + s * r * 0.5, gy - r * 1.7, css(sh1(a)), 1.2);
      if (!worm) for (s = 0; s < 3; s++) part(g, function (g) { var x = cx - r * 0.5 + s * r * 0.5; poly(g, [x - 4, gy - r * 2.2, x, gy - r * 2.2 - 12, x + 4, gy - r * 2.2]); }, m(K.fin || '#c0303a'), { sd: 0.8, hl: 0 });
    });
    // 목과 머리
    var nx = x0 + fw * 0.74;
    part(g, function (g) { g.moveTo(nx - 22, gy - 4); g.quadraticCurveTo(nx - 26, hy + 50, hx - 16, hy + 14); g.lineTo(hx + 10, hy + 20); g.quadraticCurveTo(nx + 10, hy + 54, nx + 20, gy - 4); g.closePath(); }, a, { sd: 5 });
    part(g, function (g) { g.moveTo(nx - 8, gy - 4); g.quadraticCurveTo(nx - 12, hy + 56, hx - 4, hy + 22); g.lineTo(hx + 4, hy + 24); g.quadraticCurveTo(nx + 2, hy + 58, nx + 8, gy - 4); g.closePath(); }, b, { sd: 1.6, hl: 0 });
    for (i = 0; i < 6; i++) line(g, [nx - 10 + i * 0.6, gy - 14 - i * 14, nx + 8 - i * 0.8, gy - 16 - i * 14], css(sh1(b)), 1);
    if (worm) {
      part(g, el(hx, hy + 6, 24, 20), a, { sd: 4 });
      var mr = cast || pa > 0 ? 1.25 : 1;
      part(g, el(hx + 4, hy + 8, 15 * mr, 12 * mr), m('#5a2030'), { sd: 2, hl: 0 });
      for (i = 0; i < 12; i++) { var q2 = i / 12 * 6.2832; part(g, function (g) { var x = hx + 4 + Math.cos(q2) * 13 * mr, y = hy + 8 + Math.sin(q2) * 10 * mr; poly(g, [x, y, x - Math.cos(q2) * 6 + Math.sin(q2) * 2, y - Math.sin(q2) * 5 - Math.cos(q2) * 2, x - Math.cos(q2) * 6 - Math.sin(q2) * 2, y - Math.sin(q2) * 5 + Math.cos(q2) * 2]); }, m('#f0e6cc'), { sd: 0, hl: 0, ln: 0.6 }); }
      if (cast) dot(g, hx + 4, hy + 8, 9, css(m(K.x || '#b6ff5a'), 0.45));
      return;
    }
    if (K.hood) { part(g, function (g) { blob(g, [hx - 30, hy + 14, hx - 24, hy - 14, hx, hy - 8, hx + 24, hy - 14, hx + 30, hy + 14, hx + 12, hy + 34, hx - 12, hy + 34]); }, a, { sd: 4 }); part(g, el(hx, hy + 14, 12, 11), b, { sd: 1.4, hl: 0 }); }
    part(g, function (g) { blob(g, [hx - 18, hy + 6, hx - 12, hy - 12, hx + 12, hy - 14, hx + 30, hy - 2, hx + 36, hy + 8, hx + 18, hy + 16, hx - 8, hy + 18]); }, a, { sd: 4, hl: 1.6 });
    eye(g, hx + 8, hy - 4, 3.6, K.x || '#ff4d6d', true);
    if (pa > 0 || cast) { part(g, function (g) { g.moveTo(hx + 10, hy + 8); g.lineTo(hx + 38, hy + 8); g.lineTo(hx + 30, hy + 26); g.lineTo(hx + 6, hy + 18); g.closePath(); }, '#5a2030', { sd: 0, hl: 0 }); part(g, function (g) { poly(g, [hx + 16, hy + 9, hx + 18, hy + 18, hx + 20, hy + 9]); poly(g, [hx + 28, hy + 9, hx + 29, hy + 16, hx + 31, hy + 9]); }, m('#f0e6cc'), { sd: 0, hl: 0, ln: 0.5 }); dot(g, hx + 44, hy + 14, cast ? 10 : 6, css(m(K.breath || '#b6ff5a'), 0.5)); }
    else { line(g, [hx + 10, hy + 8, hx + 34, hy + 6], css(ink(a)), 1.4); line(g, [hx + 36, hy + 6, hx + 44, hy + 8, hx + 48, hy + 4, hx + 44, hy + 8, hx + 48, hy + 12], css(m('#c0303a')), 1.2); }
    if (K.horn) { part(g, function (g) { g.moveTo(hx - 6, hy - 10); g.quadraticCurveTo(hx - 20, hy - 30, hx - 32, hy - 30); g.quadraticCurveTo(hx - 18, hy - 20, hx - 12, hy - 2); g.closePath(); }, m(K.horn), { sd: 1.4 }); }
  };
}
// ── 어스름의 왕 (2×4): 지워진 이름들이 쌓여 선 거대한 그림자 — 흐린 얼굴 여럿 · 이름 패 왕관 · 검은 실 · 비취빛 숨 ──
function tallDusk(g, W, H, pose) {
  var a = m('#1e2a30'), d = m('#0e161a'), j = m('#7dffb0'), r = m('#ff4d6d'), pa = pA(pose), cast = pose === 'cast', x0 = 24, gy = H - 8, fw = W - 48, cx = W / 2, top = 40, i;
  dot(g, cx, gy - 120, 70, 'rgba(110,220,170,.08)'); dot(g, cx, gy - 120, 52, 'rgba(110,220,170,.09)');
  // 검은 실 (땅으로 흘러내린다)
  for (i = 0; i < 9; i++) curve(g, x0 + 6 + i * fw / 8, gy, x0 + i * fw / 8 + (i % 2 ? 10 : -8), gy - 60, cx + (i - 4) * 6, gy - 150, css(d), 1.4);
  // 옷자락 · 몸
  part(g, function (g) { g.moveTo(x0 - 10, gy); g.quadraticCurveTo(x0 - 2, gy - 120, x0 + 14, gy - 180); g.quadraticCurveTo(x0 + 22, top + 34, cx, top + 24); g.quadraticCurveTo(x0 + fw - 22, top + 34, x0 + fw - 14, gy - 180); g.quadraticCurveTo(x0 + fw + 2, gy - 120, x0 + fw + 10, gy);
    for (var k = 0; k <= 8; k++) g.lineTo(x0 + fw + 10 - k * (fw + 20) / 8, gy - (k % 2 ? 14 : 0)); g.closePath(); }, a, { sd: 8, hl: 1.6 });
  // 흐린 얼굴들 (지워진 이름들)
  var F = [[0.3, 0.78, 9], [0.62, 0.84, 8], [0.45, 0.66, 10], [0.74, 0.62, 7], [0.24, 0.55, 8], [0.56, 0.5, 9], [0.36, 0.4, 7], [0.7, 0.42, 6], [0.5, 0.9, 7], [0.2, 0.9, 6], [0.8, 0.78, 7]];
  F.forEach(function (f, k) { var fx = x0 + fw * f[0], fy = gy - (gy - top) * (1 - f[1]) - 10, rr = f[2]; g.beginPath(); E(g, fx, fy, rr, rr * 1.25); g.fillStyle = css(mix(j, [200, 214, 210], 0.6), 0.14 + (k % 3) * 0.05); g.fill(); dot(g, fx - rr * 0.35, fy - 1, 1.2, css(j, 0.55)); dot(g, fx + rr * 0.35, fy - 1, 1.2, css(j, 0.55)); curve(g, fx - rr * 0.3, fy + rr * 0.45, fx, fy + rr * 0.6, fx + rr * 0.3, fy + rr * 0.45, css(j, 0.3), 0.8); });
  // 팔 (양쪽에서 펼친다 — 시전하면 높이 든다)
  [-1, 1].forEach(function (s) {
    var sx = cx + s * fw * 0.36, sy = top + 70, ex = cx + s * (fw * 0.62 + (cast ? 6 : 0)), ey = cast ? top + 20 : top + 112 - (s > 0 ? pa * 30 : 0);
    part(g, cap(sx, sy, ex, ey, 9), s > 0 ? a : sh1(a), { sd: 3 });
    part(g, function (g) { blob(g, [ex - 10, ey - 4, ex - 4, ey - 12, ex + 6, ey - 10, ex + 10, ey + 2, ex + 2, ey + 12, ex - 8, ey + 8]); }, d, { sd: 2 });
    for (var q = 0; q < 4; q++) line(g, [ex - 6 + q * 4, ey + 8, ex - 8 + q * 4 + s * 2, ey + 20], css(d), 1.6);
    if (cast) { dot(g, ex, ey, 16, css(j, 0.22)); dot(g, ex, ey, 6, css(lt(j, 0.3), 0.85)); }
  });
  // 머리 (두건 속의 붉은 눈 둘)
  var hx = cx + pa * 8, hy = top + 36 - pa * 4;
  part(g, function (g) { blob(g, [hx - 26, hy + 10, hx - 22, hy - 16, hx, hy - 26, hx + 22, hy - 16, hx + 26, hy + 10, hx + 12, hy + 26, hx - 12, hy + 26]); }, d, { sd: 2, hl: 0 });
  eye(g, hx - 8, hy + 2, 3.6, '#ff4d6d', true); eye(g, hx + 8, hy + 2, 3.6, '#ff4d6d', true);
  // 이름 패 왕관 (긁힌 글자)
  for (var p = 0; p < 7; p++) (function (p) { var px = hx - 27 + p * 9, py = hy - 30 - (p === 3 ? 10 : Math.abs(p - 3) < 2 ? 6 : 2); g.save(); g.translate(px, py); g.rotate((p - 3) * 0.14);
    part(g, function (g) { RR(g, -3.6, -7, 7.2, 14, 1); }, m('#b8b09a'), { sd: 1.4, hl: 0.6, ln: 1 });
    line(g, [-2, -3.6, 2, -3.6], css(m('#5a5040')), 0.8); line(g, [-2, 0, 1.6, 0], css(m('#5a5040')), 0.8); line(g, [-2.8, 4, 2.8, -4.6], css(m('#3a2a2a')), 1);
    g.restore(); })(p);
  dot(g, hx, hy - 50, 6, css(j, 0.35)); dot(g, hx, hy - 50, 2.4, css(lt(j, 0.4)));
  if (cast) for (i = 0; i < 10; i++) dot(g, x0 + (i * 0.618 % 1) * fw, top + 20 + (i * 53 % 200), 2.4, css(r, 0.5));
}
// ── 갱도 거신 (2×4): 갱도 기둥처럼 선 돌 거인 — 등불 눈 · 박힌 광석 · 쇠사슬 ──
function tallTitan(g, W, H, pose, step) {
  var c = m('#6e665a'), d = m('#4a443a'), x = m('#7fe3ff'), o = m('#ffd24a'), pa = pA(pose), cast = pose === 'cast', x0 = 24, gy = H - 8, fw = W - 48, cx = W / 2, top = 36, i;
  // 다리 둘
  [[cx - 22, step === 1 ? 4 : 0], [cx + 22, step === 2 ? 4 : 0]].forEach(function (L) { part(g, function (g) { blob(g, [L[0] - 16, gy - 70 - L[1], L[0] + 16, gy - 72 - L[1], L[0] + 18, gy - 2 - L[1], L[0] - 18, gy - 2 - L[1]]); }, d, { sd: 4 }); line(g, [L[0] - 10, gy - 50, L[0] + 6, gy - 40], css(sh2(d)), 1.2); });
  // 몸통 (갱도 버팀목 같은 각진 몸)
  part(g, function (g) { blob(g, [cx - 52, gy - 150, cx - 44, gy - 200, cx, gy - 214, cx + 44, gy - 200, cx + 54, gy - 150, cx + 46, gy - 80, cx, gy - 66, cx - 46, gy - 80]); }, c, { sd: 8, gl: function (g) { E(g, cx - 26, gy - 190, 10, 4, -0.4); } });
  [[cx - 30, gy - 170, cx - 12, gy - 150, cx - 22, gy - 120], [cx + 10, gy - 190, cx + 26, gy - 160], [cx + 20, gy - 120, cx + 36, gy - 100]].forEach(function (l) { line(g, l, css(sh2(c)), 1.4); });
  [[cx - 20, gy - 130], [cx + 28, gy - 170], [cx - 34, gy - 180], [cx + 14, gy - 100], [cx - 8, gy - 186]].forEach(function (q, k) { part(g, function (g) { poly(g, [q[0], q[1] - 6, q[0] + 4, q[1], q[0], q[1] + 6, q[0] - 4, q[1]]); }, k % 2 ? o : x, { sd: 0.6, hl: 0.5, ln: 0.8 }); dot(g, q[0], q[1], 5, css(k % 2 ? o : x, 0.22)); });      // 박힌 광석
  // 가슴의 등불
  dot(g, cx, gy - 150, cast ? 22 : 14, css(o, 0.25)); part(g, circ(cx, gy - 150, 7), o, { sd: 1, gl: function (g) { E(g, cx - 2, gy - 153, 2, 1.4); } });
  // 팔 (공격하면 오른팔을 내려친다)
  [-1, 1].forEach(function (s) {
    var sx = cx + s * 50, sy = gy - 190, hit = s > 0 && pa > 0, ex = cx + s * (fw * 0.6) + (hit ? 6 : 0), ey = hit ? gy - 60 : cast ? gy - 230 : gy - 100;
    part(g, cap(sx, sy, ex, ey, 14), s > 0 ? c : sh1(c), { sd: 4 });
    part(g, function (g) { blob(g, [ex - 18, ey - 8, ex - 6, ey - 18, ex + 12, ey - 14, ex + 18, ey + 4, ex + 6, ey + 18, ex - 14, ey + 14]); }, d, { sd: 3 });
    if (s < 0) for (var q = 0; q < 5; q++) part(g, circ(ex - 4 + q * 3, ey + 22 + q * 9, 3.4), m('#8a8e9a'), { sd: 0.8, hl: 0.6, ln: 0.8 });      // 쇠사슬
  });
  // 머리 (작고 각진 · 등불 눈)
  var hx = cx + pa * 6, hy = top + 18 - pa * 2;
  part(g, function (g) { blob(g, [hx - 22, hy + 8, hx - 18, hy - 14, hx, hy - 20, hx + 18, hy - 14, hx + 22, hy + 8, hx + 10, hy + 18, hx - 10, hy + 18]); }, c, { sd: 3 });
  part(g, function (g) { RR(g, hx - 16, hy - 2, 32, 7, 2); }, m('#2a2420'), { sd: 0, hl: 0 });
  eye(g, hx - 7, hy + 1.5, 3, '#7fe3ff', true); eye(g, hx + 7, hy + 1.5, 3, '#7fe3ff', true);
  part(g, function (g) { poly(g, [hx - 12, hy - 14, hx - 8, hy - 30, hx - 2, hy - 18]); poly(g, [hx + 12, hy - 14, hx + 8, hy - 30, hx + 2, hy - 18]); }, d, { sd: 1 });
  if (cast) for (i = 0; i < 8; i++) dot(g, x0 + (i * 0.618 % 1) * fw, gy - 20 - (i * 41 % 200), 3, css(x, 0.4));
}
var BIGART = {
  // 이야기 보스
  bargan: { draw: both(fit(bossFn('bargan'), 2.15), embers(['#ffb347', '#ff6a2a', '#fff0a0'], 9)), side: 6, up: 20 },
  tormak: { draw: fit(bossFn('tormak'), 1.8), side: 9, up: 16 },
  twinsnake: { draw: fit(bossFn('twinsnake'), 2.05, 0, 2), side: 4, up: 22 },
  warden: { draw: both(fit(bossFn('warden'), 2.15), runes('#7fe3ff')), side: 6, up: 18 },
  shara: { draw: fit(bossFn('shara'), 2.2, 4), side: 6, up: 16 },
  king: { draw: both(fit(bossFn('king'), 1.75), function (g, W, H) { dot(g, W * 0.66, H * 0.36, 10, 'rgba(127,227,255,.2)'); }), side: 9, up: 14 },
  gatekeeper: { draw: both(fit(bossFn('gatekeeper'), 2.15), embers(['#ff4d6d', '#c9a227'], 6)), side: 6, up: 18 },
  swarm: { draw: fit(bossFn('swarm'), 2.15, 0, -6), side: 6, up: 22 },
  bonewyrm: { draw: longWyrm({ a: '#d8d0bc', A: '#a39a84', b: '#8a8070', w: '#5a5072', x: '#b6ff5a', breath: '#b6ff5a', bone: 1 }), side: 6, up: 24 },
  glacia: { draw: longWyrm({ a: '#7ab0d0', A: '#4a7aa0', b: '#e0f0f8', w: '#5a8ab0', x: '#c9f1ff', breath: '#c9f1ff', horn: '#e0f4ff', ice: 1 }), side: 6, up: 24 },
  ignar: { draw: longWyrm({ a: '#a8402e', A: '#6a2420', b: '#e0a060', w: '#6a2a24', x: '#ffd24a', breath: '#ff9a3c', lava: 1 }), side: 6, up: 24 },
  duskking: { draw: tallDusk, side: 6, up: 12 },
  // 들판 보스
  fb_dawn: { draw: both(fit(function (g, p, s) { KT.quad(g, { a: '#8a8a94', A: '#56565e', b: '#cfcbc0', x: '#ffd24a' }, { mother: 1 }, p, s); }, 2.05, 0, 2), function (g, W, H) { line(g, [W * 0.73, H * 0.26, W * 0.79, H * 0.4], css(m('#7a2a2a')), 2.2); }), side: 4, up: 22 },
  fb_windy: { draw: fit(function (g, p, s) { KT.brute(g, { a: '#6a7f3a', A: '#44541f', b: '#5a4a30', x: '#ffd24a' }, { head: 'bull', weapon: { cat: 'club', kind: 'club', t: 4, m: ['#c8b080', '#8a7050', '#5a4430'], acc: '#6f4a2c', gem: '#ffd24a' } }, p, s); }, 1.8), side: 9, up: 16 },
  fb_stone: { draw: both(fit(function (g, p, s) { B3.golem(g, { m: '#8f8b98', M: '#5f5b6a', x: '#ff4d6d' }, s, p, null); }, 2.15), runes('#ff4d6d')), side: 6, up: 18 },
  fb_coast: { draw: longSerpent({ a: '#3a3350', A: '#231d33', b: '#7fd6d0', x: '#7fe3ff', fin: '#2f86a6', breath: '#b6ff5a', hood: 1 }), side: 6, up: 26 },
  fb_isle: { draw: both(fit(function (g, p, s) { B3.golem(g, { m: '#5e8a6a', M: '#3a5e46', x: '#b6ff5a' }, s, p, null); }, 2.15), function (g, W, H) { for (var i = 0; i < 6; i++) dot(g, W * (0.3 + i * 0.08), H * (0.5 + (i % 2) * 0.1), 3, css(m('#7aa85a'), 0.8)); }), side: 6, up: 18 },
  fb_desert: { draw: fit(function (g, p) { KT.scorp(g, { a: '#b0503a', A: '#7a3024', x: '#ffd24a' }, p, { queen: 1 }); }, 2.2, 4), side: 6, up: 16 },
  fb_mire: { draw: fit(function (g, p) { KT.specter(g, { a: '#3a4a44', A: '#22302a', x: '#c8f0a0', z: '#0a1410' }, p, { mud: 1 }); }, 2.15), side: 6, up: 18 },
  fb_spire: { draw: fit(function (g, p) { KT.impP(g, { a: '#7a2a3a', A: '#4a1626', x: '#ffd24a' }, p, 1); }, 1.8), side: 9, up: 16 },
  fb_ash: { draw: both(fit(bossFn('bargan') || function () {}, 2.15), embers(['#ffb347', '#d9442b'], 8)), side: 6, up: 20 },
  fb_end: { draw: longWyrm({ a: '#57524a', A: '#36322c', b: '#a8a090', w: '#3a3630', x: '#ff9a3c', breath: '#ff9a3c', ash: 1 }), side: 6, up: 24 },
  // 갱도 수문장
  pitGolem: { draw: both(fit(function (g, p, s) { B3.golem(g, { m: '#4b4560', M: '#2c2740', x: '#7fe3ff' }, s, p, null); }, 2.15), function (g, W, H) { dot(g, W * 0.6, H * 0.3, 7, 'rgba(255,214,90,.35)'); dot(g, W * 0.6, H * 0.3, 3, css(m('#ffd24a'))); }), side: 6, up: 18 },
  pitWorm: { draw: longSerpent({ a: '#a88a6a', A: '#6e5a44', b: '#d8c0a0', s: '#6a5a44', x: '#b6ff5a', worm: 1 }), side: 6, up: 28 },
  pitTitan: { draw: tallTitan, side: 6, up: 12 }
};
DS.BIGART = BIGART;
// 비 정사각 캔버스 굽기 (art.js finish 의 너비 · 높이 따로 판)
function mkC(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function finishR(L, o) {
  var Wp = L.width, Hp = L.height, out = mkC(Wp, Hp), g = out.getContext('2d'), r = (o && o.olw || 1.3) * AX / 4;
  var Tm = mkC(Wp, Hp), tg = Tm.getContext('2d'); tg.drawImage(L, 0, 0); tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = 'rgba(30,22,32,0.86)'; tg.fillRect(0, 0, Wp, Hp);
  for (var i = 0; i < 12; i++) { var a = i / 12 * 6.2832; g.drawImage(Tm, Math.cos(a) * r, Math.sin(a) * r); }
  g.drawImage(L, 0, 0);
  return out;
}
var BC = {}, BN = 0;
function specFor(u) { var k = u.type, b = BIGART[k]; if (b) return b; var B = DS.BOSSES && DS.BOSSES[k]; return B && B.like && BIGART[B.like] ? BIGART[B.like] : null; }
DS.bigCanvas = function (u, o) {
  if (DS.ART !== 'new' || !u) return null;
  var sp = specFor(u); if (!sp) return null;
  o = o || {}; var fw = u.fw || 1, fh = u.fh || 1, key = (u.type || '') + '|' + fw + 'x' + fh + '|' + (o.pose || '') + '|' + (o.flip ? 1 : 0) + '|' + (o.tint || '');
  if (key in BC) return BC[key];
  var out = null;
  try {
    if (o.tint || o.flip) {
      var base = DS.bigCanvas(u, { pose: o.pose }); if (!base) return (BC[key] = null);
      var c2 = mkC(base.width, base.height), g2 = c2.getContext('2d');
      if (o.flip) { g2.translate(c2.width, 0); g2.scale(-1, 1); }
      g2.drawImage(base, 0, 0);
      if (o.tint) { g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-in'; g2.fillStyle = o.tint; g2.fillRect(0, 0, c2.width, c2.height); }
      out = c2; out.lw = base.lw; out.lh = base.lh; out.ox = base.ox; out.oy = base.oy; out.pad = base.pad;
    } else {
      var side = sp.side || 6, up = sp.up || 16, lw = fw * 16 + side * 2, lh = fh * 16 + up + 2;
      var L = mkC(lw * AX, lh * AX), g = L.getContext('2d'); g.scale(AX / 4, AX / 4);
      sp.draw(g, lw * 4, lh * 4, o.pose || '', 0);
      out = finishR(L, sp);
      out.lw = lw; out.lh = lh; out.ox = side; out.oy = up;
      try { var dd = out.getContext('2d').getImageData(0, 0, out.width, out.height).data, rowB = out.width * 4, y; for (y = 0; y < out.height; y++) { var any = false; for (var x = 3; x < rowB; x += 16) if (dd[y * rowB + x] > 60) { any = true; break; } if (any) break; } out.pad = y / AX; } catch (x2) { out.pad = 0; }
    }
    BN++;
  } catch (e) { out = null; if (DS.DEBUG) throw e; }
  return (BC[key] = out);
};
DS.bigFlush = function () { BC = {}; };
DS.bigStat = function () { return { canvases: BN }; };
// 등장 연출 · 보스 컷인 · 창의 얼굴: 큰 그림을 한 장 (서기 자세 · 흰 테 없이)
DS.bigPortrait = function (type, fw, fh, px) {
  var c = DS.bigCanvas({ type: type, fw: fw, fh: fh, face: -1 }, { flip: true }); if (!c) return null;
  var s = (px || 2), out = mkC(Math.round(c.lw * s), Math.round(c.lh * s)), g = out.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, out.width, out.height);
  return out;
};
// 창 속 작은 그림(sprTag 'bb_키'): 큰 보스를 24px 상자에 맞춰 줄인 것 — 갱도 수문장 등 옛 그림이 없는 보스
var sp0 = DS.artSpec2;
DS.artSpec2 = function (name, palKey, base) {
  if (MON5[name]) return { lw: 16, draw: function (g, pose, step, mask) { if (mask) return; MON5[name].draw16(g, pose, step); } };
  if (/^bb_/.test(name)) {
    var k = name.slice(3), sp = BIGART[k], B = DS.BOSSES && DS.BOSSES[k]; if (!sp || !B || !B.sz) return null;
    var fw = B.sz[0], fh = B.sz[1], lw = fw * 16 + (sp.side || 6) * 2, lh = fh * 16 + (sp.up || 16) + 2, s = Math.min(96 / (lw * 4), 96 / (lh * 4));
    return { lw: 24, draw: function (g, pose, step, mask) { if (mask) return; g.save(); g.translate(48 - lw * 2 * s, 96 - lh * 4 * s); g.scale(s, s); sp.draw(g, lw * 4, lh * 4, pose || '', step || 0); g.restore(); }, olw: 1.25 };
  }
  return sp0 ? sp0(name, palKey, base) : null;
};
})();
