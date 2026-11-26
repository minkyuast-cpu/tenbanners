// 전민 — 기술 연출: 해병 (갈고리와 사슬 · 밀려오는 물 · 소용돌이 · 닻. 맨 위에는 깊은 바다의 촉수). 틀과 쓰는 법은 src/skfx.js · docs/SKILL_FX.md.
//   이 파일이 맡는 기술: cmd_mar · mar_hook (T1) · mar_surge (T2) · xmar_surge · xmar_whirl · xmar_tsunami (T3) · u_landing · u_warcry · u_moor (T4) · ux_* 셋 (T5)
//   빛깔: 바다(#8fd0ff · #d6fbff · #4fa6d8 · #2f86a6 · #1d4f6e) · 사슬과 쇠(#cdd5e3 · #8f9ab3) · 기합의 산호빛(#ff8a6a)
//   무늬: 마디진 사슬과 갈고리 · 말리는 물마루(옆에서 본 파도) · 땅에서 도는 소용돌이 · 쇠닻 · 촉수
//   고친 표 (옛 → 새 · tools/skdmg.js 새 ÷ 옛: 허수아비 / 싸움판):
//     cmd_mar       설명의 긴 줄표만 걷음
//     mar_hook      110% 바로 → 같은 값, 사슬이 닿을 때(0.14초)                                 1.00 / 1.00
//     mar_surge     150% 바로 → 같은 값, 물마루가 닿을 때(0.24초)                               1.00 / 1.01
//     xmar_surge    190% 한 번 → 잔물결 80%와 젖음, 큰 물결 120%와 두 칸 밀어내기               1.02 / 1.00
//     xmar_whirl    160% · 둔화 8초 → 일 때 95%, 3초 돌며 1초마다 32%와 둔화(3초)                1.01 / 1.00
//     xmar_tsunami  240% 바로 → 0.8초 뒤(비켜설 수 있다) 265%                                    1.11 / 1.02
//     u_landing     220% 바로 → 같은 값, 물이 차오른 뒤(0.45초)                                  1.00 / 1.00
//     u_warcry      그대로, 숨을 들이쉰 뒤(0.3초)
//     u_moor        200% 한 번 → 닻이 꽂히며 120%와 둔화, 사슬을 당겨 95%와 끌어오기              1.01 / 0.98
//     ux_landing    300% 한 번 → 230%, 0.9초 뒤 뒤따르는 물결이 80%와 내 쪽으로 한 칸(새로 생긴 끌어오기)   1.00 / 1.00
//     ux_warcry     그대로, 보호막만 바다가 답할 때(0.5초 뒤)
//     ux_moor       260% · 둔화 12초 → 130% + 80%, 그 자리가 3초 깊은 물: 1초마다 40%와 둔화(4초)   1.04 / 1.04
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var X = DS.skfx; if (!X) return;
var P = X.PAL.mar = { sea: '#8fd0ff', foam: '#d6fbff', white: '#ffffff', mid: '#4fa6d8', deep: '#2f86a6', abyss: '#1d4f6e', night: '#12304a', chain: '#cdd5e3', iron: '#8f9ab3', rust: '#4a5468', dark: '#1b2030',
  cry: '#ff8a6a', gold: '#ffd98a', kr: '#356a86', dust: '#d8c39a', earth: '#a8754a', dirt: '#6f4a2c' };
var SEA = [P.foam, P.sea, P.mid], FOAM = [P.white, P.foam, P.sea], IRON = [P.white, P.chain, P.iron], DUST = [P.dust, P.earth, P.dirt], CRY = [P.cry, P.gold, P.white];
var MA = { type: 'magic', stat: 'atk' };
function ma(o) { o.type = MA.type; o.stat = MA.stat; return o; }

// ───────── 기술 표 ─────────
X.def('cmd_mar', { desc: '호령. 모든 아군의 방어 +12% (20초), 게이지 +25.' });
// 갈고리 작살: 사슬이 날아가 걸릴 때(0.14초). 파도 밀기: 물마루가 닿을 때(0.24초). 수치는 그대로
X.def('mar_hook', { beats: [0.14] });
X.def('mar_surge', { beats: [0.24] });
// 해일 밀기: 한 번(190%) → 잔물결 80%와 젖음, 큰 물결 120%와 밀어내기
X.def('xmar_surge', { beats: [0.25, 0.62],
  eff: [ma({ t: 'dmg', m: 0.8 }), { t: 'status', s: 'wet', dur: 14 }, ma({ t: 'dmg', m: 1.2, b: 1 }), { t: 'knock', n: 2, b: 1 }],
  desc: '직선 4칸에 물결이 두 번 친다. 잔물결 80%와 젖음, 이어서 큰 물결 120%와 두 칸 밀어내기.' });
// 소용돌이: 한 번(160% · 둔화 8초) → 일 때 95%, 3초 돌며 1초마다 32%와 둔화 (안에 있는 동안 느려진다)
X.def('xmar_whirl', { beats: [0.3],
  eff: [ma({ t: 'dmg', m: 0.95 }), { t: 'pull', n: 1 }, { t: 'status', s: 'wet', dur: 12 }],
  zone: { dur: 3, every: 1, k: 'water', eff: [ma({ t: 'dmg', m: 0.32 }), { t: 'status', s: 'slow', dur: 3 }] },
  desc: '겨눈 2칸 반경에 소용돌이가 인다. 95%, 한 칸 끌어오고 젖게 한다. 소용돌이는 3초 돌며, 그 안의 적은 1초마다 32%와 둔화.' });
// 대해일: 바로(240%) → 물이 빠졌다가 0.8초 뒤에 덮친다 265% (비켜서는 몫만큼 올렸다)
X.def('xmar_tsunami', { fall: { delay: 0.8 },
  eff: [ma({ t: 'dmg', m: 2.65 }), { t: 'knock', n: 2 }, { t: 'status', s: 'wet', dur: 14 }, { t: 'gauge', v: -40 }],
  desc: '직선 6칸에 0.8초 뒤 해일이 덮친다. 265%, 두 칸 밀어내고 젖게 하며 게이지를 깎는다. 덮치기 전에 비켜설 수 있다.' });
