// 전민 — 기술 연출: 승려 (맨손의 무투가 — 주먹 · 발 · 기공). 틀과 쓰는 법은 src/skfx.js · docs/SKILL_FX.md.
//   이 파일이 맡는 기술: cle_combo · cmd_cle · cle_kick (T1) · cle_palm (T2) · xcle_combo · xcle_hands · xcle_heaven (T3) · u_flurry · u_stance · u_palm (T4) · ux_* 셋 (T5)
//   빛깔: 기의 주황 #ffd28a #fff6d0 #f08a3a · 장(掌)의 푸른빛 #bfe8ff #7fd0ff #4a8fd0 · 윗길의 금 #f6cf57 · 흙먼지 #d8c39a · 바위 #8f9ab3 · 기를 나누는 초록 #9ef08a
//   무늬: 주먹 도장(날아와 찍힌다) · 발차기의 초승달 · 손바닥 도장(공중의 장 · 땅에 찍히는 손자국) · 등 뒤의 손들(천수) · 몸을 감싸는 기 · 뒤에 솟는 산 · 금빛 바퀴
//   고친 것 (옛 → 새 · tools/skdmg.js 허수아비 / 실전):
//     cmd_cle      그대로 (설명의 긴 줄표만)
//     cle_combo    세 번 60 · 60 · 70% 가 한순간에 → 같은 세 번이 0.28초에 걸쳐 (주먹 · 주먹 · 발). 기 전하기는 첫 주먹과 함께          1.00 / 1.00
//     cle_kick     160% → 같다, 날아가 닿을 때(0.16초)                                                                              1.00 / 1.00
//     cle_palm     180% + 밀어냄 + 회복 → 회복은 기를 모을 때 바로, 장은 0.18초 뒤 (수치 그대로)                                     1.00 / 1.00
//     xcle_combo   세 번 80 · 80 · 90% → 같은 세 번이 0.5초에 걸쳐 (주먹 · 주먹 · 올려차기). 회복은 첫 주먹과 함께                     1.00 / 1.00
//     xcle_hands   여섯 번 50 × 5 + 60% → 같은 여섯 번이 0.74초에 걸쳐. 회복은 손을 펼칠 때 바로, 게이지는 마지막 장에                 1.00 / 1.00
//     xcle_heaven  260% + 두 칸 밀어냄 → 내리누르기 115% + 땅이 갈라지며 155%와 밀어냄. 회복은 내리누를 때                            1.01 / 1.01
//     u_flurry     여섯 번 55 × 5 + 60%(흡수 30%) → 다섯 번 50% + 크게 한 방 85%(흡수 20% — 되찾는 양은 그대로)                      1.01 / 1.00
//     ux_flurry    여섯 번 70 × 5 + 80% → 다섯 번 60% + 크게 한 방 70% + 뒤늦게 안에서 터지는 기 82%(흡수 30%) — 일곱 번              1.01 / 1.02
//     u_stance · ux_stance   그대로, 발을 구를 때(0.3초 · 0.4초) 걸린다
//     u_palm       230% → 같다, 기를 모으는 뜸 0.55초                                                                               1.00 / 1.00
//     ux_palm      320% + 두 칸 밀어냄 → 장 250% + 열린 하늘에서 내리는 빛 80%와 밀어냄 · 회복                                       1.01 / 1.01
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var X = DS.skfx; if (!X) return;
var P = X.PAL.cle = { chi: '#ffd28a', pale: '#fff6d0', orange: '#f08a3a', deep: '#c85a1e', white: '#ffffff', palm: '#bfe8ff', blue: '#7fd0ff', deepblue: '#4a8fd0', gold: '#f6cf57', dust: '#d8c39a', earth: '#a8754a', dirt: '#6f4a2c', rock: '#8f9ab3', heal: '#9ef08a' };
var HIT = [P.white, P.pale, P.chi], GOLDHIT = [P.gold, P.white, P.chi], PALM = [P.palm, P.white, P.blue], GOLD = [P.gold, P.pale, P.white], ROCK = [P.dust, P.earth, P.dirt], K = '#1b1626';
var hs = X.hs, env = X.env, ease = X.ease;

// ───────── 기술 표 ─────────
X.def('cmd_cle', { desc: '호령. 모든 아군의 방어 +15% (20초), 기를 고르게 돌려 모두 조금 회복.' });
// 연환권: 세 번이 한순간에 찍히던 것 → 주먹 · 주먹 · 발이 0.28초에 걸쳐. 수치는 그대로. 기 전하기는 첫 주먹과 함께 (대상이 도중에 쓰러져도 회복은 간다)
X.def('cle_combo', { beats: [0, 0.14, 0.28], eff: [{ t: 'dmg', m: 0.6 }, { t: 'mend', r: 4, m: 1.3 }, { t: 'dmg', m: 0.6, b: 1 }, { t: 'dmg', m: 0.7, b: 2 }] });
// 비연각: 날아가 닿을 때(0.16초). 수치는 그대로
X.def('cle_kick', { beats: [0.16] });
// 기공장: 기를 모으며 바로 회복, 0.18초 뒤 장. 수치는 그대로
X.def('cle_palm', { beats: [0, 0.18], eff: [{ t: 'dmg', m: 1.8, type: 'magic', stat: 'mix', b: 1 }, { t: 'knock', n: 1, b: 1 }, { t: 'aura', r: 2, m: 1.2 }, { t: 'mend', r: 4, m: 1.0 }],
  desc: '기를 모으며 둘레 2칸 아군을 회복하고, 4칸 안에서 가장 다친 아군은 더 회복. 곧바로 2칸 안의 적 하나에 기공 180%(마법 저항으로 막는다), 1칸 밀어낸다.' });
// 금강 연환권: 주먹 · 주먹 · 올려차기가 0.5초에 걸쳐. 수치는 그대로
X.def('xcle_combo', { beats: [0, 0.22, 0.5], eff: [{ t: 'dmg', m: 0.8 }, { t: 'mend', r: 4, m: 1.6 }, { t: 'dmg', m: 0.8, b: 1 }, { t: 'dmg', m: 0.9, b: 2 }],
  desc: '붙은 적을 주먹, 주먹, 올려차기로 세 번 친다. 모두 250%. 4칸 안에서 가장 다친 아군 하나를 회복.' });
