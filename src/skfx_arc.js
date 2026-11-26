// 전민 — 기술 연출: 궁병 (겨냥과 한 발 · 물러서며 쏘기 · 쏟아지는 화살). 틀과 쓰는 법은 src/skfx.js · docs/SKILL_FX.md.
//   이 파일이 맡는 기술: charisma (호령 — 택틱스마스터도 쓴다) · arc_mark (T1) · arc_retreat (T2) · xarc_mark · xarc_pierce · xarc_storm (T3)
//                        u_oneshot · u_deluge · u_three (T4) · ux_* 셋 (T5)
//   빛깔: 화살 크림 #f1ead9 · 흰 촉 · 표식의 붉은빛 #ff6a5a (짙은 #c0392b) · 잎 #d6f5b0 #5fae5a · 나무 #a8754a · 흙먼지 #d8c39a · 윗길의 금 #f6cf57 · 숨죽인 밤빛 #1c2440
//   무늬: 붉은 겨냥 테(조여들다 잠긴다) · 점선 겨눔 줄 · 깃 달린 화살(날아가고, 내리꽂히고, 땅에 박혀 남는다)
//   고친 것 (옛 → 새 · tools/skdmg.js 허수아비 / 실전):
//     charisma     그대로 (설명의 긴 줄표만)
//     arc_mark     120% + 표식 → 같다, 화살이 닿을 때(0.12초)                                          1.00 / 1.00
//     arc_retreat  170% → 같다, 화살이 닿을 때(0.1초). 물러서기는 그 뒤                                    1.00 / 1.00
//     xarc_mark    160% + 표식 → 표식 화살 65% + 표식, 곧바로 본 화살 90% (제 표식을 맞힌다)               1.04 / 1.01  (이미 표식이 있는 적에게는 0.90)
//     xarc_pierce  240% → 같다, 시위를 당기는 뜸 0.32초                                                  1.00 / 0.99
//     xarc_storm   190% + 표식 → 0.5초 뒤 세 번 65% + 70% + 90%, 표식은 마지막에 (비켜설 수 있다)          1.04 / 1.02
//     u_oneshot    340% → 같다, 숨을 고르는 뜸 0.7초 (ux_oneshot 460% 는 0.9초)                          1.00 / 1.01
//     u_three      180% → 185%, 화살 셋이 닿을 때(0.26초). 그 사이 자리를 뜬 적은 빗나간다                 1.03 / 1.00
//     ux_three     220% → 228%, 화살 다섯이 닿을 때(0.3초)                                               1.04 / 0.99
//     u_deluge     150% + 표식 → 85% + 표식, 화살비가 3초 남아 1초마다 35% (세 번)                        1.03 / 1.02
//     ux_deluge    210% + 표식 → 110% + 표식, 화살비 3.5초(1초마다 30%, 세 번) + 그치며 50%               1.02 / 1.03
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var X = DS.skfx; if (!X) return;
var P = X.PAL.arc = { cream: '#f1ead9', white: '#ffffff', red: '#ff6a5a', deep: '#c0392b', leaf: '#d6f5b0', green: '#5fae5a', wood: '#a8754a', dark: '#6f4a2c', dust: '#d8c39a', dirt: '#6f4a2c', gold: '#f6cf57', pale: '#fff6d0', night: '#1c2440' };
var SPARK = [P.white, P.cream, P.pale], DUST = [P.dust, P.wood, P.dirt], LEAF = [P.leaf, P.green, P.cream], GOLD = [P.gold, P.pale, P.white], K = '#1b1626';
var hs = X.hs, env = X.env, ease = X.ease;

// ───────── 기술 표 ─────────
X.def('charisma', { desc: '호령. 모든 아군의 공격, 방어 +20% (30초), 게이지 +25.' });
// 표식 사격 · 뒷걸음 사격: 화살이 날아가 닿을 때 맞는다. 수치는 그대로
X.def('arc_mark', { beats: [0.12] });
X.def('arc_retreat', { beats: [0.1] });
// 매눈 표식: 한 발(160%) → 표식 화살 65% 가 표식을 박고, 본 화살 95% 가 그 표식을 맞힌다 (표식 없는 적에게는 조금 더, 이미 표식이 있는 적에게는 조금 덜 — 고르게 보면 같다)
X.def('xarc_mark', { beats: [0.16, 0.42],
  eff: [{ t: 'dmg', m: 0.65 }, { t: 'status', s: 'mark', dur: 14, p: 25 }, { t: 'dmg', m: 0.9, b: 1 }],
  desc: '최대 6칸. 표식 화살 65%로 표식(받는 피해 +25%, 14초)을 박고, 곧바로 본 화살 90%가 그 표식을 맞힌다.' });
// 꿰뚫는 매눈: 시위를 끝까지 당기는 뜸(0.32초). 수치는 그대로
X.def('xarc_pierce', { beats: [0.32] });
// 천궁 소나기: 한 번(190%) → 0.5초 뒤부터 세 번 60% + 65% + 85%. 표식은 마지막 화살비가 남긴다 (앞의 두 번이 제 표식 덕을 보지 않게)
X.def('xarc_storm', { fall: { delay: 0.5 }, beats: [0, 0.25, 0.5],
  eff: [{ t: 'dmg', m: 0.65, vs: 'mark', vx: 1.4 }, { t: 'dmg', m: 0.7, vs: 'mark', vx: 1.4, b: 1 }, { t: 'dmg', m: 0.9, vs: 'mark', vx: 1.4, b: 2 }, { t: 'status', s: 'mark', dur: 10, p: 20, b: 2 }],
  desc: '겨눈 2칸 반경에 0.5초 뒤 화살비가 세 번 쏟아진다. 65%, 70%, 90% (표식이 있으면 1.4배). 마지막 화살비가 표식을 남긴다.' });
