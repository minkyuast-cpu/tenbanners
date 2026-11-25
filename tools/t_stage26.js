// 전민 — 2.6.0 연출 시험 (src/stage.js · game.js story())
//   PAGE=../dist/test.html H=844 OUT=qa_out/stage26 node tools/shot.js tools/t_stage26.js
// ① 도입의 무대: 검은 화면(첫 두 줄) → 밤 언덕(아홉 깃발이 내려간다) → 단톡방 말풍선 → 마을. 전장 메모는 이야기에 없고 코치 표시로 뜬다
// ② 이야기 창: 타자(첫 탭은 줄을 마저 띄우고 둘째 탭이 넘긴다) · ◀ · 두 번 누름이 줄을 건너뛰지 않는다 · 화자가 바뀌면 초상이 튄다 · 조용한 시험은 바로
// ③ 이름 낭독(roll): 이름이 하나씩 가운데에 뜨고 상자에 모인다 · 30번 맺음의 세 줄에 표시가 붙어 있다 · 모르는 길(DS.storyResolve)에는 해가 없다
// ④ 깃대: 마을 한가운데 · 20번 전에는 「낡은 깃발」 · 대마다 새긴 이름 · 이름 카드 · 「이름을 부른다」(저장은 그대로) · 영웅관의 추모는 깃대로 가는 줄
// ⑤ 쓰러짐 창: 죽음 연출 뒤에 · 두 줄 + 「자세히」
// ⑥ 교회의 의식: 「교회로」 → 마을 · HUD 걷힘 · 촛불 → 추도 ↔ 후계를 오가도 비문과 가족의 말이 그대로 → 후계 → 마을
// ⑦ 엔딩의 무대: HUD 걷힘 · 해돋이 · 「1」 말풍선 · 먼저 간 이름 낭독 · 마지막 줄 머묾 · 기록 → 들판 (먼저 간 이가 있는 저장 / 없는 저장)
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async function (page, shot, L, X) {
  const ev = (fn, arg) => page.evaluate(fn, arg), sleep = L.sleep;
  const A = (ok, msg) => { console.log((ok ? 'ok  ' : 'FAIL ') + msg); if (!ok) throw new Error(msg); };
  const until = async (fn, ms, arg) => { const t0 = Date.now(); for (;;) { const v = await ev(fn, arg); if (v) return v; if (Date.now() - t0 > (ms || 8000)) return v; await sleep(120); } };
  const top = () => ev(() => { var o = document.querySelector('.ov.story'); if (!o) return null; var b = o.querySelector('.story-box'); return { cls: o.className, beat: o.dataset.beat || '', k: b.dataset.k || '', w: o.querySelector('.who').textContent, t: o.querySelector('.line').textContent, box: b.className, next: o.querySelector('.next').textContent, back: !o.querySelector('.back').hidden }; });
  const tapLine = () => page.click('.ov.story .story-box .line', { force: true }).catch(() => {});
  const land = async (name) => { await page.setViewportSize({ width: 844, height: 390 }); await sleep(500); await shot(name); await page.setViewportSize({ width: X.W, height: X.H }); await sleep(400); };

  // ── ① 도입 ──
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload(); await page.waitForSelector('#btnNew', { timeout: 30000 });
  await page.click('#btnNew'); await page.waitForSelector('#cmdName');
  await page.fill('#cmdName', '새벽'); await page.click('[data-c="cav"]'); await page.click('#goNew');
  await page.waitForSelector('.ov.story.stg-pro', { timeout: 10000 });
  let c = await ev(() => { var o = document.querySelector('.ov.story'), r = o.getBoundingClientRect(), a = document.querySelector('#app').getBoundingClientRect(), e = document.elementFromPoint(a.left + 40, a.top + 30); return { full: r.height >= a.height - 1 && r.width >= a.width - 1, bg: getComputedStyle(o).backgroundColor, over: !!(e && e.closest('.ov.story')), exp: DS.storyResolve(DS.LORE.prologue).length, memo: DS.storyResolve(DS.LORE.prologue).filter(function (l) { return l.w === '전장 메모'; }).length }; });
  A(c.full && c.over && /rgb\(5, 4, 10\)/.test(c.bg), 'prologue opens as a full-screen black stage over the town and HUD (' + c.bg + ')');
  const pro = [];
  let shotB = 0;
  for (let i = 0; i < 40; i++) {
    await sleep(300); let l = await top(); if (!l || /\bout\b/.test(l.cls)) break;
    if (/typing/.test(l.box)) { await sleep(1300); l = await top(); }
    l.down = await ev(() => { var cv = document.querySelector('.stg-pro .stg-cv'); return cv && cv._art ? cv._art.down() : -1; });
    l.cv = await ev(() => +getComputedStyle(document.querySelector('.stg-pro .stg-cv')).opacity);
    l.log = await ev(() => document.querySelectorAll('.ov.story .stg-log .sbub').length);
    l.logHero = await ev(() => [].map.call(document.querySelectorAll('.ov.story .stg-log .sbub.k-hero .mh'), function (x) { return x.textContent; }).join('|'));
    pro.push(l);
    if (i === 0) await shot('pro_black_1');
    if (i === 1) await shot('pro_black_2');
    if (l.beat === 'b' && shotB < 2) { await sleep(1300); await shot('pro_hill_' + (++shotB)); if (shotB === 2) await land('pro_hill_landscape'); }
    if (l.beat === 'b' && pro.filter(x => x.beat === 'b').length === 4) { await sleep(900); await shot('pro_hill_last'); }
    if (l.beat === 'c' && l.log === 2) await shot('pro_chat');
    await tapLine();
  }
  console.log('     ' + pro.map(l => l.beat + ':' + l.k + ':' + l.down).join(' '));
  const bA = pro.filter(l => l.beat === 'a'), bB = pro.filter(l => l.beat === 'b'), bC = pro.filter(l => l.beat === 'c');
  A(pro.length === c.exp - c.memo && c.memo >= 1 && !pro.some(l => l.w === '전장 메모' || /마을 위쪽 출구/.test(l.t)), 'prologue: ' + pro.length + ' lines play, the ' + c.memo + ' controls memo line is not in the story');
  A(bA.length === 2 && /두 번 죽는다/.test(bA[0].t) && bA.every(l => l.k === 'nar' && l.cv < 0.05), 'beat 1: the first two lines on black, centred (art hidden)');
  A(bB.length >= 1 && bB.every(l => l.k === 'nar') && bB[bB.length - 1].down === 9 && bB.every((l, i) => !i || l.down >= bB[i - 1].down) && bB[0].down < 9, 'beat 2: night hill, banners lower step by step over ' + bB.length + ' lines (' + bB.map(l => l.down).join(' → ') + '), one stays');
  A(bC.length >= 3 && bC.some(l => l.k === 'chat' && l.w === '선대 단톡방') && bC.some(l => l.k === 'hero' && l.w === '새벽') && bC.some(l => l.log >= 2) && bC.some(l => /새벽/.test(l.logHero)) && bC.every(l => !/선대/.test(l.logHero)), 'beat 3: 단톡방 and the 맹주 speak in chat bubbles, earlier bubbles stay above');
  await until(() => !document.querySelector('.ov.story'), 4000);
  c = await until(() => { var k = document.querySelector('.coach p'); return k && /출구/.test(k.textContent) ? k.textContent : ''; }, 20000);
  A(/출구/.test(c || ''), 'after the cross-fade the controls line comes as a coach mark on the exit: 「' + c + '」');
  await shot('pro_coach');
  c = await ev(() => { var p = DS.G.zone.pois.filter(function (p) { return p.kind === 'pole'; })[0]; return p ? { label: p.label, x: p.x, y: p.y, info: DS.poleInfo(DS.G.save).name } : null; });
  A(c && c.label === '낡은 깃발' && c.info === '낡은 깃발', 'town centre has the pole point of interest; before stage 20 it is 「' + (c && c.label) + '」');
  await ev(() => { document.querySelectorAll('.coach').forEach(function (x) { x.remove(); }); DS.poleOpen(); }); await sleep(400);
  c = await ev(() => { var o = document.querySelector('.ov.poleov'); return { h2: o.querySelector('h2').textContent, none: !!o.querySelector('.pl-none'), names: o.querySelectorAll('.pl-n').length, old: !!o.querySelector('.polew.k-old') }; });
  await shot('pole_old_empty');
  A(c.h2 === '낡은 깃발' && c.none && c.names === 0 && c.old, 'the old flag staff opens the same window with no names yet');

  // ── ② 이야기 창의 결 ──
  await ev(() => { DS.ui.closeAll(); document.querySelectorAll('.coach').forEach(function (x) { x.remove(); }); DS.G.quiet = false; });
  const LONG = '타자가 끝나기 전에 누르면 줄이 마저 뜬다. 한 번 더 눌러야 다음 줄로 넘어간다.';
  await ev((t) => { window.__st = ''; DS.ui.story([t, { w: '옛 맹주 먼동', c: 'elder_mundong', t: '둘째 줄은 먼동이 말한다.' }, { w: '새벽', c: 'cav', t: '셋째 줄은 맹주가 말한다. 조금 길게 써 둔다.' }, '넷째 줄.'], function () { window.__st = 'end'; }, '시험'); }, LONG);
  await sleep(420);
  c = await ev(() => { var o = document.querySelector('.ov.story'), l = o.querySelector('.line'), a = l.querySelector('.tw'), b = l.querySelector('.tw-r'); return { full: l.textContent, on: a ? a.textContent.length : -1, rest: b ? b.textContent.length : -1, vis: b ? getComputedStyle(b).visibility : '', typing: o.querySelector('.story-box').classList.contains('typing') }; });
  await shot('type_mid');
  A(c.full === LONG && c.on > 5 && c.on < LONG.length && c.rest > 0 && c.vis === 'hidden' && c.typing, 'typewriter: ' + c.on + ' of ' + LONG.length + ' characters shown after 0.4 s, the rest is laid out but hidden, .line still holds the whole text');
  await tapLine(); await sleep(60);
  c = await top();
  A(c.t === LONG && !/typing/.test(c.box) && /^1 \/ 4/.test(c.next), 'first tap completes the line (still line 1)');
  await sleep(260); await tapLine(); await sleep(150);
  c = await ev(() => { var o = document.querySelector('.ov.story'); return { n: o.querySelector('.next').textContent, pop: o.querySelector('.sp').classList.contains('pop'), back: !o.querySelector('.back').hidden, w: o.querySelector('.who').textContent }; });
  A(/^2 \/ 4/.test(c.n) && c.pop && c.back && c.w === '옛 맹주 먼동', 'second tap advances; the portrait pops for the new speaker; ◀ is offered');
  await sleep(900); await shot('type_line2');
  await page.click('.ov.story .back'); await sleep(120);
  c = await top();
  A(c.t === LONG && /^1 \/ 4/.test(c.next) && !/typing/.test(c.box) && !c.back, '◀ re-reads the previous line (shown at once)');
  await sleep(300);
  await tapLine(); await sleep(50); await tapLine(); await sleep(500);      // 두 번 누름
  c = await top();
  A(/^2 \/ 4/.test(c.next), 'double tap on a finished line moves one line only (now ' + c.next.trim() + ')');
  await sleep(700); await tapLine(); await sleep(300); await tapLine(); await sleep(60); await tapLine(); await sleep(400);
  c = await top();
  A(c && /^3 \/ 4/.test(c.next) && !/typing/.test(c.box), 'a tap right after a line appears does not skip it: the next tap only completes it (' + c.next.trim() + ')');
  await sleep(300); await tapLine(); await sleep(900); await tapLine(); await sleep(300); await tapLine(); await sleep(300);
  A(await until(() => window.__st === 'end' && !document.querySelector('.ov.story'), 3000), 'the story ends and calls back');
  await ev((t) => { DS.G.quiet = true; DS.ui.story([t, '둘째 줄.'], null, '시험'); }, LONG); await sleep(120);
  c = await ev(() => { var l = document.querySelector('.ov.story .line'); return { tw: !!l.querySelector('.tw'), t: l.textContent }; });
  A(!c.tw && c.t === LONG, 'quiet mode: the line is there at once');
  await L.skipStory(page); await ev(() => DS.ui.closeAll());
  await ev((t) => { DS.G.quiet = false; DS.G.save.opt.calm = true; DS.applyCalm(); DS.ui.story([t, { t: '가. 나. 다.', roll: 1 }, '셋째 줄.'], null, '시험'); }, LONG); await sleep(150);
  c = await ev(() => { var l = document.querySelector('.ov.story .line'); return { tw: !!l.querySelector('.tw'), t: l.textContent }; });
  await sleep(200); await tapLine(); await sleep(150);
  const cr = await ev(() => { var o = document.querySelector('.ov.story'); return { c: !!o.querySelector('.roll-c'), on: o.querySelectorAll('.line .rn.on').length }; });
  A(!c.tw && c.t === LONG && !cr.c && cr.on === 4, 'reduced motion (설정): lines and the roll come at once, one tap per line');
  await ev(() => { DS.ui.closeAll(); DS.G.save.opt.calm = null; DS.applyCalm(); DS.G.quiet = true; });

  // ── ③ 이름 낭독 ──
  c = await ev(() => { var o30 = DS.scn(30).outro, R = DS.storyRoll; var tagged = o30.filter(function (l) { return l && typeof l === 'object' && l.roll; }), res = DS.storyResolve(o30);
    return { n: tagged.length, parsed: tagged.map(function (l) { var r = R(l, l.t); return r ? r.parts.map(function (p) { return p.n; }).join('|') + ' / lead「' + r.lead + '」tail「' + r.tail + '」' : null; }), plain: res.every(function (l) { return typeof l.t === 'string' && l.t.length > 0; }),
      arr: (function () { var r = R({ roll: ['가람', '옹달 2세'] }, '쓰러진 이 2명. 가람. 옹달 2세. 단톡방에 2명이 들어왔다.'); return r ? r.lead + '[' + r.parts.map(function (p) { return p.t; }).join('][') + ']' + r.tail : null; })(),
      bad: R({ roll: 1 }, '') === null && R({ roll: ['없는 이름'] }, '다른 글') === null && R('글', '글') === null }; });
  console.log('     ' + JSON.stringify(c.parsed));
  A(c.n === 2 && /^바우\|우레\|제비\|너울\|서슬\|솔개\|달래\|등불\|슬기\|그믐 /.test(c.parsed[0]) && /^나루\|마루\|돌쇠\|평원지기\|벨마르\|먼동 \/ lead「뒷줄이 받아 불렀다\. 「」tail「」」/.test(c.parsed[1]) && c.plain, '30 outro: the name-reading lines carry the roll flag and parse into names (no fallen yet: ' + c.n + ' lines); old read paths still resolve plain text');
  A(c.arr === '쓰러진 이 2명. [가람. ][옹달 2세. ]단톡방에 2명이 들어왔다.' && c.bad, 'roll: [names] finds the names inside a sentence; a line that does not parse falls back to a normal line');
  await ev(() => { DS.G.quiet = false; window.__st = ''; DS.ui.story([{ w: '{hero}', c: 'hero', t: '그리고 가람. 나래. 다솜.', roll: 1 }, '가운데.', '끝.'], function () { window.__st = 'end'; }, '시험'); });
  await sleep(380);
  let r1 = await ev(() => { var o = document.querySelector('.ov.story'), c = o.querySelector('.roll-c'); return { c: !!c, name: c ? c.querySelector('b').textContent : '', on: o.querySelectorAll('.line .rn.on').length, n: o.querySelectorAll('.line .rn').length, t: o.querySelector('.line').textContent, rolling: o.querySelector('.story-box').classList.contains('rolling') }; });
  await shot('roll_1');
  await sleep(560);
  let r2 = await ev(() => { var o = document.querySelector('.ov.story'), c = o.querySelector('.roll-c'); return { name: c ? c.querySelector('b').textContent : '', on: o.querySelectorAll('.line .rn.on').length }; });
  await shot('roll_2');
  await sleep(1500);
  let r3 = await ev(() => { var o = document.querySelector('.ov.story'); return { c: !!o.querySelector('.roll-c'), on: o.querySelectorAll('.line .rn.on').length, rolling: o.querySelector('.story-box').classList.contains('rolling'), next: o.querySelector('.next').textContent }; });
  await shot('roll_done');
  A(r1.c && r1.name === '가람' && r1.on === 0 && r1.n === 4 && r1.t === '그리고 가람. 나래. 다솜.' && r1.rolling && r2.name === '나래' && r2.on === 1 && !r3.c && r3.on === 4 && !r3.rolling && /^1 \/ 3/.test(r3.next),
    'roll-call: names come one at a time in the centre (' + r1.name + ' → ' + r2.name + '), gather into the box, and the line waits for a tap');
  await tapLine(); await sleep(400); await tapLine(); await sleep(300); await tapLine(); await sleep(300);
  await until(() => window.__st === 'end', 2500);
  await ev(() => { window.__st = ''; DS.ui.story([{ t: '가. 나. 다. 라. 마.', roll: 1 }, '가운데.', '끝.'], function () { window.__st = 'end'; }, '시험'); });
  await sleep(600); await tapLine(); await sleep(120);
  c = await ev(() => { var o = document.querySelector('.ov.story'); return { c: !!o.querySelector('.roll-c'), on: o.querySelectorAll('.line .rn.on').length, next: o.querySelector('.next').textContent }; });
  A(!c.c && c.on === 6 && /^1 \/ 3/.test(c.next), 'a tap during the roll shows all names at once (first tap completes)');
  await ev(() => { DS.G.quiet = true; DS.ui.closeAll(); DS.ui.story([{ t: '가. 나. 다.', roll: 1 }], null, '시험'); }); await sleep(100);
  c = await ev(() => { var o = document.querySelector('.ov.story'); return { c: !!o.querySelector('.roll-c'), on: o.querySelectorAll('.line .rn.on').length, t: o.querySelector('.line').textContent }; });
  A(!c.c && c.on === 4 && c.t === '가. 나. 다.', 'quiet mode: the roll is instant');
  await ev(() => DS.ui.closeAll());

  // ── 저장: 먼저 간 이가 있는 26번 저장(tools/fixtures/v225.json)을 29번까지 올린다 ──
  const raw = fs.readFileSync(path.join(__dirname, 'fixtures', 'v225.json'), 'utf8');
  const loadLate = async () => {
    await ev((raw) => { DS.ui.closeAll(); DS.G.running = false; DS.G.save = null; try { localStorage.clear(); } catch (e) {} localStorage.setItem('tenbanners_v4', raw); }, raw);      // 떠날 때의 저장이 덮어쓰지 않게 판을 먼저 내려놓는다
    await page.reload(); await page.waitForSelector('#btnCont', { timeout: 30000 }); await sleep(600);
    await ev(() => document.querySelector('#btnCont').click()); await sleep(1500);
    await ev(() => { DS.G.quiet = true; }); await L.skipStory(page); await ev(() => DS.ui.closeAll()); await sleep(300);
    await L.edit(page, function () { for (var id = 1; id <= 29; id++) if (!s.cleared[id]) DS.applyClear(s, DS.scn(id)); s.opt.cine = 'full'; s.opt.speed = 1; if (s.cineQ) delete s.cineQ; });
    await ev(() => { DS.ui.closeAll(); DS.enterZone('haemil', null, { x: 10, y: 10 }); }); await sleep(900);
    for (let i = 0; i < 12 && (await ev(() => !!document.querySelector('.cine, #app .ov'))); i++) { await ev(() => { if (DS.cineBusy()) DS.cineSkip(); DS.ui.closeAll(); }); await sleep(350); }
  };
  await loadLate();

  // ── ④ 깃대 ──
  let info = await ev(() => { var s = DS.G.save, p = DS.G.zone.pois.filter(function (p) { return p.kind === 'pole'; })[0], d = DS.poleData(s), cv = document.querySelector('#cv').getBoundingClientRect(), sc = DS.G.view.screenOf(p.x, p.y);
    return { label: p.label, fallen: (s.fallen || []).length, count: DS.poleCount(s), gens: d.map(function (g) { return g.g + ':' + g.names.length + (g.cur ? '*' : ''); }).join(' '), x: cv.left + sc.x, y: cv.top + sc.y, hero: DS.G.sim.byId[DS.G.sel] ? [DS.G.sim.byId[DS.G.sel].x, DS.G.sim.byId[DS.G.sel].y] : null, dead: DS.storyDead(s).map(function (x) { return x.n; }) }; });
  console.log('     ' + JSON.stringify(info));
  A(info.label === '맹세의 깃대' && info.count >= info.fallen && info.fallen > 0, 'after stage 20 the pole is 「맹세의 깃대」; ' + info.count + ' names in generations ' + info.gens);
  await shot('town_pole');
  const before = await ev(() => JSON.stringify([DS.G.save.fallen, DS.G.save.lin, DS.G.save.seen, DS.G.save.gold]));
  await page.mouse.click(info.x, info.y); await sleep(700);
  if (!(await ev(() => !!document.querySelector('.ov.poleov')))) { await sleep(1500); }
  c = await ev(() => { var o = document.querySelector('.ov.poleov'); if (!o) return null; var r = o.querySelector('.sheet').getBoundingClientRect(), a = document.querySelector('#app').getBoundingClientRect(); return { full: r.height >= a.height - 2, h2: o.querySelector('h2').textContent, gens: o.querySelectorAll('.pl-g').length, names: o.querySelectorAll('.pl-n').length, heads: o.querySelectorAll('.pl-n.hd').length, h5: [].map.call(o.querySelectorAll('.pl-g h5'), function (h) { return h.textContent; }), bad: /undefined|NaN|\[object/.test(o.innerText) }; });
  A(c && c.full && c.h2 === '맹세의 깃대' && c.gens >= 1 && c.names === info.count && !c.bad, 'tapping the pole in town opens the full-screen pole: ' + c.names + ' engraved names in ' + c.gens + ' generations (' + c.h5.join(' / ') + ')');
  await shot('pole_open');
  const pick = await ev(() => { var bs = [].slice.call(document.querySelectorAll('.ov.poleov .pl-n')), s = DS.G.save, i = bs.findIndex(function (b) { var f = (s.fallen || []).filter(function (f) { return f.n === b.textContent && f.lw; })[0]; return !!f; }); if (i < 0) i = 0; bs[i].click(); return bs[i].textContent; });
  await sleep(400);
  c = await ev(() => { var k = document.querySelector('.ov.poleov .pl-card'); return { on: k && !k.hidden, name: k.querySelector('h3').textContent, face: !!k.querySelector('.pc-f canvas'), grey: getComputedStyle(k.querySelector('.pc-f')).filter, dt: [].map.call(k.querySelectorAll('dt'), function (d) { return d.textContent; }), txt: k.innerText.replace(/\n+/g, ' / '), call: !!k.querySelector('[data-pcall]') }; });
  A(c.on && c.name === pick && c.face && /grayscale/.test(c.grey) && c.dt.indexOf('쓰러진 곳') >= 0 && c.call && !/undefined|NaN/.test(c.txt), 'name card for ' + pick + ': greyed portrait, ' + c.dt.join(' · ') + ' — ' + c.txt.slice(0, 120));
  await shot('pole_card');
  await page.click('.ov.poleov [data-pcall]'); await sleep(350);
  c = await ev(() => { var o = document.querySelector('.ov.poleov'); return { glow: !!o.querySelector('.pl-n.call'), h3: !!o.querySelector('.pc-in h3.call'), say: o.querySelector('.pc-say').textContent }; });
  await shot('pole_call');
  A(c.glow && c.h3 && c.say === '…또 불러라.', '「이름을 부른다」: the name glows and answers 「' + c.say + '」');
  await sleep(2400);
  c = await ev((b) => ({ glow: !!document.querySelector('.ov.poleov .pl-n.call'), same: JSON.stringify([DS.G.save.fallen, DS.G.save.lin, DS.G.save.seen, DS.G.save.gold]) === b }), before);
  A(!c.glow && c.same, 'the glow fades after about 2 s and nothing in the save changed (cosmetic only)');
  await land('pole_landscape');
  // 유품: 그 사람이 남긴 장비가 있으면 카드에 한 줄 (저장은 시험 뒤에 되돌린다)
  c = await ev((nm) => {
    var s = DS.G.save, h = s.chars[s.hero], id = h.w, keep = s.gh ? JSON.stringify(s.gh) : null; if (!id || !DS.gear(id)) return { skip: 1 };
    s.gh = s.gh || {}; s.gh[id] = { h: [], hl: { n: nm, p: 0, lw: '', at: '', hc: h.id, hn: '', k: 'c', N: 1, g: 1 } };
    DS.ui.closeAll(); DS.poleOpen();
    var o = document.querySelector('.ov.poleov:not(.ghost)'), b = [].filter.call(o.querySelectorAll('.pl-n'), function (x) { return x.textContent === nm; })[0]; b.click();      // 닫히는 창의 복제본(.ghost)은 빼고
    var k = o.querySelector('.pl-card'), dts = [].map.call(k.querySelectorAll('dt'), function (d) { return d.textContent; }), i = dts.indexOf('유품'), out = { has: i >= 0, t: i >= 0 ? k.querySelectorAll('dd')[i].textContent : '', gear: DS.gear(id).short || DS.gear(id).name };
    if (keep == null) delete s.gh; else s.gh = JSON.parse(keep);
    return out;
  }, pick);
  A(c.skip || (c.has && c.t.indexOf(c.gear) === 0 && /들고 있다/.test(c.t)), 'name card links the heirloom they left: ' + (c.skip ? '(no weapon to test with)' : c.t));
  await sleep(300); await shot('pole_heirloom');
  await ev(() => { DS.ui.closeAll(); DS.openShop('merc'); }); await sleep(400);
  c = await ev(() => { var o = document.querySelector('#app .ov'), b = o.querySelector('[data-polego]'); return { link: b ? b.textContent : '', old: !!o.querySelector('[data-pfold="mfl"]') }; });
  A(/추모 \d+명/.test(c.link) && /맹세의 깃대/.test(c.link) && !c.old, 'recruit shop: the memorial fold is now a link to the pole (' + c.link + ')');
  await page.click('[data-polego]'); await sleep(400);
  A(await ev(() => !!document.querySelector('.ov.poleov') && !document.querySelector('.ov .gacha')), 'the link closes the shop and opens the pole');
  await ev(() => DS.ui.closeAll());

  // ── ⑤ 쓰러짐 창 ──
  await ev(() => { DS.G.quiet = true; DS.ui.closeAll(); DS.startScenario(DS.scn(27)); DS.G.pause = true; }); await sleep(900);
  await L.skipStory(page); await ev(() => DS.ui.closeAll());
  const t0 = Date.now();
  let fell = await ev(() => { var G = DS.G, sim = G.sim, s = G.save; G.quiet = false; G.pause = false; var u = sim.cmds().filter(function (u) { return u.ch !== s.hero; })[0]; var nm = u.name; sim.kill(u); return nm; });
  await sleep(700);
  A(await ev(() => !document.querySelector('.ov .result.fell')), 'a 가주 (' + fell + ') falls: no modal over the death scene at 0.7 s');
  await shot('fall_zoom');
  await until(() => !!document.querySelector('.ov .result.fell2'), 7000);
  const tFell = Date.now() - t0;
  await sleep(500); await shot('fall_modal');
  c = await ev(() => { var o = document.querySelector('.ov .result.fell2'); if (!o) return null; var ps = [].filter.call(o.querySelectorAll('p'), function (p) { return !p.hidden; }).map(function (p) { return p.textContent; }); return { ps: ps, more: !!o.querySelector('[data-fellmore]'), det: o.querySelector('.felldet').hidden, lw: o.querySelector('.felllw') ? o.querySelector('.felllw').textContent : '', btn: [].map.call(o.querySelectorAll('.btn'), function (b) { return b.textContent; }) }; });
  A(c && tFell >= 1500 && c.ps.length === 2 && /쓰러졌다\. 돌아오지 못한다\.$/.test(c.ps[0]) && c.ps[1] === '지금 물러나면 남은 사람은 산다.' && c.more && c.det && c.btn.join('|') === '퇴각|계속 싸우기', 'the fall modal comes after the death scene (' + tFell + ' ms) with two lines only: ' + c.ps.join(' / ') + (c.lw ? ' · last words ' + c.lw : ''));
  await page.click('[data-fellmore]'); await sleep(150);
  c = await ev(() => { var d = document.querySelector('.ov .felldet'); return { on: !d.hidden, t: d.textContent }; });
  A(c.on && /막사에 같은 병과/.test(c.t), '「자세히」 opens the rest: ' + c.t.slice(0, 60) + '…');
  await shot('fall_detail');
  await sleep(600); await page.click('.ov .result.fell2 [data-close]'); await sleep(400);

  // ── ⑥ 교회의 의식 ──
  await ev(() => { var sim = DS.G.sim; sim.cmds().slice().forEach(function (u) { sim.kill(u); }); });
  await until(() => !!document.querySelector('.ov .result.lose [data-close]'), 12000);
  for (let i = 0; i < 10 && (await ev(() => DS.cineBusy && DS.cineBusy())); i++) { await ev(() => DS.cineSkip()); await sleep(300); }
  await sleep(600); await shot('lose');
  c = await ev(() => ({ scn: !!DS.G.scn, btn: document.querySelector('.ov .result.lose [data-close]').textContent, vac: DS.linVacant(DS.G.save).length }));
  A(c.scn && c.btn === '교회로' && c.vac === 1, 'wipe: the lose screen still closes with 「교회로」 (맹주 seat vacant)');
  await page.click('.ov .result.lose [data-close]');
  await sleep(250); await shot('church_fade');
  await until(() => !!document.querySelector('#stgkeep.rite'), 4000);
  c = await ev(() => { var s = DS.G.save, k = document.querySelector('#stgkeep.rite'); return { town: !!(DS.G.zone && DS.G.zone.town), zone: DS.G.zone.id, scn: !!DS.G.scn, ending: DS.G.ending, top: getComputedStyle(document.querySelector('#top')).visibility, bot: getComputedStyle(document.querySelector('#bot')).visibility, candles: k.querySelectorAll('.cdl').length, embers: k.querySelectorAll('.emb').length, label: (k.querySelector('.rv-at') || {}).textContent, vac: !!s.chars[s.hero].vac, szone: s.zone }; });
  A(c.town && !c.scn && !c.ending && c.top === 'hidden' && c.bot === 'hidden' && c.candles >= 5 && c.embers >= 5 && c.vac && c.szone === c.zone, 'the rite is held in town at the church (' + c.label + '): scenario left, battle HUD hidden, ' + c.candles + ' candles, 맹주 seat still vacant (no auto heir)');
  for (let i = 0; i < 20 && !(await ev(() => !!document.querySelector('.ov.rite .lgrite h2'))); i++) { await ev(() => { if (DS.cineBusy()) DS.cineSkip(); }); await sleep(400); }
  await sleep(700); await shot('church_rite');
  const ep = async () => ev(() => { var o = document.querySelector('.ov.rite'); return { ep: (o.querySelector('.ep') || {}).textContent || '', mourn: [].map.call(o.querySelectorAll('.lgmourn q'), function (q) { return q.textContent; }).join(' | '), step: (o.querySelector('.eyebrow') || {}).textContent }; });
  const e0 = await ep(), seenEp = [e0];
  for (let i = 0; i < 4; i++) {
    await page.click('.ov.rite [data-lgstep="pick"]'); await sleep(300);
    if (i === 0) await shot('church_heir');
    await page.click('.ov.rite [data-lgstep="mourn"]'); await sleep(300);
    seenEp.push(await ep());
  }
  A(e0.step === '추도' && e0.ep.length > 4 && seenEp.every(e => e.ep === e0.ep && e.mourn === e0.mourn), 'B3: going back and forth between 추도 and 후계 keeps the epitaph and the family lines (「' + e0.ep + '」' + (e0.mourn ? ' · ' + e0.mourn : '') + ')');
  c = await ev(() => ({ rites: document.querySelectorAll('.ov.rite').length, bg: getComputedStyle(document.querySelector('.ov.rite')).backgroundColor }));
  A(c.rites === 1, 'only one rite window (the town-entry news does not open a second one); backdrop ' + c.bg);
  const finishRite = async () => {      // 후계를 고르고 의식을 끝까지
    await page.click('.ov.rite [data-lgstep="pick"]'); await sleep(300);
    await page.click('.ov.rite [data-lgheir]'); await sleep(1100);
    await page.click('.ov.rite #yesHeir'); await sleep(500);
    for (let i = 0; i < 40; i++) {
      const st = await ev(() => ({ keep: !!document.querySelector('#stgkeep'), ov: !!document.querySelector('#app .ov:not(.ghost)'), story: !!document.querySelector('.ov.story'), cine: DS.cineBusy() }));
      if (!st.keep && !st.ov && !st.cine) break;
      if (st.cine) { await sleep(750); await ev(() => DS.cineSkip()); } else if (st.story) { await tapLine(); } else if (st.ov) { await ev(() => { var b = document.querySelector('#app .ov:not(.ghost) [data-close]'); if (b) b.click(); }); }
      await sleep(350);
    }
  };
  await finishRite();
  await sleep(900);
  c = await ev(() => { var s = DS.G.save, h = s.chars[s.hero], u = DS.G.sim.byId['c' + s.hero], z = DS.G.zone, ch = z.pois.filter(function (p) { return p.kind === 'church'; })[0]; return { vac: !!h.vac, keep: !!document.querySelector('#stgkeep'), top: getComputedStyle(document.querySelector('#top')).visibility, town: !!z.town, near: u && ch ? Math.abs(u.x - ch.x) + Math.abs(u.y - (ch.y + 1)) : -1, busy: !!DS.G.riteBusy, hold: DS.G.hold, ovs: document.querySelectorAll('#app .ov:not(.ghost)').length + (DS.cineBusy() ? 1 : 0), name: DS.charName(h) }; });
  A(!c.vac && !c.keep && c.top === 'visible' && c.town && c.near >= 0 && c.near <= 3 && !c.busy && c.hold === c.ovs, 'after the rite: new 맹주 ' + c.name + ' stands at the church door, veil gone, HUD back ' + JSON.stringify(c));
  await shot('church_after');
  await ev(() => DS.ui.closeAll());
  // 맹주를 잃고 물러났을 때: 의식은 싸움터를 가린 장막 위에서, 끝나면 들판으로
  await ev(() => { DS.G.quiet = true; DS.ui.closeAll(); DS.enterZone('haemil'); DS.startScenario(DS.scn(27)); DS.G.pause = true; }); await sleep(900);
  await L.skipStory(page); await ev(() => DS.ui.closeAll());
  await ev(() => { var G = DS.G, sim = G.sim; G.quiet = false; G.pause = false; sim.kill(sim.byId['c' + G.save.hero]); });
  await until(() => !!document.querySelector('.ov .result.fell2 #yesRet'), 8000);
  c = await ev(() => { var o = document.querySelector('.ov .result.fell2'); return [].filter.call(o.querySelectorAll('p'), function (p) { return !p.hidden; }).map(function (p) { return p.textContent; }); });
  A(c.length === 2 && /돌아오지 못한다\.$/.test(c[0]), 'the 맹주 falls: the same two-line modal (' + c.join(' / ') + ')');
  await sleep(900); await page.click('.ov .result.fell2 #yesRet');
  await until(() => !!document.querySelector('#stgkeep.rite.solid'), 3000);
  for (let i = 0; i < 20 && !(await ev(() => !!document.querySelector('.ov.rite .lgrite h2'))); i++) { await ev(() => { if (DS.cineBusy()) DS.cineSkip(); }); await sleep(400); }
  c = await ev(() => ({ veil: !!document.querySelector('#stgkeep.rite.solid'), top: getComputedStyle(document.querySelector('#top')).visibility, scn: !!DS.G.scn, rite: document.querySelectorAll('.ov.rite').length }));
  await sleep(500); await shot('retreat_rite');
  A(c.veil && c.top === 'hidden' && c.scn && c.rite === 1, 'retreat after the 맹주 fell: the rite opens over a solid veil (battlefield and HUD hidden)');
  await finishRite(); await sleep(900);
  c = await ev(() => ({ keep: !!document.querySelector('#stgkeep'), top: getComputedStyle(document.querySelector('#top')).visibility, scn: !!DS.G.scn, vac: !!DS.G.save.chars[DS.G.save.hero].vac }));
  A(!c.keep && c.top === 'visible' && !c.scn && !c.vac, 'after it the veil lifts in the field with a new 맹주');
  await ev(() => { DS.G.quiet = true; }); await L.closeAll(page);

  // ── ⑦ 엔딩 ──
  const playEnding = async (tag, withDead) => {
    await ev(() => { DS.G.quiet = true; DS.ui.closeAll(); if (DS.G.save.cleared[30]) delete DS.G.save.cleared[30]; DS.startScenario(DS.scn(30)); DS.G.pause = true; }); await sleep(900);
    await L.skipStory(page); await ev(() => DS.ui.closeAll());
    const exp = await ev(() => { DS.G.pause = false; DS.G.sim.win(); var s = DS.G.save; return { dead: DS.storyDead(s).slice(0, 5).map(function (d) { return d.n; }) }; });
    A(withDead ? exp.dead.length > 0 : exp.dead.length === 0, tag + ': save has ' + (exp.dead.length ? 'fallen people (' + exp.dead.join(', ') + ')' : 'no fallen people'));
    await until(() => !!document.querySelector('.ov.story'), 8000);
    await L.skipStory(page);      // 30번 맺음 (조용한 시험 — 낭독은 ③ 에서 보았다)
    await until(() => !!document.querySelector('.ov.res26 .rfoot .btn.gold'), 8000);
    for (let i = 0; i < 6 && (await ev(() => !!document.querySelector('.ov.chov'))); i++) { await page.click('.ov.chov [data-ch="a"]').catch(() => {}); await sleep(500); }
    await ev(() => { DS.G.quiet = false; }); await sleep(300);
    const tClose = Date.now();
    await page.click('.ov.res26 .rfoot .btn.gold');
    await sleep(320);
    let st = await ev(() => { var k = document.querySelector('#stgkeep'); return { keep: !!k, op: k ? +getComputedStyle(k).opacity : -1, story: !!document.querySelector('.ov.story') }; });
    A(st.keep && st.op > 0 && st.op < 1 && !st.story, tag + ': closing the result fades to black first (curtain at ' + st.op.toFixed(2) + ' after 0.3 s, no line yet)');
    await page.waitForSelector('.ov.story.stg-end', { timeout: 5000 });
    const tOpen = Date.now() - tClose;
    st = await ev(() => { var q = function (s) { var e = document.querySelector(s); return e ? getComputedStyle(e).visibility : 'none'; }, k = document.querySelector('#stgkeep'), a = document.querySelector('#app').getBoundingClientRect(), r = k.getBoundingClientRect(); return { top: q('#top'), bot: q('#bot'), quest: q('#quest'), boss: q('#boss'), acts: q('#acts'), msn: q('#msn'), cover: r.width >= a.width - 1 && r.height >= a.height - 1, cv: !!k.querySelector('canvas.stg-cv'), exp: DS.storyResolve(DS.LORE.ending).length }; });
    A(tOpen >= 550 && st.top === 'hidden' && st.bot === 'hidden' && st.quest === 'hidden' && st.acts === 'hidden' && st.boss !== 'visible' && st.cover && st.cv, tag + ': the ending stage opens after ' + tOpen + ' ms with the battle HUD hidden (top ' + st.top + ', quest ' + st.quest + ', boss ' + st.boss + ', acts ' + st.acts + ') and the dawn canvas behind');
    const seen = []; let one = null, roll = null, lastHold = null, sun0 = -1, sun1 = -1;
    sun0 = await ev(() => { var cv = document.querySelector('#stgkeep .stg-cv'); return cv._art ? cv._art.p() : -1; });
    for (let i = 0; i < 60; i++) {
      await sleep(200); let l = await top(); if (!l) break;
      if (!/stg-end/.test(l.cls)) break;
      const idx = seen.length;
      if (idx === 0) { await sleep(700); await shot(tag + '_line1'); }
      if (l.k === 'one') {
        await sleep(500); const a = await ev(() => { var o = document.querySelector('.ov.story'), u = o.querySelector('.sbub.k-one .unread'), re = o.querySelector('.sbub.k-re'); return { unread: u ? +getComputedStyle(u).opacity : -1, re: re ? +getComputedStyle(re).opacity : -1 }; });
        await shot(tag + '_one_a'); await sleep(1700);
        const b = await ev(() => { var o = document.querySelector('.ov.story'), u = o.querySelector('.sbub.k-one .unread'), re = o.querySelector('.sbub.k-re'); return { unread: u ? +getComputedStyle(u).opacity : -1, re: re ? +getComputedStyle(re).opacity : -1, text: re ? re.querySelector('.mt').textContent : '', who: re ? re.querySelector('.mh').textContent : '', line: o.querySelector('.line').textContent, shown: o.querySelector('.line span').textContent }; });
        await shot(tag + '_one_b'); one = { a: a, b: b };
        if (tag === 'end_dead') await land(tag + '_landscape');
      }
      if (/rolling/.test(l.box)) {
        const names = []; const t1 = Date.now();
        for (let k = 0; k < 40; k++) { const n = await ev(() => { var c = document.querySelector('.ov.story .roll-c b'); return c ? c.textContent : null; }); if (n == null) break; if (names[names.length - 1] !== n) { names.push(n); if (names.length === 2) await shot(tag + '_roll'); } await sleep(90); }
        roll = { names: names, ms: Date.now() - t1, on: await ev(() => document.querySelectorAll('.ov.story .line .rn.on').length), line: l.t };
        await sleep(300); await shot(tag + '_roll_done');
      }
      if (/typing/.test(l.box)) { await sleep(800); l = await top() || l; }
      seen.push(l);
      if (/▼ 닫기/.test(l.next)) {      // 마지막 줄: 잠깐 머문다
        sun1 = await ev(() => { var cv = document.querySelector('#stgkeep .stg-cv'); return cv._art ? cv._art.p() : -1; });
        await sleep(200); const w0 = await ev(() => document.querySelector('.ov.story .story-box').classList.contains('wait'));
        await tapLine(); await sleep(250); const still = await ev(() => !!document.querySelector('.ov.story.stg-end'));
        await shot(tag + '_last');
        await sleep(2100); const w1 = await ev(() => { var b = document.querySelector('.ov.story .story-box'); return b ? b.classList.contains('wait') : null; });
        await tapLine(); await sleep(400);
        lastHold = { w0: w0, still: still, w1: w1, closed: await ev(() => !document.querySelector('.ov.story.stg-end')) };
        break;
      }
      await tapLine(); await sleep(260);
      if (await ev((n) => { var o = document.querySelector('.ov.story'); return o && o.querySelector('.next').textContent.indexOf((n + 1) + ' / ') === 0; }, idx)) await tapLine();      // 첫 탭이 줄을 마저 띄웠으면 한 번 더
    }
    console.log('     ' + seen.map(l => l.k).join(' ') + ' | sun ' + sun0 + ' → ' + sun1);
    A(seen.length === st.exp && /먼동이 텄다/.test(seen[0].t) && /고맙습니다/.test(seen[seen.length - 1].t) && seen.every(l => !/undefined|NaN|\{/.test(l.w + l.t)), tag + ': all ' + seen.length + ' ending lines play in the stage, one at a time');
    A(one && one.a.unread > 0.5 && one.a.re < 0.2 && one.b.unread < 0.1 && one.b.re > 0.9 && one.b.text === 'ㅇㅇ' && /「1」/.test(one.b.line) && /「ㅇㅇ」$/.test(one.b.line) && !/ㅇㅇ/.test(one.b.shown), tag + ': the 「1」 line is a chat bubble — the unread 1 fades, then ' + one.b.who + ' answers 「' + one.b.text + '」');
    if (withDead) A(roll && roll.names.join('|') === exp.dead.join('|') && roll.on === exp.dead.length + 1 && roll.ms >= 400 * exp.dead.length, tag + ': the fallen names rise one by one (' + roll.names.join(' → ') + ' in ' + roll.ms + ' ms) — ' + roll.line);
    else A(!roll && seen.some(l => /한 사람도 잃지 않았다/.test(l.t)), tag + ': no fallen people — no name roll, the 「한 사람도 잃지 않았다」 line plays');
    A(lastHold && lastHold.w0 && lastHold.still && lastHold.w1 === false && lastHold.closed && sun1 > sun0 && sun1 > 0.5, tag + ': the last line holds about 2 s before it can be closed; the sun rose (' + sun0.toFixed(2) + ' → ' + sun1.toFixed(2) + ')');
    await until(() => !!document.querySelector('.ov .result.record'), 4000);
    await sleep(250);
    const rc0 = await ev(() => [].map.call(document.querySelectorAll('.ov .result.record [data-cu]'), function (e) { return e.textContent; }));
    await sleep(2600);
    const rc1 = await ev(() => { var o = document.querySelector('.ov .result.record'); return { v: [].map.call(o.querySelectorAll('[data-cu]'), function (e) { return [e.textContent.replace(/,/g, ''), e.dataset.cu]; }), top: getComputedStyle(document.querySelector('#top')).visibility, keep: !!document.querySelector('#stgkeep'), names: o.querySelectorAll('.names i').length, btn: o.querySelector('[data-close]').textContent }; });
    await shot(tag + '_record');
    A(rc1.v.length >= 2 && rc1.v.every(x => x[0] === x[1]) && rc0.join() !== rc1.v.map(x => x[0]).join() && rc1.top === 'hidden' && rc1.keep && rc1.btn === '계속', tag + ': the record card counts up (' + rc0.join(' ') + ' → ' + rc1.v.map(x => x[0]).join(' ') + ') over the dawn, HUD still hidden');
    const chain = [];
    for (let i = 0; i < 60; i++) {
      const s2 = await ev(() => { var os = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost)')), o = os.pop(), cine = DS.cineBusy(); return { cine: cine, cls: o ? o.className : '', h: o ? ((o.querySelector('h2, .who') || {}).textContent || '') : '', scn: !!DS.G.scn, keep: !!document.querySelector('#stgkeep') }; });
      if (!s2.cine && !s2.cls && !s2.scn) { await sleep(900); if (!(await ev(() => !!document.querySelector('#app .ov:not(.ghost), .cine')))) break; continue; }
      if (s2.h && chain[chain.length - 1] !== s2.h) chain.push(s2.h);
      if (s2.cine) { await sleep(750); await ev(() => DS.cineSkip()); }
      else if (/story/.test(s2.cls)) await L.skipStory(page, 6);
      else if (/lgxov/.test(s2.cls)) { await ev(() => { DS.G.quiet = true; }); await sleep(1200); const done = await ev(() => { var o = document.querySelector('.ov.lgxov'), b = o && (o.querySelector('.btn.gold:not([disabled])') || o.querySelector('.btn:not([disabled])')), k = o && o.querySelector('[data-lgboon], .lgbn, .boon'); if (k) k.click(); if (b) { b.click(); return b.textContent; } return ''; }); if (!done) await sleep(600); }
      else await ev(() => { var o = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost)')).pop(), b = o && (o.querySelector('.btn.gold:not([disabled])') || o.querySelector('[data-close]')); if (b) b.click(); });
      await sleep(450);
    }
    const fin = await ev(() => ({ keep: !!document.querySelector('#stgkeep'), top: getComputedStyle(document.querySelector('#top')).visibility, scn: !!DS.G.scn, zone: DS.G.zone.id, cleared: !!DS.G.save.cleared[30], hold: DS.G.hold }));
    console.log('     chain: ' + chain.join(' → '));
    A(chain.some(h => /의 가문$/.test(h)) && chain.some(h => /다음 세대/.test(h)) && !fin.keep && fin.top === 'visible' && !fin.scn && fin.cleared, tag + ': record → next-generation card → back in the field (' + fin.zone + '), curtain gone and HUD back');
    await ev(() => { DS.G.quiet = true; }); await sleep(300);
    for (let i = 0; i < 12 && (await ev(() => !!document.querySelector('.cine, #app .ov'))); i++) { await ev(() => { if (DS.cineBusy()) DS.cineSkip(); }); await L.closeAll(page); await sleep(350); }
  };
  await loadLate();
  await playEnding('end_dead', true);
  // 먼저 간 이가 없는 저장: 새 판을 29번까지 올린다
  await L.newGame(page, { name: '온새', cls: 'inf' });
  await L.edit(page, function () { DS.houseOpenN(s, 9); DS.mercTidy(s); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 78; b.exp = 0; } }); DS.mercTidy(s); if (DS.pSync) DS.pSync(s); for (var id = 1; id <= 29; id++) DS.applyClear(s, DS.scn(id)); s.fallen = []; s.opt.cine = 'full'; if (s.cineQ) delete s.cineQ; });
  await ev(() => { DS.ui.closeAll(); DS.enterZone('haemil'); }); await sleep(800);
  for (let i = 0; i < 16 && (await ev(() => !!document.querySelector('.cine, #app .ov'))); i++) { await ev(() => { if (DS.cineBusy()) DS.cineSkip(); DS.ui.closeAll(); }); await sleep(350); }
  await playEnding('end_none', false);
  console.log('stage26 done');
};
