// 전민 — 기술 연출: 신관 (심판하는 빛과 감싸는 빛 — 등불 · 빛의 창 · 가호 · 성역 · 빛의 고리 · 해). 틀과 쓰는 법은 src/skfx.js · docs/SKILL_FX.md.
//   이 파일이 맡는 기술: cmd_mon · mon_smite · mon_ward (T1) · mon_haste · mon_sanct (T2) · xmon_smite · xmon_halo · xmon_sun (T3) · u_lampdance · u_lantern · u_sunrise (T4) · ux_* 셋 (T5)
//   기술 표(효과 · 박자 · 설명)의 고침도 여기서 한다 (X.def) — data.js · rise.js 의 줄은 그대로 둔다.
//
//   빛깔 (X.PAL.mon): 등불 금빛 #ffe0a0 · #fff0a0 · 흰빛 #fff8d8 · 호박빛 #f09a4a · #ffb24a · 짙은 호박 #b8651e · 등잔 틀 #5a3a1a · 먼동의 붉은빛 #ffc9a8 · 새벽 앞 어둠 #1a1430 · 낫는 빛 #c8f5b0
//   약속: 치는 빛은 곧고 날카롭다 (하늘에서 비껴 꽂히는 창 · 십자로 터지는 빛 · 갈라진 금). 감싸는 빛은 둥글고 위로 뜬다 (등불 · 둥근 지붕 · 머리 위 고리 · 떠오르는 빛가루) — 아군 쪽 연출에는 충격 모양 · 금 · 흔들림을 쓰지 않는다.
//   새 그림 조각: mon_lamp(등불 · 불씨) · mon_ray(빛의 창) · mon_halo(빛의 고리) · mon_sun(해 — 하늘 · 땅 · 반쯤 뜬 해) · mon_wing(빛의 날개) · mon_cross(십자로 터지는 빛)
//   새 소리: mon_lance · mon_bell · mon_swift · mon_judge · mon_dawn
//
//   고친 것 (옛 → 새 | 허수아비 / 싸움판 피해 비 — tools/skdmg.js, 새 ÷ 옛):
//   mon_smite · mon_ward · mon_haste   수치 그대로. 빛이 닿을 때(0.15 · 0.15 · 0.1초) 걸린다 | 1.00 / 1.00
//   mon_sanct     보호막 120% · 방어 +20% · 회복 50%  →  보호막 · 방어는 그대로, 회복은 걸 때 25% + 성역이 8초 남아 2.5초마다 조금씩 세 번 (자리를 지키면 옛것보다 한 푼쯤 더, 바로 떠나면 절반)
//   xmon_smite    300% 한 번  →  창 125% + 터짐 185% 의 두 박자 (보호막은 터질 때) | 1.03 / 1.00
//   xmon_halo     한 번에  →  고리가 내려앉으며 정화 · 회복(0.35초), 곧이어 보호막(0.7초). 수치 그대로
//   xmon_sun      220% 바로  →  0.8초 뒤 해가 내려앉아 155%, 해가 3초 머물며 1초마다 35% (비켜설 수 있다) | 1.03 / 0.99
//   u_lampdance   230% 한 번  →  세 걸음 75% + 80% + 100% (화상은 첫 걸음, 보호막은 끝 걸음) | 1.03 / 1.01
//   ux_lampdance  300% 한 번  →  네 걸음 70% + 70% + 80% + 110% | 1.00 / 0.99
//   u_lantern     수치 그대로, 등불이 닿을 때(0.5초)        ux_lantern   신속(0.5초) → 보호막(1.1초) 차례로. 수치 그대로
//   u_sunrise     수치 그대로, 해가 뜰 때(0.55초) | 1.00 / 1.00        ux_sunrise   250% 한 번  →  먼동 90% + 해돋이 175% (정화 · 보호막은 해가 뜰 때) | 1.01 / 1.01
//   틀 밖에서 읽는 것 둘: 등불(ward)이 누구에게 갔는지는 화면의 유닛에서 읽는다 (warded — 'mend' 사건이 제 연출로 오지 않는다). 자리에 딸린 조각(zid)은 그 자리가 걷히면 스스로 스러진다 (zcut — 자리가 거두어질 때 부르는 연출이 없다).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var X = DS.skfx; if (!X) return;
var P = X.PAL.mon = { lamp: '#ffe0a0', glow: '#fff0a0', pale: '#fff8d8', white: '#ffffff', amber: '#f09a4a', ember: '#ffb24a', deep: '#b8651e', frame: '#5a3a1a', dusk: '#3a2410', rose: '#ffc9a8', night: '#1a1430', mint: '#c8f5b0', ash: '#2a1c10' };
var LAMP = [P.lamp, P.glow, P.white], WARM = [P.amber, P.lamp, P.pale], HOLY = [P.white, P.pale, P.lamp], MEND = [P.mint, P.pale, P.lamp];
function holy(m, b) { var o = { t: 'dmg', m: m, type: 'holy' }; if (b) o.b = b; return o; }

// ───────── 기술 표 ─────────
X.def('cmd_mon', { desc: '호령. 모든 아군의 행동 소모 −12%, 방어 +8% (20초).' });
// 등불 치기 · 등불 가호 · 신속: 빛이 닿을 때 걸린다. 수치는 그대로
X.def('mon_smite', { beats: [0.15], desc: '빛의 창을 내리꽂는다. 신성 240% (망자, 악마에게 1.5배). 그 빛이 4칸 안 가장 다친 아군에게 작은 보호막(마공의 90%)이 된다.' });
X.def('mon_ward', { beats: [0.15], desc: '아군 하나에게 등불을 보낸다. 보호막(마공의 220%, 15초)을 씌우고 상태 이상을 푼다.' });
X.def('mon_haste', { beats: [0.1], desc: '아군 하나에게 빛의 날개를 단다. 행동 소모 −35% (20초), 게이지 +30.' });
// 성역: 걸 때 한 번 낫던 것(50%)을 나눈다 — 걸 때 25%, 성역이 8초 남아 2.5초마다 조금씩 (세 번). 보호막과 방어는 그대로
X.def('mon_sanct', {
  eff: [{ t: 'buff', s: 'shd', m: 1.2, dur: 15 }, { t: 'buff', s: 'def', p: 20, dur: 20 }, { t: 'heal', m: 0.25 }],
  zone: { dur: 8, every: 2.5, k: 'gold', to: 'ally', eff: [{ t: 'heal', m: 0.03 }] },
  desc: '둘레 2칸에 8초 동안 성역을 연다. 아군에게 보호막(마공의 120%, 15초)과 방어 +20% (20초), 조금 회복. 성역 안의 아군은 2.5초마다 조금씩 더 회복한다 (세 번).' });
