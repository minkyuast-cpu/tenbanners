// 전민 — 2.2.0 자리 불변식 검사 (머리 없이). const inv = require('./inv.js'); const bad = inv(DS, save, outsideCombat)  → 어긴 것 목록 (빈 배열 = 좋다)
//   가주는 가문마다 하나 · 맹주 가문에는 부대원 가주가 없다 · 막사(o 0 · sb 1 · h 없음)는 병과(nc 또는 cast)가 하나 · 가문원은 맹주 가문 · 빈 가문은 L 1 이고 싸우지 않는다
//   · 싸우는 유닛 = 가주가 선 가문 + 어른 가문원 (막사는 없다) · 레벨·경험치에 NaN 이 없다 · 가계도의 산 사람은 명부에 있다
//   outside = 싸움 밖 (막사의 같은 병과가 남아 있는 빈 가문이 없어야 한다)
'use strict';
module.exports = function inv(D, s, outside) {
  const bad = [], hid = +s.hero, P = (s.lin && s.lin.P) || {};
  const bear = {};
  (s.mercs || []).forEach(m => {
    if (!(m.L >= 1 && m.L <= 100) || !isFinite(+m.exp)) bad.push('merc ' + m.id + ' L/exp ' + m.L + '/' + m.exp);
    if (m.o && !s.chars[m.o]) bad.push('merc ' + m.id + ' o → missing house ' + m.o);
    if (m.h) {
      if (!m.o) bad.push('bearer ' + m.id + ' without house');
      if (m.o === hid) bad.push('merc ' + m.id + ' bears the 맹주 house');
      if (bear[m.o]) bad.push('two 가주 in house ' + m.o + ' (' + bear[m.o] + ', ' + m.id + ')'); bear[m.o] = m.id;
      if (m.sb) bad.push('bearer ' + m.id + ' also sb');
    } else if (!m.o) {
      if (!m.sb) bad.push('barracks ' + m.id + ' without sb');
      const wc = m.cast || m.nc;
      if (!wc) bad.push('barracks ' + m.id + ' (' + m.type + ') has no class (nc)');
      const fits = D.charList(s).filter(ch => !D.CLASSES[ch.cls].master && D.sbFits(ch, m));
      if (fits.length > 1) bad.push('barracks ' + m.id + ' fits ' + fits.length + ' houses');
    } else {
      if (m.o !== hid) bad.push('follower ' + m.id + ' of non-맹주 house ' + m.o + ' (가솔)');
      if (m.sb) bad.push('kin ' + m.id + ' also sb');
      if (!D.lineOf(s, m)) bad.push('kin ' + m.id + ' not of the 맹주 line');
    }
    if (m.pid && P[m.pid] && P[m.pid].m === m.id && P[m.pid].st !== 'live') bad.push('merc ' + m.id + ' person st ' + P[m.pid].st);
  });
  D.charList(s).forEach(ch => {
    if (!(ch.L >= 1 && ch.L <= 100) || !isFinite(+ch.exp)) bad.push('house ' + ch.id + ' L/exp ' + ch.L + '/' + ch.exp);
    if (ch.id === hid) return;
    const b = D.bearer(s, ch, 1);
    if (!b && ch.L !== 1) bad.push('vacant house ' + ch.id + ' (' + ch.cls + ') still L ' + ch.L);
    if (b && ch.L !== D.pL(b)) bad.push('house ' + ch.id + ' L ' + ch.L + ' ≠ 가주 L ' + D.pL(b));
    if (!b && outside && D.sbOf(s, ch.id).length) bad.push('vacant house ' + ch.id + ' has a same-class 막사 person waiting');
  });
  for (const k in P) { const p = P[k]; if (p.st === 'live' && p.k === 'm' && p.m && !(s.mercs || []).some(m => m.id === p.m)) bad.push('live person ' + p.id + ' points to missing merc ' + p.m); }
  const ids = D.partyIds(s);
  ids.forEach(id => { if (id !== hid && !D.bearer(s, s.chars[id], 1)) bad.push('vacant house ' + id + ' in party'); });
  if (outside) {
    const specs = D.partySpecs(s), sbIds = {}; D.barracks(s).forEach(m => { sbIds[m.id] = 1; });
    specs.forEach(u => { if (u.mid && sbIds[u.mid]) bad.push('막사 person ' + u.mid + ' fights'); if (u.bear && sbIds[u.bear]) bad.push('막사 person ' + u.bear + ' fights as 가주'); ['hp', 'atk', 'def', 'L'].forEach(k => { if (!isFinite(+u[k])) bad.push('spec ' + u.id + ' ' + k + ' ' + u[k]); }); });
    const want = ids.length + D.mercsOf(s, hid).length;
    if (specs.length !== want && !(s.chars[hid] && (s.chars[hid].vac || s.chars[hid].down))) bad.push('specs ' + specs.length + ' ≠ houses ' + ids.length + ' + kin ' + D.mercsOf(s, hid).length);
  }
  return bad;
};
