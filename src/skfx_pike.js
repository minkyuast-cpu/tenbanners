// 전민 — 기술 연출: 창병 (긴 창끝 · 창의 줄과 숲 · 발 묶기 · 빗장과 문). 틀과 쓰는 법은 src/skfx.js · docs/SKILL_FX.md.
//   이 파일이 맡는 기술: cmd_pike · pike_pin · pike_skewer (T1) · pike_brace (T2) · xpike_skewer · xpike_forest · xpike_lance (T3) · u_crossbar · u_feast · u_gatekeep (T4) · ux_* 셋 (T5)
//   빛깔: 풀빛 도는 강철(#bff0d8 · #e8fff4) · 청록(#4c9a8a · #2c6a60) · 나무 자루 · 쇠. 연회에만 포도주빛과 촛불
//   무늬: 가로 날이 달린 창(내지른다 · 땅에서 솟는다 · 하늘에서 꽂힌다) · 빗장과 꺾쇠 · 닫히는 문 · 꺼지는 촛불 · 내리닫이 쇠문
//   고친 표 (옛 → 새 · tools/skdmg.js 새 ÷ 옛: 허수아비 / 싸움판):
//     cmd_pike      설명의 긴 줄표만 걷음        pike_brace 그대로
//     pike_pin      160% 바로 → 같은 값, 0.12초 당겼다가                                        1.00 / 1.01
//     pike_skewer   180% 바로 → 같은 값, 0.14초 당겼다가                                        1.00 / 1.00
//     xpike_skewer  230% 한 번 → 꿰뚫고 105%, 비틀어 뽑으며 135%와 둔화                         1.00 / 0.98
//     xpike_forest  190% → 솟을 때 140%, 숲이 4.5초 서서 1.5초마다 30%                           0.99 / 0.99 (싸움판은 되찌르기를 빼고 잰 값)
//     xpike_lance   220% 바로 → 0.7초 뒤(비켜설 수 있다) 세 번 75% + 75% + 110%                  1.05 / 1.02
//     u_crossbar    250% 한 번 → 꿰뚫고 150%, 빗장을 잠그며 115%(둔화 · 게이지)                  1.01 / 1.00
//     u_feast       160% 한 번 → 문이 닫히며 65%와 둔화, 어둠 속의 창 115%와 공격 −30%           1.02 / 1.03
//     u_gatekeep    그대로, 쇠문이 내려앉을 때(0.35초) 걸린다
//     ux_crossbar   320% · 게이지 −50 → 190% + 140%(게이지 −20), 빗장이 3초 걸려 1초마다 게이지 −10 (1.3초 뒤부터 빗장 그림은 옅게)   0.99 / 0.99
//     ux_feast      210% 한 번 → 60% + 85% + 95%                                                1.00 / 1.01
//     ux_gatekeep   되찌르기 90% → 75%, 대신 철문이 6초 서서 둘레 2칸의 적을 3초마다 15%와 게이지 −15 (두 번). 일부러 바꾼 것: 싸움판에서 새로 생긴 피해는 「잔치의 끝장」 한 번의 4분의 1쯤 (733 ÷ 2420)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var X = DS.skfx; if (!X) return;
var P = X.PAL.pike = { steel: '#bff0d8', pale: '#e8fff4', white: '#ffffff', teal: '#4c9a8a', deep: '#2c6a60', leaf: '#b6f0a0', wood: '#b08a5a', bark: '#7a5a36', iron: '#8f9ab3', dark: '#1b2a26',
  dust: '#d8c39a', earth: '#a8754a', dirt: '#6f4a2c', wine: '#a8324a', lees: '#5a1a2a', candle: '#ffd98a', flame: '#ff9a3c', smoke: '#9aa0a8' };
var STEEL = [P.pale, P.steel, P.teal], DUST = [P.dust, P.earth, P.dirt], WOOD = [P.wood, P.bark, P.dust], WINE = [P.wine, P.lees, P.pale];

// ───────── 기술 표 ─────────
X.def('cmd_pike', { desc: '호령. 모든 아군의 방어 +15%, 공격 +5% (25초).' });
// 발 묶기 · 꿰뚫기: 창을 당겼다 내지르는 짧은 뜸. 수치는 그대로
X.def('pike_pin', { beats: [0.12] });
X.def('pike_skewer', { beats: [0.14] });
// 관통창: 한 번(230%) → 꿰뚫고(105%) 비틀어 뽑는다(135%). 둔화는 뽑을 때 (옛것처럼 제 둔화에는 맞물리지 않는다)
X.def('xpike_skewer', { beats: [0.18, 0.5],
  eff: [{ t: 'dmg', m: 1.05, vs: 'slow', vx: 1.4 }, { t: 'dmg', m: 1.35, vs: 'slow', vx: 1.4, b: 1 }, { t: 'status', s: 'slow', dur: 8, b: 1 }],
  desc: '직선 4칸을 꿰뚫고(105%) 비틀어 뽑는다(135%). 둔화된 적에게 1.4배. 뽑힌 적은 둔화.' });
// 창의 숲: 한 번(190%) → 솟을 때 140%, 숲이 4.5초 서서 1.5초마다 30%
X.def('xpike_forest', { beats: [0.3],
  eff: [{ t: 'dmg', m: 1.4 }, { t: 'status', s: 'slow', dur: 10 }, { t: 'buff', s: 'ctr', p: 80, dur: 12, to: 'self' }],
  zone: { dur: 4.5, every: 1.5, k: 'wind', eff: [{ t: 'dmg', m: 0.3 }] },
  desc: '둘레 2칸에 창의 숲이 솟는다. 적에게 140%와 둔화, 12초 동안 붙어 때린 적을 80%로 되찌른다. 숲은 4.5초 서 있고, 그 안의 적은 1.5초마다 30%.' });
// 천 갈래 창: 바로(220%) → 하늘로 던진 창이 0.7초 뒤 세 번 쏟아진다 75% + 75% + 110% (비켜서는 몫 · 여러 번 맞는 몫만큼 올렸다)
X.def('xpike_lance', { fall: { delay: 0.7 }, beats: [0, 0.2, 0.42],
  eff: [{ t: 'dmg', m: 0.75, vs: 'slow', vx: 1.3 }, { t: 'dmg', m: 0.75, vs: 'slow', vx: 1.3, b: 1 }, { t: 'dmg', m: 1.1, vs: 'slow', vx: 1.3, b: 2 }, { t: 'gauge', v: -30, b: 2 }, { t: 'status', s: 'slow', dur: 8, b: 2 }],
  desc: '겨눈 2칸 반경에 0.7초 뒤 창이 세 번 쏟아진다. 75%, 75%, 110%. 둔화된 적에게 1.3배. 마지막에 게이지를 깎고 둔화. 떨어지기 전에 비켜설 수 있다.' });
