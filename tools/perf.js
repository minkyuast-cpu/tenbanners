// 전민 — 프레임 시험 (2.2.2 에서 쓰던 재기를 도구로 둔다): 큰 무리와의 난전에서 fps · 프레임 시간 · 그리기(view.frame) · 엔진(sim.update)
//   CPU=4 H=844 OUT=qa_out/perf node tools/shot.js tools/perf.js        (CPU = CDP 느리게 하기 배율, 기본 1 · PAGE=… 로 다른 빌드)
//   ① 들판(바람재) 사냥: 아군 16(가주 열 + 가문원 여섯 — 2.2.8 부터는 출전 셋 + 가문원 여섯 = 9) + 불어난 무리  ② 시나리오 14 난전  ③ 2.2.5: 필살기 난전 — 높은 레벨 부대가 2초마다 필살기 (컷인 · 그림이 잦을 때)
//   한 줄씩 「PERF <이름> {json}」. FXQ=lite 면 설정 「효과: 가볍게」로 잰다.
'use strict';
module.exports = async (page, shot, L) => {
  const ev = (f, a) => page.evaluate(f, a);
  await L.newGame(page, { cls: process.env.PCLS || 'inf', name: '시험' });
  await L.edit(page, function () { for (var id = 1; id <= 13; id++) DS.applyClear(s, DS.scn(id)); if (DS.houseOpenN) DS.houseOpenN(s, 10); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 14; b.exp = 0; } }); for (var i = 0; i < 6; i++) { var m = DS.addMerc(s, 'm_sword', 3, s.hero); m.kn = 1; m.L = 14; } DS.mercTidy(s); DS.pSync(s); s.opt.cine = 'off'; if (a) s.opt.fxq = a; }, process.env.FXQ || '');
  const cpu = +(process.env.CPU || 1);
  if (cpu > 1) { const c = await page.context().newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
  const measure = (sec) => ev((sec) => new Promise(res => {
    var G = DS.G, sim = G.sim, v = G.view, fr = [], vm = [], sm = [], last = 0, t0 = performance.now(), ult0 = 0, st0 = sim.t;
    sim.units.forEach(function (u) { ult0 += u.ultN || 0; });
    var vf = v.frame, su = sim.update; v.frame = function () { var a = performance.now(); var r = vf.apply(this, arguments); vm.push(performance.now() - a); return r; };
    sim.update = function () { var a = performance.now(); var r = su.apply(this, arguments); sm.push(performance.now() - a); return r; };
    (function tick(now) { if (last) fr.push(now - last); last = now; if (now - t0 < sec * 1000) requestAnimationFrame(tick); else { v.frame = vf; delete sim.update;
      var st = a => { a = a.slice().sort((x, y) => x - y); var n = a.length, m = a.reduce((x, y) => x + y, 0) / (n || 1); return { n: n, mean: +m.toFixed(2), p95: +(a[Math.floor(n * 0.95)] || 0).toFixed(2), max: +(a[n - 1] || 0).toFixed(1) }; };
      var un = 0; sim.units.forEach(function (u) { un += u.ultN || 0; });
      res({ fps: +(1000 / (fr.reduce((x, y) => x + y, 0) / fr.length)).toFixed(1), frame: st(fr), view: st(vm), sim: st(sm), long: fr.filter(x => x > 50).length, allies: sim.units.filter(u => u.side === 'ally' && !u.dead).length, foes: sim.units.filter(u => u.side === 'enemy' && !u.dead).length, parts: v.parts.length, ults: un - ult0, simS: +(sim.t - st0).toFixed(1) }); } })(performance.now());
  }), sec);
  await ev(() => { DS.ui.closeAll(); DS.G.quiet = false; DS.enterZone('windy'); DS.G.save.opt.speed = 2; }); await L.sleep(1500); await L.skipStory(page, 3); await ev(() => DS.ui.closeAll());
  await ev(() => { DS.G.sim.hunt = true; DS.G.save.opt.hunt = true; });
  await L.sleep(2000);
  console.log('PERF field', JSON.stringify(await measure(+process.env.SEC || 12)));
  await shot('perf_field');
  const lv = (L0) => ev((L0) => { var s = DS.G.save; DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = L0; b.exp = 0; } }); (s.mercs || []).forEach(function (m) { if (m.kn) m.L = L0; }); DS.pSync(s); DS.rebuildParty(); DS.ui.persist(); }, L0);
  const scn = async (id) => { await ev((id) => { DS.G.quiet = true; DS.ui.closeAll(); DS.startScenario(DS.scn(id)); DS.G.sim.hunt = true; }, id); await L.sleep(1500); await L.skipStory(page, 3); await ev(() => DS.ui.closeAll()); };
  const out = async () => { await ev(() => { if (DS.G.sim && !DS.G.sim.result) DS.G.sim.win(); }); for (let i = 0; i < 40 && !(await ev(() => !!document.querySelector('.ov.res26'))); i++) { await L.sleep(200); await L.skipStory(page, 1); } await L.settle(page, 20000); };
  await ev(() => { DS.G.quiet = true; DS.G.sim.hunt = false; DS.G.save.opt.hunt = false; }); await lv(34);      // 2.2.5: 난전이 끝까지 이어지게 (L14 부대는 14번에서 금방 쓰러져 빈 판을 쟀다)
  await scn(14);
  console.log('PERF scn14', JSON.stringify(await measure(+process.env.SEC || 10)));
  await shot('perf_scn');
  // ③ 필살기 난전: 들판 사냥(큰 무리가 이어진다)을 필살기가 깨어난 레벨로 — 조작하는 가주를 2초마다 바꿔 가며 필살 게이지를 채우고 봇처럼 스스로 쓰게 한다
  await out(); await lv(45);
  await ev(() => { DS.ui.closeAll(); DS.G.quiet = true; DS.enterZone('windy'); DS.G.save.opt.speed = 2; }); await L.sleep(1500); await L.skipStory(page, 3); await ev(() => DS.ui.closeAll());
  for (let i = 0; i < 6; i++) { await ev(() => { DS.ui.closeAll(); DS.G.pause = false; }); await L.sleep(300); }      // 레벨을 올려 뜬 승급 · 알림 창이 들판을 멈춰 두지 않게
  await ev(() => { DS.G.sim.hunt = true; DS.G.save.opt.hunt = true; DS.BAL.ultAuto = true; });
  for (let i = 0; i < 40 && !(await ev(() => DS.G.sim.combat)); i++) { await ev(() => DS.ui.closeAll()); await L.sleep(300); }
  await ev(() => { window.__ultT = setInterval(function () { var sim = DS.G.sim; if (document.querySelector('#app .ov')) DS.ui.closeAll(); if (!sim || sim.result) return; var cs = sim.units.filter(function (u) { return u.side === 'ally' && u.role === 'cmd' && !u.dead && u.ult && sim.units.some(function (e) { return e.side === 'enemy' && !e.dead && Math.abs(e.x - u.x) + Math.abs(e.y - u.y) <= 3; }); }); if (!cs.length) return; for (var k = 0; k < cs.length; k++) { var u = cs[(window.__ultI = ((window.__ultI || 0) + 1)) % cs.length]; u.uc = 100; u.gauge = 100; var f = sim.units.filter(function (e) { return e.side === 'enemy' && !e.dead; }).sort(function (a, b) { return (Math.abs(a.x - u.x) + Math.abs(a.y - u.y)) - (Math.abs(b.x - u.x) + Math.abs(b.y - u.y)); })[0], S = DS.SKILLS[u.ult]; if (!f) break;
      var t = S.tg === 'enemy' ? f : S.tg === 'tile' ? { x: f.x, y: f.y } : S.tg === 'dir' ? (Math.abs(f.x - u.x) >= Math.abs(f.y - u.y) ? { x: u.x + (f.x > u.x ? 1 : -1), y: u.y } : { x: u.x, y: u.y + (f.y > u.y ? 1 : -1) }) : null;
      if (sim.cast(u, u.ult, t)) break; } }, 1500); });      // 사람이 누르듯이 1.5초마다 한 사람 (대상은 가장 가까운 적)
  await L.sleep(800);
  console.log('PERF ults', JSON.stringify(await measure(+process.env.SEC || 10)));
  await shot('perf_ults');
  await ev(() => clearInterval(window.__ultT));
  // ④ 2.3.0 큰 보스 싸움: 29번 용암용(4×2) — 숨결 · 불비의 땅 위험 · 꼬리 · 격노 뒤 비기(겁화). 부대가 버티도록 레벨을 올리고, 보스는 체력을 넉넉히 · 격노를 일찍
  if (process.env.NOBOSS) return;
  await ev(() => clearInterval(window.__ultT)); await out(); await lv(92);
  await scn(29);
  await ev(() => { var sim = DS.G.sim, b = sim.units.filter(function (u) { return u.role === 'boss'; })[0]; b.mhp = b.hp = b.mhp * 6; if (b.enr) b.enr.th = 0.97; sim.rouse(b); DS.G.view.focus = b.id; sim.hunt = true; });
  await L.sleep(4000);
  console.log('PERF boss', JSON.stringify(await measure(+process.env.SEC || 10)));
  await shot('perf_boss');
};
