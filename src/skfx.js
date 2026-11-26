// 전민 — 기술 연출 틀 (2.7 「기술마다 제 얼굴」). 쓰는 법은 docs/SKILL_FX.md.
//   · DS.SKFX[기술 id] = { cast, beat, mark, zone, zoneTick, zoneEnd, cancel } — 그 기술만의 연출. 없으면 옛 공용 연출(V.fx) 그대로.
//   · 안무: c.at(초, fn) — 게임 시계(sim.t)로 흐른다. 멈추면 같이 멈추고 배속을 따른다.
//   · 단계 예산 X.BUDGET[1~5] — 윗단계일수록 길고 겹이 많고 화면이 함께 움직인다. 넘는 것은 틀이 잘라 낸다.
//   · 병과 파일(src/skfx_<병과>.js)은 X.def(id, {…}) 로 기술 표(효과 · 박자 · 설명)를 제 파일에서 고치고, X.reg(id, {…}) 로 연출을 단다.
// 이 파일은 Node(봇)에서도 읽힌다 — 읽는 동안에는 화면(document · canvas)을 건드리지 않는다.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
DS.SKFX = DS.SKFX || {};
var X = DS.skfx = {};
// ── 단계 예산 ── dur: 건 순간부터 마지막 충격까지(초, 여운은 그 뒤 dur 만큼 더) · parts: 알갱이 · shapes: 모양(고리 · 선 · 새 그림 조각) · light: [반지름, 세기]
//   shake · stop(멈칫) · flash(번쩍) · wash(빛 물듦): 그 값까지 · decal(땅 자국) · ghost(잔상) · dim(둘레 어둠) · streak(화면 줄기): 그 수까지 · snd: 소리 겹
X.BUDGET = {
  1: { dur: 0.5, parts: 14, shapes: 8,  light: [16, 0.40], shake: 0,    stop: 0,    flash: 0,    wash: 0,    decal: 0, ghost: 0, dim: 0, streak: 0,  snd: 1 },
  2: { dur: 0.9, parts: 28, shapes: 14, light: [22, 0.50], shake: 0.12, stop: 0.03, flash: 0.04, wash: 0,    decal: 1, ghost: 0, dim: 0, streak: 0,  snd: 2 },
  3: { dur: 1.4, parts: 48, shapes: 22, light: [28, 0.60], shake: 0.22, stop: 0.05, flash: 0.06, wash: 0.05, decal: 2, ghost: 2, dim: 0, streak: 0,  snd: 3 },
  4: { dur: 2.0, parts: 70, shapes: 30, light: [36, 0.75], shake: 0.32, stop: 0.07, flash: 0.08, wash: 0.08, decal: 3, ghost: 3, dim: 1, streak: 6,  snd: 4 },
  5: { dur: 2.8, parts: 96, shapes: 40, light: [44, 0.85], shake: 0.45, stop: 0.09, flash: 0.10, wash: 0.10, decal: 4, ghost: 5, dim: 1, streak: 12, snd: 5 }
};
X.CAP = { fx: 56, q: 96, rings: 64, lines: 56 };      // 온 화면의 상한: 새 그림 조각 · 기다리는 안무 · 고리 · 선 (알갱이 240 · 모양 48 은 view.js)
X.stat = { runs: {}, err: 0, fx: 0, parts: 0, shapes: 0, rings: 0, lines: 0, q: 0, over: 0 };      // 시험이 읽는다 (tools/t_skfx.js): 돈 횟수 · 오류 · 가장 많았던 때의 수
var tierC = {};
// 단계: T1 = 1~3단에 익히는 기술 · T2 = 4~7단 · T3 = 윗길(8~10단) 기술 · T4 = 필살기 u_* · T5 = 윗길 필살기 ux_*  (연출 표에 tier 를 적으면 그 값)
X.tierOf = function (id) {
  if (tierC[id]) return tierC[id];
  var S = DS.SKILLS[id], F = DS.SKFX[id], t = 1, lo = 99, c, L, i;
  if (!S) return 1;
  if (F && F.tier) t = F.tier;
  else if (/^ux_/.test(id)) t = 5; else if (S.ult) t = 4; else if (S.rise) t = 3;
  else {
    for (c in DS.CLASSES) { if (DS.CLASSES[c].master) continue; L = DS.CLASSES[c].skills || []; for (i = 0; i < L.length; i++) if (L[i][0] === id && L[i][1] < lo) lo = L[i][1]; }
    t = lo <= 3 ? 1 : lo <= 7 ? 2 : 1;
  }
  return (tierC[id] = t);
};
// 기술 표 고치기 (병과 파일이 부른다): 있는 기술의 칸만 덮어쓴다 (eff 는 통째로 · null 이면 그 칸을 지운다). 처음 모습은 X.DEFS[id].was 에 남긴다 (시험 · 문서가 견준다)
X.DEFS = {};
X.def = function (id, patch) {
  var S = DS.SKILLS[id], k; if (!S) return null;
  if (!X.DEFS[id]) X.DEFS[id] = { was: JSON.parse(JSON.stringify(S)) };
  for (k in patch) { if (patch[k] === null) delete S[k]; else S[k] = patch[k]; }
  return S;
};
X.reg = function (id, spec) { DS.SKFX[id] = typeof spec === 'function' ? { cast: spec } : spec; tierC[id] = 0; return DS.SKFX[id]; };
// 병과 빛깔 (연출의 기준 색 — 병과 파일이 제 것을 더한다. docs/SKILL_FX.md 의 표)
X.PAL = {};
// 병과 파일이 제 그림 조각을 더한다: X.kind('이름', { L: 겹(0 땅 · 1 공중 · 2 화면), draw: function (g, p, f, time, V, cx, cy) {…} }) → c.fx('이름', {…})
X.KINDS = {};
X.kind = function (name, spec) { if (!name || !spec || typeof spec.draw !== 'function') return false; X.KINDS[name] = spec; return true; };
// 병과 파일이 제 소리를 더한다: X.sound('이름', function (tone, noise) {…}, 음량 보정) → c.sfx('이름') · c.boom('이름')
X.sound = function (name, fn, lvl) { return !!(DS.Audio && DS.Audio.def && DS.Audio.def(name, fn, lvl)); };

