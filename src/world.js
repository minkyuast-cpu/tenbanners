// 열 개의 깃발 — 세계(마을·필드)와 시나리오
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

function vnoise(x, y, sc, s) {
  var gx = x / sc, gy = y / sc, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, H = DS.hash2;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  var a = H(x0, y0, s), b = H(x0 + 1, y0, s), c = H(x0, y0 + 1, s), d = H(x0 + 1, y0 + 1, s);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
function grid(w, h, ch) { var g = []; for (var y = 0; y < h; y++) { g.push([]); for (var x = 0; x < w; x++) g[y].push(ch); } return g; }
function rowsOf(g) { return g.map(function (r) { return r.join(''); }); }
var BLOCK = { M: 1, w: 1, '#': 1, H: 1, p: 1, F: 1, v: 1, L: 0 };

// ───────── 세계 ─────────
// 필드: gates = 시나리오 입구 (ids 는 순서대로 열린다), exits = 이웃 지역
// npcs = 마을 사람의 기본 대사. 진행에 따라 바뀌는 대사는 lore.js 의 DS.LORE.npc 가 내준다
DS.ZONES = {
  haemil: { name: '해밀', town: true, theme: 'grass', gear: [1, 2], exits: [{ side: 'N', to: 'dawn' }],
    npcs: ['들판 한복판 방앗간에 그록 패거리가 눌러앉았다네. 전세 계약서가 있다나.', '맹주 자리를 물려받으셨다면서요. 빚도 같이 왔다던데… 힘내세요.', '싸움이 끝나도 상처는 저절로 안 나아요. 약초를 챙기거나 교회에 들르세요.'] },
  dawn: { name: '새벽 들판', theme: 'grass', w: 32, h: 34, seed: 11, L: [1, 9], mobs: ['slime', 'goblin', 'gobArcher', 'wolf'],
    exits: [{ side: 'S', at: 0.5, to: 'haemil' }, { side: 'E', at: 0.35, to: 'windy' }],
    gates: [{ ids: [1], fx: 0.5, fy: 0.5, icon: 'village' }, { ids: [2], fx: 0.2, fy: 0.22, icon: 'fort' }],
    terr: { forest: 0.6, hill: 0.7, water: 0.76, mount: 0.8 } },
  windy: { name: '바람재 평원', theme: 'meadow', w: 34, h: 32, seed: 23, L: [6, 14], mobs: ['goblin', 'wolf', 'gobArcher', 'orc', 'harpy'],
    exits: [{ side: 'W', at: 0.4, to: 'dawn' }, { side: 'N', at: 0.6, to: 'stone' }],
    gates: [{ ids: [3], fx: 0.3, fy: 0.74, icon: 'volcano' }, { ids: [4], fx: 0.72, fy: 0.42, icon: 'camp' }],
    terr: { forest: 0.66, hill: 0.72, water: 0.8, mount: 0.84 } },
  stone: { name: '돌마루 고원', theme: 'highland', w: 36, h: 34, seed: 37, L: [13, 26], mobs: ['orc', 'harpy', 'skeleton', 'darkMage', 'golem'],
    exits: [{ side: 'S', at: 0.6, to: 'windy' }, { side: 'W', at: 0.6, to: 'dodam' }, { side: 'E', at: 0.45, to: 'coast' }],
    gates: [{ ids: [5], fx: 0.52, fy: 0.62, icon: 'camp' }, { ids: [6], fx: 0.25, fy: 0.2, icon: 'village' }, { ids: [7], fx: 0.8, fy: 0.2, icon: 'temple' }, { dungeon: true, fx: 0.82, fy: 0.8, icon: 'cave' }],
    terr: { forest: 0.68, hill: 0.6, water: 0.84, mount: 0.76 } },
  dodam: { name: '도담', town: true, theme: 'highland', gear: [3, 5], exits: [{ side: 'E', to: 'stone' }],
    npcs: ['고원 북서쪽 산마을이 통째로 요술쟁이 것이 됐다네. 다들 약관을 안 읽었다지.', '바닥 없는 갱도는 5단은 돼야 들여보냅죠. 층마다 돌 파수꾼이 섰습니다.', '카마도 가문 사람은 4단에 오르면 「신속」을 익혀요. 그때부터 싸움이 달라져요.'] },
  coast: { name: '물비늘 해안', theme: 'coast', w: 36, h: 34, seed: 53, L: [25, 36], mobs: ['lizard', 'harpy', 'skelArcher', 'soldier', 'archer'],
    exits: [{ side: 'W', at: 0.45, to: 'stone' }, { side: 'S', at: 0.35, to: 'isle' }, { side: 'E', at: 0.5, to: 'desert' }],
    gates: [{ ids: [8], fx: 0.36, fy: 0.72, icon: 'port' }, { ids: [10], fx: 0.6, fy: 0.2, icon: 'lake' }],
    terr: { forest: 0.7, hill: 0.74, water: 0.66, mount: 0.86 } },
  isle: { name: '가온 섬', theme: 'isle', w: 32, h: 32, seed: 61, L: [29, 42], mobs: ['lizard', 'golem', 'harpy', 'archer', 'soldier'],
    exits: [{ side: 'N', at: 0.35, to: 'coast' }, { side: 'S', at: 0.6, to: 'gaon', tier: 6 }],
    gates: [{ ids: [9], fx: 0.42, fy: 0.26, icon: 'statue' }], border: 'w',
    terr: { forest: 0.62, hill: 0.7, water: 0.74, mount: 0.84 } },
  gaon: { name: '가온', town: true, theme: 'coast', gear: [6, 10], special: true, exits: [{ side: 'N', to: 'isle' }],
    npcs: ['북쪽 하늘을 보게. 저 저녁은 밤이 돼도 안 걷히네. 먼동이 아직 퇴근을 못 했다는 뜻일세.', '가온은 6단은 된 이만 받아요. 문 가까이서 싸울 사람만 온다는 뜻이에요.', '7단 Lv10 가주 셋과 맹세의 깃대가 있으면 교회에서 합일해요. 셋은 서로 다른 가문이어야 해요.'] },
  desert: { name: '붉은 모래 사막', theme: 'desert', base: 'd', w: 36, h: 32, seed: 71, L: [36, 47], mobs: ['scorpion', 'mummy', 'skeleton', 'skelArcher', 'darkMage'],
    exits: [{ side: 'W', at: 0.5, to: 'coast' }, { side: 'E', at: 0.4, to: 'mire' }],
    gates: [{ ids: [11], fx: 0.3, fy: 0.3, icon: 'oasis' }, { ids: [12, 13], fx: 0.62, fy: 0.68, icon: 'pyramid' }],
    terr: { forest: 0.9, hill: 0.62, water: 0.9, mount: 0.8 } },
  mire: { name: '안개 수렁', theme: 'styx', w: 36, h: 34, seed: 83, L: [45, 58], mobs: ['ghost', 'skeleton', 'darkPriest', 'gargoyle', 'darkKnight'],
    exits: [{ side: 'W', at: 0.4, to: 'desert' }, { side: 'N', at: 0.5, to: 'spire' }],
    gates: [{ ids: [14, 15], fx: 0.3, fy: 0.72, icon: 'ruin' }, { ids: [16], fx: 0.68, fy: 0.55, icon: 'camp' }, { ids: [17], fx: 0.78, fy: 0.2, icon: 'fort' }],
    terr: { forest: 0.66, hill: 0.74, water: 0.7, mount: 0.84 }, rough: 's' },
  spire: { name: '검은 첨탑 기슭', theme: 'nether', w: 32, h: 32, seed: 97, L: [56, 70], mobs: ['demon', 'gargoyle', 'darkKnight', 'darkMage', 'ghost'],
    exits: [{ side: 'S', at: 0.5, to: 'mire' }, { side: 'N', at: 0.5, to: 'ash', tier: 8 }],
    gates: [{ ids: [18, 19, 20], fx: 0.5, fy: 0.42, icon: 'tower' }],
    terr: { forest: 0.74, hill: 0.66, water: 0.86, mount: 0.74 } },
  ash: { name: '잿빛 변경', theme: 'blood', w: 40, h: 36, seed: 109, L: [70, 81], mobs: ['demon', 'imp', 'iceGolem', 'salamander', 'darkKnight', 'darkPriest'],
    exits: [{ side: 'S', at: 0.5, to: 'spire' }, { side: 'N', at: 0.5, to: 'end', tier: 9 }],
    gates: [{ ids: [21], fx: 0.15, fy: 0.72, icon: 'icecastle' }, { ids: [22], fx: 0.85, fy: 0.74, icon: 'volcano' }, { ids: [23], fx: 0.3, fy: 0.45, icon: 'ruin' },
            { ids: [24], fx: 0.7, fy: 0.45, icon: 'fort' }, { ids: [25], fx: 0.2, fy: 0.2, icon: 'castle' }, { ids: [26], fx: 0.82, fy: 0.2, icon: 'cave' }],
    terr: { forest: 0.76, hill: 0.68, water: 0.99, mount: 0.78 }, liquid: 'L', lava: 0.8 },
  end: { name: '끝의 땅', theme: 'lava', w: 38, h: 34, seed: 131, L: [82, 100], mobs: ['demon', 'gargoyle', 'ghost', 'darkMage', 'salamander', 'iceGolem'],
    exits: [{ side: 'S', at: 0.5, to: 'ash' }],
    gates: [{ ids: [27], fx: 0.2, fy: 0.7, icon: 'obelisk' }, { ids: [28], fx: 0.8, fy: 0.7, icon: 'icecastle' }, { ids: [29], fx: 0.2, fy: 0.35, icon: 'volcano' }, { ids: [30], fx: 0.5, fy: 0.2, icon: 'portal' }],
    terr: { forest: 0.8, hill: 0.66, water: 0.99, mount: 0.76 }, liquid: 'L', lava: 0.76 }
};
// 세계 지도에서의 위치 (열, 행)
DS.ZONE_POS = { haemil: [0, 5], dawn: [0, 4], windy: [1, 4], stone: [1, 3], dodam: [0, 3], coast: [2, 3], isle: [2, 4], gaon: [2, 5],
                desert: [3, 3], mire: [4, 3], spire: [4, 2], ash: [4, 1], end: [4, 0] };
var OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };

