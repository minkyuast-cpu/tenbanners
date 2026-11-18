// 열 개의 깃발 — r47 들판의 연출: 「기습!」(몰려오는 무리)과 필드 보스(맞선다 / 물러난다)
//   엔진 위의 한 겹: 들판 시뮬레이션(mode 'zone')에 sim.fld 를 달고, 틱마다 굴린다 (Sim.prototype.tick 감싸기).
//   화면 쪽(배너·어두워짐·보스 카드·물러난다 단추)은 DS.fieldFrame 이 게임 루프에서 엔진 사건(fAmb·fBoss)을 읽어 그린다.
//   자동 시험(DS.G.quiet)·자동 브라우저(navigator.webdriver)·설정 「들판 습격」 끔·스무 해 창·마을·시나리오에서는 저절로 일어나지 않는다.
//   시험·디버그: DS.fieldForce('ambush' | 'boss') 는 그 조건을 건너뛴다. 봇: tools/campaign.js 를 FIELD=1 로 (DS.fieldEnter(sim, z, save, { bot: true })).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

// ───────── 손잡이 (모든 값은 여기) ─────────
DS.FIELD = {
  on: true,                      // false = 저절로 일어나는 기습·보스를 모두 끈다 (DS.fieldForce 는 된다)
  webdriver: false,              // true = 자동 브라우저(Playwright)에서도 저절로 (기본은 기존 시험이 흔들리지 않게 끈다)
  minScn: 2,                     // 이 시나리오를 깬 뒤부터 (첫 들판은 배우는 곳)
  ambush: {
    perMin: 0.3,                 // 들판 1분마다 일어날 확률 (걸리면 싸움이 없는 첫 순간에)
    grace: 30,                   // 지역에 들어선 뒤 이 초(게임 시간)는 조용하다
    cd: 150,                     // 한 번 끝난 뒤 다음까지 적어도 이 초
    hpMin: 0.5,                  // 부대 평균 체력이 이보다 낮으면 미룬다 (방금 싸운 부대를 덮치지 않는다)
    perAlly: 0.5,                // 첫 물결의 수 = 살아 있는 우리 유닛(가주+가문원) × 이 값 × 세기
    size: [3, 9], max: 10, grow: 1,    // 물결 하나의 수 (최소·최대), 상한, 다음 물결마다 +grow (2.2.2: 7·8 → 9·10 — 열 넘는 부대에도 사방에서 몰려온다)
    waves3: 6,                   // 우리 유닛이 이만큼 이상이고 레벨이 밀리지 않으면 세 물결 (아니면 둘)
    ring: [6, 9],                // 부대 선두에서 몇 칸 떨어진 곳에서 몰려오는가 (걸어서 닿는 땅)
    gap: 30, rest: 0.25, pre: 0.9,     // 다음 물결: 앞 물결이 rest(25%) 아래로 줄었거나 gap 초가 지나면, pre 초 예고 뒤 (겹쳐 몰려오면 법사가 쓰러졌다)
    first: 0.8,                  // 경보 뒤 첫 물결까지 (실제로는 느려지는 동안)
    lvl: 1, dL: -1, atk: 0.85,   // 적 레벨 = 부대 평균 + dL ± lvl (그 지역 L 범위 안으로) · 공격 배율 (사방에서 한꺼번에 때리니 하나하나는 조금 무르게)
    mobExp: 1,                   // 기습한 적 하나의 경험치 배율 (1 = 보통 들판 적과 같다)
    gold: 0.5, exp: 0.4,         // 다 물리치면: 그 무리가 준 골드·경험치에 이 배율만큼 더 (보너스)
    drop: 1.5, bonusDrop: 3,     // 기습한 적의 드랍 배율 · 마지막 보너스 한 번의 드랍 배율
    merit: 3,                    // 싸우는 가문마다 가문 공훈 (× 2 — 2.2.0: 가솔이 없어 두 몫)
    fade: 4, life: 150,          // 남은 적이 모두 진정한 채 fade 초 → 흩어진다 · 기습 전체 상한
    slow: 0.35, slowMs: 800      // 경보 때 세상이 slow 배로 slowMs(실제 시간) 동안 느려진다 (움직임 줄이기면 없음)
  },
  boss: {
    kills: [40, 70],             // 이번 방문에서 이만큼 쓰러뜨리면 나올 수 있다 (사이에서 굴림)
    perMin: 0.5,                 // 그 뒤 1분마다 나올 확률 (걸리면 싸움이 없고 부대 체력이 hpMin 이상인 첫 순간에)
    hpMin: 0.7,
    dL: 4, dP: 2,                // 레벨 = max(지역 최고 레벨 + dL, 부대 평균 + dP)
    diff: 1,                     // 시나리오 보스와 같은 난이도 계수 (들판 적은 0.72) — 지역마다 FIELD_BOSS[z].k 를 더 곱한다 (시나리오 DS.TUNE 처럼 뒤로 갈수록 세게)
    mul: { hp: 2.5, atk: 2, def: 1.08 },      // 시나리오 보스 배율(BOSSES.mul) 위에 더 — 혼자서 아홉을 상대하니 공격이 세다 (봇 시험: 지역 최고 레벨 부대가 열에 일곱 남짓 이긴다)
    escort: 2,                   // 곁을 지키는 그 지역 몹
    dist: [9, 11],               // 선두에서 몇 칸 떨어져 나타나는가 (보스는 12칸 넘게 떨어지면 진정한다)
    expMul: 1.5, goldMul: 2,     // 쓰러뜨렸을 때 경험치·골드 (보스 기본 ×8·×6 위에)
    grade: 4, drops: 1,          // 높은 굴림 유니크 하나 보장 (2.1.1: 둘째 유니크는 뺐다 — 귀하게)
    merit: 20,                   // 싸우는 가문마다 가문 공훈 (× 2) — 정예 현상금과 같은 무게
    idle: 40, life: 300,         // 맞선 뒤 이 초 동안 아무도 때리지 않으면 / 나타난 지 이 초가 넘고 진정해 있으면 물러간다
    cd: 240,                     // 한 번 끝난 뒤 다음까지
    fleeGold: 0.03, fleeCap: 60, // 물러날 때 잃는 골드: 가진 것의 3%, 단마다 60 까지
    botGap: 0                    // 봇: 부대 평균이 지역 최고 레벨 - botGap 이상이면 맞선다, 아니면 물러난다
  }
};
// 지역마다 하나 (이름은 짧고, 칭호는 그 땅의 주인답게). like = 바탕 몹, sprite·pal = 큰 몸(시나리오 보스와 겹치지 않는 조합)
DS.FIELD_BOSS = {
  dawn:   { name: '늑대왕 외눈',     title: '새벽 들판의 늙은 주인',   like: 'wolf',       k: 0.85, sprite: 'b_beast',   pal: 'stone',    skills: ['b_charge', 'b_pounce', 'b_howl'],
            say: '— 한쪽 눈만으로 우리를 오래 본다.', last: '— 들판 끝을 향해 마지막으로 운다.' },
  windy:  { name: '바위뿔 쿠르간',   title: '바람재를 떠도는 거인',     like: 'orc',        k: 1.1, sprite: 'b_brute',   pal: 'hunter',   skills: ['b_quake', 'b_boulder', 'e_smash'],
            say: '바람이 너희 냄새를 실어 왔다.', last: '바람이… 멎는군.' },
  stone:  { name: '돌파수 무쇠눈',   title: '돌마루 고원의 오래된 파수꾼', like: 'golem',   k: 1.0, mul: { hp: 3.0, atk: 1.3, def: 1.0, res: 1.3 }, sprite: 'b_brute',   pal: 'stone',    skills: ['b_boulder', 'b_quake', 'b_harden'],
            say: '— 이끼 낀 눈이 붉게 켜진다.', last: '— 돌 눈의 불이 천천히 꺼진다.' },
  coast:  { name: '갯구렁 검은비늘', title: '물비늘 해안의 주인',       like: 'lizard',     k: 1.3, sprite: 'b_serpent', pal: 'reaper',   skills: ['b_tide', 'b_venom', 'e_smash'],
            say: '— 썰물 소리에 섞여 비늘이 긁힌다.', last: '— 검은 비늘이 물로 미끄러져 돌아간다.' },
  isle:   { name: '섬지기 이끼바위', title: '가온 섬을 지키던 돌거인',   like: 'golem',      k: 1.1, mul: { hp: 3.0, atk: 1.3, def: 1.0, res: 1.3 }, sprite: 'b_brute',   pal: 'jade',     skills: ['b_quake', 'b_boulder', 'e_smash'],
            say: '섬은… 손님을 받지 않는다.', last: '섬을… 부탁한다.' },
  desert: { name: '모래귀 붉은집게', title: '붉은 모래 밑에 사는 것',   like: 'scorpion',   k: 1.25, sprite: 'b_beast',   pal: 'manti',    skills: ['b_spikes', 'b_charge', 'b_pounce'],
            say: '— 발밑의 모래가 들썩인다.', last: '— 집게를 모래에 박은 채 굳는다.' },
  mire:   { name: '검은물',           title: '안개 수렁의 주인',         like: 'ghost',      k: 1.1, mul: { hp: 3.0, atk: 1.3, def: 1.2, res: 1.1 }, sprite: 'b_brute',   pal: 'specter',  skills: ['b_dark', 'b_scythe', 'e_drain'],
            say: '여기 빠진 것은 다 내 것이다.', last: '물이… 맑아지는구나.' },
  spire:  { name: '잿날개 사냥꾼',   title: '첨탑 기슭의 그림자',       like: 'demon',      k: 1.1, sprite: 'b_demon',   pal: 'mephisto', skills: ['b_cross', 'b_dark', 'e_smash'],
            say: '첨탑이 오늘의 사냥감을 골랐다.', last: '사냥은… 끝나지 않는다.' },
  ash:    { name: '숯불 군주 바하르', title: '잿빛 변경의 화염귀',      like: 'salamander', k: 1.3, sprite: 'b_lord',    pal: 'lava',     skills: ['b_erupt', 'b_quake', 'b_breath'],
            say: '재 위에 발자국을 남긴 자, 누구냐.', last: '불씨는… 남는다.' },
  end:    { name: '재날개',           title: '끝의 땅을 맴도는 늙은 용', like: 'demon',      k: 1.6, sprite: 'b_dragon',  pal: 'plague',   skills: ['b_meteor', 'b_breath', 'b_dark'],
            say: '— 날갯짓 한 번에 재가 하늘을 덮는다.', last: '— 마지막 숨이 재가 되어 흩어진다.' }
};
// 외침 (전투 대사 설정을 따른다). 가볍지만 진지하게 — 가주가 소리친다
DS.FIELD_SAY = {
  amb:      ['진형을 갖춰라!', '등을 맞대라!', '기습이다, 방패 올려!', '사방에서 온다!', '흩어지지 마라!', '깃발 아래로 모여라!'],
  ambMerc:  ['어디서 이렇게 나와!', '숨 돌릴 틈도 없군', '오늘 품삯은 두 배요!', '살아서 술 마십시다!', '이건 계약에 없었는데!'],
  wave:     ['또 온다!', '다음 무리다!', '버텨라, 끝이 보인다', '한 번만 더!'],
  ambWin:   ['다 물리쳤다', '숨 돌려라', '…다들 살아 있나?', '들판이 조용해졌다'],
  boss:     ['저건… 급이 다르다', '물러설 줄도 알아야 한다', '가주들, 판단하라'],
  fight:    ['맞선다! 깃발을 세워라!', '여기서 물러설 수 없다', '열 가문의 이름으로!'],
  bossWin:  ['쓰러졌다… 정말로?', '이 들판의 주인이 바뀌었다', '오늘 일은 노래가 되겠군'],
  flee:     ['물러나라! 뒤를 보지 마라!', '살아야 다음이 있다', '짐은 버려도 된다, 사람은 안 된다!']
};
DS.fieldStats = { ft: 0, cmdDie: 0, mercDie: 0, due: 0, amb: 0, ambWin: 0, ambFade: 0, ambMobs: 0, boss: 0, bossWin: 0, bossFlee: 0, bossLeave: 0, bossFight: 0 };

