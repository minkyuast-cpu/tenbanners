// 열 개의 깃발 — 저장 이사: claude.ai 아티팩트 판 → Firebase 판(새 집, 공식 주소 DS.WEB_URL). 두 판 공용 (r7 migrate)
// 예비 주소(GitHub Pages 등, https 이면서 공식 호스트가 아닌 곳)에서 열린 Firebase 판도 같은 방식으로 「공식 주소로 옮겨 가기」를 안내한다.
// claude 판: 타이틀 안내 카드·설정에서 「저장 가지고 이사하기」 → 이사 코드(압축·체크섬)를 만들어 새 집 주소의 #import= 로 연다. 코드 복사·파일 받기도 같은 창에.
// Firebase 판: #import= 를 열자마자 지우고, 비교 창에서 사람이 고른 뒤에만 가져온다 (지금 진행은 _preimport 로 백업, save.js 의 판 올림·fixSave 를 그대로 거친다).
// 이사 코드: 'TB1' + ('z' deflate-raw | 'j' 압축 없음) + crc32(봉투 UTF-8, 16진 8자리) + '.' + base64url(본문). 봉투 = { f:'tenbanners-move', fv:1, sv, ver, at, src, o, sum, data }.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
if (typeof window === 'undefined' || typeof document === 'undefined') return;
DS.WEB_URL = DS.WEB_URL || 'https://minkyuast-cpu.github.io/tenbanners/';      // 공식 주소 — 여기 한 곳
var KEY = (DS.Save && DS.Save.KEY) || 'tenbanners_v2', PRE = KEY + '_preimport', PRE2 = KEY + '_preimport2', PEND = 'tb_mv_pending', OKF = 'tb_mv_ok';      // 4.0: 새 키 (옛 키 tenbanners_v1 은 옛 판의 이주 원본 — 이사도 건드리지 않는다)
function lsCur() { return lsGet(KEY) || (DS.Save && DS.Save.raw ? DS.Save.raw() : null); }      // 지금 진행 (새 키가 없으면 옛 키 — 아직 4.0 으로 읽지 않은 기기)
var URL_MAX = 60000, CODE_MAX = 3000000, ENV_MAX = 4 * 1024 * 1024, DATA_MAX = 3 * 1024 * 1024, FILE_MAX = 3200000;
var WEB = !!(DS.OnlineBE && DS.OnlineBE.name === 'firebase');
var M = DS.Move = { URL_MAX: URL_MAX, web: WEB, noZ: false };

