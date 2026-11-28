// 2.3.0 큰 몸 · 새 몬스터 시험: 차지와 겹침 없음 · 장애물을 도는 길 · 가장 가까운 칸까지의 거리(양쪽) · 범위는 한 번만 · 밀기/끌기 규칙 · 자리 찾기 ·
//   예고 → 맞음 · 격노 · 부름 · 새 몬스터와 큰 보스마다 기술 · 땅의 위험 · 갈라짐 · 터지는 몸 · 등장 연출 · 보스 컷인 · 옛 저장
//   H=844 OUT=qa_out/big node tools/shot.js tools/t_big.js     (V230=폴더 면 화면을 그 폴더에)
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), V = process.env.V230;
  const vshot = async (n, clip) => { if (V) { fs.mkdirSync(V, { recursive: true }); await page.screenshot({ path: path.join(V, n), clip: clip || undefined }); } };
  await L.newGame(page, { cls: 'inf', name: '큰몸' });
  // ── 엔진 (화면 없이 같은 엔진) ──
  const R = await ev(() => {
    var out = {}, D = DS, B = D.SKILLS;
    function inv(sim) {      // 차지 표가 살아 있는 몸과 꼭 맞는가 (겹침 · 빈 칸 · 남은 칸)
      var w = sim.w, seen = {}, bad = 0;
      sim.units.forEach(function (u) { if (u.dead) return; for (var dy = 0; dy < (u.fh || 1); dy++) for (var dx = 0; dx < (u.fw || 1); dx++) { var j = (u.y + dy) * w + u.x + dx; if (sim.occ[j] !== u) bad++; if (seen[j]) bad++; seen[j] = 1; } });
      for (var j = 0; j < sim.occ.length; j++) if (sim.occ[j] && (sim.occ[j].dead || !seen[j])) bad++;
      return bad;
    }
    function mapOf(rows) { return rows; }
    function ally(x, y, o) { var u = { side: 'ally', role: 'cmd', name: '아군', L: 30, hp: 900, mhp: 900, mp: 50, mmp: 50, atk: 60, mag: 60, def: 30, res: 30, spd: 10, mv: 1, mt: 'foot', rng: [1, 1], atkKind: 'melee', dtype: 'phys', kind: 'inf', x: x, y: y, auto: true }; for (var k in o || {}) u[k] = o[k]; return u; }
    function boss(type, x, y, L0) { var s = D.enemySpec(null, L0 || 30, { boss: type, x: x, y: y, grp: 'b' }); s.obj = true; return s; }
    var open = []; for (var y = 0; y < 14; y++) open.push('..............');
    // ① 차지 · 자리 찾기
    var sim = new D.Sim({ map: open, seed: 3, mode: 'scn', inv: {} });
    var b = sim.add(boss('warden', 5, 5));
    var a1 = sim.add(ally(5, 5)), a2 = sim.add(ally(6, 6));      // 몸 위에 서려 하면 곁 빈 칸으로
    out.occ = { fw: b.fw, fh: b.fh, tiles: [sim.at(5, 5), sim.at(6, 5), sim.at(5, 6), sim.at(6, 6)].every(function (o) { return o === b; }), a1: [a1.x, a1.y], a2: [a2.x, a2.y], off: !(a1.x >= 5 && a1.x <= 6 && a1.y >= 5 && a1.y <= 6) && !(a2.x >= 5 && a2.x <= 6 && a2.y >= 5 && a2.y <= 6), inv: inv(sim) };
    // ② 거리 · 붙음 (양쪽): 몸의 오른쪽 아래 칸 곁의 아군은 거리 1
    var sim2 = new D.Sim({ map: open, seed: 3, mode: 'scn', inv: {} }), b2 = sim2.add(boss('warden', 3, 3)), a3 = sim2.add(ally(5, 4)), a4 = sim2.add(ally(4, 7, { rng: [2, 3], atkKind: 'arrow' }));
    out.dist = { side: D.fpDist(a3, b2), back: D.fpDist(b2, a3), arrow: D.fpDist(a4, b2), sym: D.fpDist(a4, b2) === D.fpDist(b2, a4) };
    sim2.units.forEach(function (u) { u.aggro = true; }); sim2.combat = true;
    var hp0 = b2.hp; a3.gauge = 100; sim2.engage(a3, b2, 1, 1, function () { return this.attack(a3, b2); }); out.dist.melee = b2.hp < hp0;
    var ah0 = a3.hp; b2.gauge = 100; sim2.attack(b2, a3); out.dist.bossHit = a3.hp < ah0;
    // ③ 범위는 한 번만: 십자 범위가 몸의 칸 셋을 덮어도 한 번
    var vs = sim2.victims(a3, { side: 'enemy', tg: 'tile' }, [[3, 3], [4, 3], [3, 4], [4, 4], [2, 3]]);
    out.aoe = { n: vs.length, boss: vs[0] === b2 };
    var hits = 0; sim2.drain(); sim2.resolve(a3, 'mag_meteor', sim2.areaTiles(a3, B.mag_meteor, 4, 4), null); sim2.drain().forEach(function (e) { if (e.t === 'hit' && e.id === b2.id) hits++; }); out.aoe.hits = hits;
    // ④ 밀기 · 끌기: 큰 몸은 버틴다 · 큰 몸이 민 아군은 몸에서 멀어진다
    var bx = b2.x, by = b2.y; sim2.resolve(a3, 'bm_charge', [[4, 4]], null); sim2.resolve(a3, 'mar_hook', null, b2);
    out.knock = { still: b2.x === bx && b2.y === by };
    var px0 = a3.x; sim2.resolve(b2, 'bb_stomp', sim2.areaTiles(b2, B.bb_stomp, b2.x, b2.y), null); out.knock.pushed = a3.x > px0; out.knock.inv = inv(sim2);
    // ⑤ 길: 벽에 한 칸 틈과 두 칸 틈 — 2×2 몸은 두 칸 틈으로 돌아간다
    var wall = ['..............', '..............', '..............', '..............', '..............', '#.####..######', '..............', '..............', '..............', '..............'];
    var sim3 = new D.Sim({ map: wall, seed: 5, mode: 'scn', inv: {} }), b3 = sim3.add(boss('warden', 1, 1)), a5 = sim3.add(ally(1, 8));
    b3.aggro = true; a5.auto = false; sim3.combat = true; var bad3 = 0, through = false, n3 = 0;
    for (var t = 0; t < 400 && !through; t++) { b3.gauge = 100; b3.busy = 0; sim3.engage(b3, a5, 1, 1, function () { return true; }); bad3 += inv(sim3); if (b3.y >= 6) through = true; n3++; }
    out.path = { through: through, x: b3.x, y: b3.y, inv: bad3, steps: n3, gapOk: b3.x >= 6 || !through };
    // ⑥ 예고 → 맞음 · 격노 · 비기
    var sim4 = new D.Sim({ map: open, seed: 7, mode: 'scn', inv: {} }), b4 = sim4.add(boss('warden', 5, 5)), a6 = sim4.add(ally(7, 5, { hp: 5000, mhp: 5000 }));
    sim4.units.forEach(function (u) { u.aggro = true; }); sim4.combat = true; sim4.drain();
    b4.gauge = 100; var ok4 = sim4.cast(b4, 'bb_slam', null), tele = sim4.tele.length, dz = sim4.dz.ally[a6.y * sim4.w + a6.x];
    a6.busy = 99; var ah = a6.hp; for (var k = 0; k < 50; k++) sim4.tick(0.05);
    out.tele = { cast: ok4, tele: tele, danger: dz, hit: a6.hp < ah, gone: sim4.tele.length === 0 };
    var ev4 = []; sim4.drain(); b4.hp = Math.round(b4.mhp * 0.45); sim4.hurt(b4, Math.round(b4.mhp * 0.1), a6, {}); sim4.drain().forEach(function (e) { ev4.push(e.t); });
    out.enr = { on: !!b4.enraged, ev: ev4.indexOf('enrage') >= 0, ult: b4.skills.indexOf('bu_cataclysm') >= 0 };
    b4.gauge = 100; b4.gcd = 0; b4.cd = {}; a6.x = 7; sim4.drain(); var uok = sim4.enemySkill(b4, sim4.allies()), ue = sim4.drain().map(function (e) { return e.t + (e.sk ? ':' + e.sk : ''); });
    out.enr.ultCast = uok && ue.indexOf('bossUlt:bu_cataclysm') >= 0;
    // ⑦ 부름 (여왕 전갈의 새끼 전갈) · 겹침 없음
    var sim5 = new D.Sim({ map: open, seed: 9, mode: 'scn', inv: {}, mk: function (t, o) { return D.enemySpec(t, o.L || 30, o); } }), b5 = sim5.add(boss('shara', 5, 5)), a7 = sim5.add(ally(9, 5));
    b5.gauge = 100; sim5.cast(b5, 'b_sumScorp', null); out.sum = { n: sim5.units.filter(function (u) { return u.summoned && !u.dead; }).length, inv: inv(sim5) };
    // ⑧ 큰 보스마다: 모든 기술을 한 번씩 (예고는 끝까지 기다린다) — 몸이 겹치지 않고, 쓰러지지 않는다
    out.boss = {};
    D.BIG_BOSSES.forEach(function (k) {
      var S = new D.Sim({ map: open, seed: 11, mode: 'scn', inv: {}, mk: function (t, o) { return D.enemySpec(t, o.L || 30, o); } }), u = S.add(boss(k, 5, 4)), al = [S.add(ally(5, 10, { hp: 99999, mhp: 99999 })), S.add(ally(2, 5, { hp: 99999, mhp: 99999 })), S.add(ally(11, 5, { hp: 99999, mhp: 99999 })), S.add(ally(u.x + (u.fw || 1), u.y, { hp: 99999, mhp: 99999 }))];
      S.units.forEach(function (x) { x.aggro = true; x.busy = 99; }); S.combat = true; S.drain();
      var used = [], err = '', bad = 0, skills = u.skills.concat(u.enr ? u.enr.add : []);
      skills.forEach(function (id) {
        try {
          var Sk = B[id], tg = null; if (!Sk) { err += ' no ' + id; return; }
          if (Sk.tg === 'enemy' || Sk.tg === 'unit' || Sk.tg === 'tile') tg = al[0];
          if (Sk.tg === 'dir') tg = { x: u.x, y: u.y + (u.fh || 1) };
          if (Sk.tg === 'row') tg = { x: al[0].x, y: al[0].y };
          u.gauge = 100; u.cd = {};
          if (S.cast(u, id, tg, true)) used.push(id);
          for (var q = 0; q < 80 && S.tele.length; q++) S.tick(0.05);
          bad += inv(S);
        } catch (x) { err += ' ' + id + ':' + x.message; }
      });
      out.boss[k] = { sz: (u.fw || 1) + 'x' + (u.fh || 1), n: skills.length, used: used.length, bad: bad, err: err };
    });
    // ⑨ 새 몬스터마다: 그 몬스터의 기술이 실제로 나간다 (적 생각으로) · 갈라짐 · 터지는 몸 · 땅의 위험 · 기운
    out.mob = {};
    D.NEW_MOBS.forEach(function (k) {
      var S = new D.Sim({ map: open, seed: 13, mode: 'scn', inv: {}, mk: function (t, o) { return D.enemySpec(t, o.L || 30, o); } }), u = S.add(D.enemySpec(k, 30, { x: 5, y: 5, grp: 'm' }));
      var hurt = D.enemySpec('goblin', 30, { x: 4, y: 4, grp: 'm' }); var f2 = S.add(hurt); if (f2) f2.hp = Math.round(f2.mhp * 0.5);
      var al = [S.add(ally(6, 5, { hp: 99999, mhp: 99999, heal: 1 })), S.add(ally(8, 5, { hp: 99999, mhp: 99999, rng: [2, 4], atkKind: 'arrow' }))];
      S.units.forEach(function (x) { x.aggro = true; if (x !== u) x.busy = 1e9; }); S.combat = true; S.drain();      // 곁의 이들은 가만히 (그 몬스터의 생각만 본다)
      var seen = {}, err = '';
      for (var q = 0; q < 400; q++) { u.gcd = Math.min(u.gcd, 0); try { S.tick(0.05); } catch (x) { err = x.message; break; } S.drain().forEach(function (e) { if ((e.t === 'skill' || e.t === 'cast') && e.id === u.id) seen[e.sk] = 1; if (e.t === 'hazard') seen.hazard = 1; if (e.t === 'auraFx') seen.aura = 1; }); if (u.dead) break; al.forEach(function (a) { a.hp = a.mhp; }); }
      var sk = (D.ENEMIES[k].skills || []);
      out.mob[k] = { skills: sk.length, used: sk.filter(function (s) { return seen[s]; }).length, aura: !!D.ENEMIES[k].aura === !!seen.aura || !D.ENEMIES[k].aura, err: err, inv: inv(S), dead: u.dead && !u.boomed ? 1 : 0, boom: !!u.boomed };
    });
    var S8 = new D.Sim({ map: open, seed: 3, mode: 'scn', inv: {}, objective: 'all', mk: function (t, o) { return D.enemySpec(t, o.L || 30, o); } }), sl = S8.add(D.enemySpec('bigSlime', 20, { x: 5, y: 5, grp: 'm' })), a8 = S8.add(ally(5, 7));
    S8.combat = true; S8.kill(sl, a8); out.split = { n: S8.units.filter(function (u) { return !u.dead && u.type === 'slime'; }).length, won: !S8.result, inv: inv(S8) };
    // ⑩ 자리 찾기: 큰 보스가 있는 시나리오 · 갱도 수문장 층 · 들판 보스
    var pl = []; D.SCENARIOS.concat([5, 10, 15, 20, 25, 30, 40, 50].map(function (f) { return D.pit(f); })).forEach(function (sc) {
      if (!sc.boss) return; var Bd = D.BOSSES[sc.boss]; if (!Bd.sz && !(Bd.phase2 && D.BOSSES[Bd.phase2].sz)) return;
      var bs = D.buildScenario(sc, 6, 'inf'), Sx = new D.Sim({ map: bs.map, units: bs.units, mk: bs.mk, objective: bs.objective, seed: 3, mode: 'scn', inv: {} }), bo = Sx.units.filter(function (u) { return u.role === 'boss'; })[0];
      var ok = !!bo && inv(Sx) === 0 && (!Bd.sz || (bo.fw === Bd.sz[0] && bo.fh === Bd.sz[1])) && Sx.fits(bo, bo.x, bo.y);
      if (Bd.phase2) { Sx.kill(bo, null); var p2 = Sx.units.filter(function (u) { return u.role === 'boss' && !u.dead; })[0]; ok = ok && !!p2 && p2.fw === D.BOSSES[Bd.phase2].sz[0] && inv(Sx) === 0; }
      pl.push((sc.pit ? 'p' + sc.pit : sc.id) + (ok ? '' : '!'));
    });
    out.place = pl;
    return out;
  });
  A(R.occ.fw === 2 && R.occ.fh === 2 && R.occ.tiles && R.occ.off && R.occ.inv === 0, 'footprint: a 2×2 boss holds all four tiles, units asked to stand on it are placed beside it ' + JSON.stringify(R.occ.a1) + ' ' + JSON.stringify(R.occ.a2));
  A(R.dist.side === 1 && R.dist.back === 1 && R.dist.sym && R.dist.melee && R.dist.bossHit, 'range to the nearest tile both ways: side ' + R.dist.side + ', archer ' + R.dist.arrow + ', melee hits the big body and the boss hits back');
  A(R.aoe.n === 1 && R.aoe.boss && R.aoe.hits === 1, 'AoE covering several boss tiles counts once (' + R.aoe.hits + ' hit)');
  A(R.knock.still && R.knock.pushed && R.knock.inv === 0, 'knockback / pull do not move a big body; a big body pushes a unit away from its edge');
  A(R.path.through && R.path.inv === 0 && R.path.gapOk, 'pathing: the 2×2 boss walks round the wall through the 2-wide gap (at ' + R.path.x + ',' + R.path.y + ' after ' + R.path.steps + ' thinks, no overlap)');
  A(R.tele.cast && R.tele.tele === 1 && R.tele.danger && R.tele.hit && R.tele.gone, 'telegraph: warning tiles first (danger map), then the hit');
  A(R.enr.on && R.enr.ev && R.enr.ult && R.enr.ultCast, 'enrage below the threshold: event, ultimate added and cast with a boss cut-in event');
  A(R.sum.n === 2 && R.sum.inv === 0, 'summons appear on free tiles (' + R.sum.n + ')');
  Object.keys(R.boss).forEach(function (k) { var o = R.boss[k]; A(o.used === o.n && o.bad === 0 && !o.err, 'big boss ' + k + ' (' + o.sz + '): ' + o.used + '/' + o.n + ' skills cast, no overlap' + o.err); });
  Object.keys(R.mob).forEach(function (k) { var o = R.mob[k]; A(o.used === o.skills && o.aura && !o.err && o.inv === 0, 'new monster ' + k + ': ' + o.used + '/' + o.skills + ' skills used by its own AI' + (o.boom ? ', blew itself up' : '') + o.err); });
  A(R.split.n === 2 && R.split.won && R.split.inv === 0, 'king slime splits into two slimes on death and the fight goes on');
  A(R.place.length >= 14 && R.place.every(function (p) { return !/!/.test(String(p)); }), 'spawn fit: big bosses fit on their scenario and pit maps (' + R.place.join(' ') + ')');
  // ── 화면 ──
  await L.edit(page, function () { for (var id = 1; id <= 29; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 4); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 70; b.exp = 0; } }); DS.mercTidy(s); DS.pSync(s); s.opt.cine = 'full'; s.opt.zoom = 'near'; });
  await L.closeAll(page);
  const fight = async (id, cine) => {
    await ev((a) => { DS.G.quiet = true; DS.bigCineForce = !!a.cine; DS.ui.closeAll(); DS.startScenario(DS.scn(a.id)); DS.G.sim.hunt = false; }, { id, cine });
    await L.sleep(1200); await L.skipStory(page, 4); await ev(() => DS.ui.closeAll());
  };
  const bossClip = async () => { await ev(() => { var v = DS.G.view, sim = DS.G.sim, b = sim.units.filter(function (u) { return u.role === 'boss' && !u.dead; })[0], f = v.vu[v.focus]; if (b && f) v.pan = { x: (b.x + ((b.fw || 1) - 1) / 2 - f.x) * 16, y: (b.y + ((b.fh || 1) - 1) / 2 - f.y) * 16 + 24 }; }); await L.sleep(700); return clipOf(); };
  const clipOf = async () => ev(() => { var v = DS.G.view, sim = DS.G.sim, b = sim.units.filter(function (u) { return u.role === 'boss' && !u.dead; })[0]; if (!b) return null; var s = v.screenOf(b.x + ((b.fw || 1) - 1) / 2, b.y + ((b.fh || 1) - 1) / 2), r = v.cv.getBoundingClientRect(), wd = Math.max(150, (b.fw || 1) * 16 * v.k + 90), ht = Math.max(150, (b.fh || 1) * 16 * v.k + 120); return { x: Math.max(0, Math.round(r.left + s.x - wd / 2)), y: Math.max(0, Math.round(r.top + s.y - ht * 0.62)), width: Math.round(wd), height: Math.round(ht) }; });
  // 등장 연출 (9번 돌지기 2×2)
  await fight(9, true);
  await ev(() => { var sim = DS.G.sim, b = sim.units.filter(function (u) { return u.role === 'boss'; })[0]; DS.G.view.focus = b.id; sim.rouse(b); });
  let cine = null; for (let i = 0; i < 20 && !cine; i++) { await L.sleep(150); cine = await ev(() => { var el = document.querySelector('.cine.ck-boss'); return el ? { img: !!el.querySelector('img.cbimg'), title: el.querySelector('.crib').textContent, note: (el.querySelector('.cnote') || {}).textContent || '' } : null; }); }
  A(cine && cine.img && /돌지기/.test(cine.title), 'entrance cinematic for a big boss: ' + JSON.stringify(cine));
  await L.sleep(700); await vshot('cine_entrance.png'); await shot('cine_entrance');
  for (let i = 0; i < 40 && await ev(() => !!document.querySelector('.cine')); i++) await L.sleep(200);
  A(!(await ev(() => !!document.querySelector('.cine'))), 'entrance cinematic closes by itself');
  await L.sleep(1200); await vshot('boss_2x2.png', await bossClip()); await shot('boss_2x2');
  // 비기 컷인 · 격노 · 예고 칸
  const cut = await ev(() => { var sim = DS.G.sim, b = sim.units.filter(function (u) { return u.role === 'boss'; })[0]; b.hp = Math.round(b.mhp * 0.5); sim.hurt(b, Math.round(b.mhp * 0.2), null, {}); b.gauge = 100; b.gcd = 0; b.cd = {}; var ok = sim.cast(b, 'bu_cataclysm', null, true); return { ok: ok, en: !!b.enraged }; });
  await L.sleep(250);
  const cutEl = await ev(() => { var el = document.querySelector('#ultcut'); return el ? { on: el.classList.contains('on'), boss: el.classList.contains('boss'), name: (el.querySelector('.ucn b') || {}).textContent, pic: !!el.querySelector('.ucp canvas') } : null; });
  A(cut.ok && cut.en && cutEl && cutEl.on && cutEl.boss && cutEl.pic && cutEl.name === '대지 붕괴', 'boss cut-in on the ultimate (' + JSON.stringify(cutEl) + '), boss enraged');
  await vshot('boss_cutin.png'); await shot('boss_cutin');
  await L.sleep(700); await vshot('telegraph.png'); await vshot('enrage.png', await bossClip()); await shot('telegraph_enrage');
  const rageBan = await ev(() => { var el = document.querySelector('#boss'); return el && el.classList.contains('rage'); });
  A(rageBan, 'boss bar turns to the enraged look');
  // 1×2 · 4×2 · 2×4 (어스름의 왕은 2단계)
  for (const [id, nm] of [[5, 'boss_1x2.png'], [29, 'boss_4x2.png']]) {
    await ev(() => { if (DS.G.sim && !DS.G.sim.result) DS.G.sim.win(); }); await L.settle(page, 15000);
    await fight(id, false); await ev(() => { var sim = DS.G.sim, b = sim.units.filter(function (u) { return u.role === 'boss'; })[0]; DS.G.view.focus = b.id; sim.rouse(b); }); await L.sleep(2400);
    await vshot(nm, await bossClip()); await shot(nm.replace('.png', ''));
  }
  await ev(() => { if (DS.G.sim && !DS.G.sim.result) DS.G.sim.win(); }); await L.settle(page, 15000);
  await fight(30, false);
  const dk = await ev(() => { var sim = DS.G.sim, h = sim.units.filter(function (u) { return u.role === 'boss'; })[0]; DS.G.view.focus = h.id; sim.rouse(h); sim.hurt(h, h.hp + 5, null, {}); var k = sim.units.filter(function (u) { return u.role === 'boss' && !u.dead; })[0]; if (k) DS.G.view.focus = k.id; return k ? { n: k.name, fw: k.fw, fh: k.fh } : null; });
  await L.sleep(2400);
  A(dk && dk.fw === 2 && dk.fh === 4, 'the second phase (' + (dk && dk.n) + ') is a 2×4 body');
  await vshot('boss_2x4.png', await bossClip()); await shot('boss_2x4');
  await ev(() => { if (DS.G.sim && !DS.G.sim.result) DS.G.sim.win(); }); await L.settle(page, 15000);
  // 갱도 수문장 (5층: 돌무쇠 2×2)
  await ev(() => { DS.G.quiet = true; DS.ui.closeAll(); DS.G.save.pitBest = 9; DS.startScenario(DS.pit(5)); DS.G.sim.hunt = false; }); await L.sleep(1200); await L.skipStory(page, 4); await ev(() => DS.ui.closeAll());
  const pg = await ev(() => { var sim = DS.G.sim, b = sim.units.filter(function (u) { return u.role === 'boss'; })[0]; DS.G.view.focus = b.id; sim.rouse(b); return { n: b.name, fw: b.fw, fh: b.fh }; });
  await L.sleep(2000);
  A(pg.fw === 2 && pg.fh === 2, 'pit floor 5 guardian is ' + pg.n + ' ' + pg.fw + '×' + pg.fh);
  await vshot('pit_guardian.png', await bossClip()); await shot('pit_guardian');
  await ev(() => { if (DS.G.sim && !DS.G.sim.result) DS.G.sim.win(); }); await L.settle(page, 15000);
  // 새 몬스터 줄 세우기 (그림표)
  const sheet = await ev(() => { var U = DS.ui, h = '<div class="result" style="max-width:380px"><h2>새 몬스터</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;font-size:11px">'; DS.NEW_MOBS.forEach(function (k) { h += '<div>' + U.sprTag(DS.ENEMIES[k].sprite, '', 3) + '<br>' + DS.ENEMIES[k].name + '</div>'; }); h += '</div><h2>큰 보스</h2><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;text-align:center;font-size:10px">'; DS.BIG_BOSSES.forEach(function (k) { var B = DS.BOSSES[k]; var c = DS.bigPortrait ? DS.bigPortrait(k, B.sz[0], B.sz[1], 0.9) : null; h += '<div>' + (c ? '<img style="max-width:68px;max-height:68px" src="' + c.toDataURL() + '">' : '?') + '<br>' + B.name + '<br>' + B.sz[0] + '×' + B.sz[1] + '</div>'; }); U.overlay(h + '</div></div>', 'modal'); return document.querySelectorAll('.ov canvas.px, .ov img').length; });
  A(sheet >= 12 + 20, 'lineup sheet draws every new monster and big boss (' + sheet + ' pictures)');
  await L.sleep(400); await vshot('lineup.png'); await shot('lineup');
  await L.closeAll(page);
  // 옛 저장 (2.2.5 · v12) 이 읽혀서 큰 보스가 있는 판을 시작할 수 있다
  const v225 = fs.readFileSync(path.join(__dirname, 'fixtures', 'v225.json'), 'utf8'), v12 = fs.readFileSync(path.join(__dirname, 'fixtures', 'v12.json'), 'utf8');
  const old = await ev((a) => { var r = []; [a.v225, a.v12].forEach(function (raw, i) { var s2 = DS.Save.read(raw); r.push(!!(s2 && s2.chars && DS.partySpecs(s2).length)); if (i === 0 && s2) { DS.G.save = s2; DS.ui.persist(); } }); return r; }, { v225, v12 });
  A(old[0] && old[1], 'old saves (2.2.5, v12) load: ' + JSON.stringify(old));
  await ev(() => { DS.G.quiet = true; DS.ui.closeAll(); DS.rebuildParty(); DS.startScenario(DS.scn(11)); DS.G.sim.hunt = true; DS.G.save.opt.speed = 2; }); await L.sleep(1500); await L.skipStory(page, 4); await ev(() => DS.ui.closeAll());
  await L.sleep(3000);
  const st = await ev(() => { var sim = DS.G.sim, b = sim.units.filter(function (u) { return u.role === 'boss'; })[0]; return { t: Math.round(sim.t), fw: b && b.fw }; });
  A(st.fw === 2 && st.t >= 2, 'old save fights scenario 11 with the 2×2 queen (' + st.t + ' s)');
  console.log('big done');
};
