// 전민 — 기술 연출: 사교 (생기를 뽑는 실 · 땅에서 일어나는 망자 · 찍히는 낙인 · 번지고 남는 역병 · 셋을 세는 죽음 · 달과 장막). 틀과 쓰는 법은 src/skfx.js · docs/SKILL_FX.md.
//   이 파일이 맡는 기술: cmd_sha · sha_drain · sha_raise (T1) · sha_hex · sha_plague (T2) · xsha_drain · xsha_legion · xsha_doom (T3) · u_newmoon · u_violet · u_supper (T4) · ux_* 셋 (T5)
//   기술 표(효과 · 박자 · 설명)의 고침도 여기서 한다 (X.def) — data.js · rise.js 의 줄은 그대로 둔다.
//
//   빛깔 (X.PAL.sha): 자줏빛 #b181e6 · 짙은 보라 #7446ad · 먹빛 #2b2440 · #1a1030 · 옅은 라일락 #e0c8ff (어두운 땅에서 읽히는 테) · 뼈 #efe6d0 · #b8ad98 · 병든 풀빛 #b6ff5a · #7ab83a · 생기 #d6ff8a · 피 #d8324a · #ff6a9a
//   약속: 어두운 몸에는 늘 밝은 테(라일락 · 뼈 · 풀빛)를, 밝은 조각에는 먹빛 밑그림을 두어 밝은 땅 · 어두운 땅 모두에서 읽힌다. 기술마다 실루엣이 다르다 — 실 · 낙인 · 무덤과 손 · 안개와 날벌레 · 숫자 · 달 · 드리운 장막 · 식탁.
//   새 그림 조각: sha_thread(생기의 실) · sha_brand(낙인) · sha_grave(무덤과 뼈 손) · sha_skull(해골 얼굴) · sha_moon(그믐달 · 가려진 달) · sha_veil(드리운 장막) · sha_count(세는 숫자) · sha_fog(역병 안개와 날벌레)
//   새 소리: sha_sip · sha_pact · sha_grave · sha_brand · sha_fog · sha_toll · sha_soul · sha_doom
//
//   고친 것 (옛 → 새 | 허수아비 / 싸움판 피해 비 — tools/skdmg.js, 새 ÷ 옛):
//   sha_drain · sha_raise · sha_hex   수치 그대로. 실이 닿을 때(0.15초) · 무덤이 열릴 때(0.2초) · 낙인이 찍힐 때(0.2초) | 1.00 / 1.00
//   sha_plague    140% + 중독 12초  →  터질 때 85% + 중독, 안개가 4초 남아 2초마다 38%. 걷힐 때 안에 있는 적은 다시 중독 (뒤늦게 들어선 적도 걸린다) | 1.02 / 1.00
//   xsha_drain    200% 한 번  →  세 번에 걸쳐 70% + 70% + 80% (뽑을 때마다 나눈다) | 1.03 / 1.01
//   xsha_legion   수치 그대로, 땅이 갈라질 때(0.45초)
//   xsha_doom     180% + 중독 + 방어 −25%  →  드리울 때 70% + 중독 + 방어 −25%, 장막이 셋을 세고(3초) 떨어져 안에 남은 적에게 120% | 1.01 / 1.03
//   u_newmoon · ux_newmoon   수와 세기 그대로, 달이 뜬 뒤(0.7 · 0.75초)
//   u_violet      120% + 중독 + 방어 −20%  →  칠 때 85% + 중독 + 방어 −20%, 장막이 4초 뒤 닫히며 안에 남은 적에게 42% | 0.99 / 1.00
//   ux_violet     170% + 중독 + 방어 −30%  →  칠 때 120% + 중독 + 방어 −30%, 장막이 5초 뒤 닫히며 58% | 1.01 / 1.03
//   u_supper      160% 한 번  →  두 번 80% + 90% | 0.99 / 1.00          ux_supper   210% 한 번  →  세 번 70% + 70% + 90% | 1.01 / 1.01
//   틀 밖에서 읽는 것 둘: 새로 일어선 망자의 자리는 화면의 유닛에서 읽는다 (owned · risen — 'spawn' 사건이 제 연출로 오지 않는다). 자리에 딸린 조각(zid)은 그 자리가 걷히면 스스로 스러진다 (zcut — 자리가 거두어질 때 부르는 연출이 없다).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var X = DS.skfx; if (!X) return;
var P = X.PAL.sha = { violet: '#b181e6', deep: '#7446ad', dark: '#2b2440', ink: '#1a1030', pit: '#0d0816', lilac: '#e0c8ff', bone: '#efe6d0', dust: '#b8ad98', green: '#b6ff5a', sick: '#7ab83a', moss: '#2a3a12', life: '#d6ff8a', blood: '#d8324a', rose: '#ff6a9a', white: '#ffffff' };
var DARK = [P.violet, P.lilac, P.deep], BONE = [P.bone, P.white, P.dust], PLAGUE = [P.green, P.sick, P.lilac], BLOOD = [P.blood, P.rose, P.deep], LIFE = [P.life, P.white, P.green], EARTH = ['#4a3a5a', P.dust, P.deep];
function mg(m, b, o) { var e = { t: 'dmg', m: m, type: 'magic' }, k; if (b) e.b = b; if (o) for (k in o) e[k] = o[k]; return e; }

// ───────── 기술 표 ─────────
X.def('cmd_sha', { desc: '호령. 모든 아군의 공격 +22%, 대신 방어 −8% (20초).' });
// 생기 나눔 · 망자 부름 · 저주: 실이 닿을 때 · 무덤이 열릴 때 · 낙인이 찍힐 때. 수치는 그대로
X.def('sha_drain', { beats: [0.15], desc: '생기를 실처럼 뽑아낸다. 흑마법 160%. 준 피해의 60%로 4칸 안 가장 다친 아군(자신 포함)을 고친다.' });
X.def('sha_raise', { beats: [0.2], desc: '땅에서 해골 병사를 일으킨다. 40초 동안 싸운다 (둘까지).' });
X.def('sha_hex', { beats: [0.2], desc: '십자 범위의 적에게 낙인을 찍는다. 120%, 방어 −20%, 공격 −15% (12초).' });
// 역병 안개: 한 번(140%) → 터질 때 85%, 안개가 4초 남아 2초마다 38% (작은 피해를 잘게 나누면 방어에 다 깎인다 — 두 번으로). 걷힐 때 안에 있는 적은 다시 중독 (뒤늦게 들어선 적에게도 옮는다 · 처음부터 있던 적의 중독 횟수는 옛것과 같다)
X.def('sha_plague', { beats: [0.25],
  eff: [mg(0.85, 0, { vs: 'curse', vx: 1.4 }), { t: 'status', s: 'poison', dur: 12, p: 3 }],
  zone: { dur: 4, every: 2, k: 'poison', eff: [mg(0.38, 0, { vs: 'curse', vx: 1.4 })], end: [{ t: 'status', s: 'poison', dur: 10.5, p: 3 }] },
  desc: '십자 범위에 독안개를 터뜨린다. 85%, 12초 중독. 안개는 4초 남아 그 안의 적에게 2초마다 38%, 걷힐 때 안에 있는 적을 다시 중독시킨다. 저주받은 적에게 1.4배.' });
// 영혼 흡수: 한 번(200%) → 세 번에 걸쳐 70% + 70% + 80%. 뽑을 때마다 가장 다친 아군에게 나눈다 (받는 피해는 그대로)
X.def('xsha_drain', { beats: [0.2, 0.5, 0.85],
  eff: [mg(0.7, 0, { share: 0.8 }), mg(0.7, 1, { share: 0.8 }), mg(0.8, 2, { share: 0.8 })],
  desc: '영혼을 세 번에 걸쳐 뽑아낸다. 흑마법 70%, 70%, 80%. 뽑을 때마다 준 피해의 80%로 가장 다친 아군을 고친다.' });