// 빗장 꿰기: 한 번(250%) → 큰 창으로 꿰고(150%) 꺾쇠가 내려와 잠근다(115% · 둔화 · 게이지)
X.def('u_crossbar', { beats: [0.4, 0.8],
  eff: [{ t: 'dmg', m: 1.5, vs: 'slow', vx: 1.3 }, { t: 'dmg', m: 1.15, vs: 'slow', vx: 1.3, b: 1 }, { t: 'status', s: 'slow', dur: 8, b: 1 }, { t: 'gauge', v: -30, b: 1 }],
  desc: '직선 4칸을 큰 창으로 꿰뚫고(150%) 빗장을 걸어 잠근다(115%). 둔화된 적에게 1.3배. 둔화, 게이지를 깎는다.' });
// 빗장 관통: 한 번(320% · 게이지 −50) → 190% + 140%(게이지 −20), 빗장이 3초 걸려 그 줄의 적은 1초마다 게이지 −10
X.def('ux_crossbar', { beats: [0.45, 0.85],
  eff: [{ t: 'dmg', m: 1.9, vs: 'slow', vx: 1.4 }, { t: 'dmg', m: 1.4, vs: 'slow', vx: 1.4, b: 1 }, { t: 'status', s: 'slow', dur: 10, b: 1 }, { t: 'gauge', v: -20, b: 1 }],
  zone: { dur: 3, every: 1, k: 'wall', eff: [{ t: 'gauge', v: -10 }] },
  desc: '직선 6칸을 큰 창으로 꿰뚫고(190%) 빗장을 걸어 잠근다(140%). 둔화된 적에게 1.4배. 둔화, 게이지를 깎는다. 빗장은 3초 걸려 있고, 그 줄의 적은 1초마다 게이지 −10.' });
// 연회의 끝: 한 번(160%) → 문이 닫히며 65%와 둔화, 어둠 속의 창 115%와 공격 −30%. 잔치의 끝장: 한 번(210%) → 60% + 85% + 95%
X.def('u_feast', { beats: [0.4, 0.8],
  eff: [{ t: 'dmg', m: 0.65 }, { t: 'status', s: 'slow', dur: 8 }, { t: 'dmg', m: 1.15, b: 1 }, { t: 'buff', s: 'atk', p: -30, dur: 12, b: 1 }],
  desc: '문이 닫히고 촛불이 꺼진다. 둘레 2칸 적에게 65%와 둔화. 곧이어 어둠 속에서 창이 찌른다. 115%, 공격 −30% (12초).' });
X.def('ux_feast', { beats: [0.4, 0.75, 1.1],
  eff: [{ t: 'dmg', m: 0.6 }, { t: 'status', s: 'slow', dur: 10 }, { t: 'dmg', m: 0.85, b: 1 }, { t: 'dmg', m: 0.95, b: 2 }, { t: 'buff', s: 'atk', p: -40, dur: 14, b: 2 }],
  desc: '문이 닫히고 촛불이 꺼진다. 둘레 2칸 적에게 60%와 둔화. 어둠 속에서 창이 두 번 찌른다. 85%, 95%와 공격 −40% (14초).' });
// 문지기: 쇠문이 내려앉을 때(0.35초) 걸린다. 수치는 그대로
X.def('u_gatekeep', { beats: [0.35] });
// 철문 수문장: 되찌르기 90% → 75%, 대신 철문이 6초 서서 둘레 2칸의 적을 3초마다 찌른다 (두 번, 15%와 게이지 −15)
X.def('ux_gatekeep', { beats: [0.4],
  eff: [{ t: 'buff', s: 'def', p: 55, dur: 18 }, { t: 'buff', s: 'atk', p: 30, dur: 18 }, { t: 'buff', s: 'ctr', p: 75, dur: 18 }],
  zone: { dur: 6, every: 3, k: 'ward', to: 'foe', eff: [{ t: 'dmg', m: 0.15 }, { t: 'gauge', v: -15 }] },
  desc: '둘레 2칸 아군의 방어 +55%, 공격 +30%, 붙어 때린 적을 75%로 되찌른다 (18초). 철문은 6초 서 있고, 그동안 둘레 2칸의 적을 3초마다 찌른다. 15%, 게이지 −15.' });

// ───────── 소리 ─────────
X.sound('pike_thrust', function (tone, noise) { noise(0.06, 0.18, 3000, 1.4); tone(900, 260, 0.08, 'sawtooth', 0.045); noise(0.07, 0.14, 600, 0.9, 0.035); }, 4.11);      // 창끝이 꿴다
X.sound('pike_plant', function (tone, noise) { noise(0.1, 0.22, 320, 0.8, 0, 'lowpass'); tone(210, 120, 0.1, 'triangle', 0.08); noise(0.03, 0.1, 2200, 1.3, 0.02); }, 2.45);      // 자루가 땅에 박힌다
X.sound('pike_volley', function (tone, noise) { [0, 0.07, 0.14].forEach(function (d, i) { noise(0.1, 0.1, 2600 - i * 500, 1.3, d); }); tone(700, 300, 0.24, 'sine', 0.025); }, 3.1);      // 창이 쏟아진다
X.sound('pike_slam', function (tone, noise) { noise(0.26, 0.3, 190, 0.6, 0, 'lowpass'); tone(96, 42, 0.26, 'square', 0.1); tone(640, 600, 0.07, 'triangle', 0.035, 0.015); noise(0.04, 0.1, 1900, 1.2, 0.02); }, 1.27);      // 문 · 빗장이 닫힌다

