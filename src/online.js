// 열 개의 깃발 — 온라인: 「모험가 현황」(다른 플레이어의 공개 기록)과 계정 클라우드 저장.
// claude.ai 아티팩트 런타임(claude.use)이 있을 때만 켜진다. 없거나 null 이면 안내 글만 — 게임은 전혀 영향받지 않는다.
// 쓰는 곳: db `players/<user.id()>` (공개, opt-in), db `data/users/<user.id()>/save` (본인만), room presence(지금 접속 중).
// 백엔드 어댑터: 기본은 claude.ai 런타임(아래 claudeBE). web 판(Firebase)은 online_fb.js 가 먼저 DS.OnlineBE 를 깔아 두면 그것을 쓴다 — 같은 db 모양(doc/collection/onSnapshot)이라 나머지는 그대로.
// 계정 이름·사진은 어디에도 저장하지 않는다. 남이 올린 글은 믿지 않는다: 길이·숫자 범위를 걸러 esc 로만 그린다.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
if (typeof window === 'undefined' || typeof document === 'undefined') return;
var KEY = (DS.Save && DS.Save.KEY) || 'tenbanners_v1', BAK = KEY + '_cloudbak';
var GAP = 60000, UPGAP = 60000, WAIT = 10000, MAXDOC = 240 * 1024, SHOW = 100;      // r10: 자동 클라우드 저장 문지기 60초 → 3분 (UPGAP — Spark 쓰기 한도, SPEC §1-5). 공개 기록은 60초 그대로
var O = DS.Online = { st: 'wait', db: null, user: null, room: null, uid: null, canW: null,
  players: [], plState: 'idle', peers: [], sort: 'prog',
  lastPubAt: 0, pubSig: null, pubT: null, pubBusy: false, pubErr: '',
  cloud: null, cloudState: 'idle', lastUpAt: 0, upT: null, upBusy: false, dirty: false, lastRaw: null, conflict: null, cloudErr: '', mute: false };