// 한 대면 된다 · 일격필살: 숨을 고르는 뜸. 한 대는 한 대다 (나누지 않는다)
X.def('u_oneshot', { beats: [0.7], desc: '최대 7칸. 숨을 고르고 0.7초 뒤 적 하나에 340%, 표식이 있으면 1.4배.' });
X.def('ux_oneshot', { beats: [0.9], desc: '최대 9칸. 숨을 고르고 0.9초 뒤 적 하나에 460%, 표식이 있으면 1.5배.' });
// 세 갈래 · 다섯 갈래 화살: 화살이 닿을 때 맞는다. 수치는 그대로
X.def('u_three', { beats: [0.26], eff: [{ t: 'dmg', m: 1.85 }, { t: 'status', s: 'mark', dur: 8, p: 20 }, { t: 'status', s: 'slow', dur: 6 }], desc: '적 셋에게 185%, 표식과 둔화.' });
X.def('ux_three', { beats: [0.3], eff: [{ t: 'dmg', m: 2.28 }, { t: 'status', s: 'mark', dur: 10, p: 20 }, { t: 'status', s: 'slow', dur: 6 }], desc: '적 다섯에게 228%, 표식과 둔화.' });
// 화살 폭우: 한 번(150%) → 105% + 표식, 화살비가 3초 남아 0.75초마다 22%. 하늘 가르는 비: 210% → 135% + 표식, 4초 동안 1초마다 24%, 그치며 60%
X.def('u_deluge', { beats: [0.4],
  eff: [{ t: 'dmg', m: 0.85 }, { t: 'status', s: 'mark', dur: 10, p: 20 }],
  zone: { dur: 3, every: 1, k: 'wind', eff: [{ t: 'dmg', m: 0.35 }] },
  desc: '겨눈 2칸 반경에 화살 85%, 맞은 적 모두에게 표식. 화살비는 3초 동안 이어져 그 안의 적에게 1초마다 35%.' });
X.def('ux_deluge', { beats: [0.45],
  eff: [{ t: 'dmg', m: 1.1 }, { t: 'status', s: 'mark', dur: 12, p: 25 }],
  zone: { dur: 3.5, every: 1, k: 'wind', eff: [{ t: 'dmg', m: 0.3 }], end: [{ t: 'dmg', m: 0.5 }] },
  desc: '겨눈 2칸 반경에 화살 110%, 맞은 적 모두에게 표식(+25%). 화살비는 3.5초 동안 이어져 그 안의 적에게 1초마다 30%, 그치면서 50%.' });

// ───────── 소리 ─────────
X.sound('arc_twang', function (tone, noise) { tone(330, 210, 0.09, 'triangle', 0.08); tone(660, 430, 0.05, 'sine', 0.03); noise(0.05, 0.08, 3000, 1.5, 0.01); }, 2.7);      // 시위
X.sound('arc_thock', function (tone, noise) { noise(0.05, 0.2, 700, 1.0); tone(420, 180, 0.07, 'square', 0.05); tone(1300, 900, 0.04, 'triangle', 0.02, 0.01); }, 3.4);      // 화살이 박힌다
X.sound('arc_volley', function (tone, noise) { for (var k = 0; k < 6; k++) noise(0.05, 0.1, 2600 + k * 260, 2, k * 0.05); noise(0.36, 0.07, 1500, 0.8); }, 4.6);      // 화살비
X.sound('arc_heart', function (tone) { tone(72, 50, 0.1, 'sine', 0.14); tone(62, 44, 0.1, 'sine', 0.1, 0.13); }, 1.05);      // 숨을 고른다
X.sound('arc_snipe', function (tone, noise) { noise(0.04, 0.3, 5000, 1.2); tone(1500, 300, 0.1, 'sawtooth', 0.05); noise(0.25, 0.2, 260, 0.6, 0.03, 'lowpass'); tone(120, 50, 0.22, 'square', 0.08, 0.03); }, 2.1);      // 한 발
X.sound('arc_hawk', function (tone) { tone(1500, 1150, 0.08, 'triangle', 0.03); tone(1650, 1000, 0.13, 'triangle', 0.028, 0.09); }, 4.2);      // 매 울음 (작게)

