// 전민 — 이름 부르기 (싸움마다 한 번): 먼저 간 이의 이름을 부르면 그 사람의 그림자가 잠깐 와서 같이 싸운다.
//   경전 §1 「사람은 두 번 죽는다 … 아무도 그 이름을 부르지 않을 때」 · §10 먼저 간 사람들(DS.storyDead) · 30번 이름 부르기(DS.ERASE_TXT)와 같은 말.
//   규칙: 출전(시나리오 · 다음 세대의 장 · 갱도)에서만, 한 싸움에 한 번. 들판(필드 보스 포함) · 연무장 · 무술대회 · 온라인에는 없다.
//     부를 이름 = 싸움이 시작될 때 이번 대에 먼저 간 이들(DS.storyDead) 가운데 병과를 알 수 있는 셋까지. 그 싸움에서 쓰러진 이는 그 싸움에서 부르지 못한다.
//     그림자: 그 사람의 병과 · 기록의 레벨(부대 평균과 7단 Lv10 을 넘지 않는다)의 기본 장비 능력치 × SHADE.k (체력은 × SHADE.hk), SHADE.dur 초 뒤 걷힌다. 적은 산 사람을 먼저 노린다 (SHADE.shun).
//     치유 · 가호를 받지 않고(엔진 friends · heal) · 이름 지우기 대상이 아니고(가주 · 가솔만) · 쓰러져도 죽음이 아니다(엔진 kill → shadeEnd: 걷힐 뿐).
//     경험치 · 공훈 · 전리품 · 추모 기록 · 가계 기록에 아무것도 남기지 않는다. 저장 칸은 늘지 않는다 (싸움마다의 것은 sim.shd).
//     자동: 부르는 이(맹주, 없으면 남은 가주)가 「자동」이면 가주가 위태롭거나(체력 SHADE.low 아래) 보스가 격노하면 스스로 부른다 (필살기와 같은 약속 — 「수동」이면 단추로만).
//   엔진 쪽(머리 없는 봇도 읽는다): DS.shadeArm · Sim.shadeCall · shadeEnd · aiShade · shadeTick. 화면 쪽: DS.shadeUI (game.js 가 단추 · 사건을 넘긴다).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
DS.SHADE = {
  dur: 12,        // 머무는 시간 (엔진 초)
  k: 0.7,         // 능력치 몫 (공격 · 마공 · 방어 · 마방)
  hk: 0.35,       // 체력 몫 (봇으로 재어 낮췄다 — 0.7 이면 위태로운 가주 곁에서 대신 맞아 주어 전멸이 눈에 띄게 줄었다)
  max: 3,         // 고를 수 있는 이름 수
  capL: 70,       // 레벨 상한 (7단 Lv10 — 합일한 이도 원래 병과의 모습으로 온다)
  fade: 0.9,      // 걷히는 그림 (화면 초)
  wait: 3,        // 싸움이 붙고 이만큼은 스스로 부르지 않는다
  low: 0.35,      // 자동: 가주(맹주 포함) 하나가 이 체력 아래면 부른다
  shun: 30,       // 적이 그림자를 덜 노리는 값 (pickTarget 점수 — 한 칸 = 10). 왕의 군대는 산 이름부터 노린다
  off: false
};
var T = DS.SHADE_TXT = {
  btn: '이름 부르기',
  head: '먼저 간 이의 이름을 부른다',
  sub: '한 싸움에 한 번. 그림자가 잠깐 같이 싸운다',
  none: '아직 부를 이름이 없다',
  used: '이름은 한 싸움에 한 번 부른다',
  gone: '그림자가 다녀갔다',
  noHere: '여기서는 이름을 부를 수 없다',
  erase: '지금은 산 이름부터 지킨다',
  nobody: '부를 사람이 없다',
  call: '{n}!',
  hint: '먼저 간 이를 부를 수 있다',
  hintLong: '이름 부르기: 먼저 간 이의 그림자가 잠깐 같이 싸운다. 한 싸움에 한 번',
  fade: ['…또 불러라.', '…또 불러라.', '…잊지 마라.'],
  down: '…여기까지다. 또 불러라.',
  // 마지막 한마디가 없거나 길면 가문의 말버릇으로 (경전 §5)
  house: { inf: '앞은 내가 선다.', cav: '장부에 달아 둬.', fly: '내가 더 높은 데 있어.', mar: '악! 복귀했다는 것이다!', pike: '교대하러 왔다.', arc: '실망시키지 마라.',
           cle: '일단 한 대 맞고요.', mon: '마음을 불태우십시오.', mag: '책에 나와요. 이 장면.', sha: '무덤보다 여기가 낫군.' },
  plain: '불렀나.',
  auto: '{h}, {n}의 이름을 불렀다'
};
// 가솔 종류 → 병과 (DS.mercTypes 가 없을 때의 기본)
var TYPE_CLS = { m_sword: 'inf', m_lancer: 'cav', m_griffin: 'fly', m_merman: 'mar', m_pike: 'pike', m_archer: 'arc', m_sister: 'cle', m_templar: 'mon', m_spirit: 'inf', m_skeleton: 'sha', m2_ogre: 'inf', m2_wyvern: 'fly', m2_ballista: 'arc', m2_abbess: 'mon' };
function baseCls(c) {
  var C = c && DS.CLASSES[c]; if (!C) return null;
  if (!C.master) return c;
  for (var k in DS.RISE_OF || {}) if (DS.RISE_OF[k] === c) return k;      // 윗길(xinf …) → 제 병과
  var F = DS.FAMILY && DS.FAMILY[C.fam]; return F ? F.members[0] : null;      // 옛 마스터 → 그 집안 첫 병과
}
function typeCls(t) {
  if (!t || !DS.MERCS[t]) return null;
  if (DS.mercTypes) for (var c in DS.CLASSES) { if (DS.CLASSES[c].master) continue; try { if (DS.mercTypes(c).indexOf(t) >= 0) return c; } catch (x) {} }
  return TYPE_CLS[t] || null;
}
// 이름 하나의 사람 기록: 추모 기록(save.fallen — 가장 나중 것) · 가계의 사람 줄(lin.P). 병과 · 레벨 · 필살기 씨앗
function lookup(s, n) {
  var fl = s.fallen || [], f = null, p = null, P = (s.lin && s.lin.P) || {}, i, id;
  for (i = fl.length - 1; i >= 0; i--) if (fl[i] && fl[i].n === n) { f = fl[i]; break; }
  if (f && f.pid && P[f.pid]) p = P[f.pid];
  if (!p) for (id in P) { var q = P[id]; if (!q || q.st !== 'dead') continue; var nm = q.ttl || (q.gv && DS.snName ? DS.snName(q.sn, q.n) : q.n); if (nm === n || q.n === n) { p = q; break; } }      // 읽기만 (DS.linName 은 사람 줄을 맞춰 고친다)
  var sn = (p && p.snap) || {}, cls = null, L = 0;
  if (f && f.f && s.chars && s.chars[f.f]) cls = s.chars[f.f].cls;      // 깃발을 들던 이: 그 가문의 병과
  if (!cls && p && p.d && p.d.fb && s.chars && s.chars[p.d.fb]) cls = s.chars[p.d.fb].cls;
  if (!cls && f && f.cast && DS.CLASSES[f.cast]) cls = f.cast;
  if (!cls && f && f.cls && DS.CLASSES[f.cls]) cls = f.cls;
  if (!cls && sn.cls && DS.CLASSES[sn.cls]) cls = sn.cls;      // 맹주였던 이 (가계 기록의 snap)
  if (!cls && p && p.cls && DS.CLASSES[p.cls]) cls = p.cls;
  if (!cls) cls = typeCls((f && f.type) || sn.type || (p && p.type));
  cls = baseCls(cls);
  L = +(f && f.L) || +sn.L || +(p && p.L) || 1;
  return cls ? { cls: cls, L: L, f: f, p: p, sn: sn } : null;
}
function hashOf(t) { var h = 7; t = String(t); for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h; }
function ultOf(r, n, L) {
  if (!DS.ULTS || !(L >= ((DS.ULT && DS.ULT.at) || 41))) return null;      // 필살기는 5단에 깨어난다 (게임 규칙 그대로)
  var who = r.f || r.sn, id = null, ok = function (k) { var U = k && DS.ULTS[k]; return !!U && (!U.cls || U.cls === r.cls); };
  if (who && DS.ultBorn) { try { id = DS.ultBorn(who); } catch (x) { id = null; } }      // 그 사람이 타고난 필살기
  if (id && DS.ultBaseOf) id = DS.ultBaseOf(id);
  if (ok(id)) return id;
  var pool = Object.keys(DS.ULTS).filter(function (k) { return DS.ULTS[k].cls === r.cls; });
  return pool.length ? pool[hashOf(n) % pool.length] : null;
}
// 부를 수 있는 이름 (무거운 차례 — DS.storyDead) · 병과를 알 수 없는 이는 뺀다
DS.shadeCands = function (s, max) {
  if (!s || !DS.storyDead) return [];
  var out = [], dd = []; try { dd = DS.storyDead(s, 12) || []; } catch (x) { dd = []; }
  for (var i = 0; i < dd.length && out.length < (max || DS.SHADE.max); i++) {
    var d = dd[i], r = null; try { r = lookup(s, d.n); } catch (x) { r = null; }
    if (!r) continue;
    out.push({ n: d.n, lw: String(d.lw || '').slice(0, 24), w: d.w, cls: r.cls, L: r.L, ult: ultOf(r, d.n, r.L), g: (r.f && r.f.g) || r.sn.g || (r.p && r.p.g) || (r.p && r.p.k === 'c' ? DS.CAST_G || 3 : 0), lord: !!(r.p && r.p.k === 'c'), gp: r.f && r.f.id ? 'm' + r.f.id : r.p && r.p.m ? 'm' + r.p.m : r.p ? 'p' + r.p.id : '' });      // 2.6.0 g · lord · gp: 이름 고르기의 등급 테 (떠난 이도 테 색은 그대로)
  }
  return out;
};
// 그림자 사양: 병과의 그 단 기본 장비 능력치 × k, 레벨은 기록 · 부대 평균 · capL 가운데 낮은 것 (그 병과가 서는 단 아래로는 내리지 않는다)
DS.shadeSpec = function (s, c, refL) {
  var C = DS.CLASSES[c.cls]; if (!C) return null;
  var S = DS.SHADE, k = S.k, hk = S.hk == null ? k : S.hk, L = Math.max(1, Math.min(+c.L || 1, refL || 1, S.capL)), L0 = ((C.start || 1) - 1) * (DS.LV_PER_TIER || 10) + 1;
  L = Math.max(L, L0);
  var t = DS.tierOfL(L), ref = { cls: c.cls, L: L }; DS.stdGear(ref, t);
  var st = DS.charStats(ref), sk = DS.charSkills(ref).filter(function (id) { var K = DS.SKILLS[id]; return K && !K.eff.some(function (e) { return e.t === 'summon'; }); });      // 부르기(망자 부름)는 빼고
  var u = { side: 'ally', role: 'shade', shade: 1, cls: c.cls, name: c.n, mn: c.n, L: L, tier: t, look: [c.cls, t],
    hp: Math.max(1, Math.round(st.hp * hk)), mp: st.mp, mmp: st.mp, atk: Math.round(st.atk * k), def: Math.round(st.def * k), mag: Math.round(st.mag * k), res: Math.round(st.res * k),
    spd: st.spd, mv: C.mv, mt: C.mt, rng: st.rng.slice(), atkKind: C.atk, dtype: C.dtype, kind: C.kind, tags: (C.tags || []).slice(), basic: C.basic || 1, passive: C.passive,
    skills: sk, crit: st.crit, drain: 0, life: S.dur, auto: true, shun: S.shun || 0 };
  u.mhp = u.hp;
  if (c.ult && DS.SKILLS[c.ult]) { u.ult = c.ult; u.uc = 100; u.ultP = 1; u.ultR = 1; }      // 필살기 한 번 (쓰면 거둔다 — aiShade)
  return u;
};
// 싸움 앞에 부를 이름을 단다 (출전만). 돌려주는 것: sim.shd 또는 null (이 싸움에는 이름 부르기가 없다)
DS.shadeArm = function (sim, s, o) {
  if (!sim) return null;
  sim.shd = null;
  if (DS.SHADE.off || !s || sim.mode !== 'scn' || (o && o.no)) return null;
  if (sim.units.some(function (u) { return u.arena; })) return null;      // 연무장 · 무술대회 (제 장면)
  var cands = DS.shadeCands(s), refL = DS.partyL ? DS.partyL(s) : 1;
  cands.forEach(function (c) { c.spec = DS.shadeSpec(s, c, refL); });
  sim.shd = { cands: cands.filter(function (c) { return !!c.spec; }), used: false, id: null, t0: null, n: 0 };
  return sim.shd;
};
DS.shadeOn = function (sim) { return !!(sim && sim.shd); };
DS.shadeLine = function (c) {      // 그림자가 와서 하는 한마디 (머리 위 16자 안쪽): 마지막 한마디 · 없거나 길면 가문 말버릇
  var lw = String((c && c.lw) || '');
  if (lw && Array.from(lw).length <= 16) return lw;
  return (c && T.house[c.cls]) || T.plain;
};

