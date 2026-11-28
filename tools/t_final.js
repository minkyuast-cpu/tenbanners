// 전민 2.9 — 30번 마지막 싸움 (다섯 막) 화면 시험
//   H=844 OUT=<폴더> PAGE=<dist/test.html> node tools/shot.js tools/t_final.js
// ① 센 부대로 30번 → 먼동이 깨어나면 첫 막의 띠 · 막 표시 · 사슬
// ② 막마다 체력을 문턱까지 내려 넘긴다 (DS.finSkip): 띠의 이름과 말 · 그 막의 유닛 · 자리 · 예고가 엔진에 있다
//    ② 문이 열린다: 먼동이 맞지 않는다(veil) · 어스름이 쏟아진다 · 땅의 손(예고 낙하) / ③ 왕(2×4) · 멸망의 줄(붉은 줄)
//    ④ 밤: 검은 땅(남는 자리) · 별비(예고 낙하) · 옮겨 설 자리의 표식 · 비켜 설 칸이 남는다 / ⑤ 먼동이 우리 편 · 초 세기 · 새벽 방패 · 터짐
// ③ 왕을 쓰러뜨리면 동이 트고, 결과 창을 닫으면 원래 엔딩 무대로 이어진다
// ④ 이름 지우기의 흔적이 없다 (띠 · 사건 · 표) · 움직임 줄이기에서도 막이 넘어간다 · 글에 undefined · NaN 이 없다 · 390 폭에 가로 넘침 없음
'use strict';
module.exports = async function (page, shot, L) {
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const A = (ok, msg) => { console.log((ok ? 'ok  ' : 'FAIL ') + msg); if (!ok) throw new Error(msg); };
  const sleep = L.sleep;
  const until = async (fn, ms, arg) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 6000)) { const r = await ev(fn, arg); if (r) return r; await sleep(150); } return null; };
  await L.newGame(page, { cls: 'inf', name: '새벽' });
  await L.edit(page, function () {
    DS.houseOpenN(s, 9); DS.mercTidy(s); for (var id = 1; id <= 29; id++) s.cleared[id] = 1; s.crest = true;
    DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 95; b.exp = 0; } }); DS.mercTidy(s); DS.pSync(s);
    s.opt.cine = 'full'; s.opt.speed = 1; s.opt.calm = false; s.items.herb = 20;
  });
  await L.closeAll(page);
  // 모든 사건을 적어 둔다 (지우기 사건이 없는지 · 막 사건의 차례)
  const startFin = async () => {
    await ev(() => {
      DS.G.quiet = true; DS.ui.closeAll(); if (DS.G.save.cleared[30]) delete DS.G.save.cleared[30];
      DS.startScenario(DS.scn(30)); var sim = DS.G.sim; window.__ev = []; var e0 = sim.emit; sim.emit = function (e) { window.__ev.push(e.t); return e0.call(this, e); };
      sim.hunt = true; DS.G.pause = true;
    });
    await sleep(900); await L.skipStory(page, 30); await ev(() => DS.ui.closeAll());
    await ev(() => { DS.G.pause = false; DS.G.quiet = false; });
  };
  await startFin();
  let c = await ev(() => { var sim = DS.G.sim, F = sim.fin, h = F && sim.byId[F.hid]; return { fin: !!F, ph: F && F.ph, h: h && h.name, leash: h && h.leash, map: sim.w + 'x' + sim.h, row1: DS.FINAL_MAP[1], posts: sim.units.filter(function (u) { return u.side === 'enemy' && /^g\d/.test(u.grp); }).length, erase: typeof DS.ERASE, eraseTxt: typeof DS.ERASE_TXT, band: !!document.querySelector('#erase') }; });
  A(c.fin && c.ph === 1 && c.h === '어스름에 묶인 먼동' && c.leash && c.leash.r === 3 && c.map === '13x20', 'scenario 30 builds the five-act fight: 먼동 tethered to the gate (r ' + (c.leash && c.leash.r) + '), arena ' + c.map + ', gate row 「' + c.row1 + '」, ' + c.posts + ' post foes on the approach');
  A(c.erase === 'undefined' && c.eraseTxt === 'undefined' && !c.band, 'no name-erase table, text table or band exists any more');
  // ① 첫 막: 먼동이 깨어난다
  await ev(() => { var sim = DS.G.sim, h = sim.byId[sim.fin.hid]; sim.units.forEach(function (u) { if (u.side === 'enemy' && /^g\d/.test(u.grp) && !u.dead) sim.kill(u, null); }); DS.G.view.focus = h.id; sim.rouse(h); });
  c = await until(() => { var b = document.querySelector('#finband'); return b ? { t: b.querySelector('.fbt').textContent, e: b.querySelector('.fbe b').textContent, q: [].map.call(b.querySelectorAll('.fbq'), function (p) { return p.textContent; }), pips: document.querySelectorAll('#boss .finph i').length, mk: document.querySelectorAll('#boss .finmk').length, hold: DS.G.hold } : null; }, 5000);
  await sleep(1100); await shot('p1_band');
  A(c && c.t === '묶인 먼동' && c.e === '1막' && c.q.length === 2 && c.pips === 5 && c.mk === 1 && c.hold > 0, 'act 1 band: 「' + (c && c.e) + ' ' + (c && c.t) + '」 · lines ' + JSON.stringify(c && c.q) + ' · boss bar has 5 act pips and the 50% mark · battle held');
  c = await until(() => !document.querySelector('#finband') && DS.G.hold === 0, 5000);
  A(!!c, 'the band closes by itself and the battle runs again');
  await sleep(2200); await shot('p1_chains');
  c = await ev(() => { var sim = DS.G.sim, h = sim.byId[sim.fin.hid]; return { chain: h.chain, d: Math.abs(h.x - 6) + Math.abs(h.y - 1), q: (document.querySelector('#quest') || {}).textContent || '' }; });
  A(c.chain === 3 && c.d <= 3 && /1막/.test(c.q), 'three chains, 먼동 stays within the leash (distance ' + c.d + '), quest line 「' + c.q + '」');
  // ② 문이 열린다
  await ev(() => { DS.finSkip(DS.G.sim, 2); });
  c = await until(() => { var b = document.querySelector('#finband'); return b ? { t: b.querySelector('.fbt').textContent, s: (b.querySelector('.fbs') || {}).textContent } : null; }, 3000);
  await sleep(1300); await shot('p2_band');
  A(c && c.t === '문이 열린다', 'act 2 band 「' + (c && c.t) + '」 · ' + (c && c.s));
  await ev(() => DS.finBandSkip());
  c = await ev(() => { var sim = DS.G.sim, F = sim.fin, h = sim.byId[F.hid]; sim.hurt(h, 999999, null, {}); return { ph: F.ph, veil: !!h.veil, alive: !h.dead, hp: h.hp, x: h.x, y: h.y, chain: h.chain, plan: F.plan, q: F.q.length }; });
  A(c.ph === 2 && c.veil && c.alive && c.chain === 2 && c.plan >= 12, 'act 2: 먼동 kneels at the gate (' + c.x + ',' + c.y + '), cannot be hit (a huge blow leaves him alive), one chain broke, ' + c.plan + ' dusk foes queued');
  c = await until(() => { var F = DS.G.sim.fin; return F.made >= 4 && F.n.hand >= 1 ? { made: F.made, hand: F.n.hand, sq: DS.G.sim.sq.filter(function (q) { return q.sk === 'fin_hand'; }).length } : null; }, 12000);
  await shot('p2_adds');
  A(c && c.made >= 4 && c.hand >= 1, 'dusk pours from both sides (' + (c && c.made) + ' so far) and the hands rise as telegraphed strikes (' + (c && c.hand) + ' casts)');
  // ③ 어스름의 왕
  await ev(() => { DS.finSkip(DS.G.sim, 3); });
  c = await until(() => { var b = document.querySelector('#finband'), sim = DS.G.sim, F = sim.fin, k = F.kid && sim.byId[F.kid]; return b && k ? { t: b.querySelector('.fbt').textContent, q: [].map.call(b.querySelectorAll('.fbq'), function (p) { return p.textContent; }), k: k.name, fw: k.fw, fh: k.fh, boss: (document.querySelector('#boss b') || {}).textContent, enr: !!k.enr, sk: k.skills.join(',') } : null; }, 3000);
  await sleep(1300); await shot('p3_band');
  A(c && c.t === '어스름의 왕' && c.k === '어스름의 왕' && c.fw === 2 && c.fh === 4 && c.boss === '어스름의 왕' && !c.enr && /fin_breath/.test(c.sk) && /fin_sum/.test(c.sk), 'act 3: the king walks out (2×4), boss bar switches, skills ' + (c && c.sk));
  await ev(() => DS.finBandSkip());
  await ev(() => { var sim = DS.G.sim, F = sim.fin; F.at.judge = sim.t; F.last = -99; var k = sim.byId[F.kid]; k.casting = null; DS.G.view.focus = k.id; });
  c = await until(() => { var T = DS.G.sim.tele.filter(function (t) { return t.sk === 'fin_judge'; })[0]; if (!T) return null; var rows = {}; T.tiles.forEach(function (t) { rows[t[1]] = (rows[t[1]] || 0) + 1; }); return { rows: rows, n: T.tiles.length, view: Object.keys(DS.G.view.tele).length }; }, 5000);
  await sleep(700); await shot('p3_judge');
  A(c && Object.keys(c.rows).length >= 1 && c.n >= 8 && c.view >= 1, 'judgement lines are telegraphed across whole rows ' + JSON.stringify(c && c.rows) + ' (red tiles on screen)');
  // ④ 밤이 내린다
  await sleep(2600);
  await ev(() => { DS.finSkip(DS.G.sim, 4); });
  c = await until(() => { var b = document.querySelector('#finband'); return b ? b.querySelector('.fbt').textContent : null; }, 3000);
  await sleep(1300); await shot('p4_band');
  A(c === '밤이 내린다', 'act 4 band 「' + c + '」');
  await ev(() => DS.finBandSkip());
  await ev(() => { var sim = DS.G.sim, F = sim.fin, k = sim.byId[F.kid]; k.casting = null; sim.tele = sim.tele.filter(function (t) { return t.u !== k; }); F.at.zone = sim.t; F.at.rain = sim.t; F.at.tp = sim.t + 9; F.last = -99; });
  await sleep(500);
  await ev(() => { var sim = DS.G.sim, F = sim.fin, k = sim.byId[F.kid]; k.casting = null; F.at.zone = sim.t; F.last = -99; F.at.rain = sim.t; });
  c = await until(() => { var sim = DS.G.sim, F = sim.fin; var zn = sim.zn.filter(function (z) { return /^fin_dusk/.test(z.sk); }), rn = sim.sq.filter(function (q) { return q.sk === 'fin_rain'; }); return zn.length && rn.length ? { zones: zn.length, ztiles: zn.reduce(function (a, z) { return a + z.tiles.length; }, 0), rain: rn[0].tiles.length } : null; }, 6000);
  await sleep(500); await shot('p4_night');
  A(c && c.zones >= 1 && c.rain >= 1, 'the night: ' + (c && c.zones) + ' dusk zone(s) (' + (c && c.ztiles) + ' tiles) spread on the floor and a black star rain is marked (' + (c && c.rain) + ' tiles)');
  c = await ev(() => { var sim = DS.G.sim, F = sim.fin, k = sim.byId[F.kid], dz = sim.dz.ally, safe = 0, all = 0; for (var y = 2; y <= 9; y++) for (var x = 1; x <= 11; x++) { if (!sim.pass('foot', x, y)) continue; if (x >= k.x && x < k.x + k.fw && y >= k.y && y < k.y + k.fh) continue; all++; if (!dz[y * sim.w + x]) safe++; } return { safe: safe, all: all }; });
  A(c.safe >= c.all * 0.5, 'safe tiles remain in the arena (' + c.safe + ' of ' + c.all + ' have no danger)');
  await ev(() => { var sim = DS.G.sim, F = sim.fin, k = sim.byId[F.kid]; k.casting = null; sim.tele = sim.tele.filter(function (t) { return t.u !== k; }); F.tp = null; F.at.tp = sim.t; F.last = -99; });
  c = await until(() => { var F = DS.G.sim.fin, S = DS.finState(); return F.tp ? { x: F.tp.x, y: F.tp.y } : null; }, 5000);
  await sleep(500); await shot('p4_tp_mark');
  const kx0 = await ev(() => { var k = DS.G.sim.byId[DS.G.sim.fin.kid]; return [k.x, k.y]; });
  const tpd = await until(() => { var F = DS.G.sim.fin; return F.n.tp >= 1 ? 1 : null; }, 5000);
  const kx1 = await ev(() => { var k = DS.G.sim.byId[DS.G.sim.fin.kid]; return [k.x, k.y]; });
  A(c && tpd && (kx1[0] !== kx0[0] || kx1[1] !== kx0[1]), 'the king marks a corner first (' + JSON.stringify(c) + '), then moves there: ' + kx0 + ' → ' + kx1);
  // ⑤ 마지막 새벽
  await ev(() => { DS.finSkip(DS.G.sim, 5); });
  c = await until(() => { var b = document.querySelector('#finband'), sim = DS.G.sim, F = sim.fin, d = F.did && sim.byId[F.did]; return b && d ? { t: b.querySelector('.fbt').textContent, q: [].map.call(b.querySelectorAll('.fbq'), function (p) { return p.textContent; }), side: d.side, name: d.name, role: d.role, owner: !!sim.byId[d.owner], zones: sim.zn.filter(function (z) { return /^fin_dusk/.test(z.sk); }).length } : null; }, 3000);
  await sleep(1300); await shot('p5_band');
  A(c && c.t === '마지막 새벽' && c.side === 'ally' && c.name === '먼동' && c.role === 'summon' && c.owner && c.zones === 0, 'act 5: 먼동 stands up on our side (' + (c && c.name) + ', ' + (c && c.side) + '), the dawn clears the dusk zones; lines ' + JSON.stringify(c && c.q));
  await ev(() => DS.finBandSkip());
  c = await until(() => { var el = document.querySelector('#fincount.on'), k = DS.G.sim.byId[DS.G.sim.fin.kid]; return el && k.casting ? { n: +el.querySelector('b').textContent, t: el.innerText.replace(/\n/g, ' / '), boss: (document.querySelector('#boss em') || {}).textContent } : null; }, 6000);
  await sleep(400); await shot('p5_count');
  A(c && c.n >= 8 && /마지막 어스름/.test(c.t), 'the last stand counts down on screen: 「' + (c && c.t) + '」 (king channels, boss bar 「' + (c && c.boss) + '」)');
  await ev(() => { var sim = DS.G.sim, F = sim.fin; F.cnt.end = sim.t + 2.6; sim.units.forEach(function (u) { if (u.side === 'ally' && !u.dead) u.hp = u.mhp; }); });
  c = await until(() => { var F = DS.G.sim.fin; return F.n.ward >= 1 ? DS.G.sim.units.filter(function (u) { return u.side === 'ally' && !u.dead && u.buffs.shd; }).length : null; }, 4000);
  await sleep(300); await shot('p5_ward');
  A(c >= 3, '먼동 raises the dawn shield on everyone just before it lands (' + c + ' shielded)');
  c = await until(() => { var F = DS.G.sim.fin, sim = DS.G.sim; return F.n.blast >= 1 ? { dead: sim.units.filter(function (u) { return u.side === 'ally' && u.role === 'cmd' && u.dead; }).length, low: Math.min.apply(null, sim.units.filter(function (u) { return u.side === 'ally' && !u.dead && u.role === 'cmd'; }).map(function (u) { return u.hp / u.mhp; })), cnt: !!document.querySelector('#fincount.on') } : null; }, 4000);
  await sleep(250); await shot('p5_blast');
  A(c && c.dead === 0 && c.low > 0.3 && !c.cnt, 'the blast lands hard but a healthy party stands (lowest 가주 at ' + (c && Math.round(c.low * 100)) + '%), the counter is gone');
  // 동이 튼다 → 결과 → 엔딩 무대
  await ev(() => { var sim = DS.G.sim, k = sim.byId[sim.fin.kid]; DS.G.quiet = true; sim.hurt(k, k.hp + 10, null, {}); });
  c = await until(() => { var S = DS.finState(), sim = DS.G.sim; return S && S.dawn && sim.result === 'win' ? { ph: sim.fin.ph, log: sim.fin.log } : null; }, 4000);
  await sleep(1300); await shot('dawn');
  A(c && c.ph === 6, 'the king falls: dawn breaks and the battle is won (acts ' + JSON.stringify(c && c.log) + ')');
  const evs = await ev(() => window.__ev);
  A(!evs.some(t => /erase/.test(t)) && ['finPhase', 'finAdd', 'finCount', 'finWard', 'finBlast', 'finJoin', 'finDawn'].every(t => evs.indexOf(t) >= 0), 'events: every act event fired, no erase events (' + evs.filter(t => /^fin/.test(t)).filter((t, i, a) => a.indexOf(t) === i).join(' ') + ')');
  await until(() => !!document.querySelector('.ov.story'), 9000);
  await L.skipStory(page);
  await until(() => !!document.querySelector('.ov.res26 .rfoot .btn.gold'), 9000);
  for (let i = 0; i < 6 && (await ev(() => !!document.querySelector('.ov.chov'))); i++) { await page.click('.ov.chov [data-ch="a"]').catch(() => {}); await sleep(500); }
  await shot('result');
  await ev(() => { DS.G.quiet = false; });
  await page.click('.ov.res26 .rfoot .btn.gold');
  c = await until(() => { var o = document.querySelector('.ov.story.stg-end'); return o ? o.innerText.replace(/\n+/g, ' / ').slice(0, 160) : null; }, 8000);
  await sleep(900); await shot('ending');
  A(c && /먼동이 텄다/.test(c) && !/undefined|NaN|\{/.test(c), 'closing the result opens the ending stage: ' + c);
  for (let i = 0; i < 80 && (await ev(() => !!document.querySelector('.ov.story'))); i++) { await page.click('.ov.story', { position: { x: 195, y: 500 } }).catch(() => {}); await sleep(220); }
  await ev(() => { DS.G.quiet = true; }); await L.settle(page, 20000); await L.closeAll(page);
  // ④ 움직임 줄이기: 막 넘김이 짧고 움직이지 않는다
  await L.edit(page, function () { s.opt.calm = true; DS.applyCalm(); });
  await startFin();
  await ev(() => { DS.G.quiet = false; var sim = DS.G.sim; sim.units.forEach(function (u) { if (u.side === 'enemy' && /^g\d/.test(u.grp) && !u.dead) sim.kill(u, null); }); DS.finSkip(sim, 4); });
  c = await until(() => { var b = document.querySelector('#finband'); return b ? { calm: b.classList.contains('calm'), t: b.querySelector('.fbt').textContent, n: b.querySelectorAll('.fbq').length, html: document.documentElement.classList.contains('calm') } : null; }, 3000);
  const tc0 = Date.now();
  await shot('calm_band');
  const closed = await until(() => !document.querySelector('#finband'), 4000);
  A(c && c.calm && c.html && c.n <= 1 && closed && Date.now() - tc0 < 2600, 'calm mode: a still, short band (' + (c && c.t) + ', ' + (c && c.n) + ' line, closed in ' + (Date.now() - tc0) + ' ms)');
  await sleep(1500); await shot('calm_night');
  const bad = await L.badText(page, '#s-game');
  A(!bad.length, 'no undefined / NaN on the battle screen' + (bad.length ? ' ' + bad.join(' | ') : ''));
  c = await ev(() => document.documentElement.scrollWidth);
  A(c <= 390, 'no horizontal scroll at 390 px (' + c + ')');
  await ev(() => { if (DS.G.sim && !DS.G.sim.result) DS.G.sim.win(); });
};
