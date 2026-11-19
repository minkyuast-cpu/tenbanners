// r39 연무장 (1.3.x): 내 사람 둘(또는 내 사람 하나와 다른 플레이어의 대표 맹주)을 1:1 로 붙여 구경한다. 보상도 대가도 없는 순수 재미.
//   · 싸움은 진짜 엔진(DS.Sim)과 진짜 사양(DS.cmdSpec · DS.mercSpec · 맹주 필살기)으로, 따로 만든 작은 장면에서만 돈다 — 본 장면(G.sim)은 창이 열린 동안 멈춰 있을 뿐 건드리지 않는다.
//   · 아무도 죽지 않는다: 연무장 장면의 kill 을 가로채 「쓰러짐(KO)」으로만 친다. 경험치·공훈·골드·물건·체력·마나는 저장에 손대지 않는다 (가방도 빈 가방 inv:{} — 약초를 쓰지 않는다).
//   · 저장에 남는 것은 재미 기록 s.arena = { v, n, r: { 사람키: [이김, 짐] }, o: [다른 맹주에게 이김, 짐] } 하나뿐 (없으면 0 으로 읽는다).
//   · 필살기는 연무장에서만 자동(AI)으로 쓴다 (본 게임의 r36 규칙 — 사람이 눌러야 나간다 — 은 그대로).
//   · r43 (2.0.1) 천하제일 무술대회: 같은 진짜 엔진 경기로 최대 16명 대진표. 경기마다 기세(운)가 붙고, 골드 배팅이 연무장의 유일한 예외다 (s.gold 와 대회 기록 s.arena.t 만 바뀐다).
//   · 다른 맹주 (웹 판만): 내 맹주의 전투 사양을 champs/{uid} 에 작게 올리고, 남의 것을 읽어 이 기기에서 흉내 낸다. 읽은 값은 하나도 믿지 않는다 (범위·목록으로 거른다).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var AR = DS.ARENA = {
  tmax: 90,            // 엔진 시간 90초가 지나면 판정 (남은 체력 비율)
  ult0: 60,            // 필살 게이지를 반 넘게 채운 채 시작한다 (한 판 안에 한 번은 보이게)
  hpMul: 2.5,          // 연무장 규칙: 둘 다 체력을 2.5배로 (한 방에 끝나지 않고 볼 만하게 — 양쪽이 같아 우열은 그대로). 전투력 숫자는 본래 사양 그대로 보인다
  spd: [1, 2, 3],
  map: ['FFFFFFFFFF',
        'F.f....f.F',
        'F........F',
        'F........F',
        'F..dddd..F',
        'F.dddddd.F',
        'F.dddddd.F',
        'F.dddddd.F',
        'F..dddd..F',
        'F........F',
        'F........F',
        'F.f....f.F',
        'FFFFFFFFFF'],
  posA: [2, 6], posB: [7, 6],
  champGap: 180000,    // 맹주 기록을 올리는 최소 간격 (Spark 쓰기 한도)
  champN: 30
};
var L = {
  title: '연무장', sub: '겨뤄 볼 뿐, 다치는 이는 없다.',
  open: ['한 수 청한다.', '사정 두지 마라.', '오늘은 내가 이긴다.', '손이 근질거리던 참이다.', '목검이 아니어도 좋다.', '눈 감지 마라.'],
  low: ['아직이다.', '제법이군.', '이제 몸이 풀린다.', '여기서 물러설까 보냐.', '숨이 차는군.'],
  win: ['잘 싸웠다.', '좋은 승부였다.', '한 수 잘 배웠다.', '다음엔 네가 이길지도.'],
  lose: ['졌다. 깨끗하게.', '다음엔 안 진다.', '팔이 무겁군.'],
  champ: '먼 곳의 맹주가 기록으로 섰다.',
  noChamp: '다른 맹주의 기록을 아직 불러올 수 없다',
  noneChamp: '아직 연무장에 이름을 올린 맹주가 없다',
  busy: '싸우는 중에는 연무장에 갈 수 없다',
  keeper: '연무장'
};
DS.ARENA_TXT = L;
function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function clean(v, n) { return Array.from(String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff<>&"']/g, '').trim()).slice(0, n).join(''); }
function num(v, lo, hi, d) { v = +v; return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; }

// ───────── 사람 목록 · 사양 (화면 없이도 돈다) ─────────
function heroOf(s) { return s && s.chars ? s.chars[s.hero] || null : null; }
function seatOf(s, m) {
  var bf = DS.bearsFlag ? DS.bearsFlag(s, m) : null; if (bf) return { k: 'bear', ch: bf };
  if (DS.isSb && DS.isSb(m)) { var hm = DS.sbHome ? DS.sbHome(s, m) : null; return hm ? { k: 'bear', ch: hm, sb: 1 } : { k: 'bar', ch: heroOf(s), sb: 1 }; }      // 2.2.0: 막사의 사람은 같은 병과 가문의 가주라고 치고 잰다
  var o = m.o && s.chars[m.o] ? s.chars[m.o] : null;
  if (o) return { k: 'fol', ch: o };
  return { k: 'bar', ch: heroOf(s) };
}
function mercOf(s, id) { for (var i = 0; i < (s.mercs || []).length; i++) if (s.mercs[i].id === id) return s.mercs[i]; return null; }
function rawSpec(s, key) {
  var hero = heroOf(s); if (!hero) return null;
  if (key === 'h') return hero.down || hero.vac ? null : DS.cmdSpec(hero, true, hero.ps);
  var m = key && key.charAt(0) === 'm' ? mercOf(s, +key.slice(1)) : null; if (!m) return null;
  var st = seatOf(s, m); if (!st.ch) return null;
  return st.k === 'bear' ? DS.cmdSpec(st.ch, false, m) : DS.mercSpec(st.ch, m);
}
// 연무장에 세울 사양: 온전한 체력·마나 (저장의 지금 체력은 읽지 않는다 — 다쳐 있어도 연무장에서는 새 몸)
function specOf(s, key) {
  var u = null; try { u = rawSpec(s, key); } catch (x) { if (DS.DEBUG) throw x; u = null; }
  if (!u) return null;
  u = clone(u); u.hp = u.mhp = Math.max(1, Math.round(+u.mhp || +u.hp || 1)); u.mmp = Math.max(0, Math.round(+u.mmp || +u.mp || 0)); u.mp = u.mmp;
  u.arKey = key; return u;
}
DS.arenaSpec = specOf;
function placeText(s, key) {
  if (key === 'h') return '맹주';
  var m = mercOf(s, +key.slice(1)); if (!m) return '';
  var st = seatOf(s, m), fn = function (ch) { try { return DS.flagName(ch.cls); } catch (x) { return ''; } };
  return st.sb ? '막사' : st.k === 'bear' ? fn(st.ch) + ' 가주' : st.k === 'fol' ? fn(st.ch) + ' 가문원' : '자리 없음';
}
function young(s, e) { try { return !!(DS.ageStage && DS.ageStage(s, e) === 'young'); } catch (x) { return false; } }
DS.arenaRoster = function (s) {
  var out = [], hero = heroOf(s); if (!hero) return out;
  var ms = (s.mercs || []).filter(function (m) { return m && !young(s, m); }), hord = DS.partyOrder ? DS.partyOrder(s, Object.keys(s.chars).map(Number)) : [];
  var rank = function (m) { var st = seatOf(s, m); if (st.k === 'bear' && !st.sb) { var i = hord.indexOf(st.ch.id); return 1 + (i < 0 ? 99 : i); } if (st.k === 'fol' && st.ch && st.ch.id === +s.hero) return 200; return 300; };      // 2.2.3: 맹주 → 가주(부대 차례) → 맹주의 가문원 → 나머지
  ms = ms.map(function (m, i) { return { m: m, r: rank(m), i: i }; }).sort(function (a, b) { return a.r - b.r || a.i - b.i; }).map(function (x) { return x.m; });
  var keys = ['h'].concat(ms.map(function (m) { return 'm' + m.id; }));
  keys.forEach(function (k) {
    var u = specOf(s, k); if (!u) return;
    var m = k === 'h' ? null : mercOf(s, +k.slice(1)), st = m ? seatOf(s, m) : { k: 'hero', ch: hero };
    out.push({ key: k, name: k === 'h' ? (DS.charName ? DS.charName(hero) : u.name) : (m.ttl || m.n || u.name), house: k === 'h' ? houseOf(s) : clean(m.sn, 10),
      place: placeText(s, k), seat: st.k, ch: st.ch, m: m, g: k === 'h' ? ((hero.ps && hero.ps.g) || 3) : m.g, pow: DS.power ? DS.power(u) : 0, rec: recOf(s, k), ult: !!u.ult });
  });
  return out;
};
function houseOf(s) { try { return String(DS.houseName ? DS.houseName(s) : '').replace(/ 가문$/, ''); } catch (x) { return ''; } }

// ───────── 재미 기록 (저장의 유일한 흔적) ─────────
function recBox(s, make) {
  var a = s && s.arena;
  if (!a || typeof a !== 'object' || Array.isArray(a)) { if (!make) return null; a = s.arena = { v: 1, n: 0, r: {}, o: [0, 0] }; }
  if (!a.r || typeof a.r !== 'object' || Array.isArray(a.r)) a.r = {};
  if (!Array.isArray(a.o)) a.o = [0, 0];
  return a;
}
function recOf(s, key) { var a = recBox(s, false), r = a && a.r[key]; return Array.isArray(r) ? [Math.max(0, r[0] | 0), Math.max(0, r[1] | 0)] : [0, 0]; }
DS.arenaRec = recOf;
function recAdd(s, win, lose, champ) {
  var a = recBox(s, true); a.n = (a.n | 0) + 1;
  [[win, 0], [lose, 1]].forEach(function (p) { if (!p[0] || p[0].charAt(0) === 'c') return; var r = recOf(s, p[0]); r[p[1]]++; a.r[p[0]] = r; });
  if (champ) a.o[champ === 'win' ? 0 : 1] = (a.o[champ === 'win' ? 0 : 1] | 0) + 1;
  for (var k in a.r) if (k !== 'h' && !mercOf(s, +k.slice(1))) delete a.r[k];      // 떠난 사람의 기록은 지운다 (끝없이 늘지 않게)
}

// ───────── 한 판 (화면 없이도 돈다 — tools/t39_arena.js) ─────────
var SK = DS.SKILLS, DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function ultTry(sim, u, foe) {
  if (!u.ult || !((u.uc || 0) >= 100) || u.casting || (u.fx && u.fx.seal)) return false;
  var S = SK[u.ult]; if (!S || u.gauge < S.tick * sim.q(u)) return false;
  var e0 = S.eff[0], d = dist(u, foe), r0 = S.rng ? S.rng[0] : 0, r1 = S.rng ? S.rng[1] : 0, i;
  if (e0.t === 'summon') return sim.cast(u, u.ult, null);
  if (e0.t === 'heal' || e0.t === 'cleanse' || (e0.t === 'buff' && e0.p > 0)) {
    var heals = S.eff.some(function (e) { return e.t === 'heal'; });
    if (heals ? u.hp > u.mhp * 0.55 : d > 3) return false;
    return sim.cast(u, u.ult, null);
  }
  if (S.tg === 'multi') return sim.cast(u, u.ult, null);
  if (S.tg === 'enemy') return d >= r0 && d <= r1 && sim.cast(u, u.ult, foe);
  if (S.tg === 'tile') return d >= r0 && d <= r1 && sim.cast(u, u.ult, { x: foe.x, y: foe.y });
  if (S.tg === 'self') return sim.victims(u, S, sim.areaTiles(u, S, u.x, u.y)).indexOf(foe) >= 0 && sim.cast(u, u.ult, null);
  if (S.tg === 'dir') for (i = 0; i < 4; i++) { var t = { x: u.x + DIR[i][0], y: u.y + DIR[i][1] }; if (sim.victims(u, S, sim.areaTiles(u, S, t.x, t.y)).indexOf(foe) >= 0) return sim.cast(u, u.ult, t); }
  return false;
}
function prep(spec, id, side, pos) {
  var u = clone(spec); u.id = id; u.side = side; u.role = 'cmd'; u.x = pos[0]; u.y = pos[1]; u.hx = pos[0]; u.hy = pos[1];
  delete u.owner; u.auto = true; u.aggro = side === 'enemy'; u.arena = 1; if (side === 'enemy') u.arSide = 1;
  return u;
}
DS.arenaDuel = function (a, b, o) {
  o = o || {};
  var D = { t: 0, ko: null, win: null, how: null, dmg: {}, ults: {}, done: false, low: {} };
  var mk = function (type, q) {      // 홍(적 쪽) 결투자의 소환수: 아군 소환과 같은 모양으로 만든다 (적 표의 괴물을 부르지 않는다)
    var w = D.B, M = DS.MERCS[type] || DS.MERCS.m_sword;
    return { side: 'enemy', role: 'summon', type: type, name: M.name, L: w.L, look: [type, 1], hp: Math.round(w.mhp * 0.7), mp: 0, mmp: 0, atk: Math.round(w.mag * 0.7), mag: Math.round(w.mag * 0.7),
      def: Math.round(w.def * 0.9), res: Math.round(w.res * 0.7), spd: M.spd, mv: M.mv, mt: M.mt, rng: M.rng.slice(), atkKind: M.atk, dtype: M.dtype, kind: M.kind, tags: (M.tags || []).slice(), life: 20, x: q.x, y: q.y, arSide: 1 };
  };
  var sim = new DS.Sim({ map: AR.map, mode: 'scn', units: [prep(a, 'arA', 'ally', AR.posA), prep(b, 'arB', 'enemy', AR.posB)], seed: o.seed || ((Date.now() & 0xffff) + 1), inv: {}, mk: mk });
  D.sim = sim; D.A = sim.byId.arA; D.B = sim.byId.arB;
  if (!D.A || !D.B) return null;
  sim.hunt = true; sim.combat = true; sim.heroId = null;
  [D.A, D.B].forEach(function (u) { if (!o.raw) { u.mhp = u.hp = Math.max(1, Math.round(u.mhp * AR.hpMul)); } D.dmg[u.id] = 0; D.ults[u.id] = 0; u.uc = u.ult ? AR.ult0 : 0; u.gauge = 60; u.busy = 0.6 + sim.rand() * 0.3; });
  if (o.luck) { luckApply(D.A, o.luck[0], D.B); luckApply(D.B, o.luck[1], D.A); D.luck = o.luck; }      // r43 무술대회만: 기세 (1:1 대결은 o.luck 이 없어 그대로)
  var think0 = sim.think, kill0 = sim.kill;
  sim.think = function (u) {
    if (u === D.A || u === D.B) { u.idle = false; var f = u === D.A ? D.B : D.A; if (ultTry(this, u, f)) return; return this.aiCmd(u); }
    if (u.side === 'enemy') { u.idle = false; return this.aiMerc(u); }      // 홍 쪽 소환수도 아군 소환수처럼 주인을 따른다
    return think0.call(this, u);
  };
  sim.kill = function (v, by) {      // 결투자는 죽지 않는다 — 쓰러짐(KO)으로 끝
    if (v === D.A || v === D.B) {
      if (D.ko) { v.hp = Math.max(1, v.hp); return; }
      v.hp = 0; D.ko = v.id; D.win = v === D.A ? 'arB' : 'arA'; D.how = 'ko';
      var me = this; this.tele.forEach(function (T) { me.emit({ t: 'castEnd', tid: T.id, cancel: true }); }); this.tele = []; this.reDanger();
      this.units.forEach(function (m) { if (!m.dead && m.owner === v.id) kill0.call(me, m, by); });
      this.result = 'ko'; this.emit({ t: 'arenaKo', id: v.id, by: by ? by.id : null });
      return;
    }
    return kill0.call(this, v, by);
  };
  function whose(id) { var u = sim.byId[id]; if (!u) return null; if (u === D.A || u === D.B) return u.id; return u.owner === 'arA' || u.owner === 'arB' ? u.owner : null; }
  D.step = function (dt) {
    if (!D.done) {
      sim.update(dt); D.t = sim.t;
      if (!D.ko && sim.t >= AR.tmax) {
        var ra = D.A.hp / D.A.mhp, rb = D.B.hp / D.B.mhp;
        D.win = ra === rb ? (D.dmg.arA >= D.dmg.arB ? 'arA' : 'arB') : ra > rb ? 'arA' : 'arB'; D.how = 'time'; sim.result = 'time';
      }
      if (D.win) D.done = true;
    }
    var ev = sim.drain();
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.t === 'hit' && e.by && (e.id === 'arA' || e.id === 'arB' || whose(e.id))) { var w = whose(e.by); if (w && w !== (whose(e.id) || e.id)) D.dmg[w] += +e.v || 0; }
      if (e.t === 'ult' && D.ults[e.id] != null) D.ults[e.id]++;
    }
    return ev;
  };
  D.run = function (max) { var n = 0; while (!D.done && n++ < (max || 4000)) D.step(0.05); return D; };      // 시험용: 끝까지
  return D;
};

