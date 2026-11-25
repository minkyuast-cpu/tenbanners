// 전민 — 2.6.0 규칙 시험: ① 병과에 맞지 않는 장비 −50% ② 떠난 이의 장비는 가방으로 ③ 맹주 넘기기 — 진짜 화면에서 (390×844)
//   PAGE=…/dist/test.html H=844 OUT=<폴더> node tools/shot.js tools/t_rules26.js
//   ① 수치(위력 · 치명타 · 강화 몫 · 옵션 수치는 절반, 깎는 값 · 기술은 그대로) · 붉은 꼬리표(장비 칸 · 고르기 창 · 가방 자세히) · 비교 화살표가 깎인 값 · 자동 장착 · 도움말 · 옛 저장의 소식 한 줄
//   ② 죽음의 길마다: 가주 전사(진짜 싸움 판의 die 사건) · 이름 지우기(die + erase) · 가주 천수 · 맹주 전사(후계 의식) · 맹주 천수 — 장비가 가방으로, 유품은 한 점, 후계는 빈손,
//      「장비 N점이 가방으로 돌아왔다」(이별 연출 · 추도 창) · 새 가주의 「장비가 없다」 창과 한 번에 입히기 · 부대 탭의 빈 칸 표시 · 가방 한도를 넘겨도 잃지 않는다
//   ③ 단추의 꺼진 까닭(받을 사람 없음 · 시나리오 중 · 싸우는 중 · 앉은 지 한 해 안) · 경고 글 · 받을 사람 목록(기본 = 저절로였다면 고를 사람 · 못 받는 사람의 까닭) · 두 걸음 확인(잠금 · 짧게 누르면 안 넘어감 · 길게 눌러야)
//      · 연출이 끝까지 · 옛 맹주는 까닭 「맹주 자리를 넘김」으로 떠나고 · 후계가 맹주 · 유품 한 점 · 장비는 가방 · 스무 해 없음 · 연출 · 의식이 겹치지 않는다 · 8단 위의 남긴 뜻 · 도중 실패는 통째로 되돌린다
'use strict';
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), sleep = L.sleep;
  const waitFor = async (f, a, ms) => { const t0 = Date.now(); for (;;) { const r = await ev(f, a); if (r) return r; if (Date.now() - t0 > (ms || 8000)) return r; await sleep(150); } };
  const top = () => ev(() => { var o = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost)')).pop(); return o ? o.innerText : ''; });
  // ── 판을 세운다: 보병 맹주 · 여섯 가문 · 어른 자식 둘 · 막사의 같은 병과 하나와 다른 병과 하나 · 배우자
  const setup = async (name) => {
    await L.newGame(page, { cls: 'inf', name: name || '한울' });
    await L.edit(page, function () {
      s.gold = 500000; for (var id = 1; id <= 13; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 6);
      DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 40; b.exp = 0; } });
      s.opt.cine = 'full'; DS.mercTidy(s); DS.pSync(s);
      var h = s.chars[s.hero], hp = DS.linOf(s, h);
      [[22, '새싹', 'f', 3], [18, '다온', 'm', 4]].forEach(function (k) { var m = DS.addMerc(s, 'm_sword', k[3], s.hero); m.kn = 1; m.L = k[0]; m.n = k[1]; m.by = s.cal.t - 20 * 600; m.ls = 70; var p = DS.linMkP(s, { k: 'm', sn: s.lin.sur, n: m.n, sx: k[2], gen: hp.gen + 1, pa: [hp.id], type: m.type, g: m.g, m: m.id, gv: 1, hb: 1 }); m.pid = p.id; });
      var sb = DS.addMerc(s, 'm_sword', 4, 0); sb.sb = 1; sb.nc = 'inf'; sb.L = 30; sb.n = '막사이';
      var ot = DS.addMerc(s, 'm_archer', 2, 0); ot.sb = 1; ot.nc = 'arc'; ot.L = 12; ot.n = '활잡이';
      var sp = DS.addMerc(s, 'm_sister', 3, 0); sp.sb = 1; sp.nc = 'mon'; sp.L = 20; sp.n = '고운'; sp.sx = h.sx === 'f' ? 'm' : 'f'; window.__spid = sp.id;      // 「고운」은 영웅관 이름 풀에도 있다 — 배우자는 id 로 찾는다
      DS.mercTidy(s); DS.pSync(s);
      DS.linWed(s, { c: s.hero }, { m: sp.id }, { anywhere: true });
      DS.mercTidy(s); DS.pSync(s);
    });
    await L.closeAll(page);
    await ev(() => { DS.gbUi = true; });      // 자동 시험(DS.G.quiet)에서도 「장비가 없다」 창을 본다
  };
  await setup('한울');
  let c;

  // ───────── ① 병과에 맞지 않는 장비 −50% ─────────
  c = await ev(() => {
    var on = { cls: 'inf', L: 40 }, off = { cls: 'mag', L: 40 }, g = DS.gear('sword.B+3'), gh = DS.gear('sword.A~heavy5~fang4'), gx = DS.gear('sword.A~hex');
    var a = DS.gearAt(g, 40, 'inf'), b = DS.gearAt(g, 40, 'mag'), ha = DS.gearAt(gh, 40, 'inf'), hb = DS.gearAt(gh, 40, 'mag');
    var bare = { id: 901, cls: 'inf', L: 40, w: null, a: null }, fit = { id: 901, cls: 'inf', L: 40, w: 'sword.A', a: null }, mis = { id: 901, cls: 'inf', L: 40, w: 'staff.A', a: null };
    var s0 = DS.charStats(bare), s1 = DS.charStats(fit), s2 = DS.charStats(mis);
    var fo = DS.charStats({ id: 902, cls: 'mag', L: 40, w: 'sword.A~heavy5~fang4', a: null }).gearFx, fi = DS.charStats({ id: 903, cls: 'inf', L: 40, w: 'sword.A~heavy5~fang4', a: null }).gearFx;
    var sx = DS.cmdSpec({ id: 904, cls: 'mag', L: 40, w: 'sword.A~hex', a: null, mp: 1 }, false), sy = DS.cmdSpec({ id: 905, cls: 'mag', L: 40, w: null, a: null, mp: 1 }, false);
    return { k: DS.GEAR_OFF, a: a, b: b, ha: ha, hb: hb, d1: s1.atk - s0.atk, d2: s2.atk - s0.atk, drain: [fi.drain, fo.drain], skill: [sx.skills.indexOf('slow') >= 0, sy.skills.indexOf('slow') >= 0],
      sc: [DS.gearScore(g, on), DS.gearScore(g, off)], txt: DS.gearOffTxt(), note: DS.gearOffNote() };
  });
  A(c.k === 0.5 && c.b.off && !c.a.off && Math.abs(c.b.pow - c.a.pow / 2) <= 0.5 && Math.abs(c.b.crit - c.a.crit / 2) < 1e-9 && Math.abs(c.b.amp - c.a.amp / 2) < 1e-9,
    'off-class gear gives half: 레이피어 +3 위력 ' + c.a.pow + ' → ' + c.b.pow + ', 치명타 ' + c.a.crit + ' → ' + c.b.crit + ', 강화 몫 ' + c.a.amp + ' → ' + c.b.amp);
  A(c.ha.spd === c.hb.spd && c.ha.spd < 0 && Math.abs(c.hb.pow - c.ha.pow / 2) <= 0.5, 'a drawback is not halved: 묵직한 행동 회복 ' + c.ha.spd + ' stays ' + c.hb.spd + ' (위력 ' + c.ha.pow + ' → ' + c.hb.pow + ')');
  A(c.d1 > 0 && Math.abs(c.d2 - c.d1 / 2) <= 1, 'in real stats the weapon adds half: fitting +' + c.d1 + ' 공격, off-class +' + c.d2);
  A(Math.abs(c.drain[1] - c.drain[0] / 2) < 1e-9 && c.drain[0] > 0 && c.skill[0] && !c.skill[1], 'option numbers are halved (흡혈 ' + c.drain[0] + ' → ' + c.drain[1] + '), on/off effects stay (기술 「둔화」 still granted)');
  A(c.sc[1] < c.sc[0] * 0.6 && c.txt === '병과 안 맞음 −50%' && /50%만 든다/.test(c.note), 'score ' + c.sc[0] + ' → ' + c.sc[1] + ' · tag 「' + c.txt + '」 · note: ' + c.note);
  // 화면: 맹주(보병)가 지팡이를 들었다 — 장비 칸 · 고르기 창 · 가방 자세히
  await L.edit(page, function () { var h = s.chars[s.hero]; s.gear['staff.A+3'] = 1; s.gear['sword.A+1'] = 1; s.gear['bow.gale'] = 1; DS.equip(s, h, 'staff.A+3'); });
  await ev(() => { DS.heroInfo(); }); await sleep(500);
  c = await ev(() => { var t = document.querySelector('.gt2.sl-w'), g = t && t.querySelector('.goff.g50'), a = document.querySelector('.gt2.sl-a .goff'); return { t: g ? g.textContent : '', col: g ? getComputedStyle(g).color : '', armour: !!a }; });
  A(c.t === '병과 안 맞음 −50%' && /rgb\(255, 1[0-9]{2}, 1[0-9]{2}\)/.test(c.col) && !c.armour, 'gear tile: red tag 「' + c.t + '」 on the staff (' + c.col + '), none on the fitting armour');
  await shot('r3_tile');
  await page.click('.gt2.sl-w'); await sleep(500);
  c = await ev(() => {
    var o = [].slice.call(document.querySelectorAll('#app .ov')).pop(), cur = o.querySelector('.gpk-cur'), rows = [].slice.call(o.querySelectorAll('.gpk-r'));
    var row = function (id) { var r = rows.filter(function (x) { return x.dataset.on === id; })[0]; return r ? { off: !!r.querySelector('.goff.g50'), best: r.classList.contains('best'), up: r.querySelectorAll('.sch.up').length, dn: r.querySelectorAll('.sch.dn').length, t: r.innerText.replace(/\n/g, ' ') } : null; };
    return { cur: cur.innerText.replace(/\n/g, ' / '), curTags: cur.querySelectorAll('.goff.g50').length, note: !!cur.querySelector('.goffn'), sword: row('sword.A+1'), bow: row('bow.gale'), best: (o.querySelector('[data-gbest] small') || {}).textContent || '' };
  });
  A(/병과 안 맞음 −50%/.test(c.cur) && c.curTags === 1 && c.note && /절반|50%만/.test(c.cur), 'picker, worn piece: one red tag and the rule line — ' + c.cur.slice(0, 120));
  A(c.sword && !c.sword.off && c.sword.best && c.sword.up > 0 && c.bow && c.bow.off && /롱소드 \+1/.test(c.best), 'picker rows: fitting 롱소드 +1 is 「가장 좋음」 with ▲ chips (' + c.sword.t.slice(0, 60) + '), the off-class bow carries the tag (' + c.bow.t.slice(0, 70) + ')');
  await shot('r3_picker');
  c = await ev(() => {      // 비교 화살표가 깎인 값인가: 강화 +3 지팡이(맨 수치는 더 크다)를 든 채 롱소드 +1 로 바꾸면 공격이 오른다고 보여야 한다
    var s = DS.G.save, h = s.chars[s.hero], a = DS.charStats(h), o = {}; for (var k in h) o[k] = h[k]; o.w = 'sword.A+1'; var b = DS.charStats(o);
    var raw = [DS.gearScore(DS.gear('staff.A+3')), DS.gearScore(DS.gear('sword.A+1'))], mine = [DS.gearScore(DS.gear('staff.A+3'), h), DS.gearScore(DS.gear('sword.A+1'), h)];
    return { atk: [a.atk, b.atk], raw: raw, mine: mine };
  });
  A(c.raw[0] > c.raw[1] && c.mine[0] < c.mine[1] && c.atk[1] > c.atk[0], 'compare includes the penalty: 스태프 +3 beats 롱소드 +1 on paper (' + c.raw.join(' vs ') + ') but not on this 보병 (' + c.mine.join(' vs ') + ', 공격 ' + c.atk.join(' → ') + ')');
  await page.click('[data-gbest]'); await sleep(500);
  c = await ev(() => { var s = DS.G.save, h = s.chars[s.hero]; return { w: h.w, bag: s.gear['staff.A+3'] || 0 }; });
  A(c.w === 'sword.A+1' && c.bag === 1, '「가장 좋은 것」 equips the fitting sword; the off-class staff goes back to the bag');
  c = await ev(() => {
    var s = DS.G.save, h = s.chars[s.hero], keep = JSON.parse(JSON.stringify(s.gear)), k; DS.unequip(s, h, 'w'); s.gear = { 'staff.A+9': 1, 'sword.A+1': 1 };
    DS.autoEquip(s, h); var w1 = h.w; h.w = null; s.gear = { 'staff.A+9': 1 }; DS.autoEquip(s, h); var w2 = h.w;
    h.w = 'sword.A+1'; s.gear = keep; delete s.gear['sword.A+1']; return { w1: w1, w2: w2 };
  });
  A(c.w1 === 'sword.A+1' && /^staff\.A\+/.test(c.w2), 'auto-equip accounts for it: picks 롱소드 +1 over 스태프 +9 (' + c.w1 + '); with no sword left it still wears the staff at half value (' + c.w2 + ')');
  const G2 = await ev(() => { var s = DS.G.save, o = DS.charList(s).filter(function (c) { return c.id !== s.hero && DS.CLS_GEAR[c.cls].w[0] !== 'sword' && DS.bearer(s, c, 1); })[0], id = DS.CLS_GEAR[o.cls].w[0] + '.A+5'; s.gear[id] = 1; window.__g2 = { id: id, ch: o.id }; DS.ui.closeAll(); DS.openMenu('bag'); return id; }); await sleep(500);
  await page.click('[data-loot-open="' + G2 + '"] .tx'); await sleep(500);
  c = await ev(() => {
    var o = [].slice.call(document.querySelectorAll('#app .ov')).pop(), rows = [].slice.call(o.querySelectorAll('.lcmp .row')), note = o.querySelector('.lcmp p.goffn');
    var s = DS.G.save, g = DS.gear(window.__g2.id), by = {}, wrong = 0; rows.forEach(function (r) { var id = +r.querySelector('[data-loot-wear]').dataset.lootWear, ch = s.chars[id], off = !!r.querySelector('.goff.g50'); if (off === DS.gearFits(ch.cls, g)) wrong++; by[id] = { off: off, arrow: (r.querySelector('em') || {}).textContent || '' }; });
    return { note: note ? note.textContent : '', hero: by[s.hero], fit: by[window.__g2.ch], n: rows.length, wrong: wrong };
  });
  A(/병과 안 맞음 −50%/.test(c.note) && /깎인 뒤의 값/.test(c.note) && c.wrong === 0 && c.hero && c.hero.off && c.hero.arrow === '▼' && c.fit && !c.fit.off && c.fit.arrow === '▲', 'bag detail of ' + G2 + ': every off-class house row is tagged (' + c.n + ' rows), the 보병 맹주 gets ▼, the fitting house ▲ — ' + c.note.slice(0, 60));
  await shot('r3_bag_detail');
  await ev(() => { delete DS.G.save.gear[window.__g2.id]; });
  await ev(() => { DS.ui.closeAll(); DS.openMenu('help'); }); await sleep(400);
  c = await ev(() => { var t = document.querySelector('.ov .sb').innerText; return { off: /병과에 맞지 않는 장비는 그 장비의 수치와 옵션 수치가 50% 깎인다/.test(t), bag: /떠난 가주나 맹주가 입던 장비는 모두 가방으로 돌아온다/.test(t), nk: /맹주 넘기기/.test(t) && /넘긴 맹주는 기운을 모두 쏟고 눈을 감는다\. 되돌릴 수 없다/.test(t), old: /장비와 공훈은 가문에 남는다/.test(t) }; });
  A(c.off && c.bag && c.nk && !c.old, 'help states the three rules exactly (−50% · gear returns to the bag · 맹주 넘기기), and no longer says gear stays with the house');
  c = await ev(() => {      // 옛 저장(이 규칙을 모르던 저장)을 읽으면 소식 한 줄, 한 번만
    var s = JSON.parse(JSON.stringify(DS.G.save)); delete s.r26; s.news = []; var h = s.chars[s.hero]; h.w = 'staff.A';
    var a = DS.fixSave(s), n1 = a.news.slice(), b = DS.fixSave(JSON.parse(JSON.stringify(a)));
    var fresh = DS.fixSave(JSON.parse(JSON.stringify(DS.newSave('새', 'mag'))));
    return { n1: n1, again: b.news.length, r26: a.r26, fresh: fresh.news.length, hw: a.chars[a.hero].w };
  });
  A(c.n1.length === 1 && /병과에 맞지 않는 장비는 이제 수치가 절반만 듭니다/.test(c.n1[0]) && /1개 가문/.test(c.n1[0]) && c.again === 1 && c.r26 === 1 && c.fresh === 0 && c.hw === 'staff.A', 'old save wearing off-class gear: one news line, once; gear untouched — ' + c.n1[0]);
  await L.closeAll(page);

  // ───────── ② 떠난 이의 장비는 가방으로 ─────────
  // (가) 가주 전사 — 진짜 싸움 판: 들판에서 가주 유닛을 쓰러뜨린다 (game.js 의 die → bearerFell → DS.linMercDied)
  const bagN = () => ev(() => { var s = DS.G.save, n = 0; for (var k in s.gear) n += s.gear[k]; return n; });
  const fell = async (erase) => {
    const pre = await ev(() => {
      var s = DS.G.save, sim = DS.G.sim, u = sim.units.filter(function (x) { return x.side === 'ally' && x.role === 'cmd' && !x.dead && x.ch !== s.hero; })[0]; if (!u) return null;
      var ch = s.chars[u.ch], b = DS.bearer(s, ch); b.it = 'mg_whet'; s.coffins.have = Math.max(s.coffins.have || 0, 2);
      var n = 0; for (var k in s.gear) n += s.gear[k];
      window.__f = { ch: ch.id, w: ch.w, a: ch.a, mid: b.id, n: b.n, bag: n, whet: s.items.mg_whet || 0, hl: Object.keys(s.gh || {}).filter(function (k) { return s.gh[k].hl; }).length };
      return window.__f;
    });
    await ev((er) => { var s = DS.G.save, sim = DS.G.sim, u = sim.byId['c' + window.__f.ch]; DS.G.quiet = true; if (er) sim._erK = 1; sim.kill(u, null); sim._erK = 0; }, erase);
    await waitFor(() => { var s = DS.G.save, f = window.__f; return !s.mercs.some(function (m) { return m.id === f.mid; }); });
    await sleep(300);
    const post = await ev(() => {
      var s = DS.G.save, f = window.__f, ch = s.chars[f.ch], n = 0; for (var k in s.gear) n += s.gear[k];
      var P = s.lin.P, dp = null; for (var id in P) if (P[id].st !== 'live' && P[id].n === f.n && P[id].d) dp = P[id];
      return { w: ch.w, a: ch.a, bag: n, bw: s.gear[f.w] || 0, ba: s.gear[f.a] || 0, whet: s.items.mg_whet || 0, hl: Object.keys(s.gh || {}).filter(function (k) { return s.gh[k].hl; }).length, hlW: !!DS.hlOf(s, f.w), lock: !!s.lock[f.w], gb: dp && dp.d.gb, why: dp && dp.d.why, q: (DS.G.lineageQ || []).filter(function (e) { return e.t === 'death'; }).map(function (e) { return e.gb; }) };
    });
    return { pre, post };
  };
  await ev(() => { DS.G.quiet = true; DS.enterZone('dawn', null, null); }); await sleep(1200); await L.closeAll(page);
  let f = await fell(false);
  A(f.pre && f.pre.w && f.pre.a && f.post.w == null && f.post.a == null && f.post.bag === f.pre.bag + 2 && f.post.bw >= 1 && f.post.ba >= 1 && f.post.whet === f.pre.whet + 1,
    'a 가주 falls in a real field fight: weapon and armour leave the house and land in the bag (' + f.pre.w + ', ' + f.pre.a + '), the held 숫돌 too');
  A(f.post.hl === f.pre.hl + 1 && f.post.hlW && f.post.lock && f.post.gb === 3 && f.post.q.join() === '3', 'exactly one heirloom is made (the weapon, locked, now in the bag); the death event says 3 pieces came back');
  // 싸움이 끝나면: 이별 연출 → 추도 창 → (막사의 같은 병과가 잇는다) 잇는 연출 → 「장비가 없다」 창
  await ev(() => { var s = DS.G.save, f = window.__f, ch = s.chars[f.ch], m = DS.addMerc(s, DS.baseMercTypes(ch.cls)[0], 4, 0); m.sb = 1; m.nc = DS.houseCls(ch); m.L = 33; m.n = '이음'; DS.mercTidy(s); DS.lineageFlush(function () { DS.bnNote(DS.sbTick(s)); DS.rebuildParty(); DS.ui.persist(); }); });
  c = await waitFor(() => { var el = document.querySelector('.cine.ck-death'); return el ? { gb: (el.querySelector('.cgb') || {}).textContent || '', hl: (el.querySelector('.chl') || {}).textContent || '' } : null; });
  A(c && c.gb === '장비 3점이 가방으로 돌아왔다' && /유품: /.test(c.hl), 'farewell cinematic: 「' + (c && c.hl) + '」 and 「' + (c && c.gb) + '」');
  await sleep(2400); await shot('r2_death_cine');
  await ev(() => DS.cineSkip()); await sleep(700);
  c = await ev(() => { var o = document.querySelector('.ov .lgrite.lgothers'); return o ? { gb: (o.querySelector('.gbl') || {}).textContent || '' } : null; });
  A(c && c.gb === '장비 3점이 가방으로 돌아왔다', 'mourning window carries the same line');
  await shot('r2_mourn');
  await page.click('.ov .lgothers [data-close]'); await sleep(400);
  c = await waitFor(() => { var el = document.querySelector('.cine.ck-succ'); return el ? el.querySelector('.crib').textContent : ''; });
  A(/이음/.test(c), 'the 막사 person takes the seat (' + c + ')');
  await ev(() => DS.cineSkip());
  // 2.6.0: 쓰러짐 안내가 죽음 장면 뒤로 늦게 뜬다 — 다른 창이 떠 있으면 닫아 가며 기다린다 (묻는 창은 화면이 빌 때 뜬다)
  for (let i = 0; i < 30; i++) { const st = await ev(() => ({ cine: DS.cineBusy(), gbd: !!document.querySelector('.ov .gbd'), ov: !!document.querySelector('#app .ov:not(.ghost)') })); if (st.gbd) break; if (st.cine) await ev(() => DS.cineSkip()); else if (st.ov) await ev(() => { var b = document.querySelector('#app .ov:not(.ghost) [data-close]'); if (b) b.click(); else DS.ui.closeAll(); }); await sleep(500); }
  c = await waitFor(() => { var o = document.querySelector('.ov .gbd'); return o ? { t: o.innerText.replace(/\n+/g, ' / '), btn: !!o.querySelector('[data-gbd]') } : null; }, null, 6000);
  A(c && /새 가주/.test(c.t) && /장비가 없다/.test(c.t) && /이음/.test(c.t) && /무기 .+, 방어구 /.test(c.t) && c.btn, 'then the nudge: ' + (c && c.t));
  await shot('r2_nudge');
  await ev(() => { document.querySelector('.ov .gbd [data-close]').click(); }); await sleep(400);
  await ev(() => DS.openMenu('party')); await sleep(600);
  c = await ev(() => { var f = window.__f, cell = document.querySelector('.hk[data-ch="' + f.ch + '"]'), e = cell ? cell.querySelectorAll('.hgs.e') : []; return { n: e.length, mark: e.length ? getComputedStyle(e[0], '::after').content : '', other: document.querySelectorAll('.hk.hgh:not([data-ch="' + f.ch + '"]) .hgs.e').length }; });
  A(c.n === 2 && /!/.test(c.mark) && c.other === 0, 'party tab: the heir\'s two empty slots are marked (' + c.mark + '), other houses are not');
  await shot('r2_party_mark');
  await ev(() => { DS.ui.closeAll(); DS.charSheetOpen(window.__f.ch); }); await sleep(500);
  c = await ev(() => { var b = document.querySelector('[data-autoeq]'); return b ? b.innerText.replace(/\n/g, ' / ') : ''; });
  A(/장비 자동 착용/.test(c) && /무기 /.test(c), 'house window: one-tap button under the empty slots (' + c + ')');
  await shot('r2_house_btn');
  await page.click('[data-autoeq]'); await sleep(500);
  c = await ev(() => { var s = DS.G.save, f = window.__f, ch = s.chars[f.ch]; return { w: ch.w, a: ch.a, hl: !!DS.hlOf(s, ch.w), btn: !!document.querySelector('[data-autoeq]'), bonus: DS.hlBonus(s, ch) }; });
  A(c.w && c.a && !c.btn && c.hl && c.bonus, 'one tap dresses the heir (' + c.w + ', ' + c.a + '); the house heirloom is back on with its bonus ' + JSON.stringify(c.bonus));
  await L.closeAll(page);
  // (나) 이름 지우기(30번의 die + erase)도 같은 길
  f = await fell(true);
  A(f.pre && f.post.w == null && f.post.a == null && f.post.bag === f.pre.bag + 2 && f.post.hl === f.pre.hl + 1, 'erased by the dusk king (die + erase): same — gear in the bag, one heirloom');
  await ev(() => { DS.G.lineageQ = []; DS.ui.closeAll(); var s = DS.G.save; DS.linBattleStart(s); DS.sbTick(s); DS.mercTidy(s); DS.rebuildParty(); }); await sleep(300); await L.closeAll(page);
  // (다) 가주 천수 — 마을에 들어설 때의 나이 판정 (DS.ageCheck)
  c = await ev(() => {
    var s = DS.G.save, ch = DS.charList(s).filter(function (x) { return x.id !== s.hero && DS.bearer(s, x, 1) && x.w && x.a; })[0], b = DS.bearer(s, ch), w = ch.w, a = ch.a, n = 0, k; for (k in s.gear) n += s.gear[k];
    b.by = s.cal.t - 80 * 600; b.ls = 60; var evs = DS.ageCheck(s, '해밀'); var n2 = 0; for (k in s.gear) n2 += s.gear[k];
    return { cls: ch.cls, w0: w, a0: a, w: ch.w, a: ch.a, d: n2 - n, gone: !s.mercs.some(function (m) { return m.id === b.id; }), ev: evs.map(function (e) { return e.t + (e.gb != null ? ':' + e.gb : ''); }) };
  });
  A(c.gone && c.w == null && c.a == null && c.d === 2, 'a 가주 dies of old age (' + c.cls + '): gear returns to the bag too [' + c.ev.join(', ') + ']');
  // (라) 가방 한도: 보통 장비가 한도(40)를 넘겨도 돌아오는 장비는 그대로 들어간다
  c = await ev(() => {
    var s = DS.G.save, t = JSON.parse(JSON.stringify(s)); t = DS.fixSave(t);
    for (var i = 0; i < 60; i++) t.gear['sword.A+' + (1 + i % 20)] = (t.gear['sword.A+' + (1 + i % 20)] || 0) + 1;
    var h = t.chars[t.hero], w = h.w, a = h.a, n = 0, k; for (k in t.gear) n += t.gear[k];
    h.down = true; DS.linSettle(t, '시험'); var n2 = 0; for (k in t.gear) n2 += t.gear[k];
    return { cap: DS.DROP.plain.bag, n: n, n2: n2, w: t.gear[w] || 0, a: t.gear[a] || 0 };
  });
  A(c.n > c.cap && c.n2 === c.n + 2 && c.w >= 1 && c.a >= 1, 'bag over its limit (' + c.n + ' > ' + c.cap + '): returning gear is never dropped or sold (' + c.n + ' → ' + c.n2 + ')');
  // (마) 맹주 전사 → 후계 의식: 추도 걸음의 한 줄 · 확인 걸음의 글 · 후계는 빈손 · 새 맹주에게 「장비가 없다」
  await ev(() => { DS.ui.closeAll(); DS.G.quiet = true; var s = DS.G.save, h = s.chars[s.hero]; window.__h = { w: h.w, a: h.a, pid: h.pid, hl: Object.keys(s.gh || {}).filter(function (k) { return s.gh[k].hl; }).length }; var u = DS.G.sim.byId['c' + s.hero]; DS.G.sim.kill(u, null); });
  await waitFor(() => DS.G.save.chars[DS.G.save.hero].down);
  await ev(() => { var s = DS.G.save; if (!s.chars[s.hero].vac) { DS.G.lineageQ = (DS.G.lineageQ || []).concat(DS.linSettle(s, '새벽 들판')); } DS.lineageFlush(function () { DS.rebuildParty(); DS.ui.persist(); }); });
  c = await waitFor(() => { var el = document.querySelector('.cine.ck-death'); return el ? (el.querySelector('.cgb') || {}).textContent || '-' : ''; });
  A(c === '장비 2점이 가방으로 돌아왔다', 'the 맹주 falls: farewell cinematic says 「' + c + '」');
  await ev(() => DS.cineSkip()); await sleep(700);
  await waitFor(() => !!document.querySelector('.ov .lgrite .gbl'), null, 12000);      // 2.6.0: 추도는 교회에서 치른다 — 창이 뜰 때까지 기다린다
  c = await ev(() => { var g0 = document.querySelector('.ov .lgrite .gbl'), o = g0 ? g0.closest('.lgrite') : document.querySelector('.ov .lgrite'), s = DS.G.save, h = s.chars[s.hero], b = window.__h; return { gb: (o.querySelector('.gbl') || {}).textContent || '',      // 창이 둘일 수 있다 (추도 · 「장비가 없다」) — 줄이 있는 창을 본다
    w: h.w, a: h.a, bw: s.gear[b.w] || 0, ba: s.gear[b.a] || 0, hl: Object.keys(s.gh || {}).filter(function (k) { return s.gh[k].hl; }).length - b.hl }; });
  A(c.gb === '장비 2점이 가방으로 돌아왔다' && c.w == null && c.a == null && c.bw >= 1 && c.ba >= 1 && c.hl === 1, 'succession rite, mourning step: the line is there; the seat is stripped, both pieces are in the bag, one heirloom ' + JSON.stringify(c));
  await shot('r2_rite_mourn');
  await page.click('[data-lgstep="pick"]'); await sleep(400); await page.click('[data-lgheir]'); await sleep(1100);
  c = await top();
  A(/공훈은 가문에 남는다\. 선대의 장비는 가방으로 돌아왔다\. 새 맹주는 장비 없이 시작한다/.test(c) && !/장비와 공훈은 가문에 남는다/.test(c), 'confirm step no longer promises the gear: 「…선대의 장비는 가방으로 돌아왔다. 새 맹주는 장비 없이 시작한다」');
  await shot('r2_rite_confirm');
  await page.click('#yesHeir'); await sleep(600); await L.skipStory(page); await sleep(600);
  for (let i = 0; i < 40; i++) { const st = await ev(() => { var g = document.querySelector('.ov .gbd'), mine = !!g && /새 맹주/.test(g.innerText); return { cine: DS.cineBusy(), gbd: mine, ov: !!document.querySelector('#app .ov:not(.ghost)') }; }); if (st.gbd) break;      // 앞 장에서 선 다른 가주의 「장비가 없다」가 먼저 뜰 수 있다 — 그 창은 닫고 새 맹주의 것을 기다린다
    if (st.cine) await ev(() => DS.cineSkip()); else if (st.ov) await ev(() => { var b = document.querySelector('#app .ov:not(.ghost) [data-close]'); if (b) b.click(); else DS.ui.closeAll(); }); await sleep(700); }
  c = await ev(() => { var o = document.querySelector('.ov .gbd'), s = DS.G.save, h = s.chars[s.hero]; return { t: o ? o.innerText.replace(/\n+/g, ' / ') : '', w: h.w, a: h.a, vac: !!h.vac, name: DS.charName(h), dbg: DS.charList(s).map(function (ch) { return ch.id + ch.cls + (ch.id === s.hero ? '*' : '') + ':' + (ch.w || '-') + '/' + (ch.a || '-') + (ch.vac ? ' vac' : ''); }).join(' | ') + ' || bag ' + Object.keys(s.gear).join(',') }; });
  A(!c.vac && c.w == null && c.a == null && /새 맹주/.test(c.t) && /장비가 없다/.test(c.t) && /장비 자동 착용/.test(c.t), 'new 맹주 ' + c.name + ' stands with empty slots and gets the nudge: ' + c.t + ' ## ' + c.dbg);
  await page.click('.ov .gbd [data-gbd]'); await sleep(600);
  c = await ev(() => { var s = DS.G.save, h = s.chars[s.hero]; return { w: h.w, a: h.a, fits: DS.gearFits(h.cls, DS.gear(h.w)) && DS.gearFits(h.cls, DS.gear(h.a)) }; });
  A(c.w && c.a && c.fits, '「장비 자동 착용」 dresses the new 맹주 in fitting gear (' + c.w + ', ' + c.a + ')');
  await L.closeAll(page);
  // (바) 맹주 천수 (마을에 들어설 때 — DS.ageCheck + DS.ageSettle)
  c = await ev(() => {
    var s = JSON.parse(JSON.stringify(DS.G.save)); s = DS.fixSave(s); var h = s.chars[s.hero], w = h.w, a = h.a;
    h.by = s.cal.t - 90 * 600; h.ls = 60; var evs = DS.ageCheck(s, '해밀').concat(DS.ageSettle(s, '해밀')), d = evs.filter(function (e) { return e.t === 'death' && e.k === 'c'; })[0], p = d && s.lin.P[d.a];
    return { why: p && p.d.why, gb: d && d.gb, w: h.w, a: h.a, bw: s.gear[w] || 0, ba: s.gear[a] || 0 };
  });
  A(c.why === '천수를 누림' && c.gb === 2 && c.w == null && c.a == null && c.bw >= 1 && c.ba >= 1, 'the 맹주 dies of old age: same rule (why 「' + c.why + '」, ' + c.gb + ' pieces back)');

  // ───────── ③ 맹주 넘기기 ─────────
  // 꺼진 단추와 까닭
  c = await ev(() => { var t = DS.newSave('혼자', 'mag'); return DS.nkCan(t); });
  A(!c.ok && /받을 사람이 없다/.test(c.why), 'no eligible successor → not allowed: ' + c.why);
  await setup('한울');
  await L.edit(page, function () { var h = s.chars[s.hero]; s.gear['sword.A~keen7'] = 1; DS.equip(s, h, 'sword.A~keen7'); s.coffins.have = 1; });
  // 시나리오 중 · 싸우는 중: 판정이 읽는 깃발(G.scn · sim.combat)을 한 박자 세워 단추가 꺼지고 까닭이 보이는지 본다 (진짜 싸움을 벌이면 그 뒤처리가 아래 흐름과 섞인다)
  c = await ev(() => { var G = DS.G, was = G.scn; G.scn = DS.scn(3); var r = DS.nkCan(G.save), o0 = DS.heroInfo(), b = o0.querySelector('[data-nk]'), w = o0.querySelector('.nkwhy'); var o = { dis: b.disabled, why: w.textContent, can: r.ok }; G.scn = was; DS.ui.closeAll(); return o; });
  A(c.dis && c.why === '시나리오 중에는 넘길 수 없다' && !c.can, 'mid-scenario: button disabled with the reason 「' + c.why + '」');
  await sleep(300);
  c = await ev(() => { var sim = DS.G.sim, was = sim.combat; sim.combat = true; var r = DS.nkCan(DS.G.save), o0 = DS.heroInfo(), b = o0.querySelector('[data-nk]'), w = o0.querySelector('.nkwhy'); var o = { dis: b.disabled, why: w.textContent, can: r.ok }; sim.combat = was; DS.ui.closeAll(); return o; });
  await sleep(300);
  A(c.dis && c.why === '싸우는 동안에는 넘길 수 없다' && !c.can, 'while a fight is on in the field: disabled, 「' + c.why + '」');
  // 여는 길: 대장 인물 정보 맨 아래 단추 → 경고 창
  const snap0 = await ev(() => { var s = DS.G.save, h = s.chars[s.hero], P = s.lin.P; window.__o = { name: DS.charName(h), pid: h.pid, w: h.w, a: h.a, L: h.L, lapse: s.lapse || 0, cleared: Object.keys(s.cleared).length, gold: s.gold, yr: DS.calNow(s).yr, tickets: s.tickets, hl: Object.keys(s.gh || {}).filter(function (k) { return s.gh[k].hl; }).length, auto: (DS.linAutoPick(s, s.hero) || {}).mid, log: s.lin.log.length, bag: JSON.parse(JSON.stringify(s.gear)) }; return window.__o; });
  await ev(() => DS.heroInfo()); await sleep(500);
  c = await ev(() => { var b = document.querySelector('[data-nk]'), w = document.querySelector('.nkwhy'); b.scrollIntoView({ block: 'center' }); return { dis: b.disabled, t: b.textContent, why: w.textContent }; });
  A(!c.dis && c.t === '맹주 넘기기' && /넘긴 맹주는 눈을 감는다/.test(c.why), 'hero window: 「' + c.t + '」 at the bottom, with a plain hint (' + c.why + ')');
  await sleep(300); await shot('r1_hero_button');
  await page.click('[data-nk]'); await sleep(400);
  c = await ev(() => {
    var o = document.querySelector('.ov.nkov'), d = o.querySelector('.nkd'), sel = d.querySelector('.nkh[aria-checked="true"]'), nx = d.querySelector('#nkNext');
    return { warn: d.querySelector('.nkw').textContent, modal: o.classList.contains('modal'), rows: [].slice.call(d.querySelectorAll('.nkh')).map(function (r) { return r.dataset.nkheir + ':' + r.className.replace(/.*k-o(\d).*/, '$1'); }), sel: sel ? +sel.dataset.nkheir : 0, nextOff: nx.disabled, cons: [].slice.call(d.querySelectorAll('.nkc li')).map(function (l) { return l.textContent; }), groups: [].slice.call(d.querySelectorAll('h5.nkg')).map(function (x) { return x.textContent.trim(); }) };
  });
  A(c.modal && c.warn === '한울은 제 기운을 모두 후계에게 쏟고 죽는다. 영영 떠난다. 되돌릴 수 없다.', 'warning, in-page and modal: 「' + c.warn + '」');
  const rule = await ev(() => { var s = DS.G.save; return DS.linChoices(s, s.hero).map(function (h) { return h.mid + ':' + h.opt; }).sort().join(); });      // 맹주가 지금 쓰러졌다면 후계 의식이 보여 줄 사람들
  A(c.sel === snap0.auto && c.rows.slice().sort().join() === rule && c.rows.filter(r => /:1$/.test(r)).length === 2 && c.rows.filter(r => /:2$/.test(r)).length === 1 && c.rows.filter(r => /:3$/.test(r)).length >= 3, 'candidates = exactly the existing succession rule (' + c.groups.join(' · ') + '); default is the one automatic succession would pick (#' + c.sel + ')');
  const cons = c.cons.join(' | ');
  A(/한울은 죽는다\. 되돌릴 수 없다/.test(cons) && /입고 있던 장비 2점은 가방으로 돌아온다 \(날 선 롱소드, 플레이트\)/.test(cons) && /무기 날 선 롱소드는 한울의 유품이 된다/.test(cons) && /새싹이 새 맹주가 된다\. 3단 Lv2 → /.test(cons) && /새 맹주는 장비 없이 시작한다/.test(cons) && /배우자 고운.*사별한다/.test(cons) && /비탄/.test(cons) && /스무 해는 흐르지 않는다/.test(cons),
    'concrete consequences listed: ' + cons);
  await shot('r1_warning');
  // 뜨자마자 누른 손은 넘어가지 않는다 (단추가 잠겨 있다)
  await ev(() => { var b = document.querySelector('#nkNext'); b.scrollIntoView({ block: 'center' }); b.click(); }); await sleep(150);
  A(await ev(() => !!document.querySelector('#nkNext') && !document.querySelector('#nkHold')), 'a tap right after it opens does nothing (first button locked for a moment)');
  // 못 받는 사람과 까닭 · 다른 사람 고르기
  await ev(() => document.querySelector('[data-nkmore]').click()); await sleep(250);
  c = await ev(() => [].slice.call(document.querySelectorAll('.nkno li')).map(function (l) { return l.innerText.replace(/\n/g, ': '); }));
  A(c.some(t => /고운: 맹주의 배우자는 잇지 못한다/.test(t)) && c.some(t => /활잡이: 막사의 다른 병과\. 맹주와 같은 병과만 잇는다/.test(t)), 'who cannot receive it and why — ' + c.join(' · '));
  await ev(() => { document.querySelector('.nkno').scrollIntoView({ block: 'center' }); }); await sleep(200); await shot('r1_cannot');
  await ev(() => { var r = [].slice.call(document.querySelectorAll('.nkh.k-o2'))[0]; r.click(); }); await sleep(250);
  c = await ev(() => ({ sel: document.querySelector('.nkh[aria-checked="true"]').className, cons: [].slice.call(document.querySelectorAll('.nkc li')).map(function (l) { return l.textContent; }).join(' | ') }));
  A(/k-o2/.test(c.sel) && /막사이가 막사에서 나와 새 맹주가 된다\. 제 레벨 3단 Lv10 그대로/.test(c.cons), 'picking the 막사 person updates the list: ' + c.cons.split(' | ')[3]);
  await ev(() => { var r = [].slice.call(document.querySelectorAll('.nkh.k-o3'))[0]; r.click(); }); await sleep(250);
  c = await ev(() => ({ cons: [].slice.call(document.querySelectorAll('.nkc li')).map(function (l) { return l.textContent; }).join(' | '), ho: document.querySelectorAll('[data-nkho]').length }));
  A(/맹주 자리가 .+ 가문으로 간다\. .+ 제 장비와 공훈 그대로 맹주가 된다/.test(c.cons) && /로저스 가문은 보통 가문이 된다/.test(c.cons) && !/새 맹주는 장비 없이 시작한다/.test(c.cons) && c.ho === 2, 'another house\'s 가주: the seat moves, that house keeps its gear; 호 choice shown');
  await ev(() => { var r = [].slice.call(document.querySelectorAll('.nkh.k-o1'))[1]; r.click(); }); await sleep(250);      // 둘째 자식(다온)을 고른다 — 기본이 아닌 사람
  const pickMid = await ev(() => +document.querySelector('.nkh[aria-checked="true"]').dataset.nkheir);
  A(pickMid && pickMid !== snap0.auto, 'the player picks someone other than the default (#' + pickMid + ')');
  await ev(() => { var b = document.querySelector('[data-nkbody="keep"]'); b.scrollIntoView({ block: 'center' }); }); await sleep(200);
  c = await ev(() => { var k = document.querySelector('[data-nkbody="keep"]'); return { dis: k.disabled, on: k.getAttribute('aria-pressed'), t: k.innerText.replace(/\n/g, ' ') }; });
  A(!c.dis && c.on === 'true' && /빈 관 1개/.test(c.t), 'coffin choice like any death: ' + c.t);
  await shot('r1_warning_bottom');
  await sleep(900);
  await page.click('#nkNext'); await sleep(300);
  c = await ev(() => { var d = document.querySelector('.nkd'), b = d.querySelector('#nkHold'); return { t: d.innerText.replace(/\n+/g, ' / '), hold: !!b, dis: b && b.disabled }; });
  A(c.hold && c.dis && /마지막 확인/.test(c.t) && /한울이 죽는다/.test(c.t) && /다온에게 맹주 자리를 넘긴다/.test(c.t) && /한울은 영영 떠난다\. 되돌릴 수 없다/.test(c.t) && /길게 눌러 넘긴다/.test(c.t), 'second step: ' + c.t);
  await sleep(1000);
  const hb = await (await page.$('#nkHold')).boundingBox(), hx = hb.x + hb.width / 2, hy = hb.y + hb.height / 2;
  await page.mouse.click(hx, hy); await sleep(400);      // 짧게 한 번 누른다
  c = await ev(() => ({ alive: !DS.G.save.chars[DS.G.save.hero].vac && DS.G.save.chars[DS.G.save.hero].pid === window.__o.pid, hint: document.querySelector('.nkhn').textContent, cine: !!document.querySelector('.cine') }));
  A(c.alive && !c.cine && c.hint === '길게 누르고 있어야 넘어간다', 'a plain tap does not hand over (「' + c.hint + '」)');
  await page.mouse.move(hx, hy); await page.mouse.down(); await sleep(450);
  c = await ev(() => +getComputedStyle(document.querySelector('#nkHold')).getPropertyValue('--p'));
  await shot('r1_confirm_hold');
  await page.mouse.up(); await sleep(300);
  const c2 = await ev(() => ({ alive: DS.G.save.chars[DS.G.save.hero].pid === window.__o.pid, p: +getComputedStyle(document.querySelector('#nkHold')).getPropertyValue('--p'), cine: !!document.querySelector('.cine') }));
  A(c > 0.15 && c < 0.9 && c2.alive && c2.p === 0 && !c2.cine, 'letting go early stops it (filled ' + Math.round(c * 100) + '%, back to 0)');
  const tH = Date.now(); await page.mouse.move(hx, hy); await page.mouse.down(); await waitFor(() => !!document.querySelector('.cine.ck-handover') || !document.querySelector('#nkHold'), null, 6000); const held = Date.now() - tH; await page.mouse.up();      // 다 찰 때까지 누르고 있는다 (1.4초)
  A(held >= 1300, 'it takes a deliberate long press (' + held + ' ms held before anything happens)');
  // 연출: 누를 때까지 기다리는 종류 · 처음 1.6초는 눌러도 닫히지 않는다 · 끝까지 본다
  c = await waitFor(() => { var el = document.querySelector('.cine.ck-handover'); return el ? { info: DS.cineInfo(), ov: document.querySelectorAll('#app .ov:not(.ghost)').length } : null; });
  A(c && c.info.k === 'handover' && c.info.hold && c.ov === 0, 'the hand-over cinematic starts (waits for a tap, all windows closed)');
  const t0 = Date.now(), at = async (ms) => { const d = ms - (Date.now() - t0); if (d > 0) await sleep(d); };
  await at(900); await page.mouse.click(195, 700); await sleep(100);
  A(await ev(() => !!document.querySelector('.cine.ck-handover')), 'a stray tap in the first second does not skip it');
  await at(1300); const fr1 = await shot('r1_cine_1_face');
  await at(2300); const fr2 = await shot('r1_cine_2_stream');
  c = await ev(() => { var el = document.querySelector('.cine'), o = getComputedStyle(el.querySelector('.chvo')), m = [].slice.call(el.querySelectorAll('.chvm')).filter(function (x) { return +getComputedStyle(x).opacity > 0.3; }).length; return { motes: m, n: el.querySelectorAll('.chvm').length, oldOp: +o.opacity, was: +getComputedStyle(el.querySelector('.chvp.was')).opacity, tag: el.querySelector('.chvt').getBoundingClientRect().left, nameO: el.querySelector('.chvl.o').textContent, nameN: el.querySelector('.chvl.n').textContent, fc: getComputedStyle(el).getPropertyValue('--fc').trim() }; });
  A(c.motes >= 3 && c.n === 26 && c.was > 0.9 && c.tag < 150 && c.nameO === '한울' && c.fc === await ev(() => DS.FLAG.inf), 'mid-way: ' + c.motes + ' motes of 기운 in the house colour (' + c.fc + ') are crossing, the 「맹주」 mark is still over ' + c.nameO);
  await at(4250); const fr3 = await shot('r1_cine_3_fall');
  await at(5800); const fr4 = await shot('r1_cine_4_newlord');
  await at(8800); const fr5 = await shot('r1_cine_5_lines');
  c = await ev(() => {
    var el = document.querySelector('.cine'), o = getComputedStyle(el.querySelector('.chvo')), n = getComputedStyle(el.querySelector('.chvn'));
    return { still: !!el, title: el.querySelector('.crib').textContent, sub: el.querySelector('.csub').textContent, say: (el.querySelector('.csay') || {}).textContent || '', by: (el.querySelector('.cchat b') || {}).textContent || '', chat: (el.querySelector('.cchat span') || {}).textContent || '', hl: (el.querySelector('.chl') || {}).textContent || '', gb: (el.querySelector('.cgb') || {}).textContent || '',
      tap: +getComputedStyle(el.querySelector('.ctap')).opacity, oldF: o.filter, oldOp: +o.opacity, oldT: o.transform, newShadow: n.boxShadow !== 'none', now: +getComputedStyle(el.querySelector('.chvp.now')).opacity, was: +getComputedStyle(el.querySelector('.chvp.was')).opacity, tag: el.querySelector('.chvt').getBoundingClientRect().left, eye: el.querySelector('.cey').textContent, motes: [].slice.call(el.querySelectorAll('.chvm')).filter(function (x) { return +getComputedStyle(x).opacity > 0.05; }).length };
  });
  A(c.still && c.eye === '인수인계' && /^새 맹주, /.test(c.title) && c.sub === '한울이 기운을 모두 넘기고 눈을 감았다' && c.tap > 0.4, 'played to the end and still waiting: 「' + c.title + '」 — ' + c.sub);
  A(/grayscale\(1\)/.test(c.oldF) && c.oldOp < 0.7 && c.oldT !== 'none' && c.newShadow && c.now > 0.9 && c.was < 0.1 && c.tag > 220 && c.motes === 0, 'end state: the old 맹주 is grey, dimmed and fallen; the successor\'s frame is lit and wears the 맹주 look; the 「맹주」 mark has crossed over');
  A(/「.+」/.test(c.say) && /^단톡방 · /.test(c.by) && c.chat === '…살아서 넘긴 건 네가 처음이다.' && /^유품: 한울의 날 선 롱소드$/.test(c.hl) && c.gb === '장비 2점이 가방으로 돌아왔다',
    'last line 「' + c.say + '」 · ' + c.by + ' 「' + c.chat + '」 · ' + c.hl + ' · ' + c.gb);
  await page.mouse.click(195, 760); await sleep(600);
  // 끝 창 · 저장
  c = await ev(() => { var o = document.querySelector('.ov .gbd'); return { cine: !!document.querySelector('.cine'), q: DS.cineQ(), t: o ? o.innerText.replace(/\n+/g, ' / ') : '', rites: DS.linVacant(DS.G.save).length, lq: (DS.G.lineageQ || []).length }; });
  A(!c.cine && !c.q.length && !c.rites && !c.lq && /새 맹주/.test(c.t) && /한울의 이름은 깃대에 남았다/.test(c.t) && /한울을 관에 모셨다/.test(c.t) && /유품: 한울의 날 선 롱소드/.test(c.t) && /장비 2점이 가방으로 돌아왔다/.test(c.t) && /장비 자동 착용/.test(c.t),
    'one tap closes it; no second death/succession cinematic, no rite pending; closing sheet: ' + c.t);
  await shot('r1_end_sheet');
  c = await ev((mid) => {
    var s = DS.G.save, o = window.__o, h = s.chars[s.hero], P = s.lin.P, dp = P[o.pid], np = P[h.pid], lg = s.lin.log.slice(o.log), k, same = true;
    var hls = Object.keys(s.gh || {}).filter(function (k) { return s.gh[k].hl; }), mine = hls.filter(function (k) { return s.gh[k].hl.p === o.pid; });
    return { st: dp.st, why: dp.d && dp.d.why, nk: dp.d && dp.d.nk, gb: dp.d && dp.d.gb, at: dp.d && dp.d.at, heirN: np && np.n, heirWas: !s.mercs.some(function (m) { return m.id === mid; }), vac: !!h.vac, w: h.w, a: h.a, bw: s.gear[o.w] || 0, ba: s.gear[o.a] || 0,
      hl: hls.length - o.hl, mine: mine, lock: mine.length ? !!s.lock[mine[0]] : false, lapse: (s.lapse || 0) - o.lapse, cleared: Object.keys(s.cleared).length - o.cleared, gold: s.gold - o.gold, yr: DS.calNow(s).yr - o.yr, tickets: s.tickets - o.tickets,
      log: lg.map(function (e) { return e.t + (e.x && e.x.why ? '(' + e.x.why + ')' : ''); }), text: lg.filter(function (e) { return e.t === 'death'; }).map(function (e) { return DS.linEvText(s, e); }), deaths: s.lin.log.filter(function (e) { return e.t === 'death' && e.a === o.pid; }).length,
      prev: DS.storyPrev(s), coffin: s.coffins.list.some(function (r) { return r.pid === o.pid; }), name: DS.charName(h), L: h.L, can: DS.nkCan(s), mood: h.gr && h.gr.k, spouse: (function () { var sp = s.mercs.filter(function (m) { return m.id === window.__spid; })[0]; return sp ? { gr: sp.gr && sp.gr.k, sp: (P[sp.pid] || {}).sp } : null; })() };
  }, pickMid);
  A(c.st === 'coffin' && c.why === '맹주 자리를 넘김' && c.nk === 1 && c.gb === 2 && c.deaths === 1 && /한울이 살아서 맹주 자리를 넘기고 눈을 감았다/.test(c.text[0]), 'the old 맹주 is dead by the normal path, once, with the reason 「' + c.why + '」 — chronicle: ' + c.text[0] + ' [' + c.log.join(', ') + ']');
  A(c.heirN === '다온' && c.heirWas && !c.vac && c.prev === '한울' && c.mood === 'will', 'the picked successor (' + c.heirN + ' → ' + c.name + ', Lv ' + c.L + ') is 맹주 by the normal path; 「선대 ' + c.prev + '」 works; 유지 on the heir');
  A(c.hl === 1 && c.mine.length === 1 && c.mine[0] === snap0.w && c.lock && c.w == null && c.a == null && c.bw >= 1 && c.ba >= 1, 'exactly one heirloom (' + c.mine[0] + ', locked) and both pieces are in the bag; the heir starts bare');
  A(c.lapse === 0 && c.cleared === 0 && c.gold === 0 && c.yr === 0 && c.tickets === 0 && c.coffin, 'no 스무 해: lapse count, cleared scenarios, gold and the calendar are untouched; the body went to the chosen coffin');
  A(c.spouse && c.spouse.gr === 'grief' && !c.spouse.sp && !c.can.ok && /한 해가 지나야 넘길 수 있다/.test(c.can.why), 'the death rules ran (spouse widowed and grieving ' + JSON.stringify(c.spouse) + '); the new 맹주 cannot hand over again at once: ' + c.can.why);
  await page.click('.ov .gbd [data-gbd]'); await sleep(700);
  c = await ev(() => { var s = DS.G.save, h = s.chars[s.hero]; return { w: h.w, a: h.a, bonus: DS.hlBonus(s, h) }; });
  A(c.w === snap0.w && c.a && c.bonus && c.bonus.atk > 0, 'closing sheet → 「장비 자동 착용」: the new 맹주 wears the heirloom sword again (+' + Math.round(c.bonus.atk * 100) + '% for the same house)');
  c = await waitFor(() => { var o = [].slice.call(document.querySelectorAll('#app .ov:not(.ghost)')).pop(); return o && /이름 정하기/.test(o.innerText) ? 1 : 0; }, null, 5000);
  A(c === 1, 'then the usual free naming prompt for a new 맹주');
  await L.closeAll(page);
  await ev(() => DS.heroInfo()); await sleep(500);
  c = await ev(() => { var b = document.querySelector('[data-nk]'), w = document.querySelector('.nkwhy'); b.scrollIntoView({ block: 'center' }); return { dis: b.disabled, why: w.textContent }; });
  A(c.dis && /자리에 앉은 지 한 해가 지나야 넘길 수 있다 \(4계절 남음\)/.test(c.why), 'button now disabled with the reason: ' + c.why);
  await sleep(250); await shot('r1_disabled_wait');
  // 저장을 다시 읽어도 그대로 (까닭 · 돌아온 수 · 앉은 때)
  await ev(() => { DS.ui.closeAll(); DS.ui.persist(); }); await page.reload(); await page.waitForSelector('#btnCont', { timeout: 30000 }); await page.click('#btnCont'); await sleep(1500); await L.skipStory(page, 5);
  await ev(() => { DS.G.quiet = true; DS.gbUi = true; }); await L.closeAll(page);
  c = await ev(() => { var s = DS.G.save, P = s.lin.P, d = null, h = s.chars[s.hero]; for (var k in P) if (P[k].d && P[k].d.nk) d = P[k]; return { why: d && d.d.why, gb: d && d.d.gb, sat: P[h.pid].sat, r26: s.r26, cine: !!document.querySelector('.cine'), rite: !!document.querySelector('.ov.rite'), news: s.news.length }; });
  A(c.why === '맹주 자리를 넘김' && c.gb === 2 && c.sat != null && c.r26 === 1 && !c.cine && !c.rite, 'after a reload the record is intact and nothing replays');
  // 한 해가 지나면 다시 넘길 수 있다 · 두 번째 넘김의 단톡방 한 줄 · 「끔」이면 연출 없이 끝 창
  c = await ev(() => {
    var s = DS.G.save; DS.ageAdvance(s, 601); var can = DS.nkCan(s), L = DS.nkList(s);
    return { can: can.ok, n: L.ok.length, def: L.def && L.def.name };
  });
  A(c.can && c.n >= 1, 'a year later the new 맹주 may hand over (' + c.n + ' candidates, default ' + c.def + ')');
  // 규칙만: 8단 위의 남긴 뜻 · 연달아 넘기기 막힘 · 도중 실패는 되돌린다 (저장 사본)
  c = await ev(() => {
    var mk = function () { var t = DS.fixSave(JSON.parse(JSON.stringify(DS.G.save))); return t; };
    var t = mk(), h = t.chars[t.hero]; h.ps.L = 75; h.ps.fz = 1; h.L = 75; var tk0 = t.tickets, pv = DS.nkPreview(t, DS.nkList(t).def), r = DS.nkDo(t, DS.nkList(t).def, { at: '해밀' });
    var out = { x8: pv.x8, tkPv: pv.tk, tk: t.tickets - tk0, rtk: r && r.tk, heirL: t.chars[t.hero].L, fz: !!(t.chars[t.hero].ps || {}).fz, again: DS.nkCan(t).ok };
    // 연달아: 곧바로 또 넘기려 하면 막힌다 → 남긴 뜻 · 유품의 걸음을 불릴 수 없다
    out.chain = DS.nkDo(t, DS.nkList(t).ok[0], {});
    // 도중 실패: 후계 길이 어긋나면 통째로 되돌린다
    var u = mk(), before = JSON.stringify(u), f0 = DS.linSucceed; DS.linSucceed = function () { return null; };
    try { out.fail = DS.nkDo(u, DS.nkList(u).def, {}); } finally { DS.linSucceed = f0; }
    out.same = JSON.stringify(u) === before; out.alive = !u.chars[u.hero].vac && !u.chars[u.hero].down;
    // 싸움 · 시나리오가 아닌 저장 사본에서는 스무 해 창만 막는다
    var v = mk(); v.eg = v.eg || {}; v.eg.pass = { y: 0 }; out.pass = DS.nkCan(v).why;
    return out;
  });
  A(c.x8 && c.tkPv === 10 && c.tk === 10 && c.rtk === 10 && c.heirL <= 70 && !c.fz, 'an 8단 맹주 hands over: 남긴 뜻 모집권 +10 (once), the heir does not inherit 8단 (Lv ' + c.heirL + ')');
  A(!c.again && c.chain === null, 'no chaining: the fresh 맹주 cannot hand over again within a year (tickets and heirloom steps cannot be farmed back-to-back)');
  A(c.fail === null && c.same && c.alive && /스무 해 창/.test(c.pass), 'if succession fails midway the save is restored untouched (the 맹주 lives); not offered inside the 스무 해 window (' + c.pass + ')');
  // 「사건 연출 끔」: 연출 없이 바로 끝 창으로 (흐름이 끊기지 않는다)
  await ev(() => { var s = DS.G.save; s.opt.cine = 'off'; DS.NK.hold = 300; DS.NK.lock = 50; DS.heroInfo(); }); await sleep(400);
  await ev(() => document.querySelector('[data-nk]').click()); await sleep(300);
  await ev(() => document.querySelector('#nkNext').click()); await sleep(300);
  const hb2 = await (await page.$('#nkHold')).boundingBox();
  await page.mouse.move(hb2.x + hb2.width / 2, hb2.y + hb2.height / 2); await page.mouse.down(); await sleep(600); await page.mouse.up(); await sleep(700);
  c = await ev(() => { var o = document.querySelector('.ov .gbd'), s = DS.G.save, P = s.lin.P, n = 0; for (var k in P) if (P[k].d && P[k].d.nk) n++; return { cine: !!document.querySelector('.cine'), t: o ? o.innerText.replace(/\n+/g, ' / ') : '', n: n, dead: DS.storyDead(s).map(function (d) { return d.n; }), prev: DS.storyPrev(s) }; });
  A(!c.cine && c.n === 2 && /새 맹주/.test(c.t) && /이름은 깃대에 남았다/.test(c.t), 'with cinematics off the flow goes straight to the closing sheet (second hand-over recorded): ' + c.t.slice(0, 80));
  A(c.prev === '한울 2세' && c.dead[0] === '한울 2세', 'the story picks the one who handed over up as 「선대 ' + c.prev + '」 and among those gone before (DS.storyDead: ' + c.dead.join(', ') + ')');
  await ev(() => { DS.G.save.opt.cine = 'full'; }); await L.closeAll(page);
  c = await ev(() => DS.NK_TXT.chatN[0]);
  A(/또 살아서 넘겼다/.test(c), 'a later hand-over gets a different 단톡방 line (「' + c + '」)');
  // ───────── ④ 2.6.1: 떠난 가주의 장비는 뒤를 이을 사람 몫 · 뒤를 이은 가문은 출전에 남는다 ─────────
  //   결과 창의 「자동 장착」은 그 싸움에서 죽음으로 돌아온 장비를 다른 가문에 입히지 않는다 (handover.js DS.gbWithout) → 새 가주에게 「장비가 없다」로 먼저 묻는다.
  //   장비 없이 선 후계는 전투력이 낮다 — 그래도 그 가문은 출전에 남는다 (meta.js DS.sortieFix).
  await L.closeAll(page); await setup('보람');
  await ev(() => { DS.G.quiet = true; DS.enterZone('haemil'); }); await sleep(900); await L.closeAll(page);
  c = await ev(() => {
    var s = DS.G.save, h = s.chars[s.hero], so = s.sortie.map(function (e) { return e.h; }), Ac = s.chars[so[0]], Bc = s.chars[so[1]];
    var heir = DS.addMerc(s, DS.baseMercTypes(Ac.cls)[0], 3, 0); heir.sb = 1; heir.nc = DS.houseCls(Ac); heir.L = Math.max(1, Math.max.apply(null, DS.sortieCands(s).filter(function (ch) { return !DS.sortieOn(s, ch.id); }).map(function (ch) { return DS.pL(DS.bearer(s, ch, 1)); }).concat([1])) - (DS.SORTIE_GAP - 1)); heir.n = '뒤이음';      // 2.6.1: 쉬는 가주보다 조금 낮다 (DS.SORTIE_GAP 안쪽 — 그보다 처지면 자리를 내준다: t50_people ⑥-2) DS.mercTidy(s); DS.pSync(s);
    s.gear = {}; h.w = null;                                             // 맹주의 무기 칸을 비운다 — 가방에 무기가 생기면 맹주가 먼저 집어 갈 판
    ['w', 'a'].forEach(function (sl) { var id = String(Ac[sl] || '').replace(/\+\d+$/, '') + '+6'; if (DS.gear(id)) Ac[sl] = id; });      // A 의 장비는 +6 — 전리품과 헷갈리지 않고, 누구라도 탐낼 물건
    var up = null; ['+5', '+4', '+3'].some(function (x) { var id = String(Bc.a || '').replace(/\+\d+$/, '') + x, g = DS.gear(id); if (g && DS.canEquip(Bc, id) && DS.gearScore(g, Bc) > DS.gearScore(DS.gear(Bc.a), Bc)) { up = id; return true; } return false; });
    if (up) s.gear[up] = 1;
    DS.rebuildParty(); DS.ui.persist();
    window.__g = { A: Ac.id, B: Bc.id, aw: Ac.w, aa: Ac.a, am: DS.bearer(s, Ac).id, up: up, heir: heir.id, ba: Bc.a };
    return window.__g;
  });
  A(c.aw && c.aa && c.up, 'setup: sortie 가주 A wears ' + c.aw + ' / ' + c.aa + ', the bag holds one real upgrade for B (' + c.up + '), the 맹주 has no weapon');
  await ev(() => { DS.G.quiet = true; DS.startScenario(DS.scn(9)); }); await sleep(900);
  await ev(() => { var sim = DS.G.sim, g = window.__g; sim.kill(sim.byId['c' + g.A], null); });
  await waitFor(() => { var s = DS.G.save, g = window.__g; return !s.mercs.some(function (m) { return m.id === g.am; }); });
  c = await ev(() => { var s = DS.G.save, g = window.__g, h = s.chars[s.hero], pl = DS.gearPlan(s, [h])[0], held = DS.gbHeld(s);
    return { bw: s.gear[g.aw] || 0, ba: s.gear[g.aa] || 0, held: Object.keys(held).sort().join(), want: pl ? pl.w : '', free: DS.gbWithout(s, function () { var q = DS.gearPlan(s, [h])[0]; return q ? q.w || '' : ''; }), back: (s.gear[g.aw] || 0) }; });
  A(c.bw >= 1 && c.ba >= 1 && c.held === [(await ev(() => window.__g.aw)), (await ev(() => window.__g.aa))].sort().join(), 'A falls in the scenario: both pieces are in the bag and held for the heir (' + c.held + ')');
  A(c.want && !c.free && c.back >= 1, 'without the hold the 맹주 would take the dead 가주\'s weapon (' + c.want + '); with it the plan finds nothing, and the bag is unchanged afterwards');
  await ev(() => { DS.G.sim.win(); });
  c = await waitFor(() => { var b = document.querySelector('.ov [data-upg]'); return b ? b.textContent.replace(/\s+/g, ' ') : ''; }, null, 15000);
  const nUp = await ev(() => { var s = DS.G.save, n = function () { return s.party.filter(function (id) { var ch = s.chars[id]; return ch && ['w', 'a'].some(function (sl) { var cur = DS.gearScore(DS.gear(ch[sl]), ch); return Object.keys(s.gear).some(function (gid) { var g = DS.gear(gid); return g && g.slot === sl && s.gear[gid] > 0 && DS.canEquip(ch, gid) && DS.gearScore(g, ch) > cur; }); }); }).length; }; return { held: DS.gbWithout(s, n), all: n(), heldN: Object.keys(DS.gbHeld(s)).length }; });
  A(/자동 장착/.test(c) && c.indexOf('가문 ' + nUp.held + '개') >= 0, 'result screen: 「' + c + '」 — counted without the returned pieces (' + nUp.held + ' houses with the hold, ' + nUp.all + ' if the heir\'s gear were up for grabs; ' + nUp.heldN + ' pieces held)');
  await shot('r4_result_upg');
  await ev(() => document.querySelector('.ov [data-upg]').click()); await sleep(400);
  c = await ev(() => { var s = DS.G.save, g = window.__g, h = s.chars[s.hero], worn = DS.charList(s).filter(function (ch) { return ch.w === g.aw || ch.a === g.aa; }).length; return { hw: h.w, ba: s.chars[g.B].a, ba0: g.ba, bw: s.gear[g.aw] || 0, baa: s.gear[g.aa] || 0, worn: worn, done: (document.querySelector('.ov .upg.done') || {}).textContent || '' }; });
  A(c.hw !== (await ev(() => window.__g.aw)) && /장비 교체/.test(c.done) && c.bw === 1 && c.baa === 1 && c.worn === 0, '「장비 교체」 dressed the others and left the dead 가주\'s +6 weapon and armour in the bag for the heir (맹주 took ' + (c.hw || 'nothing') + '): ' + c.done.replace(/\s+/g, ' '));
  // 결과 창을 닫으면: 이별 → 추도 → 막사의 같은 병과가 잇는다 → 「장비가 없다」가 그 장비를 후계에게 먼저 내민다
  await ev(() => { var b = document.querySelector('.ov .result [data-close], .ov [data-close]'); if (b) b.click(); });
  for (let i = 0; i < 50; i++) { const st = await ev(() => ({ cine: DS.cineBusy(), gbd: !!document.querySelector('.ov .gbd'), ov: !!document.querySelector('#app .ov:not(.ghost)'), story: !!document.querySelector('.ov.story') })); if (st.gbd) break; if (st.cine) await ev(() => DS.cineSkip()); else if (st.story) await L.skipStory(page, 4); else if (st.ov) await ev(() => { var b = document.querySelector('#app .ov:not(.ghost) [data-close]'); if (b) b.click(); else DS.ui.closeAll(); }); await sleep(500); }
  c = await waitFor(() => { var o = document.querySelector('.ov .gbd'); return o ? { t: o.innerText.replace(/\n+/g, ' / '), btn: !!o.querySelector('[data-gbd]') } : null; }, null, 8000);
  A(c && /뒤이음/.test(c.t) && /무기 /.test(c.t) && c.btn, 'the heir is offered the gear first: ' + (c && c.t));
  await shot('r4_heir_offer');
  await ev(() => document.querySelector('.ov .gbd [data-gbd]').click()); await sleep(600);
  c = await ev(() => { var s = DS.G.save, g = window.__g, Ac = s.chars[g.A], b = DS.bearer(s, Ac), rest = DS.sortieCands(s).filter(function (ch) { return !DS.sortieOn(s, ch.id); }), pa = DS.sortiePow(s, Ac);
    return { w: Ac.w, a: Ac.a, head: b ? b.id : 0, held: Object.keys(DS.gbHeld(s)).length, on: DS.sortieOn(s, g.A), m: (s.sortie.filter(function (e) { return e.h === g.A; })[0] || {}).m, stronger: rest.filter(function (ch) { return DS.pL(DS.bearer(s, ch, 1)) > DS.pL(b); }).length, party: s.party.indexOf(g.A) >= 0, so: s.sortie.map(function (e) { return e.h; }) }; });
  A(c.head === (await ev(() => window.__g.heir)) && c.w === (await ev(() => window.__g.aw)) && c.a === (await ev(() => window.__g.aa)) && c.held === 0, 'one tap: the heir wears what the house wore (' + c.w + ', ' + c.a + '); nothing is held any more');
  A(c.on && c.m === c.head && c.party && c.stronger > 0, 'the house stays in the sortie under its new head (출전 ' + c.so.join(',') + ') although ' + c.stronger + ' resting 가주 are a few levels higher');
  await L.closeAll(page);
  // 규칙만: 가주가 바뀐 가문은 남고, 빈 가문의 자리만 가장 센 이가 채운다
  c = await ev(() => { var s = DS.G.save, g = window.__g, Bc = s.chars[g.B], bb = DS.bearer(s, Bc), hold = DS.sortieHold; DS.sortieHold = null; try { DS.loseMerc(s, bb.id); DS.sbOf(s, Bc.id).forEach(function (m) { DS.loseMerc(s, m.id); }); DS.mercTidy(s); var so = DS.sortieFix(s); var top = DS.sortieRank(s, DS.sortieCands(s).filter(function (ch) { return ch.id !== g.A; }))[0]; return { so: so, A: g.A, B: g.B, top: top ? top.id : 0, news: DS.sortieNewsText(s) }; } finally { DS.sortieHold = hold; } });
  A(c.so.indexOf(c.A) >= 0 && c.so.indexOf(c.B) < 0 && c.so.indexOf(c.top) >= 0 && /출전/.test(c.news), 'rule: a vacant house leaves the sortie and the strongest resting 가주 steps in, the heir\'s house stays (' + c.so.join(',') + ' · ' + c.news + ')');
  await ev(() => { DS.rebuildParty(); DS.ui.persist(); });

  const bad = await L.badText(page, 'body'); A(!bad.length, 'no NaN/undefined on screen');
  console.log('frames: ' + [fr1, fr2, fr3, fr4, fr5].join(' '));
  console.log('rules26 done');
};
