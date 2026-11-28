// 전민 戰民, 열 가문의 시대 — 2.6.0 규칙: 「떠난 이의 장비는 가방으로」 · 「맹주 넘기기」
//   (셋째 규칙 「병과에 맞지 않는 장비 −50%」는 data.js DS.GEAR_OFF · meta.js DS.gearAt · loot.js fxOff 에 있다)
// ① 떠난 이의 장비는 가방으로: 가주나 맹주가 영영 떠나면(전사 · 천수 · 이름 지우기 · 맹주 넘기기 — 어느 길이든) 그 가문 줄에 입혀 있던 무기 · 방어구가 모두 가방으로 돌아온다.
//     뒤를 잇는 사람은 빈 칸으로 시작한다. 유품(heirloom.js)은 그대로 — 유품이 된 뒤에 벗겨져 가방에 놓이고, 그 가문이 다시 들면 덤이 붙는다.
//     가방 한도(DROP.bag · DROP.plain.bag 40점)는 「새로 떨어진 것」에만 걸린다 — 돌아오는 장비는 한도를 넘겨도 그대로 들어간다(잃는 것 없음). 넘친 동안은 예전 규칙대로 새 드랍이 그 자리에서 팔린다.
//     가주가 들던 물건(숫돌 …)은 예전부터 가방으로 돌아왔다 (game.js bearerFell · age.js) — 여기서는 그 한 점을 「돌아온 수」에 함께 센다.
//     죽음 사건에 gb(돌아온 수)를 싣고 사람 줄의 d.gb 에도 남긴다 → 이별 연출 · 추도 창의 「장비 N점이 가방으로 돌아왔다」. 옛 저장은 건드리지 않는다(소급 없음).
//     새 가주 · 새 맹주가 서면 「장비가 없다」 창이 한 번 뜬다 (가방에서 가장 좋은 것을 한 번에 입히는 단추). 가문 창 · 인물 창의 장비 칸 밑에도 같은 단추.
// ② 맹주 넘기기 (DS.nk*): 살아 있는 맹주가 자리를 넘긴다. 받을 수 있는 사람 = 지금 맹주가 쓰러졌다면 고를 수 있는 사람 그대로 (DS.linChoices — 어른 자식 · 막사의 같은 병과 · 다른 가문의 가주).
//     넘긴 맹주는 기운을 모두 쏟고 죽는다 — 보통의 죽음 길(DS.linSettle: 가계 기록 · 유품 · 8단 위의 남긴 뜻 · 가족의 비탄 · 관)을 그대로 타고, 까닭만 「맹주 자리를 넘김」.
//     후계는 보통의 후계 길(DS.linSucceed)로 선다. 스무 해(대 끊김)는 흐르지 않는다. 도중에 무엇이든 어긋나면 저장을 통째로 되돌린다 (빈자리로 남지 않는다).
//     못 넘기는 때: 싸우는 동안 · 시나리오 중 · 스무 해 창 · 받을 사람이 없을 때 · 자리에 앉은 지 한 해(DS.NK.wait)가 안 됐을 때 (연달아 넘겨 유품의 걸음 · 남긴 뜻을 불리지 못하게).
// 저장: 사람 줄 P[id].d.gb (돌아온 장비 수) · P[id].d.nk (넘기고 떠났다) · P[id].sat (맹주 자리에 앉은 때 — 달력) · save.r26 (이 규칙을 아는 저장) — DS.r26Fix (save.js fixSave 가 부른다)
// 글은 모두 아래 DS.GB_TXT · DS.NK_TXT 에 있다 (이야기 경전의 말투: 떠나는 자리의 줄에는 농담을 얹지 않는다 · 단톡방 한 줄만 슬쩍).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function fill(t, o) { return String(t).replace(/\{(\w+)\}(\{(이가|은는|을를|과와|으로)\})?/g, function (all, k, j, pair) { var v = o && o[k] != null ? String(o[k]) : ''; return v + (pair ? jo(v, pair) : ''); }); }
function jo(w, pair) {      // 받침에 맞는 조사
  var c = String(w).charCodeAt(String(w).length - 1), han = c >= 0xac00 && c <= 0xd7a3, last = han ? (c - 0xac00) % 28 : 0;
  if (pair === '으로') return han && last > 0 && last !== 8 ? '으로' : '로';
  return han && last > 0 ? pair[0] : pair[1];
}
function mercOf(s, id) { var ms = (s && s.mercs) || []; for (var i = 0; i < ms.length; i++) if (ms[i].id === id) return ms[i]; return null; }
function calT(s) { return (s && s.cal && +s.cal.t) || 0; }
function gearName(id) { var g = id && DS.gear(id); return g ? (g.short || g.name) : ''; }

