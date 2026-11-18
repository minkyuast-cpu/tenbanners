// 옛 판(2.1.2, 저장 v12) 규칙으로 가솔·막사·아이·배우자·기다리는 후계가 있는 저장을 만든다 → tools/fixtures/v12.json
//   LOAD_SRC=/home/user/src/src node tools/mkv12.js      (source 브랜치의 작업 트리)
'use strict';
const fs = require('fs'), path = require('path');
const D = require('./load.js')();
let r = 7; Math.random = () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; };
if (D.SAVE_V !== 12) { console.log('SAVE_V', D.SAVE_V, '— 2.1.2 의 src 를 LOAD_SRC 로 주세요'); process.exit(1); }
const s = D.newSave('옛판', 'inf');
for (let id = 1; id <= 9; id++) D.applyClear(s, D.scn(id));
s.gold = 5000; s.tickets = 2;
for (let i = 0; i < 16; i++) D.pullMerc(s, Math.random, 0);
D.autoAssign(s);
const hero = s.chars[s.hero];
D.charList(s).forEach(c => { c.L = Math.max(c.L, 30); });
D.pSync(s);
// 맹주 혼인 + 아이 (성년 하나는 막사, 하나는 미성년)
D.linAutoWed(s);
const hp = s.lin.P[hero.pid], sp = hp && hp.sp ? s.lin.P[hp.sp] : null;
if (sp) {
  const kid = D.addMerc(s, 'm_sword', 3, 0); kid.ttl = '옛판 2세'; kid.sn = s.lin.sur; kid.L = 12;
  const p = D.linMkP(s, { k: 'm', sn: kid.sn, n: kid.n, sx: kid.sx, gen: 2, pa: [hp.id, sp.id], ttl: kid.ttl, type: kid.type, g: 3, m: kid.id, gv: 1, hb: 1 }); kid.pid = p.id;
  const yp = D.linMkP(s, { k: 'm', sn: s.lin.sur, n: '아기', sx: 'f', gen: 2, pa: [hp.id, sp.id], ttl: '옛판 2세', type: 'm_sword', g: 2, m: 0, gv: 1, hb: 1 });
  yp.st = 'young'; yp.ya = { type: 'm_sword', g: 2, t: 'brave', v: 0, sx: 'f', n: '아기' }; yp.by = (s.cal ? s.cal.t : 0) - 3 * 600; yp.ls = 60;
}
// 가주 하나가 쓰러져 「다음 가주가 곧 온다」 기다림 (lin.hw)
const vict = D.charList(s).find(c => c.id !== s.hero && c.cls === 'cle');
const b = vict && D.bearer(s, vict);
if (b) { const lost = D.loseMerc(s, b.id); D.linMercDied(s, lost, '시험'); }
// 아무 가문이나 가솔 자동 끄기
s.opt.refill = true;
const json = JSON.stringify(s);
const out = path.join(__dirname, 'fixtures', 'v12.json');
fs.writeFileSync(out, json);
const res = D.reserve(s).length, fol = s.mercs.filter(m => m.o && !m.h).length, bear = s.mercs.filter(m => m.h).length;
console.log('v12 저장', out, 'mercs', s.mercs.length, 'bearers', bear, '가솔', fol, '막사', res, 'hw', JSON.stringify(s.lin.hw || {}), 'c2', JSON.stringify(s.lin.c2 || {}), 'gold', s.gold);
