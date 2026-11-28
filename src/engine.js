// 열 개의 깃발 — 실시간 틱(행동) 게이지 전투 엔진
// 마을·필드·시나리오가 모두 같은 엔진 위에서 돈다. 화면 없이(Node) 돌려서 균형을 맞출 수 있다.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var TK = DS.TICK, SK = DS.SKILLS, MT = DS.MT, STEP = 0.05;
var DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// 엔진 행동 스위치의 기본값 (meta.js 의 DS.BAL 에 이미 있으면 그 값을 따른다). 끄면 2.7.0 과 같은 행동 — tools/eng/hash.js 로 확인한다.
//   cmdCast: 자동 지휘관이 평타를 참고 기술 게이지를 모은다 (P.cmdFire)
DS.BAL = DS.BAL || {};
if (DS.BAL.cmdCast == null) DS.BAL.cmdCast = true;
//   mercAI: 용병 종류별 행동 — 궁수류 거리 유지(P.kite), 방패 용병의 도발(P.taunt), 다친 용병은 치유하는 이 곁으로 물러남, 고유 기술 용병의 기술 아끼기
if (DS.BAL.mercAI == null) DS.BAL.mercAI = true;      // 앞장 태세에서만 (곁에 태세는 2.7.0 그대로)
//   fix28: 2.8.0 의 자잘한 행동 고침 (용병이 주인 줄 끝에서 오가던 핑퐁 …). 끄면 2.7.0 그대로
if (DS.BAL.fix28 == null) DS.BAL.fix28 = true;
// ── r8 engine (3.3.0) ── 셋 다 끄면 3.2.1 과 같은 행동 (tools/eng/hash.js 를 PATCH=r8off 로 돌려 확인한다)
//   ordSafe: 명령(공격·기술·아이템)을 쥔 지휘관도 붉은 칸은 피하고, HP 30% 아래면 약초부터 먹는다 (P.ordGuard). 직접 찍은 이동만 지금처럼 무엇보다 먼저.
if (DS.BAL.ordSafe == null) DS.BAL.ordSafe = true;
//   manHerb: 「수동」으로 둔 지휘관도 싸움 중 HP 30% 아래면 제 약초는 먹는다 (회피는 원래 했다 — 약초만 빠져 있었다)
if (DS.BAL.manHerb == null) DS.BAL.manHerb = true;
//   cmdBest: 자동 지휘관의 공격 기술을 "목록에서 지금 되는 첫 기술"이 아니라 "가장 좋은 후보"로 고른다 (P.bestSkill). 치유·정화·소환의 차례와 판단은 그대로.
if (DS.BAL.cmdBest == null) DS.BAL.cmdBest = true;
//   skTune: 기술 표의 하위 호환 정리 (data.js 의 DS.SK_R8 — 조준 사격 틱 50→45, 짧은 호령 12·15초→20·25초). DS.skTune(false) 로 3.2.1 값.
if (DS.BAL.skTune == null) DS.BAL.skTune = true;
if (DS.skTune) DS.skTune(DS.BAL.skTune);
// ── r32 필살기: 유닛의 u.ult(기술 id) · u.uc(필살 게이지 0~100) · u.ultP(세기 배율) · u.ultR(차는 빠르기). 끄면(DS.BAL.ult=false) 사양이 ult 를 싣지 않아 그 전과 똑같다.
//   게이지는 싸움 중에만 찬다 (DS.ULT.charge 초에 100). 때리면 hitGain, 맞으면 받은 피해 ÷ 최대 체력 × hurtGain 만큼 더. 쓰면 0. 엔진 난수는 부르지 않는다.
if (DS.BAL.ult == null) DS.BAL.ult = true;
if (DS.BAL.healAlly == null) DS.BAL.healAlly = 0.5;      // 2.1.1: 우리 편 치유 기술·치유 용병의 회복량 배율 (사용자 「힐러가 너무 사기 — 절반쯤」). 필살기·소모품·흡혈·장비 재생은 그대로, 적의 치유도 그대로
//   r36 (1.3.0): 필살기는 맹주만 지니고(DS.ultSpec), 사람이 눌러야만 나간다 — 자동 조작·전체 자동에서도 스스로 쓰지 않는다 (가득 찬 게이지는 그대로 기다린다).
//   DS.BAL.ultAuto = true 는 검사 도구(봇)만 켠다: 사람이 가득 차면 누른다고 치고 옛 자동 판단(P.aiUlt)을 그대로 쓴다.
if (DS.BAL.ultAuto == null) DS.BAL.ultAuto = false;

// ── 2.3.0 큰 몸 (여러 칸을 차지하는 유닛): u.fw × u.fh 칸, (u.x, u.y) 는 왼쪽 위 칸. 없으면 한 칸.
//   거리는 두 몸의 가장 가까운 칸 사이 (맨해튼) — 큰 보스는 어느 칸에 붙어도 붙은 것이고, 사거리도 가장 가까운 칸까지 잰다 (서로 같다).
//   차지: 모든 칸에 occ 를 둔다 (P.place · P.unplace). 다른 무엇도 그 칸에 서지 못한다. 길 찾기는 왼쪽 위 칸으로 하되 몸 전체가 들어가는 자리만 (P.fits).
//   밀기 · 끌기 · 자리 바꾸기는 큰 몸에 듣지 않는다 (버틴다). 순간 이동 · 도약 · 돌진은 몸 전체가 들어가는 자리로만 — 겹침은 없다.
function fwOf(u) { return u.fw || 1; }
function fhOf(u) { return u.fh || 1; }
function isBig(u) { return !!u && ((u.fw || 1) > 1 || (u.fh || 1) > 1); }
function dist(a, b) {
  if (!(a.fw || a.fh || b.fw || b.fh)) return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);      // 한 칸끼리 (거의 모든 경우)
  var aw = a.fw || 1, ah = a.fh || 1, bw = b.fw || 1, bh = b.fh || 1;
  return Math.max(0, a.x - (b.x + bw - 1), b.x - (a.x + aw - 1)) + Math.max(0, a.y - (b.y + bh - 1), b.y - (a.y + ah - 1));
}
// 칸 (x, y) 에서 v 의 몸까지
function dt(x, y, v) { var bw = v.fw || 1, bh = v.fh || 1; return Math.max(0, v.x - x, x - (v.x + bw - 1)) + Math.max(0, v.y - y, y - (v.y + bh - 1)); }
// u 의 몸을 (x, y) 에 두었을 때 v 의 몸까지
function rd(x, y, u, v) { var aw = u.fw || 1, ah = u.fh || 1, bw = v.fw || 1, bh = v.fh || 1; return Math.max(0, x - (v.x + bw - 1), v.x - (x + aw - 1)) + Math.max(0, y - (v.y + bh - 1), v.y - (y + ah - 1)); }
// v 의 몸에서 (x, y) 에 가장 가까운 칸
function nearT(v, x, y) { var bw = v.fw || 1, bh = v.fh || 1; return { x: Math.max(v.x, Math.min(v.x + bw - 1, x)), y: Math.max(v.y, Math.min(v.y + bh - 1, y)) }; }
DS.fpDist = dist; DS.fpBig = isBig; DS.fpNear = nearT; DS.fpTile = dt;
DS.fpCx = function (u) { return u.x + ((u.fw || 1) - 1) / 2; }; DS.fpCy = function (u) { return u.y + ((u.fh || 1) - 1) / 2; };
function has(u, tag) { return u.tags && u.tags.indexOf(tag) >= 0; }

function Sim(o) {
  var rows = o.map, x, y, k;
  this.h = rows.length; this.w = rows[0].length; this.mode = o.mode || 'scn';
  var n = this.w * this.h;
  this.kind = new Array(n); this.cst = [new Float32Array(n), new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  for (y = 0; y < this.h; y++) for (x = 0; x < this.w; x++) {
    var kd = DS.TILE_CH[rows[y][x]] || 'plain', i = y * this.w + x;
    this.kind[i] = kd;
    for (k = 0; k < 4; k++) this.cst[k][i] = DS.COST[kd][k];
  }
  this.units = []; this.byId = {}; this.occ = new Array(n).fill(null);
  this.t = 0; this.ev = []; this.tele = []; this.nid = 1; this.rand = DS.rng(o.seed || 7);
  this.leader = null; this.hunt = false; this.result = null; this.objective = o.objective || null;
  this.waves = (o.waves || []).slice(); this.combat = false; this.acc = 0; this.inv = o.inv || {};
  this.mk = o.mk || function (type, opt) { return DS.enemySpec(type, 1, opt); };
  this._d = new Float64Array(n); this._p = new Int32Array(n); this._st = new Int32Array(n); this.stamp = 0;
  this.dz = { ally: new Uint8Array(n), enemy: new Uint8Array(n) };
  this.sq = []; this.zn = []; this._qid = 0;      // 여러 박자 기술: 기다리는 박자(sq) · 남은 자리(zn) — 아래 「여러 박자」
  this.groups = []; this.chk = 0; this.block = o.block || null; this.hz = []; this._hzC = 0;      // 2.3.0: 땅에 남은 위험 (hazard)
  this.seed0 = o.seed || 7; this._ver = 0; this._allyV = -1; this._ally = null; this._us = []; this.swp = 0;      // 명부가 바뀐 횟수, 살아 있는 아군 목록(캐시), 틱마다 쓰는 임시 목록
  var self = this;
  (o.units || []).forEach(function (s) { self.add(s); });
  (o.spawns || []).forEach(function (g) { self.groups.push(g); self.spawnGroup(g); });
}
DS.Sim = Sim;
var P = Sim.prototype;

P.emit = function (e) { this.ev.push(e); };
P.drain = function () { var e = this.ev; this.ev = []; return e; };
P.inb = function (x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; };
P.at = function (x, y) { return this.inb(x, y) ? this.occ[y * this.w + x] : null; };
P.kindAt = function (x, y) { return this.inb(x, y) ? this.kind[y * this.w + x] : 'wall'; };
P.pass = function (mt, x, y) { return this.inb(x, y) && this.cst[MT[mt]][y * this.w + x] > 0 && !(this.block && this.block[y * this.w + x]); };
P.live = function (side) { return this.units.filter(function (u) { return !u.dead && (!side || u.side === side); }); };
P.cmds = function () { return this.units.filter(function (u) { return !u.dead && u.side === 'ally' && u.role === 'cmd'; }); };
P.q = function (u) { var b = u.buffs.quick; return b ? 1 - b.p / 100 : 1; };
P.bf = function (u, s) { var b = u.buffs[s]; return b ? 1 + b.p / 100 : 1; };

// 빈 칸 찾기 (x,y 에서 가까운 순)
P.freeNear = function (x, y, mt, maxR) {
  for (var r = 0; r <= (maxR || 8); r++) {
    var best = null, bd = 1e9;
    for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      var nx = x + dx, ny = y + dy;
      if (!this.pass(mt, nx, ny) || this.occ[ny * this.w + nx]) continue;
      var d = Math.abs(dx) + Math.abs(dy) + this.rand() * 0.3;
      if (d < bd) { bd = d; best = { x: nx, y: ny }; }
    }
    if (best) return best;
  }
  return null;
};
// 2.3.0 큰 몸: 차지 · 비우기 · 들어가는가
P.place = function (u) {
  var w = this.w, W = u.fw || 1, H = u.fh || 1, dx, dy;
  if (W === 1 && H === 1) { this.occ[u.y * w + u.x] = u; return; }
  for (dy = 0; dy < H; dy++) for (dx = 0; dx < W; dx++) this.occ[(u.y + dy) * w + u.x + dx] = u;
};
P.unplace = function (u) {
  var w = this.w, W = u.fw || 1, H = u.fh || 1, dx, dy, j;
  for (dy = 0; dy < H; dy++) for (dx = 0; dx < W; dx++) { j = (u.y + dy) * w + u.x + dx; if (j >= 0 && j < this.occ.length && this.occ[j] === u) this.occ[j] = null; }
};
P.moveTo = function (u, x, y) { this.unplace(u); u.x = x; u.y = y; this.place(u); };
// u 의 몸이 (x, y) 에 들어가는가 — 모든 칸이 지도 안 · 그 이동 방식으로 지나갈 수 있는 땅 · 다른 이가 없음 (mode 2 면 다른 편이 선 칸도 셈하지 않는다 — 길 찾기의 「막혔는가」 가리기)
P.fits = function (u, x, y, mt, mode) {
  var W = u.fw || 1, H = u.fh || 1, w = this.w, c = this.cst[MT[mt || u.mt || 'foot']], blk = this.block, dx, dy, j, o;
  if (x < 0 || y < 0 || x + W > w || y + H > this.h) return false;
  for (dy = 0; dy < H; dy++) for (dx = 0; dx < W; dx++) {
    j = (y + dy) * w + x + dx;
    if (!(c[j] > 0) || (blk && blk[j])) return false;
    o = this.occ[j]; if (o && o !== u && !o.dead && !(mode === 2 && o.side !== u.side)) return false;
  }
  return true;
};
// 몸 전체가 들어가는 가장 가까운 자리 (x, y 는 바라는 왼쪽 위 칸)
P.freeFit = function (u, x, y, maxR, mt) {
  for (var r = 0; r <= (maxR || 8); r++) {
    var best = null, bd = 1e9;
    for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      var nx = x + dx, ny = y + dy;
      if (!this.fits(u, nx, ny, mt)) continue;
      var d = Math.abs(dx) + Math.abs(dy) + this.rand() * 0.3;
      if (d < bd) { bd = d; best = { x: nx, y: ny }; }
    }
    if (best) return best;
  }
  return null;
};
P.add = function (s) {
  var u = {}; for (var k in s) u[k] = s[k];
  if (!u.id) u.id = 'u' + (this.nid++);
  var p = isBig(u) ? (this.freeFit(u, u.x || 0, u.y || 0, 8, 'foot') || this.freeFit(u, u.x || 0, u.y || 0, 14, u.mt || 'foot')) : (this.freeNear(u.x || 0, u.y || 0, 'foot', 6) || this.freeNear(u.x || 0, u.y || 0, u.mt || 'foot', 12));
  if (!p) return null;
  u.x = p.x; u.y = p.y; u.home = { x: u.hx != null ? u.hx : p.x, y: u.hy != null ? u.hy : p.y };
  if (u.mhp == null) u.mhp = u.hp; if (u.mmp == null) u.mmp = u.mp || 0;
  if (typeof u.st === 'string') u.stance = u.st;      // 사양의 st 는 지휘관의 태세('side' = 용병을 곁에). 엔진 안에서 st 는 상태이상 표라서 stance 로 옮겨 둔다
  u.gauge = u.gauge == null ? 100 : u.gauge; u.busy = this.rand() * 0.3; u.cd = {}; u.buffs = {}; u.st = {}; u.face = u.side === 'ally' ? 1 : -1;
  u.aggro = false; u.order = null; u.auto = u.auto !== false; u.dead = false; u.tags = u.tags || []; u.skills = u.skills || [];
  u.gcd = 2 + this.rand() * 2; u.seen = 0; u.acc = 0;
  this.units.push(u); this.byId[u.id] = u; this.place(u); this._ver++;
  this.emit({ t: 'spawn', id: u.id });
  return u;
};
P.spawnGroup = function (g) {
  g.alive = 0; g.deadAt = null;
  for (var i = 0; i < g.list.length; i++) {
    var s = this.mk(g.list[i], { x: g.x, y: g.y, grp: g.id, L: g.L });
    s.hx = g.x; s.hy = g.y; if (g.ek) { s.ek = g.ek; s.gk = g.gk; s.dk = g.dk; }
    if (this.add(s)) g.alive++;
  }
};
P.remove = function (u) {
  if (!u.dead) this.unplace(u);
  u.dead = true; u.gone = true; delete this.byId[u.id]; this._ver++;
  var i = this.units.indexOf(u); if (i >= 0) this.units.splice(i, 1);
};

// ───────── 길 찾기 ─────────
P.canSwap = function (u, o) {
  return o.side === u.side && !isBig(u) && !isBig(o) && !o.dead && !o.casting && (o.busy < 0.06 || o.idle) && !(o.order && o.order.t === 'hold') &&
    !(o.swapT > this.t) && !(u.swapT > this.t) && !(o.role === 'cmd' && u.role !== 'cmd') &&
    !(o.id === this.leader && (o.order || this.hunt));      // 길을 가는 선두는 밀어내지 않는다 (뒤따르는 이가 선두를 되돌려 놓아 제자리걸음이 되던 문제)
};
// mode 0(기본): 적은 벽, 아군은 지금 자리를 바꿀 수 있을 때만 지나간다 / 1: 아군은 언제든 비켜 준다고 본다 / 2: 적이 선 칸도 지나갈 수 있다고 본다(길이 지형 때문에 막혔는지 유닛 때문에 막혔는지 가릴 때)
// 힙·결과 버퍼는 지도 크기만큼 한 번만 만들어 다시 쓴다 (부를 때마다 배열 셋을 새로 만들던 것 — 저사양 폰에서 GC 끊김). 돌려주는 목록은 다음 flood 때 덮어써지니 바로 쓴다.
P.flood = function (u, max, mode) {
  var w = this.w, h = this.h, d = this._d, p = this._p, st = this._st, stamp = ++this.stamp, cst = this.cst[MT[u.mt]], blk = this.block;
  if (!this._hk) { this._hk = new Float64Array(w * h * 4 + 8); this._hi = new Int32Array(w * h * 4 + 8); this._out = new Int32Array(w * h); }
  var hk = this._hk, hi = this._hi, out = this._out, hn = 0, on = 0, s = u.y * w + u.x, n, i, k, par, c, big = isBig(u), BW = u.fw || 1, BH = u.fh || 1;
  d[s] = 0; p[s] = -1; st[s] = stamp; hk[0] = 0; hi[0] = s; hn = 1;
  while (hn) {
    // pop
    k = hk[0]; i = hi[0];
    var lk = hk[hn - 1], li = hi[hn - 1]; n = --hn;
    if (n) {
      var a = 0;
      for (;;) {
        var l = 2 * a + 1; if (l >= n) break;
        var r = l + 1; c = (r < n && hk[r] < hk[l]) ? r : l;
        if (hk[c] >= lk) break;
        hk[a] = hk[c]; hi[a] = hi[c]; a = c;
      }
      hk[a] = lk; hi[a] = li;
    }
    if (k > d[i]) continue;
    out[on++] = i;
    var x = i % w, y = (i - x) / w;
    for (var q = 0; q < 4; q++) {
      var nx = x + DIR[q][0], ny = y + DIR[q][1];
      if (nx < 0 || ny < 0 || nx + BW > w || ny + BH > h) continue;
      var j = ny * w + nx;
      if (big) { c = this.bigCost(u, nx, ny, cst, mode); if (!c) continue; }
      else {
      c = cst[j];
      if (!c || (blk && blk[j])) continue;
      var o = this.occ[j];
      if (o && o !== u) {
        if (o.side !== u.side) { if (mode !== 2) continue; c += 8; }
        else { if (!mode && !this.canSwap(u, o)) continue; c += 2; }
      }
      }
      var nd = k + c; if (nd > max) continue;
      if (st[j] !== stamp || nd < d[j]) {
        st[j] = stamp; d[j] = nd; p[j] = i;
        n = hn++;
        while (n > 0) { par = (n - 1) >> 1; if (hk[par] <= nd) break; hk[n] = hk[par]; hi[n] = hi[par]; n = par; }
        hk[n] = nd; hi[n] = j;
      }
    }
  }
  return out.subarray(0, on);
};
// 2.3.0 큰 몸의 한 걸음 값: 몸이 덮는 칸 가운데 가장 비싼 칸 (못 가는 칸 · 다른 이가 선 칸이 하나라도 있으면 0 — mode 2 면 다른 편이 선 칸은 +8 로 셈)
P.bigCost = function (u, x, y, cst, mode) {
  var W = u.fw || 1, H = u.fh || 1, w = this.w, blk = this.block, mx = 0, add = 0, dx, dy, j, c, o;
  cst = cst || this.cst[MT[u.mt]];
  for (dy = 0; dy < H; dy++) for (dx = 0; dx < W; dx++) {
    j = (y + dy) * w + x + dx; c = cst[j];
    if (!c || (blk && blk[j])) return 0;
    if (c > mx) mx = c;
    o = this.occ[j];
    if (o && o !== u && !o.dead) { if (mode === 2 && o.side !== u.side) add = 8; else return 0; }
  }
  return mx + add;
};
// r38: 걸음에 틱 값을 치르는가 (= 싸움 걸음). 적은 늘 치른다. 아군은 싸움 중이라도 성난 적이 DS.BAL.engR(7)칸 안에 있을 때만 —
//   시나리오·갱도는 첫 순간부터 어딘가의 적이 성나 있어 맵 전체가 「싸움」이었다: 다음 무리로 걸어가는 내내 1초에 한 칸 남짓 (필드는 6~12칸).
//   사거리(적 4칸 · 기술 7칸) 안에 들어서면 예전처럼 한 걸음마다 틱을 치른다 — 실제 맞붙음의 속도는 그대로다.
P.paced = function (u) {
  if (this.mode === 'town') return false;
  if (u.side === 'enemy') return true;
  if (!this.combat) return false;
  if (DS.BAL.engR === 0) return true;      // 예전 규칙 (비교용)
  var R = DS.BAL.engR || 7, a = this.units;
  for (var i = 0; i < a.length; i++) { var e = a[i]; if (!e.dead && e.side === 'enemy' && (e.aggro || e.role === 'boss') && dist(e, u) <= R) return true; }
  return false;
};
P.stepCost = function (u, j) {
  if (!this.paced(u)) return 0;
  var c = this.cst[MT[u.mt]][j];
  if (isBig(u)) { var x = j % this.w; c = this.bigCost(u, x, (j - x) / this.w, null, 0) || c; }
  return TK.step * c * u.mv * this.q(u);
};
P.wait = function (u, t) { u.busy = t || 0.12; u.idle = true; };
P.step = function (u, j) {
  var c = this.stepCost(u, j);
  if (u.gauge < c) { this.wait(u); return false; }
  var o = this.occ[j], w = this.w, fx = u.x, fy = u.y, x = j % w, y = (j - x) / w;
  if (isBig(u)) {      // 2.3.0 큰 몸: 몸 전체가 들어갈 때만 (자리 바꾸기 없음)
    if (!this.fits(u, x, y)) { this.wait(u, 0.2); return false; }
    this.moveTo(u, x, y); if (x !== fx) u.face = x > fx ? 1 : -1;
    u.gauge -= c;
    var bdur = 0.26 * Math.max(0.8, Math.min(1.5, (this.bigCost(u, x, y, null, 0) || 1) * u.mv));
    u.busy = bdur; this.emit({ t: 'move', id: u.id, x: x, y: y, dur: bdur });
    return true;
  }
  if (o && o !== u) {
    if (!this.canSwap(u, o)) { this.wait(u, 0.2); return false; }
    this.occ[fy * w + fx] = o; o.x = fx; o.y = fy; o.swapT = this.t + 0.8; o.busy = Math.max(o.busy, 0.16); o.idle = false;
    this.emit({ t: 'move', id: o.id, x: fx, y: fy, dur: 0.16 });
  } else this.occ[fy * w + fx] = null;
  this.occ[j] = u; u.x = x; u.y = y; if (x !== fx) u.face = x > fx ? 1 : -1;
  u.gauge -= c;
  var fast = !c && !this.paced(u);
  var dur = (fast ? 0.13 : 0.2) * Math.max(0.8, Math.min(1.5, this.cst[MT[u.mt]][j] * u.mv));
  u.busy = dur; this.emit({ t: 'move', id: u.id, x: x, y: y, dur: dur });
  return true;
};
// 점수가 가장 낮은 칸으로 한 걸음. 'here' | 'step' | 'wait'
// 예고된 위험 칸 밖에 선 유닛은 위험 칸을 목적지로도 첫 걸음으로도 고르지 않는다 (피해 놓고는 때리러 다시 들어가 맞던 문제). 그 칸이 아니면 갈 데가 없을 때는 떨어질 때까지 기다린다.
P.go = function (u, score, max) {
  // fix28: 전투 중 게이지가 어느 한 걸음 값에도 못 미치면 길을 찾지 않고 기다린다 (걸을 수도 없는데 0.12초마다 30칸짜리 길 찾기를 하던 것 — 지역 한 틱 비용의 절반이 이것이었다)
  if (DS.BAL.fix28 && u.gauge < 100 && this.paced(u) && !this.canStep(u)) { this.wait(u); return 'wait'; }
  var list = this.flood(u, max || 30), w = this.w, best = -1, bs = Infinity, hs = Infinity, self = u.y * w + u.x, dz = this.dz[u.side], safe = !dz[self] && !isBig(u);      // 2.3.0: 큰 몸은 붉은 칸을 가리지 않는다 (피하지 않는다)
  for (var n = 0; n < list.length; n++) {
    var i = list[n]; if (this.occ[i] && this.occ[i] !== u) continue;
    var x = i % w, s = score(x, (i - x) / w, this._d[i], i);
    if (s == null) continue;
    if (safe && dz[i]) { if (s < hs) hs = s; continue; }
    if (s < bs) { bs = s; best = i; }
  }
  if (best < 0 || best === self) { if (hs < bs) { this.wait(u, 0.15); return 'wait'; } return 'here'; }
  var j = best; while (this._p[j] !== self) j = this._p[j];
  if (safe && dz[j]) { this.wait(u, 0.15); return 'wait'; }
  return this.step(u, j) ? 'step' : 'wait';
};
// 지금 게이지로 어느 쪽이든 한 걸음 디딜 수 있는가 (이웃 칸의 가장 싼 걸음 값과 견준다)
P.canStep = function (u) {
  var w = this.w, c = this.cst[MT[u.mt]], k = TK.step * u.mv * this.q(u), x, y, j, q;
  for (q = 0; q < 4; q++) { x = u.x + DIR[q][0]; y = u.y + DIR[q][1]; if (x < 0 || y < 0 || x >= w || y >= this.h) continue; j = y * w + x; if (c[j] > 0 && u.gauge >= k * c[j]) return true; }
  return false;
};
P.adj = function (u, j) { var x = j % this.w; return Math.abs(x - u.x) + Math.abs((j - x) / this.w - u.y) === 1; };
// 용암을 밟으면 다치는 유닛인가 (나는 유닛과 불에서 난 것은 괜찮다)
P.burns = function (u) { return !has(u, 'fly') && u.passive !== 'fireborn'; };
P.goNear = function (u, tx, ty, r, max) {
  var dz = this.dz[u.side], kind = this.kind, hot = this.burns(u);
  var bg = isBig(u), pt = { x: tx, y: ty };
  return this.go(u, function (x, y, c, i) {
    var d = bg ? rd(x, y, u, pt) : Math.abs(x - tx) + Math.abs(y - ty);
    return (d <= r ? c * 0.2 : d * 100 + c) + (dz[i] ? 400 : 0) + (hot && kind[i] === 'lava' ? 3 : 0);      // 같은 값이면 용암 위에 서지 않는다
  }, max);
};

