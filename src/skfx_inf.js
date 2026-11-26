// 전민 — 기술 연출: 보병 (방패의 벽 · 무게 · 충격). 틀과 쓰는 법은 src/skfx.js · docs/SKILL_FX.md.
//   이 파일이 맡는 기술: cmd_inf · inf_bash · inf_wall · inf_cover (T1~T2) · xinf_bash · xinf_aegis · xinf_quake (T3) · u_bastion · u_ram · u_riposte (T4) · ux_* 셋 (T5)
//   기술 표(효과 · 박자 · 설명)의 고침도 여기서 한다 (X.def) — data.js · rise.js 의 줄은 그대로 둔다.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var X = DS.skfx; if (!X) return;
// 보병의 빛깔: 강철빛 푸른 방패 · 흰 쇠 불티 · 흙먼지. 윗길(T3~)부터 금테가 붙는다
var P = X.PAL.inf = { steel: '#cfe3ff', white: '#ffffff', blue: '#5b8fd6', deep: '#2f4f8a', iron: '#8f9ab3', dust: '#d8c39a', earth: '#a8754a', dirt: '#6f4a2c', gold: '#f6cf57', pale: '#fff6d0' };
var SPARK = [P.white, P.steel, P.pale], DUST = [P.dust, P.earth, P.dirt], STEEL = [P.steel, P.white, P.blue], GOLD = [P.gold, P.pale, P.white];
var ROCK = [P.dust, P.earth, P.dirt];

// ───────── 기술 표 ─────────
// 방패 올려!: 효과는 그대로. 설명의 긴 줄표만 걷는다
X.def('cmd_inf', { desc: '호령. 모든 아군의 방어 +15% (25초). 둘레 2칸 적은 6초 동안 나를 노린다.' });
// 방패 치기: 방패를 당겼다 치는 짧은 뜸(0.16초)이 생긴다. 수치는 그대로
X.def('inf_bash', { beats: [0.16] });
// 수호: 던진 방패가 닿을 때(0.14초) 보호막이 걸린다. 수치는 그대로
X.def('inf_cover', { beats: [0.14] });
// 성벽 강타: 한 번(300%) → 밀치기 125% + 내리찍기 185% 의 두 박자 (방어는 맞을 때마다 빠지므로 합을 조금 올려 받는 피해를 같게 — tools/skdmg.js)
X.def('xinf_bash', { beats: [0.18, 0.5],
  eff: [{ t: 'dmg', m: 1.25 }, { t: 'taunt', dur: 8 }, { t: 'dmg', m: 1.85, b: 1 }, { t: 'gauge', v: -40, b: 1 }, { t: 'buff', s: 'shd', m: 0.8, stat: 'atk', dur: 10, to: 'self', b: 1 }],
  desc: '붙은 적을 방패로 밀치고(125%) 성벽처럼 내리찍는다(185%). 게이지를 깎고 8초 동안 나를 노리게 한다. 내게 보호막(공격의 80%).' });
// 불괴의 방진: 한 번 걸고 끝(보호막 140% · 방어 +30% 15초) → 10초 서 있는 방진. 걸 때 보호막 100%, 안에 선 동안 방어 +30% 와 2.5초마다 보호막을 25%까지 되찾는다
X.def('xinf_aegis', {
  eff: [{ t: 'buff', s: 'shd', m: 1.0, stat: 'atk', dur: 15 }, { t: 'taunt', to: 'foe', r: 3, dur: 8 }],
  zone: { dur: 10, every: 2.5, k: 'wall', to: 'ally', eff: [{ t: 'buff', s: 'def', p: 30, dur: 3.5 }, { t: 'buff', s: 'shd', m: 0.25, stat: 'atk', dur: 8 }] },
  desc: '둘레 2칸에 10초 동안 방진을 친다. 아군에게 보호막(공격의 100%), 둘레 3칸 적은 나를 노린다. 방진 안의 아군은 방어 +30%, 2.5초마다 보호막을 공격의 25%까지 되찾는다.' });
