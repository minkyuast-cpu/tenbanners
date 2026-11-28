// 전민 2.9 「마지막 싸움」: 30번 어스름의 문을 다섯 막으로. 막마다 읽히는 생각 하나, 눈에 보이는 막 넘김(짧은 띠 + 한두 마디), 붉은 예고가 먼저 오는 공격.
//   ① 묶인 먼동: 사슬에 매인 옛 맹주(문에서 사슬 길이 안쪽으로만 나선다) · 칼 휘두르기 · 지옥의 십자. 체력이 절반이면 사슬 하나가 끊어진다.
//   ② 문이 열린다: 먼동이 문 앞에 무릎 꿇는다(맞지 않는다 · 쉬어 가는 틈). 양옆과 문틈에서 어스름이 쏟아지고, 땅에서 「어스름의 손」이 올라온다(붉은 칸 뒤 낙하). 다 막거나 시간이 다하면 끝.
//   ③ 어스름의 왕: 큰 몸(2×4)이 걸어 나온다. 줄을 따라 긋는 「멸망의 줄」(붉은 줄 예고) · 어스름 숨(부채꼴) · 「이름 없는 그림자」 부르기.
//   ④ 밤이 내린다 (왕 체력 절반): 싸움터가 어두워지고 바닥에 검은 땅(남는 자리)이 번진다. 왕이 네 귀퉁이를 오가며(자리에 표식이 먼저) 검은 별비를 떨군다. 비켜 설 칸은 늘 남는다.
//   ⑤ 마지막 새벽 (왕 체력 2할): 풀려난 먼동이 우리 편으로 일어선다. 왕은 「마지막 어스름」을 센다(초를 센다 — 그 사이 쓰러뜨리거나 버틴다). 끝나기 직전 먼동이 모두에게 새벽 방패. 왕이 쓰러지면 동이 튼다 → 원래 맺음과 엔딩.
//   규칙은 엔진 안(sim.fin — 엔진 시간과 엔진 난수만)이라 봇(tools/bot.js) · 재기(tools/calib.js) · 화면이 같다. 숫자는 모두 DS.FINAL 에.
//   위쪽은 순수 (Node 에서도 읽힌다). 「── 화면」 아래는 브라우저에서만: 막 넘김 띠 · 막 표시 · 사슬 · 무릎 꿇은 먼동 · 어둠 · 초 세기 · 새벽빛 · 기술 그림.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var SK = DS.SKILLS, EN = DS.ENEMIES, BO = DS.BOSSES; if (!SK || !EN || !BO || !DS.Sim) return;

// ── 표: 숫자는 모두 여기 ──
var F = DS.FINAL = {
  on: true,
  gate: { x: 6, y: 1 },               // 문 한가운데 — 사슬이 매인 곳
  anchors: [[4, 1], [8, 1], [6, 1]],  // 사슬 세 가닥이 매인 자리 (그림 · 하나씩 끊어진다)
  kneel: { x: 6, y: 2 },              // 먼동이 무릎 꿇는 칸
  king: { x: 5, y: 3 },               // 왕이 서는 칸 (2×4 의 왼쪽 위)
  lull: 1.6,                          // 막이 바뀔 때 적이 숨을 고르는 엔진 초 (화면은 따로 잠깐 멈춘다)
  rest: 0.12, restMp: 0.1,            // 막이 바뀔 때 우리 편이 돌리는 숨 (최대 체력 · 마나의 몫)
  gap: 2.2,                           // 막의 공격(줄 · 별비 · 손 · 옮겨 감)끼리 적어도 이만큼 띄운다 (엔진 초)
  genHp: 0.85,                        // 다음 세대의 장(2대째부터): 먼동 · 왕의 체력 배율에 이만큼 더 (대마다 세기가 오르니 싸움 길이는 비슷하게)
  p1: { hp: 2.3, atk: 0.85, to: 0.5, leash: 3, skills: ['fin_arc', 'b_cross', 'b_curse'] },
  p2: { waves: 2, per: 6, more: 1.25, gap: 9, dur: 30, live: 10, hands: 3, hand0: 2.5, hand: 5.5, mobHp: 0.55, mobAtk: 0.45, dL: 2 },
  p3: { hp: 3.9, atk: 0.7, mag: 0.95, skills: ['fin_breath', 'fin_sum', 'b_dark', 'e_smash'], judge0: 5, judge: 13, rows: 2 },
  p4: { to: 0.5, judge: 18, tp0: 3, tp: 12, tpWarn: 1.2, rain0: 2, rain: 9, rainN: 7, zone0: 1, zone: 6.5, zoneMax: 3, cover: 0.3 },
  p5: { to: 0.2, cd0: 1.5, cd: 12, again: 16, wardAt: 2.5, ward: 0.25, wardDur: 6, blast: 0.66, dawnHp: 1.6, dawnK: 1.0, heal: 0.6 }
};
// 싸움터 (13 × 20 · 출발 칸 y16~19 · x3~9 는 비워 둔다). 맨 위가 문(세 짝 · 기둥 p), 가운데 줄에 무너진 벽, 아래는 다가가는 길
var MAP = DS.FINAL_MAP = [
  '#############',
  '####_ppp_####',
  '#___________#',
  '#___________#',
  '#__p_____p__#',
  '#___________#',
  '#___________#',
  '#___________#',
  '#__p_____p__#',
  '#___________#',
  '##__##_##__##',
  '#___________#',
  '#___________#',
  '#___________#',
  '#___________#',
  '#___________#',
  '#___________#',
  '#___________#',
  '#___________#',
  '#___________#'];
var ARENA = { x0: 1, x1: 11, y0: 2, y1: 9 };      // 막 ④의 별비 · 검은 땅이 깔리는 곳
var CORN = [[1, 2], [10, 2], [1, 6], [10, 6], [5, 3]];      // 왕이 옮겨 서는 자리 (왼쪽 위 칸) — 네 귀퉁이 + 가운데
var SIDE = [[1, 3], [11, 3], [1, 6], [11, 6], [4, 1], [8, 1], [1, 8], [11, 8]];      // 막 ②에 어스름이 쏟아지는 곳 (양옆 · 문 곁)

// ── 기술 (막의 공격은 이 표의 효과로 풀린다 — 화면의 그림은 아래 「기술 그림」) ──
var NEW_SK = {
  fin_arc:    { name: '사슬 칼', tick: 45, tg: 'self', area: 'r2', side: 'enemy', cast: 1.5, fx: 'slash', ai: 'near', near: 2, cd: 8, eff: [{ t: 'dmg', m: 1.05, type: 'magic' }, { t: 'knock', n: 1 }] },
  fin_hand:   { name: '어스름의 손', tick: 0, tg: 'tile', area: 'single', fx: 'dark', fall: { delay: 1.4, hold: 0 }, eff: [{ t: 'dmg', m: 0.85, type: 'magic' }, { t: 'status', s: 'slow', dur: 3 }] },
  fin_judge:  { name: '멸망의 줄', tick: 0, tg: 'row', fx: 'dark', bult: true, cast: 2.6, eff: [{ t: 'dmg', m: 2.1, type: 'magic' }] },
  fin_breath: { name: '어스름 숨', tick: 50, tg: 'dir', len: 5, cone: true, cast: 1.8, fx: 'dark', cd: 10, minN: 1, eff: [{ t: 'dmg', m: 1.5, type: 'magic' }, { t: 'gauge', v: -25 }] },
  fin_sum:    { name: '이름 없는 그림자', tick: 50, tg: 'self', fx: 'dark', ai: 'summon', cap: 4, cd: 17, eff: [{ t: 'summon', type: 'nameless', n: 2 }] },
  fin_rain:   { name: '검은 별비', tick: 0, tg: 'tile', area: 'single', fx: 'meteor', fall: { delay: 1.7, hold: 0 }, eff: [{ t: 'dmg', m: 1.75, type: 'magic' }] },
  fin_end:    { name: '마지막 어스름', tick: 0, tg: 'self', area: 'all', side: 'enemy', fx: 'dark', bult: true, eff: [] },
  fin_ward:   { name: '새벽 방패', tick: 0, tg: 'self', area: 'all', side: 'ally', fx: 'holy', eff: [] }
};
for (var zi = 0; zi < 4; zi++) NEW_SK['fin_dusk' + zi] = { name: '번지는 어스름', tick: 0, tg: 'tile', fx: 'dark', eff: [], zone: { dur: 14, every: 1, k: 'dark', to: 'foe', dz: 1, eff: [{ t: 'dmg', m: 0.4, type: 'magic' }, { t: 'gauge', v: -6 }] } };
for (var k in NEW_SK) SK[k] = NEW_SK[k];
DS.FIN_SK = Object.keys(NEW_SK);
// 이름 없는 그림자: 이름이 지워진 자리에 남은 것 (왕이 부른다 · 약하지만 끈질기다)
if (!EN.nameless) EN.nameless = { name: '이름 없는 그림자', kind: 'spirit', mt: 'foot', sprite: EN.shade ? EN.shade.sprite : 'ghost', tags: ['demon'], skills: [],
  base: { hp: 24, atk: 10, def: 3, mag: 0, res: 6 }, grow: { hp: 2.6, atk: 0.8, def: 0.5, mag: 0, res: 0.75 }, spd: 12, mv: 0.85, rng: [1, 1], atk: 'melee', info: '이름이 지워진 자리에 남은 그림자. 약하지만 끈질기다.' };

