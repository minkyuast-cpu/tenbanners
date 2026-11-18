// 열 개의 깃발 — 부대원과 깃발 (4.0 「부대원 + 깃발」 통합, 설계서 r9/unify/SPEC.md ①~⑥ · ⑫ · ⑬)
// 부대에는 사람과 깃발 둘뿐이다. 레벨·단·기술·장비는 깃발(save.chars)의 것이고, 사람은 대장 한 명(대장 깃발 줄 + ch.ps)과 부대원(save.mercs)이다.
// 깃발을 「든 사람」은 부대원 한 줄의 m.o = 깃발 번호 + m.h = 1 (대장 깃발은 대장 자신 — 그 줄의 ps). 고리는 사람 쪽 한 방향이라 한 사람이 두 깃발을 들 수 없다.
// 이 파일: 든 사람 찾기(bearer)·가주 세우기(hand)·막사의 같은 병과가 빈 가문을 잇기(sbTick)·전투 사양 겹(cmdSpec 바깥)·옛 저장 변환(bnFix).
// 2.2.0 「한 사람 한 사람」: 가솔·막사·맹주 밖 가문의 자동 후계는 없다. 가주가 떠난 가문은 막사에 같은 병과가 있으면 그이가, 없으면 빈 채로 남는다 (모집 · 맹주의 아이를 보내 채운다).
// 순수 규칙만 둔다 (화면은 ui.js). build.js · tools/load.js 에서 age 뒤 · save 앞.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

// ── 손잡이 (설계서 ③-1 · ⑫-1): 공훈 100마다 slope %, 최대 cap % · 대기 깃발 밑 사람의 승리 공훈
// r44: 든 사람(가주·맹주)의 등급은 배율이다 — gmul (일반 0.85 · 고급 0.95 · 희귀 1.05 · 영웅 1.20 · 전설 1.42, 전설/일반 1.67배).
//   희귀(아홉 집 본인 · 1세 맹주의 고정 등급)는 예전 +2% → +5% 로 거의 그대로, 자동으로 서는 가주(일반~희귀)의 평균도 예전과 몇 % 안쪽이다.
//   (예전: 더하기 몫 일반 0 · 고급 1 · 희귀 2 · 영웅 4 · 전설 6 % — 사용자 「전설과 일반 사이에 스탯 총합이 유의미하게 차이나게」. grade 칸은 옛 값 그대로 둔다 — 읽는 곳 없음)
DS.BN = { slope: 1, cap: 20, grade: [0, 0, 1, 2, 4, 6], gmul: [1, 0.85, 0.95, 1.05, 1.2, 1.42], bench: 2, retro: 10, retroCap: 300, cmdK: 1, kinK: 1, meritK: 2 };      // 2.2.0: cmdK = 깃발 유닛(가주·맹주)의 본디 힘 배율 · kinK = 가문원 배율 (2.2.0 「소수 정예」는 없앴다 — 싸우는 가문 수와 힘은 상관없다)다 (가솔이 맡던 몫 — 한 가문이면 +solo, soloN 이상이면 0) · nK = 지금 싸우는 가문 수 (DS.partySync 가 적는다) · meritK = 시나리오 승리 공훈에서 가주 몫 (가솔이 나눠 받던 몫까지 — 들판 기습·현상금도 가문마다 두 몫)
// 아홉(과 1세 대장)의 사람 종류 — 「깃발을 내려놓으면」 (⑥-1 표. 마스터는 돌아온 이 표 RET_KIND 와 같다)
DS.CAST_KIND = { inf: 'm_sword', cav: 'm_lancer', fly: 'm_lancer', mar: 'm_pike', pike: 'm_pike', arc: 'm_archer', cle: 'm_sister', mon: 'm_templar', mag: 'm_sister', sha: 'm_templar', bm: 'm_sword', tm: 'm_pike', mm: 'm_templar' };
// 아홉의 고정 특성 (1세 대장도 제 병과 줄에서 특성만 받는다). 마스터는 그 묶음의 주인공 병과 줄
DS.CAST_TRAIT = { inf: 'guard', cav: 'brave', fly: 'swift', mar: 'tough', pike: 'guard', arc: 'deadeye', cle: 'ward', mon: 'tough', mag: 'keen', sha: 'survivor', bm: 'guard', tm: 'deadeye', mm: 'keen' };
// r44: 1세 맹주(새 판의 대장)의 고정 특성 — 병과 줄(CAST_TRAIT)과 같되, 비병 대장은 「구사일생」(가호 기술이 없고 화살에 약해 첫 가문으로 서면 혼자 먼저 쓰러지던 것 — 봇 8판 측정). 아홉 집 본인(제비)은 그대로
DS.HERO_TRAIT = { fly: 'survivor' };
DS.heroTrait = function (cls) { return (DS.HERO_TRAIT && DS.HERO_TRAIT[cls]) || DS.CAST_TRAIT[cls] || 'guard'; };
DS.CAST_SX = { cav: 'm' };      // 성별이 이야기에 걸리는 이 (16번 「형님」). 나머지는 번호 해시 — 글팀이 확정하면 이 표만 채운다
DS.CAST_G = 3;      // 아홉·1세 대장의 등급: 희귀

function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function hsh(a, b, c) { return DS.hash2(a | 0, b | 0, c | 0); }
function mercOf(s, id) { var ms = s.mercs || []; for (var i = 0; i < ms.length; i++) if (ms[i].id === id) return ms[i]; return null; }
function scnN(s) { return Object.keys(s.cleared || {}).length; }
function heroId(s) { return s && s.chars && own(s.chars, s.hero) ? +s.hero : 0; }

// ───────── 든 사람 ─────────
// 대장 깃발이면 그 줄의 ps(대장이라는 사람의 기록 — 체력·나이·이름은 대장 줄에), 아니면 m.o === ch.id && m.h 인 부대원. 없으면 null (빈 깃발)
DS.bearer = function (s, ch, noSync) {      // r42: 찾을 때마다 가문 줄의 레벨을 가주의 개인 레벨에 맞춘다 (noSync = 맞추지 않는다 — DS.pSync 안에서)
  if (!s || !ch || !s.chars) return null;
  var b = null;
  if (ch.id === heroId(s)) { if (!ch.vac && ch.ps && !ch.ps.ul && DS.heroUlt) DS.heroUlt(s); b = ch.vac ? null : (ch.ps || null); }      // r38: 깨어난 맹주의 타고난 필살기를 사람 줄에 적어 둔다 (싸움 사양이 ps.ul 을 읽는다)
  else { var ms = s.mercs || []; for (var i = 0; i < ms.length; i++) if (ms[i].h && ms[i].o === ch.id) { b = ms[i]; break; } }
  if (!noSync && s.chars[ch.id] === ch && DS.pSyncRow) DS.pSyncRow(ch, b, !b && ch.id !== heroId(s));      // 2.2.0: 빈 가문은 레벨·단을 잃는다
  return b;
};
DS.bearerOf = function (s, chId) { return DS.bearer(s, s.chars[chId]); };
DS.bearsFlag = function (s, m) { return m && m.h && m.o && s.chars[m.o] && m.o !== heroId(s) ? s.chars[m.o] : null; };      // 이 부대원이 든 깃발 (없으면 null)
DS.flagName = function (cls) { var C = DS.CLASSES[cls]; if (!C) return '깃발'; return C.master ? ((DS.FAMILY[C.fam] || {}).name || C.name + ' 깃발') : C.name + ' 깃발'; };
// 든 사람의 화면 이름 (대장 = 대장 줄의 이름, 부대원 = 호 또는 이름). 빈 깃발은 ''
DS.bearerName = function (s, ch) {
  if (!ch) return '';
  if (ch.id === heroId(s)) return ch.vac ? '' : (ch.name || s.name || '');
  var b = DS.bearer(s, ch); return b ? (b.ttl || b.n || '') : '';
};
// 얹힘 (%): 공훈 100마다 1%(최대 20%) + 등급 몫. 공훈 0 · 일반 = 0 — 지금의 깃발 유닛과 글자 그대로 같다
// r42: 공훈 몫은 그 사람이 선 가문의 공훈(DS.hPct)이다 — ch 를 주면 그 가문(맡기기 미리 보기), 없으면 지금 선 가문
function houseFor(who, ch) { if (ch) return ch; var s = DS.G && DS.G.save; return s && DS.whoHouse ? DS.whoHouse(s, who) : null; }
DS.bnMerit = function (who, ch) { var h = houseFor(who, ch); return who && h && DS.hPct ? DS.hPct(h) : 0; };
DS.bnGMul = function (who) { if (!who || who.g === 0) return 1; return DS.BN.gmul[Math.max(1, Math.min(5, Math.round(+who.g || 3)))] || 1; };      // r44: 등급 배율 (등급 칸이 없으면 희귀 · g 0 = 배율 1 — 내역 표가 공훈 줄을 떼어 볼 때)
DS.bnGrade = function (who) { return who ? Math.round((DS.bnGMul(who) - 1) * 100) : 0; };      // 등급 몫 (%, 화면 글) — 일반 −15 · 고급 −5 · 희귀 +5 · 영웅 +20 · 전설 +42
DS.bnHeroGMul = function (who) { return Math.max(DS.bnGMul(who), DS.BN.gmul[DS.CAST_G || 3] || 1); };      // r44: 맹주 자리는 희귀(1세 맹주의 고정 등급)보다 낮게 치지 않는다 — 낮은 등급의 후계가 앉아도 맹주 가문이 무너지지 않게. 더 높으면 그대로
DS.bnK = function (who, ch, hero) { return who ? (1 + DS.bnMerit(who, ch) / 100) * (hero ? DS.bnHeroGMul(who) : DS.bnGMul(who)) : 1; };      // 얹힘 배율 = (1 + 공훈 %) × 등급 배율
DS.bnPct = function (who, ch) { return who ? Math.round((DS.bnK(who, ch) - 1) * 100) : 0; };
DS.pctTxt = function (n) { n = Math.round(+n || 0); return (n < 0 ? '−' : '+') + Math.abs(n) + '%'; };