// 천수권: 손을 펼치며 바로 회복, 이어서 여섯 번이 0.74초에 걸쳐. 수치는 그대로 (게이지는 마지막 장에)
X.def('xcle_hands', { beats: [0, 0.14, 0.24, 0.34, 0.44, 0.54, 0.74],
  eff: [{ t: 'dmg', m: 0.5, b: 1 }, { t: 'mend', r: 4, m: 1.2 }, { t: 'dmg', m: 0.5, b: 2 }, { t: 'dmg', m: 0.5, b: 3 }, { t: 'dmg', m: 0.5, b: 4 }, { t: 'dmg', m: 0.5, b: 5 }, { t: 'dmg', m: 0.6, b: 6 }, { t: 'gauge', v: -40, b: 6 }] });
// 천지개벽장: 한 번(260%) → 하늘의 손이 내리누르고(115%) 땅이 갈라진다(155% · 밀어냄). 회복은 내리누를 때
X.def('xcle_heaven', { beats: [0.3, 0.62],
  eff: [{ t: 'dmg', m: 1.15, type: 'magic', stat: 'mix' }, { t: 'aura', r: 2, m: 1.2 }, { t: 'dmg', m: 1.55, type: 'magic', stat: 'mix', b: 1 }, { t: 'knock', n: 2, b: 1 }],
  desc: '직선 5칸을 하늘의 손이 내리눌러 기공 115%, 이어서 땅이 갈라지며 155%, 두 칸 밀어낸다. 둘레 2칸 아군을 회복.' });
// 백렬권: 55 × 5 + 60% → 다섯 번 50% + 크게 한 방 85% (흡수는 30% → 20%: 되찾는 양은 그대로)
X.def('u_flurry', { beats: [0.18, 0.3, 0.4, 0.49, 0.57, 0.9],
  eff: [{ t: 'dmg', m: 0.5 }, { t: 'dmg', m: 0.5, b: 1 }, { t: 'dmg', m: 0.5, b: 2 }, { t: 'dmg', m: 0.5, b: 3 }, { t: 'dmg', m: 0.5, b: 4 }, { t: 'dmg', m: 0.85, drain: 0.2, b: 5 }, { t: 'gauge', v: -40, b: 5 }],
  desc: '붙은 적 하나에 다섯 번 몰아치고(50%씩) 힘을 모아 한 방(85%). 게이지를 깎고, 마지막 한 방의 피해 일부만큼 회복.' });
// 백만권: 70 × 5 + 80% → 다섯 번 60% + 크게 한 방 70% + 뒤늦게 몸 안에서 터지는 기 82% (한 번 더 치는 만큼 합을 올려 받는 피해를 같게)
X.def('ux_flurry', { beats: [0.18, 0.29, 0.39, 0.48, 0.56, 0.85, 1.2],
  eff: [{ t: 'dmg', m: 0.6 }, { t: 'dmg', m: 0.6, b: 1 }, { t: 'dmg', m: 0.6, b: 2 }, { t: 'dmg', m: 0.6, b: 3 }, { t: 'dmg', m: 0.6, b: 4 }, { t: 'dmg', m: 0.7, b: 5 }, { t: 'gauge', v: -60, b: 5 }, { t: 'dmg', m: 0.82, drain: 0.3, b: 6 }],
  desc: '붙은 적 하나에 다섯 번 몰아치고(60%씩) 크게 한 방(70%), 뒤늦게 몸 안에서 기가 터진다(82%). 게이지를 크게 깎고, 마지막 피해 일부만큼 회복.' });
// 부동심 · 금강부동: 발을 구를 때 걸린다. 수치는 그대로
X.def('u_stance', { beats: [0.3] });
X.def('ux_stance', { beats: [0.4] });
// 파산장: 기를 모으는 뜸(0.55초). 파천장: 한 번(320%) → 장 250% + 열린 하늘에서 내리는 빛 80%와 밀어냄 · 회복
X.def('u_palm', { beats: [0.55], desc: '기를 모아 0.55초 뒤 직선 4칸에 기공 230%, 1칸 밀어낸다. 둘레 2칸 아군을 조금 회복.' });
X.def('ux_palm', { beats: [0.65, 1.05],
  eff: [{ t: 'dmg', m: 2.5, type: 'magic', stat: 'mix' }, { t: 'dmg', m: 0.8, type: 'magic', stat: 'mix', b: 1 }, { t: 'knock', n: 2, b: 1 }, { t: 'aura', r: 2, m: 1.2, b: 1 }],
  desc: '기를 모아 직선 6칸에 기공 250%. 이어서 열린 하늘에서 빛이 내려 80%, 2칸 밀어낸다. 둘레 2칸 아군을 회복.' });

// ───────── 소리 ─────────
X.sound('cle_pulse', function (tone, noise) { noise(0.22, 0.22, 240, 0.7, 0, 'lowpass'); tone(200, 60, 0.2, 'sine', 0.1); tone(660, 330, 0.12, 'sine', 0.03, 0.02); }, 1.6);      // 기가 터진다
X.sound('cle_breath', function (tone, noise) { noise(0.3, 0.06, 700, 0.6, 0, 'lowpass'); tone(196, 294, 0.3, 'sine', 0.045); }, 1.85);      // 숨을 고른다
X.sound('cle_bell', function (tone, noise) { tone(196, 195, 0.5, 'sine', 0.08); tone(392, 390, 0.4, 'sine', 0.035); tone(588, 585, 0.3, 'triangle', 0.02); noise(0.05, 0.1, 500, 0.8); }, 1.4);      // 절의 종

