// 2.3.2 「처음으로」 브라우저 시험 (390×844): 대가 끊기면 깬 시나리오가 모두 사라지고 1번부터 다시 걷는다.
//   H=844 OUT=qa_out/lapse node tools/shot.js tools/t_lapse.js   (V232=폴더 면 보고용 화면을 그 폴더에)
//   ① 규칙 (저장 사본): 12번까지 깬 판에서 대가 끊긴다 → cleared 비고 · 다음 시나리오 1번 · 가문 · 레벨 · 단 · 장비 · 가방 · 깃대 · 관 · 갱도 그대로 ·
//      1~12번을 다시 깨면 처음 깬 골드 · 모집권(가문이 오던 판 · 다섯 번째마다)이 처음과 똑같이 · 저장을 다시 읽어도 그대로
//   ② 다음 세대의 장 안에서 끊기면: 장이 닫히고(세대 수 그대로) · 30번을 다시 깨면 다음 대의 장을 연다 · 맺음 결산은 두 번 하지 않는다
//   ③ 화면: 전멸처럼 가주가 모두 떠나고 맹주가 쓰러진다 → 후계 의식 → 「가문이 끊겼다」(잃는 것 · 깬 시나리오 띠) → 스무 해 → 새 대장 → 연출(띠가 꺼진다) → 스무 해 뒤
//      → 지금 지역(돌마루 고원)의 입구 표시가 곧바로 잠김 · 지도 탭의 걸음 줄 · 기록 창 · 입구 창의 알림
//   ④ 1번 · 2번을 진짜로 싸워 이긴다 → 처음 깬 결과 (골드 · 2번의 모집권), 이야기 · 오류 없음
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), V = process.env.V232;
  const readStory = async () => {      // 이야기 창을 한 장씩 넘기며 글을 모은다
    let all = '';
    for (let i = 0; i < 40; i++) {
      const tx = await ev(() => { var o = document.querySelector('.ov.story'); return o ? o.innerText : null; });
      if (tx == null) break; all += ' ' + tx;
      await page.click('.ov.story', { position: { x: 195, y: 400 } }).catch(() => {}); await L.sleep(450);
    }
    return all;
  };
  const vshot = async (n) => { if (V) { fs.mkdirSync(V, { recursive: true }); await page.screenshot({ path: path.join(V, n + '.png') }); } await shot(n); };
  await L.newGame(page, { cls: 'inf', name: '처음' });
  await L.edit(page, function () {
    s.gold = 50000; s.opt.cine = 'full';
    for (var id = 1; id <= 12; id++) DS.applyClear(s, DS.scn(id));
    DS.houseOpenN(s, 5); DS.mercTidy(s); DS.pSync(s);
    DS.persons(s).forEach(function (p) { if (p.role === 'hero' || p.role === 'bear') { p.who.L = 40; p.who.exp = 0; } });
    DS.pSync(s); DS.kit(s);
    s.crest = true; s.pitBest = 7; s.pitCur = 7; s.pit = 8; if (s.coffins) s.coffins.have = Math.max(2, s.coffins.have || 0);
    s.gear['b_sword'] = (s.gear['b_sword'] || 0) + 1;
  });
  await L.closeAll(page);
  // ① 규칙 (사본) — 가주가 선 채로 맹주만 쓰러진다 (자동 길: DS.linAutoAll)
  let c = await ev(() => {
    var s = DS.fixSave(JSON.parse(JSON.stringify(DS.G.save))), h = s.chars[s.hero];
    var gold0 = 0, tk0 = 0; DS.SCENARIOS.slice(0, 12).forEach(function (sc) { tk0 += DS.scnTickets(sc); gold0 += Math.round(DS.scnGold(sc) * DS.BAL.gold); });      // 처음 깬 몫 (1~12)
    s.mercs.slice().forEach(function (m) { if ((m.o === s.hero && !m.h) || (DS.isSb(m) && DS.sbFits(h, m))) DS.loseMerc(s, m.id); });
    DS.linTidy(s); DS.mercTidy(s); DS.pSync(s);
    var snap = function () { return { houses: DS.charList(s).map(function (c) { return c.id + ':' + c.cls + ':' + (c.id === s.hero ? 'hero' : c.L) + ':' + c.w + ':' + c.a; }).join('|'), bears: DS.charList(s).filter(function (c) { return c.id !== s.hero; }).map(function (c) { var b = DS.bearer(s, c); return b ? b.id + ':' + DS.pL(b) + ':' + b.g : '-'; }).join('|'), bag: JSON.stringify(s.gear), items: JSON.stringify(s.items), crest: s.crest, cof: JSON.stringify(s.coffins), pit: s.pitBest + '/' + s.pitCur, lin: Object.keys(s.lin.P).length, seen: JSON.stringify(s.seen), visited: JSON.stringify(s.visited) }; };
    var a = snap(), ended = (h.down = true, DS.linSettle(s, '시험'), DS.linEnded(s, s.hero)), evs = DS.linAutoAll(s); DS.mercTidy(s); DS.pSync(s);
    var b = snap(), lp = evs.filter(function (e) { return e.t === 'lapse'; })[0], h2 = s.chars[s.hero];
    var o = { ended: ended, lapse: !!lp, lost: lp ? lp.scn : -1, cleared: Object.keys(s.cleared).length, next: DS.nextScn(s).id, runs: JSON.stringify(s.runs), zone: !!DS.ZONES[s.zone] && s.zone, town: s.town, hero: !!(h2 && !h2.vac && h2.ps), same: {} };
    ['houses', 'bears', 'bag', 'items', 'crest', 'cof', 'pit', 'seen', 'visited'].forEach(function (k) { o.same[k] = a[k] === b[k] ? 1 : a[k] + ' → ' + b[k]; });
    o.linGrew = b.lin >= a.lin;
    o.lock2 = !!(DS.scn(2) && s.cleared[1] === undefined);
    // 1~12 다시: 처음 깬 몫이 똑같이
    var g1 = s.gold, t1 = s.tickets, firsts = 0, gear = [];
    for (var id = 1; id <= 12; id++) { var out = DS.applyClear(s, DS.scn(id)); if (out.first) firsts++; if (out.gear) gear.push(out.gear); }
    o.regain = { gold: s.gold - g1, gold0: gold0, tk: s.tickets - t1, tk0: tk0, firsts: firsts, gear: gear.join(',') };
    var again = DS.applyClear(s, DS.scn(2)); o.replay2 = { first: again.first, tk: again.tickets, gold: again.gold };
    var fx = DS.fixSave(JSON.parse(JSON.stringify(s))); o.fix = { cleared: Object.keys(fx.cleared).length, runs: JSON.stringify(fx.runs) };
    o.ev = DS.linEvText(s, s.lin.log.filter(function (e) { return e.t === 'lapse'; })[0]);
    return o;
  });
  A(c.ended && c.lapse && c.lost === 12, 'lapse with 12 cleared (lost ' + c.lost + ')');
  A(c.cleared === 0 && c.next === 1, 'cleared is empty, next scenario is 1');
  A(c.runs === JSON.stringify({ n: 1, best: 12, hist: [JSON.parse(c.runs).hist[0]] }) && JSON.parse(c.runs).hist[0].c === 12, 'lifetime record ' + c.runs);
  A(c.zone && c.town && c.hero, 'location still valid (' + c.zone + ', town ' + c.town + ') and the seat is filled');
  A(Object.keys(c.same).every(k => c.same[k] === 1) && c.linGrew, 'houses (the new 맹주 brings own level), bearers (level, grade), flag gear, bag, items, crest, coffins, pit record, seen, visited kept: ' + JSON.stringify(c.same));
  A(c.regain.firsts === 12 && c.regain.gold === c.regain.gold0 && c.regain.tk === c.regain.tk0 && c.regain.tk0 >= 3, 'replaying 1~12 gives first-clear rewards in full again: gold ' + c.regain.gold + ' = ' + c.regain.gold0 + ', tickets ' + c.regain.tk + ' = ' + c.regain.tk0 + (c.regain.gear ? ', gear ' + c.regain.gear : ''));
  A(!c.replay2.first && c.replay2.tk === 0, 'a third clear of 2 is a normal replay again (35% gold ' + c.replay2.gold + ', no ticket)');
  A(c.fix.cleared === 12 && c.fix.runs === JSON.stringify(JSON.parse(c.runs)), 'save round-trip keeps cleared and runs');
  A(/처음으로/.test(c.ev), 'lineage log line: ' + c.ev);
  // ② 다음 세대의 장 안에서 끊긴다 (사본)
  c = await ev(() => {
    var s = DS.fixSave(JSON.parse(JSON.stringify(DS.G.save))), h = s.chars[s.hero];
    for (var id = 13; id <= 30; id++) DS.applyClear(s, DS.scn(id));
    var lg1 = s.lg ? JSON.stringify(s.lg.s1 || null) : '';
    var st = DS.egStart(s); if (!st) return { err: 'egStart ' + (DS.egCanStart(s) || {}).why };
    DS.egRunAuto(s, { heir: 'first', keep: 'light', hand: true, call: 'none' });
    for (var n = 1; n <= 9; n++) DS.applyClear(s, DS.egScn(n, s.eg.gen, s));
    var o = { gen0: s.eg.gen, act0: DS.egActive(s), done0: DS.egDone(s) };
    h = s.chars[s.hero];
    s.mercs.slice().forEach(function (m) { if ((m.o === s.hero && !m.h) || (DS.isSb(m) && DS.sbFits(h, m))) DS.loseMerc(s, m.id); });
    DS.linTidy(s); DS.mercTidy(s); DS.pSync(s);
    h.down = true; DS.linSettle(s, '시험'); var evs = DS.linAutoAll(s), lp = evs.filter(function (e) { return e.t === 'lapse'; })[0];
    o.lapse = !!lp; o.lost = lp ? lp.scn : -1; o.gen1 = s.eg.gen; o.on1 = s.eg.on; o.c1 = Object.keys(s.eg.c).length; o.egOn = DS.egOn(s); o.next = DS.nextScn(s) && DS.nextScn(s).id; o.nextGen = !!(DS.nextScn(s) && DS.nextScn(s).gen);
    o.can = DS.egCanStart(s).ok; o.hist = JSON.stringify(s.runs.hist[s.runs.hist.length - 1]);
    var lgo = null; for (id = 1; id <= 30; id++) { var out = DS.applyClear(s, DS.scn(id)); if (id === 30) lgo = out.lg || null; }
    o.can2 = DS.egCanStart(s).ok; o.lgAgain = !!lgo; o.lgSame = (s.lg ? JSON.stringify(s.lg.s1 || null) : '') === lg1;
    var st2 = DS.egStart(s); o.gen2 = st2 ? st2.g : 0;
    return o;
  });
  A(!c.err, c.err || 'gen-2 chapter set up');
  A(c.act0 && c.gen0 === 2 && c.done0 === 9 && c.lapse && c.lost === 30, 'lapse in the gen-2 chapter at 9/30 (base cleared ' + c.lost + ' lost)');
  A(c.gen1 === 2 && !c.on1 && c.c1 === 0 && !c.egOn && c.next === 1 && !c.nextGen && !c.can, 'the chapter closes, generation stays 2, the base story restarts at 1, no chapter can open yet ' + c.hist);
  A(c.can2 && !c.lgAgain && c.lgSame && c.gen2 === 3, 'clearing 30 again re-opens the next chapter (gen ' + c.gen2 + '), the first ending is not settled twice');
  // ③ 화면: 전멸처럼 — 가주가 모두 떠나고(다른 병과 막사 한 사람은 남는다) 맹주가 쓰러진다. 돌마루 고원에서
  await ev(() => { DS.ui.closeAll(); DS.G.quiet = true; DS.enterZone('stone'); });
  await L.sleep(1200); await L.closeAll(page);
  c = await ev(() => {
    var s = DS.G.save, h = s.chars[s.hero], closed = DS.closedCls(s)[0];
    var sb = DS.addMerc(s, DS.heroType(closed), 3, 0); sb.sb = 1; sb.nc = closed; sb.L = 44; DS.mercTidy(s);
    DS.charList(s).forEach(function (ch) { if (ch.id === s.hero) return; var b = DS.bearer(s, ch); if (b) DS.loseMerc(s, b.id); });
    s.mercs.slice().forEach(function (m) { if ((m.o === s.hero && !m.h) || (DS.isSb(m) && DS.sbFits(h, m))) DS.loseMerc(s, m.id); });
    DS.linTidy(s); DS.mercTidy(s); DS.pSync(s);
    var g5 = DS.G.zone.pois.filter(function (p) { return p.t === 'gate'; }).map(function (p) { return p.state; }).join(',');
    h.down = true; DS.G.lineageQ = DS.linSettle(s, '돌마루 고원');
    DS.ui.persist();
    return { sbId: sb.id, sbL: DS.pL(sb), gates: g5, gold: s.gold, choices: DS.linChoices(s, s.hero).length, tk: s.tickets };
  });
  A(c.choices === 0, 'no heir to pick (houses emptied, other-class 막사 person ' + c.sbL + ' stays), gates before: ' + c.gates);
  const pre = c;
  await ev(() => { DS.lineageFlush(function () { DS.G._lpDone = 1; }); });
  for (let i = 0; i < 20 && await ev(() => DS.cineBusy()); i++) { await ev(() => DS.cineSkip()); await L.sleep(300); }
  await L.sleep(400);
  await page.click('[data-lgstep="pick"]'); await L.sleep(500);
  const lp = await ev(() => { var b = document.querySelector('.lgrite'); return { t: b ? b.innerText : '', strip: document.querySelectorAll('.lgrite .lpscn .clp i.on').length }; });
  A(/가문이 끊겼다/.test(lp.t) && /깬 시나리오 12개/.test(lp.t) && /1번 시나리오부터 다시/.test(lp.t) && /처음 깬 보상/.test(lp.t) && lp.strip === 12 && !/깬 시나리오, 깃발과 레벨/.test(lp.t), 'lapse screen lists the loss (12 lit cells) and what stays');
  A((await L.badText(page, '.lgrite')).length === 0, 'no NaN/undefined on the lapse screen');
  await vshot('lapse_screen');
  await page.click('[data-lgstep="lpass"]'); await L.sleep(900);
  await vshot('lapse_years');
  const st1 = await readStory(); await L.sleep(400);
  A(/스무 번/.test(st1) && /걸어온 길을 잊었다/.test(st1), 'twenty-years story has the forgotten-road line');
  await vshot('lapse_name');
  await page.click('#lpYes'); await L.sleep(1700);
  const cin = await ev(() => { var el = document.querySelector('.cine.ck-lapse'); return el ? { t: el.innerText, on: el.querySelectorAll('.clp i.on').length, hold: DS.cineInfo() && DS.cineInfo().hold } : null; });
  A(cin && cin.on === 12 && cin.hold && /이야기는 처음으로/.test(cin.t) && /12개가 잊혔다/.test(cin.t) && /「2회차」/.test(cin.t) && /깃발, 레벨, 장비는 남았다\. 빚도\./.test(cin.t), 'lapse cinematic: 12 cells fade from the end, waits for a tap: ' + (cin ? cin.t.replace(/\s+/g, ' ') : 'none'));
  await vshot('lapse_cine_fading');
  await L.sleep(2600);
  await vshot('lapse_cine_end');
  await ev(() => DS.cineSkip()); await L.sleep(700);
  await vshot('lapse_after');
  const st2 = await readStory(); await L.sleep(500);
  for (let i = 0; i < 10 && await ev(() => DS.cineBusy()); i++) { await ev(() => DS.cineSkip()); await L.sleep(300); }
  await L.closeAll(page);
  c = await ev((pre) => {
    var s = DS.G.save, sb = s.mercs.filter(function (m) { return m.id === pre.sbId; })[0], z = DS.G.zone;
    var gates = z.pois.filter(function (p) { return p.t === 'gate'; }).map(function (p) { return p.state; }).join(',');
    return { cleared: Object.keys(s.cleared).length, next: DS.nextScn(s).id, zone: z.id, sv: s.zone, gates: gates, sbL: sb ? DS.pL(sb) : -1, done: DS.G._lpDone, hero: !!(s.chars[s.hero] && !s.chars[s.hero].vac), runs: s.runs, gold: s.gold, tk: s.tickets, passed: DS.passedEver(s), quest: (document.querySelector('#quest') || {}).innerText || '' };
  }, pre);
  A(c.done && c.hero && c.cleared === 0 && c.next === 1 && c.runs && c.runs.n === 1 && c.runs.best === 12, 'after the rite: cleared empty, next 1, runs ' + JSON.stringify(c.runs));
  A(/1\. 무너진 방앗간/.test(c.quest), 'goal line points to scenario 1 at once: ' + c.quest.replace(/\s+/g, ' '));
  A(c.zone === 'stone' && c.sv === 'stone' && /^lock,lock,lock/.test(c.gates), 'player stays in 돌마루 고원 (zones are never locked); gates turned locked at once: ' + pre.gates + ' → ' + c.gates);
  A(c.sbL === pre.sbL && c.gold === Math.round(pre.gold - Math.floor(pre.gold * 0.5 / 10) * 10) && c.tk === pre.tk + 2, '막사 person kept L' + c.sbL + ', gold halved ' + pre.gold + ' → ' + c.gold + ', 2 tickets');
  A(/깃발이 다시 오른다/.test(st2) && /1번 시나리오부터 다시 걷는다/.test(st2) && /금고의 절반/.test(st2), 'after-story: ' + st2.replace(/\s+/g, ' ').slice(-90));
  // 지도 탭 · 기록 · 입구 창
  await ev(() => DS.openMenu('map')); await L.sleep(600);
  const mp = await ev(() => { var el = document.querySelector('.msl-run'); return el ? el.innerText : ''; });
  A(/2번째 걸음/.test(mp) && /12번까지/.test(mp), 'map tab: ' + mp);
  await ev(() => { var el = document.querySelector('.msl-run'); if (el) el.scrollIntoView({ block: 'center' }); }); await L.sleep(200);
  await vshot('lapse_map');
  await L.closeAll(page);
  await ev(() => DS.showRecord(function () {})); await L.sleep(500);
  const rc = await ev(() => { var el = document.querySelector('.result.record'); return el ? el.innerText : ''; });
  A(/다시 걸은 길/.test(rc) && /가장 멀리 12번/.test(rc), 'record shows the restart');
  await vshot('lapse_record');
  await L.closeAll(page);
  // 입구 창 알림: 깬 시나리오가 다섯 이상일 때만 (사본으로 본다 — 지금은 0)
  c = await ev(() => { var s = DS.G.save; return { risk: DS.linHeirRisk(s), n: Object.keys(s.cleared).length }; });
  await ev(() => { DS.openGate(DS.scn(1), null); }); await L.sleep(400);
  const gt0 = await ev(() => { var el = document.querySelector('.sb.gate'); return el ? el.innerText : ''; });
  A(c.risk && !/대가 끊기고/.test(gt0), 'gate warning is quiet in the first scenarios (risk ' + c.risk + ', cleared ' + c.n + ')');
  await vshot('lapse_gate1');
  await L.closeAll(page);
  // ④ 1번 · 2번을 진짜로 싸운다 — 처음 깬 보상
  await L.edit(page, function () { DS.persons(s).forEach(function (p) { if (p.role === 'hero') { p.who.L = 30; p.who.exp = 0; } }); DS.pSync(s); DS.kit(s); s.chars[s.hero].hp = 1; });
  await ev(() => { var a0 = DS.applyClear; if (!DS._acW) { DS._acW = 1; DS.applyClear = function (sv, sc) { var o = a0(sv, sc); (DS._outs = DS._outs || []).push({ id: sc.id, first: o.first, gold: o.gold, tk: o.tickets }); return o; }; } });
  for (const id of [1, 2]) {
    const tk0 = await ev(() => DS.G.save.tickets);
    const r = await L.fightScenario(page, id, 150000);
    A(r === 'win', 'scenario ' + id + ' fought and won after the lapse (' + r + ')');
    await L.settle(page, 30000);
    const o = await ev((id) => { var a = (DS._outs || []).filter(function (x) { return x.id === id; }); return { o: a[a.length - 1], tk: DS.G.save.tickets, cl: !!DS.G.save.cleared[id] }; }, id);
    const want = await ev((id) => ({ g: Math.round(DS.scnGold(DS.scn(id)) * DS.BAL.gold), t: DS.scnTickets(DS.scn(id)) }), id);
    A(o.o && o.o.first && o.o.gold === want.g && o.o.tk === want.t && o.cl, 'scenario ' + id + ' first-clear again: gold ' + o.o.gold + ', tickets ' + o.o.tk + ' (tickets ' + tk0 + ' → ' + o.tk + ')');
  }
  c = await ev(() => { var s = DS.G.save; return { next: DS.nextScn(s).id, n: Object.keys(s.cleared).length }; });
  A(c.next === 3 && c.n === 2, 'progress continues from 3');
  // 입구 창 알림 (다섯 이상 깬 판 · 맹주를 이을 이가 없다)
  await L.edit(page, function () { for (var id = 3; id <= 5; id++) DS.applyClear(s, DS.scn(id)); });
  await L.closeAll(page);
  for (let i = 0; i < 30; i++) { const b = await ev(() => DS.cineBusy() || DS.cineQ().length > 0 || !!document.querySelector('.lootcall')); if (!b) break; await ev(() => { DS.cineSkip(); var lc = document.querySelector('.lootcall'); if (lc) lc.click(); }); await L.sleep(800); }      // 앞 판의 모집권 연출 · 전리품 알림을 넘긴다
  await ev(() => { DS.openGate(DS.scn(6), null); }); await L.sleep(400);
  const gt = await ev(() => { var el = document.querySelector('.sb.gate'); return el ? el.innerText : ''; });
  A(/대가 끊기고 1번 시나리오부터 다시/.test(gt), 'gate warns when no heir: ' + (gt.match(/맹주의 뒤[^\n]*/) || [''])[0]);
  await vshot('lapse_gate6');
  await L.closeAll(page);
  A((await L.badText(page)).length === 0, 'no NaN/undefined on screen');
  console.log('lapse done');
};