var zcache = {};
// 2.2.2 들판 무리의 크기: 무리 수는 셋이 싸우던 때에 맞춰져 있다 — 싸우는 유닛(가주 + 가문원) 수에 따라 불린다.
//   배율 k = 1 + per × (유닛 − base), 1 ~ cap. 무리 목록을 되풀이해 늘린다 (3마리 → 열 유닛 6 · 열여섯 유닛 7).
//   불어난 만큼 하나하나의 경험치·골드·드랍은 (늘어난 배수)^-0.9 — 무리 전체로는 조금 더 준다 (싸움이 길어진 몫. 봇 12판: 캠페인 6.68 → 6.58시간, 0.8 이면 6.27 · 1.0 이면 6.96)
DS.PACK = { per: 0.2, base: 3, cap: 3, exp: 0.9, gold: 0.9, drop: 0.9 };      // 2.2.7: per 0.15 → 0.2 · cap 2.4 → 3 (들판이 진짜 싸움이게 — tune.js DS.FIELD_EN)
DS.packK = function (n) { var P = DS.PACK; return Math.max(1, Math.min(P.cap, 1 + P.per * ((+n || 0) - P.base))); };
DS.packOf = function (g, n) {
  var P = DS.PACK, len = g.list.length, m = len ? Math.max(len, Math.round(len * DS.packK(n))) : 0, list = [];
  for (var i = 0; i < m; i++) list.push(g.list[i % len]);
  var o = { id: g.id, x: g.x, y: g.y, L: g.L, list: list };
  if (m > len) { var f = m / len; o.ek = Math.pow(f, -P.exp); o.gk = Math.pow(f, -P.gold); o.dk = Math.pow(f, -P.drop); }
  return o;
};
DS.buildZone = function (id) {
  if (zcache[id]) return zcache[id];
  var Z = DS.ZONES[id], z = Z.town ? buildTown(id, Z) : buildField(id, Z);
  z.id = id; z.name = Z.name; z.theme = Z.theme; z.town = !!Z.town; z.def = Z;
  zcache[id] = z;
  return z;
};
function edgePos(side, at, w, h) {
  var a = at == null ? 0.5 : at;
  if (side === 'N') return [Math.round(a * (w - 1)), 0, 0, 1];
  if (side === 'S') return [Math.round(a * (w - 1)), h - 1, 0, -1];
  if (side === 'W') return [0, Math.round(a * (h - 1)), 1, 0];
  return [w - 1, Math.round(a * (h - 1)), -1, 0];
}
function buildField(id, Z) {
  var w = Z.w, h = Z.h, s = Z.seed, base = Z.base || '.', g = grid(w, h, base), T = Z.terr, x, y, rnd = DS.rng(s * 977 + 5);
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    var a = vnoise(x, y, 5, s), b = vnoise(x, y, 7, s + 9), c = vnoise(x, y, 4, s + 17), d = vnoise(x, y, 6, s + 29), ch = base;
    if (b > T.water) ch = Z.liquid || 'w';
    else if (Z.lava && d > Z.lava) ch = 'L';
    else if (a > T.mount) ch = 'M';
    else if (a > T.hill) ch = 'h';
    else if (c > T.forest) ch = Z.rough && d > 0.5 ? Z.rough : 'f';
    if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) ch = Z.border || 'M';
    g[y][x] = ch;
  }
  var pois = [], hub = [Math.round(w / 2), Math.round(h / 2)];
  function road(x, y) { if (x < 0 || y < 0 || x >= w || y >= h) return; g[y][x] = g[y][x] === 'w' ? '=' : (g[y][x] === '=' ? '=' : 'r'); }
  function carve(x0, y0, x1, y1) {
    var x = x0, y = y0, ax = rnd() < 0.5 ? 0 : 1, n = 0;
    road(x, y);
    while ((x !== x1 || y !== y1) && n++ < 400) {
      if (x === x1) ax = 1; else if (y === y1) ax = 0; else if (rnd() < 0.22) ax = 1 - ax;
      if (ax === 0) x += x1 > x ? 1 : -1; else y += y1 > y ? 1 : -1;
      road(x, y);
    }
  }
  Z.exits.forEach(function (e) {
    var p = edgePos(e.side, e.at, w, h), px = p[0], py = p[1], dx = p[2], dy = p[3], tiles = [];
    for (var k = -1; k <= 1; k++) for (var n = 0; n < 3; n++) {
      var tx = px + (dx ? dx * n : k), ty = py + (dy ? dy * n : k);
      if (tx >= 0 && ty >= 0 && tx < w && ty < h) { g[ty][tx] = 'r'; if (n === 0) tiles.push([tx, ty]); }
    }
    var ex = { t: 'exit', to: e.to, side: e.side, x: px, y: py, tiles: tiles, tier: e.tier || 0, inx: px + dx * 3, iny: py + dy * 3 };
    pois.push(ex);
    carve(ex.inx, ex.iny, hub[0], hub[1]);
  });
  (Z.gates || []).forEach(function (G) {
    var gx = Math.max(4, Math.min(w - 5, Math.round(G.fx * (w - 1)))), gy = Math.max(6, Math.min(h - 5, Math.round(G.fy * (h - 1))));
    pois.push({ t: G.dungeon ? 'dungeon' : 'gate', ids: G.ids || [], icon: G.icon, x: gx, y: gy });
    carve(gx, gy + 1, hub[0], hub[1]);
  });
  // 입구 건물과 그 둘레
  pois.forEach(function (p) {
    if (p.t !== 'gate' && p.t !== 'dungeon') return;
    for (var yy = p.y - 3; yy <= p.y + 1; yy++) for (var xx = p.x - 2; xx <= p.x + 2; xx++) {
      if (xx < 1 || yy < 1 || xx >= w - 1 || yy >= h - 1) continue;
      var edge = xx === p.x - 2 || xx === p.x + 2 || yy === p.y - 3 || yy === p.y + 1 || yy === p.y;
      if (edge) { if (BLOCK[g[yy][xx]] || g[yy][xx] === 'L') g[yy][xx] = base; }
      else g[yy][xx] = 'H';
    }
    g[p.y][p.x] = 'r'; g[p.y + 1][p.x] = 'r';
  });
  // 걸어서 닿는 땅 (몬스터는 여기에만 둔다)
  var land = {}, lq = [[pois[0].inx, pois[0].iny]]; land[pois[0].inx + ',' + pois[0].iny] = 1;
  while (lq.length) {
    var lc = lq.pop();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) {
      var lx = lc[0] + dd[0], ly = lc[1] + dd[1], lk = lx + ',' + ly;
      if (lx < 0 || ly < 0 || lx >= w || ly >= h || land[lk] || BLOCK[g[ly][lx]]) return;
      land[lk] = 1; lq.push([lx, ly]);
    });
  }
  // 몬스터 무리
  var gateL = {}; DS.SCENARIOS.forEach(function (sc) { gateL[sc.id] = sc.L; });
  var entry = pois[0], spawns = [], far = 1, tries = 0, want = Math.round(w * h / 105);
  pois.forEach(function (p) { far = Math.max(far, Math.abs(p.x - entry.x) + Math.abs(p.y - entry.y)); });
  while (spawns.length < want && tries++ < 3000) {
    x = 3 + Math.floor(rnd() * (w - 6)); y = 3 + Math.floor(rnd() * (h - 6));
    if (BLOCK[g[y][x]] || g[y][x] === 'L' || g[y][x] === 'r' || g[y][x] === '=' || !land[x + ',' + y]) continue;
    var ok = true;
    pois.forEach(function (p) { var dd = Math.abs(p.x - x) + Math.abs(p.y - y); if (dd < (p.t === 'exit' ? 12 : 9)) ok = false; });
    spawns.forEach(function (o) { if (Math.abs(o.x - x) + Math.abs(o.y - y) < 8) ok = false; });
    if (!ok) continue;
    var dE = Math.abs(x - entry.x) + Math.abs(y - entry.y), f = Math.max(0, Math.min(1, dE / far) - 0.18) / 0.82, L = Math.round(Z.L[0] + (Z.L[1] - Z.L[0]) * f), n = 2 + Math.floor(rnd() * (Z.L[0] < 12 ? 1.5 : 2.4)), list = [];
    var ng = null, nd = 1e9; pois.forEach(function (p) { if (p.t !== 'gate') return; var dd = Math.abs(p.x - x) + Math.abs(p.y - y); if (dd < nd) { nd = dd; ng = p; } });
    if (ng) { var gl = gateL[ng.ids[Math.floor(rnd() * ng.ids.length)]]; L = Math.round(gl - 2 + rnd() * 3.4); f = Math.max(0, Math.min(1, (L - Z.L[0]) / Math.max(1, Z.L[1] - Z.L[0]))); }
    if (dE < 14) L = Math.min(L, Z.L[0] + 2);
    L = Math.max(Z.L[0], Math.min(Z.L[1], L));
    for (var k = 0; k < n; k++) list.push(Z.mobs[Math.max(0, Math.min(Z.mobs.length - 1, Math.round(f * (Z.mobs.length - 1) + (rnd() * 2.4 - 1.2))))]);
    spawns.push({ id: 'g' + spawns.length, x: x, y: y, L: L, list: list });
  }
  return { w: w, h: h, rows: rowsOf(g), pois: pois, spawns: spawns, seed: s };
}
// 마을: 19×17, 가운데 십자 길과 가게들
// r37: 무기점·방어구점이 없어졌다 — 그 자리는 대장간(강화만) 하나와 민가. 장비는 적이 떨어뜨린다
var SHOPS = [['forge', 2, 3], ['house', 6, 3], ['item', 12, 3], ['house', 15, 3], ['merc', 2, 9], ['church', 12, 9], ['house', 6, 9], ['house', 15, 9]];
DS.SHOP_NAME = { forge: '대장간', weapon: '대장간', armor: '대장간', item: '잡화점', merc: '영웅관', church: '교회', house: '민가' };      // weapon·armor: 옛 이름으로 부르는 곳(시험 도구 등)도 대장간으로
function buildTown(id, Z) {
  var w = 19, h = 17, g = grid(w, h, Z.theme === 'coast' ? 'd' : '.'), x, y, pois = [], rnd = DS.rng(id.length * 131 + 7);
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (x === 0 || y === 0 || x === w - 1 || y === h - 1) g[y][x] = 'F';
  for (y = 1; y < h - 1; y++) { g[y][9] = 'r'; }
  for (x = 1; x < w - 1; x++) { g[6][x] = 'r'; g[12][x] = 'r'; }
  SHOPS.forEach(function (S) {
    var bx = S[1], by = S[2];
    for (var yy = by; yy < by + 2; yy++) for (var xx = bx; xx < bx + 3; xx++) g[yy][xx] = 'H';
    g[by + 2][bx + 1] = 'r';
    pois.push({ t: 'shop', kind: S[0], x: bx + 1, y: by + 2, bx: bx, by: by });
  });
  [[5, 14], [13, 14], [3, 7], [16, 13], [11, 2]].forEach(function (p) { g[p[1]][p[0]] = 'f'; });
  g[14][15] = 'w'; g[14][16] = 'w'; g[15][15] = 'w'; g[15][16] = 'w';
  Z.exits.forEach(function (e) {
    var p = e.side === 'N' ? [9, 0, 0, 1] : e.side === 'S' ? [9, h - 1, 0, -1] : e.side === 'E' ? [w - 1, 6, -1, 0] : [0, 6, 1, 0], tiles = [];
    for (var k = -1; k <= 1; k++) { var tx = p[0] + (p[2] ? 0 : k), ty = p[1] + (p[3] ? 0 : k); g[ty][tx] = 'r'; tiles.push([tx, ty]); if (p[2]) g[ty][tx + p[2]] = 'r'; else g[ty + p[3]][tx] = 'r'; }
    pois.push({ t: 'exit', to: e.to, side: e.side, x: p[0], y: p[1], tiles: tiles, tier: 0, inx: p[0] + p[2] * 2, iny: p[1] + p[3] * 2 });
  });
  var spots = [[8, 8], [11, 13], [4, 13], [14, 7]];
  (Z.npcs || []).forEach(function (t, i) { pois.push({ t: 'npc', x: spots[i][0], y: spots[i][1], text: t, look: i }); });
  if (DS.poleInfo && '.d'.indexOf(g[9][10]) >= 0) pois.push({ t: 'npc', kind: 'pole', x: 10, y: 9, look: 0, sprite: 'pole', text: '', label: DS.poleInfo(DS.G && DS.G.save).name, lx: 10, ly: 6.8 });      // 2.6.0: 마을 한가운데의 깃대 — 마을 사람처럼 한 칸을 막고 곁에서 누르면 열린다 (stage.js DS.poleOpen · 20번 전에는 「낡은 깃발」)
  return { w: w, h: h, rows: rowsOf(g), pois: pois, spawns: [], seed: 3 };
}
// 지역에 들어설 때 서는 자리
DS.zoneEntry = function (z, from) {
  var e = z.pois.filter(function (p) { return p.t === 'exit' && p.to === from; })[0] || z.pois.filter(function (p) { return p.t === 'exit'; })[0];
  return { x: e.inx, y: e.iny };
};
// 지역 사이 길 찾기: from → to 로 가려면 어느 출구로?
DS.routeExit = function (from, to) {
  if (from === to) return null;
  var q = [[from, null]], seen = {}; seen[from] = 1;
  while (q.length) {
    var c = q.shift();
    var ex = DS.ZONES[c[0]].exits;
    for (var i = 0; i < ex.length; i++) {
      var n = ex[i].to, first = c[1] || n;
      if (n === to) return first;
      if (!seen[n]) { seen[n] = 1; q.push([n, first]); }
    }
  }
  return null;
};