// 성벽 붕괴: 한 번(220%) → 내리침 150% + 무너짐 85% 의 두 박자 (받는 피해는 그대로)
X.def('xinf_quake', { beats: [0.3, 0.62],
  eff: [{ t: 'dmg', m: 1.5 }, { t: 'gauge', v: -40 }, { t: 'dmg', m: 0.85, b: 1 }, { t: 'knock', n: 1, b: 1 }, { t: 'status', s: 'slow', dur: 8, b: 1 }],
  desc: '방패로 땅을 내리쳐 둘레 2칸 적에게 150%, 게이지를 깎는다. 곧이어 땅이 무너지며 85%, 밀어내고 둔화.' });
// 성문 부수기 · 성문 파쇄: 크게 당겼다 치는 한 방 (문은 두 번 두드리지 않는다). 파쇄는 부서진 조각이 곁의 적에게 60% (새로 붙은 것 — 대상이 받는 440% 는 그대로)
X.def('u_ram', { beats: [0.42] });
X.def('ux_ram', { beats: [0.5],
  eff: [{ t: 'dmg', m: 3.8 }, { t: 'dmg', m: 0.6, to: 'foe', at: 'tgt', r: 1 }, { t: 'gauge', v: -80 }, { t: 'knock', n: 3 }],
  desc: '붙은 적 하나에 440%, 게이지를 크게 깎고 3칸 밀어낸다. 부서진 문 조각이 곁의 적에게 60%.' });
// 반격의 회오리: 한 번(190%) → 두 번 휩쓴다 100% + 105%. 강철 회오리: 한 번(250%) → 세 번 80% + 90% + 110% (받는 피해는 그대로)
X.def('u_riposte', { beats: [0.2, 0.5],
  eff: [{ t: 'dmg', m: 1.0 }, { t: 'dmg', m: 1.05, b: 1 }, { t: 'knock', n: 1, b: 1 }, { t: 'buff', s: 'ctr', p: 100, dur: 10, to: 'self', b: 1 }],
  desc: '둘레 모든 적을 두 번 휩쓴다. 100%, 이어서 105%와 밀어내기. 10초 동안 붙어 때린 적을 100%로 되친다.' });
X.def('ux_riposte', { beats: [0.2, 0.48, 0.8],
  eff: [{ t: 'dmg', m: 0.8 }, { t: 'dmg', m: 0.9, b: 1 }, { t: 'dmg', m: 1.1, b: 2 }, { t: 'knock', n: 1, b: 2 }, { t: 'buff', s: 'ctr', p: 120, dur: 12, to: 'self', b: 2 }],
  desc: '둘레 2칸 모든 적을 세 번 휩쓴다. 80%, 90%, 110%. 마지막에 밀어낸다. 12초 동안 붙어 때린 적을 120%로 되친다.' });
// 천년 성벽: 걸 때 보호막 220% → 180%, 대신 성벽이 12초 서서 안의 아군이 3초마다 보호막을 40%까지 되찾는다
X.def('ux_bastion', {
  eff: [{ t: 'buff', s: 'def', p: 70, dur: 16 }, { t: 'buff', s: 'shd', m: 1.8, stat: 'atk', dur: 16 }, { t: 'taunt', to: 'foe', r: 4, dur: 10 }],
  zone: { dur: 12, every: 3, k: 'gold', to: 'ally', eff: [{ t: 'buff', s: 'shd', m: 0.4, stat: 'atk', dur: 8 }] },
  desc: '둘레 2칸 아군의 방어 +70%, 보호막(공격의 180%, 16초). 둘레 4칸 적은 나를 노린다. 성벽이 12초 서 있고, 그 안의 아군은 3초마다 보호막을 공격의 40%까지 되찾는다.' });