X.def('xsha_legion', { beats: [0.45], desc: '땅을 갈라 망령 병사 둘을 일으킨다. 40초 동안 싸운다 (넷까지).' });
// 죽음의 장막: 한 번(180%) → 드리울 때 70% · 중독 · 방어 −25%, 장막이 3초 동안 셋을 세고 떨어지며 안에 남은 적에게 120% (깎인 방어 위에 떨어진다)
X.def('xsha_doom', { beats: [0.25],
  eff: [mg(0.7, 0, { vs: 'curse', vx: 1.4 }), { t: 'status', s: 'poison', dur: 12, p: 4 }, { t: 'buff', s: 'def', p: -25, dur: 12 }],
  zone: { dur: 3, every: 1, k: 'dark', end: [mg(1.2)] },
  desc: '2칸 반경에 죽음의 장막을 드리운다. 70% (저주받은 적에게 1.4배), 강한 중독, 방어 −25% (12초). 장막은 3초 동안 셋을 세고 떨어져 안에 남은 적에게 120%.' });
// 그믐 군단 · 불사의 군단: 달이 뜬 뒤에 일어난다. 수와 세기는 그대로
X.def('u_newmoon', { beats: [0.7], desc: '그믐달 아래 해골 병사 셋을 일으킨다. 30초 동안 싸운다.' });
X.def('ux_newmoon', { beats: [0.75], desc: '달이 가려진 밤, 불사 병사 다섯을 일으킨다. 35초 동안 싸운다.' });
// 자줏빛 장막: 한 번(120%) → 장막이 드리우며 85%, 4초 뒤 닫히며 안에 남은 적에게 42%. 명계의 장막: 170% → 120% + 5초 뒤 58% (중독과 방어 깎기는 그대로 · 닫힐 때는 깎인 방어 위에 떨어진다)
X.def('u_violet', { beats: [0.35],
  eff: [mg(0.85), { t: 'status', s: 'poison', dur: 12, p: 5 }, { t: 'buff', s: 'def', p: -20, dur: 12 }],
  zone: { dur: 4, every: 1, k: 'dark', end: [mg(0.42)] },
  desc: '2칸 반경에 자줏빛 장막을 친다. 85%, 강한 중독, 방어 −20% (12초). 장막은 4초 뒤 닫히며 안에 남은 적에게 42%.' });
X.def('ux_violet', { beats: [0.4],
  eff: [mg(1.2), { t: 'status', s: 'poison', dur: 14, p: 6 }, { t: 'buff', s: 'def', p: -30, dur: 14 }],
  zone: { dur: 5, every: 1, k: 'dark', end: [mg(0.58)] },
  desc: '2칸 반경에 명계의 장막을 친다. 120%, 아주 강한 중독, 방어 −30% (14초). 장막은 5초 뒤 닫히며 안에 남은 적에게 58%.' });
// 망자의 저녁: 한 번(160%) → 두 번 들이켠다 80% + 90%. 망자의 만찬: 한 번(210%) → 세 번 70% + 70% + 90% (받는 피해는 그대로)
X.def('u_supper', { beats: [0.35, 0.8],
  eff: [mg(0.8, 0, { share: 0.6 }), mg(0.9, 1, { share: 0.6 })],
  desc: '둘레 2칸 적의 생기를 두 번 들이켠다. 흑마법 80%, 90%. 준 피해의 60%로 가장 다친 아군들을 고친다.' });
X.def('ux_supper', { beats: [0.35, 0.75, 1.2],
  eff: [mg(0.7, 0, { share: 0.8 }), mg(0.7, 1, { share: 0.8 }), mg(0.9, 2, { share: 0.8 })],
  desc: '둘레 2칸 적의 생기를 세 번 들이켠다. 흑마법 70%, 70%, 90%. 준 피해의 80%로 가장 다친 아군들을 고친다.' });

// ───────── 소리 ─────────
X.sound('sha_sip', function (tone, noise) { tone(180, 520, 0.22, 'sawtooth', 0.04); tone(360, 900, 0.2, 'sine', 0.04, 0.04); noise(0.2, 0.06, 900, 2); }, 3.0);      // 빨아들이는 소리
X.sound('sha_pact', function (tone) { tone(110, 98, 0.3, 'sawtooth', 0.05); tone(165, 147, 0.3, 'square', 0.025); tone(900, 500, 0.05, 'sine', 0.05, 0.18); }, 2.5);      // 계약: 낮은 웅얼거림과 떨어지는 한 방울
X.sound('sha_grave', function (tone, noise) { noise(0.3, 0.2, 220, 0.7, 0, 'lowpass'); tone(90, 50, 0.25, 'sine', 0.12); tone(1200, 700, 0.03, 'square', 0.04, 0.12); tone(1500, 900, 0.03, 'square', 0.03, 0.18); }, 1.2);      // 흙이 갈라지고 뼈가 부딪친다
X.sound('sha_brand', function (tone, noise) { noise(0.18, 0.12, 1800, 1.2); tone(140, 70, 0.2, 'square', 0.07); tone(233, 220, 0.25, 'sawtooth', 0.03); }, 1.4);      // 낙인: 지지는 소리와 낮은 쿵
X.sound('sha_fog', function (tone, noise) { noise(0.45, 0.08, 500, 0.5, 0, 'lowpass'); tone(260, 180, 0.3, 'square', 0.025); tone(140, 150, 0.35, 'sawtooth', 0.02); }, 3.0);      // 안개가 퍼진다 (날벌레의 낮은 웅웅)
X.sound('sha_toll', function (tone) { tone(196, 194, 0.5, 'sine', 0.09); tone(392, 388, 0.35, 'sine', 0.035); tone(587, 580, 0.25, 'sine', 0.02); }, 0.9);      // 낮은 종
X.sound('sha_soul', function (tone, noise) { tone(520, 130, 0.4, 'sawtooth', 0.05); tone(260, 65, 0.45, 'sine', 0.1); noise(0.3, 0.1, 700, 0.8, 0, 'lowpass'); }, 1.5);      // 넋이 뽑혀 나온다
X.sound('sha_doom', function (tone, noise) { tone(98, 49, 0.45, 'sine', 0.14); noise(0.3, 0.16, 300, 0.6, 0, 'lowpass'); tone(196, 185, 0.4, 'sawtooth', 0.03); }, 1.1);      // 장막이 떨어진다

