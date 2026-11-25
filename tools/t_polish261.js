// 2.6.1 다듬기 시험 (390×844 · 타이틀은 가로 844×390 도): 실제 화면에서 본다.
//   H=844 OUT=qa_out/polish261 node tools/shot.js tools/t_polish261.js
//   ① 「맹주」 한 낱말: 타이틀 · 새로 시작 · 맹주 인물 정보 · 인물 탭 · 가문 창 · 맹주 넘기기 · 도움말에 「대장」이 없다 (대장간 · 대장장이 · 이야기 속 먼동을 부르는 말은 그대로) · 옛 저장의 이름 「대장」은 그대로 읽힌다
//   ② HUD 칩: 이름이 잘리지 않는다 · 대수는 초상의 작은 표 · 등급 테는 그대로
//   ③ 지도 탭: 「30판 가운데 n판 · n번째 걸음」 · 보스 얼굴 · 훈수 ✓ · 고른 길 · 전리품 ✓ / ? · 지역 칸의 땅 빛깔과 깃발 · 읽기만 한다
//   ④ 전설 도감 · 입구 창의 「보스 전리품」
//   ⑤ 기록 포스터 ⑥ 연대기 ⑦ 가계도 ⑧ 타이틀(저장 없음 · 가로) ⑨ 현황 탭 ⑩ 연무장 ⑫ 「싸우다 잃은 사람」
//   (⑪ 장비 규칙 뒷손질은 tools/t_rules26.js ④ 에 있다)
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, shot, L, env) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), sleep = L.sleep;
  const waitFor = async (f, a, ms) => { const t0 = Date.now(); for (;;) { const r = await ev(f, a); if (r) return r; if (Date.now() - t0 > (ms || 8000)) return r; await sleep(150); } };
  const noDj = (t) => !/대장/.test(String(t || '').replace(/대장간|대장장이/g, ''));      // 「대장」이 남았는가 (대장간 · 대장장이는 다른 낱말)
  const topText = () => ev(() => { var o = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost)')).pop(); return o ? o.innerText : ''; });
  const docW = () => ev(() => document.documentElement.scrollWidth);
  const scroll = (px) => ev((px) => { var sc = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost) .sb')).pop(); if (sc) sc.scrollTop = px < 0 ? sc.scrollHeight : sc.scrollTop + px; }, px);

  // ───────── ⑧ 타이틀: 저장이 없는 처음 온 분 ─────────
  let c = await waitFor(() => { var l = document.querySelector('#s-title #mvCard'); return l ? { cls: l.className, t: l.innerText.replace(/\s+/g, ' '), href: (l.querySelector('a') || {}).href || '', top: l.getBoundingClientRect().top, nb: document.querySelector('#btnNew').getBoundingClientRect().bottom, big: !!document.querySelector('#s-title .mvcard'), txt: document.querySelector('#s-title').innerText, first: document.querySelector('.title-bottom').firstElementChild.id } : null; }, null, 6000);
  A(c && c.cls === 'mvline' && !c.big && c.first === 'btnNew' && c.top >= c.nb && /다른 기기에서 하던 판이 있다면 새 집에서 이어 하기 ↗/.test(c.t) && /^https:\/\//.test(c.href), 'title without a local save: 「새로 시작」 comes first, then one small line (' + (c && c.t) + ') instead of the big card');
  A(noDj(c.txt), 'title: no 「대장」');
  await shot('title_new_portrait');
  await page.setViewportSize({ width: 844, height: 390 }); await sleep(600);
  // 화면 틀(#s-title)을 기준으로 잰다 — 시험 쪽은 앱이 8px 테 안에 놓인다
  c = await ev(() => { var F = document.querySelector('#s-title').getBoundingClientRect(), cv = document.querySelector('.title-art canvas').getBoundingClientRect(), tb = document.querySelector('.title-bottom'), r = tb.getBoundingClientRect(), kids = [].map.call(tb.children, function (k) { var q = k.getBoundingClientRect(); return q.top >= F.top - 1 && q.bottom <= F.bottom + 1 && q.left >= r.left - 1 && q.right <= F.right + 1; });
    return { art: cv.width > 200 && cv.height > 80 && cv.right <= r.left + 2 && cv.bottom <= F.bottom + 1 && cv.top >= F.top, right: r.left > innerWidth * 0.45, fit: tb.scrollHeight <= tb.clientHeight + 1, kids: kids.every(Boolean), sw: document.documentElement.scrollWidth, sh: document.querySelector('#s-title').scrollHeight, ih: Math.round(F.height) }; });
  A(c.art && c.right && c.fit && c.kids && c.sw <= 844 && c.sh <= c.ih + 1, 'landscape title (844×390): night art on the left, buttons on the right, nothing cut off ' + JSON.stringify(c));
  await shot('title_new_landscape');
  await page.setViewportSize({ width: env.W || 390, height: env.H || 844 }); await sleep(300);

  // ───────── ① 새로 시작 창 ─────────
  await page.click('#btnNew'); await page.waitForSelector('#cmdName');
  c = await ev(() => ({ t: document.querySelector('.ov').innerText, v: document.querySelector('#cmdName').value }));
  A(/맹주의 이름/.test(c.t) && c.v === '맹주' && noDj(c.t), 'new game: 「맹주의 이름」, default name 「' + c.v + '」, no 「대장」');
  await shot('newgame');
  await ev(() => DS.ui.closeAll());

  // 저장이 생기면 큰 안내 카드 그대로 (세로 · 가로)
  await L.newGame(page, { cls: 'inf', name: '시험' });
  await ev(() => DS.ui.persist()); await page.reload(); await page.waitForSelector('#btnNew');
  c = await waitFor(() => { var k = document.querySelector('#s-title .mvcard'); return k ? { t: k.innerText.replace(/\s+/g, ' '), line: !!document.querySelector('#s-title .mvline'), order: [].map.call(document.querySelector('.title-bottom').children, function (e) { return e.id || e.className; }).join(' ') } : null; }, null, 6000);
  A(c && /새 집으로 옮겼습니다/.test(c.t) && /저장 가지고 이사하기/.test(c.t) && !c.line && /^btnCont mvCard btnNew/.test(c.order), 'title with a save to move: the full card stays between 「이어하기」 and 「새로 시작」 (' + (c && c.order) + ')');
  await shot('title_save_portrait');
  await page.setViewportSize({ width: 844, height: 390 }); await sleep(600);
  c = await ev(() => { var F = document.querySelector('#s-title').getBoundingClientRect(), tb = document.querySelector('.title-bottom'), r = tb.getBoundingClientRect(), cv = document.querySelector('.title-art canvas').getBoundingClientRect(); return { fit: tb.scrollHeight <= tb.clientHeight + 1, in: [].every.call(tb.querySelectorAll('.btn, .mvcard, .tver'), function (k) { var q = k.getBoundingClientRect(); return q.top >= F.top - 1 && q.bottom <= F.bottom + 1 && q.right <= F.right + 1 && q.left >= r.left - 1; }), art: cv.width > 200 && cv.right <= r.left + 2, sw: document.documentElement.scrollWidth }; });
  A(c.fit && c.in && c.art && c.sw <= 844, 'landscape title with the card: everything fits in 390 px height ' + JSON.stringify(c));
  await shot('title_save_landscape');
  await page.setViewportSize({ width: env.W || 390, height: env.H || 844 }); await sleep(300);

  // ───────── ⑫ 「싸우다 잃은 사람」: 진짜 싸움에서 쓰러진 사람 수와 맞는다 ─────────
  await L.newGame(page, { cls: 'inf', name: '시험' });
  await L.edit(page, function () {
    s.gold = 500000; for (var id = 1; id <= 13; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 6);
    DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 40; b.exp = 0; } });
    for (var i = 0; i < 3; i++) { var m = DS.addMerc(s, 'm_sword', 2, s.hero); m.kn = 1; m.L = 30; }
    DS.mercTidy(s); DS.pSync(s);
  });
  await L.closeAll(page);
  const lostOf = () => ev(() => { var s = DS.G.save, r = DS.lgRows(s, 1, 'main').filter(function (x) { return x[0] === 'lost'; })[0]; return { lost: r[1], fallen: (s.fallen || []).length, tm: (s.fallen || []).filter(function (f) { return f.tm != null; }).length, log: s.lin.log.filter(function (e) { return e.t === 'death'; }).length, pole: DS.poleCount(s), label: DS.LG_ROW.lost }; });
  c = await lostOf(); A(c.lost === 0 && c.fallen === 0, 'before: nobody lost (' + JSON.stringify(c) + ')');
  await ev(() => { DS.G.quiet = true; DS.startScenario(DS.scn(9)); }); await sleep(900);
  const killed = await ev(() => { var sim = DS.G.sim, s = DS.G.save, us = sim.units.filter(function (u) { return u.side === 'ally' && !u.dead && u.id !== 'c' + s.hero; }), cmd = us.filter(function (u) { return u.role === 'cmd'; }).slice(0, 1), mer = us.filter(function (u) { return u.role !== 'cmd'; }).slice(0, 2), all = cmd.concat(mer); all.forEach(function (u) { sim.kill(u, null); }); return all.map(function (u) { return u.role; }); });
  await sleep(1500); await ev(() => { DS.G.sim.win(); }); await sleep(500); await L.settle(page, 40000); await sleep(2500); await L.closeAll(page);
  c = await lostOf();
  A(killed.length === 3 && c.fallen === 3 && c.lost === 3 && c.pole === 3 && c.tm === 3 && c.label === '싸우다 잃은 사람', '가문의 위업 「' + c.label + '」 counts the 가주 and the two 가문원 who fell through the play path (' + killed.join(', ') + '): ' + JSON.stringify(c) + ' — it used to say 0 because they had no lineage record');
  c = await ev(() => { var s = DS.G.save, raw = JSON.parse(JSON.stringify(s)); raw.name = '대장'; var s2 = DS.Save.read(JSON.stringify(raw)); return s2 ? s2.name : null; });
  A(c === '대장', 'an old save whose stored name is literally 「대장」 still loads with that name');

  // ───────── 봇이 26번까지 깬 저장으로: 두 대의 맹주 · 연대기 40줄 ─────────
  const v225 = fs.readFileSync(path.join(__dirname, 'fixtures', 'v225.json'), 'utf8');
  await ev((raw) => { var s2 = DS.Save.read(raw); DS.G.save = s2; s2.runs = { n: 1, best: 12, hist: [{ c: 12, top: 12, y: 20, tm: 12000 }] };
    DS.msnState(s2).ok = { 26: 1, 25: 1, 22: 1, 3: 1 }; s2.chs = { k: DS.cycKey(s2), 3: 'a', 24: 'b' }; s2.lootGot.kardan = 1; s2.gear['sword.grok'] = 1; for (var z in DS.ZONES) s2.visited[z] = 1;
    DS.ui.persist(); DS.ui.closeAll(); DS.rebuildParty(); DS.G.quiet = true; DS.enterZone('haemil'); }, v225);
  await sleep(1300); await L.closeAll(page);

  // ───────── ② HUD 칩 ─────────
  c = await ev(() => [].map.call(document.querySelectorAll('#chips .chip'), function (e) { var b = e.querySelector('.cn b'), g = e.querySelector('.cgen'), p = e.querySelector('.por'); return { n: b.textContent, cut: b.scrollWidth > b.clientWidth + 0.5 || b.scrollHeight > b.clientHeight + 1.5, gen: g ? g.textContent : '', gfr: /(^|\s)gfr(\s|$)/.test(p.className) && /(^|\s)g[0-5](\s|$)/.test(p.className), title: e.getAttribute('title'), genIn: g ? (function () { var a = g.getBoundingClientRect(), q = e.getBoundingClientRect(); return a.left >= q.left - 4 && a.right <= q.left + 46; })() : true }; }));
  A(c.length === 3 && c.every(x => !x.cut && x.gfr && x.genIn) && c[0].n === '봇' && c[0].gen === '2세' && c[0].title === '봇 2세', 'HUD chips at 390 px: names fit (' + c.map(x => x.n + (x.gen ? '[' + x.gen + ']' : '')).join(' ') + '), the generation is a badge on the portrait, grade frames kept');
  await page.screenshot({ path: path.join(env.OUT, 'chips_390.png'), clip: { x: 0, y: 0, width: 390, height: 120 } });
  for (const nm of ['가나다', '로저스왕', '여섯글자이름']) {
    c = await ev((nm) => { var s = DS.G.save; s.chars[s.hero].name = nm + ' 3세'; DS.enterZone('haemil'); return 1; }, nm); await sleep(700); await L.closeAll(page);
    c = await ev(() => { var e = document.querySelector('#chips .chip'), b = e.querySelector('.cn b'), g = e.querySelector('.cgen'); return { n: b.textContent, cut: b.scrollWidth > b.clientWidth + 0.5 || b.scrollHeight > b.clientHeight + 1.5, gen: g ? g.textContent : '', cls: e.querySelector('.cn').className }; });
    A(c.n === nm && !c.cut && c.gen === '3세', 'chip name 「' + nm + ' 3세」 is fully readable (' + c.cls + ') ' + JSON.stringify(c));
  }
  await page.screenshot({ path: path.join(env.OUT, 'chips_long.png'), clip: { x: 0, y: 0, width: 390, height: 120 } });
  await ev(() => { var s = DS.G.save; s.chars[s.hero].name = '봇 2세'; DS.enterZone('haemil'); }); await sleep(700); await L.closeAll(page);

  // ───────── ① 맹주 인물 정보 · 인물 탭 · 가문 창 · 도움말 · 맹주 넘기기 ─────────
  await ev(() => DS.heroInfo(null)); await sleep(500);
  c = await ev(() => { var o = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost)')).pop(); return { h: o.querySelector('.sh h3').textContent.trim(), t: o.innerText }; });
  A(c.h === '맹주' && noDj(c.t), 'leader sheet: the ribbon says 「' + c.h + '」, no 「대장」 anywhere in it');
  await shot('leader_sheet');
  c = await ev(() => { var b = document.querySelector('.ov [data-nk]'); if (!b) return null; if (!b.disabled) b.click(); return { dis: b.disabled, why: (document.querySelector('.ov .nkwhy') || {}).textContent || '' }; }); await sleep(500);
  if (c && !c.dis) { const t = await topText(); A(noDj(t) && /맹주/.test(t), 'hand-over warning sheet: no 「대장」'); await shot('handover_sheet'); }
  else A(c && noDj(c.why), 'hand-over button (disabled: ' + (c && c.why) + '): no 「대장」');
  await L.closeAll(page);
  await ev(() => DS.openMenu('people')); await sleep(600);
  c = await topText(); A(noDj(c) && /맹주/.test(c) && /혼인/.test(c) && /가계도/.test(c), 'people tab: 「맹주」 tag with the 혼인 and 가계도 buttons (2.6.2), no 「대장」');
  A(await docW() <= 390, 'people tab does not scroll sideways');
  await ev(() => DS.openMenu('help')); await sleep(600);
  c = await topText(); A(noDj(c) && /맹주 인물 정보/.test(c) && c.length > 2000, 'help tab (' + c.length + ' chars): 「맹주 인물 정보」, no 「대장」 (대장간 · 대장장이 are other words)');
  await L.closeAll(page);
  // 글 표(의식 · 넘기기 · 가계 · 훈수 · 그림자 …)를 통째로 훑는다 — 남아도 되는 것은 먼동을 부르는 말과 사냥꾼 대장뿐
  c = await ev(() => { var hits = [], seen = [], skip = { G: 1, NOTES: 1, ui: 1, Audio: 1, OnlineBE: 1, Online: 1 };
    (function walk(o, p, d) { if (o == null || d > 7) return; if (typeof o === 'string') { var t = o.replace(/대장간|대장장이/g, ''); if (/대장/.test(t)) hits.push(p + ': ' + o.slice(0, 60)); return; } if (typeof o !== 'object' || (typeof Node !== 'undefined' && o instanceof Node) || seen.indexOf(o) >= 0) return; seen.push(o); if (seen.length > 60000) return;
      var ks; try { ks = Object.keys(o); } catch (x) { return; } for (var i = 0; i < ks.length; i++) { if (d === 0 && skip[ks[i]]) continue; var v; try { v = o[ks[i]]; } catch (x) { continue; } walk(v, p + '.' + ks[i], d + 1); } })(DS, 'DS', 0);
    return hits; });
  const okDj = /사냥꾼 대장|대장이 안 가셨다|들어가 보겠습니다… 대장|대장이 아직 안에 계신다|대장이 내게 맡기셨다|대장도 우리가 데리고|동짓날입니다, 대장/;
  A(c.every(h => okDj.test(h)) && c.length >= 5, 'text tables: the only 「대장」 left are the intentional ones (the 부관 and the 단톡방 calling 먼동, 사냥꾼 대장 하겐) — ' + c.length + ' lines' + (c.filter(h => !okDj.test(h)).length ? ' · UNEXPECTED ' + c.filter(h => !okDj.test(h)).join(' | ') : ''));
  c = await ev(() => { var a = DS.storyFit ? 1 : 0; return { calls: /대장/.test(String(DS.storyFit || '')) }; });

  // ───────── ③ 지도 탭 ─────────
  const snapSave = () => ev(() => { var s = DS.G.save, o = {}; ['msn', 'chs', 'lootGot', 'gh', 'runs', 'cleared', 'gear'].forEach(function (k) { o[k] = JSON.stringify(s[k]); }); o.keys = Object.keys(s).sort().join(); return JSON.stringify(o); });
  const save0 = await snapSave();
  await ev(() => DS.openMenu('map')); await sleep(600);
  c = await ev(() => { var o = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost)')).pop(), row = function (n) { var r = o.querySelector('.msl[data-scn="' + n + '"]'); return r ? { t: r.innerText.replace(/\s+/g, ' '), face: !!r.querySelector('.mface canvas, .mface img'), msn: !!r.querySelector('.mt.ok:not(.lt)'), ch: (r.querySelector('.mt.ch') || {}).textContent || '', lt: r.querySelector('.mt.lt') ? (r.querySelector('.mt.lt.ok') ? 'ok' : '?') : '', ico: !!r.querySelector('.mt.lt .ico') } : null; };
    return { run: (o.querySelector('.msl-run') || {}).innerText.replace(/\s+/g, ' '), bar: (o.querySelector('.msl-run .mbar u') || { style: {} }).style.width, r26: row(26), r25: row(25), r24: row(24), r22: row(22), r3: row(3), r27: row(27), th: o.querySelectorAll('.mz .mzth').length, zones: Object.keys(DS.ZONE_POS).length, flag: [].map.call(o.querySelectorAll('.mz.zdone .mzflag'), function (e) { return e.parentNode.dataset.z; }).sort().join(), old: /완료 \(다시 도전\)/.test(o.innerText) }; });
  A(/30판 가운데 26판 · 2번째 걸음/.test(c.run) && /12번까지/.test(c.run) && c.bar === '87%', 'map header: 「' + c.run + '」 with a progress bar (' + c.bar + ')');
  A(c.r26.face && c.r26.msn && c.r25.msn && !c.r24.msn && c.r3.ch === '고갯길 안내' && c.r24.ch === '열둘이 당번' && c.r22.lt === 'ok' && c.r22.ico && c.r25.lt === '?' && c.r27.face && c.r27.lt === '?' && !c.old, 'scenario rows: boss face, 훈수 ✓ (26 · 25, not 24), choice tag (3 「' + c.r3.ch + '」 · 24 「' + c.r24.ch + '」), boss loot ✓ with its icon (22) or ? (25 · next 27) — 「' + c.r24.t + '」');
  A(c.th === c.zones && /dawn/.test(c.flag) && /ash/.test(c.flag) && !/end/.test(c.flag) && !/haemil|gaon|dodam/.test(c.flag), 'zone boxes: ' + c.th + ' tile-theme strips; a flag on the zones whose scenarios are all cleared (' + c.flag + '), none on 끝의 땅');
  A(await docW() <= 390, 'map tab does not scroll sideways');
  await shot('map_zones'); await scroll(520); await sleep(250); await shot('map_rows');
  await L.closeAll(page);

  // ───────── ④ 전설 도감 · 입구 창 ─────────
  await ev(() => DS.openMenu('bag')); await sleep(600);
  c = await ev(() => { var b = document.querySelector('.ov [data-loot-dex]'), dex = DS.legDex(DS.G.save); return b ? { t: b.innerText.replace(/\s+/g, ' '), n: dex.filter(function (x) { return x.found; }).length, all: dex.length, cap: (document.querySelector('.ov .lcount') || {}).textContent } : null; });
  A(c && c.t.indexOf(c.n + ' / ' + c.all) >= 0 && /유니크·전설 \d+ \/ 40/.test(c.cap), 'bag: 「' + (c && c.t) + '」 opens the collection (the 「' + (c && c.cap) + '」 carry limit stays as it was)');
  await ev(() => document.querySelector('.ov [data-loot-dex]').scrollIntoView({ block: 'center' })); await sleep(200); await shot('bag_dex_button');
  await ev(() => document.querySelector('.ov [data-loot-dex]').click()); await sleep(500);
  c = await ev(() => { var o = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost)')).pop(), cell = function (id) { var e = o.querySelector('[data-dex="' + id + '"]'); return e ? { on: e.classList.contains('on'), t: e.innerText.replace(/\s+/g, ' '), sil: getComputedStyle(e.querySelector('.ico')).filter } : null; };
    return { h: o.querySelector('.sh h3').textContent.trim(), n: o.querySelectorAll('.dexc').length, on: o.querySelectorAll('.dexc.on').length, all: DS.legDex(DS.G.save).length, grok: cell('sword.grok'), kardan: cell('sword.kardan'), mire: cell('sword.mire'), blood: cell('sword.first') }; });
  A(c.h === '전설 도감' && c.n === c.all && c.on >= 3 && c.grok.on && /그록의 방아공이/.test(c.grok.t) && /1번/.test(c.grok.t) && c.kardan.on && !c.mire.on && /\?\?\? 안개 수렁의 보스/.test(c.mire.t) && /brightness\(0\)/.test(c.mire.sil) && /새벽 들판의 적이 드물게/.test(c.blood.t), 'collection grid: ' + c.on + ' of ' + c.n + ' found; found shows name and origin (「' + c.grok.t + '」), unfound is a silhouette with a hint (「' + c.mire.t + '」 · 「' + c.blood.t + '」)');
  await shot('dex_grid');
  await ev(() => document.querySelector('.ov [data-dex="sword.grok"]').click()); await sleep(300);
  c = await ev(() => (document.querySelector('.ov .dexsel') || {}).innerText || ''); A(/그록의 방아공이/.test(c) && /밀가루/.test(c), 'tapping a found piece shows its origin and lore: ' + c.replace(/\s+/g, ' '));
  await ev(() => document.querySelector('.ov [data-dex="sword.mire"]').click()); await sleep(300);
  c = await ev(() => (document.querySelector('.ov .dexsel') || {}).innerText || ''); A(/\?\?\?/.test(c) && /안개 수렁의 보스/.test(c) && /아직 찾지 못했다/.test(c) && !/가라앉은 종/.test(c), 'tapping an unfound one keeps the name hidden: ' + c.replace(/\s+/g, ' '));
  await shot('dex_unfound'); await L.closeAll(page);
  await ev(() => DS.openGate(DS.scn(27))); await sleep(600);
  c = await ev(() => (document.querySelector('.ov .gloot') || {}).innerText || ''); A(/\?\?\?/.test(c) && /아직 못 찾았다/.test(c), 'gate 27: 「보스 전리품 ' + c.replace(/\s+/g, ' ') + '」');
  await shot('gate_loot_unknown'); await L.closeAll(page);
  await ev(() => DS.openGate(DS.scn(22))); await sleep(600);
  c = await ev(() => { var g = document.querySelector('.ov .gloot'); return g ? { t: g.innerText.replace(/\s+/g, ' '), ico: !!g.querySelector('.ico') } : null; }); A(c && /불가마 대검/.test(c.t) && c.ico, 'gate 22 (its boss piece was received once): icon and name — ' + (c && c.t));
  await shot('gate_loot_found'); await L.closeAll(page);
  A(await snapSave() === save0, 'map tab, collection and gate only read the save (no new fields, nothing changed)');

  // ───────── ⑤ 기록 ─────────
  await ev(() => DS.showRecord(null, false)); await sleep(1800);
  c = await ev(() => { var o = document.querySelector('.ov .result.record'); return { h: o.querySelector('h2').textContent, gens: [].map.call(o.querySelectorAll('.recg li'), function (li) { return { t: li.innerText.replace(/\s+/g, ' '), fr: !!li.querySelector('.gfr canvas, .gfr img'), dead: !!li.querySelector('.gfr.dead') }; }), cu: [].map.call(o.querySelectorAll('[data-cu]'), function (e) { return [e.textContent, e.dataset.cu]; }), t: o.innerText.replace(/\s+/g, ' '), pole: !!o.querySelector('[data-recpole]'), names: o.querySelectorAll('.names i').length, w: o.querySelectorAll('.recw li').length }; });
  A(/의 가문$/.test(c.h) && c.gens.length === 2 && c.gens.every(g => g.fr) && c.gens[0].dead && !c.gens[1].dead && /1대 봇 가문력 1~\d+년 · 천수를 누림/.test(c.gens[0].t) && /2대 봇 2세 가문력 \d+년~ · 지금의 맹주/.test(c.gens[1].t), 'record poster: one row per 맹주 with a framed portrait, years and how it ended — ' + c.gens.map(g => g.t).join(' / '));
  A(c.cu.length >= 3 && c.cu.every(x => x[0].replace(/,/g, '') === x[1]) && /8,725/.test(c.t) && /다시 걸은 길/.test(c.t) && /가장 멀리 12번/.test(c.t) && c.w === 2 && /1번째 걸음.*12번.*2번째 걸음.*26번/.test(c.t) && c.names === 10 && c.pole, 'record: numbers count up to their values with thousands separators (' + c.cu.map(x => x[0]).join(' ') + '), furthest scenario per walk, ' + c.names + ' names, a link to the 깃대');
  await shot('record_poster');
  await ev(() => document.querySelector('.ov [data-recpole]').click()); await sleep(700);
  c = await ev(() => !!document.querySelector('.ov .polew')); A(c, 'the record\'s link opens the 깃대');
  await L.closeAll(page);

  // ───────── ⑦ 가계도 ─────────
  await ev(() => DS.openLineage()); await sleep(800);
  c = await ev(() => { var o = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost)')).pop(), n = o.querySelector('.lgn.now'), s = DS.G.save; if (!n) return null; var r = n.getBoundingClientRect(), w = n.closest('[data-lgwrap]').getBoundingClientRect(), b = o.querySelector('.sb').getBoundingClientRect(), cs = getComputedStyle(n);
    return { pid: +n.dataset.lgp === s.chars[s.hero].pid, inX: r.left >= w.left - 1 && r.right <= w.right + 1, inY: r.top >= b.top - 1 && r.bottom <= b.bottom + 1, ring: cs.boxShadow, labels: [].map.call(n.closest('.lgt').querySelectorAll('.lggens i'), function (e) { return e.textContent; }).join(' '), left: (function () { var g = n.closest('.lgt').querySelector('.lggens').getBoundingClientRect(); return g.left <= r.left; })(), txt: o.innerText }; });
  A(c && c.pid && c.inX && c.inY && /240, 200, 96/.test(c.ring) && c.labels === '1대 2대' && c.left, 'family tree opens on the current 맹주 (in view, gold ring), row labels on the left: ' + (c && c.labels));
  A(noDj(c.txt), 'family window: no 「대장」');
  await shot('lineage_tree');
  // ───────── ⑥ 연대기 ─────────
  await ev(() => document.querySelector('.ov [data-lgtab="log"]').click()); await sleep(500);
  const chron = () => ev(() => { var o = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost)')).pop(), rows = [].slice.call(o.querySelectorAll('.lgc.v2 > li:not(.hd):not(.run)'));
    return { chips: [].map.call(o.querySelectorAll('.lgcf [data-lgcf]'), function (e) { return e.textContent.replace(/\s+/g, ' ').trim(); }), heads: [].map.call(o.querySelectorAll('.lgc.v2 li.hd'), function (e) { return e.textContent; }), runs: [].map.call(o.querySelectorAll('.lgrun'), function (e) { return e.innerText.replace(/\s+/g, ' '); }), rows: rows.length, por: rows.filter(function (r) { return r.querySelector('.lgcp .gfr'); }).length, dk: rows.filter(function (r) { return r.classList.contains('dk'); }).length, kinds: rows.map(function (r) { return r.className.replace(/ dk/, ''); }), text: rows.map(function (r) { return r.lastElementChild.textContent; }) }; });
  c = await chron();
  A(c.chips.length === 4 && /^모두 40$/.test(c.chips[0]) && /^혼인·출생 \d+$/.test(c.chips[1]) && /^죽음·계승 \d+$/.test(c.chips[2]) && /^합일 12$/.test(c.chips[3]), 'chronicle filter chips: ' + c.chips.join(' | '));
  A(c.heads.length >= 5 && c.heads.every(h => /^가문력 \d+년 (봄|여름|가을|겨울)$/.test(h)) && c.runs.some(r => /합일 \d+건/.test(r)) && c.por >= c.rows - 2 && c.dk >= 3, 'chronicle: headers by 가문력 year and season (' + c.heads.slice(0, 3).join(', ') + ' …), runs collapsed (' + c.runs.join(', ') + '), ' + c.por + '/' + c.rows + ' rows with a framed portrait, ' + c.dk + ' death rows on a dark bar');
  A(c.text.every(t => !/ — /.test(t)) && c.text.some(t => /의 집에 아이 .+[이가] 태어났다\./.test(t)), 'generated lines are sentences, no dashes: 「' + (c.text.filter(t => /태어났다/.test(t))[0] || '') + '」');
  await shot('chronicle_bottom'); await ev(() => { document.querySelector('#app .ov:not(.ghost) .sb').scrollTop = 0; }); await sleep(250); await shot('chronicle_top');
  const rows0 = c.rows;
  await ev(() => { var b = document.querySelector('.ov .lgrun'); b.scrollIntoView({ block: 'center' }); b.click(); }); await sleep(400);
  c = await chron(); A(c.rows > rows0 && c.text.some(t => /두 가주를 받아들여 8단에 올랐다\./.test(t) && !/—/.test(t)), 'tapping 「합일 n건」 unfolds the run (' + rows0 + ' → ' + c.rows + ' rows)');
  await shot('chronicle_run_open');
  await ev(() => document.querySelector('.ov [data-lgcf="fuse"]').click()); await sleep(400);
  c = await chron(); const fuseRows = c.rows + c.runs.reduce((n, r) => n + (+(/(\d+)건/.exec(r) || [0, 0])[1]), 0);
  A(c.kinds.every(k => /k-fuse/.test(k)) && fuseRows >= 12, 'filter 「합일」 shows only 합일 (' + c.rows + ' rows open, ' + c.runs.join(', ') + ')');
  await ev(() => document.querySelector('.ov [data-lgcf="end"]').click()); await sleep(400);
  c = await chron(); A(c.dk >= 3 && c.kinds.every(k => !/k-(wed|birth|fuse)\b/.test(k)), 'filter 「죽음·계승」: ' + c.rows + ' rows, ' + c.dk + ' on the dark bar');
  await shot('chronicle_filter_end');
  await ev(() => document.querySelector('.ov [data-lgcf="all"]').click()); await sleep(300);
  A(await docW() <= 390, 'family window does not scroll sideways');
  await L.closeAll(page);

  // ───────── ⑨ 현황 탭 (꺼져 있을 때) ─────────
  await ev(() => DS.openMenu('online')); await sleep(900);
  c = await ev(() => { var o = document.querySelector('#onlBox'), g = o && o.querySelector('.onl-go'); return o ? { off: !!o.querySelector('.onl-off'), t: o.innerText.replace(/\s+/g, ' '), href: g ? g.href : '', btn: g ? g.textContent.trim() : '', web: !!(DS.OnlineBE && DS.OnlineBE.name === 'firebase'), tabs: document.querySelectorAll('.ov [data-tab]').length } : null; });
  if (c && c.off) { A(/현황은 다른 모험가들의 진행을 보는 곳/.test(c.t) && (c.web || (/새 집에서 로그인하기/.test(c.btn) && c.href === (await ev(() => DS.WEB_URL)))) && c.tabs === 7 && noDj(c.t), '현황 tab offline says what it shows and how to see it (' + c.btn + '); the tab is kept so the row of ' + c.tabs + ' tabs does not shift'); }
  else A(c && c.tabs === 7, '현황 tab is live here (' + (c && c.t.slice(0, 40)) + ')');
  await shot('online_offline'); await L.closeAll(page);

  // ───────── ⑩ 연무장 1:1 ─────────
  await ev(() => DS.arenaOpen()); await sleep(700);
  await ev(() => { var b = [].filter.call(document.querySelectorAll('.ov [data-ar]'), function (e) { return /시작/.test(e.textContent); })[0]; if (b) b.click(); });
  c = await waitFor(() => { var T = document.querySelector('.ar-std.T'), B = document.querySelector('.ar-std.B'), s = document.querySelector('.ar-cast span'); return T && B && s && s.textContent && parseFloat(T.style.height) > 0 ? { T: parseFloat(T.style.height), B: parseFloat(B.style.height), bg: getComputedStyle(T).backgroundImage.slice(0, 20), cast: s.textContent, lab: document.querySelector('.ar-cast i').textContent, under: document.querySelector('.ar-cast').getBoundingClientRect().top >= document.querySelector('.ar-stage').getBoundingClientRect().bottom - 1 } : null; }, null, 9000);
  A(c && c.T > 40 && c.B > 40 && /gradient/.test(c.bg) && c.lab === '해설' && c.cast.length > 5 && c.under, '1:1 arena: stands fill the bands above and below the ring (' + (c && c.T) + ' px / ' + (c && c.B) + ' px), a 해설 line under the ring: 「' + (c && c.cast) + '」');
  await sleep(1500); await shot('arena_fight');
  const cast0 = c.cast;
  await ev(() => { var b = document.querySelector('[data-ar="spd"]'); if (b) { b.click(); b.click(); } });
  c = await waitFor(() => { var r = document.querySelector('.ar-res:not([hidden])'); return r ? { cast: document.querySelector('.ar-cast span').textContent, res: r.innerText.replace(/\s+/g, ' ').slice(0, 40) } : null; }, null, 120000);
  A(c && c.cast && c.cast !== cast0 && /(승리|이겼습니다|넘어졌습니다|판정)/.test(c.cast), 'the commentary follows the fight to the end: 「' + (c && c.cast) + '」 (' + (c && c.res) + ')');
  await shot('arena_result');
  await ev(() => { if (DS.arenaClose) DS.arenaClose(); }); await sleep(400); await L.closeAll(page);

  const bad = await L.badText(page, 'body'); A(!bad.length, 'no NaN/undefined on screen' + (bad.length ? ': ' + bad.join(' | ') : ''));
  console.log('polish261 done');
};