var VP = DS.View && DS.View.prototype; if (!VP) return;
var VX = DS.VX || {}, pxLine = VX.pxLine;
function hs(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }      // 차례와 씨앗으로 정해지는 0~1 (프레임마다 같은 값)
function env(f, a, b) { return f < a ? f / a : f > 1 - b ? (1 - f) / b : 1; }      // 들어오고(a) 나가는(b) 세기
function ease(f) { return 1 - (1 - f) * (1 - f); }
X.hs = hs; X.env = env; X.ease = ease;
function ellDots(g, cx, cy, rx, ry, n, w, ph) { for (var i = 0; i < n; i++) { var a = i / n * 6.2832 + (ph || 0); g.fillRect(Math.round(cx + Math.cos(a) * rx - w / 2), Math.round(cy + Math.sin(a) * ry - w / 2), w, w); } }
function discRows(g, cx, cy, rx, ry) { ry = Math.max(1, Math.round(ry)); for (var y = -ry; y <= ry; y++) { var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5)))); if (w > 0) g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1); } }
// 방패 (보병의 얼굴): kite = 아래가 뾰족한 방패 · tower = 네모난 큰 방패. s = 배율 (1 = 7×11 픽셀)
var KITE = [5, 7, 7, 7, 7, 7, 5, 5, 3, 3, 1], TOWER = [5, 7, 7, 7, 7, 7, 7, 7, 7, 5];
function drawShield(g, x, y, s, c, c2, tower, edge) {
  var R = tower ? TOWER : KITE, n = R.length, i, w, top = Math.round(y - n * s / 2), a0 = g.globalAlpha;
  x = Math.round(x);
  g.fillStyle = edge || '#1b1626';
  for (i = 0; i < n; i++) { w = R[i] * s; g.fillRect(x - w / 2 - 1, top + i * s - (i === 0 ? 1 : 0), w + 2, s + (i === 0 || i === n - 1 ? 1 : 0)); }
  g.fillStyle = c;
  for (i = 0; i < n; i++) { w = R[i] * s; g.fillRect(x - w / 2, top + i * s, w, s); }
  g.fillStyle = c2 || '#ffffff';
  g.fillRect(x - s / 2, top + s, s, (n - 3) * s); g.fillRect(x - 2.5 * s, top + 3 * s, 5 * s, s);      // 십자 띠
  g.globalAlpha = a0 * 0.55; g.fillStyle = '#ffffff'; g.fillRect(x - R[1] * s / 2, top + s, s, (tower ? 7 : 4) * s); g.globalAlpha = a0;      // 왼쪽 빛
}
X.drawShield = drawShield;
// 룬 글자 (법사의 얼굴): 3×3 무늬 넷
var RUNE = [[1, 1, 1, 0, 1, 0, 1, 0, 1], [1, 0, 1, 1, 1, 1, 0, 1, 0], [0, 1, 0, 1, 0, 1, 1, 1, 1], [1, 1, 0, 0, 1, 1, 1, 0, 1]];
function drawRune(g, x, y, k, s) { var R = RUNE[(k | 0) % 4], i; s = s || 1; x = Math.round(x); y = Math.round(y); for (i = 0; i < 9; i++) if (R[i]) g.fillRect(x + ((i % 3) - 1) * s - (s >> 1), y + (((i / 3) | 0) - 1) * s - (s >> 1), s, s); }
// 갈라진 금: 가운데에서 n 갈래, 갈래마다 세 마디 (만들 때 한 번만 셈한다)
function mkCrack(r, n, sd) {
  var out = [], xs = [], ys = [], as = [], i, k, len, nx, ny;
  for (i = 0; i < n; i++) { xs.push(0); ys.push(0); as.push(i / n * 6.2832 + hs(i, sd) * 0.8); }
  for (k = 0; k < 3; k++) for (i = 0; i < n; i++) {
    len = r / 3 * (0.65 + hs(i * 7 + k, sd) * 0.7); as[i] += (hs(i * 13 + k, sd) - 0.5) * 1.0;
    nx = xs[i] + Math.cos(as[i]) * len; ny = ys[i] + Math.sin(as[i]) * len * 0.5; out.push(xs[i], ys[i], nx, ny); xs[i] = nx; ys[i] = ny;
  }
  return out;
}
// 번개 줄기: 두 점 사이를 n 마디로 꺾는다 (픽셀 좌표의 납작한 배열)
function mkZap(x0, y0, x1, y1, jit, n) {
  var out = [x0, y0], dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1, px = -dy / L, py = dx / L, i, q, j;
  n = n || Math.max(3, Math.min(8, Math.round(L / 9)));
  for (i = 1; i < n; i++) { q = i / n; j = (i % 2 ? 1 : -1) * jit * (0.4 + Math.random() * 0.8); out.push(x0 + dx * q + px * j, y0 + dy * q + py * j); }
  out.push(x1, y1); return out;
}
X.mkZap = mkZap;