// ── 작은 도우미 ──
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function U() { return DS.ui || {}; }
function G() { return DS.G || {}; }
function toast(m, ms) { try { if (U().toast) U().toast(m, ms); } catch (e) {} }
function snd(k) { try { if (U().A) U().A(k); } catch (e) {} }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function meta() { try { return (DS.Save && DS.Save.meta()) || {}; } catch (e) { return {}; } }
function setMeta(p) { try { if (DS.Save) DS.Save.setMeta(p); } catch (e) {} }
function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function clean(v, n) { return Array.from(String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, '').trim()).slice(0, n).join(''); }
function int(v, lo, hi) { v = Math.round(+v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; }
function okId(id) { return typeof id === 'string' && /^[A-Za-z0-9_.~:@+-]{1,200}$/.test(id) && id !== '.' && id !== '..' ? id : null; }
function safe(p) { try { return Promise.resolve(p).catch(function () { return null; }); } catch (e) { return Promise.resolve(null); } }
function code(e) { return (e && e.code) || 'unavailable'; }
function ago(t) {
  if (!t) return '—';
  var d = Math.max(0, Date.now() - t) / 1000;
  if (d < 60) return '방금'; if (d < 3600) return Math.floor(d / 60) + '분 전'; if (d < 86400) return Math.floor(d / 3600) + '시간 전';
  if (d < 86400 * 30) return Math.floor(d / 86400) + '일 전';
  var D = new Date(t); return D.getFullYear() + '. ' + (D.getMonth() + 1) + '. ' + D.getDate() + '.';
}
function hm(sec) { sec = Math.max(0, Math.round(sec || 0)); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? h + '시간 ' + m + '분' : m + '분'; }
function clsName(cls, tier) { var C = DS.CLASSES && DS.CLASSES[cls]; if (!C) return ''; return (C.tiers && C.tiers[tier - C.start]) || C.name; }
function nFam() { return DS.FAMILY ? Object.keys(DS.FAMILY).length : 3; }
function nScn() { return (DS.SCENARIOS && DS.SCENARIOS.length) || 99; }
function maxTier() { return DS.MAX_TIER || 10; }

// 지금 저장의 진행 요약 (공개 기록과 클라우드 요약에 같은 모양으로)
function summary(s) {
  if (!s || !s.chars) return null;
  var hero = s.chars[s.hero] || s.chars[Object.keys(s.chars)[0]] || {}, top = 1, cleared = 0, merged = 0, k;
  for (k in s.chars) { var c = s.chars[k]; if (c && c.L) top = Math.max(top, DS.tierOfL(c.L)); }
  for (k in (s.cleared || {})) if (s.cleared[k]) cleared++;
  merged = DS.fuseUnions ? DS.fuseUnions(s).length : 0;      // 1.0.1: 묶음 수 (자유 합일)
  return { name: clean(s.name, 8) || '대장', cls: hero.cls || 'inf', tier: hero.L ? DS.tierOfL(hero.L) : 1, cleared: cleared, top: top, merged: merged, time: Math.round(+s.time || 0), zone: own(DS.ZONES, s.zone) ? s.zone : '' };
}
// 남이 올린 문서 → 그릴 수 있는 줄 (모르는 칸·엉뚱한 값은 버리거나 범위 안으로)
function rng(v, lo, hi) { return typeof v === 'number' && isFinite(v) && v === Math.floor(v) && v >= lo && v <= hi ? v : null; }
// 4.0.6: 현황판 초기화 — 시즌 번호(v)가 지금 시즌인 기록만 보인다. 옛 기록(v 1)은 지우지 않고 숨긴다. 각자 다음 접속 때 새 시즌으로 다시 올라온다
var SEASON = 2;
function row(id, d) {
  if (!okId(id) || !d || typeof d !== 'object' || d.v !== SEASON) return null;
  var cls = typeof d.cls === 'string' && own(DS.CLASSES, d.cls) ? d.cls : null; if (!cls) return null;
  var C = DS.CLASSES[cls], r = { id: id, name: clean(d.name, 12) || '이름 없음', cls: cls, tier: rng(d.tier, C.start || 1, maxTier()), cleared: rng(d.cleared, 0, nScn()), top: rng(d.top, 1, maxTier()),
    merged: rng(d.merged, 0, nFam()), time: rng(Math.round(+d.time), 0, 1e8), at: +d.at, seen: +d.seen || 0, zone: typeof d.zone === 'string' && own(DS.ZONES, d.zone) ? d.zone : '' };
  if (r.tier == null || r.cleared == null || r.top == null || r.merged == null || r.time == null || r.top < r.tier) return null;      // 범위 밖 숫자가 하나라도 있으면 그 문서는 믿지 않는다 (순위를 부풀린 글 거르기)
  if (!(r.at > 1.6e12 && r.at < Date.now() + 864e5)) r.at = 0;
  if (!(r.seen > 1.6e12 && r.seen < Date.now() + 864e5)) r.seen = 0;
  return r;
}
function cloudSum(d) { var r = d && d.sum && typeof d.sum === 'object' ? row('x', Object.assign({}, d.sum, { v: SEASON })) : null; return r; }      // 저장 요약은 시즌과 상관없다

// ── 백엔드별 글: 기본(claude.ai). web 판은 BE.T 로 덮는다 ──
var T = {
  nope: '<p class="hint onl-no">여기서는 현황이 안 보입니다. 로그인한 상태로 열면 보입니다. 게임은 그대로 됩니다.</p>',
  pubNoId: '이 보기에서는 계정을 몰라 못 올립니다. 목록은 보입니다.',
  pubOff: '로그인한 상태로 열면 내 기록도 올라갑니다.',
  pubDenied: '보기 전용 링크라 기록은 못 올립니다. 목록은 보입니다.',
  pubWho: '대장 이름과 진행이 이 링크를 가진 모두에게 보입니다.',
  cloudNoId: '이 화면에서는 계정을 알 수 없어 쓸 수 없습니다. 로그인한 상태로 여세요.',
  cloudOff: '로그인한 상태로 열면 저장이 계정에 올라가 다른 기기에서 이어 합니다.',
  cloudDenied: '보기 전용 링크라 클라우드 저장을 못 씁니다.',
  foot: '모험가의 대장 이름과 진행만 보입니다. 계정 이름은 올리지 않습니다.',
  askWho: '이 게임 링크를 가진 모든 사람에게', askNot: '계정 이름, 사진, 메일은 올리지 않습니다.',
  liveN: function (n) { return n ? '지금 다른 ' + n + '명이 게임을 열어 두었습니다' : '지금 게임을 연 다른 사람은 없습니다'; }
};
// claude.ai 런타임: claude.use('db'/'user'/'room') — uid 는 열 때 한 번 정해진다
var claudeBE = { name: 'claude', savePath: function (uid) { return 'data/users/' + uid + '/save'; }, savePath2: function (uid) { return 'data/users/' + uid + '/save2'; }, savePath3: function (uid) { return 'data/users/' + uid + '/save3'; }, savePath4: function (uid) { return 'data/users/' + uid + '/save4'; }, start: function () { claudeInit(); } };      // 4.0: v10 은 새 문서(save2) — 옛 문서(save)는 읽기만
var BE = DS.OnlineBE || claudeBE;
if (BE.T) for (var tk in BE.T) T[tk] = BE.T[tk];
function kind(e) { var c = code(e); return c === 'invalid_argument' || c === 'not_granted' || c === 'permission-denied' || c === 'unauthenticated' || c === 'invalid-argument' ? 'denied' : c === 'quota_exceeded' || c === 'resource-exhausted' ? 'full' : 'later'; }

// ── 런타임 잡기: claude.use 만 쓴다. 10초 안에 안 오면 없는 것으로 ──
function use(name) {
  return new Promise(function (res) {
    var done = false, t = setTimeout(function () { if (!done) { done = true; res(null); } }, WAIT);
    function fin(v) { if (done) return; done = true; clearTimeout(t); res(v || null); }
    try { Promise.resolve(window.claude.use(name)).then(fin, function () { fin(null); }); } catch (e) { fin(null); }
  });
}
function init() { BE.start(O, { ready: ready, redraw: redraw, setUser: setUser, row: row }); }
function claudeInit() {
  var C = window.claude;
  if (!C || typeof C.use !== 'function') { O.st = 'off'; return; }
  Promise.all([use('db'), use('user'), use('room')]).then(function (r) {
    O.db = r[0]; O.user = r[1]; O.room = r[2];
    if (!O.db) { O.st = 'off'; redraw(); return null; }
    return safe(O.user && O.user.id ? O.user.id() : null).then(function (id) {
      O.uid = okId(id);
      return safe(O.user && O.user.can ? O.user.can('data.write') : null);
    }).then(function (cw) {
      O.canW = cw === true ? true : cw === false ? false : null;
      O.st = 'ready';
      ready();
    });
  }).catch(function () { O.st = 'off'; redraw(); });
}
function ready() {
  try {
    if (O.uid) cloudCheck();
    if (pubOn()) { presence(true); pubKick(); }
    hornNews(); hornWatch();      // r10: 대장간 소문 (웹 판만)
  } catch (e) {}
  redraw(); titleHook();
}
// 계정이 바뀜 (web 판: 로그인·로그아웃). how === 'login' 이면 사람이 방금 로그인한 것 — 이 기기 저장과 클라우드 저장을 견준다
function setUser(uid, how) {
  uid = okId(uid);
  if (uid === O.uid && O.st === 'ready') { redraw(); titleHook(); if (uid && how === 'login') afterLogin(); return; }
  if (O.pubT) { clearTimeout(O.pubT); O.pubT = null; } if (O.upT) { clearTimeout(O.upT); O.upT = null; }
  presence(false);
  O.uid = uid; O.canW = uid ? true : false; O.st = 'ready';
  O.cloud = null; O.conflict = null; O.cloudErr = ''; O.cloudState = 'idle'; O.pubErr = ''; O.pubSig = null; O.pubAt = 0; O.lastPubAt = 0; O.lastRaw = null; O.checkAt = 0; O.warned = 0;
  if (uid) {
    var p = cloudCheck();
    if (pubOn()) { presence(true); pubKick(true); }
    if (how === 'login') p.then(afterLogin); else p.then(afterRestore);
  }
  try { hornNews(); hornWatch(); } catch (e) {}      // r10: 듣기는 로그인 없이도 된다 (이미 붙어 있으면 그대로)
  redraw(); titleHook();
}
function afterLogin() {
  if (!O.uid || O.cloudErr) return;
  var t = document.getElementById('s-title'), onTitle = !!(t && !t.hidden);
  if (O.cloud) download(onTitle, true);      // 같은 저장이면 download 가 알리고 끝낸다
  else if (lsGet(KEY) && canWrite()) {
    var loc = null; try { loc = G().save ? summary(G().save) : summary(JSON.parse(lsGet(KEY))); } catch (e) { loc = null; }
    ask(['클라우드에 올릴까요?', '<div class="ocmp">' + sumBox('클라우드', null, 0) + sumBox('이 기기', loc, 0) + '</div><p class="dim">이 계정의 클라우드에는 아직 저장이 없습니다. 올려 두면 다른 기기에서 이어 합니다.</p>'], '지금 올리기', 'gold', function () { upload(true); });
  }
}
// 1.0.8: 이미 로그인된 채로 열었을 때도 — 다른 기기에서 올린 더 새 저장이 있으면 바로 고르게 묻는다. 클라우드가 비었으면 조용히 올린다
function afterRestore() {
  if (!O.uid || O.cloudErr) return;
  var t = document.getElementById('s-title'), onTitle = !!(t && !t.hidden);
  if (O.conflict) download(onTitle, true);
  else if (!O.cloud && lsGet(KEY) && canWrite() && autoOn()) { O.dirty = true; upKick(true); }
}
// 1.0.8: 자동 올리기는 기본으로 켠다 (설정에서 끈 사람만 끔) — 전에는 기본이 꺼져 있어 다른 기기에서 이어 하지 못했다
function autoOn() { return meta().cloudAuto !== false; }
function canWrite() { return O.st === 'ready' && !!O.uid && O.canW !== false; }
function pubOn() { return !!G().save; }      // 4.0 사용자 결정: 현황 공개는 늘 켜짐 (끄기 없음). 옛 opt.pub 은 읽지 않는다
function pubNote() {      // 첫 공개 때 한 번만 한 줄 알림
  var s = G().save; if (!s || !s.opt || s.opt.pubNote) return;
  s.opt.pubNote = 1; try { if (U().persist) U().persist(); } catch (e) {}
  toast('대장 이름과 진행이 현황판에 공개된다.', 4200);
}

// ── 공개 기록: players/<uid>, 바뀌었을 때만, 최소 60초 간격 ──
function sig(sm) { return sm ? [sm.name, sm.cls, sm.tier, sm.cleared, sm.top, sm.merged, sm.zone, DS.VERSION].join('|') : ''; }      // 4.0.6: 버전이 바뀌어도 한 번 올린다
function pubKick(now) {
  if (!canWrite() || !pubOn() || O.pubErr === 'denied') return;
  pubNote();
  var sm = summary(G().save); if (!sm || (sig(sm) === O.pubSig && !now)) return;
  if (O.pubT) return;
  var wait = Math.max(0, O.lastPubAt + GAP - Date.now());
  O.pubT = setTimeout(function () { O.pubT = null; pubWrite(); }, wait);
}
function pubWrite() {
  if (O.pubBusy) { O.pubT = setTimeout(function () { O.pubT = null; pubWrite(); }, 2000); return; }
  if (!canWrite() || !pubOn()) return;
  var sm = summary(G().save); if (!sm) return;
  var body = { v: SEASON, name: sm.name, cls: sm.cls, tier: sm.tier, cleared: sm.cleared, top: sm.top, merged: sm.merged, time: sm.time, zone: sm.zone, at: Date.now(), ver: String(DS.VERSION || '') };
  O.pubBusy = true; O.lastPubAt = Date.now();
  var s0 = sig(sm);
  safeCall(function () { return O.db.doc('players/' + O.uid).set(body); }).then(function () {
    O.pubBusy = false; O.pubSig = s0; O.pubErr = ''; O.pubAt = body.at; redraw();
    if (sig(summary(G().save)) !== s0) pubKick();      // 쓰는 사이에 또 바뀌었으면 60초 뒤 한 번 더
  }, function (e) {
    O.pubBusy = false; O.pubErr = kind(e);
    redraw();
  });
}
function safeCall(f) { try { return Promise.resolve(f()); } catch (e) { return Promise.reject({ code: 'invalid_argument', message: String(e && e.message) }); } }
function presence(on) {
  if (BE.presence) { try { BE.presence(O, on); } catch (e) {} return; }
  if (!O.room || !O.room.presence) return;
  safe(O.room.presence(on ? { ds: 1, u: O.uid || null } : { ds: null, u: null }));
}

// ── 현황 목록: 처음 탭을 열 때 한 번만 구독 ──
function watch() {
  if (O.st !== 'ready') return;
  if (!O.plUnsub && O.plState !== 'err') {
    O.plState = 'loading';
    var slow = setTimeout(function () { if (O.plState === 'loading' || O.plState === 'cache') { O.plState = 'slow'; redraw(); } }, WAIT);
    try {
      O.plUnsub = O.db.collection('players').orderBy('at', 'desc').limit(200).onSnapshot(function (snap) {
        var rows = [];
        (snap.docs || []).forEach(function (d) { try { var r = d.exists === false ? null : row(d.id, d.data()); if (r) rows.push(r); } catch (e) {} });
        O.players = rows;
        if (snap.metadata && snap.metadata.fromCache) { if (O.plState === 'loading') O.plState = 'cache'; }
        else { clearTimeout(slow); O.plState = 'ok'; }
        redraw();
      }, function () { clearTimeout(slow); O.plState = 'err'; O.plUnsub = null; redraw(); });
    } catch (e) { clearTimeout(slow); O.plState = 'err'; }
  }
  if (!BE.onlineSet && O.room && !O.roomUnsub && O.room.onPeers) {
    try { O.roomUnsub = O.room.onPeers(function (ch) { O.peers = (ch && ch.peers) || []; redraw(); }, function () { O.peers = []; redraw(); }); } catch (e) { O.roomUnsub = function () {}; }
  }
}
function onlineSet() {
  if (BE.onlineSet) return BE.onlineSet(O);
  var set = {}, n = 0, seen = {};
  (O.peers || []).forEach(function (p) {
    if (!p || p.kind !== 'viewer') return;
    var id = okId(p.by) || okId(p.presence && p.presence.u);
    if (id) set[id] = 1;
    var key = id || p.peer; if (!p.isMe && !seen[key]) { seen[key] = 1; n++; }
  });
  return { ids: set, others: n };
}
function sorted() {
  var a = O.players.slice();
  if (O.sort === 'recent') a.sort(function (x, y) { return y.at - x.at; });
  else a.sort(function (x, y) { return y.merged - x.merged || y.top - x.top || y.cleared - x.cleared || y.at - x.at; });
  return a.slice(0, SHOW);
}

// ── 그리기 ──
var NOPE = T.nope;
function hasLive() { return BE.onlineSet ? true : !!O.room; }
function tabBody() {
  if (O.st === 'wait') return '<p class="hint">현황을 불러오는 중…</p>';
  if (O.st !== 'ready') return NOPE;
  var on = onlineSet(), html = '';
  // 내 기록 공개 상태
  var mine = pubOn();
  html += '<div class="row onl-me"><div class="tx"><b>내 기록 <i class="own">공개</i></b><small>' + pubLine() + '</small></div></div>';
  html += '<div class="onl-bar"><div class="seg" role="group" aria-label="정렬">' + [['prog', '진행순'], ['recent', '최근순']].map(function (x) { return '<button data-onl-sort="' + x[0] + '"' + (O.sort === x[0] ? ' aria-pressed="true"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' +
    (hasLive() ? '<small class="onl-live"><i class="onl-dot"></i>' + T.liveN(on.others) + '</small>' : '') + '</div>';
  html += hornTab();      // r10: 「오늘의 소문」 접힌 줄 (웹 판만)
  if (O.plState === 'err') return html + '<p class="hint">현황을 불러오지 못했습니다. 잠시 뒤 다시 여세요.</p>';
  if (O.plState === 'slow') html += '<p class="hint">현황 서버가 느립니다. 아래 목록은 조금 지난 것일 수 있습니다.</p>';
  var list = sorted();
  if (!list.length) return html + (O.plState === 'ok' || O.plState === 'slow' ? '<p class="hint">아직 기록을 올린 모험가가 없습니다.</p>' : '<p class="hint">현황을 불러오는 중…</p>');
  html += '<div class="onl-list">';
  list.forEach(function (r, i) {
    var me = r.id === O.uid, live = !!on.ids[r.id] || (me && hasLive() && (!BE.onlineSet || pubOn())), spr = '';
    try { spr = U().sprTag ? U().sprTag(DS.lookName(r.cls, r.tier), '', 2) : ''; } catch (e) { spr = ''; }
    html += '<div class="row orow' + (me ? ' me' : '') + '"><span class="ofig">' + spr + '</span><div class="tx"><b>' + (O.sort === 'prog' ? '<i class="ork num">' + (i + 1) + '</i>' : '') + esc(r.name) +
      (me ? ' <i class="own">나</i>' : '') + (live ? ' <i class="onl-on"><i class="onl-dot"></i>접속 중</i>' : '') + '</b>' +
      '<small>' + esc(clsName(r.cls, r.tier)) + ', ' + r.tier + '단' + (r.zone ? ', ' + esc(DS.ZONES[r.zone].name) : '') + '</small>' +
      '<small class="ost">시나리오 <b class="num">' + r.cleared + '</b>, 최고 <b class="num">' + r.top + '</b>단, 합일 <b class="num">' + r.merged + '</b>, ' + hm(r.time) + '</small></div>' +
      '<small class="oago">' + ago(r.at) + '</small></div>';
  });
  if (O.players.length > SHOW) html += '<p class="hint">' + SHOW + '명까지 보여 줍니다.</p>';
  return html + '</div><p class="hint">' + T.foot + '</p>';
}
function pubLine() {
  if (O.st === 'ready' && !O.uid) return T.pubNoId;
  if (!O.uid) return T.pubOff;
  if (O.canW === false || O.pubErr === 'denied') return T.pubDenied;
  if (O.pubErr === 'full') return '현황 저장 공간이 가득 찼습니다.';
  if (O.pubErr === 'later') return '올리지 못했습니다. 다음 저장 때 다시 올립니다.';
  return O.pubAt ? '마지막으로 올린 때: ' + ago(O.pubAt) + ', 진행이 바뀌면 1분에 한 번까지 올립니다' : '진행이 바뀌면 1분에 한 번까지 올립니다';
}
function cloudLine() {
  if (O.st === 'wait') return '읽는 중…';
  if (O.st === 'ready' && !O.uid) return T.cloudNoId;
  if (O.st !== 'ready' || !O.uid) return T.cloudOff;
  if (O.canW === false || O.cloudErr === 'denied') return T.cloudDenied;
  if (O.cloudState === 'loading') return '클라우드 저장을 읽는 중…';
  if (O.cloudErr === 'big') return '저장이 너무 커서 올리지 못했습니다.';
  if (O.cloudErr === 'later') return '클라우드에 연결하지 못했습니다. 잠시 뒤 다시 하세요.';
  if (O.conflict) return '<span class="warn">다른 기기에서 올린 더 새 저장이 있습니다 (' + ago(O.conflict.at) + ').</span> 저절로 덮어쓰지 않습니다. 불러오기나 지금 올리기를 고르세요.';
  if (!O.cloud) return '클라우드에 저장이 없습니다. 「지금 올리기」로 이 기기의 진행을 올립니다.';
  var m = meta(), mineAt = +m.cloudAt2 || 0;
  return '클라우드: ' + esc(O.cloud.sum ? O.cloud.sum.name + ', 시나리오 ' + O.cloud.sum.cleared : '저장') + ', ' + ago(O.cloud.at) + (mineAt && mineAt >= O.cloud.at - 1000 ? ' (이 기기에서 올림)' : '');
}
function optBody() {
  var dis = !canWrite() ? ' disabled' : '', auto = autoOn(), conf = O.cloudErr === 'denied';
  return (BE.acctRow ? BE.acctRow(O) : '') + '<div class="row"><div class="tx"><b>모험가 현황 <i class="own">늘 공개</i></b><small>' + pubLine() + '</small></div></div>' +
    '<div class="row onl-cloud"><div class="tx"><b>클라우드 저장</b><small>' + cloudLine() + '</small></div>' +
      '<div class="btns"><button class="btn small" data-onl="up"' + (dis || (conf ? ' disabled' : '')) + '>지금 올리기</button><button class="btn small" data-onl="down"' + (dis || (O.cloud ? '' : ' disabled')) + '>불러오기</button></div></div>' +
    '<div class="row"><div class="tx"><b>자동으로 올리기</b><small>저장할 때 1분에 한 번, 화면을 벗어날 때 올립니다. 다른 기기의 더 새 저장은 덮어쓰지 않습니다.</small></div><button class="btn small' + (auto ? ' gold' : '') + '" data-onl="auto"' + dis + '>' + (auto ? '켬' : '끔') + '</button></div>' +
    hornOpt() + (BE.optMore ? BE.optMore(O) : '');      // r10: 대장간 소문 듣기·내 소식 알리기 / 웹 판 우편함 줄
}
var drawQ = false;
function redraw() {
  if (drawQ) return; drawQ = true;
  (window.requestAnimationFrame || setTimeout)(function () {
    drawQ = false;
    try {
      var b = document.getElementById('onlBox'); if (b) { b.innerHTML = tabBody(); if (U().hydrate) U().hydrate(b); }
      var p = document.getElementById('onlOpt'); if (p) p.innerHTML = optBody();
      var t = document.getElementById('btnCloud'); if (t) titleHook();
    } catch (e) {}
  });
}
// ui.js 의 메뉴 탭·설정 탭이 부른다 (HTML 글을 돌려준다)
O.ask = ask; O.T = T; O.esc = esc; O.redraw = redraw;
O.sumOf = summary; O.sumBox = sumBox; O.upAsk = function () { upAsk(); }; O.canWrite = canWrite;      // r7 migrate: 이사 창이 같은 요약 상자·올리기 흐름을 쓴다
O.cloudGet = function () { if (O.st !== 'ready' || !O.uid || !O.db) return Promise.resolve(null); return cget().then(function (d) { return d && typeof d.data === 'string' ? { raw: d.data, at: +d.at || 0, sum: cloudSum(d), old: d.src === 'old' } : null; }, function () { return null; }); };
O.tab = function () { setTimeout(watch, 0); try { return '<div id="onlBox" class="onl">' + tabBody() + '</div>'; } catch (e) { return NOPE; } };
O.opt = function () { if (O.st === 'ready' && O.uid && O.cloudState !== 'loading' && Date.now() - (O.checkAt || 0) > 30000) setTimeout(cloudCheck, 0);      // 설정을 열 때 클라우드 쪽을 다시 본다 (다른 기기에서 올렸는지)
  try { return '<h4>온라인</h4><div id="onlOpt" class="onl">' + optBody() + '</div>'; } catch (e) { return ''; } };

// ── 클라우드 저장: data/users/<uid>/save (본인만 읽고 쓴다) ──
function cref() { return O.db.doc(BE.savePath(O.uid)); }      // 옛 문서 (3.x 판이 쓰는 곳 — 4.0 은 읽기만, 또는 새 칸 병합 쓰기)
O.docPath = function (uid) { return BE.savePath4 ? BE.savePath4(uid) : BE.savePath(uid) + '_v4'; };      // 2.1.0: 클라우드 저장 문서 (saves4 · 시험 t47 이 읽는다)
function cref2() { return O.db.doc(O.docPath(O.uid)); }      // 2.1: 다시 새로 시작 (saves4)      // r42 (2.0.0): 새 시대의 문서 (saves3) — 옛 문서(saves2 · saves)는 보관만 한다
// 4.0 (설계서 ②-2-1): 클라우드 읽기 — 새 문서가 있으면 그것, 없으면 옛 문서의 새 칸(병합 쓰기로 올린 것, data2), 그것도 없으면 옛 문서(옛 판 저장 — 「옛 판 저장 가져오기」)
//   돌려주는 것: { data, v, at, ver, sum, src: 'new' | 'merged' | 'old' } 또는 null
function cget() {
  return safeCall(function () { return cref2().get(); }).then(function (snap) {
    var d = snap && snap.exists ? snap.data() : null;
    if (d && typeof d.data === 'string') { d.src = 'new'; return d; }
    return null;      // r42: 옛 문서는 읽지 않는다 (새 시대 — 이어 하지 않는다)
  }, function () { return null; });
}
function oldGet() {
  return safeCall(function () { return cref().get(); }).then(function (snap) {
    var d = snap && snap.exists ? snap.data() : null; if (!d) return null;
    if (typeof d.data2 === 'string') return { data: d.data2, v: +d.v2 || 0, at: +d.at2 || 0, ver: d.ver2, sum: d.sum2 || {}, src: 'merged' };
    if (typeof d.data === 'string') { var o = {}; for (var k in d) o[k] = d[k]; o.src = 'old'; return o; }
    return null;
  });
}
// 올리기: 새 문서에만 (㉑ — 옛 문서는 읽기 전용 보관. 보안 규칙이 새 문서를 막는 호스트면 올리기가 실패로 끝난다. 옛 문서에 병합 쓰기는 하지 않는다)
function cput(body) {
  return safeCall(function () { return cref2().set(body); }).then(function () { O.mode = 'new'; return true; });
}
function cloudCheck() {
  if (!canWrite() && !O.uid) return Promise.resolve(null);
  O.cloudState = 'loading'; O.checkAt = Date.now();
  return cget().then(function (d) {
    O.cloud = d && typeof d.data === 'string' ? { at: +d.at || 0, v: +d.v || 0, ver: clean(d.ver, 16), sum: cloudSum(d), size: d.data.length, old: d.src === 'old' } : null;
    O.cloudState = 'ok'; O.cloudErr = '';
    var mineAt = +meta().cloudAt2 || 0;
    O.conflict = O.cloud && !O.cloud.old && lsGet(KEY) && O.cloud.at > mineAt + 1000 ? O.cloud : null;      // 4.0: 옛 판 문서는 겨루지 않는다 (가져오기로만)      // 이 기기가 올리거나 받은 뒤에(한 번도 맞춘 적 없으면 언제든) 다른 곳에서 올라온 저장이 있다
    redraw(); titleHook();
    return d;
  }, function (e) { O.cloudState = 'err'; O.cloudErr = kind(e) === 'denied' ? 'denied' : 'later'; redraw(); return null; });
}
function bytes(t) { try { return new TextEncoder().encode(t).length; } catch (e) { return t.length * 3; } }      // db 문서 한도(256 KiB)는 UTF-8 바이트로
function localRaw() { try { if (G().save && U().persist) { O.mute = true; U().persist(); } } catch (e) {} O.mute = false; return lsGet(KEY); }
function upload(manual) {
  if (O.upBusy || !canWrite()) return Promise.resolve(false);
  if (O.cloud && !O.cloud.old && +O.cloud.v > (+DS.SAVE_V || 0)) { if (manual) toast(DS.NEWER_MSG, 4200); return Promise.resolve(false); }      // 클라우드에 더 새 판의 저장이 있으면 옛 판이 덮어쓰지 않는다
  var raw = localRaw(), s = G().save;
  if (s && DS.onlineCanUpload && !DS.onlineCanUpload(s)) { if (manual) toast((DS.LORE && DS.LORE.gen && DS.LORE.gen.up) || '스무 해 창을 닫은 뒤에 올릴 수 있다.', 3600); return Promise.resolve(false); }      // 3.3.0: 스무 해 창 동안은 올리지 않는다
  if (!raw) { if (manual) toast('올릴 저장이 없습니다'); return Promise.resolve(false); }
  if (bytes(raw) > (BE.maxDoc || MAXDOC)) { O.cloudErr = 'big'; redraw(); if (manual) toast('저장이 너무 커서 올리지 못했습니다'); return Promise.resolve(false); }
  var sm = null; try { sm = summary(s || JSON.parse(raw)); } catch (e) {}
  var body = { v: +(DS.SAVE_V || 0), ver: String(DS.VERSION || ''), at: Date.now(), data: raw, sum: sm || {} };
  O.upBusy = true;
  return cput(body).then(function () {
    O.upBusy = false; O.lastUpAt = Date.now(); O.dirty = false; O.lastRaw = raw; O.conflict = null; O.cloudErr = '';
    O.cloud = { at: body.at, v: body.v, ver: body.ver, sum: cloudSum(body), size: raw.length };
    setMeta({ cloudAt2: body.at });      // 4.0: 옛 판(3.3)의 cloudAt 과 따로 — 옛 판으로 돌아가도 그 판의 「클라우드와 맞춤」 판단이 흔들리지 않게
    if (manual) toast('클라우드에 올렸습니다'); redraw(); return true;
  }, function (e) {
    O.upBusy = false; var c = kind(e);
    O.cloudErr = c === 'full' ? 'big' : c;
    if (manual) toast(O.cloudErr === 'denied' ? '이 권한으로는 올릴 수 없습니다' : '클라우드에 올리지 못했습니다'); redraw(); return false;
  });
}
// 자동 올리기: 올리기 전에 클라우드를 한 번 읽어, 다른 기기의 더 새 저장이면 멈추고 알린다
function autoUp() {
  if (!autoOn() || !canWrite() || O.conflict || O.upBusy) return;
  var raw = lsGet(KEY); if (!raw || raw === O.lastRaw) { O.dirty = false; return; }
  cloudCheck().then(function () {
    if (O.conflict) { if (!O.warned) { O.warned = 1; toast('다른 기기에서 올린 더 새 저장이 있습니다. 설정에서 고르세요', 4200); } return; }
    if (O.cloudErr === 'denied') return;
    upload(false);
  });
}
function upKick(soon) {
  if (!autoOn() || !canWrite() || O.upT) return;
  var wait = soon ? 0 : Math.max(0, O.lastUpAt + UPGAP - Date.now());
  O.upT = setTimeout(function () { O.upT = null; autoUp(); }, wait);
}
// 저장이 쓰일 때마다(persist 15초·지역 이동·결과 등) 한 번 들여다본다 — 쓰기는 위의 문지기(공개 60초 · 자동 저장 3분)가 거른다
function hookStore() {
  if (!DS.Save || DS.Save._onl) return;
  var orig = DS.Save.store;
  DS.Save.store = function (s) {
    var r = orig.apply(this, arguments);
    if (!O.mute && O.st === 'ready') { try { if (pubOn()) pubKick(); O.dirty = true; upKick(false); } catch (e) {} }
    return r;
  };
  DS.Save._onl = 1;
}
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) return;
  setTimeout(function () { try { if (O.dirty && autoOn() && Date.now() - O.lastUpAt > 15000) autoUp(); } catch (e) {} }, 0);      // game.js 의 persist 가 먼저 쓰도록 한 박자 뒤
});

// 불러오기: 이 기기 저장은 _cloudbak 에 떠 두고, save.js 의 read(판 올림·fixSave)를 그대로 거친다
function sumBox(t, sm, at) {
  if (!sm) return '<div class="ocol"><b>' + t + '</b><small>저장 없음</small></div>';
  return '<div class="ocol"><b>' + t + '</b><span>' + esc(sm.name) + '</span><small>' + esc(clsName(sm.cls, sm.tier)) + ', ' + sm.tier + '단</small><small>시나리오 ' + sm.cleared + ', 최고 ' + sm.top + '단, 합일 ' + sm.merged + '</small><small>플레이 ' + hm(sm.time) + '</small>' + (at ? '<small>' + ago(at) + '</small>' : '') + '</div>';
}
function ask(html, yes, cls, fn, alt) {
  var ov = U().overlay; if (!ov) return;
  var q = ov('<div class="result onl-ask"><h2>' + html[0] + '</h2>' + html[1] + '<button class="btn ' + (cls || 'gold') + ' wide" id="onlYes">' + yes + '</button>' + (alt ? '<button class="btn wide" id="onlAlt">' + alt[0] + '</button>' : '') + '<button class="btn wide" data-close>' + (alt ? '나중에' : '취소') + '</button></div>', 'modal center');
  var b = q.querySelector('#onlYes'), a = q.querySelector('#onlAlt'), done = false;
  b.addEventListener('click', function () { if (done) return; done = true; b.disabled = true; snd('ok'); q.close(); fn(); });
  if (a) a.addEventListener('click', function () { if (done) return; done = true; a.disabled = true; snd('ok'); q.close(); alt[1](); });
  return q;
}
// 새 판 저장 방호: 클라우드 문서의 v 나 그 안 저장 글의 v 가 지금 SAVE_V 보다 크면 받지도(덮지도) 않는다
function cloudNewer(d, raw) { return (d && +d.v > (+DS.SAVE_V || 0)) || !!(DS.Save && DS.Save.newer && DS.Save.newer(raw)); }
O.cloudNewer = cloudNewer; O.applyRaw = function (raw, at) { return apply(raw, at || 0, false); };      // 시험·다른 파일용 (받기 마지막 단계)
function download(fromTitle, login) {
  if (!canWrite() && !O.uid) return;
  cget().then(function (d) {
    if (!d || typeof d.data !== 'string') { toast('클라우드에 저장이 없습니다'); O.cloud = null; redraw(); return; }
    if (d.src === 'old' || (DS.Save.isOld && DS.Save.isOld(d.data))) { if (DS.openNewEra) DS.openNewEra(d.data, !!lsGet(KEY)); return; }      // ㉑ 옛 판 문서: 이어 하지 않고 「새 시대를 연다」 — 옛 문서는 읽기만 (지우지도 덮지도 않는다)
    if (cloudNewer(d, d.data)) { toast(DS.NEWER_MSG, 4200); return; }      // 묻는 창도 띄우지 않는다
    var cs = cloudSum(d), at = +d.at || 0, loc = null, lraw = lsGet(KEY);
    if (login && lraw && localRaw() === d.data) { setMeta({ cloudAt2: at }); O.conflict = null; redraw(); toast('클라우드 저장과 이 기기 저장이 같습니다'); return; }
    try { loc = G().save ? summary(G().save) : lraw ? summary(JSON.parse(lraw)) : null; } catch (e) { loc = null; }
    var newer = loc && (+meta().cloudAt2 || 0) && at < (+meta().cloudAt2 || 0) - 1000;
    var mj = meta(), just = login && loc && canWrite() && mj.mvJust && mj.mvIn && Date.now() - (+mj.mvIn.at || 0) < 7 * 864e5;      // r7 migrate: 방금 이사해 온 저장이면 「가져온 저장을 올리기」를 첫 단추로 (review A-5)
    if (login && mj.mvJust) setMeta({ mvJust: false });
    if (just) {
      ask(['방금 가져온 저장을 어떻게 할까요?', '<div class="ocmp">' + sumBox('클라우드', cs, at) + sumBox('이 기기 (방금 가져옴)', loc, 0) + '</div><p class="dim">이 계정의 클라우드에 예전 저장이 있습니다. 올리면 예전 것은 이 기기에 백업합니다.</p>'],
        '가져온 저장을 클라우드에 올리기', 'gold', function () { lsSet(KEY + '_cloudprev', d.data); upload(true); }, ['클라우드 저장 불러오기', function () { apply(d.data, at, fromTitle); }]);
      return;
    }
    var alt = login && loc && canWrite() ? ['이 기기 것으로 클라우드 덮어쓰기', function () { lsSet(KEY + '_cloudprev', d.data); upload(true); }] : null;      // 로그인 직후: 어느 쪽을 남길지 고른다 (덮어쓸 클라우드 저장도 이 기기에 떠 둔다)
    ask([d.src === 'old' ? '이전 버전 저장 가져오기' : login ? '어느 저장으로 할까요?' : '클라우드에서 불러오기', '<div class="ocmp">' + sumBox('클라우드', cs, at) + sumBox('이 기기', loc, 0) + '</div>' +
      (loc ? '<p class="warn">이 기기의 진행을 클라우드 저장으로 바꿉니다.' + (newer ? ' 이 기기 쪽이 더 새것일 수 있습니다.' : '') + '</p><p class="dim">지금 진행은 백업합니다.</p>' : '<p class="dim">클라우드 저장으로 이어 합니다.</p>')],
      login && loc ? '클라우드 저장 불러오기' : '불러오기', loc ? 'red' : 'gold', function () { apply(d.data, at, fromTitle); }, alt);
  }, function () { toast('클라우드에 연결하지 못했습니다. 잠시 뒤 다시 하세요'); });
}
function apply(raw, at, fromTitle) {
  if (cloudNewer(null, raw)) { toast(DS.NEWER_MSG, 4200); return false; }      // 이 기기 저장·백업 칸 모두 그대로
  var cur = lsGet(KEY); if (cur) lsSet(BAK, cur);
  var s = null; try { s = DS.Save.read(raw); } catch (e) { s = null; }
  if (!s) { toast('클라우드 저장을 읽지 못했습니다. 이 기기 저장은 그대로입니다', 4200); return false; }
  O.mute = true; var ok = DS.Save.store(s); O.mute = false;
  if (ok === false) { toast('이 기기에 저장하지 못했습니다. 저장 공간을 확인하세요', 4200); return false; }
  setMeta({ cloudAt2: at }); O.conflict = null; O.lastRaw = lsGet(KEY); O.dirty = false;
  var g = G();
  if (fromTitle || !g.running) {
    try { if (U().closeAll) U().closeAll(); } catch (e) {}
    g.save = s; if (DS.Audio && DS.Audio.set) DS.Audio.set({ sfx: s.opt.sfx, bgm: s.opt.bgm }); DS.startGame(); if (DS.showNews) DS.showNews();
    toast('클라우드 저장으로 이어 합니다');
  } else { g.save = null; location.reload(); }      // 하던 판은 멈추고(저장 덮어쓰기 방지) 새로 올린다
  return true;
}
function upAsk() {
  cloudCheck().then(function () {
    if (O.cloudErr === 'denied') { toast('이 권한으로는 올릴 수 없습니다'); return; }
    if (O.conflict) {
      var loc = summary(G().save);
      ask(['덮어쓸까요?', '<div class="ocmp">' + sumBox('클라우드', O.conflict.sum, O.conflict.at) + sumBox('이 기기', loc, 0) + '</div><p class="warn">다른 기기에서 올린 더 새 저장이 있습니다. 올리면 그 저장은 사라집니다.</p>'], '이 기기 것으로 덮어쓰기', 'red', function () { upload(true); });
    } else upload(true);
  });
}

// 타이틀: 이 기기에 저장이 없고 클라우드에 있으면 「클라우드에서 이어 하기」
function titleHook() { cloudBtn(); if (BE.titleHook) { try { BE.titleHook(O); } catch (e) {} } }
function cloudBtn() {
  try {
    var el = document.getElementById('s-title'), nb = document.getElementById('btnNew'), b = document.getElementById('btnCloud');
    var want = el && !el.hidden && nb && O.cloud && !lsGet(KEY);
    if (!want) { if (b) b.remove(); return; }
    var sm = O.cloud.sum, txt = '클라우드에서 이어 하기 <small>' + (sm ? esc(sm.name) + ', 시나리오 ' + sm.cleared + ', ' : '') + ago(O.cloud.at) + '</small>';
    if (!b) {
      b = document.createElement('button'); b.id = 'btnCloud'; b.className = 'btn gold wide';
      b.addEventListener('click', function () { try { if (DS.Audio && DS.Audio.unlock) DS.Audio.unlock(); } catch (e) {} snd('tap'); download(true); });
      nb.parentNode.insertBefore(b, nb); nb.classList.remove('gold');
    }
    b.innerHTML = txt;
  } catch (e) {}
}

// ── 대장간 소문 (확성기 · r10 social, 설계서 r10/online/SPEC.md §1) ──
// +4 이상 강화 성공 · +3 이상 물건이 +4 이상을 노리다 부서짐 · 7단 합일을 한 줄 띠로 알린다. 웹 판(BE.horn === true)에서만 — claude.ai 판은 듣기·올리기 모두 끈다.
// 쓰는 곳: horn/{uid} 한 사람 한 문서 덮어쓰기 { v, k 'up'|'brk'|'fuse'|'off', n, gid, name, at(서버 시각), day(한국 날짜 번호), c(그 날 몇 번째) } — 규칙이 본인·칸·서버 시각·3분·하루 5번(+4~6 은 앞 세 번)을 건다.
// 받기: 화면을 보는 동안 리스너 하나 (최근 6시간, 8건). 숨은 지 5분이면 끊는다. 남의 글은 hornRow 가 거른다(식별자만 받아 우리 표로 그린다).
// 띠: 전투·창이 없을 때만, 한 번에 하나 6초. 하루 8줄(그중 +4~6 은 3줄, 파랑은 직전 파랑 띠에서 10분), 한 사람 하루 2줄, 기다리는 줄 3개(넘치면 가장 낮은 것을 버림).
//   리스너를 붙일 때 받은 지난 소식은 가장 높은 한 건만 띠로. 띠로 못 낸 것은 현황 탭 「오늘의 소문」에 높은 순으로.
DS.HORN = DS.HORN || { min: 4, big: 7, gap: 180000, day: 5, low: 3, show: 8, showLow: 3, lowGap: 600000, queue: 3, per: 2, age: 21600000, ms: 6000, rest: 20000, drop: 300000 };
var HN = DS.HORN, HS = { unsub: null, st: 'idle', rows: {}, q: [], attachAt: 0, backUsed: false, backCand: null, band: null, bandT: null, nextAt: 0, hideT: null, pump: null, fold: false, sending: false };
var HIDE_KEY = KEY + '_hornhide';
function kstDay(ms) { return Math.floor((ms + 32400000) / 86400000); }
function hornOK() { return BE.horn === true && O.st === 'ready' && !!O.db; }
function sopt() { var s = G().save; return (s && s.opt) || {}; }
function hornInOn() { return BE.horn === true && sopt().hornIn !== false; }
function hornOutWant() { return pubOn(); }      // 4.0: 내 소식 알리기는 늘 켜짐 (듣기 끄기·숨기기는 남는다)
function hornOutOn() { return hornOK() && hornOutWant() && canWrite() && O.pubErr !== 'denied'; }
function hornHidden() { try { var a = JSON.parse(lsGet(HIDE_KEY) || '[]'); return Array.isArray(a) ? a.filter(okId) : []; } catch (e) { return []; } }
function hornHide(uid) { var a = hornHidden().filter(function (x) { return x !== uid; }); a.push(uid); lsSet(HIDE_KEY, JSON.stringify(a.slice(-50))); }
function beAt(d) { try { if (BE.at) return BE.at(d); } catch (e) {} return +d.at || 0; }
function famKeys() { return Object.keys(DS.FAMILY || {}); }
// 1.0.1: 합일 소식의 n = 묶음 이름이 된 가문의 병과 번호 (1~10: 그 병과 집의 이름, 11~20: 그 병과가 대장의 집 — 이름은 보낸 사람의 이름으로). 규칙(gid 빈칸, n 1~20)은 그대로
function hornCls() { return Object.keys(DS.CLASSES || {}).filter(function (k) { return !DS.CLASSES[k].master; }); }

// ── 올리기 ──
function hornSend(b) {
  if (!hornOutOn() || HS.sending) return;
  var now = Date.now(), day = kstDay(now), M = meta().horn || {}, low = b.k !== 'fuse' && b.n < HN.big;
  if (M.day !== day) M = { day: day, c: 0, at: +M.at || 0 };
  if (now - (+M.at || 0) < HN.gap || M.c >= HN.day || (low && M.c >= HN.low)) return;      // 기기에서 먼저 거른다 (규칙도 같은 것을 건다)
  var nm = clean(G().save.name, 8) || '대장', uid = O.uid, ref;
  try { ref = O.db.doc('horn/' + uid); } catch (e) { return; }
  HS.sending = true;
  safeCall(function () { return ref.get(); }).then(function (snap) {
    var d = snap && snap.exists ? snap.data() : null, at = d ? beAt(d) : 0, c = d && +d.day === day ? (+d.c || 0) + 1 : 1;
    if (at && now - at < HN.gap) { setMeta({ horn: { day: day, c: d && +d.day === day ? +d.c || 0 : 0, at: at } }); return null; }
    if (c > HN.day || (low && c > HN.low)) { setMeta({ horn: { day: day, c: c - 1, at: at } }); return null; }
    var body = { v: 1, k: b.k, n: b.n, gid: b.gid || '', name: nm, at: BE.ts ? BE.ts() : now, day: day, c: c };
    return ref.set(body).then(function () { setMeta({ horn: { day: day, c: c, at: Date.now() } }); });
  }).then(function () { HS.sending = false; }, function () { HS.sending = false; });      // 실패하면 조용히 버린다 (다시 보내지 않는다)
}
function hornEnh(res) {
  if (!res || !hornOutOn()) return;
  if (res.ok && res.to && res.to.enh >= HN.min) hornSend({ k: 'up', n: res.to.enh, gid: res.to.id });
  else if (!res.ok && res.from && res.from.enh + 1 >= HN.min) hornSend({ k: 'brk', n: res.from.enh + 1, gid: res.from.id });
}
function hornFuse(s) {
  var LF = DS.lastFuse, ids = LF && LF.ids; if (!ids || !hornOutOn()) return;
  var top = null; ids.forEach(function (id) { var c = s.chars[id]; if (c && LF.name && String(DS.flagHouse ? DS.flagHouse(s, c.cls) : '').replace(/ 가문$/, '') === LF.name && !top) top = c; });
  top = top || s.chars[ids[0]]; var i = top ? hornCls().indexOf(top.cls) : -1; if (i < 0) return;
  hornSend({ k: 'fuse', n: i + 1 + (top.id === s.hero ? 10 : 0), gid: '' });
}
// 「꺼짐」: 빈도 칸(at·day·c)은 그대로 두고 내용만 비운다 (지우기는 규칙상 막혀 있다)
function hornOff() {
  if (BE.horn !== true || !canWrite()) return;
  try { safeCall(function () { return O.db.doc('horn/' + O.uid).update({ k: 'off', n: 0, gid: '', name: '' }); }).catch(function () {}); } catch (e) {}
}
// 강화·합일을 감싼다 (ui.js·lineage.js 는 고치지 않는다). 지금 하는 판의 저장일 때만.
var enhH = DS.enhance;
if (enhH) DS.enhance = function (save, ref, rnd) { var r = enhH.apply(this, arguments); try { if (r && save && save === G().save && !rnd) hornEnh(r); } catch (e) {} return r; };
var fuseH = DS.fuse;
if (fuseH) DS.fuse = function (s, ids) { var r = fuseH.apply(this, arguments); try { if (r && s && s === G().save) hornFuse(s); } catch (e) {} return r; };

// ── 받기 ──
function hornRow(id, d) {
  if (!okId(id) || !d || typeof d !== 'object') return null;
  var k = d.k; if (k !== 'up' && k !== 'brk' && k !== 'fuse') return null;
  var n = rng(d.n, 1, 20), at = beAt(d), nm = clean(d.name, 8), now = Date.now();
  if (n == null || !nm || !(at > now - HN.age && at < now + 864e5)) return null;
  var r = { id: id, k: k, n: n, at: at, name: nm, me: id === O.uid };
  if (k === 'fuse') { var fc = hornCls()[(n - 1) % 10]; if (!fc) return null; r.cls = fc; r.lord = n > 10; return r; }
  if (typeof d.gid !== 'string' || d.gid.length > 64 || n < HN.min || n > ((DS.ENH && DS.ENH.max) || 10)) return null;
  var g = null; try { g = DS.gear(d.gid); } catch (e) { g = null; }
  if (!g || g.id !== d.gid || !(g.slot === 'w' || g.slot === 'a')) return null;
  if ((k === 'up' && g.enh !== n) || (k === 'brk' && g.enh !== n - 1)) return null;      // 식별자 끝의 +단계와 n 이 맞아야 한다
  var pl = (O.players || []).filter(function (x) { return x.id === id; })[0];
  if (pl && n > 2 * pl.top + 4) return null;      // 2.1.0: 장비에 단이 없다 — 그 사람의 최고 단에 견주어 터무니없이 높은 강화는 믿지 않는다
  r.gid = d.gid; r.g = g;
  return r;
}
function hornRank(r) { return r.k === 'fuse' ? 65 : r.n * 10 + (r.k === 'up' ? 2 : 1); }      // +10 > … > +7 > 합일 > +6 > +5 > +4, 같은 단계면 성공이 부서짐보다
function hornCmp(a, b) { return hornRank(b) - hornRank(a) || b.at - a.at; }
function hornLow(r) { return r.k !== 'fuse' && r.n < HN.big; }
function hornKey(r) { return r.id + '@' + r.at; }
function hornQ(r) {
  HS.q.push(r); HS.q.sort(hornCmp);
  while (HS.q.length > HN.queue) { var x = HS.q.pop(); if (x === HS.backCand) HS.backCand = null; }
}
function hornTake(list) {
  var hid = hornHidden(), now = Date.now();
  list.forEach(function (r) {
    var key = hornKey(r); if (HS.rows[key]) return;
    HS.rows[key] = r;
    if (r.me || hid.indexOf(r.id) >= 0) return;
    if (r.at < HS.attachAt - 30000) {      // 붙이기 전에 있던 지난 소식: 가장 높은 한 건만 띠로
      if (HS.backUsed) return;
      if (HS.backCand && hornCmp(HS.backCand, r) <= 0) return;
      if (HS.backCand) HS.q = HS.q.filter(function (x) { return x !== HS.backCand; });
      HS.backCand = r; hornQ(r); return;
    }
    hornQ(r);
  });
  var keys = Object.keys(HS.rows); if (keys.length > 60) keys.sort(function (a, b) { return HS.rows[a].at - HS.rows[b].at; }).slice(0, keys.length - 60).forEach(function (k) { delete HS.rows[k]; });
  hornPump(); redraw();
}
function hornWatch() {
  if (!hornOK() || !hornInOn() || HS.unsub || document.hidden) return;
  HS.attachAt = Date.now(); HS.backUsed = false; HS.backCand = null; HS.st = 'loading';
  try {
    HS.unsub = O.db.collection('horn').where('at', '>', new Date(Date.now() - HN.age)).orderBy('at', 'desc').limit(8).onSnapshot(function (snap) {
      var list = [];
      (snap.docs || []).forEach(function (d) { try { var r = d.exists === false ? null : hornRow(d.id, d.data()); if (r) list.push(r); } catch (e) {} });
      HS.st = 'ok'; hornTake(list);
    }, function () { HS.st = 'err'; HS.unsub = null; redraw(); });
  } catch (e) { HS.st = 'err'; HS.unsub = null; }
  if (!HS.pump) HS.pump = setInterval(hornPump, 1500);
}
function hornStop() {
  if (HS.unsub) { try { HS.unsub(); } catch (e) {} HS.unsub = null; }
  if (HS.pump) { clearInterval(HS.pump); HS.pump = null; }
  HS.q = []; HS.backCand = null; HS.st = 'idle';
}
document.addEventListener('visibilitychange', function () {
  if (document.hidden) { if (!HS.hideT && HS.unsub) HS.hideT = setTimeout(function () { HS.hideT = null; hornStop(); }, HN.drop); }
  else { if (HS.hideT) { clearTimeout(HS.hideT); HS.hideT = null; } hornWatch(); }
});

// ── 띠 내기 ──
function gameFree() {
  var g = G(), sg = document.getElementById('s-game');
  if (!sg || sg.hidden || !g.save || g.scn || (g.sim && g.sim.combat) || g.ending) return false;
  return !document.querySelector('#app .ov');      // 강화 창·이야기 창·메뉴가 열려 있으면 미룬다
}
function showState() {
  var day = kstDay(Date.now()), D = meta().hornShow;
  if (!D || D.day !== day) D = { day: day, n: 0, low: 0, lowAt: +(D && D.lowAt) || 0, per: {} };
  if (!D.per || typeof D.per !== 'object') D.per = {};
  return D;
}
function hornPump() {
  if (HS.band || !HS.q.length || Date.now() < HS.nextAt || document.hidden || !gameFree()) return;
  var D = showState(), now = Date.now(), hid = hornHidden(), pick = null;
  HS.q = HS.q.filter(function (r) {
    if (pick) return true;
    if (r.at < now - HN.age || hid.indexOf(r.id) >= 0 || D.n >= HN.show || (D.per[r.id] || 0) >= HN.per || (hornLow(r) && D.low >= HN.showLow)) { if (r === HS.backCand) { HS.backCand = null; HS.backUsed = true; } return false; }      // 오늘 몫이 끝났다 → 목록에만
    if (hornLow(r) && now - (+D.lowAt || 0) < HN.lowGap) return true;      // 파랑은 10분 간격 — 기다린다
    pick = r; return false;
  });
  if (!pick) return;
  if (pick === HS.backCand) { HS.backCand = null; HS.backUsed = true; }
  D.n++; D.per[pick.id] = (D.per[pick.id] || 0) + 1; if (hornLow(pick)) { D.low++; D.lowAt = now; }
  setMeta({ hornShow: D });
  hornBand(pick);
}
function gearPlain(g) { return String(g.short || g.name || '').replace(' +' + g.enh, ''); }
function hornHtml(r, band) {
  var who = '「' + esc(r.name) + '」';
  if (r.k === 'fuse') { var un = (r.lord ? r.name + '의' : (DS.LIN_HOUSE && DS.LIN_HOUSE[r.cls]) || (DS.CLASSES[r.cls] || {}).name || '') + ' 대가문'; return '<b class="hpre">소문, </b> ' + who + '<i class="hj">' + josaOf(r.name, '이가') + '</i> 세 가문을 묶어 8단에 올렸다. 합체 성공. <span class="hfu">' + esc(un) + '</span>'; }
  var t = DS.enhTier(r.n), en = DS.enhClass ? DS.enhClass(r.n) : 'en en' + t, nm = gearPlain(r.g);      // r12: 그래픽 2차 강화 색
  if (r.k === 'up') return '<b class="hpre">소문, </b> ' + who + '<i class="hj">' + josaOf(r.name, '이가') + '</i> 〈<span class="' + en + '">' + esc(nm) + '</span>〉' + josaOf(nm, '을를') + ' <b class="' + en + ' hn">+' + r.n + '</b>' + (r.n % 10 === 3 || r.n % 10 === 6 || r.n % 10 === 0 ? '으로' : '로') + ' 벼려 냈다';
  return '<b class="hpre">소문, </b> ' + who + '의 <span class="' + en + '">+' + (r.n - 1) + ' ' + esc(nm) + '</span>' + josaOf(nm, '이가') + ' 망치 아래 <span class="hbrk">산산조각</span> 났다. 조의를 표한다';
}
function josaOf(w, pair) { var c = String(w).charCodeAt(String(w).length - 1), has = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 > 0; return has ? pair[0] : pair[1]; }
function hornBand(r) {
  var sg = document.getElementById('s-game'); if (!sg) return;
  var el = document.getElementById('hornBand');
  if (!el) {
    el = document.createElement('div'); el.id = 'hornBand'; el.setAttribute('role', 'status');
    el.addEventListener('click', function () { if (HS.band) hornBandOff(); });      // 누르면 그 자리에서 사라진다
    longPress(el, function () { var b = HS.band; if (b) { hornBandOff(); hornAskHide(b.r); } });
    sg.appendChild(el);
  }
  var top = document.querySelector('#top .tbar'), y = top ? top.getBoundingClientRect().bottom - sg.getBoundingClientRect().top + 4 : 54;
  el.style.top = Math.max(0, Math.round(y)) + 'px';
  el.className = 'hband t' + (r.k === 'fuse' ? 'f' : DS.enhTier(r.n)) + (r.k !== 'fuse' && DS.enhStep && DS.enhStep(r.n) ? ' x' + DS.enhStep(r.n) : '') + (r.k === 'up' && r.n >= 10 ? ' flash' : '');
  el.innerHTML = '<span>' + hornHtml(r, true) + '</span>';
  HS.band = { r: r };
  void el.offsetWidth; el.classList.add('on');
  HS.bandT = setTimeout(hornBandOff, HN.ms);
}
function hornBandOff() {
  var el = document.getElementById('hornBand'); if (HS.bandT) { clearTimeout(HS.bandT); HS.bandT = null; }
  if (el) el.classList.remove('on');
  HS.band = null; HS.nextAt = Date.now() + HN.rest;
}
function longPress(el, fn) {
  var t = null, x0 = 0, y0 = 0;
  el.addEventListener('pointerdown', function (e) { x0 = e.clientX; y0 = e.clientY; t = setTimeout(function () { t = null; fn(e); }, 600); });
  el.addEventListener('pointermove', function (e) { if (t && Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 12) { clearTimeout(t); t = null; } });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (k) { el.addEventListener(k, function () { if (t) { clearTimeout(t); t = null; } }); });
  el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}
