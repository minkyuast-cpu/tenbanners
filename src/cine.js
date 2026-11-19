// 전민 — 2.2.4 사건 연출 (DS.cine). 혼인 · 출생 · 성년 · 죽음 · 가주를 잇다 · 가문이 열리다 · 공훈 계급 · 모집권 같은 큰 일을 글 한 줄로 흘려보내지 않고 짧게 보여 준다.
//   어두운 바탕 · 얼굴(들) · 리본 제목 · 한 줄 · 빛 조각. 누르면 넘긴다. 여럿이면 차례로 하나씩 (겹치지 않는다).
//   2.2.5: 읽을 것이 있는 연출(혼인 · 출생 · 죽음 · 가주를 잇다 · 가문이 열리다, 그리고 한마디 · 가훈이 붙은 것)은 누를 때까지 떠 있다 (「누르면 닫힌다」가 숨 쉰다).
//     가벼운 것(공훈 · 모집권 · 갱도 · 성년)은 보통이면 5~6초 남짓(글 길이만큼 조금 더) 뒤에 저절로 닫힌다. 「짧게」는 모두 저절로, 3.5초 남짓.
//     뜬 뒤 DS.CINE.guard(0.7초) 동안은 눌러도 닫히지 않는다 — 앞 화면에 누른 손이 연출을 곧장 넘기지 않게. 시험 손잡이 DS.cineSkip 은 막지 않는다.
//   DS.cine(ev, cb): cb 가 있으면 흐름 안의 연출(창 사이 · 바로 다음에), 없으면 「한가할 때」 — 싸움이 끝나고 창이 모두 닫힌 뒤. 한가할 때의 것은 저장(save.cineQ, 많아야 6)에 남겨 다시 켜도 잃지 않는다.
//   ev = { k: 'wed'|'birth'|'adult'|'death'|'succ'|'open'|'rank'|'ticket'|'pit', title, sub, say, note, por: [얼굴 sprTag …], old: 떠난 이 얼굴, fc: 깃발 색, crest: 문장 svg }
//   설정의 「사건 연출」: 보통 · 짧게 · 끔 (끄면 기록 · 알림 글만 남는다). 움직임 줄이기면 움직이지 않고 짧게. 싸움 중의 죽음은 따로 「죽음 연출」(death.js)이 보여 준다.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var U = DS.ui; if (!U || typeof document === 'undefined') return;
var G = DS.G, esc = U.esc;
var KINDS = { wed: '혼인', birth: '출생', adult: '성년', death: '이별', succ: '잇다', open: '새 가문', rank: '공훈', ticket: '모집권', pit: '갱도' };
var SND = { wed: 'wed', birth: 'birth', adult: 'level', death: 'cancel', succ: 'promo', open: 'promo', rank: 'level', ticket: 'coin', pit: 'star' };
var Q = [], cur = null, seenSave = null, tick = 0;
DS.CINE = { full: 5000, fullMax: 6500, perCh: 28, short: 3500, shortMax: 4200, guard: 700, max: 6, wait: { wed: 1, birth: 1, death: 1, succ: 1, open: 1 } };      // 2.2.5: full · short = 저절로 닫히는 것의 시간(ms, 글자마다 perCh 더 · Max 까지) · wait = 누를 때까지 기다리는 종류
function mode() { var o = G.save && G.save.opt; var m = o && o.cine; return m === 'short' || m === 'off' ? m : 'full'; }
DS.cineMode = mode;
var SPR = /^<i class="spr" data-spr="[\w-]+" data-pal="[^"<>&]*" data-px="[\d.]+"( data-flip="1")?><\/i>$/;
function okSpr(x) { return typeof x === 'string' && SPR.test(x) ? x : ''; }
function okSvg(x) { return typeof x === 'string' && /^<svg[\s>]/.test(x) && !/<script|on\w+=|javascript:/i.test(x) && x.length < 6000 ? x : ''; }
function str(x, n) { return typeof x === 'string' ? x.slice(0, n || 80) : ''; }
function clean(ev, raw) {      // 저장에 남는 꼴 (얼굴은 sprTag 글만). raw: 흐름 안의 것(저장하지 않는다) — 얼굴 HTML 을 그대로 (가계도 얼굴 등)
  if (!ev || !KINDS[ev.k]) return null;
  var sp = raw ? function (x) { return typeof x === 'string' ? x : ''; } : okSpr;
  return { k: ev.k, title: str(ev.title, 40), sub: str(ev.sub, 80), say: str(ev.say, 90), note: str(ev.note, 60), por: (Array.isArray(ev.por) ? ev.por : []).map(sp).filter(Boolean).slice(0, 3), old: sp(ev.old), fc: /^#[0-9a-f]{3,8}$/i.test(ev.fc || '') ? ev.fc : '', crest: okSvg(ev.crest), id: ev.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)) };
}
function store() { var s = G.save; if (!s) return; var q = Q.filter(function (e) { return !e.now; }).slice(0, DS.CINE.max).map(function (e) { var c = clean(e); return c; }); if (q.length) s.cineQ = q; else delete s.cineQ; }
function restore() {      // 저장을 불러온 뒤: 남아 있던 연출을 줄에 (같은 것은 한 번)
  var s = G.save; if (!s || s === seenSave) return; seenSave = s;
  Q = Q.filter(function (e) { return e.now; });
  (Array.isArray(s.cineQ) ? s.cineQ : []).slice(0, DS.CINE.max).forEach(function (e) { var c = clean(e); if (c) Q.push(c); });
  if (!Q.length) delete s.cineQ;
}
function battle() { return !!(G.sim && (G.sim.combat || (G.scn && !G.sim.result))); }
function quiet() { return !battle() && !document.querySelector('#app .ov:not(.ghost)') && !G.ending && !(DS.egPassOn && G.save && DS.egPassOn(G.save)); }
DS.cine = function (ev, cb) {
  restore();
  var c = clean(ev, !!cb); if (!c) { if (cb) cb(); return; }
  if (mode() === 'off') { if (cb) cb(); return; }
  if (cb) { c.now = true; c.cb = cb; }
  Q.push(c); if (!c.now) store();
  pump();
};
DS.cineQ = function () { restore(); return Q.map(function (e) { return e.k; }); };      // 시험용
DS.cineBusy = function () { return !!cur; };
DS.cineSkip = function () { if (cur) cur.end(); };      // 시험용 · 누른 것과 같다 (막는 시간 없이)
DS.cineInfo = function () { return cur ? { k: cur.ev.k, hold: cur.hold, dur: cur.dur, age: performance.now() - cur.born } : null; };      // 2.2.5 시험용: 지금 연출이 누를 때까지 기다리는가 · 저절로 닫히는 시간
function pump() {
  restore();
  if (cur || !Q.length) return;
  if (mode() === 'off') { var q = Q; Q = []; store(); q.forEach(function (e) { if (e.cb) e.cb(); }); return; }
  var i = -1, j;
  for (j = 0; j < Q.length; j++) if (Q[j].now) { i = j; break; }      // 흐름 안의 것이 먼저 (창 사이에서 기다리는 손이 있다)
  if (i < 0 && quiet()) i = 0;
  if (i < 0) return;
  var ev = Q.splice(i, 1)[0]; if (!ev.now) store();
  play(ev);
}
setInterval(function () { tick++; if (!cur && (Q.length || (G.save && G.save.cineQ && G.save !== seenSave))) pump(); }, 700);
function face(spr, cls) { return '<span class="cfa' + (cls ? ' ' + cls : '') + '">' + spr + '</span>'; }
function play(ev) {
  var calm = U.calm && U.calm(), md = mode(), C = DS.CINE, k = ev.k, chars = ((ev.title || '') + (ev.sub || '') + (ev.say || '') + (ev.note || '')).length;
  var hold = md !== 'short' && !!(C.wait[k] || ev.say);      // 2.2.5: 읽을 것이 있으면 누를 때까지
  var dur = md === 'short' ? Math.min(C.shortMax, C.short + chars * C.perCh * 0.4) : Math.min(C.fullMax, C.full + chars * C.perCh);
  var por = ev.por || [], fx = '';
  for (var n = 0; n < (k === 'death' ? 7 : 10); n++) fx += '<i style="--i:' + n + '"></i>';
  var stage = '';
  if (k === 'wed') stage = face(por[0] || '', 'cl') + '<span class="cring" aria-hidden="true"><i></i><i></i></span>' + face(por[1] || '', 'cr');
  else if (k === 'birth') stage = (por[1] ? face(por[1], 'cp cl') : '') + face(por[0] || '<i class="cbaby"></i>', 'cb') + (por[2] ? face(por[2], 'cp cr') : '');
  else if (k === 'succ') stage = face(ev.old || '<i class="cghost"></i>', 'cold') + face(por[0] || '', 'cnew');
  else if (k === 'open') stage = '<span class="cflag" aria-hidden="true"><i class="cfl">' + (ev.crest || '') + '</i></span>' + face(por[0] || '', 'cnew');
  else if (k === 'ticket') stage = '<span class="ctk" aria-hidden="true">' + (U.svg ? U.svg('ticket', 46) : '') + '</span>';
  else if (k === 'rank' || k === 'pit') stage = (por[0] ? face(por[0]) : '') + '<span class="cbadge" aria-hidden="true">' + (ev.crest || (U.svg ? U.svg('star', 34) : '')) + '</span>';
  else stage = por.map(function (p, i) { return face(p, 'c' + i); }).join('');
  var el = U.h('<div class="cine ck-' + k + (calm ? ' calm' : '') + (md === 'short' ? ' short' : '') + (hold ? ' hold' : ' auto') + '" role="dialog" aria-live="assertive" aria-label="' + esc(ev.title || KINDS[k]) + '" style="--dur:' + Math.round(dur) + 'ms;--guard:' + C.guard + 'ms' + (ev.fc ? ';--fc:' + ev.fc : '') + '">' +
    '<div class="cbd"></div><div class="cfx" aria-hidden="true">' + fx + '</div><div class="cin"><p class="cey">' + esc(KINDS[k]) + '</p><div class="cst n' + Math.max(1, por.length) + '">' + stage + '</div>' +
    '<p class="crib"><b>' + esc(ev.title || KINDS[k]) + '</b></p>' + (ev.sub ? '<p class="csub">' + esc(ev.sub) + '</p>' : '') + (ev.say ? '<q class="csay">' + esc(ev.say) + '</q>' : '') + (ev.note ? '<small class="cnote">' + esc(ev.note) + '</small>' : '') +
    '<small class="ctap">누르면 닫힌다</small></div>' + (hold ? '' : '<i class="cbar" aria-hidden="true"></i>') + '</div>');
  var app = document.getElementById('app') || document.body; app.appendChild(el);
  try { U.hydrate(el); } catch (x) {}
  G.hold = (G.hold || 0) + 1;
  try { var Au = DS.Audio, sn = SND[k] || 'star'; Au.sfx(Au.has && !Au.has(sn) ? 'star' : sn); } catch (x) {}
  var done = false, t = hold ? 0 : setTimeout(end, dur + 250), born = performance.now();
  function end() {
    if (done) return; done = true; clearTimeout(t); cur = null;
    G.hold = Math.max(0, (G.hold || 1) - 1);
    el.classList.add('out'); setTimeout(function () { el.remove(); }, calm ? 0 : 180);
    if (ev.cb) { try { ev.cb(); } catch (x) { if (DS.DEBUG) throw x; } }
    setTimeout(pump, 60);
  }
  el.addEventListener('click', function (e) { e.stopPropagation(); if (performance.now() - born > C.guard) end(); });      // 2.2.5: 뜬 뒤 잠깐은 누름을 받지 않는다
  cur = { ev: ev, el: el, end: end, hold: hold, dur: hold ? 0 : dur, born: born };
}
})();
