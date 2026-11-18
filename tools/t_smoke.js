// 연기 시험: 새로 시작 → 들판 싸움 → 시나리오 1 → 메뉴 탭과 창을 모두 연다. 오류가 없고 화면에 NaN·undefined 가 없어야 한다.
//   H=844 OUT=qa_out/smoke node tools/shot.js tools/t_smoke.js
'use strict';
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a);
  await L.newGame(page, { cls: 'mag', name: '연기' });
  await shot('town');
  // 들판 싸움
  await ev(() => { DS.ui.closeAll(); DS.enterZone('dawn'); DS.G.sim.hunt = true; DS.G.save.opt.speed = 2; });
  const k0 = await ev(() => DS.G.save.kills || 0);
  for (let i = 0; i < 60; i++) { await L.sleep(500); await L.skipStory(page, 2); const k = await ev(() => DS.G.save.kills || 0); if (k >= k0 + 3) break; }
  const k1 = await ev(() => DS.G.save.kills || 0);
  A(k1 > k0, 'field fight: kills ' + k0 + ' → ' + k1);
  await shot('field');
  // 시나리오 1 (권장보다 낮으면 레벨을 맞춰 준다)
  await L.edit(page, function () { var p = s.chars[s.hero].ps; if (p.L < 4) { p.L = 4; p.exp = 0; } DS.pSync(s); });
  const r = await L.fightScenario(page, 1, 150000);
  await shot('scn1_end');
  await L.settle(page, 30000);
  A(r === 'win', 'scenario 1: ' + r);
  A(await ev(() => !!DS.G.save.cleared[1]), 'scenario 1 cleared');
  await L.sleep(800);
  // 메뉴 탭 모두
  const tabs = ['party', 'people', 'bag', 'map', 'online', 'help', 'opt'];
  for (const t of tabs) {
    await ev((t) => { DS.ui.closeAll(); DS.openMenu(t); }, t); await L.sleep(450);
    await shot('tab_' + t);
    const bad = await L.badText(page, '.ov'); A(bad.length === 0, 'tab ' + t + ' clean' + (bad.length ? ' ' + JSON.stringify(bad) : ''));
  }
  // 가게·창 모두
  const wins = [['forge', () => DS.openShop('forge')], ['hall', () => DS.openShop('merc')], ['item', () => DS.openShop('item')], ['church', () => DS.openShop('church')], ['town', () => DS.openTownWork()],
    ['lineage', () => DS.openLineage('tree')], ['gate2', () => DS.openGate(DS.scn(2), null)], ['house', () => { DS.openMenu('party'); var b = document.querySelector('.ov .hgh[data-ch]'); if (b) b.click(); }], ['hero', () => { DS.openMenu('people'); var b = document.querySelector('.ov [data-pp="h"]'); if (b) b.click(); }], ['notes', () => DS.openNotes()]];
  for (const w of wins) {
    await ev(() => DS.ui.closeAll()); await page.evaluate(w[1]); await L.sleep(500);
    await shot('win_' + w[0]);
    const bad = await L.badText(page, '.ov'); A(bad.length === 0, 'window ' + w[0] + ' clean' + (bad.length ? ' ' + JSON.stringify(bad) : ''));
  }
  await ev(() => DS.ui.closeAll());
  // 많은 가문으로 시나리오: 칩 고르기 · 필살기 칸 · 모두 출발 칸에 선다
  await L.edit(page, function () { for (var id = 2; id <= 13; id++) DS.applyClear(s, DS.scn(id)); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 45; b.exp = 0; } }); for (var i = 0; i < 2; i++) { var m = DS.addMerc(s, 'm_sword', 3, s.hero); m.kn = 1; m.L = 40; } DS.mercTidy(s); DS.pSync(s); });
  await ev(() => { DS.G.quiet = true; DS.G.pause = true; DS.startScenario(DS.scn(14)); }); await L.sleep(800);
  const sc = await ev(() => { var ids = Object.keys(DS.G.chipEls), want = DS.partySpecs(DS.G.save).length; var last = ids[ids.length - 1]; DS.G.chipEls[last].el.click(); return { want: want, have: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead).length, chips: ids.length, sel: DS.G.sel === last, ult: !!document.querySelector('#acts .act.ult'), lots: document.querySelector('#chips').classList.contains('many'), docW: document.documentElement.scrollWidth }; });
  A(sc.have === sc.want && sc.want >= 12, 'scenario with ' + sc.want + ' allies: all placed (' + sc.have + ')');
  A(sc.sel && sc.ult, 'chip selection works and ult slot shown');
  A(sc.lots && sc.docW <= 390, 'compact chips, no horizontal page scroll (' + sc.docW + ')');
  await shot('scn_many');
  await ev(() => { DS.G.sim.win(); }); await L.settle(page, 30000);
  const notes = await ev(() => DS.NOTES[0].ver + ' ' + DS.NOTES[0].title + ' / ' + DS.VERSION + ' / ' + DS.BUILD);
  A(/^2\.2\.1 옛 맹주의 가족 \/ 2\.2\.1 \/ 7\.0\.1$/.test(notes), 'version ' + notes);
  console.log('smoke done');
};
