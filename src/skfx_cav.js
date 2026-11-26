// 전민 — 기술 연출: 기병 (돌격 · 말굽 · 창끝. 윗길은 번개를 끄는 기사). 틀과 쓰는 법은 src/skfx.js · docs/SKILL_FX.md.
//   이 파일이 맡는 기술: cmd_cav · cav_charge (T1) · cav_trample · cav_hunt (T2) · xcav_charge · xcav_bolt · xcav_storm (T3) · u_goldrush · u_stampede · u_debt (T4) · ux_* 셋 (T5)
//   빛깔: 금빛(#ffe27a · #fff6d0 · #e8bb45) · 흙먼지 · 붉은 창 깃발. 윗길의 번개는 흰 심 · 옅은 금 · 하늘빛 테 (법사의 보랏빛 번개와 다르다)
//   무늬: 땅에 찍히는 말굽 자국 · 깃발 달린 창 · 길을 긋는 금빛 줄기 · 금화(빚) · 길 위의 먹구름
//   고친 표 (옛 → 새 · tools/skdmg.js 새 ÷ 옛: 허수아비 / 싸움판):
//     cmd_cav      설명의 긴 줄표만 걷음
//     cav_charge   150% 바로 → 같은 값, 0.14초 당겼다가                                       1.00 / 1.00
//     cav_trample  135% 한 번 → 앞발 두 번 70% + 78% (둔화는 둘째에)                           1.00 / 0.98
//     cav_hunt     150% 바로 → 같은 값, 달려든 뒤 0.16초에 창                                  1.00 / 1.00
//     xcav_charge  190% 한 번 → 번개가 먼저 85%(옮겨 감 50%), 그 길로 달려 115%(게이지)        0.99 / 0.99
//     xcav_bolt    240% 한 번 → 창 95% + 그 창에 벼락 155%(옮겨 감 60%)                        1.01 / 1.01
//     xcav_storm   240% → 200% + 먹구름이 길 위에 3초 남아 1초마다 30%                          1.04 / 0.98
//     u_goldrush   260% 바로 → 같은 값, 0.45초 당겼다가                                         1.00 / 1.00
//     u_stampede   180% 한 번 → 세 번 60% + 65% + 90% (둔화 · 내 행동 소모는 셋째에)            1.02 / 1.02
//     u_debt       270% 바로 → 같은 값, 달려들어 동전을 튕긴 뒤 0.4초에                         1.00 / 1.00
//     ux_goldrush  340% + 옮겨 감 60% → 250%, 0.8초 뒤 천둥이 그 길을 따라 100%(옮겨 감 60%)    0.99 / 0.99
//     ux_stampede  240% 한 번 → 네 번 55% + 60% + 65% + 105%                                    1.02 / 1.02
//     ux_debt      360% 한 번 → 원금 220% + 이자(벼락) 150%                                     1.01 / 1.00
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var X = DS.skfx; if (!X) return;
var P = X.PAL.cav = { gold: '#ffe27a', pale: '#fff6d0', deep: '#e8bb45', dark: '#8a5a14', white: '#ffffff', red: '#c8323c', dust: '#d8c39a', earth: '#a8754a', dirt: '#6f4a2c', print: '#3a2a1c',
  bolt: '#fff0a0', sky: '#bfe0ff', storm: '#7fa8e6', cloud: '#3d4660', cloud2: '#5c6a8a', wood: '#b08a4a', ash: '#1b1622', mend: '#b6f0a0' };
var GOLD = [P.gold, P.pale, P.white], DUST = [P.dust, P.earth, P.dirt], BOLT = [P.white, P.bolt, P.sky], COIN = [P.gold, P.deep, P.pale];

// ───────── 기술 표 ─────────
X.def('cmd_cav', { desc: '호령. 모든 아군의 공격 +12% (12초), 게이지 +40.' });
// 돌파: 창을 당겼다가(0.14초) 달려 나간다. 수치는 그대로
X.def('cav_charge', { beats: [0.14] });
// 말발굽: 한 번(135%) → 앞발로 두 번 70% + 75% (방어는 맞을 때마다 빠지므로 합을 조금 올린다)
X.def('cav_trample', { beats: [0.2, 0.42],
  eff: [{ t: 'dmg', m: 0.7 }, { t: 'dmg', m: 0.78, b: 1 }, { t: 'status', s: 'slow', dur: 6, b: 1 }],
  desc: '말을 세워 앞발로 두 번 내리찍는다. 둘레 1칸 적에게 70%, 이어서 78%와 둔화.' });
// 추격: 달려든 뒤(0.16초) 창이 닿는다. 수치는 그대로
X.def('cav_hunt', { beats: [0.16] });
// 뇌전 돌파: 한 번(190%) → 번개가 먼저 길을 달리고(85% · 옮겨 감), 그 길로 꿰뚫는다(115% · 게이지)
X.def('xcav_charge', { beats: [0.16, 0.42],
  eff: [{ t: 'dmg', m: 0.85 }, { t: 'chain', n: 2, r: 2, m: 0.5 }, { t: 'dmg', m: 1.15, b: 1 }, { t: 'gauge', v: -30, b: 1 }],
  desc: '번개가 먼저 직선 5칸을 달린다. 85%, 곁의 둘에게 50%. 곧이어 그 길을 꿰뚫고 달려 나간다. 115%, 게이지를 깎는다.' });
// 천둥 창: 한 번(240%) → 창을 꽂고(95%), 그 창에 벼락이 떨어진다(155% · 옮겨 감)
X.def('xcav_bolt', { beats: [0.18, 0.45],
  eff: [{ t: 'dmg', m: 0.95, vs: 'low', vx: 1.4 }, { t: 'dmg', m: 1.55, vs: 'low', vx: 1.4, b: 1 }, { t: 'chain', n: 3, r: 2, m: 0.6, b: 1 }],
  desc: '2~5칸 밖의 적에게 뛰어들어 창을 꽂는다. 95%. 그 창에 벼락이 떨어져 155%, 곁의 셋에게 60%. 체력이 절반 아래인 적에게 1.4배.' });
// 뇌운 질주: 240% → 200% + 길 위에 먹구름이 3초 남아 1초마다 벼락 20%
X.def('xcav_storm', { beats: [0.25],
  eff: [{ t: 'dmg', m: 2.0 }, { t: 'gauge', v: -40 }, { t: 'chain', n: 4, r: 2, m: 0.5 }],
  zone: { dur: 3, every: 1, k: 'storm', eff: [{ t: 'dmg', m: 0.3 }] },
  desc: '먹구름을 끌고 직선 7칸을 달린다. 길 위의 적에게 200%, 게이지를 깎고 곁의 넷에게 번개(50%). 먹구름은 3초 동안 길 위에 남아 1초마다 벼락 30%.' });
