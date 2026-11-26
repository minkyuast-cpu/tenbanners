// 전민 — 기술 연출: 법사 (불 · 얼음 · 번개 — 원소마다 다른 손길, 필살기는 책과 별). 틀과 쓰는 법은 src/skfx.js · docs/SKILL_FX.md.
//   이 파일이 맡는 기술: cmd_mag · mag_ember · mag_frost (T1) · mag_bolt · mag_meteor (T2) · xmag_bolt · xmag_prism · xmag_nova (T3) · u_skyfire · u_spellbook · u_icejail (T4) · ux_* 셋 (T5)
//   기술 표(효과 · 박자 · 설명)의 고침도 여기서 한다 (X.def).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var X = DS.skfx; if (!X) return;
// 법사의 빛깔: 불(주황 · 노랑 · 붉은 재) · 얼음(흰 · 하늘 · 짙은 푸름) · 번개(옅은 노랑 · 흰 · 보라 테) · 주문(보라) · 별(푸른 흰빛)
var P = X.PAL.mag = { fire: '#ff9a3c', flame: '#ffd75e', coal: '#d9442b', ash: '#1b1016', ice: '#9fe8ec', frost: '#d6fbff', deepice: '#5fa8e6', bolt: '#fff0a0', volt: '#c9a8ff', arc: '#b89cff', deeparc: '#8d6be0', star: '#dff4ff', night: '#22306e', sky: '#8fb0ff', white: '#ffffff' };
var FIRE = [P.fire, P.flame, P.coal], ICE = [P.frost, P.ice, P.deepice], ICEC = [P.white, P.ice, P.deepice], BOLT = [P.bolt, P.white, P.volt], ARC = [P.arc, P.white, P.deeparc], STAR = [P.white, P.star, P.sky, P.flame];
var MAG = { type: 'magic' };

// ───────── 기술 표 ─────────
// 마력을 받아라: 효과는 그대로. 설명의 긴 줄표만 걷는다
X.def('cmd_mag', { desc: '호령. 모든 아군의 공격 +15% (25초).' });
// 불씨 · 얼음창 · 연쇄 번개: 날아가 닿을 때 터진다 (0.2 · 0.14 · 0.12초의 뜸). 수치는 그대로
X.def('mag_ember', { beats: [0.2] });
X.def('mag_frost', { beats: [0.14] });
X.def('mag_bolt', { beats: [0.12] });
// 별똥별: 바로 떨어지던 것(120%) → 0.9초 뒤에 떨어진다. 적이 비켜설 수 있어 135%로
X.def('mag_meteor', { fall: { delay: 0.9 },
  eff: [{ t: 'dmg', m: 1.35, type: 'magic', vs: 'burn', vx: 1.3 }, { t: 'status', s: 'burn', dur: 6, p: 1.5 }],
  desc: '겨눈 십자 범위에 0.9초 뒤 운석이 떨어진다. 135%, 화상. 이미 화상을 입은 적에게 1.3배. 떨어지기 전에 비켜설 수 있다.' });
// 연쇄 뇌우: 한 번(160% · 옮겨 감 80%) → 먹구름에서 두 번 105% + 65% (옮겨 감 55% + 35%). 받는 피해는 그대로 (방어는 맞을 때마다 빠지므로 합을 조금 올린다 — tools/skdmg.js)
var VS = 'wet|slow';
X.def('xmag_bolt', { beats: [0.25, 0.55],
  eff: [{ t: 'dmg', m: 1.05, type: 'magic', stat: 'mix', vs: VS, vx: 1.5 }, { t: 'chain', n: 3, r: 2, m: 0.55, type: 'magic', stat: 'mix', vs: VS, vx: 1.5 },
    { t: 'dmg', m: 0.65, type: 'magic', stat: 'mix', vs: VS, vx: 1.5, b: 1 }, { t: 'chain', n: 3, r: 2, m: 0.35, type: 'magic', stat: 'mix', vs: VS, vx: 1.5, b: 1 }],
  desc: '먹구름에서 벼락이 두 번 떨어진다. 105%, 이어서 65%. 칠 때마다 2칸 안의 셋에게 옮겨 간다(55%, 35%). 얼거나 젖은 적에게 1.5배.' });
// 원소 폭주: 한 번(150% · 화상에 1.3배) → 불 55% · 얼음 45% · 번개 45% 가 차례로. 얼음은 방금 붙인 화상에, 번개는 방금 건 둔화에 1.3배 — 스스로 맞물린다 (받는 피해는 옛 150% 와 같다)
X.def('xmag_prism', { beats: [0.2, 0.5, 0.8],
  eff: [{ t: 'dmg', m: 0.55, type: 'magic' }, { t: 'status', s: 'burn', dur: 8, p: 2 },
    { t: 'dmg', m: 0.45, type: 'magic', vs: 'burn', vx: 1.3, b: 1 }, { t: 'status', s: 'slow', dur: 8, b: 1 },
    { t: 'dmg', m: 0.45, type: 'magic', vs: 'slow', vx: 1.3, b: 2 }],
  desc: '2칸 반경에 불, 얼음, 번개가 차례로 터진다. 불 55%와 화상, 얼음 45%와 둔화, 번개 45%. 얼음은 화상 입은 적에게, 번개는 둔화된 적에게 1.3배.' });