// ───────── 다른 맹주 (웹 판): 올리는 모양 · 읽어서 거르기 ─────────
var CLS_SK = null;
function skAllowed(id, tier) {
  if (!CLS_SK) { CLS_SK = {}; for (var c in DS.CLASSES) (DS.CLASSES[c].skills || []).forEach(function (s) { var t = CLS_SK[s[0]]; CLS_SK[s[0]] = t == null ? s[1] : Math.min(t, s[1]); }); }
  return own(CLS_SK, id) && CLS_SK[id] <= tier && own(SK, id) && !SK[id].ult;
}
DS.arenaChampSnap = function (s) {
  var hero = heroOf(s), u = specOf(s, 'h'); if (!hero || !u) return null;
  var hs = s.lin && s.lin.hs && own(DS.CLASSES, s.lin.hs) ? s.lin.hs : hero.cls;
  var sk = (u.skills || []).filter(function (id) { return typeof id === 'string' && /^[A-Za-z0-9_]{1,24}$/.test(id); }).slice(0, 8).join(',');
  return { v: 1, name: clean(DS.charName ? DS.charName(hero) : s.name, 12) || '맹주', house: clean(houseOf(s), 16), cls: hero.cls, hs: hs, L: Math.max(1, Math.min(100, hero.L | 0)), g: Math.max(1, Math.min(5, (hero.ps && hero.ps.g) | 0 || 3)),
    pow: Math.max(0, Math.min(1e7, Math.round(DS.power(u)))), hp: u.mhp | 0, mp: u.mmp | 0, atk: Math.round(u.atk), def: Math.round(u.def), mag: Math.round(u.mag), res: Math.round(u.res),
    spd: Math.round((+u.spd || 10) * 100), cr: Math.round((+u.crit || 0) * 1000), dr: Math.round((+u.drain || 0) * 1000), r0: (u.rng && u.rng[0]) | 0, r1: (u.rng && u.rng[1]) | 0, bs: Math.round((+u.basic || 1) * 100),
    sk: sk, ul: u.ult && own(DS.ULTS, u.ult) ? u.ult : '', up: Math.round((+u.ultP || 1) * 100), ur: Math.round((+u.ultR || 1) * 100), w: clean(hero.w || '', 40), a: clean(hero.a || '', 40), ver: String(DS.VERSION || '').slice(0, 16) };
};
// 남의 문서 → 안전한 줄 (모르는 병과·엉뚱한 칸이면 null, 숫자는 그 병과·레벨의 기준치로 묶는다)
DS.arenaChampRow = function (id, d) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id) || !d || typeof d !== 'object' || d.v !== 1) return null;
  if (typeof d.cls !== 'string' || !own(DS.CLASSES, d.cls)) return null;
  var C = DS.CLASSES[d.cls], Lv = Math.round(num(d.L, 1, DS.LV_PER_TIER * DS.MAX_TIER, 1)), tier = DS.tierOfL(Lv);
  if (C.start && tier < C.start) return null;
  var ref = { cls: d.cls, L: Lv }, rs; try { DS.stdGear(ref, tier); rs = DS.charStats(ref); } catch (x) { return null; }
  var top = Math.max(rs.atk, rs.mag), wall = Math.max(rs.def, rs.res);
  var OLDC = d.cls === 'cle' ? { heal: 'cle_combo', cure: 'cle_kick', healAll: 'cle_palm' } : {};      // 2.2.5: 옛 판이 올린 승려 기록의 치유 기술 → 무투가의 기술 (필살기 이름은 DS.skAlias)
  var sk = (typeof d.sk === 'string' ? d.sk.slice(0, 200).split(',') : []).map(function (k) { return OLDC[k] || k; }).filter(function (k, i, a) { return a.indexOf(k) === i && skAllowed(k, tier); }).slice(0, 8);
  var r1 = Math.round(num(d.r1, 1, 6, C.rng ? C.rng[1] : 1)), r0 = Math.round(num(d.r0, 0, r1, 1));
  var row = { id: id, name: clean(d.name, 12) || '이름 없는 맹주', house: clean(d.house, 16), cls: d.cls, hs: typeof d.hs === 'string' && own(DS.CLASSES, d.hs) ? d.hs : d.cls, L: Lv, tier: tier,
    g: Math.round(num(d.g, 1, 5, 3)), hp: Math.round(num(d.hp, 1, rs.hp * 2.5, rs.hp)), mp: Math.round(num(d.mp, 0, Math.max(50, rs.mp * 3), rs.mp)),
    atk: Math.round(num(d.atk, 1, top * 3.5 + 20, rs.atk)), mag: Math.round(num(d.mag, 1, top * 3.5 + 20, rs.mag)), def: Math.round(num(d.def, 0, wall * 4 + 30, rs.def)), res: Math.round(num(d.res, 0, wall * 4 + 30, rs.res)),
    spd: num(+d.spd / 100, C.spd * 0.5, C.spd * 1.6, C.spd), crit: num(+d.cr / 1000, 0, 0.6, 0.06), drain: num(+d.dr / 1000, 0, 0.5, 0), rng: [r0, r1], basic: num(+d.bs / 100, 0.5, 3, C.basic || 1),
    skills: sk, ult: typeof d.ul === 'string' && own(DS.ULTS, DS.skAlias(d.ul)) ? DS.skAlias(d.ul) : null, ultP: num(+d.up / 100, 1, 2.5, 1), ultR: num(+d.ur / 100, 0.5, 2.5, 1),
    at: +d.at || 0, w: typeof d.w === 'string' && DS.gear && DS.gear(d.w) ? d.w : '', a: typeof d.a === 'string' && DS.gear && DS.gear(d.a) ? d.a : '' };
  if (!(row.at > 1.6e12 && row.at < Date.now() + 864e5)) row.at = 0;
  row.pow = DS.power(DS.arenaChampSpec(row));      // 올린 전투력은 믿지 않는다 — 걸러 낸 값으로 다시 잰다
  return row;
};
DS.arenaChampSpec = function (r) {
  var C = DS.CLASSES[r.cls];
  return { side: 'ally', role: 'cmd', name: r.name, L: r.L, tier: r.tier, cls: r.cls, look: [r.cls, r.tier], hp: r.hp, mhp: r.hp, mp: r.mp, mmp: r.mp, atk: r.atk, def: r.def, mag: r.mag, res: r.res,
    spd: r.spd, mv: C.mv, mt: C.mt, rng: r.rng.slice(), atkKind: C.atk, dtype: C.dtype, kind: C.kind, tags: (C.tags || []).slice(), basic: r.basic, passive: C.passive, skills: r.skills.slice(),
    drain: r.drain, crit: r.crit, hero: true, ult: r.ult, ultP: r.ultP, ultR: r.ultR, house: r.hs, arKey: 'c:' + r.id };
};

