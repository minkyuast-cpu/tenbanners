// 열 개의 깃발 — 지형 타일 (16px 픽셀 타일을 코드로 그린다)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

// ───────── 지형 팔레트 ─────────
var BASE = {
  b: '#5d9e58', d: '#4f8a4c', l: '#74b565', road: '#b99a68', roadD: '#a3854f',
  tree: '#2f6b3a', treeL: '#4c9a52', treeD: '#1f4a2a', trunk: '#6f4a2c',
  hill: '#8cc270', hillD: '#447a44', rock: '#8d8a9a', rockL: '#b3b0c0', rockD: '#5f5c6e', snow: '#f1f5f8',
  water: '#3d7fc6', waterL: '#6fb0e6', waterD: '#2f65a6', ford: '#69a9d8',
  floor: '#8b8ea3', floorD: '#6c6f86', floorL: '#9da0b5', wall: '#6b6880', wallL: '#8f8ca6', wallD: '#3f3c52',
  lava: '#d9442b', lavaL: '#ff9a3c', lavaH: '#ffd75e', lavaD: '#7a1f1f',
  swamp: '#4d6b52', swampD: '#3b5245', reed: '#8fb86a', plank: '#a8754a', plankD: '#6f4a2c', ice: '#bfe3f2', iceL: '#e9f7fd', iceD: '#8fc3dc',
  sand: '#dcc48c', sandD: '#c4aa70', sandL: '#eedaa6', sky: '#5aa0e0', skyL: '#dff0ff'
};
function th(o) { var t = {}; for (var k in BASE) t[k] = BASE[k]; for (k in o) t[k] = o[k]; return t; }
var THEMES = {
  grass: th({}),
  desert: th({ b: '#cf9462', d: '#b87c4e', l: '#e2ad7c', sand: '#d49a66', sandD: '#b98052', sandL: '#e8b888', hill: '#dfa878', hillD: '#9a6238',      // r8: 「붉은 모래 사막」 — 노란 모래(해안과 같은 색)에서 붉은 황토로
    tree: '#3a8a5a', treeL: '#5ab57a', rock: '#b08a55', rockL: '#d0aa70', rockD: '#7d5f38', snow: '#e6c888', floor: '#b89a62', floorD: '#96793f', floorL: '#cfb27a', wall: '#8d7040', wallL: '#b39255', wallD: '#54401f', water: '#2f8fa8', waterL: '#6cc6d6', waterD: '#226f86', ford: '#5fb8c8' }),
  tomb: th({ b: '#8a7448', d: '#75603a', l: '#a08a5a', sand: '#b89a62', sandD: '#96793f', sandL: '#cfb27a', floor: '#a89060', floorD: '#86703f', floorL: '#c0a878', wall: '#7d6540', wallL: '#a08555', wallD: '#4a3a22' }),
  sky: th({ b: '#8a6a48', d: '#74573a', l: '#a07f58', floor: '#a47a4e', floorD: '#7d5a36', floorL: '#bd9566', wall: '#6f4a2c', wallL: '#c9a227', wallD: '#3d2616' }),
  moon: th({ b: '#8b8b9c', d: '#77778a', l: '#a2a2b3', floor: '#9494a6', floorD: '#787889', floorL: '#adadbd', hill: '#b9b9c9', hillD: '#5c5c70', rock: '#6e6e82', rockL: '#9a9aae', rockD: '#45455a', snow: '#c9c9d9', wall: '#5c5c70', wallL: '#8a8aa0', wallD: '#2f2f42', sky: '#0c0c1a', skyL: '#ffffff' }),
  lake: th({ b: '#5a9a62', d: '#4c8656', l: '#70b06f' }),
  highland: th({ b: '#8aa05a', d: '#768b4b', l: '#a0b56b', hill: '#b3c77a', hillD: '#667a3f', tree: '#4a7a3a', treeL: '#6a9a4c' }),
  coast: th({ b: '#d9c38a', d: '#c4ac72', l: '#e8d6a2', hill: '#ead9a8', hillD: '#b39a62', tree: '#3a8a5a', treeL: '#5ab57a' }),
  volcano: th({ b: '#5a5058', d: '#4a4149', l: '#6d6168', hill: '#7a6c72', hillD: '#3c3339', tree: '#3a2f33', treeL: '#5a4a4a', rock: '#4f454c', rockL: '#6f6369', rockD: '#322b30', snow: '#ff9a3c' }),
  jungle: th({ b: '#3f7d4c', d: '#33693f', l: '#529660', tree: '#1f5a33', treeL: '#3a8a4a', swamp: '#3f6658', swampD: '#2f5045' }),
  ruins: th({ b: '#4f7f55', d: '#426d49', l: '#629566', floor: '#8e8a7a', floorD: '#6f6b5d', floorL: '#a39f8e', wall: '#6f6a5a', wallL: '#948f7c', wallD: '#403c32' }),
  swamp: th({ b: '#4a5e4a', d: '#3c4d3e', l: '#5d7359', tree: '#2b4034', treeL: '#3f5a45', hill: '#6a8062', hillD: '#33453a', swamp: '#46594e', swampD: '#33443c' }),
  styx: th({ b: '#454a66', d: '#383c55', l: '#565c7c', tree: '#2a2d44', treeL: '#3f4463', water: '#27455e', waterL: '#3f7088', waterD: '#1b3246', ford: '#3b6a84', floor: '#6a6e8c', floorD: '#51556f', floorL: '#7c80a0', swamp: '#3c4660', swampD: '#2d3550' }),
  canyon: th({ b: '#9a7b57', d: '#836644', l: '#b08f67', hill: '#c2a077', hillD: '#6f5335', rock: '#7d5f43', rockL: '#a07f5c', rockD: '#553e2a', snow: '#c9a67c' }),
  nether: th({ b: '#3e3554', d: '#322a45', l: '#4c4266', floor: '#5a5173', floorD: '#463e5c', floorL: '#6a6085', wall: '#4a3f66', wallL: '#6a5c8c', wallD: '#241d38', hill: '#756a94', hillD: '#3a3152' }),
  lava: th({ b: '#4a3340', d: '#3c2833', l: '#5a404e', floor: '#5c4450', floorD: '#48343f', floorL: '#6d5260', wall: '#523540', wallL: '#75505c', wallD: '#2a1a22' }),
  rot: th({ b: '#5e5a3a', d: '#4d4a2e', l: '#736e48', tree: '#3a3a24', treeL: '#575534', hill: '#807a50', hillD: '#444127', swamp: '#565c36', swampD: '#42472a', floor: '#6b6648', floorD: '#555138', floorL: '#7d7858', wall: '#4d4a33', wallL: '#6d6949', wallD: '#2a281a' }),
  snow: th({ b: '#dfe8f0', d: '#c5d2df', l: '#f4f8fb', tree: '#4a7a6a', treeL: '#e9f2f5', hill: '#f4f8fb', hillD: '#a9bccd', water: '#2f5f96', waterL: '#5a8ec4', waterD: '#234a78' }),
  palace: th({ b: '#43345c', d: '#36294c', l: '#52416f', floor: '#5d4a7a', floorD: '#493962', floorL: '#70598f', wall: '#4d3a6e', wallL: '#c9a227', wallD: '#271c3a', hill: '#c9a227', hillD: '#7a5f14' }),
  war: th({ b: '#7a7355', d: '#666046', l: '#8d8666', tree: '#4a4a30', treeL: '#666a44', hill: '#9a9270', hillD: '#555038', wall: '#5a5648', wallL: '#7d7866', wallD: '#33302a', road: '#9a8562', roadD: '#84704f' }),
  plague: th({ b: '#5a5d48', d: '#4a4d3a', l: '#6d7058', floor: '#6f7060', floorD: '#585a4b', floorL: '#828372', wall: '#55564a', wallL: '#777868', wallD: '#2e2f27', swamp: '#586238', swampD: '#444c2a', hill: '#8a8c74', hillD: '#474939' }),
  blood: th({ b: '#473a40', d: '#392e34', l: '#584a50', floor: '#5b4b52', floorD: '#463a40', floorL: '#6c5b62', wall: '#4b3a43', wallL: '#766069', wallD: '#241a20', hill: '#85717a', hillD: '#3a2d34', lavaD: '#5a0f1f' })      // r8: 「잿빛 변경」 — 적갈색(끝의 땅과 같은 색)에서 재색으로. 불씨·재 입자는 그대로
};
// 테마마다 빠져 있던 언덕·숲·산·길 색을 채운다 (어두운 땅에 기본 초록 언덕·눈 덮인 회색 산·황토 길이 그대로 나오던 것)
var FILL = {
  tomb: { hill: '#b89a62', hillD: '#6f5a33', tree: '#5a6a3a', treeL: '#7d8c4c', treeD: '#39451f', rock: '#8a7650', rockL: '#b09a6c', rockD: '#5c4c30', snow: '#d8c090' },
  moon: { tree: '#4c4c66', treeL: '#7c7c98', treeD: '#2c2c40', trunk: '#3a3a4c', road: '#a09cae', roadD: '#84809a' },
  coast: { rock: '#9a9488', rockL: '#c2bcae', rockD: '#6a6458', snow: '#e6dfcc', treeD: '#27603f', road: '#c9ab78', roadD: '#b0935f' },
  jungle: { treeD: '#123d22', hill: '#5aa860', hillD: '#2a5a36', rock: '#6f7f6a', rockL: '#93a38c', rockD: '#48553f', snow: '#b9d0a8' },
  swamp: { treeD: '#1a2a22', rock: '#5e6a5a', rockL: '#83907c', rockD: '#3c463a', snow: '#a8b89a', road: '#8a7f62', roadD: '#70664d' },
  styx: { treeD: '#1a1c2e', trunk: '#23202e', hill: '#5f668a', hillD: '#2d3048', rock: '#565b7a', rockL: '#7f85a6', rockD: '#33364c', snow: '#aab6d6', road: '#7b7888', roadD: '#625f70', reed: '#7f96a8' },
  canyon: { tree: '#6a6a34', treeL: '#8f8f48', treeD: '#45451f', road: '#b89468', roadD: '#9d7a52' },
  nether: { tree: '#4a2f6e', treeL: '#7d58b0', treeD: '#2a1a44', trunk: '#241a30', rock: '#4c4468', rockL: '#736a94', rockD: '#2c2642', snow: '#bda8e8', road: '#6e6380', roadD: '#574d68' },
  lava: { hill: '#7a5560', hillD: '#382430', tree: '#5a2f2c', treeL: '#c2623a', treeD: '#30181a', trunk: '#231416', rock: '#58434c', rockL: '#7e626a', rockD: '#32242a', snow: '#ff9a3c', road: '#7a6558', roadD: '#5f4d43' },
  rot: { treeD: '#24240f', rock: '#6b674c', rockL: '#8f8a68', rockD: '#45422e', snow: '#b0aa80', road: '#8a7c58', roadD: '#706444' },
  snow: { treeD: '#2c5246', rockL: '#c3c8d6', road: '#c2b8a6', roadD: '#a69c8a' },
  palace: { tree: '#4a2f6e', treeL: '#7d58b0', treeD: '#2a1a44', rock: '#4c4468', rockL: '#736a94', rockD: '#2c2642', snow: '#c9a227' },
  war: { treeD: '#2e2e1c', rock: '#77705e', rockL: '#9c9580', rockD: '#4c473a', snow: '#c4bca4' },
  plague: { tree: '#3f4a30', treeL: '#5f6e46', treeD: '#27301c', rock: '#66685a', rockL: '#8b8d7c', rockD: '#414338', snow: '#b4b6a0', road: '#857f66', roadD: '#6b6650' },
  blood: { tree: '#5e2d3c', treeL: '#96505e', treeD: '#34161f', trunk: '#27121a', rock: '#5c4550', rockL: '#86656f', rockD: '#33242b', snow: '#d9c2c6', road: '#7d6a62', roadD: '#62514b' }
};
for (var fk in FILL) for (var fc in FILL[fk]) THEMES[fk][fc] = FILL[fk][fc];
// 같은 풀밭·같은 해안을 쓰던 지역에 저마다의 빛깔: 바람재 평원(누런 억새 들판), 가온 섬(짙은 풀과 흰 모래 사이)
THEMES.meadow = th({ b: '#84ad56', d: '#6f9748', l: '#a3c468', hill: '#b6cf74', hillD: '#5f8440', tree: '#3d7a3a', treeL: '#63a850', treeD: '#27522a', road: '#c2a26a', roadD: '#a98a52' });
THEMES.isle = th({ b: '#e3d6a4', d: '#cfc08a', l: '#f0e6bc', hill: '#8ccf8a', hillD: '#3f8a5a', tree: '#2f8a66', treeL: '#58c08c', treeD: '#1c5a44', rock: '#8a94a0', rockL: '#b4bcc6', rockD: '#5c6672', snow: '#dfe8ea', water: '#2f93b8', waterL: '#7fd3e6', waterD: '#22708e', ford: '#63bdd4', road: '#cdb383', roadD: '#b39a69' });
// 평지의 잔장식: 꽃(풀밭) · 자갈(모래·바위땅) · 뼈와 금(어두운 땅) · 얼음 결정(눈)
var DECO = { grass: 1, meadow: 1, highland: 1, lake: 1, jungle: 1, ruins: 1, isle: 2, coast: 2, desert: 2, tomb: 2, canyon: 2, sky: 2, moon: 2, war: 3, swamp: 3, styx: 3, nether: 3, lava: 3, rot: 3, plague: 3, blood: 3, volcano: 3, palace: 3, snow: 4 };
for (var tk in THEMES) { THEMES[tk].name = tk; THEMES[tk].deco = DECO[tk] || 0; }
DS.THEMES = THEMES;
// ── 2.6 계절: 달력(age.js DS.calNow)의 계절이 온화한 땅(풀밭 · 평원 · 호숫가 · 고원 · 옛터)의 빛깔을 바꾼다 ──
//   봄 = 그대로 · 여름 = 조금 짙은 풀 · 가을 = 누런 풀과 단풍 든 나무 · 겨울 = 서리 앉은 풀과 눈 얹힌 나무. 바닷가 · 섬은 땅은 그대로 두고 지붕의 눈 · 공기만 (view.js).
//   m.season (0 봄 ~ 3 겨울) 이 없으면 예전 그대로. DS.seasonNow() = 지금 계절 (저장이 없으면 null)
var SEASON_OK = { grass: 1, meadow: 1, lake: 1, highland: 1, ruins: 1 }, SEASON_SOFT = { coast: 1, isle: 1 }, seasonC = {};
function mix(a, b, f) { var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), r = Math.round((x >> 16) + ((y >> 16) - (x >> 16)) * f), g = Math.round(((x >> 8) & 255) + (((y >> 8) & 255) - ((x >> 8) & 255)) * f), bl = Math.round((x & 255) + ((y & 255) - (x & 255)) * f); return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1); }
function palOf(m) {
  var th = THEMES[m.theme] ? m.theme : 'grass', T = THEMES[th], se = m.season;
  if (!(se >= 1 && se <= 3) || !SEASON_OK[th]) return T;
  var key = th + ':' + se; if (seasonC[key]) return seasonC[key];
  var o = {}, k; for (k in T) o[k] = T[k];
  if (se === 1) { o.b = mix(T.b, '#3f8f3a', 0.22); o.d = mix(T.d, '#357a33', 0.22); o.l = mix(T.l, '#58a84a', 0.22); o.tree = mix(T.tree, '#1f5a2a', 0.25); o.treeL = mix(T.treeL, '#3f9040', 0.25); }
  else if (se === 2) { o.b = mix(T.b, '#c2a04a', 0.42); o.d = mix(T.d, '#a8843a', 0.42); o.l = mix(T.l, '#dcbc62', 0.42); o.hill = mix(T.hill, '#d8b866', 0.4); o.hillD = mix(T.hillD, '#8a6a34', 0.35);
    o.tree = mix(T.tree, '#c2622a', 0.72); o.treeL = mix(T.treeL, '#eaa23c', 0.78); o.treeD = mix(T.treeD, '#7a3418', 0.6); }
  else { o.b = mix(T.b, '#dfe8f0', 0.4); o.d = mix(T.d, '#c5d2df', 0.4); o.l = mix(T.l, '#f4f8fb', 0.5); o.hill = mix(T.hill, '#f4f8fb', 0.6); o.hillD = mix(T.hillD, '#a9bccd', 0.4);
    o.tree = mix(T.tree, '#4a7a6a', 0.6); o.treeL = mix(T.treeL, '#eef5f8', 0.85); o.treeD = mix(T.treeD, '#2c5246', 0.5); o.road = mix(T.road, '#d6d2cc', 0.3); o.roadD = mix(T.roadD, '#b8b2aa', 0.3);
    o.water = mix(T.water, '#8fc3dc', 0.3); o.waterL = mix(T.waterL, '#e9f7fd', 0.35); o.deco = 0; }
  return (seasonC[key] = o);
}
DS.seasonNow = function () { try { var s = DS.G && DS.G.save; return s && DS.calNow ? DS.calNow(s).season : null; } catch (e) { return null; } };
DS.seasonLand = function (theme) { return SEASON_OK[theme] ? 2 : SEASON_SOFT[theme] ? 1 : 0; };      // 2 = 땅 빛깔까지 · 1 = 지붕 · 공기만 · 0 = 계절이 없는 땅