// ───────── 피해·회복 ─────────
P.calc = function (u, v, m, type, stat, flat) {
  type = type || u.dtype || 'phys';
  var A = flat ? 30 + 4.5 * u.L : stat === 'atk' ? u.atk : stat === 'mix' ? (u.atk + u.mag) * 0.6 : (type === 'phys' ? u.atk : u.mag);
  var D = type === 'phys' ? v.def : v.res;
  if (!flat) A *= this.bf(u, 'atk');
  if (u.trait === 'brave' && u.hp < u.mhp * 0.5) A *= 1.2;
  D *= this.bf(v, 'def');
  var raw = A * m, dmg = Math.max(raw * 0.15, raw - D * 0.5);
  if (type === 'phys') {
    if (DS.COUNTER[u.kind] === v.kind) dmg *= 1.25;
    if (u.atkKind === 'arrow' && has(v, 'fly')) dmg *= 1.5;
    if (has(v, 'ethereal')) dmg *= 0.5;
  }
  if (type === 'holy' && (has(v, 'undead') || has(v, 'demon'))) dmg *= 1.5;
  if (!has(v, 'fly')) {
    var k = this.kind[v.y * this.w + v.x];
    if (k === 'forest') dmg *= 0.8; else if (k === 'hill') dmg *= 0.9; else if (k === 'swamp') dmg *= 1.1;
    if (v.passive === 'marine' && (k === 'water' || k === 'ford')) dmg *= 0.75;
  }
  if (u.passive === 'marine') { var ku = this.kind[u.y * this.w + u.x]; if (ku === 'water' || ku === 'ford') dmg *= 1.25; }
  if (u.fx) {      // 장비의 효과 묶음 (없으면 아무 일도 없다)
    if (u.fx.bossDmg && v.role === 'boss') dmg *= 1 + u.fx.bossDmg;
    if (u.fx.slay) for (var tg in u.fx.slay) if (has(v, tg)) dmg *= 1 + u.fx.slay[tg];
    // 2.1.0 장비 훅 (loot.js 의 전설·옵션): exec 마무리 · rage 잃은 HP 만큼 · lone 홀로 · pair 짝 장비
    if (u.fx.exec && v.hp < v.mhp * 0.3) dmg *= 1 + u.fx.exec;
    if (u.fx.rage && u.mhp) dmg *= 1 + u.fx.rage * Math.max(0, 1 - u.hp / u.mhp);
    if (u.fx.lone && this.alone(u)) dmg *= 1 + Math.min(0.5, u.fx.lone);
    if (u.fx.pair && this.paired(u)) dmg *= 1.15;
  }
  if (v.st && v.st.mark) dmg *= 1 + (v.st.mark.p || 20) / 100;      // 2.2.6 표식 (궁병): 누구에게나 더 아프게 맞는다
  if (v.fx) {      // 2.1.0: 받는 쪽 장비 훅 (홀로·짝)
    if (v.fx.lone && this.alone(v)) dmg *= 1 - Math.min(0.5, v.fx.lone);
    if (v.fx.pair && this.paired(v)) dmg *= 0.9;
  }
  dmg *= 0.92 + this.rand() * 0.16;
  return Math.max(1, Math.round(dmg));
};
// 2.1.0 장비 훅 거들기 — 같은 틱 안에서는 한 번만 센다
// alone: 2칸 안에 다른 가주(지휘관)가 없거나, 살아 있는 우리 가주가 나 하나
P.alone = function (u) {
  if (u._alT === this.t) return u._al;
  var near = 0, cm = 0, us = this.units, o;
  for (var i = 0; i < us.length; i++) { o = us[i]; if (o === u || o.dead || o.side !== u.side || o.role !== 'cmd') continue; cm++; if (Math.abs(o.x - u.x) + Math.abs(o.y - u.y) <= 2) near++; }
  u._alT = this.t; u._al = near === 0 || cm === 0;
  return u._al;
};
// paired: 짝 장비(fx.pair = '짝이름.계열')의 다른 한 짝을 든 우리 가주가 살아 있다
P.paired = function (u) {
  if (u._prT === this.t) return u._pr;
  var key = String(u.fx.pair), k0 = key.split('.')[0], us = this.units, o, ok = false;
  for (var i = 0; i < us.length && !ok; i++) { o = us[i]; if (o !== u && !o.dead && o.side === u.side && o.fx && o.fx.pair && String(o.fx.pair) !== key && String(o.fx.pair).split('.')[0] === k0) ok = true; }
  u._prT = this.t; u._pr = ok;
  return ok;
};
// 흡혈: 장비의 처치 흡혈(killDrain — 이번 싸움에 쓰러뜨린 수만큼, 6번까지)을 얹는다
P.drainOf = function (u) { return (u.drain || 0) + (u.fx && u.fx.killDrain ? u.fx.killDrain * (u.fxK || 0) : 0); };
P.ultCtl = function (u) { return this.ctl ? u.id === this.ctl : !!u.hero; };      // 2.1.0: 스스로 누르는 봇(DS.BAL.ultAuto)도 조작하는 한 사람만 — 지정이 없으면 맹주
// 2.2.7: 자동 전투는 필살기를 스스로 쓴다 — 조작이 「자동」인 우리 가문의 가주(u.auto)는 게이지가 차고 쓸 자리가 나면(P.aiUlt) 쓴다. 「수동」이면 예전처럼 단추로만.
//   한꺼번에 몰아 쓰지 않게, 스스로 쓰는 필살기는 우리 편 전체에서 DS.ULT.autoGap 초에 하나 (누른 것 · 예약은 그대로). 무술대회(u.arena)는 제 규칙(arena.js ultTry)
//   DS.BAL.ultAuto(검사 도구)는 조작하는 한 사람도 수동이든 아니든 누른다고 친다. DS.BAL.ultSelf = false 면 2.2.6 처럼 자동도 쓰지 않는다
P.ultSelf = function (u) {
  if (DS.BAL.ultAuto && this.ultCtl(u)) return true;
  if (DS.BAL.ultSelf === false || !u.auto || u.arena || u.side !== 'ally' || u.role !== 'cmd') return false;
  return !(this.t - (this._ultT == null ? -1e9 : this._ultT) < (DS.ULT.autoGap || 0));
};
P.ultUp = function (u) { return (u.ultR || 1) * (u.fx && u.fx.ultUp ? 1 + u.fx.ultUp : 1); };      // 필살 게이지가 차는 빠르기 (별빛 로브 등)
// 기본 공격이 맞힌 자리에서 번지는 피해: pierce = 맞힌 적 뒤 두 칸 안의 첫 적 · splash = 맞힌 적의 둘레 네 칸
P.fxSpread = function (u, v, dmg) {
  var self = this, hit = function (x, y, k) {
    if (!self.inb(x, y)) return; var w = self.occ[y * self.w + x];
    if (w && !w.dead && w.side !== u.side && w !== v && w !== v.me) { self.hurt(w, Math.max(1, Math.round(dmg * k)), u, { type: u.dtype }); if (self.drainOf(u)) self.leech(u, dmg * k * self.drainOf(u)); }
  };
  if (u.fx.pierce) {      // 맞힌 적 뒤로 두 칸 안의 첫 적 하나
    var ax = v.x - u.x, ay = v.y - u.y, sx = Math.abs(ax) >= Math.abs(ay) ? (ax > 0 ? 1 : -1) : 0, sy = sx ? 0 : (ay > 0 ? 1 : -1);
    for (var k = 1; k <= 2; k++) { var px = v.x + sx * k, py = v.y + sy * k, pw = this.inb(px, py) ? this.occ[py * this.w + px] : null; if (pw && !pw.dead && pw.side !== u.side && pw !== v.me) { hit(px, py, Math.min(1, u.fx.pierce)); break; } }
  }
  if (u.fx.splash) DIR.forEach(function (d) { hit(v.x + d[0], v.y + d[1], Math.min(0.8, u.fx.splash)); });
};
P.rouse = function (e) {
  if (e.aggro || e.side !== 'enemy') return;
  var self = this;
  this.units.forEach(function (o) {
    if (o.dead || o.side !== 'enemy' || o.aggro) return;
    if (o === e || (e.grp != null && o.grp === e.grp && !(o.calmT > self.t))) { o.aggro = true; o.stuck = 0; o.busy = Math.min(o.busy, 0.25 + self.rand() * 0.3); self.emit({ t: 'aggro', id: o.id }); }
  });
  this.combat = true;
};
P.hurt = function (v, dmg, src, o) {
  if (v.dead) return;
  o = o || {};
  this._hv = (this._hv || 0) + 1;
  var sb = v.buffs && v.buffs.shd;      // 2.2.6 보호막 (버프 shd — p 가 남은 막는 양): 피해를 먼저 받아 낸다
  if (sb && dmg > 0 && dmg < v.mhp * 50) {
    var ab = Math.min(dmg, Math.max(0, sb.p)); sb.p -= ab; dmg -= ab;
    if (ab > 0) this.emit({ t: 'shd', id: v.id, v: Math.round(ab), end: sb.p <= 0 });
    if (sb.p <= 0) { delete v.buffs.shd; this.emit({ t: 'buffEnd', id: v.id, s: 'shd' }); }
    if (dmg <= 0) { if (src && src.ult && src !== v && o.type !== 'reflect') src.uc = Math.min(100, (src.uc || 0) + DS.ULT.hitGain * this.ultUp(src)); return; }
  }
  v.hp -= dmg; this.lastHit = this.t;
  if (v.enr && !v.enraged && v.hp > 0 && v.hp <= v.mhp * v.enr.th) this.enrage(v);      // 2.3.0 격노
  if (src && src.side === 'enemy' && v.side === 'ally') src.prov = this.t + 6;      // 우리를 때린 적은 멀어도 내버려 두지 않는다
  if (v.ult && dmg > 0) v.uc = Math.min(100, (v.uc || 0) + dmg / (v.mhp || 1) * DS.ULT.hurtGain * this.ultUp(v));      // r32: 맞으면 필살 게이지가 조금 더 찬다
  if (src && src.ult && src !== v && o.type !== 'reflect') src.uc = Math.min(100, (src.uc || 0) + DS.ULT.hitGain * this.ultUp(src));
  var he = { t: 'hit', id: v.id, v: dmg, crit: !!o.crit, type: o.type || 'phys' };
  if (src) he.by = src.id;      // 누가 때렸는가 (독·용암처럼 때린 이가 없으면 생략)
  this.emit(he);
  if (v.hp <= 0 && (v.trait === 'survivor' || v.survX) && !v.surv) { v.surv = true; v.hp = 1; v.back = true; this.say(v, '구사일생!'); }
  if (v.side === 'enemy') this.rouse(v);
  if (v.hp <= 0) this.kill(v, src);
  if (src && v.fx && v.fx.reflect && !o.refl && src !== v && !src.dead && !this.result)      // 받은 피해의 일부를 되돌려 준다 (되돌린 피해는 다시 되돌아오지 않는다)
    this.hurt(src, Math.max(1, Math.round(dmg * Math.min(0.4, v.fx.reflect))), v, { type: 'reflect', refl: true });
  // 2.2.5 되치기(버프 ctr — 승려의 「부동심」): 붙어서 때린 적에게 제 공격의 p% 로 한 번 되친다 (0.4초에 한 번까지 · 되친 피해는 다시 되치지 않는다)
  if (src && v.buffs && v.buffs.ctr && !v.dead && !o.refl && src !== v && !src.dead && src.side !== v.side && !this.result && dist(v, src) === 1 && this.t - (v.ctrT == null ? -9 : v.ctrT) >= 0.4) {
    v.ctrT = this.t; this.emit({ t: 'ctr', id: v.id, tid: src.id });
    this.hurt(src, this.calc(v, src, v.buffs.ctr.p / 100), v, { type: v.dtype || 'phys', refl: true });
  }
};
P.heal = function (v, amt, quiet) {
  if (v.dead || amt <= 0 || v.role === 'shade') return 0;      // 2.5.0: 그림자는 고칠 수 없다
  this._hv = (this._hv || 0) + 1;
  var a = Math.min(v.mhp - v.hp, Math.round(amt)); v.hp += a;
  if (a > 0 && !quiet) this.emit({ t: 'heal', id: v.id, v: a });
  return a;
};
P.kill = function (v, by) {
  if (v.dead) return;
  if (v.role === 'shade' && this.shadeEnd) { this.shadeEnd(v); return; }      // 2.5.0: 그림자는 쓰러지지 않고 걷힌다 (죽음으로 세지 않는다 — shade.js)
  var self = this;
  v.dead = true; v.deadT = this.t; v.hp = 0; this.unplace(v); this._ver++;
  if (v.rsv || v.rsvU) { v.rsv = null; v.rsvU = false; }      // 2.2.3: 쓰러지면 예약도 거둔다
  this.emit({ t: 'die', id: v.id, by: by ? by.id : null });
  if (this.std) this.std.died(this, v, by);      // 2.8 마지막 물결 (stand.js): 쓰러진 우리 사람은 그 싸움에서만 빠진다. 따르던 가문원은 남은 가주에게, 끝은 물결이 정한다
  if (by && by.fx && !by.dead && by.side !== v.side) {
    if (by.fx.killHp) this.heal(by, by.mhp * by.fx.killHp);
    if (by.fx.killGauge) by.gauge = Math.min(100, by.gauge + by.fx.killGauge);
    if (by.fx.killDrain) { by.fxK = Math.min(6, (by.fxK || 0) + 1); if (by.fxK <= 6) this.emit({ t: 'gearfx', id: by.id, k: 'killDrain', n: by.fxK }); }      // 2.1.0: 처치 흡혈 쌓기 (싸움이 끝나면 tick 이 비운다)
  }
  this.tele = this.tele.filter(function (t) { if (t.u === v) { self.emit({ t: 'castEnd', tid: t.id, cancel: true }); return false; } return true; });
  this.reDanger();
  if (v.side === 'ally' && v.role === 'cmd' && !this.std) {
    this.units.forEach(function (m) { if (!m.dead && m.owner === v.id) { if (m.role === 'merc') self.flee(m); else self.kill(m, by); } });   // 용병은 흩어질 뿐 죽지 않는다
    if (!this.cmds().length && !this.result) { this.result = 'lose'; this.rsvClear(); this.emit({ t: 'lose' }); }
    else if (this.leader === v.id) { var c = this.cmds()[0]; if (c) { this.leader = c.id; this.emit({ t: 'leader', id: c.id }); } }
  }
  if (v.side === 'enemy') {
    if (v.exp || v.gold) { var re = { t: 'reward', exp: v.ek ? Math.max(1, Math.round((v.exp || 0) * v.ek)) : v.exp || 0, gold: Math.round((v.gold || 0) * (v.gk || 1) * (by && by.side === 'ally' && by.fx && by.fx.goldUp ? 1 + by.fx.goldUp : 1)), L: v.L, x: v.x, y: v.y, boss: v.role === 'boss', type: v.type }; if (v.ek) { re.ek = v.ek; re.dk = v.dk; } if (v.summoned) re.sum = true; if (v.elite != null) re.elite = v.elite; if (v.eliteCrew != null) re.eliteCrew = v.eliteCrew; if (this.mode === 'scn') re.mode = 'scn'; this.emit(re); }      // elite·eliteCrew: 현상 수배 정예(plan), mode: 시나리오 안의 처치(현상금이 거른다)      // sum: 불려 나온 적 (전리품을 떨어뜨리지 않게 가릴 때)      // 2.2.2 ek·gk·dk: 큰 부대에 맞춰 불어난 들판 무리 — 하나하나의 경험치·골드·드랍은 조금 덜 (DS.packOf)
    if (v.split && !this.result && !v.boomed) this.splitOf(v);      // 2.3.0: 쓰러지며 갈라진다 (갈라진 것은 다시 갈라지지 않는다)
    var g = this.groups.filter(function (g) { return g.id === v.grp; })[0];
    if (g && g.alive > 0 && !v.summoned) { g.alive--; if (!g.alive) g.deadAt = this.t; }
    if (v.obj) {
      if (v.phase2) {
        var s = this.mk(null, { boss: v.phase2, x: v.x, y: v.y, grp: v.grp }); s.obj = true;
        var nu = this.add(s); if (nu) { nu.aggro = true; nu.gauge = 30; this.emit({ t: 'phase', id: nu.id }); }
      } else this.win();
    } else if (this.objective === 'all') this.checkAll();
  }
};
P.splitOf = function (v) {
  var S = v.split, n = S.n || 2, made = 0;
  for (var i = 0; i < n; i++) {
    var s = this.mk(S.type, { x: v.x, y: v.y, grp: v.grp, L: Math.max(1, v.L - (S.dL || 1)), expMul: S.exp == null ? 0.3 : S.exp });
    s.summoned = true; s.owner = v.id; delete s.split; if (S.hp) { s.hp = s.mhp = Math.max(1, Math.round(s.hp * S.hp)); }
    var nu = this.add(s); if (nu) { nu.aggro = true; nu.gauge = 50; nu.busy = 0.35; made++; }
  }
  if (made) this.emit({ t: 'split', id: v.id, n: made, x: v.x, y: v.y });
};
// 전장을 떠난다 (쓰러진 것이 아니다)
P.flee = function (m) {
  if (m.dead) return;
  m.dead = true; m.fled = true; m.deadT = this.t; this.unplace(m); this._ver++;
  this.emit({ t: 'die', id: m.id, flee: true });
};
P.checkAll = function () {
  if (this.result) return;
  if (!this.live('enemy').length) { if (this.waves.length) this.nextWave(); else this.win(); }
};
P.nextWave = function () {
  var wv = this.waves.shift(), self = this; if (!wv) return;
  this.emit({ t: 'wave', n: wv.n || 0, text: wv.text });
  wv.units.forEach(function (s) { var u = self.add(s); if (u) { u.aggro = true; } });
  this.combat = true;
};
P.win = function () {
  if (this.result) return;
  var self = this;
  this.result = 'win'; this.rsvClear();      // 2.2.3: 싸움이 끝나면 예약도 끝
  this.units.forEach(function (e) { if (!e.dead && e.side === 'enemy') { e.dead = true; e.deadT = self.t; self._ver++; self.unplace(e); self.emit({ t: 'die', id: e.id, flee: true }); } });
  this.tele = []; this.hz = []; this.reDanger(); this.combat = false;
  this.emit({ t: 'win' });
};