var F_ = DS.FIELD, A_ = F_.ambush, B_ = F_.boss;
function key(z) { return 'fb_' + z; }
// 보스 표에 싣는다 (enemySpec 이 { boss: key } 로 읽는다). 이야기 글(LORE.boss)의 한마디·마지막 말도
//   mul: 시나리오 보스의 흔한 배율 (그 위에 FIELD.boss.mul 을 한 번 더 곱한다). 돌·망령 몸(무쇠눈·이끼바위·검은물)은 방어를 덜고 공격을 더 — 400초 넘게 끌던 싸움
var BMUL = { hp: 3.6, atk: 1.2, def: 1.3, res: 1.5 };
for (var zid in DS.FIELD_BOSS) {
  var D = DS.FIELD_BOSS[zid];
  if (DS.BOSSES && DS.ENEMIES && DS.ENEMIES[D.like]) DS.BOSSES[key(zid)] = { name: D.name, title: D.title, like: D.like, sprite: D.sprite, pal: D.pal, mul: D.mul || BMUL, skills: D.skills.slice(), guard: 0, field: zid };
  if (DS.LORE) { DS.LORE.boss = DS.LORE.boss || {}; DS.LORE.boss[key(zid)] = { say: D.say, last: D.last }; }
}

function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function nowMs() { return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(); }
function pick(a, r) { return a[Math.floor((r || Math.random)() * a.length)]; }
function lead(sim) { var l = sim.byId[sim.leader]; if (l && !l.dead) return l; var c = sim.cmds(); return c[0] || null; }
function allies(sim) { return sim.units.filter(function (u) { return !u.dead && u.side === 'ally' && (u.role === 'cmd' || u.role === 'merc'); }); }
function hpAvg(sim) { var a = allies(sim), s = 0; a.forEach(function (u) { s += u.hp / (u.mhp || 1); }); return a.length ? s / a.length : 0; }
function partyL(F) { return DS.partyL ? DS.partyL(F.save) : 1; }
function zoneMob(Z, L, r) {      // world.js 의 무리와 같은 고르기: 레벨이 높을수록 목록의 뒤쪽
  var f = clamp((L - Z.L[0]) / Math.max(1, Z.L[1] - Z.L[0]), 0, 1), n = Z.mobs.length;
  return Z.mobs[clamp(Math.round(f * (n - 1) + (r() * 2.4 - 1.2)), 0, n - 1)];
}
// 선두에서 걸어서 닿는 칸 가운데 r0~r1 칸 떨어진 빈 칸들 (돌려주는 목록은 새 배열)
function ring(sim, u, r0, r1) {
  var list = sim.flood(u, 60, 1), w = sim.w, out = [];
  for (var i = 0; i < list.length; i++) { var j = list[i], x = j % w, y = (j - x) / w, d = Math.abs(x - u.x) + Math.abs(y - u.y); if (d >= r0 && d <= r1 && !sim.occ[j] && sim.kind[j] !== 'lava') out.push({ x: x, y: y }); }
  return out;
}
// 서로 멀리 떨어진 k 곳 (몰려오는 방향)
function centers(tiles, k, r) {
  if (!tiles.length) return [];
  var out = [tiles[Math.floor(r() * tiles.length)]];
  while (out.length < k) {
    var best = null, bd = -1;
    tiles.forEach(function (t) { var d = 1e9; out.forEach(function (c) { d = Math.min(d, dist(t, c)); }); d += r() * 2; if (d > bd) { bd = d; best = t; } });
    if (!best || bd < 3) break; out.push(best);
  }
  return out;
}

