// 칼무덤 시험 (blades.js): 마을 (15, 9) 의 무덤과 이름표 · 창과 알림판 · 씨앗 굴림 2,000 번의 몫 · 천장 · 전설 후보 · 부적 넘침 · 골드 · 가방 가득 · 저장 · 연출(한 자루 · 열 자루 · 건너뛰기 · 움직임 줄이기) · 390 폭
//   H=844 OUT=<폴더> PAGE=<dist/test.html> node tools/shot.js tools/t_blades.js
'use strict';
module.exports = async (page, shot, L, X) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), sleep = L.sleep;
  await L.newGame(page, { cls: 'inf', name: '칼무덤' });
  await L.edit(page, function () { s.gold = 3000000; for (var id = 1; id <= 6; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 4); DS.mercTidy(s); DS.pSync(s); s.opt.cine = 'off'; });
  await L.closeAll(page);

  // ── 마을: (15, 9) 의 칼무덤 · 이름표 · 두 마을 ──
  for (const z of ['haemil', 'dodam']) {
    await ev((z) => { DS.G.quiet = true; DS.G.save.visited[z] = true; DS.ui.closeAll(); DS.enterZone(z, null, { x: 16, y: 12 }); }, z);
    await sleep(2600); await L.closeAll(page); await sleep(600);
    const c = await ev(() => { var z = DS.G.zone, p = z.pois.filter(function (p) { return p.t === 'shop' && p.kind === 'blades'; }), h = z.pois.filter(function (p) { return p.t === 'shop' && p.kind === 'house'; }), pole = z.pois.filter(function (p) { return p.kind === 'pole'; })[0];
      return { n: p.length, bx: p[0] && p[0].bx, by: p[0] && p[0].by, door: p[0] && [p[0].x, p[0].y], label: p[0] && p[0].label, houses: h.length, H: [0, 1, 2].map(function (i) { return z.rows[9][15 + i] + z.rows[10][15 + i]; }).join(''), road: z.rows[11][16], pole: pole ? [pole.x, pole.y] : null, theme: z.def.theme }; });
    A(c.n === 1 && c.bx === 15 && c.by === 9 && c.door.join() === '16,11' && c.label === '칼무덤', z + ' (' + c.theme + '): 칼무덤 stands at (15, 9), door (16, 11), label 「' + c.label + '」');
    A(c.houses === 3 && c.H === 'HHHHHH' && c.road === 'r' && c.pole && c.pole.join() === '10,9', z + ': same 3×2 footprint and door road, three 민가 left, the pole still at (10, 9)');
    await shot('town_' + z);
  }
  // 문을 누르면 열린다 (가게와 같은 길)
  const door = await ev(() => { var v = DS.G.view, p = DS.G.zone.pois.filter(function (p) { return p.kind === 'blades'; })[0], s = v.screenOf(p.x, p.y), r = document.querySelector('#cv').getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; });
  await page.mouse.click(door.x, door.y);
  let opened = false; for (let i = 0; i < 40 && !opened; i++) { await sleep(300); opened = await ev(() => !!document.querySelector('.ov.bldsh')); }
  A(opened, 'tapping the 칼무덤 door opens its window');
  // ── 창 ──
  let w = await ev(() => { var o = document.querySelector('.ov.bldsh'); return { title: o.querySelector('header h3').textContent, line: o.querySelector('.bldline').textContent, fl: o.querySelector('.bldfl').textContent, pity: o.querySelector('.bldpity b').textContent, b1: o.querySelector('[data-bpull="1"]').innerText.replace(/\s+/g, ' '), b10: o.querySelector('[data-bpull="10"]').innerText.replace(/\s+/g, ' '), dis: [].map.call(o.querySelectorAll('[data-bpull]'), function (b) { return b.disabled; }), dex: !!o.querySelector('[data-bdex]'), keep: (o.querySelector('.f26keep') || {}).innerText || '', sw: document.documentElement.scrollWidth, txt: o.innerText }; });
  A(w.title === '칼무덤' && w.fl === '먼저 간 이들의 칼이 꽂힌 언덕. 값을 치르고 손을 뻗으면 한 자루가 뽑힌다.', 'window: title and flavour line');
  A(w.line === '일반 장비 37%, 유니크 30%, 전설 25%, 강화 보호 부적 8%. 전설이 아홉 번 나오지 않으면 열 번째는 전설.', 'window: rate board 「' + w.line + '」');
  A(w.pity === '전설까지 10번' && /한 자루 뽑기 10,000골드/.test(w.b1) && /열 자루 뽑기 100,000골드/.test(w.b10) && !w.dis[0] && !w.dis[1] && w.dex, 'window: 「' + w.pity + '」, buttons 「' + w.b1 + '」 「' + w.b10 + '」, link to the 전설 도감');
  A(/무덤지기/.test(w.keep), 'window: keeper line 「' + w.keep.replace(/\n/g, ' ') + '」');
  A(w.sw <= 390 && !/undefined|NaN|위력/.test(w.txt) && !/—/.test(w.txt), 'window: fits 390 px, no undefined/NaN, no em-dash');
  await shot('window');
  await ev(() => document.querySelector('[data-bdex]').click()); await sleep(400);
  A(await ev(() => !!document.querySelector('.ov.dex')), 'window: the link opens the 전설 도감');
  await L.closeAll(page);
  // 「마을 일」 줄
  await ev(() => DS.openTownWork()); await sleep(300);
  const tw = await ev(() => { var b = document.querySelector('[data-tw="blades"]'); return b ? b.innerText.replace(/\s+/g, ' ') : null; });
  A(tw && /칼무덤/.test(tw), 'town quick menu has a 칼무덤 row (' + tw + ')');
  await ev(() => document.querySelector('[data-tw="blades"]').click()); await sleep(400);
  A(await ev(() => !!document.querySelector('.ov.bldsh')), 'the quick menu row opens the window');
  await L.closeAll(page);

  // ── 굴림 (씨앗 굴림 · 시험용 저장 사본) ──
  let r = await ev(() => {
    var sv = JSON.parse(JSON.stringify(DS.G.save)), rnd = DS.rng(20261127), c = { plain: 0, uq: 0, leg: 0, prot: 0 }, gr = { 2: 0, 3: 0, 4: 0 }, bad = [], i, x;
    var zs = {}; DS.legDex(sv).forEach(function (d) { if (d.kind === 'zone') zs[d.id] = 1; });
    sv.gold = 1e9;
    for (i = 0; i < 2000; i++) { x = DS.bladesRoll(sv, rnd, { flat: true }); c[x.k]++; if (x.k === 'uq') gr[x.gr]++; if (x.k !== 'prot' && !x.g) { bad.push(x.id); continue; } if (x.k === 'leg' && !zs[x.id]) bad.push(x.id); if (x.k === 'plain' && x.g.grade >= 2) bad.push(x.id); if (x.k === 'uq' && x.g.grade !== 4) bad.push(x.id); if (x.k === 'leg' && x.g.grade !== 5) bad.push(x.id); }
    var sv2 = JSON.parse(JSON.stringify(DS.G.save)), rnd2 = DS.rng(77), c2 = { plain: 0, uq: 0, leg: 0, prot: 0 }; sv2.gold = 1e9; delete sv2.blades;
    for (i = 0; i < 2000; i++) c2[DS.bladesRoll(sv2, rnd2).k]++;
    return { c: c, gr: gr, bad: bad.slice(0, 5), c2: c2, n: sv2.blades.n };
  });
  const pc = (n) => n / 20, R = { plain: 37, uq: 30, leg: 25, prot: 8 };
  console.log('RATES flat ' + Object.keys(R).map(k => k + ' ' + pc(r.c[k]).toFixed(2) + '%').join(', ') + ' | uq grades 2/3/4 ' + [2, 3, 4].map(g => (r.gr[g] / r.c.uq * 100).toFixed(1) + '%').join(' / ') + ' | with pity ' + Object.keys(R).map(k => k + ' ' + pc(r.c2[k]).toFixed(2) + '%').join(', '));
  A(Object.keys(R).every(k => Math.abs(pc(r.c[k]) - R[k]) <= 3), '2,000 seeded rolls land within ±3%p of each rate (' + Object.keys(R).map(k => k + ' ' + pc(r.c[k]).toFixed(1)).join(', ') + ')');
  A(Math.abs(r.gr[2] / r.c.uq * 100 - 50) <= 6 && Math.abs(r.gr[3] / r.c.uq * 100 - 35) <= 6 && Math.abs(r.gr[4] / r.c.uq * 100 - 15) <= 5, 'unique rolls split 50/35/15 (' + [2, 3, 4].map(g => r.gr[g]).join('/') + ')');
  A(!r.bad.length, 'every pull is real gear of the right grade (' + r.bad.join(',') + ')');
  A(Math.abs(pc(r.c2.leg) - 26.5) <= 3 && r.n === 2000, 'with the pity on, legendary lands near the expected 26.5% (' + pc(r.c2.leg).toFixed(1) + '%), the save counts 2,000 pulls');
  // 천장: 일반만 나오는 굴림으로 아홉 번 → 열 번째는 전설
  r = await ev(() => { var sv = JSON.parse(JSON.stringify(DS.G.save)), seq = [], ps = []; delete sv.blades; for (var i = 0; i < 12; i++) { var x = DS.bladesRoll(sv, function () { return 0.01; }); seq.push(x.k); ps.push(sv.blades.p); } return { seq: seq, ps: ps, left: DS.bladesLeft(sv) }; });
  A(r.seq.slice(0, 9).every(k => k !== 'leg') && r.seq[9] === 'leg' && r.ps[8] === 9 && r.ps[9] === 0 && r.seq[10] !== 'leg', 'pity: nine pulls without a legendary, the 10th is one and the counter resets (' + r.ps.join(',') + ')');
  r = await ev(() => { var sv = { blades: { n: 30, p: 9 } }, a = DS.bladesLeft(sv); sv.blades.p = 0; return [a, DS.bladesLeft(sv), DS.bladesLeft({})]; });
  A(r.join() === '1,10,10', 'pity text counts down (전설까지 ' + r.join(' / ') + '번)');
  // 전설 후보: 아직 없는 것 먼저 · 시나리오 보상과 보스 고유 장비는 없다
  r = await ev(() => {
    var sv = JSON.parse(JSON.stringify(DS.G.save)), dex = DS.legDex(sv), zone = dex.filter(function (d) { return d.kind === 'zone'; }).map(function (d) { return d.id; }), other = dex.filter(function (d) { return d.kind !== 'zone'; }).map(function (d) { return d.id; });
    var pool0 = DS.bladesLegPool(sv), keep = zone[3]; zone.forEach(function (id) { if (id !== keep) sv.gear[id] = 1; });
    var pool1 = DS.bladesLegPool(sv), got = {}, rnd = DS.rng(5); for (var i = 0; i < 30; i++) { var x = DS.bladesRoll(sv, function () { return 0.7; }); got[x.id] = 1; }
    var pool2 = DS.bladesLegPool(sv);
    return { zone: zone.length, other: other.length, pool0: pool0.length, inter: pool0.filter(function (id) { return other.indexOf(id) >= 0; }).length, pool1: pool1, keep: keep, first: Object.keys(got), pool2: pool2.length, otherIn: pool2.filter(function (id) { return other.indexOf(id) >= 0; }).length };
  });
  A(r.pool0 === r.zone && !r.inter && r.other > 0, 'legendary pool is the ' + r.zone + ' field legendaries only (none of the ' + r.other + ' scenario or boss pieces)');
  A(r.pool1.length === 1 && r.pool1[0] === r.keep && r.first.indexOf(r.keep) >= 0, 'unowned legendaries come first (the one missing piece 「' + r.keep + '」 is the only candidate)');
  A(r.pool2 === r.zone && !r.otherIn, 'once all are owned, any field legendary can come again (still no boss or scenario pieces)');
  // 부적: 한도를 넘으면 장당 3,000골드
  r = await ev(() => { var out = []; [0, 19, 20].forEach(function (have) { var sv = JSON.parse(JSON.stringify(DS.G.save)); sv.items.prot = have; sv.gold = 0; var x = DS.bladesRoll(sv, function () { return 0.99; }); out.push([x.k, x.n, x.miss, x.refund, sv.items.prot, sv.gold]); }); out.c = Math.max(DS.BLADES.protRefund, DS.protPrice(DS.G.save)); return { r: out, c: out.c }; });
  const pcR = r.c; r = r.r;      // 2.7.2: 돌려주는 값 = 지금 대장간 값과 바닥값 가운데 큰 쪽
  A(r[0].join() === 'prot,2,0,0,2,0' && r[1].join() === 'prot,1,1,' + pcR + ',20,' + pcR && r[2].join() === 'prot,0,2,' + 2 * pcR + ',20,' + 2 * pcR, 'charms: 2 each, over the cap of 20 the missing ones refund the forge price (' + pcR + ') each (' + r.map(x => x.join('/')).join(' · ') + ')');
  // 골드: 정확히 빠진다 (판 값 · 돌려받은 부적 값만 다시 들어온다)
  r = await ev(() => { var sv = JSON.parse(JSON.stringify(DS.G.save)); sv.gold = 250000; var g0 = sv.gold, a = DS.bladesPull(sv, 1, DS.rng(3)), g1 = sv.gold, b = DS.bladesPull(sv, 10, DS.rng(4)), g2 = sv.gold, back = function (res) { return res.list.reduce(function (t, x) { return t + (x.sold || 0) + (x.refund || 0); }, 0); };
    var poor = JSON.parse(JSON.stringify(DS.G.save)); poor.gold = 99999; var n0 = poor.blades ? poor.blades.n : 0, c = DS.bladesPull(poor, 10);
    return { d1: g0 - g1 + back(a), d10: g1 - g2 + back(b), n10: b.list.length, cost: [a.cost, b.cost], poor: c === null && poor.gold === 99999 && (poor.blades ? poor.blades.n : 0) === n0 }; });
  A(r.d1 === 10000 && r.d10 === 100000 && r.n10 === 10 && r.cost.join() === '10000,100000', 'gold: one pull costs exactly 10,000, ten cost 100,000 (sold and refunded gold aside)');
  A(r.poor, 'gold: a pull you cannot afford changes nothing');
  // 가방이 가득: 유니크(높은 굴림 아님)는 그 자리에서 팔리고, 전설은 그래도 들어간다
  r = await ev(() => { var sv = JSON.parse(JSON.stringify(DS.G.save)), k = 0; sv.gold = 0; for (var i = 0; k < DS.DROP.bag + 2 && i < 4000; i++) { var id = DS.rollGear({ L: 30, grade: 3, save: sv }, DS.rng(900 + i)); if (!sv.gear[id]) { sv.gear[id] = 1; k++; } }
    var seq = [0.5, 0.0], j = 0, rr = function () { return j < 2 ? seq[j++] : 0.0; };      // 유니크 · 옵션 하나
    var u = DS.bladesRoll(sv, rr), gold = sv.gold, before = Object.keys(sv.gear).length, l = DS.bladesRoll(sv, function () { return 0.68; });
    return { k: u.k, gr: u.gr, sold: u.sold, gold: gold, inBag: !!sv.gear[u.id], lk: l.k, lIn: sv.gear[l.id] > 0, lLock: !!sv.lock[l.id], gh: sv.gh && sv.gh[l.id] && sv.gh[l.id].at };
  });
  A(r.k === 'uq' && r.gr === 2 && r.sold > 0 && r.gold === r.sold && !r.inBag, 'bag full: a unique is sold on the spot for ' + r.sold + ' gold');
  A(r.lk === 'leg' && r.lIn && r.lLock && r.gh === '칼무덤', 'bag full: a legendary still goes in, locked, its history says 「' + r.gh + '」');
  // 저장: 왕복 · 바로잡기
  r = await ev(() => {
    var base = JSON.parse(JSON.stringify(DS.G.save)), rd = function (b) { var s = JSON.parse(JSON.stringify(base)); if (b === undefined) delete s.blades; else s.blades = b; var o = DS.Save.read(JSON.stringify(s)); return o ? (o.blades === undefined ? 'none' : JSON.stringify(o.blades)) : 'fail'; };
    return [rd({ n: 23, p: 4 }), rd(undefined), rd({ n: 50, p: 99 }), rd({ n: 3.7, p: -2 }), rd({ n: 'x', p: 1 }), rd([1, 2]), rd('abc'), rd({ n: -1, p: 0 }), rd({ n: 12, p: 'q' }), rd(null)];
  });
  A(r[0] === '{"n":23,"p":4}' && r[1] === 'none', 'save: blades { n, p } round-trips through DS.Save.read, absent stays absent');
  A(r[2] === '{"n":50,"p":9}' && r[3] === '{"n":4,"p":0}' && r[4] === 'none' && r[5] === 'none' && r[6] === 'none' && r[7] === 'none' && r[8] === '{"n":12,"p":0}' && r[9] === 'none', 'save: bad values are fixed or dropped (' + r.slice(2).join(' ') + ')');
  // 빛이 오르는 길: 결과보다 높은 빛은 없다
  r = await ev(() => { var bad = 0, seen = {}; ['plain', 'prot', 'uq', 'leg'].forEach(function (k) { var top = k === 'leg' ? 'g' : k === 'uq' ? 'v' : 'w', lv = { w: 0, v: 1, g: 2 }; for (var i = 0; i < 400; i++) { var p = DS.bladesPlan(k); seen[k + p.join('')] = 1; if (p[p.length - 1] !== top || p.some(function (c) { return lv[c] > lv[top]; })) bad++; } }); return { bad: bad, seen: Object.keys(seen).sort().join(' ') }; });
  A(!r.bad && /legwvg/.test(r.seen) && /uqwv/.test(r.seen), 'suspense: the glow may step up white → violet → gold, but never past the real result (' + r.seen + ')');

  // ── 연출 ──
  await ev(() => { DS.gfxOpt = DS.gfxOpt || {}; window.__calm0 = DS.gfxOpt.calm; DS.gfxOpt.calm = false; DS.G.save.gold = 3000000; DS.openShop('blades'); });
  await sleep(400);
  const force = (k) => ev((k) => { window.__kind0 = window.__kind0 || DS.bladesKind; DS.bladesKind = k ? function () { return k; } : window.__kind0; }, k);
  const state = () => ev(() => { var o = document.querySelector('.ov.bldov'); if (!o) return null; var c = o.querySelector('.bldc'), res = o.querySelector('.bcres'); return { done: c.classList.contains('done'), calm: c.classList.contains('calm'), cards: o.querySelectorAll('.bcard').length, grid: o.querySelectorAll('.bcc').length, best: o.querySelectorAll('.bcc.best').length, title: (o.querySelector('.bctitle') || {}).textContent || '', tag: (o.querySelector('.bcard .bctag') || {}).textContent || '', note: (o.querySelector('.bcard .bcnote') || {}).textContent || '', txt: o.innerText, sw: document.documentElement.scrollWidth, right: res && !res.hidden ? res.getBoundingClientRect().right : 0, btns: o.querySelectorAll('[data-bcagain], [data-bcclose]').length }; });
  const TITLE = { plain: '한 자루를 뽑았다', uq: '이름 있는 칼이다', leg: '전설이 뽑혔다', prot: '칼 대신 부적이 나왔다' };
  for (const k of ['plain', 'uq', 'leg', 'prot']) {
    await force(k);
    const g0 = await ev(() => DS.G.save.gold);
    await ev(() => document.querySelector('.ov.bldsh [data-bpull="1"]').click());
    await sleep(900);
    let st = await state();
    A(st && !st.done && !st.cards, k + ': the cinematic is playing (no card yet at 0.9 s)');
    let t0 = Date.now(); while (Date.now() - t0 < 5000) { st = await state(); if (st.done) break; await sleep(100); }
    const ms = Date.now() - t0 + 900;
    await sleep(500); st = await state();
    A(st.done && st.cards === 1 && st.title === TITLE[k] && st.btns === 2 && ms < 4600, k + ': ends on the card by itself in about ' + (ms / 1000).toFixed(1) + ' s — 「' + st.title + '」 「' + st.tag + '」 「' + st.note + '」');
    A(!/undefined|NaN|위력|—/.test(st.txt) && st.sw <= 390 && st.right <= 390, k + ': no undefined/NaN, fits 390 px');
    const g1 = await ev(() => { var x = document.querySelector('.ov.bldov')._bld.res.list[0]; return DS.G.save.gold - (x.sold || 0) - (x.refund || 0); });
    A(g0 - g1 === 10000, k + ': exactly 10,000 gold paid (' + g0 + ' → ' + g1 + ')');
    await shot('reveal_' + k);
    await ev(() => document.querySelector('[data-bcclose]').click()); await sleep(300);
  }
  // 건너뛰기: 누르면 바로 카드
  await force('leg');
  await ev(() => document.querySelector('.ov.bldsh [data-bpull="1"]').click()); await sleep(500);
  await page.mouse.click(195, 420); await sleep(250);
  let st = await state();
  A(st.done && st.cards === 1 && st.title === TITLE.leg, 'single pull: a tap skips straight to the card');
  // 다시 뽑기: 같은 창에서 다시
  await force('uq'); await sleep(400);
  await ev(() => document.querySelector('[data-bcagain]').click()); await sleep(600);
  st = await state();
  A(st && !st.done && await ev(() => document.querySelectorAll('.ov.bldov').length === 1), 're-pull plays again in the same overlay');
  await page.mouse.click(195, 420); await sleep(250); st = await state();
  A(st.done && st.title === TITLE.uq, 're-pull: tap skips to the new card');
  await ev(() => document.querySelector('[data-bcclose]').click()); await sleep(300);
  // 열 자루
  await force(null);
  const n0 = await ev(() => (DS.G.save.blades || {}).n || 0);
  await ev(() => document.querySelector('.ov.bldsh [data-bpull="10"]').click());
  await sleep(1400); st = await state();
  A(st && !st.done && await ev(() => document.querySelectorAll('.bcrow i.on').length >= 2), '10-pull: blades come out one by one');
  await shot('ten_mid');
  let t1 = Date.now(); while (Date.now() - t1 < 6000) { st = await state(); if (st.done) break; await sleep(100); }
  await sleep(500); st = await state();
  A(st.done && st.grid === 10 && st.best === 1 && (await ev(() => (DS.G.save.blades || {}).n)) === n0 + 10, '10-pull: ends on a grid of ten cards with the best one marked (' + (Date.now() - t1 + 1400) + ' ms)');
  A(!/undefined|NaN|위력|—/.test(st.txt) && st.sw <= 390 && st.right <= 390, '10-pull: no undefined/NaN, fits 390 px');
  await shot('ten_grid');
  r = await ev(() => { var c = document.querySelectorAll('.bcc')[3]; c.click(); var d = document.querySelector('.bcdet'); return { on: c.classList.contains('on'), det: d ? d.innerText.slice(0, 40) : '' }; });
  A(r.on && r.det.length > 4, '10-pull: tapping a card shows its details (' + r.det.replace(/\n/g, ' ') + ')');
  await ev(() => document.querySelector('[data-bcclose]').click()); await sleep(300);
  await ev(() => document.querySelector('.ov.bldsh [data-bpull="10"]').click()); await sleep(500);
  await page.mouse.click(195, 420); await sleep(250); st = await state();
  A(st.done && st.grid === 10, '10-pull: a tap skips to the grid');
  await ev(() => document.querySelector('[data-bcclose]').click()); await sleep(300);
  // 움직임 줄이기: 바로 카드
  await ev(() => { DS.gfxOpt.calm = true; }); await force('leg');
  await ev(() => document.querySelector('.ov.bldsh [data-bpull="1"]').click()); await sleep(120); st = await state();
  A(st.done && st.calm && st.cards === 1, 'reduced motion: the card shows at once');
  r = await ev(() => { var c = document.querySelector('.bldc'); return { shake: getComputedStyle(c.querySelector('.bcstage')).animationName, flash: getComputedStyle(c.querySelector('.bcflash')).display }; });
  A(r.shake === 'none' && r.flash === 'none', 'reduced motion: no shake, no flash');
  await ev(() => document.querySelector('[data-bcclose]').click()); await sleep(300);
  await ev(() => document.querySelector('.ov.bldsh [data-bpull="10"]').click()); await sleep(120); st = await state();
  A(st.done && st.grid === 10, 'reduced motion: the 10-pull grid shows at once');
  await ev(() => { document.querySelector('[data-bcclose]').click(); DS.gfxOpt.calm = window.__calm0; }); await sleep(300);
  await force(null);
  // 골드가 모자라면 단추가 잠긴다
  await L.closeAll(page);
  r = await ev(() => { var out = []; [5000, 50000].forEach(function (g) { DS.G.save.gold = g; DS.openShop('blades'); var o = document.querySelectorAll('.ov.bldsh'); o = o[o.length - 1]; out.push({ d: [].map.call(o.querySelectorAll('[data-bpull]'), function (b) { return b.disabled; }), why: [].map.call(o.querySelectorAll('.bldwhy'), function (e) { return e.textContent; }) }); DS.ui.closeAll(); }); return out; });
  A(r[0].d.join() === 'true,true' && /골드가 모자라다\. 5,000 \/ 10,000/.test(r[0].why[0]) && r[1].d.join() === 'false,true' && r[1].why.length === 1, 'gold short: buttons are disabled with the reason (' + r[0].why.concat(r[1].why).join(' | ') + ')');
  // 가로 화면
  await ev(() => { DS.G.save.gold = 3000000; DS.openShop('blades'); });
  await page.setViewportSize({ width: 844, height: 390 }); await sleep(400);
  await shot('window_landscape');
  await ev(() => { DS.gfxOpt.calm = true; document.querySelector('.ov.bldsh [data-bpull="10"]').click(); }); await sleep(300);
  r = await ev(() => { var o = document.querySelector('.ov.bldov'), res = o.querySelector('.bcres').getBoundingClientRect(), b = o.querySelector('[data-bcagain]').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, res: [Math.round(res.left), Math.round(res.right)], btn: Math.round(b.bottom), h: innerHeight }; });
  await shot('ten_landscape');
  A(r.sw <= 844 && r.res[1] <= 844 && r.btn <= r.h + 1, 'landscape: grid and buttons fit (' + JSON.stringify(r) + ')');
  await ev(() => { document.querySelector('[data-bcclose]').click(); DS.gfxOpt.calm = window.__calm0; });
  await page.setViewportSize({ width: 390, height: X.H }); await sleep(300);
  // 시나리오 · 싸움 중에는 열리지 않는다 (다른 가게와 같은 막음)
  r = await ev(() => { var G = DS.G, keep = G.scn; DS.ui.closeAll(); G.scn = { id: 1 }; var o = DS.openBlades(), why = DS.bladesWhy(G.save, 1); G.scn = keep; return { o: !!o, why: why }; });
  A(!r.o && /시나리오/.test(r.why), 'not during a scenario (' + r.why + ')');
};
