// 전민 2.8 「마지막 물결」: 다음 세대로 넘기기 전, 옛 맹주의 마지막 싸움. 어스름의 문 앞에서 끝없이 밀려오는 물결을 막는다.
//   막은 물결의 수가 그 대의 기록이고, 다음 세대의 평화가 그만큼 이어진다 (평화의 해 = clamp(막은 물결, minY, maxY) · 스무 해 창의 길이).
//   누가 싸우는가: 맹주, 가주가 선 모든 가문, 맹주의 어른 가문원. 쓰러진 이는 그 싸움에서만 빠진다 (영영 죽지 않는다 · 저장의 사람은 건드리지 않는다).
//   한 대에 한 번: 싸우기 전에 저장에 「치르는 중」 표(save.eg.stand.on)를 남긴다. 싸우다 창을 닫으면 다시 열 때 그때까지 막은 물결로 끝난다 (DS.standFix).
//     기기에도 같은 기록(메타 egs)을 남겨, 싸우기 전 저장으로 되돌려도 다시 싸우지 않는다.
//   싸움은 진짜 엔진(DS.Sim)과 진짜 보스(DS.BOSSES · 그 기술과 예고)로. 물결을 부르고 세는 것은 엔진 안(sim.std · 엔진 시간과 엔진 난수만)이라 봇(tools/bot.js)과 화면이 같다.
//   위쪽은 순수 함수 (봇이 부른다). 「── 화면」 아래는 브라우저에서만. 싸움 장면의 손은 game.js 의 「2.8 마지막 물결」.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

// ── 표: 숫자는 모두 여기 ──
var ST = DS.STAND = {
  minY: 5, maxY: 30,                    // 평화의 해 = clamp(막은 물결, minY, maxY)
  boss0: 1, bossEvery: 3, bossMax: 6,   // B(n) = min(bossMax, boss0 + floor((n - 1) / bossEvery))
  mob0: 4, mobPer: 2, mobMax: 60,       // M(n) = min(mobMax, mob0 + mobPer · n)
  live: 34,                             // 한꺼번에 서 있는 적 (넘는 몫은 줄을 서서 자리가 나면 들어온다)
  Lbase: 100, Lmax: 100,                // 2.9.1 적 레벨은 우리와 상관없이 10단 10레벨(100)에 고정 (첫 물결의 보스부터 10단 셋이 버거워야 한다)
  k0: 1.2, kW: 0.06,                    // 적 세기 = (k0 + kW · (n - 1)) × 대마다 배율 (DS.EG.step · cap, 장 시나리오와 같다)
  rage: { lim: 35, every: 12, per: 0.2, max: 10 },      // 2.9.1 광폭화: 한 물결이 lim 초를 넘으면 1단계, 그 뒤 every 초마다 한 단계. 단계마다 그 물결의 적 공격 · 마공 +20% (보스가 다 쓰러지면 멈춘다)
  bossHp: 2.0, bossAtk: 1.3, bossRef: 3000,      // 보스 체력 · 공격 손잡이 · 2.9.1 보스마다 체력을 고르게 (10단 10레벨에서 bossRef 에 맞춘다. 첫 판 보스라고 약하지 않게)
  mobHp: 0.35, mobAtk: 0.45,            // 무리 체력 · 공격 손잡이 (무리는 많다. 하나하나는 가볍게)
  first: 2.5,                           // 첫 물결까지 (엔진 초)
  rest: 4.5,                            // 물결 사이 숨 돌리기 (엔진 초)
  heal: 0.10, mana: 0.10,               // 숨 돌릴 때 돌아오는 몫 (최대치의 비율) · 필살 게이지는 그대로 이어진다
  tmax: 150,                            // 한 물결이 이보다 길면 다음 물결이 그냥 온다 (그 물결의 보스가 다 쓰러져야 막은 것으로 센다)
  hero: { from: 2, p0: 0.4, pW: 0.05, pMax: 0.8, two: 8, three: 13, hp: 2.5, atk: 0.8, cls: ['inf', 'cav', 'fly', 'mar', 'pike', 'arc', 'cle', 'mon', 'mag', 'sha'] },      // 2.9.1 이름 잃은 영웅: 물결 from 부터 가끔 (확률 p0 + pW·n, 많아야 pMax) 10단 10레벨 영웅이 적으로 섞인다. two · three 번째 물결부터 둘 · 셋까지
  bigEvery: 5,                          // 다섯째 물결마다 첫 보스는 큰 몸으로 (큰 몸이 있는 보스면)
  allies: 24,                           // 우리 편 상한 (가주 먼저, 그다음 가문원 레벨 순)
  waveMax: 99, simMax: 7200             // 안전 (엔진 초)
};

// ── 수 · 말 ──
var ONE = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'], TEN = ['', '열', '스물', '서른'];
DS.numKo = function (n) { n = Math.round(+n); if (!(n >= 1 && n <= 39)) return String(n); if (n === 20) return '스무'; return TEN[Math.floor(n / 10)] + ONE[n % 10]; };      // 매김말 (열일곱 해 · 스무 해 · 서른 번)
DS.standYW = function (y) { y = Math.round(+y); return y >= 1 && y <= 39 ? DS.numKo(y) + ' 해' : y + '년'; };
DS.standWW = function (w) { w = Math.round(+w); return w >= 1 && w <= 39 ? DS.numKo(w) + ' 번' : w + '번'; };
DS.standPeace = function (w) { return Math.max(ST.minY, Math.min(ST.maxY, Math.round(+w || 0))); };
DS.standB = function (n) { return Math.min(ST.bossMax, ST.boss0 + Math.floor((n - 1) / ST.bossEvery)); };
DS.standM = function (n) { return Math.min(ST.mobMax, ST.mob0 + ST.mobPer * n); };
function genK(g) { var C = DS.EG || { step: 0.35, cap: 2 }; return Math.min(C.cap, 1 + C.step * (Math.max(1, g) - 1)); }
DS.standK = function (n, g) { return (ST.k0 + ST.kW * (n - 1)) * genK(g || 1); };
DS.standL = function () { return Math.max(1, Math.min(ST.Lmax, ST.Lbase)); };
DS.standRage = function (dt) { var Q = ST.rage; return dt < Q.lim ? 0 : Math.min(Q.max, 1 + Math.floor((dt - Q.lim) / Q.every)); };      // 물결이 시작된 지 dt 초: 광폭 단계
DS.standRageAt = function (e) { var Q = ST.rage; return e <= 0 ? Q.lim : Q.lim + Q.every * e; };      // e+1 단계가 되는 때 (물결 시작부터 초)

// ── 싸움터: 어스름의 문 앞. 위(가까운 쪽이 문)에서, 그리고 양옆 틈에서 온다. 우리는 가운데를 지킨다 ──
var MAP = [
  '###############',
  '#__p___p___p__#',
  '#_____________#',
  '#_____________#',
  '#__p_______p__#',
  '#_____________#',
  '#_____________#',
  '_______________',
  '_______________',
  '_______________',
  '#_____________#',
  '#__p_______p__#',
  '#_____________#',
  '#_____________#',
  '#___p_____p___#',
  '#_____________#',
  '###############'];
