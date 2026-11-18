// 열 개의 깃발 — 가계도: 성별·성과 이름·혼인·출산·영구 사망·후계·슬픔·관 (설계서 r4/lineage_spec.md)
// 순수 규칙만 둔다 (화면은 lineage_ui). 사건은 돌려주는 목록으로 — game.js 가 G.lineageQ 에 쌓는다.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

DS.SEX = { m: { name: '남', sym: '♂' }, f: { name: '여', sym: '♀' } };
// r13 가문명: 성은 여러 문화의 유명한 가문명(한국어 널리 쓰는 표기, 2~6자). 이름만 빌린다 — 원작 인물·줄거리는 가져오지 않는다.
//   표시는 「이름 가문명」(DS.snName: 「불꽃 스타크」), 집은 「스타크 가문」(DS.houseOf). 옛 시대(4.0 전 저장)의 한 글자 성도 같은 꼴로 보인다(「불꽃 모」).
//   아홉 집·세 마스터 성(아래 LIN_HOUSE)은 풀에 넣지 않는다. 1.0.0: 합일 가문은 타르가르옌·아트레이데스·죠스타 (사용자 「대표성이 있어야」, 「죠스타는 괜찮다」) — 앞의 둘은 풀에서 뺐다. 죠스타는 풀에도 남는다
DS.SURNAME_SRC = [      // [묶음, 성들] — 「가문의 성」 창이 묶음별로 보여 준다
  ['판타지 드라마', ['스타크', '바라테온', '타이렐', '마르텔', '그레이조이']],
  ['슈퍼히어로', ['웨인', '켄트', '파커', '스트레인지', '배너']],
  ['만화, 애니', ['우치하', '조르딕', '휴우가', '우즈마키', '아커만', '야가미', '노하라', '죠스타']],
  ['게임', ['벨몬트', '레드필드', '크로프트', '윈드러너', '마리오', '레이너']],
  ['고전 문학', ['몬터규', '캐퓰렛', '카라마조프', '다아시', '바스커빌', '홈즈']],
  ['판타지, SF 소설', ['말포이', '위즐리', '배긴스', '하코넨']],
  ['영화, TV', ['솔로', '케노비', '코를레오네', '심슨', '맥플라이']]
];
// 1.0.7: 맹주 가문 후보 — 시작할 때와 「가문의 성」 창 맨 위에서 고른다 (부대원 성 풀과 따로, 이름에 힘이 있는 집). [이름, 한 줄]
DS.GRAND_HOUSES = [['펜드래곤', '바위에서 검을 뽑은 왕의 핏줄'], ['타르가르옌', '불과 피, 용을 타던 집'], ['아트레이데스', '모래 위의 매, 약속을 지키는 집'], ['벨몬트', '밤을 사냥해 온 집'],
  ['스타크', '겨울이 와도 무릎 꿇지 않는 집'], ['우치하', '눈에 불꽃을 품은 집'], ['브리타니아', '황제의 깃발을 든 집'], ['죠스타', '목덜미에 별을 지닌 집']];
// 2.1.0: 고른 큰 이름은 「연맹」의 이름이다 (펜드래곤 연맹). 대와 후계가 바뀌어도 그대로 — 저장 칸 save.ally. 맹주의 집은 다른 집처럼 병과의 가문명을 쓴다 (DS.houseName)
//   이야기·화면은 DS.allyName(s) + ' 연맹'. 저장이 없거나 칸이 비면 첫 이름 (넘어지지 않게)
DS.allyName = function (s) {
  try { s = s || (DS.G && DS.G.save); var a = s && typeof s.ally === 'string' ? s.ally.trim() : ''; if (a && a.length <= 8) return a; } catch (x) {}
  return (DS.GRAND_HOUSES && DS.GRAND_HOUSES[0] && DS.GRAND_HOUSES[0][0]) || '펜드래곤';
};
DS.allyFull = function (s) { return DS.allyName(s) + ' 연맹'; };
DS.allySet = function (s, n) { n = String(n == null ? '' : n).trim(); if (!s || !n || !(DS.nameOK ? DS.nameOK(n) : n.length <= 8)) return false; s.ally = Array.from(n).slice(0, 8).join(''); return true; };
DS.SURNAMES = DS.SURNAME_SRC.reduce(function (a, g) { return a.concat(g[1]); }, []);
// 아홉 집·세 마스터의 성 (주인공 가문은 save.lin.sur). 각 집의 이야기 속 역할과 맞물리는 이름 — 표는 r13/names.md
DS.LIN_HOUSE = { inf: '로저스', cav: '라니스터', fly: '스카이워커', mar: '앗쎄이', pike: '프레이', arc: '퀸', cle: '센주', mon: '카마도', mag: '그레인저', sha: '아담스', bm: '타르가르옌', tm: '아트레이데스', mm: '죠스타' };
// 4.0 까지의 집 성 — 옛 저장의 아홉 집 사람을 새 이름으로 옮길 때만 쓴다 (DS.linFix)
DS.LIN_HOUSE_OLD = { inf: '한', cav: '백', fly: '하', mar: '해', pike: '도', arc: '류', cle: '서', mon: '진', mag: '윤', sha: '모', bm: '강', tm: '여', mm: '설' };
// 표시 형식 하나: 이름 + 띄어 쓰기 + 가문명 (성이 없으면 이름만)
DS.snName = function (sn, n) { sn = sn == null ? '' : String(sn); n = n == null ? '' : String(n); return sn && n ? n + ' ' + sn : (n || sn); };
DS.houseOf = function (sn) { return sn ? sn + ' 가문' : ''; };      // 「스타크 가문」 (「○○가」는 토씨와 헷갈려 쓰지 않는다)
DS.castHouse = function (key) { return DS.houseOf((DS.LIN_HOUSE && DS.LIN_HOUSE[key]) || ''); };
DS.LIN_LOSS = {};      // 4.0: 후계 레벨 손실·먼 친척·되찾기 2배는 없어졌다 (깃발의 레벨은 깎이지 않는다). 옛 화면이 읽어도 0 이 되게 빈 표로 남긴다
DS.LIN_BOND = 3;        // 함께 이긴 시나리오 몇 판마다 아이가 태어나나
DS.LIN_KIDS = 3;        // 한 집(지휘관)의 살아 있는 혈육 아이 최대
DS.LIN_MOOD = {
  grief: { name: '비탄', v: 0.9, n: 2, desc: '가족을 잃은 슬픔 — 공격, 마공 −10%' },
  will:  { name: '유지(遺志)', v: 1.1, n: 2, desc: '떠난 이의 뜻을 잇는다 — 공격, 마공 +10%' }
};
DS.COFFIN_MAX = 10;
// 3.3.0: 1만 골드 확정 부활(DS.revive·reviveCond·REVIVE_COST)은 없앴다. 관에서 나오는 길은 「다시 부름」(DS.egReturn — 다음 세대의 장, 스무 해 끝 새벽)과 [묻는다](DS.linBury) 둘이다.
// 돌아온 이·깃대를 넘긴 선대의 용병 종류 (설계서 4-3). 4.0 의 CAST_KIND 가 굳으면 이 표만 바꾼다
DS.RET_KIND = { inf: 'm_sword', cav: 'm_lancer', fly: 'm_lancer', mar: 'm_pike', pike: 'm_pike', arc: 'm_archer', cle: 'm_sister', mon: 'm_templar', mag: 'm_sister', sha: 'm_templar', bm: 'm_sword', tm: 'm_pike', mm: 'm_templar' };
DS.RET_L = function (s, L, g) { return Math.max(DS.recruitL ? DS.recruitL(s, g) : 1, Math.min(70, Math.round((+L || 1) * 0.6))); };      // r42: 돌아온 이의 개인 레벨 — 옛 레벨의 6할 (부대에 새로 오는 이보다 낮지 않게)
DS.RET_VET = function (tier) { return tier <= 3 ? 25 : tier <= 6 ? 70 : tier <= 8 ? 150 : 280; };      // 깃발 들던 이가 돌아올 때의 공훈 (숙련·고참·정예·용사)
DS.RET_RG = function (tier) { return tier <= 3 ? 2 : tier <= 6 ? 3 : tier <= 8 ? 4 : 5; };      // 숨질 때의 단 → 돌아올 등급 (고급·희귀·영웅·전설)
// 기본 글 (DS.LORE.lineage 가 있으면 그쪽이 먼저). {a} {b} {kid} {house} {at}
DS.LIN_TXT = {
  wed: ['{a}{과와} {b}{이가} 혼인했다.'],
  part: ['{a}{과와} {b}{은는} 각자의 길을 갔다.'],
  widow: ['{b}{을를} 먼저 보내고 {a}{은는} 홀로 남았다.'],
  birth: ['{house}에 {kid}{이가} 태어났다.'],
  death: ['{a}{이가} {at}에서 숨을 거두었다.'],
  heir: ['{a}{이가} {b}의 뒤를 이어 가주가 되었다.'],
  adopt: ['{a}{이가} {b}의 집안에 들어 성을 바꾸었다.'],
  kin: ['먼 친척 {a}{이가} 찾아와 {b}의 자리를 이었다.'],
  fuse: ['{a}{이가} 합일했다.'],
  succ: ['{house}의 가주를 {a}{이가} 이었다.'],
  lead: ['{house}의 {a}{이가} 연맹의 맹주가 되었다.'],      // 2.1.0: 다른 가문의 가주가 맹주로 (가문은 그대로)      // 2.1.0: 맹주 밖 가문의 자동 후계
  fuseH: ['{a}{이가} 합일하여 {house}에 섰다.'],
  fuseU: ['{house}{이가} 함께 8단에 올라 {union}{이가} 되었다.'],
  coffin: ['{a}{을를} 관에 모셨다.'],
  revive: ['{a}{이가} 관에서 돌아왔다.'],
  recall: ['{a}{이가} 열다섯 살로 되살아났다.'],
  bury: ['{a}{을를} 해밀 언덕에 묻었다.'],
  hand: ['{a}{이가} {b}에게 집안을 맡겼다.'],
  fusepart: ['{b}{이가} 합일하던 날 곁을 떠나, {a}{은는} 곁을 지키던 날들을 마음에 묻었다.'],
  gone: ['{a}{이가} 부대를 떠났다.'],
  house: ['이 대에 「{house}」 문패를 새로 걸었다.'],      // 4.0 ⑬·⑯
  castHeir: ['{house}의 가주를 {a}{이가} 이었다.']      // 4.0 ⑫-2
};

function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function scnN(s) { return Object.keys(s.cleared || {}).length; }
function hsh(a, b, c) { return DS.hash2(a | 0, b | 0, c | 0); }
function pickOf(list, r) { return list[Math.floor(r * list.length) % list.length]; }
function merc(s, id) { for (var i = 0; i < s.mercs.length; i++) if (s.mercs[i].id === id) return s.mercs[i]; return null; }
function L0(s) {
  if (!s.lin || typeof s.lin !== 'object') s.lin = { v: 1, sur: surOf(s.name), seq: 1, P: {}, log: [], bd: {} };
  return s.lin;
}
function surOf(name) { var t = String(name || '대장'), h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return DS.SURNAMES[Math.abs(h) % DS.SURNAMES.length]; }
function tierStart(L) { return (DS.tierOfL(L) - 1) * DS.LV_PER_TIER + 1; }
// 집의 이름: 주인공 가문은 주인공 이름, 아니면 지금의 클래스명
function callBase(s, ch) { return ch.id === s.hero ? (s.name || '대장') : DS.tierName(ch.cls, DS.tierOfL(ch.L)); }
// 대장의 호: 「민규 2세」. ⑬ 가문이 옮겨 가며 고른 호는 lin.gb = { b: 이름, o: 대수 기준 } — 그 뒤 「{b} {gen − o}세」 (1세도 적는다)
function heroName(s, gen) { var gb = s.lin && s.lin.gb; if (gb && typeof gb.b === 'string' && gb.b) return gb.b + ' ' + Math.max(1, gen - (+gb.o || 0)) + '세'; return (s.name || '대장') + (gen > 1 ? ' ' + gen + '세' : ''); }
DS.heroName = heroName;
function houseSn(s, ch) { return L0(s).sur; }      // 4.0: 혼인·출산·후계는 대장 한 집뿐이다