// ───────── 그림 조각 ─────────
function pxl() { return DS.VX && DS.VX.pxLine; }
// 자리에 딸린 조각 (zid): 그 자리가 걷히면(쓰는 이가 쓰러지거나 판이 끝나면) 곧 스러진다
function zcut(V, p) { if (p.zid && !p.cut && !(V.skZone && V.skZone[p.zid])) { p.cut = 1; p.dur = Math.min(p.dur, p.t + 0.3); } }
function disc(g, cx, cy, rx, ry) { ry = Math.max(1, Math.round(ry)); cx = Math.round(cx); cy = Math.round(cy); for (var y = -ry; y <= ry; y++) { var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5)))); if (w > 0) g.fillRect(cx - w, cy + y, w * 2, 1); } }
function glyph(g, R, x, y, s, pad) { var i, j, row; for (i = 0; i < R.length; i++) { row = R[i]; for (j = 0; j < row.length; j++) if (row.charAt(j) === '#') g.fillRect(x + j * s - pad, y + i * s - pad, s + pad * 2, s + pad * 2); } }
// 생기의 실: (x0,y0) 대상에서 (x1,y1) 쓰는 이 손까지 늘어진 실. 구슬(beads)이 대상 → 손으로 흐른다. grow = 처음 그 몫 동안 손에서 대상으로 뻗는다 · sag 늘어짐 · h0 · h1 양 끝의 높이
X.kind('sha_thread', { L: 1, draw: function (g, p, f, time) {
  var ax = p.x0 * 16 + 8, ay = p.y0 * 16 + 6 - (p.h0 == null ? 4 : p.h0), bx = p.x1 * 16 + 8, by = p.y1 * 16 + 6 - (p.h1 || 0), dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy) || 1;
  var n = Math.max(6, Math.round(L)), q = p.grow ? Math.min(1, f / p.grow) : 1, a = f > 0.75 ? (1 - f) / 0.25 : 1, sag = p.sag == null ? 5 : p.sag, w = p.w || 1, nb = p.beads == null ? 3 : p.beads, i, t, wv, x, y, k, ph = Math.floor(time * 12);
  for (i = Math.floor((1 - q) * n); i <= n; i++) {
    t = i / n; wv = Math.sin(t * 9 + time * 7 + p.sd) * 1.3 * Math.sin(t * 3.1416);
    x = Math.round(ax + dx * t - dy / L * wv); y = Math.round(ay + dy * t + dx / L * wv + sag * 4 * t * (1 - t));
    g.globalAlpha = a * 0.5; g.fillStyle = P.ink; g.fillRect(x, y + 1, w, w);
    g.globalAlpha = a; g.fillStyle = (i + ph) % 5 === 0 ? (p.c2 || P.lilac) : p.c; g.fillRect(x, y, w, w);
  }
  if (q < 1) return;
  for (k = 0; k < nb; k++) {
    t = (f * (p.speed || 2.5) + k / nb) % 1; wv = Math.sin(t * 9 + time * 7 + p.sd) * 1.3 * Math.sin(t * 3.1416);
    x = Math.round(ax + dx * t - dy / L * wv); y = Math.round(ay + dy * t + dx / L * wv + sag * 4 * t * (1 - t));
    g.globalAlpha = a; g.fillStyle = p.bead || P.life; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = P.white; g.fillRect(x, y, 1, 1);
  }
} });
// 낙인: 눈 모양의 표식. 위(fall 픽셀)에서 내려와 찍히고(land 몫), 하얗게 번쩍인 뒤 떨며 남는다. s 배율 · hgt 높이
var BRAND = ['..###..', '.#...#.', '#..#..#', '.#...#.', '..###..'];
X.kind('sha_brand', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var ld = p.land || 0.2, q = Math.min(1, f / ld), s = (p.s || 1) + (q < 1 && p.fall ? 1 : 0), a = f > 0.7 ? (1 - f) / 0.3 : 1, hot = q >= 1 && f < ld + 0.1;
  var x = Math.round(cx - 3.5 * s), y = Math.round(cy - (p.hgt || 3) - (1 - q * q) * (p.fall || 0) - 2.5 * s);
  g.globalAlpha = a * 0.65; g.fillStyle = P.ink; glyph(g, BRAND, x, y, s, 1);
  g.globalAlpha = a * (q >= 1 && !hot ? 0.75 + 0.25 * Math.sin(time * 14 + p.sd) : 1); g.fillStyle = hot ? P.white : (p.c || P.lilac); glyph(g, BRAND, x, y, s, 0);
  g.fillStyle = hot ? P.white : (p.c2 || P.rose); g.fillRect(x + 3 * s, y + 2 * s, s, s);
} });
// 무덤: 먹빛 흙무덤이 갈라지고 뼈 손이 뻗어 나온다. r 무덤 너비 · h 팔 길이 · lean 팔이 옆으로 비낀 만큼 · noarm 무덤만
X.kind('sha_grave', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var L = pxl(), a = X.env(f, 0.08, 0.3), r = p.r || 7, up = Math.min(1, f / 0.3), h = Math.round((p.h || 9) * X.ease(up) * (f > 0.75 ? (1 - f) / 0.25 : 1)), x = Math.round(cx), y = Math.round(cy) + 7, j, k, wg;
  g.globalAlpha = a * 0.85; g.fillStyle = P.ink; disc(g, x, y, r, r * 0.4);
  g.globalAlpha = a; for (j = 0; j < 12; j++) { k = j / 12 * 6.2832 + 0.3; g.fillStyle = j % 3 ? (p.c || P.violet) : P.lilac; g.fillRect(Math.round(x + Math.cos(k) * r), Math.round(y + Math.sin(k) * r * 0.4), j % 3 ? 1 : 2, 1); }      // 무덤 둘레의 밝은 점 (어두운 땅에서도 읽힌다)
  if (L) { g.fillStyle = P.pit; L(g, x - r + 2, y, x - 1, y - 1, 1); L(g, x - 1, y - 1, x + 2, y + 1, 1); L(g, x + 2, y + 1, x + r - 2, y, 1); }
  if (h <= 0 || p.noarm) return;
  x += p.lean || 0; wg = Math.sin(time * 12 + p.sd) > 0 ? 1 : 0;
  k = h >> 1; j = p.lean > 0 ? -1 : 1;      // 팔은 가운데에서 한 번 꺾인다
  g.fillStyle = P.ink; g.globalAlpha = a * 0.55; g.fillRect(x - 1 + j, y - k - 1, 4, k + 1); g.fillRect(x - 1, y - h - 1, 4, h - k + 1); g.fillRect(x - 3, y - h - 6, 8, 6);
  g.globalAlpha = a; g.fillStyle = P.dust; g.fillRect(x + j + 1, y - k, 1, k); g.fillRect(x + 1, y - h, 1, h - k); g.fillStyle = P.bone; g.fillRect(x + j, y - k, 1, k); g.fillRect(x, y - h, 1, h - k);      // 팔뼈 (두 마디)
  g.fillRect(x - 1, y - h - 2, 4, 2);      // 손바닥
  g.fillRect(x - 2, y - h - 3 - wg, 1, 2); g.fillRect(x, y - h - 5, 1, 3); g.fillRect(x + 2, y - h - 4 - (1 - wg), 1, 2 + (1 - wg));      // 손가락 셋 (꿈틀거린다)
  g.fillRect(x + 3, y - h - 2, 1, 1); g.fillStyle = P.dust; g.fillRect(x + 2, y - h - 2, 1, 2);      // 엄지 · 손등의 그늘
} });
// 해골 얼굴: 7×7 무늬 (s 배율 · hgt 높이 · up 떠오르는 픽셀 · jaw 턱이 딱딱거린다 · c2 눈빛)
var SKULL = ['.#####.', '#######', '#..#..#', '#..#..#', '###.###', '.#####.'], TEETH = ['.#.#.#.'];
X.kind('sha_skull', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var s = p.s || 1, a = X.env(f, 0.15, 0.3) * (p.a || 1), x = Math.round(cx - 3.5 * s), y = Math.round(cy - (p.hgt || 16) - 3.5 * s - (p.up || 0) * f + Math.sin(time * 4 + p.sd)), jw = p.jaw && Math.sin(time * 11) > 0 ? s : 0;
  g.globalAlpha = a * 0.6; g.fillStyle = P.ink; glyph(g, SKULL, x, y, s, 1); glyph(g, TEETH, x, y + 6 * s + jw, s, 1);
  g.globalAlpha = a; g.fillStyle = p.c || P.bone; glyph(g, SKULL, x, y, s, 0); glyph(g, TEETH, x, y + 6 * s + jw, s, 0);
  g.fillStyle = p.c2 || P.violet; g.globalAlpha = a * (0.7 + 0.3 * Math.sin(time * 9)); g.fillRect(x + s, y + 2 * s, 2 * s, 2 * s); g.fillRect(x + 4 * s, y + 2 * s, 2 * s, 2 * s);      // 눈구멍의 빛
  g.fillStyle = P.pit; g.globalAlpha = a; g.fillRect(x + s, y + 2 * s, s, s); g.fillRect(x + 5 * s, y + 2 * s, s, s);
} });
// 달: 하늘(hgt)에 뜬 그믐달 (r 반지름). full = 가려진 달 (검은 달 둘레에 빛의 테). 뒤에 밤하늘 한 조각을 깔아 밝은 땅에서도 읽힌다
X.kind('sha_moon', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var r = p.r || 9, a = X.env(f, 0.12, 0.25), x = Math.round(cx), y = Math.round(cy - (p.hgt || 60) + Math.sin(time * 1.5) * 1), yy, w1, w2, ox = r * 0.5, r2 = r * 0.9, j, k, n;
  g.globalAlpha = a * 0.6; g.fillStyle = P.ink; disc(g, x, y, r + 5, r + 5);
  if (p.full) {
    n = Math.round(r * 5); g.globalAlpha = a * (0.75 + 0.25 * Math.sin(time * 5)); g.fillStyle = p.c2 || P.violet; for (j = 0; j < n; j++) { k = j / n * 6.2832; g.fillRect(Math.round(x + Math.cos(k) * (r + 2)) - 1, Math.round(y + Math.sin(k) * (r + 2)) - 1, 2, 2); }
    g.globalAlpha = a; g.fillStyle = p.c || P.bone; disc(g, x, y, r + 1, r + 1); g.fillStyle = P.pit; disc(g, x, y, r - 1, r - 1);
    g.fillStyle = P.white; k = time * 0.8; g.fillRect(Math.round(x + Math.cos(k) * (r + 1)) - 1, Math.round(y + Math.sin(k) * (r + 1)) - 1, 3, 3);      // 테를 도는 빛 한 점
    return;
  }
  g.globalAlpha = a; g.fillStyle = p.c || P.bone;
  for (yy = -r; yy <= r; yy++) { w1 = Math.round(Math.sqrt(r * r - yy * yy)); w2 = r2 * r2 - yy * yy > 0 ? Math.sqrt(r2 * r2 - yy * yy) : 0; k = Math.round(ox - w2) + w1; if (!w2) k = w1 * 2; if (k > 0) g.fillRect(x - w1, y + yy, Math.min(k, w1 * 2), 1); }
  g.fillStyle = p.c2 || P.lilac; for (yy = -r + 1; yy < r; yy += 2) { w1 = Math.round(Math.sqrt(r * r - yy * yy)); g.fillRect(x - w1, y + yy, 1, 1); }
} });
// 드리운 장막: 그 칸 위에서 천 한 폭이 떨어진다 (h 길이 · w 너비 · drop 떨어지는 데 드는 몫). hold 가 있으면 그 몫 뒤에는 val 길이의 자락만 위에 걸려 남는다 (유닛을 가리지 않게)
X.kind('sha_veil', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  zcut(V, p);
  var h = p.h || 34, w = p.w || 12, q = Math.min(1, f / (p.drop || 0.12)), a = (p.a || 0.5) * (f > 0.88 ? (1 - f) / 0.12 : 1), top = Math.round(cy + 6 - h), len = h * X.ease(q), j, x, sw, x0 = Math.round(cx - w / 2), k;
  if (p.hold != null && f > p.hold) { k = Math.min(1, (f - p.hold) / (p.back || 0.05)); len = h + ((p.val || 11) - h) * k; a = Math.min(0.9, a * (1 + 0.6 * k)); }
  for (j = 0; j < w; j += 2) {
    sw = Math.round(Math.sin(time * 2.2 + j * 0.9 + p.sd) * 1.5); x = x0 + j;
    g.globalAlpha = a; g.fillStyle = (j >> 1) % 2 ? (p.c || P.violet) : (p.c2 || P.deep); g.fillRect(x, top, 2, Math.max(1, Math.round(len + sw)));
    g.globalAlpha = Math.min(1, a * 1.7); g.fillStyle = p.hem || P.lilac; g.fillRect(x, top + Math.max(1, Math.round(len + sw)) - 1, 2, 1);      // 밑단
  }
  g.globalAlpha = Math.min(1, a * 1.7); g.fillStyle = p.hem || P.lilac; g.fillRect(x0 - 1, top - 1, w + 2, 1);      // 가로대
} });
// 세는 숫자 (3 · 2 · 1): 뼈빛 큰 숫자가 떠 있다가 스러진다. n 숫자 · s 배율 · hgt 높이
var DIG = { 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###', '..#', '###', '#..', '###'], 3: ['###', '..#', '.##', '..#', '###'] };
X.kind('sha_count', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  var R = DIG[p.n] || DIG[1], s = p.s || 3, a = X.env(f, 0.08, 0.35), x = Math.round(cx - 1.5 * s), y = Math.round(cy - (p.hgt || 30) - 2.5 * s - f * 3);
  g.globalAlpha = a * 0.7; g.fillStyle = P.ink; glyph(g, R, x, y, s, 1);
  g.globalAlpha = a; g.fillStyle = f < 0.12 ? P.white : (p.c || P.bone); glyph(g, R, x, y, s, 0);
  g.fillStyle = p.c2 || P.violet; g.fillRect(x - 2, y + 5 * s + 2, 3 * s + 4, 1);
} });
// 역병 안개: 땅에 깔려 퍼지는 풀빛 안개 덩이(n)와 그 위를 맴도는 날벌레(flies). r 퍼지는 너비
X.kind('sha_fog', { L: 1, draw: function (g, p, f, time, V, cx, cy) {
  zcut(V, p);
  var a = X.env(f, 0.06, 0.2) * (p.a || 0.4), r = p.r || 16, n = p.n || 7, sp = Math.min(1, f * 8 + 0.25), j, k, rr, x, y, w, h, sd = p.sd;
  for (j = 0; j < n; j++) {
    k = X.hs(j, sd) * 6.2832 + time * 0.25 * (j % 2 ? 1 : -1); rr = (0.25 + X.hs(j + 3, sd) * 0.75) * r * sp;
    x = cx + Math.cos(k) * rr; y = cy + 4 + Math.sin(k) * rr * 0.5 - X.hs(j + 5, sd) * 3; w = 8 + X.hs(j + 7, sd) * 8; h = 3 + X.hs(j + 9, sd) * 3;
    g.globalAlpha = a; g.fillStyle = j % 2 ? (p.c2 || P.sick) : (p.c || P.green); g.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
    g.globalAlpha = a * 0.6; g.fillRect(Math.round(x - w / 2) + 2, Math.round(y - h / 2) - 1, Math.round(w) - 4, 1);
  }
  n = p.flies == null ? 6 : p.flies;
  for (j = 0; j < n; j++) {
    k = time * (5 + X.hs(j, sd + 1) * 4) + j * 2.1; rr = 4 + X.hs(j + 2, sd + 1) * (r - 4);
    x = Math.round(cx + Math.cos(k) * rr * sp); y = Math.round(cy - 3 + Math.sin(k * 1.3) * 5 - X.hs(j, sd + 2) * 7);
    g.globalAlpha = Math.min(1, a * 2.4); g.fillStyle = P.moss; g.fillRect(x, y, 2, 1); g.fillStyle = P.life; g.fillRect(x + (Math.sin(k * 6) > 0 ? 1 : 0), y - 1, 1, 1);      // 몸과 날개
  }
} });