// ───────── 그림 조각 ─────────
function PL(g, a, b, c, d, w) { DS.VX.pxLine(g, a, b, c, d, w); }
// 손바닥 (9×8): 네 손가락과 엄지
var HAND = ['....1.1..', '..1.1.1.1', '..1.1.1.1', '1.1111111', '111111111', '.11111111', '..111111.', '...1111..'];
function hand(g, x, y, s, flip) { var r, q; for (r = 0; r < 8; r++) for (q = 0; q < 9; q++) if (HAND[r].charAt(q) === '1') g.fillRect(x + ((flip ? 8 - q : q) - 4.5) * s, y + (r - 4) * s, s, s); }
// 땅에 찍히는 손자국: o = 손가락이 가리키는 쪽 (0 위 · 1 오른쪽 · 2 아래 · 3 왼쪽). 세로는 눌러 그린다
function handG(g, x, y, s, o) {
  var r, q, u, v, dx, dy, h = Math.max(1, Math.round(s * 0.6));
  for (r = 0; r < 8; r++) for (q = 0; q < 9; q++) {
    if (HAND[r].charAt(q) !== '1') continue; u = q - 4; v = r - 3.5;
    if (o === 1) { dx = -v; dy = u; } else if (o === 2) { dx = -u; dy = -v; } else if (o === 3) { dx = v; dy = -u; } else { dx = u; dy = v; }
    g.fillRect(Math.round(x + dx * s - s / 2), Math.round(y + dy * s * 0.6 - h / 2), s, h);
  }
}
// 주먹 도장 (7×6 · 오른쪽을 보는 주먹: 1 살 · 2 밝은 마디 · 3 손가락 사이의 금): a 쪽으로 날아와(fly 픽셀) 찍힌다 · s 배율 · tr 뒤에 끌리는 줄
var FIST = ['.11112.', '1111122', '1133332', '1111122', '1222332', '.11112.'];
function fist(g, x, y, s, left, c, c2, mode) {      // mode 0 = 한 빛깔(밑그림 · 번쩍임) · 1 = 제 빛깔
  var r, q, v;
  for (r = 0; r < 6; r++) for (q = 0; q < 7; q++) {
    v = FIST[r].charAt(q); if (v === '.') continue;
    if (mode) g.fillStyle = v === '1' ? c : v === '2' ? c2 : K;
    g.fillRect(x + ((left ? 6 - q : q) - 3.5) * s, y + (r - 3) * s, s, s);
  }
}
X.kind('cle_fist', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var s = p.s || 1, q = Math.min(1, f / 0.45), back = (p.fly || 0) * (1 - ease(q)), ca = Math.cos(p.a || 0), sa = Math.sin(p.a || 0), x = Math.round(cx - ca * back), y = Math.round(cy - 2 - sa * back);
  var a = f < 0.5 ? 1 : 1 - (f - 0.5) / 0.5, left = ca < -0.3, pop = f > 0.4 && f < 0.62, tr = (p.tr || 4) * s, j;
  g.globalAlpha = a * 0.6; g.fillStyle = p.c2 || '#ffffff';
  for (j = -1; j <= 1; j++) PL(g, x - ca * (3.5 * s + 2) - sa * j * s * 1.5, y - sa * (3.5 * s + 2) + ca * j * s * 1.5, x - ca * (3.5 * s + 2 + tr * (j ? 0.6 : 1)) - sa * j * s * 1.5, y - sa * (3.5 * s + 2 + tr * (j ? 0.6 : 1)) + ca * j * s * 1.5, 1);
  g.globalAlpha = a * 0.8; g.fillStyle = K; fist(g, x + 1, y + 1, s, left, 0, 0, 0); fist(g, x - 1, y, s, left, 0, 0, 0);
  g.globalAlpha = a;
  if (pop) { g.fillStyle = '#ffffff'; fist(g, x, y, s, left, 0, 0, 0); } else fist(g, x, y, s, left, p.c, p.c2 || '#fff6d0', 1);
} });
// 손바닥 도장 (공중): s 배율 · x1,y1 을 주면 그리로 밀려 간다(mv = 가는 데 드는 몫) · grow 커지며 찍힌다 · pop 처음 그 몫 동안 하얗게
X.kind('cle_palm', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var q = p.x1 != null ? ease(Math.min(1, f / (p.mv || 0.8))) : 0, x = Math.round(cx + (p.x1 != null ? (p.x1 - p.x) * 16 * q : 0)), y = Math.round(cy - 2 + (p.y1 != null ? (p.y1 - p.y) * 16 * q : 0));
  var a = env(f, 0.08, 0.3) * (p.al || 0.92), s = Math.max(1, Math.round((p.s || 2) * (p.grow ? 0.6 + 0.4 * Math.min(1, f * 5) : 1)));
  g.globalAlpha = a * 0.55; g.fillStyle = p.c2 || K; hand(g, x + 1, y + 1, s, p.flip);
  g.globalAlpha = a; g.fillStyle = f < (p.pop == null ? 0.18 : p.pop) ? '#ffffff' : p.c; hand(g, x, y, s, p.flip);
  if (s > 1) { g.globalAlpha = a * 0.7; g.fillStyle = '#ffffff'; g.fillRect(x - s, y + s, s * 2, s); }
} });
// 땅의 손자국: 찍히는 순간 하얗게, 그 뒤 빛깔로 남았다가 스러진다
X.kind('cle_print', { L: 0, draw: function (g, p, f, time, V, cx, cy) {
  var a = env(f, 0.03, 0.5);
  g.globalAlpha = a * 0.3; g.fillStyle = K; handG(g, cx + 1, cy + 7, p.s || 2, p.o || 0);
  g.globalAlpha = a * (f < 0.12 ? 1 : 0.75); g.fillStyle = f < 0.12 ? '#ffffff' : p.c; handG(g, cx, cy + 6, p.s || 2, p.o || 0);
} });
// 몸을 감싸는 기: 몸 양옆에서 오르는 가는 불꽃 줄기 (몸을 가리지 않는다)
X.kind('cle_aura', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var a = env(f, 0.1, 0.3), t = f * p.dur * 9, H = p.h || 20, j, x, h;
  for (j = 0; j < 10; j++) {
    x = Math.round(cx + (j < 5 ? -9 + j : 5 + (j - 5))); h = Math.round(H * (0.45 + 0.55 * Math.abs(Math.sin(t + j * 1.7))) * (0.6 + 0.4 * hs(j, p.sd)) * (j === 0 || j === 9 ? 0.6 : 1));
    g.globalAlpha = a * 0.75; g.fillStyle = j % 2 ? p.c : (p.c2 || '#fff6d0'); g.fillRect(x, cy + 7 - h, 1, h);
    g.globalAlpha = a; g.fillStyle = '#ffffff'; g.fillRect(x, cy + 7 - h, 1, 2);
  }
} });
// 뒤에 솟는 산 (땅 겹 — 사람들 뒤로 비친다): h 높이 · w 밑변. 솟았다가 서서히 스러진다
X.kind('cle_mount', { L: 0, draw: function (g, p, f, time, V, cx, cy) {
  var H = p.h || 46, W = p.w || 60, up = ease(Math.min(1, f / 0.18)), a = env(f, 0.05, 0.4), h = Math.round(H * up), top = Math.round(cy + 6 - h), i, half, x0;
  for (i = 0; i < h; i++) {
    half = Math.round((i / H) * W / 2 * (1 + 0.14 * Math.sin(i * 0.8)) + 1); x0 = Math.round(cx - half + Math.sin(i * 0.37) * 2);
    g.globalAlpha = a * 0.34; g.fillStyle = i < H * 0.22 ? '#ffffff' : p.c; g.fillRect(x0, top + i, half * 2, 1);
    g.globalAlpha = a * 0.8; g.fillStyle = p.c2 || '#ffffff'; g.fillRect(x0, top + i, 1, 1); g.fillRect(x0 + half * 2 - 1, top + i, 1, 1);
  }
  for (i = 0; i < h * 0.55; i++) {      // 곁의 작은 봉우리
    half = Math.round((i / H) * W / 2 * 0.9 + 1); x0 = Math.round(cx - W * 0.33 - half);
    g.globalAlpha = a * 0.24; g.fillStyle = p.c; g.fillRect(x0, top + Math.round(h * 0.45) + i, half * 2, 1);
  }
} });
// 천수: 등 뒤로 부채처럼 펼쳐지는 작은 손들. 가운데에서 바깥으로 차례로 돋는다 (몸 밖으로만 그린다)
var MINI = ['1.1.1', '1.1.1', '11111', '11111', '.111.'];
function mini(g, x, y) { var r, q; for (r = 0; r < 5; r++) for (q = 0; q < 5; q++) if (MINI[r].charAt(q) === '1') g.fillRect(x + q - 2, y + r - 2, 1, 1); }
X.kind('cle_halo', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var a = env(f, 0.08, 0.3), t = f * p.dur, k, j, n, R, an, x, y, open = f * 6;
  for (k = 0; k < 2; k++) {
    R = (p.r || 14) + k * 8; n = 5 + k * 4;
    for (j = 0; j < n; j++) {
      if (Math.abs(j - (n - 1) / 2) / n > open) continue;
      an = 3.1416 + (j + 0.5) / n * 3.1416 + Math.sin(t * 3 + k) * 0.05; x = Math.round(cx + Math.cos(an) * R * 1.15); y = Math.round(cy - 2 + Math.sin(an) * R);
      g.globalAlpha = a * 0.7; g.fillStyle = p.c3 || K; mini(g, x + 1, y + 1);
      g.globalAlpha = a; g.fillStyle = k ? (p.c2 || p.c) : p.c; mini(g, x, y);
    }
  }
} });
// 금빛 바퀴: 등 뒤에서 도는 여덟 살의 바퀴 (살은 몸 밖에서만)
X.kind('cle_wheel', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var R = (p.r || 16) * (0.5 + 0.5 * Math.min(1, f * 5)), a = env(f, 0.1, 0.3) * 0.9, rot = f * p.dur * 1.4, n = Math.round(R * 1.8), i, an;
  cy -= 3;
  for (i = 0; i < n; i++) { an = i / n * 6.2832; g.globalAlpha = a * 0.4; g.fillStyle = K; g.fillRect(Math.round(cx + Math.cos(an) * R), Math.round(cy + Math.sin(an) * R) + 1, 1, 1); g.globalAlpha = a; g.fillStyle = p.c; g.fillRect(Math.round(cx + Math.cos(an) * R), Math.round(cy + Math.sin(an) * R), 1, 1); }
  for (i = 0; i < 8; i++) { an = rot + i * 0.7854; g.globalAlpha = a * 0.7; g.fillStyle = p.c; PL(g, cx + Math.cos(an) * (R - 5), cy + Math.sin(an) * (R - 5), cx + Math.cos(an) * R, cy + Math.sin(an) * R, 1); g.globalAlpha = a; g.fillStyle = p.c2 || '#ffffff'; g.fillRect(Math.round(cx + Math.cos(an) * (R + 2)) - 1, Math.round(cy + Math.sin(an) * (R + 2)) - 1, 2, 2); }
} });

