// 전민 戰民, 열 가문의 시대 — 2.5.0 「선대의 훈수」: 시나리오 싸움이 시작되면 선대 단톡방이 조건 하나를 던진다 (글은 story2.js DS.MSN_TXT · 경전 §11)
// 규칙은 바꾸지 않는다 — 싸움의 사건(sim.emit)을 몰래 듣고, 이긴 뒤 결과 창 앞에서 판정한다. 조건은 고르지 않아도 되는 덤이다.
//   고르기: (저장 씨앗, 시나리오 번호, 그 판에 들어간 수, 이번 대의 열쇠 DS.cycKey) 로 정해진다 — 다시 들어가면 · 대가 끊기면 · 다음 세대의 장이면 바뀐다. 그 판에서 못 하는 것(보스 없는 17번의 막타 · 필살기가 아직 없는 맹주의 필살기)은 뺀다.
//   보상: 이번 대(DS.cycKey)에 그 시나리오에서 처음 해낼 때만 — 5의 배수 판은 영웅 모집권 1장, 그 밖은 그 판 처음 깬 골드의 3할. 되풀이해 벌 수 없다.
//   갱도 · 연무장 · 온라인에는 없다: 갱도는 끝없이 되풀이하는 층이라 판마다 덤을 주면 그것이 벌이가 되고, 연무장 · 온라인은 시나리오 싸움(DS.startScenario)이 아니다.
// 저장: save.msn = { k: 이번 대의 열쇠, ok: { 시나리오: 1 } 보상을 받은 판, a: { 시나리오: 들어간 수 } } (DS.msnFix — save.js 의 fixSave 가 부른다)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
// par: 「N초 안에」의 N (봇이 처음 싸운 길이 × 1.4 쯤, 60초 아래는 60초). 다음 세대의 장은 egPar 배
DS.MSN = { gold: 0.3, tkEvery: 5, egPar: 1.2, hp: 0.5, heroHp: 0.7,
  par: { 1: 70, 2: 80, 3: 220, 4: 250, 5: 300, 6: 150, 7: 180, 8: 190, 9: 470, 10: 160, 11: 100, 12: 80, 13: 90, 14: 100, 15: 100, 16: 100, 17: 100, 18: 170, 19: 120, 20: 110,
         21: 90, 22: 60, 23: 60, 24: 120, 25: 80, 26: 110, 27: 60, 28: 120, 29: 60, 30: 90 } };