// ───────── 연출 ─────────
function hand(c) { return [c.ux + (c.u.face < 0 ? -0.3 : 0.3), c.uy - 0.45]; }
// 부른 것 찾기: 걸 때 이미 있던 내 것(owned)을 적어 두고, 박자 뒤에 새로 선 것만 고른다 ('spawn' 사건은 제 연출로 오지 않아 화면의 유닛에서 읽는다)
function owned(c) { var s = {}, id, w; for (id in c.V.vu) { w = c.V.vu[id]; if (w.u && w.u.owner === c.u.id) s[id] = 1; } return s; }
function risen(c, fn, max) {
  var id, w, n = 0, s = c.own || (c.own = {});
  for (id in c.V.vu) { w = c.V.vu[id]; if (!w.u || w.u.owner !== c.u.id || s[id] || w.u.dead) continue; s[id] = 1; if (n < (max || 5) && c.V.onScreen(w.x, w.y)) fn(w.x, w.y, n++); }
  return n;
}
// 무덤 하나: 흙무덤이 갈라지고 뼈 손이 뻗는다 · 흙이 튄다
function grave(c, x, y, big, lean) {
  c.fx('sha_grave', { x: x, y: y, r: big ? 9 : 7, h: big ? 12 : 9, lean: lean == null ? 5 : lean, c: P.violet, dur: big ? 0.9 : 0.8 });
  c.spray(x, y + 0.3, EARTH, big ? 6 : 5, -1.5708, 0.9, { spd: 34, grav: 120, life: 0.4 });
}
// 둘레(가운데에서 2칸)의 칸마다
function rim(c, fn) { var cxr = Math.round(c.cx), cyr = Math.round(c.cy), k = 0; c.each(function (tx, ty) { if (Math.abs(tx - cxr) + Math.abs(ty - cyr) !== 2) return; fn(tx, ty, k++); }, 13); }

