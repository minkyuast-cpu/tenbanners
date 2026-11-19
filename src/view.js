// 열 개의 깃발 — 화면 그리기 (카메라, 유닛, 연출)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var DIG = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  '-': '000000111000000', '+': '000010111010000', '!': '010010010000010',
  'M': '101111111101101', 'I': '111010010010111', 'S': '011100010001110'      // r26: 「MISS」도 픽셀 숫자처럼
};
function drawNum(g, str, cx, cy, s, col, out, ow) {
  var w = str.length * 4 * s - s, x0 = cx - w / 2, i, j; ow = ow || 0.5;      // r8: ow = 외곽선 두께(글자 칸의 배수). 붉은 땅의 아군 피해 숫자는 1
  for (var pass = 0; pass < 2; pass++) {
    g.fillStyle = pass ? col : out;
    for (i = 0; i < str.length; i++) {
      var b = DIG[str[i]]; if (!b) continue;
      for (j = 0; j < 15; j++) if (b[j] === '1') {
        var x = x0 + (i * 4 + j % 3) * s, y = cy + Math.floor(j / 3) * s;
        if (pass) g.fillRect(x, y, s, s); else g.fillRect(x - s * ow, y - s * ow, s * (1 + ow * 2), s * (1 + ow * 2));
      }
    }
  }
  // r4 hd: 글자 아래쪽 반 줄을 한 단계 짙게 — 오락실 숫자처럼 두 톤으로 또렷하게 (2배 지도 해상도의 반 픽셀)
  var dk = numShade(col); if (!dk) return;
  g.fillStyle = dk;
  for (i = 0; i < str.length; i++) {
    var b2 = DIG[str[i]]; if (!b2) continue;
    for (j = 9; j < 15; j++) if (b2[j] === '1' && (j >= 12 || b2[j + 3] !== '1')) g.fillRect(x0 + (i * 4 + j % 3) * s, cy + Math.floor(j / 3) * s + s * 0.5, s, s * 0.5);
  }
}
var numShC = {};
function numShade(c) { if (numShC[c] !== undefined) return numShC[c]; return (numShC[c] = /^#[0-9a-f]{6}$/i.test(c) && DS.shade ? DS.shade(c, -0.22) : null); }
var FXC = {
  fire: ['#ff9a3c', '#ffd75e', '#d9442b'], water: ['#6fb0e6', '#d6fbff', '#3d7fc6'], thunder: ['#fff0a0', '#ffffff'], holy: ['#ffffff', '#fff0a0'],
  dark: ['#b181e6', '#7446ad', '#2b2440'], heal: ['#7fcf6a', '#d6ffb0'], healDark: ['#b181e6', '#e0525e'], poison: ['#9ccc3c', '#5a8a2a'],
  quake: ['#a8754a', '#6f4a2c', '#d8c39a'], meteor: ['#ff9a3c', '#ffd75e', '#7a1f1f'], wind: ['#ffffff', '#cdd5e3'], slash: ['#ffffff', '#fff0a0'],
  thrust: ['#ffffff'], arrow: ['#f1ead9'], arrowRain: ['#f1ead9', '#a8754a'], buffRed: ['#ff6a7a', '#ffd0d6'], buffBlue: ['#62b0ee', '#d6ecff'], buffGold: ['#f6cf57', '#fff6d0'],
  fist: ['#ffb35a', '#fff0c0', '#f06a2a'], kick: ['#ffffff', '#ffd28a', '#f08a3a'], palm: ['#bfe8ff', '#ffffff', '#7fd0ff'], chi: ['#f6cf57', '#fff6d0', '#ffb35a']      // 2.2.5 승려(무투가): 주먹 · 날아차기 · 기공장 · 부동심
};
var FXS = { fire: 'fire', water: 'water', thunder: 'thunder', holy: 'holy', dark: 'dark', heal: 'heal', healDark: 'dark', poison: 'poison', quake: 'boom', meteor: 'boom',
            wind: 'wind', slash: 'slash', thrust: 'slash', arrow: 'arrow', arrowRain: 'arrow', buffRed: 'buff', buffBlue: 'buff', buffGold: 'buff', fist: 'punch', kick: 'kick', palm: 'qi', chi: 'buff' };
// r7: 기술마다 빛 [색, 반지름, 세기, 시간]
var LIGHTC = { fire: ['#ff8a2a', 20, 0.55, 0.5], meteor: ['#ff7a2a', 26, 0.6, 0.6], thunder: ['#cfe6ff', 22, 0.6, 0.25], holy: ['#fff0a0', 20, 0.5, 0.45],
  heal: ['#9ef08a', 14, 0.35, 0.45], dark: ['#b181e6', 16, 0.4, 0.45], water: ['#8fd0ff', 14, 0.3, 0.35], poison: ['#b6ff5a', 12, 0.28, 0.4], buffGold: ['#ffe27a', 14, 0.35, 0.4],
  fist: ['#ffb35a', 12, 0.35, 0.25], palm: ['#bfe8ff', 18, 0.5, 0.4], chi: ['#ffd75e', 18, 0.45, 0.5] };
// 2.2.5 필살기 연출: 병과마다 빛깔과 꼴이 다르다 (합일 마스터는 그 묶음의 주인공 병과 · 성격 몫 필살기는 쓰는 이의 병과)
var ULTFX = {
  inf: { c: ['#cfe3ff', '#ffffff', '#5b8fd6'], k: 'slash' }, cav: { c: ['#ffe27a', '#fff6d0', '#e8bb45'], k: 'thrust' }, fly: { c: ['#dff4ff', '#ffffff', '#62b0ee'], k: 'wind' },
  mar: { c: ['#8fd0ff', '#d6fbff', '#2f86a6'], k: 'water' }, pike: { c: ['#bff0d8', '#ffffff', '#4c9a8a'], k: 'thrust' }, arc: { c: ['#d6f5b0', '#ffffff', '#5fae5a'], k: 'arrow' },
  cle: { c: ['#ffd28a', '#fff6d0', '#f08a3a'], k: 'fist' }, mon: { c: ['#ffe0a0', '#ffffff', '#f09a4a'], k: 'holy' }, mag: { c: ['#d8c8ff', '#ffffff', '#8d6be0'], k: 'arcane' },
  sha: { c: ['#d2a8ff', '#9a6ad0', '#3a2458'], k: 'dark' }
};
var ULT_MASTER = { bm: 'inf', tm: 'arc', mm: 'mag' };
function ultCls(S, u) { var c = (S && S.cls) || (u && u.cls) || 'inf'; return ULT_MASTER[c] || c; }
DS.ultCls = ultCls;
var spotCv = null;      // 필살기의 어둠: 가운데가 뚫린 64×64 한 장 (쓰는 이 둘레만 밝다)
function spotTex() {
  if (spotCv) return spotCv;
  try { spotCv = document.createElement('canvas'); spotCv.width = 64; spotCv.height = 64; var g = spotCv.getContext('2d'), gr = g.createRadialGradient(32, 32, 6, 32, 32, 32); gr.addColorStop(0, 'rgba(6,4,12,0)'); gr.addColorStop(0.45, 'rgba(6,4,12,.35)'); gr.addColorStop(1, 'rgba(6,4,12,1)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); } catch (x) { spotCv = null; }
  return spotCv;
}
// 2.2.5 설정 「효과」: 보통 · 가볍게 (가볍게 = 알갱이 절반 남짓 · 덧그림 없이). 느린 기기(lowFx)도 덧그림은 저절로 줄인다
DS.fxLite = function () { var o = DS.G && DS.G.save && DS.G.save.opt; return !!(o && o.fxq === 'lite'); };
var BUFFTXT = { atk: '공격', def: '방어', quick: '퀵', ctr: '되치기' };
var PMAX = 240, SMAX = 48;      // 입자·모양 이펙트 상한 (3배속 난전에서도 넘지 않는다) · 2.2.5: 입자는 다 쓴 것을 모아 다시 쓴다 (프레임마다 새로 만들지 않는다)
// 지역의 공기: 테마마다 [종류, 개수(30 이하), 색] — 지도 바로 위, 예고 칸·유닛보다 아래에 그린다
var AMB = {
  grass: ['drift', 12, ['#ffffff', '#ffe27a', '#ffb3c6']], meadow: ['drift', 16, ['#f6f0c0', '#ffe27a', '#ffffff']], lake: ['drift', 10, ['#ffffff', '#d6fbff']],
  highland: ['drift', 9, ['#f1f6d0', '#ffffff']], jungle: ['drift', 14, ['#9be06a', '#d2f58a']], ruins: ['drift', 8, ['#d2f58a', '#ffffff']],
  coast: ['drift', 9, ['#ffffff', '#dff6ff']], isle: ['drift', 11, ['#ffffff', '#bff0e0']],
  desert: ['sand', 16, ['#f6e2a8', '#fff3cf']], canyon: ['sand', 12, ['#d8b88a', '#f0d6aa']], sky: ['sand', 10, ['#ffffff', '#dff0ff']], tomb: ['mote', 10, ['#e9cc84', '#fff3cf']],
  styx: ['fog', 22, ['#aab6d6', '#b6ffd0']], swamp: ['fog', 18, ['#a8b89a', '#d6ff8a']], rot: ['fog', 18, ['#b0aa80', '#d6ff8a']], plague: ['fog', 18, ['#b4b6a0', '#b6ff5a']],
  nether: ['mote', 22, ['#b181e6', '#e0c8ff']], palace: ['mote', 16, ['#f6cf57', '#b181e6']], moon: ['mote', 10, ['#ffffff', '#c9c9d9']],
  blood: ['ash', 24, ['#d9c2c6', '#8f7a80', '#ff8a6a']], war: ['ash', 14, ['#b0a890', '#77705e']],
  lava: ['ember', 26, ['#ff9a3c', '#ffd75e', '#d9442b']], volcano: ['ember', 20, ['#ff9a3c', '#ffd75e', '#d9442b']],
  snow: ['snow', 30, ['#ffffff', '#dfe8f0']]
};

// 지역의 빛(2.8): 화면 가장자리를 테마 색으로 어둡게 + 아주 옅은 색조. [가장자리 어둠 0~1, 색조 rgba 또는 null]. 장면마다 64×64 한 장을 미리 그려 늘여 쓴다
var VIG = {
  grass: [0.18, null], meadow: [0.16, 'rgba(255,240,180,.04)'], lake: [0.18, null], highland: [0.2, null], jungle: [0.26, 'rgba(60,120,40,.05)'], ruins: [0.26, null],
  coast: [0.16, 'rgba(255,236,190,.04)'], isle: [0.18, 'rgba(180,240,230,.04)'], desert: [0.22, 'rgba(255,170,80,.07)'], canyon: [0.24, 'rgba(255,160,90,.05)'],
  sky: [0.18, 'rgba(220,235,255,.05)'], tomb: [0.36, 'rgba(255,200,120,.04)'], moon: [0.3, 'rgba(180,190,255,.05)'], snow: [0.2, 'rgba(200,230,255,.06)'],
  styx: [0.42, 'rgba(90,110,170,.08)'], swamp: [0.4, 'rgba(90,120,70,.08)'], rot: [0.4, 'rgba(120,120,60,.08)'], plague: [0.4, 'rgba(110,130,60,.08)'],
  nether: [0.44, 'rgba(120,70,170,.08)'], palace: [0.4, 'rgba(140,90,180,.06)'], blood: [0.42, 'rgba(150,50,60,.08)'], war: [0.32, 'rgba(120,100,70,.05)'],
  lava: [0.46, 'rgba(200,60,30,.09)'], volcano: [0.42, 'rgba(200,80,40,.07)']
};
// r8 gfx: 붉은·보랏빛 땅(용암·화산·저승·궁)은 예고 칸의 붉은 채움을 한 단계 밝게(값 = 채움 r,g,b — 글이 말하는 「붉은 칸」 그대로), 적에게 밝은 윗 테를, 아군 피해 숫자를 더 밝게 — 바닥과 같은 색으로 녹지 않게
// (잿빛 변경 blood 는 바닥이 재색이 되어 뺐다 — 기본 빨강이 잘 보인다)
var HOT = { lava: '255,104,128', volcano: '255,104,128', nether: '255,92,84', palace: '255,92,84' };
var stripeC = {};
function stripeTex(col, ph) {      // 16×16 빗금 한 장(8박자) — 예고 칸 위를 흐른다. 칸마다 drawImage 한 번
  var key = col + ph, cv = stripeC[key], g, x, y;
  if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; g = cv.getContext('2d'); g.fillStyle = col;
  for (y = 0; y < 16; y++) for (x = 0; x < 16; x++) if (((x + y + ph) & 7) < 2) g.fillRect(x, y, 1, 1);
  return (stripeC[key] = cv);
}
// r8 gfx: 화면 안에 적의 예고 칸이 떠 있는가 — 그동안은 용병 잡담(game.js mercTalk)을 미룬다. 기술명·실패 사유(엔진 say)는 막지 않는다
function teleHostile(v) {
  var x0 = v.cam.x / 16 - 1, y0 = v.cam.y / 16 - 1, x1 = (v.cam.x + v.W / v.k) / 16, y1 = (v.cam.y + v.H / v.k) / 16, k, T, i, q;
  for (k in v.tele) { T = v.tele[k]; if (T.side !== 'enemy') continue; for (i = 0; i < T.tiles.length; i++) { q = T.tiles[i]; if (q[0] > x0 && q[0] < x1 && q[1] > y0 && q[1] < y1) return true; } }
  return false;
}
// r26: 노린 적의 조준 꺾쇠 — 네 귀퉁이가 천천히 돌고 숨 쉰다. 머리 위에 작은 ▼ 가 1px 까딱인다
function reticle(g, cx, cy, big, t, still, topY) {
  var r = (big ? 13 : 9) + (still ? 0 : Math.sin(t * 6) * 0.8), a = still ? 0 : t * 1.6, L = big ? 5 : 4, i;
  g.save(); g.translate(cx, cy); g.rotate(a);
  for (var pass = 0; pass < 2; pass++) {
    g.fillStyle = pass ? '#ff4d6d' : 'rgba(27,22,38,.85)'; var o = pass ? 0 : 0.5, th = pass ? 1 : 2;
    for (i = 0; i < 4; i++) { g.fillRect(-r - o, -r - o, L + o, th); g.fillRect(-r - o, -r - o, th, L + o); g.rotate(Math.PI / 2); }
  }
  g.restore();
  var by = Math.round(topY - (still ? 0 : (Math.sin(t * 5) > 0 ? 1 : 0)));
  g.fillStyle = '#1b1626'; g.fillRect(cx - 3.5, by - 0.5, 7, 1); g.fillRect(cx - 2.5, by + 0.5, 5, 1); g.fillRect(cx - 1.5, by + 1.5, 3, 1);
  g.fillStyle = '#ff4d6d'; g.fillRect(cx - 2.5, by, 5, 0.75); g.fillRect(cx - 1.5, by + 0.75, 3, 0.75); g.fillRect(cx - 0.5, by + 1.5, 1, 0.75);
}
// r26: 붉은 가장자리 (64×64 한 장을 늘려 그린다) · 기술 색 번쩍임 · 해로운 기술 갈래
function redVignette() {
  var cv, g, gr;
  try { cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; g = cv.getContext('2d'); } catch (x) { return null; }
  gr = g.createRadialGradient(32, 32, 14, 32, 32, 46); gr.addColorStop(0, 'rgba(170,0,24,0)'); gr.addColorStop(0.55, 'rgba(170,0,24,.25)'); gr.addColorStop(1, 'rgba(170,0,24,.95)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return cv;
}
function hexA(hex, a) { var h = String(hex).replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); if (isNaN(n)) return 'rgba(255,255,255,' + a.toFixed(3) + ')'; return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + Math.max(0, a).toFixed(3) + ')'; }
var HOSTILE_FX = { slash: 1, thrust: 1, fire: 1, thunder: 1, quake: 1, dark: 1, wind: 1, arrowRain: 1, poison: 1, arrow: 1, water: 1, holy: 1, meteor: 1, fist: 1, kick: 1, palm: 1 };
function vignette(theme) {
  var v = VIG[theme] || [0.2, null], cv, g, gr;
  try { cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; g = cv.getContext('2d'); } catch (x) { return null; }
  if (v[1]) { g.fillStyle = v[1]; g.fillRect(0, 0, 64, 64); }
  gr = g.createRadialGradient(32, 30, 14, 32, 32, 46); gr.addColorStop(0, 'rgba(10,8,22,0)'); gr.addColorStop(1, 'rgba(10,8,22,' + v[0] + ')');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return cv;
}
function View(cv) {
  this.cv = cv; this.g = cv.getContext('2d');
  this.sim = null; this.maps = null; this.mw = 0; this.mh = 0;
  this.vu = {}; this.parts = []; this.floats = []; this.projs = []; this.lines = []; this.rings = []; this.shapes = []; this.tele = {};
  this.lastAtk = {}; this.lastSkill = null; this.stop = 0; this.stopT = -9; this.flashA = 0; this.theme = null;
  this.lights = []; this.cam = { x: 0, y: 0 }; this.pan = { x: 0, y: 0 }; this.k = 2; this.dpr = 1; this.W = 0; this.H = 0;
  this.inset = { top: 0, bottom: 0 }; this.focus = null; this.sel = null; this.aim = null; this.mark = null; this.tgt = null;
  this.time = 0; this.shake = 0; this.pois = []; this.guide = null; this.snap = true; this.sfxT = {}; this.labels = null; this.decor = []; this.fallen = []; this.cer = {};
}
DS.View = View;
var V = View.prototype;

V.setScene = function (sim, map) {
  this.sim = sim; this.map = map;
  this.maps = [DS.paintMap(map, 0), null];      // r4 hd: 2배 지도는 굽는 데 품이 들어, 물결 둘째 장은 장면이 뜬 뒤 쉴 때 굽는다 (그동안은 첫 장)
  // r30: 둘째 장은 덩이 일감으로 쉴 때 조금씩 (한 번에 굽던 때는 장면이 뜨고 1.5초 뒤 300ms 넘게 멈췄다). 한 조각은 8ms 안쪽, 남으면 다음 쉼에
  var selfM = this, mapM = map, job = null, ric = typeof requestIdleCallback === 'function', bake = function (dl) {
    if (selfM.map !== mapM || selfM.maps[1]) return;
    try {
      if (!job) job = DS.paintMapJob ? DS.paintMapJob(mapM, 1, selfM.maps[0]) : { step: function () { job.cv = DS.paintMap(mapM, 1); job.done = true; return true; } };
      var t0 = performance.now();
      while (!job.step()) { if ((dl && dl.timeRemaining ? dl.timeRemaining() < 2 : false) || performance.now() - t0 > 8) break; }
      if (job.done) { selfM.maps[1] = job.cv; if (selfM.maps[0]) { selfM.maps[0]._src = null; selfM.maps[0]._keep = null; } return; }
    } catch (x) { selfM.maps[1] = null; if (selfM.maps[0]) selfM.maps[0]._src = null; return; }      // 둘째 장이 없으면 첫 장만 (물결이 멈출 뿐)
    if (ric) requestIdleCallback(bake, { timeout: 50 }); else setTimeout(bake, 20);
  };
  if (ric) requestIdleCallback(bake, { timeout: 1500 }); else setTimeout(bake, 400);
  this.mw = map.rows[0].length; this.mh = map.rows.length;
  this.vu = {}; this.parts = []; this.floats = []; this.projs = []; this.lines = []; this.rings = []; this.shapes = []; this.tele = {};
  this.lastAtk = {}; this.lastSkill = null; this.stop = 0; this.flashA = 0; this.theme = map.theme || null; this.hotC = HOT[this.theme] || null; this.hot = !!this.hotC;
  this.amb = []; var am = AMB[this.theme], ai;      // 공기 입자는 장면마다 한 번만 만든다 (프레임마다 새로 만들지 않는다)
  for (ai = 0; am && ai < am[1]; ai++) this.amb.push({ x: Math.random(), y: Math.random(), s: Math.random() });
  this.pois = map.pois || []; this.aim = null; this.mark = null; this.tgt = null; this.guide = null; this.pan = { x: 0, y: 0 }; this.snap = true;
  this.decor = map.decor || []; this.fallen = []; this.cer = {}; this.graves = []; this.dsUsed = {}; this.dq = []; this.dz = null; this.zk = 1; this.slowF = 1; this.lastSk = {};      // r16 fx: 오름 연출은 장면이 바뀌면 끝
  this.vig = vignette(this.theme);
  // r7: 물(1)·용암(2) 칸 표 — 매 프레임 화면 안 칸만 훑는다. 광원 목록 비우기, 장면 전환(디더 페이드인) 시작
  this.lights = []; this.wet = null; this.wetN = 0; this.lavaN = 0;
  this.rain = []; for (ai = 0; RAIN[this.theme] && ai < RAIN[this.theme]; ai++) this.rain.push({ x: Math.random(), y: Math.random(), s: Math.random() });
  if (DS.TILE_CH) { var wy, wx, wk; this.wet = new Uint8Array(this.mw * this.mh);
    for (wy = 0; wy < this.mh; wy++) for (wx = 0; wx < this.mw; wx++) { wk = DS.TILE_CH[map.rows[wy][wx]]; if (wk === 'water' || wk === 'ford') { this.wet[wy * this.mw + wx] = 1; this.wetN++; } else if (wk === 'lava') { this.wet[wy * this.mw + wx] = 2; this.wetN++; this.lavaN++; } } }
  this.lowFx = false; this.ema = 0.016;
  this.trans = { t0: (typeof performance !== 'undefined' ? performance.now() : Date.now()) };
  var self = this;
  sim.units.forEach(function (u) { self.vu[u.id] = self.mkVu(u, true); });
  sim.ev = sim.ev.filter(function (e) { return e.t !== 'spawn'; });
  this.resize();
};
V.mkVu = function (u, instant) { return { u: u, x: u.x, y: u.y, fx: u.x, fy: u.y, tx: u.x, ty: u.y, t: 1, dur: 1, flash: 0, lunge: null, hit: null, alpha: instant ? 1 : 0, dying: -1, dieDur: 0.4, bob: Math.random() * 6, fn: 0, fnT: -9, tn: 0, tnT: -9 }; };
V.resize = function () {
  var cw = this.cv.clientWidth || 360, ch = this.cv.clientHeight || 640;
  this.dpr = Math.min(3, window.devicePixelRatio || 1);
  this.cv.width = Math.round(cw * this.dpr); this.cv.height = Math.round(ch * this.dpr);
  this.W = cw; this.H = ch;
  var kb = Math.min(cw / (Math.min(this.mw || 12, 12.5) * 16), ch / (9.5 * 16));      // 2.2.1 까지의 배율 (폭 12.5칸 · 높이 9.5칸)
  var zo = DS.zoomOf ? DS.zoomOf() : 1, ins = this.inset || {}, kf = this.mw ? Math.min(cw / (this.mw * 16), Math.max(ch * 0.5, ch - (ins.top || 0) - (ins.bottom || 0)) / (this.mh * 16)) : 0;      // 2.2.2: 지도 보기(설정) — 보통은 가로·세로 1.3배 칸 · 단 지도 전체가 화면(위아래 판 사이)에 들어오는 배율보다 더 멀리 빼지는 않는다
  this.k0 = Math.max(kb / zo, Math.min(kb, kf)); this.k = this.k0 * (this.zk || 1);      // r16 fx: k0 = 바탕 배율, k = 죽음 연출의 줌을 곱한 배율
  this.snap = true;
};
V.sfx = function (name, arg) {
  var now = this.time; if (this.sfxT[name] && now - this.sfxT[name] < 0.07) return;
  this.sfxT[name] = now; DS.Audio.sfx(name, arg);
};
V.onScreen = function (tx, ty) {
  var x = tx * 16 - this.cam.x, y = ty * 16 - this.cam.y;
  return x > -32 && y > -32 && x < this.W / this.k + 32 && y < this.H / this.k + 32;
};
V.tileAt = function (cx, cy) {
  var r = this.cv.getBoundingClientRect();
  var fx = ((cx - r.left) / this.k + this.cam.x) / 16, fy = ((cy - r.top) / this.k + this.cam.y) / 16;
  return { x: Math.floor(fx), y: Math.floor(fy), fx: fx, fy: fy };      // 2.2.2: fx·fy — 칸 안의 자리 (멀리 볼 때 유닛을 조금 빗맞혀도 고른다)
};
V.screenOf = function (tx, ty) { return { x: (tx * 16 + 8 - this.cam.x) * this.k, y: (ty * 16 + 8 - this.cam.y) * this.k }; };
V.casting = function () { return teleHostile(this); };      // r8 gfx: 화면 안에 적 예고가 떠 있다 (game.js mercTalk 가 잡담을 미룰 때 본다)

// ── 연출 ──
V.burst = function (tx, ty, cols, n, o) {
  o = o || {};
  if (this.fxK < 1 && n > 1) n = Math.ceil(n * this.fxK);      // 2.2.5 설정 「효과: 가볍게」
  n = Math.min(n, PMAX - this.parts.length);
  var pool = this.pfree || (this.pfree = []), p;
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, sp = (o.spd || 26) * (0.4 + Math.random() * 0.8);
    p = pool.length ? pool.pop() : {};
    p.x = tx * 16 + 8 + (Math.random() - 0.5) * (o.spread || 8); p.y = ty * 16 + 8 + (Math.random() - 0.5) * (o.spread || 8);
    p.vx = Math.cos(a) * sp * (o.flat ? 1 : 0.8); p.vy = Math.sin(a) * sp * 0.8 - (o.up || 0); p.g = o.grav == null ? 30 : o.grav;
    p.life = (o.life || 0.45) * (0.6 + Math.random() * 0.6); p.t = 0; p.c = cols[i % cols.length]; p.s = o.size || (Math.random() < 0.4 ? 2 : 1);
    this.parts.push(p);
  }
};
V.float = function (tx, ty, text, col, o) {
  o = o || {};
  var f = { x: tx * 16 + 8 + (o.dx || 0), y: ty * 16 - 2 + (o.dy || 0), text: String(text), col: col, t: 0, life: (o.life || 0.9) * (o.num && this.spd >= 2 ? 0.7 : 1), num: !!o.num, big: !!o.big, small: !!o.small, delay: o.delay || 0, ow: o.ow || 0,
    s: o.s || 0, pk: o.pk || 0, vx: o.vx || 0, out: o.out || null, slow: !!o.slow, call: !!o.call };      // r26: s 크기 · pk 튀는 크기 · vx 옆으로 · slow 천천히 오름 · call 기술 외침 판
  if (!f.num) {      // 2.8.0: 같은 자리에 아직 떠 있는 글자(전리품 이름·말·별명)가 있으면 한 줄 위로 쌓는다 — 서로 포개져 읽히지 않던 것
    for (var k = 0, moved = true; moved && k < 4; k++) { moved = false;
      for (var j = 0; j < this.floats.length; j++) { var q = this.floats[j];
        if (q.num || q.t > q.life * 0.6) continue;
        if (Math.abs(q.x - f.x) < 28 && Math.abs(q.y - f.y) < 9) { f.y = q.y - 10; moved = true; }
      } }
  }
  if (this.floats.length > 48) { for (var d = 0; d < this.floats.length; d++) if (!this.floats[d].big && !this.floats[d].call) { this.floats.splice(d, 1); break; } }      // r26: 떠 있는 글자는 48개까지 (오래된 보통 숫자부터)
  this.floats.push(f);
  return f;
};
// 전리품이 떨어지는 연출 (game.js 의 showDrop 이 부른다): 아이콘이 튀어 올랐다 내려앉고, 희귀부터 등급색 빛기둥, 전설 장비는 금빛 큰 기둥
// icon: { kind: 'item'|'gear', id } (없으면 빛만)
V.lootFx = function (tx, ty, grade, icon) {
  grade = Math.max(1, Math.min(5, grade || 1));
  var bigL = !!(icon && icon.kind === 'gear' && grade >= 5), cv = null, col = bigL ? '#f6cf57' : (DS.GRADES[grade] || {}).col || '#ffffff';      // 2.1.0: 전설 장비가 금빛 큰 기둥
  try { cv = icon && DS.iconCanvas ? DS.iconCanvas(icon.kind === 'gear' ? 'gear' : 'item', icon.id) : null; } catch (x) { cv = null; }
  if (!this.onScreen(tx, ty)) return;
  if (grade <= 2 && !bigL && this.shapes.length > SMAX / 2) return;      // 3배속 사냥에서 흔한 것은 자리를 양보
  this.shape({ k: 'loot', x: tx, y: ty, dur: bigL ? 2.4 : grade >= 4 ? 1.9 : 1.4, cv: cv, c: col, gr: bigL ? 5 : grade, bigL: bigL, dx: Math.round((Math.random() - 0.5) * 10) });
  if (bigL || grade >= 4) { this.rings.push({ x: tx, y: ty, t: 0.1, dur: 0.5, c: col, r: bigL ? 18 : 12 }); this.flashA = Math.max(this.flashA, bigL ? 0.12 : 0.05); }
};
// ── r16 fx: 오름 연출 (레벨업·단 승급·공훈 계급·합일) — 그 유닛 위에서 바로 보인다 ──
// 시간은 실제 시간(frame 의 dt — 배속·히트스톱과 무관). 유닛마다 하나씩 돌고, 겹치면 합치거나(레벨업끼리: 글자만 새 레벨로) 줄을 선다(최대 3).
// 움직임 줄이기(prefers-reduced-motion)면 돌기·기둥·번쩍임 없이 빛과 글자만 짧게.
var CER = { lv: 0.85, promo: 1.6, rank: 0.75, fuse: 1.7 }, CER_RM = { lv: 0.5, promo: 0.9, rank: 0.5, fuse: 0.9 }, CER_SW = 0.8;      // CER_SW: 승급·합일에서 새 모습으로 바뀌는 순간(초)
function calmFx() { var GO = DS.gfxOpt || {}; if (GO.calm != null) return !!GO.calm; try { return !!(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (x) { return false; } }
DS.calmFx = calmFx;
// 2.2.2 지도 보기: 한 화면에 보이는 칸이 2.2.1 의 몇 배인가 (가로·세로 모두). 기본은 보통(1.3배)
DS.ZOOM = { near: 1, mid: 1.3, far: 1.55 };
DS.ZOOM_KEYS = [['near', '가깝게'], ['mid', '보통'], ['far', '멀리']];
DS.zoomOf = function () { var o = DS.G && DS.G.save && DS.G.save.opt, z = o && DS.ZOOM[o.zoom]; return z || DS.ZOOM.mid; };
V.cere = function (id, kind, o) {
  var v = this.vu[id]; if (!v || v.dying >= 0 || !CER[kind]) return false;
  if (!this.onScreen(v.x, v.y)) return false;      // 화면 밖이면 그리지 않는다 (승급 창도 기다리지 않는다)
  o = o || {}; var cm = calmFx(), c = { k: kind, t: 0, dur: (cm ? CER_RM : CER)[kind], calm: cm, lv: o.lv || 0, from: o.from || 0, to: o.to || 0, txt: o.txt || '', sub: o.sub || '', old: null, sw: false };
  if (kind === 'promo' || kind === 'fuse') { try { c.old = o.old || (DS.unitSpriteName ? DS.unitSpriteName(v.u) : null); } catch (x) { c.old = null; } }      // 바뀌기 전 모습 (바꾸는 순간까지 이 그림)
  var E = this.cer[id] || (this.cer[id] = { c: null, q: [] }), cur = E.c, j;
  if (!cur) { E.c = c; return true; }
  if (kind === 'lv' && (cur.k === 'lv' || cur.k === 'promo') && cur.t < cur.dur * 0.7) { cur.lv = Math.max(cur.lv, c.lv); return true; }      // 합치기: 같은 유닛이 잇달아 오르면 글자만 새 레벨
  if (kind === 'promo' && cur.k === 'lv' && cur.t < 0.3) { c.lv = Math.max(c.lv, cur.lv); E.c = c; return true; }      // 막 시작한 레벨업은 승급으로 바꿔 끼운다
  for (j = 0; j < E.q.length; j++) if (E.q[j].k === kind && kind !== 'rank') { E.q[j].lv = Math.max(E.q[j].lv, c.lv); if (c.to) E.q[j].to = c.to; return true; }
  if (kind === 'lv') for (j = 0; j < E.q.length; j++) if (E.q[j].k === 'promo') { E.q[j].lv = Math.max(E.q[j].lv, c.lv); return true; }
  if (E.q.length < 3) E.q.push(c);
  return true;
};
// 승급 창이 기다릴 시간(ms): 화면에서 승급·합일 연출이 아직 돌고 있으면 끝날 때까지 (줄 선 것까지)
V.cerHold = function () {
  var ms = 0, id, E, j, s;
  for (id in this.cer) { E = this.cer[id]; s = 0;
    if (E.c) s += (E.c.dur - E.c.t) * 1000; for (j = 0; j < E.q.length; j++) s += E.q[j].dur * 1000;
    if ((E.c && (E.c.k === 'promo' || E.c.k === 'fuse')) || E.q.some(function (q) { return q.k === 'promo' || q.k === 'fuse'; })) ms = Math.max(ms, s); }
  return Math.max(0, Math.round(ms));
};
V.cerTick = function (dt) {
  for (var id in this.cer) {
    var E = this.cer[id], c = E.c, v = this.vu[id];
    if (!c) { delete this.cer[id]; continue; }
    if (!v || v.dying >= 0) { delete this.cer[id]; continue; }
    c.t += dt;
    if ((c.k === 'promo' || c.k === 'fuse') && !c.sw && c.t >= (c.calm ? c.dur * 0.45 : CER_SW)) {      // 새 모습으로 바뀌는 순간: 번쩍, 불티, 소리
      c.sw = true; v.dnT = -9;
      if (!c.calm) { this.flashA = Math.max(this.flashA, 0.07); this.burst(v.x, v.y - 0.3, ['#ffe27a', '#fff6d0', '#ffffff', '#f6a93c'], c.k === 'fuse' ? 22 : 18, { spd: 46, up: 22, grav: 40, life: 0.75, spread: 6 }); this.rings.push({ x: v.x, y: v.y + 0.35, t: 0, dur: 0.45, c: '#fff6d0', r: 22 }); }
      this.light(v.x * 16 + 8, v.y * 16 + 4, c.calm ? 14 : 26, '#ffd75e', c.calm ? 0.35 : 0.7, 0.6);
      this.sfx(c.k === 'fuse' ? 'rare' : 'star');
    }
    if (c.k === 'rank' && !c.snd) { c.snd = true; this.sfx('star'); }
    if (c.t >= c.dur) { E.c = E.q.shift() || null; if (!E.c) delete this.cer[id]; }
  }
};
// 지금 그 유닛의 몸: sc = 가로 비율(음수면 뒤집힘 — 한 바퀴 빙글), glow = 흰빛으로 덮이는 정도, lift = 떠오르는 높이(px), old = 옛 모습을 그릴지
function cerPose(c) {
  var t = c.t, f = t / c.dur, sc = 1, glow = 0, lift = 0, p, e;
  if (c.k === 'lv') {
    if (!c.calm) { p = Math.max(0, Math.min(1, (t - 0.06) / 0.5)); e = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p); sc = Math.cos(e * 6.2832); lift = Math.sin(p * Math.PI) * 2.5; }
    glow = Math.max(0, Math.sin(Math.min(1, t / 0.6) * Math.PI)) * 0.6;
  } else if (c.k === 'promo' || c.k === 'fuse') {
    var sw = c.calm ? c.dur * 0.45 : CER_SW;
    if (!c.calm) { p = Math.max(0, Math.min(1, (t - 0.1) / 1.0)); e = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p); sc = Math.cos(e * 6.2832 * 3); lift = t < sw ? Math.min(1, t / 0.5) * 4 : Math.max(0, 4 * (1 - (t - sw) / 0.35)); }
    glow = t < sw ? Math.min(1, t / (sw * 0.85)) : Math.max(0, 1 - (t - sw) / 0.45);
  } else if (c.k === 'rank') glow = Math.max(0, Math.sin(Math.min(1, f * 1.6) * Math.PI)) * 0.35;
  return { sc: sc, glow: glow, lift: lift, old: (c.k === 'promo' || c.k === 'fuse') && !c.sw && c.old };
}
function cerDots(g, cx, cy, r, ry, n, a, col, sz, ph) { g.fillStyle = col; for (var i = 0; i < n; i++) { var an = i / n * 6.2832 + (ph || 0); g.globalAlpha = a * (i % 2 ? 0.6 : 1); g.fillRect(cx + Math.cos(an) * r - sz / 2, cy + Math.sin(an) * ry - sz / 2, sz, sz); } }
function cerStar(g, x, y, s, col) { g.fillStyle = col; g.fillRect(x - s, y - 0.25, s * 2, 0.5); g.fillRect(x - 0.25, y - s, 0.5, s * 2); if (s > 1.4) { g.fillStyle = '#ffffff'; g.fillRect(x - 0.5, y - 0.5, 1, 1); } }
// 빛기둥: 발밑에서 위로 옅어지는 띠 여러 칸 (가산 합성)
function cerPillar(g, cx, fy, h, w, a, col) {
  if (w <= 0.2 || a <= 0.01) return; var n = 10, sh = h / n;
  for (var i = 0; i < n; i++) { var q = 1 - i / n; g.globalAlpha = a * q * q; g.fillStyle = col; g.fillRect(cx - w, fy - (i + 1) * sh, w * 2, sh + 0.2); if (w > 1.6) { g.globalAlpha = a * q * q * 0.9; g.fillStyle = '#ffffff'; g.fillRect(cx - w * 0.35, fy - (i + 1) * sh, w * 0.7, sh + 0.2); } }
}
// 바닥·기둥·고리·불티 (지도 좌표, 유닛을 그린 뒤 그 위에 빛으로 얹는다)
V.drawCer = function (g, front) {      // front: false = 유닛 밑(기둥·바닥 고리 — 몸을 가리지 않게), true = 유닛 위(알갱이·감싸는 빛·별)
  var id, E, c, v, t, f, cx, fy, i, a, r;
  g.globalCompositeOperation = 'lighter';
  for (id in this.cer) {
    E = this.cer[id]; c = E.c; v = this.vu[id]; if (!c || !v) continue;
    t = c.t; f = t / c.dur; cx = v.x * 16 + 8; fy = v.y * 16 + 14; var big = !!v.u.big, hs = big ? 1.4 : 1;
    if (c.k === 'lv') {
      if (!c.calm) {
        var pw = t < 0.12 ? t / 0.12 * 5 : Math.max(0, 5 * (1 - (t - 0.12) / 0.7)), ph = Math.min(1, t / 0.18) * 46 * hs;
        if (!front) { cerPillar(g, cx, fy, ph, pw * 0.5 + 0.6, 0.55 * (1 - f * 0.6), '#ffd75e');
        r = 3 + Math.min(1, t / 0.4) * 10; cerDots(g, cx, fy, r * hs, r * 0.32 * hs, 18, 0.9 * (1 - f), '#ffe9a0', 0.75, t * 3); continue; }
        for (i = 0; i < 7; i++) { var mp = ((t * 1.3 + i * 0.37) % 1), mx = cx + Math.sin(i * 2.1 + t * 4) * 3.5; g.globalAlpha = (1 - mp) * (1 - f); g.fillStyle = i % 2 ? '#ffffff' : '#ffe27a'; g.fillRect(mx - 0.4, fy - 4 - mp * 30 * hs, 0.8, i % 3 ? 0.8 : 1.6); }
      } else if (front) { g.globalAlpha = 0.5 * (1 - f); g.drawImage(glowTex('#ffd75e'), cx - 10, fy - 18, 20, 20); }
    } else if (c.k === 'promo' || c.k === 'fuse') {
      var sw = c.calm ? c.dur * 0.45 : CER_SW, gold = c.k === 'fuse' ? '#ffcf4a' : '#ffd75e';
      if (!c.calm) {
        // 금빛 고리 둘이 발밑에서 퍼진다 (모으는 동안 한 번, 바뀌는 순간 한 번 크게)
        if (!front) {
        var r1 = Math.min(1, t / 0.7); cerDots(g, cx, fy, (4 + r1 * 16) * hs, (4 + r1 * 16) * 0.32 * hs, 28, 0.9 * (1 - r1 * 0.7), gold, 0.9, -t * 2);
        if (t > sw) { var r2 = Math.min(1, (t - sw) / 0.6); cerDots(g, cx, fy, (6 + r2 * 26) * hs, (6 + r2 * 26) * 0.34 * hs, 36, 1 - r2, '#fff6d0', 1, t); }
        var pw2 = t < sw ? 1 + t / sw * 2.5 : Math.max(0, 7 * (1 - (t - sw) / 0.55)), pa = t < sw ? 0.35 + t / sw * 0.3 : 0.75 * Math.max(0, 1 - (t - sw) / 0.7);
        cerPillar(g, cx, fy, 62 * hs, pw2, pa, gold); continue; }
        // 모이는 빛 알갱이 (바뀌기 전): 바깥에서 몸으로 빨려 든다
        if (t < sw) for (i = 0; i < 12; i++) { var gp = ((t * 1.6 + i / 12) % 1), ga = i * 0.5236 + t * 2.5, gr = (1 - gp) * 20 * hs; g.globalAlpha = Math.min(1, gp * 2) * 0.95; g.fillStyle = i % 3 ? gold : '#ffffff'; g.fillRect(cx + Math.cos(ga) * gr - 0.5, fy - 7 + Math.sin(ga) * gr * 0.6 - 0.5, 1, 1); }
        // 감싸는 빛: 몸 둘레에 도는 띠 (앞뒤로 도는 점 둘레)
        if (t < sw + 0.2) { var wa = Math.min(1, t / 0.3) * (t > sw ? 1 - (t - sw) / 0.2 : 1); for (i = 0; i < 16; i++) { var wq = i / 16 * 6.2832 + t * 9, wy = fy - 3 - i * 0.7 * hs; g.globalAlpha = wa * (Math.sin(wq) > 0 ? 1 : 0.35); g.fillStyle = i % 4 ? gold : '#ffffff'; g.fillRect(cx + Math.cos(wq) * 6 * hs - 0.5, wy, 1, 1); } }
        // 바뀐 뒤: 머리 위를 도는 작은 별 셋
        if (t > sw) { var sa = 1 - Math.max(0, (t - sw - 0.4) / (c.dur - sw - 0.4)); for (i = 0; i < 3; i++) { var st = t * 3 + i * 2.094; g.globalAlpha = Math.max(0, sa) * (0.6 + 0.4 * Math.sin(t * 14 + i)); cerStar(g, cx + Math.cos(st) * 8 * hs, fy - 20 * hs + Math.sin(st) * 2.5, 1.6, '#fff2b0'); } }
      } else if (front) { g.globalAlpha = 0.55 * (t < sw ? t / sw : 1 - (t - sw) / (c.dur - sw)); g.drawImage(glowTex(gold), cx - 13, fy - 24, 26, 26); }
    } else if (c.k === 'rank' && front) {
      // 공훈 계급: 머리 위에 작은 별이 반짝 (넷이 차례로)
      for (i = 0; i < 4; i++) { var rt = t - i * 0.08; if (rt <= 0) continue; var rs = Math.sin(Math.min(1, rt / 0.42) * Math.PI); if (rs <= 0) continue; g.globalAlpha = rs; cerStar(g, cx + [-6, 5, -2, 7][i] * hs, fy - [18, 21, 25, 16][i] * hs, 0.8 + rs * (i === 2 ? 1.8 : 1.1), i % 2 ? '#fff6d0' : '#ffe27a'); }
      g.globalAlpha = 0.35 * (1 - f); g.drawImage(glowTex('#ffe27a'), cx - 8, fy - 16, 16, 16);
    }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
};
// 글자 (화면 좌표): 레벨업 「Lv 12」, 승급 띠 「4단 → 5단」, 계급 「정예」
V.drawCerText = function (g) {
  var k = this.k, id, E, c, v, s, x, y, a, t;
  for (id in this.cer) {
    E = this.cer[id]; c = E.c; v = this.vu[id]; if (!c || !v) continue;
    t = c.t; s = this.screenOf(v.x, v.y); var top = s.y - (v.u.big ? 16 : 10) * k;
    if (c.k === 'lv' || c.k === 'rank') {
      var t0 = c.k === 'lv' ? 0.08 : 0.05; if (t < t0) continue; var q = (t - t0) / (c.dur - t0);
      a = q < 0.7 ? 1 : Math.max(0, 1 - (q - 0.7) / 0.3); y = top - 30 - Math.min(1, q * 2.5) * 8;
      var txt = c.k === 'lv' ? 'Lv ' + c.lv : '「' + c.txt + '」', sc = !c.calm && q < 0.12 ? 1 + (1 - q / 0.12) * 0.15 : 1;
      g.globalAlpha = a; g.save(); g.translate(s.x, y); g.scale(sc, sc); label(g, txt, 0, 0, c.k === 'lv' ? '#ffe27a' : '#fff2b0', c.k === 'lv' ? 12 : 10); g.restore();
    } else {
      var sw = c.calm ? c.dur * 0.45 : CER_SW; if (t < sw - 0.05) continue;
      var bq = (t - sw + 0.05) / (c.dur - sw + 0.05), op = Math.min(1, bq / 0.14);
      a = bq > 0.82 ? Math.max(0, 1 - (bq - 0.82) / 0.18) : 1;
      var bt = c.k === 'fuse' ? '합일 · ' + c.to + '단' : c.from + '단 → ' + c.to + '단';
      g.font = cvFont(12); var tw = g.measureText(bt).width, bw = (tw + 30) * (c.calm ? 1 : op), bh = c.sub ? 32 : 20, bx = Math.max(bw / 2 + 4, Math.min(this.W - bw / 2 - 4, s.x)), by = Math.max(this.inset.top + bh, top - 30 - bh / 2 - (c.calm ? 0 : (1 - op) * 6));
      g.globalAlpha = a; g.fillStyle = 'rgba(20,16,30,.86)'; g.fillRect(Math.round(bx - bw / 2), Math.round(by - bh / 2), Math.round(bw), bh);
      g.fillStyle = '#f6cf57'; g.fillRect(Math.round(bx - bw / 2), Math.round(by - bh / 2), Math.round(bw), 1); g.fillRect(Math.round(bx - bw / 2), Math.round(by + bh / 2 - 1), Math.round(bw), 1);
      if (op >= 0.55 || c.calm) {
        g.fillStyle = '#f6cf57'; [-1, 1].forEach(function (d) { var ex = bx + d * (bw / 2 + 1); g.save(); g.translate(ex, by); g.rotate(Math.PI / 4); g.fillRect(-3, -3, 6, 6); g.fillStyle = '#1b1626'; g.fillRect(-1.5, -1.5, 3, 3); g.restore(); g.fillStyle = '#f6cf57'; });
        label(g, bt, bx, by + (c.sub ? -6 : 0.5), '#ffe9a0', 12);
        if (c.sub) label(g, c.sub, bx, by + 8, '#efe6d0', 10);
      }
    }
  }
  g.globalAlpha = 1;
};
// 모양 이펙트(베기 호·찌르기·번개·빛기둥·운석·불기둥·넋)는 parts 와 따로 shapes 에 담아 픽셀 사각형으로 그린다
V.shape = function (o) { if (this.shapes.length < SMAX) { o.t = -(o.d || 0); this.shapes.push(o); } };      // 2.2.5: d = 늦게 시작 (초)
// 화면만 잠깐 멈춘다(시뮬은 그대로 돈다). 3배속에서 끊기지 않게 0.3초에 한 번까지만.
V.hitStop = function (d) { if (this.time - this.stopT < 0.3) return; this.stopT = this.time; this.stop = d; };
function boltPts(x, y) {
  var pts = [], px = x * 16 + 8 + (Math.random() * 12 - 6), py = y * 16 - 62, ex = x * 16 + 8, ey = y * 16 + 9, i;
  pts.push([px, py]);
  for (i = 1; i < 6; i++) pts.push([ex + (px - ex) * (1 - i / 6) + (i % 2 ? 4 : -4) + Math.random() * 3, py + (ey - py) * i / 6]);
  pts.push([ex, ey]);
  return pts;
}
function meteorEnd(p) {
  this.burst(p.x, p.y, FXC.meteor, 12, { up: 30, grav: 100, spd: 44, life: 0.6, size: 2 });
  this.rings.push({ x: p.x, y: p.y, t: 0, dur: 0.35, c: '#ffd75e', r: 12 });
  this.shake = Math.max(this.shake, 0.4);
}
V.fx = function (name, tiles, from) {
  var cols = FXC[name] || FXC.slash, self = this, n = 0;
  this.sfx(FXS[name] || 'skill');
  if (from) this.lastSkill = { x: from[0], y: from[1], t: this.time };
  (tiles || []).forEach(function (t) {
    if (n++ > 30 || !self.onScreen(t[0], t[1])) return;
    var x = t[0], y = t[1], a = from && (from[0] !== x || from[1] !== y) ? Math.atan2(y - from[1], x - from[0]) : 0.7;
    var lc = LIGHTC[name]; if (lc && n <= 12) self.light(x * 16 + 8, y * 16 + 8, lc[1], lc[0], lc[2], lc[3]);      // r7: 기술 자리에 빛
    switch (name) {
      case 'fire': self.shape({ k: 'flame', x: x, y: y, dur: 0.5 }); self.burst(x, y, cols, 7, { up: 34, grav: -20, life: 0.55, spread: 12 }); break;
      case 'water': self.burst(x, y, cols, 10, { up: 20, grav: 90, life: 0.5, spread: 12 }); self.rings.push({ x: x, y: y, t: 0, dur: 0.35, c: cols[0], r: 10 }); self.rings.push({ x: x, y: y, t: -0.1, dur: 0.35, c: cols[1], r: 6 }); break;
      case 'thunder': self.shape({ k: 'bolt', x: x, y: y, dur: 0.26, pts: boltPts(x, y) }); self.burst(x, y, cols, 6, { spd: 40, life: 0.25 }); self.flashA = Math.max(self.flashA, 0.07); break;
      case 'holy': self.shape({ k: 'pillar', x: x, y: y, dur: 0.4 }); self.burst(x, y, cols, 8, { up: 30, grav: -30, life: 0.6 }); break;
      case 'dark': self.burst(x, y, cols, 12, { spd: 18, grav: -15, life: 0.6, spread: 14 }); self.rings.push({ x: x, y: y, t: 0, dur: 0.4, c: cols[0], r: 9, inv: true }); break;
      case 'heal': case 'healDark': self.burst(x, y, cols, 8, { up: 26, grav: -30, spd: 8, life: 0.7, spread: 12 }); self.rings.push({ x: x, y: y, t: 0, dur: 0.45, c: cols[0], r: 8, rise: true }); break;
      case 'buffRed': case 'buffBlue': case 'buffGold': self.rings.push({ x: x, y: y, t: 0, dur: 0.5, c: cols[0], r: 10, rise: true }); self.burst(x, y, cols, 5, { up: 30, grav: -20, spd: 6, life: 0.6 }); break;
      case 'poison': self.burst(x, y, cols, 9, { up: 16, grav: -18, spd: 10, life: 0.8, spread: 14, size: 2 }); break;
      case 'quake': self.burst(x, y, cols, 9, { up: 40, grav: 160, spd: 30, life: 0.5, size: 2 }); self.rings.push({ x: x, y: y, t: 0, dur: 0.3, c: cols[2], r: 11 }); self.shake = Math.max(self.shake, 0.3); break;
      case 'meteor': self.shape({ k: 'meteor', x: x, y: y, dur: 0.2, end: meteorEnd }); break;
      case 'wind': self.burst(x, y, cols, 7, { spd: 50, grav: 0, life: 0.3, flat: true }); self.shape({ k: 'slash', x: x, y: y, a: a, s: n % 2 ? 1 : -1, dur: 0.22, c: '#cdd5e3', big: true }); break;
      case 'arrowRain': for (var i = 0; i < 3; i++) { var ox = Math.random() * 12 - 6; self.lines.push({ x0: x * 16 + 14 + ox, y0: y * 16 - 40 - i * 8, x1: x * 16 + 8 + ox, y1: y * 16 + 8, c: cols[0], life: 0.18 + i * 0.05, t: 0 }); } self.burst(x, y, cols, 3, { spd: 22, life: 0.2 }); break;
      case 'arrow':
        if (from) self.projs.push({ x0: from[0] * 16 + 8, y0: from[1] * 16 + 5, x1: x * 16 + 8, y1: y * 16 + 6, t: 0, dur: 0.1, arrow: true });
        self.burst(x, y, cols, 4, { spd: 30, life: 0.2 }); break;
      case 'thrust': self.shape({ k: 'thrust', x: x, y: y, a: a, dur: 0.2, c: '#fff0a0', big: true }); self.burst(x, y, cols, 4, { spd: 30, life: 0.2 }); break;
      case 'fist':      // 2.2.5 연환권: 주먹 · 주먹 · 발 — 세 번의 작은 충격이 잇달아 (마지막이 가장 크다)
        for (var fj = 0; fj < 3; fj++) self.shape({ k: 'impact', x: x + (fj - 1) * 0.16, y: y - 0.12 * (fj % 2), dur: 0.2, c: fj === 2 ? '#ffffff' : cols[0], r: 5 + fj * 2, d: fj * 0.08 });
        self.shape({ k: 'slash', x: x, y: y, a: a, s: -1, dur: 0.2, c: cols[2], big: true, d: 0.16 });
        self.burst(x, y, cols, 6, { spd: 36, life: 0.25 }); break;
      case 'kick':      // 비연각: 큰 발차기 호 + 내려앉는 먼지 고리
        self.shape({ k: 'slash', x: x, y: y, a: a, s: 1, dur: 0.24, c: cols[1], big: true });
        self.shape({ k: 'impact', x: x, y: y, dur: 0.24, c: cols[2], r: 9, d: 0.06 });
        self.rings.push({ x: x, y: y + 0.3, t: -0.05, dur: 0.35, c: '#d8c39a', r: 12 }); self.burst(x, y, cols, 7, { spd: 40, up: 10, life: 0.3 }); break;
      case 'palm':      // 기공장: 손바닥 앞에서 퍼지는 기의 물결 (두 겹 고리 · 흰 심)
        if (from) self.lines.push({ x0: from[0] * 16 + 8, y0: from[1] * 16 + 6, x1: x * 16 + 8, y1: y * 16 + 7, c: cols[0], life: 0.16, t: 0, w: 3 });
        self.shape({ k: 'impact', x: x, y: y, dur: 0.28, c: cols[1], r: 10 });
        self.rings.push({ x: x, y: y, t: 0, dur: 0.4, c: cols[0], r: 16, w: 2 }); self.rings.push({ x: x, y: y, t: -0.08, dur: 0.35, c: cols[1], r: 9 });
        self.burst(x, y, cols, 9, { spd: 42, life: 0.35, flat: true }); break;
      case 'chi':      // 부동심: 기가 몸으로 모였다가 금빛 고리로 선다
        self.rings.push({ x: x, y: y, t: 0, dur: 0.45, c: cols[2], r: 18, inv: true, w: 2 }); self.rings.push({ x: x, y: y, t: -0.3, dur: 0.6, c: cols[0], r: 12, rise: true });
        self.burst(x, y, cols, 10, { up: 32, grav: -24, spd: 10, life: 0.8 }); break;
      default:
        self.shape({ k: 'slash', x: x, y: y, a: a, s: n % 2 ? 1 : -1, dur: 0.22, c: cols[1] || '#fff0a0', big: true });
        self.burst(x, y, cols, 5, { spd: 36, life: 0.22 });
    }
    // 2.2.5: 보통 기술도 조금 더 — 맞는 칸마다 짧은 충격 빛과 불티 둘 (가볍게 · 느린 기기면 생략)
    if (!self.lite && HOSTILE_FX[name] && n <= 6) {
      self.shape({ k: 'impact', x: x, y: y, dur: 0.24, c: cols[1] || cols[0], r: 9, d: 0.02 }); self.burst(x, y, ['#ffffff', cols[0]], 3, { spd: 38, up: 10, life: 0.32, size: 2 });
      if (n <= 3) self.rings.push({ x: x, y: y, t: -0.03, dur: 0.3, c: cols[0], r: 10 });
    }
  });
  // 2.2.5: 한 대상을 노린 기술은 쓰는 이에게서 대상까지 짧은 빛줄기
  if (!this.lite && from && tiles && tiles.length === 1 && HOSTILE_FX[name] && name !== 'palm' && name !== 'arrow' && (Math.abs(tiles[0][0] - from[0]) + Math.abs(tiles[0][1] - from[1])) >= 1 && this.onScreen(tiles[0][0], tiles[0][1]))
    this.lines.push({ x0: from[0] * 16 + 8, y0: from[1] * 16 + 6, x1: tiles[0][0] * 16 + 8, y1: tiles[0][1] * 16 + 7, c: cols[0], life: 0.14, t: 0, w: 2 });
};
// ── 2.2.5 필살기: 쓰는 이 둘레만 밝게 (나머지는 잠깐 어둡게) · 병과 빛깔의 큰 고리와 불티 · 맞는 칸마다 충격 · 병과마다 다른 꼴 ──
//   멈춤은 짧게 (화면만, 0.06초) · 움직임 줄이기면 흔들림 · 멈춤 없이 빛만 · 「효과: 가볍게」 · 느린 기기면 알갱이를 줄인다
V.ultBlast = function (e, S, u) {
  var v = this.vu[u.id]; if (!v) return;
  var cm = this.calmN, q = this.lite ? 0.5 : 1, U = ULTFX[ultCls(S, u)] || ULTFX.inf, c = U.c, self = this, n = 0;
  var hostile = S.eff.some(function (x) { return x.t === 'dmg' || x.t === 'status' || (x.t === 'buff' && x.p < 0); }), tiles = e.tiles || [];
  this.ultDim = { t: 0, dur: cm ? 0.4 : 0.65, id: u.id }; this.ultHit = { id: u.id, t: this.time, c: c[0] };
  this.rings.push({ x: v.x, y: v.y, t: 0, dur: 0.38, c: c[1], r: 24, inv: true, w: 2 });
  this.rings.push({ x: v.x, y: v.y, t: -0.14, dur: 0.5, c: c[0], r: 30, w: 2 });
  this.burst(v.x, v.y, c, Math.round(16 * q), { spd: 48, up: 12, life: 0.6, size: 2 });
  this.light(v.x * 16 + 8, v.y * 16 + 6, 36, c[0], 0.8, 0.7);
  var far = null, fd = -1;
  tiles.forEach(function (t, i) {
    if (n >= 12 || !self.onScreen(t[0], t[1])) return; n++;
    var x = t[0], y = t[1], d = Math.min(0.3, i * 0.035), dd = Math.abs(x - v.x) + Math.abs(y - v.y);
    if (dd > fd) { fd = dd; far = t; }
    if (hostile) {
      self.shape({ k: 'impact', x: x, y: y, dur: 0.34, c: c[0], r: 11, d: d + 0.04 });
      self.rings.push({ x: x, y: y, t: -d, dur: 0.45, c: c[2], r: 17, w: 2 });
      if (i < 6) self.burst(x, y, c, Math.round(8 * q), { spd: 42, up: 14, life: 0.45 });
    } else {
      self.rings.push({ x: x, y: y, t: -d, dur: 0.6, c: c[0], r: 13, rise: true, w: 2 });
      if (i < 8) self.burst(x, y, c, Math.round(5 * q), { up: 34, grav: -26, spd: 8, life: 0.8 });
    }
    if (i >= 6) return;
    switch (U.k) {
      case 'slash': if (hostile) { self.shape({ k: 'slash', x: x, y: y, a: 0.75, s: 1, dur: 0.26, c: c[1], big: true, d: d }); self.shape({ k: 'slash', x: x, y: y, a: -0.75, s: -1, dur: 0.26, c: c[0], big: true, d: d + 0.07 }); } break;
      case 'water': self.burst(x, y, c, Math.round(9 * q), { up: 46, grav: 140, spd: 16, life: 0.6, spread: 10 }); break;
      case 'arrow': for (var k = 0; k < 4; k++) { var ox = Math.random() * 14 - 7; self.lines.push({ x0: x * 16 + 16 + ox, y0: y * 16 - 50 - k * 9, x1: x * 16 + 8 + ox, y1: y * 16 + 8, c: k % 2 ? c[1] : c[0], life: 0.16 + k * 0.05, t: 0, w: 1 }); } break;
      case 'fist': if (i < 2) for (var j = 0; j < 5; j++) self.shape({ k: 'impact', x: x + (Math.random() - 0.5) * 0.6, y: y - 0.2 + (Math.random() - 0.5) * 0.5, dur: 0.18, c: j % 2 ? '#ffffff' : c[0], r: 6 + j, d: 0.05 + j * 0.06 }); break;
      case 'holy': self.shape({ k: 'pillar', x: x, y: y, dur: 0.5, d: d }); break;
      case 'dark': self.rings.push({ x: x, y: y, t: -d, dur: 0.5, c: c[1], r: 14, inv: true }); self.burst(x, y, c, Math.round(6 * q), { up: 20, grav: -40, spd: 8, life: 0.9, spread: 12 }); break;
    }
  });
  if (U.k === 'thrust' && far) { this.lines.push({ x0: v.x * 16 + 8, y0: v.y * 16 + 6, x1: far[0] * 16 + 8, y1: far[1] * 16 + 7, c: c[0], life: 0.26, t: 0, w: 4 }); this.lines.push({ x0: v.x * 16 + 8, y0: v.y * 16 + 6, x1: far[0] * 16 + 8, y1: far[1] * 16 + 7, c: '#ffffff', life: 0.18, t: 0, w: 1 }); }
  if (U.k === 'wind') for (var w = 0; w < 3; w++) this.rings.push({ x: v.x, y: v.y, t: -w * 0.08, dur: 0.45, c: w % 2 ? c[1] : c[0], r: 22 + w * 10 });
  if (U.k === 'arcane') this.shape({ k: 'sigil', x: far ? far[0] : v.x, y: far ? far[1] : v.y, dur: 0.7, c: c[0], r: hostile ? 24 : 20 });
  if (U.k === 'fist' && !hostile) for (var r2 = 0; r2 < 3; r2++) this.rings.push({ x: v.x, y: v.y, t: -r2 * 0.1, dur: 0.5, c: r2 % 2 ? c[1] : c[2], r: 16 + r2 * 6, rise: true });
  if (!cm) { this.shake = Math.max(this.shake, hostile ? 0.3 : 0.18); this.hitStop(0.06); }
  this.flashA = Math.max(this.flashA, cm ? 0.04 : 0.1); this.flashC = c[0];
};
// 필살기의 어둠 (화면 좌표): 쓰는 이 둘레만 둥글게 밝고, 0.65초에 걸쳐 들어왔다 빠진다
V.drawUltDim = function (g) {
  var d = this.ultDim, v = d && this.vu[d.id]; if (!d) return;
  if (!DS.fxFreeze) d.t += this.rdt || 0.016; var f = d.t / d.dur;
  if (f >= 1 || !v) { this.ultDim = null; return; }
  var a = (f < 0.12 ? f / 0.12 : f < 0.5 ? 1 : 1 - (f - 0.5) / 0.5) * (this.calmN ? 0.25 : 0.55) * (this.lite ? 0.8 : 1), tex = spotTex();
  var sx = (v.x * 16 + 8 - this.cam.x) * this.k, sy = (v.y * 16 + 4 - this.cam.y) * this.k, R = 30 * this.k, W = this.W, H = this.H;
  g.globalAlpha = Math.max(0, a); g.fillStyle = 'rgb(6,4,12)';
  if (tex) {
    g.imageSmoothingEnabled = true; g.drawImage(tex, sx - R, sy - R, R * 2, R * 2); g.imageSmoothingEnabled = false;
    g.fillRect(0, 0, W, Math.max(0, sy - R)); g.fillRect(0, sy + R, W, Math.max(0, H - sy - R)); g.fillRect(0, sy - R, Math.max(0, sx - R), R * 2); g.fillRect(sx + R, sy - R, Math.max(0, W - sx - R), R * 2);
  } else g.fillRect(0, 0, W, H);
  g.globalAlpha = 1;
};
// 엔진 이벤트 → 연출
V.handle = function (evs) {
  var self = this, sim = this.sim;
  evs.forEach(function (e) { try { self.handle1(e, sim); } catch (x) { if (DS.loopErr) DS.loopErr(x, 'fx:' + e.t); } });      // r30: 사건 하나의 그림 오류가 나머지를 막지 않게
};
V.handle1 = function (e, sim) {
  var self = this;
  (function () {
    var v = e.id ? self.vu[e.id] : null, u = v && v.u, on = u && self.onScreen(u.x, u.y);
    switch (e.t) {
      case 'spawn': u = sim.byId[e.id]; if (u) { self.vu[u.id] = self.mkVu(u, false); if (self.onScreen(u.x, u.y) && u.side === 'enemy' && sim.t > 1) { self.burst(u.x, u.y, FXC.dark, 8, { spd: 14 }); self.rings.push({ x: u.x, y: u.y, t: 0, dur: 0.35, c: '#b181e6', r: 9, inv: true }); self.sfx('spawn'); } } break;
      case 'move': if (v) { v.fx = v.x; v.fy = v.y; v.tx = e.x; v.ty = e.y; v.t = 0; v.dur = e.dur; if (on && u.side === 'ally' && u.role === 'cmd' && Math.random() < 0.3) self.sfx('step'); } break;
      case 'leap': case 'knock': case 'blink':
        if (v) {
          if (e.t === 'blink') { self.burst(v.x, v.y, FXC.dark, 10, { spd: 20 }); v.x = e.x; v.y = e.y; v.t = 1; v.tx = e.x; v.ty = e.y; self.burst(e.x, e.y, FXC.dark, 10, { spd: 20 }); if (on) self.sfx('blink'); }
          else { v.fx = v.x; v.fy = v.y; v.tx = e.x; v.ty = e.y; v.t = 0; v.dur = 0.16; if (on && e.t === 'leap') self.sfx('leap'); }
        } break;
      case 'atk':
        if (!v) break;
        var dx = e.tx - u.x, dy = e.ty - u.y, d = Math.max(1, Math.abs(dx) + Math.abs(dy));
        v.lunge = { dx: dx / d, dy: dy / d, t: 0 };
        if (e.tid) { var la = self.lastAtk[e.tid] || (self.lastAtk[e.tid] = { x: 0, y: 0, t: 0 }); la.x = u.x; la.y = u.y; la.t = self.time; }      // 맞은 쪽이 밀릴 방향
        if (!on) break;
        var ec = '#ffffff';
        if (u.enh > 0) {      // r11: 맞힐 때의 빛도 강화 단계 표(DS.ENH_FX)를 따른다 — +3 부터 한 단계마다 수·크기·고리가 는다
          var en2 = Math.max(1, DS.enhStep(u.enh) || Math.min(2, u.enh)), et = DS.enhTier(u.enh); ec = DS.enhColor(u.enh);      // 2.1.0: 빛의 세기는 빛 단계(+20 → 10)
          self.burst(e.tx, e.ty, [ec, '#ffffff'], 2 + en2, { spd: 26 + en2 * 4, life: 0.25 + en2 * 0.025, size: en2 >= 7 ? 2 : 1 });
          if (en2 >= 4) self.rings.push({ x: e.tx, y: e.ty, t: 0, dur: 0.3, c: ec, r: 6 + en2 });
          if (en2 >= 7) self.lines.push({ x0: u.x * 16 + 8, y0: u.y * 16 + 4, x1: e.tx * 16 + 8, y1: e.ty * 16 + 8, c: ec, life: 0.16, t: 0, w: en2 >= 9 ? 3 : 2 });
          if (en2 >= 10) self.shake = Math.max(self.shake, 0.12);
        }
        if (e.kind === 'arrow') { self.projs.push({ x0: u.x * 16 + 8, y0: u.y * 16 + 5, x1: e.tx * 16 + 8, y1: e.ty * 16 + 6, t: 0, dur: 0.1, arrow: true }); self.sfx('arrow'); }
        else if (e.kind === 'bolt') { self.projs.push({ x0: u.x * 16 + 8, y0: u.y * 16 + 4, x1: e.tx * 16 + 8, y1: e.ty * 16 + 6, t: 0, dur: 0.14, c: u.side === 'ally' ? '#c9a0ff' : '#ff6a8a' }); self.sfx('magic'); }
        else {
          var aa = Math.atan2(dy, dx);
          if (e.kind === 'thrust') self.shape({ k: 'thrust', x: e.tx, y: e.ty, a: aa, dur: 0.18, c: u.enh > 0 ? ec : '#f1ead9' });
          else self.shape({ k: 'slash', x: e.tx, y: e.ty, a: aa, s: v.sw = -(v.sw || 1), dur: 0.18, c: u.enh > 0 ? ec : (u.side === 'ally' ? '#fff0a0' : '#ffc0c8'), big: !!u.big });
          self.sfx(e.kind === 'thrust' ? 'slash' : 'punch');
        }
        break;
      case 'hit':
        if (!v) break;
        v.lastHt = e.type; v.flash = u.role === 'boss' ? 0.09 : 0.06;      // r8: 전신 흰 섬광을 절반으로 (3배속 난전의 흰 덩어리)
        // 밀림: 때린 쪽에서 멀어지는 방향 (엔진이 by 를 주면 그것을, 아니면 직전의 atk·기술에서)
        var src = e.by && sim.byId[e.by] ? sim.byId[e.by] : null, lh = self.lastAtk[u.id], kx = 0, ky = 0;
        if (src) { kx = u.x - src.x; ky = u.y - src.y; }
        else if (lh && self.time - lh.t < 0.5) { kx = u.x - lh.x; ky = u.y - lh.y; }
        else if (self.lastSkill && self.time - self.lastSkill.t < 0.5) { kx = u.x - self.lastSkill.x; ky = u.y - self.lastSkill.y; }
        var kd = Math.sqrt(kx * kx + ky * ky);
        if (e.type !== 'poison') v.hit = kd > 0 ? { dx: kx / kd, dy: ky / kd, t: -0.3, k: e.crit ? 4 : 2.5 } : { dx: 0, dy: -1, t: 0, k: 1.5 };
        if (!on) break;
        var ally = u.side === 'ally', fn = self.time - v.fnT < 0.5 ? v.fn + 1 : 0;      // 한 유닛에 숫자가 겹치지 않게 번갈아 비킨다
        v.fn = fn; v.fnT = self.time;
        // r26 숫자 v2: 색 = 누가 누구에게 (흰 = 보통 · 크림 = 고른 가문이 · 금 = 치명타 · 붉은 = 아군이 맞음 · 초록 = 독), 크기 = 무게. 튀었다가 호를 그리며 오른다
        var mineHit = !ally && !!e.by && e.by === self.sel;
        var ncol = e.crit ? '#ffd24a' : e.type === 'poison' ? '#9ccc3c' : ally ? (self.hot ? '#ffe0e6' : '#ff5a6a') : mineHit ? '#fff3c4' : '#ffffff', lf = v.lastNum;      // r8: 붉은 땅에서는 아군 피해 숫자를 더 밝게 + 굵은 외곽선
        var nS = e.crit ? 2.5 : e.type === 'poison' ? 1 : mineHit ? 1.75 : 1.5, nP = e.crit ? 3.4 : e.type === 'poison' ? 1 : mineHit ? 2.4 : ally ? 2 : 2.1;
        var uh = !ally && self.ultHit && e.by === self.ultHit.id && self.time - self.ultHit.t < 0.3;      // 2.2.5: 필살기가 맞힌 숫자는 크게 · 충격 빛
        if (uh) { nS *= 1.4; nP *= 1.5; self.shape({ k: 'impact', x: u.x, y: u.y, dur: 0.26, c: self.ultHit.c || '#ffd24a', r: u.big ? 12 : 9 }); }
        // 3배속 난전: 같은 유닛에 아주 짧은 사이로 들어온 보통 피해는 숫자 하나로 합친다 (겹친 숫자 더미 대신 커지는 숫자 하나) — 합칠 때 다시 튄다
        if (uh && !e.crit) ncol = '#fff0b0';
        if (lf && !e.crit && (!lf.big || uh) && lf.col === ncol && lf.t < (self.spd >= 2 ? 0.25 : 0.12) && self.floats.indexOf(lf) >= 0 && /^[0-9]+$/.test(lf.text) && typeof e.v === 'number') { lf.text = String(+lf.text + e.v); lf.t = Math.min(lf.t, 0.04); }
        else v.lastNum = self.float(u.x, u.y, e.crit ? e.v + '!' : e.v, ncol, { num: true, big: e.crit || uh, s: nS, pk: nP, vx: [0, -14, 14, -10, 10][fn % 5], out: e.crit ? '#5a2a00' : null, dx: [0, -4, 4, -2, 2][fn % 5] + Math.random() * 2 - 1, dy: -Math.min(fn, 3) * 5, ow: self.hot && ally ? 0.75 : 0, life: e.crit ? 1.1 : 0.8 });
        self.burst(u.x, u.y, ['#ffffff', ally ? '#ff8a9a' : '#ffd75e'], e.crit ? 7 : 3, { spd: 30, life: 0.25 });
        if (!ally && e.by && e.by === self.sel && !e.crit) { self.combo = self.time - (self.comboT || -9) < 1.2 ? Math.min(4, (self.combo || 0) + 1) : 0; self.comboT = self.time; }      // r26: 고른 가문의 연타는 소리가 조금씩 오른다
        self.sfx(e.crit ? 'crit' : 'hit', !e.crit && !ally && e.by === self.sel ? Math.pow(2, (self.combo || 0) * 2 / 12) : 1);
        if (e.crit) v.barFlash = 0.08;
        if (e.crit) { self.shape({ k: 'impact', x: u.x, y: u.y, dur: 0.22, c: '#ffd24a', r: u.big ? 8 : 5 }); self.hitStop(0.045); if (u.role === 'boss') self.flashA = Math.max(self.flashA, 0.08); }      // r8: 화면 번쩍임은 보스가 치명타를 맞을 때만
        if (e.crit || u.role === 'cmd') self.shake = Math.max(self.shake, e.crit ? 0.18 : 0.08);
        break;
      case 'miss': case 'dodge':      // 엔진이 빗나감을 알려 주면: 옆으로 살짝 비키고 글자
        if (!v) break;
        v.hit = { dx: u.face < 0 ? 1 : -1, dy: 0, t: 0, k: 3 };
        if (on) { self.float(u.x, u.y, 'MISS', '#cdd5e3', { num: true, s: 1, pk: 1.3, vx: u.face < 0 ? 8 : -8, dy: -4, life: 0.7 }); self.sfx('miss'); }      // r26: 픽셀 글자 MISS, 옆으로 흘러간다
        break;
      case 'heal': if (on) { self.float(u.x, u.y, '+' + Math.round(e.v), '#7fe07a', { num: true, s: 1.5, pk: 2, slow: true, life: 1 }); } break;
      case 'mana': if (on) { self.float(u.x, u.y, '+' + Math.round(e.v), '#62b0ee', { num: true, s: 1.25, pk: 1.6, slow: true, life: 1 }); self.sfx('heal'); } break;
      case 'item': if (on) { self.burst(u.x, u.y, FXC.heal, 6, { up: 20, grav: -20, spd: 6 }); self.sfx(e.key === 'endo' ? 'buff' : 'heal'); if (e.key === 'endo') self.float(u.x, u.y, '기운초!', '#f6cf57', { life: 1 }); } break;
      case 'skill': if (self.lastSk) self.lastSk[e.id] = { fx: e.fx, t: self.time }; self.fx(e.fx, e.tiles, e.from); if (v && on) { var cc = (FXC[e.fx] || FXC.slash)[0]; v.cast = { t: 0, c: cc }; self.light(v.x * 16 + 8, v.y * 16 + 6, 14, cc, 0.5, 0.45); }
        var SU = DS.SKILLS && DS.SKILLS[e.sk]; if (SU && SU.ult && u && u.side === 'ally' && (on || u.role === 'cmd')) { try { self.ultBlast(e, SU, u); } catch (x) { if (DS.loopErr) DS.loopErr(x, 'ultBlast'); } }      // 2.2.5 필살기 연출
        // r26: 내가 고른 가문(또는 수동 가문)의 기술은 더 무겁게 — 멈칫 · 흔들림 · 그 색의 번쩍임 · 머리 위 기술 이름 판
        if (v && on && u.side === 'ally' && u.role === 'cmd' && (e.id === self.sel || !u.auto) && !/^i_/.test(e.sk || '')) {
          var hostile = HOSTILE_FX[e.fx], cm = calmFx();
          if (!cm) { self.hitStop(hostile ? 0.05 : 0.03); self.shake = Math.max(self.shake, hostile ? 0.14 : 0.06); }
          self.flashA = Math.max(self.flashA, (hostile ? 0.06 : 0.04) * (cm ? 0.5 : 1)); self.flashC = (FXC[e.fx] || FXC.slash)[0];
          var SN = DS.SKILLS && DS.SKILLS[e.sk]; if (SN && SN.name) self.float(u.x, u.y, SN.name, '#fff3c4', { dy: -14, life: 1, call: true });
        }
        break;
      case 'say': if (on) self.float(u.x, u.y, e.text, u.side === 'ally' ? '#fff3c4' : '#ffb0bc', { dy: -8, life: 1.1 }); break;
      case 'aura': if (v && on && (e.r || 2) < 2) { self.rings.push({ x: v.x, y: v.y, t: 0, dur: 0.4, c: '#9ef08a', r: 14 }); break; }      // 곁 1칸: 작은 고리만 (연환권마다 소리를 내지 않는다)
        if (v && on) { self.rings.push({ x: v.x, y: v.y, t: 0, dur: 0.55, c: '#9ef08a', r: (e.r || 2) * 15 }); self.rings.push({ x: v.x, y: v.y, t: -0.12, dur: 0.5, c: '#fff6d0', r: (e.r || 2) * 10 }); self.burst(v.x, v.y, ['#9ef08a', '#fff6d0'], 6, { up: 22, grav: -20, spd: 12, life: 0.7, spread: 20 }); self.sfx('heal'); } break;      // 2.2.5 기공: 둘레가 낫는다
      case 'mend':      // 2.2.5 기 전하기: 쓰는 이에게서 다친 아군까지 옅은 초록 기 줄기 · 그 자리에 작은 고리
        var mv2 = self.vu[e.tid]; if (!v || !mv2 || !(on || self.onScreen(mv2.u.x, mv2.u.y))) break;
        if (mv2 !== v) self.lines.push({ x0: v.x * 16 + 8, y0: v.y * 16 + 6, x1: mv2.x * 16 + 8, y1: mv2.y * 16 + 6, c: '#b6f5a0', life: 0.22, t: 0, w: 1, zig: !self.lite });
        self.rings.push({ x: mv2.x, y: mv2.y, t: 0, dur: 0.4, c: '#9ef08a', r: 8, rise: true }); break;
      case 'ctr':      // 2.2.5 되치기 (부동심)
        var tv = self.vu[e.tid]; if (!v || !on) break;
        if (tv) self.shape({ k: 'impact', x: tv.x, y: tv.y, dur: 0.22, c: '#ffd28a', r: 8 });
        if (self.time - (v.ctrT || -9) > 1.5) { v.ctrT = self.time; self.float(u.x, u.y, '되치기', '#ffd28a', { dy: -10, life: 0.8 }); }
        v.lunge = tv ? { dx: Math.sign(tv.x - v.x) || 0, dy: Math.sign(tv.y - v.y) || 0, t: 0 } : v.lunge; self.sfx('punch'); break;
      case 'cast': self.tele[e.tid] = { tiles: e.tiles, dur: e.dur, t: 0, side: e.side }; self.sfx('warn'); break;
      case 'castEnd': delete self.tele[e.tid]; break;
      case 'buff': case 'status':
        if (!on) break;
        if (self.spd >= 2 && u.role === 'merc' && e.t === 'buff') break;      // r36: 가장 빠른 배속(2): 용병마다 뜨는 버프 글자는 생략 (고리 연출은 기술 쪽에서 이미 나온다)
        var tn = self.time - v.tnT < 0.8 ? v.tn + 1 : 0;      // 글자도 한 줄씩 위로 쌓는다
        v.tn = tn; v.tnT = self.time;
        if (e.t === 'buff') self.float(u.x, u.y, (BUFFTXT[e.s] || e.s) + (e.p > 0 ? '↑' : '↓'), e.p > 0 ? '#f6cf57' : '#b181e6', { dy: -4 - Math.min(tn, 3) * 6, delay: 0.15 });
        else self.float(u.x, u.y, DS.STATUS[e.s].name, e.s === 'poison' ? '#9ccc3c' : '#62b0ee', { dy: -4 - Math.min(tn, 3) * 6, delay: 0.15 });
        break;
      case 'aggro':
        if (!on) break;
        self.float(u.x, u.y, '!', '#ff4d6d', { dy: -6, life: 0.7, num: true, big: true });
        if (u.role === 'boss' && !u.fake) { self.shake = Math.max(self.shake, 0.35); self.rings.push({ x: u.x, y: u.y, t: 0, dur: 0.5, c: '#ff4d6d', r: 16 }); self.rings.push({ x: u.x, y: u.y, t: -0.12, dur: 0.5, c: '#ffd0d6', r: 22 }); self.sfx('bossIn'); }
        break;
      case 'die':
        if (!v) break;
        if (e.flee) { v.dying = v.dieDur = 0.25; v.flee = true; break; }
        var bossDie = u.role === 'boss' && !u.fake, mine = u.side === 'ally';
        v.dying = v.dieDur = bossDie ? 1.1 : mine ? 0.7 : 0.45;
        if (bossDie) { v.boom = 0.01; self.shake = Math.max(self.shake, 0.5); self.flashA = Math.max(self.flashA, 0.1); }
        if (on) {
          self.burst(v.x, v.y, ['#ffffff', '#cdd5e3', '#8f9ab3'], bossDie ? 16 : 10, { spd: 34, up: 20, life: 0.5 }); self.sfx('die');
          if (mine) self.shape({ k: 'soul', x: v.x, y: v.y, dur: 0.9, c: u.role === 'merc' && u.grade ? DS.GRADES[u.grade].col : '#cdd5e3' });      // 넋이 떠오른다
          if (mine && u.role === 'cmd' && self.fallen.length < 12) self.fallen.push({ id: u.id, x: Math.round(v.x), y: Math.round(v.y), c: DS.FLAG[u.cls] || '#f6cf57', t: self.time });      // r8: 지휘관이 쓰러진 칸에 깃발이 남는다 (장면이 끝날 때까지)
          if (mine || bossDie) self.hitStop(bossDie ? 0.09 : 0.05);
        }
        break;
      case 'taunt':      // 엔진(2차): 방패 용병의 도발
        if (!v || !on) break;
        self.float(u.x, u.y, '도발!', '#ff8a5a', { dy: -10, life: 0.9 });
        self.rings.push({ x: u.x, y: u.y, t: 0, dur: 0.4, c: '#ff6a5a', r: 14 }); self.rings.push({ x: u.x, y: u.y, t: -0.1, dur: 0.4, c: '#ffd0c0', r: 22 });
        self.sfx('taunt');
        break;
      case 'phase': self.shake = 0.6; self.flashA = Math.max(self.flashA, 0.1); self.sfx('phase'); break;
    }
  })();
};

// ── 한 프레임 ──
V.frame = function (dt, evs) {
  this.time += dt;
  this.calmN = calmFx();      // r26: 움직임 줄이기 (프레임마다 한 번만 읽는다)
  var fxl = DS.fxLite(); this.fxK = fxl ? 0.55 : 1; this.lite = fxl || this.lowFx;      // 2.2.5 설정 「효과」 (가볍게: 알갱이 절반 남짓 · 덧그림 없이) · 느린 기기(lowFx)는 덧그림만 줄인다
  // r7: 프레임이 꾸준히 늦으면(평균 28ms↑, 중저가 폰) 이 장면 동안은 덧그림(빛·물비늘·비)을 끈다 — 켰다 껐다 하지 않게 장면 끝까지 유지
  this.ema = (this.ema || 0.016) * 0.97 + dt * 0.03; if (!this.lowFx && this.ema > 0.028 && this.time > 3) this.lowFx = true;
  var Gs = DS.G && DS.G.save; this.spd = DS.spdOf ? DS.spdOf(Gs && Gs.opt && Gs.opt.speed) : 1;      // r36: 1 · 1.5 · 2
  var Gm = DS.G && DS.G.sim; this.spdV = Gm && Gm._er && DS.ERASE ? DS.ERASE.slow : Math.max(1, Math.min(2, this.spd));      // 1.0.4: 화면의 걸음·예고도 배속을 따른다 (전에는 걸음 그림이 늘 1배속이라 필드에서 배속이 안 먹는 것처럼 보였다)
  if (evs && evs.length) this.handle(evs);
  if (this.cer) this.cerTick(dt);      // r16 fx: 오름 연출은 실제 시간 (히트스톱·배속과 무관)
  var rnow = typeof performance !== 'undefined' ? performance.now() : Date.now(); this.rdt = this.rLast ? Math.max(0, Math.min(0.1, (rnow - this.rLast) / 1000)) : dt; this.rLast = rnow;      // r30: 참 실제 시간 (dt 는 0.05 로 잘려 느린 폰에서 연출이 늘어졌다)
  if (this.dzTick && this.k0) this.k = this.k0 * this.dzTick(this.rdt);      // r16 fx: 죽음 연출의 줌(실제 시간)
  var fdt = dt;      // 히트스톱 중에는 움직임·이펙트의 시간만 멈춘다
  if (this.stop > 0) { this.stop -= dt; fdt = 0; }
  if (DS.fxFreeze) fdt = 0;      // 2.2.5 시험용: 이펙트 시간을 멈춘다 (한가운데를 찍을 때)
  if (this.slowF && this.slowF < 1) fdt *= this.slowF;      // r16 fx: 죽음 연출 동안 세상이 느려진다 (장면 자체는 실제 시간)
  var id, v, i, k = this.k, g = this.g, sim = this.sim;
  if (!sim) return;
  for (id in this.vu) {
    v = this.vu[id];
    if (v.t < 1) { v.t = Math.min(1, v.t + fdt * (this.spdV || 1) / Math.max(0.01, v.dur)); v.x = v.fx + (v.tx - v.fx) * v.t; v.y = v.fy + (v.ty - v.fy) * v.t; }
    if (v.flash > 0) v.flash -= fdt;
    if (v.alpha < 1 && v.dying < 0) v.alpha = Math.min(1, v.alpha + dt * 4);
    if (v.lunge) { v.lunge.t += fdt / 0.22; if (v.lunge.t >= 1) v.lunge = null; }
    if (v.hit) { v.hit.t += fdt / 0.16; if (v.hit.t >= 1) v.hit = null; }
    if (v.cast) { v.cast.t += fdt / 0.42; if (v.cast.t >= 1) v.cast = null; }
    if (v.ds && this.deathTick) this.deathTick(v, this.rdt);
    if (v.dying >= 0) {
      v.dying -= fdt; v.alpha = Math.max(0, Math.min(1, v.dying / v.dieDur * (v.flee ? 1 : 2.2)));
      if (v.boom && (v.boom -= fdt) <= 0 && v.dying > 0.15) {      // 보스는 여러 번 터지며 무너진다
        v.boom = 0.12; this.burst(v.x + Math.random() * 1.4 - 0.7, v.y - Math.random() * 0.9, ['#ffffff', '#ffd75e', '#ff9a3c'], 6, { spd: 40, life: 0.4, size: 2 });
        this.rings.push({ x: v.x + Math.random() - 0.5, y: v.y - Math.random() * 0.6, t: 0, dur: 0.25, c: '#ffd75e', r: 7 }); this.shake = Math.max(this.shake, 0.14);
      }
      if (v.dying <= 0) { if (v.boom) { this.burst(v.x, v.y, ['#ffffff', '#ffd75e', '#d9442b'], 18, { spd: 60, life: 0.6, size: 2 }); this.rings.push({ x: v.x, y: v.y, t: 0, dur: 0.5, c: '#ffffff', r: 22 }); this.flashA = Math.max(this.flashA, 0.12); this.sfx('boom'); } delete this.vu[id]; }
    }
  }
  // r8 gfx: 살아 있는 보스 목록 — 보스 곁(옆·바로 아래 칸)에 선 아군은 깃발·이름표를 접어 보스 몸이 가려지지 않게 한다
  var bl = this.bossL || (this.bossL = []); bl.length = 0;
  for (id in this.vu) { v = this.vu[id]; if (v.u.role === 'boss' && !v.u.fake && v.u.side === 'enemy' && v.dying < 0) bl.push(v); }
  // 카메라
  var vw = this.W / k, vh = this.H / k, it = this.inset.top / k, ib = this.inset.bottom / k, f = this.vu[this.focus];
  var tx = this.cam.x, ty = this.cam.y;
  var dzf = this.dzFocus ? this.dzFocus() : null; if (dzf) { f = dzf; }      // r16 fx: 죽음 연출 — 그 사람 쪽으로
  if (f) { tx = f.x * 16 + 8 - vw / 2 + (dzf ? 0 : this.pan.x); ty = f.y * 16 + 8 - (it + (vh - it - ib) / 2) + (dzf ? 0 : this.pan.y); }
  var mw = this.mw * 16, mh = this.mh * 16;
  tx = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, tx));
  ty = (mh + it + ib) <= vh ? -it - (vh - it - ib - mh) / 2 : Math.max(-it, Math.min(mh - vh + ib, ty));
  if (this.snap) { this.cam.x = tx; this.cam.y = ty; this.snap = false; }
  else { var a = Math.min(1, dt * 8); this.cam.x += (tx - this.cam.x) * a; this.cam.y += (ty - this.cam.y) * a; }
  var sx = 0, sy = 0;
  if (this.shake > 0) { this.shake -= dt; sx = (Math.random() - 0.5) * 3 * Math.min(1, this.shake * 4); sy = (Math.random() - 0.5) * 3 * Math.min(1, this.shake * 4); }
  var s = this.dpr * k, ox = -Math.round((this.cam.x + sx) * s), oy = -Math.round((this.cam.y + sy) * s);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#0d0b16'; g.fillRect(0, 0, this.cv.width, this.cv.height);
  g.imageSmoothingEnabled = false;
  g.setTransform(s, 0, 0, s, ox, oy);
  g.drawImage(this.maps[Math.floor(this.time * 2) % 2] || this.maps[0], 0, 0, this.mw * 16, this.mh * 16);
  var GO = DS.gfxOpt || {};
  var rich = !this.lowFx || GO.force;
  if (GO.water !== 0 && rich) this.drawWater(g);
  this.drawAmbient(g, dt);
  this.drawGround(g);
  if (this.graves && this.graves.length && this.drawGraves) this.drawGraves(g, dt);
  // 유닛 (아래쪽이 나중에)
  var list = []; for (id in this.vu) list.push(this.vu[id]);
  for (i = 0; i < this.decor.length; i++) list.push({ decor: this.decor[i], y: this.decor[i].y, x: this.decor[i].x });
  list.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
  if (DS.TOON !== false) { g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; }      // r13 toon: 카툰 그림(4배 굽기)은 매끈하게 줄여 그린다 — 지도·글자·점 효과는 그대로 픽셀
  if (this.cer) for (var cid0 in this.cer) { this.drawCer(g, false); break; }      // r16 fx: 오름 연출의 기둥·고리는 유닛 밑에
  for (i = 0; i < list.length; i++) { if (list[i].decor) this.drawDecor(g, list[i].decor); else this.drawUnit(g, list[i]); }
  g.imageSmoothingEnabled = false;
  if (this.ultDim) { g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.drawUltDim(g); g.setTransform(s, 0, 0, s, ox, oy); }      // 2.2.5 필살기의 어둠 — 유닛 위, 이펙트 아래
  this.drawFx(g, fdt);
  if (this.cer) for (var cid in this.cer) { this.drawCer(g, true); break; }
  if (this.lights && GO.light !== 0 && rich) this.drawLights(g, fdt); else if (this.lights) this.lights.length = 0;
  // 화면 좌표 글자
  g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  if (this.vig) { g.imageSmoothingEnabled = true; g.drawImage(this.vig, 0, 0, this.W, this.H); g.imageSmoothingEnabled = false; }      // 지역의 빛 (늘인 작은 그림 한 장)
  if (this.flashA > 0.12) this.flashA = 0.12;      // r8: 번쩍임 상한 — 3배속에서 겹쳐 깜빡이지 않게
  if (this.flashA > 0) { g.fillStyle = this.flashC ? hexA(this.flashC, this.flashA) : 'rgba(255,255,255,' + this.flashA.toFixed(3) + ')'; g.fillRect(0, 0, this.W, this.H); this.flashA -= dt * 1.6; if (this.flashA <= 0) this.flashC = null; }      // 치명타·번개의 번쩍임 (r26: 내 기술은 그 색으로)
  var lo = this.lowHp || 0;      // r26: 고른 대장이 위태로우면 가장자리가 붉게 「쿵쿵」 뛴다 (1.25Hz · 움직임 줄이기면 멈춘 붉은 테)
  if (lo > 0) {
    if (!this.redVig) this.redVig = redVignette();
    if (this.redVig) {
      var ph = (this.time * 1.25) % 1, beat = Math.exp(-ph * 10) + (ph > 0.2 ? 0.6 * Math.exp(-(ph - 0.2) * 10) : 0), cmv = calmFx();
      g.globalAlpha = cmv ? 0.32 * lo : (0.22 + 0.3 * Math.min(1, beat)) * lo;
      g.imageSmoothingEnabled = true; g.drawImage(this.redVig, 0, 0, this.W, this.H); g.imageSmoothingEnabled = false; g.globalAlpha = 1;
      if (lo > 0.5 && this.lastPh != null && ph < this.lastPh && (this.beats || 0) < 8) { this.beats = (this.beats || 0) + 1; this.sfx('heart'); }
      this.lastPh = ph;
    }
  } else if (this.beats && this.sim) { var me0 = this.sim.byId[this.sel]; if (!me0 || me0.hp > me0.mhp * 0.5) this.beats = 0; }
  if (this.er || this.erDim > 0 || (this.erFx && this.erFx.length)) this.drawErase(g, dt);      // r17 boss: 이름 지우기 (실제 시간)
  if (this.drawBarks && this.barks && this.barks.length) { try { this.drawBarks(g); } catch (x) { if (DS.loopErr) DS.loopErr(x, 'barks'); } }      // r32 전투 대사
  if (this.drawDeathOver && (this.dzVig > 0.01 || this.dz || this.time - (this.dsSeen == null ? -9 : this.dsSeen) < 0.2)) { try { this.drawDeathOver(g); } catch (x) { if (DS.loopErr) DS.loopErr(x, 'deathOver'); } }      // r30: 죽음 연출의 어두운 테두리·말풍선
  this.drawText(g, dt);
  if (this.cer) for (var cid2 in this.cer) { this.drawCerText(g); break; }
  if (this.trans) this.drawTrans(g);
};
// r7 비: 반 픽셀 사선 빗줄기(카메라 따라 시차) + 땅에 튀는 물방울. 개수 고정.
V.drawRain = function (g, dt) {
  var ps = this.rain, vw = this.W / this.k, vh = this.H / this.k, cx = this.cam.x, cy = this.cam.y, t = this.time, i, p, x, y;
  g.fillStyle = '#c8dcff';
  for (i = 0; i < ps.length; i++) {
    p = ps[i]; p.y += dt * (0.9 + p.s * 0.5); p.x -= dt * 0.18;
    x = p.x - cx / vw * 0.3; y = p.y - cy / vh * 0.3; x -= Math.floor(x); y -= Math.floor(y);
    var X = Math.round((cx + x * (vw + 20) - 10) * 2) / 2, Y = Math.round((cy + y * (vh + 20) - 10) * 2) / 2;
    if (p.s < 0.3) {      // 물방울 튀김: 제자리에서 짧게 반짝
      var ph = (t * 1.7 + p.s * 10) % 1; if (ph > 0.3) continue;
      g.globalAlpha = 0.6 * (1 - ph / 0.3); g.fillRect(X - 1 - ph * 3, Y, 0.5, 0.5); g.fillRect(X + 1 + ph * 3, Y, 0.5, 0.5); g.fillRect(X, Y - 0.5 - ph * 2, 0.5, 0.5);
      continue;
    }
    g.globalAlpha = 0.4 + p.s * 0.35; g.fillRect(X, Y, 0.5, 3); g.fillRect(X - 0.5, Y + 3, 0.5, 2.5);
  }
  g.globalAlpha = 1;
};
// r7 장면 전환: 0.45초 동안 4×4 베이어 무늬로 가운데부터 픽셀 단위로 걷힌다 (실제 시간 — 배속과 무관)
V.drawTrans = function (g) {
  var now = typeof performance !== 'undefined' ? performance.now() : Date.now(), p = (now - this.trans.t0) / 450;
  if (p >= 1 || p < 0) { this.trans = null; return; }
  var c = this.lowFx ? 10 : 6, W = this.W, H = this.H, cols = Math.ceil(W / c), rows = Math.ceil(H / c), x, y, i, md = Math.sqrt(cols * cols + rows * rows) / 2;
  // r30: 칸 7~9천 개를 fillRect 로 매 프레임 그리던 것을 — 문턱 표는 한 번 셈하고, 작은 그림(칸 = 1px)에 찍어 한 번에 늘여 그린다
  var T = this.transT;
  if (!T || T.cols !== cols || T.rows !== rows) {
    T = this.transT = { cols: cols, rows: rows, th: new Float32Array(cols * rows), cv: null, img: null };
    for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) { var dx = x - cols / 2, dy = y - rows / 2; T.th[y * cols + x] = BAY4[(x & 3) + (y & 3) * 4] / 16 * 0.35 + Math.sqrt(dx * dx + dy * dy) / md * 0.65; }      // 가운데부터 둥글게, 가장자리는 디더로
    try { T.cv = document.createElement('canvas'); T.cv.width = cols; T.cv.height = rows; T.img = T.cv.getContext('2d').createImageData(cols, rows); } catch (e) { T.cv = null; }
  }
  if (T.cv && T.img) {
    var d32 = new Uint32Array(T.img.data.buffer), on = 0xff160b0d, th = T.th;      // #0d0b16 (리틀 엔디언 ABGR)
    for (i = 0; i < th.length; i++) d32[i] = th[i] >= p ? on : 0;
    T.cv.getContext('2d').putImageData(T.img, 0, 0);
    var sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(T.cv, 0, 0, cols * c, rows * c); g.imageSmoothingEnabled = sm;
    return;
  }
  g.fillStyle = '#0d0b16';
  for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) if (T.th[y * cols + x] >= p) g.fillRect(x * c, y * c, c, c);
};
// 지역의 공기: 꽃가루·모래바람·안개와 반딧불·떠오르는 빛·재·불티·눈. 화면 기준으로 돌고, 카메라를 따라 조금 밀린다(시차).
V.drawAmbient = function (g, dt) {
  if (this.rain && this.rain.length && (!this.lowFx || (DS.gfxOpt || {}).force)) this.drawRain(g, dt);
  var A = AMB[this.theme], ps = this.amb;
  if (!A || !ps || !ps.length) return;
  var kind = A[0], cols = A[2], t = this.time, vw = this.W / this.k, vh = this.H / this.k, cx = this.cam.x, cy = this.cam.y, i, p, x, y, w, h, a, c;
  for (i = 0; i < ps.length; i++) {
    p = ps[i]; w = 1; h = 1; c = cols[i % cols.length]; x = p.x; y = p.y;
    switch (kind) {
      case 'drift': p.x += dt * (0.02 + p.s * 0.02); p.y += dt * (0.012 + p.s * 0.012); x += Math.sin(t * 1.3 + p.s * 40) * 0.02; a = 0.4 + 0.3 * Math.sin(t * 2 + p.s * 30); if (p.s > 0.8) w = 2; break;
      case 'sand': p.x += dt * (0.45 + p.s * 0.4); p.y += dt * 0.03; w = 3 + (p.s * 4 | 0); a = 0.32; break;
      case 'fog':
        if (i < 7) { p.x += dt * (0.012 + p.s * 0.012); w = 34 + (p.s * 26 | 0); h = 5 + (p.s * 5 | 0); a = 0.13 + 0.05 * Math.sin(t * 0.7 + p.s * 20); c = cols[0]; }
        else { p.x += dt * 0.01 * Math.sin(t * 0.6 + p.s * 9); p.y += dt * 0.008 * Math.cos(t * 0.5 + p.s * 7); a = Math.max(0, Math.sin(t * 1.6 + p.s * 30)) * 0.85; c = cols[1]; }
        break;
      case 'mote': p.y -= dt * (0.015 + p.s * 0.02); x += Math.sin(t + p.s * 20) * 0.01; a = 0.3 + 0.5 * Math.abs(Math.sin(t * 1.7 + p.s * 20)); if (p.s > 0.75) h = 2; break;
      case 'ember': p.y -= dt * (0.06 + p.s * 0.09); x += Math.sin(t * 2 + p.s * 30) * 0.015; a = 0.6 + 0.4 * Math.sin(t * 9 + p.s * 50); if (p.s > 0.5) h = 2; if (p.s > 0.9) w = 2; break;
      case 'ash': p.y += dt * (0.025 + p.s * 0.03); p.x += dt * 0.012; x += Math.sin(t * 0.9 + p.s * 20) * 0.015; a = 0.5; break;
      default: p.y += dt * (0.05 + p.s * 0.06); x += Math.sin(t * 1.1 + p.s * 25) * 0.02; a = 0.8; if (p.s > 0.7) { w = 2; h = 2; }      // 눈
    }
    x -= cx / vw * 0.6; y -= cy / vh * 0.6; x -= Math.floor(x); y -= Math.floor(y);      // 화면을 한 바퀴 도는 좌표
    if (a <= 0.02) continue;
    g.globalAlpha = a; g.fillStyle = c; g.fillRect(Math.round(cx + (x * 1.4 - 0.35) * vw), Math.round(cy + (y * 1.2 - 0.1) * vh), w, h);
  }
  g.globalAlpha = 1;
};
V.drawGround = function (g) {
  var t = this.time, self = this, id, i, p;
  // 출구 화살표, 입구 표시
  for (i = 0; i < this.pois.length; i++) {
    p = this.pois[i];
    if (p.t === 'exit') {
      var dx = p.side === 'E' ? 1 : p.side === 'W' ? -1 : 0, dy = p.side === 'S' ? 1 : p.side === 'N' ? -1 : 0, ph = (t * 2) % 1;
      g.fillStyle = 'rgba(255,240,160,' + (0.9 - ph * 0.6) + ')';
      p.tiles.forEach(function (q) {
        var cx = q[0] * 16 + 8 + dx * (ph * 5 - 2), cy = q[1] * 16 + 8 + dy * (ph * 5 - 2);
        if (dx) { g.fillRect(cx - dx * 2, cy - 3, 2, 6); g.fillRect(cx, cy - 2, 2, 4); g.fillRect(cx + dx * 2, cy - 1, 2, 2); }
        else { g.fillRect(cx - 3, cy - dy * 2, 6, 2); g.fillRect(cx - 2, cy, 4, 2); g.fillRect(cx - 1, cy + dy * 2, 2, 2); }
      });
    } else if (p.t === 'gate' || p.t === 'dungeon' || p.t === 'shop') {
      var st = p.state || 'open';
      if (p.t === 'shop' && p.kind === 'house') continue;
      g.fillStyle = st === 'next' ? 'rgba(246,207,87,' + (0.35 + 0.25 * Math.sin(t * 5)) + ')' : st === 'lock' ? 'rgba(20,16,30,.45)' : 'rgba(255,255,255,' + (0.12 + 0.08 * Math.sin(t * 3)) + ')';
      g.fillRect(p.x * 16 + 1, p.y * 16 + 1, 14, 14);
    }
  }
  // r8 gfx: 쓰러진 지휘관의 깃발 — 그 칸 바닥에 누운 깃대와 깃폭 (다시 일어나면 사라진다)
  for (i = 0; i < this.fallen.length; i++) {
    var fl = this.fallen[i], fu = this.sim && this.sim.byId ? this.sim.byId[fl.id] : null, fa = Math.min(1, (t - fl.t - 0.5) / 0.4), fx = fl.x * 16, fy = fl.y * 16, fj;
    if ((fu && !fu.dead) || fa <= 0) continue;
    g.globalAlpha = fa * 0.3; g.fillStyle = '#000000'; g.fillRect(fx + 2, fy + 14, 12, 1);
    g.globalAlpha = fa; g.fillStyle = '#1b1626'; g.fillRect(fx + 7.5, fy + 10.5, 7, 4.5);
    g.fillStyle = fl.c; g.fillRect(fx + 8, fy + 11, 6, 3.5); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(fx + 8, fy + 13.5, 6, 1); g.fillRect(fx + 10, fy + 11, 1, 3);
    g.fillStyle = '#1b1626'; for (fj = 0; fj < 12; fj++) g.fillRect(fx + 2 + fj, fy + 13 - Math.floor(fj / 4), 1, 1);
    g.fillStyle = '#f6cf57'; g.fillRect(fx + 14, fy + 10, 1, 1);
    g.globalAlpha = 1;
  }
  // 예고 기술
  for (id in this.tele) {
    var T = this.tele[id]; T.t = Math.min(T.dur, T.t + (this.spdV || 1) / 60);
    var pr = T.t / T.dur, hostile = T.side === 'enemy', hotW = hostile && this.hot, tk, tq, tx0, ty0, te, tm;
    // r8 gfx: 범위 바깥 변에 밝은 윤곽선, 안에는 흐르는 빗금 — 채움 색이 바닥과 섞여도(붉은 땅·풀밭·물) 모양이 남는다. 붉은·보랏빛 땅은 호박빛
    if (!T.edge) {      // 칸마다 「이웃이 범위 밖인 변」을 한 번만 셈한다 (1 위 · 2 아래 · 4 왼 · 8 오른)
      var tset = {}; T.edge = [];
      for (tk = 0; tk < T.tiles.length; tk++) tset[T.tiles[tk][0] + ',' + T.tiles[tk][1]] = 1;
      for (tk = 0; tk < T.tiles.length; tk++) { tq = T.tiles[tk]; T.edge.push((tset[tq[0] + ',' + (tq[1] - 1)] ? 0 : 1) | (tset[tq[0] + ',' + (tq[1] + 1)] ? 0 : 2) | (tset[(tq[0] - 1) + ',' + tq[1]] ? 0 : 4) | (tset[(tq[0] + 1) + ',' + tq[1]] ? 0 : 8)); }
    }
    var tfill = !hostile ? 'rgba(120,200,255,' + (0.2 + 0.2 * pr) + ')' : hotW ? 'rgba(' + this.hotC + ',' + (0.3 + 0.3 * pr + 0.1 * Math.sin(t * 16)) + ')' : 'rgba(255,50,80,' + (0.22 + 0.3 * pr + 0.1 * Math.sin(t * 16)) + ')';
    var tstripe = hostile && typeof document !== 'undefined' ? stripeTex(hotW ? '#fff6d0' : '#ffd9c0', 7 - (Math.floor(t * 12) & 7)) : null;
    for (tk = 0; tk < T.tiles.length; tk++) {
      tq = T.tiles[tk]; tx0 = tq[0] * 16; ty0 = tq[1] * 16; te = T.edge[tk];
      g.fillStyle = tfill; g.fillRect(tx0, ty0, 16, 16);
      if (tstripe) { g.globalAlpha = 0.2 + 0.25 * pr; g.drawImage(tstripe, tx0, ty0); g.globalAlpha = 1; }
      if (te) {
        g.fillStyle = 'rgba(27,22,38,.6)';
        if (te & 1) g.fillRect(tx0, ty0 + 1, 16, 0.5); if (te & 2) g.fillRect(tx0, ty0 + 14.5, 16, 0.5); if (te & 4) g.fillRect(tx0 + 1, ty0, 0.5, 16); if (te & 8) g.fillRect(tx0 + 14.5, ty0, 0.5, 16);
        g.fillStyle = hostile ? '#fff2b0' : '#dff0ff';      // 적 = 따뜻한 노랑 윤곽, 아군 = 푸른 흰빛 (붉은 땅에서도 같은 약속)
        if (te & 1) g.fillRect(tx0, ty0, 16, 1); if (te & 2) g.fillRect(tx0, ty0 + 15, 16, 1); if (te & 4) g.fillRect(tx0, ty0, 1, 16); if (te & 8) g.fillRect(tx0 + 15, ty0, 1, 16);
      }
      g.fillStyle = hostile ? 'rgba(255,220,120,.9)' : 'rgba(220,240,255,.9)';
      tm = 7 * (1 - pr);
      g.fillRect(tx0 + tm, ty0 + tm, 16 - tm * 2, 1); g.fillRect(tx0 + tm, ty0 + 15 - tm, 16 - tm * 2, 1); g.fillRect(tx0 + tm, ty0 + tm, 1, 16 - tm * 2); g.fillRect(tx0 + 15 - tm, ty0 + tm, 1, 16 - tm * 2);
    }
  }
  // 기술 조준
  if (this.aim) {
    g.fillStyle = 'rgba(95,196,214,.22)';
    (this.aim.range || []).forEach(function (q) { g.fillRect(q[0] * 16, q[1] * 16, 16, 16); });
    g.fillStyle = 'rgba(246,207,87,.4)';
    (this.aim.area || []).forEach(function (q) { g.fillRect(q[0] * 16 + 1, q[1] * 16 + 1, 14, 14); });
  }
  if (this.mark) {
    this.mark.t += 1 / 60;
    var a = Math.max(0, 1 - this.mark.t / 1.2), r = 3 + (this.mark.t * 10) % 5;
    g.fillStyle = 'rgba(255,255,255,' + a * 0.8 + ')';
    var mx = this.mark.x * 16 + 8, my = this.mark.y * 16 + 8;
    g.fillRect(mx - r, my - r, 2, 1); g.fillRect(mx + r - 1, my - r, 2, 1); g.fillRect(mx - r, my + r, 2, 1); g.fillRect(mx + r - 1, my + r, 2, 1); g.fillRect(mx - 1, my - 1, 2, 2);
    if (a <= 0) this.mark = null;
  }
};
function bracket(g, x, y, w, h, c, n) {
  g.fillStyle = c; n = n || 4;
  g.fillRect(x, y, n, 1); g.fillRect(x, y, 1, n); g.fillRect(x + w - n, y, n, 1); g.fillRect(x + w - 1, y, 1, n);
  g.fillRect(x, y + h - 1, n, 1); g.fillRect(x, y + h - n, 1, n); g.fillRect(x + w - n, y + h - 1, n, 1); g.fillRect(x + w - 1, y + h - n, 1, n);
}
V.drawDecor = function (g, d) {
  var cv = DS.spriteCanvas(d.sprite, null, { flip: d.flip, hd: 1 });
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(d.x * 16 + 4.5, d.y * 16 + 12.5, 7, 0.5); g.fillRect(d.x * 16 + 3, d.y * 16 + 13, 10, 2); g.fillRect(d.x * 16 + 4.5, d.y * 16 + 15, 7, 0.5);
  g.drawImage(cv, d.x * 16, d.y * 16 - 2 + (Math.sin(this.time * 2 + d.x) > 0.6 ? -1 : 0), lwOf(cv), lwOf(cv));
};
var shadowC = null;
function softShadow() {      // r13 toon: 가운데가 짙고 가장자리로 흐려지는 타원 그림자 한 장 (64×24)
  if (shadowC) return shadowC;
  var cv = document.createElement('canvas'); cv.width = 64; cv.height = 24; var g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 24 / 64, 0, 0); var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(20,14,34,.55)'); gr.addColorStop(0.55, 'rgba(20,14,34,.38)'); gr.addColorStop(0.85, 'rgba(20,14,34,.12)'); gr.addColorStop(1, 'rgba(20,14,34,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (shadowC = cv);
}
function lwOf(cv) { return cv.lw || cv.width / 2; }      // r13 toon: 구운 그림의 논리 폭 (카툰 4배·이전 2배 어느 쪽이든)
// 스프라이트를 위·아래 두 토막으로 그린다: 숨쉬기(윗몸이 1px 내려앉는다), 쓰러질 때는 바닥 쪽으로 납작해진다
var curPose = '';      // r14: 지금 그리는 유닛의 자세 (빛무리 윤곽이 같은 자세를 쓴다)
function blit(g, cv, x, y, w, h, breath, sq, lean) {
  if (sq < 1) { var hh = Math.max(1, Math.round(h * sq)); g.drawImage(cv, x, y + h - hh, w, hh); return; }
  if (!breath && !lean) { g.drawImage(cv, x, y, w, h); return; }
  if (cv.art) { if (breath) g.drawImage(cv, x - 0.15, y + 0.6, w + 0.3, h - 0.6); else g.drawImage(cv, x + (lean || 0) * 0.5, y, w, h); return; }      // r14 새 그림: 숨은 몸 전체를 살짝 눌러(자르는 줄 없이), 기울기는 자세 그림이 맡는다
  var sh = cv.height, cut = Math.round(sh * 0.69), dh = Math.round(h * cut / sh);
  g.drawImage(cv, 0, cut, cv.width, sh - cut, x, y + dh, w, h - dh);
  g.drawImage(cv, 0, 0, cv.width, cut, x + (lean || 0), y + (breath ? 1 : 0), w, dh);      // r7: lean = 윗몸이 앞(공격)·뒤(피격)로 기운다
}
// ── r7 빛: 4×4 베이어 디더로 구운 둥근 광원 (색마다 한 장), 'lighter' 로 얹는다 ──
var BAY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], glowC = {};
function glowTex(col) {
  if (glowC[col]) return glowC[col];
  var cv = document.createElement('canvas'); cv.width = cv.height = 24; var g = cv.getContext('2d'), x, y;
  for (y = 0; y < 24; y++) for (x = 0; x < 24; x++) {
    var d = Math.sqrt((x - 11.5) * (x - 11.5) + (y - 11.5) * (y - 11.5)) / 12; if (d >= 1) continue;
    var v = (1 - d) * (1 - d) * 4, lv = Math.floor(v + BAY4[(x & 3) + (y & 3) * 4] / 16); if (lv <= 0) continue;      // 네 단계 띠를 디더로 섞는다
    g.globalAlpha = Math.min(1, lv / 4); g.fillStyle = col; g.fillRect(x, y, 1, 1);
  }
  return (glowC[col] = cv);
}
V.light = function (x, y, r, col, a, life) { if (this.lights.length < 40) this.lights.push({ x: x, y: y, r: r, c: col, a: a, t: 0, life: life || 0.4 }); };
var RAIN = { styx: 34, swamp: 30, rot: 26, jungle: 22 };      // r7 비: 지역별 빗줄기 수 (3배속에서도 같은 수)
var DARK = { styx: 1, nether: 1, blood: 1, lava: 1, tomb: 1, palace: 1, swamp: 1, rot: 1, plague: 1, moon: 1 };
V.drawLights = function (g, dt) {
  var L = this.lights, i, p, t = this.time, vw = this.W / this.k, vh = this.H / this.k, cx = this.cam.x, cy = this.cam.y, n = 0;
  g.globalCompositeOperation = 'lighter';
  for (i = L.length - 1; i >= 0; i--) {
    p = L[i]; p.t += dt; if (p.t >= p.life) { L.splice(i, 1); continue; }
    var f = p.t / p.life, a = p.a * (f < 0.15 ? f / 0.15 : 1 - (f - 0.15) / 0.85), r = p.r * (0.85 + 0.15 * Math.min(1, f * 4));
    g.globalAlpha = Math.max(0, a); g.drawImage(glowTex(p.c), Math.round(p.x - r), Math.round(p.y - r), Math.round(r * 2), Math.round(r * 2));
  }
  // 어두운 지역: 관문·가게 횃불이 깜빡이고, 화면 안 용암 칸이 은은히 빛난다
  if (DARK[this.theme]) for (i = 0; i < this.pois.length && n < 12; i++) {
    p = this.pois[i]; if (!(p.t === 'gate' || p.t === 'dungeon' || p.t === 'shop')) continue;
    var lx = p.x * 16 + 8, ly = p.y * 16 + 2; if (lx < cx - 40 || ly < cy - 40 || lx > cx + vw + 40 || ly > cy + vh + 40) continue;
    var fl = 0.5 + 0.12 * Math.sin(t * 9 + i) + 0.08 * Math.sin(t * 23 + i * 3); n++;
    g.globalAlpha = fl * 0.55; g.drawImage(glowTex('#ff9a3c'), lx - 22, ly - 22, 44, 44);
    g.globalAlpha = fl * 0.5; g.drawImage(glowTex('#ffe08a'), lx - 9, ly - 9, 18, 18);
  }
  if (DARK[this.theme]) for (var lid in this.vu) {      // 어두운 지역: 지휘관 둘레에 등불 같은 따뜻한 빛
    var lv = this.vu[lid], lu = lv.u; if (lu.side !== 'ally' || lu.role !== 'cmd' || lv.dying >= 0) continue;
    var ux = lv.x * 16 + 8, uy = lv.y * 16 + 8; if (ux < cx - 40 || uy < cy - 40 || ux > cx + vw + 40 || uy > cy + vh + 40) continue;
    g.globalAlpha = 0.2 + 0.03 * Math.sin(t * 3 + lv.bob); g.drawImage(glowTex('#ffd89a'), Math.round(ux - 22), Math.round(uy - 22), 44, 44);
  }
  if (this.wet && this.lavaN) {
    var x0 = Math.max(0, Math.floor(cx / 16)), y0 = Math.max(0, Math.floor(cy / 16)), x1 = Math.min(this.mw - 1, Math.ceil((cx + vw) / 16)), y1 = Math.min(this.mh - 1, Math.ceil((cy + vh) / 16)), x, y, m = 0;
    for (y = y0; y <= y1 && m < 6; y++) for (x = x0; x <= x1 && m < 6; x++) if (this.wet[y * this.mw + x] === 2 && ((x * 7 + y * 13) % 4 === 0)) {
      m++; g.globalAlpha = 0.14 + 0.06 * Math.sin(t * 2 + x + y * 2); g.drawImage(glowTex('#ff6a2a'), x * 16 - 8, y * 16 - 8, 32, 32);
    }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
};
// ── r7 물·용암 움직임: 지도는 다시 굽지 않고, 화면 안 물/용암 칸에만 흘러가는 물비늘·부풀다 터지는 거품을 얹는다 ──
V.drawWater = function (g) {
  if (!this.wet || !this.wetN) return;
  var t = this.time, vw = this.W / this.k, vh = this.H / this.k, cx = this.cam.x, cy = this.cam.y;
  var x0 = Math.max(0, Math.floor(cx / 16)), y0 = Math.max(0, Math.floor(cy / 16)), x1 = Math.min(this.mw - 1, Math.ceil((cx + vw) / 16)), y1 = Math.min(this.mh - 1, Math.ceil((cy + vh) / 16)), x, y, w, h, q, ph;
  for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
    w = this.wet[y * this.mw + x]; if (!w) continue;
    h = ((x * 73856093) ^ (y * 19349663)) >>> 0;
    if (w === 1) {      // 물: 반 픽셀 물비늘 두 줄이 천천히 흘러가며 깜빡인다
      g.fillStyle = 'rgba(225,245,255,.6)';
      for (q = 0; q < 2; q++) { ph = (t * (3 + q) + (h >> (q * 4) & 15)) % 16; var a = Math.sin(t * 2.2 + (h & 31) + q * 2); if (a < 0.1) continue; g.globalAlpha = a; g.fillRect(x * 16 + ph - 1, y * 16 + 3 + ((h >> 8) & 7) + q * 5, ph > 12 ? 16 - ph : 3.5, 0.5); }
      g.globalAlpha = 1;
    } else {      // 용암: 거품이 부풀다 터진다 (칸 둘 중 하나에만)
      if (h & 1) continue;
      ph = (t * 0.6 + (h & 255) / 255) % 1; var bx = x * 16 + 3 + (h >> 4 & 7), by = y * 16 + 4 + (h >> 7 & 7);
      if (ph < 0.75) { var r = 0.5 + Math.round(ph * 2) * 0.5; g.fillStyle = '#ff9a3c'; g.fillRect(bx - r + 0.5, by - r, r * 2 - 1, r * 2); g.fillRect(bx - r, by - r + 0.5, r * 2, r * 2 - 1); g.fillStyle = '#ffd75e'; g.fillRect(bx - r + 0.5, by - r + 0.5, 0.5, 0.5); }      // 둥근 거품: 귀를 깎은 네모 + 밝은 점
      else { var r2 = 2 + (ph - 0.75) * 8; g.fillStyle = 'rgba(255,215,94,' + (1 - (ph - 0.75) * 4).toFixed(2) + ')'; g.fillRect(bx - r2, by, 0.5, 0.5); g.fillRect(bx + r2, by, 0.5, 0.5); g.fillRect(bx, by - r2 * 0.6, 0.5, 0.5); g.fillRect(bx - r2 * 0.7, by - r2 * 0.5, 0.5, 0.5); g.fillRect(bx + r2 * 0.7, by - r2 * 0.5, 0.5, 0.5); }
    }
  }
};
// r8 gfx: 보스 곁인가 — 좌우 한 칸, 위로 반 칸 ~ 아래로 down 칸 (아래쪽에 선 유닛의 깃발·이름표가 보스 몸 위로 올라온다)
function byBoss(view, v, down) {
  var b = view.bossL, i, dx, dy; if (!b) return false;
  for (i = 0; i < b.length; i++) { dx = v.x - b[i].x; dy = v.y - b[i].y; if (dx > -1.6 && dx < 1.6 && dy > -0.6 && dy < down) return true; }
  return false;
}
// r8 gfx: 보스 표식 — 체력 막대 위의 뿔 달린 붉은 왕관 (난전에서 「저게 보스」가 글자 없이 읽히게). 붉은 땅에서는 금빛
function bossMark(g, x, y, t, hot) {
  var K = '#1b1626', c1 = hot ? '#ffd75e' : '#ff4d6d', c2 = hot ? '#fff6d0' : '#ffd0d6', up = Math.sin(t * 4) > 0 ? 0 : 1;
  y += up;
  g.fillStyle = K; g.fillRect(x - 1, y + 1, 11, 6); g.fillRect(x - 1, y - 1, 3, 3); g.fillRect(x + 3, y - 2, 3, 4); g.fillRect(x + 7, y - 1, 3, 3);
  g.fillStyle = c1; g.fillRect(x, y + 2, 9, 4); g.fillRect(x, y, 1, 2); g.fillRect(x + 4, y - 1, 1, 3); g.fillRect(x + 8, y, 1, 2);
  g.fillStyle = c2; g.fillRect(x, y + 2, 9, 1); g.fillRect(x + 4, y + 3, 1, 2);
  g.fillStyle = K; g.fillRect(x + 2, y + 4, 1, 1); g.fillRect(x + 6, y + 4, 1, 1);
}
var MARK_Y = 1;
// 용병 등급 표식: 등급이 오를수록 모양이 커지고 달라진다 (점 → 막대 → 마름모 → 큰 마름모 → 빛나는 별)
function gradeMark(g, x, y, gr, col, t) {
  var K = '#1b1626';
  g.fillStyle = K;
  if (gr <= 1) { g.fillRect(x, y + 1, 4, 4); g.fillStyle = col; g.fillRect(x + 1, y + 2, 2, 2); return; }
  if (gr === 2) { g.fillRect(x, y, 4, 5); g.fillStyle = col; g.fillRect(x + 1, y + 1, 2, 3); return; }
  if (gr === 3) { g.fillRect(x, y, 5, 5); g.fillStyle = col; g.fillRect(x + 2, y + 1, 1, 3); g.fillRect(x + 1, y + 2, 3, 1); return; }
  g.fillRect(x, y - 1, 5, 7); g.fillRect(x - 1, y, 7, 5);
  g.fillStyle = col; g.fillRect(x + 2, y, 1, 5); g.fillRect(x, y + 2, 5, 1); g.fillRect(x + 1, y + 1, 3, 3);
  g.fillStyle = '#ffffff'; g.fillRect(x + 2, y + 2, 1, 1);
  if (gr >= 5 && Math.sin(t * 6) > 0) { g.fillRect(x + 2, y - 1, 1, 1); g.fillRect(x + 2, y + 5, 1, 1); g.fillRect(x - 1, y + 2, 1, 1); g.fillRect(x + 5, y + 2, 1, 1); }
}
// 큰 용병(인구 2) 휘장: 몸집에 맞는 방패꼴. 등급이 오를수록 무늬가 늘고(띠 → 갈매기 → 별 → 왕관 별), 전설은 반짝인다
function bigMark(g, x, y, gr, col, t) {
  var K = '#1b1626';
  g.fillStyle = K; g.fillRect(x, y, 7, 6); g.fillRect(x + 1, y + 6, 5, 1); g.fillRect(x + 2, y + 7, 3, 1); g.fillRect(x + 3, y + 8, 1, 1);
  g.fillStyle = col; g.fillRect(x + 1, y + 1, 5, 5); g.fillRect(x + 2, y + 6, 3, 1); g.fillRect(x + 3, y + 7, 1, 1);
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 1, y + 1, 5, 1);
  g.fillStyle = gr >= 4 ? '#ffffff' : K;
  if (gr === 2) g.fillRect(x + 2, y + 3, 3, 1);
  else if (gr === 3) { g.fillRect(x + 2, y + 3, 1, 1); g.fillRect(x + 3, y + 4, 1, 1); g.fillRect(x + 4, y + 3, 1, 1); }
  else if (gr >= 4) { g.fillRect(x + 3, y + 2, 1, 3); g.fillRect(x + 2, y + 3, 3, 1); }
  if (gr >= 5) {
    g.fillStyle = K; g.fillRect(x + 1, y - 3, 5, 3); g.fillStyle = '#f6cf57'; g.fillRect(x + 2, y - 1, 3, 1); g.fillRect(x + 2, y - 2, 1, 1); g.fillRect(x + 4, y - 2, 1, 1);
    if (Math.sin(t * 5) > 0.2) { g.fillStyle = '#ffffff'; g.fillRect(x - 1, y + 2, 1, 1); g.fillRect(x + 7, y + 4, 1, 1); g.fillRect(x + 3, y - 4, 1, 1); }
  }
}
// 필드 정예 무리 (기획 2.8: u.elite 우두머리 · u.eliteCrew 졸개): 우두머리는 해골 왕관, 졸개는 작은 주황 갈매기
function eliteMark(g, x, y, lead, t) {
  var K = '#1b1626';
  if (lead) {
    g.fillStyle = K; g.fillRect(x - 1, y - 3, 9, 10);
    g.fillStyle = '#f6cf57'; g.fillRect(x, y - 2, 7, 2); g.fillRect(x, y - 3, 1, 1); g.fillRect(x + 3, y - 3, 1, 1); g.fillRect(x + 6, y - 3, 1, 1);      // 왕관
    g.fillStyle = '#efe6d0'; g.fillRect(x + 1, y, 5, 4); g.fillRect(x + 2, y + 4, 3, 2);      // 해골
    g.fillStyle = K; g.fillRect(x + 2, y + 1, 1, 2); g.fillRect(x + 4, y + 1, 1, 2); g.fillRect(x + 3, y + 5, 1, 1);
    if (Math.sin(t * 6) > 0.4) { g.fillStyle = '#ffffff'; g.fillRect(x + 7, y - 4, 1, 1); }
  } else {
    g.fillStyle = K; g.fillRect(x, y, 5, 4); g.fillStyle = '#ff9a3c'; g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x + 2, y + 2, 1, 1); g.fillRect(x + 3, y + 1, 1, 1);
  }
}
// ════════ r11 gfx: 강화 빛 단계 표 (+3 ~ +10) — 화면 어디서나 이 한 표를 쓴다 ════════
// 2차: 칼날 색이 아니라 「몸 둘레」로 이웃 단계가 갈린다. 실제 배율(유닛 한 칸 ≈ 20 css px)에서 보이도록 크게 — 한 단계 오를 때마다 새 표시가 하나씩 붙는다.
//  +3 은빛 점 고리·옅은 윤곽(고정) → +4 실선 고리·짙은 윤곽·도는 빛 둘 → +5 몸 뒤 빛무리·발밑 웅덩이·퍼지는 물결(맥박 시작) → +6 오르는 불티
//  → +7 겹고리·두꺼운 윤곽·날끝 불꽃 → +8 양옆 빛살 2줄·도는 빛 → +9 번개·도는 마디·빛살 4줄 → +10 흰 빛무리·무지개 고리·빛살 6줄·반짝임
//  그리고 단계마다 빛무리 크기(aura)·밝기, 맥박(pulse Hz), 불티 수·빠르기, 고리 지름이 고르게 커진다.
// 색은 유니크(보라 #b181e6)·전설(금 #f0b64a)과 겹치지 않게: 은 → 하늘 → 청 → 에메랄드 → 연두 → 홍 → 도화 → 여명(무지개)
DS.ENH_FX = {
  //  ring: 1 점 고리 · 2 실선 · 3 겹고리 · 4 겹고리+도는 마디 / rr 고리 반지름 / floor 발밑 웅덩이 / halo 몸 윤곽 두께(0·1·2)·haloA / aura 몸 뒤 빛무리 반지름·auraA
  //  pulse 맥박 Hz(0 = 고정) / sparks 불티 수·spd 오르는 빠르기 / motes 도는 빛 / pillar 몸 양옆 빛살 줄 수
  3: { c: '#f2f8ff', name: '은빛 고리', glow: 0.8, ring: 1, rr: 8.5, floor: 0, halo: 1, haloA: 0.5, aura: 0, auraA: 0, pulse: 0, motes: 0, sparks: 0, spd: 0, pillar: 0 },
  4: { c: '#7fdcff', name: '하늘 윤곽', glow: 0.7, ring: 2, rr: 9, floor: 0, halo: 1, haloA: 1, aura: 0, auraA: 0, pulse: 0, motes: 2, sparks: 0, spd: 0, pillar: 0 },
  5: { c: '#4a72ff', name: '푸른 맥박', glow: 0.75, ring: 2, rr: 10, floor: 0.45, halo: 1, haloA: 0.9, aura: 9, auraA: 0.46, pulse: 0.8, motes: 2, sparks: 0, spd: 0, pillar: 0 },
  6: { c: '#2fe887', name: '에메랄드 불티', glow: 0.8, ring: 2, rr: 10, floor: 0.5, halo: 1, haloA: 0.95, aura: 10.5, auraA: 0.5, pulse: 1.2, motes: 3, sparks: 6, spd: 0.55, pillar: 0 },
  7: { c: '#cfff3a', name: '연두 불꽃', glow: 0.85, ring: 3, rr: 11, floor: 0.5, halo: 2, haloA: 0.85, aura: 12, auraA: 0.54, pulse: 1.6, motes: 3, sparks: 10, spd: 0.8, pillar: 0, flame: 1 },
  8: { c: '#ff4a5e', name: '홍염 빛살', glow: 0.9, ring: 3, rr: 11.5, floor: 0.55, halo: 2, haloA: 0.95, aura: 13.5, auraA: 0.56, pulse: 2.1, motes: 4, sparks: 14, spd: 1.05, pillar: 2, flame: 1 },
  9: { c: '#ff6ad2', name: '도화 번개', glow: 0.95, ring: 4, rr: 12, floor: 0.6, halo: 2, haloA: 1, aura: 15, auraA: 0.6, pulse: 2.8, motes: 6, sparks: 19, spd: 1.35, pillar: 4, flame: 1, bolt: 1 },
  10: { c: '#fff6e4', name: '여명 백광', glow: 1, ring: 4, rr: 13, floor: 0.65, halo: 2, haloA: 1, aura: 17, auraA: 0.72, pulse: 3.6, motes: 8, sparks: 26, spd: 1.6, pillar: 6, flame: 1, bolt: 1, prism: 1 }
};
DS.enhStep = function (n) { n = +n || 0; return n >= 20 ? 10 : n >= 3 ? Math.min(9, 3 + Math.floor((n - 3) * 6 / 16)) : 0; };      // 0 = 빛 없음(+0~+2) · 2.1.0: 끝이 +20 이라 +3~+19 를 빛 3~9 단계에 고르게 펴고 +20 이 여명 백광
DS.enhColor = function (n) { var f = DS.ENH_FX[DS.enhStep(n)]; return f ? f.c : (n > 0 ? '#dff0ff' : '#efe6d0'); };
DS.enhClass = function (n) { n = +n || 0; return 'en en' + (DS.enhTier ? DS.enhTier(n) : 0) + (n >= 3 ? ' ex' + DS.enhStep(n) : ''); };      // 이름·띠용 클래스 (style.css r11 블록의 .ex3~.ex10)
// 무지개는 12색 hex 표 (hsl 문자열은 굽기의 rgb() 가 못 읽어 윤곽이 검게 나왔다 — 2차에서 고침)
var PRISM = (function () { var o = [], i; for (i = 0; i < 12; i++) { var h = i / 12, f = function (n) { var k = (n + h * 12) % 12, v = 0.78 - 0.22 * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return ('0' + Math.round(v * 255).toString(16)).slice(-2); }; o.push('#' + f(0) + f(8) + f(4)); } return o; })();
function prism(t, k) { return PRISM[Math.floor((((t * 0.35 + (k || 0)) % 1) + 1) % 1 * 12) % 12]; }
function tintMask(m, col) {
  var c = m._tc || (m._tc = {}); if (c[col]) return c[col];
  var cv = document.createElement('canvas'); cv.width = m.width; cv.height = m.height; var g = cv.getContext('2d');
  g.drawImage(m, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, cv.width, cv.height);
  return (c[col] = cv);
}
function maskBox(m) {
  if (m._bb) return m._bb;
  var d = m.getContext('2d').getImageData(0, 0, m.width, m.height).data, x, y, b = { x0: 1e4, y0: 1e4, x1: -1, y1: -1, tx: 0, ty: 1e4 };
  for (y = 0; y < m.height; y++) for (x = 0; x < m.width; x++) if (d[(y * m.width + x) * 4 + 3] > 96) { if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) { b.y0 = y; b.tx = x; b.ty = y; } if (y > b.y1) b.y1 = y; }
  var f = m.lw ? m.lw * 2 / m.width : 1;      // r13 toon: 4배 마스크도 2배 격자 좌표로 (부르는 쪽은 /2 로 논리 좌표)
  if (f !== 1) for (var k in b) b[k] = b[k] * f;
  return (m._bb = b);
}
function pz(F, t, v) { return F.pulse ? 0.5 + 0.5 * Math.sin(t * F.pulse * 6.2832 + v.bob) : 1; }
// 고리·빛 웅덩이·빛무리는 색·크기마다 한 장 구워 drawImage 한 번 (2배 격자) — 프레임마다 점을 수십 개 찍지 않는다
var ringC = {};
function ringTex(col, rx, ry, cnt, sz, a0, a1, thick, floor) {
  var key = col + rx + '|' + ry + '|' + cnt + '|' + sz + '|' + a0 + '|' + a1 + '|' + thick + '|' + (floor || 0); if (ringC[key]) return ringC[key];
  var W = Math.ceil(rx + 3) * 4, H = Math.ceil(ry + 3) * 4, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var g = cv.getContext('2d'), i, cx = W / 4, cy = H / 4;
  g.setTransform(2, 0, 0, 2, 0, 0); g.fillStyle = col;
  if (floor) for (var yy = -ry; yy <= ry; yy += 0.5) { var hw = rx * 0.85 * Math.sqrt(Math.max(0, 1 - yy * yy / (ry * ry))); g.globalAlpha = floor * (1 - Math.abs(yy) / (ry + 0.5)); g.fillRect(Math.round((cx - hw) * 2) / 2, cy + yy, Math.round(hw * 4) / 2, 0.5); }
  else for (var k = 0; k <= thick; k++) for (i = 0; i < cnt; i++) { var ang = i / cnt * 6.2832; var al = a0 + (a1 - a0) * (Math.sin(ang) * 0.5 + 0.5); if (k === thick) { g.fillStyle = '#13111f'; g.globalAlpha = al * 0.45; } else { g.fillStyle = col; g.globalAlpha = al; } g.fillRect(Math.round((cx + Math.cos(ang) * rx) * 2) / 2 - sz / 2, Math.round((cy + Math.sin(ang) * ry) * 2) / 2 + k * 0.5, sz, 0.5); }      // 마지막 줄은 어두운 그늘 (밝은 흙길에서도 고리가 보이게)
  cv._cx = cx; cv._cy = cy; return (ringC[key] = cv);
}
// 몸 뒤 빛무리: 픽셀 띠 4겹(부드러운 원이 아니라 계단) — 반지름이 단계마다 1.5 씩 커진다
function auraTex(col, r) {
  var key = 'A' + col + r; if (ringC[key]) return ringC[key];
  var R = Math.ceil(r), W = R * 4 + 4, cv = document.createElement('canvas'); cv.width = cv.height = W; var g = cv.getContext('2d'), x, y, c = W / 2;
  if (DS.TOON !== false) {      // r13 toon: 계단 띠 대신 부드러운 빛무리 (가운데 밝고 가장자리로 스러진다)
    var gr = g.createRadialGradient(c, c, 0, c, c, r * 2);
    gr.addColorStop(0, col); gr.addColorStop(0.3, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.globalAlpha = 0.85; g.fillRect(0, 0, W, W);
    cv._cx = c / 2; cv._cy = c / 2; return (ringC[key] = cv);
  }
  g.fillStyle = col;
  for (y = 0; y < W; y++) for (x = 0; x < W; x++) {
    var dx = (x + 0.5 - c) / 2, dy = (y + 0.5 - c) / 2 * 0.9, d = Math.sqrt(dx * dx + dy * dy) / r; if (d >= 1) continue;
    var lv = d < 0.35 ? 1 : d < 0.6 ? 0.7 : d < 0.82 ? 0.42 : ((x + y) & 1) ? 0.22 : 0;      // 바깥 띠는 바둑 디더
    if (!lv) continue; g.globalAlpha = lv; g.fillRect(x, y, 1, 1);
  }
  cv._cx = c / 2; cv._cy = c / 2; return (ringC[key] = cv);
}
function ringAt(g, tex, cx, cy, sc) { var w = tex.width / 2 * (sc || 1), h = tex.height / 2 * (sc || 1); g.drawImage(tex, cx - tex._cx * (sc || 1), cy - tex._cy * (sc || 1), w, h); }
// 뒤 층: 빛기둥·빛무리·발밑 웅덩이·고리·물결·몸 윤곽 빛 (몸보다 먼저)
function enhBack(g, v, u, F, n, X, Y, sprN, flip, step, t) {
  var a = v.alpha, p = pz(F, t, v), col = F.prism ? prism(t) : F.c, cx = X + 8, cy = Y + 15, rx = F.rr, ry = Math.round(F.rr * 0.34 * 2) / 2;
  if (F.pillar) {      // 빛살 (+8~): 발밑에서 몸 양옆으로 솟는 빛줄기 — 줄 수·높이가 단계마다 는다 (머리 위는 이름표가 가리므로 옆으로)
    var nr = F.pillar, ri2;
    for (ri2 = 0; ri2 < nr; ri2++) {
      var side = ri2 % 2 ? 1 : -1, ox = side * (5 + (ri2 >> 1) * 2), ph2 = ((t * (0.7 + F.pulse * 0.2) + ri2 * 0.37 + v.bob) % 1 + 1) % 1, rh = (7 + nr * 1.5) * (0.4 + 0.6 * Math.sin(ph2 * Math.PI));
      g.globalAlpha = a * 0.5 * Math.sin(ph2 * Math.PI); g.fillStyle = F.prism ? prism(t, ri2 / nr) : col; g.fillRect(cx + ox - 0.5, cy - rh, 1, rh);
      g.globalAlpha = a * 0.9 * Math.sin(ph2 * Math.PI); g.fillStyle = '#ffffff'; g.fillRect(cx + ox - 0.5, cy - rh, 1, 1);
    }
  }
  if (F.aura) {      // 몸 뒤 빛무리 (+5~): 크기·밝기 증가, 맥박으로 숨 쉰다
    var ar = F.aura * (0.9 + 0.1 * p); g.globalAlpha = a * F.auraA * (0.6 + 0.4 * p);
    ringAt(g, auraTex(F.c, F.aura), cx, Y + 9, ar / F.aura);
  }
  if (F.floor) { g.globalAlpha = a * (0.55 + 0.45 * p); ringAt(g, ringTex(col, rx, ry, 0, 0, 0, 0, 0, F.floor), cx, cy); }
  if (F.ring === 1) { g.globalAlpha = a; ringAt(g, ringTex(col, rx, ry, 12, 2, 1, 1, 2), cx, cy); }      // 끊긴 고리 (고정, 굵은 마디) — +2 와 갈리는 첫 표시
  else if (F.ring >= 2) {
    g.globalAlpha = a * (0.8 + 0.2 * p); ringAt(g, ringTex(col, rx, ry, 56, 1, 0.8, 1, 2), cx, cy);      // 실선 고리
    if (F.ring >= 3) { g.globalAlpha = a * (0.65 + 0.35 * p); ringAt(g, ringTex(col, rx + 3, ry + 1, 60, 1, 0.55, 0.9, 2), cx, cy); }      // 겹고리
    if (F.ring >= 4) { g.globalAlpha = a; g.fillStyle = '#ffffff'; for (var ri = 0; ri < 6; ri++) { var ra = ri / 6 * 6.2832 + t * 2.4; g.fillRect(Math.round((cx + Math.cos(ra) * (rx + 3)) * 2) / 2 - 1, Math.round((cy + Math.sin(ra) * (ry + 1)) * 2) / 2 - 0.5, 2, 1.5); } }      // 도는 마디
  }
  if (F.pulse) { var rp = ((t * F.pulse * 0.6 + v.bob) % 1 + 1) % 1; g.globalAlpha = a * (1 - rp); ringAt(g, ringTex(col, rx, ry, 48, 1, 0.9, 1, 2), cx, cy, 1 + rp * 0.7); }      // 발밑에서 퍼지는 물결 — 맥박과 같은 박자
  if (F.halo) {      // 몸 윤곽 빛: 두께·세기·맥박이 단계마다 다르다
    var ac = DS.spriteCanvas(sprN, null, { flip: flip, tint: F.prism ? prism(t, 0.5) : col, hd: 1, step: step, pose: curPose }), o = F.halo > 1 ? 1 : 0.5;
    g.globalAlpha = a * F.haloA * (F.pulse ? 0.45 + 0.55 * p : 1);
    g.drawImage(ac, X - o, Y, 16, 16); g.drawImage(ac, X + o, Y, 16, 16); g.drawImage(ac, X, Y - o, 16, 16); g.drawImage(ac, X, Y + o, 16, 16);
    if (F.halo > 1) { g.globalAlpha *= 0.55; g.drawImage(ac, X - 1.5, Y, 16, 16); g.drawImage(ac, X + 1.5, Y, 16, 16); g.drawImage(ac, X, Y - 1.5, 16, 16); }
  }
  g.globalAlpha = a;
}
// 앞 층: 무기 빛·도는 빛·불티·불꽃·번개 (몸 다음)
function enhFront(g, v, u, F, n, X, Y, m, flip, t) {
  var a = v.alpha, p = pz(F, t, v), col = F.prism ? prism(t) : F.c, i, tx, ty, bb = null;
  if (m) {
    bb = maskBox(m); tx = X + bb.tx / 2; ty = Y + bb.ty / 2;
    var tm = tintMask(m, col);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = a * F.glow * (F.pulse ? 0.45 + 0.55 * p : 1); g.drawImage(tm, X, Y, 16, 16);
    g.globalAlpha *= 0.5; g.drawImage(tm, X - 0.5, Y, 16, 16); g.drawImage(tm, X + 0.5, Y, 16, 16); g.drawImage(tm, X, Y - 0.5, 16, 16);
    g.globalCompositeOperation = 'source-over';
  } else { tx = X + (flip ? 3 : 13); ty = Y + 2; g.globalAlpha = a * F.glow * p; g.fillStyle = col; g.fillRect(tx - 0.5, ty, 1, 7); }
  var wx0 = bb ? X + bb.x0 / 2 : tx - 1, wx1 = bb ? X + bb.x1 / 2 : tx + 1, wy0 = bb ? Y + bb.y0 / 2 : ty, wy1 = bb ? Y + bb.y1 / 2 : ty + 8;
  for (i = 0; i < F.motes; i++) {      // 몸 둘레를 도는 빛
    var ang = t * (1.4 + n * 0.18) + i * 6.2832 / F.motes + v.bob, er = 7 + n * 0.3;
    g.globalAlpha = a * (0.6 + 0.4 * Math.sin(t * 8 + i * 2)); g.fillStyle = i % 3 === 2 ? '#ffffff' : (F.prism ? prism(t, i / F.motes) : col);
    g.fillRect(Math.round((X + 8 + Math.cos(ang) * er) * 2) / 2 - 0.5, Math.round((Y + 8 + Math.sin(ang) * er * 0.55) * 2) / 2 - 0.5, 1.5, 1.5);
  }
  for (i = 0; i < F.sparks; i++) {      // 몸 둘레에서 오르는 불티 — 수와 빠르기가 단계마다 는다
    var ph = ((t * F.spd + i * 0.618 + v.bob) % 1 + 1) % 1, fx = ((i * 0.37) % 1), useW = i % 3 === 0 && bb;
    var sx = useW ? wx0 + (wx1 - wx0) * fx : X - 1 + fx * 18, sy = (useW ? wy0 + (wy1 - wy0) * 0.4 : Y + 14) - ph * (10 + n * 1.2) + Math.sin(t * 3 + i) * 0.3;
    sx += Math.sin(t * 2 + i * 1.7) * 0.8;
    g.globalAlpha = a * (1 - ph); g.fillStyle = ph < 0.2 ? '#ffffff' : (F.prism ? prism(t, fx) : col);
    g.fillRect(Math.round(sx * 2) / 2, Math.round(sy * 2) / 2, n >= 9 ? 1.5 : 1, n >= 8 ? 2 : 1.5);
  }
  var tp = ((t * (0.5 + n * 0.08) + v.bob * 0.3) % 1 + 1) % 1;      // 날끝 반짝임 (모든 단계, 단계가 오를수록 자주·크게) — +3 의 정지한 고리에 생기를 더한다
  if (tp < 0.3) { var s3 = (tp < 0.15 ? 1 : 0.5) * (1 + (n >= 7 ? 0.5 : 0)); g.globalAlpha = a * (1 - tp / 0.3); g.fillStyle = '#ffffff'; g.fillRect(tx - s3, ty - 0.5, s3 * 2 + 0.5, 0.5); g.fillRect(tx - 0.25, ty - 0.5 - s3, 0.5, s3 * 2 + 0.5); }
  if (F.flame) {      // 날끝 불꽃
    for (i = 0; i < 3 + (n >= 9 ? 2 : 0); i++) { var fl = (Math.sin(t * 17 + i * 2.1) + 1) * 0.5; g.globalAlpha = a * (0.6 + 0.4 * fl); g.fillStyle = i === 0 ? '#ffffff' : col; g.fillRect(Math.round((tx - 0.5 + (i % 3 - 1) * 0.5) * 2) / 2, Math.round((ty - 0.5 - i * 0.5 - fl) * 2) / 2, 0.5, 0.5 + fl * 0.5); }
  }
  if (F.bolt && ((t * 1.6 + v.bob) % 1) < 0.16) {      // 번개: 무기 끝에서 바깥으로 지그재그
    g.globalAlpha = a; g.fillStyle = '#ffffff'; var bx = tx, by = ty, d = flip ? -1 : 1;
    for (i = 0; i < 7; i++) { bx += d * 0.5 * (i % 2 ? 1 : 2); by += (i % 2 ? -0.5 : 1); g.fillRect(Math.round(bx * 2) / 2, Math.round(by * 2) / 2, 0.5, 0.5); }
  }
  if (F.prism) {      // +10: 네 갈래 반짝임 셋
    for (i = 0; i < 3; i++) { var sp = ((t * 0.8 + i / 3) % 1); if (sp > 0.6) continue; var s2 = sp < 0.3 ? 1.5 : 1, cx = X + 8 + Math.cos(i * 2.1) * 8, cy = Y + 6 + Math.sin(i * 2.1) * 5;
      g.globalAlpha = a * (1 - sp / 0.6); g.fillStyle = '#ffffff'; g.fillRect(cx - s2, cy, s2 * 2 + 0.5, 0.5); g.fillRect(cx, cy - s2, 0.5, s2 * 2 + 0.5); }
  }
  g.globalAlpha = a;
}
// 전설 무기: 금빛이 아니라 그 장비 고유의 보석빛이 날을 따라 천천히 흐른다 (강화 빛과 따로)
function legendGlint(g, v, m, X, Y, t) {
  var bb = maskBox(m), ph = ((t * 0.5 + v.bob) % 1.6); if (ph > 1) return;
  var y = Y + (bb.y0 + (bb.y1 - bb.y0) * ph) / 2;
  g.save(); g.beginPath(); g.rect(X, y - 0.5, 16, 1); g.clip(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = v.alpha * 0.7 * Math.sin(ph * Math.PI); g.drawImage(tintMask(m, '#fff6d0'), X, Y, 16, 16); g.restore();
}

// ════════ r11 gfx: 가문 문장 — DS.crest(집 이름 또는 수) 하나로 정해진다. 문패(성)가 바뀌면 문장도 바뀐다 ════════
var CR_T = ['#f6cf57', '#e9e2d0'], CR_C = ['#c0303a', '#3572b8', '#3f8f4c', '#2b2440', '#7446ad', '#d0682a'];      // 금속 둘(금·은) · 색 여섯 — 금속 위에 색, 색 위에 금속
var CHARGE = {
  star: ['..x..', '.xxx.', 'xxxxx', '.xxx.', '.x.x.'], tower: ['x.x.x', 'xxxxx', '.xxx.', '.x.x.', '.xxx.'], moon: ['.xxx.', 'xx...', 'x....', 'xx...', '.xxx.'],
  key: ['.xx..', 'x..x.', '.xx..', '..x..', '..xx.'], sword: ['..x..', '..x..', '..x..', 'xxxxx', '..x..'], tree: ['.xxx.', 'xxxxx', '.xxx.', '..x..', '.xxx.'],
  wave: ['.....', 'x.x.x', '.x.x.', 'x.x.x', '.x.x.'], flame: ['..x..', '.xx..', '.xxx.', 'xxxxx', '.xxx.'], crown: ['x.x.x', 'xxxxx', 'xxxxx', '.....', '.....'],
  bird: ['x...x', 'xx.xx', '.xxx.', '..x..', '.x.x.'], sun: ['x.x.x', '.xxx.', 'xxxxx', '.xxx.', 'x.x.x'], bell: ['..x..', '.xxx.', '.xxx.', 'xxxxx', '..x..'],
  leaf: ['...xx', '..xxx', '.xxx.', 'xxx..', 'x....'], axe: ['.xx..', 'xxxx.', '.xxx.', '..x..', '..x..'], fish: ['.....', 'x.xx.', 'xxxxx', 'x.xx.', '.....'], horse: ['..xx.', '.xxx.', 'xxx..', '.xx..', '.x.x.']
};
var CH_K = Object.keys(CHARGE);
function strHash(s) { s = String(s == null ? '' : s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; } return h; }
DS.crest = function (key) {
  var h = strHash(key), m = CR_T[h & 1], c = CR_C[(h >>> 1) % 6], c2 = CR_C[((h >>> 1) % 6 + 1 + ((h >>> 4) % 5)) % 6], inv = (h >>> 7) & 1;
  return { key: String(key), field: inv ? m : c, charge: inv ? c : m, field2: c2, div: ['plain', 'pale', 'chief', 'bend', 'plain', 'border'][(h >>> 8) % 6], ch: CH_K[(h >>> 11) % CH_K.length], shape: (h >>> 15) % 3 };
};
var crestC = {};
DS.crestCanvas = function (key, px) {      // 방패 문장 그림 (14×14 격자를 1px 외곽선으로, px 배). 아이콘·가계도·마을 깃발이 쓴다
  px = px || 2; var ck = key + '|' + px; if (crestC[ck]) return crestC[ck];
  var C = DS.crest(key), cv = document.createElement('canvas'); cv.width = cv.height = 14 * px; var g = cv.getContext('2d'), x, y, K = '#1b1626';
  function inside(x, y) { if (x < 1 || x > 12 || y < 1 || y > 12) return false; if (C.shape === 0) return y < 8 || Math.abs(x - 6.5) < (13 - y) * 0.9; if (C.shape === 1) return (x - 6.5) * (x - 6.5) + (y - 6.5) * (y - 6.5) < 34; return y < 11 || (y === 11 && x !== 6 && x !== 7) || (y === 12 && (x < 4 || x > 9)); }
  for (y = 0; y < 14; y++) for (x = 0; x < 14; x++) {
    var on = inside(x, y), edge = !on && (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1));
    if (!on && !edge) continue;
    var col = edge ? K : C.field;
    if (on) { if (C.div === 'pale' && x >= 7) col = C.field2; else if (C.div === 'chief' && y <= 4) col = C.field2; else if (C.div === 'bend' && x - y > 1) col = C.field2; else if (C.div === 'border' && !(inside(x - 1, y) && inside(x + 1, y) && inside(x, y - 1) && inside(x, y + 1))) col = C.charge; }
    g.fillStyle = col; g.fillRect(x * px, y * px, px, px);
  }
  var P = CHARGE[C.ch], ox = 4, oy = C.div === 'chief' ? 5 : 4;
  for (y = 0; y < 5; y++) for (x = 0; x < 5; x++) if (P[y][x] === 'x') { g.fillStyle = C.charge; g.fillRect((ox + x) * px, (oy + y) * px, px, px); }
  g.fillStyle = 'rgba(255,255,255,.28)'; for (x = 2; x < 12; x++) if (inside(x, 1)) g.fillRect(x * px, px, px, Math.max(1, px >> 1));
  return (crestC[ck] = cv);
};
DS.crestHtml = function (key, size) { try { return '<img class="gfx-crest px" alt="" src="' + DS.crestCanvas(key, 2).toDataURL() + '" style="width:' + (size || 28) + 'px;height:' + (size || 28) + 'px;image-rendering:pixelated">'; } catch (e) { return ''; } };
// 유닛의 가문 키: 4.0 칸 u.house(문패) → 지휘관 가계도의 성(sn) → 가문 이름(lin.sur) → 병과 기본
DS.unitHouse = function (u) {
  if (u.house) return u.house;
  var S = DS.G && DS.G.save, ch = S && S.chars && u.ch != null ? S.chars[u.ch] : null;
  if (!ch) return null;
  var L = S.lin, p = ch.pid && L && L.P ? L.P[ch.pid] : null;
  return (ch.id === S.hero && L && L.sur) || (p && p.sn) || (DS.LIN_HOUSE && DS.LIN_HOUSE[ch.cls]) || null;
};
// 등 뒤 깃발 한 장(2배 격자)을 굽는다: 병과 색 바탕 + 가문 문장(작게) + 제비꼬리. 바람 두 장(wv)
var flagC = {};
// 1.0.4: 등 깃발의 문장도 메뉴·카드와 같은 가문마크(DS.houseCrest)로 — 병과(cls)로 정한다. 그림은 처음 한 번 비동기로 굽고, 다 구워지면 깃발을 다시 굽는다
var flagMk = {};
function flagMark(cls, lord) {
  var k = cls + (lord ? 'L' : ''); if (flagMk[k] !== undefined) return flagMk[k];
  flagMk[k] = null; if (!DS.houseCrest || typeof Image === 'undefined') return null;
  try { var im = new Image(); im.onload = function () { flagMk[k] = im; for (var q in flagC) if (q.indexOf('|' + k + '|') >= 0) delete flagC[q]; };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(DS.houseCrest(cls, 32, { lord: lord }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); } catch (e) {}
  return null;
}
function flagCanvas(col, house, mst, wv, cls, lord) {
  var key = col + '|' + house + '|' + (mst ? 1 : 0) + wv + '|' + (cls ? cls + (lord ? 'L' : '') : '') + '|'; if (flagC[key]) return flagC[key];
  var MK = cls ? flagMark(cls, lord) : null;
  var fw = (mst ? 8 : 6) * 2, fh = (mst ? 6 : 4) * 2, cv = document.createElement('canvas'); cv.width = fw + 2; cv.height = fh + 4; var g = cv.getContext('2d'), x, y, K = '#1b1626';
  var C = house ? DS.crest(house) : null, ow = fw >> 1;
  for (y = 0; y < fh; y++) for (x = 0; x < fw; x++) {
    var yy = y - (x < ow ? 0 : wv), notch = x < 2 && Math.abs(y - fh / 2 + 0.5) < (2 - x) * 1.2;      // 깃대에서 먼 쪽(왼쪽)이 제비꼬리
    if (yy < 0 || notch) continue;
    g.fillStyle = col; g.fillRect(x + 1, yy + 1, 1, 1);
  }
  // 외곽선 1px (그린 칸 둘레)
  var d = g.getImageData(0, 0, cv.width, cv.height), D = d.data, W = cv.width, H = cv.height, out = [];
  for (y = 0; y < H; y++) for (x = 0; x < W; x++) { var i = (y * W + x) * 4; if (D[i + 3]) continue; if ((x > 0 && D[i - 1]) || (x < W - 1 && D[i + 7]) || (y > 0 && D[i - W * 4 + 3]) || (y < H - 1 && D[i + W * 4 + 3])) out.push(x, y); }
  g.fillStyle = K; for (x = 0; x < out.length; x += 2) g.fillRect(out[x], out[x + 1], 1, 1);
  g.fillStyle = 'rgba(0,0,0,.22)'; for (x = 0; x < fw; x++) g.fillRect(x + 1, fh - (x < ow ? 0 : -wv), 1, 1);
  g.fillStyle = 'rgba(255,255,255,.3)'; for (x = 2; x < fw; x++) g.fillRect(x + 1, 1 + (x < ow ? 0 : wv), 1, 1);
  if (MK) {      // 1.0.4: 가문마크 그림을 깃발 가운데에
    var msz = mst ? 9 : 7, mx = (fw >> 1) + 1 - (msz >> 1), my = (fh >> 1) + 1 - (msz >> 1) + (wv && mx >= ow ? 1 : 0);
    g.imageSmoothingEnabled = true; g.drawImage(MK, mx, my - 1, msz, msz + 1);
  } else if (C && !cls) {      // 문장: 가운데에 방패 바탕(문장 바탕색) + 무늬(5×5 → 깃발이 작으면 3×3 줄임)
    var P = CHARGE[C.ch], cx = (fw >> 1) + 1 - (mst ? 3 : 2), cy = (mst ? 3 : 2) + (wv && cx >= ow ? 1 : 0), sz = mst ? 7 : 5;
    g.fillStyle = K; g.fillRect(cx - 1, cy - 1, sz + 2, sz + 2); g.fillStyle = C.field; g.fillRect(cx, cy, sz, sz);
    g.fillStyle = C.charge;
    if (mst) { for (y = 0; y < 5; y++) for (x = 0; x < 5; x++) if (P[y][x] === 'x') g.fillRect(cx + 1 + x, cy + 1 + y, 1, 1); }
    else for (y = 0; y < 5; y++) for (x = 0; x < 5; x++) if (P[y][x] === 'x' && (x + y) % 1 === 0) g.fillRect(cx + x, cy + y, 1, 1);
  }
  if (mst) { g.fillStyle = '#f6cf57'; for (x = 2; x < fw; x++) g.fillRect(x + 1, 1 + (x < ow ? 0 : wv), 1, 1); }
  return (flagC[key] = cv);
}
// 상태 표식(체력 막대 왼쪽 위 작은 그림): 비탄(빗방울 셋) · 노년(지팡이)
function moodMark(g, x, y, k, t) {
  var K = '#1b1626';
  if (k === 'grief') { var dy = (Math.floor(t * 3) % 3) * 0.5; g.fillStyle = K; g.fillRect(x - 0.5, y - 0.5, 5, 3); g.fillStyle = '#8a94b8'; g.fillRect(x, y, 4, 2); g.fillStyle = '#9fd0ff'; g.fillRect(x + 0.5, y + 2.5 + dy, 0.5, 1); g.fillRect(x + 2, y + 3 + dy, 0.5, 1); g.fillRect(x + 3.5, y + 2.5 + dy, 0.5, 1); }
  else if (k === 'elder') { g.fillStyle = K; g.fillRect(x + 0.5, y - 0.5, 3, 1.5); g.fillRect(x + 1.5, y, 1.5, 5.5); g.fillStyle = '#d8c39a'; g.fillRect(x + 1, y, 2, 0.5); g.fillRect(x + 2, y, 0.5, 5); }
}
function moodOf(u) {
  if (u.mood) return u.mood;      // 4.0 칸이 있으면 그대로 ('grief' | 'elder')
  var S = DS.G && DS.G.save, e = S && S.chars && u.ch != null ? S.chars[u.ch] : null;
  if (!e && S && u.mid != null && S.mercs) for (var i = 0; i < S.mercs.length; i++) if (S.mercs[i].id === u.mid) { e = S.mercs[i]; break; }
  if (!e) return null;
  if (e.gr && e.gr.k === 'grief') return 'grief';
  if (e.eld) return 'elder';
  return null;
}
// r16 fx: 오름 연출 중의 몸 — 가로로 눌렀다 뒤집어 한 바퀴 빙글(sc), 금빛 윤곽과 흰빛으로 감싼다(glow)
function cerBody(g, cv, x, y, w, cp, spn, pal, flip, step, pose, alpha) {
  var cx = x + w / 2, sc = Math.max(0.08, Math.abs(cp.sc));
  g.save(); g.translate(cx, 0); g.scale(sc, 1); g.translate(-cx, 0);
  if (cp.glow > 0.05) { var oc = DS.spriteCanvas(spn, pal, { flip: flip, tint: '#ffd75e', hd: 1, step: step, pose: pose }); g.globalAlpha = alpha * Math.min(1, cp.glow * 1.3) * 0.85; g.drawImage(oc, x - 1, y, w, w); g.drawImage(oc, x + 1, y, w, w); g.drawImage(oc, x, y - 1, w, w); g.drawImage(oc, x, y + 1, w, w); }
  g.globalAlpha = alpha; g.drawImage(cv, x, y, w, w);
  if (cp.glow > 0.01) { var wc = DS.spriteCanvas(spn, pal, { flip: flip, tint: '#fff8e0', hd: 1, step: step, pose: pose }); g.globalAlpha = alpha * Math.min(1, cp.glow); g.drawImage(wc, x, y, w, w); }
  g.restore(); g.globalAlpha = alpha;
}
V.drawUnit = function (g, v) {
  if (v.ds && this.drawDeath) { this.drawDeath(g, v); return; }      // r16 fx: 죽음 장면
  if (v.gone) return;
  var u = v.u, t = this.time, px = v.x * 16, py = v.y * 16;
  if (px - this.cam.x < -40 || py - this.cam.y < -40 || px - this.cam.x > this.W / this.k + 40 || py - this.cam.y > this.H / this.k + 40) return;
  var sp = DS.unitSprite(u), big = !!u.big, fly = u.tags && u.tags.indexOf('fly') >= 0;
  var cmd = u.side === 'ally' && u.role === 'cmd', merc = u.side === 'ally' && u.role !== 'cmd', boss = u.role === 'boss' && !u.fake;
  // r11 gfx: 아군은 옷차림(장비·나이)을 입힌 이름 — 1초에 한 번만 다시 읽는다. bearer = 깃발을 든 사람(4.0 u.flag, 없으면 지휘관)
  var spn = sp[0]; if ((u.side === 'ally' || u.arSide) && !sp[1] && DS.unitSpriteName) { if (!v.dn || t - v.dnT > 1) { try { v.dn = DS.unitSpriteName(u.arSide ? Object.assign(Object.create(u), { side: 'ally' }) : u); } catch (e0) { v.dn = sp[0]; } v.dnT = t; } spn = v.dn; }
  var bearer = u.flag != null ? !!u.flag : cmd;
  var lx = 0, ly = 0, K = '#1b1626';
  if (v.lunge) { var q = Math.sin(v.lunge.t * Math.PI) * 4; lx = v.lunge.dx * q; ly = v.lunge.dy * q; }
  if (v.hit && v.hit.t > 0) { var hq = Math.sin(Math.min(1, v.hit.t) * Math.PI) * v.hit.k; lx += v.hit.dx * hq; ly += v.hit.dy * hq; }      // 맞고 밀린다
  var bob = fly ? Math.round(Math.sin(t * 4 + v.bob) * 1.5) - 3 : (v.t < 1 ? -Math.abs(Math.sin(v.t * Math.PI)) * 1.5 : 0);
  var dq = v.dying >= 0 && !v.flee ? 1 - v.dying / v.dieDur : -1;      // 쓰러지는 중: 0 → 1
  if (dq >= 0 && boss) lx += Math.random() * 2 - 1;
  g.globalAlpha = v.alpha * (u.fakeGhost ? 0.6 : 1);
  g.fillStyle = 'rgba(0,0,0,.3)';
  if (DS.TOON !== false) { var shT = softShadow(); g.globalAlpha = v.alpha * (u.fakeGhost ? 0.6 : 1) * (fly ? 0.6 : 1); if (big) g.drawImage(shT, px - 2.5, py + 11, 21, 7.5); else g.drawImage(shT, px + 1.5, py + 11.5, 13, 5); g.globalAlpha = v.alpha * (u.fakeGhost ? 0.6 : 1); }      // r13 toon: 부드러운 발밑 그림자 (구운 한 장)
  else if (big) { g.fillRect(px + 1, py + 12.5, 14, 0.5); g.fillRect(px - 1, py + 13, 18, 3); g.fillRect(px + 2, py + 16, 12, 1); g.fillRect(px + 4, py + 17, 8, 0.5); g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(px + 2, py + 13.5, 12, 2); }
  else { g.fillRect(px + 4.5, py + 12.5, 7, 0.5); g.fillRect(px + 3, py + 13, 10, 2); g.fillRect(px + 4.5, py + 15, 7, 0.5); g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(px + 5, py + 13.5, 6, 1); }      // r4 hd: 반 픽셀로 둥근 그림자, 발밑은 한 단계 짙게
  if (boss && dq < 0) {      // 보스: 발밑의 색 원 + 도는 기운 (r8: 원 그림자를 깔아 난전에서도 자리가 보이게, 붉은 땅에서는 금빛)
    var bcol = this.hot ? '#ffd75e' : '#ff4d6d';
    g.fillStyle = bcol; g.globalAlpha = v.alpha * (0.2 + 0.07 * Math.sin(t * 3));
    g.fillRect(px - 2, py + 11, 20, 1); g.fillRect(px - 5, py + 12, 26, 1); g.fillRect(px - 6, py + 13, 28, 3); g.fillRect(px - 5, py + 16, 26, 1); g.fillRect(px - 2, py + 17, 20, 1);
    g.globalAlpha = v.alpha * 0.75; g.fillRect(px - 2, py + 10.5, 20, 0.5); g.fillRect(px - 2, py + 18, 20, 0.5); g.fillRect(px - 7, py + 13, 0.5, 3); g.fillRect(px + 22.5, py + 13, 0.5, 3);
    g.fillRect(px - 5, py + 11.5, 3, 0.5); g.fillRect(px + 18, py + 11.5, 3, 0.5); g.fillRect(px - 5, py + 17, 3, 0.5); g.fillRect(px + 18, py + 17, 3, 0.5); g.fillRect(px - 6, py + 12.5, 1, 0.5); g.fillRect(px + 21, py + 12.5, 1, 0.5); g.fillRect(px - 6, py + 16, 1, 0.5); g.fillRect(px + 21, py + 16, 1, 0.5);
    for (var bi = 0; bi < 10; bi++) { var ba = t * 1.4 + bi * 0.6283; g.globalAlpha = v.alpha * (0.4 + 0.3 * Math.sin(t * 4 + bi)); g.fillRect(Math.round(px + 8 + Math.cos(ba) * 13), Math.round(py + 14 + Math.sin(ba) * 4), bi % 3 ? 1 : 2, 1); }
    g.globalAlpha = v.alpha;
  }
  var bp = Math.sin(t * 5) > 0 ? 1 : 0;      // 고른 유닛·노린 적의 테두리가 숨 쉬듯 벌어졌다 오므라든다
  // r26: 고른 유닛 = 발밑에 숨 쉬는 금빛 점 고리 (겨누는 동안만 테두리도) · 노린 적 = 도는 붉은 조준 꺾쇠 + 머리 위 작은 ▼
  if (u.id === this.sel && dq < 0) {
    var rs = this.calmN ? 1 : 1 + 0.07 * Math.sin(t * 5), rx = (big ? 12 : 7.5) * rs, ry = (big ? 4 : 3) * rs, sa0 = this.calmN ? 0 : t * 1.4;
    g.fillStyle = '#1b1626'; g.globalAlpha = v.alpha * 0.5; g.fillRect(px + 8 - rx, py + 14 + ry, rx * 2, 0.5);
    g.fillStyle = '#f6cf57';
    for (var si = 0; si < 18; si++) { var sa = si / 18 * 6.2832 + sa0; g.globalAlpha = v.alpha * (si % 3 ? 0.55 : 1); g.fillRect(Math.round((px + 8 + Math.cos(sa) * rx) * 2) / 2 - 0.5, Math.round((py + 14 + Math.sin(sa) * ry) * 2) / 2 - 0.25, si % 3 ? 1 : 1.5, si % 3 ? 0.5 : 1); }
    g.globalAlpha = v.alpha;
    if (this.aim) bracket(g, px - 1 - bp, py - 1 - bp, 18 + bp * 2, 18 + bp * 2, '#f6cf57', 5);
  }
  else if (u.id === this.tgt && dq < 0) reticle(g, px + 8, py + 8 - (big ? 4 : 0), big, t, this.calmN, py - (big ? 13 : 5) + (fly ? -3 : 0) - 7);
  if (cmd && (bearer || u.id === this.sel)) { g.fillStyle = u.id === this.sel ? '#f6cf57' : '#5fc4d6'; g.fillRect(px + 4, py + 15, 8, 1); }
  else if (merc && big && u.grade >= 3 && dq < 0) {      // 큰 용병(희귀 이상): 발밑에 등급색 타원 — 영웅은 숨 쉬고, 전설은 빛이 돈다
    var gc = DS.GRADES[u.grade].col, ga, gi;
    for (gi = 0; gi < 20; gi++) {
      ga = gi / 20 * 6.2832; g.globalAlpha = v.alpha * (u.grade >= 4 ? 0.45 + 0.25 * Math.sin(t * 4 + v.bob) : 0.4);
      if (u.grade >= 5 && Math.abs(((gi / 20 - t * 0.35) % 1 + 1) % 1 - 0.5) < 0.1) { g.globalAlpha = v.alpha; g.fillStyle = '#ffffff'; } else g.fillStyle = gc;
      g.fillRect(Math.round(px + 8 + Math.cos(ga) * 12), Math.round(py + 14 + Math.sin(ga) * 3.5), 1, 1);
    }
    g.globalAlpha = v.alpha;
  }
  else if (u.elite != null && u.side === 'enemy' && dq < 0) {      // 정예 우두머리: 발밑을 도는 금빛·주황 기운
    for (var ei2 = 0; ei2 < 12; ei2++) { var ea2 = t * 1.8 + ei2 * 0.5236; g.globalAlpha = v.alpha * (0.45 + 0.35 * Math.sin(t * 5 + ei2)); g.fillStyle = ei2 % 3 ? '#ff9a3c' : '#f6cf57'; g.fillRect(Math.round(px + 8 + Math.cos(ea2) * (big ? 13 : 9)), Math.round(py + 14 + Math.sin(ea2) * 3), ei2 % 4 ? 1 : 2, 1); }
    g.globalAlpha = v.alpha;
  }
  else if (u.eliteCrew != null && u.side === 'enemy' && dq < 0) { g.fillStyle = 'rgba(255,154,60,.8)'; g.fillRect(px + 4, py + 15, 8, 1); }
  else if (u.side === 'enemy' && u.aggro && !boss && dq < 0 && !big) { g.fillStyle = 'rgba(255,77,109,.7)'; g.fillRect(px + 5, py + 15, 6, 1); }      // 싸우는 적: 발밑 붉은 밑줄 (난전에서 피아 구분)
  else if (merc && u.grade >= 4 && dq < 0) {      // 영웅·전설 용병: 발밑에 등급색 빛, 전설은 도는 반짝임
    g.fillStyle = DS.GRADES[u.grade].col; g.globalAlpha = v.alpha * (0.5 + 0.35 * Math.sin(t * 5 + v.bob)); g.fillRect(px + 4, py + 15, 8, 1);
    if (u.grade >= 5) { var ta = t * 2.2 + v.bob; g.fillRect(Math.round(px + 8 + Math.cos(ta) * 7), Math.round(py + 7 + Math.sin(ta) * 5), 1, 1); g.fillStyle = '#ffffff'; g.fillRect(Math.round(px + 8 - Math.cos(ta) * 7), Math.round(py + 7 - Math.sin(ta) * 5), 1, 1); }
    g.globalAlpha = v.alpha;
  }
  var white = v.flash > 0 || (dq >= 0 && (boss ? Math.floor(t * 18) % 2 === 0 : dq < 0.3));
  // r7 프레임: 칸 사이를 걷는 동안 발을 번갈아 들고(2프레임), 공격 앞부분엔 윗몸이 앞으로, 맞으면 뒤로 젖혀진다
  var step = (v.t < 1 && !fly && dq < 0 && !white) ? ((((Math.round(v.tx) + Math.round(v.ty)) & 1) ^ (v.t < 0.5 ? 1 : 0)) ? 1 : 2) : 0;
  var lean = dq >= 0 ? 0 : v.lunge && v.lunge.t < 0.7 ? (v.lunge.dx > 0.3 ? 1 : v.lunge.dx < -0.3 ? -1 : (u.face < 0 ? -1 : 1)) : (v.hit && v.hit.t > 0 && v.hit.dx ? (v.hit.dx > 0 ? 1 : -1) : 0);
  var pose = DS.ART === 'new' ? (dq >= 0 ? '' : v.lunge && v.lunge.t < 0.7 ? 'atk' : v.hit && v.hit.t > 0 ? 'hit' : v.cast && v.cast.t < 0.8 ? 'cast' : '') : '';      // r14 새 그림: 공격·피격·시전 자세 그림
  if (pose) { step = 0; } curPose = pose;
  var CE = this.cer && this.cer[u.id], cp = CE && CE.c && dq < 0 && !white ? cerPose(CE.c) : null, cpOn = !!(cp && (cp.sc < 0.999 || cp.glow > 0.01)), cflip = (u.face < 0) !== !!(cp && cp.sc < 0);      // r16 fx: 오름 연출 중의 몸 (돌기·빛·옛 모습)
  if (cp) { if (cp.old) spn = cp.old; bob -= cp.lift; if (cp.sc < 0.999) { step = 0; lean = 0; } }
  var cv = DS.spriteCanvas(spn, sp[1], { flip: cflip, tint: white ? '#ffffff' : null, hd: 1, step: step, pose: pose, rim: !white && this.hot && u.side === 'enemy' ? 'e' : undefined });      // r8: 붉은·보랏빛 땅의 적은 밝은 윗 테
  if (v.cast && dq < 0) {      // r7 시전: 발밑에 도는 작은 마법진, 몸이 반 픽셀 떠오른다
    var cf = v.cast.t, ca = v.alpha * (cf < 0.2 ? cf / 0.2 : 1 - (cf - 0.2) / 0.8), cr = big ? 12 : 8, ci;
    g.fillStyle = v.cast.c;
    for (ci = 0; ci < 16; ci++) { var cang = ci / 16 * 6.2832 + t * 5; g.globalAlpha = ca * (ci % 2 ? 0.55 : 0.95); g.fillRect(px + 8 + Math.cos(cang) * cr - 0.25, py + 14 + Math.sin(cang) * cr * 0.35 - 0.25, ci % 4 ? 0.5 : 1, 0.5); }
    g.globalAlpha = ca * 0.7; g.fillRect(px + 8 - cr * 0.5, py + 14, cr, 0.5);
    g.globalAlpha = v.alpha; bob -= Math.sin(Math.min(1, cf) * Math.PI) * 1;
  }
  if (bearer && !byBoss(this, v, 1.6)) {      // r11: 깃발을 든 사람은 등에 깃발 — 병과 색 바탕에 가문 문장, 마스터(8단~)는 금테 큰 깃발 (보스 곁에서는 접는다). 따르는 이는 깃발 없이
    var mst = u.tier >= 8, fw = mst ? 8 : 6, fh = mst ? 6 : 4, ph = mst ? 15 : 13;
    var fx0 = Math.round(px + lx) + (u.face < 0 ? 14 : 1), fy0 = Math.round(py - (ph - 2) + ly + bob), wv = Math.sin(t * 6 + v.bob) > 0 ? 1 : 0, fd = u.face < 0 ? -1 : 1;
    var fcls = DS.CLASSES[u.cls] ? u.cls : null, fc = u.flagCol || DS.FLAG[u.cls] || '#f6cf57', hk = v.hk !== undefined && t - v.dnT < 1.01 ? v.hk : (v.hk = DS.unitHouse ? DS.unitHouse(u) : null);
    g.fillStyle = K; g.fillRect(fx0, fy0, 1, ph);
    g.fillStyle = '#8a5a36'; g.fillRect(fx0 + 0.25, fy0 + 0.5, 0.5, ph - 1);
    var fcv = flagCanvas(fc, hk || '', mst, wv, fcls, !!u.hero), fwW = fcv.width / 2, fhW = fcv.height / 2;
    if (fd > 0) g.drawImage(fcv, fx0 - fw - 0.5, fy0 - 0.5, fwW, fhW);
    else { g.save(); g.translate(fx0 + 1 + fw + 0.5, fy0 - 0.5); g.scale(-1, 1); g.drawImage(fcv, 0, 0, fwW, fhW); g.restore(); }
    if (mst) { g.fillStyle = K; g.fillRect(fx0 - 1, fy0 - 3, 3, 2); g.fillStyle = '#f6cf57'; g.fillRect(fx0 - 0.5, fy0 - 2.5, 2, 1); g.fillStyle = '#fff6d0'; g.fillRect(fx0, fy0 - 3, 1, 0.5); }
    if (u.hero) { g.fillStyle = '#fff6d0'; g.fillRect(fx0, fy0 - 1, 1, 1); }
  }
  var en = cmd ? (u.enh || 0) : 0, EF = DS.ENH_FX[DS.enhStep(en)] || null, sX = Math.round(px + lx), sY = Math.round(py - 2 + ly + bob);
  if (EF && dq < 0 && !white && !big && !merc && !cpOn) enhBack(g, v, u, EF, Math.min(10, en), sX, sY, spn, u.face < 0, step, t);
  var breath = v.t >= 1 && !v.lunge && !fly && dq < 0 && !cpOn && Math.sin(t * 2.4 + v.bob * 2) > 0.35;
  if (u.elite != null && u.side === 'enemy' && dq < 0 && !white && !big) {      // 정예 우두머리: 주황 윤곽이 숨 쉰다
    var ec2 = DS.spriteCanvas(spn, sp[1], { flip: u.face < 0, tint: '#ff9a3c', hd: 1, step: step, pose: pose }), ex2 = Math.round(px + lx), ey2 = Math.round(py - 2 + ly + bob), ew2 = lwOf(ec2);
    g.globalAlpha = v.alpha * (0.4 + 0.25 * Math.sin(t * 4)); g.drawImage(ec2, ex2 - 1, ey2, ew2, ew2); g.drawImage(ec2, ex2 + 1, ey2, ew2, ew2); g.drawImage(ec2, ex2, ey2 - 1, ew2, ew2); g.drawImage(ec2, ex2, ey2 + 1, ew2, ew2); g.globalAlpha = v.alpha;
  }
  var sq = dq >= 0.3 && !boss ? 1 - (dq - 0.3) / 0.7 * 0.8 : 1;
  if (big) {
    var bs = merc ? 0.88 : 1, bx0 = Math.round(px - 4 + lx + 12 * (1 - bs)), by0 = Math.round(py - 9 + ly + bob + 24 * (1 - bs));
    if (merc && u.grade >= 4 && dq < 0 && !white) {      // 영웅·전설 큰 용병: 등급색 윤곽이 은은히 빛난다
      var oc = DS.spriteCanvas(sp[0], sp[1], { flip: u.face < 0, tint: DS.GRADES[u.grade].col, hd: 1, step: step, pose: pose });
      g.globalAlpha = v.alpha * (0.35 + 0.2 * Math.sin(t * 3 + v.bob));
      blit(g, oc, bx0 - 1, by0, 24 * bs, 24 * bs, breath, sq); blit(g, oc, bx0 + 1, by0, 24 * bs, 24 * bs, breath, sq); blit(g, oc, bx0, by0 - 1, 24 * bs, 24 * bs, breath, sq); blit(g, oc, bx0, by0 + 1, 24 * bs, 24 * bs, breath, sq);
      g.globalAlpha = v.alpha;
    }
    if (cpOn) cerBody(g, cv, bx0, by0, 24 * bs, cp, spn, sp[1], cflip, step, pose, v.alpha); else
    blit(g, cv, bx0, by0, 24 * bs, 24 * bs, breath, sq, lean);
  }
  else if (merc) { if (cpOn) cerBody(g, cv, Math.round(px + lx) + 1.5, Math.round(py - 2 + ly + bob) + 3, 13, cp, spn, sp[1], cflip, step, pose, v.alpha); else blit(g, cv, Math.round(px + lx) + 1.5, Math.round(py - 2 + ly + bob) + 3, 13, 13, breath, sq, lean); }      // 용병은 조금 작게
  else if (cpOn) cerBody(g, cv, sX, sY, lwOf(cv), cp, spn, sp[1], cflip, step, pose, v.alpha);      // r16 fx: 도는 동안은 무기 빛을 쉰다 (자리가 어긋난다)
  else {
    blit(g, cv, sX, sY, lwOf(cv), lwOf(cv), breath, sq, lean);
    if (cmd && dq < 0 && !white && sq >= 1 && ((!breath && !lean) || pose)) {      // r11: 무기 빛 (몸 위) — 숨·기울기 프레임에는 무기 자리가 어긋나므로 쉰다 (짧다)
      var wm = DS.spriteCanvas(spn, null, { flip: u.face < 0, hd: 1, step: step, mask: 1, pose: pose });
      if (EF) enhFront(g, v, u, EF, Math.min(10, en), sX, sY, wm, u.face < 0, t);
      if (wm && v.leg) legendGlint(g, v, wm, sX, sY, t);
    } else if (EF && cmd && dq < 0 && !white) enhFront(g, v, u, EF, Math.min(10, en), sX, sY + (breath ? 1 : 0), null, u.face < 0, t);
  }
  // 체력·틱
  if (v.dying < 0) {
    var top = py - (big ? 13 : 5) + (fly ? -3 : 0), w = big ? 22 : 14, x0 = px + 8 - w / 2, hp = Math.max(0, u.hp / u.mhp);
    // 용병의 체력바는 다쳤거나 싸우는 중에만 — 멀쩡히 걸어 다닐 때는 등급 표식만 머리 위에
    var show = u.side === 'ally' ? (cmd || hp < 1) : (u.aggro || hp < 1);      // 2.8: 멀쩡한 용병은 싸움 중에도 등급 표식만 (난전에서 막대 더미가 줄어든다)
    var n = 0, k;
    if (show) {
      g.fillStyle = K; g.fillRect(x0 - 1, top - 1, w + 2, cmd ? 5 : 4);
      g.fillStyle = u.side === 'ally' ? (hp > 0.35 ? '#7fcf6a' : '#f0b64a') : '#e0525e'; g.fillRect(x0, top, Math.ceil(w * hp), 2);
      // r26: 깎인 만큼 흰 잔상이 남았다가 0.35초 뒤 따라 줄어든다 · 치명타를 맞으면 막대가 한 번 하얗게
      if (v.hpL == null || hp >= v.hpL) { v.hpL = hp; v.hpHit = t; } else if (t - v.hpHit > 0.35) v.hpL = Math.max(hp, v.hpL - (t - (v.hpLt || t)) * 0.9);
      v.hpLt = t;
      if (v.hpL > hp + 0.002) { g.fillStyle = '#ffffff'; g.fillRect(x0 + Math.ceil(w * hp), top, Math.max(0.5, Math.ceil(w * v.hpL) - Math.ceil(w * hp)), 2); }
      if (v.barFlash > 0) { v.barFlash -= 1 / 60; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x0, top, w, 2); }
      if (cmd) { g.fillStyle = '#f6cf57'; g.fillRect(x0, top + 2, Math.ceil(w * u.gauge / 100), 1); g.fillStyle = '#62b0ee'; if (u.mmp) g.fillRect(x0, top + 3, Math.ceil(w * u.mp / u.mmp), 1); }
      else if (u.aggro) { g.fillStyle = '#f6cf57'; g.fillRect(x0, top + 2, Math.ceil(w * u.gauge / 100), 1); }
      for (k in u.buffs) { g.fillStyle = u.buffs[k].p < 0 ? '#b181e6' : k === 'atk' ? '#ff6a7a' : k === 'def' ? '#62b0ee' : '#f6cf57'; g.fillRect(x0 + n * 3, top - 4, 2, 2); n++; }
      for (k in u.st) { g.fillStyle = k === 'poison' ? '#9ccc3c' : '#9fe8ec'; g.fillRect(x0 + n * 3, top - 4, 2, 2); n++; }
    }
    if (u.side === 'enemy' && (u.elite != null || u.eliteCrew != null)) eliteMark(g, u.elite != null ? (show ? x0 - 10 : px + 4) : (show ? x0 - 6 : px + 6), u.elite != null ? (show ? top - 3 : top - 4) : (show ? top - 2 : top - 1), u.elite != null, t + v.bob);
    if (u.role === 'merc' && u.grade) {
      // r8 gfx: 등급 표식은 머리 위가 아니라 자기 칸 안 왼쪽(어깨 높이) — 윗칸 유닛의 발도, 왼칸 유닛의 몸도 덮지 않고, 아랫칸 유닛의 체력 막대 띠(py+10~15)보다 위라 가려지지도 않는다
      if (big) bigMark(g, px - 1, py + 4, u.grade, DS.GRADES[u.grade].col, t + v.bob);
      else gradeMark(g, px + 1, py + MARK_Y, u.grade, DS.GRADES[u.grade].col, t + v.bob);
    }
    if (boss) bossMark(g, px + 4, top - 9 - (n > 2 ? 4 : 0), t, this.hot);
    if (u.side === 'ally' && !big) { if (!v.mdT || t - v.mdT > 1) { v.md = moodOf(u); v.mdT = t; if (cmd) { var wg = DS.unitDress ? DS.unitDress(u) : null, wgG = wg && wg.w && DS.gear ? DS.gear(wg.w) : null; v.leg = !!(wgG && wgG.grade >= 5); } } if (v.md) moodMark(g, x0 - 6, top - 1, v.md, t + v.bob); }      // r11: 비탄·노년 표식      // 버프·상태 점이 셋째부터 표식 자리에 닿는다 — 그때는 표식을 한 줄 올린다
  }
  g.globalAlpha = 1;
};
// 픽셀 선: 지도 좌표의 사각형으로 찍는다 (캔버스 선은 번져서 픽셀 그림과 결이 달랐다)
function pxLine(g, x0, y0, x1, y1, w) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); w = w || 1;
  if (x0 === x1) { g.fillRect(x0, Math.min(y0, y1), w, Math.abs(y1 - y0) + w); return; }
  if (y0 === y1) { g.fillRect(Math.min(x0, x1), y0, Math.abs(x1 - x0) + w, w); return; }
  var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy, n = 0, e2;
  while (n++ < 160) {
    g.fillRect(x0, y0, w, w);
    if (x0 === x1 && y0 === y1) break;
    e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}