// ───────── 전투 사양: cmdSpec 바깥 겹 (engine.js 는 고치지 않는다) ─────────
// who = DS.bearer(save, ch). 공훈·등급 얹힘(HP·공격·마공·방어·마방) + 특성은 온전히. 버릇·고유 기술은 쉰다. 비탄·노년은 lineage·age 겹이 who 에게서 읽는다.
var cs0 = DS.cmdSpec;
function withL(ch, L) { var c = {}; for (var k in ch) if (own(ch, k)) c[k] = ch[k]; c.L = L; return c; }
DS.cmdSpec = function (ch, hero, who) {
  var u = cs0(who && who.L != null && DS.pL(who) !== ch.L ? withL(ch, DS.pL(who)) : ch, hero, who);      // r42: 깃발 유닛은 든 사람의 개인 레벨로
  if (!who) return u;
  var k = DS.bnK(who, ch, hero), T = (who.t && DS.TRAITS[who.t]) || {}, k0 = k;
  k *= DS.BN.cmdK || 1;      // 2.2.0: 가주 본디 힘 (화면의 얹힘 % 는 k0 — 공훈·등급 몫만)
  var hp = Math.max(1, Math.round(u.mhp * k * (T.hp || 1)));
  u.hp = u.mhp = hp;
  u.atk = Math.round(u.atk * k * (T.at || 1)); u.mag = Math.round(u.mag * k * (T.at || 1));
  u.def = Math.round(u.def * k * (T.def || 1)); u.res = Math.round(u.res * k * (T.res || 1));
  if (T.spd) u.spd = u.spd * T.spd;
  if (T.crit) u.crit = (u.crit || 0.06) + T.crit;
  var I = !hero && who.it && DS.MGEAR && own(DS.MGEAR, who.it) ? DS.MGEAR[who.it] : null;      // 2.2.0: 가주가 든 물건 (숫돌·덧방패 …)
  if (I) { if (I.hp) { u.hp = u.mhp = Math.max(1, Math.round(u.mhp * I.hp)); } if (I.at) { u.atk = Math.round(u.atk * I.at); u.mag = Math.round(u.mag * I.at); } if (I.def) u.def = Math.round(u.def * I.def); if (I.res) u.res = Math.round(u.res * I.res); if (I.spd) u.spd = u.spd * I.spd; }
  if (who.t === 'survivor') u.survX = true;      // 구사일생: 깃발 유닛에 이미 걸리는 길(장비 효과 survX)을 켠다
  else if ((who.t === 'brave' || who.t === 'medic') && !u.trait) u.trait = who.t;      // 엔진이 읽는 특성 (응급 처치는 물러난 유닛에게만 — 깃발 유닛에서는 저절로 일어나지 않는다)
  if (!hero && who.type && DS.MERCS[who.type] && !DS.bnNative(ch.cls, who)) bnShape(u, ch.cls, who);      // r27: 태생이 다른 가주 — 제 몸의 능력치로 가문의 기술을 쓴다
  if (!hero) {
    var nm = who.ttl || who.n; if (nm) u.name = nm; u.bear = who.id || 0; u.nat = who.type && DS.MERCS[who.type] ? (DS.bnNative(ch.cls, who) ? 1 : 0) : 1;
    var bl = DS.bearerLook(who);      // r27: 가주는 제 모습 그대로 — 생김새는 든 사람(부대원)의 것, 능력·기술은 가문(병과)의 것
    if (bl) { u.look = bl.look; u.sprite = bl.sprite; u.pal = bl.pal; u.big = bl.big; u.plook = 1; }
  }
  u.bpct = Math.round((k0 - 1) * 100);
  if (DS.ultSpec) DS.ultSpec(u, who, hero, true);      // r32 필살기 · r36: 맹주만 · r38: 맹주가 타고난 것(ch.ps.ul — 깨어난 뒤에 적힌다)
  return u;
};
(DS.UNIT_KEYS = DS.UNIT_KEYS || []).push('bpct', 'sprite', 'pal', 'big', 'plook', 'nat', 'mv', 'mt', 'rng', 'atkKind', 'dtype', 'kind', 'tags');
// ───────── r27 태생 병과 (사용자: 「능력치와 외모는 그대로 하고 스킬만 바꾸는 게 어때 — 그래야 태생 병과를 고르려고 노력할 테니」) ─────────
// 가주는 제 모습과 제 능력치로 싸우고, 기술만 가문의 것을 쓴다. 능력치의 크기(레벨·장비·공훈·등급·특성)는 깃발 그대로이고,
// 「몸의 결」(체력·공격·방어의 비율, 빠르기, 걸음, 사거리, 공격 꼴, 상성 종류)은 그 사람의 태생(용병 종류)을 따른다.
//   태생이 가문과 맞으면(그 가문이 거느리는 종류 — DS.mercTypes) 몸의 결이 가문의 본보기와 같아 지금과 글자 그대로 같다.
//   다르면: 비율 = 그 사람 종류 ÷ 가문의 본보기 종류(DS.baseMercTypes 첫째) — 한 칸마다 clamp 안으로 — 에 miss 를 곱한다 (용병의 「병과 일치 1.1」과 짝).
//   아홉은 제 집(합일 뒤에는 제 집이 든 묶음)에서 태생이 맞는 것으로 친다 — 이야기의 가주다.
DS.BN.miss = 0.9; DS.BN.clamp = [0.75, 1.25];
DS.bnNative = function (cls, who) {
  if (!who || !who.type || !DS.CLASSES[cls]) return true;
  var wc = who.cast || who.nc;      // 2.2.0: nc = 받은 가문 병과 (모집한 영웅 · 가문을 맡은 아이) — 아홉 집처럼 제 집으로 친다
  if (wc) { var C = DS.CLASSES[cls], F = C.fam && DS.FAMILY[C.fam]; if (wc === cls || (C.master && F && F.members.indexOf(wc) >= 0)) return true; }
  return DS.mercTypes(cls).indexOf(who.type) >= 0;
};
// 그 사람의 태생 병과 이름 (「궁병」 · 큰 용병은 「보병·기병」). 아홉은 제 집 병과
DS.nativeName = function (who) {
  if (!who) return '';
  var wc = who.cast || who.nc; if (wc && DS.CLASSES[wc]) return DS.CLASSES[wc].name;
  var out = []; Object.keys(DS.CLASSES).forEach(function (k) { var C = DS.CLASSES[k]; if (!C.master && DS.mercTypes(k).indexOf(who.type) >= 0) out.push(C.name); });
  return out.join('·') || (DS.MERCS[who.type] ? DS.MERCS[who.type].name : '');
};
function bnShape(u, cls, who) {
  var M = DS.MERCS[who.type], R = DS.MERCS[DS.baseMercTypes(cls)[0]] || M, B = DS.BN, k = B.miss;
  function r(a, b) { return Math.max(B.clamp[0], Math.min(B.clamp[1], (a || 1) / (b || 1))); }
  var am = (M.hp + M.at + M.df) / 3, ar = (R.hp + R.at + R.df) / 3;      // 결만 옮긴다: 세 칸의 평균으로 나눠 「몸집」(큰 용병·센 종류)은 빼고 비율만
  var rh = r(M.hp / am, R.hp / ar) * k, ra = r(M.at / am, R.at / ar) * k, rd = r(M.df / am, R.df / ar) * k;
  u.hp = u.mhp = Math.max(1, Math.round(u.mhp * rh));
  u.atk = Math.round(u.atk * ra); u.mag = Math.round(u.mag * ra); u.def = Math.round(u.def * rd); u.res = Math.round(u.res * rd);
  u.spd = u.spd * r(M.spd, R.spd);
  u.mv = M.mv; u.mt = M.mt; u.rng = M.rng.slice(); u.atkKind = M.atk; u.dtype = M.dtype; u.kind = M.kind;
  u.tags = (u.tags || []).filter(function (t) { return t !== 'fly'; }).concat(M.tags || []);
}
// r27: 든 사람(부대원·아홉)의 생김새 → 유닛 그림 칸. 큰 용병(인구 2)은 제 큰 그림과 빛깔 그대로. 대장(대장 줄의 ps)은 null — 대장 가문의 병과가 곧 대장의 모습이다
DS.bearerLook = function (who) {
  var M = who && who.type && DS.MERCS && DS.MERCS[who.type]; if (!M) return null;
  return M.big ? { look: null, sprite: M.sprite || null, pal: M.pal || null, big: true } : { look: [who.type, who.g || 1, who.v || 0], sprite: null, pal: null, big: false };
};