// ───────── 이야기 줄 ─────────
// 지문은 문자열, 대사는 { w: 화자, c: 초상에 쓸 병과·보스 키, t: 글 }. 글 속의 {hero} 는 화면에서 주인공 이름으로 바꿔 끼운다.
// 화자 표시를 모르는 화면에서도 읽히도록, 줄을 글자로 바꾸면 「화자: 글」이 된다 ({hero} 도 이름으로 바뀐다).
function Line(w, c, t) { this.w = w; if (c) this.c = c; this.t = t; }
Object.defineProperty(Line.prototype, 'toString', { value: function () {
  var nm = (DS.G && DS.G.save && DS.G.save.name) || '대장';
  return ((this.w ? this.w + ': ' : '') + this.t).replace(/\{hero\}/g, nm);
} });
// 열 가문의 가주 열 사람 (이야기 글 안에서만 쓰는 이름 — 화면의 지휘관 이름은 클래스명 그대로다)
DS.CAST_NAME = { inf: '바우', cav: '우레', fly: '제비', mar: '너울', pike: '서슬', arc: '솔개', cle: '달래', mon: '등불', mag: '슬기', sha: '그믐' };
var WHO = { memo: ['전장 메모'], hero: ['{hero}', 'hero'], herald: ['어스름에 묶인 먼동', 'herald'], far: ['문 안의 목소리'], dawn: ['옛 맹주 먼동', 'elder_mundong'], flag: ['가문의 목소리'], chat: ['선대 단톡방'] };      // chat: 떠난 옛 가주들의 훈수 (2.4.0)
// say('cle', '…') → 승려 달래, say('belmar', '…') → 보스 이름, say('memo', '…') → 전장 메모, say('chat', '…') → 선대 단톡방
DS.say = function (who, t) {
  var p = WHO[who];
  if (!p && DS.CAST_NAME[who]) p = [DS.CLASSES[who].name + ' ' + DS.CAST_NAME[who], who];
  if (!p && DS.BOSSES[who]) p = [DS.BOSSES[who].name, who];
  p = p || [who];
  return new Line(p[0], p[1], t);
};
var say = DS.say;