function mkP(s, o) {
  var Lr = L0(s), id = Lr.seq++;
  var p = { id: id, k: o.k, sn: o.sn || '', n: o.n || '', sx: o.sx === 'f' ? 'f' : 'm', gen: o.gen || 1, pa: (o.pa || []).slice(), sp: 0, st: 'live', c: o.c || 0, m: o.m || 0, born: scnN(s) };
  ['ttl', 'cls', 'type', 'g', 'L', 'gv', 'fu', 'ad', 'kin', 'hb'].forEach(function (k) { if (o[k] != null) p[k] = o[k]; });
  Lr.P[id] = p;
  return p;
}
DS.linMkP = mkP;
// 깃발의 사람: 대장 깃발이면 대장의 사람(없으면 만든다 — 1세, 이름 = 주인공 이름), 아니면 그 깃발을 든 부대원의 사람 (빈 깃발은 null)
function charP(s, ch) {
  if (!ch) return null;
  if (ch.id !== s.hero) { var b = DS.bearer ? DS.bearer(s, ch) : null; return b ? mercP(s, b, true) : null; }
  var P = L0(s).P, p = ch.pid && P[ch.pid];
  if (p && p.c === ch.id && p.st === 'live') return p;
  if (!ch.sx) ch.sx = hsh(ch.id, 211, 7) < 0.5 ? 'm' : 'f';
  p = mkP(s, { k: 'c', sn: ch.id === s.hero ? L0(s).sur : DS.LIN_HOUSE[ch.cls] || '한', n: callBase(s, ch), sx: ch.sx, cls: ch.cls, L: ch.L, c: ch.id });
  ch.pid = p.id;
  return p;
}
function mercFix(m, sv) {
  if (m.sx !== 'm' && m.sx !== 'f') m.sx = hsh(m.id, 17, 3) < 0.5 ? 'm' : 'f';
  if (typeof m.sn !== 'string' || !m.sn) {
    var N = DS.SURNAMES.length, i = Math.floor(hsh(m.id, 41, 9) * N) % N, own = sv && sv.lin && sv.lin.sur;
    if (own && DS.SURNAMES[i] === own) i = (i + 1 + Math.floor(hsh(m.id, 43, 5) * (N - 1))) % N;      // 1.0.1: 새로 온 사람이 맹주 가문의 성을 받지 않는다 (핏줄로 보이던 것)
    m.sn = DS.SURNAMES[i];
  }
}
function mercP(s, m, make) {
  var P = L0(s).P, p = m.pid && P[m.pid];
  if (p && p.m === m.id && p.st === 'live') return p;
  if (!make) return null;
  mercFix(m);
  p = mkP(s, { k: 'm', sn: m.sn, n: m.n, sx: m.sx, type: m.type, g: m.g, m: m.id, gv: 1, ttl: m.ttl });
  m.pid = p.id;
  return p;
}
// 참조 {c: 지휘관 id} | {m: 용병 id} | {p: 사람 id} → { ent, p, k }
function refOf(s, r) {
  if (!r) return null;
  if (r.c != null) { var ch = s.chars[r.c]; if (!ch) return null; if (ch.id !== s.hero) { var bm = DS.bearer ? DS.bearer(s, ch) : null; return bm ? { ent: bm, p: mercP(s, bm, true), k: 'm' } : null; } return { ent: ch, p: charP(s, ch), k: 'c' }; }
  if (r.m != null) { var m = merc(s, +r.m); return m ? { ent: m, p: mercP(s, m, true), k: 'm' } : null; }
  if (r.p != null) { var p = L0(s).P[r.p]; if (!p) return null; return { ent: entOf(s, p), p: p, k: p.k }; }
  return null;
}
function entOf(s, p) {
  if (!p || p.st !== 'live') return null;
  if (p.c) { var ch = s.chars[p.c]; return ch && ch.pid === p.id ? ch : null; }
  if (p.m) { var m = merc(s, p.m); return m && m.pid === p.id ? m : null; }
  return null;
}
function sync(s, p) {
  var e = entOf(s, p); if (!e) return p;
  if (p.c) { p.cls = e.cls; p.L = e.L; if (!p.gv) p.n = callBase(s, e); }
  else { p.type = e.type; p.g = e.g; p.n = e.n; p.sn = e.sn || p.sn; p.L = DS.pL(e); }
  return p;
}
DS.linOf = function (s, ent) { if (!ent) return null; return ent.cls ? charP(s, ent) : mercP(s, ent, false); };
DS.linLogE = function (s, t, a, b, x) { return logE(s, t, a, b, x); };
DS.linPerson = function (s, pid) { return L0(s).P[pid] || null; };
// 표시 이름: 아이는 호(「나이트 2세」), 성과 이름이 있는 이는 성+이름, 처음 지휘관은 클래스명/주인공 이름
DS.linName = function (s, pid) { var p = L0(s).P[pid]; if (!p) return '누군가'; sync(s, p); return p.ttl || (p.gv ? DS.snName(p.sn, p.n) : p.n); };
DS.fullName = function (x, s) {
  if (!x) return '';
  if (x.cls && s) { var p = charP(s, x); return !p ? '' : p.gv ? DS.snName(p.sn, p.n) : p.n; }
  if (x.sn != null && x.n != null) return DS.snName(x.sn, x.n);
  return x.n || '';
};
DS.linCall = function (s, ch) { return callBase(s, ch); };

// ── 사건 기록 ──
function logE(s, t, a, b, x) {
  var e = { t: t, s: scnN(s), tm: Math.round(s.time || 0), a: a || 0 };
  if (b) e.b = b; if (x) e.x = x;
  var lg = L0(s).log; lg.push(e); if (lg.length > 300) lg.splice(0, lg.length - 300);
  return e;
}
function jo(w, pair) {      // 받침에 맞는 조사 (pair = '이가' '은는' '을를' '과와' — 앞이 받침 있을 때)
  var c = String(w).charCodeAt(String(w).length - 1), has = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 > 0;
  return has ? pair[0] : pair[1];
}
function fillT(t, map) {
  return String(t).replace(/\{(a|b|kid|house|at|full|union)\}(\{(이가|은는|을를|과와)\})?/g, function (all, k, j, pair) { var v = map[k] == null ? '' : String(map[k]); return v + (pair ? jo(v, pair) : ''); });
}
function txt(k) { var L = DS.LORE && ((DS.LORE.lineage && DS.LORE.lineage[k]) || (DS.LORE.age && DS.LORE.age[k])); var arr = (L && L.length ? L : DS.LIN_TXT[k] || (DS.AGE_TXT && DS.AGE_TXT[k])) || ['']; return typeof arr === 'string' ? arr : arr[0]; }
DS.linEvText = function (s, e) {
  if (!e) return '';
  var x = e.x || {}, nm = function (id) { return id ? DS.linName(s, id) : ''; }, k = e.t;
  if (k === 'part' && x.why === '사별') k = 'widow';
  if (k === 'part' && x.why === '떠남') k = 'gone';
  if (k === 'death' && x.why === '천수를 누림') k = 'deathNat';      // 나이(age.js): 자연사
  if (k === 'part' && x.why === '합일') k = 'fusepart';
  var map = { a: nm(e.a), b: nm(e.b), kid: nm(e.a), house: x.house || nm((x.pa || [])[0]) + '의 집', at: x.at || '전장', full: x.full && x.full !== nm(e.a) ? x.full : '' };
  if (e.t === 'adult' && map.full) { map.a = map.a + ' ' + map.full; map.full = ''; }      // 나이(age.js): 성년 글은 호에 성이름을 붙여 형제를 가른다
  if (e.t === 'birth') map.house = nm((x.pa || [])[0]) + '의 집';
  if (e.t === 'kin' || e.t === 'heir' || e.t === 'adopt') map.b = nm(e.b);
  if (e.t === 'house') map.house = x.name || DS.castHouse(x.to);
  if (e.t === 'lead' || e.t === 'succ') map.house = x.name || x.house || DS.castHouse(x.to) || '가문';
  if (e.t === 'lapse') map.house = x.old || x.house || '가문';      // r35
  if (e.t === 'castHeir') { map.house = DS.castHouse(x.house); var cp = L0(s).P[e.a]; if (cp && x.hd) map.a = x.hd + '대 ' + (cp.n || ''); }      // ⑱ 「센주 가문의 깃발을 2대 달래가 이어 들었습니다」 (집 이름은 앞에 한 번만)
  if (e.t === 'fuse' && x.name && x.clss instanceof Array && x.clss.length) {      // 1.0.1: 고른 세 가문과 묶음 이름
    k = 'fuseU'; map.house = x.clss.map(function (c) { return String((DS.flagHouse ? DS.flagHouse(s, c) : '') || '').replace(/ 가문$/, '') || (DS.CLASSES[c] || {}).name || ''; }).join(', ') + ' 가문'; map.union = x.name + ' 대가문';
  }
  return fillT(txt(k), map);
};
DS.linLog = function (s, n) { var lg = L0(s).log; return (n ? lg.slice(-n) : lg.slice()).reverse(); };

// ── 피붙이 ──
function isKidOf(kid, par) { if (!kid || !par) return false; var pa = kid.pa || []; return pa.indexOf(par.id) >= 0 || !!(par.fu && pa.some(function (x) { return par.fu.indexOf(x) >= 0; })); }
// 3.3.0: 조상 전체 (부모 줄 + 합일 구성원의 부모 줄 + 그 사람이 든 합일체). 모든 걷기에 방문 표시 — 이미 꼬인 가계(부모 고리)에서도 넘치지 않는다
function ancOf(s, p) {
  var P = L0(s).P, out = {}, seen = {}, q = [];
  function push(x) { if (x && !seen[x.id]) { seen[x.id] = 1; q.push(x); } }
  push(p); (p && p.fu instanceof Array ? p.fu : []).forEach(function (f) { push(P[f]); });
  while (q.length) {
    var x = q.shift();
    (x.pa || []).forEach(function (id) {
      var y = P[id]; if (!y || out[y.id]) return;
      out[y.id] = 1; push(y);
      (y.fu instanceof Array ? y.fu : []).forEach(function (f) { if (P[f] && !out[f]) { out[f] = 1; push(P[f]); } });
      if (y.into && P[y.into] && !out[y.into]) { out[y.into] = 1; push(P[y.into]); }
    });
  }
  if (p) { delete out[p.id]; (p.fu instanceof Array ? p.fu : []).forEach(function (f) { delete out[f]; }); }
  return out;
}
DS.linAncestors = function (s, pid) { var p = L0(s).P[pid]; return p ? ancOf(s, p) : {}; };
function related(s, a, b) {
  if (a.id === b.id || isKidOf(a, b) || isKidOf(b, a)) return true;
  if (ancOf(s, a)[b.id] || ancOf(s, b)[a.id]) return true;      // 직계 (조부모·손주까지)
  return (a.pa || []).some(function (x) { return (b.pa || []).indexOf(x) >= 0; });      // 형제자매
}
function kidsOf(s, p, alive) { var P = L0(s).P, out = []; for (var k in P) { var q = P[k]; if (isKidOf(q, p) && (!alive || q.st === 'live' || q.st === 'young')) out.push(q); /* 미성년(age.js)도 산 아이로 센다 — entOf 는 null 이라 슬픔·후계에는 들지 않는다 */ } return out.sort(function (a, b) { return a.id - b.id; }); }
DS.linKids = function (s, pid) { var p = L0(s).P[pid]; return p ? kidsOf(s, p, false) : []; };
DS.linParents = function (s, pid) { var p = L0(s).P[pid], P = L0(s).P; return p ? (p.pa || []).map(function (x) { return P[x]; }).filter(Boolean) : []; };
DS.linSpouse = function (s, pid) { var p = L0(s).P[pid]; return p && p.sp ? L0(s).P[p.sp] || null : null; };

// ── 성별·성 ──
DS.linSetSex = function (s, chId, sx) { var ch = s.chars[chId]; if (!ch || ch.id !== s.hero || (sx !== 'm' && sx !== 'f')) return false; var p = charP(s, ch); if (!p || p.sp) return false; ch.sx = p.sx = sx; return true; };
DS.linSetSurname = function (s, sn) {
  sn = Array.from(String(sn || '').trim()).slice(0, 6).join(''); if (!sn) return false;      // r13: 가문명 2~6자 (옛 한 글자 성도 그대로 받는다)
  var Lr = L0(s), old = Lr.sur; Lr.sur = sn;
  for (var k in Lr.P) { var p = Lr.P[k]; if (p.sn === old && (p.c === s.hero || (p.pa || []).some(function (x) { return Lr.P[x] && Lr.P[x].sn === sn; }))) { p.sn = sn; var e = entOf(s, p); if (e && e.sn != null) e.sn = sn; } }
  return true;
};

// ── 혼인 ──
function bkey(a, b) { return Math.min(a, b) + ':' + Math.max(a, b); }
DS.linCanWed = function (s, a, b, opt) {
  var A = refOf(s, a), B = refOf(s, b);
  if (!A || !B || !A.ent || !B.ent) return { ok: false, why: '찾을 수 없다' };
  if (A.k !== 'c' && B.k !== 'c') return { ok: false, why: '혼인은 대장만 한다' };
  if (A.p.id === B.p.id) return { ok: false, why: '같은 사람입니다' };
  var sa = A.k === 'c' ? A.ent.sx : (mercFix(A.ent), A.ent.sx), sb = B.k === 'c' ? B.ent.sx : (mercFix(B.ent), B.ent.sx);
  if (sa === sb) return { ok: false, why: '성별이 같으면 혼인하지 못한다' };
  if (A.p.sp || B.p.sp) return { ok: false, why: '이미 배우자가 있다' };
  if ((A.k === 'c' && (A.ent.vac || A.ent.down)) || (B.k === 'c' && (B.ent.vac || B.ent.down))) return { ok: false, why: '쓰러진 대장입니다' };
  if (related(s, A.p, B.p)) return { ok: false, why: '가까운 혈육입니다' };
  if (A.p.rv || B.p.rv) return { ok: false, why: '한 번 돌아온 이는 새로 혼인하지 않는다' };      // 3.3.0 규칙 16
  if (!(opt && opt.anywhere) && DS.G && DS.G.save === s && (DS.G.scn || (DS.G.sim && DS.G.sim.combat))) return { ok: false, why: '싸우는 동안에는 혼인하지 못한다' };      // 2.1.0: 마을 일은 어디서나 (시나리오·전투 중만 막는다)
  return { ok: true, why: '' };
};
DS.linWed = function (s, a, b, opt) {
  var ok = DS.linCanWed(s, a, b, opt); if (!ok.ok) return null;
  var A = refOf(s, a), B = refOf(s, b);
  if (A.k !== 'c') { var t = A; A = B; B = t; }      // 집의 주인은 지휘관 (지휘관끼리면 a)
  A.p.sp = B.p.id; B.p.sp = A.p.id;
  L0(s).bd[bkey(A.p.id, B.p.id)] = { b: 0, h: A.p.id, w: Math.round((s.cal && s.cal.t) || 0), y: 0 };      // ⑲ w = 혼인한 때(달력), y = 굴린 해
  if (B.k === 'm' && B.ent) B.ent.lk = 1;      // 4.0: 대장의 배우자는 잠겨 온다 (자동 채움이 뽑지 않는다)
  return logE(s, 'wed', A.p.id, B.p.id);
};
function part(s, p, why) {
  var P = L0(s).P, q = p && p.sp && P[p.sp]; if (!q) { if (p) p.sp = 0; return null; }
  p.sp = 0; q.sp = 0; p.lsp = q.id; q.lsp = p.id;
  delete L0(s).bd[bkey(p.id, q.id)];
  return logE(s, 'part', q.id, p.id, { why: why || '이별' });      // a = 남은 이, b = 떠난 이 (사별 글이 「b 를 먼저 보낸 a」)
}
DS.linPart = function (s, r, why) { var R = typeof r === 'object' ? refOf(s, r) : { p: L0(s).P[r] }; return R && R.p ? part(s, R.p, why || '이별') : null; };
DS.linBond = function (s, pid) { var p = L0(s).P[pid], e = p && p.sp && L0(s).bd[bkey(p.id, p.sp)]; return e ? { b: e.b, need: DS.LIN_BOND, h: e.h, block: DS.linBirthBlock(s, e.h) } : null; };