// ───────── r43 천하제일 무술대회: 기세 · 배당 · 대진 (화면 없이도 돈다 — tools/t42_tourney.js) ─────────
//   · 기세: 경기마다 양쪽이 따로 굴린다. 공격(공격·마공)과 체력에 같은 배율 F 를 얹는다 → 전투력도 F 배. 셋에 하나꼴로 덤(선공 · 급소 · 투지 · 철벽)이 붙는다.
//     F = e^(폭 × z), z 는 균등 셋의 합으로 만든 종 모양(−3..+3). 둘 다 같은 분포라 고르게 강한 둘은 반반, 전투력이 앞선 쪽은 대개 이긴다 (잰 값은 report · t42).
//   · 배당: 이길 확률 p = 1 / (1 + (상대 전투력 / 내 전투력)^k) (엔진으로 잰 승률에 맞춘 k). 배당 = 몫 / p, 0.05 단위로 내린다.
//     배당이 oMin 보다 낮아지는 (너무 기운) 쪽은 배팅을 받지 않는다 — 어느 쪽에 걸어도 기대값이 1 을 넘지 않게.
//   · 배팅 한도: 지금 골드의 10% 와 (300 + 맹주 레벨 × 50) 가운데 작은 쪽, 10 단위로 내린다. 0 (걸지 않음) 도 된다.
//   · 저장에 남는 것: 배팅 골드 (s.gold) 와 대회 기록 s.arena.t = { n 연 횟수, b 건 횟수, h 맞힌 횟수, best 가장 큰 배당금, net 손익, ch: 최근 우승자 10 } 뿐.
var TN = DS.TOURNEY = {
  max: 16, min: 2,
  luck: 0.28, fmin: 0.62, fmax: 1.6, evP: 0.36,
  k: 5, edge: 0.9, oMin: 1.2, oMax: 8,
  betPct: 0.1, cap0: 300, capL: 50, chN: 10
};
var LUCK_EV = ['first', 'crit', 'ult', 'guard'];
DS.TOURNEY_EV = { first: '선공', crit: '급소', ult: '투지', guard: '철벽' };
DS.tourneyLuck = function (rnd, ult) {
  rnd = rnd || Math.random;
  var z = (rnd() + rnd() + rnd() - 1.5) * 2, F = Math.max(TN.fmin, Math.min(TN.fmax, Math.exp(TN.luck * z))), ev = null;
  if (rnd() < TN.evP) { ev = LUCK_EV[Math.floor(rnd() * LUCK_EV.length) % LUCK_EV.length]; if (ev === 'ult' && !ult) ev = 'crit'; }
  return { f: Math.round(F * 100) / 100, ev: ev };
};
function luckApply(u, k, foe) {
  if (!k) return;
  var f = num(k.f, TN.fmin, TN.fmax, 1);
  u.atk = Math.round(u.atk * f); u.mag = Math.round(u.mag * f); u.mhp = u.hp = Math.max(1, Math.round(u.mhp * f));
  if (k.ev === 'first') { u.busy = 0.05; foe.busy = Math.max(foe.busy, 1.1); }
  else if (k.ev === 'crit') u.crit = Math.min(0.6, (+u.crit || 0.06) + 0.1);
  else if (k.ev === 'ult' && u.ult) u.uc = 100;
  else if (k.ev === 'guard') { u.def = Math.round(u.def * 1.15); u.res = Math.round(u.res * 1.15); }
}
DS.tourneyLuckText = function (k) {
  if (!k) return '';
  var p = Math.round((k.f - 1) * 100);
  return '기세 ' + (p > 0 ? '+' : p < 0 ? '−' : '±') + Math.abs(p) + '%' + (k.ev ? ' · ' + DS.TOURNEY_EV[k.ev] : '');
};
DS.tourneyWinP = function (pa, pb) { pa = Math.max(1, +pa || 1); pb = Math.max(1, +pb || 1); return 1 / (1 + Math.pow(pb / pa, TN.k)); };
// 배당 [청, 홍]: 0 은 「받지 않음」 (너무 기운 쪽)
DS.tourneyOdds = function (pa, pb) {
  var p = DS.tourneyWinP(pa, pb);
  return [p, 1 - p].map(function (q) { var o = Math.floor(TN.edge / Math.max(1e-6, q) * 20) / 20; return o < TN.oMin ? 0 : Math.min(TN.oMax, o); });
};
DS.tourneyBetCap = function (s) {
  var h = heroOf(s), g = Math.max(0, Math.floor(+(s && s.gold) || 0));
  return Math.max(0, Math.floor(Math.min(g * TN.betPct, TN.cap0 + TN.capL * ((h && h.L) | 0)) / 10) * 10);
};
// 대진: 시드 순서 목록(사람 키) → 대진표. 사람 수를 2 의 거듭제곱으로 올려, 모자란 자리는 윗 시드의 부전승.
function seedOrder(P) { var a = [1]; while (a.length < P) { var m = a.length * 2 + 1; a = [].concat.apply([], a.map(function (x) { return [x, m - x]; })); } return a; }
DS.tourneyNew = function (keys) {
  keys = (keys || []).filter(function (k, i, a) { return typeof k === 'string' && a.indexOf(k) === i; }).slice(0, TN.max);
  if (keys.length < TN.min) return null;
  var P = 2; while (P < keys.length) P *= 2;
  var T = { keys: keys, P: P, R: [], done: false, champ: null, bets: [] }, ord = seedOrder(P), r, i;
  for (r = 0, i = P / 2; i >= 1; r++, i /= 2) { var row = []; for (var j = 0; j < i; j++) row.push({ r: r, i: j, a: null, b: null, w: null, bye: false }); T.R.push(row); }
  for (i = 0; i < P / 2; i++) { var M = T.R[0][i], sa = ord[i * 2], sb = ord[i * 2 + 1]; M.a = sa <= keys.length ? keys[sa - 1] : null; M.b = sb <= keys.length ? keys[sb - 1] : null; M.sa = sa; M.sb = sb; }
  T.R[0].forEach(function (M) { if (!M.a || !M.b) { M.bye = true; DS.tourneyWin(T, M, M.a || M.b); } });
  return T;
};
DS.tourneyRoundName = function (T, r) { var n = T.P >> r; return n === 2 ? '결승' : n === 4 ? '4강' : n + '강'; };
DS.tourneyWin = function (T, M, key) {
  if (!M || M.w || (key !== M.a && key !== M.b)) return false;
  M.w = key;
  var nx = T.R[M.r + 1];
  if (nx) { var N = nx[M.i >> 1]; if (M.i % 2) N.b = key; else N.a = key; } else { T.done = true; T.champ = key; }
  return true;
};
DS.tourneyNext = function (T) {
  for (var r = 0; r < T.R.length; r++) for (var i = 0; i < T.R[r].length; i++) { var M = T.R[r][i]; if (!M.w && M.a && M.b) return M; }
  return null;
};
// 한 경기 (엔진만으로 끝까지): 기세는 굴려서 넘기거나 o.luck 으로 준다
DS.tourneyBout = function (a, b, o) {
  o = o || {};
  var lk = o.luck || [DS.tourneyLuck(o.rnd, !!a.ult), DS.tourneyLuck(o.rnd, !!b.ult)];
  var D = DS.arenaDuel(a, b, { seed: o.seed, luck: lk }); if (!D) return null;
  D.run(); return D;
};
// 대회 기록 (s.arena.t) — 없거나 이상하면 0 으로 읽는다
DS.tourneyRec = function (s) {
  var t = s && s.arena && s.arena.t, z = function (v) { v = Math.floor(+v); return isFinite(v) && v > 0 ? v : 0; };
  if (!t || typeof t !== 'object' || Array.isArray(t)) t = {};
  return { n: z(t.n), b: z(t.b), h: z(t.h), best: z(t.best), net: isFinite(+t.net) ? Math.round(+t.net) : 0,
    ch: (Array.isArray(t.ch) ? t.ch : []).filter(function (c) { return c && typeof c === 'object'; }).slice(0, TN.chN).map(function (c) { return { n: clean(c.n, 12), h: clean(c.h, 16), c: typeof c.c === 'string' ? c.c.slice(0, 20) : '', me: c.me ? 1 : 0, at: z(c.at) }; }) };
};
function tRecSave(s, t) { var a = recBox(s, true); a.t = t; }
// 배팅: 걸 때 골드를 내고(lock), 끝나면 맞힌 만큼 받는다. 돌려주는 값: 받은 골드 (빗나가면 0)
DS.tourneyBetLock = function (s, stake) {
  stake = Math.max(0, Math.floor(+stake || 0)); if (!stake) return 0;
  stake = Math.min(stake, DS.tourneyBetCap(s)); if (!stake || s.gold < stake) return 0;
  s.gold -= stake; return stake;
};
DS.tourneyBetSettle = function (s, bet, winKey) {
  if (!bet || !bet.stake) return 0;
  var hit = bet.pick === winKey, pay = hit ? Math.round(bet.stake * bet.odds) : 0, t = DS.tourneyRec(s);
  if (pay) s.gold += pay;
  t.b++; if (hit) t.h++; if (pay > t.best) t.best = pay; t.net += pay - bet.stake;
  tRecSave(s, t);
  return pay;
};
DS.tourneyDone = function (s, champ) {
  var t = DS.tourneyRec(s); t.n++;
  if (champ) { t.ch.unshift({ n: clean(champ.n, 12), h: clean(champ.h, 16), c: String(champ.c || '').slice(0, 20), me: champ.me ? 1 : 0, at: Date.now() }); t.ch = t.ch.slice(0, TN.chN); }
  tRecSave(s, t); return t;
};

// ───────── 마을의 연무장 (모든 마을: 남쪽 길가의 교관) ─────────
var bz0 = DS.buildZone;
if (bz0) DS.buildZone = function (id) {
  var z = bz0.apply(this, arguments);
  if (z && z.town && z.rows && z.rows[14] && z.rows[14].charAt(7) === '.' && !z.pois.some(function (p) { return p.x === 7 && p.y === 14; }))
    z.pois.push({ t: 'arena', x: 7, y: 14, look: 2, label: L.keeper, lx: 7, ly: 12.75, sprite: 'm_pike_3_0' });
  return z;
};