function drawShape(g, p, f, time) {
  var cx = p.x * 16 + 8, cy = p.y * 16 + 8, i, j, q, a, r, w, x, y;
  switch (p.k) {
    case 'slash':      // 초승달 호: 머리가 먼저 돌고 꼬리가 따라 지워진다
      var R = p.big ? 10 : 8, N = p.big ? 16 : 12, head = Math.min(1, f * 2.4), tail = f > 0.4 ? (f - 0.4) / 0.6 : 0;
      x = cx - Math.cos(p.a) * 5; y = cy - 1 - Math.sin(p.a) * 5;
      for (j = 0; j <= N; j++) {
        q = j / N; if (q > head || q < tail) continue;
        a = p.a + p.s * (q * 2.6 - 1.3); w = q > 0.2 && q < 0.85 ? 2 : 1;
        g.fillStyle = q > head - 0.25 ? '#ffffff' : p.c;
        g.fillRect(Math.round(x + Math.cos(a) * R - w / 2), Math.round(y + Math.sin(a) * R * 0.85 - w / 2), w, w);
        if (p.big && w === 2) g.fillRect(Math.round(x + Math.cos(a) * (R - 3)), Math.round(y + Math.sin(a) * (R - 3) * 0.85), 1, 1);
      }
      break;
    case 'thrust':
      var ux = Math.cos(p.a), uy = Math.sin(p.a), h = Math.min(1, f * 3), tl = f > 0.35 ? (f - 0.35) / 0.65 : 0;
      g.fillStyle = p.c; pxLine(g, cx - ux * (11 - 14 * tl), cy - 2 - uy * (11 - 14 * tl), cx - ux * (11 - 15 * h), cy - 2 - uy * (11 - 15 * h), p.big ? 2 : 1);
      g.fillStyle = '#ffffff'; g.fillRect(Math.round(cx - ux * (11 - 15 * h)) - 1, Math.round(cy - 2 - uy * (11 - 15 * h)) - 1, 2, 2);
      break;
    case 'impact':
      r = Math.round(2 + f * (p.r || 5)); cy -= 1; g.globalAlpha = 1 - f * f; g.fillStyle = p.c;
      g.fillRect(cx - r, cy, r * 2 + 1, 1); g.fillRect(cx, cy - r, 1, r * 2 + 1);
      j = Math.round(r * 0.6); g.fillRect(cx - j, cy - j, 1, 1); g.fillRect(cx + j, cy - j, 1, 1); g.fillRect(cx - j, cy + j, 1, 1); g.fillRect(cx + j, cy + j, 1, 1);
      if (f < 0.4) { g.fillStyle = '#ffffff'; g.fillRect(cx - 1, cy - 1, 3, 3); }
      g.globalAlpha = 1;
      break;
    case 'bolt':
      g.globalAlpha = (f < 0.55 ? 1 : (1 - f) / 0.45) * (Math.floor(f * 9) % 3 === 1 ? 0.45 : 1);
      for (j = 0; j < 2; j++) {
        g.fillStyle = j ? '#ffffff' : '#ffe76a';
        for (i = 1; i < p.pts.length; i++) pxLine(g, p.pts[i - 1][0] - (j ? 0 : 1), p.pts[i - 1][1], p.pts[i][0] - (j ? 0 : 1), p.pts[i][1], j ? 1 : 3);
      }
      g.globalAlpha = 1;
      break;
    case 'pillar':
      w = Math.max(1, Math.round(7 * (1 - f))); g.globalAlpha = 0.7 * (1 - f * 0.5); g.fillStyle = '#fff6c8';
      g.fillRect(cx - w, cy - 72, w * 2, 78);
      g.fillStyle = '#ffffff'; g.globalAlpha = 1 - f * 0.4; r = Math.max(1, w - 3);
      g.fillRect(cx - r, cy - 72, r * 2, 78); g.fillRect(cx - w - 2, cy + 5, w * 2 + 4, 1);
      g.globalAlpha = 1;
      break;
    case 'meteor':
      x = cx + 34 * (1 - f); y = cy - 70 * (1 - f);
      for (j = 4; j >= 1; j--) { g.fillStyle = j > 2 ? '#d9442b' : '#ff9a3c'; w = 4 - (j >> 1); g.fillRect(Math.round(x + j * 4), Math.round(y - j * 8), w, w); }
      g.fillStyle = '#7a1f1f'; g.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6); g.fillStyle = '#ffd75e'; g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 3, 3);
      break;
    case 'flame':      // 불기둥: 세 갈래 불꽃이 넘실거리다 잦아든다
      for (j = 0; j < 3; j++) {
        var hh = Math.round((7 + 4 * Math.sin(time * 22 + j * 2.1 + p.x)) * (1 - f * f) * (j === 1 ? 1.3 : 1)), bx = cx - 5 + j * 4;
        for (i = 0; i < hh; i++) { w = Math.max(1, Math.round((j === 1 ? 4 : 3) * (1 - i / hh))); g.fillStyle = i < hh * 0.35 ? '#ffd75e' : i < hh * 0.7 ? '#ff9a3c' : '#d9442b'; g.fillRect(bx - (w >> 1) + 1, cy + 5 - i, w, 1); }
      }
      break;
    case 'loot':      // 전리품: 0~.22 튀어 오름 · ~.8 내려앉아 반짝임(빛기둥) · 끝에 떠오르며 사라짐
      var lx = cx + p.dx * Math.min(1, f / 0.22), up = f < 0.22 ? Math.sin(f / 0.22 * Math.PI) * 14 : f < 0.8 ? Math.abs(Math.sin(time * 4 + p.x)) * 1.5 : (f - 0.8) / 0.2 * 10, ly = cy + 3 - up, la = f < 0.8 ? 1 : 1 - (f - 0.8) / 0.2;
      if (p.gr >= 3 && f > 0.15) {      // 빛기둥
        var bh = p.bigL ? 80 : p.gr >= 4 ? 52 : 34, bw = p.bigL ? 3 : p.gr >= 4 ? 2 : 1, ba = Math.min(1, (f - 0.15) * 6) * la;
        for (i = 0; i < bh; i += 2) { g.globalAlpha = ba * (1 - i / bh) * (p.bigL ? 0.75 : 0.55); g.fillStyle = i < 6 ? '#ffffff' : p.c; g.fillRect(Math.round(lx) - bw, Math.round(cy + 6 - i), bw * 2, 2); }
        if (p.gr >= 4) for (j = 0; j < (p.bigL ? 6 : 3); j++) { q = (time * 0.9 + j / (p.bigL ? 6 : 3)) % 1; g.globalAlpha = ba * (1 - q); g.fillStyle = j % 2 ? '#ffffff' : p.c; g.fillRect(Math.round(lx + Math.sin(time * 5 + j * 2) * (4 + bw)), Math.round(cy + 4 - q * bh * 0.8), 1, 1); }
      }
      g.globalAlpha = la * 0.35; g.fillStyle = '#000000'; g.fillRect(Math.round(lx) - 4, Math.round(cy) + 6, 8, 1);
      g.globalAlpha = la;
      if (p.cv) g.drawImage(p.cv, Math.round(lx) - 7, Math.round(ly) - 11, 14, 14);
      else { g.fillStyle = '#1b1626'; g.fillRect(Math.round(lx) - 3, Math.round(ly) - 5, 6, 6); g.fillStyle = p.c; g.fillRect(Math.round(lx) - 2, Math.round(ly) - 4, 4, 4); }
      if (p.gr >= 3 && f > 0.22 && f < 0.8 && Math.sin(time * 7 + p.x) > 0.6) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(lx) + 4, Math.round(ly) - 10, 1, 1); g.fillRect(Math.round(lx) + 3, Math.round(ly) - 11, 3, 1); g.fillRect(Math.round(lx) + 4, Math.round(ly) - 12, 1, 3); }
      g.globalAlpha = 1;
      break;
    case 'sigil':      // 2.2.5 법사의 필살기: 도는 마법진 (점 고리 + 마주 도는 빛 여섯)
      r = (p.r || 18) * (0.55 + 0.45 * Math.min(1, f * 3)); g.globalAlpha = f < 0.7 ? 0.9 : (1 - f) / 0.3 * 0.9; g.fillStyle = p.c;
      for (j = 0; j < 28; j++) { a = j / 28 * 6.2832 + time * 2.6; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + 2 + Math.sin(a) * r * 0.55), 1, 1); }
      for (j = 0; j < 18; j++) { a = j / 18 * 6.2832 - time * 3.4; g.fillRect(Math.round(cx + Math.cos(a) * r * 0.66), Math.round(cy + 2 + Math.sin(a) * r * 0.66 * 0.55), 1, 1); }
      g.fillStyle = '#ffffff'; for (j = 0; j < 6; j++) { a = j / 6 * 6.2832 + time * 4; g.fillRect(Math.round(cx + Math.cos(a) * r * 0.83) - 1, Math.round(cy + 2 + Math.sin(a) * r * 0.83 * 0.55) - 1, 2, 2); }
      g.globalAlpha = 1;
      break;
    case 'soul':
      y = Math.round(cy - 6 - f * 16); x = cx + Math.round(Math.sin(f * 9) * 2); g.globalAlpha = (1 - f) * 0.9; g.fillStyle = p.c;
      g.fillRect(x - 1, y - 2, 3, 3); g.fillRect(x, y + 1, 1, 2); g.fillStyle = '#ffffff'; g.fillRect(x, y - 1, 1, 1);
      g.globalAlpha = 1;
      break;
  }
}
V.drawFx = function (g, dt) {
  var i, p, f;
  for (i = this.rings.length - 1; i >= 0; i--) {
    p = this.rings[i]; p.t += dt; f = p.t / p.dur;
    if (f >= 1) { this.rings.splice(i, 1); continue; }
    if (f < 0) continue;
    var r = p.inv ? p.r * (1 - f) + 2 : p.r * f + 2, cx = p.x * 16 + 8, cy = p.y * 16 + 8 - (p.rise ? f * 10 : 0), rn = p.r > 14 ? 28 : 16, rw = p.w || 1;      // 2.2.5: 큰 고리는 점이 촘촘하고 두껍게(w)
    g.globalAlpha = 1 - f; g.fillStyle = p.c;
    for (var a = 0; a < rn; a++) g.fillRect(Math.round(cx + Math.cos(a / rn * Math.PI * 2) * r - (rw - 1) / 2), Math.round(cy + Math.sin(a / rn * Math.PI * 2) * r * 0.6 - (rw - 1) / 2), rw, rw);
  }
  g.globalAlpha = 1;
  for (i = this.shapes.length - 1; i >= 0; i--) {
    p = this.shapes[i]; p.t += dt; f = p.t / p.dur;
    if (f >= 1) { this.shapes.splice(i, 1); if (p.end) p.end.call(this, p); continue; }
    if (f < 0) continue;      // 2.2.5: 늦게 시작하는 모양 (연타 · 잇단 충격)
    drawShape(g, p, f, this.time);
  }
  for (i = this.lines.length - 1; i >= 0; i--) {
    p = this.lines[i]; p.t += dt;
    if (p.t >= p.life) { this.lines.splice(i, 1); continue; }
    g.fillStyle = p.c; g.globalAlpha = 1 - p.t / p.life * 0.6;
    if (p.zig) {
      var zx = p.x0, zy = p.y0, nx, ny;
      for (var z = 1; z <= 5; z++) { nx = z === 5 ? p.x1 : p.x0 + (p.x1 - p.x0) * z / 5 + (z % 2 ? 4 : -4); ny = p.y0 + (p.y1 - p.y0) * z / 5; pxLine(g, zx, zy, nx, ny, p.w || 1); zx = nx; zy = ny; }
    } else pxLine(g, p.x0, p.y0, p.x1, p.y1, p.w || 1);
  }
  g.globalAlpha = 1;
  for (i = this.projs.length - 1; i >= 0; i--) {
    p = this.projs[i]; p.t += dt * (this.spdV || 1); var pf = p.t / p.dur;
    if (pf >= 1) { this.projs.splice(i, 1); continue; }
    var x = p.x0 + (p.x1 - p.x0) * pf, y = p.y0 + (p.y1 - p.y0) * pf;
    if (p.arrow) {      // 날아가는 화살: 살대와 흰 촉
      var ux = p.x1 - p.x0, uy = p.y1 - p.y0, ul = Math.sqrt(ux * ux + uy * uy) || 1;
      g.fillStyle = '#a8754a'; pxLine(g, x - ux / ul * 5, y - uy / ul * 5, x, y, 1);
      g.fillStyle = '#ffffff'; g.fillRect(Math.round(x), Math.round(y), 1, 1); g.fillStyle = '#f1ead9'; g.fillRect(Math.round(x - ux / ul * 5), Math.round(y - uy / ul * 5), 1, 1);
    } else { g.fillStyle = p.c; g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); g.fillStyle = '#fff'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); }
  }
  var pl = this.parts, pool = this.pfree || (this.pfree = []);
  for (i = pl.length - 1; i >= 0; i--) {
    p = pl[i]; p.t += dt;
    if (p.t >= p.life) { pl[i] = pl[pl.length - 1]; pl.pop(); if (pool.length < PMAX) pool.push(p); continue; }      // 2.2.5: 끝에 것을 이 자리로 (splice 없이) · 다 쓴 것은 모아 둔다
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    g.globalAlpha = Math.min(1, (1 - p.t / p.life) * 1.6); g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
  }
  g.globalAlpha = 1;
  // 피해 숫자 (지도 좌표, 픽셀 숫자) — 뜨는 순간 한 치수 크게 튀었다가 제 크기로
  for (i = this.floats.length - 1; i >= 0; i--) {
    p = this.floats[i];
    if (p.delay > 0) { p.delay -= dt; continue; }
    p.t += dt;
    if (p.t >= p.life) { this.floats.splice(i, 1); continue; }
    if (!p.num) continue;
    if (p.s) {      // r26 숫자 v2: 크게 튀었다가(0.1초) 제 크기로 · 빠르게 솟고 천천히 흐른다 · 옆으로 살짝 (vx) · 끝 30% 에서 흐려진다
      var a = p.t, L = p.life, base = p.s * 0.9, pk = (p.pk || p.s) * 0.9, q = a < 0.1 ? (1 - a / 0.1) : 0, sc = this.calmN ? base : base + (pk - base) * q * q;
      var rise = p.slow ? Math.min(1, a / 0.6) * 9 + a * 3 : (1 - Math.pow(1 - Math.min(1, a / 0.35), 3)) * 11 + Math.max(0, a - 0.35) * 5;
      var fx = p.x + (this.calmN ? 0 : p.vx * Math.min(a, 0.35));
      g.globalAlpha = a > L * 0.7 ? Math.max(0, (L - a) / (L * 0.3)) : 1;
      drawNum(g, p.text, Math.round(fx * 2) / 2, Math.round((p.y - 6 - rise) * 2) / 2 - (sc - base) * 2.5, sc, a < 0.05 && p.big ? '#ffffff' : p.col, p.out || '#1b1626', p.ow || 0);
      continue;
    }
    var fy = p.y - 6 - Math.min(1, p.t * 3) * 8 - p.t * 4, pop = p.t < 0.07 ? 1 : 0;
    g.globalAlpha = Math.min(1, (p.life - p.t) * 4);
    drawNum(g, p.text, Math.round(p.x), Math.round(fy) - pop * 2, p.big ? 2 : 1 + pop, pop && p.big ? '#ffffff' : p.col, '#1b1626', p.ow || 0);      // 보통 숫자는 커졌다 줄고, 치명타는 흰빛으로 번쩍
  }
  g.globalAlpha = 1;
};
// 캔버스 글씨도 Galmuri 한 가족: 10px 이하는 Galmuri9 10px, 그 위는 Galmuri11 굵게 12px (설계 크기 밖으로 키우지 않는다)
function cvSize(size) { return (size || 12) <= 10 ? 10 : 12; }
function cvFont(size) { return cvSize(size) === 10 ? '400 10px "TB Pixel 9", "TB Pixel 11", sans-serif' : '700 12px "TB Pixel 11", "TB Pixel 9", sans-serif'; }
DS.cvFont = cvFont;
function label(g, text, x, y, col, size, bg) {
  var dp = g.getTransform ? g.getTransform().a : 1; x = Math.round(x * dp) / dp; y = Math.round(y * dp) / dp;      // r4 hd: 글자를 장치 픽셀 격자에 맞춰 번지지 않게
  var fz = cvSize(size);
  g.font = cvFont(size); g.textAlign = 'center'; g.textBaseline = 'middle';
  if (bg) { var w = g.measureText(text).width + 10; g.fillStyle = bg; g.fillRect(Math.round(x - w / 2), Math.round(y - fz * 0.8), Math.round(w), Math.round(fz * 1.6)); }
  else { g.lineWidth = 2; g.strokeStyle = 'rgba(20,16,30,.9)'; g.lineJoin = 'miter'; g.miterLimit = 2; g.strokeText(text, x, y); }
  g.fillStyle = col; g.fillText(text, x, y);
}
// r26: 기술 이름 판 — 금테 두른 어두운 판이 1.4배에서 내려앉고, 끝 30% 에서 흐려진다
function callPlate(g, p, x, y, W, still) {
  var a = p.t, L = p.life, sc = still || a >= 0.12 ? 1 : 1 + (1 - a / 0.12) * 0.4;
  g.save(); g.font = cvFont(12); var tw = g.measureText(p.text).width, w = tw + 18, hgt = 20;
  x = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, x)); y -= Math.min(1, a / 0.2) * 4;
  g.globalAlpha = a > L * 0.7 ? Math.max(0, (L - a) / (L * 0.3)) : 1;
  g.translate(Math.round(x), Math.round(y)); if (sc !== 1) g.scale(sc, sc);
  g.fillStyle = 'rgba(14,10,7,.92)'; g.fillRect(-w / 2, -hgt / 2, w, hgt);
  g.fillStyle = '#dcb46a'; g.fillRect(-w / 2, -hgt / 2, w, 1); g.fillRect(-w / 2, hgt / 2 - 1, w, 1);
  g.fillStyle = '#6f5124'; g.fillRect(-w / 2, -hgt / 2 + 1, 1, hgt - 2); g.fillRect(w / 2 - 1, -hgt / 2 + 1, 1, hgt - 2);
  g.fillStyle = '#f6c65a'; g.fillRect(-w / 2 - 2, -1.5, 3, 3); g.fillRect(w / 2 - 1, -1.5, 3, 3);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(p.text, 0, 1.5); g.fillStyle = p.col || '#fff3c4'; g.fillText(p.text, 0, 0.5);
  g.restore();
}
V.drawText = function (g, dt) {
  var i, p, k = this.k, s, self = this, boxes = [], sv = this.vu[this.sel], ss = sv ? this.screenOf(sv.x, sv.y) : null;
  for (i = 0; i < this.pois.length; i++) {
    p = this.pois[i];
    if (!p.label) continue;
    s = this.screenOf(p.lx != null ? p.lx : p.x, p.ly != null ? p.ly : p.y);
    if (s.x < -20 || s.y < -30 || s.x > this.W + 20 || s.y > this.H + 30) continue;
    g.font = cvFont(11);
    var lw = g.measureText(p.label).width / 2 + 8;
    var lx = Math.max(lw, Math.min(this.W - lw, s.x));
    // 고른 지휘관이 표지 밑에 서 있으면 표지를 흐리게 — 부대가 가려지지 않게. 이름표는 표지를 피해 올라간다.
    if (ss && Math.abs(ss.x - lx) < lw + 6 * k && Math.abs(ss.y - s.y) < 9 * k) g.globalAlpha = 0.4;
    label(g, p.label, lx, s.y, p.state === 'lock' ? '#a7a1c2' : p.state === 'next' ? '#f6cf57' : '#efe6d0', 11, 'rgba(20,16,30,.78)');
    g.globalAlpha = 1; boxes.push(lx, s.y, lw * 2 - 6);
    if (p.sub) label(g, p.sub, s.x, s.y + 15, p.state === 'next' ? '#fff3c4' : '#a7a1c2', 10);
  }
  for (i = 0; i < this.floats.length; i++) {
    p = this.floats[i]; if (p.num || p.delay > 0) continue;
    if (p.call) { callPlate(g, p, (p.x - this.cam.x) * k, (p.y - this.cam.y) * k - 30 * Math.min(1.4, k / 2.4), this.W, calmFx() || this.lowFx); continue; }      // r26: 기술 외침 판
    var x = (p.x - this.cam.x) * k, y = (p.y - this.cam.y) * k - 16 - Math.min(1, p.t * 3) * 12 - p.t * 6;      // r8: 기술명·외침은 체력 막대보다 한 줄 위에서 뜬다
    g.globalAlpha = Math.min(1, (p.life - p.t) * 4);
    var fs = p.small ? 10 : p.big ? 13 : 12;
    g.font = cvFont(fs);
    var hw = g.measureText(p.text).width / 2 + 4;
    label(g, p.text, Math.max(hw, Math.min(this.W - hw, x)), y, p.col, fs);
  }
  g.globalAlpha = 1;
  // 지휘관 이름표
  // 클래스명은 길어서 붙어 선 지휘관끼리 겹친다 — 고른 지휘관이 먼저 자리를 잡고, 나머지는 겹치면 한 줄 위로 올린다
  var tags = [], ti, tj, tg;
  g.font = cvFont(10);
  for (var id in this.vu) {
    var vv = this.vu[id], uu = vv.u;
    if (uu.side !== 'ally' || uu.role !== 'cmd' || vv.dying >= 0) continue;
    // r8 gfx: 싸우는 중에는 고른 지휘관만 이름표 — 나머지는 깃발색이 병과를 말한다. 보스 곁(옆·아래 두 칸)에서는 고른 지휘관도 발밑으로 내린다
    var fightN = !!(this.sim && this.sim.combat), nearB = byBoss(this, vv, 2.6);
    if ((fightN || nearB) && uu.id !== this.sel) continue;
    var ns = this.screenOf(vv.x, vv.y);
    if (ns.x < -20 || ns.y < this.inset.top - 10 || ns.x > this.W + 20 || ns.y > this.H - this.inset.bottom + 20) continue;
    var tx = uu.name + (uu.enh ? ' +' + uu.enh : '');
    tags.push({ t: tx, x: ns.x, y: nearB ? ns.y + 8 * k + 7 : ns.y - 16 * k * 0.5 - 20, low: nearB, w: g.measureText(tx).width, sel: uu.id === this.sel, col: uu.enh ? DS.enhColor(uu.enh) : (uu.id === this.sel ? '#f6cf57' : '#efe6d0') });
  }
  tags.sort(function (a, b) { return (b.sel ? 1 : 0) - (a.sel ? 1 : 0) || b.y - a.y; });
  for (ti = 0; ti < tags.length; ti++) {
    tg = tags[ti]; if (tg.low) continue;
    for (var lift = 0; lift < 4; lift++) {
      for (tj = 0; tj < ti; tj++) if (Math.abs(tags[tj].x - tg.x) < (tags[tj].w + tg.w) / 2 + 8 && Math.abs(tags[tj].y - tg.y) < 11) break;      // r8: 옆 이름표와 8px 은 떨어져야 한 낱말로 붙어 읽히지 않는다
      for (var bj = 0; tj === ti && bj < boxes.length; bj += 3) if (Math.abs(boxes[bj] - tg.x) < (boxes[bj + 2] + tg.w) / 2 + 2 && Math.abs(boxes[bj + 1] - tg.y) < 15) tj = -1;      // 출구·가게 표지와도 겹치지 않게
      if (tj === ti) break;
      tg.y -= 12;
    }
  }
  for (ti = tags.length - 1; ti >= 0; ti--) label(g, tags[ti].t, tags[ti].x, tags[ti].y, tags[ti].col, 10);
  // 정예 우두머리 이름 (「외눈 가고일」): 머리 위에 주황 글자 — 필드에서 누가 현상금 대상인지 보이게
  g.font = cvFont(10);
  for (var eid in this.vu) {
    var evv = this.vu[eid], eu = evv.u;
    if (eu.elite == null || eu.side !== 'enemy' || evv.dying >= 0 || !eu.name) continue;
    var es = this.screenOf(evv.x, evv.y);
    if (es.x < -20 || es.y < this.inset.top + 10 || es.x > this.W + 20 || es.y > this.H - this.inset.bottom) continue;
    label(g, eu.name, es.x, es.y - (eu.big ? 30 : 22) * k - 6, '#ffb070', 10);
  }
  // 용병 이름표: 고른 지휘관의 용병에게만(설정 G.view.mtag: 'sel' 기본 · 'all' · 'off'), 작게, 발밑에 등급색으로 — 지휘관 이름표(머리 위)와 자리가 갈린다
  var mt = this.mtag || 'sel';
  if (mt !== 'off' && (this.sel || mt === 'all')) {
    g.font = cvFont(9);
    var mtags = [], tg2 = 0;
    for (var mid in this.vu) {
      var mv = this.vu[mid], mu = mv.u;
      var mname = mu.mn || mu.name;
      if (mu.side !== 'ally' || mu.role !== 'merc' || mv.dying >= 0 || !mname || (mt === 'sel' && mu.owner !== this.sel)) continue;
      var ms = this.screenOf(mv.x, mv.y);
      if (ms.x < -20 || ms.y < this.inset.top || ms.x > this.W + 20 || ms.y > this.H - this.inset.bottom - 6) continue;
      mtags.push({ t: mname, x: ms.x, y: ms.y + 8 * k + (mu.big ? 7 : 5), w: g.measureText(mname).width, col: mu.grade ? DS.GRADES[mu.grade].col : '#cdd5e3' });
    }
    for (ti = 0; ti < mtags.length; ti++) {      // 둘이 붙어 서면 나중 것을 한 줄 아래로
      for (tj = 0, tg2 = 0; tj < ti && tg2 < 40; tj++) if (Math.abs(mtags[tj].x - mtags[ti].x) < (mtags[tj].w + mtags[ti].w) / 2 + 2 && Math.abs(mtags[tj].y - mtags[ti].y) < 9.5) { mtags[ti].y = mtags[tj].y + 10; tj = -1; tg2++; }      // 2.2.5: (y + 10) − y 가 부동소수로 10 에 못 미치면 같은 자리를 끝없이 되풀이해 화면이 멈췄다 — 9.5 로 견주고 40번에서 멈춘다
    }
    g.globalAlpha = this.sim && this.sim.combat ? 0.8 : 0.95;
    for (ti = 0; ti < mtags.length; ti++) label(g, mtags[ti].t, mtags[ti].x, mtags[ti].y, mtags[ti].col, 9);
    g.globalAlpha = 1;
  }
  // 목표 방향 화살표
  if (this.guide) {
    s = this.screenOf(this.guide.x, this.guide.y);
    var top = this.inset.top + 14, bot = this.H - this.inset.bottom - 14, bob = Math.sin(this.time * 6) * 3;
    g.fillStyle = '#f6cf57'; g.strokeStyle = '#1b1626'; g.lineWidth = 2;
    if (s.x > 14 && s.x < this.W - 14 && s.y > top && s.y < bot) {
      g.beginPath(); g.moveTo(s.x, s.y - 20 + bob); g.lineTo(s.x - 7, s.y - 32 + bob); g.lineTo(s.x + 7, s.y - 32 + bob); g.closePath(); g.stroke(); g.fill();
    } else {
      var cx = this.W / 2, cy = (top + bot) / 2, ang = Math.atan2(s.y - cy, s.x - cx);
      var ex = Math.max(18, Math.min(this.W - 18, s.x)), ey = Math.max(top + 4, Math.min(bot - 4, s.y));
      g.save(); g.translate(ex, ey); g.rotate(ang);
      g.beginPath(); g.moveTo(10 + bob, 0); g.lineTo(-4 + bob, -8); g.lineTo(-4 + bob, 8); g.closePath(); g.stroke(); g.fill(); g.restore();
    }
  }
};
// ── r17 boss: 「이름 지우기」 (30번 어스름의 왕) ── 실제 시간으로 그린다 (배속과 무관)
//   erOn(o): 예고가 걸렸다 — o.ids(대상 유닛) · o.names · o.dur(실제 초) · o.king. 화면이 어두워지고, 대상 머리 위 이름이 점점 바랜다 (글자가 하나씩 회색으로 빠진다).
//   erSaved(id): 표식이 걷혔다 — 이름이 금빛으로 돌아온다 · erOff(): 예고가 끝났다 · erSuck(id, name): 지워진 이의 이름 글자가 왕 쪽으로 빨려 든다.
//   죽음 연출이 꺼져 있으면(설정) 어둠·빨려 듦은 옅게만, 표식은 그대로 (규칙에 필요한 정보라서).
V.erOn = function (o) { this.er = { ids: o.ids.slice(), names: o.names || {}, dur: o.dur || 3, t: 0, king: o.king, saved: {}, on: true }; this.erDim = this.erDim || 0; this.shake = Math.max(this.shake, 0.35); };
V.erSaved = function (id) { if (this.er) this.er.saved[id] = this.er.t; var v = this.vu[id]; if (v) { this.rings.push({ x: v.x, y: v.y + 0.35, t: 0, dur: 0.6, c: '#f6cf57', r: 16 }); this.burst(v.x, v.y - 0.3, ['#f6cf57', '#fff6d0'], 12, { up: 30, grav: -10, spd: 12, life: 0.8 }); } };
V.erOff = function () { if (this.er) this.er.on = false; };
V.erSuck = function (id, name) {
  var v = this.vu[id], K = this.er && this.vu[this.er.king]; if (!v) return;
  (this.erFx || (this.erFx = [])).push({ x0: v.x, y0: v.y, kx: K ? K.x : v.x, ky: K ? K.y - 1 : v.y - 3, t: -0.6, dur: 1.6, name: String(name || '') });
};
V.drawErase = function (g, dt) {
  var E = this.er, fx = this.erFx, on = E && E.on, calmFx = !DS.deathFxOn || !DS.deathFxOn(), i, k;
  this.erDim = Math.max(0, Math.min(1, (this.erDim || 0) + (on ? dt * 2.5 : -dt * 0.8)));
  if (this.erDim > 0.01) {
    var a = this.erDim * (calmFx ? 0.18 : 0.42);
    g.fillStyle = 'rgba(8,6,18,' + a.toFixed(3) + ')'; g.fillRect(0, 0, this.W, this.H);
    if (!calmFx) { var gr = g.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.25, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.7); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,10,30,' + (this.erDim * 0.55).toFixed(3) + ')'); g.fillStyle = gr; g.fillRect(0, 0, this.W, this.H); }
  }
  if (E) {
    E.t += dt;
    if (!on && E.t > E.dur + 1.2) { this.er = null; E = null; }
  }
  if (E) for (i = 0; i < E.ids.length; i++) {
    var id = E.ids[i], v = this.vu[id]; if (!v || v.ds || v.dying >= 0) continue;
    var sc = this.screenOf(v.x, v.y), nm = String(E.names[id] || v.u.mn || v.u.name || ''), sv = E.saved[id];
    var f = Math.max(0, Math.min(1, E.t / E.dur)), y = sc.y - 30 * this.k / 2 - 12;
    if (sv != null) {      // 걷혔다: 금빛으로 돌아와 잠깐 떠 있다가 사라진다
      var q = E.t - sv; if (q > 1.4) continue;
      g.globalAlpha = Math.max(0, 1 - q / 1.4); g.font = cvFont(12); label(g, nm, sc.x, y - q * 8, '#f6cf57', 12, 'rgba(20,16,30,.7)'); g.globalAlpha = 1; continue;
    }
    if (!on) continue;
    // 고리: 발밑에서 맥박치며 좁아진다
    var r = (10 + 6 * (1 - f)) * this.k / 2 + Math.sin(E.t * 9) * 1.5;
    g.strokeStyle = 'rgba(167,161,194,' + (0.5 + 0.4 * Math.sin(E.t * 9)).toFixed(3) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(sc.x, sc.y + 5 * this.k / 2, r, r * 0.4, 0, 0, Math.PI * 2); g.stroke();
    // 이름: 글자가 앞에서부터 하나씩 바래 간다
    g.font = cvFont(12); var w = g.measureText(nm).width, x0 = sc.x - w / 2, n = nm.length, gone = f * n;
    g.fillStyle = 'rgba(20,16,30,.72)'; g.fillRect(x0 - 5, y - 9, w + 10, 17);
    g.textBaseline = 'middle'; g.textAlign = 'left';
    var cx = x0;
    for (k = 0; k < n; k++) {
      var ch = nm[k], cw = g.measureText(ch).width, fade = Math.max(0, Math.min(1, gone - k));
      g.globalAlpha = 1 - fade * 0.8; g.fillStyle = fade > 0.5 ? '#6f6a80' : '#efe6d0';
      g.fillText(ch, cx, y + (fade > 0 ? Math.sin(E.t * 14 + k) * fade : 0)); cx += cw;
    }
    g.globalAlpha = 1; g.textAlign = 'center';
    // 남은 시간: 이름 밑 가는 줄
    g.fillStyle = '#3a2d55'; g.fillRect(x0 - 5, y + 9, w + 10, 2); g.fillStyle = '#c7c2dc'; g.fillRect(x0 - 5, y + 9, (w + 10) * (1 - f), 2);
  }
  if (fx && fx.length) for (i = fx.length - 1; i >= 0; i--) {      // 빨려 드는 이름
    var p = fx[i]; p.t += dt; if (p.t < 0) continue; if (p.t > p.dur) { fx.splice(i, 1); continue; }
    var e = p.t / p.dur, ee = e * e, s0 = this.screenOf(p.x0, p.y0 - 1.2), s1 = this.screenOf(p.kx, p.ky);
    g.font = cvFont(12);
    for (k = 0; k < p.name.length; k++) {
      var lag = Math.max(0, Math.min(1, ee * 1.25 - k * 0.06)), px = s0.x + (s1.x - s0.x) * lag + Math.sin(lag * 6 + k) * 10 * (1 - lag), py = s0.y + (s1.y - s0.y) * lag - Math.sin(lag * Math.PI) * 24;
      g.globalAlpha = (1 - lag) * (calmFx ? 0.6 : 1); g.fillStyle = lag > 0.3 ? '#8d8a99' : '#efe6d0'; g.fillText(p.name[k], px + (k - p.name.length / 2) * 9 * (1 - lag), py);
    }
    g.globalAlpha = 1;
  }
};

})();

