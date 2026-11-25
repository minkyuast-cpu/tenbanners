// 열 개의 깃발 — 소셜: 개명권 (r10 social)
//   save.rnt = 가진 개명권 수 (0~3). 새 저장·옛 저장 모두 처음 한 번 3장 (칸이 없을 때만 채운다 — SAVE_V 그대로).
//   1장으로 한 사람의 이름을 한 번 바꾼다. 대상: 대장(주인공), 용병, 대장의 아이(가계도의 미성년·성년 아이).
//   이야기 인물 아홉(world.js CAST_NAME)은 지휘관이고, 지휘관 화면 이름은 클래스명이라 지휘관 개명은 대장만.
//   바꾸면 가계도 사건 rename 한 줄({ from, to }, 글은 lore.js LINEAGE.rename), 옛 이름은 사람 기록 P.on(용병이 가계도 밖이면 m.on).
//   장비 내력(save.gh)은 이미 적힌 이름을 그대로 두고 앞으로의 손만 새 이름 (지금 든 칸은 닫고 새 이름으로 한 칸 잇는다).
//   「다음 세대의 장」을 열 때마다 1장 (DS.egStart 를 감싼다 — endgame.js 는 고치지 않는다). 운영진 우편(online_fb.js)도 DS.rnGive 로 준다.
//   save.mbox = 받은 운영진 우편 번호 (최근 50, online_fb.js 가 쓴다 — 칸 정리만 여기서).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

DS.RN = { start: 3, max: 3, len: 8, mbox: 50 };
function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function clampN(v) { v = Math.round(+v); return isFinite(v) ? Math.max(0, Math.min(DS.RN.max, v)) : 0; }
function scnN(s) { return Object.keys(s.cleared || {}).length; }

// ── 저장 칸 ──
DS.rnFix = function (s) {
  if (!s || typeof s !== 'object') return s;
  if (s.rnt == null) s.rnt = DS.RN.start; else s.rnt = clampN(s.rnt);      // 처음 한 번만 3장 (칸이 없을 때)
  if (s.mbox != null) { if (!Array.isArray(s.mbox)) s.mbox = []; s.mbox = s.mbox.filter(function (x) { return typeof x === 'string' && x.length > 0 && x.length <= 200; }).slice(-DS.RN.mbox); }
  return s;
};
DS.rnHave = function (s) { return s ? clampN(s.rnt == null ? DS.RN.start : s.rnt) : 0; };
// n 장을 준다: 상한을 넘기면 주지 않는다 (받기를 미룬다). 돌려주는 값: { ok, got, why }
DS.rnGive = function (s, n, partial) {
  if (!s) return { ok: false, got: 0, why: '저장이 없다' };
  n = Math.max(0, Math.round(+n || 0)); var have = DS.rnHave(s), room = DS.RN.max - have;
  if (!n) return { ok: true, got: 0, why: '' };
  if (room <= 0) return { ok: false, got: 0, why: '이미 ' + DS.RN.max + '장이다. 쓰고 받는다' };
  if (n > room && !partial) return { ok: false, got: 0, why: '개명권은 ' + DS.RN.max + '장까지다. ' + (n - room) + '장 쓰고 받는다' };
  var g = Math.min(n, room); s.rnt = have + g;
  return { ok: true, got: g, why: '' };
};