// ───────── 연출 ─────────
function tp(c) { var p = c.ids && c.ids.length ? c.pos(c.ids[0]) : null; return p || [c.cx, c.cy]; }      // 한 사람을 겨눈 기술: 그 사람이 지금 선 자리
function fistAt(c) { return [c.ux + c.dx * 0.35, c.uy + c.dy * 0.35 - 0.2]; }      // 내지르는 손
function lineO(c) { return Math.abs(c.dx) >= Math.abs(c.dy) ? (c.dx > 0 ? 1 : 3) : (c.dy > 0 ? 2 : 0); }      // 길의 방향 (손자국이 가리키는 쪽)

// T1 ── 연환권: 주먹 — 주먹 — 발. 작은 주먹 도장 둘과 초승달 하나 (1단부터 줄곧 쓰는 기술: 아주 가볍게)
X.reg('cle_combo', { beat: function (c, i, last) {
  var t = tp(c), x = t[0], y = t[1], o = i ? 0.14 : -0.14;
  c.lunge();
  if (!last) {
    c.fx('cle_fist', { x: x - c.dx * 0.3 - c.dy * o, y: y - c.dy * 0.3 + c.dx * o - (i ? 0 : 0.12), a: c.ang, s: 1, fly: 5, c: P.chi, c2: P.pale, dur: 0.16 });
    c.burst(x, y, HIT, 3, { spd: 26, life: 0.18 }); c.sfx('punch'); return;
  }
  c.fx('arc', { x: x - c.dx * 0.25, y: y, r: 8, a0: c.ang - 1.5, sw: 3, c: P.pale, c2: P.orange, w: 2, dur: 0.18 });
  c.shape({ k: 'impact', x: x, y: y, dur: 0.16, c: P.white, r: 6 });
  c.burst(x, y, HIT, 5, { spd: 34, life: 0.2 }); c.boom('kick');
} });
// T1 ── 호흡을 맞춰라 (호령): 들숨의 고리가 모였다가 날숨으로 번지고, 아군마다 기가 한 줄기 오른다
X.reg('cmd_cle', { cast: function (c) {
  var x = c.ux, y = c.uy;
  c.castPose(P.chi).pose('sink', 0.5, 2).sfx('cle_breath');
  c.ring(x, y, 18, P.pale, { inv: true, dur: 0.26 }).ring(x, y, 20, P.chi, { dur: 0.4, d: 0.24 });
  c.each(function (ax, ay, i, d) { if (i < 6) c.ring(ax, ay, 7, P.chi, { rise: true, dur: 0.45, d: 0.24 + Math.min(0.2, d * 0.04) }); c.burst(ax, ay - 0.2, [P.chi, P.pale, P.heal], 2, { up: 20, grav: -14, spd: 4, life: 0.5 }); }, 7);
} });
// T1 ── 비연각: 날아가는 몸의 줄기 → 큰 발차기 초승달, 내려앉은 자리에 먼지 고리
X.reg('cle_kick', {
  cast: function (c) { c.pose('hop', 0.18, 6); c.line(c.ux, c.uy - 0.2, c.u.x, c.u.y - 0.5, P.pale, { dur: 0.18 }); },
  beat: function (c) {
    var t = tp(c), x = t[0], y = t[1];
    c.fx('arc', { x: x - c.dx * 0.2, y: y - 0.1, r: 9, a0: c.ang - 1.7, sw: 3.4, c: P.white, c2: P.chi, w: 2, dur: 0.2 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.pale, r: 8 });
    c.fx('shock', { x: c.u.x, y: c.u.y, r: 11, c: P.dust, w: 1, thin: 1, dur: 0.28 });
    c.burst(x, y, HIT, 7, { spd: 38, up: 8, life: 0.25 });
    c.lunge().light(x, y, 14, P.chi, 0.38, 0.2).boom('kick');
  } });