// T1 ── 피의 계약 (호령): 발밑에 붉은 별무늬, 아군 머리 위로 핏방울이 하나씩 떨어진다
X.reg('cmd_sha', { cast: function (c) {
  var n = 0;
  c.castPose(P.blood).pose('sink', 0.4, 2).sfx('sha_pact');
  c.fx('sigil', { x: c.ux, y: c.uy, r: 13, c: P.blood, c2: P.white, sides: 5, skip: 2, dur: 0.7 });
  c.each(function (x, y) {
    if (n >= 6) return; var d = 0.05 + n * 0.03; n++;
    c.fx('drop', { x: x, y: y - 0.55, h: 22, s: 3, c: P.blood, c2: P.rose, tr: 3, d: d, dur: 0.22 });
    c.at(d + 0.22, function () { c.burst(x, y - 0.5, BLOOD, 2, { spd: 22, up: 8, grav: 60, life: 0.35, size: 2 }); });
  }, 9);
} });
// T1 ── 생기 나눔: 손에서 실이 뻗어 대상에 닿고 — 생기의 구슬이 실을 타고 손으로 흘러든다
X.reg('sha_drain', {
  cast: function (c) { var h = hand(c); c.castPose(P.violet); c.fx('sha_thread', { x0: c.cx, y0: c.cy, x1: h[0], y1: h[1], grow: 0.9, beads: 0, c: P.violet, dur: 0.17 }); },
  beat: function (c) {
    var h = hand(c), x = c.cx, y = c.cy;
    c.fx('sha_thread', { x0: x, y0: y, x1: h[0], y1: h[1], beads: 3, c: P.violet, bead: P.life, dur: 0.45 });
    c.ring(x, y, 10, P.violet, { inv: true, dur: 0.3 }); c.burst(x, y, DARK, 5, { spd: 22, life: 0.3 });
    c.at(0.22, function () { c.ring(c.ux, c.uy, 8, P.life, { rise: true, dur: 0.4 }); c.burst(h[0], h[1], LIFE, 4, { up: 18, grav: -14, spd: 5, life: 0.45 }); });
    c.light(x, y, 14, P.violet, 0.4, 0.3).light(h[0], h[1], 10, P.life, 0.35, 0.4).pose('back', 0.3, 2).boom('sha_sip');
  } });
// T1 ── 망자 부름: 머리 위에 작은 해골이 뜨고 — 곁의 땅이 갈라지며 뼈 손이 뻗어 나온다
X.reg('sha_raise', {
  cast: function (c) { c.own = owned(c); c.castPose(P.violet).pose('sink', 0.4, 2); c.ring(c.ux, c.uy, 12, P.violet, { inv: true, dur: 0.3 }); c.fx('sha_skull', { x: c.ux, y: c.uy, hgt: 19, c2: P.green, dur: 0.5 }); },
  beat: function (c) {
    c.at(0.03, function () {
      if (!risen(c, function (x, y) { grave(c, x, y, false); c.ring(x, y, 9, P.bone, { dur: 0.3 }); }, 2)) grave(c, c.ux + (c.u.face < 0 ? -1 : 1), c.uy, false);
      c.boom('sha_grave');
    });
  } });
// T2 ── 저주: 대상 위에 큰 낙인이 떠올랐다가 — 맞은 적마다 낙인이 내려찍힌다 (하얗게 지졌다가 떨며 남는다)
X.reg('sha_hex', {
  cast: function (c) {
    c.castPose(P.violet).sfx('curse');
    c.fx('sigil', { x: c.cx, y: c.cy, r: 15, c: P.violet, c2: P.rose, sides: 5, skip: 2, dur: 0.8, spin: -1.5 });
    c.fx('sha_brand', { x: c.cx, y: c.cy, hgt: 27, s: 2, land: 0.01, dur: 0.24 });
  },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.hits(function (hx, hy, k) {
      c.fx('sha_brand', { x: hx, y: hy, hgt: 3, fall: 16, land: 0.16, d: k * 0.03, dur: 0.85 });
      c.burst(hx, hy, DARK, 3, { spd: 20, grav: 40, life: 0.35 }); if (k < 3) c.ring(hx, hy, 9, P.violet, { inv: true, dur: 0.3, d: k * 0.03 });
    }, 5);
    c.fx('stain', { x: x, y: y, r: 13, c: P.ink, a: 0.35, c2: P.violet, dur: 2.5 });
    c.light(x, y, 20, P.violet, 0.45, 0.35).shake(0.08).boom('sha_brand');
  } });