// ───────── 기술 ─────────
P.diamond = function (cx, cy, r) {
  var out = [];
  for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++)
    if (Math.abs(dx) + Math.abs(dy) <= r && this.inb(cx + dx, cy + dy)) out.push([cx + dx, cy + dy]);
  return out;
};
// 기술이 닿는 칸 (tx,ty: 겨눈 칸 또는 대상의 칸)
// 2.3.0: 큰 몸 둘레의 칸 — r: 몸에서 r 칸 안(마름모처럼) · adj: 몸에 닿는 여덟 방향 한 겹 · cross: 몸의 네 변에서 곧게 3칸 · ring: r0 ~ r 칸 띠
P.rectArea = function (u, area, r0) {
  var out = [], W = u.fw || 1, H = u.fh || 1, x, y, d, r = area === 'r1' ? 1 : area === 'r2' ? 2 : area === 'r3' ? 3 : area === 'r4' ? 4 : area === 'ring' ? 3 : area === 'adj' ? 1 : 0;
  if (area === 'cross') {
    for (x = u.x; x < u.x + W; x++) for (var i = 1; i <= 3; i++) { if (this.inb(x, u.y - i)) out.push([x, u.y - i]); if (this.inb(x, u.y + H - 1 + i)) out.push([x, u.y + H - 1 + i]); }
    for (y = u.y; y < u.y + H; y++) for (var k = 1; k <= 3; k++) { if (this.inb(u.x - k, y)) out.push([u.x - k, y]); if (this.inb(u.x + W - 1 + k, y)) out.push([u.x + W - 1 + k, y]); }
    return out;
  }
  for (y = u.y - r; y < u.y + H + r; y++) for (x = u.x - r; x < u.x + W + r; x++) {
    if (!this.inb(x, y)) continue;
    if (area === 'adj') { if (x >= u.x && x < u.x + W && y >= u.y && y < u.y + H) continue; out.push([x, y]); continue; }
    d = dt(x, y, u);
    if (d > r || (area === 'ring' && d < (r0 || 2))) continue;
    out.push([x, y]);
  }
  return out;
};
P.areaTiles = function (u, S, tx, ty) {
  var out = [], i, self = this;
  if (S.tg === 'dir' && isBig(u)) {      // 2.3.0 큰 몸의 곧은 길: 몸 폭만큼 넓은 띠 (cone 이면 나아갈수록 넓어진다), 몸의 변에서 시작
    var W = u.fw || 1, H = u.fh || 1, ddx = tx - nearT(u, tx, ty).x, ddy = ty - nearT(u, tx, ty).y, bx = 0, by = 0;
    if (!ddx && !ddy) { ddx = tx - (u.x + (W - 1) / 2); ddy = ty - (u.y + (H - 1) / 2); }
    if (Math.abs(ddx) >= Math.abs(ddy)) bx = ddx >= 0 ? 1 : -1; else by = ddy > 0 ? 1 : -1;
    for (i = 1; i <= S.len; i++) {
      var sp = S.cone ? Math.floor(i / 2) : 0, a0, a1, k;
      if (bx) { var cx = bx > 0 ? u.x + W - 1 + i : u.x - i; a0 = u.y - sp; a1 = u.y + H - 1 + sp; for (k = a0; k <= a1; k++) if (this.inb(cx, k)) out.push([cx, k]); }
      else { var cy = by > 0 ? u.y + H - 1 + i : u.y - i; a0 = u.x - sp; a1 = u.x + W - 1 + sp; for (k = a0; k <= a1; k++) if (this.inb(k, cy)) out.push([k, cy]); }
    }
    return out;
  }
  if (S.tg === 'dir') {
    var dx = tx - u.x, dy = ty - u.y, sx = 0, sy = 0;
    if (Math.abs(dx) >= Math.abs(dy)) sx = dx >= 0 ? 1 : -1; else sy = dy > 0 ? 1 : -1;
    for (i = 1; i <= S.len; i++) { if (!this.inb(u.x + sx * i, u.y + sy * i)) break; out.push([u.x + sx * i, u.y + sy * i]); }
    return out;
  }
  if (S.tg === 'row') { for (i = 0; i < this.w; i++) out.push([i, ty]); return out; }
  if (S.tg === 'self' && isBig(u) && S.area && S.area !== 'all' && S.area !== 'single') return this.rectArea(u, S.area, S.r0);
  if (S.tg === 'self') { tx = u.x; ty = u.y; }
  switch (S.area) {
    case 'r1': return this.diamond(tx, ty, 1);
    case 'r2': return this.diamond(tx, ty, 2);
    case 'r3': return this.diamond(tx, ty, 3);
    case 'ring': return this.diamond(tx, ty, 3).filter(function (t) { return Math.abs(t[0] - tx) + Math.abs(t[1] - ty) >= (S.r0 || 2); });
    case 'adj':
      for (var ay = -1; ay <= 1; ay++) for (var ax = -1; ax <= 1; ax++) if ((ax || ay) && this.inb(tx + ax, ty + ay)) out.push([tx + ax, ty + ay]);
      return out;
    case 'cross':
      out.push([tx, ty]);
      for (i = 1; i <= 3; i++) DIR.forEach(function (d) { if (self.inb(tx + d[0] * i, ty + d[1] * i)) out.push([tx + d[0] * i, ty + d[1] * i]); });
      return out;
    case 'all': return null;   // 전체
    default: return [[tx, ty]];
  }
};
P.victims = function (u, S, tiles) {
  var wantAlly = S.side === 'ally' || S.tg === 'ally', self = this, list;
  if (!tiles) list = this.units.filter(function (v) { return !v.dead; });
  else { list = []; tiles.forEach(function (t) { var v = self.occ[t[1] * self.w + t[0]]; if (v && !v.dead && list.indexOf(v) < 0) list.push(v); }); }
  return list.filter(function (v) {
    if (wantAlly ? v.side !== u.side : v.side === u.side) return false;
    if (S.mercOnly && v.role !== 'merc' && v.role !== 'summon') return false;
    return true;
  });
};
P.say = function (u, text) { this.emit({ t: 'say', id: u.id, text: text }); };
// 기술 사용. tgt = 유닛 또는 {x,y}. 비용이 모자라면 false.
P.cast = function (u, id, tgt, free) {
  var S = SK[id], c = S.tick * this.q(u), self = this;
  if (!free) {
    if (u.fx && u.fx.seal && !S.item) return false;      // 기술 봉인: 기본 공격과 아이템만
    if (u.gauge < c || (u.mp || 0) < (S.mp || 0) || u.cd[id] > 0) return false;
    if (S.ult && (u.ult !== id || !((u.uc || 0) >= 100))) return false;      // r32: 필살기는 제 것이고, 게이지가 가득해야 한다
    if (S.item) { var key = id.slice(2); if (!(this.inv[key] > 0)) return false; this.inv[key]--; this.emit({ t: 'inv' }); }
    u.gauge -= c; u.mp -= S.mp || 0;
  }
  if (S.cd) u.cd[id] = S.cd;
  if (S.ult) { u.uc = 0; u.ultN = (u.ultN || 0) + 1; this.emit({ t: 'ult', id: u.id, sk: id }); }      // r32: 화면이 컷인을 띄운다
  u.gcd = 2.2 + this.rand() * 1.5;
  var tx = tgt ? tgt.x : u.x, ty = tgt ? tgt.y : u.y, tiles;
  if (tgt && isBig(tgt)) { var nt0 = nearT(tgt, u.x, u.y); tx = nt0.x; ty = nt0.y; }      // 2.3.0: 큰 몸은 가장 가까운 칸을 겨눈다
  if (tgt && (tgt.x !== u.x)) u.face = tgt.x > u.x ? 1 : -1;
  if (S.tg === 'multi') {
    var foes = this.units.filter(function (v) { return !v.dead && v.side !== u.side; }), pick = [];
    while (foes.length && pick.length < S.n) pick.push(foes.splice(Math.floor(this.rand() * foes.length), 1)[0]);
    tiles = [];
    pick.forEach(function (v) {
      (S.area === 'single' ? [[v.x, v.y]] : self.areaTiles(u, { area: S.area }, v.x, v.y)).forEach(function (t) {
        if (!tiles.some(function (o) { return o[0] === t[0] && o[1] === t[1]; })) tiles.push(t);
      });
    });
  } else if (S.leap && tgt) {
    var p = null, bd = 1e9;
    if (isBig(u) || isBig(tgt)) {      // 2.3.0: 몸 전체가 들어가는, 대상에 붙은 자리
      var LW = u.fw || 1, LH = u.fh || 1, TW = tgt.fw || 1, TH = tgt.fh || 1;
      for (var ly = tgt.y - LH; ly <= tgt.y + TH; ly++) for (var lx = tgt.x - LW; lx <= tgt.x + TW; lx++) {
        if (rd(lx, ly, u, tgt) !== 1 || !this.fits(u, lx, ly)) continue;
        var ld = Math.abs(lx - u.x) + Math.abs(ly - u.y); if (ld < bd) { bd = ld; p = [lx, ly]; }
      }
    } else DIR.forEach(function (d) {
      var nx = tgt.x + d[0], ny = tgt.y + d[1];
      if (!self.pass(u.mt, nx, ny) || (self.occ[ny * self.w + nx] && self.occ[ny * self.w + nx] !== u)) return;
      var dd = Math.abs(nx - u.x) + Math.abs(ny - u.y); if (dd < bd) { bd = dd; p = [nx, ny]; }
    });
    if (p) { this.moveTo(u, p[0], p[1]); this.emit({ t: 'leap', id: u.id, x: u.x, y: u.y }); }
    var lt0 = nearT(tgt, u.x, u.y); tiles = [[lt0.x, lt0.y]];
  } else tiles = this.areaTiles(u, S, tx, ty);
  this.say(u, S.name);
  if (S.bult && u.side === 'enemy') this.emit({ t: 'bossUlt', id: u.id, sk: id });      // 2.3.0: 큰 보스의 비기 — 화면이 보스 컷인을 띄운다
  if (S.cast) {
    var T = { id: this.nid++, u: u, sk: id, tiles: tiles, t: S.cast, dur: S.cast, c: [tx, ty] };
    this.tele.push(T); u.casting = T; u.busy = S.cast + 0.35;
    this.emit({ t: 'cast', id: u.id, sk: id, tid: T.id, tiles: tiles, dur: S.cast, side: u.side });
    this.reDanger();
    return true;
  }
  if (S.beats || S.fall) return this.seqStart(u, id, tiles, tgt && tgt.id ? tgt : null, [tx, ty]);      // 여러 박자 · 예고 낙하: 지금은 걸어만 두고 박자마다 푼다
  this._at = [tx, ty];
  this.resolve(u, id, tiles, tgt && tgt.id ? tgt : null);
  this._at = null;
  if (S.dash && tiles && !u.dead) this.dashTo(u, tiles);      // 2.2.6 돌파 (기병): 길 위를 치고 그 끝까지 달려 나간다
  if (S.back && !u.dead && !this.result) this.hopBack(u, S.back, tgt && tgt.id ? tgt : null);      // 2.2.6 치고 빠지기 (비병 · 궁병)
  u.busy = 0.55;
  return true;
};
// 2.2.6 돌파: 직선의 칸을 차례로 보며 지나갈 수 있는(땅) 데까지, 그 가운데 비어 있는 가장 먼 칸에 선다 (사람 위로는 지나간다)
P.dashTo = function (u, tiles) {
  if (isBig(u)) return this.bigDash(u, tiles);
  var dest = null, i, t, oc;
  for (i = 0; i < tiles.length; i++) { t = tiles[i]; if (!this.pass(u.mt, t[0], t[1])) break; oc = this.occ[t[1] * this.w + t[0]]; if (!oc || oc.dead) dest = t; }
  if (!dest || (dest[0] === u.x && dest[1] === u.y)) return false;
  this.moveTo(u, dest[0], dest[1]);
  this.emit({ t: 'leap', id: u.id, x: u.x, y: u.y, dash: 1 });
  return true;
};
// 2.3.0 큰 몸의 돌진: 길(tiles — 몸 폭만큼 넓은 띠)의 방향으로 한 칸씩, 몸 전체가 들어가는 데까지 (길 위의 사람은 먼저 옆으로 밀려난다 — 못 밀린 사람 앞에서 멈춘다)
P.bigDash = function (u, tiles) {
  if (!tiles || !tiles.length) return false;
  var W = u.fw || 1, H = u.fh || 1, t = tiles[tiles.length - 1], sx = 0, sy = 0;
  if (t[0] >= u.x + W) sx = 1; else if (t[0] < u.x) sx = -1; else if (t[1] >= u.y + H) sy = 1; else if (t[1] < u.y) sy = -1;
  if (!sx && !sy) return false;
  var n = 0, x = u.x, y = u.y, max = Math.max(Math.abs(t[0] - u.x), Math.abs(t[1] - u.y));
  while (n < max && this.fits(u, x + sx, y + sy)) { x += sx; y += sy; n++; }
  if (!n) return false;
  this.moveTo(u, x, y); if (sx) u.face = sx;
  this.emit({ t: 'leap', id: u.id, x: u.x, y: u.y, dash: 1, big: 1 });
  return true;
};
// 2.2.6 물러서기: 한 칸씩 n 번, 가장 가까운 적과 더 멀어지는 이웃 칸으로 (붉은 칸 · 용암은 피한다). 더 멀어질 데가 없으면 멈춘다
P.hopBack = function (u, n, ref) {
  var self = this, foes = this.units.filter(function (v) { return !v.dead && v.side !== u.side && v.side !== 'neutral' && dist(u, v) <= 8; }), moved = false, dz = this.dz[u.side], hot = this.burns(u);
  if (!foes.length) return false;
  function md(x, y) { var m = 99; for (var i = 0; i < foes.length; i++) { var d = dt(x, y, foes[i]); if (d < m) m = d; } return m; }
  if (isBig(u)) return false;
  for (var k = 0; k < n; k++) {
    var cur = md(u.x, u.y), best = null, bs = cur;
    DIR.forEach(function (d) {
      var x = u.x + d[0], y = u.y + d[1], j = y * self.w + x; if (!self.pass(u.mt, x, y) || self.occ[j] || dz[j] || (hot && self.kind[j] === 'lava')) return;
      var sc = md(x, y) + (ref ? 0.01 * (Math.abs(ref.x - x) + Math.abs(ref.y - y)) : 0); if (sc > bs + 0.001) { bs = sc; best = [x, y]; }
    });
    if (!best) break;
    this.moveTo(u, best[0], best[1]); moved = true;
  }
  if (moved) this.emit({ t: 'leap', id: u.id, x: u.x, y: u.y, back: 1 });
  return moved;
};
// 2.2.6: vs — 그 상태인 적에게 더 (slow 둔화 · mark 표식 · burn 화상 · wet 젖음 · curse 저주 · low 체력 절반 아래, '|' 로 여럿)
function vsHit(v, key) {
  if (!key || !v) return false;
  var ks = key.split('|');
  for (var i = 0; i < ks.length; i++) {
    var k = ks[i];
    if (k === 'low') { if (v.hp < v.mhp * 0.5) return true; }
    else if (k === 'curse') { if ((v.buffs.def && v.buffs.def.p < 0) || (v.buffs.atk && v.buffs.atk.p < 0)) return true; }
    else if (v.st && v.st[k]) return true;
  }
  return false;
}
DS.vsHit = vsHit;
// 보호막 · 기 전하기 · 생기 나눔의 양: 쓰는 이의 공격 또는 마공 × m (우리 편 보통 기술이면 치유 배율 — 보호막은 그 두 배를 쓴다: 막고 나면 사라진다)
P.shdAmt = function (u, e, S, pw) { var base = e.stat === 'atk' ? u.atk : u.mag; return Math.round(base * e.m * (pw || 1) + 10); };
// o (여러 박자): { b: 박자 번호 — 그 박자의 효과(e.b, 없으면 0)만 · last: 마지막 박자 · vs: 미리 고른 대상 · eff: 기술 표 대신 쓸 효과 목록(자리의 맥박) · to: 자리가 겨누는 편 }
//   o 가 있으면 'skill' 사건은 내지 않는다 (걸 때 seqStart 가 한 번 냈다 · 자리의 맥박은 'zoneTick')
P.resolve = function (u, id, tiles, unitTgt, o) {
  var S = SK[id], self = this, vs, pw = S.ult ? (u.ultP || 1) : 1, EF = o && o.eff ? o.eff : S.eff, bi = o && o.b != null ? o.b : -1;      // r32: 필살기의 세기 (별·등급)
  if (o && o.vs) vs = o.vs;
  else if ((S.tg === 'enemy' || S.tg === 'ally') && unitTgt) vs = unitTgt.dead ? [] : [unitTgt];
  else vs = this.victims(u, S, tiles);
  if (!o) this.emit({ t: 'skill', id: u.id, sk: id, fx: S.fx, tiles: tiles || vs.map(function (v) { return [v.x, v.y]; }), from: [u.x, u.y] });
  var hk0 = u.side === 'ally' && !S.ult && !S.item ? DS.BAL.healAlly : 1, hup = u.fx && u.fx.healUp ? 1 + u.fx.healUp : 1, by = u.side === 'ally' ? u.id : null, ctr0 = vs[0] || null;
  // 2.2.6 to: 그 덧효과만 다른 무리에게 — 'self' 쓰는 이 · 'ally' / 'foe' 쓰는 이(at: 'tgt' 면 첫 대상) 둘레 r 칸
  function grp(e) {
    if (!e.to) return vs;
    if (e.to === 'self') return u.dead ? [] : [u];
    var c = e.at === 'tgt' && ctr0 ? ctr0 : u, out = [], us = self.units, f;
    for (var i = 0; i < us.length; i++) { f = us[i]; if (f.dead || (e.to === 'ally' ? f.side !== u.side : f.side === u.side || f.side === 'neutral')) continue; if (e.r == null || dist(c, f) <= e.r) out.push(f); }
    return out;
  }
  function vsk(e, v) { return e.vs && vsHit(v, e.vs) ? (self.emit({ t: 'weak', id: v.id, k: e.vs }), e.vx || 1.5) : 1; }
  var dashD0 = this._dashD;
  if (S.dash && tiles && tiles.length) { var dl = tiles[tiles.length - 1], dn = nearT(u, dl[0], dl[1]), ddx0 = dl[0] - dn.x, ddy0 = dl[1] - dn.y; this._dashD = Math.abs(ddx0) >= Math.abs(ddy0) ? [ddx0 >= 0 ? 1 : -1, 0] : [0, ddy0 > 0 ? 1 : -1]; }
  EF.forEach(function (e) {
    if (bi >= 0 && (e.b || 0) !== bi) return;      // 여러 박자: 이 박자의 효과만
    var T = grp(e);
    switch (e.t) {
      case 'dmg': T.forEach(function (v) {
        if (v.dead) return;
        var d = self.calc(u, v, e.m * pw * vsk(e, v), e.type || (S.item ? 'magic' : null), e.stat, e.flat);
        if (self._tele && v.fx && v.fx.teleRes) d = Math.max(1, Math.round(d * (1 - Math.min(0.6, v.fx.teleRes))));      // 예고(붉은 칸) 기술을 덜 아프게 받는다
        self.hurt(v, d, u, { type: e.type || u.dtype });
        if (e.drain) self.heal(u, d * e.drain);
        else if (self.drainOf(u)) self.leech(u, d * self.drainOf(u));
        if (e.share && !u.dead) { var st = self.mendTgt(u, 4); if (st) { self.emit({ t: 'mend', id: u.id, tid: st.id, dark: 1 }); self.heal(st, d * e.share * (u.side === 'ally' && !S.ult ? 1 : 1) * hup); } }      // 2.2.6 생기 나눔 (사교)
      }); break;
      case 'chain':      // 2.2.6 연쇄 (법사의 번개): 맞은 적 둘레 r 칸에서 아직 안 맞은 적 n 에게 차례로 옮겨 간다
        var hit = vs.slice(), from = vs[vs.length - 1];
        for (var cn = 0; cn < e.n && from; cn++) {
          var nx = null, nd = 99;
          for (var ci = 0; ci < self.units.length; ci++) { var cf = self.units[ci]; if (cf.dead || cf.side === u.side || cf.side === 'neutral' || hit.indexOf(cf) >= 0) continue; var cd = dist(from, cf); if (cd <= e.r && cd < nd) { nd = cd; nx = cf; } }
          if (!nx) break;
          hit.push(nx); self.emit({ t: 'chain', id: u.id, a: from.id, b: nx.id });
          var cdm = self.calc(u, nx, e.m * pw * vsk(e, nx), e.type || null, e.stat, e.flat); self.hurt(nx, cdm, u, { type: e.type || u.dtype });
          from = nx;
        }
        break;
      case 'heal': T.forEach(function (v) { self.heal(v, (u.mag * e.m * pw + 8) * hup * hk0); }); break;      // healUp: 자비의 홀 등
      case 'buff': T.forEach(function (v) {
        if (v.dead) return;
        if (e.s === 'shd') { var amt = self.shdAmt(u, e, S, pw) * hup, ob = v.buffs.shd; v.buffs.shd = { p: Math.max(amt, ob ? ob.p : 0), t: e.dur, mx: amt }; self.emit({ t: 'buff', id: v.id, s: 'shd', p: Math.round(amt) }); return; }      // 2.2.6 보호막: 더 큰 쪽으로 (쌓이지 않는다)
        var p = e.p; if (p < 0 && v.role === 'boss') p = Math.round(p / 2);
        var ob2 = v.buffs[e.s]; if (ob2 && ob2.p > 0 && p > 0 && ob2.p > p && ob2.t > 2) return;      // 2.2.6: 더 센 같은 가호가 남아 있으면 약한 것으로 덮지 않는다 (철벽 위에 호령)
        v.buffs[e.s] = { p: p, t: e.dur }; self.emit({ t: 'buff', id: v.id, s: e.s, p: p });
      }); break;
      case 'status': T.forEach(function (v) {
        if (v.dead) return;
        self.addStatus(v, e.s, e.dur, e.p, by);
      }); break;
      case 'gauge': T.forEach(function (v) { if (!v.dead) v.gauge = Math.max(0, Math.min(100, v.gauge + (v.role === 'boss' && e.v < 0 ? e.v / 2 : e.v))); }); break;
      case 'cleanse': T.forEach(function (v) { v.st = {}; for (var k in v.buffs) if (v.buffs[k].p < 0) delete v.buffs[k]; }); break;
      case 'taunt':      // 2.2.6 도발 (보병): 그 적은 dur 초 동안 쓰는 이를 노린다 (보스는 절반)
        if (u.dead) break;
        var tl = T.filter(function (v) { return !v.dead && v.side !== u.side && v.side !== 'neutral'; });
        tl.forEach(function (v) { v.hate = u.id; v.hateT = self.t + (v.role === 'boss' ? e.dur / 2 : e.dur); v.hateP = e.p || 40; });
        if (tl.length) self.emit({ t: 'taunt', id: u.id, n: tl.length, ids: tl.map(function (x) { return x.id; }), sk: 1 });
        break;
      case 'pull': T.forEach(function (v) {      // 2.2.6 끌어오기 (해병의 작살): 쓰는 이 쪽으로 n 칸 (붙으면 멈춘다 · 보스는 끌리지 않는다 · 2.3.0 큰 몸도)
        if (v.dead || v.role === 'boss' || v.side === u.side || isBig(v)) return;
        for (var n = 0; n < e.n; n++) {
          if (dist(u, v) <= 1) break;
          var un = nearT(u, v.x, v.y), dx = 0, dy = 0, ax = un.x - v.x, ay = un.y - v.y;
          if (Math.abs(ax) >= Math.abs(ay)) dx = ax > 0 ? 1 : -1; else dy = ay > 0 ? 1 : -1;
          var px = v.x + dx, py = v.y + dy;
          if (!self.pass(v.mt, px, py) || self.occ[py * self.w + px]) { if (dx && ay) { dx = 0; dy = ay > 0 ? 1 : -1; } else if (dy && ax) { dy = 0; dx = ax > 0 ? 1 : -1; } else break; px = v.x + dx; py = v.y + dy; if (!self.pass(v.mt, px, py) || self.occ[py * self.w + px]) break; }
          self.moveTo(v, px, py);
        }
        self.emit({ t: 'knock', id: v.id, x: v.x, y: v.y, pull: 1 });
      }); break;
      case 'ward':      // 2.2.6 등불 (신관): r 칸 안 가장 다친 우리 편 하나에게 보호막
        if (u.dead) break;
        var wt = self.mendTgt(u, e.r);
        if (wt) { var wa = self.shdAmt(u, e, S, pw) * hup, wb = wt.buffs.shd; wt.buffs.shd = { p: Math.max(wa, wb ? wb.p : 0), t: e.dur || 12, mx: wa }; self.emit({ t: 'mend', id: u.id, tid: wt.id, ward: 1 }); self.emit({ t: 'buff', id: wt.id, s: 'shd', p: Math.round(wa) }); }
        break;
      case 'aura':      // 2.2.5 기공: 쓰는 이 둘레 e.r 칸의 우리 편을 마공 × m 만큼 (우리 편 치유 배율 · 자비 옵션 그대로)
        if (u.dead) break;
        var ak = hk0 * hup, aa = (u.mag * e.m * pw + 8) * ak;
        self.emit({ t: 'aura', id: u.id, r: e.r });
        self.units.forEach(function (f) { if (!f.dead && f.side === u.side && dist(u, f) <= e.r) self.heal(f, aa); });
        break;
      case 'mend':      // 2.2.5 기 전하기: 쓰는 이 e.r 칸 안에서 가장 많이 다친 우리 편 하나(자신 포함, 체력 90% 아래)를 마공 × m 만큼
        if (u.dead) break;
        var mt = self.mendTgt(u, e.r), mk = hk0 * hup;
        if (mt) { self.emit({ t: 'mend', id: u.id, tid: mt.id }); self.heal(mt, (u.mag * e.m * pw + 8) * mk); }
        break;
      case 'knock': T.forEach(function (v) {
        if (v.dead || v.role === 'boss' || isBig(v) || v.side === u.side) return;      // 2.3.0: 큰 몸은 밀리지 않는다
        var dx = 0, dy = 0, un = nearT(u, v.x, v.y), kx = 0;
        if (e.dir === 'down') dy = 1;
        else if (e.dir === 'side' && self._dashD) {      // 2.3.0 돌진: 길에서 옆으로 비켜나게 (길이 가로면 위아래, 세로면 좌우 — 쓰는 이 몸의 가운데에서 먼 쪽)
          var cx2 = u.x + ((u.fw || 1) - 1) / 2, cy2 = u.y + ((u.fh || 1) - 1) / 2;
          if (self._dashD[0]) dy = v.y >= cy2 ? 1 : -1; else dx = v.x >= cx2 ? 1 : -1;
          kx = 1;
        }
        else if (Math.abs(v.x - un.x) >= Math.abs(v.y - un.y) && (v.x !== un.x || v.y !== un.y)) dx = v.x >= un.x ? 1 : -1; else dy = v.y >= un.y ? 1 : -1;
        for (var n = 0; n < e.n; n++) {
          var nx = v.x + dx, ny = v.y + dy;
          if (!self.pass(v.mt, nx, ny) || self.occ[ny * self.w + nx]) { if (kx && n === 0) { dx = -dx; dy = -dy; nx = v.x + dx; ny = v.y + dy; if (!self.pass(v.mt, nx, ny) || self.occ[ny * self.w + nx]) break; } else break; }
          self.moveTo(v, nx, ny);
        }
        self.emit({ t: 'knock', id: v.id, x: v.x, y: v.y });
      }); break;
      case 'summon':
        for (var n = 0; n < e.n; n++) {
          var s;
          if (u.side === 'ally') {
            var m = DS.MERCS[e.type], kk = e.k || 0.7;      // 2.2.6 k: 부른 것의 세기 (옛 망자 부름 0.7)
            s = { side: 'ally', role: 'summon', owner: u.id, type: e.type, name: m.name, L: u.L, look: [e.type, 1], hp: Math.round(u.mhp * (e.kh || kk)), mp: 0, mmp: 0,      // kh · ka · kd: 체력 · 공격 · 방어만 따로
                  atk: Math.round(u.mag * (e.ka || kk)), mag: Math.round(u.mag * kk), def: Math.round(u.def * (e.kd || kk + 0.2)), res: Math.round(u.res * kk), spd: m.spd, mv: m.mv, mt: m.mt,
                  rng: m.rng.slice(), atkKind: m.atk, dtype: m.dtype, kind: m.kind, tags: (m.tags || []).slice(), life: e.dur, x: u.x, y: u.y };
            s.mhp = s.hp;
          } else { s = self.mk(e.type, { x: u.x, y: u.y, grp: u.grp, L: Math.max(1, u.L - 2), expMul: 0.25 }); s.summoned = true; s.owner = u.id; }
          var nu = self.add(s); if (nu) { nu.aggro = true; nu.gauge = 40; }
        }
        break;
      case 'blink':
        var best = null, bs = -1e9, foes = self.units.filter(function (v) { return !v.dead && v.side !== u.side; }), bgB = isBig(u);
        for (var k = 0; k < 24; k++) {
          var bx = u.x + Math.floor(self.rand() * 11) - 5, by2 = u.y + Math.floor(self.rand() * 11) - 5;
          if (bgB ? !self.fits(u, bx, by2, 'foot') : (!self.pass('foot', bx, by2) || self.occ[by2 * self.w + bx])) continue;
          var md = 99; foes.forEach(function (f) { md = Math.min(md, bgB ? rd(bx, by2, u, f) : Math.abs(f.x - bx) + Math.abs(f.y - by2)); });
          var sc = -Math.abs(md - 3) + self.rand() * 0.5 - (Math.abs(bx - u.home.x) + Math.abs(by2 - u.home.y) > 7 ? 5 : 0);
          if (sc > bs) { bs = sc; best = [bx, by2]; }
        }
        if (best) { self.moveTo(u, best[0], best[1]); self.emit({ t: 'blink', id: u.id, x: u.x, y: u.y }); }
        break;
      case 'hazard':      // 2.3.0 땅에 남는 위험 (불길 · 독웅덩이 · 서리 · 어둠): 맞은 칸에 dur 초 — 그 위에 선 다른 편이 1초마다 다친다 (예고 칸처럼 붉게 보이고, 자동 전투는 비켜 선다)
        if (!tiles) break;
        var hk = e.k || 'fire', hn = 0;
        tiles.forEach(function (t, i) { if (e.every && i % e.every) return; if (!self.pass('foot', t[0], t[1]) && !self.pass('fly', t[0], t[1])) return; self.hazAt(t[0], t[1], hk, e.dur || 6, e.p || 3, e.s || null, u); hn++; });
        if (hn) { self.emit({ t: 'hazard', id: u.id, k: hk, tiles: self.hz.filter(function (h) { return h.by === u.id && h.t0 === self.t; }).map(function (h) { return [h.x, h.y]; }), dur: e.dur || 6 }); self.reDanger(); }
        break;
      case 'emerge':      // 2.3.0 땅굴: 겨눈 자리(예고의 가운데) 곁 빈 칸으로 솟아오른다 — 몸이 들어가는 자리만
        if (u.dead || !self._at) break;
        var ex = self._at[0], ey = self._at[1], ep = isBig(u) ? self.freeFit(u, ex - ((u.fw || 1) >> 1), ey - ((u.fh || 1) >> 1), 3) : self.freeNear(ex, ey, u.mt, 3);
        if (ep) { self.moveTo(u, ep.x, ep.y); self.emit({ t: 'blink', id: u.id, x: u.x, y: u.y, burrow: 1 }); }
        break;
      case 'boom':      // 2.3.0 터지는 몸 (불똥 도깨비): 효과를 다 준 뒤 스스로 쓰러진다
        if (!u.dead) { u.boomed = true; self.kill(u, null); }
        break;
    }
  });
  this._dashD = dashD0;
  if (o && o.eff) return;      // 자리의 맥박 · 끝 효과는 여기까지
  if (S.zone && (!o || o.last) && !u._echo && !u.dead && !this.result) this.zoneStart(u, id, tiles);      // 남는 자리: 기술(마지막 박자)이 풀린 뒤에 깔린다
  if (o && !o.last) return;
  // 2.1.0 메아리(fx.echo): 필살기·아이템·부르기·순간 이동이 아닌 기술이 확률로 한 번 더 (메아리는 다시 메아리치지 않는다 · 여러 박자 기술은 마지막 박자 뒤에 모든 효과를 한꺼번에)
  if (u.fx && u.fx.echo && !u._echo && !u.dead && !S.ult && !S.item && !this.result && !S.eff.some(function (e) { return e.t === 'summon' || e.t === 'blink'; }) && this.rand() < Math.min(0.4, u.fx.echo)) {
    u._echo = true; this.say(u, '메아리'); this.emit({ t: 'gearfx', id: u.id, k: 'echo', sk: id });
    try { if (o) this.resolve(u, id, tiles, unitTgt && !unitTgt.dead ? unitTgt : null, { b: -1 }); else this.resolve(u, id, tiles, unitTgt && !unitTgt.dead ? unitTgt : null); } finally { u._echo = false; }
  }
};
// ───────── 여러 박자 (2.7 기술 연출): 기술이 한순간에 풀리지 않아도 된다 ─────────
//   모두 sim.update 의 틱으로만 흐른다 (엔진 난수 · 실제 시간은 쓰지 않는다 — 같은 씨앗이면 같은 판). 저장에는 아무것도 남지 않는다.
//   ① 박자  S.beats = [0.2, 0.5, …]  건 순간부터 각 박자가 풀리는 때(초). 효과마다 e.b = 박자 번호(없으면 0). 쓰는 이는 마지막 박자 + 0.3초까지 묶인다.
//        박자마다 대상은 다시 잰다: 한 사람을 겨눈 기술은 그 사람을(어디에 있든 · 쓰러졌으면 남은 박자는 거둔다), 칸을 겨눈 기술은 그때 그 칸에 선 이를, 제 둘레 기술은 그때 제 둘레를.
//        쓰는 이가 쓰러지면 남은 박자는 거둔다. 돌파(dash) · 물러서기(back) · 메아리는 마지막 박자 뒤.
//   ② 예고 낙하  S.fall = { delay: 0.9, dz: 1, hold: 0.55 }  겨눈 칸에 표시('mark')를 남기고 delay 초 뒤에 떨어진다 (beats 가 있으면 그때부터 박자).
//        쓰는 이는 hold 초 뒤에 풀린다(떨어지기를 기다리지 않는다). dz 가 0 이 아니면 표시된 칸은 붉은 칸이다 — 맞을 쪽의 자동 전투가 비켜 설 수 있다 (P.dodge).
//   ③ 남는 자리  S.zone = { dur: 5, every: 1, eff: [...], end: [...], k: 'fire', to: 'foe' | 'ally', dz: 0 }  기술이 풀린 칸이 dur 초 남아 every 초마다 그 위에 선 이에게 eff 를 준다.
//        end 는 자리가 다할 때 한 번. 같은 사람의 같은 기술은 하나만 남는다(새로 깔면 옛것은 걷힌다). 쓰는 이가 쓰러지면 걷힌다. dz 를 켜면 붉은 칸으로 친다.
//   사건: skill { qid, beats, fall } (걸 때 한 번) · mark { qid, tiles, dur, side } · beat { qid, i, n, last, tiles, ids } (그 박자의 hit 들 바로 앞) · seqEnd { qid, cancel }
//         zone { zid, k, tiles, dur, side, to } · zoneTick { zid, n, ids } · zoneEnd { zid, cancel }
P.ZN = { max: 10 };
P.seqStart = function (u, id, tiles, tgt, c) {
  var S = SK[id], B = S.beats || [0], F = S.fall || null, d0 = F ? (F.delay == null ? 0.8 : F.delay) : 0;
  var Q = { id: ++this._qid, u: u, sk: id, tiles: tiles, tgt: tgt, c: c, t: 0, bi: 0, at: B, n: B.length, d0: d0, dz: !!(F && F.dz !== 0 && tiles), side: u.side, end: false };
  this.sq.push(Q);
  this.emit({ t: 'skill', id: u.id, sk: id, fx: S.fx, tiles: tiles || this.victims(u, S, null).map(function (v) { return [v.x, v.y]; }), from: [u.x, u.y], qid: Q.id, beats: Q.n, fall: d0, dur: d0 + B[B.length - 1] });
  if (F && tiles) { this.emit({ t: 'mark', qid: Q.id, id: u.id, sk: id, tiles: tiles, dur: d0 + B[0], side: u.side }); if (Q.dz) this.reDanger(); }
  u.busy = F ? Math.max(0.55, F.hold || 0) : Math.max(0.55, B[B.length - 1] + 0.3);
  this.seqTick(0);      // 0초 박자는 바로
  return true;
};
P.seqBeat = function (Q) {
  var u = Q.u, S = SK[Q.sk], i = Q.bi++, last = Q.bi >= Q.n, tiles = Q.tiles, vs;
  if (u.dead || (Q.tgt && Q.tgt.dead)) { Q.end = true; Q.cancel = true; return; }
  if (S.tg === 'self' && tiles && S.area !== 'all') tiles = Q.tiles = this.areaTiles(u, S, u.x, u.y);      // 제 둘레 기술은 박자마다 제 자리에서
  if (Q.dz) { Q.dz = false; this.reDanger(); }
  vs = Q.tgt ? [Q.tgt] : this.victims(u, S, tiles);
  this.emit({ t: 'beat', qid: Q.id, id: u.id, sk: Q.sk, i: i, n: Q.n, last: last, tiles: tiles || vs.map(function (v) { return [v.x, v.y]; }), ids: vs.map(function (v) { return v.id; }), from: [u.x, u.y] });
  this._at = Q.c; this.resolve(u, Q.sk, tiles, Q.tgt, { b: i, last: last, vs: vs }); this._at = null;
  if (!last) return;
  Q.end = true;
  if (S.dash && tiles && !u.dead && !this.result) this.dashTo(u, tiles);
  if (S.back && !u.dead && !this.result) this.hopBack(u, S.back, Q.tgt);
};
P.seqTick = function (dt) {
  var sq = this.sq, i, Q, n = 0, dzD = false;
  for (i = 0; i < sq.length; i++) {
    Q = sq[i]; Q.t += dt;
    if (Q.u.dead) { Q.end = true; Q.cancel = true; }
    while (!Q.end && Q.bi < Q.n && Q.t + 1e-6 >= Q.d0 + Q.at[Q.bi]) this.seqBeat(Q);
    if (Q.end) { if (Q.dz) dzD = true; this.emit({ t: 'seqEnd', qid: Q.id, id: Q.u.id, sk: Q.sk, cancel: !!Q.cancel }); continue; }
    sq[n++] = Q;
  }
  sq.length = n;
  if (dzD) this.reDanger();
};
P.seqFlush = function () { for (var k = 0; k < 8 && this.sq.length; k++) { for (var i = 0; i < this.sq.length; i++) this.sq[i].t = 1e6; this.seqTick(0); } };      // 시험 · 도구용: 걸려 있는 박자를 지금 모두 푼다
P.zoneStart = function (u, id, tiles) {
  var S = SK[id], Z0 = S.zone, zn = this.zn, i, n = 0;
  if (!Z0 || !tiles || !tiles.length) return null;
  for (i = 0; i < zn.length; i++) { if (zn[i].u === u && zn[i].sk === id) { this.emit({ t: 'zoneEnd', zid: zn[i].id, cancel: true }); continue; } zn[n++] = zn[i]; }
  zn.length = n;
  while (zn.length >= this.ZN.max) this.emit({ t: 'zoneEnd', zid: zn.shift().id, cancel: true });      // 한 판에 ZN.max 자리까지 (가장 오래된 것부터 걷힌다)
  var Z = { id: ++this._qid, u: u, sk: id, tiles: tiles.slice(), el: 0, dur: Z0.dur || 4, every: Z0.every || 1, next: Z0.first != null ? Z0.first : (Z0.every || 1), k: Z0.k || 'fire', to: Z0.to === 'ally' ? 'ally' : 'foe', side: u.side, dz: !!Z0.dz, n: 0 };
  zn.push(Z);
  this.emit({ t: 'zone', zid: Z.id, id: u.id, sk: id, k: Z.k, tiles: Z.tiles, dur: Z.dur, side: Z.side, to: Z.to });
  if (Z.dz) this.reDanger();
  return Z;
};
P.zoneVs = function (Z) { return this.victims(Z.u, { side: Z.to === 'ally' ? 'ally' : 'enemy' }, Z.tiles).filter(function (v) { return v.side !== 'neutral'; }); };
P.zoneTick = function (dt) {
  var zn = this.zn, i, Z, Z0, n = 0, vs, dzD = false;
  for (i = 0; i < zn.length; i++) {
    Z = zn[i]; Z0 = SK[Z.sk].zone; Z.el += dt;
    if (Z.u.dead) { if (Z.dz) dzD = true; this.emit({ t: 'zoneEnd', zid: Z.id, cancel: true }); continue; }
    while (Z.el + 1e-6 >= Z.next && Z.next <= Z.dur + 1e-6 && !Z.u.dead && !this.result) {
      Z.next += Z.every; vs = this.zoneVs(Z);
      this.emit({ t: 'zoneTick', zid: Z.id, n: ++Z.n, ids: vs.map(function (v) { return v.id; }) });
      if (vs.length && Z0.eff) this.resolve(Z.u, Z.sk, Z.tiles, null, { eff: Z0.eff, vs: vs });
    }
    if (Z.el + 1e-6 >= Z.dur) {
      if (Z0.end && !Z.u.dead && !this.result) { vs = this.zoneVs(Z); if (vs.length) this.resolve(Z.u, Z.sk, Z.tiles, null, { eff: Z0.end, vs: vs }); }
      if (Z.dz) dzD = true; this.emit({ t: 'zoneEnd', zid: Z.id }); continue;
    }
    zn[n++] = Z;
  }
  zn.length = n;
  if (dzD) this.reDanger();
};
// 판이 끝나면 걸려 있던 박자 · 자리를 모두 거둔다 (화면이 표시를 지운다)
P.seqClear = function () {
  var i;
  for (i = 0; i < this.sq.length; i++) this.emit({ t: 'seqEnd', qid: this.sq[i].id, id: this.sq[i].u.id, sk: this.sq[i].sk, cancel: true });
  for (i = 0; i < this.zn.length; i++) this.emit({ t: 'zoneEnd', zid: this.zn[i].id, cancel: true });
  this.sq.length = 0; this.zn.length = 0; this.reDanger();
};
P.reDanger = function () {
  var a = this.dz.ally, e = this.dz.enemy, w = this.w;
  a.fill(0); e.fill(0);
  this.tele.forEach(function (T) { var z = T.u.side === 'enemy' ? a : e; T.tiles.forEach(function (t) { z[t[1] * w + t[0]] = 1; }); });
  for (var i = 0; i < this.hz.length; i++) { var h = this.hz[i]; (h.side === 'enemy' ? a : e)[h.y * w + h.x] = 1; }      // 2.3.0: 땅의 위험도 비켜 선다
  var mk = function (tl, z) { for (var k = 0; k < tl.length; k++) z[tl[k][1] * w + tl[k][0]] = 1; };
  for (i = 0; i < this.sq.length; i++) if (this.sq[i].dz) mk(this.sq[i].tiles, this.sq[i].side === 'enemy' ? a : e);      // 예고 낙하의 표시
  for (i = 0; i < this.zn.length; i++) if (this.zn[i].dz && this.zn[i].to !== 'ally') mk(this.zn[i].tiles, this.zn[i].side === 'enemy' ? a : e);      // 붉은 칸으로 치는 자리
};
// 2.3.0 땅의 위험 하나 (같은 편이 같은 칸에 또 깔면 더 긴 쪽으로)
P.HZ = { max: 72, boss: 0.25 };
P.hazAt = function (x, y, k, dur, p, s, u) {
  var hz = this.hz, i, h;
  for (i = 0; i < hz.length; i++) { h = hz[i]; if (h.x === x && h.y === y && h.side === u.side) { h.t = Math.max(h.t, dur); h.dur = Math.max(h.dur, dur); h.k = k; h.p = Math.max(h.p, p); h.s = s || h.s; h.by = u.id; h.t0 = this.t; return h; } }
  if (hz.length >= this.HZ.max) hz.shift();
  h = { x: x, y: y, k: k, t: dur, dur: dur, p: p, s: s, side: u.side, by: u.id, t0: this.t, acc: 0.4, id: ++this._hzC };
  hz.push(h); return h;
};
P.hazTick = function (dt) {
  var hz = this.hz, gone = false, i, h, v, n = 0;
  for (i = 0; i < hz.length; i++) {
    h = hz[i]; h.t -= dt;
    if (h.t <= 0) { gone = true; continue; }
    hz[n++] = h;
    h.acc -= dt; if (h.acc > 0) continue;
    h.acc += 1;
    v = this.occ[h.y * this.w + h.x];
    if (!v || v.dead || v.side === h.side || v.side === 'neutral' || v._hzT === this.t) continue;
    if (h.k === 'fire' && v.passive === 'fireborn') continue;
    v._hzT = this.t;
    var src = this.byId[h.by], d = Math.max(1, Math.round(v.mhp * h.p / 100 * (v.role === 'boss' ? this.HZ.boss : 1)));
    this.hurt(v, d, src && !src.dead ? src : null, { type: h.k === 'fire' ? 'burn' : h.k === 'poison' ? 'poison' : 'magic', refl: true, hz: 1 });
    if (!v.dead && h.s && !v.st[h.s]) this.addStatus(v, h.s, h.s === 'slow' ? 3 : 4, h.s === 'burn' || h.s === 'poison' ? 2 : 0, null);
  }
  hz.length = n;
  if (gone) this.reDanger();
};
// 2.3.0 둘레를 물들이는 몸 (u.aura = { s: 'poison' | 'slow' | 'burn', r, p, dur }) — 1초마다 r 칸 안의 다른 편에게 그 상태 (이미 걸려 있으면 시간만 채운다)
P.auraTick = function (u) {
  var A = u.aura, us = this.units, i, v, n = 0;
  for (i = 0; i < us.length; i++) {
    v = us[i]; if (v.dead || v.side === u.side || v.side === 'neutral' || dist(u, v) > (A.r || 1)) continue;
    if (v.st[A.s] && v.st[A.s].t > 1) continue;
    this.addStatus(v, A.s, A.dur || 3, A.p || 0, null); n++;
  }
  if (n) this.emit({ t: 'auraFx', id: u.id, s: A.s, r: A.r || 1 });
};
// 2.3.0 격노: 체력이 u.enr.th 아래로 떨어지는 순간 한 번 — 공격 · 빠르기가 오르고, 새 기술(비기)을 얻고, 게이지가 찬다
P.enrage = function (u) {
  var E = u.enr; if (!E || u.enraged || u.dead) return;
  u.enraged = true;
  u.atk = Math.round(u.atk * (1 + (E.atk || 0))); u.mag = Math.round(u.mag * (1 + (E.atk || 0))); u.spd = u.spd * (1 + (E.spd || 0));
  (E.add || []).forEach(function (k) { if (SK[k] && u.skills.indexOf(k) < 0) { u.skills.push(k); u.cd[k] = SK[k].cd0 || 0; } });
  u.gauge = Math.max(u.gauge, 80); u.gcd = Math.min(u.gcd, 0.6); u.rot = 0;
  if (u.casting) { var T0 = u.casting; this.tele = this.tele.filter(function (T) { return T !== T0; }); u.casting = null; this.emit({ t: 'castEnd', tid: T0.id, cancel: true }); this.reDanger(); u.busy = 0.2; }
  this.say(u, E.say || '격노');
  this.emit({ t: 'enrage', id: u.id });
};
// 아이템 (약초·마나초·기운초). 폭탄은 기술 i_bomb 으로 처리.
var ITEM_FX = { herb: 1, mana: 1, endo: 1 };      // 엔진이 효과를 아는 소모품 (나머지는 기술 i_키 로, 귀환·모닥불은 화면 쪽 DS.useFieldItem 으로)
P.useItem = function (u, key, tgt) {
  if (!(this.inv[key] > 0)) return false;
  if (DS.BAL.fix28 && !ITEM_FX[key]) { this.say(u, '여기서는 쓸 수 없다'); return false; }      // 효과 없이 개수만 깎이던 것 (귀환 두루마리·모닥불 꾸러미가 전투 막대로 들어오면)
  if (key === 'endo') { var EN = DS.ENDO || { gauge: 50, cd: 15 }; if (this.t < (this.endoT || 0)) { this.say(u, '기운초는 ' + Math.ceil(this.endoT - this.t) + '초 뒤'); return false; } this.endoT = this.t + EN.cd; this.inv.endo--; u.gauge = Math.min(100, u.gauge + EN.gauge); this.emit({ t: 'item', id: u.id, key: key, tid: u.id }); this.emit({ t: 'inv' }); u.busy = 0.2; return true; }
  var c = TK.item * this.q(u); if (u.gauge < c) return false;
  tgt = tgt || u; this.inv[key]--; u.gauge -= c;
  this.emit({ t: 'item', id: u.id, key: key, tid: tgt.id }); this.emit({ t: 'inv' });
  if (key === 'herb') this.heal(tgt, tgt.mhp * 0.4);
  if (key === 'mana') { var a = Math.min(tgt.mmp - tgt.mp, Math.round(tgt.mmp * 0.5)); tgt.mp += a; this.emit({ t: 'mana', id: tgt.id, v: a }); }
  u.busy = 0.35;
  return true;
};