// T2 ── 기공장: 손에 기가 모인다(이때 둘레가 낫는다) → 푸른 손바닥이 찍히고, 기가 몸을 뚫고 뒤로 퍼져 나간다
X.reg('cle_palm', {
  cast: function (c) { c.pose('back', 0.3, 3).sfx('qi'); },
  beat: function (c, i) {
    var t = tp(c), x = t[0], y = t[1], h = fistAt(c);
    if (i === 0) { c.ring(h[0], h[1], 13, P.palm, { inv: true, w: 2, dur: 0.18 }); c.burst(h[0], h[1], PALM, 4, { spd: 8, life: 0.2 }); return; }
    c.fx('cle_palm', { x: x - c.dx * 0.35, y: y - c.dy * 0.35 - 0.1, s: 2, flip: c.dx < 0, c: P.palm, c2: P.deepblue, dur: 0.3 });
    c.fx('cone', { x: x + c.dx * 0.3, y: y + c.dy * 0.3, a: c.ang, spread: 0.55, len: 24, c: P.blue, c2: P.white, dur: 0.32 });
    c.ring(x, y, 13, P.blue, { w: 2, dur: 0.32 }).shape({ k: 'impact', x: x, y: y, dur: 0.22, c: P.white, r: 9 });
    c.spray(x, y, PALM, 8, c.ang, 0.6, { spd: 46, life: 0.3 }); c.burst(x, y, PALM, 6, { spd: 30, life: 0.3, flat: true });
    c.light(x, y, 20, P.blue, 0.48, 0.3).shake(0.1).flash(P.palm, 0.03).boom('cle_pulse');
  } });
// T3 ── 금강 연환권: 금테 주먹 둘(금강의 반짝임) → 뛰어올라 올려차기 — 아래에서 위로 긋는 큰 초승달, 땅이 갈라진다
X.reg('xcle_combo', { beat: function (c, i, last) {
  var t = tp(c), x = t[0], y = t[1], o = i ? 0.16 : -0.16;
  if (!last) {
    c.lunge();
    c.fx('cle_fist', { x: x - c.dx * 0.15 - c.dy * o, y: y - c.dy * 0.15 + c.dx * o - 0.1, a: c.ang, s: 2, fly: 7, c: P.chi, c2: P.gold, dur: 0.2 });
    c.fx('star', { x: x - c.dy * o, y: y - 0.3 + c.dx * o, s: 3, c: P.gold, d: 0.06, dur: 0.2 });
    c.burst(x, y, GOLDHIT, 5, { spd: 34, life: 0.22 }); c.shake(0.06 + i * 0.03).sfx('punch');
    if (i === 1) c.at(0.1, function () { c.pose('hop', 0.3, 8); });
    return;
  }
  c.fx('arc', { x: x - c.dx * 0.15, y: y, r: 13, a0: 1.5708, sw: (c.dx < 0 ? -1 : 1) * 3.6, c: P.white, c2: P.gold, w: 3, dur: 0.26 });
  c.fx('column', { x: x, y: y, w: 3, h: 34, c: P.gold, c2: P.white, a: 0.5, dur: 0.24 });
  c.ghost(0, 0.2, P.chi, 0.3, 0.45);
  c.shape({ k: 'impact', x: x, y: y - 0.3, dur: 0.26, c: P.white, r: 12 });
  c.fx('shock', { x: x, y: y, r: 20, c: P.chi, c2: P.white, w: 2, dust: P.dust, dur: 0.38 }); c.fx('crack', { x: x, y: y, r: 9, n: 5, dur: 2 });
  c.spray(x, y, GOLDHIT, 10, -1.5708, 0.8, { spd: 60, grav: 120, life: 0.4 }); c.burst(x, y, HIT, 8, { spd: 40, life: 0.28 });
  c.light(x, y, 26, P.chi, 0.55, 0.3).shake(0.2).stop(0.05).flash(P.chi, 0.05).boom('kick');
} });
// T3 ── 천수권: 등 뒤로 손들이 부채처럼 펼쳐진다 → 작은 손바닥이 둘씩 다섯 번 찍히고 → 금빛 큰 손바닥 하나
X.reg('xcle_hands', {
  cast: function (c) { c.pose('sink', 0.7, 2).sfx('qi'); },
  beat: function (c, i, last) {
    var t = tp(c), x = t[0], y = t[1], k;
    if (i === 0) { c.fx('cle_halo', { x: c.ux, y: c.uy, r: 14, c: P.pale, c2: P.gold, c3: P.deep, dur: 1.0 }); c.ghost(-0.3, 0, P.gold, 0.6, 0.3).ghost(0.3, 0, P.gold, 0.6, 0.3); return; }
    if (!last) {
      for (k = 0; k < 2; k++) c.fx('cle_palm', { x: x + (hs(i * 3 + k, 7) - 0.5) * 0.9 - c.dx * 0.2, y: y - 0.15 + (hs(i * 5 + k, 3) - 0.5) * 0.8, s: 1, flip: k, c: k ? P.pale : P.chi, c2: P.deep, pop: 0.3, d: k * 0.05, dur: 0.18 });
      c.burst(x, y, HIT, 3, { spd: 30, life: 0.18 }); if (i % 2) c.lunge(); c.shake(0.05).sfx('punch'); return;
    }
    c.lunge();
    c.fx('cle_palm', { x: x - c.dx * 0.2, y: y - 0.2, s: 3, c: P.gold, c2: P.deep, grow: 1, dur: 0.34 });
    c.ring(x, y, 18, P.gold, { w: 2, dur: 0.35 }); c.fx('shock', { x: x, y: y, r: 22, c: P.chi, c2: P.white, w: 2, dur: 0.4 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.26, c: P.white, r: 12 });
    c.spray(x, y, GOLDHIT, 8, c.ang, 0.5, { spd: 56, life: 0.3 }); c.burst(x, y, GOLDHIT, 12, { spd: 40, life: 0.32 });
    c.light(x, y, 28, P.gold, 0.6, 0.3).shake(0.2).stop(0.05).flash(P.gold, 0.05).wash(P.gold, 0.04, 0.5).boom('cle_pulse');
  } });
