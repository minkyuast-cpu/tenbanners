// 열 개의 깃발 — 맺음 뒤: 「다음 세대의 장」 (설계서 r7/endgame_spec.md · 3.3.0 r9/nextgen/SPEC.md)
// 30번 맺음 뒤 원할 때 장을 열면 스무 해가 한 해씩 흐르고(스무 해 창), 그 끝 새벽에 관의 한 사람을 열다섯 살로 다시 부른다.
// 그다음 1번부터 30번까지 같은 길을 다시 걷는다. 가문·후계·관·장비·공훈은 이어지고, 사람의 레벨은 스무 해의 평화 동안 모두 1로 돌아간다 (2.7.1 DS.egPeace). 적은 본편의 레벨에 대마다 세기 배율이 붙는다.
// 저장: save.eg = { gen, on, c, t0, hist, intro, seed, call, pass?, roll } (DS.egFix 가 채움, SAVE_V 그대로)
//   위쪽은 순수 함수(화면과 봇 tools/campaign.js 가 같은 것을 부른다). 「── 화면」 아래는 브라우저에서만.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

DS.EG = { years: 20, L0: 70, step: 0.35, cap: 2.0, last: 30, P: [0, 85, 70, 55, 40, 25], fresh: 30, freshCap: 90, salt: 9173, gold: 0.5, scnGold: 0.6 };      // r12 경제: gold — 장이 진행 중일 때 처치 골드 배율(들판·장 시나리오) · scnGold — 장 시나리오 보상 골드 배율(다시 깸 35% 위에)      // years: 스무 해 · P: 돌아올 등급별 가망(일반 85 … 전설 25) · fresh: 지난 새벽 뒤 떠난 이의 덧셈(최대 freshCap)
// 장의 글은 lore.js(DS.LORE.gen)에 있다. 여기는 거기 없는 것만: 막의 첫 줄(act) · 쓰러진 곳(fell). {a} 이름  (2.4.1: 늘 가려져 쓰이지 않던 옛 intro · close 기본 글은 걷었다)
DS.EG_TXT = {
  // r24: 막의 첫 판(1·11·21번)에만, 대수에 따라 돌아가며 — 처음 오는 길인데 낯익다 (같은 줄이 열 판 내내 되풀이되지 않게)
  act: { 1: ['처음 오는 길인데 발이 먼저 안다. 선대가 걸은 길이다.', '선대 단톡방이 길을 일러 준다. 「왼쪽이다.」 「아니다, 오른쪽이다.」', '이 방앗간 이야기는 자장가로 들었다.'],
         2: ['샘돌 끝 칸에 선대의 이름이 있다. 그 옆 칸이 비어 있다.', '모래 위 발자국이 낯익다. 선대의 것이다.', '처음 보는 샘인데, 물맛을 안다.'],
         3: ['먼동이 따라와 혀를 찬다. 「네 선대도 여기서 헤맸다.」', '잿빛 변경. 처음인데 돌아온 것만 같다.', '문 앞까지 몇 걸음인지 몸이 먼저 센다.'] },
  fell: '{a}{이가} 쓰러진 곳이다.'
};
function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function path(o, k) { var a = String(k).split('.'); for (var i = 0; i < a.length; i++) { if (!o || typeof o !== 'object' || !own(o, a[i])) return undefined; o = o[a[i]]; } return o; }
function txt(k) { var L = DS.LORE && DS.LORE.gen, v = L ? path(L, k) : undefined; return v !== undefined ? v : path(DS.EG_TXT, k); }
function bat(w) { w = String(w).replace(/[」』"'\)\]\s.]+$/, ''); var c = String(w).charCodeAt(String(w).length - 1); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : (/[013678]$/.test(String(w)) ? 1 : 0); }
function jo(w, pair) { if (pair === '으로') { var b = bat(w); return b && b !== 8 ? '으로' : '로'; } if (pair === '이냐') return bat(w) > 0 ? '이냐' : '냐'; return bat(w) > 0 ? pair[0] : pair[1]; }
function fill(t, v) {
  t = t && typeof t === 'object' && !(t instanceof Array) ? t.t : t;
  return String(t == null ? '' : t).replace(/\{(\w+)\}(\{(이가|은는|을를|과와|으로|이냐)\})?/g, function (all, k, j, pair) { var w = v && v[k] != null ? String(v[k]) : (k === 'hero' ? all : k === 'yw' ? curYW() : ''); return w + (pair ? jo(w, pair) : ''); });
}
// 글 한 덩이 → 줄 목록. 줄은 글 또는 { w: 화자, t: [줄…] }. { pick: [벌…] } 은 seed 로 한 벌
function lineList(a, v, seed) {
  if (a && typeof a === 'object' && !(a instanceof Array) && a.pick instanceof Array) a = a.pick[Math.abs(Math.floor(seed || 0)) % a.pick.length];
  a = a instanceof Array ? a : a != null ? [a] : [];
  return a.map(function (l) { return l && typeof l === 'object' ? { w: fill(l.w, v), t: (l.t instanceof Array ? l.t : [l.t]).map(function (x) { return fill(x, v); }) } : fill(l, v); });
}
function lines(k, v, seed) { return lineList(txt(k), v, seed); }
DS.egT = function (k, v, seed) { return lines(k, v, seed); };
DS.egT1 = function (k, v, seed) { var l = lines(k, v, seed)[0]; return l == null ? '' : typeof l === 'object' ? l.t.join(' ') : l; };
DS.egFlat = function (L) { var out = []; (L || []).forEach(function (l) { if (l && typeof l === 'object') l.t.forEach(function (x, i) { out.push((i ? '' : l.w + '  ') + x); }); else out.push(l); }); return out; };
var NUMN = ['영', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'], NUMA = ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
var AGEW = { 5: '다섯', 8: '여덟', 12: '열두', 15: '열다섯' };
function numN(n) { return n >= 0 && n <= 10 ? NUMN[n] : String(n); }
function numA(n) { return n >= 0 && n <= 10 ? NUMA[n] : String(n); }
DS.egNumN = numN;
function h2(a, b, c) { return DS.hash2(a | 0, b | 0, c | 0); }
function hstr(t) { t = String(t); var h = 0x811c9dc5 | 0; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul ? Math.imul(h, 16777619) : (h * 16777619) | 0; } return h | 0; }

// ── 저장 ──
DS.egSeed = function (s) {      // 31비트 정수. 저장 안의 바뀌지 않는 것에서 결정적으로 (같은 저장이면 언제 채워도 같은 값)
  var P = s && s.lin && s.lin.P, k0 = null, by = '';
  if (P) for (var k in P) if (k0 == null || +k < k0) k0 = +k;
  if (k0 != null && P[k0] && P[k0].by != null) by = Math.round(+P[k0].by);
  var h = hstr([(s.lin && s.lin.sur) || '', s.hero || 0, by, s.name || ''].join('|'));
  return (Math.floor(h2(h, 7177, 31) * 2147483646) + 1) | 0;
};
var FACES = { years: 1, keep: 1, hand: 1, call: 1 };
DS.egFix = function (s) {
  if (!s || typeof s !== 'object') return s;
  var e = s.eg; if (!e || typeof e !== 'object' || Array.isArray(e)) e = s.eg = {};
  e.gen = Math.max(1, Math.round(+e.gen || 1));
  e.on = e.on && e.gen > 1 ? 1 : 0;
  if (!e.c || typeof e.c !== 'object' || Array.isArray(e.c)) e.c = {};
  for (var k in e.c) if (!(+k >= 1 && +k <= DS.SCENARIOS.length) || !e.c[k]) delete e.c[k]; else e.c[k] = 1;
  e.t0 = Math.max(0, +e.t0 || 0);
  e.hist = (Array.isArray(e.hist) ? e.hist : []).filter(function (h) { return h && typeof h === 'object' && +h.g >= 1; }).map(function (h) { var o = { g: Math.round(+h.g), t: Math.max(0, Math.round(+h.t || 0)) }; if (h.w != null && DS.standFixRec) { var r = DS.standFixRec(h); o.w = r.w; o.r = r.r; o.b = r.b; o.p = r.p; o.last = r.last; if (r.lp) o.lp = r.lp; } return o; }).slice(-20);      // 2.8: 그 대의 마지막 물결 (stand.js)
  e.intro = e.intro ? 1 : 0;
  // 3.3.0
  if (!(+e.seed >= 1 && +e.seed <= 2147483647 && Math.floor(+e.seed) === +e.seed) && s.chars) e.seed = DS.egSeed(s);
  if (e.call && (typeof e.call !== 'object' || Array.isArray(e.call) || !(+e.call.g >= 1))) delete e.call;
  if (e.call) { e.call.g = Math.round(+e.call.g); e.call.used = [0, 1, 2].indexOf(+e.call.used) >= 0 ? +e.call.used : 0; }
  if (e.on && e.gen > 1 && !e.call) e.call = { g: e.gen, used: 0, late: 1 };      // 3.2.x 의 진행 중인 장: 「밀린 새벽」 한 번 (마을에서 알림)
  var ps = e.pass;
  if (ps && (typeof ps !== 'object' || Array.isArray(ps) || +ps.g !== e.gen || !FACES[ps.f] || !e.on)) { delete e.pass; ps = null; }
  if (ps) { ps.years = +ps.years >= 1 && +ps.years <= 60 ? Math.round(+ps.years) : DS.EG.years; ps.y = Math.max(0, Math.min(ps.years, Math.round(+ps.y || 0))); if (!Array.isArray(ps.L)) ps.L = []; if (!Array.isArray(ps.dead)) ps.dead = []; ps.nl = Math.max(0, +ps.nl || 0); ps.na = Math.max(0, +ps.na || 0); }
  e.roll = (Array.isArray(e.roll) ? e.roll : []).filter(function (r) { return r && typeof r === 'object' && +r.g >= 1; });
  if (s.coffins && Array.isArray(s.coffins.list) && DS.linRecRg) s.coffins.list.forEach(function (r) { if (!(+r.rg >= 1 && +r.rg <= 5)) r.rg = DS.linRecRg(r); if (r.tr) r.tr = 1; var q = s.lin && s.lin.P && s.lin.P[r.pid]; if (!r.seat && q && q.seat) r.seat = q.seat; if (!r.head && q && q.k === 'c' && q.seat && q.seat === s.hero) r.head = 1; });
  if (DS.standFix) DS.standFix(s);      // 2.8 마지막 물결: 치르던 표는 그때까지 막은 물결로 끝낸다
  if (s.chars) s.need = '3.3.0';      // 이 저장을 읽을 최소 판 (앞으로의 판이 거른다 — save.js)
  return s;
};
function E(s) { if (!s.eg || typeof s.eg !== 'object') DS.egFix(s); return s.eg; }
DS.egOn = function (s) { return !!(s && s.cleared && s.cleared[DS.EG.last]); };      // 맺음을 보았는가
DS.egActive = function (s) { return DS.egOn(s) && !!(s.eg && s.eg.on); };      // 장이 진행 중인가
DS.egGen = function (s) { return s && s.eg ? s.eg.gen || 1 : 1; };
DS.egDone = function (s) { if (!DS.egActive(s)) return 0; var n = 0; for (var k in s.eg.c) if (s.eg.c[k]) n++; return n; };      // 이 장에서 깬 수
DS.egPassOn = function (s) { return !!(s && s.eg && s.eg.pass); };
// 2.8: 창의 길이 (평화의 해). 창이 열려 있으면 그 창의 것, 아니면 이 대에 치른 마지막 물결이 지킨 해, 그것도 없으면 지난 창(또는 스무 해)
DS.egYears = function (s) {
  var e = s && s.eg, ps = e && e.pass; if (ps && +ps.years >= 1) return Math.round(+ps.years);
  var d = DS.standDone ? DS.standDone(s) : null; if (d) return d.p;
  return DS.EG.years;
};
DS.egYW = function (s) { return DS.standYW ? DS.standYW(DS.egYears(s)) : '스무 해'; };      // 「열일곱 해」
DS.egYearsNow = function (s) { var e = s && s.eg; if (!e) return DS.EG.years; if (e.pass || (DS.standDone && DS.standDone(s))) return DS.egYears(s); var r = (e.roll || [])[(e.roll || []).length - 1]; return r && +r.y >= 1 ? Math.round(+r.y) : DS.EG.years; };      // 글의 {yw}: 열린 창 · 이번 물결 · 지난 창
function curYW() { var s = DS.G && DS.G.save; return DS.standYW ? DS.standYW(s ? DS.egYearsNow(s) : DS.EG.years) : '스무 해'; }
DS.onlineCanUpload = function (s) { return !DS.egPassOn(s) && !(DS.standOn && DS.standOn(s)); };      // 스무 해 창 동안은 클라우드 올리기·이사 코드를 끈다 (주사위를 되돌리는 길을 막는다)

// ── 사람 ──
function LP(s) { return (s.lin && s.lin.P) || {}; }
function nm(s, pid) { var p = LP(s)[pid]; if (!p) return '누군가'; if (p.c && s.chars[p.c] && p.c === s.hero && s.chars[p.c].pid === p.id && !(p.gv && p.n)) return s.name || DS.charName(s.chars[p.c]); return p.gv && p.n ? p.n : DS.linName ? DS.linName(s, pid) : p.n || '누군가'; }
DS.egName = nm;
function heroP(s) { var h = s.chars[s.hero]; return h && h.pid ? LP(s)[h.pid] : null; }
function mercOf(s, id) { for (var i = 0; i < s.mercs.length; i++) if (s.mercs[i].id === id) return s.mercs[i]; return null; }
function entP(s, p) { if (!p || p.st !== 'live') return null; if (p.c) { var c = s.chars[p.c]; return c && c.pid === p.id ? c : null; } if (p.m) { var m = mercOf(s, p.m); return m && m.pid === p.id ? m : null; } return null; }
function isKid(q, p) { var pa = q.pa || []; return pa.indexOf(p.id) >= 0 || !!(p.fu && pa.some(function (x) { return p.fu.indexOf(x) >= 0; })); }
function kidsOf(s, p) { var P = LP(s), out = []; for (var k in P) if (P[k] !== p && isKid(P[k], p)) out.push(P[k]); return out.sort(function (a, b) { return a.id - b.id; }); }
function flagName(cls, s) {      // r16 words: 「흰 깃발」 꼴 대신 가문 이름 (「센주 가문」, 대장 줄이면 지금 문패)
  var hn = DS.flagHouse ? DS.flagHouse(s, cls) : ''; if (hn) return hn;      // DS.houseTitle 과 같은 이름 (banner.js)
  var C = DS.CLASSES[cls]; return C ? C.name + ' 가문' : '가문';
}
DS.egFlagName = flagName;
function kindName(type, g) { var M = DS.MERCS[type]; return (g && DS.GRADES[g] ? DS.GRADES[g].name + ' ' : '') + (M ? M.name : ''); }
function relWord(s, q, dp) {      // 고인 dp 에게 q 는 무엇인가 (맏이·둘째·들인 자식)
  if (!dp || !isKid(q, dp)) return '';
  if (q.ad) return '입양한 자식';
  var ks = kidsOf(s, dp).filter(function (x) { return !x.ad; }), i = ks.indexOf(q);
  return ['맏이', '둘째', '셋째', '넷째', '다섯째'][i] || (i + 1) + '째';
}
function yr(s) { return DS.calNow ? DS.calNow(s).yr : 0; }
function townName(s) { var z = DS.ZONES && DS.ZONES[s.town || 'haemil']; return (z && z.name) || '해밀'; }
function lifeOf(s, e) { return DS.ageLife ? DS.ageLife(s, e) : { age: null, ls: null, left: null }; }
function headLeft(s, e) { var L = lifeOf(s, e); if (L.age == null || !e.ls) return null; var ls = DS.ageHeadLs ? DS.ageHeadLs(s, e, e.pid) : e.ls; return Math.max(0, ls - L.age); }

// ── 장의 시나리오: 원래 것을 복제해 적 레벨과 난이도 배율만 바꾼다 (지도·적 종류·보스는 s.id 그대로) ──
function fellAt(s, name) {      // 가계도: 이곳에서 숨을 거둔 가장 최근 사람 (자연사는 빼고) → 사건
  var lg = s && s.lin && s.lin.log; if (!lg || !DS.linName) return null;
  for (var i = lg.length - 1; i >= 0; i--) { var e = lg[i]; if (e && e.t === 'death' && e.x && e.x.at === name && !(e.x.why && /천수/.test(e.x.why))) return e; }
  return null;
}
// 장 안의 기억 줄 (설계서 ②-라 mem.*): 그 판 도입 끝에 한 쌍. 말하는 이의 차례 — 돌아온 이 → 선대 → 가주
DS.egMemLine = function (s, id) {
  var b = DS.scn(id); if (!s || !b || !s.lin) return null;
  var P = LP(s), live = [], elders = [], k, p, g = E(s).gen;
  for (k in P) { p = P[k]; if (!entP(s, p)) continue; if (p.rv && p.d0) live.push(p); else if (p.hand) elders.push(p); }
  live.sort(function (a, c) { return a.id - c.id; }); elders.sort(function (a, c) { return a.id - c.id; });
  var i, r;
  for (i = 0; i < live.length; i++) { r = live[i]; if (r.d0.at === b.name && !/천수/.test(r.d0.why || '')) return { k: 'own', a: nm(s, r.id), pid: r.id, v: h2(r.id, g, 41) * 3 }; }
  for (i = 0; i < live.length; i++) { r = live[i]; if (/천수/.test(r.d0.why || '') && (r.born || 0) + 1 === id) return { k: 'first', a: nm(s, r.id), pid: r.id }; }
  var f = fellAt(s, b.name), fp = f && P[f.a]; if (!fp) return null;
  for (i = 0; i < live.length; i++) { r = live[i]; if (r.id !== fp.id && r.d0.tm != null && f.tm != null && r.d0.tm >= f.tm && (r.born || 0) <= (f.s || 0)) return { k: 'saw', a: nm(s, r.id), b: nm(s, fp.id), pid: r.id }; }
  for (i = 0; i < elders.length; i++) { r = elders[i]; if (r.id !== fp.id) return { k: 'elder', a: nm(s, r.id), b: nm(s, fp.id), pid: r.id }; }
  var hp = heroP(s);
  if (hp && hp.id !== fp.id) { var up = DS.linAncestors ? DS.linAncestors(s, hp.id) : {}, par = (hp.pa || []).indexOf(fp.id) >= 0; if (par || (up[fp.id] && (P[fp.id] && (P[fp.id].gen || 1) >= (hp.gen || 1) - 2))) return { k: 'heir', a: nm(s, hp.id), b: nm(s, fp.id), pid: hp.id }; }
  return null;
};
function memLines(m) {
  if (!m) return [];
  var v = { a: m.a, b: m.b }, sp = function (k, seed) { return lines(k, v, seed).map(function (l) { return typeof l === 'object' ? l : { w: m.a, t: [l] }; }); }, out = [];
  if (m.k === 'own') { out = lines('mem.own.stop', v).concat(sp('mem.own.say', m.v)); }
  else if (m.k === 'first') { out = lines('mem.first.stop', v).concat(sp('mem.first.say')); }
  else out = sp('mem.' + m.k);
  var flat = [];      // 이야기 창 한 줄씩: 말은 { w, t } 한 줄로
  out.forEach(function (l) { if (typeof l === 'object') l.t.forEach(function (x) { flat.push({ w: l.w || m.a, t: x }); }); else flat.push(l); });
  return flat;
};
DS.egMemText = memLines;
// ── 4.0 돌아온 어스름의 왕 (30번 맺음의 탈출 뒤) — 대마다 30번 도입 끝에, 이 대에 떠난 우리 사람의 이름을 쥐고 문 앞에 앉아 있다 ──
// 글은 lore.js gen.king (벌은 대수로 돌아가며). 이름 = 이 장을 연 뒤(스무 해 + 이 장의 싸움) 떠난 이, 장을 닫는 낭독(egCloseLines)과 같은 셈. 먼동의 말은 3대째까지, 그 뒤는 대장이 잇는다.
var SPK = { '옛 맹주 먼동': 'elder_mundong', '옛 대장 먼동': 'elder_mundong', '어스름의 왕': 'duskking' };
function erNames(s, g) { var r = s && s.erLast; return r && r.g === g - 1 && r.names && r.names.length ? r.names.slice() : []; }      // r24: 지난 대 30번에서 왕이 쥐고 간 이름
function goneNames(s, g) {
  var e = E(s), P = LP(s), t0 = e.t0 || 0, seen = {}, out = [];
  if (g) erNames(s, g).forEach(function (n) { if (!seen['n:' + n]) { seen['n:' + n] = 1; out.push(n); } });      // r24: 그 이름부터 (30번 「지워진 이름」 → 「이어지는 빚」)
  ((s.lin && s.lin.log) || []).forEach(function (ev) { if (ev && ev.t === 'death' && (ev.tm || 0) >= t0 && P[ev.a] && !seen[ev.a]) { seen[ev.a] = 1; var n = nm(s, ev.a); if (!seen['n:' + n]) { seen['n:' + n] = 1; out.push(n); } } });
  return out;
}
function headNm(s) { var h = s.chars && s.chars[s.hero]; try { return (h && DS.charName(h, s)) || s.name || '맹주'; } catch (x) { return s.name || '맹주'; } }
function flatSpk(out, hn) {      // 이야기 창 한 줄씩 — 말에는 초상 키(먼동·왕·대장)
  var flat = [];
  out.forEach(function (l) { if (l && typeof l === 'object') l.t.forEach(function (x) { var o = { w: l.w, t: x }, c = SPK[l.w] || (hn && l.w === hn ? 'hero' : ''); if (c) o.c = c; flat.push(o); }); else flat.push(l); });
  return flat;
}
DS.egKingLines = function (s, g) {
  if (!s || !s.lin || !(g > 1)) return [];
  var ers = erNames(s, g), names = goneNames(s, g), hn = headNm(s), v = { a: names[0] || '', e: ers[0] || '', list: names.slice(0, 6).join(', '), h: hn, n: g }, r = g - 2, old = g <= 3, out = [];
  out = out.concat(lines('king.shade', v, r));
  if (old) out = out.concat(lines('king.shadeDawn', v, r));
  out = out.concat(lines('king.come', v, r));
  if (names.length) out = out.concat(lines('king.hold', v), ers.length && txt('king.er') ? lines('king.er', v) : lines('king.say', v, r + (names.length % 2)), g === 2 ? lines('king.first', v) : [], lines(old ? 'king.dawn' : 'king.head', v, r));
  else out = out.concat(lines('king.empty', v), lines('king.emptySay', v), lines(old ? 'king.dawnEmpty' : 'king.headEmpty', v));
  return flatSpk(out, hn);
};
DS.egScn = function (n, g, save) {
  var b = DS.scn(n); if (!b) return null;
  var s = {}, k; for (k in b) s[k] = b[k];
  var C = DS.EG, last = DS.SCENARIOS.length;
  s.gen = g; s.base = b;
  s.L = b.L;      // 2.7.1: 스무 해의 평화 뒤에는 모두 1레벨에서 다시 시작한다 (DS.egPeace) — 적도 본편의 레벨 그대로, 세기 배율(diff)만 대마다 오른다. 예전: 1번이 L70 부터
  s.diff = (b.diff || 1) * Math.min(C.cap, 1 + C.step * (g - 1));
  var act = n <= 10 ? 1 : n <= 20 ? 2 : 3, ia = txt('act'), al = ia && ia[act], at = al instanceof Array ? al[Math.max(0, g - 2) % al.length] : al, intro = [n === (act - 1) * 10 + 1 ? fill(at || '', {}) : ''].filter(Boolean), fe = save ? fellAt(save, b.name) : null, who = '';
  if (fe) { try { who = nm(save, fe.a); } catch (x) { who = ''; } }      // 3.3.0: 기억 줄과 같은 이름(제 이름)으로
  if (who) intro.push(fill(txt('fell'), { a: who }));
  if (save) { var m = null; try { m = DS.egMemLine(save, n); } catch (x) { m = null; } if (m) { s.mem = m.k; intro = intro.concat(memLines(m)); } }
  if (save && n === last) { try { intro = intro.concat(DS.egKingLines(save, g)); } catch (x) { if (DS.DEBUG) throw x; } }      // 4.0: 돌아온 어스름의 왕
  s.intro = intro;
  return s;
};
DS.egNext = function (s) {
  if (!DS.egActive(s) || DS.egPassOn(s)) return null;
  for (var i = 0; i < DS.SCENARIOS.length; i++) { var id = DS.SCENARIOS[i].id; if (!s.eg.c[id]) return DS.egScn(id, s.eg.gen, s); }
  return null;
};
// 입구(game.js gateScn): 장이 진행 중이면 그 입구의 장 시나리오 (아니면 null → 원래 규칙)
DS.egGate = function (p, s) {
  if (!p || p.t !== 'gate' || !DS.egActive(s) || !p.ids || !p.ids.length) return null;
  for (var i = 0; i < p.ids.length; i++) if (!s.eg.c[p.ids[i]]) return DS.egScn(p.ids[i], s.eg.gen, s);
  return DS.egScn(p.ids[p.ids.length - 1], s.eg.gen, s);
};
// 잠금(game.js scnLock): 장 안의 앞 번호를 먼저 · 스무 해 창이 열려 있으면 잠근다
DS.egLock = function (sc, s) {
  if (DS.egPassOn(s)) return '평화의 창을 먼저 닫아야 합니다';
  if (!sc || !sc.gen || !DS.egActive(s)) return null;
  if (sc.gen !== s.eg.gen) return '지난 장의 시나리오입니다';
  if (sc.id > 1 && !s.eg.c[sc.id - 1]) { var pv = DS.scn(sc.id - 1).name; return '이 장의 앞 시나리오(' + (sc.id - 1) + '. ' + pv + ')' + jo(pv, '을를') + ' 먼저 끝내야 합니다'; }
  return null;
};

// ── 장을 연다 ──
function inFight() { var G = DS.G; return !!(G && (G.scn || (G.sim && G.sim.combat) || G.ending)); }
DS.egCanStart = function (s) {
  if (!DS.egOn(s)) return { ok: false, why: '30번 엔딩을 본 뒤에 열린다' };
  if (DS.egPassOn(s)) return { ok: false, why: '평화의 창이 열려 있다' };
  if (DS.standOn && DS.standOn(s) && inFight()) return { ok: false, why: '마지막 물결을 막는 중이다' };
  if (DS.egActive(s)) return { ok: false, why: E(s).gen + '대째의 장이 진행 중입니다' };
  if (inFight()) return { ok: false, why: '싸움이 끝난 뒤에 연다' };
  if (DS.linVacant && DS.linVacant(s).length) return { ok: false, why: '빈 가주 자리를 먼저 채워야 한다' };
  return { ok: true, why: '' };
};
// 확인 창의 묶음 (설계서 ②-가): 떠날 이·자랄 이·깃대·관·막사
DS.egForecast = function (s) {
  var Y = DS.egYears(s), P = LP(s), hero = s.chars[s.hero], hp = heroP(s), leave = [], grow = [], seen = {};
  function add(pid, name, role, ent) { if (seen[pid]) return; var L = lifeOf(s, ent); if (L.left == null || L.left > Y) return; seen[pid] = 1; leave.push({ pid: pid, name: name, role: role }); }
  if (hero && hp) { var hl = headLeft(s, hero); if (hl != null && hl <= Y) { seen[hp.id] = 1; leave.push({ pid: hp.id, name: nm(s, hp.id), role: 'head' }); } }
  DS.charList(s).forEach(function (c) { if (c.id === s.hero || c.vac) return; var b = DS.bearer ? DS.bearer(s, c) : null; if (b && b.pid) add(b.pid, nm(s, b.pid), 'flag', b); else if (c.pid) add(c.pid, nm(s, c.pid), 'flag', c); });      // 4.0: 깃발 든 이 (부대원 줄)
  var fam = []; if (hp) { if (hp.sp) fam.push(hp.sp); kidsOf(s, hp).forEach(function (q) { fam.push(q.id); }); (hp.pa || []).forEach(function (x) { fam.push(x); }); }
  fam.forEach(function (pid) { var q = P[pid], e = q && entP(s, q); if (e && q.m) add(pid, nm(s, pid), 'kin', e); });
  s.mercs.forEach(function (m) { var pid = m.pid || 'm' + m.id; add(pid, m.pid ? nm(s, m.pid) : DS.mercCall(m) || m.n, 'merc', m); });
  Object.keys(P).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) { var q = P[k]; if (q.st !== 'young' || !DS.ageOf) return; var a = DS.ageOf(s, q); if (a != null && a + Y >= DS.AGE.adult) grow.push({ pid: q.id, name: nm(s, q.id), inY: Math.max(0, DS.AGE.adult - a) }); });
  // 깃대: 가주가 창 안에 떠나는가, 끝에 노년인가, 넘겨받을 어른 기수 가문 아이가 있는가
  var flag = { k: 'keep', who: hp ? nm(s, hp.id) : s.name, kid: '', late: false };
  if (hero) {
    var left = headLeft(s, hero), kids = DS.egHouseKids(s, true), kidAt = function (yrs) { return kids.filter(function (q) { return q.st === 'live' || (q.st === 'young' && DS.ageOf(s, q) + yrs >= DS.AGE.adult); })[0]; };
    if (left != null && left <= Y) { var k1 = kidAt(Math.max(0, left - 1)); flag.k = k1 ? 'cord' : 'pick'; if (k1) flag.kid = nm(s, k1.id); }
    else if (left != null && left - Y <= DS.AGE.elder) { var k2 = kidAt(Y); flag.k = k2 ? 'hand' : 'nokid'; if (k2) flag.kid = nm(s, k2.id); }
    if ((flag.k === 'keep' || flag.k === 'nokid') && left != null && left - Y <= 1) flag.late = true;
  }
  var cf = s.coffins || { have: 0, list: [] };
  return { leave: leave, grow: grow, flag: flag, cof: { have: cf.have || 0, used: (cf.list || []).length, free: Math.max(0, (cf.have || 0) - (cf.list || []).length) }, barr: DS.reserve(s).length >= DS.MERC_MAX };
};
// 기수 가문 아이: 가주의 자식(친자 먼저, 나이 순), 없으면 선대 가주의 자식. alsoYoung: 미성년도 (예보용)
DS.egHouseKids = function (s, alsoYoung) {
  var P = LP(s), hp = heroP(s); if (!hp) return [];
  function ok(q) { if (q.rv || q.ret || q.hand || q.id === hp.id || !q.hb || q.ad || q.hx) return false; if (q.st === 'live' && q.m && entP(s, q)) return true; return !!alsoYoung && q.st === 'young'; }      // ⑱ 깃대 넘김은 어른 핏줄에게만 (핏줄이 없으면 넘김 없음)
  function sortK(a) { return a.sort(function (x, y) { return (x.ad ? 1 : 0) - (y.ad ? 1 : 0) || (+x.by || 0) - (+y.by || 0) || x.id - y.id; }); }
  var ks = sortK(kidsOf(s, hp).filter(ok)); if (ks.length) return ks;
  var prev = null; for (var k in P) { var q = P[k]; if (q.id !== hp.id && (q.hand || (q.seat === s.hero && q.st !== 'live')) && (!prev || q.id > prev.id)) prev = q; }
  return prev ? sortK(kidsOf(s, prev).filter(ok)) : [];
};
// 돌려주는 것: { g: 새 세대, years: 흐를 해(나이 달력이 없으면 0 — 봇은 멈추고 알린다) } 또는 null
DS.egStart = function (s) {
  if (!DS.egCanStart(s).ok) return null;
  var e = E(s), sd = DS.standDone ? DS.standDone(s) : null, Y = DS.standYears ? DS.standYears(s) : DS.EG.years, years = DS.ageAdvance ? Y : 0;      // 2.8: 창의 길이 = 이 대의 마지막 물결이 지킨 평화의 해 (치르지 않았으면 스무 해)
  e.gen += 1; e.on = 1; e.c = {}; e.t0 = Math.round(+s.time || 0);
  e.pass = { g: e.gen, y: 0, f: years ? 'years' : 'keep', y0: yr(s), L: [], dead: [], nl: 0, na: 0, years: Y };
  if (sd && DS.standWW) passLine(e.pass, yr(s), lines(sd.w > 0 ? 'pass.open' : 'pass.open0', { n: e.gen - 1, ww: DS.standWW(sd.w), yw: DS.standYW(Y) }).map(String));      // 2.8: 창의 첫 줄 — 지킨 물결과 평화의 해
  e.call = { g: e.gen, used: 0 };
  var woke = DS.fzWakeTick ? DS.fzWakeTick(s) : [];      // 2.2.9: 지난 세대에 합일로 잠든 가문이 깨어난다 (영웅관에서 다시 열 수 있다 · 화면은 save.fzWake 를 연출로)
  return { g: e.gen, years: years, woke: woke };
};
function passLine(ps, y, t) { var o = { y: y, t: t }; ps.L.push(o); if (ps.L.length > 120) ps.L.splice(0, ps.L.length - 120); return o; }
// 한 해 (설계서 ③ 의사 코드): 멈춤(빈자리)이 있으면 흐르지 않고 그것을 돌려준다. 가주 자리가 먼저
DS.egYear = function (s) {
  var e = E(s), ps = e.pass; if (!ps) return null;
  if (ps.f !== 'years') return { done: true, y: yr(s) };
  var stop = DS.egStop(s); if (stop) return { y: yr(s), stop: stop, lines: [] };
  if (ps.y >= DS.egYears(s)) {
    ps.f = 'keep';
    var end = passLine(ps, yr(s), lines('pass.line.end', { d: ps.nl, k: ps.na }).map(String)), outE = [end];
    var tk = DS.egDawnTickets(s); if (tk) outE.push(passLine(ps, yr(s), ['빈 가문 ' + tk.vac + '곳. 소문을 듣고 영웅 모집권 ' + tk.n + '장이 왔다.']));
    return { done: true, y: yr(s), lines: outE, tickets: tk ? tk.n : 0 };
  }
  var Y = (DS.AGE && DS.AGE.year) || 600, hero = s.chars[s.hero], hp = heroP(s), at = townName(s), out = [], y;
  DS.ageAdvance(s, Y); y = yr(s);
  var evs = DS.ageCheck(s, at) || [];
  // 끈: 가주가 올해나 내년에 떠난다 → 다 자란 기수 가문 아이의 손목에 (그 아이가 후보 맨 위에 선다)
  if (hero && !hero.vac && hp && !ps.cord) {
    var L = lifeOf(s, hero), dieSoon = hero.nat || (L.age != null && hero.ls && L.age + 1 >= hero.ls);
    var kid = dieSoon ? DS.egHouseKids(s, false)[0] : null;
    if (kid) { kid.cord = 1; ps.cord = kid.id; out.push({ k: 'cordTie', t: lines('pass.line.cordTie', { a: nm(s, hp.id), b: nm(s, kid.id) }) }); }
  }
  evs = evs.concat(DS.ageSettle ? DS.ageSettle(s, at) || [] : []);
  ps.y += 1;
  var adults = [], P = LP(s), heroPid = hp ? hp.id : 0;
  evs.forEach(function (ev) {
    if (!ev) return;
    if (ev.t === 'adult' && ev.sb) { ps.na++; out.push({ k: 'adult', t: lines('pass.line.adultSb', { a: nm(s, ev.a) }) }); }      // 2.2.1: 옛 맹주 가문의 아이는 막사로
    else if (ev.t === 'adult') { adults.push(nm(s, ev.a)); ps.na++; }
    else if (ev.t === 'birth') { ps.nb2 = (ps.nb2 || 0) + 1; var bn = nm(s, ev.a); out.push({ k: 'birth', t: ['✦ 아이가 태어났다 — ' + bn + '.'] }); }      // ⑲ 스무 해 안에서도 아이가 태어난다
    else if (ev.t === 'adultWait') out.push({ k: 'wait', t: lines('pass.line.wait', { a: nm(s, ev.a) }) });
    else if (ev.t === 'elder' && ev.a) out.push({ k: 'elder', t: lines('pass.line.elder', { a: nm(s, ev.a) }) });
    else if (ev.t === 'death') {
      ps.nl++; if (ps.dead.indexOf(ev.a) < 0) ps.dead.push(ev.a);
      if (ev.k === 'c') return;      // 깃발 든 이·가주는 멈춤이 말한다
      var q = P[ev.a], a = nm(s, ev.a), w = q && q.type && DS.AGE_KIND && DS.AGE_KIND[q.type] && DS.AGE_KIND[q.type].word;
      if (q && q.rv) out.push({ k: 'dieTwice', t: lines('pass.line.dieTwice', { a: a }) });
      else if (q && heroPid && q.lsp === heroPid) out.push({ k: 'dieKin', t: lines('pass.line.dieKin', { a: a, b: nm(s, heroPid) }) });
      else if (w) out.push({ k: 'die', t: lines('pass.line.dieWord', { a: a, w: w.replace(/감$/, '갔다') }) });
      else out.push({ k: 'die', t: lines('pass.line.die', { a: a }, h2(ev.a, 3, 17) * 4) });
    } else if (ev.t === 'mnat') { ps.nl++; out.push({ k: 'die', t: lines('pass.line.die', { a: ev.name || '누군가' }, h2(ev.mid || 0, 3, 17) * 4) }); }
  });
  if (adults.length) out.unshift({ k: 'adult', t: lines(adults.length > 1 ? 'pass.line.adultN' : 'pass.line.adult', { a: adults.join(', ') }) });
  if (DS.sbTick) DS.sbTick(s).forEach(function (r) {      // 2.2.0: 가주를 잃은 가문은 그해에 막사의 같은 병과가 잇는다 — 「센주 가문, 난새가 가주가 되었다」 (없으면 빈 가문으로 남는다)
    var ch = s.chars[r.ch], m = r.mid ? mercOf(s, r.mid) : null; if (!ch) return; ps.nb = (ps.nb || 0) + 1;
    var f = DS.flagName(ch.cls), a = m ? (m.ttl || m.n || '') : '';
    out.push({ k: 'refill', t: [f + ', ' + a + jo(a, '이가') + ' 가주가 되었다.'] });
  });
  if (!ps.vw) ps.vw = {};
  DS.charList(s).forEach(function (ch) { if (DS.vacant && DS.vacant(s, ch) && !ps.vw[ch.id]) { ps.vw[ch.id] = 1; out.push({ k: 'refill', t: [DS.flagName(ch.cls) + '의 가주가 없다. 빈 가문으로 남는다.'] }); } });
  var ls = out.map(function (o) { return passLine(ps, y, o.t.map(String)); });
  var st = DS.egStop(s);
  return { y: ps.y, cy: y, lines: ls, stop: st };
};
// 2.2.0: 스무 해 창이 끝나는 새벽 — 빈 가문(가주도 막사의 같은 병과도 없다)마다 영웅 모집권 한 장, 많아야 EG.tk 장. 한 장에 한 번만 (ps.tk)
DS.EG.tk = 3;
DS.egDawnTickets = function (s) {
  var ps = E(s).pass; if (!ps || ps.tk != null) return null;
  var vac = DS.bnEmpty ? DS.bnEmpty(s).length : 0, n = Math.min(DS.EG.tk, vac); ps.tk = n;
  if (!n) return null;
  s.tickets = (s.tickets || 0) + n;
  return { n: n, vac: vac };
};
// 멈춤: 비어 있는 자리 하나 (가주 자리 먼저, 그다음 지휘관 칸 번호 순)
DS.egStop = function (s) {
  var vac = DS.linVacant(s).sort(function (a, b) { return (a.id === s.hero ? -1 : 0) - (b.id === s.hero ? -1 : 0) || a.id - b.id; });
  var ch = vac[0]; if (!ch) return null;
  var P = LP(s), dp = P[ch.vac.pid], head = ch.id === s.hero, e = E(s), ps = e.pass, left = ps ? Math.max(0, DS.egYears(s) - ps.y) : 0;
  var heirs = DS.egHeirs(s, ch.id, left), cord = ps && ps.cord && P[ps.cord];
  return { t: head ? 'head' : 'seat', ch: ch.id, pid: dp ? dp.id : 0, name: dp ? nm(s, dp.id) : '누군가', age: dp && dp.age != null ? dp.age : null, f: flagName(ch.cls, s), heirs: heirs,
    cord: cord && heirs.some(function (h) { return h.cord; }) ? nm(s, cord.id) : '', kid: dp ? (kidsOf(s, dp).filter(function (q) { return !q.ad && (q.st === 'live' || q.st === 'young'); })[0] || null) : null, y: yr(s) };
};
// 후보: 화면이 쓰는 꼴. main = 자식·들인 자식·돌아온 자·미성년(흐림), 나머지는 「다른 이 ▸」. soon: 이 창 안에 떠날 이
DS.egHeirs = function (s, chId, left) {
  var P = LP(s), ch = s.chars[chId], dp = ch && ch.vac ? P[ch.vac.pid] : null, ps = E(s).pass, cord = ps && ps.cord;
  var list = (DS.linHeirs(s, chId) || []).filter(function (h) { return h.opt || h.young || h.kind === 'pull'; }).map(function (h, i) {      // 2.2.0: 고를 수 있는 이만 (자식 · 막사의 같은 병과 · 다른 가문의 가주) + 미성년(흐림) · 아무도 없으면 값없는 한 사람
    var q = h.pid && P[h.pid], o = { i: i, kind: h.kind, mid: h.mid, pid: h.pid || 0, young: !!h.young, inY: h.inY || 0, age: h.age, left: h.left, L: h.L, loss: h.loss, back: !!h.back, raw: h };
    o.name = h.kind === 'kin' ? '먼 친척' : q ? nm(s, q.id) : h.name;
    o.soon = !h.young && h.left != null && left != null && h.left <= left;
    o.cord = !!(cord && h.pid === cord);
    o.main = h.kind === 'kid' || h.kind === 'back' || (h.kind === 'adopt' && h.kin === 1) || h.young;
    o.rel = h.back ? '돌아온 자' : q && dp ? relWord(s, q, dp) : '';
    if (o.rel && chId !== s.hero && dp && !h.back) o.rel = nm(s, dp.id) + '의 ' + o.rel;
    return o;
  });
  var rk = function (o) { return o.kind === 'kid' && !o.young ? 0 : o.kind === 'back' ? 1 : o.main && !o.young ? 2 : o.young ? 3 : 4; };      // 자식(낳은 차례) → 돌아온 자 → 들인 자식 → 미성년 → 다른 이
  list.sort(function (a, b) { return (b.cord ? 1 : 0) - (a.cord ? 1 : 0) || rk(a) - rk(b) || (rk(a) <= 3 ? (a.pid || 0) - (b.pid || 0) : 0) || a.i - b.i; });
  return list;
};
// 멈춤에서 누름: 천수 갈래 (레벨 손실 0 · 가주면 수명 상한). pick = egHeirs 의 한 줄(또는 null → 자동 첫 후보)
DS.egSeat = function (s, chId, pick) {
  var ch = s.chars[chId], P = LP(s); if (!ch || !ch.vac) return null;
  var dp = P[ch.vac.pid], head = chId === s.hero, ps = E(s).pass, f = flagName(ch.cls, s), a = dp ? nm(s, dp.id) : '누군가', age = dp && dp.age != null ? dp.age : '';
  var raw = pick && pick.raw ? pick.raw : pick, evs;
  if (raw && raw.young) return null;
  if (raw) evs = DS.linSucceed(s, chId, raw, { nat: 1 });
  else { var left = ps ? Math.max(0, DS.egYears(s) - ps.y) : 0, hs = DS.egHeirs(s, chId, left), first = hs.filter(function (h) { return !h.young && !h.soon && (h.raw.opt === 1 || h.raw.opt === 2); })[0] || hs.filter(function (h) { return h.kind === 'pull'; })[0]; evs = DS.linSucceed(s, chId, first ? first.raw : null, { nat: 1 }); }
  if (!evs) return null;
  if (head && ps) { if (ps.cord && P[ps.cord]) delete P[ps.cord].cord; delete ps.cord; ps.hd = 1; }
  var b = nm(s, ch.pid), t = head ? lines('pass.head.done', { a: a, b: b, age: age, c: DS.heroCall(s) }) : lines('pass.seat.done', { a: a, b: b, age: age, f: f });
  var o = ps ? passLine(ps, yr(s), t.map(String)) : { y: yr(s), t: t };
  return { k: 'seated', a: a, b: b, y: o.y, t: o.t, head: head };
};
// 끝 면 1 — 모심: 이 스무 해에 떠난 이 (d.fr 이 열린 사람)
DS.egMourn = function (s) {
  var P = LP(s), ps = E(s).pass, hp = heroP(s), out = [];
  ((ps && ps.dead) || []).forEach(function (pid) {
    var p = P[pid]; if (!p || p.st !== 'dead' || !(p.d && p.d.fr)) return;
    var sn = p.snap || {}, role;
    if (p.k === 'c' && p.seat === s.hero) role = '가주';
    else if (p.k === 'c' && (sn.cls || p.cls)) role = flagName(sn.cls || p.cls, s) + ' ' + DS.tierOfL(sn.L || p.L || 1) + '단';
    else if (hp && (p.lsp === hp.id || (P[p.lsp] && P[p.lsp].seat === s.hero && P[p.lsp].k === 'c'))) role = '가주의 짝';
    else role = kindName(sn.type || p.type, sn.g || p.g);
    out.push({ pid: p.id, name: nm(s, p.id), role: role, rg: DS.linRecRg({ k: p.k, L: sn.L || p.L, snap: sn, g: p.g }), age: p.age != null ? p.age : null, at: p.d.at, twice: !!p.rv });
  });
  return out;
};
// picks = { entomb: [pid], bury: [관 번호] } — bury 먼저, 그다음 모심. 남은 이는 묻는다 (d.fr 을 닫는다)
DS.egKeep = function (s, picks) {
  var e = E(s), ps = e.pass; if (!ps || ps.f !== 'keep') return { ok: false, why: '때가 아닙니다' };
  picks = picks || {};
  var bury = (picks.bury || []).slice().sort(function (a, b) { return b - a; }), ent = picks.entomb || [], cf = DS.coffins(s);
  if (ent.length > Math.max(0, cf.have - cf.list.length) + bury.length) return { ok: false, why: '빈 관이 모자란다.' };
  bury.forEach(function (i) { DS.linBury(s, i); });
  var n = 0; ent.forEach(function (pid) { if (DS.linEntomb(s, pid)) n++; });
  var P = LP(s); for (var k in P) if (P[k].d && P[k].d.fr) delete P[k].d.fr;
  if (DS.linPrune) DS.linPrune(s);
  ps.f = DS.egHandOpts(s).length ? 'hand' : 'call';
  return { ok: true, n: n };
};
// 끝 면 2 — 깃대 넘김: 노년 가주(남은 해 ≤ 10) + 다 자란 기수 가문 아이
DS.egHandOpts = function (s) {
  var hero = s.chars[s.hero], ps = E(s).pass; if (!hero || hero.vac || hero.down || (ps && (ps.hd || ps.hand))) return [];
  var L = lifeOf(s, hero); if (L.left == null || L.left > DS.AGE.elder) return [];
  var hp = heroP(s);
  return DS.egHouseKids(s, false).map(function (q) { var m = mercOf(s, q.m); return { mid: q.m, pid: q.id, name: nm(s, q.id), age: m ? DS.ageOf(s, m) : null, rel: hp ? relWord(s, q, hp) || (q.ad ? '입양한 자식' : '') : '' }; });
};
DS.egHand = function (s, mid) {
  var ps = E(s).pass, hp = heroP(s), a = hp ? nm(s, hp.id) : s.name, r = DS.linHandOver(s, mid); if (!r) return null;
  if (ps) { ps.hand = { a: r.a, b: r.b }; ps.f = 'call'; }
  return { a: a, b: nm(s, r.b), c: DS.heroCall(s), y: yr(s), seed: r.a };
};
// 끝 면 3 — 다시 부름
DS.egCallP = function (s, rec) {      // 정수 % — 표 12. 금(rec.tr)은 표시와 한마디일 뿐 가망을 바꾸지 않는다 (사용자 결정 17:30)
  if (!rec) return 0;
  var g = Math.max(1, Math.min(5, +rec.rg || DS.linRecRg(rec))), p = DS.EG.P[g];
  if (DS.egFresh(s, rec)) p = Math.min(DS.EG.freshCap, p + DS.EG.fresh);
  return p;
};
DS.egFresh = function (s, rec) { return !!rec && +rec.w === E(s).gen; };      // 지난 새벽 뒤(지난 장의 싸움터와 이번 스무 해)에 관에 든 이
DS.egCallRoll = function (s) { var e = E(s); return h2(e.seed || DS.egSeed(s), e.gen, DS.EG.salt); };
DS.egCallList = function (s) {
  var list = (s.coffins && s.coffins.list) || [], P = LP(s), ps = E(s).pass;
  var out = list.map(function (c, i) {
    var cmd = c.k === 'c' && c.cls, p = P[c.pid], thisYear = !!(ps && ps.dead && ps.dead.indexOf(c.pid) >= 0);
    var role = c.head ? '가주' : cmd ? flagName(c.cls, s) + ' ' + DS.tierOfL(c.L || 1) + '단' : kindName((c.snap || {}).type, (c.snap || {}).g);
    return { i: i, pid: c.pid, name: p ? nm(s, c.pid) : c.n || c.name, kind: c.k, rg: +c.rg || DS.linRecRg(c), p: DS.egCallP(s, c), fresh: DS.egFresh(s, c), thisYear: thisYear, tr: !!c.tr, cls: c.cls || null, t: cmd ? DS.tierOfL(c.L || 1) : 0, role: role, age: c.age };
  });
  return out.sort(function (a, b) { return (b.fresh ? 1 : 0) - (a.fresh ? 1 : 0) || a.i - b.i; });
};
DS.egCallOpen = function (s) { var e = E(s), c = e.call; return !!c && c.g === e.gen && c.used === 0 && ((e.pass && e.pass.f === 'call') || c.late); };
function caller(s, p) {      // 부르는 이: 살아 있는 자식 → 짝 → 부모 → 가주
  var P = LP(s), hp = heroP(s), k = kidsOf(s, p).filter(function (q) { return entP(s, q); })[0];
  if (k) return k;
  var sp = p.lsp && P[p.lsp]; if (sp && entP(s, sp)) return sp;
  var pa = (p.pa || []).map(function (x) { return P[x]; }).filter(function (q) { return q && entP(s, q); })[0]; if (pa) return pa;
  return hp;
}
function relOf(s, p, b) {
  var P = LP(s); if (!b) return { k: 'none', b: '' };
  var bn = nm(s, b.id);
  if (isKid(b, p)) return { k: 'kid', b: bn };
  var mid = (b.pa || []).map(function (x) { return P[x]; }).filter(function (q) { return q && isKid(q, p); })[0];
  if (mid) return { k: 'grand', b: bn, pa: mid.sx === 'f' ? '어머니' : '아버지' };
  if (p.lsp === b.id || p.sp === b.id) return { k: 'spouse', b: bn };
  if ((p.pa || []).indexOf(b.id) >= 0) return { k: 'mate', b: bn };
  if (b !== heroP(s)) return { k: 'mate', b: bn };
  // 가주: 같은 장을 걸었는가 — 고인이 숨질 때 가주가 이미 명부에 있었는가 (사람 번호는 늘어나기만 한다 · 숨진 해의 연대기 번호와 견준다)
  var lg = (s.lin && s.lin.log) || [], deathAt = -1, bornAt = -1;
  for (var i = 0; i < lg.length; i++) { var e = lg[i]; if (e.a === p.id && e.t === 'death' && deathAt < 0) deathAt = i; if (e.a === b.id && (e.t === 'birth' || e.t === 'adult' || e.t === 'heir' || e.t === 'kin' || e.t === 'adopt') && bornAt < 0) bornAt = i; }
  if (b.id < p.id || (deathAt >= 0 && bornAt >= 0 && bornAt < deathAt)) return { k: 'mate', b: bn };
  if (deathAt >= 0 && bornAt >= 0) return { k: 'head', b: bn };
  return b.id > p.id ? { k: 'head', b: bn } : { k: 'none', b: bn };
}
function doCall(s, i, ok) {
  var e = E(s), list = s.coffins.list, rec = list[i]; if (!rec) return { ok: false, why: '관이 비었다' };
  var pid = rec.pid, P = LP(s), name = P[pid] ? nm(s, pid) : rec.n, p = DS.egCallP(s, rec), seed = h2(pid, e.gen, 5) * 3;
  e.call.used = 1; e.call.pid = pid; e.call.ok = ok ? 1 : 0;
  var res = { ok: true, ret: !!ok, pid: pid, name: name, p: p, g: e.gen, seed: seed };
  var cp = P[pid] ? caller(s, P[pid]) : heroP(s); res.caller = cp ? nm(s, cp.id) : s.name;
  if (ok) {
    var R = DS.egReturn(s, i); if (!R) return { ok: false, why: '부활시킬 수 없다' };
    if (DS.mercTidy) DS.mercTidy(s);      // 2.2.0: 돌아온 이는 맹주 집 사람이면 가문원, 아니면 막사로
    var q = P[pid] || LP(s)[R.a]; res.mid = R.mid; res.skill = R.skill ? (DS.SKILLS[R.skill] || {}).name || '' : ''; res.nick = R.nick || ''; res.age = R.age; res.kind = kindName(R.type, R.g);
    res.rel = relOf(s, q, cp && cp.id !== q.id ? cp : null); res.re = R.re ? nm(s, R.re) : '';
  } else rec.tr = 1;
  if (DS.egOnCall) { try { DS.egOnCall(s, res); } catch (x) {} }
  return res;
}
DS.egCall = function (s, i) {
  if (!DS.egCallOpen(s)) return { ok: false, why: '이번 새벽은 지났다' };
  var rec = s.coffins && s.coffins.list[i]; if (!rec) return { ok: false, why: '관이 비었다' };
  var ok = DS.egCallRoll(s) * 100 < DS.egCallP(s, rec);
  return doCall(s, i, ok);
};
// 메타 기록(기기에만 남는 egc)을 다시 입힌다: 부르기 전 저장으로 되돌려도 같은 새벽의 결과는 그대로 (다른 이를 골라도 기록된 이와 결과)
DS.egCallForce = function (s, pid, ok) {
  if (!DS.egCallOpen(s)) return null;
  var list = (s.coffins && s.coffins.list) || [], i = -1;
  for (var k = 0; k < list.length; k++) if (list[k].pid === pid) i = k;
  if (i < 0) return null;
  return doCall(s, i, !!ok);
};
DS.egSkip = function (s) { var e = E(s); if (e.call && e.call.g === e.gen && e.call.used === 0) e.call.used = 2; return true; };
// 2.7.1 스무 해의 평화: 칼을 놓은 스무 해 동안 모두 싸우는 법을 잊는다 — 창이 닫힐 때 살아 있는 모든 사람이 1레벨(1단 Lv1)로 돌아간다.
//   합일의 힘은 한 세대만: 8단 위(합일 · 大 가문)도 1레벨로, 합일 표(fz) · 大 표(dx · ch.dae)는 걷힌다 (합일로 늘어난 수명 · 가계도의 합일 기록은 그대로).
//   단마다 받은 성장(pgn)도 처음부터 — 다시 단이 오르면 같은 성장을 다시 받는다 (기질에서 정해진다). 장비 · 공훈 · 가호 · 관 · 혈통은 그대로 이어진다.
//   돌려주는 것: 화면이 보여 줄 줄 [{ k: 'c' | 'm', id, name, cls, L0 (잊기 전 레벨), fz (합일했었나) }] — 가주 · 맹주가 먼저, 레벨이 높은 순
DS.egPeace = function (s) {
  if (!s || !s.chars) return [];
  var out = [], seen = [], P = LP(s);
  function drop(who, row) {
    if (!who || seen.indexOf(who) >= 0) return; seen.push(who);
    var L0 = DS.pL(who), fz = !!who.fz;
    if (row) out.push({ k: row.k, id: row.id, name: row.name, cls: row.cls, L0: L0, fz: fz, head: !!row.head });
    who.L = 1; who.exp = 0; delete who.fz; delete who.dx; who.pgn = 0; if (DS.pgOf) who.pg = DS.pgOf(who);
    if (who.pid && P[who.pid] && P[who.pid].L != null) P[who.pid].L = 1;
  }
  DS.charList(s).forEach(function (ch) {
    var hero = ch.id === +s.hero, b = hero ? (ch.vac ? null : ch.ps) : (DS.bearer ? DS.bearer(s, ch, 1) : null);
    delete ch.dae;
    var nmx = ''; try { nmx = hero ? DS.charName(ch, s) : (b && (b.ttl || b.n)) || ''; } catch (x) { nmx = ''; }
    if (b) drop(b, { k: hero ? 'c' : 'm', id: hero ? ch.id : b.id, name: nmx, cls: ch.cls, head: true });
    ch.L = 1; ch.exp = 0; ch.Ls = 1; if (ch.pid && P[ch.pid] && P[ch.pid].L != null) P[ch.pid].L = 1;
  });
  (s.mercs || []).forEach(function (m) { drop(m, DS.pL(m) > 1 ? { k: 'm', id: m.id, name: m.ttl || m.n || '', cls: m.o && s.chars[m.o] ? s.chars[m.o].cls : (DS.pNative ? DS.pNative(s, m) : ''), head: false } : null); });
  if (DS.pSync) DS.pSync(s);
  if (DS.mercTidy) DS.mercTidy(s);
  return out.sort(function (a, b) { return (b.head ? 1 : 0) - (a.head ? 1 : 0) || b.L0 - a.L0; });
};
DS.egClose = function (s) {
  var e = E(s), ps = e.pass; if (!ps) return null;
  if (ps.f !== 'call' && ps.f !== 'hand') return null;
  if (e.call && e.call.g === e.gen && e.call.used === 0) e.call.used = 2;
  var P = LP(s); for (var k in P) if (P[k].cord) delete P[k].cord;
  var how = ps.hand ? 'hand' : ps.hd ? 'nat' : 'keep';
  var r = { g: e.gen, head: DS.heroCall(s), how: how, left: ps.nl || 0, call: (e.call && e.call.used === 1 && e.call.pid) || 0, ok: e.call && e.call.used === 1 ? (e.call.ok ? 1 : 0) : 0, y: ps.years || DS.EG.years };
  var sh = (e.hist || []).filter(function (h) { return h.g === e.gen - 1 && h.w != null; })[0]; if (sh) r.sw = sh.w;      // 2.8: 이 창을 연 마지막 물결
  e.roll.push(r);
  delete e.pass;
  if (DS.linPrune) DS.linPrune(s);
  r.peace = DS.egPeace(s);      // 2.7.1: 스무 해의 평화 — 모두 1레벨로 (화면은 r.peace 를 연출로)
  return r;
};
// 봇·시험용: 창 전체를 정책대로 치른다. pol = { heir:'first', keep:'heavy'|'light'|'none', hand:true, call:'heavy'|'light'|'gold'|'none' }
DS.egRunAuto = function (s, pol) {
  pol = pol || {}; var e = E(s), out = { stops: 0, presses: 1, left: 0, called: 0, ok: 0, years: 0, kept: 0, hand: 0, buried: 0 }, guard = 0;
  while (e.pass && e.pass.f === 'years' && guard++ < 400) {
    var r = DS.egYear(s); if (!r) break;
    if (r.stop) { out.stops++; out.presses++; var st = r.stop, pk = st.heirs.filter(function (h) { return !h.young && !h.soon && (h.raw.opt === 1 || h.raw.opt === 2); })[0] || null; if (!DS.egSeat(s, st.ch, pk)) DS.egSeat(s, st.ch, null); continue; }
    if (r.done) break;
  }
  if (!e.pass) return out;
  out.years = e.pass.y; out.left = e.pass.nl;
  if (e.pass.f === 'keep') {
    var mo = DS.egMourn(s), cf = DS.coffins(s), free = Math.max(0, cf.have - cf.list.length), ent = [], bury = [];
    if (mo.length && pol.keep !== 'none' && cf.have > 0) {
      var cand = mo.filter(function (m) { return !m.twice; }).sort(function (a, b) { return pol.keep === 'light' ? a.rg - b.rg : b.rg - a.rg; });
      cand.forEach(function (m) {
        if (ent.length < free) { ent.push(m.pid); return; }
        if (pol.keep !== 'heavy') return;
        var low = -1; cf.list.forEach(function (c, i) { if (bury.indexOf(i) < 0 && (+c.rg || 1) < m.rg && (low < 0 || (+c.rg || 1) < (+cf.list[low].rg || 1))) low = i; });
        if (low >= 0) { bury.push(low); ent.push(m.pid); out.presses += 2; }
      });
    }
    if (mo.length) out.presses += ent.length + 1;
    DS.egKeep(s, { entomb: ent, bury: bury }); out.kept = ent.length; out.buried = bury.length;
  }
  if (e.pass && e.pass.f === 'hand') {
    var ho = DS.egHandOpts(s);
    if (ho.length && pol.hand !== false && pol.hand !== 0) { DS.egHand(s, ho[0].mid); out.hand = 1; out.presses += ho.length > 1 ? 2 : 1; }
    else e.pass.f = 'call';
  }
  if (e.pass && e.pass.f === 'call') {
    var L = DS.egCallList(s), pick = null;
    if (L.length && pol.call && pol.call !== 'none' ) {
      var by = pol.call === 'light' ? function (a, b) { return b.p - a.p || a.i - b.i; } : pol.call === 'gold' ? function (a, b) { return (b.tr ? 1 : 0) - (a.tr ? 1 : 0) || b.rg - a.rg || a.i - b.i; } : function (a, b) { return b.rg - a.rg || b.p - a.p || a.i - b.i; };
      pick = L.slice().sort(by)[0];
    }
    if (pick) { var cr = DS.egCall(s, pick.i); out.presses += 3; if (cr && cr.ok) { out.called = cr.pid; out.ok = cr.ret ? 1 : 0; out.p = cr.p; } }
    else { DS.egSkip(s); out.presses += 1; }
  }
  DS.egClose(s);
  return out;
};
DS.egIntroLines = function () { return lines('intro', {}); };
// 장을 닫는 낭독: 실패한 이를 맨 앞에, 이번 대에 떠난 이 여섯까지 · 실패한 이의 한 줄 · 두 번 떠난 이 · 관에서 기다리는 수
DS.egCloseLines = function (g, s) {
  s = s || (DS.G && DS.G.save);
  var out = lines('close.open', { n: g });
  if (!s || !s.lin) return out.concat(lines('close.none', {}));
  var rl0 = ((s.eg && s.eg.roll) || []).filter(function (r) { return r && r.g === g && r.sw != null; })[0];      // 2.8: 이 대를 연 마지막 물결 — 그 평화가 끝났다
  if (rl0 && DS.standWW) out = out.concat(lines(rl0.sw > 0 ? 'close.peace' : 'close.peace0', { yw: DS.standYW(rl0.y || DS.EG.years), ww: DS.standWW(rl0.sw), p: g - 1 }));
  var e = E(s), P = LP(s), t0 = e.t0 || 0, names = [], seen = {}, twice = [], lg = s.lin.log || [], fail = e.call && e.call.g === g && e.call.used === 1 && !e.call.ok ? e.call.pid : 0, r = g - 2, hn = headNm(s);
  if (fail && P[fail]) { names.push(nm(s, fail)); seen[fail] = 1; }
  var ep = s.erPrev && s.erPrev.g === g - 1 ? s.erPrev : s.erLast && s.erLast.g === g - 1 ? s.erLast : null;      // r24: 지난 대 문 앞에서 왕이 쥐고 간 이름 — 돌아온 왕이 들고 왔으니 이번에 함께 부른다
  if (ep && ep.names) ep.names.forEach(function (n) { if (n && names.indexOf(n) < 0) names.push(n); });
  lg.forEach(function (ev) { if (ev && ev.t === 'death' && (ev.tm || 0) >= t0 && P[ev.a] && !seen[ev.a]) { seen[ev.a] = 1; names.push(nm(s, ev.a)); if (P[ev.a].rv && P[ev.a].st !== 'live') twice.push(nm(s, ev.a)); } });
  if (s.erLast && s.erLast.g === g && s.erLast.names && s.erLast.names.length && DS.ERASE_TXT) out.push(DS.ERASE_TXT.close(s.erLast.names));      // r17 boss: 그 대 귀환전에서 지워진 이름부터
  if (names.length) { out = out.concat(lines('close.call', {})); var more = names.length - 6; out.push(names.slice(0, 6).join('. ') + '.' + (more > 0 ? fill(txt('close.more') || ', 그 밖에 {k}', { k: numN(more) }) : '')); out = out.concat(lines('close.light', {}, r)); var fa = names[fail && P[fail] ? 1 : 0]; if (fa) out = out.concat(lines('close.thank', { a: fa }, r)); }
  else out = out.concat(lines('close.none', {}), lines('close.noneFlee', {}));
  if (fail && P[fail]) { out = out.concat(lines('close.back', {})); lines('close.wait', {}, h2(fail, g, 13) * 3).forEach(function (l) { out.push(typeof l === 'object' ? l : { w: nm(s, fail), t: [l] }); }); }
  if (twice.length) out = out.concat(lines('close.twice', { list: twice.join(', ') }));
  if (names.length) { out = out.concat(lines('close.flee', {}, r)); if (g >= 3) out = out.concat(lines('close.deep', {}, Math.min(g - 3, 2))); }      // 4.0: 다 흩어지지는 않는다 — 스무 해 뒤 · 맨 밑의 읽히지 않는 이름
  out = out.concat(lines(g <= 3 ? 'close.end' : 'close.endHead', { h: hn }, r));
  var cn = (s.coffins && s.coffins.list || []).length; if (cn) out = out.concat(lines('close.cof', { k: numN(cn) }));
  return flatSpk(out, hn);
};

// ── 원래 함수 감싸기 (장이 없으면 원래 결과 그대로) ──
var ns0 = DS.nextScn;
DS.nextScn = function (s) { return DS.egActive(s) ? DS.egNext(s) : ns0(s); };
var rl0 = DS.recL;
if (rl0) DS.recL = function (s) { return s && s.gen && DS.recOfL ? DS.recOfL(s.L) : rl0(s); };
// r12 경제: 장 안의 골드 — 시나리오 보상(DS.scnGold, 화면의 보상 글도 같은 함수)과 처치 골드(장 시나리오의 적 · 장이 진행 중인 들판의 적)에 배율
var sg0 = DS.scnGold;
if (sg0) DS.scnGold = function (s) { var g = sg0(s); return s && s.gen && !s.pit ? Math.round(g * DS.EG.scnGold) : g; };
function egGold(u) { if (u && u.gold) u.gold = Math.max(1, Math.round(u.gold * DS.EG.gold)); return u; }
var es1 = DS.enemySpec;
if (es1) DS.enemySpec = function (type, L, o) { var u = es1(type, L, o); return o && !o.boss && o.zone && o.save && DS.egActive(o.save) ? egGold(u) : u; };
var bs0 = DS.buildScenario;
if (bs0) DS.buildScenario = function (s, a, b, c) {
  var r = bs0(s, a, b, c); if (!s || !s.gen || !r) return r;
  r.units.forEach(function (u) { if (u.side === 'enemy') egGold(u); });
  (r.waves || []).forEach(function (w) { (w.units || []).forEach(egGold); });
  if (r.mk) { var mk0 = r.mk; r.mk = function (t, o) { return egGold(mk0(t, o)); }; }
  return r;
};
var ac0 = DS.applyClear;
DS.applyClear = function (save, s) {
  var out = ac0(save, s);
  if (s && s.gen && !s.pit && DS.egActive(save) && s.gen === save.eg.gen) {
    var e = save.eg; e.c[s.id] = 1;
    out.eg = { g: e.gen, n: DS.egDone(save), of: DS.SCENARIOS.length, done: false };
    if (s.id === DS.EG.last) { e.on = 0; e.hist = e.hist.concat([{ g: e.gen, t: Math.max(0, Math.round((+save.time || 0) - e.t0)) }]).slice(-20); out.eg.done = true; }
  }
  return out;
};
var fx0 = DS.fixSave;
if (fx0) DS.fixSave = function (s) { var r = fx0(s); if (r) DS.egFix(r); return r; };
var nw0 = DS.newSave;
if (nw0) DS.newSave = function (a, b) { var s = nw0(a, b); DS.egFix(s); return s; };
// 돌아온 이가 지닌 옛 깃발의 기술이 마나를 쓰면, 그 몫의 마나를 준다 (용병 몸은 마나가 없다)
var msp0 = DS.mercSpec;
if (msp0) DS.mercSpec = function (ch, m) {
  var u = msp0(ch, m);
  if (m && m.rv && u.skills && u.skills.length) { var S = DS.SKILLS[u.skills[0]]; if (S && S.mp > 0) { u.mmp = u.mp = S.mp * 4; } }
  return u;
};

// ── 화면 (브라우저에서만: DS.ui 가 있을 때) ──
var U = DS.ui;
if (!U || typeof document === 'undefined') return;
var G = DS.G, esc = U.esc;
function sv() { return G.save; }
function hms(t) { t = Math.floor(t || 0); var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60); return (h ? h + '시간 ' : '') + m + '분'; }
DS.egUiTrace = [];
function trace(k, x) { DS.egUiTrace.push({ k: k, x: x || '', t: Math.round(performance.now()) }); if (DS.egUiTrace.length > 400) DS.egUiTrace.shift(); }
// 2.7.1 스무 해의 평화 연출: 밤하늘이 새벽으로 밝아 오는 동안 세 줄이 떠오르고, 가주들의 단이 하나씩 1단 Lv1 로 내려앉는다. 합일했던 이는 「합일의 힘이 흩어졌다」. 끝에 이어지는 것 한 줄과 단추 하나
DS.PEACE_TXT = {
  eye: '{yw}의 평화', title: '칼을 놓은 {yw}',
  waves: '물결을 {ww} 막았다. 어스름은 {yw} 동안 오지 못했다.', waves0: '물결은 금방 넘쳤다. 그래도 문은 {yw} 동안 닫혀 있었다.',      // 2.8: 이 창을 연 마지막 물결
  lines: ['싸움 없는 {yw}{이가} 흘렀다.', '싸움을 모르는 아이들이 자랐고, 어른들은 칼 쥐는 법을 잊었다.', '손이 먼저 잊었다. 몸이 따라 잊었다.'],
  fz: '합일의 힘이 흩어졌다', more: '그리고 {n}명 더',
  keep: '모두 1단 Lv1에서 다시 시작한다. 장비와 공훈, 가호, 관은 그대로다.', go: '다시 칼을 든다',
  cH: '평화', cL: ['막은 물결만큼 평화가 이어진다.', '평화가 끝나면 모두 1단 Lv1에서 다시 시작한다.', '합일의 힘도 흩어진다. 장비와 공훈, 가호는 남는다.']
};
DS.egPeaceShow = function (s, rows, done) {
  var T = DS.PEACE_TXT, calm = !!(DS.calmFx && DS.calmFx()), show = rows.filter(function (r) { return r.head; }).slice(0, 6), rest = rows.length - show.length;
  var rl = ((s && s.eg && s.eg.roll) || []).slice(-1)[0] || {}, Y = +rl.y >= 1 ? Math.round(+rl.y) : DS.EG.years, fv = { yw: DS.standYW ? DS.standYW(Y) : '스무 해', ww: rl.sw != null && DS.standWW ? DS.standWW(rl.sw) : '' };      // 2.8: 이 평화의 해
  var L = (rl.sw != null ? [rl.sw > 0 ? T.waves : T.waves0] : []).concat(T.lines).map(function (t) { return fill(t, fv); }), b0 = 0.5 + L.length * 0.9 + 0.2;
  var lv = function (L) { return DS.tierOfL(L) + '단 Lv' + DS.lvOfL(L); };
  var face = function (r) { var sp = ''; try { if (r.k === 'c' && s.chars[r.id]) sp = U.charSpr(s.chars[r.id], 2); else { var m = (s.mercs || []).filter(function (x) { return x.id === r.id; })[0]; if (m && U.mercSpr) sp = U.mercSpr(m, 2); } } catch (x) { sp = ''; } return sp; };
  var h = '<div class="result peace"><div class="pz-sky" aria-hidden="true"><i class="pz-sun"></i></div><p class="eyebrow">' + esc(fill(T.eye, fv)) + '</p><h2>' + esc(fill(T.title, fv)) + '</h2>' +
    '<div class="pz-l">' + L.map(function (t, i) { return '<p style="--d:' + (0.5 + i * 0.9).toFixed(2) + 's">' + esc(t) + '</p>'; }).join('') + '</div><ul class="pz-r">' +
    show.map(function (r, i) { return '<li style="--d:' + (b0 + i * 0.3).toFixed(2) + 's">' + '<span class="pz-f">' + face(r) + '</span><b>' + esc(r.name) + '</b><span class="pz-lv" data-l0="' + r.L0 + '">' + lv(r.L0) + '</span>' + (r.fz ? '<small class="pz-fz">' + esc(T.fz) + '</small>' : '') + '</li>'; }).join('') + '</ul>' +
    (rest > 0 ? '<p class="pz-more" style="--d:' + (b0 + 0.2 + show.length * 0.3).toFixed(2) + 's">' + esc(T.more.replace('{n}', rest)) + '</p>' : '') +
    '<p class="pz-keep" style="--d:' + (b0 + 0.5 + show.length * 0.3).toFixed(2) + 's">' + esc(T.keep) + '</p><button class="btn gold wide pz-go" data-pzgo="1">' + esc(T.go) + '</button></div>';
  var o = U.overlay(h, 'peaceov modal' + (calm ? ' calm' : '')), t0 = performance.now(), raf = 0, end = b0 + show.length * 0.3 + 1.3;
  if (U.hydrate) U.hydrate(o);
  var els = [].slice.call(o.querySelectorAll('.pz-lv'));
  function tick() {      // 단이 하나씩 내려앉는다: 줄이 떠오른 뒤 0.8초 동안 레벨이 1 까지 센다 (조용한 연출이면 바로 1)
    var t = (performance.now() - t0) / 1000;
    els.forEach(function (el, i) { var st = b0 + i * 0.3 + 0.3, k = calm ? 1 : Math.max(0, Math.min(1, (t - st) / 0.8)), L0 = +el.dataset.l0, L = Math.max(1, Math.round(L0 - (L0 - 1) * k));
      if (el.dataset.now !== String(L)) { el.dataset.now = String(L); el.textContent = lv(L); if (L === 1) { el.classList.add('one'); if (!calm && DS.ui.A) DS.ui.A('tap'); } } });
    if (!calm && t < end && o.isConnected) raf = requestAnimationFrame(tick);
  }
  tick();
  o.querySelector('.pz-go').disabled = !calm; if (!calm) setTimeout(function () { var b = o.isConnected && o.querySelector('.pz-go'); if (b) b.disabled = false; }, end * 1000);
  o.addEventListener('click', function (e) { if (!e.target.closest('[data-pzgo]') || e.target.closest('[data-pzgo]').disabled) return; cancelAnimationFrame(raf); if (DS.ui.A) DS.ui.A('ok'); o.close(); });
  o.onclose = function () { cancelAnimationFrame(raf); if (done) done(); };
  return o;
};
// 부대 탭 맨 위 한 줄 (ui.js tabParty)
DS.egPartyRow = function (s) {
  s = s || sv(); if (!DS.egOn(s)) return '';
  var e = E(s), act = DS.egActive(s), last = e.hist[e.hist.length - 1];
  if (e.pass) return '<div class="row lgentry egrow"><div class="tx"><b>' + e.gen + '대째, ' + esc(DS.egYW(s)) + '</b><small>가주 ' + esc(DS.heroCall(s)) + '</small></div><button class="btn small gold" data-eg="pass">평화의 창</button></div>';
  var title = act ? e.gen + '대째의 장 <i class="own">' + DS.egDone(s) + ' / ' + DS.SCENARIOS.length + '</i>' : (last ? last.g : 1) + '대째의 장을 마쳤다';
  var sub = '가주 ' + esc(DS.heroCall(s)) + (act ? ', 1번부터 같은 길을 다시 걷는다' : last ? ', ' + hms(last.t) + ' 걸림' : ', 다음 세대가 가문을 이을 차례다');
  var late = DS.egCallOpen(s) && e.call.late ? '<button class="btn small gold" data-eg="late">밀린 새벽</button>' : '';
  return '<div class="row lgentry egrow"><div class="tx"><b>' + title + '</b><small>' + sub + '</small></div>' + (act ? late : '<button class="btn small gold" data-eg="start">다음 세대의 장</button>') + '</div>';
};
// 목표 줄 (game.js updateQuest 의 「엔딩 뒤」): 장이 없을 때만
DS.egQuest = function (s) {
  s = s || sv(); if (!DS.egOn(s) || DS.egActive(s)) return null;
  return (E(s).gen + 1) + '대째의 장을 열 수 있다';
};
// 결과 창 한 줄: 원래 창을 그린 뒤 「다음」 줄 위에 끼운다 (ui.js 를 고치지 않는다)
var sr0 = DS.showResult;
if (sr0) DS.showResult = function (s, out, cb) {
  var eg = out && out.eg, next = cb;
  if (eg && eg.done) next = function () { trace('close', eg.g); U.story(DS.egCloseLines(eg.g, sv()), function () { if (cb) cb(); }, eg.g + '대째의 장'); };
  var r = sr0(s, out, next);
  if (eg) { var ov = document.querySelectorAll('.ov .result.res2'), box = ov[ov.length - 1], ft = box && box.querySelector('.rfoot');
    if (ft) { ft.insertAdjacentHTML('afterbegin', '<p class="egres">' + eg.g + '대째의 장, <b class="num">' + eg.n + '</b> / ' + eg.of + (eg.done ? ', 마쳤다' : '') + '</p>');
      var nl = eg.done && ft.querySelector('.nextl'); if (nl) nl.innerHTML = '<i>다음</i>' + esc((eg.g + 1) + '대째의 장은 부대 탭에서 원할 때 연다'); } }
  return r;
};
// 입구 창: 제목 곁에 「N대째의 장」
var og0 = DS.openGate;
if (og0) DS.openGate = function (s, lock) {
  var r = og0(s, lock);
  if (s && s.gen) { var ov = document.querySelectorAll('.ov .sheet'), sh = ov[ov.length - 1], h3 = sh && sh.querySelector('header h3'); if (h3) h3.insertAdjacentHTML('beforeend', ' <small class="eggate">, ' + s.gen + '대째의 장</small>'); }
  return r;
};
// 장 시나리오의 도입 글: 그 장에서 처음 들어갈 때 한 번 (원래 입구 창은 깬 시나리오의 도입을 건너뛴다). 기억 줄(mem)이 끝에 붙는다
var st0 = DS.startScenario;
if (st0) DS.startScenario = function (s) {
  var S = sv();
  if (S && DS.egPassOn(S)) { U.toast('평화의 창을 먼저 닫아야 합니다'); DS.egPassOpen(S); return; }
  var k = s && s.gen ? 'gen' + s.gen + '_' + s.id : null;
  if (k && S && !S.seen[k] && s.intro && s.intro.length) { S.seen[k] = 1; if (s.mem) { S.seen['mem' + s.gen + '_' + s.id] = 1; trace('mem', s.id + ':' + s.mem); } U.story(s.intro, function () { st0(s); }, s.name); return; }
  return st0(s);
};
// 맺음 기록 창을 닫으면 안내 한 장 (처음 맺음에서만)
var rc0 = DS.showRecord;
if (rc0) DS.showRecord = function (cb, ending) {
  var S = sv();
  if (!ending || !S || !DS.egOn(S) || E(S).intro) return rc0(cb, ending);
  return rc0(function () { E(S).intro = 1; U.persist(); DS.egIntro(cb); }, ending);
};
function P_(t, cls) { return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(t) + '</p>'; }
function linesHtml(L, cls) {
  return (L || []).map(function (l) {
    if (l && typeof l === 'object') return '<div class="egw' + (cls ? ' ' + cls : '') + '"><b>' + esc(l.w) + '</b><span>' + l.t.map(esc).join('<br>') + '</span></div>';
    return P_(l, cls);
  }).join('');
}
DS.egIntro = function (cb) {
  var L = DS.egIntroLines();
  var o = U.overlay('<div class="result egcard"><p class="eyebrow">엔딩 이후</p><h2>다음 세대</h2>' + linesHtml(L) +
    P_(DS.egT1('introNote', {}) || '부대 탭 맨 위에서 연다. 서두를 것은 없다.', 'dim') + '<button class="btn gold wide" data-close>계속</button></div>', 'modal center');
  o.onclose = function () { if (cb) cb(); };
  return o;
};
// ── 확인 창 (설계서 ②-가) ──
function confirmHtml(S) {
  var F = DS.egForecast(S), g = E(S).gen + 1, T = DS.egT, h = '', c = F.cof, f = F.flag;
  var sec = function (head, body) { return '<div class="egsec"><h5>' + esc(head) + '</h5>' + linesHtml(body, 'in') + '</div>'; };
  if (DS.standConfirm) { var scf = DS.standConfirm(S); h += sec(scf.h, scf.L); }      // 2.8: 먼저 마지막 물결
  var call = c.have <= 0 ? T('confirm.call.none0', {}) : c.used <= 0 ? T('confirm.call.empty', {}) : c.free <= 0 ? T('confirm.call.base', { u: c.used, f: c.free }).slice(0, 2).concat(T('confirm.call.full', { u: c.used })) : T('confirm.call.base', { u: c.used, f: c.free });
  if (F.barr) call = call.concat(T('confirm.call.barr', {}));
  h += sec(DS.egT1('confirm.callH'), call);
  var fl = T('confirm.flag.' + f.k, { a: f.who, b: f.kid }); if (f.late) fl = fl.concat(T('confirm.flag.late', { a: f.who }));
  h += sec(DS.egT1('confirm.flagH'), fl);
  var lv = F.leave.slice(0, 3).map(function (x) { return x.name + (x.role === 'head' ? DS.egT1('confirm.leave.head') : ''); }).join(', ');
  if (F.leave.length > 3) lv += fill(txt('confirm.leave.more'), { k: numN(F.leave.length - 3) });
  h += sec(DS.egT1('confirm.leaveH'), F.leave.length ? [lv] : T('confirm.leave.none', {}));
  if (F.grow.length) h += sec(DS.egT1('confirm.growH'), [F.grow.map(function (x) { return x.name; }).join(', ')]);
  h += sec(DS.PEACE_TXT.cH, DS.PEACE_TXT.cL);      // 2.7.1: 스무 해의 평화 — 모두 1레벨로
  return '<div class="result egcard egconf"><p class="eyebrow">' + esc(DS.egT1('confirm.eyebrow', { n: g })) + '</p><h2>' + esc(DS.egT1('confirm.title')) + '</h2>' + P_(DS.egT1('confirm.lead')) + h + P_(DS.egT1('confirm.tail'), 'dim') +
    '<button class="btn gold wide" id="egYes">' + esc(DS.egT1('confirm.yes')) + '</button><button class="btn wide" data-close>' + esc(DS.egT1('confirm.no')) + '</button></div>';
}
DS.egOpenStart = function (parent) {
  var S = sv(), can = DS.egCanStart(S);
  if (!can.ok) { U.A('cancel'); U.toast(can.why, 3000); return null; }
  var o = U.overlay(confirmHtml(S), 'modal center egov'); trace('open', 'confirm');
  o.querySelector('#egYes').addEventListener('click', function () {
    if (DS.standGo) { trace('press', 'confirm'); U.A('ok'); o.close(); if (parent && parent.close) parent.close(); DS.standGo(S); return; }      // 2.8: 먼저 마지막 물결 (stand.js) — 그 끝에 창이 열린다
    var r = DS.egStart(S); if (!r) { U.A('cancel'); o.close(); return; }
    trace('press', 'confirm');
    U.A('ok'); o.close(); if (parent && parent.close) parent.close();
    U.persist();
    DS.egPassOpen(S);
  });
  return o;
};
// ── 스무 해 창 (설계서 ②-나): 흐르는 줄 · 멈춤 1·2 · 끝 면 1·2·3 을 한 창 안에서. 면은 저장(e.pass.f · ch.vac)에서 다시 선다 ──
var LOCK = 900, STEP = 700;
// r45 ui: 「이름, 관계, 나이」 쉼표 줄 → 이름은 굵게, 나머지는 작은 꼬리표
function egRowH(name, bits, tail) { return '<span class="egrh"><b class="egn">' + esc(name) + '</b>' + (bits || []).filter(function (v) { return v !== '' && v != null; }).map(function (v) { return '<i class="egt">' + esc(String(v)) + '</i>'; }).join('') + (tail ? '<small class="egtl">' + esc(tail) + '</small>' : '') + '</span>'; }
DS.egPassOpen = function (S) {
  S = S || sv(); var e = E(S); if (!e.pass) return null;
  var old = document.querySelector('.ov.egpass'); if (old) return old;
  var o = U.overlay('<div class="egp"><header class="egph"></header><div class="egclock"><b class="egyear"></b><span class="egbar"><i></i></span></div><div class="egpl"></div><div class="egpp"></div></div>', 'modal egpass'); trace('open', 'pass');
  var box = o.querySelector('.egp'), list = o.querySelector('.egpl'), pane = o.querySelector('.egpp'), tm = null, shownAt = 0, ui = { more: false, picks: {}, open: false, bury: -1, step: '', res: null, kid: null };
  function head() {
    var ps = e.pass || { y0: yr(S) }, y0 = ps.y0 || yr(S);
    o.querySelector('.egph').innerHTML = '<p class="egey">' + String(DS.egT1('pass.top', { n: e.gen, y0: y0, y1: y0 + DS.egYears(S) })).split(/,\s*/).map(function (x) { return '<i>' + esc(x) + '</i>'; }).join('') + '</p><h2>' + esc(DS.egT1('pass.title')) + '</h2>' + P_(DS.egT1('pass.who', { a: DS.heroCall(S) }), 'dim');
  }
  function lineHtml(l, anim) { return '<div class="egy' + (anim ? ' in' : '') + '"><b>' + esc(l.y + '년') + '</b><span>' + l.t.map(esc).join('<br>') + '</span></div>'; }
  function redrawLines() { list.innerHTML = ((e.pass && e.pass.L) || []).map(lineHtml).join(''); }
  function addLines(ls) { (ls || []).forEach(function (l, i) { list.insertAdjacentHTML('beforeend', lineHtml(l, true)); var el = list.lastElementChild; if (el) el.style.animationDelay = (i * 0.18) + 's'; }); yearTick(ls); }
  // 1.0.10: 세월이 흐르는 연출 — 해마다 줄이 아래에서 떠올라 위로 흘러가며 바래고, 큰 해 숫자가 넘어간다. 목록은 제 칸 안에서 스크롤된다 (전에는 창 전체가 스크롤되지 않아 진행이 막혔다)
  function yearTick(ls) { var last = ls && ls.length ? ls[ls.length - 1] : null, yb = o.querySelector('.egyear'); if (!last || !yb) return; yb.textContent = last.y + '년'; yb.classList.remove('tick'); void yb.offsetWidth; yb.classList.add('tick'); var bar = o.querySelector('.egbar i'), ps = e.pass || {}, y0 = ps.y0 || yr(S); if (bar) bar.style.width = Math.max(0, Math.min(100, (last.y - y0) / DS.egYears(S) * 100)) + '%'; }
  function scrollEnd() {
    var go = function () { if (list) list.scrollTo ? list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' }) : (list.scrollTop = list.scrollHeight); if (pane && pane.firstElementChild) { var sb = o.querySelector('.sheet'); if (sb) sb.scrollTop = sb.scrollHeight; } };
    go(); setTimeout(go, 220);
  }
  function lockBtns() { shownAt = performance.now(); var bs = pane.querySelectorAll('[data-lk]'); bs.forEach(function (b) { b.disabled = true; }); setTimeout(function () { bs.forEach(function (b) { if (b.isConnected) b.disabled = false; }); }, LOCK); }
  function locked() { return performance.now() - shownAt < LOCK; }
  function persist() { try { U.persist(); } catch (x) {} }
  // 멈춤 (가주 · 깃발 자리)
  function stopHtml(st) {
    var T = DS.egT, h = '<div class="egstop"><p class="egyl">' + esc(st.y + '년') + '</p>';
    if (st.t === 'head') {
      h += linesHtml(T('pass.head.died', { a: st.name }).concat(st.age != null ? T('pass.seat.age', { age: st.age }) : []));
      if (st.cord) h += linesHtml(T('pass.head.cord', { b: st.cord }));
      else if (st.kid) h += linesHtml(T('pass.head.nocord', { a: st.name, b: nm(S, st.kid.id) }));
      else h += linesHtml(T('pass.head.nokid', { a: st.name }));
      h += '<h5>' + esc(DS.egT1('pass.head.ask')) + '</h5>';
    } else {
      h += linesHtml(T('pass.seat.died', { a: st.name, f: st.f }).concat(st.age != null ? T('pass.seat.age', { age: st.age }) : []));
      h += '<h5>' + esc(DS.egT1('pass.seat.ask', { f: st.f })) + '</h5>';
    }
    var main = st.heirs.filter(function (x) { return x.main; }), rest = st.heirs.filter(function (x) { return !x.main; });
    if (!main.some(function (x) { return !x.young; })) { main = main.concat(rest); rest = []; }      // 고를 수 있는 자식이 없으면 「다른 이」를 펼쳐 둔다
    var row = function (x) {
      var bits = [x.rel, x.young ? '' : x.age != null ? x.age : ''];
      if (x.back) bits = [DS.egT1('pass.seat.back')];
      var tail = x.young ? DS.egT1('pass.seat.young', { k: numA(x.inY || 1) }) : x.cord ? DS.egT1('pass.head.cordTag') : x.soon ? DS.egT1('pass.seat.soon') : '';
      return '<button class="egrowb' + (x.young ? ' dim' : '') + '"' + (x.young ? ' disabled data-young="1"' : ' data-lk="1" data-heir="' + x.i + '"') + '>' + egRowH(x.name, bits, tail) + '</button>';
    };
    h += main.map(row).join('');
    if (rest.length) h += ui.more ? rest.map(row).join('') : '<button class="egrowb egmore" data-more="1">' + esc(DS.egT1('pass.seat.other')) + '</button>';
    return h + '</div>';
  }
  function showStop(st) { ui.stop = st; pane.innerHTML = stopHtml(st); U.hydrate && U.hydrate(pane); lockBtns(); scrollEnd(); trace('face', st.t); }
  function step() {
    clearTimeout(tm); tm = null;
    if (!o.isConnected) return;
    if (!e.pass) { finish(); return; }
    var f = e.pass.f;
    if (f === 'years') {
      var r = DS.egYear(S); persist();
      if (!r) return;
      addLines(r.lines); scrollEnd();
      if (r.stop) { showStop(r.stop); return; }
      if (r.done) { step(); return; }
      pane.innerHTML = '';
      tm = setTimeout(step, STEP); return;
    }
    if (f === 'keep') { keepFace(); return; }
    if (f === 'hand') { handFace(); return; }
    if (f === 'call') { callFace(); return; }
  }
  // 끝 면 1 — 모심
  function keepFace() {
    var mo = DS.egMourn(S), cf = DS.coffins(S), free = Math.max(0, cf.have - cf.list.length), T = DS.egT;
    if (!mo.length) { DS.egKeep(S, {}); persist(); step(); return; }
    var n = 0; for (var k in ui.picks) if (ui.picks[k]) n++;
    var h = '<div class="egface egkeep"><h5>' + esc(DS.egT1('keep.head')) + '</h5>';
    if (cf.have <= 0) {
      h += P_(mo.map(function (m) { return m.name; }).join(', ')) + linesHtml(T('keep.none0', {})) + '<button class="btn gold wide" data-lk="1" data-keep="go">' + esc(DS.egT1('keep.none0Yes')) + '</button>';
      pane.innerHTML = h + '</div>'; lockBtns(); scrollEnd(); trace('face', 'keep'); return;
    }
    h += P_(free > 0 ? DS.egT1('keep.free', { f: free }) : DS.egT1('keep.fullHead'), 'dim');
    if (free <= 0 && !ui.open) h += linesHtml(T('keep.full', {})) + '<button class="btn wide" data-copen="1">' + esc(DS.egT1('keep.open')) + '</button>';
    if (ui.open) {
      h += '<div class="egcof">' + cf.list.map(function (c, i) {
        if (ui.bury === i) return '<div class="egconf2">' + linesHtml(T('keep.bury', { a: c.name || c.n })) + '<button class="btn red wide" data-lk="1" data-cbury="' + i + '">' + esc(DS.egT1('keep.buryYes')) + '</button><button class="btn wide" data-cno="1">' + esc(DS.egT1('keep.buryNo')) + '</button></div>';
        return '<button class="egrowb" data-cpick="' + i + '">' + egRowH(c.name || c.n, [c.age != null ? '향년 ' + c.age : '', /천수/.test(c.why || '') ? '천수' : c.at || '']) + '</button>';
      }).join('') + '</div>';
    }
    h += mo.map(function (m) {
      var on = !!ui.picks[m.pid];
      if (m.twice) return '<div class="egrowb dim">' + egRowH(m.name, [DS.egT1('keep.twice')]) + '</div>';
      return '<button class="egrowb egchk' + (on ? ' on' : '') + '" data-mpick="' + m.pid + '" aria-pressed="' + on + '"><i>' + (on ? '☑' : '☐') + '</i>' + egRowH(m.name, [m.role, m.age != null ? '향년 ' + m.age : '']) + '</button>';
    }).join('');
    if (n > free) h += P_(DS.egT1('keep.short'), 'lock');
    h += linesHtml(T('keep.foot', {}), 'dim') + '<button class="btn gold wide" data-lk="1" data-keep="go"' + (n > free ? ' aria-disabled="true"' : '') + '>' + esc(DS.egT1('keep.yes')) + '</button>';
    pane.innerHTML = h + '</div>'; lockBtns(); scrollEnd(); trace('face', 'keep');
  }
  // 끝 면 2 — 깃대 넘김 (치르는 장면)
  function handFace() {
    var ho = DS.egHandOpts(S), T = DS.egT, hp = heroP(S), a = hp ? nm(S, hp.id) : S.name, y = yr(S);
    if (!ho.length) { e.pass.f = 'call'; persist(); step(); return; }
    var h = '<div class="egface eghand"><p class="egyl">' + esc(DS.egT1('hand.when', { y: y })) + '</p>';
    if (ho.length > 1 && ui.kid == null) {
      h += linesHtml(T('hand.grey', { a: a })) + '<h5>' + esc(DS.egT1('hand.ask')) + '</h5>' + ho.map(function (x) { return '<button class="egrowb" data-lk="1" data-hkid="' + x.mid + '">' + egRowH(x.name, [x.rel, x.age]) + '</button>'; }).join('');
      pane.innerHTML = h + '</div>'; lockBtns(); scrollEnd(); trace('face', 'hand'); return;
    }
    var kid = ui.kid != null ? ho.filter(function (x) { return x.mid === ui.kid; })[0] || ho[0] : ho[0];
    var r = DS.egHand(S, kid.mid); persist(); trace('press', 'hand');
    if (!r) { e.pass.f = 'call'; persist(); step(); return; }
    h += linesHtml(T('hand.tie', { a: r.a, b: r.b })) + linesHtml(T('hand.say', { a: r.a }, r.seed * 7).map(function (l) { return typeof l === 'object' ? l : { w: r.a, t: [l] }; })) + linesHtml(T('hand.done', { a: r.a, b: r.b, c: r.c }));
    h += '<button class="btn gold wide" data-lk="1" data-go="call">' + esc(DS.egT1('hand.go')) + '</button>';
    pane.innerHTML = h + '</div>'; lockBtns(); scrollEnd(); head(); trace('face', 'handScene');
  }
  // 끝 면 3 — 다시 부름
  function callFace() { DS.egCallPane(S, pane, { go: finish, lock: lockBtns, scroll: scrollEnd, step: ui }); trace('face', 'call'); }
  function finish() {
    clearTimeout(tm);
    var r = DS.egClose(S); persist(); trace('close', 'pass');
    o.close();
    var go = function () { if (DS.enterZone) DS.enterZone(S.town, null, null); };
    if (r && r.peace && r.peace.length && DS.egPeaceShow) DS.egPeaceShow(S, r.peace, go); else go();      // 2.7.1: 스무 해의 평화 연출
    return r;
  }
  o.draw = function () { if (e.pass && e.pass.f === 'call') callFace(); };      // 막사 내보내기 창이 닫힌 뒤 ([data-fire])
  o.addEventListener('click', function (ev) {
    var t = ev.target, b = t.closest && t.closest('button');
    if (!b) { if (e.pass && e.pass.f === 'years' && tm) { trace('ff'); step(); } return; }
    if (b.closest('.egface.egcall')) return;      // 부름 면은 제 손이 다룬다
    if (b.dataset.more) { U.A('tap'); ui.more = true; if (ui.stop) { pane.innerHTML = stopHtml(ui.stop); scrollEnd(); } return; }
    if (b.dataset.heir != null) {
      if (locked() || b.disabled) return;
      var st = ui.stop, h = st && st.heirs.filter(function (x) { return String(x.i) === b.dataset.heir; })[0]; if (!h) return;
      var r = DS.egSeat(S, st.ch, h);
      if (!r) { U.A('cancel'); U.toast('정할 수 없다. 다른 이를 고른다'); var ns = DS.egStop(S); if (ns) showStop(ns); return; }
      U.A('level'); trace('press', 'seat'); persist(); ui.stop = null; ui.more = false;
      addLines([{ y: r.y, t: r.t }]); head(); pane.innerHTML = ''; step(); return;
    }
    if (b.dataset.mpick) { U.A('tap'); var id = +b.dataset.mpick; ui.picks[id] = !ui.picks[id]; trace('press', 'mpick'); keepFace(); return; }
    if (b.dataset.copen) { U.A('tap'); ui.open = true; trace('press', 'copen'); keepFace(); return; }
    if (b.dataset.cpick != null) { U.A('tap'); ui.bury = +b.dataset.cpick; trace('press', 'cpick'); keepFace(); return; }
    if (b.dataset.cno) { U.A('cancel'); ui.bury = -1; keepFace(); return; }
    if (b.dataset.cbury != null) { if (locked()) return; DS.linBury(S, +b.dataset.cbury); ui.bury = -1; U.A('cancel'); trace('press', 'cbury'); persist(); keepFace(); return; }
    if (b.dataset.keep) {
      if (locked() || b.getAttribute('aria-disabled') === 'true') return;
      var ent = []; for (var k in ui.picks) if (ui.picks[k]) ent.push(+k);
      var kr = DS.egKeep(S, { entomb: ent }); if (!kr.ok) { U.A('cancel'); U.toast(kr.why); return; }
      U.A('holy'); trace('press', 'keep'); persist(); step(); return;
    }
    if (b.dataset.hkid) { if (locked()) return; U.A('tap'); ui.kid = +b.dataset.hkid; trace('press', 'hkid'); handFace(); return; }
    if (b.dataset.go === 'call') { if (locked()) return; U.A('tap'); trace('press', 'handGo'); step(); return; }
  });
  head(); redrawLines(); yearTick((e.pass && e.pass.L || []).slice(-1)); scrollEnd();
  var st0 = e.pass.f === 'years' ? DS.egStop(S) : null;
  if (st0) showStop(st0); else setTimeout(step, e.pass.f === 'years' ? STEP : 0);
  o.onclose = function () { clearTimeout(tm); };
  return o;
};
// 부름 면 (끝 면 3 · 밀린 새벽): pane 에 그린다. h = { go: 닫기, lock, scroll }
DS.egCallPane = function (S, pane, h) {
  var e = E(S), T = DS.egT, st = { at: 'list', i: -1, res: null }, ps = e.pass;
  var lockAt = 0;
  function lock() { lockAt = performance.now(); var bs = pane.querySelectorAll('[data-lk]'); bs.forEach(function (b) { b.disabled = true; }); setTimeout(function () { bs.forEach(function (b) { if (b.isConnected) b.disabled = false; }); }, LOCK); }
  function locked() { return performance.now() - lockAt < LOCK; }
  function goBtn() { return '<button class="btn gold wide" data-cgo="1">' + esc(DS.egT1('call.go', { n: e.gen })) + '</button>'; }
  function put(html) { pane.innerHTML = '<div class="egface egcall">' + html + '</div>'; lock(); if (h.scroll) h.scroll(); }
  function draw() {
    var c = e.call;
    if (c && c.g === e.gen && c.used === 1 && st.at !== 'res') {      // 이미 불렀다 (창을 다시 열었다)
      var nmp = LP(S)[c.pid] ? nm(S, c.pid) : '';
      put(linesHtml(c.ok ? T('call.after.yes', { a: nmp }) : T('call.after.no', { a: nmp })) + goBtn()); return;
    }
    if (!c || c.g !== e.gen || c.used === 2) { put(linesHtml(T('call.pass', {})) + goBtn()); return; }
    var L = DS.egCallList(S);
    if (st.at === 'list') {
      if (!L.length) { put(linesHtml(T('call.empty', {})) + '<button class="btn gold wide" data-cskip="1">' + esc(DS.egT1('call.go', { n: e.gen })) + '</button>'); return; }
      var near = L.some(function (x) { return x.fresh; });
      var html = linesHtml(T('call.dawn', {}).concat(near ? T('call.near', {}) : []));
      html += L.map(function (x) {
        var sub = [x.fresh ? (x.thisYear ? DS.egT1('call.thisYear') : DS.egT1('call.lastCh')) : '', x.tr ? DS.egT1('call.crack') : ''].filter(Boolean);
        return '<button class="egrowb egcrow" data-lk="1" data-cask="' + x.i + '">' + egRowH(x.name, [x.role, x.age != null ? '향년 ' + x.age : '']) + '<small class="egcp"><b class="num">' + esc(x.p + '%') + '</b>' + sub.map(function (t) { return '<i>' + esc(t) + '</i>'; }).join('') + '</small></button>';
      }).join('');
      html += '<button class="btn wide" data-cskip="1">' + esc(DS.egT1('call.skip')) + '</button>';
      put(html); return;
    }
    if (st.at === 'ask') {
      var x = L.filter(function (q) { return q.i === st.i; })[0]; if (!x) { st.at = 'list'; draw(); return; }
      var rec = S.coffins.list[x.i], type = x.kind === 'c' ? DS.RET_KIND[x.cls] : (rec.snap || {}).type, K = DS.AGE_KIND && DS.AGE_KIND[type], age = Math.min(15, K ? K.start[0] : 15);
      var full = DS.reserve(S).length >= DS.MERC_MAX;
      var ask = T('call.ask.head', { a: x.name }).concat(T('call.ask.come', { age: AGEW[age] || age, k: kindName(type, x.rg) })).concat(T(x.kind === 'c' ? 'call.ask.keepC' : 'call.ask.keepM', {})).concat(T('call.ask.once', {}));
      var html2 = linesHtml(ask);
      if (full) html2 += P_(DS.egT1('call.barr'), 'lock') + '<button class="btn wide" data-cfire="1">' + esc(DS.egT1('call.fire')) + '</button>';
      html2 += '<button class="btn red wide" data-lk="1" data-cyes="' + x.i + '"' + (full ? ' disabled data-full="1"' : '') + '>' + esc(DS.egT1('call.yes')) + '</button><button class="btn wide" data-cback="1">' + esc(DS.egT1('call.other')) + '</button>';
      put(html2); if (full) { var yb = pane.querySelector('[data-cyes]'); setTimeout(function () { if (yb) yb.disabled = true; }, LOCK + 10); } return;
    }
    if (st.at === 'fire') {
      var R = DS.reserve(S).filter(function (m) { return !m.lk; }).slice().sort(function (a, b) { return a.g - b.g || DS.pL(a) - DS.pL(b); });
      put('<h5>' + esc(DS.egT1('call.fire')) + '</h5>' + R.slice(0, 12).map(function (m) { return '<div class="egfire"><span>' + esc(DS.mercName(m)) + '</span><button class="btn small" data-fire="' + m.id + '">방출</button></div>'; }).join('') + '<button class="btn wide" data-cback2="1">' + esc(DS.egT1('call.other')) + '</button>');
      return;
    }
    if (st.at === 'res') {
      var r = st.res, out;
      if (r.ret) {
        out = T('call.yesL', { a: r.name, age: AGEW[r.age] || r.age });
        var rk = r.rel && r.rel.k || 'none', rel = T('call.rel.' + rk, { a: r.name, b: r.rel && r.rel.b, pa: r.rel && r.rel.pa }).map(function (l) { return typeof l === 'object' ? l : { w: r.name, t: [l] }; });
        out = out.concat(rel);
        if (r.re) out = out.concat(T('call.re', { a: r.name, b: r.re }));
        if (r.skill) out = out.concat(T('call.skill', { a: r.name, sk: '「' + r.skill + '」' }));
        else if (r.nick) out = out.concat(T('call.nick', { a: r.name, nk: '「' + r.nick + '」' }));
      } else {
        out = T('call.no', { a: r.name }).concat(T('close.wait', {}, r.seed).map(function (l) { return typeof l === 'object' ? l : { w: r.name, t: [l] }; }));
      }
      pane.innerHTML = '<div class="egface egcall egres2">' + linesHtml(out) + goBtn() + '</div>'; lock(); if (h.scroll) h.scroll(); return;
    }
  }
  function voice(r) {      // 부르는 동안: 저절로 뜨고, 누르면 넘어간다 (결과는 이미 저장됐다)
    var L = T('call.voice', { a: r.name, b: r.caller }), i = 0, tv = null;
    pane.innerHTML = '<div class="egface egcall egvoice"></div>';
    var vb = pane.querySelector('.egvoice');
    function next() { clearTimeout(tv); if (!vb.isConnected) return; if (i >= L.length) { st.at = 'res'; st.res = r; draw(); return; } vb.insertAdjacentHTML('beforeend', linesHtml([L[i++]])); if (h.scroll) h.scroll(); tv = setTimeout(next, 650); }
    vb.addEventListener('click', function () { next(); });
    next();
  }
  pane.onclick = function (ev) {
    var b = ev.target.closest && ev.target.closest('button'); if (!b || !pane.contains(b)) return;
    if (b.dataset.cask != null) { if (locked()) return; U.A('tap'); st.at = 'ask'; st.i = +b.dataset.cask; trace('press', 'cask'); draw(); return; }
    if (b.dataset.cback) { U.A('tap'); st.at = 'list'; draw(); return; }
    if (b.dataset.cback2) { U.A('tap'); st.at = 'ask'; draw(); return; }
    if (b.dataset.cfire) { U.A('tap'); st.at = 'fire'; draw(); return; }
    if (b.dataset.cyes != null) {
      if (locked() || b.disabled) return;
      var res = DS.egCall(S, +b.dataset.cyes); trace('press', 'cyes');
      if (!res || !res.ok) { U.A('cancel'); U.toast((res && res.why) || '부활시킬 수 없다'); st.at = 'list'; draw(); return; }
      try { U.persist(); } catch (x) {}
      U.A(res.ret ? 'holy' : 'cancel'); voice(res); return;
    }
    if (b.dataset.cskip) { if (locked()) return; DS.egSkip(S); try { U.persist(); } catch (x) {} trace('press', 'cskip'); U.A('tap'); h.go(); return; }
    if (b.dataset.cgo) { if (locked()) return; trace('press', 'cgo'); U.A('ok'); h.go(); return; }
  };
  pane.redraw = draw;
  // 메타 기록: 같은 씨앗·같은 새벽의 결과가 기기에 남아 있으면 그것을 입힌다 (되돌려 다시 굴리는 길을 막는다)
  try { var mt = DS.Save && DS.Save.meta && DS.Save.meta().egc; if (mt && mt.seed === e.seed && mt.g === e.gen && DS.egCallOpen(S)) { var fr = DS.egCallForce(S, mt.pid, mt.ok); if (fr && fr.ok) { try { U.persist(); } catch (x) {} st.at = 'res'; st.res = fr; } } } catch (x) {}
  draw();
};
DS.egOnCall = function (s, res) { try { if (DS.Save && DS.Save.setMeta && s === sv()) DS.Save.setMeta({ egc: { seed: E(s).seed, g: res.g, pid: res.pid, ok: res.ret ? 1 : 0 } }); } catch (x) {} };
// 끝 면 3 단독 (밀린 새벽): 마을에서 연다
DS.egCallFace = function (S, cb) {
  S = S || sv(); if (!DS.egCallOpen(S)) { if (cb) cb(); return null; }
  var o = U.overlay('<div class="egp"><header class="egph"><p class="egey">' + esc(E(S).gen + '대째') + '</p><h2>' + esc(DS.egT1('late.title') || '밀린 새벽') + '</h2></header><div class="egpp"></div></div>', 'modal egpass egcallov'); trace('open', 'late');
  var pane = o.querySelector('.egpp');
  o.draw = function () { if (pane.redraw) pane.redraw(); };
  DS.egCallPane(S, pane, { go: function () { o.close(); if (cb) cb(); }, scroll: function () { var sb = o.querySelector('.sheet'); if (sb) sb.scrollTop = sb.scrollHeight; } });
  return o;
};
// 옛 저장 알림 (한 번, 마을에서): 진행 중 장 저장의 밀린 새벽
DS.egLateNote = function (S) {
  S = S || sv(); var e = E(S); if (!DS.egCallOpen(S) || !e.call.late || e.call.seen) return null;
  e.call.seen = 1; try { U.persist(); } catch (x) {}
  var o = U.overlay('<div class="result egcard">' + linesHtml(DS.egT('late.lines', {})) + '<button class="btn gold wide" id="egLateGo">' + esc(DS.egT1('late.go')) + '</button><button class="btn wide" data-close>' + esc(DS.egT1('late.later')) + '</button></div>', 'modal center'); trace('open', 'lateNote');
  o.querySelector('#egLateGo').addEventListener('click', function () { U.A('ok'); o.close(); DS.egCallFace(S); });
  return o;
};
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest && e.target.closest('[data-eg]'); if (!b) return;
  if (b.dataset.eg === 'start') { U.A('tap'); DS.egOpenStart(b.closest('.ov')); }
  else if (b.dataset.eg === 'pass') { U.A('tap'); var o = b.closest('.ov'); if (o && o.close) o.close(); DS.egPassOpen(sv()); }
  else if (b.dataset.eg === 'late') { U.A('tap'); var o2 = b.closest('.ov'); if (o2 && o2.close) o2.close(); DS.egCallFace(sv()); }
});
})();
