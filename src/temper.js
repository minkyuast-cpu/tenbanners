// ───────── r41 temper: 타고난 기질 · 개인 성장 · 유전 ─────────
// 사람마다 여섯 능력치(체력·공격·방어·마공·마방·속도)에 타고난 치우침이 있다 (−10 ~ +10%, 속도는 그 절반).
//   값은 사람에게서 정해진다: 저장 칸 tm(정수 % 여섯 칸 [hp, atk, def, mag, res, spd])이 있으면 그것, 없으면 용병 번호로 굴린다 (같은 사람은 늘 같다).
//   한 사람의 여섯 칸 합은 0 근처 (가운데로 맞춘다) — 처음 만들 때 평균 세기는 그대로다.
//   저장에 적는 때: 아이가 태어날 때(부모를 닮는다), 대장 자리로 옮길 때, 계급이 처음 오를 때(그 뒤로 고정), 대장 줄(ps)은 읽을 때.
// 개인 성장 (r42): 개인 단이 오를 때마다(2단 … 10단) 기질에 맞는 능력치 하나가 영구히 오른다 (pg = 여섯 칸 %, pgn = 받은 단계 수).
//   단계 몫 DS.TEMPER.steps. 무엇이 오르는지는 기질 순위로 무게를 둔 결정적 뽑기 (가장 센 칸은 합 20% 를 넘지 않는다).
//   옛 저장: 지금 계급까지의 성장을 소급해 준다 (공훈에서 계산 — 저장 칸이 없어도 같다).
// 전투 사양: DS.mercSpec (가솔·용병) · DS.cmdSpec (가주·대장) 바깥 겹에서 곱한다. 사람의 주 공격(종류의 공격/마공)은 유닛의 주 공격 칸에 붙는다.
(function () {
var DS = globalThis.DS;
var TK = DS.TM_KEYS = ['hp', 'atk', 'def', 'mag', 'res', 'spd'];
DS.TEMPER = { span: 10, spdK: 0.5, inh: 0.6, steps: [3, 3, 3, 4, 4, 4, 3, 2, 2], cap: 20, capO: 12, w: [6, 3, 1.6, 0.8, 0.4], l1: 4, l2: 6, neg: -9 };
DS.TM_NAME = { hp: '질긴 숨', atk: '힘센 체질', def: '통뼈', mag: '맑은 머리', res: '차분한 기운', spd: '날랜 몸' };
DS.TM_NEG = { hp: '약한 숨', atk: '여린 손', def: '얇은 뼈', mag: '흐린 머리', res: '들뜬 기운', spd: '굼뜬 몸' };
DS.TM_STAT = { hp: '체력', atk: '공격', def: '방어', mag: '마공', res: '마방', spd: '속도' };
DS.TM_LIKE = { hp: '몸이 질기다', atk: '힘이 세다', def: '뼈가 굵다', mag: '머리가 맑다', res: '기운이 차분하다', spd: '몸이 날래다' };
DS.TM_OFF = 0;      // 0 = 모두 · 1 = 끔 (내역·레이더의 바탕) · 2 = 기질만 (성장 뺌)
function h3(a, b, c) { return DS.hash2(a | 0, b | 0, c | 0); }
function ok6(a) { return Array.isArray(a) && a.length === 6 && a.every(function (v) { return typeof v === 'number' && isFinite(v); }); }
function strH(t) { t = String(t || ''); var h = 7; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return Math.abs(h); }
// 굴림 (seed → 여섯 칸 정수 %). 두 주사위 합(가운데가 흔하다) → 가운데 맞춤 → ±span 자르기 → 속도는 절반
function center(v) {
  var T = DS.TEMPER, mu = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
  return v.map(function (x, i) { var y = Math.max(-T.span, Math.min(T.span, x - mu)); return Math.round(i === 5 ? y * T.spdK : y); });
}
DS.tmGen = function (seed, salt) {
  var T = DS.TEMPER; seed = Math.abs(+seed || 0) % 999983;      // hash2 는 큰 수에서 고르지 않다
  return center(TK.map(function (k, i) { return (h3(seed, 9001 + (salt || 0), 31 + i * 17) + h3(seed, 9103 + (salt || 0), 57 + i * 13) - 1) * T.span * 1.3; }));
};
// 그 사람의 기질. who = 부대원(m) · 대장 줄(ps) · 무엇이든 tm 칸이 있는 것
DS.tmOf = function (who) {
  if (!who || typeof who !== 'object') return [0, 0, 0, 0, 0, 0];
  if (ok6(who.tm)) return who.tm;
  if (who.id === 0) return [0, 0, 0, 0, 0, 0];      // 견줌용 가짜 사람 (레이더의 기준 무리)
  if (who.id) return DS.tmGen(+who.id || strH(who.id), 0);
  return [0, 0, 0, 0, 0, 0];      // 번호도 기질 칸도 없는 것 (시험용 가짜 사람). 대장 줄은 만들 때와 읽을 때 적는다 (DS.tmSync · bnHeroPs 겹)
};
// 사람의 주 공격 칸 ('atk' | 'mag') — 그 사람의 종류로
DS.tmMain = function (who) { var M = who && who.type && DS.MERCS[who.type]; return M && M.useMag ? 'mag' : 'atk'; };
function idx(k) { return TK.indexOf(k); }
function nv(tm, k) { return tm[idx(k)] * (k === 'spd' ? 1 / DS.TEMPER.spdK : 1); }      // 속도는 절반 폭이라 견줄 때 되돌린다
function seedOf(tm) { var s = 17; tm.forEach(function (v, i) { s = (s * 37 + (v + 50) * (i + 3)) | 0; }); return Math.abs(s); }
// 계급 단계 수 (숙련 1 … 불멸 5, 별 6~8). 받은 단계(pgn)보다 적어지지 않는다
DS.pgSteps = function (who) { if (!who) return 0; var n = Math.min(DS.TEMPER.steps.length, DS.tierOfL(DS.pL(who)) - 1); return Math.max(n, Math.min(DS.TEMPER.steps.length, +who.pgn || 0)); };      // r42: 개인 단이 오를 때마다 한 단계 (2단 … 10단)
// 단계마다 무엇이 얼마나 올랐는가: [{ k, v, at(단계 번호 1~) }]. 결정적 (기질 + 단계 번호)
DS.pgList = function (who, n) {
  var T = DS.TEMPER, tm = DS.tmOf(who), main = DS.tmMain(who), off = main === 'atk' ? 'mag' : 'atk';
  if (n == null) n = DS.pgSteps(who);
  if (!who || (!who.id && !ok6(who.tm))) return [];      // 사람이 아닌 것(시험용 가짜)은 자라지 않는다
  var keys = TK.filter(function (k) { return k !== off; }).sort(function (a, b) { var d = nv(tm, b) - nv(tm, a); return d || idx(a) - idx(b); });
  var best = keys[0], acc = {}, out = [], sd = seedOf(tm);
  for (var i = 0; i < Math.min(n, T.steps.length); i++) {
    var base = T.steps[i], room = keys.filter(function (k) { var v = k === 'spd' ? Math.max(1, Math.round(base * T.spdK)) : base; return (acc[k] || 0) + v <= (k === best ? T.cap : T.capO); });
    if (!room.length) room = keys.slice(-1);
    var ws = room.map(function (k) { return T.w[keys.indexOf(k)] || 0.3; }), tot = ws.reduce(function (a, b) { return a + b; }, 0), r = h3(sd, 7700 + i, 41) * tot, j = 0;
    while (j < room.length - 1 && r >= ws[j]) { r -= ws[j]; j++; }
    var k = room[j], v = k === 'spd' ? Math.max(1, Math.round(base * T.spdK)) : base;
    acc[k] = (acc[k] || 0) + v; out.push({ k: k, v: v, at: i + 1 });
  }
  return out;
};
DS.pgOf = function (who) { var o = [0, 0, 0, 0, 0, 0]; DS.pgList(who).forEach(function (g) { o[idx(g.k)] += g.v; }); return o; };
// 계급이 오른 때(game.js meritAll): 기질을 적어 고정하고, 새로 받은 단계를 적는다. 돌려주는 것: 새 단계들
DS.pgRecord = function (who, from) {      // from = 오르기 전의 단계 수 (DS.pgSteps). 없으면 적어 둔 단계 수
  if (!who) return [];
  if (!ok6(who.tm) && who.id) who.tm = DS.tmOf(who).slice();
  var n0 = Math.min(DS.TEMPER.steps.length, from != null ? +from : +who.pgn || 0), all = DS.pgList(who), n1 = all.length;
  var fresh = all.slice(n0);
  if (n1 > (+who.pgn || 0)) { who.pgn = n1; who.pg = DS.pgOf(who); }
  return fresh;
};
// 배율 { hp, atk, def, mag, res, spd } — mode: 0 모두 · 1 없음 · 2 기질만
DS.tmMul = function (who, mode) {
  var o = {}; if (mode == null) mode = DS.TM_OFF;
  var tm = mode === 1 ? [0, 0, 0, 0, 0, 0] : DS.tmOf(who), pg = mode === 0 ? DS.pgOf(who) : [0, 0, 0, 0, 0, 0];
  TK.forEach(function (k, i) { o[k] = 1 + (tm[i] + pg[i]) / 100; });
  return o;
};
function apply(u, who, merc) {
  if (!u || !who || DS.TM_OFF === 1) return u;
  var k = DS.tmMul(who), pm = DS.tmMain(who);
  var hp = Math.max(1, Math.round((+u.mhp || +u.hp || 1) * k.hp)); u.hp = u.mhp = hp;
  if (merc) { var a = k[pm]; u.atk = Math.round(u.atk * a); u.mag = Math.round(u.mag * a); }
  else {      // 유닛의 주 공격 칸에 사람의 주 공격 배율을 (마공 가문을 드는 검사도 제 힘으로 친다)
    var um = (+u.mag || 0) > (+u.atk || 0) ? 'mag' : 'atk', uo = um === 'atk' ? 'mag' : 'atk', po = pm === 'atk' ? 'mag' : 'atk', q = {};
    q[um] = k[pm]; q[uo] = k[po];
    u.atk = Math.round(u.atk * q.atk); u.mag = Math.round(u.mag * q.mag);
  }
  u.def = Math.round(u.def * k.def); u.res = Math.round(u.res * k.res);
  if (u.spd) u.spd = u.spd * k.spd;
  return u;
}
var ms0 = DS.mercSpec;
DS.mercSpec = function (ch, m) { var u = ms0(ch, m); return m && DS.MERCS[m.type] ? apply(u, m, true) : u; };
var cs0 = DS.cmdSpec;
DS.cmdSpec = function (ch, hero, who) { var u = cs0(ch, hero, who); return who ? apply(u, who, false) : u; };
function withOff(mode, f) { var o = DS.TM_OFF; DS.TM_OFF = mode; try { return f(); } finally { DS.TM_OFF = o; } }
DS.tmWith = withOff;

// ── 이름표: 「힘센 체질 · 통뼈」 (주 공격이 아닌 칸은 빼고 본다) ──
DS.tmLabel = function (who) {
  var T = DS.TEMPER, tm = DS.tmOf(who), off = DS.tmMain(who) === 'atk' ? 'mag' : 'atk';
  var keys = TK.filter(function (k) { return k !== off; }).sort(function (a, b) { return nv(tm, b) - nv(tm, a) || idx(a) - idx(b); });
  var names = [], top = keys[0], sec = keys[1], low = keys[keys.length - 1];
  if (tm[idx(top)] >= (top === 'spd' ? T.l1 / 2 : T.l1)) names.push(DS.TM_NAME[top]);
  if (names.length && tm[idx(sec)] >= (sec === 'spd' ? T.l2 / 2 : T.l2)) names.push(DS.TM_NAME[sec]);
  var neg = tm[idx(low)] <= (low === 'spd' ? T.neg / 2 : T.neg) ? DS.TM_NEG[low] : '';
  return { names: names, neg: neg, text: names.length ? names.join(' · ') : '고른 체질', top: top, low: low,
    nums: keys.filter(function (k) { return tm[idx(k)]; }).map(function (k) { var v = tm[idx(k)]; return DS.TM_STAT[k] + ' ' + (v > 0 ? '+' : '−') + Math.abs(v) + '%'; }) };
};
DS.pgText = function (g) { return DS.TM_STAT[g.k] + ' +' + g.v + '%'; };

// ── 유전: 능력치마다 부모 한쪽을 닮는다 (그쪽 × 0.6 + 제 굴림 × 0.4), 다시 가운데 맞춤 ──
function entP(s, p) {
  if (!p) return null;
  if (p.c && s.chars[p.c] && s.chars[p.c].pid === p.id) return s.chars[p.c].id === s.hero ? s.chars[p.c].ps : (DS.bearer ? DS.bearer(s, s.chars[p.c]) : null);
  if (p.m) { var ms = s.mercs || []; for (var i = 0; i < ms.length; i++) if (ms[i].id === p.m && ms[i].pid === p.id) return ms[i]; }
  return null;
}
DS.tmOfP = function (s, p) {
  if (!p) return [0, 0, 0, 0, 0, 0];
  if (ok6(p.tm)) return p.tm;
  var e = entP(s, p); if (e && (ok6(e.tm) || e.id)) return DS.tmOf(e);
  for (var k in s.chars) { var c = s.chars[k]; if (c && c.vac && c.vac.pid === p.id && c.ps && ok6(c.ps.tm)) return c.ps.tm; }      // 막 숨진 대장 (줄이 아직 남아 있다)
  if (p.snap && p.snap.id) return DS.tmGen(+p.snap.id, 0);
  return DS.tmGen(100000 + (+p.id || 0), 5);
};
DS.tmBirth = function (s, kid, hp, sp) {
  if (!kid) return null;
  var T = DS.TEMPER, a = DS.tmOfP(s, hp), b = DS.tmOfP(s, sp), own = DS.tmGen(200000 + (+kid.id || 0), 7), from = '';
  var raw = TK.map(function (k, i) { var w = h3(kid.id, 8301, i) < 0.5 ? 0 : 1; from += w; var pv = w ? b[i] : a[i], ov = i === 5 ? own[i] * 2 : own[i]; return (i === 5 ? pv * 2 : pv) * T.inh + ov * (1 - T.inh); });
  kid.tm = center(raw.map(function (v) { return v / 0.75; }));      // 섞으면 고르게 줄어드는 폭을 조금 되돌린다
  kid.tmf = from; kid.tmpa = [hp ? hp.id : 0, sp ? sp.id : 0];
  return kid.tm;
};
// 출생 창의 한 줄: 「아버지를 닮아 힘이 세다」
DS.tmLikeLine = function (s, kid) {
  if (!kid) return '';
  var P = (s.lin && s.lin.P) || {}, tm = DS.tmOfP(s, kid), who = { type: kid.type || (kid.ya && kid.ya.type), tm: tm };
  var L = DS.tmLabel(who), k = L.top;
  if (!L.names.length) return '부모를 고루 닮아 체질이 고르다';
  var pa = kid.tmpa || kid.pa || [], w = typeof kid.tmf === 'string' ? +kid.tmf.charAt(idx(k)) : -1, par = w >= 0 ? P[pa[w]] : null;
  if (par && nv(DS.tmOfP(s, par), k) >= 3) return (par.sx === 'f' ? '어머니' : '아버지') + '를 닮아 ' + DS.TM_LIKE[k];
  return '타고나기를 ' + DS.TM_LIKE[k];
};

// ── 저장 맞추기: 대장 줄에 기질을 적고, 가계도에 적힌 기질을 사람에게 옮긴다 (읽을 때 · 성년 · 돌아옴 뒤) ──
DS.tmSync = function (s) {
  if (!s || !s.chars) return 0;
  var P = (s.lin && s.lin.P) || {}, n = 0;
  (s.mercs || []).forEach(function (m) { var q = m.pid && P[m.pid]; if (q && q.m === m.id && ok6(q.tm) && !ok6(m.tm)) { m.tm = q.tm.slice(); n++; } if (m.tm != null && !ok6(m.tm)) delete m.tm; if (m.pg != null && !ok6(m.pg)) delete m.pg; });
  var h = s.chars[s.hero];
  if (h && h.ps && typeof h.ps === 'object') {
    var ps = h.ps, q = h.pid && P[h.pid];
    if (!ok6(ps.tm)) { ps.tm = q && ok6(q.tm) ? q.tm.slice() : q && q.snap && q.snap.id ? DS.tmGen(+q.snap.id, 0) : DS.tmGen(strH((s.name || '') + '|' + h.cls + '|' + (+h.pid || +h.id || 1)), 1); n++; }      // 1세 대장: 이름·병과로 (판마다 다르다)
    if (q && !ok6(q.tm)) q.tm = ps.tm.slice();
  }
  return n;
};
var lf0 = DS.linFix;
if (lf0) DS.linFix = function (s) { var r = lf0(s); try { DS.tmSync(s); } catch (e) { if (DS.DEBUG) throw e; } return r; };
var ac0 = DS.ageCheck;
if (ac0) DS.ageCheck = function (s, at) { var r = ac0(s, at); DS.tmSync(s); return r; };
var eg0 = DS.egReturn;
if (eg0) DS.egReturn = function (s, i) { var r = eg0(s, i); DS.tmSync(s); return r; };
// 죽은 이의 기질을 가계도에 남긴다 (관에서 돌아올 때 같은 사람으로)
var md0 = DS.linMercDied;
if (md0) DS.linMercDied = function (s, m, at, why) {
  var r = md0(s, m, at, why);
  try { var P = (s.lin && s.lin.P) || {}; if (m && m.pid && P[m.pid] && !ok6(P[m.pid].tm)) { P[m.pid].tm = DS.tmOf(m).slice(); if (ok6(m.pg)) P[m.pid].pg = m.pg.slice(); if (m.pgn) P[m.pid].pgn = m.pgn; } } catch (e) { if (DS.DEBUG) throw e; }
  return r;
};
// 대장 줄을 새로 만들 때 (banner.js: 1세 소급 · 후계였던 갈래): 그 사람의 기질을 바로 적는다
var hp0 = DS.bnHeroPs;
if (hp0) DS.bnHeroPs = function (s, ch, p) { var ps = hp0(s, ch, p); if (ps && p && !ok6(ps.tm)) { var t = ok6(p.tm) ? p.tm : p.snap && p.snap.id ? DS.tmGen(+p.snap.id, 0) : null; if (t) ps.tm = t.slice(); } return ps; };
var bf0 = DS.bnFix;
if (bf0) DS.bnFix = function (s) { var r = bf0.apply(this, arguments); try { DS.tmSync(s); } catch (e) { if (DS.DEBUG) throw e; } return r; };
// 대장 자리로 옮길 때 (lineage.js 후계): 기질과 받은 성장을 함께 (ps 는 새 줄이라)
DS.tmCarry = function (m, ps) {
  if (!m || !ps) return ps;
  ps.tm = DS.tmOf(m).slice();
  var n = DS.pgSteps(m); if (n) ps.pgn = n;
  return ps;
};

// ── 전투력 내역: 「기질」 · 「개인 성장」 두 줄 (노년·비탄 앞) ──
function addRows(pp, full, tmOnly) {
  if (!pp || !pp.rows) return pp;
  var i = pp.rows.length; while (i > 0 && pp.rows[i - 1].k === 'age') i--;
  var base = pp.total, a = { k: 'tm', n: tmOnly - base, t: '' }, b = { k: 'pg', n: full - tmOnly, t: '' };
  pp.rows.splice(i, 0, a, b); pp.total = full;
  return { pp: pp, a: a, b: b };
}
var pp0 = DS.powerParts;
if (pp0) DS.powerParts = function (s, ch, who) {
  var pp = withOff(1, function () { return pp0(s, ch, who); }); if (!pp) return pp;
  var w = who || (ch && ch.id === s.hero ? ch.ps : null); if (!w) return pp;
  var tmOnly = withOff(2, function () { return DS.flagPower(s, ch, w); }), full = DS.flagPower(s, ch, w);
  var r = addRows(pp, full, tmOnly);
  r.a.t = DS.tmLabel(w).text; var g = DS.pgList(w); r.b.t = g.length ? g.length + '단계' : '';
  return pp;
};
var mp0 = DS.mercParts;
if (mp0) DS.mercParts = function (s, ch, m) {
  var pp = withOff(1, function () { return mp0(s, ch, m); }); if (!pp) return pp;
  var tmOnly = withOff(2, function () { return DS.power(DS.mercSpec(ch, m)); }), full = DS.power(DS.mercSpec(ch, m));
  var r = addRows(pp, full, tmOnly);
  r.a.t = DS.tmLabel(m).text; var g = DS.pgList(m); r.b.t = g.length ? g.length + '단계' : '';
  return pp;
};

// ── 단이 오른 알림 한 줄 (game.js — r42: 개인 단이 오를 때, o.t1 = 새 단) ──
//   「정예 승급 · 공격 +4% (배율 ×1.12 → ×1.18) · 전투력 3,210 → 3,390」
function fmt(n) { n = Math.round(n || 0); return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
DS.tmRankMsg = function (o) {
  var who = o.who, name = o.name || (who && (who.ttl || who.n)) || '', parts = [];
  var rk = o.t1 ? o.t1 + '단' : o.r1 > o.r0 ? DS.VET[o.r1].name + ' 승급' : o.s1 > o.s0 ? DS.STAR_NAME[o.s1] : '';
  parts.push((name ? name + ', ' : '') + rk);
  var sum = {}, ord = []; (o.gains || []).forEach(function (g) { if (!sum[g.k]) { sum[g.k] = 0; ord.push(g.k); } sum[g.k] += g.v; });
  var m1 = who ? DS.tmMul(who, 0) : null;
  ord.forEach(function (k) { var a = m1 ? m1[k] : 1; parts.push(DS.TM_STAT[k] + ' +' + sum[k] + '% (배율 ×' + (a - sum[k] / 100).toFixed(2) + ' → ×' + a.toFixed(2) + ')'); });
  if (!o.t1 && o.r1 > o.r0 && !o.flag) parts.push('공훈 ×' + DS.VET[o.r0].mul.toFixed(2) + ' → ×' + DS.VET[o.r1].mul.toFixed(2));
  if (o.s1 > o.s0 && o.lord && DS.ULT) parts.push('필살기 세기 +' + Math.round(DS.ULT.starP * 100) + '%');
  if (o.p0 > 0 && o.p1 > 0) parts.push('전투력 ' + fmt(o.p0) + ' → ' + fmt(o.p1));
  return parts.join(' · ');
};
})();