// ── 이름 ──
// 기존 이름 입력 규칙(새로 시작의 「용병대장의 이름」)과 같다: 앞뒤 빈칸을 걷고 8자까지. 보이지 않는 글자·제어 글자는 지운다.
DS.rnClean = function (v) { return Array.from(String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, '').replace(/\s+/g, ' ').trim()).slice(0, DS.RN.len).join(''); };
function merc(s, id) { for (var i = 0; i < (s.mercs || []).length; i++) if (s.mercs[i].id === id) return s.mercs[i]; return null; }
function P(s) { return s.lin && s.lin.P ? s.lin.P : {}; }
// 참조 { k: 'c'|'m'|'p', id } → 바꿀 수 있는 대상 { kind 'hero'|'merc'|'young', ch, m, p, name, sur } 또는 { why }
DS.rnTarget = function (s, ref) {
  if (!s || !ref) return { why: '찾을 수 없다' };
  var k = ref.k, id = +ref.id, p = null, m = null, ch = null;
  if (k === 'p') {
    p = P(s)[id]; if (!p) return { why: '기록이 없다' };
    if (p.st === 'young') return { kind: 'young', p: p, name: DS.linName ? DS.linName(s, p.id) : p.n, sur: p.sn || '', given: p.n || '' };
    if (p.st !== 'live') return { why: '떠난 사람의 이름은 바꿀 수 없다' };
    if (p.c) { k = 'c'; id = p.c; } else if (p.m) { k = 'm'; id = p.m; } else return { why: '바꿀 수 없다' };
  }
  if (k === 'c') {
    ch = s.chars && s.chars[id]; if (!ch) return { why: '찾을 수 없다' };
    if (ch.id !== s.hero) return { why: '가문 가운데 이름을 바꾸는 것은 대장뿐이다' };
    if (ch.vac) return { why: '빈자리다' };
    p = ch.pid && P(s)[ch.pid] && P(s)[ch.pid].c === ch.id ? P(s)[ch.pid] : null;
    return { kind: 'hero', ch: ch, p: p, name: DS.charName(ch), sur: '', given: DS.charName(ch) };
  }
  if (k === 'm') {
    m = merc(s, id); if (!m) return { why: '떠난 사람이다' };
    if (m.cast) return { why: '자기 가문의 이름을 잇는 사람이다. 바꿀 수 없다' };      // ⑱ 아홉 집 사람(2대 포함)은 이야기 이름 표에 묶인다
    p = m.pid && P(s)[m.pid] && P(s)[m.pid].m === m.id ? P(s)[m.pid] : null;
    return { kind: 'merc', m: m, p: p, name: p && DS.linName ? DS.linName(s, p.id) : (m.n || ''), sur: m.sn || '', given: m.n || '' };
  }
  return { why: '찾을 수 없다' };
};
// 4.0.6: 처음 태어나거나 고용된 사람은 이름을 한 번 무료로 정한다 (m.nf / P.nf). 정하면 사라진다
function isFree(t) { return !!(t && ((t.m && t.m.nf) || (t.p && t.p.nf))); }
DS.rnFree = function (s, ref) { return isFree(DS.rnTarget(s, ref)); };
function busy() { var G = DS.G; return !!(G && (G.scn || (G.sim && G.sim.combat))); }
// 바꿀 수 있나: '' 이면 된다
DS.rnWhy = function (s, ref, name) {
  var t = DS.rnTarget(s, ref); if (t.why) return t.why;
  if (DS.rnHave(s) <= 0 && !isFree(t)) return '개명권이 없다';
  if (busy()) return '싸우는 중에는 이름을 바꿀 수 없다';
  if (name === undefined) return '';
  var nm = DS.rnClean(name);
  if (!nm) return '새 이름을 입력한다';
  if (nm === t.given) return '지금 이름과 같다';
  if (DS.CAST_NAME && Object.keys(DS.CAST_NAME).some(function (k) { return DS.CAST_NAME[k] === nm; }) && !(t.m && t.m.cast)) return '이야기 인물의 이름이다. 다른 이름을 고른다';      // 1.0.1: 이야기의 아홉과 이름이 겹치지 않게
  return '';
};
function logE(s, a, x) {
  if (!s.lin || !Array.isArray(s.lin.log)) return null;
  var e = { t: 'rename', s: scnN(s), tm: Math.round(s.time || 0), a: a || 0, x: x };
  var lg = s.lin.log; lg.push(e); if (lg.length > 300) lg.splice(0, lg.length - 300);
  return e;
}
function keepOld(o, nm) { if (!nm) return; o.on = (Array.isArray(o.on) ? o.on : []).concat([nm]).slice(-8); }
// 장비 내력: 이 사람이 지금 들고 있는 칸을 닫는다 → ghTouch 가 새 이름으로 한 칸을 잇는다 (이미 적힌 이름은 그대로)
function ghClose(s, ch) {
  if (!s.gh || !ch) return;
  var key = ch.pid && P(s)[ch.pid] ? 'p' + ch.pid : 'c' + ch.id;
  ['w', 'a'].forEach(function (sl) {
    var id = ch[sl], r = id && own(s.gh, id) ? s.gh[id] : null, last = r && r.h && r.h[r.h.length - 1];
    if (last && last.p === key) last.p = key + '~';
  });
}
// 이름을 바꾼다. 돌려주는 값: { from, to, ev } 또는 null
DS.rename = function (s, ref, name) {
  if (DS.rnWhy(s, ref, name)) return null;
  var t = DS.rnTarget(s, ref), nm = DS.rnClean(name), from = t.name, pid = t.p ? t.p.id : 0;
  if (t.kind === 'hero') {
    var ch = t.ch;
    if (!t.p && DS.linOf) { try { t.p = DS.linOf(s, ch); pid = t.p ? t.p.id : 0; } catch (e) {} }
    ghClose(s, ch);
    s.name = nm; ch.name = nm;
    if (t.p) { keepOld(t.p, from); t.p.n = nm; } else keepOld(ch, from);
    if (DS.ghTouch) DS.ghTouch(s);
  } else if (t.kind === 'merc') {
    var m = t.m;
    m.n = nm; delete m.ttl;      // 아이의 호(「민규 2세」)는 새 이름에 자리를 내준다 — 그대로 두면 가계도·전장에 옛 호가 남는다
    if (t.p) { keepOld(t.p, from); t.p.n = nm; delete t.p.ttl; } else keepOld(m, from);
  } else if (t.kind === 'young') {
    keepOld(t.p, from); t.p.n = nm; delete t.p.ttl; if (t.p.ya && typeof t.p.ya === 'object') t.p.ya.n = nm;
  } else return null;
  if (isFree(t)) { if (t.m) delete t.m.nf; if (t.p) delete t.p.nf; } else s.rnt = DS.rnHave(s) - 1;
  var to = t.p && DS.linName ? DS.linName(s, t.p.id) : t.kind === 'hero' ? DS.charName(t.ch) : nm;
  var ev = logE(s, pid, { from: String(from || '').slice(0, 24), to: String(to || nm).slice(0, 24), k: t.kind });
  return { from: from, to: to, ev: ev };
};

