// 전민 戰民, 열 가문의 시대 — 2.5.0 「유품」: 가주나 맹주가 영영 떠나면 그때 들고 있던 장비 한 점이 유품이 된다
//   고르는 것: 무기가 먼저 (그 사람을 가장 닮은 것 — 늘 휘두르던 것). 무기가 없거나 무기가 이미 유품이면 방어구.
//   유품은 장비로 그대로 쓴다. 이름표 「○○의 유품」, 그 사람의 마지막 한마디(lw), 떠난 해와 곳이 내력에 붙는다.
//   같은 가문(그 사람이 섰던 가문 줄 — 깃발은 가문의 것이라 후계가 그대로 잇는다)이 들면 덤: 무기는 공격(마법 병과는 마공), 방어구는 방어(마법 병과는 마방) +3%.
//     덤은 대를 넘길 때마다 한 걸음씩 (그 가문의 다음 사람이 들다 또 떠나면 「대를 넘긴 수」 +1) — 세 걸음(+9%)에서 멈춘다. 다른 가문이 들면 보통 장비 그대로.
//   유니크 · 전설은 식별자가 거의 겹치지 않는다. 보통 장비는 같은 식별자가 저장 안에 하나뿐일 때만 유품이 된다 (같은 것이 둘이면 누구 것인지 가릴 수 없다 — 그때는 다른 칸, 없으면 유품 없음).
//   잃지 않게: 유품이 되는 순간 잠근다 (가방의 일괄 판매 · 고르기에서 빠지고, 판매 단추가 꺼진다 · 강화는 한 번 더 묻는다). 자동 장착은 제 가문의 유품을 조금(12%) 더 쳐 준다.
// 저장: save.gh[장비 식별자].hl = { n 이름, p 사람 번호, lw 마지막 한마디, y 해, at 곳, hc 가문 줄 번호, hn 가문 이름, k 'h' 맹주 | 'c' 가주, N 대를 넘긴 수, g 세대 }
//   (loot.js 내력 칸에 얹는다 — 식별자 묶음이라 같은 식별자가 둘이면 함께 유품이 된다. 보통 장비도 유품이면 내력 칸을 남긴다.) 정리는 DS.hlFix (save.js 의 fixSave 가 부른다)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
DS.HL = { step: 0.03, max: 3, prefer: 1.12 };
DS.HL_TXT = { tag: '유품', of: '{n}의 유품', pass: '대를 넘긴 수 {N}', when: '{y}년, {at}', whenY: '{y}년', whenA: '{at}', bonus: '{h} 들면 {s} +{v}%', other: '다른 가문이 들면 덤이 없다', cine: '유품: {n}의 {g}', lw: '「{lw}」' };
function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function str(x, n) { return typeof x === 'string' ? Array.from(x).slice(0, n).join('') : ''; }
var cur = null;      // 순수 함수(유닛 사양 · 점수)가 쓰는 지금 판: 화면이면 DS.G.save, 아니면 마지막으로 만지던 저장
function S(s) { return s || (DS.G && DS.G.save) || cur; }
DS.hlOf = function (s, id) { s = S(s); var r = s && s.gh && id && own(s.gh, id) ? s.gh[id] : null; return r && r.hl && typeof r.hl === 'object' ? r.hl : null; };
DS.hlStep = function (h) { return h ? Math.max(1, Math.min(DS.HL.max, Math.round(+h.N || 1))) : 0; };
function caster(cls) { var C = DS.CLASSES[cls]; return !!C && (C.dtype === 'magic' || C.kind === 'holy') && !C.martial; }
DS.hlStat = function (cls, slot) { var m = caster(cls); return slot === 'a' ? (m ? ['res', '마방'] : ['def', '방어']) : (m ? ['mag', '마공'] : ['atk', '공격']); };
// 그 가문 줄이 지금 입은 유품의 덤 { atk, mag, def, res } (배율에 더할 몫) — 다른 가문의 유품은 0
DS.hlBonus = function (s, ch) {
  s = S(s); var out = null; if (!s || !ch) return null;
  ['w', 'a'].forEach(function (sl) {
    var h = DS.hlOf(s, ch[sl]); if (!h || h.hc !== ch.id) return;
    var st = DS.hlStat(ch.cls, sl)[0]; out = out || {}; out[st] = (out[st] || 0) + DS.HL.step * DS.hlStep(h);
  });
  return out;
};
function yrNow(s) { try { return DS.calNow ? DS.calNow(s).yr : null; } catch (x) { return null; } }
function heldN(s, id) { var n = (s.gear && s.gear[id]) || 0; DS.charList(s).forEach(function (c) { if (c.w === id) n++; if (c.a === id) n++; }); return n; }
// 떠난 사람(who = { n, p, lw, at, k })이 서 있던 가문 줄 ch 의 장비로 유품을 만든다. 이미 그 가문의 유품을 들고 있었으면 대를 하나 더 넘긴다. 만든 것 { id } (없으면 null)
DS.hlMake = function (s, ch, who) {
  if (!s || !ch || !who || !who.n) return null;
  cur = s;
  if (!s.gh || typeof s.gh !== 'object' || Array.isArray(s.gh)) s.gh = {};
  if (!s.lock || typeof s.lock !== 'object' || Array.isArray(s.lock)) s.lock = {};
  var made = null;
  ['w', 'a'].forEach(function (sl) { var h = DS.hlOf(s, ch[sl]); if (h && h.hc === ch.id && !(h.p && h.p === who.p)) h.N = Math.min(99, (h.N || 1) + 1); });      // 물려받아 들던 것을 또 다음 사람에게
  ['w', 'a'].some(function (sl) {
    var id = ch[sl], g = id && DS.gear(id); if (!g || DS.hlOf(s, id) || (g.grade < 4 && heldN(s, id) > 1)) return false;      // 보통 장비는 같은 것이 둘 이상이면 누구 것인지 가릴 수 없다
    var r = own(s.gh, id) ? s.gh[id] : (s.gh[id] = { h: [] });
    var y = yrNow(s), hn = ''; try { hn = DS.flagHouse ? DS.flagHouse(s, ch.cls) || '' : ''; } catch (x) { hn = ''; }
    r.hl = { n: str(who.n, 12), p: +who.p || 0, lw: str(who.lw, 24), at: str(who.at, 24), hc: ch.id, hn: str(hn || (DS.flagName ? DS.flagName(ch.cls, s) : ''), 16), k: who.k === 'h' ? 'h' : 'c', N: 1, g: DS.egGen ? DS.egGen(s) : 1 };
    if (y != null) r.hl.y = y;
    s.lock[id] = 1;
    made = { id: id, sl: sl };
    return true;
  });
  if (DS.ghTouch) DS.ghTouch(s);
  return made;
};
DS.hlFix = function (s) {
  if (!s || !s.gh || typeof s.gh !== 'object') return s;
  for (var id in s.gh) {
    if (!own(s.gh, id)) continue; var r = s.gh[id]; if (!r || typeof r !== 'object' || r.hl == null) continue;
    var h = r.hl, g = DS.gear(id);
    if (!h || typeof h !== 'object' || Array.isArray(h) || typeof h.n !== 'string' || !h.n || !g || !(+h.hc >= 1)) { delete r.hl; if (g && g.grade < 4) delete s.gh[id]; continue; }
    var o = { n: str(h.n, 12), p: Math.max(0, Math.round(+h.p || 0)), lw: str(h.lw, 24), at: str(h.at, 24), hc: Math.round(+h.hc), hn: str(h.hn, 16), k: h.k === 'h' ? 'h' : 'c', N: Math.max(1, Math.min(99, Math.round(+h.N || 1))), g: Math.max(1, Math.round(+h.g || 1)) };
    if (h.y != null && isFinite(+h.y)) o.y = Math.round(+h.y);
    r.hl = o;
  }
  cur = s;
  return s;
};
// 죽음에 걸기: 가주(깃발을 든 부대원)는 DS.linMercDied, 맹주는 DS.linSettle (전사도 천수도)
var md0 = DS.linMercDied;
if (md0) DS.linMercDied = function (s, m, at, why) {
  var fb = m && m.h && m.o && s && s.chars && s.chars[m.o] ? s.chars[m.o] : null;
  var evs = md0.apply(this, arguments);
  if (fb) { try { var d = (evs || []).filter(function (e) { return e && e.t === 'death'; })[0], P = s.lin && s.lin.P, p = d && P ? P[d.a] : null;
    var mk = DS.hlMake(s, fb, { n: m.n || m.ttl || (p && p.n) || '', p: p ? p.id : m.pid || 0, lw: m.lw || (p && p.lw) || '', at: at || '', k: 'c' });
    if (mk && !d && typeof document !== 'undefined' && DS.ui && DS.ui.toast && DS.G && DS.G.save === s) { var tx = DS.hlCineTxt(s, -1, mk.id); if (tx) setTimeout(function () { DS.ui.toast(tx, 3200); }, 1600); }      // 가계도 밖의 가주: 이별 연출이 없으니 한 줄 알림으로
  } catch (x) { if (DS.DEBUG) throw x; } }
  return evs;
};
var ls0 = DS.linSettle;
if (ls0) DS.linSettle = function (s, at) {
  var evs = ls0.apply(this, arguments);
  try { (evs || []).forEach(function (e) {
    if (!e || e.t !== 'death' || e.k !== 'c' || e.ch == null) return;
    var ch = s.chars[e.ch], p = s.lin && s.lin.P && s.lin.P[e.a]; if (!ch || !p) return;
    var n = p.ttl || (DS.linName ? DS.linName(s, p.id) : p.n) || '';
    DS.hlMake(s, ch, { n: n, p: p.id, lw: p.lw || '', at: (p.d && p.d.at) || at || '', k: 'h' });
  }); } catch (x) { if (DS.DEBUG) throw x; }
  return evs;
};
// 전투 사양: 같은 가문이 든 유품의 덤 (규칙 칸은 그대로 — 배율만)
var cs0 = DS.cmdSpec;
if (cs0) DS.cmdSpec = function (ch, hero, who) {
  var u = cs0.apply(this, arguments), b = null; try { b = DS.hlBonus(null, ch); } catch (x) { b = null; }
  if (b && u) ['atk', 'mag', 'def', 'res'].forEach(function (k) { if (b[k] && u[k] != null) u[k] = Math.round(u[k] * (1 + b[k])); });
  return u;
};
// 자동 장착 · 「더 좋다」: 제 가문의 유품은 조금 덜 좋아도 고른다
var gs0 = DS.gearScore;
if (gs0) DS.gearScore = function (g, ch) {
  var v = gs0.apply(this, arguments); if (!g || !ch || !(v > 0)) return v;
  var h = DS.hlOf(null, g.id); return h && h.hc === ch.id ? Math.round(v * DS.HL.prefer * 10) / 10 : v;
};
var ae0 = DS.autoEquip;
if (ae0) DS.autoEquip = function (save) { if (save) cur = save; return ae0.apply(this, arguments); };
['fixSave', 'newSave'].forEach(function (k) { var f = DS[k]; if (f) DS[k] = function () { var r = f.apply(this, arguments); if (r && typeof r === 'object') cur = r; return r; }; });
// 화면 글
function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (a, k) { return o && o[k] != null ? o[k] : ''; }); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
DS.hlWhen = function (h) { if (!h) return ''; var T = DS.HL_TXT; return h.y != null && h.at ? fill(T.when, h) : h.y != null ? fill(T.whenY, h) : h.at ? fill(T.whenA, h) : ''; };
DS.hlBonusTxt = function (s, id, ch) {
  s = S(s); var h = DS.hlOf(s, id), g = DS.gear(id); if (!h || !g) return '';
  var hc = s && s.chars && s.chars[h.hc], cls = hc ? hc.cls : ch ? ch.cls : null; if (!cls) return '';
  var hn = h.hn || '그 가문', c = hn.charCodeAt(hn.length - 1), j = hn + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가');
  return fill(DS.HL_TXT.bonus, { h: j, s: DS.hlStat(cls, g.slot)[1], v: Math.round(DS.HL.step * DS.hlStep(h) * 100) });
};
DS.hlHtml = function (s, id, ch) {
  s = S(s); var h = DS.hlOf(s, id); if (!h) return '';
  var T = DS.HL_TXT, w = DS.hlWhen(h), bt = DS.hlBonusTxt(s, id, ch), other = ch && ch.id !== h.hc;
  return '<span class="lhlb"><b>' + esc(fill(T.of, h)) + '</b>' + (h.lw ? '<q>' + esc(fill(T.lw, h)) + '</q>' : '') + '<small>' + esc([w, fill(T.pass, h)].filter(Boolean).join(' · ')) + '</small>' +
    (bt ? '<small class="lhlx' + (other ? ' off' : '') + '">' + esc(bt) + (other ? ', ' + esc(T.other) : '') + '</small>' : '') + '</span>';
};
DS.hlCineTxt = function (s, pid, only) {
  s = S(s); if (!s || !s.gh || !(pid || only)) return '';
  for (var id in s.gh) { var h = DS.hlOf(s, id); if (h && (only ? id === only : h.p === pid)) { var g = DS.gear(id); if (g) return fill(DS.HL_TXT.cine, { n: h.n, g: g.short || g.name }); } }
  return '';
};
})();
