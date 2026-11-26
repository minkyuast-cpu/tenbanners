// 전민 — 기술 연출: 비병 (땅을 박차고 올라 내리꽂는다 · 날개 바람 · 윗길은 용의 포효와 숨결). 틀과 쓰는 법은 src/skfx.js · docs/SKILL_FX.md.
//   이 파일이 맡는 기술: cmd_fly · fly_dive (T1) · fly_gale (T2) · xfly_dive · xfly_roar · xfly_breath (T3) · u_stoop · u_gale · u_canopy (T4) · ux_* 셋 (T5)
//   빛깔: 깃의 흰빛 · 하늘 #dff4ff · 푸름 #62b0ee · 용의 청록 #9fe8ec (짙은 #2f6fa8) · 바람의 잿빛 #cdd5e3 #8f9ab3 · 흙먼지 #d8c39a · 용의 불 #ff9a3c #ffd75e #d9442b · 윗길 필살기의 금 #f6cf57
//   무늬: 몸이 땅을 떠난다(높이 떴다가 꽂힌다) · 땅에 드리우는 날개 그림자 · 흩날리는 깃 · 펼치는 날개 · 바람 줄기와 돌개바람 · 톱니 진 포효의 고리 · 불의 숨결
//   고친 것 (옛 → 새 · tools/skdmg.js 허수아비 / 실전):
//     cmd_fly      그대로 (설명의 긴 줄표만)
//     fly_dive     140% → 같다, 뛰어올라 꽂히는 뜸 0.2초                                                  1.00 / 1.00
//     fly_gale     125% + 밀어냄 → 같다, 날개를 접었다 펴는 뜸 0.16초                                      1.00 / 1.00
//     xfly_dive    190% + 표식 → 내리꽂기 130% + 날아오르며 발톱 72% 와 표식 (표식은 둘째에)                1.01 / 1.00
//     xfly_roar    180% + 밀어냄 + 공격 −20% + 게이지 → 포효 70%(공격 −20% · 게이지) + 날개 바람 125%(밀어냄)   1.00 / 1.01
//     xfly_breath  220% + 화상 + 표식 → 세 번 쏟아 낸다 70% + 75% + 90% (화상은 처음, 표식은 마지막)         1.00 / 0.99
//     u_stoop      300% → 같다, 솟구쳤다 꽂히는 뜸 0.7초                                                  1.00 / 1.01
//     ux_stoop     400% → 대상 360% + 충격 45% (대상과 그 곁의 적 — 곁의 적이 받는 45% 는 새로 붙은 것)     대상 1.00 · 실전 1.03 · 뭉친 허수아비 1.22
//     u_gale       180% + 밀어냄 + 표식 → 세 번 휘감는다 55% + 60% + 95% (밀어냄 · 표식은 마지막)            1.02 / 0.98
//     ux_gale      230% + 밀어냄 + 표식 → 세 번 60% + 65% + 85% + 표식, 태풍의 눈 3초(1.5초마다 35%), 걷히며 밀어낸다   1.02 / 1.01
//     u_canopy · ux_canopy   그대로, 날개가 다 펴질 때(0.3초) 걸린다
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var X = DS.skfx; if (!X) return;
var P = X.PAL.fly = { white: '#ffffff', sky: '#dff4ff', blue: '#62b0ee', teal: '#9fe8ec', deep: '#2f6fa8', grey: '#cdd5e3', storm: '#8f9ab3', dust: '#d8c39a', earth: '#a8754a', dirt: '#6f4a2c', fire: '#ff9a3c', flame: '#ffd75e', coal: '#d9442b', ash: '#1b1016', gold: '#f6cf57', mark: '#ff6a5a' };
var AIR = [P.white, P.grey, P.sky], DUST = [P.dust, P.earth, P.dirt], ROCK = [P.dust, P.earth, P.dirt, P.grey], FIRE = [P.fire, P.flame, P.coal], TEAL = [P.teal, P.white, P.sky], K = '#1b1626';
var hs = X.hs, env = X.env, ease = X.ease;

// ───────── 기술 표 ─────────
X.def('cmd_fly', { desc: '호령. 모든 아군의 행동 소모 −15% (25초), 게이지 +15.' });
// 급강하 · 날개 바람: 뛰어올라 꽂히는 · 날개를 접었다 펴는 짧은 뜸. 수치는 그대로
X.def('fly_dive', { beats: [0.2] });
X.def('fly_gale', { beats: [0.16] });
// 용의 급강하: 한 번(190%) → 내리꽂기 130% + 날아오르며 할퀴기 72%. 표식은 할퀴며 남긴다 (앞의 한 방이 제 표식 덕을 보지 않게 — 받는 피해는 그대로)
X.def('xfly_dive', { beats: [0.4, 0.66],
  eff: [{ t: 'dmg', m: 1.3, vs: 'mark', vx: 1.5 }, { t: 'dmg', m: 0.72, vs: 'mark', vx: 1.5, b: 1 }, { t: 'status', s: 'mark', dur: 8, p: 20, b: 1 }],
  desc: '2~5칸 밖의 적에게 내리꽂아 130%, 날아오르며 발톱으로 72% (둘 다 표식이 있으면 1.5배). 표식을 남기고 세 칸 날아오른다.' });
// 용의 포효: 한 번(180%) → 포효 70%(공격 −20% · 게이지) + 날개 바람 120%(밀어냄)
X.def('xfly_roar', { beats: [0.25, 0.6],
  eff: [{ t: 'dmg', m: 0.7 }, { t: 'buff', s: 'atk', p: -20, dur: 10 }, { t: 'gauge', v: -30 }, { t: 'dmg', m: 1.25, b: 1 }, { t: 'knock', n: 1, b: 1 }],
  desc: '포효로 둘레 2칸 적에게 70%, 공격 −20% (10초), 게이지를 깎는다. 이어서 날개 바람 125%로 밀어내고 날아오른다.' });