// T2 ── 역병 안개: 풀빛 병이 포물선으로 날아가 터지고 — 안개가 땅에 퍼져 4초 남는다. 날벌레가 맴돌고, 맥박마다 안의 적이 썩는다
X.reg('sha_plague', {
  cast: function (c) { var h = hand(c); c.castPose(P.green).sfx('swoosh'); c.fx('orb', { x: h[0], y: h[1], x1: c.cx, y1: c.cy, h: 8, s: 3, c: P.green, c2: P.sick, dur: 0.25, tr: 3 }); },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('sha_fog', { x: x, y: y, r: 19, n: 8, flies: 0, a: 0.4, dur: 0.7 });      // 터지며 퍼지는 첫 안개 (남는 안개는 자리가 깔릴 때)
    c.fx('stain', { x: x, y: y, r: 16, c: P.moss, a: 0.3, c2: P.green, grow: 1, dur: c.S.zone.dur + 0.5 });
    c.ring(x, y, 17, P.green, { dur: 0.4 }); c.burst(x, y, PLAGUE, 10, { spd: 26, up: 8, grav: -6, life: 0.6, spread: 14 });
    c.hits(function (hx, hy) { c.burst(hx, hy, PLAGUE, 2, { up: 14, grav: -8, spd: 8, life: 0.5 }); }, 5);
    c.light(x, y, 18, P.green, 0.35, 0.4).boom('sha_fog');
  },
  zone: function (c, e) { c.fx('sha_fog', { x: c.cx, y: c.cy, r: 19, n: 8, flies: 7, a: 0.4, zid: e.zid, dur: e.dur + 0.3 }); },      // 남는 안개와 날벌레 — 자리가 서 있는 동안
  zoneTick: function (c) { c.hits(function (x, y, k) { c.burst(x, y - 0.2, PLAGUE, 2, { up: 12, grav: -8, spd: 8, life: 0.5 }); if (k < 3) c.ring(x, y, 7, P.green, { inv: true, dur: 0.3 }); }, 5); c.sfx('poison'); },
  zoneEnd: function (c) { c.burst(c.cx, c.cy, PLAGUE, 8, { spd: 30, grav: -10, life: 0.5, spread: 20 }); c.hits(function (x, y) { c.ring(x, y, 8, P.green, { rise: true, dur: 0.4 }); }, 5); } });
// T3 ── 영혼 흡수: 두 가닥 실이 대상에 감기고, 세 번 당긴다 — 당길 때마다 넋 한 덩이가 실을 타고 건너온다. 마지막에 넋의 얼굴이 떠오르고 생기의 기둥이 선다
X.reg('xsha_drain', {
  cast: function (c) {
    var h = hand(c), T = c.S.beats[2];
    c.castPose(P.violet).ghost(0, 0, P.violet, 0.4, 0.35).sfx('sha_sip');
    c.fx('sha_thread', { x0: c.cx, y0: c.cy, x1: h[0], y1: h[1], grow: 0.14, beads: 4, sag: 7, speed: 3, c: P.violet, bead: P.life, dur: T + 0.35 });
    c.fx('sha_thread', { x0: c.cx, y0: c.cy, x1: h[0], y1: h[1], grow: 0.14, beads: 0, sag: 2, c: P.deep, c2: P.violet, sd: 31, dur: T + 0.35 });
    c.fx('sigil', { x: c.cx, y: c.cy, r: 10, c: P.violet, c2: P.lilac, sides: 0, runes: 3, dur: T + 0.3, spin: -2.5 });
  },
  beat: function (c, i, last) {
    var h = hand(c), x = c.cx, y = c.cy;
    c.fx('orb', { x: x, y: y - 0.3, x1: h[0], y1: h[1], h: 4, s: last ? 4 : 3, c: P.bone, c2: P.violet, dur: 0.25, tr: 4 });      // 뽑혀 나오는 넋
    c.ring(x, y, 10 + i * 2, P.violet, { inv: true, dur: 0.3 }); c.burst(x, y, DARK, 5 + i * 2, { spd: 26, life: 0.3 });
    c.pose('back', 0.3, 2 + i).light(x, y, 18, P.violet, 0.45, 0.25);
    c.at(0.25, function () { c.burst(h[0], h[1], LIFE, 4, { up: 18, grav: -14, spd: 5, life: 0.45 }); c.light(h[0], h[1], 12, P.life, 0.4, 0.3); });
    if (!last) { c.shake(0.06 + i * 0.04).sfx('sha_sip'); return; }
    c.fx('sha_skull', { x: x, y: y, hgt: 13, up: 10, a: 0.85, c: P.lilac, c2: P.violet, dur: 0.55 });
    c.fx('shock', { x: x, y: y, r: 20, c: P.violet, c2: P.lilac, w: 2, thin: 1, dur: 0.4 }); c.fx('stain', { x: x, y: y, r: 10, c: P.ink, a: 0.4, c2: P.violet, dur: 2 });
    c.at(0.25, function () { c.fx('column', { x: c.ux, y: c.uy, w: 3, h: 40, c: P.life, c2: P.white, a: 0.45, dur: 0.35 }); c.ring(c.ux, c.uy, 12, P.life, { rise: true, w: 2, dur: 0.5 }); });
    c.wash(P.deep, 0.04, 0.5).shake(0.16).stop(0.04).flash(P.violet, 0.04).boom('sha_soul');
  } });
// T3 ── 망령 군단: 발밑에 먹빛 웅덩이가 번지고 큰 해골이 턱을 딱딱거린다 — 땅이 갈라지며 보랏빛 기둥 둘, 그 자리에서 망령이 일어선다
X.reg('xsha_legion', {
  cast: function (c) {
    var x = c.ux, y = c.uy;
    c.own = owned(c); c.pose('sink', 0.6, 3).castPose(P.violet).ghost(0, 0, P.violet, 0.4, 0.4).sfx('sha_toll');
    c.fx('stain', { x: x, y: y, r: 22, c: P.ink, a: 0.5, c2: P.lilac, n: 10, grow: 1, dur: 2.4 });
    c.fx('sigil', { x: x, y: y, r: 22, c: P.violet, c2: P.bone, sides: 6, skip: 2, dur: 1.3, spin: -0.8 });
    c.fx('sha_skull', { x: x, y: y, hgt: 25, s: 2, c2: P.green, jaw: 1, dur: 1.0 });
  },
  beat: function (c) {
    var x = c.ux, y = c.uy;
    c.fx('shock', { x: x, y: y, r: 30, c: P.violet, c2: P.lilac, w: 2, dur: 0.45 }); c.fx('crack', { x: x, y: y, r: 18, n: 6, c: P.violet, dur: 2.2 });
    c.shake(0.18).flash(P.violet, 0.05).wash(P.deep, 0.05, 0.7).stop(0.04).boom('sha_grave');
    c.at(0.03, function () {
      risen(c, function (sx, sy, k) {
        c.fx('column', { x: sx, y: sy, w: 4, h: 44, c: P.violet, c2: P.lilac, a: 0.55, d: k * 0.08, dur: 0.4 });
        c.at(k * 0.08, function () { grave(c, sx, sy, true, k % 2 ? -5 : 5); c.burst(sx, sy - 0.3, BONE, 5, { spd: 30, up: 14, life: 0.4 }); c.light(sx, sy, 20, P.violet, 0.5, 0.4); });
      }, 4);
    });
  } });