// ───────── 들판에 들어설 때 ─────────
// o.bot: 봇(화면 없음) — 보스가 나오면 그 자리에서 맞설지 물러날지 정한다
DS.fieldEnter = function (sim, z, save, o) {
  o = o || {};
  if (!sim || sim.mode !== 'zone' || !z || z.town || !DS.ZONES[z.id] || !DS.ZONES[z.id].mobs) { if (sim) sim.fld = null; return null; }
  var r = DS.rng(((sim.seed0 || 7) * 131 + 17) % 2147483646 + 1);
  var F = sim.fld = { zone: z.id, def: DS.ZONES[z.id], save: save, bot: !!o.bot, rnd: o.bot ? r : Math.random, t: 0, kills: 0, n: 0,
    ambNext: A_.grace, bossNext: 0, killGoal: 0, amb: null, boss: null, slowUntil: 0, ambDue: false, bossDue: false };
  F.killGoal = B_.kills[0] + Math.floor(F.rnd() * (B_.kills[1] - B_.kills[0] + 1));
  return F;
};
// 저절로 일어나도 되는가
DS.fieldAuto = function (F) {
  var G = DS.G, s = F.save;
  if (!F_.on || !s) return false;
  if (!F.bot) {
    if (!G || G.quiet || G.ending || G.scn || (G.sim && G.sim.fld !== F)) return false;
    if (!F_.webdriver && typeof navigator !== 'undefined' && navigator.webdriver) return false;
  }
  if (s.opt && s.opt.fev === false) return false;
  if (!(s.cleared && s.cleared[F_.minScn])) return false;
  if (DS.egPassOn && DS.egPassOn(s)) return false;
  return true;
};

// ───────── 기습 ─────────
function ambStart(sim, F) {
  var u = lead(sim); if (!u) return null;
  var Z = F.def, pl = partyL(F), r = F.rnd, al = allies(sim).length;
  var L = clamp(Math.round(pl + A_.dL + (r() * 2 - 1) * A_.lvl), Z.L[0], Z.L[1]);
  var str = clamp(1 + (pl - L) * 0.05, 0.6, 1.35);
  var s0 = clamp(Math.round(al * A_.perAlly * str), A_.size[0], A_.size[1]), W = al >= A_.waves3 && pl >= L ? 3 : 2, sizes = [];
  for (var i = 0; i < W; i++) sizes.push(Math.min(A_.max, s0 + i * A_.grow));
  F.n++;
  var A = F.amb = { id: 'fa' + F.n, L: L, sizes: sizes, w: 0, at: sim.t + A_.first, units: [], cur: [], t0: sim.t, kg: 0, ke: 0, dead: 0, calmT: null, x: u.x, y: u.y };
  DS.fieldStats.amb++;
  sim.emit({ t: 'fAmb', k: 'start', waves: W, n: sizes.reduce(function (a, b) { return a + b; }, 0), L: L });
  return A;
}
function ambWave(sim, F, A) {
  var u = lead(sim); if (!u) return;
  var n = A.sizes[A.w], r = F.rnd, tiles = ring(sim, u, A_.ring[0], A_.ring[1]);
  if (tiles.length < 3) tiles = ring(sim, u, 3, 12);
  var cs = centers(tiles, A.w === 0 ? 3 : 2, r), made = [];
  if (!cs.length) cs = [{ x: u.x, y: u.y }];
  for (var i = 0; i < n; i++) {
    var c = cs[i % cs.length], spec = sim.mk(zoneMob(F.def, A.L, r), { x: c.x, y: c.y, grp: A.id, L: A.L });
    spec.x = c.x; spec.y = c.y; spec.hx = u.x; spec.hy = u.y;      // 집 = 부대가 있던 자리 (들판 적은 집에서 11칸 넘게 끌려가면 진정한다)
    var m = sim.add(spec); if (!m) continue;
    m.atk = Math.round(m.atk * A_.atk); m.mag = Math.round(m.mag * A_.atk); m.exp = Math.round((m.exp || 0) * A_.mobExp);
    m.fa = A.id; m.aggro = true; m.prov = sim.t + 20; m.busy = 0.25 + r() * 0.5; sim.emit({ t: 'aggro', id: m.id });
    made.push(m); A.units.push(m);
  }
  A.cur = made; A.w++; A.at = null; A.pend = null; sim.combat = true;
  DS.fieldStats.ambMobs += made.length;
  sim.emit({ t: 'fAmb', k: 'wave', w: A.w, of: A.sizes.length, n: made.length });
}
function ambEnd(sim, F, A, ok) {
  F.amb = null; F.ambNext = F.t + A_.cd; F.bossNext = Math.max(F.bossNext, F.t + 30);      // 기습 바로 뒤에 보스가 겹쳐 오지 않게
  if (!ok) {
    A.units.forEach(function (m) { if (!m.dead) sim.flee(m); });
    DS.fieldStats.ambFade++;
    sim.emit({ t: 'fAmb', k: 'fade' });
    return;
  }
  var u = lead(sim) || A, gold = Math.round(A.kg * A_.gold), exp = Math.round(A.ke * A_.exp), merit = houseMerit(F, A_.merit);
  DS.fieldStats.ambWin++;
  if (gold || exp) sim.emit({ t: 'reward', exp: exp, gold: gold, L: A.L, x: u.x, y: u.y, type: 'amb', fa: 1, zone: F.zone });      // 엔진의 처치 보상과 같은 길 (골드·경험치·승급·드랍 한 번)
  sim.emit({ t: 'fAmb', k: 'end', gold: gold, exp: exp, kills: A.dead, merit: merit });
}
function ambStep(sim, F, A) {
  if (A.at != null) { if (sim.t >= A.at) ambWave(sim, F, A); return; }
  var alive = A.cur.filter(function (m) { return !m.dead; }).length, all = A.units.filter(function (m) { return !m.dead; });
  if (A.w < A.sizes.length) {
    if (A.pend == null && (alive <= Math.floor(A.sizes[A.w - 1] * A_.rest) || sim.t - A.t0 > A_.gap * A.w + A_.first)) { A.pend = sim.t + A_.pre; sim.emit({ t: 'fAmb', k: 'warn', w: A.w + 1 }); }
    if (A.pend != null && sim.t >= A.pend) ambWave(sim, F, A);
    return;
  }
  if (!all.length) { ambEnd(sim, F, A, A.dead > 0); return; }
  var calm = all.every(function (m) { return !m.aggro; });
  if (calm) { if (A.calmT == null) A.calmT = sim.t; } else A.calmT = null;
  if ((A.calmT != null && sim.t - A.calmT > A_.fade) || sim.t - A.t0 > A_.life) ambEnd(sim, F, A, false);
}