DS.MSN_KEYS = ['nofall', 'fast', 'noitem', 'bosshero', 'hp50', 'herohp', 'ult', 'herotop', 'allkill', 'nomerc', 'rest', 'clean'];
// 그 판에서 할 수 있는가 (ctx = { boss: 보스 판, ult: 맹주에게 필살기가 있다, cmds: 출전 가주 수, mercs: 가문원 수, ranged: 맹주가 멀리 쏜다 })
var CAN = {
  bosshero: function (c) { return c.boss; }, ult: function (c) { return c.ult; }, allkill: function (c) { return c.cmds >= 2; },
  herotop: function (c) { return c.cmds >= 2 || c.mercs >= 1; }, nomerc: function (c) { return c.mercs >= 1; }, clean: function (c) { return c.ranged; }
};
function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function hstr(t) { t = String(t); var h = 0x811c9dc5 | 0; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) | 0; } return h >>> 0; }
// 이번 대의 열쇠: 세대(다음 세대의 장) + 대가 끊겨 다시 걸은 수. 판의 선택지(choice.js)도 같은 열쇠를 쓴다
DS.cycKey = function (s) { var g = DS.egGen ? DS.egGen(s) : 1, r = s && s.runs ? Math.max(0, Math.round(+s.runs.n || 0)) : 0; return 'g' + g + 'r' + r; };
DS.msnFix = function (s) {
  if (!s || typeof s !== 'object') return s;
  var m = s.msn; if (m == null) return s;
  if (typeof m !== 'object' || Array.isArray(m)) { delete s.msn; return s; }
  var o = { k: typeof m.k === 'string' ? m.k.slice(0, 16) : '', ok: {}, a: {} }, n = DS.SCENARIOS ? DS.SCENARIOS.length : 30;
  [['ok', 1], ['a', 9999]].forEach(function (x) { var src = m[x[0]]; if (!src || typeof src !== 'object' || Array.isArray(src)) return; for (var k in src) if (own(src, k) && +k >= 1 && +k <= n && Math.floor(+k) === +k) { var v = Math.round(+src[k] || 0); if (v > 0) o[x[0]][k] = Math.min(x[1], v); } });
  s.msn = o; return s;
};
function state(s) {
  var m = s.msn; if (!m || typeof m !== 'object' || Array.isArray(m)) m = s.msn = { k: '', ok: {}, a: {} };
  if (!m.ok || typeof m.ok !== 'object') m.ok = {}; if (!m.a || typeof m.a !== 'object') m.a = {};
  var k = DS.cycKey(s); if (m.k !== k) { m.k = k; m.ok = {}; }      // 대가 바뀌면 보상을 다시 받을 수 있다 (들어간 수는 이어 센다)
  return m;
};
DS.msnState = state;
DS.msnDone = function (s, id) { var m = s && s.msn; return !!(m && m.k === DS.cycKey(s) && m.ok && m.ok[id]); };
function seedOf(s) { return (s && s.eg && +s.eg.seed) || (DS.egSeed ? DS.egSeed(s) : 7); }
// 조건 하나를 고른다 (순수 — 시험과 화면이 같은 것을 부른다). n = 그 판에 들어간 수 (없으면 저장의 수)
DS.msnPick = function (s, id, ctx, n) {
  ctx = ctx || {};
  var list = DS.MSN_KEYS.filter(function (k) { return !CAN[k] || CAN[k](ctx); });
  if (n == null) n = (s && s.msn && s.msn.a && s.msn.a[id]) || 0;
  var h = hstr([seedOf(s), id, n, DS.cycKey(s)].join(':'));
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15;
  return list[(h >>> 0) % list.length];
};
DS.msnCan = function (k, ctx) { return !CAN[k] || CAN[k](ctx || {}); };
DS.msnPar = function (sc) { var b = sc && (sc.base || sc), p = DS.MSN.par[b && b.id] || 120; return sc && sc.gen ? Math.round(p * DS.MSN.egPar / 10) * 10 : p; };
DS.msnReward = function (s, sc) {
  if (!sc) return null;
  if (sc.id % DS.MSN.tkEvery === 0) return { tk: 1 };
  var g = DS.scnGold ? DS.scnGold(sc) : 100; return { gold: Math.max(10, Math.round(g * DS.MSN.gold * ((DS.BAL && DS.BAL.gold) || 1) / 10) * 10) };
};
DS.msnRwText = function (r) { var T = DS.MSN_TXT; if (!r) return ''; return r.tk ? T.rw.tk : String(T.rw.gold).replace('{g}', (DS.ui && DS.ui.fmtN ? DS.ui.fmtN(r.gold) : r.gold)); };
// 판정 (순수): m = 싸우는 동안 센 것, sim = 그 싸움
DS.msnJudge = function (m, sim) {
  if (!m || !sim) return false;
  var hero = sim.byId[m.heroId], cmds = m.cmds.map(function (id) { return sim.byId[id]; }).filter(Boolean), hk = m.kills[m.heroId] || 0;
  switch (m.key) {
    case 'nofall': return !m.cmdDead;
    case 'fast': return sim.t <= m.n;
    case 'noitem': return !m.items;
    case 'bosshero': return !!m.bossBy && m.bossBy === m.heroId;
    case 'hp50': return !m.cmdDead && cmds.every(function (u) { return !u.dead && u.hp >= u.mhp * DS.MSN.hp; });
    case 'herohp': return !!hero && !hero.dead && hero.hp >= hero.mhp * DS.MSN.heroHp;
    case 'ult': return m.ult > 0;
    case 'herotop': return hk > 0 && Object.keys(m.kills).every(function (k) { return k === m.heroId || m.kills[k] <= hk; });
    case 'allkill': return m.cmds.every(function (id) { return (m.kills[id] || 0) > 0; });
    case 'nomerc': return !m.mercDead;
    case 'rest': return !hk;
    case 'clean': return !m.hit;
  }
  return false;
};
// 몰래 듣기: 싸움의 사건 하나 (순수)
DS.msnSee = function (m, sim, e) {
  if (!m || !e) return;
  var u = e.id != null ? sim.byId[e.id] : null;
  if (e.t === 'die' && u && !e.flee) {
    if (u.side === 'ally' && u.role === 'cmd') m.cmdDead++;
    else if (u.side === 'ally' && u.role === 'merc') m.mercDead++;
    else if (u.side === 'enemy') {
      var by = e.by != null ? sim.byId[e.by] : null;
      if (by && by.side === 'ally') m.kills[by.id] = (m.kills[by.id] || 0) + 1;
      if (u.obj && !u.phase2) m.bossBy = e.by || '-';
    }
  } else if (e.t === 'item' && u && u.side === 'ally' && u.order && u.order.t === 'item') m.items++;      // 손으로 시킨 것만 센다 (숨넘어갈 때 저절로 먹는 약초는 봐준다)
  else if (e.t === 'ult' && e.id === m.heroId) m.ult++;
  else if (e.t === 'hit' && e.id === m.heroId && e.v > 0) m.hit++;
};
// 지금 어떤가 (전투 화면의 작은 글): { t: 글, c: 'on' | 'miss' | 'ok' }
DS.msnNow = function (m, sim) {
  var S = DS.MSN_TXT.st, f = function (t, o) { return String(t).replace(/\{(\w+)\}/g, function (a, k) { return o && o[k] != null ? o[k] : ''; }); };
  if (!m || !sim) return { t: '', c: 'on' };
  var hero = sim.byId[m.heroId], hk = m.kills[m.heroId] || 0, top = 0;
  Object.keys(m.kills).forEach(function (k) { if (k !== m.heroId) top = Math.max(top, m.kills[k]); });
  var on = { t: S.on, c: 'on' }, miss = { t: S.miss, c: 'miss' }, ok = { t: S.ok, c: 'ok' };
  switch (m.key) {
    case 'nofall': return m.cmdDead ? miss : on;
    case 'fast': var left = Math.ceil(m.n - sim.t); return left > 0 ? { t: f(S.left, { v: left }), c: 'on' } : miss;
    case 'noitem': return m.items ? miss : on;
    case 'bosshero': return m.bossBy ? (m.bossBy === m.heroId ? ok : miss) : { t: S.wait, c: 'on' };
    case 'hp50': if (m.cmdDead) return miss; var lo = 1; m.cmds.forEach(function (id) { var u = sim.byId[id]; if (u && !u.dead) lo = Math.min(lo, u.hp / Math.max(1, u.mhp)); }); return { t: f(S.low, { v: Math.round(lo * 100) }), c: lo >= DS.MSN.hp ? 'on' : 'miss' };
    case 'herohp': if (!hero || hero.dead) return miss; var r = hero.hp / Math.max(1, hero.mhp); return { t: f(S.low, { v: Math.round(r * 100) }), c: r >= DS.MSN.heroHp ? 'on' : 'miss' };
    case 'ult': return m.ult ? ok : { t: S.wait, c: 'on' };
    case 'herotop': return { t: f(S.kills, { a: hk, b: top }), c: hk > 0 && hk >= top ? 'ok' : 'on' };
    case 'allkill': var got = m.cmds.filter(function (id) { return (m.kills[id] || 0) > 0; }).length; return { t: f(S.each, { a: got, b: m.cmds.length }), c: got >= m.cmds.length ? 'ok' : 'on' };
    case 'nomerc': return m.mercDead ? miss : on;
    case 'rest': return hk ? miss : on;
    case 'clean': return m.hit ? miss : on;
  }
  return on;
};
DS.msnText = function (k, f, o) { var c = DS.MSN_TXT.c[k]; return c ? String(c[f] || '').replace(/\{(\w+)\}/g, function (a, x) { return o && o[x] != null ? o[x] : ''; }) : ''; };
// 이번 대에 처음 해냈으면 보상을 넣는다 (순수). 돌려주는 것: 넣은 보상 (이미 받았으면 null)
DS.msnGive = function (s, sc, rw) {
  var st = state(s); if (st.ok[sc.id]) return null;
  st.ok[sc.id] = 1;
  if (rw.tk) s.tickets = (s.tickets || 0) + rw.tk; else if (rw.gold) s.gold = (s.gold || 0) + rw.gold;
  return rw;
};

