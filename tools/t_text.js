// 전민 — 2.4.1 글 화면 시험: 새 말투로 고친 글이 진짜 화면에 뜨는가 (표의 글 자체는 t_story ⑤ 가 훑는다)
//   H=844 OUT=qa_out/text node tools/shot.js tools/t_text.js
// ① 현상 수배 게시판(방마다 한 줄) ② 영웅관 뽑기 결과(등급 한마디 · 온 사람의 첫마디) ③ 장비 내력 창 ④ 연무장의 한마디 · 무술대회 해설
// ⑤ 사건 연출: 출생 · 막사에서 가주를 잇다 · 성년 ⑥ 도움말 「세계」 ⑦ 성격 한마디(싸움터 머리 위) ⑧ 필드 보스 카드 · 가문의 유산
'use strict';
module.exports = async function (page, shot, L) {
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const A = (ok, msg) => { console.log((ok ? 'ok  ' : 'FAIL ') + msg); if (!ok) throw new Error(msg); };
  const sleep = L.sleep;
  await L.newGame(page, { cls: 'inf', name: '글월' });
  // 20번을 깬 판: 열 가문 · 레벨 60 · 가 본 곳 모두
  await L.edit(page, function () {
    DS.houseOpenN(s, 9); DS.mercTidy(s); for (var id = 1; id <= 20; id++) s.cleared[id] = 1; s.crest = true;
    Object.keys(DS.ZONES).forEach(function (z) { s.visited[z] = 1; });
    DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 60; b.exp = 0; } }); DS.mercTidy(s); DS.pSync(s);
    s.gold = 9000000; s.tickets = 3; s.opt.cine = 'full';
    DS.lootPut(s, 'sword.first', { at: '새벽 들판' }); DS.lootPut(s, 'light.post', { at: '새벽 들판' });
  });
  await L.closeAll(page);

  // ① 현상 수배 게시판
  await ev(() => { DS.updateQuest(); DS.ui.closeAll(); DS.openMenu('party'); }); await sleep(300);
  await ev(() => { var b = document.querySelector('#app .ov [data-pfold="bty"]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }); await sleep(300);
  let c = await ev(() => {
    var rows = [].map.call(document.querySelectorAll('#app .ov .bty .row.bt'), function (r) { return { k: (r.querySelector('.bk') || {}).textContent, t: r.querySelector('b').textContent, line: (r.querySelector('small.llore') || {}).textContent || '' }; });
    var el = document.querySelector('#app .ov .bty'); if (el) el.scrollIntoView({ block: 'center' });
    return { rows: rows, lore: { hunt: DS.LORE.bounty.hunt, elite: DS.LORE.bounty.elite, sweep: DS.LORE.bounty.sweep } };
  });
  await sleep(400); await shot('bounty_board');
  A(c.rows.length === 3 && c.rows.every(r => r.line && !/\{|undefined/.test(r.t + r.line) && Array.from(r.line).length <= 60), 'bounty board: three postings, each with its one-line blurb — ' + c.rows.map(r => r.k + ' ' + r.t + ' / ' + r.line).join(' ¦ '));
  A(c.rows.some(r => /민원 처리|검거|대방출/.test(r.t)) && c.rows.every(r => /마리|우두머리/.test(r.line)), 'bounty text is in the new voice and still says what to hunt');
  await ev(() => DS.ui.closeAll());

  // ② 영웅관: 한 번 부른다 → 카드가 뒤집힌 뒤 등급 한마디, 창을 닫으면 온 사람의 첫마디가 알림에
  await ev(() => { DS.rebuildParty(); DS.openShop('merc'); }); await sleep(500);
  await page.click('[data-pull]'); await sleep(2600);
  c = await ev(() => { var o = document.querySelector('.ov.pullov') || document.querySelector('.result.pull'), s = DS.G.save, m = s.mercs[s.mercs.length - 1]; return { h2: o.querySelector('h2').textContent, say: (o.querySelector('.pullsay') || {}).textContent || '', g: m.g, n: m.n, pool: DS.PULL_SAY[m.g] }; });
  await shot('recruit_result');
  A(c.say && c.pool.indexOf(c.say) >= 0 && /왔다|찾아왔다/.test(c.h2), 'recruit result: 「' + c.h2 + '」 + grade ' + c.g + ' line 「' + c.say + '」');
  await ev(() => { var b = document.querySelector('.result.pull [data-close]'); if (b) b.click(); }); await sleep(500);
  let t1 = ''; for (let i = 0; i < 20 && !/「/.test(t1); i++) { await ev(() => { if (DS.cineBusy && DS.cineBusy()) DS.cineSkip(); }); await sleep(250); t1 = await ev(() => { var t = document.querySelector('#toast'); return t && t.classList.contains('on') ? t.textContent : ''; }); }
  await shot('recruit_toast');
  A(/「[^」]+」/.test(t1) && t1.indexOf(c.n) >= 0, 'the newcomer says a first line in the toast: ' + t1);
  await L.closeAll(page);

  // ③ 장비 내력 창 (가방 → 줄을 누른다)
  await ev(() => { DS.ui.closeAll(); DS.openMenu('bag'); }); await sleep(400);
  await ev(() => { var r = document.querySelector('#app .ov [data-loot-open="sword.first"]'); if (r) { r.scrollIntoView({ block: 'center' }); r.click(); } }); await sleep(500);
  c = await ev(() => { var d = document.querySelector('.result.ldet'); return d ? { h: d.querySelector('h2').textContent, lore: (d.querySelector('.llore') || {}).textContent || '', want: DS.UNIQ.sword.first.lore } : null; });
  await shot('gear_lore');
  A(c && c.lore === c.want && /못생겼다/.test(c.lore), 'gear detail shows the lore line: ' + (c && c.h) + ' — ' + (c && c.lore));
  await ev(() => DS.ui.closeAll());

  // ④ 연무장: 1:1 대결의 첫마디 · 무술대회 해설
  c = await ev(() => { DS.ui.closeAll(); DS.rebuildParty(); var o = DS.arenaOpen(); return { open: !!o, sub: (document.querySelector('.ar-head small') || {}).textContent, want: DS.ARENA_TXT.sub }; });
  await sleep(500); await shot('arena_pick');
  A(c.open && c.sub === c.want, 'arena header: ' + c.sub);
  await ev(() => { DS.arenaTourney(); }); await sleep(300);
  await page.click('[data-ar="tgo"]'); await sleep(500);
  c = await ev(() => { var p = document.querySelector('.ar-tcast'); return { cast: p ? p.textContent.replace(/^해설/, '') : '', pool: DS.ARENA_TXT.t.cast.open }; });
  await shot('arena_cast_open');
  A(c.pool.indexOf(c.cast) >= 0, 'tournament commentary (opening): ' + c.cast);
  await page.click('[data-ar="tquick"]'); await sleep(500);
  c = await ev(() => { var st = DS.arenaState(), p = document.querySelector('.ar-tcast'); return { cast: p ? p.textContent.replace(/^해설/, '') : '', last: st && st.lastR ? st.lastR.cast : '' }; });
  await shot('arena_cast_result');
  A(c.last && !/\{|undefined/.test(c.last + c.cast) && /올라갑니다|다음 판|승리|이변|꺾었습니다|해냈습니다|뒤집혔습니다/.test(c.last), 'tournament commentary (after a bout): ' + c.last + ' / next: ' + c.cast);
  for (let i = 0; i < 20; i++) { const done = await ev(() => { var st = DS.arenaState(); return !!(st && st.T && st.T.done); }); if (done) break; await ev(() => { var b = document.querySelector('[data-ar="tall"]') || document.querySelector('[data-ar="tquick"]'); if (b) b.click(); }); await sleep(300); }
  await ev(() => { var b = document.querySelector('[data-ar="tceremony"]'); if (b) b.click(); }); await sleep(600);
  c = await ev(() => { var p = document.querySelector('.ar-tchamp .ar-tcast'); return { cast: p ? p.textContent.replace(/^해설/, '') : '' }; });
  await shot('arena_champ');
  A(/천하제일/.test(c.cast) && !/\{|undefined/.test(c.cast), 'tournament commentary (champion): ' + c.cast);
  await ev(() => { DS.arenaClose(); DS.ui.closeAll(); }); await sleep(300);
  // 1:1: 싸움이 붙을 때의 한마디
  c = await ev(() => { DS.arenaOpen(); var st = DS.arenaState(), ro = st.roster; st.sel = [ro[0].key, ro[1].key]; var b = document.querySelector('[data-ar="go"]'); if (b) { b.disabled = false; b.click(); } return ro.length; });
  await sleep(400); await ev(() => { var b = document.querySelector('[data-ar="skip"]'); if (b) b.click(); }); await sleep(1500);
  await shot('arena_duel_bark');
  await ev(() => { DS.arenaClose(); DS.ui.closeAll(); }); await sleep(300);

  // ⑤ 사건 연출: 출생 · 막사에서 가주를 잇다 · 성년
  await ev(() => { DS.ui.closeAll(); var s = DS.G.save, h = s.chars[s.hero], P = s.lin.P, hp = P[h.pid];
    var m = DS.addMerc(s, 'm_sister', 3, s.hero); m.kn = 1; m.L = 3; m.n = '새싹'; var p = DS.linMkP(s, { k: 'm', sn: s.lin.sur, n: '새싹', sx: 'f', gen: hp.gen + 1, pa: [hp.id], type: m.type, g: 3, m: m.id, gv: 1, hb: 1 }); m.pid = p.id;
    DS.showBirth(p.id, function () {}); });
  await sleep(1200);
  c = await ev(() => { var el = document.querySelector('.cine.ck-birth'); return el ? { t: el.querySelector('.crib').textContent, sub: (el.querySelector('.csub') || {}).textContent || '' } : null; });
  await shot('cine_birth');
  A(c && /태어났다/.test(c.t) && /의 아이\. 선대 단톡방이 잠깐 순해졌다/.test(c.sub), 'birth cinematic: ' + (c && c.t) + ' — ' + (c && c.sub));
  await ev(() => DS.cineSkip()); await sleep(400); await L.closeAll(page);
  await ev(() => { var s = DS.G.save, ch = DS.charList(s).filter(function (x) { return x.id !== s.hero; })[0], b = DS.bearer(s, ch); var m = DS.addMerc(s, b.type, 4, 0); m.sb = 1; m.nc = DS.houseCls ? DS.houseCls(ch) : ch.cls; m.L = 33; m.n = '이음'; DS.loseMerc(s, b.id); DS.mercTidy(s); DS.bnNote(DS.sbTick(s)); });
  for (let t = 0; t < 25 && !(await ev(() => !!document.querySelector('.cine.ck-succ'))); t++) await sleep(200);
  await sleep(1400);
  c = await ev(() => { var el = document.querySelector('.cine.ck-succ'); return el ? { t: el.querySelector('.crib').textContent, sub: (el.querySelector('.csub') || {}).textContent || '' } : null; });
  await shot('cine_succ');
  A(c && /이음/.test(c.t) && /막사에서 나와 가문을 이었다\. 인수인계는 단톡방에서 한다/.test(c.sub), 'succession cinematic: ' + (c && c.t) + ' — ' + (c && c.sub));
  await ev(() => DS.cineSkip()); await sleep(400);
  // 모집권 · 갱도 연출의 한 줄 (가벼운 연출 — 같은 글을 화면이 띄운다)
  await ev(() => { DS.ui.closeAll(); DS.cine({ k: 'adult', por: [DS.ui.charSpr(DS.charList(DS.G.save)[1], 4)], title: '새싹이 성년이 되었다', sub: '이제 한 사람 몫을 한다. 밥은 두 사람 몫을 먹는다' }, function () {}); });
  await sleep(900); await shot('cine_adult'); await ev(() => DS.cineSkip()); await sleep(300);

  // ⑥ 도움말 「세계」
  c = await ev(() => { DS.ui.closeAll(); DS.openMenu('help'); var o = document.querySelector('#app .ov'), hs = o.querySelectorAll('h4'), last = hs[hs.length - 1]; last.scrollIntoView(); return { h: last.textContent, li: [].map.call(last.nextElementSibling.querySelectorAll('li'), function (l) { return l.textContent; }) }; });
  await sleep(300); await shot('help_world');
  A(c.h === '세계' && c.li.length === 7 && /두 번 죽는다/.test(c.li[0]), 'help: the 「세계」 section shows ' + c.li.length + ' items');
  c = await ev(() => { var o = document.querySelector('#app .ov'), h = o.querySelectorAll('h4')[3]; h.scrollIntoView(); return { h: h.textContent, li: [].map.call(h.nextElementSibling.querySelectorAll('li'), function (l) { return l.textContent; }) }; });
  await sleep(300); await shot('help_battle');
  A(c.h === '전투' && c.li.some(t => /약 12, 공격에 40/.test(t)) && c.li.some(t => /저절로 차지 않는다.*기합으로는 안 찬다/.test(t)) && c.li.some(t => /보병 ▶ 창병 ▶ 기병 ▶ 보병.*1\.5배/.test(t)), 'help: 「전투」 keeps its rules and numbers (tick 12 / 40, 1.5×) with one light line');
  await ev(() => DS.ui.closeAll());

  // ⑦ 성격 한마디: 가문원이 싸움터에서 (진짜 길 — game.js mercTalk)
  await ev(() => { DS.G.quiet = true; DS.ui.closeAll(); DS.startScenario(DS.scn(1)); DS.G.sim.hunt = false; });
  await sleep(1200); await L.skipStory(page, 6); await ev(() => DS.ui.closeAll()); await sleep(2600);      // 「시나리오 1」 띠가 걷힌 뒤
  c = await ev(() => {
    var sim = DS.G.sim, s = DS.G.save, u = sim.units.filter(function (x) { return x.role === 'merc' && !x.dead && x.mid; })[0]; if (!u) return null;
    var m = s.mercs.filter(function (x) { return x.id === u.mid; })[0], P = DS.mercPersona(m), seen = [], f0 = DS.G.view.float;
    DS.G.view.focus = u.id; DS.G.view.snap = true;
    DS.G.view.float = function (x, y, t) { seen.push(String(t)); return f0.apply(this, arguments); };
    var p0 = DS.SAY_P.start, q0 = DS.SN_SAY_P; DS.SAY_P.start = 1; DS.SN_SAY_P = 0; var ok = DS.mercTalk(u, 'start'); DS.SAY_P.start = p0; DS.SN_SAY_P = q0; DS.G.view.float = f0;      // 입을 여는 확률만 잠깐 1 로 (가문명 버릇 말은 빼고 성격의 줄로)
    return { ok: ok, said: seen[0] || '', persona: P.name, pool: P.say.start, n: m.n };
  });
  await sleep(450); await shot('persona_bark');
  A(c && c.ok && c.pool.indexOf(c.said) >= 0, 'personality bark over a 가문원 in battle: ' + (c && c.n) + ' (' + (c && c.persona) + ') 「' + (c && c.said) + '」');
  await ev(() => { try { DS.retreat ? DS.retreat() : 0; } catch (e) {} DS.ui.closeAll(); });

  const bad = await L.badText(page, 'body'); A(!bad.length, 'no NaN/undefined on screen');
  console.log('text done');
};