// ───────── 맹주 집 핏줄 아이 (2.2.0: 어른이 되면 맹주 가문의 가문원으로 싸운다 · 빈 가문의 가주로 보낼 수 있다) ─────────
DS.kidOf = function (s, m) { var P = s && s.lin && s.lin.P, q = m && m.pid && P ? P[m.pid] : null; return q && q.m === m.id && q.hb && !q.ad ? q : null; };
// ───────── 가주 세우기 (2.2.0) ─────────
// DS.hand(s, chId, mid, opt) — 가문 chId 의 가주를 mid 로 세운다.
//   mid = 막사의 같은 병과(DS.sbFits): 가주와 자리를 바꾼다 (가주가 있으면 그이는 막사로 — 맹주 집 사람이면 가문원으로 돌아간다).
//   mid = 맹주 가문의 어른 가문원: 빈 가문의 가주로 보낸다. 그 사람은 그 가문의 병과를 받는다 (m.nc). 가주가 선 가문에는 보내지 않는다.
//   가주를 그냥 내리는 길은 없다. opt.where = 'town'(기본) | 'field'(싸움 밖, 마을 밖) | 'battle'(싸우는 중 — 못 한다)
//   마을 밖에서 자리를 바꾸면 새로 서는 사람의 체력 비율이 물러나는 이보다 높지 않게 맞춘다 (옛 규칙 그대로).
//   돌려주는 것: { ok, why, out: 물러난 이 번호(0 = 없음), to: 물러난 이가 간 곳('sb' | 'kin' | ''), nf }
// r32: 처음 가주가 된 사람은 이름을 한 번 값없이 정한다 (m.nf — social.js 의 무료 1번). m.nfd = 이미 받았다 (두 번 주지 않는다). 아홉 집 사람은 이름이 이야기에 묶여 있다
DS.nfGive = function (m) { if (!m || m.cast || m.nfd) return false; m.nfd = 1; m.nf = 1; return true; };
DS.handWhy = function (s, chId, m, opt) {
  var ch = s && s.chars && s.chars[chId], where = (opt && opt.where) || 'town';
  if (!ch) return '가문이 없다';
  if (where === 'battle') return '싸우는 중에는 못 바꾼다';
  if (+chId === heroId(s)) return '맹주 가문의 가주는 맹주다';
  if (!m) return '찾을 수 없다';
  if (m.h) return m.o === ch.id ? '이미 가주다' : '다른 가문의 가주다';
  if (DS.isSb(m)) return DS.sbFits(ch, m) ? '' : '병과가 다르다';
  if (m.o === heroId(s)) return DS.bearer(s, ch, 1) ? '가주가 있는 가문에는 보내지 않는다' : '';
  return '보낼 수 없는 사람이다';
};
DS.hand = function (s, chId, mid, opt) {
  opt = opt || {};
  var where = opt.where || 'town', ch = s && s.chars && s.chars[chId], no = function (w) { return { ok: false, why: w, out: 0, to: '' }; };
  if (!ch) return no('가문이 없다');
  if (!mid) return no('가주를 내리는 길은 없다. 막사의 사람과 자리를 바꾼다');
  var m = mercOf(s, +mid), why = DS.handWhy(s, chId, m, opt); if (why) return no(why);
  var cur = DS.bearer(s, ch, 1), field = where !== 'town', to = '';
  var hpM = m.hp == null ? 1 : m.hp, hpC = cur ? (cur.hp == null ? 1 : cur.hp) : 1;
  if (field && cur && hpM > hpC) m.hp = hpC;
  var kin = !DS.isSb(m);
  delete m.sb; m.o = ch.id; m.h = 1; ch.Ls = ch.L;      // 새 가주는 제 레벨 그대로 (따라잡기 없음)
  if (kin) { m.kn = 1; m.nc = DS.houseCls(ch); }      // 맹주 집 아이가 가문을 맡는다: 그 가문의 병과를 받는다
  if (cur) {
    delete cur.h;
    if (DS.lineOf && DS.lineOf(s, cur)) { cur.o = heroId(s); delete cur.sb; to = 'kin'; } else { DS.sbNc(s, cur, ch); cur.o = 0; cur.sb = 1; to = 'sb'; }      // 물러난 가주는 그 가문의 병과로 막사에
    if (field && hpC > hpM) cur.hp = hpM;
  }
  if (DS.mercTidy) DS.mercTidy(s);
  if (DS.pSync) DS.pSync(s);
  var nf = DS.nfGive(m);
  if (kin && s.lin && DS.linLogE) { var p = DS.linOf ? DS.linOf(s, m) : null; if (p) DS.linLogE(s, 'succ', p.id, 0, { ch: ch.id, house: DS.flagName(ch.cls, s), kin: 1 }); }
  return { ok: true, why: '', out: cur ? cur.id : 0, to: to, nf: nf };
};
// ───────── 막사의 같은 병과가 빈 가문을 잇는다 (2.2.0) ─────────
// 그 가문이 주는 병과 (합일한 가문이면 그 묶음의 첫 병과)
DS.houseCls = function (ch) { var C = DS.CLASSES[ch.cls], F = C && C.master && DS.FAMILY[C.fam]; return F ? F.members[0] : ch.cls; };
// 막사의 사람은 가문에 매이지 않는다. 병과가 맞는가: 받은 병과(nc · 아홉 집은 cast)가 있으면 그 병과(합일한 가문이면 그 묶음), 없으면 태생(DS.bnNative)
DS.sbFits = function (ch, m) {
  if (!ch || !m || !DS.CLASSES[ch.cls]) return false;
  var wc = m.cast || m.nc, C = DS.CLASSES[ch.cls], F = C.fam && DS.FAMILY[C.fam];
  if (wc) return wc === ch.cls || !!(C.master && F && F.members.indexOf(wc) >= 0);
  return DS.bnNative(ch.cls, m);
};
// 2.2.0: 막사의 사람은 병과가 꼭 하나다 (m.nc). 받은 병과가 없으면 정해 준다 (결정적): 떠나온 가문 ch 가 있고 종류가 그 가문(합일한 가문이면 그 묶음의 한 병과)에 맞으면 그 병과,
//   아니면 종류의 태생 병과(DS.pNative — 종류를 거느리는 첫 병과). 큰 용병(오우거 · 발리스타 · 대수녀)처럼 여러 병과에 맞는 종류도 한 병과에만 맞게 된다. 아홉 집(cast)은 제 집 그대로
DS.sbNc = function (s, m, ch) {
  if (!m || m.cast) return m && m.cast || '';
  if (m.nc && DS.CLASSES[m.nc] && !DS.CLASSES[m.nc].master) return m.nc;
  var C = ch && DS.CLASSES[ch.cls], F = C && C.master && DS.FAMILY[C.fam], list = ch ? (F ? F.members : [ch.cls]) : [], nc = '';
  list.forEach(function (k) { if (!nc && (DS.mercTypes(k).indexOf(m.type) >= 0 || DS.heroType(k) === m.type)) nc = k; });      // 그 병과의 영웅 종류(비병 → 랜서 …)도 맞는 것으로
  if (!nc) nc = DS.pNative(s, m);
  if (!DS.CLASSES[nc] || DS.CLASSES[nc].master) nc = (DS.FAMILY[(DS.CLASSES[nc] || {}).fam] || { members: ['inf'] }).members[0];
  m.nc = nc;
  return nc;
};
// 막사의 사람이 가주로 설 수 있는 가문 (빈 가문 먼저, 맹주 가문은 빼고). 없으면 null — 화면이 「그 가문의 가주라면」으로 잰다
DS.sbHome = function (s, m) {
  if (!s || !s.chars || !m) return null; var hid = heroId(s), best = null;
  DS.charList(s).forEach(function (ch) { if (ch.id === hid || !DS.sbFits(ch, m)) return; if (!best || (DS.vacant(s, ch) && !DS.vacant(s, best))) best = ch; });
  return best;
};
// 싸움·시나리오 밖에서 부른다 (game.js 의 고리 · 싸움이 끝난 뒤 · 봇). 가주가 없는 가문(맹주 가문 밖)마다, 가문 차례대로, 막사의 같은 병과 가운데 가장 나은 이(등급 → 레벨)가 저절로 가주가 된다.
//   같은 병과가 없으면 빈 가문으로 남는다 (병과를 바꿔 서는 길은 맹주의 아이를 보낼 때뿐 — DS.hand).
//   돌려주는 것: [{ t: 'sbSeat', ch, mid, text }]
DS.sbBest = function (s, chId) { return DS.sbOf(s, chId)[0] || null; };
DS.sbTick = function (s) {
  var out = []; if (!s || !s.chars) return out;
  DS.charList(s).forEach(function (ch) {
    if (!DS.vacant(s, ch)) return;
    var m = DS.sbBest(s, ch.id); if (!m) return;
    delete m.sb; m.o = ch.id; m.h = 1; ch.Ls = ch.L; DS.nfGive(m);
    var nm = m.ttl || m.n || '', house = DS.flagName(ch.cls, s);
    if (s.lin && DS.linOf && DS.linLogE) { var p = DS.linOf(s, m) || (DS.linMkP ? (function () { var q = DS.linMkP(s, { k: 'm', sn: m.sn, n: m.n, sx: m.sx, type: m.type, g: m.g, m: m.id, gv: 1 }); if (m.by != null) { q.by = m.by; q.ls = m.ls; } m.pid = q.id; return q; })() : null); if (p) DS.linLogE(s, 'succ', p.id, 0, { ch: ch.id, house: house, sb: 1 }); }
    out.push({ t: 'sbSeat', ch: ch.id, mid: m.id, text: nm + DS.josa1(nm, '이가') + ' 막사에서 나와 ' + house + '을 맡았다.' });
  });
  if (out.length) { if (DS.mercTidy) DS.mercTidy(s); if (DS.pSync) DS.pSync(s); }
  return out;
};
// 빈 가문 (가주가 없고 막사에 같은 병과도 없다 — 싸우지 않는다)
DS.bnEmpty = function (s) { return DS.charList(s).filter(function (ch) { return DS.vacant(s, ch) && !DS.sbOf(s, ch.id).length; }).map(function (ch) { return ch.id; }); };

// ───────── 추모 기록에 들던 깃발 번호 (f) ─────────
var fr0 = DS.fallenRecord;
if (fr0) DS.fallenRecord = function (m, at) { var f = fr0(m, at); if (m && m.h && m.o) f.f = m.o; if (m && m.cast) f.cast = m.cast; return f; };

// ───────── 아홉 집 (이야기 열쇠 cast) ─────────
// 2.2.0: 아홉 가운데 누가 잠들어도 그 집의 다음 사람이 저절로 오지 않는다 — 그 가문은 다른 가문처럼 막사의 같은 병과가 잇거나 빈 채로 남는다 (이야기는 「떠났다」 줄을 읽는다)
DS.castFlag = function (s, key) {
  var C = DS.CLASSES[key], F = C && DS.FAMILY[C.fam], hit = null, mst = null;
  DS.charList(s).forEach(function (c) { if (c.cls === key) hit = c; else if (F && c.cls === F.master) mst = c; });
  return hit || mst || null;
};
DS.castTag = function (m) { return m && m.cast && m.hd ? DS.castHouse(m.cast) + ' ' + m.hd + '대' : ''; };      // 「센주 가문 2대」 (옛 저장의 아홉 집 2대)
DS.josa1 = function (w, pair) { var c = String(w).charCodeAt(String(w).length - 1), has = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 > 0; return has ? pair[0] : pair[1]; };
function houseSn(s, ch) { var C = DS.CLASSES[ch.cls]; return (DS.LIN_HOUSE && DS.LIN_HOUSE[ch.cls]) || (C && C.fam && DS.FAMILY[C.fam] && DS.LIN_HOUSE && DS.LIN_HOUSE[DS.FAMILY[C.fam].members[0]]) || '로저스'; }
// 옛 저장(v12)을 옮길 때만: 2.1 의 「다음 가주가 곧 온다」(lin.hw · 아홉 집 lin.c2) 약속을 지킨다 — 그 가문이 아직 비어 있으면 한 사람이 가주로 선다. 기다림 줄은 지운다. 선 사람 수
DS.migSucc = function (s) {
  var Lr = s && s.lin; if (!Lr) return 0;
  var n = 0, hw = Lr.hw && typeof Lr.hw === 'object' && !Array.isArray(Lr.hw) ? Lr.hw : {}, c2 = Lr.c2 && typeof Lr.c2 === 'object' && !Array.isArray(Lr.c2) ? Lr.c2 : {};
  Object.keys(c2).forEach(function (key) { var w = c2[key], f = DS.castFlag(s, key); if (f && w && typeof w === 'object' && !hw[f.id]) hw[f.id] = { pre: w.pre || f.L, type: w.type, g: w.g, gen: w.gen, pid: w.pid }; });
  Object.keys(hw).forEach(function (k) {
    var w = hw[k], ch = s.chars[+k];
    if (!ch || ch.id === heroId(s) || DS.bearer(s, ch, 1) || !w || typeof w !== 'object') return;
    var id = s.mnid++, Y = (DS.AGE && DS.AGE.year) || 600, t = (s.cal && s.cal.t) || 0, keys = Object.keys(DS.TRAITS), g = Math.max(1, Math.min(5, Math.round(+w.g || 2))), type = DS.MERCS[w.type] ? w.type : DS.heroType(ch.cls);
    var b0 = DS.recruitL ? DS.recruitL(s, g) : 1, nm = DS.pickMercName ? DS.pickMercName(s, function () { return hsh(id, 411, 3); }) : '이음';
    var m = { id: id, type: type, g: g, o: ch.id, h: 1, hp: 1, n: nm, v: Math.floor(hsh(id, 413, 3) * 4) % 4, t: keys[Math.floor(hsh(id, 415, 5) * keys.length) % keys.length], L: DS.heirLOf ? DS.heirLOf(b0, w.pre, DS.heirShare('house', ch)) : b0, exp: 0, k: 0, b: 0,
      sn: houseSn(s, ch), sx: hsh(id, 417, 7) < 0.5 ? 'm' : 'f', lk: 1, hk: ch.id, hd: Math.max(2, +w.gen || 2), nc: DS.CLASSES[ch.cls].master ? DS.FAMILY[DS.CLASSES[ch.cls].fam].members[0] : ch.cls };
    if (DS.AGE) { m.by = t - (17 + Math.floor(hsh(id, 419, 9) * 6)) * Y; m.ls = DS.ageLsHuman(id, 421); }
    s.mercs.unshift(m); DS.nfGive(m);
    if (DS.linMkP) { var p = DS.linMkP(s, { k: 'm', sn: m.sn, n: nm, sx: m.sx, gen: m.hd, pa: [], type: m.type, g: m.g, m: m.id, gv: 1 }); p.hh = 1; if (m.by != null) { p.by = m.by; p.ls = m.ls; } m.pid = p.id; DS.linLogE(s, 'succ', p.id, +w.pid || 0, { ch: ch.id, hd: m.hd, house: DS.flagName(ch.cls, s) }); }
    n++;
  });
  delete Lr.hw; delete Lr.c2;
  return n;
};