// ───────── 아이콘 (2.8) — 소모품·용병 물건·장비의 작은 픽셀 그림 ─────────
// 12×12 문자 격자(형판) + 색 묶음 → 바깥 테두리를 저절로 둘러 14×14 캔버스. 처음 쓸 때 한 번 그려 dataURL 을 CSS 규칙으로 꽂고 캐시한다.
// 형판의 1·2·3 은 그 아이콘의 주색·어두운 색·밝은 색, 나머지 글자는 DS.PAL (k 검정 w 흰색 o/O 나무 g/G 금 m/M 쇠 l/L 양피지 r/R 빨강 y 연노랑 t 주황 h/H 갈색 e 초록 u 파랑 p 보라 c 하늘).
(function () {
'use strict';
var T = {
  leaf: ['.........11.', '.......1131.', '.....113311.', '....1133112.', '...11331122.', '...1331122..', '..13311222..', '..1311222...', '..3112222...', '.o.22222....', '.o..........', 'o...........'],
  bomb: ['........y...', '.......g.y..', '......o.....', '.....oo.....', '....mMMm....', '..2111112...', '.211311112..', '.213111112..', '.211111112..', '.211111122..', '..2111122...', '...22222....'],
  pouch: ['....2..2....', '.....22.....', '....2112....', '....h22h....', '...211112...', '..21311112..', '.2131111112.', '.2311111112.', '.2111111122.', '.2111111122.', '..21111222..', '...222222...'],
  jar: ['....oooo....', '...oOOOOo...', '....2222....', '...211112...', '..21333112..', '.2133111112.', '.2131111112.', '.2111111112.', '.2111111122.', '..21111122..', '...222222...', '............'],
  flask: ['.....oo.....', '.....OO.....', '....wmmw....', '.....11.....', '.....11.....', '....1331....', '...133111...', '..13311111..', '..13111111..', '..11111112..', '...111122...', '....2222....'],
  horn: ['............', '............', '........3311', '.2.....33112', '.12...331122', '.112.3311g2.', '..11131g122.', '..2111g1122.', '...2211122..', '.....2222...', '............', '............'],
  feather: ['..........3.', '........3311', '.......33w12', '......33w112', '.....33w1122', '....33w1122.', '...33w1122..', '...3w1122...', '..3w1122....', '..w2222.....', '.w..........', 'w...........'],
  talisman: ['....o..o....', '.....oo.....', '...llllll...', '...l1111l...', '...l1ll1l...', '...l1111l...', '...ll11ll...', '...l1111l...', '...ll11ll...', '...llllll...', '...LlLlLL...', '....L..L....'],
  scroll: ['............', '.OoLLLLLLoO.', '.OolllllloO.', '..llllllll..', '..lLLLlLLl..', '..llllllll..', '..lLLlLL11..', '..llllll11..', '..lLLLl.1...', '.OolllllloO.', '.OoLLLLLLoO.', '............'],
  bell: ['.....22.....', '....2..2....', '.....11.....', '....1331....', '...133111...', '...131111...', '...131112...', '..13111112..', '..11111112..', '.2222222222.', '.....22.....', '.....kk.....'],
  campfire: ['.....y......', '....yt......', '....tty.....', '...ttyrt....', '...tyyttt...', '..ttyyytr...', '..rtyyyttr..', '...rttttr...', '.oO.rrrr.Oo.', '..oOo..oOo..', '...oOooOo...', '..oO....Oo..'],
  drum: ['.o........o.', '..o......o..', '...o.ll.o...', '..llllllll..', '.lLLLLLLLLl.', '.1l11l11l11.', '.11l11l11l1.', '.1l11l11l11.', '.11l11l11l1.', '.2222222222.', '..22222222..', '............'],
  whet: ['............', '............', '.......2222.', '.....221132.', '...22113312.', '.2211333112.', '.2113311122.', '.211111222..', '.2211222....', '..222.......', '............', '............'],
  shield: ['....2222....', '..22111122..', '.2113311112.', '.2131111112.', '213111gg1112', '211111gg1112', '211111111122', '.2111111122.', '.2111111122.', '..22111122..', '....2222....', '............'],
  sack: ['.....h......', '....hHh.....', '.....2......', '....2112....', '...211112...', '..21311112..', '.2131111112.', '.2311111112.', '.2111111122.', '.2111111122.', '.2211112222.', '..22222222..'],
  coinbag: ['.....h......', '....hHh.....', '.....2......', '....2112....', '...211112...', '..21311112..', '.2131111112.', '.2311gg1112.', '.211gyyg122.', '.2111gg1122.', '.22gg112222.', '.gyyg22222..'],
  boot: ['..222222....', '..213112....', '..gggggg....', '..211112....', '..211112....', '..211112....', '..2111122...', '..21111122..', '..211111122.', '..2111111122', '..hhhhhhhhhh', '............'],
  ticket: ['............', '............', '.1111111111.', '.1333333331.', '.13ww3w3331.', '..13333331..', '..133ww331..', '.1333333331.', '.1222222221.', '.1111111111.', '............', '............'],
  banner: ['.gg.........', '.oo1111111..', '.o13311111..', '.o1311111...', '.o111ww11...', '.o11wwww1...', '.o111ww11...', '.o1111111...', '.o11.111....', '.o1...11....', '.o..........', '.OO.........'],
  sword: ['.........33w', '........3312', '.......3312.', '......3312..', '.....3312...', '....3312....', '.g.3312.....', '..g312......', '...gg.......', '..o..g......', '.o..........', 'g...........'],
  spear: ['..........w3', '.........331', '........3312', '.......3122.', '......o22...', '.....o......', '....o.......', '...o........', '..o.........', '.o..........', 'o...........', '............'],
  bow: ['....122.....', '...1..y2....', '..1....y2...', '..1.....y2..', '.1......y2..', '.1.......y2.', '.1.......y2.', '.1......y2..', '..1.....y2..', '..1....y2...', '...1..y2....', '....122.....'],
  mace: ['........2m2.', '.......2mmm2', '........2m2.', '.......o.2..', '......o.....', '.....o......', '....o.......', '...o........', '..o.........', '.o..........', 'g...........', '............'],
  staff: ['.......c3...', '......c33c..', '......3113..', '.......33...', '.......o....', '......o.....', '.....o......', '....o.......', '...o........', '..o.........', '.o..........', 'o...........'],
  plate: ['............', '.333....333.', '.3113333113.', '.2111331112.', '..21133112..', '..21111112..', '..21g11g12..', '..21111112..', '..22111122..', '..21111112..', '..22222222..', '............'],
  vest: ['............', '..hh....hh..', '.h11h..h11h.', '.h111hh111h.', '..h111111h..', '..h1o11o1h..', '..h111111h..', '..hoooooooh.', '..h111111h..', '..h111111h..', '..hhhhhhhh..', '............'],
  robe: ['....3333....', '...3....3...', '...111111...', '..11111111..', '..111gg111..', '..11111111..', '..1111111...', '.11111111...', '.111111111..', '.1111111111.', '.2222222222.', '............'],
  rope: ['....2222....', '..22311122..', '.2311..1132.', '.231....132.', '.21......12.', '.21......12.', '.231....122.', '..2311.122..', '...22312....', '.....312....', '.....3122...', '......22....'],
  cloak: ['....2222....', '...211112...', '..21kkkk12..', '..21kkkk12..', '..211gg112..', '.2111111112.', '.2131111112.', '.2131111112.', '213111111112', '213111111112', '211111111112', '22.22.22.22.'],
  spur: ['............', '............', '............', '............', '.ggggggg....', 'g.......g.y.', 'g........yGy', 'g.......g.y.', '.ggggggg....', '............', '............', '............'],
  heart: ['............', '..222..222..', '.21132213312', '.213112111 2', '.211111111.2', '.21111111112', '..211111112.', '...2111112..', '....21112...', '.....212....', '......2.....', '............'],
  lantern: ['.....kk.....', '....k..k....', '....gggg....', '...gyyyyg...', '...gyttyg...', '...gytrtg...', '...gyttyg...', '...gyyyyg...', '...gyyyyg...', '....gggg....', '.....GG.....', '............'],
  drop: ['.....1......', '.....1......', '....131.....', '....131.....', '...13311....', '...131111...', '..1311111...', '..1311111...', '..1111112...', '...11122....', '....222.....', '............'],
  flame: ['.....y......', '.....y.....y', '....yty...t.', '....ttyy..t.', '...tttyyt.t.', '..ttrtyyytt.', '..trrttyytt.', '..trrrttyyt.', '..rrrrttttr.', '...rrrrrrr..', '....RRRRR...', '............'],
  wedge: ['............', '.33.........', '.3113.......', '.21113......', '.2111113....', '.211111113..', '.2111111111.', '.2211111122.', '..22222222..', '............', '............', '............'],
  door: ['...222222...', '..21111112..', '.2111111112.', '.2o11o11o12.', '.2o11o11o12.', '.2111111112.', '.2o11o11og2.', '.2o11o11o12.', '.2111111112.', '.2o11o11o12.', '.2222222222.', '............'],
  bowl: ['............', '............', '...ww..ww...', '....w..w....', '.3333333333.', '.1yyyyyyyy1.', '.1111111111.', '..11111111..', '..21111112..', '...222222...', '....2222....', '............'],
  hourglass: ['.oooooooooo.', '..o......o..', '..ly....yl..', '..lyyyyyyl..', '...lyyyyl...', '....lyyl....', '....lyyl....', '...l.yy.l...', '..l..yy..l..', '..lyyyyyyl..', '..o......o..', '.oooooooooo.'],
  fang: ['...w........', '...ww.......', '...lww......', '...llww.....', '...lllww....', '....llll....', '....Llll....', '.....Lll....', '.....LLl....', '......LL....', '......L.....', '............'],
  cog: ['.....22.....', '..2.2112.2..', '.2122112212.', '..21111112..', '.2113333112.', '2211322311 2', '2211322311.2', '.2113333112.', '..21111112..', '.2122112212.', '..2.2112.2..', '.....22.....'],
  ring: ['............', '.....cc.....', '....cwwc....', '....2cc2....', '...211112...', '..21....12..', '..1......1..', '..1......1..', '..21....12..', '...211112...', '....2222....', '............'],
  stinger: ['..........1.', '.........11.', '.........1..', '..2222..11..', '.211112.1...', '.2111112....', '..2111112...', '...22111.2..', '......2112..', '.......w2...', '........w...', '............'],
  coil: ['....2222....', '..22111122..', '.21133331112', '.2132222132.', '.212....212.', '.2132222132.', '..21333312..', '...222211...', '.......212..', '......2112..', '......w22...', '............'],
  glove: ['....1.1.1...', '...1111111..', '...11311111.', '...13111111.', '...1111111..', '..11111111..', '..1111111...', '..1111111...', '...11111....', '...22222....', '...2gg22....', '...22222....'],
  tag: ['..m.........', '...m........', '....m.......', '.....m......', '...222222...', '..21133112..', '..213k3112..', '..21111112..', '..21222112..', '..21111112..', '..21122212..', '...222222...'],
  knot: ['............', '.222....222.', '.2312..2132.', '.2113223112.', '.2111331112.', '.2222332222.', '....2112....', '...21..12...', '..21....12..', '..21....12..', '.21......12.', '.22......22.'],
  compass: ['....2222....', '..22333322..', '.2333r33332.', '.233rrr3332.', '2333rrr33332', '23333k333332', '2333MMM33332', '.233MMM3332.', '.23333M3332.', '.2333333332.', '..22333322..', '....2222....'],
  shard: ['......3.....', '.....331....', '.....3311...', '....33111...', '....31111...', '...331112...', '...311112...', '..3111122...', '..311122....', '..21122.....', '...222......', '............'],
  hat: ['.....11.....', '.....121....', '....1112....', '....11112...', '...1y11112..', '...1111112..', '..11111112..', '..1yy11112..', '.1111111112.', '222222222222', '.2222222222.', '............'],
  crown: ['............', '.g...g...g..', '.gg.ggg.gg..', '.gyggrggyg..', '.gggggggggg.', '.gyggyggyg..', '.ggggggggg..', '.GGGGGGGGG..', '............', '............', '............', '............'],
  box: ['............', '..22222222..', '.2333333332.', '.2111111112.', '.2222222222.', '.21111r1112.', '.2111rrr112.', '.21111r1112.', '.2111111112.', '.2111111112.', '.2222222222.', '............'],
  hand: ['....1.1.....', '...111111...', '...1111111..', '...11111111.', '1..11111111.', '11.1111111..', '.1111111111.', '..111111111.', '...1111111..', '....11111...', '.....111....', '............'],
  shade: ['....1111....', '...111111...', '..11w11w11..', '..11111111..', '..11111111..', '..1111111...', '...111111...', '...11111....', '....1111....', '...11.11....', '..11..11....', '..1...1.....'],
  saddle: ['............', '..2.......2.', '..21.....12.', '..2111111 2.', '..21111112..', '..21333112..', '.2113333112.', '.2111111112.', '..2g2222g2..', '...g....g...', '...gg...gg..', '............'],
  tassel: ['.....oo.....', '....o..o....', '.....oo.....', '....1331....', '....1111....', '...gggggg...', '...131111...', '...131111...', '..13111111..', '..11111111..', '..1.11.1.1..', '..1.1..1.1..'],
  // r8 gfx: 가문 화면용 — 관·혼인 고리·요람·가문 문장(깃대 방패)·지팡이(노년)
  coffin: ['....2222....', '...213312...', '..21311112..', '.2131gg1112.', '.211gggg112.', '.2111gg1112.', '..211gg112..', '..211gg112..', '..21111112..', '...211112...', '...211122...', '....2222....'],
  rings: ['............', '...c........', '..111.......', '.1...1.333..', '1.....1...3.', '1....31....3', '1....31....3', '.1...3.....3', '..111.3...3.', '.......333..', '............', '............'],
  cradle: ['............', '.2222.......', '213312......', '2311.2......', '231.........', '231..www....', '21lwwwwwll12', '211111111112', '.2111111112.', '..22222222..', '.22......22.', '..22222222..'],
  fcrest: ['.2222222222.', '.2133333312.', '.21g1111112.', '.21gwww1112.', '.21gwwww112.', '.21gwww1112.', '.21g1111112.', '..2g111112..', '..21g11112..', '...211112...', '....2112....', '.....22.....'],
  cane: ['....2222....', '...21..12...', '...1....1...', '........1...', '.......12...', '......12....', '.....12.....', '....12......', '...12.......', '..12........', '.12.........', '.2..........'],
  gem: ['............', '...333333...', '..33111113..', '.3311111112.', '.2111111112.', '..21111112..', '...211112...', '....2112....', '.....22.....', '............', '............', '............']
};
// 색 묶음: [주색, 어두운 색, 밝은 색]
var C = {
  green: ['#79c267', '#3f8f4c', '#c8f0a0'], blue: ['#62b0ee', '#3572b8', '#d6ecff'], gold: ['#f6cf57', '#c08f2c', '#fff3c4'], ember: ['#f09a4a', '#b8642a', '#ffd9a8'],
  red: ['#e0525e', '#9c2f45', '#ffb0b8'], purple: ['#b181e6', '#7446ad', '#e6d4ff'], teal: ['#4cc0b0', '#2a7f78', '#c8f6ee'], ice: ['#9fe8ec', '#4f9fc0', '#ffffff'],
  steel: ['#cdd5e3', '#8f9ab3', '#ffffff'], iron: ['#8f9ab3', '#5b6480', '#cdd5e3'], stone: ['#a9a394', '#6f6a5c', '#d8d2c2'], bone: ['#efe6d0', '#b9ae96', '#ffffff'],
  wood: ['#a8754a', '#6f4a2c', '#d6a878'], leather: ['#8a5a36', '#5e3a22', '#b98a5e'], grey: ['#7d7a8a', '#4c4858', '#b8b4c4'], dark: ['#4c4060', '#2b2440', '#8a7aa8'],
  bomb: ['#57524a', '#36322d', '#8a857a'], poison: ['#9ccc3c', '#5a8a2a', '#dcf6a0'], violet: ['#8d6be0', '#5a3ea8', '#cdbaf6'], rot: ['#8a9a4a', '#566434', '#c8d48a'],
  paper: ['#e9e2d0', '#b9ae96', '#fffaf0'], white: ['#f4efe2', '#b9ae96', '#ffffff'], shadow: ['#3a3350', '#1b1626', '#6a5f88']
};
function P(t, c, ex) { return [t, c, ex || null]; }      // ex: 그 아이콘만 바꿀 글자 색 { g: '#…' }
var ICON = {
  item: {
    herb: P('leaf', 'green'), mana: P('leaf', 'blue'), endo: P('leaf', 'gold', { o: '#c08f2c' }), bomb: P('bomb', 'bomb'),
    smoke: P('pouch', 'grey', { h: '#cdd5e3' }), salve: P('jar', 'teal'), horn: P('horn', 'bone'), feather: P('feather', 'ice'), ward: P('talisman', 'blue'),
    recall: P('scroll', 'blue'), venom: P('jar', 'poison', { o: '#7446ad', O: '#4c2c7a' }), bell: P('bell', 'bone'), holyw: P('flask', 'white', { 1: '#fff3c4', 3: '#ffffff', 2: '#c8b070' }),
    camp: P('campfire', 'ember'), drum: P('drum', 'red'), frostj: P('jar', 'ice', { o: '#cdd5e3', O: '#8f9ab3' }), sc_bolt: P('scroll', 'gold'), sc_star: P('scroll', 'purple'),
    mg_whet: P('whet', 'stone'), mg_buckler: P('shield', 'wood'), mg_ration: P('sack', 'leather'), mg_boots: P('boot', 'leather'), mg_charm: P('talisman', 'red'), mg_plume: P('feather', 'red'),
    prot: P('talisman', 'gold')      // 2.1.0 강화 보호 부적
  },
  gear: { sword: P('sword', 'steel'), lance: P('spear', 'steel'), bow: P('bow', 'wood'), wand: P('mace', 'steel', { m: '#f6cf57', 2: '#c08f2c' }), staff: P('staff', 'violet'), heavy: P('plate', 'steel'), light: P('vest', 'leather', { h: '#5e3a22' }), robe: P('robe', 'violet') },
  misc: { ticket: P('ticket', 'gold'), crest: P('banner', 'red'), gold: P('coinbag', 'leather'),
    coffin: P('coffin', 'wood'), rings: P('rings', 'gold'), cradle: P('cradle', 'wood'), fcrest: P('fcrest', 'red'), cane: P('cane', 'wood') }      // r8 가문 화면: DS.icon('misc', 'coffin'|'rings'|'cradle'|'fcrest'|'cane')
};
var PAL0 = null, cache = {}, sheet = null, seq = 0;
function pal(spec) {
  var b = DS.PAL || {}, p = {}, k, c = C[spec[1]] || C.grey;
  if (!PAL0) { PAL0 = {}; for (k in b) PAL0[k] = b[k]; }
  for (k in PAL0) p[k] = PAL0[k];
  p['1'] = c[0]; p['2'] = c[1]; p['3'] = c[2];
  if (spec[2]) for (k in spec[2]) p[k] = spec[2][k];
  return p;
}
// 장비 그림의 재질: +0~3 쇠 · +4~7 강철 · +8~13 금테 · +14 부터 별빛 (g.mat, 유니크는 한 칸 위), 전설은 금. 천·가죽 갑옷은 색만 짙어진다
var GEAR_MAT = { iron: ['#8f9ab3', '#5b6480', '#cdd5e3'], steel: ['#cdd5e3', '#8f9ab3', '#ffffff'], gild: ['#e6e0d0', '#c08f2c', '#fff6d0'], star: ['#c9b8ff', '#7446ad', '#ffffff'], gold: ['#f6cf57', '#c08f2c', '#fff3c4'] };
function gearBand(g) { var m = g.mat || 1; return g.uniq ? 'gold' : m >= 8 ? 'star' : m >= 5 ? 'gild' : m >= 3 ? 'steel' : 'iron'; }      // 2.1.0: 단이 없다 — 강화할수록 빛깔이 오른다 (g.mat)
function gearSpec(g) {
  var b = ICON.gear[g.cat], band = gearBand(g), ex = {}, k, m = GEAR_MAT[band];
  if (b[2]) for (k in b[2]) ex[k] = b[2][k];
  if (b[1] === 'steel') { ex[1] = m[0]; ex[2] = m[1]; ex[3] = m[2]; }
  else if (band === 'gold' || band === 'star') { ex.g = band === 'gold' ? '#fff3c4' : '#e6d4ff'; ex.o = m[1]; }
  if (band === 'gild' || band === 'gold' || band === 'star') ex.g = band === 'star' ? '#e6d4ff' : '#f6cf57';
  return [b[0], b[1], ex];
}
function specOf(kind, id) {
  var I = ICON[kind] || {}, s = I[id];
  if (s) return s;
  if (kind === 'gear') { var g = DS.gear && DS.gear(id); if (g && ICON.gear[g.cat]) return gearSpec(g); }
  return null;
}
// 12×12 형판 → 14×14 캔버스 (빈칸 중 칠한 칸과 맞닿은 곳에 검은 테두리)
function paint(spec) {
  var rows = T[spec[0]], p = pal(spec), cv = document.createElement('canvas'), g, x, y, ch, on = [], k = DS.PAL ? DS.PAL.k : '#1b1626';
  cv.width = 14; cv.height = 14; g = cv.getContext('2d');
  for (y = 0; y < 14; y++) { on.push([]); for (x = 0; x < 14; x++) { ch = (rows[y - 1] || '')[x - 1]; on[y].push(ch && ch !== '.' && ch !== ' ' && p[ch] ? ch : null); } }
  g.fillStyle = k;
  for (y = 0; y < 14; y++) for (x = 0; x < 14; x++) if (!on[y][x] && ((on[y - 1] && on[y - 1][x]) || (on[y + 1] && on[y + 1][x]) || on[y][x - 1] || on[y][x + 1])) g.fillRect(x, y, 1, 1);
  for (y = 0; y < 14; y++) for (x = 0; x < 14; x++) if (on[y][x]) { g.fillStyle = p[on[y][x]]; g.fillRect(x, y, 1, 1); }
  // r4 hd: 같은 형판을 2배(28×28)로 굽는다 — 스프라이트와 같은 손질(모서리 반 픽셀·안쪽 빛과 그늘). CSS 쪽은 background-size 로 크기를 정하므로 그대로 맞는다
  if (DS.hdBake) try {
    var rows2 = [];
    for (y = 0; y < 14; y++) { var rr = ''; for (x = 0; x < 14; x++) rr += on[y][x] ? (on[y][x] === 'k' ? 'K' : on[y][x]) : (((on[y - 1] && on[y - 1][x]) || (on[y + 1] && on[y + 1][x]) || on[y][x - 1] || on[y][x + 1]) ? 'k' : '.'); rows2.push(rr); }
    var cf = function (ch) { return ch === 'k' ? k : ch === 'K' ? p.k : p[ch]; };
    return DS.bakeRows && DS.HD2 !== false ? DS.bakeRows(rows2, 14, cf) : DS.hdBake(rows2, 14, cf, false);      // r11: 1px 외곽선
  } catch (e) { /* 실패하면 14×14 그대로 */ }
  return cv;
}
function keyOf(kind, id) { if (kind === 'crest') return 'crest:' + id; var g = kind === 'gear' && DS.gear ? DS.gear(id) : null; return kind + ':' + (g ? g.cat + '.' + gearBand(g) : id); }
DS.iconCanvas = function (kind, id) {
  if (kind === 'crest' && DS.crestCanvas) { try { return DS.crestCanvas(id, 2); } catch (e) { return null; } }      // r11: 가문 문장 (DS.icon('crest', 집 이름))
  var key = keyOf(kind, id);
  if (cache[key] !== undefined) return cache[key] && cache[key].cv;
  var s = specOf(kind, id); if (!s || !T[s[0]] || typeof document === 'undefined') { cache[key] = null; return null; }
  cache[key] = { cv: paint(s), cls: null };
  return cache[key].cv;
};
// 등급(1 일반 … 5 전설): 테두리 색
DS.iconGrade = function (kind, id) {
  if (kind === 'gear') { var g = DS.gear && DS.gear(id); return g && g.grade ? g.grade : 1; }
  if (kind === 'item') {
    var it = DS.ITEMS && DS.ITEMS[id]; if (!it) return 1;
    if (['herb', 'mana', 'endo', 'bomb'].indexOf(id) >= 0) return 1;
    if (it.merc) return id === 'mg_plume' ? 3 : 2;
    if (it.forge) return 4;      // 강화 보호 부적
    return it.town ? 2 : (it.max === 1 ? 4 : 3);
  }
  return kind === 'misc' && id === 'crest' ? 5 : 2;
};
function cssClass(kind, id) {
  var key = keyOf(kind, id), cv = DS.iconCanvas(kind, id), e = cache[key];
  if (!cv || !e) return null;
  if (e.cls) return e.cls;
  try {
    if (!sheet) { var st = document.createElement('style'); st.id = 'gfxIcons'; document.head.appendChild(st); sheet = st.sheet; }
    e.cls = 'gi-' + (++seq);
    sheet.insertRule('.gi.' + e.cls + ' { background-image: url(' + cv.toDataURL() + '); }', sheet.cssRules.length);
  } catch (x) { e.cls = null; }
  return e.cls;
}
// 화면 쪽이 쓰는 함수: '<span class="ico gi g3 gi-7"></span>' — 그림이 없으면 지금처럼 첫 글자 네모 (등급색 테두리는 같다)
// kind: 'item' | 'gear' | 'misc'('ticket' 'crest' 'gold'). opt: { size: 픽셀(기본 32), grade: 등급 덮어쓰기, cls: 덧붙일 클래스 }
DS.iconHtml = function (kind, id, opt) {
  opt = opt || {};
  var gr = opt.grade || DS.iconGrade(kind, id), c = null, sz = opt.size && opt.size !== 32 ? ' style="width:' + opt.size + 'px;height:' + opt.size + 'px;background-size:' + (opt.size - 4) + 'px"' : '';
  try { c = cssClass(kind, id); } catch (x) { c = null; }
  if (c) return '<span class="ico gi g' + gr + ' ' + c + (opt.cls ? ' ' + opt.cls : '') + '"' + sz + '></span>';
  var nm = kind === 'item' && DS.ITEMS && DS.ITEMS[id] ? DS.ITEMS[id].name : String(id || '?');
  return '<span class="ico gi gtx g' + gr + (opt.cls ? ' ' + opt.cls : '') + '"' + sz + '>' + String(nm).charAt(0).replace(/[<>&"]/g, '') + '</span>';
};
// 화면이 아직 iconHtml 을 쓰지 않아도: 지금의 소모품 네모(<span class="ico i-키">)에 그림을 덧입힌다 (CSS 규칙만 꽂는다)
var GCOL = ['', '#4a4466', '#4f8a45', '#3f9aa8', '#9a70d8', '#f0b64a'];
DS.iconAutoCss = function () {
  if (typeof document === 'undefined' || !DS.ITEMS) return 0;
  var n = 0, k, cv;
  try {
    if (!sheet) { var st = document.createElement('style'); st.id = 'gfxIcons'; document.head.appendChild(st); sheet = st.sheet; }
    for (k in DS.ITEMS) {
      if (!/^[a-z0-9_]+$/i.test(k) || !(cv = DS.iconCanvas('item', k))) continue;
      var url = cv.toDataURL();
      sheet.insertRule('.ico.i-' + k + ' { width: 32px; height: 32px; flex: none; box-sizing: border-box; border: 2px solid ' + GCOL[DS.iconGrade('item', k)] + '; border-radius: 7px; background: #1a1629 url(' + url + ') center / 28px 28px no-repeat; image-rendering: ' + (DS.TOON !== false ? 'auto' : 'pixelated') + '; font-size: 0; color: transparent; }', sheet.cssRules.length);
      sheet.insertRule('.ico.i-' + k + '::after { content: none; }', sheet.cssRules.length);
      sheet.insertRule('.act.item[data-it="' + k + '"] .num::before { content: ""; display: inline-block; width: 14px; height: 14px; margin: 0 3px -2px 0; background: url(' + url + ') center / 14px 14px no-repeat; image-rendering: ' + (DS.TOON !== false ? 'auto' : 'pixelated') + '; }', sheet.cssRules.length);      // 전투 아이템 버튼: 개수 앞에 작은 그림
      n++;
    }
  } catch (x) {}
  return n;
};
if (typeof document !== 'undefined') setTimeout(function () { DS.iconAutoCss(); }, 0);
// r13 toon: 창 속 초상(<i data-spr> → canvas.px)은 화면 쪽이 「굽힌 폭 ÷ 2」로 CSS 크기를 정한다 — 카툰 그림(4배)은 그 절반으로 바로잡고 매끈하게 그린다
if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') (function () {
  function fix(c) {
    if (c.__tf || DS.TOON === false) return; c.__tf = 1;
    var X = DS.TOON_X || 4, w = c.width;
    if (DS.ART === 'new' && DS.artBustFor) {      // r14 새 그림: 논리 폭으로 크기를 바로잡고, 사람이면 가슴 위 큰 그림(초상)으로 바꿔 그린다
      var ab = DS.artBustFor(c);
      if (ab) {
        var sw0 = parseFloat(c.style.width), sh0 = parseFloat(c.style.height); if (!sw0) return;
        var k0 = 2 * ab.lw / w; c.style.width = sw0 * k0 + 'px'; c.style.height = sh0 * k0 + 'px'; c.style.imageRendering = 'auto'; c.classList.add('toon', 'art');
        if (ab.bust) { c.width = ab.bust.width; c.height = ab.bust.height; c.getContext('2d').drawImage(ab.bust, 0, 0); c.classList.add('bust'); }
        return;
      }
    }
    if (w !== 16 * X && w !== 24 * X) return;
    var sw = parseFloat(c.style.width), sh = parseFloat(c.style.height); if (!sw) return;
    c.style.width = sw * 2 / X + 'px'; c.style.height = sh * 2 / X + 'px'; c.style.imageRendering = 'auto'; c.classList.add('toon');
  }
  function scan(n) { if (n.nodeType !== 1) return; if (n.tagName === 'CANVAS' && n.classList.contains('px')) fix(n); else if (n.querySelectorAll) { var l = n.querySelectorAll('canvas.px'); for (var i = 0; i < l.length; i++) fix(l[i]); } }
  function go() { new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) scan(ms[i].addedNodes[j]); }).observe(document.documentElement, { childList: true, subtree: true }); }
  go();
  try { if (DS.TOON !== false) document.documentElement.classList.add('toon'); } catch (e) {}
})();
DS.iconOf = function (kind, id, grade) { return DS.iconHtml(kind, id, grade ? { grade: grade } : null); }; if (!DS.icon) DS.icon = DS.iconOf;      // r26: DS.icon 은 icons.js 의 SVG 아이콘 (옛 이름은 DS.iconOf)      // ui 팀 제안 이름 (같은 것)
DS.ICON_T = T; DS.ICON = ICON;      // 시험용 (모든 형판을 한 장에 그려 보는 도구가 쓴다)
})();