// ───────── 그림 조각 ─────────
function PL(g, a, b, c, d, w) { DS.VX.pxLine(g, a, b, c, d, w); }
// 화살 한 대: (x, y) = 촉 · (ux, uy) = 나는 쪽 · n = 대의 길이. 밝은 땅에서도 보이게 어두운 밑줄 · 붉은 깃
function arrow(g, x, y, ux, uy, n, c, c2, cf) {
  var tx = x - ux * n, ty = y - uy * n, a = g.globalAlpha;
  g.globalAlpha = a * 0.45; g.fillStyle = K; PL(g, tx, ty + 1, x, y + 1, 1);
  g.globalAlpha = a; g.fillStyle = c || P.cream; PL(g, tx, ty, x, y, 1);
  g.fillStyle = cf || P.red; g.fillRect(Math.round(tx - uy * 1.6), Math.round(ty + ux * 1.6), 1, 1); g.fillRect(Math.round(tx + uy * 1.6), Math.round(ty - ux * 1.6), 1, 1); g.fillRect(Math.round(tx + ux), Math.round(ty + uy), 1, 1);
  g.fillStyle = c2 || P.white; g.fillRect(Math.round(x + ux * 0.5) - 1, Math.round(y + uy * 0.5) - 1, 2, 2);
}
// 날아가는 화살: (x,y)→(x1,y1) 칸 · h 포물선 높이(픽셀, 음수면 아래로 굽는다) · len 대 길이 · tr 꼬리 길이
X.kind('arc_arrow', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var dx = (p.x1 - p.x) * 16, dy = (p.y1 - p.y) * 16, h = (p.h || 0) * 4, x = cx + dx * f, y = cy - 2 + dy * f - h * f * (1 - f), vx = dx, vy = dy - h * (1 - 2 * f), L = Math.sqrt(vx * vx + vy * vy) || 1, n = p.len || 6;
  vx /= L; vy /= L;
  if (p.tr) { g.globalAlpha = 0.4; g.fillStyle = p.c3 || '#ffffff'; PL(g, x - vx * (n + p.tr), y - vy * (n + p.tr), x - vx * (n + 1), y - vy * (n + 1), 1); }
  g.globalAlpha = 1; arrow(g, x, y, vx, vy, n, p.c, p.c2, p.cf);
} });
// 쏟아지는 화살: 가운데 (x,y) 둘레 r 픽셀에 n 대가 fall 초에 내리꽂히고(stag 초에 걸쳐 차례로), 땅에 박혀 남았다가 스러진다. h · sx = 떨어지기 시작하는 높이 · 옆으로 비낀 만큼
X.kind('arc_rain', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var t = f * p.dur, n = p.n || 8, fall = p.fall || 0.14, stag = p.stag || 0, h = p.h || 64, sx = p.sx == null ? 16 : p.sx, k = Math.sqrt(sx * sx + h * h) || 1, ux = -sx / k, uy = h / k, fade = Math.min(1, (1 - f) / 0.3), i, ti, a, rr, lx, ly, q;
  for (i = 0; i < n; i++) {
    ti = t - hs(i, p.sd) * stag; if (ti < 0) continue;
    a = hs(i + 11, p.sd) * 6.2832; rr = Math.sqrt(hs(i + 23, p.sd)) * (p.r || 0); lx = cx + Math.cos(a) * rr; ly = cy + 5 + Math.sin(a) * rr * 0.5;
    if (ti < fall) {
      q = ti / fall; lx += sx * (1 - q); ly -= h * (1 - q);
      g.globalAlpha = 0.35; g.fillStyle = '#ffffff'; PL(g, lx - ux * 18, ly - uy * 18, lx - ux * 8, ly - uy * 8, 1);
      g.globalAlpha = 1; arrow(g, lx, ly, ux, uy, 7, p.c, p.c2, p.cf);
    } else if (!p.gone) { g.globalAlpha = fade; arrow(g, lx, ly, ux, uy, 5, p.c, P.dark, p.cf); }
  }
} });
// 겨냥 테: r0 → r 로 조여든다(close = 조이는 데 드는 몫) · spin 조이며 도는 각 · tick 눈금 길이. 잠기는 순간 하얗게
X.kind('arc_reticle', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var cl = p.close || 0.3, q = Math.min(1, f / cl), e = ease(q), R = (p.r0 || 16) + ((p.r || 7) - (p.r0 || 16)) * e, a = env(f, 0.06, 0.2), rot = (1 - e) * (p.spin || 0), lock = q >= 1 && (f - cl) * p.dur < 0.09, tk = p.tick || 3, s, k, ca, sa, o, n;
  cy -= 1; n = Math.max(12, Math.round(R * 1.1));
  for (s = 0; s < 2; s++) {
    o = s ? 0 : 1; g.fillStyle = s ? (lock ? '#ffffff' : p.c) : K;
    g.globalAlpha = a * (s ? 0.85 : 0.4);
    for (k = 0; k < n; k++) { if ((k * 4 / n) % 1 < 0.22) continue; ca = rot + k / n * 6.2832; g.fillRect(Math.round(cx + Math.cos(ca) * R) + o, Math.round(cy + Math.sin(ca) * R) + o, 1, 1); }      // 네 토막의 테
    g.globalAlpha = a * (s ? 1 : 0.5);
    for (k = 0; k < 4; k++) { ca = Math.cos(rot + k * 1.5708); sa = Math.sin(rot + k * 1.5708); PL(g, cx + ca * (R - 2) + o, cy + sa * (R - 2) + o, cx + ca * (R + tk) + o, cy + sa * (R + tk) + o, 1); }      // 눈금
  }
} });
// 겨눔 줄: (x0,y0)→(x1,y1) 의 점선. 점이 대상 쪽으로 흐른다 · grow = 뻗어 가는 데 드는 몫
X.kind('arc_sight', { L: 1, draw: function (g, p, f) {
  var x0 = p.x0 * 16 + 8, y0 = p.y0 * 16 + 6, x1 = p.x1 * 16 + 8, y1 = p.y1 * 16 + 6, dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1, gr = Math.min(1, f / (p.grow || 0.25)) * L, ph = (f * p.dur * 36) % 5, a = env(f, 0.1, 0.15) * (p.a || 0.8), d;
  for (d = ph; d <= gr; d += 5) {
    g.globalAlpha = a * 0.4; g.fillStyle = K; g.fillRect(Math.round(x0 + dx / L * d), Math.round(y0 + dy / L * d) + 1, 2, 1);
    g.globalAlpha = a * (0.55 + 0.45 * d / L); g.fillStyle = p.c; g.fillRect(Math.round(x0 + dx / L * d), Math.round(y0 + dy / L * d), 2, 1);
  }
} });
// 통솔의 갈매기 표(계급장): 머리 위로 떠오르는 두 겹 ∧
X.kind('arc_chev', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var x = Math.round(cx), y = Math.round(cy - (p.up || 6) * ease(f)), k, j;
  g.globalAlpha = env(f, 0.15, 0.4);
  for (k = 0; k < 2; k++) for (j = 0; j < 3; j++) {
    g.fillStyle = K; g.fillRect(x - j, y + j + k * 4 + 2, 1, 1); g.fillRect(x + j, y + j + k * 4 + 2, 1, 1);
    g.fillStyle = k ? p.c : (p.c2 || p.c); g.fillRect(x - j, y + j + k * 4, 1, 2); g.fillRect(x + j, y + j + k * 4, 1, 2);
  }
} });
// 통솔의 깃: 쓰는 이 곁에 서는 작은 깃대와 나부끼는 삼각기
X.kind('arc_flag', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var up = Math.round((1 - Math.min(1, f * 6)) * 6), x = Math.round(cx) - 7, y = Math.round(cy) - 21 + up, r, w;
  g.globalAlpha = env(f, 0.1, 0.3); g.fillStyle = K; g.fillRect(x - 1, y - 1, 3, 18 - up); g.fillStyle = p.c; g.fillRect(x, y, 1, 16 - up);
  for (r = 0; r < 5; r++) { w = 8 - r * 1.6; g.fillStyle = r ? (p.c2 || p.c) : p.c; g.fillRect(x + 1, y + r + (r > 1 ? Math.round(Math.sin(time * 9 + r)) : 0), Math.round(w), 1); }
} });
// 땅에 남는 화살 자국 (곧은 골): (x0,y0)→(x1,y1)
X.kind('arc_groove', { L: 0, draw: function (g, p, f) {
  var x0 = p.x0 * 16 + 8, y0 = p.y0 * 16 + 13, x1 = p.x1 * 16 + 8, y1 = p.y1 * 16 + 13, a = 1 - f * f, i, q;
  g.globalAlpha = a * 0.5; g.fillStyle = K; PL(g, x0, y0, x1, y1, 1);
  g.globalAlpha = a * 0.6; g.fillStyle = p.c || P.dust;
  for (i = 0; i < 12; i++) { q = hs(i, p.sd); g.fillRect(Math.round(x0 + (x1 - x0) * q), Math.round(y0 + (y1 - y0) * q + (i % 2 ? 1 : -1)), i % 3 ? 1 : 2, 1); }
} });