// 천원 운석: 바로(230%) → 1초 뒤에 떨어진다 250% + 불타는 구덩이 4초(1초마다 12%). 비켜서는 몫(열에 하나 남짓)만큼 올렸다
X.def('xmag_nova', { fall: { delay: 1.0 },
  eff: [{ t: 'dmg', m: 2.5, type: 'magic', vs: 'burn', vx: 1.3 }, { t: 'status', s: 'burn', dur: 8, p: 3 }, { t: 'gauge', v: -30 }],
  zone: { dur: 4, every: 1, k: 'fire', eff: [{ t: 'dmg', m: 0.12, type: 'magic' }] },
  desc: '겨눈 2칸 반경에 1초 뒤 큰 운석이 떨어진다. 250% (화상 입은 적에게 1.3배), 화상과 게이지 깎기. 구덩이가 4초 동안 불타 그 위의 적에게 1초마다 12%.' });
// 밤하늘 낙하: 바로(200%) → 1초 뒤 별 하나 230%. 유성우: 바로(280%) → 0.9초 뒤부터 다섯 번 55% × 4 + 110% (비켜서는 몫 · 여러 번 맞는 몫만큼 올렸다)
X.def('u_skyfire', { fall: { delay: 1.0 },
  eff: [{ t: 'dmg', m: 2.3, type: 'magic' }, { t: 'status', s: 'burn', dur: 10, p: 3 }],
  desc: '겨눈 2칸 반경에 1초 뒤 별 하나가 떨어진다. 230%, 긴 화상.' });
X.def('ux_skyfire', { fall: { delay: 0.9 }, beats: [0, 0.22, 0.44, 0.66, 1.0],
  eff: [{ t: 'dmg', m: 0.55, type: 'magic' }, { t: 'status', s: 'burn', dur: 12, p: 4 }, { t: 'dmg', m: 0.55, type: 'magic', b: 1 }, { t: 'dmg', m: 0.55, type: 'magic', b: 2 }, { t: 'dmg', m: 0.55, type: 'magic', b: 3 }, { t: 'dmg', m: 1.1, type: 'magic', b: 4 }],
  desc: '겨눈 2칸 반경에 0.9초 뒤 별이 다섯 번 쏟아진다. 55%씩 네 번, 마지막에 110%. 긴 화상.' });
// 적어 둔 주문: 책을 펴고 읽는 뜸(0.4초). 금단의 주문: 한 번(360% · 옮겨 감 70%) → 세 줄을 읽는다 135% × 3 (옮겨 감 25% + 25% + 30%) — 받는 피해는 그대로
X.def('u_spellbook', { beats: [0.4] });
var VX4 = { type: 'magic', stat: 'mix', vs: VS, vx: 1.4 };
function v4(o) { for (var k in VX4) o[k] = VX4[k]; return o; }
X.def('ux_spellbook', { beats: [0.35, 0.7, 1.15],
  eff: [v4({ t: 'dmg', m: 1.35 }), v4({ t: 'chain', n: 5, r: 2, m: 0.25 }), v4({ t: 'dmg', m: 1.35, b: 1 }), v4({ t: 'chain', n: 5, r: 2, m: 0.25, b: 1 }), v4({ t: 'dmg', m: 1.35, b: 2 }), v4({ t: 'chain', n: 5, r: 2, m: 0.3, b: 2 })],
  desc: '금단의 세 줄을 읽는다. 적 하나에 뇌격 135%씩 세 번, 칠 때마다 곁의 다섯에게 옮겨 간다(25%, 25%, 30%). 얼거나 젖은 적에게 1.4배.' });
// 서리 감옥: 게이지를 한 번에 40 깎던 것 → 감옥이 5초 남아 1초마다 10. 영겁의 서리: 190% · 게이지 60 → 135% + 6초 감옥(1초마다 12) + 깨지며 65%
X.def('u_icejail', { beats: [0.3],
  eff: [{ t: 'dmg', m: 1.3, type: 'magic', vs: 'burn', vx: 1.4 }, { t: 'status', s: 'slow', dur: 12 }],
  zone: { dur: 5, every: 1, k: 'frost', eff: [{ t: 'gauge', v: -10 }] },
  desc: '2칸 반경에 서리 감옥을 세운다. 130%(화상 입은 적에게 1.4배)와 긴 둔화. 감옥은 5초 남아, 갇힌 적의 게이지를 1초마다 깎는다.' });
X.def('ux_icejail', { beats: [0.35],
  eff: [{ t: 'dmg', m: 1.35, type: 'magic', vs: 'burn', vx: 1.4 }, { t: 'status', s: 'slow', dur: 14 }],
  zone: { dur: 6, every: 1, k: 'frost', eff: [{ t: 'gauge', v: -12 }], end: [{ t: 'dmg', m: 0.65, type: 'magic' }] },
  desc: '2칸 반경을 얼려 가둔다. 135%(화상 입은 적에게 1.4배)와 긴 둔화. 감옥은 6초 남아 갇힌 적의 게이지를 1초마다 깎고, 깨지면서 65%.' });