// ───────── 합류: 깃발을 든 본인 (world.js applyClear 가 부른다) ─────────
// 아홉의 자리(⑥-1): 그 집의 성과 이름 · 깃발을 내려놓으면의 종류 · 희귀 · 고정 특성 · 잠김 · 열쇠(cast). 나이는 지휘관과 같은 범위(17~30, 번호 해시). 돌려주는 것: 그 부대원
DS.castJoin = function (s, key, ch) {
  if (!DS.CAST_NAME || !DS.CAST_NAME[key] || (s.mercs || []).some(function (x) { return x.cast === key; })) return null;
  if (DS.castHero && DS.castHero(s) === key) return null;      // r22: 그 사람은 이미 대장이다 — 두 번 오지 않는다
  var id = s.mnid++, m = { id: id, type: DS.CAST_KIND[key] || 'm_sword', g: DS.CAST_G, o: ch.id, h: 1, hp: 1, n: DS.CAST_NAME[key], v: Math.floor(hsh(ch.id, 441, 3) * 4) % 4, t: DS.CAST_TRAIT[key], L: ch.L, exp: 0, k: 0, b: 0,
    sn: (DS.LIN_HOUSE && DS.LIN_HOUSE[key]) || '로저스', sx: DS.CAST_SX[key] || (hsh(ch.id, 211, 7) < 0.5 ? 'm' : 'f'), lk: 1, cast: key };
  if (DS.ageNew && s.cal) DS.ageNew(s, m, 'cmd');
  s.mercs.unshift(m);
  if (s.lin && DS.linMkP) { var p = DS.linMkP(s, { k: 'm', sn: m.sn, n: m.n, sx: m.sx, type: m.type, g: m.g, m: m.id, gv: 1, cls: key }); p.cast = key; if (m.by != null) { p.by = m.by; p.ls = m.ls; } m.pid = p.id; }
  return m;
};

// ───────── ㉑ 새 시대를 연다: 옛 저장에서 사람 목록 → 한 사람을 새 판의 대장(1세)으로 ─────────
// DS.oldPeople(옛 저장 글 또는 객체) → [{ key, src:'hero'|'cmd'|'merc'|'young'|'coffin', name(화면), n, sn, sx, cls(지휘관·관 속 지휘관), type, g, t, q, v, nk, ttl, note }]
//   옛 저장은 고치지 않는다(복사본에서 읽는다). 대장 · 지휘관 열 · 용병 · 가계도의 산 사람(미성년 포함) · 관 속 사람. 같은 사람(가계도 번호)은 한 번만.
DS.oldPeople = function (raw) {
  var s = null; try { s = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(JSON.stringify(raw)); } catch (e) { s = null; }
  if (!s || typeof s !== 'object' || !s.chars || typeof s.chars !== 'object') return [];
  var P = (s.lin && s.lin.P) || {}, out = [], seen = {}, TR = DS.TRAITS, QK = DS.QUIRKS || {};
  function pidOf(x) { return x && x.pid && P[x.pid] ? +x.pid : 0; }
  function add(o, pid) { if (pid && seen[pid]) return; if (pid) seen[pid] = 1; o.key = o.src + ':' + (pid || o.id || out.length); if (!own(TR, o.t)) delete o.t; if (o.q && !own(QK, o.q)) delete o.q; o.g = o.g ? Math.max(1, Math.min(5, Math.round(+o.g))) : 0; o.sx = o.sx === 'f' ? 'f' : 'm'; o.n = String(o.n || '').slice(0, 8) || '이름 없는 이'; o.name = (o.ttl || DS.snName(o.sn, o.n)); out.push(o); }
  var hero = s.chars[s.hero];
  Object.keys(s.chars).forEach(function (id) {
    var c = s.chars[id]; if (!c || !DS.CLASSES[c.cls] || c.vac) return;
    var pid = pidOf(c), p = pid ? P[pid] : null, isH = c === hero;
    var n = isH ? (s.name || (p && p.n) || '대장') : p && p.gv ? p.n : (DS.CAST_NAME && DS.CAST_NAME[c.cls]) || (p && p.n) || DS.tierName(c.cls, DS.tierOfL(+c.L || 1));
    var sn = isH ? ((s.lin && s.lin.sur) || '') : p && p.gv ? p.sn : (DS.LIN_HOUSE && DS.LIN_HOUSE[c.cls]) || (p && p.sn) || '';
    add({ src: isH ? 'hero' : 'cmd', id: +id, n: n, sn: sn, sx: c.sx || (p && p.sx), cls: c.cls, ttl: isH ? c.name || '' : '', g: 0, note: DS.CLASSES[c.cls].name + ' ' + (DS.tierOfL(+c.L || 1)) + '단' }, pid);
  });
  (Array.isArray(s.mercs) ? s.mercs : []).forEach(function (m) {
    if (!m || !DS.MERCS[m.type]) return; var pid = pidOf(m);
    add({ src: 'merc', id: m.id, n: m.n, sn: m.sn || '', sx: m.sx, type: m.type, g: m.g, t: m.t, q: m.q, v: m.v || 0, nk: m.nk, ttl: m.ttl || '', note: ((DS.GRADES[m.g] || {}).name || '') + ' ' + DS.MERCS[m.type].name }, pid);
  });
  Object.keys(P).forEach(function (k) {
    var p = P[k]; if (!p || p.st !== 'young' || !p.ya || !DS.MERCS[p.ya.type]) return;
    add({ src: 'young', n: p.ya.n || p.n, sn: p.sn || '', sx: p.ya.sx || p.sx, type: p.ya.type, g: p.ya.g, t: p.ya.t, q: p.ya.q, v: p.ya.v || 0, ttl: p.ttl || '', note: '아이' }, +k);
  });
  ((s.coffins && Array.isArray(s.coffins.list)) ? s.coffins.list : []).forEach(function (r) {
    if (!r) return; var sn0 = r.snap || {}, cls = r.k === 'c' && DS.CLASSES[r.cls] ? r.cls : null, p = r.pid && P[r.pid];
    add({ src: 'coffin', n: (p && p.gv ? p.n : r.n) || r.name, sn: r.sn || '', sx: r.sx, cls: cls, type: cls ? null : sn0.type, g: cls ? 0 : sn0.g || r.g, t: sn0.t, q: sn0.q, v: sn0.v || 0, nk: sn0.nk, ttl: r.ttl || '', note: '관 속 — ' + (cls ? DS.CLASSES[cls].name : (DS.MERCS[sn0.type] || {}).name || '') }, +r.pid || 0);
  });
  var RK = { hero: 0, cmd: 1, merc: 2, young: 3, coffin: 4 };
  return out.map(function (o, i) { o._i = i; return o; }).sort(function (a, b) { return RK[a.src] - RK[b.src] || a._i - b._i; }).map(function (o) { delete o._i; return o; });
};
// 고른 사람의 병과: 옛 지휘관이면 그 병과(마스터면 그 묶음의 첫 병과), 용병이면 null (화면이 새 게임 병과 고르기로)
DS.oldCls = function (o) { if (!o || !o.cls || !DS.CLASSES[o.cls]) return null; var C = DS.CLASSES[o.cls]; return C.master ? DS.FAMILY[C.fam].members[0] : o.cls; };
// DS.newFromOld(사람, 병과, 옛 판 이름) → 새 저장. 가져오는 것: 이름·성·성별·종류·생김·특성·버릇·등급(없으면 희귀)·별명. 레벨 1 · 공훈 0 · 나이 18 · 장비/유물/혼인/가족 없음
DS.newFromOld = function (o, cls, from) {
  cls = cls || DS.oldCls(o) || 'inf';
  var s = DS.newSave(o.n || '대장', cls), h = s.chars[s.hero], ps = h.ps;
  if (o.type && DS.MERCS[o.type]) ps.type = o.type;
  ps.g = o.g >= 1 && o.g <= 5 ? o.g : DS.CAST_G;
  if (o.t && DS.TRAITS[o.t]) ps.t = o.t;
  if (o.q && DS.QUIRKS && DS.QUIRKS[o.q] && DS.quirkFits(ps.type, o.q)) ps.q = o.q;
  ps.v = Math.max(0, Math.min(3, +o.v || 0)); if (o.nk) ps.nk = o.nk;
  h.sx = o.sx === 'f' ? 'f' : 'm';
  var p = h.pid && s.lin.P[h.pid]; if (p) p.sx = h.sx;
  if (o.sn) { s.lin.sur = Array.from(String(o.sn)).slice(0, 6).join(''); if (p) p.sn = s.lin.sur; }
  s.lin.from = { n: o.name || o.n, src: o.src, note: o.note || '', ver: from || '' };      // 가계도 머리: 「옛 시대에서 온 이름」
  return s;
};

