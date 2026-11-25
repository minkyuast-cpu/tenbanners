// 2.6.0 화면 다듬기 시험 (390×844): 혼인 · 출전 고르기의 누름 수, 등급 테(.gfr gN)가 같은 사람에게 화면마다 같은가, 병과 · 단이 바뀌면 모습이 따라 바뀌는가.
//   H=844 OUT=qa_out/ux26 node tools/shot.js tools/t_ux26.js   (웹 판: PAGE=…/dist/web/index.html)
//   ① 혼인: 메뉴 → 인물 → 「배우자 고르기」 → 줄의 「혼인」 → 「혼인한다」 = 5번 (예전 7번: 메뉴 → 인물 → 배우자감 → 후보 줄 → 배우자로 맞기 → 선택 → 혼인한다)
//   ② 출전: 입구 창에서 얼굴 한 번 + 「입장」 = 2번 (예전 5번: 바꾸기 → 쉬게 할 이 → 내보낼 이 → 확인 → 입장) · 부대 탭은 가주 카드의 단추 한 번 (예전 4번)
//   ③ 막사 → 가주: 막사 줄의 「가주로」 한 번 (예전 2번: 교체 → 고르기 창에서 다시 교체)
//   ④ 등급 테: 한 사람(P — 막사 → 배우자(가문원) → 전사)을 열 곳 넘게 따라가며 테의 등급 클래스가 같은지, 떠난 뒤에도 테 색이 그대로인지 (사건 연출 「이별」 · 추모 목록 포함). 가주 Q · 맹주(왕관 표)도.
//   ⑤ 모습: 가주는 가문 병과의 그 단 모습(승급하면 옷이 바뀐다) · 병과가 다른 생김새로 남던 네 가문(비병 · 해병 · 법사 · 사교) · 맹주 가문원이 빈 가문의 가주가 될 때 · 막사 · 싸움터의 그림 = 초상 · 8단 윗길 · 제 몸의 종족은 그대로 · 맹주를 이은 뒤
//   ⑥ 390 폭에서 가로로 밀리지 않는다 · 가로 화면(844×390)도 깨지지 않는다.   UX26=폴더 면 화면을 그 폴더에도 (ux26_*.png)
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, shot, L, env) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), V = process.env.UX26;
  const snap = async (n) => { await shot(n); if (V) { fs.mkdirSync(V, { recursive: true }); await page.screenshot({ path: path.join(V, 'ux26_' + n + '.png') }); } };
  let taps = 0;
  const tap = async (sel) => { taps++; await page.click(sel); await L.sleep(420); };
  const docW = () => ev(() => document.documentElement.scrollWidth);
  // 테 읽기: sel 에 맞는 테 하나의 { 클래스 속 등급(gN), dead, lord, 테두리 색 }
  const fr = (sel) => ev((sel) => { var e = document.querySelector(sel); if (!e) return null; var c = e.className, m = /(?:^|\s)g([0-5])(?:\s|$)/.exec(c), cs = getComputedStyle(e), bc = cs.borderTopWidth !== '0px' ? cs.borderTopColor : ((/rgba?\([^)]*\)/.exec(getComputedStyle(e, '::before').boxShadow) || [''])[0]);      // 싸움 화면 칩은 둥근 테를 ::before 의 안쪽 그림자로 그린다
    return { gfr: /(?:^|\s)gfr(?:\s|$)/.test(c), g: m ? +m[1] : -1, dead: /(?:^|\s)dead(?:\s|$)/.test(c), lord: /(?:^|\s)lord(?:\s|$)/.test(c), col: bc, has: !!e.querySelector('canvas, img, i.spr') }; }, sel);

  await L.newGame(page, { cls: 'inf', name: '시험' });
  await ev(() => { var a = 20261125; Math.random = function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });
  const ids = await L.edit(page, function () {
    s.gold = 2000000; s.opt.cine = 'full'; s.opt.wedTip = 1;
    for (var id = 1; id <= 13; id++) DS.applyClear(s, DS.scn(id));
    DS.houseOpenN(s, 9);
    var hero = s.chars[s.hero], osx = hero.sx === 'f' ? 'm' : 'f';
    DS.charList(s).forEach(function (c, i) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 32 + i * 3; b.exp = 0; if (c.id !== s.hero) b.g = 1 + (i % 4); } });
    var cl = ['arc', 'fly', 'mag', 'sha', 'mar', 'cav'], P = null;
    for (var i = 0; i < 6; i++) { var m = DS.rollPerson(s, null, 1, DS.heroType(cl[i])); m.g = i === 0 ? 5 : 1 + (i % 4); m.nc = cl[i]; m.sb = 1; m.L = 34 + i * 2; if (i === 0) { m.sx = osx; P = m; } }
    var kin = DS.addMerc(s, 'm_sword', 2, s.hero); kin.kn = 1; kin.L = 30; kin.sx = hero.sx;
    DS.mercTidy(s); DS.linTidy && DS.linTidy(s); DS.pSync(s);
    return { P: P.id, Pn: P.n, kin: kin.id, hero: s.hero, hsx: hero.sx };
  });
  await ev(() => { DS.enterZone('haemil'); }); await L.sleep(700); await L.closeAll(page);
  const P = ids.P, PG = 5, gpP = 'm' + P, gpH = 'c' + ids.hero;
  const seenP = [], addP = async (name, sel) => { const f = await fr(sel); A(f && f.gfr && f.g === PG && f.has, 'P frame on 「' + name + '」: .gfr g' + (f ? f.g : '?') + (f && f.dead ? ' dead' : '') + ' (' + (f ? f.col : 'missing ' + sel) + ')'); seenP.push(Object.assign({ name: name }, f)); return f; };

  // ───────── ① 혼인 ─────────
  // 맹주의 사람 창: 혼인하는 단추는 하나뿐 (예전에는 「배우자 후보 보기」 + 「배우자로 맞기」 둘)
  await ev(() => DS.heroInfo(null)); await L.sleep(500);
  let c = await ev(() => { var o = document.querySelector('.ov'); return { wed: o.querySelectorAll('[data-lgwed], [data-gowed], [data-wedopen]').length, txt: (o.querySelector('[data-lgwed]') || {}).textContent || '' }; });
  A(c.wed === 1 && /배우자 고르기/.test(c.txt), 'hero sheet (unmarried): exactly one marriage button (「' + c.txt.trim() + '」)');
  await L.closeAll(page);
  // 사람 쪽(막사의 P)에서: 「맹주와 혼인」 → 곧바로 확인 (한 줄짜리 고르기 창이 없다)
  await ev((id) => DS.ui.mercInfo(id, null), P); await L.sleep(500);
  await addP('인물 창 머리', '.ov .ph2 .ppor[data-gp="' + gpP + '"]');
  c = await ev(() => { var b = document.querySelector('.ov [data-lgwed]'); if (!b) return { no: 1 }; b.click(); return { txt: b.textContent, yes: !!document.querySelector('#yesWed'), ovs: document.querySelectorAll('.ov:not(.ghost)').length }; });
  A(!c.no && /맹주와 혼인/.test(c.txt) && c.yes && c.ovs === 2, 'person sheet: 「' + (c.txt || '') + '」 opens the one confirmation directly (no pick-of-one sheet)');
  await ev(() => document.querySelector('.ov.modal [data-close]').click()); await L.sleep(300);
  await L.closeAll(page);
  // 진짜 흐름: 메뉴 → 인물 → 배우자 고르기 → 혼인 → 혼인한다
  taps = 0;
  await tap('#bMenu');
  await addP('부대 탭 막사 줄', '.ov .bar2 .brow[data-info="' + P + '"] .gfr');
  await tap('.ov [data-tab="people"]');
  c = await ev(() => { var o = document.querySelector('.ov'); return { wedFilter: !!o.querySelector('[data-pf="wed"]'), note: !!o.querySelector('.wednote [data-wedopen]'), txt: (o.querySelector('.wednote') || {}).innerText || '' }; });
  A(!c.wedFilter && c.note, '인물 tab: no 「배우자 후보」 filter chip any more, one 「배우자 고르기」 button on the banner (' + c.txt.replace(/\s+/g, ' ') + ')');
  await addP('인물 탭 줄', '.ov [data-pp="' + gpP + '"] .pfr');
  await snap('people_tab');
  await tap('.ov .wednote [data-wedopen]');
  c = await ev((P) => { var o = [...document.querySelectorAll('.ov:not(.ghost)')].pop(), rows = [...o.querySelectorAll('.wedr:not(.dim)')], r0 = rows[0];
    return { title: o.querySelector('.sh h3').textContent, rows: rows.length, first: r0 ? +r0.dataset.info : 0, btn: r0 ? !!r0.querySelector('[data-wedto]') : false, kid: rows.every(r => !!r.querySelector('.kpot .gbdg')), badge: rows.every(r => !!r.querySelector('.p1 .gbdg')), frame: rows.every(r => !!r.querySelector('.gfr')), role: rows.every(r => !!r.querySelector('.prole')), age: rows.every(r => /\d+살/.test(r.querySelector('.pl').textContent)),
      odds: /첫해 아이 가망 약 \d+%/.test(o.querySelector('.wedhd').textContent), sort: [...o.querySelectorAll('[data-wsort]')].map(b => b.dataset.wsort + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(','), sw: document.documentElement.scrollWidth, more: !!o.querySelector('[data-lgno]') }; }, P);
  A(c.title === '혼인' && c.rows >= 3 && c.first === P && c.btn, '혼인 sheet: ' + c.rows + ' candidates, best grade first (P), each row has its own 「혼인」 button');
  A(c.kid && c.badge && c.frame && c.role && c.age && c.odds, 'decision info is on the row: grade frame · grade badge · seat · age · 아이 등급 예상, and the first-year odds in the header');
  A(c.sort.indexOf('g*') >= 0 && c.sw <= 390, 'sort defaults to 등급 (' + c.sort + '), fits 390px (' + c.sw + ')');
  await addP('혼인 창 후보 줄', '.ov .wedr[data-info="' + P + '"] .gfr');
  let fH = await fr('.ov .wedhd .gfr[data-gp="' + gpH + '"]');
  A(fH && fH.gfr && fH.lord, '혼인 sheet head: 맹주 frame carries the crown mark (.lord, g' + (fH && fH.g) + ')');
  await snap('wed_sheet');
  // 정렬은 기억한다
  await ev(() => { [...document.querySelectorAll('.ov:not(.ghost)')].pop().querySelector('[data-wsort="a"]').click(); }); await L.sleep(250);
  A(await ev(() => DS.G.save.opt.wedSort === 'a'), 'chosen sort is remembered (opt.wedSort)');
  await ev(() => { [...document.querySelectorAll('.ov:not(.ghost)')].pop().querySelector('[data-wsort="g"]').click(); }); await L.sleep(250);
  await tap('.ov .wedr[data-info="' + P + '"] [data-wedto]');
  c = await ev(() => { var q = document.querySelector('.wedq'); return q ? { txt: q.innerText.replace(/\s+/g, ' '), faces: q.querySelectorAll('.wedpair .gfr').length, yes: !!q.querySelector('#yesWed') } : null; });
  A(c && c.faces === 2 && c.yes && /가문원이 되어 함께 싸운다/.test(c.txt) && /아이 등급/.test(c.txt), 'one confirmation with both faces, what happens to the spouse and the child grade (' + (c ? c.txt.slice(0, 90) : '') + ')');
  await addP('혼인 확인 창', '.wedq .wedpair .gfr[data-gp="' + gpP + '"]');
  await snap('wed_confirm');
  await tap('#yesWed'); await L.sleep(900);
  c = await ev(() => { var s = DS.G.save, h = s.chars[s.hero], hp = s.lin.P[h.pid]; return { sp: !!(hp && hp.sp), cine: (DS.cineInfo() || {}).k || '' }; });
  A(c.sp && c.cine === 'wed', 'married after ' + taps + ' taps; the wedding cinematic plays');
  A(taps === 5, 'marriage flow = 5 taps (메뉴 → 인물 → 배우자 고르기 → 혼인 → 혼인한다); was 7 with the candidate filter → person sheet → 배우자로 맞기 → 선택 → 혼인한다');
  await addP('혼인 연출', '.cine .cfa[data-gp="' + gpP + '"]');
  fH = await fr('.cine .cfa[data-gp="' + gpH + '"]');
  A(fH && fH.gfr && fH.lord, 'wedding cinematic: 맹주 face has the 맹주 frame');
  await snap('wed_cine');
  await ev(() => DS.cineSkip()); await L.sleep(600);
  c = await ev(() => { var o = [...document.querySelectorAll('.ov:not(.ghost)')].pop(); return { title: o.querySelector('.sh h3').textContent, box: !!o.querySelector('.wedbox .wsp .gfr'), part: !!o.querySelector('[data-lgpart]'), cand: o.querySelectorAll('[data-wedto]').length }; });
  A(c.title === '혼인' && c.box && c.part && c.cand === 0, 'the same sheet now shows the spouse card with 이별 (no candidate buttons)');
  await snap('wed_married');
  await L.closeAll(page);
  A((await docW()) <= 390, 'no horizontal scroll after the marriage flow');

  // ───────── ④-a 등급 테: P 는 이제 가문원 ─────────
  await ev(() => DS.openMenu('party')); await L.sleep(500);
  await addP('부대 탭 가문원 줄', '.ov .hkk [data-info="' + P + '"] .gfr');
  const cardH = await fr('.ov .hk.lord .hkf[data-gp="' + gpH + '"]');
  A(cardH && cardH.gfr && cardH.lord, 'party tab: 맹주 card portrait has the 맹주 frame (g' + (cardH && cardH.g) + ')');
  await ev(() => { document.querySelector('.ov .hk.lord[data-ch]').click(); }); await L.sleep(500);
  await addP('맹주 가문 창 가문원 줄', '.ov .cs2 [data-info="' + P + '"] .gfr');
  await L.closeAll(page);
  await ev(() => DS.openLineage('tree')); await L.sleep(600);
  await addP('가계도', '.ov .lgn .gfr[data-gp="' + gpP + '"]');
  fH = await fr('.ov .lgn .gfr[data-gp="' + gpH + '"]');
  A(fH && fH.lord, 'family tree: 맹주 node frame has the crown mark');
  await snap('lineage');
  await L.closeAll(page);

  // ───────── ② 출전 고르기 ─────────
  await ev(() => DS.openMenu('party')); await L.sleep(500);
  c = await ev(() => { var o = document.querySelector('.ov'), s = DS.G.save; return { pick: !!o.querySelector('[data-sopick]'), bar: (o.querySelector('.sobar.party') || {}).innerText || '', faces: o.querySelectorAll('.sobar .sof').length, on: o.querySelectorAll('.hk .hkso:not(.rs)').length, rs: o.querySelectorAll('.hk9 .hkso.rs[data-sotg]').length, cands: DS.sortieCands(s).length, sw: document.documentElement.scrollWidth }; });
  A(!c.pick && c.faces === 0 && /출전 3 \/ 3/.test(c.bar), 'party tab: one summary line (' + c.bar.replace(/\s+/g, ' ') + '), no 바꾸기 button and no second row of faces');
  A(c.on === 3 && c.rs === c.cands - 2 && c.sw <= 390, 'every 가주 card carries its own 출전/쉼 button (' + c.on + ' out, ' + c.rs + ' resting), fits 390px');
  await snap('party_tab');
  const rest1 = await ev(() => +document.querySelector('.ov .hk9 .hkso.rs[data-sotg]').dataset.sotg);
  taps = 0;
  await tap('.ov .hk9 .hkso.rs[data-sotg="' + rest1 + '"]');
  c = await ev((id) => { var s = DS.G.save; return { on: DS.sortieOn(s, id), party: s.party.indexOf(id) >= 0, ovs: document.querySelectorAll('.ov:not(.ghost)').length, picker: !!document.querySelector('.sopk'), btn: (document.querySelector('.ov .hk9 .hkso[data-sotg="' + id + '"]') || {}).className || '', n: s.sortie.length }; }, rest1);
  A(c.on && c.party && c.ovs === 1 && !c.picker && !/rs/.test(c.btn) && c.n === 2 && taps === 1, 'party tab: 1 tap on a resting card sends that 가주 out, in place (no picker sheet); was 4 (바꾸기 → 쉴 이 → 나갈 이 → 확인)');
  await L.closeAll(page);
  // 입구 창: 모두가 한 줄에, 누르면 그 자리에서
  await ev(() => DS.openGate(DS.scn(14), null)); await L.sleep(500);
  c = await ev(() => { var o = document.querySelector('.ov .gate'), s = DS.G.save, sofs = [...o.querySelectorAll('.sobar.gate .sof')], vw = document.documentElement.clientWidth; return { n: sofs.length, cands: DS.sortieCands(s).length, on: o.querySelectorAll('.sof.in').length, lord: !!o.querySelector('.sof.lord.in .gfr.lord'), frames: sofs.every(e => !!e.querySelector('.gfr')), inView: sofs.every(e => { var r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= vw; }), pick: !!o.querySelector('[data-sopick]'), sw: document.documentElement.scrollWidth, line: [...o.querySelectorAll('.facts dt')].filter(d => d.textContent === '우리 부대')[0].nextElementSibling.textContent }; });
  A(c.n === c.cands + 1 && c.on === 3 && c.lord && c.frames && !c.pick, 'gate: everyone on one strip (맹주 + ' + c.cands + ' 가주), three marked 출전, every face in a grade frame, no 바꾸기');
  A(c.inView && c.sw <= 390, 'gate strip fits 390px with no horizontal scroll (' + c.sw + ')');
  await snap('gate');
  const line0 = c.line, rest2 = await ev(() => +document.querySelector('.ov .gate .sof.rest[data-sotg]').dataset.sotg);
  taps = 0;
  await tap('.ov .gate .sof.rest[data-sotg="' + rest2 + '"]');
  c = await ev((id) => { var o = document.querySelector('.ov .gate'), s = DS.G.save; return { gate: !!o, on: DS.sortieOn(s, id), cls: (o.querySelector('.sof[data-sotg="' + id + '"]') || {}).className || '', ovs: document.querySelectorAll('.ov:not(.ghost)').length, go: !!document.querySelector('#goScn'), three: o.querySelectorAll('.sof.in').length, units: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead && u.role === 'cmd').map(u => u.ch), line: [...o.querySelectorAll('.facts dt')].filter(d => d.textContent === '우리 부대')[0].nextElementSibling.textContent }; }, rest2);
  A(c.gate && c.on && /\bin\b/.test(c.cls) && c.ovs === 1 && c.three === 3 && c.units.indexOf(rest2) >= 0, 'gate: tapping a resting face swaps it in on the spot — still the gate, still three out, field units follow');
  A(c.go && taps === 1, 'gate → change one → 입장 = 2 taps (face + 입장); was 5 (바꾸기 → 쉴 이 → 나갈 이 → 확인 → 입장). 우리 부대: 「' + line0.trim() + '」 → 「' + c.line.trim() + '」');
  await snap('gate_after_tap');
  // 맹주는 늘 나간다 (눌러도 그대로)
  await ev(() => document.querySelector('.ov .gate .sof.lord').click()); await L.sleep(200);
  A(await ev(() => document.querySelectorAll('.ov .gate .sof.in').length === 3 && !!document.querySelector('.ov .gate .sof.lord.in')), '맹주 always goes out (tap does nothing but a hint)');
  await L.closeAll(page);
  await ev(() => DS.openPit(null)); await L.sleep(500);
  A(await ev(() => { var o = document.querySelector('.ov .pitw'); return !!o && o.querySelectorAll('.sobar.gate .sof .gfr canvas').length >= 3 && !o.querySelector('[data-sopick]'); }), 'pit entry uses the same strip');
  await L.closeAll(page);

  // ───────── ④-b 등급 테: 가주 Q (출전 중) ─────────
  const Q = await ev(() => { var s = DS.G.save, ch = s.chars[s.party[1]], b = DS.bearer(s, ch); return { ch: ch.id, m: b.id, g: b.g, n: b.n }; });
  const gpQ = 'm' + Q.m, seenQ = [], addQ = async (name, sel) => { const f = await fr(sel); A(f && f.gfr && f.g === Q.g, 'Q frame on 「' + name + '」: .gfr g' + (f ? f.g : '? ' + sel)); seenQ.push(Object.assign({ name: name }, f)); };
  await addQ('싸움 화면 칩', '#chips .chip .por[data-gp="' + gpQ + '"]');
  A((await fr('#chips .chip .por[data-gp="' + gpH + '"]')).gfr, 'HUD chip of the 맹주 has a grade frame too');
  await ev(() => DS.openMenu('party')); await L.sleep(500);
  await addQ('부대 탭 가주 카드', '.ov .hk9 .hkf[data-gp="' + gpQ + '"]');
  await ev((id) => document.querySelector('.ov .hk9 .hk[data-ch="' + id + '"]').click(), Q.ch); await L.sleep(500);
  await addQ('가문 창 머리', '.ov .ph2 .ppor[data-gp="' + gpQ + '"]');
  await addQ('가문 창 가주 줄', '.ov .cs2 .row[data-info="' + Q.m + '"] .gfr');
  c = await ev(() => { var o = [...document.querySelectorAll('.ov:not(.ghost)')].pop(); return { swapBtn: !!o.querySelector('[data-bn="pick"]'), duty: !!o.querySelector('.duty.so [data-sotg]') }; });
  A(!c.swapBtn && c.duty, 'house sheet: the 가주 row no longer opens a second list (교체 is on the 막사 rows), 출전/쉬기 stays');
  await snap('house_sheet');
  await L.closeAll(page);
  await ev(() => DS.openMenu('people')); await L.sleep(500);
  await addQ('인물 탭 줄', '.ov [data-pp="' + gpQ + '"] .pfr');
  await L.closeAll(page);
  await ev(() => DS.openGate(DS.scn(14), null)); await L.sleep(500);
  await addQ('입구 창 출전 줄', '.ov .gate .sof .gfr[data-gp="' + gpQ + '"]');
  await L.closeAll(page);

  // ───────── ③ 막사 → 가주 (한 번에) ─────────
  await ev(() => DS.openMenu('party')); await L.sleep(500);
  const sb = await ev(() => { var s = DS.G.save, b = [...document.querySelectorAll('.ov .bar2 [data-sbset]:not([disabled])')].map(x => x.dataset.sbset.split(':').map(Number)).filter(x => x[1])[0]; if (!b) return null; var ch = s.chars[b[1]], cur = DS.bearer(s, ch); return { m: b[0], ch: b[1], cur: cur ? cur.id : 0, row: document.querySelector('.ov .bar2 .brow[data-info="' + b[0] + '"]').innerText.replace(/\s+/g, ' ') }; });
  A(!!sb && /가주로/.test(sb.row), 'barracks row shows 「가주로」 with the power as 가주 on the row (' + (sb ? sb.row : '') + ')');
  taps = 0;
  await tap('.ov .bar2 [data-sbset="' + sb.m + ':' + sb.ch + '"]');
  c = await ev((x) => { var s = DS.G.save, b = DS.bearer(s, s.chars[x.ch]), old = s.mercs.filter(m => m.id === x.cur)[0]; return { now: b ? b.id : 0, oldSb: !!(old && old.sb), ovs: [...document.querySelectorAll('.ov:not(.ghost)')].filter(o => !o.querySelector('.rnbox, [data-rn], .nfbox') && !/이름/.test((o.querySelector('h2, h3') || {}).textContent || '')).length, pick: [...document.querySelectorAll('.ov .sh h3')].some(h => h.textContent === '이 가문의 가주') }; }, sb);
  if (!(c.now === sb.m && c.oldSb && c.ovs === 1 && !c.pick)) console.log('DBG seat ' + JSON.stringify(c) + ' ' + JSON.stringify(sb));
  A(c.now === sb.m && c.oldSb && c.ovs === 1 && !c.pick && taps === 1, 'seating a barracks person as 가주 = 1 tap (was 2: 교체 → the picker sheet → 교체 again); the old 가주 went to the barracks');
  for (let i = 0; i < 3; i++) { await ev(() => { var q = document.querySelector('.ov.modal [data-close]'); if (q) q.click(); }); await L.sleep(300); }      // 새 가주의 「처음 이름 정하기」 창이 뜨면 닫는다
  await snap('barracks_seated');
  await L.closeAll(page);

  // ───────── ⑤ 모습은 병과와 단을 따른다 ─────────
  const lk = await ev((kinId) => {
    var s = DS.G.save, U = DS.ui, out = { houses: [], tiers: [], bar: [] }, base = function (n) { return String(n || '').split('#')[0]; };
    DS.charList(s).forEach(function (ch) { if (ch.id === s.hero) return; var b = DS.bearer(s, ch); if (!b) return; var t = DS.tierOfL(DS.pL(b)), nm = DS.charLook(ch, s)[0]; out.houses.push({ cls: ch.cls, type: b.type, t: t, name: nm, ok: base(nm) === DS.lookName(ch.cls, t), tree: U.gfM(b, 2).indexOf(U.charSpr(ch, 2)) >= 0 }); });
    // 승급: 3 → 4 · 4 → 5 · 7 → 8 단의 모습이 서로 다르다 (예전에는 4단의 은테 말고는 그대로였다)
    DS.charList(s).forEach(function (ch) { if (ch.id === s.hero) return; var b = DS.bearer(s, ch); if (!b || DS.keepsBody(b)) return; var n = function (t) { return base(DS.charLook(ch, s, t)[0]); }; out.tiers.push({ cls: ch.cls, d34: n(3) !== n(4), d45: n(4) !== n(5), d78: n(7) !== n(8), rise: n(8).indexOf(DS.RISE_OF[ch.cls] + '_8') === 0 }); });
    // 막사: 받은 병과의 제 단 모습
    DS.barracks(s).forEach(function (m) { var nm = DS.personLook(m, s)[0]; out.bar.push({ nc: m.nc, type: m.type, name: nm, ok: base(nm) === DS.lookName(m.nc, DS.tierOfL(DS.pL(m))) }); });
    // 맹주 가문원: 따르는 종류의 모습
    var kin = s.mercs.filter(function (m) { return m.id === kinId; })[0]; out.kin = DS.personLook(kin, s)[0];
    return out;
  }, ids.kin);
  A(lk.houses.length === 9 && lk.houses.every(h => h.ok), 'every 가주 wears the house class look of the current 단: ' + lk.houses.map(h => h.cls + '←' + h.type.replace('m_', '') + ' ' + h.name.split('#')[0]).join(', '));
  const mis = lk.houses.filter(h => ['fly', 'mar', 'mag', 'sha'].indexOf(h.cls) >= 0);
  A(mis.length === 4 && mis.every(h => h.name.indexOf(h.cls + '_') === 0 && h.name.indexOf(h.type) < 0), 'the four houses whose 가주 used to look like another class (비병 = 랜서, 해병 = 파이크맨, 법사 = 시스터, 사교 = 템플러) now look like their own class');
  A(lk.tiers.length >= 8 && lk.tiers.every(t => t.d34 && t.d45 && t.d78 && t.rise), 'promotion changes the outfit for every house (3→4, 4→5, 7→8 differ; 8단 = 윗길)');
  A(lk.bar.length >= 4 && lk.bar.every(b => b.ok), 'barracks people wear the class they were given, at their own 단: ' + lk.bar.map(b => b.nc + ' ' + b.name.split('#')[0]).join(', '));
  A(lk.houses.every(h => h.tree), 'family tree / person rows draw a 가주 with the same sprite as the house card');
  A(lk.kin.indexOf('m_sword_') === 0, '맹주 가문원 keeps the look of the kind they fight as (' + lk.kin + ')');
  // 승급 창: 앞 · 뒤 모습이 다르다 (테두리 빛만 오르던 「제 모습 그대로」가 아니다)
  await ev((chId) => { var s = DS.G.save; DS.showPromo({ id: chId, from: 3, to: 4, cls: s.chars[chId].cls }, null); }, Q.ch); await L.sleep(700);
  c = await ev((chId) => { var o = document.querySelector('.ov .result.promo'), U = DS.ui, ch = DS.G.save.chars[chId]; return { keep: !!o.querySelector('.evo.keep'), cv: o.querySelectorAll('.evo .gfr canvas').length, txt: o.querySelector('.rn').textContent, diff: U.charSpr(ch, 4, 3) !== U.charSpr(ch, 4, 4), fr: [...o.querySelectorAll('.evo .gfr')].map(e => e.className).join('|') }; }, Q.ch);
  A(!c.keep && c.cv === 2 && c.diff && /모습이 바뀌었다/.test(c.txt), 'promotion window shows two different looks in grade frames (' + c.txt + ')');
  await addQ('승급 창', '.ov .result.promo .evo .gfr[data-gp="' + gpQ + '"]');
  await snap('promo');
  await L.closeAll(page);
  // 맹주 가문원 → 빈 가문의 가주: 소드맨 모습 → 그 가문 병과의 옷 (가문 창 「보내기」 → 가문 고르기 = 2번)
  const vac = await L.edit(page, function () {      // L.edit: 넘긴 값은 a
    var ch = DS.charList(s).filter(function (c) { return c.cls === 'mon'; })[0], b = DS.bearer(s, ch);
    DS.barracks(s).filter(function (m) { return m.nc === 'mon'; }).forEach(function (m) { DS.loseMerc(s, m.id); });
    DS.loseMerc(s, b.id); DS.mercTidy(s); DS.pSync(s);
    var kin = s.mercs.filter(function (m) { return m.id === a; })[0];
    return { ch: ch.id, vacant: DS.vacant(s, ch), before: DS.personLook(kin, s)[0] };
  }, ids.kin);
  A(vac.vacant && vac.before.indexOf('m_sword_') === 0, 'set-up: the 신관 house is vacant; the 가문원 looks like a 소드맨 (' + vac.before + ')');
  await ev(() => { DS.openMenu('party'); document.querySelector('.ov .hk.lord[data-ch]').click(); }); await L.sleep(500);
  taps = 0;
  await tap('.ov .cs2 [data-kinsend="' + ids.kin + '"]');
  await tap('.ov.modal [data-bto="' + vac.ch + '"]');
  c = await ev((x) => { var s = DS.G.save, kin = s.mercs.filter(function (m) { return m.id === x.kin; })[0], ch = s.chars[x.ch], nm = DS.personLook(kin, s)[0]; return { bearer: DS.bearer(s, ch) === kin, name: nm, card: DS.ui.charSpr(ch, 2).indexOf(nm) >= 0 }; }, { kin: ids.kin, ch: vac.ch });
  A(c.bearer && c.name.indexOf('mon_') === 0 && c.card && taps === 2, 'class change → look change: the 가문원 sent to the 신관 house now wears 신관 clothes (' + vac.before + ' → ' + c.name + '), 2 taps');
  for (let i = 0; i < 4; i++) { await L.sleep(350); await ev(() => { var q = document.querySelector('.ov.modal [data-close]'); if (q) q.click(); }); }      // 처음 이름 정하기 창이 뜨면 닫는다
  await L.closeAll(page);
  // 제 몸을 지닌 종족(그리폰)이 가주가 되면 제 모습 그대로 — 단은 테두리 빛
  c = await L.edit(page, function () {
    var ch = DS.charList(s).filter(function (c) { return c.cls === 'fly'; })[0], g = DS.addMerc(s, 'm_griffin', 3, 0); g.sb = 1; g.nc = 'fly'; g.L = 45; DS.mercTidy(s);
    var r = DS.hand(s, ch.id, g.id, { where: 'town' }); DS.pSync(s);
    var nm = DS.charLook(ch, s)[0], big = DS.personLook({ type: 'm2_ogre', g: 3, id: 99999 }, s);
    return { ok: r.ok, name: nm, big: big[0] + '/' + big[2] };
  });
  A(c.ok && c.name.indexOf('m_griffin_') === 0 && /r=s/.test(c.name) && /^b_brute\/0\.75$/.test(c.big), 'a griffin seated as 가주 keeps its own body with the 단 rim (' + c.name + '); big mercs keep their big sprite (' + c.big + ')');
  // 맹주를 이은 뒤: 새 맹주의 모습 = 맹주 가문 병과의 제 단 (복사본에서)
  c = await ev(() => {
    var s = DS.fixSave(JSON.parse(JSON.stringify(DS.G.save))), h = s.chars[s.hero], oldId = s.hero;
    h.down = true; DS.linSettle(s, '시험');
    var ch0 = DS.linChoices(s, oldId)[0]; if (!ch0) return { no: 1 };
    DS.linSucceed(s, oldId, ch0, {}); DS.mercTidy(s); DS.pSync(s);
    var nh = s.chars[s.hero], ps = nh.ps || {}, nm = DS.charSprite(nh, s);
    return { name: nm, want: DS.lookName(nh.cls, DS.tierOfL(DS.pL(ps))), v: ps.v || 0, moved: s.hero !== oldId || nh.ps !== h.ps };
  });
  A(!c.no && c.name.split('#')[0] === c.want && (c.v ? c.name.indexOf('v=' + c.v) > 0 : true), 'after succession the new 맹주 wears the 맹주 house class at the successor’s own 단 (' + c.name + ')');

  // ───────── 싸움: 싸움터의 그림 = 초상 · 결과 창 · P 가 쓰러진다 ─────────
  await ev(() => { DS.ui.closeAll(); DS.G.quiet = true; DS.G.pause = true; DS.startScenario(DS.scn(3)); }); await L.sleep(900); await L.skipStory(page, 5);
  c = await ev(() => { var s = DS.G.save, sim = DS.G.sim, out = []; sim.units.forEach(function (u) { if (u.side !== 'ally' || u.role !== 'cmd') return; var ch = s.chars[u.ch], want = ch.id === s.hero ? DS.charSprite(ch, s) : DS.charLook(ch, s)[0]; out.push({ ch: u.ch, got: DS.unitSpriteName(u), want: want }); }); return out; });
  A(c.length === 3 && c.every(u => u.got === u.want), 'battle sprites of the three commanders are the same look as their portraits (' + c.map(u => u.got.split('#')[0]).join(', ') + ')');
  await snap('battle');
  await ev(() => { DS.G.pause = false; DS.G.sim.win(); });
  for (let i = 0; i < 50 && !(await ev(() => !!document.querySelector('.ov.res26'))); i++) { await L.sleep(200); await L.skipStory(page, 1); }
  await ev(() => { if (DS.xbSkip) DS.xbSkip(); }); await L.sleep(700);
  await addP('결과 창 가문원 칸', '.ov.res26 .xb .xk .gfr[data-gp="' + gpP + '"]');
  const qNow = await ev(() => { var s = DS.G.save, ch = s.chars[s.party[1]], b = DS.bearer(s, ch); return { m: b.id, g: b.g }; });
  c = await fr('.ov.res26 .xb .hkf[data-gp="m' + qNow.m + '"]');
  A(c && c.gfr && c.g === qNow.g, 'result board: 가주 card portrait in the grade frame (g' + (c && c.g) + ')');
  c = await fr('.ov.res26 .xb .hk.lord .hkf[data-gp="' + gpH + '"]');
  A(c && c.gfr && c.lord, 'result board: 맹주 card with the 맹주 frame');
  await ev(() => { var x = document.querySelector('.ov.res26 .xb'); if (x) x.scrollIntoView(); }); await L.sleep(300);
  await snap('result');
  await L.settle(page, 30000);
  for (let i = 0; i < 8 && (await ev(() => !!document.querySelector('.cine'))); i++) { await ev(() => DS.cineSkip()); await L.sleep(300); }
  await L.closeAll(page);
  // P 가 싸움에서 쓰러진다 → 추도 연출 「이별」 → 슬픔 창 → 추모 목록 → 가계도 → 이름 부르기
  const alive = seenP.slice();
  await ev(() => { DS.ui.closeAll(); DS.G.quiet = true; DS.G.pause = false; DS.startScenario(DS.scn(3)); }); await L.sleep(900); await L.skipStory(page, 5);
  c = await ev((P) => { var sim = DS.G.sim, u = sim.units.filter(function (x) { return x.side === 'ally' && x.mid === P; })[0]; if (!u) return { no: 1 }; sim.kill(u); return { ok: 1 }; }, P);
  A(!c.no, 'P fights beside the 맹주 as a 가문원 and falls');
  await L.sleep(2500);
  await ev(() => { var q = document.querySelector('.ov.modal [data-close]'); if (q) q.click(); DS.G.sim.win(); });
  for (let i = 0; i < 50 && !(await ev(() => !!document.querySelector('.ov.res26'))); i++) { await L.sleep(200); await L.skipStory(page, 1); }
  await ev(() => { if (DS.xbSkip) DS.xbSkip(); }); await L.sleep(500);
  let sawCine = false, sawMourn = false;
  for (let i = 0; i < 60; i++) {
    const st = await ev(() => ({ cine: (DS.cineInfo() || {}).k || '', story: !!document.querySelector('.ov.story'), ov: !!document.querySelector('.ov:not(.ghost)'), scn: !!DS.G.scn, mourn: !!document.querySelector('.ov .lgod .lgdead .gfr, .ov .lgdead .gfr') }));
    if (st.cine === 'death' && !sawCine) { await L.sleep(800); const f = await addP('사건 연출 「이별」', '.cine.ck-death .cfa[data-gp="' + gpP + '"]'); A(f.dead, 'death cinematic: portrait greyed (.dead), frame keeps the grade colour (' + f.col + ')'); sawCine = true; await snap('cine_death'); await ev(() => DS.cineSkip()); await L.sleep(500); continue; }
    if (st.cine) { await ev(() => DS.cineSkip()); await L.sleep(400); continue; }
    if (st.story) { await L.skipStory(page, 3); continue; }
    if (st.mourn && !sawMourn) { const f = await addP('추도 창', '.ov .lgdead .gfr[data-gp="' + gpP + '"]'); A(f.dead, 'mourning sheet: same frame, greyed portrait'); sawMourn = true; await snap('mourn'); }
    if (st.ov) { const b = await page.$('.ov:not(.ghost) [data-close], .ov:not(.ghost) .btn.gold'); if (b) await b.click().catch(() => {}); else await ev(() => DS.ui.closeAll()); await L.sleep(500); continue; }
    if (!st.scn) break;
    await L.sleep(300);
  }
  A(sawCine && sawMourn, 'the death played as a cinematic and a mourning sheet');
  await ev(() => { DS.ui.closeAll(); DS.openShop('merc'); }); await L.sleep(500);
  await ev(() => { var o = document.querySelector('.ov'), b = o.querySelector('[data-pfold="mfl"]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }); await L.sleep(400);
  await ev(() => { var r = document.querySelector('.ov .flist .row.fallen'); if (r) r.scrollIntoView(); }); await L.sleep(300);
  let f = await addP('추모 목록', '.ov .flist .row.fallen .gfr[data-gp="' + gpP + '"]');
  A(f.dead, 'memorial list: the fallen keeps the grade frame, portrait greyed');
  await snap('memorial');
  await L.closeAll(page);
  await ev(() => DS.openLineage('tree')); await L.sleep(600);
  f = await addP('가계도 (잠든 이)', '.ov .lgn.dead .gfr[data-gp="' + gpP + '"]');
  A(f.dead, 'family tree: dead node keeps the grade frame');
  await snap('lineage_dead');
  await L.closeAll(page);
  // 이름 부르기 (다음 싸움)
  await ev(() => { DS.G.quiet = true; DS.G.pause = true; DS.startScenario(DS.scn(3)); }); await L.sleep(900); await L.skipStory(page, 5);
  c = await ev((Pn) => { var sim = DS.G.sim, b = document.querySelector('#acts .act[data-it="shade"]'); if (!b || !sim.shd) return { no: 1, shd: !!sim.shd }; b.click(); var el = document.getElementById('shadepick'); return { open: !!el, n: el ? el.querySelectorAll('.spn').length : 0, has: !!(sim.shd.cands || []).filter(function (c) { return c.n === Pn; }).length }; }, ids.Pn);
  await L.sleep(500);
  if (c.open && c.has) { f = await addP('이름 부르기', '#shadepick .spn .gfr[data-gp="' + gpP + '"]'); A(f.dead, '이름 부르기 picker: grade frame on the name row'); await snap('shade_pick'); }
  else console.log('note shade picker not available here: ' + JSON.stringify(c));
  await ev(() => { var el = document.getElementById('shadepick'); if (el) { var x = el.querySelector('[data-x]'); if (x) x.click(); } DS.G.pause = false; DS.G.sim.win(); });
  for (let i = 0; i < 50 && !(await ev(() => !!document.querySelector('.ov.res26'))); i++) { await L.sleep(200); await L.skipStory(page, 1); }
  await L.settle(page, 30000);
  for (let i = 0; i < 8 && (await ev(() => !!document.querySelector('.cine'))); i++) { await ev(() => DS.cineSkip()); await L.sleep(300); }
  await L.closeAll(page);

  // ───────── ④ 견주기: 같은 사람 = 같은 테 ─────────
  const liveCol = alive[0].col, names = seenP.map(x => x.name);
  A(seenP.length >= 12 && seenP.every(x => x.g === PG), 'P carries the same grade frame class (g' + PG + ') on ' + seenP.length + ' surfaces: ' + names.join(' · '));
  A(seenP.every(x => x.col === liveCol), 'and the same border colour everywhere — alive or dead (' + liveCol + ')');
  A(seenP.filter(x => x.dead).length >= 4 && alive.every(x => !x.dead), 'dead surfaces only grey the portrait (.dead on ' + seenP.filter(x => x.dead).map(x => x.name).join(' · ') + ')');
  A(seenQ.length >= 7 && seenQ.every(x => x.g === Q.g) && seenQ.every(x => x.col === seenQ[1].col), '가주 Q: same frame (g' + Q.g + ', ' + seenQ[1].col + ') on ' + seenQ.length + ' surfaces: ' + seenQ.map(x => x.name).join(' · '));
  c = await ev(() => { var cs = getComputedStyle(document.documentElement), out = []; for (var g = 1; g <= 5; g++) out.push(cs.getPropertyValue('--g' + g).trim().toLowerCase() === DS.GRADES[g].col.toLowerCase()); return { ok: out.every(Boolean), names: DS.GRADES.slice(1).map(function (G0) { return G0.name + ' ' + G0.col; }).join(', '), uniq: new Set(DS.GRADES.slice(1).map(function (G0) { return G0.col; })).size }; });
  A(c.ok && c.uniq === 5, 'one source of truth: CSS --g1…--g5 come from DS.GRADES (' + c.names + ')');
  // 눈금(색맹 배려): 테 안의 눈금 너비가 등급마다 다르다
  c = await ev(() => { var h = document.createElement('div'); h.innerHTML = [1, 2, 3, 4, 5].map(function (g) { return DS.gfr(g, '', { cls: 'm' }); }).join(''); document.getElementById('app').appendChild(h); var w = [...h.querySelectorAll('.gfr')].map(function (e) { return parseFloat(getComputedStyle(e, '::after').width); }); h.remove(); return w; });
  A(c.length === 5 && c.every((w, i) => i === 0 || w > c[i - 1]), 'grade is not colour-only: the pip strip grows with the grade (' + c.join(', ') + 'px)');

  // ───────── ⑥ 가로 화면 (844×390) ─────────
  await page.setViewportSize({ width: 844, height: 390 }); await L.sleep(500);
  const land = [];
  for (const k of ['party', 'people']) { await ev((k) => { DS.ui.closeAll(); DS.openMenu(k); }, k); await L.sleep(500); land.push(await ev(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, ok: [...document.querySelectorAll('.ov .hk, .ov .row.ppl, .ov .sobar')].every(e => { var r = e.getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth + 1 && r.left >= -1; }) }))); await snap('land_' + k); }
  await ev(() => { DS.ui.closeAll(); DS.openGate(DS.scn(14), null); }); await L.sleep(500);
  land.push(await ev(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, ok: [...document.querySelectorAll('.ov .sof')].every(e => { var r = e.getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth + 1 && r.left >= -1; }) && !!document.querySelector('#goScn') })));
  await snap('land_gate');
  await ev(() => { DS.ui.closeAll(); DS.openWed(); }); await L.sleep(500);
  land.push(await ev(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, ok: !!document.querySelector('.ov .wedv, .ov .wedbox') })));
  await snap('land_wed');
  A(land.every(x => x.sw <= x.vw && x.ok), 'landscape 844×390: party · people · gate · 혼인 render inside the screen with no horizontal scroll (' + land.map(x => x.sw).join(', ') + ')');
  await page.setViewportSize({ width: env && env.W || 390, height: env && env.H || 844 }); await L.sleep(400);
  await L.closeAll(page);
  A((await docW()) <= 390 && (await L.badText(page, 'body')).length === 0, 'back in portrait: no horizontal scroll, no NaN/undefined on screen');
};