// 해일 상륙: 물이 차오른 뒤(0.45초) 달려 나간다. 수치는 그대로
X.def('u_landing', { beats: [0.45] });
// 거대 해일: 한 번(300%) → 230% 로 달려 나가고, 0.9초 뒤 뒤따르는 물결이 그 길의 적을 내 쪽으로 한 칸 쓸어 오며 80%
X.def('ux_landing', { beats: [0.5],
  eff: [ma({ t: 'dmg', m: 2.3 }), { t: 'status', s: 'wet', dur: 14 }, { t: 'gauge', v: -50 }],
  zone: { dur: 0.9, every: 0.9, k: 'water', eff: [ma({ t: 'dmg', m: 0.8 }), { t: 'pull', n: 1 }] },
  desc: '해일을 타고 직선 7칸을 달린다. 230%, 젖게 하고 게이지를 깎는다. 0.9초 뒤 뒤따르는 물결이 그 길의 적을 내 쪽으로 한 칸 쓸어 오며 80%.' });
// 기합!: 숨을 들이쉬고(0.3초) 지른다. 수치는 그대로. 바다의 함성: 보호막은 바다가 답할 때(0.5초 뒤)
X.def('u_warcry', { beats: [0.3] });
X.def('ux_warcry', { beats: [0.3, 0.8],
  eff: [{ t: 'buff', s: 'atk', p: 35, dur: 16 }, { t: 'gauge', v: 50 }, { t: 'cleanse' }, { t: 'buff', s: 'shd', m: 0.6, stat: 'atk', dur: 12, b: 1 }],
  desc: '모든 아군의 공격 +35% (16초), 게이지 +50, 상태 이상을 털어 낸다. 곧이어 바다가 답해 모든 아군에게 보호막(공격의 60%, 12초).' });
// 닻 끌기: 한 번(200%) → 닻이 꽂히며 120%와 둔화, 사슬을 당겨 95%와 끌어오기
X.def('u_moor', { beats: [0.4, 0.8],
  eff: [{ t: 'dmg', m: 1.2 }, { t: 'status', s: 'slow', dur: 10 }, { t: 'dmg', m: 0.95, b: 1 }, { t: 'pull', n: 1, b: 1 }],
  desc: '겨눈 십자 범위에 쇠닻을 던진다. 꽂히며 120%와 둔화. 곧이어 사슬을 당겨 95%, 한 칸 끌어온다.' });
// 심해의 닻: 한 번(260% · 둔화 12초) → 130% + 80%, 그 자리가 3초 동안 깊은 물이 되어 촉수가 1초마다 40%와 둔화
X.def('ux_moor', { beats: [0.45, 0.9],
  eff: [{ t: 'dmg', m: 1.3 }, { t: 'status', s: 'slow', dur: 6 }, { t: 'dmg', m: 0.8, b: 1 }, { t: 'pull', n: 1, b: 1 }],
  zone: { dur: 3, every: 1, k: 'water', eff: [{ t: 'dmg', m: 0.4 }, { t: 'status', s: 'slow', dur: 4 }] },
  desc: '겨눈 2칸 반경에 큰 닻이 떨어진다. 130%와 둔화. 곧이어 사슬을 당겨 80%, 한 칸 끌어온다. 그 자리는 3초 동안 깊은 물이 되어, 촉수가 그 안의 적을 1초마다 40%로 죄고 둔화시킨다.' });

// ───────── 소리 ─────────
X.sound('mar_chain', function (tone, noise) { [0, 0.045, 0.09].forEach(function (d) { noise(0.035, 0.1, 3400, 1.6, d); }); tone(700, 480, 0.12, 'square', 0.025); }, 3.7);      // 사슬이 풀린다
X.sound('mar_surge', function (tone, noise) { noise(0.34, 0.14, 700, 0.5, 0, 'lowpass'); tone(160, 320, 0.3, 'sine', 0.05); noise(0.2, 0.06, 2400, 0.8, 0.1); }, 1.43);      // 물이 밀려온다
X.sound('mar_splash', function (tone, noise) { noise(0.3, 0.24, 1100, 0.5); noise(0.4, 0.16, 300, 0.5, 0.03, 'lowpass'); tone(140, 60, 0.25, 'sine', 0.08); }, 1.5);      // 물마루가 부서진다
X.sound('mar_anchor', function (tone, noise) { noise(0.3, 0.3, 170, 0.6, 0, 'lowpass'); tone(100, 40, 0.3, 'square', 0.1); tone(520, 480, 0.1, 'triangle', 0.04, 0.01); noise(0.05, 0.1, 2600, 1.4, 0.02); }, 1.24);      // 쇠닻이 꽂힌다
X.sound('mar_cry', function (tone, noise) { tone(196, 294, 0.22, 'sawtooth', 0.06); tone(294, 440, 0.22, 'square', 0.035, 0.02); noise(0.16, 0.1, 1000, 0.8); tone(98, 98, 0.2, 'triangle', 0.05); }, 2.1);      // 악!
X.sound('mar_deep', function (tone, noise) { tone(70, 46, 0.45, 'sine', 0.1); noise(0.45, 0.12, 220, 0.6, 0, 'lowpass'); }, 0.8);      // 깊은 물이 운다