// ───────── 시나리오 ─────────
// 1막(1~10) 물려받은 빚 · 2막(11~20) 지워지는 이름 · 3막(21~30) 넘겨주는 사람들. 도입 · 맺음 글은 story2.js 에 있다 (2.4.0 — 여기에는 판의 틀만)
function T(id, name, zone, boss, L, layout, theme, mobs, reward, intro, outro) {
  return { id: id, name: name, zone: zone, boss: boss, L: L, layout: layout, theme: theme, mobs: mobs, reward: reward || {}, intro: intro, outro: outro,
           tier: id >= 27 ? 9 : id >= 21 ? 8 : 0, diff: (DS.TUNE && DS.TUNE[id]) || 1 };
}
DS.SCENARIOS = [
  T(1, '무너진 방앗간', 'dawn', 'grok', 2, 'village', 'grass', ['goblin', 'gobArcher'], { items: { herb: 3 } }, null, null),
  T(2, '늑대골 초소', 'dawn', 'shewolf', 5, 'fort', 'highland', ['wolf', 'goblin', 'gobArcher'], { join: 'cle' }, null, null),
  T(3, '끓는 고개', 'windy', 'bargan', 8, 'volcano', 'volcano', ['salamander', 'goblin', 'orc'], { join: 'arc' }, null, null),
  T(4, '통행세 다리', 'windy', 'heron', 11, 'shore', 'grass', ['wolf', 'orc', 'harpy'], { join: 'cav' }, null, null),
  T(5, '울림 바위', 'stone', 'tormak', 15, 'field', 'highland', ['orc', 'harpy', 'gobArcher'], { join: 'mag', alt: 'inf' }, null, null),
  T(6, '빼앗긴 산마을', 'stone', 'pippin', 19, 'village', 'grass', ['goblin', 'gobArcher', 'darkMage'], { join: 'mon' }, null, null),
  T(7, '이끼 낀 사당', 'stone', 'twinsnake', 23, 'hall', 'ruins', ['skeleton', 'lizard', 'darkMage'], { join: 'pike' }, null, null),
  T(8, '해적 부두', 'coast', 'volko', 27, 'shore', 'coast', ['lizard', 'soldier', 'archer'], { items: { endo: 2 } }, null, null),
  T(9, '석상 나루', 'isle', 'warden', 31, 'field', 'coast', ['golem', 'lizard', 'harpy'], { join: 'mar' }, null, null),
  T(10, '달못', 'coast', 'nuri', 35, 'lake', 'lake', ['lizard', 'harpy', 'skelArcher'], { gear: 'sword.oath' }, null, null),
  T(11, '마른 샘', 'desert', 'shara', 39, 'oasis', 'desert', ['scorpion', 'mummy', 'skelArcher'], { join: 'fly' }, null, null),
  T(12, '왕의 무덤 앞', 'desert', 'tombbeast', 42, 'desert', 'desert', ['scorpion', 'mummy', 'skelArcher'], { items: { herb: 5 } }, null, null),
  T(13, '왕의 무덤 속', 'desert', 'king', 45, 'hall', 'tomb', ['mummy', 'skeleton', 'darkMage'], { join: 'sha' }, null, null),
  T(14, '가라앉은 마을', 'mire', 'mire', 49, 'swamp', 'styx', ['ghost', 'skeleton', 'darkPriest'], { items: { mana: 3 } }, null, null),
  T(15, '별 보는 탑', 'mire', 'orbel', 52, 'hall', 'styx', ['darkMage', 'gargoyle', 'darkPriest'], {}, null, null),
  T(16, '까마귀 벌판', 'mire', 'hagen', 55, 'field', 'war', ['darkKnight', 'archer', 'soldier'], {}, null, null),
  T(17, '구름 위 망루', 'mire', null, 58, 'deck', 'sky', ['harpy', 'gargoyle', 'imp'], { items: { endo: 2, mana: 3 } }, null, null),
  T(18, '첨탑 문', 'spire', 'gatekeeper', 61, 'fort', 'nether', ['demon', 'darkMage', 'gargoyle'], {}, null, null),
  T(19, '첨탑 아래층', 'spire', 'basil', 64, 'hall', 'nether', ['demon', 'lizard', 'darkPriest'], {}, null, null),
  T(20, '첨탑 꼭대기', 'spire', 'belmar', 68, 'hall', 'palace', ['demon', 'darkKnight', 'imp'], { crest: true }, null, null),
  T(21, '서리 궁', 'ash', 'ilva', 72, 'ice', 'snow', ['iceGolem', 'imp', 'darkPriest'], {}, null, null),
  T(22, '불가마 성채', 'ash', 'kardan', 74, 'volcano', 'lava', ['salamander', 'demon', 'darkMage'], {}, null, null),
  T(23, '썩은 평원', 'ash', 'swarm', 76, 'swamp', 'rot', ['imp', 'demon', 'gargoyle'], {}, null, null),
  T(24, '협곡 성채', 'ash', 'roen', 77, 'fort', 'canyon', ['darkKnight', 'demon', 'archer'], {}, null, null),
  T(25, '역병 성', 'ash', 'morga', 79, 'hall', 'plague', ['skeleton', 'ghost', 'darkPriest', 'demon'], {}, null, null),
  T(26, '뼈 사막', 'ash', 'bonewyrm', 80, 'desert', 'desert', ['scorpion', 'mummy', 'skelArcher', 'ghost'], { gear: 'lance.wyrm' }, null, null),
  T(27, '불타는 표석', 'end', 'apostle', 84, 'volcano', 'blood', ['demon', 'salamander', 'darkPriest'], {}, null, null),
  T(28, '얼어붙은 성', 'end', 'glacia', 89, 'ice', 'snow', ['iceGolem', 'ghost', 'darkMage'], {}, null, null),
  T(29, '성난 화산', 'end', 'ignar', 94, 'volcano', 'lava', ['salamander', 'demon', 'gargoyle'], {}, null, null),
  T(30, '어스름의 문', 'end', 'herald', 99, 'gate', 'nether', ['demon', 'gargoyle', 'ghost', 'darkMage'], {}, null, null)
];
DS.scn = function (id) { return DS.SCENARIOS[id - 1]; };
DS.nextScn = function (save) { for (var i = 0; i < DS.SCENARIOS.length; i++) if (!save.cleared[DS.SCENARIOS[i].id]) return DS.SCENARIOS[i]; return null; };
// 5번은 주인공의 병과에 따라 합류하는 이가 다르다 (보상의 join / alt). 규칙은 그대로 두고, 맺음 글만 맞는 쪽을 내준다.
(function (s) {
  var base = s.outro;
  s.outroAlt = null;      // 글은 story2.js 가 준다 (story.js setScn 이 같은 셈으로 다시 건다)
  Object.defineProperty(s, 'outro', { enumerable: true, configurable: true, get: function () {
    var sv = DS.G && DS.G.save, h = sv && sv.chars && sv.chars[sv.hero], C = h && DS.CLASSES[h.cls], J = DS.CLASSES[s.reward.join];
    return C && J && s.reward.alt && (h.cls === s.reward.join || (C.master && C.fam === J.fam)) ? s.outroAlt : base;
  } });
})(DS.SCENARIOS[4]);
// 바닥 없는 갱도 (2.2.3: 끝없는 층 — 반복해 키를 다지는 곳). 층마다 벽에 옛 광부의 글이 있다 (DS.LORE.pit — 1~10층)
//   적 레벨 = PIT.L0 + PIT.dL × 층 (100 에서 멈춘다) · 세기 = 0.95 × (k0 + dk × 층, 30층까지), 그 위로는 층마다 힘 배율이 곧게 오른다 (1 + over × 넘은 층 — 지수가 아니다. 500층도 유한).
//   경험치는 PIT.xpK 배 (골드 · 드랍은 그대로 — 들판 무리보다 질긴 적을 상대로 들판만큼 키가 자라게, 봇으로 맞춤).
//   5층마다 「수문장 층」(갱도지기가 더 질기고 무리가 하나 더), 10층마다 「밑바닥 층」(더 질기고 세다 · 첫 돌파에 높은 굴림 유니크).
//   지도는 네 틀(hall · fort · gate · hall)을 돌려 쓰고, 층 번호로 씨앗이 달라 기둥·벽 자리가 바뀐다. 적 구성도 층 번호로 (세 묶음씩 돌고, 깊을수록 섞인다)
DS.PIT = { L0: 41, dL: 2, cap: 100, k0: 2.2, dk: 0, over: 0.03, xp: 0.02, xpK: 2.2, gold: [500, 85], boss5: { hp: 1.3, atk: 1.1 }, boss10: { hp: 1.6, atk: 1.2 }, ticketEvery: 25, max: 99999 };      // k0 · dk: 층의 기본 세기 (봇이 닿은 진짜 부대로 재어 권장이 적 레벨 가까이 오게 — 열 가문 · 가문원이 함께 싸우는 2.2 부대 기준)
var PIT_MOBS = [['skeleton', 'golem', 'darkMage'], ['ghost', 'darkKnight', 'darkPriest'], ['demon', 'gargoyle', 'imp'], ['lizard', 'golem', 'skelArcher'], ['mummy', 'scorpion', 'darkMage'], ['iceGolem', 'salamander', 'demon']];
var PIT_LAY = ['hall', 'fort', 'gate', 'hall'], PIT_TH = ['ruins', 'nether', 'blood'];
DS.pitFloor = function (f) { f = Math.round(+f || 1); return Math.max(1, Math.min(DS.PIT.max, isFinite(f) ? f : 1)); };
DS.pitL = function (f) { var P = DS.PIT; f = DS.pitFloor(f); return Math.min(P.cap, P.L0 + P.dL * f); };      // 적 레벨
DS.pitOver = function (f) { var P = DS.PIT; f = DS.pitFloor(f); return Math.max(0, f - Math.ceil((P.cap - P.L0) / P.dL)); };      // 레벨 100 을 넘어선 층 수
DS.pitK = function (f) { return 1 + DS.PIT.over * DS.pitOver(f); };      // 힘 배율 (100 넘은 층)
DS.pitKind = function (f) { f = DS.pitFloor(f); return f % 10 === 0 ? 10 : f % 5 === 0 ? 5 : 0; };      // 0 보통 · 5 수문장 층 · 10 밑바닥 층
DS.pit = function (f) {
  f = DS.pitFloor(f);
  var P = DS.PIT, k = Math.floor((f - 1) / 3), mobs = PIT_MOBS[k % PIT_MOBS.length].slice(), kind = DS.pitKind(f);
  if (f > 18) { var ex = PIT_MOBS[(k + 2) % PIT_MOBS.length].filter(function (m) { return mobs.indexOf(m) < 0; }); if (ex.length) mobs.push(ex[f % ex.length]); }      // 깊을수록 다른 묶음의 하나가 섞인다
  var wall = f <= 10 && DS.LORE && DS.LORE.pit && DS.LORE.pit[f];
  var s = T(100 + f, '바닥 없는 갱도 ' + f + '층', 'stone', 'keeper', DS.pitL(f), PIT_LAY[(f - 1) % PIT_LAY.length], PIT_TH[Math.floor((f - 1) / 3) % PIT_TH.length], mobs, {},
    wall || null, ['갱도지기가 무너졌다. 아래로 가는 길이 드러났다. 바닥은 아직이다.']);
  s.pit = f; s.tier = 5; s.pitKind = kind;
  s.diff = 0.95 * (P.k0 + P.dk * Math.min(f, Math.ceil((P.cap - P.L0) / P.dL))) * DS.pitK(f);
  var B = kind === 10 ? P.boss10 : kind === 5 ? P.boss5 : null;
  s.bossK = B ? [B.hp, B.atk] : null;      // 갱도지기만 (buildScenario)
  s.xk = 1 + P.xp * DS.pitOver(f);      // 100 넘은 층: 경험치·골드도 조금씩 (곧게)
  return s;
};
// 시나리오 보상 골드: 15번까지는 옛 곡선, 그 뒤로는 판마다 SCN_GOLD.step 씩만 오른다 (r12 경제 — 15판 뒤 증가율을 눕힌다)
DS.SCN_GOLD = { knee: 15, step: 200 };
DS.scnGold = function (s) { if (s.pit) return Math.round(DS.PIT.gold[0] + DS.PIT.gold[1] * s.pit); var K = DS.SCN_GOLD, n = Math.min(s.id, K.knee); return Math.round(150 + 60 * Math.pow(n, 1.55)) + Math.max(0, s.id - K.knee) * K.step; };