// ───────── 화면 ─────────
if (typeof window === 'undefined' || typeof document === 'undefined') return;
var ST = null, CH = { sig: null, at: 0, err: '', list: null, state: 'idle', mock: null };
function U() { return DS.ui; }
function G() { return DS.G; }
function A(n) { try { U().A(n); } catch (x) {} }
function esc(s) { return U().esc(s == null ? '' : s); }
function fmt(n) { return U().fmtN ? U().fmtN(n) : String(Math.round(n)); }
function mmss(t) { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); }
function webOn() { return !!(CH.mock || (DS.OnlineBE && DS.OnlineBE.name === 'firebase')); }
function sprOf(e, px) {
  var Ui = U(), s = G().save;
  if (e.champ) return Ui.sprTag(DS.lookName(e.champ.cls, e.champ.tier), '', px);
  if (e.key === 'h') return Ui.charSpr(heroOf(s), px);
  if (e.seat === 'bear') return Ui.charSpr(e.ch, px, null, e.m);
  var M = DS.MERCS[e.m.type]; return M && M.big ? Ui.sprTag(M.sprite, M.pal, px * 0.75) : Ui.sprTag(e.m.type + '_' + e.m.g + '_' + (e.m.v || 0), '', px);
}
function crestOf(e, sz) {
  try {
    if (e.champ) return DS.houseCrest(e.champ.hs, sz, { lord: 1 });
    var s = G().save; if (e.key === 'h') return DS.houseCrestOf(s, heroOf(s), sz);
    return e.seat === 'bar' ? '<i class="ar-nocrest" style="width:' + sz + 'px;height:' + sz + 'px"></i>' : DS.houseCrest(e.ch.cls, sz);
  } catch (x) { return ''; }
}
function gradeCol(g) { var Gd = DS.GRADES[g]; return Gd ? Gd.col : '#a7a1c2'; }
function entry(key) {
  if (key && key.indexOf('c:') === 0) { var r = (CH.list || []).filter(function (x) { return 'c:' + x.id === key; })[0]; return r ? { key: key, champ: r, name: r.name, house: r.house, place: '다른 맹주 · ' + r.tier + '단', g: r.g, pow: r.pow, rec: null } : null; }
  return (ST.roster || []).filter(function (e) { return e.key === key; })[0] || null;
}
function specFor(key) { if (key && key.indexOf('c:') === 0) { var e = entry(key); return e ? DS.arenaChampSpec(e.champ) : null; } return specOf(G().save, key); }

DS.arenaCan = function () {
  var g = G(); if (!g || !g.save || !g.sim || !g.zone) return '아직 갈 수 없다';
  if (g.scn || g.ending || g.sim.combat || g.sim._er || (g.sim.units || []).some(function (u) { return !u.dead && u.side === 'enemy' && u.aggro; })) return L.busy;
  return null;
};
DS.arenaOpen = function (o) {
  var why = DS.arenaCan(); if (why) { if (U()) U().toast(why); return null; }
  if (ST && ST.ov && ST.ov.isConnected) return ST.ov;
  o = o || {};
  var g = G(), s = g.save;
  ST = { scr: 'pick', tab: 'own', slot: 1, sel: [null, null], roster: DS.arenaRoster(s), spd: 1, pause: false, raf: 0 };
  if (!ST.roster.length) { U().toast('연무장에 설 사람이 없다'); ST = null; return null; }
  ST.sel[0] = ST.roster[0].key;
  var other = ST.roster.slice(1).sort(function (a, b) { return b.pow - a.pow; })[0]; ST.sel[1] = other ? other.key : null; ST.slot = other ? 0 : 1;
  var ov = U().overlay('<div class="ar-root"></div>', 'arena');
  ST.ov = ov; ST.root = ov.querySelector('.ar-root');
  if (g.view && !own(g.view, 'frame')) { g.view.frame = function () {}; ST.viewOff = true; }      // 본 장면 그리기는 쉰다 (본 장면의 시간은 창이 열려 있어 이미 멈춰 있다)
  ov.onclose = closeUp;
  ST.root.addEventListener('click', onClick);
  draw();
  return ov;
};
DS.arenaClose = function () { if (ST && ST.ov && ST.ov.close) { A('close'); ST.ov.close(); } };
function closeUp() {
  if (!ST) return;
  stopLoop();
  if (ST.T && ST.M && !ST.M.w && ST.D && ST.bet && ST.bet.locked) { try { ST.D.run(); var D = ST.D; tResolve(ST.M, (D.win === 'arA' ? D.A : D.B).arKey); } catch (x) {} }      // 싸우다 닫으면 그 판은 끝까지 돌려 배팅을 정산한다 (닫아서 돌려받는 길은 없다)
  var g = G();
  if (ST.viewOff && g.view) delete g.view.frame;
  g.last = performance.now();
  try { if (DS.Audio && g.zone) DS.Audio.bgm(DS.Audio.zoneTrack ? DS.Audio.zoneTrack(g.zone) : 'town'); } catch (x) {}
  ST = null;
}
function stopLoop() { if (ST && ST.raf) { cancelAnimationFrame(ST.raf); ST.raf = 0; } if (ST) { clearTimeout(ST.tm); clearTimeout(ST.tm2); } }

function draw() {
  if (!ST) return;
  var h = ST.scr === 'pick' ? pickHtml() : ST.scr === 'tset' ? tsetHtml() : ST.scr === 'tbr' ? tbrHtml() : ST.scr === 'tchamp' ? tchampHtml() : fightHtml();
  ST.root.innerHTML = h; U().hydrate(ST.root);
  if (((ST.scr === 'pick' && ST.tab === 'champ') || ST.scr === 'tset') && webOn() && CH.state === 'idle') champLoad();
  if (ST.scr === 'tbr') treeScroll();
}
function slotHtml(i) {
  var e = entry(ST.sel[i]), on = ST.slot === i ? ' on' : '';
  if (!e) return '<button class="ar-slot ' + (i ? 'R' : 'L') + on + '" data-ar="slot" data-s="' + i + '"><span class="ar-sl0">' + (i ? '홍' : '청') + '</span><small>아래에서 고른다</small></button>';
  return '<button class="ar-slot ' + (i ? 'R' : 'L') + on + '" data-ar="slot" data-s="' + i + '"><span class="ar-cor">' + (i ? '홍' : '청') + '</span><span class="ar-sp">' + sprOf(e, 2) + '</span><b>' + esc(e.name) + '</b><small>' + esc(e.place) + '</small><em class="num">' + fmt(e.pow) + '</em></button>';
}
function rowHtml(e, used) {
  var r = e.rec, cur = ST.sel[ST.slot] === e.key;
  return '<li><button class="ar-row' + (cur ? ' cur' : '') + (used ? ' used' : '') + '" data-ar="pick" data-k="' + esc(e.key) + '"' + (used ? ' aria-disabled="true"' : '') + '>' +
    '<span class="ar-sp">' + sprOf(e, 2) + '</span><span class="ar-cr">' + crestOf(e, 18) + '</span>' +
    '<span class="ar-nm"><b style="color:' + gradeCol(e.g) + '">' + esc(e.name) + '</b><small>' + esc(e.place) + (e.house ? ' · ' + esc(e.house) : '') + (e.ult ? ' · 필살기' : '') + '</small></span>' +
    '<span class="ar-pw"><b class="num">' + fmt(e.pow) + '</b><small>' + (r ? (r[0] || r[1] ? r[0] + '승 ' + r[1] + '패' : '첫 대결') : (e.champ && e.champ.at ? ago(e.champ.at) : '')) + '</small></span></button></li>';
}
function ago(t) { var d = Math.max(0, Date.now() - t) / 1000; return d < 3600 ? Math.max(1, Math.floor(d / 60)) + '분 전' : d < 86400 ? Math.floor(d / 3600) + '시간 전' : Math.floor(d / 86400) + '일 전'; }
function pickHtml() {
  var h = '<div class="ar-pick"><div class="ar-head"><b>' + L.title + '</b><small>' + L.sub + '</small><button class="ar-x" data-ar="x" aria-label="닫기">✕</button></div>' + modeHtml();
  h += '<div class="ar-slots">' + slotHtml(0) + '<i class="ar-vs">VS</i>' + slotHtml(1) + '</div>';
  if (webOn()) h += '<nav class="ar-tabs" role="tablist"><button data-ar="tab" data-t="own"' + (ST.tab === 'own' ? ' aria-selected="true"' : '') + '>우리 사람</button><button data-ar="tab" data-t="champ"' + (ST.tab === 'champ' ? ' aria-selected="true"' : '') + '>다른 맹주</button></nav>';
  h += '<p class="ar-hint">' + (ST.tab === 'champ' ? '고른 맹주는 홍 쪽에 선다. 기록으로만 싸운다.' : (ST.slot ? '홍' : '청') + ' 자리에 세울 사람을 누른다') + '</p><ul class="ar-list">';
  if (ST.tab === 'champ') {
    if (CH.state === 'loading' || CH.state === 'idle') h += '<li class="ar-msg">기록을 펼치는 중</li>';
    else if (CH.state === 'err') h += '<li class="ar-msg">' + L.noChamp + '</li>';
    else if (!CH.list.length) h += '<li class="ar-msg">' + L.noneChamp + '</li>';
    else CH.list.forEach(function (r) { h += rowHtml(entry('c:' + r.id), false); });
  } else ST.roster.forEach(function (e) { h += rowHtml(e, ST.sel[1 - ST.slot] === e.key); });
  var ok = ST.sel[0] && ST.sel[1] && ST.sel[0] !== ST.sel[1];
  h += '</ul><p class="ar-rule">연무장 규칙: 서로 체력을 ' + AR.hpMul + '배로 겨룬다. 가방은 들고 들어가지 않는다.</p><div class="ar-foot"><button class="btn gold wide" data-ar="go"' + (ok ? '' : ' disabled') + '>대결 시작</button></div></div>';
  return h;
}
function fightHtml() {
  var a = entry(ST.sel[0]), b = entry(ST.sel[1]);
  function bar(e, i) { return '<div class="ar-hp ' + (i ? 'R' : 'L') + '"><span class="ar-cr">' + crestOf(e, 18) + '</span><b>' + esc(e.name) + '</b><i class="ar-bar"><u></u><s></s></i><i class="ar-ub"><u></u></i></div>'; }
  return '<div class="ar-fight"><div class="ar-hud">' + bar(a, 0) + '<b class="ar-clock num">0:00</b>' + bar(b, 1) + '</div>' +
    '<div class="ar-stage"><canvas class="px ar-cv"></canvas><div class="ar-cut" hidden></div><div class="ar-ko" hidden></div></div>' +
    '<div class="ar-ctl"><button class="sy" data-ar="pause"><b>Ⅱ</b><small>멈춤</small></button><button class="sy" data-ar="spd"><b>' + ST.spd + '×</b><small>속도</small></button>' + (ST.T ? '<button class="sy" data-ar="tskip"><b>»</b><small>결과만</small></button>' : '<button class="sy" data-ar="quit"><b>✕</b><small>그만</small></button>') + '</div>' +
    introHtml(a, b) + '<div class="ar-res" hidden></div></div>';
}
function card(e, i) {
  var k = ST.T && ST.luck ? ST.luck[i] : null;
  return '<div class="ar-ic ' + (i ? 'R' : 'L') + '"><span class="ar-cor">' + (i ? '홍' : '청') + '</span><span class="ar-icr">' + crestOf(e, 30) + '</span><span class="ar-isp">' + sprOf(e, 4) + '</span><b>' + esc(e.name) + '</b><small>' + esc(e.place) + (e.house ? '<br>' + esc(e.house) : '') + '</small><em><small>전투력</small> <b class="num">' + fmt(e.pow) + '</b></em>' +
    (k ? '<p class="ar-luck ' + (k.f > 1.005 ? 'up' : k.f < 0.995 ? 'dn' : '') + '">' + esc(DS.tourneyLuckText(k)) + '</p>' : '') + '</div>';
}
function introHtml(a, b) {
  return '<div class="ar-intro" data-ar="skip">' + (ST.T && ST.M ? '<p class="ar-itag">' + LT.title + ' · ' + DS.tourneyRoundName(ST.T, ST.M.r) + (ST.M.r < ST.T.R.length - 1 ? ' ' + (ST.M.i + 1) + '경기' : '') + '</p>' : '') +
    card(a, 0) + '<i class="ar-ivs">VS</i>' + card(b, 1) + '<b class="ar-go">대결!</b>' + (b.champ ? '<p class="ar-inote">' + L.champ + '</p>' : '') + (ST.T && ST.bet && ST.bet.locked ? '<p class="ar-inote">' + betLine(ST.bet) + '</p>' : '') + '</div>';
}

