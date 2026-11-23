// 2.2.4 사건 연출(DS.cine) 시험: 종류마다 뜨고 · 누르면 닫히고 · 흐름의 다음 손(cb)이 불린다 · 여럿은 차례로 하나씩 · 싸움 중 · 창이 떠 있으면 기다린다 · 다시 켜도 남는다 · 「짧게」 · 「끔」
//   2.2.5: 읽을 것이 있는 종류는 누를 때까지 (저절로 닫히지 않는다) · 가벼운 종류는 5~6초 · 뜬 뒤 0.7초는 눌러도 닫히지 않는다 · 「짧게」는 모두 3.5초 남짓 · 움직임 줄이기
//   H=844 OUT=qa_out/cine node tools/shot.js tools/t_cine.js   (V224=폴더 면 종류마다 화면을 그 폴더에 cine_<종류>.png)
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), V = process.env.V224;
  const vshot = async (n) => { if (V) { fs.mkdirSync(V, { recursive: true }); await page.screenshot({ path: path.join(V, n) }); } };
  await L.newGame(page, { cls: 'cle', name: '연출' });
  await L.edit(page, function () { s.gold = 500000; for (var id = 1; id <= 13; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 6); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 40; b.exp = 0; } }); s.opt.cine = 'full'; DS.mercTidy(s); DS.pSync(s); });
  await L.closeAll(page);
  // 얼굴 재료: 맹주 · 가주 몇 사람의 모습 (화면 그대로)
  await ev(() => { var s = DS.G.save, U = DS.ui, cs = DS.charList(s); window.__por = cs.slice(0, 3).map(function (c) { return U.charSpr(c, 4); }); window.__log = []; });
  const show = async (k, extra) => {
    await ev(([k, x]) => { var p = window.__por, e = Object.assign({ k: k, title: k + ' 제목', sub: '한 줄', por: k === 'wed' ? [p[0], p[1]] : k === 'birth' ? [p[2], p[0], p[1]] : [p[1]] }, x || {}); if (k === 'open') { e.crest = DS.houseCrest('mon', 52); e.fc = DS.FLAG.mon; } if (k === 'succ') e.old = p[2]; DS.cine(e, function () { window.__log.push(k); }); }, [k, extra]);
    await L.sleep(1000);
    const st = await ev((k) => { var el = document.querySelector('.cine'); if (!el) return null; var r = el.getBoundingClientRect(), i = DS.cineInfo() || {}, tp = el.querySelector('.ctap'); return { cs: getComputedStyle(el.querySelector('.cbd')).opacity + '/' + getComputedStyle(el).opacity, w: r.width, h: r.height, k: el.className, title: el.querySelector('.crib').textContent, faces: el.querySelectorAll('.cfa').length, drawn: el.querySelectorAll('.cfa canvas, .cfa img').length, full: (function () { var a = (document.getElementById('app') || document.body).getBoundingClientRect(); return Math.abs(r.width - a.width) < 2 && Math.abs(r.height - a.height) < 2; })(), dur: i.dur, hold: i.hold, bar: !!el.querySelector('.cbar'), tap: tp ? tp.textContent : '', tapOn: tp ? +getComputedStyle(tp).opacity : 0 }; }, k);
    return st;
  };
  const KINDS = { wed: [2, '혼인'], birth: [3, '출생'], adult: [1, '성년'], death: [1, '이별'], succ: [2, '잇다'], open: [1, '새 가문'], rank: [1, '공훈'], ticket: [0, '모집권'], pit: [1, '갱도'] };
  const HOLD = { wed: 1, birth: 1, death: 1, succ: 1, open: 1 };      // 2.2.5: 누를 때까지 기다리는 종류
  for (const k of Object.keys(KINDS)) {
    const st = await show(k);
    if (!(st && st.drawn >= Math.min(1, KINDS[k][0]) && st.full)) console.log('DBG ' + JSON.stringify(st));
    A(st && st.k.indexOf('ck-' + k) >= 0 && st.title === k + ' 제목' && st.faces >= KINDS[k][0] && st.drawn >= Math.min(1, KINDS[k][0]) && st.full, 'cinematic ' + k + ': shows full-screen with ' + (st && st.faces) + ' portrait(s) (' + (st && st.dur) + 'ms)');
    A(st.hold === !!HOLD[k] && st.bar === !HOLD[k] && (HOLD[k] || (st.dur >= 5000 && st.dur <= 6500)) && st.tap === '누르면 닫힌다' && st.tapOn > 0.4, 'cinematic ' + k + ': ' + (HOLD[k] ? 'waits for a tap (no bar)' : 'closes by itself after ' + st.dur + 'ms (bar)') + ', hint 「' + st.tap + '」 visible');
    await vshot('cine_' + k + '.png'); await shot('cine_' + k);
    await page.mouse.click(195, 700); await L.sleep(350);
    const gone = await ev((k) => ({ gone: !document.querySelector('.cine'), log: window.__log.slice(-1)[0] }), k);
    A(gone.gone && gone.log === k, 'cinematic ' + k + ': tap dismisses and the flow continues');
  }
  // 2.2.5: 가벼운 것은 그냥 두면 5~6초 뒤에 저절로 닫힌다 (3초에는 아직 떠 있다)
  await ev(() => { DS.cine({ k: 'rank', title: '저절로', por: window.__por.slice(0, 1) }, function () { window.__log.push('auto'); }); });
  await L.sleep(3200);
  A(await ev(() => !!document.querySelector('.cine') && window.__log.slice(-1)[0] !== 'auto'), 'a light cinematic is still up after 3 s');
  await L.sleep(3600);
  A(await ev(() => !document.querySelector('.cine') && window.__log.slice(-1)[0] === 'auto'), 'and closes by itself before 7 s');
  // 2.2.5: 읽을 것이 있는 것(가문이 열리다)은 저절로 닫히지 않는다 · 뜨자마자 누른 손은 받지 않는다 · 0.7초 뒤의 누름은 닫는다
  await ev(() => { DS.cine({ k: 'open', title: '기다린다', sub: '가주 아무개', say: '가훈 한마디', por: window.__por.slice(0, 1), crest: DS.houseCrest('mon', 52) }, function () { window.__log.push('open-wait'); }); });
  await L.sleep(120); await page.mouse.click(195, 700); await L.sleep(200);
  A(await ev(() => !!document.querySelector('.cine.ck-open')), 'tap guard: a tap right after it appears does not close it');
  await L.sleep(7600);
  A(await ev(() => !!document.querySelector('.cine.ck-open.hold') && window.__log.slice(-1)[0] !== 'open-wait'), 'house-open cinematic stays up after 8 s while being read');
  await page.mouse.click(195, 700); await L.sleep(350);
  A(await ev(() => !document.querySelector('.cine') && window.__log.slice(-1)[0] === 'open-wait'), 'and a tap closes it');
  // 한마디가 붙으면 가벼운 종류도 기다린다
  await ev(() => { DS.cine({ k: 'rank', title: '한마디', say: '이제부터다', por: window.__por.slice(0, 1) }); }); await L.sleep(900);
  A(await ev(() => { var i = DS.cineInfo(); return !!(i && i.hold); }), 'any cinematic with a quote waits for a tap');
  await ev(() => DS.cineSkip()); await L.sleep(300);
  // 움직임 줄이기: 움직이지 않고, 안내는 바로 보이고, 기다리는 것은 그대로 기다린다
  await ev(() => { DS.gfxOpt = DS.gfxOpt || {}; window.__calm0 = DS.gfxOpt.calm; DS.gfxOpt.calm = true; DS.cine({ k: 'wed', title: '조용히', por: window.__por.slice(0, 2) }); }); await L.sleep(400);
  const rm = await ev(() => { var el = document.querySelector('.cine'), i = DS.cineInfo(); return el ? { calm: el.classList.contains('calm'), hold: i && i.hold, tap: +getComputedStyle(el.querySelector('.ctap')).opacity, anim: getComputedStyle(el.querySelector('.cfa')).animationName } : null; });
  A(rm && rm.calm && rm.hold && rm.tap > 0.9 && rm.anim === 'none', 'reduced motion: no animation, hint shown at once, still waits for a tap');
  await ev(() => { DS.cineSkip(); DS.gfxOpt.calm = window.__calm0; }); await L.sleep(300);
  // 여럿은 차례로 하나씩: 창이 떠 있는 동안 한가할 때의 연출 셋을 쌓으면 기다린다 → 창을 닫으면 넣은 차례로
  await ev(() => { DS.openNotes(); ['rank', 'ticket', 'pit'].forEach(function (k, i) { DS.cine({ k: k, title: '차례 ' + (i + 1), por: window.__por.slice(0, 1) }); }); });
  await L.sleep(1500);
  let q = await ev(() => ({ on: !!document.querySelector('.cine'), q: DS.cineQ(), saved: (DS.G.save.cineQ || []).length }));
  A(!q.on && q.q.join() === 'rank,ticket,pit' && q.saved === 3, 'queued while a window is open: nothing plays, 3 waiting (and kept in the save)');
  await ev(() => DS.ui.closeAll());
  const order = [];
  for (let i = 0; i < 3; i++) {
    for (let t = 0; t < 20 && !(await ev(() => !!document.querySelector('.cine'))); t++) await L.sleep(150);
    const t1 = await ev(() => { var els = document.querySelectorAll('.cine'); return { n: els.length, t: els.length ? els[0].querySelector('.crib').textContent : '' }; });
    order.push(t1.t + (t1.n > 1 ? '(stacked)' : ''));
    await ev(() => DS.cineSkip()); await L.sleep(250);
  }
  A(order.join(' / ') === '차례 1 / 차례 2 / 차례 3', 'queued cinematics play one after another, never stacked: ' + order.join(' / '));
  A(await ev(() => !DS.G.save.cineQ && !DS.cineQ().length), 'queue empty after playing');
  // 싸움 중에는 기다린다 → 싸움이 끝나고 결과 창을 닫으면
  await ev(() => { DS.G.quiet = true; DS.G.pause = true; DS.startScenario(DS.scn(3)); }); await L.sleep(800); await L.skipStory(page, 5);
  await ev(() => { DS.cine({ k: 'rank', title: '싸움 뒤', por: window.__por.slice(0, 1) }); });
  await L.sleep(1500);
  A(await ev(() => !document.querySelector('.cine') && DS.cineQ().length === 1), 'during a scenario battle the cinematic waits');
  await ev(() => { DS.G.pause = false; DS.G.sim.win(); });
  for (let i = 0; i < 40 && !(await ev(() => !!document.querySelector('.ov.res26'))); i++) { await L.sleep(200); await L.skipStory(page, 1); }
  A(await ev(() => !document.querySelector('.cine')), 'still waiting while the result window is open');
  await L.settle(page, 20000);
  for (let t = 0; t < 30 && !(await ev(() => !!document.querySelector('.cine'))); t++) await L.sleep(200);
  const after = await ev(() => { var el = document.querySelector('.cine'); return el ? el.querySelector('.crib').textContent : ''; });
  A(after.length > 0, 'after the battle and its windows the queued cinematic plays (' + after + ')');
  for (let i = 0; i < 6 && (await ev(() => !!document.querySelector('.cine'))); i++) { await ev(() => DS.cineSkip()); await L.sleep(250); }
  // 다시 켜도 남는다: 창이 떠 있을 때 쌓고 저장 → 다시 불러오면 뜬다
  await ev(() => { DS.openNotes(); DS.cine({ k: 'ticket', title: '다시 켜도', por: [] }); DS.ui.persist(); });
  await L.sleep(400);
  await page.reload(); await page.waitForSelector('#btnCont', { timeout: 30000 }); await page.click('#btnCont'); await L.sleep(1500); await L.skipStory(page, 5);
  for (let t = 0; t < 30 && !(await ev(() => !!document.querySelector('.cine'))); t++) { await L.sleep(250); await ev(() => { var o = document.querySelector('.ov'); if (o && !o.classList.contains('story')) DS.ui.closeAll(); }); }
  const re = await ev(() => { var el = document.querySelector('.cine'); return el ? el.querySelector('.crib').textContent : ''; });
  A(re === '다시 켜도', 'a queued cinematic survives a reload (' + re + ')');
  await ev(() => DS.cineSkip()); await L.sleep(300);
  await ev(() => { var s = DS.G.save, U = DS.ui; window.__por = DS.charList(s).slice(0, 3).map(function (c) { return U.charSpr(c, 4); }); window.__log = []; });      // 다시 불러온 페이지
  // 「짧게」는 짧고 · 「끔」이면 뜨지 않고 흐름은 이어진다
  await ev(() => { DS.G.save.opt.cine = 'short'; });
  const sh = await show('rank');
  A(sh && sh.dur >= 3400 && sh.dur <= 4300 && !sh.hold, 'setting 「짧게」 shortens it (' + (sh && sh.dur) + 'ms)');
  await ev(() => DS.cineSkip()); await L.sleep(300);
  const sh2 = await show('open');
  A(sh2 && !sh2.hold && sh2.bar && sh2.dur >= 3400 && sh2.dur <= 4300, 'setting 「짧게」 closes even reading kinds by itself (' + (sh2 && sh2.dur) + 'ms)');
  await L.sleep(sh2.dur - 1000 + 700);
  A(await ev(() => !document.querySelector('.cine')), '「짧게」: the house-open cinematic is gone after about 3.5 s');
  await ev(() => { DS.G.save.opt.cine = 'off'; window.__log = []; DS.cine({ k: 'wed', title: '끔' }, function () { window.__log.push('off'); }); DS.cine({ k: 'rank', title: '끔2' }); });
  await L.sleep(500);
  A(await ev(() => !document.querySelector('.cine') && window.__log[0] === 'off' && !DS.cineQ().length), 'setting 「끔」: nothing shows, the flow goes on at once');
  // 설정 탭에 「사건 연출」 고르기
  await ev(() => { DS.ui.closeAll(); DS.openMenu('opt'); }); await L.sleep(400);
  const op = await ev(() => { var b = document.querySelectorAll('.ov [data-cine]'); return { n: b.length, on: (document.querySelector('.ov [data-cine][aria-pressed="true"]') || {}).dataset }; });
  A(op.n === 3 && op.on && op.on.cine === 'off', 'settings: 사건 연출 보통 / 짧게 / 끔');
  await page.click('.ov [data-cine="full"]'); await L.sleep(200);
  A(await ev(() => DS.G.save.opt.cine === 'full'), 'settings switch back to 보통');
  // 진짜 흐름: 출생 창 앞의 연출 · 막사에서 가주를 잇는 연출
  await ev(() => { DS.ui.closeAll(); var s = DS.G.save, h = s.chars[s.hero], P = s.lin.P, hp = P[h.pid];
    var m = DS.addMerc(s, 'm_sister', 3, s.hero); m.kn = 1; m.L = 3; m.n = '새싹'; var p = DS.linMkP(s, { k: 'm', sn: s.lin.sur, n: '새싹', sx: 'f', gen: hp.gen + 1, pa: [hp.id], type: m.type, g: 3, m: m.id, gv: 1, hb: 1 }); m.pid = p.id;
    window.__bp = p.id; DS.showBirth(p.id, function () { window.__born = 1; }); });
  await L.sleep(900);
  const bn = await ev(() => ({ cine: !!document.querySelector('.cine.ck-birth'), win: !!document.querySelector('.ov .lgev.birth'), t: (document.querySelector('.cine .crib') || {}).textContent, sub: (document.querySelector('.cine .csub') || {}).textContent || '' }));
  A(bn.cine && !bn.win && /태어났다/.test(bn.t) && /의 아이\. 선대 단톡방이 잠깐 순해졌다/.test(bn.sub), 'birth: the cinematic comes first (' + bn.t + ' — ' + bn.sub + ')');
  await ev(() => DS.cineSkip()); await L.sleep(500);
  A(await ev(() => !!document.querySelector('.ov .lgev.birth')), 'birth: then the birth window with the details');
  await L.closeAll(page);
  await ev(() => { var s = DS.G.save, ch = DS.charList(s).filter(function (c) { return c.id !== s.hero; })[0], b = DS.bearer(s, ch); var m = DS.addMerc(s, b.type, 4, 0); m.sb = 1; m.nc = DS.houseCls ? DS.houseCls(ch) : ch.cls; m.L = 33; m.n = '이음'; DS.loseMerc(s, b.id); DS.mercTidy(s); DS.bnNote(DS.sbTick(s)); });
  for (let t = 0; t < 20 && !(await ev(() => !!document.querySelector('.cine'))); t++) await L.sleep(200);
  const sb = await ev(() => { var el = document.querySelector('.cine'); return el ? { k: el.className, t: el.querySelector('.crib').textContent, sub: (el.querySelector('.csub') || {}).textContent || '' } : null; });
  A(sb && /ck-succ/.test(sb.k) && /이음/.test(sb.t) && /막사에서 나와 가문을 이었다\. 인수인계는 단톡방에서 한다/.test(sb.sub), 'seat filled from the 막사 plays the succession cinematic (' + (sb && sb.t) + ' — ' + (sb && sb.sub) + ')');
  await ev(() => DS.cineSkip()); await L.sleep(300);
  const bad = await L.badText(page, 'body'); A(!bad.length, 'no NaN/undefined');
  console.log('cine done');
};
