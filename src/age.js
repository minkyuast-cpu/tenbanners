// 열 개의 깃발 — 나이·세월·자연사 (설계서 r6/age_spec.md)
// 게임 속 10분(1배속) = 1년. 모두가 같은 세계 달력으로 늙고, 사람마다 다른 수명에 닿으면 싸움이 없는 때 「천수를 누림」.
// 순수 규칙만 둔다 (화면은 age_ui). 사건은 돌려주는 목록으로 — game.js 가 G.lineageQ 에 쌓는다 (가계도와 같은 흐름).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

DS.AGE = { year: 600, adult: 15, elder: 10, elderMul: 0.95 };      // year: 게임 초 · adult: 성년 · elder: 수명까지 남은 해가 이 이하면 노년 (3.3.0: 덤의 해 bonus 는 없앴다 — 다시 부름은 열다섯 살로 온다)
DS.SEASONS = ['봄', '여름', '가을', '겨울'];
// 용병 종류별 수명·합류 나이 (없는 종류는 사람). word: 자연사를 부르는 말
DS.AGE_KIND = {
  human:      { life: [50, 72], start: [16, 28] },      // ⑳ 사람(대장·부대원·아이 공통) 수명 50~72, 합류 16~28 (등급 덤은 없앴다)
  m_merman:   { life: [90, 130], start: [20, 45] },
  m_griffin:  { life: [35, 55], start: [5, 14] },
  m2_ogre:    { life: [40, 60], start: [12, 22] },
  m2_wyvern:  { life: [70, 110], start: [8, 25] },
  m_spirit:   { life: [250, 400], start: [40, 150], word: '돌로 돌아감', say: '돌로 돌아갔다' },
  m_skeleton: { life: [150, 250], start: [30, 100], word: '흙으로 돌아감', say: '흙으로 돌아갔다' }
};
DS.AGE_CMD = { life: [50, 72], start: [16, 28], hero: 18 };      // ⑳
// ⑳ 장수 종족은 오래 사는 대신 더디게 큰다: 공훈이 쌓이는 속도 × (사람 평균 수명 61 ÷ 그 종족 평균 수명). 짧은 종족(그리폰·오우거)은 ×1
DS.KIND_GROW = { m_spirit: 0.19, m_skeleton: 0.31, m_merman: 0.55, m2_wyvern: 0.68 };
DS.HEAD_LS = 0;      // ㉒ 대장이 되는 순간의 수명 상한은 없다 (⑳ 의 72 · 3.3.0 의 90 삭제)
// ㉒ 사람의 수명: 50~72 고르게 + 12% 확률로 덤의 해(평균 9년 지수 분포, 끝 열림). 결정적 — 사람 번호(와 소금)의 해시. 72 를 넘긴 이는 「장수」 꼬리표 (숫자는 보이지 않는다)
DS.AGE_BONUS = { p: 0.12, mean: 9 };
DS.ageLsHuman = function (id, salt) {
  var C = DS.AGE_CMD.life, ls = C[0] + Math.floor(hsh(id, salt, 7) * (C[1] - C[0] + 1)), B = DS.AGE_BONUS;
  if (hsh(id, salt, 29) < B.p) ls += Math.round(-B.mean * Math.log(1 - Math.min(0.999999, hsh(id, salt, 31))));
  return ls;
};
DS.ageLong = function (e, s) { s = s || (DS.G && DS.G.save); var a = e && s ? DS.ageOf(s, e) : null; return a != null && a > DS.AGE_CMD.life[1]; };      // ㉒ 「장수」: 72 를 실제로 넘긴 이 (정해진 수명을 미리 내비치지 않는다)
DS.AGE_TXT = {
  deathNat: ['{a}{이가} 천수를 누리고 눈을 감았다.'],
  adult: ['{a}{이가} 성년이 되어 가문원으로 싸움에 나선다.'],      // {a} = 호 + 성이름 (「민규 2세 불꽃 스타크」)
  adultSb: ['{a}{이가} 성년이 되어 막사에 들었다.'],      // 2.2.1: 옛 맹주 가문의 아이
  elder: ['{a}의 머리에 서리가 내렸다. 노년에 들었다.']
};
var NAT = '천수를 누림';
DS.AGE_NAT = NAT;