// ───────── 그림 조각 ─────────
// 창 한 자루: 자루 끝(bx, by) → 창끝(tx, ty). 가로 날 한 쌍 (기병의 깃발 창과 다르다)
function spear(g, bx, by, tx, ty, w, ch, cs) {
  var L = DS.VX.pxLine, dx = tx - bx, dy = ty - by, n = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / n, uy = dy / n, hl = Math.min(6, n * 0.4), hx = tx - ux * hl, hy = ty - uy * hl;
  g.fillStyle = cs; L(g, bx, by, hx, hy, w);
  g.fillStyle = ch; L(g, hx, hy, tx, ty, w + 1);
  g.fillRect(Math.round(hx - uy * 2), Math.round(hy + ux * 2), w, w); g.fillRect(Math.round(hx + uy * 2), Math.round(hy - ux * 2), w, w);
  g.fillStyle = '#ffffff'; g.fillRect(Math.round(tx), Math.round(ty), w, w);
}
// m: (없음) 내지른다 — (x, y) 창끝이 닿는 칸 · a 방향 · len 길이 · go 달리는 픽셀 · gt 그 몫 · rev 끝에서 되뽑는다
//    'plant' 땅에서 솟아 선다 — lean 위가 기우는 픽셀 · up 솟는 몫     'fall' 하늘에서 꽂혀 박힌다 — h 높이 · sx 옆에서 · ft 떨어지는 몫     'up' 하늘로 던져 올린다
X.kind('pike_spear', { L: 1, draw: function (g, p, f, time, V, cx0, cy0) {
  var len0 = p.len || 16, w = p.w || 1, n = p.n || 1, sp = p.sp || 10, j, cx, cy, len, q, tx, ty, bx, by, al, k, off, ca, sa, ff;
  for (j = 0; j < n; j++) {      // n 자루를 한 조각으로 (숲 · 쏟아지는 창): 자리 · 길이 · 때를 조금씩 흩는다
    cx = cx0; cy = cy0; len = len0; ff = f; al = 1;
    if (j) { cx += (X.hs(j, p.sd) - 0.5) * sp; cy += (X.hs(j + 7, p.sd) - 0.5) * sp * 0.6; len = len0 * (0.8 + X.hs(j + 3, p.sd) * 0.35); ff = Math.max(0, f - X.hs(j + 5, p.sd) * (p.lag || 0.04)); }
    if (p.m === 'plant') {
      q = X.ease(Math.min(1, ff / (p.up || 0.1))); al = f > 0.85 ? (1 - f) / 0.15 : 1; bx = cx; by = cy + 6; tx = cx + (p.lean || 0) * q; ty = by - len * q;
    } else if (p.m === 'fall') {
      q = Math.min(1, ff / (p.ft || 0.4)); q *= q; al = f > 0.8 ? (1 - f) / 0.2 : Math.min(1, ff * 8); k = Math.sqrt((p.sx || 0) * (p.sx || 0) + (p.h || 80) * (p.h || 80)) || 1;
      tx = cx + (p.sx || 0) * (1 - q); ty = cy + 5 - (p.h || 80) * (1 - q); bx = tx + (p.sx || 0) / k * len; by = ty - (p.h || 80) / k * len;
    } else if (p.m === 'up') {
      q = f * f; al = 1 - f * 0.5; k = Math.sqrt((p.sx || 0) * (p.sx || 0) + (p.h || 80) * (p.h || 80)) || 1;
      tx = cx + (p.sx || 0) * q; ty = cy - 8 - (p.h || 80) * q; bx = tx - (p.sx || 0) / k * len; by = ty + (p.h || 80) / k * len;
    } else {
      ca = Math.cos(p.a || 0); sa = Math.sin(p.a || 0); q = X.ease(Math.min(1, f / (p.gt || 0.3))); off = p.rev ? -(p.go || 0) * q : (p.go || 0) * (q - 1); al = f > 0.75 ? (1 - f) / 0.25 : 1;
      tx = cx + ca * off; ty = cy - 3 + sa * off; bx = tx - ca * len; by = ty - sa * len;
    }
    if (al <= 0) continue;
    g.globalAlpha = al; spear(g, bx, by, tx, ty, w, p.c || P.steel, p.c2 || P.wood);
    if (p.m === 'plant' && q >= 1 && Math.sin(time * 9 + cx) > 0.7) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 2, 2); }
  }
} });
// 빗장: (x, y) → (x1, y1) 로 밀려 들어가 걸린다 (곧은 가로 · 세로). w 굵기 · in 들어가는 몫 · lk 그때 하얗게 번쩍 (잠긴다)
function barSeg(g, hz, s, x, y, a, b, o, t) { if (hz) g.fillRect(s > 0 ? x + a : x - b, y + o, b - a, t); else g.fillRect(x - 1 + o, s > 0 ? y + a : y - b, t, b - a); }
X.kind('pike_bar', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var q = X.ease(Math.min(1, f / (p.in || 0.1))), w = p.w || 3, dx = (p.x1 - p.x) * 16 * q, dy = (p.y1 - p.y) * 16 * q, hz = Math.abs(dx) >= Math.abs(dy), n = Math.round(Math.abs(hz ? dx : dy)), s = (hz ? dx : dy) >= 0 ? 1 : -1, x = Math.round(cx), y = Math.round(cy - 3), i;
  var wh = p.lk && f >= p.lk && f < p.lk + (p.lf || 0.04);
  g.globalAlpha = (f > 0.9 ? (1 - f) / 0.1 : 1) * (p.fade && f > p.fade ? 0.5 : 1);      // fade: 그 몫부터 옅게 (오래 걸린 빗장이 사람들을 가리지 않게)
  g.fillStyle = P.dark; barSeg(g, hz, s, x, y, 0, n, -1, w + 2);
  g.fillStyle = wh ? '#ffffff' : (p.c || P.wood); barSeg(g, hz, s, x, y, 0, n, 0, w);
  g.fillStyle = wh ? '#ffffff' : P.bark; barSeg(g, hz, s, x, y, 0, n, w - 1, 1);
  g.fillStyle = wh ? '#ffffff' : (p.c2 || P.iron); for (i = 5; i < n - 4; i += 10) barSeg(g, hz, s, x, y, i, i + 2, 0, w);
  for (i = 0; i < 6; i++) { g.fillStyle = i < 2 ? P.iron : P.pale; barSeg(g, hz, s, x, y, n + i, n + i + 1, Math.round(i / 2) - 1, Math.max(1, w + 2 - i)); }      // 창끝
} });
// 꺾쇠: 빗장 위로 내려와 물린다. fall 처음 높이 · in 내려오는 몫
X.kind('pike_clamp', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var q = Math.min(1, f / (p.in || 0.15)), x = Math.round(cx), y = Math.round(cy - 3 - (1 - q * q) * (p.fall || 18)), wh = q >= 1 && f < (p.in || 0.15) + 0.06;
  g.globalAlpha = (f > 0.9 ? (1 - f) / 0.1 : Math.min(1, f * 10)) * (p.fade && f > p.fade ? 0.5 : 1);
  g.fillStyle = P.dark; g.fillRect(x - 6, y - 5, 12, 4); g.fillRect(x - 6, y - 2, 4, 11); g.fillRect(x + 2, y - 2, 4, 11);
  g.fillStyle = wh ? '#ffffff' : (p.c || P.iron); g.fillRect(x - 5, y - 4, 10, 2); g.fillRect(x - 5, y - 2, 2, 10); g.fillRect(x + 3, y - 2, 2, 10);
  g.fillStyle = wh ? '#ffffff' : P.pale; g.fillRect(x - 5, y - 4, 10, 1); g.fillRect(x - 5, y - 3, 1, 10);
} });
// 닫히는 문 (땅의 겹 — 사람들 뒤에 선다): 두 짝이 좌우에서 닫히고(sh 그 몫에 쿵) 빗장이 걸린다
X.kind('pike_door', { L: 0, draw: function (g, p, f, time, V, cx, cy) {
  var sh = p.sh || 0.3, q = Math.min(1, f / sh), off = Math.round((1 - q * q) * 9), x = Math.round(cx), y = Math.round(cy), H = p.h || 17, W = p.w || 11, wh = q >= 1 && f < sh + 0.05, i, k, lx;
  g.globalAlpha = f > 0.85 ? (1 - f) / 0.15 : Math.min(1, f * 8);
  g.fillStyle = P.dark; g.fillRect(x - W - 11, y - H, 2, H + 1); g.fillRect(x + W + 9, y - H, 2, H + 1); g.fillRect(x - W - 11, y - H - 2, W * 2 + 22, 2);      // 문틀
  for (k = 0; k < 2; k++) {
    lx = k ? x + off : x - W - off;
    g.fillStyle = P.dark; g.fillRect(lx - 1, y - H, W + 2, H + 1);
    g.fillStyle = wh ? '#ffffff' : P.bark; g.fillRect(lx, y - H + 1, W, H - 1);
    g.fillStyle = wh ? '#ffffff' : P.wood; for (i = 0; i < W; i += 3) g.fillRect(lx + i, y - H + 1, 2, H - 1);
    g.fillStyle = wh ? '#ffffff' : P.iron; g.fillRect(lx, y - H + 3, W, 1); g.fillRect(lx, y - 4, W, 1);
  }
  if (q >= 1) { g.fillStyle = P.dark; g.fillRect(x - W + 1, y - Math.round(H / 2) - 2, W * 2 - 2, 4); g.fillStyle = wh ? '#ffffff' : P.iron; g.fillRect(x - W + 2, y - Math.round(H / 2) - 1, W * 2 - 4, 2); }      // 빗장
} });
// 촛불: out 몫에 꺼지고 연기가 오른다
X.kind('pike_candle', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var x = Math.round(cx), y = Math.round(cy + 3), out = p.out || 0.6, h, q;
  g.globalAlpha = Math.min(1, f * 10) * (f > 0.9 ? (1 - f) / 0.1 : 1);
  g.fillStyle = P.dark; g.fillRect(x - 2, y - 4, 4, 6); g.fillStyle = P.pale; g.fillRect(x - 1, y - 4, 2, 5);
  if (f < out) { h = 3 + (Math.sin(time * 22 + (p.sd || 0)) > 0 ? 1 : 0); g.fillStyle = P.flame; g.fillRect(x - 1, y - 4 - h, 2, h); g.fillStyle = P.candle; g.fillRect(x - 1, y - 6, 2, 2); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 5, 1, 1); }
  else { q = (f - out) / (1 - out); g.globalAlpha = (1 - q) * 0.8; g.fillStyle = P.smoke; g.fillRect(x - 1 + Math.round(Math.sin(q * 6 + (p.sd || 0)) * 2), y - 6 - Math.round(q * 12), 2, 2); g.fillRect(x + Math.round(Math.sin(q * 5 + 2) * 2), y - 5 - Math.round(q * 7), 1, 1); }
} });
// 내리닫이 쇠문 (땅의 겹 — 지키는 이의 등 뒤에 선다): 위에서 떨어져 쿵 하고 선다. w · h 크기 · fall 처음 높이 · in 내려오는 몫
X.kind('pike_gate', { L: 0, draw: function (g, p, f, time, V, cx, cy) {
  var W = p.w || 30, H = p.h || 26, q = Math.min(1, f / (p.in || 0.12)), x = Math.round(cx - W / 2), y = Math.round(cy + 6 - H - (1 - q * q) * (p.fall || 30)), i, wh = q >= 1 && f < (p.in || 0.12) + 0.05;
  g.globalAlpha = (f > 0.8 ? (1 - f) / 0.2 : 1) * 0.92;
  for (i = 0; i <= W; i += 5) { g.fillStyle = P.dark; g.fillRect(x + i - 1, y, 3, H + 2); g.fillStyle = wh ? '#ffffff' : (p.c || P.iron); g.fillRect(x + i, y, 1, H); g.fillRect(x + i, y + H, 1, 2); g.fillStyle = wh ? '#ffffff' : P.pale; g.fillRect(x + i, y, 1, 3); }
  for (i = 0; i < 3; i++) { g.fillStyle = P.dark; g.fillRect(x - 1, y + 3 + i * 9 - 1, W + 3, 3); g.fillStyle = wh ? '#ffffff' : (p.c || P.iron); g.fillRect(x, y + 3 + i * 9, W + 1, 1); }
  g.fillStyle = P.dark; g.fillRect(x - 2, y - 3, W + 5, 4); g.fillStyle = wh ? '#ffffff' : (p.c2 || P.teal); g.fillRect(x - 1, y - 2, W + 3, 2);
} });
// 엇건 창 둘 (지키는 자리의 표시)
X.kind('pike_cross', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var r = (p.s || 5) * (0.6 + 0.4 * Math.min(1, f * 6)), x = Math.round(cx), y = Math.round(cy);
  g.globalAlpha = X.env(f, 0.1, 0.35);
  spear(g, x - r, y + r, x + r, y - r, 1, p.c || P.steel, p.c2 || P.wood); spear(g, x + r, y + r, x - r, y - r, 1, p.c || P.steel, p.c2 || P.wood);
} });