function hornAskHide(r) {
  if (!r || r.me) return;
  ask(['이 사람 소문 숨기기', '<p>「' + esc(r.name) + '」의 소문을 이 기기에서 더 보지 않는다.</p><p class="dim">설정 「온라인」에서 다시 켠다.</p>'], '숨긴다', 'red', function () {
    hornHide(r.id); HS.q = HS.q.filter(function (x) { return x.id !== r.id; }); hornBandOff(); toast('그 사람 소문을 숨겼다'); redraw();
  });
}
// 현황 탭 「오늘의 소문」: 받은 것 가운데 오늘(한국 날짜) 것, 높은 순 8줄
function hornToday() {
  var day = kstDay(Date.now()), hid = hornHidden(), a = [];
  for (var k in HS.rows) { var r = HS.rows[k]; if (kstDay(r.at) === day && hid.indexOf(r.id) < 0) a.push(r); }
  return a.sort(hornCmp).slice(0, HN.show);
}
function hornTab() {
  if (BE.horn !== true) return '';
  var list = hornToday(), on = hornInOn();
  var html = '<button class="pfold hfold' + (HS.fold ? ' on' : '') + '" data-onl="hornFold" aria-expanded="' + HS.fold + '"><b>오늘의 소문</b><small>' + (!on ? '대장간 소문 듣기가 꺼져 있다' : list.length ? '대장간에서 들려온 ' + list.length + '건' : '아직 들려온 소문이 없다. 대장간이 조용하다') + '</small><i aria-hidden="true">' + (HS.fold ? '▾' : '▸') + '</i></button>';
  if (!HS.fold) return html;
  if (!on) return html + '<p class="hint">설정 「온라인」의 「대장간 소문 듣기」를 켜면 들린다.</p>';
  if (!list.length) return html + '<p class="hint">' + (HS.st === 'err' ? '소문을 불러오지 못했다.' : '지난 6시간 동안 들려온 소문이 없다.') + '</p>';
  html += '<div class="hlist">' + list.map(function (r) { return '<div class="hrow t' + (r.k === 'fuse' ? 'f' : DS.enhTier(r.n)) + (r.k !== 'fuse' && DS.enhStep && DS.enhStep(r.n) ? ' x' + DS.enhStep(r.n) : '') + '" data-hid="' + esc(r.id) + '" data-hat="' + r.at + '"><span>' + hornHtml(r) + (r.me ? ' <i class="own">나</i>' : '') + '</span><small>' + ago(r.at) + '</small></div>'; }).join('') + '</div>';
  return html + '<p class="hint">소문은 반만 믿어라. 선대 단톡방 것은 반의반만. 길게 누르면 그 사람 소문을 숨긴다.</p>';
}
function hornOpt() {
  if (BE.horn !== true) return '';
  var inOn = hornInOn(), canOut = pubOn() && canWrite(), outOn = canOut && hornOutWant(), nh = hornHidden().length;
  return '<div class="row"><div class="tx"><b>대장간 소문 듣기</b><small>다른 모험가가 +4 이상 강화하거나 부수거나 합일하면 화면 위에 한 줄 뜹니다. 하루 8줄까지, 전투 중에는 미룹니다.' + (nh ? ' 숨긴 사람 ' + nh + '명.' : '') + '</small></div>' +
      '<div class="btns">' + (nh ? '<button class="btn small" data-onl="hornUnhide">숨김 풀기</button>' : '') + '<button class="btn small' + (inOn ? ' gold' : '') + '" data-onl="hornIn"' + (G().save ? '' : ' disabled') + '>' + (inOn ? '켬' : '끔') + '</button></div></div>' +
    '';
}
function hornNews() {}      // 4.0: 소문 올리기가 늘 켜짐이라 따로 알리지 않는다 (공개 알림 한 줄이 함께 말한다)
O.horn = { send: hornSend, row: hornRow, rank: hornRank, take: hornTake, pump: hornPump, watch: hornWatch, stop: hornStop, today: hornToday, S: HS, kstDay: kstDay };      // 시험용


