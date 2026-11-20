// 2.2.9 「합일의 길」 브라우저 시험 (390×844): 새 합일 규칙 · 윗길 서른 모습 · 연출 · 옛 저장.
//   H=844 OUT=qa_out/rise node tools/shot.js tools/t_rise.js   (V229=폴더 면 보고용 화면을 그 폴더에 · 웹 판: PAGE=/home/user/dist/web/index.html)
//   ① 합일 창: 서른 가주 후보 · 대표 고르기(기본 공훈 1위 · 맹주가 들면 잠김) · 확인 → 대표만 8단, 둘은 흡수(명부 · 장비는 가방 · 출전 채움) · 두 가문 잠듦
//   ② 영웅관: 잠든 가문의 병과로는 열지 않는다 (천장도 셈하지 않는다) · 다음 세대에 깨어나 다시 열린다 (연출 reopen · wake)
//   ③ 윗길 서른 모습 (새 그림 · 픽셀) · 컷인 · 9단 연출 · 8단 위의 죽음 연출 · 부대 격자의 잠든 가문 · 입구 창의 권장
//   ④ 옛 저장: 2.2.8 꼴의 8단 위 사람(가주 · 가문원)은 단 · 레벨 그대로 제 가문 윗길로 · 옛 마스터 기록(연무장)도
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), V = process.env.V229;
  const vshot = async (n) => { if (V) { fs.mkdirSync(V, { recursive: true }); await page.screenshot({ path: path.join(V, n + '.png') }); } await shot(n); };
  await L.newGame(page, { cls: 'inf', name: '합일' });
  await L.edit(page, function () {
    s.gold = 900000; for (var id = 1; id <= 20; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 9); s.crest = true; s.opt.cine = 'full';
    DS.mercTidy(s); DS.pSync(s);
    DS.persons(s).forEach(function (p) { if (p.role === 'hero' || p.role === 'bear') { p.who.L = 70; p.who.exp = 0; } });
    var hs = DS.charList(s).filter(function (c) { return c.id !== s.hero; }); hs.forEach(function (c, i) { c.hx = 100 * (i + 1); }); hs[3].hx = 9000;      // 공훈 1위는 넷째
    DS.pSync(s); DS.kit(s);
  });
  await L.closeAll(page);
  // ① 합일 규칙 (규칙 함수)
  let c = await ev(() => {
    var s = DS.G.save, cs = DS.fuseCands(s), o = { n: cs.length, roles: cs.map(function (x) { return x.role; }).join() };
    var m = DS.addMerc(s, DS.heroType(s.chars[s.hero].cls), 3, 0); m.o = s.hero; m.kn = 1; m.L = 70; DS.mercTidy(s);      // 가문원 7단 Lv10 은 후보가 아니다
    o.kinOut = DS.fuseCands(s).every(function (x) { return x.who !== m; });
    var sbm = DS.addMerc(s, 'm_lancer', 3, 0); sbm.sb = 1; sbm.L = 70; DS.mercTidy(s); o.sbOut = DS.fuseCands(s).every(function (x) { return x.who !== sbm; });
    var bs = DS.fuseCands(s).filter(function (x) { return x.role === 'bear'; });
    var k3 = bs.slice(0, 3).map(function (x) { return x.key; }), who = k3.map(function (k) { return DS.pByKey(s, k); });
    o.dft = DS.fuseRep(s, who).hx; o.top = Math.max.apply(null, who.map(function (w) { return DS.whoHouse(s, w).hx; }));
    var kh = ['h'].concat(k3.slice(0, 2)); o.lock = DS.fuseRepLock(s, kh.map(function (k) { return DS.pByKey(s, k); })).id === s.hero;
    o.lockBad = DS.fuseOk(s, kh, { rep: DS.whoHouse(s, DS.pByKey(s, k3[0])).id }).ok === false;
    o.dup = DS.fuseOk(s, [k3[0], k3[0], k3[1]]).ok === false;
    return o;
  });
  A(c.n === 10 && c.kinOut && c.sbOut, 'fusion candidates are 가주 only (맹주 + nine 가주 at 7단 Lv10; 가문원 and 막사 people are not): ' + c.n);
  A(c.dft === c.top && c.lock && c.lockBad && c.dup, 'representative: default is the highest-merit house, locked to the 맹주 house when the 맹주 is in (other choice refused)');
  // 합일 창 (대표 고르기) — 기본 셋 → 넷째(공훈 1위)가 든 셋으로
  await ev(() => { DS.openShop('church'); });
  await L.sleep(500);
  await ev(() => { var o = document.querySelector('.ov'), rows = [...o.querySelectorAll('[data-fupick]')].filter(function (b) { return b.dataset.fupick !== 'h'; }); [...o.querySelectorAll('[data-fupick].on')].forEach(function (b) { b.click(); }); [1, 3, 5].forEach(function (i) { var r = [...document.querySelectorAll('.ov [data-fupick]')].filter(function (b) { return b.dataset.fupick !== 'h'; })[i]; if (r) r.click(); }); });
  await L.sleep(400);
  c = await ev(() => { var o = document.querySelector('.ov'), rb = o.querySelectorAll('[data-furep]'), on = o.querySelector('[data-furep].on'); var box = o.querySelector('.furep2'); if (box) box.scrollIntoView({ block: 'center' }); return { n: rb.length, on: on ? +on.dataset.furep : 0, txt: box ? box.textContent : '' }; });
  A(c.n === 3 && c.on && /8단/.test(c.txt) && /잠든다/.test(c.txt), 'fusion window: three crest buttons to choose the representative, preview says who rises and which houses sleep');
  await vshot('fusion_window');
  // 대표를 다른 가문으로 바꾼다
  const repPick = await ev(() => { var o = document.querySelector('.ov'), b = [...o.querySelectorAll('[data-furep]')].filter(function (x) { return !x.classList.contains('on'); })[0]; b.click(); return +b.dataset.furep; });
  await L.sleep(300);
  A(await ev((id) => +document.querySelector('.ov [data-furep].on').dataset.furep === id, repPick), 'tapping another crest makes it the representative');
  const before = await ev(() => { var s = DS.G.save; return { houses: DS.charList(s).length, gear: Object.keys(s.gear).reduce(function (a, k) { return a + s.gear[k]; }, 0), fused: Object.keys(s.lin.P).filter(function (k) { return s.lin.P[k].st === 'fused'; }).length, deaths: s.lin.log.filter(function (e) { return e.t === 'death'; }).length }; });
  await page.click('.ov [data-fugo]'); await L.sleep(500);
  A(await ev(() => !!document.querySelector('.ov .fuask')), 'fusion asks to confirm (cannot be undone)');
  await page.click('#yesFuse'); await L.sleep(900);
  await vshot('fusion_cine_1');
  await L.sleep(800); await vshot('fusion_cine_2');
  await L.sleep(1300); await vshot('fusion_cine_3');
  c = await ev((rep) => {
    var s = DS.G.save, LF = DS.lastFuse, el = document.querySelector('.cine.ck-fuse'), R = s.chars[rep], b = DS.bearer(s, R);
    return { cine: !!el, faces: el ? el.querySelectorAll('.cfzf').length : 0, flags: el ? el.querySelectorAll('.cfzb').length : 0, rep: LF.rep === rep, L: b ? DS.pL(b) : 0, fz: !!(b && b.fz), name: DS.tierName(R.cls, 8), x: DS.riseCls(R),
      houses: DS.charList(s).length, shut: DS.fzShutList(s).slice().sort().join(), gone: LF.gone.map(function (g) { return g.cls; }).sort().join(), gear: Object.keys(s.gear).reduce(function (a, k) { return a + s.gear[k]; }, 0),
      fused: Object.keys(s.lin.P).filter(function (k) { return s.lin.P[k].st === 'fused'; }).length, deaths: s.lin.log.filter(function (e) { return e.t === 'death'; }).length, inS: (s.sortie || []).length, sortieOk: (s.sortie || []).every(function (e) { return s.chars[e.h]; }), trio: (b && b.fu3 || []).length, ls: LF.ls };
  }, repPick);
  A(c.cine && c.faces === 3 && c.flags === 3, 'fusion cinematic: three faces converge, three banners (two lower, one rises)');
  A(c.rep && c.L === 71 && c.fz && c.x === DS_X(c.x) && c.trio === 3, 'the chosen representative rises to 8단 ' + c.name + ' (' + c.x + '), keeps the trio names');
  A(c.houses === before.houses - 2 && c.shut === c.gone && c.shut.split(',').length === 2, 'the other two are absorbed: their houses close (' + c.shut + ')');
  A(c.gear >= before.gear + 2 && c.fused === before.fused + 2 && c.deaths === before.deaths && c.inS === 2 && c.sortieOk, 'absorbed gear → bag, lineage marks them 합일 (not deaths), sortie refilled');
  function DS_X(x) { return /^x[a-z]+$/.test(x) ? x : '?'; }
  await page.mouse.click(195, 760); await L.sleep(700);
  await L.closeAll(page);
  // ② 영웅관: 잠든 병과로는 열지 않는다 · 천장도 셈하지 않는다
  c = await ev(() => {
    var s = DS.G.save, shut = DS.fzShutList(s), cc = DS.closedCls(s), o = { shut: shut.length, notClosed: shut.every(function (k) { return cc.indexOf(k) < 0; }), opened: [] };
    var raw = JSON.stringify(s), s2 = JSON.parse(raw); DS.gearRefSave(s2);
    s2.hpity = 9; var rnd = function () { return 0.5; };
    for (var i = 0; i < 20; i++) { var r = DS.recruitHero(s2, Math.random); if (r && r.role === 'open') o.opened.push(r.ch.cls); }
    o.bad = o.opened.filter(function (k) { return shut.indexOf(k) >= 0; }).length;
    shut.forEach(function (k) { if (DS.houseOpen(s2, k)) o.bad++; var r2 = DS.recruitHero(s2, Math.random, { cls: k }); if (r2 && r2.role === 'open') o.bad++; });      // 직접 열어도 · 그 병과를 골라 불러도 열리지 않는다
    s2.hpity = 0; DS.recruitHero(s2, Math.random); o.pity = +s2.hpity || 0;      // 닫힌 가문이 잠든 둘뿐이면 천장 셈을 하지 않는다
    return o;
  });
  A(c.shut === 2 && c.notClosed && c.bad === 0 && c.pity === 0, 'gacha never opens a fusion-closed house this generation and the pity counter ignores them (opened ' + (c.opened.join(',') || 'none') + ')');
  await ev(() => { DS.openShop('merc'); }); await L.sleep(500);
  A(await ev(() => /합일로 잠듦/.test(document.querySelector('.ov').textContent)), '영웅관 lists the sleeping houses');
  await L.closeAll(page);
  await ev(() => { DS.openMenu('party'); }); await L.sleep(600);
  c = await ev(() => { var z = document.querySelectorAll('.ov .hk.fzs'); if (z[0]) z[0].scrollIntoView({ block: 'center' }); return { n: z.length, t: z[0] ? z[0].textContent : '' }; });
  A(c.n === 2 && /합일로 잠듦/.test(c.t) && /다음 세대/.test(c.t), '부대 grid shows the two sleeping houses (' + c.t + ')');
  await L.sleep(300); await vshot('party_grid_sleeping');
  A((await L.badText(page, '.ov')).length === 0, 'party grid has no NaN/undefined');
  await L.closeAll(page);
  // ③ 윗길 서른 모습 (새 그림) — 한 장에
  await ev(() => {
    var U = DS.ui, ks = Object.keys(DS.RISE_OF), h = '<div class="result" style="max-width:380px"><h2>윗길 서른</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;text-align:center;font-size:10px">';
    ks.forEach(function (k) { [8, 9, 10].forEach(function (t) { h += '<div>' + U.sprTag(DS.lookName(k, t), '', 3.4) + '<br>' + DS.tierName(k, t) + '</div>'; }); });
    U.overlay(h + '</div></div>', 'modal');
  });
  await L.sleep(1200);
  c = await ev(() => { var o = document.querySelector('.ov'); return { n: o.querySelectorAll('canvas, img').length, names: o.textContent }; });
  A(c.n >= 30, 'all 30 class tiers draw (' + c.n + ')');
  await vshot('sprites_30');
  await page.mouse.wheel(0, 900); await L.sleep(400); await vshot('sprites_30b');
  await L.closeAll(page);
  await ev(() => { DS.setArt('pixel'); var U = DS.ui, ks = Object.keys(DS.RISE_OF), h = '<div class="result" style="max-width:380px"><h2>픽셀</h2><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:2px">'; ks.forEach(function (k) { [8, 9, 10].forEach(function (t) { h += U.sprTag(DS.lookName(k, t), '', 3); }); }); U.overlay(h + '</div></div>', 'modal'); });
  await L.sleep(900);
  A(await ev(() => document.querySelectorAll('.ov canvas, .ov img').length >= 30), 'pixel sprites for all 30 tiers');
  await vshot('sprites_30_pixel');
  await ev(() => { DS.ui.closeAll(); DS.setArt('new'); }); await L.sleep(300);
  // 컷인 (금 테): 8단 위 맹주 — 필살기 몇 개
  await ev(() => { var s = DS.G.save; s.chars[s.hero].ps.L = 92; DS.pSync(s); DS.heroUlt(s); DS.ultRevealed(s); DS.rebuildParty(); DS.enterZone('windy'); }); await L.sleep(1000); await L.skipStory(page, 2); await L.closeAll(page);
  const cuts = ['ux_bastion', 'ux_goldrush', 'ux_skyfire', 'ux_newmoon'];
  for (const k of cuts) {
    const r = await ev((k) => { var sim = DS.G.sim, u = sim.units.filter(function (x) { return x.hero && !x.dead; })[0]; if (!u) return { err: 'no hero' }; DS.G.pause = true; u.tier = 10; DS.ultCut(u, DS.SKILLS[k]); var el = document.getElementById('ultcut'); return { grand: el.classList.contains('grand'), t: el.textContent }; }, k);
    await L.sleep(320);
    A(r.grand && /오의/.test(r.t), '8단+ cut-in is the grand version: ' + r.t);
    await vshot('cutin_' + k);
    await L.sleep(900);
  }
  // 윗길 기술과 필살기는 진짜 판에서 오류 없이 (서른 필살기 · 스무 고유 기술 · 열 바뀐 기술)
  c = await ev(() => {
    var sim = DS.G.sim, u = sim.units.filter(function (x) { return x.hero && !x.dead; })[0], bad = [], n = 0;
    var ids = Object.keys(DS.SKILLS).filter(function (k) { return DS.SKILLS[k].rise; });
    ids.forEach(function (id) { var S = DS.SKILLS[id], f = sim.units.filter(function (x) { return x.side === 'enemy' && !x.dead; })[0]; u.mp = u.mmp = 999; u.gauge = 100; u.cd = {}; u.casting = null; u.uc = 100; if (S.ult) u.ult = id; var tg = S.tg === 'enemy' ? f : S.tg === 'tile' || S.tg === 'dir' ? (f ? { x: f.x, y: f.y } : null) : S.tg === 'ally' ? u : null; try { sim.cast(u, id, tg); n++; } catch (x) { bad.push(id + ':' + x.message); } });
    DS.G.pause = false; return { n: n, bad: bad };
  });
  A(c.n === 60 && !c.bad.length, 'every rise skill and ultimate casts without error (' + c.n + ')' + c.bad.join(','));
  await L.sleep(800);
  await ev(() => { DS.G.pause = false; DS.ui.closeAll(); DS.enterZone(DS.G.save.town); }); await L.sleep(800); await L.closeAll(page);
  // 9단 승급 연출
  await ev(() => { var s = DS.G.save, R = DS.charList(s).filter(function (c) { var b = c.id !== s.hero && DS.bearer(s, c); return b && b.fz; })[0]; window.__R = R.id; var b = DS.bearer(s, R); b.L = 81; DS.pSync(s); DS.showPromo({ id: R.id, from: 8, to: 9, cls: R.cls }, function () { window.__pd = 1; }); });
  await L.sleep(1700);
  c = await ev(() => { var el = document.querySelector('.cine.ck-ascend'); return el ? { sk: (el.querySelector('.cskl') || {}).textContent || '', t: el.querySelector('.crib').textContent } : null; });
  A(c && /새 기술/.test(c.sk) && /9단/.test(c.t), '9단 promotion cinematic shows the new form and the new signature skill: ' + (c && c.t + ' / ' + c.sk));
  await vshot('promo9_cine');
  await page.mouse.click(195, 760); await L.sleep(700);
  A(await ev(() => !!document.querySelector('.ov .promo')), 'then the promotion window');
  await L.closeAll(page);
  // 8단 위의 죽음 연출 (셋의 이름) — 대표 가주가 쓰러진다
  await ev(() => { var s = DS.G.save, R = s.chars[window.__R], b = DS.bearer(s, R); DS.loseMerc(s, b.id); var evs = DS.linMercDied(s, b, '시험장'); window.__evs = evs; DS.mercTidy(s); DS.pSync(s); DS.openLineageRite(evs, function () { window.__dd = 1; }); });
  await L.sleep(1800);
  c = await ev(() => { var el = document.querySelector('.cine.ck-fallx'); return el ? { names: el.querySelectorAll('.cx3 i').length, sub: el.querySelector('.csub').textContent } : { none: 1, any: (document.querySelector('.cine') || {}).className || '' }; });
  A(c && c.names === 3 && /합일한 넋/.test(c.sub), '8단+ death cinematic: heavier, with the three names (' + JSON.stringify(c) + ')');
  await vshot('death8_cine');
  await page.mouse.click(195, 760); await L.sleep(600); await L.closeAll(page);
  c = await ev(() => { var s = DS.G.save, R = s.chars[window.__R], b = DS.bearer(s, R); DS.sbTick(s); DS.mercTidy(s); DS.pSync(s); b = DS.bearer(s, R); return { L: b ? DS.pL(b) : 0, fz: !!(b && b.fz), x: DS.riseCls(R) }; });
  A(!c.fz && c.L <= 70 && !/^x/.test(c.x), 'the successor does not inherit 8단 (L' + c.L + ', ' + c.x + ')');
  // 다음 세대: 잠든 가문이 깨어나고 다시 열린다
  c = await ev(() => {
    var s = DS.G.save; for (var id = 21; id <= 30; id++) s.cleared[id] = 1; DS.egFix(s); var shut0 = DS.fzShutList(s).slice();
    s.eg.gen = 2; var woke = DS.fzWakeTick(s); var cc = DS.closedCls(s);
    return { shut0: shut0.sort().join(), woke: woke.sort().join(), now: DS.fzShutList(s).length, open: shut0.every(function (k) { return cc.indexOf(k) >= 0; }), q: (s.fzWake || []).length };
  });
  A(c.shut0 === c.woke && c.now === 0 && c.open && c.q === 2, 'next generation: the sleeping houses wake and become normal closed houses (' + c.woke + ')');
  await L.sleep(2200);
  c = await ev(() => { var el = document.querySelector('.cine.ck-wake'); return el ? { t: el.textContent, flags: el.querySelectorAll('.cfzb').length } : null; });
  A(c && c.flags === 2 && /깨어난다/.test(c.t), 'wake cinematic: 잠든 가문이 깨어난다 (' + (c && c.flags) + ' banners)');
  await vshot('wake_cine');
  await page.mouse.click(195, 760); await L.sleep(500); await L.closeAll(page);
  c = await ev(() => { var s = DS.G.save, k = Object.keys(s.fzShut || {})[0]; var r = DS.recruitHero(s, Math.random, { cls: k }); window.__rr = r; return { role: r && r.role, re: !!(r && r.reopen), left: Object.keys(s.fzShut || {}).length, cls: k }; });
  A(c.role === 'open' && c.re && c.left === 1, 'the gacha reopens a woken house (' + c.cls + ')');
  await ev(() => { DS.houseOpenShow(window.__rr, function () { window.__ro = 1; }); }); await L.sleep(1500);
  A(await ev(() => !!document.querySelector('.cine.ck-reopen')), 'reopen cinematic (special house-open variant)');
  await vshot('reopen_cine');
  await page.mouse.click(195, 760); await L.sleep(500); await L.closeAll(page);
  // 입구 창의 권장 (3명 출전)
  await ev(() => { DS.G.save.eg.gen = 1; DS.openGate(DS.scn(25), null); }); await L.sleep(700);
  c = await ev(() => { var o = document.querySelector('.ov .gate'); return o ? o.textContent : ''; });
  A(/권장/.test(c), 'gate shows 권장 for the three-person sortie');
  await vshot('gate_rec25');
  await L.closeAll(page);
  // ④ 옛 저장: 2.2.8 꼴 — 8단 위 가주 · 가문원(옛 규칙의 아무 셋 합일)은 단 · 레벨 그대로 제 가문 윗길로
  c = await ev(() => {
    var raw = JSON.parse(JSON.stringify(DS.G.save)); delete raw.fzShut; delete raw.fzWake;
    var hs = Object.keys(raw.chars).map(Number).filter(function (id) { return id !== raw.hero; }), bm = raw.mercs.filter(function (m) { return m.h; });
    bm.slice(0, 3).forEach(function (m, i) { m.L = [74, 88, 96][i]; m.fz = 1; delete m.fu3; });      // 옛 합일 셋 (모두 8단 위 그대로)
    var kin = raw.mercs.filter(function (m) { return m.o === raw.hero && !m.h; })[0]; if (kin) { kin.L = 79; kin.fz = 1; }
    raw.v = DS.SAVE_V; var s2 = DS.Save.read(JSON.stringify(raw)), out = [];
    bm.slice(0, 3).forEach(function (m) { var m2 = s2.mercs.filter(function (x) { return x.id === m.id; })[0], ch = m2 && s2.chars[m2.o]; out.push({ L: m2 ? DS.pL(m2) : 0, want: m.L, x: ch ? DS.riseCls(ch) : '', cls: ch ? ch.cls : '', tn: ch ? DS.tierName(ch.cls, DS.tierOfL(ch.L)) : '', sk: ch ? DS.charSkills(ch).filter(function (k) { return DS.SKILLS[k] && DS.SKILLS[k].rise; }).length : 0 }); });
    var specs = DS.partySpecs(s2), badU = specs.filter(function (u) { return u.ult && !DS.SKILLS[u.ult]; }).length;
    return { out: out, kin: kin ? DS.pL(s2.mercs.filter(function (x) { return x.id === kin.id; })[0]) : 79, badU: badU, n: specs.length };
  });
  A(c.out.every(function (o) { return o.L === o.want && o.x === 'x' + o.cls && o.sk >= 1; }) && c.kin === 79 && !c.badU, 'old save: 8단+ 가주 keep 단 and level on their own house line (' + c.out.map(function (o) { return o.cls + ' L' + o.L + ' ' + o.tn; }).join(', ') + '), 가문원 L' + c.kin + ' kept, not absorbed');
  c = await ev(() => { var r = DS.arenaChampRow('tbm', { v: 1, cls: 'bm', hs: 'cav', L: 88, name: 'x', sk: 'bm_drive,bm_tempest,cav_charge', ul: 'u_goldrush' }); return r ? { cls: r.cls, sk: r.skills.join(','), ult: r.ult, look: DS.lookName(r.cls, r.tier) } : null; });
  A(c && c.cls === 'cav' && /xcav_bolt/.test(c.sk) && c.ult === 'ux_goldrush' && c.look === 'xcav_9', 'old master arena record (bm) → its house line: ' + JSON.stringify(c));
  console.log('rise done');
};