// ───────── 연출 ─────────
function lane(c) { var T = c.tiles, i, d, bd = -1, e = null; for (i = 0; i < T.length; i++) { d = Math.abs(T[i][0] - c.ux) + Math.abs(T[i][1] - c.uy); if (d > bd) { bd = d; e = T[i]; } } return e ? { x: e[0], y: e[1], n: Math.max(1, Math.round(bd)) } : { x: c.ux + c.dx, y: c.uy + c.dy, n: 1 }; }
function dust(c, x, y, n) { c.burst(x, y + 0.3, DUST, n, { up: 14, grav: 60, spd: 18, life: 0.4, spread: 8 }); }
function plant(c, x, y, o) { o = o || {}; return c.fx('pike_spear', { m: 'plant', x: x, y: y, len: o.len || 15, lean: o.lean || 0, up: o.up, w: o.w, n: o.n, sp: o.sp, lag: o.lag, c: o.c, c2: o.c2, d: o.d || 0, dur: o.dur || 0.7 }); }
function thrust(c, x, y, a, o) { o = o || {}; return c.fx('pike_spear', { x: x, y: y, a: a, len: o.len || 16, go: o.go == null ? 12 : o.go, gt: o.gt || 0.3, rev: o.rev, w: o.w, c: o.c, c2: o.c2, d: o.d || 0, dur: o.dur || 0.3 }); }
function sparks(c, x, y, n, sp) { c.burst(x, y, STEEL, n, { spd: sp || 34, life: 0.22 }); }
// 맞은 이마다 창끝 불티 (창이 지나가는 차례로)
function pierce(c, max, r, n) { var x0 = c.ux, y0 = c.uy; c.hits(function (hx, hy) { var d = Math.abs(hx - x0) + Math.abs(hy - y0); c.at(Math.min(0.12, d * 0.025), function () { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: P.white, r: r || 7 }); sparks(c, hx, hy, n || 2); }); }, max || 4); }