// ── 판 만들기: 30번(본편 · 다음 세대의 장)만 이 싸움터 · 이 먼동 ──
function finScn(s) { return !!(F.on && s && s.boss === 'herald' && !s.pit && !s.stand); }
DS.finScn = finScn;
var bs0 = DS.buildScenario;
if (bs0) DS.buildScenario = function (s, a, b, c) {
  var r = bs0(s, a, b, c);
  if (!r || !finScn(s)) return r;
  r.map = MAP.slice();
  r.units = r.units.filter(function (u) { return u.grp !== 'g2'; });      // 셋째 초소는 싸움터 안이라 뺀다 (어스름은 막 ②에 쏟아진다)
  r.units.forEach(function (u) {
    if (u.grp === 'g1') u.y -= 2;      // 둘째 초소는 무너진 벽 너머 싸움터 들머리로 (첫 초소와 떨어져 하나씩 붙는다)
    if (u.obj && u.type === 'herald') { u.fin = 'herald'; u.finMobs = (s.mobs || []).slice(); if (s.gen >= 2) u.finGen = s.gen; u.phase2 = null; u.x = F.kneel.x; u.y = F.kneel.y; }
  });
  r.fin = 1;
  return r;
};

// ── 엔진 안의 손 (sim.fin): 막을 넘기고, 막마다의 공격을 건다 ──
function dist(a, b) { return DS.fpDist ? DS.fpDist(a, b) : Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function Ctl(sim, h) {
  this.ph = 1; this.hid = h.id; this.kid = null; this.did = null; this.pt = sim.t;
  this.at = {}; this.q = []; this.qT = 0; this.adds = {}; this.made = 0; this.killed = 0; this.plan = 0;
  this.cnt = null; this.tp = null; this.zi = 0; this.last = -99; this.done = false; this.log = [[1, 0]]; this.n = { hand: 0, judge: 0, rain: 0, zone: 0, tp: 0, blast: 0, ward: 0 };
  this.mobs = (h.finMobs && h.finMobs.length ? h.finMobs : ['demon', 'gargoyle', 'ghost', 'darkMage']).filter(function (m) { return EN[m]; });
  if (!this.mobs.length) this.mobs = ['demon'];
  this.L = h.L; this.gen = h.finGen || 1;
  var ks = null; try { ks = sim.mk(null, { boss: 'duskking', x: 0, y: 0, grp: 'boss', L: h.L }); } catch (x) { ks = null; }
  this.more = !!(ks && ks.finMore);      // 다음 세대의 비틀기 「어스름이 더 쏟아진다」 (legacy.js)
  h.leash = { x: F.gate.x, y: F.gate.y, r: F.p1.leash }; h.phase2 = null; h.chain = 3;
  h.skills = F.p1.skills.filter(function (k) { return SK[k]; });
  var gk = (h.finGen || 1) >= 2 ? F.genHp : 1;
  if (F.p1.hp !== 1 || gk !== 1) h.hp = h.mhp = Math.max(1, Math.round(h.mhp * F.p1.hp * gk));
  if (F.p1.atk !== 1) { h.atk = Math.round(h.atk * F.p1.atk); h.mag = Math.round(h.mag * F.p1.atk); }
}
DS.FinalCtl = Ctl;
var CP = Ctl.prototype;
CP.herald = function (sim) { return sim.byId[this.hid] || null; };
CP.king = function (sim) { var k = this.kid && sim.byId[this.kid]; return k && !k.dead ? k : null; };
CP.dawn = function (sim) { var d = this.did && sim.byId[this.did]; return d && !d.dead ? d : null; };
CP.boss = function (sim) { return this.ph >= 3 ? this.king(sim) : this.herald(sim); };
function allies(sim) { return sim.units.filter(function (u) { return !u.dead && u.side === 'ally' && !u.veil; }); }
function shuffle(sim, a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(sim.rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function walk(sim, x, y) { return sim.pass('foot', x, y); }
function inArena(x, y) { return x >= ARENA.x0 && x <= ARENA.x1 && y >= ARENA.y0 && y <= ARENA.y1; }
function onBody(k, x, y) { return !!k && x >= k.x && x < k.x + (k.fw || 1) && y >= k.y && y < k.y + (k.fh || 1); }
// 예고(붉은 칸)를 건 기술: 화면은 cast 를 받아 칸을 붉게 깜빡이고 보스 막대에 이름을 띄운다. 끝나면 엔진(tick 의 예고 풀기)이 그 칸을 친다
CP.tele = function (sim, u, sk, tiles, dur) {
  if (!u || u.dead || !tiles.length) return null;
  var cx = 0, cy = 0; tiles.forEach(function (t) { cx += t[0]; cy += t[1]; }); cx = Math.round(cx / tiles.length); cy = Math.round(cy / tiles.length);
  var T = { id: sim.nid++, u: u, sk: sk, tiles: tiles, t: dur, dur: dur, c: [cx, cy] };
  sim.tele.push(T); u.casting = T; u.busy = dur + 0.35;
  sim.say(u, SK[sk].name);
  if (SK[sk].bult && !this['bu_' + sk + this.ph]) { this['bu_' + sk + this.ph] = 1; sim.emit({ t: 'bossUlt', id: u.id, sk: sk }); }      // 막마다 처음 한 번은 보스 컷인
  sim.emit({ t: 'cast', id: u.id, sk: sk, tid: T.id, tiles: tiles, dur: dur, side: u.side });
  sim.reDanger();
  this.last = sim.t;
  return T;
};
CP.fall = function (sim, u, sk, tiles) {      // 예고 낙하 (부른 이는 묶이지 않는다)
  if (!u || u.dead || !tiles.length) return false;
  var b = u.busy, cs = u.casting;
  sim.seqStart(u, sk, tiles, null, tiles[0].slice());
  u.busy = Math.max(b, 0.2); u.casting = cs;
  this.last = sim.t;
  return true;
};
CP.cancel = function (sim, u) {      // 걸어 둔 예고를 거둔다 (막이 바뀔 때)
  if (!u) return;
  sim.tele = sim.tele.filter(function (T) { if (T.u === u) { sim.emit({ t: 'castEnd', tid: T.id, cancel: true }); return false; } return true; });
  if (u.casting && u.casting.fin) sim.emit({ t: 'castEnd', tid: u.casting.id, cancel: true });
  u.casting = null; sim.reDanger();
};
// 막 넘기기
CP.go = function (sim, n) {
  if (this.done || n <= this.ph || sim.result) return;
  var t = sim.t, h = this.herald(sim), k = this.king(sim), self = this;
  this.ph = n; this.pt = t; this.log.push([n, Math.round(t - (this.log[0][1] || 0))]); this.last = t;
  this.cancel(sim, h); this.cancel(sim, k);
  sim.units.forEach(function (u) { if (!u.dead && u.side === 'enemy') u.busy = Math.max(u.busy || 0, F.lull); });      // 짧은 틈: 적이 숨을 고른다
  allies(sim).forEach(function (u) { if (u.role === 'cmd' || u.role === 'merc') { sim.heal(u, u.mhp * F.rest, true); if (u.mmp) u.mp = Math.min(u.mmp, u.mp + u.mmp * F.restMp); } });      // 우리 편도 한숨 돌린다
  var focus = h ? h.id : null;
  if (n === 2 && h) {      // 사슬 하나가 끊어지고 먼동이 문 앞에 무릎 꿇는다
    h.veil = true; h.obj = false; h.chain = 2; h.leash = null; h.order = null;
    if (!(h.x === F.kneel.x && h.y === F.kneel.y)) {
      var p = sim.fits(h, F.kneel.x, F.kneel.y) ? { x: F.kneel.x, y: F.kneel.y } : sim.freeNear(F.kneel.x, F.kneel.y, 'foot', 3);
      if (p) { sim.moveTo(h, p.x, p.y); sim.emit({ t: 'blink', id: h.id, x: h.x, y: h.y }); }
    }
    var N = Math.round(F.p2.waves * F.p2.per * (this.more ? F.p2.more : 1)), per = Math.ceil(N / F.p2.waves);
    for (var i = 0; i < N; i++) this.q.push({ type: this.mobs[Math.floor(sim.rand() * this.mobs.length)], at: t + F.lull + Math.floor(i / per) * F.p2.gap, w: Math.floor(i / per) + 1 });
    this.plan = N; this.at.hand = t + F.lull + F.p2.hand0;
  } else if (n === 3) {      // 어스름의 왕이 걸어 나온다
    var s = sim.mk(null, { boss: 'duskking', x: F.king.x, y: F.king.y, grp: 'boss', L: this.L });
    var extra = (s.skills || []).filter(function (x) { return BO.duskking.skills.indexOf(x) < 0 && F.p3.skills.indexOf(x) < 0; });      // 다음 세대의 비틀기로 더한 것 (그림자 부름 · 저주)
    s.skills = F.p3.skills.filter(function (x) { return SK[x]; }).concat(extra);
    s.obj = true; s.fin = 'king'; s.phase2 = null; delete s.enr;
    s.hp = s.mhp = Math.max(1, Math.round(s.mhp * F.p3.hp * (this.gen >= 2 ? F.genHp : 1)));
    s.atk = Math.round(s.atk * F.p3.atk); s.mag = Math.round(s.mag * F.p3.mag);      // 평타(물리)는 무디게, 예고하는 마법은 그대로 — 큰 피해는 보이는 공격에서 오게
    var nu = sim.add(s);
    if (nu) { nu.aggro = true; nu.gauge = 30; nu.busy = F.lull; this.kid = nu.id; focus = nu.id; }
    else { this.done = true; sim.win(); return; }      // 설 자리가 없다 (일어나지 않는다 — 그래도 판이 멈추지 않게)
    this.at.judge = t + F.lull + F.p3.judge0;
    if (h) h.chain = 1;
  } else if (n === 4 && k) {      // 밤이 내린다
    focus = k.id;
    this.at.judge = t + F.lull + F.p4.judge * 0.6; this.at.tp = t + F.lull + F.p4.tp0; this.at.rain = t + F.lull + F.p4.rain0; this.at.zone = t + F.lull + F.p4.zone0;
  } else if (n === 5 && k) {      // 마지막 새벽: 먼동이 일어서고 왕은 마지막 어스름을 센다
    focus = k.id; this.tp = null;
    sim.zn = sim.zn.filter(function (Z) { if (/^fin_dusk/.test(Z.sk)) { sim.emit({ t: 'zoneEnd', zid: Z.id }); return false; } return true; });      // 새벽빛이 검은 땅을 걷는다
    sim.reDanger();
    if (h) this.turn(sim, h);
    this.at.cnt = t + F.lull + F.p5.cd0;
  }
  sim.emit({ t: 'finPhase', n: n, id: focus, k: this.kid, h: this.hid, d: this.did });
};
// 먼동이 우리 편으로 (같은 유닛이 편을 바꾼다 — 화면은 spawn 을 받아 새 모습으로 다시 그린다)
CP.turn = function (sim, h) {
  if (h.exp || h.gold) { var re = { t: 'reward', exp: h.exp || 0, gold: h.gold || 0, L: h.L, x: h.x, y: h.y, boss: true, type: h.type }; if (sim.mode === 'scn') re.mode = 'scn'; sim.emit(re); }      // 먼동을 풀어 준 몫 (예전에 쓰러뜨리던 몫과 같다)
  var cm = sim.cmds(), hero = (sim.heroId && sim.byId[sim.heroId] && !sim.byId[sim.heroId].dead) ? sim.byId[sim.heroId] : cm[0], base = hero || h, P = F.p5;
  h.side = 'ally'; h.role = 'summon'; h.type = 'dawn'; h.name = this.gen >= 2 ? '먼동의 메아리' : '먼동'; h.title = ''; h.sprite = 'elder_mundong'; h.pal = null; h.big = false; h.boss = false;
  h.owner = base.id; h.veil = false; h.obj = false; h.leash = null; h.fin = 'dawn'; h.chain = 0; h.exp = 0; h.gold = 0;
  h.mhp = h.hp = Math.max(1, Math.round((base.mhp || 100) * P.dawnHp)); h.atk = Math.round((base.atk || 10) * P.dawnK); h.mag = Math.round(Math.max(base.mag || 0, base.atk || 0) * P.dawnK);
  h.def = base.def || 0; h.res = base.res || 0; h.spd = 11; h.mv = 1; h.mt = 'foot'; h.rng = [1, 3]; h.atkKind = 'bolt'; h.dtype = 'magic'; h.kind = 'mage'; h.tags = [];
  h.heal = P.heal; h.skills = []; h.buffs = {}; h.st = {}; h.cd = {}; h.gauge = 60; h.busy = F.lull; h.aggro = false; h.order = null; h.casting = null; h.auto = true; h.mn = h.name;
  this.did = h.id; sim._ver++; sim.reDanger();
  sim.emit({ t: 'spawn', id: h.id }); sim.emit({ t: 'finJoin', id: h.id });
};
CP.hurt = function (sim, v) {
  if (this.done) return;
  if (v.id === this.hid && this.ph === 1 && v.hp <= v.mhp * F.p1.to) { v.hp = Math.max(1, Math.ceil(v.mhp * F.p1.to)); this.go(sim, 2); return; }
  if (v.id === this.kid) {
    if (this.ph === 3 && v.hp <= v.mhp * F.p4.to) { v.hp = Math.max(1, Math.ceil(v.mhp * F.p4.to)); this.go(sim, 4); return; }
    if (this.ph === 4 && v.hp <= v.mhp * F.p5.to) { v.hp = Math.max(1, Math.ceil(v.mhp * F.p5.to)); this.go(sim, 5); return; }
  }
};
CP.died = function (sim, v) {
  if (v.finAdd) this.killed++;
  if (v.id === this.kid && !this.done) {      // 왕이 쓰러졌다: 동이 튼다 (승리는 엔진의 목표 보스 처리가 그대로)
    if (this.cnt) { sim.emit({ t: 'castEnd', tid: this.cnt.tid, cancel: true }); this.cnt = null; }
    this.done = true; this.ph = 6; this.log.push([6, Math.round(sim.t - (this.log[0][1] || 0))]);
    sim.emit({ t: 'finDawn', id: v.id, d: this.did });
  }
  if (v.id === this.did) sim.emit({ t: 'finDawnDown', id: v.id });
};
CP.liveAdds = function (sim) { var n = 0; for (var id in this.adds) { var u = sim.byId[id]; if (u && !u.dead) n++; } return n; };
CP.spawn = function (sim, it) {
  var sp = SIDE[(this.made + (it.w - 1)) % SIDE.length], p = sim.freeNear(sp[0], sp[1], 'foot', 3); if (!p) return null;
  var u = sim.mk(it.type, { x: p.x, y: p.y, grp: 'fin' + it.w, L: Math.max(1, this.L - F.p2.dL), hm: F.p2.mobHp, am: F.p2.mobAtk });
  u.finAdd = it.w; u.exp = Math.round((u.exp || 0) * 0.5); u.gold = Math.round((u.gold || 0) * 0.5);
  var nu = sim.add(u); if (!nu) return null;
  nu.aggro = true; nu.busy = 0.3 + sim.rand() * 0.4; nu.gauge = 40; this.adds[nu.id] = 1; this.made++;
  sim.emit({ t: 'finAdd', id: nu.id, w: it.w });
  return nu;
};
// 막 ④의 칸 고르기: 우리 편이 선 칸 + 그 둘레 몇 칸. 왕의 몸 · 벽은 빼고, 비켜 설 칸은 늘 남는다
CP.rainTiles = function (sim, k) {
  var al = shuffle(sim, allies(sim).slice()), out = [], seen = {}, N = F.p4.rainN;
  function add(x, y) { var key = x + ',' + y; if (seen[key] || !inArena(x, y) || !walk(sim, x, y) || onBody(k, x, y) || out.length >= N) return; seen[key] = 1; out.push([x, y]); }
  al.forEach(function (u) { if (inArena(u.x, u.y)) add(u.x, u.y); });
  for (var g = 0; g < 40 && out.length < N; g++) { var b = al.length ? al[g % al.length] : { x: 6, y: 6 }; add(b.x + Math.floor(sim.rand() * 5) - 2, b.y + Math.floor(sim.rand() * 5) - 2); }
  return out;
};
CP.zoneTiles = function (sim, k) {
  var al = allies(sim).filter(function (u) { return inArena(u.x, u.y); }); if (!al.length) al = allies(sim);
  var used = {}, nUsed = 0, tot = 0, x, y;
  sim.zn.forEach(function (Z) { Z.tiles.forEach(function (t) { used[t[0] + ',' + t[1]] = 1; nUsed++; }); });
  for (y = ARENA.y0; y <= ARENA.y1; y++) for (x = ARENA.x0; x <= ARENA.x1; x++) if (walk(sim, x, y)) tot++;
  for (var g = 0; g < 24; g++) {
    var b = al.length ? al[Math.floor(sim.rand() * al.length)] : { x: 6, y: 6 }, cx = Math.max(ARENA.x0 + 1, Math.min(ARENA.x1 - 1, b.x + Math.floor(sim.rand() * 5) - 2)), cy = Math.max(ARENA.y0 + 1, Math.min(ARENA.y1 - 1, b.y + Math.floor(sim.rand() * 3) - 1));
    var tl = sim.diamond(cx, cy, 1).filter(function (t) { return inArena(t[0], t[1]) && walk(sim, t[0], t[1]) && !onBody(k, t[0], t[1]); }), ov = tl.filter(function (t) { return used[t[0] + ',' + t[1]]; }).length;
    if (tl.length >= 3 && ov <= 1 && (nUsed + tl.length) <= tot * F.p4.cover) return tl;
  }
  return null;
};
CP.judgeRows = function (sim, k) {      // 우리 편이 가장 많이 선 줄 (둘까지 · 왕이 선 줄도 된다 — 몸 둘레는 그대로 친다)
  var cnt = {}, rows = [];
  allies(sim).forEach(function (u) { if (u.y >= ARENA.y0 && u.y <= 15) cnt[u.y] = (cnt[u.y] || 0) + 1; });
  Object.keys(cnt).map(Number).sort(function (a, b) { return cnt[b] - cnt[a] || a - b; }).forEach(function (y) { if (rows.length < F.p3.rows && rows.every(function (r) { return Math.abs(r - y) > 1; })) rows.push(y); });
  var out = []; rows.forEach(function (y) { for (var x = 1; x < sim.w - 1; x++) if (walk(sim, x, y) && !onBody(k, x, y)) out.push([x, y]); });
  return out;
};
CP.free = function (sim, u) { return u && !u.dead && !u.casting && sim.t - this.last >= F.gap && !this.tp; };
CP.tick = function (sim, dt) {
  if (this.done || sim.result) return;
  var t = sim.t, h = this.herald(sim), k = this.king(sim), d = this.dawn(sim), self = this;
  if (this.q.length && t >= this.qT) {      // 쏟아지는 어스름 (한꺼번에 서 있는 수는 live 까지)
    this.qT = t + 0.45;
    for (var m = 0; m < 2 && this.q.length && this.q[0].at <= t && this.liveAdds(sim) < F.p2.live; m++) this.spawn(sim, this.q.shift());
  }
  if (d) { var own = sim.byId[d.owner]; if (!own || own.dead) { var c0 = sim.cmds()[0]; if (c0) d.owner = c0.id; } }      // 먼동은 산 가주 곁에
  if (this.ph === 2) {
    if (h && t >= this.at.hand && sim.t - this.last >= F.gap * 0.5) {      // 땅에서 손이 올라온다 (우리 편 발밑 · 셋까지)
      var hs = shuffle(sim, allies(sim).slice()).slice(0, F.p2.hands).map(function (u) { return [u.x, u.y]; });
      if (hs.length && this.fall(sim, h, 'fin_hand', hs)) this.n.hand++;
      this.at.hand = t + F.p2.hand;
    }
    if ((!this.q.length && this.made >= this.plan && this.liveAdds(sim) === 0 && t - this.pt > F.lull + 1) || t - this.pt >= F.p2.dur) { this.q.length = 0; this.go(sim, 3); }
    return;
  }
  if (!k) return;
  if ((this.ph === 3 || this.ph === 4) && t >= this.at.judge && this.free(sim, k)) {      // 멸망의 줄
    var tl = this.judgeRows(sim, k);
    if (tl.length && this.tele(sim, k, 'fin_judge', tl, SK.fin_judge.cast)) this.n.judge++;
    this.at.judge = t + (this.ph === 3 ? F.p3.judge : F.p4.judge);
  }
  if (this.ph === 4) {
    if (this.tp && t >= this.tp.at) {      // 표식 자리로 옮겨 선다
      var P = this.tp; this.tp = null;
      var to = sim.fits(k, P.x, P.y) ? P : sim.freeFit(k, P.x, P.y, 2);
      if (to) { sim.moveTo(k, to.x, to.y); sim.emit({ t: 'blink', id: k.id, x: k.x, y: k.y }); sim.emit({ t: 'finTp', id: k.id, x: k.x, y: k.y, land: 1 }); this.n.tp++; }
      k.busy = Math.max(k.busy, 0.5); this.last = t;
    } else if (!this.tp && t >= this.at.tp && this.free(sim, k)) {
      var cs = CORN.filter(function (c) { return !(c[0] === k.x && c[1] === k.y) && sim.fits(k, c[0], c[1]); });
      if (cs.length) { var c1 = cs[Math.floor(sim.rand() * cs.length)]; this.tp = { x: c1[0], y: c1[1], at: t + F.p4.tpWarn }; k.busy = F.p4.tpWarn + 0.6; sim.emit({ t: 'finTp', id: k.id, x: c1[0], y: c1[1], w: k.fw || 1, h: k.fh || 1, dur: F.p4.tpWarn }); this.last = t; }
      this.at.tp = t + F.p4.tp;
    }
    if (t >= this.at.rain && this.free(sim, k)) {      // 검은 별비
      var rt = this.rainTiles(sim, k);
      if (rt.length && this.fall(sim, k, 'fin_rain', rt)) this.n.rain++;
      this.at.rain = t + F.p4.rain;
    }
    if (t >= this.at.zone) {      // 번지는 검은 땅 (셋까지 · 싸움터의 cover 만큼까지)
      var live = sim.zn.filter(function (Z) { return /^fin_dusk/.test(Z.sk); }).length;
      if (live < F.p4.zoneMax) { var zt = this.zoneTiles(sim, k); if (zt) { sim.zoneStart(k, 'fin_dusk' + (this.zi++ % (F.p4.zoneMax + 1)), zt); this.n.zone++; } }
      this.at.zone = t + F.p4.zone;
    }
    return;
  }
  if (this.ph === 5) {
    if (!this.cnt && t >= this.at.cnt && !k.casting) {      // 마지막 어스름을 센다 (그동안 왕은 움직이지 않는다)
      var tid = sim.nid++;
      this.cnt = { t0: t, end: t + F.p5.cd, n: Math.ceil(F.p5.cd), ward: false, tid: tid };
      k.casting = { id: tid, fin: 1, u: k, sk: 'fin_end', tiles: [], t: F.p5.cd, dur: F.p5.cd }; k.busy = F.p5.cd + 0.5; k.order = null;
      sim.say(k, SK.fin_end.name);
      if (!this.bu5) { this.bu5 = 1; sim.emit({ t: 'bossUlt', id: k.id, sk: 'fin_end' }); }
      sim.emit({ t: 'cast', id: k.id, sk: 'fin_end', tid: tid, tiles: [], dur: F.p5.cd, side: 'enemy' });
      sim.emit({ t: 'finCount', id: k.id, n: this.cnt.n, start: 1, dur: F.p5.cd });
    }
    var C = this.cnt; if (!C) return;
    var left = C.end - t, nn = Math.max(0, Math.ceil(left - 1e-6));
    if (nn < C.n) { C.n = nn; if (nn > 0) sim.emit({ t: 'finCount', id: k.id, n: nn }); }
    if (!C.ward && left <= F.p5.wardAt) {      // 먼동의 새벽 방패 (모두에게 · 먼동이 서 있으면)
      C.ward = true;
      if (d) {
        allies(sim).forEach(function (u) { var amt = Math.round(u.mhp * F.p5.ward), ob = u.buffs.shd; u.buffs.shd = { p: Math.max(amt, ob ? ob.p : 0), t: F.p5.wardDur, mx: amt }; sim.emit({ t: 'buff', id: u.id, s: 'shd', p: amt }); });
        sim.emit({ t: 'skill', id: d.id, sk: 'fin_ward', fx: 'holy', tiles: allies(sim).map(function (u) { return [u.x, u.y]; }), from: [d.x, d.y] });
        sim.emit({ t: 'finWard', id: d.id }); this.n.ward++;
      }
    }
    if (left <= 0) {      // 터진다: 모두가 최대 체력의 blast 만큼 (방패가 먼저 받는다)
      this.cnt = null; k.casting = null; k.busy = 0.8;
      sim.emit({ t: 'castEnd', tid: C.tid }); sim.emit({ t: 'finBlast', id: k.id });
      sim.emit({ t: 'skill', id: k.id, sk: 'fin_end', fx: 'dark', tiles: allies(sim).map(function (u) { return [u.x, u.y]; }), from: [k.x, k.y] });
      allies(sim).forEach(function (u) { if (!sim.result && !u.dead) sim.hurt(u, Math.max(1, Math.round(u.mhp * F.p5.blast)), k, { type: 'dark' }); });
      this.n.blast++; this.at.cnt = t + F.p5.again;
    }
  }
};
CP.rec = function () { return { ph: this.ph, log: this.log.slice(), n: JSON.parse(JSON.stringify(this.n)), adds: this.made, plan: this.plan, killed: this.killed }; };
// 시험 · 도구: 막을 건너뛴다 (그 막의 문턱까지 체력을 내려 엔진이 넘기게 한다)
DS.finSkip = function (sim, n) {
  var C = sim && sim.fin; if (!C) return false;
  for (var g = 0; g < 6 && C.ph < n && !C.done && !sim.result; g++) {
    var to = C.ph + 1;
    if (to === 2) { var h = C.herald(sim); if (!h) break; h.hp = Math.ceil(h.mhp * F.p1.to) + 1; sim.hurt(h, 2, null, { type: 'phys' }); }
    else if (to === 3) { for (var id in C.adds) { var a = sim.byId[id]; if (a && !a.dead) sim.kill(a, null); } C.q.length = 0; C.made = Math.max(C.made, C.plan); C.go(sim, 3); }
    else { var k = C.king(sim); if (!k) break; k.hp = Math.ceil(k.mhp * (to === 4 ? F.p4.to : F.p5.to)) + 1; sim.hurt(k, 2, null, { type: 'phys' }); }
  }
  return C.ph >= n;
};
DS.finOf = function (sim) { return sim && sim.fin ? sim.fin : null; };

// ════════ ── 화면 (브라우저에서만) ── ════════
if (typeof document === 'undefined') return;
var G = DS.G;
function TX() {      // 다음 세대의 장이면 그 대의 글을 얹는다 (그림자 · 메아리)
  var T = DS.FINAL_TXT || { ph: {}, who: {}, hint: {} }, sim = S && S.sim, gen = sim && sim.fin ? sim.fin.gen : 1;
  if (!(gen >= 2) || !T.gen) return T;
  var o = {}, k; for (k in T) o[k] = T[k];
  o.who = {}; for (k in T.who) o.who[k] = T.who[k]; for (k in T.gen.who || {}) o.who[k] = T.gen.who[k];
  o.ph = {}; for (k in T.ph) { var P = {}, q; for (q in T.ph[k]) P[q] = T.ph[k][q]; var Gp = T.gen.ph && T.gen.ph[k]; if (Gp) for (q in Gp) P[q] = Gp[q]; o.ph[k] = P; }
  return o;
}
function U() { return DS.ui || {}; }
function calm() { return !!(DS.calmFx && DS.calmFx()); }
function lite() { return !!(DS.fxLite && DS.fxLite()); }
function A(n) { try { DS.Audio.sfx(n); } catch (x) {} }
function esc(t) { return U().esc ? U().esc(t) : String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function fillT(t, o) { return String(t == null ? '' : t).replace(/\{(\w+)\}/g, function (m, k) { return o && o[k] != null ? o[k] : ''; }); }
function cineMode() { return DS.cineMode ? DS.cineMode() : 'full'; }
var S = null;      // 지금 싸움의 화면 상태 { sim, C, band, seen, cnt, dawnT, q(말풍선 줄) }
function heroU(sim) { var h = sim.heroId && sim.byId[sim.heroId]; if (h && !h.dead) return h; return sim.cmds()[0] || null; }
function spk(sim, w) {      // 말하는 이: 유닛 · 이름 · 얼굴
  var C = sim.fin, T = TX(), u = null, nm = '', face = '', ui = U();
  if (w === 'herald') { u = C && C.herald(sim); nm = T.who.herald || '먼동'; face = ui.sprTag ? ui.sprTag('b_caster', 'jade', 1.2) : ''; }
  else if (w === 'dawn') { u = C && C.dawn(sim); nm = T.who.dawn || '먼동'; face = ui.sprTag ? ui.sprTag('elder_mundong', '', 1.6) : ''; }
  else if (w === 'king') { u = C && C.king(sim); nm = T.who.king || '어스름의 왕'; face = ui.sprTag ? ui.sprTag('b_dusk', 'jade2', 0.9) : ''; }
  else if (w === 'hero') { u = heroU(sim); nm = u ? (u.mn || u.name || '') : ''; var sv = G.save, ch = u && u.ch && sv && sv.chars[u.ch]; face = ch && ui.charSpr ? ui.charSpr(ch, 1.6) : ''; }
  return { u: u, nm: nm, face: face };
}
DS.finBusy = function () { return !!(S && S.band); };
DS.finState = function () { return S ? { band: S.band ? S.band.n : 0, seen: Object.keys(S.seen).map(Number), cnt: S.cnt, dawn: S.dawnT != null } : null; };      // 시험용
// 싸움을 걸 때 (game.js startScenario · 다시 붙기)
DS.finArm = function (sim, sc) {
  finOff();
  if (!sim || !sim.fin) { if (G.view) G.view.fin = null; return; }
  S = { sim: sim, C: sim.fin, band: null, seen: {}, cnt: null, dawnT: null, q: [], tpN: 0 };
  if (G.view) { G.view.fin = sim.fin; G.view.finS = S; }
  css();
};
function finOff() {
  if (S && S.band) closeBand(true);
  S = null; var c = document.getElementById('fincount'); if (c) c.remove();
  var p = document.querySelector('#boss .finph'); if (p) p.remove();
  Array.prototype.forEach.call(document.querySelectorAll('#boss .finmk'), function (m) { m.remove(); });
  if (G.view) { G.view.fin = null; G.view.finS = null; }
}
DS.finOff = finOff;
// 사건 (game.js onEvents 가 먼저 건넨다). 돌려주는 것: 다 받았으면 true (game.js 는 그 사건을 건너뛴다)
DS.finEv = function (e) {
  var sim = G.sim; if (!S || !sim || S.sim !== sim) return false;
  var C = S.C, V = G.view, u;
  switch (e.t) {
    case 'aggro': if (e.id === C.hid && !S.seen[1] && C.ph === 1) setTimeout(function () { if (S && S.sim === sim && !S.seen[1] && S.C.ph === 1) phase(1, e.id); }, 60); return false;      // 첫 막: 먼동이 깨어날 때 (보스 막대는 game.js 가 먼저)
    case 'finPhase': phase(e.n, e.id); return true;
    case 'finAdd': return true;
    case 'finTp':
      if (e.land) { if (V && !calm()) V.shake = Math.max(V.shake || 0, 0.25); A('dark'); }
      else { S.tp = { x: e.x, y: e.y, w: e.w || 2, h: e.h || 4, t0: V ? V.time : 0, dur: e.dur || 1 }; A('warn'); if (!S.tpN++ && V && V.bark) V.bark(e.id, TX().tp || '', 2.2); }
      return true;
    case 'finCount': count(e); return true;
    case 'finWard': u = sim.byId[e.id]; if (u && V && V.bark) V.bark(u.id, TX().ward || '', 2.4); A('holy'); if (V) { V.flashA = Math.max(V.flashA || 0, calm() ? 0.04 : 0.08); V.flashC = '#fff0c0'; } return true;
    case 'finBlast':
      if (V) { V.flashA = Math.max(V.flashA || 0, calm() ? 0.06 : 0.12); V.flashC = '#3a1050'; if (!calm()) { V.shake = Math.max(V.shake || 0, 0.6); if (V.hitStop) V.hitStop(0.09); } }
      A('boom'); setTimeout(function () { A('dark'); }, 120); countOff();
      setTimeout(function () { if (!S || S.sim !== sim || sim.result) return; var h = heroU(sim); if (h && G.view && G.view.bark) G.view.bark(h.id, TX().blast || '', 2.2); }, 900);
      return true;
    case 'finJoin': u = sim.byId[e.id]; if (u && V) { V.burst(u.x, u.y, ['#fff6d0', '#f6cf57', '#ffffff'], 18, { spd: 40, up: 20, life: 0.8 }); V.rings.push({ x: u.x, y: u.y, t: 0, dur: 0.7, c: '#f6cf57', r: 20 }); } A('promo'); return true;
    case 'finDawn': S.dawnT = V ? V.time : 0; countOff(); A('holy'); if (DS.vban) DS.vban('win', TX().dawnBreak || '', TX().dawnSub || '', calm() ? 1400 : 2200); return true;
    case 'finDawnDown': u = V && V.vu[e.id]; if (u && V) V.float(u.x, u.y, TX().dawnDown || '', '#fff3c4', { dy: -22, life: 2.6 }); return true;
  }
  return false;
};
// 막 넘김: 띠 하나(막 · 이름 · 한 줄 · 말 둘) + 잠깐 멈춤. 나머지 말은 다시 흐를 때 말풍선으로. 「사건 연출: 끔」이면 멈추지 않고 띠만
function phase(n, focus) {
  if (!S || S.seen[n]) return; S.seen[n] = 1;
  var sim = S.sim, T = TX(), P = T.ph[n] || {}, V = G.view, ui = U(), md = cineMode(), cm = calm(), short = md === 'short' || cm;
  var bu = focus && sim.byId[focus];
  if (bu && DS.showBoss && !bu.dead && bu.side === 'enemy') { DS.showBoss(bu); }
  pips(n);
  if (n === 4) { try { DS.Audio.bgm('night'); } catch (x) {} } else if (n >= 3) { try { DS.Audio.bgm('boss'); } catch (x) {} }
  if (V) { if (!cm) { V.shake = Math.max(V.shake || 0, n >= 3 ? 0.5 : 0.35); if (V.hitStop) V.hitStop(0.1); } V.flashA = Math.max(V.flashA || 0, cm ? 0.04 : 0.09); V.flashC = n === 5 ? '#fff0c0' : '#2a1040'; }
  A(n === 5 ? 'swell' : 'phase'); setTimeout(function () { A(n >= 3 ? 'bossIn' : 'dark'); }, 160);
  if (n === 2 || n === 5) chainBreak(sim);
  if (n > 1 && V && V.float) sim.units.forEach(function (u) { if (!u.dead && u.side === 'ally' && (u.role === 'cmd' || u.role === 'merc') && V.onScreen(u.x, u.y)) V.float(u.x, u.y, T.rest || '', '#9fe8a8', { dy: -14, life: 1.1 }); });
  var lines = (P.l || []).map(function (l) { var s = spk(sim, l[0]); return { w: l[0], nm: l[0] ? s.nm : '', face: l[0] ? s.face : '', t: fillT(l[1], {}), u: s.u }; });
  var inBand = md === 'off' ? 0 : short ? 1 : 2, now = lines.slice(0, inBand), later = lines.slice(inBand);
  if (md === 'off') { if (DS.vban) DS.vban('wave', fillT(T.eye, { n: n }) + ' · ' + (P.t || ''), P.sub || '', 1600); }
  else band(n, P, now, short);
  var t0 = md === 'off' ? 600 : (short ? 1300 : 2700) + 300;
  later.forEach(function (l, i) { setTimeout(function () { say(l); }, t0 + i * 1500); });
  if (T.hint && T.hint[n] && ui.toast) setTimeout(function () { if (S && S.sim === sim && !sim.result) ui.toast(T.hint[n], 3200); }, t0 + later.length * 1500 + 200);
  if (DS.updateQuest) try { DS.updateQuest(); } catch (x) {}
}
function say(l) {
  if (!S || !G.view || S.sim.result) return;
  var u = l.u && !l.u.dead ? l.u : null;
  if (!l.w) { if (U().toast) U().toast(l.t, 2400); return; }      // 지문은 알림 줄로
  if (u && G.view.bark) G.view.bark(u.id, l.t, 2.6);
}
function band(n, P, lines, short) {
  var sg = document.getElementById('s-game'); if (!sg) return;
  if (S.band) closeBand(true);
  var T = TX(), el = document.createElement('div'); el.id = 'finband'; el.className = 'finband p' + n + (calm() ? ' calm' : '') + (short ? ' short' : '');
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'assertive'); el.setAttribute('aria-label', fillT(T.eye, { n: n }) + ' ' + (P.t || ''));
  var dur = short ? 1300 : 2700;
  el.style.setProperty('--fd', dur + 'ms');
  el.innerHTML = '<div class="fbbar"><i class="fbl"></i><p class="fbe"><b>' + esc(fillT(T.eye, { n: n })) + '</b><span class="fbpips">' + [1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i < n ? 'done' : i === n ? 'on' : '') + '"></i>'; }).join('') + '</span></p>' +
    '<h3 class="fbt">' + esc(P.t || '') + '</h3>' + (P.sub ? '<p class="fbs">' + esc(P.sub) + '</p>' : '') +
    (lines.length ? '<div class="fbln">' + lines.map(function (l, i) { return '<p class="fbq' + (l.w ? '' : ' nar') + '" style="--i:' + i + '">' + (l.face ? '<span class="fbf">' + l.face + '</span>' : '') + (l.nm ? '<b>' + esc(l.nm) + '</b>' : '') + '<span>' + esc(l.t) + '</span></p>'; }).join('') + '</div>' : '') +
    '<i class="fbtime"></i></div>';
  sg.appendChild(el);
  try { if (U().hydrate) U().hydrate(el); } catch (x) {}
  G.hold = (G.hold || 0) + 1;
  var born = performance.now(), b = { n: n, el: el, born: born, t: setTimeout(function () { closeBand(); }, dur) };
  S.band = b;
  el.addEventListener('click', function (ev) { ev.stopPropagation(); if (performance.now() - born > 350) closeBand(); });
}
function closeBand(quick) {
  var b = S && S.band; if (!b) return;
  S.band = null; clearTimeout(b.t); G.hold = Math.max(0, (G.hold || 1) - 1);
  var el = b.el; el.classList.add('out'); setTimeout(function () { if (el.parentNode) el.remove(); }, quick || calm() ? 0 : 220);
}
DS.finBandSkip = function () { closeBand(true); };      // 시험용 (누른 것과 같다)
function chainBreak(sim) {      // 사슬 한 가닥이 끊어진다 (조각이 튄다)
  var V = G.view, h = S && S.C.herald(sim); if (!V || !h) return;
  var A0 = F.anchors[Math.max(0, Math.min(F.anchors.length - 1, h.chain || 0))] || F.anchors[0];
  V.burst((A0[0] + h.x) / 2, (A0[1] + h.y) / 2, ['#7446ad', '#e0c8ff', '#2a1840'], 16, { spd: 46, up: 10, life: 0.7 });
  V.rings.push({ x: h.x, y: h.y, t: 0, dur: 0.5, c: '#e0c8ff', r: 14 });
}
// 막 표시: 보스 막대 위 다섯 점 · 막대에 다음 막의 문턱 금
function pips(n) {
  var bx = document.getElementById('boss'); if (!bx) return;
  var p = bx.querySelector('.finph'); if (!p) { p = document.createElement('span'); p.className = 'finph'; p.setAttribute('aria-label', '다섯 막'); bx.appendChild(p); }
  p.innerHTML = [1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i < n ? 'done' : i === n ? 'on' : '') + '"></i>'; }).join('') + '<small>' + esc(fillT(TX().eye, { n: n })) + '</small>';
  Array.prototype.forEach.call(bx.querySelectorAll('.finmk'), function (m) { m.remove(); });
  var bar = bx.querySelector('.bbar'), mk = n === 1 ? [F.p1.to] : n === 3 ? [F.p4.to, F.p5.to] : n === 4 ? [F.p5.to] : [];
  if (bar) mk.forEach(function (f) { var m = document.createElement('b'); m.className = 'finmk'; m.style.left = (f * 100).toFixed(1) + '%'; bar.appendChild(m); });
}
DS.finQuest = function () { if (!S || !G.sim || S.sim !== G.sim || S.C.ph > 5) return ''; var n = S.C.ph, P = TX().ph[n] || {}; return fillT(TX().quest || '{n}막: {t}', { n: n, t: P.t || '' }); };
// 초 세기 (막 ⑤): 화면 위쪽 가운데 큰 수
function count(e) {
  var sg = document.getElementById('s-game'); if (!sg) return;
  var el = document.getElementById('fincount'), T = TX();
  if (!el) { el = document.createElement('div'); el.id = 'fincount'; el.setAttribute('role', 'timer'); el.setAttribute('aria-live', 'off'); sg.appendChild(el); }
  var tp = document.getElementById('boss'), sgr = sg.getBoundingClientRect(); if (tp && !tp.hidden) { var r = tp.getBoundingClientRect(); el.style.top = Math.max(4, Math.round(r.bottom - sgr.top + 66)) + 'px'; }      // 보스 컷인 띠 밑으로
  el.innerHTML = '<small>' + esc(T.count || '') + '</small><b>' + e.n + '</b><span>' + esc(fillT(T.countSub || '', { n: e.n })) + '</span>';
  el.className = 'on' + (e.n <= 3 ? ' hot' : '') + (calm() ? ' calm' : '');
  if (!calm()) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
  S.cnt = e.n; A(e.n <= 3 ? 'warn' : 'tick');
}
function countOff() { if (S) S.cnt = null; var el = document.getElementById('fincount'); if (el) el.className = ''; }