// ───────── 연출 ─────────
function sparks(c, x, y, n, sp) { c.burst(x, y, SPARK, n, { spd: sp || 34, life: 0.22 }); }
function dust(c, x, y, n) { c.burst(x, y + 0.3, DUST, n, { up: 16, grav: 70, spd: 20, life: 0.45, spread: 10 }); }
// 둘레에 서는 방패 벽: n 장이 차례로 솟는다 (r = 반지름 픽셀 · gap = 한 장마다의 늦춤)
function wallRing(c, x, y, r, n, o) {
  for (var i = 0; i < n; i++) {
    var a = i / n * 6.2832 - 1.5708;
    c.fx('shield', { x: x + Math.cos(a) * r / 16, y: y + Math.sin(a) * r * 0.55 / 16 + 0.1, s: o.s || 1, tower: 1, rise: 1, c: o.c || P.blue, c2: o.c2 || P.steel, d: (o.d || 0) + i * (o.gap || 0.05), dur: o.dur || 1.2 });
  }
}

// T1 ── 방패 올려! (호령): 외침의 고리가 퍼지고, 아군 머리 위로 작은 방패가 하나씩 선다
X.reg('cmd_inf', { cast: function (c) {
  c.castPose(P.steel).pose('rise', 0.3, 1.5).sfx('shout').ring(c.ux, c.uy, 13, P.steel, { dur: 0.35 });
  c.each(function (x, y, i, d) { c.fx('shield', { x: x, y: y - 0.85, s: 0.5, rise: 1, c: P.blue, c2: P.steel, d: 0.06 + Math.min(0.2, d * 0.04), dur: 0.55 }); c.burst(x, y - 0.4, [P.steel, P.blue], 2, { up: 22, grav: -16, spd: 5, life: 0.5 }); }, 7);
} });
// T1 ── 방패 치기: 방패를 당겼다가 — 방패 모양의 충격이 찍힌다
X.reg('inf_bash', {
  cast: function (c) { c.pose('back', 0.34, 3); },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('shield', { x: x - c.dx * 0.3, y: y - c.dy * 0.3 - 0.1, s: 1, c: P.blue, c2: P.steel, pop: 0.2, dur: 0.24 });
    c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 7 }).ring(x, y, 9, P.steel, { dur: 0.25 });
    sparks(c, x, y, 7); c.lunge().light(x, y, 14, P.steel, 0.35, 0.2).boom('shieldSlam');
  } });
// T2 ── 철벽: 큰 방패 셋이 내리꽂혀 몸 앞을 막는다. 발밑이 갈라진다
X.reg('inf_wall', { cast: function (c) {
  var x = c.ux, y = c.uy, f = c.u.face < 0 ? -1 : 1, at = [[0.62, 0.12], [0.42, -0.4], [0.42, 0.55]];
  c.pose('sink', 0.4, 3).boom('wallUp');
  at.forEach(function (p, k) {
    c.fx('shield', { x: x + f * p[0], y: y + p[1], s: 1, tower: 1, fall: 13, c: P.blue, c2: P.steel, d: k * 0.07, dur: 1.0 });
    c.at(0.1 + k * 0.07, function () { dust(c, x + f * p[0], y + p[1], 4); if (k === 0) { c.shake(0.1); c.fx('shock', { x: x, y: y, r: 17, c: P.steel, dust: P.dust, dur: 0.35 }); c.fx('crack', { x: x + f * 0.4, y: y, r: 9, n: 4, dur: 1.6 }); } });
  });
  c.ring(x, y, 15, P.steel, { inv: true, w: 2, dur: 0.4, d: 0.25 }).light(x, y, 20, P.steel, 0.45, 0.5);
} });
// T2 ── 수호: 방패를 던진다 → 아군 앞에 방패가 서고 둥근 지붕이 덮인다
X.reg('inf_cover', {
  cast: function (c) { c.pose('back', 0.3, 2).sfx('shieldUp'); c.fx('orb', { x: c.ux, y: c.uy - 0.2, x1: c.cx, y1: c.cy - 0.2, h: 5, head: 'shield', s: 0.75, c: P.blue, c2: P.steel, dur: 0.14, tr: 3 }); },
  beat: function (c) {
    var x = c.cx, y = c.cy;
    c.fx('shield', { x: x, y: y - 0.15, s: 1.5, rise: 1, c: P.blue, c2: P.steel, dur: 0.7 });
    c.fx('dome', { x: x, y: y, r: 11, c: P.steel, dur: 0.85 });
    c.ring(x, y, 12, P.blue, { w: 2, dur: 0.4 }).line(c.ux, c.uy, x, y, P.steel, { dur: 0.22 });
    c.burst(x, y, STEEL, 8, { up: 24, grav: -18, spd: 8, life: 0.6 }).light(x, y, 18, P.steel, 0.45, 0.5).boom('guard');
  } });