// 성등 치기: 한 번(300%) → 창을 꽂고(125%) 그 빛을 터뜨린다(185%). 방어는 맞을 때마다 빠지므로 합을 조금 올렸다
X.def('xmon_smite', { beats: [0.2, 0.6],
  eff: [holy(1.25), holy(1.85, 1), { t: 'ward', r: 4, m: 1.3, b: 1 }],
  desc: '빛의 창을 꽂고(신성 125%) 그 빛을 터뜨린다(185%). 망자, 악마에게 1.5배. 4칸 안 가장 다친 아군에게 보호막(마공의 130%).' });
// 빛의 고리: 고리가 내려앉으며 풀고 고친 뒤(0.35초), 머리 위에 고리가 떠 보호막이 된다(0.7초). 수치는 그대로
X.def('xmon_halo', { beats: [0.35, 0.7],
  eff: [{ t: 'buff', s: 'shd', m: 1.6, dur: 15, b: 1 }, { t: 'cleanse' }, { t: 'heal', m: 0.8 }],
  desc: '빛의 고리가 둘레 2칸에 내려앉는다. 아군의 상태 이상을 풀고 회복시킨 뒤, 곧이어 보호막(마공의 160%, 15초).' });
// 태양 강림: 바로(220%) → 0.8초 뒤 해가 내려앉아 155%, 해가 3초 머물며 1초마다 35%. 비켜서는 몫 · 여러 번 맞는 몫만큼 올렸다
X.def('xmon_sun', { fall: { delay: 0.8 },
  eff: [holy(1.55), { t: 'ward', r: 4, m: 1.5 }],
  zone: { dur: 3, every: 1, k: 'gold', eff: [holy(0.35)] },
  desc: '겨눈 2칸 반경에 0.8초 뒤 해가 내려앉는다. 신성 155%, 가장 다친 아군에게 보호막(마공의 150%). 해는 3초 머물며 그 위의 적에게 1초마다 35%. 망자, 악마에게 1.5배. 내려앉기 전에 비켜설 수 있다.' });
// 등잔불 춤: 한 번(230%) → 세 걸음 75% + 80% + 100%. 성화의 춤: 한 번(300%) → 네 걸음 70% + 70% + 80% + 110% (받는 피해는 그대로)
X.def('u_lampdance', { beats: [0.25, 0.6, 1.0],
  eff: [holy(0.75), { t: 'status', s: 'burn', dur: 8, p: 2 }, holy(0.8, 1), holy(1.0, 2), { t: 'ward', r: 4, m: 1.5, b: 2 }],
  desc: '등잔불을 들고 세 걸음 춤춘다. 직선 4칸에 신성 75%, 80%, 100%와 화상 (망자, 악마에게 1.5배). 춤이 끝나면 가장 다친 아군에게 보호막(마공의 150%).' });
X.def('ux_lampdance', { beats: [0.25, 0.55, 0.9, 1.35],
  eff: [holy(0.7), { t: 'status', s: 'burn', dur: 10, p: 3 }, holy(0.7, 1), holy(0.8, 2), holy(1.1, 3), { t: 'ward', r: 4, m: 2.2, b: 3 }],
  desc: '성화를 들고 네 걸음 춤춘다. 직선 6칸에 신성 70%, 70%, 80%, 110%와 화상 (망자, 악마에게 1.5배). 춤이 끝나면 가장 다친 아군에게 큰 보호막(마공의 220%).' });
// 감빛 등잔: 등불이 아군에게 닿을 때(0.5초). 천 개의 등불: 먼저 신속(0.5초), 등불이 하늘에 뜨며 보호막(1.1초). 수치는 그대로
X.def('u_lantern', { beats: [0.5], desc: '등잔불을 모든 아군에게 나눈다. 행동 소모 −35% (18초), 보호막(마공의 90%, 15초).' });
X.def('ux_lantern', { beats: [0.5, 1.1],
  eff: [{ t: 'buff', s: 'quick', p: 45, dur: 20 }, { t: 'buff', s: 'shd', m: 1.4, dur: 16, b: 1 }],
  desc: '천 개의 등불을 띄운다. 모든 아군의 행동 소모 −45% (20초), 곧이어 보호막(마공의 140%, 16초).' });
// 해 뜨는 쪽: 해가 뜰 때(0.55초). 해돋이: 한 번(250%) → 먼동 90% + 해돋이 175% (정화와 보호막은 해가 뜰 때)
X.def('u_sunrise', { beats: [0.55], desc: '어둠을 걷고 해가 뜬다. 둘레 2칸 적에게 신성 190% (망자, 악마에게 1.5배). 둘레 2칸 아군의 상태 이상을 풀고 보호막(마공의 80%, 12초).' });
X.def('ux_sunrise', { beats: [0.5, 1.05],
  eff: [holy(0.9), holy(1.75, 1), { t: 'cleanse', to: 'ally', r: 3, b: 1 }, { t: 'buff', s: 'shd', m: 1.2, dur: 14, to: 'ally', r: 3, b: 1 }],
  desc: '먼동이 트고(둘레 2칸 적에게 신성 90%) 해가 솟는다(175%). 망자, 악마에게 1.5배. 둘레 3칸 아군의 상태 이상을 풀고 보호막(마공의 120%, 14초).' });

// ───────── 소리 ─────────
X.sound('mon_lance', function (tone, noise) { tone(1568, 740, 0.12, 'triangle', 0.07); tone(392, 196, 0.14, 'sine', 0.09, 0.02); noise(0.08, 0.1, 1700, 1.2); }, 1.5);      // 빛의 창: 맑게 떨어지는 한 음과 짧은 바람
X.sound('mon_bell', function (tone) { tone(880, 878, 0.32, 'sine', 0.06); tone(1320, 1316, 0.22, 'sine', 0.025); tone(440, 440, 0.26, 'sine', 0.03); }, 1.3);      // 등불의 작은 종
X.sound('mon_swift', function (tone, noise) { tone(660, 990, 0.07, 'triangle', 0.05); tone(880, 1320, 0.07, 'triangle', 0.05, 0.06); tone(1175, 1760, 0.09, 'triangle', 0.04, 0.12); noise(0.2, 0.05, 1400, 0.6); }, 4.3);      // 신속: 빠르게 오르는 세 음
X.sound('mon_judge', function (tone, noise) { [523, 784, 1047].forEach(function (f, i) { tone(f, f, 0.3, 'triangle', 0.05, i * 0.015); }); tone(140, 60, 0.25, 'sine', 0.15); noise(0.18, 0.12, 900, 0.7, 0, 'lowpass'); }, 1.17);      // 심판: 밝은 화음과 낮은 울림
X.sound('mon_dawn', function (tone) { tone(196, 392, 0.45, 'sine', 0.07); tone(294, 588, 0.45, 'sine', 0.045, 0.05); tone(392, 784, 0.4, 'triangle', 0.02, 0.1); }, 1.4);      // 해가 뜬다: 천천히 오르는 화음

