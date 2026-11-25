// 전민 — 2.6 손맛 시험: 진짜 화면에서 (390×844 · 끝에 가로 844×390 한 장)
//   H=844 OUT=qa_out/feel26 node tools/shot.js tools/t_feel26.js
// ① 마을: 지도가 위아래 판 사이를 꽉 채운다(전 · 후) · 옆으로 민다 · 사람들이 두 칸을 오간다 · 문을 눌러 가게에 들어간다 · 코치 칸이 화면 안
// ② 계절: 봄 · 여름 · 가을 · 겨울의 땅 빛깔과 공기 · 겨울 지붕의 눈 · 계절이 바뀐 뒤의 지역 띠 한 줄 · 마을 띠의 아랫줄
// ③ 싸움의 첫 박자: 0.3초(띠만) · 1.0초(말풍선, 아직 멈춤) · 1.5초(움직인다) · 버프 글자는 쓴 이 머리 위 한 줄 · 가문원 글자 생략
// ④ 다음 기술 · NEW 표 · 승급 창(+N, 전 → 후) · 승급 알림 한 줄 · 줄 선 승급 창의 주인이 바뀌면 버린다
// ⑤ 결과 창(다음 줄 · 전투력 줄) · 위험 안내가 승리 뒤에 남지 않는다 · 「저장됨」
// ⑥ 가게 주인의 한 줄 · 잠긴 합일 한 줄 · 접힌 값 풀이 · 마을 사람의 얼굴 · 돈 적는 법 · 이름 바꾸기 창 · 전멸의 까닭 · 입구 꼬리표
// ⑦ 소리: 혼인 · 출생 · 이별 소리와 애도 곡이 있다 · 연출 중 배경음 낮춤 손잡이
'use strict';
module.exports = async function (page, shot, L, env) {
  const ev = (fn, arg) => page.evaluate(fn, arg), A = L.assert, sleep = L.sleep;
  await L.newGame(page, { cls: 'inf', name: '새벽' });
  await L.closeAll(page);
  await sleep(1200);

  // ── ① 마을 ──
  let c = await ev(() => { var v = DS.G.view, z = DS.G.zone; return { k: v.k0, top: v.inset.top, bot: v.inset.bottom, H: v.H, W: v.W, mh: v.mh, mw: v.mw, camY: v.cam.y, camX: v.cam.x, decor: v.decor.map(function (d) { return [d.x, d.y, d.ax == null ? null : d.ax]; }), town: !!z.town }; });
  const kFit = (c.H - c.top - c.bot) / (c.mh * 16);
  A(c.town && Math.abs(c.k - kFit) < 0.02, 'town: the 17 rows fill the height between the HUD bands (k ' + c.k.toFixed(2) + ' = fit ' + kFit.toFixed(2) + ', insets ' + c.top + '/' + c.bot + ')');
  A(c.mw * 16 * c.k > c.W + 100, 'town: wider than the screen (' + Math.round(c.mw * 16 * c.k) + ' > ' + c.W + ' px) so it pans sideways');
  A(c.decor.filter(d => d[2] != null && Math.abs(d[2] - d[0]) === 1).length >= 2, 'town: villagers have a second anchor tile next to them — ' + JSON.stringify(c.decor));
  // 전: 2.5.0 의 배율로 잠깐 되돌려 찍는다 (비교용)
  const kOld = await ev(() => { var v = DS.G.view, cw = v.W, ch = v.H, kb = Math.min(cw / (Math.min(v.mw, 12.5) * 16), ch / (9.5 * 16)), zo = DS.zoomOf(), ins = v.inset, kf = Math.min(cw / (v.mw * 16), Math.max(ch * 0.5, ch - ins.top - ins.bottom) / (v.mh * 16)), k = Math.max(kb / zo, Math.min(kb, kf)); v.k0 = v.k = k; v.snap = true; return k; });
  await sleep(300); await shot('town_before_zoom');
  await ev(() => { DS.G.view.resize(); }); await sleep(300);
  await shot('town_after_zoom');
  A(c.k / kOld >= 1.45, 'town: sprites are ' + (c.k / kOld).toFixed(2) + '× larger than 2.5.0 (k ' + kOld.toFixed(2) + ' → ' + c.k.toFixed(2) + ')');
  // 사람들이 오간다: 14초 동안 그림 자리를 본다
  const xs = {};
  for (let i = 0; i < 28; i++) { const r = await ev(() => DS.G.zone.pois.filter(function (p) { return p.t === 'npc'; }).map(function (p) { return [p.look, +(p.dx || 0).toFixed(2)]; })); r.forEach(([k, dx]) => { (xs[k] = xs[k] || new Set()).add(dx); }); await sleep(500); }
  const moved = Object.keys(xs).filter(k => xs[k].has(0) && [...xs[k]].some(v => Math.abs(v) === 1));
  A(moved.length >= 1, 'town: within 14 s at least one villager stepped to the other tile and stood there (' + Object.keys(xs).map(k => k + ':' + [...xs[k]].join('/')).join(' ') + ')');
  // 문을 눌러 들어간다 (확대한 뒤의 누름 자리) — 잡화점 문 칸
  const door = await ev(() => { var v = DS.G.view, p = DS.G.zone.pois.filter(function (p) { return p.t === 'shop' && p.kind === 'item'; })[0], s = v.screenOf(p.x, p.y), r = document.querySelector('#cv').getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y, in: s.x > 8 && s.x < v.W - 8 && s.y > v.inset.top && s.y < v.H - v.inset.bottom }; });
  A(door.in, 'town: the 잡화점 door tile is on screen between the HUD bands (' + Math.round(door.x) + ',' + Math.round(door.y) + ')');
  await page.mouse.click(door.x, door.y);
  let opened = false; for (let i = 0; i < 40 && !opened; i++) { await sleep(300); opened = await ev(() => { var h = document.querySelector('.ov header.sh h3'); return !!h && h.textContent === '잡화점'; }); }
  A(opened, 'town: tapping the door walks there and opens the shop');
  c = await ev(() => { var k = document.querySelector('.ov .f26keep'); return k ? { t: k.innerText.replace(/\n/g, ' '), face: !!k.querySelector('.kf canvas, .kf .spr'), btn: [].map.call(document.querySelectorAll('.ov [data-it][data-n="1"]'), function (b) { return b.innerText.trim(); }).slice(0, 3), coin: !!document.querySelector('.ov [data-it][data-n="1"] .cur') } : null; });
  A(c && /잡화점 주인/.test(c.t) && /약초는 넉넉히\. 관보다 값이 싸요\./.test(c.t) && c.face, 'item shop: keeper strip with a face — ' + (c && c.t));
  A(c.coin && c.btn.every(t => !/G/.test(t)), 'item shop: price buttons use the coin icon, no 「G」 (' + c.btn.join(' / ') + ')');
  await shot('keeper_item');
  await L.closeAll(page);
  // 코치 칸이 화면 안: 지도 칸을 가리키는 코치
  c = await ev(() => { DS.G.quiet = false; DS.G.coachAt = 0; var me = DS.G.sim.byId[DS.G.sel]; DS.coach({ x: me.x, y: me.y }, '시험 코치', { ms: 1500 }); var h = document.querySelector('.coach .hole'); if (!h) return null; var r = h.getBoundingClientRect(), cv = document.querySelector('#cv').getBoundingClientRect(), k = DS.G.view.k; return { w: r.width, in: r.left >= cv.left && r.right <= cv.right && r.top >= cv.top && r.bottom <= cv.bottom, k: k }; });
  A(c && c.in && c.w >= c.k * 16 && c.w <= c.k * 16 * 2.2, 'coach-mark rectangle covers the tile at the new scale (hole ' + (c && Math.round(c.w)) + ' px on a ' + (c && (c.k * 16).toFixed(0)) + ' px tile) and stays on the canvas');
  await sleep(1700);
  // 마을 사람의 얼굴
  await ev(() => { DS.G.quiet = true; var p = DS.G.zone.pois.filter(function (p) { return p.t === 'npc' && p.look === 0; })[0], me = DS.G.sim.byId[DS.G.sel]; window.__npc = p; DS.G.sim.setOrder(me.id, { t: 'move', x: 9, y: p.y + 2 }); });
  for (let i = 0; i < 40 && !(await ev(() => { var me = DS.G.sim.byId[DS.G.sel], p = window.__npc; return Math.abs(me.x - 9) + Math.abs(me.y - p.y - 2) === 0; })); i++) await sleep(250);
  await sleep(400);
  const np = await ev(() => { var v = DS.G.view, p = window.__npc, s = v.screenOf(p.x + (p.dx || 0), p.y), r = document.querySelector('#cv').getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; });
  await page.mouse.click(np.x, np.y);
  let talk = null; for (let i = 0; i < 40 && !talk; i++) { await sleep(300); talk = await ev(() => { var o = document.querySelector('.ov.story'); return o ? { who: o.querySelector('.who').textContent, pic: !!o.querySelector('.story-box.pic .sp canvas, .story-box.pic .sp .spr'), line: o.querySelector('.line').textContent } : null; }); }
  A(talk && talk.pic && /촌장 덕보/.test(talk.who), 'villager talks with a portrait: ' + (talk && talk.who + ' — ' + talk.line));
  await shot('npc_face');
  await L.closeAll(page);

  // ── ② 계절 ──
  const px = () => ev(() => { var v = DS.G.view, m = v.maps[0], g = m.getContext('2d'), s = m.width / (v.mw * 16), at = function (x, y) { var d = g.getImageData(Math.round(x * s), Math.round(y * s), 1, 1).data; return [d[0], d[1], d[2]]; };
    var shop = DS.G.zone.pois.filter(function (p) { return p.t === 'shop' && p.kind === 'item'; })[0];
    return { se: v.map.season, amb: v.ambA && v.ambA[0], grass: at(1 * 16 + 8, 7 * 16 + 9), roof: at(shop.bx * 16 + 24, shop.by * 16 + 4) }; });
  const seen = [];
  for (const se of [0, 1, 2, 3]) {
    await ev((se) => { var s = DS.G.save; s.cal.t = Math.floor(s.cal.t / 600) * 600 + se * 150 + 5; }, se);
    await sleep(2400);
    const r = await px(); seen.push(r);
    A(r.se === se, 'season ' + ['봄', '여름', '가을', '겨울'][se] + ': the map is repainted for it (grass ' + r.grass.join(',') + ' · roof top ' + r.roof.join(',') + ' · air ' + r.amb + ')');
    await shot('season_' + se);
  }
  A(seen[0].amb === 'petal' && seen[2].amb === 'leaf' && seen[3].amb === 'snow', 'air: petals in spring, leaves in autumn, snow in winter (summer keeps ' + seen[1].amb + ')');
  A(seen[2].grass[0] > seen[0].grass[0] + 20 && seen[3].grass[2] > seen[0].grass[2] + 40, 'ground: autumn grass is warmer (R ' + seen[0].grass[0] + ' → ' + seen[2].grass[0] + '), winter grass is frosted (B ' + seen[0].grass[2] + ' → ' + seen[3].grass[2] + ')');
  A(Math.min.apply(null, seen[3].roof) >= 235 && Math.min.apply(null, seen[0].roof) < 200, 'winter: white roof cap (' + seen[3].roof.join(',') + ' vs spring ' + seen[0].roof.join(',') + ')');
  await ev(() => { var G = DS.G, s = G.save; G.townN = 9; G.townSave = s; G.seaSeen = { save: s, key: DS.calNow(s).yr * 4 + 2, heat: 0 }; DS.enterZone('haemil'); });      // 지난번에는 가을이었다 → 지금 겨울
  await sleep(700);
  c = await ev(() => { var b = document.querySelector('#banner'); return { on: b.classList.contains('on'), t: b.innerText.replace(/\n/g, ' / ') }; });
  A(c.on && /해밀 \/ 겨울이 왔다\. 눈이 내린다\./.test(c.t), 'zone banner on entering town after the season turned: ' + c.t);
  await shot('banner_season');
  await sleep(2600);
  await ev(() => { DS.enterZone('haemil'); }); await sleep(700);
  c = await ev(() => document.querySelector('#banner').innerText.replace(/\n/g, ' / '));
  A(/해밀 \/ 가문력 \d+년 겨울 · .+ 가문 1대/.test(c), 'zone banner subtitle on a later visit: ' + c);
  await shot('banner_subtitle');
  await sleep(2400);
  // 지역 띠: 처음 세 번은 안내, 그 뒤 · 깬 뒤로는 달력과 가문 · 계절이 바뀌면 그 한 줄
  c = await ev(() => { var G = DS.G, s = G.save, z = G.zone, out = {}; G.townN = 0; G.seaSeen = null;
    out.first = DS.zoneSub(z, s); G.townN = 5; out.later = DS.zoneSub(z, s);
    s.cal.t += 150; out.season = DS.zoneSub(z, s);      // 겨울 → 다음 해 봄
    s.rh = { h: 3, t: s.cal.t }; G.seaSeen = { save: s, key: G.seaSeen.key, heat: 3 }; s.cal.t += 150; out.price = DS.zoneSub(z, s); delete s.rh;
    out.field = DS.zoneSub(DS.buildZone('dawn'), s);
    return out; });
  A(/가게 문을 누르면 들어간다/.test(c.first) && /^가문력 \d+년 (봄|여름|가을|겨울) · .+ 가문 1대$/.test(c.later), 'town banner subtitle: tutorial at first (' + c.first + '), then calendar and house (' + c.later + ')');
  A(/^봄이 왔다\. 꽃잎이 날린다\.$/.test(c.season) && /^여름이 왔다\. 영웅관 값이 내렸다\.$/.test(c.price), 'season change gets one line (' + c.season + ') and mentions the 영웅관 only when its price really eased (' + c.price + ')');

  // ── ④ 다음 기술 · NEW · 승급 ──
  await L.edit(page, function () { var h = s.chars[s.hero]; h.ps.L = 3; h.ps.exp = 0; DS.pSync(s); });
  await ev(() => { DS.G.quiet = true; DS.renderActs(); }); await sleep(250);
  c = await ev(() => { var e = document.querySelector('#acts .sknone.f26nx'); if (!e) return null; var u = e.querySelector('.nxbar u'), r = e.getBoundingClientRect(); return { t: e.innerText.replace(/\n/g, ' | '), bar: u.getBoundingClientRect().width / e.querySelector('.nxbar').getBoundingClientRect().width, icon: !!e.querySelector('.nxi svg'), w: r.width, row: document.querySelector('#acts .arow.sk').getBoundingClientRect().width }; });
  A(c && /다음 기술 「방패 치기」 · 2단에 배운다/.test(c.t) && /Lv 3\/10/.test(c.t) && c.icon && Math.abs(c.bar - 0.2) < 0.03 && c.w > c.row - 4, 'empty skill bar shows what comes next: ' + (c && c.t) + ' (bar ' + (c && Math.round(c.bar * 100)) + '%)');
  await shot('skill_teaser');
  await L.edit(page, function () { var h = s.chars[s.hero]; h.ps.L = 11; h.ps.exp = 0; DS.pSync(s); delete s.seen.skNew; });
  await ev(() => { DS.G.quiet = false; DS.G.coachAt = 0; DS.renderActs(); }); await sleep(600);
  c = await ev(() => { var b = document.querySelector('#acts .act.isnew'), co = document.querySelector('.coach p'), nx = document.querySelector('#acts .skg.f26nx'); return b ? { sk: b.dataset.sk, badge: (b.querySelector('.newb') || {}).textContent, pulse: b.classList.contains('newp'), coach: co ? co.textContent : '', seen: DS.G.save.seen.skNew, next: nx ? nx.innerText.trim() : '' } : null; });
  A(c && c.sk === 'inf_bash' && c.badge === 'NEW' && c.pulse && c.coach === '새 기술. 눌러서 쓴다' && c.seen === 1, 'a newly learned skill: NEW badge, pulse and a one-time coach 「' + (c && c.coach) + '」');
  A(/3단/.test(c.next), 'and the first empty slot shows the next one (' + c.next + ')');
  await shot('skill_new');
  await sleep(300);
  await ev(() => { DS.G.quiet = true; var co = document.querySelector('.coach'); if (co) co.remove(); });
  await page.click('#acts .act.isnew'); await sleep(200);
  A(await ev(() => !document.querySelector('#acts .act.isnew') && !document.querySelector('#acts .newb')), 'the badge is gone once the skill is tapped');
  await ev(() => { DS.G.aim = null; try { DS.ui.closeAll(); } catch (e) {} });
  // 승급 창
  await ev(() => { var s = DS.G.save, h = s.chars[s.hero]; DS.G.promos.length = 0; DS.showPromo({ id: h.id, from: 1, to: 2, cls: h.cls }, null); });
  await sleep(500);
  c = await ev(() => { var o = document.querySelector('.ov .result.promo'); return o ? [].map.call(o.querySelectorAll('.stats.grow > span'), function (sp) { var b = sp.querySelector('b'), sm = sp.querySelector('small'); return { k: sp.querySelector('i').textContent, b: b.textContent, col: getComputedStyle(b).color, sm: sm ? sm.textContent : '', up: sp.classList.contains('f26up') }; }) : null; });
  A(c && c.length === 4 && c.filter(x => x.up).length >= 2 && c.filter(x => x.up).every(x => /^\+[\d,]+$/.test(x.b) && /^[\d,]+ → [\d,]+$/.test(x.sm)), 'promotion card: gains read 「+N」 with before → after underneath — ' + (c && c.map(x => x.k + ' ' + x.b + (x.sm ? ' (' + x.sm + ')' : '')).join(' · ')));
  const g = c.filter(x => x.up)[0].col.match(/\d+/g).map(Number);
  A(g[1] > g[0] + 30 && g[1] > g[2] + 30, 'and the gain is green (' + c.filter(x => x.up)[0].col + ')');
  await shot('promo_card');
  await L.closeAll(page);
  c = await ev(() => DS.tmRankMsg({ who: null, name: '새벽', t1: 3, gains: [{ k: 'atk', v: 3 }], flag: true }));
  A(c === '새벽 3단 승급. 공격 +3%', 'level-up toast: ' + c);
  // 줄 선 승급 창의 주인이 바뀌면 버린다
  c = await ev(() => { var G = DS.G, s = G.save, h = s.chars[s.hero]; G.promos.length = 0; DS.ui.closeAll();
    G.promos.push({ id: h.id, from: 1, to: 2, cls: h.cls, pid: (h.pid || 0) + 777 }); G.promos.push({ id: 99999, from: 1, to: 2, cls: 'inf' }); G.promos.push({ id: h.id, from: 1, to: 2, cls: h.cls === 'inf' ? 'mag' : 'inf', pid: h.pid || 0 });
    DS.flushPromos(); var a = { left: G.promos.length, ov: !!document.querySelector('.ov .result.promo') };
    G.promos.push({ id: h.id, from: 1, to: 2, cls: h.cls, pid: h.pid || 0 }); DS.flushPromos(); a.ok = !!document.querySelector('.ov .result.promo'); return a; });
  A(c.left === 0 && !c.ov && c.ok, 'queued promotions whose person changed (other person · gone · other class) are dropped; a valid one still shows');
  await L.closeAll(page);

  // ── ⑥ 가게 · 잠긴 줄 · 값 풀이 ──
  const sheetOf = async (kind) => { await ev((k) => { DS.ui.closeAll(); DS.openShop(k); }, kind); await sleep(450); return ev(() => { var o = document.querySelector('.ov'), k = o && o.querySelector('.f26keep'); return o ? { keep: k ? k.innerText.replace(/\n/g, ' ') : '', txt: o.innerText } : null; }); };
  c = await sheetOf('forge');
  A(c && /대장장이 「?부서지면 제 탓 아닙니다\. 확률 탓입니다\./.test(c.keep.replace(/[「」]/g, '「')) || /부서지면 제 탓 아닙니다\. 확률 탓입니다\./.test(c.keep), 'forge keeper: ' + c.keep);
  A(!/\dG\b/.test(c.txt), 'forge: no 「G」 prices');
  await shot('keeper_forge');
  c = await sheetOf('church');
  A(/교회지기/.test(c.keep) && /체력은 저절로 차지 않습니다/.test(c.keep), 'church keeper (nobody lost yet): ' + c.keep);
  A(/합일\s*7단 Lv10 가주 셋이 모이면 열린다 \(0\/3\)/.test(c.txt.replace(/\n/g, ' ')) && !/흡수된다/.test(c.txt), 'church at the start: one locked row instead of the 합일 paragraph');
  await shot('church_locked');
  await L.edit(page, function () { s.fallen = (s.fallen || []).concat([{ n: '돌쇠', at: '새벽 들판', t: 'm_sword', g: 2 }]); });
  c = await sheetOf('church');
  A(/이름은 적어 두었습니다\. 가끔 읽어 주세요\./.test(c.keep), 'church keeper after a death: ' + c.keep);
  await shot('keeper_church');
  await L.edit(page, function () { s.gold = 10; s.tickets = 0; s.rh = { h: 4, t: DS.calNow(s).t }; });
  c = await sheetOf('merc');
  A(/영웅관 접수원/.test(c.keep) && /이름값이 올랐어요\. 계절이 바뀌면 내립니다\./.test(c.keep), 'hero hall keeper when poor and the price is heated: ' + c.keep);
  A(/값은 어떻게 정해지나 ▸/.test(c.txt) && !/부를 때마다 오르고 계절마다 내려간다/.test(c.txt), 'hero hall: the price rule is folded behind 「값은 어떻게 정해지나 ▸」');
  await shot('merc_folded');
  await page.click('.ov [data-pfold="gwhy"]'); await sleep(300);
  c = await ev(() => document.querySelector('.ov').innerText);
  A(/값은 어떻게 정해지나 ▾/.test(c) && /부를 때마다 오르고 계절마다 내려간다/.test(c), 'and opens on a tap');
  await shot('merc_rule_open');
  await L.edit(page, function () { s.gold = 300000; s.tickets = 2; delete s.rh; });
  c = await sheetOf('merc');
  A(/모집권 가져오셨네요\. 그건 값이 안 오릅니다\./.test(c.keep), 'hero hall keeper with a ticket: ' + c.keep);
  await L.closeAll(page);
  // 입구 창: 돈 적는 법 · 꼬리표
  await L.edit(page, function () { var h = s.chars[s.hero]; h.ps.L = 4; DS.pSync(s); });
  c = await ev(() => { var s = DS.G.save, sc = DS.scn(1); var solo = DS.recTag(s, sc), nC = DS.partySpecs(s).filter(function (u) { return u.role === 'cmd'; }).length; DS.ui.closeAll(); DS.openGate(sc, null); var o = document.querySelector('.ov'); return { solo: solo, nC: nC, pl: DS.partyL(s), rec: DS.recL(sc), txt: o ? o.innerText : '' }; });
  A(c.nC === 1 && c.pl >= c.rec + 2 && c.solo.k === 'ok' && !/여유/.test(c.txt), 'entry label: a lone 맹주 at Lv' + c.pl + ' (권장 ' + c.rec + ') is no longer tagged 「여유」');
  A(/[\d,]+골드/.test(c.txt) && !/\d 골드/.test(c.txt), 'gate: reward reads 「N골드」 — ' + (c.txt.match(/[^\n]*골드[^\n]*/) || [''])[0]);
  await sleep(500); await shot('gate_solo');
  await L.closeAll(page);
  c = await ev(() => { var s = DS.G.save; DS.houseOpenN(s, 4); DS.mercTidy(s); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 4; b.exp = 0; } }); DS.pSync(s); DS.rebuildParty(); var t = DS.recTag(s, DS.scn(1)); return { t: t, nC: DS.partySpecs(s).filter(function (u) { return u.role === 'cmd'; }).length }; });
  A(c.nC >= 3 && c.t.k === 'easy' && c.t.tag === '여유', 'with three commanders the same level is still 「여유」');
  // 이름 바꾸기 창: 적기 전에는 붉은 글이 없다
  await ev(() => { var s = DS.G.save; s.rnt = 2; DS.ui.closeAll(); DS.rnAsk({ k: 'c', id: s.hero }, null); });
  await sleep(500);
  c = await ev(() => { var o = document.querySelector('.ov .rnq'); return o ? { why: o.querySelector('#rnWhy').hidden, dis: o.querySelector('#rnYes').disabled } : null; });
  A(!!c, 'rename dialog opens');
  {
    await sleep(300); await page.click('.ov #rnYes', { force: true }).catch(() => {}); await sleep(200);
    const c2 = await ev(() => { var o = document.querySelector('.ov .rnq'); return o ? { why: o.querySelector('#rnWhy').hidden } : null; });
    A(c.why && c.dis && c2 && c2.why, 'rename dialog: no red error before any input (the button is off until a name is typed)');
    await page.fill('#rnName', '새벽'); await sleep(100);
    A(await ev(() => !document.querySelector('.ov #rnYes').disabled), 'and the button wakes once something is typed');
    await shot('rename_dialog');
  }
  await L.closeAll(page);

  // ── ③ 싸움의 첫 박자 (가주 셋 + 가문원) ──
  await L.edit(page, function () { for (var id = 1; id <= 2; id++) DS.applyClear(s, DS.scn(id)); s.items.herb = 9; });
  await L.closeAll(page);
  await sleep(700);
  await ev(() => { var G = DS.G; G.quiet = true; G.save.opt.hunt = true; G.save.opt.speed = 1; window.__beat = []; var t0 = performance.now();
    DS.startScenario(DS.scn(3)); G.sim.hunt = true;
    var iv = setInterval(function () { var b = document.querySelector('#banner'), m = document.querySelector('#msn'), t = performance.now() - t0; window.__beat.push({ t: t, sim: G.sim.t, ban: !!(b && b.classList.contains('on')), msn: !!(m && !m.hidden && /pop/.test(m.className)) }); if (t > 2600) clearInterval(iv); }, 16); });
  await sleep(300); await shot('start_0.3s');
  await sleep(700); await shot('start_1.0s');
  await sleep(500); await shot('start_1.5s');
  await sleep(1300);
  c = await ev(() => { var b = window.__beat, f = function (k) { for (var i = 0; i < b.length; i++) if (b[i][k]) return Math.round(b[i].t); return -1; }; var s1 = -1; for (var i = 0; i < b.length; i++) if (b[i].sim > 0) { s1 = Math.round(b[i].t); break; } return { ban: f('ban'), msn: f('msn'), sim: s1, n: b.length }; });
  A(c.ban >= 0 && c.ban <= 320 && c.msn - c.ban >= 700 && c.msn - c.ban <= 1100 && c.sim - c.ban >= 950 && c.sim - c.ban <= 1500 && c.sim > c.msn, 'battle start: banner at ' + c.ban + ' ms, mission bubble at ' + c.msn + ' ms, the fight moves at ' + c.sim + ' ms');
  // 버프 글자: 한 기술이 여럿에게 건 가호는 쓴 이 머리 위 한 줄 · 가문원 글자는 1배속에서도 생략
  c = await ev(() => { var G = DS.G, v = G.view, sim = G.sim, al = sim.units.filter(function (u) { return u.side === 'ally' && !u.dead; }), cm = al.filter(function (u) { return u.role === 'cmd'; }), mc = al.filter(function (u) { return u.role === 'merc'; });
    G.pause = true; v.floats.length = 0;
    var evs = [{ t: 'skill', id: cm[0].id, sk: 'cmd_inf', fx: 'buff', tiles: [], from: [cm[0].x, cm[0].y] }].concat(al.map(function (u) { return { t: 'buff', id: u.id, s: 'def', p: 20 }; }));
    v.handle(evs); var all = v.floats.map(function (f) { return f.text; }).filter(function (t) { return /[↑↓]/.test(t); });
    v.floats.length = 0; al.forEach(function (u) { var q = v.vu[u.id]; if (q) { q.bfT = {}; q.baT = {}; } });
    var one = []; if (mc[0]) { v.handle([{ t: 'buff', id: mc[0].id, s: 'atk', p: 10 }]); one.push(v.floats.length); } v.handle([{ t: 'buff', id: cm[0].id, s: 'atk', p: 10 }]); one.push(v.floats.map(function (f) { return f.text; }).join());
    G.pause = false; return { n: al.length, mercs: mc.length, all: all, one: one, spd: v.spd }; });
  A(c.n >= 3 && c.all.length === 1 && c.all[0] === '전군 방어↑', 'an army-wide buff on ' + c.n + ' units shows one caster label: ' + JSON.stringify(c.all));
  A(c.spd === 1 && (c.mercs ? c.one[0] === 0 : true) && c.one[c.one.length - 1] === '공격↑', 'at 1× a 가문원 gets no buff label, a 가주 still does (' + JSON.stringify(c.one) + ')');

  // ── ⑤ 위험 안내가 승리 뒤에 남지 않는다 · 결과 창 ──
  await sleep(600);
  c = await ev(() => { var G = DS.G, sim = G.sim, sv = G.save, me = sim.byId[G.sel]; G.quiet = false; G.coachAt = 0; delete sv.seen.cdanger; sv.seen.herb = 1;
    var en = sim.units.filter(function (u) { return u.side === 'enemy' && !u.dead; })[0]; me.lowInfo = false; me.hp = Math.round(me.mhp * 0.6); sim.hurt(me, Math.round(me.mhp * 0.35), en || me, {});
    return { hp: me.hp / me.mhp, hero: me.ch === sv.hero }; });
  await sleep(500);
  c = await ev(() => { var co = document.querySelector('.coach p'), hb = document.querySelector('#acts [data-it="herb"]'); return { coach: co ? co.textContent : '', hint: !!(hb && hb.classList.contains('hint')), info: document.querySelector('#info').innerText.replace(/\n/g, ' '), pause: DS.G.pause }; });
  A(/^맹주가 위험하다\. 약초!$/.test(c.coach) && c.hint && !/대장/.test(c.info), 'danger prompt says 맹주: 「' + c.coach + '」 (herb button pulsing: ' + c.hint + ')');
  await shot('danger_prompt');
  await ev(() => { var G = DS.G, sim = G.sim, me = sim.byId[G.sel]; G.quiet = true; G.pause = false; G.softUntil = 0; me.hp = me.mhp; sim.units.forEach(function (u) { if (u.side === 'enemy' && !u.dead) sim.hurt(u, 1e9, me, {}); }); });
  for (let i = 0; i < 40 && !(await ev(() => DS.G.sim && DS.G.sim.result)); i++) await sleep(150);
  await sleep(500);
  c = await ev(() => { var hb = document.querySelector('#acts [data-it="herb"]'); return { r: DS.G.sim.result, coach: !!document.querySelector('.coach'), hint: !!(hb && hb.classList.contains('hint')), danger: document.querySelector('#info').classList.contains('danger'), info: document.querySelector('#info').innerText.replace(/\n/g, ' ') }; });
  A(c.r === 'win' && !c.coach && !c.hint && !c.danger && !/위험/.test(c.info), 'after the win the coach, the status line and the herb pulse are cleared (info: ' + c.info.trim() + ')');
  await sleep(900); await shot('win_clean');
  for (let i = 0; i < 60 && !(await ev(() => !!document.querySelector('.ov .result.res2'))); i++) { await L.skipStory(page, 3); await sleep(250); if (await ev(() => !!document.querySelector('.ov.chov'))) { await page.click('.ov.chov [data-ch="a"]').catch(() => {}); await sleep(400); } }
  await sleep(900);
  c = await ev(() => { var o = document.querySelector('.ov .result.res2'); if (!o) return null; var nl = o.querySelector('.rfoot .nextl'), pw = o.querySelector('.kv .rpw'), tick = document.querySelector('#savedTick'); return { next: nl ? nl.innerText.replace(/\n/g, ' ') : '', pw: pw ? pw.innerText.replace(/\n/g, ' ') : null, tri: !!(pw && pw.querySelector('.f26tri')), up: !!(pw && pw.querySelector('em.up')), kv: o.querySelector('.kv').innerText.replace(/\n/g, ' '), tick: tick ? tick.textContent : '' }; });
  A(c && /^다음\s*4\. .+ \(.+\)$/.test(c.next) && !/—/.test(c.next), 'result: next line without the dash — ' + (c && c.next));
  A(!/±/.test(c.kv) && (c.pw === null || c.tri === c.up), 'result: the power row is hidden when nothing changed and gets ▲ when it rose (' + (c.pw === null ? 'hidden' : c.pw) + ')');
  A(/저장됨/.test(c.tick), 'a 「저장됨」 tick exists by the menu button after the result (' + c.tick + ')');
  await shot('result_rows');
  // 전투력 줄: 같으면 접힘 · 오르면 ▲ (같은 창을 값만 바꿔 다시 그린다)
  c = await ev(() => { var sv = DS.G.save, sc = DS.scn(3), keep = DS.partyPower, out = {}; DS.ui.closeAll();
    var mk = function () { var r = DS.applyClear(sv, sc); r.drops = []; r.msn = { skip: 1 }; return r; };
    var r0 = mk(); DS.ui.takeSnap(sc); DS.showResult(sc, r0, null); var o = document.querySelectorAll('.ov .result.res2'); o = o[o.length - 1]; out.same = !!o.querySelector('.rpw'); DS.ui.closeAll();
    var p0 = keep(sv); DS.ui.takeSnap(sc); DS.partyPower = function () { return p0 + 120; }; DS.showResult(sc, mk(), null); o = document.querySelectorAll('.ov .result.res2'); o = o[o.length - 1]; var r = o.querySelector('.rpw'); out.up = r ? r.innerText.replace(/\n/g, ' ') : ''; DS.partyPower = keep; return out; });
  A(!c.same && /^▲/.test(c.up) && /\+120/.test(c.up), 'power row: hidden at ±0, 「' + c.up + '」 when it rose');
  await shot('result_power_up');
  await ev(() => { DS.G.scn = null; DS.G.ending = false; DS.ui.closeAll(); DS.enterZone('haemil'); }); await sleep(600); await L.closeAll(page);
  // 「저장됨」: 사고 나면 메뉴 단추 곁에 1초
  await ev(() => { DS.ui.closeAll(); DS.openShop('item'); }); await sleep(400);
  await page.click('.ov [data-it="herb"][data-n="1"]'); await sleep(250);
  c = await ev(() => { var t = document.querySelector('#savedTick'), m = document.querySelector('#bMenu').getBoundingClientRect(); if (!t) return null; var r = t.getBoundingClientRect(); return { on: t.classList.contains('on'), near: Math.abs(r.left - m.left) < 6 && r.top >= m.bottom && r.top < m.bottom + 12, op: +getComputedStyle(t).opacity }; });
  A(c && c.on && c.near, 'buying something shows 「저장됨」 under the menu button');
  await shot('saved_tick');
  await sleep(1500);
  A(await ev(() => !document.querySelector('#savedTick').classList.contains('on')), 'and it is gone a second later');
  await L.closeAll(page);

  // ── 애도 곡: 교회 앞에서는 그대로, 걸어 나가면 놓는다 (전멸 뒤에는 onLose 가 건다 — 아래 B1) ──
  await ev(() => { var G = DS.G, s = G.save; G.quiet = true; DS.ui.closeAll(); var z = DS.buildZone(s.town), p = z.pois.filter(function (p) { return p.t === 'shop' && p.kind === 'church'; })[0]; DS.enterZone(s.town, null, { x: p.x, y: p.y + 1 }); DS.mournBgm(true); });
  await sleep(1500);
  c = await ev(() => { var G = DS.G, me = G.sim.byId[G.sel]; return { mourn: G.mournOn, town: !!G.zone.town && !G.scn, x: me && me.x, y: me && me.y }; });
  A(c.town && c.mourn === true, 'at the church door (' + c.x + ',' + c.y + ') the mourning track is held');
  await ev(() => { var G = DS.G, me = G.sim.byId[G.sel]; DS.ui.closeAll(); G.sim.setOrder(me.id, { t: 'move', x: 9, y: 3 }); });
  for (let i = 0; i < 60 && (await ev(() => DS.G.mournOn)); i++) { await ev(() => { if (DS.cineBusy()) DS.cineSkip(); }); await sleep(300); }
  c = await ev(() => { var G = DS.G, me = G.sim.byId[G.sel]; return { on: G.mournOn, x: me && me.x, y: me && me.y }; });
  A(c.on === false, 'and it lets go once the party walks away from the church ' + JSON.stringify(c));
  await L.closeAll(page);

  // ── 가로 844×390 ──
  await page.setViewportSize({ width: 844, height: 390 });
  await sleep(900);
  c = await ev(() => { var v = DS.G.view; return { k: v.k0, W: v.W, H: v.H, mw: v.mw, mh: v.mh, top: v.inset.top, bot: v.inset.bottom }; });
  A(c.mw * 16 * c.k >= c.W - 1, 'landscape 844×390: the town fills the width (k ' + c.k.toFixed(2) + ', ' + Math.round(c.mw * 16 * c.k) + ' ≥ ' + c.W + ' px) and pans up and down');
  await shot('town_landscape');
  await page.setViewportSize({ width: env.W, height: env.H });
  await sleep(500);
  // ── B1: 전멸의 까닭은 들어설 때의 평균으로 ──
  await L.edit(page, function () { DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 30; b.exp = 0; } }); DS.pSync(s); });
  await L.closeAll(page);
  c = await ev(() => { var G = DS.G, s = G.save; G.quiet = true; var pl0 = DS.partyL(s); DS.startScenario(DS.scn(3));
    DS.charList(s).forEach(function (c) { if (c.id !== s.hero) { var b = DS.bearer(s, c); if (b) b.L = 1; } }); DS.pSync(s);      // 싸우다 가주가 쓰러져 그 가문이 1레벨로 내려간 것처럼
    var pl1 = DS.partyL(s); G.sim.units.forEach(function (u) { if (u.side === 'ally' && !u.dead) G.sim.hurt(u, 1e9, u, {}); });
    return { pl0: pl0, pl1: pl1 }; });
  for (let i = 0; i < 80 && !(await ev(() => !!document.querySelector('.ov .result.lose'))); i++) { await ev(() => { var G = DS.G, sim = G.sim; if (sim && !sim.result) sim.units.forEach(function (u) { if (u.side === 'ally' && !u.dead) { u.buffs = {}; sim.hurt(u, 1e9, u, {}); } }); }); await sleep(200); }
  await sleep(600);
  const why = await ev(() => { var o = document.querySelector('.ov .result.lose'); return o ? [].map.call(o.querySelectorAll('.why li'), function (l) { return l.textContent; }) : null; });
  A(why && c.pl1 < c.pl0 && new RegExp('우리 평균 ' + '.*').test(why[0]) && why[0].indexOf(await ev((L) => DS.lvText(L), c.pl0)) >= 0 && !/모자랐다/.test(why[0]), 'wipe card: 「' + (why && why[0]) + '」 uses the level at entry (' + c.pl0 + '), not the one after a house fell to ' + c.pl1);
  A(await ev(() => DS.G.mournOn === true), 'the mourning track is armed on a wipe');
  await shot('lose_why');
  // ⑦ 소리
  c = await ev(() => { var a = DS.Audio, n = a.names(); return { wed: a.has('wed'), birth: a.has('birth'), mourn: n.sfx.indexOf('mourn') >= 0, track: n.bgm.indexOf('mourn') >= 0, duck: typeof a.cineDuck === 'function', api: typeof DS.mournBgm === 'function' }; });
  A(c.wed && c.birth && c.mourn && c.track && c.duck && c.api, 'audio: wed · birth · mourn effects, a mourn track and the cinematic duck exist');
  const bad = await L.badText(page, 'body');
  A(!bad.length, 'no NaN / undefined on screen' + (bad.length ? ': ' + bad.join(' | ') : ''));
};