// ───────── 그림 조각 ─────────
function disc(g, cx, cy, rx, ry) { ry = Math.max(1, Math.round(ry)); for (var y = -ry; y <= ry; y++) { var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5)))); if (w > 0) g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1); } }
// 사슬: (x, y) 에서 (x1, y1) 로 뻗는다 (out 그 몫 · h 던져진 닻처럼 휘어 오른다). x2 · y2 가 있으면 그 뒤 끝이 그리로 당겨진다 (pt 그 몫). sag 늘어짐 · taut 당기면 팽팽해진다 · hook 0 이면 갈고리 없이
X.kind('mar_chain', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var out = p.out == null ? 0.4 : p.out, q = out > 0 ? Math.min(1, f / out) : 1, r = f > out ? (f - out) / ((1 - out) || 1) : 0, ex, ey, n, i, x, y, t, sag;
  ex = (p.x1 - p.x) * 16 * q; ey = (p.y1 - p.y) * 16 * q - (p.h || 0) * 4 * q * (1 - q);
  if (p.x2 != null) { t = X.ease(Math.min(1, r / (p.pt || 0.5))); ex += (p.x2 - p.x1) * 16 * t; ey += (p.y2 - p.y1) * 16 * t; }
  sag = (p.sag || 0) * (p.taut ? Math.max(0, 1 - r * 5) : 1) * (q < 1 ? q : 1);
  n = Math.max(2, Math.round(Math.sqrt(ex * ex + ey * ey) / 3));
  g.globalAlpha = f > 0.85 ? (1 - f) / 0.15 : 1;
  for (i = 0; i <= n; i++) {
    t = i / n; x = Math.round(cx + ex * t); y = Math.round(cy - 3 + ey * t + sag * 4 * t * (1 - t));
    if (i % 2) { g.fillStyle = p.c || P.chain; g.fillRect(x - 1, y, 2, 1); } else { g.fillStyle = p.c2 || P.iron; g.fillRect(x, y - 1, 1, 3); }
  }
  if (p.hook !== 0) { x = Math.round(cx + ex); y = Math.round(cy - 3 + ey); g.fillStyle = P.dark; g.fillRect(x - 2, y - 2, 5, 5); g.fillStyle = P.white; g.fillRect(x - 1, y - 1, 3, 1); g.fillRect(x + 1, y - 1, 1, 3); g.fillStyle = P.chain; g.fillRect(x - 1, y + 1, 2, 1); }
} });
// 물마루: (x, y) 에서 (x1, y1) 로 밀려간다. 가로 길이면 옆에서 본 말리는 파도, 세로 길이면 길을 가로지른 물띠. h 높이 · w 몸통 · curl 말림 · lin 고른 빠르기
X.kind('mar_wave', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var q = p.lin ? f : X.ease(f), dx = (p.x1 - p.x) * 16, dy = (p.y1 - p.y) * 16, hz = Math.abs(dx) >= Math.abs(dy), s = (hz ? dx : dy) >= 0 ? 1 : -1, x = Math.round(cx + dx * q), y = Math.round(cy + dy * q);
  var a = X.env(f, 0.08, 0.2), H = Math.round((p.h || 14) * X.env(f, 0.18, 0.25)), i, k, wb, xf, hw, hc;
  if (H < 2) return;
  g.globalAlpha = a * 0.5; g.fillStyle = P.foam;      // 지나온 길의 거품
  if (hz) { for (i = Math.min(cx, x); i < Math.max(cx, x); i += 3) g.fillRect(Math.round(i), y + 6 + ((i >> 1) % 2), 2, 1); } else { for (i = Math.min(cy, y); i < Math.max(cy, y); i += 3) g.fillRect(x - 4 + ((i >> 1) % 3) * 3, Math.round(i) + 5, 2, 1); }
  g.globalAlpha = a;
  if (hz) {      // 옆에서 본 물마루: 뒤로 길게 눕고, 앞은 위로 갈수록 내밀다가 끝이 말려 떨어진다
    for (i = 0; i < H; i++) {
      k = i / H; wb = Math.round((p.w || 9) * 1.5 * Math.pow(1 - k, 1.4)) + 2; xf = x + Math.round(s * k * k * (p.curl || 6));
      g.fillStyle = k > 0.74 ? P.white : k > 0.42 ? P.sea : i < 2 ? P.deep : P.mid; g.fillRect(s > 0 ? xf - wb : xf, y + 6 - i, wb, 1);
      g.fillStyle = k > 0.6 ? P.foam : P.deep; g.fillRect(s > 0 ? xf - wb : xf + wb - 1, y + 6 - i, 1, 1);
      if (k > 0.25 && i % 2 === 0) { g.fillStyle = P.foam; g.fillRect(s > 0 ? xf - 2 : xf, y + 6 - i, 2, 1); }
    }
    xf = x + Math.round(s * (p.curl || 6)); i = Math.max(2, Math.round(H * 0.16));      // 말린 끝
    g.fillStyle = P.white; g.fillRect(s > 0 ? xf : xf - i - 1, y + 7 - H, i + 1, 2); g.fillRect(s > 0 ? xf + i - 1 : xf - i - 1, y + 9 - H, 2, i);
    g.fillStyle = P.foam; g.fillRect(s > 0 ? xf + i - 2 : xf - i, y + 9 - H + i, 2, 1);
    g.fillStyle = P.white; for (i = 0; i < 4; i++) g.fillRect(x + s * (2 + i * 2) + Math.round((X.hs(i, p.sd) - 0.5) * 4), y + 6 - H - Math.round(X.hs(i + 5, p.sd) * 4 + Math.sin(time * 14 + i) * 1.5), 1, 1);
  } else {
    hw = Math.round((p.w || 9) * 0.9);
    for (i = -hw; i <= hw; i++) { hc = Math.max(2, Math.round(H * 0.7 * (1 - (i / hw) * (i / hw) * 0.6))); g.fillStyle = P.mid; g.fillRect(x + i, y + 6 - hc, 1, hc); g.fillStyle = (i + Math.floor(time * 10)) % 3 ? P.sea : P.foam; g.fillRect(x + i, y + 6 - hc, 1, Math.max(1, hc >> 1)); g.fillStyle = P.white; g.fillRect(x + i, y + 5 - hc - (i & 1), 1, 2); }
  }
} });
// 소용돌이 (땅의 겹): 어두운 물 위에 거품의 팔 셋이 돈다. r 반지름 · spin 빠르기 · grow 번지며 커진다
X.kind('mar_whirl', { L: 0, draw: function (g, p, f, time, V, cx, cy) {
  var r = (p.r || 30) * (p.grow ? Math.min(1, 0.3 + f * 3) : Math.min(1, 0.5 + f * 6)), a = X.env(f, 0.08, 0.2) * (p.a || 0.9), arms = p.arms || 3, n = Math.max(8, Math.round(r * 0.7)), j, i, t, rr, an, sp = (p.spin || 3.2) * time, y0 = cy + 5;
  g.globalAlpha = a * 0.36; g.fillStyle = P.abyss; disc(g, cx, y0, r, r * 0.5);
  g.globalAlpha = a * 0.55; g.fillStyle = P.night; disc(g, cx, y0, r * 0.26, r * 0.13);
  for (j = 0; j < arms; j++) for (i = 0; i < n; i++) {
    t = i / n; rr = r * (0.12 + 0.88 * t); an = j / arms * 6.2832 + t * 3.6 - sp;
    g.globalAlpha = a * (0.35 + 0.65 * t); g.fillStyle = i % 4 === 0 ? P.white : t > 0.6 ? P.foam : P.sea;
    g.fillRect(Math.round(cx + Math.cos(an) * rr), Math.round(y0 + Math.sin(an) * rr * 0.5), t > 0.5 ? 2 : 1, 1);
  }
} });
// 쇠닻: 가로 9 × 세로 11 (s 배). (x, y) 발치에 선다. x1 · y1 이 있으면 던져져 날아간다(h 높이 · ft 그 몫) · fall 위에서 떨어진다
var ANCH = [[3, 3], [3, 1, 5, 1], [3, 3], [1, 7], [4, 1], [4, 1], [0, 1, 4, 1, 8, 1], [0, 2, 4, 1, 7, 2], [1, 2, 4, 1, 6, 2], [2, 5], [3, 3]];
function anchor(g, x, y, s, c, c2) {
  var r, k, R, top = y - ANCH.length * s, lx = x - Math.round(4.5 * s);
  g.fillStyle = P.dark; for (r = 0; r < ANCH.length; r++) { R = ANCH[r]; for (k = 0; k < R.length; k += 2) g.fillRect(lx + R[k] * s - 1, top + r * s - 1, R[k + 1] * s + 2, s + 2); }
  g.fillStyle = c; for (r = 0; r < ANCH.length; r++) { R = ANCH[r]; for (k = 0; k < R.length; k += 2) g.fillRect(lx + R[k] * s, top + r * s, R[k + 1] * s, s); }
  g.fillStyle = c2; for (r = 3; r < ANCH.length; r++) { R = ANCH[r]; g.fillRect(lx + R[0] * s, top + r * s, 1, s); } g.fillRect(lx + 4 * s, top + 3 * s, 1, 6 * s);
}
X.kind('mar_anchor', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var s = p.s || 1, x = cx, y = cy + 6, q = 1;
  if (p.x1 != null) { q = Math.min(1, f / (p.ft || 0.5)); x += (p.x1 - p.x) * 16 * q; y += (p.y1 - p.y) * 16 * q - (p.h || 0) * 4 * q * (1 - q); }
  else if (p.fall) { q = Math.min(1, f / (p.ft || 0.2)); y -= (1 - q * q) * p.fall; }
  g.globalAlpha = f > 0.85 ? (1 - f) / 0.15 : Math.min(1, f * 10);
  anchor(g, Math.round(x), Math.round(y) + (q >= 1 ? s : 0), s, p.c || P.chain, p.c2 || P.white);
} });
// 촉수: 땅(깊은 물)에서 솟아 흔들린다. h 높이 · w 굵기 · sw 흔들림 · lean 끝이 기우는 쪽
X.kind('mar_tent', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var H = p.h || 22, up = p.up || 0.1, q = f < up ? X.ease(f / up) : f > 0.85 ? (1 - f) / 0.15 : 1, h = Math.round(H * q), i, w, x, k;
  for (i = 0; i < h; i++) {
    k = i / H; w = Math.max(1, Math.round((p.w || 4) * (1 - k * 0.75))); x = Math.round(cx + Math.sin(i * 0.3 + time * (p.spd || 4) + (p.sd || 0)) * k * (p.sw || 4) + (p.lean || 0) * k * k - w / 2);
    g.fillStyle = P.dark; g.fillRect(x - 1, cy + 6 - i, w + 2, 1);
    g.fillStyle = p.c || P.kr; g.fillRect(x, cy + 6 - i, w, 1); g.fillStyle = p.c2 || P.sea; g.fillRect(x, cy + 6 - i, 1, 1);
    if (i % 3 === 1 && w > 1) { g.fillStyle = P.foam; g.fillRect(x + w - 1, cy + 6 - i, 1, 1); }
  }
} });