// ───────── 기술 하나의 연출 맥락 (c) ─────────
function Ctx(V, e, S, u, v, tier) {
  var B = X.BUDGET[tier] || X.BUDGET[1], T = e.tiles || [], i, sx = 0, sy = 0, n = 0;
  this.V = V; this.e = e; this.S = S; this.u = u; this.v = v; this.id = e.sk; this.tier = tier; this.B = B; this.qid = e.qid || 0;
  this.lite = !!V.lite; this.calm = !!V.calmN; this.pk = this.lite && !(V.fxK < 1) ? 0.5 : 1;      // 가볍게: 알갱이 절반 (설정의 「가볍게」는 V.burst 가 이미 줄인다)
  this.pn = 0; this.sn = 0; this.dn = 0; this.gn = 0; this.t0 = V.gclk || 0; this.i = 0; this.ids = null;
  this.ux = v ? v.x : e.from ? e.from[0] : 0; this.uy = v ? v.y : e.from ? e.from[1] : 0;
  this.ally = !!u && u.side === 'ally'; this.on = !!u && V.onScreen(this.ux, this.uy);
  this.mine = this.ally && u.role === 'cmd';
  this.setTiles(T);
}
var CP = Ctx.prototype;
CP.setTiles = function (T) {
  var i, sx = 0, sy = 0, n = T ? T.length : 0, dx, dy, d;
  this.tiles = T || [];
  for (i = 0; i < n; i++) { sx += T[i][0]; sy += T[i][1]; }
  this.cx = n ? sx / n : this.ux; this.cy = n ? sy / n : this.uy;
  dx = this.cx - this.ux; dy = this.cy - this.uy; d = Math.sqrt(dx * dx + dy * dy);
  if (d < 0.01) { dx = this.u && this.u.face < 0 ? -1 : 1; dy = 0; d = 1; this.dist = 0; } else this.dist = d;
  this.dx = dx / d; this.dy = dy / d; this.ang = Math.atan2(dy, dx);
  return this;
};
// 안무: t 초 뒤에 (게임 시계 — 멈추면 같이 멈추고 배속을 따른다). t 는 그 단계의 dur + 여운까지
CP.at = function (t, fn) {
  var V = this.V; t = Math.min(t, this.B.dur * 2 + 1);
  if (t <= 0) { try { fn(this); } catch (x) { skErr(x, this.id); } return this; }
  if (V.skq.length < X.CAP.q) V.skq.push({ T: (V.gclk || 0) + t, fn: fn, c: this }); else X.stat.over++;
  return this;
};
CP.ok = function () { if (this.sn >= this.B.shapes) { X.stat.over++; return false; } this.sn++; return true; };
CP.vis = function (x, y) { return this.V.onScreen(x, y); };
CP.burst = function (x, y, cols, n, o) {
  if (!this.V.onScreen(x, y)) return this;
  n = Math.min(Math.ceil(n * this.pk), this.B.parts - this.pn); if (n <= 0) return this;
  this.pn += n; this.V.burst(x, y, cols, n, o); return this;
};
// 한쪽으로 튀는 알갱이: ang 쪽으로 ±spread (부서진 조각 · 부채꼴 불티). 나머지는 V.burst 와 같다
CP.spray = function (x, y, cols, n, ang, spread, o) {
  var V = this.V, pool, p, i, a, sp; o = o || {};
  if (!V.onScreen(x, y)) return this;
  n = Math.min(Math.ceil(n * this.pk * (V.fxK < 1 ? V.fxK : 1)), this.B.parts - this.pn, 240 - V.parts.length); if (n <= 0) return this;
  this.pn += n; pool = V.pfree || (V.pfree = []);
  for (i = 0; i < n; i++) {
    a = ang + (Math.random() - 0.5) * 2 * spread; sp = (o.spd || 40) * (0.5 + Math.random() * 0.8); p = pool.length ? pool.pop() : {};
    p.x = x * 16 + 8 + (Math.random() - 0.5) * (o.spread || 6); p.y = y * 16 + 8 + (Math.random() - 0.5) * (o.spread || 6);
    p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp * 0.8 - (o.up || 0); p.g = o.grav == null ? 30 : o.grav;
    p.life = (o.life || 0.45) * (0.6 + Math.random() * 0.6); p.t = 0; p.c = cols[i % cols.length]; p.s = o.size || (Math.random() < 0.4 ? 2 : 1);
    V.parts.push(p);
  }
  return this;
};
CP.ring = function (x, y, r, col, o) {
  var V = this.V; o = o || {};
  if (!V.onScreen(x, y) || V.rings.length >= X.CAP.rings || !this.ok()) return this;
  V.rings.push({ x: x, y: y, t: -(o.d || 0), dur: o.dur || 0.4, c: col, r: r, w: o.w || 1, inv: !!o.inv, rise: !!o.rise }); return this;
};
CP.shape = function (o) { if (this.V.onScreen(o.x, o.y) && this.ok()) this.V.shape(o); return this; };      // view.js 의 옛 모양 (slash · thrust · impact · bolt · pillar · flame · sigil · soul)
CP.line = function (x0, y0, x1, y1, col, o) {
  var V = this.V; o = o || {};
  if (V.lines.length >= X.CAP.lines || !(V.onScreen(x0, y0) || V.onScreen(x1, y1)) || !this.ok()) return this;
  V.lines.push({ x0: x0 * 16 + 8, y0: y0 * 16 + 6, x1: x1 * 16 + 8, y1: y1 * 16 + 6, c: col, life: o.dur || 0.2, t: 0, w: o.w || 1, zig: !!o.zig }); return this;
};
var DECAL = { stain: 1, crack: 1 }, LAYER = { sigil: 0, shock: 0, crack: 0, stain: 0, shadow: 0, ghost: 0, streak: 2 };
// 새 그림 조각 하나 (아래 「그림 조각」 표). 돌려주는 것: 그 조각(없으면 null — 화면 밖 · 예산 · 상한)
CP.fx = function (k, o) {
  var V = this.V; o = o || {}; o.k = k;
  if (DECAL[k]) { if (this.dn >= (this.lite ? Math.min(1, this.B.decal) : this.B.decal)) return null; }
  if (o.x != null && !V.onScreen(o.x, o.y) && !(o.x1 != null && V.onScreen(o.x1, o.y1))) return null;
  if (o.x == null && o.x0 != null && !V.onScreen(o.x0, o.y0) && !V.onScreen(o.x1, o.y1)) return null;
  if (V.skfx.length >= X.CAP.fx) { X.stat.over++; return null; }
  if (!this.ok()) return null;
  if (DECAL[k]) this.dn++;
  o.t = -(o.d || 0); o.dur = o.dur || 0.4; o.L = o.L != null ? o.L : (LAYER[k] != null ? LAYER[k] : X.KINDS[k] && X.KINDS[k].L != null ? X.KINDS[k].L : 1); o.sd = o.sd != null ? o.sd : (V.skfx.length * 7 + (o.x || 0) * 3 + (o.y || 0)) % 97;
  if (k === 'crack') o.seg = mkCrack(o.r || 14, o.n || 5, o.sd);
  if (k === 'zap' && !o.pts) { o.pts = mkZap(o.x0 * 16 + 8, o.y0 * 16 + 6 - (o.h0 || 0), o.x1 * 16 + 8, o.y1 * 16 + 6 - (o.h1 || 0), o.jit == null ? 4 : o.jit, o.segs); if (o.fork && !this.lite) { var m = (o.pts.length >> 2) << 1; o.fk = mkZap(o.pts[m], o.pts[m + 1], o.pts[m] + (Math.random() - 0.5) * 22, o.pts[m + 1] + 8 + Math.random() * 10, 3, 3); } }
  if (k === 'zap' && this.calm) o.nf = 1;      // 움직임 줄이기: 깜빡이지 않는 번개
  if (k === 'emit') { var tot = Math.ceil((o.rate || 8) * o.dur) * (o.n || 1); tot = Math.min(tot, this.B.parts - this.pn); if (tot <= 0) { this.sn--; return null; } this.pn += tot; o.left = Math.ceil(tot * this.pk); o.acc = 0; }
  if (o.c2 == null && (k === 'cloud')) o.c2 = '#5a5478';
  V.skfx.push(o); return o;
};
CP.light = function (x, y, r, col, a, life) { if (this.V.onScreen(x, y)) this.V.light(x * 16 + 8, y * 16 + 6, Math.min(r, this.B.light[0]), col, Math.min(a, this.B.light[1]), life || 0.4); return this; };
// 화면이 함께 움직인다 — 모두 그 단계의 값까지. 움직임 줄이기(calm)면 흔들림 · 멈칫 · 줄기는 없고 번쩍임 · 물듦은 절반
CP.shake = function (a) { a = Math.min(a, this.B.shake); if (a > 0 && this.on && !this.calm) this.V.shake = Math.max(this.V.shake, a); return this; };
CP.stop = function (s) { s = Math.min(s, this.B.stop); if (s > 0 && this.on && this.mine && !this.calm) this.V.hitStop(s); return this; };
CP.flash = function (col, a) { a = Math.min(a, this.B.flash) * (this.calm ? 0.5 : 1); if (a > 0 && this.on) { this.V.flashA = Math.max(this.V.flashA || 0, a); this.V.flashC = col; } return this; };
CP.wash = function (col, a, dur) { a = Math.min(a, this.B.wash) * (this.calm ? 0.5 : 1); if (a > 0 && this.on) this.V.skWash = { c: col, a: a, t: 0, dur: dur || 0.8 }; return this; };
CP.dim = function (dur) { if (this.B.dim && this.v && this.on && this.mine) this.V.ultDim = { t: 0, dur: this.calm ? Math.min(0.4, dur || 0.65) : (dur || 0.65), id: this.u.id }; return this; };
CP.streak = function (n, ang, col, dur, al) { n = Math.min(n, this.B.streak); if (n > 0 && this.on && !this.calm && !this.lite) this.fx('streak', { n: n, a: ang, c: col, dur: dur || 0.5, al: al || 0.3 }); return this; };
// 쓰는 이의 몸짓: back 뒤로 당겼다 내지른다 · hop 뛰어올랐다 내려찍는다 · sink 몸을 낮춘다 · rise 떠오른다 · shake 떤다 · spin 제자리에서 돈다. amp = 픽셀
CP.pose = function (k, dur, amp, dx, dy) {
  var v = this.v; if (!v || (this.calm && (k === 'shake' || k === 'spin'))) return this;
  if (!v.skp) this.V.skPoses.push(v);
  v.skp = { k: k, t: 0, dur: dur || 0.3, amp: amp == null ? 3 : amp, dx: dx == null ? this.dx : dx, dy: dy == null ? this.dy : dy, ox: 0, oy: 0 };
  return this;
};
// 옛 몸짓 둘도 그대로 쓴다: lunge = 대상 쪽으로 내지르는 몸(공격 자세 그림) · castPose = 발밑의 작은 마법진과 시전 자세 그림
CP.lunge = function (dx, dy) { if (this.v) this.v.lunge = { dx: dx == null ? this.dx : dx, dy: dy == null ? this.dy : dy, t: 0 }; return this; };
CP.castPose = function (col) { if (this.v) this.v.cast = { t: 0, c: col || '#ffffff' }; return this; };
// 쓰는 이의 잔상 (제 그림을 한 빛깔로): 지금 자리에서 (dx, dy)칸 비켜서
CP.ghost = function (dx, dy, tint, dur, a) {
  var V = this.V, v = this.v, u = this.u, sp, cv, w;
  if (!v || this.gn >= this.B.ghost || this.lite || (u.fw || 1) > 1 || !DS.spriteCanvas) return this;
  try { sp = DS.unitSprite(u); cv = DS.spriteCanvas(v.dn || sp[0], sp[1], { flip: u.face < 0, tint: tint || null, hd: 1 }); } catch (x) { return this; }
  w = cv.lw || cv.width / 2;
  if (this.fx('ghost', { cv: cv, px: Math.round((v.x + (dx || 0)) * 16 + (16 - w) / 2), py: Math.round((v.y + (dy || 0)) * 16 - 2 + (16 - w)), w: w, x: v.x, y: v.y, dur: dur || 0.3, a: a || 0.5 })) this.gn++;
  return this;
};
CP.sfx = function (name, arg) { if (this.on || this.V.onScreen(this.cx, this.cy)) this.V.sfx(name, arg); return this; };
// 단계에 맞춰 겹을 얹은 소리 (audio.js DS.Audio.sk): 같은 소리라도 윗단계일수록 크고 두껍다
CP.boom = function (name) { var V = this.V; if (!(this.on || V.onScreen(this.cx, this.cy))) return this; if (V.sfxT[name] && V.time - V.sfxT[name] < 0.07) return this; V.sfxT[name] = V.time; if (DS.Audio && DS.Audio.sk) DS.Audio.sk(name, this.B.snd); return this; };
CP.float = function (x, y, text, col, o) { if (this.V.onScreen(x, y)) this.V.float(x, y, text, col, o); return this; };
// 맞는 칸마다 (화면 안 · max 칸까지). fn(x, y, 차례, 가운데에서의 거리)
CP.each = function (fn, max) {
  var T = this.tiles, n = 0, i, d;
  for (i = 0; i < T.length && n < (max || 13); i++) { if (!this.V.onScreen(T[i][0], T[i][1])) continue; d = Math.abs(T[i][0] - this.cx) + Math.abs(T[i][1] - this.cy); fn.call(this, T[i][0], T[i][1], n++, d); }
  return this;
};
// 이 박자에 맞은 이들 (화면의 자리). fn(x, y, 차례, 유닛)
CP.hits = function (fn, max) {
  var ids = this.ids || [], n = 0, i, w;
  for (i = 0; i < ids.length && n < (max || 8); i++) { w = this.V.vu[ids[i]]; if (!w || !this.V.onScreen(w.x, w.y)) continue; fn.call(this, w.x, w.y, n++, w.u); }
  return this;
};
// 그 칸들 위에 선 이들: ally = true 면 쓰는 이의 편, false 면 맞은편. fn(x, y, 차례, 유닛)
CP.who = function (ally, fn, max) {
  var V = this.V, T = this.tiles, set = {}, i, id, w, n = 0, me = this.u ? this.u.side : 'ally';
  for (i = 0; i < T.length; i++) set[T[i][0] + ',' + T[i][1]] = 1;
  for (id in V.vu) { w = V.vu[id]; if (n >= (max || 8)) break; if (w.dying >= 0 || !w.u || w.u.dead || (w.u.side === me) !== !!ally || w.u.side === 'neutral') continue; if (!set[w.u.x + ',' + w.u.y] || !V.onScreen(w.x, w.y)) continue; fn.call(this, w.x, w.y, n++, w.u); }
  return this;
};
// (x, y) 둘레 r 칸 안의 맞은편. fn(x, y, 차례, 유닛)
CP.near = function (x, y, r, fn, max) {
  var V = this.V, id, w, n = 0, me = this.u ? this.u.side : 'ally';
  for (id in V.vu) { w = V.vu[id]; if (n >= (max || 6)) break; if (w.dying >= 0 || !w.u || w.u.dead || w.u.side === me || w.u.side === 'neutral') continue; if (Math.abs(w.u.x - x) + Math.abs(w.u.y - y) > r || !V.onScreen(w.x, w.y)) continue; fn.call(this, w.x, w.y, n++, w.u); }
  return this;
};
CP.pos = function (id) { var w = this.V.vu[id]; return w ? [w.x, w.y] : null; };
CP.rnd = function (a) { return (Math.random() - 0.5) * 2 * (a || 1); };
X.Ctx = Ctx;
function skErr(x, id) { X.stat.err++; X.lastErr = id + ': ' + (x && x.message); if (DS.loopErr) DS.loopErr(x, 'skfx:' + id); else if (typeof console !== 'undefined') console.error('skfx ' + id, x); }