// ───────── 연출 ─────────
function hand(c) { return [c.ux + (c.u.face < 0 ? -0.3 : 0.3), c.uy - 0.45]; }      // 지팡이 끝
function flames(c, max, dur) { c.each(function (x, y, i, d) { c.shape({ k: 'flame', x: x, y: y, dur: dur || 0.5, d: Math.min(0.15, d * 0.04) }); }, max); }
// 번개 한 줄기: 쓰는 이의 손에서 대상까지 (가로로 달린다 — 하늘에서 치는 벼락과 다르다)
function zapTo(c, x0, y0, x1, y1, col, w, o) { o = o || {}; return c.fx('zap', { x0: x0, y0: y0, x1: x1, y1: y1, h0: o.h0 || 0, h1: o.h1 == null ? 3 : o.h1, c: col, w: w || 3, jit: o.jit == null ? 4 : o.jit, fork: o.fork, dur: o.dur || 0.22, d: o.d || 0 }); }
// 옮겨 가는 번개 (연쇄): 한 마디씩 늦게
function chainZap(col) { return function (c, a, b, n) { var d = 0.05 + n * 0.05; if (n < 3) zapTo(c, a[0], a[1], b[0], b[1], col, 2, { h0: 3, d: d, dur: 0.2 }); c.at(d, function () { c.burst(b[0], b[1], BOLT, 3, { spd: 36, life: 0.2 }); c.light(b[0], b[1], 14, col, 0.4, 0.2); }); }; }      // 모양 예산을 아낀다: 줄기는 셋까지, 나머지는 불티와 빛만

// T1 ── 마력을 받아라 (호령): 발밑에 작은 마법진, 아군 머리 위로 룬이 하나씩 떠오른다
X.reg('cmd_mag', { cast: function (c) {
  c.castPose(P.arc).pose('rise', 0.4, 2).sfx('chant'); c.fx('sigil', { x: c.ux, y: c.uy, r: 11, c: P.arc, sides: 0, runes: 3, dur: 0.6 });
  c.each(function (x, y, i, d) { c.fx('rune', { x: x, y: y - 0.8, c: P.white, ri: i, s: 2, up: 7, d: 0.08 + Math.min(0.2, d * 0.04), dur: 0.65 }); c.burst(x, y - 0.3, ARC, 2, { up: 22, grav: -16, spd: 5, life: 0.5 }); }, 7);
} });
// T1 ── 불씨: 작은 불덩이가 포물선으로 날아가 — 가운데에 불꽃 하나, 십자 칸에 불티
X.reg('mag_ember', {
  cast: function (c) { var h = hand(c); c.castPose(P.fire); c.fx('orb', { x: h[0], y: h[1], x1: c.cx, y1: c.cy, h: 7, head: 'ember', c: P.fire, c2: P.coal, s: 3, dur: 0.2, tr: 3 }); },
  beat: function (c) {
    c.shape({ k: 'flame', x: c.cx, y: c.cy, dur: 0.45 }).ring(c.cx, c.cy, 10, P.fire, { dur: 0.3 });
    c.burst(c.cx, c.cy, FIRE, 5, { up: 30, grav: -18, life: 0.5, spread: 8 });
    c.each(function (x, y, i, d) { if (d > 0.5) c.burst(x, y, FIRE, 2, { up: 26, grav: -16, spd: 8, life: 0.45 }); }, 5);
    c.light(c.cx, c.cy, 16, P.fire, 0.4, 0.4).boom('emberPop');
  } });
// T1 ── 얼음창: 긴 얼음 조각이 곧게 날아가 꽂히고 — 작은 얼음 가시가 솟았다 깨진다
X.reg('mag_frost', {
  cast: function (c) { var h = hand(c); c.fx('orb', { x: h[0], y: h[1], x1: c.cx, y1: c.cy - 0.1, h: 0, head: 'ice', c: P.frost, c2: P.deepice, s: 2, dur: 0.14, tr: 2 }); c.castPose(P.ice).sfx('iceShot'); },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('spike', { x: x, y: y + 0.1, h: 10, w: 5, c: ICEC, lean: c.dx * 3, dur: 0.5 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 7 }).ring(x, y, 9, P.ice, { dur: 0.3 });
    c.spray(x, y, ICE, 8, c.ang, 1.2, { spd: 40, up: 8, grav: 80, life: 0.4, size: 2 });
    c.light(x, y, 14, P.ice, 0.4, 0.3).boom('iceBreak');
  } });
// T2 ── 연쇄 번개: 지팡이 끝에서 번개가 가로로 달려 꽂히고, 곁의 적으로 한 마디씩 옮겨 간다
X.reg('mag_bolt', {
  cast: function (c) { var h = hand(c); c.castPose(P.bolt).pose('rise', 0.3, 1.5).sfx('runeTick'); c.burst(h[0], h[1], BOLT, 4, { spd: 16, life: 0.2 }); c.fx('sigil', { x: c.ux, y: c.uy, r: 9, c: P.bolt, sides: 0, runes: 3, dur: 0.4 }); },
  beat: function (c) {
    var h = hand(c), x = c.cx, y = c.cy;
    zapTo(c, h[0], h[1], x, y, P.volt, 3, { fork: 1 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.24, c: P.white, r: 9 }).ring(x, y, 11, P.bolt, { dur: 0.3 });
    c.burst(x, y, BOLT, 9, { spd: 44, life: 0.24 }).light(x, y, 22, P.volt, 0.5, 0.22).light(h[0], h[1], 12, P.bolt, 0.4, 0.2);
    c.flash(P.bolt, 0.04).shake(0.08).boom('zap');
  },
  chain: chainZap(P.volt) });