// ───────── ① 떠난 이의 장비는 가방으로 ─────────
DS.GB_TXT = {
  line: '장비 {n}점이 가방으로 돌아왔다',
  eyeH: '새 맹주', eyeC: '새 가주', title: '장비가 없다',
  body: '선대의 장비는 가방으로 돌아왔다. 가장 좋은 것을 바로 입힐 수 있다.',
  w: '무기', a: '방어구',
  auto: '장비 자동 착용', later: '나중에', close: '닫기', done: '장비 {n}점을 입혔다'
};
// 그 가문 줄의 무기 · 방어구를 모두 벗겨 가방에 넣는다. 돌려주는 것: 벗긴 식별자 목록
function gearBack(s, ch) {
  var out = []; if (!s || !ch) return out;
  if (!s.gear || typeof s.gear !== 'object' || Array.isArray(s.gear)) s.gear = {};
  ['w', 'a'].forEach(function (sl) {
    var id = ch[sl]; if (!id) return;
    if (DS.gear(id)) { s.gear[id] = (s.gear[id] || 0) + 1; out.push(id); }
    ch[sl] = null;
  });
  return out;
}
DS.gearBack = gearBack;
// 2.6.1: 죽음으로 돌아온 장비는 그 가문의 새 가주(새 맹주)에게 먼저 묻는다. 그때까지 결과 창의 「자동 장착」은 그 장비를 다른 가문에 입히지 않는다.
//   저장에 남기지 않는다 (이 판을 연 동안만 — 다시 열면 풀린다). 풀리는 때: 새로 선 사람에게 「장비가 없다」를 물었을 때(입히든 미루든) · 잇는 이 없이 빈 가문으로 남았을 때 · 그 싸움터를 떠났을 때(다음 싸움의 결과 창은 지난 싸움의 것을 맡아 두지 않는다) · 다른 저장을 읽었을 때.
var HOLD = { s: null, b: null, m: {} };      // { 가문 번호: { 식별자: 수 } } · b = 그 싸움터 (DS.G.sim)
function simNow() { return (DS.G && DS.G.sim) || null; }
function holdAdd(s, chId, ids) { if (!ids || !ids.length) return; if (HOLD.s !== s || HOLD.b !== simNow()) HOLD = { s: s, b: simNow(), m: {} }; var h = HOLD.m[chId] = HOLD.m[chId] || {}; ids.forEach(function (id) { h[id] = (h[id] || 0) + 1; }); }
DS.gbRelease = function (s, chId) { if (HOLD.s !== s) return; if (chId == null) HOLD.m = {}; else delete HOLD.m[chId]; };
DS.gbHeld = function (s) { var out = {}; if (HOLD.s !== s || HOLD.b !== simNow()) return out; for (var c in HOLD.m) for (var id in HOLD.m[c]) out[id] = (out[id] || 0) + HOLD.m[c][id]; return out; };
DS.gbHeldFor = function (s, chId) { return HOLD.s === s && HOLD.b === simNow() && HOLD.m[chId] ? Object.keys(HOLD.m[chId]) : []; };
// 맡아 둔 장비를 가방에서 잠깐 빼고 fn 을 돌린 뒤 되돌린다 (fn 은 그 장비를 보지 못한다)
DS.gbWithout = function (s, fn) {
  var held = DS.gbHeld(s), took = {}, id, r;
  for (id in held) { var n = Math.min(held[id], (s.gear && s.gear[id]) || 0); if (n > 0) { took[id] = n; s.gear[id] -= n; if (!(s.gear[id] > 0)) delete s.gear[id]; } }
  try { r = fn(); } finally { for (id in took) s.gear[id] = (s.gear[id] || 0) + took[id]; }
  return r;
};
DS.gbTxt = function (n) { return n > 0 ? fill(DS.GB_TXT.line, { n: n }) : ''; };
DS.gbOf = function (s, pid) { var p = s && s.lin && s.lin.P && s.lin.P[pid]; return p && p.d && +p.d.gb > 0 ? Math.round(+p.d.gb) : 0; };
// 가주가 들던 물건이 방금 가방으로 돌아왔는가 (bearerFell · ageCheck 가 죽음 바로 앞에서 DS.giveMercItem(…, null) 을 부른다) — 같은 순간(save.time)의 같은 사람만 센다
var itBack = null;
var gmi0 = DS.giveMercItem;
if (gmi0) DS.giveMercItem = function (save, mercId, key) {
  var m = !key ? mercOf(save, mercId) : null, had = m && m.h && m.it ? m.it : '';
  var r = gmi0.apply(this, arguments);
  itBack = r && had ? { s: save, id: mercId, t: +save.time || 0 } : null;
  return r;
};
var nkFlag = 0;      // 맹주 넘기기가 진행 중인 가문 번호 (DS.nkDo 가 세우고 내린다 — 죽음의 까닭을 바꾼다)
var md0 = DS.linMercDied;
if (md0) DS.linMercDied = function (s, m, at, why) {
  var fb = m && m.h && m.o && s && s.chars && s.chars[m.o] && +m.o !== +s.hero ? s.chars[m.o] : null;
  var evs = md0.apply(this, arguments);
  if (!fb) return evs;
  try {
    var back = gearBack(s, fb), n = back.length; holdAdd(s, fb.id, back);
    if (itBack && itBack.s === s && itBack.id === m.id && itBack.t === (+s.time || 0)) n++;
    itBack = null;
    var d = (evs || []).filter(function (e) { return e && e.t === 'death'; })[0], p = d && s.lin && s.lin.P ? s.lin.P[d.a] : null;
    if (d) d.gb = n;
    if (p && p.d && n) p.d.gb = n;
    if (n && !d && typeof document !== 'undefined' && DS.ui && DS.ui.toast && DS.G && DS.G.save === s) {      // 가계도 밖의 가주: 이별 연출이 없다 — 유품 알림(heirloom.js, 1.6초 뒤)을 받아 한 줄로
      var hl = ''; try { var gh = s.gh || {}; for (var id in gh) { var h = DS.hlOf ? DS.hlOf(s, id) : null; if (h && h.hc === fb.id && h.n === (m.n || m.ttl) && (s.gear[id] > 0)) hl = DS.hlCineTxt(s, -1, id) || hl; } } catch (x) { hl = ''; }
      setTimeout(function () { DS.ui.toast((hl ? hl + '. ' : '') + DS.gbTxt(n), 3600); }, 1750);
    }
  } catch (x) { if (DS.DEBUG) throw x; }
  return evs;
};
var ls0 = DS.linSettle;
if (ls0) DS.linSettle = function (s, at) {
  var evs = ls0.apply(this, arguments);
  try { (evs || []).forEach(function (e) {
    if (!e || e.t !== 'death' || e.k !== 'c' || e.ch == null) return;
    var ch = s.chars[e.ch], p = s.lin && s.lin.P && s.lin.P[e.a]; if (!ch) return;
    if (nkFlag && nkFlag === ch.id && p && p.d) { p.d.why = DS.NK.why; p.d.nk = 1; e.nk = 1; if (e.ev) { e.ev.x = e.ev.x || {}; e.ev.x.why = DS.NK.why; } }
    var back = gearBack(s, ch), n = back.length; holdAdd(s, ch.id, back);
    e.gb = n; if (p && p.d && n) p.d.gb = n;
  }); } catch (x) { if (DS.DEBUG) throw x; }
  return evs;
};
// 맹주 자리에 앉은 때 (달력) — 넘기기의 「한 해」 셈에 쓴다
var su0 = DS.linSucceed;
if (su0) DS.linSucceed = function (s) {
  var r = su0.apply(this, arguments);
  if (r) { try { var h = s.chars[s.hero], p = h && h.pid && s.lin.P[h.pid]; if (p) p.sat = Math.round(calT(s)); } catch (x) { if (DS.DEBUG) throw x; } }
  return r;
};
// 가방에서 가장 좋은 것으로 입히는 셈 (DS.autoEquip 과 같은 점수 — 그 사람의 레벨 · 병과 · 맞지 않는 장비의 −50% · 제 가문 유품의 덤). 여러 가문이면 차례대로 가방을 나눠 쓴다
//   돌려주는 것: [{ ch, w: 식별자 | null, a: 식별자 | null }] (바꿀 것이 있는 가문만). 저장은 건드리지 않는다
DS.gearPlan = function (s, chs) {
  var bag = {}, k, out = [];
  for (k in s.gear) if (own(s.gear, k)) bag[k] = s.gear[k];
  (chs || []).forEach(function (ch) {
    if (!ch) return; var o = { ch: ch, w: null, a: null };
    ['w', 'a'].forEach(function (sl) {
      var cur = DS.gear(ch[sl]), bs = DS.gearScore(cur, ch), best = null;
      for (var id in bag) { var g = DS.gear(id); if (g && g.slot === sl && bag[id] > 0 && DS.canEquip(ch, id)) { var sc = DS.gearScore(g, ch); if (sc > bs) { bs = sc; best = id; } } }
      if (best) { o[sl] = best; bag[best]--; if (cur) bag[cur.id] = (bag[cur.id] || 0) + 1; }
    });
    if (o.w || o.a) out.push(o);
  });
  return out;
};
DS.gearPlanDo = function (s, pl) { var n = 0; (pl || []).forEach(function (o) { ['w', 'a'].forEach(function (sl) { if (o[sl] && DS.equip(s, o.ch, o[sl])) n++; }); }); return n; };
// 싸우는 사람이 서 있는 가문 가운데 빈 장비 칸이 있는 곳 (맹주 가문 · 가주가 선 가문)
function seated(s, ch) { return !!ch && !ch.vac && !ch.down && (ch.id === +s.hero || !!(DS.bearer && DS.bearer(s, ch, 1))); }
DS.gearBare = function (s) { return DS.charList(s).filter(function (ch) { return seated(s, ch) && (!ch.w || !ch.a); }); };

