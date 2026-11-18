// 2.2.0 「한 사람 한 사람」 브라우저 시험 (390×844). H=844 OUT=qa_out/t50 node tools/shot.js tools/t50_people.js
//   모두 싸운다 · 미성년은 싸우지 않는다 · 가주가 쓰러지면 막사의 같은 병과가 잇는다 / 없으면 빈 가문(레벨·단도 잃는다) · 영웅 모집(빈 가문 → 가주, 찬 가문 → 막사, 막사 가득 → 막힘)
//   · 막사 경험치(같은 병과 가주 몫의 10%) · 소수 정예 없음 · 새벽의 모집권
//   · 아이 보내기 · 맹주가 이을 사람 없이 쓰러지고 모든 가문이 비었을 때 · 합일(제자리) · v12 저장 판 올림 · 연무장·무술대회 · 스무 해 창(빈 가문) · NaN/undefined 없음
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a);
  await L.newGame(page, { cls: 'inf', name: '시험' });
  // 판 꾸미기: 시나리오 1~9 를 깬 것으로 (가문 여덟), 레벨을 올리고 골드
  await L.edit(page, function () {
    s.gold = 2000000;
    for (var id = 1; id <= 9; id++) DS.applyClear(s, DS.scn(id));
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
    var zb = DS.bearer(s, Z); DS.loseMerc(s, zb.id);      // Z 가문이 빈다 (막사의 bz 는 아직 자리에 서지 않았다)
    DS.mercTidy(s); DS.rebuildParty();
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
    DS.pSync(s); out.xL2 = X.L; out.a2L = a2.L;
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
  // ④ 영웅관 창 (한 번 모집) · NaN 없음
  await ev(() => { DS.ui.closeAll(); DS.rebuildParty(); DS.openShop('merc'); }); await L.sleep(500);
  await shot('hall');
  A((await L.badText(page, '.ov')).length === 0, 'recruit window has no NaN/undefined');
  await page.click('[data-pull]'); await L.sleep(2500); await shot('hall_result');
  A((await L.badText(page, '.ov')).length === 0, 'recruit result has no NaN/undefined');
  await L.closeAll(page);
  // ⑤ 막사가 가득(정원 DS.MERC_MAX)하고 빈 가문이 없으면 막힌다
  c = await ev(() => { var s = DS.G.save, add = []; while (DS.barracks(s).length < DS.MERC_MAX) { var m = DS.addMerc(s, 'm_sword', 1, 0); m.o = 0; m.sb = 1; add.push(m.id); } var vac = DS.charList(s).filter(function (ch) { return DS.vacant(s, ch); }).length; var why = DS.recruitWhy(s), r = vac ? null : DS.recruitHero(s, Math.random); DS.ui.closeAll(); DS.openShop('merc'); var btn = document.querySelector('.ov [data-pull]'); return { why: why, r: r, vac: vac, dis: !!(btn && btn.disabled), add: add, cap: DS.MERC_MAX }; });
  await shot('hall_full');
  A(c.vac > 0 || (!!c.why && !c.r && c.dis), '막사 full (' + c.cap + ') → recruit blocked (' + c.why + ')');
  await ev((ids) => { var s = DS.G.save; ids.forEach(function (id) { DS.loseMerc(s, id); }); DS.mercTidy(s); }, c.add); await L.closeAll(page);
  // ⑥ 싸움에서 가주가 쓰러진다: 막사에 같은 병과가 있으면 싸움 뒤 그이가 잇는다 / 없으면 빈 가문 (레벨·단도 잃는다)
  await ev(() => { var s = DS.G.save; DS.charList(s).forEach(function (ch) { if (ch.cls === 'cle') DS.sbOf(s, ch.id).forEach(function (m) { DS.loseMerc(s, m.id); }); }); var m = DS.addMerc(s, DS.heroType('arc'), 3, 0); m.o = 0; m.sb = 1; m.nc = 'arc'; m.L = 25; DS.mercTidy(s); DS.rebuildParty(); });
  await ev(() => { DS.G.quiet = true; DS.startScenario(DS.scn(9)); }); await L.sleep(800);
  c = await ev(() => {
    var s = DS.G.save, sim = DS.G.sim, out = {};
    var arc = DS.charList(s).filter(ch => ch.cls === 'arc')[0], cle = DS.charList(s).filter(ch => ch.cls === 'cle')[0];
    out.arcB = DS.bearer(s, arc).id; out.arcSb = DS.sbOf(s, arc.id).length; out.cleSb = DS.sbOf(s, cle.id).length;
    out.arc = arc.id; out.cle = cle.id;
    sim.kill(sim.byId['c' + arc.id]); sim.kill(sim.byId['c' + cle.id]);
    return out;
  });
  await L.sleep(1500);
  await ev(() => { DS.G.sim.win(); }); await L.sleep(500);
  await L.settle(page, 30000); await L.sleep(2500);
  c = await ev((o) => { var s = DS.G.save, arc = s.chars[o.arc], cle = s.chars[o.cle], b = DS.bearer(s, arc); return { arcB: b ? b.id : 0, was: o.arcB, arcL: arc.L, bL: b ? b.L : 0, cleVac: DS.vacant(s, cle), cleL: cle.L, cleFight: s.party.indexOf(cle.id) >= 0, units: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead && u.ch === cle.id && u.role === 'cmd').length, fallen: (s.fallen || []).length }; }, c);
  A(c.arcB && c.arcB !== c.was && c.arcL === c.bL && c.bL === 25, '가주 died in battle → same-class 막사 person took the seat at own level (L ' + c.bL + ')');
  A(c.cleVac && !c.cleFight && c.units === 0 && c.cleL === 1, '가주 died with no same-class 막사 person → vacant (L 1), not fighting');
  await ev(() => DS.openMenu('party')); await L.sleep(500); await shot('party_vacant');
  A((await L.badText(page, '.ov')).length === 0, '부대 tab has no NaN/undefined');
  // ⑦ 빈 가문에 맹주의 어른 아이를 보낸다 (가문 창)
  c = await ev(() => { var s = DS.G.save, cle = DS.charList(s).filter(ch => ch.cls === 'cle')[0]; DS.ui.closeAll(); DS.openMenu('party'); return cle.id; });
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
  // ⑩ 맹주가 이을 사람 없이 쓰러지고 다른 가문이 모두 비었다 → 대가 끊겨도 맹주 자리는 이어진다 (스무 해)
  c = await ev(() => {
    var s = DS.G.save, h = s.chars[s.hero];
    s.mercs.slice().forEach(function (m) { DS.loseMerc(s, m.id); });      // 가주·막사·가문원 모두 떠난다
    if (s.lin && s.lin.P) for (var k in s.lin.P) if (s.lin.P[k].st === 'young') s.lin.P[k].st = 'gone';
    DS.linTidy(s); DS.mercTidy(s);
    var allVac = DS.charList(s).every(function (ch) { return ch.id === s.hero || DS.vacant(s, ch); });
    h.down = true; var e = DS.linSettle(s, '시험'), heirs = DS.linHeirs(s, s.hero).filter(function (x) { return !x.young; });
    var ended = DS.linEnded(s, s.hero), r = DS.linAutoAll(s);
    DS.mercTidy(s); DS.rebuildParty();
    var h2 = s.chars[s.hero];
    return { allVac: allVac, heirs: heirs.map(x => x.kind), ended: ended, lapse: (r || []).some(x => x.t === 'lapse'), hero: !!(h2 && !h2.vac && h2.ps), fight: DS.partySpecs(s).length, units: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead).length };
  });
  A(c.allVac && c.ended && c.lapse && c.hero && c.fight >= 1 && c.units >= 1, 'no heir + every house vacant → lapse fallback, 맹주 seat refilled, ' + c.fight + ' fighter(s)');
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
  // ⑫ v12 저장 판 올림 (2.1.2 규칙으로 만든 저장 — tools/mkv12.js)
  const raw = fs.readFileSync(path.join(__dirname, 'fixtures', 'v12.json'), 'utf8');
  c = await ev((raw) => {
    var old = JSON.parse(raw), fol = old.mercs.filter(function (m) { return m.o && !m.h; }).length, bar = old.mercs.filter(function (m) { return !m.o; }).length, g0 = old.gold;
    var s = DS.Save.read(raw), R = DS.lastMig13 || {};
    var noFree = s.mercs.every(function (m) { return m.h || (m.sb && !m.o) || m.o === s.hero; });
    return { v: s.v, fol: fol, bar: bar, R: R, gold: s.gold - g0, news: (s.news || []).join(' / '), noFree: noFree, n0: old.mercs.length, n1: s.mercs.length, barr: DS.barracks(s).length, kin: DS.mercsOf(s, s.hero).length, fight: DS.partySpecs(s).length };
  }, raw);
  A(c.v === 13 && c.R.sb > 0 && c.R.left === 0 && c.gold === 0, 'v12 → v13: 가솔 ' + c.fol + ' + 막사 ' + c.bar + ' → 막사 ' + c.R.sb + ' (지금 ' + c.barr + '), 가문원 ' + c.R.kin + ', 떠남 0, 골드 0');
  A(c.n1 >= c.n0 && c.noFree, 'nobody leaves (' + c.n0 + ' → ' + c.n1 + ' rows), every non-가주 non-kin row is in the 막사');
  A(/한 사람 한 사람/.test(c.news) && /모두 막사에서 기다린다/.test(c.news), 'migration news line');
  // 판 올림한 저장으로 실제로 이어 하기 (부팅 경로)
  await page.evaluate((raw) => { DS.G.save = null; DS.G.running = false; localStorage.clear(); localStorage.setItem(DS.Save.KEY, raw); }, raw);      // 지금 판이 떠나며 저장을 덮지 않게
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