// 용황의 숨결: 한 번(220%) → 숨결이 이어지는 동안 세 번 70% + 75% + 90%. 화상은 처음부터, 표식은 마지막에
X.def('xfly_breath', { beats: [0.25, 0.47, 0.7],
  eff: [{ t: 'dmg', m: 0.7, type: 'magic', stat: 'atk' }, { t: 'status', s: 'burn', dur: 8, p: 3 }, { t: 'dmg', m: 0.75, type: 'magic', stat: 'atk', b: 1 }, { t: 'dmg', m: 0.9, type: 'magic', stat: 'atk', b: 2 }, { t: 'status', s: 'mark', dur: 8, p: 20, b: 2 }],
  desc: '용이 직선 5칸에 불을 세 번 쏟아 낸다. 70%, 75%, 90%. 화상을 입히고, 마지막에 표식.' });
// 하늘 낙하 · 천공 낙하: 솟구쳤다가 꽂힌다. 천공 낙하는 꽂힌 자리의 충격이 곁의 적에게도 45% (대상이 받는 것은 360% + 45% — 옛 400% 와 같다)
X.def('u_stoop', { beats: [0.7], desc: '2~6칸 밖의 적 위로 솟구쳤다가 0.7초 뒤 내리꽂는다. 300%(표식이 있으면 1.5배), 세 칸 날아오른다.' });
X.def('ux_stoop', { beats: [0.9],
  eff: [{ t: 'dmg', m: 3.6, vs: 'mark', vx: 1.6 }, { t: 'dmg', m: 0.45, to: 'foe', at: 'tgt', r: 1 }],
  desc: '2~7칸 밖의 적 위로 솟구쳤다가 0.9초 뒤 내리꽂는다. 360%(표식이 있으면 1.6배), 꽂힌 자리의 충격이 그 적과 곁의 적에게 45%. 네 칸 날아오른다.' });
// 돌개바람: 한 번(180%) → 세 번 휘감는다 55% + 60% + 90%, 밀어냄과 표식은 마지막에
X.def('u_gale', { beats: [0.3, 0.55, 0.85],
  eff: [{ t: 'dmg', m: 0.55 }, { t: 'dmg', m: 0.6, b: 1 }, { t: 'dmg', m: 0.95, b: 2 }, { t: 'knock', n: 1, b: 2 }, { t: 'status', s: 'mark', dur: 10, p: 20, b: 2 }],
  desc: '겨눈 십자 범위를 돌개바람이 세 번 휘감는다. 55%, 60%, 95%. 마지막에 밀어내고 표식을 남긴다.' });
// 태풍의 눈: 한 번(230%) → 세 번 60% + 65% + 85% 와 표식, 태풍의 눈이 3초 남아 1초마다 20%, 걷히면서 밀어낸다
X.def('ux_gale', { beats: [0.3, 0.55, 0.85],
  eff: [{ t: 'dmg', m: 0.6 }, { t: 'dmg', m: 0.65, b: 1 }, { t: 'dmg', m: 0.85, b: 2 }, { t: 'status', s: 'mark', dur: 12, p: 25, b: 2 }],
  zone: { dur: 3, every: 1.5, k: 'wind', eff: [{ t: 'dmg', m: 0.35 }], end: [{ t: 'knock', n: 1 }] },
  desc: '겨눈 2칸 반경을 태풍이 세 번 휘감는다. 60%, 65%, 85%, 표식(+25%). 태풍의 눈은 3초 남아 그 안의 적에게 1.5초마다 35%, 걷히면서 밀어낸다.' });
// 날개 그늘 · 용익의 그늘: 날개가 다 펴질 때(0.3초) 걸린다. 수치는 그대로
X.def('u_canopy', { beats: [0.3] });
X.def('ux_canopy', { beats: [0.3] });

// ───────── 소리 ─────────
X.sound('fly_flap', function (tone, noise) { noise(0.12, 0.16, 500, 0.7, 0, 'lowpass'); noise(0.1, 0.08, 1400, 0.9, 0.05); }, 5.9);      // 날갯짓
X.sound('fly_swoop', function (tone, noise) { noise(0.26, 0.1, 2400, 1.2); tone(900, 300, 0.24, 'sine', 0.03); }, 2.6);      // 내리꽂는 바람
X.sound('fly_cry', function (tone) { tone(1500, 1150, 0.08, 'triangle', 0.03); tone(1650, 1000, 0.13, 'triangle', 0.028, 0.09); }, 4.2);      // 매 울음 (작게)
X.sound('fly_roar', function (tone, noise) { tone(140, 70, 0.5, 'sawtooth', 0.08); tone(147, 62, 0.5, 'sawtooth', 0.06); noise(0.5, 0.2, 350, 0.5, 0, 'lowpass'); noise(0.3, 0.06, 1800, 0.8, 0.05); }, 1.9);      // 용의 포효
X.sound('fly_gale', function (tone, noise) { noise(0.45, 0.16, 900, 1.2); noise(0.35, 0.1, 2200, 1.4, 0.08); tone(260, 520, 0.4, 'sine', 0.025); }, 3.0);      // 돌개바람