DS.STAND_MAP = MAP;
var HOLD = [7, 9];      // 지키는 자리
var STARTS = (function () { var a = []; for (var y = 7; y <= 13; y++) for (var x = 2; x <= 12; x++) if (MAP[y].charAt(x) === '_') a.push([x, y]); var d = function (p) { return Math.abs(p[0] - HOLD[0]) + Math.abs(p[1] - HOLD[1]) * 1.3; }; return a.sort(function (p, q) { return d(p) - d(q) || p[1] - q[1] || p[0] - q[0]; }); })();
var GATE = [[7, 1], [5, 2], [9, 2], [3, 2], [11, 2], [7, 3]];

// 보스: 서른 판의 진짜 보스 (먼동 · 왕은 빼고. 그 둘은 30번의 장치가 있다). 무리는 그 보스가 있던 판의 적
var POOL = null;
function pool() { if (POOL) return POOL; POOL = []; (DS.SCENARIOS || []).forEach(function (s) { if (s.boss && s.boss !== 'herald' && s.boss !== 'duskking' && DS.BOSSES[s.boss] && POOL.indexOf(s.boss) < 0) POOL.push(s.boss); }); return POOL; }
function mobsOf(boss) { var sc = (DS.SCENARIOS || []).filter(function (s) { return s.boss === boss; })[0]; return sc && sc.mobs && sc.mobs.length ? sc.mobs : ['demon', 'gargoyle', 'ghost', 'darkMage']; }
function bigOk(boss) { var B = DS.BOSSES[boss]; return !!(B && B.sz && (B.sz[0] > 1 || B.sz[1] > 1)); }
DS.standPool = function () { return pool().slice(); };
// 2.9.1 이름 잃은 영웅: 우리와 같은 병과의 10단 10레벨 (그 단의 기본 장비). 소환 · 아군에게 거는 기술은 빼고, 치는 기술만 쓴다 (엔진의 적 AI)
function heroSkills(list) { var SK = DS.SKILLS || {}; return list.filter(function (k) { var S = SK[k]; return S && S.eff && S.eff[0] && S.eff[0].t === 'dmg' && !S.eff.some(function (e) { return e.t === 'summon'; }) && /^(enemy|tile|self|dir)$/.test(S.tg); }); }
DS.standHeroN = function (n, r1, r2, r3) {
  var H = ST.hero; if (n < H.from) return 0;
  if (r1 >= Math.min(H.pMax, H.p0 + H.pW * n)) return 0;
  return 1 + (n >= H.two && r2 < 0.5 ? 1 : 0) + (n >= H.three && r3 < 0.5 ? 1 : 0);
};
DS.standHeroSpec = function (cls, k) {
  var ref = { id: -1, cls: cls, L: ST.Lbase, st: '' }; DS.stdGear(ref, DS.tierOfL(ST.Lbase));
  var u = DS.cmdSpec(ref, false, null), H = ST.hero, tn = DS.tierName(cls, DS.tierOfL(ST.Lbase));
  delete u.ch; delete u.hero; delete u.st; delete u.owner;
  u.side = 'enemy'; u.role = 'mob'; u.std = 'h'; u.stdCls = cls; u.name = fillT(TX.heroN, { t: tn }); u.mn = u.name;
  u.mhp = u.hp = Math.round(u.mhp * H.hp * k); u.atk = Math.round(u.atk * H.atk * k); u.mag = Math.round(u.mag * H.atk * k);
  u.mp = u.mmp = 9999; u.skills = heroSkills(u.skills || []); u.exp = 0; u.gold = 0; u.aggro = true;
  return u;
};
var EVEN = {};
function bossEven(id) { if (EVEN[id] == null) { var u = DS.enemySpec(null, ST.Lbase, { boss: id, diff: 1, small: true }); EVEN[id] = Math.max(0.7, Math.min(1.6, ST.bossRef / Math.max(1, u.mhp))); } return EVEN[id]; }

// ── 누가 싸우는가 ──
function nameOfCmd(s, ch, who) { try { if (ch.id === +s.hero) return s.name || DS.charName(ch); return (who && (who.ttl || who.n)) || DS.charName(ch); } catch (x) { return ''; } }
DS.standRoster = function (s) {
  if (!s || !s.chars) return [];
  var cmds = [], kin = [], hid = +s.hero;
  DS.charList(s).slice().sort(function (a, b) { return (a.id === hid ? -1 : 0) - (b.id === hid ? -1 : 0) || (DS.houseOrd ? DS.houseOrd(a, b) : a.id - b.id); }).forEach(function (ch) {
    if (!ch || ch.vac || ch.down) return;
    var who = DS.bearer ? DS.bearer(s, ch) : null; if (DS.bearer && !who) return;
    var u = DS.cmdSpec(ch, ch.id === hid, who); u.stdN = nameOfCmd(s, ch, who); cmds.push(u);
  });
  var hc = s.chars[hid];
  if (hc && !hc.vac && !hc.down && DS.mercsOf) DS.mercsOf(s, hid).forEach(function (m) { var u = DS.mercSpec(hc, m); u.stdN = m.n || u.name || ''; kin.push(u); });
  kin.sort(function (a, b) { return (b.L || 0) - (a.L || 0) || String(a.id).localeCompare(String(b.id)); });
  cmds = cmds.slice(0, ST.allies);
  return cmds.concat(kin.slice(0, Math.max(0, ST.allies - cmds.length)));
};
DS.standCount = function (s) { var r = DS.standRoster(s); return { all: r.length, cmd: r.filter(function (u) { return u.role === 'cmd'; }).length, kin: r.filter(function (u) { return u.role === 'merc'; }).length }; };

