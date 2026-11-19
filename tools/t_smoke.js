// 연기 시험: 새로 시작 → 들판 싸움 → 시나리오 1 → 메뉴 탭과 창을 모두 연다. 오류가 없고 화면에 NaN·undefined 가 없어야 한다.
//   H=844 OUT=qa_out/smoke node tools/shot.js tools/t_smoke.js   (웹 판: TARGET=web node build.js 뒤 PAGE=/home/user/dist/web/index.html 을 붙인다)
//   2.2.3: 기술 예약(마나 모자람 → 예약 · 다시 누르면 취소 · 마나가 차면 가장 먼저 · 판이 끝나면 거둠 · 쓸 수 있으면 바로) · V223=폴더 면 예약 단추 화면을 그 폴더에
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
  const sc = await ev(() => { var ids = Object.keys(DS.G.chipEls), want = DS.partySpecs(DS.G.save).length; var last = ids[ids.length - 1]; DS.G.chipEls[last].el.click(); return { want: want, have: DS.G.sim.units.filter(u => u.side === 'ally' && !u.dead).length, chips: ids.length, sel: DS.G.sel === last, ult: !!document.querySelector('#acts .act.ult'), swipe: document.querySelector('#chips').classList.contains('swipe'), docW: document.documentElement.scrollWidth }; });
  A(sc.have === sc.want && sc.want >= 12, 'scenario with ' + sc.want + ' allies: all placed (' + sc.have + ')');
  A(sc.sel && sc.ult, 'chip selection works and ult slot shown');
  A(sc.swipe && sc.docW <= 390, 'swipe chip row, no horizontal page scroll (' + sc.docW + ')');
  // 2.2.2 칩 줄: 큰 칩(이름 · 단/Lv) 셋이 보이고 옆으로 민다 · 끌기는 고르기가 아니다 · 고른 칩은 보이는 자리로
  const geo = () => ev(() => { var b = document.querySelector('#chips'), r = b.getBoundingClientRect(), cs = getComputedStyle(b), pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
    var vis = [...b.querySelectorAll('.chip')].filter(c => { var q = c.getBoundingClientRect(); return q.left >= r.left + pl - 1 && q.right <= r.right - pr + 1; });
    return { sl: b.scrollLeft, sw: b.scrollWidth, cw: b.clientWidth, top: r.top + r.height / 2, left: r.left, right: r.right, vis: vis.length, names: vis.every(c => c.querySelector('.cn b') && getComputedStyle(c.querySelector('.cn')).display !== 'none' && c.querySelector('.cn b').offsetWidth > 0), lvs: vis.every(c => /단/.test(c.querySelector('em.lv').textContent)), sel: DS.G.sel, docW: document.documentElement.scrollWidth, fl: b.classList.contains('fl'), fr: b.classList.contains('fr') }; });
  await ev(() => { DS.select(Object.keys(DS.G.chipEls)[0]); }); await L.sleep(700);
  let g0 = await geo();
  A(g0.sw > g0.cw + 100 && g0.vis === 3 && g0.names && g0.lvs, 'chip row: 3 full chips with name and 단/Lv visible, scrolls horizontally (' + g0.cw + ' of ' + g0.sw + ')');
  A(g0.sl < 2 && !g0.fl && g0.fr, 'edge fade only on the side with more chips (fl ' + g0.fl + ', fr ' + g0.fr + ', scrollLeft ' + g0.sl + ', sel ' + g0.sel + ')');
  // 마우스로 끌기: 첫 칩 위에서 눌러 왼쪽으로 끌면 줄이 밀리고, 아무도 고르지 않는다
  const sel0 = g0.sel, x0 = g0.right - 30;
  await page.mouse.move(x0, g0.top); await page.mouse.down(); for (let i = 1; i <= 8; i++) { await page.mouse.move(x0 - i * 22, g0.top); await L.sleep(16); } await page.mouse.up(); await L.sleep(900);
  let g1 = await geo();
  A(g1.sl > 40 && g1.sel === sel0, 'mouse drag scrolls the row (scrollLeft ' + Math.round(g1.sl) + ') and does not select (' + g1.sel + ')');
  A(g1.fl, 'left edge fade after scrolling');
  const snapOk = await ev(() => { var b = document.querySelector('#chips'), c = b.querySelectorAll('.chip'), st = c[1].offsetLeft - c[0].offsetLeft, mx = b.scrollWidth - b.clientWidth; return Math.abs(b.scrollLeft - Math.round(b.scrollLeft / st) * st) < 2 || Math.abs(b.scrollLeft - mx) < 2; });
  A(snapOk, 'row settles on a chip edge after the drag');
  // 칩 하나 안에서 짧게(12px) 끌어도 고르기가 아니다
  const cx = (await ev(() => { var b = document.querySelector('#chips').getBoundingClientRect(); return b.left + b.width / 2; }));
  await page.mouse.move(cx, g0.top); await page.mouse.down(); await page.mouse.move(cx + 6, g0.top); await page.mouse.move(cx + 12, g0.top); await page.mouse.up(); await L.sleep(500);
  A((await ev(() => DS.G.sel)) === sel0, 'a 12px drag inside one chip does not select');
  // 손가락으로 밀기 (CDP 터치): 줄이 밀리고 고르지 않는다
  const cdp = await page.context().newCDPSession(page), tsl = (await geo()).sl;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: g0.top }] });
  for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + i * 20, y: g0.top }] }); await L.sleep(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await L.sleep(900);
  const g2 = await geo();
  A(g2.sel === sel0 && Math.abs(g2.sl - tsl) > 30, 'touch swipe scrolls the row (' + Math.round(tsl) + ' → ' + Math.round(g2.sl) + ') and does not select');
  // 그냥 누르면 고른다
  await page.mouse.click(cx, g0.top); await L.sleep(300);
  A((await ev(() => DS.G.sel)) !== sel0, 'a plain tap still selects');
  // 고른 가문이 바뀌면(지도 · 열쇠 · 저절로) 그 칩이 보이는 자리로
  await ev(() => { DS.select(Object.keys(DS.G.chipEls)[0]); }); await L.sleep(700);
  await ev(() => { var ids = Object.keys(DS.G.chipEls); DS.select(ids[ids.length - 1]); }); await L.sleep(800);
  const inView = await ev(() => { var b = document.querySelector('#chips'), r = b.getBoundingClientRect(), cs = getComputedStyle(b), c = document.querySelector('#chips .chip.sel').getBoundingClientRect(); return { ok: c.left >= r.left + parseFloat(cs.paddingLeft) - 1 && c.right <= r.right - parseFloat(cs.paddingRight) + 1, sl: b.scrollLeft }; });
  A(inView.ok && inView.sl > 0, 'selected chip scrolls into view (scrollLeft ' + Math.round(inView.sl) + ')');
  A((await geo()).docW <= 390, 'no horizontal page scroll after swiping');
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
  const xm = await ev(() => { var xb = document.querySelector('.ov.res26 .xb'); return { done: xb.classList.contains('xdone'), n: xb.querySelectorAll('[data-v0]').length, lord: !!xb.querySelector('.hk.lord'), grid: xb.querySelectorAll('.xb9 .hk').length }; });
  A(xm.n >= 10 && xm.lord && xm.grid >= 8 && !xm.done, 'exp board: lord on top + ' + xm.grid + ' houses below, animating (' + xm.n + ' bars)');
  await ev(() => DS.xbSkip()); await L.sleep(100);
  const xe = await ev(() => { var s = DS.G.save, bad = [], up = 0;
    document.querySelectorAll('.ov.res26 .xb [data-v0]').forEach(el => { var v1 = +el.dataset.v1, f = el.dataset.mx === '1' ? 1 : v1 - Math.floor(v1 + 1e-6), w = parseFloat(el.querySelector('.hkb > u').style.width) / 100, L1 = Math.floor(v1 + 1e-6), t = el.querySelector('.xl').textContent; if (Math.abs(w - f) > 0.01 || t.indexOf('Lv' + DS.lvOfL(L1)) < 0) bad.push([v1, w, t]); if (el.classList.contains('lvd')) up++; });
    var lw = s.chars[s.hero].ps, lf = DS.pL(lw) >= DS.pCap(lw) ? 1 : lw.exp / DS.expNeed(DS.pL(lw)), lu = parseFloat(document.querySelector('.ov.res26 .xb .hk.lord .hkb > u').style.width) / 100;
    return { done: document.querySelector('.ov.res26 .xb').classList.contains('xdone'), bad: bad, up: up, lord: Math.abs(lf - lu) < 0.01, txt: document.querySelector('.ov.res26').innerText.match(/NaN|undefined|\[object/g) }; });
  A(xe.done && !xe.bad.length && xe.lord, 'tap skips to the end: every bar and Lv at its saved value' + (xe.bad.length ? ' ' + JSON.stringify(xe.bad.slice(0, 3)) : ''));
  A(xe.up >= 8 && !xe.txt, 'level-ups marked (' + xe.up + '), no NaN/undefined');
  await shot('res_exp');
  await L.settle(page, 30000);
  // 2.2.2 들판 무리는 싸우는 유닛 수만큼 불어난다
  const pk = await ev(() => { var g = { id: 'g', x: 1, y: 1, L: 5, list: ['wolf', 'wolf', 'bat'] }, n = function (k) { return DS.packOf(g, k).list.length; };
    DS.ui.closeAll(); DS.enterZone('dawn'); var sim = DS.G.sim, z = DS.buildZone('dawn'), u = DS.partySpecs(DS.G.save).length, base = 0, now = 0;
    z.spawns.forEach(function (sp) { base += sp.list.length; }); sim.units.forEach(function (e) { if (e.side === 'enemy' && e.grp) now++; });
    return { n3: n(3), n6: n(6), n10: n(10), n16: n(16), ek: DS.packOf(g, 16).ek, u: u, base: base, now: now }; });
  A(pk.n3 === 3 && pk.n6 > pk.n3 && pk.n10 > pk.n6 && pk.n16 >= pk.n10 && pk.n16 <= 8 && pk.ek < 1, 'field pack size scales with units: 3 mobs → ' + [pk.n3, pk.n6, pk.n10, pk.n16].join(' / ') + ' at 3 / 6 / 10 / 16 units (exp each ×' + pk.ek.toFixed(2) + ')');
  A(pk.now > pk.base * 1.5, 'dawn field with ' + pk.u + ' units: ' + pk.now + ' mobs (unscaled ' + pk.base + ')');
  await ev(() => DS.ui.closeAll());
  const notes = await ev(() => DS.NOTES[0].ver + ' ' + DS.NOTES[0].title + ' / ' + DS.VERSION + ' / ' + DS.BUILD);
  A(/^2\.2\.3 [^/]+ \/ 2\.2\.3 \/ 7\.0\.3$/.test(notes), 'version ' + notes);
  console.log('smoke done');
};