// T3 ── 죽음의 장막: 먹구름이 끼고 검은 줄기가 내려 적을 적신다 — 땅에 시계 무늬가 돌고 머리 위에서 3 · 2 · 1 을 센다. 다 세면 장막이 떨어지고 큰 해골이 스친다
function clock(c) { c.fx('sigil', { x: c.cx, y: c.cy, r: 35, c: P.violet, c2: P.bone, sides: 0, runes: 12, dur: 1.25, spin: -0.6 }); }      // 땅의 시계 무늬: 맥박마다 다시 그린다 (자리가 걷히면 이어지지 않는다)
function count(c, n) { c.fx('sha_count', { x: c.cx, y: c.cy, n: n, s: 3, hgt: 36, dur: 0.95 }); c.sfx('sha_toll'); }
X.reg('xsha_doom', {
  cast: function (c) {
    c.castPose(P.violet).pose('rise', 0.5, 2.5).ghost(0, 0, P.violet, 0.4, 0.35).sfx('curse');
    c.fx('cloud', { x: c.cx, y: c.cy, hgt: 46, w: 44, c: P.dark, c2: '#4a3a6a', dur: 0.7 });
  },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.hits(function (hx, hy, k) { c.fx('column', { x: hx, y: hy, w: 2, h: 42, c: P.deep, c2: P.violet, a: 0.6, d: k * 0.02, dur: 0.28 }); c.burst(hx, hy, DARK, 3, { spd: 22, grav: 50, life: 0.35 }); }, 6);
    c.fx('shock', { x: x, y: y, r: 36, c: P.violet, c2: P.lilac, w: 1, thin: 1, dur: 0.45 });
    c.light(x, y, 26, P.violet, 0.5, 0.35).shake(0.1).sfx('dark');
  },
  zone: function (c, e) { clock(c); count(c, 3); },
  zoneTick: function (c) { if (c.i < 3) { clock(c); count(c, 3 - c.i); } c.hits(function (x, y, k) { if (k < 4) c.ring(x, y, 8, P.violet, { inv: true, dur: 0.35 }); }, 6); },
  zoneEnd: function (c) {
    var x = c.cx, y = c.cy;
    rim(c, function (tx, ty, k) { c.fx('sha_veil', { x: tx, y: ty, h: 36, w: 13, drop: 0.3, a: 0.6, d: k * 0.015, dur: 0.6 }); });
    c.fx('sha_skull', { x: x, y: y, hgt: 22, s: 3, a: 0.85, jaw: 1, dur: 0.6 });
    c.fx('shock', { x: x, y: y, r: 38, c: P.violet, c2: P.lilac, w: 3, dur: 0.45 }); c.fx('crack', { x: x, y: y, r: 22, n: 7, c: P.violet, dur: 2.4 });
    c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.lilac, r: 9 }); c.burst(hx, hy, DARK, 4, { spd: 34, life: 0.35 }); }, 6);
    c.burst(x, y, BONE, 10, { spd: 50, up: 10, life: 0.4, spread: 20 });
    c.light(x, y, 28, P.violet, 0.6, 0.4).shake(0.22).stop(0.05).flash(P.violet, 0.06).wash(P.deep, 0.05, 0.6).boom('sha_doom');
  } });