// T3 ── 성벽 강타: 밀치기 → 뛰어올라 큰 방패로 내리찍는다 (땅이 갈라진다)
X.reg('xinf_bash', {
  cast: function (c) { c.pose('back', 0.36, 3).ghost(-c.dx * 0.3, -c.dy * 0.3, P.blue, 0.3, 0.45); },
  beat: function (c, i) {
    var x = c.cx, y = c.cy;
    if (i === 0) {
      c.fx('shield', { x: x - c.dx * 0.3, y: y - c.dy * 0.3 - 0.1, s: 1, c: P.blue, c2: P.gold, pop: 0.2, dur: 0.24 });
      c.shape({ k: 'impact', x: x, y: y, dur: 0.2, c: P.white, r: 7 }); sparks(c, x, y, 6); c.lunge().shake(0.08).sfx('shieldSlam');
      c.pose('hop', 0.32, 6);
      c.at(0.2, function () { c.fx('shield', { x: x, y: y - 0.35, s: 2, tower: 1, fall: 20, c: P.blue, c2: P.gold, dur: 0.5 }); });      // 0.12초 뒤(둘째 박자)에 닿는다
      return;
    }
    c.fx('shock', { x: x, y: y, r: 22, c: P.steel, w: 2, dust: P.dust, dur: 0.4 }); c.fx('crack', { x: x, y: y, r: 13, n: 6, dur: 2.2 });
    c.spray(x, y, ROCK, 12, -1.5708, 1.1, { spd: 50, grav: 160, life: 0.5, size: 2 }); sparks(c, x, y - 0.2, 10, 44);
    c.shape({ k: 'impact', x: x, y: y, dur: 0.26, c: P.white, r: 12 }).light(x, y, 26, P.steel, 0.6, 0.35);
    c.shake(0.2).stop(0.05).flash(P.steel, 0.05).boom('quakeHit');
    c.at(0.1, function () { c.fx('dome', { x: c.ux, y: c.uy, r: 9, c: P.gold, dur: 0.6 }); });      // 내 보호막
  } });