// ───────── 장면 그림 (2.8) — 타이틀 밤 풍경, 결과 창의 승리 그림, 맺음(엔딩) 새벽 ─────────
// 화면 쪽은 DS.titleArt(캔버스) 를 부르거나(없으면 옛 그림), DS.sceneArt('win'|'ending') 의 <img> HTML 을 끼운다.
(function () {
'use strict';
var TEN = ['inf', 'cav', 'fly', 'mar', 'pike', 'arc', 'cle', 'mon', 'mag', 'sha'], TEN_T = [2, 3, 3, 2, 3, 2, 2, 3, 2, 2], K = '#1b1626';
function sr(seed) { return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
// 하늘: 띠마다 색, 띠 경계는 격자 무늬로 섞는다 (픽셀 그림의 그라데이션)
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function sky(g, W, top, bot, cols) {      // 4×4 격자 무늬(Bayer)로 띠와 띠 사이를 고르게 섞는다
  var n = cols.length, x, y, v, k;
  for (y = top; y < bot; y++) for (x = 0; x < W; x++) {
    v = (y - top) / (bot - top) * (n - 1) + BAYER[(x & 3) + (y & 3) * 4] / 16 - 0.5;
    k = Math.max(0, Math.min(n - 1, Math.round(v))); g.fillStyle = cols[k]; g.fillRect(x, y, 1, 1);
  }
}
function ridge(g, W, H, base, amp, f1, f2, ph, col) { g.fillStyle = col; for (var x = 0; x < W; x++) { var h = Math.round(base - Math.sin(x * f1 + ph) * amp - Math.sin(x * f2 + ph * 1.7) * amp * 0.55); g.fillRect(x, h, 1, H - h); } }
function disc(g, cx, cy, r, col, shade) { for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) { g.fillStyle = shade && x + y > r * 0.5 ? shade : col; g.fillRect(cx + x, cy + y, 1, 1); } }
function castle(g, x, y, col) {      // 먼 언덕 위 성채 실루엣 (y = 땅 높이)
  g.fillStyle = col;
  g.fillRect(x, y - 8, 26, 8); g.fillRect(x + 2, y - 14, 5, 14); g.fillRect(x + 19, y - 14, 5, 14); g.fillRect(x + 10, y - 19, 6, 19);
  [[x + 2, y - 15], [x + 4, y - 15], [x + 6, y - 15], [x + 19, y - 15], [x + 21, y - 15], [x + 23, y - 15], [x + 10, y - 20], [x + 12, y - 20], [x + 14, y - 20]].forEach(function (p) { g.fillRect(p[0], p[1], 1, 1); });
  for (var i = 7; i < 19; i += 2) g.fillRect(x + i, y - 9, 1, 1);
  g.fillRect(x + 12, y - 25, 1, 6);
}
// 위·아래 가장자리를 격자 무늬로 지워 화면 바탕에 스며들게 (네모난 그림 경계가 보이지 않게)
function fadeEdges(g, W, H, top, bot) {
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
  for (var y = 0; y < top + bot; y++) {
    var yy = y < top ? y : H - 1 - (y - top), q = y < top ? y / top : (y - top) / bot, x;
    for (x = 0; x < W; x++) if (BAYER[(x & 3) + (yy & 3) * 4] / 16 >= q) g.fillRect(x, yy, 1, 1);
  }
  g.restore();
}
var bgCache = {};
function titleBg(W, H) {
  var key = W + 'x' + H; if (bgCache[key]) return bgCache[key];
  var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var g = cv.getContext('2d'), r = sr(7), i;
  sky(g, W, 0, 50, ['#120f24', '#16122c', '#1c1736', '#231c42', '#2d2350', '#3a2b5c']);
  // 달: 은은한 빛무리 + 그늘 + 곰보
  g.globalAlpha = 0.08; disc(g, 148, 15, 13, '#fff3c4'); g.globalAlpha = 0.12; disc(g, 148, 15, 10, '#fff3c4'); g.globalAlpha = 1;
  disc(g, 148, 15, 7, '#f4efd8', '#d6cba8'); g.fillStyle = '#d6cba8'; g.fillRect(145, 12, 2, 2); g.fillRect(150, 17, 2, 1); g.fillRect(147, 18, 1, 1);
  ridge(g, W, H, 40, 5, 0.06, 0.017, 1.3, '#2a2448');
  castle(g, 30, 36, '#171329');
  ridge(g, W, H, 50, 4, 0.09, 0.031, 0.4, '#302a55');
  ridge(g, W, H, 58, 2, 0.13, 0.05, 2.2, '#25432f');
  g.fillStyle = '#2f6b3a'; g.fillRect(0, 62, W, H - 62); g.fillStyle = '#4c9a52'; g.fillRect(0, 62, W, 1); g.fillStyle = '#3c8446'; g.fillRect(0, 63, W, 1);
  for (i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? '#285c32' : '#3c8446'; g.fillRect(Math.floor(r() * W), 64 + Math.floor(r() * (H - 64)), r() < 0.3 ? 2 : 1, 1); }
  for (i = 0; i < 26; i++) { var tx = Math.floor(r() * W), ty = 66 + Math.floor(r() * (H - 68)); g.fillStyle = '#5fae5a'; g.fillRect(tx, ty, 1, 2); g.fillRect(tx + 2, ty + 1, 1, 1); g.fillRect(tx + 1, ty - 1, 1, 2); }      // 풀포기
  g.fillStyle = '#5c4a32'; for (i = 0; i < 18; i++) g.fillRect(84 + Math.round(Math.sin(i * 0.5) * 2) - (i >> 1), 63 + i, 6 + (i >> 2), 1);      // 앞으로 뻗은 흙길
  fadeEdges(g, W, H, 10, 6);
  return (bgCache[key] = cv);
}
// 타이틀: 달 밝은 밤, 먼 성채, 열 병과의 지휘관이 깃발을 들고 선다. 별이 반짝이고 반딧불이 떠다니며 가끔 별똥별이 진다.
DS.titleArt = function (cv) {
  if (!cv.dataset.hd) { cv.dataset.hd = '1'; cv.dataset.w = cv.width; cv.dataset.h = cv.height; cv.width *= 2; cv.height *= 2; }      // r4 hd: 속 해상도만 2배 (CSS 는 width:100%·height:auto 라 크기 그대로) — 지휘관들을 2배 스프라이트로
  var g = cv.getContext('2d'), W = +cv.dataset.w, H = +cv.dataset.h, t = 0, r = sr(11), stars = [], flies = [], i, shoot = { t: -9, x: 0, y: 0 };
  for (i = 0; i < 34; i++) stars.push([Math.floor(r() * W), Math.floor(r() * 40), r() * 6, r() < 0.15]);
  for (i = 0; i < 9; i++) flies.push([r() * W, 50 + r() * 26, r() * 6]);
  var cols = TEN.map(function (c) { return DS.FLAG && DS.FLAG[c] || '#f6cf57'; });
  function draw() {
    if (!cv.isConnected) return;
    t += 1 / 60;
    g.imageSmoothingEnabled = false; g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, W, H); g.drawImage(titleBg(W, H), 0, 0);
    for (i = 0; i < stars.length; i++) { var s = stars[i], a = 0.35 + 0.45 * Math.sin(t * (1.2 + s[2] * 0.3) + s[2] * 7); g.globalAlpha = Math.max(0.1, a); g.fillStyle = s[3] ? '#fff3c4' : '#ffffff'; g.fillRect(s[0], s[1], 1, 1); if (s[3] && a > 0.7) { g.globalAlpha = a * 0.4; g.fillRect(s[0] - 1, s[1], 3, 1); g.fillRect(s[0], s[1] - 1, 1, 3); } }
    g.globalAlpha = 1;
    if (t - shoot.t > 7 && Math.sin(t * 13.7) > 0.995) { shoot.t = t; shoot.x = 40 + Math.floor(r() * 80); shoot.y = 4 + Math.floor(r() * 10); }
    var sp = (t - shoot.t) / 0.6; if (sp >= 0 && sp < 1) { for (i = 0; i < 8; i++) { g.globalAlpha = (1 - sp) * (1 - i / 8); g.fillStyle = '#ffffff'; g.fillRect(Math.round(shoot.x + sp * 40 - i * 2), Math.round(shoot.y + sp * 14 - i * 0.7), 1, 1); } g.globalAlpha = 1; }
    if (Math.sin(t * 2.3) > 0.2) { g.fillStyle = '#f6cf57'; g.fillRect(37, 27, 1, 1); g.fillRect(52, 28, 1, 1); } if (Math.sin(t * 1.7 + 1) > 0) { g.fillStyle = '#ffd98a'; g.fillRect(42, 21, 1, 1); }      // 성채 창불
    g.fillStyle = '#3a3360'; g.fillRect(43, 11 + (Math.sin(t * 6) > 0 ? 0 : 1), 3, 2);      // 성채 깃발
    TEN.forEach(function (c, n) {
      var px = 3 + n * 17 + (n % 2), py = 46 + (n % 2) * 5 + Math.round(Math.sin(t * 3 + n) * 0.6), wv = Math.round(Math.sin(t * 5 + n) * 1), w2 = Math.sin(t * 5 + n + 1) > 0 ? 1 : 0;
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(px + 3, py + 15, 10, 2);
      g.fillStyle = K; g.fillRect(px + 13, py - 13, 1, 16);
      g.fillStyle = K; g.fillRect(px + 14, py - 14, 8 + wv, 6);
      g.fillStyle = cols[n]; g.fillRect(px + 14, py - 13, 6 + wv, 4); g.fillRect(px + 14 + 6 + wv, py - 13 + w2, 1, 3 - w2);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px + 14, py - 10, 6 + wv, 1);
      g.fillStyle = '#f6cf57'; g.fillRect(px + 13, py - 14, 1, 1);
      g.drawImage(DS.spriteCanvas(c + '_' + TEN_T[n], null, { hd: 1, toon: 0 }), px, py, 16, 16);      // r13: 타이틀은 작은 픽셀 캔버스라 이전 굽기
    });
    for (i = 0; i < flies.length; i++) { var f = flies[i], fx = (f[0] + Math.sin(t * 0.7 + f[2]) * 6 + t * 2) % W, fy = f[1] + Math.sin(t * 1.3 + f[2] * 2) * 3, fa = Math.max(0, Math.sin(t * 2.2 + f[2] * 5)); if (fa < 0.1) continue; g.globalAlpha = fa; g.fillStyle = '#e8ff8a'; g.fillRect(Math.round(fx), Math.round(fy), 1, 1); g.globalAlpha = fa * 0.3; g.fillRect(Math.round(fx) - 1, Math.round(fy), 3, 1); }
    g.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
};
// 결과·맺음 그림: <img> HTML 하나 (한 번 그려 dataURL 로 캐시). kind: 'win' 승리(출전 지휘관 셋이 언덕에 깃발을 세운다) · 'ending' 새벽(열 깃발)
var artCache = {};
function partyLooks() {
  var s = DS.G && DS.G.save, out = [];
  if (s && s.party) s.party.forEach(function (id) { var c = s.chars[id]; if (c && DS.lookName) out.push({ spr: (function () { var pl = DS.charLook ? DS.charLook(c, s) : null; return pl && !pl[1] ? pl[0] : DS.lookName(c.cls, DS.tierOfL(c.L)); })(),      /* r27: 가주는 제 모습 */ col: DS.FLAG[c.cls] || '#f6cf57', down: !!c.down, mst: DS.tierOfL(c.L) >= 8 }); });
  return out;
}
function flagOn(g, x, y, col, mst, wv) {
  g.fillStyle = K; g.fillRect(x, y - 15, 1, 17); g.fillRect(x + 1, y - 16, (mst ? 9 : 7) + 1, mst ? 7 : 6);
  g.fillStyle = col; g.fillRect(x + 1, y - 15, mst ? 8 : 6, mst ? 5 : 4); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 1, y - 15 + (mst ? 4 : 3), mst ? 8 : 6, 1);
  if (mst) { g.fillStyle = '#f6cf57'; g.fillRect(x + 1, y - 15, 8, 1); }
  g.fillStyle = '#f6cf57'; g.fillRect(x, y - 16, 1, 1);
}
// r8 gfx: 가문 사건 띠 그림 — 'rite' 장례 · 'wed' 혼인 · 'birth' 출생 · 'revive' 부활. 둘째 인자(선택) { spr, col, spr2, col2 }: 그 사람의 모습·깃발 색 (없으면 주인공)
function coffinSide(g, x, y, open) {      // 옆에서 본 관 (24×7). open: 뚜껑이 들려 틈으로 빛이 샌다
  g.fillStyle = K; g.fillRect(x, y, 24, 7); g.fillStyle = '#8a5a36'; g.fillRect(x + 1, y + 1, 22, 5); g.fillStyle = '#5e3a22'; g.fillRect(x + 1, y + 5, 22, 1); g.fillRect(x + 7, y + 2, 1, 3); g.fillRect(x + 16, y + 2, 1, 3);
  if (open) { g.fillStyle = '#fff6d8'; g.fillRect(x + 1, y, 22, 1); g.fillStyle = K; g.fillRect(x - 3, y - 4, 24, 3); g.fillStyle = '#a8754a'; g.fillRect(x - 2, y - 3, 22, 1); }
  else { g.fillStyle = '#a8754a'; g.fillRect(x + 1, y + 1, 22, 1); g.fillStyle = '#f6cf57'; g.fillRect(x + 11, y + 2, 2, 3); g.fillRect(x + 10, y + 3, 4, 1); }
}
function heroLook() { var l = partyLooks()[0]; return l || { spr: 'inf_2', col: '#f6cf57' }; }
function person(g, spr, x, y, o) { try { var sc = DS.spriteCanvas(spr, null, { hd: 1, flip: !!(o && o.flip), tint: (o && o.tint) || null }); if (o && o.a) g.globalAlpha = o.a; if (sc.toon) { g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; } g.drawImage(sc, x, y, 16, 16); g.globalAlpha = 1; } catch (x2) { g.globalAlpha = 1; } }
function famArt(g, kind, W, H, o, r) {
  var me = heroLook(), spr = o.spr || me.spr, col = o.col || me.col, spr2 = o.spr2 || 'cle_2', col2 = o.col2 || '#f6cf57', i, y;
  if (kind === 'rite') {      // 저녁. 반쯤 내린 깃발, 관, 고개 숙인 두 사람, 떠나는 이의 옅은 모습
    sky(g, W, 0, 31, ['#1c1736', '#2a2048', '#4a2c56', '#7a3e5c', '#b0605a', '#d98a5e']);
    ridge(g, W, H, 29, 2, 0.09, 0.035, 2.1, '#2a2040'); g.fillStyle = '#27402e'; g.fillRect(0, 32, W, H - 32); g.fillStyle = '#3c5e42'; g.fillRect(0, 32, W, 1);
    g.fillStyle = K; g.fillRect(52, 5, 1, 29); g.fillRect(53, 15, 10, 7); g.fillStyle = col; g.fillRect(53, 16, 9, 5); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(53, 20, 9, 1); g.fillStyle = '#f6cf57'; g.fillRect(52, 4, 1, 1);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(57, 36, 26, 1); coffinSide(g, 58, 29, false);
    person(g, spr, 62, 11, { tint: '#d9c8e8', a: 0.3 });
    person(g, 'inf_2', 28, 19, { tint: '#1a1528' }); person(g, 'cle_2', 90, 19, { tint: '#1a1528', flip: true });
    g.fillStyle = '#ffd98a'; g.fillRect(48, 33, 1, 1); g.fillRect(86, 33, 1, 1); g.fillStyle = '#fff6d8'; g.fillRect(48, 32, 1, 1); g.fillRect(86, 32, 1, 1);      // 촛불 둘
  } else if (kind === 'wed') {      // 아침. 엇건 두 깃발 아래 마주 선 두 사람, 흩날리는 꽃잎
    sky(g, W, 0, 31, ['#3a2c5c', '#6a4068', '#b05a68', '#e88a66', '#ffc880', '#ffe6a8']);
    ridge(g, W, H, 30, 2, 0.11, 0.04, 0.8, '#5a3e5e'); g.fillStyle = '#3f6a3a'; g.fillRect(0, 32, W, H - 32); g.fillStyle = '#7ab86a'; g.fillRect(0, 32, W, 1);
    g.fillStyle = K; for (i = 0; i <= 27; i++) { g.fillRect(50 + Math.round(i * 20 / 27), 32 - i, 1, 1); g.fillRect(70 - Math.round(i * 20 / 27), 32 - i, 1, 1); }
    g.fillRect(71, 3, 10, 7); g.fillRect(40, 3, 10, 7); g.fillStyle = col; g.fillRect(41, 4, 9, 5); g.fillStyle = col2; g.fillRect(71, 4, 9, 5); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(41, 8, 9, 1); g.fillRect(71, 8, 9, 1);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(43, 34, 12, 2); g.fillRect(66, 34, 12, 2);
    person(g, spr, 41, 19); person(g, spr2, 64, 19, { flip: true });
    var pc = ['#ffb3c6', '#ffffff', '#ffe27a']; for (i = 0; i < 30; i++) { var qx = Math.floor(r() * W), qy = Math.floor(r() * 30); if (Math.abs(qx - 60) < 22 && qy > 16) continue; g.fillStyle = pc[i % 3]; g.fillRect(qx, qy, r() < 0.3 ? 2 : 1, 1); }
  } else if (kind === 'birth') {      // 새벽. 깃대 아래 요람, 그 위의 첫 별
    sky(g, W, 0, 31, ['#1c1a40', '#2c2a5c', '#4a3c78', '#8a5a80', '#d98a78', '#ffc890']);
    g.globalAlpha = 0.3; disc(g, 84, 30, 9, '#fff3c4'); g.globalAlpha = 1; disc(g, 84, 30, 6, '#fff6d8', '#ffe6a0');
    ridge(g, W, H, 30, 2, 0.1, 0.04, 1.4, '#3c3460'); g.fillStyle = '#3a6440'; g.fillRect(0, 32, W, H - 32); g.fillStyle = '#6aa868'; g.fillRect(0, 32, W, 1);
    g.fillStyle = K; g.fillRect(46, 5, 1, 29); g.fillRect(47, 5, 10, 7); g.fillStyle = col; g.fillRect(47, 6, 9, 5); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(47, 10, 9, 1); g.fillStyle = '#f6cf57'; g.fillRect(46, 4, 1, 1);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(51, 36, 20, 1);
    g.fillStyle = K; g.fillRect(51, 27, 19, 7); g.fillRect(50, 22, 6, 6); g.fillRect(52, 34, 2, 2); g.fillRect(67, 34, 2, 2); g.fillRect(54, 35, 13, 1);
    g.fillStyle = '#a8754a'; g.fillRect(52, 28, 17, 5); g.fillRect(51, 23, 4, 5); g.fillStyle = '#6f4a2c'; g.fillRect(52, 32, 17, 1); g.fillStyle = '#d6a878'; g.fillRect(51, 23, 1, 4);
    g.fillStyle = '#ffffff'; g.fillRect(56, 27, 11, 2); g.fillStyle = '#f3c9a1'; g.fillRect(56, 26, 3, 2); g.fillStyle = '#e9e2d0'; g.fillRect(59, 28, 8, 1);
    g.fillStyle = '#fff3c4'; g.fillRect(61, 12, 1, 5); g.fillRect(59, 14, 5, 1); g.fillStyle = '#ffffff'; g.fillRect(61, 14, 1, 1);      // 첫 별
    for (i = 0; i < 12; i++) { g.fillStyle = '#ffffff'; g.globalAlpha = 0.3 + r() * 0.4; g.fillRect(Math.floor(r() * W), Math.floor(r() * 16), 1, 1); } g.globalAlpha = 1;
    person(g, spr, 26, 19); if (o.spr2) person(g, spr2, 82, 19, { flip: true });
  } else {      // revive — 밤. 들린 관 뚜껑 틈에서 빛기둥이 오르고, 그 안에 돌아오는 이
    sky(g, W, 0, 34, ['#0e0c1a', '#131024', '#1a1630', '#221c3a']);
    for (i = 0; i < 14; i++) { g.fillStyle = '#ffffff'; g.globalAlpha = 0.25 + r() * 0.4; g.fillRect(Math.floor(r() * W), Math.floor(r() * 20), 1, 1); } g.globalAlpha = 1;
    ridge(g, W, H, 31, 2, 0.07, 0.03, 1.1, '#1c1830'); g.fillStyle = '#22382a'; g.fillRect(0, 34, W, H - 34); g.fillStyle = '#2f5a3a'; g.fillRect(0, 34, W, 1);
    for (y = 0; y < 30; y++) { var hw = 7 + (29 - y) * 0.45, x; for (x = Math.round(60 - hw); x <= Math.round(60 + hw); x++) { var ed = Math.abs(x - 60) / hw, th = (BAYER[(x & 3) + (y & 3) * 4] + 0.5) / 16; if (ed * ed * 0.9 + (29 - y) / 60 > th + 0.25) continue; g.fillStyle = ed < 0.45 ? '#fff6d8' : '#f6cf57'; g.globalAlpha = ed < 0.45 ? 0.55 : 0.35; g.fillRect(x, y, 1, 1); } }
    g.globalAlpha = 1;
    person(g, spr, 52, 10, { tint: '#fff6d8', a: 0.45 }); person(g, spr, 52, 10, { a: 0.75 });
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(47, 37, 26, 1); coffinSide(g, 48, 30, true);
    g.fillStyle = '#fff6d8'; for (i = 0; i < 10; i++) { g.globalAlpha = 0.5 + r() * 0.5; g.fillRect(44 + Math.floor(r() * 32), 2 + Math.floor(r() * 26), 1, 1); } g.globalAlpha = 1;
  }
}
var FAM = { rite: 1, wed: 1, birth: 1, revive: 1 };
DS.sceneArt = function (kind, fo) {
  if (typeof document === 'undefined') return '';
  try {
    fo = fo || {};
    var looks = kind === 'win' || kind === 'lose' ? partyLooks() : [], key = kind + ':' + looks.map(function (l) { return l.spr + l.down; }).join(',') + (FAM[kind] ? [fo.spr, fo.col, fo.spr2, fo.col2, heroLook().spr].join('|') : '');
    if (!artCache[key]) {
      var W = 120, H = kind === 'win' ? 44 : 40, cv = document.createElement('canvas'), g, r = sr(kind === 'win' ? 5 : 9), i;
      cv.width = W * 2; cv.height = H * 2; g = cv.getContext('2d'); g.imageSmoothingEnabled = DS.TOON !== false; g.imageSmoothingQuality = 'high'; g.scale(2, 2);      // r4 hd: 속 해상도 2배 (.gfx-art 는 CSS 폭이 정해져 있다)
      if (FAM[kind]) famArt(g, kind, W, H, fo, r);
      else if (kind === 'ending') {
        sky(g, W, 0, 31, ['#241e48', '#3a2c5c', '#6a4068', '#b05a68', '#e88a66', '#ffc880', '#ffe6a8']);
        for (i = 0; i < 16; i++) { var ra = Math.PI + i / 15 * Math.PI, rl = 18 + (i % 2) * 8; g.globalAlpha = 0.22; g.fillStyle = '#fff3c4'; for (var rr = 11; rr < rl; rr += 2) g.fillRect(60 + Math.round(Math.cos(ra) * rr), 28 + Math.round(Math.sin(ra) * rr * 0.7), 1, 1); }      // 햇살
        g.globalAlpha = 0.3; disc(g, 60, 28, 11, '#fff3c4'); g.globalAlpha = 1; disc(g, 60, 28, 8, '#fff6d8', '#ffe6a0');
        ridge(g, W, H, 30, 2, 0.11, 0.04, 0.8, '#5a3e5e'); g.fillStyle = '#3f6a3a'; g.fillRect(0, 32, W, H - 32); g.fillStyle = '#7ab86a'; g.fillRect(0, 32, W, 1); g.fillStyle = '#ffe6a0'; g.globalAlpha = 0.35; g.fillRect(44, 32, 32, 1); g.globalAlpha = 1;
        TEN.forEach(function (c, n) { var x = n < 5 ? 5 + n * 8 : 80 + (n - 5) * 8, y = 36 + (n % 2) * 2; flagOn(g, x, y, DS.FLAG[c] || '#f6cf57', false); });      // 다섯씩 해를 비켜 선다
      } else if (kind === 'lose') {      // 전멸: 비 내리는 밤, 쓰러진 깃대 곁에 유령이 된 지휘관들
        sky(g, W, 0, 34, ['#100e1c', '#151226', '#1b1730', '#221c3a']);
        ridge(g, W, H, 31, 2, 0.07, 0.03, 1.1, '#1c1830'); g.fillStyle = '#23402c'; g.fillRect(0, 34, W, H - 34); g.fillStyle = '#2f5a3a'; g.fillRect(0, 34, W, 1);
        var nl = looks.length || 1;
        looks.forEach(function (l, k) {
          var px = Math.round(60 + (k - (nl - 1) / 2) * 24 - 8), py = 17, j;
          g.fillStyle = K; for (j = 0; j < 14; j++) g.fillRect(px + 10 + j, 35 - Math.floor(j / 5), 1, 1);      // 쓰러진 깃대
          g.fillStyle = l.col; g.globalAlpha = 0.7; g.fillRect(px + 20, 31, 6, 3); g.globalAlpha = 1;
          g.globalAlpha = 0.5; g.drawImage(DS.spriteCanvas(l.spr, null, { hd: 1 }), px, py - 2, 16, 16); g.globalAlpha = 0.3; g.drawImage(DS.spriteCanvas(l.spr, null, { tint: '#b6c4ea', hd: 1 }), px, py - 3, 16, 16); g.globalAlpha = 1;      // 유령: 흐릿한 몸에 푸른 기운
        });
        g.fillStyle = '#8f9ab3'; for (i = 0; i < 40; i++) { var rx = Math.floor(r() * W), ry = Math.floor(r() * H); g.globalAlpha = 0.35; g.fillRect(rx, ry, 1, 2); }      // 빗줄기
        g.globalAlpha = 1;
      } else {
        sky(g, W, 0, 36, ['#1c1736', '#262046', '#33285a', '#3f3268']);
        for (i = 0; i < 16; i++) { g.fillStyle = r() < 0.5 ? '#ffffff' : '#fff3c4'; g.globalAlpha = 0.4 + r() * 0.5; g.fillRect(Math.floor(r() * W), Math.floor(r() * 22), 1, 1); }
        g.globalAlpha = 1;
        ridge(g, W, H, 33, 3, 0.08, 0.03, 0.5, '#2a2448');
        g.fillStyle = '#2f6b3a'; for (var x = 0; x < W; x++) { var hy = Math.round(38 - Math.max(0, 6 - Math.abs(x - 60) * 0.16)); g.fillRect(x, hy, 1, H - hy); }      // 가운데가 솟은 언덕
        g.fillStyle = '#4c9a52'; for (x = 0; x < W; x++) { hy = Math.round(38 - Math.max(0, 6 - Math.abs(x - 60) * 0.16)); g.fillRect(x, hy, 1, 1); }
        var n = looks.length || 1;
        looks.forEach(function (l, k) {
          var cx = 60 + (k - (n - 1) / 2) * 20, px = Math.round(cx - 8), py = 17 + Math.round(Math.abs(cx - 60) * 0.16);
          g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(px + 3, py + 15, 10, 2);
          flagOn(g, px + 13, py + 2, l.col, l.mst);
          var sc = DS.spriteCanvas(l.spr, null, l.down ? { tint: '#8f9ab3', hd: 1 } : { hd: 1 }); if (l.down) g.globalAlpha = 0.55; g.drawImage(sc, px, py, lwOf(sc), lwOf(sc)); g.globalAlpha = 1;
        });
        var cc = ['#f6cf57', '#ff8a9a', '#62b0ee', '#7fcf6a', '#ffffff', '#b181e6'];      // 꽃가루처럼 흩날리는 색종이
        for (i = 0; i < 34; i++) { g.fillStyle = cc[i % cc.length]; var qx = Math.floor(r() * W), qy = Math.floor(r() * 34); if (Math.abs(qx - 60) < 32 && qy > 2) continue; g.fillRect(qx, qy, r() < 0.3 ? 2 : 1, 1); }
      }
      artCache[key] = cv.toDataURL();
    }
    return '<img class="gfx-art gfx-' + kind + '" src="' + artCache[key] + '" alt="">';
  } catch (x) { return ''; }
};
})();
