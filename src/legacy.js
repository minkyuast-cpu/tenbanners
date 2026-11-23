// r33 legacy: 「가문의 위업」 — 세대를 거듭할수록 가문이 자란다는 것을 눈으로 느끼게 한다.
//   ① 결산: 메인 맺음(1대)과 다음 세대의 장을 마칠 때마다 점수 줄(깬 장, 우두머리, 어스름의 왕, 살아남은 가주, 아이, 지킨 이름, 한계 돌파, 바친 재물, 잃은 사람)을 세어 올린다.
//      누계가 문턱을 넘으면 가문 등급이 오른다 (이름 없는 집 → 이름난 집 → 명문 → 대명문 → 전설의 가문, 그 뒤로는 별). 오를 때마다 가호 셋 가운데 하나를 고른다 (쌓인다).
//   ② 보이는 것: 맹주 가문 문장의 테(동 → 은 → 금 → 보석), 「n대째」 표, 타이틀의 가문 이름과 등급, 「가문의 유산」 창.
//   ③ 대마다 새것: 돌아온 어스름의 왕의 비틀기(대마다 하나씩 쌓인다), 장을 마칠 때 맹주 가문 이름·칭호가 열린다, 등급만큼 장의 적이 조금 세진다.
//   한계 돌파: 레벨 100 위로 넘친 경험치는 레벨을 올리지 않고 「돌파」로 모여 다음 결산의 점수가 된다 (레벨 표·단 이름을 건드리지 않는 가장 안전한 길).
// 저장: save.lg = { v, pts, hist:[{ g, k, rows:[[키, 수, 점]], tot, p0, p1 }], picks:[가호 키], owe, pend:[hist 번호], don:{ g, gold, pts }, ovx, brk, brkT, gens, s1 }
//   DS.lgFix 가 채운다 (fixSave · newSave 뒤). 옛 저장은 비어 있는 채로 시작하고, 맺음을 본 옛 저장은 한 번 「지난 세대들의 위업」을 세어 둔다 (가호는 화면에서 고른다).
//   위쪽은 순수 함수 (Node 봇·시험도 부른다). 「── 화면」 아래는 브라우저에서만. build.js 에서 endgame · social 뒤.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

DS.LG = {
  ranks: [
    { n: '이름 없는 집', at: 0, f: 0, line: '아직 아무도 이 집 이름을 모른다. 편지도 옆집으로 간다.' },
    { n: '이름난 집', at: 300, f: 1, line: '고개 너머에서도 이 집 이름을 안다. 빚쟁이도 안다.' },
    { n: '명문', at: 1300, f: 2, line: '아이들이 이 집 깃발을 보고 자란다. 낙서도 깃발 모양이다.' },
    { n: '대명문', at: 2400, f: 3, line: '다른 집들이 이 집 문 앞에서 말을 내린다. 문지기가 바빠졌다.' },
    { n: '전설의 가문', at: 3600, f: 4, line: '이 집 이름은 노래가 되었다. 다들 따라 부른다.' }],
  star: 900,      // 전설 뒤로는 이만큼마다 별 하나 + 가호 하나
  pt: { scn: 10, boss: 4, king: 60, head: 12, kid: 20, name: 25, brk: 4, lost: -6 },
  lostMin: -90, kidMax: 10, brkMax: 25, brkNeed: 3,      // 돌파 하나 = 레벨 100 의 한 레벨치 경험치 × brkNeed
  don: { step: 10000, per: 2000, cap: 60 },      // 1만 골드 = 5점 · 대마다 60점(12만 골드)까지
  foe: 0.03, foeMax: 0.09,      // 등급 하나마다 다음 세대의 장 적 난이도 +3% (많아야 +9%) — 장의 세대 배율 상한(DS.EG.cap)은 넘지 않는다: 일찍 상한에 닿을 뿐, 뒤 세대에 벽을 만들지 않는다
  boonMax: 3      // 한 가호는 세 번까지 쌓인다
};
// 가호: v = 한 번 고를 때의 몫. d 의 {v} 는 그 몫, 「가문의 유산」 창은 쌓인 합을 쓴다
DS.LG_BOON = {
  hp:     { n: '굳센 핏줄', d: '모든 가주의 체력 +{v}%', v: 3, u: '%', line: '윗대의 통뼈가 아랫대로 간다. 고집도 같이 간다.' },
  atk:    { n: '날 선 가문원', d: '가문원의 공격과 마공 +{v}%', v: 3, u: '%', line: '칼도 집안 내력을 탄다. 잔소리 들은 칼이 잘 든다.' },
  spd:    { n: '빠른 손', d: '가주와 가문원의 행동 회복 +{v}%', v: 2, u: '%', line: '한 박자 먼저 움직인다. 퇴근도 한 박자 빠르다.' },
  grade:  { n: '이름이 부르는 사람', d: '모집에서 고급 이상이 나올 확률 +{v}%p', v: 2, u: '%p', line: '좋은 사람은 이름난 집을 찾아온다. 소문은 선대가 낸다.' },
  coffin: { n: '넉넉한 관', d: '빈 관 하나를 바로 들인다', v: 1, u: '개', line: '모실 자리가 하나 더 생긴다. 아늑하게 해 뒀다.' },
  birth:  { n: '번성', d: '아이가 태어날 확률 +{v}%', v: 5, u: '%', line: '집에 아이 울음이 끊이지 않는다. 단톡방은 순해진다.' },
  enh:    { n: '대장장이의 연', d: '강화 성공률 +{v}%p', v: 3, u: '%p', line: '대대로 같은 대장간을 쓴다. 단골 것은 덜 터진다.' },
  merit:  { n: '기억되는 공', d: '가문 공훈 획득 +{v}%', v: 5, u: '%', line: '세운 공은 집이 기억한다. 선대는 제 공만 기억하지만.' },
  gold:   { n: '두터운 곳간', d: '시나리오 보상 골드 +{v}%', v: 5, u: '%', line: '곳간 문이 닫힐 날이 없다. 빚쟁이 발길도 그렇다.' },
  call:   { n: '부르는 목소리', d: '다시 부름 가망 +{v}%p', v: 3, u: '%p', line: '부르는 목소리가 한 대씩 두꺼워진다.' },
  herb:   { n: '약초밭', d: '약초 회복량 +{v}%', v: 10, u: '%', line: '집 뒤에 약초밭을 일군다. 선대 때는 약초도 없었단다.' },
  exp:    { n: '배움의 집', d: '얻는 경험치 +{v}%', v: 3, u: '%', line: '윗대가 아랫대를 가르친다. 「나 때는」은 빼고.' },
  ult:    { n: '타오르는 기세', d: '맹주 필살기 충전 +{v}%', v: 5, u: '%', line: '집의 기세가 칼끝에 모인다. 기합은 덤이다.', need: function () { return !!DS.ULT; } }
};
// 장을 마치면 열리는 것: 맹주 가문 이름(DS.GRAND_HOUSES 고르기에 더해진다)과 대장 칭호. 차례 = 마친 장 수 (1 = 메인 맺음)
DS.LG_UNLOCK = [
  null,
  { ttl: '문을 닫은 맹주' },
  { ttl: '두 번 문을 닫은 맹주', house: ['바라테온', '왕관을 쓴 사슴의 집'] },
  { ttl: '세 번째 맹주', house: ['엘릭', '대가를 치르고 되찾는 집'] },
  { ttl: '네 번째 맹주', house: ['그레이조이', '바다에서 거두는 집'] },
  { ttl: '다섯 번째 맹주', house: ['티렐', '자라며 강해지는 집'] },
  { ttl: '여섯 번째 맹주', house: ['아룬', '해가 지지 않는 집'] },
  { ttl: '이름을 지키는 맹주' }
];
// 돌아온 어스름의 왕의 비틀기: 그 대에 하나가 더해지고 앞의 것도 남는다 (g = 다음 세대의 장 번호)
DS.LG_TWIST = [
  { g: 2, k: 'er', say: '이번에는 이름을 하나 더 맡겠습니다.', note: '왕이 한 번에 이름 하나를 더 지운다.', sh: '이름 하나를 더 지운다' },
  { g: 3, k: 'sum', say: '저희 쪽에도 이름 없는 직원이 좀 있습니다.', note: '왕이 그림자를 불러낸다.', sh: '그림자를 부른다' },
  { g: 4, k: 'hp', say: '맡은 이름만큼 제 몸이 무거워졌습니다.', note: '왕의 몸이 대마다 더 단단해진다.', sh: '몸이 더 단단하다' },
  { g: 5, k: 'spd', say: '이번에는 기다려 드리지 않겠습니다.', note: '왕이 더 빨리 움직인다.', sh: '더 빨리 움직인다' }
];