// ───────── 그림 조각 ─────────
function PL(g, a, b, c, d, w) { DS.VX.pxLine(g, a, b, c, d, w); }
function disc(g, cx, cy, rx, ry) { ry = Math.max(1, Math.round(ry)); for (var y = -ry; y <= ry; y++) { var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5)))); if (w > 0) g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1); } }
// 흩날리는 깃: n 장이 sp 픽셀 안에서 살짝 떴다가(up) 흔들리며 내려앉는다(fall)
X.kind('fly_feather', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var n = p.n || 3, sp = p.sp || 8, i, x, y, q, a, s, w;
  for (i = 0; i < n; i++) {
    q = f * (1 + hs(i, p.sd) * 0.5); if (q >= 1) continue; a = env(q, 0.1, 0.35); w = f * p.dur * 5 + i * 2.1;
    x = Math.round(cx + (hs(i + 5, p.sd) - 0.5) * 2 * sp + Math.sin(w) * 3); y = Math.round(cy - (p.up || 8) * Math.sin(Math.min(1, q * 3) * 1.5708) + (p.fall || 12) * q * q + (hs(i + 9, p.sd) - 0.5) * sp * 0.5);
    s = Math.sin(w) > 0 ? 1 : -1;
    g.globalAlpha = a * 0.45; g.fillStyle = K; g.fillRect(x, y + 1, 2, 1);
    g.globalAlpha = a; g.fillStyle = i % 2 ? (p.c2 || p.c) : p.c; g.fillRect(x, y, 2, 1); g.fillRect(x + s, y - 1, 2, 1); g.fillStyle = '#ffffff'; g.fillRect(x + s * 2, y - 2, 1, 1);
  }
} });
// 펼치는 날개 한 짝: side = −1 왼쪽 · 1 오른쪽 · s 날개 뼈의 길이 · n 깃 수 · mem = 깃 끝을 잇는 막(용의 날개). 뼈가 위로 솟았다가 펴지며 한 번 내리친다, 깃은 뼈에서 아래로 드리운다
X.kind('fly_wing', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var n = p.n || 6, s = p.s || 13, sd = p.side || 1, q = ease(Math.min(1, f / 0.25)), an = -1.3 + 0.75 * q + (f > 0.25 ? (f - 0.25) * 0.9 : 0), a = env(f, 0.08, 0.35), ox = cx + sd * 2, oy = cy - 4, ca = Math.cos(an) * sd, sa = Math.sin(an), j, t, bx, by, len, px = ox, py = oy, tx, ty;
  g.globalAlpha = a * 0.35; g.fillStyle = K; PL(g, ox, oy + 1, ox + ca * s, oy + sa * s + 1, 2);
  for (j = 1; j <= n; j++) {
    t = j / n; bx = ox + ca * s * t; by = oy + sa * s * t; len = s * 0.62 * Math.sin(3.1416 * (0.18 + 0.72 * t)) * (0.4 + 0.6 * q);
    tx = bx + sd * len * 0.28; ty = by + len;
    g.globalAlpha = a * 0.3; g.fillStyle = K; PL(g, bx + 1, by + 1, tx + 1, ty + 1, 1);
    g.globalAlpha = a * 0.9; g.fillStyle = j % 2 ? (p.c2 || p.c) : p.c; PL(g, bx, by, tx, ty, 1);
    if (p.mem) { g.globalAlpha = a * 0.75; g.fillStyle = p.c2 || p.c; PL(g, px, py, tx, ty, 1); }
    px = tx; py = ty;
  }
  g.globalAlpha = a; g.fillStyle = p.c; PL(g, ox, oy, ox + ca * s, oy + sa * s, 2);
  g.fillStyle = '#ffffff'; g.fillRect(Math.round(ox + ca * s), Math.round(oy + sa * s), 2, 2);
} });
// 땅에 드리우는 날개 그림자: grow = 자라며 짙어진다 (내려올수록) · r 몸의 크기
X.kind('fly_shadow', { L: 0, draw: function (g, p, f, time, V, cx, cy) {
  var r = (p.r || 8) * (p.grow ? 0.4 + 0.6 * f : 1), a = (p.a || 0.3) * (p.grow ? 0.35 + 0.65 * f : 1) * env(f, 0.12, 0.1), y = cy + 6;
  g.globalAlpha = a; g.fillStyle = '#000000';
  disc(g, cx, y, r * 0.42, r * 0.26); disc(g, cx - r * 0.72, y - r * 0.08, r * 0.55, r * 0.16); disc(g, cx + r * 0.72, y - r * 0.08, r * 0.55, r * 0.16);
} });
// 바람 줄기: rad = 사방으로 · 아니면 a 쪽으로(±spread). r0 → r 로 밀려 나간다
X.kind('fly_gust', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var n = p.n || 8, e = ease(f), al = 1 - f * f, i, a, d, len, x0, y0, ca, sa;
  for (i = 0; i < n; i++) {
    a = p.rad ? i / n * 6.2832 + hs(i, p.sd) * 0.5 : p.a + (hs(i, p.sd) - 0.5) * 2 * (p.spread || 0.4); ca = Math.cos(a); sa = Math.sin(a) * 0.62;
    d = (p.r0 || 4) + ((p.r || 30) - (p.r0 || 4)) * e * (0.65 + 0.35 * hs(i + 7, p.sd)); len = (p.len || 7) * (0.6 + 0.8 * hs(i + 3, p.sd)) * (1 - f * 0.4);
    x0 = cx + ca * d; y0 = cy + sa * d + (hs(i + 13, p.sd) - 0.5) * (p.jit == null ? 6 : p.jit);
    g.globalAlpha = al * 0.4; g.fillStyle = K; PL(g, x0 - ca * len, y0 - sa * len + 1, x0, y0 + 1, 1);
    g.globalAlpha = al * (i % 2 ? 0.95 : 0.75); g.fillStyle = i % 3 ? p.c : (p.c2 || '#ffffff'); PL(g, x0 - ca * len, y0 - sa * len, x0, y0, 1);
  }
} });
// 돌개바람: 땅에서 좁게 서서 위로 벌어지는 소용돌이 · h 높이 · r0 → r1 반지름 · spin 도는 빠르기 (게임 시계로 돈다). 앞쪽 띠는 밝고 길게, 뒤쪽은 옅게
X.kind('fly_twister', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var H = p.h || 36, N = Math.max(5, Math.round(H / 3.5)), a = env(f, 0.1, 0.15), t = f * p.dur * (p.spin || 9), up = Math.min(1, f * 6), k, j, r, y, ph, sway, fr, w, x;
  for (k = 0; k < N * up; k++) {
    r = (p.r0 || 2) + ((p.r1 || 12) - (p.r0 || 2)) * Math.pow(k / N, 0.8); y = cy + 6 - k * (H / N); sway = Math.sin(t * 0.35 + k * 0.5) * k * 0.3;
    for (j = 0; j < 3; j++) {
      ph = t + k * 0.9 + j * 2.094; fr = Math.sin(ph) > 0; w = fr ? Math.max(2, Math.round(r * 0.55)) : Math.max(1, Math.round(r * 0.25));
      x = Math.round(cx + sway + Math.cos(ph) * r - w / 2); y = Math.round(y);
      if (fr) { g.globalAlpha = a * 0.4; g.fillStyle = K; g.fillRect(x, y + 1 + Math.round(Math.sin(ph) * r * 0.3), w, 1); }
      g.globalAlpha = a * (fr ? 0.95 : 0.35); g.fillStyle = j ? p.c : (p.c2 || '#ffffff');
      g.fillRect(x, y + Math.round(Math.sin(ph) * r * 0.3), w, fr && r >= 6 ? 2 : 1);
    }
  }
} });
// 포효의 고리: 톱니 진 소리의 물결이 r0 → r 로 번진다
X.kind('fly_roar', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var r = (p.r0 || 6) + ((p.r || 40) - (p.r0 || 6)) * ease(f), a = 1 - f * f, n = Math.max(14, Math.round(r * 0.9)), i, an, rr, x, y;
  for (i = 0; i < n; i++) {
    an = i / n * 6.2832; rr = r + (i % 2 ? 2 : -1.5); x = Math.round(cx + Math.cos(an) * rr); y = Math.round(cy + 2 + Math.sin(an) * rr * 0.62);
    g.globalAlpha = a * 0.4; g.fillStyle = K; g.fillRect(x, y + 1, 2, 1);
    g.globalAlpha = a; g.fillStyle = i % 2 ? p.c : (p.c2 || '#ffffff'); g.fillRect(x, y, 2, i % 2 ? 2 : 1);
  }
} });
// 불의 숨결: (x,y)에서 a 쪽으로 len 픽셀. adv 초 동안 뻗어 나가 이어지다가 꼬리부터 스러진다 · w 가장 넓은 폭
X.kind('fly_breath', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var t = f * p.dur, len = p.len || 80, front = len * Math.min(1, t / (p.adv || 0.15)), tail = f > 0.8 ? len * (f - 0.8) / 0.2 : 0, ca = Math.cos(p.a), sa = Math.sin(p.a), W = p.w || 8, fr = Math.floor(t * 24), d, w, x, y, fl, h;
  for (d = tail; d < front; d += 2) {
    w = Math.round(2 + (W - 2) * Math.min(1, d / (len * 0.4))); fl = (hs(d + fr * 7, p.sd) - 0.5) * w * 0.8; h = w >> 1;
    x = Math.round(cx + ca * d - sa * fl); y = Math.round(cy - 3 + sa * d + ca * fl);
    g.globalAlpha = 0.8; g.fillStyle = P.coal; g.fillRect(x - h, y - h, w, w);
    if (w > 2) { g.globalAlpha = 0.9; g.fillStyle = P.fire; g.fillRect(x - h + 1, y - h + 1, w - 2, w - 2); }
    if (w > 4 && hs(d + fr * 3, p.sd) > 0.35) { g.fillStyle = d < len * 0.3 ? '#ffffff' : P.flame; g.fillRect(x - h + 2, y - h + 2, w - 4, w - 4); }
  }
} });
// 발톱 자국: 세 줄이 비스듬히 그어진다 · dir 긋는 쪽
X.kind('fly_claw', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var q = Math.min(1, f / 0.4), k = f > 0.4 ? (f - 0.4) / 0.6 : 0, s = p.s || 8, dir = p.dir || 1, j, x0, y0;
  for (j = -1; j <= 1; j++) {
    x0 = cx - s * dir + j * 4; y0 = cy - s - 2 + Math.abs(j);
    g.globalAlpha = (1 - k) * 0.45; g.fillStyle = K; PL(g, x0 + 2 * s * dir * k * q + 1, y0 + 2 * s * k * q + 1, x0 + 2 * s * dir * q + 1, y0 + 2 * s * q + 1, 1);
    g.globalAlpha = 1 - k * 0.7; g.fillStyle = j ? p.c : '#ffffff'; PL(g, x0 + 2 * s * dir * k * q, y0 + 2 * s * k * q, x0 + 2 * s * dir * q, y0 + 2 * s * q, j ? 1 : 2);
  }
} });