function onClick(ev) {
  var t = ev.target.closest('[data-ar]'); if (!t || !ST) return;
  var k = t.dataset.ar;
  if (k === 'x') { DS.arenaClose(); return; }
  if (k === 'mode' || k.charAt(0) === 't' && k !== 'tab') { if (tClick(k, t)) return; }
  if (k === 'slot') { ST.slot = +t.dataset.s; if (ST.slot === 0 && ST.tab === 'champ') ST.tab = 'own'; A('tap'); draw(); return; }
  if (k === 'tab') { ST.tab = t.dataset.t; if (ST.tab === 'champ') ST.slot = 1; A('tap'); if (ST.tab === 'champ' && CH.state === 'err') CH.state = 'idle'; draw(); return; }
  if (k === 'pick') {
    var key = t.dataset.k; if (ST.sel[1 - ST.slot] === key) { A('deny'); return; }
    ST.sel[ST.slot] = key; A('tap');
    if (ST.slot === 0 && !ST.sel[1]) ST.slot = 1; else if (ST.slot === 1 && !ST.sel[0]) ST.slot = 0;
    draw(); return;
  }
  if (k === 'go') { if (ST.sel[0] && ST.sel[1] && ST.sel[0] !== ST.sel[1]) { A('ok'); start(); } return; }
  if (k === 'skip') { if (ST.phase === 'intro') begin(); return; }
  if (k === 'pause') { ST.pause = !ST.pause; A('tap'); t.querySelector('b').textContent = ST.pause ? '▶' : 'Ⅱ'; t.querySelector('small').textContent = ST.pause ? '잇기' : '멈춤'; return; }
  if (k === 'spd') { var i = AR.spd.indexOf(ST.spd); ST.spd = AR.spd[(i + 1) % AR.spd.length]; A('tap'); t.querySelector('b').textContent = ST.spd + '×'; return; }
  if (k === 'quit') { A('cancel'); stopLoop(); ST.scr = 'pick'; ST.D = null; ST.view = null; draw(); return; }
  if (k === 'again') { A('ok'); start(); return; }
  if (k === 'other') { A('tap'); stopLoop(); ST.scr = 'pick'; ST.D = null; ST.view = null; ST.roster = DS.arenaRoster(G().save); draw(); return; }
}

// ── 한 판 띄우기: 소개 카드 → 싸움 → 쓰러짐 → 결과 ──
function start() {
  stopLoop();
  var a = specFor(ST.sel[0]), b = specFor(ST.sel[1]);
  if (!a || !b) { U().toast('그 사람을 세울 수 없다'); ST.scr = ST.T ? 'tbr' : 'pick'; draw(); return; }
  ST.scr = 'fight'; ST.pause = false; draw();
  var D = DS.arenaDuel(a, b, ST.T ? { luck: ST.luck } : undefined); if (!D) { ST.scr = ST.T ? 'tbr' : 'pick'; draw(); return; }
  ST.D = D; ST.phase = 'intro'; ST.koAt = 0; ST.said = {};
  var cv = ST.root.querySelector('.ar-cv'), V = new DS.View(cv);
  ST.view = V; V.mtag = 'all';
  V.setScene(D.sim, { rows: AR.map, theme: 'highland', seed: 39, pois: [], decor: [] });
  V.focus = null; V.inset = { top: 0, bottom: 0 };
  ST.last = performance.now();
  try { DS.Audio.bgm('battle'); } catch (x) {}
  ST.raf = requestAnimationFrame(loop);
  var intro = ST.root.querySelector('.ar-intro'); if (intro) { void intro.offsetWidth; intro.classList.add('on'); }
  A('open');
  ST.tm = setTimeout(function () { if (ST && ST.phase === 'intro') { var go = ST.root.querySelector('.ar-go'); if (go) go.classList.add('on'); A('slam'); } }, U().calm() ? 300 : 1300);
  ST.tm2 = setTimeout(function () { if (ST && ST.phase === 'intro') begin(); }, U().calm() ? 900 : 2300);
}
function begin() {
  if (!ST || ST.phase !== 'intro') return;
  ST.phase = 'fight'; clearTimeout(ST.tm); clearTimeout(ST.tm2);
  var intro = ST.root.querySelector('.ar-intro'); if (intro) { intro.classList.add('out'); setTimeout(function () { if (intro.parentNode) intro.remove(); }, 260); }
  barkSoon(ST.D.A, 'open', 200); barkSoon(ST.D.B, 'open', 1500);
  if (ST.T && ST.luck && ST.view) [ST.D.A, ST.D.B].forEach(function (u, i) { var k = ST.luck[i]; if (k) ST.view.float(u.x, u.y, DS.tourneyLuckText(k), k.f >= 1 ? '#9fe08a' : '#ff9a8a', { dy: -22, life: 2.2, s: 1 }); });
}
function bark(u, kind) { if (!ST || !ST.view || !u || (G().save.opt && G().save.opt.bark === false)) return; ST.view.bark(u.id, pick(L[kind]), 2.1); }
function barkSoon(u, kind, ms) { setTimeout(function () { if (ST && ST.D && ST.view) bark(u, kind); }, ms); }
function loop(now) {
  if (!ST || !ST.view || !ST.D) return;
  ST.raf = requestAnimationFrame(loop);
  var dt = Math.min(0.05, Math.max(0, (now - ST.last) / 1000)); ST.last = now;
  var D = ST.D, evs = [], slow = 1;
  if (ST.koAt) { var kt = (now - ST.koAt) / 1000; slow = kt < 1.3 ? 0.28 : 1; }
  try {
    if (ST.phase === 'fight' && !ST.pause) evs = D.step(dt * ST.spd);
    var f0 = DS.spdOf, sp = ST.spd; DS.spdOf = function () { return sp; };      // 화면의 걸음 그림도 연무장 배속을 따른다
    try { ST.view.frame(dt * slow, evs); } finally { DS.spdOf = f0; }
    if (ST.koAt && ST.loser) ST.view.vu[ST.loser] && (ST.view.vu[ST.loser].alpha = 0.45);
  } catch (x) { if (DS.loopErr) DS.loopErr(x, 'arena'); }
  for (var i = 0; i < evs.length; i++) onEv(evs[i]);
  hud();
  if (D.done && ST.phase === 'fight') finish();
}
function onEv(e) {
  var D = ST.D;
  if (e.t === 'ult') { var u = D.sim.byId[e.id], S = SK[e.sk]; if (u && S) cut(u, S); }
  if (e.t === 'hit' && (e.id === 'arA' || e.id === 'arB')) { var v = D.sim.byId[e.id]; if (v && !ST.said[v.id] && v.hp > 0 && v.hp < v.mhp * 0.35) { ST.said[v.id] = 1; bark(v, 'low'); } }
}
function cut(u, S) {
  var el = ST.root.querySelector('.ar-cut'); if (!el) return;
  el.className = 'ar-cut ' + (u.side === 'ally' ? 'L' : 'R'); el.innerHTML = '<small>필살기</small><b>' + esc(S.name) + '</b>'; el.hidden = false;
  void el.offsetWidth; el.classList.add('on'); A('ultReady');
  clearTimeout(el._t); el._t = setTimeout(function () { el.hidden = true; el.classList.remove('on'); }, 1200);
}
function hud() {
  var D = ST.D, r = ST.root;
  [[D.A, '.ar-hp.L'], [D.B, '.ar-hp.R']].forEach(function (p) {
    var u = p[0], el = r.querySelector(p[1]); if (!el) return;
    var f = Math.max(0, Math.min(1, u.hp / u.mhp)), bar = el.querySelector('.ar-bar u'), lag = el.querySelector('.ar-bar s');
    bar.style.width = (f * 100).toFixed(1) + '%';
    var lw = parseFloat(lag.style.width || '100'); if (lw < f * 100) lw = f * 100; else lw = Math.max(f * 100, lw - 0.6); lag.style.width = lw.toFixed(1) + '%';
    el.classList.toggle('low', f < 0.3);
    var ub = el.querySelector('.ar-ub'); ub.hidden = !u.ult; if (u.ult) { ub.querySelector('u').style.width = Math.min(100, u.uc || 0).toFixed(0) + '%'; ub.classList.toggle('full', (u.uc || 0) >= 100); }
  });
  var c = r.querySelector('.ar-clock'); if (c) c.textContent = mmss(D.t);
}
function finish() {
  var D = ST.D, V = ST.view, g = G(), s = g.save;
  ST.phase = 'ko'; ST.koAt = performance.now();
  var win = D.sim.byId[D.win], lose = win === D.A ? D.B : D.A;
  ST.loser = D.how === 'ko' ? lose.id : null;
  if (V) { V.focus = lose.id; V.snap = false; V.flashA = 0.12; V.shake = Math.max(V.shake || 0, 0.45); if (V.hitStop) V.hitStop(0.14); V.float(lose.x, lose.y, D.how === 'ko' ? '쓰러졌다' : '판정', '#ffd75e', { dy: -14, life: 1.6, s: 1.3 }); }
  A('slam'); U().haptic(30);
  var ko = ST.root.querySelector('.ar-ko'); if (ko) { ko.innerHTML = '<b>' + (D.how === 'ko' ? '결착!' : '시간 끝, 판정') + '</b>'; ko.hidden = false; void ko.offsetWidth; ko.classList.add('on'); }
  var cvs = ST.root.querySelector('.ar-cv'); if (cvs && !U().calm()) cvs.classList.add('ko');
  // 재미 기록 (저장에 남는 유일한 것). 다른 맹주는 기록에 이름을 남기지 않는다 — 내 쪽 승패와 「다른 맹주 상대」 합만
  var wk = win.arKey, lk = lose.arKey, champ = wk.indexOf('c:') === 0 ? 'lose' : lk.indexOf('c:') === 0 ? 'win' : null;
  if (ST.T) tResolve(ST.M, wk);      // 무술대회: 대진표와 배팅만 (1:1 재미 기록에는 넣지 않는다)
  else try { recAdd(s, wk, lk, champ); U().persist(); } catch (x) {}
  ST.res = { win: win, lose: lose, how: D.how, t: D.t, dmg: D.dmg, ults: D.ults };
  ST.tm = setTimeout(function () { if (ST && ST.D === D) bark(win, 'win'); }, 1000);
  ST.tm2 = setTimeout(function () { if (ST && ST.D === D) result(); }, U().calm() ? 700 : 1900);
}
function result() {
  var R = ST.res, s = G().save, el = ST.root.querySelector('.ar-res'); if (!el) return;
  ST.phase = 'done';
  if (ST.T) { tResult(el, R); return; }
  var we = entry(R.win.arKey), le = entry(R.lose.arKey), rw = R.win.arKey.charAt(0) !== 'c' ? recOf(s, R.win.arKey) : null;
  var ko = ST.root.querySelector('.ar-ko'); if (ko) ko.hidden = true;
  function line(u, e) { return '<li><span class="ar-cr">' + crestOf(e, 16) + '</span><b>' + esc(e.name) + '</b><span>준 피해 <b class="num">' + fmt(R.dmg[u.id] || 0) + '</b>' + (R.ults[u.id] ? ' · 필살기 ' + R.ults[u.id] + '번' : '') + '</span></li>'; }
  var A0 = ST.D.A, B0 = ST.D.B;
  el.innerHTML = '<div class="ar-rcard"><small class="ar-rk">' + (R.how === 'ko' ? '쓰러뜨려 이겼다' : '판정으로 이겼다') + '</small><span class="ar-rsp">' + sprOf(we, 4) + '</span><span class="ar-rcr">' + crestOf(we, 28) + '</span>' +
    '<h2>' + esc(we.name) + ' 승리</h2><p class="ar-rsub">' + esc(we.place) + (rw ? ' · 연무장 ' + rw[0] + '승 ' + rw[1] + '패' : '') + '</p>' +
    '<ul class="ar-rl">' + line(A0, entry(A0.arKey)) + line(B0, entry(B0.arKey)) + '<li class="ar-rt"><span>걸린 시간</span><b class="num">' + mmss(R.t) + '</b></li></ul>' +
    '<p class="ar-rnote">연무장의 승부는 기록에만 남는다. 다친 이도, 얻은 것도 없다.</p>' +
    '<div class="ar-rbtn"><button class="btn gold" data-ar="again">다시</button><button class="btn" data-ar="other">다른 대결</button><button class="btn" data-ar="x">나가기</button></div></div>';
  U().hydrate(el); el.hidden = false; void el.offsetWidth; el.classList.add('on'); A('win');
}