// ───────── 공통 행동 ─────────
P.atkCost = function (u) { return TK.attack * this.q(u) * (u.fx && u.fx.atkTick ? Math.max(0.6, u.fx.atkTick) : 1); };
P.attack = function (u, v) {
  var c = this.atkCost(u);
  if (u.gauge < c) { this.wait(u); return true; }
  u.gauge -= c; if (v.x !== u.x) u.face = v.x > u.x ? 1 : -1;
  var d = dist(u, v), m = (u.basic || 1) * (d < u.rng[0] ? 0.7 : 1), n = (u.passive === 'twin' || u.twin) ? 2 : 1;
  var vt = isBig(v) ? nearT(v, u.x, u.y) : v;
  this.emit({ t: 'atk', id: u.id, tid: v.id, kind: u.atkKind, tx: vt.x, ty: vt.y });
  for (var k = 0; k < n && !v.dead; k++) {
    if (v.fx && v.fx.eva && this.rand() < Math.min(0.35, v.fx.eva)) { this.emit({ t: 'miss', id: v.id, by: u.id }); continue; }      // 회피 (회피 칸이 없는 상대에게는 주사위를 굴리지 않는다)
    var crit = this.rand() < (u.crit || 0.06), dmg = this.calc(u, v, m * (n > 1 ? 0.65 : 1) * (crit ? 1.5 + (u.fx && u.fx.critX || 0) : 1));      // critX: 치명타 피해 덤 (장비)
    var vx = v.x, vy = v.y;
    this.hurt(v, dmg, u, { crit: crit, type: u.dtype });
    if (this.drainOf(u)) this.leech(u, dmg * this.drainOf(u));
    if (u.fx && (u.fx.pierce || u.fx.splash) && !this.result) this.fxSpread(u, { x: vt.x, y: vt.y, id: v.id, me: v }, dmg);      // 2.1.0: 꿰뚫기·튀기기 (맞힌 적이 쓰러져도 그 자리에서)
    if (u.fx && u.fx.hitSt && !v.dead) for (var sk in u.fx.hitSt) if (this.rand() < Math.min(0.6, u.fx.hitSt[sk])) this.addStatus(v, sk, sk === 'poison' ? 8 : 6, sk === 'poison' ? 3 : 0);      // 적중 시 상태
  }
  u.busy = 0.5;
  return true;
};
// 상태이상을 건다. 면역이면 걸리지 않고, 저항만큼 짧아진다. (보스에게는 절반)
P.addStatus = function (v, s, dur, p, by) {
  if (v.fx) { if (v.fx.immune && v.fx.immune[s]) return false; if (v.fx.stRes) dur *= 1 - Math.min(0.7, v.fx.stRes); }
  v.st[s] = { t: v.role === 'boss' ? dur * 0.5 : dur, p: p || 0, acc: 0 }; if (by) v.st[s].by = by; this.emit({ t: 'status', id: v.id, s: s });      // by: 우리 편이 건 화상 · 중독은 그 사람이 준 피해로 친다 (2.2.6)
  return true;
};
// 흡혈 회복. 때릴 때마다 숫자를 띄우면 화면을 덮으므로 모아 두었다가 1초에 한 번 알린다 (tick 에서).
P.leech = function (u, amt) { var a = this.heal(u, amt, true); if (a > 0) u.leechAcc = (u.leechAcc || 0) + a; };
P.reach = function (u) { return u.rng[1] + (u.atkKind === 'arrow' && this.kind[u.y * this.w + u.x] === 'hill' ? 1 : 0); };
// 사거리 안이면 fire(), 아니면 다가간다
P.engage = function (u, v, r0, r1, fire, max) {
  var d = dist(u, v);
  if (d <= r1 && d >= r0) return fire.call(this);
  var dz = this.dz[u.side], foe = u.side === 'enemy', land = this.cst[0], kind = this.kind, hot = this.burns(u), bg = isBig(u) || isBig(v);
  var r = this.go(u, function (x, y, c, i) {
    var dd = bg ? rd(x, y, u, v) : Math.abs(x - v.x) + Math.abs(y - v.y);
    if (dd === 0) return null;
    var s = (dd <= r1 && dd >= r0) ? c - (r1 > 1 ? Math.min(dd, r1) * 0.4 : 0) : 500 + dd * 20 + c;
    if (foe && !land[i]) s += 40;
    if (hot && kind[i] === 'lava') s += 6;      // 때릴 자리가 여럿이면 용암 밖에서 때린다
    return s + (dz[i] ? 300 : 0);
  }, max || 30);
  if (r === 'here') { this.wait(u, 0.25); u.stuck = (u.stuck || 0) + 1; } else u.stuck = 0;
  return true;
};
P.foes = function (u) {   // 싸움이 붙은 상대
  return this.units.filter(function (v) { return !v.dead && v.side !== u.side && (u.side === 'enemy' || v.aggro); });
};
P.friends = function (u) { return this.units.filter(function (v) { return !v.dead && v.side === u.side && v.role !== 'shade'; }); };      // 2.5.0: 그림자(이름 부르기)는 고침 · 가호의 대상이 아니다 (shade.js)
// 살아 있는 아군 목록. 명부가 바뀔 때(등장·쓰러짐·이탈)만 다시 만든다 — 적 하나하나가 생각할 때마다 전체를 거르던 것을 줄인다. 돌려받은 배열은 고치지 않는다.
P.allies = function () {
  if (this._allyV !== this._ver) { this._ally = this.units.filter(function (v) { return !v.dead && v.side === 'ally'; }); this._allyV = this._ver; }
  return this._ally;
};
// 오래전에 쓰러진 적과 소환수를 명부에서 지운다 (한 지역에서 오래 사냥하면 units·byId 가 끝없이 늘던 문제). 쓰러진 지휘관·용병은 남긴다 — 밖에서 찾아 쓴다.
P.sweep = function () {
  var us = this.units, t = this.t, n = 0, i, u;
  for (i = 0; i < us.length; i++) {
    u = us[i];
    if (u.dead && (u.side === 'enemy' || u.role === 'summon' || u.role === 'shade') && t - (u.deadT || 0) > 5) { if (this.byId[u.id] === u) delete this.byId[u.id]; u.gone = true; }
    else us[n++] = u;
  }
  us.length = n;
};
P.pickTarget = function (u, foes, anchor, maxD) {
  var best = null, bs = 1e9, r1 = this.reach(u);
  for (var i = 0; i < foes.length; i++) {
    var v = foes[i], d = dist(u, v);
    if (anchor && dist(anchor, v) > maxD && d > 3 && !(this.mode === 'zone' && v.prov > this.t && dist(anchor, v) <= 9)) continue;
    var s = d * 10 + (v.hp / v.mhp) * 6 + (d <= r1 ? -25 : 0);
    if (DS.COUNTER[u.kind] === v.kind) s -= 8;
    if (u.atkKind === 'arrow' && has(v, 'fly')) s -= 8;
    if (u.side === 'enemy') { s += v.def * 0.05; if (v.role !== 'cmd') s += 3; if (u.hate === v.id && !(u.hateT <= this.t)) s -= u.hateP || 12; if (v.back) s += 30; if (v.shun) s += v.shun; }      // 2.5.0 shun: 적은 그림자보다 산 사람을 먼저 노린다 (shade.js)      // hate: 도발한 용병 (hateT 까지, hateP 만큼 더 노린다)      // 물러나는 용병은 덜 노린다 (아예 안 노리지는 않는다 — 곁에 남은 상대가 없으면 쫓는다)
    else { if (v.skills && v.skills.indexOf('e_heal') >= 0) s -= 10; if (u.hate === v.id && !(u.hateT <= this.t)) s -= u.hateP || 12; if (v.pri) s -= v.pri; }      // 2.3.0: 적의 도발(방패병)도 우리 편을 끌어당긴다 · pri = 먼저 쳐야 할 적(주술사 · 터지는 몸)
    if (s < bs) { bs = s; best = v; }
  }
  return best;
};
// 2.1: 붉은 칸 피하기는 완벽하지 않다 — 칸에 들어선(칸이 깔린) 순간 한 번 굴려, 알아채면 잠시 뒤에 걸어 나오고 못 알아채면 맞는다.
//   전에는 자동 지휘관·적 모두 예고가 뜨자마자 빠져나가 기술이 거의 맞지 않았다 (사용자 「스킬을 자동일 때 너무 잘 피한다」).
DS.BAL.dodge = DS.BAL.dodge || { ally: 0.7, enemy: 0.55, boss: 0.85, d0: 0.35, d1: 1.5 };      // 알아챌 확률 · 알아채기까지 걸리는 시간(초) d0~d1
P.dodgeRoll = function (u) {
  var D = DS.BAL.dodge, p = u.side === 'ally' ? D.ally : u.role === 'boss' ? D.boss : D.enemy;
  if (u.side === 'ally' && u.order && u.order.t === 'move') return this.t;      // 사람이 직접 옮기는 중이면 굴리지 않는다
  return this.rand() < p ? this.t + D.d0 + this.rand() * (D.d1 - D.d0) : Infinity;
};
P.dodge = function (u) {
  if (isBig(u)) return false;      // 2.3.0: 큰 몸은 예고를 맞받는다
  var dz = this.dz[u.side], w = this.w;
  if (!dz[u.y * w + u.x]) { u._dzAt = null; return false; }
  if (u.casting) return false;
  if (u._dzAt == null) u._dzAt = this.dodgeRoll(u);
  if (this.t < u._dzAt) return false;
  var r = this.go(u, function (x, y, c, i) { return dz[i] ? null : c; }, 8);
  if (r === 'here') return false;
  return true;
};

