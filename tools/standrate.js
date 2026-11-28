// 전민 2.9.1 — 마지막 물결 재기: 봇 판(BOTSNAP 의 <병과>_<씨앗>_30.json)으로 물결을 여러 번 막아 본다.
//   node tools/standrate.js <폴더> [판마다 시도=3]      TOP3=1: 맹주 포함 가장 높은 가주 셋만 (10단 셋 전제의 세기 재기) · LV=100: 그 셋의 레벨을 이 값으로
//   줄마다 { cls, seed, k, w 막은 물결, r 닿은 물결, t 엔진 초, e 마지막 광폭 단계, allies } · 끝에 SUM
'use strict';
const fs = require('fs'), path = require('path');
const D = require('./load.js')();
D.BAL.ultAuto = true;
const dir = process.argv[2], K = +(process.argv[3] || 3);
function rng(seed) { let rs = seed >>> 0; return () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ rs >>> 15, 1 | rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function load(f) { const s = JSON.parse(fs.readFileSync(f, 'utf8')); D.pSync(s); D.mercTidy(s); D.pSync(s); D.charList(s).forEach(c => { if (!c.down) { c.hp = 1; c.mp = 1; } }); return s; }
const roster0 = D.standRoster;
if (process.env.TOP3) D.standRoster = function (s) {
  const r = roster0(s).filter(u => u.role === 'cmd').sort((a, b) => (b.hero ? 1 : 0) - (a.hero ? 1 : 0) || (b.L || 0) - (a.L || 0)).slice(0, 3);
  if (process.env.LV) r.forEach(u => { if ((u.L || 0) < +process.env.LV) { const ch = s.chars[u.ch]; if (ch) { ch.L = +process.env.LV; } } });
  if (process.env.LV) return roster0(s).filter(u => r.some(x => x.id === u.id));
  return r;
};
const snaps = fs.readdirSync(dir).filter(f => /^[a-z]+_\d+_30\.json$/.test(f)).sort(), all = [];
for (const f of snaps) {
  const m = /^([a-z]+)_(\d+)_30\.json$/.exec(f);
  for (let k = 0; k < K; k++) {
    const s = load(path.join(dir, f)), seed = +m[2] * 1000 + k + 1; Math.random = rng(seed * 7919 + 13);
    let eMax = 0; const r = D.standRun(s, { seed, onEv: ev => ev.forEach(e => { if (e.t === 'stdEnrage') eMax = Math.max(eMax, e.e); }) });
    const o = { cls: m[1], seed: +m[2], k, w: r.w, r: r.r, t: r.t, e: eMax, allies: r.allies, L: D.standRoster(s).map(u => u.L).join('/') };
    all.push(o); console.log(JSON.stringify(o));
  }
}
const ws = all.map(o => o.w).sort((a, b) => a - b);
console.log('SUM ' + JSON.stringify({ n: all.length, wMean: +(ws.reduce((a, b) => a + b, 0) / ws.length).toFixed(1), wMed: ws[ws.length >> 1], wMin: ws[0], wMax: ws[ws.length - 1], tMean: Math.round(all.reduce((a, o) => a + o.t, 0) / all.length) }));