// ───────── 옛 저장 변환 (설계서 ②-2 · ②-3 · ②-4) ─────────
// ㉑ 이후 이 변환은 옛 저장에 쓰지 않는다 (DS.Save.read 가 v9 이하를 받지 않는다). 새 판 저장(v10)의 불변식 검사로 남는다 — 깨진 v10 을 바로잡는다.
// 표시(bn)가 아니라 불변식으로 건다 — 읽을 때마다 검사하고, 어긴 줄만 다시 변환한다(두 번 돌려도 같은 결과. 난수를 쓰지 않는다).
//   1) 대장 아닌 깃발 줄에 사람 칸(name pid sx by ls gr eld hp down vac nat cu lsc)이 없다
//   2) 산 k:'c' 사람은 대장의 pid 하나뿐이다
//   3) 깃발마다 든 사람은 0명 또는 1명 (둘이면 공훈 높은 한 명만 남기고 나머지는 따르게)
//   4) 산 사람의 sp 는 산 사람을 가리키고 서로 대칭이다
// fixSave 끝(linFix · lootFix · ageFix 뒤)에서 부른다. 돌려주는 것: 이번에 고친 것의 셈 { rows, made, back, ghosts, ... } (시험용 DS.lastBnFix)
var ROWK = ['name', 'pid', 'sx', 'by', 'ls', 'gr', 'eld', 'hp', 'down', 'vac', 'nat', 'cu', 'lsc', 'ps'];
function rowHasPerson(ch) { for (var i = 0; i < ROWK.length; i++) if (ch[ROWK[i]] !== undefined) return true; return false; }
function strip(ch) { if (ch.cu != null && +ch.cu > ch.L) ch.L = Math.min(DS.capL ? DS.capL(ch) : 100, Math.round(+ch.cu)); ROWK.forEach(function (k) { delete ch[k]; }); }
function headSet(s) {      // 대장 자리를 거친 사람 (연대기의 heir·kin 사슬 · into · 앉았던 자리 · 대장 집의 성으로 죽은 지휘관)
  var Lr = s.lin, P = Lr.P, out = {}, h = s.chars[s.hero], cur = h && h.pid && P[h.pid] ? h.pid : (h && h.vac ? h.vac.pid : 0), guard = 0, lg = Lr.log || [];
  function mark(id) { if (!id || out[id] || !P[id]) return false; out[id] = 1; var q = P[id]; (q.fu instanceof Array ? q.fu : []).forEach(function (f) { var y = P[f]; if (y && (y.cls === 'inf' || y.cls === 'mag' || y.sn === Lr.sur)) out[f] = 1; }); return true; }
  while (cur && guard++ < 400) {
    if (!mark(cur)) break;
    var prev = 0; for (var i = lg.length - 1; i >= 0; i--) { var e = lg[i]; if (e && (e.t === 'heir' || e.t === 'kin') && e.a === cur && e.b) { prev = e.b; break; } }
    cur = prev;
  }
  for (var k in P) { var q = P[k]; if (q.seat && q.seat === s.hero) mark(q.id); if (q.htl || q.hand) mark(q.id); if (q.k === 'c' && q.st !== 'live' && q.sn === Lr.sur && q.sn !== (DS.LIN_HOUSE[q.cls] || '')) mark(q.id); }
  return out;
}
function startS(s, p) { var lg = s.lin.log || []; for (var i = 0; i < lg.length; i++) { var e = lg[i]; if (e && e.a === p.id && (e.t === 'heir' || e.t === 'kin' || e.t === 'revive' || e.t === 'fuse')) return +e.s || 0; } return +p.born || 0; }
function retro(s, p) { var B = DS.BN; return Math.max(0, Math.min(B.retroCap, B.retro * (scnN(s) - startS(s, p)))); }
function hashName(id) { return DS.MERC_NAMES[Math.floor(hsh(id, 431, 3) * DS.MERC_NAMES.length) % DS.MERC_NAMES.length]; }
function hashTrait(id) { var keys = Object.keys(DS.TRAITS); return keys[Math.floor(hsh(id, 433, 5) * keys.length) % keys.length]; }
function isCast1(s, p, cls) { return !!p && (p.gen || 1) === 1 && !p.gv && !p.kin && !p.fu && !!(DS.CAST_NAME && DS.CAST_NAME[cls]) && !p.snap; }
// 사람 분류 다섯 갈래 → 부대원이 될 때의 칸
function branchOf(s, p, cls, ch) {
  var P = s.lin.P, o = null;
  if (p.fu instanceof Array && p.fu.length) {      // 합일체: 수명을 준 이 = 묶인 P 가운데 by/ls 가 같은 이 → 없으면 fu 의 첫 번호
    var donor = null; p.fu.forEach(function (f) { var q = P[f]; if (!donor && q && q.by != null && q.by === p.by && q.ls === p.ls) donor = q; });
    donor = donor || P[p.fu[0]];
    if (donor && donor !== p) { o = branchOf(s, donor, donor.cls || cls, null); o.donor = donor.id; return o; }
  }
  if (p.snap && p.snap.type && DS.MERCS[p.snap.type]) {      // 용병이었다가 이은 후계
    var sn = p.snap; o = { n: p.n || hashName(p.id), sn: p.sn || '', type: sn.type, g: Math.max(1, Math.min(5, +sn.g || 2)), t: own(DS.TRAITS, sn.t) ? sn.t : hashTrait(p.id), v: +sn.v || 0, x: +sn.x || 0, k: +sn.k || 0, b: +sn.b || 0 };
    ['q', 'bk', 'sv', 's', 'nk', 'ttl', 'pk'].forEach(function (k) { if (sn[k] != null) o[k] = sn[k]; });
    if (o.q != null && !(DS.QUIRKS && own(DS.QUIRKS, o.q))) delete o.q;
    if (o.s != null && !own(DS.SKILLS, o.s)) delete o.s;
    return o;
  }
  if (isCast1(s, p, cls)) return { n: DS.CAST_NAME[cls], sn: DS.LIN_HOUSE[cls] || p.sn || '', type: DS.CAST_KIND[cls], g: DS.CAST_G, t: DS.CAST_TRAIT[cls], v: Math.floor(hsh(p.id, 437, 7) * 4) % 4, x: 0, k: 0, b: 0, cast: cls };
  // 먼 친척 · 그 밖: ⑥ 표의 그 병과 줄 · 고급 · 번호 해시 특성
  return { n: p.gv && p.n ? p.n : hashName(p.id), sn: p.sn || DS.LIN_HOUSE[cls] || '', type: DS.CAST_KIND[cls] || (DS.CLASSES[cls] ? DS.baseMercTypes(cls)[0] : 'm_sword'), g: 2, t: hashTrait(p.id), v: Math.floor(hsh(p.id, 439, 9) * 4) % 4, x: 0, k: 0, b: 0 };
}
function personMerc(s, p, br, ch) {      // 사람 한 줄 → 부대원 (번호는 mnid 로 새로)
  var m = { id: s.mnid++, type: br.type, g: br.g, o: 0, hp: 1, n: br.n, v: br.v, t: br.t, x: br.x, k: br.k, b: br.b, sn: br.sn || p.sn || '', sx: p.sx === 'f' ? 'f' : 'm', pid: p.id };
  ['q', 'bk', 'sv', 's', 'nk', 'ttl', 'pk'].forEach(function (k) { if (br[k] != null) m[k] = br[k]; });
  if (br.cast) { m.cast = br.cast; m.lk = 1; }
  if (ch) { m.hp = ch.hp == null ? 1 : Math.max(0.01, Math.min(1, +ch.hp || 1)); if (ch.gr) m.gr = ch.gr; if (ch.eld) m.eld = 1; if (ch.by != null) { m.by = ch.by; m.ls = ch.ls; } }
  if (m.by == null && p.by != null && isFinite(+p.by)) { m.by = +p.by; m.ls = +p.ls || 70; }
  if (m.by == null && DS.ageNew && s.cal) DS.ageNew(s, m, 'cmd', s.cal.t);      // 나이를 모르는 이: 번호 해시 (결정적)
  p.k = 'm'; p.c = 0; p.m = m.id; p.st = 'live'; p.type = m.type; p.g = m.g; p.n = m.n; p.sn = m.sn; p.gv = 1;
  if (br.cast) p.cast = br.cast;
  if (m.by != null) { p.by = m.by; p.ls = m.ls; }
  return m;
}
function ghostP(s, p) {      // 옛 판이 새 저장을 읽으며 만든 빈 사람 (이름·내력·짝·자식 없음)
  if (!p || p.gv || p.snap || p.sp || p.lsp || p.fu || p.kin || (p.gen || 1) > 1) return false;
  var P = s.lin.P; for (var k in P) if ((P[k].pa || []).indexOf(p.id) >= 0) return false;
  return true;
}
// 대장이라는 사람 한 줄 (ps): 1세면 공훈 소급 + 병과 고정 특성, 후계였으면 그 갈래
DS.bnHeroPs = function (s, ch, p) {
  var cls = ch.cls, ps;
  if (p && p.snap && p.snap.type && DS.MERCS[p.snap.type]) { var b = branchOf(s, p, cls, ch); ps = { type: b.type, g: b.g, t: b.t, v: b.v, x: b.x, k: b.k, b: b.b }; ['q', 'bk', 'sv', 's', 'nk', 'pk'].forEach(function (k) { if (b[k] != null) ps[k] = b[k]; }); }
  else if (p && (p.kin || (p.gen || 1) > 1)) ps = { type: DS.CAST_KIND[cls] || 'm_sword', g: 2, t: hashTrait(p.id), v: Math.floor(hsh(p.id, 439, 9) * 4) % 4, x: 0, k: 0, b: 0 };
  else ps = { type: DS.CAST_KIND[cls] || 'm_sword', g: DS.CAST_G, t: DS.heroTrait(cls), v: 0, x: 0, k: 0, b: 0 };
  if (p) ps.x += retro(s, p);
  return ps;
};
function fixPs(ps) {
  if (!ps || typeof ps !== 'object' || Array.isArray(ps)) return null;
  if (!own(DS.MERCS, ps.type)) ps.type = 'm_sword';
  ps.g = Math.max(1, Math.min(5, Math.round(+ps.g || 1)));
  if (!own(DS.TRAITS, ps.t)) delete ps.t;
  ps.x = Math.max(0, +ps.x || 0); if (ps.L != null) { ps.L = DS.pL(ps); ps.exp = Math.max(0, +ps.exp || 0); } ps.k = Math.max(0, Math.round(+ps.k || 0)); ps.b = Math.max(0, Math.round(+ps.b || 0)); ps.v = Math.max(0, Math.min(3, Math.round(+ps.v || 0)));
  if (ps.q != null && !(DS.QUIRKS && own(DS.QUIRKS, ps.q))) delete ps.q;
  if (ps.s != null && !own(DS.SKILLS, ps.s)) delete ps.s;
  return ps;
}
function v10Of(s) { var h = s.chars[heroId(s)]; return !!(h && h.ps) || (s.mercs || []).some(function (m) { return m.h; }); }
DS.bnFix = function (s, wasBn) {
  var R = { rows: 0, made: 0, back: 0, dead: 0, ghosts: 0, bearers: 0, kc: 0, sp: 0, rewed: 0, hb: 0 };
  DS.lastBnFix = R;
  if (!s || !s.chars || !s.lin || !s.lin.P) return s;
  if (!Array.isArray(s.mercs)) s.mercs = [];
  var Lr = s.lin, P = Lr.P, hid = heroId(s), hero = s.chars[hid], front = [], at = '', z = DS.ZONES && DS.ZONES[s.zone];
  if (z && !z.town) at = z.name;
  // ⑮ 옛 판의 합일 마스터: 원래 세(네) 깃발로 되돌린다 (레벨 그대로 — 8단이면 8단, 9단이면 9단). 합일체가 살아서 들고 있으면 대표 깃발 = 수명을 준 이의 원래 깃발
  var unf = [];
  DS.charList(s).forEach(function (ch) {
    if (!DS.CLASSES[ch.cls].master || !DS.unfuse) return;
    var p = ch.pid && P[ch.pid] && P[ch.pid].c === ch.id ? P[ch.pid] : null, rep = null;
    if (p && ch.id !== hid && p.fu instanceof Array && p.fu.length) { var dn = null; p.fu.forEach(function (f) { var q = P[f]; if (!dn && q && q.by != null && q.by === p.by && q.ls === p.ls) dn = q; }); dn = dn || P[p.fu[0]]; if (dn) rep = dn.cls; }
    var r = DS.unfuse(s, ch, rep); if (r) { unf.push(r); R.unfused = (R.unfused || 0) + 1; }
  });
  var firstTime = !v10Of(s), v10 = !!(hero && hero.ps) || s.mercs.some(function (m) { return m.h; });      // 새 모양의 흔적 (옛 저장에는 ps·h 가 없다) — 표시(bn)가 틀려도 이것으로 가른다
  // 1) 대장 아닌 깃발 줄 → 사람 줄로
  DS.charList(s).forEach(function (ch) {
    if (ch.id === hid || !rowHasPerson(ch)) return;
    R.rows++;
    var p = ch.pid && P[ch.pid] && P[ch.pid].c === ch.id && P[ch.pid].st === 'live' ? P[ch.pid] : null, cur = DS.bearer(s, ch);
    if (ch.vac) { if (p) { p.c = 0; } strip(ch); return; }      // 깃발마다의 후계 의식은 없어졌다: 비어 있던 자리는 빈 깃발로 (고인은 이미 기록에 있다)
    if (ch.down) {      // 싸움 중에 꺼진 판: 든 사람의 죽음은 그 자리에서 확정 (따르는 이와 같은 길)
      if (p) {
        var nat = !!ch.nat, why = nat ? (DS.AGE_NAT || '천수를 누림') : '전사';
        p.snap = { cls: ch.cls, L: ch.L, w: ch.w || null, a: ch.a || null };
        p.st = 'dead'; p.c = 0; p.seat = ch.id; if (ch.by != null) { p.by = ch.by; p.ls = ch.ls; p.age = DS.ageOf ? DS.ageOf(s, ch) : null; }
        p.d = { at: at, why: why, s: scnN(s), tm: Math.round(s.time || 0), fr: 1 };
        DS.linLogE(s, 'death', p.id, 0, { at: at, why: why, k: 'c', cls: ch.cls });
        if (p.sp && P[p.sp]) { var q = P[p.sp]; p.lsp = q.id; q.lsp = p.id; q.sp = 0; p.sp = 0; DS.linLogE(s, 'part', q.id, p.id, { why: '사별' }); }
        R.dead++;
      }
      strip(ch); return;
    }
    if (cur) { if (p && v10 && ghostP(s, p)) { p.st = 'gone'; p.c = 0; R.ghosts++; } else if (p) { p.c = 0; var gm = personMerc(s, p, branchOf(s, p, ch.cls, ch), ch); front.push(gm); R.made++; } strip(ch); return; }      // 이미 든 사람이 있다(왕복): 옛 판이 만든 유령은 걷는다
    if (!p) {
      if (v10) { strip(ch); return; }      // 새 모양 저장에서 사람 없이 비어 있던 깃발
      if (!ch.pid && DS.linMkP) { p = DS.linMkP(s, { k: 'c', sn: DS.LIN_HOUSE[ch.cls] || '로저스', n: DS.tierName(ch.cls, DS.tierOfL(ch.L)), sx: ch.sx === 'f' ? 'f' : 'm', cls: ch.cls, L: ch.L, c: ch.id }); }      // 가계도 전의 저장(2.x): 깃발마다 사람이 있었다
      if (!p) { strip(ch); return; }
    }
    if (v10 && ghostP(s, p)) { p.st = 'gone'; p.c = 0; R.ghosts++; strip(ch); return; }      // 옛 판이 새 저장을 읽으며 빈 깃발에 만든 유령
    var br = branchOf(s, p, (p.fu && p.fu.length ? (P[p.fu[0]] || {}).cls : null) || ch.cls, ch), donor = br.donor ? P[br.donor] : null;
    br.x = (br.x || 0) + retro(s, p);
    if (br.cast && (s.mercs.some(function (x) { return x.cast === br.cast; }) || front.some(function (x) { return x.cast === br.cast; }))) delete br.cast;      // 열쇠는 한 사람만
    var m = personMerc(s, p, br, ch); m.o = ch.id; m.h = 1; front.push(m); R.made++;
    if (p.fu instanceof Array && p.fu.length) {      // 합일체가 살아서 든 마스터 깃발: 수명을 준 이 말고는 fused → live 로 제 이름으로 돌아와 그 깃발 밑 빈 칸에 (못 서면 막사 — 따르던 이의 자리는 그대로)
      p.fu.forEach(function (f) {
        var q = P[f]; if (!q || q === donor || q.st !== 'fused') return;
        var b2 = branchOf(s, q, q.cls || ch.cls, null); b2.x = (b2.x || 0) + retro(s, q);
        if (b2.cast && (s.mercs.some(function (x) { return x.cast === b2.cast; }) || front.some(function (x) { return x.cast === b2.cast; }))) delete b2.cast;
        var r = personMerc(s, q, b2, null), pp = DS.MERCS[r.type] && DS.MERCS[r.type].pop || 1, home = flagFree(q.cls);
        if (home) { r.o = home.id; r.h = 1; }      // ⑮ 각자 원래 깃발의 든 사람으로
        else { r.o = 0; r.sb = 1; }      // 2.2.0: 막사로 (DS.mercTidy 가 자리를 맞춘다)
        front.push(r); R.back++;
      });
    }
    strip(ch);
  });
  // ⑮ 대장이 낀 합일: 대장 아닌 구성원도 각자 원래 깃발의 든 사람으로 돌아온다 (한 번)
  var hp0 = hero && hero.pid && P[hero.pid];
  if (firstTime && hp0 && hp0.fu instanceof Array) hp0.fu.forEach(function (f) {
    var q = P[f]; if (!q || q.st !== 'fused' || q.cls === hero.cls) return;
    var home = flagFree(q.cls); if (!home) return;
    var b3 = branchOf(s, q, q.cls, null); b3.x = (b3.x || 0) + retro(s, q);
    if (b3.cast && (s.mercs.some(function (x) { return x.cast === b3.cast; }) || front.some(function (x) { return x.cast === b3.cast; }))) delete b3.cast;
    var r3 = personMerc(s, q, b3, null); r3.o = home.id; r3.h = 1; front.push(r3); R.back++;
  });
  function flagFree(cls) { var c = DS.charList(s).filter(function (x) { return x.cls === cls && x.id !== hid; })[0]; if (!c || DS.bearer(s, c) || front.some(function (x) { return x.h && x.o === c.id; })) return null; return c; }
  if (front.length) s.mercs = front.concat(s.mercs);
  // 3) 든 사람은 깃발마다 0명 또는 1명 · 대장 깃발에는 부대원이 들지 않는다 · 깃발 없이 h 만 남은 줄은 따르는 이/막사로
  var seen = {};
  s.mercs.slice().sort(function (a, b) { return (b.x || 0) - (a.x || 0) || a.id - b.id; }).forEach(function (m) {
    if (!m.h) return;
    if (!m.o || !s.chars[m.o] || m.o === hid || seen[m.o]) { delete m.h; R.bearers++; return; }
    seen[m.o] = 1; m.h = 1;
  });
  // 2) 산 k:'c' 는 대장의 pid 하나뿐
  var hp = hero && hero.pid && P[hero.pid] ? P[hero.pid] : null;
  for (var k in P) {
    var q = P[k]; if (q.st !== 'live' || q.k !== 'c' || q === hp) continue;
    R.kc++;
    var e = q.m ? mercOf(s, q.m) : null;
    if (e && e.pid === q.id) { q.k = 'm'; q.c = 0; }
    else if (q.c && s.chars[q.c] && s.chars[q.c].id === hid && hero && !hero.pid && !hero.vac) { hero.pid = q.id; hp = q; }
    else { q.st = 'gone'; q.c = 0; }
  }
  // 4) 산 사람의 sp 는 산 사람을 가리키고 서로 대칭
  var live = function (x) { return !!x && (x.st === 'live' || x.st === 'young'); };
  for (k in P) { var a = P[k]; if (!a.sp) continue; var b = P[a.sp]; if (!live(a) || !live(b) || b.sp !== a.id) { if (b && a.sp) a.lsp = a.sp; a.sp = 0; R.sp++; } }
  // 대장 줄: 사람 한 줄(ps)
  if (hero && !hero.vac) {
    if (!hero.ps || !fixPs(hero.ps)) { hero.ps = DS.bnHeroPs(s, hero, hp); }
  } else if (hero && hero.ps) fixPs(hero.ps);
  if (hero && hero.ps && hero.ps.t === undefined) hero.ps.t = DS.heroTrait(hero.cls);
  // 대장이 합일로 잃은 혼인: 합일체 P 와 그 상대가 둘 다 홀로 살아 있을 때만 다시 부부로 (한 번)
  if (firstTime && hp && hp.fu instanceof Array && !hp.sp) {
    var lg = Lr.log || [], mem = {}; hp.fu.forEach(function (f) { var y = P[f]; if (y && (y.cls === 'inf' || y.cls === 'mag' || y.sn === Lr.sur)) mem[f] = 1; });
    for (var i = lg.length - 1; i >= 0; i--) {
      var ev = lg[i]; if (!ev || ev.t !== 'part' || !ev.x || ev.x.why !== '합일' || !mem[ev.b]) continue;
      var sp = P[ev.a]; if (!sp || sp.st !== 'live' || sp.sp || !(sp.m && mercOf(s, sp.m))) break;
      hp.sp = sp.id; sp.sp = hp.id; Lr.bd[Math.min(hp.id, sp.id) + ':' + Math.max(hp.id, sp.id)] = { b: 0, h: hp.id };
      DS.linLogE(s, 'wed', hp.id, sp.id, { re: 1 }); R.rewed++; break;
    }
  }
  // 3.2 에서 이미 용병이 되어 돌아온 1세 본인 · 죽은 1세: 이름(CAST_NAME)과 열쇠를 돌려준다
  if (firstTime) {
    for (k in P) {
      var c1 = P[k], cls = c1.cls;
      if (!isCast1(s, c1, cls) || c1.sn !== (DS.LIN_HOUSE[cls] || c1.sn) || (c1.seat && c1.seat === hid) || c1.n === s.name || c1 === hp) continue;
      c1.n = DS.CAST_NAME[cls]; c1.gv = 1; c1.cast = cls;
      var me = c1.st === 'live' && c1.m ? mercOf(s, c1.m) : null;
      if (me && !s.mercs.some(function (x) { return x.cast === cls; })) { me.n = c1.n; me.sn = c1.sn; me.cast = cls; me.lk = 1; }
    }
  }
  // 핏줄 hb: 대장 자리를 거친 사람의 친자 (입양 아님)
  if (firstTime) {
    var H = headSet(s);
    for (k in P) { var y = P[k]; if (y.ad || y.hb) continue; if ((y.pa || []).some(function (x) { return H[x]; })) { y.hb = 1; R.hb++; } }
    if (hp) hp.hs = hp.hs || (Lr.hs || hero.cls);
  }
  if (!Lr.hs || !DS.CLASSES[Lr.hs]) Lr.hs = hero ? hero.cls : 'inf';
  if (Lr.gb && (typeof Lr.gb !== 'object' || typeof Lr.gb.b !== 'string' || !isFinite(+Lr.gb.o))) delete Lr.gb;
  if (Lr.bd) Object.keys(Lr.bd).forEach(function (k) { var b = Lr.bd[k]; if (b && (b.w == null || !isFinite(+b.w))) { b.w = Math.round((s.cal && s.cal.t) || 0); b.y = 0; } else if (b) b.y = Math.max(0, Math.round(+b.y || 0)); });      // ⑲ 옛 부부: 혼인한 때를 모르면 지금부터 센다
  if (Lr.c2 != null && (typeof Lr.c2 !== 'object' || Array.isArray(Lr.c2))) delete Lr.c2;      // ⑱ 아홉 집의 다음 사람 기다림
  if (Lr.hw != null && (typeof Lr.hw !== 'object' || Array.isArray(Lr.hw))) delete Lr.hw;      // 2.1.0: 맹주 밖 가문의 자동 후계 기다림
  if (Lr.hw) Object.keys(Lr.hw).forEach(function (k) { var w = Lr.hw[k]; if (!w || typeof w !== 'object' || !s.chars[+k] || +k === +s.hero) delete Lr.hw[k]; else { w.pre = Math.max(1, Math.min(100, Math.round(+w.pre || 1))); w.g = Math.max(1, Math.min(5, Math.round(+w.g || 2))); } });
  if (Lr.c2) Object.keys(Lr.c2).forEach(function (k) { if (!DS.CAST_NAME || !DS.CAST_NAME[k] || !Lr.c2[k] || typeof Lr.c2[k] !== 'object') delete Lr.c2[k]; });
  if (Lr.hn != null && !(typeof Lr.hn === 'string' && Lr.hn)) delete Lr.hn;      // ⑯ 문패
  if (Lr.ca != null && (typeof Lr.ca !== 'object' || Array.isArray(Lr.ca))) delete Lr.ca;      // r22: 맹주가 된 아홉 집 { 병과: 판 }
  if (Lr.ca) Object.keys(Lr.ca).forEach(function (k) { if (!DS.CAST_NAME || !DS.CAST_NAME[k]) delete Lr.ca[k]; });
  if (Lr.hns != null) { if (!Array.isArray(Lr.hns)) delete Lr.hns; else Lr.hns = Lr.hns.filter(function (h) { return h && typeof h.n === 'string'; }).slice(-30); }
  delete Lr.stk;      // 연패 면제 세기: 쓸 데 없어졌다
  if (DS.potFix) DS.potFix(s);      // ⑭-4: 옛 아이의 잠재력 (부모 기록으로 한 번)
  // 열쇠(cast)는 한 사람만
  var ck = {}, chk = DS.castHero ? DS.castHero(s) : ''; if (chk) ck[chk] = 1;      // r22: 대장이 쥔 열쇠가 먼저
  s.mercs.forEach(function (m) { if (!m.cast) return; if (!DS.CAST_NAME || !DS.CAST_NAME[m.cast] || ck[m.cast]) delete m.cast; else ck[m.cast] = 1; });
  if (DS.mercTidy) DS.mercTidy(s);
  DS.bnCap(s);
  if ((R.rows || R.made) && DS.ghTouch) DS.ghTouch(s);      // 장비 내력의 손 이름: 깃발 줄의 사람이 이름을 찾은 뒤로 (두 번 읽어 같게)
  s.bn = 1;
  return s;
};
// 거대한 배열 막기 (300): 가계·깃발에 걸린 줄(든 사람 h · 열쇠 cast · 가계도 pid · 잠금 lk · 깃발 밑 o)은 앞으로 모으고, 자를 때는 막사 일반 줄만 (save.js fixSave 와 같은 규칙 — 처음 읽을 때 자르므로 두 번 읽어도 같다)
//   한도 300 은 깃발을 든 사람(h)을 세지 않는다 — 3.x 에서 깃발 줄에 있던 아홉이 부대원 줄로 옮겨 와도 옛 막사 사람이 밀려 잘리지 않게
DS.bnCap = function (s, max) {
  max = max || 300; if (!s.mercs) return 0;
  var nb = s.mercs.filter(function (m) { return !m.h; }).length; if (nb <= max) return 0;
  var key = function (m) { return !!(m.h || m.cast || m.pid || m.lk || m.o); }, pri = s.mercs.filter(key), gen = s.mercs.filter(function (m) { return !key(m); }), n0 = s.mercs.length, bear = pri.filter(function (m) { return m.h; }).length;
  s.mercs = pri.concat(gen).slice(0, Math.max(max + bear, pri.length));
  return n0 - s.mercs.length;
};