// T3 ── 불괴의 방진: 방패 여섯이 둘레에 서고, 그 땅이 10초 동안 방진으로 남는다
X.reg('xinf_aegis', {
  cast: function (c) {
    var x = c.ux, y = c.uy;
    c.pose('sink', 0.5, 3).boom('wallUp').ghost(0, 0, P.steel, 0.4, 0.4);
    c.fx('sigil', { x: x, y: y, r: 31, c: P.steel, c2: P.gold, sides: 4, dur: 1.4, spin: 0.5 });
    wallRing(c, x, y, 34, 6, { s: 1, c2: P.gold, dur: 1.3, gap: 0.05 });
    c.at(0.35, function () { c.fx('dome', { x: x, y: y, r: 33, c: P.steel, c2: P.gold, dur: 0.9 }); c.fx('shock', { x: x, y: y, r: 36, c: P.steel, dur: 0.45 }); c.shake(0.14).flash(P.steel, 0.04).sfx('guard'); c.burst(x, y, STEEL, 14, { up: 30, grav: -20, spd: 14, life: 0.7, spread: 30 }); });
    c.light(x, y, 28, P.steel, 0.5, 0.8);
  },
  zoneTick: function (c) {
    c.fx('shock', { x: c.cx, y: c.cy, r: 34, c: P.steel, w: 1, dur: 0.5 });
    c.hits(function (x, y) { c.fx('shield', { x: x, y: y - 0.85, s: 0.5, rise: 1, c: P.blue, c2: P.gold, dur: 0.5 }); c.burst(x, y - 0.3, [P.steel, P.gold], 2, { up: 20, grav: -14, spd: 4, life: 0.5 }); }, 6);
    c.sfx('shieldUp');
  } });
// T3 ── 성벽 붕괴: 뛰어올라 방패로 땅을 찍는다 → 금이 퍼지고, 한 박자 뒤 바위가 솟으며 무너진다
X.reg('xinf_quake', {
  cast: function (c) {
    c.pose('hop', 0.36, 7).ghost(0, -0.2, P.blue, 0.3, 0.4);
    c.at(0.2, function () { c.fx('shield', { x: c.ux + (c.u.face < 0 ? -0.4 : 0.4), y: c.uy + 0.15, s: 1.4, tower: 1, fall: 12, c: P.blue, c2: P.gold, dur: 0.7 }); });
  },
  beat: function (c, i) {
    var x = c.ux, y = c.uy;
    if (i === 0) {
      c.fx('shock', { x: x, y: y, r: 38, c: P.steel, w: 3, dust: P.dust, dur: 0.45 }); c.fx('crack', { x: x, y: y, r: 30, n: 8, dur: 2.4 });
      c.spray(x, y, ROCK, 12, -1.5708, 1.3, { spd: 54, grav: 170, life: 0.55, size: 2 });
      c.each(function (tx, ty, k, d) { if (d > 0.5) c.at(d * 0.05, function () { dust(c, tx, ty, 1); }); }, 12);
      c.light(x, y, 28, P.steel, 0.6, 0.4).shake(0.22).stop(0.05).flash(P.steel, 0.05).boom('quakeHit');
      return;
    }
    c.hits(function (hx, hy, k) { c.fx('spike', { x: hx + c.rnd(0.2), y: hy + 0.1, h: 12, w: 6, c: ROCK, lean: c.rnd(2), dur: 0.55 }); if (k < 4) c.spray(hx, hy, ROCK, 3, -1.5708, 0.8, { spd: 40, grav: 150, life: 0.4 }); }, 6);
    c.fx('shock', { x: x, y: y, r: 42, c: P.dust, c2: P.earth, w: 2, dust: P.dirt, dur: 0.5 }); c.fx('stain', { x: x, y: y, r: 26, c: P.dirt, a: 0.22, dur: 2.2 });
    c.shake(0.16).sfx('boom');
  } });