// ───────── r43 천하제일 무술대회 화면: 참가자 → 대진표(배팅) → 경기(관람 · 결과만) → 시상 ─────────
var LT = L.t = {
  title: '천하제일 무술대회', sub: '최대 16명. 사람이 모자라면 있는 만큼으로 연다.',
  duel: '1:1 대결', auto: '자동 배치', man: '수동 배치',
  hAuto: '전투력 순으로 16명까지 뽑아 시드를 정한다.', hMan: '누른 순서가 시드다. 다시 누르면 뺀다.',
  go: '대회 개최', few: '두 명 이상 있어야 연다',
  rule: '경기마다 기세(공격·체력 ±, 선공·급소·투지·철벽)가 붙는다. 배팅은 골드만 오간다.',
  watch: '관람', quick: '결과만 보기', all: '남은 경기 모두 결과만',
  cast: {
    open: ['천하제일 무술대회, 지금 시작합니다.', '관중석이 가득 찼습니다. 첫 경기입니다.', '오늘 연무장은 열기가 뜨겁습니다.'],
    even: ['전투력이 비슷합니다. 끝까지 봐야 압니다.', '팽팽한 승부가 예상됩니다.', '누가 이겨도 이상하지 않은 대진입니다.'],
    lop: ['{f:이가} 앞선다는 평입니다. 이변이 나올까요?', '전력 차이가 큽니다. 그래도 승부는 모릅니다.', '{u}에게는 기세가 필요합니다.'],
    fin: ['드디어 결승입니다. 천하제일이 가려집니다.', '마지막 승부입니다. 숨을 고르십시오.'],
    upset: ['이변입니다! {w:이가} 강자를 꺾었습니다.', '배당표가 뒤집혔습니다. {w}의 승리!', '관중석이 술렁입니다. {w:이가} 해냈습니다.'],
    fav: ['예상대로 {w:이가} 올라갑니다.', '{w}, 무난하게 다음 판으로 갑니다.'],
    champ: ['{w:이가} 천하제일의 자리에 올랐습니다!', '오늘의 천하제일은 {w}입니다.']
  }
};
function say(kind, m) {
  return pick(LT.cast[kind]).replace(/\{(\w)(?::(\S+?))?\}/g, function (_, k, j) { var n = m[k] || ''; return j ? U().josa(n, j) : n; });
}
function modeHtml() {
  var t = ST.mode === 'tour';
  return '<nav class="ar-mode" role="tablist"><button data-ar="mode" data-m="duel"' + (t ? '' : ' aria-selected="true"') + '>' + LT.duel + '</button><button data-ar="mode" data-m="tour"' + (t ? ' aria-selected="true"' : '') + '><i>天</i>' + LT.title + '</button></nav>';
}
function isChamp(e) { return !!(e && e.champ); }
function pool() {
  var out = (ST.roster || []).slice();
  if (webOn() && CH.state === 'ok') (CH.list || []).forEach(function (r) { var e = entry('c:' + r.id); if (e) out.push(e); });
  return out;
}
function byPow(a, b) { return b.pow - a.pow; }
function autoKeys() {      // 맹주 + 다른 맹주(8까지) + 나머지는 전투력 순으로 16 → 전투력 순이 시드
  var P = pool(), me = P.filter(function (e) { return e.key === 'h'; }), ch = P.filter(isChamp).sort(byPow).slice(0, 8), rest = P.filter(function (e) { return e.key !== 'h' && !isChamp(e); }).sort(byPow);
  return me.concat(ch, rest).slice(0, TN.max).sort(byPow).map(function (e) { return e.key; });
}
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
function sizeText(n) {
  if (n < TN.min) return LT.few;
  var P = 2; while (P < n) P *= 2;
  return n + '명 · ' + (P === 2 ? '결승만' : P + '강부터') + (P > n ? ' · 부전승 ' + (P - n) : '');
}
function crestKey(e) { return !e ? '' : e.champ ? 'C:' + e.champ.hs : e.key === 'h' ? 'h' : e.seat === 'bar' ? '' : (e.ch && e.ch.cls) || ''; }
function crestByKey(c, sz) {
  try {
    var s = G().save;
    if (c === 'h') return DS.houseCrestOf(s, heroOf(s), sz);
    if (c && c.indexOf('C:') === 0 && own(DS.CLASSES, c.slice(2))) return DS.houseCrest(c.slice(2), sz, { lord: 1 });
    if (c && own(DS.CLASSES, c)) return DS.houseCrest(c, sz);
  } catch (x) {}
  return '<i class="ar-nocrest" style="width:' + sz + 'px;height:' + sz + 'px"></i>';
}
function tRecHtml() {
  var t = DS.tourneyRec(G().save);
  var h = '<div class="ar-trecw"><div class="ar-trec"><span><small>연 대회</small><b class="num">' + t.n + '</b></span><span><small>배팅 적중</small><b class="num">' + t.h + '<i>/' + t.b + '</i></b></span><span><small>최고 배당금</small><b class="num">' + fmt(t.best) + '</b></span><span><small>손익</small><b class="num ' + (t.net > 0 ? 'up' : t.net < 0 ? 'dn' : '') + '">' + (t.net > 0 ? '+' : '') + fmt(t.net) + '</b></span></div>';
  if (t.ch.length) h += '<div class="ar-tchl"><small>최근 우승</small>' + t.ch.map(function (c) { return '<span class="ar-tchc' + (c.me ? ' me' : '') + '">' + crestByKey(c.c, 14) + '<b>' + esc(c.n) + '</b></span>'; }).join('') + '</div>';
  return h + '</div>';
}
function tsetHtml() {
  var ts = ST.ts, P = pool(), sel = ts.keys, n = sel.length;
  var h = '<div class="ar-pick ar-tset"><div class="ar-head"><b>' + L.title + '</b><small>' + LT.sub + '</small><button class="ar-x" data-ar="x" aria-label="닫기">✕</button></div>' + modeHtml() + tRecHtml();
  h += '<div class="ar-tseg"><button data-ar="tauto" data-v="1"' + (ts.auto ? ' aria-selected="true"' : '') + '>' + LT.auto + '</button><button data-ar="tauto" data-v="0"' + (ts.auto ? '' : ' aria-selected="true"') + '>' + LT.man + '</button></div>';
  h += '<div class="ar-tinfo"><b class="' + (n < TN.min ? 'no' : '') + '">' + sizeText(n) + '</b><span><button data-ar="tmix">섞기</button><button data-ar="tsort">전투력순</button>' + (ts.auto ? '' : '<button data-ar="tclr">비우기</button>') + '</span></div>';
  h += '<p class="ar-hint">' + (ts.auto ? LT.hAuto : LT.hMan) + (webOn() && CH.state !== 'ok' && CH.state !== 'err' ? ' 다른 맹주 기록을 펼치는 중.' : '') + '</p><ul class="ar-list">';
  var on = sel.map(entry).filter(Boolean), off = P.filter(function (e) { return sel.indexOf(e.key) < 0; }).sort(byPow);
  on.concat(off).forEach(function (e) {
    var i = sel.indexOf(e.key);
    h += '<li><button class="ar-row ar-tsrow' + (i >= 0 ? ' in' : '') + '" data-ar="tent" data-k="' + esc(e.key) + '"><span class="ar-tseed">' + (i >= 0 ? (i + 1) : '+') + '</span><span class="ar-sp">' + sprOf(e, 2) + '</span><span class="ar-cr">' + crestOf(e, 18) + '</span>' +
      '<span class="ar-nm"><b style="color:' + gradeCol(e.g) + '">' + esc(e.name) + '</b><small>' + esc(e.place) + (e.house ? ' · ' + esc(e.house) : '') + '</small></span><span class="ar-pw"><b class="num">' + fmt(e.pow) + '</b><small>' + (i >= 0 ? (i + 1) + '번 시드' : '빠짐') + '</small></span></button></li>';
  });
  h += '</ul><p class="ar-rule">' + LT.rule + '</p><div class="ar-foot"><button class="btn gold wide" data-ar="tgo"' + (n >= TN.min ? '' : ' disabled') + '>' + LT.go + ' <small>' + (n >= TN.min ? n + '명' : '') + '</small></button></div></div>';
  return h;
}
// ── 대진표 ──
function slotHtml2(M, key, side) {
  if (!key) return '<p class="ar-ts e"><span></span><b>' + (M.r === 0 && M.bye ? '부전승' : '—') + '</b></p>';
  var e = entry(key), st = M.w ? (M.w === key ? ' w' : ' l') : '', nw = ST.flash && ST.flash === M && M.w === key ? ' new' : '';
  var bet = ST.T.bets.filter(function (b) { return b.m === M && b.pick === key; })[0];
  return '<p class="ar-ts' + st + nw + '"><span class="ar-cr">' + crestOf(e, 14) + '</span><b>' + esc(e ? e.name : '?') + '</b>' + (bet ? '<i class="ar-tmk' + (bet.pay ? ' tok' : M.w ? ' tno' : '') + '" title="배팅"></i>' : M.r === 0 ? '<em>' + (side ? M.sb : M.sa) + '</em>' : '') + '</p>';
}
function treeHtml(T) {
  var nR = T.R.length, fr = function (a) { return a.map(function (x) { return 'minmax(0, ' + x + 'fr)'; }).join(' '); };
  var cols = nR >= 4 ? fr([1.25, 1.05, 1, 0.95, 0.7]) : nR === 3 ? fr([1.2, 1, 1, 0.8]) : 'repeat(' + nR + ', minmax(0, 1fr)) minmax(0, .82fr)';
  var h = '<div class="ar-tree' + (nR >= 4 ? ' tight' : '') + '"><div class="ar-trh" style="grid-template-columns:' + cols + '">';
  for (var r = 0; r < nR; r++) h += '<span class="' + (ST.M && ST.M.r === r ? 'on' : '') + '">' + DS.tourneyRoundName(T, r) + '</span>';
  h += '<span class="ch">우승</span></div><div class="ar-tgrid" style="grid-template-columns:' + cols + ';min-height:max(' + (T.P / 2) * (nR >= 4 ? 54 : 62) + 'px, calc(100% - 24px))">';
  T.R.forEach(function (row, r) {
    h += '<div class="ar-tcol' + (r === nR - 1 ? ' fin' : '') + '">';
    row.forEach(function (M) { h += '<div class="ar-tc' + (M.w && !M.bye ? ' won' : '') + (M.bye ? ' bye' : '') + '"><div class="ar-tm' + (ST.M === M ? ' now' : '') + (M.w ? ' done' : '') + '">' + slotHtml2(M, M.a, 0) + slotHtml2(M, M.b, 1) + '</div></div>'; });
    h += '</div>';
  });
  var ce = T.champ ? entry(T.champ) : null;
  h += '<div class="ar-tcol last"><div class="ar-tc"><div class="ar-tm champ' + (ce ? ' on' : '') + '"><span class="ar-tcrown">' + (U().svg ? U().svg('crown', 16) : '') + '</span>' + (ce ? '<span class="ar-cr">' + crestOf(ce, 18) + '</span><b>' + esc(ce.name) + '</b>' : '<b class="q">?</b>') + '</div></div></div>';
  return h + '</div></div>';
}
function treeScroll() { var c = ST.root.querySelector('.ar-tm.now'), t = ST.root.querySelector('.ar-tree'); if (c && t) { var r = c.getBoundingClientRect(), q = t.getBoundingClientRect(); t.scrollTop += (r.top + r.height / 2) - (q.top + q.height / 2); } }
function stakes() { var cap = DS.tourneyBetCap(G().save), v = [0, Math.floor(cap / 40) * 10, Math.floor(cap / 20) * 10, cap]; return v.filter(function (x, i) { return i === 0 || (x > 0 && v.indexOf(x) === i); }); }
function betLine(b) {
  if (!b || !b.stake || b.side == null) return '배팅 없이 관람';
  var e = entry(b.pick);
  return (b.side ? '홍' : '청') + ' ' + esc(e ? e.name : '') + '에 ' + fmt(b.stake) + 'G · 맞히면 ' + fmt(Math.round(b.stake * b.odds)) + 'G';
}
function curBet() {
  var M = ST.M, b = ST.bet; if (!M || !b) return null;
  var od = ST.odds, sv = stakes(), stake = sv[Math.min(ST.six || 0, sv.length - 1)] || 0;
  return { m: M, side: b.side, pick: b.side == null ? null : b.side ? M.b : M.a, stake: b.side == null || !od[b.side] ? 0 : stake, odds: b.side == null ? 0 : od[b.side] };
}
function tbrHtml() {
  var T = ST.T, M = ST.M, s = G().save;
  var h = '<div class="ar-pick ar-tbr"><div class="ar-head"><b>' + LT.title + '</b><small>' + (M ? DS.tourneyRoundName(T, M.r) + (M.r < T.R.length - 1 ? ' · ' + (M.i + 1) + '경기' : '') + ' · 참가 ' + T.keys.length + '명' : '') + '</small><button class="ar-x" data-ar="x" aria-label="닫기">✕</button></div>';
  h += '<div class="ar-tbody">' + treeHtml(T) + '<div class="ar-tpanel">';
  if (ST.lastR) h += '<p class="ar-tlast ' + (ST.lastR.pay ? 'tok' : ST.lastR.stake ? 'tno' : '') + '">' + ST.lastR.txt + '</p>';
  h += '<p class="ar-tcast"><i>해설</i>' + esc(ST.cast || '') + '</p>';
  if (M) {
    var a = entry(M.a), b = entry(M.b), od = ST.odds, cb = curBet();
    var side = function (e, i) {
      var shut = !od[i], on = ST.bet.side === i;
      return '<button class="ar-tside ' + (i ? 'R' : 'L') + (on ? ' on' : '') + (shut ? ' shut' : '') + '" data-ar="tpick" data-s="' + i + '"' + (shut ? ' aria-disabled="true"' : '') + '><span class="ar-cor">' + (i ? '홍' : '청') + '</span><span class="ar-sp">' + sprOf(e, 2) + '</span><span class="ar-tsn"><span class="ar-cr">' + crestOf(e, 16) + '</span><b>' + esc(e.name) + '</b></span><small class="num">' + fmt(e.pow) + '</small><em>' + (shut ? '배팅 마감' : '배당 <b class="num">' + od[i].toFixed(2) + '</b>') + '</em></button>';
    };
    h += '<div class="ar-tvs">' + side(a, 0) + '<i class="ar-vs">VS</i>' + side(b, 1) + '</div>';
    var sv = stakes();
    h += '<div class="ar-tbet"><div class="ar-tbh"><b>배팅</b><small>보유 <b class="num">' + fmt(s.gold) + '</b>G · 한도 <b class="num">' + fmt(DS.tourneyBetCap(s)) + '</b>G</small></div><div class="ar-tchips">' +
      sv.map(function (v, i) { return '<button data-ar="tstake" data-i="' + i + '"' + ((ST.six || 0) === i || (i === sv.length - 1 && (ST.six || 0) > i) ? ' aria-selected="true"' : '') + '>' + (v ? fmt(v) : '안 건다') + '</button>'; }).join('') + '</div>' +
      '<p class="ar-tbl' + (cb && cb.stake ? ' on' : '') + '">' + (cb && cb.side == null && cb && (ST.six || 0) > 0 ? '이길 쪽을 누르면 배팅이 걸린다' : betLine(cb)) + '</p></div>';
    h += '<div class="ar-tgo"><button class="btn gold" data-ar="twatch">' + LT.watch + '</button><button class="btn" data-ar="tquick">' + LT.quick + '</button></div><button class="ar-tall" data-ar="tall">' + LT.all + ' ›</button>';
  } else if (T.done) h += '<div class="ar-tgo"><button class="btn gold" data-ar="tceremony">시상식</button><button class="btn" data-ar="tnew">새 대회</button></div>';
  return h + '</div></div></div>';
}
// ── 시상 ──
function tchampHtml() {
  var T = ST.T, e = entry(T.champ), path = [], st = T.st;
  T.R.forEach(function (row) { row.forEach(function (M) { if (M.w === T.champ && !M.bye) path.push({ r: DS.tourneyRoundName(T, M.r), o: entry(M.a === T.champ ? M.b : M.a) }); }); });
  var h = '<div class="ar-tchamp"><div class="ar-trays" aria-hidden="true"></div><button class="ar-x" data-ar="x" aria-label="닫기">✕</button>' +
    '<div class="ar-tcl"><p class="ar-tct">' + LT.title + '</p><div class="ar-tstamp"><b>天下第一</b><small>우승</small></div>' +
    '<div class="ar-tcpic"><span class="ar-tccr">' + crestOf(e, 40) + '</span><span class="ar-tcsp">' + sprOf(e, 5) + '</span></div>' +
    '<h2>' + esc(e.name) + '</h2><p class="ar-rsub">' + esc(e.place) + (e.house ? ' · ' + esc(e.house) : '') + '</p></div>' +
    '<div class="ar-tcr"><ul class="ar-tpath">' + path.map(function (p) { return '<li><small>' + p.r + '</small><b>' + esc(p.o ? p.o.name : '') + '</b></li>'; }).join('') + '</ul>' +
    '<p class="ar-tcast"><i>해설</i>' + esc(ST.cast || '') + '</p>' +
    '<div class="ar-tsum"><span><small>배팅</small><b class="num">' + st.b + '번</b></span><span><small>적중</small><b class="num">' + st.h + '번</b></span><span><small>손익</small><b class="num ' + (st.net > 0 ? 'up' : st.net < 0 ? 'dn' : '') + '">' + (st.net > 0 ? '+' : '') + fmt(st.net) + 'G</b></span></div>' +
    '<div class="ar-rbtn"><button class="btn" data-ar="ttree">대진표</button><button class="btn gold" data-ar="tnew">새 대회</button><button class="btn" data-ar="x">나가기</button></div></div></div>';
  return h;
}
// ── 진행 ──
function tSetup() {
  ST.mode = 'tour'; ST.scr = 'tset'; ST.T = null; ST.M = null; ST.D = null; ST.view = null; ST.lastR = null;
  ST.roster = DS.arenaRoster(G().save);
  if (!ST.ts) ST.ts = { auto: true, keys: [] };
  if (ST.ts.auto || !ST.ts.keys.length) ST.ts.keys = autoKeys();
  else ST.ts.keys = ST.ts.keys.filter(function (k) { return !!entry(k); });
}
function tCurrent(first) {
  var T = ST.T, M = DS.tourneyNext(T);
  ST.M = M; ST.D = null; ST.view = null; ST.luck = null;
  if (!M) { ST.scr = 'tchamp'; var ce = entry(T.champ); ST.cast = say('champ', { w: ce ? ce.name : '' }); return; }
  var a = entry(M.a), b = entry(M.b);
  ST.odds = DS.tourneyOdds(a.pow, b.pow); ST.bet = { side: null };
  var f = a.pow >= b.pow ? a : b, u = f === a ? b : a, r = f.pow / Math.max(1, u.pow);
  ST.cast = ST.lastR && ST.lastR.upset && !first ? ST.lastR.cast : M.r === T.R.length - 1 ? say('fin', {}) : first ? say('open', {}) : r < 1.12 ? say('even', {}) : say('lop', { f: f.name, u: u.name });
  ST.scr = 'tbr';
}
function tLock() {      // 배팅을 건다 (골드를 먼저 낸다)
  var b = curBet(), s = G().save; ST.bet = { side: ST.bet.side, locked: false };
  if (!b || !b.stake || b.pick == null) return;
  var paid = DS.tourneyBetLock(s, b.stake); if (!paid) return;
  b.stake = paid; b.locked = true; ST.bet = b; ST.T.bets.push(b); ST.T.st.b++;
  A('coin'); try { U().persist(); } catch (x) {}
}
function tRoll(M) { var a = specFor(M.a), b = specFor(M.b); return [DS.tourneyLuck(null, !!(a && a.ult)), DS.tourneyLuck(null, !!(b && b.ult))]; }
function tResolve(M, wk) {      // 경기 끝: 대진표를 올리고, 배팅을 정산하고, 대회가 끝났으면 기록한다
  var T = ST.T, s = G().save; if (!T || !M || M.w) return;
  DS.tourneyWin(T, M, wk);
  var b = ST.bet && ST.bet.locked && ST.bet.m === M ? ST.bet : null, pay = 0;
  if (b && !b.done) { pay = DS.tourneyBetSettle(s, b, wk); b.done = true; b.pay = pay; if (pay) T.st.h++; T.st.net += pay - b.stake; }
  var we = entry(wk), le = entry(wk === M.a ? M.b : M.a), up = !!(we && le && we.pow < le.pow);
  var wl = ST.luck && ST.luck[wk === M.a ? 0 : 1];
  var txt = esc(DS.tourneyRoundName(T, M.r)) + ' · <b>' + esc(we ? we.name : '') + '</b> 승' + (wl && !b ? ' · ' + esc(DS.tourneyLuckText(wl)) : '') + (b ? (pay ? ' · 배팅 적중 <b class="num">+' + fmt(pay) + 'G</b>' : ' · 배팅 빗나감 <b class="num">−' + fmt(b.stake) + 'G</b>') : '');
  ST.lastR = { m: M, pay: pay, stake: b ? b.stake : 0, upset: up, txt: txt, cast: say(up ? 'upset' : 'fav', { w: we ? we.name : '' }) };
  ST.flash = M;
  if (T.done && !T.rec) { T.rec = 1; var ce = entry(T.champ); DS.tourneyDone(s, { n: ce ? ce.name : '', h: ce ? ce.house : '', c: crestKey(ce), me: ce && !isChamp(ce) }); }
  try { U().persist(); } catch (x) {}
}
function tQuick(M) {      // 그림 없이 한 판
  var a = specFor(M.a), b = specFor(M.b); if (!a || !b) { DS.tourneyWin(ST.T, M, a ? M.a : M.b); return; }
  var D = DS.tourneyBout(a, b, { luck: ST.luck || tRoll(M) });
  tResolve(M, D && D.win === 'arB' ? M.b : M.a);
}
function tResult(el, R) {
  var T = ST.T, M = ST.M, we = entry(R.win.arKey), last = M.r === T.R.length - 1, b = ST.bet && ST.bet.locked && ST.bet.m === M ? ST.bet : null;
  var ko = ST.root.querySelector('.ar-ko'); if (ko) ko.hidden = true;
  function line(u) { var e = entry(u.arKey), k = ST.luck && ST.luck[u === ST.D.A ? 0 : 1]; return '<li><span class="ar-cr">' + crestOf(e, 16) + '</span><b>' + esc(e.name) + '</b><span>' + (k ? esc(DS.tourneyLuckText(k)) + ' · ' : '') + '피해 <b class="num">' + fmt(R.dmg[u.id] || 0) + '</b></span></li>'; }
  el.innerHTML = '<div class="ar-rcard"><small class="ar-rk">' + DS.tourneyRoundName(T, M.r) + (last ? '' : ' ' + (M.i + 1) + '경기') + ' · ' + (R.how === 'ko' ? '쓰러뜨려 이겼다' : '판정으로 이겼다') + '</small><span class="ar-rsp">' + sprOf(we, 4) + '</span><span class="ar-rcr">' + crestOf(we, 28) + '</span>' +
    '<h2>' + esc(we.name) + ' 승리</h2><p class="ar-rsub">' + (last ? '천하제일 등극' : DS.tourneyRoundName(T, M.r + 1) + ' 진출') + '</p>' +
    '<ul class="ar-rl">' + line(ST.D.A) + line(ST.D.B) + '<li class="ar-rt"><span>걸린 시간</span><b class="num">' + mmss(R.t) + '</b></li></ul>' +
    (b ? '<p class="ar-tbr2 ' + (b.pay ? 'tok' : 'tno') + '">' + (b.pay ? '배팅 적중 · ' + fmt(b.stake) + 'G → <b class="num">' + fmt(b.pay) + 'G</b>' : '배팅 빗나감 · <b class="num">−' + fmt(b.stake) + 'G</b>') + '</p>' : '') +
    '<p class="ar-tcast"><i>해설</i>' + esc(ST.lastR ? ST.lastR.cast : '') + '</p>' +
    '<div class="ar-rbtn one"><button class="btn gold" data-ar="tback">' + (last ? '시상식' : '대진표로') + '</button></div></div>';
  U().hydrate(el); el.hidden = false; void el.offsetWidth; el.classList.add('on'); A(b && b.pay ? 'coin' : 'win');
}
function tClick(k, t) {
  var s = G().save, ts = ST.ts;
  if (k === 'mode') { var m = t.dataset.m; if (m === (ST.mode || 'duel')) return true; A('tap'); stopLoop(); if (m === 'tour') tSetup(); else { ST.mode = 'duel'; ST.scr = 'pick'; ST.T = null; ST.roster = DS.arenaRoster(s); } draw(); return true; }
  if (k === 'tauto') { ts.auto = t.dataset.v === '1'; if (ts.auto) ts.keys = autoKeys(); A('tap'); draw(); return true; }
  if (k === 'tent') { var key = t.dataset.k, i = ts.keys.indexOf(key); ts.auto = false; if (i >= 0) ts.keys.splice(i, 1); else if (ts.keys.length < TN.max) ts.keys.push(key); else { A('deny'); U().toast('16명까지 나간다'); return true; } A('tap'); draw(); return true; }
  if (k === 'tmix') { ts.keys = shuffle(ts.keys); A('tap'); draw(); return true; }
  if (k === 'tsort') { ts.keys = ts.keys.map(entry).filter(Boolean).sort(byPow).map(function (e) { return e.key; }); A('tap'); draw(); return true; }
  if (k === 'tclr') { ts.keys = []; A('tap'); draw(); return true; }
  if (k === 'tgo') { var T = DS.tourneyNew(ts.keys.filter(function (x) { return !!entry(x); })); if (!T) { A('deny'); U().toast(LT.few); return true; } T.st = { b: 0, h: 0, net: 0 }; ST.T = T; ST.lastR = null; ST.flash = null; A('ok'); tCurrent(true); draw(); return true; }
  if (!ST.T) return false;
  if (k === 'tpick') { var sd = +t.dataset.s; if (!ST.odds[sd]) { A('deny'); U().toast('한쪽으로 크게 기운 경기라 이 쪽 배팅은 받지 않는다'); return true; } ST.bet.side = ST.bet.side === sd ? null : sd; A('tap'); draw(); return true; }
  if (k === 'tstake') { ST.six = +t.dataset.i; A('tap'); draw(); return true; }
  if (k === 'twatch') { if (!ST.M) return true; tLock(); ST.luck = tRoll(ST.M); ST.sel = [ST.M.a, ST.M.b]; ST.flash = null; A('ok'); start(); return true; }
  if (k === 'tquick') { if (!ST.M) return true; tLock(); ST.luck = tRoll(ST.M); tQuick(ST.M); A('slam'); tCurrent(false); draw(); return true; }
  if (k === 'tall') { if (!ST.M) return true; tLock(); var n = 0, M; while ((M = DS.tourneyNext(ST.T)) && n++ < 64) { ST.M = M; ST.luck = tRoll(M); tQuick(M); } A('slam'); tCurrent(false); draw(); return true; }
  if (k === 'tskip') { var D = ST.D; if (!D || ST.phase === 'ko' || ST.phase === 'done') return true; A('tap'); if (ST.phase === 'intro') begin(); D.run(); D.sim.drain(); return true; }
  if (k === 'tback') { A('ok'); stopLoop(); tCurrent(false); draw(); return true; }
  if (k === 'tceremony') { A('tap'); ST.scr = 'tchamp'; draw(); return true; }
  if (k === 'ttree') { A('tap'); ST.scr = 'tbr'; ST.M = null; draw(); return true; }
  if (k === 'tnew') { A('ok'); tSetup(); draw(); return true; }
  return false;
}
DS.arenaTourney = function () { if (!ST) return null; tSetup(); draw(); return ST; };      // 시험용
DS.arenaState = function () { return ST; };      // 시험용 (읽기만)