// T2 ── 별똥별: 땅에 불의 표식과 그림자가 자라고 — 0.9초 뒤 운석이 비스듬히 꽂힌다. 그을음이 남는다
function meteorMark(c, e, o) {
  var x = c.cx, y = c.cy, T = e.dur, fall = o.fall || 0.32;
  c.fx('sigil', { x: x, y: y, r: o.r, c: o.c || P.fire, c2: o.c2 || P.flame, sides: o.sides || 0, skip: o.skip, runes: o.runes, dur: T + 0.15, spin: 1.6 });
  c.fx('shadow', { x: x, y: y, r: o.sh, dur: T });
  c.fx('star', { x: x + o.sx / 16, y: y - o.h / 16, s: 4, c: o.c2 || P.flame, dur: 0.4, d: Math.max(0, T - fall - 0.4) });      // 하늘에서 반짝
  c.at(Math.max(0, T - fall - 0.25), function () { c.sfx(o.snd || 'fallWhistle'); });
  c.at(T - fall, function () { c.fx('drop', { x: x, y: y, h: o.h, sx: o.sx, head: o.head || 'meteor', s: o.s, c: o.hc, c2: o.hc2, tr: o.tr, dur: fall }); });
}
X.reg('mag_meteor', {
  cast: function (c) { c.castPose(P.fire).pose('rise', 0.5, 2).sfx('chant'); c.fx('sigil', { x: c.ux, y: c.uy, r: 10, c: P.fire, sides: 0, runes: 3, dur: 0.6 }); },
  mark: function (c, e) { meteorMark(c, e, { r: 15, sh: 9, h: 92, sx: 34, s: 5 }); },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('shock', { x: x, y: y, r: 21, c: P.fire, c2: P.flame, w: 2, dust: P.coal, dur: 0.4 }); c.fx('stain', { x: x, y: y, r: 12, c: P.ash, a: 0.5, c2: P.fire, dur: 3 });
    flames(c, 5, 0.5); c.spray(x, y, FIRE.concat(['#7a1f1f']), 14, -1.5708, 1.3, { spd: 48, grav: 110, life: 0.55, size: 2 });
    c.light(x, y, 22, P.fire, 0.5, 0.5).shake(0.12).flash(P.fire, 0.04).boom('meteorHit');
  } });
// T3 ── 연쇄 뇌우: 대상 머리 위에 먹구름이 끼고, 벼락이 두 번 내리친다 (둘째가 더 굵다)
X.reg('xmag_bolt', {
  cast: function (c) {
    c.castPose(P.volt).pose('rise', 0.7, 2).sfx('chant').ghost(0, 0, P.volt, 0.4, 0.35);
    c.fx('cloud', { x: c.cx, y: c.cy, hgt: 40, w: 28, c: '#3a3550', c2: '#5a5478', lit: 1, dur: 1.0 });
  },
  beat: function (c, i, last) {
    var x = c.cx, y = c.cy;
    zapTo(c, x + c.rnd(0.3), y, x, y, last ? P.bolt : P.volt, last ? 4 : 3, { h0: 40, h1: 0, fork: 1, jit: 5, dur: 0.24 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.24, c: P.white, r: last ? 13 : 9 }); c.burst(x, y, BOLT, last ? 14 : 8, { spd: 50, life: 0.26 });
    c.light(x, y, 28, P.volt, 0.6, 0.25);
    if (!last) { c.flash(P.volt, 0.04).shake(0.1).boom('zap'); return; }
    zapTo(c, x - 0.4, y, x + 0.2, y, P.volt, 2, { h0: 40, h1: 0, jit: 6, dur: 0.2, d: 0.05 });
    c.fx('column', { x: x, y: y, w: 4, h: 46, c: P.volt, c2: P.white, a: 0.5, dur: 0.22 });
    c.fx('shock', { x: x, y: y, r: 24, c: P.volt, c2: P.white, w: 2, dur: 0.4 }); c.fx('stain', { x: x, y: y, r: 9, c: P.ash, a: 0.45, c2: P.bolt, dur: 2 });
    c.flash(P.white, 0.06).wash(P.volt, 0.04, 0.5).shake(0.2).stop(0.04).boom('thunderBig');
  },
  chain: chainZap(P.volt) });