// ───────── r15 전투력: 유닛 사양 하나 → 숫자 하나 (결정적) ─────────
// 버팀(EHP) × 때림(OFF) 의 기하평균 × 30. 둘 다 능력치에 정비례하므로 같은 % 얹힘은 전투력에도 같은 % 로 붙는다.
//   EHP = 최대 HP × (1 + (방어 0.6 + 마방 0.4) / 80) × (구사일생 1.1)
//   OFF = max(공격, 마공) × 기본기 배율 × (1 + 치명 × 0.5) × 행동 회복 / 10 × 사거리(1 + 0.06 × min(4, 최대 사거리 − 1)) × (1 + 0.04 × 기술 수) × (1 + 흡혈 × 0.5) × (쌍격 1.3) × (마법 1.15 · 성직 1.1) + 치유 몫
DS.POW = { k: 30, dRef: 80, rng: 0.06, sk: 0.04 };
DS.power = function (u) {
  if (!u) return 0;
  var P = DS.POW, hp = +u.mhp || +u.hp || 0, D = (+u.def || 0) * 0.6 + (+u.res || 0) * 0.4;
  var ehp = hp * (1 + D / P.dRef) * (u.survX || u.trait === 'survivor' ? 1.1 : 1);
  var main = Math.max(+u.atk || 0, +u.mag || 0), r = u.rng ? +u.rng[1] || 1 : 1, sk = (u.skills || []).length;
  var off = main * (u.basic || 1) * (1 + (u.crit == null ? 0.06 : u.crit) * 0.5) * (u.spd || 10) / 10 * (1 + P.rng * Math.min(4, Math.max(0, r - 1))) * (1 + P.sk * Math.min(6, sk)) * (1 + (u.drain || 0) * 0.5) * (u.twin || u.passive === 'twin' ? 1.3 : 1);
  if (u.heal) off += main * u.heal * 0.5;
  if (u.trait === 'brave') off *= 1.05;
  if (u.dtype === 'magic') off *= 1.15;      // 마공은 적의 마방(방어보다 낮다)으로 받는다
  else if (u.kind === 'holy' && !u.heal) off *= 1.1;      // 치유 기술을 지닌 깃발
  return Math.max(0, Math.round(Math.sqrt(ehp * off) * P.k));
};
// r44: 능력치 합 = 최대 HP + 주 공격(공격·마공 중 큰 쪽) + 방어 + 마방 — 사람 창·모집 카드에 보이는 숫자 (전투에 쓰는 유닛 사양 그대로라 등급 배율이 그대로 담긴다)
DS.statTotal = function (u) { return u ? Math.round((+u.mhp || +u.hp || 0) + Math.max(+u.atk || 0, +u.mag || 0) + (+u.def || 0) + (+u.res || 0)) : 0; };
// 깃발 유닛의 전투력 (who = 든 사람, 없으면 지금 든 사람) · 따르는 이의 전투력
DS.flagPower = function (s, ch, who) { if (!ch) return 0; var hero = ch.id === heroId(s); if (who === undefined) who = DS.bearer(s, ch); return who || hero ? DS.power(DS.cmdSpec(ch, hero, who || null)) : 0; };
DS.mercPow = function (s, m) { var ch = m && m.o && s.chars[m.o]; if (!ch || m.h) return 0; return DS.power(DS.mercSpec(ch, m)); };
// 깃발 한 개의 합 (든 사람 + 따르는 이) · 출전 셋의 합 = 부대 전투력
DS.cardPower = function (s, ch) { if (!ch || ch.down || ch.vac) return 0; var b = ch.id === heroId(s) ? ch.ps : DS.bearer(s, ch); if (!b) return 0; var n = DS.flagPower(s, ch, b); DS.mercsOf(s, ch.id).forEach(function (m) { n += DS.power(DS.mercSpec(ch, m)); }); return n; };      // 2.2.0: 맹주 가문은 어른 가문원까지
DS.partyPower = function (s) { var n = 0; (s.party || []).forEach(function (id) { n += DS.cardPower(s, s.chars[id]); }); return n; };
// 전투력 내역: 층을 하나씩 얹으며 늘어난 몫. [{ k, n(몫), t(꼬리) }] + 합. 마지막 줄의 몫은 나머지(노년·비탄)라 합이 늘 맞는다
function plain(o, drop) { var c = {}, k; for (k in o) if (own(o, k) && drop.indexOf(k) < 0) c[k] = o[k]; return c; }
DS.powerParts = function (s, ch, who) {
  if (!ch) return null;
  var hero = ch.id === heroId(s), t = DS.tierOfL(ch.L), ref = plain(ch, ['eld', 'gr']); DS.stdGear(ref, t);
  var bare = plain(ch, ['eld', 'gr']), rows = [], last = 0;
  function step(k, n, tail) { rows.push({ k: k, n: n - last, t: tail || '' }); last = n; }
  step('base', DS.power(DS.cmdSpec(ref, false, null)), t + '단 Lv' + DS.lvOfL(ch.L));
  step('gear', DS.power(DS.cmdSpec(bare, false, null)), '');
  if (who) {
    var w0 = { id: who.id, n: who.n, ttl: who.ttl, g: 0 };      // r44: 공훈 줄을 먼저 떼어 본다 (g 0 = 배율 표의 0번 칸 = 1)
    step('merit', DS.power(DS.cmdSpec(bare, false, w0)), '가문 공훈 ' + DS.hName(DS.hRank(ch)) + ' +' + DS.hPct(ch) + '%');
    var lowLord = hero && DS.bnGMul(who) < DS.bnHeroGMul(who); w0.g = lowLord ? (DS.CAST_G || 3) : who.g; step('grade', DS.power(DS.cmdSpec(bare, false, w0)), ((DS.GRADES[who.g] || {}).name || '') + ' ×' + (hero ? DS.bnHeroGMul(who) : DS.bnGMul(who)).toFixed(2) + (lowLord ? ' (맹주 자리)' : ''));      // r44: 맹주 자리는 희귀 밑으로 치지 않는다
    w0.t = who.t; step('trait', DS.power(DS.cmdSpec(bare, false, w0)), who.t && DS.TRAITS[who.t] ? DS.TRAITS[who.t].name : '');
    if (!hero && who.type && DS.MERCS[who.type]) { w0.type = who.type; w0.cast = who.cast; step('native', DS.power(DS.cmdSpec(bare, false, w0)), DS.bnNative(ch.cls, who) ? '태생 맞음' : '태생 다름 (' + DS.nativeName(who) + ')'); }      // r27
  }
  step('age', DS.flagPower(s, ch, who || (hero ? ch.ps : null)) || last, '');
  return { rows: rows, total: last };
};
DS.mercParts = function (s, ch, m) {
  if (!ch || !m) return null;
  var ch0 = {}; for (var kk in ch) if (own(ch, kk)) ch0[kk] = ch[kk]; ch0.hx = 0;      // 가문 공훈을 뺀 가문
  var rows = [], last = 0, b = { id: m.id, type: m.type, n: m.n, g: 1, L: m.L, fz: m.fz };
  function step(k, n, tail) { rows.push({ k: k, n: n - last, t: tail || '' }); last = n; }
  step('base', DS.power(DS.mercSpec(ch0, b)), DS.MERCS[m.type].name + ' ' + DS.tierOfL(DS.pL(m)) + '단 Lv' + DS.lvOfL(DS.pL(m)) + (DS.mercMatch(ch, m) ? ', 병과 일치' : ''));
  b.g = m.g; step('grade', DS.power(DS.mercSpec(ch0, b)), (DS.GRADES[m.g] || {}).name || '');
  step('merit', DS.power(DS.mercSpec(ch, b)), '가문 공훈 ' + DS.hName(DS.hRank(ch)) + ' ×' + DS.hMul(ch));
  b.t = m.t; b.q = m.q; step('trait', DS.power(DS.mercSpec(ch, b)), [m.t && DS.TRAITS[m.t] ? DS.TRAITS[m.t].name : '', m.q && DS.QUIRKS && DS.QUIRKS[m.q] ? DS.QUIRKS[m.q].name : ''].filter(Boolean).join(', '));
  b.it = m.it; step('gear', DS.power(DS.mercSpec(ch, b)), m.it && DS.ITEMS[m.it] ? DS.ITEMS[m.it].name : '');
  step('age', DS.power(DS.mercSpec(ch, m)), '');
  return { rows: rows, total: last };
};
})();
// ───────── r16 person: 싸우는 단위는 「가문」이다 (화면 이름) ─────────
//   대장의 가문 = 지금 문패(DS.houseName, 문패가 바뀌면 이름도 바뀐다), 아홉 집과 합일한 가문 = 「<그 집 가문명> 가문」. 병과와 단은 아래 작은 줄.
//   DS.houseTitle(s, ch) → { name: '켄트 가문', sub: '보병 4단 Lv2', cls: '보병' }
//   DS.flagName(cls) 도 같은 이름을 돌려준다 (한 판에 한 병과의 단위는 하나 — 지금 판에서 그 단위를 찾아 대장 것인지 본다). 안쪽 이름(flag, bearer)은 그대로다.
(function () {
var DS = globalThis.DS, fn0 = DS.flagName;
function hid(s) { return s && s.hero; }
// 1.0.1: 합일 가문 이름 = 고른 세 가문 중 가주의 공훈이 가장 큰 가문의 이름 + 「대가문」. 합일하는 순간 save.fuU[].name 에 고정 (DS.fuse), 고르는 동안은 지금 1등을 미리 보여 준다
//   가주 공훈: 맹주 가문은 대장의 공훈(ps.x), 나머지는 그 가문 가주(DS.bearer)의 공훈. 가주가 없으면 맨 뒤. 같으면 먼저 고른 가문
function meritOf(s, ch) { if (!ch) return -1; return +(ch.hx || 0); }      // r42: 가문 공훈
DS.houseMerit = function (s, ch) { s = s || (DS.G && DS.G.save); return Math.max(0, meritOf(s, ch)); };
DS.idsTop = function (s, ids) {
  if (!s || !s.chars) return '';
  var best = null, bx = -2;
  (ids || []).forEach(function (id) { var ch = s.chars[id]; if (!ch) return; var x = meritOf(s, ch); if (x > bx) { bx = x; best = ch; } });
  return best ? String(houseOfCls(s, best.cls) || '').replace(/ 가문$/, '') : '';
};
function famTop(s, fam) {      // 옛 꼴: 정해진 묶음의 1등 (옛 저장을 옮길 때만)
  var F = DS.FAMILY[fam]; if (!F || !s || !s.chars) return '';
  return DS.idsTop(s, DS.charList(s).filter(function (c) { return F.members.indexOf(c.cls) >= 0; }).map(function (c) { return c.id; }));
}
DS.famTop = famTop;
// 그 깃발이 든 묶음의 이름 (「라니스터 대가문」). fam 문자열(옛 꼴)이면 그 묶음으로 오른 옛 판의 이름
DS.fuseHouse = function (s, key) {
  s = s || (DS.G && DS.G.save); if (!s || !DS.fuseUnions) return '';
  var U = DS.fuseUnions(s), u = null;
  if (typeof key === 'string' && DS.FAMILY[key]) { u = U.filter(function (x) { return x.fam === key; })[0]; if (!u) { var n = s.fuN && s.fuN[key] ? s.fuN[key] : famTop(s, key); return n ? n + ' 대가문' : ''; } }
  else u = DS.unionOf(s, key && key.id != null ? key.id : key);
  return u ? DS.unionName(s, u) : '';
};
function houseOfCls(s, cls) {      // 2.1.0: 가문 이름은 줄(병과)마다 하나 — 맹주가 선 가문도 같은 규칙 (연맹 이름은 DS.allyName)
  var CC = DS.CLASSES[cls]; if (CC && CC.master && CC.fam && s && s.chars) { var fh = DS.fuseHouse(s, CC.fam); if (fh) return fh; }
  var sn = DS.LIN_HOUSE && DS.LIN_HOUSE[cls];
  if (!sn && CC && CC.master && CC.fam && DS.FAMILY[CC.fam]) sn = DS.LIN_HOUSE[DS.FAMILY[CC.fam].members[0]];
  return sn && DS.houseOf ? DS.houseOf(sn) : '';
}
DS.flagHouse = function (s, cls) { s = s || (DS.G && DS.G.save); return houseOfCls(s, cls); };
DS.houseTitle = function (s, ch) {
  s = s || (DS.G && DS.G.save);
  if (!ch) return { name: '가문', sub: '', cls: '' };
  var C = DS.CLASSES[ch.cls] || {}, hero = !!(s && s.chars && ch.id === hid(s));
  var hn = houseOfCls(s, ch.cls);
  return { name: hn || (C.name ? C.name + ' 가문' : '가문'), sub: (C.name || '') + (ch.L ? ' ' + DS.tierOfL(ch.L) + '단 Lv' + DS.lvOfL(ch.L) : ''), cls: C.name || '' };
};
DS.flagTitle = DS.houseTitle;      // 앞서 쓰던 이름
DS.flagName = function (cls, s) { s = s || (DS.G && DS.G.save); var hn = houseOfCls(s, cls), C = DS.CLASSES[cls]; return hn || (C && !C.master ? C.name + ' 가문' : C ? fn0(cls) : '가문'); };      // r16 words: 판이 없을 때도 「보병 가문」 꼴 (옛 「보병 깃발」은 flagNameOld)
DS.flagNameOld = fn0;      // 병과로 부르던 옛 이름 (「보병 깃발」) — 이야기 대사 같은 곳이 쓸 일이 있으면
})();