// ── 다른 맹주: 올리기 (웹 판 · 로그인 · 규칙이 받아 줄 때만) · 읽기 ──
function champTick() {
  var O = DS.Online, BE = DS.OnlineBE, g = G();
  if (!BE || BE.name !== 'firebase' || !O || O.st !== 'ready' || !O.uid || !O.db || O.canW === false || CH.err === 'denied' || !g || !g.save || document.hidden) return;
  if (Date.now() - CH.at < AR.champGap) return;
  var doc = null; try { doc = DS.arenaChampSnap(g.save); } catch (x) { doc = null; } if (!doc) return;
  var sig = JSON.stringify(doc); if (sig === CH.sig) return;
  CH.at = Date.now(); doc.at = BE.ts ? BE.ts() : Date.now();
  try {
    Promise.resolve(O.db.doc('champs/' + O.uid).set(doc)).then(function () { CH.sig = sig; CH.err = ''; }, function (e) { var c = (e && e.code) || ''; if (c === 'permission-denied' || c === 'unauthenticated' || c === 'invalid-argument') CH.err = 'denied'; });
  } catch (x) { CH.err = 'denied'; }
}
setTimeout(function () { champTick(); setInterval(champTick, 30000); }, 20000);
DS.arenaChampTick = champTick;
function champLoad() {
  CH.state = 'loading';
  var done = function (rows) { CH.list = rows; CH.state = 'ok'; if (ST && ((ST.scr === 'pick' && ST.tab === 'champ') || ST.scr === 'tset')) { if (ST.scr === 'tset' && ST.ts && ST.ts.auto) ST.ts.keys = autoKeys(); draw(); } };
  var fail = function () { CH.list = []; CH.state = 'err'; if (ST && ((ST.scr === 'pick' && ST.tab === 'champ') || ST.scr === 'tset')) draw(); };
  var me = DS.Online && DS.Online.uid;
  function take(docs) {
    var rows = [];
    (docs || []).slice(0, AR.champN).forEach(function (d) {
      try { var raw = typeof d.data === 'function' ? d.data() : d.data; if (raw && raw.at && typeof raw.at.toMillis === 'function') raw = Object.assign({}, raw, { at: raw.at.toMillis() }); else if (raw && raw.at && raw.at.seconds) raw = Object.assign({}, raw, { at: raw.at.seconds * 1000 }); var r = d.id !== me ? DS.arenaChampRow(String(d.id), raw) : null; if (r) rows.push(r); } catch (x) {}
    });
    rows.sort(function (a, b) { return b.at - a.at; });
    return rows;
  }
  if (CH.mock) { setTimeout(function () { CH.mock === 'err' ? fail() : done(take(CH.mock)); }, 120); return; }
  var O = DS.Online; if (!O || !O.db || O.st !== 'ready') { fail(); return; }
  var t = setTimeout(fail, 10000);
  try {
    Promise.resolve(O.db.collection('champs').orderBy('at', 'desc').limit(AR.champN).get()).then(function (snap) { clearTimeout(t); done(take(snap && snap.docs)); }, function () { clearTimeout(t); fail(); });
  } catch (x) { clearTimeout(t); fail(); }
}
DS.arenaMock = function (rows) { CH.mock = rows; CH.state = 'idle'; CH.list = null; };      // 시험용: 가짜 챔피언 목록 (또는 'err')
})();