// ───────── 연출 ─────────
function lane(c) { var T = c.tiles, i, d, bd = -1, e = null; for (i = 0; i < T.length; i++) { d = Math.abs(T[i][0] - c.ux) + Math.abs(T[i][1] - c.uy); if (d > bd) { bd = d; e = T[i]; } } return e ? { x: e[0], y: e[1], n: Math.max(1, Math.round(bd)) } : { x: c.ux + c.dx, y: c.uy + c.dy, n: 1 }; }
function hand(c) { return [c.ux + c.dx * 0.3, c.uy + c.dy * 0.3]; }
function wave(c, x0, y0, x1, y1, o) { o = o || {}; return c.fx('mar_wave', { x: x0, y: y0, x1: x1, y1: y1, h: o.h || 14, w: o.w || 9, curl: o.curl, lin: o.lin, d: o.d || 0, dur: o.dur || 0.35 }); }
// 물이 튄다: 위로 솟는 물방울
function splash(c, x, y, n, sp) { c.spray(x, y, FOAM, n, -1.5708, 0.9, { spd: sp || 50, grav: 140, life: 0.45, size: 2 }); }
function drops(c, x, y, n) { c.burst(x, y, SEA, n, { spd: 30, up: 10, grav: 90, life: 0.4 }); }
function wet(c, x, y, r, dur, a) { return c.fx('stain', { x: x, y: y, r: r, c: P.mid, a: a || 0.26, c2: P.foam, n: 6, grow: 1, dur: dur || 2.5 }); }

// T1 ── 버텨라! (호령): 외치면 아군 발치에 작은 닻이 하나씩 내려 박힌다
X.reg('cmd_mar', { cast: function (c) {
  c.pose('sink', 0.3, 2).sfx('shout').ring(c.ux, c.uy, 12, P.sea, { dur: 0.3 });
  c.each(function (x, y, i, d) { c.fx('mar_anchor', { x: x + 0.36, y: y, s: 1, fall: 9, ft: 0.25, d: 0.05 + Math.min(0.2, d * 0.04), dur: 0.6 }); c.burst(x + 0.36, y + 0.3, [P.sea, P.chain], 1, { up: 14, spd: 8, life: 0.35 }); }, 6);
} });
// T1 ── 갈고리 작살: 사슬이 날아가 걸리고, 팽팽해지며 적을 끌어온다 (사슬 끝이 끌려오는 적을 따라온다)
X.reg('mar_hook', {
  cast: function (c) { var h = hand(c); c.pose('back', 0.26, 2).sfx('mar_chain'); c.fx('mar_chain', { x: h[0], y: h[1], x1: c.cx, y1: c.cy, out: 1, sag: 1, dur: 0.14 }); },
  beat: function (c) {
    var h = hand(c), x = c.cx, y = c.cy, fx = x, fy = y;
    c.hits(function (hx, hy, k, w) { x = hx; y = hy; fx = w.x; fy = w.y; }, 1);
    c.fx('mar_chain', { x: h[0], y: h[1], x1: x, y1: y, x2: fx, y2: fy, out: 0, pt: 0.45, dur: 0.36 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 7 }).ring(x, y, 9, P.chain, { inv: true, dur: 0.25 });
    c.burst(x, y, IRON, 6, { spd: 34, life: 0.22 }); c.spray(fx, fy + 0.3, DUST, 3, c.ang + 3.1416, 0.5, { spd: 26, life: 0.3 });
    c.light(x, y, 14, P.chain, 0.35, 0.2).boom('hook');
  } });