function hsh(a, b, c) { return DS.hash2(a | 0, b | 0, c | 0); }
function rngIn(r, a) { return Math.floor(a[0] + r * (a[1] - a[0] + 1)); }
function Y() { return DS.AGE.year; }
function cal(s) { if (!s.cal || typeof s.cal !== 'object' || Array.isArray(s.cal)) s.cal = { t: Math.max(0, +s.time || 0) }; if (!(s.cal.t >= 0) && !(s.cal.t < 0)) s.cal.t = 0; return s.cal; }
function kindOf(type) { return DS.AGE_KIND[type] || DS.AGE_KIND.human; }
function scnN(s) { return Object.keys(s.cleared || {}).length; }
function merc(s, id) { for (var i = 0; i < s.mercs.length; i++) if (s.mercs[i].id === id) return s.mercs[i]; return null; }

// ── 달력 ──
DS.ageAdvance = function (s, dt) { if (s && dt > 0) cal(s).t += dt; };
DS.calNow = function (s) {
  var t = cal(s).t, yr = Math.floor(t / Y()) + 1, se = Math.min(3, Math.floor((t % Y()) / (Y() / 4)));
  return { t: t, yr: yr, season: se, sname: DS.SEASONS[se], text: yr + '년 ' + DS.SEASONS[se] };
};

// ── 나이·수명 ──
// 새 사람에게 나이를 정한다 (결정적: 번호 해시). kind: 'hero' | 'cmd' | 'merc' | 'kin'
DS.ageNew = function (s, e, kind, now) {
  var t = now == null ? cal(s).t : now, id = e.id || 0, age, ls;
  if (kind === 'hero' || kind === 'cmd' || kind === 'kin') {
    var C = DS.AGE_CMD;
    age = kind === 'hero' ? C.hero : rngIn(hsh(id, kind === 'kin' ? 913 : 311, 5), C.start);
    ls = DS.ageLsHuman(id, kind === 'kin' ? 917 : 313);      // ㉒
  } else {
    var K = kindOf(e.type), g = Math.max(1, Math.min(5, e.g || 1));
    age = rngIn(hsh(id, 331, 11), K.start);      // ⑳ 등급 덤 없음
    ls = DS.AGE_KIND[e.type] ? rngIn(hsh(id, 337, 13), K.life) : DS.ageLsHuman(id, 337);      // ㉒ 사람 종류는 덤의 해가 있는 식, 장수 종족은 제 범위
    age = Math.min(age, ls - 15);
  }
  e.by = t - age * Y(); e.ls = ls;
  return e;
};
DS.ageOf = function (s, e) {
  if (!e) return null;
  if (e.st && e.st !== 'live' && e.st !== 'young' && e.age != null) return e.age;      // 죽은 이·관 속 사람: 멈춘 나이
  if (e.by == null || !isFinite(+e.by)) return null;
  return Math.max(0, Math.floor((cal(s).t - e.by) / Y()));
};
DS.ageStage = function (s, e) {
  var a = DS.ageOf(s, e); if (a == null) return 'adult';
  if (e.st === 'young') return 'young';      // 미성년은 가계도의 아이만 (그리폰·와이번은 어린 나이에도 다 자란 짐승이다)
  return e.ls && e.ls - a <= DS.AGE.elder ? 'elder' : 'adult';
};
DS.ageLife = function (s, e) {
  var a = DS.ageOf(s, e), ls = e && e.ls || null;
  return { age: a, ls: ls, left: a != null && ls ? Math.max(0, ls - a) : null, stage: DS.ageStage(s, e), word: e && e.type && DS.AGE_KIND[e.type] && DS.AGE_KIND[e.type].word || '' };
};
DS.ageMood = function (s, e) { return e && DS.ageStage(s, e) === 'elder' ? { k: 'elder', name: '노년', desc: '수명이 얼마 남지 않았다. 공격, 마공 −' + Math.round((1 - DS.AGE.elderMul) * 100) + '%' } : null; };

