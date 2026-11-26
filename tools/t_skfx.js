// 2.7 기술 연출 틀 시험 (390×844): 맹주 쪽 기술 130 을 모두 한 번씩 — 우리가 쓸 때 · 적이 쓸 때.
//   H=844 OUT=<폴더> PAGE=<…/dist/test.html> node tools/shot.js tools/t_skfx.js      (ONLY=inf_bash,mag_meteor 면 그 기술만)
//   ① 설명: 「위력」 · undefined · NaN · 긴 줄표 없음 ② 130 모두 오류 없이 걸리고 풀린다 (제 연출이 등록된 기술은 그 연출이 돈다)
//   ③ 여러 박자 · 예고 낙하 · 남는 자리: 박자 수 · 맥박 수가 표와 같고, 끝나면 엔진(sq · zn)과 화면(예고 칸 · 안무 · 그림 조각)에 남는 것이 없다
//   ④ 상한: 알갱이 240 · 모양 48 · 그림 조각 · 고리 · 선, 기술 하나의 몫은 단계 예산 안 ⑤ 움직임 줄이기(calm): 흔들림 · 멈칫 · 화면 줄기 없음, 번쩍임 절반 · 가볍게(lite): 알갱이가 준다
//   ⑥ 도중에: 쓰는 이가 쓰러지면 남은 박자가 걷힌다 · 판이 끝나면 모두 걷힌다 · 비켜선 적은 맞지 않고 들어선 적은 맞는다 ⑦ 같은 판은 같은 사건 (결정적) ⑧ 자동 전투가 새 기술을 고른다
'use strict';
const path = require('path');
module.exports = async (page, shot, L, env) => {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a);
  await L.newGame(page, { cls: 'inf', name: '연출' });
  await L.closeAll(page);
  await page.addScriptTag({ path: path.join(__dirname, 'skstage_page.js') });
  await ev(() => { DS.G.save.opt.speed = 1; DS.Audio.set({ sfx: false, bgm: false }); });
  let ids = await ev(() => SKS.ids());
  A(ids.length === 130, 'player skills: ' + ids.length + ' (10 classes: class skills + 8단 x-skills + 30 ultimates + 30 ux)');
  if (process.env.ONLY) ids = process.env.ONLY.split(',');
  // ① 설명
  const dbad = await ev((ids) => ids.filter(function (id) { var d = DS.SKILLS[id].desc; return !d || /위력|undefined|NaN|\[object/.test(d) || ((DS.SKFX[id] || DS.skfx.DEFS[id]) && /—|–/.test(d)); }), ids);      // 긴 줄표는 연출을 마친 기술(등록 · 고친 기술)부터 걷는다
  A(!dbad.length, 'descriptions: none empty, no 「위력」/undefined/NaN; finished skills have no em-dash' + (dbad.length ? ' — ' + dbad.join(',') : ''));
  const sigs = await ev(() => Object.keys(DS.SKFX));
  const defs = await ev(() => Object.keys(DS.skfx.DEFS));
  // ② ③ ④ 모두 한 번씩, 두 편에서
  const CAP = await ev(() => DS.skfx.CAP);
  const bad = [], rep = {}; let nSeq = 0, nZone = 0, nRun = 0, peakP = 0, peakS = 0, peakF = 0;
  for (const side of ['ally', 'enemy']) for (const id of ids) {
    const r = await ev((a) => SKS.run(a.id, { side: a.side }), { id, side });
    rep[id + ':' + side] = r; nRun++;
    const b = [];
    if (!r.ok || r.skill < 1) b.push('no cast');
    if (r.err) b.push('fx error ' + r.lastErr);
    if (r.sig && r.ran < 1) b.push('signature did not run');
    if (r.want.beats && (r.beats !== r.want.beats || r.seqEnd !== 'done')) b.push('beats ' + r.beats + '/' + r.want.beats + ' end ' + r.seqEnd);
    if (r.want.beats) nSeq++;
    if (r.want.zticks && (r.zones !== 1 || r.zticks !== r.want.zticks || r.zends !== 1)) b.push('zone ' + r.zones + ' ticks ' + r.zticks + '/' + r.want.zticks + ' ends ' + r.zends);
    if (r.want.zticks) nZone++;
    if (r.want.dmg && r.hits < 1) b.push('no damage');
    if (r.pend || r.zleft) b.push('engine left ' + r.pend + ' seq ' + r.zleft + ' zones');
    if (r.view.fx || r.view.q || r.view.seq || r.view.zone || r.view.tele || r.view.poses) b.push('view left ' + JSON.stringify(r.view));
    if (r.peak.parts > 240 || r.peak.shapes > 48 || r.peak.fx > CAP.fx || r.peak.rings > CAP.rings + 16 || r.peak.lines > CAP.lines + 8 || r.peak.q > CAP.q) b.push('over cap ' + JSON.stringify(r.peak));
    if (r.ctx && (r.ctx.pn > r.ctx.B.parts || r.ctx.sn > r.ctx.B.shapes || r.ctx.dn > r.ctx.B.decal || r.ctx.gn > r.ctx.B.ghost)) b.push('over tier budget ' + JSON.stringify(r.ctx));
    peakP = Math.max(peakP, r.peak.parts); peakS = Math.max(peakS, r.peak.shapes); peakF = Math.max(peakF, r.peak.fx);
    if (b.length) bad.push(id + '(' + side + '): ' + b.join('; '));
  }
  A(!bad.length, 'all ' + nRun + ' casts (both sides) run clean: cast + effect, signature fx ran (' + sigs.length + ' registered), ' + nSeq + ' multi-beat / telegraphed and ' + nZone + ' zone casts delivered every beat and pulse, nothing left in engine or view' + (bad.length ? ' — ' + bad.slice(0, 12).join(' | ') : ''));
  A(peakP <= 240 && peakS <= 48 && peakF <= CAP.fx, 'global caps hold: peak particles ' + peakP + '/240, shapes ' + peakS + '/48, fx pieces ' + peakF + '/' + CAP.fx);
  const over = ids.filter(id => rep[id + ':ally'].peak.over > 0).map(id => id + ':' + rep[id + ':ally'].peak.over);
  console.log('note  budget clipped (asked for more than the tier allows): ' + (over.join(' ') || 'none'));
  // 고친 기술: 수치가 표대로 나온다 (박자 합 · 자리)
  const sg = ids.filter(id => sigs.indexOf(id) >= 0);
  // ⑤ calm · lite
  const base = {}; sg.forEach(id => { base[id] = rep[id + ':ally']; });
  await ev(() => { DS.gfxOpt = Object.assign(DS.gfxOpt || {}, { calm: true }); });
  const cb = []; let calmFlash = 0;
  for (const id of sg) { const r = await ev((id) => SKS.run(id, { side: 'ally' }), id); calmFlash = Math.max(calmFlash, r.screen.flash, r.screen.wash); if (r.err || r.screen.shake > 0.001 || r.screen.stop > 0.001 || r.screen.streak || r.screen.flash > 0.061 || r.screen.wash > 0.051 || r.pend || r.zleft) cb.push(id + ' ' + JSON.stringify(r.screen) + (r.err ? ' ERR ' + r.lastErr : '')); }
  A(!cb.length, 'calm (reduced motion): ' + sg.length + ' signature skills run with no shake, no hit-stop, no screen streaks; flash/wash at most ' + calmFlash.toFixed(3) + (cb.length ? ' — ' + cb.join(' | ') : ''));
  await ev(() => { DS.gfxOpt.calm = false; DS.G.save.opt.fxq = 'lite'; });
  const lb = []; let pn0 = 0, pn1 = 0;
  for (const id of sg) { const r = await ev((id) => SKS.run(id, { side: 'ally' }), id); if (r.ctx && base[id].ctx) { pn0 += base[id].ctx.pn; pn1 += r.ctx.pn; if (r.ctx.dn > 1 || r.ctx.gn > 0) lb.push(id + ' decals ' + r.ctx.dn + ' ghosts ' + r.ctx.gn); } if (r.err || r.screen.streak || r.pend || r.zleft) lb.push(id + (r.err ? ' ERR ' + r.lastErr : ' streak/left')); }
  A(!lb.length && pn1 <= pn0, 'lite (효과: 가볍게): all signature skills run; no afterimages or screen streaks, at most one ground decal; particles asked ' + pn1 + ' ≤ ' + pn0 + ' (V.burst then draws about half)' + (lb.length ? ' — ' + lb.join(' | ') : ''));
  await ev(() => { DS.G.save.opt.fxq = ''; });
  if (process.env.ONLY) return;
  // ⑥ 도중의 일
  let c = await ev(() => {
    var o = {};
    // 쓰는 이가 쓰러진다: 남은 박자는 걷힌다
    var r = SKS.run('ux_riposte', { at: { 5: function (sim, c) { c.u.hp = 1; sim.hurt(c.u, 1e7, null, {}); } } }); o.die = { beats: r.beats, end: r.seqEnd, pend: r.pend, view: r.view };
    r = SKS.run('mag_meteor', { at: { 6: function (sim, c) { c.u.hp = 1; sim.hurt(c.u, 1e7, null, {}); } } }); o.dieFall = { beats: r.beats, hits: r.hits, end: r.seqEnd, tele: r.view.tele };
    r = SKS.run('ux_icejail', { at: { 60: function (sim, c) { c.u.hp = 1; sim.hurt(c.u, 1e7, null, {}); } } }); o.dieZone = { zticks: r.zticks, zends: r.zends, zleft: r.zleft, vz: r.view.zone };
    // 판이 끝난다: 걸린 박자 · 자리 모두
    r = SKS.run('xmag_nova', { at: { 8: function (sim) { sim.result = 'win'; } } }); o.end = { beats: r.beats, pend: r.pend, end: r.seqEnd, tele: r.view.tele };
    r = SKS.run('xinf_aegis', { at: { 30: function (sim) { sim.result = 'win'; } } }); o.endZone = { zleft: r.zleft, zends: r.zends, vz: r.view.zone };
    // 비켜선 적은 맞지 않는다 · 들어선 적은 맞는다
    r = SKS.run('mag_meteor', { at: { 4: function (sim, c) { c.foes.forEach(function (f, i) { sim.moveTo(f, 14, 2 + i); }); } } }); o.out = r.hits;
    r = SKS.run('mag_meteor', { at: { 4: function (sim, c) { c.foes.forEach(function (f, i) { sim.moveTo(f, 14, 2 + i); }); }, 10: function (sim, c) { sim.moveTo(c.foes[0], c.tgt.x, c.tgt.y); } } }); o.inn = r.hits;
    // 예고 칸은 붉은 칸: 맞을 편의 위험 지도에 든다 (떨어지면 걷힌다)
    SKS.stage('mag_meteor', {}); var cu = SKS.cur, sim = cu.sim; SKS.castQuiet(); o.dz = sim.dz.enemy[cu.tgt.y * sim.w + cu.tgt.x]; o.dzAlly = sim.dz.ally[cu.tgt.y * sim.w + cu.tgt.x];
    for (var i = 0; i < 30; i++) SKS.step(0.05); o.dzAfter = sim.dz.enemy[cu.tgt.y * sim.w + cu.tgt.x];
    // 한 사람을 겨눈 여러 박자: 대상이 쓰러지면 남은 박자를 거둔다
    r = SKS.run('ux_spellbook', { at: { 9: function (sim, c) { c.tgt.hp = 1; sim.hurt(c.tgt, 1e7, null, {}); } } }); o.tgtDie = { beats: r.beats, end: r.seqEnd, pend: r.pend };
    return o;
  });
  A(c.die.beats < 3 && /cancel/.test(c.die.end) && !c.die.pend && !c.die.view.seq, 'caster dies mid-combo: remaining beats are cancelled (' + c.die.beats + '/3 landed), nothing left');
  A(c.dieFall.beats === 0 && c.dieFall.hits === 0 && /cancel/.test(c.dieFall.end) && !c.dieFall.tele, 'caster dies before a telegraphed strike lands: it is cancelled and the warning tiles are removed');
  A(c.dieZone.zticks >= 2 && c.dieZone.zticks < 6 && c.dieZone.zends === 1 && !c.dieZone.zleft && !c.dieZone.vz, 'caster dies while a zone stands: the zone ends (' + c.dieZone.zticks + ' pulses)');
  A(c.end.beats === 0 && !c.end.pend && /cancel/.test(c.end.end) && !c.end.tele && !c.endZone.zleft && c.endZone.zends === 1 && !c.endZone.vz, 'battle end: pending strike and standing zone are both cleared (engine and view)');
  A(c.out === 0 && c.inn === 1, 'telegraphed strike hits who stands there when it lands: moved out → ' + c.out + ' hits, one walked in → ' + c.inn);
  A(c.dz === 1 && c.dzAlly === 0 && c.dzAfter === 0, 'marked tiles are danger tiles for the side about to be hit, cleared once it lands');
  A(c.tgtDie.beats < 3 && /cancel/.test(c.tgtDie.end) && !c.tgtDie.pend, 'single-target combo: target dies → remaining beats cancelled (' + c.tgtDie.beats + '/3)');
  // ⑦ 결정적
  c = await ev(() => ['ux_skyfire', 'xinf_quake', 'ux_icejail', 'xmag_prism', 'u_three'].map(function (id) { var a = SKS.replay(id, 'ally'), b = SKS.replay(id, 'enemy'); return id + ':' + (a.same && b.same ? 'same' : 'DIFF') + ':' + a.n; }));
  A(c.every(x => /:same:/.test(x)), 'deterministic: the same staged cast gives byte-identical event logs (' + c.join(' ') + ')');
  // ⑧ 자동 전투: 새 기술을 고르고(값이 평타보다 낫다), 12초 싸워도 남는 것 없이
  c = await ev(() => {
    var out = {};
    ['mag_meteor', 'xmag_nova', 'xinf_quake', 'xmag_prism', 'u_icejail'].forEach(function (id) {
      SKS.stage(id, {}); var cu = SKS.cur, sim = cu.sim, u = cu.u; u.skills = [id]; u.mp = u.mmp = 999; u.gauge = 100; u.cd = {}; u.gcd = 0;
      var b = sim.bestSkill(u, cu.foes, [id], 0); out[id] = b ? Math.round(b.val) : 0;
    });
    SKS.stage('xmag_nova', {}); var c2 = SKS.cur, sim2 = c2.sim, n = 0, cast = {};
    sim2.units.forEach(function (u) { u.busy = 0; if (u.side === 'ally') { u.auto = true; u.mp = u.mmp = 999; } });
    c2.u.skills = ['xmag_nova', 'xmag_prism', 'xmag_bolt', 'mag_meteor', 'mag_frost']; sim2.byId.c2.skills = ['xinf_quake', 'xinf_bash', 'xinf_aegis', 'inf_wall']; sim2.byId.c2.cls = 'inf';
    c2.real = true;
    for (var i = 0; i < 240; i++) { sim2.acc = 0; sim2.tick(0.05); var evs = sim2.drain(); evs.forEach(function (e) { if (e.t === 'skill') { cast[e.sk] = (cast[e.sk] || 0) + 1; n++; } }); DS.G.view.rLast = performance.now() - 50; DS.G.view.frame(0.05, evs); sim2.units.forEach(function (u) { if (!u.dead && u.hp < u.mhp * 0.4) u.hp = u.mhp; }); }
    out.cast = cast; out.n = n; out.err = DS.skfx.stat.err;
    return out;
  });
  A(c.mag_meteor > 0 && c.xmag_nova > 0 && c.xinf_quake > 0 && c.xmag_prism > 0 && c.u_icejail > 0, 'AI values the redesigned skills (bestSkill): meteor ' + c.mag_meteor + ', nova ' + c.xmag_nova + ', quake ' + c.xinf_quake + ', prism ' + c.xmag_prism + ', icejail ' + c.u_icejail);
  A(c.n >= 4 && (c.cast.xmag_nova || c.cast.xmag_prism || c.cast.mag_meteor) && !c.err, 'auto battle 12s with the new kits: ' + JSON.stringify(c.cast) + ', no fx errors');
  await shot('skfx_auto');
  await ev(() => { DS.G.pause = false; DS.ui.closeAll(); DS.enterZone(DS.G.save.town); }); await L.sleep(600);
  A(await ev(() => !!DS.G.sim && DS.G.sim.mode === 'town' && DS.G.view.skfx.length === 0), 'back in town: scene change resets the fx lists');
};