// T2 ── 파도 밀기: 발밑에 물이 모이고, 말리는 물마루가 세 칸을 밀고 간다. 젖은 땅이 남는다
X.reg('mar_surge', {
  cast: function (c) {
    var e = lane(c);
    c.pose('back', 0.34, 3).sfx('mar_surge').ring(c.ux, c.uy, 12, P.sea, { inv: true, dur: 0.22 });
    wave(c, c.ux + c.dx * 0.3, c.uy + c.dy * 0.3, e.x + c.dx * 0.4, e.y + c.dy * 0.4, { h: 13, dur: 0.4 });
  },
  beat: function (c) {
    var e = lane(c), mx = (c.ux + e.x) / 2 + c.dx * 0.5, my = (c.uy + e.y) / 2 + c.dy * 0.5;
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.2, c: P.foam, r: 7 }); splash(c, hx, hy, 4); }, 3);
    wet(c, mx, my, 13 + e.n * 2, 2.4); drops(c, e.x, e.y, 8);
    c.fx('shock', { x: e.x, y: e.y, r: 15, c: P.sea, c2: P.foam, w: 1, dur: 0.35, thin: 1 });
    c.lunge().light(mx, my, 20, P.sea, 0.4, 0.3).shake(0.1).boom('mar_splash');
  } });
// T3 ── 해일 밀기: 잔물결이 먼저 적시고 → 몸을 한 번 더 당겼다가 큰 물결이 덮쳐 밀어낸다
X.reg('xmar_surge', {
  cast: function (c) {
    var e = lane(c);
    c.pose('back', 0.3, 3).sfx('mar_surge').ghost(-c.dx * 0.25, -c.dy * 0.25, P.sea, 0.3, 0.4);
    wave(c, c.ux + c.dx * 0.3, c.uy + c.dy * 0.3, e.x + c.dx * 0.3, e.y + c.dy * 0.3, { h: 9, w: 7, dur: 0.4 });
  },
  beat: function (c, i) {
    var e = lane(c), x0 = c.ux + c.dx * 0.3, y0 = c.uy + c.dy * 0.3, mx = (c.ux + e.x) / 2 + c.dx * 0.5, my = (c.uy + e.y) / 2 + c.dy * 0.5;
    if (i === 0) {
      c.hits(function (hx, hy) { drops(c, hx, hy, 3); c.ring(hx, hy, 8, P.sea, { dur: 0.25 }); }, 4);
      c.shake(0.08).sfx('water'); c.pose('back', 0.36, 5);
      c.at(0.07, function () { wave(c, x0 - c.dx * 0.6, y0 - c.dy * 0.6, e.x + c.dx * 1.6, e.y + c.dy * 1.6, { h: 22, w: 13, curl: 9, dur: 0.48 }); c.sfx('mar_surge'); });      // 0.3초 뒤(둘째 박자)에 닿는다
      return;
    }
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.white, r: 10 }); splash(c, hx, hy, 5, 64); }, 4);
    wet(c, mx, my, 16 + e.n * 3, 3); wet(c, e.x + c.dx, e.y + c.dy, 12, 2.6, 0.2);
    c.fx('shock', { x: mx, y: my, r: 30, c: P.sea, c2: P.foam, w: 2, dur: 0.4 }); c.fx('beam', { x0: x0, y0: y0 + 0.3, x1: e.x + c.dx * 1.5, y1: e.y + c.dy * 1.5 + 0.3, w: 3, c: P.foam, c2: P.white, dur: 0.3 });
    c.burst(mx, my, FOAM, 12, { up: 18, grav: 80, spd: 50, life: 0.5, spread: e.n * 8 });
    c.ghost(c.dx * 0.25, c.dy * 0.25, P.foam, 0.26, 0.35);
    c.lunge().light(mx, my, 28, P.sea, 0.6, 0.35).shake(0.2).stop(0.05).flash(P.foam, 0.05).wash(P.deep, 0.05, 0.6).boom('mar_splash');
  } });
// T3 ── 소용돌이: 겨눈 자리에 물이 돌기 시작하고 → 크게 벌어져 끌어들인다. 3초 동안 땅에서 돈다 (사람들 발밑에서)
X.reg('xmar_whirl', {
  cast: function (c) { c.castPose(P.sea).pose('rise', 0.4, 2).sfx('mar_deep').ghost(0, 0, P.sea, 0.35, 0.35); c.fx('mar_whirl', { x: c.cx, y: c.cy, r: 12, grow: 1, spin: 5, dur: 0.36 }); },
  beat: function (c) {
    var x = c.cx, y = c.cy, D = c.S.zone.dur;
    c.fx('mar_whirl', { x: x, y: y, r: 36, spin: 3.4, dur: D + 0.35 });
    c.fx('shock', { x: x, y: y, r: 38, c: P.sea, c2: P.foam, w: 2, dur: 0.45 });
    c.hits(function (hx, hy, k, w) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: P.foam, r: 8 }); c.line(hx, hy, w.x, w.y, P.foam, { dur: 0.2 }); splash(c, hx, hy, 3); }, 5);
    c.burst(x, y, FOAM, 14, { spd: 60, up: 8, grav: 60, life: 0.45, spread: 20, flat: true });
    c.light(x, y, 28, P.sea, 0.55, 0.4).shake(0.16).stop(0.04).flash(P.sea, 0.05).wash(P.deep, 0.05, 0.7).boom('mar_splash');
  },
  zoneTick: function (c) {
    c.hits(function (x, y) { c.ring(x, y, 8, P.foam, { inv: true, dur: 0.35 }); c.burst(x, y + 0.2, SEA, 2, { up: 16, grav: 60, spd: 14, life: 0.35 }); }, 6);
    c.sfx('water');
  },
  zoneEnd: function (c) { c.fx('shock', { x: c.cx, y: c.cy, r: 30, c: P.foam, w: 1, dur: 0.4, thin: 1 }); drops(c, c.cx, c.cy, 8); } });
