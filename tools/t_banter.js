// 전민 — 2.6.0 「싸움 도중의 한마디」 시험 (390×844): 보스의 체력이 문턱을 지날 때 보스와 맹주가 머리 위 말풍선으로 한 줄씩 주고받는다 (src/banter.js · 글은 story2.js DS.BANTER_TXT)
//   H=844 OUT=qa_out/banter node tools/shot.js tools/t_banter.js
//   ① 글 표: 보스가 있는 판마다 줄이 있다(30번의 둘째 얼굴도) · 한 줄 16자 안쪽 · 빈 짝 · 덜 채운 글이 없다 · 17번은 습격마다 한마디
//   ② 셈(순수): 문턱을 처음 지날 때 한 번 · 다시는 안 한다 · 한 방에 두 문턱을 넘으면 낮은 쪽 하나 · 숨이 넘어가는 한 방 · 목표가 아닌 보스 · 우리 편은 말이 없다 · 갱도 · 다음 세대의 장 · 시나리오 밖은 꺼진다
//   ③ 진짜 화면: 1번에서 보스가 7할 아래로 → 보스 머리 위에 한 줄, 곧이어 맹주가 대꾸 · 창이 뜨지 않고 싸움이 멈추지 않는다 · 3할에서 둘째 주고받기
//   ④ 설정 「전투 대사」를 끄면 안 뜬다 ⑤ 17번: 둘째 습격에 맹주의 한마디 ⑥ 연무장의 싸움에는 없다
'use strict';
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), sleep = L.sleep;
  await L.newGame(page, { cls: 'inf', name: '말문' });
  await ev(() => { DS.G.save.opt.cine = 'off'; DS.G.save.opt.speed = 1; });

  // ── ① 글 표 ──
  let c = await ev(() => {
    var T = DS.BANTER_TXT, bad = [], n = 0, need = [];
    DS.SCENARIOS.forEach(function (s) { if (s.boss) { need.push(s.boss); var p2 = DS.BOSSES[s.boss] && DS.BOSSES[s.boss].phase2; if (p2) need.push(p2); } });
    need.forEach(function (k) { if (!T.boss[k] || !T.boss[k].length) bad.push('줄 없는 보스 ' + k); });
    Object.keys(T.boss).forEach(function (k) {
      if (!DS.BOSSES[k]) bad.push('없는 보스 ' + k);
      if (T.boss[k].length > T.at.length) bad.push('문턱보다 많은 줄 ' + k);
      T.boss[k].forEach(function (p, i) {
        if (!(p instanceof Array) || p.length !== 2 || (!p[0] && !p[1])) { bad.push('빈 짝 ' + k + i); return; }
        p.forEach(function (t) { if (!t) return; n++; if (typeof t !== 'string' || /undefined|NaN|\{[^}]*\}|\[object/.test(t)) bad.push('덜 채운 글 ' + k + ' | ' + t); if (Array.from(t).length > 16) bad.push('긴 줄 ' + k + ' | ' + t); });
      });
    });
    var w = T.wave[17] || {}; [2, 3].forEach(function (i) { n++; if (!w[i] || Array.from(w[i]).length > 16) bad.push('17번 습격 ' + i); });
    return { bad: bad, n: n, need: need.length, at: T.at, noBoss17: !DS.scn(17).boss };
  });
  if (c.bad.length) console.log(c.bad.join('\n'));
  A(c.bad.length === 0 && c.need >= 30 && c.n >= 100 && c.at.length === 2 && c.at[0] > c.at[1] && c.noBoss17, 'banter table: every boss of the ' + c.need + ' boss fights has lines (' + c.n + ' bubbles), each ≤ 16 chars, thresholds ' + c.at.join(' · ') + ', stage 17 speaks on waves');

  // ── ② 셈 (순수) ──
  c = await ev(() => {
    function mk(type, hp, x) { var b = { id: 'b', side: 'enemy', role: 'boss', obj: true, type: type, hp: hp, mhp: 100 }; Object.keys(x || {}).forEach(function (k) { b[k] = x[k]; }); return { mode: 'scn', heroId: 'c1', byId: { b: b, c1: { id: 'c1', side: 'ally', role: 'cmd', hp: 50, mhp: 100 } } }; }
    var T = DS.BANTER_TXT, sc = { id: 1, boss: 'grok' }, o = {};
    var s = mk('grok', 90), B = DS.banterArm(s, sc);
    DS.banterSee(B, s, { t: 'hit', id: 'b', v: 10 }); o.above = B.q.length;
    s.byId.b.hp = 69; DS.banterSee(B, s, { t: 'hit', id: 'b', v: 21 }); o.first = B.q.map(function (q) { return [q.who, q.id, q.text, q.dt]; });
    DS.banterSee(B, s, { t: 'hit', id: 'b', v: 1 }); o.again = B.q.length;
    DS.banterSee(B, s, { t: 'hit', id: 'c1', v: 5 }); o.ally = B.q.length;
    s.byId.b.hp = 25; DS.banterSee(B, s, { t: 'hit', id: 'b', v: 44 }); o.second = B.q.slice(2).map(function (q) { return q.text; });
    s.byId.b.hp = 5; DS.banterSee(B, s, { t: 'hit', id: 'b', v: 20 }); o.after = B.q.length;
    var s2 = mk('grok', 10), B2 = DS.banterArm(s2, sc); DS.banterSee(B2, s2, { t: 'hit', id: 'b', v: 90 }); o.big = B2.q.map(function (q) { return q.text; }); o.bigSaid = Object.keys(B2.said).length;
    var s3 = mk('grok', 0), B3 = DS.banterArm(s3, sc); DS.banterSee(B3, s3, { t: 'hit', id: 'b', v: 100 }); o.dying = B3.q.length;
    var s4 = mk('grok', 50, { obj: false }), B4 = DS.banterArm(s4, sc); DS.banterSee(B4, s4, { t: 'hit', id: 'b', v: 50 }); o.notObj = B4.q.length;
    var s5 = mk('glacia', 20), B5 = DS.banterArm(s5, { id: 28, boss: 'glacia' }); DS.banterSee(B5, s5, { t: 'hit', id: 'b', v: 80 }); s5.byId.b.hp = 10; DS.banterSee(B5, s5, { t: 'hit', id: 'b', v: 10 }); o.oneLine = B5.q.length;      // 줄이 하나뿐인 보스(용): 처음 문턱 아래로 내려올 때 그 한 번뿐
    var s6 = mk('grok', 100), B6 = DS.banterArm(s6, { id: 17 }); DS.banterSee(B6, s6, { t: 'wave', n: 2 }); DS.banterSee(B6, s6, { t: 'wave', n: 2 }); DS.banterSee(B6, s6, { t: 'wave', n: 3 }); o.wave = B6.q.map(function (q) { return [q.who, q.text]; });
    o.ok = { scn: DS.banterOk(s, sc), w17: DS.banterOk(s, { id: 17 }), pit: DS.banterOk(s, { id: 1, boss: 'grok', pit: 3 }), gen: DS.banterOk(s, { id: 1, boss: 'grok', gen: 2 }), zone: DS.banterOk({ mode: 'zone' }, sc), none: DS.banterOk(s, null), plain: DS.banterOk(s, { id: 99 }) };
    o.want = T.boss.grok;
    return o;
  });
  A(c.above === 0 && c.first.length === 2 && c.first[0][0] === 'boss' && c.first[0][1] === 'b' && c.first[0][2] === c.want[0][0] && c.first[0][3] === 0 && c.first[1][0] === 'hero' && c.first[1][1] === 'c1' && c.first[1][2] === c.want[0][1] && c.first[1][3] > 1,
    'threshold 1: nothing above 70%, then the boss speaks and the 맹주 answers a beat later — ' + c.first.map(q => q[0] + ' 「' + q[2] + '」').join(' → '));
  A(c.again === 2 && c.ally === 2 && c.second.join('|') === c.want[1].join('|') && c.after === 4, 'each threshold fires once; hits on allies say nothing; threshold 2: ' + c.second.join(' → '));
  A(c.big.join('|') === c.want[1].join('|') && c.bigSaid === 2 && c.dying === 0 && c.notObj === 0 && c.oneLine === 2, 'one huge hit past both thresholds says only the lower exchange; a killing blow and a non-objective boss say nothing; a one-line boss speaks once');
  A(c.wave.length === 2 && c.wave[0][0] === 'hero' && /둘째/.test(c.wave[0][1]) && /셋째/.test(c.wave[1][1]), 'stage 17: the 맹주 speaks once per wave — ' + c.wave.map(q => q[1]).join(' / '));
  A(c.ok.scn && c.ok.w17 && !c.ok.pit && !c.ok.gen && !c.ok.zone && !c.ok.none && !c.ok.plain, 'armed only in first-generation scenario fights: ' + JSON.stringify(c.ok));

  // ── ③ 진짜 화면: 1번 ──
  const leave = () => ev(() => { DS.G.pause = false; DS.ui.closeAll(); DS.enterZone(DS.G.save.town); });      // 싸움터를 떠나 마을로
  const barks = () => ev(() => (DS.G.view.barks || []).map(function (b) { return { id: b.id, t: b.text }; }));
  const hitTo = (r) => ev((r) => { var sim = DS.G.sim, b = sim.units.filter(function (u) { return u.role === 'boss' && u.obj && !u.dead; })[0]; b.hp = Math.round(b.mhp * r); sim.emit({ t: 'hit', id: b.id, v: 1 }); DS.G.view.focus = b.id; DS.G.view.snap = true; return { id: b.id, type: b.type, hero: sim.heroId }; }, r);
  const waitBark = async (id, ms) => { for (let i = 0; i < ms / 100; i++) { const b = (await barks()).filter(x => x.id === id)[0]; if (b) return b.t; await sleep(100); } return ''; };
  await ev(() => { DS.ui.closeAll(); DS.G.quiet = true; DS.startScenario(DS.scn(1)); DS.G.sim.hunt = false; });
  await sleep(900); await L.skipStory(page, 6); await ev(() => DS.ui.closeAll()); await sleep(2600);      // 「시나리오 1」 띠가 걷힌 뒤
  c = await ev(() => ({ armed: !!DS.banterCur(), q: DS.banterCur() ? DS.banterCur().q.length : -1 }));
  A(c.armed && c.q === 0, 'scenario 1: banter is armed and silent at the start');
  const T1 = await ev(() => DS.BANTER_TXT.boss.grok);
  let b = await hitTo(0.69);
  const t0 = await ev(() => DS.G.sim.t);
  let said = await waitBark(b.id, 3000);
  A(b.type === 'grok' && said === T1[0][0], 'boss at 69%: a bubble over the boss — 「' + said + '」');
  await shot('boss_line');
  await ev((h) => { DS.G.view.focus = h; DS.G.view.snap = true; }, b.hero);
  let rep = await waitBark(b.hero, 5000);
  A(rep === T1[0][1], 'and the 맹주 answers over their own head — 「' + rep + '」');
  await shot('hero_reply');
  c = await ev((t0) => ({ ov: !!document.querySelector('.ov'), pause: !!DS.G.pause, hold: DS.G.hold || 0, dt: DS.G.sim.t - t0, res: DS.G.sim.result || '', log: DS.banterCur().log.map(function (l) { return l.who; }).join(',') }), t0);
  A(!c.ov && !c.pause && !(c.hold > 0) && c.dt > 0.3 && c.log === 'boss,hero', 'no window opened, nothing paused, the fight kept running (' + c.dt.toFixed(1) + 's of battle went by) — log ' + c.log);
  await sleep(2800);
  b = await hitTo(0.28);
  said = await waitBark(b.id, 3000);
  await ev((h) => { DS.G.view.focus = h; DS.G.view.snap = true; }, b.hero);
  rep = await waitBark(b.hero, 5000);
  A(said === T1[1][0] && rep === T1[1][1], 'boss at 28%: second exchange — 「' + said + '」 → 「' + rep + '」');
  c = await ev(() => DS.banterCur().log.length);
  await hitTo(0.27); await sleep(700);
  A(c === 4 && (await ev(() => DS.banterCur().log.length + DS.banterCur().q.length)) === 4, 'no third exchange: each threshold speaks once per fight');
  await leave();
  await sleep(600); await L.closeAll(page);

  // ── ④ 설정 「전투 대사」 끔 ──
  await ev(() => { DS.G.save.opt.bark = false; DS.ui.closeAll(); DS.G.quiet = true; DS.startScenario(DS.scn(1)); DS.G.sim.hunt = false; });
  await sleep(900); await L.skipStory(page, 6); await ev(() => DS.ui.closeAll()); await sleep(1200);
  b = await hitTo(0.5); await sleep(1500);
  c = await ev((id) => ({ cur: !!(DS.banterCur() && DS.banterCur().q.length + DS.banterCur().log.length), barks: (DS.G.view.barks || []).filter(function (x) { return x.id === id; }).length }), b.id);
  A(!c.cur && c.barks === 0, 'with 「전투 대사」 off nothing is said');
  await ev(() => { DS.G.save.opt.bark = true; }); await leave();
  await sleep(600); await L.closeAll(page);

  // ── ⑤ 17번: 습격마다 맹주의 한마디 ──
  await L.edit(page, function () { for (var id = 1; id <= 16; id++) DS.applyClear(s, DS.scn(id)); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 60; b.exp = 0; } }); DS.mercTidy(s); DS.pSync(s); });
  await L.closeAll(page);
  await ev(() => { DS.ui.closeAll(); DS.G.quiet = true; DS.startScenario(DS.scn(17)); DS.G.sim.hunt = false; });
  await sleep(900); await L.skipStory(page, 6); await ev(() => DS.ui.closeAll()); await sleep(2600);
  c = await ev(() => { var sim = DS.G.sim; sim.emit({ t: 'wave', n: 2, text: '' }); DS.G.view.focus = sim.heroId; DS.G.view.snap = true; return { hero: sim.heroId, want: DS.BANTER_TXT.wave[17][2] }; });
  rep = await waitBark(c.hero, 6000);
  A(rep === c.want, 'stage 17, second wave: 「' + rep + '」');
  await shot('wave_line');
  await leave();
  await sleep(600); await L.closeAll(page);

  // ── ⑥ 연무장: 시나리오 싸움이 아니다 ──
  await L.edit(page, function () { DS.houseOpenN(s, 3); DS.mercTidy(s); for (var id = 17; id <= 20; id++) s.cleared[id] = 1; });
  await L.closeAll(page);
  c = await ev(() => { DS.ui.closeAll(); DS.rebuildParty(); var o = DS.arenaOpen(), st = DS.arenaState(), ro = st && st.roster; if (!o || !ro || ro.length < 2) return { open: false }; st.sel = [ro[0].key, ro[1].key]; var b = document.querySelector('[data-ar="go"]'); if (b) { b.disabled = false; b.click(); } return { open: true }; });
  await sleep(1800);
  c = Object.assign(c, await ev(() => ({ cur: !!DS.banterCur(), scn: !!DS.G.scn, duel: !!(DS.arenaState() && DS.arenaState().D) })));
  A(c.open && !c.cur && !c.scn, 'arena duel: banter is not armed (' + JSON.stringify(c) + ')');
  await ev(() => { DS.arenaClose(); DS.ui.closeAll(); });
  const bad = await L.badText(page, 'body'); A(!bad.length, 'no NaN/undefined on screen');
  console.log('banter done');
};
