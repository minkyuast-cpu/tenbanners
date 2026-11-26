// 전민 — 기술 연출 시험 무대 (브라우저 안에서 돈다 — tools/skshow.js · tools/t_skfx.js 가 page.addScriptTag 로 싣는다)
//   SKS.stage(id, { side: 'ally' | 'enemy', theme }) : 평평한 판에 쓰는 이 하나 · 우리 둘 · 허수아비 적 다섯을 세운다 (모두 스스로 움직이지 않는다)
//   SKS.cast() : 그 기술을 건다 · SKS.step(dt) : 엔진 한 틱(0.05초) + 화면 한 프레임 · SKS.sheet({…}) : 건 순간부터 프레임을 모아 한 장으로 (dataURL)
//   게임 루프는 멈춰 둔다 (DS.G.pause) — 한 번의 호출 안에서 엔진과 화면을 손으로 민다. 그래서 매번 같은 프레임이 나온다.
(function () {
'use strict';
var S = window.SKS = {}, W = 17, H = 13, CX = 6, CY = 6;
function mkCmd(id, cls, L, x, y, hero) {
  var ch = { cls: cls, L: L, id: id }, t = DS.tierOfL(L); DS.stdGear(ch, t);
  var st = DS.charStats(ch), C = DS.CLASSES[cls];
  return { id: 'c' + id, side: 'ally', role: 'cmd', cls: cls, name: C.name, L: L, tier: t, look: [cls, t], hp: st.hp, mhp: st.hp, mp: 999, mmp: 999, atk: st.atk, def: st.def, mag: st.mag, res: st.res,
    spd: st.spd, mv: C.mv, mt: C.mt, rng: st.rng, atkKind: C.atk, dtype: C.dtype, kind: C.kind, tags: C.tags || [], basic: C.basic || 1, skills: [], crit: 0, enh: 0, hero: !!hero, x: x, y: y, auto: true };
}
S.clsOf = function (id) {      // 그 기술을 쓰는 병과와 익히는 단
  var K = DS.SKILLS[id], c, i, L, best = null;
  if (K.cls) return { cls: K.cls, tier: 5 };
  if (K.up) return { cls: K.up, tier: 10 };
  for (c in DS.CLASSES) { L = DS.CLASSES[c].skills || []; for (i = 0; i < L.length; i++) if (L[i][0] === id) { var base = DS.CLASSES[c].rise || c; if (DS.CLASSES[c].master && !DS.CLASSES[c].rise) continue; if (!best || L[i][1] < best.tier) best = { cls: base, tier: L[i][1] }; } }
  return best || { cls: 'inf', tier: 3 };
};
S.stage = function (id, o) {
  o = o || {};
  var G = DS.G, K = DS.SKILLS[id], who = S.clsOf(id), rows = [], y, i, enemy = o.side === 'enemy';
  for (y = 0; y < H; y++) rows.push(new Array(W + 1).join('.'));
  var L = (who.tier - 1) * 10 + 5, units = [], foes = [], al = [];
  var self = K.tg === 'self', melee = K.rng && K.rng[1] <= 1, r1 = K.rng ? Math.min(K.rng[1], 4) : 1, r0 = K.rng ? K.rng[0] : 1;
  var d = K.tg === 'dir' ? 1 : self ? 0 : Math.max(r0, Math.min(r1, 3)), tx = CX + d, ty = CY;
  // 맞을 무리: 겨누는 칸 둘레 (제 둘레 기술은 쓰는 이 둘레)
  var ring = self ? [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [1, 1]] : K.tg === 'dir' ? [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [4, 0]] : [[0, 0], [1, 0], [0, 1], [0, -1], [1, 1], [2, 0]];
  var pals = self ? [[-2, 1], [-1, -1]] : [[-1, 1], [-1, -1]];
  var caster, cid = 'c1';
  if (!enemy) {
    units.push(mkCmd(1, who.cls, L, CX, CY, true));
    pals.forEach(function (p, k) { units.push(mkCmd(2 + k, k ? 'mon' : 'pike', Math.max(5, L - 3), CX + p[0], CY + p[1])); });
    ring.forEach(function (p) { var e = DS.enemySpec(o.mob || 'goblin', Math.max(3, L - 2), { x: tx + p[0] - (self ? 0 : 0), y: ty + p[1] }); e.hp = e.mhp = e.mhp * 8; foes.push(e); units.push(e); });
  } else {      // 적이 쓴다: 허수아비 적 하나가 쓰는 이, 우리 편이 맞는다
    var ce = DS.enemySpec('darkMage', L, { x: CX, y: CY }); ce.hp = ce.mhp = ce.mhp * 8; ce.id = 'eC'; units.push(ce); cid = 'eC';
    [[-1, 1], [-1, -1]].forEach(function (p) { var e = DS.enemySpec('goblin', L, { x: CX + p[0], y: CY + p[1] }); e.hp = e.mhp = e.mhp * 8; units.push(e); });
    ring.slice(0, 4).forEach(function (p, k) { var a = mkCmd(1 + k, ['inf', 'mag', 'pike', 'mon'][k], L, tx + p[0], ty + p[1], k === 0); a.hp = a.mhp = a.mhp * 8; units.push(a); });
  }
  var sim = new DS.Sim({ map: rows, units: units, seed: 77, inv: {}, mode: 'scn', mk: function (type, q) { return DS.enemySpec(DS.ENEMIES[type] ? type : 'skeleton', L, q); } });      // 적이 망자 부름을 쓰면 적 해골로 (연무장처럼 제 표로 바꿔 부른다)
  sim.units.forEach(function (u) { u.busy = 1e9; u.aggro = u.side === 'enemy'; u.gauge = 100; if (u.side === 'enemy') u.face = -1; });
  sim.combat = true; sim.hunt = true;
  G.pause = true; G.quiet = true; G.sim = sim; G.scn = G.scn || null;
  G.view.setScene(sim, { rows: rows, theme: o.theme || 'meadow', seed: 5 });
  G.view.trans = null; G.view.focus = null; G.view.sel = enemy ? null : cid; G.sel = enemy ? G.sel : cid;
  caster = sim.byId[cid];
  var tgt = null, fs = sim.units.filter(function (u) { return u.side !== caster.side && !u.dead; });
  if (K.tg === 'enemy') tgt = fs[0]; else if (K.tg === 'tile') tgt = { x: tx, y: ty }; else if (K.tg === 'dir') tgt = { x: CX + 1, y: CY };
  else if (K.tg === 'ally') { tgt = sim.units.filter(function (u) { return u.side === caster.side && u !== caster; })[0]; if (tgt) { tgt.hp = Math.round(tgt.mhp * 0.5); var nf = fs[0]; } }
  if (o.burn) fs.forEach(function (f) { sim.addStatus(f, 'burn', 20, 1, null); });
  if (o.slow) fs.forEach(function (f) { sim.addStatus(f, 'slow', 20, 0, null); });
  var fxx = tgt ? (tgt.x + CX) / 2 : self ? CX : (tx + CX) / 2, fyy = tgt ? (tgt.y + CY) / 2 : CY;
  S.cur = { id: id, K: K, sim: sim, u: caster, tgt: tgt, who: who, foes: fs, fx: fxx, fy: fyy, t0: 0, log: [] };
  // 화면을 자리 잡게 몇 프레임
  for (i = 0; i < 4; i++) S.step(0.05, true);
  sim.ev.length = 0;
  return { cls: who.cls, tier: who.tier, L: L, fxTier: DS.skfx.tierOf(id), sig: !!DS.SKFX[id] };
};
S.cast = function () {
  var c = S.cur, u = c.u, sim = c.sim;
  u.mp = u.mmp = 999; u.gauge = 100; u.cd = {}; u.uc = 100; if (c.K.ult) u.ult = c.id; u.busy = 0;
  c.t0 = sim.t;
  var ok = sim.cast(u, c.id, c.tgt, true);
  u.busy = 1e9;
  return ok;
};
// 엔진 한 틱 + 화면 한 프레임 (dt 는 0.05 의 배수)
S.step = function (dt, quiet) {
  var c = S.cur, G = DS.G, sim = c ? c.sim : G.sim, V = G.view, n = Math.max(1, Math.round((dt || 0.05) / 0.05)), i, evs, k;
  for (i = 0; i < n; i++) {
    sim.acc = 0; sim.tick(0.05);
    sim.units.forEach(function (u) { if (u.busy < 1e8) u.busy = 1e9; if (!u.dead && c && !c.real && u.hp < u.mhp * 0.5) u.hp = Math.round(u.mhp * 0.8); });      // 허수아비는 쓰러지지 않는다
    evs = sim.drain();
    if (c && !quiet) for (k = 0; k < evs.length; k++) c.log.push(evs[k]);
    V.rLast = performance.now() - 50;
    var fz = DS.fxFreeze; DS.fxFreeze = false;
    try { V.frame(0.05, evs); } finally { DS.fxFreeze = fz; }
  }
};
// 건 순간부터 secs 초를 every 틱마다 한 칸씩 모아 한 장으로. 돌려주는 것: { url, frames, stat }
S.sheet = function (o) {
  o = o || {};
  var c = S.cur, G = DS.G, V = G.view, cv = document.getElementById('cv'), cols = o.cols || 6, every = o.every || 1, secs = o.secs || 1.5, total = Math.ceil(secs / 0.05), frames = Math.ceil(total / every) + 1;
  var cw = o.cw || 256, chh = o.ch || 208, zm = o.zoom || 1.6, rowsN = Math.ceil(frames / cols), sh = document.createElement('canvas'), g, k = cv.width / (cv.clientWidth || cv.width);
  sh.width = cols * cw; sh.height = rowsN * chh + 18; g = sh.getContext('2d'); g.fillStyle = '#0d0b16'; g.fillRect(0, 0, sh.width, sh.height); g.imageSmoothingEnabled = false;
  var X = DS.skfx.stat; X.fx = X.parts = X.shapes = X.rings = X.lines = X.q = 0;
  function grab(n, t) {
    var p = V.screenOf(c.fx, c.fy), sw = cw / zm, shh = chh / zm, sx = Math.round((p.x - sw / 2) * k), sy = Math.round((p.y - shh / 2 - 10) * k), gx = (n % cols) * cw, gy = Math.floor(n / cols) * chh + 18;
    g.drawImage(cv, sx, sy, sw * k, shh * k, gx, gy, cw, chh);
    g.fillStyle = 'rgba(13,11,22,.75)'; g.fillRect(gx, gy, 46, 13); g.fillStyle = '#fff3c4'; g.font = '10px monospace'; g.fillText(t.toFixed(2) + 's', gx + 3, gy + 10);
    g.fillStyle = '#2a2440'; g.fillRect(gx + cw - 1, gy, 1, chh); g.fillRect(gx, gy + chh - 1, cw, 1);
  }
  var n = 0, i, st0 = Math.round((o.start || 0) / 0.05);
  X.over = 0;
  S.step(0.05); if (!st0) grab(n++, -0.05);      // 걸기 바로 앞
  var ok = S.cast();
  for (i = 0; i < st0; i++) S.step(0.05);
  for (i = 0; i < total; i++) { S.step(0.05); if (i % every === 0) grab(n++, (st0 + i + 1) * 0.05); }
  var K = c.K, hits = c.log.filter(function (e) { return e.t === 'hit'; }), dmg = hits.reduce(function (a, e) { return a + (+e.v || 0); }, 0);
  g.fillStyle = '#fff3c4'; g.font = '12px monospace';
  g.fillText(c.id + ' 「' + K.name + '」  T' + DS.skfx.tierOf(c.id) + '  ' + c.who.cls + ' ' + c.who.tier + '단  ' + (o.tag || '') + '  hits ' + hits.length + ' dmg ' + dmg + '  peak parts ' + X.parts + ' fx ' + X.fx + ' shapes ' + X.shapes + ' rings ' + X.rings, 4, 13);
  return { url: sh.toDataURL('image/png'), ok: ok, frames: n, hits: hits.length, dmg: dmg, stat: { parts: X.parts, fx: X.fx, shapes: X.shapes, rings: X.rings, lines: X.lines, q: X.q, err: X.err, over: X.over }, pend: c.sim.sq.length, zones: c.sim.zn.length };
};
})();
// ── 시험용 (tools/t_skfx.js): 기술 하나를 걸고 다 풀릴 때까지 돌려 본 보고 ──
(function () {
'use strict';
var S = window.SKS;
S.ids = function () {      // 맹주 쪽이 쓰는 기술 130: 열 병과의 기술 · 윗길 기술 · 필살기 · 윗길 필살기
  var out = [], c, C, X;
  for (c in DS.CLASSES) { C = DS.CLASSES[c]; if (C.master) continue; C.skills.forEach(function (s) { if (out.indexOf(s[0]) < 0) out.push(s[0]); }); X = DS.CLASSES[DS.RISE_OF[c]]; if (X) X.skills.forEach(function (s) { if (out.indexOf(s[0]) < 0) out.push(s[0]); }); }
  Object.keys(DS.ULTS).forEach(function (k) { if (DS.ULTS[k].cls) out.push(k); });
  Object.keys(DS.ULTX).forEach(function (k) { out.push(k); });
  return out;
};
S.run = function (id, o) {
  o = o || {};
  var K = DS.SKILLS[id], st = S.stage(id, o), c = S.cur, sim = c.sim, V = DS.G.view, X = DS.skfx.stat, T = DS.skfx.tierOf(id), B = DS.skfx.BUDGET[T], r = { id: id, side: o.side || 'ally', tier: T, sig: st.sig, bad: [] };
  X.fx = X.parts = X.shapes = X.rings = X.lines = X.q = 0; X.over = 0; var err0 = X.err, runs0 = X.runs[id] || 0;
  var shakeMax = 0, flashMax = 0, stopMax = 0, streak = 0, washMax = 0, i, k;
  r.ok = S.cast();
  var lastBeat = (K.fall ? (K.fall.delay == null ? 0.8 : K.fall.delay) : 0) + (K.beats ? K.beats[K.beats.length - 1] : 0), zdur = K.zone ? K.zone.dur : 0;
  var total = Math.ceil((lastBeat + zdur + Math.max(1.2, B.dur * 2 + 1.2)) / 0.05);
  if (o.mid) o.mid(sim, c);
  for (i = 0; i < total; i++) {
    if (o.at && o.at[i]) o.at[i](sim, c);
    S.step(0.05);
    if (V.shake > shakeMax) shakeMax = V.shake; if (V.flashA > flashMax) flashMax = V.flashA; if (V.stop > stopMax) stopMax = V.stop; if (V.skWash && V.skWash.a > washMax) washMax = V.skWash.a;
    for (k = 0; k < V.skfx.length; k++) if (V.skfx[k].k === 'streak') streak++;
  }
  var L = c.log, n = function (t) { return L.filter(function (e) { return e.t === t; }).length; };
  r.hits = L.filter(function (e) { return e.t === 'hit' && e.by === c.u.id && e.type !== 'burn' && e.type !== 'poison'; }).length; r.beats = n('beat'); r.marks = n('mark'); r.zones = n('zone'); r.zticks = n('zoneTick'); r.zends = n('zoneEnd');
  r.seqEnd = L.filter(function (e) { return e.t === 'seqEnd'; }).map(function (e) { return e.cancel ? 'cancel' : 'done'; }).join();
  r.skill = n('skill'); r.buffs = n('buff'); r.status = n('status');
  r.pend = sim.sq.length; r.zleft = sim.zn.length; r.err = X.err - err0; r.ran = (X.runs[id] || 0) - runs0; r.lastErr = DS.skfx.lastErr || '';
  r.peak = { parts: X.parts, shapes: X.shapes, fx: X.fx, rings: X.rings, lines: X.lines, q: X.q, over: X.over };
  r.view = { fx: V.skfx.length, q: V.skq.length, seq: Object.keys(V.skSeq).length, zone: Object.keys(V.skZone).length, tele: Object.keys(V.tele).filter(function (t) { return t.charAt(0) === 'q'; }).length, poses: V.skPoses.length };
  r.screen = { shake: shakeMax, flash: flashMax, stop: stopMax, streak: streak, wash: washMax };
  var cc = V.skLast && V.skLast[c.u.id]; r.ctx = cc && cc.id === id ? { pn: cc.pn, sn: cc.sn, dn: cc.dn, gn: cc.gn, B: { parts: cc.B.parts, shapes: cc.B.shapes, decal: cc.B.decal, ghost: cc.B.ghost } } : null;
  r.want = { beats: K.beats ? K.beats.length : K.fall ? 1 : 0, zticks: K.zone ? Math.floor(K.zone.dur / (K.zone.every || 1) + 1e-6) : 0, dmg: (K.eff || []).some(function (e) { return e.t === 'dmg'; }) };
  return r;
};
// 같은 판을 화면 없이 한 번 더: 사건 기록이 글자까지 같은가 (결정적)
S.replay = function (id, side) {
  function once() { S.stage(id, { side: side }); var c = S.cur, i, out = []; c.sim.drain(); S.castQuiet(); for (i = 0; i < 140; i++) { c.sim.acc = 0; c.sim.tick(0.05); c.sim.units.forEach(function (u) { if (u.busy < 1e8) u.busy = 1e9; }); c.sim.drain().forEach(function (e) { out.push(e); }); } return JSON.stringify(out); }
  var a = once(), b = once(); return { same: a === b, n: a.length };
};
S.castQuiet = function () { var c = S.cur, u = c.u; u.mp = u.mmp = 999; u.gauge = 100; u.cd = {}; u.uc = 100; if (c.K.ult) u.ult = c.id; u.busy = 0; var ok = c.sim.cast(u, c.id, c.tgt, true); u.busy = 1e9; return ok; };
})();
