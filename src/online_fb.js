// 열 개의 깃발 — web 판(Firebase Hosting) 전용 온라인 백엔드: Google·카카오·네이버 로그인(Firebase Auth) + Firestore.
// Google = Firebase Google 제공자, 카카오 = OpenID Connect 제공자 'oidc.kakao', 네이버 = 인가 코드 → 함수(functions/naverLogin) → 커스텀 토큰('naver:<id>').
// 켤 제공자는 firebase-config.js 의 window.LOGIN_PROVIDERS. 같은 사람이라도 제공자마다 다른 계정(uid)이 된다.
// build.js 가 TARGET=web 일 때만 online.js 앞에 싣는다 (claude.ai 아티팩트 판에는 이 파일이 없다).
// online.js 는 DS.OnlineBE 가 있으면 claude.use 대신 이것을 쓴다. Firestore compat 의 doc/collection/onSnapshot 모양이 같아 나머지 흐름은 그대로.
// 쓰는 곳: players/{uid} (공개, 본인만 씀 — 지휘관 이름과 진행만), saves/{uid} (본인만), horn/{uid} (대장간 소문, online.js). 「지금 접속 중」= players 의 at/seen 이 최근 5분.
// 읽는 곳(r10): mail/{mid} 운영진 전체 우편 · mailto/{uid}/box/{mid} 개인 우편 — 읽기만 (운영자가 Firebase 콘솔에서 만든다). 받은 우편은 save.mbox 에 적어 한 번만 받는다.
// 로그인 계정의 이름·메일·사진은 Firestore 에 올리지 않는다(설정 계정 칸에서 본인에게만 보여 준다).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
if (typeof window === 'undefined' || typeof document === 'undefined') return;
var LIVE = 300000, BEAT = 180000, RKEY = 'tenbanners_fb_redirect';
var host = location.hostname, local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host);
var emu = local && /[?&]emu=1(&|$)/.test(location.search);      // 시험용: 이 컴퓨터의 Firebase 에뮬레이터에 붙는다 (?emu=1, localhost 에서만)
var cfg = window.FIREBASE_CONFIG || (emu ? { apiKey: 'demo-key', authDomain: 'demo-tenbanners.firebaseapp.com', projectId: 'demo-tenbanners' } : null);
var S = { auth: null, user: null, pending: false, beat: null, off: false, busy: false };
var NKEY = 'tenbanners_naver_state';
var P = window.LOGIN_PROVIDERS || { google: true };
var PV = { google: P.google !== false, kakao: !!P.kakao, naver: !!(P.naver && P.naverClientId && P.naverFunctionUrl) };      // 설정을 마친 제공자만 단추를 보인다
var PVN = { google: 'Google', kakao: '카카오', naver: '네이버' };
var PVL = ['google', 'kakao', 'naver'].filter(function (k) { return PV[k]; });
function pvOf(u) {
  if (!u) return ''; if (/^naver:/.test(u.uid || '')) return 'naver';
  var p = (u.providerData || [])[0], id = (p && p.providerId) || '';
  return id === 'oidc.kakao' ? 'kakao' : id === 'google.com' ? 'google' : '';
}
// 브랜드 기본 색·문구 (로고 그림 대신 글자)
function pvBtn(k, id, cls) {
  var lab = { google: '<i class="fb-g" aria-hidden="true">G</i>Google 로 로그인', kakao: '카카오 로그인', naver: '<i class="fb-n" aria-hidden="true">N</i>네이버 로그인' }[k];
  return '<button class="btn ' + cls + ' fb-pv fb-' + k + '"' + (id ? ' id="' + id + '"' : '') + ' data-fb="in" data-pv="' + k + '"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? '로그인 중…' : lab) + '</button>';
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toast(m, ms) { try { if (DS.ui && DS.ui.toast) DS.ui.toast(m, ms); } catch (e) {} }
function snd(k) { try { if (DS.ui && DS.ui.A) DS.ui.A(k); } catch (e) {} }
function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
function ssSet(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
function pubOn() { return !!(DS.G && DS.G.save); }      // 4.0: 현황 공개는 늘 켜짐
function who(u) { var n = (u && (u.displayName || (u.email || '').split('@')[0])) || ((PVN[pvOf(u)] || '') + ' 사용자').trim(); return Array.from(String(n)).slice(0, 16).join(''); }
function O() { return DS.Online || {}; }

var BE = DS.OnlineBE = {
  name: 'firebase', maxDoc: 900 * 1024,
  savePath: function (uid) { return 'saves/' + uid; },
  savePath2: function (uid) { return 'saves2/' + uid; },
  savePath3: function (uid) { return 'saves3/' + uid; },
  savePath4: function (uid) { return 'saves4/' + uid; },      // 2.1: 다시 새로 시작 — saves3 은 보관만      // r42 (2.0.0): 새 시대 — 사람마다 단·레벨. 옛 문서(saves2 · saves)는 읽지도 쓰지도 않는다 (보관)      // 4.0: v10 은 새 문서에만 (㉑ 옛 문서는 읽기 전용 보관)
  T: {
    nope: '<p class="hint onl-no">이 사이트에는 Firebase 설정이 없어 현황이 안 보입니다. 게임은 그대로 됩니다.</p>',
    noWhy: '이 사이트에는 Firebase 설정이 없어 현황을 불러오지 못합니다. 게임은 그대로 됩니다.', noBtn: '',
    pubNoId: '로그인하면 내 기록도 올라갑니다. 목록은 로그인 없이 보입니다.',
    pubOff: 'Firebase 설정이 없어 기록을 못 올립니다.',
    pubDenied: '권한이 없어 기록을 못 올렸습니다. 로그아웃했다가 다시 로그인하세요.',
    pubWho: '맹주 이름과 진행이 이 사이트를 여는 모두에게 보입니다.',
    cloudNoId: '로그인하면 저장을 계정에 올려 다른 기기에서 이어 합니다.',
    cloudOff: 'Firebase 설정이 없어 클라우드 저장을 못 씁니다.',
    cloudDenied: '권한이 없어 클라우드 저장을 못 썼습니다. 로그아웃했다가 다시 로그인하세요.',
    foot: '맹주 이름과 진행만 보입니다. 로그인 계정의 이름, 메일, 사진은 올리지 않습니다.',
    askWho: '이 사이트를 여는 모든 사람에게', askNot: '로그인 계정의 이름, 사진, 메일은 올리지 않습니다.',
    liveN: function (n) { return n ? '최근 5분 안에 다른 ' + n + '명이 접속했습니다' : '최근 5분 안에 접속한 다른 모험가는 없습니다'; }
  },
  // r10: 대장간 소문은 웹 판에서만 켠다 (claude.ai 판의 claudeBE 에는 horn 이 없다). 서버 시각으로 쓰고 읽을 때 숫자로
  horn: true,
  ts: function () { return window.firebase.firestore.FieldValue.serverTimestamp(); },
  at: function (d) { return tsMs(d && d.at); },
  optMore: function () { return mailOptRow(); },
  start: function (o, api) {
    var fb = window.firebase;
    if (!fb || !fb.initializeApp || !cfg) { S.off = true; o.st = 'off'; api.redraw(); bar(); return; }
    try {
      var app = fb.apps && fb.apps.length ? fb.app() : fb.initializeApp(cfg);
      var auth = app.auth(), db = app.firestore();
      if (emu) { auth.useEmulator('http://' + host + ':9099', { disableWarnings: true }); db.useEmulator(host, 8080); }
      S.auth = auth; o.db = db;
      if (ssGet(RKEY)) auth.getRedirectResult().catch(function (e) { ssSet(RKEY, null); toast(failMsg(e), 4200); });
      auth.onAuthStateChanged(function (u) {
        S.user = u || null;
        var how = '';
        if (u && (S.pending || ssGet(RKEY))) { how = 'login'; S.pending = false; ssSet(RKEY, null); toast(who(u) + ' 님, 어서 오세요'); }
        api.setUser(u ? u.uid : null, how);
        mailLoad();      // r10: 운영진 우편
        bar();
      }, function () { o.st = 'off'; api.redraw(); });
      naverReturn();
    } catch (e) { S.off = true; o.st = 'off'; api.redraw(); bar(); }
  },
  // 「지금 접속 중」: 기록을 켠 동안 3분에 한 번 players/{uid}.seen 을 고친다 (화면을 보고 있을 때만) — r10: 1분 → 3분 (Spark 쓰기 한도)
  presence: function (o, on) {
    if (S.beat) { clearInterval(S.beat); S.beat = null; }
    if (!on || !o.uid || !o.db) return;
    S.beat = setInterval(beat, BEAT);
  },
  onlineSet: function (o) {
    var ids = {}, n = 0, now = Date.now();
    (o.players || []).forEach(function (r) { if (Math.max(r.at || 0, r.seen || 0) > now - LIVE) { ids[r.id] = 1; if (r.id !== o.uid) n++; } });
    return { ids: ids, others: n };
  },
  acctRow: function (o) {
    var u = S.user, sep = '<br>Google, 카카오, 네이버로 따로 들어오면 저장도 따로입니다.';
    if (S.off || !S.auth) return '<div class="row fb-row"><div class="tx"><b>계정</b><small>이 사이트에는 Firebase 설정이 없어 로그인이 안 됩니다.</small></div><button class="btn small" disabled>로그인</button></div>';
    if (!u) {
      if (!PVL.length) return '<div class="row fb-row"><div class="tx"><b>계정 <i class="own">로그인 안 함</i></b><small>켜 둔 로그인 방법이 없습니다 (firebase-config.js 의 LOGIN_PROVIDERS).</small></div><button class="btn small" disabled>로그인</button></div>';
      return '<div class="row fb-row fb-out"><div class="tx"><b>계정 <i class="own">로그인 안 함</i></b><small>로그인하면 클라우드에 저장하고 현황에 기록을 올립니다.' + (PVL.length > 1 ? sep : '') + '</small></div></div>' +
        '<div class="fb-btns">' + PVL.map(function (k) { return pvBtn(k, '', 'wide'); }).join('') + '</div>';
    }
    return '<div class="row fb-row"><div class="tx"><b>계정 <i class="own">' + (PVN[pvOf(u)] || '') + ' 로그인함</i></b><small>' + esc(who(u)) + (u.email ? ', ' + esc(u.email) : '') + '<br>이 이름과 메일은 나만 봅니다. 현황에는 맹주 이름과 진행만 올라갑니다.' + (PVL.length > 1 ? sep : '') + '</small></div><button class="btn small" data-fb="out">로그아웃</button></div>';
  },
  loginHtml: function () { return S.off || !S.auth || S.user || !PVL.length ? '' : '<div class="fb-btns onl-login">' + PVL.map(function (k) { return pvBtn(k, '', 'wide'); }).join('') + '</div>'; },      // 2.6.1: 현황 탭의 로그인 단추 (설정 탭의 것과 같다)
  titleHook: function () { bar(); }
};
function beat() {
  var o = O();
  if (document.hidden || !pubOn() || !o.uid || !o.db || o.pubErr === 'denied') return;
  try { o.db.doc('players/' + o.uid).update({ seen: Date.now() }).catch(function () {}); } catch (e) {}
}
document.addEventListener('visibilitychange', function () { if (!document.hidden && S.beat) beat(); });

function failMsg(e) {
  var c = (e && e.code) || '';
  if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request' || c === 'auth/user-cancelled') return '로그인을 그만두었습니다';
  if (c === 'auth/unauthorized-domain') return 'Firebase 에 승인되지 않은 주소입니다. 안내서의 「승인된 도메인」을 보세요';
  if (c === 'auth/network-request-failed') return '인터넷에 연결하지 못했습니다. 잠시 뒤 다시 하세요';
  if (c === 'auth/operation-not-allowed') return 'Firebase 에서 이 로그인 방법이 꺼져 있습니다';
  if (c === 'naver/naver-token' || c === 'naver/naver-profile') return '네이버 로그인을 확인하지 못했습니다. 다시 하세요';
  if (c === 'naver/server-config') return '네이버 로그인 서버 설정이 끝나지 않았습니다 (안내서의 함수 비밀 설정)';
  if (c === 'naver/net') return '네이버 로그인 서버에 연결하지 못했습니다. 잠시 뒤 다시 하세요';
  if (c === 'naver/state') return '로그인 확인값이 달라 멈췄습니다. 다시 하세요';
  return '로그인하지 못했습니다' + (c ? ' (' + c.replace('auth/', '') + ')' : '');
}
function login(pv) {
  if (!S.auth || S.busy || S.user || !PV[pv]) return;
  if (pv === 'naver') { naverGo(); return; }
  var fb = window.firebase, p;
  if (pv === 'kakao') { p = new fb.auth.OAuthProvider('oidc.kakao'); p.addScope('openid'); }
  else { p = new fb.auth.GoogleAuthProvider(); try { p.setCustomParameters({ prompt: 'select_account' }); } catch (e) {} }
  S.busy = true; S.pending = true; bar(); redrawOpt();
  S.auth.signInWithPopup(p).then(function () { S.busy = false; bar(); redrawOpt(); }, function (e) {
    S.busy = false; S.pending = false;
    var c = (e && e.code) || '';
    if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment' || c === 'auth/web-storage-unsupported') {      // 팝업이 막히면 페이지째 넘어갔다 돌아온다
      ssSet(RKEY, '1'); toast(PVN[pv] + ' 로그인 화면으로 넘어갑니다');
      try { if (DS.ui && DS.ui.persist && DS.G && DS.G.save) DS.ui.persist(); } catch (x) {}
      S.auth.signInWithRedirect(p).catch(function (x) { ssSet(RKEY, null); toast(failMsg(x), 4200); });
      return;
    }
    toast(failMsg(e), 4200); bar(); redrawOpt();
  });
}
function logout() {
  if (!S.auth || !S.user) return;
  var o = O();
  // 이 기기 저장은 그대로 둔다 (로그아웃은 계정 연결만 끊는다)
  S.auth.signOut().then(function () { toast('로그아웃했습니다'); }, function () { toast('로그아웃하지 못했습니다'); });
  if (o.pubT) { clearTimeout(o.pubT); o.pubT = null; }
}
// ── 네이버: 인가 창으로 갔다 돌아오면(code·state) 함수에서 커스텀 토큰을 받아 로그인 ──
function naverBack() { return location.origin + location.pathname + (emu ? '?emu=1' : ''); }      // 네이버 개발자 센터에 등록한 Callback URL 과 같아야 한다
function naverGo() {
  var a = new Uint8Array(16), st = '';
  try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 16; i++) a[i] = Math.random() * 256; }
  for (var j = 0; j < a.length; j++) st += ('0' + a[j].toString(16)).slice(-2);
  ssSet(NKEY, st);
  try { if (DS.ui && DS.ui.persist && DS.G && DS.G.save) DS.ui.persist(); } catch (x) {}
  S.busy = true; bar(); redrawOpt(); toast('네이버 로그인 화면으로 넘어갑니다');
  location.href = (P.naverAuthBase || 'https://nid.naver.com') + '/oauth2.0/authorize?response_type=code&client_id=' + encodeURIComponent(P.naverClientId) + '&redirect_uri=' + encodeURIComponent(naverBack()) + '&state=' + st;
}
function naverReturn() {
  var want = ssGet(NKEY); if (!want) return;
  var sp; try { sp = new URLSearchParams(location.search); } catch (e) { return; }
  var code = sp.get('code'), st = sp.get('state'), err = sp.get('error');
  if (!code && !err) return;
  ssSet(NKEY, null);
  ['code', 'state', 'error', 'error_description'].forEach(function (k) { sp.delete(k); });
  try { history.replaceState(null, '', location.pathname + (sp.toString() ? '?' + sp.toString() : '') + location.hash); } catch (e) {}
  if (st !== want) { toast(failMsg({ code: 'naver/state' }), 4200); return; }
  if (err || !code) { toast('로그인을 그만두었습니다'); return; }
  S.busy = true; bar();
  fetch(P.naverFunctionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code, state: st }) })
    .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); }, function () { throw { code: 'naver/net' }; })
    .then(function (x) { if (!x.ok || !x.j || typeof x.j.token !== 'string') throw { code: 'naver/' + ((x.j && x.j.error) || 'naver-token') }; S.pending = true; return S.auth.signInWithCustomToken(x.j.token); })
    .then(function () { S.busy = false; bar(); redrawOpt(); }, function (e) { S.busy = false; S.pending = false; toast(failMsg(e), 4200); bar(); redrawOpt(); });
}
function redrawOpt() { try { if (O().redraw) O().redraw(); } catch (e) {} }

