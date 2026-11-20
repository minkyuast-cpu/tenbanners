// 전민 — 머리 없이(Node) 게임 규칙을 불러온다. build.js 와 같은 차례로 src/*.js 를 한 맥락에 읽고, 화면 파일(game · joystick · ui)은 뺀다.
//   const DS = require('./load.js')();   // 한 번만 읽는다 (다시 부르면 같은 DS)
//   opt.quiet: 불러오며 찍히는 로그를 숨긴다 (기본 켬)
// 화면이 없는 자리를 메우는 것: window = globalThis, localStorage (메모리), DS.lvText, performance.now
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = process.env.LOAD_SRC || path.join(__dirname, '..', 'src');      // LOAD_SRC: 다른 판의 src (옛 저장 만들기 — tools/mkv12.js)
const SKIP = { game: 1, joystick: 1, ui: 1, cine: 1 };
let DS0 = null;
function order() {
  const b = fs.readFileSync(path.join(SRC, '..', 'build.js'), 'utf8'), m = /const ORDER = (\[[^\]]+\])/.exec(b);
  const list = JSON.parse(m[1].replace(/'/g, '"'));
  return list.concat(['online', 'migrate']).filter(f => !SKIP[f] && fs.existsSync(path.join(SRC, f + '.js')));
}
module.exports = function load(opt) {
  if (DS0) return DS0;
  opt = opt || {};
  const g = globalThis;
  if (!g.window) g.window = g;
  if (!g.localStorage) { const mem = {}; g.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; }, clear: () => { for (const k in mem) delete mem[k]; } }; }
  const log = console.log; if (opt.quiet !== false) console.log = function () {};
  try {
    for (const f of order()) vm.runInThisContext(fs.readFileSync(path.join(SRC, f + '.js'), 'utf8'), { filename: 'src/' + f + '.js' });
  } finally { console.log = log; }
  const DS = g.DS;
  if (!DS.lvText) DS.lvText = L => DS.tierOfL(L) + '단 Lv' + DS.lvOfL(L);
  DS.HEADLESS = true;
  if (process.env.HARDK && DS.HARD) DS.HARD.k = +process.env.HARDK;      // 조율용: 시나리오 세기 (tune.js DS.HARD)
  if (process.env.HARDL && DS.HARD) DS.HARD.late = +process.env.HARDL;
  if (process.env.H7S && DS.HARD7) DS.HARD7.pts.forEach(p => { p[1] = 1 + (p[1] - 1) * +process.env.H7S; });      // 2.2.7 조율용: DS.HARD7 의 더한 몫 배율
  if (process.env.B7S && DS.BOSS7) { const f = q => [1 + (q[0] - 1) * +process.env.B7S, 1 + (q[1] - 1) * +process.env.B7S]; DS.BOSS7.base = f(DS.BOSS7.base); for (const k in DS.BOSS7.key) DS.BOSS7.key[k] = f(DS.BOSS7.key[k]); }
  if (process.env.MORE && DS.HARD7) DS.HARD7.more = +process.env.MORE;
  if (process.env.FHM && DS.FIELD_EN) DS.FIELD_EN.hm = +process.env.FHM;      // 2.2.7 조율용: 들판 무리 체력 · 공격
  if (process.env.FAM && DS.FIELD_EN) DS.FIELD_EN.am = +process.env.FAM;
  if (process.env.PACKCAP && DS.PACK) DS.PACK.cap = +process.env.PACKCAP;      // 2.2.7 조율용: 들판 무리 크기
  if (process.env.PACKPER && DS.PACK) DS.PACK.per = +process.env.PACKPER;
  DS0 = DS;
  return DS;
};
module.exports.order = order;