// ───────── 지휘관 ─────────
P.setOrder = function (id, o) {
  var u = this.byId[id]; if (!u || u.dead || u.side !== 'ally') return;
  u.order = o;
  if (o && o.t === 'move') u.holdT = 0;
  if (u.busy > 0 && !u.casting) u.busy = Math.min(u.busy, o && o.t === 'move' ? 0.12 : (u.busy < 0.3 ? 0.05 : u.busy));   // 이동 명령은 무엇보다 먼저
};
// 이동 명령의 길. 먼저 지형만 보고(적·아군이 비켜 준다고 치고) 가장 가까이 갈 수 있는 칸을 찾는다.
// 그 길에 적이 서 있거나 아군에게 오래 막혔으면, 비켜 가는 길로도 그만큼 가까이 갈 수 있는지 본다. 없으면 막힌 길로 가서 기다린다 — 명령을 버리지 않는다.
P.planMove = function (u, o) {
  var self = this, w = this.w, me = u.y * w + u.x, tx = o.x, ty = o.y;
  function pick(mode) {
    var list = self.flood(u, 400, mode), best = -1, bs = Infinity, n, i, px, sc, j;
    for (n = 0; n < list.length; n++) {
      i = list[n]; if (self.occ[i] && self.occ[i] !== u && self.occ[i].side !== u.side) continue;
      px = i % w; sc = (Math.abs(px - tx) + Math.abs((i - px) / w - ty)) * 100 + self._d[i];
      if (sc < bs) { bs = sc; best = i; }
    }
    var r = { d: 1e9, path: [], foe: false };
    if (best < 0) return r;
    px = best % w; r.d = Math.abs(px - tx) + Math.abs((best - px) / w - ty);
    for (j = best; j >= 0 && j !== me; j = self._p[j]) { r.path.unshift(j); if (self.occ[j] && self.occ[j].side !== u.side) r.foe = true; }
    return r;
  }
  var a = pick(2), stuck = o.fail >= 8, b;
  if (a.foe || stuck) { b = pick(stuck ? 0 : 1); if (b.d <= a.d) a = b; }
  o.path = a.path;
};
// 명령(이동 제외)을 쥔 지휘관의 몸 사리기 (DS.BAL.ordSafe). 자동 지휘관이 aiCmd 에서 늘 하던 두 가지 — 예고된 붉은 칸에서 걸어 나오기, HP 30% 아래면 약초 —
// 가 명령을 거는 순간 꺼져서, 적을 눌러 공격시킨 지휘관이 자동보다 더 죽던 문제. 명령은 버리지 않는다: 피하고(먹고) 나서 이어 간다.
// 아이템 명령 중에는 약초를 겹쳐 쓰지 않는다 (그 명령이 약초일 수 있다).
P.ordGuard = function (u) {
  if (this.dodge(u)) return true;
  if (this.combat && u.order.t !== 'item' && u.hp < u.mhp * 0.3 && this.inv.herb > 0 && u.gauge >= TK.item) return this.useItem(u, 'herb', u);
  return false;
};
P.runOrder = function (u) {
  var o = u.order, self = this, v, S, r;
  switch (o.t) {
    case 'hold':
      v = this.pickTarget(u, this.foes(u).filter(function (f) { return dist(u, f) <= self.reach(u); }));
      if (v) return this.attack(u, v);
      this.wait(u, 0.2); return true;
    case 'move':
      // 사용자가 찍은 이동은 무엇보다 먼저다. 길을 한 번 정하면 끝까지 따라가고, 누가 막아도 명령을 쥔 채 기다렸다가 다시 간다.
      if (o.path && o.path.length && !this.adj(u, o.path[0])) o.path = null;      // 밀려났다(넉백·자리 바꿈): 이웃하지 않은 칸으로 건너뛰지 않고 길을 다시 잡는다
      if (!o.path) this.planMove(u, o);
      if (!o.path.length) { u.order = null; if (this.combat) u.holdT = this.t + 5; this.emit({ t: 'arrive', id: u.id }); return false; }
      var nx = o.path[0], oc = this.occ[nx];
      if (oc && oc !== u && !(oc.side === u.side && this.canSwap(u, oc))) {
        var mine = oc.side === u.side;
        o.fail = (o.fail || 0) + 1; if (o.b0 == null) o.b0 = this.t;
        if (mine && o.path.length === 1 && o.fail >= 8) { u.order = null; if (this.combat) u.holdT = this.t + 5; this.emit({ t: 'arrive', id: u.id }); return false; }      // 찍은 칸을 비켜 주지 않는 아군: 그 곁이 도착이다
        if (this.t - o.b0 > 10) {      // 10초를 기다려도 길이 열리지 않는다: 그만둔다 (화면에서 알릴 수 있게 알린다)
          u.order = null; if (this.combat) u.holdT = this.t + 5; this.emit({ t: 'blocked', id: u.id, x: o.x, y: o.y }); return false;
        }
        if (o.fail % 4 === 0) o.path = null;      // 다른 길이 열렸는지 다시 본다
        if (!mine && dist(u, oc) <= this.reach(u)) {      // 길을 막아선 적은 친다. 치고 있는 동안은 포기하지 않는다
          if (u.gauge >= this.atkCost(u)) o.b0 = this.t;
          return this.attack(u, oc);
        }
        this.wait(u, 0.12); return true;
      }
      if (this.step(u, nx)) { o.path.shift(); o.fail = 0; o.b0 = null; }
      return true;
    case 'attack':
      v = this.byId[o.tid];
      if (!v || v.dead) { u.order = null; return false; }
      this.rouseNear(u, v);
      return this.engage(u, v, 1, this.reach(u), function () { return this.attack(u, v); }, 80);
    case 'skill':
      S = SK[o.id];
      if (u.fx && u.fx.seal && !S.item) { u.order = null; this.say(u, '기술 봉인'); return false; }
      if ((u.mp || 0) < (S.mp || 0) || (S.item && !(this.inv[o.id.slice(2)] > 0))) { u.order = null; this.say(u, S.item ? '없다!' : '마나 부족'); return false; }
      var c = S.tick * this.q(u);
      if (S.tg === 'self' || S.tg === 'multi') {      // r36: 여럿을 고르는 필살기(세 갈래 화살)는 겨누지 않는다
        if (u.gauge < c) { this.wait(u); return true; }
        this.cast(u, o.id, null); u.order = null; return true;
      }
      if (S.tg === 'dir') {
        if (u.gauge < c) { this.wait(u); return true; }
        this.cast(u, o.id, { x: o.x, y: o.y }); u.order = null; return true;
      }
      v = o.tid ? this.byId[o.tid] : { x: o.x, y: o.y };
      if (!v || v.dead) { u.order = null; return false; }
      if (o.tid && v.side === 'enemy') this.rouseNear(u, v);
      if (dist(u, v) < S.rng[0]) { u.order = null; this.say(u, '너무 가깝다'); return false; }
      return this.engage(u, v, S.rng[0], S.rng[1], function () {
        if (u.gauge < c) { this.wait(u); return true; }
        this.cast(u, o.id, v); u.order = null; return true;
      }, 80);
    case 'item':
      v = o.tid ? this.byId[o.tid] : u;
      if (!v || v.dead || !(this.inv[o.key] > 0)) { u.order = null; return false; }
      if (o.key === 'endo') { this.useItem(u, 'endo'); u.order = null; return true; }
      return this.engage(u, v, 0, 2, function () {
        if (u.gauge < TK.item * this.q(u)) { this.wait(u); return true; }
        this.useItem(u, o.key, v); u.order = null; return true;
      }, 80);
  }
  u.order = null; return false;
};
P.rouseNear = function (u, v) { if (v.side === 'enemy' && !v.aggro && dist(u, v) <= 7) this.rouse(v); };