// 손잡이: 메뉴 창의 클릭은 ui.js 가 받고, 우리 것(data-onl*)만 여기서
document.addEventListener('click', function (e) {
  var t = e.target && e.target.closest ? e.target.closest('[data-onl],[data-onl-sort]') : null; if (!t || t.disabled) return;
  try {
    if (t.dataset.onlSort) { O.sort = t.dataset.onlSort === 'recent' ? 'recent' : 'prog'; snd('tap'); redraw(); return; }
    var k = t.dataset.onl;
    if (k === 'hornFold') { snd('tap'); HS.fold = !HS.fold; redraw(); return; }
    if (k === 'hornIn') { snd('tap'); var so = G().save && G().save.opt; if (!so) return; so.hornIn = so.hornIn === false; try { if (U().persist) U().persist(); } catch (x) {} if (so.hornIn) hornWatch(); else hornStop(); redraw(); return; }
    if (k === 'hornUnhide') { snd('tap'); lsSet(HIDE_KEY, '[]'); toast('숨긴 소문을 다시 보인다'); redraw(); return; }
    if (k === 'up') { snd('tap'); upAsk(); return; }
    if (k === 'down') { snd('tap'); download(false); return; }
    if (k === 'auto') { snd('tap'); var on = !autoOn(); setMeta({ cloudAuto: on }); if (on) { O.dirty = true; upKick(true); } else if (O.upT) { clearTimeout(O.upT); O.upT = null; } redraw(); return; }
  } catch (x) {}
});
document.addEventListener('DOMContentLoaded', function () { setTimeout(titleHook, 60); });
(function () {      // r10: 「오늘의 소문」 줄을 길게 누르면 그 사람 소문 숨기기
  var t = null, x0 = 0, y0 = 0;
  document.addEventListener('pointerdown', function (e) {
    var row = e.target && e.target.closest ? e.target.closest('.hrow[data-hid]') : null; if (!row) return;
    x0 = e.clientX; y0 = e.clientY;
    t = setTimeout(function () { t = null; var r = HS.rows[row.dataset.hid + '@' + row.dataset.hat]; if (r) hornAskHide(r); }, 600);
  });
  document.addEventListener('pointermove', function (e) { if (t && Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 12) { clearTimeout(t); t = null; } });
  ['pointerup', 'pointercancel'].forEach(function (k) { document.addEventListener(k, function () { if (t) { clearTimeout(t); t = null; } }); });
})();