// T3 ── 대해일: 물이 길에서 빠져나가 내 뒤에 벽으로 선다 → 0.8초 뒤 큰 물마루 둘이 여섯 칸을 덮친다
X.reg('xmar_tsunami', {
  cast: function (c) { c.pose('back', 0.6, 4).sfx('mar_deep').ghost(0, 0, P.sea, 0.4, 0.35); },
  mark: function (c, e) {
    var T = e.dur, L = lane(c), bx = c.ux - c.dx * 0.9, by = c.uy - c.dy * 0.9, ex = L.x + c.dx * 0.6, ey = L.y + c.dy * 0.6, a = c.ang, n = L.n;
    c.fx('beam', { x0: L.x, y0: L.y + 0.35, x1: c.ux, y1: c.uy + 0.35, w: 2, c: P.foam, c2: P.sea, dur: T * 0.7 });      // 빠지는 물
    c.spray((c.ux + L.x) / 2, (c.uy + L.y) / 2 + 0.3, SEA, 10, a + 3.1416, 0.25, { spd: 70, grav: 0, life: 0.4, spread: n * 9 });
    wave(c, bx, by, bx + c.dx * 0.01, by + c.dy * 0.01, { h: 20, w: 12, curl: 3, lin: 1, dur: T - 0.2 });      // 뒤에 서는 물의 벽
    c.at(Math.max(0, T - 0.42), function () { c.sfx('mar_surge'); });
    c.at(Math.max(0, T - 0.3), function () { wave(c, bx, by, ex, ey, { h: 27, w: 15, curl: 10, dur: 0.5 }); wave(c, bx - c.dx * 0.8, by - c.dy * 0.8, ex - c.dx * 0.6, ey - c.dy * 0.6, { h: 16, w: 10, d: 0.09, dur: 0.5 }); });
    c.L = L;
  },
  beat: function (c) {
    var L = c.L || lane(c), x0 = c.ux, y0 = c.uy, mx = (x0 + L.x) / 2, my = (y0 + L.y) / 2;
    c.hits(function (hx, hy) { var d = Math.abs(hx - x0) + Math.abs(hy - y0); c.at(Math.min(0.12, d * 0.02), function () { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.white, r: 10 }); splash(c, hx, hy, 5, 66); }); }, 5);
    wet(c, x0 + (L.x - x0) * 0.3, y0 + (L.y - y0) * 0.3, 20, 3.2); wet(c, x0 + (L.x - x0) * 0.75, y0 + (L.y - y0) * 0.75, 20, 3.4);
    c.fx('shock', { x: mx, y: my, r: 34, c: P.sea, c2: P.foam, w: 3, dur: 0.45 }); c.fx('shock', { x: L.x, y: L.y, r: 24, c: P.foam, w: 1, dur: 0.5, d: 0.1, thin: 1 });
    c.fx('beam', { x0: x0, y0: y0 + 0.3, x1: L.x + c.dx, y1: L.y + c.dy + 0.3, w: 4, c: P.foam, c2: P.white, dur: 0.34 });
    c.burst(mx, my, FOAM, 14, { up: 20, grav: 80, spd: 56, life: 0.55, spread: L.n * 9 });
    c.light(mx, my, 28, P.sea, 0.6, 0.4).shake(0.22).stop(0.05).flash(P.foam, 0.06).wash(P.deep, 0.05, 0.7).boom('mar_splash');
  } });
