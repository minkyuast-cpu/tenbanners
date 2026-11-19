// 전민 — 브라우저 시험 도우미 (tools/shot.js 가 시험 모듈에 넘긴다)
'use strict';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const L = module.exports = {};
L.sleep = sleep;
// 이야기 창을 모두 넘긴다 (건너뛰기 단추가 있으면 그것, 없으면 끝까지 누른다)
L.skipStory = async function (page, max) {
  for (let i = 0; i < (max || 40); i++) {
    const has = await page.evaluate(() => !!document.querySelector('.ov.story'));
    if (!has) return;
    const sk = await page.$('.ov.story .skip');
    if (sk) await sk.click(); else await page.click('.ov.story', { position: { x: 195, y: 400 } }).catch(() => {});
    await sleep(320);
  }
};
// 떠 있는 창을 모두 닫는다 (이야기 → 넘김, 나머지 → closeAll)
L.closeAll = async function (page) {
  await L.skipStory(page);
  await page.evaluate(() => { try { DS.ui.closeAll(); } catch (e) {} });
  await sleep(200);
};
// 새로 시작: #btnNew → 이름 → 병과 → #goNew → 이야기 넘김
L.newGame = async function (page, o) {
  o = o || {};
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload(); await page.waitForSelector('#btnNew', { timeout: 30000 });
  await page.click('#btnNew'); await page.waitForSelector('#cmdName');
  await page.fill('#cmdName', o.name || '시험');
  if (o.cls) await page.click('[data-c="' + o.cls + '"]');
  await page.click('#goNew');
  await sleep(600);
  await page.evaluate(() => { DS.G.quiet = true; });
  await L.skipStory(page);
  await sleep(300);
};
// 저장을 바꾸고 다시 세운다 (마을 · 들판 · 시나리오 밖)
L.edit = async function (page, fn, arg) {
  const r = await page.evaluate(([src, a]) => { const f = new Function('s', 'DS', 'a', src); const out = f(DS.G.save, DS, a); try { DS.rebuildParty(); } catch (e) {} DS.ui.persist(); return out; }, [String(fn).replace(/^[^{]*\{/, '').replace(/\}\s*$/, ''), arg]);
  return r;
};
// 페이지 안에서 값 얻기
L.ev = (page, fn, arg) => page.evaluate(fn, arg);
// 시나리오 하나를 자동으로 싸운다 (전체 자동 켜고, 이길 때까지 · 결과 창과 이야기를 넘긴다). 돌려주는 것: 'win' | 'lose' | 'timeout'
L.fightScenario = async function (page, id, maxMs) {
  await page.evaluate(id => { DS.G.quiet = true; DS.ui.closeAll(); DS.G.save.opt.hunt = true; DS.startScenario(DS.scn(id)); DS.G.sim.hunt = true; DS.G.save.opt.speed = 2; }, id);
  const t0 = Date.now();
  while (Date.now() - t0 < (maxMs || 120000)) {
    const r = await page.evaluate(() => DS.G.sim && DS.G.sim.result);
    if (r) { await sleep(3500); return r; }
    await L.skipStory(page, 3);
    await sleep(400);
  }
  return 'timeout';
};
// 결과 창·가계도 창·이야기를 닫으며 들판으로 돌아올 때까지
L.settle = async function (page, maxMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < (maxMs || 20000)) {
    const st = await page.evaluate(() => ({ ov: !!document.querySelector('.ov'), scn: !!DS.G.scn, story: !!document.querySelector('.ov.story') }));
    if (!st.ov && !st.scn) return true;
    if (st.story) await L.skipStory(page, 5);
    else {
      const b = await page.$('.ov [data-close], .ov .btn.gold');
      if (b) await b.click().catch(() => {}); else await page.evaluate(() => DS.ui.closeAll());
    }
    await sleep(500);
  }
  return false;
};
// 2.2.4: 칩 줄이 멈출 때까지 (부드러운 밀기 · 관성 · 칩 가장자리 맞춤이 끝나고 scrollLeft 가 여러 프레임 그대로). 정해진 시간만 쉬면 브라우저가 바쁠 때(시험 둘을 함께 돌릴 때) 밀기가 덜 끝나 줄 모양 검사가 흔들렸다
L.chipRest = async function (page, maxMs) {
  await sleep(60);
  return page.evaluate((maxMs) => new Promise(res => {
    const b = document.querySelector('#chips'), t0 = performance.now(); let last = -1, same = 0;
    (function tick() {
      const sl = b ? b.scrollLeft : 0, mx = b ? b.scrollWidth - b.clientWidth : 0, tgt = b && b._tgt != null && b._tgtT && performance.now() - b._tgtT < 3000 ? Math.max(0, Math.min(mx, b._tgt)) : sl, busy = !!(b && (b._gl || b.classList.contains('drag')));
      same = Math.abs(sl - last) < 0.5 && !busy && Math.abs(sl - tgt) < 1.5 ? same + 1 : 0; last = sl;
      if (same >= 8 || performance.now() - t0 > maxMs) { requestAnimationFrame(() => res(same >= 8)); return; }
      requestAnimationFrame(tick);
    })();
  }), maxMs || 6000);
};
// 창 안의 글에서 NaN · undefined · null 찾기
L.badText = async function (page, sel) {
  return page.evaluate(sel => { const el = document.querySelector(sel || 'body'); const t = el ? el.innerText : ''; const m = t.match(/[^\n]{0,30}(NaN|undefined|\bnull\b|\[object)[^\n]{0,30}/g); return m || []; }, sel);
};
L.assert = function (c, msg) { if (!c) throw new Error('ASSERT ' + msg); console.log('ok  ' + msg); };