// ── 작은 도우미 ──
function U() { return DS.ui || {}; }
function G() { return DS.G || {}; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toast(m, ms) { try { if (U().toast) U().toast(m, ms); } catch (e) {} }
function snd(k) { try { if (U().A) U().A(k); } catch (e) {} }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
function ssSet(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
function meta() { try { return (DS.Save && DS.Save.meta()) || {}; } catch (e) { return {}; } }
function setMeta(p) { try { if (DS.Save) DS.Save.setMeta(p); } catch (e) {} }
function onl() { return DS.Online || null; }
function ago(t) {
  if (!t) return '';
  var d = Math.max(0, Date.now() - t) / 1000;
  if (d < 60) return '방금'; if (d < 3600) return Math.floor(d / 60) + '분 전'; if (d < 86400) return Math.floor(d / 3600) + '시간 전';
  if (d < 86400 * 30) return Math.floor(d / 86400) + '일 전';
  var D = new Date(t); return D.getFullYear() + '. ' + (D.getMonth() + 1) + '. ' + D.getDate() + '.';
}
function hm(sec) { sec = Math.max(0, Math.round(sec || 0)); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? h + '시간 ' + m + '분' : m + '분'; }
function kb(n) { return n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB'; }
function officialHost() { try { return new URL(DS.WEB_URL).hostname; } catch (e) { return 'tenbanners.web.app'; } }
// 예비 주소에서 열린 Firebase 판인가 (로컬 file://·http://127.0.0.1 시험에서는 아니다 — 시험은 DS.Move.forceOld 로)
function oldWeb() { if (!WEB) return false; if (M.forceOld) return true; try { return location.protocol === 'https:' && location.hostname !== officialHost(); } catch (e) { return false; } }
function sender() { return !WEB || oldWeb(); }      // 이사 코드를 만들어 내보내는 쪽
function NM() { return WEB ? '공식 주소' : '새 집'; }
function host() { return String(DS.WEB_URL).replace(/^https?:\/\//, '').replace(/\/$/, ''); }
function flush() { try { if (G().save && U().persist) { var o = onl(); if (o) o.mute = true; U().persist(); if (o) o.mute = false; } } catch (e) {} }

// ── 바이트·체크섬·base64url·압축 ──
function utf8(t) { if (typeof TextEncoder === 'function') return new TextEncoder().encode(t); var s = unescape(encodeURIComponent(t)), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function utf8d(u) { if (typeof TextDecoder === 'function') return new TextDecoder('utf-8', { fatal: true }).decode(u); var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return decodeURIComponent(escape(s)); }
var CT = null;
function crc32(b) {
  if (!CT) { CT = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CT[n] = c >>> 0; } }
  var x = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) x = CT[(x ^ b[i]) & 255] ^ (x >>> 8);
  return ('0000000' + ((x ^ 0xFFFFFFFF) >>> 0).toString(16)).slice(-8);
}
function b64e(u) { var s = '', CH = 0x8000; for (var i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64d(t) { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; var s = atob(t), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function canZ() { if (M.noZ || typeof CompressionStream !== 'function' || typeof Response !== 'function' || typeof Blob !== 'function') return false; try { new CompressionStream('deflate-raw'); return true; } catch (e) { return false; } }      // 크로미움 80~102 는 'deflate-raw' 를 모른다 → 무압축
function canUnZ() { if (typeof DecompressionStream !== 'function' || typeof Blob !== 'function') return false; try { new DecompressionStream('deflate-raw'); return true; } catch (e) { return false; } }
function deflate(u) { return new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
function inflate(u, max) {      // 넘치면 끊는다 (압축 폭탄)
  var rd = new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(), parts = [], n = 0;
  function pump() {
    return rd.read().then(function (r) {
      if (r.done) { var o = new Uint8Array(n), p = 0; parts.forEach(function (c) { o.set(c, p); p += c.length; }); return o; }
      n += r.value.length; if (n > max) { try { rd.cancel(); } catch (e) {} throw { code: 'big' }; }
      parts.push(r.value); return pump();
    });
  }
  return pump();
}

// ── 요약 (보여 주기용) ──
function sumOf(s) {
  if (!s || !s.chars) return null;
  var o = onl(), b = null;
  try { b = o && o.sumOf ? o.sumOf(s) : null; } catch (e) { b = null; }
  if (!b) { var h = s.chars[s.hero] || {}; b = { name: s.name, cls: h.cls, tier: h.L ? DS.tierOfL(h.L) : 1, cleared: Object.keys(s.cleared || {}).length, top: 1, merged: 0, time: +s.time || 0 }; }
  var gn = 0, k; for (k in (s.gear || {})) gn += +s.gear[k] || 0;
  DS.charList(s).forEach(function (c) { if (c.w) gn++; if (c.a) gn++; });
  var lin = s.lin || {};
  b.chars = Object.keys(s.chars).length; b.mercs = (s.mercs || []).length; b.gear = gn; b.gold = +s.gold || 0; b.kills = +s.kills || 0;
  b.ppl = lin.P ? Object.keys(lin.P).length : 0; b.log = Array.isArray(lin.log) ? lin.log.length : 0; b.coffin = s.coffins && s.coffins.list ? s.coffins.list.length : 0;
  return b;
}
M.sumOf = sumOf;
function clsName(cls, tier) { var C = DS.CLASSES && DS.CLASSES[cls]; if (!C) return ''; return (C.tiers && C.tiers[tier - C.start]) || C.name; }
function sameSum(a, b) { if (!a || !b) return false; return Math.abs((a.time || 0) - (b.time || 0)) < 300 && ['name', 'cls', 'tier', 'cleared', 'chars', 'mercs', 'gear', 'gold', 'kills', 'ppl', 'log'].every(function (k) { return a[k] === b[k]; }); }      // 플레이 시간은 마을에 서 있기만 해도 흐른다 (5분 안쪽은 같은 저장)
function box(t, sm, foot) {
  if (!sm) return '<div class="ocol"><b>' + t + '</b><small>저장 없음</small></div>';
  return '<div class="ocol"><b>' + t + '</b><span>' + esc(sm.name) + '</span><small>' + esc(clsName(sm.cls, sm.tier)) + ' · ' + sm.tier + '단</small>' +
    '<small>시나리오 ' + sm.cleared + ' · 합일 ' + (sm.merged || 0) + '</small><small>맹주 1, 사람 ' + sm.mercs + ', 가문 ' + sm.chars + '</small><small>플레이 ' + hm(sm.time) + '</small>' + (foot ? '<small>' + foot + '</small>' : '') + '</div>';
}
function curLocal() { flush(); var raw = lsCur(), s = raw && DS.Save ? DS.Save.peek(raw) : null; return { raw: raw, s: s, sum: sumOf(s) }; }

// ── 코드 만들기·읽기 ──
M.encode = function (raw, o) {
  o = o || {};
  var env = { f: 'tenbanners-move', fv: 1, sv: +DS.SAVE_V || 0, ver: String(DS.VERSION || ''), at: Date.now(), src: WEB ? 'web' : 'claude', h: WEB ? String(location.hostname || '').slice(0, 60) : '', o: o.o === 'cloud' ? 'cloud' : 'local', data: raw };
  var u = utf8(JSON.stringify(env)), c = crc32(u);
  function plain() { return 'TB1j' + c + '.' + b64e(u); }
  if (!canZ()) return Promise.resolve(plain());
  try { return deflate(u).then(function (z) { return 'TB1z' + c + '.' + b64e(z); }, plain); } catch (e) { return Promise.resolve(plain()); }
};
// 붙여 넣은 글에서 코드만: 주소 전체·앞뒤 글·줄바꿈(메신저가 접은 것)·%인코딩을 견딘다
M.clean = function (t) {
  t = String(t == null ? '' : t);
  var i = t.indexOf('TB1'); if (i < 0) return '';
  t = t.slice(i);
  if (/%[0-9A-Fa-f]{2}/.test(t.slice(0, 20000))) { try { t = decodeURIComponent(t); } catch (e) {} }
  var parts = t.split(/\s+/), out = parts[0];
  for (var k = 1; k < parts.length && /^[A-Za-z0-9_-]+$/.test(parts[k]); k++) out += parts[k];
  var m = /^TB1[zj][0-9a-f]{8}\.[A-Za-z0-9_-]+/.exec(out);
  return m ? m[0] : out;
};
var ERR = {
  notcode: '이사 코드가 아닙니다. claude 판의 「저장 가지고 이사하기」에서 만든 코드를 붙여 넣으세요.',
  broken: '코드가 잘렸거나 바뀌었습니다. 처음부터 다시 복사하세요.',
  big: '이사 코드가 너무 큽니다. 이 기기 저장은 그대로입니다.',
  noz: '이 브라우저는 압축된 코드를 풀지 못합니다. 최신 크롬, 사파리 16.4 이상, 파이어폭스로 여세요.',
  newer: '더 새 판에서 만든 저장이라 아직 못 가져옵니다. 코드를 두었다가 잠시 뒤 다시 여세요.',
  unreadable: '저장을 읽지 못했습니다. 이 기기 저장은 그대로입니다.',
  store: '이 기기에 저장하지 못했습니다. 저장 공간을 확인하세요. 지금 진행은 그대로입니다.'
};
M.ERR = ERR;
function fail(code) { return Promise.reject({ code: code }); }
M.decode = function (text) {
  var c = M.clean(text);
  if (!c) return fail('notcode');
  if (c.length > CODE_MAX) return fail('big');
  var m = /^TB1([zj])([0-9a-f]{8})\.([A-Za-z0-9_-]+)$/.exec(c);
  if (!m) return fail(/^TB1/.test(c) ? 'broken' : 'notcode');
  if (m[1] === 'z' && !canUnZ()) return fail('noz');
  var bytes; try { bytes = b64d(m[3]); } catch (e) { return fail('broken'); }
  var p;
  try { p = m[1] === 'z' ? inflate(bytes, ENV_MAX).catch(function (e) { throw { code: e && e.code === 'big' ? 'big' : 'broken' }; }) : Promise.resolve(bytes); } catch (e) { return fail('broken'); }
  return p.then(function (u) {
    if (u.length > ENV_MAX) throw { code: 'big' };
    if (crc32(u) !== m[2]) throw { code: 'broken' };
    var env; try { env = JSON.parse(utf8d(u)); } catch (e) { throw { code: 'broken' }; }
    if (!env || typeof env !== 'object' || env.f !== 'tenbanners-move' || typeof env.data !== 'string') throw { code: 'broken' };
    if (+env.fv > 1) throw { code: 'newer' };
    if (env.data.length > DATA_MAX) throw { code: 'big' };
    if (+env.sv > (+DS.SAVE_V || 0)) throw { code: 'newer' };
    if (DS.Save && DS.Save.newer && DS.Save.newer(env.data)) throw { code: 'newer' };      // 봉투는 옛 판이라도 안의 저장이 더 새 판이면 (peek 은 그런 저장을 null 로 돌려준다)
    if (DS.Save && DS.Save.isOld && DS.Save.isOld(env.data)) return { env: env, raw: env.data, old: true, code: c };      // ㉑ 옛 판 저장: 이어 하지 않고 「새 시대를 연다」 (사람 하나를 데려온다 — 이 기기 저장은 그대로)
    var s = DS.Save && DS.Save.peek(env.data); if (!s) throw { code: 'unreadable' };
    if (s._from > (+DS.SAVE_V || 0)) throw { code: 'newer' };
    return { env: env, raw: env.data, s: s, sum: sumOf(s), from: s._from, code: c };
  });
};

// ── 창 ──
function ov(html, cls) { var o = U().overlay; return o ? o('<div class="result onl-ask mv-ask">' + html + '</div>', 'modal center mv ' + (cls || '')) : null; }
function errBox(code, retry) {
  snd('cancel');
  var q = ov('<h2>가져오지 못했습니다</h2><p>' + esc(ERR[code] || ERR.broken) + '</p>' + (WEB ? '<button class="btn wide" id="mvPasteAgain">이사 코드 붙여넣기</button>' : '') + '<button class="btn gold wide" data-close>확인</button>', 'mverr');
  var b = q && q.querySelector('#mvPasteAgain'); if (b) b.addEventListener('click', function () { q.close(); pasteBox(); });
  return q;
}

// ═════ Firebase 판: 받는 쪽 ═════
var busy = false;
M.importCode = function (text, how) {
  if (busy) return Promise.resolve(false); busy = true;
  return M.decode(text).then(function (r) { busy = false; if (r.old) { ssSet(PEND, null); if (DS.openNewEra) DS.openNewEra(r.raw, !!lsGet(KEY)); return true; } askImport(r, how); return true; }, function (e) { busy = false; ssSet(PEND, null); errBox(e && e.code); if (e && e.code === 'newer') toast(DS.NEWER_MSG, 4200); return false; });
};
// 앱 안 브라우저(카카오톡·네이버·인스타그램·페이스북·라인·안드로이드 웹뷰): 저장이 그 창에만 남고 Google 로그인도 막힌다 (review A-2)
function inApp() { try { return /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|FB_IAB|Line\/|DaumApps|; wv\)|everytimeApp|Whale\/.*inapp/i.test(navigator.userAgent || ''); } catch (e) { return false; } }
M.inApp = inApp;
function canStore() { try { localStorage.setItem('tb_probe', '1'); localStorage.removeItem('tb_probe'); return true; } catch (e) { return false; } }      // 샌드박스를 물려받은 창이면 여기서 막힌다 (review C-1)
function srcName(env) { return env.src === 'claude' ? 'claude 판' : '예비 주소'; }
function codeOut(code) {      // 이 창에서 가져오지 못할 때 코드를 꺼내 준다 (hash 는 이미 지웠다)
  return '<button class="btn wide" id="mvTake">이사 코드 복사</button><details class="mvraw"><summary>코드 직접 보기</summary><textarea id="mvCode" class="mvta" rows="3" readonly>' + esc(code) + '</textarea></details>';
}
function wireTake(q, code) {
  var b = q.querySelector('#mvTake'), ta = q.querySelector('#mvCode'); if (!b) return;
  b.addEventListener('click', function () { snd('tap'); copyText(code, ta).then(function (ok) { toast(ok ? '복사했습니다. 바깥 브라우저의 설정 → 「이사 코드 붙여넣기」에 넣으세요' : '아래 상자의 코드를 길게 눌러 복사하세요', 4200); }); });
  if (ta) ta.addEventListener('focus', function () { try { ta.select(); } catch (e) {} });
}
function askImport(r, how) {
  if (!canStore()) {
    var q0 = ov('<h2>이 창에는 저장할 수 없습니다</h2><p>주소를 복사해 브라우저에서 직접 연 뒤 설정 → 「이사 코드 붙여넣기」로 가져오세요.</p>' + codeOut(r.code) + '<button class="btn gold wide" data-close>확인</button>', 'mverr');
    if (q0) wireTake(q0, r.code); ssSet(PEND, null); return;
  }
  var cur = curLocal(), o = onl(), env = r.env, old = r.from < (+DS.SAVE_V || 0) || !(r.s && env.data.indexOf('"lin"') >= 0);
  var same = cur.sum && sameSum(cur.sum, r.sum), app = inApp();
  var at = +env.at, okAt = at > 1.6e12 && at < Date.now() + 864e5, ver = /^\d+\.\d+\.\d+$/.test(String(env.ver || '')) ? String(env.ver) : '';
  var made = (env.src === 'claude' ? 'claude 판' : '예비 주소' + (typeof env.h === 'string' && /^[a-z0-9.-]{1,60}$/i.test(env.h) ? ' ' + esc(env.h) : '')) + (ver ? ' v' + ver : '') + (okAt ? ' · ' + ago(at) : '');
  var longer = cur.sum && !same && (cur.sum.time || 0) > (r.sum.time || 0) + 60;
  var cloudNote = o && o.uid && o.cloud && !same ? '<p class="dim">이 계정의 클라우드에도 저장이 있습니다' + (o.cloud.at ? ' (' + ago(o.cloud.at) + ')' : '') + '. 가져온 뒤 올리면 그 저장을 덮어씁니다. 올리기 전에 한 번 더 묻습니다.</p>' : '';
  var html = '<h2>저장 가져오기</h2>' + (app ? '<p class="warn mvapp">앱 안 브라우저입니다. 여기서 가져오면 이 창에만 남고 로그인이 안 될 수 있습니다. 오른쪽 위 ⋯ → 「다른 브라우저로 열기」로 옮긴 뒤 가져오세요.</p>' + codeOut(r.code) : '') + '<div class="ocmp">' + box('가져올 저장', r.sum, made) + box('이 기기', cur.sum, cur.sum ? '지금 진행' : '') + '</div>' +
    (old ? '<p class="dim">옛 판의 저장입니다. 가져오면 v' + esc(DS.VERSION) + ' 에 맞게 고쳐 씁니다.</p>' : '') +
    (same ? '<p>이미 같은 저장입니다.</p>' : cur.sum ? '<p class="warn">이 기기의 진행을 가져올 저장으로 바꿉니다.</p><p class="dim">지금 진행은 백업합니다. 설정 → 「가져오기 되돌리기」로 돌아올 수 있습니다.</p>' : '<p class="dim">' + srcName(env) + '에서 옮겨 온 저장으로 이어 합니다.</p>') +
    (longer ? '<p class="warn">이 기기 쪽 플레이 시간이 더 깁니다. 오래된 코드가 아닌지 보세요.</p>' : '') +
    cloudNote + '<p class="mvwarn">내가 만든 링크나 코드가 아니면 가져오지 마세요.</p>' +
    (same ? '<button class="btn gold wide" id="mvSame">그대로 이어 하기</button>' : '<button class="btn ' + (app ? '' : cur.sum ? 'red' : 'gold') + ' wide" id="mvYes">' + (app ? '그래도 여기서 가져오기' : cur.sum ? '이 기기 진행을 바꾸고 가져오기' : '가져오기') + '</button>') +
    '<button class="btn wide" id="mvNo" data-close>그만두기</button>';
  var q = ov(html, 'mvin'); if (!q) return;
  snd('open'); if (app) wireTake(q, r.code);
  var done = false;
  q.onclose = function () { if (!done) { ssSet(PEND, null); } };
  var y = q.querySelector('#mvYes'), sm = q.querySelector('#mvSame');
  if (y) y.addEventListener('click', function () { if (done) return; done = true; y.disabled = true; snd('ok'); q.close(); doImport(r); });
  if (sm) sm.addEventListener('click', function () {
    if (done) return; done = true; ssSet(PEND, null); q.close(); snd('ok');
    var g = G(); if (!g.running && cur.raw) { var s = DS.Save.read(cur.raw); if (s) { try { U().closeAll(); } catch (e) {} g.save = s; if (DS.Audio && DS.Audio.set) DS.Audio.set({ sfx: s.opt.sfx, bgm: s.opt.bgm }); DS.startGame(); if (DS.showNews) DS.showNews(); } }
  });
}
// 확인한 뒤에만 쓴다: 지금 것 → _preimport, 그다음 save.js 의 peek(판 올림·fixSave — read 와 같은 길, 다만 _bak 을 덮지 않는다) → store
function sigOf(s) { return s ? String(s.name || '') + '#' + s.hero + '#' + (s.lin && s.lin.sur || '') : ''; }
function commit(raw, opt) {
  opt = opt || {};
  var cur = lsCur(), o = onl(), last = meta().mvLast;
  if (opt.backup && cur) {
    var cs = DS.Save.peek(cur), cont = last && lsGet(PRE) && cs && sigOf(cs) === last.sig;      // 지금 진행이 지난번에 가져온 판에서 이어 온 것이면 원래 진행 백업을 지키고 덮지 않는다
    if (!cont) { lsSet(PRE, cur); try { localStorage.removeItem(PRE2); } catch (e) {} }
    else lsSet(PRE2, cur);      // 다시 이사: 원래 진행(PRE)은 지키고, 새 집에서 쌓은 지금 진행도 둘째 칸에 남긴다 — 예전엔 백업 없이 사라졌다 (코드 검토 CR-1)
  }
  var s = null; try { s = DS.Save.peek(raw); } catch (e) { s = null; }
  if (s) {
    var from = s._from; delete s._from;
    if (from < (+DS.SAVE_V || 0)) s.hist = (Array.isArray(s.hist) ? s.hist : []).concat([{ from: from, to: s.v, ver: DS.VERSION }]);
    // 4.0: 현황 공개는 늘 켜짐이라 가져올 때 opt.pub 를 끄지 않는다 (opt.pub 은 더 읽지 않는다)
  }
  var pubOff = !!(s && s._pubOff); if (s) delete s._pubOff;
  if (o) o.mute = true;
  var ok = s ? DS.Save.store(s) : false;
  if (o) o.mute = false;
  if (!s || ok === false) { if (cur) lsSet(KEY, cur); else { try { localStorage.removeItem(KEY); } catch (e) {} } return { err: s ? 'store' : 'unreadable' }; }
  if (o) { o.lastRaw = null; o.conflict = o.cloud || null; }
  setMeta({ cloudAt2: 0, mvLast: { at: Date.now(), sig: sigOf(s) } });      // 「아직 클라우드와 맞춘 적 없음」 — 자동 올리기가 묻지 않고 클라우드를 덮지 않게 (review A-4)
  mine = String(Date.now()) + Math.random().toString(36).slice(2, 6);
  lsSet(SIG, mine);      // 같은 주소의 다른 탭에 알린다 (review A-1)
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) {}
  return { s: s, pubOff: pubOff };
}
// 다른 탭에서 가져오기·되돌리기를 하면 이 탭은 바로 저장을 멈추고 새로 고침만 남긴다 (15초 persist 가 가져온 저장을 덮지 않게)
var SIG = 'tenbanners_mv', mine = '';
window.addEventListener('storage', function (e) {
  if (e.key !== SIG || !e.newValue || e.newValue === mine) return;
  try { var g = G(); g.save = null; } catch (x) {}
  try { U().closeAll(); } catch (x) {}
  var q = ov('<h2>다른 탭에서 저장을 바꿨습니다</h2><p>이 탭이 그 저장을 덮지 않게 멈췄습니다.</p><button class="btn gold wide" id="mvReload">새로 고침</button>', 'mvsig');
  if (q) { q.close = function () {}; var b = q.querySelector('#mvReload'); b.addEventListener('click', function () { location.reload(); }); }
});
function relaunch(s, after) {
  var g = G();
  if (!g.running) {
    try { U().closeAll(); } catch (e) {}
    g.save = s; try { if (DS.Audio && DS.Audio.set) DS.Audio.set({ sfx: s.opt.sfx, bgm: s.opt.bgm }); } catch (e) {}
    DS.startGame();
    if (after) after(); else if (DS.showNews) DS.showNews();
  } else { ssSet(OKF, after ? '1' : '2'); g.save = null; location.reload(); }      // 하던 판은 멈추고(덮어쓰기 방지) 새로 올린다
}
function doImport(r) {
  ssSet(PEND, null);
  var src = r.env.src === 'web' ? 'web' : 'claude';
  var res = commit(r.raw, { backup: true, noPub: true });      // 출처 칸은 링크를 만든 쪽이 정하는 값이라 믿지 않는다 — 현황 공개는 늘 끄고 새 집에서 다시 켜게 한다 (코드 검토 CR-2)      // 예비 주소 → 공식 주소는 같은 Firebase 프로젝트·같은 현황이라 동의 대상이 같다 (review H-3)
  if (res.err) { errBox(res.err); return; }
  setMeta({ seenVer: DS.VERSION, mvJust: true, mvIn: { at: Date.now(), src: src } });
  relaunch(res.s, function () { welcome(res.s, src, res.pubOff); });
}
function welcome(s, src, pubOff) {
  var sm = sumOf(s), o = onl(), can = !!(o && o.canWrite && o.canWrite()), fbOn = !!(o && o.st === 'ready'), BE = DS.OnlineBE, acct = '';
  if (!can && fbOn && BE && BE.acctRow) { try { acct = BE.acctRow(o); } catch (e) { acct = ''; } }
  var html = '<h2>' + (src === 'web' ? '공식 주소에' : '새 집에') + ' 옮겨 왔습니다</h2><p>「' + esc(sm.name) + '」 대장의 진행입니다.</p><p class="dim">맹주 1, 사람 ' + sm.mercs + ', 가문 ' + sm.chars + ', 시나리오 ' + sm.cleared + ', 장비 ' + sm.gear + '</p>' +
    (can ? '<p>브라우저에만 있는 저장은 지워질 수 있습니다. 클라우드에 올려 두면 다른 기기에서도 이어 합니다.</p><button class="btn gold wide" id="mvUp">클라우드에 올리기</button><button class="btn wide" data-close id="mvLater">나중에</button>'
      : (fbOn ? '<p>브라우저에만 있는 저장은 지워질 수 있습니다. 로그인해 클라우드에 올려 두세요.</p>' + (acct ? '<div class="mvacct">' + acct + '</div>' : '') : '') + '<button class="btn ' + (acct ? '' : 'gold ') + 'wide" data-close id="mvLater">' + (acct ? '나중에' : '이어 하기') + '</button>');
  var q = ov(html, 'mvok'); if (!q) { if (DS.showNews) DS.showNews(); return; }
  snd('level');
  var up = false;
  q.onclose = function () { if (up) { try { o.upAsk(); } catch (e) {} } else if (DS.showNews) DS.showNews(); };
  var b = q.querySelector('#mvUp'); if (b) b.addEventListener('click', function () { up = true; b.disabled = true; snd('ok'); q.close(); });
  q.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-fb]')) setTimeout(function () { q.close(); }, 0); });      // 로그인 단추는 online_fb.js 가 받는다 — 창만 닫는다
}
function pasteBox() {
  var q = ov('<h2>이사 코드 붙여넣기</h2><p class="dim">「저장 가지고 이사하기」에서 복사한 코드나 링크를 통째로 붙여 넣으세요.</p><textarea id="mvPaste" class="mvta" rows="5" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="TB1…"></textarea>' +
    '<button class="btn gold wide" id="mvRead">읽기</button><button class="btn wide" data-close>그만두기</button>', 'mvpaste');
  if (!q) return;
  var ta = q.querySelector('#mvPaste'), b = q.querySelector('#mvRead');
  b.addEventListener('click', function () { var t = ta.value; if (!t.trim()) { toast('코드를 붙여 넣으세요'); return; } snd('tap'); q.close(); M.importCode(t, 'paste'); });
  setTimeout(function () { try { ta.focus(); } catch (e) {} }, 60);
}
function filePick() {
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.txt,text/plain'; inp.id = 'mvFileIn'; inp.style.display = 'none';
  inp.addEventListener('change', function () {
    var f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
    if (f.size > FILE_MAX) { errBox('big'); return; }
    var rd = new FileReader();
    rd.onload = function () { M.importCode(String(rd.result || ''), 'file'); };
    rd.onerror = function () { errBox('broken'); };
    rd.readAsText(f);
  });
  document.body.appendChild(inp); inp.click();
}
M.pick = filePick; M.paste = pasteBox;
function undoAsk() {
  var slot = lsGet(PRE2) ? PRE2 : PRE, pre = lsGet(slot); if (!pre) { toast('되돌릴 백업이 없습니다'); return; }      // 다시 이사한 경우 바로 앞의 진행(둘째 칸)부터 되돌린다
  var a = DS.Save.peek(pre), cur = curLocal();
  if (!a) { toast('백업을 읽지 못했습니다'); return; }
  var q = ov('<h2>가져오기 되돌리기</h2><div class="ocmp">' + box('가져오기 전', sumOf(a), '백업') + box('지금', cur.sum, '') + '</div><p class="warn">가져오기 전의 진행으로 되돌립니다.</p><p class="dim">지금 진행은 백업으로 옮깁니다. 다시 누르면 또 맞바꿉니다.</p>' +
    '<button class="btn red wide" id="mvUndo">되돌리기</button><button class="btn wide" data-close>그만두기</button>', 'mvundo');
  if (!q) return;
  var b = q.querySelector('#mvUndo');
  b.addEventListener('click', function () {
    b.disabled = true; snd('ok'); q.close();
    var cur2 = lsGet(KEY), res = commit(pre, {});
    if (res.err) { errBox(res.err); return; }
    if (cur2) lsSet(slot, cur2); else { try { localStorage.removeItem(slot); } catch (e) {} }
    if (slot === PRE) setMeta({ mvLast: null, mvJust: false }); else setMeta({ mvJust: false });
    toast('가져오기 전 진행으로 되돌렸습니다');
    relaunch(res.s, null);
  });
}
// 주소의 #import= 를 열자마자 지운다 (주소창·방문 기록·공유에 남지 않게). 결정할 때까지만 이 탭의 sessionStorage 에.
function takeHash() {
  var h = String(location.hash || '');
  if (h.indexOf('#import=') !== 0) return null;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { try { location.hash = ''; } catch (x) {} }
  var c = h.slice(8);
  return c.length > CODE_MAX + 100 ? 'TB1x' : c;
}
function webBoot() {
  var c = takeHash(); if (c) ssSet(PEND, c);
  function go() {
    var p = ssGet(PEND);
    if (p) { M.importCode(p, 'link'); return; }
    var ok = ssGet(OKF); if (ok) { ssSet(OKF, null); var s = G().save; setTimeout(function () { var cont = document.getElementById('btnCont'); if (ok === '1' && cont) cont.click(); setTimeout(function () { if (G().save && ok === '1') welcome(G().save); else toast('가져오기 전 진행으로 되돌렸습니다'); }, 300); }, 50); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(go, 150); }); else setTimeout(go, 150);
  window.addEventListener('hashchange', function () { var c2 = takeHash(); if (c2) { ssSet(PEND, c2); M.importCode(c2, 'link'); } });
}

// ═════ claude 판: 내보내는 쪽 ═════
function useCap(name) {
  return new Promise(function (res) {
    var C = window.claude; if (!C || typeof C.use !== 'function') { res(null); return; }
    var done = false, t = setTimeout(function () { if (!done) { done = true; res(null); } }, 10000);
    try { Promise.resolve(C.use(name)).then(function (v) { if (!done) { done = true; clearTimeout(t); res(v || null); } }, function () { if (!done) { done = true; clearTimeout(t); res(null); } }); } catch (e) { done = true; clearTimeout(t); res(null); }
  });
}
var dlP = null;
function downloads() { if (!dlP) dlP = useCap('downloads'); return dlP; }
function hasCloud() { var o = onl(); return !!(o && o.uid && o.cloud); }
function fighting() { var g = G(); return !!(g.running && g.sim && g.sim.combat); }
// 클라우드 상태가 정해질 때까지(최대 10초) 기다린다 — 런타임이 늦게 오면 「클라우드 없음」으로 잘못 보지 않게 (review D-1)
function onlReady() {
  var o = onl(); if (WEB || !o || o.st !== 'wait') return Promise.resolve();
  return new Promise(function (res) { var t0 = Date.now(), iv = setInterval(function () { if (o.st !== 'wait' || Date.now() - t0 > 10500) { clearInterval(iv); res(); } }, 250); });
}
M.open = function () {
  if (fighting()) { snd('cancel'); toast('싸움이 끝난 뒤에 옮기세요', 3200); return; }      // 쓰러진 지휘관이 받는 쪽에서 전사로 확정되지 않게 (review A-7)
  flush();
  var q = ov('<h2>' + (WEB ? '공식 주소로 옮겨 가기' : '저장 가지고 이사하기') + '</h2><div id="mvBody" class="mvbody"><p class="dim">저장을 읽는 중…</p></div><button class="btn wide" data-close id="mvClose">닫기</button>', 'mvout');
  if (!q) return;
  snd('open');
  var body = q.querySelector('#mvBody'), o = onl(), lraw = lsGet(KEY);
  if (!WEB && o && o.st === 'wait') body.innerHTML = '<p class="dim">claude 클라우드 저장을 읽는 중…</p>';
  onlReady().then(function () {
    return !WEB && o && o.uid && o.cloudGet ? Promise.race([o.cloudGet(), new Promise(function (r) { setTimeout(function () { r(null); }, 8000); })]) : null;
  }).then(function (c) {
    var noId = !WEB && o && o.st === 'ready' && !o.uid;
    if (!q.isConnected) return;
    var loc = lraw ? DS.Save.peek(lraw) : null, cs = c ? DS.Save.peek(c.raw) : null;
    if (!loc && !cs) {
      body.innerHTML = (WEB && o && o.uid ? '<p>이 기기에는 저장이 없습니다. 공식 주소에서 같은 계정으로 로그인하면 클라우드 저장으로 이어집니다.</p>' : '<p>옮길 저장이 없습니다. ' + NM() + '에서 새로 시작하세요.</p>' + (noId ? '<p class="dim">이 보기에서는 claude 클라우드 저장을 못 읽습니다. 로그인한 상태로 열면 옮길 수 있습니다.</p>' : '')) + '<a class="btn gold wide" id="mvGo" href="' + esc(DS.WEB_URL) + '" target="_blank" rel="noopener">' + NM() + ' 열기 ↗</a>';
      return;
    }
    var cloudNewer = loc && cs && c.raw !== lraw && c.at > (+meta().cloudAt2 || 0) + 1000;
    if (cloudNewer) {
      body.innerHTML = '<p>어느 저장을 옮길까요?</p><div class="ocmp">' + box('이 기기', sumOf(loc), '') + box('claude 클라우드', sumOf(cs), ago(c.at) + ' · 더 새것') + '</div>' +
        '<div class="mvsrc"><button class="btn wide" data-mvsrc="local">이 기기 저장</button><button class="btn gold wide" data-mvsrc="cloud">클라우드 저장</button></div>';
      body.querySelectorAll('[data-mvsrc]').forEach(function (b) { b.addEventListener('click', function () { snd('tap'); var cloud = b.dataset.mvsrc === 'cloud'; build(q, body, cloud ? c.raw : lraw, cloud ? 'cloud' : 'local', cloud ? cs : loc); }); });
      return;
    }
    if (loc) build(q, body, lraw, 'local', loc); else build(q, body, c.raw, 'cloud', cs);
  });
};
function passOn(s) { return !!(s && s.eg && s.eg.pass) || !!(DS.egPassOn && G().save && DS.egPassOn(G().save)); }      // 3.3.0: 스무 해 창 동안은 이사 코드를 만들지 않는다
function build(q, body, raw, from, s) {
  if (passOn(s)) { body.innerHTML = '<p>' + esc((DS.LORE && DS.LORE.gen && DS.LORE.gen.up) || '스무 해 창을 닫은 뒤에 올릴 수 있다.') + '</p>'; return; }
  var sm = sumOf(s);
  body.innerHTML = '<p class="dim">이사 코드를 만드는 중…</p>';
  M.encode(raw, { o: from, sum: sm ? { name: sm.name, cls: sm.cls, tier: sm.tier, cleared: sm.cleared } : null }).then(function (code) {
    if (!q.isConnected) return;
    var url = DS.WEB_URL + '#import=' + code, linkOk = url.length <= URL_MAX;
    body.innerHTML = '<div class="ocmp one">' + box(from === 'cloud' ? '옮길 저장 (claude 클라우드)' : '옮길 저장 (이 기기)', sm, '이사 코드 ' + kb(code.length) + (code.charAt(3) === 'j' ? ' · 압축 없음' : '')) + '</div>' +
      (linkOk ? '<a class="btn gold wide" id="mvGo" href="' + esc(url) + '" target="_blank" rel="noopener">' + NM() + '에서 열기 ↗</a><p class="dim">새 탭에 ' + esc(host()) + ' 가 열리면 「가져오기」를 누르세요.</p>'
        : '<p class="warn">저장이 커서 링크로 못 보냅니다. 코드를 복사하거나 파일로 받으세요.</p>') +
      '<button class="btn wide" id="mvCopy">이사 코드 복사</button><button class="btn wide" id="mvFile" hidden>파일로 받기</button>' +
      '<details class="mvraw"><summary>코드 직접 보기</summary><textarea id="mvCode" class="mvta" rows="4" readonly>' + esc(code) + '</textarea></details>' +
      '<p class="dim">링크가 안 열리면 코드를 복사해 ' + esc(host()) + ' → 메뉴 → 설정 → 「이사 코드 붙여넣기」에 넣으세요. 다른 기기로 옮길 때도 같습니다.</p><p class="dim">' + (WEB ? '이 주소의 저장은 지우지 않습니다.' + (onl() && onl().uid ? ' 클라우드 저장은 같은 계정으로 로그인하면 이어집니다.' : '') : '이 판의 저장은 지우지 않습니다.') + '</p>';
    var go = body.querySelector('#mvGo'), cp = body.querySelector('#mvCopy'), fb = body.querySelector('#mvFile'), ta = body.querySelector('#mvCode');
    if (go) go.addEventListener('click', function () { snd('ok'); setMeta({ mvAt: Date.now() }); toast('새 탭이 열리면 「가져오기」를 누르세요', 4200); });
    cp.addEventListener('click', function () {
      snd('tap');
      copyText(code, ta).then(function (ok) {
        if (ok) { setMeta({ mvAt: Date.now() }); toast('복사했습니다. ' + NM() + ' 설정 → 「이사 코드 붙여넣기」에 넣으세요', 4200); }
        else { var d = body.querySelector('.mvraw'); if (d) d.open = true; try { ta.focus(); ta.select(); } catch (e) {} toast('복사가 막혔습니다. 아래 상자의 코드를 길게 눌러 복사하세요', 4200); }
      });
    });
    ta.addEventListener('focus', function () { try { ta.select(); } catch (e) {} });
    downloads().then(function (dl) {
      if (!dl || !q.isConnected) return;
      fb.hidden = false;
      fb.addEventListener('click', function () {
        snd('tap'); var D = new Date(), ymd = D.getFullYear() + ('0' + (D.getMonth() + 1)).slice(-2) + ('0' + D.getDate()).slice(-2);
        Promise.resolve(dl.save({ filename: 'tenbanners-move-' + ymd + '.txt', data: code + '\n\n전민 이사 코드. ' + host() + ' → 메뉴 → 설정 → 「파일에서 불러오기」로 이 파일을 고르세요.\n' }))
          .then(function () { setMeta({ mvAt: Date.now() }); toast('파일로 받았습니다'); }, function (e) { toast(e && e.code === 'declined' ? '받기를 그만두었습니다' : '파일로 받지 못했습니다. 코드를 복사하세요', 3600); });
      });
    });
  });
}
function copyText(t, ta) {
  var p;
  try { p = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject(); } catch (e) { p = Promise.reject(); }
  return p.then(function () { return true; }, function () {
    try { var d = ta.closest('details'); if (d) d.open = true; ta.focus(); ta.select(); return !!document.execCommand('copy'); } catch (e) { return false; }
  });
}
// 타이틀 안내 카드: 닫으면 공지사항 옆의 작은 글단추(「새 집 안내」 / 예비 주소에서는 「주소 안내」)만 남는다
var cardSig = '';
function lnkName() { return WEB ? '주소 안내' : '새 집 안내'; }
function cardHtml() {
  var at = +meta().mvAt || 0, has, head, body, go, start;
  if (WEB) {      // 예비 주소의 Firebase 판
    var o = onl(), inn = !!(o && o.uid);
    has = !!lsCur();
    head = '공식 주소가 바뀌었습니다';
    body = at ? '이사 링크를 ' + ago(at) + ' 만들었습니다. 공식 주소에서 이어 하세요.' : '공식 주소는 ' + esc(host()) + ' 입니다. 이 주소는 당분간 예비로 둡니다.' +
      (inn ? ' 같은 계정으로 로그인하면 클라우드 저장으로 이어집니다.' : ' 이 기기의 진행은 아래 단추로 가져갑니다.');
    go = '저장 가지고 옮겨 가기'; start = '공식 주소 열기 ↗';
  } else {
    has = !!lsCur() || hasCloud();
    head = '새 집으로 옮겼습니다';
    body = at ? '이사 링크를 ' + ago(at) + ' 만들었습니다. 새 집에서 이어 하세요. 그 뒤 진행도 다시 옮길 수 있습니다.' : '새 주소에서는 구글로 로그인해 휴대폰과 컴퓨터에서 같은 판을 이어 합니다. 이 판도 닫지 않습니다.';
    go = '저장 가지고 이사하기'; start = '새 집에서 시작하기 ↗';
  }
  return '<div id="mvCard" class="mvcard"><button class="mvx" data-mv="hide" aria-label="안내 닫기">✕</button><b>' + head + '</b><p>' + body + '</p>' +
    (has ? '<button class="btn gold wide" id="btnMoveGo" data-mv="open">' + go + '</button><div class="mvmore"><small class="mvurl">' + esc(host()) + '</small><button class="lnk mvlnk" id="btnMoveMore" data-mv="open">다른 방법(코드·파일)</button></div>'
      : '<a class="btn gold wide" id="mvGoNew" href="' + esc(DS.WEB_URL) + '" target="_blank" rel="noopener">' + start + '</a><small class="mvurl">' + esc(host()) + '</small>') + '</div>';
}
// 타이틀에서는 게임이 돌지 않으니, 원본이 이 기기 하나뿐이면 카드를 그릴 때 코드를 만들어 금색 단추를 바로 새 집 링크로 바꾼다 (한 번 누르기, review C-2)
var cardCode = { raw: null, code: null };
function cardLink(c) {
  var o = onl(), raw = lsCur(), b = c && c.querySelector('#btnMoveGo'); if (!b || !raw) return;
  if (!WEB && o && (o.st === 'wait' || (o.uid && o.cloud && o.cloud.at > (+meta().cloudAt2 || 0) + 1000))) return;      // 클라우드가 더 새것일 수 있으면 이사 창에서 고르게 한다
  function put(code) {
    var url = DS.WEB_URL + '#import=' + code; if (url.length > URL_MAX || !b.isConnected) return;
    var a = document.createElement('a'); a.className = b.className; a.id = b.id; a.textContent = b.textContent; a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', function () { snd('ok'); setMeta({ mvAt: Date.now() }); toast('새 탭이 열리면 「가져오기」를 누르세요', 4200); setTimeout(card, 400); });
    b.parentNode.replaceChild(a, b);
  }
  if (cardCode.raw === raw && cardCode.code) { put(cardCode.code); return; }
  var s = DS.Save.peek(raw); if (!s || passOn(s)) return;
  M.encode(raw, { o: 'local' }).then(function (code) { cardCode = { raw: raw, code: code }; put(code); });
}
function card() {
  try {
    var el = document.getElementById('s-title'), tb = el && el.querySelector('.title-bottom'); if (!tb) return;
    var c = document.getElementById('mvCard'), l = document.getElementById('btnMove');
    if (!sender()) { if (c) c.remove(); if (l) l.remove(); cardSig = ''; return; }
    var o = onl(), hide = !!meta().mvHide, sig = (hide ? 'h' : 's') + '|' + !!lsGet(KEY) + hasCloud() + !!(o && o.uid) + (o && o.st) + (o && o.cloud ? o.cloud.at : 0) + (meta().mvAt || 0);
    if (sig === cardSig && (hide ? l : c)) return;
    cardSig = sig;
    if (c) c.remove(); if (l) l.remove();
    if (!hide) { var w = document.createElement('div'); w.innerHTML = cardHtml(); var nc = w.firstChild, nb = document.getElementById('btnNew'); tb.insertBefore(nc, nb && nb.parentNode === tb ? nb : tb.firstChild); cardLink(nc); }      // 「이어하기」 아래 — 매일 하던 사람이 접힘선 아래로 밀리지 않게 (review F-1)
    else { var tv = tb.querySelector('.tver'); if (tv) { var b = document.createElement('button'); b.id = 'btnMove'; b.className = 'lnk'; b.dataset.mv = 'show'; b.textContent = lnkName(); tv.insertBefore(b, tv.lastChild); } }
  } catch (e) {}
}
M.card = card;
function titleWatch() {
  function watch() {
    var el = document.getElementById('s-title'); if (!el) return;
    if (window.MutationObserver) new MutationObserver(function () { card(); }).observe(el, { childList: true, subtree: true });
    card();
    setInterval(function () { if (!el.hidden) card(); }, 2000);      // 클라우드 상태는 화면을 바꾸지 않고 오기도 한다 (바뀐 게 없으면 card 는 바로 돌아간다)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(watch, 0); }); else setTimeout(watch, 0);
}

// ── 설정 칸 (ui.js tabOpt 가 부른다) ──
function sendRows() {
  var hide = !!meta().mvHide;
  return (WEB ? '<div class="row"><div class="tx"><b>공식 주소로 옮겨 가기</b><small>' + esc(host()) + ' 로 이 기기의 진행을 가져갑니다. 클라우드 저장은 같은 계정으로 로그인하면 이어집니다.</small></div><button class="btn small gold" data-mv="open" id="btnMoveOpt">옮겨 가기</button></div>'
      : '<div class="row"><div class="tx"><b>새 집으로 옮겼습니다</b><small>' + esc(host()) + ' 로 지금 진행을 가져갑니다. 그곳에서는 구글로 로그인해 클라우드에 저장합니다.</small></div><button class="btn small gold" data-mv="open" id="btnMoveOpt">이사하기</button></div>') +
    '<div class="row"><div class="tx"><b>타이틀 안내 카드</b><small>타이틀 화면의 「' + (WEB ? '공식 주소가 바뀌었습니다' : '새 집으로 옮겼습니다') + '」 안내</small></div><button class="btn small' + (hide ? '' : ' gold') + '" data-mv="card">' + (hide ? '끔' : '켬') + '</button></div>';
}
function optBody() {
  if (!WEB) return sendRows();
  var pre = !!lsGet(PRE);
  return (oldWeb() ? sendRows() : '') +
    '<div class="row"><div class="tx"><b>이사 코드 붙여넣기</b><small>claude 판이나 예비 주소에서 만든 코드로 진행을 가져옵니다. 가져오기 전에 두 저장을 보여 주고 묻습니다.</small></div><button class="btn small" data-mv="paste">붙여넣기</button></div>' +
    '<div class="row"><div class="tx"><b>파일에서 불러오기</b><small>claude 판에서 받은 이사 파일(.txt)을 고릅니다.</small></div><button class="btn small" data-mv="file">파일 고르기</button></div>' +
    (pre ? '<div class="row"><div class="tx"><b>가져오기 되돌리기</b><small>가져오기 전 진행과 지금 진행을 맞바꿉니다.</small></div><button class="btn small" data-mv="undo">되돌리기</button></div>' : '');
}
M.opt = function () { try { return '<h4>' + (WEB ? (oldWeb() ? '저장 옮기기' : '이사해 온 저장') : '새 집으로 이사') + '</h4><div id="mvOpt">' + optBody() + '</div>'; } catch (e) { return ''; } };
function redrawOpt() { var p = document.getElementById('mvOpt'); if (p) p.innerHTML = optBody(); }

document.addEventListener('click', function (e) {
  var t = e.target && e.target.closest ? e.target.closest('[data-mv]') : null; if (!t || t.disabled) return;
  try {
    try { if (DS.Audio && DS.Audio.unlock) DS.Audio.unlock(); } catch (x) {}
    var k = t.dataset.mv;
    if (k === 'open') { snd('tap'); M.open(); return; }
    if (k === 'hide') { snd('cancel'); setMeta({ mvHide: true }); card(); toast('공지사항 옆 「' + lnkName() + '」로 다시 봅니다', 3200); return; }
    if (k === 'show') { snd('tap'); setMeta({ mvHide: false }); card(); return; }
    if (k === 'card') { snd('tap'); setMeta({ mvHide: !meta().mvHide }); redrawOpt(); card(); return; }
    if (k === 'paste') { snd('tap'); pasteBox(); return; }
    if (k === 'file') { snd('tap'); filePick(); return; }
    if (k === 'undo') { snd('tap'); undoAsk(); return; }
  } catch (x) {}
});

// 모양 (이 파일만 쓰는 것 — style.css 는 건드리지 않는다)
try {
  var css = document.createElement('style'); css.id = 'mvCss';
  css.textContent = '.mvcard{position:relative;display:grid;gap:8px;padding:12px 12px 10px;border:1px solid var(--ember2);border-radius:8px;background:linear-gradient(180deg,rgba(240,182,74,.12),rgba(240,182,74,.03)),var(--ink2);text-align:left}' +
    '.mvcard>b{color:var(--ember);font-size:var(--fs-m);font-family:var(--f-11);padding-right:36px}.mvcard p{font-size:var(--fs-m);font-family:var(--f-11);color:var(--bone);margin:0}.mvcard .btn{margin-top:2px}' +
    '.mvcard .mvurl{justify-self:center;font-size:var(--fs-m);font-family:var(--f-11);color:var(--mute)}' +
    '.mvx{position:absolute;top:2px;right:2px;width:40px;height:40px;display:grid;place-items:center;background:none;border:0;color:var(--mute);font-size:var(--fs-m);font-family:var(--f-11);cursor:pointer}' +
    'a.btn{text-decoration:none;box-sizing:border-box}' +
    '.result.mv-ask{gap:10px}.result.mv-ask h2{font-size:var(--fs-x);font-family:var(--f-11);font-weight:700}.result.mv-ask .ocmp.one{grid-template-columns:1fr}.result.mv-ask .mvbody{display:grid;gap:10px;width:100%}' +
    '.result.mv-ask .mvsrc{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}' +
    '.result.mv-ask .mvraw{width:100%;text-align:left;font-size:var(--fs-m);font-family:var(--f-11);color:var(--mute)}.result.mv-ask .mvraw summary{min-height:40px;display:flex;align-items:center;cursor:pointer}' +
    '.mvta{width:100%;box-sizing:border-box;font:12px/1.4 ui-monospace,monospace;color:var(--bone);background:var(--ink);border:1px solid var(--line);border-radius:6px;padding:8px;word-break:break-all;resize:vertical}' +
    '.result.mv-ask .mvwarn{color:var(--bone);font-size:var(--fs-m);font-family:var(--f-11)}.result.mv-ask .mvapp{font-size:var(--fs-m);font-family:var(--f-11)}.result.mv-ask .mvacct{width:100%;text-align:left}' +
    '.mvcard .mvmore{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.mvcard .mvmore .mvurl{justify-self:auto}.mvcard .mvlnk{min-height:40px;padding:0 4px;font-size:var(--fs-m);font-family:var(--f-11);font-weight:400;color:var(--mute)}';
  (document.head || document.documentElement).appendChild(css);
} catch (e) {}

if (WEB) webBoot();
titleWatch();
})();