// ───────── 연출 ─────────
function tp(c) { var p = c.ids && c.ids.length ? c.pos(c.ids[0]) : null; return p || [c.cx, c.cy]; }      // 한 사람을 겨눈 기술: 그 사람이 지금 선 자리
function head(c) { return [c.ux + c.dx * 0.4, c.uy + c.dy * 0.4 - 0.35]; }      // 탈것의 머리
function brand(c, x, y, d) { c.ring(x, y, 11, P.mark, { inv: true, w: 2, dur: 0.3, d: d || 0 }); }      // 표식
function wings(c, x, y, s, o) { o = o || {}; for (var k = -1; k <= 1; k += 2) c.fx('fly_wing', { x: x, y: y, side: k, s: s, n: o.n || 6, mem: o.mem, c: o.c || P.white, c2: o.c2 || P.grey, d: o.d || 0, dur: o.dur || 0.36 }); }
function feathers(c, x, y, n, sp, dur, c2) { c.fx('fly_feather', { x: x, y: y, n: n, sp: sp, up: Math.min(14, 5 + sp * 0.4), fall: 10 + sp * 0.5, c: P.white, c2: c2 || P.grey, dur: dur || 0.8 }); }

// T1 ── 강습 신호 (호령): 신호가 하늘로 솟아 반짝이고, 아군 머리 위로 깃이 하나씩 내려앉는다
X.reg('cmd_fly', { cast: function (c) {
  var x = c.ux, y = c.uy;
  c.castPose(P.sky).pose('rise', 0.3, 2).sfx('fly_cry');
  c.fx('beam', { x0: x, y0: y - 0.6, x1: x, y1: y - 2.6, w: 2, c: P.sky, c2: P.white, dur: 0.22 });
  c.fx('star', { x: x, y: y - 2.7, s: 4, c: P.sky, d: 0.12, dur: 0.3 });
  c.ring(x, y, 12, P.sky, { dur: 0.35 });
  c.each(function (ax, ay, i, d) {
    if (i < 5) c.fx('fly_feather', { x: ax, y: ay - 1.0, n: 1, sp: 2, up: 4, fall: 9, c: P.white, c2: P.sky, d: 0.15 + Math.min(0.2, d * 0.04), dur: 0.6 });
    c.burst(ax, ay - 0.3, [P.sky, P.teal], 2, { up: 20, grav: -14, spd: 5, life: 0.45 });
  }, 7);
} });
// T1 ── 급강하: 가볍게 뛰어올라 — 비스듬한 흰 줄기로 꽂힌다. 깃 몇 장
X.reg('fly_dive', {
  cast: function (c) { c.pose('hop', 0.22, 9).sfx('fly_swoop'); },
  beat: function (c) {
    var t = tp(c), x = t[0], y = t[1];
    c.fx('beam', { x0: x - c.dx * 1.3, y0: y - 2.3, x1: x, y1: y, w: 2, c: P.sky, c2: P.white, dur: 0.16 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 8 }).ring(x, y + 0.2, 11, P.dust, { dur: 0.28 });
    feathers(c, x, y - 0.3, 3, 9, 0.7);
    c.burst(x, y, AIR, 6, { spd: 30, up: 12, grav: 30, life: 0.35 });
    c.lunge().light(x, y, 14, P.sky, 0.38, 0.2).boom('punch');
  } });