// ── 슬픔·유지 ──
function mood(e, k) { if (e) e.gr = { k: k, n: DS.LIN_MOOD[k].n }; }
DS.linMood = function (e) { var g = e && e.gr, M = g && DS.LIN_MOOD[g.k]; return M ? { k: g.k, name: M.name, desc: M.desc, n: g.n, v: M.v } : null; };
function griefFam(s, p, evs) {      // p 가 죽었다: 배우자·부모·자식에게 비탄
  var P = L0(s).P, who = [];
  if (p.sp && P[p.sp]) who.push(P[p.sp]);      // 부르는 쪽이 혼인을 끝내기 전에 부른다
  (p.pa || []).forEach(function (x) { if (P[x]) who.push(P[x]); });
  kidsOf(s, p, true).forEach(function (q) { who.push(q); });
  who.forEach(function (q) { var e = entOf(s, q); if (!e || q.st !== 'live') return; mood(e, 'grief'); evs.push({ t: 'grief', a: q.id, b: p.id, rel: q.id === p.sp ? 'spouse' : isKidOf(q, p) ? 'child' : 'parent' }); });
}

// ── 출산 ──
DS.linBirthBlock = function (s, hpid) {
  if (DS.reserve(s).length >= DS.MERC_MAX) return '막사가 차서 아이를 맞지 못한다';
  var hp = L0(s).P[hpid]; if (hp && kidsOf(s, hp, true).filter(function (q) { return !q.ad; }).length >= DS.LIN_KIDS) return '이 집에는 이미 아이가 셋입니다';
  return '';
};
// ⑭-4 잠재력: 부모 두 사람 각각의 (등급 + 공훈 계급/2) 평균 + 운(−1~+1), 1~5 로 자른다. 대장 쪽은 대장 깃발 7단 이상이면 +1.
//   luck3 = 0~3 의 수 (난수 또는 해시) → 운 −1·0·+1. 부모 기록만 있는 옛 아이도 같은 식 (DS.potFix)
// ⑰-2 잠재력 = 배우자 등급 + 운(−1·0·+1), 대장 깃발 7단 이상이면 운이 +1 쪽으로 조금 기운다 (1~5). 태어날 때 정해지고 바뀌지 않는다.
//   r = 0~1 의 수 (난수 또는 해시). 기본 운: r < 1/3 → −1, < 2/3 → 0, 그 밖 +1 · 7단 이상: 0.25 / 0.55
function spG(s, q) { if (!q) return 2; var e = entOf(s, q), sn = q.snap || {}; return Math.max(1, Math.min(5, Math.round(+((e && e.g) || q.g || sn.g || 2)))); }
DS.potOf = function (s, sp, r, hi) { var a = hi ? 0.25 : 1 / 3, b = hi ? 0.55 : 2 / 3, luck = r < a ? -1 : r < b ? 0 : 1; return Math.max(1, Math.min(5, spG(s, sp) + luck)); };
DS.potHi = function (s) { var h = s.chars[s.hero]; return !!h && DS.tierOfL(h.L) >= 7; };
DS.potOf2 = function (m) { var p = m && (m.pot >= 1 && m.pot <= 5 ? m.pot : m.g); return p >= 1 && p <= 5 ? Math.round(p) : 0; };      // r44: 잠재력 = 적힌 ★, 없으면 등급 (모집한 이·아홉·맹주 — 아이는 늘 ★ = 등급으로 태어난다)
DS.potMul = function (m) { var p = DS.potOf2(m), k = m && DS.KIND_GROW && DS.KIND_GROW[m.type] || 1; return (p >= 1 && p <= 5 ? 1 + 0.15 * (p - 3) : 1) * k; };      // r42: 경험치가 쌓이는 속도 (★1 −30% … ★5 +30%) × ⑳ 장수 종족의 더딘 성장
DS.meritAdd = function (m, pts, sv) { if (!m) return 0; var S = sv || (DS.G && DS.G.save), h = S && DS.whoHouse ? DS.whoHouse(S, m) : null; if (h && DS.hAdd) DS.hAdd(S, h, pts); return h ? pts : 0; };      // r42: 공은 그 사람이 선 가문의 공훈으로 (막사 사람은 쌓지 않는다)
// 옛 아이(대장 집의 핏줄)에게 한 번: 부모 기록으로 계산해 채운다 (등급은 바꾸지 않는다 — 무손실)
DS.potFix = function (s) {
  var P = L0(s).P, n = 0;
  for (var k in P) { var q = P[k]; if (!q.hb || q.pot != null || q.st === 'dead' || q.st === 'coffin') continue; var pa = (q.pa || []).map(function (x) { return P[x]; }).filter(Boolean), sp = pa.filter(function (x) { return !(x.k === 'c' || x.hand || (x.seat && x.seat === s.hero)); })[0] || pa[1]; q.pot = DS.potOf(s, sp, hsh(q.id, 451, 3), false); n++; }      // 배우자 = 대장 자리를 거치지 않은 쪽 부모
  (s.mercs || []).forEach(function (m) { var q = m.pid && P[m.pid]; if (q && q.m === m.id && q.pot != null) m.pot = q.pot; else if (m.pot != null && !(m.pot >= 1 && m.pot <= 5)) delete m.pot; });
  return n;
};
function birth(s, hp, sp, rnd) {
  var r = rnd || Math.random, ch = entOf(s, hp), se = entOf(s, sp); if (!ch || !se || !ch.cls || ch.id !== s.hero || hp.rv || sp.rv) return null;      // 3.3.0: 돌아온 이는 아이를 두지 않는다 · 4.0: 아이를 낳는 사람은 대장뿐
  var pot = DS.potOf(s, sp, r(), DS.potHi(s)), g = pot;      // ⑰-2: 아이의 잠재력(별 1~5) = 배우자 등급 + 운 — 아이 등급 = 잠재력
  var ps = ch.ps && DS.MERCS[ch.ps.type] && !DS.MERCS[ch.ps.type].pop ? ch.ps.type : DS.baseMercTypes(ch.cls)[0], alt = sp.k === 'm' ? (DS.MERCS[se.type].pop ? null : se.type) : DS.baseMercTypes(se.cls)[0];
  var type = alt && r() < 0.5 ? alt : ps;      // 4.0: 종류 = 배우자의 종류 또는 대장의 사람 종류
  if (DS.ageYoung) {      // 나이(age.js): 갓난아기로 가계도에만 태어나, 15살 성년에 막사로 (DS.ageCheck)
    var y = DS.ageYoung(s, hp, sp, type, g, r), ttl = heroName(s, hp.gen + 1);
    var yp = mkP(s, { k: 'm', sn: houseSn(s, ch), n: y.ya.n, sx: y.ya.sx, gen: hp.gen + 1, pa: [hp.id, sp.id], ttl: ttl, type: type, g: g, m: 0, gv: 1, hb: 1 });
    yp.pot = pot; yp.st = 'young'; yp.ya = y.ya; yp.by = y.by; yp.ls = y.ls; yp.nf = 1;      // 4.0.6: 이름은 처음 한 번 무료로 정한다
    if (DS.tmBirth) DS.tmBirth(s, yp, hp, sp);      // r41 temper: 부모의 기질을 닮는다 (성년에 DS.tmSync 가 부대원에게 옮긴다)
    return { t: 'birth', a: yp.id, young: 1, pa: [hp.id, sp.id], ev: logE(s, 'birth', yp.id, 0, { pa: [hp.id, sp.id], young: 1 }) };
  }
  var m = DS.addMerc(s, type, g, 0);
  m.sx = r() < 0.5 ? 'm' : 'f'; m.sn = houseSn(s, ch); m.ttl = heroName(s, hp.gen + 1); m.lk = 1;
  var p = mkP(s, { k: 'm', sn: m.sn, n: m.n, sx: m.sx, gen: hp.gen + 1, pa: [hp.id, sp.id], ttl: m.ttl, type: type, g: g, m: m.id, gv: 1, hb: 1 });
  m.pid = p.id; m.pot = p.pot = pot; m.nf = 1;
  if (DS.tmBirth) m.tm = DS.tmBirth(s, p, hp, sp).slice();      // r41 temper
  var e = logE(s, 'birth', p.id, 0, { pa: [hp.id, sp.id] });
  return { t: 'birth', a: p.id, mid: m.id, pa: [hp.id, sp.id], ev: e };
}
// ⑲ 출산: 대장 부부가 함께 살아 있는 동안 혼인한 날부터 게임 1년이 지날 때마다 한 번 — p = p0 × d^(혼인 뒤 해 − 1) × 0.5^(이 대장의 친자식 수). 상한 없음, 막사가 가득해도 태어난다.
//   결정적 씨앗(저장 씨앗 + 대장 사람 번호 + 혼인 뒤 해) — 불러오기로 다시 굴릴 수 없다. 해 바뀜(age.js ageCheck)과 스무 해 창이 같은 함수를 부른다. 재혼하면 그날부터 다시 센다.
DS.LIN_BIRTH = { p0: 0.4, d: 0.85, half: 0.5 };
DS.linBirthP = function (yr, kids) { var B = DS.LIN_BIRTH; return B.p0 * Math.pow(B.d, Math.max(0, yr - 1)) * Math.pow(B.half, kids); };
DS.linBirthYear = function (s, rnd) {
  var Lr = L0(s), evs = [], ch = s.chars[s.hero], hp = ch && !ch.vac && !ch.down && ch.pid ? Lr.P[ch.pid] : null; if (!hp || !hp.sp) return evs;
  var sp = Lr.P[hp.sp], b = Lr.bd[bkey(hp.id, hp.sp)]; if (!sp || sp.st !== 'live' || !b || hp.rv || sp.rv) return evs;
  var Y = (DS.AGE && DS.AGE.year) || 600, now = (s.cal && s.cal.t) || 0;
  if (b.w == null || !isFinite(+b.w)) { b.w = Math.round(now); b.y = 0; }
  var yrs = Math.floor((now - b.w) / Y), seed = (s.eg && s.eg.seed) || 1, guard = 0;
  while ((b.y || 0) < yrs && guard++ < 60) {
    b.y = (b.y || 0) + 1;
    var kids = kidsOf(s, hp, false).filter(function (q) { return !q.ad && (q.pa || [])[0] === hp.id; }).length;
    if (hsh(seed + hp.id, b.y, 7411) < DS.linBirthP(b.y, kids)) { var ev = birth(s, hp, sp, rnd || DS.rng((seed + hp.id * 131 + b.y * 7) | 0)); if (ev) { ev.yr = b.y; evs.push(ev); } }
  }
  return evs;
};
// 시나리오 사이: 전투 유닛에서 살아서 끝난 출전자
DS.linPresent = function (sim) {
  var o = { cmds: [], mercs: [] }; if (!sim) return o;
  sim.units.forEach(function (u) { if (u.side !== 'ally' || u.dead) return; if (u.role === 'cmd' && u.ch) o.cmds.push(u.ch); else if (u.role === 'merc' && u.mid) o.mercs.push(u.mid); });
  return o;
};
// 시나리오(갱도 포함)가 끝났다: 슬픔·유지 판 수를 줄이고, 이겼으면 함께 싸운 부부의 정을 올리고 아이를 맞는다. o = { win, cmds: [chId], mercs: [mid] }
// 4.0: 나선 방지(연패 면제)는 없어졌다 — 후계가 레벨을 잃지 않으므로. 옛 부르는 쪽이 넘어지지 않게 이름만 남긴다
DS.LIN_STREAK = 2;
DS.linScnKey = function (sc) { return sc ? (sc.pit ? 'p' + sc.pit : String(sc.id)) : ''; };
DS.linStreak = function (s) { return { k: '', n: 0, exempt: false }; };
DS.linAfterScn = function (s, o, rnd) {
  o = o || {}; var evs = [], Lr = L0(s);
  DS.charList(s).concat(s.mercs).forEach(function (e) { if (e.gr) { e.gr.n--; if (!(e.gr.n > 0)) delete e.gr; } });
  var hch = s.chars[s.hero]; if (hch && hch.ps && hch.ps.gr) delete hch.ps.gr;
  if (!o.win) return evs;
  var here = function (p) { if (p.c) return (o.cmds || []).indexOf(p.c) >= 0; if (!p.m) return false; if ((o.mercs || []).indexOf(p.m) >= 0) return true; var e = merc(s, p.m); return !!(e && e.h && e.o && (o.cmds || []).indexOf(e.o) >= 0); };      // 4.0: 깃발을 든 배우자는 그 깃발 유닛으로 싸운다
  var hpid = hch && hch.pid;
  Object.keys(Lr.bd).forEach(function (key) {
    var b = Lr.bd[key], ids = key.split(':').map(Number), a = Lr.P[ids[0]], c = Lr.P[ids[1]];
    if (!a || !c || a.st !== 'live' || c.st !== 'live' || a.sp !== c.id) { delete Lr.bd[key]; return; }
    if (b.h !== hpid) return;      // 4.0: 집 주인이 대장인 쌍만 정이 쌓인다 (옛 아홉 집의 부부는 기록대로 둔다)
    if (!here(a) || !here(c)) return;
    b.b = Math.min(DS.LIN_BOND, (b.b || 0) + 1);      // ⑲: 정 셈은 기록으로만 — 출생은 해마다 확률로 (DS.linBirthYear)
  });
  return evs;
};