function hash(x, y, s) {
  var h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function shade(hex, f) {   // f<0 어둡게, f>0 밝게
  var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  function c(v) { return Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); }
  return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
}
DS.shade = shade;
// r8 gfx: 바둑판 명암 — 어두운 바탕은 같은 비율로 밝혀도 차가 훨씬 크게 보인다(수렁·첨탑이 체스판처럼 보이던 것). 어두운 색은 절반만
function chk(hex, f) { var n = parseInt(hex.slice(1), 16), L = ((n >> 16) * 30 + ((n >> 8) & 255) * 59 + (n & 255) * 11) / 100; return shade(hex, L < 120 ? f * 0.5 : f); }

// 16×16 타일 한 장 그리기
function paintTile(g, kind, T, tx, ty, seed, frame, nb) {
  var ox = tx * 16, oy = ty * 16, i, x, y, r, c;
  function px(x, y, c) { g.fillStyle = c; g.fillRect(ox + x, oy + y, 1, 1); }
  function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(ox + x, oy + y, w, h); }
  function rnd(n) { return hash(tx * 31 + n, ty * 17 + n * 7, seed + n); }
  function ground(base, dk, lt) {
    rect(0, 0, 16, 16, ((tx + ty) & 1) ? base : chk(base, 0.035));
    for (i = 0; i < 7; i++) px(Math.floor(rnd(i) * 16), Math.floor(rnd(i + 40) * 16), dk);
    for (i = 0; i < 4; i++) px(Math.floor(rnd(i + 80) * 16), Math.floor(rnd(i + 120) * 16), lt);
  }
  function joins(k) { return k === 'road' || k === 'bridge' || k === null; }      // 길이 이어지는 이웃 (지도 밖 포함)
  // 둥근 수관: 왼쪽 위가 밝고 오른쪽·아래가 어둡다, 아래쪽에 짙은 테두리
  function blob(bx, by, br, sq, cm, cl, cd, co) {
    for (var yy = Math.floor(by - br - 1); yy <= by + br + 1; yy++) for (var xx = Math.floor(bx - br - 1); xx <= bx + br + 1; xx++) {
      if (xx < 0 || xx > 15 || yy < 0 || yy > 15) continue;
      var rr2 = Math.sqrt((xx - bx) * (xx - bx) + (yy - by) * (yy - by) * sq);
      if (rr2 <= br) px(xx, yy, (xx < bx + 0.5 && yy < by && rr2 < br * 0.7) ? cl : (yy > by + br * 0.45 || xx > bx + br * 0.65 ? cd : cm));
      else if (rr2 <= br + 0.9 && yy > by - 1) px(xx, yy, co);
    }
  }
  // 둔덕: 위는 밝고 아랫단은 짙다, 발치에 그늘
  function mound(mx, my, rx, ry) {
    for (var yy = 2; yy < 15; yy++) for (var xx = 0; xx < 16; xx++) {
      var ex = (xx - mx) / rx, ey = (yy - my) / ry, e = ex * ex + ey * ey;
      if (e <= 1) px(xx, yy, yy >= my + ry * 0.62 ? T.hillD : (ey < -0.35 ? shade(T.hill, 0.18) : T.hill));
      else if (e <= 1.4 && yy > my + ry * 0.55) px(xx, yy, shade(T.hillD, -0.3));
    }
  }
  function water(base, lt, dk) {
    rect(0, 0, 16, 16, base);
    for (i = 0; i < 4; i++) {
      x = Math.floor(rnd(i + 3) * 12) + (frame ? 2 : 0); y = Math.floor(rnd(i + 23) * 14) + 1;
      rect(x % 13, y, 3, 1, lt);
      rect((x + 7) % 13, (y + 5) % 15, 2, 1, dk);
    }
  }
  switch (kind) {
    case 'plain':
      ground(T.b, T.d, T.l);
      if (rnd(200) > 0.6) { x = 2 + Math.floor(rnd(201) * 11); y = 3 + Math.floor(rnd(202) * 10); px(x, y, T.l); px(x + 1, y - 1, T.l); px(x + 2, y, T.l); }
      r = rnd(210);
      if (r > 0.86 && T.deco) {      // 드문드문 잔장식 — 같은 무늬가 줄지어 보이지 않게
        x = 2 + Math.floor(rnd(211) * 10); y = 3 + Math.floor(rnd(212) * 9);
        if (T.deco === 1) { c = ["#ffffff", "#ffe27a", "#ff9db5", "#c9b6ff"][Math.floor(rnd(213) * 4)]; px(x, y, c); px(x + 1, y + 1, T.d); if (r > 0.93) { px(x + 4, y + 2, c); px(x + 4, y + 3, T.d); px(x + 2, y + 4, c); } }
        else if (T.deco === 2) { rect(x, y, 2, 1, T.rock); px(x, y - 1, T.rockL); px(x + 2, y, T.rockD); if (r > 0.93) { px(x + 5, y + 3, T.rockL); px(x + 6, y + 3, T.rockD); } }
        else if (T.deco === 3) { if (r > 0.94) { rect(x, y, 3, 2, shade(T.l, 0.45)); px(x, y + 1, T.d); px(x + 2, y + 1, T.d); px(x + 1, y + 2, shade(T.l, 0.45)); } else { px(x, y, shade(T.d, -0.3)); px(x + 1, y + 1, shade(T.d, -0.3)); px(x + 2, y + 1, shade(T.d, -0.3)); px(x + 3, y + 2, shade(T.d, -0.3)); } }
        else { px(x, y, "#ffffff"); px(x - 1, y, T.d); px(x + 1, y, T.d); px(x, y - 1, T.d); px(x, y + 1, T.d); }
      }
      break;
    case 'road':
      rect(0, 0, 16, 16, T.road);
      for (i = 0; i < 8; i++) px(Math.floor(rnd(i) * 16), Math.floor(rnd(i + 40) * 16), T.roadD);
      for (i = 0; i < 3; i++) px(Math.floor(rnd(i + 80) * 16), Math.floor(rnd(i + 120) * 16), shade(T.road, 0.2));
      for (i = 0; i < 2; i++) { x = 2 + Math.floor(rnd(i + 150) * 11); y = 2 + Math.floor(rnd(i + 160) * 11); rect(x, y, 2, 1, T.roadD); px(x, y - 1, shade(T.road, 0.2)); }      // 자갈
      var rl = !joins(nb.l), rr = !joins(nb.r), ru = !joins(nb.u), rd = !joins(nb.d), eg = shade(T.roadD, -0.12);
      if (rl) rect(0, 0, 1, 16, T.roadD);
      if (rr) rect(15, 0, 1, 16, T.roadD);
      if (ru) rect(0, 0, 16, 1, T.roadD);
      if (rd) rect(0, 15, 16, 1, eg);
      // 길이 꺾이는 바깥 모서리는 풀이 둥글게 파고든다
      if (rl && ru) { rect(0, 0, 2, 1, T.b); px(0, 1, T.b); px(2, 0, T.roadD); px(1, 1, T.roadD); px(0, 2, T.roadD); }
      if (rr && ru) { rect(14, 0, 2, 1, T.b); px(15, 1, T.b); px(13, 0, T.roadD); px(14, 1, T.roadD); px(15, 2, T.roadD); }
      if (rl && rd) { rect(0, 15, 2, 1, T.b); px(0, 14, T.b); px(2, 15, eg); px(1, 14, eg); px(0, 13, eg); }
      if (rr && rd) { rect(14, 15, 2, 1, T.b); px(15, 14, T.b); px(13, 15, eg); px(14, 14, eg); px(15, 13, eg); }
      break;
    case 'forest':
      ground(T.b, T.d, T.l);
      var fv = Math.floor(rnd(220) * 3), fo = shade(T.treeD, -0.35);
      // 이웃 숲 쪽으로 낮은 덤불을 먼저 깔아 수관을 잇는다
      if (nb.l === 'forest') { blob(-0.5, 9, 3.4, 1.2, T.treeD, T.treeD, T.treeD, fo); }
      if (nb.r === 'forest') { blob(15.5, 9, 3.4, 1.2, T.tree, T.tree, T.treeD, fo); }
      if (fv === 0) {      // 둥근 큰 나무
        rect(4, 13, 9, 2, shade(T.d, -0.25)); rect(7, 10, 2, 4, T.trunk);
        blob(7.5, 6, 5.2, 1.25, T.tree, T.treeL, T.treeD, fo);
        px(5, 4, shade(T.treeL, 0.25)); px(6, 3, shade(T.treeL, 0.25));
      } else if (fv === 1) {      // 키 큰 나무와 어린 나무
        rect(2, 13, 12, 2, shade(T.d, -0.25)); rect(5, 9, 2, 5, T.trunk); rect(11, 11, 1, 3, T.trunk);
        blob(11.5, 9.5, 3, 1.2, T.tree, T.treeL, T.treeD, fo);
        blob(5.5, 5.5, 4.6, 1.3, T.tree, T.treeL, T.treeD, fo);
        px(4, 3, shade(T.treeL, 0.25));
      } else {      // 뾰족한 침엽수
        rect(4, 13, 9, 2, shade(T.d, -0.25)); rect(7, 11, 2, 3, T.trunk);
        for (y = 0; y < 12; y++) { var fw = 1 + Math.floor(y * 0.5) + (y % 4 === 3 ? 1 : 0); for (x = 8 - fw; x < 8 + fw; x++) px(x, y + 1, x < 7 && y % 4 < 2 ? T.treeL : (x > 8 || y % 4 === 3 ? T.treeD : T.tree)); px(8 - fw - 1, y + 1, fo); px(8 + fw, y + 1, fo); }
        px(7, 0, fo); px(8, 0, fo);
      }
      break;
    case 'hill':
      ground(T.b, T.d, T.l);
      var hv = Math.floor(rnd(240) * 3), hl = shade(T.hill, 0.18);
      if (nb.l === 'hill') { rect(0, 9, 3, 3, T.hill); rect(0, 12, 3, 2, T.hillD); rect(0, 9, 3, 1, hl); }      // 옆 언덕과 등성이가 이어진다
      if (nb.r === 'hill') { rect(13, 9, 3, 3, T.hill); rect(13, 12, 3, 2, T.hillD); rect(13, 9, 3, 1, hl); }
      if (hv === 1) { mound(5, 8.5, 5.4, 4.6); mound(10.5, 10, 5.4, 4.2); px(4, 7, T.hillD); px(11, 9, hl); }      // 겹친 두 둔덕
      else if (hv === 2) { mound(8.5, 9, 7, 5); px(4, 8, T.hillD); px(11, 7, T.hillD); px(12, 8, hl); px(7, 6, hl); }
      else { mound(7.5, 8.5, 7.6, 5.6); px(5, 7, T.hillD); px(10, 9, T.hillD); px(8, 6, shade(T.hill, 0.3)); }
      break;
    case 'mount':
      ground(T.b, T.d, T.l);
      var mv = Math.floor(rnd(230) * 3), pk = mv === 0 ? [[7.5, 1, 1.9, 1]] : mv === 1 ? [[5.5, 2, 1.9, 1], [11.5, 6, 1.7, 1]] : [[9.5, 1, 1.9, 1], [4, 7, 1.7, 1]];
      // r8 gfx: 같은 봉우리가 줄 맞춰 찍히지 않게 — 칸마다 봉우리를 좌우 1px·아래로 0~2px 옮기고 비탈 기울기도 조금씩 다르게
      var mjx = Math.floor(rnd(231) * 3) - 1, mjy = Math.floor(rnd(232) * 3), mjs = 0.92 + rnd(233) * 0.2;
      for (i = 0; i < pk.length; i++) { pk[i][0] += mjx; pk[i][1] += mjy; pk[i][2] *= mjs; }
      if (nb.l === 'mount') pk.push([-1.5, 9, 1.5, 0]);      // 능선: 옆 산과 어깨가 맞닿는다
      if (nb.r === 'mount') pk.push([16.5, 9, 1.5, 0]);
      var mo = shade(T.rockD, -0.4), sn = shade(T.snow, -0.12);
      for (x = 0; x < 16; x++) {
        var mt = 99, own = null;
        for (i = 0; i < pk.length; i++) { r = pk[i][1] + Math.abs(x + 0.5 - pk[i][0]) * pk[i][2]; if (r < mt) { mt = r; own = pk[i]; } }
        mt = Math.round(mt); if (mt > 14) continue;
        for (y = mt; y < 15; y++) {
          c = x + 0.5 < own[0] - (y > own[1] + 6 ? 1 : 0) ? T.rockL : (x + 0.5 > own[0] + 2 ? T.rockD : T.rock);
          if (own[3] && y < own[1] + 4 - ((x + (own[0] | 0)) & 1)) c = x + 0.5 > own[0] + 1 ? sn : T.snow;
          else if ((x * 7 + y * 3 + (seed & 7)) % 11 === 0) c = T.rockD;      // 바위 결
          px(x, y, c);
        }
        px(x, mt - 1 < 0 ? 0 : mt - 1, mo);
      }
      rect(nb.l === 'mount' ? 0 : 1, 15, nb.l === 'mount' ? (nb.r === 'mount' ? 16 : 15) : (nb.r === 'mount' ? 15 : 14), 1, mo);
      break;
    case 'water': water(T.water, T.waterL, T.waterD); break;
    case 'ford':
      water(T.ford, shade(T.ford, 0.3), T.water);
      for (i = 0; i < 3; i++) { x = 1 + Math.floor(rnd(i + 60) * 12); y = 1 + Math.floor(rnd(i + 70) * 12); rect(x, y, 2, 2, T.rock); px(x, y, T.rockL); }
      break;
    case 'bridge':
      water(T.water, T.waterL, T.waterD);
      var vert = (nb.l === 'water' || nb.r === 'water' || nb.l === 'ford' || nb.r === 'ford');
      if (vert) {
        rect(2, 0, 12, 16, T.plank);
        for (y = 3; y < 16; y += 4) rect(2, y, 12, 1, T.plankD);
        rect(2, 0, 1, 16, T.plankD); rect(13, 0, 1, 16, T.plankD);
      } else {
        rect(0, 2, 16, 12, T.plank);
        for (x = 3; x < 16; x += 4) rect(x, 2, 1, 12, T.plankD);
        rect(0, 2, 16, 1, T.plankD); rect(0, 13, 16, 1, T.plankD);
      }
      break;
    case 'wall':
      rect(0, 0, 16, 16, T.wall);
      rect(0, 0, 16, 3, T.wallL);
      for (y = 3; y < 16; y += 4) rect(0, y, 16, 1, T.wallD);
      for (y = 0; y < 4; y++) { var off = (y & 1) ? 4 : 0; for (x = off; x < 16; x += 8) rect(x, 4 + y * 4, 1, 3, T.wallD); }
      rect(0, 14, 16, 2, shade(T.wallD, -0.2));
      for (i = 0; i < 3; i++) px(Math.floor(rnd(i) * 16), 4 + Math.floor(rnd(i + 9) * 9), shade(T.wall, 0.12));
      break;
    case 'floor':
      rect(0, 0, 16, 16, ((tx + ty) & 1) ? T.floor : chk(T.floor, 0.05));
      rect(0, 0, 16, 1, T.floorD); rect(0, 0, 1, 16, T.floorD);
      rect(1, 1, 15, 1, T.floorL);
      for (i = 0; i < 3; i++) px(2 + Math.floor(rnd(i) * 12), 3 + Math.floor(rnd(i + 30) * 11), T.floorD);
      if (rnd(99) > 0.75) { x = 3 + Math.floor(rnd(98) * 8); y = 4 + Math.floor(rnd(97) * 8); px(x, y, T.floorD); px(x + 1, y + 1, T.floorD); px(x + 2, y + 1, T.floorD); }
      break;
    case 'lava':
      rect(0, 0, 16, 16, T.lava);
      for (i = 0; i < 5; i++) {
        x = Math.floor(rnd(i + 5) * 12) + (frame ? 1 : 0); y = Math.floor(rnd(i + 15) * 12) + (frame ? 1 : 0);
        rect(x % 13, y % 13, 3, 2, T.lavaL); px((x + 1) % 13, y % 13, T.lavaH);
      }
      for (i = 0; i < 5; i++) px(Math.floor(rnd(i + 50) * 16), Math.floor(rnd(i + 60) * 16), T.lavaD);
      break;
    case 'swamp':
      rect(0, 0, 16, 16, T.swamp);
      for (i = 0; i < 4; i++) { x = Math.floor(rnd(i + 2) * 11); y = Math.floor(rnd(i + 12) * 12); rect(x, y, 4 + (i & 1), 2, T.swampD); }
      for (i = 0; i < 3; i++) { x = 1 + Math.floor(rnd(i + 30) * 13); y = 3 + Math.floor(rnd(i + 40) * 10); rect(x, y, 1, 3, T.reed); px(x, y - 1, shade(T.reed, 0.3)); }
      px(Math.floor(rnd(77) * 14) + 1, Math.floor(rnd(78) * 14) + (frame ? 1 : 0), shade(T.swamp, 0.3));
      break;
    case 'pillar':
      rect(0, 0, 16, 16, T.floor); rect(0, 0, 16, 1, T.floorD); rect(0, 0, 1, 16, T.floorD);
      rect(3, 12, 11, 3, shade(T.floorD, -0.3));
      rect(4, 4, 8, 10, T.wall); rect(4, 4, 2, 10, T.wallL); rect(10, 4, 2, 10, T.wallD);
      for (y = 0; y < 6; y++) for (x = 3; x < 13; x++) {
        r = (x - 7.5) * (x - 7.5) / 22 + (y - 3) * (y - 3) / 7;
        if (r <= 1) px(x, y, y < 2 ? shade(T.wallL, 0.2) : T.wallL);
      }
      rect(3, 13, 10, 1, T.wallD);
      break;
    case 'ice':
      rect(0, 0, 16, 16, ((tx + ty) & 1) ? T.ice : shade(T.ice, 0.12));
      for (i = 0; i < 2; i++) { x = 2 + Math.floor(rnd(i + 4) * 9); y = 2 + Math.floor(rnd(i + 14) * 9); px(x, y + 2, T.iceL); px(x + 1, y + 1, T.iceL); px(x + 2, y, T.iceL); }
      px(Math.floor(rnd(31) * 15), Math.floor(rnd(32) * 15), T.iceD);
      px(Math.floor(rnd(33) * 15), Math.floor(rnd(34) * 15), T.iceD);
      break;
    case 'sand':
      rect(0, 0, 16, 16, ((tx + ty) & 1) ? T.sand : shade(T.sand, 0.04));
      for (i = 0; i < 3; i++) { x = Math.floor(rnd(i + 3) * 10); y = 2 + Math.floor(rnd(i + 13) * 12); rect(x, y, 4 + (i & 1) * 2, 1, T.sandD); px(x + 1, y - 1, T.sandL); px(x + 2, y - 1, T.sandL); }
      for (i = 0; i < 4; i++) px(Math.floor(rnd(i + 50) * 16), Math.floor(rnd(i + 60) * 16), T.sandL);
      break;
    case 'house':
      ground(T.b, T.d, T.l);
      break;
    case 'fence':
      ground(T.b, T.d, T.l);
      rect(0, 3, 16, 11, T.treeD); rect(0, 2, 16, 9, T.tree);
      for (i = 0; i < 6; i++) { x = Math.floor(rnd(i + 5) * 14); y = 2 + Math.floor(rnd(i + 25) * 7); rect(x, y, 2, 2, T.treeL); }
      rect(0, 13, 16, 1, shade(T.treeD, -0.4));
      break;
    case 'void':
      rect(0, 0, 16, 16, T.sky);
      if (rnd(3) > 0.55) { x = Math.floor(rnd(4) * 9) + (frame ? 1 : 0); y = 2 + Math.floor(rnd(5) * 10); rect(x, y, 6, 2, T.skyL); rect(x + 1, y - 1, 3, 1, T.skyL); rect(x + 2, y + 2, 5, 1, shade(T.skyL, -0.12)); }
      else if (rnd(6) > 0.7) px(Math.floor(rnd(7) * 16), Math.floor(rnd(8) * 16), T.skyL);
      break;
  }
}

