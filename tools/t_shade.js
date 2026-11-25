// 2.5.0 「이름 부르기」 시험 (390×844): 출전마다 한 번, 먼저 간 이의 그림자를 불러 잠깐 같이 싸운다 (src/shade.js).
//   H=844 OUT=qa_out/shade node tools/shot.js tools/t_shade.js   (V250=폴더 면 보고용 화면을 그 폴더에 · 웹 판: PAGE=…/dist/web/index.html)
//   ① 먼저 간 이가 없으면 단추는 꺼진 채 (누르면 까닭) · ② 먼저 간 이가 있으면 단추 → 이름 고르기 → 그림자가 와서 싸우고 → 걷힌다 (한마디 · 「…또 불러라.」)
//   ③ 추모 기록 · 가계 기록 · 가주 · 가방이 그대로 · 한 싸움에 한 번 · 고침을 받지 않는다 · 이름 지우기 대상이 아니다 · 쓰러져도 죽음이 아니다
//   ④ 자동: 맹주가 「자동」이면 가주가 위태로울 때 스스로 부른다 · 「수동」이면 부르지 않는다 ⑤ 들판 · 연무장에는 없다 · 30번의 이름 지우기 중에는 쓸 수 없다
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, shot, L) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), sleep = L.sleep;
  const V = process.env.V250; if (V) fs.mkdirSync(V, { recursive: true });
  const snap = async (name) => { const f = await shot(name); if (V) fs.copyFileSync(f, path.join(V, 'shade_' + name + '.png')); return f; };
  await L.newGame(page, { cls: 'inf', name: '부름' });
  await ev(() => { DS.G.save.opt.cine = 'off'; DS.G.save.opt.speed = 1; });
  // 중반 저장: 12번까지 깼고 가문 여섯, 모두 4단
  await L.edit(page, function () { for (var id = 1; id <= 12; id++) DS.applyClear(s, DS.scn(id)); DS.houseOpenN(s, 6); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 42; b.exp = 0; } }); DS.mercTidy(s); DS.pSync(s); s.seen.shade = 1; });
  // ① 먼저 간 이가 없다 — 단추는 꺼진 채, 누르면 까닭
  let c = await ev(() => { DS.ui.closeAll(); DS.G.quiet = true; DS.startScenario(DS.scn(13)); DS.G.pause = true; return { dead: DS.storyDead(DS.G.save).length, armed: !!DS.G.sim.shd, n: DS.G.sim.shd && DS.G.sim.shd.cands.length }; });
  await sleep(700); await L.skipStory(page, 5); await ev(() => { DS.G.pause = true; });
  c = Object.assign(c, await ev(() => { var b = document.querySelector('#acts .act.item.shade'); return { btn: !!b, off: !!(b && b.classList.contains('off')), why: DS.shadeUI.why(), items: document.querySelectorAll('#acts .arow.it .act.item').length }; }));
  A(c.dead === 0 && c.armed && c.n === 0, 'no one has died yet: sortie armed with no names (' + JSON.stringify(c) + ')');
  A(c.btn && c.off && c.why === DS_T(c, 'none'), 'button shown but off: 「' + c.why + '」');
  A(c.items === 4, 'item row has four slots in a sortie (herb · mana · endo · 이름 부르기)');
  await page.click('#acts .act.item.shade'); await sleep(350);
  c = await ev(() => ({ pick: !!document.querySelector('#shadepick'), tip: (document.querySelector('#acts .act.item.shade .deny, .denyTag, #toast') || {}).textContent || '' }));
  A(!c.pick, 'tap with no names does not open the picker');
  await snap('button_off');
  // 먼저 간 이 둘: 가주 하나는 마지막 한마디를 남기고 쓰러졌다 (게임과 같은 길: 명부에서 빠짐 → 추모 기록 → 가계 기록) · 맹주의 가문원 하나
  await ev(() => { DS.G.pause = false; DS.enterZone(DS.G.save.town); });
  await sleep(500);
  const dead = await L.edit(page, function () {
    var out = [];
    var ch = DS.charList(s).filter(function (c) { return c.id !== s.hero && DS.bearer(s, c); })[0], bm = DS.bearer(s, ch); bm.lw = '밥은 먹고 하십시오';
    var lost = DS.loseMerc(s, bm.id); s.fallen = DS.fallenTrim((s.fallen || []).concat([DS.fallenRecord(lost, '시험')])); DS.linMercDied(s, lost, '시험'); out.push([lost.n, ch.cls]);
    var m = DS.addMerc(s, 'm_archer', 3, s.hero); m.L = 30; m.n = m.n || '활쏘미'; m.lw = '';
    var l2 = DS.loseMerc(s, m.id); s.fallen = DS.fallenTrim((s.fallen || []).concat([DS.fallenRecord(l2, '시험')])); DS.linMercDied(s, l2, '시험'); out.push([l2.n, 'm_archer']);
    DS.linAutoAll && DS.linAutoAll(s); DS.sbTick && DS.sbTick(s); DS.mercTidy(s); DS.pSync(s);
    return out;
  });
  c = await ev(() => DS.shadeCands(DS.G.save).map(function (x) { return [x.n, x.cls, x.L, x.lw]; }));
  A(c.length >= 1 && c[0][0] === dead[0][0] && c[0][1] === dead[0][1] && c[0][3] === '밥은 먹고 하십시오', 'names to call, heaviest first: ' + JSON.stringify(c));
  // ② 수동(맹주 「수동」) — 단추 → 고르기 → 그림자
  await ev(() => { var s = DS.G.save; s.chars[s.hero].manual = true; DS.ui.closeAll(); DS.G.quiet = true; DS.startScenario(DS.scn(13)); DS.G.pause = true; });
  await sleep(700); await L.skipStory(page, 5);
  const before = await ev(() => { var s = DS.G.save; DS.G.pause = true; return { fallen: JSON.stringify(s.fallen), lin: JSON.stringify(s.lin), mercs: s.mercs.length, chars: JSON.stringify(Object.keys(s.chars).map(function (k) { return [k, s.chars[k].L, !!s.chars[k].vac]; })), items: JSON.stringify(s.gear || {}), gold: s.gold }; });
  c = await ev(() => { var b = document.querySelector('#acts .act.item.shade'); return { ready: !!(b && b.classList.contains('ready')), off: !!(b && b.classList.contains('off')), why: DS.shadeUI.why(), auto: DS.G.sim.byId['c' + DS.G.save.hero].auto }; });
  A(c.ready && !c.off && c.why === '' && c.auto === false, 'with the fallen: button ready (맹주 manual) ' + JSON.stringify(c));
  await snap('button_ready');
  await page.click('#acts .act.item.shade'); await sleep(400);
  c = await ev(() => { var p = document.querySelector('#shadepick'); if (!p) return null; var r = p.getBoundingClientRect(); return { n: p.querySelectorAll('.spn').length, names: [...p.querySelectorAll('.spn b')].map(b => b.textContent), sub: [...p.querySelectorAll('.spn small')].map(b => b.textContent), head: (p.querySelector('.sph') || {}).textContent, r: [r.left, r.right, r.top, r.bottom], docW: document.documentElement.scrollWidth }; });
  A(c && c.n >= 1 && c.n <= 3 && c.names[0] === dead[0][0] && c.r[0] >= 0 && c.r[1] <= 390 && c.r[2] > 100 && c.docW <= 390, 'picker: ' + JSON.stringify(c));
  await snap('picker');
  const bad0 = await L.badText(page, '#shadepick'); A(!bad0.length, 'picker text clean');
  // 싸움을 붙여 두고(적을 깨운다) 첫 이름을 부른다
  await ev(() => { var sim = DS.G.sim; sim.units.forEach(function (e) { if (e.side === 'enemy' && !e.dead) e.aggro = true; }); sim.combat = true; });
  await page.click('#shadepick .spn[data-i="0"]'); await sleep(120);
  c = await ev(() => { var sim = DS.G.sim, S = sim.shd, u = S && sim.byId[S.id]; return { used: S.used, auto: S.auto, id: S.id, role: u && u.role, name: u && u.name, cls: u && u.cls, hp: u && u.mhp, life: u && u.life, pick: !!document.querySelector('#shadepick'), cut: (document.querySelector('#shadecut.on b') || {}).textContent || '' }; });
  A(c.used && !c.auto && c.role === 'shade' && c.name === dead[0][0] && c.cls === dead[0][1] && c.life > 11 && !c.pick, 'called by hand: shade of ' + c.name + ' (' + c.cls + ', ' + c.hp + ' hp, ' + c.life + ' s)');
  A(c.cut === dead[0][0] + '!', 'call line 「' + c.cut + '」');
  // 그림자의 세기: 같은 병과 · 레벨의 가주보다 약하다 (≈ 70%) · 고침을 받지 않는다 · 고침 · 가호의 대상(friends)이 아니다 · 이름 지우기 후보가 아니다
  c = await ev(() => { var sim = DS.G.sim, u = sim.byId[sim.shd.id], ref = { cls: u.cls, L: u.L }; DS.stdGear(ref, u.tier); var st = DS.charStats(ref), h0 = u.hp; u.hp = Math.round(u.mhp / 2); var got = sim.heal(u, 999), hero = sim.byId['c' + DS.G.save.hero], fr = sim.friends(hero).some(function (f) { return f === u; }); u.hp = h0;
    return { k: u.mhp / st.hp, ka: u.atk / st.atk, hk: DS.SHADE.hk, kk: DS.SHADE.k, healed: got, inFriends: fr, L: u.L, refL: DS.partyL(DS.G.save) }; });
  A(Math.abs(c.k - c.hk) < 0.02 && Math.abs(c.ka - c.kk) < 0.02 && c.k < 0.8 && c.L <= Math.max(c.refL, 1) && c.healed === 0 && !c.inFriends, 'shade is a weaker copy (SHADE.k / hk), gets no healing, is nobody\'s heal target ' + JSON.stringify(c));
  await ev(() => { DS.G.pause = false; DS.G.save.opt.speed = 1; window.__shHit = 0; var sim = DS.G.sim, h0 = sim.hurt; sim.hurt = function (v, d, src) { if (src && src.role === 'shade' && v.side === 'enemy') window.__shHit += 1; return h0.apply(this, arguments); }; });
  await sleep(1300);
  await snap('shade_field');
  { const r = await ev(() => { var sim = DS.G.sim, u = sim.byId[sim.shd.id], v = u && DS.G.view.vu[u.id]; if (!v) return null; var p = DS.G.view.screenOf(v.x, v.y); return { x: p.x, y: p.y }; });
    if (r) { const f = await page.screenshot({ clip: { x: Math.max(0, r.x - 70), y: Math.max(0, r.y - 70), width: 140, height: 110 } }); require('fs').writeFileSync(require('path').join(require('path').dirname(await shot('zoom_ref')), 'shade_zoom.png'), f); } }
  for (let i = 0; i < 30; i++) { const h = await ev(() => window.__shHit); if (h > 0) break; await sleep(300); }
  c = await ev(() => ({ hits: window.__shHit, live: !!(DS.G.sim.byId[DS.G.sim.shd.id] && !DS.G.sim.byId[DS.G.sim.shd.id].dead), bark: (DS.G.view.barks || []).map(function (b) { return b.text; }) }));
  A(c.hits > 0, 'shade fights (' + c.hits + ' hits on enemies)');
  // 한 싸움에 한 번
  c = await ev(() => { var sim = DS.G.sim, n0 = sim.units.filter(function (u) { return u.role === 'shade'; }).length, r = sim.shadeCall(1); return { again: !!r, n: sim.units.filter(function (u) { return u.role === 'shade'; }).length === n0, why: DS.shadeUI.why() }; });
  A(!c.again && c.n && (c.why === '이름은 한 싸움에 한 번 부른다' || c.why === '그림자가 다녀갔다'), 'once per battle: second call refused 「' + c.why + '」');
  // 걷힌다: 남은 시간을 줄여 끝까지
  await ev(() => { var sim = DS.G.sim, u = sim.byId[sim.shd.id]; if (u && !u.dead) u.life = 0.4; });
  for (let i = 0; i < 20; i++) { const g = await ev(() => { var u = DS.G.sim.units.filter(function (x) { return x.role === 'shade'; })[0]; return !u || u.dead; }); if (g) break; await sleep(150); }
  await sleep(250);
  c = await ev(() => { var sim = DS.G.sim, u = sim.units.filter(function (x) { return x.role === 'shade'; })[0], V = DS.G.view; return { gone: !u || u.dead, why: u && u.shadeGone, fled: u && u.fled, float: (V.floats || []).map(function (f) { return f.text; }).filter(function (t) { return /불러라|잊지/.test(t); }), why2: DS.shadeUI.why(), btnOff: !!document.querySelector('#acts .act.item.shade.off') }; });
  A(c.gone && c.why === 'time' && c.fled, 'shade fades on time (not a death)');
  A(c.float.length >= 1, 'fade line: ' + JSON.stringify(c.float));
  A(c.why2 === '그림자가 다녀갔다' && c.btnOff, 'after it fades: button off 「' + c.why2 + '」');
  await snap('fade_line');
  await ev(() => { DS.G.pause = true; });
  const after = await ev(() => { var s = DS.G.save; return { fallen: JSON.stringify(s.fallen), lin: JSON.stringify(s.lin), mercs: s.mercs.length, chars: JSON.stringify(Object.keys(s.chars).map(function (k) { return [k, s.chars[k].L, !!s.chars[k].vac]; })), items: JSON.stringify(s.gear || {}) }; });
  A(after.fallen === before.fallen && after.lin === before.lin && after.mercs === before.mercs && after.chars === before.chars && after.items === before.items, 'save.fallen · lineage · houses · roster · bag untouched by the shade');
  // 쓰러뜨려도 죽음이 아니다 (엔진 kill → 걷힘) · 이름 지우기 후보가 아니다
  c = await ev(() => {
    var s = DS.G.save, b = DS.buildScenario(DS.scn(13), 3, 'inf'), sim = new DS.Sim({ map: b.map, units: [], mode: 'scn', seed: 9, inv: {} }), sp = DS.partySpecs(s).slice(0, 3), ev0;
    sp.forEach(function (u, i) { u.x = b.start[i % b.start.length][0]; u.y = b.start[i % b.start.length][1]; sim.add(u); });
    sim.heroId = 'c' + s.hero; DS.shadeArm(sim, s); var sh = sim.shadeCall(0); sim.drain();
    sim.hurt(sh, sh.mhp * 5, null); ev0 = sim.drain().map(function (e) { return e.t + (e.flee ? ':flee' : '') + (e.why ? ':' + e.why : ''); });
    var sim2 = new DS.Sim({ map: b.map, units: [], mode: 'scn', seed: 9, inv: {} }); sp.forEach(function (u) { sim2.add(Object.assign({}, u, { id: null })); }); sim2.heroId = sim2.cmds()[0].id; DS.shadeArm(sim2, s); var sh2 = sim2.shadeCall(0);
    var K = { id: 'kk', x: 2, y: 2, hp: 100, mhp: 100 }; sim2.erInit(K); sim2.erStart(K); var ids = (K.er.on && K.er.on.ids) || [];
    return { ev: ev0, lose: sim.result, cmdsLeft: sim.cmds().length, erIds: ids, shadeMarked: ids.indexOf(sh2.id) >= 0 || !!sh2.erM };
  });
  A(c.ev.indexOf('die:flee') >= 0 && c.ev.indexOf('shadeEnd:down') >= 0 && !c.lose && c.cmdsLeft === 3, 'struck down: it fades (' + c.ev.join(' ') + '), no death, no defeat');
  A(!c.shadeMarked, 'the dusk king\'s erase never picks the shade (marked ' + JSON.stringify(c.erIds) + ')');
  // ④ 자동: 맹주가 「자동」이면 가주가 위태로울 때 스스로
  await ev(() => { var s = DS.G.save; s.chars[s.hero].manual = false; DS.ui.closeAll(); DS.G.quiet = true; DS.startScenario(DS.scn(13)); DS.G.pause = true; });
  await sleep(700); await L.skipStory(page, 5);
  c = await ev(() => { var sim = DS.G.sim; sim.units.forEach(function (e) { if (e.side === 'enemy' && !e.dead) e.aggro = true; }); sim.combat = true; for (var i = 0; i < 20; i++) { sim.cmds().forEach(function (u) { u.hp = u.mhp; }); sim.update(0.25); } sim.drain(); return { used: sim.shd.used, auto: sim.byId['c' + DS.G.save.hero].auto, t: sim.t - sim.shd.t0 }; });
  A(!c.used && c.auto, 'auto: healthy party does not call (' + JSON.stringify(c) + ')');
  c = await ev(() => { var sim = DS.G.sim, v = sim.cmds().filter(function (u) { return !u.hero; })[0] || sim.cmds()[0]; v.hp = Math.round(v.mhp * 0.2); DS.G.pause = false; return v.name; });
  for (let i = 0; i < 60; i++) { const u = await ev((nm) => { var sim = DS.G.sim, v = sim.cmds().filter(function (u) { return u.name === nm; })[0]; if (v && !sim.shd.used) v.hp = Math.min(v.hp, Math.round(v.mhp * 0.2)); return sim.shd.used; }, c); if (u) break; await sleep(150); }      // 2.6.0: 싸움이 한 박자 쉬고 움직인다 — 부를 때까지 기다린다 (그사이 고쳐지면 다시 낮춘다)
  await sleep(250);
  c = await ev(() => { var sim = DS.G.sim, S = sim.shd; return { used: S.used, auto: S.auto, cut: (document.querySelector('#shadecut.on small') || {}).textContent || '' }; });
  A(c.used && c.auto && /자동/.test(c.cut), 'auto: a house head below 35% → the 맹주 calls by itself (' + JSON.stringify(c) + ')');
  await snap('auto_call');
  // 수동이면 스스로 부르지 않는다
  c = await ev(() => {
    var s = DS.G.save, b = DS.buildScenario(DS.scn(13), 3, 'inf'), sim = new DS.Sim({ map: b.map, units: [], mode: 'scn', seed: 4, inv: {} }), sp = DS.partySpecs(s).slice(0, 3);
    sp.forEach(function (u, i) { u.x = b.start[i % b.start.length][0]; u.y = b.start[i % b.start.length][1]; u.auto = false; sim.add(u); }); sim.heroId = 'c' + s.hero; DS.shadeArm(sim, s);
    sim.combat = true; sim.cmds().forEach(function (u) { u.hp = Math.round(u.mhp * 0.2); }); var en = sim.add({ side: 'enemy', role: 'mob', type: 'x', name: 'x', L: 1, hp: 99999, mhp: 99999, atk: 0, def: 0, mag: 0, res: 0, spd: 1, mv: 9, mt: 'foot', rng: [1, 1], x: 3, y: 3 }); if (en) en.aggro = true;
    for (var i = 0; i < 40; i++) sim.update(0.25);
    return { used: sim.shd.used };
  });
  A(!c.used, 'manual 맹주: the shade is only called by the button');
  // ⑤ 들판 · 연무장 · 이름 지우기 중
  await ev(() => { DS.G.pause = false; DS.ui.closeAll(); DS.enterZone('dawn'); });
  await sleep(600);
  c = await ev(() => ({ btn: !!document.querySelector('#acts .act.item.shade'), shd: !!DS.G.sim.shd, items: document.querySelectorAll('#acts .arow.it .act.item').length }));
  A(!c.btn && !c.shd && c.items === 3, 'field: no name calling (three item slots)');
  c = await ev(() => { var s = DS.G.save, a = DS.arenaSpec(s, 'h'), m = DS.arenaRoster ? DS.arenaRoster(s) : []; var b = a ? JSON.parse(JSON.stringify(a)) : null; var d = a && b ? DS.arenaDuel(a, b, { seed: 3 }) : null; return { duel: !!d, shd: !!(d && d.sim.shd), arm: d ? DS.shadeArm(d.sim, s) : 'x' }; });
  A(c.duel && !c.shd && c.arm === null, 'arena duel: no shade, arming refused (' + JSON.stringify(c) + ')');
  c = await ev(() => { var sim = { shd: { cands: [{ n: 'x' }], used: false }, byId: {}, result: null, _er: {}, shadeCaller: function () { return {}; } }; return DS.shadeUI.why.call(null) !== undefined && (function () { var g = DS.G, s0 = g.sim; g.sim = sim; var w = DS.shadeUI.why(); g.sim = s0; return w; })(); });
  A(c === '지금은 산 이름부터 지킨다', 'during the dusk king\'s erase the button waits 「' + c + '」');
  // 웹 화면 폭
  c = await ev(() => document.documentElement.scrollWidth);
  A(c <= 390, 'no horizontal scroll (' + c + ')');
};
function DS_T(c, k) { return { none: '아직 부를 이름이 없다' }[k]; }
