// 2.6.4: 大 가문 — 합일의 대표 가문은 그 세대 동안 「大 ○○ 가문」 · 그 가문의 가주는 합일 없이 7단 Lv10 을 넘는다 · 단 이름이 부대 카드 · 인물 줄 · 가문 창에 보인다
//   H=844 OUT=<폴더> node tools/shot.js tools/t_dae264.js
module.exports = async function (page, shot, L) {
  const A = L.assert, ev = (f, a) => page.evaluate(f, a), sleep = L.sleep;
  await L.newGame(page, '시험', 'inf');
  await L.edit(page, function () { DS.houseOpenN(s, 9); DS.mercTidy(s); DS.charList(s).forEach(function (c) { var b = c.id === s.hero ? c.ps : DS.bearer(s, c); if (b) { b.L = 70; b.exp = 0; } }); DS.mercTidy(s); if (DS.pSync) DS.pSync(s); for (var id = 1; id <= 20; id++) DS.applyClear(s, DS.scn(id)); s.crest = s.crest || 1; });
  let c = await ev(() => { var s = DS.G.save, out = {}; out.crest = !!s.crest; var cands = DS.fuseCands(s).filter(x => x.ch.id !== s.hero); out.n = cands.length;
    var keys = cands.slice(0, 3).map(x => x.key), rep = cands[0].ch.id; out.ok = DS.fuseOk(s, keys, { rep: rep }); var rw = DS.fuse(s, keys, { rep: rep }); var H = s.chars[rep]; window.__rep = rep;
    out.fused = !!rw && rw.fz === 1; out.dae = H.dae; out.gen = DS.genNow(s); out.name = DS.flagName(H.cls, s); out.raw = DS.flagHouseRaw(s, H.cls); out.other = DS.flagName(DS.charList(s).filter(x => x.id !== rep && x.id !== s.hero)[0].cls, s); out.title = DS.houseTitle(s, H).sub; out.tier = DS.tierName(H.cls, 8);
    return out; });
  A(c.ok.ok && c.fused && c.dae === c.gen, 'fuse: the representative house is marked for this generation (dae ' + c.dae + ', gen ' + c.gen + ')');
  A(c.name === '大 ' + c.raw && !/大/.test(c.other) && !/大/.test(c.raw), 'its name gets 「大」: 「' + c.name + '」 (raw 「' + c.raw + '」), other houses do not (「' + c.other + '」)');
  A(c.title.indexOf(c.tier) >= 0 && /8단/.test(c.title), 'house title carries the tier name: 「' + c.title + '」');
  await ev(() => { DS.G.quiet = true; DS.rebuildParty(); DS.openMenu('party'); }); await sleep(600);
  c = await ev(() => { var o = document.querySelector('.ov'), s = DS.G.save, H = s.chars[window.__rep], card = o.querySelector('.hk[data-ch="' + H.id + '"]'), lord = o.querySelector('.hk.lord'); return { head: card.querySelector('.hkh small').textContent, tn: (card.querySelector('.hkc') || {}).textContent || '', want: DS.tierName(H.cls, 8), lordTn: (lord.querySelector('.hkc') || {}).textContent || '', lordWant: DS.tierName(s.chars[s.hero].cls, 7), cards: o.querySelectorAll('.hk .hkc').length, heads: DS.charList(s).length, font: document.fonts.check('12px "TB Body B"', '大'), sw: document.documentElement.scrollWidth }; });
  A(/^大 /.test(c.head) && c.tn === c.want && c.lordTn === c.lordWant && c.cards === c.heads, 'party tab: the card header reads 「' + c.head + '」 and every card shows its tier name (' + c.lordTn + ', ' + c.tn + ' … ' + c.cards + ' cards)');
  A(c.font && c.sw <= 390, 'the 「大」 glyph comes from the bundled font, page fits 390px');
  await shot('party_dae');
  await ev(() => { DS.ui.closeAll(); DS.openMenu('people'); }); await sleep(600);
  c = await ev(() => { var o = document.querySelector('.ov'), s = DS.G.save, rows = [...o.querySelectorAll('.row.ppl')], h = rows.filter(r => r.classList.contains('hero'))[0], t = h.querySelector('.ptn'), tr = t.getBoundingClientRect(), nr = h.querySelector('.pn').getBoundingClientRect(); return { n: rows.length, withTn: rows.filter(r => r.querySelector('.ptn')).length, hero: t.textContent, want: DS.tierName(s.chars[s.hero].cls, 7), whole: tr.right <= nr.right + 0.5 }; });
  A(c.n > 0 && c.withTn === c.n && c.hero === c.want && c.whole, 'people tab: every row shows the tier name, the longest one is not cut (「' + c.hero + '」)');
  await shot('people_dae');
  // 합일한 가주가 쓰러진다 → 막사의 같은 병과가 잇는다 → 합일 없이 70 을 넘는다
  c = await ev(() => { var s = DS.G.save, H = s.chars[window.__rep], b = DS.bearer(s, H), out = {};
    var m = DS.addMerc(s, DS.heroType(H.cls), 3, 0); m.sb = 1; m.nc = DS.houseCls ? DS.houseCls(H) : H.cls; m.L = 70; m.exp = 0; m.n = '뒤이음'; DS.mercTidy(s);
    out.capBefore = DS.pCap(m); out.fuseCanSb = DS.fuseCands(s).some(x => x.who === m);
    if (DS.linMercDied) DS.linMercDied(s, b, '시험', '전사'); else DS.loseMerc(s, b.id);
    if (DS.loseMerc && DS.bearer(s, H, 1) === b) DS.loseMerc(s, b.id);
    DS.mercTidy(s); out.vac = !DS.bearer(s, H, 1); out.nameVac = DS.flagName(H.cls, s);
    var ev2 = DS.sbTick ? DS.sbTick(s) : []; DS.mercTidy(s); DS.pSync(s);
    var nb = DS.bearer(s, H); out.seated = !!nb && nb.id === m.id; out.dx = nb && nb.dx; out.fz = nb && nb.fz; out.cap = nb ? DS.pCap(nb) : 0; out.L0 = nb ? nb.L : 0; out.fuseCan = DS.fuseCands(s).some(x => x.who === nb);
    for (var i = 0; i < 400 && nb && nb.L < 72; i++) DS.gainExp(s, 200000, 80);
    out.L1 = nb ? nb.L : 0; out.fz1 = nb && nb.fz; out.tier = DS.tierOfL(out.L1); out.tn = DS.tierName(H.cls, out.tier); out.name1 = DS.flagName(H.cls, s);
    // 다른 가문의 가주는 여전히 70 에 묶인다
    var o = DS.charList(s).filter(x => x.id !== H.id && x.id !== s.hero)[0], ob = DS.bearer(s, o); out.otherL = ob.L; out.otherCap = DS.pCap(ob);
    // 세대가 바뀐다: 8단 가주가 서 있으면 여전히 大, 가주가 70 밑이면 이름이 돌아온다
    var f = DS.fixSave(JSON.parse(JSON.stringify(s))); out.reloadDae = f.chars[H.id].dae; out.reloadName = DS.flagName(H.cls, f);
    f.eg = f.eg || {}; f.eg.gen = (f.eg.gen || 1) + 1; out.nextGenName = DS.flagName(H.cls, f); var fb = DS.bearer(f, f.chars[H.id]); fb.L = 60; delete fb.fz; f.chars[H.id].L = 60; DS.pSync(f); out.nextGenLow = DS.flagName(H.cls, f); out.nextGenCap = DS.pCap(fb);
    DS.rebuildParty(); return out; });
  A(c.capBefore === 70 && c.vac && /^大 /.test(c.nameVac), 'the fused 가주 falls: the house is vacant but still 「' + c.nameVac + '」; a 막사 person is still capped at 70');
  A(c.seated && c.dx === 1 && !c.fz && c.cap === 100 && c.L0 === 70 && !c.fuseCan, 'the heir stands at own level (L' + c.L0 + ', not fused), cap 100 without 합일, and is no longer a fusion candidate');
  A(c.L1 > 70 && c.fz1 === 1 && c.tier >= 8 && /^大 /.test(c.name1), 'by experience alone the heir passes 7단 Lv10: L' + c.L1 + ' = ' + c.tier + '단 ' + c.tn + ' (' + c.name1 + ')');
  A(c.otherL === 70 && c.otherCap === 70, 'heads of ordinary houses still stop at 7단 Lv10 (cap ' + c.otherCap + ')');
  A(c.reloadDae === 1 && /^大 /.test(c.reloadName) && /^大 /.test(c.nextGenName) && !/大/.test(c.nextGenLow) && c.nextGenCap === 70, 'save round-trip keeps it; next generation: 大 stays while an 8단 head stands, and ends (name and cap 70) once the head is below 8단');
  await ev(() => { DS.ui.closeAll(); DS.openMenu('party'); }); await sleep(600); await shot('party_heir8');
  await ev((id) => { var b = document.querySelector('.ov .hk[data-ch="' + id + '"]'); if (b) b.click(); }, await ev(() => window.__rep)); await sleep(600); await shot('house_sheet');
  c = await ev(() => { var o = [...document.querySelectorAll('.ov:not(.ghost)')].pop(); return { h: (o.querySelector('.sh h3, h2, .hs2 .nm') || {}).textContent || '', tn: (o.querySelector('.ctag.tn') || {}).textContent || '', fz: (o.querySelector('.fzl') || {}).innerText || '', bad: /undefined|NaN/.test(o.innerText) }; });
  A(c.tn && /大 가문/.test(c.fz) && !c.bad, 'house sheet: tier tag 「' + c.tn + '」 and the line 「' + c.fz.replace(/\s+/g, ' ') + '」');
};