// ───────── 화면(View)에 얹는 것 ─────────
VP.skReset = function () { this.skfx = []; this.skq = []; this.skSeq = {}; this.skZone = {}; this.skLast = {}; this.skPoses = []; this.skWash = null; this.gclk = null; this.gdt = 0; };
// 게임 시계: 엔진 시간 + 아직 틱이 안 된 몫 — 멈춤 · 배속 · 느려짐을 그대로 따른다 (프레임마다 사건을 받기 전에 한 번)
VP.skClock = function () {
  var s = this.sim, g = s ? s.t + (s.acc || 0) : 0;
  if (!this.skfx) this.skReset();
  if (this.gclk == null || g < this.gclk - 0.2) { this.gdt = 0; this.gclk = g; return; }
  if (g > this.gclk) { this.gdt = Math.min(0.25, g - this.gclk); this.gclk = g; } else this.gdt = 0;
};
// 'skill' 사건: 제 연출이 있으면 그것으로 (true). 한순간에 풀리는 기술은 cast 뒤에 곧바로 beat(0).
VP.skSkill = function (e, v, u) {
  var F = DS.SKFX[e.sk], S = DS.SKILLS[e.sk], c;
  if (!F || !S || !u) return false;
  c = new Ctx(this, e, S, u, v, X.tierOf(e.sk));
  if (e.qid) this.skSeq[e.qid] = c;
  this.skLast[e.id] = c; c.cn = 0;
  X.stat.runs[e.sk] = (X.stat.runs[e.sk] || 0) + 1;
  try {
    if (F.cast) F.cast(c);
    if (!e.qid && F.beat) { var ids = []; c.who(S.side === 'ally' || S.tg === 'ally', function (x, y, k, w) { ids.push(w.id); }, 12); c.ids = ids; F.beat(c, 0, true); }
  } catch (x) { skErr(x, e.sk); }
  return true;
};
// 연쇄(chain) 사건: 그 사람이 방금 건 기술에 chain 연출이 있으면 그것으로 (true). F.chain(c, a, b, 차례) — a · b = [x, y] 화면 자리
VP.skChain = function (e) {
  var c = this.skLast && this.skLast[e.id], F = c && DS.SKFX[c.id], a = this.vu[e.a], b = this.vu[e.b];
  if (!c || !F || !F.chain || !a || !b || (this.gclk || 0) - c.t0 > 0.6) return false;
  try { F.chain(c, [a.x, a.y], [b.x, b.y], c.cn++); } catch (x) { skErr(x, c.id); }
  return true;
};
// 그 밖의 사건: mark(예고) · beat(박자) · seqEnd · zone · zoneTick · zoneEnd
VP.skEv = function (e, v, u) {
  var c, F, S, Z;
  if (!this.skfx) this.skReset();
  switch (e.t) {
    case 'mark':
      this.tele['q' + e.qid] = { tiles: e.tiles, dur: e.dur, t: 0, side: e.side };      // 예고 칸은 옛 약속 그대로 (적 = 붉게 · 우리 = 푸르게)
      c = this.skSeq[e.qid]; F = DS.SKFX[e.sk];
      if (c && F && F.mark) { try { F.mark(c, e); } catch (x) { skErr(x, e.sk); } }
      if (e.side === 'enemy' || !c) this.sfx('warn');
      break;
    case 'beat':
      if (e.i === 0) delete this.tele['q' + e.qid];
      c = this.skSeq[e.qid]; F = DS.SKFX[e.sk]; S = DS.SKILLS[e.sk];
      if (c && F) { c.t0 = this.gclk || 0; c.i = e.i; c.ids = e.ids; c.cn = 0; if (c.v) { c.ux = c.v.x; c.uy = c.v.y; } c.setTiles(e.tiles); if (F.beat) { try { F.beat(c, e.i, e.last); } catch (x) { skErr(x, e.sk); } } }
      else if (S && (e.i > 0 || S.fall)) { this.fx(S.fx, e.tiles, e.from); if (S.grand) this.grandFx(e.tiles, e.from, S); }      // 제 연출이 없는 여러 박자 기술: 박자마다 공용 연출
      break;
    case 'seqEnd':
      delete this.tele['q' + e.qid]; c = this.skSeq[e.qid]; F = DS.SKFX[e.sk];
      if (c && e.cancel && F && F.cancel) { try { F.cancel(c); } catch (x) { skErr(x, e.sk); } }
      delete this.skSeq[e.qid];
      break;
    case 'zone':
      S = DS.SKILLS[e.sk]; F = DS.SKFX[e.sk]; if (!S) break;
      c = new Ctx(this, e, S, u, v, X.tierOf(e.sk)); c.B = X.BUDGET[1];      // 자리: 깔릴 때 T1 예산 · 맥박마다 T2 까지 · 다할 때 T3 까지 (기술 단계가 낮으면 그 단계)
      this.skZone[e.zid] = { c: c, k: e.k, pulse: 0, edge: null };
      if (F && F.zone) { try { F.zone(c, e); } catch (x) { skErr(x, e.sk); } }
      break;
    case 'zoneTick':
      Z = this.skZone[e.zid]; if (!Z) break;
      Z.pulse = 1; c = Z.c; if (!c) break; c.B = X.BUDGET[Math.min(2, c.tier)]; c.pn = 0; c.sn = 0; c.dn = 0; c.ids = e.ids; c.i = e.n; c.t0 = this.gclk || 0; F = DS.SKFX[c.id];
      if (F && F.zoneTick) { try { F.zoneTick(c, e); } catch (x) { skErr(x, c.id); } }
      break;
    case 'zoneEnd':
      Z = this.skZone[e.zid]; if (!Z) break;
      c = Z.c; if (!c) { delete this.skZone[e.zid]; break; } c.B = X.BUDGET[Math.min(3, c.tier)]; c.pn = 0; c.sn = 0; c.dn = 0; F = DS.SKFX[c.id];
      if (F && F.zoneEnd && !e.cancel) { try { F.zoneEnd(c, e); } catch (x) { skErr(x, c.id); } }
      delete this.skZone[e.zid];
      break;
  }
};
// 한 프레임: 때가 된 안무를 부르고, 그림 조각 · 몸짓의 시간을 민다 (게임 시계의 dt — 멈칫(hit-stop) · 시험용 멈춤 동안은 0)
VP.skFrame = function (fdt) {
  var q = this.skq, i, n = 0, it, now = this.gclk || 0, d = fdt > 0 ? this.gdt : 0, L = this.skfx, p, st = X.stat, v, s, f, k;
  if (!L) { this.skReset(); return; }
  if (this.sim && this.sim.result && !this.skOver) { this.skOver = true; for (k in this.tele) if (k.charAt(0) === 'q') delete this.tele[k]; } else if (this.sim && !this.sim.result) this.skOver = false;      // 판이 끝나면 남은 예고 표시를 지운다 (연무장은 끝난 뒤 틱이 돌지 않는다)
  for (i = 0; i < q.length; i++) { it = q[i]; if (it.T <= now + 1e-6) { try { it.fn(it.c); } catch (x) { skErr(x, it.c.id); } } else q[n++] = it; }
  q.length = n;
  n = 0;
  for (i = 0; i < L.length; i++) {
    p = L[i]; p.t += d;
    if (p.t >= p.dur) { if (p.end) { try { p.end.call(this, p); } catch (x) { skErr(x, 'end:' + p.k); } } continue; }
    if (p.k === 'emit' && p.t > 0 && p.left > 0) { p.acc += d * (p.rate || 8); while (p.acc >= 1 && p.left > 0) { p.acc -= 1; k = Math.min(p.left, p.n || 1); p.left -= k; this.burst(p.x + (Math.random() - 0.5) * (p.sp || 0), p.y + (Math.random() - 0.5) * (p.sp || 0) * 0.6, p.cols, k, p.o); } }
    L[n++] = p;
  }
  L.length = n;
  if (this.skWash) { this.skWash.t += d; if (this.skWash.t >= this.skWash.dur) this.skWash = null; }
  n = 0;
  for (i = 0; i < this.skPoses.length; i++) {
    v = this.skPoses[i]; s = v.skp; if (!s) continue;
    s.t += d; f = s.t / s.dur;
    if (f >= 1 || v.dying >= 0) { v.skp = null; continue; }
    s.ox = 0; s.oy = 0;
    switch (s.k) {
      case 'back': k = f < 0.55 ? -Math.sin(f / 0.55 * 1.5708) : f < 0.7 ? -1 + (f - 0.55) / 0.15 * 2.3 : 1.3 * (1 - (f - 0.7) / 0.3); s.ox = s.dx * k * s.amp; s.oy = s.dy * k * s.amp; break;
      case 'hop': s.oy = -s.amp * 4 * f * (1 - f) * (f < 0.6 ? 1 : 1.2); s.ox = s.dx * Math.sin(f * 3.1416) * 1.5; break;
      case 'sink': s.oy = Math.sin(f * 3.1416) * s.amp * 0.5; break;
      case 'rise': s.oy = -s.amp * env(f, 0.25, 0.25); break;
      case 'shake': s.ox = Math.sin(s.t * 70) * s.amp * (1 - f); break;
      case 'spin': s.ox = Math.cos(f * 12.566) * s.amp * (1 - f * 0.5); s.oy = Math.sin(f * 12.566) * s.amp * 0.4; break;
    }
    this.skPoses[n++] = v;
  }
  this.skPoses.length = n;
  if (L.length > st.fx) st.fx = L.length; if (this.parts.length > st.parts) st.parts = this.parts.length; if (this.shapes.length > st.shapes) st.shapes = this.shapes.length;
  if (this.rings.length > st.rings) st.rings = this.rings.length; if (this.lines.length > st.lines) st.lines = this.lines.length; if (q.length > st.q) st.q = q.length;
};