// 모양 (쓰는 곳이 이 파일뿐이라 여기에 둔다 — 기존 규칙은 건드리지 않는다)
try {
  var css = document.createElement('style'); css.id = 'onlCss';
  css.textContent = '#app .mtabs{grid-template-columns:repeat(6,minmax(0,1fr))}' +
    '.onl-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:10px 0 4px}' +
    '.onl-live{font-size:var(--fs-m);font-family:var(--f-11);color:var(--mute)}.onl-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--leaf);margin-right:5px;vertical-align:1px;box-shadow:0 0 0 2px rgba(127,207,106,.18)}' +
    '.row.orow{grid-template-columns:40px minmax(0,1fr) auto;min-height:62px;padding:8px 0}.orow .ofig{width:40px;display:grid;place-items:center}.orow .ofig canvas{max-width:40px;height:auto!important}' +
    '.orow.me{background:linear-gradient(90deg,rgba(240,182,74,.10),transparent)}.orow .ork{font-style:normal;color:var(--ember);margin-right:6px;font-size:var(--fs-m);font-family:var(--f-11)}' +
    '.orow .ost b{font-size:var(--fs-m);font-family:var(--f-11);color:var(--bone)}.orow .oago{font-size:var(--fs-m);font-family:var(--f-11);color:var(--dim);white-space:nowrap;align-self:start;padding-top:2px}' +
    '.onl-on{font-style:normal;font-weight:400;font-size:var(--fs-m);font-family:var(--f-11);color:var(--leaf);white-space:nowrap;margin-left:4px}' +
    '.result.onl-ask .ocmp{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;text-align:left}.result.onl-ask .ocol{display:grid;gap:2px;padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--ink2);min-width:0}' +
    '.result.onl-ask .ocol b{color:var(--ember);font-size:var(--fs-m);font-family:var(--f-11)}.result.onl-ask .ocol span{font-weight:700;overflow-wrap:anywhere}.result.onl-ask .ocol small{font-size:var(--fs-m);font-family:var(--f-11);color:var(--mute)}.result.onl-ask .warn{color:var(--blood)}.result.onl-ask p{text-align:left;width:100%}' +
    '.onl .btn[disabled]{opacity:.45;filter:grayscale(.6)}' +
    // r10: 대장간 소문 띠 (HUD 바로 아래 한 줄, 28px, 반투명 먹색 · 강화 색 그대로)
    '#hornBand{position:absolute;left:var(--gut-l,16px);right:var(--gut-r,16px);z-index:6;min-height:28px;display:flex;align-items:center;padding:4px 10px 4px 12px;background:#15131f;border:1px solid rgba(255,255,255,.08);border-left:3px solid var(--dim);border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.45);color:var(--bone);font-size:var(--fs-m);font-family:var(--f-11);line-height:18px;pointer-events:auto;opacity:0;transform:translateY(-8px);transition:opacity .3s,transform .3s;visibility:hidden;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
    '#hornBand.on{opacity:1;transform:none;visibility:visible}#hornBand>span{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}' +
    '#hornBand.t2,.hrow.t2{border-left-color:#5fc4ff}#hornBand.t3,.hrow.t3{border-left-color:#c58cff}#hornBand.t4,.hrow.t4{border-left-color:#ffd75e}#hornBand.tf,.hrow.tf{border-left-color:var(--ember)}#hornBand.t1,.hrow.t1{border-left-color:#dff0ff}' +
    '#hornBand.flash.on{animation:hornFlash .6s ease-out 1}@keyframes hornFlash{0%{box-shadow:0 0 0 0 rgba(255,215,94,.0);background:rgba(90,72,20,.92)}40%{box-shadow:0 0 14px 2px rgba(255,215,94,.55)}100%{box-shadow:0 2px 8px rgba(0,0,0,.45);background:#15131f}}' +
    '.hpre{color:var(--mute);font-weight:400;margin-right:2px}.hj{font-style:normal}.hbrk{color:var(--mute)}.hfu{color:var(--ember)}.hn{font-weight:700}' +
    '.hfold{margin-top:6px}.hlist{display:grid;gap:4px;padding:4px 0}.hrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:start;padding:6px 8px 6px 10px;border-left:3px solid var(--dim);border-radius:4px;background:rgba(19,17,31,.5);font-size:var(--fs-m);font-family:var(--f-11);-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
    '.hrow small{color:var(--dim);white-space:nowrap}' +
    '@media (prefers-reduced-motion: reduce){#hornBand{transition:none}#hornBand.flash.on{animation:none}}';
  (document.head || document.documentElement).appendChild(css);
} catch (e) {}

hookStore();
try { init(); } catch (e) { O.st = 'off'; }
})();