// T4 ── 불락 성벽: 네모난 성터가 그려지고, 방패 여덟이 차례로 솟아 벽이 된다. 다 서면 지붕이 덮인다
function bastion(c, grand) {
  var x = c.ux, y = c.uy, n = grand ? 10 : 8, R = grand ? 38 : 34, T = n * 0.05 + 0.15;
  c.dim(grand ? 1.3 : 0.9).pose('sink', 0.5, 3).boom('wallUp').ghost(0, 0, grand ? P.gold : P.steel, 0.5, 0.45);
  c.fx('sigil', { x: x, y: y, r: R - 2, c: P.steel, c2: P.gold, sides: 4, dur: grand ? 2.4 : 1.8, spin: 0.4 });
  if (grand) c.fx('sigil', { x: x, y: y, r: R + 8, c: P.gold, c2: P.white, sides: 8, skip: 3, dur: 2.4, spin: -0.3, d: 0.1 });
  wallRing(c, x, y, R, n, { s: grand ? 1.25 : 1, c2: P.gold, dur: grand ? 2.0 : 1.6, gap: 0.05 });
  if (grand) wallRing(c, x, y, 18, 6, { s: 1, c: P.deep, c2: P.gold, dur: 1.8, gap: 0.04, d: 0.12 });
  for (var k = 0; k < n; k += 2) (function (k) { var a = k / n * 6.2832 - 1.5708; c.at(0.08 + k * 0.05, function () { dust(c, x + Math.cos(a) * R / 16, y + Math.sin(a) * R * 0.55 / 16, 3); }); })(k);
  c.at(T, function () {
    c.fx('dome', { x: x, y: y, r: R + 2, c: grand ? P.gold : P.steel, c2: P.white, dur: grand ? 1.4 : 1.0 });
    c.fx('shock', { x: x, y: y, r: R + 6, c: P.steel, c2: P.gold, w: 3, dur: 0.5 });
    c.who(true, function (ax, ay) { c.fx('shield', { x: ax, y: ay - 0.9, s: 0.5, rise: 1, c: P.blue, c2: P.gold, dur: 0.7 }); c.burst(ax, ay - 0.3, GOLD, 3, { up: 26, grav: -18, spd: 5, life: 0.6 }); }, 6);
    c.burst(x, y, grand ? GOLD : STEEL, grand ? 26 : 18, { up: 34, grav: -22, spd: 18, life: 0.8, spread: 36 });
    c.light(x, y, 40, grand ? P.gold : P.steel, 0.75, 0.9).shake(grand ? 0.34 : 0.24).stop(0.06).flash(grand ? P.gold : P.steel, grand ? 0.09 : 0.06).wash(grand ? P.gold : P.blue, grand ? 0.09 : 0.06, grand ? 1.4 : 1.0).sfx('guard');
    if (grand) { c.fx('column', { x: x, y: y, w: 8, h: 90, c: P.gold, c2: P.white, a: 0.6, dur: 0.6 }); c.streak(10, -1.5708, P.gold, 0.7, 0.28); c.fx('emit', { x: x, y: y - 0.5, sp: 3.5, rate: 14, n: 1, dur: 1.4, cols: GOLD, o: { up: 26, grav: -14, spd: 4, life: 0.9 } }); }
  });
}
X.reg('u_bastion', { cast: function (c) { bastion(c, false); } });
// T5 ── 천년 성벽: 두 겹의 벽과 금빛 기둥. 성벽이 12초 서 있다 (맥박마다 금빛 고리가 번지고 방패가 다시 선다)
X.reg('ux_bastion', {
  cast: function (c) { bastion(c, true); },
  zoneTick: function (c) {
    c.fx('shock', { x: c.cx, y: c.cy, r: 36, c: P.gold, c2: P.white, w: 2, dur: 0.6 });
    c.hits(function (x, y) { c.fx('shield', { x: x, y: y - 0.85, s: 0.5, rise: 1, c: P.blue, c2: P.gold, dur: 0.6 }); c.burst(x, y - 0.3, GOLD, 3, { up: 22, grav: -14, spd: 4, life: 0.6 }); }, 6);
    c.sfx('shieldUp');
  } });