// ── 죽음 ──
function snapMerc(m) { var o = { id: m.id, type: m.type, g: m.g, t: m.t, v: m.v || 0, L: DS.pL(m), k: m.k || 0, b: m.b || 0 }; if (m.fz) o.fz = 1; ['q', 'bk', 'sv', 'it', 's', 'nk', 'ttl', 'pk', 'rv', 'lw'].forEach(function (k) { if (m[k] != null) o[k] = m[k]; }); var tt = DS.mercTitle ? DS.mercTitle(m) : ''; if (tt) o.title = tt; return o; }
function emptyCoffins(s) { var c = s.coffins; return c ? Math.max(0, c.have - c.list.length) : 0; }
// 용병(아이 포함)이 죽었다 (DS.loseMerc 뒤에 부른다: m = 잃은 용병). 가계도에 오른 이거나 빈 관이 있으면 사람으로 남긴다.
DS.linMercDied = function (s, m, at, why) {
  var evs = []; if (!m) return evs;
  var P = L0(s).P, p = m.pid && P[m.pid] && P[m.pid].m === m.id ? P[m.pid] : null, fb = m.h && m.o && s.chars[m.o] ? m.o : 0;      // ⑭-3: 쓰러질 때 깃발을 들고 있었는가 (관에 모실 수 있는 이)
  if (!p && !emptyCoffins(s) && !(s.eg && s.eg.pass)) return evs;      // ⑰-1: 관은 누구나 (빈 관이 있을 때 임시 사람)      // 3.3.0: 스무 해 창 동안은 빈 관이 없어도 사람으로 남긴다 (끝 면에서 내려 묻고 모실 수 있게)
  if (!p) { mercFix(m); p = mkP(s, { k: 'm', sn: m.sn, n: m.n, sx: m.sx, type: m.type, g: m.g, m: 0, gv: 1, ttl: m.ttl }); }
  p.type = m.type; p.g = m.g; p.n = m.n; p.st = 'dead'; p.m = 0; p.snap = snapMerc(m); if (m.lw) p.lw = String(m.lw).slice(0, 24);      // r32: 마지막 한마디
  p.d = { at: at || '', why: why || '전사', s: scnN(s), tm: Math.round(s.time || 0), fr: 1 };
  if (fb) p.d.fb = fb;
  griefFam(s, p, evs);
  if (p.sp) part(s, p, '사별');
  evs.unshift({ t: 'death', a: p.id, k: 'm', fb: fb, ev: logE(s, 'death', p.id, 0, { at: at || '', why: why || '전사', k: 'm' }) });
  return evs;
};
// 싸움이 끝났다: 쓰러진(ch.down) 지휘관의 죽음을 확정하고 자리를 비운다 (→ 후계 의식). 사건 목록.
DS.linSettle = function (s, at) {
  var evs = [];
  DS.charList(s).forEach(function (ch) {
    if (!ch.down || ch.vac || ch.id !== s.hero) return;      // 4.0: 미뤄진 죽음은 대장 줄에만 (든 사람·따르는 이는 그 자리에서 확정된다)
    var p = charP(s, ch); sync(s, p);
    var sp = p.sp ? L0(s).P[p.sp] : null;
    p.snap = { cls: ch.cls, L: ch.L, w: ch.w || null, a: ch.a || null };
    if (ch.id === s.hero) p.ttl = DS.charName(ch);      // 3.3.0: 가주였던 이의 호 (「한울 2세」) — 태어날 때 받은 호 대신
    p.st = 'dead'; p.c = 0; p.seat = ch.id;
    p.d = { at: at || '', why: '전사', s: scnN(s), tm: Math.round(s.time || 0), fr: 1 };
    var e1 = logE(s, 'death', p.id, 0, { at: at || '', why: '전사', k: 'c', cls: ch.cls });
    ch.vac = { pid: p.id, at: at || '' }; ch.pid = 0; ch.down = true; delete ch.gr;
    evs.push({ t: 'death', a: p.id, k: 'c', ch: ch.id, ev: e1 });
    griefFam(s, p, evs);
    if (sp) part(s, p, '사별');
    evs.push({ t: 'rite', ch: ch.id, a: p.id });      // 후계 의식이 필요하다 (DS.linHeirs → DS.linSucceed)
  });
  DS.linTidy(s);
  return evs;
};
DS.linVacant = function (s) { return DS.charList(s).filter(function (c) { return !!c.vac && c.id === s.hero; }); };      // 4.0: 빈자리(후계 의식)는 대장 자리뿐
// 전투가 시작된다: 갓 죽은 이의 관 모시기 창은 닫힌다
DS.linBattleStart = function (s) { var P = L0(s).P; for (var k in P) if (P[k].d && P[k].d.fr) delete P[k].d.fr; DS.linPrune(s); };
// r8 (tech 3): 가계도 밖에서 쓰러진 용병의 임시 사람을 걷어 낸다 — 빈 관이 있을 때 「관에 모신다」를 고를 수 있게 잠깐 만든 것(DS.linMercDied)이 영영 남아
//   명부(lin.P)와 사건 300칸을 이름 없는 전사로 채우던 것. 지우는 이: 죽은 용병 가운데 모실 때(d.fr)가 지났고, 관에 없고, 부모·배우자(사별 포함)·자식·입양·합일·깃발 자리 어느 연결도 없는 사람. 그 사람의 사건도 함께.
DS.linPrune = function (s) {
  var Lr = L0(s), P = Lr.P, keep = {}, cut = {}, n = 0, k, mark = function (id) { if (id) keep[id] = 1; };
  for (k in P) { var q = P[k]; (q.pa || []).forEach(mark); (q.fu instanceof Array ? q.fu : []).forEach(mark); mark(q.sp); mark(q.lsp); }
  ((s.coffins && s.coffins.list) || []).forEach(function (r) { if (r) mark(r.pid); });
  DS.charList(s).forEach(function (ch) { mark(ch.pid); if (ch.vac) mark(ch.vac.pid); });
  (s.mercs || []).forEach(function (m) { mark(m.pid); });
  for (k in P) {
    var p = P[k];
    if (p.k !== 'm' || p.st !== 'dead' || (p.d && p.d.fr) || keep[p.id] || (p.pa && p.pa.length) || p.sp || p.lsp || p.ad || p.kin || p.fu || p.c || p.m || p.seat || (p.snap && p.snap.cls) || p.rv || p.d0 || p.hand || p.cast || p.hb || p.gv && p.cls) continue;
    cut[p.id] = 1; delete P[k]; n++;
  }
  if (n) Lr.log = Lr.log.filter(function (e) { return !(cut[e.a] || cut[e.b]); });
  return n;
};
function evKindBad(k) { return k in Object.prototype; }      // 깨진 저장의 사건 종류 「constructor」·「toString」 따위 — 글 표(DS.LIN_TXT[k])가 물려받은 함수를 집어 「undefined」 글로 새던 것. 그 밖의 모르는 종류는 지우지 않는다(새 판의 사건일 수 있다 — 글은 빈 줄)