// ───────── 그림 조각 ─────────
function pxl() { return DS.VX && DS.VX.pxLine; }
// 자리에 딸린 조각 (zid): 그 자리가 걷히면(쓰는 이가 쓰러지거나 판이 끝나면) 곧 스러진다
function zcut(V, p) { if (p.zid && !p.cut && !(V.skZone && V.skZone[p.zid])) { p.cut = 1; p.dur = Math.min(p.dur, p.t + 0.3); } }
function disc(g, cx, cy, rx, ry, clip) { ry = Math.max(1, Math.round(ry)); cx = Math.round(cx); cy = Math.round(cy); for (var y = -ry; y <= ry; y++) { if (clip != null && cy + y >= clip) break; var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5)))); if (w > 0) g.fillRect(cx - w, cy + y, w * 2, 1); } }
// 등불: 작은 등잔 (s 배율 · hgt 칸 가운데에서 위로 · up 그동안 떠오르는 픽셀 · sway 흔들림). bare 면 틀 없는 불씨만. x1 · y1 이 있으면 그리로 날아간다 (h 포물선)
X.kind('mon_lamp', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  zcut(V, p);
  var s = p.s || 1, a = X.env(f, p.in == null ? 0.12 : p.in, p.out == null ? 0.3 : p.out), x = cx, y = cy, fl = Math.sin(time * 16 + p.sd) > 0 ? 1 : 0;
  if (p.x1 != null) { x = cx + (p.x1 - p.x) * 16 * f; y = cy + (p.y1 - p.y) * 16 * f - (p.h || 0) * 4 * f * (1 - f); a = Math.min(1, f * 8); }
  y -= (p.hgt || 0) + (p.up || 0) * f; x += Math.sin(time * 4 + p.sd) * (p.sway || 0);
  x = Math.round(x); y = Math.round(y); g.globalAlpha = a;
  if (p.bare) {      // 불씨: 호박빛 방울에 흰 심
    g.fillStyle = P.dusk; g.globalAlpha = a * 0.5; g.fillRect(x - 2, y - 1, 5, 4); g.fillRect(x - 1, y - 3, 3, 2);
    g.globalAlpha = a; g.fillStyle = P.amber; g.fillRect(x - 1, y, 3, 2); g.fillRect(x, y - 2 - fl, 1, 2 + fl); g.fillStyle = P.glow; g.fillRect(x, y - 1, 1, 2); g.fillStyle = P.white; g.fillRect(x, y, 1, 1);
    return;
  }
  var w = 5 * s, x0 = x - Math.floor(w / 2);
  g.fillStyle = P.frame; g.fillRect(x0 + 2 * s, y - 5 * s, s, 2 * s); g.fillRect(x0, y - 3 * s, w, s); g.fillRect(x0, y + 2 * s, w, s); g.fillRect(x0 + s, y + 3 * s, 3 * s, s);      // 고리 · 지붕 · 받침
  g.fillStyle = P.deep; g.fillRect(x0, y - 2 * s, w, 4 * s);      // 기둥
  g.fillStyle = p.c || P.lamp; g.fillRect(x0 + s, y - 2 * s, 3 * s, 4 * s);      // 유리 안의 빛
  g.fillStyle = P.white; g.fillRect(x0 + 2 * s, y - s - fl, s, 2 * s + fl);      // 심지 (깜빡인다)
} });
// 빛의 창: 하늘(h 높이 · sx 옆으로 비낀 만큼)에서 대상에게 곧게 꽂힌다. in 꽂히는 데 드는 몫 · hold 그때부터 스러진다 · w 굵기
X.kind('mon_ray', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var L = pxl(); if (!L) return;
  var q = Math.min(1, f / (p.in || 0.25)), hd = p.hold == null ? 0.6 : p.hold, a = f < hd ? 1 : (1 - f) / (1 - hd), x0 = cx + (p.sx || 0), y0 = cy - (p.h || 60), x1 = x0 + (cx - x0) * q, y1 = y0 + (cy - 1 - y0) * q, w = p.w || 2;
  g.globalAlpha = a * 0.45; g.fillStyle = P.deep; L(g, x0 - 1, y0, x1 - 1, y1, w + 2);      // 밝은 땅에서도 읽히게 짙은 테
  g.globalAlpha = a; g.fillStyle = p.c || P.glow; L(g, x0, y0, x1, y1, w);
  g.fillStyle = P.white; L(g, x0 + (w > 2 ? 1 : 0), y0, x1 + (w > 2 ? 1 : 0), y1, 1);
  if (q >= 1) { x1 = Math.round(x1); y1 = Math.round(y1); g.fillStyle = p.c || P.glow; g.fillRect(x1 - 3, y1, 7 + (w > 2 ? 1 : 0), 1); g.fillRect(x1, y1 - 2, w, 5); g.fillStyle = P.white; g.fillRect(x1 - 1, y1 - 1, 3, 3); }      // 창끝
} });
// 빛의 고리: r 반지름의 납작한 고리가 hgt 높이에 뜬다 (h0 → h1 이면 fall 몫 동안 내려앉는다). 뒤쪽 반은 옅게
X.kind('mon_halo', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var r = p.r || 5, hg = p.h0 != null ? p.h0 + (p.h1 - p.h0) * X.ease(Math.min(1, f / (p.fall || 0.8))) : (p.hgt || 0), y = cy + 5 - hg, a = X.env(f, 0.1, 0.3), n = Math.max(16, Math.round(r * (r >= 12 ? 2.6 : 3.6))), w = r >= 12 ? 2 : 1, j, k, sq = r >= 12 ? 0.45 : 0.4;
  for (j = 0; j < n; j++) {
    k = j / n * 6.2832 + time * (p.spin || 0.7);
    g.globalAlpha = a * (r >= 12 ? 0.45 : 0.8); g.fillStyle = r >= 12 ? P.dusk : P.deep; g.fillRect(Math.round(cx + Math.cos(k) * r - w / 2), Math.round(y + 1 + Math.sin(k) * r * sq - w / 2), w, w);
    g.globalAlpha = a * (Math.sin(k) < 0 ? 0.6 : 1); g.fillStyle = p.c || (r >= 12 ? P.lamp : P.glow); g.fillRect(Math.round(cx + Math.cos(k) * r - w / 2), Math.round(y + Math.sin(k) * r * sq - w / 2), w, w);
  }
  g.globalAlpha = a; g.fillStyle = p.c2 || P.white;
  for (j = 0; j < (r >= 12 ? 4 : 2); j++) { k = time * 2.4 + j * 6.2832 / (r >= 12 ? 4 : 2); g.fillRect(Math.round(cx + Math.cos(k) * r) - (w > 1 ? 1 : 0), Math.round(y + Math.sin(k) * r * sq) - (w > 1 ? 1 : 0), w + (w > 1 ? 1 : 0), w + (w > 1 ? 1 : 0)); }
} });
// 해: r 반지름의 둥근 해와 햇살 (rays 갈래 · ray 길이). hgt 높이 (h0 → h1 이면 그동안 움직인다). flat = 땅에 내려앉은 해 (납작하게, 유닛 밑에 그린다 — L: 0 과 함께). half = 땅금(칸 발치) 아래는 가린다 (떠오르는 해)
X.kind('mon_sun', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  zcut(V, p);
  var L = pxl(), r = p.r || 8, hg = p.h0 != null ? p.h0 + (p.h1 - p.h0) * X.ease(Math.min(1, f / (p.fall || 1))) : (p.hgt || 0), sq = p.flat ? 0.5 : 1, y = cy + (p.flat ? 5 : p.half ? 6 : 0) - hg, a = X.env(f, p.in == null ? 0.1 : p.in, p.out == null ? 0.25 : p.out) * (p.a || 1), clip = p.half ? cy + 7 : null, n = p.rays || 8, j, k, r0, r1, ry = p.ray || 6;
  if (L) for (j = 0; j < n; j++) {
    k = j / n * 6.2832 + time * (p.spin == null ? 0.5 : p.spin); if (p.half && Math.sin(k) > 0.05) continue;
    r0 = r + 2; r1 = r + 2 + (j % 2 ? ry * 0.55 : ry) * (0.85 + 0.15 * Math.sin(time * 6 + j));
    g.globalAlpha = a * (p.flat ? 0.75 : 0.9); g.fillStyle = j % 2 ? P.lamp : P.amber;
    L(g, cx + Math.cos(k) * r0, y + Math.sin(k) * r0 * sq, cx + Math.cos(k) * r1, y + Math.sin(k) * r1 * sq, p.rw || 1);
  }
  g.globalAlpha = a; g.fillStyle = P.amber; disc(g, cx, y, r, r * sq, clip);
  g.fillStyle = P.lamp; disc(g, cx, y, r - 1, (r - 1) * sq, clip);
  if (r > 4) { g.fillStyle = P.pale; disc(g, cx - 1, y - (p.flat ? 0 : 1), r - 3, (r - 3) * sq, clip); }
} });
// 빛의 날개: 대상의 양옆에서 깃 셋이 펴졌다 접힌다 (flaps 번 친다)
X.kind('mon_wing', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var L = pxl(); if (!L) return;
  var a = X.env(f, 0.1, 0.35), fl = Math.sin(f * 3.1416 * (p.flaps || 2) * 2), s = p.s || 1, sd, k, ang, len, x0, y0, x1, y1;
  for (sd = -1; sd <= 1; sd += 2) for (k = 0; k < 3; k++) {
    ang = -0.25 - k * 0.42 - fl * 0.22; len = (9 - k * 2) * s; x0 = cx + sd * 4; y0 = cy - 2 - (p.hgt || 0); x1 = x0 + sd * Math.cos(ang) * len; y1 = y0 + Math.sin(ang) * len;
    g.globalAlpha = a * 0.45; g.fillStyle = P.deep; L(g, x0, y0 + 1, x1, y1 + 1, 1);
    g.globalAlpha = a; g.fillStyle = k ? (p.c || P.glow) : P.white; L(g, x0, y0, x1, y1, 1);
    g.fillStyle = P.white; g.fillRect(Math.round(x1), Math.round(y1), 1, 1);
  }
} });
// 십자로 터지는 빛: len 팔 길이 · w 굵기 · hgt 높이
X.kind('mon_cross', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var Ln = Math.round((p.len || 14) * (0.4 + 0.6 * Math.min(1, f * 6))), w = Math.max(1, Math.round((p.w || 3) * (1 - f * 0.8))), a = f < 0.4 ? 1 : (1 - f) / 0.6, x = Math.round(cx), y = Math.round(cy - (p.hgt || 4)), h2 = w >> 1;
  g.globalAlpha = a * 0.4; g.fillStyle = P.deep; g.fillRect(x - h2 - 1, y - Math.round(Ln * 1.4) - 1, w + 2, Math.round(Ln * 2.2) + 2); g.fillRect(x - Ln - 1, y - h2 - 1, Ln * 2 + 2, w + 2);
  g.globalAlpha = a; g.fillStyle = p.c || P.glow; g.fillRect(x - h2, y - Math.round(Ln * 1.4), w, Math.round(Ln * 2.2)); g.fillRect(x - Ln, y - h2, Ln * 2, w);
  g.fillStyle = P.white; g.fillRect(x, y - Ln, 1, Math.round(Ln * 1.7)); g.fillRect(x - Ln + 2, y, Ln * 2 - 4, 1); g.fillRect(x - 2, y - 2, 5, 5);
} });