// T1 ── 창벽 세워! (호령): 자루로 땅을 찍으면, 아군 곁에 창이 한 자루씩 솟는다
X.reg('cmd_pike', { cast: function (c) {
  c.pose('sink', 0.3, 2).sfx('pike_plant').ring(c.ux, c.uy, 12, P.steel, { dur: 0.3 });
  c.each(function (x, y, i, d) { plant(c, x + 0.38, y, { len: 14, lean: 1, d: 0.05 + Math.min(0.2, d * 0.04), dur: 0.6 }); c.burst(x + 0.38, y - 0.5, [P.steel, P.leaf], 1, { up: 22, grav: -16, spd: 5, life: 0.5 }); }, 6);
} });
// T1 ── 발 묶기: 낮게 내지른 창이 발치에 박혀 남는다. 발목에 조이는 고리
X.reg('pike_pin', {
  cast: function (c) { c.pose('back', 0.28, 2); },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    thrust(c, x, y + 0.25, c.ang, { len: 13, go: 10, dur: 0.2 });
    plant(c, x + 0.15, y + 0.05, { len: 11, lean: -c.dx * 5 - 1, up: 0.05, d: 0.12, dur: 0.6 });
    c.shape({ k: 'impact', x: x, y: y + 0.2, dur: 0.2, c: P.white, r: 6 }).ring(x, y + 0.2, 9, P.teal, { inv: true, w: 2, dur: 0.35, d: 0.08 });
    sparks(c, x, y + 0.3, 6); c.lunge().light(x, y, 14, P.steel, 0.35, 0.2).boom('pike_thrust');
  } });
// T1 ── 꿰뚫기: 긴 창 한 자루가 세 칸을 한 번에 지난다
X.reg('pike_skewer', {
  cast: function (c) { c.pose('back', 0.3, 3); },
  beat: function (c) {
    var e = lane(c);
    thrust(c, e.x + c.dx * 0.45, e.y + c.dy * 0.45, c.ang, { len: e.n * 16 + 4, go: e.n * 16 - 4, gt: 0.35, dur: 0.32 });
    c.line(c.ux, c.uy - 0.1, e.x + c.dx * 0.4, e.y + c.dy * 0.4 - 0.1, P.pale, { dur: 0.16 });
    pierce(c, 3, 7, 3); c.lunge().light(c.ux + c.dx * 1.5, c.uy + c.dy * 1.5, 16, P.steel, 0.35, 0.2).boom('pike_thrust');
  } });
// T2 ── 창벽: 나와 곁의 아군 앞에 창이 비스듬히 박힌다. 발밑이 울리고, 되찌를 채비의 고리가 오른다
X.reg('pike_brace', { cast: function (c) {
  var f = c.u.face < 0 ? -1 : 1, n = 0;
  c.pose('sink', 0.4, 3).boom('pike_plant');
  c.who(true, function (x, y, i, w) { var me = w === c.u, k; for (k = 0; k < (me ? 3 : 2); k++) plant(c, x + f * (0.3 + k * 0.3), y + 0.05 + (k % 2) * 0.12, { len: 16 - k, lean: f * 6, d: n * 0.05 + k * 0.04, dur: 1.1 }); n++; dust(c, x + f * 0.5, y, 2); }, 4);
  c.at(0.1, function () { c.fx('shock', { x: c.ux, y: c.uy, r: 20, c: P.steel, dust: P.dust, dur: 0.35 }); c.fx('crack', { x: c.ux + f * 0.4, y: c.uy, r: 9, n: 4, dur: 1.6 }); c.shake(0.1); });
  c.ring(c.ux, c.uy, 13, P.teal, { rise: true, w: 2, dur: 0.5, d: 0.2 }).light(c.ux, c.uy, 20, P.steel, 0.45, 0.5);
} });
// T3 ── 관통창: 굵은 창이 네 칸을 꿰고 멈춘다 → 비틀어 뽑는다 (불티가 내 쪽으로 튄다)
X.reg('xpike_skewer', {
  cast: function (c) { c.pose('back', 0.38, 4).ghost(-c.dx * 0.3, -c.dy * 0.3, P.teal, 0.3, 0.45).sfx('swoosh'); },
  beat: function (c, i) {
    var e = lane(c), ex = e.x + c.dx * 0.45, ey = e.y + c.dy * 0.45, mx = (c.ux + e.x) / 2, my = (c.uy + e.y) / 2;
    if (i === 0) {
      thrust(c, ex, ey, c.ang, { len: e.n * 16 + 4, go: e.n * 16 - 4, gt: 0.25, w: 2, dur: 0.44 });      // 뽑을 때까지 꿰인 채 (0.32초 뒤)
      c.line(c.ux, c.uy - 0.1, ex, ey - 0.1, P.pale, { dur: 0.16 });
      pierce(c, 4, 8, 3); c.lunge().light(mx, my, 24, P.steel, 0.45, 0.22).shake(0.1).boom('pike_thrust');
      c.at(0.14, function () { c.pose('back', 0.3, 3); });
      return;
    }
    thrust(c, ex, ey, c.ang, { len: e.n * 16 + 4, go: e.n * 16 - 2, gt: 0.5, rev: 1, w: 2, c: P.white, dur: 0.22 });
    c.fx('beam', { x0: ex, y0: ey, x1: c.ux, y1: c.uy, w: 3, c: P.steel, c2: P.white, dur: 0.26 });
    c.hits(function (hx, hy) { c.shape({ k: 'slash', x: hx, y: hy, a: c.ang + 3.1416, s: 1, c: P.steel, big: 1, dur: 0.22 }); c.spray(hx, hy, STEEL, 5, c.ang + 3.1416, 0.6, { spd: 60, life: 0.3 }); }, 4);
    c.ghost(c.dx * 0.3, c.dy * 0.3, P.steel, 0.26, 0.4);
    c.fx('shock', { x: c.ux + c.dx * 0.5, y: c.uy + c.dy * 0.5, r: 16, c: P.steel, w: 2, dust: P.dust, dur: 0.35 }); c.fx('crack', { x: mx, y: my, r: 12, n: 4, dur: 2 });
    c.light(mx, my, 28, P.steel, 0.6, 0.3).shake(0.2).stop(0.05).flash(P.steel, 0.05).wash(P.teal, 0.04, 0.5).boom('pike_thrust');
  } });