// ───────── ② 맹주 넘기기: 규칙 ─────────
DS.NK = { wait: 1, hold: 1400, lock: 900, why: '맹주 자리를 넘김', tk: 10 };      // wait: 자리에 앉은 뒤 넘길 수 있을 때까지(해) · hold: 길게 누르는 시간(ms) · lock: 단추가 켜질 때까지(ms)
DS.NK_TXT = {
  btn: '맹주 넘기기', hint: '살아서 자리를 넘긴다. 넘긴 맹주는 눈을 감는다',
  no: {
    none: '맹주의 자리가 비어 있다', pass: '평화의 창에서는 넘기지 않는다', scn: '시나리오 중에는 넘길 수 없다', fight: '싸우는 동안에는 넘길 수 없다', end: '지금은 넘길 수 없다',
    wait: '자리에 앉은 지 한 해가 지나야 넘길 수 있다 ({n}계절 남음)', heir: '받을 사람이 없다. 어른 자식, 막사의 같은 병과, 다른 가문의 가주만 받는다'
  },
  why: {
    spouse: '맹주의 배우자는 잇지 못한다', hand: '깃대를 넘긴 선대는 잇지 못한다', back: '한 번 돌아온 이는 잇지 못한다', anc: '맹주의 윗대는 잇지 못한다', young: '아직 어리다',
    sb: '막사의 다른 병과. 맹주와 같은 병과만 잇는다', kin: '핏줄이 아닌 가문원', hx: '옛 맹주 가문 사람', cast: '제 가문의 가주가 아니다', etc: '후계 규칙에 들지 않는다'
  },
  eye: '맹주 넘기기', h2: '{a}, 자리를 넘긴다',
  warn: '{a}{은는} 제 기운을 모두 후계에게 쏟고 죽는다. 영영 떠난다. 되돌릴 수 없다.',
  whoH: '누구에게 넘기나', g1: '자식', g2: '막사', g3: '다른 가문', noH: '넘길 수 없는 사람',
  say1: '맹주가 된다. 선대와의 레벨 차이 일부를 받는다', say2: '막사에서 나와 맹주가 된다. 제 레벨 그대로', say3: '맹주 자리가 이 가문으로 간다',
  thenH: '넘기면 이렇게 된다',
  c: {
    die: '{a}{은는} 죽는다. 되돌릴 수 없다',
    gear: '입고 있던 장비 {n}점은 가방으로 돌아온다 ({g})', gear0: '입고 있던 장비가 없다',
    hlW: '무기 {g}{은는} {a}의 유품이 된다', hlA: '방어구 {g}{은는} {a}의 유품이 된다', hlN: '유품 {g}{은는} 대를 한 번 더 넘긴다 (대를 넘긴 수 {N})', hl0: '유품은 남지 않는다',
    h1: '{b}{이가} 새 맹주가 된다. {l0} → {l1} (선대와의 레벨 차이 일부를 잇는다)', h1s: '{b}{이가} 새 맹주가 된다. {l1} 그대로',
    h2: '{b}{이가} 막사에서 나와 새 맹주가 된다. 제 레벨 {l1} 그대로',
    h3: '맹주 자리가 {house}{으로} 간다. {b}{은는} 제 장비와 공훈 그대로 맹주가 된다', h3o: '{old}{은는} 보통 가문이 된다. 어른 자식이나 막사의 같은 병과가 잇고, 없으면 빈 가문이 된다',
    bare: '새 맹주는 장비 없이 시작한다. 가방에서 다시 입힌다',
    x8: '합일한 {t}단은 잇지 않는다', x8d: '합일한 {t}단은 잇지 않는다. 大 가문이라 새 가주는 합일 없이 다시 8단에 오를 수 있다', tk: '남긴 뜻으로 영웅 모집권 {n}장을 받는다',
    sp: '배우자 {sp}{과와} 사별한다', mood: '가족은 비탄에 잠긴다 (공격, 마공 −10%, 두 판). 새 맹주는 유지를 잇는다 (공격, 마공 +10%, 두 판)',
    keep: '스무 해는 흐르지 않는다. 깬 시나리오와 금고는 그대로다', name: '이름은 깃대에 남는다. {a}{은는} 선대 단톡방에 들어간다'
  },
  bodyH: '{a}{을를} 어떻게 보내나', keep: '관에 모신다', keepN: '빈 관 {n}개', bury: '해밀 언덕에 묻는다', buryN: '이름은 깃대에 남는다', noCof: '빈 관이 없다',
  hoH: '새 맹주의 호',
  next: '넘길 준비를 한다', quit: '그만둔다',
  eye2: '마지막 확인', h22: '{a}{이가} 죽는다', ep2: '{b}에게 맹주 자리를 넘긴다.', warn2: '{a}{은는} 영영 떠난다. 되돌릴 수 없다.',
  hold: '길게 눌러 넘긴다', holdN: '누른 채 기다린다. 손을 떼면 멈춘다', holdTap: '길게 누르고 있어야 넘어간다', back: '← 다시 생각한다',
  fail: '넘길 수 없다. 다시 고른다',
  // 연출 (cine 'handover')
  cT: '새 맹주, {b}', cS: '{a}{이가} 기운을 모두 넘기고 눈을 감았다', cLw: '「{lw}」',
  chat1: ['…살아서 넘긴 건 네가 처음이다.'],
  chatN: ['…또 살아서 넘겼다. 이 집은 그게 내력이 됐구나.', '…이번에도 제 손으로 넘겼다. 잘 배웠다.'],
  chatBy: '단톡방 · {n}', chatAll: '선대 단톡방',
  gift: '남긴 뜻: 다음 사람을 불러라. 모집권 {n}장',
  // 끝 창
  eyeE: '새 맹주', epE: '{a}의 이름은 깃대에 남았다.', kept: '{a}{을를} 관에 모셨다.', buried: '{a}{을를} 해밀 언덕에 묻었다.',
  log: '{a}{이가} 살아서 맹주 자리를 넘기고 눈을 감았다.'
};
function no(w) { return { ok: false, why: w }; }
function heroCh(s) { return s && s.chars && own(s.chars, s.hero) ? s.chars[s.hero] : null; }
function heroP(s) { var ch = heroCh(s), P = s && s.lin && s.lin.P; return ch && ch.pid && P ? P[ch.pid] || null : null; }
// 자리에 앉은 뒤 넘길 수 있을 때까지 남은 해 (0 = 넘길 수 있다)
DS.nkWait = function (s) {
  var W = +DS.NK.wait || 0, p = heroP(s); if (!(W > 0) || !p || p.sat == null) return 0;
  var Y = (DS.AGE && DS.AGE.year) || 600;
  return Math.max(0, W - (calT(s) - p.sat) / Y);
};
DS.nkCan = function (s) {
  var T = DS.NK_TXT.no, ch = heroCh(s);
  if (!ch || ch.vac || ch.down || !s.lin) return no(T.none);
  if (DS.egPassOn && DS.egPassOn(s)) return no(T.pass);
  var G = DS.G;
  if (G && G.save === s) { if (G.ending) return no(T.end); if (G.scn) return no(T.scn); if (G.sim && G.sim.combat) return no(T.fight); }
  var left = DS.nkWait(s); if (left > 0) return no(fill(T.wait, { n: Math.max(1, Math.min(Math.ceil((+DS.NK.wait || 1) * 4), Math.ceil(left * 4 - 0.01))) }));
  if (!DS.nkList(s).ok.length) return no(T.heir);
  return { ok: true, why: '' };
};
// 받을 수 있는 사람(ok — DS.linChoices 의 줄 그대로) · 저절로였다면 고를 사람(def) · 받을 수 없는 사람과 까닭(no: [{ name, why, mid, pid }])
DS.nkList = function (s) {
  var ch = heroCh(s), out = { ok: [], no: [], def: null }; if (!ch || ch.vac || !s.lin || !DS.linHeirs) return out;
  var all = DS.linHeirs(s, s.hero) || [], T = DS.NK_TXT.why, P = s.lin.P, dp = heroP(s), anc = dp && DS.linAncestors ? DS.linAncestors(s, dp.id) : {}, seen = {};
  out.ok = all.filter(function (h) { return h.opt && !h.young && h.mid != null; }).sort(function (a, b) { return a.opt - b.opt; });
  out.ok.forEach(function (h) { seen[h.mid] = 1; });
  var auto = DS.linAutoPick ? DS.linAutoPick(s, s.hero) : null;
  out.def = (auto && auto.mid != null && out.ok.filter(function (h) { return h.mid === auto.mid; })[0]) || out.ok[0] || null;
  (s.mercs || []).forEach(function (m) {
    if (seen[m.id]) return;
    var p = m.pid && P[m.pid] && P[m.pid].m === m.id ? P[m.pid] : null, why = '';
    if (p && dp && (p.id === dp.sp || p.id === dp.lsp)) why = T.spouse;
    else if (p && p.hand) why = T.hand;
    else if (p && (p.rv || p.ret)) why = T.back;
    else if (p && anc[p.id]) why = T.anc;
    else if (m.cast) why = T.cast;
    else if (DS.isSb && DS.isSb(m)) why = T.sb;
    else if (m.o === +s.hero && !m.h) why = p && p.hx ? T.hx : T.kin;
    else why = T.etc;
    out.no.push({ name: (DS.mercCall ? DS.mercCall(m) : '') || m.n || '', why: why, mid: m.id, pid: p ? p.id : 0 });
  });
  all.forEach(function (h) { if (h.young) out.no.push({ name: h.name || '', why: T.young + (h.inY ? ' (' + h.inY + '해 뒤)' : ''), mid: 0, pid: h.pid || 0 }); });
  return out;
};
// 유품이 될 장비 (heirloom.js DS.hlMake 와 같은 고르기 — 저장은 건드리지 않는다). { id, sl } | null · step: 이미 든 제 가문 유품이 한 걸음 더 가는가 { id, N }
function hlWould(s, ch, pid) {
  var r = { made: null, step: null }; if (!DS.hlOf) return r;
  ['w', 'a'].forEach(function (sl) { var h = DS.hlOf(s, ch[sl]); if (h && h.hc === ch.id && !(h.p && h.p === pid) && !r.step) r.step = { id: ch[sl], N: Math.min(99, (h.N || 1) + 1) }; });
  ['w', 'a'].some(function (sl) {
    var id = ch[sl], g = id && DS.gear(id); if (!g || DS.hlOf(s, id)) return false;
    var n = (s.gear && s.gear[id]) || 0; DS.charList(s).forEach(function (c) { if (c.w === id) n++; if (c.a === id) n++; });
    if (g.grade < 4 && n > 1) return false;
    r.made = { id: id, sl: sl }; return true;
  });
  return r;
}
// 넘기면 일어날 일 (화면의 목록 · 시험). row = DS.nkList(s).ok 의 한 줄
DS.nkPreview = function (s, row) {
  var ch = heroCh(s), dp = heroP(s), P = (s.lin && s.lin.P) || {}; if (!ch || !row) return null;
  var ps = ch.ps || {}, L = ps.L != null ? DS.pL(ps) : ch.L, gear = ['w', 'a'].map(function (sl) { return ch[sl]; }).filter(function (id) { return id && DS.gear(id); });
  var hl = hlWould(s, ch, dp ? dp.id : 0), x8 = L > 70 || !!ps.fz, m = mercOf(s, row.mid);
  var sp = dp && dp.sp && P[dp.sp] ? DS.linName(s, dp.sp) : '', hf = row.move && (row.hf || row.h) ? s.chars[row.hf || row.h] : null;
  var cof = s.coffins ? Math.max(0, (s.coffins.have || 0) - ((s.coffins.list || []).length)) : 0;
  return { old: DS.charName(ch, s), oldL: L, gear: gear, hl: hl.made, step: hl.step, x8: x8, dae: !!(DS.houseDaeGen && DS.houseDaeGen(s, ch)), tk: x8 && !(dp && dp.tk10) ? (DS.FALLX_TK || DS.NK.tk) : 0,
    heir: row.name || '', l0: m ? DS.pL(m) : row.pL || 1, l1: row.opt === 1 ? row.nL || row.pL || 1 : m ? DS.pL(m) : row.pL || 1, opt: row.opt, move: !!hf, house: hf ? DS.flagName(hf.cls, s) : '', oldHouse: DS.flagName(ch.cls, s),
    spouse: sp, coffin: cof, canKeep: cof > 0 && !!DS.linEntomb && !(dp && dp.rv) };
};
// 마지막 말: 남긴 한마디(P.lw)가 있으면 그 말, 없으면 가문 기록의 유언 줄(lore.js lineage.will) — 따옴표 안의 말이 24자 안쪽이면 마지막 한마디로도 남긴다 (유품 · 추모에 실린다)
function lastLine(s, dp, heir) {
  var name = dp ? DS.linName(s, dp.id) : '', L = DS.LORE && DS.LORE.lineage && DS.LORE.lineage.will, t = '';
  if (dp && dp.lw) return { say: fill(DS.NK_TXT.cLw, { lw: dp.lw }), lw: '' };
  if (L && L.length) t = fill(L[Math.floor(DS.hash2((dp ? dp.id : 1) | 0, 733, 11) * L.length) % L.length], { a: heir || '', b: name });
  var q = /「([^」]{1,24})」/.exec(t);
  return { say: t, lw: q ? q[1] : '' };
}
function restore(s, snap) { var o = JSON.parse(snap), k; for (k in s) if (own(s, k)) delete s[k]; for (k in o) s[k] = o[k]; }
// 넘긴다. pick = 받을 사람(DS.nkList 의 줄 또는 부대원 번호), opt = { at 곳, body 'keep' | 'bury', ho 다른 가문으로 갈 때의 호 }
//   돌려주는 것: { evs, dead 떠난 이의 사람 번호, heir 새 맹주의 사람 번호, old 떠난 이 이름, name 새 맹주 이름, gb 돌아온 장비 수, hl 유품 식별자 | '', tk 모집권, kept 관에 모셨는가, say 마지막 말, move } 또는 null (아무것도 바뀌지 않는다)
DS.nkDo = function (s, pick, opt) {
  opt = opt || {};
  if (!s || !DS.nkCan(s).ok) return null;
  var ch = heroCh(s), mid = pick && typeof pick === 'object' ? pick.mid : pick, row = DS.nkList(s).ok.filter(function (h) { return h.mid === +mid; })[0];
  if (!row) return null;
  var snap = JSON.stringify(s), dp = DS.linOf ? DS.linOf(s, ch) : heroP(s), oldId = ch.id, old = DS.charName(ch, s), ll = lastLine(s, dp, row.name), tk0 = s.tickets || 0, hl0 = {}, id;
  for (id in s.gh || {}) if (DS.hlOf && DS.hlOf(s, id)) hl0[id] = 1;
  try {
    if (dp && !dp.lw && ll.lw) dp.lw = ll.lw;
    ch.down = true; nkFlag = ch.id;
    var evs = DS.linSettle(s, opt.at || '') || [], d = evs.filter(function (e) { return e && e.t === 'death' && e.k === 'c' && e.ch === oldId; })[0];
    if (!d || !ch.vac) throw new Error('nk settle');
    var pid = d.a, kept = false;
    if (opt.body === 'keep' && DS.linEntomb) kept = !!DS.linEntomb(s, pid);
    var r = DS.linSucceed(s, oldId, row, { ho: opt.ho || { k: 'new' } });
    if (!r) throw new Error('nk succeed');
    var nh = heroCh(s), made = '';
    for (id in s.gh || {}) if (!hl0[id] && DS.hlOf && DS.hlOf(s, id)) made = id;
    return { evs: evs.concat(r), dead: pid, heir: nh ? nh.pid : 0, old: old, name: nh ? DS.charName(nh, s) : row.name || '', gb: d.gb || 0, hl: made, tk: Math.max(0, (s.tickets || 0) - tk0), kept: kept, say: ll.say, move: !!row.move, from: oldId };
  } catch (x) {
    restore(s, snap);
    if (DS.DEBUG && !/^nk /.test(String(x && x.message))) throw x;
    return null;
  } finally { nkFlag = 0; }
};
// 연대기 줄: 넘기고 떠난 이
var le0 = DS.linEvText;
if (le0) DS.linEvText = function (s, e) {
  if (e && e.t === 'death' && e.x && e.x.why === DS.NK.why) { try { return fill(DS.NK_TXT.log, { a: DS.linName(s, e.a) }); } catch (x) {} }
  return le0.apply(this, arguments);
};
// 저장 고치기 (save.js fixSave). was = 이 규칙을 이미 아는 저장인가 — 모르던 저장이면 병과에 맞지 않는 장비를 입은 가문 수를 소식으로 한 번 알린다 (그 장비의 수치가 절반이 되었다)
DS.r26Fix = function (s, was) {
  if (!s) return s;
  var P = s.lin && s.lin.P;
  if (P) for (var k in P) {
    var p = P[k]; if (!p || typeof p !== 'object') continue;
    if (p.sat != null) { if (isFinite(+p.sat)) p.sat = Math.round(+p.sat); else delete p.sat; }
    if (p.d && typeof p.d === 'object') {
      if (p.d.gb != null) { var n = Math.round(+p.d.gb); if (n >= 1 && n <= 3) p.d.gb = n; else delete p.d.gb; }
      if (p.d.nk != null) { if (p.d.nk) p.d.nk = 1; else delete p.d.nk; }
    }
  }
  if (!was) {
    var off = 0;
    try { DS.charList(s).forEach(function (ch) { if (['w', 'a'].some(function (sl) { var g = DS.gear(ch[sl]); return g && !DS.gearFits(ch.cls, g); })) off++; }); } catch (x) { off = 0; }
    if (off && Array.isArray(s.news)) s.news.push('장비 규칙이 바뀌었습니다. 병과에 맞지 않는 장비는 이제 수치가 절반만 듭니다. 지금 ' + off + '개 가문이 그런 장비를 입고 있습니다. 가문 창의 붉은 「' + (DS.gearOffTxt ? DS.gearOffTxt() : '병과 안 맞음') + '」 표시를 확인해 주십시오.');
  }
  s.r26 = 1;
  return s;
};
var nw0 = DS.newSave;
if (nw0) DS.newSave = function () { var s = nw0.apply(this, arguments); if (s && typeof s === 'object') s.r26 = 1; return s; };

