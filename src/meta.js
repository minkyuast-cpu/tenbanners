// 열 개의 깃발 — 성장·장비·용병·부대 규칙
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

DS.rng = function (seed) {
  var a = (seed | 0) || 1;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
DS.hash2 = function (x, y, s) {
  var h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// 전체 균형 손잡이 (시뮬레이션으로 맞춘 값)
DS.BAL = { ehp: 1.5, eatk: 0.75, edef: 1.0, exp: 1.0, gold: 1.0, bench: 0.05, sortieExp: 0.3, sbShare: 0.1, bossCast: true };      // 2.2.0: sbShare = 막사의 사람은 같은 병과 가문의 가주가 얻은 경험치의 이만큼을 함께 얻는다 (나누지 않는다 · 그 병과 가주가 없으면 0) · bench = 가문 밖 사람(없어야 한다)

// 레벨지수 L(1~100) ↔ 단·레벨
DS.tierOfL = function (L) { return Math.min(DS.MAX_TIER, Math.floor((L - 1) / DS.LV_PER_TIER) + 1); };
DS.lvOfL = function (L) { return (L - 1) % DS.LV_PER_TIER + 1; };
// 단이 오를수록 한 레벨에 드는 경험치가 가파르게 는다
DS.EXP_TIER = [1.1, 2.09, 2.62, 3.3, 4.2, 5.6, 6.8, 8.4, 9.4, 10.0, 10.8];      // r42 (2.0.0): 사람마다 경험치를 받고 합일이 사람 셋이라 5단부터 가파르게 — 봇 3시드 3.7~4.5시간 (1.4.0: 4.3~4.6)
DS.expNeed = function (L) { return Math.round((30 + 17 * L) * DS.EXP_TIER[DS.tierOfL(L)]); };
// ⑮ 합일: 7단 10레벨 가문 셋(1.0.1: 아무 셋)이 하나로 합쳐지지 않고 각각 8단(L71~)으로 함께 오른다. 8단 뒤의 모습·기술은 제 계열 마스터의 것. 「오른 깃발」 = 마스터 아닌 병과로 L > 70
DS.risen = function (ch) { return !!ch && !DS.CLASSES[ch.cls].master && ch.L > 70; };
// 2.2.9: 8단 뒤의 세기 · 기술 · 단 이름 · 모습은 제 가문 병과의 윗길 (rise.js DS.RISE_OF — 성벽기사 · 뇌전기사 …). 옛 마스터 줄(ch.cls 가 bm · tm · mm)은 그대로
DS.riseCls = function (ch) { var c = DS.CLASSES[ch.cls]; if (c.master || !(ch.L > 70)) return ch.cls; var x = DS.RISE_OF && DS.RISE_OF[ch.cls]; if (x && DS.CLASSES[x]) return x; var F = DS.FAMILY[c.fam]; return F ? F.master : ch.cls; };
DS.lineCls = function (cls, tier) { var c = DS.CLASSES[cls]; if (!c || c.master || !(tier >= 8)) return cls; var x = DS.RISE_OF && DS.RISE_OF[cls]; return x && DS.CLASSES[x] ? x : DS.FAMILY[c.fam] ? DS.FAMILY[c.fam].master : cls; };      // 그 단의 길 (8단부터 윗길)
DS.RISE = { mul: 1 };      // 오른 깃발의 세기 배율 (셋이 동시에 생기므로 21~30번을 다시 재어 맞춘다)
DS.capL = function (ch) { return DS.CLASSES[ch.cls].master || ch.L > 70 ? 100 : 70; };
DS.tierName = function (cls, tier) {
  var c = DS.CLASSES[cls];
  if (!c.master && tier >= 8) c = DS.CLASSES[DS.lineCls(cls, tier)];      // 8단부터는 윗길의 단 이름 (2.2.9)
  var i = Math.max(0, Math.min(c.tiers.length - 1, tier - c.start));
  return c.tiers[i];
};
// 4.0: 깃발의 화면 이름 = 든 사람의 이름 (대장 = 대장 줄의 이름, 부대원 = 호 또는 이름). 빈 깃발은 「승려 깃발」.
//   s 를 주지 않으면 지금 판(DS.G.save)에서 찾는다 — 화면 코드가 charName(ch) 로 부르던 자리를 그대로 살린다. 저장 밖의 줄(시험용)은 옛 이름 규칙.
DS.charName = function (ch, s) {
  s = s || (DS.G && DS.G.save);
  if (s && s.chars && s.chars[ch.id] === ch && DS.bearer) {
    if (ch.id === s.hero) return ch.name || s.name || DS.tierName(ch.cls, DS.tierOfL(ch.L));
    var b = DS.bearer(s, ch); return b ? (b.ttl || b.n || DS.flagName(ch.cls)) : DS.flagName(ch.cls);
  }
  return ch.name || DS.tierName(ch.cls, DS.tierOfL(ch.L));
};
DS.charTitle = function (ch) { var t = DS.tierOfL(ch.L); return t + '단 ' + DS.tierName(ch.cls, t); };

DS.wAtk = function (t) { return t ? 2 + 3 * t : 0; };
DS.aDef = function (t) { return t ? 1 + 2.5 * t : 0; };

// ───────── 장비 ─────────
// 2.1.0: 장비에 단이 없다. 아이디 = '계열.형[+강화]' (예: 'sword.A' · 'robe.B+3') — 옵션·고유 장비는 loot.js 가 감싼다.
//   수치의 크기는 입은 사람의 레벨이 정한다: 레벨 L 의 눈금 te = GEAR_TE0 + (L − 1) / 10 (2.7 이면 L1 → 2.7, L100 → 12.6 — 옛 단 눈금이 레벨마다 조금씩 오른다).
//   위력 = wAtk(te) × 위력 계수, 방어·마방·HP = aDef(te) × 계수. 장비는 계수(g.k)만 지니고, 실제 수치는 DS.gearAt(g, L, 병과)가 낸다.
//   병과에 맞지 않는 계열(DS.CLS_GEAR 밖)은 그 장비의 수치가 DS.GEAR_OFF(2.6.0: ×0.5)로 깎인다 — 입는 제한은 없다.
//   g.pow·g.def·g.res·g.hp·g.stat 은 「지금 부대 레벨」(DS.gearRefL) 기준으로 읽히는 값이다 (가방·대장간 줄의 글). 능력치 셈은 늘 gearAt 을 쓴다.
DS.enhAdTxt = function (ad) { var p = Math.round(ad * 100); return '방어, 마방 +' + p + '%, 방어구 HP +' + p + '%'; };      // 강화한 방어구의 능력치 글
DS.GEAR_TE0 = 2.7;      // 눈금의 바닥: 옛 판에서 드랍이 적의 단보다 한 단쯤 앞서 나오던 것을 그대로 (봇으로 맞춘 값)
DS.gearTe = function (L) { return DS.GEAR_TE0 + (Math.max(1, Math.min(100, +L || 1)) - 1) / 10; };
var refSave = null;      // 저장을 받는 장비 함수가 마지막으로 본 판 (화면 밖 — 봇·시험 — 의 기준 레벨)
DS.gearRefSave = function (s) { if (s && s.chars) refSave = s; return refSave; };
DS.gearRefL = function () { var s = (DS.G && DS.G.save) || refSave; return s && s.party && s.chars && DS.partyL ? DS.partyL(s) : 1; };
DS.gearFits = function (cls, g) { var G = DS.CLS_GEAR[cls], X = DS.GEAR_ALSO && DS.GEAR_ALSO[cls]; return !!(g && G && ((G[g.slot] && G[g.slot].indexOf(g.cat) >= 0) || (X && X[g.slot] && X[g.slot].indexOf(g.cat) >= 0))); };      // 2.2.6: GEAR_ALSO (무투가의 옛 성구 · 로브)
// 입은 사람 기준의 수치. L = 입은 사람의 레벨, cls = 그 병과 (없으면 깎지 않는다), te = 눈금을 바로 줄 때 (기본 장비 stdGear 의 단 — 용병·연무장 기준치)
DS.gearAt = function (g, L, cls, te) {
  if (!g) return null;
  var t = te || DS.gearTe(L), w = DS.wAtk(t), a = DS.aDef(t), K = g.k || {}, off = !!cls && !DS.gearFits(cls, g), m = off ? DS.GEAR_OFF : 1;
  var f = function (v) { return v > 0 ? v * m : v; };      // 2.6.0: 맞지 않는 병과 — 그 장비가 주는 덤은 모두 m 배(절반), 깎는 값(묵직한의 행동 회복 −4% 같은 대가)은 그대로
  return { pow: Math.round(f(w * (K.pow || 0))), def: Math.round(f(a * (K.def || 0))), res: Math.round(f(a * (K.res || 0))), hp: Math.round(f(a * (K.hp || 0))),
    crit: f(g.crit || 0), spd: f(g.spd || 0), mp: f(g.mp || 0), amp: f(g.amp || 0), ad: f(g.ad || 0), off: off };
};
// 능력치 글 (gearAt 의 결과로). 단이 없으니 「위력 +23」 같은 수는 그 레벨의 것이다
// 2.6.3: 「위력」이라는 말을 없앴다 — 무기의 수치는 입은 사람의 주 능력치에 그대로 더해지므로 그 이름으로 적는다: 물리 병과 「공격」 · 마법 병과 「마공」 · 무투가 「공격, 마공」.
//   입을 사람을 모르면(가방 · 전리품) 그 무기를 쓰는 병과로 정한다 (지팡이 → 마공, 검 → 공격, 권갑 → 공격, 마공). 능력치 셈(DS.charStats)은 그대로다
function powKindCls(cls) { var c = DS.CLASSES[cls]; return !c ? 'atk' : c.martial ? 'both' : (c.dtype === 'magic' || c.kind === 'holy') ? 'mag' : 'atk'; }
DS.gearPowKind = function (g, cls) {
  if (cls && DS.CLASSES[cls]) return powKindCls(cls);
  var ks = {}; for (var c in DS.CLS_GEAR) { var G0 = DS.CLS_GEAR[c]; if (g && G0 && G0.w && G0.w.indexOf(g.cat) >= 0) ks[powKindCls(c)] = 1; }
  return ks.both && !ks.atk && !ks.mag ? 'both' : ks.mag && !ks.atk ? 'mag' : 'atk';
};
DS.gearPowName = function (g, cls) { return { atk: '공격', mag: '마공', both: '공격, 마공' }[DS.gearPowKind(g, cls)]; };
DS.gearStatTxt = function (g, x, cls) {
  x = x || DS.gearAt(g, DS.gearRefL());
  var st = [], sg = function (v) { return (v > 0 ? '+' : '−') + Math.abs(v); }, pc = function (v) { return Math.round(v * 100); };
  if (x.pow) st.push(DS.gearPowName(g, cls) + ' +' + x.pow);
  if (x.def) st.push('방어 ' + sg(x.def));
  if (x.res) st.push('마방 ' + sg(x.res));
  if (x.hp) st.push('HP ' + sg(x.hp));
  if (x.amp) st.push('공격, 마공 +' + pc(x.amp) + '%');
  if (x.crit) st.push('치명타 +' + pc(x.crit) + '%');
  if (x.spd) st.push('행동 회복 ' + (x.spd > 0 ? '+' : '−') + Math.abs(pc(x.spd)) + '%');
  if (x.mp) st.push('마나 ' + (x.mp > 0 ? '+' : '−') + Math.abs(pc(x.mp)) + '%');
  if (x.ad) st.push(DS.enhAdTxt(x.ad));
  return st.join(', ');
};
// 지금 부대 레벨로 읽히는 칸 (옛 코드가 g.pow·g.stat 를 읽던 자리를 살린다). loot.js 의 옵션·고유 장비도 같은 것을 붙인다
DS.gearLive = function (g) {
  ['pow', 'def', 'res', 'hp'].forEach(function (k) { Object.defineProperty(g, k, { enumerable: true, configurable: true, get: function () { return DS.gearAt(g, DS.gearRefL())[k]; } }); });
  Object.defineProperty(g, 'stat', { enumerable: true, configurable: true, get: function () { return DS.gearStatTxt(g); } });
  Object.defineProperty(g, 'price', { enumerable: true, configurable: true, get: function () { return Math.round(DS.gearPrice(DS.gearTe(DS.gearRefL())) * (g.pk || 1) * (1 + g.enh * 0.5) / 10) * 10; } });
  g.mat = Math.max(1, Math.min(10, 1 + Math.floor(g.enh / 2) + (g.grade >= 4 ? 1 : 0)));      // 그림의 날 빛깔(옛 단 재료 표 1~10): 강화할수록 빛깔이 오른다
  return g;
};
var gcache = Object.create(null);      // 'constructor'·'__proto__' 같은 저장 속 식별자가 Object 의 것을 장비로 꺼내지 않게
DS.gearId = function (cat, line) { return cat + '.' + line; };
DS.ENH_RE = /^(?:[1-9]|1[0-9]|20)$/;      // 강화 단계 글자 (+1 ~ +20)
DS.gear = function (id) {
  if (gcache[id] !== undefined) return gcache[id];
  // 'sword.A+2' = 계열.형 + 강화 단계 (무기·방어구. 무기는 amp·crit, 방어구는 ad)
  var q = String(id || '').split('+'), en = q.length === 2 && DS.ENH_RE.test(q[1]) ? +q[1] : 0, p = q[0].split('.'), C = p.length === 2 ? DS.GEAR_CAT[p[0]] : null, V = C && (p[1] === 'A' || p[1] === 'B') ? C[p[1]] : null, g = null;
  if (V && typeof V === 'object' && q.length <= 2 && (q.length === 1 || en) && en <= DS.ENH.max && (en === 0 || C.slot === 'w' || C.slot === 'a')) {
    var wE = C.slot === 'w' ? en : 0, aE = C.slot === 'a' ? en : 0;
    g = { id: id, base: q[0], core: q[0], enh: en, cat: p[0], line: p[1], slot: C.slot, name: V.n + (en ? ' +' + en : ''), kind: C.name, note: V.note || '', pk: p[1] === 'B' ? 1.3 : 1,
          k: { pow: V.pow || 0, def: V.def || 0, res: V.res || 0, hp: C.slot === 'a' ? 2 : 0 },
          amp: DS.ENH.amp * wE, ad: DS.ENH.ad * aE, crit: (V.crit || 0) + DS.ENH.crit * wE, spd: V.spd || 0, mp: V.mp || 0 };
    DS.gearLive(g);
  }
  gcache[id] = g;
  return g;
};
// 2.1.0: 누구나 무엇이든 입는다 (병과에 맞지 않으면 그 장비의 수치가 깎인다 — DS.gearAt · DS.GEAR_OFF). 무기·방어구 칸에 들어가는 장비면 된다
DS.canEquip = function (ch, id) {
  var g = DS.gear(id);
  return !!(g && ch && DS.CLASSES[ch.cls] && (g.slot === 'w' || g.slot === 'a'));
};
// 가방에서 꺼내 입힌다. 입고 있던 것은 가방으로.
DS.equip = function (save, ch, id) {
  var g = DS.gear(id); if (!g || !DS.canEquip(ch, id) || !(save.gear[id] > 0)) return false;
  save.gear[id]--; if (!save.gear[id]) delete save.gear[id];
  var old = ch[g.slot]; if (old) save.gear[old] = (save.gear[old] || 0) + 1;
  ch[g.slot] = id;
  return true;
};
DS.unequip = function (save, ch, slot) { var old = ch[slot]; if (!old) return; save.gear[old] = (save.gear[old] || 0) + 1; ch[slot] = null; };
// 기본형 장비를 바로 입힌다 (합류할 때의 기본 차림, 시험용). tier 는 「입는가」(0 = 맨몸)와, 그 단의 기준치(ch.gt — 용병·연무장 기준 줄의 수치가 옛 단 그대로 나오게)
DS.stdGear = function (ch, tier) {
  var G = DS.CLS_GEAR[ch.cls], t = Math.max(0, Math.min(10, tier));
  ch.w = t ? DS.gearId(G.w[0], 'A') : null; ch.a = t ? DS.gearId(G.a[0], 'A') : null;
  if (t && !ch.id) ch.gt = t; else delete ch.gt;      // 저장 속 깃발 줄(id 가 있는 것)은 입은 사람의 레벨로 — 기준 줄만 단을 기억한다
};
// 가방에서 가장 좋은 것으로 갈아입힌다 (점수는 loot.js 가 효과까지 넣어 다시 정한다 — 여기 것은 loot 없이 돌 때)
DS.gearScore = function (g, ch) { if (!g) return -1; var x = DS.gearAt(g, ch ? ch.L : DS.gearRefL(), ch && ch.cls); return x.pow + x.def + x.res * 0.6 + x.hp * 0.2 + (g.enh || 0) * 4; };
DS.autoEquip = function (save, ch) {
  var changed = false; DS.gearRefSave(save);
  ['w', 'a'].forEach(function (slot) {
    var best = null, bs = DS.gearScore(DS.gear(ch[slot]), ch);      // 2.1.0: 그 사람의 레벨·병과로 잰다 (맞지 않는 계열의 깎임 — 2.6.0 −50% — 이 점수에 든다)
    for (var id in save.gear) { var g = DS.gear(id); if (g && g.slot === slot && save.gear[id] > 0 && DS.canEquip(ch, id)) { var sc = DS.gearScore(g, ch); if (sc > bs) { bs = sc; best = id; } } }
    if (best && DS.equip(save, ch, best)) changed = true;
  });
  return changed;
};

// 강화: 골드(DS.enhCost)를 내고 굴린다. 실패하면 장비가 부서진다 — 강화 보호 부적(ref.prot, save.items.prot)을 쓰면 실패해도 그대로. 무기·방어구 같은 확률표.
//   골드가 모자라면 null (화면은 단추에서 미리 막는다). 돌려주는 것에 cost(낸 골드)·kept(실패했지만 남음)·prot(부적을 썼다)
// ref = { ch: 지휘관 id, sl: 'w'|'a' (없으면 'w'), prot: 부적을 쓸까 } (입고 있는 장비) 또는 { id: 가방의 장비, prot }
DS.enhRate = function (g) { return g && (g.slot === 'w' || g.slot === 'a') && g.enh < DS.ENH.max ? DS.ENH.rate[g.enh + 1] : 0; };
DS.enhance = function (save, ref, rnd) {
  var sl = ref.sl === 'a' ? 'a' : 'w', ch = ref.ch ? save.chars[ref.ch] : null, id = ch ? ch[sl] : ref.id, g = DS.gear(id);
  if (!g || (ch ? g.slot !== sl : !(g.slot === 'w' || g.slot === 'a')) || g.enh >= DS.ENH.max) return null;
  if (!ch && !(save.gear[id] > 0)) return null;
  var cost = DS.enhCost ? DS.enhCost(g) : 0;
  if (cost && !((save.gold || 0) >= cost)) return null;
  var safe = DS.enhSafe && DS.enhSafe(g), prot = !!ref.prot && !safe && save.items && save.items.prot > 0;
  save.gold -= cost;
  var ok = (rnd || Math.random)() * 100 < DS.ENH.rate[g.enh + 1], nid = g.base + '+' + (g.enh + 1);
  if (!ok && (safe || prot)) { if (prot) save.items.prot--; return { ok: false, kept: true, prot: prot, from: g, to: null, rate: DS.ENH.rate[g.enh + 1], cost: cost }; }      // 안전 구간·닳지 않는 장비·부적: 골드만 들고 그대로
  if (ch) { ch[sl] = ok ? nid : null; if (save.lock && save.lock[id] && !(save.gear[id] > 0)) { delete save.lock[id]; if (ok) save.lock[nid] = 1; } }      // 실패하면 부서져 사라진다
  else { save.gear[id]--; if (!save.gear[id]) delete save.gear[id]; if (ok) save.gear[nid] = (save.gear[nid] || 0) + 1;
    if (save.lock && save.lock[id] && !save.gear[id]) { delete save.lock[id]; if (ok) save.lock[nid] = 1; } }      // 잠금은 강화한 물건을 따라간다 (실패해 부서지면 기록만 지운다)
  return { ok: ok, from: g, to: ok ? DS.gear(nid) : null, rate: DS.ENH.rate[g.enh + 1], cost: cost };
};
// 캐릭터 능력치 (장비 포함). 2.1.0: 장비 수치는 그 깃발 줄의 레벨(= 든 사람의 개인 레벨)과 병과로 (DS.gearAt)
DS.charStats = function (ch) {
  var c = DS.CLASSES[DS.riseCls(ch)], k = ch.L - 1, magic = (c.dtype === 'magic' || c.kind === 'holy') && !DS.CLASSES[ch.cls].martial, rise = DS.risen(ch) ? DS.RISE.mul : 1;      // 2.2.5: 무투가(승려)는 무기의 힘을 공격에
  var s = {
    hp: Math.round(c.base.hp + c.grow.hp * k), mp: c.base.mp + c.grow.mp * k,
    atk: c.base.atk + c.grow.atk * k, def: c.base.def + c.grow.def * k,
    mag: c.base.mag + c.grow.mag * k, res: c.base.res + c.grow.res * k
  };
  if (DS.CLASSES[ch.cls].martial && c !== DS.CLASSES[ch.cls] && !c.rise) { s.atk = s.mag; s.mag *= 0.65; }      // 2.2.5: 8단 뒤 무투가가 옛 마스터(매직마스터)의 줄을 쓸 때만 — 마공 줄을 공격으로 (2.2.9 윗길 금강권은 제 줄 그대로)
  if (rise !== 1) { s.hp = Math.round(s.hp * rise); s.atk *= rise; s.def *= rise; s.mag *= rise; s.res *= rise; }
  var c0 = DS.CLASSES[ch.cls]; if (c0 !== c) { magic = (c0.dtype === 'magic' || c0.kind === 'holy') && !c0.martial; c = { rng: c0.rng, spd: c.spd }; }      // 사거리·공격 결은 제 병과 그대로
  var W = DS.gearAt(DS.gear(ch.w), ch.L, ch.cls, ch.gt), A = DS.gearAt(DS.gear(ch.a), ch.L, ch.cls, ch.gt), w = W ? W.pow : 0, crit = 0.06, spd = 1, mp = 1;
  if (magic) { s.mag += w; s.atk += w * 0.6; } else if (c0.martial) { s.atk += w; s.mag += w; } else { s.atk += w; s.mag += w * 0.4; }      // 2.2.5: 무투가는 기공(마공)도 무기를 따른다
  [W, A].forEach(function (g) { if (!g) return; s.def += g.def; s.res += g.res; s.hp += g.hp; crit += g.crit; spd += g.spd; mp += g.mp; });
  var rng = c.rng.slice();
  if (W && W.amp) { s.atk *= 1 + W.amp; s.mag *= 1 + W.amp; }      // 강화된 무기
  if (A && A.ad) { s.def *= 1 + A.ad; s.res *= 1 + A.ad; s.hp += Math.round(A.hp * A.ad); }      // 강화된 방어구: 방어·마방 ×, 방어구가 준 HP ×
  s.atk = Math.round(s.atk); s.def = Math.round(s.def); s.mag = Math.round(s.mag); s.res = Math.round(s.res); s.mp = Math.round(s.mp * mp);
  s.rng = rng; s.drain = 0; s.crit = crit; s.spd = c.spd * spd; s.enh = DS.gear(ch.w) ? DS.gear(ch.w).enh : 0;
  return s;
};
DS.charSkills = function (ch) {
  var c = DS.CLASSES[ch.cls], t = DS.tierOfL(ch.L);
  var out = c.skills.filter(function (s) { return t >= s[1]; }).map(function (s) { return s[0]; });
  if (DS.risen(ch)) {
    var X = DS.CLASSES[DS.riseCls(ch)];
    if (X.rise) {      // 2.2.9 윗길: 8단에 대표 기술이 윗길 기술로 바뀌고(kit), 9 · 10단 고유 기술은 맨 앞에 (자동 전투가 앞쪽부터 살핀다)
      out = out.map(function (k) { return X.kit && X.kit[k] ? X.kit[k] : k; });
      var sig = X.skills.filter(function (s) { return s[1] >= 9 && t >= s[1] && out.indexOf(s[0]) < 0; }).map(function (s) { return s[0]; });
      out = sig.concat(out);
    } else X.skills.forEach(function (s) { if (s[1] >= 9 && t >= s[1] && out.indexOf(s[0]) < 0) out.push(s[0]); });      // ⑮ 옛 마스터의 9·10단 기술
  }
  return out;
};

// ───────── r42 가문 공훈 (가문의 레벨) ─────────
// 가문 줄 ch.hx = 공훈 점수. 그 가문 사람(맹주·가주·가솔)이 싸워 세운 공이 가문에 쌓인다. 계급 이름은 옛 공훈 사다리 그대로 (신참 … 불멸).
//   가주(맹주) 능력치 +pct %, 가솔 ×mul. 막사 사람은 가문이 없어 공훈을 쌓지 않는다.
DS.HVET = [{ at: 0, pct: 0, mul: 1 }, { at: 100, pct: 4, mul: 1.06 }, { at: 350, pct: 8, mul: 1.12 }, { at: 900, pct: 12, mul: 1.18 }, { at: 1700, pct: 16, mul: 1.25 }, { at: 4000, pct: 20, mul: 1.33 },      // 숙련 ≈ 3번 · 고참 ≈ 6번 · 정예 ≈ 12번 · 용사 ≈ 20번 · 불멸 ≈ 8단 준비 뒤 (봇)
  { at: 8000, pct: 23, mul: 1.38, name: '명가' }, { at: 15000, pct: 26, mul: 1.43, name: '명문' }, { at: 25000, pct: 30, mul: 1.5, name: '천하명문' }];      // 2.1.0: 공훈은 대를 넘어 쌓인다 (스무 해에도 그대로) — 위로 셋 (명가 ≈ 1대째 끝 · 명문 ≈ 2대째 · 천하명문 ≈ 3대째, 봇). 계급은 대물림 몫도 올린다 (DS.heirShare)
DS.hRankX = function (x) { var r = 0; for (var i = 0; i < DS.HVET.length; i++) if ((+x || 0) >= DS.HVET[i].at) r = i; return r; };
DS.hRank = function (ch) { return ch ? DS.hRankX(ch.hx) : 0; };
DS.hName = function (r) { var q = DS.HVET[r]; return (q && q.name) || (DS.VET[r] || DS.VET[0]).name; };
DS.hPct = function (ch) { return DS.HVET[DS.hRank(ch)].pct; };
DS.hMul = function (ch) { return DS.HVET[DS.hRank(ch)].mul; };
DS.hNext = function (ch) { var x = +(ch && ch.hx) || 0, r = DS.hRankX(x), nx = DS.HVET[r + 1]; return nx ? { name: DS.hName(r + 1), at: nx.at, from: DS.HVET[r].at, x: x } : null; };
DS.hAdd = function (s, ch, pts) {      // 돌려주는 것: 계급이 올랐으면 { ch, from, to }, 아니면 null
  if (!ch || !(pts > 0)) return null;
  var r0 = DS.hRank(ch); ch.hx = Math.round(((+ch.hx || 0) + pts) * 10) / 10;
  var r1 = DS.hRank(ch); if (r1 > r0) { var o = { ch: ch, from: r0, to: r1 }; (DS.hUps || (DS.hUps = [])).push(o); return o; }
  return null;
};

// ───────── 용병 ─────────
DS.mercTypes = function (cls) { var c = DS.CLASSES[cls]; return (c.mercs || [c.merc]).concat(DS.BIG_MATCH[cls] || []); };
DS.baseMercTypes = function (cls) { var c = DS.CLASSES[cls]; return c.mercs || [c.merc]; };
DS.mercPop = function (m) { return DS.MERCS[m.type].pop || 1; };
DS.mercMatch = function (ch, m) { return DS.mercTypes(ch.cls).indexOf(m.type) >= 0; };     // 병과가 맞으면 통솔 보너스
// 전공 별명 (표시만). 가진 것 가운데 가장 귀한 것 하나. m.nk = 전투 화면이 준 별명의 id (추모 기록에서는 별명 글 그대로일 수도 있다)
DS.mercTitleInfo = function (m) {
  if (!m) return null;
  for (var i = 0; i < DS.MERC_TITLES.length; i++) {
    var T = DS.MERC_TITLES[i], N = T.need, ok = m.nk === T.id;
    if (!ok && N) ok = N.weed ? (m.g === 1 && DS.tierOfL(DS.pL(m)) >= 5) : ((+m[N.k ? 'k' : N.b ? 'b' : N.bk ? 'bk' : 'sv'] || 0) >= (N.k || N.b || N.bk || N.sv));
    if (ok) return T;
  }
  return null;
};
DS.mercTitle = function (m) { var T = DS.mercTitleInfo(m); return T ? T.name : (m && m.nk && typeof m.nk === 'string' && !/^[a-z0-9]+$/.test(m.nk) ? m.nk : ''); };
// 전투 화면이 별명을 준다: 지금 것보다 귀하면 바꾸고 true
DS.mercAward = function (m, id) {
  var at = -1, cur = DS.MERC_TITLES.length, i;
  for (i = 0; i < DS.MERC_TITLES.length; i++) { if (DS.MERC_TITLES[i].id === id) at = i; if (DS.MERC_TITLES[i].id === m.nk) cur = i; }
  if (at < 0 || at >= cur) return false;
  var before = DS.mercTitle(m); m.nk = id;
  return DS.mercTitle(m) !== before;
};
DS.mercCall = function (m) { var t = DS.mercTitle(m); return (t ? t + ' ' : '') + (m.n || ''); };      // '거인잡이 가을'
DS.mercName = function (m) { var c = DS.mercCall(m); return (c ? c + ', ' : '') + DS.GRADES[m.g].name + ' ' + DS.MERCS[m.type].name; };
// 추모 기록 한 줄 (game.js 가 용병을 잃을 때 save.fallen 에 넣는다). 별명·버릇·특성까지 남긴다.
DS.fallenRecord = function (m, at) {
  var f = { n: m.n, type: m.type, g: m.g, L: DS.pL(m), k: m.k || 0, b: m.b || 0, at: at || '' }, t = DS.mercTitle(m);
  if (t) f.nk = t; if (m.t) f.t = m.t; if (m.q) f.q = m.q; if (m.bk) f.bk = m.bk;
  if (m.lw) f.lw = String(m.lw).slice(0, 24); if (m.pid) f.pid = m.pid; if (m.id) f.id = m.id; if (m.pk) f.pk = m.pk;      // r32: 마지막 한마디 · 가계도 고리 · 성격 씨앗
  return f;
};
// r32 추모 목록 정리: 이름난 이(공훈 「숙련」 이상)·가계도에 걸린 이·가주였던 이·아홉 집 사람은 남기고(최대 keep), 그 밖은 최근 rest 명. 차례는 쓰러진 순서 그대로
DS.FALLEN = { keep: 240, rest: 30 };
DS.fallenNote = function (f) { return !!f && ((+f.L || 0) >= 11 || (+f.x || 0) >= DS.VET[1].at || !!f.pid || !!f.f || !!f.cast); };
DS.fallenTrim = function (list) {
  list = (list || []).filter(function (f) { return f && typeof f === 'object'; });
  var F = DS.FALLEN, nk = 0, nr = 0, keep = [];
  for (var i = list.length - 1; i >= 0; i--) { var f = list[i], n = DS.fallenNote(f); if (n ? nk++ < F.keep : nr++ < F.rest) keep.push(f); }
  return keep.reverse();
};
// 성격과 말버릇
DS.mercPersona = function (m) { return DS.PERSONAS[Math.floor(DS.hash2((m.pk || m.id) || 0, 7, 13) * DS.PERSONAS.length) % DS.PERSONAS.length]; };      // 3.3.0: m.pk = 다시 부름으로 돌아온 이·선대의 씨앗 (옛 용병 번호 또는 사람 번호) — 불러오기를 되풀이해도 같은 성격
DS.mercNature = function (m) { var P = DS.mercPersona(m); return { name: P.name, desc: P.desc }; };      // 용병 정보 창의 성격 한 줄
DS.mercSay = function (m, when, force) {
  if (!m) return null;
  var P = DS.mercPersona(m), L = P && P.say[when]; if (!L || !L.length) return null;
  if (!force && !(Math.random() < (DS.SAY_P[when] == null ? 1 : DS.SAY_P[when]))) return null;
  var SN = DS.SN_SAY && m.sn && !m.cast && !m.rv && when !== 'mourn' ? DS.SN_SAY[m.sn] : null, SL = SN && SN[when];      // r13: 가문명 버릇 말 (가끔)
  if (SL && SL.length && Math.random() < (DS.SN_SAY_P || 0)) return SL[Math.floor(Math.random() * SL.length)];
  return L[Math.floor(Math.random() * L.length)];
};
// 이름난 용병(영웅·전설)의 고유 기술. 저장 칸 없이 종류와 번호에서 정해진다 (m.s 가 있으면 그것).
// r42: 가솔의 기술 = 종류의 기술 목록(DS.MERC_SK)을 제 단으로 연다 — 첫째 3단, 둘째 5단, 셋째 7단. 영웅·전설은 고유 기술(DS.mercSkill)을 1단부터.
DS.MSK_AT = [3, 5, 7];
DS.mercSkills = function (m, L) {
  if (!m || !DS.MERCS[m.type]) return [];
  var t = DS.tierOfL(L != null ? L : DS.pL(m)), list = DS.MERC_SK[m.type] || [], out = [], u = DS.mercSkill(m);
  if (u) out.push(u);
  if (m.rv && u) return out;      // 관에서 돌아온 이는 옛 가문의 기술 하나만 (그 사람의 표식)
  list.forEach(function (k, i) { if (DS.SKILLS[k] && t >= (DS.MSK_AT[i] || 99) && out.indexOf(k) < 0) out.push(k); });
  return out;
};
// 2.2.6: 그 사람이 어느 병과의 기술을 지녔을까 (돌아온 이의 옛 깃발 · 가문을 맡은 이) — 받은 가문 병과 → 이야기의 집 → 종류가 맞는 병과
DS.mClsOf = function (m) {
  if (!m) return null; var k = m.nc || m.cast; if (k && DS.CLASSES[k]) return k;
  var hit = null; Object.keys(DS.CLASSES).forEach(function (c) { if (!hit && !DS.CLASSES[c].master && ((DS.RET_KIND && DS.RET_KIND[c] === m.type) || DS.CLASSES[c].merc === m.type)) hit = c; });
  return hit;
};
DS.mercSkill = function (m) {
  if (m && m.s && DS.skOld) { var ns = DS.skOld(m.s, DS.mClsOf(m)); if (ns !== m.s && DS.SKILLS[ns]) m.s = ns; }      // 2.2.6: 옮기기 전의 옛 기술 이름 (관에서 꺼낸 줄 등)
  if (m && m.rv && m.s && DS.SKILLS[m.s]) return m.s;      // 3.3.0: 다시 부름으로 돌아온 이는 옛 깃발의 기술을 등급과 관계없이 지닌다
  if (!m || !(m.g >= 4)) return null;
  if (m.s && DS.SKILLS[m.s]) return m.s;
  var L = DS.MERC_SK[m.type]; return L && L.length ? L[((m.pk || m.id) * 7 + 3) % L.length] : null;
};
// r32 필살기 — 공훈 「용사」(DS.ULT.at)에 오른 사람의 것. who = 부대원 줄이나 대장의 사람 줄(ch.ps). key = 해시 씨앗(없으면 pk·id)
//   후보 = 태생 병과(아홉 집은 제 집, 큰 용병은 맞는 병과 모두)의 필살기 셋씩 + 성격 몫 하나. 그 가운데 사람 번호로 하나 — 같은 종류 둘이 같은 것을 가질 일이 드물게.
DS.vetStars = function (x) { var S = DS.ULT.stars, n = 0; for (var i = 0; i < S.length; i++) if ((+x || 0) >= S[i]) n = i + 1; return n; };      // r42: x 는 개인 레벨 L (별 = 9단 · 10단 · L100)
DS.pStars = function (who) { return DS.vetStars(who ? DS.pL(who) : 0); };
DS.ultPool = function (who) {
  if (!who) return [];
  var cl = [], out = [], k;
  var ck = who.cast || who.nc;      // 2.2.0: nc = 그 사람이 받은 가문 병과 (모집한 영웅 · 가문을 맡은 아이)
  if (ck && DS.CLASSES[ck]) { var C = DS.CLASSES[ck]; cl = C.master ? DS.FAMILY[C.fam].members.slice() : [ck]; }
  else if (who.type && DS.MERCS[who.type]) Object.keys(DS.CLASSES).forEach(function (c) { if (!DS.CLASSES[c].master && DS.mercTypes(c).indexOf(who.type) >= 0) cl.push(c); });
  for (k in DS.ULTS) if (cl.indexOf(DS.ULTS[k].cls) >= 0) out.push(k);
  var pk = DS.mercPersona(who).key;
  for (k in DS.ULTS) if (DS.ULTS[k].pk === pk) out.push(k);
  return out;
};
// 2.1.0: 누구나 하나씩 타고난다 (DS.ultBorn — 레벨과 관계없이 무엇인지는 정해져 있다). 개인 5단(L41, DS.ULT.at)에 깨어난다 (DS.ultOf)
DS.ultBorn = function (who, key) {
  if (!who || !(DS.BAL && DS.BAL.ult !== false)) return null;
  if (who.ul && DS.SK_ALIAS[who.ul]) who.ul = DS.skAlias(who.ul);      // 2.2.5: 옛 이름 (저장을 고치기 전의 줄)
  if (who.ul && DS.ULTS[who.ul]) return who.ul;      // 맹주로 선 뒤에도 제 것 그대로 (사람 줄에 적혀 있다)
  var L = DS.ultPool(who); if (!L.length) return null;
  var seed = key != null ? key : (who.pk || who.id || 0), h = DS.hash2(seed | 0, 97, (who.type || '').length * 13 + 5);
  return L[Math.floor(h * L.length) % L.length];
};
DS.ultAwake = function (who) { return !!who && DS.pL(who) >= DS.ULT.at; };
DS.ultOf = function (who, key) { return DS.ultAwake(who) ? DS.ultBorn(who, key) : null; };
// 필살기의 세기(ultP)·차는 빠르기(ultR): 별(공훈 1000·1500·2000)마다 +8%·+12%, 영웅 +8%·전설 +15% (세기만)
DS.ultKey = function (s, who) { var h = s && s.chars && s.chars[s.hero]; return h && who && h.ps === who ? (who.pk || 7000 + (+h.pid || +h.id || 0)) : null; };      // 대장의 사람 줄은 번호가 없다 — banner.js 의 cmdSpec 과 같은 씨앗
DS.STAR_NAME = ['', '별 하나', '별 둘', '별 셋'];
DS.vetNext = function (x) { x = +x || 0; var r = DS.vetRank(x), nx = DS.VET[r + 1]; if (nx) return { name: nx.name, at: nx.at, from: DS.VET[r].at }; var st = DS.vetStars(x), S = DS.ULT.stars; return st < S.length ? { name: DS.STAR_NAME[st + 1], at: S[st], from: st ? S[st - 1] : DS.VET[r].at } : null; };
DS.ultPow = function (who) { var U = DS.ULT, x = who ? DS.pL(who) : 0, st = DS.vetStars(x), v = 0; (U.vetP || []).forEach(function (q) { if (x >= q[0]) v += q[1]; }); return 1 + U.starP * st + v + (U.gradeP[Math.max(0, Math.min(5, Math.round(+(who && who.g) || 1)))] || 0); };      // r36: 용사 · 불멸에 오를 때마다 +15%
DS.ultRate = function (who) { return 1 + DS.ULT.starR * DS.pStars(who); };
(DS.UNIT_KEYS = DS.UNIT_KEYS || []).push('ult', 'ultP', 'ultR');
// ── r36 (1.3.0) 필살기는 맹주(대장)만: 다른 가주·가솔은 지니지 않는다. (r38: 고르지 않는다 — 타고난다. 아래 DS.ultInnate) 시나리오 DS.ULT.unlock(3)을 깨면 깨어난다.
//   고른 것은 맹주 사람 줄(ch.ps.ul)에 — 대를 이은 새 맹주는 새로 고른다 (후보 셋은 맹주 가문 병과에서 나오니 그대로). 교회에서 골드로 바꾼다 (DS.ultCost).
//   세기: 용사 · 불멸에 +15%씩, 별(공훈 1000·1500·2000)마다 +8% · 충전 +12% (DS.ultPow · DS.ultRate). 가호 「타오르는 기세」도 맹주에게.
DS.ULT.unlock = 3; DS.ULT.vetP = [[41, 0.15], [71, 0.15]]; DS.ULT.cost = 400;      // r42: 맹주의 개인 5단(L41) · 8단(L71)에 +15%씩
DS.ULT.at = 41; DS.ULT.stars = [81, 91, 100];      // r42: 별은 9단 · 10단 · L100
DS.ULT.autoGap = 3;      // 2.2.7: 자동 전투가 스스로 쓰는 필살기는 우리 편 전체에서 3초에 하나 (engine.js P.ultSelf)
DS.ULT.charge = 40;      // r36: 부대에 필살기가 하나뿐이다 — 맹주의 게이지는 60초 → 40초에 찬다 (봇: 옛 가주·가솔 필살기를 잃은 몫을 일부 메운다)
DS.ultHeroWho = function (s) { var ch = s && s.chars && s.chars[s.hero]; return ch && !ch.vac && ch.ps ? ch.ps : null; };
DS.ultOpen = function (s) { return !!(DS.BAL && DS.BAL.ult !== false && s); };      // 2.1.0: 시나리오가 아니라 사람마다 개인 5단에 깨어난다 (DS.ultAwake)
DS.ultOpts = function (s) {      // 맹주 가문 병과의 필살기 셋 (합일한 큰 가문은 묶인 세 병과에서 하나씩 — 사람 번호로 고정)
  var ch = s && s.chars && s.chars[s.hero]; if (!ch || !DS.CLASSES[ch.cls]) return [];
  var C = DS.CLASSES[ch.cls], own = function (c) { return Object.keys(DS.ULTS).filter(function (k) { return DS.ULTS[k].cls === c; }); };
  if (!C.master) return own(ch.cls).slice(0, 3);
  var F = DS.FAMILY[C.fam], seed = +(ch.pid || ch.id || 1);
  return (F ? F.members : []).map(function (c, i) { var L = own(c); return L.length ? L[Math.floor(DS.hash2(seed, 31 + i, 7) * L.length) % L.length] : null; }).filter(Boolean).slice(0, 3);
};
// ── r38: 필살기는 고르는 것이 아니라 타고난다. 맹주마다 하나 — 사람 번호(pid)와 저장의 씨앗(eg.seed)에서 정해지는 굴림 (같은 사람이면 늘 같다).
//   후보 = 맹주 가문 병과의 필살기 모두(합일한 큰 가문은 묶인 세 병과의 것 모두) + 그 사람의 성격 몫 (36개 가운데). 처음 볼 때 사람 줄(ps.ul)에 적어 둔다 (= 태어날 때 정해진 것).
//   시나리오 3을 깨면 깨어난다(ps.ulw = 깨어남을 보여 줬다). 1.3.0 에서 이미 고른 저장은 고른 것을 그대로 지닌다 (ps.ul 이 있으면 굴리지 않는다). 대를 이은 맹주는 제 몫을 따로 타고난다.
DS.ultInnatePool = function (s, who) {
  var ch = s && s.chars && s.chars[s.hero]; if (!ch || !DS.CLASSES[ch.cls]) return [];
  var C = DS.CLASSES[ch.cls], cl = C.master && DS.FAMILY[C.fam] ? DS.FAMILY[C.fam].members : [ch.cls], out = [], k;
  for (k in DS.ULTS) if (DS.ULTS[k].cls && cl.indexOf(DS.ULTS[k].cls) >= 0) out.push(k);
  var pk = who && DS.mercPersona ? (DS.mercPersona(who) || {}).key : null;
  for (k in DS.ULTS) if (pk && DS.ULTS[k].pk === pk) out.push(k);
  return out;
};
DS.ultRoll = function (s, who) {
  var L = DS.ultInnatePool(s, who); if (!L.length) return null;
  var ch = s.chars[s.hero], sd = (+s.us || 0) || (s.eg && +s.eg.seed) || (DS.egSeed ? DS.egSeed(s) : 1) || 1, pid = +(ch.pid || who.pk || who.id || ch.id || 1);
  return L[Math.floor(DS.hash2((pid * 2654435761 + sd) | 0, 331, 17) * L.length) % L.length];
};
DS.ultInnate = function (s) {      // 맹주가 타고난 필살기 (깨어나기 전에도 무엇인지는 보인다)
  var p = DS.ultHeroWho(s); if (!p || !(DS.BAL && DS.BAL.ult !== false)) return null;
  if (p.ul && DS.SK_ALIAS[p.ul]) p.ul = DS.skAlias(p.ul);      // 2.2.5
  if (p.ul && DS.ULTS[p.ul]) return p.ul;
  var id = DS.ultRoll(s, p);
  if (id && DS.ultOpen(s) && DS.ultAwake(p)) { p.ul = id; p.ulr = 1; }      // 2.1.0: 맹주도 개인 5단에 깨어난다      // 깨어난 뒤에야 적는다 (ultSpec 은 ps.ul 만 본다 — 깨어나기 전에 싸움에 나가지 않게). 굴림은 결정적이라 그 전에 보여 준 것과 같다. ulr: 굴려서 정해진 것 (1.3.0 에서 고른 것에는 없다)
  return id;
};
DS.heroUlt = function (s) { var p = DS.ultHeroWho(s); return DS.ultOpen(s) && DS.ultAwake(p) ? DS.ultInnate(s) : null; };
DS.ultNeedPick = function () { return false; };
DS.ultFor = function (s, who) { if (!who) return null; var hp = DS.ultHeroWho(s), id; if (hp && who === hp) id = hp.ul && DS.ULTS[hp.ul] ? hp.ul : DS.ultRoll(s, hp); else id = DS.ultBorn(who); return DS.ultUp ? DS.ultUp(id, DS.pL(who)) : id; };      // 2.2.9: 8단부터 윗길 필살기      // 2.1.0: 그 사람이 타고난 필살기 (깨어나기 전에도)      // r38: 고르기는 없다 (봇·옛 호출이 부른다)
DS.ultNeedReveal = function (s) { var p = DS.ultHeroWho(s); return !!(p && DS.heroUlt(s) && !p.ulw && p.ulr); };      // 1.3.0 에서 고른 것(ulr 없음)은 이미 아는 것 — 깨어남 창을 띄우지 않는다
DS.ultRevealed = function (s) { var p = DS.ultHeroWho(s); if (p) p.ulw = 1; };
DS.ultCost = function (s) { var ch = s && s.chars && s.chars[s.hero]; return DS.ULT.cost * Math.max(1, ch ? DS.tierOfL(ch.L) : 1); };
DS.ultPick = function (s, id) { var p = DS.ultHeroWho(s); if (!p || !DS.ultOpen(s) || DS.ultOpts(s).indexOf(id) < 0 && id !== p.ul) return false; p.ul = id; return true; };      // r38: 화면에서는 더 부르지 않는다 (옛 시험 도구용)
DS.ultSpec = function (u, who, hero, cmd) { if (who && who.ul && DS.SK_ALIAS[who.ul]) who.ul = DS.skAlias(who.ul); var id = !(DS.BAL && DS.BAL.ult !== false) || !who || !DS.ultAwake(who) ? null : hero ? (who.ul && DS.ULTS[who.ul] ? who.ul : null) : cmd ? DS.ultOf(who) : null; if (id && DS.ultUp) id = DS.ultUp(id, DS.pL(who)); u.ult = id; u.ultP = id ? DS.ultPow(who) : 1; u.ultR = id ? DS.ultRate(who) : 1; return u; };      // 2.1.0: 가주(지휘하는 사람)는 누구나 제 필살기 — 쓰는 것은 조작하는 사람만 (game.js 단추 · 엔진은 스스로 쓰지 않는다)
DS.mercKind = function (m) { return DS.GRADES[m.g].name + ' ' + DS.MERCS[m.type].name; };
// ───────── 2.2.0 「한 사람 한 사람」: 사람의 자리는 셋뿐이다 ─────────
//   가주(m.h, m.o = 가문) — 그 가문의 깃발 유닛으로 싸운다. 맹주는 대장 줄의 사람(ch.ps).
//   막사(m.sb, m.o = 0, !h) — 모집한 영웅이 기다리는 곳 하나 (가문에 매이지 않는다 · 정원은 넉넉히 DS.MERC_MAX). 싸우지 않는다 (경험치는 같은 병과 가주가 얻는 몫의 BAL.sbShare).
//      가주가 없는 가문이 생기면 싸움 밖에서 막사의 같은 병과(DS.sbFits) 가운데 가장 나은 이가 저절로 가주가 된다 (banner.js DS.sbTick). 같은 병과가 없으면 빈 가문.
//   가문원(!h, !sb, m.o = 맹주 가문) — 맹주 집 사람(핏줄 아이·배우자·물러난 선대). 어른은 모두 맹주 깃발을 따라 싸운다 (인구 칸이 없다).
//   가솔·부대원은 없다. DS.mercsOf = 그 가문을 따라 싸우는 사람 = 맹주 가문의 가문원.
DS.isSb = function (m) { return !!m && !m.h && !m.o; };      // 막사의 사람
DS.isKin = function (m) { return !!m && !m.h && !m.sb && !!m.o; };
DS.barracks = function (save) { return (save.mercs || []).filter(function (m) { return !m.h && !m.o; }); };      // 막사 (모두)
// 막사에서 그 가문의 가주가 될 수 있는 이 = 막사의 같은 병과 (DS.sbFits · 맹주 가문 밖). 나은 차례: 등급 → 레벨
DS.sbOf = function (save, chId) {
  var ch = save && save.chars && save.chars[chId]; if (!ch || ch.id === +save.hero || !DS.sbFits) return [];
  return DS.barracks(save).filter(function (m) { return DS.sbFits(ch, m); }).sort(function (a, b) { return (b.g || 0) - (a.g || 0) || DS.pL(b) - DS.pL(a) || a.id - b.id; });
};
DS.kinOf = function (save) { return (save.mercs || []).filter(function (m) { return m.o && !m.h && !m.sb; }); };
DS.mercsOf = function (save, chId) { return (save.mercs || []).filter(function (m) { return m.o === chId && !m.h && !m.sb; }); };
// 맹주 집 사람인가 (가문원이 될 수 있는 이): 핏줄 아이 · 깃대를 넘긴 선대 · 맹주의 배우자 · 이미 가문원으로 적힌 이(m.kn). 2.2.1: 옛 맹주 가문 사람(P.hx)은 아니다
DS.lineOf = function (save, m) {
  if (!m) return false;
  var P = save && save.lin && save.lin.P, p = m.pid && P ? P[m.pid] : null;
  var h = save.chars && save.chars[save.hero], hp = h && h.pid && P && P[h.pid], sp = !!(p && p.m === m.id && hp && hp.sp && hp.sp === p.id);
  if (sp) return true;      // 2.2.7: 맹주의 배우자는 옛 맹주 가문 사람이어도 맹주 집 사람 (막사에서 혼인해 온 이가 가문원 자리에 있는데 「핏줄 밖」으로 보이던 것)
  if (p && p.m === m.id && p.hx) return false;      // 2.2.1: 옛 맹주 가문 사람 (P.hx = 그 가문 번호) — 맹주 집 사람이 아니다 (막사 · 그 가문의 병과)
  if (m.kn) return true;
  if (!p || p.m !== m.id) return false;
  return !!((p.hb && !p.ad) || p.hand);
};
// 자리 정리 (불변식): 가주는 가문마다 하나(맹주 가문에는 없다) · 가문원은 맹주 가문에 · 그 밖의 사람은 막사(o = 0, sb = 1). 고친 수
DS.mercTidy = function (save) {
  var n = 0, hid = +save.hero, bear = {};
  save.mercs.forEach(function (m) {
    if (m.o && !save.chars[m.o]) { m.o = 0; delete m.h; n++; }
    if (m.h && (!m.o || m.o === hid)) { delete m.h; if (m.o === hid && !DS.lineOf(save, m)) { if (DS.sbNc) DS.sbNc(save, m, save.chars[hid]); m.o = 0; m.sb = 1; } n++; }      // 맹주 가문의 깃발은 맹주가 든다
    if (m.h) { m.h = 1; if (bear[m.o]) { if (DS.sbNc) DS.sbNc(save, m, save.chars[m.o]); delete m.h; m.o = 0; m.sb = 1; n++; } else { bear[m.o] = 1; delete m.sb; } }      // 한 깃발에 든 사람은 하나 (앞의 줄이 남는다 — 나머지는 막사로)
  });
  save.mercs.forEach(function (m) {
    if (m.h) return;
    if (!m.sb && m.o === hid) return;      // 가문원
    if (DS.lineOf(save, m) && !m.sb) { m.o = hid; n++; return; }      // 맹주 집 사람은 맹주 가문의 가문원으로
    if (m.sb && !m.o) { m.sb = 1; if (DS.sbNc && !m.nc && !m.cast) DS.sbNc(save, m, null); return; }      // 막사 (2.2.0: 병과는 꼭 하나 — DS.sbNc)
    if (m.o) n++; if (DS.sbNc && !m.nc && !m.cast) DS.sbNc(save, m, m.o ? save.chars[m.o] : null); m.o = 0; m.sb = 1;      // 그 밖의 사람은 막사로
  });
  if (DS.partySync) DS.partySync(save);
  return n;
};
DS.popOf = function (save, chId) { return DS.mercsOf(save, chId).length; };
DS.reserve = function (save) { return (save.mercs || []).filter(function (m) { return !m.o; }); };      // 막사 (DS.barracks 와 같다 — 옛 이름)
// 2.2.8 출전: 맹주 + 고른 가주 둘 (DS.PARTY_MAX = 3). 나머지 가주는 쉰다 — 싸우지 않고, 싸움에서 쓰러지지 않고, 출전한 이가 얻는 경험치의 DS.BAL.sortieExp 를 함께 얻는다.
//   맹주 가문의 어른 가문원은 예전처럼 맹주 깃발을 따라 함께 싸운다 (출전 셋에 들지 않는다 · 고르지 않는다).
//   save.sortie = [{ h: 가문 번호, m: 고를 때의 가주(사람) 번호 }] — 가문이 비면(가주가 쓰러지고 이을 이가 없다) 그 자리는 빈다 → 남은 가주 가운데 가장 센 이가 저절로 (DS.sortieFix)
//   2.6.1: 뒤를 이은 사람이 섰으면 그 가문은 그대로 출전한다 (가주 번호만 새 사람으로)
//   저절로 채운 일은 save.sortieNews 에 [{ out: 빠진 이 이름 | '', in: 들어온 이 이름, why: 'down' | 'vac' | 'new' }] (화면이 읽고 비운다). save.sortie 가 없던 옛 저장은 말없이 가장 센 둘
//   싸우는 동안(DS.sortieHold() — 화면이 단다)은 고치지 않는다 (싸움 중에 다른 가문이 끼어들지 않게)
DS.SORTIE_N = function () { return Math.max(0, (DS.PARTY_MAX || 3) - 1); };
DS.sortieHold = DS.sortieHold || null;
DS.sortieCands = function (save) {      // 출전할 수 있는 가주의 가문 (맹주 가문 밖 · 가주가 서 있다)
  if (!save || !save.chars) return [];
  var hid = +save.hero;
  return DS.charList(save).filter(function (ch) { return ch.id !== hid && !ch.down && !ch.vac && !!(DS.bearer && DS.bearer(save, ch, 1)); });
};
DS.SORTIE_GAP = 5;      // 2.6.1: 뒤를 이은 가주가 쉬는 가주보다 이만큼(레벨) 처지면 출전 자리를 내준다
DS.sortiePow = function (save, ch) { var p = 0; try { p = DS.cardPower ? DS.cardPower(save, ch) : 0; } catch (x) { p = 0; } return p || (ch ? ch.L : 0); };
DS.sortieRank = function (save, list) { return (list || DS.sortieCands(save)).slice().sort(function (a, b) { return DS.sortiePow(save, b) - DS.sortiePow(save, a) || DS.houseOrd(a, b); }); };
function sortieWho(save, ch) { var b = DS.bearer ? DS.bearer(save, ch, 1) : null; return b ? (b.ttl || b.n || DS.flagName(ch.cls)) : DS.flagName(ch.cls); }
DS.sortieFix = function (save) {
  if (!save || !save.chars) return [];
  if (DS.sortieHold && DS.sortieHold()) return (save.sortie || []).map(function (e) { return e.h; });
  var fresh = !Array.isArray(save.sortie), cur = fresh ? [] : save.sortie, cands = DS.sortieCands(save), ok = {}, keep = [], gone = [], N = DS.SORTIE_N(), heirs = [];
  cands.forEach(function (ch) { ok[ch.id] = ch; });
  var inCur = {}, benchL = 0; cur.forEach(function (e) { if (e) inCur[e.h] = 1; });
  cands.forEach(function (ch) { if (!inCur[ch.id]) benchL = Math.max(benchL, DS.pL(DS.bearer(save, ch, 1))); });      // 쉬는 가주 가운데 가장 높은 레벨
  cur.forEach(function (e) {
    var ch = e && ok[e.h], b = ch && DS.bearer(save, ch, 1);
    // 2.6.1: 가주가 바뀌어도(뒤를 이었다) 그 가문은 출전에 남는다 — 예전에는 자리가 비고 가장 센 가문이 들어와, 장비 없이 선 후계의 가문이 말없이 빠졌다.
    //   다만 후계가 쉬는 가주보다 레벨이 DS.SORTIE_GAP 넘게 처지면 예전처럼 자리를 내준다 (장비가 아니라 레벨로 견준다 — 약한 후계가 남아 부대가 처지지 않게). 소식 줄로 알린다
    if (ch && b && keep.length < N && keep.every(function (k) { return k.h !== ch.id; })) {
      if (e.m && e.m !== b.id) { if (DS.pL(b) + DS.SORTIE_GAP <= benchL) { gone.push(e); return; } heirs.push({ out: e.n || '', in: sortieWho(save, ch), h: ch.id, why: 'heir' }); }
      keep.push({ h: ch.id, m: b.id }); return;
    }
    // 가주가 막 쓰러져 비었지만 막사에 이을 사람(같은 병과)이 있다: 자리를 맡아 둔다 — 싸움 밖에서 곧 그 사람이 선다 (banner.js DS.sbTick). 그동안 그 가문은 싸우는 목록(DS.partyIds)에 들지 않는다
    var vch = e && save.chars[e.h];
    if (vch && e.h !== +save.hero && !vch.down && DS.vacant && DS.vacant(save, vch) && DS.sbOf && DS.sbOf(save, vch.id).length && keep.length < N && keep.every(function (k) { return k.h !== vch.id; })) { keep.push({ h: vch.id, m: e.m || 0, n: e.n || '', wait: 1 }); return; }
    if (e && save.chars[e.h] && e.h !== +save.hero) gone.push(e);      // 맹주가 된 가문은 소식 없이 빠진다
  });
  var news = heirs.filter(function (n) { return n.out && n.out !== n.in; }), left = DS.sortieRank(save, cands.filter(function (ch) { return keep.every(function (k) { return k.h !== ch.id; }); }));
  // 2.6.3: 일부러 비워 둔 자리(save.sortieGap)는 채우지 않는다 — 「쉼」을 누르면 다른 가주가 저절로 들어와, 원하는 사람을 내보내기 어려웠다. 가주가 쓰러져 빈 자리는 예전처럼 채운다
  var gap = fresh ? 0 : Math.max(0, Math.min(N - keep.length, Math.round(+save.sortieGap || 0))), want = N - gap;
  if (gap > 0) save.sortieGap = gap; else delete save.sortieGap;
  while (keep.length < want && left.length) {
    var ch = left.shift(), b = DS.bearer(save, ch, 1); keep.push({ h: ch.id, m: b.id });
    if (fresh) continue;
    var g = gone.shift(), gch = g && save.chars[g.h], vac = gch && !(DS.bearer && DS.bearer(save, gch, 1));
    news.push({ out: g ? (g.n || (gch ? DS.flagName(gch.cls) : '')) : '', in: sortieWho(save, ch), h: ch.id, why: !g ? 'new' : vac ? 'vac' : 'down' });
  }
  keep.forEach(function (k) { var ch = save.chars[k.h]; if (k.wait) delete k.wait; else k.n = sortieWho(save, ch); });      // 이름 (빠질 때의 소식에 쓴다 — 맡아 둔 자리는 떠난 가주의 이름 그대로)
  save.sortie = keep;
  if (news.length) save.sortieNews = (save.sortieNews || []).concat(news).slice(-6);
  return keep.map(function (k) { return k.h; });
};
DS.sortieNewsText = function (save) {      // 화면: 저절로 채운 출전 소식 한 줄 (읽으면 비운다)
  var l = save && save.sortieNews; if (!l || !l.length) return '';
  delete save.sortieNews;
  return l.map(function (n) { return n.out ? n.out + ' 대신 ' + n.in + ' 출전' : n.in + ' 출전'; }).join(' · ');
};
DS.sortieOn = function (save, id) { return (save.sortie || []).some(function (e) { return e.h === +id; }); };
// 고르기: ids = 맹주 밖 가문 번호 (많아야 둘). 모자란 자리는 가장 센 이로 채운다. 돌려주는 것: 출전 가문 번호
DS.sortieSet = function (save, ids) {
  var N = DS.SORTIE_N(), cands = DS.sortieCands(save), out = [];
  (ids || []).forEach(function (id) { var ch = cands.filter(function (c) { return c.id === +id; })[0]; if (ch && out.length < N && out.every(function (e) { return e.h !== ch.id; })) out.push({ h: ch.id, m: DS.bearer(save, ch, 1).id }); });
  save.sortie = out;
  var hold = DS.sortieHold; DS.sortieHold = null;
  try { DS.sortieFix(save); } finally { DS.sortieHold = hold; }
  delete save.sortieNews;
  if (DS.partySync) DS.partySync(save);
  return save.sortie.map(function (e) { return e.h; });
};
// 가문 창의 출전 · 쉬기. 2.6.3: 저절로 바꾸지 않는다 — 쉬기 → 그 자리는 빈다 (save.sortieGap +1) · 출전 → 빈 자리가 있을 때만 (없으면 먼저 한 사람을 쉬게 한다). 돌려주는 것: { ok, in, out, n 출전한 가주 수, N 자리 수 } (이름)
//   예전(2.2.8 ~ 2.6.2): 쉬기 → 쉬는 가주 가운데 가장 센 이가 대신 · 출전 → 둘 가운데 약한 이와 바꾼다. 누른 것과 다른 사람이 함께 움직여 원하는 조합을 만들기 어려웠다
DS.sortieToggle = function (save, id) {
  id = +id; var on = DS.sortieOn(save, id), cur = (save.sortie || []).map(function (e) { return e.h; }), ch = save.chars[id], N = DS.SORTIE_N();
  if (!ch || id === +save.hero) return { ok: false, why: '맹주는 늘 출전한다' };
  if (on) {
    save.sortieGap = Math.min(N, Math.max(0, Math.round(+save.sortieGap || 0)) + 1);
    DS.sortieSet(save, cur.filter(function (h) { return h !== id; }));
    return { ok: true, out: sortieWho(save, ch), in: '', n: save.sortie.length, N: N };
  }
  if (DS.sortieCands(save).indexOf(ch) < 0) return { ok: false, why: '가주가 없는 가문은 나가지 못한다' };
  if (cur.length >= N) return { ok: false, why: '출전 자리가 찼다. 나간 가주를 먼저 쉬게 한다' };
  save.sortieGap = Math.max(0, Math.round(+save.sortieGap || 0) - 1);
  DS.sortieSet(save, cur.concat([id]));
  return { ok: true, in: sortieWho(save, ch), out: '', n: save.sortie.length, N: N };
};
// 싸우는 가문: 맹주 가문(맹주가 살아 서 있을 때) + 출전한 가주의 가문. s.party 는 이 목록을 비춘다 (DS.partySync)
//   2.2.3: 차례 = 맹주 → 다른 가문(부대 탭 격자와 같은 차례 — DS.houseOrd: 공훈 계급 → 합류. 계급이 오를 때만 바뀐다). 가주가 바뀌어도 가문은 제자리, 맹주가 바뀌면 새 맹주가 맨 앞
DS.partyIds = function (save) {
  if (!save || !save.chars) return [];
  var hid = +save.hero, so = DS.sortieFix(save);
  var list = DS.charList(save).filter(function (ch) { return !ch.down && !ch.vac && (ch.id === hid ? !!ch.ps : so.indexOf(ch.id) >= 0 && !!(DS.bearer && DS.bearer(save, ch, 1))); });
  return list.sort(function (a, b) { return (b.id === hid) - (a.id === hid) || DS.houseOrd(a, b); }).map(function (ch) { return ch.id; });
};
DS.partyOrder = function (save, ids) {      // 2.2.3: 아무 가문 번호 목록이나 같은 차례로 (맹주 → DS.houseOrd). 싸움 중에 쓰러진 가문도 빼지 않는다 (칩 줄 · 결과 창)
  var hid = +save.hero;
  return (ids || []).filter(function (id, i, a) { return save.chars[id] && a.indexOf(id) === i; }).sort(function (a, b) { return (+b === hid) - (+a === hid) || DS.houseOrd(save.chars[a], save.chars[b]); });
};
DS.partySync = function (save) {
  if (!save || !save.chars) return [];
  var ids = DS.partyIds(save); if (!ids.length && save.chars[save.hero]) ids = [+save.hero];      // 맹주 자리가 비었을 때(후계 의식 전)도 목록은 비지 않게
  save.party = ids;
  return ids;
};
DS.sortieNames = function (save) { return (DS.partySync(save) || []).map(function (id) { var ch = save.chars[id]; return !ch ? '' : ch.id === +save.hero ? DS.charName(ch) : sortieWho(save, ch); }).filter(Boolean).join(', '); };
DS.benched = function (save) { var p = save.party || []; return DS.sortieCands(save).filter(function (ch) { return p.indexOf(ch.id) < 0; }); };      // 2.2.8: 쉬는 가주의 가문
DS.vacant = function (save, ch) { return !!ch && ch.id !== +save.hero && !(DS.bearer && DS.bearer(save, ch, 1)); };      // 빈 가문: 가주가 없다 (막사에 같은 병과가 있으면 곧 선다)
// 이름: 지금 명부에 있거나 추모에 남은 이름은 피해서 고른다 (명부 60 + 추모 30 < 이름 수 이므로 늘 남는 이름이 있다)
DS.pickMercName = function (save, rnd) {
  var used = {}, r = rnd || Math.random;
  (save.mercs || []).forEach(function (m) { if (m.n) used[m.n] = 1; });
  (save.fallen || []).forEach(function (f) { if (f && f.n) used[f.n] = 1; });
  var free = DS.MERC_NAMES.filter(function (n) { return !used[n]; }), pool = free.length ? free : DS.MERC_NAMES;
  return pool[Math.floor(r() * pool.length)];
};
DS.addMerc = function (save, type, g, owner) {
  var keys = Object.keys(DS.TRAITS), r = Math.random;
  var m = { id: save.mnid++, type: type, g: g, o: owner || 0, hp: 1, n: DS.pickMercName(save, r), v: Math.floor(r() * 4), t: keys[Math.floor(r() * keys.length)], L: DS.recruitL ? DS.recruitL(save, g) : 1, exp: 0, k: 0, b: 0 };      // r42: 개인 레벨 (부대 평균보다 조금 아래)
  var qk = DS.rollQuirk(type, r); if (qk) m.q = qk;      // 버릇(둘째 특성): 있을 때만 칸이 생긴다
  save.mercs.push(m);
  return m;
};
DS.rollQuirk = function (type, rnd) {
  var r = rnd || Math.random; if (!(r() < DS.QUIRK_P)) return null;
  var list = Object.keys(DS.QUIRKS).filter(function (q) { return DS.quirkFits(type, q); });
  return list.length ? list[Math.floor(r() * list.length)] : null;
};
DS.loseMerc = function (save, id) { for (var i = 0; i < save.mercs.length; i++) if (save.mercs[i].id === id) return save.mercs.splice(i, 1)[0]; return null; };
// 그 지휘관 아래에서의 실전 전력 (정렬·자동 편성·화면 비교용 숫자). 실제 능력치(mercSpec)로 셈하므로 병과 일치·통솔·등급·공훈·특성·버릇이 모두 담긴다.
//   버티는 타수 × 주는 피해의 기하평균. 인구 2짜리 큰 용병은 두 자리 몫의 값이다 — 보통 용병 둘의 합과 견준다.
DS.mercPower = function (ch, m) {
  if (!ch || !m || !DS.MERCS[m.type]) return 0;
  var u = DS.mercSpec(ch, m), L = ch.L;
  var eA = 9 + 0.86 * L, eD = 4 + 0.75 * L, eR = 2 + 0.4 * L;      // 그 레벨 잡몹의 대략적인 공격·방어·마방
  var D = u.def * 0.7 + u.res * 0.3;
  var live = u.hp / Math.max(eA * 0.15, eA - D * 0.5) * (u.trait === 'survivor' ? 1.15 : 1) * (1 + (u.drain || 0));
  var n = u.passive === 'twin' ? 2 : 1, raw = u.atk * (u.basic || 1) * (n > 1 ? 0.65 : 1), blk = (u.dtype === 'phys' ? eD : eR) * 0.5;
  var hit = n * Math.max(raw * 0.15, raw - blk) * (1 + (u.crit || 0.06) * 0.5) * (u.trait === 'brave' ? 1.05 : 1);
  var reach = 1 + 0.07 * Math.min(4, u.rng[1] - 1);                // 멀리 닿는 값
  var sup = u.heal ? u.atk * u.heal * 0.5 : 0;                     // 치유는 주는 피해로 쳐서 조금
  var big = DS.mercPop(m) > 1 ? 1.6 : 1;                           // 한 몸에 모인 능력의 값: 큰 용병 하나 ≈ 같은 등급 보통 용병 둘 (자동 전투로 잰 값)
  return Math.round(Math.sqrt(live * (hit * reach * u.spd / 10 + sup)) * 10 * big);
};
// 2.2.0: 사람 하나를 굴린다 (등급은 확률표 · 맹주 자리를 이을 사람이 끝내 없을 때의 값없는 한 사람 — DS.linSucceed 의 'pull'). 저장의 천장(pity)은 건드리지 않는다
DS.rollPerson = function (save, rnd, minG, type) {
  rnd = rnd || Math.random;
  var r = rnd() * 100, g = 1, acc = 0, i;
  for (i = 5; i >= 1; i--) { acc += DS.GRADES[i].p; if (r < acc) { g = i; break; } }
  if (minG && g < minG) g = minG;
  if (!type) { var hc = save.chars[save.hero], cls = hc ? hc.cls : 'inf'; type = DS.heroType(cls); }
  return DS.addMerc(save, type, g, 0);
};
DS.pullMerc = function (save, rnd, minG) { var pity = save.pity; var m = DS.rollPerson(save, rnd, minG); save.pity = pity; return m; };      // 옛 이름 (봇·옛 호출)
// ───────── 2.2.0 영웅 모집 (영웅관): 한 번에 한 사람, 값은 비싸다 ─────────
// 등급은 확률표 + 천장(DS.PITY 번 안에 전설). 병과는 선 가문(막사가 가득하면 빈 가문만)과 닫힌 가문 가운데 하나.
//   선 가문의 병과면 그 가문이 비었을 때 곧바로 가주, 아니면 막사로. 생김새·태생은 그 가문 병과의 것 (m.nc = 병과).
// 2.2.4: 가문은 영웅관에서만 연다. 닫힌 가문(아직 없는 병과 · 그 계열의 마스터도 없다)의 병과가 나오면 그 영웅이 가주가 되어 가문이 열린다 (DS.houseOpen).
//   닫힌 가문 한 곳의 무게는 선 가문 한 곳의 DS.HOUSE_OPEN.w 배 · 닫힌 가문이 있는데 pity 번 연달아 못 열었으면 다음 모집은 반드시 닫힌 가문 (save.hpity = 연달아 못 연 수)
//   닫힌 가문이 없으면 예전과 같다 (난수를 같은 차례로 쓴다).
DS.HOUSE_OPEN = { w: 3, pity: 2 };
DS.heroType = function (cls) { var C = DS.CLASSES[cls], k = C && C.master && DS.FAMILY[C.fam] ? DS.FAMILY[C.fam].members[0] : cls, t = DS.CAST_KIND && DS.CAST_KIND[k]; return t && DS.MERCS[t] ? t : DS.baseMercTypes(k)[0]; };
DS.barFull = function (save) { return DS.barracks(save).length >= (DS.MERC_MAX || 50); };
DS.heroRoom = function (save) {
  var full = DS.barFull(save);
  return DS.charList(save).filter(function (ch) { return !full || DS.vacant(save, ch); });
};
DS.closedCls = function (save) {      // 닫힌 가문의 병과 (병과 차례 그대로)
  if (save && save.fzShut && DS.fzWakeTick && DS.fzLow(save)) DS.fzWakeTick(save);      // 2.2.9: 가문이 셋 밑으로 줄면 잠든 가문이 깨어난다
  return Object.keys(DS.CLASSES).filter(function (k) { var C = DS.CLASSES[k], F = DS.FAMILY[C.fam]; return !C.master && !DS.hasClass(save, k) && !(F && DS.hasClass(save, F.master)) && !(DS.fzShut && DS.fzShut(save, k)); });      // 2.2.9: 합일로 잠든 가문은 이번 세대에는 열리지 않는다
};
// 다음 모집이 닫힌 가문을 열 확률 (0 ~ 1) · 반드시 열기까지 남은 모집 수 (닫힌 가문이 없으면 0)
DS.openOdds = function (save) {
  var shut = DS.closedCls(save).length; if (!shut) return 0;
  if ((+save.hpity || 0) >= DS.HOUSE_OPEN.pity) return 1;
  var w = shut * DS.HOUSE_OPEN.w; return w / (w + DS.heroRoom(save).length);
};
DS.openSure = function (save) { return DS.closedCls(save).length ? Math.max(1, DS.HOUSE_OPEN.pity + 1 - (+save.hpity || 0)) : 0; };
DS.recruitWhy = function (save) {
  if (!DS.heroRoom(save).length && !DS.closedCls(save).length) return '막사가 가득 찼다 (' + (DS.MERC_MAX || 50) + '명). 방출하면 자리가 난다';
  return '';
};
// 닫힌 가문 cls 를 연다: 새 가문 + 그 가문의 가주 m (없으면 등급 g 로 하나 굴린다). 레벨은 모집한 영웅과 같다 (DS.recruitL — 부대 평균보다 조금 아래). 장비는 그 단 아래의 기본 차림
DS.houseOpen = function (save, cls, m, g) {
  if (!DS.CLASSES[cls] || DS.closedCls(save).indexOf(cls) < 0) return null;
  var woke = DS.fzWoke && DS.fzWoke(save, cls) ? save.fzShut[cls] : null;      // 2.2.9: 지난 세대에 합일로 잠들었던 가문이 다시 열린다
  m = m || DS.addMerc(save, DS.heroType(cls), g || 3, 0);
  var ch = DS.addChar(save, cls, DS.pL(m), '');
  m.nc = cls; m.o = ch.id; m.h = 1; delete m.sb; ch.Ls = ch.L; ch.op = 1;      // op: 영웅관에서 연 가문 (보이는 표시만)
  if (woke) { ch.reop = { g: DS.genNow(save), from: woke.g, n: woke.n || '', rep: woke.rep || '', early: woke.early ? 1 : 0 }; delete save.fzShut[cls]; }
  if (DS.nfGive) DS.nfGive(m);
  if (DS.mercTidy) DS.mercTidy(save);
  return ch;
};
DS.recruitHero = function (save, rnd, opt) {
  rnd = rnd || Math.random; opt = opt || {};
  var room = DS.heroRoom(save), shut = opt.ch ? [] : DS.closedCls(save); if (!room.length && !shut.length) return null;
  var r = rnd() * 100, g = 1, acc = 0, i;
  for (i = 5; i >= 1; i--) { acc += DS.GRADES[i].p; if (r < acc) { g = i; break; } }
  var PG = DS.PITY_G || 5;
  save.pity = (save.pity || 0) + 1;
  if (save.pity >= DS.PITY && g < PG) g = PG;
  if (opt.minG && g < opt.minG) g = opt.minG;
  if (g >= PG) save.pity = 0;
  var ch = null, nc = null;
  if (opt.ch && room.indexOf(opt.ch) >= 0) ch = opt.ch;
  else if (opt.cls && shut.indexOf(opt.cls) >= 0) nc = opt.cls;
  else {
    var W = DS.HOUSE_OPEN.w, sure = shut.length && (+save.hpity || 0) >= DS.HOUSE_OPEN.pity, nr = sure ? 0 : room.length, x = rnd() * (nr + shut.length * W);
    if (x < nr) ch = room[Math.floor(x) % room.length];
    else nc = shut[Math.floor((x - nr) / W) % shut.length];
  }
  if (shut.length && !opt.ch) save.hpity = nc ? 0 : (+save.hpity || 0) + 1;
  if (nc) {
    var mo = DS.addMerc(save, DS.heroType(nc), g, 0), hc = DS.houseOpen(save, nc, mo);
    return { m: mo, ch: hc, role: 'open', g: g, reopen: hc && hc.reop ? hc.reop : null };
  }
  var vac = DS.vacant(save, ch);
  var cls = DS.CLASSES[ch.cls].master && DS.FAMILY[DS.CLASSES[ch.cls].fam] ? DS.FAMILY[DS.CLASSES[ch.cls].fam].members[0] : ch.cls;
  var m = DS.addMerc(save, DS.heroType(ch.cls), g, ch.id);
  m.nc = cls;
  if (vac) { m.h = 1; ch.Ls = ch.L; if (DS.nfGive) DS.nfGive(m); } else { m.o = 0; m.sb = 1; }      // 새 가주는 제 레벨 그대로 (가문 줄의 옛 값을 받지 않는다)
  if (DS.mercTidy) DS.mercTidy(save);
  return { m: m, ch: ch, role: vac ? 'bear' : 'sb', g: g };
};
// r35 모집 값 (DS.RECRUIT). 모집권으로 부르면 열기가 오르지 않는다
function rhNow(s) { try { return DS.calNow ? DS.calNow(s).t : Math.max(0, +s.time || 0); } catch (e) { return 0; } }
function rhOf(s) { var r = s.rh; if (!r || typeof r !== 'object' || Array.isArray(r)) r = s.rh = { h: 0, t: rhNow(s) }; if (!(r.h >= 0)) r.h = 0; if (!(r.t >= 0)) r.t = rhNow(s); return r; }
DS.recruitHeat = function (s) {
  var r = rhOf(s), t = rhNow(s), q = ((DS.AGE && DS.AGE.year) || 600) / 4;
  if (t > r.t) { r.h = Math.max(0, r.h - (t - r.t) / q * DS.RECRUIT.ease); r.t = t; } else if (t < r.t) r.t = t;      // 달력이 뒤로 가면(옛 저장) 그 자리부터 다시 잰다
  return r.h;
};
// 2.2.9: 빈 가문이 많을수록 싸다 — 값 × RECRUIT.emp ÷ e (e = 빈 가문 수: 영웅관이 열 수 있는 닫힌 가문 + 가주가 없는 가문 · 합일로 잠든 가문은 빼고 · 0 이면 1 로).
//   k 번째 뒤의 값(「다음」): 이번 모집이 반드시 가문을 연다면(천장 · DS.openOdds = 1) 그 뒤는 e − 1 로, 아니면 지금 e 그대로 셈한다 (열릴지 · 빈 가문을 채울지는 뽑아 봐야 안다)
DS.recruitOpenN = function (s) { return (DS.closedCls ? DS.closedCls(s).length : 0) + (DS.bnEmpty ? DS.bnEmpty(s).length : 0); };      // 빈 가문 = 영웅관이 열 수 있는 닫힌 가문 + 가주가 없는 가문(영웅이 오면 곧 가주가 된다). 합일로 잠든 가문은 빼고
DS.recruitEmp = function (s, k) { var e = DS.recruitOpenN(s); if (k > 0 && e > 0 && DS.openOdds && DS.openOdds(s) >= 1) e = Math.max(0, e - Math.min(k, 1)); return (DS.RECRUIT.emp || 1) / Math.max(1, e); };
DS.recruitBase = function (s) { return Math.round(DS.mercCost(DS.heroTier(s)) * (DS.RECRUIT.k || 1) * DS.recruitEmp(s, 0) / 10) * 10; };      // 기본값 (열기 없이 · 빈 가문 배율은 넣고)
DS.recruitPrice = function (s, k) { var h = DS.recruitHeat(s) + (k || 0); return Math.round(DS.mercCost(DS.heroTier(s)) * (DS.RECRUIT.k || 1) * DS.recruitEmp(s, k || 0) * (1 + DS.RECRUIT.step * h) / 10) * 10; };      // 2.2.0: 영웅 값 = 기본값 × RECRUIT.k      // k = 지금부터 몇 번째 뒤
DS.recruitTotal = function (s, n) { var t = 0; for (var i = 0; i < n; i++) t += DS.recruitPrice(s, i); return t; };
DS.recruitPaid = function (s, n) { DS.recruitHeat(s); s.rh.h = Math.min(DS.RECRUIT.max, s.rh.h + (n || 1)); };
DS.recruitEase = function (s) { var h = DS.recruitHeat(s), e = DS.RECRUIT.ease; return h > 0 && e > 0 ? Math.ceil(h / e) : 0; };      // 기본값으로 돌아올 때까지 남은 계절
DS.heroTier = function (save) { var t = 1; DS.charList(save).forEach(function (c) { t = Math.max(t, DS.tierOfL(c.L)); }); (save.mercs || []).forEach(function (m) { t = Math.max(t, DS.tierOfL(DS.pL(m))); }); return t; };

// ── 전투용 유닛 사양 ──
(DS.UNIT_KEYS = DS.UNIT_KEYS || []).push('st', 'quirk', 'basic', 'kite', 'taunt', 'mn');      // 레벨이 오르거나 편성·태세가 바뀔 때 game.js 의 refreshUnits 가 함께 베낄 칸
DS.cmdSpec = function (ch, hero, who) {      // who = 든 사람 (banner.js 의 바깥 겹이 얹는다)
  var c = DS.CLASSES[ch.cls], s = DS.charStats(ch), t = DS.tierOfL(ch.L);
  return {
    id: 'c' + ch.id, side: 'ally', role: 'cmd', ch: ch.id, cls: ch.cls, name: DS.charName(ch), L: ch.L, tier: t,
    look: [ch.cls, t], hp: s.hp, mhp: s.hp, mp: s.mp, mmp: s.mp, atk: s.atk, def: s.def, mag: s.mag, res: s.res,
    spd: s.spd, mv: c.mv, mt: c.mt, rng: s.rng, atkKind: c.atk, dtype: c.dtype, kind: c.kind, tags: c.tags || [],
    basic: c.basic || 1, passive: c.passive, skills: DS.charSkills(ch), drain: s.drain, crit: s.crit, enh: s.enh, hero: !!hero,
    st: ch.st === 'side' ? 'side' : ''      // 용병 태세: 'side' = 곁에, '' = 앞장 (엔진이 읽는다)
  };
};
// 용병의 능력은 이끄는 지휘관의 레벨(그 단의 기본 장비 기준)을 따르고, 등급과 병과 일치가 배율을 준다
DS.mercSpec = function (ch, m) {
  var M = DS.MERCS[m.type], mL = m.L != null ? DS.pL(m) : ch.L, t = DS.tierOfL(mL), ref = { cls: ch.cls, L: mL };      // r42: 가솔은 제 레벨로 (가문 병과의 능력치 줄 · 그 단의 기본 장비)
  DS.stdGear(ref, t);
  var s = DS.charStats(ref), main = M.useMag ? s.mag : s.atk, vr = DS.hRank(ch), T = DS.TRAITS[m.t] || {};
  var Q = (m.q && DS.QUIRKS[m.q] && DS.quirkFits(m.type, m.q)) ? DS.QUIRKS[m.q] : {};      // 버릇(둘째 특성)
  var k = DS.GRADES[m.g].mul * DS.hMul(ch) * (DS.mercMatch(ch, m) ? 1.1 : 1) * (mL > 70 ? 0.92 : 1) * (DS.BN && DS.BN.kinK || 1);      // 등급 × 가문 공훈 × 병과 일치 × 2.2.0 가문원 배율
  var Ld = {};      // 2.2.0: 통솔(지휘관 병과의 가솔 버프)은 없어졌다
  var hp = Math.round(s.hp * M.hp * k * (Ld.hp || 1) * (T.hp || 1) * (Q.hp || 1));
  var at = Math.round(main * M.at * k * (Ld.at || 1) * (T.at || 1) * (Q.at || 1));
  var sks = DS.mercSkills(m, mL);      // r42: 종류의 기술을 제 단으로 (3단·5단·7단) + 영웅·전설의 고유 기술 (엔진의 aiMerc 가 aiSkill 을 부르면 쓴다)
  var sp = {
    id: 'm' + m.id, mid: m.id, side: 'ally', role: 'merc', owner: 'c' + ch.id, type: m.type, name: m.n || DS.mercKind(m), L: mL, tier: t, grade: m.g, vet: vr, trait: m.t || null, quirk: Q.name ? m.q : null,
    crit: 0.06 + (T.crit || 0) + (Q.crit || 0),
    look: M.big ? null : [m.type, m.g, m.v || 0], sprite: M.sprite || null, pal: M.pal || null, big: !!M.big,
    hp: hp, mhp: hp, mp: 0, mmp: 0, atk: at, mag: at,
    def: Math.round(s.def * M.df * k * (Ld.def || 1) * (T.def || 1) * (Q.def || 1)), res: Math.round(s.res * M.df * k * (Ld.res || 1) * (T.res || 1)),
    spd: M.spd * (Ld.spd || 1) * (T.spd || 1) * (Q.spd || 1), mv: M.mv * (Q.mv || 1), mt: M.mt, rng: [M.rng[0], M.rng[1] + (Q.rng || 0)],
    atkKind: M.atk, dtype: Q.dtype || M.dtype, kind: M.kind, tags: M.tags || [], passive: M.passive || Q.passive, heal: M.heal || Q.heal || 0,
    basic: Q.basic || 1, drain: Q.drain || 0, skills: sks,
    kite: M.kite || 0, taunt: Math.max(M.taunt || 0, Q.taunt || 0), mn: m.n || ''      // 종류별 고유 행동(엔진이 읽는다: 거리 유지·도발), 이름표에 쓸 용병 이름(그래픽)
  };
  return DS.ultSpec(sp, m, false);      // r36: 가솔은 필살기가 없다 (맹주만)
};
// 출신 (표시만, 저장 칸 없음): 종류마다 정한 고장 가운데 용병 번호로 하나. { key, name, desc }
DS.mercOrigin = function (m) {
  if (!m || !DS.MERCS[m.type]) return null;
  var L = DS.MERC_FROM[m.type] || ['haemil'], key = L[Math.floor(DS.hash2(m.id || 0, 31, 5) * L.length) % L.length], O = DS.ORIGIN[key] || { name: key, desc: '' };
  var lo = DS.LORE && DS.LORE.origin && DS.LORE.origin[key];
  return { key: key, name: O.name, desc: (typeof lo === 'string' && lo) || O.desc };
};
// 부대 전체: 2.2.0 — 가주가 선 가문은 모두 싸운다 (깃발 유닛) + 맹주 가문의 어른 가문원 (따르는 유닛). 빈 가문·막사·미성년은 싸우지 않는다
//   2.2.3: 차례 = 맹주 → 다른 가문의 가주(DS.partyIds 차례) → 맹주의 어른 가문원 (화면의 칩·고르기 차례와 같다)
DS.partySpecs = function (save) {
  var out = [], kin = [];
  (DS.partySync ? DS.partySync(save) : save.party).forEach(function (id) {
    var ch = save.chars[id]; if (!ch || ch.down || ch.vac) return;
    var who = DS.bearer ? DS.bearer(save, ch) : null; if (DS.bearer && !who) return;
    out.push(DS.cmdSpec(ch, id === save.hero, who));
    DS.mercsOf(save, id).forEach(function (m) { kin.push(DS.mercSpec(ch, m)); });
  });
  return out.concat(kin);
};

// ── 적 ──
// 처치 골드 곡선 (r12 경제 — 후반 골드가 너무 빨리 쌓이던 것): 레벨 knee 까지는 옛 그대로(5 + 1.5·L — 1~10번 경제 불변), 그 위로는 레벨 하나에 slope 만큼만 더 오른다.
//   from 판을 깬 뒤로는(합일 준비 사냥부터) 들판에서 부대(평균 레벨)보다 낮은 적의 골드가 경험치처럼 준다: 한 레벨 아래마다 low, 바닥 lowMin (스폰 때의 부대 레벨로 잰다)
//   zone: 같은 때부터, 8단 사냥터(합일 준비로 오래 머무는 곳)의 들판 적 골드 배율
DS.KGOLD = { knee: 40, slope: 0.4, from: 20, low: 0.075, lowMin: 0.25, zone: { spire: 0.45, ash: 0.45, end: 0.45 } };
DS.killGoldL = function (L) { var K = DS.KGOLD; return L <= K.knee ? L : K.knee + (L - K.knee) * K.slope; };
DS.killGoldLow = function (save, L) {
  var K = DS.KGOLD; if (!save || !DS.partyL) return 1;
  var d = L - DS.partyL(save); return d >= 0 ? 1 : Math.max(K.lowMin, 1 + d * K.low);
};
DS.enemySpec = function (type, L, o) {
  o = o || {};
  var B = o.boss ? DS.BOSSES[o.boss] : null, e = DS.ENEMIES[B ? B.like : type], k = L - 1, d = o.diff || 1, bal = DS.BAL;
  var m = (B && B.mul) || {};
  function st(n, g) { return (e.base[n] + e.grow[n] * k) * (m[n] || 1) * g; }
  var hp = Math.round(st('hp', bal.ehp * d) * (o.hm || 1)), am = o.am || 1;      // hm·am: 시나리오별 체력·공격 손잡이 (DS.TUNE_E)
  var u = {
    side: 'enemy', role: B ? 'boss' : 'mob', type: B ? o.boss : type, name: B ? B.name : e.name, title: B ? B.title : '', L: L,
    sprite: B ? B.sprite : e.sprite, pal: B ? B.pal : null, big: !!B,
    hp: hp, mhp: hp, mp: 0, mmp: 0, atk: Math.round(st('atk', bal.eatk * d) * am), mag: Math.round(st('mag', bal.eatk * d) * am),
    def: Math.round(st('def', bal.edef * Math.sqrt(d))), res: Math.round(st('res', bal.edef * Math.sqrt(d))),
    spd: e.spd * (m.spd || 1), mv: e.mv, mt: (B && B.mt) || e.mt, rng: ((B && B.rng) || e.rng).slice(),
    atkKind: (B && B.atk) || e.atk, dtype: (B && B.dtype) || e.dtype || 'phys', kind: e.kind,
    tags: ((B && B.tags) || e.tags || []).slice(), passive: (B && B.passive) || e.passive,
    skills: ((B && (B.sets ? B.sets[Math.max(0, Math.min(B.sets.length - 1, Math.floor((L - 43) / 18)))] : B.skills)) || e.skills || []).slice(), info: B ? B.title : e.info,      // sets: 레벨 구간마다 다른 구성 (갱도지기)
    exp: Math.round((6 + 1.6 * L) * (B ? 8 : 1) * (o.expMul == null ? 1 : o.expMul) * (o.xpK || 1)), gold: Math.round((5 + 1.5 * DS.killGoldL(L)) * (B ? 6 : 1) * (o.expMul == null ? 1 : o.expMul)),
    phase2: B && B.phase2
  };
  var SZ = B ? B.sz : e.sz;      // 2.3.0: 큰 몸 (가로 × 세로 칸) · 격노 · 둘레 기운 · 갈라짐 · 먼저 칠 적
  if (SZ && (SZ[0] > 1 || SZ[1] > 1) && !o.small) { u.fw = SZ[0]; u.fh = SZ[1]; if (DS.BIG_HP) { var bk = DS.BIG_HP[SZ[0] * SZ[1]] || 1; u.hp = u.mhp = Math.round(u.hp * bk); } }
  var EN = B ? B.enr : e.enr; if (EN) u.enr = { th: EN.th || 0.4, atk: EN.atk || 0, spd: EN.spd || 0, add: (EN.add || []).slice(), say: EN.say || '' };
  var AU = (B && B.aura) || (!B && e.aura); if (AU) u.aura = { s: AU.s, r: AU.r || 1, p: AU.p || 0, dur: AU.dur || 3 };
  if (!B && e.split) u.split = { type: e.split.type, n: e.split.n || 2, dL: e.split.dL || 1, hp: e.split.hp || 1 };
  if (!B && e.pri) u.pri = e.pri;
  if (!B && o.zone && o.save && o.save.cleared && o.save.cleared[DS.KGOLD.from]) u.gold = Math.round(u.gold * DS.killGoldLow(o.save, L) * (DS.KGOLD.zone[o.zone] || 1));      // 들판 적만 (시나리오 적은 o.save 가 없다)
  if (o.x != null) { u.x = o.x; u.y = o.y; }
  if (o.grp != null) u.grp = o.grp;
  return u;
};

// ── 저장 데이터 ──
DS.newSave = function (name, heroCls) {
  var s = {
    v: DS.SAVE_V || 11, name: name || '맹주', nid: 1, chars: {}, party: [], hero: 0, gold: 300,
    items: { herb: 5, mana: 2, endo: 1 }, cleared: {}, visited: { haemil: true },
    gear: {}, mercs: [], mnid: 1, sortie: [], tickets: 2, pity: 0, fallen: [],      // r35: 처음 모집권 1장 (예전 2장) · 2.2.4: 다시 2장 — 가문이 영웅관에서만 열리니 첫 두 가문을 바로 열 수 있게 (초반에 셋이 함께 싸운다)
   
    zone: 'haemil', pos: null, town: 'haemil', crest: false, pit: 1, pitBest: 0, pitCur: 1, pitV: 2, kills: 0, time: 0,
    opt: { sfx: true, bgm: true, speed: 1, refill: true }, seen: {}, perk: null, news: [], ver: DS.VERSION || ''
  };
  s.hero = DS.addChar(s, heroCls, 1, s.name).id;
  s.chars[s.hero].st = 'side';      // 2.2.0: 맹주를 따르는 가문원은 처음부터 「호위」 (아이는 귀하다 — 부대 판에서 「돌격」으로 바꾼다)
  s.us = 1 + Math.floor(Math.random() * 2147483646);      // r38: 타고난 필살기의 씨앗 (새 판마다 다르게 — 옛 저장은 eg.seed)
  s.bn = 1;      // 4.0: 새 구조 (판정의 근거가 아니라 참고 표시 — 근거는 DS.bnFix 의 불변식)
  if (DS.CAST_KIND) s.chars[s.hero].ps = { type: DS.CAST_KIND[heroCls] || 'm_sword', g: DS.CAST_G || 3, t: DS.heroTrait ? DS.heroTrait(heroCls) : DS.CAST_TRAIT[heroCls] || 'guard', v: 0, L: s.chars[s.hero].L, exp: 0, k: 0, b: 0 };      // r42: 맹주의 개인 레벨      // 대장이라는 사람 한 줄 (1세: 희귀 · 병과 고정 특성)
  return s;
};
// 깃발 한 줄. 사람 칸(name·down·hp)은 대장 줄(저장의 첫 깃발)에만 — 4.0: 깃발을 드는 사람은 부대원 줄에 있다
DS.addChar = function (save, cls, L, name) {
  var c = DS.CLASSES[cls], lv = Math.max(L, (c.start - 1) * 10 + 1), t = DS.tierOfL(lv), first = !save.hero && !Object.keys(save.chars).length;
  var ch = { id: save.nid++, cls: cls, L: lv, exp: 0, w: null, a: null, mp: 1 };   // mp 는 남은 비율 (깃발 것 — 전투가 끝나도 이어진다)
  if (first || name) { ch.name = name || ''; ch.down = false; ch.hp = 1; }      // hp 는 사람 것 (대장 줄)
  DS.stdGear(ch, Math.max(1, t - 1));
  save.chars[ch.id] = ch;
  if (save.party.indexOf(ch.id) < 0) save.party.push(ch.id);      // 2.2.8: 출전 셋은 DS.partySync 가 다시 맞춘다 (새 가문은 자리가 비었을 때만 나간다)
  return ch;
};
DS.charList = function (save) { return Object.keys(save.chars).map(function (k) { return save.chars[k]; }).sort(function (a, b) { return a.id - b.id; }); };
DS.hasClass = function (save, cls) { return DS.charList(save).some(function (c) { return c.cls === cls; }); };
DS.partyTier = function (save) {
  var t = 0; save.party.forEach(function (id) { var c = save.chars[id]; if (c) t = Math.max(t, DS.tierOfL(c.L)); });
  return t;
};
DS.partyL = function (save) {
  var s = 0, n = 0; save.party.forEach(function (id) { var c = save.chars[id]; if (c) { s += c.L; n++; } });
  return n ? Math.round(s / n) : 1;
};
// 시험·시뮬레이션용: 그 단의 기본 장비와 빈 가문의 시험용 가주를 갖춘다
DS.kit = function (save, o) {
  o = o || {};
  DS.charList(save).forEach(function (c) {
    DS.stdGear(c, Math.max(1, DS.tierOfL(c.L) - (o.gearLag || 0)));
    var ty = DS.baseMercTypes(c.cls);      // 2.2.0: 가솔이 없다 — 가주만 세운다
    if (c.id !== save.hero && DS.bearer && !DS.bearer(save, c)) { var kb = DS.addMerc(save, (DS.CAST_KIND && DS.CAST_KIND[c.cls]) || ty[0], 3, c.id); kb.h = 1; kb.t = null; kb.v = 0; delete kb.q; kb.L = c.L; if (c.L > 70) kb.fz = 1; }      // 빈 깃발에는 시험용 든 사람 (r44: 희귀 — 아홉 집 본인과 같은 등급 배율 ×1.05 · 특성 없음 · 공훈 0)
  });
};

// ───────── r42 (2.0.0) 사람마다 단·레벨 ─────────
// 사람 = 맹주(대장 가문 줄의 ps) · 부대원(save.mercs — 가주·가솔·막사). 사람마다 L(1~100)·exp·fz(합일함 — 70 을 넘을 수 있다)를 지닌다.
// 가문 줄(save.chars)의 L·exp 는 지금 가주의 개인 레벨을 비춘 것이다 (DS.pSync). 2.2.0: 가주를 잃은 가문은 레벨·단도 잃는다 (L 1 · 새 가주는 제 레벨 그대로 — 따라잡기 없음).
//   바깥(시험 도구·옛 코드)이 가문 줄의 L 을 직접 바꾸면 그 값이 가주에게로 간다 (ch.Ls = 마지막으로 맞춘 값).
DS.PEXP = { catchCap: 1.5, recruit: { k: 0.9, d: 3 }, kid: 0.8, heir: { kid: 0.5, adopt: 0.25 } };      // 2.2.0: kid 0.5 → 0.8 — 어른이 된 아이는 바로 싸움에 나선다
DS.pL = function (who) { return who ? Math.max(1, Math.min(100, Math.round(+who.L || 1))) : 1; };
DS.pCap = function (who) { return who && (who.fz || +who.L > 70 || who.dx) ? 100 : 70; };      // 2.6.4: dx = 大 가문의 가주 (합일 없이 70 을 넘는다 — DS.daeSync)
// ───────── 2.6.4 大 가문 ─────────
//   합일의 대표 가문은 그 세대 동안 「大 ○○ 가문」이다 (ch.dae = 합일한 세대 · DS.genNow). 8단 위의 가주가 서 있는 가문도 大 로 부른다.
//   大 가문의 가주는 합일하지 않아도 7단 Lv10 뒤에 8단으로 자란다 (who.dx → DS.pCap 100). 합일한 가주가 쓰러져도 그 가문은 이번 세대에 다시 8단에 닿을 수 있다 —
//   예전에는 다시 합일해야 했는데, 흡수된 두 가문이 잠들어 있어 셋을 모으지 못하면 길이 막혔다. 뒤를 잇는 사람은 여전히 제 레벨로 선다 (8단을 물려받지는 않는다).
DS.houseHead = function (s, ch) { if (!s || !ch) return null; return ch.id === +s.hero ? (ch.vac ? null : ch.ps || null) : (DS.bearer ? DS.bearer(s, ch, 1) : null); };
DS.houseDaeGen = function (s, ch) { return !!(s && ch && (+ch.dae || 0) >= DS.genNow(s)); };      // 이번 세대에 합일한 대표 가문인가 (가주가 70 을 넘을 수 있다)
DS.houseDae = function (s, ch) { if (!s || !ch) return false; var b = DS.houseHead(s, ch); return DS.houseDaeGen(s, ch) || !!(b && (b.fz || +b.L > 70)); };      // 화면 이름에 「大」가 붙는가
DS.daeSync = function (s) {
  if (!s || !s.chars) return;
  var heads = [];
  for (var k in s.chars) { var ch = s.chars[k]; if (!ch) continue; var b = DS.houseHead(s, ch); if (!b) continue; heads.push(b); if (DS.houseDaeGen(s, ch)) b.dx = 1; else delete b.dx; }
  (s.mercs || []).forEach(function (m) { if (m.dx && heads.indexOf(m) < 0) delete m.dx; });
};
DS.daeFix = function (s) {      // 저장 다듬기 + 옛 저장: 잠든 가문 기록(fzShut[].by = 대표 가문의 병과) · 살아 있는 합일 가주(fuG)에서 大 를 되살린다
  if (!s || !s.chars) return;
  var k, list = DS.charList(s);
  list.forEach(function (c) { if (c.dae != null) { var d = Math.round(+c.dae); if (d >= 1) c.dae = d; else delete c.dae; } });
  var z = s.fzShut; if (z && typeof z === 'object' && !Array.isArray(z)) for (k in z) { var e = z[k]; if (!e || !e.by || !(+e.g >= 1)) continue; list.forEach(function (c) { if (c.cls === e.by && !((+c.dae || 0) >= +e.g)) c.dae = Math.round(+e.g); }); }
  list.forEach(function (c) { var b = DS.houseHead(s, c); if (b && b.fz && +b.fuG >= 1 && !((+c.dae || 0) >= +b.fuG)) c.dae = Math.round(+b.fuG); });
  DS.daeSync(s);
};
DS.heroPs = function (s) { var h = s && s.chars && s.chars[s.hero]; return h && !h.vac && h.ps ? h.ps : null; };
DS.whoHouse = function (s, who) {      // 그 사람이 선 가문 (맹주 = 대장 가문, 가주·가솔 = m.o). 막사는 null
  if (!s || !s.chars || !who) return null;
  var h = s.chars[s.hero]; if (h && h.ps === who) return h;
  return who.o && s.chars[who.o] ? s.chars[who.o] : null;
};
DS.pSyncRow = function (ch, b, vac) {      // vac: 맹주 가문이 아닌 빈 가문 — 가주와 함께 레벨·단을 잃는다
  if (!ch) return;
  if (!b) { if (vac) { ch.L = 1; ch.exp = 0; } ch.Ls = ch.L; return; }
  if (b.L == null || !(+b.L >= 1)) { b.L = ch.L; b.exp = +ch.exp || 0; if (ch.L > 70) b.fz = 1; }
  else if (ch.L !== b.L && (ch.Ls == null || ch.L !== ch.Ls)) { b.L = ch.L; b.exp = +ch.exp || 0; if (ch.L > 70) b.fz = 1; }      // 바깥이 가문 줄의 레벨을 바꿨다 → 가주에게
  b.L = DS.pL(b); ch.L = b.L; ch.exp = +b.exp || 0; ch.Ls = ch.L;
};
DS.pSync = function (s) {
  if (!s || !s.chars) return s;
  for (var k in s.chars) { var ch = s.chars[k]; if (!ch) continue; var b = DS.bearer ? DS.bearer(s, ch, 1) : null; DS.pSyncRow(ch, b, !b && ch.id !== +s.hero); }
  (s.mercs || []).forEach(function (m) { if (m.L == null || !(+m.L >= 1)) m.L = 1; m.L = DS.pL(m); if (!(+m.exp >= 0)) m.exp = 0; if (m.L > 70) m.fz = 1; });
  if (DS.daeSync) DS.daeSync(s);
  return s;
};
// 모든 사람 [{ who, ch: 선 가문(없으면 null), role: 'hero'|'bear'|'kin'|'sb'|'bench', dep: 싸우러 나갔는가 }]
//   2.2.0: kin = 가문원(맹주 깃발을 따라 싸운다) · sb = 막사(싸우지 않는다, ch 없음) · bench = 가문 밖(없어야 한다)
DS.persons = function (s) {
  var out = [], seen = {}; if (!s || !s.chars) return out;
  DS.pSync(s);      // 바깥이 가문 줄의 레벨을 바꿨으면 먼저 가주에게
  var hid = s.hero, party = s.party || [];
  DS.charList(s).forEach(function (ch) {
    var hero = ch.id === hid, b = hero ? DS.heroPs(s) : (DS.bearer ? DS.bearer(s, ch, 1) : null);
    var dep = party.indexOf(ch.id) >= 0 && !ch.down && !ch.vac && !!b;
    if (b) { out.push({ who: b, ch: ch, role: hero ? 'hero' : 'bear', dep: dep }); if (!hero) seen[b.id] = 1; }
    DS.mercsOf(s, ch.id).forEach(function (m) { if (seen[m.id]) return; seen[m.id] = 1; out.push({ who: m, ch: ch, role: 'kin', dep: dep }); });
  });
  DS.barracks(s).forEach(function (m) { if (seen[m.id]) return; seen[m.id] = 1; out.push({ who: m, ch: null, role: 'sb', dep: false }); });      // 막사 (가문에 매이지 않는다)
  (s.mercs || []).forEach(function (m) { if (!seen[m.id]) out.push({ who: m, ch: null, role: 'bench', dep: false }); });
  return out;
};
DS.pAvgL = function (s) { var n = 0, t = 0; DS.persons(s).forEach(function (p) { if (p.dep) { n++; t += DS.pL(p.who); } }); return n ? t / n : 1; };
// 새로 오는 사람의 레벨: 출전한 사람들의 평균에 가깝게 (조금 아래), 등급이 높을수록 조금 높게. 합일 전이라 70 을 넘지 않는다
DS.recruitL = function (s, g) { var R = DS.PEXP.recruit, a = DS.pAvgL(s); if (a <= 1.5) return 1; return Math.max(1, Math.min(70, Math.round(a * R.k) - R.d + ((+g || 2) - 3))); };
DS.kidL = function (s) { return Math.max(1, Math.min(70, Math.round(DS.pAvgL(s) * DS.PEXP.kid))); };
// 경험치: 싸우러 나간 사람(가주·맹주·어른 가문원)은 전부, 가문 밖은 BAL.bench. 낮은 사람은 따라잡기 보정, 잠재력(★)만큼 빨리.
//   막사의 사람은 같은 병과(DS.sbFits) 가문의 가주가 이번에 얻은 경험치 × BAL.sbShare 를 그대로 얻는다 (보정 없음 · 막사의 같은 병과가 여럿이어도 저마다 온전히). 그 병과의 가주가 없으면 얻지 못한다.
//   돌려주는 것: 레벨이 오른 사람 [{ id: 선 가문 번호(막사 0), mid: 부대원 번호(맹주 0), hero, bear(깃발 유닛인가), from, to, promo, who, pg: 새 성장 }]
DS.gainExp = function (save, amount, eL) {
  if (DS.daeSync) DS.daeSync(save);
  var ups = [], list = DS.persons(save), top = 1, perk = (save.perk && save.perk.exp) || 0;
  list.forEach(function (p) { if (p.dep) top = Math.max(top, DS.pL(p.who)); });
  var got = {};      // 가문 번호 → 그 가문 가주가 이번에 얻은 경험치 (막사의 몫을 잰다)
  list.sort(function (a, b) { return (a.role === 'sb' ? 1 : 0) - (b.role === 'sb' ? 1 : 0); });      // 막사는 가주들 다음에
  list.forEach(function (p) {
    var w = p.who; if (w.L == null) w.L = p.ch ? p.ch.L : 1;
    var cap = DS.pCap(w), gain;
    if (p.role === 'sb') {
      gain = 0; DS.charList(save).forEach(function (ch) { if (got[ch.id] > gain && DS.sbFits && DS.sbFits(ch, w)) gain = got[ch.id]; });
      gain *= DS.BAL.sbShare || 0;
    } else {
      var d = (eL || w.L) - w.L, f = d >= 0 ? Math.min(1.5, 1 + d * 0.08) : Math.max(0.25, 1 + d * 0.075);
      var rest = !p.dep && p.role === 'bear' && p.ch && !p.ch.down && !p.ch.vac;      // 2.2.8: 쉬는 가주는 DS.BAL.sortieExp
      f *= (p.dep ? 1 : rest ? DS.BAL.sortieExp : DS.BAL.bench) * DS.BAL.exp * (1 + Math.min(DS.PEXP.catchCap, Math.max(0, top - w.L - 2) * 0.15)) * (1 + perk) * (DS.potMul ? DS.potMul(w) : 1);
      gain = amount * f;
      if ((p.role === 'bear' || p.role === 'hero') && (p.dep || rest) && p.ch && w.L < cap) got[p.ch.id] = gain;      // 막사는 같은 병과 가주가 얻은 몫의 sbShare (그 가주가 쉬면 쉬는 몫의)
    }
    if (w.L >= cap) { w.exp = 0; return; }
    if (!(gain > 0)) return;
    w.exp = (+w.exp || 0) + gain;
    var from = w.L, pg0 = DS.pgSteps ? DS.pgSteps(w) : 0;
    while (w.L < cap && w.exp >= DS.expNeed(w.L)) { w.exp -= DS.expNeed(w.L); w.L++; }
    if (w.L >= cap) w.exp = 0;
    if (w.L > from) {
      var up = { id: p.ch ? p.ch.id : 0, mid: p.role === 'hero' ? 0 : (w.id || 0), hero: p.role === 'hero', bear: p.role === 'hero' || p.role === 'bear', from: from, to: w.L, promo: DS.tierOfL(w.L) > DS.tierOfL(from), who: w, dep: p.dep };
      if (up.promo && DS.pgRecord) up.pg = DS.pgRecord(w, pg0);
      ups.push(up);
    }
  });
  DS.pSync(save);
  return ups;
};

// ───────── r42 합일: 사람 셋 ─────────
// 7단 Lv10(L70)인 사람(합일하지 않은 어른) 아무 셋 + 맹세의 깃대 → 교회에서 셋이 저마다 8단 1레벨(L71)로 오르고 70 을 넘어 자랄 수 있다(fz).
//   8단 뒤의 세기·모습·이름은 그 사람이 선 가문 병과의 마스터 것 (DS.riseCls — 가문 줄의 L 이 가주를 비추므로 그대로).
//   사람 열쇠: 'h' = 맹주, 'm<번호>' = 부대원. 옛 꼴(가문 번호 숫자)을 주면 그 가문의 가주.
DS.FUSE_MIN = 70;
DS.FUSE_N = 3;
DS.pKey = function (s, who) { return who && who === DS.heroPs(s) ? 'h' : who && who.id ? 'm' + who.id : ''; };
DS.pByKey = function (s, k) {
  if (k === 'h') return DS.heroPs(s);
  if (typeof k === 'number' || /^\d+$/.test(String(k))) { var ch = s.chars[+k]; return ch ? (ch.id === s.hero ? DS.heroPs(s) : DS.bearer(s, ch)) : null; }
  var m = /^m(\d+)$/.exec(String(k || '')); if (!m) return null;
  for (var i = 0; i < (s.mercs || []).length; i++) if (s.mercs[i].id === +m[1]) return s.mercs[i];
  return null;
};
DS.pNative = function (s, who) {      // 그 사람의 태생 병과 (맹주 = 맹주 가문 병과, 아홉 = 제 집, 부대원 = 종류가 맞는 첫 병과)
  if (!who) return 'inf';
  if (who === DS.heroPs(s)) return s.chars[s.hero].cls;
  if (who.cast && DS.CLASSES[who.cast]) return who.cast;
  var hit = null; Object.keys(DS.CLASSES).forEach(function (c) { if (!hit && !DS.CLASSES[c].master && DS.baseMercTypes(c).indexOf(who.type) >= 0) hit = c; });
  if (!hit) Object.keys(DS.CLASSES).forEach(function (c) { if (!hit && !DS.CLASSES[c].master && DS.mercTypes(c).indexOf(who.type) >= 0) hit = c; });
  return hit || 'inf';
};
function fuEnt(s, p) { return { id: DS.pKey(s, p.who), key: DS.pKey(s, p.who), who: p.who, ch: p.ch, L: DS.pL(p.who), exp: +p.who.exp || 0, cls: p.ch ? p.ch.cls : DS.pNative(s, p.who), role: p.role, dep: p.dep }; }
// ───────── 2.2.9 합일: 서로 다른 세 가문의 가주 셋 ─────────
//   후보 = 가주(맹주 가문은 맹주)로 선 사람 가운데 합일하지 않은 7단 Lv10 (가문원 · 막사는 합일하지 않는다). 셋은 늘 서로 다른 가문이다 (가문마다 가주는 하나).
//   대표 가문 = 고른 셋 가운데 플레이어가 고른 곳 (기본 = 공훈이 가장 큰 곳 · 맹주가 셋에 들면 늘 맹주 가문). 그 가주가 8단 1레벨(L71)로 올라 제 가문 윗길(DS.riseCls)로 자란다 — 사람 · 장비 · 나이 · 배우자 · 핏줄 그대로.
//   나머지 두 가주는 대표에게 흡수된다: 명부에서 사라지고(가계도에는 「합일」로 남는다 — 죽음으로 세지 않는다), 든 장비는 가방으로, 든 물건은 소지품으로.
//   그 두 가문은 이번 세대가 끝날 때까지 닫힌다 (save.fzShut[병과] = { g: 닫힌 세대, …}). 세대 = DS.egGen (1 = 첫 대 · 「다음 세대의 장」을 열 때마다 하나씩 — endgame.js DS.egStart).
//   닫힌 동안은 영웅관이 그 병과로 가문을 열지 않고(DS.closedCls 에서 빠진다 · 천장 셈에도 들지 않는다), 다음 세대가 오면 보통의 닫힌 가문이 되어 다시 열 수 있다 (열 때 연출 'reopen').
DS.fuseCan = function (p) { return !!p && (p.role === 'hero' || p.role === 'bear') && !!p.ch && !p.ch.vac && !p.ch.down && !p.who.fz && !p.who.dx && DS.pL(p.who) <= 70; };      // 2.6.4: 大 가문의 가주는 합일하지 않는다 (제 힘으로 8단에 오른다)
DS.fusePool = function (save) { return DS.persons(save).filter(DS.fuseCan).map(function (p) { return fuEnt(save, p); }); };
DS.fuseCands = function (save) { return DS.fusePool(save).filter(function (c) { return c.L >= DS.FUSE_MIN; }); };
DS.fuseRepLock = function (save, who) { var hp = DS.heroPs(save); return hp && (who || []).indexOf(hp) >= 0 ? save.chars[save.hero] : null; };      // 맹주가 셋에 들면 대표는 맹주 가문 (바꿀 수 없다)
DS.fuseRep = function (save, who, repId) {
  var hs = []; (who || []).forEach(function (w) { var h = DS.whoHouse(save, w); if (h && hs.indexOf(h) < 0) hs.push(h); });
  var lock = DS.fuseRepLock(save, who); if (lock) return lock;
  var pick = repId != null ? hs.filter(function (h) { return h.id === +repId; })[0] : null;
  return pick || hs.sort(DS.houseCmp)[0] || null;
};
DS.fuseOk = function (save, ids, opt) {
  if (!(ids instanceof Array) || ids.length !== DS.FUSE_N) return { ok: false, why: '가주 ' + DS.FUSE_N + '명을 고른다' };
  var seen = {}, cand = {}, hs = {}; DS.fuseCands(save).forEach(function (c) { cand[c.key] = 1; });
  for (var i = 0; i < ids.length; i++) {
    var w = DS.pByKey(save, ids[i]), k = DS.pKey(save, w); if (!w) return { ok: false, why: '찾을 수 없는 사람이 있다' };
    if (seen[k]) return { ok: false, why: '같은 사람을 두 번 골랐다' }; seen[k] = 1;
    if (!cand[k]) return { ok: false, why: DS.whoHouse(save, w) && (w === DS.heroPs(save) || w.h) ? '7단 Lv10이 아닌 가주가 있다' : '가주만 합일한다' };
    var h = DS.whoHouse(save, w); if (!h || hs[h.id]) return { ok: false, why: '서로 다른 세 가문의 가주를 고른다' }; hs[h.id] = 1;
  }
  if (!save.crest) return { ok: false, why: '맹세의 깃대가 없다' };
  var rep = opt && opt.rep != null ? +opt.rep : null, lock = DS.fuseRepLock(save, ids.map(function (k) { return DS.pByKey(save, k); }));
  if (rep != null && !hs[rep]) return { ok: false, why: '대표 가문은 고른 셋 가운데서 정한다' };
  if (rep != null && lock && rep !== lock.id) return { ok: false, why: '맹주가 들면 맹주 가문이 대표다' };
  return { ok: true, why: '' };
};
DS.fuseProg = function (save) {
  var pool = DS.fusePool(save), ready = pool.filter(function (c) { return c.L >= DS.FUSE_MIN; });
  var need = function (c) { var n = 0; for (var L = c.L; L < DS.FUSE_MIN; L++) n += DS.expNeed(L) - (L === c.L ? Math.min(c.exp || 0, DS.expNeed(L)) : 0); return n; };
  var low = pool.filter(function (c) { return c.L < DS.FUSE_MIN; }).sort(function (a, b) { return (b.dep ? 1 : 0) - (a.dep ? 1 : 0) || need(a) - need(b) || b.L - a.L; });
  var done = DS.persons(save).filter(function (p) { return p.who.fz; }).length;
  return { ready: ready, n: Math.min(DS.FUSE_N, ready.length), of: DS.FUSE_N, low: low, pool: pool, crest: !!save.crest, ok: ready.length >= DS.FUSE_N && !!save.crest, can: pool.length >= DS.FUSE_N, unions: +save.fuN2 || 0, fused: done, shut: DS.fzShutList(save).length };
};
// 옛 묶음 기록(가문 셋의 대가문)은 없어졌다 — 옛 호출이 읽어도 비어 있게
DS.fuseUnions = function (save) { if (save) save.fuU = []; return []; };
DS.unionOf = function () { return null; };
DS.unionName = function () { return ''; };
DS.fuseState = function (save, fam) { return { done: false, have: [], miss: [], low: [], ok: false }; };
DS.FUSE_HX = 1000;
DS.FUSE_LS = 30; DS.FUSE_LS_MAX = 80;      // 2.2.9: 합일한 넋은 오래 산다 — 대표의 수명이 30년에 흡수된 두 가주의 남은 해를 더한 만큼 늘어난다 (많아야 80년, 나이는 그대로)
DS.houseCmp = function (a, b) { return (+(b && b.hx) || 0) - (+(a && a.hx) || 0) || DS.hRank(b) - DS.hRank(a) || (a ? a.id : 0) - (b ? b.id : 0); };      // 공훈 → 계급 → 합류 차례
DS.houseOrd = function (a, b) { return DS.hRank(b) - DS.hRank(a) || (a ? a.id : 0) - (b ? b.id : 0); };      // 2.2.3: 보이는 차례 (부대 격자 · 칩 줄 · 결과 창) — 공훈 계급 → 합류 차례. 싸울 때마다 바뀌는 공훈 점수로는 줄을 섞지 않는다
DS.houseSort = function (save, list) { return (list || DS.charList(save)).slice().sort(DS.houseOrd); };
// ── 합일로 잠든 가문 (세대가 바뀌면 깨어난다) ──
DS.genNow = function (save) { return DS.egGen ? DS.egGen(save) : Math.max(1, +(save && save.eg && save.eg.gen) || 1); };
DS.fzShutFix = function (save) {      // 저장 칸 다듬기: { 병과: { g, t, by, rep, n } } — 이미 선 가문의 병과 · 모르는 병과는 지운다
  var z = save && save.fzShut; if (!z || typeof z !== 'object' || Array.isArray(z)) { if (save) delete save.fzShut; return {}; }
  for (var k in z) { var C = DS.CLASSES[k]; if (!Object.prototype.hasOwnProperty.call(DS.CLASSES, k) || !C || C.master || !z[k] || typeof z[k] !== 'object' || DS.hasClass(save, k)) { delete z[k]; continue; } z[k].g = Math.max(1, Math.round(+z[k].g || 1)); }
  return z;
};
DS.fzShut = function (save, cls) { var z = save && save.fzShut, e = z && Object.prototype.hasOwnProperty.call(z, cls) ? z[cls] : null; return !!(e && !e.woke && e.g >= DS.genNow(save) && !DS.hasClass(save, cls)); };      // 지금 잠들어 있는가
DS.fzLow = function (save) { return !!(save && save.chars) && DS.charList(save).length < DS.FUSE_N; };      // 2.2.9: 선 가문이 셋 밑 — 다시 합일할 수 없다 (잠든 가문이 일찍 깨어난다: 8단을 모두 잃으면 단 문턱을 넘지 못하던 막힘을 막는다)
DS.fzShutList = function (save) { var z = save && save.fzShut, out = []; if (z) for (var k in z) if (DS.fzShut(save, k)) out.push(k); return out; };
DS.fzWoke = function (save, cls) { var z = save && save.fzShut, e = z && Object.prototype.hasOwnProperty.call(z, cls) ? z[cls] : null; return !!(e && (e.woke || e.g < DS.genNow(save)) && !DS.hasClass(save, cls)); };      // 깨어났지만 아직 다시 열리지 않았다
// 세대가 바뀌었다: 잠든 가문이 깨어난다 (돌려주는 것: 깨어난 병과 목록 — 한 번만. 화면은 save.fzWake 를 연출로 읽고 비운다)
DS.fzWakeTick = function (save) {
  var z = save && save.fzShut, g = DS.genNow(save), out = []; if (!z) return out;
  var low = DS.fzLow(save);
  for (var k in z) if (z[k] && (z[k].g < g || low) && !z[k].woke && !DS.hasClass(save, k)) { z[k].woke = g; if (low && z[k].g >= g) z[k].early = 1; out.push(k); }
  if (out.length) save.fzWake = (save.fzWake || []).concat(out).filter(function (k, i, a) { return a.indexOf(k) === i; });
  return out;
};
DS.fuseLsGain = function (save, who, repId) {      // 미리 보기: 대표가 받는 수명 (년)
  var hp = DS.heroPs(save), H = DS.fuseRep(save, who, repId), add = 0;
  (who || []).forEach(function (w) { if (!w || DS.whoHouse(save, w) === H || !DS.ageLife) return; var L0 = DS.ageLife(save, w === hp ? save.chars[save.hero] : w); if (L0 && L0.left != null) add += Math.max(0, Math.round(L0.left)); });
  return Math.min(DS.FUSE_LS_MAX, DS.FUSE_LS + add);
};
// 합일: ids = 사람 열쇠 셋 (가주). opt.rep = 대표 가문 번호. 돌려주는 것: 대표 가주. DS.lastFuse = { ids, who, names, rep, repWho, gone: [{ cls, name, hid }] … }
DS.fuse = function (save, ids, opt) {
  ids = (ids || []).slice(); opt = opt || {};
  if (!DS.fuseOk(save, ids, opt).ok) return null;
  var who = ids.map(function (k) { return DS.pByKey(save, k); }), hp = DS.heroPs(save), H = DS.fuseRep(save, who, opt.rep), keys = who.map(function (w) { return DS.pKey(save, w); });
  var nameOf = function (w) { return w === hp ? (save.chars[save.hero].name || save.name || '맹주') : (w.ttl || w.n || ''); };
  var names = who.map(nameOf), houses = who.map(function (w) { return DS.whoHouse(save, w); }), ri = houses.indexOf(H), rw = who[ri], gen = DS.genNow(save);
  var trio = [names[ri]].concat(names.filter(function (n, i) { return i !== ri; }));
  rw.L = Math.max(DS.pL(rw), 71); rw.exp = 0; rw.fz = 1; rw.fu3 = trio.slice(); rw.fuG = gen;
  if (H) H.dae = gen;      // 2.6.4: 대표 가문은 이번 세대 동안 「大 ○○ 가문」
  // 두 넋의 남은 해: 대표의 수명이 FUSE_LS(30)년에 흡수된 두 가주가 살 해를 더한 만큼 는다 (수명 +N년 — 나이는 그대로). 맹주는 대장 줄(ch.ls)에, 가주는 그 사람(m.ls)에
  var lsAdd = 0; who.forEach(function (w, i) { if (i === ri || !DS.ageLife) return; var e = w === hp ? save.chars[save.hero] : w, L0 = DS.ageLife(save, e); if (L0 && L0.left != null) lsAdd += Math.max(0, Math.round(L0.left)); });
  lsAdd = Math.min(DS.FUSE_LS_MAX, DS.FUSE_LS + lsAdd);
  var re = rw === hp ? save.chars[save.hero] : rw;
  if (lsAdd > 0 && re && +re.ls > 0) { re.ls = Math.round(+re.ls) + lsAdd; delete re.eld; var rp0 = re.pid && save.lin && save.lin.P && save.lin.P[re.pid]; if (rp0) rp0.ls = re.ls; }
  if (H) { if (DS.hAdd) DS.hAdd(save, H, DS.FUSE_HX); else H.hx = (+H.hx || 0) + DS.FUSE_HX; }
  var gone = [], z = save.fzShut = save.fzShut && typeof save.fzShut === 'object' && !Array.isArray(save.fzShut) ? save.fzShut : {};
  houses.forEach(function (h, i) {
    if (h === H || !h) return;
    var w = who[i];
    ['w', 'a'].forEach(function (sl) { var id = h[sl]; if (id) { save.gear[id] = (save.gear[id] || 0) + 1; h[sl] = null; } });      // 든 장비는 가방으로
    if (w.it && DS.giveMercItem) DS.giveMercItem(save, w.id, null);      // 든 물건은 소지품으로
    gone.push({ cls: h.cls, name: names[i], hid: h.id, m: w, hx: +h.hx || 0 });
    DS.loseMerc(save, w.id);
    z[h.cls] = { g: gen, t: Math.round(+save.time || 0), by: H ? H.cls : '', rep: names[ri], n: names[i] };
    delete save.chars[h.id];
    save.party = (save.party || []).filter(function (id) { return id !== h.id; });
    if (Array.isArray(save.sortie)) save.sortie = save.sortie.filter(function (e) { return e && e.h !== h.id; });
  });
  if (DS.mercTidy) DS.mercTidy(save);
  DS.pSync(save);
  if (DS.sortieFix) { var hold = DS.sortieHold; DS.sortieHold = null; try { DS.sortieFix(save); } finally { DS.sortieHold = hold; } }
  if (DS.partySync) DS.partySync(save);
  DS.lastFuse = { ls: lsAdd, ids: keys, who: who, names: names, trio: trio, id: keys[ri], name: '', union: null, mercsBack: 0, over: 0, rep: H ? H.id : 0, repCls: H ? H.cls : '', repWho: rw, repName: H ? DS.flagName(H.cls, save) : '', hx: H ? DS.FUSE_HX : 0, moved: 0, succ: [], gone: gone, gen: gen };
  save.fuN2 = (+save.fuN2 || 0) + 1;
  return rw;
};
DS.fuseJoinable = function () { return null; };
DS.fuseJoin = function () { return null; };
// 봇·시험용: 후보에서 셋씩 차례로. opt.pick(cands) → 고른 열쇠 셋 (없으면 출전한 이 먼저), opt.rep(save, keys) → 대표 가문 번호. 돌려주는 것: 합일한 수
DS.fuseAuto = function (save, max, opt) {
  var n = 0; max = max == null ? 99 : max; opt = opt || {};
  while (n < max) {
    var cs = DS.fuseCands(save); if (cs.length < DS.FUSE_N || !save.crest) break;
    var c = opt.pick ? opt.pick(cs) : cs.sort(function (a, b) { return (b.dep ? 1 : 0) - (a.dep ? 1 : 0) || (b.role === 'hero') - (a.role === 'hero'); }).map(function (x) { return x.key; }).slice(0, DS.FUSE_N);
    if (!c || c.length < DS.FUSE_N) break;
    var rep = opt.rep ? opt.rep(save, c) : null;
    if (!DS.fuse(save, c.slice(0, DS.FUSE_N), rep != null ? { rep: rep } : null)) break; n++;
  }
  return n;
};
// ⑮ 옛 저장의 합일 마스터 → 원래 세(네) 깃발로: 각각 마스터의 레벨 그대로(8단이면 8단, 9단이면 9단). 마스터 줄의 번호·장비·사람 칸은 대표 깃발(rep)이 잇고, 나머지는 빈 손의 새 줄.
//   rep = 대장 깃발이면 주인공 병과(보병·법사)의 줄, 아니면 opt.rep(합일체를 든 사람의 원래 병과) 또는 첫 깃발. 돌려주는 것: { rep, rows: [새 줄] }
DS.unfuse = function (save, ch, rep) {
  var C = DS.CLASSES[ch.cls], F = C && C.master ? DS.FAMILY[C.fam] : null; if (!F) return null;
  var hero = ch.id === save.hero, have = {}; DS.charList(save).forEach(function (c) { have[c.cls] = 1; });
  var hb = save.lin && F.members.indexOf(save.lin.hs) >= 0 && !have[save.lin.hs] ? save.lin.hs : null;      // r44: 대장 병과(맹주 가문 문장의 병과)가 그 묶음에 있으면 그 줄
  if (!rep || F.members.indexOf(rep) < 0 || have[rep]) rep = hero ? (hb || F.members.filter(function (k) { return k === 'inf' || k === 'mag'; })[0] || F.members[0]) : F.members[0];
  var rows = [];
  ch.cls = rep;
  F.members.forEach(function (k) {
    if (k === rep || have[k]) return;
    var n = { id: save.nid++, cls: k, L: ch.L, exp: 0, w: null, a: null, mp: 1 };
    save.chars[n.id] = n; rows.push(n);
  });
  ['w', 'a'].forEach(function (sl) {      // 대표 깃발이 입을 수 없는 마스터 장비는 입을 수 있는 형제 깃발에, 그래도 없으면 가방으로 (잃지 않는다 — 2.1.0 부터는 누구나 입어 그대로 남는다)
    var id = ch[sl]; if (!id || DS.canEquip(ch, id)) return; ch[sl] = null;
    var to = rows.filter(function (n) { return !n[sl] && DS.canEquip(n, id); })[0];
    if (to) to[sl] = id; else save.gear[id] = (save.gear[id] || 0) + 1;
  });
  return { rep: ch, rows: rows };
};
// ───────── 권장 레벨 (표시용 — 적의 레벨 s.L 은 그대로) ─────────
// 2.2.3: 모든 「권장」은 잰 값 하나에서 나온다 — DS.REC (data.js, tools/calib.js 가 봇이 닿은 진짜 부대로 잰 표). 화면 · 봇 · 갱도가 같은 함수를 읽어 어긋나지 않는다.
//   권장(rec) = 열에 여덟 넘게 이기고, 이길 때 쓰러지는 이가 하나 이하인 부대 평균 레벨 · 반반(half) = 이길 확률이 반인 레벨.
//   시나리오 = 표의 번호 · 들판 = 표의 지역 [약한 무리, 센 무리] · 갱도 층 = 적 레벨로 잇는 식(DS.REC.pit) · 그 밖(다음 세대의 장 등) = 시나리오 점들을 적 레벨로 잇는다
var recPts = null;
function recLine(L, k) {      // 시나리오 표의 (적 레벨 → 권장 · 반반) 점들 사이를 잇는다. k: 0 권장 · 1 반반
  if (!recPts) { recPts = []; (DS.SCENARIOS || []).forEach(function (s) { var r = DS.REC.scn[s.id]; if (r) recPts.push([s.L, r[0], r[1]]); }); recPts.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }); }
  if (!recPts.length) return L;
  var c = k ? 2 : 1;
  if (L <= recPts[0][0]) return Math.max(1, Math.min(L, recPts[0][c]));
  for (var i = 1; i < recPts.length; i++) { var a = recPts[i - 1], b = recPts[i]; if (L <= b[0]) return Math.round(a[c] + (b[c] - a[c]) * (L - a[0]) / Math.max(1, b[0] - a[0])); }
  var z = recPts[recPts.length - 1]; return Math.min(100, Math.round(z[c] + (L - z[0]) * 0.5));
}
DS.recOfL = function (L) { return recLine(L, 0); };
DS.halfOfL = function (L) { return recLine(L, 1); };
DS.pitRec = function (f) {      // 갱도 층: [권장, 반반, 넘침(100 을 넘는 힘 — 「이상」)]
  var P = DS.REC.pit, L = DS.pitL(f), k = DS.pitK(f), kd = DS.pitKind(f), x = L + (kd === 10 ? P.b10 : kd === 5 ? P.b5 : 0);
  var r = P.a + P.b * x + P.over * (k - 1) * 100, h = r - P.half;
  return [Math.max(1, Math.round(r)), Math.max(1, Math.round(h)), r > 100.5];
};
function recPair(s) {
  if (!s) return [1, 1, false];
  if (s.pit) return DS.pitRec(s.pit);
  if (!s.gen && DS.REC.scn[s.id]) { var t = DS.REC.scn[s.id]; return [t[0], t[1], false]; }
  return [DS.recOfL(s.L), DS.halfOfL(s.L), false];
}
// 시나리오(또는 갱도 층)의 권장 레벨: 부대 평균 레벨 기준 숫자 (100 넘는 갱도 층은 100)
DS.recL = function (s) { return Math.min(100, recPair(s)[0]); };
DS.recHalf = function (s) { return Math.min(100, recPair(s)[1]); };
DS.recSafe = function (s) { var t = s && !s.pit && !s.gen && DS.REC.scn[s.id]; return t && t[2] ? t[2] : DS.recL(s); };      // 안전: 열 번 다 이기고 쓰러지는 이가 드문 레벨 (봇 · 조심스러운 사람)
DS.recText = function (s) { var p = recPair(s); return '권장 ' + DS.lvText(Math.min(100, p[0])) + (p[2] ? ' 이상' : ''); };
// 들판: [권장 낮은 끝, 높은 끝] (약한 무리 · 센 무리를 안전하게) · 반반은 센 무리 쪽
DS.zoneRec = function (id) { var z = DS.REC.zone[id], Z = DS.ZONES && DS.ZONES[id]; if (z) return [z[0], z[1]]; return Z && Z.L ? [DS.recOfL(Z.L[0]), DS.recOfL(Z.L[1])] : [1, 1]; };
DS.zoneHalf = function (id) { var z = DS.REC.zone[id], Z = DS.ZONES && DS.ZONES[id]; return z ? z[2] : Z && Z.L ? DS.halfOfL(Z.L[1]) : 1; };
// 입구 창 · 갱도 창의 「이 부대에게 얼마나 어려운가」: 반반 아래 = 위험(붉은 꼬리표) · 권장 아래 = 권장 미달(이기기는 해도 잃을 수 있다) · 안전 레벨(갱도는 권장 + DS.REC.easy) 이상 = 여유
DS.recTag = function (save, s) {
  var pl = DS.partyL(save), r = DS.recL(s), h = DS.recHalf(s), ov = recPair(s)[2];
  if (pl < h || (ov && pl >= 100 && DS.pitK(s.pit) > 1.2)) return { k: 'risk', tag: '위험', cls: 'warn', tc: '' };
  if (pl < r) return { k: 'low', tag: '권장 미달', cls: 'warn', tc: 'soft' };
  if (!ov && pl >= (s && !s.pit && !s.gen && DS.REC.scn[s.id] ? Math.max(r + 1, DS.recSafe(s)) : r + DS.REC.easy)) {
    // 2.6 (표시만): 「여유」는 가주 셋이 나갈 때 잰 값이다 — 나가는 가주가 셋보다 적으면 붙이지 않는다 (맹주 혼자면 「여유」 레벨에서도 1 · 2번은 체력이 35% 아래로 내려가고 3~6번은 열에 다섯도 못 이긴다)
    var nc = 3; try { nc = DS.partySpecs ? DS.partySpecs(save).filter(function (u) { return u.role === 'cmd'; }).length : 3; } catch (e) { nc = 3; }
    if (nc < 3) return { k: 'ok', tag: '', cls: '', tc: '' };
    return { k: 'easy', tag: '여유', cls: '', tc: 'ok' };
  }
  return { k: 'ok', tag: '', cls: '', tc: '' };
};
// 입구 창의 「권장보다 낮습니다」 경고 줄 (자동 전투 · 퇴각 안내): 반반 아래일 때
DS.recLow = function (save, s) { return DS.partyL(save) < DS.recHalf(s); };
// 갱도: 열린 다음 층 · 되풀이해 다지기 알맞은 가장 깊은 층(권장 + REC.farm ≤ 평균, 열린 층 안에서 — 길 안내 · 봇)
DS.pitNext = function (save) { return Math.min(DS.PIT.max, (+(save && save.pitBest) || 0) + 1); };
DS.pitFarm = function (save) { var pl = DS.partyL(save) - DS.REC.farm, nx = DS.pitNext(save), f = 0; for (var i = 1; i <= nx; i++) { if (DS.pitRec(i)[0] <= pl) f = i; else if (i > f + 12) break; } return f; };      // 되풀이해 다질 층: 권장 + REC.farm 레벨이 넘는 층 (열에 둘은 누가 쓰러지는 권장 층을 수백 번 돌면 사람을 잃는다)