// T2 ── 날개 바람: 몸을 낮췄다가 날개를 편다 — 두 날개가 펼쳐지고 바람 줄기가 사방으로 밀려 나간다
X.reg('fly_gale', {
  cast: function (c) { c.pose('sink', 0.16, 3).sfx('fly_flap'); },
  beat: function (c) {
    var x = c.ux, y = c.uy;
    c.pose('rise', 0.3, 3); wings(c, x, y, 13);
    c.fx('fly_gust', { x: x, y: y, rad: 1, n: 10, r0: 7, r: 27, len: 7, c: P.grey, c2: P.white, dur: 0.34 });
    c.fx('shock', { x: x, y: y, r: 25, c: P.grey, w: 1, thin: 1, dust: P.dust, dur: 0.36 });
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.2, c: P.white, r: 7 }); c.spray(hx, hy, [P.dust, P.grey, P.white], 3, Math.atan2(hy - y, hx - x), 0.6, { spd: 40, life: 0.3 }); }, 5);
    feathers(c, x, y - 0.5, 4, 14, 0.8);
    c.light(x, y, 20, P.sky, 0.4, 0.3).shake(0.1).boom('fly_gale');
  } });
// T3 ── 용의 급강하: 높이 솟는다(땅에 날개 그림자가 자란다) → 청록 줄기와 잔상을 끌고 꽂힌다(땅이 갈라진다) → 날아오르며 발톱 세 줄
X.reg('xfly_dive', {
  cast: function (c) {
    c.pose('rise', 0.42, 34).sfx('fly_cry');
    c.fx('fly_shadow', { x: c.u.x, y: c.u.y, r: 11, grow: 1, a: 0.34, dur: 0.42 });
    feathers(c, c.ux, c.uy - 0.4, 3, 8, 0.7, P.teal);
    c.at(0.22, function () { c.sfx('fly_swoop'); });
  },
  beat: function (c, i) {
    var t = tp(c), x = t[0], y = t[1];
    if (i === 0) {
      c.fx('beam', { x0: x - c.dx * 1.6, y0: y - 3.4, x1: x, y1: y, w: 3, c: P.teal, c2: P.white, dur: 0.2 });
      c.ghost(-c.dx * 0.35, -0.9, P.teal, 0.3, 0.5).ghost(-c.dx * 0.7, -1.8, P.teal, 0.26, 0.35);
      c.shape({ k: 'impact', x: x, y: y, dur: 0.26, c: P.white, r: 12 });
      c.fx('shock', { x: x, y: y, r: 22, c: P.teal, c2: P.white, w: 2, dust: P.dust, dur: 0.4 }); c.fx('crack', { x: x, y: y, r: 10, n: 5, dur: 2 });
      c.spray(x, y, ROCK, 10, -1.5708, 1.1, { spd: 48, grav: 150, life: 0.45, size: 2 }); c.burst(x, y, AIR, 8, { spd: 40, life: 0.3 });
      feathers(c, x, y - 0.4, 5, 12, 0.9, P.teal);
      c.lunge().light(x, y, 26, P.teal, 0.55, 0.3).shake(0.2).stop(0.05).flash(P.teal, 0.05).boom('quakeHit');
      return;
    }
    c.pose('hop', 0.3, 8);
    c.fx('fly_claw', { x: x, y: y, s: 8, dir: c.dx < 0 ? -1 : 1, c: P.teal, dur: 0.26 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 8 }); brand(c, x, y, 0.06);
    c.burst(x, y, [P.white, P.teal, P.mark], 8, { spd: 44, life: 0.28 });
    c.light(x, y, 20, P.teal, 0.45, 0.25).shake(0.12).boom('slash');
  } });
