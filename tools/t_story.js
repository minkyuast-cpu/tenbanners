// 전민 — 이야기 시험 (2.4.0 「삶은 후계로 계승된다」 · 2.4.1 그 밖의 글 표)
//   H=844 OUT=qa_out/story node tools/shot.js tools/t_story.js
// ① 이야기 패치가 탈 없이 붙었는가 (DS.STORY_LOG.err 가 비었다)
// ② 서른 판의 도입 · 맺음을 화면에 뜨는 그대로(DS.storyFit → DS.storyResolve) 훑는다 — 저장 여섯 가지:
//    (a) 새 판 (b) 열 병과가 저마다 맹주 (c) 모든 가주와 맹주가 숨을 거두고 뒤를 이었다 (d) 가문이 닫히거나(새 판) · 가주 자리가 비거나 · 합일로 잠들었다 (+ 문 앞에서 이름을 잃은 저장)
//    화자 칸이 비지 않는다 · 'undefined' · 'NaN' · 덜 채운 '{…}' 가 없다 · 한 줄 60자 안쪽(44자를 넘으면 알림) · 판마다 도입 3줄 이상
// ③ 그 밖의 이야기 글(도입 · 엔딩 · 막간 · 합일 · 갱도 · 보스 한마디 · 마을 사람 · 다음 세대의 장)도 같은 잣대로
// ④ 진짜 화면에서: 도입부 · 1 · 13 · 30번 도입 · 엔딩 · 다음 세대의 장 도입 · 보스 등장 연출 · 마을 사람 — 오류 없이 끝까지 넘어간다
// ⑤ 2.4.1 그 밖의 글 표(성격 말버릇 · 가문명 버릇 말 · 전투 대사 · 마지막 한마디 · 별명 · 현상 수배 · 연무장 · 뽑기 한마디 · 장비 내력 · 들판 · 가문의 유산 · 필살기 한 줄 · 연대기 · 대 끊김 · 출신)도 같은 잣대로:
//    빈 글이 없다 · 덜 채운 '{…}' 가 없다 · 한 줄 60자 안쪽(머리 위에 뜨는 글은 더 짧게) · 도움말은 진짜 화면에서 빈 줄 · 덜 채운 글이 없고 「세계」 묶음이 보인다
// ⑧ 2.6.0 판마다 가운데가 있다: 새 판 · 열 가문이 다 열린 판에서 도입 8~14줄 · 맺음 8~17줄 · 맹주가 판마다 입을 연다 · 단톡방 한마디로 끝나는 맺음은 셋에 하나 아래 ·
//    「삼백 년」은 정해 둔 판에만 · 「나 때는」은 서른 판에 셋 아래 · 전장 메모 열세 줄은 글자 그대로 · 열 가문이 막마다(1~10 · 11~20 · 21~30) 선대의 입으로도 지금 가주의 입으로도 말한다 · 싸움 도중의 한마디 표
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

  // ── ⑤ 2.4.1: 그 밖의 글 표 ──
  const tx = await ev(() => {
    var bad = [], n = 0, grp = {};
    function chk(t, at, max) {
      n++; var g = at.split('.')[0]; grp[g] = (grp[g] || 0) + 1;
      if (typeof t !== 'string' || !t.trim()) { bad.push('빈 글 ' + at); return; }
      if (/undefined|NaN|\{[^}]*\}|\[object/.test(t)) bad.push('덜 채운 글 ' + at + ' | ' + t);
      var L = Array.from(t).length; if (L > (max || 60)) bad.push('긴 줄(' + L + '>' + (max || 60) + ') ' + at + ' | ' + t);
    }
    function fill(t, v) { return String(t).replace(/\{(\w+)(?::[^}]*)?\}(\{(이가|은는|을를|과와|으로)\})?/g, function (all, k, j, p) { return v && v[k] != null ? String(v[k]) + (p ? p[0] : '') : all; }); }
    function each(o, at, max, v) { Object.keys(o || {}).forEach(function (k) { var x = o[k]; if (typeof x === 'string') chk(v ? fill(x, v) : x, at + '.' + k, max); else if (x instanceof Array) x.forEach(function (t, i) { if (typeof t === 'string') chk(v ? fill(t, v) : t, at + '.' + k + i, max); }); }); }
    // 성격 말버릇: 화면이 부르는 여덟 상황이 성격마다 다 있다 (머리 위 글 16자 · 처음 온 첫마디는 알림 글 끝)
    var NEED = ['start', 'kill', 'low', 'mourn', 'rank', 'boss', 'join', 'last'];
    DS.PERSONAS.forEach(function (P) {
      chk(P.name, 'persona.' + P.key + '.name', 8); chk(P.desc, 'persona.' + P.key + '.desc', 44);
      NEED.forEach(function (k) { if (!(P.say[k] instanceof Array) || P.say[k].length < 3) bad.push('성격 줄 모자람 ' + P.key + '.' + k); });
      Object.keys(P.say).forEach(function (k) { if (NEED.indexOf(k) < 0) bad.push('쓰이지 않는 성격 줄 ' + P.key + '.' + k); });
      each(P.say, 'persona.' + P.key, 16);
    });
    Object.keys(DS.SAY_P).forEach(function (k) { if (NEED.indexOf(k) < 0) bad.push('SAY_P 에 쓰이지 않는 상황 ' + k); });
    Object.keys(DS.SN_SAY).forEach(function (sn) { each(DS.SN_SAY[sn], 'surname.' + sn, 34); Object.keys(DS.SN_SAY[sn]).forEach(function (k) { if (NEED.indexOf(k) < 0) bad.push('쓰이지 않는 버릇 말 ' + sn + '.' + k); }); });
    Object.keys(DS.BARKS).forEach(function (h) { each(DS.BARKS[h], 'bark.' + h, 16); });
    each(DS.LAST_WORDS, 'lastWords', 24, { k: '가람', sp: '나래', h: '스카이워커' });
    DS.MERC_TITLES.forEach(function (T) { chk(T.name, 'title.' + T.id + '.name', 8); chk(T.when, 'title.' + T.id + '.when', 60); });
    // 현상 수배: 지역마다 그 땅의 적 이름을 다 끼워 본다 (제목은 게시판 한 줄 · 길 안내 줄에 들어간다)
    var BT = DS.LORE.bounty, zn = 0;
    ['hunt', 'elite', 'sweep'].forEach(function (k) { if (!BT[k] || !BT[k].title || !BT[k].line) bad.push('현상 수배 글 없음 ' + k); });
    if (!(BT.titles instanceof Array) || BT.titles.length < 8) bad.push('정예 칭호가 모자란다');
    Object.keys(DS.ZONES).forEach(function (z) {
      var Z = DS.ZONES[z]; if (Z.town || !Z.mobs || !Z.L) return; zn++;
      Z.mobs.forEach(function (m) {
        var mob = (DS.ENEMIES[m] || {}).name || '';
        ['hunt', 'sweep'].forEach(function (k) { chk(fill(BT[k].title, { zone: Z.name, mob: mob, n: 40 }), 'bounty.' + k + '.title', 22); chk(fill(BT[k].line, { zone: Z.name, mob: mob, n: 40 }), 'bounty.' + k + '.line', 60); });
        BT.titles.forEach(function (t) { var nm = t + ' ' + mob; chk(fill(BT.elite.title, { zone: Z.name, name: nm }), 'bounty.elite.title', 24); chk(fill(BT.elite.line, { zone: Z.name, name: nm }), 'bounty.elite.line', 60); });
      });
    });
    BT.titles.forEach(function (t, i) { chk(t, 'bounty.titles.' + i, 9); });
    each(DS.BTY_TXT, 'bountyTxt', 60, { title: '달빛 대신 벌하는 고블린 주술사 검거', n: 6, need: 6, name: '가주 사냥꾼의 석궁' });
    // 진짜 게시판: 20번을 깬 저장에서 굴린 방 셋 + 소문꾼의 말
    (function () {
      var s = DS.newSave('수배', 'inf'); DS.houseOpenN(s, 9); DS.mercTidy(s); for (var i = 1; i <= 20; i++) s.cleared[i] = 1;
      Object.keys(DS.ZONES).forEach(function (z) { s.visited[z] = 1; });
      DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 60; b.exp = 0; } }); DS.mercTidy(s); if (DS.pSync) DS.pSync(s);
      var l = DS.bountyList(s) || []; if (l.length < 3) bad.push('게시판에 방이 ' + l.length + '개');
      l.forEach(function (b) { chk(b.title, 'board.title', 24); chk(b.line, 'board.line', 60); });
      var keep = DS.G.save; DS.G.save = s; try { var t = DS.LORE.bountyTalk(s); chk(t, 'board.talk', 72); } finally { DS.G.save = keep; }
      grp.kinds = l.map(function (b) { return b.kind; }).join(',');
    })();
    // 연무장 · 무술대회 해설 ({w} {f} {u} = 이름 · 별명이 붙으면 열두 자)
    var AT = DS.ARENA_TXT, who = { w: '일당사백 가나다라', f: '일당사백 가나다라', u: '개근상 마바사아' };
    ['open', 'low', 'win', 'lose'].forEach(function (k) { if (!(AT[k] instanceof Array) || AT[k].length < 3) bad.push('연무장 줄 모자람 ' + k); (AT[k] || []).forEach(function (t, i) { chk(t, 'arena.' + k + i, 20); }); });
    ['sub', 'champ', 'noChamp', 'noneChamp', 'busy'].forEach(function (k) { chk(AT[k], 'arena.' + k, 40); });
    Object.keys(AT.t.cast).forEach(function (k) { AT.t.cast[k].forEach(function (t, i) { chk(fill(t, who), 'arenaCast.' + k + i, 44); }); });
    ['open', 'even', 'lop', 'fin', 'upset', 'fav', 'champ'].forEach(function (k) { if (!(AT.t.cast[k] instanceof Array) || !AT.t.cast[k].length) bad.push('해설 없음 ' + k); });
    // 영웅관: 등급마다 한마디
    [1, 2, 3, 4, 5].forEach(function (g) { if (!(DS.PULL_SAY[g] instanceof Array) || !DS.PULL_SAY[g].length) bad.push('뽑기 한마디 없음 ' + g); (DS.PULL_SAY[g] || []).forEach(function (t, i) { chk(t, 'pull.' + g + '.' + i, 26); }); });
    // 장비 내력: 전설 예순 점 모두
    var un = 0; Object.keys(DS.UNIQ).forEach(function (c) { Object.keys(DS.UNIQ[c]).forEach(function (k) { un++; chk(DS.UNIQ[c][k].lore, 'gear.' + c + '.' + k, 60); }); });
    // 들판: 외침 · 필드 보스
    each(DS.FIELD_SAY, 'fieldSay', 20);
    Object.keys(DS.FIELD_BOSS).forEach(function (z) { var D = DS.FIELD_BOSS[z]; chk(D.title, 'fieldBoss.' + z + '.title', 18); chk(D.say, 'fieldBoss.' + z + '.say', 44); chk(D.last, 'fieldBoss.' + z + '.last', 44); });
    // 가문의 유산: 등급 · 가호의 한 줄 · 돌아온 왕
    DS.LG.ranks.forEach(function (r, i) { chk(r.line, 'legacy.rank' + i, 44); });
    Object.keys(DS.LG_BOON).forEach(function (k) { chk(DS.LG_BOON[k].line, 'legacy.boon.' + k, 44); chk(fill(DS.LG_BOON[k].d, { v: 3 }), 'legacy.boonD.' + k, 44); });
    DS.LG_TWIST.forEach(function (t) { chk(t.say, 'legacy.twist' + t.g + '.say', 44); chk(t.note, 'legacy.twist' + t.g + '.note', 44); });
    // 필살기의 한 줄 (타고난 것 · 윗길)
    Object.keys(DS.ULTS).forEach(function (k) { if (DS.ULTS[k].fl != null) chk(DS.ULTS[k].fl, 'ult.' + k, 34); });
    Object.keys(DS.ULTX || {}).forEach(function (k) { var X = DS.SKILLS[DS.ULTX[k]] || DS.SKILLS[k]; if (X && X.fl != null) chk(X.fl, 'ultx.' + k, 34); });
    // 연대기 · 대 끊김 · 나이 · 출신
    var V = { a: '가람 스카이워커', b: '나래 스카이워커', house: '스카이워커 가문', union: '타르가르옌 대가문', kid: '다솜', at: '붉은 모래 사막', y1: 123, 'new': '아트레이데스 가문', t: 3, n: 4, c: 12, g: 2 };
    each(DS.LIN_TXT, 'chronicle', 90, V); each(DS.AGE_TXT, 'ageTxt', 60, V); each(DS.LAPSE_TXT, 'lapse', 60, V);
    ['heirSb', 'succ', 'lead', 'fuseH', 'recall', 'bury', 'hand', 'house', 'castHeir', 'lapse'].forEach(function (k) { if (!DS.LIN_TXT[k]) bad.push('연대기 글 없음 ' + k); });
    ['wed', 'part', 'widow', 'gone', 'birth', 'death', 'heir', 'adopt', 'kin', 'fuse', 'fuseIn', 'fuseU', 'coffin', 'revive', 'deathNat', 'adult', 'elder'].forEach(function (k) {      // lore.js 가 맡은 연대기 줄 (lineage.js · age.js 의 옛 기본 글을 걷은 자리)
      var e = { t: k, a: 0, b: 0, s: 1, x: {} }, t = ''; try { t = DS.linEvText(DS.G.save, e); } catch (x) { t = ''; }
      if (!t || /undefined|\{/.test(t)) bad.push('연대기 줄이 비었다 ' + k + ' | ' + t);
    });
    Object.keys(DS.ORIGIN).forEach(function (k) { chk(DS.ORIGIN[k].name, 'origin.' + k + '.name', 12); chk(DS.LORE.origin[k], 'origin.' + k + '.desc', 60); });
    // 보스: 걷어 낸 옛 칭호 자리 — 모든 보스가 lore.js 의 칭호(또는 제 칭호)를 지닌다
    Object.keys(DS.BOSSES).forEach(function (k) { var b = DS.BOSSES[k], lb = DS.LORE.boss[k]; if (!((lb && lb.title) || b.title)) bad.push('칭호 없는 보스 ' + k); });
    // 다음 세대의 장: 걷어 낸 기본 글 자리 — lore.js 의 글이 채운다
    ['intro', 'close.open', 'close.call', 'close.none', 'act', 'fell'].forEach(function (k) { var l = DS.egT(k, { n: 2, a: '가람' }); if (!l || !l.length) bad.push('세대 글 없음 ' + k); });
    return { bad: bad, n: n, grp: grp, uniq: un, zones: zn };
  });
  if (tx.bad.length) console.log(tx.bad.slice(0, 60).join('\n'));
  console.log('     ' + JSON.stringify(tx.grp));
  A(tx.bad.length === 0 && tx.uniq === 60 && tx.zones >= 8 && tx.n > 3000, 'other text tables are clean (' + tx.n + ' lines: barks, bounties over ' + tx.zones + ' zones, arena, recruit, ' + tx.uniq + ' gear lore lines, field, legacy, ult lines, chronicle): no empty string, no unfilled token, within length' + (tx.bad.length ? ' — ' + tx.bad.length + ' problems' : ''));
  // 도움말을 진짜 화면에서: 빈 줄 · 덜 채운 글이 없다, 「세계」 묶음이 보인다
  const hp = await ev(() => {
    DS.ui.closeAll(); DS.openMenu('help');
    var o = document.querySelector('#app .ov'), hs = [].map.call(o.querySelectorAll('h4'), function (h) { return h.textContent; }), li = [].map.call(o.querySelectorAll('ul.help li'), function (l) { return l.textContent; });
    var bad = li.filter(function (t) { return !t.trim() || /undefined|NaN|\{[^}]*\}|\[object|<b>|<\/b>/.test(t); });
    return { hs: hs, n: li.length, bad: bad, world: li.filter(function (t) { return /사람은 두 번 죽는다|선대 단톡방은 떠난 옛 가주들의 훈수다|맨 끝 줄은 늘 비어 있다/.test(t); }).length, jump: o.querySelectorAll('.hjump button').length };
  });
  await sleep(300); await ev(() => { var h = document.querySelector('#app .ov #hj' + (document.querySelectorAll('#app .ov ul.help').length - 1)); if (h) h.scrollIntoView(); }); await sleep(250); await shot('help_world');
  A(hp.bad.length === 0 && hp.n >= 70 && hp.hs[hp.hs.length - 1] === '세계' && hp.world === 3 && hp.jump === hp.hs.length, 'help tab renders ' + hp.n + ' items in ' + hp.hs.length + ' sections (' + hp.hs.join(' · ') + '), the 「세계」 section is visible, no empty or unfilled item' + (hp.bad.length ? ' — ' + JSON.stringify(hp.bad.slice(0, 3)) : ''));
  await ev(() => DS.ui.closeAll());

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

  // ── ⑥ 2.4.2 먼저 간 사람들(같은 무게면 최근에 간 이가 앞): 30번 이름 부르기 · 엔딩 · 단톡방이 이번 대의 사람으로 채워진다 ──
  const dd = await ev(() => {
    var s = DS.G.save, by = {}; DS.SCENARIOS.forEach(function (x) { by[x.id] = x; });
    var keep = s.fallen; function R(a) { return DS.storyResolve(a).map(function (l) { return (l.w ? l.w + ': ' : '') + l.t; }); }
    s.fallen = []; var none = { o30: R(by[30].outro), end: R(DS.LORE.ending) };
    s.fallen = [{ n: '옹달', L: 40, pid: 9001, lw: '앞자리… 비우지 마라', at: '서리 궁' }, { n: '가람', L: 30, pid: 9002 }, { n: '잔챙이', L: 2 }];
    var got = { o30: R(by[30].outro), end: R(DS.LORE.ending), o5: R(by[5].outro), dead: DS.storyDead(s).map(function (d) { return d.n; }) };
    s.fallen = keep; return { none: none, got: got };
  });
  A(!dd.none.o30.some(t => /그리고/.test(t)) && !dd.none.end.some(t => /마지막 말/.test(t)) && !dd.none.o30.concat(dd.none.end).some(t => /\{dead/.test(t)), 'no fallen: the dead-name lines drop out cleanly');
  A(dd.got.dead.join(',') === '가람,옹달' && dd.got.o30.some(t => /그리고 가람\. 옹달\./.test(t)) && dd.got.end.some(t => /쓰러진 이 3명\. 가람\. 옹달\./.test(t)) && dd.got.end.some(t => /단톡방 · 옹달: 내 마지막 말 기억하냐\. 「앞자리… 비우지 마라」/.test(t)) && dd.got.o5.some(t => /^단톡방 · (옹달|가람): 내 이름 건너뛰었다/.test(t)),
    'fallen people are named: 30 roll ' + dd.got.o30.filter(t => /그리고/.test(t)) + ' · ending ' + dd.got.end.filter(t => /쓰러진|마지막 말/.test(t)).join(' / ') + ' · chat ' + dd.got.o5.slice(-1));
  // ── ⑦ 2.5.0 판의 선택지: 3 · 13 · 24번을 아직 안 골랐을 때 · 모두 a · 모두 b 에서 뒷글(21 · 29 · 30번, 엔딩, 막간 「문 앞의 불」, 고른 뒤의 줄, 다음 세대의 장 29번 도입)이 깨끗하게 풀린다 ──
  const ch = await ev(() => {
    var s = DS.G.save, by = {}, bad = [], out = {}, keep = s.chs; DS.SCENARIOS.forEach(function (x) { by[x.id] = x; });
    function R(a) { return DS.storyResolve(a).map(function (l) { return (l.w ? l.w + ': ' : '') + l.t; }); }
    function chk(t, at) { if (!t || /undefined|NaN|\{[^}]*\}|\[object/.test(t)) bad.push(at + ' | ' + t); var n = Array.from(t.replace(/^[^:]{1,16}: /, '')).length; if (n > 60) bad.push('긴 줄(' + n + ') ' + at + ' | ' + t); }
    var c16 = (DS.LORE.campAll || []).filter(function (c) { return c.id === 'c16'; })[0];
    [['none', null], ['a', 'a'], ['b', 'b']].forEach(function (st) {
      if (st[1]) { s.chs = { k: DS.cycKey(s) }; DS.CHOICE_IDS.forEach(function (n) { s.chs[n] = st[1]; }); } else delete s.chs;
      var o = { i21: R(by[21].intro), o29: R(by[29].outro), o30: R(by[30].outro), end: R(DS.LORE.ending), c16: R(DS.storyFit(c16.lines, s)), eg29: R(DS.egScn(29, 2, s).intro) };
      if (st[1]) DS.CHOICE_IDS.forEach(function (n) { o['after' + n] = R(DS.storyFit(DS.chAfter(n, st[1], { txt: DS.chRwText(n, st[1]) }), s)); });
      Object.keys(o).forEach(function (k) { if (!o[k].length && !(k === 'eg29' && !st[1])) bad.push(st[0] + ' ' + k + ' 비었다'); o[k].forEach(function (t) { chk(t, st[0] + ' ' + k); }); });
      out[st[0]] = o;
    });
    DS.CHOICE_IDS.forEach(function (n) { var T = DS.CHOICE_TXT[n]; [T.q, T.qg, T.a.l, T.b.l, T.a.eg, T.b.eg, DS.chRwText(n, 'a'), DS.chRwText(n, 'b')].forEach(function (t, i) { chk(t, 'choice' + n + '.' + i); }); });
    Object.keys(DS.MSN_TXT.c).forEach(function (k) { ['t', 's', 'ok', 'no'].forEach(function (f) { var t = DS.msnText(k, f, { n: 90, v: 75 }); chk(t, 'msn.' + k + '.' + f); if (f === 's' && Array.from(t).length > 16) bad.push('훈수 이름이 길다 ' + t); }); });
    if (keep) s.chs = keep; else delete s.chs;
    return { bad: bad, out: out };
  });
  if (ch.bad.length) console.log(ch.bad.slice(0, 30).join('\n'));
  const has = (arr, re) => arr.some(t => re.test(t));
  const N = ch.out.none, Ca = ch.out.a, Cb = ch.out.b;
  A(ch.bad.length === 0, 'choice branches resolve cleanly (none · all a · all b): 21 · 29 · 30 · ending · 「문 앞의 불」 · aftermath · next-gen 29, and the 12 mission lines');
  A(has(N.o30, /「나루\. 마루\. 돌쇠/) && has(Ca.o30, /「나루\. 마루\. 돌쇠/) && !has(Cb.o30, /마루\. 돌쇠/) && has(Cb.o30, /「나루\. 돌쇠\./) && has(Cb.o30, /흥얼거렸다\. 「마루\. 마루\.」/) && has(Cb.o30, /장부에 없습니다/),
    '13: the 30 roll reads 마루 when written down (and with no choice yet); left with the king the roll skips it and he hums it from the grave: ' + Cb.o30.filter(t => /마루|장부/.test(t)).join(' / '));
  A(has(N.c16, /지나가는 사람을 지키랬지/) && has(Ca.c16, /지나가는 사람을 지키랬지/) && has(Cb.c16, /짐은 다 내렸다/) && !has(N.c16, /막내|당번/) && has(Ca.c16, /^막내 대공: /) && has(Cb.c16, /^이번 달 당번 대공: /),
    '3 · 24: 「문 앞의 불」 — who shows up and what they say changes (a: ' + Ca.c16.filter(t => /바르간|막내/.test(t)).join(' / ') + ' · b: ' + Cb.c16.filter(t => /바르간|당번/.test(t)).join(' / ') + ')');
  A(has(N.i21, /지도로 찾았다/) && has(Cb.i21, /앞장서 찾았다/) && !has(N.o29, /고갯마루 손님|장작|흥얼/) && has(Ca.o29, /고갯마루 손님/) && has(Cb.o29, /장작도, 솥도/) && has(Cb.o29, /흥얼거림/) && has(Ca.end, /표지판/) && has(Cb.end, /빈손으로/) && has(Ca.end, /막내 올림/) && has(Cb.end, /열두 장/) && !has(N.end, /표지판|빈손|막내 올림|열두 장/),
    '21 intro · 29 outro · ending follow the choices and stay as written when nothing is chosen yet');
  A(N.eg29.length + 3 === Ca.eg29.length && has(Cb.eg29, /지게/) && has(Ca.eg29, /덜 삐뚤다/), 'next-generation 29 intro adds the three choice lines of this generation (' + Ca.eg29.slice(-3).join(' / ') + ')');
  // ── ⑧ 2.6.0 판마다 가운데가 있다 ──
  const MEMO = ['용암 위에 오래 서 있으면 탄다. 멈추지 말고 지나갈 것.', '다리는 좁다. 양옆 여울로 돌아가는 길도 있다.', '붉은 칸은 곧 내려찍힌다. 틱이 남아 있으면 알아서 피한다.', '그 칸으로 직접 걸어 들어가지만 말 것.', '볼코는 물에 서면 강해진다. 뭍으로 끌어내라.',
    '누리도 물에 서면 강해진다. 못 한가운데로 따라 들어가지 말 것.', '하늘에서 돌이 떨어진다. 붉은 칸이 보이면 흩어져라.', '보스는 없다. 세 차례 습격을 모두 막아라.', '일바의 유혹은 틱 게이지를 비운다. 한꺼번에 다가서지 말 것.', '카르단은 용암을 밟아도 타지 않는다. 따라 들어가지 말 것.',
    '역병은 부대 전체에 독을 건다. 정화와 치유를 아끼지 말 것.', '서리 숨결은 넓게 퍼진다. 붉은 칸이 보이면 멀리 흩어져라.', '쓰러뜨려도 끝이 아니다. 문 너머의 것이 따라 나온다.'];
  const v6 = await ev((MEMO) => {
    var keep = DS.G.save, KS = Object.keys(DS.CAST_NAME), bad = [], o = { rows: [] };
    function run(sv) { DS.G.save = sv; var r = {}; DS.SCENARIOS.forEach(function (sc) { r[sc.id] = { i: DS.storyResolve(sc.intro), o: DS.storyResolve(sc.outro) }; }); return r; }
    function act(n) { return n <= 10 ? 0 : n <= 20 ? 1 : 2; }
    try {
      var fresh = run(DS.newSave('줄수', 'inf')), all = DS.newSave('줄수', 'inf'); DS.houseOpenN(all, 9); DS.mercTidy(all); var open = run(all);
      var anc = {}, live = {}, memo = [], chatEnd = 0, na = 0, heroIn = 0; KS.forEach(function (k) { anc[k] = [0, 0, 0]; live[k] = [0, 0, 0]; });
      for (var n = 1; n <= 30; n++) {
        [['새 판', fresh], ['열 가문', open]].forEach(function (st) { var I = st[1][n].i.length, O = st[1][n].o.length; if (I < 8 || I > 14) bad.push(st[0] + ' ' + n + '번 도입 ' + I + '줄'); if (O < 8 || O > 17) bad.push(st[0] + ' ' + n + '번 맺음 ' + O + '줄'); });
        var F = fresh[n].i.concat(fresh[n].o), P = open[n].i.concat(open[n].o), txt = F.map(function (l) { return l.t; }).join('\n');
        if (fresh[n].o[fresh[n].o.length - 1].w === '선대 단톡방') chatEnd++;
        if (F.some(function (l) { return l.w === '줄수'; })) heroIn++;
        na += txt.split('나 때는').length - 1;
        if (/삼백 년/.test(txt) && [4, 12, 13, 20, 21, 27, 28, 30].indexOf(n) < 0) bad.push(n + '번에 「삼백 년」');
        F.forEach(function (l) { if (l.w === '전장 메모') memo.push(l.t); if (l.anc && l.c && anc[l.c]) anc[l.c][act(n)]++; });
        P.forEach(function (l) { if (!l.anc && l.c && live[l.c] && l.w !== '줄수') live[l.c][act(n)]++; });
        o.rows.push(n + ':' + fresh[n].i.length + '/' + fresh[n].o.length);
      }
      KS.forEach(function (k) { if (k === 'inf') return; if (anc[k].some(function (v) { return !v; })) bad.push('선대 ' + DS.CAST_NAME[k] + ' 가 말이 없는 막: ' + anc[k].join('/')); if (live[k].some(function (v) { return !v; })) bad.push(k + ' 가주가 말이 없는 막: ' + live[k].join('/')); });
      if (anc.inf.some(function (v) { return !v; })) bad.push('선대 바우 가 말이 없는 막: ' + anc.inf.join('/'));      // 맹주가 보병이라 로저스는 두 저장 모두 선대가 말한다
      if (memo.join('|') !== MEMO.join('|')) bad.push('전장 메모가 달라졌다: ' + memo.filter(function (t) { return MEMO.indexOf(t) < 0; }).join(' / ') + ' (' + memo.length + '줄)');
      var f30 = fresh[30], o30 = open[30];
      o.gate = { anc: f30.i.filter(function (l) { return l.w === '선대 서슬' && /교대 왔다, 먼동/.test(l.t); }).length, live: o30.i.filter(function (l) { return !l.anc && /교대 왔다/.test(l.t); }).length,
        hushA: f30.o.filter(function (l) { return /아늑하지 않아/.test(l.t); }).length, hushL: o30.o.filter(function (l) { return !l.anc && /아늑하지 않아/.test(l.t); }).length,
        call: f30.o.filter(function (l) { return l.w === '선대 달래' && /옥분이네/.test(l.t); }).length + o30.o.filter(function (l) { return !l.anc && /옥분이네/.test(l.t); }).length };
      o.chatEnd = chatEnd; o.na = na; o.heroIn = heroIn; o.memo = memo.length;
      var T = DS.BANTER_TXT, bn = 0; DS.SCENARIOS.forEach(function (sc) { if (sc.boss && !(T.boss[sc.boss] && T.boss[sc.boss].length)) bad.push('한마디 없는 보스 ' + sc.boss); });
      Object.keys(T.boss).forEach(function (k) { T.boss[k].forEach(function (p) { p.forEach(function (t) { if (!t) return; bn++; if (/undefined|NaN|\{[^}]*\}/.test(t) || Array.from(t).length > 16) bad.push('한마디 ' + k + ' | ' + t); }); }); });
      o.banter = bn;
    } finally { DS.G.save = keep; }
    o.bad = bad; return o;
  }, MEMO);
  if (v6.bad.length) console.log(v6.bad.slice(0, 30).join('\n'));
  console.log('     도입/맺음 줄 수(새 판) ' + v6.rows.join(' '));
  A(v6.bad.length === 0 && v6.heroIn === 30 && v6.memo === 13, 'every stage has a middle (intro 8–14, outro 8–17 lines in a fresh save and with all ten houses open), the 맹주 speaks in all ' + v6.heroIn + ' stages, the ' + v6.memo + ' battlefield memos are word for word, 「삼백 년」 only where the number is the point, every house speaks in every act in both voices' + (v6.bad.length ? ' — ' + v6.bad.length + ' problems' : ''));
  A(v6.chatEnd <= 10 && v6.na <= 3, 'outros ending on a 단톡방 line: ' + v6.chatEnd + ' of 30 (≤ 10) · 「나 때는」 in the thirty stages: ' + v6.na + ' (≤ 3)');
  A(v6.gate.anc === 1 && v6.gate.live === 1 && v6.gate.hushA === 0 && v6.gate.hushL === 1 && v6.gate.call === 2 && v6.banter >= 100, 'stage 30 reads in both voices (선대 서슬 「교대 왔다, 먼동」 / the living 프레이; the hush line only from a living 아담스; 옥분이네 from either 달래) · ' + v6.banter + ' mid-battle bubbles ≤ 16 chars');
  console.log('story done');
};