// 황금 돌격: 길게 당겼다가(0.45초) 한 번에. 수치는 그대로
X.def('u_goldrush', { beats: [0.45] });
// 뇌광 돌격: 340% + 옮겨 감 → 250% 로 꿰뚫고, 0.8초 뒤 천둥이 그 길을 따라 친다 100% (옮겨 감은 천둥에)
X.def('ux_goldrush', { beats: [0.5],
  eff: [{ t: 'dmg', m: 2.5 }, { t: 'gauge', v: -60 }],
  zone: { dur: 0.8, every: 0.8, k: 'gold', eff: [{ t: 'dmg', m: 1.0 }, { t: 'chain', n: 3, r: 2, m: 0.6 }] },
  desc: '직선 8칸을 번개처럼 꿰뚫는다. 250%, 게이지를 깎는다. 0.8초 뒤 천둥이 그 길을 따라 친다. 100%, 곁의 셋에게 번개(60%).' });
// 말발굽 폭풍: 한 번(180%) → 한 바퀴 돌며 세 번 55% + 60% + 80%. 천둥 말발굽: 한 번(240%) → 네 번 50% + 55% + 60% + 100%
X.def('u_stampede', { beats: [0.3, 0.55, 0.85],
  eff: [{ t: 'dmg', m: 0.6 }, { t: 'dmg', m: 0.65, b: 1 }, { t: 'dmg', m: 0.9, b: 2 }, { t: 'status', s: 'slow', dur: 8, b: 2 }, { t: 'buff', s: 'quick', p: 30, dur: 10, to: 'self', b: 2 }],
  desc: '말을 세우고 한 바퀴 돌며 둘레 2칸을 세 번 짓밟는다. 60%, 65%, 90%와 둔화. 10초 동안 내 행동 소모 −30%.' });
X.def('ux_stampede', { beats: [0.3, 0.52, 0.74, 1.05],
  eff: [{ t: 'dmg', m: 0.55 }, { t: 'dmg', m: 0.6, b: 1 }, { t: 'dmg', m: 0.65, b: 2 }, { t: 'dmg', m: 1.05, b: 3 }, { t: 'status', s: 'slow', dur: 10, b: 3 }, { t: 'buff', s: 'quick', p: 40, dur: 12, to: 'self', b: 3 }],
  desc: '둘레 2칸을 네 번 짓밟는다. 말굽마다 천둥이 친다. 55%, 60%, 65%, 마지막에 105%와 둔화. 12초 동안 내 행동 소모 −40%.' });
// 빚은 갚는다: 달려들어 동전을 튕기고(0.4초) 받아 낸다. 벼락 빚잔치: 한 번(360%) → 원금 220% + 이자(벼락) 150%
X.def('u_debt', { beats: [0.4] });
X.def('ux_debt', { beats: [0.4, 0.85],
  eff: [{ t: 'dmg', m: 2.2, drain: 0.5, vs: 'low', vx: 1.6 }, { t: 'dmg', m: 1.5, drain: 0.5, vs: 'low', vx: 1.6, b: 1 }],
  desc: '5칸 안의 적에게 벼락처럼 달려들어 220%. 곧이어 이자로 벼락 150%. 체력이 절반 아래인 적에게 1.6배. 준 피해의 절반만큼 회복.' });

// ───────── 소리 ─────────
X.sound('cav_gallop', function (tone, noise) { [0, 0.06, 0.13].forEach(function (d, i) { noise(0.045, 0.16, 360 + i * 40, 0.9, d); }); tone(150, 110, 0.06, 'triangle', 0.05, 0.13); }, 3.7);      // 말굽 셋
X.sound('cav_stomp', function (tone, noise) { noise(0.18, 0.28, 200, 0.7, 0, 'lowpass'); tone(120, 46, 0.18, 'square', 0.09); noise(0.03, 0.1, 1700, 1.2, 0.01); }, 1.6);      // 앞발이 땅을 찍는다
X.sound('cav_lance', function (tone, noise) { noise(0.05, 0.2, 2600, 1.2); tone(720, 210, 0.09, 'sawtooth', 0.05); noise(0.09, 0.16, 480, 0.9, 0.03); }, 3.67);      // 창끝이 꿰뚫는다
X.sound('cav_rush', function (tone, noise) { noise(0.28, 0.12, 1300, 0.6); [0, 0.05, 0.1, 0.15].forEach(function (d) { noise(0.04, 0.14, 380, 0.9, d); }); tone(170, 60, 0.26, 'square', 0.08, 0.04); }, 1.6);      // 달려 나간다: 바람 · 말굽 · 낮은 한 방
X.sound('cav_coin', function (tone) { tone(1568, 1568, 0.04, 'square', 0.03); tone(1976, 1976, 0.12, 'triangle', 0.03, 0.04); }, 4.1);      // 금화가 튄다
X.sound('cav_spark', function (tone, noise) { noise(0.04, 0.12, 3400, 1.2); noise(0.04, 0.1, 2300, 1.0, 0.06); tone(1500, 600, 0.04, 'sawtooth', 0.025, 0.02); }, 5.3);      // 창끝에 이는 불꽃