// T3 ── 용의 포효: 몸을 세우고 — 톱니 진 소리의 고리가 세 겹으로 번진다(적이 움츠러든다) → 두 날개를 펴 바람으로 밀어낸다
X.reg('xfly_roar', {
  cast: function (c) { c.pose('rise', 0.3, 4).ring(c.ux, c.uy, 22, P.teal, { inv: true, w: 2, dur: 0.24 }); c.at(0.08, function () { c.sfx('fly_roar'); }); },
  beat: function (c, i) {
    var x = c.ux, y = c.uy, h = head(c);
    if (i === 0) {
      c.fx('fly_roar', { x: h[0], y: h[1], r0: 6, r: 38, c: P.teal, c2: P.white, dur: 0.4 }); c.fx('fly_roar', { x: h[0], y: h[1], r0: 6, r: 46, c: P.teal, c2: P.white, d: 0.09, dur: 0.42 }); c.fx('fly_roar', { x: h[0], y: h[1], r0: 4, r: 30, c: P.sky, c2: P.white, d: 0.18, dur: 0.36 });
      c.pose('shake', 0.3, 1.5);
      c.hits(function (hx, hy, k) { c.burst(hx, hy - 0.3, [P.storm, P.grey], 2, { up: -6, grav: 60, spd: 6, life: 0.4 }); if (k < 4) c.ring(hx, hy, 9, P.storm, { inv: true, dur: 0.3, d: 0.1 }); }, 6);
      c.light(x, y, 28, P.teal, 0.5, 0.35).shake(0.18).flash(P.teal, 0.04).wash(P.deep, 0.05, 0.7);
      return;
    }
    c.pose('rise', 0.3, 3).sfx('fly_flap'); wings(c, x, y, 19, { c: P.teal, c2: P.white, mem: 1, n: 5, dur: 0.4 });
    c.fx('fly_gust', { x: x, y: y, rad: 1, n: 14, r0: 10, r: 46, len: 9, c: P.grey, c2: P.white, dur: 0.4 });
    c.fx('shock', { x: x, y: y, r: 40, c: P.grey, c2: P.white, w: 2, dust: P.dust, dur: 0.45 }); c.fx('stain', { x: x, y: y, r: 26, c: P.dust, a: 0.18, dur: 2 });
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: P.white, r: 8 }); c.spray(hx, hy, AIR.concat([P.dust]), 3, Math.atan2(hy - y, hx - x), 0.6, { spd: 46, life: 0.3 }); }, 6);
    feathers(c, x, y - 0.5, 6, 20, 1.0, P.teal);
    c.light(x, y, 28, P.sky, 0.55, 0.35).shake(0.22).stop(0.05).boom('fly_gale').sfx('boom');
  } });
// T3 ── 용황의 숨결: 고개를 젖혔다가 — 불줄기가 길 끝까지 뻗어 0.6초 이어진다 (칸마다 차례로 불이 붙는다). 그을음이 남는다
X.reg('xfly_breath', {
  cast: function (c) { var h = head(c); c.pose('back', 0.42, 3).ring(h[0], h[1], 12, P.fire, { inv: true, dur: 0.22 }).light(h[0], h[1], 14, P.fire, 0.45, 0.3).sfx('fly_roar'); },
  beat: function (c, i, last) {
    var h = head(c), T = c.tiles, n = T.length, B = c.S.beats, k, t, e = n ? T[n - 1] : [c.cx, c.cy];
    if (i === 0) { c.fx('fly_breath', { x: h[0], y: h[1], a: c.ang, len: Math.max(16, (Math.abs(e[0] - h[0]) + Math.abs(e[1] - c.uy)) * 16 + 6), w: 8, adv: 0.14, dur: B[2] - B[0] + 0.16 }); c.pose('shake', 0.5, 1).sfx('fireRoar'); }
    for (k = i * 2; k < Math.min(n, i * 2 + 2); k++) { t = T[k]; c.shape({ k: 'flame', x: t[0], y: t[1], dur: 0.5, d: (k - i * 2) * 0.06 }); }
    c.hits(function (hx, hy, q) { c.burst(hx, hy, FIRE, 3, { up: 28, grav: -18, spd: 10, life: 0.45 }); if (last && q < 4) brand(c, hx, hy, 0.05); }, 5);
    t = T[Math.min(n - 1, i * 2)] || e; c.light(t[0], t[1], 24, P.fire, 0.5, 0.3);
    if (!last) { c.shake(0.1); return; }
    if (n > 1) c.fx('stain', { x: T[1][0], y: T[1][1], r: 15, c: P.ash, a: 0.4, c2: P.fire, n: 6, dur: 2.6 });
    if (n > 3) c.fx('stain', { x: T[3][0], y: T[3][1], r: 15, c: P.ash, a: 0.4, c2: P.fire, n: 6, dur: 2.6 });
    c.fx('shock', { x: e[0], y: e[1], r: 20, c: P.fire, c2: P.flame, w: 2, dur: 0.4 });
    c.spray(e[0], e[1], FIRE, 10, c.ang, 0.8, { spd: 50, up: 10, life: 0.4 });
    c.shake(0.2).flash(P.fire, 0.05).wash(P.fire, 0.05, 0.6).boom('emberPop');
  } });