// ── 성년 (미성년 자식은 가계도에만 있다: P.st 'young', P.ya = 용병이 될 때의 사양) ──
// lineage.js 의 출산이 부른다: 가계도에 갓난아기로 (15살에 가문원이 된다)
DS.ageYoung = function (s, hp, sp, type, g, r) {
  var Lr = s.lin, ch = s.chars[hp.c], keys = Object.keys(DS.TRAITS);
  var ya = { type: type, g: g, t: keys[Math.floor(r() * keys.length) % keys.length], v: Math.floor(r() * 4), sx: r() < 0.5 ? 'm' : 'f', n: DS.pickMercName(s, r) };
  var qk = DS.rollQuirk ? DS.rollQuirk(type, r) : null; if (qk) ya.q = qk;
  var C = DS.AGE_CMD.life, ls = C[0] + Math.floor(r() * (C[1] - C[0] + 1)); if (r() < DS.AGE_BONUS.p) ls += Math.round(-DS.AGE_BONUS.mean * Math.log(1 - Math.min(0.999999, r())));      // ㉒
  return { ya: ya, by: cal(s).t, ls: ls };      // 4.0: 대장의 아이는 종류와 무관하게 사람 수명으로 태어난다 (돌 정령·해골 병사 가주가 세대교체를 멎게 하지 않게)
};
function grow(s, at, evs) {
  var P = s.lin && s.lin.P; if (!P) return;
  Object.keys(P).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) {
    var p = P[k]; if (!p || p.st !== 'young' || !p.ya) return;
    if (DS.ageOf(s, p) < DS.AGE.adult) return;
    var hc = p.hx && s.chars[p.hx] && DS.CLASSES[s.chars[p.hx].cls] ? s.chars[p.hx] : null, sb = !!p.hx;      // 2.2.1: 옛 맹주 가문의 아이(P.hx)는 새 맹주를 따르지 않고 막사로 (그 가문의 병과)
    if (sb && DS.barFull && DS.barFull(s)) { var y0 = p.ya; p.m = 0; p.type = y0.type; p.g = y0.g; p.n = y0.n; delete p.ya; delete p.wait; p.st = 'gone'; logE(s, 'gone', p.id); var fn = DS.snName ? DS.snName(p.sn, p.n) : p.n || ''; s.news = (Array.isArray(s.news) ? s.news : []).concat(['막사가 가득 차(' + DS.MERC_MAX + '명) ' + fn + DS.josa1(fn, '이가') + ' 성년이 되었지만 막사에 들지 못하고 떠났다. 가계도에는 남는다.']); return; }      // 막사가 가득: 가계도에만 남는다
    var y = p.ya, m = DS.addMerc(s, y.type, y.g, sb ? 0 : s.hero);
    if (sb) { m.sb = 1; m.nc = hc && DS.houseCls ? DS.houseCls(hc) : ''; if (!m.nc) { delete m.nc; if (DS.sbNc) DS.sbNc(s, m, null); } }
    else m.kn = 1;
    m.L = DS.kidL ? DS.kidL(s) : 1; m.exp = 0;      // 2.2.0: 아이는 낮은 레벨로 맹주 가문의 가문원이 되어 함께 싸운다 (빈 가문의 가주로 보낼 수 있다)
    m.n = y.n; m.sx = y.sx; m.sn = p.sn; if (p.ttl) m.ttl = p.ttl; m.t = y.t; m.v = y.v; if (y.q) m.q = y.q; else delete m.q;
    m.by = p.by; m.ls = p.ls; m.pid = p.id; if (p.pot != null) m.pot = p.pot;      // ⑭-4 잠재력
    p.st = 'live'; p.m = m.id; p.type = y.type; p.g = y.g; p.n = y.n; delete p.ya; delete p.wait;
    var ax = { full: DS.snName ? DS.snName(p.sn, p.n) : (p.sn || '') + (p.n || '') }; if (sb) ax.sb = 1;
    var ev = logE(s, 'adult', p.id, 0, ax);      // 호(「민규 2세」)만으로는 형제가 구분되지 않아 성이름을 함께
    evs.push({ t: 'adult', a: p.id, mid: m.id, sb: sb ? 1 : 0, ev: ev });
  });
}
function logE(s, t, a, b, x) {
  var e = { t: t, s: scnN(s), tm: Math.round(s.time || 0), a: a || 0 }; if (b) e.b = b; if (x) e.x = x;
  var lg = s.lin.log; lg.push(e); if (lg.length > 300) lg.splice(0, lg.length - 300);
  return e;
}