// ───────── 그림 조각 ─────────
function hoofU(g, x, y, dx, dy, k) {      // 말굽 자국: 열린 쪽이 온 쪽
  if (Math.abs(dx) >= Math.abs(dy)) { var s = dx >= 0 ? 1 : -1; g.fillRect(x - k, y - 2 * k, 3 * k, k); g.fillRect(x - k, y + 2 * k, 3 * k, k); g.fillRect(s > 0 ? x + 2 * k : x - 2 * k, y - k, k, 3 * k); }
  else { var t = dy >= 0 ? 1 : -1; g.fillRect(x - 2 * k, y - k, k, 3 * k); g.fillRect(x + 2 * k, y - k, k, 3 * k); g.fillRect(x - k, t > 0 ? y + 2 * k : y - 2 * k, 3 * k, k); }
}
// 땅의 말굽 자국: dx · dy 달리는 쪽 · c 처음에 달아오른 빛 · s 크기(1 · 2). air = 맞은 이 위에 찍히는 금빛 편자 (잠깐)
X.kind('cav_hoof', { L: 0, draw: function (g, p, f, time, V, cx, cy) {
  var x = Math.round(cx), y = Math.round(cy + 5), k = p.s || 1;
  if (p.air) { y = Math.round(cy - 1 - (1 - Math.min(1, f * 6)) * 6); g.globalAlpha = (f > 0.5 ? (1 - f) / 0.5 : 1) * 0.5; g.fillStyle = P.print; hoofU(g, x, y + 1, p.dx || 1, p.dy || 0, k); g.globalAlpha = f > 0.5 ? (1 - f) / 0.5 : 1; g.fillStyle = f < 0.3 ? '#ffffff' : (p.c || P.gold); hoofU(g, x, y, p.dx || 1, p.dy || 0, k); return; }
  g.globalAlpha = X.env(f, 0.05, 0.5) * 0.7; g.fillStyle = P.print; hoofU(g, x, y, p.dx || 1, p.dy || 0, k);
  if (p.c && f < 0.4) { g.globalAlpha = 1 - f / 0.4; g.fillStyle = p.c; hoofU(g, x, y - 1, p.dx || 1, p.dy || 0, k); }
} });
// 깃발 달린 창: (x, y) 가 창끝이 닿는 칸. a 방향 · len 길이 · go 달려오는 거리(픽셀) · gt 그 몫 · plant 땅에 꽂혀 선다(lean 기울기)
X.kind('cav_lance', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var L = DS.VX.pxLine, ca = Math.cos(p.a || 0), sa = Math.sin(p.a || 0), len = p.len || 14, w = p.w || 1, q, tx, ty, bx, by, fl = Math.sin(time * 18 + (p.sd || 0)) > 0 ? 1 : 0;
  g.globalAlpha = f > 0.7 ? (1 - f) / 0.3 : 1;
  if (p.plant) { q = Math.min(1, f / 0.1); tx = cx; ty = cy + 4; bx = cx - (p.lean || 0); by = ty - len * q; ca = (tx - bx) / len; sa = 1; }
  else { q = X.ease(Math.min(1, f / (p.gt || 0.3))); tx = cx + ca * (p.go || 0) * (q - 1); ty = cy - 3 + sa * (p.go || 0) * (q - 1); bx = tx - ca * len; by = ty - sa * len; }
  g.fillStyle = p.c2 || P.wood; L(g, bx, by, tx, ty, w);
  g.fillStyle = p.c || P.gold; L(g, tx - (tx - bx) * 0.3, ty - (ty - by) * 0.3, tx, ty, w + 1);
  g.fillStyle = '#ffffff'; g.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 2, 2);
  g.fillStyle = p.flag || P.red; q = p.plant ? 0.12 : 0.55; g.fillRect(Math.round(bx + (tx - bx) * q) + (p.plant ? 1 : 0), Math.round(by + (ty - by) * q) - (p.plant ? 0 : 3) + fl, 4, 2); g.fillRect(Math.round(bx + (tx - bx) * q) + (p.plant ? 1 : 0), Math.round(by + (ty - by) * q) - (p.plant ? 0 : 3) + 2 - fl, 3, 1);
} });
// 금화: 돌면서(너비가 변한다) 튀어 오르거나(h) (x1, y1) 로 날아간다. s 반지름 · hov 떠 있는 높이
X.kind('cav_coin', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var x = cx, y = cy, r = p.s || 2, wk = Math.max(0.3, Math.abs(Math.cos(time * (p.spin || 14) + (p.sd || 0)))), i, hw, pass, R;
  if (p.x1 != null) { x += (p.x1 - p.x) * 16 * f; y += (p.y1 - p.y) * 16 * f; }
  y -= (p.h || 0) * 4 * f * (1 - f); x = Math.round(x); y = Math.round(y);
  g.globalAlpha = X.env(f, 0.05, 0.12);
  for (pass = 0; pass < 2; pass++) {      // 어두운 테 → 금빛 낯
    g.fillStyle = pass ? (p.c || P.gold) : P.dark; R = r + 1 - pass;
    for (i = -R; i <= R; i++) { hw = Math.max(1, Math.round(Math.sqrt(Math.max(0, R * R - i * i + 0.6)) * wk + (pass ? 0 : 0.5))); g.fillRect(x - hw, y + i, hw * 2, 1); }
  }
  g.fillStyle = '#ffffff'; g.fillRect(x - Math.max(1, Math.round(r * wk * 0.5)), y - r + 1, 1, Math.max(1, r));
} });
// 앞으로! 의 꺾쇠(»): dir 향하는 쪽 · go 밀려 나가는 픽셀
X.kind('cav_chev', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var s = p.dir < 0 ? -1 : 1, x = Math.round(cx + s * (p.go || 6) * (X.ease(f) - 0.5)), y = Math.round(cy), k, i;
  g.globalAlpha = X.env(f, 0.15, 0.4);
  for (k = 0; k < (p.n || 2); k++) { g.fillStyle = k ? p.c : (p.c2 || '#ffffff'); for (i = -2; i <= 2; i++) g.fillRect(x - s * k * 4 + s * (2 - Math.abs(i)) - (s < 0 ? 1 : 0), y + i, 2, 1); }
} });

