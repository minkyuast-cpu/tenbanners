// 전민 — 기술 표를 고친 뒤 값이 얼마나 달라졌는지 (머리 없이): 고친 기술마다 옛 표(DS.skfx.DEFS[id].was)와 새 표로 같은 무리를 쳐 피해 합 · 보호막 합을 견준다.
//   node tools/skdmg.js            허수아비(움직이지 않는 적 여섯)에게 — 박자 · 자리를 모두 받은 합
//   node tools/skdmg.js live [n]   살아 움직이는 적(붙어 싸우는 고블린 여섯)에게 n 번 — 예고 낙하 · 자리를 비켜서는 몫까지 든 평균
'use strict';
const D = require('./load.js')(), live = process.argv[2] === 'live', N = +process.argv[3] || 40;
const W = 17, H = 13, rows = []; for (let y = 0; y < H; y++) rows.push('.'.repeat(W));
function mk(id, cls, L, x, y) {
  const ch = { cls, L, id }, t = D.tierOfL(L); D.stdGear(ch, t); const st = D.charStats(ch), C = D.CLASSES[cls];
  return { id: 'c' + id, side: 'ally', role: 'cmd', cls, name: C.name, L, tier: t, look: [cls, t], hp: st.hp * 20, mhp: st.hp * 20, mp: 999, mmp: 999, atk: st.atk, def: st.def, mag: st.mag, res: st.res, spd: st.spd, mv: C.mv, mt: C.mt, rng: st.rng,
    atkKind: C.atk, dtype: C.dtype, kind: C.kind, tags: C.tags || [], basic: C.basic || 1, skills: [], crit: 0, enh: 0, hero: true, x, y, auto: true };
}
function clsOf(id) { const K = D.SKILLS[id]; if (K.cls) return [K.cls, 55]; if (K.up) return [K.up, 95]; for (const c in D.CLASSES) { if (D.CLASSES[c].master && !D.CLASSES[c].rise) continue; for (const s of D.CLASSES[c].skills || []) if (s[0] === id) return [D.CLASSES[c].rise || c, (s[1] - 1) * 10 + 5]; } return ['inf', 25]; }
function run(id, seed) {
  const K = D.SKILLS[id], [cls, L] = clsOf(id), self = K.tg === 'self', d = K.tg === 'dir' ? 1 : self ? 0 : Math.max(K.rng ? K.rng[0] : 1, Math.min(K.rng ? K.rng[1] : 1, 3));
  const cx = 6, cy = 6, tx = cx + d, units = [mk(1, cls, L, cx, cy), mk(2, 'pike', L, cx - 1, cy + 1), mk(3, 'mon', L, cx - 1, cy - 1)];
  const ring = self ? [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [1, 1]] : K.tg === 'dir' ? [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [4, 0]] : [[0, 0], [1, 0], [0, 1], [0, -1], [1, 1], [2, 0]];
  ring.forEach(p => { const e = D.enemySpec('goblin', L, { x: tx + p[0], y: cy + p[1] }); e.hp = e.mhp = e.mhp * 60; units.push(e); });
  const sim = new D.Sim({ map: rows, units, seed: seed || 7, inv: {}, mode: 'scn' }), u = sim.byId.c1, foes = sim.units.filter(v => v.side === 'enemy');
  sim.units.forEach(v => { v.aggro = v.side === 'enemy'; v.gauge = live ? 30 + (sim.rand() * 60 | 0) : 100; if (!live || v === u) v.busy = 1e9; });
  sim.combat = true; sim.hunt = true;
  if (live) for (let i = 0; i < 80; i++) { sim.tick(0.05); u.busy = 1e9; sim.units.forEach(v => { if (!v.dead && v.hp < v.mhp * 0.5) v.hp = v.mhp; }); }      // 4초: 우리 둘과 적 여섯이 붙어 싸우는 판 (쓰는 이는 서 있기만)
  let tgt = null; const fs = foes.filter(v => !v.dead);
  if (K.tg === 'enemy') tgt = fs.slice().sort((a, b) => D.fpDist(u, a) - D.fpDist(u, b)).filter(v => D.fpDist(u, v) >= (K.rng ? K.rng[0] : 1))[0] || fs[0];
  else if (K.tg === 'tile') { let bc = -1; fs.forEach(v => { const c = sim.victims(u, K, sim.areaTiles(u, K, v.x, v.y)).length; if (c > bc && D.fpDist(u, v) <= (K.rng ? K.rng[1] : 9)) { bc = c; tgt = { x: v.x, y: v.y }; } }); }
  else if (K.tg === 'dir') tgt = { x: u.x + 1, y: u.y }; else if (K.tg === 'ally') tgt = sim.byId.c2;
  sim.drain(); u.busy = 0; u.uc = 100; if (K.ult) u.ult = id; u.gauge = 100;
  const ok = sim.cast(u, id, tgt, true); u.busy = 1e9;
  let dmg = 0, hits = 0, shd = 0, gauge = 0; const g0 = foes.map(v => v.gauge);
  const eat = () => sim.drain().forEach(e => { if (e.t === 'hit' && e.by === 'c1' && e.type !== 'burn' && e.type !== 'poison') { dmg += e.v; hits++; } if (e.t === 'buff' && e.s === 'shd') shd += e.p; });
  eat();
  const T = Math.ceil(((K.fall ? K.fall.delay : 0) + (K.beats ? K.beats[K.beats.length - 1] : 0) + (K.zone ? K.zone.dur : 0) + 0.5) / 0.05);
  for (let i = 0; i < T; i++) { sim.tick(0.05); if (!live) sim.units.forEach(v => { v.busy = 1e9; }); else { u.busy = 1e9; sim.units.forEach(v => { if (!v.dead && v.hp < v.mhp * 0.5) v.hp = v.mhp; }); } eat(); }
  return { ok, dmg, hits, shd, left: sim.sq.length + sim.zn.length };
}
const ids = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(D.skfx.DEFS);
if (process.env.NODZ) ids.forEach(id => { if (D.SKILLS[id].fall) D.SKILLS[id].fall.dz = 0; });      // 견줌: 예고 칸을 붉은 칸으로 치지 않을 때
console.log((live ? 'live ×' + N : 'dummies') + '   id            old dmg(hits) → new dmg(hits)   ratio    shield old → new');
for (const id of ids) {
  const S = D.SKILLS[id], cur = JSON.parse(JSON.stringify(S)), was = D.skfx.DEFS[id].was, a = { dmg: 0, hits: 0, shd: 0 }, b = { dmg: 0, hits: 0, shd: 0 }, n = live ? N : 1;
  const set = (o) => { for (const k of ['eff', 'beats', 'fall', 'zone']) { if (o[k] === undefined) delete S[k]; else S[k] = JSON.parse(JSON.stringify(o[k])); } };
  for (let i = 0; i < n; i++) { set(was); const r = run(id, 11 + i); a.dmg += r.dmg; a.hits += r.hits; a.shd += r.shd; set(cur); const q = run(id, 11 + i); b.dmg += q.dmg; b.hits += q.hits; b.shd += q.shd; if (q.left) console.log('  !! ' + id + ' left pending ' + q.left); }
  console.log(id.padEnd(14) + String(Math.round(a.dmg / n)).padStart(7) + '(' + (a.hits / n).toFixed(1) + ') → ' + String(Math.round(b.dmg / n)).padStart(7) + '(' + (b.hits / n).toFixed(1) + ')   ' + (a.dmg ? (b.dmg / a.dmg).toFixed(2) : '  - ') + '    ' + Math.round(a.shd / n) + ' → ' + Math.round(b.shd / n));
}
