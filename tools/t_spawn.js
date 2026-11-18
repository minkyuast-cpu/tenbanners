// 머리 없는 시험: 모든 시나리오(1~30 · 갱도 1~10)의 출발 칸과 모든 들판·마을 입구에 아군 16명이 다 서는가. node tools/t_spawn.js
'use strict';
const D = require('./load.js')();
const s = D.newSave('칸', 'inf');
for (let id = 1; id <= 13; id++) D.applyClear(s, D.scn(id));
D.charList(s).forEach(c => { const b = c.id === s.hero ? c.ps : D.bearer(s, c); if (b) b.L = 50; });
for (let i = 0; i < 6; i++) { const m = D.addMerc(s, 'm_sword', 3, s.hero); m.kn = 1; m.L = 40; }
D.mercTidy(s); D.pSync(s);
const specs = () => D.partySpecs(s).map(u => Object.assign({}, u));
let bad = 0, n0 = specs().length;
const list = D.SCENARIOS.slice().concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(f => D.pit(f)));
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
console.log(bad ? 'FAIL ' + bad : 'PASS spawn: ' + n0 + ' allies on ' + list.length + ' scenario maps and ' + Object.keys(D.ZONES).length + ' zones');
process.exit(bad ? 1 : 0);