// ── 후계 (4.0: 대장 한 자리뿐 — 설계서 ④-1 · ⑬) ──
// 후보: 1) 핏줄(P.hb — 대장 집에서 태어난 성년 누구나, 앞 대의 아이 포함). 한 명이라도 있으면 그 가운데서 고른다
//       2) 핏줄 성년이 없으면 부대원을 양자·양녀로 (제외: 고인의 배우자 · 아홉(cast) · 고인의 조상 · 돌아온 이(rv·ret) · 깃대를 넘긴 이)
//       3) 후보가 0명이면 모집 한 번이 값없이 돈다 (kind 'pull')
// 잇는 것: 「{이름} N세」 · 가문의 성 · 대장의 깃발 · 유지 2판. 깃발의 레벨은 깎이지 않는다(LIN_LOSS 없음). 핏줄은 고인의 공훈과 제 공훈 가운데 큰 쪽, 양자는 제 공훈.
// ⑬·⑯ 양자가 대장과 다른 병과의 깃발을 들고 있던 사람이면 가문의 문패가 바뀐다 (move) — 대장 깃발은 그대로, 문패(이름 opt.house · 문장 lin.hs · 호 opt.ho)만 새로 건다.
// 문패: lin.hn = 지금 가문 이름(없으면 「{성}가」), lin.hns = [{ n 옛 이름, hs 옛 문장, g 대, s 판 }] 옛 문패들
DS.houseName = function (s) { var h = s && s.chars && s.chars[s.hero]; if (h && DS.flagHouse) { var n = DS.flagHouse(s, h.cls); if (n) return n; } var Lr = L0(s); return DS.houseOf(Lr.sur || '') || '대장 가문'; };      // 2.1.0: 맹주가 선 가문 줄의 이름 (다른 가문과 같은 규칙 — 문패가 옮겨 가지 않는다)
DS.houseDefault = function (s, p, bf) { return (p && (p.osn || p.sn) ? DS.houseOf(p.osn || p.sn) : bf ? DS.castHouse(bf.cls) : '새 가문'); };      // 「스타크 가문」 — 가장 긴 가문명(6자)도 문패 규칙(띄어쓰기 빼고 8자)에 든다
// ⑱ 이름 규칙 하나 (개명·문패·호): 한글·영문 1~8자(띄어쓰기는 세지 않는다), 금칙어(욕설·운영진 사칭) 거르기
DS.NAME_BAN = ['운영', '관리자', 'GM', 'gm', 'admin', '개발자', '시발', '씨발', '병신', '좆', '존나', '새끼', 'fuck', 'shit'];
DS.nameOK = function (t) { t = String(t || '').trim(); var bare = t.replace(/ /g, ''); if (bare.length < 1 || bare.length > 8 || !/^[가-힣A-Za-z ]+$/.test(t)) return false; var low = t.toLowerCase(); return !DS.NAME_BAN.some(function (w) { return low.indexOf(w.toLowerCase()) >= 0; }); };
DS.linHouseOK = function (t) { return DS.nameOK(t); };
// 돌려주는 줄: { kind:'kid'|'adopt'|'pull', blood, kin(0 핏줄 · 2 막사 · 3 따르는 이 · 4 깃발 든 이 · 5 모집), mid, pid, name, full, sx, g, type, x, o, h(든 깃발 번호), L, loss:0, why, move, house }
DS.LIN_WHY = { kid: '핏줄. 선대와의 레벨 차이 일부를 잇는다', adopt: '양자. 선대와의 레벨 차이 일부를 잇는다', pull: '부대에 이을 사람이 없다. 해밀 용병소가 한 사람을 보낸다.', move: '다른 가문의 가주. 맹주만 바뀌고 가문은 그대로다' };
// 2.1.0 대물림: 선대와의 레벨 차이 가운데 잇는 몫 — 그 가문의 공훈 계급이 높을수록 크다 (계급 0 → 맨 위). 대가 내려가며 약해져도 된다 (따라잡기 보정 없음)
//   house: 맹주 밖 가문의 자동 후계 · kid: 맹주의 핏줄 · adopt: 맹주의 양자, 맹주로 세운 다른 가문의 가주 (그 사람 가문의 계급으로)
DS.HEIR = { house: [0.35, 0.55], kid: [0.5, 0.7], adopt: [0.25, 0.4] };
DS.heirShare = function (kind, ch) { var H = DS.HEIR[kind] || DS.HEIR.adopt, top = Math.max(1, ((DS.HVET && DS.HVET.length) || 6) - 1), r = ch && DS.hRank ? DS.hRank(ch) : 0; return H[0] + (H[1] - H[0]) * Math.max(0, Math.min(1, r / top)); };
DS.heirLOf = function (own, pre, k, cap) { own = Math.max(1, Math.round(+own || 1)); var gap = Math.max(0, Math.round(+pre || 0) - own); return Math.min(cap || 70, own + Math.ceil(gap * k)); };
// r42: 후계가 앉을 맹주 가문 — 맹주 가문이 아닌 다른 병과 가문의 가주(깃발 든 이)·가솔이었으면 그 가문 (아홉은 castRow 가 제 집으로). 아니면 null (맹주 가문 그대로)
function heirHouse(s, m, seat) {      // 2.1.0: 다른 가문의 「가주」만 (그 가문의 가솔은 맹주의 집에 양자로 든다 — 그 가문의 가주를 밀어내지 않는다)
  var o = m && m.h && m.o && s.chars[m.o]; if (!o || o.id === seat.id || o.cls === seat.cls) return null;
  return o;
}
// r42 계승: 후계는 제 레벨을 지니고, 선대와의 차이 가운데 핏줄은 절반, 양자·아홉은 1/4 을 받는다 (합일하지 않았으면 70 까지)
function heirL(s, m, seat, kind) {
  var own = DS.pL(m), pre = seat && seat.ps && seat.ps.L != null ? DS.pL(seat.ps) : seat ? seat.L : own;
  var hf = kind !== 'kid' ? heirHouse(s, m, seat) : null;      // 2.1.0: 다른 가문의 가주를 맹주로 세우면 그 사람 가문의 계급으로
  var k = kind === 'pull' ? 0 : DS.heirShare(kind === 'kid' ? 'kid' : 'adopt', hf || seat);
  return DS.heirLOf(own, pre, k, DS.pCap ? DS.pCap(m) : 70);
}
DS.linHeirL = heirL;
DS.linHeirs = function (s, chId) {
  var ch = s.chars[chId]; if (!ch || +chId !== +s.hero) return [];
  var P = L0(s).P, dp = ch.vac ? P[ch.vac.pid] : charP(s, ch), L = ch.L, out = [], blood = [], cast = [], hid = s.hero;
  var spouse = dp ? dp.sp || dp.lsp || 0 : 0, anc = dp ? ancOf(s, dp) : {};
  s.mercs.forEach(function (m) {
    var p = m.pid && P[m.pid] && P[m.pid].m === m.id ? P[m.pid] : null;
    if (p && (p.id === spouse || p.hand || p.rv || p.ret || anc[p.id])) return;
    if (m.cast) { var cr = castRow(s, m, p, ch, L); if (cr) cast.push(cr); return; }      // r22: 아홉(과 그 집 2대)은 성을 바꾸지 않는다 — 대신 그 집이 맹주 가문이 된다
    var bf = DS.bearsFlag ? DS.bearsFlag(s, m) : null, isB = !!(p && p.hb && !p.ad);
    var row = { kind: isB ? 'kid' : 'adopt', blood: isB, kin: isB ? 0 : bf ? 4 : m.o ? 3 : 2, mid: m.id, pid: p ? p.id : 0, name: DS.mercCall(m) || m.n, full: DS.fullName(m), sx: m.sx || (mercFix(m), m.sx), g: m.g, type: m.type, x: DS.pL(m), pL: DS.pL(m), o: m.o || 0, h: bf ? bf.id : 0, L: L, loss: 0 };
    var hf = !isB ? heirHouse(s, m, ch) : null;      // r42: 다른 가문의 가주·가솔이면 맹주 가문이 그 가문으로 옮겨 간다
    row.move = !!hf; if (hf) row.hf = hf.id; row.nL = heirL(s, m, ch, isB ? 'kid' : 'adopt'); if (m.pot) row.pot = m.pot;
    row.house = row.move ? hf.cls : '';
    row.why = DS.LIN_WHY[row.move ? 'move' : row.kind];
    (isB ? blood : out).push(row);
  });
  var by = function (a, b) { return a.kin - b.kin || (b.pL || 0) - (a.pL || 0) || b.g - a.g || a.mid - b.mid; };      // r42: 개인 레벨 순
  var list = blood.sort(by).concat(out.sort(by));      // ⑭-1: 대장이 쓰러질 때마다 핏줄과 양자 후보를 함께 띄운다 (자동은 핏줄 우선 — 줄 차례)
  Object.keys(P).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) {      // 미성년 핏줄: 흐린 줄
    var q = P[k]; if (q.st !== 'young' || q.ad || !q.hb || anc[q.id]) return;
    var age = DS.ageOf ? DS.ageOf(s, q) : null;
    list.push({ kind: 'kid', young: true, blood: true, kin: 9, inY: age == null ? null : Math.max(1, ((DS.AGE && DS.AGE.adult) || 15) - age), pid: q.id, name: DS.linName(s, q.id), sx: q.sx, L: L, loss: 0 });
  });
  if (!list.filter(function (h) { return !h.young; }).length) list.push({ kind: 'pull', blood: false, kin: 5, mid: null, pid: 0, name: '해밀 용병소가 보낼 사람', L: L, loss: 0, why: DS.LIN_WHY.pull });
  return list.concat(cast.sort(by));      // r22: 아홉은 맨 뒤 (자동 후계는 고르지 않는다 — kin 6, 값없는 모집 다음)
};
// r22 아홉의 후계 줄: 성은 그대로, 그 집(병과 key)이 맹주 가문이 된다 = ⑬ move 길을 그대로 쓴다 (row.move · row.house · row.hf = 그 집 깃발)
//   제외: 고인의 배우자·조상·돌아온 이 (위에서 걸렀다), 대장이 이미 그 집 병과로 선 판(㉑), 그 집 깃발이 없는 판
DS.LIN_WHY.cast = '성은 그대로';
function castRow(s, m, p, ch, L) {
  var key = m.cast, flag = DS.castFlag ? DS.castFlag(s, key) : null;
  if (!DS.CAST_NAME || !DS.CAST_NAME[key] || !flag || flag.id === ch.id) return null;
  var bf = DS.bearsFlag ? DS.bearsFlag(s, m) : null;
  var row = { kind: 'adopt', blood: false, kin: 6, cast: key, mid: m.id, pid: p ? p.id : 0, name: DS.mercCall(m) || m.n, full: DS.fullName(m), sx: m.sx || (mercFix(m), m.sx), g: m.g, type: m.type, x: DS.pL(m), pL: DS.pL(m), nL: heirL(s, m, ch, 'adopt'), o: m.o || 0, h: bf ? bf.id : 0, hf: flag.id, L: L, loss: 0, move: true, house: key, hn: DS.castHouse(key), why: DS.LIN_WHY.cast };
  if (m.pot) row.pot = m.pot;
  return row;
}
// 자동(봇·화면 없음·저장 읽기): 핏줄(공훈 순) → 막사 부대원(공훈 순, 아홉 제외) → 따르는 이 → 깃발 든 이 → 모집 한 번
DS.linAutoPick = function (s, chId, opt) { var skip = opt && opt.skip; return DS.linHeirs(s, chId).filter(function (h) { return !h.young && !h.cast && !(skip && skip(h)); }).sort(function (a, b) { return a.kin - b.kin; })[0] || null; };
// opt.ho: 가문이 옮겨 갈 때의 호 — { k: 'new' (기본 — 「{이름} 1세」) | 'cont' (대수를 이어 「{이름} N세」) | 'free', t: 직접 입력 (한글 1~6자 + 선택적 「N세」) }
DS.linHoOK = function (t) { var m = /^(.+?)( ?[0-9]{1,3}세)?$/.exec(String(t || '').trim()); return !!m && DS.nameOK(m[1]); };
DS.linSucceed = function (s, chId, pick, opt) {
  var ch = s.chars[chId]; if (!ch || !ch.vac || +chId !== +s.hero) return null;
  if (pick && pick.young) return null;
  opt = opt || {};
  var Lr = L0(s), dp = Lr.P[ch.vac.pid], dgen = dp ? dp.gen : 1, evs = [], L = ch.L;
  if (!pick) pick = DS.linAutoPick(s, chId, opt);
  var m = null, fresh = false;
  if (!pick || pick.kind === 'pull' || pick.mid == null) {      // 이을 사람이 없다: 모집 한 번이 값없이 돈다
    var pity = s.pity; m = DS.pullMerc(s, opt.rnd || Math.random, opt.minG || 0); s.pity = pity; fresh = true;
    evs.push({ t: 'pull', mid: m.id, text: DS.LIN_WHY.pull });
  } else m = merc(s, +pick.mid);
  if (!m) return null;
  var p = mercP(s, m, true);
  if (dp && p.id === (dp.sp || dp.lsp)) return null;
  var ck = m.cast && DS.CAST_NAME && DS.CAST_NAME[m.cast] ? m.cast : '', cf = ck && DS.castFlag ? DS.castFlag(s, ck) : null;      // r22: 아홉의 후계 — 그 집 깃발(합일 뒤에는 마스터 깃발)로 문패가 옮겨 간다
  if (ck && (!cf || cf.id === ch.id)) return null;
  if (p.hand || p.rv || p.ret) { if (!fresh) return null; }
  if (dp && ancOf(s, dp)[p.id]) return null;      // 조상 가드 (부모 고리)
  var isB = !!(p.hb && !p.ad) && !ck, bf = ck ? cf : !isB ? heirHouse(s, m, ch) : null, move = !isB && !!bf && bf.id !== ch.id && bf.cls !== ch.cls, oldHs = Lr.hs || ch.cls, kind = isB ? 'kid' : 'adopt';      // r42: 다른 가문의 가주·가솔이던 양자, 아홉 → 맹주 가문이 그 가문으로 옮겨 간다
  var dps = ch.ps || {}, x0 = m.x || 0, nL = fresh ? DS.pL(m) : heirL(s, m, ch, kind);
  if (!isB) {
    if (dp && (p.pa || []).indexOf(dp.id) < 0) p.pa = (p.pa || []).concat([dp.id]); p.ad = 1; p.osn = p.sn; p.gen = dgen + 1;
    if (move) { Lr.osur = Lr.sur; Lr.sur = p.sn || Lr.sur; }      // 2.1.0: 다른 가문의 가주가 맹주가 되면 맹주의 핏줄 성이 그 사람의 성이 된다 (가문 이름·연맹 이름은 그대로)
    else p.sn = m.sn = Lr.sur;
    evs.push({ t: 'adopt', a: p.id, b: dp ? dp.id : 0, ev: logE(s, 'adopt', p.id, dp ? dp.id : 0, { osn: p.osn }) });
  }
  if (m.it && DS.giveMercItem) DS.giveMercItem(s, m.id, null);      // 들고 있던 물건은 가방으로
  var ps = { type: m.type, g: m.g, t: m.t, v: m.v || 0, L: nL, exp: nL > DS.pL(m) ? 0 : +m.exp || 0, k: m.k || 0, b: m.b || 0 };      // r42: 제 레벨 + 계승 몫
  if (m.fz) ps.fz = 1; if (m.pot) ps.pot = m.pot;
  var ub = DS.ultBorn ? DS.ultBorn(m) : null; if (ub) { ps.ul = ub; ps.ulr = 1; }      // 2.1.0: 타고난 필살기는 맹주가 되어도 제 것 (5단에 깨어난다)
  ['q', 'bk', 'sv', 's', 'nk', 'pk'].forEach(function (k) { if (m[k] != null) ps[k] = m[k]; });
  if (DS.tmCarry) { DS.tmCarry(m, ps); p.tm = ps.tm.slice(); if (dp && !dp.tm && dps.tm) dp.tm = dps.tm.slice(); }      // r41 temper: 기질·받은 성장은 사람을 따라간다
  p.snap = snapMerc(m);
  var hpR = m.hp == null ? 1 : m.hp, mgr = m.gr;
  var seat = ch;
  if (move) {      // 2.1.0: 바뀌는 것은 맹주가 누구인가뿐 — 맹주 자리(s.hero)가 그 사람의 가문 줄로 간다 (맹주의 병과 = 그 사람의 병과). 가문 이름·공훈·연맹 이름은 그대로, 옛 맹주의 가문은 자동 후계를 맞는다
    var gen1 = dgen + 1, own = p.n || m.n || '대장', ho = opt.ho || { k: 'new' };      // 호: 「{이름} 1세」부터 (고르면 대수를 잇거나 직접)
    if (ho.k === 'free' && DS.linHoOK(ho.t)) { var mt = /^(.+?) ?([0-9]{1,3})세$/.exec(String(ho.t).trim()); if (mt) Lr.gb = { b: mt[1], o: gen1 - +mt[2] }; else Lr.gb = { b: String(ho.t).trim(), o: gen1 - 1, one: 1 }; }
    else if (ho.k === 'cont') Lr.gb = { b: own, o: 0 };
    else Lr.gb = { b: own, o: gen1 - 1 };
    var hx = { from: ch.cls, to: bf.cls, osn: Lr.osur || '', name: DS.flagHouse ? DS.flagHouse(s, bf.cls) : '', old: DS.flagHouse ? DS.flagHouse(s, ch.cls) : '' }; if (ck) hx.cast = ck;
    evs.push({ t: 'house', a: p.id, from: ch.cls, to: bf.cls, name: hx.name, cast: ck || undefined, ev: logE(s, 'lead', p.id, dp ? dp.id : 0, hx) });
    if (ck) { p.cast = ck; if (!Lr.ca || typeof Lr.ca !== 'object') Lr.ca = {}; Lr.ca[ck] = scnN(s) + 1; }      // r22: 이 집 사람이 맹주가 된 때 (이야기 열쇠는 대장에게 — story.js DS.castHero)
    seat = bf;
  }
  var mWasFollow = move && m.o === bf.id && !m.h;
  DS.loseMerc(s, m.id); p.m = 0;
  if (move) {
    var cb = DS.bearer ? DS.bearer(s, bf, 1) : null;
    if (cb && cb !== m) { delete cb.h; cb.o = mWasFollow ? bf.id : 0; }      // 그 가문의 가주였던 이는 비워진 가솔 자리로 (못 서면 막사)
    seatMove(s, ch, bf);
  }
  delete seat.vac; delete seat.cu;
  if (m.by != null) { seat.by = m.by; seat.ls = m.ls; }
  seat.hp = hpR; seat.down = false; if (seat.mp == null) seat.mp = 1;
  if (!p.nfd) { p.nfd = 1; p.nf = 1; }      // r32: 새 대장은 이름을 한 번 값없이 정한다 (social.js)
  seat.sx = p.sx; seat.pid = p.id; seat.ps = ps; p.k = 'c'; p.c = seat.id; p.cls = seat.cls; p.L = seat.L; p.st = 'live'; p.hs = Lr.hs || seat.cls;
  if (p.gen <= dgen) p.gen = dgen + 1;
  seat.name = heroName(s, p.gen);
  if (Lr.gb && Lr.gb.one && p.gen - (+Lr.gb.o || 0) === 1) seat.name = Lr.gb.b;      // 직접 입력한 호에 대수가 없으면 그대로
  delete seat.gr; if (mgr) seat.gr = mgr;
  mood(seat, 'will');
  seat.L = ps.L; seat.exp = ps.exp; seat.Ls = seat.L;      // r42: 맹주 가문 줄은 새 맹주의 개인 레벨을 비춘다
  var e = logE(s, 'heir', p.id, dp ? dp.id : 0, { kind: kind, L: ps.L, from: DS.pL(m), cls: seat.cls });
  evs.push({ t: 'heir', a: p.id, b: dp ? dp.id : 0, ch: seat.id, kind: kind, L: ps.L, from: DS.pL(m), pre: dps.L != null ? DS.pL(dps) : ps.L, move: move, ev: e });
  if (DS.ghTouch) DS.ghTouch(s);      // 장비 내력: 대장 깃발을 새 손이 든다
  if (move && DS.succNeed && !(DS.bearer && DS.bearer(s, ch))) { var sw = DS.succNeed(s, ch, dps, dp, '맹주'); if (sw) evs.push(sw); }      // 2.1.0: 옛 맹주의 가문은 자동 후계를 맞는다 (싸움 밖이면 곧바로 — DS.succTick)
  if (DS.mercTidy) DS.mercTidy(s);
  if (DS.pSync) DS.pSync(s);
  return evs;
};
// r42: 맹주 자리를 다른 가문 줄로 옮긴다 — 사람 칸(이름·가계도 고리·성별·나이·체력·사람 줄)은 새 줄로, 옛 줄은 보통 가문
var SEATK = ['name', 'pid', 'sx', 'by', 'ls', 'gr', 'eld', 'hp', 'down', 'vac', 'nat', 'cu', 'lsc', 'ps'];
function seatMove(s, from, to) {
  if (!from || !to || from === to) return;
  SEATK.forEach(function (k) { if (from[k] !== undefined) to[k] = from[k]; else delete to[k]; delete from[k]; });
  delete from.Ls; delete to.Ls;
  s.hero = to.id;
  var pi = s.party.indexOf(from.id), ti = s.party.indexOf(to.id);
  if (ti < 0) { if (pi >= 0) s.party[pi] = to.id; else if (s.party.length < DS.PARTY_MAX) s.party.push(to.id); else s.party[s.party.length - 1] = to.id; }
  if (to.manual) delete to.manual;
}
DS.linSeatMove = seatMove;
// r35 「가문이 끊겼다」: 대장이 쓰러졌는데 이을 어른이 아무도 없다 (값없는 모집 줄과 미성년 아이만 남았다).
//   이때는 값없이 한 사람을 보내는 대신 스무 해가 흐르고(나이·천수·성년은 age.js 의 해마다 판정 그대로), 새 대장이 옛 깃발을 든다.
//   자란 핏줄이 있으면 그 아이가, 없으면 낯선 이가 잇는다. 이름은 고를 수 있다. 가문 이름은 옛 이름을 잇거나 여덟 큰 가문 가운데 하나.
//   남는 것: 깬 시나리오·깃발과 레벨·장비·관. 잃는 것: 금고의 절반, 스무 해 동안 천수를 누린 이들.
DS.LAPSE = { years: 20, gold: 0.5, minG: 3, tickets: 2 };      // tickets: 옛 이름을 듣고 찾아올 이들 (빈 깃발을 다시 세울 실마리 — 갇히지 않게)
DS.linEnded = function (s, chId) {
  var ch = s && s.chars && s.chars[chId]; if (!ch || !ch.vac || +chId !== +s.hero) return false;
  if (DS.egPassOn && DS.egPassOn(s)) return false;      // 스무 해 창(다음 세대의 장) 안에서는 그 창이 다룬다
  return !DS.linHeirs(s, chId).some(function (h) { return !h.young && h.kind !== 'pull'; });
};
// opt: { name: 새 대장 이름, house: 'keep' | 여덟 큰 가문 이름, rnd, at }. 돌려주는 값: { evs, y0, y1, lost, kid, name, house, old, gone } 또는 null
DS.linLapse = function (s, chId, opt) {
  if (!DS.linEnded(s, chId)) return null;
  opt = opt || {};
  var Lr = L0(s), ch = s.chars[chId], dp = Lr.P[ch.vac.pid], at = opt.at || ch.vac.at || '', Y = (DS.AGE && DS.AGE.year) || 600, X = DS.LAPSE;
  var y0 = DS.calNow ? DS.calNow(s).yr : 0, oldHn = DS.houseName(s), evs = [], gone = 0, lost = Math.floor((s.gold || 0) * X.gold / 10) * 10;
  s.gold = Math.max(0, (s.gold || 0) - lost);
  for (var i = 0; i < X.years; i++) {
    if (DS.ageAdvance) DS.ageAdvance(s, Y);
    if (DS.ageCheck) DS.ageCheck(s, at).forEach(function (e) { if (e.t === 'mnat') gone++; evs.push(e); });
  }
  s.mercs.forEach(function (m) { m.hp = 1; });
  if (s.rh) s.rh.h = 0;      // 모집 열기도 식었다
  s.tickets = (s.tickets || 0) + X.tickets;
  var kid = DS.linHeirs(s, chId).filter(function (h) { return !h.young && h.kind === 'kid' && h.blood; })[0] || null;
  var r = DS.linSucceed(s, chId, kid || { kind: 'pull' }, { nat: 1, minG: X.minG, rnd: opt.rnd });
  if (!r) return null;
  evs = evs.concat(r);
  var hc = s.chars[s.hero], p = hc && hc.pid ? Lr.P[hc.pid] : null; if (!p) return null;
  var nm = DS.rnClean ? DS.rnClean(opt.name) : String(opt.name || '').trim().slice(0, 8);
  if (nm && DS.nameOK && !DS.nameOK(nm)) nm = '';
  if (DS.CAST_NAME && nm && Object.keys(DS.CAST_NAME).some(function (k) { return DS.CAST_NAME[k] === nm; })) nm = '';
  if (!nm) nm = p.n || hc.name || '대장';
  s.name = nm; p.n = nm; p.gv = 1; delete p.nf; delete p.ttl;
  Lr.gb = { b: nm, o: (p.gen || 1) - 1, one: 1 }; hc.name = nm;
  var pick = String(opt.house || 'keep'), grand = (DS.GRAND_HOUSES || []).map(function (g) { return g[0]; }), sur0 = Lr.sur;
  if (false && pick !== 'keep' && grand.indexOf(pick) >= 0 && pick !== Lr.sur) {      // 2.1.0: 대가 끊겨도 연맹 이름·가문 이름은 그대로 (고르기 없음)
    if (!Array.isArray(Lr.hns)) Lr.hns = [];
    Lr.hns.push({ n: oldHn, hs: Lr.hs || hc.cls, g: dp ? dp.gen : 1, s: scnN(s) });
    Lr.osur = Lr.sur; Lr.sur = pick; Lr.hn = DS.houseOf(pick);
  }
  p.sn = Lr.sur; var hm = null; if (p.m) hm = merc(s, p.m); if (hm) hm.sn = Lr.sur;
  var y1 = DS.calNow ? DS.calNow(s).yr : y0 + X.years;
  var ev = logE(s, 'lapse', p.id, dp ? dp.id : 0, { y0: y0, y1: y1, n: X.years, gold: lost, kid: kid ? 1 : 0, house: DS.houseName(s), old: oldHn, osn: sur0 !== Lr.sur ? sur0 : '' });
  evs.push({ t: 'lapse', a: p.id, b: dp ? dp.id : 0, ev: ev });
  s.lapse = (s.lapse || 0) + 1;
  return { evs: evs, y0: y0, y1: y1, lost: lost, tickets: X.tickets, kid: !!kid, name: nm, house: DS.houseName(s), old: oldHn, gone: gone, dead: dp ? DS.linName(s, dp.id) : '' };
};
// 이야기 줄 (lore.js LINEAGE.lapse 가 있으면 그쪽). {house} 옛 가문 · {a} 새 대장 · {b} 떠난 대장 · {y1} 새 해 · {new} 새 가문
DS.LAPSE_TXT = {
  fall: ['{b}{이가} 쓰러졌다. 이을 사람이 없다.', '{house}의 깃발이 접혀 교회 벽에 걸렸다.', '아무도 그 이름을 부르지 않았다.'],
  pass: ['봄이 스무 번 오고 갔다.', '해밀 언덕의 무덤에 풀이 자랐다.'],
  kid: ['그 사이 남겨진 아이가 자라 어른이 되었다.', '아이는 접힌 깃발 앞에 오래 서 있었다.'],
  stranger: ['어느 가을, 낯선 이가 교회 문을 두드렸다.', '먼 핏줄이라 했다. 옛 이야기를 듣고 왔다고 했다.'],
  rise: ['{a}{이가} 먼지 앉은 깃발을 내려 손에 쥐었다.', '가문력 {y1}년. 깃발이 다시 오른다.'],
  keep: '옛 이름 {house}{을를} 그대로 잇는다.',
  renew: '옛 깃발에 새 이름 {new}{을를} 건다.',
  cost: '금고의 절반이 흩어졌다.',
  call: '옛 이름을 듣고 찾아올 이들이 있다. 모집권 {t}장.',
  gone: '그 사이 {n}명이 천수를 누리고 떠났다.'
};
DS.LIN_TXT.lapse = ['{house}의 대가 끊기고 스무 해가 흘렀다. {a}{이가} 옛 깃발을 다시 들었다.'];
DS.linAutoHeir = function (s, chId, opt) { if (DS.linEnded(s, chId)) { var lp = DS.linLapse(s, chId, opt); if (lp) return lp.evs; } return DS.linSucceed(s, chId, DS.linAutoPick(s, chId, opt), opt); };      // r35: 가문이 끊겼으면 스무 해가 흐른다 (화면 없이도 갇히지 않게)
DS.linAutoAll = function (s) { var evs = []; DS.linVacant(s).forEach(function (ch) { evs = evs.concat(DS.linAutoHeir(s, ch.id) || []); }); return evs; };
// 4.0: 생전 입양은 넣지 않는다 (설계서 ④-2)
DS.linAdopt = function () { return null; };
// 용병이 사라졌는데(내보냄 등) 가계도는 모른다 → 떠남. 지휘관 칸이 바뀌었으면 맞춘다.
DS.linTidy = function (s) {
  var P = L0(s).P;
  for (var k in P) {
    var p = P[k]; if (p.st !== 'live') continue;
    if (p.m && !entOf(s, p)) { p.st = 'gone'; p.m = 0; if (p.sp) part(s, p, '떠남'); logE(s, 'gone', p.id); }
    else if (p.c && !entOf(s, p)) { p.st = 'gone'; p.c = 0; if (p.sp) part(s, p, '떠남'); }
  }
  var h = s.chars[s.hero]; if (h && !h.vac) charP(s, h);      // 4.0: 대장 줄만 (깃발 줄은 사람을 만들지 않는다)
};

