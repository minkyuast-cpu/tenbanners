// 전민 — 이야기 시험 (2.4.0 「삶은 후계로 계승된다」)
//   H=844 OUT=qa_out/story node tools/shot.js tools/t_story.js
// ① 이야기 패치가 탈 없이 붙었는가 (DS.STORY_LOG.err 가 비었다)
// ② 서른 판의 도입 · 맺음을 화면에 뜨는 그대로(DS.storyFit → DS.storyResolve) 훑는다 — 저장 여섯 가지:
//    (a) 새 판 (b) 열 병과가 저마다 맹주 (c) 모든 가주와 맹주가 숨을 거두고 뒤를 이었다 (d) 가문이 닫히거나(새 판) · 가주 자리가 비거나 · 합일로 잠들었다 (+ 문 앞에서 이름을 잃은 저장)
//    화자 칸이 비지 않는다 · 'undefined' · 'NaN' · 덜 채운 '{…}' 가 없다 · 한 줄 60자 안쪽(44자를 넘으면 알림) · 판마다 도입 3줄 이상
// ③ 그 밖의 이야기 글(도입 · 엔딩 · 막간 · 합일 · 갱도 · 보스 한마디 · 마을 사람 · 다음 세대의 장)도 같은 잣대로
// ④ 진짜 화면에서: 도입부 · 1 · 13 · 30번 도입 · 엔딩 · 다음 세대의 장 도입 · 보스 등장 연출 · 마을 사람 — 오류 없이 끝까지 넘어간다
'use strict';
module.exports = async function (page, shot, L) {
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const A = (ok, msg) => { console.log((ok ? 'ok  ' : 'FAIL ') + msg); if (!ok) throw new Error(msg); };
  const sleep = L.sleep;

  // ── ④-1 도입부를 진짜 화면에서 (새로 시작 → 이야기 창을 끝까지 누른다) ──
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload(); await page.waitForSelector('#btnNew', { timeout: 30000 });
  await shot('title');
  await page.click('#btnNew'); await page.waitForSelector('#cmdName');
  await page.fill('#cmdName', '새벽');
  await page.click('#goNew');
  await page.waitForSelector('.ov.story', { timeout: 10000 });
  await sleep(500);
  const readStory = async (name, shots) => {      // 이야기 창을 끝까지 넘기며 화자 · 글을 모은다. shots = 찍을 줄 번호들
    const seen = [];
    for (let i = 0; i < 60; i++) {
      const l = await ev(() => { var o = document.querySelector('.ov.story'); return o ? { w: o.querySelector('.who').textContent, t: o.querySelector('.line').textContent, anc: o.querySelector('.story-box').classList.contains('anc') } : null; });
      if (!l) break;
      seen.push(l);
      if (shots && shots.indexOf(i) >= 0) await shot(name + '_' + (i + 1));
      await page.click('.ov.story .story-box .line', { force: true }).catch(() => {});
      await sleep(330);
    }
    return seen;
  };
  let pro = await readStory('prologue', [0, 1, 6]);
  A(pro.length >= 6 && /두 번 죽는다/.test(pro[0].t) && pro.some(l => l.w === '선대 단톡방' && l.anc) && pro.some(l => l.w === '새벽') && /마을 위쪽 출구/.test(pro[pro.length - 1].t),
    'prologue plays in the real UI: ' + pro.length + ' lines, 선대 단톡방 heckles, the hero answers, last line is the controls memo');
  await ev(() => { DS.G.quiet = true; DS.ui.closeAll(); });
  await sleep(300);

  // ── ① 패치 ──
  let c = await ev(() => ({ err: DS.STORY_LOG.err, skip: DS.STORY_LOG.skip, ok: DS.STORY_LOG.ok.length, v: DS.VERSION }));
  A(c.err.length === 0 && c.skip.length === 0 && c.ok >= 60, 'story patches applied: ok ' + c.ok + ', skip ' + JSON.stringify(c.skip) + ', err ' + JSON.stringify(c.err) + ' (' + c.v + ')');

  // ── ② · ③ 저장마다 훑는다 ──
  const res = await ev(() => {
    var KS = Object.keys(DS.CAST_NAME), out = { states: [], bad: [], long: {}, n: 0, info: {} };
    function chk(l, at) {
      out.n++;
      var t = l.t, w = l.w, tag = at + ' | ' + (w ? w + ': ' : '') + t;
      if (typeof t !== 'string' || !t.trim()) out.bad.push('빈 글 ' + tag);
      if (l.c && !w) out.bad.push('빈 화자 ' + tag);
      if (/undefined|NaN|\{[^}]*\}|\[object/.test(String(w) + ' ' + String(t))) out.bad.push('덜 채운 글 ' + tag);
      var n = Array.from(String(t)).length;
      if (n > 60) out.bad.push('긴 줄(' + n + ') ' + tag);
      else if (n > 44) out.long[(w ? w + ': ' : '') + t] = n;
    }
    function walk(name, sv) {
      var keep = DS.G.save, st = { name: name, lines: 0, anc: 0, min: 99, cast: {} };
      DS.G.save = sv;
      try {
        KS.forEach(function (k) { var r = DS.castNow(sv, k); st.cast[k] = DS.castAnc(sv, k) ? 'A' : r ? (r.st === 1 ? 'S' : 'V') : 'O'; });
        st.hero = JSON.stringify(DS.castNow(sv, 'hero')); st.prev = DS.storyPrev(sv);
        DS.SCENARIOS.forEach(function (sc) {
          ['intro', 'outro', 'outroAlt'].forEach(function (k) {
            var raw = sc[k]; if (k === 'outroAlt' && !raw) return;
            var ls = DS.storyResolve(raw);
            if (k === 'intro') { st.min = Math.min(st.min, ls.length); if (ls.length < 3) out.bad.push(name + ' ' + sc.id + '번 도입이 ' + ls.length + '줄'); }
            if (k !== 'intro' && ls.length < 2) out.bad.push(name + ' ' + sc.id + '번 ' + k + ' 이 ' + ls.length + '줄');
            ls.forEach(function (l) { st.lines++; if (l.anc) st.anc++; chk(l, name + ' ' + sc.id + '.' + k); });
          });
        });
        // 도입 · 엔딩 · 막간(지금 저장에 열리는 것) · 합일
        [['prologue', DS.LORE.prologue], ['prologueR', DS.LORE.prologueR], ['ending', DS.LORE.ending]].forEach(function (x) { var ls = DS.storyResolve(DS.storyFit(x[1], sv)); if (ls.length < 3) out.bad.push(name + ' ' + x[0] + ' ' + ls.length + '줄'); ls.forEach(function (l) { st.lines++; chk(l, name + ' ' + x[0]); }); });
        (DS.LORE.camp || []).forEach(function (cp) { DS.storyResolve(cp.lines).forEach(function (l) { st.lines++; chk(l, name + ' camp.' + cp.id); }); });
        ['any', 'battle', 'tactics', 'magic'].forEach(function (k) { DS.storyResolve((DS.LORE.fuse[k] || []).map(function (l) { return typeof l === 'string' ? l.replace(/\{h\}/g, '로저스, 퀸, 센주').replace(/\{u\}/g, '타르가르옌').replace(/\{t\}/g, '로저스') : l; })).forEach(function (l) { chk(l, name + ' fuse.' + k); }); });
      } finally { DS.G.save = keep; }
      out.states.push(st);
    }
    function mk(cls) { return DS.newSave('시험', cls); }
    function grow(s) {      // 닫힌 가문을 모두 연다
      DS.houseOpenN(s, 9); DS.mercTidy(s); return s;
    }
    function sb(s, cls, g) { var m = DS.addMerc(s, DS.heroType(cls), g || 3, 0); m.sb = 1; m.nc = cls; m.L = 30; m.exp = 0; return m; }
    // (a) 새 판
    walk('a.새 판', DS.G.save);
    // (b) 열 병과가 저마다 맹주 — 가문은 모두 닫혀 있다(선대가 말한다) · 절반쯤 연 판도
    KS.forEach(function (k) { walk('b.' + k, mk(k)); });
    KS.forEach(function (k, i) { if (i % 3 === 0) { var s = mk(k); DS.houseOpenN(s, 5); DS.mercTidy(s); walk('b+.' + k, s); } });
    // (c) 모든 가주와 맹주가 숨을 거두고 뒤를 이었다 (막사의 같은 병과가 잇는다)
    (function () {
      var s = grow(mk('inf')), ids = DS.charList(s).map(function (ch) { return ch.id; });
      ids.forEach(function (id) { var ch = s.chars[id]; sb(s, ch.cls, 4); });
      DS.mercTidy(s);
      ids.forEach(function (id) { if (s.chars[id]) s.chars[id].down = true; });
      DS.linSettle(s, '시험'); var e1 = DS.linAutoAll(s) || []; if (DS.sbTick) DS.sbTick(s); DS.mercTidy(s);
      out.info.c = { heroGen: JSON.stringify(DS.castNow(s, 'hero')), prev: DS.storyPrev(s), vac: DS.linVacant ? DS.linVacant(s).length : -1, houses: DS.charList(s).length, evs: e1.length };
      walk('c.모두 대를 이었다', s);
      s.erLast = { g: 1, names: ['가람', '나래'], marked: 2 };      // 문 앞에서 이름을 잃은 날의 맺음
      walk('c.이름을 잃은 날', s);
    })();
    // (d) 가주 자리가 빈 가문 (이을 사람이 없다) · 합일로 잠든 가문
    (function () {
      var s = grow(mk('mag')), n = 0;
      DS.charList(s).forEach(function (ch) { if (ch.id !== s.hero && n++ % 2 === 0) ch.down = true; });
      DS.linSettle(s, '시험'); if (DS.sbTick) DS.sbTick(s); DS.mercTidy(s);
      out.info.dVac = KS.filter(function (k) { var r = DS.castNow(s, k); return r && r.st === 2; }).join(',');
      walk('d.빈 가문', s);
      var f = grow(mk('cle')); f.crest = true; for (var i = 1; i <= 20; i++) f.cleared[i] = 1;
      DS.charList(f).forEach(function (ch) { var b = ch.id === f.hero ? ch.ps : DS.bearer(f, ch); if (b) { b.L = 70; b.exp = 0; } }); DS.mercTidy(f); if (DS.pSync) DS.pSync(f);
      var fu = null; try { fu = DS.fuseAuto(f, 2); } catch (x) { out.info.fuseErr = String(x && x.message); }
      out.info.dFuse = { unions: DS.fuseUnions ? DS.fuseUnions(f).length : -1, shut: Object.keys(f.fzShut || {}).join(','), houses: DS.charList(f).length };
      walk('d.잠든 가문', f);
      var h = grow(mk('arc')); h.chars[h.hero].down = true; DS.linSettle(h, '시험');      // 맹주가 방금 쓰러져 아직 빈자리
      out.info.dHero = JSON.stringify(DS.castNow(h, 'hero'));
      walk('d.맹주 빈자리', h);
    })();
    // ③ 그 밖의 글: 보스 · 갱도 · 마을 · 다음 세대의 장
    var B = DS.LORE.boss, plain = [];
    Object.keys(B).forEach(function (k) { ['title', 'say', 'last'].forEach(function (f) { var d = Object.getOwnPropertyDescriptor(B[k], f); if (d && typeof B[k][f] === 'string') plain.push(['boss.' + k + '.' + f, B[k][f]]); }); if (DS.BOSSES[k] && !B[k].title && DS.BOSSES[k].title) plain.push(['boss.' + k + '.title', DS.BOSSES[k].title]); });
    Object.keys(DS.STORY_BOSSGEN || {}).forEach(function (k) { ['say', 'last'].forEach(function (f) { (DS.STORY_BOSSGEN[k][f] || []).forEach(function (t, i) { plain.push(['bossgen.' + k + '.' + f + i, t]); }); }); });
    for (var f2 = 1; f2 <= 10; f2++) (DS.LORE.pit[f2] || []).forEach(function (t) { plain.push(['pit.' + f2, t]); });
    Object.keys(DS.LORE.cast).forEach(function (k) { plain.push(['cast.' + k + '.join', DS.LORE.cast[k].join]); var d = Object.getOwnPropertyDescriptor(DS.LORE.cast[k], 't7'); plain.push(['cast.' + k + '.t7', d && d.get ? d.get.call(DS.LORE.cast[k]) || '(감춤)' : DS.LORE.cast[k].t7]); });
    Object.keys(DS.CAST_LAST || {}).forEach(function (k) { plain.push(['castLast.' + k, DS.CAST_LAST[k]]); });
    plain.forEach(function (x) { chk({ w: '', c: '', t: x[1] }, x[0]); });
    out.info.bosses = Object.keys(B).length;
    // 마을 사람: 단계마다 몇 번씩 눌러 본다 (한 줄 70자 안쪽 — 요령 줄이 있어 조금 넉넉히)
    var npcN = 0, sv0 = DS.newSave('마을', 'inf');
    [[], [1, 2, 3, 4], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 20, 30].forEach(function (cl, si) {
      var s = JSON.parse(JSON.stringify(sv0)); s = DS.fixSave ? DS.fixSave(s) : s;
      var top = typeof cl === 'number' ? cl : 0; if (top) for (var i = 1; i <= top; i++) s.cleared[i] = 1; else cl.forEach(function (i) { s.cleared[i] = 1; });
      ['haemil', 'dodam', 'gaon'].forEach(function (z) { [0, 1, 2, 'house'].forEach(function (i) { for (var r = 0; r < 5; r++) { var l = DS.LORE.npc(z, i, s); if (!l) { out.bad.push('마을 빈 줄 ' + z + ':' + i + ':' + si); continue; } var t = typeof l === 'string' ? l : l.t, w = typeof l === 'string' ? '' : l.w; npcN++; if (/undefined|NaN|\{[^}]*\}/.test(w + t)) out.bad.push('마을 덜 채운 글 ' + w + ': ' + t); if (Array.from(t).length > 72) out.bad.push('마을 긴 줄 ' + w + ': ' + t); } }); });
    });
    out.info.npc = npcN;
    // 다음 세대의 장: 장의 도입 · 2~6대째 30번의 돌아온 왕 · 장을 닫는 낭독 (한 줄 34자 안쪽)
    (function () {
      var s = DS.newSave('세대', 'inf'); DS.houseOpenN(s, 9); DS.mercTidy(s); for (var i = 1; i <= 30; i++) s.cleared[i] = 1;
      var keep = DS.G.save, gl = 0; DS.G.save = s;
      try {
        var all = [].concat(DS.egIntroLines());
        for (var g = 2; g <= 6; g++) { [1, 11, 21, 30].forEach(function (n) { var sc = DS.egScn(n, g, s); all = all.concat(sc.intro || []); }); all = all.concat(DS.egCloseLines(g, s)); }
        s.erLast = { g: 1, names: ['가람'], marked: 1 }; all = all.concat(DS.egScn(30, 2, s).intro, DS.egCloseLines(2, s));
        DS.storyResolve(all).forEach(function (l) { gl++; if (!l.t || /undefined|NaN|\{[^}]*\}/.test(l.w + ' ' + l.t)) out.bad.push('세대 글 ' + l.w + ': ' + l.t); if (Array.from(l.t).length > 60 && !/^이번 대의 왕은 /.test(l.t)) out.bad.push('세대 긴 줄 ' + l.t); });      // 「이번 대의 왕은 …」 은 규칙을 늘어놓는 줄 (legacy.js)
      } finally { DS.G.save = keep; }
      out.info.gen = gl;
    })();
    return out;
  });
  const sum = res.states.map(s => s.name + ' ' + s.lines + '줄(선대 ' + s.anc + ', 도입 최소 ' + s.min + ') ' + Object.keys(s.cast).map(k => s.cast[k]).join('')).join('\n     ');
  console.log('     ' + sum);
  console.log('     info ' + JSON.stringify(res.info));
  const longs = Object.keys(res.long).sort((a, b) => res.long[b] - res.long[a]);
  console.log('warn  45자를 넘는 줄 ' + longs.length + '개' + (longs.length ? ':\n     ' + longs.slice(0, 60).map(t => res.long[t] + ' ' + t).join('\n     ') : ''));
  if (res.bad.length) console.log(res.bad.slice(0, 40).join('\n'));
  A(res.bad.length === 0, 'all story lines resolve cleanly in ' + res.states.length + ' saves (' + res.n + ' lines checked): no empty speaker, no unfilled token, ≤ 60 chars, every intro ≥ 3 lines' + (res.bad.length ? ' — ' + res.bad.length + ' problems' : ''));
  const st = n => res.states.filter(s => s.name === n)[0];
  A(Object.keys(st('a.새 판').cast).every(k => st('a.새 판').cast[k] === 'A') && st('a.새 판').anc > 20, 'fresh save: every house voice comes from the 선대 (all ten closed or the 맹주\'s own house) — ' + st('a.새 판').anc + ' ancestor lines');
  A(/"st":1/.test(res.info.c.heroGen) && !!res.info.c.prev && Object.keys(st('c.모두 대를 이었다').cast).filter(k => st('c.모두 대를 이었다').cast[k] === 'S').length >= 8, 'succession save: the 맹주 is a successor (선대 ' + res.info.c.prev + ' heckles by name) and the houses speak through their heirs: ' + JSON.stringify(res.info.c));
  A(res.info.dVac.length > 0 && /"st":2/.test(res.info.dHero), 'vacant save: houses without a 가주 (' + res.info.dVac + ') and a fallen 맹주 fall back to the 선대 / narration');
  A(res.info.dFuse.shut.split(',').length >= 2 && res.info.dFuse.houses <= 8, 'fused save: asleep houses ' + res.info.dFuse.shut + ' (' + res.info.dFuse.houses + ' houses left) — their lines come from the 선대');

  // ── ④-2 진짜 화면: 1 · 13 · 30번 도입 ──
  for (const id of [1, 13, 30]) {
    const exp = await ev((id) => { var sc = DS.scn(id); DS.ui.closeAll(); var ls = DS.storyResolve(sc.intro); DS.ui.story(sc.intro, function () { window.__storyEnd = id; }, sc.name); return ls; }, id);
    await sleep(450);
    const got = await readStory('intro' + id, id === 1 ? [0, 1, 4] : id === 13 ? [1, 2, 5] : [2, 4, 5, 6]);
    A(got.length === exp.length && got.every((l, i) => l.t === exp[i].t && l.w === (exp[i].w || DS_who(id))) && (await ev(() => window.__storyEnd)) === id,
      'scenario ' + id + ' intro plays to the end in the real UI (' + got.length + ' lines): ' + got.map(l => (l.w ? l.w + ': ' : '') + l.t)[id === 30 ? 4 : 1]);
  }
  function DS_who(id) { return { 1: '무너진 방앗간', 13: '왕의 무덤 속', 30: '어스름의 문' }[id]; }
  // 맺음 (30번) · 엔딩
  let exp = await ev(() => { DS.ui.closeAll(); var ls = DS.storyResolve(DS.scn(30).outro); DS.ui.story(DS.scn(30).outro, null, DS.scn(30).name); return ls.length; });
  await sleep(450);
  let got = await readStory('outro30', [1, 2, 5, 9]);
  A(got.length === exp && got.some(l => /다음 사람이요/.test(l.t)), 'scenario 30 outro plays (' + got.length + ' lines)');
  exp = await ev(() => { DS.ui.closeAll(); var e = DS.LORE.ending, ls = DS.storyResolve(e); DS.ui.story(e, function () { window.__storyEnd = 'end'; }, '엔딩'); return ls.length; });
  await sleep(450);
  got = await readStory('ending', [0, 1, 3, 7, 8, 10]);
  A(got.length === exp && got.length >= 10 && /먼동이 텄다/.test(got[0].t) && got.some(l => /넘겨주고 가는/.test(l.t)) && /고맙습니다/.test(got[got.length - 1].t) && (await ev(() => window.__storyEnd)) === 'end',
    'ending plays to the end (' + got.length + ' lines)');
  // 다음 세대의 장: 장의 도입 창 · 2대째 1번 · 30번 도입
  c = await ev(() => {
    var s = DS.G.save; for (var i = 1; i <= 30; i++) s.cleared[i] = 1;
    DS.ui.closeAll();
    var a = DS.egIntroLines(), s1 = DS.egScn(1, 2, s), s30 = DS.egScn(30, 2, s), ls = [].concat(a, s1.intro, s30.intro);
    DS.ui.story(ls, function () { window.__storyEnd = 'gen'; }, '2대째의 장');
    return { n: DS.storyResolve(ls).length, a: a.length, i1: s1.intro.length, i30: s30.intro.length };
  });
  await sleep(450);
  got = await readStory('gen2', [0, 4, 6]);
  A(got.length === c.n && c.a >= 3 && c.i1 >= 1 && c.i30 >= 3 && got.some(l => l.w === '어스름의 왕') && (await ev(() => window.__storyEnd)) === 'gen', 'next-generation chapter lines play (' + JSON.stringify(c) + ')');

  // ── ④-3 마을 사람 · 소문 ──
  await ev(() => { DS.ui.closeAll(); var s = DS.G.save; for (var i = 1; i <= 30; i++) delete s.cleared[i]; var l = DS.LORE.npc('haemil', 0, s); DS.ui.story(l, null); });
  await sleep(500); await shot('npc_rumor');
  got = await readStory('npc', []);
  A(got.length === 1 && got[0].w === '촌장 덕보' && /방앗간/.test(got[0].t), 'town rumor: ' + got[0].w + ' — ' + got[0].t);
  await ev(() => { var l = DS.LORE.npc('haemil', 'house', DS.G.save); DS.ui.story(l, null); });
  await sleep(500); await shot('npc_house'); await L.skipStory(page, 3);

  // ── ④-4 보스 등장 연출 (13번 잠 못 드는 왕 — 큰 몸) ──
  await L.edit(page, function () { for (var id = 1; id <= 12; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 4); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 60; b.exp = 0; } }); DS.mercTidy(s); DS.pSync(s); s.opt.cine = 'full'; });
  await L.closeAll(page);
  await ev(() => { DS.G.quiet = true; DS.bigCineForce = true; DS.ui.closeAll(); DS.startScenario(DS.scn(13)); DS.G.sim.hunt = false; });
  await sleep(1200); await L.skipStory(page, 4); await ev(() => DS.ui.closeAll());
  await ev(() => { var sim = DS.G.sim, b = sim.units.filter(function (u) { return u.role === 'boss'; })[0]; DS.G.view.focus = b.id; sim.rouse(b); });
  let cine = null; for (let i = 0; i < 24 && !cine; i++) { await sleep(150); cine = await ev(() => { var el = document.querySelector('.cine.ck-boss'); return el ? { t: el.textContent } : null; }); }
  A(cine && /잠 못 드는 왕/.test(cine.t) && /퇴근 못 한 왕/.test(cine.t) && /회의 중이다/.test(cine.t), 'boss entrance cinematic shows the new title and line: ' + (cine && cine.t.replace(/\s+/g, ' ').slice(0, 90)));
  await sleep(700); await shot('boss_cine');
  for (let i = 0; i < 40 && await ev(() => !!document.querySelector('.cine')); i++) await sleep(200);
  c = await ev(() => ({ b: document.querySelector('#boss b') ? document.querySelector('#boss b').textContent : '', em: document.querySelector('#boss em') ? document.querySelector('#boss em').textContent : '' }));
  A(/잠 못 드는 왕/.test(c.b) && /퇴근/.test(c.em), 'boss bar: ' + c.b + ' — ' + c.em);
  await shot('boss_bar');
  await ev(() => { DS.G.quiet = true; try { DS.ui.closeAll(); } catch (e) {} });
  console.log('story done');
};