// T3 ── 원소 폭주: 세모난 마법진 위에서 불 → 얼음 → 번개가 차례로 터진다 (박자마다 빛깔과 꼴이 바뀐다)
X.reg('xmag_prism', {
  cast: function (c) {
    c.castPose(P.arc).pose('rise', 1.0, 2.5).sfx('chant').ghost(0, 0, P.arc, 0.4, 0.35);
    c.fx('sigil', { x: c.cx, y: c.cy, r: 34, c: P.arc, c2: P.white, sides: 3, dur: 1.3, spin: 0.8 });
    [P.fire, P.ice, P.bolt].forEach(function (col, k) { c.fx('rune', { x: c.ux + (k - 1) * 0.6, y: c.uy - 1.0, c: col, ri: k, s: 2, up: 5, d: k * 0.08, dur: 0.9 }); });      // 모양 22 가운데: 걸 때 5 · 불 5 · 얼음 6 · 번개 6
  },
  beat: function (c, i) {
    var x = c.cx, y = c.cy;
    if (i === 0) {      // 불
      flames(c, 4, 0.5); c.fx('shock', { x: x, y: y, r: 34, c: P.fire, c2: P.flame, w: 2, dur: 0.4 });
      c.burst(x, y, FIRE, 12, { up: 34, grav: -20, spd: 30, life: 0.55, spread: 30 }); c.light(x, y, 28, P.fire, 0.55, 0.4).shake(0.1).sfx('fireRoar');
    } else if (i === 1) {      // 얼음
      c.fx('stain', { x: x, y: y, r: 32, c: P.ice, a: 0.3, c2: P.white, n: 10, grow: 1, dur: 1.6 });
      c.hits(function (hx, hy, k) { c.fx('spike', { x: hx, y: hy + 0.1, h: 12, w: 5, c: ICEC, lean: c.rnd(2), dur: 0.6 }); }, 4);
      c.fx('shock', { x: x, y: y, r: 34, c: P.ice, c2: P.white, w: 2, dur: 0.4 }); c.burst(x, y, ICE, 10, { spd: 40, grav: 60, life: 0.45, spread: 30, size: 2 });
      c.light(x, y, 28, P.ice, 0.55, 0.4).shake(0.1).sfx('freeze');
    } else {      // 번개
      c.hits(function (hx, hy, k) { zapTo(c, hx + c.rnd(0.4), hy, hx, hy, P.volt, k ? 2 : 3, { h0: 60, h1: 0, jit: 5, d: k * 0.03, dur: 0.22 }); c.burst(hx, hy, BOLT, 2, { spd: 40, life: 0.2 }); }, 4);
      c.fx('shock', { x: x, y: y, r: 38, c: P.volt, c2: P.white, w: 3, dur: 0.45 }); c.burst(x, y, BOLT, 12, { spd: 60, life: 0.3, spread: 30 });
      c.fx('emit', { x: x, y: y, sp: 3, rate: 14, n: 1, dur: 0.5, cols: [P.white, P.frost], o: { up: 24, grav: -20, spd: 5, life: 0.6 } });      // 김
      c.light(x, y, 28, P.volt, 0.6, 0.3).flash(P.white, 0.06).wash(P.arc, 0.05, 0.6).shake(0.2).stop(0.05).boom('thunderBig');
    }
  } });
// T3 ── 천원 운석: 육각 표식과 큰 그림자 → 1초 뒤 큰 운석. 땅이 갈라지고 구덩이가 4초 불탄다
X.reg('xmag_nova', {
  cast: function (c) { c.castPose(P.fire).pose('rise', 0.7, 2.5).sfx('chant').ghost(0, 0, P.fire, 0.4, 0.35); c.fx('sigil', { x: c.ux, y: c.uy, r: 12, c: P.fire, c2: P.flame, sides: 3, dur: 0.8 }); },
  mark: function (c, e) {
    meteorMark(c, e, { r: 34, sh: 22, h: 112, sx: 44, s: 9, fall: 0.4, sides: 6, skip: 2, tr: 6 });
    var x = c.cx, y = c.cy; c.at(e.dur - 0.62, function () { c.fx('drop', { x: x - 0.9, y: y + 0.3, h: 100, sx: 40, head: 'meteor', s: 3, dur: 0.36 }); c.fx('drop', { x: x + 0.8, y: y - 0.4, h: 100, sx: 40, head: 'meteor', s: 3, dur: 0.42, d: 0.06 }); });
  },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('shock', { x: x, y: y, r: 38, c: P.fire, c2: P.flame, w: 3, dust: P.coal, dur: 0.45 }); c.fx('shock', { x: x, y: y, r: 48, c: P.white, w: 1, dur: 0.55, d: 0.1 });
    c.fx('crack', { x: x, y: y, r: 30, n: 8, c: P.fire, dur: 3 }); c.fx('stain', { x: x, y: y, r: 26, c: P.ash, a: 0.4, c2: P.fire, n: 10, dur: 4 });
    flames(c, 8, 0.6); c.spray(x, y, FIRE.concat(['#7a1f1f', '#3a2a22']), 24, -1.5708, 1.4, { spd: 70, grav: 130, life: 0.65, size: 2 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.3, c: P.white, r: 16 });
    c.light(x, y, 28, P.fire, 0.6, 0.6).shake(0.22).stop(0.05).flash(P.flame, 0.06).wash(P.fire, 0.05, 0.7).boom('meteorHit');
  },
  zoneTick: function (c) { var T = c.tiles, k; for (k = 0; k < 3 && T.length; k++) { var t = T[(c.i * 5 + k * 4) % T.length]; c.shape({ k: 'flame', x: t[0], y: t[1], dur: 0.6, d: k * 0.1 }); } c.hits(function (x, y) { c.burst(x, y, FIRE, 2, { up: 24, grav: -16, spd: 8, life: 0.4 }); }, 5); } });