// ───────── 현상 수배 (20번 뒤 합일 준비 구간의 목표) ─────────
// save.bty = { list: [현상금…], n: 달성 수, seq: 다음 번호 }. 현상금 = { id, k: 'hunt'|'elite'|'sweep', z: 지역, t: 적 종류, n: 필요 수, c: 센 수, L, r: 보상 {…}, … }
// 진행은 처치마다(loot.js 의 DS.rollDrop 이 DS.bountyHit 을 부른다) — 화면·봇이 이미 처치마다 rollDrop 을 부르므로 따로 훅이 필요 없다.
function hasOwn(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function btyOn(save) { return !!(save && DS.BTY.mul > 0 && save.cleared && save.cleared[DS.BTY.from]); }
function btxt(k, f) { var L = DS.LORE && DS.LORE.bounty && DS.LORE.bounty[k]; return (L && typeof L[f] === 'string' && L[f]) || ''; }      // 2.4.1: 글은 lore.js 한 곳에만 (가려져 쓰이지 않던 data.js 의 옛 기본 글을 걷었다)
function fill(t, b) { return String(t).replace(/\{zone\}/g, (DS.ZONES && DS.ZONES[b.z] && DS.ZONES[b.z].name) || b.z).replace(/\{mob\}/g, (DS.ENEMIES[b.t] || {}).name || '적').replace(/\{n\}/g, b.n).replace(/\{name\}/g, b.name || ''); }
// 갈 수 있는 필드(가 본 곳)를 부대 평균 레벨에 가까운 쪽으로 고른다
function btyZones(save) {
  var T = DS.partyL(save), out = [];
  Object.keys(DS.ZONES || {}).forEach(function (id) {
    var Z = DS.ZONES[id]; if (Z.town || !Z.L || !Z.mobs || !save.visited[id]) return;
    var d = T < Z.L[0] ? Z.L[0] - T : T > Z.L[1] ? T - Z.L[1] : 0;
    out.push({ id: id, d: d, Z: Z });
  });
  out.sort(function (a, b) { return a.d - b.d; });
  return out.filter(function (o, i) { return i < 2 || o.d <= 10; });
}
var zoneCache = {};
function zoneOf(id) { if (!zoneCache[id] && DS.buildZone) { try { zoneCache[id] = DS.buildZone(id); } catch (x) { zoneCache[id] = null; } } return zoneCache[id]; }
// 가장 처진 출전 지휘관 (보상 장비의 주인 — 드랍 목표)
function laggard(save) { var w = null; save.party.forEach(function (id) { var c = save.chars[id]; if (c && (!w || c.L < w.L)) w = c; }); return w || DS.charList(save)[0]; }
DS.bountyRoll = function (save, kind, rnd) {
  rnd = rnd || Math.random;
  var st = save.bty, Z = btyZones(save); if (!Z.length) return null;
  var have = st.list.map(function (b) { return b.k + ':' + b.z; }), pick = null;
  for (var tries = 0; tries < 8 && !pick; tries++) { var o = Z[Math.floor(rnd() * Math.min(Z.length, 3))]; if (have.indexOf(kind + ':' + o.id) < 0 && !(kind === 'elite' && st.list.some(function (b) { return b.k === 'elite' && b.z === o.id; }))) pick = o; }
  if (!pick) return null;
  var B = DS.BTY, z = pick.Z, mid = Math.round((z.L[0] + z.L[1]) / 2), T = Math.max(z.L[0], Math.min(z.L[1], DS.partyL(save))), b = { id: st.seq++, k: kind, z: pick.id, c: 0, L: T };
  var who = laggard(save), G = who && DS.CLS_GEAR[who.cls], cats = G ? G.w.concat(G.a) : null;
  if (kind === 'hunt' || kind === 'sweep') {
    var P = B[kind]; b.n = P.n[0] + Math.floor(rnd() * (P.n[1] - P.n[0] + 1));
    b.t = z.mobs[Math.floor(rnd() * z.mobs.length)];
    b.r = { gold: Math.round(DS.killGoldL(T) * P.gold * b.n / 100) * 10 };      // r12: 레벨은 처치 골드 곡선(DS.killGoldL)으로
    if (kind === 'hunt' && cats) { b.r.cat = cats[Math.floor(rnd() * cats.length)]; b.r.grade = P.grade; b.r.who = who.id; }
    if (kind === 'sweep') b.r.item = 1;
  } else {      // 정예: 그 지역 무리 하나(부대 평균에 가까운 레벨)를 골라 우두머리를 세운다
    var zz = zoneOf(pick.id), sp = zz && zz.spawns && zz.spawns.slice().sort(function (a, c) { return Math.abs(a.L - T) - Math.abs(c.L - T); })[Math.floor(rnd() * 3)];
    if (!sp || !sp.list || !sp.list.length) return null;
    var tl = (DS.LORE && DS.LORE.bounty && DS.LORE.bounty.titles) || ['이름난'];
    b.g = sp.id; b.gn = sp.list.length; b.t = sp.list[0]; b.L = sp.L; b.n = 1; b.x = sp.x; b.y = sp.y;
    b.name = tl[Math.floor(rnd() * tl.length)] + ' ' + DS.ENEMIES[b.t].name;
    b.r = { gold: Math.round(DS.killGoldL(sp.L) * B.elite.gold / 10) * 10, grade: B.elite.grade, ticket: B.elite.ticket, cat: cats ? cats[Math.floor(rnd() * cats.length)] : null, who: who ? who.id : 0 };
  }
  st.list.push(b);
  return b;
};
// 저장의 게시판을 챙기고(없으면 만든다) 빈자리를 채운다. 20번 전에는 비어 있다
DS.bountyState = function (save, rnd) {
  if (!save) return null;
  if (!save.bty || typeof save.bty !== 'object' || !(save.bty.list instanceof Array)) save.bty = { list: [], n: 0, seq: 1 };
  var st = save.bty;
  st.list = st.list.filter(function (b) { return b && (b.k === 'hunt' || b.k === 'elite' || b.k === 'sweep') && b.r && typeof b.r === 'object' && +b.n >= 1 && DS.ZONES && hasOwn(DS.ZONES, b.z) && hasOwn(DS.ENEMIES, b.t); });      // 보상 칸(r)이 없으면 게시판·달성 처리가 넘어진다
  st.n = Math.max(0, Math.round(+st.n || 0)); st.sh = Math.max(0, Math.round(+st.sh || 0)); st.seq = Math.max(1, Math.round(+st.seq || 1));
  st.list.forEach(function (b) { b.c = Math.max(0, +b.c || 0); if (+b.id >= st.seq) st.seq = +b.id + 1; });
  if (!btyOn(save)) return st;
  var kinds = ['hunt', 'elite', 'sweep'], guard = 0;
  while (st.list.length < DS.BTY.slots && guard++ < 6) {
    var miss = kinds.filter(function (k) { return !st.list.some(function (b) { return b.k === k; }); }), k = miss.length ? miss[0] : kinds[guard % 3];
    if (!DS.bountyRoll(save, k, rnd)) { if (!DS.bountyRoll(save, 'hunt', rnd)) break; }
  }
  return st;
};
// 화면용 목록: [{ id, kind, title, line, zone, zoneName, need, have, reward(글), who(보상 장비의 주인 이름) }]
DS.bountyList = function (save) {
  var st = DS.bountyState(save); if (!st || !btyOn(save)) return [];
  return st.list.map(function (b) {
    var r = [], who = b.r.who && save.chars[b.r.who];
    if (b.r.gold) r.push(b.r.gold.toLocaleString() + '골드');
    if (b.r.grade) r.push((b.r.grade >= 5 ? '전설' : '유니크') + ' ' + (b.r.cat && DS.GEAR_CAT[b.r.cat] ? DS.GEAR_CAT[b.r.cat].name : '장비') + (who ? ' (' + DS.charName(who) + ')' : ''));
    if (b.r.ticket) r.push('모집권 ' + b.r.ticket);
    if (b.r.item) r.push('소모품');
    return { id: b.id, kind: b.k, title: fill(btxt(b.k, 'title'), b), line: fill(btxt(b.k, 'line'), b), zone: b.z, zoneName: (DS.ZONES[b.z] || {}).name || b.z,
             need: b.n, have: b.c, reward: r.join(', '), who: who ? DS.charName(who) : '', x: b.x, y: b.y };
  });
};
// 깃술 조각: { have, need, next: 다음에 받을 전설 장비 이름 또는 '' } — 2.1.0: 옛 깃술 유물 대신 아직 없는 전설 장비 (loot.js DS.legNext)
function flagPick(save) { return DS.legNext ? DS.legNext(save, save.zone) : null; }
DS.bountyShard = function (save) {
  var st = save && save.bty, id = save && flagPick(save), g = id && DS.gear(id);
  return { have: (st && st.sh) || 0, need: DS.BTY.shard.need, next: g ? g.short : '' };
};
// 조각이 다 모였으면 전설 장비 식별자를 돌려준다 (가방에 넣기·보호 부적은 loot.js DS.bountyReward 가 한다). 남은 전설이 없으면 골드를 주고 null
DS.bountyFlag = function (save) {
  var st = save && save.bty; if (!st || (st.sh || 0) < DS.BTY.shard.need) return null;
  st.sh -= DS.BTY.shard.need;
  var id = flagPick(save);
  if (id) return id;
  save.gold += 5000; return null;
};
// 출몰 중인 지역의 드랍 배율 (kind: 'drop')
DS.bountyMul = function (save, zone, kind) {
  if (!btyOn(save) || !save.bty) return 1;
  var on = save.bty.list.some(function (b) { return b.k === 'sweep' && b.z === zone; });
  return on ? DS.BTY.sweep.drop : 1;
};
// 처치 하나를 센다. e = 엔진의 reward 이벤트 (+ zone). 달성한 현상금 목록을 돌려준다 (보상은 이미 save 에 들어감 — 장비는 DS.bountyReward 가 있으면 그것이 준다)
DS.bountyHit = function (save, e, rnd) {
  var done = [];
  if (!btyOn(save) || !e || e.sum || e.boss || e.mode === 'scn' || (DS.G && DS.G.scn && DS.G.save === save)) return done;
  var st = DS.bountyState(save, rnd), zone = e.zone || save.zone;
  st.list.forEach(function (b) {
    if (b.z !== zone) return;
    if (b.k === 'hunt' && e.type === b.t) b.c++;
    else if (b.k === 'sweep') b.c++;
    else if (b.k === 'elite' && (e.elite === b.id || (e.elite == null && e.type === b.t && b.gm && e.gold === b.gm))) b.c++;
    if (b.c >= b.n) done.push(b);
  });
  done.forEach(function (b) {
    st.list.splice(st.list.indexOf(b), 1); st.n++;
    st.sh = (st.sh || 0) + (b.k === 'elite' ? DS.BTY.shard.elite : 1);      // 깃술 조각 (모이면 DS.bountyFlag 가 전설 장비로 바꾼다)
    save.gold += b.r.gold || 0;
    if (b.r.ticket) save.tickets = (save.tickets || 0) + b.r.ticket;
    var mer = DS.BTY.merit + (b.k === 'elite' ? DS.BTY.elite.merit : 0);      // r42: 싸우는 가문 모두의 공훈 (2.2.0: 가솔이 없어 가문마다 두 몫)
    save.party.forEach(function (id) { var hc = save.chars[id]; if (hc && DS.hAdd) DS.hAdd(save, hc, mer * 2); });
    b.title = fill(btxt(b.k, 'title'), b);
  });
  if (done.length) DS.bountyState(save, rnd);
  return done;
};
// 정예 무리: 걸려 있는 정예 현상금의 그 지역·그 무리를 부를 때 우두머리(무리의 첫째)와 정예들로 만든다. 경험치는 보통 적과 같다 (경험치를 올리지 않는다)
var es0 = DS.enemySpec, eliteN = {};
DS.enemySpec = function (type, L, o) {
  var u = es0(type, L, o);
  o = o || {};
  if (o.boss || o.grp == null || o.expMul != null) return u;
  var sv = o.save || (DS.G && DS.G.save), zone = o.zone || (DS.G && DS.G.zone && !DS.G.scn && DS.G.zone.id);      // 자동 플레이(campaign.js)는 o.zone·o.save 로 넘긴다
  if (!sv || !zone || !sv.bty || !btyOn(sv)) return u;
  var b = sv.bty.list.filter(function (x) { return x.k === 'elite' && x.z === zone && x.g === o.grp; })[0];
  if (!b) return u;
  var key = zone + ':' + b.id, i = (eliteN[key] = (eliteN[key] || 0) + 1) - 1, E = DS.BTY.elite, M = i % (b.gn || 1) === 0 ? E.boss : E.crew;
  u.hp = u.mhp = Math.round(u.hp * M.hp); u.atk = Math.round(u.atk * M.atk); u.mag = Math.round(u.mag * M.atk);
  if (M.def) { u.def = Math.round(u.def * M.def); u.res = Math.round(u.res * (M.res || M.def)); }
  u.gold = Math.round(u.gold * M.gold);
  if (M === E.boss) { u.name = b.name; u.elite = b.id; u.title = '현상금'; b.gm = u.gold; }
  else { u.name = '정예 ' + u.name; u.eliteCrew = b.id; }
  return u;
};
})();