// ── 합일: 조건·결과는 그대로. 4.0: 사람은 아무도 사라지지 않는다 — 합일체 P 를 만들지 않고, 연대기에 fuse 한 줄만 (meta.js 의 DS.fuse 가 사람을 옮긴다) ──
var fuse0 = DS.fuse;
// 1.0.1: 묶음은 자유 — 고른 세 가문(ids)과 묶음 이름(가주 공훈 1등 가문)을 연대기에 남긴다. 옛 꼴(fam 문자열)도 meta.js 가 받아 준다
DS.fuse = function (s, ids, opt) {      // r42: 사람 셋 — 연대기에 셋의 이름으로 한 줄씩
  var m = fuse0(s, ids, opt); if (!m) return m;
  var LF = DS.lastFuse || {}, hp = DS.heroPs ? DS.heroPs(s) : null;
  (LF.who || []).forEach(function (w) {
    var p = w === hp ? charP(s, s.chars[s.hero]) : mercP(s, w, true);
    logE(s, 'fuse', p ? p.id : 0, 0, { ids: (LF.ids || []).slice(), names: (LF.names || []).slice() });
  });
  return m;
};

// ── 전투 사양: 슬픔·유지, 아이의 이름표 ──
var cs0 = DS.cmdSpec;
DS.cmdSpec = function (ch, hero, who) {
  var u = cs0(ch, hero, who), M = DS.linMood(hero || !who ? ch : who);      // 4.0: 비탄·유지는 사람의 것 — 대장은 대장 줄, 든 사람은 그 부대원
  if (M) { u.atk = Math.round(u.atk * M.v); u.mag = Math.round(u.mag * M.v); }
  return u;
};
var ms0 = DS.mercSpec;
DS.mercSpec = function (ch, m) {
  var u = ms0(ch, m), M = DS.linMood(m);
  if (M) { u.atk = Math.round(u.atk * M.v); u.mag = Math.round(u.mag * M.v); }
  if (m && m.ttl) { u.name = m.ttl; u.mn = m.ttl; }
  return u;
};
var call0 = DS.mercCall;
DS.mercCall = function (m) { if (m && m.ttl) { var t = DS.mercTitle(m); return (t ? t + ' ' : '') + m.ttl; } return call0(m); };
var ns0 = DS.newSave;
DS.newSave = function (name, cls) {
  var s = ns0(name, cls); DS.linFix(s);
  var h = s.chars[s.hero], sn = h && DS.LIN_HOUSE && DS.LIN_HOUSE[h.cls];      // 2.1.0: 맹주의 집도 다른 집처럼 병과의 가문명 (보병 = 로저스 가문). 연맹 이름(save.ally)은 따로
  if (sn) { var Lr = L0(s), old = Lr.sur; Lr.sur = sn; for (var k in Lr.P) if (Lr.P[k].sn === old && Lr.P[k].c === s.hero) Lr.P[k].sn = sn; }
  return s;
};
var am0 = DS.addMerc;
DS.addMerc = function (s, type, g, owner) { var m = am0(s, type, g, owner); if (m) mercFix(m, s); return m; };      // 성별·성은 번호에서 (모집의 난수 흐름을 바꾸지 않는다)
var ac0 = DS.addChar;
DS.addChar = function (s, cls, L, name) { var ch = ac0(s, cls, L, name); if (ch && !ch.sx && (ch.id === s.hero || (!s.hero && Object.keys(s.chars).length === 1))) ch.sx = hsh(ch.id, 211, 7) < 0.5 ? 'm' : 'f'; return ch; };      // 4.0: 사람 칸은 대장 줄에만