// ───────── 화면 ─────────
if (typeof document === 'undefined' || !DS.ui) return;
var U = DS.ui, G = DS.G, esc = U.esc, $ = U.$;
function A(k) { try { U.A(k); } catch (x) {} }
function mercSpr(m, px) { var M = DS.MERCS[m.type]; return M.big ? U.sprTag(M.sprite, M.pal, (px || 2) * 0.75) : U.sprTag(m.type + '_' + m.g + '_' + (m.v || 0), '', px || 2); }
function flip(spr) { return String(spr || '').replace(/( data-flip="1")?><\/i>$/, ' data-flip="1"></i>'); }
function lvT(L) { return DS.lvText ? DS.lvText(L) : 'Lv ' + L; }
function busy() { return !!(G.scn || G.ending || (G.sim && G.sim.combat)); }
function quiet() { return !busy() && !G.riteBusy && !document.querySelector('#app .ov:not(.ghost)') && !(DS.cineBusy && DS.cineBusy()) && !(DS.cineQ && DS.cineQ().length) && !(DS.egPassOn && G.save && DS.egPassOn(G.save)); }
function after() { try { if (DS.refreshUnits) DS.refreshUnits(); } catch (x) {} try { U.persist(); } catch (x) {} }
function planTxt(o) { var T = DS.GB_TXT; return ['w', 'a'].filter(function (sl) { return o[sl]; }).map(function (sl) { return T[sl] + ' ' + gearName(o[sl]); }).join(', '); }
function bearName(s, ch) { return ch.id === +s.hero ? DS.charName(ch, s) : (function (b) { return b ? (b.ttl || b.n || '') : ''; })(DS.bearer(s, ch, 1)); }

