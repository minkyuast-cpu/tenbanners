// 전민 — 2.2.4 사건 연출 (DS.cine). 혼인 · 출생 · 성년 · 죽음 · 가주를 잇다 · 가문이 열리다 · 공훈 계급 · 모집권 같은 큰 일을 글 한 줄로 흘려보내지 않고 짧게 보여 준다.
//   어두운 바탕 · 얼굴(들) · 리본 제목 · 한 줄 · 빛 조각. 누르면 넘긴다. 여럿이면 차례로 하나씩 (겹치지 않는다).
//   2.2.5: 읽을 것이 있는 연출(혼인 · 출생 · 죽음 · 가주를 잇다 · 가문이 열리다, 그리고 한마디 · 가훈이 붙은 것)은 누를 때까지 떠 있다 (「누르면 닫힌다」가 숨 쉰다).
//     가벼운 것(공훈 · 모집권 · 갱도 · 성년)은 보통이면 5~6초 남짓(글 길이만큼 조금 더) 뒤에 저절로 닫힌다. 「짧게」는 모두 저절로, 3.5초 남짓.
//     뜬 뒤 DS.CINE.guard(0.7초) 동안은 눌러도 닫히지 않는다 — 앞 화면에 누른 손이 연출을 곧장 넘기지 않게. 시험 손잡이 DS.cineSkip 은 막지 않는다.
//   DS.cine(ev, cb): cb 가 있으면 흐름 안의 연출(창 사이 · 바로 다음에), 없으면 「한가할 때」 — 싸움이 끝나고 창이 모두 닫힌 뒤. 한가할 때의 것은 저장(save.cineQ, 많아야 6)에 남겨 다시 켜도 잃지 않는다.
//   ev = { k: 'wed'|'birth'|'adult'|'death'|'succ'|'open'|'rank'|'ticket'|'pit'|'fuse'|'ascend'|'fallx'|'wake'|'reopen', title, sub, say, note, por: [얼굴 sprTag …], old: 떠난 이 얼굴, fc: 깃발 색, crest: 문장 svg,
//     2.2.9: crests · fcs (문장 여럿과 그 빛깔 — 합일 · 깨어남), neo (새 모습), skill (새 기술 이름), names (합일한 셋의 이름) · 2.3.2 'lapse' + n (깬 시나리오 가운데 가장 뒤 번호)
//     2.6.0: 'handover' (맹주 넘기기 — old 옛 맹주 · por[0] 새 맹주 · names [옛 이름, 새 이름] · say 마지막 말 · chat + by 선대 단톡방의 한마디) · gb 「장비 N점이 가방으로 돌아왔다」 (이별 · 넘기기) }
//   설정의 「사건 연출」: 보통 · 짧게 · 끔 (끄면 기록 · 알림 글만 남는다). 움직임 줄이기면 움직이지 않고 짧게. 싸움 중의 죽음은 따로 「죽음 연출」(death.js)이 보여 준다.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var U = DS.ui; if (!U || typeof document === 'undefined') return;
var G = DS.G, esc = U.esc;
var KINDS = { wed: '혼인', birth: '출생', adult: '성년', death: '이별', succ: '잇다', open: '새 가문', rank: '공훈', ticket: '모집권', pit: '갱도', fuse: '합일', ascend: '승급', fallx: '합일한 넋', wake: '깨어남', reopen: '다시 열린 가문', boss: '강적', lapse: '스무 해', handover: '인수인계' };      // 2.6.0 handover: 살아서 맹주 자리를 넘긴다 (옛 맹주의 기운이 후계에게 건너가고, 옛 맹주는 눈을 감는다)      // 2.3.2 lapse: 대가 끊겨 이야기가 처음으로 (깬 시나리오 띠가 끝에서부터 꺼진다)      // 2.3.0 boss: 큰 몸의 보스가 처음 깨어날 때      // 2.2.9: 합일 · 9 · 10단 · 8단 위의 죽음 · 세대가 바뀌어 깨어남 · 잠들었던 가문이 다시 열림
var SND = { wed: 'wed', birth: 'birth', adult: 'level', death: 'mourn', succ: 'promo', open: 'promo', rank: 'level', ticket: 'coin', pit: 'star', fuse: 'fuse', ascend: 'fuse', fallx: 'mourn', wake: 'holy', reopen: 'fuse', boss: 'bossIn', lapse: 'mourn', handover: 'swell' };
var Q = [], cur = null, seenSave = null, tick = 0;
DS.CINE = { full: 5000, fullMax: 6500, perCh: 28, short: 3500, shortMax: 4200, guard: 700, guardK: { handover: 1600 }, max: 6, wait: { wed: 1, birth: 1, death: 1, succ: 1, open: 1, fuse: 1, ascend: 1, fallx: 1, wake: 1, reopen: 1, lapse: 1, handover: 1 } };      // 2.6.0 guardK: 종류마다 다른 막는 시간 (넘기기는 길게 누르던 손이 연출을 넘기지 않게 길게)      // 2.2.5: full · short = 저절로 닫히는 것의 시간(ms, 글자마다 perCh 더 · Max 까지) · wait = 누를 때까지 기다리는 종류
function mode() { var o = G.save && G.save.opt; var m = o && o.cine; return m === 'short' || m === 'off' ? m : 'full'; }
DS.cineMode = mode;
var SPR = /^<i class="spr" data-spr="[\w#=.,-]+" data-pal="[^"<>&]*" data-px="[\d.]+"( data-flip="1")?><\/i>$/;
function okSpr(x) { return typeof x === 'string' && SPR.test(x) ? x : ''; }
function okSvg(x) { return typeof x === 'string' && /^<svg[\s>]/.test(x) && !/<script|on\w+=|javascript:/i.test(x) && x.length < 6000 ? x : ''; }
function str(x, n) { return typeof x === 'string' ? x.slice(0, n || 80) : ''; }
function gnum(g) { g = Math.round(+g); return g >= 0 && g <= 5 ? g : -1; }      // 2.6.0: 등급 테의 등급 (숫자만 받는다)
function clean(ev, raw) {      // 저장에 남는 꼴 (얼굴은 sprTag 글만). raw: 흐름 안의 것(저장하지 않는다) — 얼굴 HTML 을 그대로 (가계도 얼굴 등)
  if (!ev || !KINDS[ev.k]) return null;
  var sp = raw ? function (x) { return typeof x === 'string' ? x : ''; } : okSpr;
  var col = function (c) { return /^#[0-9a-f]{3,8}$/i.test(c || '') ? c : ''; };
  return { k: ev.k, title: str(ev.title, 40), sub: str(ev.sub, 80), say: str(ev.say, 90), note: str(ev.note, 60), gift: str(ev.gift, 40), hl: str(ev.hl, 40), gb: str(ev.gb, 40), chat: str(ev.chat, 60), by: str(ev.by, 24), por: (Array.isArray(ev.por) ? ev.por : []).map(sp).filter(Boolean).slice(0, 3), old: sp(ev.old), fc: col(ev.fc), crest: okSvg(ev.crest), id: ev.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
    crests: (Array.isArray(ev.crests) ? ev.crests : []).map(okSvg).slice(0, 4), fcs: (Array.isArray(ev.fcs) ? ev.fcs : []).map(col).slice(0, 4), neo: sp(ev.neo), skill: str(ev.skill, 24), names: (Array.isArray(ev.names) ? ev.names : []).map(function (n) { return str(n, 16); }).filter(Boolean).slice(0, 3), n: Math.max(0, Math.min(99, Math.round(+ev.n || 0))),
    pg: (Array.isArray(ev.pg) ? ev.pg : []).map(gnum).slice(0, 3), og: gnum(ev.og), pl: ev.pl === 0 || ev.pl === 1 || ev.pl === 2 ? ev.pl : -1, ol: ev.ol ? 1 : 0, pw: (Array.isArray(ev.pw) ? ev.pw : []).map(function (w) { return typeof w === 'string' && /^[cmp]\d{1,9}$/.test(w) ? w : ''; }).slice(0, 3) };      // 2.6.0 등급 테: pg = 얼굴(por)마다의 등급 (0~5 · −1 = 모름 → 예전 테) · og = 떠난 이(old) · pl = 얼굴 가운데 맹주의 자리 · ol = 떠난 이가 맹주 · pw = 얼굴마다의 사람 열쇠 ('m12' · 'c1' · 'p3' — 같은 사람의 테를 화면마다 견주는 시험용)      // 2.3.2 n: 깬 시나리오 가운데 가장 뒤 번호 (lapse)      // 2.2.9: 문장 여럿 · 그 빛깔 · 새 모습 · 새 기술 · 세 이름
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
function wakeQ() {      // 2.2.9: 세대가 바뀌어 깨어난 가문 (save.fzWake — endgame.js DS.egStart · save.js 가 채운다) → 한가할 때 한 번
  var s = G.save, w = s && s.fzWake; if (!w || !w.length || !quiet()) return;
  delete s.fzWake;
  if (mode() === 'off') return;
  var ks = w.filter(function (k) { return DS.CLASSES[k]; }).slice(0, 4), nm = ks.map(function (k) { return String(DS.flagName ? DS.flagName(k) : k).replace(/ 가문$/, ''); });
  if (!ks.length) return;
  DS.cine({ k: 'wake', crests: ks.map(function (k) { return DS.houseCrest ? DS.houseCrest(k, 40) : ''; }), fcs: ks.map(function (k) { return DS.FLAG[k] || ''; }), title: '잠든 가문이 깨어난다', sub: nm.join(', ') + ' 가문이 기지개를 켠다', note: ks.some(function (k) { var z = s.fzShut && s.fzShut[k]; return z && z.early; }) ? '선 가문이 셋 밑으로 줄어 일찍 깨어났다. 영웅관에서 다시 열 수 있다' : '영웅관에서 다시 열 수 있다' });
  if (U.persist) try { U.persist(); } catch (x) {}
}
setInterval(function () { tick++; if (!cur) wakeQ(); if (!cur && (Q.length || (G.save && G.save.cineQ && G.save !== seenSave))) pump(); }, 700);
function face(spr, cls, g, lord, dead, who) { return '<span class="cfa' + (cls ? ' ' + cls : '') + (g >= 0 && DS.gfrCls ? ' ' + DS.gfrCls(g, { lord: lord, dead: dead }) : '') + '"' + (who ? ' data-gp="' + who + '"' : '') + '>' + spr + '</span>'; }      // 2.6.0: g 가 있으면 등급 테 (떠난 이는 테 색 그대로, 초상만 잿빛)
function play(ev) {
  var calm = U.calm && U.calm(), md = mode(), C = DS.CINE, k = ev.k, chars = ((ev.title || '') + (ev.sub || '') + (ev.say || '') + (ev.note || '') + (ev.gift || '') + (ev.hl || '') + (ev.gb || '') + (ev.chat || '')).length, guard = (C.guardK && C.guardK[k]) || C.guard;
  var hold = md !== 'short' && !!(C.wait[k] || (ev.say && k !== 'boss'));      // 2.2.5: 읽을 것이 있으면 누를 때까지 (2.3.0 강적 등장은 싸움 한가운데라 저절로 닫힌다)
  var dur = md === 'short' ? Math.min(C.shortMax, C.short + chars * C.perCh * 0.4) : Math.min(C.fullMax, C.full + chars * C.perCh);
  if (k === 'boss') dur = md === 'short' || calm ? 2400 : 3800;
  if (k === 'handover') dur = calm ? Math.max(dur, 4200) : 9000;      // 2.6.0: 「짧게」여도 기운이 다 건너가고 글이 뜰 때까지는 둔다
  var por = ev.por || [], fx = '', pg = ev.pg || [], PG = function (i) { return pg[i] == null ? -1 : pg[i]; }, PL = function (i) { return ev.pl === i; }, PW = function (i) { return (ev.pw || [])[i] || ''; }, gone = k === 'death' || k === 'fallx';
  for (var n = 0; n < (k === 'death' || k === 'fallx' || k === 'lapse' ? 7 : k === 'fuse' || k === 'ascend' ? 12 : 10); n++) fx += '<i style="--i:' + n + '"></i>';
  var stage = '';
  if (k === 'wed') stage = face(por[0] || '', 'cl', PG(0), PL(0), false, PW(0)) + '<span class="cring" aria-hidden="true"><i></i><i></i></span>' + face(por[1] || '', 'cr', PG(1), PL(1), false, PW(1));
  else if (k === 'birth') stage = (por[1] ? face(por[1], 'cp cl', PG(1), PL(1)) : '') + face(por[0] || '<i class="cbaby"></i>', 'cb', por[0] ? PG(0) : -1) + (por[2] ? face(por[2], 'cp cr', PG(2), PL(2)) : '');
  else if (k === 'succ') stage = face(ev.old || '<i class="cghost"></i>', 'cold', ev.old ? ev.og : -1, !!ev.ol, true) + face(por[0] || '', 'cnew', PG(0), PL(0), false, PW(0));
  else if (k === 'open') stage = '<span class="cflag" aria-hidden="true"><i class="cfl">' + (ev.crest || '') + '</i></span>' + face(por[0] || '', 'cnew', PG(0), PL(0));
  else if (k === 'ticket') stage = '<span class="ctk" aria-hidden="true">' + (U.svg ? U.svg('ticket', 46) : '') + '</span>';
  else if (k === 'rank' || k === 'pit') stage = (por[0] ? face(por[0], '', PG(0), PL(0)) : '') + '<span class="cbadge" aria-hidden="true">' + (ev.crest || (U.svg ? U.svg('star', 34) : '')) + '</span>';
  else if (k === 'fuse') {      // 2.2.9 합일: 세 얼굴이 가운데 빛으로 모인다 → 두 깃발은 내려가 흐려지고 대표 깃발이 오른다 → 8단 모습
    var cr = ev.crests || [], fcs = ev.fcs || [];
    stage = '<span class="cfz" aria-hidden="true"><i class="cfzl"></i>' + [0, 1, 2].map(function (i) { return '<span class="cfzb b' + i + '" style="--bc:' + (fcs[i] || ev.fc || '#f6cf57') + '"><i class="cfl">' + (cr[i] || '') + '</i></span>'; }).join('') + '</span>' +
      [0, 1, 2].map(function (i) { return face(por[i] || '', 'cfzf f' + i, PG(i), PL(i)); }).join('') + face(ev.neo || por[0] || '', 'cneo');
  }
  else if (k === 'ascend') stage = face(ev.old || '', 'cold', ev.og, !!ev.ol) + face(por[0] || '', 'cneo') + (ev.skill ? '<span class="cskl" aria-hidden="true"><i>새 기술</i><b>' + esc(ev.skill) + '</b></span>' : '');      // 9 · 10단: 새 모습과 새 고유 기술
  else if (k === 'fallx') stage = '<span class="cxr" aria-hidden="true"><i></i><i></i><i></i></span>' + face(por[0] || '', 'cxf', PG(0), PL(0), true, PW(0)) + (ev.names && ev.names.length ? '<span class="cx3">' + ev.names.map(function (n) { return '<i>' + esc(n) + '</i>'; }).join('') + '</span>' : '');      // 8단 위의 죽음: 금 테가 갈라지고 세 이름이 흩어진다
  else if (k === 'wake') stage = '<span class="cwk" aria-hidden="true">' + (ev.crests || []).map(function (c, i) { return '<span class="cfzb w' + i + '" style="--bc:' + ((ev.fcs || [])[i] || '#f6cf57') + '"><i class="cfl">' + c + '</i></span>'; }).join('') + '</span>';      // 세대가 바뀌어 잠든 가문이 깨어난다
  else if (k === 'boss') stage = '<span class="cbsr" aria-hidden="true"><i></i><i></i><i></i></span>' + face(por[0] || '', 'cbsf');      // 2.3.0 강적: 붉은 땅울림 고리 위로 큰 몸이 솟는다
  else if (k === 'lapse') stage = U.lpStrip ? U.lpStrip(ev.n || 0, true) : '';      // 2.3.2: 깬 시나리오가 끝에서부터 하나씩 꺼지고, 1번 칸만 다시 빛난다
  else if (k === 'handover') {      // 2.6.0 맹주 넘기기: 둘이 마주 선다 → 옛 맹주의 기운(가문 빛깔)이 줄지어 건너간다 → 옛 맹주는 흐려지고 굽고 쓰러진다 → 「맹주」 표가 건너가고 후계의 테가 켜진다 (por[1] 이 있으면 후계의 옛 모습에서 새 모습으로)
    var hm = '', hk = '', hi; for (hi = 0; hi < 26; hi++) hm += '<i class="chvm" style="--i:' + hi + ';--dy:' + [-30, 14, -8, 26, -20, 4, 32, -14, 20, -34, 8, -4, 28, -24, 12, -10, 34, -18, 2, 22, -28, 16, -6, 30, -16, 10][hi] + 'px"></i>';
    for (hi = 0; hi < 10; hi++) hk += '<i class="chvk" style="--i:' + hi + '"></i>';
    var hn = ev.names || [];
    stage = '<span class="chv" aria-hidden="true"><i class="chva"></i><i class="chvg"></i><i class="chvs"></i>' + hm + hk + '<i class="chvt">맹주</i></span>' +
      face(ev.old || '<i class="cghost"></i>', 'chvo') + '<span class="cfa chvn">' + (por[1] ? '<span class="chvp was">' + por[1] + '</span>' : '') + '<span class="chvp now">' + (por[0] || '') + '</span></span>' +
      (hn[0] ? '<span class="chvl o">' + esc(hn[0]) + '</span>' : '') + (hn[1] ? '<span class="chvl n">' + esc(hn[1]) + '</span>' : '');
  }
  else if (k === 'reopen') stage = '<span class="cflag rx" aria-hidden="true"><i class="cfl">' + (ev.crest || '') + '</i></span>' + face(por[0] || '', 'cnew', PG(0), PL(0));
  else stage = por.map(function (p, i) { return face(p, 'c' + i, PG(i), PL(i), gone, PW(i)); }).join('');
  var el = U.h('<div class="cine ck-' + k + (calm ? ' calm' : '') + (md === 'short' ? ' short' : '') + (hold ? ' hold' : ' auto') + '" role="dialog" aria-live="assertive" aria-label="' + esc(ev.title || KINDS[k]) + '" style="--dur:' + Math.round(dur) + 'ms;--guard:' + guard + 'ms' + (ev.fc ? ';--fc:' + ev.fc : '') + '">' +
    '<div class="cbd"></div><div class="cfx" aria-hidden="true">' + fx + '</div><div class="cin"><p class="cey">' + esc(KINDS[k]) + '</p><div class="cst n' + Math.max(1, por.length) + '">' + stage + '</div>' +
    '<p class="crib"><b>' + esc(ev.title || KINDS[k]) + '</b></p>' + (ev.sub ? '<p class="csub">' + esc(ev.sub) + '</p>' : '') + (ev.say ? '<q class="csay">' + esc(ev.say) + '</q>' : '') + (ev.chat ? '<p class="cchat">' + (ev.by ? '<b>' + esc(ev.by) + '</b>' : '') + '<span>' + esc(ev.chat) + '</span></p>' : '') + (ev.note ? '<small class="cnote">' + esc(ev.note) + '</small>' : '') + (ev.gift ? '<p class="cgift"><span class="cgi" aria-hidden="true"></span>' + esc(ev.gift) + '</p>' : '') + (ev.hl ? '<p class="chl">' + esc(ev.hl) + '</p>' : '') + (ev.gb ? '<p class="cgb">' + esc(ev.gb) + '</p>' : '') +
    '<small class="ctap">누르면 닫힌다</small></div>' + (hold ? '' : '<i class="cbar" aria-hidden="true"></i>') + '</div>');
  var app = document.getElementById('app') || document.body; app.appendChild(el);
  try { U.hydrate(el); } catch (x) {}
  G.hold = (G.hold || 0) + 1;
  try { var Au = DS.Audio, sn = SND[k] || 'star'; Au.sfx(Au.has && !Au.has(sn) ? 'star' : sn); } catch (x) {}
  var done = false, t = hold ? 0 : setTimeout(end, dur + 250), born = performance.now(), sts = [];
  if (k === 'handover' && !calm) [[900, 'qi'], [3900, 'mourn'], [4600, 'promo']].forEach(function (x) { sts.push(setTimeout(function () { try { DS.Audio.sfx(x[1]); } catch (e) {} }, x[0])); });      // 기운이 건너가고 · 쓰러지고 · 테가 켜진다
  function end() {
    if (done) return; done = true; clearTimeout(t); sts.forEach(clearTimeout); cur = null;
    G.hold = Math.max(0, (G.hold || 1) - 1);
    el.classList.add('out'); setTimeout(function () { el.remove(); }, calm ? 0 : 180);
    if (ev.cb) { try { ev.cb(); } catch (x) { if (DS.DEBUG) throw x; } }
    setTimeout(pump, 60);
  }
  el.addEventListener('click', function (e) { e.stopPropagation(); if (performance.now() - born > guard) end(); });      // 2.2.5: 뜬 뒤 잠깐은 누름을 받지 않는다
  cur = { ev: ev, el: el, end: end, hold: hold, dur: hold ? 0 : dur, born: born };
}
})();