// ── 가계도 나무 (화면용) ──
DS.linTree = function (s, pid) {
  var P = L0(s).P, seen = {};
  function node(p) { if (seen[p.id]) return null; seen[p.id] = 1; sync(s, p);
    var kids = []; for (var k in P) { var q = P[k]; if ((q.pa || [])[0] === p.id) { var n = node(q); if (n) kids.push(n); } }
    kids.sort(function (a, b) { return a.p.id - b.p.id; });
    return { p: p, name: DS.linName(s, p.id), sp: p.sp ? P[p.sp] : null, kids: kids }; }
  if (pid) return P[pid] ? node(P[pid]) : null;
  var roots = []; for (var k in P) { var p = P[k]; if (!(p.pa || []).length || !P[p.pa[0]]) { var n = node(p); if (n) roots.push(n); } }
  return roots.sort(function (a, b) { return a.p.id - b.p.id; });
};
DS.linPeople = function (s) { var P = L0(s).P; return Object.keys(P).map(function (k) { return sync(s, P[k]); }); };

// ── 관과 부활 ──
DS.coffinPrice = function (s) { return 2 * DS.mercCost(DS.heroTier(s)); };
DS.coffins = function (s) { if (!s.coffins || typeof s.coffins !== 'object') s.coffins = { have: 0, list: [] }; return s.coffins; };
DS.buyCoffin = function (s) { var c = DS.coffins(s), pr = DS.coffinPrice(s); if (c.have >= DS.COFFIN_MAX || s.gold < pr) return false; s.gold -= pr; c.have++; return true; };
DS.linCanEntomb = function (s, pid) {
  var p = L0(s).P[pid]; if (!p || p.st !== 'dead') return { ok: false, why: '모실 수 없다' };
  if (p.rv) return { ok: false, why: '한 번 돌아왔다' };      // 3.3.0: 다시 부름으로 한 번 돌아온 이는 다시 관에 들지 않는다
  if (!(p.d && p.d.fr)) return { ok: false, why: '때가 지났다' };
  if (!emptyCoffins(s)) return { ok: false, why: '빈 관이 없다' };
  return { ok: true, why: '' };
};
DS.linEntomb = function (s, pid) {
  if (!DS.linCanEntomb(s, pid).ok) return null;
  var P = L0(s).P, p = P[pid], sn = p.snap || {}, nm = function (id) { return id && P[id] ? DS.linName(s, id) : ''; };
  var rec = { pid: p.id, k: p.k, sn: p.sn, n: p.n, ttl: p.ttl || '', sx: p.sx, gen: p.gen, cls: sn.cls || p.cls || null, L: sn.L || p.L || 0, snap: JSON.parse(JSON.stringify(sn)),
    pa: (p.pa || []).map(nm).filter(Boolean), sp: nm(p.lsp), kids: kidsOf(s, p, false).map(function (q) { return DS.linName(s, q.id); }),
    why: p.d.why, at: p.d.at, s: p.d.s, tm: p.d.tm, name: DS.linName(s, p.id) };
  if (p.lw) rec.lw = p.lw;      // r32: 마지막 한마디
  if (rec.snap.it) { s.items[rec.snap.it] = (s.items[rec.snap.it] || 0) + 1; delete rec.snap.it; }      // 지녔던 물건은 가방으로
  // 3.3.0: 돌아올 등급(rg) · 「갓 떠난 이」가 되는 새벽의 세대(w — 모실 때 다음 새벽) · 지휘관 칸(seat — 제 옛 깃발 되찾기)
  var e = s.eg, gen = e && e.gen ? e.gen : 1;
  rec.rg = DS.linRecRg(rec); rec.w = e && e.pass ? gen : gen + 1; if (p.seat) rec.seat = p.seat;
  if (p.c === s.hero || (p.seat && p.seat === s.hero)) rec.head = 1;
  DS.coffins(s).list.push(rec); p.st = 'coffin'; delete p.d.fr;
  logE(s, 'coffin', p.id);
  return rec;
};
DS.linRecRg = function (rec) { if (!rec) return 1; if (rec.k === 'c') return DS.RET_RG(DS.tierOfL(rec.L || 1)); var g = +((rec.snap || {}).g || rec.g || 1); return Math.max(1, Math.min(5, Math.round(g))); };
// 관 한 칸을 비운다: 그 사람은 해밀 언덕에 묻힌다 (되돌릴 수 없다)
DS.linBury = function (s, i) {
  var list = DS.coffins(s).list, c = list[i]; if (!c) return null;
  list.splice(i, 1);
  var p = L0(s).P[c.pid]; if (p && p.st === 'coffin') { p.st = 'dead'; if (p.d) delete p.d.fr; }
  return logE(s, 'bury', p ? p.id : 0);
};
// 가주의 호: 「하람 · 한울 2세」 (아이의 제 이름이 앞에). 시조는 제 이름만
DS.heroCall = function (s) {
  var ch = s && s.chars && s.chars[s.hero]; if (!ch) return (s && s.name) || '대장';
  var p = ch.pid && L0(s).P[ch.pid], call = DS.charName(ch);
  var own = p && p.gv && p.n ? p.n : '';
  return own && own !== call && call.indexOf(own) < 0 ? own + ' (' + call + ')' : call;
};
// 깃대 넘김 (설계서 규칙 18·19): 노년 가주가 다 자란 기수 가문 아이에게 넘긴다. 선대는 영웅 등급 부대원으로 곁에 남고, 아이가 자리(레벨·장비 그대로)를 잇는다
DS.linHandOver = function (s, mid) {
  var Lr = L0(s), P = Lr.P, ch = s.chars[s.hero]; if (!ch || ch.vac || ch.down) return null;
  var km = merc(s, +mid), kp = km && km.pid && P[km.pid]; if (!kp || kp.m !== km.id) return null;
  var A = charP(s, ch), ttl = DS.heroCall(s), call = DS.charName(ch, s), ps = ch.ps || {}, by = ch.by, ls = ch.ls, keys = Object.keys(DS.TRAITS);
  var type = DS.MERCS[ps.type] && !DS.MERCS[ps.type].pop ? ps.type : (DS.RET_KIND[ch.cls] || DS.baseMercTypes(ch.cls)[0]);
  // 4.0: 선대는 제 사람 기록(ps — 종류·특성·공훈) 그대로 영웅 등급 부대원으로 곁에 남는다 (난수를 쓰지 않는다)
  var m = { id: s.mnid++, type: type, g: Math.max(4, +ps.g || 1), o: 0, hp: ch.hp == null ? 1 : ch.hp, n: A.n, v: +ps.v || 0, t: own(DS.TRAITS, ps.t) ? ps.t : keys[Math.floor(hsh(A.id, 61, 3) * keys.length) % keys.length],
    L: DS.pL(ps), exp: +ps.exp || 0, k: +ps.k || 0, b: +ps.b || 0, sn: A.sn, sx: A.sx, ttl: call, pk: ps.pk || 100000 + A.id };
  if (ps.fz) m.fz = 1; if (ps.tm) m.tm = ps.tm.slice(); if (ps.pgn) m.pgn = ps.pgn;
  ['q', 'bk', 'sv', 's', 'nk'].forEach(function (k) { if (ps[k] != null) m[k] = ps[k]; });
  if (by != null) { m.by = by; m.ls = ls; }
  s.mercs.unshift(m);
  if (A.sp) delete Lr.bd[bkey(A.id, A.sp)];      // 혼인은 깨지지 않는다 (아이는 더 없다)
  ch.vac = { pid: A.id, at: '' }; ch.pid = 0;
  var evs = DS.linSucceed(s, s.hero, { mid: km.id, kind: 'kid' }, { nat: 1 });
  if (!evs) { DS.loseMerc(s, m.id); s.mnid--; delete ch.vac; ch.pid = A.id; return null; }
  A.k = 'm'; A.c = 0; A.m = m.id; A.st = 'live'; A.seat = ch.id; A.hand = 1; A.ttl = call; A.type = type; A.g = m.g; A.htl = ttl; m.pid = A.id;
  if (m.by != null) { A.by = m.by; A.ls = m.ls; }
  logE(s, 'hand', A.id, kp.id);
  return { a: A.id, b: kp.id, ttl: DS.heroCall(s), mid: m.id };
};
// 다시 부름으로 돌아온다 (설계서 「기억」 표): 관 한 칸 → 열다섯 살 부대원. 이름·가계도 칸·연대기·첫 죽음(d0)은 남고, 단·레벨·장비·자리는 사라진다
DS.egReturn = function (s, i) {
  var list = DS.coffins(s).list, c = list[i]; if (!c) return null;
  var P = L0(s).P, p = P[c.pid], sn = c.snap || {}, cmd = c.k === 'c' && c.cls && DS.CLASSES[c.cls];
  var g = Math.max(1, Math.min(5, +c.rg || DS.linRecRg(c))), type = cmd ? DS.RET_KIND[c.cls] || DS.baseMercTypes(c.cls)[0] : DS.MERCS[sn.type] ? sn.type : 'm_sword';
  var m = DS.addMerc(s, type, g, 0), keys = Object.keys(DS.TRAITS), seed = c.pid || 1, skill = null;
  if (cmd) {      // 깃발 들던 이: 사람 번호로 정해 고정한 특성·생김, 단에 맞는 공훈, 옛 깃발의 기술 하나
    m.t = keys[Math.floor(hsh(seed, 61, 3) * keys.length) % keys.length]; m.v = Math.floor(hsh(seed, 67, 5) * 4); delete m.q;
    var fit = Object.keys(DS.QUIRKS || {}).filter(function (q) { return DS.quirkFits(type, q); });
    if (hsh(seed, 71, 7) < (DS.QUIRK_P || 0) && fit.length) m.q = fit[Math.floor(hsh(seed, 73, 9) * fit.length) % fit.length];
    m.L = DS.RET_L(s, c.L || 1, g); m.k = 0; m.b = 0;
    skill = DS.egOldSkill(c.cls, DS.tierOfL(c.L || 1), seed); if (skill) m.s = skill;
    m.pk = 100000 + seed;
  } else {      // 부대원이던 이: 종류·특성·버릇·생김·공훈·처치·전투·별명·고유 기술 그대로
    ['t', 'v', 'k', 'b', 'q', 'bk', 'sv', 's', 'nk'].forEach(function (k) { if (sn[k] != null) m[k] = sn[k]; else if (k === 'q') delete m.q; });
    m.L = DS.RET_L(s, sn.L || 1, g);
    m.pk = sn.pk || sn.id || 100000 + seed;
  }
  m.n = c.n; m.sn = c.sn; m.sx = c.sx; if (c.ttl && !cmd) m.ttl = c.ttl; m.rv = 1;
  if (p && p.cast && DS.CAST_NAME && DS.CAST_NAME[p.cast]) m.n = DS.CAST_NAME[p.cast];      // ⑱ 돌아온 1세는 제 이름만 — 이야기 화자(cast)는 그 집의 대를 잇는 사람 하나
  // 나이: 열다섯 (그리폰·와이번·오우거는 그 종의 가장 어린 합류 나이가 더 어리면 그 나이) · 수명: min(제 수명, 90)
  var K = DS.AGE_KIND && DS.AGE_KIND[type], adult = (DS.AGE && DS.AGE.adult) || 15, age = Math.min(adult, K && DS.AGE_KIND[type] ? K.start[0] : adult);
  var ls = Math.min(90, Math.round(+c.ls || +m.ls || 70)); if (ls <= age + 1) ls = Math.min(90, age + 20);
  if (s.cal && DS.AGE) { m.by = s.cal.t - age * DS.AGE.year; m.ls = ls; delete m.eld; }
  if (!p) p = mkP(s, { k: 'm', sn: c.sn, n: c.n, sx: c.sx, gen: c.gen, gv: 1 });
  var d = p.d || { at: c.at, why: c.why, s: c.s, tm: c.tm };
  p.d0 = { at: d.at || c.at || '', why: d.why || c.why || '', s: d.s != null ? d.s : c.s, age: c.age != null ? c.age : p.age, tm: d.tm != null ? d.tm : c.tm }; delete p.d;
  p.st = 'live'; p.k = 'm'; p.c = 0; p.m = m.id; p.rv = 1; p.type = type; p.g = g; if (c.seat && !p.seat) p.seat = c.seat;
  if (m.by != null) { p.by = m.by; p.ls = m.ls; } delete p.age;
  m.pid = p.id;
  var re = 0, osp = p.lsp && P[p.lsp];      // ⑱ 옛 짝 재결합은 대장 가문 안에서만, 그리고 묻는다 — 자동으로 맺지 않고 reAsk 로 돌려준다 (DS.linRewed)
  var reAsk = !p.sp && osp && osp.st === 'live' && !osp.sp && entOf(s, osp) && osp.k === 'c' && osp.c === s.hero ? osp.id : 0;
  list.splice(i, 1);
  var ev = logE(s, 'recall', p.id, 0, { g: s.eg ? s.eg.gen : 1 });
  return { t: 'recall', a: p.id, mid: m.id, skill: skill, nick: !cmd ? DS.mercTitle(m) : '', re: re, reAsk: reAsk, age: age, type: type, g: g, ev: ev };
};
// 옛 깃발의 기술 하나: 그 단에서 배운 기술 가운데 호령·카리스마·소환을 뺀 것에서 사람 번호로 (등급과 관계없이 지닌다)
DS.egOldSkill = function (cls, tier, seed) {
  var C = DS.CLASSES[cls]; if (!C) return null;
  var L = C.skills.filter(function (x) { return x[1] <= Math.max(tier, C.start || 1) && !/^cmd_|^charisma$|^summon$|^cure$/.test(x[0]) && DS.SKILLS[x[0]]; }).map(function (x) { return x[0]; });
  if (!L.length) L = C.skills.filter(function (x) { return !/^cmd_|^charisma$|^summon$|^cure$/.test(x[0]) && DS.SKILLS[x[0]]; }).map(function (x) { return x[0]; }).slice(0, 1);
  return L.length ? L[Math.floor(hsh(seed, 79, 11) * L.length) % L.length] : null;
};