// ───────── 연출 ─────────
function hand(c) { return [c.ux + (c.u.face < 0 ? -0.3 : 0.3), c.uy - 0.5]; }
// 등불이 지킨 이: 방금 이 기술의 ward 가 걸린 우리 편 (보호막의 남은 시간이 갓 건 것 · 가장 다친 이). 'mend' 사건은 제 연출로 오지 않아 화면의 유닛에서 읽는다
function warded(c, dur) {
  var V = c.V, id, w, b, best = null, lo = 9, me = c.u.side, rt; dur = dur || 12;
  for (id in V.vu) {
    w = V.vu[id]; if (!w.u || w.u.dead || w.dying >= 0 || w.u.side !== me || !w.u.buffs) continue;
    b = w.u.buffs.shd; if (!b || b.t < dur - 0.3 || b.t > dur + 0.001 || !V.onScreen(w.x, w.y)) continue;
    rt = w.u.hp / (w.u.mhp || 1); if (rt < lo) { lo = rt; best = w; }
  }
  return best;
}
// 친 자리의 빛이 그 아군에게 건너가 작은 등불과 지붕이 된다
function wardTo(c, fx, fy, big) {
  var w = warded(c, 12), x, y; if (!w) return;
  x = w.x; y = w.y;
  c.fx('orb', { x: fx, y: fy - 0.3, x1: x, y1: y - 0.4, h: 6, head: 'star', s: 2, c: P.glow, c2: P.amber, dur: 0.2, tr: 3 });
  c.at(0.2, function () { c.fx('mon_lamp', { x: x, y: y, hgt: 15, bare: !big, up: 3, dur: 0.8 }); c.fx('dome', { x: x, y: y, r: big ? 10 : 8, c: P.lamp, dur: 0.7 }); c.burst(x, y - 0.3, LAMP, big ? 5 : 3, { up: 20, grav: -14, spd: 5, life: 0.5 }); });
}
function rose(c, t) { c.fx('sigil', { x: c.cx, y: c.cy, r: 31, c: P.lamp, c2: P.white, sides: 8, skip: 3, dur: t + 0.25, spin: 0.25 }); }      // 성역의 땅무늬: 여덟 갈래 빛
function motes(c, x, y, cols, n) { c.burst(x, y - 0.2, cols, n, { up: 22, grav: -16, spd: 5, life: 0.6 }); }

