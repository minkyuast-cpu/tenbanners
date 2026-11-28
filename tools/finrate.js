// 전민 2.9 — 30번 마지막 싸움 재기: 봇이 30번에 처음 들어가기 직전의 판(BOTSNAP=폴더 node tools/bot.js <병과> <씨앗>)으로 여러 번 싸운다.
//   node tools/finrate.js <폴더> [판마다 시도=6] [병과들=모두]
//   봇의 첫 시도와 같은 셈: 가주 · 맹주가 둘째로 쓰러지거나 합일한 이(8단~)의 체력이 15%(맹주는 30%) 밑이면 물러난다 — 진 판으로 센다 (tools/bot.js run 의 퇴각과 같다)
//   줄마다 { cls, seed, k, r: win|lose|retreat|end, t: 엔진 초, ph: 닿은 막, log: 막마다 [막, 초], dead, why } · 끝에 요약 한 줄 (SUM {...})
'use strict';
const fs = require('fs'), path = require('path');
const D = require('./load.js')();
D.BAL.ultAuto = true;
const dir = process.argv[2], K = +(process.argv[3] || 6), only = (process.argv[4] || '').split(',').filter(Boolean);
const NORET = !!process.env.NORET;
function rng(seed) { let rs = seed >>> 0; return () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ rs >>> 15, 1 | rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function load(f) { const s = JSON.parse(fs.readFileSync(f, 'utf8')); D.pSync(s); D.mercTidy(s); D.pSync(s); D.charList(s).forEach(c => { if (!c.down) { c.hp = 1; c.mp = 1; } }); return s; }
function fight(s, seed) {
  Math.random = rng(seed * 7919 + 13);
  const sc = D.scn(30), b = D.buildScenario(sc, D.partySpecs(s).length, s.chars[s.hero] ? s.chars[s.hero].cls : 'inf');
  const sim = new D.Sim({ map: b.map, units: b.units, mk: b.mk, objective: b.objective, waves: b.waves, seed: seed * 131 + 30, inv: s.items, mode: 'scn' });
  sim.heroId = 'c' + s.hero;
  const specs = D.partySpecs(s), pos = D.formation(specs, b.start); let first = null;
  specs.forEach((u, i) => { u.x = pos[i][0]; u.y = pos[i][1]; u.auto = true; const nu = sim.add(u); if (nu && nu.role === 'cmd' && !first) first = nu; });
  sim.leader = first && first.id; sim.hunt = true;
  let res = null, fell = 0, dead = 0, why = '', last = {}, cur = '';
  if (process.env.WHY) {      // 물러난 까닭: 마지막 몇 대 (때린 쪽 · 기술 · 최대 체력에 대한 몫)
    const r0 = sim.resolve; sim.resolve = function (u, id) { const c0 = cur; cur = id; try { return r0.apply(this, arguments); } finally { cur = c0; } };
    const h0 = sim.hurt; sim.hurt = function (v, dmg, src) { if (v.side === 'ally' && v.role === 'cmd') { const L = last[v.id] || (last[v.id] = []); L.push([Math.round(sim.t), src ? (src.fin || (src.finAdd ? 'add' : src.summoned ? 'sum' : src.type)) : 'env', cur || 'atk', +(dmg / v.mhp).toFixed(2)]); if (L.length > 4) L.shift(); } return h0.apply(this, arguments); };
  }
  while (!res) {
    sim.update(0.5);
    for (const e of sim.drain()) {
      if (e.t === 'die') { const u = sim.byId[e.id]; if (u && u.side === 'ally' && !e.flee && (u.role === 'cmd' || u.role === 'merc')) { dead++; if (u.role === 'cmd') fell++; } }
      else if (e.t === 'win') res = 'win'; else if (e.t === 'lose') res = 'lose';
    }
    if (sim.result) res = sim.result;
    if (!res && !NORET && fell >= 2 && sim.cmds().length) { res = 'retreat'; why = 'fell2'; }
    { const lw = sim.units.filter(u => !u.dead && u.side === 'ally' && u.role === 'cmd' && u.tier >= 8 && u.hp < u.mhp * 0.15 * (u.hero ? 2 : 1))[0]; if (!res && !NORET && lw) { res = 'retreat'; why = 'low:' + (lw.hero ? 'hero' : 'cmd') + ':' + (lw.cls || ''); if (last[lw.id]) why += ' ' + JSON.stringify(last[lw.id]); } }
    if (!res && sim.t > 900) res = 'end';
  }
  const F = sim.fin;
  return { r: res, t: Math.round(sim.t), ph: F ? F.ph : 0, log: F ? F.log : [], dead, why, n: F ? F.n : null };
}
const snaps = fs.readdirSync(dir).filter(f => /^[a-z]+_\d+_30\.json$/.test(f)).filter(f => !only.length || only.indexOf(f.split('_')[0]) >= 0).sort();
const all = [];
for (const f of snaps) {
  const m = /^([a-z]+)_(\d+)_30\.json$/.exec(f);
  for (let k = 0; k < K; k++) {
    const r = fight(load(path.join(dir, f)), +m[2] * 1000 + k + 1);
    r.cls = m[1]; r.seed = +m[2]; r.k = k; all.push(r);
    console.log(JSON.stringify(r));
  }
}
const wins = all.filter(r => r.r === 'win'), sum = { n: all.length, win: +(wins.length / Math.max(1, all.length)).toFixed(3), tWin: wins.length ? Math.round(wins.reduce((a, r) => a + r.t, 0) / wins.length) : 0,
  tMed: (function () { const t = wins.map(r => r.t).sort((a, b) => a - b); return t.length ? t[t.length >> 1] : 0; })(), ret: all.filter(r => r.r === 'retreat').length, low: all.filter(r => /^low/.test(r.why)).length, lose: all.filter(r => r.r === 'lose').length, end: all.filter(r => r.r === 'end').length,
  phEnd: [1, 2, 3, 4, 5].map(p => all.filter(r => r.r !== 'win' && r.ph === p).length), byCls: {} };
all.forEach(r => { const c = sum.byCls[r.cls] || (sum.byCls[r.cls] = [0, 0]); c[1]++; if (r.r === 'win') c[0]++; });
console.log('SUM ' + JSON.stringify(sum));