// ── 판정: 싸움이 없는 때만 부른다 (시나리오 끝·필드 전투 끝·마을 진입) ──
// 지휘관: ch.down + ch.nat → 부르는 쪽이 이어서 DS.linSettle (사인 「천수를 누림」, 후계 의식). 용병: 명부에서 빼고 추모·가계도(DS.linMercDied).
DS.ageCheck = function (s, at) {
  var evs = []; if (!s || !s.chars) return evs;
  cal(s);
  if (s.lin && DS.linBirthYear) evs = evs.concat(DS.linBirthYear(s));      // ⑲ 해마다 출생 굴림 (싸움이 없는 때만 — ageCheck 를 부르는 자리)
  if (s.lin) grow(s, at, evs);
  DS.charList(s).forEach(function (ch) {
    if (ch.vac || ch.down || ch.by == null) return;
    var a = DS.ageOf(s, ch), st = DS.ageStage(s, ch);
    if (st === 'elder' && !ch.eld) { ch.eld = 1; var p = DS.linOf ? DS.linOf(s, ch) : null; evs.push({ t: 'elder', ch: ch.id, a: p ? p.id : 0, ev: p ? logE(s, 'elder', p.id) : null }); }
    if (ch.ls && a >= ch.ls) { ch.down = true; ch.nat = 1; }
  });
  s.mercs.slice().forEach(function (m) {
    if (m.by == null) return;
    var a = DS.ageOf(s, m), st = DS.ageStage(s, m), p = m.pid && s.lin && s.lin.P[m.pid];
    if (st === 'elder' && !m.eld) { m.eld = 1; if (p && p.m === m.id) evs.push({ t: 'elder', mid: m.id, a: p.id, ev: logE(s, 'elder', p.id) }); }
    if (!(m.ls && a >= m.ls)) return;
    var name = (DS.mercCall ? DS.mercCall(m) : '') || m.n || '', kind = DS.mercKind(m), word = (DS.AGE_KIND[m.type] || {}).word || NAT;
    if (m.it && DS.giveMercItem) DS.giveMercItem(s, m.id, null);      // 지녔던 물건은 가방으로 (싸우다 쓰러진 것이 아니므로)
    var lost = DS.loseMerc(s, m.id); if (!lost) return;
    var f = DS.fallenRecord ? DS.fallenRecord(lost, at || '') : { n: lost.n, type: lost.type, g: lost.g, at: at || '' };
    f.why = word; f.age = a;
    s.fallen = DS.fallenTrim ? DS.fallenTrim((s.fallen || []).concat([f])) : (s.fallen || []).concat([f]).slice(-30);
    var le = DS.linMercDied ? DS.linMercDied(s, lost, at, NAT) : [];
    if (le.length) { le.forEach(function (e) { if (e.t === 'death') e.nat = 1; }); evs = evs.concat(le); }
    else evs.push({ t: 'mnat', mid: lost.id, name: name, kind: kind, age: a, text: name + '(' + kind + ')' + '이(가) ' + a + '살에 ' + ((DS.AGE_KIND[lost.type] || {}).say || '천수를 누리고 눈을 감았다') });
  });
  return evs;
};
// 자연사(ch.nat)만 확정한다 — 마을 진입 때 (싸움 밖에서 다른 까닭으로 down 인 지휘관은 건드리지 않는다: 시험이 세운 유령 등)
DS.ageSettle = function (s, at) {
  if (!DS.linSettle) return [];
  var hold = DS.charList(s).filter(function (c) { return c.down && !c.vac && !c.nat; });
  if (!DS.charList(s).some(function (c) { return c.nat && c.down && !c.vac; })) return [];
  hold.forEach(function (c) { c.down = false; });
  try { return DS.linSettle(s, at); } finally { hold.forEach(function (c) { c.down = true; }); }
};
DS.ageGrow = function (s) { var evs = []; if (s && s.lin) grow(s, '', evs); return evs; };