// ── 물결을 부르고 세는 것 (sim.std: 엔진이 틱마다 · 쓰러질 때마다 부른다) ──
function Std(s, sim, specs, o) {
  var sum = 0; specs.forEach(function (u) { sum += +u.L || 1; });
  this.g = DS.egGen ? DS.egGen(s) : 1; this.Lp = specs.length ? sum / specs.length : 1;
  this.n = 0; this.w = 0; this.b = 0; this.k = 0; this.open = []; this.q = []; this.qT = 0;
  this.next = sim.t + (o.first != null ? o.first : ST.first); this.restEnd = 0; this.done = false; this.over = 0; this.t0 = sim.t;
  this.last = ''; this.lastId = ''; this.fall = []; this.prev = null; this.names = {}; this.rest = false; this.made = {}; this.plan = {}; this.rg = {}; this.h = 0; this.hk = 0; this.hid = 0;
  var self = this; specs.forEach(function (u) { self.names[u.id] = u.stdN || u.name || ''; });
}
DS.StandCtl = Std;
var SP = Std.prototype;
SP.mk = function (sim, type, o) {
  o = o || {}; var n = Math.max(1, this.n), L = o.L || DS.standL(n, this.Lp), k = DS.standK(n, this.g);
  var u = DS.enemySpec(type, L, { boss: o.boss, diff: k, x: o.x, y: o.y, grp: o.grp || 'w' + n, small: o.small, hm: o.hm, am: o.am });
  u.exp = 0; u.gold = 0; u.stdW = n;
  return u;
};
SP.liveFoes = function (sim) { var c = 0, us = sim.units; for (var i = 0; i < us.length; i++) if (!us[i].dead && us[i].side === 'enemy') c++; return c; };
SP.allies = function (sim) { return sim.units.filter(function (u) { return !u.dead && u.side === 'ally' && (u.role === 'cmd' || u.role === 'merc'); }); };
SP.spot = function (sim) {      // 무리가 들어오는 곳: 문 쪽(절반) · 왼쪽 틈 · 오른쪽 틈
  var r = sim.rand(), W = sim.w;
  if (r < 0.5) return { x: 2 + Math.floor(sim.rand() * (W - 4)), y: 1 + Math.floor(sim.rand() * 2) };
  return { x: r < 0.75 ? 0 : W - 1, y: 7 + Math.floor(sim.rand() * 3) };
};
SP.pick = function (sim) {      // 같은 보스가 잇달아 오지 않게
  var P = pool(), b = P[Math.floor(sim.rand() * P.length)], guard = 0;
  while ((b === this.prev) && P.length > 1 && guard++ < 8) b = P[Math.floor(sim.rand() * P.length)];
  this.prev = b; return b;
};
SP.wave = function (sim) {
  var n = ++this.n, B = DS.standB(n), M = DS.standM(n), carry = this.liveFoes(sim), wv = { n: n, ids: [], left: 0, t0: sim.t }, mobs = [], i, self = this;
  for (i = 0; i < B; i++) {
    var id = this.pick(sim), big = i === 0 && n % ST.bigEvery === 0 && bigOk(id), g = GATE[i % GATE.length];
    var u = this.mk(sim, null, { boss: id, L: DS.standL(n), x: g[0], y: g[1], small: !big, hm: ST.bossHp * bossEven(id), am: ST.bossAtk });
    u.std = 'b'; u.stdBig = big ? 1 : 0;
    var nu = sim.add(u);
    if (nu) { nu.aggro = true; nu.busy = 1.0 + i * 0.35; nu.gauge = 30; wv.ids.push(nu.id); wv.left++; sim.emit({ t: 'stdBoss', id: nu.id, n: n, k: i, big: !!big }); }
    mobsOf(id).forEach(function (m) { if (mobs.indexOf(m) < 0) mobs.push(m); });
  }
  for (i = 0; i < M; i++) this.q.push({ type: mobs[Math.floor(sim.rand() * mobs.length)], n: n });
  var HN = DS.standHeroN(n, sim.rand(), sim.rand(), sim.rand()), HC = ST.hero.cls;
  for (i = 0; i < HN; i++) {      // 2.9.1 이름 잃은 영웅 (물결을 막는 데 쓰러뜨릴 필요는 없다. 무리처럼 다음 물결로 이어진다)
    var hp = this.spot(sim), hu = DS.standHeroSpec(HC[Math.floor(sim.rand() * HC.length)], DS.standK(n, this.g));
    hu.id = 'sh' + (++this.hid); hu.x = hp.x; hu.y = hp.y; hu.stdW = n; hu.grp = 'w' + n;
    var hn = sim.add(hu); if (hn) { hn.aggro = true; hn.busy = 1.2 + i * 0.4; hn.gauge = 50; this.h++; sim.emit({ t: 'stdHero', id: hn.id, n: n, k: i, first: this.h === 1 }); }
  }
  this.plan[n] = { b: wv.left, m: M, carry: carry };
  if (wv.left) this.open.push(wv); else this.cleared(sim, wv);
  this.rest = false;
  sim.emit({ t: 'stdWave', n: n, b: B, m: M, carry: carry, w: this.w });
};
SP.spawn = function (sim, it) {
  var p = this.spot(sim), u = this.mk(sim, it.type, { x: p.x, y: p.y, grp: 'w' + it.n, hm: ST.mobHp, am: ST.mobAtk });
  u.std = 'm'; u.stdW = it.n;
  var nu = sim.add(u); if (nu) { nu.aggro = true; nu.busy = 0.25 + sim.rand() * 0.3; nu.gauge = 40; this.made[it.n] = (this.made[it.n] || 0) + 1; if (this.rg[it.n]) this.rageOn(nu, this.rg[it.n]); }
  return nu;
};
// 광폭: 그 단계로 끌어올린다 (격노로 이미 오른 몫은 그대로 두고, 단계의 몫만 바꾼다)
SP.rageOn = function (u, e) {
  var o = u.stdE || 0; if (e <= o || u.dead) return;
  var f = (1 + ST.rage.per * e) / (1 + ST.rage.per * o);
  u.atk = Math.round(u.atk * f); u.mag = Math.round(u.mag * f); u.stdE = e;
};
SP.rage = function (sim, n, e) {
  this.rg[n] = e; var self = this;
  sim.units.forEach(function (u) { if (!u.dead && u.side === 'enemy' && u.stdW === n) self.rageOn(u, e); });
  sim.emit({ t: 'stdEnrage', n: n, e: e, p: Math.round(ST.rage.per * e * 100) });
};
SP.cleared = function (sim, wv) {
  this.w++;
  var i = this.open.indexOf(wv); if (i >= 0) this.open.splice(i, 1);
  sim.emit({ t: 'stdClear', n: wv.n, w: this.w });
  if (wv.n === this.n && this.next == null && !this.done) {      // 지금 물결을 막았다: 숨을 돌리고 다음 물결
    this.next = sim.t + ST.rest; this.rest = true;
    this.allies(sim).forEach(function (u) { sim.heal(u, u.mhp * ST.heal, true); if (u.mmp) u.mp = Math.min(u.mmp, u.mp + u.mmp * ST.mana); });
    sim.emit({ t: 'stdRest', n: this.n + 1, dur: ST.rest, w: this.w });
  }
};
SP.tick = function (sim, dt) {
  if (this.done) { sim.combat = true; return; }
  sim.combat = true;      // 숨 돌리는 동안에도 싸움이다 (들판의 쉼 · 끝난 싸움의 정리가 끼어들지 않게)
  var t = sim.t;
  if (this.q.length && t >= this.qT) {
    this.qT = t + 0.4;
    var room = Math.min(3, ST.live - this.liveFoes(sim));
    while (room-- > 0 && this.q.length) this.spawn(sim, this.q.shift());
  }
  if (this.next != null && t >= this.next && this.n < ST.waveMax) { this.next = null; this.wave(sim); }
  for (var oi = 0; oi < this.open.length; oi++) { var ow = this.open[oi], re = DS.standRage(t - ow.t0); if (re > (this.rg[ow.n] || 0)) this.rage(sim, ow.n, re); }      // 2.9.1 광폭: 막지 못한 물결은 시간이 갈수록 거세진다
  var cur = this.open.length ? this.open[this.open.length - 1] : null;
  if (cur && cur.n === this.n && this.next == null && t - cur.t0 >= ST.tmax) { this.next = t; sim.emit({ t: 'stdPress', n: this.n + 1 }); }      // 너무 오래 끌면 다음 물결이 그냥 온다
  if (t - this.t0 > ST.simMax) this.end(sim, null);
};
SP.died = function (sim, v, by) {
  var self = this;
  if (v.side === 'enemy') {
    if (v.std === 'b') {
      this.b++;
      for (var i = 0; i < this.open.length; i++) { var wv = this.open[i], j = wv.ids.indexOf(v.id); if (j >= 0) { wv.left--; if (wv.left <= 0) this.cleared(sim, wv); break; } }
    } else if (v.std === 'm') this.k++;
    else if (v.std === 'h') { this.k++; this.hk++; }
    return;
  }
  if (v.side !== 'ally' || (v.role !== 'cmd' && v.role !== 'merc') || this.done) return;
  this.fall.push({ id: v.id, n: this.n, t: Math.round(sim.t - this.t0) });
  sim.emit({ t: 'stdFall', id: v.id, n: this.n, left: this.allies(sim).length });
  var live = this.allies(sim), cmds = live.filter(function (u) { return u.role === 'cmd'; });
  if (v.role === 'cmd') {      // 따르던 가문원은 가장 가까운 가주에게 (흩어지지 않는다)
    sim.units.forEach(function (m) { if (!m.dead && m.owner === v.id && m.role === 'merc') { var c = near(m, cmds); if (c) m.owner = c.id; } });
    if (sim.leader === v.id) { var c0 = cmds[0]; if (c0) { sim.leader = c0.id; sim.emit({ t: 'leader', id: c0.id }); } }
  }
  if (!cmds.length && live.length) {      // 가주가 모두 쓰러졌다: 남은 가문원끼리 (가장 센 이를 따라)
    var lead = live.slice().sort(function (a, b) { return (b.L || 0) - (a.L || 0) || b.hp - a.hp; })[0];
    live.forEach(function (m) { var o = sim.byId[m.owner]; if (!o || o.dead || o.side !== 'ally') m.owner = lead.id; });
    lead.owner = lead.id;
  }
  if (!live.length) this.end(sim, v);
};
function near(u, list) { var best = null, bd = 1e9; list.forEach(function (c) { var d = Math.abs(c.x - u.x) + Math.abs(c.y - u.y); if (d < bd) { bd = d; best = c; } }); return best; }
SP.end = function (sim, v) {
  if (this.done) return;
  this.done = true; this.over = sim.t;
  if (v) { this.lastId = v.id; this.last = this.names[v.id] || v.mn || v.name || ''; }
  this.q.length = 0;
  sim.emit({ t: 'stdEnd', w: this.w, n: this.n, b: this.b, last: this.last });
};
SP.rec = function () { return { g: this.g, w: this.w, r: this.n, b: this.b, k: this.k, last: this.last, t: Math.max(0, Math.round((this.over || 0) - this.t0)), p: DS.standPeace(this.w) }; };