// T4 ── 성문 부수기: 길게 당겼다가(잔상 · 바람 줄기) — 성문이 하얗게 번쩍하고 조각난다
function ram(c, i, grand) {
  var x = c.cx, y = c.cy, a = c.ang, g1 = grand ? P.gold : P.steel;
  c.fx('gate', { x: x, y: y, c: P.iron, c2: P.earth, dur: 0.5 });
  if (grand) c.fx('gate', { x: x + c.dx * 0.5, y: y + c.dy * 0.5, c: P.gold, c2: P.dirt, dur: 0.6, d: 0.05 });
  c.fx('shield', { x: x - c.dx * 0.35, y: y - c.dy * 0.35 - 0.15, s: grand ? 2.5 : 2, c: P.blue, c2: P.gold, pop: 0.25, dur: 0.34 });
  c.shape({ k: 'impact', x: x, y: y, dur: 0.3, c: P.white, r: grand ? 18 : 14 });
  c.fx('shock', { x: x, y: y, r: grand ? 32 : 26, c: g1, w: 3, dust: P.dust, dur: 0.45 }); c.fx('crack', { x: x, y: y, r: grand ? 24 : 16, n: grand ? 9 : 7, c: grand ? P.gold : null, dur: 2.6 });
  if (grand) c.fx('shock', { x: x, y: y, r: 46, c: P.white, w: 2, dur: 0.6, d: 0.12 });
  c.spray(x, y, [P.iron, P.earth, P.dirt, P.steel], grand ? 34 : 24, a, 0.7, { spd: grand ? 90 : 74, grav: 60, life: 0.6, size: 2 });      // 문 조각이 밀려난 쪽으로 튄다
  sparks(c, x, y, grand ? 16 : 12, 54);
  c.fx('beam', { x0: x, y0: y + 0.2, x1: x + c.dx * (grand ? 3 : 2), y1: y + c.dy * (grand ? 3 : 2) + 0.2, w: 3, c: P.dust, c2: P.pale, dur: 0.35 });      // 날아간 길의 먼지
  c.lunge().light(x, y, grand ? 44 : 36, g1, 0.8, 0.45).shake(grand ? 0.45 : 0.32).stop(grand ? 0.09 : 0.07).flash(P.white, grand ? 0.1 : 0.08).boom('quakeHit').sfx('shieldSlam');
  if (grand) {
    c.near(Math.round(x), Math.round(y), 1, function (nx, ny, k, w) { if (Math.abs(nx - x) + Math.abs(ny - y) < 0.5) return; c.at(0.06 + k * 0.03, function () { c.shape({ k: 'impact', x: nx, y: ny, dur: 0.22, c: P.gold, r: 8 }); c.spray(nx, ny, [P.iron, P.earth], 3, a, 1.2, { spd: 40, life: 0.3 }); }); }, 5);
    c.wash(P.steel, 0.08, 0.9); c.fx('emit', { x: x + c.dx, y: y + c.dy, sp: 2, rate: 16, n: 1, dur: 0.9, cols: DUST, o: { up: 14, grav: 40, spd: 14, life: 0.6 } }); c.fx('stain', { x: x, y: y, r: 22, c: P.dirt, a: 0.25, dur: 3 });
  }
}
function ramUp(c, grand) {
  var T = grand ? 0.5 : 0.42;
  c.dim(grand ? 1.1 : 0.8).pose('back', T + 0.22, grand ? 7 : 6).sfx('swoosh');
  c.ring(c.ux, c.uy, grand ? 26 : 20, grand ? P.gold : P.steel, { inv: true, w: 2, dur: T * 0.8 });
  for (var k = 1; k <= (grand ? 4 : 3); k++) (function (k) { c.at(k * 0.07, function () { c.ghost(-c.dx * 0.22 * k, -c.dy * 0.22 * k, grand ? P.gold : P.blue, 0.34, 0.5 - k * 0.07); }); })(k);
  c.at(T * 0.45, function () { c.streak(grand ? 12 : 6, c.ang, grand ? P.pale : P.steel, T * 0.9, 0.3); });
  if (grand) c.at(0.1, function () { c.fx('emit', { x: c.ux, y: c.uy, sp: 1.2, rate: 30, n: 1, dur: 0.38, cols: GOLD, o: { up: 26, grav: -30, spd: 10, life: 0.4 } }); });
}
X.reg('u_ram', { cast: function (c) { ramUp(c, false); }, beat: function (c, i) { ram(c, i, false); } });
X.reg('ux_ram', { cast: function (c) { ramUp(c, true); }, beat: function (c, i) { ram(c, i, true); } });
// T4 ── 반격의 회오리: 제자리에서 돌며 강철 호가 두 번 휩쓴다 (둘째가 더 크고 밀어낸다). 끝나면 되치기 자세의 빛
// T5 ── 강철 회오리: 세 번, 돌 때마다 커진다. 쇠 조각이 기둥처럼 말려 오른다
function whirl(c, i, last, grand) {
  var x = c.ux, y = c.uy, R = grand ? [20, 28, 38] : [17, 23], r = R[Math.min(i, R.length - 1)], col = last ? (grand ? P.gold : P.white) : i ? P.white : P.steel, dir = i % 2 ? -1 : 1;
  c.fx('arc', { x: x, y: y, r: r, a0: c.ang, sw: dir * 6.6, c: col, c2: P.blue, w: last ? 3 : 2, dur: 0.3 });
  if (grand || last) c.fx('arc', { x: x, y: y, r: r - 5, a0: c.ang + 3.14, sw: dir * 6.6, c: P.steel, w: 1, dur: 0.3 });
  c.ghost(dir * 0.25, 0, P.blue, 0.26, 0.4);
  c.hits(function (hx, hy, k) { c.shape({ k: 'impact', x: hx, y: hy, dur: 0.22, c: last ? P.white : P.steel, r: last ? 10 : 7 }); if (k < 6) sparks(c, hx, hy, last ? 4 : 3, 40); }, 8);
  c.light(x, y, last ? 36 : 24, P.steel, last ? 0.7 : 0.45, 0.3);
  if (!last) { c.shake(0.1 + i * 0.06).sfx('whirl'); return; }
  c.fx('shock', { x: x, y: y, r: r + 8, c: P.steel, c2: P.white, w: 3, dust: P.dust, dur: 0.5 }); c.fx('crack', { x: x, y: y, r: grand ? 20 : 12, n: grand ? 8 : 5, dur: 2.2 });
  c.burst(x, y, STEEL, grand ? 24 : 16, { spd: 70, life: 0.4, flat: true });
  c.shake(grand ? 0.45 : 0.28).stop(grand ? 0.09 : 0.06).flash(P.steel, grand ? 0.1 : 0.07).boom('shieldSlam').sfx('whirl');
  c.at(0.18, function () { c.fx('dome', { x: x, y: y, r: 12, c: grand ? P.gold : P.steel, dur: 0.9 }); c.ring(x, y, 12, grand ? P.gold : P.steel, { rise: true, w: 2, dur: 0.6 }); });      // 되치기 자세
  if (grand) { c.wash(P.steel, 0.08, 0.8); c.fx('stain', { x: x, y: y, r: 30, c: P.dirt, a: 0.2, dur: 2.6 }); }
}
function whirlUp(c, grand) {
  c.dim(grand ? 1.4 : 0.8).pose('spin', grand ? 1.0 : 0.7, 2).sfx('swoosh');
  if (grand) { c.streak(12, 0, P.steel, 1.0, 0.26); c.fx('emit', { x: c.ux, y: c.uy - 0.2, sp: 2.4, rate: 34, n: 1, dur: 0.85, cols: STEEL, o: { up: 46, grav: -40, spd: 26, life: 0.5, flat: true } }); c.fx('column', { x: c.ux, y: c.uy, w: 5, h: 60, c: P.steel, c2: P.white, a: 0.35, dur: 0.9, d: 0.1 }); }
}
X.reg('u_riposte', { cast: function (c) { whirlUp(c, false); }, beat: function (c, i, last) { whirl(c, i, last, false); } });
X.reg('ux_riposte', { cast: function (c) { whirlUp(c, true); }, beat: function (c, i, last) { whirl(c, i, last, true); } });
})();