// T3 ── 창의 숲: 땅을 찍으면 둘레 2칸에 창이 물결처럼 솟아 선다. 숲은 4.5초 서서, 맥박마다 안의 적을 찌른다
X.reg('xpike_forest', {
  cast: function (c) { c.pose('sink', 0.5, 3).sfx('pike_plant').ghost(0, 0, P.teal, 0.4, 0.4); c.ring(c.ux, c.uy, 32, P.steel, { inv: true, w: 2, dur: 0.3 }); dust(c, c.ux, c.uy, 4); },
  beat: function (c) {
    var x = c.ux, y = c.uy, D = c.S.zone.dur, k = 0;
    c.each(function (tx, ty, i, d) { if (d < 0.5 || (d < 1.5 && i % 2)) return; plant(c, tx + c.rnd(0.12), ty + 0.1, { len: 16 + (k % 3) * 2, lean: (tx - x) * 1.6, up: 0.03, n: 3, sp: 13, lag: 0.02, d: (d - 1) * 0.06 + (k % 3) * 0.02, dur: D + 0.2 }); k++; }, 13);
    c.fx('shock', { x: x, y: y, r: 38, c: P.steel, c2: P.pale, w: 2, dust: P.dust, dur: 0.45 }); c.fx('crack', { x: x, y: y, r: 22, n: 7, dur: 2.4 });
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.white, r: 9 }); c.spray(hx, hy, STEEL, 3, -1.5708, 0.7, { spd: 44, grav: 100, life: 0.35 }); }, 5);
    c.burst(x, y + 0.3, DUST, 12, { up: 14, grav: 60, spd: 44, life: 0.45, spread: 20, flat: true });
    c.light(x, y, 28, P.steel, 0.6, 0.4).shake(0.2).stop(0.05).flash(P.steel, 0.05).wash(P.teal, 0.04, 0.6).boom('pike_plant');
  },
  zoneTick: function (c) {
    var n = 0;
    c.hits(function (x, y) { n++; c.shape({ k: 'thrust', x: x, y: y + 0.3, a: -1.5708, c: P.pale, big: 1, dur: 0.22 }); c.burst(x, y, STEEL, 2, { spd: 30, life: 0.2 }); }, 5);
    if (n) c.sfx('pike_thrust');
  } });
// T3 ── 천 갈래 창: 창을 하늘로 던진다 → 그림자가 자라고 → 세 번에 걸쳐 창이 쏟아져 박힌다 (마지막이 가장 많다)
X.reg('xpike_lance', {
  cast: function (c) { c.pose('back', 0.34, 4).sfx('pike_volley'); c.fx('pike_spear', { m: 'up', x: c.ux, y: c.uy, len: 16, h: 110, sx: (c.cx - c.ux) * 6, w: 2, dur: 0.4 }); },
  mark: function (c, e) {
    var x = c.cx, y = c.cy, T = e.dur, B = c.S.beats, T0 = c.tiles, b;
    c.fx('shadow', { x: x, y: y, r: 26, dur: T + 0.3 });
    c.fx('star', { x: x - 0.6, y: y - 5.6, s: 3, c: P.pale, dur: 0.3, d: Math.max(0, T - 0.5) }); c.fx('star', { x: x + 0.8, y: y - 5.1, s: 4, c: P.steel, dur: 0.3, d: Math.max(0, T - 0.4) });
    for (b = 0; b < B.length; b++) (function (b) {
      var n = b === B.length - 1 ? 5 : 3, k;
      c.at(Math.max(0, T + B[b] - 0.2), function () {
        for (k = 0; k < n; k++) { var t = T0.length ? T0[(b * 5 + k * 3 + 1) % T0.length] : [x, y]; c.fx('pike_spear', { m: 'fall', x: t[0] + c.rnd(0.25), y: t[1] + c.rnd(0.2), len: 15, h: 100, sx: -24, ft: 0.34, n: 3, sp: 22, lag: 0.07, d: k * 0.015, dur: 0.58 + (b === 2 ? 0.3 : 0) }); }
        c.spray(x, y - 2.5, STEEL, 6, 1.5708, 0.25, { spd: 150, grav: 240, life: 0.2, spread: 46 });
        if (b) c.sfx('pike_volley');
      });
    })(b);
  },
  beat: function (c, i, last) {
    var x = c.cx, y = c.cy;
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: P.white, r: last ? 10 : 7 }); sparks(c, hx, hy, 2); }, 2);
    dust(c, x + c.rnd(0.8), y + c.rnd(0.6), 3);
    if (!last) { c.shake(0.08).sfx('pike_thrust'); return; }
    c.fx('shock', { x: x, y: y, r: 36, c: P.steel, c2: P.pale, w: 2, dust: P.dust, dur: 0.45 });
    c.burst(x, y + 0.3, DUST, 10, { up: 14, grav: 60, spd: 40, life: 0.45, spread: 24, flat: true });
    c.light(x, y, 28, P.steel, 0.6, 0.35).shake(0.22).stop(0.05).flash(P.steel, 0.06).wash(P.teal, 0.04, 0.5).boom('pike_plant');
  } });