// ── 자동 지휘관의 공격 기술 고르기 (DS.BAL.cmdBest) ──
// 쓸 수 있는(마나·재사용·대상) 공격·약화 기술을 모두 모아 "틱 하나에 얻는 값"이 가장 큰 것을 돌려준다. 게이지는 보지 않는다 — 모자라면 cmdFire 가 기다린다.
//   값 = 맞는 대상마다 (어림 피해 — 남은 체력까지만 친다 + 덧효과) × 무게(보스 1.5). 어림 피해는 calc 와 같은 식(공격·방어·저항·상성·신성 약점)에서 난수와 지형만 뺀 것.
//       덧효과(둔화·게이지 깎기·능력 깎기·흡수)는 그 대상에게 넣는 평타 한 대를 단위로 조금씩 쳐 준다.
//   비용 = 틱 + 마나 몫 (마나가 bestFree 아래로 줄수록 무겁게 — 큰 기술만 쓰다 판 중반에 마나가 바닥나는 것을 막는다. P.bestMana 0 이면 틱만)
//   평타보다 틱당 bestMin 배는 나아야 후보다 (방어 높은 적에게나 쓸 번개를 아무에게나 써서 마나를 비우던 것).
// 범위 기술은 지금처럼 둘 이상(보스는 혼자서 둘로 친다) 맞을 때만. 둔화·저주처럼 피해가 없는 약화 기술은 보스에게만 건다 (졸개마다 걸어 말풍선만 늘리던 것).
// 난수를 부르지 않는다 (마른 실행에서도 불린다).
P.bestMana = 300; P.bestFree = 0.6;      // 마나가 최대의 bestFree 이상이면 마나는 따지지 않는다. 그 아래로는 줄어드는 만큼 무겁게
P.bestDebuff = 2;      // 피해 없는 약화 기술(둔화·저주)의 값: 보스에게 넣는 평타 이만큼 (효과 하나에)
P.bestSup = 8;         // 가호를 건 뒤 이 초 동안은(또는 공격 기술을 쓸 때까지) 다음 가호를 미룬다
P.bestMin = 1.15;
P.bestNoOwe = 1;      // 1: 치유를 맡은 지휘관은 치유·가호·소환 뒤에 평타를 빚지지 않고 바로 공격 기술을 모은다 (aiCmd) / 2: 모든 지휘관 / 0: 끔
function posBuff(e) { return e.t === 'buff' && (e.p > 0 || e.s === 'shd'); }      // 2.2.6: 보호막(shd)은 p 대신 m 을 지닌 가호
function isOff(S) { var t = S.eff[0].t; return !(t === 'heal' || t === 'cleanse' || t === 'summon' || posBuff(S.eff[0])); }
// 어림 피해 (난수·지형 없이). e: { m, type, stat, flat }
P.estDmg = function (u, v, e, item) {
  var type = e.type || (item ? 'magic' : null) || u.dtype || 'phys';
  var A = e.flat ? 30 + 4.5 * u.L : e.stat === 'atk' ? u.atk : e.stat === 'mix' ? (u.atk + u.mag) * 0.6 : (type === 'phys' ? u.atk : u.mag);
  if (!e.flat) A *= this.bf(u, 'atk');
  var raw = A * e.m, d = Math.max(raw * 0.15, raw - (type === 'phys' ? v.def : v.res) * this.bf(v, 'def') * 0.5);
  if (type === 'phys') {
    if (DS.COUNTER[u.kind] === v.kind) d *= 1.25;
    if (u.atkKind === 'arrow' && has(v, 'fly')) d *= 1.5;
    if (has(v, 'ethereal')) d *= 0.5;
  }
  if (type === 'holy' && (has(v, 'undead') || has(v, 'demon'))) d *= 1.5;
  if (u.fx && u.fx.bossDmg && v.role === 'boss') d *= 1 + u.fx.bossDmg;
  if (v.st && v.st.mark) d *= 1 + (v.st.mark.p || 20) / 100;      // 2.2.6 표식
  if (e.vs && vsHit(v, e.vs)) d *= e.vx || 1.5;      // 2.2.6 맞물림 (둔화 · 화상 · 젖음 · 표식 …)
  return d;
};
// 2.2.6: 화상 · 중독이 남은 시간 동안 깎을 어림 (보스는 4분의 1 · 시간도 절반)
P.dotVal = function (v, e) { var bs = v.role === 'boss', n = Math.floor((bs ? e.dur * 0.5 : e.dur) / 2); return Math.min(v.hp, v.mhp * (e.p || 0) / 100 * (bs ? 0.25 : 1) * n); };
// 2.2.6: 연쇄가 옮겨 갈 적의 어림 피해 (맞은 적 둘레 r 칸에서 가까운 차례로 n)
P.chainVal = function (u, v0, e, foes) {
  var hit = [v0], from = v0, out = 0, i, f, d, nx, nd;
  for (var c = 0; c < e.n; c++) { nx = null; nd = 99; for (i = 0; i < foes.length; i++) { f = foes[i]; if (hit.indexOf(f) >= 0) continue; d = dist(from, f); if (d <= e.r && d < nd) { nd = d; nx = f; } } if (!nx) break; hit.push(nx); out += Math.min(nx.hp, this.estDmg(u, nx, e)) * (nx.role === 'boss' ? 1.5 : 1); from = nx; }
  return out;
};
P.auraVal = function (u, e) {      // 2.2.5: 기공(aura)이 실제로 채울 체력의 합 (난수 없음)
  var amt = (u.mag * e.m + 8) * (u.side === 'ally' ? DS.BAL.healAlly : 1), out = 0, us = this.units, f;
  for (var i = 0; i < us.length; i++) { f = us[i]; if (!f.dead && f.side === u.side && dist(u, f) <= e.r) out += Math.min(f.mhp - f.hp, amt); }
  return out;
};
P.mendTgt = function (u, r) {      // 2.2.5: 기 전하기의 대상 — r 칸 안 우리 편 가운데 체력 비율이 가장 낮은 이 (90% 아래만 · 가주는 조금 먼저)
  if (u._mtT === this.t && u._mtR === r && u._mtV === this._hv && !(u._mtB && (u._mtB.dead || u._mtB.hp >= u._mtB.mhp))) return u._mtB;      // 2.2.6: 같은 틱 · 같은 반경이면 다시 재지 않는다 (기술마다 살필 때)
  var best = this._mendScan(u, r); u._mtT = this.t; u._mtR = r; u._mtV = this._hv; u._mtB = best; return best;
};
P._mendScan = function (u, r) {
  var best = null, lo = 0.9, us = this.units, f, rt;
  for (var i = 0; i < us.length; i++) { f = us[i]; if (f.dead || f.side !== u.side || dist(u, f) > r || f.hp >= f.mhp) continue; rt = f.hp / f.mhp - (f.role === 'cmd' ? 0.05 : 0); if (rt < lo) { lo = rt; best = f; } }
  return best;
};
P.bestSkill = function (u, foes, ord, keep) {
  var nt, self = this, best = null, bs = 0, bv = 0, mmp = u.mmp || 1, scarce = Math.max(0, 1 - (u.mp || 0) / mmp / this.bestFree), n, i, v, d;
  var BE = { m: u.basic || 1 }, ac = TK.attack * (u.fx && u.fx.atkTick ? Math.max(0.6, u.fx.atkTick) : 1), raw = 0, top = 0;
  function sumVal(S, vs) {      // 맞는 대상들의 값 합. raw 에는 지금 규칙의 머릿수(보스 2), top 에는 그 가운데 평타가 가장 잘 듣는 대상의 평타 값
    var s = 0, k, q, x, e, w, b, one, dm = S.eff[0].t === 'dmg';
    raw = 0; top = 0;
    for (k = 0; k < vs.length; k++) {
      x = vs[k]; w = x.role === 'boss' ? 1.5 : 1; raw += x.role === 'boss' ? 2 : 1;
      b = Math.min(self.estDmg(u, x, BE), x.hp); one = 0; var own = null;
      for (q = 0; q < S.eff.length; q++) {
        e = S.eff[q];
        if (e.t === 'status' && !e.to) { own = own || {}; own[e.s] = 1; }      // 여러 박자: 앞 박자가 붙인 상태를 뒤 박자가 노린다 (불 → 얼음 → 번개) — 그 몫도 값에 친다
        if (e.t === 'dmg') { d = self.estDmg(u, x, e, S.item); if (own && e.vs && !vsHit(x, e.vs) && e.vs.split('|').some(function (k9) { return own[k9]; })) d *= e.vx || 1.5; one += Math.min(d, x.hp) + (e.drain ? b * 0.2 : 0); }
        else if (e.t === 'status' && (e.s === 'burn' || e.s === 'poison')) one += x.st[e.s] ? 0 : self.dotVal(x, e) * 0.5;      // 2.2.6: 화상 · 중독은 깎을 만큼 (반쯤만 믿는다)
        else if (e.t === 'status' && e.s === 'mark') one += x.st.mark ? 0 : b * (x.role === 'boss' ? 1.2 : 0.6);      // 표식: 모두가 더 아프게 친다
        else if (e.t === 'status') one += x.st[e.s] ? 0 : b * (dm ? 0.2 : self.bestDebuff);
        else if (e.t === 'taunt' && !e.to) one += x.hate === u.id && x.hateT > self.t + 1 ? 0 : b * (u.hp > u.mhp * 0.5 ? 0.35 : 0.05);      // 도발: 튼튼할 때 값이 있다
        else if (e.t === 'pull') one += dist(u, x) > 1 ? b * 0.2 : 0;
        else if (e.t === 'buff' && e.p < 0) one += b * (dm ? 0.1 : self.bestDebuff * 0.5);
        else if (e.t === 'gauge' && e.v < 0) one += b * 0.3;
      }
      if (S.zone && S.zone.to !== 'ally') { var ZE = (S.zone.eff || []).concat(S.zone.end || []), zq, zn0 = Math.max(1, Math.floor((S.zone.dur || 4) / (S.zone.every || 1)));      // 남는 자리: 그 위에 머물 만큼만 믿는다 (맥박의 절반)
        for (zq = 0; zq < ZE.length; zq++) { if (ZE[zq].t === 'dmg') one += Math.min(self.estDmg(u, x, ZE[zq], S.item), x.hp) * (zq < (S.zone.eff || []).length ? zn0 * 0.5 : 0.5); else if (ZE[zq].t === 'gauge' && ZE[zq].v < 0) one += b * 0.15; } }
      s += one * w; if (b * w > top) top = b * w;
    }
    return s;
  }
  for (n = 0; n < ord.length; n++) {
    var id = ord[n], S = SK[id];
    if (!S || !isOff(S) || (u.mp || 0) < S.mp || u.cd[id] > 0) continue;
    if (keep && S.mp && u.mp - S.mp < keep) continue;
    if (u.rsv && this.rsvBlocks(u, id)) continue;      // 2.2.3: 예약한 기술의 마나 · 틱을 쓰지 않는다
    if (S.item && !(this.inv[id.slice(2)] > 0)) continue;
    var e0 = S.eff[0], r1 = S.rng ? S.rng[1] : 0, r0 = S.rng ? S.rng[0] : 0, holy = e0.type === 'holy', tgt = null, val = 0, tp = 0;
    if (S.tg === 'enemy') {
      var bsc = -1e9;
      for (i = 0; i < foes.length; i++) {
        v = foes[i]; d = dist(u, v); if (d > r1 || d < r0) continue;
        if (e0.t !== 'dmg' && (v.role !== 'boss' || (v.buffs[e0.s] && v.buffs[e0.s].p < 0) || v.st[e0.s])) continue;
        var sc2 = (v.role === 'boss' ? 50 : 0) + v.hp / v.mhp * 10 + (holy && (has(v, 'undead') || has(v, 'demon')) ? 20 : 0);
        if (e0.vs && vsHit(v, e0.vs)) sc2 += 30;      // 2.2.6: 맞물림을 노린다 (표식 · 둔화 · 화상 …)
        if (S.eff.length > 1 && S.eff[1].t === 'status' && v.st[S.eff[1].s]) sc2 -= 12;      // 이미 그 상태인 적은 덜 (표식 · 둔화를 새 적에게)
        if (sc2 > bsc) { bsc = sc2; tgt = v; }
      }
      if (!tgt) continue;
      val = sumVal(S, [tgt]); tp = top;
    } else if (S.tg === 'tile') {
      var w1;
      for (i = 0; i < foes.length; i++) {
        v = foes[i]; d = dist(u, v); if (d > r1 || d < r0) continue;
        w1 = sumVal(S, this.victims(u, S, this.areaTiles(u, S, (nt = nearT(v, u.x, u.y)).x, nt.y)));
        if (raw >= 2 && w1 > val) { val = w1; tp = top; tgt = { x: nt.x, y: nt.y }; }
      }
      if (!tgt) continue;
    } else if (S.tg === 'self') {
      val = sumVal(S, this.victims(u, S, this.areaTiles(u, S, u.x, u.y))); tp = top;
      if (raw < 2) continue;
    } else if (S.tg === 'dir') {
      for (i = 0; i < 4; i++) {
        var t = { x: u.x + DIR[i][0], y: u.y + DIR[i][1] }, w2 = sumVal(S, this.victims(u, S, this.areaTiles(u, S, t.x, t.y)));
        if (raw >= 2 && w2 > val) { val = w2; tp = top; tgt = t; }
      }
      if (!tgt) continue;
    } else continue;
    for (i = 0; i < S.eff.length; i++) {      // 2.2.5 기공: 둘레 아군이 다쳤으면 그만큼 값이 오른다
      var ei = S.eff[i];
      if (ei.t === 'aura') val += this.auraVal(u, ei) * 0.6;
      else if (ei.t === 'mend') { var mtg = this.mendTgt(u, ei.r); if (mtg) val += Math.min(mtg.mhp - mtg.hp, (u.mag * ei.m + 8) * (u.side === 'ally' ? DS.BAL.healAlly : 1)) * (mtg.hp < mtg.mhp * 0.5 ? 1.2 : 0.6); }
      else if (ei.t === 'ward') { var wtg = this.mendTgt(u, ei.r); if (wtg && !(wtg.buffs.shd && wtg.buffs.shd.p > 20)) val += Math.min(wtg.mhp - wtg.hp + 20, this.shdAmt(u, ei)) * (wtg.hp < wtg.mhp * 0.5 ? 0.9 : 0.4); }      // 2.2.6 등불: 가장 다친 아군의 보호막
      else if (ei.t === 'chain' && S.tg === 'enemy' && tgt && tgt.id) val += this.chainVal(u, tgt, ei, foes);      // 2.2.6 연쇄 번개
      else if (ei.t === 'dmg' && ei.share) { var stg = this.mendTgt(u, 4); if (stg) val += Math.min(stg.mhp - stg.hp, val * ei.share * 0.8) * (stg.hp < stg.mhp * 0.5 ? 1.0 : 0.5); }      // 2.2.6 생기 나눔
    }
    if (val / S.tick < this.bestMin * tp / ac) continue;      // 평타만 못하다
    var sc = val / (S.tick + (S.mp || 0) / mmp * this.bestMana * scarce);
    if (sc > bs * 1.0001 || (sc >= bs * 0.9999 && val > bv)) { bs = sc; bv = val; best = { id: id, tgt: tgt, val: val }; }
  }
  return best;
};
// 자동 전투 중 기술 선택
// dry: 마른 실행 — 게이지가 가득하다고 치고 고를 기술의 틱 값을 돌려준다 (시전하지 않고 난수도 부르지 않는다. 없으면 0). DS.BAL.cmdCast 가 "평타를 참고 기술을 기다릴까"를 정할 때 쓴다.
P.aiSkill = function (u, foes, dry) {
  if (u.fx && u.fx.seal) return dry ? 0 : false;
  var nt, self = this, fr = this.friends(u), boss = foes.some(function (f) { return f.role === 'boss'; }), big = boss || foes.length >= 3, q = this.q(u), dn = 0;
  // cmdBest: 공격 기술은 한 묶음으로 보고 가장 좋은 후보 하나(B)만 쓴다. 가호를 하나 걸었으면(u.supT) 다음 기술 차례는 공격 후보에게 준다 — 값싼 가호가 줄줄이 먼저 나가 큰 기술의 차례가 오지 않던 것.
  var bestOn = DS.BAL.cmdBest && u.role === 'cmd', B, bGot = false, bSeen = false;
  function getB() {      // 같은 틱 안에서는 한 번만 고른다 (aiCmd 의 실제 실행과 cmdFire 의 마른 실행이 한 생각에 잇달아 부른다)
    if (!bGot) { bGot = true; if (u._bT === self.t && u._bF === foes.length) B = u._bB; else { B = self.bestSkill(u, foes, ord, keep); u._bT = self.t; u._bF = foes.length; u._bB = B; } }
    return B;
  }
  function cast(id, tgt) {
    if (dry) { dn = SK[id].tick * q; return true; }
    var ok = self.cast(u, id, tgt), e;
    if (ok && bestOn) { e = SK[id].eff[0]; u.lastOff = isOff(SK[id]); if (posBuff(e)) u.supT = self.t + self.bestSup; else if (u.lastOff) u.supT = 0; }
    return ok;
  }
  // 살피는 순서: 치유·정화 → 소환 → 가호 → 나머지(목록 순서). 목록 앞의 공격 기술이 늘 먼저 나가서, 뒤에 붙은 치유·소환(장비·특성으로 얹은 기술 포함)이 한 번도 쓰이지 않던 문제.
  //   2.2.6: 가호(버프 · 보호막)도 공격 묶음보다 먼저 살핀다 — 목록 뒤의 철벽 · 수호 · 창벽 · 신속이 공격 기술에 늘 밀리던 것 (걸고 나면 bestSup 초 동안은 공격 차례)
  var ord = [], pass, k0, S0, t0;
  for (pass = 0; pass < 4; pass++) for (k0 = 0; k0 < u.skills.length; k0++) {
    S0 = SK[u.skills[k0]]; if (!S0) continue; t0 = S0.eff[0].t;
    if ((t0 === 'heal' || t0 === 'cleanse' ? 0 : t0 === 'summon' ? 1 : posBuff(S0.eff[0]) ? 2 : 3) === pass) ord.push(u.skills[k0]);
  }
  // cmdCast 일 때 치유를 맡은 지휘관은 치유 몫의 마나를 남긴다 (공격·가호로 마나를 다 쓰고 정작 쓰러져 가는 용병을 못 고치던 것). 끄면 0.
  var keep = 0;
  if (u.role === 'cmd' && DS.BAL.cmdCast) for (k0 = 0; k0 < ord.length; k0++) { S0 = SK[ord[k0]]; if (S0.tg === 'ally' && (S0.eff[0].t === 'heal' || (S0.eff[0].t === 'buff' && S0.eff[0].s === 'shd' && S0.eff[0].stat !== 'atk'))) { keep = Math.max(S0.mp * 3, u.mmp * 0.3); break; } }      // 2.2.6: 마공으로 보호막을 거는 신관도 (마나가 적은 보병의 수호는 빼고)
  if (bestOn) u.healer = keep > 0;
  for (var n = 0; n < ord.length; n++) {
    var id = ord[n], S = SK[id];
    if (bestOn && S && isOff(S)) {      // 공격·약화 기술: 목록에서 처음 만난 자리에서 묶음 전체를 견준다
      if (bSeen) continue; bSeen = true;
      if (!getB()) continue;
      if (dry) return SK[B.id].tick * q;
      if (u.gauge < SK[B.id].tick * q) continue;      // 게이지만 모자란다: 못한 기술로 때우지 않고 모은다 (cmdFire 가 기다린다). 뒤쪽 가호는 아래에서 살핀다
      if (cast(B.id, B.tgt)) return true;
      continue;
    }
    if (!S || (u.mp || 0) < S.mp || u.cd[id] > 0 || (!dry && u.gauge < S.tick * q)) continue;
    if (u.rsv && this.rsvBlocks(u, id)) continue;      // 2.2.3: 예약
    if (keep && S.mp && S.eff[0].t !== 'heal' && S.eff[0].t !== 'cleanse' && !(S.tg === 'ally' && S.eff[0].s === 'shd') && u.mp - S.mp < keep) continue;
    if (dry && S.item && !(this.inv[id.slice(2)] > 0)) continue;
    var e0 = S.eff[0], r1 = S.rng ? S.rng[1] : 0, r0 = S.rng ? S.rng[0] : 0, tgt = null, i, v, cnt;
    if (e0.t === 'heal' || e0.t === 'cleanse') {
      if (S.tg === 'ally') {
        var low = 0.6;
        fr.forEach(function (f) { var d = dist(u, f), rt = f.hp / f.mhp - (f.role === 'cmd' ? 0.1 : 0); if (d <= r1 && rt < low && f.hp < f.mhp) { low = rt; tgt = f; } });
        if (e0.t === 'cleanse' && tgt && !tgt.st.poison && !tgt.st.slow) tgt = null;
        if (tgt && cast(id, tgt)) return dry ? dn : true;
      } else {
        cnt = 0; fr.forEach(function (f) { if (dist(u, f) <= 2 && f.hp / f.mhp < 0.7) cnt++; });
        if (cnt >= 2 && cast(id, null)) return dry ? dn : true;
      }
      continue;
    }
    if (posBuff(e0)) {
      if (S.ai === 'boss' && !(boss || foes.length >= 5)) continue;      // 2.2.6: 큰 싸움에서만 거는 가호 (신속)
      var shd = e0.s === 'shd', all = S.area === 'all', lack = function (f) { var b = f.buffs[e0.s]; return !(b && (shd ? b.p > (b.mx || 0) * 0.35 : (all || b.p >= e0.p) && b.t > 3)); };      // 2.2.6: 더 약한 같은 가호만 있으면 받을 이로 친다 (모두에게 거는 호령은 예전처럼 — 서로 다시 외치지 않게)
      if (S.tg === 'self' && (!S.area || S.area === 'single')) {      // 2.2.6 자기에게만 거는 가호 (철벽): 적이 붙어 있을 때
        if (!lack(u)) continue;
        var nf = 0, nb = false; foes.forEach(function (f) { if (dist(u, f) <= 2) { nf++; if (f.role === 'boss') nb = true; } });
        if ((nf >= 2 || nb || (nf && u.hp < u.mhp * 0.7)) && cast(id, null)) return dry ? dn : true;
        continue;
      }
      if (!big && !(shd && fr.some(function (f) { return f.hp < f.mhp * 0.6 && dist(u, f) <= Math.max(r1, 2); }))) continue;      // 보호막은 작은 싸움에서도 다친 이가 있으면
      if (bestOn && u.supT > this.t && getB()) continue;      // 방금 가호를 걸었다: 이번 차례는 공격 후보에게 (bestSup 초가 지나도록 못 썼으면 — 치유에 바쁜 지휘관 — 가호를 다시 살핀다)
      if (S.tg === 'self') {
        if (S.area === 'all') {
          var need = fr.filter(function (f) { return (!S.mercOnly || f.role === 'merc' || f.role === 'summon') && lack(f); });
          if (need.length >= 2 && cast(id, null)) return dry ? dn : true;
        } else {      // 2.2.6 둘레에만 거는 가호 (성역 · 창벽): 둘레에 받을 이가 둘 이상이고 적이 가까이 있을 때
          var inA = this.victims(u, S, this.areaTiles(u, S, u.x, u.y)).filter(lack), rr = S.area === 'r2' ? 3 : 2;
          if (inA.length >= 2 && foes.some(function (f) { return dist(u, f) <= rr; }) && cast(id, null)) return dry ? dn : true;
        }
        continue;
      }
      var bs = -1;
      fr.forEach(function (f) {
        if ((f.role !== 'cmd' && !(shd && f.role === 'merc')) || dist(u, f) > r1 || dist(u, f) < r0 || !lack(f)) return;
        var sc;
        if (shd) { var adj = 0; foes.forEach(function (x) { if (dist(f, x) <= 1) adj++; }); if (!(f.hp < f.mhp * 0.7 || adj >= 2 || (adj && f.hp < f.mhp * 0.9))) return; sc = (1 - f.hp / f.mhp) * 100 + adj * 12 + (f.role === 'cmd' ? 8 : 0); }      // 2.2.6 보호막: 다쳤거나 적이 붙은 이
        else sc = e0.s === 'def' ? 200 - Math.min.apply(null, foes.map(function (x) { return dist(f, x); })) * 10 + f.def * 0.1 : Math.max(f.atk, f.mag);
        if (sc > bs) { bs = sc; tgt = f; }
      });
      if (tgt && cast(id, tgt)) return dry ? dn : true;
      continue;
    }
    if (e0.t === 'summon') {
      cnt = this.units.filter(function (m) { return !m.dead && m.owner === u.id && m.role === 'summon'; }).length;
      if (cnt < (S.cap || 2) && cast(id, null)) return dry ? dn : true;
      continue;
    }
    // 공격·약화 기술
    if (S.tg === 'enemy') {
      var bsc = -1e9;
      for (i = 0; i < foes.length; i++) {
        v = foes[i]; var d = dist(u, v); if (d > r1 || d < r0) continue;
        if (e0.t !== 'dmg') { if (!(v.role === 'boss' || v.hp > v.mhp * 0.6) || (v.buffs[e0.s] && v.buffs[e0.s].p < 0) || v.st[e0.s]) continue; if (!big && v.role !== 'boss') continue; }
        var sc2 = (v.role === 'boss' ? 50 : 0) + v.hp / v.mhp * 10 + (e0.type === 'holy' && (has(v, 'undead') || has(v, 'demon')) ? 20 : 0);
        if (sc2 > bsc) { bsc = sc2; tgt = v; }
      }
      if (tgt && cast(id, tgt)) return dry ? dn : true;
      continue;
    }
    if (S.tg === 'tile') {
      var bc = 0;
      for (i = 0; i < foes.length; i++) {
        v = foes[i]; if (dist(u, v) > r1 || dist(u, v) < r0) continue;
        cnt = this.victims(u, S, this.areaTiles(u, S, (nt = nearT(v, u.x, u.y)).x, nt.y)).reduce(function (a, x) { return a + (x.role === 'boss' ? 2 : 1); }, 0);
        if (cnt > bc) { bc = cnt; tgt = nt; }
      }
      if (bc >= 2 && cast(id, { x: tgt.x, y: tgt.y })) return dry ? dn : true;
      continue;
    }
    if (S.tg === 'self') {
      cnt = this.victims(u, S, this.areaTiles(u, S, u.x, u.y)).reduce(function (a, x) { return a + (x.role === 'boss' ? 2 : 1); }, 0);
      if (cnt >= 2 && cast(id, null)) return dry ? dn : true;
      continue;
    }
    if (S.tg === 'dir') {
      var bd = 0, bt = null;
      DIR.forEach(function (dd) {
        var t = { x: u.x + dd[0], y: u.y + dd[1] };
        var c2 = self.victims(u, S, self.areaTiles(u, S, t.x, t.y)).reduce(function (a, x) { return a + (x.role === 'boss' ? 2 : 1); }, 0);
        if (c2 > bd) { bd = c2; bt = t; }
      });
      if (bd >= 2 && cast(id, bt)) return dry ? dn : true;
    }
  }
  return dry ? 0 : false;
};
// 자동 지휘관의 기술 아끼기 (DS.BAL.cmdCast). 보스의 bossSave 와 같은 생각: 게이지 40 이 차는 대로 평타를 치면 틱 45~60 의 기술은 싸움 첫 수 말고는 차례가 오지 않는다
// (법사가 마나를 가득 남긴 채 판을 끝내던 문제). 평타를 한 번 쳤으면 다음은 기술 차례 — 지금 쓸 기술이 있으면(마나·재사용·대상이 맞으면) 그 틱이 찰 때까지 평타를 참는다.
// 멍하니 서 있지는 않는다: 마지막 행동에서 cmdHold 초(기본 6, DS.BAL.cmdHold)가 지나면 평타. 기술을 쓰고 나면 다시 평타 한 번. 끄면(기본값은 meta.js 의 DS.BAL) 지금과 똑같다.
P.cmdHold = 6;
P.bestGrace = 2;      // cmdBest: 기다린 지 cmdHold 초가 넘었어도, 고른 기술이 이 초 안에 차면 마저 기다린다 (틱 80 인 별똥별은 0 에서 7초 남짓 — 6초에 평타로 끊으면 다시 5초를 모아야 한다)
P.cmdFire = function (u, v, foes) {
  var late = this.t - (u.actT || 0) > (DS.BAL.cmdHold || this.cmdHold);
  if (u.owe && u.gauge < 100 && (!late || (DS.BAL.cmdBest && u.role === 'cmd'))) {
    var need = this.aiSkill(u, foes, true);
    if (need > u.gauge && (!late || need - u.gauge <= this.bestGrace * TK.regen * u.spd / 10 * (u.st.slow ? 0.6 : 1))) { u.saving = true; this.wait(u, 0.2); return true; }
  }
  u.saving = false;
  if (u.gauge >= this.atkCost(u)) { u.owe = true; u.actT = this.t; }
  return this.attack(u, v);
};
// ───────── 2.2.3 기술 예약 ─────────
// 화면에서 지금 못 쓰는 기술을 누르면 그 사람에게 예약된다 (u.rsv = 기술 · 필살기는 u.rsvU). 쓸 수 있게 되면(마나 · 재사용 · 틱 · 대상) 무엇보다 먼저 쓴다.
//   기다리는 동안: 마나가 모자라면 마나 드는 다른 기술은 쓰지 않는다(평타 · 이동 · 마나 없는 기술은 된다). 마나가 있고 대상도 있는데 틱만 모자라면 틱을 아껴 기다린다(평타도 참는다).
//   대상이 닿는 곳에 없으면 평소처럼 움직이고 평타를 친다 (대상이 생기면 그때 틱을 모은다). 숨이 넘어가는 제 약초(체력 30% 아래)는 예약보다 먼저다.
//   거두는 때: 썼을 때 · 같은 단추를 다시 누를 때 · 들판 싸움이 끝날 때(시나리오는 판이 끝날 때) · 쓰러질 때. 한 사람에 하나 (다른 기술을 누르면 바뀐다)
P.reserve = function (id, sk) { var u = this.byId[id]; if (!u || u.dead) return false; u.rsv = sk && SK[sk] ? sk : null; return true; };
P.reserveUlt = function (id, on) { var u = this.byId[id]; if (!u || u.dead) return false; u.rsvU = !!on; return true; };
P.rsvClear = function () { this.units.forEach(function (u) { if (u.rsv || u.rsvU) { u.rsv = null; u.rsvU = false; } }); };
// 영영 쓸 수 없는가 (예약하지 않는다): 봉인 · 최대 마나보다 비싸다 · 그 사람의 기술이 아니다. 돌려주는 것: 까닭 글 또는 ''
P.rsvNever = function (u, sk) {
  var S = SK[sk]; if (!u || u.dead || !S) return '쓸 수 없다';
  if (u.fx && u.fx.seal && !S.item) return '기술 봉인 중';
  if ((S.mp || 0) > (u.mmp || 0)) return '마나가 최대치(' + Math.round(u.mmp || 0) + ')보다 많이 든다';
  if (!S.ult && (u.skills || []).indexOf(sk) < 0) return '배우지 않은 기술';
  return '';
};
// 기술의 보통 자동 겨눔 (닿는 곳 안에서만). 돌려주는 것: { t: cast 에 넘길 대상(null = 제자리) } 또는 null
P.rsvTarget = function (u, S, foes) {
  var nt, self = this, e0 = S.eff[0], r0 = S.rng ? S.rng[0] : 0, r1 = S.rng ? S.rng[1] : 0, i, v, d, best = null, bs = -1e9, fr;
  function n(vs) { return vs.reduce(function (a, x) { return a + (x.role === 'boss' ? 2 : 1); }, 0); }
  if (e0.t === 'summon') { var cnt = this.units.filter(function (m) { return !m.dead && m.owner === u.id && m.role === 'summon'; }).length; return cnt < (S.cap || 2) && foes.length ? { t: null } : null; }
  if (S.tg === 'ally') {
    fr = this.friends(u);
    fr.forEach(function (f) {
      d = dist(u, f); if (d > r1 || d < r0) return;
      var sc = e0.t === 'heal' ? (f.hp < f.mhp ? 1 - f.hp / f.mhp + (f.role === 'cmd' ? 0.1 : 0) : -1) : e0.t === 'cleanse' ? (f.st.poison || f.st.slow ? 1 : -1) : (f.role === 'cmd' && !(f.buffs[e0.s] && f.buffs[e0.s].t > 3) ? Math.max(f.atk, f.mag) : -1);
      if (sc > 0 && sc > bs) { bs = sc; best = f; }
    });
    return best ? { t: best } : null;
  }
  if (S.tg === 'self' || S.tg === 'multi') {
    if (e0.t === 'heal' || e0.t === 'cleanse') { fr = this.victims(u, S, this.areaTiles(u, S, u.x, u.y)); return fr.some(function (f) { return f.side === u.side && f.hp < f.mhp; }) ? { t: null } : null; }
    if (posBuff(e0)) return foes.length ? { t: null } : null;
    if (S.tg === 'multi') return foes.length ? { t: null } : null;
    return n(this.victims(u, S, this.areaTiles(u, S, u.x, u.y))) >= 1 ? { t: null } : null;
  }
  if (S.tg === 'enemy') {
    for (i = 0; i < foes.length; i++) { v = foes[i]; d = dist(u, v); if (d > r1 || d < r0) continue; var sc2 = (v.role === 'boss' ? 50 : 0) + v.hp / v.mhp * 10; if (sc2 > bs) { bs = sc2; best = v; } }
    return best ? { t: best } : null;
  }
  if (S.tg === 'tile') {
    for (i = 0; i < foes.length; i++) { v = foes[i]; d = dist(u, v); if (d > r1 || d < r0) continue; var c = n(this.victims(u, S, this.areaTiles(u, S, (nt = nearT(v, u.x, u.y)).x, nt.y))); if (c > bs) { bs = c; best = { x: nt.x, y: nt.y }; } }
    return best && bs >= 1 ? { t: best } : null;
  }
  if (S.tg === 'dir') {
    DIR.forEach(function (dd) { var t = { x: u.x + dd[0], y: u.y + dd[1] }, c2 = n(self.victims(u, S, self.areaTiles(u, S, t.x, t.y))); if (c2 > bs) { bs = c2; best = t; } });
    return best && bs >= 1 ? { t: best } : null;
  }
  return null;
};
// 예약을 살핀다. true = 이번 생각은 예약이 썼다(쓰거나 틱을 모으며 기다림)
P.rsvTry = function (u, foes) {
  if (u.rsvU && u.ult && (u.uc || 0) >= 100 && foes.length && !(u.fx && u.fx.seal)) {      // 필살기: 가득 차면 보통 자동 겨눔으로 (틱이 모자라면 모은다)
    if (u.gauge < SK[u.ult].tick * this.q(u)) { u.saving = true; this.wait(u, 0.2); return true; }
    if (this.aiUlt(u, foes)) { u.rsvU = false; u.saving = false; this.emit({ t: 'rsvCast', id: u.id, sk: u.ult }); return true; }
  }
  var id = u.rsv, S = id && SK[id]; if (!S) { if (id) u.rsv = null; return false; }
  if (u.fx && u.fx.seal) return false;
  if ((u.mp || 0) < (S.mp || 0) || u.cd[id] > 0) return false;      // 마나 · 재사용을 기다린다 (그동안 aiSkill 이 마나 드는 다른 기술을 막는다)
  if (u.hp < u.mhp * 0.3 && this.inv.herb > 0 && u.gauge >= TK.item) return false;      // 숨이 넘어가면 제 약초가 먼저
  var tg = this.rsvTarget(u, S, foes); if (!tg) return false;
  if (u.gauge < S.tick * this.q(u)) { u.saving = true; this.wait(u, 0.2); return true; }
  if (this.cast(u, id, tg.t)) { u.rsv = null; u.saving = false; u.actT = this.t; u.owe = false; this.emit({ t: 'rsvCast', id: u.id, sk: id }); return true; }
  return false;
};
// aiSkill 이 예약 때문에 이 기술을 건너뛰는가: 예약한 기술이 마나만 기다리면 마나 드는 기술 모두, 마나가 있으면(틱 · 대상만 기다리면) 다른 기술 모두
P.rsvBlocks = function (u, id) {
  var R = u.rsv && SK[u.rsv]; if (!R || id === u.rsv) return false;
  var S = SK[id]; if (!S) return false;
  if ((u.mp || 0) >= (R.mp || 0) && !(u.cd[u.rsv] > 0)) return true;
  return (S.mp || 0) > 0;
};
P.aiCmd = function (u) {
  var self = this, cc = DS.BAL && DS.BAL.cmdCast;
  if (this.dodge(u)) return;
  var lead = this.byId[this.leader], foes = this.foes(u), seek = this.hunt && (u === lead || !lead), zseek = seek && this.mode === 'zone';
  // 멀리 있는 싸움까지 쫓아가지 않는다. 선두가 자리를 뜨면 따라붙는다.
  // fix28: 자동 사냥의 선두는 동료 지휘관이 붙잡혀 싸우는 적도 제 상대로 본다 (선두만 다음 무리를 찾아 떠나 일행이 12칸 넘게 갈라지던 낙오)
  var mates = DS.BAL.fix28 && zseek && u === lead ? this.cmds() : null;
  if (!(this.hunt && this.mode === 'scn')) foes = foes.filter(function (f) {
    if (dist(u, f) <= 8 || (lead && dist(lead, f) <= 7) || (f.prov > self.t && dist(u, f) <= 14)) return true;
    if (mates) for (var q = 0; q < mates.length; q++) if (mates[q] !== u && dist(mates[q], f) <= 6) return true;
    return false;
  });
  // 자동 사냥의 선두는 닿지 못해 제쳐 둔 적에게 매달리지 않는다 (닿는 거리에 있거나 우리를 때린 적은 상대한다)
  if (zseek && foes.length) foes = foes.filter(function (f) { return !(f.skipT > self.t) || f.prov > self.t || dist(u, f) <= self.reach(u); });
  if (lead && u !== lead && u.auto && dist(u, lead) > 5 && lead.order && lead.order.t === 'move') { if (this.goNear(u, lead.x, lead.y, 2, 60) !== 'here') return; }
  if ((u.rsv || u.rsvU) && this.rsvTry(u, foes)) return;      // 2.2.3: 예약한 기술이 무엇보다 먼저
  if (!u.auto) {   // 수동: 닿는 적만 때린다
    if (u.saving) u.saving = false;      // 자동에서 「기술 준비」 중에 수동으로 바꾸면 표시가 남던 것
    if (DS.BAL.manHerb && foes.length && u.hp < u.mhp * 0.3 && this.inv.herb > 0 && u.gauge >= TK.item && this.useItem(u, 'herb', u)) return;      // 수동이어도 숨이 넘어가면 제 약초는 먹는다
    var near = foes.filter(function (f) { return dist(u, f) <= self.reach(u); });
    if (near.length) { this.attack(u, this.pickTarget(u, near)); return; }
    this.wait(u, 0.2); return;
  }
  // 방금 이동 명령으로 옮겨 온 자리는 잠시 지킨다: 닿는 적만 상대한다
  if (u.holdT > this.t && foes.length) {
    if (u.saving) u.saving = false;
    if (this.aiSkill(u, foes)) return;
    var nearF = foes.filter(function (f) { var d = dist(u, f); return d <= self.reach(u) && d >= 1; });
    if (nearF.length) { this.attack(u, this.pickTarget(u, nearF)); return; }
    this.wait(u, 0.2); return;
  }
  if (!foes.length) {
    if (u.saving) u.saving = false;      // 「기술 준비」 표시는 싸움이 끝나면 내린다 (화면이 읽는 칸)
    if (mates) {      // fix28: 다음 무리를 찾아 떠나기 전에, 9칸 넘게 처진 동료 지휘관이 있으면 그쪽으로 모인다 (뒤처진 동료가 따로 다른 무리를 깨워 갈라지던 낙오)
      var far = null, fd = 9;
      for (var q = 0; q < mates.length; q++) if (mates[q] !== u && dist(mates[q], u) > fd) { fd = dist(mates[q], u); far = mates[q]; }
      if (far && this.goNear(u, far.x, far.y, 3, 60) !== 'here') { u.trail = null; return; }
    }
    if (seek && this.seek(u)) return;      // 가까운 적이 없으면 먼 적을 찾아 나선다
    if (lead && u !== lead && dist(u, lead) > 2) { if (this.goNear(u, lead.x, lead.y, 2, dist(u, lead) > 12 ? 160 : 40) !== 'here') return; }
    this.wait(u, 0.2); return;
  }
  u.trail = null;      // 싸움이 붙었다: 찾아가던 길은 잊는다
  if (u.hp < u.mhp * 0.3 && this.inv.herb > 0 && u.gauge >= TK.item) { if (this.useItem(u, 'herb', u)) return; }
  if (this.inv.herb > 0 && u.gauge >= TK.item) {      // 곁(2칸)에서 쓰러져 가는 제 용병에게 약초를 쓴다 — 용병은 잃으면 돌아오지 않는다 (자동 지휘관만 여기까지 온다)
    var hm = null, hr = 0.25;
    this.units.forEach(function (m) { if (!m.dead && m.role === 'merc' && m.owner === u.id && dist(u, m) <= 2 && m.hp / m.mhp < hr) { hr = m.hp / m.mhp; hm = m; } });
    if (hm && this.useItem(u, 'herb', hm)) return;
  }
  if (u.ult && this.ultSelf(u) && this.aiUlt(u, foes)) { this._ultT = this.t; return; }      // r32: 필살기가 가득하고 쓸 자리가 있으면 먼저 (2.2.7: 자동인 가문은 스스로 — 수동이면 단추로)
  if (this.aiSkill(u, foes)) {
    // cmdBest: 치유를 맡은 지휘관은 치유·가호·소환 뒤에 평타를 빚지지 않는다 — 다음 차례는 공격 기술 (치유에 바쁜 매직마스터가 "치유 → 평타 → 치유"로 게이지를 다 써서 큰 주문을 한 번도 못 쓰던 것). 쓸 공격 기술이 없으면 cmdFire 가 바로 평타를 친다.
    if (cc) { u.owe = !!(DS.BAL.cmdBest && u.lastOff === false && (this.bestNoOwe > 1 || (this.bestNoOwe && u.healer))); u.actT = this.t; u.saving = false; }
    return;
  }
  if (lead && u !== lead && u.stuck >= 6 && this.mode === 'zone') {      // 아무리 해도 닿지 않으면 매달리지 않고 선두 곁으로 물러난다
    if (dist(u, lead) <= 2) u.stuck = 0;
    else if (this.goNear(u, lead.x, lead.y, 2, 160) !== 'here') return;
  }
  var v = this.pickTarget(u, foes);
  if (v) {
    this.engage(u, v, 1, this.reach(u), cc ? function () { return this.cmdFire(u, v, foes); } : function () { return this.attack(u, v); }, zseek ? 80 : 0);
    if (zseek && u.stuck >= 4) { v.skipT = this.t + 8; u.stuck = 0; }      // 선두도 닿지 못하는 적은 한동안 제쳐 둔다 (서로 못 닿은 채 서 있던 문제)
  }
  else this.wait(u, 0.2);
};
// ── 자동 사냥: 다음 상대를 찾아 나선다 ──
// 걸어서 닿는 길이 가장 짧은 적을 고른다. (맨해튼 거리로 고르면 산등성이 너머의 적을 골라 그 앞에서 서 있게 된다.)
// 진정 중이거나 제쳐 둔 적, 닿을 길이 없는 적은 고르지 않는다. 한번 고른 상대는 쉽게 바꾸지 않는다.
P.huntPick = function (u) {
  var self = this, w = this.w, h = this.h, st = this._st, d = this._d, r1 = this.reach(u), t = this.t, best = null, bc = 1e9, bi = -1, prev = u.trail && u.trail.tid;
  this.flood(u, 160);
  var stamp = this.stamp;
  this.units.forEach(function (v) {
    if (v.dead || v.side !== 'enemy' || v.skipT > t || v.calmT > t) return;
    var c = 1e9, ci = -1, dx, dy, dd, x, y, j, vw = (v.fw || 1) - 1, vh = (v.fh || 1) - 1;
    for (dy = -r1; dy <= r1 + vh; dy++) for (dx = -r1; dx <= r1 + vw; dx++) {      // 그 적을 때릴 수 있는 칸 가운데 가장 가까운 칸 (2.3.0: 큰 몸은 가장 가까운 칸까지)
      x = v.x + dx; y = v.y + dy; dd = vw || vh ? dt(x, y, v) : Math.abs(dx) + Math.abs(dy); if (dd < 1 || dd > r1) continue;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      j = y * w + x; if (st[j] !== stamp || (self.occ[j] && self.occ[j] !== u)) continue;
      if (d[j] < c) { c = d[j]; ci = j; }
    }
    if (ci < 0) return;
    if (v.role === 'boss') c += 6;
    if (v.id === prev) c -= 3;
    if (c < bc) { bc = c; best = v; bi = ci; }
  });
  if (!best) return null;
  var path = [], me = u.y * w + u.x;
  for (var k = bi; k >= 0 && k !== me; k = this._p[k]) path.unshift(k);
  return { tid: best.id, x: best.x, y: best.y, path: path, fail: 0, until: t + 2.5 };
};
// 고른 상대에게 가는 길은 한 번 정하면 끝까지 따라간다. (걸음마다 길을 다시 찾으면, 따라오는 일행을 비켜 가려다 두 칸 사이를 맴돈다.)
// 길을 가는 선두는 다른 이가 밀어내지 않고(canSwap), 선두는 길 위의 일행과 자리를 바꾸며 나아간다.
P.seek = function (u) {
  var h = u.trail, t = this.t, v = h && this.byId[h.tid];
  if (!h || !v || v.dead || v.skipT > t || v.calmT > t || t >= h.until || !h.path.length || !this.adj(u, h.path[0]) || dist(v, h) > 1) {
    h = u.trail = this.huntPick(u);
    if (!h) return this.seekFar(u);
    v = this.byId[h.tid];
  }
  var d = dist(u, v);
  if (v.role !== 'boss' && h.path.length <= 5) this.rouse(v);
  if (d >= 1 && d <= this.reach(u)) { u.trail = null; this.attack(u, v); return true; }
  if (!h.path.length) { v.skipT = t + 6; u.trail = null; this.wait(u, 0.2); return true; }
  var nx = h.path[0], oc = this.occ[nx];
  if (oc && oc !== u && !(oc.side === u.side && this.canSwap(u, oc))) {      // 막혔다: 잠깐 기다리고, 계속 막히면 다시 고른다
    if (oc.side !== u.side || ++h.fail > 3) u.trail = null;
    this.wait(u, 0.12); return true;
  }
  if (this.step(u, nx)) { h.path.shift(); h.fail = 0; }
  return true;
};
// 걸어서 닿는 적이 하나도 없을 때: 가장 가까운 적 쪽으로 갈 수 있는 데까지 가서 깨운다 (날거나 쏘는 적은 제 발로 온다)
P.seekFar = function (u) {
  var self = this, bt = null, bd = 1e9;
  this.units.forEach(function (v) {
    if (v.dead || v.side !== 'enemy' || v.skipT > self.t || v.calmT > self.t) return;
    var d = dist(u, v) + (v.role === 'boss' ? 6 : 0); if (d < bd) { bd = d; bt = v; }
  });
  if (!bt) return false;
  if (bd <= 6) this.rouse(bt);
  this.engage(u, bt, 1, this.reach(u), function () { return this.attack(u, bt); }, 160);
  if (u.stuck >= 4) { bt.skipT = this.t + 6; u.stuck = 0; if (bd <= 9) this.rouse(bt); }
  return true;
};
// 용병이 물러나는 문턱과 다시 나서는 문턱 (남은 체력 비율). 앞장 / 곁에
P.mercBack = [0.45, 0.75]; P.mercBackSide = [0.54, 0.85];
P.mercRejoin = 2;      // fix28: 줄 끝에서 따라붙기 시작하면 줄 안쪽 이만큼까지 붙는다 (0 이면 2.7.0 처럼)
// ── 용병 종류별 행동 (DS.BAL.mercAI) ── 유닛 칸 u.kite·u.taunt 를 읽는다 (plan 팀의 mercSpec 이 싣는다: 아처 kite 2·발리스타 3, 소드맨 taunt 1·돌 정령 2·오우거 2, 버릇 「목청 큰」 1).
// 유닛에 칸이 없으면(옛 meta) DS.MERCS[종류] 의 같은 칸, 그것도 없으면 아래 기본값.
//   kite: 적과 이만큼은 떨어져 쏜다 (0 = 끔). 기본: 최소 사거리가 2 이상이면 그 값
//   taunt: 도발 반경(칸, 0 = 끔). 기본: TAUNT0
var TAUNT0 = { m_sword: 1, m_spirit: 2, m2_ogre: 2 };
function mercKey(u, k, def) { if (u[k] != null) return u[k]; var M = DS.MERCS && DS.MERCS[u.type]; return M && M[k] != null ? M[k] : def; }
// 물러날 곳: 주인 4칸 안에서 치유 기술(마나가 남은)이 있는 지휘관이나 치유하는 용병. 가장 가까운 이.
function healsOf(a) {      // 2.2.6: 곁을 고치는 기술(치유 · 기공 · 기 전하기 · 등불 · 보호막)을 지닌 지휘관 (한 번 재어 둔다)
  if (a._hl == null) a._hl = (a.skills || []).some(function (k) { var S = SK[k]; return S && S.eff.some(function (e) { return e.t === 'heal' || e.t === 'aura' || e.t === 'mend' || e.t === 'ward' || (e.t === 'buff' && e.s === 'shd'); }); }) ? 1 : 0;
  return !!a._hl;
}
P.healerNear = function (u, own) {
  var al = this.allies(), best = null, bd = 99, i, a, d;
  for (i = 0; i < al.length; i++) {
    a = al[i]; if (a === u || a.dead || a.back || dist(a, own) > 4) continue;
    if (!(a.heal > 0 || (a.role === 'cmd' && a.mp >= 6 && healsOf(a)))) continue;
    d = dist(u, a); if (d < bd) { bd = d; best = a; }
  }
  return best;
};
// 궁수류: 적이 kite 칸보다 가까우면 쏘기 전에 물러선다 — 사거리 안에 적을 두고 어느 적과도 kite 칸 넘게 떨어진 칸(두 걸음 안, 주인 5칸 안). 그런 칸이 없으면 그 자리에서 쏜다.
// 한 번 물러서면 1.5초는 다시 물러서지 않는다 (쫓기며 영영 안 쏘는 것을 막는다).
P.kite = function (u, foes, own) {
  var K = u.kiteT > this.t ? 0 : +mercKey(u, 'kite', u.rng[0] >= 2 ? u.rng[0] : 0) || 0;
  if (K < 2) return false;
  var i, adj = false;
  for (i = 0; i < foes.length; i++) if (dist(u, foes[i]) < K) { adj = true; break; }
  if (!adj) return false;
  u.kiteT = this.t + 1.5;
  var r0 = u.rng[0], r1 = this.reach(u), dz = this.dz[u.side], kind = this.kind, hot = this.burns(u);
  var r = this.go(u, function (x, y, c, j) {
    var md = 99, inR = false, q, d;
    for (q = 0; q < foes.length; q++) { d = dt(x, y, foes[q]); if (d < md) md = d; if (d >= r0 && d <= r1) inR = true; }
    if (md < K || !inR || c > 2.5 || Math.abs(x - own.x) + Math.abs(y - own.y) > 5 || dz[j] || (hot && kind[j] === 'lava')) return null;
    return c - Math.min(md, 3);
  }, 6);
  if (r === 'here') return false;
  if (r === 'step') this.emit({ t: 'kite', id: u.id });
  return true;
};
// 방패 용병: 둘레의 적을 자기에게 끌어 온다. 재사용 10초·틱 25. 지켜야 할 아군(다친 지휘관 · 물러나는 용병 · 궁수·치유 용병)에게 붙은 적이 둘레(반경)에 있을 때만, 체력이 60% 넘을 때만.
// (처음엔 아무 아군에게 붙은 적이면 걸었더니 한 판 13번씩 걸며 평타를 잃어 용병 피해가 11% 줄었다)
// 끌려 온 적은 hateT 까지(보스는 절반) 이 용병을 훨씬 더 노린다 (pickTarget 의 hateP).
P.taunt = function (u, foes) {
  var R = mercKey(u, 'taunt', TAUNT0[u.type] || 0); if (R === true) R = 2; R = +R || 0;
  if (!R || u.cd.taunt > 0 || u.gauge < 25 || u.hp < u.mhp * 0.6) return false;
  var al = this.allies(), list = [], hot = false, i, j, f;
  for (i = 0; i < foes.length; i++) {
    f = foes[i]; if (dist(u, f) > R || (f.hate === u.id && f.hateT > this.t + 1)) continue;
    list.push(f);
    if (!hot) for (j = 0; j < al.length; j++) { var a = al[j]; if (a !== u && !a.dead && dist(a, f) <= 1 && (a.role === 'cmd' ? a.hp < a.mhp * 0.75 : (a.back || a.rng[0] >= 2 || a.heal > 0))) { hot = true; break; } }
  }
  if (!list.length || !hot) return false;
  for (i = 0; i < list.length; i++) { f = list[i]; f.hate = u.id; f.hateT = this.t + (f.role === 'boss' ? 2.5 : 5); f.hateP = 30; }
  u.gauge -= 25; u.cd.taunt = 10; u.busy = 0.4;
  this.emit({ t: 'taunt', id: u.id, n: list.length, ids: list.map(function (x) { return x.id; }) });
  this.say(u, '도발!');
  return true;
};
P.aiMerc = function (u) {
  var own = this.byId[u.owner], self = this, MA = DS.BAL.mercAI;
  if (!own || own.dead) { if (u.role === 'merc') this.flee(u); else this.kill(u); return; }
  // 주인의 태세: 'side'(곁에) 면 주인 3칸 안의 적만 상대하고 일찍 물러난다. 없으면 앞장선다(기본). 싸우는 도중에 바뀌어도 바로 따른다.
  var side = own.stance === 'side', BK = side ? this.mercBackSide : this.mercBack;
  if (side) MA = false;      // 용병 종류별 행동은 앞장 태세에서만. 곁에 태세는 2.7.0 그대로 (재 보니 곁에 + 거리 유지·도발은 지휘관 쓰러짐·용병 이탈이 늘었다 — 경호가 자리를 비운다)
  // 주인에게서 너무 멀어지면 싸움을 놓고 따라붙는다. 아주 멀면 곁으로 불려 온다.
  var dOwn = dist(u, own), leash = side ? 4 : 7;
  // fix28: 줄 끝에서 "따라붙기 한 걸음 ↔ 쫓아가기 한 걸음"으로 두 칸을 오가던 핑퐁 — 한번 따라붙기 시작하면 줄 안쪽 두 칸까지는 붙는다
  if (DS.BAL.fix28) { if (dOwn > leash) u.rejoin = true; else if (dOwn <= leash - this.mercRejoin) u.rejoin = false; }
  if (dOwn > leash || (u.rejoin && dOwn > leash - this.mercRejoin)) {
    if (dOwn <= 16 && this.goNear(u, own.x, own.y, 2, 90) !== 'here') return;
    var np = dOwn > leash ? this.freeNear(own.x, own.y, u.mt, 4) : null;
    if (np) { this.moveTo(u, np.x, np.y); this.emit({ t: 'blink', id: u.id, x: u.x, y: u.y }); this.wait(u, 0.3); return; }
  }
  if (this.dodge(u)) return;
  if (u.heal && !(u.cd.heal > 0) && u.gauge >= 40) {
    var low = 0.65, t = null;
    this.friends(u).forEach(function (f) { var rt = f.hp / f.mhp; if (dist(u, f) <= 3 && rt < low) { low = rt; t = f; } });
    if (t) {
      u.gauge -= 40; u.cd.heal = 5; u.busy = 0.5;
      this.emit({ t: 'skill', id: u.id, sk: 'heal', fx: 'heal', tiles: [[t.x, t.y]], from: [u.x, u.y] });
      this.heal(t, (u.mag * u.heal * 1.6 + 6) * (u.side === 'ally' ? DS.BAL.healAlly : 1)); return;      // 2.1.1: 치유 용병도 절반
    }
  }
  var foes = this.foes(u);
  // 많이 다치면 주인 곁으로 물러나 숨을 고른다 (쓰러지면 영영 잃으므로)
  if (u.role === 'merc') {
    if (!foes.length) u.back = false; else if (u.hp < u.mhp * BK[0]) u.back = true; else if (u.hp > u.mhp * BK[1]) u.back = false;
    if (u.back && foes.length) {
      var dz = this.dz[u.side], kind = this.kind, hot = this.burns(u), an = MA ? this.healerNear(u, own) || own : own;      // mercAI: 고쳐 줄 이(치유 기술이 있는 지휘관·시스터)가 주인 곁에 있으면 그 곁으로
      var rr = this.go(u, function (x, y, c, i) {
        var dO = Math.abs(x - an.x) + Math.abs(y - an.y), md = 9;
        for (var q = 0; q < foes.length; q++) md = Math.min(md, dt(x, y, foes[q]));
        return (dO > 3 ? 60 + dO * 10 : 0) - md * 4 + c * 0.5 + (dz[i] ? 300 : 0) + (hot && kind[i] === 'lava' ? 20 : 0);      // 용암 위로 물러나지 않는다
      }, 14);
      if (rr === 'here') this.wait(u, 0.25);
      return;
    }
  }
  if (foes.length) {
    if (u.ult && this.ultSelf(u) && this.aiUlt(u, foes)) { this._ultT = this.t; return; }      // r32: 필살기 (용사 이상) (2.2.7: 자동이면 스스로)
    if (u.skills.length && this.aiSkill(u, foes)) { if (MA) { u.owe = false; u.actT = this.t; } return; }      // 고유 기술을 가진 용병(영웅·전설)은 기술부터 살핀다
    if (MA && this.taunt(u, foes)) return;
    if (u.heal) {      // 치유를 맡은 용병(시스터)은 싸움 한복판으로 걸어 들어가지 않는다: 닿는 적만 때린다
      var r1 = this.reach(u), nr = foes.filter(function (f) { var d = dist(u, f); return d >= 1 && d <= r1; });
      if (nr.length) { this.attack(u, this.pickTarget(u, nr)); return; }
    } else {
      var v = this.pickTarget(u, side ? foes.filter(function (f) { return dist(own, f) <= 3; }) : foes, own, side ? 3 : 6);
      if (v && MA && this.kite(u, foes, own)) return;
      if (v) { this.engage(u, v, 1, this.reach(u), MA && u.skills.length ? function () { return this.cmdFire(u, v, foes); } : function () { return this.attack(u, v); }); return; }
    }
  }
  if (dist(u, own) > 2) { if (this.goNear(u, own.x, own.y, 2, 40) !== 'here') return; }
  this.wait(u, 0.22);
};

