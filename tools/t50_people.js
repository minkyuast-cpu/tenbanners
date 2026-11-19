// 2.2.0 「한 사람 한 사람」 브라우저 시험 (390×844). H=844 OUT=qa_out/t50 node tools/shot.js tools/t50_people.js   (웹 판: PAGE=/home/user/dist/web/index.html)
//   2.2.3: 칩 차례(맹주가 바뀌면 새 맹주가 맨 앞 · 자리를 이은 가문은 제자리) · 끝없는 갱도(1 · 50 · 500층 세기 · 옛 저장 옮김 · 층 고르기 창 · 결과 창 다음 층/같은 층/나가기 · 지면 다시 도전 · 다시 켜도 최고 층) · V223=폴더 면 화면을 그 폴더에
//   모두 싸운다 · 미성년은 싸우지 않는다 · 가주가 쓰러지면 막사의 같은 병과가 잇는다 / 없으면 빈 가문(레벨·단도 잃는다) · 영웅 모집(빈 가문 → 가주, 찬 가문 → 막사, 막사 가득 → 막힘)
//   · 막사 경험치(같은 병과 가주 몫의 10%) · 소수 정예 없음 · 새벽의 모집권
//   · 아이 보내기 · 맹주가 이을 사람 없이 쓰러지고 모든 가문이 비었을 때 · 합일(제자리) · v12 저장 판 올림 · 연무장·무술대회 · 스무 해 창(빈 가문) · NaN/undefined 없음
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a);
  await L.newGame(page, { cls: 'inf', name: '시험' });
  await ev(() => { var a = 20261119; Math.random = function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; DS.G.save.opt.cine = 'off'; });      // 2.2.4: 난수를 씨앗에 묶는다 (영웅관 병과 · 등급이 판마다 달라 뒤의 검사가 흔들리지 않게) · 사건 연출은 그것을 보는 검사에서만 켠다: 시나리오 1~9 를 깬 것으로 (가문 여덟), 레벨을 올리고 골드
  await L.edit(page, function () {
    s.gold = 2000000;
    for (var id = 1; id <= 9; id++) DS.applyClear(s, DS.scn(id));
    DS.houseOpenN(s, 7);      // 2.2.4: 가문은 영웅관에서만 연다 — 예전 1~9번 합류와 같은 일곱 곳
    DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 30; b.exp = 0; } });
    DS.mercTidy(s); DS.pSync(s);
  });
  await ev(() => { DS.enterZone('haemil'); }); await L.sleep(700);
  // ① 모두 싸운다: 유닛 수 = 가주가 선 가문 + 어른 가문원
  let c = await ev(() => { var s = DS.G.save; return { units: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead).length, houses: DS.partyIds(s).length, kin: DS.mercsOf(s, s.hero).length, chips: Object.keys(DS.G.chipEls).length }; });
  A(c.units === c.houses + c.kin && c.houses === 8, 'everyone fights: ' + c.units + ' units = ' + c.houses + ' houses + ' + c.kin + ' kin');
  A(c.chips === c.houses, 'one chip per fighting house (' + c.chips + ')');
  await shot('everyone');
  // ② 아이: 혼인 → 미성년 아이는 싸우지 않는다 → 열다섯이 되면 가문원으로 싸운다
  c = await ev(() => {
    var s = DS.G.save, h = s.chars[s.hero];
    var cand = s.mercs.filter(function (m) { m.sx = m.sx === h.sx ? (h.sx === 'm' ? 'f' : 'm') : m.sx; return m.h; })[0];
    var w = DS.linWed(s, { c: s.hero }, { m: cand.id }, { anywhere: true });
    var hp = s.lin.P[h.pid], sp = s.lin.P[hp.sp];
    var y = DS.ageYoung(s, hp, sp, 'm_sword', 3, Math.random);
    var yp = DS.linMkP(s, { k: 'm', sn: s.lin.sur, n: y.ya.n, sx: y.ya.sx, gen: 2, pa: [hp.id, sp.id], ttl: DS.heroName(s, 2), type: 'm_sword', g: 3, m: 0, gv: 1, hb: 1 });
    yp.st = 'young'; yp.ya = y.ya; yp.by = y.by; yp.ls = 70; yp.pot = 3;
    var n0 = DS.partySpecs(s).length;
    return { wed: !!w, young: yp.id, n0: n0, kin0: DS.mercsOf(s, s.hero).length };
  });
  A(c.wed, 'hero married');
  A(c.kin0 === 0 && c.n0 === 8, 'minor does not fight (specs ' + c.n0 + ')');
  c = await ev((pid) => { var s = DS.G.save; DS.ageAdvance(s, 16 * DS.AGE.year); var e = DS.ageCheck(s, '시험'); DS.mercTidy(s); DS.rebuildParty(); return { adult: e.filter(x => x.t === 'adult').length, kin: DS.mercsOf(s, s.hero).length, specs: DS.partySpecs(s).length, units: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead).length, st: s.lin.P[pid].st }; }, c.young);
  A(c.adult >= 1 && c.kin === 1 && c.st === 'live', 'kid came of age as kin');
  A(c.units === 9, 'adult kin fights (' + c.units + ' units)');
  // ③ 영웅 모집: 빈 가문으로 → 가주 / 가주가 선 가문 → 막사 · 빈 가문은 레벨·단을 잃는다 · 새 가주는 제 레벨 그대로
  c = await ev(() => {
    var s = DS.G.save, chs = DS.charList(s).filter(function (ch) { return ch.id !== s.hero; }), out = {};
    var v = chs[0], b = DS.bearer(s, v); out.L0 = v.L; DS.loseMerc(s, b.id); DS.linMercDied(s, b, '시험');      // 가주 하나를 비운다 (막사 비어 있음)
    DS.pSync(s);
    out.vac = DS.vacant(s, v) && DS.bnEmpty(s).indexOf(v.id) >= 0; out.vL = v.L; out.vT = DS.tierOfL(v.L); out.vPow = DS.cardPower(s, v);
    DS.mercTidy(s); out.fight = DS.partyIds(s).indexOf(v.id) >= 0;
    var r = DS.recruitHero(s, Math.random, { ch: v }); out.r1 = r && r.role; out.r1h = r && r.ch.id === v.id; out.bear = DS.bearer(s, v) === r.m;
    DS.pSync(s); out.mL = r.m.L; out.seatL = v.L;
    var r2 = DS.recruitHero(s, Math.random, { ch: v }); out.r2 = r2 && r2.role; out.r2bar = !!(r2 && DS.isSb(r2.m) && !r2.m.o && DS.barracks(s).indexOf(r2.m) >= 0);
    return out;
  });
  A(c.vac && !c.fight, 'house without 가주 (barracks empty) is vacant and does not fight');
  A(c.L0 === 30 && c.vL === 1 && c.vT === 1 && c.vPow === 0, 'vacant house lost its level and 단 (L ' + c.L0 + ' → ' + c.vL + ')');
  A(c.r1 === 'bear' && c.r1h && c.bear, 'recruit into vacant house becomes 가주');
  A(c.seatL === c.mL && c.mL !== 30, 'new 가주 brings exactly their own level (house L ' + c.seatL + ' = person L ' + c.mL + ')');
  A(c.r2 === 'sb' && c.r2bar, 'recruit for a seated house goes to the 막사 (no house link)');
  // ③-2 막사: 경험치는 같은 병과 가주 몫의 10% (나누지 않는다) · 그 병과 가주가 없으면 0 · 빈 가문은 같은 병과만 잇는다 · 손으로 바꾸기도 같은 병과만
  c = await ev(() => {
    var s = DS.G.save, out = {};
    var chs = DS.charList(s).filter(function (ch) { return ch.id !== s.hero && ch.cls !== 'arc' && ch.cls !== 'cle' && DS.bearer(s, ch); });
    var X = chs[0], Y = chs[1], Z = chs[2];
    DS.barracks(s).forEach(function (m) { DS.loseMerc(s, m.id); });
    var mk = function (cls, L) { var m = DS.addMerc(s, DS.heroType(cls), 3, 0); m.o = 0; m.sb = 1; m.nc = cls; m.L = L; m.exp = 0; return m; };
    var a1 = mk(X.cls, 10), a2 = mk(X.cls, 12), bz = mk(Z.cls, 11);
    var zb = DS.bearer(s, Z); DS.loseMerc(s, zb.id);      // Z 가문이 빈다 (막사의 bz 는 아직 자리에 서지 않았다 — 싸움 중처럼 DS.sbTick 을 부르지 않는다)
    DS.mercTidy(s);
    var xb = DS.bearer(s, X), xe = xb.exp, xL = xb.L;
    DS.gainExp(s, 50, 30);
    var xg = xb.L === xL ? xb.exp - xe : null;
    out.share = DS.BAL.sbShare; out.xg = xg; out.a1 = a1.exp; out.a2 = a2.exp; out.bz = bz.exp;
    // Y 가문도 비운다 — 막사에 Y 병과가 없으니 빈 채로 남는다. Z 는 막사의 bz 가 잇는다
    var yb = DS.bearer(s, Y); DS.loseMerc(s, yb.id); DS.mercTidy(s);
    var t = DS.sbTick(s); DS.pSync(s);
    out.text = t.map(function (x) { return x.text; }).join(' / ');
    out.zSeat = DS.bearer(s, Z) === bz; out.zL = Z.L; out.bzL = bz.L;
    out.yVac = DS.vacant(s, Y) && DS.bnEmpty(s).indexOf(Y.id) >= 0 && DS.barracks(s).length === 2; out.yL = Y.L;
    var h1 = DS.hand(s, Y.id, a1.id, { where: 'town' }); out.handNo = !h1.ok ? h1.why : '';
    var xb0 = DS.bearer(s, X), h2 = DS.hand(s, X.id, a2.id, { where: 'town' }); out.handOk = h2.ok && DS.bearer(s, X) === a2 && DS.isSb(xb0) && !xb0.o;
    DS.pSync(s); out.xL2 = X.L; out.a2L = a2.L; out.X = X.id; out.xnc = !!(xb0.nc || xb0.cast) && DS.sbFits(X, xb0) && DS.sbHome(s, xb0) === X;
    var r = DS.recruitHero(s, Math.random, { ch: Y }); out.yRe = r && r.role === 'bear';
    out.solo = typeof DS.soloK === 'undefined' && DS.BN.solo === undefined;
    DS.mercTidy(s); DS.rebuildParty();
    return out;
  });
  A(c.share === 0.1 && c.xg > 0 && Math.abs(c.a1 - c.xg * 0.1) < 1e-6 && Math.abs(c.a2 - c.xg * 0.1) < 1e-6, '막사: each same-class person gets 10% of the 가주 exp, not split (가주 +' + Math.round(c.xg) + ', each +' + Math.round(c.a1) + ')');
  A(c.bz === 0, '막사: person whose class has no 가주 gains nothing');
  A(c.zSeat && c.zL === c.bzL && /막사에서 나와/.test(c.text), 'vacant house filled by same-class 막사 person at own level (' + c.text + ')');
  A(c.yVac && c.yL === 1, 'no same-class person in 막사 → house stays vacant (L 1) though the 막사 is not empty');
  A(!!c.handNo && c.handOk && c.xL2 === c.a2L, 'manual swap: other class refused (' + c.handNo + '), same class swaps, old 가주 goes to 막사');
  A(c.yRe && c.solo, 'refilled; no few-houses bonus');
  A(c.xnc, 'swapped-out 가주 waits in the 막사 with that house class (nc or cast) and fits only it');
  // 가주 교체 창 (390px): 전투력 차이 글과 「비교」 단추가 겹치지 않는다
  await ev((id) => { DS.ui.closeAll(); DS.bnPickOpen(id); }, c.X); await L.sleep(500);
  const ovl = await ev(() => { var bad = 0, n = 0; document.querySelectorAll('.ov .row.pk p.pwl').forEach(function (p) { var d = p.querySelector('.pwd'), b = p.querySelector('.cmpb'); if (!d || !b) return; n++; var dr = d.getBoundingClientRect(), br = b.getBoundingClientRect(), last = d.lastElementChild ? d.lastElementChild.getBoundingClientRect() : dr; if (Math.max(dr.right, last.right) > br.left || d.scrollWidth > d.clientWidth + 1) bad++; }); return { n: n, bad: bad, sw: document.documentElement.scrollWidth }; });
  await shot('swap_pick');
  A(ovl.n > 0 && !ovl.bad && ovl.sw <= 390, 'swap-pick rows: power delta does not overlap the compare button (' + ovl.n + ' rows)');
  // 가문 창: 장비는 머리에 (스크롤 없이 보인다) → 칸을 누르면 고르기 창 → 줄 한 번에 입는다 · 고른 가문 초상을 한 번 더 누르면 같은 창
  await ev((id) => { DS.ui.closeAll(); var s = DS.G.save; s.gear['sword.B'] = (s.gear['sword.B'] || 0) + 1; DS.charSheetOpen(id); }, c.X); await L.sleep(500);
  const gs = await ev(() => { var t = Array.from(document.querySelectorAll('.ov .gsl2 .gt2')); return { n: t.length, vis: t.every(function (b) { var r = b.getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; }), old: !!document.querySelector('.ov .cgear') }; });
  await shot('house_gear');
  await page.click('.ov .gt2[data-gslot="w"]'); await L.sleep(400);
  const gp = await ev(() => { var r = document.querySelector('.ov .gpk-r[data-on]'); return { rows: document.querySelectorAll('.ov .gpk-r').length, id: r && r.dataset.on, best: !!document.querySelector('.ov [data-gbest]') }; });
  if (gp.id) { await page.click('.ov .gpk-r[data-on="' + gp.id + '"]'); await L.sleep(400); }
  const gw = await ev((a) => { var s = DS.G.save; return { w: s.chars[a.X].w, sheet: !!document.querySelector('.ov .gsl2'), picker: !!document.querySelector('.ov .gpk-r') }; }, { X: c.X });
  A(gs.n >= 2 && gs.vis && !gs.old && gp.rows > 0 && gp.best && gw.w === gp.id && gw.sheet && !gw.picker, 'house sheet: gear slots in the header (visible at 390×844), picker equips in one tap (' + gp.id + ')');
  await ev(() => DS.ui.closeAll());
  await page.click('#chips .chip[data-u="c' + c.X + '"]').catch(() => {}); await L.sleep(300);
  if (!(await ev(() => !!document.querySelector('.ov .gsl2')))) { await page.click('#chips .chip[data-u="c' + c.X + '"]').catch(() => {}); await L.sleep(400); }
  A(await ev(() => !!document.querySelector('.ov .gsl2')), 'tapping the selected top chip again opens the same house sheet');
  await ev(() => DS.ui.closeAll());
  // 마을에서 가주가 떠났다 (천수 같은 싸움 밖의 죽음) → 다음 부대 정리(rebuildParty)에서 곧바로 막사의 같은 병과가 잇는다
  c = await ev(() => {
    DS.ui.closeAll(); var s = DS.G.save, H = DS.charList(s).filter(function (ch) { return ch.id !== s.hero && DS.bearer(s, ch, 1) && !DS.CLASSES[ch.cls].master; })[1];
    var m = DS.addMerc(s, DS.heroType(H.cls), 3, 0); m.sb = 1; m.nc = DS.houseCls(H); m.L = 33; DS.mercTidy(s);
    var b0 = DS.bearer(s, H, 1); DS.loseMerc(s, b0.id); DS.linMercDied(s, b0, '시험', '천수를 누림');
    DS.rebuildParty();
    return { seat: DS.bearer(s, H, 1) === m, L: H.L, chip: !!DS.G.chipEls['c' + H.id] };
  });
  A(c.seat && c.L === 33 && c.chip, 'out-of-combat 가주 death in town → same-class 막사 person seated at once (L ' + c.L + ')');
  // ④ 영웅관 창 (한 번 모집) · NaN 없음
  await ev(() => { DS.ui.closeAll(); DS.rebuildParty(); DS.openShop('merc'); }); await L.sleep(500);
  await shot('hall');
  A((await L.badText(page, '.ov')).length === 0, 'recruit window has no NaN/undefined');
  await page.click('[data-pull]'); await L.sleep(2500); await shot('hall_result');
  A((await L.badText(page, '.ov')).length === 0, 'recruit result has no NaN/undefined');
  await L.closeAll(page);
  // ⑤ 막사가 가득(정원 DS.MERC_MAX)하고 빈 가문이 없으면 막힌다 — 2.2.4: 닫힌 가문이 남아 있으면 막히지 않는다 (그 병과만 온다 · 가문이 열린다)
  c = await ev(() => { var s = DS.G.save, add = []; while (DS.barracks(s).length < DS.MERC_MAX) { var m = DS.addMerc(s, 'm_sword', 1, 0); m.o = 0; m.sb = 1; add.push(m.id); } var vac = DS.charList(s).filter(function (ch) { return DS.vacant(s, ch); }).length;
    var shut = DS.closedCls(s).length, why0 = DS.recruitWhy(s);
    var c1 = DS.fixSave(JSON.parse(JSON.stringify(s))), r1 = vac ? null : DS.recruitHero(c1, Math.random), n1 = DS.barracks(c1).length;      // 사본: 닫힌 가문이 있으면 열린다 (막사는 그대로)
    var c2 = DS.fixSave(JSON.parse(JSON.stringify(s))); DS.houseOpenN(c2, 10); var why = DS.recruitWhy(c2), r2 = vac ? null : DS.recruitHero(c2, Math.random);      // 사본: 모두 열면 막힌다
    DS.ui.closeAll(); DS.openShop('merc'); var btn = document.querySelector('.ov [data-pull]');
    return { why: why, why0: why0, shut: shut, r1: r1 && r1.role, n1: n1, r2: r2, vac: vac, dis: !!(btn && btn.disabled), add: add, cap: DS.MERC_MAX }; });
  await shot('hall_full');
  A(c.vac > 0 || (c.shut > 0 && !c.why0 && !c.dis && c.r1 === 'open' && c.n1 === c.cap), '막사 full but ' + c.shut + ' closed houses → pull still allowed and opens a house (' + c.r1 + ')');
  A(c.vac > 0 || (!!c.why && !c.r2), '막사 full and every house open → recruit blocked (' + c.why + ')');
  await ev((ids) => { var s = DS.G.save; ids.forEach(function (id) { DS.loseMerc(s, id); }); DS.mercTidy(s); }, c.add); await L.closeAll(page);
  // ⑤-2 2.2.4 가문은 영웅관에서만: 시나리오를 깨도 가문이 오지 않는다(모집권) · 닫힌 가문의 병과가 나오면 그 영웅이 가주로 가문이 열린다 · 닫힌 가문 쏠림 · 천장 · 옛 저장
  c = await ev(() => {
    var s = DS.G.save, o = {}, cp = function () { return DS.fixSave(JSON.parse(JSON.stringify(s))); };
    var n0 = DS.newSave('새', 'arc'); o.start = DS.charList(n0).length; o.t0 = n0.tickets;
    [2, 3, 4, 5, 6, 7, 9, 10, 11, 13].forEach(function (id) { DS.applyClear(n0, DS.scn(id)); }); o.after = DS.charList(n0).length; o.tk = n0.tickets; o.joins = 0;
    o.tk2 = DS.applyClear(n0, DS.scn(2)).tickets;      // 다시 깨면 없다
    o.t12 = DS.applyClear(n0, DS.scn(12)).tickets;     // 가문이 오지 않던 판은 한 장도 없다 (열 번째가 아니면)
    var a = cp(), shut0 = DS.closedCls(a).slice(), r = DS.recruitHero(a, Math.random, { cls: shut0[0] }), ch = r && r.ch;
    o.role = r && r.role; o.open = !!ch && ch.cls === shut0[0] && DS.bearer(a, ch) === r.m && DS.closedCls(a).length === shut0.length - 1; o.L = r && r.m.L; o.rL = DS.recruitL(s, r ? r.g : 3); o.party = !!ch && DS.partyIds(a).indexOf(ch.id) >= 0 && DS.partySpecs(a).some(function (u) { return u.ch === ch.id; });
    o.hp0 = a.hpity;
    var b = cp(); b.hpity = DS.HOUSE_OPEN.pity; o.odds1 = DS.openOdds(b); var rb = DS.recruitHero(b, function () { return 0.001; }); o.sure = rb && rb.role === 'open';      // 천장: 반드시 연다 (난수가 선 가문 쪽이어도)
    var cnt = 0, N = 400, rs = 7; var rnd = function () { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
    for (var i = 0; i < N; i++) { var c = cp(); c.hpity = 0; var rr = DS.recruitHero(c, rnd); if (rr && rr.role === 'open') cnt++; }
    var cc = cp(); cc.hpity = 0; o.exp = DS.openOdds(cc); o.got = cnt / N;
    var d = cp(); d.hpity = 0; var miss = 0, seq = []; for (var k = 0; k < 12; k++) { var x = DS.recruitHero(d, function () { return 0.001; }); seq.push(x.role); }
    o.seq = seq.slice(0, DS.HOUSE_OPEN.pity + 1).join(',');      // 늘 선 가문 쪽 난수여도 pity 번 뒤에는 연다
    var e = cp(); DS.houseOpenN(e, 10); var re = DS.recruitHero(e, Math.random); o.allOpen = DS.closedCls(e).length === 0 && re && re.role !== 'open'; o.oddsAll = DS.openOdds(e);
    return o;
  });
  A(c.start === 1 && c.t0 === 1 && c.after === 1 && c.tk === 1 + 10 && c.tk2 === 0 && c.t12 === 0, 'scenario clears never add a house: houses ' + c.start + ' → ' + c.after + ', tickets ' + c.t0 + ' → ' + c.tk + ' (join scenarios and 10th give a ticket, replays none)');
  A(c.role === 'open' && c.open && c.party && c.hp0 === 0, 'pull of a closed class opens that house with this hero as 가주, who fights at once');
  A(Math.abs(c.L - c.rL) <= 2, 'new house 가주 comes at the usual recruit level (L ' + c.L + ' ≈ ' + c.rL + ')');
  A(c.odds1 === 1 && c.sure, 'pity: after ' + c.seq + ' the next pull always opens a house');
  A(/^(sb|bear),(sb|bear),open$/.test(c.seq), 'pity sequence with worst-case luck: ' + c.seq);
  A(Math.abs(c.got - c.exp) < 0.08, 'closed-house bias: opened ' + Math.round(c.got * 100) + '% of 400 pulls, expected ' + Math.round(c.exp * 100) + '%');
  A(c.allOpen && c.oddsAll === 0, 'with every house open pulls behave as before (no open odds)');
  // 영웅관 화면: 닫힌 가문 칸 · 열 확률 → 반드시 여는 모집 → 가문이 열리는 연출 → 부대 탭에 그 가문
  await ev(() => { var s = DS.G.save; s.tickets = 3; s.hpity = DS.HOUSE_OPEN.pity; s.opt.cine = 'full'; DS.ui.closeAll(); DS.openShop('merc'); }); await L.sleep(500);
  c = await ev(() => { var o = document.querySelector('.ov'), s = DS.G.save; return { chips: o.querySelectorAll('.hshut .hrm.shut').length, shut: DS.closedCls(s).length, sure: /반드시/.test((o.querySelector('.hshut') || {}).textContent || ''), n0: DS.charList(s).length }; });
  A(c.chips === c.shut && c.shut >= 1 && c.sure, 'hall lists ' + c.chips + ' closed houses and the pity line');
  if (process.env.V224) { fs.mkdirSync(process.env.V224, { recursive: true }); await page.screenshot({ path: path.join(process.env.V224, 'hall_closed.png') }); }
  await shot('hall_closed');
  await page.click('[data-pull]'); await L.sleep(400);
  await ev(() => { var fa = document.querySelector('.pullov [data-flipall]'); if (fa) fa.click(); }); await L.sleep(900);
  await ev(() => { var b = document.querySelector('.pullov [data-close]'); if (b) b.click(); }); await L.sleep(700);
  c = await ev(() => { var el = document.querySelector('.cine.ck-open'); return { on: !!el, title: el ? el.querySelector('.crib').textContent : '', flag: !!(el && el.querySelector('.cflag svg')), face: !!(el && el.querySelector('.cfa canvas, .cfa img, .cfa .spr')), n: DS.charList(DS.G.save).length }; });
  A(c.on && /열렸다/.test(c.title) && c.flag && c.face, 'house-opening pull plays the banner cinematic: ' + c.title);
  if (process.env.V224) await page.screenshot({ path: path.join(process.env.V224, 'pull_opens_house.png') });
  await shot('pull_open');
  await page.mouse.click(195, 420); await L.sleep(400);
  A(await ev(() => !document.querySelector('.cine')), 'tap dismisses the cinematic');
  await ev(() => { DS.G.save.opt.cine = 'off'; });
  await L.closeAll(page);
  // 옛 저장: 시나리오로 합류한 가문은 그대로 · 남은 가문은 영웅관 · 깨진 hpity 는 0
  c = await ev(() => { var s = DS.G.save, raw = JSON.parse(JSON.stringify(s)); raw.hpity = 'x'; raw.ver = '2.2.3'; var f = DS.fixSave(raw); return { same: DS.charList(f).length === DS.charList(s).length, hp: f.hpity, shut: DS.closedCls(f).length }; });
  A(c.same && c.hp === 0, 'old save keeps every joined house (hpity sanitized to ' + c.hp + ', closed ' + c.shut + ')');
  // ⑥ 싸움에서 가주가 쓰러진다: 막사에 같은 병과가 있으면 싸움 뒤 그이가 잇는다 / 없으면 빈 가문 (레벨·단도 잃는다)
  await ev(() => { var s = DS.G.save; DS.charList(s).forEach(function (ch) { if (ch.cls === 'cle' || ch.cls === 'arc') DS.sbOf(s, ch.id).forEach(function (m) { DS.loseMerc(s, m.id); }); }); var m = DS.addMerc(s, DS.heroType('arc'), 3, 0); m.o = 0; m.sb = 1; m.nc = 'arc'; m.L = 25; DS.mercTidy(s); DS.rebuildParty(); });
  await ev(() => { DS.G.quiet = true; DS.startScenario(DS.scn(9)); }); await L.sleep(800);
  c = await ev(() => {
    var s = DS.G.save, sim = DS.G.sim, out = {};
    var arc = DS.charList(s).filter(ch => ch.cls === 'arc')[0], cle = DS.charList(s).filter(ch => ch.cls === 'cle')[0];
    out.arcB = DS.bearer(s, arc).id; out.arcSb = DS.sbOf(s, arc.id).length; out.cleSb = DS.sbOf(s, cle.id).length;
    out.arc = arc.id; out.cle = cle.id; out.chips0 = Object.keys(DS.G.chipEls);
    sim.kill(sim.byId['c' + arc.id]); sim.kill(sim.byId['c' + cle.id]);
    return out;
  });
  const c0chips = c;
  await L.sleep(1500);
  await ev(() => { DS.G.sim.win(); }); await L.sleep(500);
  await L.settle(page, 30000); await L.sleep(2500);
  c = await ev((o) => { var s = DS.G.save, arc = s.chars[o.arc], cle = s.chars[o.cle], b = DS.bearer(s, arc); return { arcB: b ? b.id : 0, was: o.arcB, arcL: arc.L, bL: b ? b.L : 0, cleVac: DS.vacant(s, cle), cleL: cle.L, cleFight: s.party.indexOf(cle.id) >= 0, units: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead && u.ch === cle.id && u.role === 'cmd').length, fallen: (s.fallen || []).length }; }, c);
  A(c.arcB && c.arcB !== c.was && c.arcL === c.bL && c.bL === 25, '가주 died in battle → same-class 막사 person took the seat at own level (L ' + c.bL + ')');
  {      // 2.2.3: 칩 차례 — 자리를 이은 가문은 제자리, 맹주가 맨 앞
    const k1 = await ev(() => Object.keys(DS.G.chipEls)), k0 = c0chips.chips0;
    const a = k0.filter(k => k1.indexOf(k) >= 0), b = k1.filter(k => k0.indexOf(k) >= 0);
    A(JSON.stringify(a) === JSON.stringify(b) && a.indexOf('c' + c0chips.arc) === b.indexOf('c' + c0chips.arc) && b.indexOf('c' + c0chips.arc) >= 0 && k1[0] === await ev(() => 'c' + DS.G.save.hero), 'chip order: the seat-filled house keeps its slot, 맹주 first (' + k1.join(' ') + ')');
  }
  A(c.cleVac && !c.cleFight && c.units === 0 && c.cleL === 1, '가주 died with no same-class 막사 person → vacant (L 1), not fighting');
  await ev(() => DS.openMenu('party')); await L.sleep(500); await shot('party_vacant');
  A((await L.badText(page, '.ov')).length === 0, '부대 tab has no NaN/undefined');
  // ⑦ 빈 가문에 맹주의 어른 아이를 보낸다 (가문 창)
  c = await ev(() => { var s = DS.G.save, cle = DS.charList(s).filter(ch => ch.cls === 'cle')[0]; DS.ui.closeAll(); if (!DS.G.zone.town) DS.enterZone('haemil'); DS.openMenu('party'); return cle.id; });      // 2.2.2: 들판 무리가 커서 돌아온 들판에서 곧 싸움이 붙으면 단추가 잠긴다 — 마을에서
  await page.click('.hgh[data-ch="' + c + '"]'); await L.sleep(500); await shot('house_vacant');
  A((await L.badText(page, '.ov')).length === 0, 'house sheet (vacant) has no NaN/undefined');
  const kidBtn = await page.$('.ov [data-bn="pick"]');
  A(!!kidBtn, 'vacant house shows 「아이 보내기」');
  const kidL = await ev(() => { var s = DS.G.save, k = DS.mercsOf(s, s.hero)[0]; return k ? k.L : 0; });
  await kidBtn.click(); await L.sleep(500); await shot('kid_pick');
  await page.click('.ov [data-bnto]'); await L.sleep(800);
  c = await ev((id) => { var s = DS.G.save, b = DS.bearer(s, s.chars[id]); DS.pSync(s); return { b: b ? b.n : '', nc: b && b.nc, kin: DS.mercsOf(s, s.hero).length, kid: !!(b && DS.kidOf(s, b)), fight: s.party.indexOf(id) >= 0, bL: b ? b.L : 0, hL: s.chars[id].L }; }, c);
  A(c.b && c.kid && c.nc === 'cle' && c.kin === 0 && c.fight, 'adult kid sent to vacant house as 가주 (takes class ' + c.nc + ')');
  A(c.bL === kidL && c.hL === kidL, 'sent kid keeps exactly their own level, no boost (L ' + kidL + ')');
  await L.closeAll(page);
  await page.evaluate(() => { var o = document.querySelector('.ov'); if (o) DS.ui.closeAll(); });
  // ⑧ 합일: 아무도 제 가문을 떠나지 않는다
  c = await ev(() => {
    var s = DS.G.save; s.crest = true;
    var hs = DS.charList(s).filter(ch => ch.id !== s.hero && DS.bearer(s, ch)).slice(0, 2);
    var who = [DS.heroPs(s)].concat(hs.map(ch => DS.bearer(s, ch)));
    var sbm = DS.sbOf(s, hs[0].id)[0]; if (sbm) who[2] = sbm;
    who.forEach(function (w) { w.L = 70; w.exp = 0; }); DS.pSync(s);
    var before = who.map(function (w) { return { o: w === DS.heroPs(s) ? s.hero : w.o, h: !!w.h, sb: !!w.sb }; });
    var keys = who.map(function (w) { return DS.pKey(s, w); }), r = DS.fuse(s, keys);
    var after = who.map(function (w) { return { o: w === DS.heroPs(s) ? s.hero : w.o, h: !!w.h, sb: !!w.sb, L: DS.pL(w), fz: !!w.fz }; });
    return { ok: !!r, same: JSON.stringify(before) === JSON.stringify(after.map(function (a) { return { o: a.o, h: a.h, sb: a.sb }; })), L: after.map(a => a.L), fz: after.every(a => a.fz), rep: DS.lastFuse && DS.lastFuse.hx };
  });
  A(c.ok && c.same && c.fz && c.L.every(x => x === 71) && c.rep === 1000, '합일: three rise to 8단, nobody leaves their seat, rep house +1000');
  // ⑨ 연무장 · 무술대회
  await ev(() => { DS.ui.closeAll(); DS.rebuildParty(); }); await L.sleep(300);
  c = await ev(() => {
    var s = DS.G.save, ro = DS.arenaRoster(s), out = { n: ro.length, sb: ro.filter(r => /막사/.test(r.place)).length, kin: ro.filter(r => /가문원/.test(r.place)).length };
    var D = DS.tourneyBout(DS.arenaSpec(s, ro[0].key), DS.arenaSpec(s, ro[1].key), { seed: 5 }); out.duel = !!(D && D.done && D.win);
    var T = DS.tourneyNew(ro.slice(0, 8).map(r => r.key)), M, g = 0; while (T && (M = DS.tourneyNext(T)) && g++ < 20) { var d = DS.tourneyBout(DS.arenaSpec(s, M.a), DS.arenaSpec(s, M.b), { seed: g }); DS.tourneyWin(T, M, d.win === 'A' || d.win === d.A.id || d.win === 'arA' ? M.a : M.b); }
    out.champ = !!(T && T.done && T.champ);
    var ov = DS.arenaOpen(); out.open = !!ov; return out;
  });
  await L.sleep(600); await shot('arena');
  A(c.n > 8 && c.duel && c.champ && c.open, 'arena duel + tournament run (roster ' + c.n + ', standby ' + c.sb + ', kin ' + c.kin + ')');
  await ev(() => { DS.arenaClose(); DS.ui.closeAll(); }); await L.sleep(400);
  // ⑨-2 맹주의 뒤 (2.2.0): 저절로(봇·화면 없음)는 어른 핏줄 → 막사의 같은 병과(등급 → 레벨, 제 레벨 그대로) → 대가 끊김
  c = await ev(() => {
    var s = DS.fixSave(JSON.parse(JSON.stringify(DS.G.save))), h = s.chars[s.hero], P = s.lin.P;      // 사본에서 (화면 판은 그대로)
    s.mercs.slice().forEach(function (m) { if (DS.kidOf(s, m) || (DS.isSb(m) && DS.sbFits(h, m))) DS.loseMerc(s, m.id); });      // 2.2.4: 앞서 영웅관에서 뽑힌 같은 병과(병과 · 등급 무작위 — 전설이면 「best」를 앞질렀다)도 막사에서 뺀다
    for (var k in P) if (P[k].st === 'young') P[k].st = 'gone';
    DS.linTidy(s); DS.mercTidy(s);
    function sbP(type, g, L, nc) { var m = DS.addMerc(s, type, g, 0); m.sb = 1; m.L = L; m.exp = 0; m.nc = nc; return m; }
    var lo = sbP('m_sword', 2, 40, h.cls), best = sbP('m_sword', 4, 20, h.cls); sbP('m_sister', 5, 60, 'cle'); DS.mercTidy(s);
    var gen0 = P[h.pid].gen, hid = s.hero;
    h.down = true; DS.linSettle(s, '시험');
    var pick = DS.linSbHeir(s, hid), ended = DS.linEnded(s, hid), ev = DS.linAutoAll(s), h2 = s.chars[s.hero], p2 = s.lin.P[h2.pid];
    return { pick: pick && pick.mid === best.id, ended: ended, same: s.hero === hid, L: h2.ps.L, g: h2.ps.g, gen: p2.gen === gen0 + 1, txt: ev.map(function (e) { return e.ev ? DS.linEvText(s, e.ev) : ''; }).join(' / '), gone: !s.mercs.some(function (m) { return m.id === best.id; }) };
  });
  A(c.pick && !c.ended && c.same && c.gone && c.L === 20 && c.g === 4 && c.gen && /막사에서 나와/.test(c.txt), 'auto order: no adult blood heir → best same-class 막사 person (grade first) becomes 맹주 at own level/grade, generation +1 (' + c.txt + ')' + (c.pick && !c.ended && c.same && c.gone && c.L === 20 && c.g === 4 && c.gen ? '' : ' ' + JSON.stringify(c)));
  // ⑨-3 화면: 맹주가 쓰러지면 고른다 — 자식 · 막사(같은 병과) · 다른 가문. 고르기 전에 저장·다시 불러와도 그 창이 돌아온다
  await ev(() => {
    var s = DS.G.save, h = s.chars[s.hero], P = s.lin.P, hp = P[h.pid];
    s.mercs.slice().forEach(function (m) { if (DS.kidOf(s, m) || (DS.isSb(m) && DS.sbFits(h, m))) DS.loseMerc(s, m.id); });      // 앞서 뽑힌 같은 병과 영웅도 막사에서 뺀다 (모집 병과는 무작위)
    for (var k in P) if (P[k].st === 'young') P[k].st = 'gone';
    DS.linTidy(s); DS.mercTidy(s);
    window.__mkKid = function (L, nm) { var s = DS.G.save, h = s.chars[s.hero], P = s.lin.P, hp = P[h.pid]; var m = DS.addMerc(s, 'm_sword', 3, s.hero); m.kn = 1; m.L = L; m.exp = 0; m.n = nm; var p = DS.linMkP(s, { k: 'm', sn: s.lin.sur, n: nm, sx: 'm', gen: hp.gen + 1, pa: [hp.id].concat(hp.sp ? [hp.sp] : []), type: m.type, g: 3, m: m.id, gv: 1, hb: 1 }); m.pid = p.id; return m; };
    var k1 = __mkKid(25, '큰별'), k2 = __mkKid(15, '작은별');
    function sbP(type, g, L, nc, n) { var m = DS.addMerc(s, type, g, 0); m.sb = 1; m.L = L; m.exp = 0; m.nc = nc; m.n = n; return m; }
    var sa = sbP('m_sword', 4, 20, h.cls, '바위'), sbb = sbP('m_sword', 2, 33, h.cls, '자갈'); sbP('m_sister', 5, 60, 'cle', '구름');
    DS.mercTidy(s); DS.rebuildParty();
    window.__X = { hid: s.hero, k1: k1.id, k2: k2.id, sa: sa.id, sbb: sbb.id };
    h.down = true; var evs = DS.linSettle(s, '시험'); DS.ui.persist();
    DS.openLineageRite(evs, function () { window.__riteDone = 1; });
  });
  await L.sleep(600);
  await page.click('.ov.rite [data-lgstep="pick"]'); await L.sleep(500);
  const RV = '/tmp/claude-0/-home-user-tenbanners/dc85b0d9-560a-55db-8b63-0b47e1ee10f9/scratchpad/review';
  await shot('heir_pick'); try { fs.mkdirSync(RV, { recursive: true }); await page.screenshot({ path: RV + '/heir_pick_390.png' }); } catch (e) {}
  c = await ev(() => {
    var box = document.querySelector('.ov.rite .lgrite'), hd = Array.from(box.querySelectorAll('h5.lghd')).map(function (e) { return e.textContent.replace(/\s*\d+$/, ''); });
    var rows = Array.from(box.querySelectorAll('.lgcb.lgh')), bad = rows.filter(function (r) { var rr = r.getBoundingClientRect(); return Array.from(r.children).some(function (k) { var b = k.getBoundingClientRect(); return b.right > rr.right + 1 || b.left < rr.left - 1; }); }).length;
    return { title: (box.querySelector('h2') || {}).textContent, hd: hd, n1: box.querySelectorAll('.k-o1').length, n2: box.querySelectorAll('.k-o2').length, n3: box.querySelectorAll('.k-o3').length, bad: bad, sw: document.documentElement.scrollWidth, say: (box.querySelector('.k-o3 .lgsay') || {}).textContent || '', bear: (function (s) { var dp = s.lin.P[s.chars[s.hero].vac.pid], sp = dp.sp || dp.lsp; return DS.charList(s).filter(function (ch) { var b = ch.id !== s.hero && DS.bearer(s, ch, 1); return b && !(sp && b.pid === sp); }).length; })(DS.G.save) };      // 고인의 배우자는 뒤를 잇지 않는다
  });
  A(/누가 잇는가/.test(c.title) && c.hd.join(',') === '자식,막사,다른 가문', 'heir choice modal: title and three sections (' + c.hd.join(' / ') + ')');
  A(c.n1 === 2 && c.n2 === 2 && c.n3 === c.bear && c.n3 > 0, 'one row per adult blood heir (2), per same-class 막사 person (2, other class excluded), per other house 가주 (' + [c.n1, c.n2, c.n3, c.bear].join('/') + ')');
  A(!c.bad && c.sw <= 390 && /옛 맹주 가문의 가족은 막사로 간다/.test(c.say), 'choice rows fit 390px; option 3 says the old house family goes to the 막사');
  A((await L.badText(page, '.ov')).length === 0, 'heir choice modal has no NaN/undefined');
  // 고르기 전에 다시 불러온다 → 맹주 자리는 빈 채로, 창이 다시 뜬다 (안전망이 먼저 채우지 않는다)
  await page.reload(); await page.waitForSelector('#btnCont', { timeout: 30000 });
  await page.click('#btnCont'); await L.sleep(2600);
  c = await ev(() => { var s = DS.G.save, h = s.chars[s.hero]; return { vac: !!h.vac, rite: !!document.querySelector('.ov.rite') }; });
  A(c.vac && c.rite, 'pending choice survives a reload: 맹주 seat still empty, the choice comes back');
  await ev(() => { window.__X = window.__X || {}; });
  const X = await ev(() => { var s = DS.G.save, f = function (n, kin) { var m = s.mercs.filter(function (x) { return x.n === n && (kin ? !!DS.kidOf(s, x) : DS.isSb(x)); })[0]; return m ? m.id : 0; }; return { hid: s.hero, k1: f('큰별', 1), k2: f('작은별', 1), sa: f('바위'), sbb: f('자갈') }; });
  async function choose(sel) {
    if (!(await page.$('.ov.rite [data-lgheir]'))) { await page.click('.ov.rite [data-lgstep="pick"]').catch(() => {}); await L.sleep(400); }
    await page.click(sel); await L.sleep(1100); await page.click('#yesHeir'); await L.sleep(500);
    for (let i = 0; i < 30 && (await page.$('.ov.story, .ov.rite')); i++) { await L.skipStory(page, 3); await L.sleep(250); }
    await L.closeAll(page);
  }
  // ① 자식
  await choose('.ov.rite .lgcb.k-o1[data-lgheir^="' + X.k1 + ':"]');
  c = await ev((X) => { var s = DS.G.save, h = s.chars[s.hero], p = s.lin.P[h.pid]; return { same: s.hero === X.hid, vac: !!h.vac, kid: p && p.n === '큰별', L: h.ps.L, gone: !s.mercs.some(function (m) { return m.id === X.k1; }) }; }, X);
  A(c.same && !c.vac && c.kid && c.gone && c.L >= 25, 'option 1: the chosen adult child becomes 맹주 (L ' + c.L + ')');
  // ② 막사의 같은 병과 (자식이 있어도 고를 수 있다)
  await ev(() => { var s = DS.G.save; s.chars[s.hero].down = true; var evs = DS.linSettle(s, '시험'); DS.openLineageRite(evs, function () {}); }); await L.sleep(500);
  await choose('.ov.rite .lgcb.k-o2[data-lgheir^="' + X.sa + ':"]');
  c = await ev((X) => { var s = DS.G.save, h = s.chars[s.hero]; return { same: s.hero === X.hid, vac: !!h.vac, L: h.ps.L, g: h.ps.g, hL: h.L, gone: !s.mercs.some(function (m) { return m.id === X.sa; }) }; }, X);
  A(c.same && !c.vac && c.gone && c.L === 20 && c.g === 4 && c.hL === 20, 'option 2: the chosen same-class 막사 person becomes 맹주 at own level and grade (L ' + c.L + ')');
  // ③ 다른 가문의 가주 — 맹주 자리가 그 가문으로, 옛 맹주 가문은 어른 핏줄(작은별)이 잇는다
  await ev(() => { var s = DS.G.save; s.chars[s.hero].down = true; var evs = DS.linSettle(s, '시험'); DS.openLineageRite(evs, function () {}); }); await L.sleep(500);
  if (!(await page.$('.ov.rite [data-lgheir]'))) { await page.click('.ov.rite [data-lgstep="pick"]').catch(() => {}); await L.sleep(400); }
  const tgt = await ev(() => { var s = DS.G.save, rs = Array.from(document.querySelectorAll('.ov.rite .lgcb.k-o3')), mid = +rs[rs.length - 1].dataset.lgheir.split(':')[0], m = s.mercs.filter(function (x) { return x.id === mid; })[0], ch = s.chars[m.o]; return { id: ch.id, mid: mid, hx: ch.hx || 0, w: ch.w, L: ch.L }; });
  await page.click('.ov.rite .lgcb.k-o3[data-lgheir^="' + tgt.mid + ':"]'); await L.sleep(600);
  await shot('heir_confirm_move'); try { await page.screenshot({ path: RV + '/heir_confirm_move_390.png' }); } catch (e) {}
  const conf = await ev(() => (document.querySelector('.ov.rite .lgafter') || {}).textContent || '');
  await L.sleep(500); await page.click('#yesHeir'); await L.sleep(500);
  for (let i = 0; i < 30 && (await page.$('.ov.story, .ov.rite')); i++) { await L.skipStory(page, 3); await L.sleep(250); }
  await L.closeAll(page);
  c = await ev((a) => {
    var X = a[0], T = a[1], s = DS.G.save, old = s.chars[X.hid], nb = DS.bearer(s, old, 1), h = s.chars[s.hero];
    return { moved: s.hero === T.id, ps: !!(h.ps && !h.vac), hx: (h.hx || 0) === T.hx, w: h.w === T.w, oldBear: nb && nb.id === X.k2, oldL: old.L, nc: nb && nb.nc === DS.houseCls(old), oldHero: !old.ps && !old.vac, party: DS.partyIds(s).indexOf(old.id) >= 0 && DS.partyIds(s).indexOf(s.hero) >= 0, kinOk: DS.mercsOf(s, old.id).length === 0, units: DS.G.sim.units.filter(function (u) { return u.side === 'ally' && !u.dead; }).length, specs: DS.partySpecs(s).length, sel: !!DS.G.sim.byId['c' + s.hero] };
  }, [X, tgt]);
  A(/보통 가문이 된다/.test(conf) && /작은별/.test(conf), 'option 3 confirm tells what happens to the old 맹주 house (' + conf.replace(/\s+/g, ' ').slice(0, 90) + ')');
  A(c.moved && c.ps && c.hx && c.w && c.oldHero, 'option 3: s.hero moves to that house; it keeps its gear and 공훈; the old house holds no 맹주 data');
  A(c.oldBear && c.oldL === 15 && c.nc && c.party && c.kinOk && c.units === c.specs && c.sel, 'option 3: old 맹주 house → its adult blood kin is 가주 at own level (L ' + c.oldL + '), takes the house class, both houses fight');
  {      // 2.2.3: 맹주가 바뀌면 칩 줄의 맨 앞은 새 맹주, 나머지는 부대 탭 격자 차례 (DS.houseOrd)
    await ev(() => { DS.ui.closeAll(); }); await L.sleep(300);
    const o = await ev(() => { var s = DS.G.save, ks = Object.keys(DS.G.chipEls), want = DS.houseSort(s, DS.partyIds(s).filter(function (id) { return id !== s.hero; }).map(function (id) { return s.chars[id]; })).map(function (ch) { return 'c' + ch.id; }); return { ks: ks, hero: 'c' + s.hero, rest: ks.slice(1).join(' ') === want.join(' '), sp: DS.partySpecs(s).map(function (u) { return u.role; }).join(','), u0: DS.G.sim.units.filter(function (u) { return u.side === 'ally' && u.role === 'cmd'; })[0].id }; });
    A(o.ks[0] === o.hero && o.rest && o.u0 === o.hero, 'chip order after option 3: new 맹주 first, then the 부대 grid order (' + o.ks.join(' ') + ')');
    A(/^cmd(,cmd)*(,merc)*$/.test(o.sp), 'unit order: 맹주, 가주, then kin (' + o.sp + ')');
    if (process.env.V223) { try { fs.mkdirSync(process.env.V223, { recursive: true }); await page.screenshot({ path: path.join(process.env.V223, 'chips_after_lord_change.png') }); } catch (e) {} }
  }
  // 2.2.1 ③ 옛 맹주의 가족: 어른 핏줄 셋 + 막사에서 온 배우자(가문원) + 미성년 하나 → 다른 가문의 가주를 고르면 새 가주 하나 말고 모두 막사로 (옛 가문의 병과 · 제 레벨)
  const INV = fs.readFileSync(path.join(__dirname, 'inv.js'), 'utf8');
  const invIn = () => ev((src) => { var module = {}; (new Function('module', src))(module); return module.exports(DS, DS.G.save, true); }, INV);
  await L.closeAll(page);
  const F = await ev(() => {
    var s = DS.G.save, h = s.chars[s.hero], P = s.lin.P, hp = P[h.pid];
    var sp = DS.addMerc(s, DS.heroType(DS.charList(s).filter(function (c) { return c.cls !== h.cls && !DS.CLASSES[c.cls].master; })[0].cls), 3, 0); sp.sb = 1; DS.sbNc(s, sp, null); sp.L = 22; sp.n = '이슬'; sp.sx = h.sx === 'm' ? 'f' : 'm'; DS.mercTidy(s);
    if (hp.sp) { var q = P[hp.sp]; hp.sp = 0; if (q) q.sp = 0; }
    var w = DS.linWed(s, { c: s.hero }, { m: sp.id }, { anywhere: true }); hp = P[h.pid];
    function mk(L, nm, g) { var m = DS.addMerc(s, DS.heroType(h.cls), g, s.hero); m.kn = 1; m.L = L; m.exp = 0; m.n = nm; var p = DS.linMkP(s, { k: 'm', sn: s.lin.sur, n: nm, sx: 'm', gen: hp.gen + 1, pa: [hp.id, sp.pid], type: m.type, g: g, m: m.id, gv: 1, hb: 1 }); m.pid = p.id; return m; }
    var a = mk(31, '해별', 3), b = mk(24, '달별', 4), c = mk(17, '샛별', 2);
    var y = DS.ageYoung(s, hp, P[sp.pid], DS.heroType(h.cls), 3, Math.random);
    var yp = DS.linMkP(s, { k: 'm', sn: s.lin.sur, n: '아기별', sx: 'f', gen: hp.gen + 1, pa: [hp.id, sp.pid], type: DS.heroType(h.cls), g: 3, m: 0, gv: 1, hb: 1 }); yp.st = 'young'; y.ya.n = '아기별'; yp.ya = y.ya; yp.by = y.by; yp.ls = 70;
    DS.mercTidy(s); DS.rebuildParty();
    var kin = DS.mercsOf(s, s.hero).map(function (m) { return m.id; });
    var r = { wed: !!w, hid: s.hero, cls: DS.houseCls(h), a: a.id, b: b.id, c: c.id, sp: sp.id, yp: yp.id, kin: kin.length, L: {} };
    [a, b, c, sp].forEach(function (m) { r.L[m.id] = [DS.pL(m), m.g]; });
    h.down = true; var evs = DS.linSettle(s, '시험'); DS.ui.persist();
    DS.openLineageRite(evs, function () {});
    return r;
  });
  A(F.wed && F.kin === 4, 'old-house family set up: 3 adult blood kin + spouse from the 막사 fight as 가문원 (' + F.kin + '), one minor');
  await L.sleep(500);
  if (!(await page.$('.ov.rite [data-lgheir]'))) { await page.click('.ov.rite [data-lgstep="pick"]').catch(() => {}); await L.sleep(400); }
  const t3 = await ev(() => { var rs = Array.from(document.querySelectorAll('.ov.rite .lgcb.k-o3')); return rs.length ? rs[0].dataset.lgheir : ''; });
  A(!!t3, 'option 3 row offered');
  await page.click('.ov.rite .lgcb.k-o3[data-lgheir="' + t3 + '"]'); await L.sleep(600);
  const conf3 = await ev(() => (document.querySelector('.ov.rite .lgafter') || {}).textContent || '');
  A(/해별/.test(conf3) && /의 남은 가족 3명은 그 가문의 병과로 막사에 간다/.test(conf3) && /아이 1명은 자라면 막사로 간다/.test(conf3), 'option 3 confirm says the family goes to the 막사 (' + conf3.replace(/\s+/g, ' ').slice(0, 140) + ')');
  await L.sleep(500); await page.click('#yesHeir'); await L.sleep(500);
  for (let i = 0; i < 30 && (await page.$('.ov.story, .ov.rite')); i++) { await L.skipStory(page, 3); await L.sleep(250); }
  await L.closeAll(page);
  const famChk = () => ev((F) => {
    var s = DS.G.save, P = s.lin.P, old = s.chars[F.hid], nb = DS.bearer(s, old, 1), by = function (id) { return s.mercs.filter(function (m) { return m.id === id; })[0] || null; };
    var sbOk = [F.b, F.c, F.sp].map(function (id) { var m = by(id), p = m && P[m.pid]; return !!(m && DS.isSb(m) && m.sb && m.nc === F.cls && !m.kn && DS.pL(m) === F.L[id][0] && m.g === F.L[id][1] && p && p.hx === F.hid && !DS.lineOf(s, m)); });
    var ym = s.mercs.filter(function (m) { return m.pid === F.yp; })[0] || null, yp = P[F.yp];
    return { moved: s.hero !== F.hid, bear: nb && nb.id === F.a && nb.nc === F.cls, sbOk: sbOk, kin: DS.mercsOf(s, s.hero).length, yHx: yp && yp.hx === F.hid, ySt: yp && yp.st, ym: ym ? { o: ym.o, sb: ym.sb, nc: ym.nc, kn: !!ym.kn } : null,
      blood: DS.linHeirs(s, s.hero).filter(function (h) { return h.blood; }).length, sbFor: DS.sbOf(s, F.hid).map(function (m) { return m.id; }), units: DS.G.sim.units.filter(function (u) { return u.side === 'ally' && !u.dead; }).length, specs: DS.partySpecs(s).length };
  }, F);
  c = await famChk();
  A(c.moved && c.bear, 'option 3 with family: the best adult blood kin (해별) is the old house 가주 with its class');
  A(c.sbOk.every(Boolean) && c.kin === 0, 'option 3 with family: the other adults and the spouse are in the 막사 with the old class, own level and grade, marked P.hx (' + c.sbOk.join('/') + ', kin ' + c.kin + ')');
  A(c.sbFor.length >= 3 && c.blood === 0 && c.yHx && c.ySt === 'young' && c.units === c.specs, 'they wait for that house (same class), are not blood heirs of the new 맹주, the minor is marked (' + c.sbFor.length + ' waiting)');
  A((await invIn()).length === 0, 'inv.js passes after option 3');
  // 미성년이 자란다 → 막사로 (가문원이 아니다)
  c = await ev((F) => { var s = DS.G.save, P = s.lin.P, yp = P[F.yp]; yp.by = (s.cal.t || 0) - 15 * DS.AGE.year - 1; var e = DS.ageCheck(s, '시험').filter(function (x) { return x.t === 'adult'; }); DS.mercTidy(s); DS.rebuildParty(); DS.ui.persist(); return { n: e.length, sb: e.map(function (x) { return x.sb; }), txt: e.map(function (x) { return DS.linEvText(s, x.ev); }).join(' / ') }; }, F);
  A(c.n === 1 && c.sb[0] === 1 && /막사에 들었다/.test(c.txt), 'the old-house minor comes of age into the 막사 (' + c.txt + ')');
  c = await famChk();
  A(c.ym && c.ym.o === 0 && c.ym.sb === 1 && c.ym.nc === F.cls && !c.ym.kn && c.kin === 0 && c.ySt === 'live' && c.yHx, 'grown minor: 막사, old class, not 가문원 (' + JSON.stringify(c.ym) + ')');
  A((await invIn()).length === 0, 'inv.js passes after the minor comes of age');
  // 저장하고 다시 불러온다 → 그대로 (부팅 경로 · 클라우드도 같은 문자열을 Save.read 로 읽는다)
  const rawF = await ev(() => { DS.ui.persist(); return localStorage.getItem(DS.Save.KEY); });
  c = await ev((a) => { var r = DS.Save.read(a[0]), F = a[1], P = r.lin.P, hx = [F.b, F.c, F.sp].map(function (id) { var m = r.mercs.filter(function (x) { return x.id === id; })[0]; return !!(m && m.sb && !m.o && m.nc === F.cls && P[m.pid] && P[m.pid].hx === F.hid); }); return { hx: hx, y: P[F.yp] && P[F.yp].hx === F.hid, kin: DS.mercsOf(r, r.hero).length }; }, [rawF, F]);
  A(c.hx.every(Boolean) && c.y && c.kin === 0, 'Save.read of the stored string keeps the marker and 막사 places (cloud path)');
  await page.reload(); await page.waitForSelector('#btnCont', { timeout: 30000 });
  await page.click('#btnCont'); await L.sleep(2600); await L.closeAll(page);
  c = await famChk();
  A(c.sbOk.every(Boolean) && c.ym && c.ym.sb === 1 && c.ym.nc === F.cls && c.kin === 0 && c.yHx && c.blood === 0, 'after reload: the old-house family is still in the 막사 with the marker');
  A((await invIn()).length === 0, 'inv.js passes after reload');
  // 막사 규칙 그대로: 손으로 바꿔 세우면 물러난 가주(해별)는 막사로 (가문원이 아니다) · 방출할 수 있다
  c = await ev((F) => { var s = DS.G.save, r = DS.hand(s, F.hid, F.b, { where: 'town' }), a = s.mercs.filter(function (m) { return m.id === F.a; })[0]; return { ok: r.ok, to: r.to, a: a && DS.isSb(a) && a.nc === F.cls, kin: DS.mercsOf(s, s.hero).length, fire: DS.isSb(s.mercs.filter(function (m) { return m.id === F.c; })[0]) }; }, F);
  A(c.ok && c.to === 'sb' && c.a && c.kin === 0 && c.fire, 'manual swap works (same class); the old 가주 goes back to the 막사, not 가문원; they are 막사 people (방출 allowed)');
  A((await invIn()).length === 0, 'inv.js passes after the swap');
  // ③ 옛 맹주 가문에 어른 핏줄이 없으면 막사의 같은 병과, 그도 없으면 빈 가문 (머리 없이)
  c = await ev(() => {
    function run(withSb) {
      var s = DS.fixSave(JSON.parse(JSON.stringify(DS.G.save))), h = s.chars[s.hero], oldId = s.hero;
      s.mercs.slice().forEach(function (m) { if (m.o === s.hero && !m.h) DS.loseMerc(s, m.id); if (!m.h && !m.o && DS.sbFits(h, m)) DS.loseMerc(s, m.id); });
      DS.linTidy(s); DS.mercTidy(s);
      var sbm = null; if (withSb) { sbm = DS.addMerc(s, DS.heroType(h.cls), 3, 0); sbm.sb = 1; sbm.nc = DS.houseCls(h); sbm.L = 27; DS.mercTidy(s); }
      h.down = true; DS.linSettle(s, '시험');
      var o3 = DS.linChoices(s, oldId).filter(function (c) { return c.opt === 3; })[0]; if (!o3) return { no: 1 };
      DS.linSucceed(s, oldId, o3, {}); DS.sbTick(s); DS.mercTidy(s); DS.pSync(s);
      var old = s.chars[oldId], b = DS.bearer(s, old, 1);
      return { moved: s.hero !== oldId, seat: withSb ? b === sbm && old.L === 27 : !b && old.L === 1 && DS.partyIds(s).indexOf(oldId) < 0 };
    }
    return { sb: run(true), vac: run(false) };
  });
  A(c.sb.moved && c.sb.seat, 'option 3 without blood kin: the same-class 막사 person takes the old 맹주 house at own level');
  A(c.vac.moved && c.vac.seat, 'option 3 with nobody: the old 맹주 house is vacant (L 1) and does not fight');
  await L.closeAll(page);
  // ⑩ 맹주가 쓰러졌는데 어른 핏줄도 막사의 같은 병과도 없다 (다른 병과만 막사에) · 다른 가문이 모두 비었다 → 대가 끊겨도 맹주 자리는 이어진다 (스무 해)
  c = await ev(() => {
    var s = DS.G.save, h = s.chars[s.hero];
    s.mercs.slice().forEach(function (m) { DS.loseMerc(s, m.id); });      // 가주·막사·가문원 모두 떠난다
    if (s.lin && s.lin.P) for (var k in s.lin.P) if (s.lin.P[k].st === 'young') s.lin.P[k].st = 'gone';
    DS.linTidy(s); DS.mercTidy(s);
    var oc = DS.charList(s).filter(function (ch) { return ch.id !== s.hero && ch.cls !== h.cls && !DS.CLASSES[ch.cls].master; })[0], om = DS.addMerc(s, DS.heroType(oc.cls), 5, 0); om.sb = 1; om.nc = oc.cls; om.L = 50; DS.mercTidy(s);      // 다른 병과 한 사람은 막사에 (맹주를 잇지 못한다)
    var allVac = DS.charList(s).every(function (ch) { return ch.id === s.hero || DS.vacant(s, ch); });
    h.down = true; var e = DS.linSettle(s, '시험'), heirs = DS.linHeirs(s, s.hero).filter(function (x) { return !x.young; });
    var ended = DS.linEnded(s, s.hero), r = DS.linAutoAll(s);
    DS.mercTidy(s); DS.rebuildParty();
    var h2 = s.chars[s.hero];
    return { allVac: allVac, heirs: heirs.map(x => x.kind), ended: ended, lapse: (r || []).some(x => x.t === 'lapse'), hero: !!(h2 && !h2.vac && h2.ps), fight: DS.partySpecs(s).length, units: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead).length };
  });
  A(c.allVac && c.ended && c.lapse && c.hero && c.fight >= 1 && c.units >= 1, 'no blood heir + only other-class 막사 + every house vacant → lapse fallback, 맹주 seat refilled, ' + c.fight + ' fighter(s)');
  await L.closeAll(page); await shot('after_lapse');
  // ⑪ 스무 해 창 (빈 가문이 있는 채로 한 대 넘기기)
  c = await ev(() => {
    var s = DS.G.save; for (var id = 10; id <= 30; id++) s.cleared[id] = 1;
    var st = DS.egStart(s); if (!st) return { st: false, why: (DS.egCanStart(s) || {}).why };
    var tk0 = s.tickets || 0, lines = [], y0 = DS.egYear;
    DS.egYear = function () { var r = y0.apply(this, arguments); if (r && r.lines) r.lines.forEach(function (l) { lines.push([].concat(l.t || l).join(' ')); }); return r; };
    var r; try { r = DS.egRunAuto(s, { heir: 'first', keep: 'light', hand: true, call: 'none' }); } finally { DS.egYear = y0; }
    DS.mercTidy(s);
    return { st: true, years: r.years, gen: s.eg.gen, vac: DS.bnEmpty(s).length, pass: !!s.eg.pass, fight: DS.partySpecs(s).length, tk: (s.tickets || 0) - tk0, line: lines.filter(function (l) { return /모집권/.test(l); })[0] || '' };
  });
  A(c.st && c.years >= 20 && !c.pass && c.fight >= 1, '20-year generation pass with vacant houses (gen ' + c.gen + ', vacant ' + c.vac + ', fighters ' + c.fight + ')');
  A(c.tk === Math.min(3, c.vac) && c.tk > 0 && /빈 가문 \d+곳/.test(c.line), 'dawn of the next generation: ' + c.tk + ' recruit ticket(s) for vacant houses (max 3) — 「' + c.line + '」');
  // ⑬ 2.2.3 끝없는 갱도: 층의 세기는 유한하고 늘어난다 · 층 고르기 창(같은 층 다시 · 다음 층 도전) · 결과 창(다음 층 · 같은 층 다시 · 나가기, 경험치 판) · 지면 다시 도전 · 다시 켜도 최고 층 · 옛 저장 옮김
  {
    const V = process.env.V223, vshot = async (n) => { if (V) { try { fs.mkdirSync(V, { recursive: true }); await page.screenshot({ path: path.join(V, n) }); } catch (e) {} } };
    const st = await ev(() => { var o = {}; [1, 50, 500].forEach(function (f) { var sc = DS.pit(f), b = DS.buildScenario(sc, 12, 'inf'), boss = b.units.filter(function (u) { return u.role === 'boss'; })[0], mob = b.units.filter(function (u) { return u.role !== 'boss'; })[0], r = DS.pitRec(f);
      o[f] = { L: sc.L, bhp: boss.hp, batk: boss.atk, bdef: boss.def, mhp: mob.hp, matk: mob.atk, exp: boss.exp, gold: DS.scnGold(sc), rec: r[0], txt: DS.recText(sc), n: b.units.length }; }); return o; });
    const fin = [1, 50, 500].every(f => ['bhp', 'batk', 'bdef', 'mhp', 'matk', 'exp', 'gold', 'rec'].every(k => Number.isFinite(st[f][k]) && st[f][k] > 0) && !/NaN|undefined|Infinity/.test(st[f].txt));
    const inc = ['bhp', 'batk', 'mhp', 'matk', 'exp', 'gold'].every(k => st[1][k] < st[50][k] && st[50][k] < st[500][k]);
    A(fin && inc && st[500].bhp < 1e7, 'pit floors 1 / 50 / 500: finite and increasing (boss hp ' + st[1].bhp + ' / ' + st[50].bhp + ' / ' + st[500].bhp + ', atk ' + st[1].batk + ' / ' + st[50].batk + ' / ' + st[500].batk + ', ' + st[1].txt + ' / ' + st[500].txt + ')');
    const mg = await ev(() => { var a = { pit: 10, lootPit: 10 }, b = { pit: 4 }, c = {}; DS.pitFix(a); DS.pitFix(b); DS.pitFix(c); return [a.pitBest, a.pit, a.lootPit, b.pitBest, c.pitBest, c.pitCur, a.pitV]; });
    A(mg[0] === 27 && mg[1] === 28 && mg[2] === 27 && mg[3] === 6 && mg[4] === 0 && mg[5] === 1 && mg[6] === 2, 'old pit progress migrates by enemy level (old 10 → best ' + mg[0] + ', old pit 4 → best ' + mg[3] + ', new save 0)');
    await L.newGame(page, { cls: 'inf', name: '갱도' }); await ev(() => { DS.G.save.opt.cine = 'off'; });
    await L.edit(page, function () { s.gold = 500000; for (var id = 1; id <= 15; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 9); for (var kk = 0; kk < 3; kk++) { var km = DS.addMerc(s, 'm_sword', 3, s.hero); km.kn = 1; km.L = 50; } DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 60; b.exp = 0; } }); s.visited.stone = true; DS.mercTidy(s); DS.pSync(s); });
    await ev(() => { DS.ui.closeAll(); DS.enterZone('stone'); }); await L.sleep(700); await L.closeAll(page);
    await ev(() => DS.openPit(null)); await L.sleep(500);
    let w = await ev(() => { var o = document.querySelector('.ov .pitw'); return { same: !!o.querySelector('[data-pf]') && o.querySelectorAll('[data-pf]').length, next: (o.querySelector('.pitb.gold small') || {}).textContent, sel: o.querySelector('.pitsel').textContent, rec: /권장/.test(o.textContent), sw: document.documentElement.scrollWidth }; });
    A(w.same === 1 && w.next === '1층' && w.sel === '1층' && w.rec && w.sw <= 390, 'pit entry (new save): only 「다음 층 도전」 1층, stepper, 권장 shown');
    A((await L.badText(page, '.ov')).length === 0, 'pit entry has no NaN/undefined');
    // 다음 층 도전 → 1층 → 이긴다 → 결과 창
    const winPit = async () => { await ev(() => { DS.G.quiet = true; DS.G.sim.win(); }); for (let i = 0; i < 60; i++) { await L.sleep(200); await L.skipStory(page, 1); if (await ev(() => !!document.querySelector('.ov.res26 [data-pitgo]'))) break; } await L.sleep(400); };
    await page.click('.ov .pitw .pitb.gold'); await L.sleep(700); await L.skipStory(page, 5); await L.sleep(300);
    A(await ev(() => !!(DS.G.scn && DS.G.scn.pit === 1)), '「다음 층 도전」 enters floor 1');
    await winPit();
    w = await ev(() => { var o = document.querySelector('.ov.res26'), s = DS.G.save; return { next: !!o.querySelector('[data-pitgo="2"]'), same: !!o.querySelector('[data-pitgo="1"]'), out: !!o.querySelector('.pitrb [data-close]'), xb: o.querySelectorAll('.xb [data-v0]').length, best: s.pitBest, cur: s.pitCur, note: (o.querySelector('.pitnote') || {}).textContent || '' }; });
    A(w.next && w.same && w.out && w.xb >= 5, 'pit win result: 「다음 층」 · 「같은 층 다시」 · 「나가기」 and the exp board (' + w.xb + ' bars)');
    A(w.best === 1 && w.cur === 1 && /첫 돌파/.test(w.note), 'best floor 1 saved, first-clear note (' + w.note + ')');
    await ev(() => DS.xbSkip()); await L.sleep(300); await vshot('pit_result.png'); await shot('pit_result');
    // 2.2.4 결과 창: 위(.rbody)만 스크롤 — 경험치 판 · 「다음」 줄 · 단추가 겹치지 않고 모두 화면 안 (스크롤하면 판 끝까지 보인다)
    const resGeo = (sel) => page.evaluate((sel) => { var o = document.querySelector(sel), b = o.querySelector('.rbody'), f = o.querySelector('.rfoot'), nl = f.querySelector('.nextl'), bt = [...f.querySelectorAll('.btn')], vh = innerHeight;
      var br = b.getBoundingClientRect(), fr = f.getBoundingClientRect(), nr = nl.getBoundingClientRect(), xs = [...b.querySelectorAll('.xb .hk, .xb .xk, .xb .xbs')];
      b.scrollTop = 1e6; var last = xs.length ? Math.max.apply(null, xs.map(function (e) { return e.getBoundingClientRect().bottom; })) : 0, bb = b.getBoundingClientRect().bottom, top0 = xs.length ? Math.min.apply(null, xs.map(function (e) { return e.getBoundingClientRect().top; })) : 0;
      var ok = br.bottom <= fr.top + 0.5 && nr.top >= fr.top - 0.5 && bt.every(function (x) { var r = x.getBoundingClientRect(); return r.top >= nr.bottom - 0.5 && r.bottom <= vh && r.bottom <= fr.bottom + 0.5 && r.height >= 40; }) && fr.bottom <= vh && last <= bb + 0.5 && b.scrollHeight > b.clientHeight - 1;
      var cells = xs.length; b.scrollTop = 0; return { ok: ok, body: Math.round(br.bottom), foot: Math.round(fr.top), next: [Math.round(nr.top), Math.round(nr.bottom)], btn: bt.map(function (x) { var r = x.getBoundingClientRect(); return Math.round(r.top) + '-' + Math.round(r.bottom); }).join(','), last: Math.round(last), bb: Math.round(bb), vh: vh, cells: cells }; }, sel);
    let rg = await resGeo('.ov.res26');
    A(rg.ok && rg.cells >= 10, 'pit result at 390×844: board, 「다음」 line and buttons never overlap, all on screen, board scrolls to its end (' + JSON.stringify(rg) + ')');
    await page.setViewportSize({ width: 390, height: 667 }); await L.sleep(400);
    rg = await resGeo('.ov.res26');
    if (process.env.V224) { fs.mkdirSync(process.env.V224, { recursive: true }); await page.screenshot({ path: path.join(process.env.V224, 'pit_result_667.png') }); }
    A(rg.ok, 'pit result at 390×667: same (' + JSON.stringify(rg) + ')');
    await page.setViewportSize({ width: 390, height: 844 }); await L.sleep(400);
    if (process.env.V224) await page.screenshot({ path: path.join(process.env.V224, 'pit_result.png') });
    A((await L.badText(page, '.ov')).length === 0, 'pit result has no NaN/undefined');
    // 같은 층 다시 → 1층 · 다음 층 → 2층
    await page.click('.ov.res26 [data-pitgo="1"]'); await L.sleep(900); await L.skipStory(page, 5); await L.closeAll(page).catch(() => {}); await L.sleep(300);
    A(await ev(() => !!(DS.G.scn && DS.G.scn.pit === 1)), '「같은 층 다시」 re-enters floor 1');
    await winPit();
    await page.click('.ov.res26 [data-pitgo="2"]'); await L.sleep(900); await L.skipStory(page, 5); await L.sleep(300);
    w = await ev(() => ({ pit: DS.G.scn && DS.G.scn.pit, cur: DS.G.save.pitCur, ret: DS.G.ret && DS.G.ret.zone }));
    A(w.pit === 2 && w.cur === 2 && w.ret === 'stone', '「다음 층」 goes straight to floor 2 (return spot kept: ' + w.ret + ')');
    // 지면: 「다시 도전」 · 「나가기」
    await ev(() => { var sim = DS.G.sim; sim.units.filter(function (u) { return u.side === 'ally' && !u.dead; }).forEach(function (u) { sim.kill(u); }); });
    for (let i = 0; i < 30 && !(await ev(() => !!document.querySelector('.ov .result.lose [data-pitre]'))); i++) await L.sleep(200);
    w = await ev(() => { var o = document.querySelector('.ov .result.lose'); return { re: !!(o && o.querySelector('[data-pitre="2"]')), out: !!(o && o.querySelector('.pitrb [data-close]')) }; });
    A(w.re && w.out, 'pit loss: 「다시 도전」 and 「나가기」');
    await shot('pit_lose');
    await ev(() => { var s = DS.G.save, h = s.chars[s.hero]; DS.G.lineageQ = []; delete h.vac; h.down = false; h.hp = 1; if (h.ps) h.ps.L = 60; DS.pSync(s); });      // 시험: 맹주는 살려 두고 (의식 창 없이) 다시 도전
    await page.click('.ov .result.lose [data-pitre]'); await L.sleep(1200); await L.skipStory(page, 5); await L.sleep(300);
    A(await ev(() => !!(DS.G.scn && DS.G.scn.pit === 2 && DS.G.sim.units.some(function (u) { return u.side === 'ally' && !u.dead; }))), '「다시 도전」 re-enters floor 2');
    await winPit();
    await page.click('.ov.res26 .pitrb [data-close]'); await L.sleep(500); await L.settle(page, 20000); await L.sleep(500);
    w = await ev(() => ({ scn: !!DS.G.scn, zone: DS.G.zone && DS.G.zone.id, best: DS.G.save.pitBest }));
    A(!w.scn && w.zone === 'stone' && w.best === 2, '「나가기」 returns to the field where we entered (best ' + w.best + ')');
    // 다시 켜도 최고 층 · 지금 층
    await ev(() => DS.ui.persist()); await page.reload(); await page.waitForSelector('#btnCont', { timeout: 30000 }); await page.click('#btnCont'); await L.sleep(1500); await L.skipStory(page); await L.closeAll(page);
    w = await ev(() => ({ best: DS.G.save.pitBest, cur: DS.G.save.pitCur, v: DS.G.save.pitV }));
    A(w.best === 2 && w.cur === 2 && w.v === 2, 'best floor survives a reload (best ' + w.best + ', current ' + w.cur + ')');
    await ev(() => DS.openPit(null)); await L.sleep(500);
    w = await ev(() => { var o = document.querySelector('.ov .pitw'), b = o.querySelectorAll('[data-pf]'); return { n: b.length, same: b[0] && b[0].dataset.pf, next: b[1] && b[1].dataset.pf }; });
    A(w.n === 2 && w.same === '2' && w.next === '3', 'pit entry after reload: 「같은 층 다시」 2층 · 「다음 층 도전」 3층');
    await page.click('.ov .pitw [data-pstep="-1"]'); await L.sleep(200);
    A((await ev(() => document.querySelector('.ov .pitw .pitsel').textContent)) === '2층', 'floor stepper picks a cleared floor');
    await page.click('.ov .pitw [data-pstep="1"]'); await L.sleep(200);
    await vshot('pit_entry.png'); await shot('pit_entry');
    await L.closeAll(page);
  }
  // ⑫ v12 저장 판 올림 (2.1.2 규칙으로 만든 저장 — tools/mkv12.js)
  const raw = fs.readFileSync(path.join(__dirname, 'fixtures', 'v12.json'), 'utf8');
  c = await ev((raw) => {
    var old = JSON.parse(raw), fol = old.mercs.filter(function (m) { return m.o && !m.h; }).length, bar = old.mercs.filter(function (m) { return !m.o; }).length, g0 = old.gold;
    var s = DS.Save.read(raw), R = DS.lastMig13 || {};
    var noFree = s.mercs.every(function (m) { return m.h || (m.sb && !m.o) || m.o === s.hero; });
    return { v: s.v, fol: fol, bar: bar, R: R, gold: s.gold - g0, news: (s.news || []).join(' / '), noFree: noFree, n0: old.mercs.length, n1: s.mercs.length, barr: DS.barracks(s).length, kin: DS.mercsOf(s, s.hero).length, fight: DS.partySpecs(s).length,
      one: DS.barracks(s).filter(function (m) { return !(m.nc || m.cast) || Object.keys(DS.CLASSES).filter(function (k) { return !DS.CLASSES[k].master && DS.sbFits({ cls: k }, m); }).length !== 1; }).map(function (m) { return m.type + '>' + m.nc; }) };
  }, raw);
  A(c.v === 13 && c.R.sb > 0 && c.R.left === 0 && c.gold === 0, 'v12 → v13: 가솔 ' + c.fol + ' + 막사 ' + c.bar + ' → 막사 ' + c.R.sb + ' (지금 ' + c.barr + '), 가문원 ' + c.R.kin + ', 떠남 0, 골드 0');
  A(c.n1 >= c.n0 && c.noFree, 'nobody leaves (' + c.n0 + ' → ' + c.n1 + ' rows), every non-가주 non-kin row is in the 막사');
  A(!c.one.length, 'every 막사 person has exactly one class (nc) after migration' + (c.one.length ? ': ' + c.one.join(' ') : ''));
  A(/한 사람 한 사람/.test(c.news) && /모두 막사에서 기다린다/.test(c.news), 'migration news line');
  // 판 올림한 저장으로 실제로 이어 하기 (부팅 경로)
  await page.evaluate((raw) => { DS.G.save = null; DS.G.running = false; localStorage.clear(); localStorage.setItem(DS.Save.KEY, raw); DS.Save.setMeta({ seenVer: DS.VERSION }); }, raw);      // 공지 창이 「이어하기」를 가리지 않게      // 지금 판이 떠나며 저장을 덮지 않게
  await page.reload(); await page.waitForSelector('#btnCont', { timeout: 30000 });
  await page.click('#btnCont'); await L.sleep(1500); await L.skipStory(page); await L.closeAll(page);
  c = await ev(() => { var s = DS.G.save; return { v: s.v, units: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead).length, fight: DS.partySpecs(s).length }; });
  A(c.v === 13 && c.units === c.fight && c.units > 3, 'migrated save boots and everyone fights (' + c.units + ')');
  await shot('migrated_town');
  await ev(() => DS.openMenu('party')); await L.sleep(500); await shot('migrated_party');
  A((await L.badText(page, '.ov')).length === 0, 'migrated 부대 tab has no NaN/undefined');
  await ev(() => { DS.ui.closeAll(); DS.openMenu('people'); }); await L.sleep(500); await shot('migrated_people');
  A((await L.badText(page, '.ov')).length === 0, 'migrated 인물 tab has no NaN/undefined');
  console.log('t50 done');
};