// T4 ── 하늘 낙하: 땅을 박차고 화면 위로 사라진다. 겨눈 자리에 날개 그림자가 자라고 — 하늘에서 흰 기둥과 함께 꽂힌다. 땅이 꺼지고 깃이 흩날린다
// T5 ── 천공 낙하: 더 높이, 더 오래. 하늘에 한 점이 반짝이고, 꽂힌 자리에서 충격이 두 겹으로 번져 곁의 적까지 친다
function stoopUp(c, grand) {
  var T = c.S.beats[0], x = c.cx, y = c.cy;
  c.dim(T + 0.35).pose('rise', T + 0.02, grand ? 150 : 110).ghost(0, 0, P.white, 0.4, 0.5).sfx('fly_cry').sfx('fly_flap');
  c.streak(grand ? 12 : 6, -1.5708, P.sky, 0.45, 0.25);
  feathers(c, c.ux, c.uy - 0.5, grand ? 6 : 4, 10, 1.0, P.teal);
  c.burst(c.ux, c.uy + 0.3, DUST, 8, { up: 10, grav: 40, spd: 26, life: 0.4, spread: 10 });      // 박차고 오른 자리
  c.fx('fly_shadow', { x: x, y: y, r: grand ? 17 : 14, grow: 1, a: 0.38, dur: T });
  c.ring(x, y, grand ? 30 : 24, P.sky, { inv: true, w: 2, dur: T * 0.5, d: T * 0.5 });
  if (grand) {
    c.fx('sigil', { x: x, y: y, r: 17, c: P.teal, c2: P.white, sides: 0, runes: 6, dur: T + 0.1, spin: 2 });
    c.fx('star', { x: x - c.dx * 0.5, y: y - 6.5, s: 5, c: P.white, d: T * 0.4, dur: 0.35 }); c.wash(P.deep, 0.07, T + 0.2);
  }
  c.at(T - 0.3, function () { c.sfx(grand ? 'fallWhistle' : 'fly_swoop'); });
  c.at(T - 0.2, function () { c.streak(grand ? 12 : 6, 1.5708, P.white, 0.3, 0.3); });
}
function stoop(c, grand) {
  var t = tp(c), x = t[0], y = t[1];
  c.fx('column', { x: x, y: y, w: grand ? 10 : 7, h: grand ? 112 : 96, c: P.sky, c2: P.white, a: 0.65, dur: 0.3 });
  c.ghost(0, -1.0, P.teal, 0.3, 0.5).ghost(0, -2.1, P.teal, 0.26, 0.35); if (grand) c.ghost(0, -3.2, P.teal, 0.22, 0.25);
  c.shape({ k: 'impact', x: x, y: y, dur: 0.3, c: P.white, r: grand ? 20 : 16 });
  c.fx('shock', { x: x, y: y, r: grand ? 36 : 30, c: P.sky, c2: P.white, w: 3, dust: P.dust, dur: 0.45 }); c.fx('shock', { x: x, y: y, r: grand ? 48 : 42, c: P.white, w: 1, thin: 1, dur: 0.55, d: 0.1 });
  c.fx('crack', { x: x, y: y, r: grand ? 26 : 18, n: grand ? 9 : 7, c: grand ? P.teal : null, dur: 2.6 }); c.fx('stain', { x: x, y: y, r: grand ? 22 : 16, c: P.dirt, a: 0.22, dur: 2.6 });
  c.spray(x, y, ROCK, grand ? 28 : 20, -1.5708, 1.3, { spd: 70, grav: 160, life: 0.55, size: 2 }); c.burst(x, y, AIR, grand ? 18 : 14, { spd: 60, life: 0.35, flat: true });
  feathers(c, x, y - 0.6, grand ? 12 : 8, 18, grand ? 1.6 : 1.2, P.teal);
  c.lunge().light(x, y, grand ? 44 : 36, P.sky, 0.8, 0.45).shake(grand ? 0.45 : 0.32).stop(grand ? 0.09 : 0.07).flash(P.white, grand ? 0.1 : 0.08).wash(P.sky, grand ? 0.1 : 0.06, grand ? 0.9 : 0.6).boom('quakeHit');
  if (!grand) return;
  c.near(Math.round(x), Math.round(y), 1, function (nx, ny) { if (Math.abs(nx - x) + Math.abs(ny - y) < 0.5) return; c.shape({ k: 'impact', x: nx, y: ny, dur: 0.22, c: P.teal, r: 8, d: 0.06 }); c.spray(nx, ny, ROCK, 3, Math.atan2(ny - y, nx - x), 0.8, { spd: 44, life: 0.3 }); }, 5);
  c.fx('shock', { x: x, y: y, r: 62, c: P.teal, w: 1, thin: 1, dur: 0.7, d: 0.2 });
  c.fx('fly_gust', { x: x, y: y, rad: 1, n: 14, r0: 10, r: 52, len: 9, c: P.grey, c2: P.white, dur: 0.5 });
  c.fx('emit', { x: x, y: y - 0.2, sp: 3, rate: 12, n: 1, dur: 1.1, cols: [P.dust, P.grey, P.teal], o: { up: 20, grav: -8, spd: 6, life: 0.8 } });
  c.streak(10, c.ang, P.white, 0.4, 0.22);
}
X.reg('u_stoop', { cast: function (c) { stoopUp(c, false); }, beat: function (c) { stoop(c, false); } });
X.reg('ux_stoop', { cast: function (c) { stoopUp(c, true); }, beat: function (c) { stoop(c, true); } });
// T4 ── 돌개바람: 날개를 접었다 편다 — 겨눈 자리에 돌개바람이 서서 세 번 휘감고, 마지막에 터지며 밀어낸다
// T5 ── 태풍의 눈: 더 크고 높은 태풍. 터진 뒤에도 눈이 3초 남아 휘돌다가, 걷히면서 밀어낸다
function galeUp(c, grand) {
  var x = c.cx, y = c.cy, B = c.S.beats, T = B[B.length - 1];
  c.dim(T + 0.3).pose('sink', 0.3, 3).sfx('fly_flap');
  c.at(0.14, function () {
    c.pose('rise', 0.4, 3).sfx('fly_flap'); wings(c, c.ux, c.uy, grand ? 20 : 16, { dur: 0.45, mem: grand, c: grand ? P.teal : P.white, c2: grand ? P.white : P.grey });
    c.fx('fly_gust', { x: c.ux, y: c.uy - 0.2, a: c.ang, spread: 0.3, n: 8, r0: 8, r: Math.max(20, c.dist * 16), len: 9, c: P.grey, c2: P.white, dur: 0.3 });
  });
  c.fx('fly_twister', { x: x, y: y, h: grand ? 56 : 38, r0: 2, r1: grand ? 20 : 12, c: P.grey, c2: P.white, spin: 10, d: 0.12, dur: T + 0.1 });
  if (grand) { c.wash(P.storm, 0.08, T + 0.4); c.streak(12, 0.1, P.grey, T, 0.24); c.fx('sigil', { x: x, y: y, r: 36, c: P.grey, c2: P.white, sides: 0, runes: 6, spin: 3, dur: T + 0.2 }); }
  c.at(0.22, function () { c.sfx('fly_gale'); });
}
function gale(c, i, last, grand) {
  var x = c.cx, y = c.cy, R = grand ? 30 : 15;
  if (!last) {
    c.fx('arc', { x: x, y: y, r: R - 4 + i * 5, a0: i * 2.1, sw: 6.6, c: P.white, c2: P.grey, w: 1 + i, dur: 0.28 });
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.18, c: P.grey, r: 6 }); c.burst(hx, hy, AIR, 2, { spd: 40, life: 0.25, flat: true }); }, 3);
    c.burst(x, y, [P.dust, P.grey, P.white], 6, { spd: 50, life: 0.3, flat: true, spread: R });
    c.shake(0.1 + i * 0.05).sfx('wind'); return;
  }
  c.fx('fly_gust', { x: x, y: y, rad: 1, n: grand ? 16 : 12, r0: 8, r: grand ? 52 : 36, len: 9, c: P.grey, c2: P.white, dur: 0.4 });
  c.fx('shock', { x: x, y: y, r: grand ? 44 : 30, c: P.grey, c2: P.white, w: 3, dust: P.dust, dur: 0.45 });
  c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: P.white, r: 9 }); brand(c, hx, hy, 0.06); c.spray(hx, hy, AIR, 3, Math.atan2(hy - y, hx - x), 0.6, { spd: 50, life: 0.3 }); }, grand ? 6 : 5);
  feathers(c, x, y - 1, grand ? 10 : 7, grand ? 30 : 18, 1.2);
  c.fx('stain', { x: x, y: y, r: grand ? 30 : 18, c: P.dust, a: 0.2, dur: 2.4 });
  c.streak(grand ? 10 : 6, c.ang, P.white, 0.4, 0.25);
  c.light(x, y, 36, P.sky, 0.6, 0.4).shake(grand ? 0.4 : 0.3).stop(grand ? 0.08 : 0.06).flash(P.white, grand ? 0.09 : 0.07).wash(P.sky, 0.06, 0.6).boom('fly_gale').sfx('boom');
}
X.reg('u_gale', { cast: function (c) { galeUp(c, false); }, beat: function (c, i, last) { gale(c, i, last, false); } });
X.reg('ux_gale', { cast: function (c) { galeUp(c, true); }, beat: function (c, i, last) { gale(c, i, last, true); },
  zone: function (c, e) { c.fx('fly_twister', { x: c.cx, y: c.cy, h: 30, r0: 2, r1: 10, c: P.grey, c2: P.white, spin: 8, dur: e.dur }); },
  zoneTick: function (c) {
    c.fx('arc', { x: c.cx, y: c.cy, r: 28, a0: c.i * 1.7, sw: 6.6, c: P.white, c2: P.grey, w: 1, dur: 0.4 });
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.18, c: P.grey, r: 6 }); c.burst(hx, hy, AIR, 2, { spd: 40, life: 0.25, flat: true }); }, 6);
    c.sfx('wind');
  },
  zoneEnd: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('fly_gust', { x: x, y: y, rad: 1, n: 14, r0: 8, r: 50, len: 9, c: P.grey, c2: P.white, dur: 0.4 }); c.fx('shock', { x: x, y: y, r: 42, c: P.grey, c2: P.white, w: 2, dust: P.dust, dur: 0.45 });
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.2, c: P.white, r: 7 }); c.spray(hx, hy, AIR, 3, Math.atan2(hy - y, hx - x), 0.6, { spd: 46, life: 0.3 }); }, 6);
    feathers(c, x, y - 0.8, 6, 24, 1.0); c.shake(0.18).boom('fly_gale');
  } });