// 「장비 N점이 가방으로 돌아왔다」 — 추도 창의 한 줄 · 이별 연출의 한 줄
DS.gbHtml = function (s, pid) { var n = DS.gbOf(s, pid); return n ? '<p class="gbl"><i aria-hidden="true"></i>' + esc(DS.gbTxt(n)) + '</p>' : ''; };
DS.gbCineTxt = function (s, pids) { var n = 0; (pids || []).forEach(function (id) { n += DS.gbOf(s, id); }); return DS.gbTxt(n); };
// 장비 칸 밑의 한 번 누르기: 빈 칸이 있고 가방에 입힐 것이 있을 때만 (ui.js gearSlots 가 부른다)
DS.autoEqBtn = function (ch) {
  var s = G.save; if (!s || !ch || (ch.w && ch.a) || !seated(s, ch)) return '';
  var o = DS.gearPlan(s, [ch])[0]; if (!o || !((!ch.w && o.w) || (!ch.a && o.a))) return '';
  return '<button class="btn small gold wide geq" data-autoeq="' + ch.id + '"><b>' + esc(DS.GB_TXT.auto) + '</b><small>' + esc(planTxt(o)) + '</small></button>';
};
DS.autoEqClick = function (e, chId, o) {
  var b = e.target.closest && e.target.closest('[data-autoeq]'); if (!b) return false;
  var s = G.save, ch = s.chars[+b.dataset.autoeq], n = ch ? DS.gearPlanDo(s, DS.gearPlan(s, [ch])) : 0;
  if (n) { A('ok'); after(); U.toast(fill(DS.GB_TXT.done, { n: n }), 1800); } else A('cancel');
  if (o && o.isConnected && o.draw) o.draw();
  return true;
};
// 「장비가 없다」 창: 새로 선 사람들(가문 번호 목록)과 가방에서 입힐 것. 입힐 것이 없으면 뜨지 않는다. opt: { eye, title, spr, lines: [글], done }
function bareDlg(ids, opt) {
  opt = opt || {};
  var s = G.save, T = DS.GB_TXT, chs = (ids || []).map(function (id) { return s.chars[id]; }).filter(function (ch) { return seated(s, ch) && (!ch.w || !ch.a); });
  var pl = DS.gearPlan(s, chs).filter(function (o) { return (!o.ch.w && o.w) || (!o.ch.a && o.a); });
  if (!pl.length && !opt.lines) { (ids || []).forEach(function (id) { DS.gbRelease(s, id); }); if (opt.done) opt.done(); return null; }
  var hero = pl.some(function (o) { return o.ch.id === +s.hero; }), h = '<div class="result lgrite gbd"><p class="eyebrow">' + esc(opt.eye || (hero ? T.eyeH : T.eyeC)) + '</p>' + (opt.spr ? '<div class="lgdead heir">' + opt.spr + '</div>' : '') + '<h2>' + esc(opt.title || T.title) + '</h2>';
  (opt.lines || []).forEach(function (l) { if (l) h += '<p class="' + (l.cls || 'gbn') + '">' + esc(l.t || l) + '</p>'; });
  if (pl.length) {
    if (!opt.lines) h += '<p class="rn">' + esc(T.body) + '</p>';
    pl.forEach(function (o) {
      var ch = o.ch, b = ch.id === +s.hero ? null : DS.bearer(s, ch, 1);
      h += '<div class="row gbr">' + (b ? mercSpr(b, 2) : U.charSpr(ch, 2)) + '<div class="tx"><b>' + esc(bearName(s, ch)) + ' <i class="own">' + esc(DS.flagName(ch.cls, s)) + '</i></b><small class="gbp">' + esc(planTxt(o)) + '</small></div></div>';
    });
    h += '<button class="btn gold wide" data-gbd="eq">' + esc(T.auto) + '</button>';
  }
  h += '<button class="btn wide" data-close>' + esc(pl.length ? T.later : T.close) + '</button></div>';
  var o = U.overlay(h, 'modal center rite');
  o.addEventListener('click', function (e) {
    if (!e.target.closest('[data-gbd]') || o.dataset.done) return; o.dataset.done = '1';
    var n = DS.gearPlanDo(s, DS.gearPlan(s, pl.map(function (x) { return x.ch; })));
    A('ok'); after(); if (n) U.toast(fill(T.done, { n: n }), 2200); o.close();
  });
  o.onclose = function () { (ids || []).forEach(function (id) { DS.gbRelease(s, id); }); if (opt.done) opt.done(); };      // 2.6.1: 물었으니 맡아 둔 장비를 푼다 (미뤘으면 누구든 입을 수 있다)
  return o;
}
DS.gearBareOpen = bareDlg;
// 새로 선 사람을 기다렸다가(이별 · 잇는 연출과 창이 모두 걷힌 뒤) 한 번에 묻는다
var NQ = [], nqS = null;
function nudge(id) { if (nqS !== G.save) { NQ = []; nqS = G.save; } if (NQ.indexOf(id) < 0) NQ.push(id); }
setInterval(function () { if (!NQ.length || !G.save || nqS !== G.save || (G.quiet && !DS.gbUi)) { if (NQ.length && G.save && nqS === G.save) NQ.forEach(function (id) { DS.gbRelease(G.save, id); }); NQ = []; return; } if (!quiet() || G.hold > 0) return;      // 자동 시험(DS.G.quiet)에서는 묻지 않는다 — 시험이 이 창을 볼 때는 DS.gbUi = true (판의 선택지 DS.chUi 와 같은 약속)
   var ids = NQ; NQ = []; try { bareDlg(ids); } catch (x) { if (DS.DEBUG) throw x; } }, 800);