// ── 남는 자리 (엔진의 sim.zn 을 그대로 읽는다 — 땅의 위험과 같은 약속: 옅은 채움 · 가장자리 · 오르는 알갱이) ──
var ZC = { fire: ['255,120,40', '#ffd75e', '#ff6a2a'], frost: ['150,215,255', '#ffffff', '#9fe8ec'], storm: ['196,180,255', '#ffffff', '#c9a8ff'], ward: ['120,180,255', '#ffffff', '#9fd0ff'],
  wall: ['150,190,240', '#ffffff', '#cfe3ff'], gold: ['255,220,120', '#fff6d0', '#f6cf57'], poison: ['120,200,60', '#d6ff8a', '#7ab83a'], dark: ['140,80,200', '#e0c8ff', '#7446ad'], water: ['110,176,230', '#d6fbff', '#6fb0e6'], wind: ['220,235,240', '#ffffff', '#cdd5e3'] };
X.ZC = ZC;
VP.skZones = function (g) {
  var zn = this.sim && this.sim.zn, t = this.time, i, k, Z, C, VZ, a, T, q, px, py, e, set, j, lite = this.lite, ph;
  if (!zn || !zn.length) return;
  for (i = 0; i < zn.length; i++) {
    Z = zn[i]; C = ZC[Z.k] || ZC.fire; VZ = this.skZone[Z.id] || (this.skZone[Z.id] = { c: null, k: Z.k, pulse: 0, edge: null }); T = Z.tiles;
    a = Math.max(0, Math.min(1, Z.el / 0.3, (Z.dur - Z.el) / 0.5));
    if (!VZ.edge) { set = {}; VZ.edge = []; for (k = 0; k < T.length; k++) set[T[k][0] + ',' + T[k][1]] = 1; for (k = 0; k < T.length; k++) { q = T[k]; VZ.edge.push((set[q[0] + ',' + (q[1] - 1)] ? 0 : 1) | (set[q[0] + ',' + (q[1] + 1)] ? 0 : 2) | (set[(q[0] - 1) + ',' + q[1]] ? 0 : 4) | (set[(q[0] + 1) + ',' + q[1]] ? 0 : 8)); } }
    if (VZ.pulse > 0) VZ.pulse = Math.max(0, VZ.pulse - (this.gdt || 0) * 3);
    for (k = 0; k < T.length; k++) {
      q = T[k]; if (!this.onScreen(q[0], q[1])) continue;
      px = q[0] * 16; py = q[1] * 16; e = VZ.edge[k];
      g.fillStyle = 'rgba(' + C[0] + ',' + ((0.1 + 0.04 * Math.sin(t * 3 + q[0] + q[1]) + 0.14 * VZ.pulse) * a).toFixed(3) + ')'; g.fillRect(px, py, 16, 16);
      if (e) { g.fillStyle = 'rgba(' + (Z.side === 'enemy' && Z.to !== 'ally' ? '255,90,90' : C[0]) + ',' + (0.55 * a).toFixed(3) + ')'; if (e & 1) g.fillRect(px, py, 16, 1); if (e & 2) g.fillRect(px, py + 15, 16, 1); if (e & 4) g.fillRect(px, py, 1, 16); if (e & 8) g.fillRect(px + 15, py, 1, 16); }
      if (lite) continue;
      for (j = 0; j < 2; j++) { ph = (t * (Z.k === 'frost' ? 0.5 : 1.1) + j * 0.5 + (q[0] * 7 + q[1] * 3) * 0.13) % 1; g.globalAlpha = a * (1 - ph) * 0.9; g.fillStyle = j ? C[1] : C[2]; g.fillRect(px + 3 + ((j * 5 + q[0] * 3 + q[1]) % 10), py + 13 - ph * (Z.k === 'frost' ? 5 : 10), 1, 1); }
      g.globalAlpha = 1;
    }
  }
};