// ── 가계도와 잇기 ──
var settle0 = DS.linSettle;
if (settle0) DS.linSettle = function (s, at) {
  var keep = {};
  DS.charList(s).forEach(function (ch) { if (ch.down && !ch.vac) keep[ch.id] = { by: ch.by, ls: ch.ls, age: DS.ageOf(s, ch), nat: !!ch.nat }; });
  var evs = settle0(s, at), P = s.lin.P;
  DS.charList(s).forEach(function (ch) {
    var k = keep[ch.id]; if (!k || !ch.vac) return;
    var p = P[ch.vac.pid]; if (p) { p.by = k.by; p.ls = k.ls; p.age = k.age; if (k.nat && p.d) { p.d.why = NAT; } }
    if (k.nat) { evs.forEach(function (e) { if (e.t === 'death' && e.ch === ch.id) { e.nat = 1; if (e.ev && e.ev.x) e.ev.x.why = NAT; } }); var lg = s.lin.log; for (var i = lg.length - 1; i >= 0; i--) if (lg[i].t === 'death' && lg[i].a === ch.vac.pid) { lg[i].x = lg[i].x || {}; lg[i].x.why = NAT; break; } }
    delete ch.nat; delete ch.eld;
  });
  return evs;
};
var md0 = DS.linMercDied;
if (md0) DS.linMercDied = function (s, m, at, why) {
  var a = DS.ageOf(s, m), evs = md0(s, m, at, why), P = s.lin.P;
  evs.forEach(function (e) { if (e.t === 'death' && P[e.a]) { P[e.a].by = m.by; P[e.a].ls = m.ls; P[e.a].age = a; } });
  return evs;
};
// 3.3.0 규칙 20: 가주 자리를 잇는 이의 수명이 90을 넘으면 64~90 에서 다시 잡는다. 나이가 이미 그 값 이상이면 나이 + 10~20. 순수 — 사람 번호 해시로 정해지고, 잇기 전에 계산된다
//   e = { id(사람 번호), by, ls } (지휘관·용병·사람 어느 것이든). 돌려주는 값: 깎은 수명 (90 이하이면 그대로)
DS.ageHeadLs = function (s, e, pid, cap) {      // ⑳ 상한 72 (cap 을 주면 그 값 — 옛 저장의 이미 앉은 가주는 3.3.0 의 90 으로 한 번만)
  cap = cap || DS.HEAD_LS;
  if (!e || !cap || !(+e.ls > cap)) return e ? e.ls : null;      // ㉒ 상한 없음 (cap 을 줄 때만 — 옛 3.3.0 규칙)
  var lo = cap === 90 ? 64 : DS.AGE_CMD.life[0], id = pid || e.pid || e.id || 0, a = DS.ageOf(s, e), ls = lo + Math.floor(hsh(id, 921, 31) * (cap - lo + 1));
  if (a != null && a >= ls) ls = a + 10 + Math.floor(hsh(id, 923, 37) * 11);
  return ls;
};
var succ0 = DS.linSucceed;
if (succ0) DS.linSucceed = function (s, chId, pick, opt) {
  var evs = succ0(s, chId, pick, opt); if (!evs) return evs;
  var ch = s.chars[s.hero]; if (!ch) return evs;      // 4.0: 이은 이의 나이·수명은 linSucceed 가 그 부대원에게서 옮겨 놓았다 (⑬ 이면 대장 깃발이 바뀌었다)
  if (ch.by == null || !(+ch.ls > 0)) DS.ageNew(s, ch, 'cmd');
  ch.ls = DS.ageHeadLs(s, ch, ch.pid); ch.lsc = 1;      // 가주 수명 상한 (사람 범위)
  if (DS.ageStage(s, ch) === 'elder') ch.eld = 1; else delete ch.eld;
  var p = ch.pid && s.lin.P[ch.pid]; if (p) { p.by = ch.by; p.ls = ch.ls; }
  return evs;
};
// 후계 후보에 나이·수명 (화면이 「139살 지휘관」 같은 것을 미리 알리게): age, ls, left(남은 해), stage, word. 먼 친척은 age null, ageRange [17, 30]
var heirs0 = DS.linHeirs;
if (heirs0) DS.linHeirs = function (s, chId) {
  return (heirs0(s, chId) || []).map(function (h) {
    var m = h.mid != null ? merc(s, h.mid) : null;
    if (m) { var L = DS.ageLife(s, m); h.age = L.age; h.ls = L.ls; h.left = L.left; h.stage = L.stage; h.word = L.word;
      if (chId === s.hero && DS.HEAD_LS && m.ls > DS.HEAD_LS) { h.ls = DS.ageHeadLs(s, m, m.pid); h.left = L.age != null ? Math.max(0, h.ls - L.age) : null; h.lsc = 1; } }      // 3.3.0: 가주 자리 후보는 상한을 적용한 값으로 (꼬리표와 이은 뒤가 같은 값을 본다)
    else if (h.young && h.pid && s.lin && s.lin.P[h.pid]) { var yp = s.lin.P[h.pid]; h.age = DS.ageOf(s, yp); h.ls = yp.ls || null; h.left = h.age != null && yp.ls ? Math.max(0, yp.ls - h.age) : null; h.stage = 'young'; }
    else if (h.kind === 'kin' || h.kind === 'pull') { h.age = null; h.ageRange = [DS.AGE_CMD.start[0], DS.AGE_CMD.start[1]]; h.ls = null; h.left = null; h.stage = 'adult'; }
    return h;
  });
};
var ent0 = DS.linEntomb;
if (ent0) DS.linEntomb = function (s, pid) {
  var p = s.lin.P[pid], rec = ent0(s, pid);
  if (rec && p) { rec.age = p.age != null ? p.age : null; rec.ls = p.ls || null; }
  return rec;
};
// 4.0: 합일의 나이 잇기는 없앴다 — 나이는 사람의 것이고, 합일해도 사람은 그대로다 (meta.js 의 DS.fuse 가 대장 줄의 사람 칸을 마스터 줄로 옮긴다)
// 새로 오는 이에게 나이를
var ac0 = DS.addChar;
DS.addChar = function (s, cls, L, name) { var ch = ac0(s, cls, L, name); if (ch && ch.by == null && (ch.id === s.hero || (!s.hero && !Object.keys(s.chars).some(function (k) { return +k !== ch.id; })))) DS.ageNew(s, ch, 'hero'); return ch; };      // 4.0: 나이는 사람의 것 — 깃발 줄은 대장 줄만
var am0 = DS.addMerc;
DS.addMerc = function (s, type, g, owner) { var m = am0(s, type, g, owner); if (m && m.by == null) DS.ageNew(s, m, 'merc'); return m; };
// 노년의 능력 (ent.eld 는 DS.ageCheck 가 붙인다 — 사양 함수는 저장을 모르므로)
var cs0 = DS.cmdSpec;
DS.cmdSpec = function (ch, hero, who) { var u = cs0(ch, hero, who), e = hero || !who ? ch : who; if (e && e.eld) { u.atk = Math.round(u.atk * DS.AGE.elderMul); u.mag = Math.round(u.mag * DS.AGE.elderMul); } return u; };      // 4.0: 노년은 사람의 것 (든 사람에게서 읽는다)
var ms0 = DS.mercSpec;
DS.mercSpec = function (ch, m) { var u = ms0(ch, m); if (m && m.eld) { u.atk = Math.round(u.atk * DS.AGE.elderMul); u.mag = Math.round(u.mag * DS.AGE.elderMul); } return u; };

