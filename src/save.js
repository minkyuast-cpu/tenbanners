// 열 개의 깃발 — 저장: 판 올림(이어받기), 손상 복구, 회귀자 기록
var DS = globalThis.DS = globalThis.DS || {};
// r36 (1.3.0): 배속은 1 · 1.5 · 2 — 소유자 「게임이 정신없다」. DS.spdOf = 가장 가까운 칸으로 (옛 2·3배속 저장은 2배속)
DS.SPEEDS = [1, 1.5, 2];
DS.spdOf = function (v) { v = +v || 1; return v >= 1.75 ? 2 : v >= 1.25 ? 1.5 : 1; };
(function () {
'use strict';
// 4.0 (㉑): 4.0 은 모두 새로 시작한다 — 새 키 tenbanners_v2 에 새 저장(v10)만 쓰고 읽는다. 옛 저장(tenbanners_v1 과 그 _bak · 클라우드 v9 문서 · 이사 코드)은
//   지우지도 바꾸지도 않고 읽기 전용으로 보관한다. 옛 저장에서는 사람 목록만 뽑아(DS.oldPeople) 그중 한 사람을 새 판의 대장(1세)으로 데려올 수 있다(DS.newFromOld).
//   v9 이하를 v10 으로 옮기는 판 올림은 하지 않는다 (MIGRATE 2~8 은 남아 있지만 read/peek 이 v10 미만을 받지 않는다).
// r42 (2.0.0 「새 시대」): 사람마다 단·레벨, 가문 공훈 — 다시 모두 새로 시작한다. 새 키 tenbanners_v3 에 v11 만 쓰고 읽는다.
//   옛 저장(tenbanners_v2 · tenbanners_v1 과 그 _bak, 클라우드 saves2 · saves 문서)은 지우지도 바꾸지도 않는다 — 처음 한 번 「새 시대가 열렸다」 안내만.
var KEY = 'tenbanners_v4', OLD = 'tenbanners_v3', OLD1 = 'tenbanners_v2', META = 'tenbanners_meta', LEGACY = 'darksaver_muta_v1';
DS.SAVE_V = 13;      // 2.2.0 「한 사람 한 사람」: v12 → v13 판 올림 (가솔·막사가 없어졌다 — MIGRATE[12]). 키·클라우드 문서(tenbanners_v4 · saves4)는 그대로
DS.SAVE_MIN = 12;    // 이어 할 수 있는 가장 옛 판 (2.1: 다시 새로 시작한 v12)
//      // 저장 구조 번호. 2 = 2.0.0, 3 = 2.1.0, 4 = 2.2.0, 5 = 2.3.0, 6 = 2.4.0, 7 = 2.5.0, 8 = 2.6.0, 9 = 2.7.0, 10 = 4.0.0 (부대원 + 깃발)
function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function parse(t) { try { return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }      // 표에 정말 있는 이름인가 ('constructor' 같은 이름에 속지 않는다)
function int(v) { return typeof v === 'number' && isFinite(v) && v === Math.floor(v); }
// 새 판 저장 방호 (4.0 대비): 지금 SAVE_V 보다 큰 v 의 저장은 읽지도 덮어쓰지도 않는다 — 옛 판이 모르는 칸을 fixSave 가 지워 버리기 때문
DS.NEWER_MSG = '더 최신 버전의 저장입니다. 새로 고침 하세요';
function newerOf(x) {      // x = 저장 글 또는 저장 객체 → 그 판 번호(더 새 판일 때만), 아니면 0
  var s = typeof x === 'string' ? parse(x) : x, v = s && typeof s === 'object' ? +s.v : 0;
  if (s && typeof s === 'object' && needNewer(s.need)) return Math.max(int(v) ? v : 0, DS.SAVE_V) + 1;      // 3.3.0: s.need = 이 저장을 읽을 최소 판 — 지금 판보다 새면 「더 새 판의 것」으로 멈춘다 (SAVE_V 는 그대로)
  return int(v) && v > DS.SAVE_V ? v : 0;
}
function vnum(t) { var m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(t || '')); return m ? (+m[1]) * 1e6 + (+m[2]) * 1e3 + (+m[3]) : 0; }
function needNewer(need) { return !!need && vnum(need) > vnum(DS.BUILD || DS.VERSION || '0.0.0'); }      // 1.0.0 부터: 공개 버전과 따로 내부 빌드 번호로 견준다
DS.saveNeedNewer = needNewer;
// 저장 구조 번호. 번호가 빠졌거나 엉뚱하면 모양을 보고 짐작한다 — 지금 판의 저장을 2.0 저장으로 잘못 보면 용병과 장비를 새로 만들어 버린다.
function verOf(s) {
  var v = +s.v, id, c;
  if (int(v) && v >= DS.SAVE_MIN && oldShape(s)) return 9;      // r15 bug: 꼬리표(v)만 10 인 옛 진행은 옛 판으로 본다 — 4.0 은 합일 마스터 줄을 만들지 않고, 대장 줄에는 늘 사람 한 줄(ps)이 있다
  if (int(v) && v >= 2) return v;
  var cur = s.bn === 1 ? DS.SAVE_MIN : 9;      // 4.0: 새 구조 표시가 없으면 3.x 모양(9)으로 본다 — 사람 옮기기는 어느 쪽이든 DS.bnFix 의 불변식이 한다
  if (Array.isArray(s.mercs) || (s.gear && typeof s.gear === 'object')) return cur;
  for (id in s.chars) { c = s.chars[id]; if (c && (typeof c.w === 'string' || typeof c.a === 'string')) return cur; }
  return 2;
}
// 옛 판(3.x) 모양의 흔적: 합일 마스터 줄(4.0 의 합일은 병과를 그대로 두고 L71 로 올린다) · 사람 한 줄(ps) 없는 대장(비어 있는 대장 자리는 빼고)
function oldShape(s) {
  if (!s.chars || typeof s.chars !== 'object') return false;
  for (var id in s.chars) { var c = s.chars[id]; if (c && DS.CLASSES && own(DS.CLASSES, c.cls) && DS.CLASSES[c.cls].master) return true; }
  var h = s.chars[s.hero]; return !!(h && typeof h === 'object' && !h.vac && !h.ps);
}
// 판 올림 단계가 넘어지지 않게, 모양이 어긋난 칸만 미리 걷어 낸다 (값 하나하나는 fixSave 가 바로잡는다)
function scrub(s) {
  var id, c;
  for (id in s.chars) { c = s.chars[id]; if (!c || typeof c !== 'object' || !own(DS.CLASSES, c.cls) || !(+id >= 1)) delete s.chars[id]; }
  ['items', 'opt', 'cleared', 'visited', 'gear'].forEach(function (k) { if (s[k] != null && (typeof s[k] !== 'object' || Array.isArray(s[k]))) s[k] = {}; });
  if (s.v >= 4) { if (!s.gear) s.gear = {}; if (!Array.isArray(s.mercs)) s.mercs = []; }
  if (Array.isArray(s.mercs)) s.mercs = s.mercs.filter(function (m) { return m && typeof m === 'object'; });
  if (!Array.isArray(s.party)) s.party = [];
  if (s.news != null && !Array.isArray(s.news)) s.news = [];
  if (!s.cleared) s.cleared = {};
  if (!own(s.chars, s.hero)) s.hero = +Object.keys(s.chars)[0];
}

// 판 올림: 낡은 저장을 한 단계씩 지금 구조로 옮긴다. 저장 구조를 바꾸는 판마다 여기에 한 단계를 더한다.
var MIGRATE = {
  2: function (s) {   // 2.0.0 → 2.1.0: 특전 칸과 소식함이 생겼다. 이어받는 분께 업데이트 선물.
    s.perk = s.perk || null;
    s.items = s.items || {}; s.items.endo = (s.items.endo || 0) + 2; s.gold = (s.gold || 0) + 300;
    s.news = (s.news || []).concat(['2.1.0 선물: 기운초 2개와 300골드.', '병과 호칭이 클래식 명칭으로 바뀌었습니다. 키우던 지휘관은 그대로입니다.']);
    s.v = 3;
  },
  3: function (s) {   // 2.1.0 → 2.2.0: 장비가 단 숫자에서 아이템으로, 용병이 인원수에서 한 명 한 명으로 바뀌었다
    var id, c, G, i;
    s.gear = s.gear || {}; s.mercs = []; s.mnid = 1; s.pity = 0; s.tickets = (s.tickets || 0) + 3;
    s.opt = s.opt || {}; s.opt.refill = true;
    for (id in s.chars) {
      c = s.chars[id]; G = DS.CLS_GEAR[c.cls]; if (!G) continue;
      var wt = Math.max(0, Math.min(10, Math.round(+c.w || 0))), at = Math.max(0, Math.min(10, Math.round(+c.a || 0)));
      c.w = wt ? DS.gearId(G.w[0], 'A', wt) : null; c.a = at ? DS.gearId(G.a[0], 'A', at) : null;      // 쓰던 단의 기본형으로 그대로
      var ty = DS.baseMercTypes(c.cls), n = Math.max(0, Math.min(2, Math.round(+c.mc || 0))), g = Math.max(1, Math.min(4, Math.round(+c.mg || 1)));
      for (i = 0; i < n; i++) s.mercs.push({ id: s.mnid++, type: ty[i % ty.length], g: g, o: +id });        // 견습·정규·정예·근위 → 일반·고급·희귀·영웅
      delete c.mc; delete c.mg;
    }
    s.news = (s.news || []).concat(['2.2.0: 장비는 사서 장착하고, 용병은 모집으로 뽑습니다. 쓰던 장비와 용병은 그대로입니다.', '용병 모집권 3장을 드렸습니다. 용병은 쓰러지면 돌아오지 않습니다.']);
    s.v = 4;
  },
  4: function (s) {   // 2.2.0 → 2.3.0: 체력·마나가 이어지고, 성장이 느려졌다. 앞서 나간 저장에는 되감기의 저주.
    var top = 0, id;
    for (id in s.chars) { var c = s.chars[id]; top = Math.max(top, DS.tierOfL(+c.L || 1)); if (c.hp == null) c.hp = 1; if (c.mp == null) c.mp = 1; }
    (s.mercs || []).forEach(function (m) { if (m.hp == null) m.hp = 1; });
    if (top >= 3) DS.curse(s, top);
    s.v = 5;
  },
  5: function (s) {   // 2.3.0 → 2.4.0: 용병에게 이름·특성·공훈이 생겼다 (아래 fixSave 가 빠진 칸을 채운다)
    s.fallen = s.fallen || [];
    s.news = (s.news || []).concat(['2.4.0: 용병마다 이름, 특성, 공훈이 생겼습니다. 살아남을수록 강해집니다.']);
    s.v = 6;
  },
  6: function (s) {   // 2.4.0 → 2.5.0: 무기 강화
    s.news = (s.news || []).concat(['2.5.0: 무기점에 「무기 강화」가 생겼습니다. 실패하면 무기가 부서집니다.']);
    s.v = 7;
  },
  7: function (s) {   // 2.5.0 → 2.6.0: 강화석이 사라졌다. 가진 만큼 골드로 돌려준다.
    var n = Math.max(0, Math.round((s.items && +s.items.stone) || 0));
    if (s.items) delete s.items.stone;
    if (n > 0) s.gold = (+s.gold || 0) + n * 500;
    s.news = (s.news || []).concat(['2.6.0: 강화에 강화석이 필요 없어졌습니다.' + (n > 0 ? ' 가지고 계시던 강화석 ' + n + '개는 ' + (n * 500) + ' 골드로 바꿔 드렸습니다.' : '') + ' 막사는 대기 용병 30명까지 넓어졌고, 지휘관이 이끄는 용병은 막사 자리를 차지하지 않습니다.']);
    s.v = 8;
  },
  8: function (s) {   // 2.6.x → 2.7.0: 떨어지는 장비·보스 전리품. 이미 쓰러뜨린 보스의 고유 장비를 가방에 넣어 드린다.
    var got = DS.lootRetro ? DS.lootRetro(s) : [];
    s.news = (s.news || []).concat(['2.7.0: 몬스터와 보스가 장비와 소모품을 떨어뜨립니다.' + (got && got.length ? ' 이미 쓰러뜨린 보스의 고유 장비 ' + got.length + '점을 가방에 넣어 드렸습니다 (잠금 상태).' : '')]);
    s.v = 9;
  },
  9: function (s) {   // (㉑ 로 쓰이지 않는다 — read/peek 이 v9 이하를 받지 않는다. 시험·도구가 fixSave 를 직접 부를 때만 번호를 올린다)
    s.news = (s.news || []).concat(['4.0.0: 지휘관이던 이들은 부대원이 되었습니다. 레벨과 장비는 가문에 남았습니다. 가주의 공훈만큼 가문이 세집니다.']);
    s.v = 10;
  },
  12: function (s) {   // 2.1.x → 2.2.0 「한 사람 한 사람」: 가솔·막사가 없어졌다
    DS.mig13(s);
    s.v = 13;
  }
};
// 2.2.0 판 올림: 가주는 그대로 · 맹주 집 사람(핏줄 아이·배우자·물러난 선대)은 맹주 가문의 가문원 · 가솔은 그 가문의 대기조(등급 → 레벨 순으로 둘, 아홉 집 사람과 합일한 이 먼저)
//   · 남는 가솔과 막사의 사람은 떠나며 골드를 남긴다 (사람마다 옛 기본 모집값(지금 단) × 등급 몫(일반 ½ … 전설 2½) × ½) · 2.1 에서 「곧 온다」던 다음 가주는 빈 가문이면 그대로 선다 (DS.migSucc). 결과는 DS.lastMig13
DS.MIG13 = { gk: [0, 0.5, 0.75, 1, 1.6, 2.5], k: 0.5 };
DS.mig13 = function (s) {
  var R = { sb: 0, kin: 0, left: 0, gold: 0, succ: 0, seat: 0 }; DS.lastMig13 = R;
  if (!s || !s.chars) return R;
  if (!Array.isArray(s.mercs)) s.mercs = [];
  s.mercs = s.mercs.filter(function (m) { return m && typeof m === 'object'; });
  var hid = +s.hero, P = (s.lin && s.lin.P) || {}, hc = s.chars[hid], hp = hc && hc.pid ? P[hc.pid] : null;
  var line = function (m) { var p = m.pid && P[m.pid]; if (!p || p.m !== m.id) return false; return !!((p.hb && !p.ad) || p.hand || (hp && hp.sp && hp.sp === p.id)); };
  var valid = function (o) { return !!(o && own(s.chars, o)); };
  s.mercs.forEach(function (m) { if (m.h && (!valid(+m.o) || +m.o === hid)) delete m.h; });
  var seen = {}; s.mercs.forEach(function (m) { if (!m.h) return; if (seen[m.o]) delete m.h; else seen[m.o] = 1; });
  try { R.succ = DS.migSucc ? DS.migSucc(s) : 0; } catch (e) { R.succ = 0; }
  var by = {}, leave = [];
  s.mercs.forEach(function (m) {
    delete m.sb;
    if (m.h) return;
    if (line(m)) { m.kn = 1; m.o = hid; R.kin++; return; }
    var home = m.cast && DS.castFlag ? DS.castFlag(s, m.cast) : null, o = home ? home.id : +m.o;
    if (valid(o)) { m.o = o; (by[o] = by[o] || []).push(m); } else leave.push(m);
  });
  Object.keys(by).forEach(function (o) {
    by[o].sort(function (a, b) { return (b.cast ? 1 : 0) - (a.cast ? 1 : 0) || (b.fz ? 1 : 0) - (a.fz ? 1 : 0) || (+b.g || 1) - (+a.g || 1) || (+b.L || 1) - (+a.L || 1) || a.id - b.id; });
    by[o].forEach(function (m, i) { if (i < (DS.SB_MAX || 2)) { m.sb = 1; R.sb++; } else leave.push(m); });
  });
  var M = DS.MIG13, gone = {}, t0 = DS.heroTier ? DS.heroTier(s) : 1;
  leave.forEach(function (m) {
    var g = Math.max(1, Math.min(5, Math.round(+m.g || 1))), t = Math.max(t0, DS.tierOfL(Math.max(1, Math.min(100, Math.round(+m.L || 1)))));      // 지금 모집값 기준 (그 사람의 단이 더 높으면 그 단)
    R.gold += Math.round(DS.mercCost(t) * M.gk[g] * M.k / 10) * 10; R.left++;
    if (m.it && s.items && typeof s.items === 'object') s.items[m.it] = (s.items[m.it] || 0) + 1;
    gone[m.id] = 1;
  });
  s.mercs = s.mercs.filter(function (m) { return !gone[m.id]; });
  s.gold = Math.max(0, Math.round(+s.gold || 0)) + R.gold;
  if (s.opt && typeof s.opt === 'object') delete s.opt.refill;
  for (var id in s.chars) if (s.chars[id] && typeof s.chars[id] === 'object') { delete s.chars[id].gm; delete s.chars[id].manual0; }
  if (s.chars[hid] && s.chars[hid].st == null) s.chars[hid].st = 'side';      // 맹주를 따르는 가문원은 「호위」로 (예전 가솔의 「앞장」 기본값 대신)
  try { if (DS.sbTick) R.seat = DS.sbTick(s).length; } catch (e) { R.seat = 0; }
  var news = '2.2.0 「한 사람 한 사람」: 가솔과 막사가 없어졌다. 가주가 선 가문은 모두 싸운다.';
  if (R.sb) news += ' 가솔 ' + R.sb + '명은 그 가문의 대기조가 되었다.';
  if (R.kin) news += ' 맹주 집 사람 ' + R.kin + '명은 가문원으로 함께 싸운다.';
  if (R.left) news += ' ' + R.left + '명은 떠나며 ' + R.gold.toLocaleString() + ' 골드를 남겼다.';
  if (R.succ) news += ' 오기로 한 가주 ' + R.succ + '명이 자리에 섰다.';
  s.news = (Array.isArray(s.news) ? s.news : []).concat([news, '영웅 모집은 이제 비싸고 병과는 무작위다. 빈 가문은 모집이나 맹주의 아이로 채운다.']);
  return R;
};
// 되감기의 저주: 성장이 너무 빨랐던 판에서 앞서 나간 부대를 2단으로 되돌린다. 대신 전설 용병 하나.
DS.CURSE_L = 20;       // 2단 10레벨
DS.curse = function (s, top) {
  var id, c, k;
  // 합일한 마스터는 다시 갈라진다
  DS.charList(s).forEach(function (m) {
    var C = DS.CLASSES[m.cls]; if (!C.master) return;
    var F = DS.FAMILY[C.fam], wasHero = s.hero === m.id, pi = s.party.indexOf(m.id), first = null, hb = s.lin && F.members.indexOf(s.lin.hs) >= 0 ? s.lin.hs : null;
    ['w', 'a'].forEach(function (sl) { if (m[sl]) { s.gear[m[sl]] = (s.gear[m[sl]] || 0) + 1; m[sl] = null; } });
    F.members.forEach(function (cls) {
      if (DS.charList(s).some(function (x) { return x.cls === cls; })) return;
      var n = DS.addChar(s, cls, DS.CURSE_L, ''); if (!first) first = n;
      var at = s.party.indexOf(n.id); if (at >= 0) s.party.splice(at, 1);      // 자리는 아래에서 다시 정한다
      if (wasHero && (hb ? cls === hb : (cls === 'inf' || cls === 'mag'))) { s.hero = n.id; n.name = s.name; first = n; }      // r44: 대장 병과가 그 묶음에 있으면 그 줄 (옛 판은 보병·법사)
    });
    if (first) { (s.mercs || []).forEach(function (x) { if (x.o === m.id) x.o = first.id; }); if (pi >= 0) s.party[pi] = first.id; }
    else if (pi >= 0) s.party.splice(pi, 1);
    delete s.chars[m.id];
  });
  for (id in s.chars) {
    c = s.chars[id];
    if (c.L > DS.CURSE_L) { c.L = DS.CURSE_L; c.exp = 0; }
    c.hp = 1; c.mp = 1; c.down = false;
    if (!c.w || !c.a) { var keepW = c.w, keepA = c.a; DS.stdGear(c, 2); if (keepW) c.w = keepW; if (keepA) c.a = keepA; }
  }
  // 이야기도 그 무렵으로 되감긴다
  for (k in s.cleared) { var sc = DS.SCENARIOS[+k - 1]; if (sc && sc.L > DS.CURSE_L + 2) delete s.cleared[k]; }
  if (!s.cleared[20]) s.crest = false;
  s.pit = 1;
  s.town = s.visited && s.visited.dodam ? 'dodam' : 'haemil'; s.zone = s.town; s.pos = null;
  // 미안한 마음으로: 전설 용병 하나
  var hero = s.chars[s.hero] || DS.charList(s)[0];
  var mine = (s.mercs || []).filter(function (x) { return x.o === hero.id; }).sort(function (a, b) { return a.g - b.g; });
  if (mine.length >= DS.MERC_SLOTS) mine[0].o = 0;
  s.mercs.push({ id: s.mnid++, type: DS.baseMercTypes(hero.cls)[0], g: 5, o: hero.id, hp: 1 });
  s.cursed = { from: top, ver: '2.3.0' };
  s.news = (s.news || []).concat([
    '되감기의 저주 — 미안합니다. 지난 판은 성장이 너무 빨랐습니다. 균형을 바로잡느라, ' + top + '단까지 올랐던 부대를 2단으로 되돌렸습니다.',
    '동료와 골드, 가방의 장비는 그대로입니다. 이야기는 그 무렵의 시나리오부터 다시 이어집니다.',
    '사과의 뜻으로 전설 용병 한 명을 대장 곁에 보냈습니다. 쓰러지면 돌아오지 않습니다.']);
};
// 빠진 칸을 채우고 어긋난 값을 바로잡는다. 살릴 수 없으면 null.
DS.fixSave = function (s) {
  if (!s || typeof s !== 'object' || !s.chars || typeof s.chars !== 'object') return null;
  var wasBn = s.bn === 1;      // 4.0: 「표시가 있었나」는 채움보다 먼저 (bn 은 기본값 채움에 걸리지 않는다 — 표시가 틀려도 DS.bnFix 의 불변식이 바로잡는다)
  var def = DS.newSave('대장', 'inf'), k, id, hid0 = own(s.chars, s.hero) ? +s.hero : 0;
  for (k in def) if (s[k] === undefined && k !== 'chars' && k !== 'party' && k !== 'hero' && k !== 'nid' && k !== 'lin' && k !== 'coffins' && k !== 'cal' && k !== 'bn' && k !== 'us') s[k] = def[k];      // r42: us(필살기 씨앗)는 새 판에서만 — 없는 저장은 eg.seed 로 (결정적)      // 가계도·관은 DS.linFix 가 채운다 (새 판의 사람 명부를 옮겨 오지 않게)
  ['items', 'opt', 'seen', 'visited', 'cleared'].forEach(function (g) {
    if (!s[g] || typeof s[g] !== 'object' || Array.isArray(s[g])) s[g] = def[g];
    for (var q in def[g]) if (s[g][q] === undefined) s[g][q] = def[g][q];
  });
  for (k in s.items) s.items[k] = Math.max(0, Math.min(9999, Math.round(+s.items[k] || 0)));      // 소모품 수는 0 이상의 정수 (글자가 섞이면 더할 때 이어 붙는다)
  var gone = 0;      // r15: 없어진 소모품(폭탄·부적·두루마리 …)은 상점값만큼 골드로. 한 번 알린다 (game.js startGame 의 토스트)
  for (k in DS.GONE_ITEMS || {}) if (own(s.items, k)) { gone += (s.items[k] || 0) * DS.GONE_ITEMS[k].price; delete s.items[k]; }
  if (gone > 0) { s.gold = (+s.gold || 0) + gone; DS.goneGold = (DS.goneGold || 0) + gone; }
  delete s.relics; if (s.seen && typeof s.seen === 'object') { delete s.seen.rdry; delete s.seen.rsalt; for (k in s.seen) if (/^rpit\d+$/.test(k)) delete s.seen[k]; }      // 2.1.0: 유물은 없어졌다 — 옛 저장의 유물 칸·굴림 기록은 조용히 지운다
  s.name = typeof s.name === 'string' && s.name ? s.name : '대장';
  if (s.perk && typeof s.perk === 'object') s.perk.exp = Math.max(0, Math.min(0.2, +s.perk.exp || 0)); else s.perk = null;
  if (!Array.isArray(s.news)) s.news = [];
  var maxId = 0, n = 0;
  for (id in s.chars) {
    var c = s.chars[id], C = c && typeof c === 'object' && own(DS.CLASSES, c.cls) && DS.CLASSES[c.cls];
    if (!C || !(+id >= 1)) { delete s.chars[id]; continue; }
    c.id = +id; maxId = Math.max(maxId, c.id); n++;
    c.L = Math.max(1, Math.min(100, Math.round(+c.L || 1))); c.exp = Math.max(0, +c.exp || 0);      // r42: 가문 줄의 레벨은 가주의 개인 레벨을 비춘다 (맞춤은 끝의 DS.pSync)
    c.hx = Math.max(0, +c.hx || 0); if (!c.hx) delete c.hx;      // r42: 가문 공훈
    ['w', 'a'].forEach(function (sl) { if (c[sl] && DS.gearRepair) c[sl] = DS.gearRepair(c[sl]); var gd = DS.gear(c[sl]); if (!gd || gd.slot !== sl) c[sl] = null; });      // 2.1.0: 누구나 무엇이든 입는다 (칸만 맞으면)
    delete c.mc; delete c.mg; delete c.relic; delete c.gt;      // 2.1.0: 유물 칸은 없어졌다
    var person = +id === hid0 || c.pid != null || c.hp != null || c.name != null;      // 4.0: 사람 칸은 대장 줄(과 아직 옮기지 않은 옛 줄)에만 채운다 — 새 모양 깃발 줄에 새로 만들지 않는다
    if (person) { c.down = !!c.down; c.name = typeof c.name === 'string' ? c.name : ''; c.hp = c.hp == null ? 1 : Math.max(0.01, Math.min(1, +c.hp || 1)); }
    c.mp = c.mp == null ? 1 : Math.max(0, Math.min(1, +c.mp || 0));
  }
  if (!n) return null;
  // 가방의 장비, 용병 명부
  if (!s.gear || typeof s.gear !== 'object' || Array.isArray(s.gear)) s.gear = {};
  for (k in s.gear) { var gn = Math.round(+s.gear[k] || 0), gk = DS.gearRepair ? DS.gearRepair(k) : (DS.gear(k) ? k : null); delete s.gear[k]; if (gk && gn > 0) s.gear[gk] = (s.gear[gk] || 0) + gn; }      // 모르는 옵션은 벗겨서 기본형으로 살린다
  var mid = 0;
  s.mercs = (Array.isArray(s.mercs) ? s.mercs : []).filter(function (m) {
    if (!m || typeof m !== 'object' || !own(DS.MERCS, m.type)) return false;
    m.g = Math.max(1, Math.min(5, Math.round(+m.g || 1))); m.id = Math.round(+m.id || 0); m.o = own(s.chars, m.o) ? +m.o : 0; m.hp = m.hp == null ? 1 : Math.max(0.01, Math.min(1, +m.hp || 1));
    // 이름·생김새·특성·공훈: 없던 용병에게는 아이디에서 정해 준다 (다시 읽어도 같게)
    if (!m.n || typeof m.n !== 'string') m.n = DS.MERC_NAMES[(Math.abs(m.id) * 7 + 3) % DS.MERC_NAMES.length];
    m.v = Math.max(0, Math.min(3, Math.round(m.v == null ? m.id % 4 : +m.v || 0)));
    if (!own(DS.TRAITS, m.t)) { var tk = Object.keys(DS.TRAITS); m.t = tk[(Math.abs(m.id) * 5 + 1) % tk.length]; }
    delete m.x; m.k = Math.max(0, Math.round(+m.k || 0)); m.b = Math.max(0, Math.round(+m.b || 0));
    if (m.L == null && m.o && own(s.chars, m.o)) { m.L = +s.chars[m.o].L || 1; if (m.L > 70) m.fz = 1; }      // 레벨 칸이 없는 줄(시험용 옛 저장): 선 가문의 레벨에서 (이어 하기는 Save.read 가 이미 막는다)
    if (m.fz != null) { if (m.fz) m.fz = 1; else delete m.fz; } m.L = Math.max(1, Math.min(m.fz ? 100 : 70, Math.round(+m.L || 1))); m.exp = Math.max(0, +m.exp || 0);      // r42: 개인 단·레벨
    if (m.q != null && !(DS.QUIRKS && own(DS.QUIRKS, m.q))) delete m.q;
    if (m.s != null && !own(DS.SKILLS, m.s)) delete m.s;
    if (m.it != null && !(DS.MGEAR && own(DS.MGEAR, m.it))) delete m.it;
    if (m.bk != null) m.bk = Math.max(0, Math.round(+m.bk || 0)); if (m.sv != null) m.sv = Math.max(0, Math.round(+m.sv || 0));
    if (m.h != null) { if (m.h && m.o) m.h = 1; else delete m.h; }      // 4.0: 깃발을 든다 (인구를 차지하지 않는다)
    if (m.cast != null && !(DS.CAST_NAME && own(DS.CAST_NAME, m.cast))) delete m.cast;
    if (m.sb != null) { if (m.sb && m.o && !m.h) m.sb = 1; else delete m.sb; }      // 2.2.0: 대기조
    if (m.kn != null) { if (m.kn) m.kn = 1; else delete m.kn; }      // 2.2.0: 맹주 집 사람 (가문원)
    if (m.nc != null && !(own(DS.CLASSES, m.nc) && !DS.CLASSES[m.nc].master)) delete m.nc;      // 2.2.0: 받은 가문 병과
    delete m.gm;
    mid = Math.max(mid, m.id);
    return m.id > 0;
  });
  // 깨진 저장의 거대한 배열만 막는다 (300). 4.0 (②-2-4): 가계·깃발에 걸린 줄(든 사람 h · 열쇠 cast · 가계도 pid · 잠금 lk · 깃발 밑 o)은 앞으로 모으고, 자를 때는 막사 일반 줄만 자른다
  if (DS.bnCap) DS.bnCap(s, 300); else s.mercs = s.mercs.slice(0, 300);
  if (s.lock != null && (typeof s.lock !== 'object' || Array.isArray(s.lock))) s.lock = {};      // 장비 잠금: 배열이면 JSON 에 남지 않아 잠금이 사라진다
  if (DS.mercTidy) DS.mercTidy(s);      // 2.2.0: 자리 불변식 (가주 하나 · 가문원은 맹주 가문 · 그 밖은 대기조)
  if (!Array.isArray(s.fallen)) s.fallen = [];
  s.fallen = DS.fallenTrim(s.fallen.filter(function (f) { return f && typeof f === 'object'; }));
  s.fallen.forEach(function (f) { f.g = Math.max(1, Math.min(5, Math.round(+f.g || 1))); if (typeof f.n !== 'string') f.n = ''; if (f.nk != null && typeof f.nk !== 'string') delete f.nk; if (f.lw != null) { if (typeof f.lw !== 'string') delete f.lw; else f.lw = Array.from(f.lw).slice(0, 24).join(''); } });      // r32: 마지막 한마디 (24자)      // 막사의 추모 목록이 GRADES[f.g] 를 읽는다
  s.mnid = Math.max(+s.mnid || 1, mid + 1);
  s.tickets = Math.max(0, Math.round(+s.tickets || 0)); s.pity = Math.max(0, Math.round(+s.pity || 0));
  if (s.rh != null) { if (!s.rh || typeof s.rh !== 'object' || Array.isArray(s.rh)) delete s.rh; else { s.rh = { h: Math.max(0, Math.min((DS.RECRUIT && DS.RECRUIT.max) || 40, +s.rh.h || 0)), t: Math.max(0, +s.rh.t || 0) }; } }      // r35 모집 열기
  s.nid = Math.max(+s.nid || 1, maxId + 1);
  if (!own(s.chars, s.hero)) s.hero = +Object.keys(s.chars)[0];
  s.hero = +s.hero;
  s.party = (Array.isArray(s.party) ? s.party : []).map(function (p) { return +p; }).filter(function (p, i, a) { return own(s.chars, p) && a.indexOf(p) === i; });
  if (!s.party.length) s.party = [s.hero];      // 2.2.0: 끝의 DS.pSync → DS.partySync 가 가주가 선 가문 모두로 맞춘다
  for (k in s.cleared) if (!(+k >= 1 && +k <= DS.SCENARIOS.length)) delete s.cleared[k];
  if (!own(DS.ZONES, s.town) || !DS.ZONES[s.town].town) s.town = 'haemil';
  if (!own(DS.ZONES, s.zone)) { s.zone = s.town; s.pos = null; }
  if (!s.pos || typeof s.pos !== 'object' || !int(s.pos.x) || !int(s.pos.y) || s.pos.x < 0 || s.pos.y < 0) s.pos = null;      // 자리가 숫자 칸이 아니면 지역 입구에서 다시 선다 (그대로 두면 이어하기에서 넘어진다)
  else s.pos = { x: s.pos.x, y: s.pos.y };
  s.visited[s.town] = true; s.visited[s.zone] = true;
  s.gold = Math.max(0, Math.round(+s.gold || 0)); s.pit = Math.max(1, Math.min(10, Math.round(+s.pit || 1)));
  s.kills = Math.max(0, Math.round(+s.kills || 0)); s.time = Math.max(0, +s.time || 0); s.crest = !!s.crest;
  s.opt.speed = DS.spdOf(s.opt.speed);      // r36: 배속은 1 · 1.5 · 2 (옛 3배속은 2배속으로)
  s.v = Math.max(+s.v || 2, 2);
  if (DS.linFix) DS.linFix(s);
  if (DS.lootFix) DS.lootFix(s);      // 장비 내력(save.gh): 깨진 칸·지니지 않는 기록을 걷는다. 옛 저장은 빈 칸 (SAVE_V 그대로)
  if (DS.ageFix) DS.ageFix(s);      // 나이: 세계 달력·나이·수명 (옛 저장은 결정적으로, SAVE_V 그대로)      // 가계도(2.9): 성별·성·사람 명부·관. 옛 저장은 결정적으로 배정 (SAVE_V 를 올리지 않아도 된다)
  if (DS.bnFix) DS.bnFix(s, wasBn);      // 4.0: 부대원 + 깃발 — 불변식 넷을 검사하고 어긴 줄만 변환한다 (두 번 돌려도 같다)
  if (DS.fuseUnions) DS.fuseUnions(s);      // r42: 옛 묶음 기록은 없어졌다 (비운다)
  if (DS.pSync) DS.pSync(s);      // r42: 가문 줄 ← 가주의 개인 레벨
  return s;
};
DS.Save = {
  // 저장을 읽는다. 낡은 판이면 옮기고, 옮기기 전 원본은 따로 남긴다.
  KEY: KEY, OLD_KEY: OLD,
  load: function () {
    var raw = get(KEY), s = null;
    if (raw && newerOf(raw)) return null;      // 더 새 판의 저장: 깨진 것으로 떠 두지도 않는다 (타이틀이 newerLocal 로 안내한다)
    try { s = this.read(raw); } catch (e) { s = null; }
    if (!s && raw) set(KEY + '_broken', raw);      // 살리지 못한 저장은 버리지 않고 따로 남긴다 (새로 시작해도 이 칸은 덮어쓰지 않는다)
    return s;
  },
  oldRaw: function () { return get(OLD) || get(OLD + '_bak') || get(OLD1) || get(OLD1 + '_bak'); },      // 옛 판의 저장 (읽기 전용 — r42: 안내만 한다)
  archived: function () { return !!this.oldRaw(); },      // r42: 이 기기에 보관된 옛 기록이 있는가
  archNote: function () { var m = this.meta(); if (m.arch4 || !this.archived()) return false; return true; },      // 2.1.0: 새 판 — 2.0.0 의 안내를 본 이도 한 번 더 (arch4)      // 처음 한 번 「새 시대가 열렸다」
  archSeen: function () { this.setMeta({ arch3: 1, arch4: 1 }); },
  isOld: function (raw) { var s = typeof raw === 'string' ? parse(raw) : raw; return !!(s && typeof s === 'object' && s.chars && !newerOf(s) && verOf(s) < DS.SAVE_MIN); },
  // 저장 글을 읽어 지금 구조로 만든다. 살릴 수 없으면 null (넘어질 수도 있다 — load 가 받는다).
  read: function (raw) {
    var s = parse(raw);
    if (!s || typeof s !== 'object' || !s.chars || typeof s.chars !== 'object') return null;
    if (newerOf(s)) return null;      // 더 새 판의 저장은 읽지 않는다 (판 내림은 없다)
    if (verOf(s) < DS.SAVE_MIN) return null;      // ㉑ 옛 판(v11 이하)의 저장은 이어 하지 않는다 — v12 는 판 올림
    s.v = verOf(s);
    var from = s.v, moved = false;
    if (from < DS.SAVE_V) {
      set(KEY + '_bak', raw);
      scrub(s);
      while (s.v < DS.SAVE_V) { var m = MIGRATE[s.v]; if (!m) break; m(s); moved = true; }
      s.hist = (Array.isArray(s.hist) ? s.hist : []).concat([{ from: from, to: s.v, ver: DS.VERSION }]);
    }
    s = DS.fixSave(s); if (!s) return null;
    // 회귀자인데 아직 특전을 받지 못한 저장이면 지금 드린다
    var r = this.legacy();
    if (r && !s.perk) { DS.grantReturnee(s, r, true); moved = true; }
    if (moved) this.store(s);
    return s;
  },
  // 미리 보기용: read 와 같은 판 올림·바로잡기를 하되 이 기기 저장(localStorage)은 건드리지 않는다 (이사 가져오기 비교 창 — migrate.js)
  peek: function (raw) {
    try {
      var s = parse(raw);
      if (!s || typeof s !== 'object' || !s.chars || typeof s.chars !== 'object') return null;
      if (newerOf(s)) return null;      // 더 새 판 — 부르는 쪽은 DS.Save.newer(raw) 로 먼저 가려 안내한다
      if (verOf(s) < DS.SAVE_MIN) return null;      // ㉑ 옛 판 저장 — 부르는 쪽은 DS.Save.isOld(raw) 로 가려 「새 시대를 연다」로
      s.v = verOf(s);
      var from = s.v;
      if (from < DS.SAVE_V) { scrub(s); while (s.v < DS.SAVE_V) { var m = MIGRATE[s.v]; if (!m) break; m(s); } }
      s = DS.fixSave(s); if (s) s._from = from;
      return s;
    } catch (e) { return null; }
  },
  store: function (s) {
    if (!s || newerOf(s)) return false;
    var cur = get(KEY), m = cur && /^\{"v":(\d+)[,}]/.exec(cur);      // 이 칸에 더 새 판의 저장이 있으면 덮어쓰지 않는다 (옛 판 탭이 새 판 저장을 지우지 않게. 맨 앞 "v" 만 싸게 본다)
    if (m && +m[1] > DS.SAVE_V) return false;
    s.ver = DS.VERSION; return set(KEY, JSON.stringify(s));
  },
  newer: function (raw) { return newerOf(raw); },      // 저장 글·객체가 더 새 판이면 그 판 번호, 아니면 0
  newerLocal: function () { return newerOf(get(KEY)); },      // 이 기기 저장이 더 새 판인가
  raw: function () { return get(KEY); },      // 이어할 저장 글 (4.0 은 새 키만)
  has: function () { return !!get(KEY); },
  wipe: function () { try { localStorage.removeItem(KEY); } catch (e) {} },      // 새로 시작: 새 키만 지운다 — 옛 키는 옛 판의 저장이라 그대로
  meta: function () { return parse(get(META)) || {}; },
  setMeta: function (patch) { var m = this.meta(); for (var k in patch) m[k] = patch[k]; set(META, JSON.stringify(m)); return m; },
  // 1.0 판의 기록 (한 번 읽으면 따로 적어 두어, 예전 저장이 지워져도 회귀자임을 기억한다)
  legacy: function () {
    var m = this.meta(); if (m.returnee) return m.returnee;
    var o = parse(get(LEGACY)); if (!o || typeof o !== 'object' || !Array.isArray(o.units)) return null;
    var cleared = 0, top = 1, k;
    for (k in (o.cleared || {})) cleared++;
    o.units.forEach(function (u) { top = Math.max(top, +u.lv || 1); });
    var r = { from: '1.0', name: String(o.name || '').slice(0, 8), cleared: Math.min(32, cleared), top: top };
    this.setMeta({ returnee: r });
    return r;
  }
};
// 회귀자 특전: 예전 기록에 따라 조금씩 다르다
DS.returneePerk = function (r) {
  var c = r ? r.cleared || 0 : 0;
  var p = { rank: c >= 32 ? '끝을 본 회귀자' : c >= 16 ? '노련한 회귀자' : c >= 5 ? '돌아온 회귀자' : '회귀자',
            exp: c >= 32 ? 0.2 : c >= 16 ? 0.15 : 0.1, gold: 500 + 100 * c, items: { herb: 5 + (c >= 8 ? 3 : 0), mana: 3, endo: 2 }, cleared: c };
  p.tickets = c >= 32 ? 4 : c >= 16 ? 3 : 2;      // 2.2.0: 영웅 모집권 (값이 비싸져 장 수를 줄였다)
  p.lines = ['칭호 「' + p.rank + '」', '시작 골드 +' + p.gold, '약초 ' + p.items.herb + ', 마나초 3, 기운초 2', '영웅 모집권 ' + p.tickets + '장', '경험치 +' + Math.round(p.exp * 100) + '% (계속 유지)'];
  return p;
};
// 저장에 특전을 적용한다. late = 이미 진행 중인 저장에 뒤늦게 드리는 경우
DS.grantReturnee = function (s, r, late) {
  var p = DS.returneePerk(r), k, h = s.chars[s.hero];
  s.perk = { rank: p.rank, exp: p.exp, from: r.from, cleared: p.cleared };
  s.gold = (s.gold || 0) + p.gold;
  for (k in p.items) s.items[k] = (s.items[k] || 0) + p.items[k];
  s.tickets = (s.tickets || 0) + p.tickets;
  if (late) s.news = (s.news || []).concat(['회귀자 특전 — 1.0 판을 해 주셔서 고맙습니다. 골드 ' + p.gold + ', 소모품, 영웅 모집권 ' + p.tickets + '장, 경험치 +' + Math.round(p.exp * 100) + '%를 드렸습니다.']);
  return p;
};
})();