// ───────── 연출 ─────────
// 달리는 길의 끝 칸 (직선 기술). n = 칸 수
function lane(c) { var T = c.tiles, i, d, bd = -1, e = null; for (i = 0; i < T.length; i++) { d = Math.abs(T[i][0] - c.ux) + Math.abs(T[i][1] - c.uy); if (d > bd) { bd = d; e = T[i]; } } return e ? { x: e[0], y: e[1], n: Math.max(1, Math.round(bd)) } : { x: c.ux + c.dx, y: c.uy + c.dy, n: 1 }; }
function dust(c, x, y, n) { c.burst(x, y + 0.3, DUST, n, { up: 14, grav: 60, spd: 18, life: 0.4, spread: 8 }); }
function hoof(c, x, y, dx, dy, o) { o = o || {}; return c.fx('cav_hoof', { x: x, y: y, dx: dx, dy: dy, c: o.c, s: o.s, d: o.d || 0, dur: o.dur || 1.2 }); }
// 두 점 사이에 말굽 자국 n 개 (좌우로 엇갈려, 차례로)
function prints(c, x0, y0, x1, y1, n, o) {
  o = o || {}; var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1, px = -dy / L * 0.2, py = dx / L * 0.2, k, q;
  for (k = 0; k < n; k++) { q = (k + 0.7) / (n + 0.4); hoof(c, x0 + dx * q + (k % 2 ? px : -px), y0 + dy * q + (k % 2 ? py : -py), dx, dy, { c: o.c, s: o.s, d: (o.d || 0) + k * (o.gap || 0.02), dur: o.dur }); }
}
// 돌파의 한 줄: 금빛 줄기 · 길 위의 말굽 · 맞은 이마다 창끝 불티 (달리는 차례로)
function rush(c, o) {
  var e = lane(c), x0 = c.ux, y0 = c.uy;
  c.fx('beam', { x0: x0, y0: y0, x1: e.x, y1: e.y, w: o.w || 3, c: o.c || P.gold, c2: o.c2 || P.pale, dur: o.dur || 0.3 });
  if (o.prints) prints(c, x0, y0, e.x, e.y, o.prints, { c: o.pc, s: o.ps, gap: 0.16 / o.prints, dur: o.pdur });
  c.hits(function (hx, hy) { var d = Math.abs(hx - x0) + Math.abs(hy - y0); c.at(Math.min(0.16, d * 0.03), function () { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: o.ic || P.white, r: o.ir || 7 }); c.burst(hx, hy, o.sp || GOLD, o.sn || 2, { spd: 36, life: 0.22 }); }); }, o.max || 4);
  return e;
}
// 맞은 이 위에 찍히는 금빛 편자 (짓밟기의 표시)
function shoe(c, x, y, col, big) { return c.fx('cav_hoof', { x: x, y: y - 0.1, dx: 0, dy: -1, air: 1, L: 1, s: 2, c: col || P.gold, dur: big ? 0.36 : 0.28 }); }
// 옮겨 가는 번개: 줄기는 셋까지, 나머지는 불티와 빛만
function chainZap(c, a, b, n) { var d = 0.04 + n * 0.05; if (n < 3) c.fx('zap', { x0: a[0], y0: a[1], x1: b[0], y1: b[1], h0: 3, h1: 3, c: P.sky, w: 2, jit: 4, d: d, dur: 0.2 }); c.at(d, function () { c.burst(b[0], b[1], BOLT, 3, { spd: 36, life: 0.2 }); c.light(b[0], b[1], 14, P.bolt, 0.4, 0.2); }); }
// 하늘에서 내리꽂는 벼락 한 줄기
function skyZap(c, x, y, w, o) { o = o || {}; return c.fx('zap', { x0: x + c.rnd(0.35), y0: y, x1: x, y1: y, h0: o.h0 || 70, h1: o.h1 || 0, c: o.c || P.bolt, w: w || 3, jit: o.jit || 5, fork: o.fork, d: o.d || 0, dur: o.dur || 0.24 }); }

// T1 ── 돌격! (호령): 말이 앞발을 들고, 아군 머리 위로 금빛 꺾쇠가 앞으로 밀려 나간다
X.reg('cmd_cav', { cast: function (c) {
  var f = c.u.face < 0 ? -1 : 1;
  c.pose('hop', 0.32, 5).sfx('cav_gallop').ring(c.ux, c.uy, 12, P.gold, { dur: 0.3 });
  dust(c, c.ux - f * 0.3, c.uy, 3);
  c.each(function (x, y, i, d) { c.fx('cav_chev', { x: x, y: y - 0.95, dir: f, c: P.gold, c2: P.pale, go: 7, d: 0.05 + Math.min(0.2, d * 0.04), dur: 0.5 }); c.burst(x, y - 0.3, GOLD, 1, { up: 22, grav: -16, spd: 5, life: 0.5 }); }, 6);
} });
// T1 ── 돌파: 창을 당겼다가, 금빛 한 줄을 긋고 달려 나간다. 길에 말굽 둘
X.reg('cav_charge', {
  cast: function (c) { c.pose('back', 0.3, 3).sfx('cav_gallop'); dust(c, c.ux - c.dx * 0.4, c.uy - c.dy * 0.4, 3); },
  beat: function (c) {
    rush(c, { w: 3, prints: 2, max: 3, sn: 2, dur: 0.26 });
    c.spray(c.ux, c.uy + 0.3, DUST, 4, c.ang + 3.1416, 0.6, { spd: 30, up: 8, life: 0.35 });
    c.lunge().light(c.ux + c.dx, c.uy + c.dy, 14, P.gold, 0.35, 0.2).boom('cav_lance');
  } });
// T2 ── 말발굽: 말을 세워 앞발로 쿵, 쿵. 둘째에 땅이 갈라진다
X.reg('cav_trample', {
  cast: function (c) { c.pose('hop', 0.22, 6).sfx('cav_gallop'); },
  beat: function (c, i, last) {
    var f = c.u.face < 0 ? -1 : 1, x = c.ux + f * 0.5, y = c.uy + (i ? 0.25 : -0.1);
    hoof(c, x - 0.16, y - 0.12, f, 0, { c: P.gold, s: 2, dur: 1.4 }); hoof(c, x + 0.22, y + 0.2, f, 0, { c: P.gold, s: 2, d: 0.03, dur: 1.4 });
    c.fx('shock', { x: c.ux, y: c.uy, r: last ? 22 : 15, c: P.dust, c2: P.pale, w: last ? 2 : 1, dust: P.earth, dur: 0.35 });
    c.hits(function (hx, hy) { shoe(c, hx, hy, P.gold, last); c.burst(hx, hy, GOLD, 1, { spd: 30, life: 0.2 }); }, 3);
    dust(c, x, y, last ? 8 : 5);
    if (!last) { c.pose('hop', 0.2, 5).sfx('cav_stomp'); return; }
    c.fx('crack', { x: x, y: y, r: 10, n: 5, dur: 1.6 }); c.spray(x, y, DUST, 6, -1.5708, 1.2, { spd: 40, grav: 150, life: 0.4, size: 2 });
    c.light(c.ux, c.uy, 20, P.gold, 0.4, 0.3).shake(0.12).stop(0.03).boom('cav_stomp');
  } });
// T2 ── 추격: 말굽 자국과 흙먼지가 대상까지 이어지고, 깃발 달린 창이 꽂힌다. 절반 아래의 적에게는 붉은 마무리
X.reg('cav_hunt', {
  cast: function (c) {
    var a = [c.ux, c.uy], b = c.e.from || a;
    c.low = false; c.who(false, function (x, y, k, w) { if (w.hp < w.mhp * 0.5) c.low = true; }, 1);
    c.fx('beam', { x0: a[0], y0: a[1] + 0.3, x1: b[0], y1: b[1] + 0.3, w: 2, c: P.dust, c2: P.pale, dur: 0.3 });
    prints(c, a[0], a[1], b[0], b[1], 3, { gap: 0.04, dur: 1.0 }); dust(c, a[0], a[1], 4); c.sfx('cav_gallop');
  },
  beat: function (c) {
    var x = c.cx, y = c.cy, low = c.low;
    c.fx('cav_lance', { x: x, y: y, a: c.ang, len: 15, go: 12, gt: 0.3, c: P.gold, dur: 0.32 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.22, c: P.white, r: low ? 11 : 8 }).ring(x, y, 10, low ? P.red : P.gold, { dur: 0.28 });
    c.spray(x, y, low ? [P.red, P.gold, P.white] : GOLD, low ? 12 : 8, c.ang, 0.7, { spd: 46, life: 0.3 });
    if (low) c.shape({ k: 'slash', x: x, y: y, a: c.ang, s: 1, c: P.red, big: 1, dur: 0.24 });
    c.lunge().light(x, y, 18, P.gold, 0.45, 0.22).shake(low ? 0.12 : 0.08).boom('cav_lance');
  } });