// ── 연대기 글: 사건 rename (lineage.js 의 글 채우기는 {a}{b} 사람 번호만 알아서 여기서 채운다) ──
function hasJong(w) { var c = String(w).charCodeAt(String(w).length - 1); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0; }
function jo(w, pair) {
  if (pair === '으로') { var j = hasJong(w); return j && j !== 8 ? '으로' : '로'; }      // ㄹ 받침은 「로」
  return hasJong(w) ? pair[0] : pair[1];
}
DS.rnFill = function (t, map) {
  return String(t).replace(/\{(a|b)\}(\{(이가|은는|을를|과와|으로)\})?/g, function (all, k, j, pair) { var v = map[k] == null ? '' : String(map[k]); return v + (pair ? jo(v, pair) : ''); });
};
function rnTxt() { var L = DS.LORE && DS.LORE.lineage && DS.LORE.lineage.rename; var t = L && (typeof L === 'string' ? L : L[0]); return t || '{a}{이가} {b}{으로} 이름을 바꿨다.'; }
var ev0 = DS.linEvText;
if (ev0) DS.linEvText = function (s, e) {
  if (e && e.t === 'rename') { var x = e.x || {}; return DS.rnFill(rnTxt(), { a: x.from || '누군가', b: x.to || '' }); }
  return ev0.apply(this, arguments);
};