// 장면을 세운다 (화면 · 봇이 같은 것): 우리 편을 가운데에 세우고 sim.std 를 단다. 체력 · 마나는 가득 (마지막 싸움이다)
DS.standBuild = function (s, o) {
  o = o || {};
  var specs = DS.standRoster(s), std0 = null;
  var sim = new DS.Sim({ map: MAP.slice(), units: [], seed: o.seed || 1, inv: o.inv || s.items || {}, mode: 'scn', mk: function (type, q) { return std0 ? std0.mk(sim, type, q) : DS.enemySpec(type, (q && q.L) || 1, q); } });
  sim.heroId = 'c' + s.hero;
  var pos = DS.formation ? DS.formation(specs, STARTS) : specs.map(function (u, i) { return STARTS[i % STARTS.length]; }), first = null;
  specs.forEach(function (u, i) {
    u.x = pos[i][0]; u.y = pos[i][1]; u.hp = u.mhp; u.mp = u.mmp; u.auto = true; u.hx = HOLD[0]; u.hy = HOLD[1];
    var nu = sim.add(u); if (nu && nu.role === 'cmd' && !first) first = nu;
  });
  sim.leader = first ? first.id : null; sim.hunt = true;
  var std = std0 = new Std(s, sim, specs, o);
  sim.std = std;
  return { sim: sim, std: std, specs: specs };
};
// 봇 · 시험: 끝까지 (머리 없이). 돌려주는 것: 기록 { g, w 막은 물결, r 닿은 물결, b 쓰러뜨린 보스, k 무리, last 끝까지 선 이, t 엔진 초, p 평화의 해 }
DS.standRun = function (s, o) {
  o = o || {};
  var B = DS.standBuild(s, o), sim = B.sim, std = B.std, step = o.step || 0.5, guard = 0;
  while (!std.done && guard++ < (ST.simMax + 60) / step) { sim.update(step); var ev = sim.drain(); if (o.onEv) o.onEv(ev, sim); }
  if (!std.done) std.end(sim, null);
  var r = std.rec(); r.allies = B.specs.length; r.sim = sim;
  return r;
};