// ───────── 엔진 ─────────
var P = DS.Sim && DS.Sim.prototype; if (!P) return;
function dist(a, b) { return DS.fpDist ? DS.fpDist(a, b) : Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
// 부르는 이: 맹주 → 고른 사람(leader) → 남은 가주 (굳은 이는 부르지 못한다)
P.shadeCaller = function () {
  var h = this.erHero ? this.erHero() : null;
  if (h && !h.dead && h.side === 'ally' && h.role === 'cmd' && !h.erM) return h;
  var c = this.cmds().filter(function (u) { return !u.erM; }); return c[0] || null;
};
// 이름을 부른다: i = 고른 이름(차례), by = 부르는 이 id (없으면 shadeCaller). 돌려주는 것: 그림자 유닛 또는 null
P.shadeCall = function (i, by, auto) {
  var S = this.shd; if (!S || S.used || this.result || this._er) return null;
  var c = S.cands[i || 0]; if (!c || !c.spec) return null;
  var who = by && this.byId[by] && !this.byId[by].dead && this.byId[by].side === 'ally' && this.byId[by].role === 'cmd' ? this.byId[by] : this.shadeCaller(); if (!who) return null;
  var sp = {}, k; for (k in c.spec) sp[k] = c.spec[k];
  sp.rng = c.spec.rng.slice(); sp.tags = c.spec.tags.slice(); sp.skills = c.spec.skills.slice(); sp.id = 'sh' + (this.nid++);
  sp.x = who.x; sp.y = who.y;      // 부르는 이 곁의 빈 칸 (add 가 찾는다)
  var u = this.add(sp); if (!u) return null;
  S.used = true; S.id = u.id; S.at = this.t; S.who = i || 0; S.auto = !!auto; S.n++;
  u.aggro = true; u.gauge = 100; u.busy = 0.45; u.caller = who.id; u.face = who.face || 1;
  this.emit({ t: 'shade', id: u.id, n: c.n, lw: c.lw, cls: c.cls, by: who.id, auto: !!auto, i: i || 0 });
  return u;
};
// 걷힌다 (쓰러짐이 아니다): why = 'time' | 'down' | 'end'
P.shadeEnd = function (u, why) {
  if (!u || u.dead) return;
  var self = this;
  u.dead = true; u.fled = true; u.shadeGone = why || (u.life != null && u.life <= 0 ? 'time' : 'down'); u.deadT = this.t; u.hp = Math.max(0, u.hp); this.unplace(u); this._ver++;
  u.rsv = null; u.rsvU = false; u.ult = null;
  this.tele = this.tele.filter(function (t) { if (t.u === u) { self.emit({ t: 'castEnd', tid: t.id, cancel: true }); return false; } return true; });
  this.emit({ t: 'die', id: u.id, flee: true, fade: DS.SHADE.fade, shade: 1 });
  this.emit({ t: 'shadeEnd', id: u.id, why: u.shadeGone, n: u.name, cls: u.cls });
  this.reDanger();
};
// 그림자의 생각: 피하기 → 필살기 한 번 → 기술 → 평타. 싸울 상대가 없으면 부른 이 곁으로
P.aiShade = function (u) {
  if (this.dodge(u)) return;
  var foes = this.foes(u);
  if (!foes.length) {
    var own = this.byId[u.caller]; if (!own || own.dead) own = this.shadeCaller();
    if (own && dist(u, own) > 2 && this.goNear(u, own.x, own.y, 2, 40) !== 'here') return;
    this.wait(u, 0.25); return;
  }
  if (u.ult && (u.uc || 0) >= 100 && this.aiUlt(u, foes)) { u.ult = null; return; }
  if (u.skills.length && this.aiSkill(u, foes)) return;
  var v = this.pickTarget(u, foes);
  if (v) { this.engage(u, v, 1, this.reach(u), function () { return this.attack(u, v); }); return; }
  this.wait(u, 0.2);
};
// 자동: 부르는 이가 「자동」이고 싸움이 붙은 지 wait 초가 지났으면, 가주가 위태롭거나 보스가 격노할 때 가장 무거운 이름을 부른다 (tick 의 0.25초 점검에서)
P.shadeTick = function () {
  var S = this.shd; if (!S || S.used || !S.cands.length || this.result || this._er) return;
  if (!this.combat) return;
  if (S.t0 == null) S.t0 = this.t;
  if (this.t - S.t0 < DS.SHADE.wait || S.hold) return;
  var by = this.shadeCaller(); if (!by || !by.auto) return;
  var lo = DS.SHADE.low, want = this.cmds().some(function (c) { return c.hp < c.mhp * lo; });
  if (!want) for (var i = 0; i < this.units.length; i++) { var e = this.units[i]; if (!e.dead && e.side === 'enemy' && e.enraged) { want = true; break; } }
  if (want) this.shadeCall(0, by.id, true);
};

// ───────── 화면 (game.js 가 부른다) ─────────
if (typeof document === 'undefined') return;
function G() { return DS.G; }
function U() { return DS.ui || {}; }
function esc(t) { return U().esc ? U().esc(t) : String(t); }
function fill(t, o) { return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return o && o[k] != null ? o[k] : m; }); }
function A(n) { try { DS.Audio.sfx(n); } catch (x) {} }
// 단추의 지금 상태: '' = 부를 수 있다, 아니면 까닭
function why(sim) {
  var S = sim && sim.shd; if (!S) return T.noHere;
  if (S.used) return sim.byId[S.id] && !sim.byId[S.id].dead ? T.used : T.gone;
  if (!S.cands.length) return T.none;
  if (sim.result) return T.used;
  if (sim._er) return T.erase;
  if (!sim.shadeCaller()) return T.nobody;
  return '';
}
function pickOff() { var el = document.getElementById('shadepick'); if (el) el.remove(); var g = G(); if (g) g.shadePick = null; }
function pickOpen(b) {
  var g = G(), sim = g && g.sim; if (!sim || !sim.shd) return;
  pickOff();
  var sg = document.getElementById('s-game'); if (!sg) return;
  var el = document.createElement('div'); el.id = 'shadepick'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', T.head);
  el.innerHTML = '<p class="sph">' + esc(T.head) + '</p><small class="sps">' + esc(T.sub) + '</small><div class="spl">' + sim.shd.cands.map(function (c, i) {
    var C = DS.CLASSES[c.cls];
    var t = DS.tierOfL(Math.max(1, +c.L || 1)), por = DS.gfr && U().sprTag ? DS.gfr(c.g, U().sprTag(DS.lookName(c.cls, t), '', 1.5), { dead: 1, lord: c.lord, who: c.gp, cls: 's' }) : '';
    return '<button class="spn" data-i="' + i + '">' + por + '<b>' + esc(c.n) + '</b><small>' + esc((C ? C.name : '') + (c.lw ? ' · 「' + c.lw + '」' : '')) + '</small></button>';
  }).join('') + '</div><button class="spx" data-x="1" aria-label="닫기">' + (DS.icon ? DS.icon('close', 14) : '×') + '</button>';
  sg.appendChild(el); try { U().hydrate(el); } catch (x) {}
  var r = b && b.getBoundingClientRect ? b.getBoundingClientRect() : null, sr = sg.getBoundingClientRect();
  if (r) { el.style.bottom = Math.max(8, sr.bottom - r.top + 8) + 'px'; }
  el.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    DS.Audio.unlock && DS.Audio.unlock();
    if (t.dataset.x) { A('cancel'); pickOff(); return; }
    var i = +t.dataset.i; pickOff(); call(i);
  });
  g.shadePick = el; A('open');
}
function call(i) {
  var g = G(), sim = g && g.sim; if (!sim) return false;
  var w = why(sim); if (w) { A('deny'); if (U().toast) U().toast(w, 1600); return false; }
  var u = sim.shadeCall(i, null, false); if (!u) { A('deny'); return false; }
  if (g.pause && U().A) {}      // 멈춘 채로 불러도 된다 (멈춤이 풀리면 온다)
  return true;
}
DS.shadeUI = {
  // 아이템 줄에 넣을 단추 (출전에서만 — game.js renderActs)
  btn: function (into) {
    var g = G(); if (!g || !g.sim || !g.sim.shd) return null;
    var b = U().h('<button class="act item shade" data-it="shade" aria-label="' + esc(T.btn) + '">' + (DS.icon ? DS.icon('sk_lamp', 24) : '') + '<b class="nm">' + esc(T.btn) + '</b><span class="cnt num"><i class="n">1</i></span></button>');
    b.addEventListener('click', function () {
      DS.Audio.unlock && DS.Audio.unlock();
      var sim = g.sim, w = why(sim);
      if (w) { if (U().deny) U().deny(b, w === T.none ? '없음' : w === T.erase ? '지금은' : '한 번', w); else if (U().toast) U().toast(w, 1600); return; }
      if (g.shadePick) { pickOff(); A('cancel'); return; }
      pickOpen(b);
    });
    var lp = null; b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    b.addEventListener('pointerdown', function () { lp = setTimeout(function () { if (U().toast) U().toast(T.hintLong, 3500); }, 480); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { clearTimeout(lp); }); });
    into.appendChild(b);
    var e = { b: b, shade: true, n: b.querySelector('.n'), st: null };
    g.actEls.push(e);
    return e;
  },
  upd: function (e) {
    var g = G(), sim = g && g.sim; if (!sim) return;
    var w = why(sim), S = sim.shd, live = !!(S && S.used && sim.byId[S.id] && !sim.byId[S.id].dead), st = w ? (live ? 'live' : 'off') : 'on';
    if (live) { var su = sim.byId[S.id], cl = Math.max(0, Math.ceil(su.life || 0)); if (cl !== e.cl) { e.cl = cl; var ce = e.b.querySelector('.cdn'); if (!ce) { ce = document.createElement('i'); ce.className = 'cdn num'; ce.setAttribute('aria-hidden', 'true'); e.b.appendChild(ce); } ce.textContent = cl; e.b.style.setProperty('--cdp', (cl / DS.SHADE.dur * 100) + '%'); } }
    if (st === e.st) return;
    e.st = st; e.b.classList.toggle('off', st === 'off'); e.b.classList.toggle('cool', st === 'live'); e.b.classList.toggle('ready', st === 'on');
    if (st !== 'live') { var c2 = e.b.querySelector('.cdn'); if (c2) c2.remove(); e.cl = null; }
    e.n.textContent = S && !S.used && S.cands.length ? '1' : '0';
    e.b.setAttribute('aria-label', T.btn + (w ? ', ' + w : ''));
    if (st === 'off' || st === 'live') pickOff();
    var sv = g.save;
    if (st === 'on' && sv && sv.seen && !sv.seen.shade && DS.coach && sim.combat) { sv.seen.shade = 1; setTimeout(function () { if (document.body.contains(e.b)) DS.coach(e.b, T.hint, { long: T.hintLong, ms: 5200 }); }, 600); }      // 처음 한 번 (저장의 seen 묶음)
  },
  // 엔진 사건: 'shade' (불렀다) · 'shadeEnd' (걷혔다)
  ev: function (e) {
    var g = G(), sim = g && g.sim, V = g && g.view; if (!sim || !V) return;
    var u = sim.byId[e.id], by = e.by && sim.byId[e.by], c = sim.shd && sim.shd.cands[e.i || 0];
    if (e.t === 'shade') {
      pickOff();
      if (by) V.float(by.x, by.y, fill(T.call, { n: e.n }), '#fff3c4', { dy: -20, life: 2.0, big: true });      // 30번 이름 부르기와 같은 외침
      if (u) {
        V.burst(u.x, u.y, ['#dfe6ff', '#b9c4e8', '#ffffff'], 16, { spd: 26, up: 30, grav: -12, life: 0.9 });
        V.rings.push({ x: u.x, y: u.y + 0.3, t: 0, dur: 0.6, c: '#cdd6f6', r: 18 });
        setTimeout(function () { if (g.sim === sim && u && !u.dead && V.bark) V.bark(u.id, DS.shadeLine(c || e), 2.6); }, 650);
      }
      if (!(DS.calmOn && DS.calmOn())) V.flashA = Math.max(V.flashA || 0, 0.05);
      A('phase'); setTimeout(function () { A('star'); }, 260);
      DS.shadeUI.cut(e, c);
      if (e.auto && U().toast && by) { /* 자동으로 불렀을 때는 띠가 알린다 */ }
    } else if (e.t === 'shadeEnd') {
      var v = V.vu && V.vu[e.id], x = v ? v.x : u ? u.x : 0, y = v ? v.y : u ? u.y : 0;
      V.burst(x, y, ['#dfe6ff', '#b9c4e8'], 10, { spd: 16, up: 36, grav: -16, life: 1.1 });
      V.float(x, y, e.why === 'down' ? T.down : T.fade[(sim.shd ? sim.shd.n : 0) % T.fade.length], '#cdd6f6', { dy: -22, life: 2.4, slow: true });
      A('swoosh');
    }
  },
  // 짧은 띠 (멈추지 않는다): 「먼저 간 이」 · 이름 · 마지막 한마디
  cut: function (e, c) {
    var sg = document.getElementById('s-game'); if (!sg) return;
    var el = document.getElementById('shadecut'); if (!el) { el = document.createElement('div'); el.id = 'shadecut'; el.setAttribute('aria-live', 'polite'); sg.appendChild(el); }
    var C = DS.CLASSES[e.cls], lw = c && c.lw ? c.lw : '';
    el.innerHTML = '<small>' + esc((e.auto ? '자동 · ' : '') + '먼저 간 이' + (C ? ' · ' + C.name : '')) + '</small><b>' + esc(fill(T.call, { n: e.n })) + '</b>' + (lw ? '<em>「' + esc(lw) + '」</em>' : '');
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('on'); }, 2200);
  },
  off: function () { pickOff(); var el = document.getElementById('shadecut'); if (el) el.classList.remove('on'); },
  why: function () { var g = G(); return why(g && g.sim); },
  open: function () { var b = document.querySelector('#acts .act.shade'); if (b) pickOpen(b); return !!document.getElementById('shadepick'); },      // 시험용
  call: function (i) { return call(i || 0); }
};
})();