// ── 저장 감싸기: 새 저장·불러온 저장 모두 ──
var fx0 = DS.fixSave;
if (fx0) DS.fixSave = function (s) { var r = fx0.apply(this, arguments); if (r) DS.rnFix(r); return r; };
var nw0 = DS.newSave;
if (nw0) DS.newSave = function () { var s = nw0.apply(this, arguments); DS.rnFix(s); return s; };
// 「다음 세대의 장」을 열면 1장 (최대 3장)
var eg0 = DS.egStart;
if (eg0) DS.egStart = function (s) {
  var r = eg0.apply(this, arguments);
  if (r && s) {
    var g = DS.rnGive(s, 1);
    r.rn = g.got;
    try { if (DS.ui && DS.ui.toast) DS.ui.toast(g.got ? '새 장의 선물. 개명권 1장, 지금 ' + DS.rnHave(s) + '장' : '개명권은 ' + DS.RN.max + '장까지다. 이번 장의 개명권은 받지 못했다', 3600); } catch (e) {}
  }
  return r;
};

// ── 화면 (브라우저에서만) ──
var U = DS.ui;
if (!U || typeof document === 'undefined') return;
var esc = U.esc;
function G() { return DS.G || {}; }
// 사람 창(용병 정보·지휘관 창 주인공·가계도 사람 카드)의 작은 단추. kind 'c'|'m'|'p'
DS.rnBtn = function (k, id) {
  var s = G().save; if (!s) return '';
  var t = DS.rnTarget(s, { k: k, id: id }); if (t.why) return '';
  var n = DS.rnHave(s);
  if (isFree(t)) return '<div class="rnrow"><button class="btn small gold rnb nf" data-rn="' + k + ':' + (+id) + '"><b class="nfs" aria-hidden="true">✎</b> 이름 정하기 <i>무료 1번</i></button></div>';
  return '<div class="rnrow"><button class="btn small rnb' + (n ? '' : ' off') + '" data-rn="' + k + ':' + (+id) + '"' + (n ? '' : ' aria-disabled="true"') + '>' + (n ? '이름 바꾸기 <i>개명권 ' + n + '</i>' : '이름 바꾸기 <i>개명권이 없다</i>') + '</button></div>';
};
function ask(ref, from) {
  var s = G().save, t = DS.rnTarget(s, ref); if (t.why) { U.A('cancel'); U.toast(t.why); return null; }
  var n = DS.rnHave(s);
  var hint = t.kind === 'hero' ? '맹주의 이름이 바뀐다. 이야기와 모험가 현황에도 새 이름이 나온다.' : t.sur ? '성 「' + t.sur + '」' + (DS.josa1 ? DS.josa1(t.sur, '은는') : '은') + ' 그대로 두고 이름만 바꾼다. 「' + DS.snName(t.sur, '새 이름') + '」.' : '이름만 바꾼다.';
  var fr = isFree(t);
  var o = U.overlay('<div class="result rnq"><p class="eyebrow">' + (fr ? '✎ 처음 이름 정하기, 무료' : '개명권 ' + n + '장, 1장을 쓴다') + '</p><h2>' + (fr ? '이름 정하기' : '이름 바꾸기') + '</h2><p>' + (fr ? '추천 이름' : '지금 이름') + ' <b>' + esc(t.name) + '</b></p>' +
    '<label class="fld"><span>새 이름 (' + DS.RN.len + '자까지)</span><input id="rnName" maxlength="' + DS.RN.len + '" value="' + (fr ? esc(t.given || '') : '') + '" autocomplete="off" enterkeyhint="done"></label>' +
    '<p class="dim">' + esc(hint) + ' 가계도와 연대기에 한 줄 남고, 예전 이름은 인물 기록에 남는다.</p><p class="warn rnwhy" id="rnWhy" hidden></p>' +
    '<button class="btn gold wide" id="rnYes">바꾼다</button><button class="btn wide" data-close>취소</button></div>', 'modal center');
  var inp = o.querySelector('#rnName'), why = o.querySelector('#rnWhy'), done = false, yes = o.querySelector('#rnYes'), born = performance.now();
  function arm() { if (yes) yes.disabled = !DS.rnClean(inp.value); }      // 2.6: 아직 아무것도 적지 않았으면 「바꾼다」는 꺼져 있다 — 적기도 전에 붉은 「새 이름을 입력한다」가 뜨던 것 (앞 화면에 누른 손이 단추에 닿아도)
  arm();
  function go() {
    if (done) return;
    if (performance.now() - born < 350) return;
    if (!DS.rnClean(inp.value)) { try { inp.focus(); } catch (e) {} return; }
    if (fr && DS.rnClean(inp.value) === t.given) { done = true; if (t.m) delete t.m.nf; if (t.p) delete t.p.nf; try { U.persist(); } catch (e) {} U.A('ok'); o.close(); U.toast('추천 이름 「' + t.given + '」 그대로'); return; }      // 추천 이름 그대로 써도 된다
    var w = DS.rnWhy(G().save, ref, inp.value);
    if (w) { U.A('cancel'); why.textContent = w; why.hidden = false; return; }
    var r = DS.rename(G().save, ref, inp.value); if (!r) { U.A('cancel'); return; }
    done = true; U.A('ok'); o.close();
    try { U.persist(); } catch (e) {}
    try { if (DS.refreshUnits) DS.refreshUnits(); } catch (e) {}
    U.toast(fr ? '이름을 「' + r.to + '」' + jo(r.to, '으로') + ' 정했다' : '「' + r.from + '」 → 「' + r.to + '」, 남은 개명권 ' + DS.rnHave(G().save) + '장', 3200);
    var top = document.querySelectorAll('.ov'); for (var i = top.length - 1; i >= 0; i--) if (top[i].draw && top[i].isConnected) { top[i].draw(); break; }
  }
  o.querySelector('#rnYes').addEventListener('click', go);
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  inp.addEventListener('input', function () { why.hidden = true; arm(); });
  setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
  return o;
}
DS.rnAsk = ask;
// r32: 이름을 값없이 정할 차례면(아이·새 가주·새 대장) 묻는 창을 바로 띄운다. 창이 닫히면 cb. 아니면 cb 만
DS.nfAsk = function (ref, cb, head) {
  var s = G().save; if (!s || !DS.rnFree(s, ref) || DS.rnWhy(s, ref)) { if (cb) cb(); return null; }
  var o = ask(ref); if (!o) { if (cb) cb(); return null; }
  if (head) { var e = o.querySelector('.eyebrow'); if (e) e.textContent = '✎ ' + head; }
  var c0 = o.onclose; o.onclose = function () { if (c0) c0(); if (cb) cb(); };
  return o;
};
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest ? e.target.closest('[data-rn]') : null; if (!b) return;
  var a = String(b.dataset.rn).split(':'), ref = { k: a[0], id: +a[1] };
  try { if (DS.Audio && DS.Audio.unlock) DS.Audio.unlock(); } catch (x) {}
  if (b.classList.contains('off') && !DS.rnFree(G().save, ref)) { U.A('cancel'); U.toast('개명권이 없다'); return; }
  var w = DS.rnWhy(G().save, ref); if (w) { U.A('cancel'); U.toast(w); return; }
  U.A('tap'); ask(ref);
});
try {
  var css = document.createElement('style'); css.id = 'rnCss';
  css.textContent = '.rnrow{display:flex;justify-content:flex-end;padding:2px 0 6px}.rnrow .btn.rnb{min-height:34px;padding:0 10px;font-size:var(--fs-m);font-family:var(--f-11)}' +
    '.rnrow .btn.rnb i{font-style:normal;color:var(--mute);margin-left:6px}.rnrow .btn.rnb.off{opacity:.45;filter:grayscale(.6)}.rnrow .btn.rnb .nfs{color:#ffe27a;margin-right:4px;text-shadow:0 0 6px rgba(255,210,90,.7)}' +
    '.result.rnq .fld{width:100%;text-align:left}.result.rnq p{width:100%}.result.rnq .rnwhy{color:var(--blood)}.result.rnq b{color:var(--bone)}';
  (document.head || document.documentElement).appendChild(css);
} catch (e) {}
})();