// ───────── 필드 보스 ─────────
function bossSpawn(sim, F) {
  var D = DS.FIELD_BOSS[F.zone], u = lead(sim); if (!D || !u || !DS.BOSSES[key(F.zone)]) return null;
  var Z = F.def, pl = partyL(F), r = F.rnd, L = Math.min(100, Math.max(Z.L[1] + B_.dL, pl + B_.dP));
  var tiles = ring(sim, u, B_.dist[0], B_.dist[1]), en = sim.units.filter(function (e) { return !e.dead && e.side === 'enemy'; });
  var quiet = tiles.filter(function (t) { return sim.pass('foot', t.x, t.y) && !en.some(function (e) { return dist(e, t) <= 3; }); });
  var at = quiet.length ? quiet[Math.floor(r() * quiet.length)] : tiles.length ? tiles[Math.floor(r() * tiles.length)] : null;
  if (!at) return null;
  F.n++;
  var grp = 'fb' + F.n, spec = DS.enemySpec(D.like, L, { boss: key(F.zone), diff: B_.diff * (D.k || 1), x: at.x, y: at.y, grp: grp, zone: F.zone, save: F.save });
  spec.hp = spec.mhp = Math.round(spec.hp * B_.mul.hp); spec.atk = Math.round(spec.atk * B_.mul.atk); spec.mag = Math.round(spec.mag * B_.mul.atk);
  spec.def = Math.round(spec.def * B_.mul.def); spec.res = Math.round(spec.res * B_.mul.def);
  spec.exp = Math.round(spec.exp * B_.expMul); spec.gold = Math.round(spec.gold * B_.goldMul);
  spec.hx = at.x; spec.hy = at.y; spec.fb = 1;
  var b = sim.add(spec); if (!b) return null;
  b.skipT = 1e9;      // 자동 사냥은 맞서기로 정할 때까지 이 보스를 고르지 않는다
  var esc = [];
  for (var i = 0; i < B_.escort; i++) {
    var es = sim.mk(zoneMob(Z, Z.L[1], r), { x: at.x, y: at.y, grp: grp, L: Z.L[1] });
    es.x = at.x; es.y = at.y; es.hx = at.x; es.hy = at.y;
    var e = sim.add(es); if (e) { e.fb = 2; e.skipT = 1e9; esc.push(e); }
  }
  var B = F.boss = { u: b, esc: esc, t0: sim.t, ask: true, fight: false, L: L, hp0: b.hp, hurtT: sim.t, def: D };
  DS.fieldStats.boss++;
  sim.emit({ t: 'fBoss', k: 'in', id: b.id, L: L, pl: pl, esc: esc.length });
  return B;
}
DS.fieldFight = function (sim) {
  var F = sim && sim.fld, B = F && F.boss; if (!B || B.u.dead) return false;
  B.ask = false; B.fight = true; B.hurtT = sim.t;
  [B.u].concat(B.esc).forEach(function (e) { if (!e.dead) { e.skipT = 0; e.calmT = 0; } });
  if (!B.u.dead) { sim.rouse(B.u); B.u.prov = sim.t + 15; }
  DS.fieldStats.bossFight++;
  sim.emit({ t: 'fBoss', k: 'fight', id: B.u.id });
  return true;
};
// 물러날 자리: 마을 쪽 출구의 들머리 (없으면 첫 출구)
DS.fieldSafeSpot = function (sim) {
  var F = sim && sim.fld; if (!F) return null;
  var z = DS.buildZone(F.zone), to = F.save && F.save.town && DS.routeExit ? DS.routeExit(F.zone, F.save.town) : null;
  var ex = z.pois.filter(function (p) { return p.t === 'exit' && p.to === to; })[0] || z.pois.filter(function (p) { return p.t === 'exit'; })[0];
  return ex ? { x: ex.inx, y: ex.iny, poi: ex } : null;
};
// 물러난다: 보스와 호위는 안개 속으로, 성난 적은 모두 진정한다, 골드를 조금 잃는다. 자리를 옮기는 일은 부른 쪽이 (게임: warpTo, 봇: fieldTeleport)
DS.fieldFlee = function (sim) {
  var F = sim && sim.fld, B = F && F.boss; if (!B) return null;
  var sv = F.save, tier = DS.partyTier ? DS.partyTier(sv) : 1, lost = Math.max(0, Math.min(Math.round((sv.gold || 0) * B_.fleeGold), B_.fleeCap * tier));
  sv.gold = Math.max(0, (sv.gold || 0) - lost);
  [B.u].concat(B.esc).forEach(function (e) { if (!e.dead) sim.flee(e); });
  calmAll(sim, 15);
  F.boss = null; F.bossNext = F.t + B_.cd; F.kills = 0; F.ambNext = Math.max(F.ambNext, F.t + 60);
  DS.fieldStats.bossFlee++;
  var spot = DS.fieldSafeSpot(sim);
  sim.emit({ t: 'fBoss', k: 'flee', lost: lost, name: B.def.name, x: spot && spot.x, y: spot && spot.y });
  return { lost: lost, spot: spot, name: B.def.name };
};
function calmAll(sim, s) {
  sim.units.forEach(function (e) { if (!e.dead && e.side === 'enemy' && e.aggro) { e.aggro = false; e.calmT = sim.t + s; e.stuck = 0; sim.emit({ t: 'calm', id: e.id }); } });
  if (sim.tele.length) { sim.tele = sim.tele.filter(function (T) { if (T.u.side === 'enemy') { T.u.casting = null; sim.emit({ t: 'castEnd', tid: T.id, cancel: true }); return false; } return true; }); sim.reDanger(); }
  sim.combat = false; sim.lastHit = sim.t;
}
// 화면 없는 쪽(봇)의 옮기기: 살아 있는 우리 유닛을 (x,y) 둘레로
DS.fieldTeleport = function (sim, x, y) {
  var us = allies(sim).concat(sim.units.filter(function (u) { return !u.dead && u.side === 'ally' && u.role === 'summon'; }));
  us.forEach(function (u) { if (sim.occ[u.y * sim.w + u.x] === u) sim.occ[u.y * sim.w + u.x] = null; });
  us.forEach(function (u) {
    var p = sim.freeNear(x, y, u.mt, 8) || sim.freeNear(x, y, 'foot', 12) || { x: u.x, y: u.y };
    u.x = p.x; u.y = p.y; sim.occ[p.y * sim.w + p.x] = u; u.order = null; u.trail = null; u.holdT = 0; u.busy = 0.2;
    sim.emit({ t: 'move', id: u.id, x: p.x, y: p.y, dur: 0.01 });
  });
};
function bossLeave(sim, F, B) {
  [B.u].concat(B.esc).forEach(function (e) { if (!e.dead && (e === B.u || !e.aggro)) sim.flee(e); });
  F.boss = null; F.bossNext = F.t + B_.cd; F.kills = 0; F.ambNext = Math.max(F.ambNext, F.t + 60);
  DS.fieldStats.bossLeave++;
  sim.emit({ t: 'fBoss', k: 'leave', name: B.def.name });
}
function rosterCats(sv) {
  var o = [];
  DS.charList(sv).forEach(function (c) { var G = DS.CLS_GEAR && DS.CLS_GEAR[c.cls]; if (G) G.w.concat(G.a).forEach(function (k) { if (o.indexOf(k) < 0) o.push(k); }); });
  return o;
}
function giveGear(sv, id, at) {      // loot.js 의 putGear 와 같게: 가방에 넣고, 높은 굴림·전설은 잠그고, 내력(얻은 해·곳)을 남긴다
  var g = DS.gear && DS.gear(id); if (!g) return null;
  sv.gear = sv.gear || {}; sv.gear[id] = (sv.gear[id] || 0) + 1;
  if (g.hi || g.grade >= 5) { if (!sv.lock || typeof sv.lock !== 'object') sv.lock = {}; sv.lock[id] = 1; }
  if (g.grade >= 4) {
    if (!sv.gh || typeof sv.gh !== 'object' || Array.isArray(sv.gh)) sv.gh = {};
    if (!Object.prototype.hasOwnProperty.call(sv.gh, id)) { var r = { h: [], at: String(at || '').slice(0, 24), w: 1 }; try { var y = DS.calNow ? DS.calNow(sv).yr : null; if (y != null) r.y = y; } catch (x) {} sv.gh[id] = r; }
  }
  return { kind: 'gear', id: id, n: 1, grade: g.grade, name: g.name, boss: 1 };
}
function houseMerit(F, per) {
  var sv = F.save, n = 0;
  if (!DS.hAdd || !per) return 0;
  sv.party.forEach(function (id) { var hc = sv.chars[id]; if (!hc || hc.down || hc.vac) return; var p = per * 2; DS.hAdd(sv, hc, p); n += p; });
  return n;
}
function bossDown(sim, F, v) {
  var B = F.boss, sv = F.save, out = [];
  F.boss = null; F.bossNext = F.t + B_.cd; F.kills = 0; F.ambNext = Math.max(F.ambNext, F.t + 60);
  F.killGoal = B_.kills[0] + Math.floor(F.rnd() * (B_.kills[1] - B_.kills[0] + 1));
  if (DS.rollGear && sv) {
    var cats = rosterCats(sv);
    for (var i = 0; i < B_.drops; i++) { var d = giveGear(sv, DS.rollGear({ L: v.L, type: B.def.like, boss: true, cats: cats, grade: i === 0 ? B_.grade : 3 }, F.rnd), B.def.name); if (d) out.push(d); }
  }
  var merit = houseMerit(F, B_.merit);
  DS.fieldStats.bossWin++;
  sim.emit({ t: 'fBoss', k: 'down', id: v.id, name: B.def.name, x: v.x, y: v.y, drops: out, merit: merit, gold: v.gold, exp: v.exp });
}
function bossStep(sim, F, B) {
  var b = B.u;
  if (b.dead) { F.boss = null; return; }      // (flee 로 사라졌다 — 쓰러짐은 kill 이 먼저 다룬다)
  if (b.hp < B.hp0) B.hurtT = sim.t; B.hp0 = b.hp;
  if (b.aggro) B.hurtT = Math.max(B.hurtT, sim.lastHit || 0);
  if (F.bot && B.ask) {      // 봇: 그 자리에서 정한다 — 지역 최고 레벨 이상이면 맞선다
    if (partyL(F) >= F.def.L[1] - B_.botGap) DS.fieldFight(sim);
    else { var r = DS.fieldFlee(sim); if (r && r.spot) DS.fieldTeleport(sim, r.spot.x, r.spot.y); }
    return;
  }
  if (B.ask) return;
  if (!b.aggro && ((B.fight && sim.t - B.hurtT > B_.idle) || sim.t - B.t0 > B_.life)) bossLeave(sim, F, B);
}