// ───────── 연출 ─────────
function bow(c) { return [c.ux + c.dx * 0.35, c.uy + c.dy * 0.35 - 0.1]; }      // 활 끝
function tp(c) { var p = c.ids && c.ids.length ? c.pos(c.ids[0]) : null; return p || [c.cx, c.cy]; }      // 한 사람을 겨눈 기술: 그 사람이 지금 선 자리
function shoot(c, x1, y1, o) { var b = bow(c); o = o || {}; return c.fx('arc_arrow', { x: b[0], y: b[1], x1: x1, y1: y1 - 0.1, h: o.h || 0, len: o.len || 6, c: o.c || P.cream, c2: o.c2 || P.white, cf: o.cf || P.red, tr: o.tr || 0, dur: o.dur || 0.12, d: o.d || 0 }); }
function brand(c, x, y, d) { c.ring(x, y, 11, P.red, { inv: true, w: 2, dur: 0.3, d: d || 0 }); }      // 표식이 박힌다
function stuck(c, x, y, dx, dur) { c.fx('arc_rain', { x: x, y: y, n: 1, r: 0, fall: 0.001, sx: -(dx || 0.6) * 9, h: 8, c: P.cream, cf: P.red, dur: dur || 1.6 }); }      // 박혀 남는 화살 한 대

// T2 ── 통솔 (호령): 곁에 깃이 서고, 아군 머리 위로 갈매기 표가 하나씩 오른다 (병과를 가리지 않는 금빛)
X.reg('charisma', { cast: function (c) {
  c.castPose(P.gold).pose('rise', 0.4, 2).sfx('shout');
  c.fx('arc_flag', { x: c.ux, y: c.uy, c: P.gold, c2: P.red, dur: 0.9 });
  c.ring(c.ux, c.uy, 14, P.gold, { dur: 0.4 }).ring(c.ux, c.uy, 22, P.pale, { dur: 0.5, d: 0.1 });
  c.each(function (x, y, i, d) { c.fx('arc_chev', { x: x, y: y - 1.0, c: P.gold, c2: P.pale, up: 6, d: 0.1 + Math.min(0.25, d * 0.04), dur: 0.65 }); c.burst(x, y - 0.3, GOLD, 2, { up: 22, grav: -16, spd: 5, life: 0.5 }); }, 8);
  c.light(c.ux, c.uy, 20, P.gold, 0.45, 0.5);
} });
// T1 ── 표식 사격: 붉은 겨냥 테가 조여들고, 화살이 그 한가운데에 꽂히며 테가 잠긴다
X.reg('arc_mark', {
  cast: function (c) {
    c.lunge().sfx('arc_twang'); shoot(c, c.cx, c.cy, { dur: 0.12 });
    c.fx('arc_reticle', { x: c.cx, y: c.cy, r0: 15, r: 7, close: 0.2, c: P.red, dur: 0.6 });
  },
  beat: function (c) {
    var t = tp(c), x = t[0], y = t[1];
    c.shape({ k: 'impact', x: x, y: y, dur: 0.18, c: P.white, r: 6 }).ring(x, y, 9, P.red, { inv: true, dur: 0.25 });
    c.spray(x, y, [P.cream, P.red, P.white], 6, c.ang, 0.9, { spd: 30, life: 0.22 });
    c.light(x, y, 12, P.red, 0.35, 0.2).boom('arc_thock');
  } });