// T4 ── 날개 그늘: 머리 위로 큰 날개가 펼쳐지고, 땅에 날개 그늘이 드리운다. 깃이 내려앉는 아군마다 보호막
// T5 ── 용익의 그늘: 막이 있는 용의 날개가 온 싸움터를 덮는다. 빛기둥과 두 겹의 고리, 모든 아군에게
function canopyUp(c, grand) {
  var x = c.ux, y = c.uy;
  c.dim(grand ? 1.3 : 1.0).pose('rise', grand ? 1.0 : 0.8, 5).sfx('fly_flap').ghost(0, 0, grand ? P.teal : P.white, 0.5, 0.4);
  c.fx('fly_shadow', { x: x, y: y, r: grand ? 64 : 42, grow: 1, a: 0.22, dur: grand ? 1.8 : 1.4 });
  wings(c, x, y - 0.9, grand ? 46 : 32, { n: 8, mem: grand, c: grand ? P.teal : P.white, c2: grand ? P.gold : P.grey, dur: grand ? 1.2 : 0.95 });
  c.fx('sigil', { x: x, y: y, r: 34, c: grand ? P.teal : P.sky, c2: P.white, sides: 0, runes: 6, dur: 1.2, spin: 0.8 });
  if (grand) { c.wash(P.deep, 0.08, 1.4); c.streak(12, 0.05, P.sky, 1.0, 0.22); }
}
function canopy(c, grand) {
  var x = c.ux, y = c.uy;
  c.sfx('fly_flap');
  c.fx('fly_feather', { x: x, y: y - 2, n: grand ? 14 : 10, sp: grand ? 60 : 38, up: 4, fall: 34, c: P.white, c2: grand ? P.teal : P.grey, dur: grand ? 1.9 : 1.5 });
  c.hits(function (ax, ay) {
    c.fx('dome', { x: ax, y: ay, r: 9, c: grand ? P.teal : P.sky, dur: 0.7 }); c.ring(ax, ay, 9, P.teal, { rise: true, dur: 0.5 });
    c.burst(ax, ay - 0.3, TEAL, 3, { up: 24, grav: -16, spd: 5, life: 0.6 });
  }, grand ? 8 : 6);
  c.fx('shock', { x: x, y: y, r: grand ? 52 : 38, c: P.sky, c2: P.white, w: 2, dur: 0.5 });
  c.light(x, y, 40, P.sky, 0.7, 0.8).shake(grand ? 0.2 : 0.12).flash(P.sky, grand ? 0.08 : 0.05).wash(grand ? P.teal : P.sky, grand ? 0.08 : 0.05, 1.0).boom('guard');
  if (!grand) return;
  c.fx('column', { x: x, y: y, w: 7, h: 100, c: P.teal, c2: P.white, a: 0.5, dur: 0.5 }); c.fx('shock', { x: x, y: y, r: 66, c: P.gold, w: 1, thin: 1, dur: 0.7, d: 0.12 });
  c.fx('emit', { x: x, y: y - 0.4, sp: 4, rate: 12, n: 1, dur: 1.2, cols: TEAL, o: { up: 26, grav: -14, spd: 5, life: 0.9 } });
}
X.reg('u_canopy', { cast: function (c) { canopyUp(c, false); }, beat: function (c) { canopy(c, false); } });
X.reg('ux_canopy', { cast: function (c) { canopyUp(c, true); }, beat: function (c) { canopy(c, true); } });
})();
