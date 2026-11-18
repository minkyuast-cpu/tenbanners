// 전민 — 머리 없이(Node) 게임 규칙을 불러온다. build.js 와 같은 차례로 src/*.js 를 한 맥락에 읽고, 화면 파일(game · joystick · ui)은 뺀다.
//   const DS = require('./load.js')();   // 한 번만 읽는다 (다시 부르면 같은 DS)
//   opt.quiet: 불러오며 찍히는 로그를 숨긴다 (기본 켬)
// 화면이 없는 자리를 메우는 것: window = globalThis, localStorage (메모리), DS.lvText, performance.now
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src');
const SKIP = { game: 1, joystick: 1, ui: 1 };
let DS0 = null;
function order() {
  const b = fs.readFileSync(path.join(__dirname, '..', 'build.js'), 'utf8'), m = /const ORDER = (\[[^\]]+\])/.exec(b);
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
  DS0 = DS;
  return DS;
};
module.exports.order = order;