// ── 운영진 우편함 (r10 social · 웹 판 전용) ──
// 우편 문서: { t 제목 ≤30, b 본문 ≤200, gift: { rename: n (≤3) }, from 보낸 이(기본 「운영진」), at 보낸 때, until 받을 수 있는 마감(선택) }
// 전체 우편 mail/{mid} · 개인 우편 mailto/{uid}/box/{mid} — 로그인했을 때 한 번씩 읽는다(get, 최근 20통씩). 받은 것은 save.mbox 에 'a:mid'/'p:mid' 로 (최근 50).
// 선물(개명권)은 보유 상한 3을 넘지 않는다 — 넘치면 받기를 미룬다(「이미 3장 — 다 쓰고 받기」). 선물 없는 우편은 열면 읽은 것으로 친다.
var MB = { list: [], st: 'idle', uid: null, open: null, at: 0 };
function tsMs(v) {
  if (v == null) return 0;
  if (typeof v.toMillis === 'function') { try { return v.toMillis(); } catch (e) { return 0; } }
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  if (typeof v === 'string') { var t = Date.parse(v); return isFinite(t) ? t : 0; }
  if (v instanceof Date) return +v;
  return 0;
}
function mclean(v, n, nl) { var s = String(v == null ? '' : v).replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, ''); if (!nl) s = s.replace(/\s+/g, ' '); return Array.from(s.trim()).slice(0, n).join(''); }
function mailRow(box, id, d) {
  if (!id || typeof id !== 'string' || id.length > 120 || !d || typeof d !== 'object') return null;
  var t = mclean(d.t, 30), at = tsMs(d.at); if (!t) return null;
  var g = d.gift && typeof d.gift === 'object' ? d.gift : {}, rn = Math.round(+g.rename || 0);
  return { id: box + ':' + id, t: t, b: mclean(d.b, 200, true), from: mclean(d.from, 12) || '운영진', at: at, until: tsMs(d.until), rn: isFinite(rn) ? Math.max(0, Math.min(3, rn)) : 0, mine: box === 'p' };
}
function sv() { return DS.G && DS.G.save; }
function gotList() {
  var s = sv(); if (s) return Array.isArray(s.mbox) ? s.mbox : [];
  try { var raw = localStorage.getItem((DS.Save && DS.Save.KEY) || 'tenbanners_v1'), j = raw ? JSON.parse(raw) : null; return j && Array.isArray(j.mbox) ? j.mbox : []; } catch (e) { return []; }
}
function mailGot(m) { return gotList().indexOf(m.id) >= 0; }
function mailDead(m) { return !!(m.until && Date.now() > m.until); }
function mailNew() { return S.user ? MB.list.filter(function (m) { return !mailGot(m) && !mailDead(m); }) : []; }
function mailLoad() {
  var o = O(), u = S.user;
  if (!u || !o.db) { MB.list = []; MB.uid = null; MB.st = 'idle'; mailDot(); return Promise.resolve(); }
  if (MB.uid !== u.uid) { MB.list = []; MB.uid = u.uid; }
  MB.st = 'loading'; MB.at = Date.now();
  var q1, q2;
  try { q1 = o.db.collection('mail').orderBy('at', 'desc').limit(20).get(); } catch (e) { q1 = Promise.reject(e); }
  try { q2 = o.db.collection('mailto/' + u.uid + '/box').orderBy('at', 'desc').limit(20).get(); } catch (e) { q2 = Promise.reject(e); }
  var take = function (box) { return function (snap) { var a = []; ((snap && snap.docs) || []).forEach(function (d) { try { var r = mailRow(box, d.id, d.data()); if (r) a.push(r); } catch (e) {} }); return a; }; };
  var none = function () { return null; };
  return Promise.all([Promise.resolve(q1).then(take('a'), none), Promise.resolve(q2).then(take('p'), none)]).then(function (r) {
    if (!S.user || S.user.uid !== MB.uid) return;
    MB.st = r[0] || r[1] ? 'ok' : 'err';
    MB.list = (r[0] || []).concat(r[1] || []).sort(function (a, b) { return b.at - a.at; });
    mailDot(); redrawOpt(); mailRedraw();
  });
}
// 작은 점: 타이틀의 우편함 단추 · 마을 HUD 의 메뉴 단추 · 메뉴의 설정 탭
function mailDot() {
  try {
    var n = mailNew().length, app = document.getElementById('app');
    if (app) app.classList.toggle('mail-new', n > 0);
    var b = document.getElementById('btnMail'); if (b) b.classList.toggle('dot', n > 0);
  } catch (e) {}
}
function mailTitleBtn() { return '<button class="btn small fb-mail' + (mailNew().length ? ' dot' : '') + '" id="btnMail" data-fb="mail">우편함</button>'; }
function mailOptRow() {
  if (S.off || !S.auth || !S.user) return '';
  var n = mailNew().length;
  return '<div class="row fb-mrow"><div class="tx"><b>우편함' + (n ? ' <i class="own fb-new">새 우편 ' + n + '</i>' : '') + '</b><small>운영진 소식과 개명권 선물이 옵니다.</small></div><button class="btn small' + (n ? ' gold' : '') + '" data-fb="mail">열기</button></div>';
}
function day(t) { if (!t) return ''; var D = new Date(t); return D.getFullYear() + '. ' + (D.getMonth() + 1) + '. ' + D.getDate() + '.'; }
function mailState(m) {
  if (mailGot(m)) return { k: 'got', txt: m.rn ? '받음' : '읽음' };
  if (mailDead(m)) return { k: 'dead', txt: '마감' };
  return { k: 'new', txt: '새 우편' };
}
function mailBody() {
  var U = DS.ui; if (!S.user) return '<p class="hint">로그인하면 우편함이 열립니다.</p>';
  if (MB.open) {
    var m = MB.list.filter(function (x) { return x.id === MB.open; })[0];
    if (m) {
      var st = mailState(m), s = sv(), why = '';
      if (st.k === 'new' && m.rn) { if (!s) why = '이어하기로 들어간 뒤에 받습니다'; else if (DS.rnHave && DS.rnHave(s) + m.rn > DS.RN.max) why = DS.rnHave(s) >= DS.RN.max ? '이미 ' + DS.RN.max + '장입니다. 쓰고 받으세요' : '개명권은 ' + DS.RN.max + '장까지입니다. ' + (DS.rnHave(s) + m.rn - DS.RN.max) + '장 쓰고 받으세요'; }
      return '<div class="fb-mail1"><button class="btn small" data-fbm="back">‹ 목록</button><h2>' + esc(m.t) + '</h2><p class="fb-mfrom">' + esc(m.from) + ', ' + day(m.at) + (m.mine ? ', <i class="own">나에게</i>' : '') + '</p>' +
        (m.b ? '<p class="fb-mb">' + esc(m.b).replace(/\n/g, '<br>') + '</p>' : '') +
        (m.rn ? '<div class="row fb-gift"><div class="tx"><b>선물, 개명권 ' + m.rn + '장</b><small>' + (m.until ? '받을 수 있는 때: ' + day(m.until) + '까지, ' : '') + '지금 가진 개명권 ' + (s && DS.rnHave ? DS.rnHave(s) : 0) + '장 (최대 ' + DS.RN.max + '장)</small></div></div>' : '') +
        (st.k === 'new' && m.rn ? (why ? '<p class="warn">' + esc(why) + '</p>' : '') + '<button class="btn gold wide" data-fbm="take"' + (why ? ' disabled' : '') + '>받는다</button>' : '<p class="hint">' + (st.k === 'dead' ? '받을 수 있는 때가 지났습니다.' : st.k === 'got' && m.rn ? '이미 받은 우편입니다.' : '') + '</p>') + '</div>';
    }
    MB.open = null;
  }
  if (MB.st === 'loading' && !MB.list.length) return '<p class="hint">우편함을 여는 중…</p>';
  if (MB.st === 'err' && !MB.list.length) return '<p class="hint">우편함을 불러오지 못했습니다. 잠시 뒤 다시 여세요.</p>';
  if (!MB.list.length) return '<p class="hint">받은 우편이 없습니다.</p>';
  return '<div class="fb-mlist">' + MB.list.map(function (m) {
    var st = mailState(m);
    return '<button class="fb-mi k-' + st.k + '" data-fbm="open" data-mid="' + esc(m.id) + '"><span><b>' + (st.k === 'new' ? '<i class="fb-mdot" aria-label="새 우편"></i>' : '') + esc(m.t) + '</b><small>' + esc(m.from) + ', ' + day(m.at) + (m.rn ? ', 개명권 ' + m.rn + '장' : '') + '</small></span><em>' + st.txt + '</em></button>';
  }).join('') + '</div><p class="hint">우편은 운영진만 보냅니다. 받은 선물은 이 저장에 남습니다.</p>';
}
function mailMark(m) { var s = sv(); if (!s) return false; s.mbox = (Array.isArray(s.mbox) ? s.mbox : []).filter(function (x) { return x !== m.id; }).concat([m.id]).slice(-((DS.RN && DS.RN.mbox) || 50)); return true; }
function mailTake(m) {
  var s = sv(), U = DS.ui; if (!s || !m || mailGot(m) || mailDead(m)) return;
  var g = DS.rnGive ? DS.rnGive(s, m.rn) : { ok: false, why: '받을 수 없습니다' };
  if (!g.ok) { if (U) { U.A('cancel'); U.toast(g.why, 3200); } return; }      // 넘치면 미룬다 (우편은 그대로 남는다)
  mailMark(m);
  try { if (U && U.persist) U.persist(); } catch (e) {}
  if (U) { U.A('coin'); U.toast('개명권 ' + g.got + '장을 받았습니다, 지금 ' + DS.rnHave(s) + '장', 3200); }
  mailDot(); redrawOpt();
}
function mailRedraw() { try { if (MB.ov && MB.ov.isConnected && MB.ov.draw) MB.ov.draw(); } catch (e) {} }
function mailOpen() {
  var U = DS.ui; if (!U || !U.sheet || !S.user) return;
  MB.open = null;
  if (Date.now() - MB.at > 30000) mailLoad();
  var o = U.sheet('우편함', mailBody, 'sub fbmail');
  MB.ov = o;
  o.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fbm]'); if (!b || b.disabled) return;
    var k = b.dataset.fbm;
    if (k === 'back') { U.A('tap'); MB.open = null; o.draw(); return; }
    if (k === 'open') {
      U.A('tap'); MB.open = b.dataset.mid;
      var m = MB.list.filter(function (x) { return x.id === MB.open; })[0];
      if (m && !m.rn && !mailGot(m) && !mailDead(m) && mailMark(m)) { try { if (U.persist) U.persist(); } catch (x) {} mailDot(); redrawOpt(); }      // 선물 없는 우편: 열면 읽음
      o.draw(); return;
    }
    if (k === 'take') { var mm = MB.list.filter(function (x) { return x.id === MB.open; })[0]; mailTake(mm); o.draw(); return; }
  });
  o.onclose = function () { MB.ov = null; MB.open = null; mailDot(); bar(); };
  return o;
}
DS.mail = { load: mailLoad, open: mailOpen, list: function () { return MB.list; }, fresh: mailNew, row: mailRow };      // 시험용
// 저장을 바꿔 들어오면(이어하기·새로 시작·클라우드 불러오기) 점을 다시 맞춘다
setInterval(function () { if (S.user && !document.hidden) mailDot(); }, 4000);