// T1 ── 축복의 구령 (호령): 등불을 들어 종을 울린다. 아군 머리 위에 작은 불씨가 하나씩 켜진다
X.reg('cmd_mon', { cast: function (c) {
  var n = 0;
  c.castPose(P.lamp).pose('rise', 0.4, 2).sfx('mon_bell');
  c.fx('mon_lamp', { x: c.ux, y: c.uy, hgt: 18, sway: 1.5, dur: 0.7 }); c.ring(c.ux, c.uy, 13, P.lamp, { dur: 0.4 });
  c.each(function (x, y, i) { if (n >= 6 || Math.abs(x - c.ux) + Math.abs(y - c.uy) < 0.5) return; n++; c.fx('mon_lamp', { x: x, y: y, hgt: 14, bare: 1, up: 4, d: 0.06 + n * 0.03, dur: 0.6 }); c.burst(x, y - 0.4, LAMP, 2, { up: 22, grav: -16, spd: 5, life: 0.5 }); }, 9);
} });
// T1 ── 등불 치기: 등불을 내밀면 — 하늘에서 빛의 창이 비껴 꽂힌다. 그 빛 한 점이 다친 아군에게 건너가 작은 지붕이 된다
X.reg('mon_smite', {
  cast: function (c) { var h = hand(c); c.castPose(P.lamp).pose('rise', 0.3, 1.5); c.fx('mon_lamp', { x: h[0], y: h[1], hgt: 5, sway: 2, dur: 0.4 }); },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('mon_ray', { x: x, y: y, h: 64, sx: c.u.face < 0 ? 18 : -18, w: 2, dur: 0.26 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 7 }).ring(x, y, 9, P.lamp, { dur: 0.28 });
    c.burst(x, y, HOLY, 7, { spd: 32, up: 10, life: 0.25 }).light(x, y, 16, P.glow, 0.4, 0.25).boom('mon_lance');
    wardTo(c, x, y, false);
  } });
// T1 ── 등불 가호: 등불이 아군에게 날아가 머리 위에 걸리고, 둥근 지붕이 덮인다 (흰 고리가 조여 들며 상태 이상을 푼다)
X.reg('mon_ward', {
  cast: function (c) { var h = hand(c); c.castPose(P.lamp); c.fx('mon_lamp', { x: h[0], y: h[1] - 0.2, x1: c.cx, y1: c.cy - 1.38, h: 5, dur: 0.15 }); },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('mon_lamp', { x: x, y: y, hgt: 22, sway: 1, in: 0.01, dur: 1.0 }); c.fx('dome', { x: x, y: y, r: 10, c: P.lamp, c2: P.white, dur: 0.9 });
    c.ring(x, y, 11, P.white, { inv: true, dur: 0.3 }).ring(x, y, 10, P.lamp, { rise: true, dur: 0.5, d: 0.1 });
    c.burst(x, y, LAMP, 8, { up: 24, grav: -18, spd: 7, life: 0.6 }).light(x, y, 16, P.glow, 0.4, 0.5).boom('ward');
  } });
// T2 ── 신속: 빛 한 점이 날아가 — 양옆에 빛의 날개가 두 번 치고, 발밑을 빛줄기가 감아 돈다
X.reg('mon_haste', {
  cast: function (c) { var h = hand(c); c.castPose(P.glow); c.fx('orb', { x: h[0], y: h[1], x1: c.cx, y1: c.cy - 0.3, h: 3, head: 'star', s: 3, c: P.glow, c2: P.amber, dur: 0.1, tr: 3 }); },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('mon_wing', { x: x, y: y, flaps: 2, dur: 0.75 });
    c.fx('arc', { x: x, y: y + 0.2, r: 9, a0: 0, sw: 6.6, c: P.glow, w: 1, dur: 0.3 }); c.fx('arc', { x: x, y: y + 0.2, r: 12, a0: 3.14, sw: 6.6, c: P.lamp, w: 1, dur: 0.34, d: 0.14 });
    c.ring(x, y, 10, P.glow, { rise: true, dur: 0.4 }).ring(x, y, 10, P.white, { rise: true, dur: 0.4, d: 0.16 });
    c.spray(x, y + 0.3, LAMP, 12, -1.5708, 0.3, { spd: 58, grav: -10, life: 0.35, spread: 10 });
    c.light(x, y, 18, P.glow, 0.45, 0.4).boom('mon_swift');
  } });
// T2 ── 성역: 무릎을 꿇으면 땅에 여덟 갈래 빛무늬가 번지고 둥근 지붕이 덮인다. 성역이 다할 때까지 가운데 위에 등불이 걸려 있고, 맥박마다 빛이 번진다
X.reg('mon_sanct', {
  cast: function (c) {
    var x = c.ux, y = c.uy;
    c.pose('sink', 0.5, 3).castPose(P.lamp).sfx('mon_bell');
    c.ring(x, y, 30, P.lamp, { w: 2, dur: 0.4 });
    c.at(0.15, function () {
      c.fx('dome', { x: x, y: y, r: 33, c: P.lamp, c2: P.white, dur: 1.0 }); c.fx('shock', { x: x, y: y, r: 34, c: P.lamp, c2: P.white, w: 1, thin: 1, dur: 0.5 });
      c.who(true, function (ax, ay) { c.ring(ax, ay, 9, P.mint, { rise: true, dur: 0.5 }); motes(c, ax, ay, MEND, 3); }, 6);
      c.light(x, y, 22, P.glow, 0.45, 0.8).boom('ward');
    });
  },
  zone: function (c, e) { rose(c, c.S.zone.first || c.S.zone.every); c.fx('mon_lamp', { x: c.cx, y: c.cy, hgt: 25, sway: 1, out: 0.06, zid: e.zid, dur: e.dur }); },      // 성역이 서 있는 동안: 땅의 빛무늬(유닛 밑)와 가운데 위의 등불
  zoneTick: function (c) {
    var Z = c.S.zone, left = Z.dur - c.i * Z.every;
    if (left > 0.3) rose(c, Math.min(Z.every, left));      // 빛무늬는 맥박마다 다시 그린다 (자리가 걷히면 다음 맥박에 이어지지 않는다)
    c.fx('shock', { x: c.cx, y: c.cy, r: 32, c: P.lamp, w: 1, thin: 1, dur: 0.6 });
    c.hits(function (x, y) { c.ring(x, y, 8, P.mint, { rise: true, dur: 0.45 }); motes(c, x, y, MEND, 2); }, 6);
    c.sfx('mon_bell');
  },
  zoneEnd: function (c) { c.burst(c.cx, c.cy - 1.5, LAMP, 5, { spd: 14, grav: 20, life: 0.4 }); } });