// ── 저장: save.eg.stand = { g 싸운 대, on 치르는 중, w, r, b, k, t, last, p, at 시작한 플레이 초, late 다시 열 때 끝냈다 } · 대마다의 기록은 save.eg.hist 의 그 대 줄에 { w, r, b, p, last, lp } ──
function E(s) { if (!s.eg || typeof s.eg !== 'object') { if (DS.egFix) DS.egFix(s); else s.eg = {}; } return s.eg; }
function heroPid(s) { var h = s.chars && s.chars[s.hero]; return h && h.pid ? h.pid : 0; }
function clean(v, n) { return Array.from(String(v == null ? '' : v).replace(/[\u0000-\u001f<>&"]/g, '')).slice(0, n).join(''); }
function nat(v, hi) { v = Math.round(+v); return isFinite(v) && v > 0 ? Math.min(hi, v) : 0; }
DS.standFixRec = function (h) {      // 기록 칸 거르기 (save.eg.stand · hist 의 줄 모두)
  var o = { w: nat(h.w, 999), r: nat(h.r, 999), b: nat(h.b, 9999), k: nat(h.k, 99999), t: nat(h.t, 1e7), last: clean(h.last, 16) };
  o.r = Math.max(o.r, o.w); o.p = +h.p >= ST.minY && +h.p <= ST.maxY ? Math.round(+h.p) : DS.standPeace(o.w);
  if (+h.lp >= 1) o.lp = Math.round(+h.lp);
  return o;
};
DS.standOf = function (s) { var e = s && s.eg, st = e && e.stand; return st && typeof st === 'object' && +st.g === (e.gen || 1) ? st : null; };      // 이 대의 것 (치르는 중이거나 끝냈다)
DS.standDone = function (s) { var st = DS.standOf(s); return st && !st.on ? st : null; };
DS.standOn = function (s) { var st = DS.standOf(s); return !!(st && st.on); };
DS.standHist = function (s) { var e = s && s.eg; return ((e && e.hist) || []).filter(function (h) { return h && h.w != null; }); };
DS.standBest = function (s) { var b = null; DS.standHist(s).forEach(function (h) { if (!b || h.w > b.w) b = h; }); return b; };
DS.standYears = function (s) { var d = DS.standDone(s); return d ? d.p : (DS.EG ? DS.EG.years : 20); };      // 이번에 열 창의 길이
DS.standMark = function (s, seed) {
  var e = E(s); e.stand = { g: e.gen || 1, on: 1, w: 0, r: 0, b: 0, k: 0, t: 0, last: '', at: Math.round(+s.time || 0), seed: Math.round(+seed || 0) || 1 };
  return e.stand;
};
DS.standNote = function (s, std) { var st = DS.standOf(s); if (!st || !st.on || !std) return st; st.w = std.w; st.r = std.n; st.b = std.b; st.k = std.k; st.t = Math.round((std.over || 0) - std.t0) || st.t; return st; };
// 끝: 표를 닫고 그 대의 hist 줄에 적고, 가문 기록(연대기)에 한 줄. 돌려주는 것: 닫은 기록
DS.standClose = function (s, rec, late) {
  var e = E(s), g = e.gen || 1, r = DS.standFixRec(rec || {}), st = DS.standOf(s) || {};
  r.lp = heroPid(s) || r.lp;
  e.stand = { g: g, on: 0, w: r.w, r: r.r, b: r.b, k: r.k, t: r.t, last: r.last, p: r.p, at: st.at || 0 };
  if (late) e.stand.late = 1;
  if (r.lp) e.stand.lp = r.lp;
  if (!Array.isArray(e.hist)) e.hist = [];
  var h = e.hist.filter(function (x) { return x && +x.g === g; })[0];
  if (!h) { h = { g: g, t: Math.max(0, Math.round((+s.time || 0) - (e.t0 || 0))) }; e.hist.push(h); e.hist.sort(function (a, b) { return a.g - b.g; }); }
  h.w = r.w; h.r = r.r; h.b = r.b; h.p = r.p; h.last = r.last; if (r.lp) h.lp = r.lp;
  var lg = s.lin && s.lin.log;
  if (Array.isArray(lg) && r.lp) { lg.push({ t: 'stand', s: Object.keys(s.cleared || {}).length, tm: Math.round(+s.time || 0), a: r.lp, x: { w: r.w, p: r.p, g: g, at: '어스름의 문' } }); if (lg.length > 300) lg.splice(0, lg.length - 300); }
  return e.stand;
};
// 읽을 때 (DS.egFix 가 부른다): 표가 「치르는 중」이면 그때까지 막은 물결로 끝낸다 (다시 싸우지 않는다) · 체력은 가득 (싸움에서만 빠졌다)
DS.standFix = function (s) {
  var e = s && s.eg; if (!e) return;
  var st = e.stand;
  if (!st || typeof st !== 'object' || Array.isArray(st) || !(+st.g >= 1)) { delete e.stand; return; }
  var g = Math.round(+st.g), on = !!st.on, late = !!st.late, at = Math.max(0, Math.round(+st.at || 0)), seed = Math.round(+st.seed || 0), r = DS.standFixRec(st);
  e.stand = { g: g, on: on ? 1 : 0, w: r.w, r: r.r, b: r.b, k: r.k, t: r.t, last: r.last, p: r.p, at: at };
  if (seed) e.stand.seed = seed; if (late) e.stand.late = 1; if (r.lp) e.stand.lp = r.lp;
  if (on && g === (e.gen || 1) && s.chars) {
    DS.standClose(s, e.stand, true);
    DS.charList(s).forEach(function (c) { if (c.hp != null) c.hp = 1; c.mp = 1; }); (s.mercs || []).forEach(function (m) { m.hp = 1; });
  } else if (on) e.stand.on = 0;
};
// 기기 기록 (메타 egs): 같은 씨앗 · 같은 대면 그 기록이 이긴다 (싸우기 전 저장으로 되돌려 다시 싸우는 길을 막는다)
DS.standMeta = function (s) { try { var m = DS.Save && DS.Save.meta && DS.Save.meta().egs, e = E(s); return m && m.seed === e.seed && m.g === (e.gen || 1) ? m : null; } catch (x) { return null; } };
DS.standMetaSet = function (s, rec, on) { try { var e = E(s); if (DS.Save && DS.Save.setMeta) DS.Save.setMeta({ egs: { seed: e.seed, g: e.gen || 1, w: rec ? rec.w || 0 : 0, r: rec ? rec.r || rec.n || 0 : 0, b: rec ? rec.b || 0 : 0, on: on ? 1 : 0 } }); } catch (x) {} };

// ── 글 (말투: docs/STORY_BIBLE_2.4.md · 한 줄 40자 안쪽 · 머리 위 글 16자 안쪽) ──
//   {a} 이름 · {ww} 「열일곱 번」 · {yw} 「열일곱 해」 · {n} 대 · {w} 수. 조사는 {a}{이가} 꼴
var TX = DS.STAND_TXT = {
  title: '마지막 물결', sub: '마지막 물결', ban: '어스름의 문 앞, 넘겨주기 전의 싸움',
  fallT: '이 싸움에서만 빠진다', rest: '숨을 고른다. 다음 물결이 온다', press: '물결이 겹쳐 밀려온다', clearF: '막았다',
  quitB: '내려놓기', quitH: '칼을 내려놓을까?', quitP: '지금까지 막은 물결 {w}번이 이 대의 기록이 된다. 다시 싸울 수 없다.', quitY: '내려놓는다', quitN: '더 싸운다',
  quest: '물결 {n} · 막은 물결 {w} · 남은 이 {k}명', questRest: '숨 돌리기 · 막은 물결 {w} · 남은 이 {k}명', questEnd: '막은 물결 {w}',
  wave: '물결 {n}',
  heroN: '이름 잃은 {t}', heroF: '이름을 잃은 영웅이 어스름 편에 섰다', heroT: '이름 잃은 영웅',
  rageT: '광폭화 {e}단계', rageS: '물결 {n}의 적이 {p}% 더 세게 친다', rageF: '광폭 {e}',
  rageIn: '광폭까지 {s}초', rageNext: '광폭 {e}단계 · 다음 단계까지 {s}초', rageMax: '광폭 {e}단계 · 끝까지 거세다',
  waveL: ['문틈이 운다', '아직 가볍다. 아직은', '발밑이 울린다', '보스가 둘이다', '하늘이 어두워진다', '숨이 차오른다', '방패에 금이 간다', '어스름이 웃는다', '이름을 부르며 버틴다',
          '물결이 겹친다', '칼이 무거워진다', '발이 땅에 붙는다', '어스름이 숨을 들이쉰다', '그래도 선다', '문틈이 넓어진다', '누가 아직 서 있나', '셀 수가 없다', '한 번만 더',
          '눈을 감아도 보인다', '끝이 없다'],
  waveM: '막으면 {yw}', waveX: '이제 해를 세지 않는다',
  mar: ['악! 물결 {n}이라는 것이다!', '악! 열외는 없다는 것이다!', '악… 아직 기합은 있다는 것이다'],
  fall: ['…조금만 쉰다', '다음은 너희가 막아라', '칼이 무겁다', '여기까지다', '먼저 앉는다', '…문을 부탁한다', '숨이… 차다', '한 번만 더… 못 하겠다', '아이들은 뒤로', '아직 안 졌다'],
  fallHero: ['…깃대는 세워 둬라', '다들 버텨라', '넘겨줄 게 많은데'], fallKin: ['…조금만 눕겠습니다', '다음엔 더 버틸게요', '무섭지 않아요'], fallMar: ['악… 열외를 신청한다는 것이다'],
  endT: '물결이 넘쳤다', endS: '물결 {w}번을 막았다', endS0: '한 번도 막지 못했다', endQ: '칼을 내려놓았다',
  // 결과 창
  rEye: '{n}대째의 마지막 물결', rTitle: '물결 {w}번', rTitle0: '물결을 막지 못했다',
  rW: '막은 물결', rR: '닿은 물결', rB: '쓰러뜨린 보스', rT: '버틴 시간', rLast: '끝까지 선 이 {a}', rLastQ: '모두 칼을 내려놓았다',
  rPeace: '어스름은 {yw} 동안 문 앞에 오지 못한다.', rPeace0: '그래도 문은 {yw} 동안 닫혀 있다.',
  rBest: '가문의 기록이다. 지난 기록은 {b}번.', rBest1: '가문의 첫 기록이다.', rBestKeep: '가문의 기록은 {n}대째의 {b}번.', rLate: '싸우는 도중에 끝났다. 그때까지 막은 물결로 적는다.', rGo: '계속',
  rMeta: '이 대의 마지막 물결은 이미 치렀다. 그때의 기록으로 이어 간다.',
  // 확인 창
  cH: '마지막 물결', cL: ['싸우는 이 {k}명. 맹주와 가주 {c}, 가문원 {m}.', '물결마다 보스와 무리가 는다. 한 대에 한 번뿐이다.', '한 물결을 35초 안에 막지 못하면 적이 광폭해진다. 12초마다 한 단계씩, 20%씩 더 세진다.', '쓰러져도 죽지 않는다. 그 싸움에서만 빠진다.', '막은 물결만큼 평화가 이어진다. {lo}에서 {hi}까지.'],
  // 연대기
  chron: '{a}{이가} 어스름의 문 앞에서 물결을 {ww} 막았다. 평화 {yw}.', chron0: '{a}{이가} 어스름의 문 앞에 섰다. 물결은 금방 넘쳤다. 평화 {yw}.',
  poster: '물결 {w}', posterBest: '마지막 물결 최고'
};
function bat(w) { w = String(w).replace(/[」』"'\)\]\s.…]+$/, ''); var c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : (/[013678]$/.test(w) ? 1 : 0); }
function jo(w, pair) { if (pair === '으로') { var b = bat(w); return b && b !== 8 ? '으로' : '로'; } return bat(w) > 0 ? pair[0] : pair[1]; }
function fillT(t, v) { return String(t == null ? '' : t).replace(/\{(\w+)\}(\{(이가|은는|을를|과와|으로)\})?/g, function (all, k, j, pair) { var w = v && v[k] != null ? String(v[k]) : ''; return w + (pair ? jo(w, pair) : ''); }); }
DS.standFill = fillT;
// 연대기 한 줄 (가문 기록의 stand 사건)
var ev0 = DS.linEvText;
if (ev0) DS.linEvText = function (s, e) {
  if (e && e.t === 'stand') { var x = e.x || {}, a = DS.linName ? DS.linName(s, e.a) : ''; return fillT(+x.w > 0 ? TX.chron : TX.chron0, { a: a || '맹주', ww: DS.standWW(+x.w || 0), yw: DS.standYW(+x.p || ST.minY) }); }
  return ev0(s, e);
};
DS.standWaveTitle = function (n) { return fillT(TX.wave, { n: n }); };
DS.standWaveLine = function (n) {
  if (n % 5 === 0) return n <= ST.maxY ? fillT(TX.waveM, { yw: DS.standYW(n) }) : TX.waveX;
  var L = TX.waveL; return L[Math.min(L.length - 1, n - 1)];
};
DS.standQuest = function (std) {
  if (!std) return TX.title;
  var sim = DS.G && DS.G.sim, k = sim && sim.std === std ? std.allies(sim).length : std.liveN || 0;
  if (std.done) return fillT(TX.questEnd, { w: std.w });
  return fillT(std.rest ? TX.questRest : TX.quest, { n: std.n || 1, w: std.w, k: k });
};
function hsh(t) { t = String(t); var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = (h * 16777619) >>> 0; } return h; }
DS.standFallWord = function (s, u, nm, i) {
  var L = u.role === 'merc' ? TX.fallKin : u.ch === +s.hero ? TX.fallHero : u.cls === 'mar' ? TX.fallMar : null, pool = L && (hsh(nm) + i) % 3 !== 2 ? L : TX.fall;
  return pool[(hsh(nm + ':' + i)) % pool.length];
};

// ── 화면 (브라우저에서만) ──
if (typeof document === 'undefined') return;
var U = DS.ui; if (!U) return;
var G = DS.G, esc = U.esc;
function sv() { return G.save; }
function persist() { try { U.persist(); } catch (x) {} }
function calm() { return !!(DS.calmFx && DS.calmFx()); }
function heroNm(s) { try { return s.name || DS.charName(s.chars[s.hero]); } catch (x) { return '맹주'; } }
function say(k, t, x) { var l = DS.say ? DS.say(k, t) : { w: k, t: t }; if (x) for (var q in x) l[q] = x[q]; return l; }
// 문 앞에 서기 전: 선대 단톡방 · 먼동의 메아리 · 줄을 선 가문
DS.standIntroLines = function (s) {
  var R = DS.standRoster(s), names = R.map(function (u) { return u.stdN || u.name || ''; }).filter(Boolean), kin = R.filter(function (u) { return u.role === 'merc'; }).length, g = DS.egGen(s), hn = heroNm(s), more = Math.max(0, names.length - 10);
  var show = names.slice(0, 10), roll = show.join('. ') + '.' + (more ? ' 그리고 ' + more + '명.' : '');
  var out = [
    '어스름의 문 앞. 문은 닫혀 있다. 그런데 문틈이 운다.',
    fillT('{a}{은는} 문 앞에 깃대를 꽂았다. 넘겨주기 전에 할 일이 하나 남았다.', { a: hn }),
    say('chat', '문틈 소리 들리냐. 넘어오려는 거다.'),
    say('chat', '물결로 온다. 막는 만큼 늦게 온다.'),
    '문틈 너머에서 낯익은 목소리가 울린다. 먼동이 문 안에 있던 날의 메아리다.',
    { w: '먼동의 메아리', c: 'elder_mundong', t: '…혼자 서지 마라. 혼자 서면 혼자 남는다.' },
    say('hero', '이번에는 다 같이 섭니다.'),
    '깃발이 줄을 섰다.',
    { t: roll, roll: show },
    say('mar', '악! 전원 집합이라는 것이다! 열외는 없다는 것이다!', { a: '악! 산 사람 전원 집합이라는 것이다! 선대도 집합이라는 것이다!' })
  ];
  if (kin) out.push('아이들도 칼을 들었다. 칼을 쥐는 것은 오늘이 마지막이다.');
  out.push(say('hero', '물결을 막는 만큼, 아이들이 칼 없이 자랍니다.'));
  out.push(say('chat', g > 1 ? '지난 대는 몇 번 막았더라. 장부 펴 봐라.' : 'ㅋㅋ 몇 번 막나 보자. 내기 건다.'));
  out.push(say('memo', '물결마다 보스와 무리가 는다. 그 물결의 보스를 모두 쓰러뜨리면 막은 것이다. 35초 안에 못 막으면 그 물결의 적이 광폭해져 갈수록 세게 친다. 쓰러진 이는 이 싸움에서만 빠진다.'));
  return out;
};
// 끝난 뒤: 기록이 평화의 해가 된다
DS.standOutroLines = function (s, rec) {
  var w = rec.w || 0, p = rec.p || DS.standPeace(w), v = { ww: DS.standWW(w), yw: DS.standYW(p), a: rec.last || '' }, hn = heroNm(s), best = rec.prevBest, out = [];
  out.push(rec.last ? '마지막 사람이 무릎을 꿇었다. 그 순간 문틈이 조용해졌다.' : '모두 칼을 내려놓았다. 문틈이 조용해졌다.');
  if (rec.last) out.push(fillT('{a}{이가} 끝까지 서 있었다.', v));
  if (w > 0) out.push(fillT('물결을 {ww} 막았다. 어스름은 {yw} 동안 문 앞에 오지 못했다.', v));
  else out.push(fillT('물결을 한 번도 막지 못했다. 그래도 문은 {yw} 동안 닫혀 있었다.', v));
  if (w >= ST.maxY) out.push(say('chat', '…셀 손가락이 모자란다. 장부에 굵게 써라.'));
  else if (w >= 20) out.push(say('chat', fillT('{ww}. 장부에 굵게 쓴다.', v)));
  else if (w >= 10) out.push(say('chat', fillT('{ww}. 나쁘지 않다. 우리 때보다 낫다.', v)));
  else out.push(say('chat', 'ㅋㅋ 짧다. 그래도 적어 둔다. 다음 대는 더 막는다.'));
  if (best != null && w > best) out.push(say('chat', fillT('지난 기록 {b}번을 넘었다. 내기는 내가 졌다.', { b: best })));
  out.push(say('dawn', fillT('{yw}{이가} 지나면 아이들이 다 큰다. 칼은 내려놔라.', v)));
  out.push(say('hero', '네. 이제 넘겨주겠습니다.'));
  out.push(say('mar', '악! 칼을 내려놓는 것도 기합이라는 것이다!', { a: '악… 내려놓는 법은 나도 몰랐다는 것이다.' }));
  out.push(fillT('그날 밤, 모두 칼을 씻어 벽에 걸었다. 다시 꺼낼 날은 {yw} 뒤다.', v));
  return out;
};
// 결과 창 (끝나면 · 꺼졌다 다시 열 때 · 이미 치렀을 때)
DS.standResult = function (s, rec, cb, o) {
  o = o || {};
  var w = rec.w || 0, p = rec.p || DS.standPeace(w), g = rec.g || DS.egGen(s), cu = function (n) { return '<b class="num" data-cu="' + n + '">' + n + '</b>'; };
  var hist = DS.standHist(s).filter(function (h) { return h.g !== g; }), best = null; hist.forEach(function (h) { if (!best || h.w > best.w) best = h; });
  var bl = best ? (w > best.w ? fillT(TX.rBest, { b: best.w }) : fillT(TX.rBestKeep, { n: best.g, b: best.w })) : TX.rBest1;
  var mm = Math.floor((rec.t || 0) / 60), ss = (rec.t || 0) % 60;
  var h = '<div class="result stdres' + (w >= 20 ? ' high' : '') + '"><div class="std-sky" aria-hidden="true"></div><p class="eyebrow">' + esc(fillT(TX.rEye, { n: g })) + '</p><h2>' + esc(w > 0 ? fillT(TX.rTitle, { w: w }) : TX.rTitle0) + '</h2>' +
    '<div class="recn std-n"><span><b>' + cu(w) + '<small>번</small></b><i>' + esc(TX.rW) + '</i></span><span><b>' + cu(Math.max(rec.r || 0, w)) + '<small>번</small></b><i>' + esc(TX.rR) + '</i></span>' +
    '<span><b>' + cu(rec.b || 0) + '</b><i>' + esc(TX.rB) + '</i></span><span><b><b class="num">' + mm + '</b><small>분 </small><b class="num">' + ss + '</b><small>초</small></b><i>' + esc(TX.rT) + '</i></span></div>' +
    '<p class="std-last">' + esc(rec.last ? fillT(TX.rLast, { a: rec.last }) : TX.rLastQ) + '</p>' +
    '<p class="std-peace">' + esc(fillT(w > 0 ? TX.rPeace : TX.rPeace0, { yw: DS.standYW(p) })).split(esc(DS.standYW(p))).join('<b>' + esc(DS.standYW(p)) + '</b>') + '</p>' +
    '<p class="dim std-best">' + esc(bl) + '</p>' + (o.late ? '<p class="dim">' + esc(TX.rLate) + '</p>' : '') + (o.meta ? '<p class="dim">' + esc(TX.rMeta) + '</p>' : '') +
    '<button class="btn gold wide" data-close>' + esc(TX.rGo) + '</button></div>';
  var ov = U.overlay(h, 'modal center stdov' + (calm() ? ' calm' : ''));
  if (U.hydrate) U.hydrate(ov);
  setTimeout(function () { [].slice.call(ov.querySelectorAll('[data-cu]')).forEach(function (el, i) { setTimeout(function () { if (U.countUp) U.countUp(el, +el.dataset.cu, 700); }, i * 160); }); }, calm() ? 0 : 300);
  rec.prevBest = best ? best.w : null;
  ov.onclose = function () { if (cb) cb(); };
  return ov;
};
// 결과 → 맺음 → 창 (egStart). 그다음 마을로 (창은 마을에 들어서면 열린다)
var busy = false;      // 결과 · 맺음이 떠 있는 동안 (꺼졌다 연 판의 안내가 겹쳐 뜨지 않게)
function after(s, rec, o, leave) {
  busy = true;
  DS.standMetaSet(s, rec, 0);
  DS.standResult(s, rec, function () {
    U.story(DS.standOutroLines(s, rec), function () {
      busy = false;
      if (leave) leave();      // 싸움터를 걷고 마을로 (그래야 창을 열 수 있다)
      var r = DS.egStart(s); persist();
      if (r) setTimeout(function () { if (DS.egPassOn(s) && !document.querySelector('.ov.egpass')) DS.egPassOpen(s); }, leave ? 500 : 0);
      else U.toast((DS.egCanStart(s) || {}).why || '', 3000);
    }, TX.title);
  }, o);
}
DS.standGo = function (S) {
  S = S || sv(); var can = DS.egCanStart(S);
  if (!can.ok) { U.A('cancel'); U.toast(can.why, 3000); return null; }
  var d = DS.standDone(S);
  if (d) { after(S, d, { late: !!d.late }); return null; }
  var m = DS.standMeta(S);
  if (m) { var rc = DS.standClose(S, { w: m.w, r: m.r, b: m.b }, true); persist(); after(S, rc, { meta: 1 }); return null; }      // 기기에 남은 기록: 되돌린 저장이다. 다시 싸우지 않는다
  U.story(DS.standIntroLines(S), function () {
    var seed = ((Date.now() & 0x3fffffff) ^ ((S.eg && S.eg.seed) || 0)) >>> 0 || 1;
    DS.standMark(S, seed); DS.standMetaSet(S, null, 1); persist();
    var go = function () { if (DS.standScene) DS.standScene(seed); };
    if (DS.stageFade) DS.stageFade(go, 520); else go();      // 검게 가라앉았다가 문 앞에서 걷힌다
  }, TX.title);
  return true;
};
// 싸움이 끝났다 (game.js 가 stdEnd 에 부른다): 기록을 닫고, 세상이 잠깐 느려진 뒤 결과 · 맺음 · 창
DS.standFinale = function (S, std, leave) {
  var rec = std.rec(); if (!rec.last && !std.lastId) rec.last = '';
  var cl = DS.standClose(S, rec); DS.standMetaSet(S, rec, 0); persist();
  rec.p = cl.p;
  if (G.view) G.view.stdFin = G.view.time || 0;
  setTimeout(function () { if (DS.vban) DS.vban('lose', std.lastId ? TX.endT : TX.endQ, rec.w > 0 ? fillT(TX.endS, { w: rec.w }) : TX.endS0, calm() ? 1400 : 2000); U.A('slam'); if (DS.Audio.bgm) DS.Audio.bgm('mourn'); }, calm() ? 200 : 900);
  setTimeout(function () { G.ending = true; after(S, rec, {}, leave); }, calm() ? 1800 : 3400);
};
// 꺼졌다 다시 연 판: 마을에 들어서면 결과를 보이고 창으로 (enterZone 이 부른다)
DS.standLate = function (s) { var d = DS.standDone(s); return !!(d && d.late && !(s.eg && s.eg.pass)); };
DS.standLateGo = function (s) {
  s = s || sv(); var d = DS.standDone(s); if (busy || !d || !DS.standLate(s) || document.querySelector('.ov.stdov')) return;
  var can = DS.egCanStart(s); if (!can.ok) return;
  after(s, d, { late: 1 });
};
// 물결이 오면: 기록 (닿은 물결) · 하늘
DS.standOnWave = function (s, std, e) { var st = DS.standOf(s); if (st && st.on) { st.r = e.n; } if (G.view) G.view.stdN = e.n;
  var mar = G.sim && G.sim.units.filter(function (u) { return !u.dead && u.side === 'ally' && u.role === 'cmd' && u.cls === 'mar'; })[0];
  if (mar && e.n % 5 === 0 && G.view && G.view.bark) G.view.bark(mar.id, fillT(TX.mar[(e.n / 5 - 1) % TX.mar.length], { n: e.n }), 2.6);
};
// 2.9.1 광폭: 띠 · 보스 머리 위 글 · 목표 줄 밑의 초 세기 (game.js 가 stdEnrage 에 부른다)
DS.standOnRage = function (std, e) {
  var v = { e: e.e, n: e.n, p: e.p };
  if (DS.vban) DS.vban('rage', fillT(TX.rageT, v), fillT(TX.rageS, v), calm() ? 1100 : 1500);
  U.A(e.e >= 3 ? 'slam' : 'warn');
  var sim = G.sim; if (sim && G.view) sim.units.forEach(function (u) { if (!u.dead && u.side === 'enemy' && u.std === 'b' && u.stdW === e.n) G.view.float(u.x + ((u.fw || 1) - 1) / 2, u.y, fillT(TX.rageF, v), '#ff4d6d', { dy: -26, life: 1.8 }); });
  if (G.view && !calm()) G.view.rageHit = 1;
  rageChip();
};
function rageChip() {
  var sg = document.getElementById('s-game'), std = G.stand && G.stand.std, sim = G.sim, el = document.getElementById('stdrage');
  if (!sg || !std || !sim || sim.std !== std || std.done || G.stand.fin) { if (el) el.remove(); return false; }
  var cur = std.open.length ? std.open[std.open.length - 1] : null;
  if (!cur || std.rest) { if (el) el.className = ''; return true; }
  if (!el) { el = document.createElement('div'); el.id = 'stdrage'; el.setAttribute('aria-live', 'off'); sg.appendChild(el); }
  var q = document.getElementById('quest'), sgr = sg.getBoundingClientRect(); if (q) { var r = q.getBoundingClientRect(); el.style.top = Math.round(r.bottom - sgr.top + 4) + 'px'; }
  var dt = sim.t - cur.t0, e = std.rg[cur.n] || 0, Q = ST.rage, left = Math.max(0, Math.ceil(DS.standRageAt(e) - dt)), t;
  if (e >= Q.max) t = fillT(TX.rageMax, { e: e }); else if (e > 0) t = fillT(TX.rageNext, { e: e, s: left }); else t = fillT(TX.rageIn, { s: left });
  if (el.textContent !== t) el.textContent = t;
  el.className = 'on' + (e > 0 ? ' hot' : left <= 10 ? ' warn' : '');
  return true;
}
DS.standRageChip = rageChip;
var rageIv = null;
DS.standRageWatch = function () { if (rageIv) clearInterval(rageIv); rageIv = setInterval(function () { if (!rageChip()) { clearInterval(rageIv); rageIv = null; } }, 250); };
// 2.9.1 이름 잃은 영웅이 섞였다: 머리 위 이름 · 처음 한 번은 알림
DS.standOnHero = function (std, e) {
  var sim = G.sim, u = sim && sim.byId[e.id]; if (!u) return;
  if (G.view) G.view.float(u.x, u.y, u.name, '#c79bff', { dy: -24, life: 2.4, delay: 0.4 + e.k * 0.3 });
  if (e.first) setTimeout(function () { U.toast(TX.heroF, 2600); }, 1900);
};
// 확인 창에 한 칸 (endgame.js confirmHtml 이 부른다)
DS.standConfirm = function (s) { var C = DS.standCount(s); return { h: TX.cH, L: TX.cL.map(function (t) { return fillT(t, { k: C.all, c: C.cmd, m: C.kin, lo: DS.standYW(ST.minY), hi: DS.standYW(ST.maxY) }); }) }; };

// ── 장면의 결: 물결이 오를수록 하늘이 어두워진다 · 누가 쓰러지면 가장자리가 잿빛으로 조인다 · 남은 이가 적으면 심장이 뛴다 · 마지막에는 어둠이 내려앉는다 ──
DS.standView = function (v, std) { if (!v) return; v.std = std || null; v.stdN = 0; v.stdDark = 0; v.stdHit = 0; v.stdFin = null; v.stdBeat = 0; };
var VP = DS.View && DS.View.prototype;
if (VP) {
  VP.standFall = function (u) { this.stdHit = 1; if (!this.lite && !calm()) this.burst(u.x, u.y, ['#8f9ab3', '#cdd5e3', '#4a4458'], 10, { spd: 22, up: 16, life: 0.8 }); };
  VP.drawStand = function (g, dt) {
    var std = this.std; if (!std) return;
    var cm = calm(), W = this.W, H = this.H, n = std.n || 0, sim = this.sim;
    if (this.rageHit > 0) { this.rageHit = Math.max(0, this.rageHit - dt * 1.6); g.fillStyle = 'rgba(160,10,30,' + (this.rageHit * 0.28).toFixed(3) + ')'; g.fillRect(0, 0, W, H); }      // 2.9.1 광폭: 붉게 번쩍
    var want = Math.min(0.42, 0.028 * n) + (std.done ? 0.3 : 0);
    this.stdDark = (this.stdDark || 0) + (want - (this.stdDark || 0)) * Math.min(1, dt * 1.5);
    var live = 0, tot = 0; if (sim) sim.units.forEach(function (u) { if (u.side === 'ally' && (u.role === 'cmd' || u.role === 'merc')) { tot++; if (!u.dead) live++; } });
    std.liveN = live;
    var few = !std.done && tot > 1 && live <= Math.max(1, Math.ceil(tot / 4));
    this.stdHit = Math.max(0, (this.stdHit || 0) - dt * 0.6);
    var a = this.stdDark, hit = this.stdHit, beat = 0;
    if (few && !cm) { var ph = (this.time * 1.1) % 1; beat = Math.exp(-ph * 9) * 0.5; if (this.stdPh != null && ph < this.stdPh && (this.stdBeat || 0) < 40 && this.sfx) { this.stdBeat = (this.stdBeat || 0) + 1; this.sfx('heart'); } this.stdPh = ph; }
    if (a < 0.01 && hit < 0.01 && !few) return;
    if (this.lite) { g.fillStyle = 'rgba(10,6,22,' + (a * 0.6 + hit * 0.15).toFixed(3) + ')'; g.fillRect(0, 0, W, H); return; }
    var gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.22, W / 2, H / 2, Math.max(W, H) * 0.72);
    gr.addColorStop(0, 'rgba(10,6,22,' + (a * 0.35).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(' + (few ? '40,6,12' : '10,6,22') + ',' + Math.min(0.85, a + hit * (cm ? 0.2 : 0.45) + (few ? 0.18 + beat : 0)).toFixed(3) + ')');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  };
}
DS.standUiReady = true;
})();
