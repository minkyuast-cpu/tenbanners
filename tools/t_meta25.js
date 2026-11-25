// 전민 — 2.5.0 시험: 선대의 훈수(mission.js) · 유품(heirloom.js) · 판의 선택지(choice.js) 를 진짜 화면에서 (390×844)
//   H=844 OUT=qa_out/meta25 node tools/shot.js tools/t_meta25.js
// ① 훈수: 3번을 진짜로 싸운다 — 시작할 때 단톡방 말풍선, 전투 화면의 작은 줄(지금 어떤가), 결과 창의 한 줄과 보상 (처음 한 번만) · 4번은 일부러 놓친다
//    고르기는 (씨앗 · 번호 · 들어간 수 · 대) 로 정해지고, 다시 들어가거나 대가 바뀌면 바뀐다 · 보스가 없는 17번에는 「막타」가 없다 · 갱도에는 훈수가 없다
// ② 판의 선택지: 3번 맺음 끝에 두 단추 → 고른 뒤의 줄 · 보상 → 결과 창. 13 · 24번은 두 갈래를 모두 골라 보고, 뒷글(30번 맺음 · 막간 「문 앞의 불」 · 엔딩)을 두 갈래 모두 진짜 화면에서 넘긴다
// ③ 유품: 맹주가 숨을 거두면 들던 무기가 유품이 된다 — 이별 연출의 「유품: …」, 가방 줄의 표, 자세히 창(누구의 것 · 마지막 한마디 · 대를 넘긴 수 · 같은 가문의 덤), 판매가 막힘,
//    같은 가문이 들면 공격 +3%(다른 가문은 덤 없음), 대를 넘기면 +6%, 저장을 다시 읽어도 남는다
'use strict';
module.exports = async function (page, shot, L) {
  const ev = (fn, arg) => page.evaluate(fn, arg), A = L.assert, sleep = L.sleep;
  await L.newGame(page, { cls: 'inf', name: '새벽' });
  await L.edit(page, function () {
    s.gold = 300000; DS.houseOpenN(s, 4); DS.mercTidy(s);
    DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 45; b.exp = 0; } }); DS.pSync(s);
    for (var id = 1; id <= 2; id++) DS.applyClear(s, DS.scn(id)); s.opt.cine = 'full';
  });
  await L.closeAll(page);
  await ev(() => { DS.chUi = true; DS.G.quiet = true; });

  // ── ① 순수 셈: 고르기 · 할 수 없는 것 빼기 · 보상 ──
  let c = await ev(() => {
    var s = DS.G.save, ctx = { boss: true, ult: true, cmds: 3, mercs: 2, ranged: true }, a = [], b = [];
    for (var n = 1; n <= 8; n++) a.push(DS.msnPick(s, 5, ctx, n));
    var keep = s.runs; s.runs = { n: 1, best: 2, hist: [] }; for (var m = 1; m <= 8; m++) b.push(DS.msnPick(s, 5, ctx, m)); s.runs = keep;
    var no17 = true; for (var k = 1; k <= 60; k++) if (DS.msnPick(s, 17, { boss: false, ult: false, cmds: 1, mercs: 0, ranged: false }, k) === 'bosshero' || DS.msnPick(s, 17, { boss: false, ult: false, cmds: 1, mercs: 0, ranged: false }, k) === 'ult') no17 = false;
    var same = DS.msnPick(s, 5, ctx, 3) === DS.msnPick(s, 5, ctx, 3);
    return { a: a, b: b, no17: no17, same: same, kinds: Object.keys(DS.MSN_TXT.c).length, r5: DS.msnReward(s, DS.scn(5)), r7: DS.msnReward(s, DS.scn(7)) };
  });
  A(c.kinds === 12 && c.same && new Set(c.a).size >= 4 && c.a.join() !== c.b.join() && c.no17 && c.r5.tk === 1 && c.r7.gold > 0,
    'mission pick is deterministic, varies by attempt (' + c.a.join(',') + ') and after a lapse (' + c.b.join(',') + '); stage 17 never gets the boss / ult ones; reward 5 → 1 ticket, 7 → +' + c.r7.gold + ' gold');

  // ── ① · ② 3번을 진짜로 싸운다: 훈수 말풍선 → 작은 줄 → 맺음 → 선택 → 결과 창 ──
  await ev(() => { DS.ui.closeAll(); DS.G.save.opt.hunt = true; DS.startScenario(DS.scn(3)); DS.G.sim.hunt = true; DS.G.save.opt.speed = 2; });
  await sleep(700);
  await ev(() => DS.msnForce('nofall'));
  await sleep(400);
  c = await ev(() => { var e = document.getElementById('msn'); return e ? { cls: e.className, t: e.innerText, hid: e.hidden } : null; });
  A(c && !c.hid && /pop/.test(c.cls) && /단톡방 · 훈수/.test(c.t) && /이번 판은 아무도 쓰러지지 마라/.test(c.t) && /해내면/.test(c.t), 'battle start: the 단톡방 throws a condition in a chat bubble — ' + (c && c.t.replace(/\n/g, ' / ')));
  await shot('msn_pop');
  await sleep(5000);
  c = await ev(() => { var e = document.getElementById('msn'); return e ? { cls: e.className, t: e.innerText, hid: e.hidden, top: e.getBoundingClientRect().top, qb: document.getElementById('top').getBoundingClientRect().bottom } : null; });
  A(c && !c.hid && /pill/.test(c.cls) && /훈수/.test(c.t) && /아무도 안 쓰러지기/.test(c.t) && /(지키는 중|놓쳤다)/.test(c.t) && c.top >= c.qb - 1, 'then it sits under the HUD in small text with live status: ' + c.t.replace(/\n/g, ' ') + ' (top ' + Math.round(c.top) + ' ≥ HUD ' + Math.round(c.qb) + ')');
  await shot('msn_pill');
  const tk0 = await ev(() => DS.G.save.tickets);
  for (let i = 0; i < 300 && !(await ev(() => DS.G.sim && DS.G.sim.result)); i++) await sleep(400);
  A(await ev(() => DS.G.sim.result === 'win'), 'scenario 3 won');
  for (let i = 0; i < 40 && !(await ev(() => !!document.querySelector('.ov.story'))); i++) await sleep(200);
  await L.skipStory(page, 6);
  for (let i = 0; i < 20 && !(await ev(() => !!document.querySelector('.ov.chov'))); i++) await sleep(200);
  c = await ev(() => { var o = document.querySelector('.ov.chov'); return o ? { who: o.querySelector('.who').textContent, q: o.querySelector('.line').textContent, b: [].map.call(o.querySelectorAll('.chb'), function (b) { return b.innerText.replace(/\n/g, ' | '); }) } : null; });
  A(c && c.who === '끓는 고개' && /바르간이 맹주를 본다/.test(c.q) && c.b.length === 2 && /고갯길 안내를 맡긴다.*영웅 모집권 1장/.test(c.b[0]) && /연맹 짐꾼으로 데려간다.*〈불목〉 방어구 한 점, 용암에서 화상을 입지 않는다/.test(c.b[1]),
    'scenario 3: after the outro the story box asks with two buttons — ' + (c && c.b.join(' // ')));
  await shot('choice3');
  await page.click('.ov.chov [data-ch="b"]'); await sleep(450);
  const readStory = async (name, shotAt) => { const seen = []; for (let i = 0; i < 40; i++) { const l = await ev(() => { var o = document.querySelector('.ov.story'); return o ? { w: o.querySelector('.who').textContent, t: o.querySelector('.line').textContent } : null; }); if (!l) break; seen.push(l); if (shotAt && shotAt(l, i)) await shot(name + '_' + (i + 1)); await page.click('.ov.story .story-box .line', { force: true }).catch(() => {}); await sleep(330); } return seen; };
  let st = await readStory('choice3b', (l) => /받았다/.test(l.t));
  A(st.length >= 4 && /통째로 등에 졌다/.test(st[0].t) && /받았다: .*〈불목〉/.test(st[st.length - 1].t), 'picking 「연맹 짐꾼으로 데려간다」 plays its aftermath and states the reward: ' + st.map(l => l.t).slice(-1));
  for (let i = 0; i < 20 && !(await ev(() => !!document.querySelector('.ov .result.res2 .msnres'))); i++) await sleep(250);
  await sleep(900);
  c = await ev(() => { var r = document.querySelector('.ov .result.res2 .msnres'), s = DS.G.save; return { t: r ? r.innerText.replace(/\n/g, ' ') : '', ok: r && r.classList.contains('ok'), pick: DS.chPick(s, 3), ember: Object.keys(s.gear).filter(function (k) { return /~ember/.test(k); }).length, tk: s.tickets, last: DS.msnLast }; });
  A(c.pick === 'b' && c.ember === 1 && /선대 단톡방|단톡방 · /.test(c.t) && (c.ok ? /다 살아 왔네.*훈수 성공, \+\d+골드/.test(c.t) : /못 지켰구나.*훈수 놓침/.test(c.t)),
    'result screen: one chat line for the mission (' + c.t + '), choice stored (3 = b) and the 불목 armour is in the bag');
  await shot('result_msn_ok');
  await L.settle(page, 30000); await L.closeAll(page);
  // 같은 대에 3번을 다시 깨도 묻지 않는다 · 훈수 보상은 그 판에서 한 번
  c = await ev(() => { var s = DS.G.save, o = DS.applyClear(s, DS.scn(3)); return { due: DS.chDue(s, DS.scn(3), o), set: DS.chSet(s, 3, 'a'), pick: DS.chPick(s, 3), give: DS.msnState(s).ok[3] ? DS.msnGive(s, DS.scn(3), { gold: 10 }) : 'notyet' }; });
  A(c.due === 0 && c.set === null && c.pick === 'b' && (c.give === null || c.give === 'notyet'), 'the choice is asked once per generation; the mission reward is first-success only');

  // ── ① 놓친 훈수: 4번 (「N초 안에」를 1초로) ──
  await ev(() => { DS.ui.closeAll(); DS.G.save.opt.hunt = true; DS.startScenario(DS.scn(4)); DS.G.sim.hunt = true; DS.G.save.opt.speed = 2; });
  await sleep(700); await ev(() => { DS.msnForce('fast', 1); });
  await sleep(5200);
  c = await ev(() => document.getElementById('msn').innerText.replace(/\n/g, ' '));
  A(/1초 안에 이기기/.test(c) && /놓쳤다/.test(c), 'live status turns to 「놓쳤다」 once the clock runs out: ' + c);
  await shot('msn_miss');
  for (let i = 0; i < 300 && !(await ev(() => DS.G.sim && DS.G.sim.result)); i++) await sleep(400);
  for (let i = 0; i < 40 && !(await ev(() => !!document.querySelector('.ov .result.res2'))); i++) { await L.skipStory(page, 3); await sleep(250); }
  await sleep(900);
  c = await ev(() => { var r = document.querySelector('.ov .result.res2 .msnres'); return r ? { t: r.innerText.replace(/\n/g, ' '), no: r.classList.contains('no') } : null; });
  A(c && c.no && /초 걸렸다\. 밥은 데워 먹어라\./.test(c.t) && /훈수 놓침/.test(c.t), 'failed mission: a gentle heckle on the result screen — ' + (c && c.t));
  await shot('result_msn_no');
  await L.settle(page, 30000); await L.closeAll(page);
  // 갱도에는 훈수가 없다
  c = await ev(() => { DS.ui.closeAll(); DS.startScenario(DS.pit(1)); return 1; });
  await sleep(900);
  c = await ev(() => { var e = document.getElementById('msn'); var r = { cur: !!DS.msnCur(), shown: !!(e && !e.hidden), pit: !!(DS.G.scn && DS.G.scn.pit) }; DS.G.sim.result = 'lose'; return r; });
  A(c.pit && !c.cur && !c.shown, 'the pit has no missions');
  await ev(() => { DS.G.scn = null; DS.G.ending = false; DS.ui.closeAll(); DS.enterZone('haemil'); });
  await sleep(800); await L.closeAll(page);

  // ── ② 13 · 24: 두 갈래를 모두 골라 본다 (진짜 선택 창 → 고른 뒤의 줄) ──
  for (const [n, k] of [[13, 'a'], [13, 'b'], [24, 'a'], [24, 'b']]) {
    await ev(([n]) => { var s = DS.G.save; if (s.chs) delete s.chs[n]; DS.ui.closeAll(); window.__chDone = 0; DS.chOpen(n, DS.scn(n), function () { window.__chDone = n; }); }, [n]);
    await sleep(450);
    c = await ev(() => { var o = document.querySelector('.ov.chov'); return o ? { who: o.querySelector('.who').textContent, b: [].map.call(o.querySelectorAll('.chb'), function (b) { return b.innerText.replace(/\n/g, ' | '); }) } : null; });
    A(c && c.b.length === 2, 'choice ' + n + ': ' + (c && c.who + ' — ' + c.b.join(' // ')));
    if (k === 'a') await shot('choice' + n);
    const g0 = await ev(() => ({ g: DS.G.save.gold, t: DS.G.save.tickets, n: Object.keys(DS.G.save.gear).length }));
    await page.click('.ov.chov [data-ch="' + k + '"]'); await sleep(450);
    st = await readStory('choice' + n + k, (l) => /받았다/.test(l.t));
    const g1 = await ev((n) => ({ g: DS.G.save.gold, t: DS.G.save.tickets, n: Object.keys(DS.G.save.gear).length, pick: DS.chPick(DS.G.save, n), done: window.__chDone }), n);
    const want = { '13a': g1.t === g0.t + 1, '13b': g1.g === g0.g + 3000, '24a': g1.n === g0.n + 1, '24b': g1.t === g0.t + 1 }[n + k];
    A(want && /받았다: /.test(st[st.length - 1].t) && g1.done === n, 'choice ' + n + k + ' aftermath (' + st.map(l => (l.w ? l.w + ': ' : '') + l.t).join(' / ') + ')');
  }
  // 뒷글을 두 갈래 모두 진짜 화면에서: 30번 맺음(마루) · 막간 「문 앞의 불」 · 엔딩
  for (const k of ['a', 'b']) {
    await ev((k) => { var s = DS.G.save; s.chs = { k: DS.cycKey(s), 3: k, 13: k, 24: k }; }, k);
    const plays = [['o30_' + k, () => { var sc = DS.scn(30); DS.ui.closeAll(); DS.ui.story(sc.outro, null, sc.name); }, /마루|흥얼/],
      ['c16_' + k, () => { var c = DS.LORE.campAll.filter(function (x) { return x.id === 'c16'; })[0]; DS.ui.closeAll(); DS.ui.story(DS.storyFit(c.lines, DS.G.save), null, c.title); }, /바르간|막내|당번/],
      ['end_' + k, () => { DS.ui.closeAll(); DS.ui.story(DS.LORE.ending, null, '엔딩'); }, /표지판|빈손|막내 올림|열두 장/]];
    const got = {};
    for (const [nm, fn, re] of plays) {
      await ev(fn); await sleep(450);
      got[nm] = await readStory(nm, (l) => re.test(l.t) || re.test(l.w));
    }
    const T = x => got[x].map(l => (l.w ? l.w + ': ' : '') + l.t);
    if (k === 'a') A(T('o30_a').some(t => /「나루\. 마루\. 돌쇠/.test(t)) && T('c16_a').some(t => /지키랬지/.test(t)) && T('c16_a').some(t => /^막내 대공/.test(t)) && T('end_a').some(t => /표지판/.test(t)) && T('end_a').some(t => /막내 올림/.test(t)),
      'branch a downstream in the real UI: 30 reads 마루, 바르간 the guide and the 막내 at the gate fire, the ending sign and letter');
    else A(T('o30_b').some(t => /「나루\. 돌쇠\./.test(t)) && T('o30_b').some(t => /흥얼거렸다/.test(t)) && T('c16_b').some(t => /짐은 다 내렸다/.test(t)) && T('c16_b').some(t => /당번 대공/.test(t)) && T('end_b').some(t => /빈손으로/.test(t)) && T('end_b').some(t => /열두 장/.test(t)),
      'branch b downstream in the real UI: 30 skips 마루 and the king hums it from the grave, 바르간 the porter and the duty lord at the gate fire, the ending lines');
  }
  await L.closeAll(page);

  // 2회차(대가 끊긴 뒤) · 다음 세대의 장: 갈림은 그 대에 처음부터 다시 · 장에서는 맺음 대신 묻는 줄 하나로
  c = await ev(() => {
    var s = DS.G.save, keepR = s.runs, keepE = JSON.parse(JSON.stringify(s.eg || {})), keepC = JSON.parse(JSON.stringify(s.cleared)), keepS = s.chs, r = {};
    s.chs = { k: DS.cycKey(s), 3: 'a', 13: 'a', 24: 'a' }; r.before = DS.chPick(s, 13);
    s.runs = { n: ((keepR && keepR.n) || 0) + 1, best: 30, hist: [] }; r.lapse = DS.chPick(s, 13); r.lapseDue = DS.chDue(s, DS.scn(13), { first: true });
    for (var i = 1; i <= 30; i++) s.cleared[i] = 1; s.eg.gen = 2; s.eg.on = 1; s.eg.c = {}; delete s.eg.pass;
    var e3 = DS.egScn(3, 2, s); r.eg = DS.chPick(s, 3); r.egDue = DS.chDue(s, e3, { first: false }); r.key = DS.cycKey(s);
    DS.ui.closeAll(); DS.chOpen(3, e3, function () {}); var o = document.querySelector('.ov.chov'); r.q = o ? o.querySelector('.line').textContent : '';
    window.__egRestore = function () { DS.ui.closeAll(); s.runs = keepR; s.eg = keepE; s.cleared = keepC; if (keepS) s.chs = keepS; else delete s.chs; };
    return r;
  });
  await shot('choice3_nextgen');
  await ev(() => window.__egRestore());
  A(c.before === 'a' && c.lapse === '' && c.lapseDue === 13 && c.eg === '' && c.egDue === 3 && /또 길을 막았다가/.test(c.q), 'choices reset after a lapse and in the next-generation chapter (' + c.key + '), where the box asks with its own line: ' + c.q);

  // ── ③ 유품: 맹주가 유니크 무기를 들고 숨을 거둔다 ──
  const W = 'sword.B~deadly8~bwind7';
  c = await ev((W) => {
    var s = DS.G.save, h = s.chars[s.hero]; s.gear[W] = 1; DS.equip(s, h, W);
    var P = s.lin.P; if (h.pid && P[h.pid]) P[h.pid].lw = '뒤를 부탁한다';
    var u0 = DS.cmdSpec(h, true), o = {}; for (var k in h) o[k] = h[k]; o.id = 9999; var uO = DS.cmdSpec(o, true);
    h.down = true; var evs = DS.linSettle(s, '끓는 고개'); window.__rite = 0; DS.ui.closeAll();
    DS.openLineageRite(evs, function () { window.__rite = 1; });
    return { hl: DS.hlOf(s, W), lock: !!s.lock[W], pre: [u0.atk, uO.atk] };
  }, W);
  A(c.hl && c.hl.n === '새벽' && c.hl.lw === '뒤를 부탁한다' && c.hl.at === '끓는 고개' && c.hl.N === 1 && c.lock, 'the 맹주 dies holding a unique sword: it becomes 「새벽의 유품」 with last words and place, and is locked (' + JSON.stringify(c.hl) + ')');
  let cine = null; for (let i = 0; i < 30 && !cine; i++) { await sleep(200); cine = await ev(() => { var el = document.querySelector('.cine'); return el ? { k: el.className, hl: (el.querySelector('.chl') || {}).textContent || '' } : null; }); }
  A(cine && /유품: 새벽의 /.test(cine.hl), 'farewell cinematic carries the sub-line 「' + (cine && cine.hl) + '」');
  await sleep(2300); await shot('hl_cine');
  await ev(() => DS.cineSkip()); await sleep(500);
  await ev(() => { DS.ui.closeAll(); var s = DS.G.save; DS.linAutoAll(s); try { DS.rebuildParty(); } catch (x) {} DS.ui.persist(); });
  await L.closeAll(page);
  c = await ev((W) => {      // 2.6.0: 떠난 이의 장비는 가방으로 — 후계는 빈손으로 서고, 유품은 가방에 있다. 다시 입히면 같은 가문의 덤이 붙는다
    var s = DS.G.save, h = s.chars[s.hero], w0 = h.w, a0 = h.a, bag = s.gear[W] || 0, eq = DS.equip(s, h, W), o = {}; for (var k in h) o[k] = h[k]; o.id = 9999;
    return { heir: DS.charName(h), w0: w0, a0: a0, bag: bag, eq: eq, w: h.w, same: DS.cmdSpec(h, true).atk, other: DS.cmdSpec(o, true).atk, bt: DS.hlBonusTxt(s, W, h) };
  }, W);
  A(c.w0 == null && c.a0 == null && c.bag === 1 && c.eq && c.w === W && c.same > c.other && Math.abs(c.same / c.other - 1.03) < 0.02 && /로저스 가문이 들면 공격 \+3%/.test(c.bt), 'heir ' + c.heir + ' starts bare, the heirloom waits in the bag; re-equipped: same house atk ' + c.same + ' vs another house ' + c.other + ' (+3%) — ' + c.bt);
  // 장비 고르기 창(지금 것 줄): 유품 표와 내력
  await ev(() => { var s = DS.G.save; DS.ui.closeAll(); DS.openMenu('party'); DS.gearPickOpen(s.hero, 'w'); }); await sleep(600);
  c = await ev(() => { var o = [].slice.call(document.querySelectorAll('#app .ov')).pop(), b = o && o.querySelector('.lhlb'); return { mark: !!(o && o.querySelector('.lhl')), t: b ? b.innerText.replace(/\n/g, ' / ') : '' }; });
  A(c.mark && /새벽의 유품/.test(c.t) && /「뒤를 부탁한다」/.test(c.t) && /대를 넘긴 수 1/.test(c.t) && /공격 \+3%/.test(c.t), 'equip list: heirloom mark and lore — ' + c.t);
  await shot('hl_equip');
  // 가방: 표 · 자세히 창 · 판매 막힘 · 일괄 정리에서 빠짐
  await ev((W) => { var s = DS.G.save; DS.ui.closeAll(); DS.unequip(s, s.chars[s.hero], 'w'); DS.openMenu('bag'); }, W); await sleep(600);
  c = await ev((W) => { var r = document.querySelector('[data-loot-open="' + W + '"]'); if (r) r.scrollIntoView(); return { row: !!r, mark: !!(r && r.querySelector('.lhl')), ck: !!(r && r.querySelector('.ck[disabled]')) }; }, W);
  A(c.row && c.mark && c.ck, 'bag row shows the 유품 mark and cannot be ticked for bulk sale');
  await shot('hl_bag');
  await page.click('[data-loot-open="' + W + '"] .tx'); await sleep(600);
  c = await ev(() => { var o = [].slice.call(document.querySelectorAll('#app .ov')).pop(), b = o && o.querySelector('.lhlp'), sell = o && o.querySelector('[data-loot-sell]'); return { t: b ? b.innerText.replace(/\n/g, ' / ') : '', sellOff: !!(sell && sell.disabled), title: o ? o.querySelector('h2').innerText : '' }; });
  A(/새벽의 유품/.test(c.t) && /「뒤를 부탁한다」/.test(c.t) && /끓는 고개/.test(c.t) && /대를 넘긴 수 1/.test(c.t) && c.sellOff && /유품/.test(c.title), 'heirloom popup: ' + c.t + ' · sell button off (locked)');
  await shot('hl_popup');
  await ev((W) => { var s = DS.G.save; DS.ui.closeAll(); DS.equip(s, s.chars[s.hero], W); DS.ui.persist(); }, W);
  // 대를 넘긴다: 다음 맹주도 들고 떠나면 +6% · 저장을 다시 읽어도 남는다
  c = await ev((W) => {
    var s = DS.G.save, h = s.chars[s.hero]; h.down = true; DS.linSettle(s, '바람재'); DS.linAutoAll(s); try { DS.rebuildParty(); } catch (x) {}
    var h2 = s.chars[s.hero]; DS.equip(s, h2, W); var o = {}; for (var k in h2) o[k] = h2[k]; o.id = 9999;      // 2.6.0: 유품은 가방으로 돌아왔다 — 다음 맹주가 다시 든다
    var raw = JSON.parse(JSON.stringify(s)), fx = DS.fixSave(raw);
    return { N: DS.hlOf(s, W).N, bt: DS.hlBonusTxt(s, W, h2), r: DS.cmdSpec(h2, true).atk / DS.cmdSpec(o, true).atk, kept: !!(fx.gh[W] && fx.gh[W].hl && fx.gh[W].hl.N === 2 && fx.lock[W]) };
  }, W);
  A(c.N === 2 && /공격 \+6%/.test(c.bt) && Math.abs(c.r - 1.06) < 0.02 && c.kept, 'passed down a second generation: 대를 넘긴 수 2, ' + c.bt + ' (×' + c.r.toFixed(3) + '), survives a save round-trip');
  await L.closeAll(page);
  // 가주(깃발을 든 부대원)가 떠날 때도 · 보통 장비는 같은 것이 둘이면 유품이 되지 않는다
  c = await ev(() => {
    var s = DS.G.save, f = DS.charList(s).filter(function (x) { return x.id !== s.hero && DS.bearer(s, x); })[0], b = DS.bearer(s, f), w = f.w, n0 = (s.gear[w] || 0);
    var U2 = 'lance.A~keen7'; s.gear[U2] = 1; if (DS.CLS_GEAR[f.cls].w[0] !== 'lance') U2 = DS.CLS_GEAR[f.cls].w[0] + '.A~keen7', s.gear[U2] = 1; delete s.gear['lance.A~keen7']; DS.equip(s, f, U2);
    b.lw = '교대… 부탁한다'; var lost = DS.loseMerc(s, b.id); DS.linMercDied(s, lost, '늑대골');
    return { id: U2, hl: DS.hlOf(s, U2), plainDup: (function () { var t = DS.newSave('복', 'cav'); DS.houseOpenN(t, 6); DS.mercTidy(t); var g = DS.charList(t).filter(function (x) { return x.id !== t.hero && x.w === t.chars[t.hero].w; })[0]; if (!g) return 'n/a'; var hh = t.chars[t.hero], w0 = hh.w; hh.down = true; DS.linSettle(t, '시험'); return DS.hlOf(t, w0) ? 'made' : 'none'; })() };
  });
  A(c.hl && c.hl.k === 'c' && c.hl.lw === '교대… 부탁한다' && c.hl.N === 1 && (c.plainDup === 'none' || c.plainDup === 'n/a'), 'a 가주 death makes an heirloom too (' + c.hl.n + ', ' + c.id + '); a plain piece shared by two houses does not (' + c.plainDup + ')');
  await sleep(2000); await shot('hl_toast');
  A((await L.badText(page)).length === 0, 'no NaN/undefined on screen');
  console.log('meta25 done');
};