// ── 저장: 빠진 칸 (fixSave 끝, DS.linFix 뒤). 옛 저장은 결정적으로 ──
DS.ageFix = function (s) {
  if (!s || !s.chars) return s;
  var c = cal(s); c.t = isFinite(+c.t) ? Math.max(0, Math.min(6e8, +c.t)) : Math.max(0, +s.time || 0);      // r8 (tech 8): 깨진 달력(±1e308·음수)이 「-1.67e+305년 undefined」로 새던 것
  var fix = function (e, kind) {
    if (e.by != null && isFinite(+e.by) && +e.ls > 0) { e.by = +e.by; e.ls = Math.round(+e.ls); return; }
    DS.ageNew(s, e, kind, c.t);
    if (kind === 'merc' && e.ttl) { e.by = c.t - (15 + Math.floor(hsh(e.id, 51, 7) * 6)) * Y(); }      // 3.0.0 의 자식(이미 막사에서 싸우던 이)은 성년으로
  };
  DS.charList(s).forEach(function (ch) { if (ch.id !== s.hero && ch.pid == null && ch.by == null && ch.hp == null && ch.name == null) return;      // 4.0: 새 모양 깃발 줄에는 나이가 없다 (옛 줄은 DS.bnFix 가 사람 줄로 옮기기 전에 채운다)
    fix(ch, ch.id === s.hero ? 'hero' : 'cmd'); if (ch.eld && DS.ageStage(s, ch) !== 'elder') delete ch.eld; if (ch.nat && !ch.down) delete ch.nat;
    if (ch.id === s.hero && !ch.lsc && !ch.vac) { ch.ls = DS.ageHeadLs(s, ch, ch.pid, 90); ch.lsc = 1; } });      // ⑳ 이미 앉은 가주의 정해진 수명은 3.3.0 규칙(90) 그대로 — 72 는 대장이 되는 순간부터      // 3.3.0: 가주 수명 상한을 한 번 (깃발 자리 아홉은 손대지 않는다 — 4.0 으로)
  (s.mercs || []).forEach(function (m) { fix(m, 'merc'); if (m.eld && DS.ageStage(s, m) !== 'elder') delete m.eld; });
  var P = s.lin && s.lin.P;
  if (P) for (var k in P) {
    var p = P[k], e = p.st === 'live' ? (p.c ? s.chars[p.c] : p.m ? merc(s, p.m) : null) : null;
    if (e) { p.by = e.by; p.ls = e.ls; }
    if (p.st === 'young' && (!p.ya || typeof p.ya !== 'object' || !DS.MERCS[p.ya.type] || !isFinite(+p.by))) { p.st = 'gone'; delete p.ya; }      // 깨진 미성년 기록
    if (p.age != null && !(p.age >= 0)) delete p.age;
  }
  if (s.coffins && Array.isArray(s.coffins.list)) s.coffins.list.forEach(function (r) { if (r.age != null && !(r.age >= 0)) r.age = null; });
  return s;
};
var ns0 = DS.newSave;
DS.newSave = function (name, cls) { var s = ns0(name, cls); cal(s).t = 0; DS.ageFix(s); var h = s.chars[s.hero]; if (h) DS.ageNew(s, h, 'hero', 0); s.mercs.forEach(function (m) { DS.ageNew(s, m, 'merc', 0); }); return s; };
})();
