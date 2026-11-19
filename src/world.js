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
    npcs: ['들판 한복판 방앗간에 그록 패거리가 눌러앉았다네. 마을이 보수를 걸었지.', '처음엔 다들 보수로 오지요. 어느 집 가솔이 되고 나면 얼굴이 달라지더군요.', '싸움이 끝나도 상처는 저절로 안 나아요. 약초를 챙기거나 교회에 들르세요.'] },
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
    npcs: ['고원 북서쪽 산마을을 요술쟁이가 차지했다네. 사당 불은 아직 켜져 있다지.', '바닥 없는 갱도는 5단은 돼야 들여보냅죠. 층마다 돌 파수꾼이 섰습니다.', '신관이 4단 세이지가 되면 「신속」을 익혀요. 그때부터 싸움이 달라져요.'] },
  coast: { name: '물비늘 해안', theme: 'coast', w: 36, h: 34, seed: 53, L: [25, 36], mobs: ['lizard', 'harpy', 'skelArcher', 'soldier', 'archer'],
    exits: [{ side: 'W', at: 0.45, to: 'stone' }, { side: 'S', at: 0.35, to: 'isle' }, { side: 'E', at: 0.5, to: 'desert' }],
    gates: [{ ids: [8], fx: 0.36, fy: 0.72, icon: 'port' }, { ids: [10], fx: 0.6, fy: 0.2, icon: 'lake' }],
    terr: { forest: 0.7, hill: 0.74, water: 0.66, mount: 0.86 } },
  isle: { name: '가온 섬', theme: 'isle', w: 32, h: 32, seed: 61, L: [29, 42], mobs: ['lizard', 'golem', 'harpy', 'archer', 'soldier'],
    exits: [{ side: 'N', at: 0.35, to: 'coast' }, { side: 'S', at: 0.6, to: 'gaon', tier: 6 }],
    gates: [{ ids: [9], fx: 0.42, fy: 0.26, icon: 'statue' }], border: 'w',
    terr: { forest: 0.62, hill: 0.7, water: 0.74, mount: 0.84 } },
  gaon: { name: '가온', town: true, theme: 'coast', gear: [6, 10], special: true, exits: [{ side: 'N', to: 'isle' }],
    npcs: ['북쪽 하늘을 보게. 저 저녁은 밤이 돼도 안 걷히네. 문이 열려 있다는 뜻일세.', '가온은 6단이 넘은 이만 받습죠. 문 가까이서 싸울 사람만 온다는 뜻입니다.', '7단 Lv10 가문 셋과 맹세의 깃대가 있으면 교회에서 합일해요. 어느 집이든 돼요.'] },
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
DS.PACK = { per: 0.15, base: 3, cap: 2.4, exp: 0.9, gold: 0.9, drop: 0.9 };
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
var WHO = { memo: ['전장 메모'], hero: ['{hero}', 'hero'], herald: ['어스름에 묶인 먼동', 'herald'], far: ['먼 목소리'], dawn: ['옛 대장 먼동', 'elder_mundong'], flag: ['가문의 목소리'] };
// say('cle', '…') → 승려 달래, say('belmar', '…') → 보스 이름, say('memo', '…') → 전장 메모
DS.say = function (who, t) {
  var p = WHO[who];
  if (!p && DS.CAST_NAME[who]) p = [DS.CLASSES[who].name + ' ' + DS.CAST_NAME[who], who];
  if (!p && DS.BOSSES[who]) p = [DS.BOSSES[who].name, who];
  p = p || [who];
  return new Line(p[0], p[1], t);
};
var say = DS.say;