// ── 화면 (브라우저에서만) ──
if (typeof document === 'undefined' || !DS.ui) return;
var U = DS.ui, G = DS.G, esc = U.esc, T = function () { return DS.MSN_TXT; };
var M = null;      // 지금 싸움의 훈수 { key, scn, n, sim, heroId, cmds, kills, … }
function heroOf(sim) { var h = sim.heroId && sim.byId[sim.heroId]; if (h) return h; return sim.units.filter(function (u) { return u.side === 'ally' && u.role === 'cmd' && u.hero; })[0] || null; }
function ctxOf(sim, sc) {
  var h = heroOf(sim), al = sim.units.filter(function (u) { return u.side === 'ally' && !u.dead; });
  return { boss: !!sc.boss, ult: !!(h && h.ult), cmds: al.filter(function (u) { return u.role === 'cmd'; }).length, mercs: al.filter(function (u) { return u.role === 'merc'; }).length, ranged: !!(h && h.rng && h.rng[1] >= 3) };
}
function start(sim, sc) {
  var sv = G.save, st = state(sv), id = sc.id, h = heroOf(sim);
  st.a[id] = Math.min(9999, (st.a[id] || 0) + 1);
  var ctx = ctxOf(sim, sc), key = DS.msnPick(sv, id, ctx, st.a[id]);
  M = { key: key, scn: sc, id: id, n: DS.msnPar(sc), sim: sim, heroId: h ? h.id : sim.heroId, cmds: sim.units.filter(function (u) { return u.side === 'ally' && u.role === 'cmd'; }).map(function (u) { return u.id; }),
        kills: {}, items: 0, ult: 0, hit: 0, cmdDead: 0, mercDead: 0, bossBy: '', rw: DS.msnReward(sv, sc), done: DS.msnDone(sv, id), shown: performance.now() };
  var e0 = sim.emit, m = M;
  sim.emit = function (e) { try { if (M === m) DS.msnSee(m, sim, e); } catch (x) {} return e0.call(this, e); };      // 이 싸움의 사건만 몰래 듣는다 (엔진은 그대로)
  if (DS.msnTrace) DS.msnTrace.push({ id: id, key: key, a: st.a[id] });
  m.popDue = 1;      // 2.6 첫 박자: 말풍선은 시나리오 띠가 뜨고 0.8초 뒤에 들어온다 (띠 · 말풍선 · 싸움이 한꺼번에 쏟아지지 않게)
  (function wait() { if (M !== m || !m.popDue) return; if (!G.beatArm && performance.now() >= (G.beatAt || 0) + 800) { m.popDue = 0; pill(true); return; } setTimeout(wait, 40); })();
}
DS.msnTrace = [];
DS.msnCur = function () { return M; };
DS.msnForce = function (k, n) { if (M) { M.key = k; if (n > 0) M.n = n; M.popDue = 0; pill(true); } };      // 시험용: 지금 싸움의 조건을 바꾼다
function el() {
  var e = document.getElementById('msn'); if (e) return e;
  var sg = document.getElementById('s-game'); if (!sg) return null;
  e = document.createElement('div'); e.id = 'msn'; e.hidden = true; e.setAttribute('aria-live', 'polite'); sg.appendChild(e); return e;
}
function pill(pop) {
  var e = el(); if (!e) return;
  if (!M || G.scn !== M.scn) { e.hidden = true; return; }
  var now = DS.msnNow(M, M.sim), n = M.n, txt = DS.msnText(M.key, 's', { n: n }), rw = M.done ? T().rw.done : DS.msnRwText(M.rw);
  if (pop) {
    e.className = 'pop';
    e.innerHTML = '<b class="mh">' + esc(T().head) + '</b><span class="mt">' + esc(DS.msnText(M.key, 't', { n: n })) + '</span><small class="mr">' + esc(rw) + '</small>';
    e.hidden = false; M.popAt = performance.now(); M.sig = '';
    return;
  }
  var sig = txt + '|' + now.t + '|' + now.c; if (sig === M.sig) return; M.sig = sig;
  e.className = 'pill ' + now.c;
  e.innerHTML = '<b class="mh">' + esc(T().hud) + '</b><span class="mt">' + esc(txt) + '</span><i class="ms">' + esc(now.t) + '</i>';
  e.hidden = false;
}
setInterval(function () {
  try {
    var sim = G.sim, sc = G.scn;
    if (sc && sim && !sc.pit && !sc.stand && sim.mode === 'scn' && (!M || M.sim !== sim) && !G.ending) start(sim, sc);      // 2.8: 마지막 물결에는 훈수가 없다
    if (!sc || !M || M.scn !== sc) { var e = document.getElementById('msn'); if (e && !e.hidden) e.hidden = true; if (!sc) M = null; return; }
    if (M.popAt && performance.now() - M.popAt > 4600) { M.popAt = 0; }
    if (!M.popAt && !M.popDue) pill(false);
  } catch (x) { if (DS.DEBUG) throw x; }
}, 250);
// 결과 창: 판정 → 보상 → 원래 창 → 「다음」 줄 위에 단톡방 한 줄
function who(sv, line, plain) {
  var d = []; if (!plain) { try { d = DS.storyDead ? DS.storyDead(sv) : []; } catch (x) { d = []; } }
  if (!d.length) return '선대 단톡방';
  return '단톡방 · ' + d[hstr(line) % d.length].n;
}
DS.msnLast = null;
var sr0 = DS.showResult;
if (sr0) DS.showResult = function (s, out, cb) {
  var m = M, sv = G.save, res = null;
  if (m && s && !s.pit && m.scn === s && out && !out.msn) {
    var ok = false; try { ok = DS.msnJudge(m, m.sim); } catch (x) { ok = false; }
    var v = Math.round(m.sim.t || 0), line = DS.msnText(m.key, ok ? 'ok' : 'no', { n: m.n, v: v });
    var got = ok ? DS.msnGive(sv, s, m.rw) : null;
    res = out.msn = { key: m.key, ok: ok, line: line, who: who(sv, line, !ok && (m.key === 'nofall' || m.key === 'nomerc')), got: got, done: ok && !got };
    DS.msnLast = res; M = null; var e = document.getElementById('msn'); if (e) e.hidden = true;
    if (got) U.persist();
  }
  var r = sr0.apply(this, arguments);
  if (res) {
    var ov = document.querySelectorAll('.ov .result.res2'), box = ov[ov.length - 1], ft = box && box.querySelector('.rfoot');
    if (ft) {
      var tag = res.ok ? T().res.ok + (res.got ? ', ' + (res.got.tk ? '영웅 모집권 1장' : '+' + U.fmtN(res.got.gold) + '골드') : '') : T().res.no;
      ft.insertAdjacentHTML('afterbegin', '<p class="msnres ' + (res.ok ? 'ok' : 'no') + '"><b>' + esc(res.who) + '</b><span>' + esc(res.line) + '</span><em>' + esc(tag) + (res.done ? '<small>' + esc(T().res.done) + '</small>' : '') + '</em></p>');
    }
    if (res.got && res.got.gold) { var gb = document.getElementById('gold'); if (gb) gb.textContent = U.fmtN(sv.gold); }
  }
  return r;
};
})();