function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function num(v, d) { v = +v; return isFinite(v) ? v : d; }
function h2(a, b, c) { return DS.hash2 ? DS.hash2(a | 0, b | 0, c | 0) : ((Math.sin(a * 12.9898 + b * 78.233 + c) * 43758.5453) % 1 + 1) % 1; }
var cur = null;      // 순수 함수(유닛 사양 등)가 쓰는 지금 판: 화면이면 DS.G.save, 아니면 마지막으로 고친(또는 만든) 저장
function S(s) { return s || (DS.G && DS.G.save) || cur; }
var OFF = 0;      // 전투력 내역이 「가호 없는」 값을 셀 때

// ── 저장 ──
DS.lgFix = function (s) {
  if (!s || typeof s !== 'object' || !s.chars) return s;
  var L = s.lg, fresh = !L || typeof L !== 'object' || Array.isArray(L);
  if (fresh) L = s.lg = {};
  L.v = 1;
  L.pts = Math.max(0, Math.round(num(L.pts, 0)));
  L.hist = (Array.isArray(L.hist) ? L.hist : []).filter(function (h) { return h && typeof h === 'object' && Array.isArray(h.rows); }).slice(-30).map(function (h) {
    return { g: Math.max(1, Math.round(num(h.g, 1))), k: ['main', 'gen', 'retro'].indexOf(h.k) >= 0 ? h.k : 'gen', rows: h.rows.filter(function (r) { return Array.isArray(r) && typeof r[0] === 'string'; }).map(function (r) { return [r[0], Math.round(num(r[1], 0)), Math.round(num(r[2], 0))]; }), tot: Math.round(num(h.tot, 0)), p0: Math.max(0, Math.round(num(h.p0, 0))), p1: Math.max(0, Math.round(num(h.p1, 0))) };
  });
  L.picks = (Array.isArray(L.picks) ? L.picks : []).filter(function (k) { return own(DS.LG_BOON, k); }).slice(0, 40);
  L.pend = (Array.isArray(L.pend) ? L.pend : []).filter(function (i) { return i >= 0 && i < L.hist.length; });
  var d = L.don; if (!d || typeof d !== 'object') d = L.don = {}; d.g = Math.max(1, Math.round(num(d.g, 1))); d.gold = Math.max(0, Math.round(num(d.gold, 0))); d.pts = Math.max(0, Math.round(num(d.pts, 0)));
  L.ovx = Math.max(0, num(L.ovx, 0)); L.brk = Math.max(0, Math.round(num(L.brk, 0))); L.brkT = Math.max(L.brk, Math.round(num(L.brkT, 0)));
  L.gens = Math.max(0, Math.round(num(L.gens, 0)));
  L.owe = Math.max(0, Math.min(DS.lgSteps(L.pts) - L.picks.length, Math.round(num(L.owe, 0))));
  if (L.s1 !== 1) delete L.s1;
  if (L.att && !(typeof L.att === 'object' && +L.att.g >= 2 && +L.att.id >= 1 && +L.att.n >= 0)) delete L.att;
  if (fresh && DS.egOn && DS.egOn(s)) lgRetro(s);      // 맺음을 이미 본 옛 저장: 지난 세대들을 한 번에 센다
  syncHouses(s);
  return s;
};
function LG(s) { if (!s.lg || typeof s.lg !== 'object') DS.lgFix(s); return s.lg; }
// 등급: 0~4. 전설 뒤의 별: lgStars
DS.lgRank = function (pts) { if (pts && typeof pts === 'object') pts = pts.lg ? pts.lg.pts : 0; var R = DS.LG.ranks, r = 0; for (var i = 0; i < R.length; i++) if (pts >= R[i].at) r = i; return r; };
DS.lgStars = function (pts) { var top = DS.LG.ranks[DS.LG.ranks.length - 1].at; return pts >= top ? Math.floor((pts - top) / DS.LG.star) : 0; };
DS.lgSteps = function (pts) { return DS.lgRank(pts) + DS.lgStars(pts); };      // 지금까지 받을 가호 수
DS.lgRankOf = function (s) { return s && s.lg ? DS.lgRank(s.lg.pts) : 0; };
DS.lgRankName = function (pts) { var r = DS.lgRank(pts), st = DS.lgStars(pts); return DS.LG.ranks[r].n + (st ? ' ' + '◆'.repeat(Math.min(5, st)) + (st > 5 ? st : '') : ''); };
DS.lgNext = function (pts) { var R = DS.LG.ranks, r = DS.lgRank(pts); if (r < R.length - 1) return { n: R[r + 1].n, at: R[r + 1].at, from: R[r].at }; var top = R[R.length - 1].at, st = DS.lgStars(pts); return { n: '별 ' + (st + 1), at: top + (st + 1) * DS.LG.star, from: top + st * DS.LG.star }; };
DS.lgGen = function (s) { return s && s.eg ? Math.max(1, s.eg.gen || 1) : 1; };
DS.lgCount = function (s, k) { s = S(s); if (!s || !s.lg) return 0; var n = 0; s.lg.picks.forEach(function (x) { if (x === k) n++; }); return n; };
DS.lgVal = function (s, k) { return DS.lgCount(s, k) * ((DS.LG_BOON[k] || {}).v || 0); };      // 쌓인 몫 (3, 6, 9 …)
DS.lgMul = function (s, k) { return OFF ? 1 : 1 + DS.lgVal(s, k) / 100; };      // 다른 팀이 쓸 손잡이 (예: 필살기 충전 × DS.lgMul(null, 'ult'))
DS.lgTitle = function (s) { s = S(s); var n = s && s.lg ? s.lg.gens : 0, U = DS.LG_UNLOCK; if (!n) return ''; var u = U[Math.min(n, U.length - 1)]; return (u && u.ttl) || ''; };