// 타이틀 화면: 「Google 로 로그인」 / 「○○ 님 · 로그아웃」 — renderTitle 이 화면을 새로 그릴 때마다 다시 붙인다
function bar() {
  try {
    var el = document.getElementById('s-title'), tb = el && el.querySelector('.title-bottom'); if (!tb) return;
    var box = document.getElementById('fbAcct');
    if (S.off || !S.auth) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('div'); box.id = 'fbAcct'; box.className = 'fb-acct'; var tv = tb.querySelector('.tver'); tb.insertBefore(box, tv || null); }
    var u = S.user;
    if (!u && !PVL.length) { box.remove(); return; }
    box.classList.toggle('fb-many', !u && PVL.length > 1);
    box.innerHTML = u ? '<span class="fb-who"><span><b>' + esc(who(u)) + ' 님</b><small>' + (PVN[pvOf(u)] || '') + ' 계정으로 클라우드에 저장합니다</small></span></span>' + mailTitleBtn() + '<button class="btn small" id="btnLogout" data-fb="out">로그아웃</button>'
      : PVL.map(function (k) { return pvBtn(k, { google: 'btnGoogle', kakao: 'btnKakao', naver: 'btnNaver' }[k], 'wide'); }).join('');
  } catch (e) {}
}
function watchTitle() {
  var el = document.getElementById('s-title'); if (!el || !window.MutationObserver) return;
  new MutationObserver(function () { if (!document.getElementById('fbAcct')) bar(); }).observe(el, { childList: true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { watchTitle(); setTimeout(bar, 0); }); else { watchTitle(); setTimeout(bar, 0); }
document.addEventListener('click', function (e) {
  var t = e.target && e.target.closest ? e.target.closest('[data-fb]') : null; if (!t || t.disabled) return;
  try { if (DS.Audio && DS.Audio.unlock) DS.Audio.unlock(); } catch (x) {}
  snd('tap');
  if (t.dataset.fb === 'in') login(t.dataset.pv || 'google'); else if (t.dataset.fb === 'out') logout(); else if (t.dataset.fb === 'mail') mailOpen();
});
try {
  var css = document.createElement('style'); css.id = 'fbCss';
  css.textContent = '.fb-acct{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:44px}' +
    '.fb-acct.fb-many{display:grid;gap:8px;justify-content:stretch}.fb-btns{display:grid;gap:8px;padding:0 0 12px}' +
    '#app .btn.fb-pv{gap:10px;min-height:46px;border-width:1px;border-bottom-width:1px;margin-bottom:0;box-shadow:none;text-shadow:none;background-image:none;font-weight:700}' +
    '#app .btn.fb-google{background:#fff;color:#1f1f1f;border-color:#747775}#app .btn.fb-kakao{background:#FEE500;color:rgba(0,0,0,.85);border-color:#FEE500}#app .btn.fb-naver{background:#03C75A;color:#fff;border-color:#03C75A}' +
    '#app .btn.fb-pv:active{transform:translateY(1px);filter:brightness(.95)}' +
    '.fb-g,.fb-n{display:inline-grid;place-items:center;width:20px;height:20px;font:800 16px/1 system-ui,sans-serif;font-style:normal;flex:none}.fb-g{color:#4285f4}.fb-n{color:#fff}' +
    '.fb-who{display:flex;align-items:center;gap:8px;min-width:0;text-align:left}.fb-who>span{display:grid;min-width:0}.fb-who b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fb-who small{font-size:var(--fs-m);font-family:var(--f-11);color:var(--mute)}' +
    '.fb-acct .btn.small{min-height:40px;flex:none}' +
    // r10: 우편함 — 새 우편 점(타이틀 단추 · HUD 메뉴 단추 · 메뉴 설정 탭)
    '#app .btn.fb-mail,#app.mail-new #bMenu,#app.mail-new .mtabs [data-tab="opt"]{position:relative}' +
    '#app .btn.fb-mail.dot::after,#app.mail-new #bMenu::after,#app.mail-new .mtabs [data-tab="opt"]::after{content:"";position:absolute;top:3px;right:3px;width:8px;height:8px;border-radius:50%;background:var(--blood);box-shadow:0 0 0 2px var(--ink,#14110d);pointer-events:none}' +
    '.fb-new{color:var(--blood)!important}.fb-mlist{display:grid;gap:6px;padding:4px 0}.fb-mi{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;text-align:left;width:100%;min-height:56px;padding:8px 10px;border:1px solid var(--line);border-radius:6px;background:var(--ink2);color:var(--bone)}' +
    '.fb-mi b{display:block;color:var(--bone);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--fs-m);font-family:var(--f-11)}.fb-mi small{display:block;color:var(--mute);font-size:var(--fs-m);font-family:var(--f-11)}.fb-mi em{font-style:normal;color:var(--dim);font-size:var(--fs-m);font-family:var(--f-11);white-space:nowrap}' +
    '.fb-mi.k-new em{color:var(--blood)}.fb-mi.k-got,.fb-mi.k-dead{opacity:.7}.fb-mdot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--blood);margin-right:6px;vertical-align:2px}' +
    '.fb-mail1{display:grid;gap:8px;padding:4px 0}.fb-mail1>.btn{justify-self:start}.fb-mail1 h2{color:var(--ember);font-size:var(--fs-x);font-family:var(--f-11);line-height:30px;overflow-wrap:anywhere}.fb-mfrom{color:var(--mute);font-size:var(--fs-m);font-family:var(--f-11)}' +
    '.fb-mb{font-size:var(--fs-m);font-family:var(--f-11);line-height:22px;overflow-wrap:anywhere;padding:8px 10px;border-left:3px solid var(--line);background:rgba(19,17,31,.4)}.fb-mail1 .warn{color:var(--blood);font-size:var(--fs-m);font-family:var(--f-11)}';
  (document.head || document.documentElement).appendChild(css);
} catch (e) {}
})();