// ───────── 틱 ─────────
function step(sim, dt) {
  var F = sim.fld; F.t += dt; DS.fieldStats.ft += dt;
  if (F.amb) ambStep(sim, F, F.amb);
  else if (F.boss) bossStep(sim, F, F.boss);
  if (F.amb || F.boss || sim.result) return;
  // 굴림은 1초마다, 들판에 있는 시간 전체로 (자동 사냥은 거의 늘 싸우고 있다) — 걸리면 「차례」를 걸어 두고, 싸움이 없는 첫 순간에 일어난다
  if (!(F.chk > 0)) {
    F.chk = 1;
    if (!DS.fieldAuto(F)) { F.ambDue = F.bossDue = false; return; }
    if (!F.bossDue && F.kills >= F.killGoal && F.t >= F.bossNext && DS.FIELD_BOSS[F.zone] && F.rnd() < B_.perMin / 60) F.bossDue = true;
    if (!F.ambDue && F.t >= F.ambNext && F.rnd() < A_.perMin / 60) { F.ambDue = true; DS.fieldStats.due++; }
  }
  F.chk -= dt;
  if (sim.combat || !(F.ambDue || F.bossDue) || !lead(sim)) return;
  if (F.bossDue && hpAvg(sim) >= B_.hpMin) { F.bossDue = false; bossSpawn(sim, F); return; }
  if (F.ambDue && !F.bossDue && hpAvg(sim) >= A_.hpMin) { F.ambDue = false; ambStart(sim, F); }
}
// 감싼 함수도 원래 소스를 그대로 내보인다: loot.js 의 engReady 가 엔진 소스(String(P[k]))에서 칸 이름(killGauge·mpRegen …)을 찾아
//   그 옵션을 굴릴지 정한다 — 감싼 겉껍질만 보이면 그 옵션들이 드랍에서 사라졌다 (봇 시험에서 찾았다)
function keepSrc(w, orig) {
  var own = Function.prototype.toString.call(w);
  try { Object.defineProperty(w, 'toString', { value: function () { return String(orig) + '\n' + own; }, configurable: true, writable: true }); } catch (x) {}
  return w;
}
var P = DS.Sim && DS.Sim.prototype;
if (P) {
  var tick0 = P.tick;
  P.tick = keepSrc(function (dt) { tick0.call(this, dt); if (this.fld && !this.result) step(this, dt); }, tick0);
  var up0 = P.update;
  P.update = keepSrc(function (dt) { var F = this.fld; if (F && F.slowUntil && nowMs() < F.slowUntil) dt *= A_.slow; return up0.call(this, dt); }, up0);
  var kill0 = P.kill;
  P.kill = function (v, by) {
    var F = this.fld; if (!F || !v || v.dead) return kill0.call(this, v, by);
    var n = this.ev.length; kill0.call(this, v, by);
    if (v.side === 'ally' && (F.amb || F.boss)) { if (v.role === 'cmd') DS.fieldStats.cmdDie++; else if (v.role === 'merc') DS.fieldStats.mercDie++; }      // 기습·보스 중에 쓰러진 우리 사람 (봇 보고용)
    if (v.side !== 'enemy') return;
    if (!v.summoned) F.kills++;
    if (v.fa || v.fb) for (var i = n; i < this.ev.length; i++) { var e = this.ev[i]; if (e.t === 'reward') { if (v.fa) e.fa = 1; if (v.fb === 1) e.fb = 1; } }
    var A = F.amb; if (A && v.fa === A.id) { A.kg += v.gold || 0; A.ke += v.exp || 0; A.dead++; }
    if (F.boss && v === F.boss.u) bossDown(this, F, v);
  };
  keepSrc(P.kill, kill0);
}
// 기습한 적은 조금 더 잘 떨어뜨린다 (마지막 보너스 한 번은 더). 보너스 한 번은 현상 수배에 세지 않는다
var rd0 = DS.rollDrop;
if (rd0) DS.rollDrop = function (save, e, rnd) {
  var k = e && e.fa ? (e.type === 'amb' ? A_.bonusDrop : A_.drop) : 1;
  if (k === 1 || !DS.DROP) return rd0.apply(this, arguments);
  var m = DS.DROP.mul; DS.DROP.mul = m * k;
  try { return rd0.apply(this, arguments); } finally { DS.DROP.mul = m; }
};
var bh0 = DS.bountyHit;
if (bh0) DS.bountyHit = function (save, e) { if (e && e.type === 'amb') return []; return bh0.apply(this, arguments); };