// T3 ── 뇌전 돌파: 창끝에 불꽃이 일고 → 번개가 먼저 길을 달린다 → 그 길을 금빛으로 꿰뚫는다 (그을린 자국이 남는다)
X.reg('xcav_charge', {
  cast: function (c) {
    var hx = c.ux + c.dx * 0.5, hy = c.uy - 0.3;
    c.pose('back', 0.6, 4).sfx('cav_spark'); c.burst(hx, hy, BOLT, 5, { spd: 18, life: 0.2 });
    c.fx('zap', { x0: hx - 0.3, y0: hy, x1: hx + 0.4, y1: hy + 0.2, h0: 6, h1: -2, c: P.bolt, w: 1, jit: 3, dur: 0.16 });
    c.fx('zap', { x0: hx + 0.3, y0: hy - 0.2, x1: hx - 0.2, y1: hy + 0.3, h0: 0, h1: 5, c: P.sky, w: 1, jit: 3, d: 0.07, dur: 0.14 });
  },
  beat: function (c, i) {
    var e = lane(c), x0 = c.ux, y0 = c.uy;
    if (i === 0) {
      c.fx('zap', { x0: x0 + c.dx * 0.4, y0: y0 + c.dy * 0.4, x1: e.x + c.dx * 0.3, y1: e.y + c.dy * 0.3, h0: 5, h1: 4, c: P.bolt, w: 3, jit: 4, fork: 1, dur: 0.24 });
      c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.2, c: P.sky, r: 8 }); c.burst(hx, hy, BOLT, 3, { spd: 40, life: 0.2 }); }, 4);
      c.light((x0 + e.x) / 2, (y0 + e.y) / 2, 28, P.bolt, 0.5, 0.2).flash(P.bolt, 0.04).shake(0.1).boom('zap');
      return;
    }
    rush(c, { w: 4, prints: 3, pc: P.bolt, max: 4, ir: 10, sn: 3 });
    c.ghost(c.dx * e.n * 0.33, c.dy * e.n * 0.33, P.gold, 0.3, 0.45).ghost(c.dx * e.n * 0.66, c.dy * e.n * 0.66, P.bolt, 0.36, 0.4);
    c.fx('stain', { x: x0 + c.dx * e.n * 0.35, y: y0 + c.dy * e.n * 0.35, r: 6, c: P.ash, a: 0.4, c2: P.bolt, n: 4, dur: 2 }); c.fx('stain', { x: x0 + c.dx * e.n * 0.75, y: y0 + c.dy * e.n * 0.75, r: 6, c: P.ash, a: 0.4, c2: P.bolt, n: 4, dur: 2.2 });
    c.spray(x0, y0 + 0.3, DUST, 8, c.ang + 3.1416, 0.6, { spd: 40, up: 8, life: 0.4 });
    c.at(0.15, function () { c.fx('shock', { x: c.u.x, y: c.u.y, r: 16, c: P.gold, w: 2, dust: P.dust, dur: 0.35 }); dust(c, c.u.x, c.u.y, 5); });
    c.lunge().light((x0 + e.x) / 2, (y0 + e.y) / 2, 28, P.gold, 0.6, 0.3).shake(0.2).stop(0.05).flash(P.gold, 0.05).wash(P.bolt, 0.04, 0.5).boom('cav_rush');
  },
  chain: chainZap });
// T3 ── 천둥 창: 벼락처럼 뛰어들어 창을 꽂는다 → 하늘이 반짝이고, 꽂힌 창에 벼락이 떨어진다
X.reg('xcav_bolt', {
  cast: function (c) {
    var a = [c.ux, c.uy], b = c.e.from || a;
    c.fx('zap', { x0: a[0], y0: a[1], x1: b[0], y1: b[1], h0: 4, h1: 4, c: P.bolt, w: 2, jit: 3, dur: 0.2 });
    c.ghost(0, 0, P.bolt, 0.3, 0.45); c.burst(a[0], a[1], BOLT, 5, { spd: 24, life: 0.22 }); c.sfx('cav_spark');
  },
  beat: function (c, i) {
    var x = c.cx, y = c.cy, lean = c.dx * 5;
    if (i === 0) {
      c.fx('cav_lance', { x: x, y: y, plant: 1, len: 17, lean: lean, c: P.gold, dur: 0.62 });
      c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 8 }); c.spray(x, y, GOLD, 6, c.ang, 0.8, { spd: 40, life: 0.25 });
      c.fx('star', { x: x - lean / 16, y: y - 4.7, s: 4, c: P.bolt, dur: 0.3 });
      c.at(0.13, function () { c.burst(x - lean / 16, y - 1, BOLT, 3, { spd: 14, life: 0.16 }); });
      c.lunge().shake(0.08).sfx('cav_lance');
      return;
    }
    skyZap(c, x - lean / 16, y, 4, { h0: 76, h1: 14, jit: 6, fork: 1, dur: 0.26 }); skyZap(c, x, y, 2, { h0: 76, c: P.sky, jit: 7, d: 0.05, dur: 0.2 });
    c.fx('column', { x: x, y: y, w: 4, h: 60, c: P.bolt, c2: P.white, a: 0.45, dur: 0.22 });
    c.fx('shock', { x: x, y: y, r: 24, c: P.bolt, c2: P.white, w: 2, dur: 0.4 }); c.fx('crack', { x: x, y: y, r: 12, n: 6, c: P.bolt, dur: 2.2 }); c.fx('stain', { x: x, y: y, r: 9, c: P.ash, a: 0.45, c2: P.bolt, dur: 2.2 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.26, c: P.white, r: 14 }); c.burst(x, y, BOLT, 16, { spd: 54, life: 0.3 }); c.spray(x, y, GOLD, 8, -1.5708, 0.9, { spd: 50, grav: 120, life: 0.4 });
    c.light(x, y, 28, P.bolt, 0.6, 0.3).flash(P.white, 0.06).wash(P.sky, 0.04, 0.5).shake(0.22).stop(0.05).boom('thunderBig');
  },
  chain: chainZap });