// ── r32 필살기 자동 사용: 게이지가 가득하고, 지금 선 자리에서(걷지 않고) 쓸 만한 대상이 있으면 쓴다. 난수를 부르지 않는다.
//   공격: 보스가 있으면 보스를 맞힐 때, 아니면 둘 이상 맞을 때 (한 사람 기술은 체력이 넉넉한 적에게). 치유: 70% 아래 둘 이상이거나 지휘관 40% 아래.
//   가호: 큰 싸움(보스 또는 적 셋 이상)에서 받을 이가 둘 이상(자기만 받는 것은 곁에 적이 있을 때). 소환: 적 둘 이상, 부른 이가 없을 때.
P.aiUlt = function (u, foes) {
  var id = u.ult, S = SK[id]; if (!S || !((u.uc || 0) >= 100) || !foes.length) return false;
  if (u.fx && u.fx.seal) return false;
  if (u.gauge < S.tick * this.q(u)) return false;
  var nt, self = this, e0 = S.eff[0], boss = foes.some(function (f) { return f.role === 'boss'; }), big = boss || foes.length >= 3, r0 = S.rng ? S.rng[0] : 0, r1 = S.rng ? S.rng[1] : 0, i, v, d;
  function cnt(vs) { var n = 0, b = false; vs.forEach(function (x) { n += x.role === 'boss' ? 2 : 1; if (x.role === 'boss') b = true; }); return { n: n, b: b }; }
  function good(c) { return c.n >= 2; }
  if (e0.t === 'summon') {
    var have = this.units.some(function (m) { return !m.dead && m.owner === u.id && m.role === 'summon'; });
    return !have && foes.length >= 2 && this.cast(u, id, null);
  }
  if (e0.t === 'heal' || e0.t === 'cleanse' || (e0.t === 'buff' && e0.p > 0)) {
    var vs = this.victims(u, S, S.area ? this.areaTiles(u, S, u.x, u.y) : [[u.x, u.y]]);
    if (e0.t === 'buff' && !S.eff.some(function (e) { return e.t === 'heal'; })) {
      if (!big) return false;
      if (S.area && vs.length < 2) return false;
      if (!S.area && !foes.some(function (f) { return dist(u, f) <= 2; })) return false;
      return this.cast(u, id, null);
    }
    if (!S.area) return u.hp < u.mhp * 0.4 && this.cast(u, id, null);
    var low = vs.filter(function (f) { return f.hp < f.mhp * 0.7; }).length, crit = vs.some(function (f) { return f.role === 'cmd' && f.hp < f.mhp * 0.4; });
    return (low >= 2 || crit) && this.cast(u, id, null);
  }
  if (S.tg === 'multi') return (foes.length >= 2 || boss) && this.cast(u, id, null);
  if (S.tg === 'enemy') {
    var best = null, bs = -1;
    for (i = 0; i < foes.length; i++) { v = foes[i]; d = dist(u, v); if (d > r1 || d < r0) continue; var sc = (v.role === 'boss' ? 1e6 : 0) + v.hp; if (sc > bs) { bs = sc; best = v; } }
    if (!best) return false;
    if (best.role !== 'boss' && best.hp < this.estDmg(u, best, { m: u.basic || 1 }) * 2.5) return false;      // 평타 두어 대로 끝날 적에게는 아낀다
    return this.cast(u, id, best);
  }
  if (S.tg === 'tile') {
    var bt = null, bc = { n: 0, b: false };
    for (i = 0; i < foes.length; i++) { v = foes[i]; d = dist(u, v); if (d > r1 || d < r0) continue; var c = cnt(this.victims(u, S, this.areaTiles(u, S, (nt = nearT(v, u.x, u.y)).x, nt.y))); if (c.n > bc.n) { bc = c; bt = nt; } }
    return !!bt && (bc.n >= 3 || (bc.b && bc.n >= 2)) && this.cast(u, id, { x: bt.x, y: bt.y });
  }
  if (S.tg === 'self') { var cs = cnt(this.victims(u, S, this.areaTiles(u, S, u.x, u.y))); return good(cs) && this.cast(u, id, null); }
  if (S.tg === 'dir') {
    var bd = null, bn = { n: 0, b: false };
    DIR.forEach(function (dd) { var t = { x: u.x + dd[0], y: u.y + dd[1] }, c2 = cnt(self.victims(u, S, self.areaTiles(u, S, t.x, t.y))); if (c2.n > bn.n) { bn = c2; bd = t; } });
    return !!bd && good(bn) && this.cast(u, id, bd);
  }
  return false;
};