// T4 ── 그믐 군단: 밤이 내리고 머리 위에 그믐달이 뜬다 — 달빛 줄기가 내리는 자리마다 무덤이 열리고 해골이 일어선다
// T5 ── 불사의 군단: 달이 가려지고(검은 달과 빛의 테) 다섯이 일어선다. 충격의 고리가 두 겹, 보랏빛 불티가 남는다
function moonUp(c, grand) {
  var T = c.S.beats[0];
  c.own = owned(c);
  c.dim(T + 0.7).wash(P.ink, grand ? 0.1 : 0.08, T + 0.9).castPose(P.violet).pose('rise', T, 3).ghost(0, 0, P.violet, 0.5, 0.4).sfx('sha_toll');
  c.fx('sha_moon', { x: c.ux, y: c.uy, hgt: 60, r: grand ? 11 : 9, full: grand ? 1 : 0, dur: T + (grand ? 1.5 : 1.1) });
  c.fx('sigil', { x: c.ux, y: c.uy, r: 13, c: P.violet, c2: P.bone, sides: 5, skip: 2, dur: T + 0.3, spin: -1 });
  c.at(T * 0.5, function () { c.fx('column', { x: c.ux, y: c.uy, w: 2, h: 56, c: P.lilac, c2: P.white, a: 0.3, dur: T * 0.5 + 0.1 }); });      // 달빛이 쓰는 이에게 먼저 닿는다
}
function moonRise(c, grand) {
  var x = c.ux, y = c.uy;
  c.fx('shock', { x: x, y: y, r: grand ? 40 : 34, c: P.violet, c2: P.lilac, w: 3, dur: 0.5 });
  c.streak(grand ? 12 : 6, 1.5708, P.lilac, 0.6, 0.22);
  c.shake(grand ? 0.4 : 0.26).stop(grand ? 0.08 : 0.05).flash(P.lilac, grand ? 0.1 : 0.07).boom('sha_grave');
  if (grand) { c.fx('shock', { x: x, y: y, r: 56, c: P.white, w: 1, thin: 1, dur: 0.7, d: 0.14 }); c.fx('stain', { x: x, y: y, r: 30, c: P.ink, a: 0.35, c2: P.violet, n: 12, dur: 3.5 }); }
  c.at(0.03, function () {
    risen(c, function (sx, sy, k) {
      var d = k * (grand ? 0.07 : 0.09);
      c.fx('column', { x: sx, y: sy, w: 4, h: 72, c: P.lilac, c2: P.white, a: 0.5, d: d, dur: 0.45 });      // 달빛 줄기
      c.at(d, function () { grave(c, sx, sy, true, k % 2 ? -5 : 5); c.burst(sx, sy - 0.3, BONE, grand ? 6 : 5, { spd: 32, up: 14, life: 0.4 }); c.light(sx, sy, 22, P.lilac, 0.5, 0.45); if (k === 0) c.sfx('sha_grave'); });
      if (grand) c.at(d + 0.45, function () { c.fx('sha_skull', { x: sx, y: sy, hgt: 20, up: 6, a: 0.8, c2: P.green, dur: 0.6 }); });      // 일어선 이마다 넋의 얼굴이 스친다
    }, grand ? 5 : 3);
    if (grand) c.fx('emit', { x: x, y: y, sp: 5, rate: 14, n: 1, dur: 1.4, cols: DARK, o: { up: 22, grav: -12, spd: 5, life: 0.9 } });
  });
}
X.reg('u_newmoon', { cast: function (c) { moonUp(c, false); }, beat: function (c) { moonRise(c, false); } });
X.reg('ux_newmoon', { cast: function (c) { moonUp(c, true); }, beat: function (c) { moonRise(c, true); } });
// T4 ── 자줏빛 장막: 둘레에 천이 떨어져 닫히고(첫 타격) — 자락만 위에 걸린 채 4초, 안의 숨이 무겁게 가라앉는다. 다 되면 장막이 다시 떨어지며 닫힌다
// T5 ── 명계의 장막: 장막이 더 길고, 맥박마다 땅에서 뼈 손이 뻗는다. 닫힐 때 큰 해골이 스친다
function veilUp(c, grand) {
  var T = c.S.beats[0], h = grand ? 42 : 36;
  c.dim(grand ? 1.3 : 1.0).wash(P.deep, grand ? 0.1 : 0.07, 1.2).castPose(P.violet).pose('rise', 0.6, 2.5).ghost(0, 0, P.violet, 0.4, 0.4).sfx('sha_toll');
  c.fx('sigil', { x: c.cx, y: c.cy, r: 36, c: P.violet, c2: P.lilac, sides: grand ? 8 : 0, skip: 3, runes: 8, dur: T + 0.7, spin: 0.7 });
  rim(c, function (tx, ty, k) { c.fx('sha_veil', { x: tx, y: ty, h: h, w: 13, drop: T / (T + 0.6), a: 0.55, dur: T + 0.6 }); });      // 둘레에 천이 떨어져 닫힌다 (자락은 자리가 깔릴 때 걸린다)
}
function veilHit(c, grand) {
  var x = c.cx, y = c.cy;
  c.fx('shock', { x: x, y: y, r: 38, c: P.violet, c2: P.lilac, w: 3, dur: 0.45 });
  c.hits(function (hx, hy) { c.ring(hx, hy, 10, P.violet, { inv: true, dur: 0.3 }); c.burst(hx, hy, PLAGUE, 3, { up: 14, grav: -8, spd: 10, life: 0.5 }); }, 6);
  c.burst(x, y, DARK, grand ? 20 : 14, { spd: 50, grav: 30, life: 0.5, spread: 24 });
  c.fx('stain', { x: x, y: y, r: 30, c: P.ink, a: 0.25, c2: P.violet, n: 10, dur: c.S.zone.dur + 0.4 });
  c.light(x, y, 36, P.violet, 0.65, 0.5).shake(grand ? 0.36 : 0.26).stop(grand ? 0.07 : 0.06).flash(P.violet, grand ? 0.09 : 0.07).boom('sha_doom');
  if (grand) { c.fx('shock', { x: x, y: y, r: 54, c: P.lilac, w: 1, thin: 1, dur: 0.7, d: 0.12 }); c.streak(8, 1.5708, P.violet, 0.5, 0.2); }
}
function veilHang(c, e, grand) { rim(c, function (tx, ty) { c.fx('sha_veil', { x: tx, y: ty, h: grand ? 42 : 36, w: 13, drop: 0.001, hold: 0.3 / e.dur, back: 0.3 / e.dur, val: 9, a: 0.55, zid: e.zid, dur: e.dur }); }); }      // 자락만 위에 걸려 남는다 — 자리가 서 있는 동안
function veilTick(c, grand) {
  c.hits(function (x, y, k) {
    c.burst(x, y - 0.6, DARK, 2, { up: -10, grav: 26, spd: 5, life: 0.5 });      // 가라앉는 숨
    if (grand && k < 3) c.fx('sha_grave', { x: x, y: y, r: 5, h: 8, lean: k % 2 ? -5 : 5, dur: 0.7 });
  }, 6);
  c.fx('shock', { x: c.cx, y: c.cy, r0: 36, r: 8, c: P.violet, w: 1, thin: 1, dur: 0.6 });      // 안으로 조여 드는 고리
  c.sfx('curse');
}
function veilEnd(c, grand) {
  var x = c.cx, y = c.cy;
  rim(c, function (tx, ty, k) { c.fx('sha_veil', { x: tx, y: ty, h: grand ? 42 : 36, w: 13, drop: 0.3, a: 0.6, d: k * 0.015, dur: 0.6 }); });
  c.ring(x, y, 38, P.violet, { inv: true, w: 2, dur: 0.4 });
  c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.lilac, r: 8 }); c.burst(hx, hy, DARK, 3, { spd: 30, life: 0.35 }); }, 6);
  c.light(x, y, 28, P.violet, 0.55, 0.4).shake(0.2).flash(P.violet, 0.05).boom('sha_doom');
  if (grand) { c.fx('sha_skull', { x: x, y: y, hgt: 22, s: 3, a: 0.85, jaw: 1, c2: P.green, dur: 0.6 }); c.fx('shock', { x: x, y: y, r: 44, c: P.lilac, w: 2, dur: 0.5 }); c.wash(P.deep, 0.05, 0.6); }
}
X.reg('u_violet', { cast: function (c) { veilUp(c, false); }, beat: function (c) { veilHit(c, false); }, zone: function (c, e) { veilHang(c, e, false); }, zoneTick: function (c) { veilTick(c, false); }, zoneEnd: function (c) { veilEnd(c, false); } });
X.reg('ux_violet', { cast: function (c) { veilUp(c, true); }, beat: function (c) { veilHit(c, true); }, zone: function (c, e) { veilHang(c, e, true); }, zoneTick: function (c) { veilTick(c, true); }, zoneEnd: function (c) { veilEnd(c, true); } });
// T4 ── 망자의 저녁: 발밑에 둥근 식탁이 그려지고, 둘레의 적마다 실이 이어진다 — 두 번 들이켠다. 마지막에 넋이 실을 타고 모여들어 생기의 기둥이 선다
// T5 ── 망자의 만찬: 식탁이 두 겹, 세 번 들이켠다. 머리 위에 큰 해골이 주인처럼 뜨고, 생기가 오래 피어오른다
function supperUp(c, grand) {
  var B = c.S.beats, T = B[B.length - 1], x = c.ux, y = c.uy;
  c.dim(T + 0.5).wash(P.ink, grand ? 0.08 : 0.06, T + 0.3).castPose(P.violet).pose('rise', T, 3).ghost(0, 0, P.violet, 0.5, 0.4).sfx('dark');
  c.fx('sigil', { x: x, y: y, r: 36, c: P.bone, c2: P.rose, sides: 0, runes: 8, dur: T + 0.6, spin: 0.5 });
  if (grand) c.fx('sigil', { x: x, y: y, r: 45, c: P.violet, c2: P.lilac, sides: 8, skip: 3, dur: T + 0.6, spin: -0.4 });
  c.who(false, function (ex, ey, k) { c.fx('sha_thread', { x0: ex, y0: ey, x1: x, y1: y - 0.5, grow: 0.2, beads: 2, sag: 4, speed: T * 2.2, c: P.violet, bead: P.life, sd: k * 13, dur: T + 0.3 }); }, 6);
}
function supper(c, i, last, grand) {
  var x = c.ux, y = c.uy;
  c.hits(function (hx, hy, k) { if (k < 4) c.ring(hx, hy, 9 + i, P.violet, { inv: true, dur: 0.3 }); c.burst(hx, hy, DARK, 2 + (last ? 1 : 0), { spd: 22, life: 0.3 }); }, 6);
  c.light(x, y - 0.5, 20, P.life, 0.4, 0.3);
  if (!last) { c.pose('sink', 0.25, 2).shake(0.1 + i * 0.05).sfx('sha_sip'); return; }
  c.hits(function (hx, hy, k) { c.fx('orb', { x: hx, y: hy - 0.3, x1: x, y1: y - 0.6, h: 5, s: 3, c: P.bone, c2: P.violet, d: k * 0.015, dur: 0.22, tr: 3 }); }, 6);      // 넋이 모여든다
  c.fx('shock', { x: x, y: y, r: 38, c: P.violet, c2: P.lilac, w: 3, dur: 0.5 }); c.fx('stain', { x: x, y: y, r: 28, c: P.ink, a: 0.3, c2: P.violet, n: 10, dur: 3 });
  c.at(0.22, function () {
    c.fx('column', { x: x, y: y, w: grand ? 7 : 5, h: grand ? 70 : 54, c: P.life, c2: P.white, a: 0.5, dur: 0.4 }); c.ring(x, y, 14, P.life, { rise: true, w: 2, dur: 0.6 });
    c.burst(x, y - 0.3, LIFE, grand ? 22 : 16, { up: 30, grav: -18, spd: 14, life: 0.7, spread: 16 }); c.light(x, y, 36, P.life, 0.6, 0.5);
  });
  c.shake(grand ? 0.4 : 0.28).stop(grand ? 0.08 : 0.06).flash(P.violet, grand ? 0.09 : 0.07).wash(P.deep, grand ? 0.09 : 0.07, 0.9).boom('sha_soul');
  if (grand) {
    c.fx('sha_skull', { x: x, y: y, hgt: 30, s: 2, jaw: 1, c2: P.green, dur: 0.9 });
    c.fx('shock', { x: x, y: y, r: 54, c: P.white, w: 1, thin: 1, dur: 0.7, d: 0.12 });
    c.fx('emit', { x: x, y: y - 0.3, sp: 3, rate: 14, n: 1, dur: 1.3, cols: LIFE, o: { up: 26, grav: -14, spd: 5, life: 0.9 } });
    c.streak(8, -1.5708, P.life, 0.6, 0.2);
  }
}
X.reg('u_supper', { cast: function (c) { supperUp(c, false); }, beat: function (c, i, last) { supper(c, i, last, false); } });
X.reg('ux_supper', { cast: function (c) { supperUp(c, true); }, beat: function (c, i, last) { supper(c, i, last, true); } });
})();