// ── 그림 (view.js 가 부른다: 0 땅 · 1 공중 · 2 화면) ──
var VP = DS.View && DS.View.prototype;
if (VP) VP.drawFin = function (g, L, dt) {
  var C = this.fin, sim = this.sim, St = this.finS; if (!C || !sim || !St || sim.fin !== C) return;
  var cm = this.calmN, t = this.time, ph = C.ph, h = sim.byId[C.hid], hv = h && this.vu[h.id], k = C.kid && sim.byId[C.kid], i;
  if (L === 0) {
    // 밤: 바닥만 어둡게 (사람은 그 위에 밝게 선다)
    var want = St.dawnT != null ? 0 : ph >= 4 ? (ph === 5 ? 0.34 : 0.46) : ph === 3 ? 0.14 : 0;
    St.dark = (St.dark || 0) + (want - (St.dark || 0)) * Math.min(1, dt * 1.6);
    if (St.dark > 0.01) { g.fillStyle = 'rgba(8,5,20,' + St.dark.toFixed(3) + ')'; g.fillRect(0, 0, this.mw * 16, this.mh * 16); }
    // 무릎 꿇은 먼동 밑의 어스름 테
    if (h && hv && h.veil && hv.dying < 0) {
      var px = hv.x * 16 + 8, py = hv.y * 16 + 13, rr = 9 + (cm ? 0 : Math.sin(t * 3) * 1.5);
      g.fillStyle = 'rgba(116,70,173,0.28)'; g.fillRect(Math.round(px - rr), Math.round(py - 2), Math.round(rr * 2), 4);
      g.fillStyle = 'rgba(224,200,255,0.5)'; g.fillRect(Math.round(px - rr), py - 3, 2, 1); g.fillRect(Math.round(px + rr - 2), py - 3, 2, 1);
    }
    // 옮겨 설 자리의 표식
    var P = St.tp; if (P && t - P.t0 < P.dur + 0.3) {
      var f = Math.min(1, (t - P.t0) / P.dur), x0 = P.x * 16, y0 = P.y * 16, w = P.w * 16, hh = P.h * 16, a = 0.25 + 0.35 * f;
      g.fillStyle = 'rgba(60,20,90,' + (a * 0.6).toFixed(3) + ')'; g.fillRect(x0 + 1, y0 + 1, w - 2, hh - 2);
      g.fillStyle = 'rgba(224,200,255,' + a.toFixed(3) + ')';
      var ins = Math.round((1 - f) * 6); g.fillRect(x0 + ins, y0 + ins, w - ins * 2, 1); g.fillRect(x0 + ins, y0 + hh - ins - 1, w - ins * 2, 1); g.fillRect(x0 + ins, y0 + ins, 1, hh - ins * 2); g.fillRect(x0 + w - ins - 1, y0 + ins, 1, hh - ins * 2);
    } else if (P) St.tp = null;
    // 새벽: 먼동 둘레의 빛 웅덩이
    var d = C.did && sim.byId[C.did], dv = d && this.vu[d.id];
    if (d && dv && !d.dead) { var gr = 10 + (cm ? 0 : Math.sin(t * 2) * 1.2), gx = dv.x * 16 + 8, gy = dv.y * 16 + 12; g.fillStyle = 'rgba(255,220,140,0.16)'; g.fillRect(Math.round(gx - gr * 1.6), Math.round(gy - gr * 0.5), Math.round(gr * 3.2), Math.round(gr)); g.fillStyle = 'rgba(255,240,200,0.22)'; g.fillRect(Math.round(gx - gr), Math.round(gy - gr * 0.3), Math.round(gr * 2), Math.round(gr * 0.6)); }
    return;
  }
  if (L === 1) {
    // 문틈: 막 ②부터 문짝 사이가 갈라져 어스름이 새어 나온다 (막 ⑤ · 동틀 녘에는 금빛)
    if (ph >= 2) {
      var gold = ph >= 5, gc = gold ? '255,226,170' : '190,150,255', pa = cm ? 0.7 : 0.55 + 0.35 * Math.sin(t * (gold ? 2 : 4));
      for (i = 0; i < 2; i++) {
        var sx0 = (F.gate.x + i) * 16, sy0 = F.gate.y * 16;
        for (var yy = 0; yy < 16; yy += 2) { var jx = ((yy * 7 + i * 3) % 5) - 2; g.fillStyle = 'rgba(' + gc + ',' + pa.toFixed(2) + ')'; g.fillRect(sx0 + jx - 1, sy0 + yy, 2, 2); }
        g.fillStyle = 'rgba(' + gc + ',' + (pa * 0.22).toFixed(2) + ')'; g.fillRect(sx0 - 6, sy0 + 16, 12, 6); g.fillRect(sx0 - 3, sy0 + 22, 6, 5);
      }
    }
    // 어스름의 사슬: 매인 자리에서 먼동까지 (끊어진 만큼 줄어든다)
    if (h && hv && !h.dead && h.chain > 0 && ph < 5) {
      var n = Math.min(F.anchors.length, h.chain), hx = hv.x * 16 + 8, hy = hv.y * 16 + 6;
      for (i = 0; i < n; i++) {
        var an = F.anchors[i], ax = an[0] * 16 + 8, ay = an[1] * 16 + 10, dx = hx - ax, dy = hy - ay, len = Math.max(1, Math.sqrt(dx * dx + dy * dy)), seg = Math.max(4, Math.floor(len / 4));
        for (var q = 0; q <= seg; q++) {
          var f2 = q / seg, sag = Math.sin(f2 * Math.PI) * Math.min(8, len * 0.12), sx = ax + dx * f2, sy = ay + dy * f2 + sag, lit = cm ? 0 : (Math.sin(t * 6 - q * 0.7 + i) + 1) / 2;
          g.fillStyle = q % 2 ? 'rgba(42,24,64,0.95)' : 'rgba(116,70,173,' + (0.7 + 0.3 * lit).toFixed(2) + ')';
          g.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, q % 2 ? 2 : 3, 2);
        }
      }
    }
    return;
  }
  // L === 2: 화면 겹 — 밤의 가장자리 · 새벽빛
  var W = this.W, H = this.H, dark = ph >= 4 && St.dawnT == null ? (ph === 5 ? 0.38 : 0.5) : 0;
  St.vig = (St.vig || 0) + (dark - (St.vig || 0)) * Math.min(1, dt * 1.4);
  if (St.vig > 0.01) {
    if (this.lite || cm) { g.fillStyle = 'rgba(10,6,22,' + (St.vig * 0.35).toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
    else { var vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7); vg.addColorStop(0, 'rgba(10,6,22,0)'); vg.addColorStop(1, 'rgba(10,6,22,' + St.vig.toFixed(3) + ')'); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
  }
  if (St.dawnT != null) {
    var e2 = t - St.dawnT, a2 = Math.max(0, Math.min(1, e2 / (cm ? 0.6 : 1.8))) * (e2 > 5 ? Math.max(0, 1 - (e2 - 5) / 2) : 1);
    if (a2 > 0.01) {
      if (this.lite || cm) { g.fillStyle = 'rgba(255,214,150,' + (a2 * 0.16).toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
      else { var lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, 'rgba(255,226,170,' + (a2 * 0.42).toFixed(3) + ')'); lg.addColorStop(0.55, 'rgba(255,190,120,' + (a2 * 0.12).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H); }
    }
  }
};