var sb0 = DS.sbTick;
if (sb0) DS.sbTick = function (s) {      // 막사의 사람이 빈 가문을 이었다
  var out = sb0.apply(this, arguments);
  if (s === G.save) (out || []).forEach(function (e) { if (e && e.t === 'sbSeat' && e.ch) nudge(e.ch); });
  try { if (HOLD.s === s) Object.keys(HOLD.m).forEach(function (id) { var ch = s.chars[+id]; if (+id !== +s.hero && (!ch || !(DS.bearer && DS.bearer(s, ch, 1)))) delete HOLD.m[id]; }); } catch (x) { if (DS.DEBUG) throw x; }      // 2.6.1: 잇는 이 없이 빈 가문으로 남았으면 맡아 둔 장비를 푼다
  return out;
};
var or0 = DS.openLineageRite;
if (or0) DS.openLineageRite = function (queue, done) {      // 맹주가 쓰러져 후계 의식을 치렀다
  var s = G.save, h0 = s && s.chars[s.hero], pid0 = h0 ? (h0.vac ? -1 : h0.pid) : 0;
  return or0.call(this, queue, function () {
    try { var h = s.chars[s.hero]; if (h && !h.vac && !h.down && h.pid !== pid0) nudge(h.id); } catch (x) {}
    if (done) done();
  });
};

