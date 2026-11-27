// 2.7.1 스무 해의 평화: 창이 닫히면 살아 있는 모두가 1단 Lv1 로 · 합일(fz) · 大(dx · dae) 는 걷힌다 · 장비 · 공훈은 그대로 · 2대째 적은 본편 레벨 그대로 (세기 배율만)
//   연출: 세 줄이 떠오르고 가주들의 단이 1단 Lv1 까지 내려앉는다 · 합일했던 이는 「합일의 힘이 흩어졌다」 · 단추를 누르면 마을로
//   H=844 OUT=<폴더> node tools/shot.js tools/t_peace271.js
module.exports = async function (page, shot, L) {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), sleep = L.sleep;
  await L.newGame(page, '시험', 'inf');
  await L.edit(page, function () { DS.houseOpenN(s, 9); DS.mercTidy(s); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 70; b.exp = 0; } }); DS.mercTidy(s); if (DS.pSync) DS.pSync(s); for (var id = 1; id <= 30; id++) DS.applyClear(s, DS.scn(id)); s.crest = s.crest || 1; s.opt.cine = 'off'; });
  let c = await ev(() => { var s = DS.G.save, cands = DS.fuseCands(s).filter(x => x.ch.id !== s.hero), keys = cands.slice(0, 3).map(x => x.key), rep = cands[0].ch.id; var rw = DS.fuse(s, keys, { rep: rep }); window.__rep = rep;
    var H = s.chars[rep], b = DS.bearer(s, H); b.L = 88; DS.pSync(s); var w = DS.charList(s).filter(x => x.id !== s.hero && x.w)[0];
    window.__g = { w: w ? w.w : null, wid: w ? w.id : 0, hx: H.hx, gold: s.gold, gear: JSON.stringify(s.gear) };
    return { fused: !!rw, L: b.L, dae: H.dae, name: DS.flagName(H.cls, s), gen: DS.egGen(s), can: DS.egCanStart(s) }; });
  A(c.fused && c.L === 88 && /^大 /.test(c.name), 'setup: a fused 大 house with an L88 head (' + c.name + ')');
  c = await ev(() => { var s = DS.G.save, st = DS.egStart(s); if (!st) return { err: (DS.egCanStart(s) || {}).why }; var y0 = DS.egYear;
    var n = 0; while (s.eg.pass && s.eg.pass.f === 'years' && n++ < 60) { var r = DS.egYear(s); if (r && r.stop) DS.egSeat(s, r.stop.ch, r.stop.heirs.filter(h => !h.young)[0] || null); if (r && r.done) break; }
    DS.egKeep(s, {}); if (s.eg.pass && s.eg.pass.f === 'hand') DS.egHand && DS.egHand(s, {}); DS.egSkip(s);
    var r2 = DS.egClose(s); window.__peace = r2 && r2.peace; var H = s.chars[window.__rep], b = DS.bearer(s, H, 1) || null;
    var Ls = []; DS.persons(s).forEach(function (p) { Ls.push(DS.pL(p.who)); });
    var fzAny = DS.persons(s).some(p => p.who.fz) || (s.mercs || []).some(m => m.fz || m.dx);
    var w = s.chars[window.__g.wid];
    return { g: s.eg.gen, pass: !!s.eg.pass, peace: r2 && r2.peace ? r2.peace.length : -1, heads: r2 && r2.peace ? r2.peace.filter(x => x.head).length : 0, fzRow: r2 && r2.peace ? r2.peace.some(x => x.fz && x.L0 >= 71) : false,
      maxL: Math.max.apply(null, Ls), n: Ls.length, chL: Math.max.apply(null, DS.charList(s).map(x => x.L)), fzAny: fzAny, dae: H.dae || 0, name: DS.flagName(H.cls, s), cap: b ? DS.pCap(b) : 70, pgn: DS.persons(s).reduce((a, p) => a + (+p.who.pgn || 0), 0),
      wKept: !w || w.w === window.__g.w, hx: H.hx === window.__g.hx, recL: DS.recruitL(s, 3), sc1: DS.egScn(1, s.eg.gen, s).L, sc30: DS.egScn(30, s.eg.gen, s).L, b1: DS.scn(1).L, b30: DS.scn(30).L, diff: DS.egScn(10, s.eg.gen, s).diff / (DS.scn(10).diff || 1) }; });
  A(c.g === 2 && !c.pass && c.peace > 0 && c.heads > 0 && c.fzRow, 'the window closes into generation 2 and reports ' + c.peace + ' people who forgot (' + c.heads + ' heads, the fused one among them)');
  A(c.maxL === 1 && c.chL === 1 && c.pgn === 0, 'everyone alive is 1단 Lv1 again (' + c.n + ' people, houses too), tier growth starts over');
  A(!c.fzAny && !c.dae && !/大/.test(c.name) && c.cap === 70, 'fusion lasts one generation: no fused or 大 marks left, 「' + c.name + '」, cap 70');
  A(c.wKept && c.hx, 'gear and house merit carry over');
  A(c.recL <= 3, 'recruits now come at a low level (' + c.recL + ')');
  A(c.sc1 === c.b1 && c.sc30 === c.b30 && c.diff > 1, 'generation 2 enemies use the base levels (1: L' + c.sc1 + ', 30: L' + c.sc30 + ') with a strength factor ×' + c.diff.toFixed(2));
  // 연출
  await ev(() => { DS.G.quiet = true; DS.ui.closeAll(); DS.egPeaceShow(DS.G.save, window.__peace, function () { window.__pzDone = 1; }); });
  await sleep(1800); await shot('peace_lines');
  for (let i = 0; i < 60; i++) { if (await ev(() => { var b = document.querySelector('.ov.peaceov .pz-go'); return b && !b.disabled; })) break; await sleep(150); }
  await sleep(200);
  c = await ev(() => { var o = document.querySelector('.ov.peaceov'); return { rows: o.querySelectorAll('.pz-r li').length, lv: [...o.querySelectorAll('.pz-lv')].map(e => e.textContent), fz: !!o.querySelector('.pz-fz'), btn: !o.querySelector('.pz-go').disabled, bad: /undefined|NaN/.test(o.innerText), sw: document.documentElement.scrollWidth }; });
  await shot('peace_end');
  A(c.rows > 0 && c.lv.every(t => t === '1단 Lv1') && c.fz && c.btn && !c.bad && c.sw <= 390, 'cinematic: ' + c.rows + ' heads count down to 1단 Lv1, the fused one reads 「합일의 힘이 흩어졌다」, the button unlocks, fits 390px ' + JSON.stringify(c));
  await ev(() => document.querySelector('.ov.peaceov .pz-go').click()); await sleep(400);
  A(await ev(() => !document.querySelector('.ov.peaceov') && window.__pzDone === 1), 'the button closes it and the game carries on');
  await page.setViewportSize({ width: 844, height: 390 }); await sleep(300);
  await ev(() => { DS.egPeaceShow(DS.G.save, window.__peace, null); }); await sleep(5600); await shot('peace_landscape');
  A(await ev(() => { var b = document.querySelector('.ov.peaceov .pz-go').getBoundingClientRect(); return b.bottom <= innerHeight + 400; }), 'landscape renders');
};