// ── 기술 그림 (2.7 기술 연출 틀) ──
var X = DS.skfx;
if (X && X.reg) {
  var PV = { deep: '#2a1840', mid: '#7446ad', pale: '#e0c8ff', ink: '#120a20', white: '#ffffff', gold: '#f6cf57', dawn: '#fff6d0' };
  X.reg('fin_arc', { tier: 3, cast: function (c) {
    c.fx('arc', { x: c.ux, y: c.uy, r: 26, a0: -Math.PI * 0.9, sw: Math.PI * 1.8, w: 3, c: PV.pale, c2: PV.mid, dur: 0.32 });
    c.fx('shock', { x: c.ux, y: c.uy, r0: 4, r: 30, w: 2, c: PV.mid, dur: 0.35, thin: 1 });
    c.burst(c.ux, c.uy, [PV.pale, PV.mid, PV.deep], 12, { spd: 40, life: 0.35 }).shake(0.15).boom('slash');
  } });
  X.reg('fin_hand', { tier: 3,
    mark: function (c, e) { c.each(function (x, y) { c.fx('shadow', { x: x, y: y, r: 7, c: PV.ink, dur: e.dur }); c.fx('sigil', { x: x, y: y, r: 7, sides: 0, c: PV.mid, dur: e.dur, spin: 1 }); }, 6); c.sfx('dark'); },
    beat: function (c) { c.each(function (x, y) { c.fx('spike', { x: x, y: y, h: 18, w: 5, c: [PV.pale, PV.mid, PV.deep], dur: 0.5, up: 0.12 }); c.burst(x, y, [PV.mid, PV.deep, PV.pale], 6, { spd: 26, up: 18, life: 0.4 }); }, 6); c.shake(0.12).boom('quakeHit'); }
  });
  X.reg('fin_judge', { tier: 4, cast: function (c) {
    var rows = {}; (c.tiles || []).forEach(function (t) { var r = rows[t[1]] || (rows[t[1]] = [99, -1]); r[0] = Math.min(r[0], t[0]); r[1] = Math.max(r[1], t[0]); });
    Object.keys(rows).forEach(function (y) { var r = rows[y]; y = +y; c.fx('beam', { x0: r[0] - 0.5, y0: y, x1: r[1] + 0.5, y1: y, w: 7, c: PV.pale, c2: PV.mid, dur: 0.45 }); c.light((r[0] + r[1]) / 2, y, 30, PV.mid, 0.6, 0.4); });
    c.shake(0.3).flash(PV.pale, 0.06).boom('thunderBig');
  } });
  X.reg('fin_breath', { tier: 3, cast: function (c) { c.fx('cone', { x: c.ux, y: c.uy, a: c.ang, spread: 0.9, len: 80, c: PV.mid, c2: PV.pale, dur: 0.5 }); c.each(function (x, y) { c.burst(x, y, [PV.mid, PV.deep], 3, { spd: 18, life: 0.4 }); }, 10); c.shake(0.18).boom('dark'); } });
  X.reg('fin_rain', { tier: 4,
    mark: function (c, e) { var T = e.dur || 1.7; c.pts = []; c.each(function (x, y, i) { c.fx('shadow', { x: x, y: y, r: 8, c: PV.ink, dur: T }); c.fx('drop', { x: x, y: y, h: 90, sx: -20, head: 'meteor', s: 1, c: PV.mid, c2: PV.pale, d: Math.max(0, T - 0.55), dur: 0.55 }); }, 8); c.sfx('fallWhistle'); },
    beat: function (c) { c.each(function (x, y) { c.fx('shock', { x: x, y: y, r0: 2, r: 14, w: 2, c: PV.pale, dur: 0.3, dust: PV.mid }); c.burst(x, y, [PV.pale, PV.mid, PV.deep], 5, { spd: 30, up: 14, life: 0.35 }); }, 8); c.fx('crack', { x: c.cx, y: c.cy, r: 16, n: 5, c: PV.mid, dur: 1.6 }); c.shake(0.28).boom('meteorHit'); }
  });
  X.reg('fin_end', { tier: 5, cast: function (c) {
    c.fx('shock', { x: c.ux, y: c.uy, r0: 6, r: 120, w: 4, c: PV.mid, dur: 0.7, dust: PV.pale });
    c.fx('shock', { x: c.ux, y: c.uy, r0: 4, r: 90, w: 2, c: PV.pale, dur: 0.6, d: 0.12 });
    c.each(function (x, y) { c.burst(x, y, [PV.mid, PV.deep, PV.pale], 4, { spd: 24, up: 16, life: 0.5 }); }, 10);
    c.wash(PV.deep, 0.1, 0.8).shake(0.45).boom('thunderBig');
  } });
  X.reg('fin_ward', { tier: 4, cast: function (c) {
    c.each(function (x, y) { c.fx('dome', { x: x, y: y, r: 10, c: PV.gold, c2: PV.dawn, dur: 0.9 }); }, 8);
    c.fx('column', { x: c.ux, y: c.uy, w: 8, h: 70, c: PV.dawn, dur: 0.8 }); c.light(c.ux, c.uy, 40, PV.gold, 0.7, 0.8).boom('holy');
  } });
  for (var dz = 0; dz < 4; dz++) X.reg('fin_dusk' + dz, { tier: 2,
    zone: function (c, e) { c.fx('stain', { x: c.cx, y: c.cy, r: 18, a: 0.5, c: PV.ink, c2: PV.mid, n: 6, grow: 1, dur: e.dur || 10 }); },
    zoneTick: function (c) { c.each(function (x, y) { c.burst(x, y, [PV.mid, PV.deep], 1, { spd: 8, up: 10, life: 0.6 }); }, 3); }
  });
}

