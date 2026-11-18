// r40 joystick: 「터치로 움직이는 방식이 아니라 조이스틱으로 움직이는 방식으로」
//   화면 왼쪽 아래(가로 화면이면 왼쪽)를 누른 채 끌면 그 자리에 조이스틱이 나타나고, 고른 가문의 선두가 그쪽으로 한 칸씩 걷는다.
//   엔진은 네 방향 이웃으로만 걷는다(engine.js flood DIR 4) — 대각선은 두 축을 번갈아 밟는다. 막히면 가까운 옆길로 비켜 간다.
//   걸음은 보통 이동 명령({t:'move'}) 그대로라 틱 게이지·자리 바꿈·가솔 따라오기·길 막힘 규칙이 같다. 놓으면 그 칸에 선다(전투 중이면 잠시 지킨다).
//   누르기만 하고 끌지 않으면 보통 누름(적=공격, 아군=선택, 가게·문=그리로)이다. 설정 「이동 방식」에서 예전 터치 이동으로 되돌린다(opt.mv = 'touch').
//   PC: WASD · 방향키도 같은 조이스틱이다.
(function () {
'use strict';
var DS = globalThis.DS = globalThis.DS || {};
var R = 55, KR = 24, DEAD = 14, START = 12;      // 바탕 지름 110px · 손잡이 48px · 가운데 빈 곳 · 끌기 시작
var J = { ptr: null, live: false, ox: 0, oy: 0, kx: 0, ky: 0, dir: null, kb: {}, u: null, ax: 0, ay: 0, lx: 0, ly: 0, steer: false, fns: null, el: null, zn: null, hintAt: -1e9, hints: 0 };
DS.Joy = J;
function G() { return DS.G || {}; }
function opt() { var g = G(); return (g.save && g.save.opt) || {}; }
J.on = function () { return opt().mv !== 'touch'; };      // 기본은 조이스틱
J.fixed = function () { return !!opt().joyFix; };
function calm() { return !!(DS.calmFx && DS.calmFx()); }
function cvRect() { var v = G().view; return v && v.cv ? v.cv.getBoundingClientRect() : null; }
function insets() { var v = G().view; return v ? v.inset : { top: 0, bottom: 0 }; }
// 고정 조이스틱의 가운데 (캔버스 기준)
function fixedC(r) { var ins = insets(), land = r.width > r.height; return { x: R + (land ? 28 : 22), y: r.height - ins.bottom - R - (land ? 10 : 18) }; }
// 조이스틱을 시작할 수 있는 곳: 위·아래 띠 밖, 왼쪽 아래 (가로 화면이면 왼쪽 절반). HUD 위의 누름은 애초에 캔버스에 오지 않는다
J.inZone = function (cx, cy) {
  var r = cvRect(); if (!r) return false;
  var ins = insets(), x = cx - r.left, y = cy - r.top, top = ins.top, bot = r.height - ins.bottom, land = r.width > r.height;
  if (y < top || y > bot + 8) return false;
  if (J.fixed()) { var c = fixedC(r); return Math.hypot(x - c.x, y - c.y) <= R * 1.6; }
  return x <= r.width * (land ? 0.45 : 0.62) && y >= top + (bot - top) * (land ? 0.2 : 0.4);
};
// ───────── 그림 (DOM 하나: 바탕 고리 + 손잡이) ─────────
function mk() {
  if (J.el && J.el.isConnected) return;
  var host = document.getElementById('s-game'); if (!host) return;
  var d = document.createElement('div'); d.id = 'joy'; d.className = 'joy'; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = '<i class="jb"></i><i class="jk"></i>'; host.appendChild(d); J.el = d; J.knob = d.lastChild;
  var z = document.createElement('div'); z.id = 'joyZone'; z.setAttribute('aria-hidden', 'true'); host.appendChild(z); J.zn = z;      // 코치 표시가 밝힐 자리 (보이지 않는다)
}
function place(x, y) {      // 캔버스 기준 좌표 → #s-game 기준
  var r = cvRect(), host = J.el && J.el.parentNode; if (!r || !host) return;
  var hr = host.getBoundingClientRect();
  J.el.style.transform = 'translate(' + Math.round(r.left - hr.left + x) + 'px,' + Math.round(r.top - hr.top + y) + 'px)';
}
function knob(dx, dy) { if (J.knob) J.knob.style.transform = 'translate(' + Math.round(dx) + 'px,' + Math.round(dy) + 'px)'; }
function showJ(on) {
  if (!J.el) return;
  J.el.classList.toggle('on', !!on);
  J.el.classList.toggle('calm', calm());
  if (!on) knob(0, 0);
}
// ───────── 누름 ─────────
J.bind = function (cv, fns) {
  J.fns = fns; mk();
  cv.addEventListener('pointermove', function (e) { if (e.pointerId === J.ptr) J.move(e); });
  cv.addEventListener('pointerup', function (e) { if (e.pointerId === J.ptr) J.up(e, false); });
  cv.addEventListener('pointercancel', function (e) { if (e.pointerId === J.ptr) J.up(e, true); });
  document.addEventListener('keydown', key, false); document.addEventListener('keyup', key, false);
  window.addEventListener('blur', function () { J.kb = {}; });
};
// game.js bindInput 의 pointerdown 이 먼저 묻는다: 이 누름을 조이스틱이 가져가는가
J.claim = function (e, cv) {
  var g = G();
  if (!J.on() || J.ptr != null || !g.sim || g.aim || g.hold > 0 || g.ending) return false;
  if (e.pointerType === 'mouse' && e.button) return false;
  if (!J.inZone(e.clientX, e.clientY)) return false;
  mk();
  var r = cvRect();
  J.ptr = e.pointerId; J.live = false; J.sx = e.clientX; J.sy = e.clientY;
  if (J.fixed()) { var c = fixedC(r); J.ox = c.x; J.oy = c.y; } else { J.ox = e.clientX - r.left; J.oy = e.clientY - r.top; }
  try { cv.setPointerCapture(e.pointerId); } catch (x) {}
  if (J.fixed()) { J.live = true; place(J.ox, J.oy); showJ(true); J.move(e); }
  return true;
};
J.move = function (e) {
  var r = cvRect(); if (!r) return;
  var x = e.clientX - r.left, y = e.clientY - r.top;
  if (!J.live) {
    if (Math.hypot(e.clientX - J.sx, e.clientY - J.sy) < START) return;
    J.live = true;
    var ins = insets(); J.oy = Math.max(ins.top + R, Math.min(r.height - ins.bottom - R - 4, J.oy)); J.ox = Math.max(R, J.ox);      // 바탕이 위 띠·아래 단추 줄을 덮지 않게
    place(J.ox, J.oy); showJ(true);
  }
  var dx = x - J.ox, dy = y - J.oy, d = Math.hypot(dx, dy);
  if (!J.fixed() && d > R * 1.5) { var f = (d - R * 1.5) / d; J.ox += dx * f; J.oy += dy * f; dx = x - J.ox; dy = y - J.oy; d = Math.hypot(dx, dy); place(J.ox, J.oy); }      // 멀리 끌면 바탕이 엄지를 따라온다
  var k = d > R ? R / d : 1; knob(dx * k, dy * k);
  J.dir = d < DEAD ? null : snap(dx, dy);
};
J.up = function (e, cancel) {
  var was = J.live; J.ptr = null; J.live = false; J.dir = null; showJ(false);
  if (!was && !cancel && J.fns && J.fns.tap) J.fns.tap(e.clientX, e.clientY);      // 끌지 않았다: 보통 누름
};
// 8 방향으로 맞춘다. 대각선은 엔진에서 두 축을 번갈아 밟는다. t = 작은 축으로 기운 쪽 (막혔을 때 비켜 갈 쪽)
function snap(dx, dy) {
  var a = Math.atan2(dy, dx), s = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
  var V = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]][s];
  return { x: V[0], y: V[1], tx: V[0] ? Math.sign(dy) * (Math.abs(dy) > Math.abs(dx) * 0.12 ? 1 : 0) : 0, ty: V[1] ? Math.sign(dx) * (Math.abs(dx) > Math.abs(dy) * 0.12 ? 1 : 0) : 0 };
}
var KEYS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
function key(e) {
  var v = KEYS[e.code]; if (!v) return;
  var t = e.target, g = G();
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.type === 'keydown') { if (!J.on() || !g.sim || g.hold > 0 || !isGame()) return; J.kb[e.code] = v; e.preventDefault(); }
  else delete J.kb[e.code];
}
function isGame() { var s = document.getElementById('s-game'); return !!s && !s.hidden; }
function kbDir() {
  var x = 0, y = 0; for (var k in J.kb) { x += J.kb[k][0]; y += J.kb[k][1]; }
  x = Math.sign(x); y = Math.sign(y); return x || y ? { x: x, y: y, tx: 0, ty: 0 } : null;
}
// ───────── 걸음 ─────────
// 그 칸으로 들어설 수 있는가: 지형·막힘, 적이 선 칸은 아니다 (아군은 자리를 바꿔 지나간다 — 보통 이동과 같다)
function open(sim, me, x, y) { if (!sim.pass(me.mt || 'foot', x, y)) return false; var o = sim.at(x, y); return !(o && o !== me && !o.dead && o.side !== me.side); }
// (x,y) 에서 d 쪽으로 다음 한 칸. ax·ay = 이번에 가로·세로로 밟은 걸음 수 (대각선을 고르게 번갈아)
function next(sim, me, x, y, d, ax, ay) {
  var c = [];
  if (d.x && d.y) { c = ax <= ay ? [[d.x, 0], [0, d.y]] : [[0, d.y], [d.x, 0]]; }
  else c = [[d.x, d.y]];
  for (var i = 0; i < c.length; i++) if (open(sim, me, x + c[i][0], y + c[i][1])) return [c[i][0], c[i][1]];
  if (d.x && d.y) return null;
  // 곧은 쪽이 막혔다: 옆으로 세 칸 안에 앞이 트인 곳이 있으면 그쪽으로 비켜 간다 (기운 쪽 먼저, 기울지 않았으면 가까운 쪽)
  var px = d.y ? 1 : 0, py = d.x ? 1 : 0, t = d.x ? d.ty : d.tx, sides = t ? [t, -t] : [1, -1], best = null;
  for (var k = 1; k <= 3 && !best; k++) for (var si = 0; si < sides.length && !best; si++) {
    var s = sides[si], ok = true;
    for (var m = 1; m <= k; m++) if (!open(sim, me, x + px * s * m, y + py * s * m)) { ok = false; break; }
    if (ok && open(sim, me, x + px * s * k + d.x, y + py * s * k + d.y)) best = [px * s, py * s];
    if (!t && best) break;
  }
  return best;
}
function plan(sim, me, d) {
  var w = sim.w, a = next(sim, me, me.x, me.y, d, J.ax, J.ay); if (!a) return [];
  var x1 = me.x + a[0], y1 = me.y + a[1], out = [y1 * w + x1];
  var b = next(sim, me, x1, y1, d, J.ax + (a[0] ? 1 : 0), J.ay + (a[1] ? 1 : 0));
  if (b && !(x1 + b[0] === me.x && y1 + b[1] === me.y)) out.push((y1 + b[1]) * w + x1 + b[0]);      // 한 칸 더 앞까지 길을 깔아 둔다 (걸음 사이에 멈칫하지 않게)
  return out;
}
function stop(me) {
  var o = me && me.order;
  if (o && o.joy) { o.path = []; o.x = me.x; o.y = me.y; }      // 다음 차례에 엔진이 「도착」으로 끝낸다 (전투 중이면 잠시 그 자리를 지킨다)
  J.steer = false; J.u = null;
}
function same(a, b) { return a && b && a.x === b.x && a.y === b.y; }
// game.js loop1 이 sim.update 바로 앞에서 부른다
J.tick = function () {
  var g = G(), sim = g.sim; if (!sim) return;
  if (J.el) { var fx = J.fixed() && J.on() && isGame() && !g.hold && !g.ending; J.el.classList.toggle('fix', fx); if (fx && !J.live) place.apply(null, (function () { var r = cvRect(), c = r ? fixedC(r) : { x: 0, y: 0 }; return [c.x, c.y]; })()); }
  if ((g.hold > 0 || g.ending || !J.on()) && (J.live || J.ptr != null)) { J.ptr = null; J.live = false; J.dir = null; showJ(false); }
  if (g.hold > 0) J.kb = {};
  var nw = performance.now(); if (g.hold > 0 || !isGame()) J.quietAt = nw; else if (nw - (J.quietAt || 0) > 1500 && g.save && g.save.seen && !g.save.seen.joy) J.coachOnce();      // 창이 닫히고 한 박자 뒤 처음 한 번
  var d = J.live ? J.dir : kbDir(), me = sim.byId[g.sel];
  if (J.steer && (!d || !me || me !== J.u)) stop(J.u && !J.u.dead ? J.u : null);
  if (!d || !me || me.dead || me.side !== 'ally' || g.ending) { J.pd = null; return; }
  if (!same(d, J.pd)) { J.ax = J.ay = 0; J.pd = d; }
  if (J.u === me) { if (me.x !== J.lx) J.ax++; if (me.y !== J.ly) J.ay++; }
  J.lx = me.x; J.ly = me.y;
  var p = plan(sim, me, d), o = me.order;
  if (!p.length) { if (o && o.joy && o.path && o.path.length) stop(me); J.u = me; J.steer = true; return; }      // 앞이 막혔다: 그 자리에 선다
  var last = p[p.length - 1], tx = last % sim.w, ty = (last - tx) / sim.w;
  if (!o || !o.joy || J.u !== me || !o.path || !o.path.length && !J.steer) {
    g.goal = null; g.guideExit = null; g.pendPoi = null;      // 손으로 모는 걸음이 길 안내보다 먼저다
    var no = { t: 'move', x: tx, y: ty, joy: 1, path: p };
    if (J.fns && J.fns.order) J.fns.order(me, no); else sim.setOrder(me.id, no);
    if (me.order === no) no.path = p;      // setOrder 는 명령을 그대로 쥔다 — 길은 우리가 깐 것
    J.u = me; J.steer = true;
    if (g.view) g.view.mark = null;
    return;
  }
  if (o.path[0] !== p[0] || o.path.length < p.length) { o.path = p; o.x = tx; o.y = ty; o.fail = 0; o.b0 = null; }      // 방향을 바꿨거나 한 칸을 밟았다: 길만 고친다 (setOrder 의 바쁨 줄이기를 다시 걸지 않는다 — 걸음 빠르기는 그대로)
};
// 조이스틱 모드에서 맨땅을 눌렀다: 움직이지 않고 가끔 알려 준다
J.groundTap = function () {
  var now = performance.now(); if (now - J.hintAt < 9000 || J.hints >= 4) return;
  J.hintAt = now; J.hints++;
  if (DS.ui && DS.ui.toast) DS.ui.toast(J.fixed() ? '왼쪽 아래 조이스틱을 끌어 이동한다. 설정에서 터치 이동으로 바꿀 수 있다' : '화면 왼쪽 아래를 누른 채 끌면 이동한다. 설정에서 터치 이동으로 바꿀 수 있다', 3200);
};
// 처음 한 번: 조이스틱 자리를 밝힌다
J.coachOnce = function () {
  var g = G(), sv = g.save; if (!sv || !sv.seen || sv.seen.joy || !J.on() || g.quiet || g.hold || g.scn || g.ending || !DS.coach) return;
  var r = cvRect(); if (!r || !J.zn) return;
  var ins = insets(), land = r.width > r.height, top = ins.top + (r.height - ins.bottom - ins.top) * (land ? 0.2 : 0.4), w = J.fixed() ? R * 2 : r.width * (land ? 0.45 : 0.62), h = J.fixed() ? R * 2 : r.height - ins.bottom - top;
  var c = J.fixed() ? fixedC(r) : null, s = J.zn.style;
  var bot = r.height - ins.bottom - 14, hh = Math.max(64, Math.min(h - 24, 160, bot - r.height / 2 - 6));      // 엄지가 닿는 아래쪽만 밝힌다 (글은 그 위에 뜬다)
  s.left = (c ? c.x - R : 8) + 'px'; s.top = (c ? c.y - R : bot - hh) + 'px'; s.width = (c ? w : w - 16) + 'px'; s.height = (c ? h : hh) + 'px';
  sv.seen.joy = 1;
  DS.coach(J.zn, '여기를 누른 채 끌면 이동', { long: '화면 왼쪽 아래를 누른 채 끌면 조이스틱으로 이동한다. 적은 눌러서 공격한다', ms: 5200 });
};
// 설정 칸 (ui.js tabOpt 가 끼운다)
J.opt = function () {
  var o = opt(), mv = o.mv === 'touch' ? 'touch' : 'joy';
  return '<div class="row"><div class="tx"><b>이동 방식</b><small>조이스틱: 화면 왼쪽 아래를 누른 채 끌어 걷는다. 터치: 땅을 눌러 그 칸으로 간다</small></div><div class="seg" role="group" aria-label="이동 방식">' +
    [['joy', '조이스틱'], ['touch', '터치']].map(function (x) { return '<button data-joymv="' + x[0] + '"' + (mv === x[0] ? ' aria-pressed="true"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div></div>' +
    (mv === 'joy' ? '<div class="row"><div class="tx"><b>조이스틱 자리</b><small>떠다님: 누른 곳에 나타난다. 고정: 늘 왼쪽 아래 같은 자리</small></div><div class="seg" role="group" aria-label="조이스틱 자리">' +
      [['0', '떠다님'], ['1', '고정']].map(function (x) { return '<button data-joyfix="' + x[0] + '"' + ((o.joyFix ? '1' : '0') === x[0] ? ' aria-pressed="true"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div></div>' : '');
};
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest && e.target.closest('[data-joymv],[data-joyfix]'); if (!b) return;
  var g = G(), s = g.save; if (!s) return;
  if (b.dataset.joymv) s.opt.mv = b.dataset.joymv === 'touch' ? 'touch' : undefined;
  else s.opt.joyFix = b.dataset.joyfix === '1' || undefined;
  if (s.opt.mv === undefined) delete s.opt.mv; if (s.opt.joyFix === undefined) delete s.opt.joyFix;
  if (DS.ui && DS.ui.A) DS.ui.A('tap');
  if (DS.ui && DS.ui.persist) DS.ui.persist();
  var ov = b.closest('.ov'); if (ov && ov.draw) ov.draw();
}, false);
})();