var SW = 13, SH = 20;
function buildMap(s) {
  var seed = s.id * 37 + 11, rnd = DS.rng(seed), L = s.layout, base = { desert: 'd', oasis: 'd', ice: 'i', moon: '_', hall: '_', deck: 'v', gate: '_' }[L] || '.';
  var g = grid(SW, SH, base), x, y;
  function nz(ch, thr, sc, k, y0, y1) {
    for (var y = (y0 || 0); y <= (y1 == null ? SH - 1 : y1); y++) for (var x = 0; x < SW; x++)
      if (g[y][x] === base && vnoise(x, y, sc, seed + k) > thr) g[y][x] = ch;
  }
  function rect(x0, y0, x1, y1, ch) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < SW && y < SH) g[y][x] = ch; }
  function border(ch) { for (var y = 0; y < SH; y++) { g[y][0] = ch; g[y][SW - 1] = ch; } for (var x = 0; x < SW; x++) g[0][x] = ch; }
  switch (L) {
    case 'field': nz('f', 0.6, 3, 1); nz('h', 0.66, 4, 2); nz('M', 0.8, 3, 3); break;
    case 'fort':
      nz('f', 0.62, 3, 1, 13, 19);
      rect(0, 0, SW - 1, 12, '_'); border('#');
      rect(0, 12, SW - 1, 12, '#'); rect(2, 12, 3, 12, '_'); rect(9, 12, 10, 12, '_');
      rect(0, 5, SW - 1, 5, '#'); rect(5, 5, 7, 5, '_');
      [[3, 8], [9, 8], [3, 10], [9, 10], [6, 9]].forEach(function (p) { g[p[1]][p[0]] = 'p'; });
      break;
    case 'hall': case 'gate':
      border('#');
      for (y = 4; y < 16; y += 4) for (x = 2; x < SW - 1; x += 4) g[y][x] = 'p';
      rect(1, 11, 4, 11, '#'); rect(8, 11, 11, 11, '#'); rect(4, 6, 8, 6, '#');
      if (L === 'gate') { nz('L', 0.66, 3, 4, 7, 15); rect(5, 1, 7, 1, 'p'); }
      break;
    case 'shore':
      nz('f', 0.64, 3, 1, 0, 8); nz('h', 0.7, 3, 2, 0, 8);
      rect(0, 9, SW - 1, 12, 'w'); rect(6, 9, 6, 12, '='); rect(2, 9, 2, 12, '~'); rect(10, 9, 10, 12, '~'); rect(1, 10, 3, 11, '~'); rect(9, 10, 11, 11, '~');
      break;
    case 'lake': nz('w', 0.55, 4, 1, 4, 15); nz('f', 0.66, 3, 2);
      for (y = 4; y <= 15; y++) for (x = 0; x < SW; x++) if (g[y][x] === 'w' && vnoise(x, y, 2, seed + 5) > 0.45) g[y][x] = '~';
      break;
    case 'volcano': nz('L', 0.62, 3, 1, 3, 15); nz('h', 0.68, 4, 2); nz('M', 0.82, 3, 3); break;
    case 'desert': nz('h', 0.64, 4, 1); nz('p', 0.86, 2, 2, 5, 15); if (s.id === 12) { rect(0, 0, SW - 1, 0, '#'); rect(2, 1, 4, 1, '#'); rect(8, 1, 10, 1, '#'); } break;
    case 'oasis': nz('h', 0.7, 4, 1);
      for (y = 6; y <= 12; y++) for (x = 2; x <= 10; x++) { var e = Math.pow((x - 6) / 4.2, 2) + Math.pow((y - 9) / 3.2, 2); if (e < 0.55) g[y][x] = 'w'; else if (e < 0.9) g[y][x] = '~'; else if (e < 1.3 && rnd() < 0.5) g[y][x] = 'f'; }
      break;
    case 'ice': border('#'); nz('w', 0.72, 3, 1, 4, 15); nz('p', 0.84, 2, 2, 4, 15); break;
    case 'swamp': nz('s', 0.6, 3, 1); nz('w', 0.74, 4, 2, 4, 15); nz('f', 0.7, 3, 3); break;
    case 'deck':
      rect(2, 4, 10, 18, '_'); rect(4, 2, 8, 3, '_'); rect(3, 3, 9, 3, '_'); g[7][6] = 'p'; g[13][6] = 'p'; g[10][3] = 'p'; g[10][9] = 'p';
      break;
    case 'moon': nz('h', 0.62, 3, 1); nz('M', 0.78, 3, 2); break;
    case 'village':
      [[2, 12], [9, 13], [2, 7], [9, 8], [3, 3]].forEach(function (p) { rect(p[0], p[1], p[0] + 1, p[1] + 1, 'H'); });
      rect(6, 2, 6, 19, 'r'); rect(1, 10, 11, 10, 'r'); nz('f', 0.7, 3, 1); rect(1, 15, 4, 15, 'F'); rect(8, 15, 11, 15, 'F');
      break;
  }
  // 출발 자리와 보스 자리는 비운다
  var floorCh = base === 'v' ? '_' : base;
  function clr(x, y) { var c = g[y][x]; if ((BLOCK[c] || c === 'L' || c === 's') && !(c === 'p' && L === 'gate')) g[y][x] = floorCh; }
  for (y = 16; y < SH; y++) for (x = 3; x <= 9; x++) clr(x, y);
  for (y = 1; y <= 3; y++) for (x = 4; x <= 8; x++) clr(x, y);
  // 아래에서 위로 반드시 이어지는 길
  x = 6;
  for (y = SH - 2; y >= 2; y--) {
    if (L !== 'deck' && rnd() < 0.3) { var nx = Math.max(2, Math.min(SW - 3, x + (rnd() < 0.5 ? -1 : 1))); open(nx, y + 1); x = nx; }
    if ((L === 'fort') && (y === 12 || y === 5)) { x = y === 12 ? (x < 6 ? 3 : 9) : 6; open(x, y + 1); }
    if ((L === 'hall' || L === 'gate') && (y === 11 || y === 6)) { x = y === 11 ? 6 : (x <= 6 ? 2 : 10); open(x, y + 1); }
    open(x, y);
  }
  function open(x, y) {
    var c = g[y][x];
    if (c === 'w') g[y][x] = L === 'lake' || L === 'oasis' || L === 'swamp' ? '~' : '=';
    else if (BLOCK[c] || c === 'L') g[y][x] = floorCh;
    // 가로로도 한 칸 이어 준다
    if (y < SH - 1 && BLOCK[g[y + 1][x]] && g[y + 1][x] !== undefined) { /* 위 칸에서 처리됨 */ }
  }
  return g;
}
// 길이 이어졌는지 확인하고, 끊겼으면 세로로 뚫는다
function connect(g, sx, sy, tx, ty) {
  var seen = {}, q = [[sx, sy]]; seen[sx + ',' + sy] = 1;
  while (q.length) {
    var c = q.shift(); if (c[0] === tx && c[1] === ty) return true;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
      var nx = c[0] + d[0], ny = c[1] + d[1], k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= SW || ny >= SH || seen[k] || BLOCK[g[ny][nx]]) return;
      seen[k] = 1; q.push([nx, ny]);
    });
  }
  return false;
}
// r44: 대장 병과마다의 초반 배율 (DS.TUNE_C[병과][판] — 예전에는 법사만 DS.TUNE_M). 없으면 0 (시나리오 배율 그대로)
DS.tuneFor = function (heroCls, id) { var T = DS.TUNE_C && DS.TUNE_C[heroCls]; if (!T && heroCls === 'mag') T = DS.TUNE_M; return (T && T[id]) || 0; };
// r44 대열: 시나리오 출발 자리(앞줄부터)를 버티는 힘 순서로 나눠 준다 — 튼튼한 이·도발하는 방패가 앞줄, 멀리 쏘는 이·고치는 이는 뒷줄.
//   첫 가문을 열 병과 가운데 고르면서(궁병·법사·승려 대장) 대장이 늘 맨 앞 가운데에 서서 먼저 쓰러지던 것. 사양의 순서(선두·선택)는 그대로, 자리만 바꾼다.
//   돌려주는 것: specs 와 같은 길이의 [x, y] 목록
DS.frontScore = function (u) {
  if (!u) return 0;
  var D = (+u.def || 0) * 0.6 + (+u.res || 0) * 0.4, e = (+u.mhp || +u.hp || 1) * (1 + D / 80);
  if (u.taunt) e *= 1.6;
  if (u.rng && +u.rng[1] >= 3) e *= 0.55;
  if (u.kite) e *= 0.7;
  if (u.heal || (u.skills || []).some(function (k) { var S = DS.SKILLS[k]; return S && (S.tg === 'ally' || S.side === 'ally') && S.eff && S.eff[0] && S.eff[0].t === 'heal'; })) e *= 0.7;
  return e;
};
DS.formation = function (specs, starts) {
  var ord = specs.map(function (u, i) { return { i: i, f: DS.frontScore(u) }; }).sort(function (a, b) { return b.f - a.f || a.i - b.i; }), out = [];
  ord.forEach(function (o, k) { out[o.i] = starts[k % starts.length]; });
  return out;
};
// 시나리오 전투 준비물: 지형, 적, 출발 자리
DS.buildScenario = function (s, partyN, heroCls, forceDiff) {
  var g = buildMap(s), rnd = DS.rng(s.id * 91 + 3), base = g[18][6], y, n = s.pit ? 12 : s.id;
  if (!connect(g, 6, 18, 6, 2)) for (y = 2; y <= 18; y++) if (BLOCK[g[y][6]]) g[y][6] = g[y][6] === 'w' ? '=' : base;
  var size = n <= 2 ? 2 : n <= 20 ? 3 : 4, nPost = n <= 2 ? 2 : 3, units = [], diff = forceDiff || DS.tuneFor(heroCls, s.id) || s.diff || 1, gi = 0;
  if (!forceDiff && !s.pit && !s.gen && DS.scnHard) diff *= DS.scnHard(s.id);      // 2.2.4: 시나리오는 조금 더 세게 (tune.js DS.HARD)
  var H7 = !forceDiff && !s.pit && !s.gen && DS.scnHard7, BK7 = H7 && DS.bossK7 ? DS.bossK7(s.id) : null;      // 2.2.7: 한 번 더 세게 (tune.js DS.HARD7 · DS.BOSS7)
  var more7 = H7 && n >= DS.HARD7.more && n <= (DS.HARD7.last || 99) ? DS.HARD7.add || 0 : 0;      // 보스 곁의 무리가 이만큼 더 (곁 무리가 없는 30번은 그대로)
  var h7 = H7 ? DS.scnHard7(s.id) : 1, h7p = 1 + (h7 - 1) * (DS.HARD7.post == null ? 1 : DS.HARD7.post);      // 초소 무리(g0 · g1 · g2)는 그 몫의 post 만큼만 — 세기는 보스 싸움에 모은다
  var TE = !s.pit && !s.gen && DS.TUNE_E && DS.TUNE_E[s.id];      // 4.0 (⑫-3): 판마다 적의 체력·공격을 따로 (1~10 은 덜 아프게·조금 더 길게)
  var mk = function (type, o) { o = o || {}; o.diff = diff * (o.grp != null && /^g\d/.test(o.grp) ? h7p : h7); if (TE) { o.hm = (o.hm || 1) * TE[0]; o.am = (o.am || 1) * TE[1]; } if (s.xk && s.xk !== 1) o.expMul = (o.expMul == null ? 1 : o.expMul) * s.xk; if (s.pit) o.xpK = DS.PIT.xpK; return DS.enemySpec(type, o.L || s.L, o); };      // 2.2.3 갱도: 경험치만 PIT.xpK 배 (키 다지는 곳)
  if (s.pitKind) size = 4;      // 2.2.3: 갱도 수문장 · 밑바닥 층은 무리마다 하나 더
  function put(type, x, y, grp, o) { o = o || {}; o.x = x; o.y = y; o.grp = grp; var u = mk(type, o); units.push(u); return u; }
  var posts = [[rnd() < 0.5 ? 4 : 8, 13], [0, 9], [6, 7]]; posts[1][0] = posts[0][0] === 4 ? 8 : 4;
  if (s.layout === 'deck') posts = [[6, 12], [6, 9], [6, 6]];
  var waves = null, objective = { boss: true };
  if (!s.boss) {   // 보스 없는 방어전: 세 차례 습격
    objective = 'all'; waves = [];
    for (var wv = 0; wv < 3; wv++) {
      var list = [];
      for (var k = 0; k < 5 + wv; k++) { var u0 = mk(s.mobs[(k + wv) % s.mobs.length], { x: 2 + ((k * 3 + wv) % 9), y: 3 + (k % 3), grp: 'w' + wv, L: s.L + wv }); list.push(u0); }
      if (wv === 0) list.forEach(function (u) { units.push(u); }); else waves.push({ n: wv + 1, units: list, text: (wv + 1) + '번째 습격!' });
    }
  } else {
    posts.slice(0, nPost).forEach(function (p) {
      var grp = 'g' + (gi++);
      for (var k = 0; k < size; k++) put(s.mobs[Math.floor(rnd() * s.mobs.length)], p[0] + (k % 2 ? 1 : -1) * Math.ceil(k / 2), p[1] + (k > 1 ? 1 : 0), grp, { L: Math.max(1, s.L - 1) });
    });
    var B = DS.BOSSES[s.boss], guard = Math.min(B.guard, n <= 1 ? 2 : n <= 4 ? 3 : 9) + (s.pitKind === 10 ? 2 : s.pitKind === 5 ? 1 : 0) + (B.guard > 0 ? more7 : 0);
    var boss = put(null, 6, 2, 'boss', s.bossK ? { boss: s.boss, L: Math.min(100, s.L + 1), hm: s.bossK[0], am: s.bossK[1] } : BK7 ? { boss: s.boss, L: s.L + 1, hm: BK7[0], am: BK7[1] } : { boss: s.boss, L: s.L + 1 }); boss.obj = true;      // 2.2.3: 갱도 수문장 · 밑바닥 층의 갱도지기
    for (var q = 0; q < guard; q++) put(s.mobs[q % s.mobs.length], 6 + (q % 2 ? 1 : -1) * (1 + Math.floor(q / 2)), 3 + (q % 3 === 2 ? 1 : 0), 'boss', { L: s.L });
  }
  var start = [[6, 17], [4, 17], [8, 17], [6, 18], [5, 18], [7, 18], [4, 18], [8, 18], [5, 19], [7, 19], [6, 19], [3, 18], [9, 18], [5, 17], [7, 17], [3, 17], [9, 17], [4, 19], [8, 19], [3, 19], [9, 19], [6, 16], [5, 16], [7, 16]];      // 2.2.0: 모두 싸운다 — 열 가문 + 가문원까지 (출발 칸 y16~19 · x3~9 는 늘 비워 둔다)
  return { map: rowsOf(g), theme: s.theme, units: units, start: start, objective: objective, waves: waves, mk: mk, seed: s.id * 13 + 1 };
};
// 보상 적용. 돌려주는 값: 화면에 보여 줄 목록
// 2.2.4: 시나리오로 가문이 합류하던 길(DS.joinOf · DS.joinPlan · DS.startSwap)은 걷었다. 보상의 join 은 이제 「처음 깨면 모집권 한 장 더」와 이야기(5번 맺음 글)만 읽는다
// 2.2.4: 처음 깰 때의 영웅 모집권 — 열 번째마다 한 장 + 예전에 가문이 합류하던 시나리오(보상의 join)는 한 장 더 (가문은 이제 영웅관에서만 연다 · 여는 빠르기를 예전과 비슷하게)
DS.JOIN_TICKET = 1;
// 시험 · 시뮬레이션용: 닫힌 가문을 예전 합류 차례(이야기 차례 — 보상의 join · alt)로 n 곳 연다 (가주는 등급 g, 기본 희귀). 돌려주는 것: 연 가문들
DS.houseOpenN = function (save, n, g) {
  var order = []; DS.SCENARIOS.forEach(function (x) { var r = x.reward || {}; [r.join, r.alt].forEach(function (k) { if (k && order.indexOf(k) < 0) order.push(k); }); });
  Object.keys(DS.CLASSES).forEach(function (k) { if (!DS.CLASSES[k].master && order.indexOf(k) < 0) order.push(k); });
  var out = []; order.forEach(function (k) { if (out.length < n && DS.closedCls(save).indexOf(k) >= 0) out.push(DS.houseOpen(save, k, null, g || 3)); });
  return out;
};
DS.scnTickets = function (s) { if (!s || s.pit || s.gen) return 0; return (s.id % (DS.TICKET_EVERY || 10) === 0 ? 1 : 0) + (s.reward && s.reward.join ? (DS.JOIN_TICKET || 0) : 0); };
// 2.2.3 갱도 층을 깼다: 최고 층(save.pitBest) · 지금 층(save.pitCur) · 처음 깬 층이면 보너스 골드(층 골드만큼 한 번 더), PIT.ticketEvery 층마다 처음 깰 때 모집권 한 장
DS.pitClear = function (save, s, out) {
  var f = s.pit, first = f > (+save.pitBest || 0);
  out.first = first; out.pitFirst = first;
  if (first) {
    var bonus = Math.round(DS.scnGold(s) * DS.BAL.gold); save.gold += bonus; out.gold += bonus; out.bonus = bonus;
    if (f % DS.PIT.ticketEvery === 0) { save.tickets = (save.tickets || 0) + 1; out.tickets = 1; }
    save.pitBest = f;
  }
  save.pitCur = f; save.pit = (+save.pitBest || 0) + 1;      // save.pit = 열린 다음 층 (옛 칸 — 글·지도가 읽는다)
  return out;
};
DS.applyClear = function (save, s) {
  var first = !save.cleared[s.id], out = { gold: Math.round(DS.scnGold(s) * (first ? 1 : 0.35) * DS.BAL.gold), joins: [], items: {}, gear: null, first: first, crest: false, tickets: 0 };
  save.gold += out.gold;
  if (s.pit) return DS.pitClear(save, s, out);
  save.cleared[s.id] = (save.cleared[s.id] || 0) + 1;
  if (!first) return out;
  var r = s.reward;
  out.tickets = DS.scnTickets(s); save.tickets = (save.tickets || 0) + out.tickets;      // 2.2.0: 영웅 모집권은 열 번째 시나리오마다 한 장 (r35: 다섯 번째마다) · 2.2.4: 가문이 오던 시나리오(2·3·4·5·6·7·9·11·13)는 처음 깨면 한 장 더
  // 2.2.4: 시나리오를 깨도 가문은 오지 않는다 — 가문은 영웅관에서 그 병과의 영웅이 와야 열린다 (DS.recruitHero · DS.houseOpen). out.joins 는 늘 비어 있다 (옛 결과 창 칸)
  if (r.items) for (var k in r.items) { save.items[k] = (save.items[k] || 0) + r.items[k]; out.items[k] = r.items[k]; }
  if (r.gear && DS.gear(r.gear)) { if (DS.lootPut) DS.lootPut(save, r.gear, { at: s.name }); else save.gear[r.gear] = (save.gear[r.gear] || 0) + 1; out.gear = r.gear; }      // 2.1.0: 정해진 보상 전설 (맹세의 검 · 용뼈 창 — 옛 유물 자리)
  if (r.crest) { out.crest = !save.crest; save.crest = true; }      // 2.3.2: 대가 끊겨 다시 깨도 깃대는 이미 있다 (다시 「얻었다」고 하지 않는다)
  return out;
};
// 2.3.2 대가 끊기면 이야기는 처음으로: 깬 시나리오(save.cleared)를 모두 지운다 — 다음 시나리오 · 지도 표시 · 처음 깬 보상(골드 · 장비 · 모집권)은
//   모두 save.cleared 를 읽으니, 다시 깨면 처음 깬 보상을 또 받는다. 가문 · 사람 · 레벨 · 단 · 장비 · 가방 · 깃대 · 관 · 가계도 · 갱도 기록 · 본 막간(seen)은 그대로.
//   다음 세대의 장(endgame)이 진행 중이었으면 그 장도 닫힌다 (30번 맺음을 다시 보아야 장이 열린다) — 세대 수(eg.gen)는 그대로라 다음에 여는 장은 그다음 대.
//   save.runs = { n: 다시 시작한 수, best: 가장 멀리 간 시나리오 번호, hist: [{ c: 잃은 시나리오 수, top: 가장 뒤 번호, y: 가문력, tm: 플레이 초, g: 닫힌 장의 대(있으면) }] (많아야 20) }
DS.RUNS_MAX = 20;
DS.runsFix = function (r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  var n = Math.max(0, Math.round(+r.n || 0)), best = Math.max(0, Math.min(DS.SCENARIOS.length, Math.round(+r.best || 0)));
  var hist = (Array.isArray(r.hist) ? r.hist : []).filter(function (h) { return h && typeof h === 'object'; }).slice(-DS.RUNS_MAX).map(function (h) {
    var o = { c: Math.max(0, Math.round(+h.c || 0)), top: Math.max(0, Math.round(+h.top || 0)), y: Math.round(+h.y || 0), tm: Math.max(0, Math.round(+h.tm || 0)) }; if (+h.g >= 2) o.g = Math.round(+h.g); return o;
  });
  return n || best || hist.length ? { n: n, best: best, hist: hist } : null;
};
DS.scnTop = function (save) { var t = 0; for (var k in (save && save.cleared) || {}) if (save.cleared[k] && +k > t) t = +k; return t; };
DS.passedEver = function (save) { return !!(save && ((save.cleared && save.cleared[DS.SCENARIOS.length]) || (save.runs && save.runs.best >= DS.SCENARIOS.length))); };      // 맺음(30번)을 한 번이라도 보았는가 (제목 글씨)
DS.lapseRestart = function (save) {
  if (!save) return null;
  var ids = Object.keys(save.cleared || {}).filter(function (k) { return save.cleared[k]; }), top = DS.scnTop(save);
  var R = DS.runsFix(save.runs) || { n: 0, best: 0, hist: [] };
  var h = { c: ids.length, top: top, y: DS.calNow ? DS.calNow(save).yr : 0, tm: Math.round(+save.time || 0) };
  var e = save.eg && typeof save.eg === 'object' ? save.eg : null, wasEg = !!(e && e.on);
  if (wasEg) { h.g = e.gen; e.on = 0; e.c = {}; if (e.call && e.call.used === 0) e.call.used = 2; }      // 진행 중인 장은 닫힌다 (세대 수는 그대로)
  R.n++; R.best = Math.max(R.best, top); R.hist = R.hist.concat([h]).slice(-DS.RUNS_MAX);
  save.runs = R; save.cleared = {};
  if (!DS.ZONES[save.zone]) { save.zone = 'haemil'; save.pos = null; }      // 지역은 시나리오로 잠기지 않는다 (단 경고만) — 엉뚱한 칸만 바로잡는다
  if (!DS.ZONES[save.town] || !DS.ZONES[save.town].town) save.town = 'haemil';
  return { c: ids.length, top: top, run: R.n + 1, best: R.best, eg: wasEg ? h.g : 0 };
};
})();