// ───────── 시나리오 ─────────
// 1막(1~10) 보수 · 2막(11~20) 열 가문 · 3막(21~30) 맹세
function T(id, name, zone, boss, L, layout, theme, mobs, reward, intro, outro) {
  return { id: id, name: name, zone: zone, boss: boss, L: L, layout: layout, theme: theme, mobs: mobs, reward: reward || {}, intro: intro, outro: outro,
           tier: id >= 27 ? 9 : id >= 21 ? 8 : 0, diff: (DS.TUNE && DS.TUNE[id]) || 1 };
}
DS.SCENARIOS = [
  T(1, '무너진 방앗간', 'dawn', 'grok', 2, 'village', 'grass', ['goblin', 'gobArcher'], { items: { herb: 3 } },
    ['해밀 위쪽 방앗간에 혹부리 그록 패거리가 눌러앉았다.', '마을이 보수를 걸었다. 풋내기 용병대장의 첫 일감이다.'],
    ['그록이 쓰러지자 패거리는 흩어졌다. 방아가 다시 돈다.', '보수는 적었다. 첫 일감은 원래 그렇다.']),
  T(2, '늑대골 초소', 'dawn', 'shewolf', 5, 'fort', 'highland', ['wolf', 'goblin', 'gobArcher'], { join: 'cle' },
    ['북서쪽 늑대골 초소. 잿빛 어미늑대가 무리를 부린다.', '늑대들의 눈빛이 흐리다. 초소 안에 승려 하나가 갇혀 있다고 한다.'],
    ['창살 안의 승려는 다친 늑대 새끼를 싸매고 있었다.', say('cle', '물린 데부터 봅시다. 늑대는 그다음에요.'), '누렇게 바랜 깃발이 곁에 서자 흰빛이 돌았다. 두 번째 깃발.']),
  T(3, '끓는 고개', 'windy', 'bargan', 8, 'volcano', 'volcano', ['salamander', 'goblin', 'orc'], { join: 'arc' },
    ['바람재 남서쪽 끓는 고개. 불목 거인 바르간이 길을 막았다.', '고갯마루 파수막에 사수 하나가 버틴다. 화살이 떨어져 간다.', say('memo', '용암 위에 오래 서 있으면 탄다. 지나가기만 할 것.')],
    ['파수막의 사수는 화살 세 대를 남기고 있었다.', say('arc', '늦었군. 세 대면 나 혼자서도 됐는데.'), '궁병 솔개. 풀빛이 돌아온 깃발이 세 번째로 섰다.']),
  T(4, '통행세 다리', 'windy', 'heron', 11, 'shore', 'grass', ['wolf', 'orc', 'harpy'], { join: 'cav' },
    ['말몰이꾼 헤론이 바람재 다리를 막고 통행세를 걷는다.', '돈이 없어 말을 빼앗긴 기병 하나가 다리목에 앉아 있다.', say('memo', '다리는 좁다. 양옆 여울로 돌아가는 길도 있다.')],
    ['헤론의 마구간에서 말 한 필이 제 주인을 알아보았다.', say('cav', '빚을 졌군. 갚을 때까지 같이 가지.'), '기병 우레. 금빛 깃발, 네 번째.']),
  T(5, '울림 바위', 'stone', 'tormak', 15, 'field', 'highland', ['orc', 'harpy', 'gobArcher'], { join: 'mag', alt: 'inf' },
    ['돌마루 고원 한복판. 뿔거인 토르막이 바위를 쳐 땅을 울린다.', '멀찍이 바위 위에 구경꾼이 하나 앉아 있다. 달아나지도 않는다.', say('memo', '붉게 물든 칸은 곧 내려찍을 자리다. 게이지를 아껴 두었다가 피하라.')],
    ['토르막이 쓰러지자 바위 위의 구경꾼이 내려왔다.', say('mag', '세 번 내려찍고 한 번 쉬더군요. 다 적어 놨어요.'), '법사 슬기. 보랏빛 깃발이 다섯 번째로 섰다.']),
  T(6, '빼앗긴 산마을', 'stone', 'pippin', 19, 'village', 'grass', ['goblin', 'gobArcher', 'darkMage'], { join: 'mon' },
    ['고원 북서쪽 산마을. 요술쟁이 피핀이 사람들을 내쫓고 들어앉았다.', '마을 사당에는 아직 불이 켜져 있다. 누가 지키고 있다.'],
    ['피핀의 졸개들이 달아났다. 사당의 불은 한 번도 꺼지지 않았다.', say('mon', '불만 지키면 되는 줄 알았습니다. 사람이 먼저더군요.'), '신관 등불. 감빛 깃발, 여섯 번째.']),
  T(7, '이끼 낀 사당', 'stone', 'twinsnake', 23, 'hall', 'ruins', ['skeleton', 'lizard', 'darkMage'], { join: 'pike' },
    ['고원 북동쪽 버려진 사당. 머리 둘 달린 구렁이가 똬리를 틀었다.', '문 앞에 창 든 이가 서 있다. 들어가지도 못하고, 떠나지도 않는다.'],
    ['구렁이가 늘어졌다. 벽화에는 열 깃발과, 깃대를 든 사람이 있다.', say('pike', '지키던 문이 비었군. 다음 문까지 같이 간다.'), '창병 서슬. 옥빛 깃발, 일곱 번째.']),
  T(8, '해적 부두', 'coast', 'volko', 27, 'shore', 'coast', ['lizard', 'soldier', 'archer'], { items: { endo: 2 } },
    ['물비늘 해안의 부두를 해적 선장 볼코가 틀어쥐었다.', '가온 섬으로 건너갈 배는 모두 그의 손에 있다.', say('memo', '볼코는 물에 서면 강해진다. 뭍으로 끌어내라.')],
    ['볼코의 깃발이 내려갔다. 부두의 배들이 닻을 올린다.', '선원들이 수군거렸다. 섬 나루의 돌지기가 요즘 사람을 못 알아본다고.']),
  T(9, '석상 나루', 'isle', 'warden', 31, 'field', 'coast', ['golem', 'lizard', 'harpy'], { join: 'mar' },
    ['가온 섬 나루. 길을 지키던 석상 돌지기가 나그네를 치기 시작했다.', '눈에 박힌 푸른 돌이 잿빛으로 바랬다. 뱃사람 하나가 「악!」 소리를 지르며 혼자 맞선다.'],
    ['돌지기가 주저앉았다. 눈의 돌에 푸른빛이 조금 돌아왔다.', say('mar', '악… 스무 해를 경례했는데. 저 영감, 해병 이름도 잊었다는 것이다.'), '해병 너울. 쪽빛 깃발, 여덟 번째.']),
  T(10, '달못', 'coast', 'nuri', 35, 'lake', 'lake', ['lizard', 'harpy', 'skelArcher'], { gear: 'sword.oath' },
    ['해안 북쪽 달못. 못의 정령 누리가 어스름에 빛깔을 잃고 날뛴다.', '이번 일에는 보수를 건 사람이 없다. 그래도 간다.', say('mar', '누리는 길 잃은 배를 뭍까지 밀어 주던 정령이다. 해병은 은인을 패지 않는다. 살살!'), say('memo', '누리도 물에 서면 강해진다. 못 한가운데로 따라 들어가지 말 것.')],
    ['못이 잔잔해졌다. 누리의 물빛이 돌아왔다.', say('nuri', '빛깔이 빠지니 내 못도 낯설었어요. 북쪽에서 누가 자꾸 불렀고요.'), '물 밑에서 검 한 자루가 떠올랐다. 옛 대장이 돌아오면 찾겠다며 맡긴 검.', '못 건너 어둑한 데서 그림자 하나가 돌아섰다. 빛깔 없는 깃발을 든 채.']),
  T(11, '마른 샘', 'desert', 'shara', 39, 'oasis', 'desert', ['scorpion', 'mummy', 'skelArcher'], { join: 'fly' },
    ['붉은 모래 사막의 하나뿐인 샘을 여왕 전갈 샤라가 차지했다.', '샘가 바위에 비병 하나가 내려앉아 있다. 목이 말라 더는 못 난다.'],
    ['샤라가 모래 속으로 꺼졌다. 샘물이 다시 솟는다.', say('fly', '살았다! 하늘 길은 내가 볼게. 저 활 든 사람만 좀 말려 줘.'), say('arc', '안 쏜다. 아직은.'), '비병 제비. 하늘빛 깃발, 아홉 번째.']),
  T(12, '왕의 무덤 앞', 'desert', 'tombbeast', 42, 'desert', 'desert', ['scorpion', 'mummy', 'skelArcher'], { items: { herb: 5 } },
    ['사막 남동쪽, 옛 왕의 무덤. 돌짐승이 문 앞을 지킨다.', '무덤 안에서 밤마다 노랫소리가 샌다. 산 사람의 목소리다.'],
    ['돌짐승이 부서지고 무덤 문이 열렸다.', '노랫소리는 아래에서 올라온다. 자장가다.']),
  T(13, '왕의 무덤 속', 'desert', 'king', 45, 'hall', 'tomb', ['mummy', 'skeleton', 'darkMage'], { join: 'sha' },
    ['무덤 깊은 곳. 잠 못 드는 왕이 관 위에 앉아 있다.', '그 곁에서 사교 하나가 자장가를 부른다. 목이 다 쉬었다.'],
    ['왕이 누웠다. 사교는 그제야 노래를 그쳤다.', say('sha', '옛 싸움을 본 왕이야. 문 열리는 소리에 깼다더군.'), '사교 그믐. 자줏빛 깃발이 열 번째로 섰다. 열이 모였다.', '모였을 뿐이다. 열을 묶을 깃대는 북쪽 검은 첨탑에 있다.']),
  T(14, '가라앉은 마을', 'mire', 'mire', 49, 'swamp', 'styx', ['ghost', 'skeleton', 'darkPriest'], { items: { mana: 3 } },
    ['안개 수렁. 어스름에 맨 먼저 잠긴 마을이다.', '빛깔을 잃은 사람들은 서로를 잊었다. 원혼이 되어서도 못 알아본다.'],
    ['그림자가 걷혔다. 원혼들이 잠깐 서로를 알아보고 흩어졌다.', say('cle', '못 고치는 것도 있네요. 그래도 알아는 봤으니.')]),
  T(15, '별 보는 탑', 'mire', 'orbel', 52, 'hall', 'styx', ['darkMage', 'gargoyle', 'darkPriest'], {},
    ['가라앉은 마을 한복판, 물 위로 탑 하나만 남았다.', '점성술사 오르벨이 별을 읽어 깃발의 자리를 북쪽에 알려 왔다.', say('memo', '하늘에서 돌이 떨어진다. 붉은 칸이 보이면 흩어져라.')],
    ['탑이 조용해졌다. 별자리 판에 깃발 열 개의 자리가 찍혀 있다.', '북쪽 끝 문 위에도 표시가 하나 있다. 그것만 빛깔이 없다.']),
  T(16, '까마귀 벌판', 'mire', 'hagen', 55, 'field', 'war', ['darkKnight', 'archer', 'soldier'], {},
    ['까마귀 벌판. 제국의 사냥꾼 대장 하겐이 군세를 벌여 놓았다.', '오르벨이 짚어 준 깃발을 사냥해 온 자다. 병사들은 제 깃발도 잊었다.'],
    ['하겐이 쓰러지자 병사들이 멍하니 무기를 내려놓았다.', say('pike', '적이 아니었군. 깃발을 잊은 것뿐이다.'), '벌판에 바람만 남았다. 북쪽으로 망루가 보인다.']),
  T(17, '구름 위 망루', 'mire', null, 58, 'deck', 'sky', ['harpy', 'gargoyle', 'imp'], { items: { endo: 2, mana: 3 } },
    ['첨탑으로 가는 길목의 망루. 구름 위로 솟아 있다.', '깃발 열이 한자리에 선 것을 보고 날개 달린 것들이 몰려온다.', say('memo', '보스는 없다. 세 차례 습격을 모두 막아라.')],
    ['세 번을 막았다. 망루 꼭대기에 열 깃발이 나란히 섰다.', say('fly', '저기 봐. 첨탑 꼭대기에 깃대가 있어. 천이 없는 깃대.')]),
  T(18, '첨탑 문', 'spire', 'gatekeeper', 61, 'fort', 'nether', ['demon', 'darkMage', 'gargoyle'], {},
    ['검은 첨탑. 원래 맹세의 깃발을 모시던 깃대탑이다.', '돌 문지기가 문을 막고 섰다. 주인이 바뀐 줄은 모른다.'],
    ['문지기가 무너지고 문이 열렸다.', say('pike', '누구 문인지도 모르고 지켰군. 문지기가 할 짓이 아니다.')]),
  T(19, '첨탑 아래층', 'spire', 'basil', 64, 'hall', 'nether', ['demon', 'lizard', 'darkPriest'], {},
    ['첨탑 아래층. 독니 바실이 계단을 감고 있다.', '벽에 옛 깃발지기들의 이름이 새겨져 있다. 마지막 이름은 벨마르.'],
    ['독이 걷히고 위층 계단이 드러났다.', say('sha', '깃발지기가 깃대를 팔았다. 탑이 이 꼴인 까닭이지.')]),
  T(20, '첨탑 꼭대기', 'spire', 'belmar', 68, 'hall', 'palace', ['demon', 'darkKnight', 'imp'], { crest: true },
    ['첨탑 꼭대기. 깃발지기 벨마르가 천 없는 깃대를 쥐고 있다.', say('belmar', '열 깃발을 묶는 깃대다. 어스름이라고 못 묶겠느냐.'), '그는 깃대를 걸고 어스름과 계약했다. 묶인 쪽은 그였다.'],
    ['벨마르가 쓰러졌다. 남은 것은 깃대뿐인 깃발, 「맹세의 깃발」.', say('mon', '매듭 자리가 셋입니다. 키가 같은 깃발만 한 매듭에 묶입니다.'), '옛 열 병과는 서둘렀다. 처진 깃발을 둔 채 묶었다.', '모자란 몫은 대장이 문 안에 남아 몸으로 막았다.', say('far', '묶어 오너라. 열을 셋으로. 나도 그렇게 왔다.'), '이번에는 아무도 두고 가지 않는다. 모두가 7단 Lv10에 오를 때까지.', say('memo', '7단 Lv10 가문 셋을 골라 교회에서 합일한다.')]),
  T(21, '서리 궁', 'ash', 'ilva', 72, 'ice', 'snow', ['iceGolem', 'imp', 'darkPriest'], {},
    ['잿빛 변경. 문을 지키는 값으로 제국이 여섯 성주에게 내준 땅이다.', '여섯은 영지를 어스름에 넘기고 살아남았다. 첫째, 서리 궁의 일바.', say('memo', '일바의 유혹은 틱 게이지를 비운다. 한꺼번에 다가서지 말 것.')],
    ['서리 궁이 녹아내린다. 얼음 속에 변경의 깃발이 얼어 있었다.', say('cle', '얼려서라도 붙들고 싶었던 거겠죠. 바래는 것을.')]),
  T(22, '불가마 성채', 'ash', 'kardan', 74, 'volcano', 'lava', ['salamander', 'demon', 'darkMage'], {},
    ['둘째 성주, 불가마 성채의 카르단.', '바래는 깃발을 불빛으로 붙들겠다며 영지를 통째로 땠다.', say('memo', '카르단은 용암을 밟아도 타지 않는다. 따라 들어가지 말 것.')],
    ['불길이 잦아들었다. 탈 것이 더 남지 않았다.', say('cav', '지킬 것을 태워서 지킨다. 셈이 틀렸군.')]),
  T(23, '썩은 평원', 'ash', 'swarm', 76, 'swamp', 'rot', ['imp', 'demon', 'gargoyle'], {},
    ['셋째 성주는 이름이 없다. 어스름이 이름부터 지웠다.', '썩은 평원의 것들은 그를 파리 떼의 왕이라 부른다.'],
    ['파리 떼가 흩어졌다. 왕관 안쪽에 새긴 이름은 닳아서 읽을 수 없다.', say('sha', '이름 없는 망자는 나도 못 부른다. 그게 가장 깊이 죽는 거야.')]),
  T(24, '협곡 성채', 'ash', 'roen', 77, 'fort', 'canyon', ['darkKnight', 'demon', 'archer'], {},
    ['넷째 성주, 협곡의 대공 로엔. 여섯 가운데 맨 먼저 깃발을 내렸다.', '싸우지 않고 넘긴 덕에 성도 병사도 멀쩡하다. 빛깔만 없다.'],
    ['협곡 성채에 깃발이 다시 올랐다. 올린 것은 대공의 병사들이다.', say('arc', '멀쩡한 성이 제일 보기 흉하군.')]),
  T(25, '역병 성', 'ash', 'morga', 79, 'hall', 'plague', ['skeleton', 'ghost', 'darkPriest', 'demon'], {},
    ['다섯째 성주, 역병 성의 모르가.', '바래도 서로 알아보게 하겠다며 영지 사람 모두에게 같은 병을 옮겼다.', say('memo', '역병은 부대 전체에 독을 건다. 정화와 치유를 아끼지 말 것.')],
    ['역병이 물러갔다. 앓던 이들이 서로 얼굴을 살핀다.', say('mon', '같이 앓는 것과 나란히 서는 것은 다릅니다.')]),
  T(26, '뼈 사막', 'ash', 'bonewyrm', 80, 'desert', 'desert', ['scorpion', 'mummy', 'skelArcher', 'ghost'], { gear: 'lance.wyrm' },
    ['여섯째 성주는 문에 가장 가까운 땅에서 용을 타고 끝까지 버텼다.', '성주는 간데없다. 용은 뼈만 남아서도 뼈 사막을 지킨다.'],
    ['뼈용이 주저앉았다. 여섯 성이 모두 비었다.', '용의 갈비 사이에 창 한 자루가 꽂혀 있었다. 여섯째 성주의 창이다.', say('far', '여섯이 다 졌군. 괜찮다. 문은 내가 지킨다. 예전처럼.'), say('mar', '예전처럼? 저 목소리, 문을 지켜 본 적이 있다는 것인가?')]),
  T(27, '불타는 표석', 'end', 'apostle', 84, 'volcano', 'blood', ['demon', 'salamander', 'darkPriest'], {},
    ['끝의 땅. 문 앞 표석에 꺼지지 않는 불이 있다.', '옛 대장의 부관이 지킨다. 대장이 돌아올 길을 밝힌다며 켠 불이다.', '기다리다 빛깔을 잃었다. 이제는 아무도 못 지나가게 지킨다.'],
    ['표석의 불이 꺼졌다. 재 속에 닳은 휘장 하나가 남았다.', say('pike', '기다리는 것과 지키는 것을 헷갈렸군. 남 일 같지 않다.')]),
  T(28, '얼어붙은 성', 'end', 'glacia', 89, 'ice', 'snow', ['iceGolem', 'ghost', 'darkMage'], {},
    ['어스름은 옛 용 둘을 깨워 문짝 사이에 쐐기처럼 물려 두었다.', '하나는 서리. 문 오른쪽 얼어붙은 성의 글라시아.', say('memo', '서리 숨결은 넓게 퍼진다. 붉은 칸이 보이면 멀리 흩어져라.')],
    ['서리용이 부서졌다. 문짝 하나가 삐걱이며 조금 움직였다.', say('fly', '위에서 보니 문짝이 셋이야. 셋을 다 밀어야 닫히겠는데.')]),
  T(29, '성난 화산', 'end', 'ignar', 94, 'volcano', 'lava', ['salamander', 'demon', 'gargoyle'], {},
    ['다른 쐐기는 불. 문 왼쪽 화산의 용암용 이그나르.', '이놈만 치우면 문 앞까지 길이 열린다.'],
    ['화산이 잠들었다. 쐐기 둘이 빠지자 문짝 셋이 모두 풀렸다.', say('sha', '문 안에 한 사람이 서 있다. 죽지 않았어. 살지도 않았고.')]),
  T(30, '어스름의 문', 'end', 'herald', 99, 'gate', 'nether', ['demon', 'gargoyle', 'ghost', 'darkMage'], {},
    ['어스름의 문. 세 짝 문 한가운데 사도가 서 있다.', '사당 벽화마다 그려진 얼굴이다. 문을 안에서 닫았던 옛 대장, 먼동.', say('herald', '문은 안에서 닫아야 한다. 이번에는 누가 남겠느냐.'), say('hero', '아무도.'), say('memo', '쓰러뜨려도 끝이 아니다. 문 너머의 것이 따라 나온다.')],
    ['강철, 바람, 별. 세 깃발이 문짝 하나씩을 맡아 밖에서 밀었다.', '문이 닫혔다. 안에 남은 사람은 없다.', say('dawn', '밖에서도 닫히는 문이었군. 우리는 키를 못 맞췄던 거야.')])
];
DS.scn = function (id) { return DS.SCENARIOS[id - 1]; };
DS.nextScn = function (save) { for (var i = 0; i < DS.SCENARIOS.length; i++) if (!save.cleared[DS.SCENARIOS[i].id]) return DS.SCENARIOS[i]; return null; };
// 5번은 주인공의 병과에 따라 합류하는 이가 다르다 (보상의 join / alt). 규칙은 그대로 두고, 맺음 글만 맞는 쪽을 내준다.
(function (s) {
  var base = s.outro;
  s.outroAlt = ['토르막이 쓰러지자 바위 위의 구경꾼이 내려왔다.', say('inf', '법사가 맨 앞에 서다니. 보다 못해 내려왔다.'), '보병 바우. 푸른 깃발이 다섯 번째로 섰다.'];
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
    wall || null, ['갱도지기가 무너졌다. 아래로 가는 길이 드러났다.']);
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
  var TE = !s.pit && !s.gen && DS.TUNE_E && DS.TUNE_E[s.id];      // 4.0 (⑫-3): 판마다 적의 체력·공격을 따로 (1~10 은 덜 아프게·조금 더 길게)
  var mk = function (type, o) { o = o || {}; o.diff = diff; if (TE) { o.hm = TE[0]; o.am = TE[1]; } if (s.xk && s.xk !== 1) o.expMul = (o.expMul == null ? 1 : o.expMul) * s.xk; if (s.pit) o.xpK = DS.PIT.xpK; return DS.enemySpec(type, o.L || s.L, o); };      // 2.2.3 갱도: 경험치만 PIT.xpK 배 (키 다지는 곳)
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
    var B = DS.BOSSES[s.boss], guard = Math.min(B.guard, n <= 1 ? 2 : n <= 4 ? 3 : 9) + (s.pitKind === 10 ? 2 : s.pitKind === 5 ? 1 : 0);
    var boss = put(null, 6, 2, 'boss', s.bossK ? { boss: s.boss, L: Math.min(100, s.L + 1), hm: s.bossK[0], am: s.bossK[1] } : { boss: s.boss, L: s.L + 1 }); boss.obj = true;      // 2.2.3: 갱도 수문장 · 밑바닥 층의 갱도지기
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
  if (r.crest) { save.crest = true; out.crest = true; }
  return out;
};
})();