// T4 ── 빗장 꿰기: 길게 당겼다가 굵은 빗장 창이 한 줄을 꿴다 → 줄의 두 끝에 꺾쇠가 내려와 잠근다
// T5 ── 빗장 관통: 여섯 칸, 꺾쇠 셋. 빗장은 3초 걸려 있다가 부서진다
function barUp(c, grand) {
  var T = grand ? 0.45 : 0.4, e = lane(c), k;
  c.dim(grand ? 1.3 : 0.9).pose('back', T + 0.2, grand ? 7 : 6).sfx('swoosh');
  c.ring(c.ux, c.uy, grand ? 26 : 20, P.steel, { inv: true, w: 2, dur: T * 0.8 });
  c.line(c.ux, c.uy + 0.3, e.x, e.y + 0.3, P.pale, { dur: T });
  for (k = 1; k <= (grand ? 3 : 2); k++) (function (k) { c.at(k * 0.08, function () { c.ghost(-c.dx * 0.22 * k, -c.dy * 0.22 * k, grand ? P.leaf : P.teal, 0.34, 0.5 - k * 0.08); }); })(k);
  c.at(T * 0.5, function () { c.streak(grand ? 12 : 6, c.ang, P.pale, T * 0.9, 0.28); });
}
function bar(c, i, last, grand) {
  var e = lane(c), x0 = c.ux + c.dx * 0.4, y0 = c.uy + c.dy * 0.4, ex = e.x + c.dx * 0.3, ey = e.y + c.dy * 0.3, mx = (c.ux + e.x) / 2, my = (c.uy + e.y) / 2, D = grand ? 0.4 + c.S.zone.dur + 0.1 : 1.25, pts, k;
  if (i === 0) {
    c.fx('pike_bar', { x: x0, y: y0, x1: ex, y1: ey, w: grand ? 4 : 3, in: 0.12 / D, lk: 0.4 / D, lf: 0.05 / D, fade: grand ? 1.3 / D : 0, dur: D });
    c.fx('beam', { x0: x0, y0: y0, x1: ex, y1: ey, w: grand ? 6 : 5, c: P.steel, c2: P.white, dur: 0.26 });
    pierce(c, 5, 11, 3);
    c.spray(ex, ey, STEEL, grand ? 16 : 12, c.ang, 0.5, { spd: 80, life: 0.4 }); c.spray(c.ux, c.uy + 0.3, DUST, 8, c.ang + 3.1416, 0.7, { spd: 40, up: 8, life: 0.4 });
    c.fx('shock', { x: c.ux + c.dx * 0.6, y: c.uy + c.dy * 0.6, r: 20, c: P.steel, w: 2, dust: P.dust, dur: 0.4 });
    c.lunge().light(mx, my, 36, P.steel, 0.7, 0.35).shake(grand ? 0.3 : 0.24).stop(0.05).flash(P.steel, 0.06).boom('pike_thrust');
    return;
  }
  pts = grand ? [0.08, 0.5, 0.92] : [0.1, 0.9];
  for (k = 0; k < pts.length; k++) (function (k) {
    var px = x0 + (ex - x0) * pts[k], py = y0 + (ey - y0) * pts[k];
    c.fx('pike_clamp', { x: px, y: py, fall: 22, in: 0.08 / (D - 0.4), fade: grand ? 0.9 / (D - 0.4) : 0, d: k * 0.04, dur: D - 0.4 });
    c.at(0.08 + k * 0.04, function () { c.fx('shock', { x: px, y: py, r: 15, c: P.iron, c2: P.pale, w: 2, dust: P.dust, dur: 0.35, thin: 1 }); dust(c, px, py, 4); sparks(c, px, py - 0.2, 4, 44); if (k < 2) c.fx('crack', { x: px, y: py, r: 10, n: 4, dur: 2.4 }); });
  })(k);
  c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.26, c: P.white, r: 11 }); c.ring(hx, hy, 9, P.teal, { inv: true, w: 2, dur: 0.4, d: 0.08 }); }, 5);
  c.at(0.08, function () { c.light(mx, my, 40, P.steel, 0.75, 0.4).shake(grand ? 0.45 : 0.32).stop(grand ? 0.09 : 0.07).flash(P.white, grand ? 0.1 : 0.08).wash(P.teal, grand ? 0.09 : 0.06, 0.8).boom('pike_slam'); });
  if (grand) { c.fx('shock', { x: mx, y: my, r: 50, c: P.pale, w: 1, dur: 0.6, d: 0.14 }); c.fx('stain', { x: mx, y: my, r: 24, c: P.dirt, a: 0.2, dur: 3 }); c.fx('emit', { x: mx, y: my - 0.2, sp: e.n * 0.8, rate: 12, n: 1, dur: 1.0, cols: STEEL, o: { up: 22, grav: -12, spd: 5, life: 0.8 } }); }
}
X.reg('u_crossbar', { cast: function (c) { barUp(c, false); }, beat: function (c, i, last) { bar(c, i, last, false); } });
X.reg('ux_crossbar', { cast: function (c) { barUp(c, true); }, beat: function (c, i, last) { bar(c, i, last, true); },
  zoneTick: function (c) { c.hits(function (x, y) { c.ring(x, y, 8, P.teal, { inv: true, dur: 0.35 }); c.burst(x, y - 0.2, [P.iron, P.pale], 2, { spd: 16, life: 0.3 }); }, 6); c.sfx('runeTick'); },
  zoneEnd: function (c) {      // 빗장이 부서진다
    c.each(function (x, y, i) { if (i % 2 === 0) c.spray(x, y - 0.2, WOOD, 4, -1.5708, 1.4, { spd: 46, grav: 130, life: 0.5, size: 2 }); }, 8);
    c.fx('shock', { x: c.cx, y: c.cy, r: 30, c: P.dust, w: 1, dur: 0.4, thin: 1 }); c.sfx('pike_plant');
  } });