// T2 ── 뒷걸음 사격: 코앞에서 쏜다(활 끝의 바람) → 떠난 자리에 흙먼지, 물러선 길을 잎이 따라간다
X.reg('arc_retreat', {
  cast: function (c) {
    var b = bow(c);
    c.lunge().sfx('arc_twang'); shoot(c, c.cx, c.cy, { dur: 0.1, len: 7, tr: 8 });
    c.fx('cone', { x: b[0], y: b[1], a: c.ang, spread: 0.5, len: 11, c: P.cream, c2: P.white, dur: 0.2 });
  },
  beat: function (c) {
    var t = tp(c), x = t[0], y = t[1], ox = c.ux, oy = c.uy, nx = c.u.x, ny = c.u.y;      // 엔진은 이미 물러섰다 (c.u) · 화면의 몸(c.ux)은 아직 쏜 자리
    c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 8 }).ring(x, y, 10, P.cream, { dur: 0.25 });
    c.spray(x, y, SPARK, 8, c.ang, 0.8, { spd: 40, life: 0.25 });
    c.light(x, y, 16, P.cream, 0.4, 0.2).shake(0.06).boom('arc_thock');
    if (Math.abs(nx - ox) + Math.abs(ny - oy) < 0.5) return;
    c.fx('stain', { x: ox, y: oy, r: 7, c: P.dust, a: 0.3, dur: 1.2 });
    c.burst(ox, oy + 0.3, DUST, 6, { up: 14, grav: 60, spd: 18, life: 0.4, spread: 8 });
    c.spray((ox + nx) / 2, (oy + ny) / 2, LEAF, 6, Math.atan2(ny - oy, nx - ox), 0.5, { spd: 26, up: 10, grav: 40, life: 0.5 });
    c.line(ox, oy + 0.4, nx, ny + 0.4, P.dust, { dur: 0.24 });
  } });
// T3 ── 매눈 표식: 큰 겨냥 테가 돌며 조여든다 → 붉은 깃의 표식 화살이 박힌다 → 금촉의 본 화살이 그 표식을 꿰뚫는다
X.reg('xarc_mark', {
  cast: function (c) {
    var b = bow(c);
    c.lunge().sfx('arc_hawk').sfx('arc_twang');
    c.fx('arc_reticle', { x: c.cx, y: c.cy, r0: 24, r: 9, close: 0.16, spin: 2.4, tick: 4, c: P.red, dur: 1.0 });
    c.fx('arc_sight', { x0: b[0], y0: b[1], x1: c.cx, y1: c.cy, c: P.red, dur: 0.46 });
    shoot(c, c.cx, c.cy, { dur: 0.16, c2: P.red });
  },
  beat: function (c, i) {
    var t = tp(c), x = t[0], y = t[1];
    if (i === 0) {
      c.shape({ k: 'impact', x: x, y: y, dur: 0.18, c: P.red, r: 6 }); brand(c, x, y); c.burst(x, y, [P.red, P.cream], 5, { spd: 28, life: 0.22 }); c.sfx('arc_thock');
      c.fx('star', { x: x, y: y - 0.2, s: 4, c: P.red, dur: 0.24 });
      c.at(0.04, function () { c.lunge().sfx('arc_twang'); shoot(c, x, y, { dur: 0.22, len: 9, tr: 12, c2: P.gold }); });      // 본 화살: 둘째 박자에 닿는다
      return;
    }
    c.shape({ k: 'impact', x: x, y: y, dur: 0.26, c: P.white, r: 12 }); c.fx('shock', { x: x, y: y, r: 22, c: P.red, c2: P.white, w: 2, dur: 0.35 });
    c.fx('beam', { x0: x, y0: y, x1: x + c.dx * 1.5, y1: y + c.dy * 1.5, w: 2, c: P.cream, c2: P.white, dur: 0.25 });
    c.fx('stain', { x: x, y: y, r: 8, c: P.deep, a: 0.3, c2: P.red, n: 4, dur: 1.8 });
    c.spray(x, y, [P.white, P.cream, P.red], 14, c.ang, 0.5, { spd: 60, life: 0.3 }); c.burst(x, y, [P.red, P.white], 8, { spd: 36, life: 0.3 });
    c.light(x, y, 26, P.red, 0.55, 0.3).shake(0.16).stop(0.04).flash(P.red, 0.04).boom('arc_thock');
  } });
// T3 ── 꿰뚫는 매눈: 시위를 끝까지 당긴다(겨눔 줄이 길 끝까지 뻗는다) → 한 발이 길 위의 모두를 차례로 꿰고 땅에 골을 남긴다
X.reg('xarc_pierce', {
  cast: function (c) {
    var b = bow(c), T = c.tiles, e = T.length ? T[T.length - 1] : [c.cx, c.cy];
    c.pose('back', 0.46, 3).sfx('swoosh').ghost(-c.dx * 0.25, -c.dy * 0.25, P.cream, 0.3, 0.4);
    c.fx('arc_sight', { x0: b[0], y0: b[1], x1: e[0], y1: e[1], c: P.cream, a: 0.75, dur: 0.34 });
    c.ring(b[0], b[1], 14, P.cream, { inv: true, dur: 0.28 }).light(b[0], b[1], 14, P.cream, 0.4, 0.3);
  },
  beat: function (c) {
    var b = bow(c), T = c.tiles, e = T.length ? T[T.length - 1] : [c.cx, c.cy], x1 = e[0] + c.dx * 0.4, y1 = e[1] + c.dy * 0.4, ux = c.ux, uy = c.uy;
    c.fx('beam', { x0: b[0], y0: b[1], x1: x1, y1: y1, w: 3, c: P.cream, c2: P.white, dur: 0.3 });
    c.fx('arc_arrow', { x: b[0], y: b[1], x1: x1, y1: y1, len: 12, tr: 16, c: P.white, c2: P.gold, cf: P.red, dur: 0.12 });
    c.fx('arc_groove', { x0: b[0], y0: b[1], x1: x1, y1: y1, c: P.dust, dur: 2.2 });
    c.hits(function (hx, hy, k) {
      var d = (Math.abs(hx - ux) + Math.abs(hy - uy)) * 0.018;
      c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: P.white, r: 9, d: d }); brand(c, hx, hy, d + 0.05);
      if (k < 5) c.spray(hx, hy, SPARK, 5, c.ang, 0.5, { spd: 50, life: 0.28 });
    }, 6);
    c.fx('shock', { x: b[0] + c.dx * 0.5, y: b[1] + c.dy * 0.5, r: 16, c: P.cream, thin: 1, w: 1, dur: 0.3 });
    stuck(c, e[0], e[1], c.dx || 0.3, 1.6);
    c.spray(b[0], b[1], DUST, 6, c.ang + 3.1416, 0.6, { spd: 26, up: 6, life: 0.35 });
    c.light(c.cx, c.cy, 26, P.cream, 0.5, 0.25).shake(0.2).stop(0.05).flash(P.cream, 0.05).boom('arc_snipe');
  } });
