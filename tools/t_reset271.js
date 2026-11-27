// 2.7.1 모두 새로 시작: 새 키(tenbanners_v5) · 저장 v14. 옛 키(tenbanners_v4)의 저장은 이어 하지 않고 보관만 · 타이틀에 「새 판이 열렸다」 한 번 · 옛 판(v13) 문서는 isOld
//   H=844 OUT=<폴더> node tools/shot.js tools/t_reset271.js
const fs = require('fs'), path = require('path');
module.exports = async function (page, shot, L) {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), sleep = L.sleep;
  const v225 = fs.readFileSync(path.join(__dirname, 'fixtures', 'v225.json'), 'utf8');
  let c = await ev(() => ({ key: DS.Save.KEY, v: DS.SAVE_V, era: DS.SAVE_ERA, nv: DS.newSave('x', 'inf').v }));
  A(c.key === 'tenbanners_v5' && c.v === 14 && c.era === 14 && c.nv === 14, 'new key ' + c.key + ', save v' + c.v + ', new games are v' + c.nv);
  // 옛 키에 v13 저장이 있는 기기: 이어하기가 없고, 새 판 안내가 한 번, 옛 저장은 그대로
  await ev((raw) => { DS.ui.closeAll(); DS.G.running = false; DS.G.save = null; localStorage.clear(); localStorage.setItem('tenbanners_v4', raw); }, v225);
  await page.reload(); await sleep(1500);
  c = await ev(() => ({ cont: !!document.querySelector('#btnCont'), arch: (document.querySelector('.welcome.arch') || {}).innerText || '', newBtn: !!document.querySelector('#btnNew'), oldKept: !!localStorage.getItem('tenbanners_v4'), loaded: !!DS.Save.load() }));
  await shot('title_reset');
  A(!c.cont && /새 판이 열렸다/.test(c.arch) && c.newBtn && c.oldKept && !c.loaded, 'old save on this device: no 이어하기, the 「새 판이 열렸다」 note, 새로 시작 offered, the old save is kept untouched');
  c = await ev((raw) => ({ old: DS.Save.isOld(raw), oldStr: DS.Save.isOld(JSON.stringify(DS.newSave('x', 'inf'))), read: !!DS.Save.read(raw) }), v225);
  A(c.old && !c.oldStr && c.read, 'a v13 save (cloud doc or move code) counts as the previous era; a new save does not; read() can still convert it for tools');
  // 두 번째로 열면 안내는 없다
  await page.reload(); await sleep(1200);
  A(await ev(() => !document.querySelector('.welcome.arch')), 'the note shows only once');
  // 새로 시작하면 새 키에만 쓴다
  await page.click('#btnNew'); await page.waitForSelector('#cmdName'); await page.fill('#cmdName', '새판'); await page.click('[data-c="inf"]'); await page.click('#goNew'); await sleep(600);
  await ev(() => { DS.G.quiet = true; }); await L.skipStory(page); await sleep(300);
  await ev(() => DS.ui.persist());
  c = await ev(() => ({ k5: !!localStorage.getItem('tenbanners_v5'), v: JSON.parse(localStorage.getItem('tenbanners_v5') || '{}').v, k4same: localStorage.getItem('tenbanners_v4').length > 1000 }));
  A(c.k5 && c.v === 14 && c.k4same, 'a new game writes v14 to the new key only; the old key still holds the old save');
};
