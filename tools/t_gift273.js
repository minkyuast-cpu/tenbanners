// 2.7.3 운영진 선물 우편: 이 판이 나오기 전부터 플레이하던 저장(마지막 저장 판 < 2.7.3)에만 모집권 50장 우편 한 통 · 받기를 눌러야 들어간다 · 다시 열어도 또 오지 않는다 · 새 판에는 없다
//   H=844 OUT=<폴더> node tools/shot.js tools/t_gift273.js
module.exports = async function (page, shot, L) {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), sleep = L.sleep;
  await L.newGame(page, '선물', 'inf');
  let c = await ev(() => ({ pm: !!DS.G.save.pmail, ver: DS.G.save.ver }));
  A(!c.pm, 'a game started on this version gets no gift mail');
  const raw = await ev(() => { var s = JSON.parse(JSON.stringify(DS.G.save)); s.ver = '2.7.2'; s.tickets = 3; delete s.pmail; delete s.gotMail; return JSON.stringify(s); });
  await ev((raw) => { DS.ui.closeAll(); DS.G.running = false; DS.G.save = null; localStorage.setItem(DS.Save.KEY, raw); DS.Save.setMeta({ seenVer: DS.VERSION }); }, raw);
  await page.reload(); await sleep(1500);
  await page.click('#btnCont'); await sleep(1500);
  c = await ev(() => { var o = document.querySelector('.ov.gmov'); return { open: !!o, txt: o ? o.innerText.replace(/\s+/g, ' ') : '', tk: DS.G.save.tickets, stored: JSON.parse(localStorage.getItem(DS.Save.KEY)).pmail }; });
  await shot('gift_mail');
  A(c.open && /감사의 선물/.test(c.txt) && /×50/.test(c.txt) && c.tk === 3 && c.stored && c.stored.length === 1, 'a save from 2.7.2 opens the gift mail on 이어하기; nothing is added before 받기 (' + c.tk + ' tickets)');
  await ev(() => document.querySelector('.ov.gmov [data-gmtake]').click()); await sleep(1600);
  c = await ev(() => { var s = DS.G.save, st = JSON.parse(localStorage.getItem(DS.Save.KEY)); return { tk: s.tickets, pm: !!s.pmail, got: (s.gotMail || []).join(), stTk: st.tickets, stPm: !!st.pmail, open: !!document.querySelector('.ov.gmov') }; });
  await shot('gift_taken');
  A(c.tk === 53 && !c.pm && c.got === 'thanks273' && c.stTk === 53 && !c.stPm && !c.open, '받기: +50 tickets (now ' + c.tk + '), recorded and saved, the mail closes');
  c = await ev(() => { var s = DS.Save.read(localStorage.getItem(DS.Save.KEY)); var t = JSON.parse(localStorage.getItem(DS.Save.KEY)); t.ver = '2.7.2'; var s2 = DS.Save.read(JSON.stringify(t)); return { again: !!(s && s.pmail), again2: !!(s2 && s2.pmail), tk: s2 && s2.tickets }; });
  A(!c.again && !c.again2 && c.tk === 53, 'loading again never sends it twice, even if the save looks old');
  c = await ev(() => { var t = JSON.parse(localStorage.getItem(DS.Save.KEY)); t.pmail = [{ id: 'hack', tk: 9999 }, { id: 'thanks273', tk: 9999 }]; t.gotMail = []; var s = DS.Save.read(JSON.stringify(t)); return { n: s.pmail ? s.pmail.length : 0, tk: s.pmail ? s.pmail[0].tk : 0 }; });
  A(c.n === 1 && c.tk === 50, 'a tampered mail list is cleaned: unknown mails dropped, the amount comes from the code (' + c.tk + ')');
};