// T4 ── 연회의 끝: 촛불이 켜진 자리, 뒤에서 문이 닫힌다(쿵 · 촛불이 꺼진다) → 어둠 속에서 창이 사방에서 들어온다. 쏟아진 포도주
// T5 ── 잔치의 끝장: 창이 두 번 들어온다 (둘째는 반대쪽에서), 끝에 둘레에 창이 박혀 선다
function feastUp(c, grand) {
  var x = c.ux, y = c.uy, T = 0.4, D = grand ? 1.3 : 1.0, k, a;
  c.dim(grand ? 1.7 : 1.3).pose('sink', 0.5, 3).wash(P.lees, 0.06, D + 0.4);
  for (k = 0; k < 6; k++) { a = k / 6 * 6.2832 + 0.5; c.fx('pike_candle', { x: x + Math.cos(a) * 2.1, y: y + Math.sin(a) * 1.25, out: (T + 0.02) / 0.9, d: k * 0.02, dur: 0.9 }); }
  c.fx('pike_door', { x: x, y: y - 2.0, sh: T / (D + 0.3), dur: D + 0.3 });
  c.light(x, y, 30, P.candle, 0.4, 0.4);
}
function stab(c, n, flip, r) {      // 맞은 이마다 바깥(flip 이면 안쪽)에서 들어오는 창
  c.hits(function (hx, hy, k) {
    var ox = hx - c.ux, oy = hy - c.uy, L = Math.sqrt(ox * ox + oy * oy) || 1, s = flip ? -1 : 1, a = Math.atan2(-oy * s, -ox * s) + (k % 2 ? 0.25 : -0.25);
    thrust(c, hx, hy, a, { len: 17, go: 16, gt: 0.3, w: 1, d: k * 0.025, dur: 0.34 });
    c.at(0.06 + k * 0.025, function () { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.white, r: r }); c.spray(hx, hy, WINE, 4, a, 0.7, { spd: 50, life: 0.3 }); });
  }, n);
}
function feast(c, i, last, grand) {
  var x = c.ux, y = c.uy, k, a;
  if (i === 0) {      // 문이 닫힌다
    dust(c, x - 0.6, y - 2.0, 4); dust(c, x + 0.6, y - 2.0, 4);
    for (k = 0; k < 6; k += 2) { a = k / 6 * 6.2832 + 0.5; c.burst(x + Math.cos(a) * 2.1, y + Math.sin(a) * 1.25 - 0.3, [P.smoke, P.pale], 2, { up: 16, grav: -10, spd: 4, life: 0.6 }); }
    c.fx('shock', { x: x, y: y, r: 38, c: P.lees, c2: P.wine, w: 2, dur: 0.45, thin: 1 });
    c.hits(function (hx, hy) { c.ring(hx, hy, 9, P.wine, { inv: true, w: 2, dur: 0.35 }); }, grand ? 3 : 5);
    c.wash(P.dark, 0.08, grand ? 1.3 : 0.9).shake(0.16).stop(0.04).boom('pike_slam');
    return;
  }
  stab(c, grand ? 4 : 6, i === 2, last ? 11 : 8);
  c.light(x, y, last ? 36 : 24, P.wine, last ? 0.6 : 0.4, 0.3);
  if (!last) { c.shake(0.2).flash(P.wine, 0.05).boom('pike_thrust'); return; }
  c.fx('stain', { x: x + 0.3, y: y + 0.3, r: 24, c: P.lees, a: 0.34, c2: P.wine, n: 8, grow: 1, dur: 3.4 }); c.fx('crack', { x: x, y: y, r: 16, n: 6, dur: 2.4 });
  c.fx('shock', { x: x, y: y, r: 40, c: P.wine, c2: P.pale, w: 3, dur: 0.45 });
  c.burst(x, y, WINE, grand ? 20 : 16, { spd: 64, life: 0.4, flat: true });
  c.shake(grand ? 0.42 : 0.3).stop(grand ? 0.09 : 0.07).flash(P.wine, grand ? 0.1 : 0.08).boom('pike_thrust').sfx('pike_plant');
  if (grand) {
    c.each(function (tx, ty, j, d) { if (d < 1.5 || j % 2) return; plant(c, tx, ty + 0.1, { len: 16, lean: (x - tx) * 2.2, up: 0.06, d: 0.05 + (j % 4) * 0.03, dur: 1.5 }); }, 13);
    c.fx('shock', { x: x, y: y, r: 56, c: P.pale, w: 1, dur: 0.65, d: 0.12 }); c.wash(P.lees, 0.1, 1.0);
    c.fx('emit', { x: x, y: y, sp: 3.5, rate: 12, n: 1, dur: 1.0, cols: [P.candle, P.wine, P.smoke], o: { up: 22, grav: -12, spd: 5, life: 0.8 } });
  }
}
X.reg('u_feast', { cast: function (c) { feastUp(c, false); }, beat: function (c, i, last) { feast(c, i, last, false); } });
X.reg('ux_feast', { cast: function (c) { feastUp(c, true); }, beat: function (c, i, last) { feast(c, i, last, true); } });
// T4 ── 문지기: 좌우에 창 두 자루가 문설주로 서고 → 쇠문이 떨어져 쿵 하고 선다. 아군 머리 위에 엇건 창
// T5 ── 철문 수문장: 더 큰 철문과 금테. 문설주는 6초 서 있고, 맥박마다 들어선 적에게 창이 뻗는다
function gateUp(c, grand) {
  var x = c.ux, y = c.uy, D = grand ? c.S.zone.dur + 0.5 : 1.7, R = grand ? 1.25 : 1.05;
  c.dim(grand ? 1.3 : 0.9).pose('sink', 0.5, 3).sfx('pike_plant').ghost(0, 0, grand ? P.leaf : P.teal, 0.45, 0.4);
  plant(c, x - R, y + 0.1, { len: grand ? 30 : 26, w: 2, up: 0.08 / D * 1.7, dur: D }); plant(c, x + R, y + 0.1, { len: grand ? 30 : 26, w: 2, up: 0.08 / D * 1.7, d: 0.06, dur: D });
  dust(c, x - R, y, 3); dust(c, x + R, y, 3);
  c.ring(x, y, 34, P.steel, { inv: true, w: 2, dur: 0.32 });
}
function gate(c, grand) {
  var x = c.ux, y = c.uy;
  c.fx('pike_gate', { x: x, y: y + 0.1, w: grand ? 38 : 32, h: grand ? 30 : 26, fall: 34, in: 0.07, c: P.iron, c2: grand ? P.leaf : P.teal, dur: grand ? 1.8 : 1.5 });
  c.at(0.1, function () {
    c.fx('shock', { x: x, y: y, r: grand ? 42 : 36, c: P.steel, c2: P.pale, w: 3, dust: P.dust, dur: 0.5 }); c.fx('crack', { x: x, y: y + 0.2, r: grand ? 22 : 16, n: 6, dur: 2.4 });
    c.burst(x, y + 0.35, DUST, 14, { up: 12, grav: 60, spd: 46, life: 0.45, spread: 26, flat: true });
    c.who(true, function (ax, ay) { c.fx('pike_cross', { x: ax, y: ay - 1.0, s: 5, dur: 0.8 }); c.burst(ax, ay - 0.3, [P.steel, P.leaf, P.white], 3, { up: 26, grav: -18, spd: 5, life: 0.6 }); }, 6);
    c.burst(x, y, STEEL, grand ? 22 : 16, { up: 32, grav: -20, spd: 16, life: 0.8, spread: 34 });
    c.light(x, y, 40, P.steel, 0.75, 0.8).shake(grand ? 0.38 : 0.26).stop(0.06).flash(P.steel, grand ? 0.09 : 0.06).wash(P.teal, grand ? 0.09 : 0.06, grand ? 1.3 : 1.0).boom('pike_slam');
    if (grand) { c.fx('shock', { x: x, y: y, r: 56, c: P.leaf, w: 1, dur: 0.7, d: 0.12 }); c.fx('column', { x: x, y: y, w: 7, h: 84, c: P.steel, c2: P.white, a: 0.5, dur: 0.5 }); c.streak(10, -1.5708, P.steel, 0.7, 0.26); c.fx('emit', { x: x, y: y - 0.4, sp: 3.5, rate: 12, n: 1, dur: 1.3, cols: [P.steel, P.leaf, P.white], o: { up: 24, grav: -14, spd: 4, life: 0.9 } }); }
  });
}
X.reg('u_gatekeep', { cast: function (c) { gateUp(c, false); }, beat: function (c) { gate(c, false); } });
X.reg('ux_gatekeep', { cast: function (c) { gateUp(c, true); }, beat: function (c) { gate(c, true); },
  zoneTick: function (c) {
    var n = 0;
    c.hits(function (hx, hy, k) { var a = Math.atan2(hy - c.cy, hx - c.cx); n++; thrust(c, hx, hy, a, { len: 15, go: 12, gt: 0.35, d: k * 0.03, dur: 0.3 }); c.shape({ k: 'impact', x: hx, y: hy, dur: 0.2, c: P.white, r: 7, d: 0.06 + k * 0.03 }); c.burst(hx, hy, STEEL, 2, { spd: 30, life: 0.2 }); }, 5);
    c.fx('shock', { x: c.cx, y: c.cy, r: 34, c: P.steel, w: 1, dur: 0.5, thin: 1 });
    if (n) c.sfx('pike_thrust');
  } });
})();