// T3 ── 성등 치기: 등불을 높이 들면 굵은 빛의 창이 꽂혀 박히고 — 한 박자 뒤 그 빛이 십자로 터진다 (땅에 달아오른 금)
X.reg('xmon_smite', {
  cast: function (c) { c.castPose(P.lamp).pose('rise', 0.5, 2.5).ghost(0, 0, P.lamp, 0.4, 0.35); c.fx('mon_lamp', { x: c.ux, y: c.uy, hgt: 20, s: 2, sway: 1, dur: 0.75 }); },
  beat: function (c, i) {
    var x = c.cx, y = c.cy;
    if (i === 0) {
      c.fx('mon_ray', { x: x, y: y, h: 76, sx: c.u.face < 0 ? 22 : -22, w: 3, in: 0.14, hold: 0.8, dur: 0.5 });
      c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 8 }).ring(x, y, 10, P.lamp, { dur: 0.3 });
      c.burst(x, y, HOLY, 7, { spd: 34, up: 10, life: 0.25 }).light(x, y, 20, P.glow, 0.5, 0.4).shake(0.08).sfx('mon_lance');
      return;
    }
    c.fx('mon_cross', { x: x, y: y, len: 17, w: 5, hgt: 4, dur: 0.45 }); c.fx('column', { x: x, y: y, w: 4, h: 60, c: P.lamp, c2: P.white, a: 0.55, dur: 0.3 });
    c.fx('shock', { x: x, y: y, r: 24, c: P.lamp, c2: P.white, w: 2, dur: 0.4 }); c.fx('crack', { x: x, y: y, r: 12, n: 6, c: P.glow, dur: 2.2 });
    c.burst(x, y, HOLY, 16, { spd: 56, life: 0.3 }).spray(x, y, WARM, 8, -1.5708, 1.0, { spd: 40, grav: 60, life: 0.45 });
    c.light(x, y, 28, P.glow, 0.6, 0.35).flash(P.glow, 0.06).wash(P.lamp, 0.04, 0.5).shake(0.2).stop(0.05).boom('mon_judge');
    wardTo(c, x, y, true);
  } });
// T3 ── 빛의 고리: 큰 고리가 하늘에서 내려앉으며 아군을 씻고 고친다 — 곧이어 저마다의 머리 위에 작은 고리가 떠 보호막이 된다
X.reg('xmon_halo', {
  cast: function (c) {
    c.castPose(P.lamp).pose('rise', 0.8, 2.5).ghost(0, 0, P.lamp, 0.4, 0.35).sfx('mon_bell');
    c.fx('mon_halo', { x: c.ux, y: c.uy, r: 34, h0: 78, h1: 0, fall: 0.44, spin: 1.2, dur: 0.8 });
  },
  beat: function (c, i) {
    var x = c.ux, y = c.uy;
    if (i === 0) {
      c.fx('shock', { x: x, y: y, r: 36, c: P.lamp, c2: P.white, w: 1, thin: 1, dur: 0.5 });
      c.hits(function (ax, ay) { c.ring(ax, ay, 10, P.white, { inv: true, dur: 0.3 }); motes(c, ax, ay, MEND, 3); }, 6);
      c.light(x, y, 26, P.glow, 0.5, 0.5).wash(P.lamp, 0.04, 0.6).sfx('heal');
      return;
    }
    c.hits(function (ax, ay, k) { c.fx('mon_halo', { x: ax, y: ay, r: 5, hgt: 21, d: k * 0.03, dur: 1.1 }); motes(c, ax, ay, LAMP, 2); }, 6);
    c.ring(x, y, 36, P.lamp, { rise: true, w: 2, dur: 0.6 }).light(x, y, 28, P.glow, 0.5, 0.5).flash(P.glow, 0.04).boom('ward');
  } });
// T3 ── 태양 강림: 해가 하늘에서 천천히 내려와 — 땅에 내려앉는다. 3초 동안 땅 위에서 햇살이 돌며 그 위의 적을 지진다
X.reg('xmon_sun', {
  cast: function (c) { c.castPose(P.amber).pose('rise', 0.6, 2.5).ghost(0, 0, P.lamp, 0.4, 0.35).sfx('mon_dawn'); c.fx('mon_lamp', { x: c.ux, y: c.uy, hgt: 20, s: 2, dur: 0.7 }); },
  mark: function (c, e) {
    var x = c.cx, y = c.cy, T = e.dur;
    c.fx('sigil', { x: x, y: y, r: 34, c: P.lamp, c2: P.white, sides: 8, skip: 3, dur: T + 0.15, spin: 1.2 });
    c.fx('mon_sun', { x: x, y: y, r: 8, h0: 118, h1: 4, fall: 1, rays: 8, ray: 6, in: 0.2, out: 0.02, dur: T });
  },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('shock', { x: x, y: y, r: 38, c: P.lamp, c2: P.white, w: 3, dur: 0.45 }); c.fx('shock', { x: x, y: y, r: 47, c: P.white, w: 1, thin: 1, dur: 0.55, d: 0.1 });
    c.fx('column', { x: x, y: y, w: 8, h: 84, c: P.lamp, c2: P.white, a: 0.55, dur: 0.35 });
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.white, r: 8 }); c.burst(hx, hy, HOLY, 3, { spd: 36, life: 0.3 }); }, 6);
    c.burst(x, y, WARM, 14, { spd: 60, up: 10, life: 0.4, spread: 20 });
    c.light(x, y, 28, P.glow, 0.6, 0.6).flash(P.glow, 0.06).wash(P.lamp, 0.05, 0.7).shake(0.2).stop(0.05).boom('mon_judge');
    wardTo(c, x, y, true);
  },
  zone: function (c, e) { c.fx('mon_sun', { x: c.cx, y: c.cy, L: 0, flat: 1, r: 13, rays: 12, ray: 22, rw: 2, spin: 0.6, in: 0.02, out: 0.12, a: 0.9, zid: e.zid, dur: e.dur + 0.2 }); },      // 땅에 내려앉은 해 (유닛 밑) — 자리가 서 있는 동안
  zoneTick: function (c) {
    c.fx('shock', { x: c.cx, y: c.cy, r: 34, c: P.lamp, w: 1, thin: 1, dur: 0.5 });
    c.hits(function (x, y) { c.fx('column', { x: x, y: y, w: 2, h: 24, c: P.lamp, c2: P.white, a: 0.5, dur: 0.25 }); c.burst(x, y, WARM, 2, { up: 20, grav: -10, spd: 8, life: 0.35 }); }, 6);
    c.sfx('holy');
  },
  zoneEnd: function (c) { c.ring(c.cx, c.cy, 30, P.lamp, { inv: true, dur: 0.4 }); c.burst(c.cx, c.cy, WARM, 8, { up: 26, grav: -14, spd: 16, life: 0.5, spread: 20 }); } });