// T4 ── 밤하늘 낙하: 책을 펴면 밤이 내리고, 하늘의 별 하나가 반짝이다 — 푸른 꼬리를 끌고 떨어진다. 빛기둥
// T5 ── 유성우: 별이 여럿 반짝이고, 넷이 차례로 쏟아진 뒤 가장 큰 별이 한가운데에
function nightUp(c, grand) {
  c.dim(grand ? 2.2 : 1.6).wash(P.night, grand ? 0.1 : 0.08, grand ? 2.4 : 1.7).pose('rise', grand ? 1.4 : 1.0, 3).castPose(P.sky).sfx('chant').ghost(0, 0, P.sky, 0.5, 0.4);
  c.fx('book', { x: c.ux, y: c.uy, hgt: 24, c: P.sky, dur: grand ? 1.8 : 1.2 }); c.fx('sigil', { x: c.ux, y: c.uy, r: 13, c: P.sky, c2: P.white, sides: 5, skip: 2, dur: 1.0 });
}
function starHit(c, x, y, big, grand) {
  var r = big ? (grand ? 44 : 38) : 16;
  c.fx('shock', { x: x, y: y, r: r, c: P.sky, c2: P.white, w: big ? 3 : 2, dur: big ? 0.5 : 0.35 });
  if (!big) { c.burst(x, y, STAR, 8, { spd: 44, up: 14, life: 0.4 }); c.shape({ k: 'flame', x: x, y: y, dur: 0.45 }); c.light(x, y, 20, P.sky, 0.5, 0.3).shake(0.12).sfx('emberPop'); return; }
  c.fx('column', { x: x, y: y, w: grand ? 11 : 9, h: 96, c: P.sky, c2: P.white, a: 0.7, dur: 0.4 }); c.fx('shock', { x: x, y: y, r: r + 10, c: P.white, w: 1, dur: 0.6, d: 0.1 });
  c.fx('crack', { x: x, y: y, r: 28, n: 8, c: P.sky, dur: 3 }); c.fx('stain', { x: x, y: y, r: 26, c: '#12142a', a: 0.36, c2: P.sky, n: 12, dur: grand ? 4.5 : 3.5 });
  c.spray(x, y, STAR, grand ? 34 : 28, -1.5708, 1.5, { spd: 80, grav: 90, life: 0.7, size: 2 }); flames(c, grand ? 6 : 4, 0.6);
  c.shape({ k: 'impact', x: x, y: y, dur: 0.32, c: P.white, r: 18 });
  c.light(x, y, 44, P.sky, 0.85, 0.7).shake(grand ? 0.45 : 0.3).stop(grand ? 0.09 : 0.07).flash(P.white, grand ? 0.1 : 0.08).boom('meteorHit');
  if (grand) { c.fx('shock', { x: x, y: y, r: 60, c: P.sky, w: 1, dur: 0.8, d: 0.2 }); c.fx('emit', { x: x, y: y, sp: 4, rate: 12, n: 1, dur: 1.2, cols: STAR, o: { up: 26, grav: -12, spd: 5, life: 0.9 } }); }
}
X.reg('u_skyfire', {
  cast: function (c) { nightUp(c, false); },
  mark: function (c, e) {
    var x = c.cx, y = c.cy; c.fx('star', { x: x - 1.2, y: y - 6.2, s: 5, c: P.star, dur: 0.7 }); c.sfx('starFall');
    meteorMark(c, e, { r: 34, sh: 20, h: 124, sx: -22, s: 6, head: 'star', hc: P.star, hc2: P.sky, c: P.sky, c2: P.white, sides: 5, skip: 2, fall: 0.38, tr: 7, snd: 'starFall' });
    c.at(e.dur - 0.5, function () { c.streak(6, 1.5708, P.star, 0.6, 0.25); });
  },
  beat: function (c) { starHit(c, c.cx, c.cy, true, false); } });
X.reg('ux_skyfire', {
  cast: function (c) { nightUp(c, true); },
  mark: function (c, e) {
    var x = c.cx, y = c.cy, T = e.dur, B = c.S.beats, k, pts = c.pts = [], off = [[-1.1, -0.5], [0.9, 0.6], [-0.6, 0.9], [1.0, -0.8]];
    for (k = 0; k < 6; k++) c.fx('star', { x: x - 2.4 + k * 0.95, y: y - 5.2 - (k % 3) * 0.7, s: 3 + (k % 2) * 2, c: k % 2 ? P.star : P.flame, dur: 0.6, d: k * 0.09 });
    c.sfx('starFall');
    c.fx('sigil', { x: x, y: y, r: 36, c: P.sky, c2: P.white, sides: 5, skip: 2, dur: T + B[B.length - 1] + 0.2, spin: 1.2 }); c.fx('sigil', { x: x, y: y, r: 44, c: P.star, sides: 0, runes: 8, dur: T + B[B.length - 1] + 0.2, spin: -0.8 });
    c.fx('shadow', { x: x, y: y, r: 24, dur: T + B[B.length - 1] });
    for (k = 0; k < 4; k++) (function (k) {      // 작은 별 넷: 박자마다 다른 칸에 (닿는 때가 박자와 맞게 미리 띄운다)
      var p = [x + off[k][0], y + off[k][1]]; pts.push(p);
      c.at(T + B[k] - 0.3, function () { c.fx('drop', { x: p[0], y: p[1], h: 110, sx: k % 2 ? 30 : -26, head: k % 2 ? 'meteor' : 'star', s: 4, c: k % 2 ? P.fire : P.star, c2: k % 2 ? P.coal : P.sky, tr: 5, dur: 0.3 }); if (k === 0) c.streak(12, 1.9, P.star, 1.3, 0.25); });
    })(k);
    c.at(T + B[4] - 0.42, function () { c.sfx('fallWhistle'); c.fx('drop', { x: x, y: y, h: 130, sx: -18, head: 'star', s: 8, c: P.star, c2: P.sky, tr: 8, dur: 0.42 }); });
  },
  beat: function (c, i, last) { var p = !last && c.pts && c.pts[i] ? c.pts[i] : [c.cx, c.cy]; starHit(c, p[0], p[1], last, true); if (last) c.wash(P.sky, 0.1, 0.8); } });