// ───────── ② 맹주 넘기기: 화면 ─────────
DS.nkBtn = function (s) {
  s = s || G.save; var T = DS.NK_TXT, c = DS.nkCan(s);
  return '<div class="nkrow"><button class="btn wide nkb" data-nk="1"' + (c.ok ? '' : ' disabled aria-disabled="true"') + '>' + esc(T.btn) + '</button><small class="nkwhy' + (c.ok ? '' : ' no') + '">' + esc(c.ok ? T.hint : c.why) + '</small></div>';
};
DS.nkClick = function (e, parent) {
  var b = e.target.closest && e.target.closest('[data-nk]'); if (!b) return false;
  var c = DS.nkCan(G.save); if (!c.ok) { A('cancel'); U.toast(c.why, 2600); return true; }
  A('tap'); DS.nkOpen(parent); return true;
};
function heirSpr(s, row, px) { var m = mercOf(s, row.mid); return m ? mercSpr(m, px) : ''; }
function heirRow(s, row, on) {
  var T = DS.NK_TXT, m = mercOf(s, row.mid), ch = heroCh(s), hf = row.opt === 3 && (row.hf || row.h) ? s.chars[row.hf || row.h] : null; if (!m || !ch) return '';
  var pw = 0; try { pw = DS.flagPower(s, hf || ch, m); } catch (x) { pw = 0; }
  var cls = hf ? hf.cls : ch.cls, sub = [row.opt === 1 ? (row.sx === 'f' ? '딸' : '아들') : '', DS.CLASSES[cls] ? (hf ? DS.flagName(hf.cls, s) + ' 가주' : DS.CLASSES[cls].name) : '', lvT(DS.pL(m)) + (row.opt === 1 && row.nL > DS.pL(m) ? ' → ' + lvT(row.nL) : '')].filter(Boolean);
  var gc = DS.GRADES[m.g] ? DS.GRADES[m.g].col : '';
  return '<button class="lgcb lgh nkh k-o' + row.opt + '" data-nkheir="' + row.mid + '" role="radio" aria-checked="' + !!on + '"' + (on ? ' aria-pressed="true"' : '') + '>' + mercSpr(m, 2) + '<span><span class="lgnm"><b' + (gc ? ' style="color:' + gc + '"' : '') + '>' + esc(row.name || '') + '</b>' + (U.gbadge ? U.gbadge(m.g) : '') + '</span><small>' + esc(sub.join(', ')) + '</small><small class="lgsay">' + esc(T['say' + row.opt] || '') + '</small></span><em class="lgpw"><b class="pw num sm">' + (pw > 0 ? U.fmtN(pw) : '—') + '</b><small>전투력</small></em></button>';
}
function consq(s, row) {
  var T = DS.NK_TXT.c, v = DS.nkPreview(s, row), out = []; if (!v) return out;
  var a = v.old, b = v.heir, add = function (t, o, cls) { out.push('<li' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(fill(t, o)) + '</li>'); };
  add(T.die, { a: a }, 'lploss');
  if (v.gear.length) add(T.gear, { n: v.gear.length, g: v.gear.map(gearName).join(', ') }); else add(T.gear0, {});
  if (v.step) add(T.hlN, { g: gearName(v.step.id), N: v.step.N });
  if (v.hl) add(v.hl.sl === 'a' ? T.hlA : T.hlW, { g: gearName(v.hl.id), a: a }); else if (!v.step) add(T.hl0, {});
  if (v.opt === 3) { add(T.h3, { house: v.house, b: b }); add(T.h3o, { old: v.oldHouse }); }
  else if (v.opt === 2) add(T.h2, { b: b, l1: lvT(v.l1) });
  else add(v.l1 > v.l0 ? T.h1 : T.h1s, { b: b, l0: lvT(v.l0), l1: lvT(v.l1) });
  if (v.opt !== 3) add(T.bare, {});
  if (v.x8) add(v.dae ? T.x8d : T.x8, { t: DS.tierOfL(Math.max(71, v.oldL)) }, 'lploss');
  if (v.tk) add(T.tk, { n: v.tk });
  if (v.spouse) add(T.sp, { sp: v.spouse });
  add(T.mood, {});
  add(T.keep, {});
  add(T.name, { a: a });
  return out;
}
DS.nkOpen = function (parent) {
  var s = G.save, T = DS.NK_TXT, c0 = DS.nkCan(s); if (!c0.ok) { U.toast(c0.why, 2600); return null; }
  var ch = heroCh(s), L = DS.nkList(s), pick = L.def, step = 'pick', body = 'bury', more = false, HO = { k: 'new' }, lockT = 0, holdRaf = 0, holdT0 = 0, fired = false;
  var old = DS.charName(ch, s), oldSpr = U.charSpr(ch, 4);
  var pv0 = DS.nkPreview(s, pick); if (pv0 && pv0.canKeep) body = 'keep';
  var o = U.overlay('<div class="result lgrite nkd"></div>', 'modal center rite nkov');
  function draw() {
    var box = $('.nkd', o), h = '', pv = DS.nkPreview(s, pick);
    if (step === 'pick') {
      var g3 = { 1: [], 2: [], 3: [] }; L.ok.forEach(function (r) { (g3[r.opt] || g3[3]).push(r); });
      h = '<p class="eyebrow">' + esc(T.eye) + '</p><div class="lgdead heir nko">' + oldSpr + '</div><h2>' + esc(fill(T.h2, { a: old })) + '</h2>' +
        '<p class="lgwarn nkw" role="alert">' + esc(fill(T.warn, { a: old })) + '</p>' +
        '<h5 class="lghd">' + esc(T.whoH) + '</h5><div class="nkl" role="radiogroup">';
      [[1, T.g1], [2, T.g2], [3, T.g3]].forEach(function (x) { var l = g3[x[0]]; if (l.length) h += '<h5 class="lghd nkg">' + esc(x[1]) + ' <i>' + l.length + '</i></h5>' + l.map(function (r) { return heirRow(s, r, pick && r.mid === pick.mid); }).join(''); });
      h += '</div>';
      if (L.no.length) {
        h += '<button class="pfold nkf' + (more ? ' on' : '') + '" data-nkmore="1" aria-expanded="' + more + '"><b>' + esc(T.noH) + ' ' + L.no.length + '명</b><i aria-hidden="true">' + (more ? '▾' : '▸') + '</i></button>';
        if (more) { var by = {}, ks = []; L.no.forEach(function (n) { if (!by[n.why]) { by[n.why] = []; ks.push(n.why); } by[n.why].push(n.name); }); h += '<ul class="nkno">' + ks.map(function (w) { var ns = by[w]; return '<li><b>' + esc(ns.slice(0, 4).join(', ') + (ns.length > 4 ? ' 외 ' + (ns.length - 4) + '명' : '')) + '</b><small>' + esc(w) + '</small></li>'; }).join('') + '</ul>'; }
      }
      h += '<h5 class="lghd">' + esc(T.thenH) + '</h5><ul class="lgafter nkc">' + consq(s, pick).join('') + '</ul>';
      if (DS.linEntomb) h += '<h5 class="lghd">' + esc(fill(T.bodyH, { a: old })) + '</h5><div class="seg2" role="group"><button data-nkbody="keep"' + (body === 'keep' ? ' aria-pressed="true"' : '') + (pv && pv.canKeep ? '' : ' disabled') + '><b>' + esc(T.keep) + '</b><small>' + esc(pv && pv.canKeep ? fill(T.keepN, { n: pv.coffin }) : T.noCof) + '</small></button>' +
        '<button data-nkbody="bury"' + (body === 'bury' ? ' aria-pressed="true"' : '') + '><b>' + esc(T.bury) + '</b><small>' + esc(T.buryN) + '</small></button></div>';
      if (pick && pick.move) { var own0 = pick.name || ''; var dp = heroP(s), gen = dp ? dp.gen || 1 : 1; h += '<h5 class="lghd">' + esc(T.hoH) + '</h5><div class="seg2 lgho" role="group">' + [['new', own0 + ' 1세'], ['cont', own0 + ' ' + (gen + 1) + '세']].map(function (x) { return '<button data-nkho="' + x[0] + '"' + (HO.k === x[0] ? ' aria-pressed="true"' : '') + '><b>' + esc(x[1]) + '</b></button>'; }).join('') + '</div>'; }
      h += '<button class="btn red wide" id="nkNext" disabled>' + esc(T.next) + '</button><button class="btn wide" data-close>' + esc(T.quit) + '</button>';
    } else {
      h = '<p class="eyebrow">' + esc(T.eye2) + '</p><div class="nkpair" aria-hidden="true"><span class="lgdead heir nko">' + oldSpr + '</span><i class="nkar"></i><span class="lgdead heir">' + flip(heirSpr(s, pick, 4)) + '</span></div>' +
        '<h2 class="nkh2">' + esc(fill(T.h22, { a: old })) + '</h2><p class="ep">' + esc(fill(T.ep2, { b: pick.name || '' })) + '</p>' +
        '<p class="lgwarn nkw" role="alert">' + esc(fill(T.warn2, { a: old })) + '</p>' +
        '<button class="btn red wide nkhold" id="nkHold" disabled><i class="nkfill" aria-hidden="true"></i><b>' + esc(T.hold) + '</b></button><small class="nkhn">' + esc(T.holdN) + '</small>' +
        '<button class="btn wide" data-nkstep="pick">' + esc(T.back) + '</button>';
    }
    box.innerHTML = h; U.hydrate(box); box.scrollTop = 0;
    var bt = $(step === 'pick' ? '#nkNext' : '#nkHold', box); lockT = performance.now();
    if (bt) setTimeout(function () { if (bt.isConnected) bt.disabled = false; }, DS.NK.lock);      // 연타 · 앞 화면의 손이 그대로 넘어가지 않게 잠깐 잠근다
  }
  function holdStop() { cancelAnimationFrame(holdRaf); holdRaf = 0; holdT0 = 0; var b = $('#nkHold', o); if (b) { b.classList.remove('on'); b.style.setProperty('--p', '0'); } }
  function holdTick() {
    var b = $('#nkHold', o); if (!b || !holdT0 || fired) return;
    var p = Math.min(1, (performance.now() - holdT0) / DS.NK.hold); b.style.setProperty('--p', p.toFixed(3));
    if (p >= 1) { fired = true; go(); return; }
    holdRaf = requestAnimationFrame(holdTick);
  }
  function holdStart(e) {
    var b = e.target.closest && e.target.closest('#nkHold'); if (!b || b.disabled || fired || holdT0 || performance.now() - lockT < DS.NK.lock) return;
    if (e.type === 'keydown') { if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return; }      // 글쇠로도: 누르고 있는 동안
    else { try { b.setPointerCapture(e.pointerId); } catch (x) {} }
    if (e.cancelable) e.preventDefault();
    holdT0 = performance.now(); b.classList.add('on'); A('swell'); holdTick();
  }
  function go() {
    var c = DS.nkCan(s), heir = pick, spr0 = oldSpr, was = flip(heirSpr(s, pick, 4)), at = (G.zone && G.zone.name) || '';
    var by = '', dead0 = []; try { dead0 = DS.storyDead ? DS.storyDead(s, 3) : []; } catch (x) { dead0 = []; }
    var nth = 0, P = s.lin.P; for (var k in P) if (P[k] && P[k].d && P[k].d.nk) nth++;
    var cls0 = DS.houseCls ? DS.houseCls(ch) : ch.cls, fc = DS.FLAG[ch.cls] || '';
    by = dead0.length ? fill(T.chatBy, { n: dead0[0].n }) : DS.CAST_NAME && DS.CAST_NAME[cls0] && DS.ancName ? fill(T.chatBy, { n: DS.ancName(cls0) }) : T.chatAll;
    var r = c.ok ? DS.nkDo(s, heir, { at: at, body: body, ho: HO }) : null;
    if (!r) { fired = false; holdStop(); A('cancel'); U.toast(c.ok ? T.fail : c.why, 2600); L = DS.nkList(s); pick = L.def; if (!pick) { o.close(); return; } step = 'pick'; draw(); return; }
    o.onclose = null; U.closeAll();
    var nh = heroCh(s);
    try { G.sel = 'c' + s.hero; if (DS.rebuildParty) DS.rebuildParty(); } catch (x) { if (DS.DEBUG) throw x; }
    try { if (DS.updateQuest) DS.updateQuest(); } catch (x) {}
    U.persist();
    var lines = nth ? T.chatN : T.chat1, chat = lines[nth ? (nth - 1) % lines.length : 0];
    var ev = { k: 'handover', old: spr0, por: [flip(U.charSpr(nh, 4)), was], fc: fc, names: [r.old, r.name], title: fill(T.cT, { b: r.name }), sub: fill(T.cS, { a: r.old }), say: r.say, chat: chat, by: by,
      hl: r.hl && DS.hlCineTxt ? DS.hlCineTxt(s, -1, r.hl) : '', gb: DS.gbTxt(r.gb), gift: r.tk ? fill(T.gift, { n: r.tk }) : '' };
    var end = function () { endDlg(r); };
    if (DS.cine) DS.cine(ev, end); else end();
  }
  function endDlg(r) {
    var nh = heroCh(s), lines = [{ t: fill(T.epE, { a: r.old }), cls: 'ep' }, { t: fill(r.kept ? T.kept : T.buried, { a: r.old }), cls: 'dim' }];
    if (r.hl && DS.hlCineTxt) lines.push({ t: DS.hlCineTxt(s, -1, r.hl), cls: 'gbn' });
    if (r.gb) lines.push({ t: DS.gbTxt(r.gb), cls: 'gbn gbl2' });
    if (r.tk) lines.push({ t: fill(T.gift, { n: r.tk }), cls: 'gbn' });
    bareDlg([s.hero], { eye: T.eyeE, title: r.name, spr: nh ? U.charSpr(nh, 4) : '', lines: lines, done: function () {
      if (DS.nfAsk) setTimeout(function () { if (!document.querySelector('#app .ov:not(.ghost)') && !busy()) DS.nfAsk({ k: 'c', id: s.hero }, null, '새 맹주, 처음 이름 정하기 (무료)'); }, 500);      // 새 대장의 이름을 값없이 (후계 의식과 같다)
    } });
  }
  o.addEventListener('click', function (e) {
    var hb = e.target.closest('[data-nkheir]');
    if (hb) { var r = L.ok.filter(function (x) { return x.mid === +hb.dataset.nkheir; })[0]; if (r) { pick = r; var pv = DS.nkPreview(s, pick); if (!(pv && pv.canKeep)) body = 'bury'; A('tap'); var st = $('.nkd', o).scrollTop; draw(); $('.nkd', o).scrollTop = st; } return; }
    if (e.target.closest('[data-nkmore]')) { more = !more; A('tap'); var st2 = $('.nkd', o).scrollTop; draw(); $('.nkd', o).scrollTop = st2; return; }
    var bb = e.target.closest('[data-nkbody]'); if (bb && !bb.disabled) { body = bb.dataset.nkbody; A('tap'); var st3 = $('.nkd', o).scrollTop; draw(); $('.nkd', o).scrollTop = st3; return; }
    var ho = e.target.closest('[data-nkho]'); if (ho) { HO = { k: ho.dataset.nkho }; A('tap'); var st4 = $('.nkd', o).scrollTop; draw(); $('.nkd', o).scrollTop = st4; return; }
    if (e.target.closest('#nkNext')) { if (performance.now() - lockT < DS.NK.lock || !pick) return; var c = DS.nkCan(s); if (!c.ok) { A('cancel'); U.toast(c.why, 2600); o.close(); return; } A('tap'); step = 'confirm'; draw(); return; }
    var sb = e.target.closest('[data-nkstep]'); if (sb) { holdStop(); A('tap'); step = sb.dataset.nkstep; draw(); return; }
    if (e.target.closest('#nkHold') && !fired && !holdT0) { var hn = $('.nkhn', o); if (hn) { hn.textContent = T.holdTap; hn.classList.add('on'); } }      // 짧게 누르기만 했다
  });
  o.addEventListener('pointerdown', holdStart);
  o.addEventListener('keydown', holdStart);
  o.addEventListener('keyup', function (e) { if (!fired && holdT0 && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); holdStop(); } });
  ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(function (k) { o.addEventListener(k, function (e) { if (!fired && holdT0 && (k !== 'pointerleave' || (e.target.closest && e.target.closest('#nkHold')))) holdStop(); }, true); });
  o.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('#nkHold')) e.preventDefault(); });
  o.onclose = function () { holdStop(); if (parent && parent.isConnected && parent.draw) parent.draw(); };
  draw();
  return o;
};
})();
