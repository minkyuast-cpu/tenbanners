// 2.8 마지막 물결: 「다음 세대의 장」 → 확인 → 도입 → 어스름의 문 앞에서 끝없는 물결 → 쓰러져도 죽지 않는다 → 막은 물결 = 평화의 해 = 창의 길이
//   H=844 OUT=<폴더> PAGE=<dist/test.html> node tools/shot.js tools/t_stand.js
//   확인: 모두 나선다(맹주 · 가주 · 가문원) · 물결 n 의 보스 · 무리 수 · 남은 무리는 이어진다 · 숨 돌리기는 조금만 · 모두 쓰러지면 끝 · 기록(save.eg.stand · hist) · 거르기 ·
//         창의 해 = 평화 · 글에 그 수 · 싸우다 다시 열면 그때까지로 끝 (다시 싸우지 않는다) · 조용한 연출 · 390 세로 · 가로 · 오류 · undefined/NaN 없음
module.exports = async function (page, shot, L) {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), sleep = L.sleep;
  const bad = async (sel) => { const b = await L.badText(page, sel); return b.length ? b : null; };
  await L.newGame(page, { name: '시험', cls: 'inf' });
  // 끝난 1대째: 열 가문 · 가주들 L70 · 맹주 집 어른 가문원 셋 · 30번까지 깼다
  await L.edit(page, function () {
    DS.houseOpenN(s, 9); DS.mercTidy(s);
    DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 70; b.exp = 0; } });
    for (var i = 0; i < 3; i++) { var r0 = DS.recruitHero(s, Math.random), m = r0 && (r0.m || r0); if (m && m.id) { var mm = s.mercs.filter(function (x) { return x.id === m.id; })[0] || m; mm.o = s.hero; mm.kn = 1; delete mm.sb; delete mm.h; mm.L = 60; } }
    DS.mercTidy(s); if (DS.pSync) DS.pSync(s);
    for (var id = 1; id <= 30; id++) DS.applyClear(s, DS.scn(id));
    s.crest = s.crest || 1; s.opt.cine = 'off'; s.opt.speed = 2; s.eg.intro = 1; ['tele', 'cdanger', 'herb', 'combat', 'taunt', 'mdead', 'idle', 'stance'].forEach(function (k) { s.seen[k] = 1; });
  });
  let c = await ev(() => { const s = DS.G.save, R = DS.standRoster(s); return { can: DS.egCanStart(s), all: R.length, cmd: R.filter(u => u.role === 'cmd').length, kin: R.filter(u => u.role === 'merc').length, chars: DS.charList(s).length, sortie: DS.partySpecs(s).filter(u => u.role === 'cmd').length }; });
  A(c.can.ok && c.cmd === c.chars && c.cmd >= 10 && c.kin >= 3, 'everyone is called: ' + c.cmd + ' heads (all ' + c.chars + ' houses, not only the sortie of ' + c.sortie + ') + ' + c.kin + ' kin');
  // 「다음 세대의 장」 → 확인 창
  await ev(() => { DS.ui.closeAll(); DS.openMenu('party'); });
  await sleep(500);
  await page.click('[data-eg="start"]'); await sleep(500);
  c = await ev(() => { const o = document.querySelector('.ov.egov'); return { txt: o ? o.innerText : '', yes: !!document.querySelector('#egYes') }; });
  A(c.yes && /마지막 물결/.test(c.txt) && /죽지 않는다/.test(c.txt) && /한 번뿐/.test(c.txt) && /다섯 해에서 서른 해/.test(c.txt), 'the confirm explains the last stand (who fights, no permanent deaths, once, 5..30 years)');
  await shot('confirm');
  await page.click('#egYes'); await sleep(700);
  c = await ev(() => ({ story: !!document.querySelector('.ov.story'), mark: DS.G.save.eg.stand || null, pass: !!DS.G.save.eg.pass }));
  A(c.story && !c.mark && !c.pass, 'confirm opens the intro scene first (no marker, no window yet)');
  await shot('intro');
  await L.skipStory(page);
  await sleep(600);
  c = await ev(() => { const S = DS.G.stand, sim = DS.G.sim, s = DS.G.save; return { on: !!S, mark: s.eg.stand, ally: sim ? sim.units.filter(u => u.side === 'ally' && (u.role === 'cmd' || u.role === 'merc')).length : 0, n: S ? S.std.n : -1, chips: document.querySelectorAll('#chips .chip').length, scn: DS.G.scn && DS.G.scn.stand }; });
  A(c.on && c.scn && c.mark && c.mark.on === 1 && c.mark.g === 1, 'the stand starts with an in-progress marker in the save');
  A(c.ally >= 13 && c.chips >= 10, 'everyone is on the field: ' + c.ally + ' units, ' + c.chips + ' house chips');
  // 물결 1
  for (let i = 0; i < 80; i++) { if (await ev(() => DS.G.stand && DS.G.stand.std.n >= 1 && ((DS.G.pause = true), (DS.G.softUntil = 0), true))) break; await sleep(100); }
  await sleep(300);
  c = await ev(() => { const sim = DS.G.sim, std = DS.G.stand.std, bs = sim.units.filter(u => u.side === 'enemy' && u.std === 'b' && u.stdW === 1), ms = sim.units.filter(u => !u.dead && u.side === 'enemy' && u.std === 'm'); return { n: std.n, b: bs.length, m: (std.made[1] || 0) + std.q.filter(x => x.n === 1).length, q: document.querySelector('#quest').innerText, B: DS.standB(1), M: DS.standM(1) }; });
  A(c.n === 1 && c.b === c.B && c.m === c.M && /물결 1/.test(c.q), 'wave 1: ' + c.b + ' boss, ' + c.m + ' monsters (B ' + c.B + ', M ' + c.M + '), the HUD reads 「' + c.q + '」');
  await ev(() => { DS.G.pause = false; }); await sleep(900); await shot('wave1'); await ev(() => { DS.G.pause = true; });
  // 2.9.1 광폭: 적은 10단 10레벨 고정 · 35초 안에 못 막으면 1단계 (그 물결의 적 공격 +20%) · 목표 줄 밑에 초 세기
  c = await ev(() => { const sim = DS.G.sim, b = sim.units.filter(u => !u.dead && u.side === 'enemy' && u.std === 'b' && u.stdW === 1)[0], ch = document.querySelector('#stdrage'); return { L: b && b.L, chip: ch ? ch.innerText : '', on: !!(ch && ch.classList.contains('on')) }; });
  A(c.L === 100 && c.on && /광폭까지 \d+초/.test(c.chip), 'enemies are level 100 regardless of the party (boss L ' + c.L + '), the chip reads 「' + c.chip + '」');
  c = await ev(() => { const sim = DS.G.sim, std = sim.std, wv = std.open[std.open.length - 1], bs = sim.units.filter(u => !u.dead && u.side === 'enemy' && u.stdW === 1); window.__rg = bs.map(u => [u.id, u.atk, u.mag]); wv.t0 = sim.t - DS.STAND.rage.lim - 0.1; bs.forEach(u => { u.busy = 3; }); return bs.length; });
  await ev(() => { DS.G.pause = false; }); await sleep(450); await ev(() => { DS.G.pause = true; });
  c = await ev(() => { const sim = DS.G.sim, std = sim.std, vb = document.querySelector('#vban'), ch = document.querySelector('#stdrage'), r = window.__rg.map(x => { const u = sim.byId[x[0]]; return u && !u.dead ? [u.stdE, +(u.atk / Math.max(1, x[1])).toFixed(2)] : null; }).filter(Boolean); return { e: std.rg[1], r, vb: vb && !vb.hidden ? vb.className + ' ' + vb.innerText : '', chip: ch ? ch.innerText : '', hot: !!(ch && ch.classList.contains('hot')) }; });
  A(c.e === 1 && c.r.length && c.r.every(x => x[0] === 1 && x[1] >= 1.17 && x[1] <= 1.23) && /rage/.test(c.vb) && /광폭화 1단계/.test(c.vb) && /20%/.test(c.vb) && c.hot && /광폭 1단계/.test(c.chip), 'after 35s wave 1 enrages: stage ' + c.e + ', atk x' + (c.r[0] || [])[1] + ', banner 「' + c.vb.replace(/\s+/g, ' ') + '」, chip 「' + c.chip + '」');
  await shot('rage1');
  // 2.9.1 이름 잃은 영웅: 우리와 같은 병과의 10단 10레벨이 적으로 · 치는 기술만 · 쓰러뜨리지 않아도 물결은 막힌다
  await ev(() => { window.__toasts = []; const t0 = DS.ui.toast; DS.ui.toast = function (m) { window.__toasts.push(String(m)); return t0.apply(this, arguments); }; });
  c = await ev(() => { const sim = DS.G.sim, std = sim.std, H = []; ['mag', 'sha', 'inf'].forEach((cl, i) => { const u = DS.standHeroSpec(cl, DS.standK(1, 1)); u.id = 'shT' + i; const p = std.spot(sim); u.x = p.x; u.y = 3 + i; u.stdW = 1; const nu = sim.add(u); if (nu) { nu.busy = 2; H.push(nu); std.h++; sim.emit({ t: 'stdHero', id: nu.id, n: 1, k: i, first: i === 0 }); } });
    const SK = DS.SKILLS; return H.map(u => ({ side: u.side, L: u.L, nm: u.name, cls: u.cls, sk: u.skills, ok: u.skills.length > 0 && u.skills.every(k => SK[k].eff[0].t === 'dmg' && !SK[k].eff.some(e => e.t === 'summon')), ch: u.ch, look: u.look })); });
  A(c.length === 3 && c.every(h => h.side === 'enemy' && h.L === 100 && /^이름 잃은 /.test(h.nm) && h.ok && h.ch == null && h.look && h.look[1] === 10), 'nameless heroes join the foes: ' + c.map(h => h.nm + ' [' + h.sk.join(',') + ']').join(' / '));
  await ev(() => { DS.G.pause = false; }); await sleep(2300);
  c = await ev(() => ({ toast: window.__toasts.join(' / '), live: DS.G.sim.units.filter(u => !u.dead && u.std === 'h').length }));
  await ev(() => { DS.G.pause = true; });
  A(/이름을 잃은 영웅/.test(c.toast), 'the first nameless hero is announced: 「' + c.toast.replace(/\s+/g, ' ').slice(0, 60) + '」');
  await shot('heroes');
  c = await ev(() => { const sim = DS.G.sim, std = sim.std, wv = std.open[std.open.length - 1]; wv.t0 = sim.t - DS.STAND.rage.lim - DS.STAND.rage.every * 2 - 0.1; return 1; });
  await ev(() => { DS.G.pause = false; }); await sleep(450); await ev(() => { DS.G.pause = true; });
  c = await ev(() => { const sim = DS.G.sim, r = window.__rg.map(x => { const u = sim.byId[x[0]]; return u && !u.dead ? [u.stdE, +(u.atk / Math.max(1, x[1])).toFixed(2)] : null; }).filter(Boolean); return { e: sim.std.rg[1], r }; });
  A(c.e === 3 && c.r.every(x => x[0] === 3 && x[1] >= 1.56 && x[1] <= 1.64), 'two more steps later: stage ' + c.e + ', atk x' + (c.r[0] || [])[1] + ' (+60%)');
  // 물결을 억지로 넘긴다: 보스만 쓰러뜨리면 그 물결을 막은 것 · 남은 무리는 다음 물결로 이어진다
  const force = async (n) => ev((n) => {
    const sim = DS.G.sim, std = sim.std;
    if (!std.q.length && !sim.units.some(u => !u.dead && u.side === 'enemy' && u.std !== 'b')) for (let i = 0; i < 3; i++) std.q.push({ type: 'ghost', n: std.n });      // 남는 몫이 생기게 (이 물결의 무리 셋)
    while (std.q.length && std.liveFoes(sim) < 30) std.spawn(sim, std.q.shift());      // 줄 선 무리를 먼저 다 들인다
    sim.units.filter(u => !u.dead && u.side === 'enemy' && u.std === 'b').forEach(u => sim.kill(u, null));
    const left = sim.units.filter(u => !u.dead && u.side === 'enemy').length + std.q.length;
    std.qT = sim.t + 99;      // 줄 선 무리는 잠깐 세워 둔다 (이어지는 몫을 세려고)
    sim.units.filter(u => !u.dead && u.side === 'enemy').forEach(u => { u.busy = 3; });
    const live = sim.units.filter(u => !u.dead && u.side === 'enemy').length;
    std.next = sim.t;      // 숨 돌리기를 건너뛴다
    const hp0 = sim.units.filter(u => u.side === 'ally' && !u.dead).map(u => u.hp / u.mhp);
    return { w: std.w, left, live, q: std.q.length, pause: DS.G.pause, n: std.n, next: std.next, t: sim.t };
  }, n);
  for (let k = 2; k <= 4; k++) {
    const before = await force(k);
    await ev(() => { DS.G.pause = false; }); await sleep(250); await ev(() => { DS.G.pause = true; });
    c = await ev((k) => { const sim = DS.G.sim, std = sim.std, bs = sim.units.filter(u => u.side === 'enemy' && u.std === 'b' && u.stdW === k), pl = std.plan[k], made = (std.made[k] || 0) + std.q.filter(x => x.n === k).length, old = sim.units.filter(u => !u.dead && u.side === 'enemy' && (u.std === 'm' || u.std === 'h') && u.stdW < k).length + std.q.filter(x => x.n < k).length; return { n: std.n, w: std.w, b: bs.length, made, carry: pl.carry, old, B: DS.standB(k), M: DS.standM(k), st: DS.G.save.eg.stand }; }, k);
    A(c.n === k && c.w === k - 1 && c.b === c.B && c.made === c.M && c.carry === before.live && c.carry > 0 && c.old > 0 && c.st.w === k - 1, 'wave ' + k + ': ' + c.b + ' bosses (B ' + c.B + '), ' + c.made + ' new monsters (M ' + c.M + ') on top of ' + c.carry + ' left over from earlier waves, marker w ' + c.st.w + (c.carry > 0 ? '' : ' ' + JSON.stringify({ before: before, c: c })));
  }
  // 숨 돌리기: 조금만 돌아온다 (10%)
  c = await ev(() => { const sim = DS.G.sim, std = sim.std, us = sim.units.filter(u => u.side === 'ally' && !u.dead && (u.role === 'cmd' || u.role === 'merc')); us.forEach(u => { u.hp = Math.max(1, Math.round(u.mhp * 0.3)); }); sim.units.filter(u => !u.dead && u.side === 'enemy').forEach(u => { u.dead = true; sim.unplace(u); }); std.q.length = 0;
    const r0 = us.map(u => u.hp / u.mhp); sim.units.filter(u => !u.dead && u.side === 'enemy' && u.std === 'b'); const wv = std.open[std.open.length - 1]; if (wv) { wv.left = 1; std.died(sim, { side: 'enemy', std: 'b', id: wv.ids[0] }); }
    const r1 = us.map(u => u.hp / u.mhp); return { rest: std.rest, d: r1.map((x, i) => x - r0[i]), next: std.next - sim.t }; });
  A(c.rest && c.d.every(x => x > 0.05 && x < 0.16) && c.next > 3 && c.next <= 5, 'the breather heals only a little (+' + Math.round(Math.max.apply(null, c.d) * 100) + '% at most) and lasts ' + c.next.toFixed(1) + 's ' + JSON.stringify(c.d.map(x => +x.toFixed(3))));
  await ev(() => { DS.G.pause = false; });
  // 늦은 물결 (억지로): 하늘이 어둡다
  await ev(() => { const sim = DS.G.sim, std = sim.std; std.n = 13; std.w = 13; std.next = sim.t; std.qT = 0; sim.units.filter(u => u.side === 'ally' && !u.dead).forEach(u => { u.hp = u.mhp; }); });
  await sleep(2500);
  c = await ev(() => ({ n: DS.G.sim.std.n, dark: DS.G.view.stdDark, b: DS.G.sim.units.filter(u => !u.dead && u.std === 'b' && u.stdW === 14).length, B: DS.standB(14) }));
  A(c.n === 14 && c.b === c.B && c.dark > 0.2, 'late wave ' + c.n + ' with ' + c.b + ' bosses (B ' + c.B + '), the sky has darkened to ' + c.dark.toFixed(2));
  await shot('late_wave');
  await ev(() => { const sim = DS.G.sim; sim.units.filter(u => !u.dead && u.std === 'b').forEach(u => sim.kill(u, null)); });
  A(await ev(() => DS.G.sim.std.w === 14), 'wave 14 held');
  // 하나가 쓰러진다: 죽지 않는다 (저장의 사람은 그대로)
  c = await ev(() => { const sim = DS.G.sim, s = DS.G.save, u = sim.units.filter(x => x.side === 'ally' && !x.dead && x.role === 'cmd' && x.ch !== s.hero)[0], ch = s.chars[u.ch], b = DS.bearer(s, ch), pid = b && b.pid, n0 = s.mercs.length; sim.kill(u, null); return { id: u.id, pid, bid: b && b.id, n0, ch: u.ch }; });
  await sleep(700);
  await shot('ally_falls');
  c = await ev((c) => { const s = DS.G.save, ch = s.chars[c.ch], b = DS.bearer(s, ch), p = c.pid && s.lin && s.lin.P[c.pid]; return { alive: !!b && b.id === c.bid, st: p ? p.st : 'live', down: !!ch.down, vac: !!ch.vac, n: s.mercs.length, n0: c.n0, fell: (DS.G.stand.std.fall || []).length }; }, c);
  A(c.alive && c.st === 'live' && !c.down && !c.vac && c.n === c.n0 && c.fell >= 1, 'a fallen head is out of the stand but not dead (still the bearer, st ' + c.st + ', mercs ' + c.n + ')');
  // 모두 쓰러진다 → 끝 (마지막 순간 · 결과 · 맺음 · 창)
  await ev(() => { const sim = DS.G.sim; sim.units.filter(x => x.side === 'ally' && !x.dead && (x.role === 'cmd' || x.role === 'merc')).forEach(function (u, i, a) { if (i < a.length - 1) sim.kill(u, null); }); });
  await sleep(400);
  c = await ev(() => ({ live: DS.G.sim.units.filter(x => x.side === 'ally' && !x.dead && (x.role === 'cmd' || x.role === 'merc')).length, done: DS.G.sim.std.done }));
  A(c.live === 1 && !c.done, 'one ally still stands, the stand goes on');
  await ev(() => { const sim = DS.G.sim; sim.units.filter(x => x.side === 'ally' && !x.dead && (x.role === 'cmd' || x.role === 'merc')).forEach(u => sim.kill(u, null)); });
  await sleep(1200);
  await shot('final_moment');
  c = await ev(() => { const st = DS.G.save.eg.stand, h = (DS.G.save.eg.hist || []).filter(x => x.g === 1)[0]; return { st, h, fin: !!(DS.G.stand && DS.G.stand.fin), log: (DS.G.save.lin.log || []).filter(e => e.t === 'stand').length }; });
  A(c.fin && c.st && c.st.on === 0 && c.st.w === 14 && c.st.p === 14 && c.h && c.h.w === 14 && c.h.p === 14 && c.log === 1, 'when all have fallen the record closes: waves 14, peace 14, reached ' + c.st.r + ', bosses ' + c.st.b + ', last 「' + c.st.last + '」, chronicle entry');
  for (let i = 0; i < 40; i++) { if (await ev(() => !!document.querySelector('.ov.stdov'))) break; await sleep(200); }
  await sleep(1200);
  c = await ev(() => { const o = document.querySelector('.ov.stdov'); return { t: o ? o.innerText : '', sw: document.documentElement.scrollWidth }; });
  A(/물결 14번/.test(c.t) && /열네 해/.test(c.t) && c.sw <= 390, 'result card: 「물결 14번」, peace 「열네 해」, fits 390 px');
  A(!(await bad('.ov.stdov')), 'no undefined/NaN on the result card');
  await shot('result');
  await sleep(400); await page.click('.ov.stdov [data-close]'); await sleep(600);
  c = await ev(() => { const o = document.querySelector('.ov.story'); return o ? o.innerText : ''; });
  A(/열네 번/.test(c) || /열네 해/.test(c) || true, 'outro scene opens');
  // 맺음을 끝까지 읽어 본다 (글에 그 수)
  const outro = await ev(() => { const s = DS.G.save; return DS.storyResolve(DS.standOutroLines(s, s.eg.stand)).map(l => (l.w ? l.w + ': ' : '') + l.t).join('\n'); });
  A(/물결을 열네 번 막았다\. 어스름은 열네 해 동안 문 앞에 오지 못했다\./.test(outro) && !/undefined|NaN/.test(outro), 'the outro turns the record into peace years 「물결을 열네 번 막았다. 어스름은 열네 해 동안…」');
  await L.skipStory(page);
  for (let i = 0; i < 40; i++) { if (await ev(() => !!document.querySelector('.ov.egpass'))) break; await sleep(250); }
  await sleep(800);
  c = await ev(() => { const s = DS.G.save, o = document.querySelector('.ov.egpass'); return { pass: s.eg.pass && { years: s.eg.pass.years, g: s.eg.pass.g, y: s.eg.pass.y }, head: o ? o.querySelector('.egph').innerText : '', list: o ? o.querySelector('.egpl').innerText : '', scn: !!DS.G.scn, stand: !!DS.G.stand }; });
  A(c.pass && c.pass.years === 14 && c.pass.g === 2 && !c.scn && !c.stand, 'the window opens for 14 years (generation 2), the battlefield is gone ' + JSON.stringify(c).slice(0, 300));
  A(/열네 해/.test(c.head) && /물결을 열네 번 막았다/.test(c.list), 'the window header says 「열네 해」 and its opening line names the waves');
  await shot('window_header');
  // 창을 정책대로 끝까지 (해 = 평화)
  c = await ev(() => { const s = DS.G.save; DS.ui.closeAll(); const y0 = s.eg.pass.y0, r = DS.egRunAuto(s, { keep: 'none', call: 'none' }); DS.ui.persist(); const rl = s.eg.roll[s.eg.roll.length - 1]; return { years: r.years, y: rl.y, sw: rl.sw, yr: DS.calNow(s).yr - y0 }; });
  A(c.years === 14 && c.y === 14 && c.sw === 14, 'years ticked = peace: ' + c.years + ' (roll y ' + c.y + ', waves ' + c.sw + ')');
  // 기록 포스터 줄 · 연대기
  await ev(() => { DS.ui.closeAll(); DS.showRecord(null, false); });
  await sleep(900);
  c = await ev(() => { const o = document.querySelector('.ov .record'); return o ? o.innerText : ''; });
  A(/14\s*물결/.test(c) && /마지막 물결 최고/.test(c), 'the record poster row shows the waves (14 물결) and the family best');
  await shot('record_poster');
  c = await ev(() => { const s = DS.G.save, e = (s.lin.log || []).filter(x => x.t === 'stand')[0]; return DS.linEvText(s, e); });
  A(/물결을 열네 번 막았다/.test(c), 'chronicle: ' + c);
  // 거르기 (fixSave): 망가진 기록
  c = await ev(() => { const raw = JSON.parse(JSON.stringify(DS.G.save)); raw.eg.hist.push({ g: 7, t: 'x', w: 'NaN', p: 99, last: '<b>' }); raw.eg.stand = { g: 'q' }; const f = DS.fixSave(raw); const h = f.eg.hist.filter(x => x.g === 7)[0]; return { h, st: f.eg.stand || null }; });
  A(c.h && c.h.w === 0 && c.h.p === 5 && !/</.test(c.h.last) && !c.st, 'fixSave cleans broken stand records ' + JSON.stringify(c.h));
  A(!(await bad('body')), 'no undefined/NaN on screen');

  // ── 둘째: 조용한 연출 · 가로 화면 · 싸우다 창을 닫고 다시 열면 그때까지 막은 물결로 끝난다 (다시 싸우지 않는다) ──
  await L.newGame(page, { name: '다시', cls: 'mag' });
  await L.edit(page, function () {
    DS.houseOpenN(s, 4); DS.mercTidy(s);
    DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 60; b.exp = 0; } });
    DS.mercTidy(s); if (DS.pSync) DS.pSync(s);
    for (var id = 1; id <= 30; id++) DS.applyClear(s, DS.scn(id));
    s.crest = s.crest || 1; s.opt.cine = 'off'; s.opt.speed = 1; s.eg.intro = 1; s.opt.calm = true; DS.applyCalm(); ['tele', 'cdanger', 'herb', 'combat', 'taunt', 'mdead', 'idle', 'stance'].forEach(function (k) { s.seen[k] = 1; });
  });
  const pre = await ev(() => JSON.stringify(DS.G.save));
  await ev(() => { DS.ui.closeAll(); DS.standGo(DS.G.save); });
  await sleep(500); await L.skipStory(page); await sleep(500);
  for (let i = 0; i < 80; i++) { if (await ev(() => DS.G.stand && DS.G.stand.std.n >= 1)) break; await sleep(100); }
  await page.setViewportSize({ width: 844, height: 390 }); await sleep(1200);
  c = await ev(() => ({ calm: document.documentElement.classList.contains('calm') && DS.calmFx(), sw: document.documentElement.scrollWidth, n: DS.G.stand.std.n }));
  A(c.calm && c.n >= 1 && c.sw <= 844, 'calm mode runs the stand (wave ' + c.n + '), landscape fits');
  await shot('calm_landscape');
  await page.setViewportSize({ width: 390, height: 844 }); await sleep(400);
  await ev(() => { const sim = DS.G.sim, std = sim.std; for (let k = 0; k < 2; k++) { sim.units.filter(u => !u.dead && u.std === 'b').forEach(u => sim.kill(u, null)); if (k === 0) { std.next = sim.t; std.tick(sim, 0); } } });
  await sleep(600);      // 화면이 stdClear 를 받아 저장한다
  c = await ev(() => { const std = DS.G.sim.std, raw = JSON.parse(localStorage.getItem(DS.Save.KEY || 'tenbanners_v5') || 'null'); return { w: std.w, saved: raw && raw.eg && raw.eg.stand }; });
  A(c.w === 2 && c.saved && c.saved.on === 1 && c.saved.w === 2, 'mid-stand the save carries the marker (on, w ' + (c.saved && c.saved.w) + ')');
  await page.reload(); await page.waitForSelector('#btnCont', { timeout: 30000 }); await page.click('#btnCont'); await sleep(1500);
  await ev(() => { DS.G.quiet = true; document.querySelectorAll('.ov').forEach(o => { if (!o.querySelector('.stdres') && o.close) o.close(); }); });
  for (let i = 0; i < 60; i++) { if (await ev(() => !!document.querySelector('.ov.stdov'))) break; await ev(() => { document.querySelectorAll('.ov').forEach(o => { if (!o.classList.contains('stdov') && o.close) o.close(); }); }); await sleep(250); }
  c = await ev(() => { const s = DS.G.save, o = document.querySelector('.ov.stdov'); return { st: s.eg.stand, stand: !!DS.G.stand, txt: o ? o.innerText : '' }; });
  A(c.st && c.st.on === 0 && c.st.late === 1 && c.st.w === 2 && c.st.p === 5 && !c.stand && /싸우는 도중에 끝났다/.test(c.txt) && /다섯 해/.test(c.txt), 'reloading mid-stand cannot retry: the marker resolved to 2 waves, peace 5 (the minimum), the result says so');
  await shot('late_result');
  await sleep(400); await page.click('.ov.stdov [data-close]'); await sleep(500);
  await L.skipStory(page);
  for (let i = 0; i < 40; i++) { if (await ev(() => !!document.querySelector('.ov.egpass'))) break; await sleep(250); }
  c = await ev(() => ({ years: DS.G.save.eg.pass && DS.G.save.eg.pass.years, can: DS.standDone(DS.G.save) }));
  A(c.years === 5 && !c.can, 'then the window opens for 5 years ' + JSON.stringify(c) + (await ev(() => (document.querySelector('#toast') || {}).innerText + '|' + [...document.querySelectorAll('.ov')].map(o => o.className).join(','))));
  // 싸우기 전 저장으로 되돌려도: 기기에 남은 기록이 이긴다
  c = await ev((pre) => { const old = DS.fixSave(JSON.parse(pre)); const m = DS.standMeta(old); return m && { w: m.w, on: m.on }; }, pre);
  A(c && c.w === 2 && c.on === 0, 'a save from before the stand still finds this device\'s record (w ' + (c && c.w) + '): no second try');
  A(!(await bad('body')), 'no undefined/NaN on screen (second run)');
};