// T3 ── 뇌운 질주: 머리 위에 먹구름이 끼고 → 구름을 끌고 달린다. 구름은 길 위에 남아 1초마다 벼락을 떨군다
X.reg('xcav_storm', {
  cast: function (c) { c.pose('back', 0.45, 4).sfx('cav_spark'); c.fx('cloud', { x: c.ux, y: c.uy, hgt: 30, w: 24, c: P.cloud, c2: P.cloud2, lit: 1, dur: 0.5 }); },
  beat: function (c) {
    var e = rush(c, { w: 4, c: P.storm, c2: P.bolt, prints: 3, max: 4, ir: 9, sp: BOLT, sn: 3 }), x0 = c.ux, y0 = c.uy, k = 0;
    [0.2, 0.5, 0.8].forEach(function (q, j) { c.fx('cloud', { x: x0 + c.dx * e.n * q, y: y0 + c.dy * e.n * q, hgt: 34 + (j % 2) * 4, w: 22, c: P.cloud, c2: P.cloud2, lit: 1, d: q * 0.16, dur: 3.3 }); });
    c.ghost(c.dx * e.n * 0.4, c.dy * e.n * 0.4, P.storm, 0.32, 0.45).ghost(c.dx * e.n * 0.75, c.dy * e.n * 0.75, P.bolt, 0.38, 0.4);
    c.hits(function (hx, hy) { if (k++ < 2) skyZap(c, hx, hy, 2, { h0: 34, d: 0.08 + k * 0.05, dur: 0.2 }); }, 2);
    c.spray(x0, y0 + 0.3, DUST, 8, c.ang + 3.1416, 0.6, { spd: 40, up: 8, life: 0.4 });
    c.lunge().light((x0 + e.x) / 2, (y0 + e.y) / 2, 28, P.storm, 0.55, 0.3).shake(0.18).stop(0.04).flash(P.bolt, 0.05).wash(P.storm, 0.05, 0.6).boom('cav_rush');
  },
  chain: chainZap,
  zoneTick: function (c) {
    var n = 0;
    c.hits(function (x, y) { n++; skyZap(c, x, y, 2, { h0: 34, dur: 0.2 }); c.burst(x, y, BOLT, 3, { spd: 36, life: 0.2 }); c.light(x, y, 16, P.bolt, 0.4, 0.2); }, 4);
    if (n) c.sfx('zap');
  } });