// ── 셈: 한 대의 점수 줄 ──
var ROW_N = { scn: '깬 장', boss: '쓰러뜨린 우두머리', king: '어스름의 왕', head: '살아남은 가주', kid: '태어난 아이', name: '지킨 이름', brk: '한계 돌파', don: '가문에 바친 재물', lost: '잃은 사람' };
DS.LG_ROW = ROW_N;
function logs(s) { return (s.lin && s.lin.log) || []; }
function bossN(ids) { var n = 0; ids.forEach(function (id) { var b = DS.scn && DS.scn(id); if (b && b.boss && id !== DS.SCENARIOS.length) n++; }); return n; }
function headsAlive(s) {
  var n = 0; DS.charList(s).forEach(function (ch) { if (ch.vac || ch.down) return; if (ch.id === s.hero || !DS.bearer || DS.bearer(s, ch)) n++; });
  return n;
}
function since(s, t0, t) { var n = 0; logs(s).forEach(function (e) { if (e && e.t === t && (e.tm || 0) >= t0 && (t !== 'death' || !(e.x && /천수/.test(e.x.why || '')))) n++; }); return n; }
// k: 'main' (메인 맺음) · 'gen' (다음 세대의 장) · 'retro' (옛 저장) · gens: retro 에서 마친 장 수(메인 포함)
DS.lgRows = function (s, g, k, gens) {
  var P = DS.LG.pt, L = LG(s), e = s.eg || {}, t0 = k === 'gen' ? (e.t0 || 0) : 0, many = k === 'retro' ? Math.max(1, gens || 1) : 1, rows = [];
  var nScn = k === 'retro' ? DS.SCENARIOS.length * many : DS.SCENARIOS.length, ids = DS.SCENARIOS.map(function (x) { return x.id; });
  rows.push(['scn', nScn, nScn * P.scn]);
  var nb = bossN(ids) * many; rows.push(['boss', nb, nb * P.boss]);
  rows.push(['king', many, many * P.king]);
  var hd = headsAlive(s); rows.push(['head', hd, hd * P.head]);
  var kid = Math.min(DS.LG.kidMax * many, since(s, t0, 'birth')); rows.push(['kid', kid, kid * P.kid]);
  var er = s.erLast, nm = er && (k === 'retro' || er.g === g) ? Math.max(0, Math.round(+er.saved || 0)) : 0; rows.push(['name', nm, nm * P.name]);
  var bk = Math.min(DS.LG.brkMax * many, L.brk); if (bk) rows.push(['brk', bk, bk * P.brk]);
  if (L.don.pts) rows.push(['don', L.don.gold, L.don.pts]);
  var lost = since(s, t0, 'death'); rows.push(['lost', lost, Math.max(DS.LG.lostMin * many, lost * P.lost)]);
  return rows;
};
// 결산을 확정한다: 점수를 더하고, 등급이 올랐으면 고를 가호를 쌓는다. 화면은 lg.pend 를 보고 의식을 띄운다
DS.lgSettle = function (s, g, k, gens) {
  var L = LG(s), rows = DS.lgRows(s, g, k, gens), tot = 0;
  rows.forEach(function (r) { tot += r[2]; });
  tot = Math.max(0, tot);
  var p0 = L.pts, p1 = p0 + tot, before = DS.lgSteps(p0), after = DS.lgSteps(p1);
  L.pts = p1; L.owe += Math.max(0, after - before);
  L.brk = 0; L.don.pts = 0; L.don.gold = 0;
  L.gens += k === 'retro' ? Math.max(1, gens || 1) : 1;
  if (k === 'main') L.s1 = 1;
  var h = { g: g, k: k, rows: rows, tot: tot, p0: p0, p1: p1 };
  L.hist.push(h); if (L.hist.length > 30) { L.hist.shift(); L.pend = L.pend.map(function (i) { return i - 1; }).filter(function (i) { return i >= 0; }); }
  L.pend.push(L.hist.length - 1);
  syncHouses(s);
  return h;
};
function lgRetro(s) {
  var e = s.eg || {}, gens = 1 + ((e.hist && e.hist.length) || 0);
  DS.lgSettle(s, Math.max(1, (e.gen || 1) - (e.on ? 1 : 0)), 'retro', gens);
}
// 가호 고르기: 결정적인 세 가지 (저장 씨앗 + 받은 수). 한 가호는 boonMax 번까지
DS.lgOffer = function (s) {
  var L = LG(s); if (!(L.owe > 0)) return [];
  var pool = Object.keys(DS.LG_BOON).filter(function (k) {
    var B = DS.LG_BOON[k]; if (B.need && !B.need()) return false;
    if (DS.lgCount(s, k) >= DS.LG.boonMax) return false;
    if (k === 'coffin') { var c = DS.coffins ? DS.coffins(s) : { have: 10 }; if (c.have >= (DS.COFFIN_MAX || 10)) return false; }
    if (k === 'call' && !(DS.egOn && DS.egOn(s))) return false;
    return true;
  });
  var seed = ((s.eg && s.eg.seed) || 7) + L.picks.length * 977, out = [], i;
  for (i = pool.length - 1; i > 0; i--) { var j = Math.floor(h2(seed, i, 3301) * (i + 1)), t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  for (i = 0; i < pool.length && out.length < 3; i++) out.push(pool[i]);
  return out;
};
DS.lgPick = function (s, k) {
  var L = LG(s); if (!(L.owe > 0) || DS.lgOffer(s).indexOf(k) < 0) return false;
  L.picks.push(k); L.owe--;
  if (k === 'coffin' && DS.coffins) { var c = DS.coffins(s); c.have = Math.min(DS.COFFIN_MAX || 10, (c.have || 0) + 1); }
  return true;
};
DS.lgAutoPick = function (s) { var n = 0; while (LG(s).owe > 0 && n < 20) { var o = DS.lgOffer(s); if (!o.length || !DS.lgPick(s, o[0])) break; n++; } return n; };
// 재물 바치기: 한 번에 step 골드 → step/per 점. 대마다 cap 점까지 (다음 결산에 「가문에 바친 재물」로 실린다)
DS.lgDonateLeft = function (s) { var L = LG(s), g = DS.lgGen(s); if (L.don.g !== g) { L.don.g = g; L.don.used = 0; } return Math.max(0, DS.LG.don.cap - (L.don.used || 0)); };
DS.lgCanDonate = function (s) {
  if (!(DS.egOn && DS.egOn(s))) return { ok: false, why: '30번 맺음을 본 뒤에 바칠 수 있다' };
  if (DS.lgDonateLeft(s) <= 0) return { ok: false, why: '이번 대에는 더 바칠 수 없다' };
  if ((s.gold || 0) < DS.LG.don.step) return { ok: false, why: '골드가 모자란다' };
  return { ok: true, why: '' };
};
DS.lgDonate = function (s) {
  var c = DS.lgCanDonate(s); if (!c.ok) return c;
  var D = DS.LG.don, L = LG(s), p = Math.min(DS.lgDonateLeft(s), Math.round(D.step / D.per));
  s.gold -= D.step; L.don.gold += D.step; L.don.pts += p; L.don.used = (L.don.used || 0) + p;
  return { ok: true, p: p, left: DS.lgDonateLeft(s) };
};

// ── 맹주 가문 이름: 기본 여덟 + 이 저장이 연 것 ──
var GH0 = null;
function syncHouses(s) {
  if (!DS.GRAND_HOUSES) return;
  if (!GH0) GH0 = DS.GRAND_HOUSES.slice();
  var n = s && s.lg ? s.lg.gens : 0, add = [];
  for (var i = 1; i <= n && i < DS.LG_UNLOCK.length; i++) if (DS.LG_UNLOCK[i] && DS.LG_UNLOCK[i].house) add.push(DS.LG_UNLOCK[i].house);
  DS.GRAND_HOUSES.length = 0; GH0.concat(add).forEach(function (x) { DS.GRAND_HOUSES.push(x); });
}
DS.lgHouses = function (s) { var n = s && s.lg ? s.lg.gens : 0, out = []; for (var i = 1; i < DS.LG_UNLOCK.length; i++) { var u = DS.LG_UNLOCK[i]; if (u && u.house) out.push({ n: u.house[0], d: u.house[1], at: i, open: i <= n }); } return out; };

// ── 원래 함수 감싸기 ──
var fx0 = DS.fixSave;
if (fx0) DS.fixSave = function (s) { var r = fx0(s); if (r) { DS.lgFix(r); cur = r; } return r; };
var nw0 = DS.newSave;
if (nw0) DS.newSave = function (a, b) { var s = nw0(a, b); if (GH0 && DS.GRAND_HOUSES) { DS.GRAND_HOUSES.length = 0; GH0.forEach(function (x) { DS.GRAND_HOUSES.push(x); }); } cur = s; return s; };      // lg 는 만들지 않는다 (fixSave 가 기본값을 옮겨 담을 때 옛 저장의 「처음」을 가리지 않게) — LG() 가 처음 부를 때 채운다
// 결산 시점: 메인 30번을 처음 깬 때(1대) · 다음 세대의 장을 마친 때
var ac0 = DS.applyClear;
if (ac0) DS.applyClear = function (save, s) {
  var main = s && !s.gen && !s.pit && s.id === DS.SCENARIOS.length && !(save.cleared && save.cleared[s.id]);
  var out = ac0(save, s);
  try {
    var L = LG(save);
    if (L.att && s && L.att.id === s.id) delete L.att;
    if (main && !L.s1) out.lg = DS.lgSettle(save, 1, 'main');
    else if (out.eg && out.eg.done) out.lg = DS.lgSettle(save, out.eg.g, 'gen');
  } catch (x) { if (DS.DEBUG) throw x; }
  return out;
};
// 등급만큼 장의 적이 조금 세진다 · 30번에는 왕의 비틀기
DS.lgTwists = function (g) { return DS.LG_TWIST.filter(function (t) { return g >= t.g; }); };
DS.lgKingHp = function (g) { return g >= 4 ? Math.min(0.3, 0.08 + 0.04 * (g - 4)) : 0; };      // 4대 +8%, 대마다 +4%, 많아야 +30%
DS.lgFoe = function (s) { return Math.min(DS.LG.foeMax, DS.LG.foe * DS.lgRankOf(s)); };
var esc0 = DS.egScn;
if (esc0) DS.egScn = function (n, g, save) {
  var sc = esc0(n, g, save); if (!sc) return sc;
  var sv = S(save), f = sv ? DS.lgFoe(sv) : 0;
  if (f > 0 && n !== DS.SCENARIOS.length && DS.EG) {      // 30번은 등급 대신 왕의 비틀기가 세기를 맡는다
    var C = DS.EG, gm = Math.min(C.cap, 1 + C.step * (g - 1)), gm2 = Math.min(C.cap, gm * (1 + f));
    if (gm2 > gm) { sc.diff = sc.diff * gm2 / gm; sc.lgFoe = gm2 / gm - 1; }
  }
  if (n === DS.SCENARIOS.length && g >= 2) {
    var tw = DS.lgTwists(g), nw = tw[tw.length - 1];
    sc.lgTw = g;
    if (nw && save) {
      var all = tw.map(function (t) { return t.k === 'hp' ? t.sh + ' (체력 +' + Math.round(DS.lgKingHp(g) * 100) + '%)' : t.sh; });
      sc.intro = (sc.intro || []).concat([{ w: '어스름의 왕', t: nw.say, c: 'duskking' }, '이번 대의 왕은 ' + all.join(', ') + '.']);
    }
  }
  return sc;
};
// 왕의 그림자 부름: 망령 부름(b_sumGhost)보다 순하게 — 한 번에 하나, 곁에 둘까지, 더 드물게
if (DS.SKILLS && DS.SKILLS.b_sumGhost && !DS.SKILLS.lg_shade) { DS.SKILLS.lg_shade = JSON.parse(JSON.stringify(DS.SKILLS.b_sumGhost)); DS.SKILLS.lg_shade.name = '그림자 부름'; DS.SKILLS.lg_shade.cap = 2; DS.SKILLS.lg_shade.cd = 24; DS.SKILLS.lg_shade.eff[0].n = 1; }
var bs0 = DS.buildScenario;
// 공정함의 밸브: 같은 장의 같은 판을 다시 걸으면(시도 2번째부터) 등급 몫이 빠지고 가장 새 비틀기가 빠진다. 3번째부터는 왕의 비틀기는 「이름 하나 더」만 남는다.
//   긴장은 첫 걸음에만 — 진 뒤에 벽이 되지 않게. 시도 수는 buildScenario 가 판마다 한 번 불리는 것으로 센다 (game.js startScenario · campaign.js 같은 길)
DS.lgTries = function (s, sc) { var A = s && s.lg && s.lg.att; return A && sc && A.g === sc.gen && A.id === sc.id ? A.n : 0; };
DS.lgActTwists = function (g, tries) { var tw = DS.lgTwists(g); if (tries >= 3) return tw.filter(function (t) { return t.k === 'er'; }); if (tries >= 2) return tw.slice(0, -1); return tw; };
if (bs0) DS.buildScenario = function (s, a, b, c) {
  var tries = 0, sv0 = S();
  if (s && s.gen >= 2 && !s.pit && sv0 && sv0.lg) {
    var A = sv0.lg.att; if (!A || A.g !== s.gen || A.id !== s.id) A = sv0.lg.att = { g: s.gen, id: s.id, n: 0 };
    A.n++; tries = A.n;
    if (tries >= 2 && s.lgFoe) { var s2 = {}; for (var k in s) s2[k] = s[k]; s2.diff = s.diff / (1 + s.lgFoe); s = s2; }
  }
  var r = bs0(s, a, b, c);
  if (!r || !s || !(s.gen >= 2) || s.boss !== 'herald' || !r.mk) return r;
  var g = s.gen, mk0 = r.mk;
  r.mk = function (t, o) {
    var u = mk0(t, o);
    if (u && o && o.boss === 'duskking') {
      var sk = (u.skills || []).slice(), tw = {}; DS.lgActTwists(g, tries).forEach(function (t) { tw[t.k] = 1; });
      if (tw.er) u.erPlus = 1;
      if (tw.sum && sk.indexOf('lg_shade') < 0 && DS.SKILLS.lg_shade) sk.push('lg_shade');
      if (tw.curse && sk.indexOf('b_curse') < 0 && DS.SKILLS.b_curse) sk.push('b_curse');
      if (tw.th) u.erTh = [2 / 3, 1 / 2, 1 / 3];
      var hp = tw.hp ? DS.lgKingHp(g) : 0; if (hp) { u.hp = u.mhp = Math.round((u.mhp || u.hp) * (1 + hp)); }
      if (tw.spd && u.spd) u.spd = u.spd * 1.06;
      u.skills = sk;
    }
    return u;
  };
  return r;
};
// 가호: 유닛 사양
var cs0 = DS.cmdSpec;
if (cs0) DS.cmdSpec = function (ch, hero, who) {
  var u = cs0.apply(this, arguments); if (OFF || !u) return u;
  var s = S(), a = DS.lgVal(s, 'hp'), b = DS.lgVal(s, 'spd');
  if (a) { u.hp = Math.round(u.hp * (1 + a / 100)); u.mhp = Math.round((u.mhp || u.hp) * (1 + a / 100)); if (u.hp > u.mhp) u.hp = u.mhp; }
  if (b && u.spd) u.spd = u.spd * (1 + b / 100);
  ultUp(u, s);
  return u;
};
var ms0 = DS.mercSpec;
if (ms0) DS.mercSpec = function (ch, m) {
  var u = ms0.apply(this, arguments); if (OFF || !u) return u;
  var s = S(), a = DS.lgVal(s, 'atk'), b = DS.lgVal(s, 'spd');
  if (a) { u.atk = Math.round(u.atk * (1 + a / 100)); u.mag = Math.round(u.mag * (1 + a / 100)); }
  if (b && u.spd) u.spd = u.spd * (1 + b / 100);
  ultUp(u, s);
  return u;
};
// 1.1.0 필살기(int61: 유닛의 ult · 필살 게이지 배율 ultR)가 있으면 가호 「타오르는 기세」가 그 배율을 올린다. 없으면 아무것도 하지 않는다
function ultUp(u, s) { var v = DS.lgVal(s, 'ult'); if (v && u.ult) u.ultR = (u.ultR || 1) * (1 + v / 100); }
// 전투력 내역: 가호 몫은 따로 한 줄 (「가문의 유산」)
function boonTail(s, ks) { return ks.filter(function (k) { return DS.lgVal(s, k); }).map(function (k) { var B = DS.LG_BOON[k]; return B.n + ' +' + DS.lgVal(s, k) + '%'; }).join(', '); }
function partsWrap(f0, ks) {
  return function (s, ch, x) {
    var sv = S(s); if (!sv || !ks.some(function (k) { return DS.lgVal(sv, k); })) return f0.apply(this, arguments);
    OFF++; var r; try { r = f0.apply(this, arguments); } finally { OFF--; }
    if (!r) return r;
    var full = ks[0] === 'hp' ? (DS.flagPower(s, ch, x || (ch.id === s.hero ? ch.ps : null)) || r.total) : DS.power(DS.mercSpec(ch, x));
    r.rows.push({ k: 'legacy', lb: '가문의 유산', n: full - r.total, t: boonTail(sv, ks) }); r.total = full;
    return r;
  };
}
if (DS.powerParts) DS.powerParts = partsWrap(DS.powerParts, ['hp', 'spd']);
if (DS.mercParts) DS.mercParts = partsWrap(DS.mercParts, ['atk', 'spd']);
// 모집: 일반이 나왔을 때 그 몫만큼 고급으로 (확률표의 고급 이상 합이 정확히 +v%p)
var pm0 = DS.pullMerc;
if (pm0) DS.pullMerc = function (save, rnd, minG) {
  var m = pm0.apply(this, arguments), v = DS.lgVal(save, 'grade');
  if (v && m && m.g === 1 && DS.GRADES[1] && DS.GRADES[1].p > 0 && (rnd || Math.random)() * DS.GRADES[1].p < v) m.g = 2;
  return m;
};
var rh0 = DS.recruitHero;      // 2.2.0: 영웅 모집에도 같은 가호
if (rh0) DS.recruitHero = function (save, rnd) {
  var r = rh0.apply(this, arguments), v = DS.lgVal(save, 'grade');
  if (v && r && r.m && r.m.g === 1 && DS.GRADES[1] && DS.GRADES[1].p > 0 && (rnd || Math.random)() * DS.GRADES[1].p < v) { r.m.g = 2; r.g = 2; }
  return r;
};
// 출산
var lby0 = DS.linBirthYear, lbp0 = DS.linBirthP, bornS = null;
if (lby0) DS.linBirthYear = function (s, rnd) { bornS = s; try { return lby0.apply(this, arguments); } finally { bornS = null; } };
if (lbp0) DS.linBirthP = function (yr, kids) { var p = lbp0.apply(this, arguments), v = DS.lgVal(bornS || S(), 'birth'); return v ? p * (1 + v / 100) : p; };
// 강화 (확률표에 그 몫을 더한 채로 한 번 굴린다 · 화면의 확률 글도 같은 값)
var en0 = DS.enhance, er0 = DS.enhRate;
function enhAdd(r, v) { return r > 0 ? Math.min(95, r + v) : r; }
if (en0) DS.enhance = function (save) {
  var v = DS.lgVal(save, 'enh'); if (!v || !DS.ENH) return en0.apply(this, arguments);
  var R = DS.ENH.rate; DS.ENH.rate = R.map(function (x) { return enhAdd(x, v); });
  try { return en0.apply(this, arguments); } finally { DS.ENH.rate = R; }
};
if (er0) DS.enhRate = function (g) { var r = er0.apply(this, arguments), v = DS.lgVal(null, 'enh'); return v ? enhAdd(r, v) : r; };
// 공훈
var ha0 = DS.hAdd;      // r42: 공훈은 가문의 것 — 가호는 가문 공훈이 쌓이는 몫에
if (ha0) DS.hAdd = function (s, ch, pts) { var v = DS.lgVal(s, 'merit'); return ha0.call(this, s, ch, v && pts > 0 ? pts * (1 + v / 100) : pts); };
// 보상 골드
var sg0 = DS.scnGold;
if (sg0) DS.scnGold = function (sc) { var g = sg0.apply(this, arguments), v = DS.lgVal(null, 'gold'); return v ? Math.round(g * (1 + v / 100)) : g; };
// 다시 부름
var cp0 = DS.egCallP;
if (cp0) DS.egCallP = function (s, rec) { var p = cp0.apply(this, arguments), v = DS.lgVal(s, 'call'); return v && p > 0 ? Math.min(95, p + v) : p; };
// 경험치 + 한계 돌파 (레벨 100 위로 넘친 몫을 모은다)
var ge0 = DS.gainExp;
if (ge0) DS.gainExp = function (save, amount, eL) {
  var L = save && save.lg, v = DS.lgVal(save, 'exp');
  if (v) amount = amount * (1 + v / 100);
  if (L && DS.capL && DS.egOn && DS.egOn(save)) {
    var add = 0;
    (DS.persons ? DS.persons(save) : []).forEach(function (q) {      // r42: 레벨 100 에 닿은 사람마다
      if (DS.pL(q.who) < 100 || q.role === 'bench' || q.role === 'sb' || !q.dep) return;
      add += amount * DS.BAL.exp / (q.role === 'kin' ? 3 : 1);      // 2.2.0: 가주·맹주는 가문 하나의 몫, 가문원은 셋에 하나 (옛: 가솔까지 셋으로 나눴다)
    });
    if (add > 0) {
      var need = DS.expNeed(100) * DS.LG.brkNeed; L.ovx += add;
      while (L.ovx >= need) { L.ovx -= need; L.brk++; L.brkT++; if (DS.lgOnBreak) { try { DS.lgOnBreak(save, L.brkT); } catch (x) {} } }
    }
  }
  return ge0.call(this, save, amount, eL);
};
// 약초 (엔진: 이 판의 약초가 치유를 부르는 동안만 몫을 곱한다)
if (DS.Sim && DS.Sim.prototype && DS.Sim.prototype.useItem && DS.Sim.prototype.heal) (function () {
  var SP = DS.Sim.prototype, ui0 = SP.useItem, he0 = SP.heal;
  SP.useItem = function (u, key) { var v = key === 'herb' ? DS.lgVal(null, 'herb') : 0; this._lgH = v ? 1 + v / 100 : 0; try { return ui0.apply(this, arguments); } finally { this._lgH = 0; } };
  SP.heal = function (v, amt) { if (this._lgH && v && v.side === 'ally') { var a = Array.prototype.slice.call(arguments); a[1] = amt * this._lgH; return he0.apply(this, a); } return he0.apply(this, arguments); };
})();

// ── 문장의 테: 맹주 가문 문장에 등급의 테를 두른다 (동 · 은 · 금 · 보석) ──
var FRAME = [null, { c: '#b8743a', hi: '#e9a865', w: 1.6 }, { c: '#c9d3de', hi: '#ffffff', w: 1.8 }, { c: '#e8bb45', hi: '#fff0b0', w: 2.1 }, { c: 'url(#lgJw)', hi: '#ffffff', w: 2.3 }];
DS.LG_FRAME = ['', '동', '은', '금', '보석'];
var SHIELD = 'M5 5H27V15.5C27 22.5 22 27.5 16 30.5C10 27.5 5 22.5 5 15.5Z';
var ROUND = 'M16 3.5C21 3.5 27 5 27 5V15.5C27 22.5 22 27.5 16 30.5C10 27.5 5 22.5 5 15.5V5S11 3.5 16 3.5Z';
function frameSvg(f, fused) {
  var F = FRAME[f]; if (!F) return '';
  var sh = fused ? ROUND : SHIELD, g = '';
  if (f === 4) g += '<defs><linearGradient id="lgJw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ef0ff"/><stop offset=".35" stop-color="#b88af0"/><stop offset=".65" stop-color="#ff8fb8"/><stop offset="1" stop-color="#f6cf57"/></linearGradient></defs>';
  g += '<g class="lgfr lgf' + f + '"><path d="' + sh + '" fill="none" stroke="#0b0907" stroke-width="' + (F.w + 2) + '" stroke-linejoin="round"/>';
  g += '<path d="' + sh + '" fill="none" stroke="' + F.c + '" stroke-width="' + F.w + '" stroke-linejoin="round"/>';
  if (f >= 2) g += '<path d="' + sh + '" fill="none" stroke="' + F.hi + '" stroke-width=".5" stroke-linejoin="round" opacity=".7" transform="translate(16 16.6) scale(.9) translate(-16 -16.6)"/>';
  if (f >= 3) { var gem = f === 4 ? ['#7ef0ff', '#ff8fb8', '#b88af0'] : ['#fff0b0', '#fff0b0', '#fff0b0']; [[5, 5], [27, 5], [16, 30.5]].forEach(function (p, i) { g += '<path d="M' + p[0] + ' ' + (p[1] - 1.9) + 'L' + (p[0] + 1.9) + ' ' + p[1] + 'L' + p[0] + ' ' + (p[1] + 1.9) + 'L' + (p[0] - 1.9) + ' ' + p[1] + 'Z" fill="' + gem[i] + '" stroke="#0b0907" stroke-width=".7"/>'; }); }
  if (f === 4) g += '<path class="lgglint" d="M8 6L11 6L6.5 14L5.5 12Z" fill="#fff" opacity=".0"/>';
  return g + '</g>';
}
var hc0 = DS.houseCrest, hcache = {};
if (hc0) DS.houseCrest = function (cls, size, opt) {
  var f = opt && opt.frame | 0; if (!f || !FRAME[f]) return hc0.apply(this, arguments);
  var o = {}; for (var k in opt) if (k !== 'frame') o[k] = opt[k];
  o.cls = ((o.cls || '') + ' lgc lgc' + f).trim();
  var key = cls + '|' + size + '|' + JSON.stringify(o) + '|' + f; if (hcache[key]) return hcache[key];
  var svg = hc0(cls, size, o), fused = !!(DS.CLASSES && DS.CLASSES[cls] && DS.CLASSES[cls].master), at = svg.indexOf('<path d="M16 6.4V29');
  var out = at > 0 ? svg.slice(0, at) + frameSvg(f, fused) + svg.slice(at) : svg.replace('</svg>', frameSvg(f, fused) + '</svg>');
  hcache[key] = out; return out;
};
var hco0 = DS.houseCrestOf;
if (hco0) DS.houseCrestOf = function (s, ch, size, opt) {
  var sv = s || (DS.G && DS.G.save);
  if (ch && sv && ch.id === sv.hero && sv.lg && !(opt && opt.frame != null)) { var f = DS.LG.ranks[DS.lgRank(sv.lg.pts)].f; if (f) { var o = {}; for (var k in (opt || {})) o[k] = opt[k]; o.frame = f; return hco0(s, ch, size, o); } }
  return hco0.apply(this, arguments);
};
DS.lgCrest = function (s, size, f) { var h = s && s.chars && s.chars[s.hero]; if (!h || !DS.houseCrestOf) return ''; return DS.houseCrestOf(s, h, size, f == null ? null : { frame: f }); };

// ── 화면 (브라우저에서만) ──
var U = DS.ui;
if (!U || typeof document === 'undefined') return;
var G = DS.G, esc = U.esc;
function sv() { return G.save; }
function fmt(n) { n = Math.round(n || 0); return (n < 0 ? '−' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function calm() { return !!(U.calm && U.calm()); }
function sfx(n) { try { DS.Audio.sfx(n); } catch (x) {} }
function persist() { try { U.persist(); } catch (x) {} }
DS.lgBadge = function (s) { s = s || sv(); if (!s || !(DS.egOn && DS.egOn(s))) return ''; return '<i class="lgxgen num" title="' + DS.lgGen(s) + '대째">' + DS.lgGen(s) + '대째</i>'; };
function boonLine(k, n) { var B = DS.LG_BOON[k]; return B.d.replace('{v}', String(B.v * (n || 1))); }
function rowDesc(r) {
  var P = DS.LG.pt;
  switch (r[0]) {
    case 'scn': return r[1] + '판';
    case 'boss': return r[1] + '명';
    case 'king': return r[1] > 1 ? r[1] + '번 문을 닫았다' : '문을 닫았다';
    case 'head': return '깃발 ' + r[1] + '개가 서 있다';
    case 'kid': return r[1] ? r[1] + '명' : '없음';
    case 'name': return r[1] ? r[1] + '명을 지켰다' : '없음';
    case 'brk': return r[1] + '번';
    case 'don': return fmt(r[1]) + '골드';
    case 'lost': return r[1] ? r[1] + '명' + (r[2] > r[1] * P.lost ? ' (많아야 ' + fmt(r[2]) + ')' : '') : '없음';
  }
  return '';
}
function head(h) { return h.k === 'main' ? '1대째의 맺음' : h.k === 'retro' ? '지난 세대들의 위업' : h.g + '대째의 장을 마치며'; }
// ── 결산 의식 ──
DS.lgCeremony = function (s, idx, cb) {
  s = s || sv(); var L = LG(s), h = L.hist[idx]; if (!h) { if (cb) cb(); return null; }
  var r0 = DS.lgRank(h.p0), r1 = DS.lgRank(h.p1), st0 = DS.lgStars(h.p0), st1 = DS.lgStars(h.p1), up = r1 > r0 || st1 > st0, f0 = DS.LG.ranks[r0].f, f1 = DS.LG.ranks[r1].f;
  var nx0 = DS.lgNext(h.p0);
  var rows = h.rows.map(function (r, i) { return '<li class="lgxr' + (r[2] < 0 ? ' neg' : '') + '" data-i="' + i + '"><span class="l"><b>' + esc(ROW_N[r[0]] || r[0]) + '</b><small>' + esc(rowDesc(r)) + '</small></span><b class="v num">0</b></li>'; }).join('');
  var o = U.overlay('<div class="lgx lgxcer"><p class="eyebrow">' + esc(head(h)) + '</p><div class="lgxcr">' + DS.lgCrest(s, 60, f0) + '<i class="lgxflash"></i></div><h2>가문의 위업</h2>' +
    '<p class="lgxhn">' + esc(DS.allyFull ? DS.allyFull(s) : DS.houseName(s)) + ', <b class="lgxrk">' + esc(DS.lgRankName(h.p0)) + '</b></p><ul class="lgxrows">' + rows + '</ul>' +
    '<div class="lgxtot"><span>이번 대의 위업</span><b class="num">0</b></div>' +
    '<div class="lgxsum"><span class="lgxbar"><i style="width:' + barW(h.p0, nx0) + '%"></i></span><small class="num">누계 ' + fmt(h.p0) + '</small></div>' +
    '<div class="lgxup" hidden><p class="eyebrow">가문의 등급이 올랐다</p><h3>' + esc(DS.lgRankName(h.p1)) + '</h3><p>' + esc(DS.LG.ranks[r1].line) + '</p></div>' +
    '<button class="btn gold wide" id="lgxGo">' + (up ? '가호를 고른다' : '계속') + '</button></div>', 'modal center lgxov');
  o.classList.add('nodismiss');
  var box = o.querySelector('.lgx'), lis = o.querySelectorAll('.lgxr'), tm = [], done = false, go = o.querySelector('#lgxGo');
  go.disabled = true;
  function later(f, ms) { tm.push(setTimeout(f, ms)); }
  function count(el, to, ms) {
    if (calm() || !to) { el.textContent = (to > 0 ? '+' : '') + fmt(to); return; }
    var t0 = performance.now(), last = -1;
    (function f(now) { if (!el.isConnected || done) return; var p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3), v = Math.round(to * e); el.textContent = (to > 0 ? '+' : '') + fmt(v); var q = Math.floor(p * 6); if (q !== last && p < 1) { last = q; sfx('coinTick'); } if (p < 1) requestAnimationFrame(f); })(t0);
  }
  function finish() {
    if (done) return; done = true; tm.forEach(clearTimeout);
    lis.forEach(function (li, i) { li.classList.add('in'); li.querySelector('.v').textContent = (h.rows[i][2] > 0 ? '+' : '') + fmt(h.rows[i][2]); });
    o.querySelector('.lgxtot b').textContent = '+' + fmt(h.tot); o.querySelector('.lgxtot').classList.add('in');
    var nx = DS.lgNext(h.p1); o.querySelector('.lgxbar i').style.width = barW(h.p1, nx) + '%';
    o.querySelector('.lgxsum small').textContent = '누계 ' + fmt(h.p0) + ' → ' + fmt(h.p1) + ', ' + nx.n + '까지 ' + fmt(nx.at - h.p1);
    if (up) {
      box.classList.add('up'); o.querySelector('.lgxup').hidden = false; o.querySelector('.lgxrk').textContent = DS.lgRankName(h.p1);
      o.querySelector('.lgxcr').innerHTML = DS.lgCrest(s, 60, f1) + '<i class="lgxflash"></i>';
      sfx(r1 > r0 ? 'fuse' : 'promo'); if (U.haptic) U.haptic([30, 60, 30]);
    } else sfx('coinLand');
    go.disabled = false; setTimeout(toEnd, 60);
  }
  var step = calm() ? 0 : 420;
  var sh = o.querySelector('.sheet'); function toEnd() { if (sh && sh.scrollHeight > sh.clientHeight) sh.scrollTo ? sh.scrollTo({ top: sh.scrollHeight, behavior: calm() ? 'auto' : 'smooth' }) : (sh.scrollTop = sh.scrollHeight); }
  lis.forEach(function (li, i) { later(function () { li.classList.add('in'); count(li.querySelector('.v'), h.rows[i][2], 520); if (i >= 5) toEnd(); }, 300 + i * step); });
  later(function () { var t = o.querySelector('.lgxtot'); t.classList.add('in'); count(t.querySelector('b'), h.tot, 900); sfx('swell'); }, 300 + lis.length * step + 200);
  later(function () { o.querySelector('.lgxbar i').style.width = barW(h.p1, DS.lgNext(h.p1)) + '%'; }, 300 + lis.length * step + 1100);
  later(finish, 300 + lis.length * step + 1900);
  box.addEventListener('click', function (e) { if (!done && !e.target.closest('#lgxGo')) finish(); });
  go.addEventListener('click', function () {
    if (!done) { finish(); return; }
    U.A('ok'); var i = L.pend.indexOf(idx); if (i >= 0) L.pend.splice(i, 1); persist(); o.close();
    if (L.owe > 0) DS.lgPickOpen(s, cb); else if (cb) cb();
  });
  return o;
};
function barW(p, nx) { return Math.max(0, Math.min(100, (p - nx.from) / Math.max(1, nx.at - nx.from) * 100)).toFixed(1); }
// ── 가호 고르기 ──
DS.lgPickOpen = function (s, cb) {
  s = s || sv(); var L = LG(s), offer = DS.lgOffer(s); if (!offer.length) { L.owe = 0; persist(); if (cb) cb(); return null; }
  var nm = DS.lgRankName(L.pts), pick = null;
  var cards = offer.map(function (k) { var B = DS.LG_BOON[k], n = DS.lgCount(s, k); return '<button class="lgxb" data-lgb="' + k + '"><b>' + esc(B.n) + '</b><span>' + esc(boonLine(k, 1)) + '</span>' + (n ? '<em>지금 +' + B.v * n + B.u + ' → +' + B.v * (n + 1) + B.u + '</em>' : '<em>처음 받는 가호</em>') + '<small>' + esc(B.line) + '</small></button>'; }).join('');
  var o = U.overlay('<div class="lgx lgxpick"><p class="eyebrow">' + esc(nm) + (L.owe > 1 ? ', 남은 가호 ' + L.owe : '') + '</p><div class="lgxcr sm">' + DS.lgCrest(s, 52) + '</div><h2>가호를 하나 고른다</h2><p class="dim">고른 가호는 대를 넘어 이어진다.</p><div class="lgxbs">' + cards + '</div>' +
    '<button class="btn gold wide" id="lgxTake" disabled>가호를 받는다</button></div>', 'modal center lgxov');
  o.classList.add('nodismiss');
  var take = o.querySelector('#lgxTake');
  o.querySelectorAll('[data-lgb]').forEach(function (b) { b.addEventListener('click', function () { U.A('tap'); pick = b.dataset.lgb; o.querySelectorAll('[data-lgb]').forEach(function (x) { x.classList.toggle('on', x === b); }); take.disabled = false; take.textContent = '「' + DS.LG_BOON[pick].n + '」을 받는다'; }); });
  take.addEventListener('click', function () {
    if (!pick || !DS.lgPick(s, pick)) return;
    sfx('rare'); persist();
    var B = DS.LG_BOON[pick]; U.toast('가호 「' + B.n + '」. ' + boonLine(pick, DS.lgCount(s, pick)) + '.', 3200);
    o.close(); if (DS.rebuildParty) { try { DS.rebuildParty(); } catch (x) {} }
    if (L.owe > 0) DS.lgPickOpen(s, cb); else if (cb) cb();
  });
  return o;
};
// ── 가문의 유산 창 ──
DS.lgOpen = function () {
  var s = sv(); if (!s) return null;
  var o = U.sheet('가문의 유산', function () { return legacyHtml(s); }, 'lgxsheet');
  o.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lgd]'); if (b) { var r = DS.lgDonate(s); if (!r.ok) { U.A('cancel'); U.toast(r.why, 2200); return; } sfx('coin'); U.toast('가문에 재물을 바쳤다. 다음 결산에 +' + r.p + '점.', 2400); persist(); o.draw(); return; }
    var p = e.target.closest('[data-lgp]'); if (p) { U.A('tap'); DS.lgPickOpen(s, function () { if (o.isConnected) o.draw(); }); return; }
    var c = e.target.closest('[data-lgc]'); if (c) { U.A('tap'); DS.lgCeremony(s, +c.dataset.lgc, function () { if (o.isConnected) o.draw(); }); }
  });
  return o;
};
function legacyHtml(s) {
  var L = LG(s), pts = L.pts, r = DS.lgRank(pts), nx = DS.lgNext(pts), gen = DS.lgGen(s), ttl = DS.lgTitle(s), h = '';
  h += '<div class="lgxhero"><div class="lgxcr">' + DS.lgCrest(s, 64) + '</div><div class="tx"><b>' + esc(DS.allyFull ? DS.allyFull(s) : DS.houseName(s)) + '</b><span class="lgxrkn r' + r + '">' + esc(DS.lgRankName(pts)) + '</span>' +
    '<small>' + (DS.egOn && DS.egOn(s) ? gen + '대째' : '1대째') + (ttl ? ', 가주 ' + esc(DS.heroCall(s)) + ' 「' + esc(ttl) + '」' : '') + '</small></div></div>';
  h += '<div class="lgxsum big"><span class="lgxbar"><i style="width:' + barW(pts, nx) + '%"></i></span><small class="num">위업 ' + fmt(pts) + '점, ' + esc(nx.n) + '까지 ' + fmt(nx.at - pts) + '</small></div>';
  h += '<ol class="lgxlad">' + DS.LG.ranks.map(function (R, i) { return '<li class="' + (i < r ? 'past' : i === r ? 'now' : '') + '">' + (DS.lgCrest(s, 26, R.f) || '') + '<b>' + esc(R.n) + '</b><small class="num">' + fmt(R.at) + '</small></li>'; }).join('') + '</ol>';
  if (L.owe > 0) h += '<button class="btn gold wide" data-lgp="1">고르지 않은 가호 ' + L.owe + '</button>';
  // 가호
  var got = {}; L.picks.forEach(function (k) { got[k] = (got[k] || 0) + 1; });
  var ks = Object.keys(got);
  h += '<h5 class="lgxh">받은 가호</h5>' + (ks.length ? '<ul class="lgxgot">' + ks.map(function (k) { var B = DS.LG_BOON[k]; return '<li><b>' + esc(B.n) + (got[k] > 1 ? ' <i class="num">×' + got[k] + '</i>' : '') + '</b><span>' + esc(boonLine(k, got[k])) + '</span></li>'; }).join('') + '</ul>' : '<p class="dim">아직 없다. 가문 등급이 오를 때마다 하나씩 고른다.</p>');
  // 재물
  if (DS.egOn && DS.egOn(s)) {
    var left = DS.lgDonateLeft(s), D = DS.LG.don, can = DS.lgCanDonate(s);
    h += '<h5 class="lgxh">재물을 바친다</h5><p class="dim">' + fmt(D.step) + '골드마다 위업 ' + Math.round(D.step / D.per) + '점. 이번 대에 ' + left + '점 더 바칠 수 있다. 바친 몫은 다음 결산에 실린다' + (L.don.pts ? ' (지금 +' + L.don.pts + '점)' : '') + '.</p>' +
      '<button class="btn wide' + (can.ok ? '' : ' off') + '" data-lgd="1">' + fmt(D.step) + '골드를 바친다</button>';
  }
  if (L.brk || L.brkT) h += '<p class="dim lgxbk">한계 돌파 ' + L.brkT + '번. 레벨 100 위로 넘친 경험치가 모여 위업이 된다' + (L.brk ? ' (다음 결산에 +' + L.brk * DS.LG.pt.brk + '점)' : '') + '.</p>';
  // 결산 기록
  if (L.hist.length) h += '<h5 class="lgxh">결산 기록</h5><ul class="lgxhist">' + L.hist.slice().reverse().slice(0, 8).map(function (x) { var i = L.hist.indexOf(x); return '<li><button class="lnk" data-lgc="' + i + '">' + esc(head(x)) + '</button><b class="num">+' + fmt(x.tot) + '</b></li>'; }).join('') + '</ul>';
  // 열린 것
  var hs = DS.lgHouses(s);
  h += '<h5 class="lgxh">장을 마치면 열리는 연맹 이름</h5><ul class="lgxun">' + hs.map(function (x) { return '<li class="' + (x.open ? 'open' : '') + '"><b>' + esc(x.open ? x.n : '???') + '</b><small>' + esc(x.open ? x.d : (x.at === 1 ? '맺음' : x.at + '대째의 장') + '을 마치면') + '</small></li>'; }).join('') + '</ul>';
  if (DS.egOn && DS.egOn(s) && gen >= 1) { var tw = DS.lgTwists(gen + (DS.egActive && DS.egActive(s) ? 0 : 1)); if (tw.length) h += '<h5 class="lgxh">' + (DS.egActive && DS.egActive(s) ? gen : gen + 1) + '대째의 어스름의 왕</h5><ul class="lgxtw">' + tw.map(function (t) { return '<li>' + esc(t.note) + '</li>'; }).join('') + '</ul>'; }
  if (r > 0 && DS.egOn && DS.egOn(s)) h += '<p class="dim">가문의 이름이 높을수록 다음 세대의 장에서 맞서는 적도 거세다 (지금 +' + Math.round(DS.lgFoe(s) * 100) + '%까지, 장의 세기 상한은 넘지 않는다).</p>';
  return '<div class="lgx lgxpage">' + h + '</div>';
}
// 부대 탭 한 줄 (ui.js partyMeta 가 덧붙인다)
DS.lgPartyRow = function (s) {
  s = s || sv(); if (!s || !s.lg || !(DS.egOn && DS.egOn(s))) return '';
  var L = s.lg; return '<div class="row lgentry lgxrow"><span class="lgxcr xs">' + DS.lgCrest(s, 26) + '</span><div class="tx"><b>가문의 유산 <i class="lgxrkn r' + DS.lgRank(L.pts) + '">' + esc(DS.lgRankName(L.pts)) + '</i>' + DS.lgBadge(s) + '</b><small class="num">위업 ' + fmt(L.pts) + '점' + (L.owe > 0 ? ', 고를 가호 ' + L.owe : '') + '</small></div><button class="btn small' + (L.owe > 0 ? ' gold' : '') + '" data-lgx="open">보기</button></div>';
};
DS.lgLink = function (s) { s = s || sv(); if (!s || !s.lg || !(DS.egOn && DS.egOn(s))) return ''; var L = s.lg; return '<button class="plk lgxlk' + (L.owe > 0 ? ' on' : '') + '" data-lgx="open"><b>가문의 유산</b><small>' + esc(DS.lgRankName(L.pts)) + (L.owe > 0 ? ', 가호 ' + L.owe : '') + '</small></button>'; };
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest && e.target.closest('[data-lgx]'); if (!b) return;
  if (b.dataset.lgx === 'open') { U.A('tap'); DS.lgOpen(); }
});
// 타이틀: 가문 이름과 등급 (ui.js renderTitle 이 부른다)
DS.lgTitleRow = function (el, s) {
  if (!el || !s || !s.lg || !s.lin) return;
  var at = el.querySelector('.title-art'); if (!at) return;
  var pts = s.lg.pts, r = DS.lgRank(pts), ttl = DS.lgTitle(s);
  at.insertAdjacentHTML('afterend', '<div class="lgxtitle r' + r + '">' + DS.lgCrest(s, 34) + '<span><b>' + esc(DS.allyFull ? DS.allyFull(s) : DS.houseName(s)) + '</b><small>' + esc(DS.lgRankName(pts)) + (DS.egOn && DS.egOn(s) ? ', ' + DS.lgGen(s) + '대째' : '') + (ttl ? ', ' + esc(ttl) : '') + '</small></span></div>');
};
// 입구 창: 등급만큼 세진 적 한 줄
var og0 = DS.openGate;
if (og0) DS.openGate = function (sc, lock) {
  var r = og0.apply(this, arguments);
  var tr = sc && sc.gen ? DS.lgTries(sv(), sc) : 0;
  if (sc && (sc.lgFoe || (tr && sc.lgTw))) { var ov = document.querySelectorAll('.ov .sheet'), sh = ov[ov.length - 1], hd = sh && sh.querySelector('header'); if (hd && !sh.querySelector('.lgxfoe')) hd.insertAdjacentHTML('afterend', '<p class="lgxfoe">' + (tr ? '다시 걷는 길이다. 적의 기세가 한풀 꺾였다' : esc(DS.LG.ranks[DS.lgRankOf(sv())].n) + '을 노리는 적이 더 거세다, +' + Math.max(1, Math.round(sc.lgFoe * 100)) + '%') + '</p>'); }
  return r;
};
// 한계 돌파 알림 (짧게)
DS.lgOnBreak = function (s, n) { if (s === sv() && n % 5 === 1) setTimeout(function () { try { U.toast('한계 돌파 ' + n + '번째. 넘친 힘이 가문의 위업으로 쌓인다.', 2600); } catch (x) {} }, 400); };
// 남은 결산·가호를 한가할 때 띄운다 (결과 창·이야기·맺음 기록이 다 닫힌 뒤)
function idle() {
  var g = DS.G; if (!g || !g.save || !g.save.lg || g.scn || g.ending || g.hold > 0) return false;
  if (g.sim && (g.sim.combat || g.sim.hunt)) return false;
  var t = document.getElementById('s-game'); if (!t || t.hidden) return false;
  return !document.querySelector('.ov');
}
setInterval(function () {
  try {
    if (!idle()) return;
    var s = sv(), L = s.lg;
    if (L.pend.length) DS.lgCeremony(s, L.pend[0]);
    else if (L.owe > 0 && !L.oweLater) DS.lgPickOpen(s);
  } catch (x) { if (DS.DEBUG) throw x; }
}, 1200);
})();