// ── 봇·자동: 짝 없는 출전 지휘관에게 성별이 다른 가장 귀한 용병을 짝지어 준다 ──
DS.linAutoWed = function (s) {
  var n = 0;
  [s.hero].forEach(function (id) {      // 4.0: 혼인은 대장만
    var ch = s.chars[id]; if (!ch || ch.vac || ch.down) return; var cp = charP(s, ch); if (cp.sp) return;
    var best = null;
    s.mercs.forEach(function (m) { mercFix(m); if (m.sx === ch.sx) return; var p = mercP(s, m, false); if (p && p.sp) return; if (!DS.linCanWed(s, { c: id }, { m: m.id }, { anywhere: true }).ok) return;
      var sc = m.g * 100 + (m.o ? 50 : 0) + Math.min(49, DS.pL(m) / 2); if (!best || sc > best.sc) best = { m: m, sc: sc }; });
    if (best && DS.linWed(s, { c: id }, { m: best.m.id }, { anywhere: true })) n++;
  });
  return n;
};

// r13: 옛 저장(4.0 전 성)의 아홉 집 사람 — 이야기 열쇠(cast)를 쥔 이와, 대장 아닌 옛 깃발의 사람(k 'c')만 옮긴다. 두 번 돌려도 같다
// 4.0.2: 옛 한 글자 한국 성 → 가문명 풀의 하나 (글자마다 늘 같은 성 — 같은 집안은 같은 새 성을 받는다). 두 번 돌려도 같다
function isHouseSn(sn) { var N = DS.LIN_HOUSE || {}; for (var k in N) if (N[k] === sn) return true; return false; }
function oldSur(sn) { return typeof sn === 'string' && sn.length === 1 && /[가-힣]/.test(sn) && DS.SURNAMES.indexOf(sn) < 0 && !isHouseSn(sn); }      // r22: 한 글자 집 성 「퀸」은 옛 성이 아니다 (솔개의 성이 저장할 때마다 다른 성으로 바뀌던 것)
function surMap(sn) { var c = sn.charCodeAt(0); return DS.SURNAMES[(c * 7 + 3) % DS.SURNAMES.length]; }
function linSurMove(s, Lr) {
  if (!DS.SURNAMES || !DS.SURNAMES.length) return;
  if (oldSur(Lr.sur)) { Lr.osur = Lr.osur || Lr.sur; Lr.sur = surMap(Lr.sur); }
  for (var k in Lr.P) { var p = Lr.P[k]; if (p && typeof p === 'object' && oldSur(p.sn)) p.sn = surMap(p.sn); }
  (s.mercs || []).forEach(function (m) { if (m && oldSur(m.sn)) m.sn = surMap(m.sn); });
}
function linHouseMove(s, Lr) {
  var O = DS.LIN_HOUSE_OLD, N = DS.LIN_HOUSE; if (!O || !N) return;
  var V = { bm: '엘릭', tm: '템페스트', mm: '우치하', mar: '스패로우' };      // 1.0.0: 합일 가문 옛 이름 → 새 이름 · r29: 해병 집 「스패로우」 → 「앗쎄이」
  function mv(sn, key) { return key && N[key] && ((O[key] && sn === O[key]) || (V[key] && sn === V[key]) || (N[key].length === 1 && sn === surMap(N[key]))) ? N[key] : sn; }      // r22: 「퀸」이 잘못 옮겨 간 성도 되돌린다
  for (var k in Lr.P) { var p = Lr.P[k]; if (!p || typeof p !== 'object') continue;
    if ((p.cast || p.hof) && !p.hb) { p.sn = mv(p.sn, p.cast || p.hof); continue; }      // 대장 집 핏줄 아이가 맡아 든 경우(hb)는 대장 성이라 둔다
    var key = (p.k === 'c' && p.c !== s.hero && p.cls) || (p.fu && p.cls) || null;
    if (key && p.sn !== Lr.sur) p.sn = mv(p.sn, key); }
  (s.mercs || []).forEach(function (m) { if (m && m.cast && typeof m.sn === 'string' && !(m.pid && Lr.P[m.pid] && Lr.P[m.pid].hb)) m.sn = mv(m.sn, m.cast); });
  linMarMove(s, Lr, V.mar, N.mar);
}
// r29 사용자 「해병계열 가문 명을 앗쎄이 가문으로」: 옛 이름 「스패로우」는 풀에 없는 해병 집 이름뿐이라(DS.SURNAMES 에 없을 때만) 그 집 핏줄·문패·기록까지 모두 옮긴다
//   (대장이 그 집을 이어 문패가 「스패로우 가문」이 된 저장, 너울의 아이들, 관, 연대기의 문패 기록)
function linMarMove(s, Lr, o, n) {
  if (!o || !n || o === n || (DS.SURNAMES || []).indexOf(o) >= 0) return;
  var oh = DS.houseOf(o), nh = DS.houseOf(n);
  function f(v) { return v === o ? n : v === oh ? nh : v; }
  if (Lr.sur === o) Lr.sur = n; if (Lr.osur === o) Lr.osur = n; if (Lr.hn === oh) Lr.hn = nh;
  (Array.isArray(Lr.hns) ? Lr.hns : []).forEach(function (h) { if (h && typeof h === 'object') h.n = f(h.n); });
  for (var k in Lr.P) { var p = Lr.P[k]; if (!p || typeof p !== 'object') continue; if (p.sn === o) p.sn = n; if (p.osn === o) p.osn = n; }
  (s.mercs || []).forEach(function (m) { if (m && m.sn === o) m.sn = n; });
  (Array.isArray(Lr.log) ? Lr.log : []).forEach(function (e) { var x = e && e.x; if (x && typeof x === 'object') ['osn', 'name', 'old'].forEach(function (q) { if (typeof x[q] === 'string') x[q] = f(x[q]); }); });
  var c = s.coffins; (c && Array.isArray(c.list) ? c.list : []).forEach(function (r) { if (r && typeof r === 'object' && r.sn === o) r.sn = n; });
  var e2 = s.erLast; if (e2 && Array.isArray(e2.names)) e2.names = e2.names.map(function (t) { return typeof t === 'string' ? t.split(o).join(n) : t; });
}
// ── 저장: 빠진 칸을 채운다 (fixSave 끝에서). 옛 저장은 결정적으로 배정 ──
DS.linFix = function (s) {
  if (!s || !s.chars) return s;
  var old = !s.lin || typeof s.lin !== 'object' || Array.isArray(s.lin);      // 2.8.0 까지의 저장 (가계도가 없던 때)
  if (old) s.lin = null;
  var Lr = L0(s);
  if (!Lr.P || typeof Lr.P !== 'object' || Array.isArray(Lr.P)) Lr.P = {};
  if (!Array.isArray(Lr.log)) Lr.log = []; Lr.log = Lr.log.filter(function (e) { return e && typeof e === 'object' && typeof e.t === 'string'; }).slice(-300);
  if (!Lr.bd || typeof Lr.bd !== 'object' || Array.isArray(Lr.bd)) Lr.bd = {};
  if (typeof Lr.sur !== 'string' || !Lr.sur) Lr.sur = surOf(s.name);
  linHouseMove(s, Lr);      // r13: 아홉 집의 옛 한 글자 성 → 새 가문명 (대장 가문·부대원의 성은 그대로)
  linSurMove(s, Lr);      // 4.0.2: 남은 옛 한 글자 성(대장 가문·부대원·옛 시대에서 온 대장)도 모두 새 가문명으로 — 사용자 「다 개명」
  Lr.log = Lr.log.filter(function (e) { return !evKindBad(e.t); });      // r8 (tech 8)
  var mx = 0;
  for (var k in Lr.P) { var p = Lr.P[k]; if (!p || typeof p !== 'object' || !(+k >= 1)) { delete Lr.P[k]; continue; } p.id = +k; mx = Math.max(mx, p.id); if (!Array.isArray(p.pa)) p.pa = []; if (p.sx !== 'f') p.sx = 'm'; p.gen = Math.max(1, Math.round(+p.gen || 1)); if (['live', 'dead', 'fused', 'gone', 'coffin', 'young'].indexOf(p.st) < 0) p.st = 'dead'; if (p.sp && !Lr.P[p.sp]) p.sp = 0; }
  Lr.seq = Math.max(+Lr.seq || 1, mx + 1);
  Lr.log.forEach(function (e) { var q = e.t === 'revive' && Lr.P[e.a]; if (q && !q.rv) q.ret = 1; });      // 3.3.0: 3.2.x 의 골드 부활로 돌아온 이 (연대기가 300줄에서 잘려 못 찾는 이는 표시가 없다)
  DS.charList(s).forEach(function (ch) {
    if (ch.id !== s.hero && ch.pid == null && ch.sx == null && ch.hp == null) return;      // 4.0: 새 모양 깃발 줄 (사람 칸 없음 — DS.bnFix 가 지킨다)
    if (ch.sx !== 'm' && ch.sx !== 'f') ch.sx = hsh(ch.id, 211, 7) < 0.5 ? 'm' : 'f';
    if (ch.pid && !(Lr.P[ch.pid] && Lr.P[ch.pid].c === ch.id)) ch.pid = 0;
    if (ch.gr && !(DS.LIN_MOOD[ch.gr.k] && ch.gr.n > 0)) delete ch.gr;
    if (ch.cu != null && !(+ch.cu > ch.L && +ch.cu <= 100)) delete ch.cu;
    if (ch.vac && !(typeof ch.vac === 'object' && Lr.P[ch.vac.pid])) { if (ch.vac) { ch.vac = null; delete ch.vac; ch.down = true; } }
  });
  (s.mercs || []).forEach(function (m) {
    mercFix(m);
    if (m.pid && !(Lr.P[m.pid] && Lr.P[m.pid].m === m.id)) delete m.pid;
    if (m.gr && !(DS.LIN_MOOD[m.gr.k] && m.gr.n > 0)) delete m.gr;
    if (m.ttl != null && typeof m.ttl !== 'string') delete m.ttl;
  });
  Object.keys(Lr.bd).forEach(function (key) { var b = Lr.bd[key]; if (!b || typeof b !== 'object' || !Lr.P[b.h]) delete Lr.bd[key]; else b.b = Math.max(0, Math.min(DS.LIN_BOND, Math.round(+b.b || 0))); });
  var c = s.coffins; if (!c || typeof c !== 'object' || Array.isArray(c)) c = s.coffins = { have: 0, list: [] };
  c.have = Math.max(0, Math.min(DS.COFFIN_MAX, Math.round(+c.have || 0))); if (!Array.isArray(c.list)) c.list = [];
  c.list = c.list.filter(function (r) { return r && typeof r === 'object' && (r.k === 'c' || r.k === 'm'); }).slice(0, DS.COFFIN_MAX); c.have = Math.max(c.have, c.list.length);
  if (old) DS.charList(s).forEach(function (ch) { if (ch.down && !ch.vac) { ch.down = false; ch.hp = Math.max(0.3, ch.hp || 0.3); } });      // 옛 저장의 유령: 영구 사망 전의 일이라 그대로 일으킨다
  DS.linTidy(s);
  if (!old) { var zz = DS.ZONES && DS.ZONES[s.zone]; DS.linSettle(s, zz && !zz.town ? zz.name : ''); }      // 싸움 중에 꺼진 판: 쓰러진 지휘관은 그대로 죽음이 확정된다 (자리: 사냥터면 그 지역, 시나리오였으면 비워 둔다 → 글은 「전장」)
  DS.linPrune(s);      // r8 (tech 3): 가계도 밖 용병의 임시 사람 가지치기 (옛 저장에 쌓인 것도 여기서 준다)
  // 3.3 (tech 2): 여기서 후계를 자동으로 정하지 않는다 — 빈자리(ch.vac)는 저장에 남고, 이어하기 뒤 교회에서 후계 의식이 뜬다 (game.js startGame). 출전 전 안전망(placeParty)은 그대로.
  return s;
};
})();

// ⑱ 돌아온 이와 옛 짝(대장)이 다시 짝이 될지 — 화면이 묻고 부른다 (DS.egReturn 의 reAsk)
(function () { var DS = globalThis.DS; DS.linRewed = function (s, pa, pb) { var P = s.lin.P, a = P[pa], b = P[pb]; if (!a || !b || a.sp || b.sp || a.st !== 'live' || b.st !== 'live') return false; a.sp = b.id; b.sp = a.id; return true; }; })();