// ───────── 입구 건물(3×2칸) ─────────
function landmark(g, icon, ox, oy) {
  var K = '#1b1626', x, y, i;
  function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(ox + x, oy + y, w, h); }
  function tri(cx, top, half, hgt, c, cD) { for (var y = 0; y < hgt; y++) { var hw = Math.max(1, Math.round(half * (y + 1) / hgt)); R(cx - hw, top + y, hw, 1, c); R(cx, top + y, hw, 1, cD); } }
  function ell(cx, cy, rx, ry, c) { for (var y = -ry; y <= ry; y++) { var hw = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.01))); R(cx - hw, cy + y, hw * 2, 1, c); } }
  R(4, 29, 40, 3, 'rgba(0,0,0,.28)');
  switch (icon) {
    case 'castle': case 'fort': case 'icecastle':
      var c = icon === 'icecastle' ? ['#bfe3f2', '#8fc3dc', '#f2fbff', '#5aa0c8'] : icon === 'fort' ? ['#a08c66', '#6e5c3e', '#c2ae88', '#b84a55'] : ['#a09cad', '#6a6677', '#c9c6d6', '#e0525e'];
      R(8, 14, 32, 17, c[0]); R(34, 14, 6, 17, c[1]);
      for (x = 8; x < 40; x += 6) R(x, 11, 3, 3, c[2]);
      R(2, 7, 10, 24, c[0]); R(9, 7, 3, 24, c[1]); R(36, 7, 10, 24, c[0]); R(43, 7, 3, 24, c[1]);
      R(1, 4, 12, 4, c[2]); R(35, 4, 12, 4, c[2]); R(1, 4, 3, 2, K); R(6, 4, 2, 2, K); R(10, 4, 3, 2, K); R(35, 4, 3, 2, K); R(40, 4, 2, 2, K); R(44, 4, 3, 2, K);
      R(19, 19, 10, 12, K); R(21, 21, 6, 10, '#3d2616'); R(20, 18, 8, 1, K);
      R(5, 13, 2, 4, K); R(40, 13, 2, 4, K); R(23, 0, 1, 11, K); R(24, 1, 6, 4, c[3]); R(24, 5, 4, 1, c[3]);
      break;
    case 'tower':
      R(15, 4, 18, 27, '#6a5c8c'); R(27, 4, 6, 27, '#4a3f66'); R(13, 1, 22, 4, '#8f80b0'); R(13, 1, 3, 2, K); R(19, 1, 3, 2, K); R(26, 1, 3, 2, K); R(32, 1, 3, 2, K);
      R(20, 22, 8, 9, K); R(22, 24, 4, 7, '#ff4d6d'); R(21, 9, 3, 5, '#ffd24a'); R(21, 16, 3, 3, K); R(27, 12, 2, 4, K);
      break;
    case 'volcano':
      tri(24, 5, 23, 26, '#6d5a66', '#4a3a44'); R(17, 4, 14, 3, '#ff9a3c'); R(19, 3, 10, 1, '#ffd75e');
      R(22, 7, 2, 11, '#ff9a3c'); R(26, 7, 2, 7, '#ffd75e'); R(15, 18, 2, 5, '#d9442b'); R(21, 1, 2, 2, '#8a8494'); R(26, 0, 3, 2, '#a7a1b0');
      break;
    case 'pyramid':
      tri(24, 2, 23, 29, '#ecd08a', '#b89650');
      for (y = 8; y < 30; y += 5) R(24 - Math.round(23 * (y - 1) / 29), y, Math.round(46 * (y - 1) / 29), 1, 'rgba(90,60,20,.35)');
      R(21, 23, 6, 8, K); R(22, 24, 4, 7, '#3d2616');
      break;
    case 'cave':
      ell(24, 22, 22, 12, '#7d766a'); ell(22, 19, 16, 8, '#a9a294'); R(2, 26, 44, 6, '#7d766a'); ell(24, 25, 8, 9, K); R(16, 26, 16, 6, K); R(20, 9, 3, 2, '#c9c2b4');
      break;
    case 'camp':
      tri(15, 10, 11, 20, '#d9bc82', '#96753f'); R(13, 22, 4, 8, K); tri(35, 14, 9, 16, '#c0525e', '#7e2c3a'); R(34, 23, 3, 7, K);
      R(25, 2, 1, 12, K); R(26, 3, 6, 4, '#e0525e'); R(23, 26, 4, 3, '#ff9a3c'); R(24, 24, 2, 2, '#ffd75e');
      break;
    case 'village':
      R(4, 17, 16, 13, '#e2cfa6'); R(16, 17, 4, 13, '#b9a47a'); tri(12, 7, 11, 10, '#c0525e', '#8a3040'); R(9, 22, 5, 8, '#6f4a2c');
      R(28, 19, 15, 11, '#e2cfa6'); R(39, 19, 4, 11, '#b9a47a'); tri(35, 10, 10, 9, '#4c9a52', '#2f6b3a'); R(33, 23, 4, 7, '#6f4a2c'); R(15, 20, 3, 3, '#62b0ee');
      break;
    case 'temple': case 'ruin':
      var tc = icon === 'ruin' ? ['#8a8ea8', '#5c6080'] : ['#d8d2c0', '#a39c88'];
      R(3, 27, 42, 4, tc[1]); R(5, 25, 38, 2, tc[0]);
      [7, 16, 28, 37].forEach(function (cx, n) { var top = icon === 'ruin' ? [12, 18, 9, 21][n] : 10; R(cx, top, 4, 25 - top, tc[0]); R(cx + 3, top, 1, 25 - top, tc[1]); R(cx - 1, top - 1, 6, 2, tc[0]); });
      if (icon === 'temple') { tri(24, 1, 22, 8, tc[0], tc[1]); R(21, 16, 6, 9, K); } else { R(30, 24, 6, 3, tc[0]); R(12, 22, 3, 3, tc[1]); }
      break;
    case 'port':
      R(0, 25, 48, 3, '#a8754a'); for (x = 2; x < 48; x += 8) R(x, 25, 2, 7, '#6f4a2c');
      R(11, 16, 26, 7, '#7a5232'); R(13, 23, 22, 2, '#5e3a22'); R(8, 16, 3, 3, '#7a5232'); R(37, 15, 4, 4, '#7a5232'); R(23, 1, 2, 15, '#3d2616');
      R(14, 4, 9, 10, '#f1ead9'); R(25, 3, 10, 11, '#f1ead9'); R(25, 3, 10, 2, '#d8cfb6'); R(23, 0, 5, 2, '#e0525e');
      break;
    case 'airship':
      ell(24, 9, 20, 8, '#c0445e'); ell(22, 7, 14, 4, '#e06a80'); R(8, 9, 32, 1, '#7e2940'); R(12, 16, 1, 6, K); R(35, 16, 1, 6, K); R(24, 17, 1, 5, K);
      R(11, 22, 26, 6, '#a8754a'); R(14, 28, 20, 2, '#6f4a2c'); R(11, 22, 26, 1, '#d0a070'); R(37, 23, 5, 2, '#6f4a2c'); R(42, 21, 2, 6, '#cdd5e3');
      break;
    case 'lake': case 'oasis':
      ell(24, 22, 20, 8, '#2f65a6'); ell(24, 21, 18, 6, '#3d7fc6'); R(14, 19, 6, 1, '#9fd0f5'); R(26, 23, 8, 1, '#9fd0f5');
      if (icon === 'oasis') { R(36, 6, 2, 16, '#8a5a36'); ell(37, 6, 8, 3, '#3a8a5a'); R(30, 4, 6, 2, '#5ab57a'); R(39, 3, 6, 2, '#5ab57a'); }
      else { R(5, 12, 1, 8, '#8fb86a'); R(8, 14, 1, 6, '#8fb86a'); R(41, 13, 1, 7, '#8fb86a'); ell(24, 21, 3, 2, '#d6fbff'); }
      break;
    case 'statue':
      R(15, 26, 18, 5, '#6a6677'); R(17, 23, 14, 3, '#8d8a9a'); R(18, 8, 12, 15, '#9b97a6'); R(27, 8, 3, 15, '#6a6677'); R(19, 2, 10, 7, '#b3b0c0');
      R(21, 5, 2, 2, '#7fe3ff'); R(26, 5, 2, 2, '#7fe3ff'); R(13, 10, 5, 9, '#9b97a6'); R(30, 10, 5, 9, '#6a6677');
      break;
    case 'obelisk':
      R(15, 27, 18, 4, '#3a2a2a'); R(18, 24, 12, 3, '#4a3636'); R(20, 6, 8, 18, '#5a4040'); R(26, 6, 2, 18, '#3a2a2a'); R(21, 3, 6, 3, '#5a4040'); R(23, 1, 2, 2, '#5a4040');
      R(22, 10, 4, 1, '#ff9a3c'); R(22, 14, 4, 1, '#ff9a3c'); R(22, 18, 4, 1, '#ff9a3c');
      for (i = 0; i < 5; i++) { x = [12, 16, 30, 34, 23][i]; y = [16, 9, 10, 17, -4][i]; R(x, y + 6, 3, 4, '#ff9a3c'); R(x + 1, y + 4, 1, 3, '#ffd75e'); }
      break;
    case 'portal':
      R(8, 6, 6, 25, '#4a3f66'); R(34, 6, 6, 25, '#4a3f66'); R(8, 2, 32, 6, '#6a5c8c'); R(12, 0, 24, 3, '#8f80b0');
      R(14, 8, 20, 23, '#2a0f3a'); ell(24, 19, 8, 10, '#7446ad'); ell(24, 19, 5, 7, '#b181e6'); ell(24, 19, 2, 3, '#ffffff');
      break;
    case 'moon':
      ell(24, 15, 14, 14, '#b9b9c9'); ell(22, 13, 11, 11, '#d6d6e4'); ell(19, 11, 3, 3, '#9a9aae'); ell(28, 18, 4, 3, '#9a9aae'); ell(26, 8, 2, 2, '#9a9aae');
      break;
  }
}
// ───────── 마을 건물(3×2칸) ─────────
var ROOF = { forge: ['#5a5466', '#3a3446'], weapon: ['#c0525e', '#8a3040'], armor: ['#4f7fd0', '#2f559c'], item: ['#4c9a52', '#2f6b3a'], merc: ['#e08a3c', '#a8602a'], church: ['#e9e2d0', '#b9ae96'], house: ['#a8754a', '#6f4a2c'] };
// 마을마다 벽과 지붕의 맛이 다르다: 풀밭 마을은 회벽과 꽃 상자, 고원 마을은 돌벽과 슬레이트 지붕, 바닷가 마을은 흰 벽과 줄무늬 차양·나무통
var WALLS = { grass: ['#eadcbc', '#c4b48e', '#8a7a58'], highland: ['#d2cdc0', '#a9a394', '#6f6a5c'], coast: ['#f6f1e4', '#d3ccb8', '#9a8f78'] };
// 2.6: 민가 넷이 서로 다르다 (hv = 몇째 민가: 지붕 빛 · 간판 그림 · 굴뚝 연기는 첫 집만) · 겨울(se 3)에는 지붕과 굴뚝에 눈이 얹힌다
var HROOF = [['#a8754a', '#6f4a2c'], ['#c0525e', '#8a3040'], ['#6a7f9a', '#465a74'], ['#d0b060', '#a08038']];
function building(g, kind, ox, oy, theme, frame, hv, se) {
  var K = '#1b1626', c = (kind === 'house' && hv >= 0 ? HROOF[hv % 4] : ROOF[kind]) || ROOF.house, W = WALLS[theme] || WALLS.grass, st = theme === 'highland' ? 1 : theme === 'coast' ? 2 : 0, x, y;
  function R(x, y, w, h, col) { g.fillStyle = col; g.fillRect(ox + x, oy + y, w, h); }
  R(2, 30, 44, 2, 'rgba(0,0,0,.3)');
  // 굴뚝과 연기 (교회는 종탑이 따로 있다)
  if (kind !== 'church') { R(35, 0, 6, 6, K); R(36, 1, 4, 5, st === 1 ? '#8d8a9a' : '#b06a4a'); R(36, 1, 4, 1, st === 1 ? '#b3b0c0' : '#d08a66'); if (!(kind === 'house' && hv > 0)) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(ox + 37 + frame, oy - 3 - frame, 2, 2); g.fillRect(ox + 39 - frame, oy - 6 - frame, 2, 1); if (kind === 'house') { g.fillRect(ox + 38 + frame, oy - 9 - frame, 3, 2); g.fillRect(ox + 41 - frame, oy - 12, 2, 1); } } }
  // 벽
  R(2, 14, 44, 17, K); R(3, 14, 42, 16, W[0]); R(39, 14, 6, 16, W[1]); R(3, 14, 42, 1, W[2]);
  if (st === 1) { for (y = 18; y < 30; y += 4) R(3, y, 42, 1, W[1]); for (y = 0; y < 3; y++) for (x = 6 + (y & 1) * 5; x < 44; x += 10) R(x, 15 + y * 4, 1, 3, W[1]); }      // 돌벽 줄눈
  else if (st === 2) R(3, 27, 42, 3, '#7fb6d6');      // 바닷가: 푸른 허리띠
  else { R(3, 28, 42, 2, W[1]); R(16, 15, 1, 15, W[2]); R(31, 15, 1, 15, W[2]); }      // 풀밭 마을: 나무 기둥
  // 지붕
  R(0, 4, 48, 11, K); R(2, 2, 44, 3, K);
  R(1, 5, 46, 9, c[0]); R(3, 3, 42, 2, c[0]); R(3, 3, 42, 1, shade(c[0], 0.25)); R(1, 12, 46, 2, c[1]);
  if (st === 1) { for (y = 7; y < 12; y += 2) R(1, y, 46, 1, c[1]); for (x = 3; x < 46; x += 4) R(x, 5, 1, 2, c[1]); }      // 슬레이트 결
  else for (x = 4; x < 46; x += 6) R(x, 6, 1, 6, c[1]);
  if (st === 2) for (x = 1; x < 47; x += 4) R(x, 12, 2, 3, '#f6f1e4');      // 줄무늬 차양
  if (se === 3) { R(3, 3, 42, 2, '#ffffff'); R(1, 5, 46, 2, '#f4f8fb'); for (x = 2; x < 46; x += 5) R(x + ((x * 7) % 3), 7, 2, 1, '#f4f8fb'); R(1, 5, 46, 1, '#ffffff'); if (kind !== 'church') R(36, 0, 4, 1, '#ffffff'); }      // 2.6 겨울: 지붕에 눈
  // 문과 창
  R(19, 18, 10, 13, K); R(20, 19, 8, 12, '#6f4a2c'); R(21, 20, 6, 11, '#8a5a36'); R(26, 25, 1, 2, '#f6cf57'); R(18, 30, 12, 1, shade(W[1], -0.15));
  R(6, 18, 9, 8, K); R(7, 19, 7, 6, '#62b0ee'); R(7, 19, 3, 2, '#a9dcff'); R(10, 19, 1, 6, W[0]); R(7, 22, 7, 1, W[0]);
  R(32, 18, 9, 8, K); R(33, 19, 7, 6, '#62b0ee'); R(33, 19, 3, 2, '#a9dcff'); R(36, 19, 1, 6, W[0]); R(33, 22, 7, 1, W[0]);
  if (st === 0) { R(6, 26, 9, 2, '#6f4a2c'); R(32, 26, 9, 2, '#6f4a2c'); [7, 10, 13, 33, 36, 39].forEach(function (fx, n) { R(fx, 25, 1, 1, ['#ff9db5', '#ffe27a', '#ffffff'][n % 3]); }); }      // 꽃 상자
  else if (st === 2) { R(14, 23, 5, 8, K); R(15, 24, 3, 6, '#a8754a'); R(15, 25, 3, 1, '#5e3a22'); R(15, 28, 3, 1, '#5e3a22'); R(29, 26, 4, 5, K); R(30, 27, 2, 3, '#c9a56a'); }      // 나무통과 상자
  else { R(15, 26, 4, 5, K); R(16, 27, 2, 3, '#8d8a9a'); R(16, 27, 2, 1, '#b3b0c0'); }      // 고원: 장작더미 대신 돌확
  // 간판
  R(17, 7, 14, 10, K); R(18, 8, 12, 8, '#f7ecd0');
  if (kind === 'forge') { R(20, 12, 8, 2, '#4a4458'); R(22, 14, 4, 1, '#4a4458'); R(21, 15, 6, 1, '#2b2638'); R(20, 12, 8, 1, '#8f9ab3'); R(25, 8, 1, 4, '#8a5a36'); R(23, 8, 5, 2, '#8f9ab3'); R(19, 10, 1, 1, '#ffb347'); R(29, 9, 1, 1, '#ffd24a'); }      // r37 대장간: 모루와 망치, 불티
  else if (kind === 'weapon') { R(23, 9, 2, 5, '#8f9ab3'); R(21, 13, 6, 1, '#c08f2c'); R(23, 14, 2, 1, '#6f4a2c'); }
  else if (kind === 'armor') { R(21, 9, 6, 4, '#3572b8'); R(22, 13, 4, 1, '#3572b8'); R(23, 14, 2, 1, '#3572b8'); R(23, 10, 2, 2, '#f6cf57'); }
  else if (kind === 'item') { R(23, 9, 2, 2, '#8f9ab3'); R(22, 11, 4, 4, '#e0525e'); R(22, 11, 4, 1, '#f7b0b8'); }
  else if (kind === 'merc') { R(20, 9, 1, 6, K); R(21, 9, 6, 4, '#e0525e'); R(22, 10, 2, 2, '#f6cf57'); }
  else if (kind === 'church') { R(23, 9, 2, 6, '#c08f2c'); R(21, 11, 6, 2, '#c08f2c'); R(21, -7, 6, 11, K); R(22, -6, 4, 10, W[0]); R(19, -9, 10, 4, K); R(20, -8, 8, 3, c[1]); R(23, -3, 2, 3, '#62b0ee'); R(23, -14, 2, 6, '#f6cf57'); R(21, -12, 6, 2, '#f6cf57'); }
  else if (hv === 1) { R(23, 9, 2, 2, '#ff9db5'); R(22, 10, 4, 1, '#ff9db5'); R(24, 11, 1, 3, '#4c9a52'); R(22, 12, 2, 1, '#4c9a52'); R(22, 14, 5, 1, '#b06a4a'); }      // 꽃집 같은 집: 화분
  else if (hv === 2) { R(21, 11, 5, 3, '#62b0ee'); R(22, 10, 3, 1, '#62b0ee'); R(26, 10, 1, 5, '#3572b8'); R(27, 11, 1, 3, '#3572b8'); R(22, 11, 1, 1, K); }      // 물고기 잡는 집
  else if (hv === 3) { R(21, 12, 6, 3, '#c9a56a'); R(22, 10, 4, 2, '#e0c080'); R(23, 9, 2, 1, '#e0c080'); R(21, 14, 6, 1, '#8a6a3a'); }      // 빵 굽는 집: 빵 한 덩이
  else { R(21, 10, 6, 1, '#8a7a58'); R(21, 12, 6, 1, '#8a7a58'); R(21, 14, 4, 1, '#8a7a58'); }
  if (se === 3 && kind === 'church') { R(20, -8, 8, 1, '#ffffff'); }
}
// 시나리오 지도의 민가(2×2칸): 박공지붕·굴뚝·창·문. 지붕색은 집마다 다르다.
var COT = [['#a8754a', '#6f4a2c'], ['#c0525e', '#8a3040'], ['#6a7f9a', '#465a74'], ['#7a8a4a', '#566434']];
function cottage(g, ox, oy, n) {
  var K = '#1b1626', c = COT[n % 4], y;
  function R(x, y, w, h, col) { g.fillStyle = col; g.fillRect(ox + x, oy + y, w, h); }
  R(2, 30, 28, 2, 'rgba(0,0,0,.3)');
  R(22, 1, 6, 7, K); R(23, 2, 4, 6, '#b06a4a'); R(23, 2, 4, 1, '#d08a66');
  R(2, 14, 28, 17, K); R(3, 15, 26, 15, '#eadcbc'); R(24, 15, 5, 15, '#c4b48e'); R(3, 15, 26, 1, '#8a7a58'); R(3, 28, 26, 2, '#c4b48e');
  for (y = 0; y < 6; y++) { R(5 - y - 1, 4 + y * 2, 22 + y * 2 + 2, 2, K); }
  for (y = 0; y < 6; y++) { R(5 - y, 4 + y * 2, 22 + y * 2, 2, y === 5 ? c[1] : c[0]); R(5 - y, 4 + y * 2, 22 + y * 2, 1, y === 0 ? shade(c[0], 0.25) : c[0]); if (y) R(5 - y, 4 + y * 2 + 1, 22 + y * 2, 1, y % 2 ? c[1] : c[0]); }
  R(0, 15, 32, 1, K);
  R(12, 19, 8, 12, K); R(13, 20, 6, 10, '#6f4a2c'); R(14, 21, 4, 9, '#8a5a36'); R(17, 25, 1, 2, '#f6cf57');
  R(4, 19, 7, 7, K); R(5, 20, 5, 5, '#62b0ee'); R(5, 20, 2, 2, '#a9dcff'); R(7, 20, 1, 5, '#eadcbc'); R(5, 22, 5, 1, '#eadcbc');
  R(21, 19, 7, 7, K); R(22, 20, 5, 5, '#62b0ee'); R(22, 20, 2, 2, '#a9dcff'); R(24, 20, 1, 5, '#c4b48e'); R(22, 22, 5, 1, '#c4b48e');
}
// 지도 한 장 (16px/칸). m: {rows, theme, seed, pois}
function paintMap1(m, frame) {
  var h = m.rows.length, w = m.rows[0].length;
  var cv = document.createElement('canvas'); cv.width = w * 16; cv.height = h * 16;
  var g = cv.getContext('2d'), T = palOf(m), x, y, hn = 0;
  function k(x, y) { return (x < 0 || y < 0 || x >= w || y >= h) ? null : DS.TILE_CH[m.rows[y][x]]; }
  function wet(t) { return t === 'water' || t === 'ford' || t === 'lava' || t === 'bridge' || t === null; }
  function land(a, b) { return a === 'sand' || b === 'sand' ? T.sand : a === 'floor' || b === 'floor' ? T.floor : a === 'road' || b === 'road' ? T.road : T.b; }
  for (y = 0; y < h; y++) for (x = 0; x < w; x++)
    paintTile(g, k(x, y), T, x, y, (m.seed || 1) * 7 + 3, frame, { l: k(x - 1, y), r: k(x + 1, y), u: k(x, y - 1), d: k(x, y + 1) });
  // 물가·용암가: 위·왼쪽은 둑 그림자, 아래·오른쪽은 거품(용암은 달아오른 빛), 뭍이 두 변에서 만나는 구석은 둥글게
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    var t = k(x, y);
    if (t !== 'water' && t !== 'ford' && t !== 'lava') continue;
    var u = k(x, y - 1), d = k(x, y + 1), l = k(x - 1, y), r = k(x + 1, y), X = x * 16, Y = y * 16, lv = t === 'lava';
    var eu = !wet(u), ed = !wet(d), el = !wet(l), er = !wet(r), dk = lv ? 'rgba(40,10,10,.55)' : 'rgba(20,40,70,.45)';
    g.fillStyle = dk;
    if (eu) g.fillRect(X, Y, 16, 2);
    if (el) g.fillRect(X, Y, 1, 16);
    g.fillStyle = lv ? 'rgba(255,215,94,.6)' : 'rgba(255,255,255,.42)';
    if (ed) { g.fillRect(X + 1 + frame * 2, Y + 14, 5, 1); g.fillRect(X + 9 - frame, Y + 15, 5, 1); }
    if (er) { g.fillRect(X + 15, Y + 2 + frame * 2, 1, 4); g.fillRect(X + 14, Y + 9 - frame, 1, 3); }
    if (eu) { g.fillRect(X + 3 - frame, Y + 2, 4, 1); g.fillRect(X + 10 + frame, Y + 2, 3, 1); }
    if (el) { g.fillRect(X + 1, Y + 4 + frame, 1, 3); g.fillRect(X + 1, Y + 11 - frame, 1, 2); }
    if (eu && el) { g.fillStyle = land(u, l); g.fillRect(X, Y, 3, 1); g.fillRect(X, Y + 1, 2, 1); g.fillRect(X, Y + 2, 1, 1); g.fillStyle = dk; g.fillRect(X + 3, Y, 1, 2); g.fillRect(X + 2, Y + 1, 1, 2); g.fillRect(X + 1, Y + 2, 1, 2); g.fillRect(X, Y + 3, 1, 1); }
    if (eu && er) { g.fillStyle = land(u, r); g.fillRect(X + 13, Y, 3, 1); g.fillRect(X + 14, Y + 1, 2, 1); g.fillRect(X + 15, Y + 2, 1, 1); g.fillStyle = dk; g.fillRect(X + 12, Y, 1, 2); g.fillRect(X + 13, Y + 1, 1, 2); g.fillRect(X + 14, Y + 2, 1, 2); }
    if (ed && el) { g.fillStyle = land(d, l); g.fillRect(X, Y + 15, 3, 1); g.fillRect(X, Y + 14, 2, 1); g.fillRect(X, Y + 13, 1, 1); }
    if (ed && er) { g.fillStyle = land(d, r); g.fillRect(X + 13, Y + 15, 3, 1); g.fillRect(X + 14, Y + 14, 2, 1); g.fillRect(X + 15, Y + 13, 1, 1); }
  }
  (m.pois || []).forEach(function (p) {
    if (p.t === 'gate' || p.t === 'dungeon') landmark(g, p.icon, (p.x - 1) * 16, (p.y - 2) * 16);
    if (p.t === 'shop') building(g, p.kind, p.bx * 16, p.by * 16, m.theme, frame, p.kind === 'house' ? hn++ : -1, m.season);
  });
  if (m.pois && m.pois.some(function (p) { return p.t === 'shop'; })) try { townProps(g, m, T); } catch (e) {}      // r11: 세대마다 늘어나는 마을 소품
  // 시나리오 지도의 민가
  if (!m.pois) for (y = 0; y < h - 1; y++) for (x = 0; x < w - 1; x++)
    if (m.rows[y][x] === 'H' && m.rows[y][x + 1] === 'H' && m.rows[y + 1][x] === 'H' && (x === 0 || m.rows[y][x - 1] !== 'H') && (y === 0 || m.rows[y - 1][x] !== 'H')) cottage(g, x * 16, y * 16, x * 3 + y * 5 + (m.seed || 0));
  return cv;
}
// ── r4 hd: 지도를 2배로 굽는다 ──
// 16px 그림은 그대로 그린 뒤 Scale2x(EPX)로 늘려 나무 수관·둔덕·산등성이·물가의 계단을 반 픽셀 깎고,
// 그 위에 반 픽셀 결(풀잎·자갈·나뭇잎 반짝임·바위 결·물비늘)을 한 단계씩 얹는다. 흐린 보간은 쓰지 않는다.
function epx(src, w, h) {
  var o = new Uint32Array(w * h * 4), W2 = w * 2, x, y;
  for (y = 0; y < h; y++) {
    var r0 = y * w, ru = (y > 0 ? y - 1 : y) * w, rd = (y < h - 1 ? y + 1 : y) * w;
    for (x = 0; x < w; x++) {
      var P = src[r0 + x], A = src[ru + x], D = src[rd + x], C = src[r0 + (x > 0 ? x - 1 : x)], B = src[r0 + (x < w - 1 ? x + 1 : x)];
      var i = y * 2 * W2 + x * 2;
      if (C !== B && A !== D) {
        o[i] = C === A ? A : P; o[i + 1] = A === B ? B : P; o[i + W2] = D === C ? C : P; o[i + W2 + 1] = B === D ? D : P;
      } else { o[i] = o[i + 1] = o[i + W2] = o[i + W2 + 1] = P; }
    }
  }
  return o;
}
function hx(hex) { var v = parseInt(hex.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
function px32(c) { return (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]; }      // 리틀 엔디언 RGBA
// ── r11 gfx: 32px 결 — 2배 지도 위에 1px 단위 무늬를 지형마다 한 겹 더 얹는다 (풀포기·자갈 그림자·물마루·벽돌 줄눈·모래 물결·잎 반짝임·바위 금) ──
function fine(o32, src, w, h, m, T, frame) {
  var W2 = w * 2, H2 = h * 2, tw = w / 16, th2 = h / 16, seed = (m.seed || 1) * 31 + 7, tx, ty, n, X, Y, i;
  function c32(hex) { return px32(hx(hex)); }
  var gb = [c32(T.b), c32(shade(T.b, 0.035))], gL = c32(shade(T.b, 0.22)), gD = c32(shade(T.b, -0.16));
  var rd = T.road ? c32(T.road) : 0, rL = T.road ? c32(shade(T.road, 0.22)) : 0, rD = T.road ? c32(shade(T.road, -0.22)) : 0;
  var wa = T.water ? c32(T.water) : 0, wL = T.water ? c32(shade(T.water, 0.32)) : 0;
  var fl = T.floor ? c32(T.floor) : 0, fD = T.floor ? c32(shade(T.floor, -0.14)) : 0, fL = T.floor ? c32(shade(T.floor, 0.1)) : 0;
  var wl = T.wall ? c32(T.wall) : 0, wD = T.wall ? c32(shade(T.wall, -0.18)) : 0;
  var sa = T.sand ? c32(T.sand) : 0, sD = T.sand ? c32(shade(T.sand, -0.12)) : 0, sL = T.sand ? c32(shade(T.sand, 0.12)) : 0;
  var tr = T.tree ? c32(T.tree) : 0, tL = T.tree ? c32(shade(T.tree, 0.3)) : 0;
  var rk = T.rock ? c32(T.rock) : 0, rkD = T.rock ? c32(shade(T.rock, -0.25)) : 0;
  function S(x, y) { x = x >> 1; y = y >> 1; return x < 0 || y < 0 || x >= w || y >= h ? 0 : src[y * w + x]; }
  function put(x, y, c, need) { if (x < 0 || y < 0 || x >= W2 || y >= H2) return; if (need && need.indexOf(S(x, y)) < 0) return; o32[y * W2 + x] = c; }
  for (ty = 0; ty < th2; ty++) for (tx = 0; tx < tw; tx++) {
    var k = DS.TILE_CH[m.rows[ty][tx]], ox = tx * 32, oy = ty * 32;
    function r(j) { return hash(tx * 37 + j, ty * 23 + j * 3, seed + j); }
    if (k === 'plain') for (n = 0; n < 3; n++) {      // 풀포기: 잎 셋(가운데 길게) + 밑동 그늘
      X = ox + 2 + Math.floor(r(n) * 27); Y = oy + 3 + Math.floor(r(n + 9) * 25); if (gb.indexOf(S(X, Y)) < 0) continue;
      put(X, Y + 1, gL, gb); put(X + 1, Y, gL, gb); put(X + 1, Y - 1, gL, gb); put(X + 2, Y + 1, gL, gb); put(X, Y + 2, gD, gb); put(X + 1, Y + 2, gD, gb); put(X + 2, Y + 2, gD, gb);
    }
    else if (k === 'road' && rd) for (n = 0; n < 3; n++) { X = ox + 3 + Math.floor(r(n) * 25); Y = oy + 3 + Math.floor(r(n + 9) * 25); put(X, Y, rL, [rd]); put(X + 1, Y, rL, [rd]); put(X, Y + 1, rD, [rd]); put(X + 1, Y + 1, rD, [rd]); put(X + 2, Y + 1, rD, [rd]); }
    else if ((k === 'water' || k === 'ford') && wa) for (n = 0; n < 2; n++) { X = ox + 3 + ((Math.floor(r(n) * 22) + frame * 3) % 24); Y = oy + 4 + Math.floor(r(n + 9) * 24); put(X, Y + 1, wL, [wa]); put(X + 1, Y, wL, [wa]); put(X + 2, Y, wL, [wa]); put(X + 3, Y + 1, wL, [wa]); }
    else if (k === 'floor' && fl) { for (X = ox; X < ox + 32; X++) { put(X, oy + 15, fD, [fl]); put(X, oy + 31, fD, [fl]); put(X, oy + 16, fL, [fl]); } var jx = ox + ((ty & 1) ? 8 : 24); for (Y = oy; Y < oy + 15; Y++) put(jx, Y, fD, [fl]); for (Y = oy + 16; Y < oy + 31; Y++) put(jx + ((ty & 1) ? 16 : -16), Y, fD, [fl]); }
    else if (k === 'wall' && wl) { for (i = 0; i < 4; i++) { Y = oy + 7 + i * 8; for (X = ox; X < ox + 32; X++) put(X, Y, wD, [wl]); var vx = ox + ((i & 1) ? 6 : 22); for (var yy = Y - 7; yy < Y; yy++) put(vx, yy, wD, [wl]); } }
    else if (k === 'sand' && sa) for (n = 0; n < 2; n++) { X = ox + 2 + Math.floor(r(n) * 22); Y = oy + 4 + Math.floor(r(n + 9) * 24); for (i = 0; i < 6; i++) { put(X + i, Y + (i === 0 || i === 5 ? 1 : 0), sD, [sa]); put(X + i, Y - 1 + (i === 0 || i === 5 ? 1 : 0), sL, [sa]); } }
    else if (k === 'forest' && tr) for (n = 0; n < 6; n++) { X = ox + 2 + Math.floor(r(n) * 28); Y = oy + 2 + Math.floor(r(n + 9) * 22); put(X, Y, tL, [tr]); if (n & 1) put(X + 1, Y, tL, [tr]); }
    else if ((k === 'mount' || k === 'hill') && rk) for (n = 0; n < 2; n++) { X = ox + 6 + Math.floor(r(n) * 18); Y = oy + 8 + Math.floor(r(n + 9) * 14); for (i = 0; i < 4; i++) put(X + i, Y + (i >> 1), rkD, [rk]); }
  }
}
// ── r13 toon: 지도 카툰 손질 (지도를 구울 때 한 번) ──
//  1) 3×3 최빈값 거르개 두 번: 한 점 얼룩·계단 모서리가 깎여 풀·물·길이 둥근 면이 된다
//  2) 밝기가 다른 두 면이 맞닿은 곳의 어두운 쪽 한 줄을 그 색의 짙은 색으로 — 카툰의 윤곽선처럼 (나무 수관·물가·길 가장자리)
//  3) 면 위쪽 경계 바로 아래 한 줄은 밝게 (빛은 위에서)
// 가게·민가(keep)는 곧은 선을 지키려고 건드리지 않는다.
function gradeMap(o) {
  var pv = -1, pr = 0;      // r30: 같은 색이 이어지면 앞의 답을 그대로
  for (var i = 0, n = o.length; i < n; i++) {
    var v = o[i]; if (v === pv) { o[i] = pr; continue; }
    var a = v >>> 24; if (!a) continue;
    var r = v & 255, g = (v >> 8) & 255, b = (v >> 16) & 255, l = r * 0.3 + g * 0.59 + b * 0.11;
    r = r + (l - r) * 0.18 + 5; g = g + (l - g) * 0.18 + 1; b = b + (l - b) * 0.18 - 6;
    if (l > 200) { r -= 8; g -= 8; b -= 10; }
    r = r < 0 ? 0 : r > 255 ? 255 : r | 0; g = g < 0 ? 0 : g > 255 ? 255 : g | 0; b = b < 0 ? 0 : b > 255 ? 255 : b | 0;
    o[i] = (a << 24 | b << 16 | g << 8 | r) >>> 0; pv = v; pr = o[i];
  }
}
function toonMap(o, W, H, keep) {
  var x, y, i, j, k, b = new Uint32Array(o.length), K = new Uint8Array(W * H);
  keep.forEach(function (r) { for (var yy = Math.max(0, r[1] * 2); yy < Math.min(H, (r[1] + r[3]) * 2); yy++) for (var xx = Math.max(0, r[0] * 2); xx < Math.min(W, (r[0] + r[2]) * 2); xx++) K[yy * W + xx] = 1; });
  var cv = new Uint32Array(9), cn = new Int32Array(9);
  for (var pass = 0; pass < 2; pass++) {
    b.set(o);
    for (y = 1; y < H - 1; y++) for (x = 1; x < W - 1; x++) {
      i = y * W + x; if (K[i]) continue;
      var c0 = b[i]; if ((b[i - 1] === c0) + (b[i + 1] === c0) + (b[i - W] === c0) + (b[i + W] === c0) >= 3) continue;      // r30: 가운데+곧은 이웃 셋이 같으면 그 색이 이긴다(8/14) — 바뀌지 않으니 건너뛴다 (지도 굽기 210→?ms)
      var ns = 0, best = c0, bv = 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var c = b[i + dy * W + dx], wgt = dx === 0 && dy === 0 ? 2 : (dx && dy ? 1 : 2);
        for (k = 0; k < ns; k++) if (cv[k] === c) break;
        if (k === ns) { cv[ns] = c; cn[ns] = 0; ns++; }
        cn[k] += wgt;
      }
      for (k = 0; k < ns; k++) if (cn[k] > bv) { bv = cn[k]; best = cv[k]; }
      if (bv >= 7) o[i] = best;
    }
  }
  function L(c) { return (c & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + ((c >> 16) & 255) * 0.11; }
  function sc(c, f) { var r = c & 255, g2 = (c >> 8) & 255, bl = (c >> 16) & 255; if (f < 0) { f = -f; r = r * (1 - f) + 30 * f; g2 = g2 * (1 - f) + 22 * f; bl = bl * (1 - f) + 48 * f; } else { r += (255 - r) * f; g2 += (250 - g2) * f; bl += (235 - bl) * f; } return (255 << 24) | (Math.round(bl) << 16) | (Math.round(g2) << 8) | Math.round(r); }
  b.set(o);
  for (y = 1; y < H - 1; y++) for (x = 1; x < W - 1; x++) {
    i = y * W + x; if (K[i]) continue;
    var p = b[i], n0 = b[i - 1], n1 = b[i + 1], n2 = b[i - W], n3 = b[i + W];
    if (n0 === p && n1 === p && n2 === p && n3 === p) continue;      // r30: 면 한가운데는 할 일이 없다 (전엔 칸마다 배열을 새로 만들었다 — 400만 개)
    var lp = L(p), dark = 0;
    if ((n0 !== p && L(n0) - lp > 14) || (n1 !== p && L(n1) - lp > 14) || (n2 !== p && L(n2) - lp > 14) || (n3 !== p && L(n3) - lp > 14)) dark = 1;
    if (dark) o[i] = sc(p, -0.32);
    else if (b[i - W] !== p && L(b[i - W]) < lp - 14 && y > 1) o[i] = sc(p, 0.16);
  }
}
// ── r11 gfx: 마을은 세대마다 조금씩 달라진다 — 세대(save.gen, 없으면 가주의 가계도 세대) 하나를 읽어 소품이 는다. 칸이 없으면 1세대(지금 모습) ──
DS.gfxGen = function () {
  var S = DS.G && DS.G.save; if (!S) return 1;
  if (S.gen > 0) return S.gen;
  try { var ch = S.chars && S.chars[S.hero], p = ch && ch.pid && S.lin && S.lin.P ? S.lin.P[ch.pid] : null; return p && p.gen > 0 ? p.gen : 1; } catch (e) { return 1; }
};
DS.gfxHouse = function () { var S = DS.G && DS.G.save; return S && S.lin && S.lin.sur || null; };
function townProps(g, m, T) {
  var gen = Math.min(6, DS.gfxGen()), house = DS.gfxHouse(), K = '#1b1626', w = m.rows[0].length, h = m.rows.length, spots = [], x, y;
  if (gen < 2) return;
  for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) if (DS.TILE_CH[m.rows[y][x]] === 'plain' && (DS.TILE_CH[m.rows[y + 1][x]] === 'road' || DS.TILE_CH[m.rows[y][x + 1]] === 'road' || DS.TILE_CH[m.rows[y][x - 1]] === 'road')) spots.push([x, y]);
  var busy = {}; (m.pois || []).forEach(function (p) { if (p.t === 'shop') for (var yy = p.by - 1; yy <= p.by + 2; yy++) for (var xx = p.bx - 1; xx <= p.bx + 3; xx++) busy[xx + ',' + yy] = 1; busy[p.x + ',' + p.y] = 1; });
  spots = spots.filter(function (s) { return !busy[s[0] + ',' + s[1]]; });
  spots.sort(function (a, b) { return hash(a[0], a[1], 91) - hash(b[0], b[1], 91); });
  var far = []; spots.forEach(function (s) { if (far.every(function (f) { return Math.abs(f[0] - s[0]) + Math.abs(f[1] - s[1]) >= 5; })) far.push(s); }); spots = far;      // 한곳에 몰리지 않게
  function R(ox, oy, x, y, w2, h2, c) { g.fillStyle = c; g.fillRect(ox + x, oy + y, w2, h2); }
  var kinds = ['pot', 'pot', 'banner', 'well', 'lamp', 'lamp', 'statue', 'bunting', 'lamp', 'pot'], want = Math.min(spots.length, [0, 0, 3, 5, 7, 9, 10][gen]);
  for (var i = 0; i < want; i++) {
    var kd = kinds[i], ox = spots[i][0] * 16, oy = spots[i][1] * 16;
    if (kd === 'pot') { R(ox, oy, 5, 9, 6, 5, K); R(ox, oy, 6, 10, 4, 3, '#b06a4a'); R(ox, oy, 6, 10, 4, 1, '#d08a66'); R(ox, oy, 6, 7, 1, 2, '#3f8f4c'); R(ox, oy, 8, 6, 1, 3, '#3f8f4c'); R(ox, oy, 6, 6, 1, 1, ['#ff9db5', '#ffe27a', '#c9b6ff'][i % 3]); R(ox, oy, 8, 5, 1, 1, '#ffffff'); }
    else if (kd === 'banner' && gen >= 2) {      // 가문 깃발 기둥: 그 집 문장
      R(ox, oy, 7, 1, 2, 14, K); R(ox, oy, 7.5, 1, 1, 13, '#8a5a36');
      if (house && DS.crestCanvas) { try { g.fillStyle = K; g.fillRect(ox + 1, oy + 1, 7, 8); g.drawImage(DS.crestCanvas(house, 1), ox + 1.5, oy + 1.5, 6, 6); } catch (e) {} } else { R(ox, oy, 2, 2, 5, 6, '#c0303a'); }
    }
    else if (kd === 'well' && gen >= 3) { R(ox, oy, 2, 6, 12, 9, K); R(ox, oy, 3, 9, 10, 5, '#9a96a6'); R(ox, oy, 3, 9, 10, 1, '#c9c6d6'); R(ox, oy, 4, 7, 8, 2, '#3572b8'); R(ox, oy, 3, 1, 1, 6, K); R(ox, oy, 12, 1, 1, 6, K); R(ox, oy, 2, 0, 12, 2, '#8a3040'); }
    else if (kd === 'lamp' && gen >= 4) { R(ox, oy, 7, 3, 2, 12, K); R(ox, oy, 5, 1, 6, 4, K); R(ox, oy, 6, 2, 4, 2, '#ffe27a'); R(ox, oy, 6, 2, 1, 1, '#ffffff'); }
    else if (kd === 'statue' && gen >= 5) { R(ox, oy, 3, 11, 10, 4, K); R(ox, oy, 4, 12, 8, 2, '#9a96a6'); R(ox, oy, 6, 2, 4, 9, K); R(ox, oy, 7, 3, 2, 8, '#c9c6d6'); R(ox, oy, 6, 0, 4, 3, K); R(ox, oy, 7, 1, 2, 2, '#c9c6d6'); R(ox, oy, 10, 1, 1, 6, K); }
    else if (kd === 'bunting' && gen >= 5) { for (var b = 0; b < 4; b++) { R(ox, oy, b * 4, 2 + (b & 1), 4, 1, K); R(ox, oy, b * 4 + 1, 3 + (b & 1), 2, 2, ['#e0525e', '#f6cf57', '#62b0ee', '#7fcf6a'][b]); } }
  }
}
// r30: 물결 둘째 장(frame 1)은 첫 장과 다른 칸(물·늪·하늘·굴뚝 연기)만 다시 굽는다 — 전엔 장면이 뜨고 1.5초 뒤 지도 전체를 한 번 더 구워
//   걷는 중에 300ms 넘게 멈췄다(폰은 1초 가까이). 8×8칸 덩이 가운데 바뀐 덩이만, 둘레 한 칸을 덧대어 굽고 안쪽만 옮긴다 (결과는 통째로 구운 것과 같다).
var BLK = 8;
function hdPipe(src, w, h, keep) {      // 카툰+새 그림 판의 픽셀 처리: EPX → 가게 곧은 선 → 카툰 → 색조 (칸 좌표를 쓰지 않는 순수 픽셀 처리)
  var o32 = epx(src, w, h);
  keep.forEach(function (r) {
    for (var yy = Math.max(0, r[1]); yy < Math.min(h, r[1] + r[3]); yy++) for (var xx = Math.max(0, r[0]); xx < Math.min(w, r[0] + r[2]); xx++) {
      var v = src[yy * w + xx], j = yy * 2 * w * 2 + xx * 2; o32[j] = o32[j + 1] = o32[j + w * 2] = o32[j + w * 2 + 1] = v;
    }
  });
  try { toonMap(o32, w * 2, h * 2, keep); } catch (e) {}
  try { gradeMap(o32); } catch (e) {}
  return o32;
}
// 굽기 일감: step() 을 부를 때마다 덩이 하나(대개 5~15ms)씩 — 쉴 때 조금씩 굽는다. done 이면 cv 가 다 된 둘째 장
function deltaJob(m, frame, base) {
  var s0 = base._src, J = { done: false, cv: null, dirty: 0, blocks: 0 }, st = 0, src, w, h, keep, list = [], g;
  if (!s0) return null;
  J.step = function () {
    if (J.done) return true;
    if (st === 0) { J.c1 = paintMap1(m, frame); st = 2; return false; }      // 16px 장을 그린다 (한 조각)
    if (st === 2) {      // 첫 장과 다른 덩이를 찾는다
      var c1 = J.c1; J.c1 = null; w = c1.width; h = c1.height;
      if (s0.length !== w * h || base.width !== w * 2) { J.cv = DS.paintMap(m, frame); J.done = true; return true; }
      src = new Uint32Array(c1.getContext('2d').getImageData(0, 0, w, h).data.buffer); keep = base._keep || [];
      var tw = w / 16, th = h / 16, bw = Math.ceil(tw / BLK), bh = Math.ceil(th / BLK), bx, by, x, y, i;
      for (by = 0; by < bh; by++) for (bx = 0; bx < bw; bx++) {
        var x0 = bx * BLK * 16, y0 = by * BLK * 16, x1 = Math.min(w, x0 + BLK * 16), y1 = Math.min(h, y0 + BLK * 16), d = false;
        for (y = y0; y < y1 && !d; y++) for (x = x0, i = y * w + x0; x < x1; x++, i++) if (src[i] !== s0[i]) { d = true; break; }
        if (d) list.push([x0, y0, x1, y1]);
      }
      J.dirty = list.length; J.blocks = bw * bh;
      J.cv = document.createElement('canvas'); J.cv.width = w * 2; J.cv.height = h * 2; g = J.cv.getContext('2d'); g.drawImage(base, 0, 0);
      st = 1; if (!list.length) J.done = true; return J.done;
    }
    var b = list.shift(); if (!b) { J.done = true; return true; }
    b = [Math.max(0, b[0] - 2), Math.max(0, b[1] - 2), Math.min(w, b[2] + 2), Math.min(h, b[3] + 2)];      // 덩이 둘레 2px(2배 지도 4px)도 바뀐 칸의 영향을 받는다 (EPX 1 + 카툰 3)
    var M = 16, ax = Math.max(0, b[0] - M), ay = Math.max(0, b[1] - M), bx2 = Math.min(w, b[2] + M), by2 = Math.min(h, b[3] + M), sw = bx2 - ax, sh = by2 - ay, yy;
    var sub = new Uint32Array(sw * sh); for (yy = 0; yy < sh; yy++) sub.set(src.subarray((ay + yy) * w + ax, (ay + yy) * w + ax + sw), yy * sw);
    var kp = keep.map(function (r) { return [r[0] - ax, r[1] - ay, r[2], r[3]]; });
    var o = hdPipe(sub, sw, sh, kp), W2 = sw * 2, iw = (b[2] - b[0]) * 2, ih = (b[3] - b[1]) * 2, ox = (b[0] - ax) * 2, oy = (b[1] - ay) * 2;
    var img = g.createImageData(iw, ih), d32 = new Uint32Array(img.data.buffer);
    for (yy = 0; yy < ih; yy++) d32.set(o.subarray((oy + yy) * W2 + ox, (oy + yy) * W2 + ox + iw), yy * iw);
    g.putImageData(img, b[0] * 2, b[1] * 2);
    if (!list.length) J.done = true;
    return J.done;
  };
  return J;
}
// 둘째 장 일감: 카툰+새 그림 판이고 첫 장이 바탕을 쥐고 있으면 덩이 일감, 아니면 한 번에 굽는 일감
DS.paintMapJob = function (m, frame, base) {
  var J = null;
  if (base && frame && DS.TOON !== false && DS.ART === 'new') { try { J = deltaJob(m, frame, base); } catch (e) { J = null; } }
  if (J) return J;
  J = { done: false, cv: null, step: function () { if (!J.done) { J.cv = DS.paintMap(m, frame); J.done = true; } return true; } };
  return J;
};
DS.paintMap = function (m, frame, base) {
  if (base && frame) { var J = DS.paintMapJob(m, frame, base); try { while (!J.step()); } catch (e) { J = null; } if (J && J.cv) return J.cv; }      // 한 번에 다 (시험·옛 호출)
  var c1 = paintMap1(m, frame), w = c1.width, h = c1.height;
  var d1 = c1.getContext('2d').getImageData(0, 0, w, h), src = new Uint32Array(d1.data.buffer);
  var cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2;
  var g = cv.getContext('2d'), img = g.createImageData(w * 2, h * 2), o32 = new Uint32Array(img.data.buffer);
  o32.set(epx(src, w, h));
  // 가게·민가는 곧은 선(창살·문·처마)이 생명이라 깎지 않고 그대로 2배로 둔다
  var keep = [];
  (m.pois || []).forEach(function (p) { if (p.t === 'shop') keep.push([p.bx * 16, p.by * 16, 48, 32]); });
  if (!m.pois) for (var cy = 0; cy < m.rows.length - 1; cy++) for (var cx = 0; cx < m.rows[0].length - 1; cx++)
    if (m.rows[cy][cx] === 'H' && m.rows[cy][cx + 1] === 'H' && m.rows[cy + 1][cx] === 'H' && (cx === 0 || m.rows[cy][cx - 1] !== 'H') && (cy === 0 || m.rows[cy - 1][cx] !== 'H')) keep.push([cx * 16, cy * 16, 32, 32]);
  keep.forEach(function (r) {
    for (var yy = Math.max(0, r[1]); yy < Math.min(h, r[1] + r[3]); yy++) for (var xx = Math.max(0, r[0]); xx < Math.min(w, r[0] + r[2]); xx++) {
      var v = src[yy * w + xx], j = yy * 2 * w * 2 + xx * 2; o32[j] = o32[j + 1] = o32[j + w * 2] = o32[j + w * 2 + 1] = v;
    }
  });
  // 결: 칸마다 몇 자리를 골라, 그 자리 원래 색이 지형의 바탕색이면 반 픽셀 밝은 점/짙은 점을 찍는다
  var T = palOf(m), W2 = w * 2, tw = w / 16, th2 = h / 16, seed = (m.seed || 1) * 13 + 5;
  var rules = [], k;
  function rule(base, lt, dk, n, blade) { if (!base) return; var c = hx(base); rules.push([px32(c), px32(hx(shade(base, lt))), px32(hx(shade(base, -dk))), n, blade]); }
  rule(T.b, 0.16, 0.12, 5, 1); rule(shade(T.b, 0.035), 0.15, 0.12, 5, 1);
  rule(T.road, 0.14, 0.12, 4, 0); rule(T.sand, 0.12, 0.1, 4, 0); rule(T.tree, 0.22, 0.2, 12, 0); rule(T.treeL, 0.25, 0.12, 6, 0); rule(T.treeD, 0.14, 0.2, 6, 0);
  rule(T.hill, 0.15, 0.14, 6, 0); rule(T.rock, 0.18, 0.15, 8, 0); rule(T.rockL, 0.2, 0.12, 4, 0); rule(T.floor, 0.1, 0.1, 2, 0); rule(T.wall, 0.12, 0.14, 2, 0);
  rule(T.water, 0.28, 0.1, 3, 2); rule(T.swamp, 0.14, 0.12, 2, 0); rule(T.ice, 0.3, 0.08, 2, 0); rule(T.lava, 0.3, 0.12, 2, 2);
  var map = {}; rules.forEach(function (r) { map[r[0]] = r; });
  var TOON = DS.TOON !== false;
  for (var ty = 0; ty < th2 && !TOON; ty++) for (var tx = 0; tx < tw; tx++) {
    for (var n = 0; n < 12; n++) {
      var sx = tx * 16 + Math.floor(hash(tx * 31 + n, ty * 17 + n * 5, seed + n) * 16), sy = ty * 16 + Math.floor(hash(tx * 13 + n * 3, ty * 29 + n, seed + 77 + n) * 16);
      var r = map[src[sy * w + sx]]; if (!r || n >= r[3]) continue;
      var X = sx * 2 + (n & 1), Y = sy * 2 + ((n >> 1) & 1), i = Y * W2 + X;
      if (r[4] === 1) {      // 풀잎: 위는 밝은 잎끝, 아래 반 픽셀은 그늘 — 한 칸 옆에 짧은 잎 하나
        o32[i] = r[1]; if (Y + 1 < h * 2) o32[i + W2] = r[2]; if (n % 3 === 0 && X + 2 < W2 && Y + 1 < h * 2) { o32[i + W2 + 2] = r[1]; }
      } else if (r[4] === 2) {      // 물비늘·용암 결: 가로로 짧은 반 픽셀 선 (장면 두 장이 번갈아 반짝인다)
        if ((n + frame) & 1) { o32[i] = r[1]; if (X + 1 < W2) o32[i + 1] = r[1]; if (X + 2 < W2) o32[i + 2] = r[1]; }
      } else {      // 자갈·바위 결·나뭇잎 반짝임: 밝은 점 + 오른쪽 아래 짙은 점 (빛은 왼쪽 위)
        o32[i] = r[1]; if (X + 1 < W2 && Y + 1 < h * 2) o32[i + W2 + 1] = r[2];
      }
    }
  }
  if (TOON) try { toonMap(o32, w * 2, h * 2, keep); } catch (e) {}      // r13 toon: 면을 고르게 + 경계에 색 있는 선
  if (TOON && DS.ART === 'new') try { gradeMap(o32); } catch (e) {}      // r14 새 그림: 지도 색도 「진중한」 톤으로 (채도 18% 덜고 살짝 따뜻하게) — 새 인물 그림과 결을 맞춘다
  else if (DS.HD2 !== false) try { fine(o32, src, w, h, m, T, frame); } catch (e) {}
  g.putImageData(img, 0, 0);
  if (!frame) { cv._src = src; cv._keep = keep; }      // r30: 둘째 장이 다른 칸만 굽도록 첫 장의 16px 바탕을 쥐고 있는다 (둘째 장을 구우면 view 가 놓는다)
  return cv;
};
DS.landmarkCanvas = function (icon) { var cv = document.createElement('canvas'); cv.width = 48; cv.height = 32; landmark(cv.getContext('2d'), icon, 0, 0); return cv; };
})();
