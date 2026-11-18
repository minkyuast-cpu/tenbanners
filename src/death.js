// 열 개의 깃발 — 죽음 연출 (r16 fx): 우리 편 사람(대장·깃발 든 사람·따르는 부대원)이 싸움 중에 영영 쓰러지는 순간
//   화면이 그 사람 쪽으로 천천히 당겨지고(줌 1.45배, 0.4초) 세상이 잠깐 느려진 채(0.25배) 죽음 장면이 흐른 뒤 돌아온다. 적은 지금처럼 짧게.
//   장면 24가지 — 때린 적의 종류·기술 속성·지형·유닛 종류·나이·성격·깃발로 고른다 (결정적: 같은 조건이면 같은 장면, 같은 싸움 안에서는 겹치지 않게).
//   카툰 범위: 피는 짙은 붉은 방울이 튀는 정도, 몸이 상하는 묘사는 없다. 장면이 끝난 자리에는 작은 묘비·깃발·검이 그 싸움 동안 남는다.
//   시간은 모두 실제 시간(배속과 무관). 여러 명이 한꺼번에 쓰러지면 한 명씩 — 두 번째부터는 줌 없이 장면만, 셋째 넘게 밀리면 곧바로.
//   설정 「죽음 연출」(opt.dfx, 기본 켬) · 움직임 줄이기(prefers-reduced-motion / gfxOpt.calm)면 줌·슬로우 없이 장면만.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
if (!DS.View) return;
var V = DS.View.prototype, PI = Math.PI, ZOOM = 1.8, ZIN = 0.6, ZOUT = 0.55, SLOW = 0.25;
// r30: 더 느리게, 더 가까이 — 첫 사람의 장면은 1.45배 늘여(최대 3.4초) 세상을 0.25배로 늦춘 채 1.8배까지 당기고, 가장자리가 어둡게 가라앉는다.
//   말풍선에 마지막 한마디(타자 치듯) → 이름과 「잠들다」. 줄 선 사람은 짧게(1.3초, 줌·슬로우 없이), 셋째부터는 더 짧게(1.1초).
//   안전: 한 장면의 줌·슬로우는 4.5초를 넘지 않고, 슬로우가 끝나고 5초 안의 죽음은 늦추지 않으며, 쌓인 슬로우가 6초를 넘으면 더는 늦추지 않는다 (잇단 죽음이 게임을 붙잡지 않게).
var STRETCH = 1.4, DMAX = 2.8, QDUR = 1.3, QDUR2 = 1.1, DZCAP = 4.5, SLOWBUD = 6, COOL = 5;
function nowMs() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
var BLOOD = ['#7a0f1a', '#a3121f', '#5a0a12', '#c0182a'], K = '#1b1626';
function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function eo(x) { x = cl(x); return 1 - (1 - x) * (1 - x); }
function ei(x) { x = cl(x); return x * x; }
function seg(t, a, b) { return cl((t - a) / (b - a)); }
function hash(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; } return h; }
function calm() { var GO = DS.gfxOpt || {}; if (GO.calm != null) return !!GO.calm; try { return !!(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (x) { return false; } }
DS.deathFxOn = function () { var s = DS.G && DS.G.save; return !(s && s.opt && s.opt.dfx === false); };

// ── 소품 (지도 좌표 픽셀) ──
function sword(g, x, y, a, len) {      // x,y = 손잡이 끝, a = 칼끝 방향
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = K; g.fillRect(-0.5, -1.2, len + 1.5, 2.4);
  g.fillStyle = '#d9dee8'; g.fillRect(2.5, -0.7, len - 2, 1.4); g.fillStyle = '#ffffff'; g.fillRect(2.5, -0.7, len - 2, 0.5);
  g.fillStyle = '#8a5a36'; g.fillRect(0, -0.6, 2.5, 1.2); g.fillStyle = '#f6cf57'; g.fillRect(2.2, -2, 0.9, 4);
  g.restore();
}
function shield(g, x, y, crack, col) {
  g.fillStyle = K; g.fillRect(x - 3.5, y - 4.5, 7, 8); g.fillRect(x - 2.5, y + 3.5, 5, 1);
  g.fillStyle = col || '#6d7fa8'; g.fillRect(x - 3, y - 4, 6, 7); g.fillRect(x - 2, y + 3, 4, 0.8);
  g.fillStyle = '#c9d3ea'; g.fillRect(x - 3, y - 4, 6, 0.8); g.fillStyle = '#f6cf57'; g.fillRect(x - 0.5, y - 2.5, 1, 4);
  if (crack > 0) { g.fillStyle = K; var n = Math.ceil(crack * 5); for (var i = 0; i < n; i++) g.fillRect(x - 0.4 + (i % 2 ? 0.8 : -0.8), y - 4 + i * 1.5, 0.6, 1.6); }
}
function flag(g, x, y, a, col, droop, h) {      // 깃대 밑동 x,y · 기울기 a · 처짐 droop(0~1)
  h = h || 20; g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = K; g.fillRect(-0.8, -h, 1.6, h); g.fillStyle = '#8a5a36'; g.fillRect(-0.3, -h + 0.5, 0.6, h - 1);
  var w = 8 * (1 - droop * 0.45), hh = 5 + droop * 3;
  g.fillStyle = K; g.fillRect(0.6, -h - 0.4, w + 0.8, hh + 0.8);
  g.fillStyle = col; g.fillRect(0.8, -h, w, hh); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0.8, -h + hh - 1, w, 1);
  g.fillStyle = '#f6cf57'; g.fillRect(-1, -h - 1.5, 2, 1.5);
  g.restore();
}
function arrow(g, x, y, a) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#a8754a'; g.fillRect(0, -0.35, 5.5, 0.7); g.fillStyle = '#f1ead9'; g.fillRect(4.2, -1.1, 1.6, 0.7); g.fillRect(4.2, 0.4, 1.6, 0.7); g.restore(); }
function splat(g, cx, cy, r, a, cols) {      // 바닥의 짙은 붉은 웅덩이 (카툰 방울 몇 개)
  if (r <= 0.2) return; cols = cols || BLOOD; g.globalAlpha = a;
  g.fillStyle = cols[2]; g.beginPath(); g.ellipse(cx, cy, r * 1.2, r * 0.42, 0, 0, PI * 2); g.fill();
  g.fillStyle = cols[0]; g.beginPath(); g.ellipse(cx - r * 0.1, cy - 0.15, r, r * 0.33, 0, 0, PI * 2); g.fill();
  g.beginPath(); g.ellipse(cx + r * 1.25, cy + 0.2, r * 0.25, r * 0.12, 0, 0, PI * 2); g.fill();
  g.beginPath(); g.ellipse(cx - r * 1.3, cy - 0.1, r * 0.2, r * 0.1, 0, 0, PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(cx - r * 0.5, cy - r * 0.18, r * 0.35, 0.4);
  g.globalAlpha = 1;
}
function flames(g, cx, by, w, h, t, a) {
  var cols = ['#d9442b', '#ff9a3c', '#ffd75e', '#fff6d0'];
  for (var i = 0; i < 7; i++) {
    var fx = cx - w / 2 + (i + 0.5) * w / 7, fl = h * (0.55 + 0.45 * Math.abs(Math.sin(t * 13 + i * 1.7))), fw = 1.6 + (i % 3) * 0.6;
    for (var c = 0; c < 4; c++) { var q = 1 - c * 0.24; g.globalAlpha = a * (c ? 0.95 : 0.8); g.fillStyle = cols[c]; g.beginPath(); g.moveTo(fx - fw * q, by); g.quadraticCurveTo(fx - fw * q * 0.6, by - fl * q * 0.6, fx + Math.sin(t * 9 + i) * 0.8, by - fl * q); g.quadraticCurveTo(fx + fw * q * 0.6, by - fl * q * 0.6, fx + fw * q, by); g.fill(); }
  }
  g.globalAlpha = 1;
}
function thumb(g, x, y, s, fd) {      // 엄지 척
  g.save(); g.translate(x, y); g.scale(s * fd, s);
  g.fillStyle = K; g.fillRect(-2.6, -1.2, 5.2, 4.6); g.fillRect(-1.4, -5.2, 2.6, 4.4);
  g.fillStyle = '#f2c9a0'; g.fillRect(-2, -0.7, 4, 3.6); g.fillRect(-0.9, -4.7, 1.6, 4); g.fillStyle = '#d9a37a'; g.fillRect(-2, 1.1, 4, 0.5); g.fillRect(-2, 2.2, 4, 0.5);
  g.restore();
}
function crackLines(g, W, p, seed) {      // 몸 위의 금 (몸 좌표: 발 = 0,0, 위 = -W)
  var r = seed, n = Math.ceil(p * 9); g.fillStyle = K;
  for (var i = 0; i < n; i++) { r = (r * 16807) % 2147483647; var x = ((r % 1000) / 1000 - 0.5) * W * 0.6, y = -W * (0.15 + ((r >> 10) % 1000) / 1000 * 0.75), L = 2 + (r % 3); for (var j = 0; j < L; j++) g.fillRect(x + (j % 2 ? 0.6 : -0.4) * j * 0.6, y + j * 0.9, 0.55, 1); }
}
function tomb(g, x, y, a) {
  g.globalAlpha = a * 0.35; g.fillStyle = '#000'; g.fillRect(x - 3.5, y + 0.5, 7, 1);
  g.globalAlpha = a; g.fillStyle = K; g.fillRect(x - 3, y - 6.5, 6, 7.5); g.fillRect(x - 2, y - 7.5, 4, 1);
  g.fillStyle = '#a7a1c2'; g.fillRect(x - 2.5, y - 6, 5, 6.5); g.fillRect(x - 1.5, y - 7, 3, 1); g.fillStyle = '#d8d2ea'; g.fillRect(x - 2.5, y - 6, 5, 0.6);
  g.fillStyle = '#5c5675'; g.fillRect(x - 0.4, y - 5, 0.8, 3.4); g.fillRect(x - 1.4, y - 4, 2.8, 0.8);
  g.fillStyle = '#7fcf6a'; g.fillRect(x - 3.5, y + 0.2, 1.2, 0.6); g.fillRect(x + 2.4, y + 0.2, 1, 0.6);
  g.globalAlpha = 1;
}
function bone(g, x, y, a, big) { g.save(); g.translate(x, y); g.rotate(a); var L = big ? 3.4 : 2.6; g.fillStyle = K; g.fillRect(-L / 2 - 0.4, -0.7, L + 0.8, 1.4); g.fillStyle = '#efe6d0'; g.fillRect(-L / 2, -0.35, L, 0.7); g.fillRect(-L / 2 - 0.3, -0.7, 0.8, 0.6); g.fillRect(-L / 2 - 0.3, 0.1, 0.8, 0.6); g.fillRect(L / 2 - 0.5, -0.7, 0.8, 0.6); g.fillRect(L / 2 - 0.5, 0.1, 0.8, 0.6); g.restore(); }
function skull(g, x, y) { g.fillStyle = K; g.fillRect(x - 1.8, y - 1.8, 3.6, 3.4); g.fillStyle = '#efe6d0'; g.fillRect(x - 1.4, y - 1.4, 2.8, 2.6); g.fillStyle = K; g.fillRect(x - 0.9, y - 0.6, 0.7, 0.7); g.fillRect(x + 0.3, y - 0.6, 0.7, 0.7); g.fillRect(x - 0.6, y + 0.6, 1.2, 0.4); }
function rubble(g, x, y, a, n) { g.globalAlpha = a; for (var i = 0; i < (n || 7); i++) { var rx = x - 5 + (i * 37 % 10), ry = y - (i % 3) * 0.9, s = 1.2 + (i % 3) * 0.5; g.fillStyle = K; g.fillRect(rx - 0.3, ry - s - 0.3, s + 0.6, s + 0.6); g.fillStyle = i % 2 ? '#8f8aa0' : '#b7b1c6'; g.fillRect(rx, ry - s, s, s); } g.globalAlpha = 1; }
function dots(view, v, cols, n, o) { view.burst(v.x, v.y - (o.lift || 0), cols, n, o); }

// ── 장면 24가지 ──
// 각 장면: dur(초) · grave(남는 표시) · zoom(줌을 걸지) · run(g, S) — S.body(o) 로 몸을 그린다 (o: dx dy rot sx sy a tint ta clipTop cut extra)
//   S.at(초, 열쇠, fn) = 그 순간 한 번. S.t 시간 · S.fd 바라보는 쪽(1/-1) · S.X0,Y0 발밑 · S.W 몸 크기
var SC = {};
SC.kneel = { name: '무릎 꿇고 무기를 떨어뜨림', dur: 2.0, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd;
  S.at(0.05, 'b', function () { S.blood(10); S.sfx('crit'); });
  var kn = eo(seg(t, 0.25, 0.65)), fall = ei(seg(t, 0.95, 1.35));
  splat(g, S.X0 + fd * 3, S.Y0 + 0.5, 4.5 * eo(seg(t, 1.3, 1.9)), 0.9);
  var sp = seg(t, 0.4, 0.8), sx = S.X0 + fd * (4 + sp * 4), sy = S.Y0 - 7 + ei(sp) * 6.5;      // 떨어지는 무기
  if (t > 0.4) sword(g, sx - fd * 3, sy, fd > 0 ? -PI / 2 + sp * PI * 0.95 : -PI / 2 - sp * PI * 0.95, 7);
  S.at(0.8, 'clk', function () { S.sfx('miss'); });
  S.body({ dx: t < 0.25 ? -fd * Math.sin(t / 0.25 * PI) * 1.5 : 0, sy: 1 - kn * 0.26, rot: fd * fall * PI / 2, ta: t < 0.2 ? 0.6 : 0, tint: '#ff3040', a: S.fade(0.75) });
  S.at(1.35, 'd', function () { S.dust(6); S.sfx('die'); S.shake(0.15); });
} };
SC.flyback = { name: '뒤로 날아가 구름', dur: 1.9, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, p = seg(t, 0, 0.55), bx = -fd * 14 * eo(p), by = -Math.sin(p * PI) * 8 - (t > 0.55 ? Math.abs(Math.sin(seg(t, 0.55, 0.8) * PI)) * 2 : 0);
  S.at(0, 'b', function () { S.blood(16, { spd: 44 }); S.shake(0.3); S.sfx('crit'); });
  splat(g, S.X0 - fd * 14, S.Y0 + 0.5, 4.5 * eo(seg(t, 0.7, 1.4)), 0.9);
  S.body({ dx: bx, dy: by, rot: -fd * (PI / 2) * eo(seg(t, 0, 0.6)), a: S.fade(0.75) });
  S.at(0.55, 'd', function () { S.dust(8, -fd * 14); S.sfx('punch'); });
  if (t > 0.55 && t < 1.0) { g.globalAlpha = 1 - seg(t, 0.55, 1); g.fillStyle = '#c8b48a'; for (var i = 0; i < 5; i++) g.fillRect(S.X0 - fd * (4 + i * 2.2), S.Y0 - 0.5 - (i % 2) * 0.6, 1.5, 0.8); g.globalAlpha = 1; }      // 끌린 자국
} };
SC.shield = { name: '방패가 깨지며 함께 무너짐', dur: 2.0, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, sp = seg(t, 0.45, 1.1);
  S.at(0.08, 'h', function () { S.sfx('hit'); }); S.at(0.45, 'brk', function () { S.sfx('punch'); S.dots(['#c9d3ea', '#6d7fa8', '#ffffff'], 10, { spd: 34, life: 0.5, size: 1 }); S.blood(6); });
  var col = S.c2 || '#6d7fa8';
  S.body({ dx: t > 0.45 ? -fd * 2 * eo(seg(t, 0.45, 0.6)) : 0, sy: 1 - eo(seg(t, 0.6, 1.2)) * 0.4, rot: fd * (0.3 * eo(seg(t, 0.6, 1.2)) + 1.27 * ei(seg(t, 1.2, 1.5))), a: S.fade(0.75) });
  if (t < 0.45) shield(g, S.X0 + fd * 5, S.Y0 - 5, seg(t, 0.08, 0.45), col);
  else { var hx = sp * 8, hy = ei(sp) * 5 - Math.sin(sp * PI) * 4; g.save(); g.beginPath(); g.rect(S.X0 + fd * 5 - 4, S.Y0 - 12, 4, 20); g.clip(); shield(g, S.X0 + fd * 5 - hx, S.Y0 - 5 + hy, 1, col); g.restore(); g.save(); g.beginPath(); g.rect(S.X0 + fd * 5, S.Y0 - 12, 4, 20); g.clip(); shield(g, S.X0 + fd * 5 + hx, S.Y0 - 5 + hy, 1, col); g.restore(); }
  S.at(1.5, 'd', function () { S.dust(6); S.sfx('die'); });
} };
SC.flag = { name: '깃발을 끝까지 붙잡고 기울어짐', dur: 2.5, grave: 'flag', run: function (g, S) {
  var t = S.t, fd = S.fd, tilt = eo(seg(t, 0.6, 1.8)) * 0.5, slide = ei(seg(t, 1.8, 2.15));
  S.at(0.05, 'b', function () { S.blood(8); S.sfx('crit'); });
  flag(g, S.X0 - fd * 3, S.Y0, fd * tilt, S.flagCol, eo(seg(t, 0.5, 1.6)), 20);
  S.body({ dx: -fd * slide * 2, sy: 1 - eo(seg(t, 0, 0.6)) * 0.22, rot: fd * (tilt * 0.7 + slide * 0.95), a: S.fade(0.7) });
  S.at(2.1, 'd', function () { S.sfx('die'); S.dust(4); });
} };
SC.reach = { name: '마지막으로 하늘을 보며 손을 뻗음', dur: 2.4, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, lie = eo(seg(t, 0.35, 0.8));
  S.at(0.05, 'b', function () { S.blood(10); S.sfx('crit'); });
  splat(g, S.X0 - fd * 6, S.Y0 + 0.5, 4 * eo(seg(t, 0.8, 1.6)), 0.85);
  S.body({ dx: t < 0.35 ? -fd * eo(seg(t, 0, 0.35)) * 2 : -fd * 2, rot: -fd * lie * PI / 2, a: S.fade(0.72) });
  S.at(0.8, 'd', function () { S.sfx('die'); S.dust(5, -fd * 4); });
  var arm = eo(seg(t, 0.95, 1.5)) * (1 - ei(seg(t, 1.7, 1.95))), ax = S.X0 - fd * (S.W * 0.5 + 2), ay = S.Y0 - 2;
  if (arm > 0.02) {
    if (t > 1.0 && t < 1.9) { g.globalAlpha = 0.25 * Math.sin(seg(t, 1.0, 1.9) * PI); g.fillStyle = '#fff6d0'; g.fillRect(ax - 3, ay - 60, 6, 58); g.globalAlpha = 1; }      // 하늘에서 내린 옅은 빛
    var ex = ax + Math.sin(t * 22) * 0.35 * arm, ey = ay - 8 * arm;
    g.fillStyle = K; g.fillRect(Math.min(ax, ex) - 0.9, ey - 0.6, 1.8 + Math.abs(ex - ax), ay - ey + 0.6);
    g.fillStyle = '#f2c9a0'; g.fillRect(Math.min(ax, ex) - 0.45, ey, 0.9 + Math.abs(ex - ax), ay - ey); g.fillRect(ex - 0.9, ey - 1.2, 1.8, 1.4);
  }
} };
SC.arrows = { name: '화살 여러 대를 맞고 버티다 쓰러짐', dur: 2.1, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, n = 0, hits = [0, 0.28, 0.55, 0.8], jolt = 0, i;
  for (i = 0; i < hits.length; i++) if (t >= hits[i]) { n++; jolt = Math.max(jolt, 1 - (t - hits[i]) / 0.15); }
  for (i = 0; i < hits.length; i++) S.at(hits[i], 'a' + i, function () { S.sfx('arrow'); S.blood(3, { spd: 20 }); });
  var AR = [[0.1, -0.6, 0.25], [-0.15, -0.45, 0.05], [0.05, -0.75, 0.45], [-0.05, -0.3, -0.1]], W = S.W, sway = t > 0.9 && t < 1.35 ? Math.sin((t - 0.9) * 14) * 0.08 : 0;
  splat(g, S.X0 + fd * 4, S.Y0 + 0.5, 4 * eo(seg(t, 1.5, 2.0)), 0.85);
  S.body({ dx: -fd * Math.max(0, jolt) * 1.2, rot: sway + fd * ei(seg(t, 1.3, 1.6)) * PI / 2, sy: 1 - eo(seg(t, 0.85, 1.2)) * 0.08, a: S.fade(0.75), extra: function (g2) { for (var j = 0; j < n; j++) arrow(g2, AR[j][0] * W * fd, AR[j][1] * W, fd > 0 ? PI - AR[j][2] : AR[j][2]); } });
  S.at(1.6, 'd', function () { S.sfx('die'); S.dust(5); });
} };
SC.fire = { name: '불길에 휩싸여 재처럼 흩어짐', dur: 2.3, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, burn = eo(seg(t, 0, 1.0)), ash = seg(t, 1.2, 2.0);
  S.at(0, 'f', function () { S.sfx('fire'); S.light('#ff9a3c', 22, 0.6, 1.4); });
  for (var k = 0; k < 6; k++) S.at(1.2 + k * 0.12, 'ash' + k, function () { S.dots(['#5c5675', '#8d8a99', '#ff9a3c', '#3a3348'], 6, { up: 26, grav: -18, spd: 10, life: 0.9, spread: 10, lift: 0.4 }); });
  S.body({ dx: t < 1.2 ? Math.sin(t * 18) * 0.9 : 0, sy: 1 - burn * 0.12, ta: Math.min(0.92, burn * 0.6 + ash * 0.4), tint: t < 0.9 ? '#ff6a1a' : '#2a1d1a', clipTop: ei(ash), a: t > 2.0 ? 1 - seg(t, 2.0, 2.3) : 1 });
  flames(g, S.X0, S.Y0, S.W * 0.9, S.W * (0.35 + burn * 0.4) * (1 - ash), t, 0.78 * Math.min(1, t / 0.15) * (1 - ash));      // 불길 사이로 몸이 보이게
  if (t > 1.2) { g.globalAlpha = 0.8 * (1 - seg(t, 1.9, 2.3)); g.fillStyle = '#3a3348'; g.beginPath(); g.ellipse(S.X0, S.Y0 + 0.3, 4.5 * ash, 1.2 * ash, 0, 0, PI * 2); g.fill(); g.globalAlpha = 1; }      // 재 더미
} };
SC.ice = { name: '얼어붙어 금 가며 부서짐', dur: 2.1, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, fr = eo(seg(t, 0, 0.45)), shat = t >= 1.35, W = S.W;
  S.at(0, 'w', function () { S.sfx('water'); });
  for (var k = 0; k < 3; k++) S.at(0.6 + k * 0.22, 'c' + k, function () { S.sfx('miss'); });
  S.at(1.35, 's', function () { S.sfx('crit'); S.dots(['#bfe8ff', '#ffffff', '#7fb8e6', '#e4f6ff'], 22, { spd: 46, up: 18, grav: 90, life: 0.7, spread: 8, lift: 0.4, size: 1 }); S.shake(0.15); });
  if (!shat) {
    S.body({ ta: fr * 0.7, tint: '#bfe8ff', sy: 1, a: 1, extra: function (g2) { crackLines(g2, W, seg(t, 0.55, 1.3), 977); } });
    var bh = (W + 3) * fr; g.globalAlpha = 0.45; g.fillStyle = '#d8f2ff'; g.fillRect(S.X0 - W * 0.42, S.Y0 - bh, W * 0.84, bh); g.globalAlpha = 0.9; g.fillStyle = '#ffffff'; g.fillRect(S.X0 - W * 0.42, S.Y0 - bh, W * 0.84, 0.6); g.fillRect(S.X0 - W * 0.42, S.Y0 - bh, 0.6, bh); g.fillRect(S.X0 - W * 0.2, S.Y0 - bh + 2, 0.6, bh * 0.4);
    g.fillStyle = '#7fb8e6'; g.fillRect(S.X0 + W * 0.42 - 0.6, S.Y0 - bh, 0.6, bh); g.globalAlpha = 1;
    if (t > 0.55) { g.fillStyle = '#ffffff'; var cp = seg(t, 0.55, 1.3); for (var j = 0; j < Math.ceil(cp * 6); j++) g.fillRect(S.X0 - 3 + j * 1.3, S.Y0 - bh + 2 + (j % 3) * 3, 0.6, 2.2); }
  } else { g.globalAlpha = 0.6 * (1 - seg(t, 1.5, 2.1)); g.fillStyle = '#d8f2ff'; g.beginPath(); g.ellipse(S.X0, S.Y0 + 0.3, 5, 1.4, 0, 0, PI * 2); g.fill(); g.globalAlpha = 1; }
} };
SC.thunder = { name: '번개에 맞아 검게 그을려 쓰러짐', dur: 2.0, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd;
  S.at(0, 'b', function () { S.bolt(); S.sfx('thunder'); S.flash(0.1); S.light('#cfe8ff', 26, 0.8, 0.5); });
  for (var k = 0; k < 4; k++) S.at(0.5 + k * 0.18, 'sm' + k, function () { S.dots(['#5c5675', '#8d8a99', '#3a3348'], 4, { up: 18, grav: -14, spd: 5, life: 1.0, spread: 6, lift: 0.5, size: 2 }); });
  var zap = t < 0.5, fl = zap && Math.floor(t * 30) % 2 === 0;
  S.body({ dx: zap ? (Math.random() - 0.5) * 1.6 : 0, ta: zap ? 0.85 : 0.82, tint: fl ? '#ffffff' : '#1b1418', rot: fd * ei(seg(t, 0.75, 1.2)) * PI / 2, a: S.fade(0.72) });
  S.at(1.2, 'd', function () { S.sfx('die'); S.dust(5); });
  if (t > 1.2) { g.globalAlpha = 0.6 * S.fade(0.72); g.fillStyle = '#2a2228'; g.beginPath(); g.ellipse(S.X0 + fd * 6, S.Y0 + 0.4, 6, 1.5, 0, 0, PI * 2); g.fill(); g.globalAlpha = 1; }      // 그을린 자국
} };
SC.dusk = { name: '어스름에 빛깔이 빠져나가 회색으로 바래짐', dur: 2.4, grave: 'tomb', run: function (g, S) {
  var t = S.t, drain = eo(seg(t, 0, 1.5)), go = seg(t, 1.6, 2.3);
  S.at(0, 's', function () { S.sfx('dark'); });
  for (var k = 0; k < 8; k++) S.at(0.15 + k * 0.22, 'w' + k, function () { S.dots(['#6a4d8f', '#3a2d55', '#a7a1c2'], 3, { up: 16, grav: -10, spd: 4, life: 1.1, spread: 10, lift: 0.4, size: 1 }); });
  S.body({ ta: Math.min(0.95, drain * 0.95), tint: '#8d8a99', sy: 1 - drain * 0.14, dy: 0, a: 1 - go, clipTop: 0 });
  if (t > 1.6) for (var i = 0; i < 10; i++) { var q = (go + i * 0.1) % 1; g.globalAlpha = (1 - q) * (1 - seg(t, 2.1, 2.4)); g.fillStyle = '#8d8a99'; g.fillRect(S.X0 - 4 + (i * 7 % 9), S.Y0 - 4 - q * 18 - (i % 4) * 2, 1, 1); }
  g.globalAlpha = 1;
} };
SC.poison = { name: '독으로 비틀거리다 쓰러짐', dur: 2.2, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, st = t < 1.35, fall = ei(seg(t, 1.3, 1.65));
  S.at(0, 'p', function () { S.sfx('poison'); });
  for (var k = 0; k < 6; k++) S.at(0.1 + k * 0.2, 'g' + k, function () { S.dots(['#9ccc3c', '#5f8f1f', '#d6f28a'], 3, { up: 14, grav: -16, spd: 4, life: 0.8, spread: 8, lift: 0.5, size: 1 }); });
  splat(g, S.X0 + fd * 5, S.Y0 + 0.5, 3.5 * eo(seg(t, 1.6, 2.1)), 0.7, ['#5f8f1f', '#7fbf3c', '#3f6a12']);
  S.body({ dx: st ? Math.sin(t * 5.5) * 2.4 : Math.sin(1.35 * 5.5) * 2.4, rot: (st ? Math.sin(t * 5.5) * 0.22 : 0) + fd * fall * PI / 2, ta: 0.25 + 0.2 * Math.sin(t * 8), tint: '#7fbf3c', a: S.fade(0.75) });
  S.at(1.65, 'd', function () { S.sfx('die'); S.dust(4); });
} };
SC.horse = { name: '말에서 떨어짐', dur: 2.2, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, rear = eo(seg(t, 0, 0.35)) * (1 - seg(t, 0.35, 0.5)), top = ei(seg(t, 0.4, 0.9)), slide = eo(seg(t, 0.9, 1.4));
  S.at(0.02, 'h', function () { S.sfx('crit'); S.blood(8); });
  S.body({ rot: -fd * rear * 0.45 + fd * top * PI / 2, dy: -rear * 2, dx: fd * slide * 5, a: S.fade(0.75) });
  S.at(0.9, 'd', function () { S.sfx('boom'); S.dust(10); S.shake(0.25); });
  if (t > 0.9 && t < 1.5) { g.globalAlpha = 1 - seg(t, 0.9, 1.5); g.fillStyle = '#c8b48a'; for (var i = 0; i < 6; i++) g.fillRect(S.X0 + fd * (i * 1.1), S.Y0 - 0.5, 1.2, 0.7); g.globalAlpha = 1; }
  splat(g, S.X0 + fd * 9, S.Y0 + 0.5, 3.6 * eo(seg(t, 1.3, 2.0)), 0.85);
} };
SC.fall = { name: '날짐승과 함께 추락', dur: 2.1, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, up = eo(seg(t, 0, 0.3)), dn = ei(seg(t, 0.3, 1.0)), h = -3 - up * 6 + dn * 9, spin = t < 1.0 ? Math.cos(t * 16 * (1 - t * 0.5)) : 1;
  S.at(0.02, 'h', function () { S.sfx('crit'); S.blood(6); });
  for (var k = 0; k < 4; k++) S.at(0.3 + k * 0.15, 'fe' + k, function () { S.dots(['#ffffff', '#cdd5e3', '#8f9ab3'], 3, { up: -6, grav: 6, spd: 14, life: 1.0, spread: 6, lift: 0.5, size: 1 }); });
  var land = t >= 1.0, bnc = land ? Math.abs(Math.sin(seg(t, 1.0, 1.3) * PI)) * 2.5 : 0;
  S.body({ dy: Math.min(0, h) - bnc, sx: spin, rot: land ? fd * PI / 2 : fd * dn * 0.9, a: S.fade(0.75) });
  S.at(1.0, 'd', function () { S.sfx('boom'); S.dust(12); S.shake(0.3); });
  splat(g, S.X0 + fd * 6, S.Y0 + 0.5, 3.8 * eo(seg(t, 1.2, 1.9)), 0.85);
} };
SC.sink = { name: '물에 가라앉음', dur: 2.4, grave: 'none', run: function (g, S) {
  var t = S.t, fd = S.fd, down = Math.pow(seg(t, 0.3, 2.1), 1.4) * (S.W + 2), wl = S.Y0 - 3;
  S.at(0, 's', function () { S.sfx('water'); });
  for (var k = 0; k < 5; k++) S.at(0.2 + k * 0.38, 'r' + k, function () { S.ring('#dff0ff', 9); });
  for (k = 0; k < 6; k++) S.at(0.8 + k * 0.2, 'bb' + k, function () { S.dots(['#dff0ff', '#ffffff'], 2, { up: 14, grav: -10, spd: 2, life: 0.6, spread: 4, lift: 0.3, size: 1 }); });
  S.body({ dx: t < 0.6 ? Math.sin(t * 20) * 1.2 : 0, dy: down, cut: wl, a: 1 });
  var arm = t > 1.4 && t < 2.1 ? Math.sin(seg(t, 1.4, 2.1) * PI) : 0;
  if (arm > 0) { g.fillStyle = K; g.fillRect(S.X0 - 0.9, wl - 6 * arm - 0.5, 1.8, 6 * arm + 0.5); g.fillStyle = '#f2c9a0'; g.fillRect(S.X0 - 0.45, wl - 6 * arm, 0.9, 6 * arm); g.fillRect(S.X0 - 0.9, wl - 6 * arm - 1, 1.8, 1.2); }
  g.globalAlpha = 0.7; g.fillStyle = '#dff0ff'; g.fillRect(S.X0 - 6, wl, 12, 0.6); g.globalAlpha = 1;
} };
SC.arms = { name: '동료 품에 쓰러짐', dur: 2.5, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, ad = S.allyDx || fd, lean = eo(seg(t, 0.3, 1.0)), sl = eo(seg(t, 1.0, 1.9));
  S.at(0.05, 'b', function () { S.blood(6); S.sfx('hit'); });
  S.body({ dx: S.allyOff * 0.5 * lean, dy: S.allyOffY * 0.5 * lean, rot: ad * (0.45 * lean + 0.75 * sl), sy: 1 - sl * 0.2, a: S.fade(0.7) });
  if (t > 1.0) { var q = seg(t, 1.0, 2.2); g.globalAlpha = 0.28 * Math.sin(q * PI); g.fillStyle = '#fff6d0'; g.beginPath(); g.ellipse(S.X0 + S.allyOff * 0.5, S.Y0 - 5, 5, 4.5, 0, 0, PI * 2); g.fill(); g.globalAlpha = 1; }
  for (var k = 0; k < 3; k++) S.at(1.2 + k * 0.3, 'tr' + k, function () { S.dots(['#9fd8ff', '#dff0ff'], 1, { up: -4, grav: 40, spd: 3, life: 0.5, spread: 2, lift: 0.7, size: 1 }); });      // 동료의 눈물
  S.at(1.9, 'd', function () { S.sfx('die'); });
} };
SC.thumb = { name: '웃으며 엄지를 들고 쓰러짐', dur: 2.3, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, pop = eo(seg(t, 0.35, 0.55)), fall = ei(seg(t, 1.25, 1.6)), W = S.W;
  S.at(0.05, 'b', function () { S.blood(8); S.sfx('crit'); });
  S.at(0.4, 'tb', function () { S.sfx('star'); });
  S.body({ dx: t < 0.3 ? -fd * Math.sin(t / 0.3 * PI) * 1.2 : 0, rot: (t < 1.25 ? Math.sin(t * 6) * 0.06 : 0) - fd * fall * PI / 2, a: S.fade(0.72), extra: function (g2) { if (t > 0.35) thumb(g2, fd * W * 0.38, -W * 0.5, 0.55 + pop * 0.35, fd); } });
  S.at(1.6, 'd', function () { S.sfx('die'); S.dust(5, -fd * 4); });
  splat(g, S.X0 - fd * 5, S.Y0 + 0.5, 3.5 * eo(seg(t, 1.6, 2.2)), 0.85);
} };
SC.elder = { name: '노년: 조용히 눈 감음', dur: 2.6, grave: 'tomb', zoom: true, run: function (g, S) {
  var t = S.t, fd = S.fd, sit = eo(seg(t, 0, 1.0));
  for (var k = 0; k < 5; k++) S.at(0.8 + k * 0.25, 'm' + k, function () { S.dots(['#fff6d0', '#ffffff'], 1, { up: 10, grav: -6, spd: 2, life: 1.4, spread: 8, lift: 0.5, size: 1 }); });
  S.at(0.6, 'l', function () { S.light('#fff2c4', 18, 0.35, 1.8); });
  S.body({ sy: 1 - sit * 0.22, rot: fd * sit * 0.14, ta: eo(seg(t, 1.0, 2.0)) * 0.45, tint: '#fff8e0', a: 1 - seg(t, 1.9, 2.6) });
} };
SC.child = { name: '아이: 짧고 조용하게', dur: 1.2, grave: 'tomb', zoom: false, run: function (g, S) {
  var t = S.t, fd = S.fd;
  S.at(0.3, 'p', function () { S.dots(['#ffd0e0', '#ffffff', '#ffb6c8'], 5, { up: 10, grav: 8, spd: 8, life: 0.9, spread: 8, lift: 0.3, size: 1 }); });
  S.body({ sy: 1 - eo(seg(t, 0, 0.4)) * 0.15, rot: fd * ei(seg(t, 0.35, 0.75)) * PI / 2, a: 1 - seg(t, 0.75, 1.2) });
} };
SC.stone = { name: '돌 정령: 금 가며 무너짐', dur: 2.2, grave: 'rubble', run: function (g, S) {
  var t = S.t, crk = seg(t, 0, 0.9), cr = seg(t, 0.9, 1.8), W = S.W;
  for (var k = 0; k < 3; k++) S.at(k * 0.3, 'c' + k, function () { S.sfx('punch'); });
  S.at(0.9, 'b', function () { S.sfx('boom'); S.shake(0.25); S.dust(10); });
  for (k = 0; k < 6; k++) S.at(0.95 + k * 0.13, 'ch' + k, function () { S.dots(['#8f8aa0', '#b7b1c6', '#5c5675'], 4, { up: 6, grav: 120, spd: 16, life: 0.6, spread: 10, lift: 0.6 - k * 0.07, size: 2 }); });
  if (t < 1.85) S.body({ dx: t < 0.9 ? (Math.random() - 0.5) * 0.8 * crk : 0, clipTop: ei(cr), ta: 0.2 * cr, tint: '#5c5675', a: 1, extra: function (g2) { crackLines(g2, W, crk, 4421); } });
  rubble(g, S.X0, S.Y0 + 0.5, eo(seg(t, 1.0, 1.6)), 9);
} };
SC.bones = { name: '해골: 뼈가 흩어짐', dur: 1.9, grave: 'bones', run: function (g, S) {
  var t = S.t, fd = S.fd, ds = S.ds;
  S.at(0.25, 'p', function () { S.sfx('punch'); S.sfx('die');
    ds.bn = []; for (var i = 0; i < 9; i++) { var a = -PI / 2 + (i / 8 - 0.5) * 2.4; ds.bn.push({ x: S.X0, y: S.Y0 - 6 - (i % 3) * 2, vx: Math.cos(a) * (14 + (i * 7) % 12), vy: Math.sin(a) * (24 + (i * 5) % 14), r: i * 0.7, vr: (i % 2 ? 1 : -1) * (6 + i), sk: i === 0 }); } });
  if (t < 0.4) S.body({ dx: t < 0.25 ? -fd * Math.sin(t / 0.25 * PI) * 1.2 : 0, a: 1 - seg(t, 0.25, 0.4), ta: 0.5, tint: '#ffffff' });
  if (ds.bn) { var dt = S.dt; ds.bn.forEach(function (b) { if (b.y < S.Y0 - 0.5 || b.vy < 0) { b.vy += 160 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r += b.vr * dt; } if (b.y >= S.Y0 - 0.5 && b.vy > 0) { b.y = S.Y0 - 0.5; b.vy = Math.abs(b.vy) > 18 ? -b.vy * 0.35 : 0; b.vx *= 0.5; b.vr *= 0.4; } if (b.sk) skull(g, b.x, b.y - 1); else bone(g, b.x, b.y, b.r, false); }); }
} };
SC.spin = { name: '맞고 빙글 돌며 쓰러짐', dur: 1.9, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, p = seg(t, 0, 0.75);
  S.at(0, 'b', function () { S.blood(12, { spd: 40 }); S.sfx('crit'); S.shake(0.15); });
  S.body({ sx: t < 0.75 ? Math.cos(eo(p) * PI * 4) : 1, dx: -fd * eo(p) * 4, rot: -fd * ei(seg(t, 0.7, 1.0)) * PI / 2, a: S.fade(0.72) });
  S.at(1.0, 'd', function () { S.sfx('die'); S.dust(6, -fd * 4); });
  splat(g, S.X0 - fd * 7, S.Y0 + 0.5, 4 * eo(seg(t, 1.0, 1.7)), 0.9);
} };
SC.planted = { name: '검을 땅에 꽂고 기대어 숨을 거둠', dur: 2.6, grave: 'sword', run: function (g, S) {
  var t = S.t, fd = S.fd, pl = eo(seg(t, 0.35, 0.65)), kn = eo(seg(t, 0.4, 0.8)), br = t > 0.8 && t < 2.0 ? Math.sin((t - 0.8) * 7) * 0.03 * (1 - seg(t, 0.8, 2.0)) : 0;
  S.at(0.05, 'b', function () { S.blood(8); S.sfx('crit'); });
  S.at(0.62, 'pl', function () { S.sfx('slash'); S.dust(3, fd * 5); });
  splat(g, S.X0, S.Y0 + 0.5, 3.6 * eo(seg(t, 0.9, 1.9)), 0.85);
  S.body({ dx: fd * kn * 1, sy: 1 - kn * 0.22 + br, rot: fd * (kn * 0.22 + eo(seg(t, 1.6, 2.1)) * 0.12), a: S.fade(0.72) });
  if (t > 0.35) sword(g, S.X0 + fd * 6, S.Y0 - 12 + pl * 2, PI / 2, 11);      // 몸 앞에 꽂힌 검 (끝까지 남는다)
} };
SC.stagger = { name: '세 걸음 물러서다 엎어짐', dur: 2.2, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, st = [0, 0.3, 0.6], back = 0, i;
  for (i = 0; i < 3; i++) { back += eo(seg(t, st[i], st[i] + 0.22)) * 2.2; S.at(st[i], 's' + i, function () { S.blood(3, { spd: 18 }); S.sfx(i ? 'hit' : 'crit'); }); }
  var fall = ei(seg(t, 1.0, 1.35));
  S.body({ dx: -fd * back, dy: -Math.abs(Math.sin(t / 0.3 * PI)) * (t < 0.9 ? 0.8 : 0), rot: fd * fall * PI / 2 + (t < 1.0 ? -fd * 0.1 : 0), a: S.fade(0.75) });
  S.at(1.35, 'd', function () { S.sfx('die'); S.dust(6); });
  splat(g, S.X0 - fd * 1, S.Y0 + 0.5, 4 * eo(seg(t, 1.4, 2.0)), 0.9);
} };
SC.crush = { name: '무거운 일격에 흙먼지 속으로 쓰러짐', dur: 1.8, grave: 'tomb', run: function (g, S) {
  var t = S.t, fd = S.fd, sq = eo(seg(t, 0, 0.12)) * (1 - eo(seg(t, 0.12, 0.4)) * 0.4);
  S.at(0, 'b', function () { S.sfx('boom'); S.shake(0.35); S.blood(14, { spd: 36 }); S.dust(14); S.ring('#c8b48a', 14); });
  S.body({ sy: 1 - sq * 0.5, sx: 1 + sq * 0.25, rot: fd * ei(seg(t, 0.4, 0.75)) * PI / 2, a: S.fade(0.72) });
  if (t < 1.0) { var dq = seg(t, 0, 1.0); g.globalAlpha = 0.55 * (1 - dq); g.fillStyle = '#c8b48a'; g.beginPath(); g.ellipse(S.X0, S.Y0 - 2 - dq * 3, 6 + dq * 6, 3 + dq * 2, 0, 0, PI * 2); g.fill(); g.globalAlpha = 1; }
  splat(g, S.X0 + fd * 4, S.Y0 + 0.5, 4.5 * eo(seg(t, 0.8, 1.5)), 0.9);
} };
DS.DEATH_SCENES = SC;
var GENERIC = ['kneel', 'flyback', 'reach', 'spin', 'planted', 'stagger', 'crush'];

