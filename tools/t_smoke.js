// 연기 시험: 새로 시작 → 들판 싸움 → 시나리오 1 → 메뉴 탭과 창을 모두 연다. 오류가 없고 화면에 NaN·undefined 가 없어야 한다.
//   H=844 OUT=qa_out/smoke node tools/shot.js tools/t_smoke.js   (웹 판: TARGET=web node build.js 뒤 PAGE=/home/user/dist/web/index.html 을 붙인다)
//   2.2.3: 기술 예약(마나 모자람 → 예약 · 다시 누르면 취소 · 마나가 차면 가장 먼저 · 판이 끝나면 거둠 · 쓸 수 있으면 바로) · V223=폴더 면 예약 단추 화면을 그 폴더에
'use strict';
const fs = require('fs'), path = require('path');
const DS_fx = v => !!v;      // 2.2.5: 효과 칸 (보통이면 칸이 없다)
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a);
  await L.newGame(page, { cls: 'mag', name: '연기' });
  await ev(() => { DS.G.save.opt.cine = 'off'; });      // 2.2.4: 사건 연출은 tools/t_cine.js 가 본다 (여기서는 창 · 칩 검사에 끼어들지 않게)
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
  // 2.2.8 출전 셋: 가문이 열이어도 시나리오에는 맹주 + 가주 둘 (+ 가문원). 칩은 셋 — 출전한 셋이 맹주부터, 모두 보이고 밀 필요가 없다
  await L.edit(page, function () { for (var id = 2; id <= 13; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 9); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 45; b.exp = 0; } }); for (var i = 0; i < 2; i++) { var m = DS.addMerc(s, 'm_sword', 3, s.hero); m.kn = 1; m.L = 40; } DS.mercTidy(s); DS.pSync(s); });
  await ev(() => { DS.G.quiet = true; DS.G.pause = true; DS.startScenario(DS.scn(14)); }); await L.sleep(800);
  const sc = await ev(() => { var s = DS.G.save, ids = Object.keys(DS.G.chipEls), want = DS.partySpecs(s).length; var last = ids[ids.length - 1]; DS.G.chipEls[last].el.click();
    var cmds = DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead && u.role === 'cmd').map(u => u.ch), kin = DS.mercsOf(s, s.hero).length;
    return { want: want, kin: kin, cmds: cmds, houses: DS.charList(s).length, sortie: (s.sortie || []).map(e => e.h), party: s.party.slice(), hero: s.hero, have: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead).length, chips: ids, sel: DS.G.sel === last, ult: !!document.querySelector('#acts .act.ult'), swipe: document.querySelector('#chips').classList.contains('swipe'), docW: document.documentElement.scrollWidth }; });
  A(sc.houses === 10 && sc.cmds.length === 3 && sc.cmds.indexOf(sc.hero) >= 0 && sc.sortie.every(h => sc.cmds.indexOf(h) >= 0), 'ten houses, three go out: 맹주 + sortie ' + JSON.stringify(sc.sortie) + ' (cmd units ' + JSON.stringify(sc.cmds) + ')');
  A(sc.have === sc.want && sc.want === 3 + sc.kin, 'scenario with ' + sc.want + ' allies (3 + kin ' + sc.kin + '): all placed (' + sc.have + ')');
  A(sc.sel && sc.ult, 'chip selection works and ult slot shown');
  A(sc.chips.length === 3 && sc.chips[0] === 'c' + sc.hero && sc.chips.join() === sc.party.map(id => 'c' + id).join(), 'chip row = the three sortie, 맹주 first (' + sc.chips.join(' ') + ')');
  const g0 = await ev(() => { var b = document.querySelector('#chips'), r = b.getBoundingClientRect(); var vis = [...b.querySelectorAll('.chip')].filter(c => { var q = c.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1; }); return { vis: vis.length, names: vis.every(c => c.querySelector('.cn b') && c.querySelector('.cn b').offsetWidth > 0), top: r.top + r.height / 2, cx: r.left + r.width / 2, sw: b.scrollWidth, cw: b.clientWidth }; });
  A(!sc.swipe && g0.vis === 3 && g0.names && g0.sw <= g0.cw + 2 && sc.docW <= 390, 'three chips all visible with names, no swipe, no horizontal page scroll (' + sc.docW + ')');
  const sel0 = await ev(() => DS.G.sel);
  await page.mouse.click(g0.cx, g0.top); await L.sleep(300);
  A((await ev(() => DS.G.sel)) === (await ev(() => Object.keys(DS.G.chipEls)[1])) && sel0 !== (await ev(() => Object.keys(DS.G.chipEls)[1])), 'a plain tap on a chip selects it');
  await shot('scn_many');
  // 2.2.3 기술 예약: 자동 전투 중 지금 못 쓰는 기술을 누르면 예약(단추 「예약」 · 칩 「예」) → 쓸 수 있게 되면 무엇보다 먼저 · 다시 누르면 취소 · 판이 끝나면 거둔다 · 지금 쓸 수 있으면 예전처럼 바로
  const rp = await ev(() => { var sim = DS.G.sim, SK = DS.SKILLS, pick = null;
    sim.cmds().forEach(function (u) { if (pick) return; (u.skills || []).forEach(function (k) { var S = SK[k]; if (!pick && S && S.mp > 0 && S.tg === 'self' && S.eff[0].t === 'buff' && S.eff[0].p > 0 && S.mp <= u.mmp) pick = { id: u.id, sk: k }; }); });
    if (!pick) return null;
    var u = sim.byId[pick.id]; u.auto = true; DS.G.save.chars[u.ch].manual = false; DS.select(u.id); DS.renderActs(); return pick; });
  A(!!rp, 'reservation test unit: ' + JSON.stringify(rp));
  const rbtn = '#acts .act[data-sk="' + rp.sk + '"]';
  const rst = () => ev((p) => { var u = DS.G.sim.byId[p.id], b = document.querySelector('#acts .act[data-sk="' + p.sk + '"]'), bd = b && b.querySelector('.rsvb'), ch = DS.G.chipEls[p.id];
    return { rsv: u.rsv || null, cls: !!(b && b.classList.contains('rsv')), badge: !!(bd && getComputedStyle(bd).display !== 'none' && bd.textContent === '예약'), chip: !!(ch && ch.el.classList.contains('rsv')), order: u.order ? u.order.t + ':' + u.order.id : null, mp: u.mp }; }, rp);
  // ① 지금 쓸 수 있으면 예전처럼 바로 (예약하지 않는다)
  await ev((p) => { var sim = DS.G.sim, u = sim.byId[p.id]; sim.units.forEach(function (e) { if (e.side === 'enemy' && !e.dead) e.aggro = true; }); u.mp = u.mmp; u.gauge = 100; u.cd = {}; u.casting = null; u.order = null; u.rsv = null; }, rp);      // 싸움이 붙어야 보통 자동 겨눔의 대상이 있다
  await page.click(rbtn); await L.sleep(250);
  let r0 = await rst();
  A(!r0.rsv && !r0.cls && r0.order === 'skill:' + rp.sk, 'usable skill fires at once as before (order ' + r0.order + '), not reserved');
  await ev((p) => { var u = DS.G.sim.byId[p.id]; u.order = null; }, rp);
  // ② 마나가 모자라면 예약
  await ev((p) => { var u = DS.G.sim.byId[p.id]; u.mp = 0; }, rp);
  await page.click(rbtn); await L.sleep(600);
  let r1 = await rst();
  A(r1.rsv === rp.sk && r1.cls && r1.badge && r1.chip && !r1.order, 'mana short → reserved: button shows 예약, chip marked (' + JSON.stringify(r1) + ')');
  if (process.env.V223) { try { require('fs').mkdirSync(process.env.V223, { recursive: true }); await page.screenshot({ path: require('path').join(process.env.V223, 'skill_reserved.png') }); } catch (e) {} }
  await shot('skill_reserved');
  // ③ 다시 누르면 취소
  await page.click(rbtn); await L.sleep(400);
  let r2 = await rst();
  A(!r2.rsv && !r2.cls && !r2.chip, 'tapping again cancels the reservation');
  // ④ 다시 예약 → 마나가 차면 다른 어떤 기술보다 먼저 쓴다
  await page.click(rbtn); await L.sleep(300);
  await ev((p) => { var sim = DS.G.sim, u = sim.byId[p.id]; DS.G.rsvLog = []; if (!sim._c0) { sim._c0 = sim.cast; sim.cast = function (w, id, t, f) { var ok = sim._c0.call(this, w, id, t, f); if (ok && w === u) DS.G.rsvLog.push(id); return ok; }; }
    sim.units.forEach(function (e) { if (e.side === 'enemy' && !e.dead) e.aggro = true; }); u.mp = u.mmp; u.gauge = 0; DS.G.pause = false; }, rp);
  for (let i = 0; i < 40; i++) { await L.sleep(250); if (!(await rst()).rsv) break; }
  const r3 = await ev(() => (DS.G.rsvLog || []).slice());
  let r3s = await rst();
  A(!r3s.rsv && r3[0] === rp.sk, 'once mana is there the reserved skill is cast first (casts ' + JSON.stringify(r3) + ')');
  // ⑤ 판이 끝나면 거둔다
  await ev((p) => { var u = DS.G.sim.byId[p.id]; DS.G.pause = true; u.mp = 0; }, rp);
  await page.click(rbtn); await L.sleep(300);
  const r4a = (await rst()).rsv;
  const r4 = await ev((p) => { var sim = DS.G.sim, u = sim.byId[p.id]; sim.result = null; sim.win(); return u.rsv || null; }, rp);
  A(r4a === rp.sk && !r4, 'reservation clears when the battle ends');
  await L.settle(page, 30000); await L.sleep(500);
  await L.edit(page, function () { DS.charList(s).forEach(function (c) { c.hp = 1; c.mp = 1; }); });
  await ev(() => { DS.G.quiet = true; DS.G.pause = true; DS.startScenario(DS.scn(14)); }); await L.sleep(800);
  // 2.2.2 결과 창의 경험치 판: 싸움 중에 얻은 경험치 → 막대가 판 전 자리에서 차올라 끝값에 선다 · 누르면 바로 끝 · NaN 없음
  await ev(() => { DS.gainExp(DS.G.save, DS.expNeed(46) * 1.4, 45); DS.G.sim.win(); });
  for (let i = 0; i < 40; i++) { await L.sleep(150); await L.skipStory(page, 1); if (await ev(() => !!document.querySelector('.ov.res26 .xb'))) break; }
  await L.sleep(500);
  const xm = await ev(() => { var xb = document.querySelector('.ov.res26 .xb'); return { done: xb.classList.contains('xdone'), n: xb.querySelectorAll('[data-v0]').length, lord: !!xb.querySelector('.hk.lord'), grid: xb.querySelectorAll('.xb9 .hk').length, rest: xb.querySelectorAll('.xbr .xk').length, restLab: (xb.querySelector('.xbr > small') || {}).textContent || '', bench: DS.benched(DS.G.save).length }; });
  A(xm.lord && xm.grid === 2 && !xm.done, 'exp board: lord on top + the 2 sortie 가주 below, animating (' + xm.n + ' bars)');
  A(xm.rest === xm.bench && xm.rest >= 6 && /쉰 가주 30%/.test(xm.restLab), 'exp board: rested 가주 in their own row with their share (' + xm.rest + ' · ' + xm.restLab + ')');
  await ev(() => DS.xbSkip()); await L.sleep(100);
  const xe = await ev(() => { var s = DS.G.save, bad = [], up = 0;
    document.querySelectorAll('.ov.res26 .xb [data-v0]').forEach(el => { var v1 = +el.dataset.v1, f = el.dataset.mx === '1' ? 1 : v1 - Math.floor(v1 + 1e-6), w = parseFloat(el.querySelector('.hkb > u').style.width) / 100, L1 = Math.floor(v1 + 1e-6), t = el.querySelector('.xl').textContent; if (Math.abs(w - f) > 0.01 || t.indexOf('Lv' + DS.lvOfL(L1)) < 0) bad.push([v1, w, t]); if (el.classList.contains('lvd')) up++; });
    var lw = s.chars[s.hero].ps, lf = DS.pL(lw) >= DS.pCap(lw) ? 1 : lw.exp / DS.expNeed(DS.pL(lw)), lu = parseFloat(document.querySelector('.ov.res26 .xb .hk.lord .hkb > u').style.width) / 100;
    return { done: document.querySelector('.ov.res26 .xb').classList.contains('xdone'), bad: bad, up: up, lord: Math.abs(lf - lu) < 0.01, txt: document.querySelector('.ov.res26').innerText.match(/NaN|undefined|\[object/g) }; });
  A(xe.done && !xe.bad.length && xe.lord, 'tap skips to the end: every bar and Lv at its saved value' + (xe.bad.length ? ' ' + JSON.stringify(xe.bad.slice(0, 3)) : ''));
  A(xe.up >= 3 && !xe.txt, 'level-ups marked (' + xe.up + '), no NaN/undefined');
  await shot('res_exp');
  // 2.2.4 결과 창: 위(.rbody)만 스크롤 — 경험치 판 · 「다음」 줄 · 단추가 겹치지 않고 모두 화면 안 (스크롤하면 판 끝까지 보인다)
  const resGeo = (sel) => page.evaluate((sel) => { var o = document.querySelector(sel), b = o.querySelector('.rbody'), f = o.querySelector('.rfoot'), nl = f.querySelector('.nextl'), bt = [...f.querySelectorAll('.btn')], vh = innerHeight;
    var br = b.getBoundingClientRect(), fr = f.getBoundingClientRect(), nr = nl.getBoundingClientRect(), xs = [...b.querySelectorAll('.xb .hk, .xb .xk, .xb .xbs')];
    b.scrollTop = 1e6; var last = xs.length ? Math.max.apply(null, xs.map(function (e) { return e.getBoundingClientRect().bottom; })) : 0, bb = b.getBoundingClientRect().bottom, top0 = xs.length ? Math.min.apply(null, xs.map(function (e) { return e.getBoundingClientRect().top; })) : 0;
    var ok = br.bottom <= fr.top + 0.5 && nr.top >= fr.top - 0.5 && bt.every(function (x) { var r = x.getBoundingClientRect(); return r.top >= nr.bottom - 0.5 && r.bottom <= vh && r.bottom <= fr.bottom + 0.5 && r.height >= 40; }) && fr.bottom <= vh && last <= bb + 0.5 && b.scrollHeight > b.clientHeight - 1;
    var cells = xs.length; b.scrollTop = 0; return { ok: ok, body: Math.round(br.bottom), foot: Math.round(fr.top), next: [Math.round(nr.top), Math.round(nr.bottom)], btn: bt.map(function (x) { var r = x.getBoundingClientRect(); return Math.round(r.top) + '-' + Math.round(r.bottom); }).join(','), last: Math.round(last), bb: Math.round(bb), vh: vh, cells: cells }; }, sel);
  const rg = await resGeo('.ov.res26');
  A(rg.ok && rg.cells >= 10, 'scenario result with 3 out + rested 가주: board, 「다음」 line and 계속 never overlap, all reachable (' + JSON.stringify(rg) + ')');
  if (process.env.V224) { fs.mkdirSync(process.env.V224, { recursive: true }); await page.screenshot({ path: path.join(process.env.V224, 'result_many.png') }); }
  await L.settle(page, 30000);
  // 2.2.2 들판 무리는 싸우는 유닛 수만큼 불어난다 (2.2.7: 끝이 셋 배 — 세 마리 무리가 아홉까지)
  const pk = await ev(() => { var g = { id: 'g', x: 1, y: 1, L: 5, list: ['wolf', 'wolf', 'bat'] }, n = function (k) { return DS.packOf(g, k).list.length; };
    DS.ui.closeAll(); DS.enterZone('dawn'); var sim = DS.G.sim, z = DS.buildZone('dawn'), u = DS.partySpecs(DS.G.save).length, base = 0, now = 0;
    z.spawns.forEach(function (sp) { base += sp.list.length; }); sim.units.forEach(function (e) { if (e.side === 'enemy' && e.grp) now++; });
    var want = 0; z.spawns.forEach(function (sp) { want += DS.packOf(sp, u).list.length; });
    return { n3: n(3), n6: n(6), n10: n(10), n16: n(16), ek: DS.packOf(g, 16).ek, u: u, base: base, now: now, want: want, kin: DS.mercsOf(DS.G.save, DS.G.save.hero).length }; });
  A(pk.n3 === 3 && pk.n6 > pk.n3 && pk.n10 > pk.n6 && pk.n16 >= pk.n10 && pk.n16 <= 9 && pk.ek < 1, 'field pack size scales with units: 3 mobs → ' + [pk.n3, pk.n6, pk.n10, pk.n16].join(' / ') + ' at 3 / 6 / 10 / 16 units (exp each ×' + pk.ek.toFixed(2) + ')');
  A(pk.now === pk.want && pk.u <= 3 + pk.kin, 'dawn field with ' + pk.u + ' units (3 out + kin ' + pk.kin + '): ' + pk.now + ' mobs (unscaled ' + pk.base + ', packs as DS.packOf says ' + pk.want + ')');      // 2.2.8: 셋이 나가니 무리도 그만큼
  await ev(() => DS.ui.closeAll());
  // 2.2.5 승려(무투가): 기술 줄 · 옛 저장 옮김 · 기 전하기 · 되치기 · 예약 · 필살기 연출(병과마다 · 컷인 · 어둠) · 설정 「효과」
  await L.newGame(page, { cls: 'cle', name: '무투' });
  await L.edit(page, function () { s.opt.cine = 'off'; for (var id = 1; id <= 13; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 10); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 46; b.exp = 0; } }); DS.mercTidy(s); DS.pSync(s); DS.heroUlt(s); DS.ultRevealed(s); });
  await ev(() => { DS.ui.closeAll(); DS.G.quiet = true; DS.enterZone('windy'); DS.G.save.opt.speed = 1; }); await L.sleep(1500); await L.skipStory(page, 3); await ev(() => DS.ui.closeAll());
  await ev(() => { var u = DS.G.sim.units.filter(function (x) { return x.hero; })[0]; DS.select(u.id); }); await L.sleep(400);
  const mb = await ev(() => { var bs = Array.from(document.querySelectorAll('#acts .act[data-sk]')).map(function (b) { return b.dataset.sk + ':' + b.querySelector('b').textContent + ':' + (b.style.getPropertyValue('--k').indexOf('fist') >= 0 ? 'f' : '-'); }); return bs.join(' '); });
  A(/cle_combo:연환권:f/.test(mb) && /cmd_cle:호흡을 맞춰라/.test(mb) && /cle_kick:비연각:f/.test(mb) && /cle_palm:기공장:f/.test(mb), 'monk skill bar: ' + mb);
  if (process.env.V225) { fs.mkdirSync(process.env.V225, { recursive: true }); await page.screenshot({ path: path.join(process.env.V225, 'monk_skillbar.png') }); }
  const mig = await ev(() => {      // 옛 저장: 승려의 옛 필살기 이름(맹주 · 가주) · 가주의 옛 고유 기술
    var raw = JSON.parse(JSON.stringify(DS.G.save)), m = raw.mercs.filter(function (x) { return x.h; })[0];
    raw.chars[raw.hero].ps.ul = 'u_prayer'; if (m) { m.ul = 'u_grove'; m.s = 'heal'; }
    var raw2 = JSON.parse(JSON.stringify(raw)); raw2.chars[raw2.hero].ps.ul = 'u_mercy';
    var s2 = DS.Save.read(JSON.stringify(raw)), s3 = DS.Save.read(JSON.stringify(raw2)), m2 = s2 && s2.mercs.filter(function (x) { return x.h; })[0];
    return { a: s2 && s2.chars[s2.hero].ps.ul, b: s3 && s3.chars[s3.hero].ps.ul, mul: m2 ? m2.ul || '' : 'none', ms: m2 ? m2.s || '' : 'none', sk: DS.charSkills(s2.chars[s2.hero]).join(','), arena: DS.skAlias('u_grove') };
  });
  A(mig.a === 'u_flurry' && mig.b === 'u_stance' && (mig.mul === 'u_palm' || mig.mul === 'none') && mig.arena === 'u_palm' && mig.sk === 'cle_combo,cmd_cle,cle_kick,cle_palm', 'old saves: monk ults map to the new ones (' + [mig.a, mig.b, mig.mul].join(', ') + '), skills ' + mig.sk);
  const mn = await ev(() => {      // 기 전하기 · 되치기 · 예약
    var sim = DS.G.sim, u = sim.units.filter(function (x) { return x.hero; })[0], foe = null, fr = sim.units.filter(function (x) { return x.side === 'ally' && !x.dead && x !== u; })[0];
    DS.G.pause = true; sim.ev.length = 0;
    var D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], spot = null, mv = function (w, x, y) { sim.occ[w.y * sim.w + w.x] = null; w.x = x; w.y = y; sim.occ[y * sim.w + x] = w; };
    foe = sim.units.filter(function (x) { return x.side === 'enemy' && !x.dead && D4.some(function (d) { return sim.pass('foot', x.x + d[0], x.y + d[1]) && !sim.at(x.x + d[0], x.y + d[1]); }); })[0];
    D4.forEach(function (d) { var x = foe.x + d[0], y = foe.y + d[1]; if (!spot && sim.pass(u.mt, x, y) && !sim.at(x, y)) spot = [x, y]; });
    mv(u, spot[0], spot[1]);      // 맹주를 적 바로 곁으로
    foe.hp = foe.mhp = 99999;      // 연환권에 쓰러지지 않게 (되치기를 볼 상대)
    fr.hp = Math.round(fr.mhp * 0.3); var fh = fr.hp, near = null;
    for (var dx = -3; dx <= 3 && !near; dx++) for (var dy = -3; dy <= 3 && !near; dy++) { var x2 = u.x + dx, y2 = u.y + dy, dd = Math.abs(dx) + Math.abs(dy); if (dd >= 2 && dd <= 3 && sim.pass(fr.mt, x2, y2) && !sim.at(x2, y2)) near = [x2, y2]; }
    if (near) mv(fr, near[0], near[1]);      // 다친 아군을 3칸 안으로
    sim.units.forEach(function (x) { if (x.side === 'ally' && x !== fr && !x.dead) x.hp = x.mhp; });
    u.gauge = 100; u.mp = u.mmp; u.cd = {};
    var ok = sim.cast(u, 'cle_combo', foe), mend = sim.ev.some(function (e) { return e.t === 'mend' && e.tid === fr.id; }), healed = fr.hp > fh;
    var fhp = foe.hp; u.buffs.ctr = { p: 90, t: 10 }; sim.hurt(u, 3, foe, {}); var ctr = sim.ev.some(function (e) { return e.t === 'ctr' && e.tid === foe.id; }), back = fhp - foe.hp;
    u.mp = 0; var never = sim.rsvNever(u, 'cle_palm'); sim.reserve(u.id, 'cle_palm'); var rsv = u.rsv; sim.reserve(u.id, null);
    DS.G.pause = false;
    return { ok: ok, mend: mend, healed: healed, ctr: ctr, back: back, never: never, rsv: rsv, dbg: [u.x, u.y, foe.x, foe.y, !!spot, foe.dead, foe.side, JSON.stringify(u.buffs)].join(' ') };
  });
  A(mn.ok && mn.mend && mn.healed, '연환권 hits and sends chi to the most hurt ally (healed)');
  A(mn.ctr && mn.back > 0, '부동심 counter: an adjacent attacker is struck back (' + mn.back + ') ' + (mn.ctr && mn.back > 0 ? '' : mn.dbg));
  A(mn.never === '' && mn.rsv === 'cle_palm', 'monk skills can be reserved (2.2.3) while out of mana');
  // 필살기 연출: 병과마다 하나씩 — 컷인(얼굴 · 이름) · 어둠 · 병과 빛깔, 오류 없이 · 배속이 빠르면 컷인이 짧다
  const ucl = ['inf', 'cav', 'fly', 'mar', 'pike', 'arc', 'cle', 'mon', 'mag', 'sha'], seen = [];
  for (const c of ucl) {
    const r = await ev((c) => { var sim = DS.G.sim, u = sim.units.filter(function (x) { return x.hero; })[0], id = Object.keys(DS.ULTS).filter(function (k) { return DS.ULTS[k].cls === c; })[0], S = DS.SKILLS[id];
      DS.G.view.ultBlast({ tiles: [[u.x + 1, u.y], [u.x + 2, u.y]], from: [u.x, u.y] }, S, u); DS.ultCut(u, S);
      var el = document.getElementById('ultcut'); return { id: id, on: !!(el && el.classList.contains('on')), nm: el ? el.querySelector('.ucn b').textContent : '', face: !!(el && el.querySelector('.ucp canvas')), ud: el ? el.style.getPropertyValue('--ud') : '', k: el ? el.dataset.k : '', dim: !!DS.G.view.ultDim }; }, c);
    seen.push(r.k);
    A(r.on && r.nm === await ev((id) => DS.SKILLS[id].name, r.id) && r.face && r.dim && r.k === c, 'ultimate ' + c + ' 「' + r.nm + '」: cut-in with portrait (' + r.ud + '), screen dim');
    if (process.env.V225 && ['inf', 'cle', 'mag', 'arc', 'sha'].indexOf(c) >= 0) { await L.sleep(170); await page.screenshot({ path: path.join(process.env.V225, 'ult_cutin_' + c + '.png') }); }
    await L.sleep(950);
    A(await ev(() => !document.querySelector('#ultcut.on')), 'ultimate ' + c + ': cut-in gone within 1 s');
  }
  const fast = await ev(() => { var u = DS.G.sim.units.filter(function (x) { return x.hero; })[0]; DS.G.save.opt.speed = 2; DS.ultCut(u, DS.SKILLS[u.ult]); var v = document.getElementById('ultcut').style.getPropertyValue('--ud'); DS.G.save.opt.speed = 1; return parseInt(v); });
  A(fast >= 550 && fast <= 700, 'at 2× speed the cut-in is short (' + fast + 'ms)');
  // 설정 「효과」: 보통 · 가볍게
  await ev(() => { DS.ui.closeAll(); DS.openMenu('opt'); }); await L.sleep(400);
  const fq = await ev(() => document.querySelectorAll('.ov [data-fxq]').length);
  await page.click('.ov [data-fxq="lite"]'); await L.sleep(250);
  const fq2 = await ev(() => ({ o: DS.G.save.opt.fxq, lite: DS.fxLite() }));
  await page.click('.ov [data-fxq="full"]'); await L.sleep(250);
  A(fq === 2 && fq2.o === 'lite' && fq2.lite && !DS_fx(await ev(() => DS.G.save.opt.fxq)), 'settings: 효과 보통 / 가볍게');
  await ev(() => DS.ui.closeAll());
  // 2.2.6 모든 병과의 새 기술: ① 병과마다 모든 기술 · 필살기를 진짜 판(그림 · 소리 · 컷인)에서 한 번씩 — 오류 없이, 효과가 난다 ② 옛 저장 · 연무장 기록 옮김 (병과마다) ③ 새 기술의 예약
  await ev(() => { DS.ui.closeAll(); DS.G.quiet = true; DS.G.save.opt.speed = 1; if (DS.G.sim && DS.G.sim.result) DS.enterZone('windy'); }); await L.sleep(600); await L.skipStory(page, 2); await ev(() => DS.ui.closeAll());
  const CL = await ev(() => Object.keys(DS.CLASSES));
  let nCast = 0, nUlt = 0, nUx = 0;
  for (const c of CL) {
    let r;
    for (let tr = 0; tr < 3; tr++) {      // 2.3.1: 판의 땅과 무리가 매번 달라 (돌파 뒤 연쇄가 튈 적이 곁에 없는 등) 어긋나면 다시 세워 본다 — 세 번 모두 어긋나야 실패
    r = await ev((c) => {
      var sim = DS.G.sim, SK = DS.SKILLS, C = DS.CLASSES[c], u = sim.units.filter(function (x) { return x.hero && !x.dead; })[0], out = [], D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      if (!u) return { err: 'no hero' };
      DS.G.pause = true;
      var mv = function (w, x, y) { sim.occ[w.y * sim.w + w.x] = null; w.x = x; w.y = y; sim.occ[y * sim.w + x] = w; };
      var spot = function (cx, cy, rmin, rmax, mt) { for (var r = rmin; r <= rmax; r++) for (var dx = -r; dx <= r; dx++) { var dy = r - Math.abs(dx); for (var sg = -1; sg <= 1; sg += 2) { var x = cx + dx, y = cy + dy * sg; if (sim.pass(mt || 'foot', x, y) && !sim.at(x, y)) return [x, y]; } } return null; };
      var ch = { cls: c, L: 95, id: 999 }; DS.stdGear(ch, 10); var st = DS.charStats(ch);
      var ids = C.skills.map(function (s) { return s[0]; }).concat(Object.keys(DS.ULTS).filter(function (k) { return DS.ULTS[k].cls === c; })).concat(C.rise ? Object.keys(DS.ULTX).filter(function (k) { return DS.ULTX[k].up === C.rise; }) : []);      // 2.2.9: 윗길은 고유 기술 · 바뀐 기술 · 윗길 필살기 셋
      ids.forEach(function (id) {
        var S = SK[id]; if (!S) { out.push(id + ':missing'); return; }
        sim.units.forEach(function (x) { if (x.side === 'enemy' && !x.dead && x.summoned) sim.kill(x); });
        var open = function (cx, cy) { for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) { if (Math.abs(dx) + Math.abs(dy) > 2) continue; var x = cx + dx, y = cy + dy, o = sim.at(x, y); if (!sim.pass('foot', x, y) || (o && o !== u && o.side === 'ally')) return false; } return true; };
        if (!open(u.x, u.y)) { var op = null; for (var ro = 1; ro <= 12 && !op; ro++) for (var ox = -ro; ox <= ro && !op; ox++) for (var os = -1; os <= 1 && !op; os += 2) { var qx = u.x + ox, qy = u.y + (ro - Math.abs(ox)) * os; if (sim.pass(u.mt, qx, qy) && !sim.at(qx, qy) && open(qx, qy)) op = [qx, qy]; } if (op) mv(u, op[0], op[1]); }      // 둘레 2칸이 트인 자리에서 (지형이 판마다 달라도)
        u.cls = c; u.mt = C.mt; u.rng = C.rng.slice(); u.atk = st.atk; u.mag = st.mag; u.def = st.def; u.res = st.res; u.mhp = u.hp = st.hp; u.mmp = u.mp = 999; u.gauge = 100; u.cd = {}; u.dead = false; u.casting = null; u.order = null;
        u.skills = C.skills.map(function (s) { return s[0]; }); u.ult = S.ult ? id : u.ult; u.uc = 100; u.buffs = {}; u.st = {};
        var fs = sim.units.filter(function (x) { return x.side === 'enemy' && !x.dead; });
        while (fs.length < 4) { var p0 = spot(u.x, u.y, 2, 6); if (!p0) break; var e = DS.enemySpec('goblin', 60, { x: p0[0], y: p0[1] }); var nu = sim.add(e); if (!nu) break; nu.aggro = true; fs.push(nu); }
        fs.forEach(function (f, i) { f.hp = f.mhp = 999999; f.aggro = true; f.st = {}; f.buffs = {}; var p1 = i === 0 ? spot(u.x, u.y, 1, 1) : i === 1 ? spot(u.x, u.y, 2, 3) : spot(u.x, u.y, 1, 2); if (p1) mv(f, p1[0], p1[1]); });
        var near = fs.filter(function (f) { return Math.abs(f.x - u.x) + Math.abs(f.y - u.y) === 1; })[0] || fs[0], far = fs.filter(function (f) { var d = Math.abs(f.x - u.x) + Math.abs(f.y - u.y); return d >= 2 && d <= 3; })[0] || fs[1];
        var al = sim.units.filter(function (x) { return x.side === 'ally' && !x.dead && x !== u && x.role === 'cmd'; })[0];
        if (al) { var pa = spot(u.x, u.y, 1, 2); if (pa) mv(al, pa[0], pa[1]); al.hp = Math.round(al.mhp * 0.4); al.buffs = {}; }
        var tgt = null;
        if (S.tg === 'enemy') tgt = S.rng && S.rng[0] >= 2 ? far : near; else if (S.tg === 'ally') { tgt = al || u; var fa = fs[2] || far, pa2 = spot(tgt.x, tgt.y, 1, 1); if (fa && pa2 && Math.abs(fa.x - tgt.x) + Math.abs(fa.y - tgt.y) > 1) mv(fa, pa2[0], pa2[1]); }      // 대상 곁에도 적 하나 (수호의 도발) else if (S.tg === 'tile') tgt = { x: far.x, y: far.y }; else if (S.tg === 'dir') tgt = { x: u.x + Math.sign(near.x - u.x), y: u.y + Math.sign(near.y - u.y) };
        if (S.tg === 'dir') {      // 직선: 땅이 가장 길게 이어지는 쪽 — 첫 칸에 적을 세운다 (돌파가 달려 나갈 빈칸이 남게)
          if (S.dash) {      // 돌파: 직선 칸이 모두 비어 있는 자리로 옮겨 선다 (지형이 판마다 달라도 달려 나갈 곳이 있게)
            var found = null;
            for (var rr2 = 0; rr2 <= 8 && !found; rr2++) for (var ddx = -rr2; ddx <= rr2 && !found; ddx++) for (var sg2 = -1; sg2 <= 1 && !found; sg2 += 2) {
              var cx = u.x + ddx, cy = u.y + (rr2 - Math.abs(ddx)) * sg2; if (!(cx === u.x && cy === u.y) && (!sim.pass(u.mt, cx, cy) || sim.at(cx, cy))) continue;
              D4.forEach(function (d) { if (found) return; for (var i = 1; i <= S.len; i++) { var x = cx + d[0] * i, y = cy + d[1] * i; if (!sim.pass(u.mt, x, y) || (sim.at(x, y) && sim.at(x, y) !== near)) return; } found = [cx, cy]; });
            }
            if (found && (found[0] !== u.x || found[1] !== u.y)) mv(u, found[0], found[1]);
          }
          var bd = null, bn = -1; D4.forEach(function (d) { var n = 0; for (var i = 1; i <= S.len; i++) { var x = u.x + d[0] * i, y = u.y + d[1] * i; if (!sim.pass(u.mt, x, y)) break; var o = sim.at(x, y); if (o && o.side === 'ally') break; n++; } if (n > bn) { bn = n; bd = d; } });
          var t1 = [u.x + bd[0], u.y + bd[1]], o1 = sim.at(t1[0], t1[1]);
          if (o1 !== near && !o1) mv(near, t1[0], t1[1]);
          for (var i2 = 2; i2 <= S.len; i2++) { var o2 = sim.at(u.x + bd[0] * i2, u.y + bd[1] * i2); if (o2 && o2.side === 'enemy') { var pf = null; for (var rr = 3; rr <= 8 && !pf; rr++) { var cand = spot(u.x - bd[0] * rr, u.y - bd[1] * rr, 0, 2); if (cand) pf = cand; } if (pf) mv(o2, pf[0], pf[1]); } }      // 첫 칸 뒤는 비워 둔다 (돌파가 설 자리)
          tgt = { x: t1[0], y: t1[1] };
        }
        sim.ev.length = 0;
        var ok = false; try { ok = sim.cast(u, id, tgt); if (sim.seqFlush) sim.seqFlush(); } catch (x) { out.push(id + ':THROW ' + x.message); return; }      // 2.7: 여러 박자 · 예고 낙하로 풀리는 기술은 걸린 박자를 바로 모두 푼다 (효과가 났는지는 그 뒤에 본다)
        var ev = sim.ev.slice(), has = function (t) { return ev.some(function (e) { return e.t === t; }); }, want = [];
        S.eff.forEach(function (e) { var w = e.t === 'dmg' ? 'hit' : e.t === 'buff' ? 'buff' : e.t === 'status' ? 'status' : e.t === 'taunt' ? 'taunt' : e.t === 'summon' ? 'spawn' : e.t === 'heal' ? null : e.t === 'pull' || e.t === 'knock' ? 'knock' : e.t === 'chain' ? 'chain' : e.t === 'ward' || e.t === 'mend' ? null : null; if (w && want.indexOf(w) < 0) want.push(w); });
        if (S.dash || S.leap || S.back) want.push('leap');
        var miss = want.filter(function (w) { return !has(w) && !(w === 'leap' && S.back && !S.leap && !S.dash) && !(w === 'spawn' && has('skill')) && !(w === 'chain' && fs.length < 2) && !(w === 'knock' && !has('hit')); });
        out.push(id + (ok && has('skill') ? '' : ':NOCAST') + (miss.length ? ':miss ' + miss.join('/') : '') + (S.ult ? (has('ult') ? '' : ':NOULT') : ''));
      });
      DS.G.pause = false;
      return { list: out };
    }, c);
    await L.sleep(450);      // 화면이 기술 · 필살기 연출을 그린다 (오류가 나면 shot.js 가 잡는다)
    if (!r.err && !(r.list || []).some(x => /:/.test(x))) break;
    }
    const bad = (r.list || []).filter(x => /:/.test(x));
    nCast += (r.list || []).length; nUlt += (r.list || []).filter(x => /^u_/.test(x)).length; nUx += (r.list || []).filter(x => /^ux_/.test(x)).length;
    A(!r.err && !bad.length, c + ': every skill and ultimate casts with its effect (' + (r.list || []).length + ')' + (bad.length ? ' — ' + bad.join(', ') : '') + (r.err || ''));
  }
  A(nCast >= 150 && nUlt === 30 && nUx === 30, 'all classes: ' + nCast + ' skills and ultimates cast, ' + nUlt + ' ultimates, ' + nUx + ' 8단+ ultimates');
  // 2.3.3: 약초는 겨누지 않는다 — 누르면 고른 이가 바로 먹는다 (가득하면 흔들림만)
  const hb = await ev(async () => {
    var sim = DS.G.sim, u = sim.byId[DS.G.sel]; if (!u) return { none: 1 };
    DS.G.save.items.herb = Math.max(3, DS.G.save.items.herb || 0); u.hp = Math.max(1, Math.round(u.mhp * 0.8)); u.order = null;
    if (DS.renderActs) DS.renderActs();
    var b = document.querySelector('#acts .act[data-it="herb"]'); if (!b) return { nobtn: 1 };
    b.click();
    var o = u.order || {}, aim = !!DS.G.aim;
    u.hp = u.mhp; u.order = null; b.click();
    return { t: o.t, key: o.key, tid: o.tid, me: u.id, aim: aim, aim2: !!DS.G.aim, full: !u.order };
  });
  A(hb.t === 'item' && hb.key === 'herb' && hb.tid === hb.me && !hb.aim && !hb.aim2 && hb.full, 'herb: tap = the selected one drinks at once, no aiming; full HP = no use (' + JSON.stringify(hb) + ')');
  // 2.3.4: 기운초 — +50, 부대가 함께 15초 쉰다 (단추에 남은 초)
  const en = await ev(async () => {
    var sim = DS.G.sim, u = sim.byId[DS.G.sel]; sim.inv.endo = 3; DS.G.save.items.endo = 3; sim.endoT = 0; u.gauge = 10;
    var a = sim.useItem(u, 'endo'), g1 = Math.round(u.gauge), b = sim.useItem(u, 'endo'), n = sim.inv.endo;
    if (DS.renderActs) DS.renderActs(); await new Promise(r => setTimeout(r, 400));
    var btn = document.querySelector('#acts .act[data-it="endo"]'), cd = btn ? (btn.querySelector('.cdn') || {}).textContent || '' : 'nobtn';
    return { a: a, g1: g1, b: b, n: n, cd: cd };
  });
  await shot('endo_cooldown'); await ev(() => { DS.G.sim.endoT = 0; });
  A(en.a && en.g1 === 60 && !en.b && en.n === 2 && (en.cd === 'nobtn' || +en.cd >= 14), 'endo: +50 gauge, then 15 s shared cooldown shown on the button (' + JSON.stringify(en) + ')');
  // 2.2.7 자동 필살기: 조작이 자동인 가주는 게이지가 차고 쓸 자리가 나면 스스로 쓴다 · 수동이면 쓰지 않는다 · 스스로 쓰는 것은 우리 편 전체에서 3초에 하나
  const au = await ev(() => {
    var sim = DS.G.sim, u = sim.units.filter(function (x) { return x.hero && !x.dead; })[0], o = {}; if (!u) return { err: 'no hero' };
    DS.G.pause = true; var ua = DS.BAL.ultAuto; DS.BAL.ultAuto = false;
    var f = sim.units.filter(function (x) { return x.side === 'enemy' && !x.dead; })[0];
    u.ult = 'u_ram'; u.uc = 100; u.gauge = 100; u.casting = null; u.order = null; u.busy = 0; u.hp = u.mhp; u.holdT = 0; u.rsv = u.rsvU = null; u.dodgeT = 0; u.hero && (sim.leader = u.id);      // 약초 · 자리 지키기 · 예약 · 선두 따라가기가 앞서지 않게
    u.fx = u.fx || {}; delete u.fx.seal; sim._ultT = null;
    var D4s = [[1, 0], [-1, 0], [0, 1], [0, -1]], nb = function (x, y) { return D4s.some(function (d) { return sim.pass(f.mt || 'foot', x + d[0], y + d[1]) && !sim.at(x + d[0], y + d[1]); }); };
    if (f && !nb(u.x, u.y)) { var mvU = null; for (var r9 = 1; r9 <= 8 && !mvU; r9++) for (var y9 = u.y - r9; y9 <= u.y + r9 && !mvU; y9++) for (var x9 = u.x - r9; x9 <= u.x + r9 && !mvU; x9++) if (sim.pass(u.mt || 'foot', x9, y9) && !sim.at(x9, y9) && nb(x9, y9)) mvU = [x9, y9]; if (mvU) sim.moveTo(u, mvU[0], mvU[1]); }      // 2.3.0: 곁이 꽉 막힌 자리면 트인 곳으로 옮긴다
    if (f) D4s.some(function (d) { var x = u.x + d[0], y = u.y + d[1], o = sim.at(x, y); if (!sim.pass(f.mt || 'foot', x, y) || o === f) return false; if (!o) return true; if (o.side === 'ally' && o !== u && !o.fw) { var q = sim.freeNear(x, y, o.mt || 'foot', 6); if (q && (q.x !== x || q.y !== y)) { sim.moveTo(o, q.x, q.y); return true; } } return false; });      // 2.3.0: 곁 네 칸이 모두 찼으면 하나를 비운다 (들판 무리가 붐벼 곁에 세우지 못하던 흔들림)
    if (f) { sim.occ[f.y * sim.w + f.x] = null; var p = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(function (d) { return [u.x + d[0], u.y + d[1]]; }).filter(function (q) { return sim.pass(f.mt || 'foot', q[0], q[1]) && !sim.at(q[0], q[1]); })[0]; if (p) { f.x = p[0]; f.y = p[1]; } sim.occ[f.y * sim.w + f.x] = f; f.hp = f.mhp = 999999; f.aggro = true; var fr = f.role; f.role = 'boss'; }      // 보스 한 명이면 쓸 자리(둘 몫)가 된다 — 곁에 다른 적이 우연히 있느냐에 따라 갈리던 것
    u.auto = false; o.manual = sim.ultSelf(u);
    u.auto = true; o.auto = sim.ultSelf(u);
    sim.tele = []; sim.hz = []; if (sim.reDanger) sim.reDanger(); u.st = {}; u.buffs = u.buffs || {}; sim.units.forEach(function (m) { if (m.side === 'ally' && !m.dead) m.hp = m.mhp; });      // 2.3.0: 다친 가문원에게 약초를 먼저 건네지 않게 (들판에 터지는 도깨비가 생겼다)      // 2.2.8: 붉은 칸 피하기 · 상태 이상이 앞서지 않게 (셋이 나가 판의 모양이 달라졌다)
    o.foes = sim.foes(u).length; o.dodge = !!(sim.dz && sim.dz[u.y * sim.w + u.x]);
    o.fd = f ? DS.fpDist(u, f) : -1; o.ft = f ? f.type : ''; o.hold = u.holdT > sim.t; o.cast0 = !!u.casting; o.busy = u.busy; o.rsv = !!(u.rsv || u.rsvU); o.lead = sim.leader === u.id;
    var n0 = u.ultN || 0; sim.aiCmd(u); o.fired = (u.ultN || 0) > n0; o.uc = u.uc; o.cast = u.casting ? u.casting.sk || 1 : 0; o.ord = u.order ? u.order.t : '';
    u.uc = 100; u.gauge = 100; u.busy = 0; o.gap = sim.ultSelf(u);
    if (f) f.role = fr; DS.BAL.ultAuto = ua; DS.G.pause = false; return o;
  });
  A(!au.err && au.manual === false && au.auto === true && au.fired && au.uc < 5 && au.gap === false, 'auto houses fire their own ultimate (manual waits; 3 s gap between self-fired ones) ' + JSON.stringify(au));
  await ev(() => DS.ui.closeAll());
  // ② 옛 저장: 병과마다 옛 필살기 이름(맹주 · 가주), 돌아온 이의 옛 깃발 기술(m.s), 연무장 기록(sk · ul)이 새 것으로
  const mig2 = await ev(() => {
    var A0 = DS.SK_ALIAS, old = {}, out = [], k;
    for (k in A0) { var nk = A0[k], c = DS.ULTS[nk] && DS.ULTS[nk].cls; if (c && !old[c]) old[c] = k; }
    var oldSk = { inf: ['bash', 'attackUp', 'protect'], cav: ['thunder', 'protect', 'attackUp'], fly: ['dive', 'whirl'], mar: ['harpoon', 'tidal'], pike: ['slow', 'pierce', 'protect'], arc: ['aimed', 'arrowRain'], cle: ['heal', 'cure', 'healAll'], mon: ['holy', 'protect', 'quick', 'bless'], mag: ['fire', 'ice', 'blizzard', 'meteor'], sha: ['drain', 'summon', 'curse', 'deathCloud'] };
    Object.keys(oldSk).forEach(function (c) {
      var raw = JSON.parse(JSON.stringify(DS.G.save)), m = raw.mercs.filter(function (x) { return x.h; })[0] || raw.mercs[0];
      raw.chars[raw.hero].ps.ul = old[c] || 'u_prayer';
      if (m) { m.ul = old[c] || 'u_prayer'; m.s = oldSk[c][0]; m.nc = c; m.rv = 1; }
      var s2 = DS.Save.read(JSON.stringify(raw)), m2 = s2 && m ? s2.mercs.filter(function (x) { return x.id === m.id; })[0] : null;
      var ul = s2 && s2.chars[s2.hero].ps.ul, msOk = !m || (m2 && m2.s === DS.SK_OLD[c][oldSk[c][0]]), mulOk = !m || (m2 && (m2.ul == null || DS.ULTS[m2.ul]));
      var row = DS.arenaChampRow('t' + c, { v: 1, cls: c, L: 75, name: 'x', sk: oldSk[c].concat(['cmd_' + c]).join(','), ul: old[c] || '' });
      var arOk = row && row.skills.every(function (id) { return DS.SKILLS[id] && !/^(bash|attackUp|protect|thunder|dive|whirl|harpoon|tidal|slow|pierce|aimed|arrowRain|heal|cure|healAll|holy|quick|bless|fire|ice|blizzard|meteor|drain|summon|curse|deathCloud)$/.test(id); }) && row.skills.length >= 1 && (!old[c] || row.ult === DS.ultUp(A0[old[c]], 75));      // 2.2.9: 8단 위 기록의 필살기는 윗길의 것
      out.push({ c: c, ok: !!(s2 && ul === (A0[old[c]] || 'u_flurry') && DS.ULTS[ul] && DS.ULTS[ul].cls === c && msOk && mulOk && arOk), ul: ul, ms: m2 ? m2.s : '-', ar: row ? row.skills.join('+') + '/' + row.ult : 'null' });
    });
    return out;
  });
  mig2.forEach(function (m) { A(m.ok, 'old save ' + m.c + ': ult → ' + m.ul + ', returned flag skill → ' + m.ms + ', arena → ' + m.ar); });
  // ③ 새 기술의 예약: 마나가 모자라면 예약, 마나가 차면 무엇보다 먼저 쓴다
  const rv = await ev(() => {
    var sim = DS.G.sim, u = sim.units.filter(function (x) { return x.hero && !x.dead; })[0], out = [];
    [['mag', 'mag_meteor'], ['inf', 'inf_wall'], ['mon', 'mon_ward'], ['cav', 'cav_charge']].forEach(function (p) {
      var C = DS.CLASSES[p[0]]; u.cls = p[0]; u.skills = C.skills.map(function (s) { return s[0]; }); u.mt = C.mt; u.rng = C.rng.slice(); u.auto = true; u.order = null; u.casting = null; u.cd = {}; u.buffs = {};
      u.mmp = 99; u.mp = 0; var never = sim.rsvNever(u, p[1]); sim.reserve(u.id, p[1]); var held = u.rsv;
      u.mp = 99; u.gauge = 100; sim.ev.length = 0; var foes = sim.units.filter(function (f) { return f.side === 'enemy' && !f.dead; }); foes.forEach(function (f) { f.aggro = true; });
      var fired = sim.rsvTry(u, sim.foes(u)), cast = sim.ev.some(function (e) { return e.t === 'rsvCast' && e.sk === p[1]; });
      out.push({ sk: p[1], ok: never === '' && held === p[1] && fired && cast && !u.rsv });
    });
    return out;
  });
  rv.forEach(function (r) { A(r.ok, 'reservation works on the new skill ' + r.sk); });
  // ④ 2.2.5 의 판(봇이 26번까지 깬 저장 · tools/fixtures/v225.json — 맹주 · 가주의 옛 필살기, 돌아온 이의 옛 깃발 기술을 넣어 둠): 읽혀서 싸울 수 있다
  const v225 = fs.readFileSync(path.join(__dirname, 'fixtures', 'v225.json'), 'utf8');
  const ld = await ev((raw) => {
    var s2 = DS.Save.read(raw); if (!s2) return { err: 'read null' };
    var bad = [], OLD = /^(bash|attackUp|protect|thunder|dive|whirl|harpoon|tidal|slow|pierce|aimed|arrowRain|holy|quick|bless|fire|ice|blizzard|meteor|drain|summon|curse|deathCloud)$/;
    var hu = s2.chars[s2.hero].ps.ul; if (hu && !DS.ULTS[hu]) bad.push('hero ul ' + hu);
    s2.mercs.forEach(function (m) { if (m.ul && !DS.ULTS[m.ul]) bad.push('m.ul ' + m.ul); if (m.s && (!DS.SKILLS[m.s] || OLD.test(m.s))) bad.push('m.s ' + m.s); });
    DS.G.save = s2; DS.ui.persist(); var specs = DS.partySpecs(s2);
    specs.forEach(function (u) { (u.skills || []).forEach(function (k) { if (!DS.SKILLS[k] || OLD.test(k)) bad.push(u.name + ' ' + k); }); if (u.ult && !DS.ULTS[u.ult] && !(DS.ULTX[u.ult] && u.tier >= 8)) bad.push('ult ' + u.ult); });      // 2.2.9: 8단 위는 윗길 필살기
    var ms = s2.mercs.filter(function (m) { return m.rv && m.s; }).map(function (m) { return m.s; });
    return { bad: bad, n: specs.length, hu: hu, ms: ms.join(',') };
  }, v225);
  A(ld && !ld.err && !ld.bad.length && ld.hu === 'u_bastion', '2.2.5 save loads: ' + (ld.n || 0) + ' units, lord ult → ' + ld.hu + ', returned flag skills → ' + ld.ms + (ld.bad && ld.bad.length ? ' BAD ' + ld.bad.join('; ') : '') + (ld.err || ''));
  await ev(() => { DS.ui.closeAll(); DS.rebuildParty(); DS.G.quiet = true; DS.enterZone('windy'); DS.G.save.opt.speed = 2; }); await L.sleep(1200); await L.skipStory(page, 3);
  await ev(() => { DS.ui.closeAll(); DS.G.sim.hunt = true; DS.G.save.opt.hunt = true; }); await L.sleep(6000);
  const f225 = await ev(() => { var sim = DS.G.sim; return { t: Math.round(sim.t), allies: sim.units.filter(function (u) { return u.side === 'ally' && u.role === 'cmd'; }).length }; });
  A(f225.allies === 3 && f225.t >= 4, '2.2.5 save fights in the field with 3 out (' + f225.allies + ' houses, ' + f225.t + ' s)');
  await ev(() => { DS.G.sim.hunt = false; DS.G.save.opt.hunt = false; DS.ui.closeAll(); });
  const notes = await ev(() => DS.NOTES[0].ver + ' ' + DS.NOTES[0].title + ' / ' + DS.VERSION + ' / ' + DS.BUILD);
  A(/^2\.7\.0 [^/]+ \/ 2\.7\.0 \/ 7\.5\.0$/.test(notes), 'version ' + notes);
  console.log('smoke done');
};