// T3 ── 천궁 소나기: 화살을 하늘로 쏘아 올린다 → 0.5초 뒤 세 차례로 쏟아진다 (왼쪽 · 오른쪽 · 온 자리). 박힌 화살이 잠깐 남는다
X.reg('xarc_storm', {
  cast: function (c) {
    var b = bow(c), k;
    c.pose('sink', 0.4, 2).sfx('arc_twang');
    for (k = 0; k < 4; k++) c.fx('arc_arrow', { x: b[0], y: b[1], x1: b[0] + c.dx * (0.7 + k * 0.5), y1: b[1] - 6 - (k % 2), len: 6, tr: 6, c: P.cream, c2: P.white, cf: P.red, d: k * 0.05, dur: 0.26 });
    c.at(0.12, function () { c.sfx('arc_twang'); });
  },
  mark: function (c, e) {
    var x = c.cx, y = c.cy, B = c.S.beats, T = e.dur, off = [[-0.8, -0.3], [0.8, 0.3], [0, 0]], k;
    c.fx('shadow', { x: x, y: y, r: 26, dur: T + B[2] });
    c.at(Math.max(0, T - 0.3), function () { c.sfx('arc_volley'); });
    for (k = 0; k < 3; k++) (function (k) {
      c.at(Math.max(0, T + B[k] - 0.14), function () { c.fx('arc_rain', { x: x + off[k][0], y: y + off[k][1], r: k === 2 ? 34 : 24, n: k === 2 ? 14 : 8, fall: 0.14, stag: 0.08, sx: k % 2 ? -16 : 16, c: P.cream, c2: P.white, cf: P.red, dur: 1.5 - k * 0.2 }); });
    })(k);
  },
  beat: function (c, i, last) {
    var x = c.cx, y = c.cy;
    c.hits(function (hx, hy, k) {
      c.shape({ k: 'impact', x: hx, y: hy, dur: 0.2, c: last ? P.white : P.cream, r: last ? 9 : 6 }); c.burst(hx, hy, SPARK, 2, { spd: 30, life: 0.2 });
      if (last && k < 3) brand(c, hx, hy, 0.06);
    }, last ? 4 : 2);
    c.burst(x, y + 0.2, DUST, last ? 10 : 6, { up: 12, grav: 50, spd: 30, life: 0.4, spread: last ? 44 : 30 });
    if (!last) { c.shake(0.08 + i * 0.04).sfx('arc_thock'); return; }
    c.fx('shock', { x: x, y: y, r: 36, c: P.cream, w: 2, dust: P.dust, dur: 0.4 }); c.fx('stain', { x: x, y: y, r: 24, c: P.dirt, a: 0.18, dur: 2 });
    c.light(x, y, 28, P.cream, 0.5, 0.3).shake(0.2).stop(0.04).flash(P.cream, 0.04).boom('arc_thock');
  } });