// ── 모양 (한 번만 · 웹과 앱 같은 CSS 변수) ──
function css() {
  if (document.getElementById('fincss')) return;
  var st = document.createElement('style'); st.id = 'fincss';
  st.textContent = [
    '#finband{position:absolute;left:0;right:0;top:30%;z-index:40;display:flex;justify-content:center;pointer-events:auto;cursor:pointer;animation:finIn .28s ease both}',
    '#finband.out{animation:finOut .22s ease both}',
    '#finband .fbbar{position:relative;width:100%;max-width:560px;box-sizing:border-box;padding:12px 16px 14px;background:linear-gradient(180deg,rgba(14,8,26,.94),rgba(24,12,40,.94));border-top:1px solid #7446ad;border-bottom:1px solid #7446ad;box-shadow:0 0 0 100vmax rgba(6,3,14,.38);text-align:center;overflow:hidden}',
    '#finband.p5 .fbbar{border-color:#f6cf57;background:linear-gradient(180deg,rgba(40,26,14,.94),rgba(24,14,10,.94))}',
    '#finband .fbl{position:absolute;left:-30%;top:0;bottom:0;width:30%;background:linear-gradient(90deg,transparent,rgba(224,200,255,.14),transparent);animation:finSweep 1.1s ease-out .1s both}',
    '#finband.p5 .fbl{background:linear-gradient(90deg,transparent,rgba(255,236,190,.22),transparent)}',
    '#finband .fbe{margin:0;display:flex;align-items:center;justify-content:center;gap:8px;font-family:var(--f-11);font-size:var(--fs-s);color:#c7b6e6;letter-spacing:.12em}',
    '#finband.p5 .fbe{color:#f6dca0}',
    '#finband .fbpips{display:inline-flex;gap:4px}#finband .fbpips i,#boss .finph i{display:inline-block;width:7px;height:7px;border-radius:1px;background:#2a1840;box-shadow:inset 0 0 0 1px #5a3a85}',
    '#finband .fbpips i.done,#boss .finph i.done{background:#7446ad}#finband .fbpips i.on,#boss .finph i.on{background:#e0c8ff;box-shadow:0 0 6px #b48cff}',
    '#finband.p5 .fbpips i.on{background:#f6cf57;box-shadow:0 0 6px #f6cf57}',
    '#finband .fbt{margin:4px 0 2px;font-family:var(--f-11);font-size:calc(var(--fs-m) * 1.7);color:#f3ecff;letter-spacing:.06em;animation:finTitle .5s ease both}',
    '#finband.p5 .fbt{color:#fff3d6}',
    '#finband .fbs{margin:0 0 6px;font-family:var(--f-11);font-size:var(--fs-m);color:#bfb3d6}',
    '#finband .fbln{display:grid;gap:4px;margin-top:6px;text-align:left}',
    '#finband .fbq{margin:0;display:flex;align-items:center;gap:8px;font-family:var(--f-11);font-size:var(--fs-m);color:#efe6d0;opacity:0;animation:finLine .3s ease both;animation-delay:calc(.35s + var(--i) * .55s)}',
    '#finband .fbq b{color:#e0c8ff;white-space:nowrap}#finband.p5 .fbq b{color:#f6cf57}#finband .fbq.nar span{color:#bfb3d6;font-style:italic}',
    '#finband .fbf{flex:none;width:28px;height:28px;display:grid;place-items:center;overflow:hidden}',
    '#finband .fbtime{position:absolute;left:0;bottom:0;height:2px;width:100%;background:#7446ad;transform-origin:left;animation:finTime var(--fd) linear both}#finband.p5 .fbtime{background:#f6cf57}',
    '#finband.calm,#finband.calm *{animation:none!important}#finband.calm .fbq{opacity:1}',
    '#boss .finph{grid-column:1/-1;display:flex;align-items:center;gap:4px;order:-1}#boss .finph small{margin-left:4px;font-family:var(--f-11);font-size:var(--fs-s);color:#c7b6e6}',
    '#boss .bbar{position:relative}#boss .finmk{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#fff3d6;opacity:.85}',
    '#fincount{position:absolute;left:50%;top:120px;z-index:30;transform:translateX(-50%);display:none;min-width:150px;padding:4px 14px 6px;text-align:center;pointer-events:none;background:rgba(14,8,26,.86);border:1px solid #7446ad;border-radius:6px}',
    '#fincount.on{display:block}#fincount small{display:block;font-family:var(--f-11);font-size:var(--fs-s);color:#c7b6e6;letter-spacing:.1em}',
    '#fincount b{display:block;font-family:var(--f-11);font-size:calc(var(--fs-m) * 2.2);line-height:1.1;color:#f3ecff}#fincount span{display:block;font-family:var(--f-11);font-size:var(--fs-s);color:#bfb3d6}',
    '#fincount.hot{border-color:#ff4d6d}#fincount.hot b{color:#ffb0bc}#fincount.tick b{animation:finTick .35s ease both}',
    '@keyframes finIn{from{opacity:0;transform:scaleY(.6)}to{opacity:1;transform:none}}@keyframes finOut{to{opacity:0;transform:scaleY(.7)}}',
    '@keyframes finSweep{to{left:100%}}@keyframes finTitle{from{opacity:0;letter-spacing:.4em}to{opacity:1;letter-spacing:.06em}}@keyframes finLine{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
    '@keyframes finTime{from{transform:scaleX(1)}to{transform:scaleX(0)}}@keyframes finTick{from{transform:scale(1.35)}to{transform:none}}',
    '@media (prefers-reduced-motion: reduce){#finband,#finband *,#fincount b{animation:none!important}#finband .fbq{opacity:1}}'
  ].join('\n');
  document.head.appendChild(st);
}
DS.finUiReady = true;
})();