// ───────── 시험·디버그 ─────────
// DS.fieldForce('ambush' | 'boss') → '' (일어났다) 또는 못 한 까닭
DS.fieldForce = function (kind, sim) {
  sim = sim || (DS.G && DS.G.sim);
  if (!sim || sim.mode !== 'zone') return '들판이 아니다';
  if (!sim.fld && DS.G && DS.G.zone) DS.fieldEnter(sim, DS.G.zone, DS.G.save);
  var F = sim.fld; if (!F) return '들판이 아니다';
  if (F.amb || F.boss) return '이미 벌어지고 있다';
  if (kind === 'boss') return bossSpawn(sim, F) ? '' : '보스가 설 자리가 없다';
  return ambStart(sim, F) ? '' : '선두가 없다';
};

// ═════════ 화면 (게임 루프가 DS.fieldFrame(now, evs) 를 부른다) ═════════
var UI = { sim: null, card: null };
function $(s, r) { return (r || document).querySelector(s); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function calm() { return !!(DS.calmFx && DS.calmFx()); }
function A(n) { if (DS.Audio) DS.Audio.sfx(n); }
function host() { return $('#s-game'); }
function el(id, cls) {
  var h = host(); if (!h) return null;
  var e = document.getElementById(id); if (!e) { e = document.createElement('div'); e.id = id; h.appendChild(e); }
  if (cls != null) e.className = cls;
  return e;
}
function lvT(L) { return DS.lvText ? DS.lvText(L) : 'Lv' + L; }
function josa(w, p) { return DS.josa ? DS.josa(w, p) : w; }
// 외침: 말풍선 (전투 대사 설정을 따른다). who: 'cmd' 가주 · 'merc' 가솔 · 'any'
function shout(kind, who, delay) {
  var G = DS.G, sv = G && G.save; if (!G || !G.view || !G.view.bark || (sv && sv.opt && sv.opt.bark === false)) return;
  var L = DS.FIELD_SAY[kind]; if (!L || !L.length) return;
  setTimeout(function () {
    var sim = G.sim; if (!sim || !sim.fld) return;
    var us = sim.units.filter(function (u) { return !u.dead && u.side === 'ally' && (who === 'merc' ? u.role === 'merc' : who === 'cmd' ? u.role === 'cmd' : (u.role === 'cmd' || u.role === 'merc')) && G.view.onScreen(u.x, u.y); });
    var notSel = us.filter(function (u) { return u.id !== G.sel; }); if (notSel.length) us = notSel;
    if (!us.length) return;
    G.view.bark(pick(us).id, pick(L), 2.2);
  }, delay || 0);
}
function edge(kind) { var e = el('fedge', ''); if (!e) return; void e.offsetWidth; e.className = 'on ' + (kind || '') + (calm() ? ' calm' : ''); clearTimeout(e._t); e._t = setTimeout(function () { e.className = ''; }, 1100); }
function fban(kind, title, sub, ms) {
  var e = el('fban', ''); if (!e) return;
  e.innerHTML = '<div class="fr"><b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
  void e.offsetWidth; e.className = 'on ' + kind + (calm() ? ' calm' : '');
  clearTimeout(e._t); e._t = setTimeout(function () { e.className = 'out ' + kind; e._t = setTimeout(function () { e.className = ''; e.innerHTML = ''; }, 320); }, ms || 1500);
}
function dark(on) {      // 화면만 어둡게 — 위·아래 띠(체력 막대·단추)보다 밑에 깐다 (#cv 바로 뒤)
  var e = document.getElementById('fdark'), h = host(), cv = $('#cv');
  if (!e) { if (!on || !h) return; e = document.createElement('div'); e.id = 'fdark'; if (cv && cv.parentNode === h) h.insertBefore(e, cv.nextSibling); else h.appendChild(e); }
  e.classList.toggle('on', !!on);
}
function bossHud(u, on) {
  var G = DS.G, b = $('#boss'); if (!b) return;
  var btn = $('#fbFlee', b);
  if (!on) { if (btn) btn.remove(); b.classList.remove('fbon'); return; }
  if (G.bossId !== u.id) {
    G.bossId = u.id; G.bossTitle = u.title || ''; G.bossTxt = null; G.bcast = null; G.bossHold = 0;
    b.hidden = false; b.classList.remove('casting');
    $('b', b).textContent = u.name; $('em', b).textContent = G.bossTitle;
    if (DS.layoutInsets) DS.layoutInsets();
  }
  if (!btn) {
    btn = document.createElement('button'); btn.id = 'fbFlee'; btn.className = 'fbflee'; btn.type = 'button'; btn.textContent = '물러난다';
    btn.setAttribute('aria-label', '필드 보스에게서 물러난다');
    btn.addEventListener('click', function (ev) { ev.stopPropagation(); flee(); });
    b.appendChild(btn); b.classList.add('fbon');
  }
}
function bsay(t) { var e = $('#bsay'); if (!e || !t) return; e.textContent = t; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(function () { e.classList.remove('on'); }, 3200); }
function panTo(u) {
  var G = DS.G, me = G.sim && G.sim.byId[G.sel]; if (!G.view || !me || !u) return;
  G.view.pan = { x: (u.x - me.x) * 16 * 0.75, y: (u.y - me.y) * 16 * 0.75 };
}
function cardOff() {
  var G = DS.G, c = UI.card; UI.card = null;
  if (c && c.isConnected) { c.classList.add('out'); setTimeout(function () { c.remove(); }, 200); }
  if (G) { G.hold = Math.max(0, (G.hold || 0) - 1); if (G.view) G.view.pan = { x: 0, y: 0 }; }
  dark(false);
}
function bossCard(sim, e) {
  var tt = $('#toast'); if (tt) tt.classList.remove('on');      // 떠 있던 토스트가 카드 글을 덮지 않게
  var G = DS.G, F = sim.fld, B = F && F.boss; if (!B) return;
  var u = B.u, D = B.def, sv = G.save, pl = e.pl || partyL(F), gap = B.L - pl, tier = DS.partyTier ? DS.partyTier(sv) : 1;
  var lost = Math.min(Math.round((sv.gold || 0) * B_.fleeGold), B_.fleeCap * tier), hunt = !!sim.hunt;
  var c = document.createElement('div'); c.id = 'fbcard'; c.setAttribute('role', 'alertdialog'); c.setAttribute('aria-label', '필드 보스 ' + D.name);
  c.innerHTML = '<small class="fbk">' + (gap >= 6 ? '매우 위험' : '위험') + ' · 필드 보스</small><em class="fbt">' + esc(D.title) + '</em><b class="fbn">' + esc(D.name) + '</b>' +
    '<p class="fbs"><span>적 <b>' + esc(lvT(B.L)) + '</b></span><span>우리 평균 ' + esc(lvT(pl)) + '</span>' + (B.esc.length ? '<span>호위 ' + B.esc.length + '</span>' : '') + '</p>' +
    '<p class="fbw">쓰러진 가주와 가문원은 돌아오지 못한다.</p>' +
    '<div class="fbb"><button class="btn red" id="fbGo" type="button">맞선다</button><button class="btn" id="fbRun" type="button">물러난다</button></div>' +
    '<p class="fbf">물러나면 들머리로 돌아가고 골드를 ' + (lost > 0 ? lost.toLocaleString() : 0) + ' 잃는다' + (hunt ? '. 전체 자동은 멈춰 기다린다' : '') + '</p>';
  host().appendChild(c); UI.card = c; G.hold = (G.hold || 0) + 1;
  var born = nowMs();
  c.querySelector('#fbGo').addEventListener('click', function () { if (nowMs() - born < 450) return; A('ok'); cardOff(); if (DS.fieldFight(sim)) { shout('fight', 'cmd', 200); if (G.view && !calm()) G.view.shake = Math.max(G.view.shake || 0, 0.25); } });
  c.querySelector('#fbRun').addEventListener('click', function () { if (nowMs() - born < 450) return; cardOff(); flee(); });
}
// 물러난다 (보스 카드 · 보스 막대의 단추)
function flee() {
  var G = DS.G, sim = G && G.sim, F = sim && sim.fld; if (!F || !F.boss || G.ending) return false;
  if (UI.card) cardOff();
  var r = DS.fieldFlee(sim); if (!r) return false;
  var spot = r.spot, why = spot && DS.warpTo ? DS.warpTo(G.zone.id, function (p) { return p === spot.poi; }, false, true) : 'x';
  if (why && spot) DS.fieldTeleport(sim, spot.x, spot.y);
  bossHud(null, false); G.bossId = null; var bb = $('#boss'); if (bb) bb.hidden = true; if (DS.layoutInsets) DS.layoutInsets();
  if (DS.Audio) { A('swoosh'); DS.Audio.bgm(DS.Audio.zoneTrack ? DS.Audio.zoneTrack(G.zone) : 'map'); }
  if (DS.ui) DS.ui.toast('물러났다. ' + josa(r.name, '은는') + ' 안개 속으로 사라졌다' + (r.lost ? '. 짐을 버리느라 골드를 ' + r.lost.toLocaleString() + ' 잃었다' : ''), 3600);
  shout('flee', 'cmd', 500);
  if (DS.ui && DS.ui.persist) DS.ui.persist();
  return true;
}
DS.fieldFleeUI = flee;
function onEv(sim, e) {
  var G = DS.G, F = sim.fld, v = G.view;
  if (e.t === 'fAmb') {
    if (e.k === 'start') {
      var zb = $('#banner'); if (zb) zb.classList.remove('on');      // 들어설 때의 지역 배너가 남아 있으면 걷는다
      edge('amb'); fban('amb', '기습!', '사방에서 몬스터가 쏟아진다', 1600);
      A('warn'); setTimeout(function () { A('slam'); }, 160); if (DS.ui && DS.ui.haptic) DS.ui.haptic(40);
      if (v && !calm()) { v.shake = Math.max(v.shake || 0, 0.55); v.flashC = '#d9442b'; v.flashA = Math.max(v.flashA || 0, 0.1); setTimeout(function () { if (v.flashC === '#d9442b') v.flashC = null; }, 700); F.slowUntil = nowMs() + A_.slowMs; }
      shout('amb', 'cmd', 450); shout('ambMerc', 'merc', 1900);
    } else if (e.k === 'warn') { if (DS.vban) DS.vban('wave', e.w + '번째 무리', '또 몰려온다', 1100); A('warn'); shout('wave', 'any', 300); }
    else if (e.k === 'wave') { if (e.w > 1 && v && !calm()) v.shake = Math.max(v.shake || 0, 0.3); }
    else if (e.k === 'end') {
      setTimeout(function () { fban('win', '기습을 물리쳤다', '처치 ' + e.kills + ' · 보너스 G+' + e.gold.toLocaleString() + ' · EXP+' + e.exp.toLocaleString(), 1900); A('slam'); if (DS.Audio && DS.Audio.duck) DS.Audio.duck(5, 1200); }, 350);
      if (e.merit && DS.ui) setTimeout(function () { if (!UI.card) DS.ui.toast('기습을 버텨 냈다. 싸운 가문 공훈 +' + e.merit, 3000); }, 2300);
      shout('ambWin', 'any', 900);
    } else if (e.k === 'fade') { if (DS.ui) DS.ui.toast('기습한 무리가 흩어졌다', 2400); }
  } else if (e.t === 'fBoss') {
    var u = sim.byId[e.id];
    if (e.k === 'in' && u) {
      var zb2 = $('#banner'); if (zb2) zb2.classList.remove('on');
      dark(true); edge('boss'); fban('boss', u.name, '필드 보스 · ' + (u.title || ''), 2200);
      A('bossIn'); if (DS.Audio) DS.Audio.bgm('boss'); if (DS.Audio && DS.Audio.duck) DS.Audio.duck(4, 1600);
      if (v && !calm()) v.shake = Math.max(v.shake || 0, 0.45);
      panTo(u); bossHud(u, true); bsay(DS.FIELD_BOSS[F.zone] && DS.FIELD_BOSS[F.zone].say);
      shout('boss', 'cmd', 600);
      bossCard(sim, e);
    } else if (e.k === 'fight') { if (DS.Audio) DS.Audio.bgm('boss'); }
    else if (e.k === 'down') {
      bossHud(null, false);
      setTimeout(function () { fban('win', e.name + ' 격파', '필드 보스를 쓰러뜨렸다 · 전리품 ' + (e.drops || []).length, 2000); A('rare'); if (DS.Audio && DS.Audio.duck) DS.Audio.duck(6, 1600); if (v && !calm()) v.shake = Math.max(v.shake || 0, 0.35); }, 900);
      (e.drops || []).forEach(function (d, i) {
        if (!v) return; var col = (DS.gearCol && DS.gearCol(d.grade)) || '#f6cf57';
        if (v.lootFx) { try { v.lootFx(e.x, e.y, d.grade, { kind: 'gear', id: d.id, i: i }); } catch (x) {} }
        v.float(e.x, e.y, d.name, col, { dy: -12 - i * 9, life: 2.6, big: true, delay: 0.5 + i * 0.25 });
      });
      var bm = $('#bMenu'); if (bm && e.drops && e.drops.length) bm.classList.add('newdot');
      if (DS.lootCall && e.drops && e.drops.length) DS.lootCall(e.drops, { delay: 2300 });      // 2.1.1: 필드 보스의 유니크를 가운데에 크게
      if (DS.ui) setTimeout(function () { DS.ui.toast(e.name + ' 격파. 전리품 ' + (e.drops || []).map(function (d) { return d.name; }).join(', ') + (e.merit ? ' · 싸운 가문 공훈 +' + e.merit : ''), 4200); }, 2800);
      shout('bossWin', 'any', 1500);
    } else if (e.k === 'leave') { bossHud(null, false); if (DS.ui) DS.ui.toast(josa(e.name, '이가') + ' 들판 저편으로 물러갔다', 3000); }
  }
}
DS.fieldFrame = function (now, evs) {
  var G = DS.G, sim = G && G.sim; if (!sim) return;
  if (UI.sim !== sim) {      // 지역이 바뀌었다: 남은 연출을 걷는다
    UI.sim = sim; if (UI.card) cardOff(); dark(false); var fb = $('#fban'); if (fb) { fb.className = ''; fb.innerHTML = ''; }
    var b = $('#boss'); if (b) { var bt = $('#fbFlee', b); if (bt) bt.remove(); b.classList.remove('fbon'); }
  }
  var F = sim.fld; if (!F) return;
  for (var i = 0; i < evs.length; i++) { var e = evs[i]; if (e.t === 'fAmb' || e.t === 'fBoss') { try { onEv(sim, e); } catch (x) { if (DS.loopErr) DS.loopErr(x, 'field:' + e.t); } } }
  var B = F.boss;
  if (UI.card && (!B || !B.ask)) cardOff();
  if (UI.card && (G.hold || 0) < 1) G.hold = 1;      // 카드가 떠 있는 동안 들판은 멈춰 있다 (다른 창이 닫히며 hold 를 내려도)
  if (B && !B.u.dead) { bossHud(B.u, true); if (B.u.aggro && DS.Audio) DS.Audio.bgm('boss'); }
};
// 설정 줄 (ui.js 설정 탭이 부른다): 「들판 습격」 켬/끔
DS.fieldOptRow = function (o) {
  var on = !o || o.fev !== false;
  return '<div class="row"><div class="tx"><b>들판 습격</b><small>들판에서 가끔 기습과 필드 보스가 나타난다</small></div><button class="btn small' + (on ? ' gold' : '') + '" data-opt="fev">' + (on ? '켬' : '끔') + '</button></div>';
};
})();