// ───────── 적 ─────────
P.aiEnemy = function (u) {
  var self = this, allies = this.allies();
  if (!u.aggro) {
    var R = u.role === 'boss' ? 6 : this.mode === 'zone' ? 4 : 5, near = false;
    for (var i = 0; i < allies.length; i++) if (dist(u, allies[i]) <= R) { near = true; break; }
    if (near && this.mode !== 'town' && !(u.calmT > this.t)) { this.rouse(u); return; }
    if (this.mode === 'zone') {
      if (u.hp < u.mhp) u.hp = Math.min(u.mhp, u.hp + u.mhp * 0.08);
      if (dist(u, u.home) > 3) { this.goNear(u, u.home.x, u.home.y, 2, 40); return; }
      if (this.rand() < 0.12) {
        var d = DIR[Math.floor(this.rand() * 4)], nx = u.x + d[0], ny = u.y + d[1];
        if ((isBig(u) ? this.fits(u, nx, ny) : this.pass(u.mt, nx, ny) && !this.occ[ny * this.w + nx]) && Math.abs(nx - u.home.x) + Math.abs(ny - u.home.y) <= 3) { u.gauge = 100; this.step(u, ny * this.w + nx); u.busy = 0.5; return; }
      }
    }
    this.wait(u, 0.4); return;
  }
  if (!allies.length) { this.wait(u, 0.5); return; }
  if (this.mode === 'zone') {
    var md = 99; allies.forEach(function (a) { md = Math.min(md, dist(u, a)); });
    if (dist(u, u.home) > 11 || md > 12 || u.stuck >= 14) { u.aggro = false; u.calmT = this.t + (u.stuck >= 14 ? 10 : 7); u.stuck = 0; this.emit({ t: 'calm', id: u.id }); this.wait(u, 0.3); return; }   // 멀어졌거나, 아무리 해도 닿지 못하면 접는다
  }
  if (this.dodge(u)) return;
  if (u.skills.length && u.gcd <= 0 && this.enemySkill(u, allies)) { u.owe = false; u.actT = this.t + (u.casting ? u.casting.dur : 0); return; }
  var v = this.pickTarget(u, allies), save = u.role === 'boss' && DS.BAL && DS.BAL.bossCast && this.bossSave(u);
  if (v) this.engage(u, v, 1, this.reach(u), function () { if (save) { this.wait(u, 0.2); return true; } if (u.gauge >= this.atkCost(u)) { u.owe = true; u.actT = this.t; } return this.attack(u, v); });
  else this.wait(u, 0.3);
};
// 보스가 고유 기술을 쓰게 한다 (DS.BAL.bossCast). 게이지 40 이 차는 대로 평타를 치면 틱 50 넘는 기술은 영영 차례가 오지 않는다.
// 그래서 평타를 한 번 쳤으면 다음은 기술 차례: 쓸 수 있는 기술이 있는 동안은 그 값이 찰 때까지 평타를 참는다. 기술을 쓰고 나면 다시 평타 한 번.
// 다만 멍하니 서 있지는 않는다 — 아무것도 하지 않은 지 bossHold 초(기본 6, DS.BAL.bossHold 로 바꿀 수 있다)가 넘으면 평타를 친다 (길게 잡을수록 기술이 잦아지고 어려워진다). 게이지가 넉넉하면(기술 값 + 평타 값) 참지 않는다.
P.bossHold = 6;
P.bossSave = function (u) {
  if (!u.owe || this.t - (u.actT || 0) > (DS.BAL.bossHold || this.bossHold)) return false;
  var need = 0, n, S;
  for (n = 0; n < u.skills.length; n++) { S = SK[u.skills[n]]; if (S && !(u.cd[u.skills[n]] > 1) && (!need || S.tick < need)) need = S.tick; }
  if (u.wantSk) need = u.wantSk;      // 2.3.0 큰 보스: 차례가 온 기술의 틱
  return need > 0 && u.gauge < Math.min(100, need + TK.attack);
};
P.enemySkill = function (u, allies) {
  if (u.fx && u.fx.seal) return false;
  var self = this, fr = this.friends(u), big = isBig(u), ord = [], n;
  // 2.3.0 큰 보스: 차례를 지킨다 — 차례가 온 기술(대상이 있는)의 틱이 모자라면 싼 기술로 때우지 않고 모은다 (u.wantSk → bossSave). 격노한 뒤에는 비기가 먼저
  for (n = 0; n < u.skills.length; n++) ord.push(u.skills[(n + (u.rot || 0)) % u.skills.length]);
  if (big && u.enraged) ord.sort(function (a, b) { return (SK[b] && SK[b].bult ? 1 : 0) - (SK[a] && SK[a].bult ? 1 : 0); });
  u.wantSk = 0;
  for (n = 0; n < ord.length; n++) {
    var id = ord[n], S = SK[id];
    if (!S || u.cd[id] > 0 || (!big && u.gauge < S.tick)) continue;
    var e0 = S.eff[0], tgt = null, ok = false, r1 = S.rng ? S.rng[1] : 0, r0 = S.rng ? S.rng[0] : 0, i, v;
    if (S.ai === 'summon') { ok = this.units.filter(function (m) { return !m.dead && m.owner === u.id; }).length + S.eff[0].n <= S.cap; }
    else if (S.ai === 'bomb') { ok = allies.some(function (a) { return dist(u, a) <= 1; }); }      // 2.3.0 터지는 몸: 붙으면
    else if (S.ai === 'far') {      // 2.3.0 땅굴 · 그림자 걸음: 닿는 곳 안에서 가장 먼(뒷줄의) 이
      var fd = -1; allies.forEach(function (a) { var d = dist(u, a); if (d > r1 || d < r0) return; var sc = d + (a.rng && a.rng[1] >= 3 ? 3 : 0) + (a.heal ? 2 : 0); if (sc > fd) { fd = sc; tgt = { x: a.x, y: a.y }; } });
      ok = !!tgt;
    }
    else if (S.ai === 'ward') { ok = !!this.mendTgt(u, S.eff[0].r || 3) || (S.eff.some(function (e) { return e.t === 'taunt'; }) && allies.some(function (a) { return dist(u, a) <= 2; })); }      // 2.3.0 보호막 · 방패
    else if (S.ai === 'near') { ok = allies.some(function (a) { return dist(u, a) <= (S.near || 2); }); }      // 2.3.0 둘레 기술: 가까이 붙었을 때
    else if (S.ai === 'enr') { ok = !!u.enraged && allies.some(function (a) { return dist(u, a) <= (S.near || 9); }); }
    else if (S.ai === 'blink') { ok = allies.some(function (a) { return dist(u, a) <= 1; }) && u.hp < u.mhp * 0.85; }
    else if (S.ai === 'buff') { ok = fr.length >= 2; }
    else if (S.ai === 'plague') { ok = allies.filter(function (a) { return !a.st.poison; }).length >= 2; }
    else if (e0.t === 'heal') {
      var low = 0.7; fr.forEach(function (f) { var rt = f.hp / f.mhp; if (dist(u, f) <= r1 && rt < low) { low = rt; tgt = f; } });
      ok = !!tgt;
    }
    else if (S.tg === 'enemy') {
      var bd = 99; allies.forEach(function (a) { var d = dist(u, a); if (d <= r1 && d >= r0 && d < bd) { bd = d; tgt = a; } });
      ok = !!tgt;
    }
    else if (S.tg === 'tile') {
      var bc = 0; allies.forEach(function (a) {
        if (dist(u, a) > r1 || dist(u, a) < r0) return;
        var c = self.victims(u, S, self.areaTiles(u, S, a.x, a.y)).length; if (c > bc) { bc = c; tgt = { x: a.x, y: a.y }; }
      });
      ok = bc >= 1;
    }
    else if (S.tg === 'self') { ok = this.victims(u, S, this.areaTiles(u, S, u.x, u.y)).length >= 1; }
    else if (S.tg === 'dir') {
      var bc2 = 0, BW = u.fw || 1, BH = u.fh || 1; DIR.forEach(function (dd) {
        var t = BW > 1 || BH > 1 ? { x: dd[0] > 0 ? u.x + BW : dd[0] < 0 ? u.x - 1 : u.x, y: dd[1] > 0 ? u.y + BH : dd[1] < 0 ? u.y - 1 : u.y } : { x: u.x + dd[0], y: u.y + dd[1] }, c = self.victims(u, S, self.areaTiles(u, S, t.x, t.y)).length;
        if (c > bc2) { bc2 = c; tgt = t; }
      });
      ok = bc2 >= (S.minN || 1);
    }
    else if (S.tg === 'row' || S.tg === 'unit') {
      var bd2 = 99; allies.forEach(function (a) { var d = dist(u, a); if (d < bd2 && d <= 7) { bd2 = d; tgt = { x: a.x, y: a.y }; } });
      ok = !!tgt;
    }
    else if (S.tg === 'multi') { ok = allies.some(function (a) { return dist(u, a) <= 8; }); }
    if (!ok) continue;
    if (big && u.gauge < S.tick) { u.wantSk = S.tick; return false; }
    u.rot = big ? u.skills.indexOf(id) + 1 : (u.rot || 0) + n + 1;
    if (this.cast(u, id, tgt, false)) return true;
  }
  return false;
};

P.think = function (u) {
  u.idle = false;
  if (u.side === 'enemy') return this.aiEnemy(u);
  if (u.role === 'shade' && this.aiShade) return this.aiShade(u);      // 2.5.0 이름 부르기의 그림자 (shade.js)
  if (u.role === 'cmd') {
    if (u.order && DS.BAL.ordSafe && u.order.t !== 'move' && this.ordGuard(u)) { if (u.saving) u.saving = false; return; }      // 명령은 그대로 쥔 채 먼저 몸을 피한다 (이동 명령만 예외)
    if (u.order && this.runOrder(u)) { if (u.saving) u.saving = false; return; }      // 명령을 따르는 동안은 「기술 준비」를 내린다 (화면이 명령보다 이 칸을 먼저 읽는다)
    if (u.busy > 0) return;
    return this.aiCmd(u);
  }
  return this.aiMerc(u);
};

// ───────── 시간 ─────────
P.update = function (dt) {
  this.acc += dt;
  var n = 0;
  while (this.acc >= STEP && n++ < 12) { this.acc -= STEP; this.tick(STEP); }
  if (n >= 12) this.acc = 0;
};
P.tick = function (dt) {
  if (this.result) { if (this.sq.length || this.zn.length) this.seqClear(); return; }
  this.t += dt;
  var us = this._us, all = this.units, i, u, self = this;
  us.length = 0; for (i = 0; i < all.length; i++) us.push(all[i]);      // 이번 틱에 볼 유닛 (도중에 늘어난 유닛은 다음 틱부터)
  this.chk -= dt;
  if (this.chk <= 0) {
    this.chk = 0.25;
    this.combat = this.mode !== 'town' && us.some(function (e) { return !e.dead && e.side === 'enemy' && e.aggro; });
    if (this._wasC && !this.combat && this.mode !== 'scn') this.rsvClear();      // 2.2.3: 들판 싸움이 끝나면 예약을 거둔다 (시나리오는 판이 끝날 때까지)
    this._wasC = this.combat;
    if (!this.combat) this.lastHit = this.t;
    else if (this.mode === 'zone' && this.t - (this.lastHit || 0) > 25) {      // 서로 닿지 못한 채 오래 끌면 적이 물러난다
      us.forEach(function (e) { if (!e.dead && e.side === 'enemy' && e.aggro) { e.aggro = false; e.calmT = self.t + 12; e.stuck = 0; self.emit({ t: 'calm', id: e.id }); } });
      this.combat = false; this.lastHit = this.t;
    }
    if (this.mode === 'zone') this.groups.forEach(function (g) {
      if (g.alive || g.deadAt == null || self.t - g.deadAt < (g.respawn || 50)) return;
      if (self.cmds().some(function (c) { return Math.abs(c.x - g.x) + Math.abs(c.y - g.y) < 10; })) return;
      self.spawnGroup(g);
    });
    if (this.waves.length && this.waves[0].t != null && this.t >= this.waves[0].t) this.nextWave();
    if (this.t - this.swp >= 3) { this.swp = this.t; this.sweep(); }
    if (this.shd && this.shadeTick) this.shadeTick();      // 2.5.0: 이름 부르기 — 자동이면 위태로울 때 스스로 (shade.js)
  }
  if (this.std) { this.std.tick(this, dt); if (this.result) return; }      // 2.8 마지막 물결 (stand.js): 물결을 부르고 센다 (엔진 시간 · 엔진 난수만)
  var peace = !this.combat;
  for (i = 0; i < us.length; i++) {
    u = us[i]; if (u.dead) continue;
    var k;
    if (typeof u.st !== 'object' || !u.st) { u.stance = u.st || null; u.st = {}; }      // 누가 태세('side')를 st 에 적어 넣었다: stance 로 옮기고 상태이상 표를 되살린다
    for (k in u.buffs) { u.buffs[k].t -= dt; if (u.buffs[k].t <= 0) { delete u.buffs[k]; this.emit({ t: 'buffEnd', id: u.id, s: k }); } }
    for (k in u.cd) if (u.cd[k] > 0) u.cd[k] -= dt;
    u.gcd -= dt;
    var slow = false;
    for (k in u.st) {
      var s = u.st[k]; s.t -= dt;
      if (k === 'slow') slow = true;
      if (k === 'poison' || k === 'burn') { s.acc += dt; if (s.acc >= 2) { s.acc -= 2; var dsrc = s.by ? this.byId[s.by] : null; this.hurt(u, Math.max(1, Math.round(u.mhp * s.p / 100 * (u.role === 'boss' ? 0.25 : 1))), dsrc && !dsrc.dead ? dsrc : null, { type: k, refl: true }); if (u.dead) break; } }      // 2.2.6 화상 (법사): 중독과 같은 셈, 따로 쌓인다
      if (s.t <= 0) { delete u.st[k]; this.emit({ t: 'statusEnd', id: u.id, s: k }); }
    }
    if (u.dead) continue;
    if (u.life != null) { u.life -= dt; if (u.life <= 0) { this.kill(u); continue; } }
    // 용암
    u.acc += dt;
    if (u.acc >= 1) {
      u.acc -= 1;
      if (this.kind[u.y * this.w + u.x] === 'lava' && !has(u, 'fly') && u.passive !== 'fireborn') { this.hurt(u, Math.max(1, Math.round(u.mhp * 0.04)), null, { type: 'fire' }); if (u.dead) continue; }
      if (u.aura && !peace && (u.side !== 'enemy' || u.aggro) && this.mode !== 'town') this.auraTick(u);      // 2.3.0 독 · 서리 기운
      // 싸움이 끝나도 체력·마나는 그대로 이어진다. 쉬면 아주 천천히 돌아올 뿐 (마을에서는 조금 빨리).
      if (u.trait === 'medic' && u.back && u.hp < u.mhp) u.hp = Math.min(u.mhp, u.hp + u.mhp * 0.035);
      if (peace && u.side === 'ally') {
        var rg = this.mode === 'town' ? 5 : 1;
        if (u.hp < u.mhp) u.hp = Math.min(u.mhp, u.hp + u.mhp * 0.006 * rg);
        if (u.mp < u.mmp) u.mp = Math.min(u.mmp, u.mp + u.mmp * 0.0045 * rg);
      } else if (u.side === 'ally' && u.mmp) u.mp = Math.min(u.mmp, u.mp + u.mmp * 0.002);
      if (!peace && u.fx && u.fx.mpRegen && u.mmp && u.mp < u.mmp) u.mp = Math.min(u.mmp, u.mp + u.mmp * u.fx.mpRegen);
      if (!peace && u.fx && u.fx.hpRegen && u.hp < u.mhp) this.heal(u, u.mhp * Math.min(0.02, u.fx.hpRegen), true);      // 2.1.0 장비: 싸우는 동안 HP 가 조금씩 찬다
      if (!peace && u.fx && u.fx.curse && u.hp > u.mhp * 0.3) { u.hp = Math.max(Math.ceil(u.mhp * 0.3), u.hp - Math.max(1, Math.round(u.mhp * u.fx.curse))); u.cursed = (u.cursed || 0) + 1; }      // 2.1.0 저주받은 장비: 초마다 HP 를 잃는다 (30% 아래로는 깎지 않는다 — 쓰러뜨리지 않는다)
      if (peace && u.fxK) u.fxK = 0;      // 처치 흡혈(killDrain) 쌓인 것은 그 싸움까지
      if (u.leechAcc >= 1) { this.emit({ t: 'heal', id: u.id, v: Math.round(u.leechAcc), drain: true }); u.leechAcc = 0; }
    }
    if (u.ult && !peace && !(u.uc >= 100)) u.uc = Math.min(100, (u.uc || 0) + dt * 100 / DS.ULT.charge * this.ultUp(u));      // r32: 싸우는 동안 필살 게이지가 찬다
    if (peace && u.side === 'ally') u.gauge = 100;
    else if (u.gauge < 100) u.gauge = Math.min(100, u.gauge + TK.regen * u.spd / 10 * (slow ? 0.6 : 1) * dt);
    if (u.busy > 0) u.busy -= dt;
    if (u.busy <= 0 && !u.casting) this.think(u);
  }
  if (this.hz.length) this.hazTick(dt);      // 2.3.0 땅의 위험
  if (this.sq.length) this.seqTick(dt);      // 여러 박자 · 예고 낙하
  if (this.zn.length) this.zoneTick(dt);      // 남는 자리
  // 예고 기술
  if (this.tele.length) {
    var done = [];
    this.tele.forEach(function (T) { T.t -= dt; if (T.t <= 0) done.push(T); });
    if (done.length) {
      this.tele = this.tele.filter(function (T) { return done.indexOf(T) < 0; });
      this.reDanger();
      done.forEach(function (T) {
        T.u.casting = null;
        self.emit({ t: 'castEnd', tid: T.id });
        if (!T.u.dead) {
          var TS = SK[T.sk];
          if (TS && (TS.beats || TS.fall)) { self.seqStart(T.u, T.sk, T.tiles, null, T.c); return; }      // 예고 뒤에 여러 박자로 풀리는 기술
          self._tele = true; self._at = T.c; self.resolve(T.u, T.sk, T.tiles, null); self._tele = false; self._at = null;
          if (TS && TS.dash && !T.u.dead && !self.result) self.dashTo(T.u, T.tiles);      // 2.3.0: 예고한 돌진은 친 뒤 길 끝까지 달려 나간다
        }
      });
    }
  }
};

})();