// T4 ── 한 대면 된다: 둘레가 어두워지고 숨을 고른다(심장 두 번). 붉은 겨눔 줄 · 천천히 조여드는 테 → 한 발. 꿰뚫고 나간다
// T5 ── 일격필살: 두 겹의 테와 금빛 겨눔 줄. 화살은 멀리까지 꿰뚫고 나가고, 뒤늦게 바람이 터진다
function aim(c, grand) {
  var b = bow(c), T = c.S.beats[0], x = c.cx, y = c.cy;
  c.dim(T + 0.3).pose('sink', T, 2).wash(P.night, grand ? 0.09 : 0.07, T + 0.3).sfx('arc_heart');
  c.at(T * 0.5, function () { c.sfx('arc_heart'); });
  c.fx('arc_sight', { x0: b[0], y0: b[1], x1: x, y1: y, c: grand ? P.gold : P.red, a: 0.9, grow: 0.3, dur: T + 0.04 });
  c.fx('arc_reticle', { x: x, y: y, r0: grand ? 34 : 26, r: 6, close: T / (T + 0.5), spin: grand ? 4.7 : 3.1, tick: 4, c: P.red, dur: T + 0.5 });
  if (grand) {
    c.fx('arc_reticle', { x: x, y: y, r0: 46, r: 12, close: T / (T + 0.5), spin: -3.1, tick: 3, c: P.gold, dur: T + 0.5 });
    c.fx('sigil', { x: c.ux, y: c.uy, r: 13, c: P.cream, c2: P.gold, sides: 0, runes: 4, dur: T + 0.2 });
    c.fx('emit', { x: b[0], y: b[1], sp: 0.6, rate: 14, n: 1, dur: T - 0.1, cols: GOLD, o: { up: 12, grav: -20, spd: 6, life: 0.4 } });
  }
  c.ring(b[0], b[1], grand ? 22 : 16, P.cream, { inv: true, dur: T * 0.5, d: T * 0.45 });
  c.at(T - 0.12, function () { c.fx('star', { x: b[0], y: b[1], s: grand ? 5 : 4, c: P.white, dur: 0.16 }); });      // 촉 끝이 번쩍
}
function snipe(c, grand) {
  var b = bow(c), t = tp(c), x = t[0], y = t[1], a = Math.atan2(y - b[1], x - b[0]), dx = Math.cos(a), dy = Math.sin(a), far = grand ? 4.5 : 1.6;
  c.fx('beam', { x0: b[0], y0: b[1], x1: x, y1: y, w: grand ? 5 : 4, c: P.cream, c2: P.white, dur: 0.24 });
  c.fx('beam', { x0: x, y0: y, x1: x + dx * far, y1: y + dy * far, w: 2, c: grand ? P.gold : P.dust, c2: P.pale, dur: grand ? 0.45 : 0.3 });      // 꿰뚫고 나간 길
  c.shape({ k: 'impact', x: x, y: y, dur: 0.3, c: P.white, r: grand ? 20 : 15 });
  c.fx('shock', { x: x, y: y, r: grand ? 34 : 28, c: P.red, c2: P.white, w: 3, dust: P.dust, dur: 0.45 }); c.fx('shock', { x: x, y: y, r: grand ? 46 : 38, c: P.white, w: 1, thin: 1, dur: 0.55, d: 0.1 });
  c.fx('crack', { x: x, y: y, r: grand ? 20 : 13, n: grand ? 8 : 6, c: grand ? P.red : null, dur: 2.4 });
  c.fx('cone', { x: x, y: y, a: a, spread: 0.45, len: grand ? 46 : 30, c: P.cream, c2: P.white, dur: 0.35 });
  c.spray(x, y, [P.white, P.cream, P.red], grand ? 30 : 22, a, 0.45, { spd: grand ? 110 : 84, life: 0.4, size: 2 }); c.burst(x, y, [P.white, P.red, P.cream], grand ? 16 : 12, { spd: 50, life: 0.35 });
  c.spray(b[0], b[1], DUST, 6, a + 3.1416, 0.7, { spd: 30, up: 6, life: 0.35 });      // 반동의 먼지
  stuck(c, x + dx * 0.2, y, dx || 0.3, 1.8);
  c.streak(grand ? 12 : 6, a, P.cream, 0.4, 0.3);
  c.light(x, y, grand ? 44 : 36, P.red, 0.8, 0.4).light(b[0], b[1], 18, P.cream, 0.5, 0.2).shake(grand ? 0.45 : 0.3).stop(grand ? 0.09 : 0.07).flash(P.white, grand ? 0.1 : 0.08).boom('arc_snipe');
  if (!grand) return;
  c.ghost(-dx * 0.25, -dy * 0.25, P.cream, 0.35, 0.4).wash(P.red, 0.08, 0.7);
  c.fx('stain', { x: x, y: y, r: 16, c: P.deep, a: 0.3, c2: P.red, n: 8, dur: 3 });
  c.at(0.22, function () {      // 뒤늦게 터지는 바람
    c.fx('shock', { x: x, y: y, r: 58, c: P.white, w: 1, thin: 1, dur: 0.6 }); c.fx('arc_groove', { x0: x, y0: y, x1: x + dx * far, y1: y + dy * far, c: P.dust, dur: 2.6 });
    c.fx('emit', { x: x + dx * 2, y: y + dy * 2, sp: 2.5, rate: 14, n: 1, dur: 0.8, cols: DUST, o: { up: 12, grav: 30, spd: 12, life: 0.6 } }); c.sfx('boom');
  });
}
X.reg('u_oneshot', { cast: function (c) { aim(c, false); }, beat: function (c) { snipe(c, false); } });
X.reg('ux_oneshot', { cast: function (c) { aim(c, true); }, beat: function (c) { snipe(c, true); } });
// T4 ── 세 갈래 화살: 시위 하나에 화살 셋. 겨눔 줄 셋이 부채처럼 갈라지고, 화살마다 다른 길로 휘어 날아가 꽂힌다. 발밑에 풀빛(둔화)
// T5 ── 다섯 갈래 화살: 다섯 줄. 꽂힌 자리마다 금빛 고리가 한 번 더 번진다
var BEND = [0, -7, 7, -12, 12];
function nock(c, grand) {
  var b = bow(c), T = c.S.beats[0], fl = 0.16;
  c.dim(T + 0.3).pose('back', T + 0.2, 3).sfx('swoosh');
  if (grand) c.fx('sigil', { x: c.ux, y: c.uy, r: 13, c: P.cream, c2: P.gold, sides: 5, skip: 2, dur: T + 0.3 });
  c.each(function (x, y, i) {
    c.fx('arc_sight', { x0: b[0], y0: b[1], x1: x, y1: y, c: grand ? P.gold : P.cream, a: 0.65, dur: T });
    c.fx('arc_reticle', { x: x, y: y, r0: 14, r: 7, close: (T - 0.02) / (T + 0.3), c: P.red, dur: T + 0.3 });
    c.fx('arc_arrow', { x: b[0], y: b[1], x1: x, y1: y - 0.1, h: BEND[i % 5], len: 8, tr: 10, c: P.cream, c2: grand ? P.gold : P.white, cf: P.red, d: T - fl, dur: fl });
  }, grand ? 5 : 3);
  c.at(T - fl, function () { c.lunge().sfx('arc_twang'); c.streak(grand ? 10 : 6, c.ang, P.cream, 0.35, 0.25); });
}
function volley(c, grand) {
  c.each(function (x, y) { c.burst(x, y + 0.3, DUST, 2, { up: 10, grav: 50, spd: 14, life: 0.35 }); }, 5);
  c.hits(function (x, y, k) {
    c.shape({ k: 'impact', x: x, y: y, dur: 0.24, c: P.white, r: grand ? 12 : 10 }); brand(c, x, y, 0.05);
    if (k < (grand ? 4 : 3)) c.fx('stain', { x: x, y: y, r: 9, c: P.green, a: 0.3, c2: P.leaf, n: 5, dur: 2.2 });      // 둔화: 발밑에 감기는 풀빛
    c.burst(x, y, SPARK, 6, { spd: 40, life: 0.3 }); c.burst(x, y + 0.3, LEAF, 4, { up: 8, grav: 20, spd: 14, life: 0.6 });
    c.light(x, y, 22, P.cream, 0.5, 0.3);
    if (grand) c.fx('shock', { x: x, y: y, r: 18, c: P.gold, w: 1, thin: 1, dur: 0.4, d: 0.14 });
  }, 5);
  c.shake(grand ? 0.36 : 0.24).stop(grand ? 0.07 : 0.05).flash(P.cream, grand ? 0.09 : 0.06).boom('arc_thock');
  if (grand) c.wash(P.green, 0.06, 0.7);
}
X.reg('u_three', { cast: function (c) { nock(c, false); }, beat: function (c) { volley(c, false); } });
X.reg('ux_three', { cast: function (c) { nock(c, true); }, beat: function (c) { volley(c, true); } });
// T4 ── 화살 폭우: 하늘이 잠깐 어두워진다. 쏘아 올린 화살이 한꺼번에 쏟아지고, 화살비가 3초 더 내린다 (맥박마다 한 줄기씩)
// T5 ── 하늘 가르는 비: 하늘에 흰 금이 그어지고 더 굵게 쏟아진다. 4초 내리다가 마지막 한 줄기가 크게 떨어진다
function delugeUp(c, grand) {
  var b = bow(c), x = c.cx, y = c.cy, T = c.S.beats[0], k;
  c.dim(T + 0.5).wash(P.night, grand ? 0.1 : 0.08, grand ? 2.0 : 1.5).pose('sink', T, 2).sfx('arc_twang');
  for (k = 0; k < (grand ? 7 : 5); k++) c.fx('arc_arrow', { x: b[0], y: b[1], x1: b[0] + c.dx * (0.5 + k * 0.4), y1: b[1] - 6.5 - (k % 3) * 0.5, len: 6, tr: 6, c: P.cream, c2: P.white, cf: P.red, d: k * 0.035, dur: 0.24 });
  c.at(0.1, function () { c.sfx('arc_twang'); });
  c.fx('shadow', { x: x, y: y, r: 34, dur: T + 0.3 });
  if (grand) c.at(0.16, function () { c.fx('beam', { x0: x - 4, y0: y - 5.6, x1: x + 4, y1: y - 4.4, w: 4, c: P.cream, c2: P.white, dur: 0.45 }); c.streak(12, 1.85, P.cream, 0.9, 0.28); });      // 하늘이 갈라진다
  else c.at(Math.max(0, T - 0.25), function () { c.streak(6, 1.85, P.cream, 0.6, 0.25); });
  c.at(Math.max(0, T - 0.3), function () { c.sfx('arc_volley'); });
  c.at(Math.max(0, T - 0.14), function () { c.fx('arc_rain', { x: x, y: y, r: 36, n: grand ? 34 : 24, fall: 0.14, stag: 0.32, sx: 16, c: P.cream, c2: P.white, cf: P.red, dur: 1.6 }); });
}
function deluge(c, grand) {
  var x = c.cx, y = c.cy;
  c.hits(function (hx, hy, k) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: P.white, r: 9, d: k * 0.02 }); brand(c, hx, hy, 0.06 + k * 0.02); c.burst(hx, hy, SPARK, 3, { spd: 34, life: 0.24 }); }, 6);
  c.fx('shock', { x: x, y: y, r: 38, c: P.cream, w: 3, dust: P.dust, dur: 0.45 }); c.fx('stain', { x: x, y: y, r: 30, c: P.dirt, a: 0.2, dur: grand ? 4.5 : 3.5 });
  c.burst(x, y + 0.2, DUST, grand ? 26 : 20, { up: 14, grav: 50, spd: 36, life: 0.5, spread: 60 });
  c.light(x, y, 36, P.cream, 0.6, 0.4).shake(grand ? 0.4 : 0.28).stop(grand ? 0.08 : 0.06).flash(P.cream, grand ? 0.09 : 0.06).boom('arc_thock');
  if (grand) { c.fx('shock', { x: x, y: y, r: 54, c: P.white, w: 1, thin: 1, dur: 0.6, d: 0.12 }); c.fx('crack', { x: x, y: y, r: 22, n: 7, dur: 3 }); }
}
function rainTick(c, grand) {
  var T = c.tiles, t = T.length ? T[(c.i * 5) % T.length] : [c.cx, c.cy];
  c.fx('arc_rain', { x: (c.cx + t[0]) / 2, y: (c.cy + t[1]) / 2, r: 30, n: grand ? 10 : 7, fall: 0.1, stag: 0.3, sx: c.i % 2 ? -16 : 16, c: P.cream, c2: P.white, cf: P.red, dur: 0.9 });
  c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.18, c: P.cream, r: 5, d: 0.08 }); c.burst(hx, hy, SPARK, 2, { spd: 26, life: 0.2 }); }, 5);
  c.burst(c.cx, c.cy + 0.2, DUST, 5, { up: 10, grav: 50, spd: 24, life: 0.35, spread: 50 }); c.sfx('arrow');
}
X.reg('u_deluge', { cast: function (c) { delugeUp(c, false); }, beat: function (c) { deluge(c, false); }, zoneTick: function (c) { rainTick(c, false); } });
X.reg('ux_deluge', { cast: function (c) { delugeUp(c, true); }, beat: function (c) { deluge(c, true); }, zoneTick: function (c) { rainTick(c, true); },
  zoneEnd: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('arc_rain', { x: x, y: y, r: 36, n: 18, fall: 0.1, stag: 0.1, sx: 16, c: P.cream, c2: P.gold, cf: P.red, dur: 1.2 });
    c.fx('shock', { x: x, y: y, r: 40, c: P.cream, c2: P.white, w: 2, dust: P.dust, dur: 0.45, d: 0.08 });
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: P.white, r: 9, d: 0.08 }); }, 6);
    c.burst(x, y + 0.2, DUST, 14, { up: 14, grav: 50, spd: 34, life: 0.45, spread: 56 }); c.light(x, y, 28, P.cream, 0.55, 0.35).shake(0.2).flash(P.cream, 0.05).boom('arc_volley');
  } });
})();