// 장면 고르기: 조건이 맞는 것을 차례로 → 이번 싸움에서 아직 안 쓴 첫째 (몸이 정한 것 — 해골·돌 정령·아이·노년 — 은 겹쳐도 그대로)
V.deathPick = function (v, o) {
  var u = v.u, sim = this.sim, by = o.by && sim && sim.byId ? sim.byId[o.by] : null, sk = by ? this.lastSk && this.lastSk[by.id] : null, fx = sk && this.time - sk.t < 1.6 ? sk.fx : '';
  var bt = (by && by.tags) || [], ut = u.tags || [], tile = '';
  try { tile = DS.TILE_CH && this.map ? DS.TILE_CH[this.map.rows[Math.round(v.y)][Math.round(v.x)]] : ''; } catch (x) { tile = ''; }
  if (u.type === 'm_skeleton' || ut.indexOf('undead') >= 0) return 'bones';
  if (u.type === 'm_spirit') return 'stone';
  if (o.age === 'child') return 'child';
  if (o.age === 'elder') return 'elder';
  var c = [];
  if ((tile === 'water' || tile === 'ford') && u.mt !== 'fly') c.push('sink');
  if (fx === 'fire' || fx === 'meteor' || (!fx && bt.indexOf('fire') >= 0)) c.push('fire');
  if (fx === 'water' || fx === 'ice' || fx === 'blizzard') c.push('ice');
  if (fx === 'thunder') c.push('thunder');
  if (v.lastHt === 'poison' || fx === 'poison') c.push('poison');
  if (fx === 'dark' || fx === 'healDark' || bt.indexOf('demon') >= 0 || bt.indexOf('undead') >= 0) c.push('dusk');
  if (fx === 'quake') c.push('crush');
  if (u.mt === 'fly') c.push('fall');
  if (u.mt === 'horse') c.push('horse');
  if (by && by.rng && by.rng[1] >= 3 && (by.atkKind === 'arrow' || by.atk === 'arrow' || by.dtype !== 'mag')) c.push('arrows');
  if (o.flag) c.push('flag');
  if (o.ally) c.push('arms');
  if (o.light) c.push('thumb');
  if (u.taunt || /templar|pike|shield/.test(u.type || '') || u.cls === 'inf') c.push('shield');
  if (by && (by.role === 'boss' || by.big)) c.push('crush');
  var h = hash((u.mid || u.ch || u.id) + '|' + (u.name || '')), i;
  for (i = 0; i < GENERIC.length; i++) c.push(GENERIC[(h + i) % GENERIC.length]);
  var used = this.dsUsed || (this.dsUsed = {});
  for (i = 0; i < c.length; i++) if (!used[c[i]]) return c[i];
  return c[0];
};
// 죽음 장면을 건다. o: { by, name, flag, flagCol, age, light, force, zoom } — 그린 시간(ms)을 돌려준다 (0 = 걸지 않음)
V.deathScene = function (id, o) {
  var v = this.vu[id]; o = o || {}; if (!v || v.ds || !DS.deathFxOn()) return 0;
  if (!this.onScreen(v.x, v.y)) return 0;
  var u = v.u, near = null, best = 9, k;
  for (k in this.vu) { var w = this.vu[k], wu = w.u; if (w === v || wu.side !== 'ally' || wu.dead || w.dying >= 0) continue; var d = Math.abs(w.x - v.x) + Math.abs(w.y - v.y); if (d <= 1.01 && d < best) { best = d; near = w; } }
  o.ally = !!near;
  var key = o.force || this.deathPick(v, o), S = SC[key]; if (!S) return 0;
  (this.dsUsed || (this.dsUsed = {}))[key] = 1;
  var ds = { k: key, t: 0, dur: S.dur, rate: 1, real: S.dur, done: {}, name: o.name || u.name || '', last: o.last || '', flagCol: o.flagCol || (DS.FLAG && DS.FLAG[u.cls]) || '#f6cf57', wait: false, seed: hash(id + key),
    ally: near ? near.u.id : null, allyOff: near ? (near.x - v.x) * 16 : 0, allyOffY: near ? (near.y - v.y) * 16 : 0, fd: u.face < 0 ? -1 : 1, x: v.x, y: v.y };
  if (near && Math.abs(ds.allyOff) > 1) ds.allyDx = ds.allyOff > 0 ? 1 : -1;
  v.ds = ds; v.dying = 9; v.dieDur = 9; v.alpha = 1; v.flash = 0; v.lunge = null; v.hit = null;
  for (var i = this.shapes.length - 1; i >= 0; i--) if (this.shapes[i].k === 'soul' && Math.abs(this.shapes[i].x - v.x) < 0.6 && Math.abs(this.shapes[i].y - v.y) < 0.6) this.shapes.splice(i, 1);      // 넋은 장면 끝에
  // 줄 세우기: 장면이 돌고 있으면 한 명만 기다린다 (그다음부터는 곧바로, 줌 없이 — 길어지지 않게)
  var busy = this.dz && this.vu[this.dz.id] && this.vu[this.dz.id].ds, waiting = (this.dq || (this.dq = [])).length, cm = calm();
  var zoomOk = o.zoom !== false && !cm && S.zoom !== false && !this.slowSpent() && !(this.dzEnd && nowMs() - this.dzEnd < COOL * 1000);      // 방금 슬로우가 끝났으면(5초 안) 이번엔 늦추지 않는다
  var real = function (d) { ds.real = Math.min(ds.dur, d); ds.rate = ds.dur / ds.real; };      // 장면을 실제 시간 d 초에 맞춘다 (rate > 1 이면 빨리)
  if (busy && waiting < 1) { real(QDUR); ds.brief = true; ds.wait = true; this.dq.push(id); return Math.round((this.dzLeft() + ds.real) * 1000); }
  if (busy) { real(QDUR2); ds.brief = true; return Math.round(ds.real * 1000); }      // 셋째부터: 곧바로, 짧게
  if (zoomOk) { ds.real = Math.min(DMAX, S.dur * STRETCH); ds.rate = S.dur / ds.real; ds.big = true; this.dz = { id: id, t: 0, dur: ds.real + 0.15 }; }      // 첫 사람: 느리게 늘인 장면 + 줌·슬로우
  else if (cm) real(1.8);      // 움직임 줄이기: 줌·슬로우 없이 조금 짧게
  ds.calm = cm;
  return Math.round(ds.real * 1000);
};
V.dzLeft = function () { var s = 0, d = this.dz; if (d) s += Math.max(0, d.dur - d.t); (this.dq || []).forEach(function (id) { var w = this.vu[id]; if (w && w.ds) s += w.ds.real || w.ds.dur; }, this); return s; };
V.slowSpent = function () { return (this.slowAcc || 0) >= SLOWBUD; };
// 줌·슬로우 (실제 시간). 한 프레임에 한 번 — 배율을 돌려준다
V.dzTick = function (dt) {
  var d = this.dz;
  this.dzAt = this.time;
  if (d) { d.t += dt; if (d.t >= d.dur || d.t >= DZCAP || !this.vu[d.id]) { if (!d.nz) this.dzEnd = nowMs(); this.dz = null; d = null; } }
  if (!d && this.dq && this.dq.length) {      // 다음 사람: 줌 없이 장면만
    var id = this.dq.shift(), w = this.vu[id]; if (w && w.ds) { w.ds.wait = false; this.dz = d = { id: id, t: 0, dur: w.ds.real || w.ds.dur, nz: true }; }      // 한 명씩, 줌·슬로우 없이
  }
  var z = 1, s = 1, vg = 0;
  if (d && !d.nz) {
    var zi = ss(d.t / ZIN), zo = ss((d.dur - d.t) / ZOUT), e = Math.min(zi, zo);      // 부드럽게 들어가고 부드럽게 나온다
    z = 1 + (ZOOM - 1) * e; vg = e;
    s = 1 - (1 - SLOW) * Math.min(ss(d.t / 0.3), ss((d.dur - d.t) / 0.5));
  }
  if (s < 1) this.slowAcc = (this.slowAcc || 0) + dt; else this.slowAcc = Math.max(0, (this.slowAcc || 0) - dt * 0.6);      // 슬로우 예산: 늦춘 만큼 쌓이고 풀린 시간에 줄어든다
  if (this.slowAcc >= SLOWBUD + 1) s = 1;
  this.zk = z; this.slowF = s; this.dzVig = vg;
  return z;
};
function ss(x) { x = cl(x); return x * x * (3 - 2 * x); }
V.slowMul = function () { var s = this.slowF || 1; if (s < 1 && (!this.dz || this.time - (this.dzAt || 0) > 0.5)) { this.slowF = 1; return 1; } return s < SLOW ? SLOW : s; };      // r30: 줌이 끝났거나 dzTick 이 돌지 않으면(그림 오류 등) 늦춤은 남지 않는다
// r30: 화면 좌표 덧그림 — 어두운 테두리(줌과 함께) · 말풍선(마지막 한마디)
V.drawDeathOver = function (g) {
  var a = this.dzVig || 0, W = this.W, H = this.H, id, v, ds;
  if (a > 0.01) {
    var d = this.dz, f = d && this.vu[d.id], c = f ? this.screenOf(f.x, f.y - 0.4) : { x: W / 2, y: H / 2 };
    var gr = g.createRadialGradient(c.x, c.y, Math.min(W, H) * 0.12, c.x, c.y, Math.max(W, H) * 0.62);
    gr.addColorStop(0, 'rgba(8,4,14,0)'); gr.addColorStop(0.4, 'rgba(8,4,14,' + (0.42 * a).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(8,4,14,' + (0.9 * a).toFixed(3) + ')');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  for (id in this.vu) {
    v = this.vu[id]; ds = v.ds; if (!ds || ds.wait || ds.brief || !ds.last) continue;
    var rt = ds.t / ds.rate, R = ds.real, t0 = Math.min(0.3, R * 0.1), t1 = R * 0.66;      // 실제 시간으로: 0.3초 뒤 뜨고 장면의 2/3 에서 걷힌다
    if (rt < t0 || rt > t1 + 0.25) continue;
    var al = Math.min(1, (rt - t0) / 0.15) * (rt > t1 ? 1 - (rt - t1) / 0.25 : 1), n = Array.from(ds.last), shown = ds.calm ? n.length : Math.min(n.length, Math.ceil((rt - t0) / 0.055));      // 한 글자씩 (움직임 줄이기면 한 번에)
    bubble(g, this, ds, n.slice(0, shown).join(''), ds.last, al);
  }
};
function bubble(g, V0, ds, txt, full, al) {
  var k = V0.k, s = V0.screenOf(ds.x, ds.y), top = (V0.inset && V0.inset.top) || 0, W = V0.W;
  g.save(); g.globalAlpha = Math.max(0, Math.min(1, al));
  g.font = DS.cvFont ? DS.cvFont(12) : '700 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  var tw = g.measureText(full).width, bw = Math.round(tw + 18), bh = 22, hy = s.y - 13 * k;      // 머리 위
  var bx = Math.max(6, Math.min(W - bw - 6, s.x - bw / 2)), by = Math.max(top + 6, hy - bh - 9), tx = Math.max(bx + 10, Math.min(bx + bw - 10, s.x));
  g.fillStyle = 'rgba(16,12,24,.9)'; g.strokeStyle = 'rgba(239,230,208,.75)'; g.lineWidth = 1;
  g.beginPath(); var r = 5;
  g.moveTo(bx + r, by); g.lineTo(bx + bw - r, by); g.quadraticCurveTo(bx + bw, by, bx + bw, by + r); g.lineTo(bx + bw, by + bh - r); g.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
  if (by + bh < hy) { g.lineTo(tx + 5, by + bh); g.lineTo(tx, Math.min(hy, by + bh + 8)); g.lineTo(tx - 5, by + bh); }      // 꼬리
  g.lineTo(bx + r, by + bh); g.quadraticCurveTo(bx, by + bh, bx, by + bh - r); g.lineTo(bx, by + r); g.quadraticCurveTo(bx, by, bx + r, by); g.closePath();
  g.fill(); g.stroke();
  g.textAlign = 'left'; g.fillStyle = '#efe6d0'; g.fillText(txt, Math.round(bx + 9), Math.round(by + bh / 2 + 1));
  g.restore();
}
// r32 전투 대사: 유닛 머리 위의 짧은 말풍선 (죽음 장면의 말풍선과 같은 꼴). 실제 시간 life 초, 0.15초에 떠서 끝 0.3초에 걷힌다. 한 번에 둘까지.
V.bark = function (id, text, life) {
  var B = this.barks || (this.barks = []);
  for (var i = B.length - 1; i >= 0; i--) if (B[i].id === id) B.splice(i, 1);
  if (B.length >= 2) B.shift();
  B.push({ id: id, text: String(text), t0: this.time, life: life || 2 });
};
V.drawBarks = function (g) {
  var B = this.barks; if (!B || !B.length) return;
  for (var i = B.length - 1; i >= 0; i--) {
    var b = B[i], v = this.vu[b.id], rt = this.time - b.t0;
    if (!v || v.dying >= 0 || v.gone || rt > b.life) { B.splice(i, 1); continue; }
    var al = Math.min(1, rt / 0.15) * (rt > b.life - 0.3 ? Math.max(0, (b.life - rt) / 0.3) : 1);
    bubble(g, this, { x: v.x, y: v.y }, b.text, b.text, al);
  }
};
V.dzFocus = function () { var d = this.dz; return d && !d.nz && this.vu[d.id] ? this.vu[d.id] : null; };

// 그리기: 장면 중인 유닛은 drawUnit 대신 이것이 그린다
V.drawDeath = function (g, v) {
  var u = v.u, ds = v.ds, S = SC[ds.k], self = this, px = ds.x * 16, py = ds.y * 16;
  var sp = DS.unitSprite(u), spn = v.dn || sp[0], pal = v.dn ? null : sp[1], fd = ds.fd, big = !!u.big, merc = u.side === 'ally' && u.role !== 'cmd';
  var cv = DS.spriteCanvas(spn, pal, { flip: fd < 0, hd: 1 }), W = big ? 24 * (merc ? 0.88 : 1) : merc ? 13 : (cv.lw || cv.width / 2), X0 = px + 8, Y0 = py + 14 + (u.mt === 'fly' && ds.k !== 'fall' ? -3 : 0);
  if (ds.wait) {      // 차례를 기다린다: 무릎이 반쯤 꺾인 채 붉게 깜빡
    g.save(); g.translate(X0, Y0); g.scale(1, 0.92); g.drawImage(cv, -W / 2, -W, W, W); g.globalAlpha = 0.25 + 0.2 * Math.sin(this.time * 12); g.drawImage(DS.spriteCanvas(spn, pal, { flip: fd < 0, hd: 1, tint: '#ff3040' }), -W / 2, -W, W, W); g.restore(); g.globalAlpha = 1; return;
  }
  var t = ds.t, St = {
    t: t, f: t / ds.dur, fd: fd, X0: X0, Y0: Y0, W: W, ds: ds, dt: ds.dt || 0, flagCol: ds.flagCol, allyOff: ds.allyOff, allyOffY: ds.allyOffY, allyDx: ds.allyDx, c2: null,
    at: function (tt, key, fn) { if (t >= tt && !ds.done[key]) { ds.done[key] = 1; try { fn(); } catch (x) {} } },
    fade: function (from) { return 1 - cl((t / ds.dur - from) / (1 - from)); },
    sfx: function (n) { self.sfx(n); },
    blood: function (n, o) { o = o || {}; self.burst(ds.x, ds.y - 0.35, BLOOD, n, { spd: o.spd || 30, up: 18, grav: 120, life: 0.6, spread: 5, size: 1 }); },
    dots: function (cols, n, o) { self.burst(ds.x + (o.dx || 0), ds.y - (o.lift || 0), cols, n, o); },
    dust: function (n, dx) { self.burst(ds.x + (dx || 0) / 16, ds.y + 0.3, ['#c8b48a', '#a8956c', '#e2d4b0'], n, { spd: 22, up: 6, grav: 10, life: 0.5, spread: 10, size: 2 }); },
    ring: function (c, r) { self.rings.push({ x: ds.x, y: ds.y + 0.35, t: 0, dur: 0.6, c: c, r: r }); },
    shake: function (s) { if (!calm()) self.shake = Math.max(self.shake, s); },
    flash: function (a) { if (!calm()) self.flashA = Math.max(self.flashA, a); },
    light: function (c, r, a, life) { self.light(X0, Y0 - 6, r, c, a, life); },
    bolt: function () { self.shape({ k: 'bolt', x: ds.x, y: ds.y, dur: 0.3, pts: (function () { var pts = [], sx = X0 + (Math.random() * 10 - 5), sy = Y0 - 70; pts.push([sx, sy]); for (var i = 1; i < 6; i++) pts.push([X0 + (sx - X0) * (1 - i / 6) + (i % 2 ? 4 : -4), sy + (Y0 - 6 - sy) * i / 6]); pts.push([X0, Y0 - 6]); return pts; })() }); },
    body: function (o) {
      o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0.01) return;
      g.save(); g.translate(X0 + (o.dx || 0), Y0 + (o.dy || 0));
      if (o.cut != null) { var lim = o.cut - (Y0 + (o.dy || 0)); g.beginPath(); g.rect(-W, -W * 2, W * 2, W * 2 + lim); g.clip(); }
      g.rotate(o.rot || 0); g.scale(o.sx == null ? 1 : (Math.abs(o.sx) < 0.08 ? 0.08 : o.sx), o.sy == null ? 1 : o.sy);
      if (o.clipTop) { g.beginPath(); g.rect(-W, -W + W * o.clipTop, W * 2, W * (1 - o.clipTop) + 2); g.clip(); }
      var c0 = o.sx != null && o.sx < 0 ? DS.spriteCanvas(spn, pal, { flip: fd > 0, hd: 1 }) : cv;
      g.globalAlpha = a; g.drawImage(c0, -W / 2, -W, W, W);
      if (o.ta > 0.01 && o.tint) { g.globalAlpha = a * Math.min(1, o.ta); g.drawImage(DS.spriteCanvas(spn, pal, { flip: c0 === cv ? fd < 0 : fd > 0, hd: 1, tint: o.tint }), -W / 2, -W, W, W); }
      g.globalAlpha = a; if (o.extra) o.extra(g);
      g.restore(); g.globalAlpha = 1;
    }
  };
  if (ds.k !== 'sink') { g.globalAlpha = 0.25 * St.fade(0.6); g.fillStyle = '#000'; g.beginPath(); g.ellipse(X0, Y0, W * 0.32, W * 0.1, 0, 0, PI * 2); g.fill(); g.globalAlpha = 1; }      // 발밑 그림자
  S.run(g, St);
  g.globalAlpha = 1;
};
// 장면이 끝났다: 넋이 오르고, 그 자리에 표시가 남는다 (그 싸움 동안)
V.deathEnd = function (v) {
  var ds = v.ds, S = SC[ds.k]; if (!S) return;
  this.shape({ k: 'soul', x: ds.x, y: ds.y, dur: 0.9, c: v.u.role === 'merc' && v.u.grade && DS.GRADES ? DS.GRADES[v.u.grade].col : '#cdd5e3' });
  var gv = this.graves || (this.graves = []); this.gOff = 0;
  if (S.grave !== 'none' && gv.length < 16) gv.push({ k: S.grave, x: ds.x, y: ds.y, fd: ds.fd, c: ds.flagCol, bn: ds.bn || null, t: this.time });
};
V.deathTick = function (v, dt) {
  var ds = v.ds; if (ds.wait) { v.dying = 9; return; }
  ds.dt = dt * (ds.rate || 1); ds.t += ds.dt; v.alpha = 1; this.dsSeen = this.time;      // r30: 장면 시간은 rate 로 (첫 사람은 느리게, 줄 선 사람은 빠르게)
  var bub = ds.last && !ds.brief;      // 말풍선이 한마디를 먼저 했으면 이름 밑은 「잠들다」
  if (!ds.said && ds.t >= ds.dur * (bub ? 0.62 : 0.55)) { ds.said = true; this.float(ds.x, ds.y, ds.name, '#efe6d0', { dy: -18, life: 2.6 }); this.float(ds.x, ds.y, '「' + (bub ? '잠들다' : ds.last || '잠들다') + '」', '#a7a1c2', { dy: -8, life: !bub && ds.last ? 3.4 : 2.6, small: true, delay: 0.25 }); }      // r24: 아홉은 제 한마디를
  if (ds.t >= ds.dur) { this.deathEnd(v); v.dying = 0.0001; v.ds = null; v.gone = true; v.alpha = 0; }
  else v.dying = 9;
};
// 남은 표시: 묘비·깃발·검·돌무더기·뼈 (싸움이 끝나고 조금 뒤 사라진다)
V.drawGraves = function (g, dt) {
  var gv = this.graves; if (!gv || !gv.length) return;
  if (this.sim && !this.sim.combat) { this.gOff = (this.gOff || 0) + dt; if (this.gOff > 4) { gv.length = 0; this.gOff = 0; return; } } else this.gOff = 0;
  var fa = this.gOff > 3 ? 1 - (this.gOff - 3) : 1;
  for (var i = 0; i < gv.length; i++) {
    var q = gv[i], x = q.x * 16 + 8, y = q.y * 16 + 14, a = Math.min(1, (this.time - q.t) / 0.4) * fa;
    if (q.k === 'tomb') tomb(g, x, y, a);
    else if (q.k === 'flag') { g.globalAlpha = a; flag(g, x - q.fd * 3, y, q.fd * 0.5, q.c, 1, 20); g.globalAlpha = 1; }
    else if (q.k === 'sword') { g.globalAlpha = a; sword(g, x + q.fd * 5, y - 10, PI / 2, 10); g.globalAlpha = 1; }
    else if (q.k === 'rubble') rubble(g, x, y + 0.5, a, 9);
    else if (q.k === 'bones') { g.globalAlpha = a; if (q.bn) q.bn.forEach(function (b) { if (b.sk) skull(g, b.x, b.y - 1); else bone(g, b.x, b.y, b.r, false); }); g.globalAlpha = 1; }
  }
};
})();