// T4 ── 황금 돌격: 길게 당긴다(금빛이 모이고 잔상이 뒤로 늘어선다) → 굵은 금빛 한 줄, 길에 금빛 말굽이 차례로 찍힌다
// T5 ── 뇌광 돌격: 같은 돌격에 번개가 감긴다. 지나간 길이 0.8초 빛나다가, 천둥이 그 길을 따라 내리친다
function goldUp(c, grand) {
  var T = grand ? 0.5 : 0.45, e = lane(c), k;
  c.dim(grand ? 1.2 : 0.85).pose('back', T + 0.2, grand ? 7 : 6).sfx('cav_gallop');
  c.ring(c.ux, c.uy, grand ? 26 : 20, P.gold, { inv: true, w: 2, dur: T * 0.8 });
  c.fx('beam', { x0: c.ux, y0: c.uy + 0.35, x1: e.x, y1: e.y + 0.35, w: 1, c: P.pale, c2: P.pale, dur: T });      // 달릴 길
  for (k = 1; k <= (grand ? 3 : 2); k++) (function (k) { c.at(k * 0.08, function () { c.ghost(-c.dx * 0.22 * k, -c.dy * 0.22 * k, grand ? P.bolt : P.gold, 0.34, 0.5 - k * 0.08); }); })(k);
  c.fx('emit', { x: c.ux, y: c.uy + 0.3, sp: 1, rate: 24, n: 1, dur: T - 0.05, cols: grand ? [P.gold, P.white, P.sky] : GOLD, o: { up: 22, grav: -20, spd: 10, life: 0.4 } });
  c.at(T * 0.5, function () { c.streak(grand ? 12 : 6, c.ang, P.pale, T * 0.9 + 0.2, 0.3); });
  if (grand) { c.at(0.12, function () { c.sfx('cav_spark'); skyZap(c, c.ux, c.uy - 0.2, 2, { h0: 50, h1: 10, dur: 0.18 }); }); c.at(0.3, function () { c.fx('zap', { x0: c.ux - 0.5, y0: c.uy, x1: c.ux + 0.5, y1: c.uy - 0.3, h0: 2, h1: 8, c: P.sky, w: 1, jit: 3, dur: 0.16 }); }); }
}
function goldRush(c, grand) {
  var e = lane(c), n = e.n, x0 = c.ux, y0 = c.uy, mx = (x0 + e.x) / 2, my = (y0 + e.y) / 2;
  c.fx('beam', { x0: x0, y0: y0, x1: e.x, y1: e.y, w: grand ? 7 : 6, c: P.gold, c2: P.white, dur: 0.42 });
  c.fx('beam', { x0: x0, y0: y0 + 0.3, x1: e.x, y1: e.y + 0.3, w: 2, c: P.deep, c2: P.gold, dur: 0.55 });
  c.fx('cav_lance', { x: e.x, y: e.y, a: c.ang, len: 22, go: n * 16, gt: 0.4, w: 2, c: P.white, dur: 0.42 });
  prints(c, x0, y0, e.x, e.y, Math.min(n, grand ? 7 : 6), { c: grand ? P.bolt : P.gold, s: 2, gap: 0.03, dur: 2.2 });
  c.hits(function (hx, hy) { var d = Math.abs(hx - x0) + Math.abs(hy - y0); c.at(Math.min(0.18, d * 0.025), function () { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.26, c: P.white, r: 12 }); c.burst(hx, hy, GOLD, 3, { spd: 44, life: 0.26 }); }); }, 5);
  c.spray(x0, y0 + 0.3, DUST, 10, c.ang + 3.1416, 0.7, { spd: 50, up: 10, life: 0.45, size: 2 });
  c.spray(mx, my, GOLD, grand ? 24 : 22, c.ang, 0.35, { spd: 96, life: 0.5, spread: n * 7 });
  [0.25, 0.5, 0.75].forEach(function (q) { c.burst(x0 + (e.x - x0) * q, y0 + (e.y - y0) * q, GOLD, 5, { up: 24, grav: -14, spd: 6, life: 0.7 }); });
  c.ghost(c.dx * n * 0.5, c.dy * n * 0.5, P.gold, 0.36, 0.45); if (grand) c.ghost(c.dx * n * 0.8, c.dy * n * 0.8, P.bolt, 0.4, 0.4);
  c.at(0.16, function () {      // 내려서는 자리
    var lx = c.u.x, ly = c.u.y;
    c.fx('shock', { x: lx, y: ly, r: grand ? 30 : 24, c: P.gold, c2: P.white, w: 3, dust: P.dust, dur: 0.45 }); c.fx('crack', { x: lx, y: ly, r: 12, n: 5, c: grand ? P.bolt : null, dur: 2.4 }); dust(c, lx, ly, 8);
  });
  c.lunge().light(mx, my, grand ? 44 : 36, P.gold, 0.8, 0.45).shake(grand ? 0.4 : 0.32).stop(grand ? 0.08 : 0.07).flash(P.white, grand ? 0.09 : 0.08).wash(P.gold, grand ? 0.08 : 0.06, 0.7).boom('cav_rush').sfx('cav_lance');
  if (grand) { c.fx('zap', { x0: x0, y0: y0, x1: e.x, y1: e.y, h0: 9, h1: 9, c: P.bolt, w: 2, jit: 5, segs: 8, dur: 0.3 }); c.fx('zap', { x0: x0, y0: y0, x1: e.x, y1: e.y, h0: -1, h1: -1, c: P.sky, w: 1, jit: 5, segs: 8, d: 0.06, dur: 0.3 }); }
}
// 뒤따르는 천둥: 길을 따라 하늘에서 네 줄기 (자리가 다할 때 — 그 맥박에 맞은 이들 c.ids)
function goldThunder(c) {
  var T = c.tiles, n = T.length, k;
  if (!n) return;
  for (k = 0; k < 4; k++) (function (k) {
    var t = T[Math.min(n - 1, Math.round((k + 0.5) / 4 * n - 0.5))];
    c.at(k * 0.05, function () { skyZap(c, t[0], t[1], k === 3 ? 4 : 3, { h0: 84, fork: k % 2, jit: 6 }); c.burst(t[0], t[1], BOLT, 5, { spd: 50, life: 0.26 }); if (k % 2) c.fx('shock', { x: t[0], y: t[1], r: 20, c: P.bolt, c2: P.white, w: 2, dur: 0.4 }); else c.fx('stain', { x: t[0], y: t[1], r: 7, c: P.ash, a: 0.45, c2: P.bolt, n: 4, dur: 2.4 }); });
  })(k);
  c.hits(function (x, y) { c.shape({ k: 'impact', x: x, y: y, dur: 0.24, c: P.white, r: 10 }); }, 5);
  c.fx('column', { x: T[n - 1][0], y: T[n - 1][1], w: 5, h: 80, c: P.bolt, c2: P.white, a: 0.5, dur: 0.3, d: 0.15 });
  c.light(c.cx, c.cy, 28, P.bolt, 0.6, 0.35).flash(P.white, 0.06).wash(P.sky, 0.05, 0.6).shake(0.22).boom('thunderBig');
}
X.reg('u_goldrush', { cast: function (c) { goldUp(c, false); }, beat: function (c) { goldRush(c, false); } });
X.reg('ux_goldrush', { cast: function (c) { goldUp(c, true); }, beat: function (c) { goldRush(c, true); }, zoneEnd: goldThunder });
// T4 ── 말발굽 폭풍: 말을 세우고 한 바퀴 돈다. 돌 때마다 흙먼지의 호가 돌고, 그 쪽에 말굽이 찍히고, 고리가 커진다
// T5 ── 천둥 말발굽: 네 번. 말굽마다 하늘에서 벼락이 맞은 이에게 떨어진다. 마지막은 둘레에 벼락 넷
function stampUp(c, grand) {
  c.dim(grand ? 1.5 : 1.1).pose('hop', 0.3, 7).sfx('cav_gallop').ring(c.ux, c.uy, 30, P.dust, { inv: true, w: 2, dur: 0.3 });
  dust(c, c.ux, c.uy, 6);
  if (grand) c.fx('cloud', { x: c.ux, y: c.uy, hgt: 46, w: 34, c: P.cloud, c2: P.cloud2, lit: 1, dur: 1.4 });
}
function stamp(c, i, last, grand) {
  var x = c.ux, y = c.uy, n = c.S.beats.length, sec = 6.2832 / n, a0 = c.ang + i * sec, r = last ? 38 : 20 + i * 6, k, a, d, z = 0;
  c.fx('arc', { x: x, y: y, r: 13 + i * 4, a0: a0, sw: sec + 0.6, c: P.dust, c2: P.earth, w: 2, dur: 0.28 });
  for (k = 0; k < (grand ? 2 : 3); k++) { a = a0 + (k + 0.5) / 3 * sec; d = 1.1 + (k % 2) * 0.55; hoof(c, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.75, -Math.sin(a), Math.cos(a), { c: grand ? P.bolt : P.gold, s: 2, d: k * 0.03, dur: 1.8 }); }
  c.fx('shock', { x: x, y: y, r: r, c: last ? P.gold : P.dust, c2: P.pale, w: last ? 3 : 2, dust: P.earth, dur: 0.4 });
  c.hits(function (hx, hy) { shoe(c, hx, hy, grand ? P.bolt : P.gold, last); if (grand && z++ < (last ? 3 : 1)) { skyZap(c, hx, hy, last ? 3 : 2, { h0: 60, d: z * 0.03 }); c.burst(hx, hy, BOLT, 3, { spd: 40, life: 0.2 }); } }, last ? 4 : grand ? 2 : 3);
  c.burst(x, y + 0.3, DUST, last ? 14 : 7, { up: 14, grav: 60, spd: 44, life: 0.45, spread: 16, flat: true });
  c.light(x, y, last ? 36 : 22, grand ? P.bolt : P.gold, last ? 0.7 : 0.4, 0.3);
  if (!last) { c.pose('hop', 0.2, 5).shake(0.12 + i * 0.05).sfx('cav_stomp'); if (grand) c.flash(P.bolt, 0.03); return; }
  c.fx('crack', { x: x, y: y, r: grand ? 24 : 18, n: 7, c: grand ? P.bolt : null, dur: 2.4 }); c.fx('stain', { x: x, y: y, r: 28, c: P.dirt, a: 0.2, dur: 2.6 });
  c.spray(x, y, DUST, grand ? 16 : 14, -1.5708, 1.4, { spd: 60, grav: 160, life: 0.5, size: 2 });
  c.shake(grand ? 0.45 : 0.3).stop(grand ? 0.09 : 0.06).flash(grand ? P.white : P.gold, grand ? 0.1 : 0.07).boom('cav_stomp');
  if (grand) { c.fx('column', { x: x, y: y, w: 6, h: 84, c: P.bolt, c2: P.white, a: 0.5, dur: 0.3 }); c.wash(P.sky, 0.08, 0.8).sfx('thunderBig'); c.fx('emit', { x: x, y: y, sp: 3, rate: 12, n: 1, dur: 0.9, cols: BOLT, o: { up: 26, grav: -14, spd: 6, life: 0.7 } }); }
  c.at(0.2, function () { c.ring(c.ux, c.uy, 12, P.gold, { rise: true, w: 2, dur: 0.5 }); c.fx('cav_chev', { x: c.ux, y: c.uy - 1.0, dir: c.u.face < 0 ? -1 : 1, n: 3, c: P.gold, c2: P.pale, go: 8, dur: 0.6 }); });      // 몸이 가벼워진다
}
X.reg('u_stampede', { cast: function (c) { stampUp(c, false); }, beat: function (c, i, last) { stamp(c, i, last, false); } });
X.reg('ux_stampede', { cast: function (c) { stampUp(c, true); }, beat: function (c, i, last) { stamp(c, i, last, true); } });
// T4 ── 빚은 갚는다: 달려들어 금화를 튕겨 올린다(빚진 이에게 금빛 고리) → 동전이 떨어질 때 창. 쏟아진 금화가 내게 돌아온다(회복)
// T5 ── 벼락 빚잔치: 원금은 창으로, 이자는 벼락으로. 대상 머리 위에 큰 금화가 뜨고 그리로 벼락이 떨어진다
function debtUp(c, grand) {
  var a = [c.ux, c.uy], b = c.e.from || a;
  c.dim(grand ? 1.3 : 0.9).sfx('cav_gallop').ghost(0, 0, grand ? P.bolt : P.gold, 0.35, 0.4);
  c.fx('beam', { x0: a[0], y0: a[1] + 0.3, x1: b[0], y1: b[1] + 0.3, w: 2, c: grand ? P.bolt : P.dust, c2: P.pale, dur: 0.3 }); prints(c, a[0], a[1], b[0], b[1], 3, { gap: 0.04, c: grand ? P.bolt : null, dur: 1.2 });
  c.ring(c.cx, c.cy, 15, P.gold, { inv: true, w: 2, dur: 0.34, d: 0.06 });
  c.at(0.12, function () { c.pose('back', 0.44, 4); c.fx('cav_coin', { x: b[0], y: b[1] - 0.7, h: 8, s: grand ? 3 : 2, spin: 24, dur: 0.28 }); c.sfx('cav_coin'); });
  c.at(0.2, function () { c.streak(grand ? 10 : 6, c.ang, P.pale, 0.4, 0.28); });
}
function collect(c, x, y, n) {      // 금화가 내게 돌아온다
  for (var k = 0; k < n; k++) c.fx('cav_coin', { x: x + c.rnd(0.3), y: y - 0.3, x1: c.ux, y1: c.uy - 0.3, h: 4 + k * 2, s: k % 2 ? 1 : 2, spin: 20, d: 0.08 + k * 0.05, dur: 0.34 });
  c.at(0.4 + n * 0.02, function () { c.ring(c.ux, c.uy, 11, P.gold, { rise: true, w: 2, dur: 0.5 }); c.burst(c.ux, c.uy - 0.2, [P.gold, P.mend, P.white], 6, { up: 24, grav: -16, spd: 6, life: 0.6 }); c.sfx('cav_coin'); });
}
function debt(c, i, last, grand) {
  var x = c.cx, y = c.cy;
  if (i === 0) {
    c.fx('cav_lance', { x: x, y: y, a: c.ang, len: 18, go: 13, gt: 0.25, w: 2, c: P.gold, dur: 0.36 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.28, c: P.white, r: 14 });
    c.fx('shock', { x: x, y: y, r: 24, c: P.gold, c2: P.white, w: 3, dur: 0.4 }); c.fx('crack', { x: x, y: y, r: 13, n: 6, dur: 2.4 });
    c.spray(x, y, COIN, 22, c.ang, 0.8, { spd: 70, up: 20, grav: 120, life: 0.55, size: 2 });
    collect(c, x, y, grand ? 3 : 5);
    c.lunge().light(x, y, 36, P.gold, 0.75, 0.4).shake(0.3).stop(0.07).flash(P.gold, 0.08).wash(P.gold, 0.06, 0.6).boom('cav_lance');
    if (grand) { c.fx('cav_coin', { x: x, y: y - 2.0, s: 4, spin: 9, d: 0.08, dur: 0.5 }); c.fx('star', { x: x, y: y - 5, s: 5, c: P.bolt, d: 0.15, dur: 0.3 }); }
    return;
  }
  skyZap(c, x, y - 1.6, 4, { h0: 70, h1: 0, jit: 6, fork: 1, dur: 0.26 }); skyZap(c, x, y, 4, { h0: 30, jit: 4, dur: 0.26 }); skyZap(c, x, y, 2, { h0: 90, c: P.sky, jit: 8, d: 0.05, dur: 0.22 });
  c.fx('column', { x: x, y: y, w: 7, h: 92, c: P.bolt, c2: P.white, a: 0.55, dur: 0.3 });
  c.fx('shock', { x: x, y: y, r: 30, c: P.bolt, c2: P.white, w: 3, dur: 0.45 }); c.fx('shock', { x: x, y: y, r: 48, c: P.white, w: 1, dur: 0.65, d: 0.1 });
  c.fx('stain', { x: x, y: y, r: 14, c: P.ash, a: 0.45, c2: P.gold, n: 8, dur: 3.4 }); c.shape({ k: 'impact', x: x, y: y, dur: 0.3, c: P.white, r: 17 });
  c.burst(x, y, BOLT, 20, { spd: 64, life: 0.32 }); c.spray(x, y, COIN, 18, -1.5708, 1.3, { spd: 74, grav: 140, life: 0.6, size: 2 });
  collect(c, x, y, 5); c.float(x, y + 0.3, '이자', P.gold, { dx: c.dx * 18, big: true, life: 0.8 });
  c.fx('emit', { x: x, y: y, sp: 2.5, rate: 12, n: 1, dur: 1.0, cols: COIN, o: { up: 26, grav: -14, spd: 5, life: 0.8 } });
  c.light(x, y, 44, P.bolt, 0.85, 0.45).shake(0.45).stop(0.09).flash(P.white, 0.1).wash(P.sky, 0.08, 0.8).boom('thunderBig');
}
X.reg('u_debt', { cast: function (c) { debtUp(c, false); }, beat: function (c, i, last) { debt(c, i, last, false); } });
X.reg('ux_debt', { cast: function (c) { debtUp(c, true); }, beat: function (c, i, last) { debt(c, i, last, true); } });
})();