// T4 ── 해일 상륙: 발밑에 물이 차올라 몸이 뜬다 → 물마루를 타고 다섯 칸을 건너, 내려서는 자리에 물기둥
// T5 ── 거대 해일: 더 큰 물마루. 0.9초 뒤 둘째 물결이 같은 길을 따라와, 그 길의 적을 내 쪽으로 쓸어 온다
function landUp(c, grand) {
  var T = grand ? 0.5 : 0.45, x = c.ux, y = c.uy;
  c.dim(grand ? 1.2 : 0.9).pose('rise', T + 0.1, grand ? 5 : 4).sfx('mar_surge').ghost(0, 0, P.sea, 0.4, 0.4);
  c.ring(x, y, grand ? 28 : 22, P.sea, { inv: true, w: 2, dur: T * 0.7 }).ring(x, y, 14, P.foam, { inv: true, dur: T * 0.6, d: 0.12 });
  wave(c, x - c.dx * 0.5, y - c.dy * 0.5 + 0.1, x - c.dx * 0.49, y - c.dy * 0.49 + 0.1, { h: grand ? 18 : 14, w: 13, curl: 3, lin: 1, dur: T + 0.05 });
  c.fx('emit', { x: x, y: y + 0.3, sp: 1.2, rate: 22, n: 1, dur: T - 0.05, cols: SEA, o: { up: 26, grav: -10, spd: 8, life: 0.4 } });
  c.at(T * 0.5, function () { c.streak(grand ? 12 : 6, c.ang, P.foam, T * 0.9 + 0.2, 0.28); });
}
function land(c, grand) {
  var e = lane(c), n = e.n, x0 = c.ux, y0 = c.uy, lx = c.u.x, ly = c.u.y, mx = (x0 + e.x) / 2, my = (y0 + e.y) / 2;
  wave(c, x0, y0, e.x + c.dx * 0.4, e.y + c.dy * 0.4, { h: grand ? 30 : 24, w: grand ? 17 : 14, curl: 10, dur: 0.34 });
  wave(c, x0 - c.dx * 0.7, y0 - c.dy * 0.7, e.x - c.dx * 0.5, e.y - c.dy * 0.5, { h: grand ? 18 : 14, w: 10, d: 0.06, dur: 0.36 });
  c.fx('beam', { x0: x0, y0: y0 + 0.3, x1: e.x, y1: e.y + 0.3, w: grand ? 5 : 4, c: P.sea, c2: P.foam, dur: 0.4 });
  c.hits(function (hx, hy) { var d = Math.abs(hx - x0) + Math.abs(hy - y0); c.at(Math.min(0.16, d * 0.025), function () { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.26, c: P.white, r: 11 }); splash(c, hx, hy, 5, 70); }); }, 5);
  c.ghost(c.dx * n * 0.35, c.dy * n * 0.35, P.sea, 0.34, 0.45).ghost(c.dx * n * 0.7, c.dy * n * 0.7, P.foam, 0.4, 0.4);
  wet(c, x0 + (e.x - x0) * 0.3, y0 + (e.y - y0) * 0.3, 18, 3.2); wet(c, x0 + (e.x - x0) * 0.8, y0 + (e.y - y0) * 0.8, 18, 3.4);
  c.burst(mx, my, FOAM, 16, { up: 22, grav: 80, spd: 60, life: 0.55, spread: n * 9 });
  c.at(0.16, function () {      // 뭍에 내려선다
    c.fx('column', { x: lx, y: ly, w: grand ? 8 : 6, h: grand ? 64 : 48, c: P.sea, c2: P.foam, a: 0.55, dur: 0.34 });
    c.fx('shock', { x: lx, y: ly, r: grand ? 34 : 28, c: P.sea, c2: P.foam, w: 3, dur: 0.45 }); splash(c, lx, ly, grand ? 16 : 12, 84);
    if (grand) c.fx('shock', { x: lx, y: ly, r: 50, c: P.foam, w: 1, dur: 0.65, d: 0.1 });
  });
  c.lunge().light(mx, my, grand ? 44 : 36, P.sea, 0.8, 0.45).shake(grand ? 0.42 : 0.32).stop(grand ? 0.09 : 0.07).flash(P.foam, grand ? 0.1 : 0.08).wash(P.deep, grand ? 0.1 : 0.07, 0.8).boom('mar_splash');
  if (grand) c.fx('emit', { x: mx, y: my, sp: n * 0.9, rate: 14, n: 1, dur: 0.9, cols: FOAM, o: { up: 22, grav: -8, spd: 5, life: 0.7 } });
}
// 뒤따르는 물결 (자리가 다할 때): 길의 처음에서 끝으로 한 번 더, 맞은 이들은 끌려간다
function follow(c) {
  var T = c.tiles, n = T.length, a, b;
  if (!n) return;
  a = T[0]; b = T[n - 1];
  wave(c, a[0] - (b[0] - a[0]) / n * 0.5, a[1] - (b[1] - a[1]) / n * 0.5, b[0], b[1], { h: 20, w: 13, curl: 8, dur: 0.38 });
  c.fx('beam', { x0: a[0], y0: a[1] + 0.3, x1: b[0], y1: b[1] + 0.3, w: 3, c: P.foam, c2: P.white, dur: 0.34 });
  c.hits(function (x, y, k, w) { c.shape({ k: 'impact', x: x, y: y, dur: 0.22, c: P.foam, r: 9 }); c.line(x, y, w.x, w.y, P.foam, { dur: 0.22 }); splash(c, x, y, 4, 56); }, 5);
  c.fx('shock', { x: c.cx, y: c.cy, r: 30, c: P.sea, c2: P.foam, w: 2, dur: 0.4 }); c.burst(c.cx, c.cy, FOAM, 10, { up: 18, grav: 80, spd: 50, life: 0.5, spread: n * 8 });
  c.light(c.cx, c.cy, 28, P.sea, 0.55, 0.35).flash(P.foam, 0.05).wash(P.deep, 0.05, 0.6).shake(0.2).boom('mar_splash');
}
X.reg('u_landing', { cast: function (c) { landUp(c, false); }, beat: function (c) { land(c, false); } });
X.reg('ux_landing', { cast: function (c) { landUp(c, true); }, beat: function (c) { land(c, true); }, zoneEnd: follow });
// T4 ── 기합!: 숨을 들이쉬고 — 「악!」. 소리의 겹이 앞뒤로 퍼지고, 아군마다 산호빛 고리가 차례로 돈다. 몸에 묻은 것이 털려 나간다
// T5 ── 바다의 함성: 외침에 바다가 답한다. 물의 고리가 번져 아군마다 물방울 지붕(보호막)이 씌워진다
function cryUp(c, grand) {
  c.dim(grand ? 1.5 : 1.0).pose('sink', 0.3, 3).ghost(0, 0, P.cry, 0.3, 0.35);
  c.ring(c.ux, c.uy, 26, P.cry, { inv: true, w: 2, dur: 0.28 }).ring(c.ux, c.uy, 16, P.gold, { inv: true, dur: 0.24, d: 0.06 });
}
function cry(c, i, last, grand) {
  var x = c.ux, y = c.uy, f = c.u.face < 0 ? -1 : 1;
  if (i === 0) {
    c.pose('hop', 0.3, 5).float(x, y + 0.3, '악!', P.cry, { dx: f * 16, big: true, life: 0.7 });
    c.fx('cone', { x: x + f * 0.3, y: y - 0.3, a: f > 0 ? 0 : 3.1416, spread: 0.9, len: grand ? 52 : 44, c: P.cry, c2: P.gold, dur: 0.45 });
    c.fx('cone', { x: x - f * 0.3, y: y - 0.3, a: f > 0 ? 3.1416 : 0, spread: 0.9, len: grand ? 46 : 38, c: P.gold, c2: P.white, dur: 0.45, d: 0.04 });
    c.fx('shock', { x: x, y: y, r: 32, c: P.cry, c2: P.gold, w: 3, dur: 0.45 }); c.fx('shock', { x: x, y: y, r: 54, c: P.white, w: 1, dur: 0.6, d: 0.1, thin: 1 });
    c.each(function (ax, ay, k, d) { c.at(Math.min(0.3, d * 0.05), function () { c.ring(ax, ay, 9, P.cry, { w: 2, dur: 0.35 }); c.burst(ax, ay - 0.3, CRY, 3, { up: 26, grav: -18, spd: 6, life: 0.6 }); c.spray(ax, ay - 0.2, SEA, 2, 1.5708, 0.5, { spd: 30, grav: 120, life: 0.35 }); }); }, 8);
    c.burst(x, y - 0.3, CRY, 14, { spd: 70, life: 0.35, flat: true });
    c.light(x, y, 36, P.cry, 0.7, 0.4).shake(grand ? 0.3 : 0.26).stop(0.05).flash(P.cry, 0.07).wash(P.cry, 0.06, 0.8).boom('mar_cry');
    if (!grand) c.streak(6, -1.5708, P.gold, 0.5, 0.24);
    return;
  }
  // 바다가 답한다
  c.fx('shock', { x: x, y: y, r: 44, c: P.sea, c2: P.foam, w: 3, dur: 0.5 }); c.fx('shock', { x: x, y: y, r: 66, c: P.foam, w: 1, dur: 0.7, d: 0.1 });
  c.fx('column', { x: x, y: y, w: 8, h: 80, c: P.sea, c2: P.foam, a: 0.5, dur: 0.45 }); c.fx('mar_whirl', { x: x, y: y, r: 26, spin: 5, a: 0.7, dur: 0.9 });
  c.each(function (ax, ay, k, d) { c.at(Math.min(0.3, d * 0.05), function () { c.fx('dome', { x: ax, y: ay, r: 10, c: P.sea, c2: P.foam, dur: 0.9 }); splash(c, ax, ay + 0.2, 3, 44); }); }, 8);
  splash(c, x, y, 16, 90); c.streak(10, -1.5708, P.foam, 0.7, 0.26);
  c.fx('emit', { x: x, y: y - 0.3, sp: 4, rate: 14, n: 1, dur: 1.1, cols: FOAM, o: { up: 24, grav: -12, spd: 5, life: 0.8 } });
  c.light(x, y, 44, P.sea, 0.8, 0.6).shake(0.4).stop(0.08).flash(P.foam, 0.1).wash(P.deep, 0.1, 1.0).boom('mar_splash');
}
X.reg('u_warcry', { cast: function (c) { cryUp(c, false); }, beat: function (c, i, last) { cry(c, i, last, false); } });
X.reg('ux_warcry', { cast: function (c) { cryUp(c, true); }, beat: function (c, i, last) { cry(c, i, last, true); } });
// T4 ── 닻 끌기: 쇠닻이 사슬을 끌고 포물선으로 날아가 꽂힌다 → 사슬이 팽팽해지며 닻째 끌어온다 (땅에 긁힌 고랑)
// T5 ── 심해의 닻: 더 큰 닻. 꽂힌 자리가 깊은 물이 되고 촉수 넷이 솟아 3초 동안 조인다
function moorUp(c, grand) {
  var h = hand(c), T = grand ? 0.45 : 0.4, s = grand ? 3 : 2;
  c.dim(grand ? 1.4 : 1.0).pose('back', T + 0.1, grand ? 6 : 5).sfx('mar_chain').ghost(-c.dx * 0.25, -c.dy * 0.25, P.chain, 0.3, 0.4);
  c.fx('mar_anchor', { x: h[0], y: h[1], x1: c.cx, y1: c.cy, h: grand ? 20 : 14, ft: 1, s: s, dur: T });
  c.fx('mar_chain', { x: h[0], y: h[1], x1: c.cx, y1: c.cy - 0.5, h: grand ? 20 : 14, out: 1, sag: -2, hook: 0, dur: T });
  c.fx('shadow', { x: c.cx, y: c.cy, r: grand ? 16 : 11, dur: T });
  c.at(T * 0.45, function () { c.streak(grand ? 10 : 6, c.ang, P.chain, T * 0.8, 0.26); c.sfx('fallWhistle'); });
}
function moor(c, i, last, grand) {
  var h = hand(c), x = c.cx, y = c.cy, s = grand ? 3 : 2, D = grand ? c.S.zone.dur : 0, k, a;
  if (i === 0) {      // 꽂힌다
    c.fx('mar_anchor', { x: x, y: y, s: s, dur: grand ? 1.1 : 1.0 });
    c.fx('mar_chain', { x: h[0], y: h[1], x1: x, y1: y - 0.5, out: 0, sag: 2.5, hook: 0, dur: grand ? 0.47 : 0.42 });
    c.fx('shock', { x: x, y: y, r: grand ? 36 : 26, c: P.chain, c2: P.white, w: 3, dust: P.dust, dur: 0.45 }); c.fx('crack', { x: x, y: y, r: grand ? 22 : 15, n: grand ? 8 : 6, dur: 2.6 });
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.white, r: 9 }); }, 5);
    c.spray(x, y, DUST, grand ? 20 : 16, -1.5708, 1.3, { spd: 60, grav: 160, life: 0.5, size: 2 }); c.burst(x, y, IRON, 10, { spd: 50, life: 0.26 });
    c.light(x, y, 36, P.chain, 0.7, 0.35).shake(grand ? 0.36 : 0.28).stop(0.06).flash(P.chain, 0.07).boom('mar_anchor');
    c.at(0.16, function () { c.pose('back', 0.34, 5); });
    return;
  }
  // 당긴다
  c.fx('mar_chain', { x: h[0], y: h[1], x1: x, y1: y - 0.5, out: 0, hook: 0, c: P.white, dur: 0.3 });
  c.fx('beam', { x0: x, y0: y + 0.35, x1: x - c.dx * 1.2, y1: y - c.dy * 1.2 + 0.35, w: 3, c: P.dirt, c2: P.dust, dur: 0.5 });      // 닻이 긁은 고랑
  c.hits(function (hx, hy, k, w) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: P.chain, r: 8 }); c.line(hx, hy, w.x, w.y, P.chain, { dur: 0.22, w: 1 }); c.spray(hx, hy + 0.3, DUST, 3, c.ang + 3.1416, 0.5, { spd: 36, life: 0.3 }); }, 5);
  c.fx('shock', { x: x, y: y, r: grand ? 30 : 22, c: P.chain, w: 2, dust: P.dust, dur: 0.4, thin: 1 });
  c.light(x, y, 28, P.chain, 0.5, 0.3).shake(grand ? 0.3 : 0.24).stop(0.05).flash(P.white, grand ? 0.06 : 0.05).boom('hook').sfx('mar_chain');
  if (!grand) { c.wash(P.deep, 0.05, 0.6); return; }
  // 깊은 물과 촉수
  c.fx('stain', { x: x, y: y, r: 34, c: P.night, a: 0.4, c2: P.sea, n: 10, grow: 1, dur: D + 0.4 }); c.fx('mar_whirl', { x: x, y: y, r: 30, spin: 1.6, a: 0.6, dur: D + 0.3 });
  for (k = 0; k < 4; k++) { a = k / 4 * 6.2832 + 0.6; c.fx('mar_tent', { x: x + Math.cos(a) * 1.5, y: y + Math.sin(a) * 0.95, h: 20 + (k % 2) * 5, w: 4, sw: 4, lean: -Math.cos(a) * 6, up: 0.08, d: 0.1 + k * 0.06, dur: D + 0.1 }); }
  c.fx('shock', { x: x, y: y, r: 52, c: P.sea, c2: P.foam, w: 1, dur: 0.65, d: 0.1 }); splash(c, x, y, 16, 80);
  c.fx('emit', { x: x, y: y, sp: 3, rate: 8, n: 1, dur: 1.4, cols: SEA, o: { up: 20, grav: -10, spd: 4, life: 0.8 } });
  c.wash(P.night, 0.1, 1.2).sfx('mar_deep');
}
X.reg('u_moor', { cast: function (c) { moorUp(c, false); }, beat: function (c, i, last) { moor(c, i, last, false); } });
X.reg('ux_moor', { cast: function (c) { moorUp(c, true); }, beat: function (c, i, last) { moor(c, i, last, true); },
  zoneTick: function (c) {
    c.hits(function (x, y, k) { c.fx('mar_tent', { x: x + 0.35, y: y + 0.1, h: 13, w: 3, sw: 3, lean: -5, up: 0.2, d: k * 0.04, dur: 0.5 }); c.ring(x, y, 8, P.sea, { inv: true, dur: 0.35 }); c.burst(x, y + 0.2, SEA, 2, { up: 16, grav: 60, spd: 14, life: 0.35 }); }, 5);
    c.sfx('mar_deep');
  },
  zoneEnd: function (c) { c.fx('shock', { x: c.cx, y: c.cy, r: 32, c: P.foam, w: 1, dur: 0.4, thin: 1 }); drops(c, c.cx, c.cy, 10); } });
})();