// T3 ── 천지개벽장: 하늘의 손이 내려온다(길 위에 그림자) → 칸마다 푸른 손자국이 차례로 찍힌다 → 그 길이 갈라지며 바위가 솟는다
X.reg('xcle_heaven', {
  cast: function (c) {
    c.pose('rise', 0.3, 4).sfx('qi').ghost(0, 0, P.palm, 0.4, 0.35); c.ring(c.ux, c.uy, 20, P.palm, { inv: true, w: 2, dur: 0.28 });
    c.each(function (x, y, k) { c.fx('shadow', { x: x, y: y, r: 7, d: k * 0.03, dur: 0.3 - k * 0.03 }); }, 5);
  },
  beat: function (c, i) {
    var x = c.cx, y = c.cy, T = c.tiles, n = T.length, o = lineO(c);
    if (i === 0) {
      c.pose('sink', 0.3, 3);
      c.each(function (tx, ty, k) { c.fx('cle_print', { x: tx, y: ty, s: 2, o: o, c: P.palm, d: k * 0.035, dur: 1.1 }); c.burst(tx, ty + 0.2, PALM, 2, { spd: 20, life: 0.3, flat: true }); }, 5);
      c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.2, c: P.palm, r: 8 }); }, 3);
      c.light(x, y, 26, P.blue, 0.5, 0.3).shake(0.14).flash(P.palm, 0.03).sfx('cle_pulse'); return;
    }
    if (n > 1) c.fx('crack', { x: T[1][0], y: T[1][1], r: 16, n: 5, c: P.orange, dur: 2.4 });
    if (n > 3) c.fx('crack', { x: T[3][0], y: T[3][1], r: 16, n: 5, c: P.orange, dur: 2.4 });
    c.hits(function (hx, hy) { c.fx('spike', { x: hx + c.rnd(0.2), y: hy + 0.1, h: 12, w: 6, c: ROCK, lean: c.rnd(2), dur: 0.5 }); c.spray(hx, hy, ROCK, 3, -1.5708, 0.8, { spd: 44, grav: 150, life: 0.4, size: 2 }); }, 3);
    c.fx('shock', { x: x, y: y, r: 34, c: P.chi, c2: P.white, w: 2, dust: P.dust, dur: 0.42 });
    c.each(function (tx, ty) { c.spray(tx, ty, ROCK, 3, -1.5708, 1.0, { spd: 40, grav: 150, life: 0.4 }); }, 5);
    c.light(x, y, 28, P.chi, 0.55, 0.3).shake(0.22).stop(0.05).flash(P.chi, 0.05).wash(P.chi, 0.04, 0.5).boom('quakeHit');
  } });