// ───────── 그림 조각 (c.fx(kind, {…})) ─────────
//   자리는 칸 좌표(x, y — 소수 가능, 칸 한가운데가 기준), 크기는 픽셀. d = 늦게 시작(초), dur = 길이(초), end = 다 되었을 때 부를 함수.
//   땅(유닛 밑): sigil 마법진 · shock 충격 고리 · crack 갈라진 금 · stain 땅 자국 · shadow 떨어지는 것의 그림자 · ghost 잔상
//   공중(유닛 위): beam 빛줄기 · zap 번개 · orb 날아가는 것 · drop 떨어지는 것 · cone 부채꼴 · arc 큰 호 · shield 방패 · spike 솟는 가시 · column 기둥 · dome 둥근 지붕
//                  cloud 구름 · book 펼친 책 · gate 부서지는 문 · star 반짝임 · rune 룬 글자 · emit 알갱이를 이어 내는 자리
//   화면: streak 화면을 가르는 줄기 (c.streak) · 빛 물듦 (c.wash)
function drawSk(g, p, f, time, V) {
  var cx = (p.x || 0) * 16 + 8 + (p.ox || 0), cy = (p.y || 0) * 16 + 8 + (p.oy || 0), a, r, n, j, i, w, x, y, q, k, h;
  switch (p.k) {
    case 'sigil':      // r 반지름 · c 빛깔 · c2 룬 빛깔 · sides 안의 별(0 없음) · skip 별 꼭짓점 건너뛰기 · spin 도는 빠르기
      r = (p.r || 16) * (0.5 + 0.5 * Math.min(1, f * 5)); a = env(f, 0.12, 0.3); n = Math.max(16, Math.round(r * 1.5)); q = time * (p.spin || 1.2); w = r >= 13 ? 2 : 1;
      g.globalAlpha = a * 0.35; g.fillStyle = '#1b1626'; ellDots(g, cx, cy + 6, r, r * 0.5, n, w, q);      // 밝은 땅에서도 읽히게 어두운 밑점
      g.globalAlpha = a * 0.95; g.fillStyle = p.c;
      ellDots(g, cx, cy + 5, r, r * 0.5, n, w, q); ellDots(g, cx, cy + 5, r * 0.72, r * 0.36, Math.round(n * 0.6), 1, -q * 1.4);
      if (p.sides && pxLine) { g.globalAlpha = a * 0.6; for (j = 0; j < p.sides; j++) { k = j / p.sides * 6.2832 + q * 0.5; h = (j + (p.skip || 1)) / p.sides * 6.2832 + q * 0.5; pxLine(g, cx + Math.cos(k) * r * 0.72, cy + 5 + Math.sin(k) * r * 0.36, cx + Math.cos(h) * r * 0.72, cy + 5 + Math.sin(h) * r * 0.36, 1); } }
      g.globalAlpha = a; g.fillStyle = p.c2 || '#ffffff'; n = p.runes == null ? (p.sides || 4) : p.runes;
      for (j = 0; j < n; j++) { k = j / n * 6.2832 + q * 0.5; g.fillRect(Math.round(cx + Math.cos(k) * r * 0.86) - 1, Math.round(cy + 5 + Math.sin(k) * r * 0.43) - 1, 2, 2); }
      break;
    case 'shock':      // r0 → r 로 퍼지는 고리 · w 굵기 · dust 먼지 빛깔
      r = (p.r0 || 2) + ((p.r || 20) - (p.r0 || 2)) * ease(f); a = 1 - f * f; n = Math.max(16, Math.round(r * 1.6));
      if (!p.thin) { g.globalAlpha = a * 0.16; g.fillStyle = p.c; discRows(g, cx, cy + 5, r, r * 0.5); }      // 고리 안의 옅은 빛 (밝은 땅에서도 충격파가 읽힌다)
      g.globalAlpha = a * 0.4; g.fillStyle = '#1b1626'; ellDots(g, cx, cy + 6, r + 1, (r + 1) * 0.5, n, p.w || 2, 0.2);
      g.globalAlpha = a; g.fillStyle = p.c; ellDots(g, cx, cy + 5, r, r * 0.5, n, p.w || 2, 0.2);
      g.globalAlpha = a * 0.7; g.fillStyle = p.c2 || '#ffffff'; if (r > 5) ellDots(g, cx, cy + 5, r - 2.5, (r - 2.5) * 0.5, Math.round(n * 0.6), 1, 0.5);
      if (p.dust) { g.fillStyle = p.dust; for (j = 0; j < 10; j++) { k = hs(j, p.sd) * 6.2832; q = r - hs(j + 9, p.sd) * 4; g.globalAlpha = a * 0.8; g.fillRect(Math.round(cx + Math.cos(k) * q), Math.round(cy + 5 + Math.sin(k) * q * 0.5 - f * 5 * hs(j + 3, p.sd)), j % 3 ? 1 : 2, j % 3 ? 1 : 2); } }
      break;
    case 'crack':      // r 길이 · n 갈래 · c 달아오른 빛(없으면 검은 금만)
      if (!pxLine) break;
      n = p.seg.length >> 2; k = Math.ceil(n * Math.min(1, f * 6)); a = f < 0.75 ? 1 : (1 - f) / 0.25;
      if (p.c && f < 0.5) { g.globalAlpha = a * (1 - f * 2); g.fillStyle = p.c; for (j = 0; j < k; j++) pxLine(g, cx + p.seg[j * 4], cy + 6 + p.seg[j * 4 + 1], cx + p.seg[j * 4 + 2], cy + 6 + p.seg[j * 4 + 3], 1); }
      g.globalAlpha = a * 0.85; g.fillStyle = '#1b1626'; h = n / 3; for (j = 0; j < k; j++) pxLine(g, cx + p.seg[j * 4], cy + 5 + p.seg[j * 4 + 1], cx + p.seg[j * 4 + 2], cy + 5 + p.seg[j * 4 + 3], j < h && (p.r || 14) >= 12 ? 2 : 1);
      break;
    case 'stain':      // r 반지름 · c 바탕 · a 세기 · c2 반짝이는 점 · n 점 수 · grow 번지며 커진다
      r = (p.r || 10) * (p.grow ? Math.min(1, 0.4 + f * 4) : 1); a = (p.a || 0.5) * env(f, 0.04, 0.4);
      g.globalAlpha = a; g.fillStyle = p.c; discRows(g, cx, cy + 5, r, r * 0.5);
      if (p.c2) { g.fillStyle = p.c2; n = p.n || 6; for (j = 0; j < n; j++) { if (Math.sin(time * 5 + j * 1.9 + p.sd) < 0.1) continue; k = hs(j, p.sd) * 6.2832; q = hs(j + 5, p.sd) * r * 0.9; g.globalAlpha = Math.min(1, a * 2); g.fillRect(Math.round(cx + Math.cos(k) * q), Math.round(cy + 5 + Math.sin(k) * q * 0.5), 1, 1); } }
      break;
    case 'shadow': g.globalAlpha = 0.08 + 0.3 * f; g.fillStyle = '#000000'; r = (p.r || 8) * (0.35 + 0.65 * f); discRows(g, cx, cy + 6, r, r * 0.42); break;
    case 'ghost': g.globalAlpha = (p.a || 0.5) * (1 - f); if (p.cv) g.drawImage(p.cv, p.px, p.py, p.w, p.w); break;
    case 'beam':      // (x0,y0)→(x1,y1) 칸 좌표 · w 굵기 · c 겉 · c2 속
      if (!pxLine) break;
      w = Math.max(1, Math.round((p.w || 3) * (1 - f * 0.8))); g.globalAlpha = f < 0.5 ? 1 : (1 - f) / 0.5; g.fillStyle = p.c;
      x = p.x0 * 16 + 8; y = p.y0 * 16 + 6; q = p.x1 * 16 + 8; k = p.y1 * 16 + 6;
      pxLine(g, x, y - (w >> 1), q, k - (w >> 1), w); if (w > 1) { g.fillStyle = p.c2 || '#ffffff'; pxLine(g, x, y - (w >> 1) + 1, q, k - (w >> 1) + 1, Math.max(1, w - 2)); }
      break;
    case 'zap':      // (x0,y0)→(x1,y1) 칸 좌표 · h0 · h1 그 끝의 높이(픽셀 — 하늘에서 치면 h0 = 60) · c 겉빛 · w 굵기 · jit 꺾임 · fork 곁가지
      if (!pxLine) break;
      g.globalAlpha = (f < 0.5 ? 1 : (1 - f) / 0.5) * (!p.nf && Math.floor(f * 8) % 3 === 1 ? 0.5 : 1);
      for (i = 0; i < 2; i++) { g.fillStyle = i ? '#ffffff' : p.c; w = i ? 1 : (p.w || 3); for (j = 2; j < p.pts.length; j += 2) pxLine(g, p.pts[j - 2] - (i ? 0 : 1), p.pts[j - 1], p.pts[j] - (i ? 0 : 1), p.pts[j + 1], w); if (p.fk) for (j = 2; j < p.fk.length; j += 2) pxLine(g, p.fk[j - 2], p.fk[j - 1], p.fk[j], p.fk[j + 1], 1); }
      break;
    case 'orb':      // (x,y)→(x1,y1) 칸 좌표로 날아간다 · h 포물선 높이 · head: ember · ice · shield · rune · star · s 크기 · tr 꼬리 수
      x = cx + ((p.x1 - p.x) * 16) * f; y = cy - 2 + ((p.y1 - p.y) * 16) * f - (p.h || 0) * 4 * f * (1 - f);
      n = p.tr == null ? 3 : p.tr;
      for (j = n; j >= 1; j--) { q = Math.max(0, f - j * 0.07); g.globalAlpha = 0.6 - j * 0.12; g.fillStyle = j % 2 ? p.c : (p.c2 || p.c); w = Math.max(1, (p.s || 3) - j); g.fillRect(Math.round(cx + ((p.x1 - p.x) * 16) * q - w / 2), Math.round(cy - 2 + ((p.y1 - p.y) * 16) * q - (p.h || 0) * 4 * q * (1 - q) - w / 2), w, w); }
      g.globalAlpha = 1; drawHead(g, p, x, y, (p.x1 - p.x), (p.y1 - p.y) - (p.h || 0) * 0.25 * (1 - 2 * f), time);
      break;
    case 'drop':      // (x,y) 칸으로 떨어진다 · h 처음 높이 · sx 처음에 옆으로 비낀 만큼 · head: meteor · star · ice · shield · rock · s 크기
      q = f * f; x = cx + (p.sx || 0) * (1 - q); y = cy + 4 - (p.h || 80) * (1 - q);
      n = p.tr == null ? 5 : p.tr; k = Math.sqrt((p.sx || 0) * (p.sx || 0) + (p.h || 80) * (p.h || 80)) || 1;
      for (j = n; j >= 1; j--) { g.globalAlpha = Math.min(1, f * 4) * (0.9 - j * 0.14); g.fillStyle = j > 2 ? (p.c2 || '#d9442b') : (p.c || '#ff9a3c'); w = Math.max(1, (p.s || 5) - 1 - (j >> 1)); g.fillRect(Math.round(x + (p.sx || 0) / k * j * 5 - w / 2), Math.round(y - (p.h || 80) / k * j * 5 - w / 2), w, w); }
      g.globalAlpha = Math.min(1, f * 4); drawHead(g, p, x, y, -(p.sx || 0), (p.h || 80), time);
      break;
    case 'cone':      // (x,y)에서 a 쪽으로 · spread 벌어짐(라디안의 절반) · len 길이
      for (k = 0; k < 4; k++) {
        q = f * 1.3 - k * 0.12; if (q <= 0 || q > 1) continue; r = (p.len || 30) * q; g.globalAlpha = (1 - q) * 0.9; g.fillStyle = k % 2 ? (p.c2 || '#ffffff') : p.c; n = Math.max(3, Math.round(r * p.spread * 0.6));
        for (j = 0; j <= n; j++) { a = p.a - p.spread + 2 * p.spread * j / n; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy - 1 + Math.sin(a) * r * 0.75), k ? 1 : 2, k ? 1 : 2); }
      }
      break;
    case 'arc':      // 가운데 (x,y) 둘레를 a0 에서 sw 만큼 휩쓰는 큰 호 · r 반지름 · w 굵기
      r = p.r || 16; q = Math.min(1, f * 1.5); k = f > 0.35 ? (f - 0.35) / 0.65 : 0; n = Math.max(8, Math.round(Math.abs(p.sw) * r / 1.4));
      for (j = Math.floor(k * n); j <= Math.ceil(q * n); j++) {
        a = p.a0 + p.sw * j / n; h = (j / n - k) / ((q - k) || 1); w = h > 0.75 ? (p.w || 2) + 1 : h > 0.3 ? (p.w || 2) : 1;
        g.globalAlpha = 0.3 + 0.7 * Math.max(0, h); g.fillStyle = h > 0.82 ? '#ffffff' : p.c;
        g.fillRect(Math.round(cx + Math.cos(a) * r - w / 2), Math.round(cy + 2 + Math.sin(a) * r * 0.62 - w / 2), w, w);
        if (p.c2 && h > 0.3) { g.fillStyle = p.c2; g.fillRect(Math.round(cx + Math.cos(a) * (r - 3)), Math.round(cy + 2 + Math.sin(a) * (r - 3) * 0.62), 1, 1); }
      }
      break;
    case 'shield':      // s 배율 · c 바탕 · c2 띠 · tower 네모 방패 · rise 땅에서 솟는다 · fall 위에서 내려찍는다(픽셀) · pop 처음 그 몫 동안 하얗게
      a = env(f, 0.06, 0.3); y = p.rise ? (1 - Math.min(1, f * 6)) * 7 : p.fall ? -(1 - Math.min(1, f * 5)) * (p.fall > 1 ? p.fall : 14) : 0;
      g.globalAlpha = a; if (p.pop && f < p.pop) drawShield(g, cx, cy + y, p.s || 1, '#ffffff', '#ffffff', p.tower, '#cfe3ff'); else drawShield(g, cx, cy + y, p.s || 1, p.c, p.c2, p.tower);
      break;
    case 'spike':      // 땅에서 솟는 가시(얼음 · 바위): h 높이 · w 밑 너비 · c [밝음, 가운데, 그늘] · lean 기울기 · up 솟는 데 드는 몫
      q = Math.min(1, f / (p.up || 0.12)); h = Math.round((p.h || 14) * ease(q)); a = f > 0.8 ? (1 - f) / 0.2 : 1; g.globalAlpha = a;
      for (i = 0; i < h; i++) {
        w = Math.max(1, Math.round((p.w || 5) * (1 - i / (p.h || 14)))); x = Math.round(cx + (p.lean || 0) * i / (p.h || 14) - w / 2); y = Math.round(cy + 6 - i);
        g.fillStyle = p.c[1]; g.fillRect(x, y, w, 1); g.fillStyle = p.c[0]; g.fillRect(x, y, Math.max(1, w >> 1), 1); if (w > 2) { g.fillStyle = p.c[2]; g.fillRect(x + w - 1, y, 1, 1); }
      }
      if (q >= 1 && Math.sin(time * 9 + cx) > 0.6) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(cx + (p.lean || 0)) - 1, Math.round(cy + 6 - h) - 1, 2, 2); }
      break;
    case 'column':      // 하늘에서 내리는 기둥: w 너비 · h 높이 · c 겉 · c2 속 · a 세기
      w = Math.max(1, Math.round((p.w || 6) * Math.min(1, f * 8) * (1 - f * f))); h = p.h || 72; a = (p.a || 0.75) * (1 - f * 0.6);
      g.globalAlpha = a; g.fillStyle = p.c; g.fillRect(cx - w, cy + 6 - h, w * 2, h); r = Math.max(1, w - 2);
      g.globalAlpha = Math.min(1, a + 0.2); g.fillStyle = p.c2 || '#ffffff'; g.fillRect(cx - r, cy + 6 - h, r * 2, h); g.fillRect(cx - w - 2, cy + 5, w * 2 + 4, 1);
      break;
    case 'dome':      // 둥근 지붕(보호 · 성역): r 반지름 · c 빛깔 · c2 도는 반짝임
      r = (p.r || 20) * (0.7 + 0.3 * Math.min(1, f * 5)); a = env(f, 0.1, 0.35) * (p.a || 0.9); y = cy + 5; n = Math.max(14, Math.round(r * 1.3));
      g.fillStyle = p.c; g.globalAlpha = a * 0.7; ellDots(g, cx, y, r, r * 0.45, n, 1, time * 0.8);
      for (j = 0; j <= n; j++) { k = 3.1416 + j / n * 3.1416; g.globalAlpha = a * ((j + Math.floor(time * 10)) % 5 ? 0.55 : 1); g.fillRect(Math.round(cx + Math.cos(k) * r), Math.round(y + Math.sin(k) * r * 0.85), 1, 1); if (j % 2) { g.globalAlpha = a * 0.3; g.fillRect(Math.round(cx + Math.cos(k) * r * 0.5), Math.round(y + Math.sin(k) * r * 0.85), 1, 1); } }
      g.fillStyle = p.c2 || '#ffffff'; g.globalAlpha = a; for (j = 0; j < 3; j++) { k = 3.1416 + ((time * 0.5 + j / 3) % 1) * 3.1416; g.fillRect(Math.round(cx + Math.cos(k) * r) - 1, Math.round(y + Math.sin(k) * r * 0.85) - 1, 2, 2); }
      break;
    case 'cloud':      // 먹구름: hgt 머리 위 높이 · w 너비 · c · c2 두 빛깔 · lit 안에서 번쩍인다
      a = env(f, 0.15, 0.25); y = cy - (p.hgt || 34); w = p.w || 22;
      for (j = 0; j < 6; j++) { x = cx - w / 2 + hs(j, p.sd) * w * 0.7 + Math.sin(time * 1.5 + j) * 1.5; q = 7 + hs(j + 3, p.sd) * 7; h = 4 + hs(j + 6, p.sd) * 3; g.globalAlpha = a * 0.92; g.fillStyle = j % 2 ? p.c2 : p.c; g.fillRect(Math.round(x), Math.round(y - h / 2 + (j % 3) * 2 - 2), Math.round(q), Math.round(h)); }
      if (p.lit && !V.calmN && hs(Math.floor(time * 12), p.sd) > 0.62) { g.globalAlpha = a * 0.45; g.fillStyle = '#ffffff'; g.fillRect(Math.round(cx - w * 0.3), Math.round(y - 2), Math.round(w * 0.6), 3); }
      break;
    case 'book':      // 펼친 책: hgt 머리 위 높이 · c 글줄 빛
      a = env(f, 0.12, 0.25); x = Math.round(cx); y = Math.round(cy - (p.hgt || 20) + Math.sin(time * 4) * 1); w = Math.round(6 * Math.min(1, f * 6));
      g.globalAlpha = a; g.fillStyle = '#3a2458'; g.fillRect(x - w - 1, y - 4, w * 2 + 3, 9); g.fillStyle = '#f4ead8'; g.fillRect(x - w, y - 4, w, 8); g.fillRect(x + 1, y - 4, w, 8);
      g.fillStyle = p.c; for (j = 0; j < 3; j++) { g.fillRect(x - w + 1, y - 2 + j * 2, Math.max(0, w - 2), 1); g.fillRect(x + 2, y - 2 + j * 2, Math.max(0, w - 2), 1); }
      g.fillStyle = '#1b1626'; g.fillRect(x, y - 4, 1, 9);
      break;
    case 'gate':      // 성문: 문살이 하얗게 번쩍하고 조각나 흩어진다 · c 문살 · c2 가로대
      a = f < 0.5 ? 1 : (1 - f) / 0.5; q = f > 0.25 ? (f - 0.25) * 16 : 0; x = cx - 7; y = cy - 11; g.globalAlpha = a;
      for (j = 0; j < 4; j++) { g.fillStyle = f < 0.15 ? '#ffffff' : p.c; g.fillRect(Math.round(x + 1 + j * 4 + (j - 1.5) * q), Math.round(y + (j === 0 || j === 3 ? 3 : 0) + q * hs(j, p.sd) * 0.8), 2, 16 - (j === 0 || j === 3 ? 3 : 0)); }
      for (j = 0; j < 3; j++) { g.fillStyle = f < 0.15 ? '#ffffff' : (p.c2 || p.c); g.fillRect(Math.round(x - q), Math.round(y + 3 + j * 5 - q * (1 - j) * 0.6), 14 + Math.round(q * 2), 1); }
      break;
    case 'star':      // 네 갈래 반짝임: s 크기 · c 빛깔
      r = Math.max(0, (p.s || 4) * Math.sin(3.1416 * f)); x = Math.round(cx); y = Math.round(cy); g.globalAlpha = 1; g.fillStyle = p.c;
      g.fillRect(x - Math.round(r), y, Math.round(r) * 2 + 1, 1); g.fillRect(x, y - Math.round(r), 1, Math.round(r) * 2 + 1); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 3, 3);
      break;
    case 'rune':      // 룬 글자 하나: ri 무늬(0~3) · s 배율 · up 떠오르는 픽셀
      g.globalAlpha = env(f, 0.15, 0.4); g.fillStyle = p.c; drawRune(g, cx, cy - (p.up || 0) * f, p.ri || 0, p.s || 1);
      break;
    default: if (X.KINDS[p.k]) X.KINDS[p.k].draw(g, p, f, time, V, cx, cy); break;      // 병과 파일이 더한 조각 (X.kind)
    case 'streak':      // 화면 좌표: n 줄 · a 방향 · al 세기
      a = env(f, 0.15, 0.4) * (p.al || 0.3); g.fillStyle = p.c; q = Math.cos(p.a); k = Math.sin(p.a);
      for (j = 0; j < p.n; j++) {
        h = ((f * (1.4 + hs(j + 7, p.sd)) + hs(j + 3, p.sd)) % 1) * 2 - 0.5; x = hs(j, p.sd) * V.W + q * h * V.W * 0.5; y = hs(j + 31, p.sd) * V.H + k * h * V.W * 0.5; w = 36 + hs(j + 11, p.sd) * 60;
        g.globalAlpha = a * (0.5 + 0.5 * hs(j + 17, p.sd));
        if (Math.abs(q) > 0.92) g.fillRect(x, y, w, 1.5); else if (Math.abs(k) > 0.92) g.fillRect(x, y, 1.5, w); else for (i = 0; i < w; i += 3) g.fillRect(x + q * i, y + k * i, 2, 2);
      }
      break;
  }
  g.globalAlpha = 1;
}
function drawHead(g, p, x, y, vx, vy, time) {
  var s = p.s || 3, L = Math.sqrt(vx * vx + vy * vy) || 1, ux = vx / L, uy = vy / L, i, w;
  x = Math.round(x); y = Math.round(y);
  switch (p.head) {
    case 'ember': g.fillStyle = p.c2 || '#d9442b'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = p.c || '#ff9a3c'; g.fillRect(x - 1, y - 2, 3, 3); g.fillStyle = '#ffd75e'; g.fillRect(x - 1, y - 1, 2, 2); break;
    case 'ice': if (pxLine) { g.fillStyle = p.c2 || '#5fa8e6'; pxLine(g, x - ux * 8, y - uy * 8, x, y, 3); g.fillStyle = p.c || '#bfefff'; pxLine(g, x - ux * 6, y - uy * 6 + 1, x + ux * 2, y + uy * 2 + 1, 1); g.fillStyle = '#ffffff'; g.fillRect(Math.round(x + ux * 2), Math.round(y + uy * 2), 2, 2); } break;
    case 'shield': drawShield(g, x, y, p.s || 1, p.c, p.c2, p.tower); break;
    case 'rune': g.fillStyle = p.c; drawRune(g, x, y, p.ri || 0, p.s && p.s > 3 ? 2 : 1); break;
    case 'star': g.fillStyle = p.c || '#dff4ff'; g.fillRect(x - s, y, s * 2 + 1, 1); g.fillRect(x, y - s, 1, s * 2 + 1); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 3, 3); break;
    case 'meteor': w = Math.max(1, s / 2);      // 둥근 불덩이: 어두운 돌 · 주황 · 노란 심
      g.fillStyle = '#7a1f1f'; discRows(g, x, y, w + 1, w + 1); g.fillStyle = p.c || '#ff9a3c'; discRows(g, x, y, w, w);
      g.fillStyle = '#ffd75e'; discRows(g, x - 1, y - 1, Math.max(1, w - 2), Math.max(1, w - 2)); if (s >= 5) { g.fillStyle = '#ffffff'; g.fillRect(x - 2, y - 2, 2, 2); } break;
    case 'icicle': for (i = 0; i < s * 3; i++) { w = Math.max(1, Math.round(s * (1 - i / (s * 3)))); g.fillStyle = p.c2 || '#9fe8ec'; g.fillRect(x - (w >> 1), y - s * 3 + i + 3, w, 1); g.fillStyle = '#ffffff'; g.fillRect(x - (w >> 1), y - s * 3 + i + 3, Math.max(1, w >> 1), 1); } break;
    case 'rock': g.fillStyle = '#3a2a22'; g.fillRect(x - s / 2 - 1, y - s / 2 - 1, s + 2, s + 2); g.fillStyle = p.c || '#a8754a'; g.fillRect(x - s / 2, y - s / 2, s, s); g.fillStyle = '#d8c39a'; g.fillRect(x - s / 2, y - s / 2, Math.max(1, s >> 1), 1); break;
    default: g.fillStyle = p.c; g.fillRect(x - (s >> 1), y - (s >> 1), s, s); g.fillStyle = '#ffffff'; g.fillRect(x - (s >> 2), y - (s >> 2), Math.max(1, s >> 1), Math.max(1, s >> 1));
  }
}
// 겹마다 그린다: 0 = 땅(유닛 밑 · 자리도 여기서) · 1 = 공중(유닛 위) · 2 = 화면 좌표
VP.skDraw = function (g, layer) {
  var L = this.skfx, i, p, f, w;
  if (!L) return;
  if (layer === 0) this.skZones(g);
  for (i = 0; i < L.length; i++) { p = L[i]; if (p.L !== layer || p.t < 0 || p.k === 'emit') continue; f = p.t / p.dur; drawSk(g, p, f, this.time, this); }
  if (layer === 2 && (w = this.skWash) && VX.hexA) { f = w.t / w.dur; g.fillStyle = VX.hexA(w.c, w.a * env(f, 0.2, 0.5)); g.fillRect(0, 0, this.W, this.H); }
  g.globalAlpha = 1;
};
})();
