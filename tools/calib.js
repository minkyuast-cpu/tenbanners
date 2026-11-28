// 전민 — 난이도 재기 (2.2.3): 봇이 실제로 그 자리에 닿았을 때의 부대(가문 수 · 장비 · 막사 그대로)로, 레벨만 옮겨 가며 진짜 엔진에서 싸워 본다.
//   재료: BOTSNAP=폴더 node tools/bot.js <병과> <씨앗> 이 남긴 「시나리오 N 직전의 판」 (<병과>_<씨앗>_<N>.json)
//   node tools/calib.js scn  <폴더> <N> [시도=8] [옮김=-16,-12,...]   → 줄마다 {k:'scn', n, cls, seed, d, L, win, dead, t}
//   node tools/calib.js zone <폴더> <지역> <lo|hi> [시도=8] [레벨들]   → 그 지역의 가장 약한(lo)·센(hi) 무리와. 레벨마다 가장 가까운 판을 골라 옮긴다
//   node tools/calib.js pit  <폴더> <층> [시도=8] [레벨들]              → 갱도 층 (DS.pit)
//   node tools/calib.js at   <폴더> <N> [시도=10] [레벨=권장]           → 2.2.7: 판마다 부대 평균을 그 레벨로 옮겨 (권장 확인 — 열에 여덟 이기고 아무도 안 쓰러지는가)
//   node tools/calib.js sum  <결과 파일…>                             → 시나리오·지역·층마다 80% · 50% 레벨 (단조로 다듬기 전의 날것)
// 레벨 옮기기: 모든 사람의 개인 레벨 + d (1 ~ 상한 · 합일한 이는 100). 단이 바뀌면 기술도 그 단의 것.
'use strict';
const fs = require('fs'), path = require('path');
const D = require('./load.js')();
D.BAL.ultAuto = true;
const STEP = 0.5, PACKS = +(process.env.PACKS || 2);
function rng(seed) { let rs = seed >>> 0; return () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ rs >>> 15, 1 | rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function snaps(dir) { return fs.readdirSync(dir).filter(f => /^[a-z]+_\d+_\d+\.json$/.test(f)).map(f => { const m = /^([a-z]+)_(\d+)_(\d+)\.json$/.exec(f); return { f: path.join(dir, f), cls: m[1], seed: +m[2], n: +m[3] }; }); }
function load(f) { const s = JSON.parse(fs.readFileSync(f, 'utf8')); D.pSync(s); D.mercTidy(s); D.pSync(s); return s; }
function shift(s, d) {
  if (d) D.persons(s).forEach(p => { const w = p.who, cap = D.pCap(w); w.L = Math.max(1, Math.min(w.fz ? 100 : cap, Math.round(+w.L || 1) + d)); w.exp = 0; });
  (s.mercs || []).forEach(m => { if (d && !D.persons(s).some(p => p.who === m)) { m.L = Math.max(1, Math.min(m.fz ? 100 : 70, (+m.L || 1) + d)); m.exp = 0; } });
  D.pSync(s);
  D.charList(s).forEach(c => { if (!c.down) { c.hp = 1; c.mp = 1; } }); (s.mercs || []).forEach(m => { m.hp = 1; });
  s.items = s.items || {}; s.items.herb = Math.max(5, s.items.herb || 0);
  return D.partyL(s);
}
// 단 전용 시나리오(21~30): 다 같이 내리면 들어가지도 못한다 — 가장 높은 셋(합일한 셋)은 그 단의 첫 레벨 밑으로 내리지 않는다 (봇이 합일한 셋을 앞세워 들어가듯)
function keepTier(s, tier) {
  if (!(tier > D.partyTier(s))) return;
  const floor = (tier - 1) * 10 + 1, ps = D.persons(s).filter(p => p.dep).sort((a, b) => (b.who.fz ? 1 : 0) - (a.who.fz ? 1 : 0) || b.who.L - a.who.L).slice(0, 3);
  ps.forEach(p => { if (p.who.L < floor) { p.who.L = floor; if (floor > 70) p.who.fz = 1; } });
  D.pSync(s);
}
function run(sim, mode, maxT) {
  let res = null, quiet = 0, dead = 0, cmdDead = 0; const born = sim.t;
  while (!res) {
    sim.update(STEP);
    for (const e of sim.drain()) {
      if (e.t === 'die') { const u = sim.byId[e.id]; if (u && u.side === 'ally' && !e.flee && (u.role === 'cmd' || u.role === 'merc')) { dead++; if (u.role === 'cmd') cmdDead++; } }
      else if (e.t === 'win') res = 'win'; else if (e.t === 'lose') res = 'lose';
    }
    if (sim.result) res = sim.result;
    if (mode === 'zone' && !res) {
      if (!sim.units.some(u => !u.dead && u.side === 'enemy')) res = 'win';
      if (!sim.units.some(u => !u.dead && u.side === 'ally' && u.role === 'cmd')) res = 'lose';
      if (!sim.combat) quiet += STEP; else quiet = 0;
      if (quiet > 12 && sim.t - born > 15) res = 'end';      // 붙지 못하고 끝났다 (이긴 것으로 치지 않는다)
    }
    if (sim.t - born > maxT) res = res || 'end';
  }
  return { r: res, dead, cmdDead, t: Math.round(sim.t - born) };
}
function place(sim, specs, starts, x, y) {
  const pos = starts ? D.formation(specs, starts) : null; let first = null;
  specs.forEach((u, i) => { const p = pos ? pos[i] : [x, y]; u.x = p[0]; u.y = p[1]; u.auto = true; const nu = sim.add(u); if (nu && nu.role === 'cmd' && !first) first = nu; });
  sim.leader = first && first.id; sim.hunt = true;
}
function fightScn(s, sc, seed) {
  Math.random = rng(seed * 7919 + 13);
  const b = D.buildScenario(sc, D.partySpecs(s).length, s.chars[s.hero] ? s.chars[s.hero].cls : 'inf');
  const sim = new D.Sim({ map: b.map, units: b.units, mk: b.mk, objective: b.objective, waves: b.waves, seed: seed * 131 + (sc.id || 0), inv: s.items, mode: 'scn' });
  sim.heroId = 'c' + s.hero;
  place(sim, D.partySpecs(s), b.start);
  return run(sim, 'scn', 900);
}
const zc = {};
function fightZone(s, zid, side, seed) {
  Math.random = rng(seed * 104729 + 7);
  const z = zc[zid] || (zc[zid] = D.buildZone(zid)), Ls = z.spawns.map(g => g.L), tgt = side === 'hi' ? Math.max.apply(null, Ls) : Math.min.apply(null, Ls);
  const gs = z.spawns.filter(g => Math.abs(g.L - tgt) <= 1), g = gs[seed % gs.length], n = D.partySpecs(s).length;
  const two = [D.packOf(g, n)];      // 두 무리를 한꺼번에 (자동 사냥이 이웃 무리를 함께 끌어오는 들판의 실제 위험) — 둘째 무리는 첫 무리 곁에 세운다
  if (PACKS > 1) { const g2 = z.spawns.filter(q => q !== g).sort((a, b) => Math.abs(a.L - tgt) - Math.abs(b.L - tgt) || (Math.abs(a.x - g.x) + Math.abs(a.y - g.y)) - (Math.abs(b.x - g.x) + Math.abs(b.y - g.y)))[0]; if (g2) { const q = D.packOf(g2, n); q.id = g2.id + '_b'; q.x = g.x; q.y = g.y; q.L = g2.L; two.push(q); } }
  const sim = new D.Sim({ map: z.rows, mode: 'zone', spawns: two, seed: seed * 977 + 1, inv: s.items,
    mk: (type, o) => (D.fieldSpec ? D.fieldSpec(type, o.L, { x: o.x, y: o.y, grp: o.grp, zone: zid, save: s }) : D.enemySpec(type, o.L, { x: o.x, y: o.y, grp: o.grp, diff: 0.72, zone: zid, save: s })) });
  const p = sim.freeNear(g.x, Math.min(z.h - 2, g.y + 5), 'foot', 8) || sim.freeNear(g.x, g.y, 'foot', 10) || { x: g.x, y: g.y };
  place(sim, D.partySpecs(s), null, p.x, p.y);
  const r = run(sim, 'zone', 150); r.packL = g.L; return r;
}
function nearest(list, L) {      // 병과마다 그 레벨에 가장 가까이 닿은 판 하나씩
  const by = {}; list.forEach(x => { const d = Math.abs(x.L - L); if (!by[x.cls] || d < by[x.cls].dd || (d === by[x.cls].dd && x.n < by[x.cls].n)) by[x.cls] = Object.assign({ dd: d }, x); });
  return Object.values(by);
}
function partyLOf(f) { const s = load(f); return D.partyL(s); }
const mode = process.argv[2];
if (mode === 'scn') {
  const dir = process.argv[3], n = +process.argv[4], K = +(process.argv[5] || 8), offs = (process.argv[6] || '-16,-12,-9,-6,-4,-2,0,2,4').split(',').map(Number);
  const sc = D.scn(n);
  snaps(dir).filter(x => x.n === n).forEach(x => {
    offs.forEach(d => {
      for (let k = 0; k < K; k++) {
        const s = load(x.f); shift(s, d); keepTier(s, sc.tier); const L = D.partyL(s);
        if (sc.tier > D.partyTier(s)) { console.log(JSON.stringify({ k: 'scn', n, cls: x.cls, seed: x.seed, d, L, skip: 'tier' })); break; }
        const r = fightScn(s, sc, x.seed * 1000 + k + 1);
        console.log(JSON.stringify({ k: 'scn', n, cls: x.cls, seed: x.seed, d, L, win: r.r === 'win' ? 1 : 0, dead: r.dead, cd: r.cmdDead, t: r.t, u: D.partySpecs(s).length }));
      }
    });
  });
} else if (mode === 'zone' || mode === 'pit') {
  const dir = process.argv[3], all = snaps(dir).map(x => Object.assign(x, { L: partyLOf(x.f) }));
  let zid, side, K, Lv, floor;
  if (mode === 'zone') { zid = process.argv[4]; side = process.argv[5]; K = +(process.argv[6] || 8); }
  else { floor = +process.argv[4]; K = +(process.argv[5] || 8); }
  const Z = zid && D.ZONES[zid], base = Z ? (side === 'hi' ? Z.L[1] : Z.L[0]) : D.pit(floor).L;
  Lv = (process.argv[mode === 'zone' ? 7 : 6] || '').split(',').filter(Boolean).map(Number);
  if (!Lv.length) { if (mode === 'zone') for (let v = 1; v <= base + 4; v += Math.max(2, Math.round(base / 12))) Lv.push(v); else for (let d = -45; d <= 6; d += 3) Lv.push(Math.max(1, Math.min(100, base + d))); }
  Lv = Lv.filter((v, i, a) => a.indexOf(v) === i);
  Lv.forEach(T => {
    nearest(all, T).forEach(x => {
      for (let k = 0; k < K; k++) {
        const s = load(x.f), L = shift(s, T - x.L);
        if (mode === 'zone') { const r = fightZone(s, zid, side, x.seed * 1000 + k + 1); console.log(JSON.stringify({ k: 'zone', z: zid, side, cls: x.cls, from: x.n, T, L, win: r.r === 'win' ? 1 : 0, dead: r.dead, cd: r.cmdDead, t: r.t, packL: r.packL, u: D.partySpecs(s).length })); }
        else { const sc = D.pit(floor); keepTier(s, sc.tier); const r = fightScn(s, sc, x.seed * 1000 + k + 1); console.log(JSON.stringify({ k: 'pit', f: floor, cls: x.cls, from: x.n, T, L: D.partyL(s), win: r.r === 'win' ? 1 : 0, dead: r.dead, cd: r.cmdDead, t: r.t, u: D.partySpecs(s).length })); }
      }
    });
  });
} else if (mode === 'pitnat') {      // 갱도: 판마다 옮기지 않은 제 레벨 그대로 (봇이 그 무렵 실제로 가진 부대) — node tools/calib.js pitnat <폴더> <층들> [시도=2]
  const dir = process.argv[3], floors = process.argv[4].split(',').map(Number), K = +(process.argv[5] || 2);
  snaps(dir).forEach(x => {
    const s0 = load(x.f); if (D.partyTier(s0) < 5) return;
    floors.forEach(f => { for (let k = 0; k < K; k++) { const s = load(x.f); shift(s, 0); const sc = D.pit(f); if (process.env.PITD) sc.diff *= +process.env.PITD; const r = fightScn(s, sc, x.seed * 1000 + x.n * 37 + k + 1); console.log(JSON.stringify({ k: 'pit', f, pd: +(process.env.PITD || 1), cls: x.cls, from: x.n, L: D.partyL(s), win: r.r === 'win' ? 1 : 0, dead: r.dead, cd: r.cmdDead, t: r.t, u: D.partySpecs(s).length })); } });
  });
} else if (mode === 'scnnat') {      // 시나리오: 봇이 제 레벨로 닿은 판(BOTFOCUS · BOTD 로 여러 레벨) 그대로 — node tools/calib.js scnnat <폴더> <N> [시도=12]
  const dir = process.argv[3], n = +process.argv[4], K = +(process.argv[5] || 12), sc = D.scn(n);
  snaps(dir).filter(x => x.n === n).forEach(x => { for (let k = 0; k < K; k++) { const s = load(x.f), L = shift(s, 0); const r = fightScn(s, sc, x.seed * 1000 + k + 1); console.log(JSON.stringify({ k: 'scn', n, cls: x.cls, seed: x.seed, d: 0, L, win: r.r === 'win' ? 1 : 0, dead: r.dead, cd: r.cmdDead, t: r.t, u: D.partySpecs(s).length })); } });
} else if (mode === 'at') {      // 2.2.7: 권장 확인 — 판마다 부대 평균이 그 레벨(기본 권장 DS.recL)이 되게 옮겨 싸운다. node tools/calib.js at <폴더> <N> [시도=10] [레벨]
  const dir = process.argv[3], n = +process.argv[4], K = +(process.argv[5] || 10), sc = D.scn(n), T = +(process.argv[6] || D.recL(sc));
  snaps(dir).filter(x => x.n === n).forEach(x => { for (let k = 0; k < K; k++) { const s = load(x.f), d = T - D.partyL(s); shift(s, d); keepTier(s, sc.tier); const L = D.partyL(s); const r = fightScn(s, sc, x.seed * 1000 + k + 1); console.log(JSON.stringify({ k: 'scn', n, cls: x.cls, seed: x.seed, d, T, L, win: r.r === 'win' ? 1 : 0, dead: r.dead, cd: r.cmdDead, t: r.t, u: D.partySpecs(s).length })); } });
} else if (mode === 'sum') {
  const rows = []; process.argv.slice(3).forEach(f => fs.readFileSync(f, 'utf8').split('\n').forEach(l => { if (l.startsWith('{')) { const o = JSON.parse(l); if (!o.skip) rows.push(o); } }));
  const groups = {};
  rows.forEach(o => { const key = o.k === 'scn' ? 's' + o.n : o.k === 'zone' ? o.z + ':' + o.side : 'p' + o.f; (groups[key] = groups[key] || []).push(o); });
  const out = {};
  Object.keys(groups).forEach(key => {
    const by = {}; groups[key].forEach(o => { (by[o.L] = by[o.L] || []).push(o); });
    const Ls = Object.keys(by).map(Number).sort((a, b) => a - b);
    const pts = Ls.map(L => { const a = by[L], n = a.length, w = a.filter(o => o.win).length, clean = a.filter(o => o.win && o.dead <= 1).length; return { L, n, win: w / n, clean: clean / n, zero: a.filter(o => o.win && o.dead === 0).length / n, dead: a.reduce((x, o) => x + o.dead, 0) / n }; });      // clean = 이기고 쓰러진 이가 하나 이하 · zero = 아무도 안 쓰러짐
    // 이웃 레벨과 묶어 고르게 (표본이 작다): 레벨 L 의 비율 = L-2 … L+2 의 무게 평균
    const sm = pts.map(p => { let W = 0, w = 0, c = 0, z = 0, dd = 0; pts.forEach(q => { const k = Math.abs(q.L - p.L) <= 1 ? 2 : Math.abs(q.L - p.L) <= 3 ? 1 : 0; if (!k) return; W += k * q.n; w += k * q.n * q.win; c += k * q.n * q.clean; z += k * q.n * q.zero; dd += k * q.n * q.dead; }); return { L: p.L, n: p.n, win: w / W, clean: c / W, zero: z / W, dead: dd / W }; });
    const at = (f, thr) => { for (let i = 0; i < sm.length; i++) { if (sm.slice(i).every(p => f(p) >= thr)) return sm[i].L; } return null; };
    out[key] = { p80: at(p => p.win, 0.8), p50: at(p => p.win, 0.5), c80: at(p => p.clean, 0.8), z95: at(p => p.zero, 0.95), z80: at(p => p.zero, 0.8), pts: pts.map(p => p.L + ':' + Math.round(p.win * 100) + '/' + Math.round(p.clean * 100) + '(' + p.n + ')').join(' ') };
  });
  console.log(JSON.stringify(out, null, 1));
}