// T4 ── 백렬권: 몸이 흐려진다 — 주먹이 셋씩 다섯 번 몰아친 뒤, 크게 당겼다가 한 방. 기가 몸을 뚫고 나간다
// T5 ── 백만권: 그 한 방 뒤에 시간이 멎은 듯 빛의 점이 돋고 — 뒤늦게 몸 안에서 기가 터져 기둥으로 솟는다
function flurryUp(c, grand) {
  c.dim(grand ? 1.5 : 1.2).pose('shake', 0.6, 1).sfx('swoosh').ghost(-c.dx * 0.2, 0.12, P.chi, 0.5, 0.35).ghost(-c.dx * 0.2, -0.12, P.chi, 0.5, 0.35);
  c.streak(grand ? 12 : 6, c.ang, P.chi, 0.7, 0.24);
  if (grand) { c.fx('sigil', { x: c.ux, y: c.uy, r: 13, c: P.chi, c2: P.gold, sides: 8, skip: 3, dur: 1.3 }); c.ghost(-c.dx * 0.4, 0, P.gold, 0.6, 0.3); }
}
function drain(c, x, y) { c.at(0.12, function () { c.line(x, y, c.ux, c.uy, P.heal, { dur: 0.25, zig: true }); c.burst(c.ux, c.uy, [P.heal, P.pale], 5, { up: 22, grav: -16, spd: 6, life: 0.5 }); }); }      // 되찾는 기
function flurry(c, i, last, grand) {
  var t = tp(c), x = t[0], y = t[1], B = c.S.beats, k, h;
  if (i < 5) {      // 몰아치기: 박자마다 주먹 셋이 다른 자리에
    for (k = 0; k < 3; k++) c.fx('cle_fist', { x: x - c.dx * 0.25 + (hs(i * 3 + k, 5) - 0.5) * 0.7, y: y - 0.1 + (hs(i * 7 + k, 2) - 0.5) * 0.8, a: c.ang, s: 1, fly: 9, tr: 7, c: [P.chi, P.orange, P.chi][(i + k) % 3], c2: P.pale, d: k * 0.03, dur: 0.14 });
    c.burst(x, y, HIT, 3, { spd: 36, life: 0.18 }); c.lunge().shake(0.06 + i * 0.02).sfx('punch');
    if (i === 4) { h = fistAt(c); c.pose('back', (B[5] - B[4]) / 0.7, 5); c.ring(h[0], h[1], 18, P.gold, { inv: true, w: 2, dur: (B[5] - B[4]) * 0.8 }); }      // 크게 당긴다
    return;
  }
  if (i === 5) {      // 크게 한 방
    c.fx('cle_fist', { x: x - c.dx * 0.1, y: y - 0.1, a: c.ang, s: 2, fly: 12, tr: 9, c: P.chi, c2: P.pale, dur: 0.3 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.3, c: P.white, r: 16 });
    c.fx('shock', { x: x, y: y, r: 28, c: P.chi, c2: P.white, w: 3, dust: P.dust, dur: 0.45 });
    c.fx('cone', { x: x, y: y, a: c.ang, spread: 0.5, len: 40, c: P.chi, c2: P.white, dur: 0.35 });
    c.fx('crack', { x: x, y: y, r: 14, n: 6, dur: 2.4 });
    c.spray(x, y, HIT, 20, c.ang, 0.5, { spd: 90, life: 0.4, size: 2 }); c.burst(x, y, HIT, 12, { spd: 50, life: 0.35 });
    c.ghost(-c.dx * 0.3, 0, P.chi, 0.3, 0.45);
    c.light(x, y, 36, P.chi, 0.8, 0.4).shake(grand ? 0.36 : 0.32).stop(0.07).flash(P.white, 0.08).wash(P.chi, 0.06, 0.6).boom('cle_pulse').sfx('punch');
    if (!grand) { drain(c, x, y); return; }
    for (k = 0; k < 3; k++) c.fx('star', { x: x + (k - 1) * 0.3, y: y - 0.2 + (k % 2) * 0.3, s: 3 + k, c: P.gold, d: 0.08 + k * 0.08, dur: 0.3 });      // 몸 안에 남은 기
    return;
  }
  c.fx('column', { x: x, y: y, w: 8, h: 84, c: P.chi, c2: P.white, a: 0.6, dur: 0.35 });      // 안에서 터진다
  c.fx('shock', { x: x, y: y, r: 38, c: P.gold, c2: P.white, w: 3, dust: P.dust, dur: 0.5 }); c.fx('shock', { x: x, y: y, r: 54, c: P.white, w: 1, thin: 1, dur: 0.6, d: 0.12 });
  c.fx('crack', { x: x, y: y, r: 22, n: 8, c: P.orange, dur: 3 }); c.fx('stain', { x: x, y: y, r: 18, c: P.dirt, a: 0.25, c2: P.chi, n: 8, dur: 3 });
  c.shape({ k: 'impact', x: x, y: y, dur: 0.32, c: P.white, r: 20 });
  c.fx('cone', { x: x, y: y, a: c.ang, spread: 0.6, len: 46, c: P.gold, c2: P.white, dur: 0.4 });
  c.burst(x, y, GOLDHIT, 30, { spd: 90, life: 0.5, size: 2 });
  c.fx('emit', { x: x, y: y - 0.2, sp: 2.5, rate: 14, n: 1, dur: 1.0, cols: GOLD, o: { up: 26, grav: -14, spd: 5, life: 0.8 } });
  c.streak(10, -1.5708, P.gold, 0.5, 0.25);
  c.light(x, y, 44, P.gold, 0.85, 0.5).shake(0.45).stop(0.09).flash(P.white, 0.1).wash(P.gold, 0.1, 0.9).boom('cle_pulse').sfx('boom');
  drain(c, x, y);
}
X.reg('u_flurry', { cast: function (c) { flurryUp(c, false); }, beat: function (c, i, last) { flurry(c, i, last, false); } });
X.reg('ux_flurry', { cast: function (c) { flurryUp(c, true); }, beat: function (c, i, last) { flurry(c, i, last, true); } });
// T4 ── 부동심: 기가 몸으로 모인다 → 발을 구른다. 등 뒤에 산이 솟고, 기가 몸을 감싼다. 발밑이 갈라진다
// T5 ── 금강부동: 더 큰 산과 등 뒤의 금빛 바퀴, 하늘에서 내리는 금빛 기둥, 두 겹의 고리
function stanceUp(c, grand) {
  var x = c.ux, y = c.uy, T = c.S.beats[0];
  c.dim(T + 0.7).pose('sink', T + 0.3, 3).sfx('qi');
  c.ring(x, y, 30, P.gold, { inv: true, w: 2, dur: T }).ring(x, y, 22, P.chi, { inv: true, dur: T * 0.8, d: T * 0.2 });
  c.fx('emit', { x: x, y: y, sp: 2.4, rate: 20, n: 1, dur: T, cols: GOLD, o: { up: 26, grav: -30, spd: 4, life: 0.4 } });
  if (grand) c.fx('sigil', { x: x, y: y, r: 30, c: P.gold, c2: P.white, sides: 8, skip: 3, dur: T + 1.4, spin: 0.5 });
}
function stance(c, grand) {
  var x = c.ux, y = c.uy;
  c.fx('cle_mount', { x: x, y: y, h: grand ? 62 : 46, w: grand ? 84 : 62, c: P.rock, c2: grand ? P.gold : P.pale, dur: grand ? 2.2 : 1.7 });
  if (grand) c.fx('cle_wheel', { x: x, y: y - 0.4, r: 17, c: P.gold, c2: P.pale, dur: 2.2 });
  c.fx('cle_aura', { x: x, y: y, h: grand ? 28 : 21, c: P.gold, c2: P.pale, dur: grand ? 2.0 : 1.6 });
  c.fx('shock', { x: x, y: y, r: grand ? 34 : 26, c: P.gold, c2: P.white, w: 3, dust: P.dust, dur: 0.45 }); c.fx('crack', { x: x, y: y, r: grand ? 20 : 14, n: grand ? 8 : 6, c: grand ? P.gold : null, dur: 2.6 });
  c.fx('dome', { x: x, y: y, r: 11, c: P.gold, c2: P.white, dur: 1.0 });
  c.spray(x, y + 0.3, ROCK, 10, -1.5708, 1.3, { spd: 44, grav: 150, life: 0.45, size: 2 }); c.burst(x, y, GOLD, grand ? 22 : 16, { up: 30, grav: -20, spd: 14, life: 0.8, spread: 16 });
  c.light(x, y, grand ? 44 : 36, P.gold, 0.75, 0.9).shake(grand ? 0.4 : 0.26).stop(grand ? 0.07 : 0.05).flash(P.gold, grand ? 0.1 : 0.06).wash(P.gold, grand ? 0.1 : 0.06, grand ? 1.3 : 1.0).boom('quakeHit').sfx('cle_bell');
  if (!grand) return;
  c.fx('column', { x: x, y: y, w: 9, h: 100, c: P.gold, c2: P.white, a: 0.55, dur: 0.5 }); c.fx('shock', { x: x, y: y, r: 52, c: P.white, w: 1, thin: 1, dur: 0.6, d: 0.12 });
  c.fx('emit', { x: x, y: y - 0.4, sp: 3, rate: 14, n: 1, dur: 1.4, cols: GOLD, o: { up: 26, grav: -14, spd: 4, life: 0.9 } });
  c.streak(10, -1.5708, P.gold, 0.7, 0.25); c.ghost(0, 0, P.gold, 0.6, 0.45);
}
X.reg('u_stance', { cast: function (c) { stanceUp(c, false); }, beat: function (c) { stance(c, false); } });
X.reg('ux_stance', { cast: function (c) { stanceUp(c, true); }, beat: function (c) { stance(c, true); } });
// T4 ── 파산장: 손에 기가 휘몰려 든다 → 큰 손바닥이 길 끝까지 밀고 나간다. 돌이 양옆으로 갈라져 길이 열린다
// T5 ── 파천장: 손바닥은 길 끝에서 하늘로 솟고(하늘이 열린다), 열린 하늘에서 빛이 길 위로 내린다. 땅에는 손자국
function palmUp(c, grand) {
  var h = fistAt(c), T = c.S.beats[0];
  c.dim(T + 0.4).pose('back', T / 0.68, grand ? 6 : 5).sfx('qi');
  c.ring(h[0], h[1], grand ? 30 : 24, P.palm, { inv: true, w: 2, dur: T * 0.6 }).ring(h[0], h[1], grand ? 22 : 18, P.blue, { inv: true, dur: T * 0.5, d: T * 0.4 });
  c.fx('emit', { x: h[0], y: h[1], sp: 1.6, rate: 22, n: 1, dur: T - 0.05, cols: PALM, o: { spd: 14, grav: -10, life: 0.3 } });
  c.fx('sigil', { x: c.ux, y: c.uy, r: grand ? 16 : 12, c: P.palm, c2: P.white, sides: grand ? 8 : 0, skip: 3, runes: 4, dur: T + 0.2 });
  c.at(T * 0.5, function () { c.ghost(-c.dx * 0.2, -c.dy * 0.2, P.palm, 0.35, 0.4); c.sfx('swoosh'); });
  if (grand) c.wash(P.deepblue, 0.07, T + 0.3);
}
function palmHit(c, grand) {
  var T = c.tiles, n = T.length, e = n ? T[n - 1] : [c.cx, c.cy], s0 = n ? T[0] : [c.cx, c.cy], x = c.cx, y = c.cy, px = -c.dy, py = c.dx, ux = c.ux, uy = c.uy, k;
  c.fx('cle_palm', { x: s0[0] - c.dx * 0.3, y: s0[1] - c.dy * 0.3 - 0.2, x1: e[0], y1: e[1] - 0.2, mv: 0.75, s: grand ? 5 : 4, flip: c.dx < 0, c: P.palm, c2: P.deepblue, al: 0.8, dur: grand ? 0.42 : 0.36 });
  c.fx('beam', { x0: ux + c.dx * 0.5, y0: uy + c.dy * 0.5, x1: e[0] + c.dx * 0.5, y1: e[1] + c.dy * 0.5, w: grand ? 6 : 5, c: P.blue, c2: P.white, dur: 0.36 });
  c.hits(function (hx, hy, q) { var d = (Math.abs(hx - ux) + Math.abs(hy - uy)) * 0.035; c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.white, r: 10, d: d }); c.spray(hx, hy, PALM, 4, c.ang, 0.5, { spd: 60, life: 0.3 }); }, 5);
  c.each(function (tx, ty) {      // 길이 열린다: 돌이 양옆으로
    c.spray(tx + px * 0.4, ty + py * 0.4, ROCK, 2, Math.atan2(py, px), 0.5, { spd: 40, up: 12, grav: 120, life: 0.4, size: 2 });
    c.spray(tx - px * 0.4, ty - py * 0.4, ROCK, 2, Math.atan2(-py, -px), 0.5, { spd: 40, up: 12, grav: 120, life: 0.4, size: 2 });
  }, 6);
  c.fx('shock', { x: s0[0], y: s0[1], r: grand ? 30 : 24, c: P.palm, c2: P.white, w: 3, dust: P.dust, dur: 0.42 });
  c.fx('crack', { x: x, y: y, r: grand ? 26 : 20, n: 6, c: P.blue, dur: 2.6 }); c.fx('stain', { x: x, y: y, r: grand ? 30 : 24, c: P.dirt, a: 0.2, dur: 2.6 });
  c.streak(grand ? 12 : 6, c.ang, P.palm, 0.4, 0.3);
  c.light(x, y, grand ? 44 : 36, P.blue, 0.75, 0.4).shake(grand ? 0.4 : 0.32).stop(grand ? 0.08 : 0.07).flash(P.palm, grand ? 0.09 : 0.08).wash(P.blue, 0.06, 0.7).boom('cle_pulse').sfx('quakeHit');
  if (!grand) return;
  c.fx('column', { x: e[0], y: e[1], w: 8, h: 110, c: P.palm, c2: P.white, a: 0.6, d: 0.28, dur: 0.4 });      // 손바닥이 하늘로 솟는다
  for (k = 0; k < 3; k++) c.fx('star', { x: x + (k - 1) * 1.6 * (c.dx || 0.6), y: y - 6 + (k % 2) * 0.5 + (k - 1) * 1.6 * c.dy, s: 4, c: P.white, d: 0.32 + k * 0.06, dur: 0.3 });
}
function skyFall(c) {
  var x = c.cx, y = c.cy, o = lineO(c);
  c.each(function (tx, ty, k) {
    c.fx('column', { x: tx, y: ty, w: 4, h: 96, c: P.palm, c2: P.white, a: 0.5, d: k * 0.03, dur: 0.32 });
    if (k % 2 === 0) c.fx('cle_print', { x: tx, y: ty, s: 2, o: o, c: P.pale, d: k * 0.03, dur: 1.5 });
    c.burst(tx, ty, [P.white, P.palm, P.heal], 3, { up: 26, grav: -14, spd: 8, life: 0.6 });
  }, 6);
  c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.white, r: 9 }); }, 5);
  c.fx('shock', { x: x, y: y, r: 44, c: P.palm, c2: P.white, w: 2, dur: 0.5 }); c.fx('shock', { x: x, y: y, r: 58, c: P.white, w: 1, thin: 1, dur: 0.6, d: 0.12 });
  c.fx('emit', { x: x, y: y, sp: 5, rate: 14, n: 1, dur: 1.2, cols: [P.white, P.palm, P.heal], o: { up: 24, grav: -12, spd: 5, life: 0.9 } });
  c.light(x, y, 44, P.palm, 0.8, 0.5).shake(0.3).stop(0.06).flash(P.white, 0.1).wash(P.pale, 0.1, 1.0).boom('cle_pulse').sfx('holy');
}
X.reg('u_palm', { cast: function (c) { palmUp(c, false); }, beat: function (c) { palmHit(c, false); } });
X.reg('ux_palm', { cast: function (c) { palmUp(c, true); }, beat: function (c, i) { if (i === 0) palmHit(c, true); else skyFall(c); } });
})();