// T4 ── 적어 둔 주문: 머리 위에 책이 펴지고 룬이 줄지어 대상에게 날아간다 → 보랏빛 벼락, 곁으로 옮겨 간다
// T5 ── 금단의 주문: 세 줄을 읽는다. 줄마다 대상 발밑의 마법진이 한 겹씩 커지고, 셋째 줄은 하늘에서 기둥이 내린다
function runes(c, n, t0, gap, dur) {
  for (var k = 0; k < n; k++) (function (k) { c.at(t0 + k * gap, function () { c.fx('orb', { x: c.ux, y: c.uy - 1.5, x1: c.cx, y1: c.cy - 0.3, h: (k % 2 ? 6 : -4), head: 'rune', ri: k, c: k % 2 ? P.arc : P.white, c2: P.deeparc, s: 2, dur: dur, tr: 2 }); if (k % 2 === 0) c.sfx('runeTick'); }); })(k);
}
function verse(c, i, last, grand) {
  var x = c.cx, y = c.cy, bx = c.ux, by = c.uy - 1.5;
  zapTo(c, bx, by, x, y, P.arc, last ? 4 : 3, { fork: 1, jit: 5, h0: 0, h1: 3, dur: 0.26 });
  c.shape({ k: 'impact', x: x, y: y, dur: 0.26, c: P.white, r: last ? 15 : 10 }); c.burst(x, y, ARC, last ? 18 : 10, { spd: 54, life: 0.3 });
  c.fx('sigil', { x: x, y: y, r: 14 + i * 7, c: P.arc, c2: P.white, sides: 6, skip: 2, dur: 0.8, spin: i % 2 ? -1.5 : 1.5 });
  c.light(x, y, 36, P.arc, 0.7, 0.3).light(bx, by, 16, P.arc, 0.5, 0.25);
  if (!last) { c.flash(P.arc, 0.05).shake(0.14 + i * 0.06).boom('zap'); if (grand) runes(c, 3, 0.08, 0.06, 0.2); return; }
  c.fx('shock', { x: x, y: y, r: grand ? 40 : 28, c: P.arc, c2: P.white, w: 3, dur: 0.5 }); c.fx('crack', { x: x, y: y, r: grand ? 22 : 14, n: 7, c: P.arc, dur: 2.6 });
  c.fx('column', { x: x, y: y, w: grand ? 8 : 5, h: grand ? 96 : 60, c: P.arc, c2: P.white, a: 0.6, dur: 0.3 });
  c.shake(grand ? 0.45 : 0.28).stop(grand ? 0.09 : 0.07).flash(P.white, grand ? 0.1 : 0.08).wash(P.deeparc, grand ? 0.1 : 0.06, grand ? 1.0 : 0.6).boom('thunderBig');
  if (grand) {
    zapTo(c, x - 0.5, y, x - 0.1, y, P.arc, 3, { h0: 90, h1: 0, jit: 7, dur: 0.24, d: 0.04 }); zapTo(c, x + 0.6, y, x + 0.1, y, P.volt, 2, { h0: 90, h1: 0, jit: 7, dur: 0.24, d: 0.08 });
    c.fx('shock', { x: x, y: y, r: 56, c: P.white, w: 1, dur: 0.7, d: 0.15 }); c.fx('stain', { x: x, y: y, r: 22, c: '#1a1030', a: 0.5, c2: P.arc, n: 10, dur: 4 });
    c.fx('emit', { x: x, y: y - 0.3, sp: 3, rate: 14, n: 1, dur: 1.2, cols: ARC, o: { up: 28, grav: -14, spd: 5, life: 0.9 } }); c.streak(10, -1.5708, P.arc, 0.6, 0.25);
  }
}
function bookUp(c, grand) {
  c.dim(grand ? 1.8 : 1.0).castPose(P.arc).pose('rise', grand ? 1.5 : 0.8, 3).sfx('chant').ghost(0, 0, P.arc, 0.5, 0.4);
  c.fx('book', { x: c.ux, y: c.uy, hgt: 24, c: P.arc, dur: grand ? 1.7 : 1.0 }); c.fx('sigil', { x: c.ux, y: c.uy, r: 13, c: P.arc, c2: P.white, sides: 6, skip: 2, dur: grand ? 1.6 : 0.9 });
  runes(c, grand ? 4 : 6, 0.08, 0.045, grand ? 0.2 : 0.22);
  if (grand) c.wash(P.deeparc, 0.06, 1.6);
}
X.reg('u_spellbook', { cast: function (c) { bookUp(c, false); }, beat: function (c, i, last) { verse(c, i, last, false); }, chain: chainZap(P.arc) });
X.reg('ux_spellbook', { cast: function (c) { bookUp(c, true); }, beat: function (c, i, last) { verse(c, i, last, true); }, chain: chainZap(P.arc) });
// T4 ── 서리 감옥: 서리가 땅을 덮어 오다가 — 둘레에 얼음 기둥이 솟아 가둔다. 기둥은 감옥이 다할 때까지 서 있다가 깨진다
// T5 ── 영겁의 서리: 시계 눈금 같은 마법진, 한가운데에 큰 수정. 눈이 내리고, 다하면 모두 깨지며 한 번 더 친다
function jailUp(c, grand) {
  c.dim(grand ? 1.5 : 1.0).wash(P.deepice, grand ? 0.1 : 0.07, grand ? 1.6 : 1.0).castPose(P.ice).pose('rise', 0.7, 2.5).sfx('freeze').ghost(0, 0, P.ice, 0.4, 0.4);
  c.fx('stain', { x: c.cx, y: c.cy, r: 36, c: P.ice, a: 0.28, c2: P.white, n: 12, grow: 1, dur: grand ? 6.6 : 5.6 });
  c.fx('sigil', { x: c.cx, y: c.cy, r: 36, c: P.frost, c2: P.white, sides: grand ? 6 : 0, skip: 2, runes: grand ? 12 : 6, dur: grand ? 1.6 : 1.0, spin: grand ? 0.3 : 0.9 });
  c.burst(c.cx, c.cy, ICE, 10, { spd: 10, grav: -6, life: 0.6, spread: 60 });
}
function jail(c, grand) {
  var x = c.cx, y = c.cy, D = c.S.zone.dur, k = 0, cxr = Math.round(x), cyr = Math.round(y);
  c.each(function (tx, ty, i, d) {      // 둘레(가운데에서 2칸)의 칸마다 얼음 기둥 — 감옥이 다할 때까지 서 있다
    if (Math.abs(tx - cxr) + Math.abs(ty - cyr) !== 2) return;
    c.fx('spike', { x: tx + c.rnd(0.15), y: ty + 0.15, h: 15 + (k % 3) * 3, w: 5, c: ICEC, lean: (tx - x) * 1.2, up: 0.03, d: k * 0.02, dur: D + 0.15 }); k++;
  }, 13);
  if (grand) c.fx('spike', { x: x, y: y + 0.2, h: 34, w: 11, c: ICEC, up: 0.03, dur: D + 0.15 });
  c.hits(function (hx, hy, i) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.white, r: 8 }); c.spray(hx, hy, ICE, 3, -1.5708, 1.2, { spd: 36, grav: 80, life: 0.4, size: 2 }); }, 6);
  c.fx('shock', { x: x, y: y, r: 38, c: P.ice, c2: P.white, w: 3, dur: 0.45 }); c.burst(x, y, ICE, grand ? 22 : 16, { spd: 60, grav: 50, life: 0.5, spread: 20, size: 2 });
  c.light(x, y, 40, P.ice, 0.7, 0.5).shake(grand ? 0.4 : 0.26).stop(grand ? 0.08 : 0.06).flash(P.frost, grand ? 0.1 : 0.07).boom('iceBreak').sfx('freeze');
  if (grand) { c.fx('column', { x: x, y: y, w: 9, h: 90, c: P.ice, c2: P.white, a: 0.5, dur: 0.4 }); c.fx('shock', { x: x, y: y, r: 54, c: P.white, w: 1, dur: 0.7, d: 0.12 }); c.fx('emit', { x: x, y: y - 3.2, sp: 4.5, rate: 6, n: 1, dur: D, cols: [P.white, P.frost], o: { up: -14, grav: 6, spd: 5, life: 1.6 } }); }      // 눈
}
function jailTick(c) { c.hits(function (x, y, i) { c.ring(x, y, 8, P.ice, { inv: true, dur: 0.35 }); c.burst(x, y - 0.2, ICE, 2, { up: 10, grav: 30, spd: 10, life: 0.4 }); }, 6); c.sfx('runeTick'); }
function jailEnd(c, grand) {
  var x = c.cx, y = c.cy;
  c.each(function (tx, ty, i, d) { if (i % 2 === 0) c.spray(tx, ty, ICE, 3, -1.5708, 1.4, { spd: 46, grav: 110, life: 0.5, size: 2 }); }, 13);
  c.fx('shock', { x: x, y: y, r: 40, c: P.frost, c2: P.white, w: 2, dur: 0.45 }); c.boom('iceBreak');
  if (grand) { c.burst(x, y, ICE, 16, { spd: 70, grav: 60, life: 0.55, size: 2 }); c.hits(function (hx, hy) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.24, c: P.white, r: 9 }); }, 6); c.light(x, y, 28, P.ice, 0.6, 0.4).shake(0.22).flash(P.frost, 0.06); }
}
X.reg('u_icejail', { cast: function (c) { jailUp(c, false); }, beat: function (c) { jail(c, false); }, zoneTick: jailTick, zoneEnd: function (c) { jailEnd(c, false); } });
X.reg('ux_icejail', { cast: function (c) { jailUp(c, true); }, beat: function (c) { jail(c, true); }, zoneTick: jailTick, zoneEnd: function (c) { jailEnd(c, true); } });
})();
