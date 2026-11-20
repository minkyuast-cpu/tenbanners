// 머리 없는 시험: 모든 시나리오(1~30 · 갱도 1~14 · 25 · 50 · 500 — 2.2.3 끝없는 층은 네 틀을 돌려 쓴다)의 출발 칸과 모든 들판·마을 입구에 아군 16명이 다 서는가. node tools/t_spawn.js
//   2.2.8: 가주는 셋만 나가니 16명 = 맹주 + 가주 둘 + 가문원 열셋. 기습은 물결 없이 한 번에 — 모든 들판에서 그 수가 걸어서 닿는 빈 칸에 겹치지 않고 다 선다
'use strict';
const D = require('./load.js')();
const s = D.newSave('칸', 'inf');
for (let id = 1; id <= 13; id++) D.applyClear(s, D.scn(id));
D.houseOpenN(s, 9);
D.charList(s).forEach(c => { const b = c.id === s.hero ? c.ps : D.bearer(s, c); if (b) b.L = 50; });
for (let i = 0; i < 13; i++) { const m = D.addMerc(s, 'm_sword', 3, s.hero); m.kn = 1; m.L = 40; }
D.mercTidy(s); D.pSync(s);
const specs = () => D.partySpecs(s).map(u => Object.assign({}, u));
let bad = 0, n0 = specs().length;
const list = D.SCENARIOS.slice().concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 50, 500].map(f => D.pit(f)));
list.forEach(sc => {
  const b = D.buildScenario(sc, n0, 'inf'), sim = new D.Sim({ map: b.map, units: b.units, mk: b.mk, objective: b.objective, waves: b.waves, seed: 3, inv: {}, mode: 'scn' });
  const sp = specs(), pos = D.formation(sp, b.start); let ok = 0, far = 0;
  sp.forEach((u, i) => { u.x = pos[i][0]; u.y = pos[i][1]; const nu = sim.add(u); if (nu) { ok++; if (nu.y < 14) far++; } });
  if (ok !== sp.length || far) { bad++; console.log('scenario', sc.pit ? 'pit' + sc.pit : sc.id, 'placed', ok, '/', sp.length, 'far', far); }
});
Object.keys(D.ZONES).forEach(zid => {
  const z = D.buildZone(zid), e = D.zoneEntry(z, null), sim = new D.Sim({ map: z.rows, mode: z.town ? 'town' : 'zone', spawns: [], seed: 3, inv: {} });
  const sp = specs(); let ok = 0; sp.forEach(u => { u.x = e.x; u.y = e.y; if (sim.add(u)) ok++; });
  if (ok !== sp.length) { bad++; console.log('zone', zid, 'placed', ok, '/', sp.length); }
});
if (n0 !== 16 || D.partyIds(s).length !== 3) { bad++; console.log('expected 16 allies with 3 houses, got', n0, D.partyIds(s).length); }
// 2.2.8 기습: 한 번에 모두 — 셋 + 가문원 셋(작은 부대) · 셋 + 열셋(큰 부대), 들판마다
let ambN = 0;
[3, 13].forEach(nk => {
  while (D.mercsOf(s, s.hero).length > nk) D.loseMerc(s, D.mercsOf(s, s.hero)[0].id);
  D.mercTidy(s);
  Object.keys(D.ZONES).forEach(zid => {
    const z = D.buildZone(zid); if (z.town) return;
    const sim = new D.Sim({ map: z.rows, mode: 'zone', spawns: [], seed: 7, inv: {}, mk: (t, o) => D.fieldSpec(t, o.L, { x: o.x, y: o.y, grp: o.grp, zone: zid, save: s }) });
    const e = D.zoneEntry(z, null); specs().forEach(u => { u.x = e.x; u.y = e.y; sim.add(u); }); sim.leader = sim.cmds()[0].id;
    const lead = sim.byId[sim.leader], reach = {}; sim.flood(lead, 60, 1).forEach(j => { reach[j] = 1; });
    D.fieldEnter(sim, z, s, { bot: true }); const why = D.fieldForce('ambush', sim), A = sim.fld && sim.fld.amb;
    for (let t = 0; t < 4 && A && A.w === 0; t += 0.25) sim.update(0.25);
    const en = sim.units.filter(u => u.side === 'enemy' && u.fa), seen = {}; let dup = 0, off = 0;
    en.forEach(u => { const k = u.y * sim.w + u.x; if (seen[k]) dup++; seen[k] = 1; if (!reach[k]) off++; });
    if (why || !A || A.sizes.length !== 1 || A.w !== 1 || en.length !== A.sizes[0] || dup || off) { bad++; console.log('ambush', zid, 'kin', nk, why, A && A.sizes, 'wave', A && A.w, 'spawned', en.length, 'dup', dup, 'unreachable', off); }
    ambN += en.length;
  });
});
console.log(bad ? 'FAIL ' + bad : 'PASS spawn: ' + n0 + ' allies on ' + list.length + ' scenario maps and ' + Object.keys(D.ZONES).length + ' zones; ambushes arrive in one go (' + ambN + ' mobs over 2 party sizes)');
process.exit(bad ? 1 : 0);