// T4 ── 등잔불 춤: 등불을 들고 세 걸음 — 걸음마다 등불이 호를 그리고, 불길이 줄을 따라 번진다. 끝 걸음에 제자리에서 돌며 불기둥이 줄지어 선다
// T5 ── 성화의 춤: 네 걸음, 줄이 길다. 끝 걸음에 빛줄기가 줄을 가르고 불티가 남아 떠오른다
function danceUp(c, grand) {
  var T = c.S.beats[c.S.beats.length - 1];
  c.dim(grand ? 1.8 : 1.3).castPose(P.ember).sfx('mon_bell');
  c.fx('mon_lamp', { x: c.ux, y: c.uy, hgt: 20, s: 2, sway: 3, c: P.ember, dur: T + 0.3 });
  c.fx('sigil', { x: c.ux, y: c.uy, r: 12, c: P.ember, c2: P.pale, sides: 0, runes: 4, dur: T + 0.2, spin: 2.4 });
  if (grand) c.wash(P.amber, 0.05, T + 0.3);
}
function dance(c, i, last, grand) {
  var px = -c.dy, py = c.dx, sg = i % 2 ? -1 : 1, x = c.ux, y = c.uy, T = c.tiles, far = T.length ? T[T.length - 1] : [c.cx, c.cy], col = last ? P.white : i % 2 ? P.glow : P.ember;
  c.ghost(px * sg * 0.35, py * sg * 0.35, P.ember, 0.3, 0.4);      // 춤의 걸음: 옆으로 비낀 잔상
  c.pose(last ? 'spin' : 'hop', last ? 0.4 : 0.25, last ? 2 : 4);
  c.fx('arc', { x: x + c.dx * 0.5, y: y + c.dy * 0.5, r: 13 + i * 3, a0: c.ang - sg * (last ? 3.1 : 1.6), sw: sg * (last ? 6.6 : 3.2), c: col, c2: P.amber, w: last ? 3 : 2, dur: 0.28 });      // 등불이 그리는 호
  c.each(function (tx, ty, k) { c.shape({ k: 'flame', x: tx, y: ty, dur: last ? 0.6 : 0.4, d: k * 0.04 }); }, last ? 4 : 3);      // 불길이 줄을 따라 번진다
  c.hits(function (hx, hy) { c.burst(hx, hy, WARM, last ? 4 : 2, { up: 26, grav: -10, spd: 14, life: 0.4 }); }, 6);
  c.light(x + c.dx, y + c.dy, last ? 36 : 22, P.ember, last ? 0.7 : 0.45, 0.3);
  if (!last) { c.shake(0.1 + i * 0.04).sfx('fire'); return; }
  c.fx('beam', { x0: x, y0: y, x1: far[0], y1: far[1], w: grand ? 5 : 4, c: P.ember, c2: P.pale, dur: 0.38 });
  c.each(function (tx, ty, k) { c.fx('column', { x: tx, y: ty, w: 3, h: 28 + k * 5, c: P.ember, c2: P.pale, a: 0.6, d: k * 0.04, dur: 0.36 }); }, grand ? 5 : 3);
  c.fx('shock', { x: far[0], y: far[1], r: grand ? 30 : 24, c: P.ember, c2: P.pale, w: 3, dur: 0.45 });
  c.fx('stain', { x: (x + far[0]) / 2, y: (y + far[1]) / 2, r: 16, c: P.ash, a: 0.3, c2: P.ember, n: 8, dur: 3 });
  c.burst(far[0], far[1], WARM, 14, { spd: 60, up: 12, life: 0.45 });
  c.streak(grand ? 10 : 6, c.ang, P.ember, 0.5, 0.25);
  c.flash(P.glow, grand ? 0.1 : 0.08).wash(P.amber, grand ? 0.1 : 0.07, grand ? 1.0 : 0.7).shake(grand ? 0.42 : 0.28).stop(grand ? 0.08 : 0.06).boom('fireRoar');
  wardTo(c, far[0], far[1], true);
  if (grand) { c.fx('shock', { x: far[0], y: far[1], r: 46, c: P.white, w: 1, thin: 1, dur: 0.65, d: 0.12 }); c.fx('emit', { x: (x + far[0]) / 2, y: (y + far[1]) / 2, sp: 4, rate: 14, n: 1, dur: 1.2, cols: WARM, o: { up: 26, grav: -12, spd: 5, life: 0.9 } }); }
}
X.reg('u_lampdance', { cast: function (c) { danceUp(c, false); }, beat: function (c, i, last) { dance(c, i, last, false); } });
X.reg('ux_lampdance', { cast: function (c) { danceUp(c, true); }, beat: function (c, i, last) { dance(c, i, last, true); } });
// T4 ── 감빛 등잔: 높이 든 등잔에서 등불이 하나씩 아군에게 날아가 — 머리 위에 걸려 천천히 떠오르고 지붕이 덮인다
// T5 ── 천 개의 등불: 먼저 등불이 닿고(신속), 한 박자 뒤 온 들판에서 등불이 하늘로 떠오르며 보호막이 된다
function lanternUp(c, grand) {
  var T = c.S.beats[0], n = 0;
  c.dim(grand ? 1.6 : 1.1).castPose(P.lamp).pose('rise', grand ? 1.2 : 0.7, 3).ghost(0, 0, P.lamp, 0.5, 0.4).sfx('mon_bell');
  c.fx('mon_lamp', { x: c.ux, y: c.uy, hgt: 22, s: 2, sway: 1, dur: grand ? 1.6 : 1.0 }); c.fx('sigil', { x: c.ux, y: c.uy, r: 13, c: P.lamp, c2: P.white, sides: 0, runes: 6, dur: grand ? 1.5 : 0.9 });
  c.each(function (x, y) { if (n >= 6 || Math.abs(x - c.ux) + Math.abs(y - c.uy) < 0.5) return; var d = 0.1 + n * 0.04; n++; c.fx('mon_lamp', { x: c.ux, y: c.uy - 1.4, x1: x, y1: y - 1.38, h: 7, d: d, dur: Math.max(0.1, T - d) }); }, 12);
}
function lanterns(c, i, last, grand) {
  var x = c.ux, y = c.uy, k, n = 0;
  if (i === 0) {
    c.hits(function (ax, ay) { c.fx('mon_lamp', { x: ax, y: ay, hgt: 22, up: 9, sway: 1, in: 0.01, dur: grand ? 1.5 : 1.3 }); motes(c, ax, ay, LAMP, 3); n++; }, 6);
    c.fx('shock', { x: x, y: y, r: 30, c: P.lamp, c2: P.white, w: 1, thin: 1, dur: 0.5 }); c.light(x, y, 30, P.glow, 0.6, 0.6);
    if (grand) { c.wash(P.lamp, 0.06, 0.8).sfx('ward'); return; }
  }
  c.hits(function (ax, ay) { c.fx('dome', { x: ax, y: ay, r: 9, c: P.lamp, c2: P.white, dur: 0.9 }); if (grand) motes(c, ax, ay, LAMP, 2); }, 6);
  c.flash(P.glow, grand ? 0.08 : 0.06).wash(P.lamp, grand ? 0.1 : 0.07, grand ? 1.6 : 1.0).boom('ward');
  if (!grand) return;
  for (k = 0; k < 12; k++) c.fx('mon_lamp', { x: x + (X.hs(k, 3) - 0.5) * 10, y: y + (X.hs(k, 7) - 0.5) * 6 + 1, hgt: 2, up: 44 + X.hs(k, 5) * 16, sway: 2, s: k % 5 === 0 ? 2 : 1, c: k % 3 ? P.lamp : P.ember, d: k * 0.05, in: 0.08, out: 0.35, dur: 2.2 });      // 하늘로 떠오르는 등불들
  c.fx('shock', { x: x, y: y, r: 44, c: P.lamp, c2: P.white, w: 2, thin: 1, dur: 0.7 }); c.fx('shock', { x: x, y: y, r: 60, c: P.white, w: 1, thin: 1, dur: 0.9, d: 0.15 });
  c.fx('emit', { x: x, y: y - 0.5, sp: 5, rate: 12, n: 1, dur: 1.4, cols: LAMP, o: { up: 24, grav: -12, spd: 4, life: 1.0 } });
  c.light(x, y, 44, P.glow, 0.7, 1.0).sfx('mon_dawn');
}
X.reg('u_lantern', { cast: function (c) { lanternUp(c, false); }, beat: function (c, i, last) { lanterns(c, i, last, false); } });
X.reg('ux_lantern', { cast: function (c) { lanternUp(c, true); }, beat: function (c, i, last) { lanterns(c, i, last, true); } });
// T4 ── 해 뜨는 쪽: 어둠이 내린 뒤 — 발밑 땅금에서 해가 반쯤 떠오르고, 햇살이 여덟 갈래로 뻗어 적을 친다. 아군에게는 지붕
// T5 ── 해돋이: 먼동의 고리가 먼저 번지고(첫 박자), 해가 하늘로 솟는다. 햇살이 더 길고, 땅에 햇빛이 남는다
function dawnUp(c, grand) {
  var T = c.S.beats[c.S.beats.length - 1], r = grand ? 15 : 13;
  c.dim(grand ? 1.6 : 1.1).wash(P.night, grand ? 0.1 : 0.08, T + 0.1).castPose(P.amber).pose('rise', T + 0.2, 3).ghost(0, 0, P.amber, 0.5, 0.4).sfx('mon_dawn');
  c.fx('mon_sun', { x: c.ux, y: c.uy, L: 0, half: 1, r: r, h0: -r, h1: 4, fall: 0.85, rays: 10, ray: 8, spin: 0.3, in: 0.05, out: 0.2, dur: T + 0.35 });      // 땅금 위로 떠오르는 해 (쓰는 이 뒤 · 유닛 밑)
  c.fx('beam', { x0: c.ux - 2.3, y0: c.uy + 0.05, x1: c.ux + 2.3, y1: c.uy + 0.05, w: 2, c: P.amber, c2: P.pale, dur: T + 0.1 });      // 땅금
}
function dawn(c, i, last, grand) {
  var x = c.ux, y = c.uy, k, a, len = grand ? 3.1 : 2.3;
  if (!last) {      // 먼동
    c.fx('shock', { x: x, y: y, r: 36, c: P.rose, c2: P.pale, w: 2, dur: 0.45 });
    c.hits(function (hx, hy) { c.ring(hx, hy, 8, P.rose, { dur: 0.3 }); c.burst(hx, hy, [P.rose, P.pale], 2, { spd: 26, life: 0.3 }); }, 5);
    c.light(x, y, 30, P.rose, 0.5, 0.4).shake(0.12).sfx('holy');
    return;
  }
  for (k = 0; k < 8; k++) { a = k / 8 * 6.2832 + 0.39; c.fx('beam', { x0: x + Math.cos(a) * 0.5, y0: y + Math.sin(a) * 0.3, x1: x + Math.cos(a) * len, y1: y + Math.sin(a) * len * 0.62, w: 3, c: P.lamp, c2: P.white, d: k * 0.012, dur: 0.42 }); }      // 햇살
  c.fx('shock', { x: x, y: y, r: 40, c: P.lamp, c2: P.white, w: 3, dur: 0.5 }); c.fx('shock', { x: x, y: y, r: grand ? 58 : 50, c: P.white, w: 1, thin: 1, dur: 0.6, d: 0.1 });
  c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.26, c: P.white, r: 9 }); c.burst(hx, hy, HOLY, 4, { spd: 40, life: 0.3 }); }, 5);
  c.who(true, function (ax, ay) { if (Math.abs(ax - x) + Math.abs(ay - y) < 0.5) return; c.fx('dome', { x: ax, y: ay, r: 9, c: P.lamp, c2: P.white, dur: 0.9 }); motes(c, ax, ay, LAMP, 2); }, 4);
  c.fx('column', { x: x, y: y, w: grand ? 9 : 7, h: 92, c: P.lamp, c2: P.white, a: 0.5, dur: 0.4 });
  c.burst(x, y, WARM, grand ? 24 : 18, { up: 34, grav: -20, spd: 22, life: 0.7, spread: 30 });
  c.streak(grand ? 10 : 6, -1.5708, P.pale, 0.6, 0.25);
  c.light(x, y, 44, P.glow, 0.8, 0.7).flash(P.pale, grand ? 0.1 : 0.08).wash(P.lamp, grand ? 0.1 : 0.08, grand ? 1.4 : 1.0).shake(grand ? 0.4 : 0.28).stop(grand ? 0.08 : 0.07).boom('mon_judge');
  if (grand) {
    c.fx('mon_sun', { x: x, y: y, r: 11, h0: 12, h1: 50, fall: 1, rays: 12, ray: 9, in: 0.08, out: 0.4, a: 0.95, dur: 0.95 });      // 해가 하늘로 솟는다
    c.fx('stain', { x: x, y: y, r: 36, c: P.lamp, a: 0.16, c2: P.white, n: 12, dur: 3.2 });
    c.fx('emit', { x: x, y: y, sp: 4.5, rate: 12, n: 1, dur: 1.3, cols: LAMP, o: { up: 24, grav: -12, spd: 4, life: 0.9 } });
  }
}
X.reg('u_sunrise', { cast: function (c) { dawnUp(c, false); }, beat: function (c, i, last) { dawn(c, i, last, false); } });
X.reg('ux_sunrise', { cast: function (c) { dawnUp(c, true); }, beat: function (c, i, last) { dawn(c, i, last, true); } });
})();
