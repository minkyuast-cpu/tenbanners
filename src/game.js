// 열 개의 깃발 — 진행: 필드 이동, 전투 조작, HUD
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var app, SK = DS.SKILLS;
var G = DS.G = { lost: [], vetUps: [], save: null, sim: null, view: null, zone: null, scn: null, sel: null, aim: null, hold: 0, pause: false, promos: [], gain: { exp: 0, gold: 0, loot: [] },
                 bossId: null, wasCombat: false, pendPoi: null, ret: null, running: false, last: 0, hudT: 0, ending: false, chipEls: {},
                 actEls: [], stats: { kills: {}, dmg: {} }, goal: null, laterQ: [], pendBan: null, pendCamp: null, bcast: null, mercSeen: false, lineageQ: [] };      // lineageQ: 가계도 사건 (혼인·출생·사망·후계 의식…) — DS.lineageFlush 가 화면(lineage_ui)으로 넘긴다
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function A(n) { DS.Audio.sfx(n === 'tap' ? 'press' : n); }      // r26: 보통 누름은 부드러운 두 겹 「press」
// 받침에 맞는 조사: josa('민규', '이가') → '민규가'… 한글이 아니면 「이(가)」처럼 둘 다
function josa(w, pair) {
  w = String(w == null ? '' : w); var c = w.charCodeAt(w.length - 1);
  var P = { '이가': ['이', '가'], '을를': ['을', '를'], '은는': ['은', '는'], '와과': ['과', '와'], '으로': ['으로', '로'] }[pair]; if (!P) return w;
  if (!(c >= 0xAC00 && c <= 0xD7A3)) return w + P[0] + '(' + P[1] + ')';
  var jong = (c - 0xAC00) % 28;
  if (pair === '으로') return w + (jong && jong !== 8 ? '으로' : '로');
  return w + (jong ? P[0] : P[1]);
}
DS.josa = josa;
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function sprTag(name, pal, px, flip) { return '<i class="spr" data-spr="' + name + '" data-pal="' + (pal || '') + '" data-px="' + (px || 2) + '"' + (flip ? ' data-flip="1"' : '') + '></i>'; }
function hydrate(root) {
  $$('i[data-spr]', root).forEach(function (i) {
    var src = DS.spriteCanvas(i.dataset.spr, i.dataset.pal || null, { flip: !!i.dataset.flip, hd: 1 }), px = +i.dataset.px || 2, f = src.width >= 32 ? 2 : 1;
    var c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.className = 'px';
    c.getContext('2d').drawImage(src, 0, 0);
    c.style.width = src.width / f * px + 'px'; c.style.height = src.height / f * px + 'px';
    i.replaceWith(c);
  });
}
function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); var e = t.content.firstElementChild; hydrate(e); return e; }
function charSpr(ch, px, tier, who) {      // r27: 부대원이 가주인 가문은 그 사람의 모습 (DS.charLook) — 칩·가문 카드·가문 창·결과 창이 모두 이 길
  var pl = null; if (DS.charLook) { try { pl = DS.charLook(ch, G.save, tier, who); } catch (e) { pl = null; } }
  if (pl) return sprTag(pl[0], pl[1], (px || 2) * pl[2]);
  if (tier) return sprTag(DS.lookName(ch.cls, tier), '', px || 2);
  var k = null; if (DS.charSprite) { try { k = DS.charSprite(ch, G.save); } catch (e) { k = null; } } return sprTag(k || DS.lookName(ch.cls, DS.tierOfL(ch.L)), '', px || 2); }      // r12: 그래픽 2차 — 초상에도 장비·나이 (DS.charSprite)
var toastT = null;
function toast(msg, ms) {
  var t = $('#toast'); if (!t) return;
  var sg = $('#s-game'), host = sg && sg.hidden ? root() : sg;      // 타이틀에서도 보이게: 게임 화면이 숨어 있으면 #app 에 잠깐 옮겨 단다 (새 판 저장 안내·클라우드 받기)
  if (host && t.parentNode !== host) host.appendChild(t);
  t.textContent = msg; t.classList.toggle('over', !!$('.ov', root()) || host !== sg); t.classList.add('on');      // 창이 열려 있으면(또는 타이틀이면) 화면 맨 위에
  clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, ms || 2200);
}
function toastOff() { var t = $('#toast'); if (t) { t.classList.remove('on'); clearTimeout(toastT); } }      // r8 hud: 무거운 창(쓰러짐·전멸)이 뜰 때 떠 있던 토스트는 걷는다
function toastPlace() { var t = $('#toast'); if (t && t.classList.contains('on')) t.classList.toggle('over', !!$('.ov', root()) || t.parentNode !== $('#s-game')); }      // 떠 있는 토스트를 창 위/아래 자리로 옮긴다
function banner(title, sub, ms) {
  var b = $('#banner'); if (!b) return;
  b.innerHTML = '<b>' + esc(title) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '');
  b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('on'); }, ms || 2200);
}
// ───────── r26 juice: 누름·거절·코인·배너·코치 ─────────
// 움직임 줄이기: 설정(opt.calm) → DS.gfxOpt.calm → html.calm. 비워 두면 기기 설정(prefers-reduced-motion)을 따른다
function calm() { return !!(DS.calmFx && DS.calmFx()); }
function applyCalm() { var s = G.save, o = s && s.opt; DS.gfxOpt = DS.gfxOpt || {}; DS.gfxOpt.calm = !o || o.calm == null ? null : !!o.calm; document.documentElement.classList.toggle('calm', calm()); }
DS.applyCalm = applyCalm;
function haptic(ms) { var s = G.save; if (s && s.opt && s.opt.hap === false) return; try { if (navigator.vibrate) navigator.vibrate(ms); } catch (x) {} }
function icon(n, sz, cls) { return DS.icon ? DS.icon(n, sz, cls ? { cls: cls } : null) : ''; }
// 거절: 글 상자 대신 단추가 흔들리고 짧은 붉은 꼬리표. 2초 안에 다시 누르면 그때 까닭을 글로 (msg)
function deny(el, tag, msg) {
  A('deny'); haptic(18);
  if (el && el.classList) {
    el.classList.remove('deny', 'jr'); void el.offsetWidth; el.classList.add('deny');
    if (tag) { var old = el.querySelector(':scope > .deny-tag'); if (old) old.remove(); var t = document.createElement('i'); t.className = 'deny-tag'; t.textContent = tag; el.appendChild(t); setTimeout(function () { if (t.parentNode) t.remove(); }, 900); }
    if (msg && el._denyAt && performance.now() - el._denyAt < 2000) toast(msg, 2400);
    el._denyAt = performance.now();
  } else if (msg) toast(msg, 2400);
}
function goldPop() { var g = $('#gold'); if (!g) return; g.classList.remove('bump'); void g.offsetWidth; g.classList.add('bump'); }
// 동전이 쓰러진 자리에서 위 골드 칸으로 날아간다 (동시에 6개까지 — 넘치면 골드 칸만 튄다)
function coinFly(tx, ty, amount) {
  var cv = $('#cv'), gd = $('#gold'), host = $('#s-game');
  if (!cv || !gd || !host || !G.view || calm() || host.hidden || (G.view.onScreen && !G.view.onScreen(tx, ty))) { goldPop(); return; }
  if ((G.coinsInAir || 0) > 5) { goldPop(); return; }
  var s = G.view.screenOf(tx, ty), cr = cv.getBoundingClientRect(), gr = gd.getBoundingClientRect(), hr = host.getBoundingClientRect();
  var n = amount >= 200 ? 3 : 2;
  for (var i = 0; i < n; i++) (function (i) {
    var el = document.createElement('i'); el.className = 'coinfly'; el.innerHTML = '<i class="cf">' + icon('coin', 16) + '</i>';
    var x0 = cr.left - hr.left + s.x + (i - (n - 1) / 2) * 7, y0 = cr.top - hr.top + s.y - 10, x1 = gr.left - hr.left - 14, y1 = gr.top - hr.top + gr.height / 2 - 8;
    el.style.cssText = '--x0:' + Math.round(x0) + 'px;--y0:' + Math.round(y0) + 'px;--x1:' + Math.round(x1) + 'px;--y1:' + Math.round(y1) + 'px;--d:' + (0.52 + i * 0.07).toFixed(2) + 's;animation-delay:' + (i * 0.05) + 's';
    el.firstChild.style.animationDelay = (i * 0.05) + 's';
    G.coinsInAir = (G.coinsInAir || 0) + 1; host.appendChild(el);
    var done = false, fin = function () { if (done) return; done = true; el.remove(); G.coinsInAir = Math.max(0, G.coinsInAir - 1); goldPop(); if (i === 0) A('coinLand'); };
    el.addEventListener('animationend', function (ev) { if (ev.target === el) fin(); });
    setTimeout(fin, 1300);      // 화면이 가려져 애니메이션이 멈춰도 남지 않게
  })(i);
}
// 숫자가 0 부터 차오른다 (결과 창의 골드·경험치)
function fmtN(n) { n = Math.round(n || 0); return (n < 0 ? '−' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function countUp(el, to, ms, pre) {
  pre = pre || ''; if (!el) return;
  if (calm() || !(to > 0)) { el.textContent = pre + fmtN(to); return; }
  var t0 = performance.now(), k = -1; el.textContent = pre + '0';
  (function f(now) {
    if (!el.isConnected) return;
    var p = Math.max(0, Math.min(1, (now - t0) / (ms || 600))), e = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + fmtN(Math.round(to * e));
    if (p < 1) { var kk = (now / 50) | 0; if (kk !== k) { k = kk; A('coinTick'); } requestAnimationFrame(f); } else A('coinLand');
  })(t0);
}
// 큰 띠: 승리·전멸·시나리오 시작·증원 (#vban, 처음 쓸 때 만든다)
function vban(kind, title, sub, ms) {
  var sg = $('#s-game'); if (!sg) return;
  var el = $('#vban'); if (!el) { el = document.createElement('div'); el.id = 'vban'; el.setAttribute('aria-live', 'polite'); sg.appendChild(el); }
  clearTimeout(el._t); clearTimeout(el._t2);
  el.className = kind; el.innerHTML = (kind === 'win' ? '<i class="rays"></i>' : '') + '<div class="rib"><b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
  el.hidden = false;
  el._t = setTimeout(function () { el.classList.add('out'); el._t2 = setTimeout(function () { el.hidden = true; el.className = ''; el.innerHTML = ''; }, 320); }, ms || 1500);
}
DS.vban = vban;
// 코치 표시: 처음 한 번, 그 단추(또는 지도 칸)를 밝히고 짧은 한 줄. 화면을 막지 않는다 — 아무 데나 누르거나 몇 초 뒤 걷힌다
//   (막지 않으니 자동 시험도 그대로 돈다). 20초 안에 또 오거나 창이 열려 있으면 예전처럼 글 상자로
function coach(target, text, o) {
  o = o || {}; var r = null, now = performance.now();
  if (G.quiet) return;
  if (!G.save || G.ending || (now - (G.coachAt || -1e9) < 20000) || $('.ov:not(.ghost)', root())) { toast(o.long || text, o.ms || 3600); return; }
  if (target && target.getBoundingClientRect) { r = target.getBoundingClientRect(); if (!r.width) r = null; }
  else if (target && G.view && target.x != null) { var s = G.view.screenOf(target.x, target.y), cr = $('#cv').getBoundingClientRect(), k = G.view.k * 18; r = { left: cr.left + s.x - k / 2, top: cr.top + s.y - k / 2, right: cr.left + s.x + k / 2, bottom: cr.top + s.y + k / 2, width: k, height: k }; }
  if (!r) { toast(o.long || text, o.ms || 3600); return; }
  G.coachAt = now;
  var old = $('.coach'); if (old) old.remove();
  var host = root(), hr = host.getBoundingClientRect(), pad = 5;
  var el = h('<div class="coach" role="status"><i class="hole"></i><p>' + esc(text) + '</p></div>');
  var hs = el.querySelector('.hole').style; hs.left = (r.left - hr.left - pad) + 'px'; hs.top = (r.top - hr.top - pad) + 'px'; hs.width = (r.width + pad * 2) + 'px'; hs.height = (r.height + pad * 2) + 'px';
  var p = el.querySelector('p'); if (r.top - hr.top > hr.height / 2) p.style.bottom = (hr.bottom - r.top + 16) + 'px'; else p.style.top = (r.top - hr.top + r.height + 16) + 'px';
  host.appendChild(el); A('open');
  var off = function () { if (!el.isConnected) return; el.classList.add('out'); setTimeout(function () { el.remove(); }, 220); document.removeEventListener('pointerdown', off, true); };
  setTimeout(function () { if (el.isConnected) document.addEventListener('pointerdown', off, true); }, 400);
  setTimeout(off, o.ms || 5000);
}
DS.coach = coach;
function load() { return DS.Save.load(); }
// 지금 체력·마나를 저장 쪽에 적어 둔다 (지역을 옮기거나 시나리오에 들어가도 이어지도록)
function syncVitals() {
  var s = G.save, sim = G.sim; if (!s || !sim) return;
  sim.units.forEach(function (u) {
    if (u.side !== 'ally') return;
    if (u.role === 'cmd') { var ch = s.chars[u.ch]; if (ch && !u.dead) { var who = vitOf(s, ch); if (who) who.hp = Math.max(0.01, Math.min(1, u.hp / u.mhp)); ch.mp = u.mmp ? Math.max(0, Math.min(1, u.mp / u.mmp)) : 1; } }      // 4.0: 체력은 사람 것(대장 줄 · 든 부대원), 마나는 깃발 것
    else if (u.role === 'merc' && u.mid) { var m = s.mercs.filter(function (x) { return x.id === u.mid; })[0]; if (m && !(u.dead && !u.fled)) m.hp = Math.max(0.01, Math.min(1, u.hp / u.mhp)); }
  });
}
DS.syncVitals = syncVitals;
function vitOf(s, ch) { return !ch ? null : ch.id === s.hero ? ch : (DS.bearer ? DS.bearer(s, ch) : ch); }      // 깃발 유닛의 체력을 지닌 이
function persist() {
  var s = G.save; if (!s) return;
  syncVitals();
  var me = G.sim && G.sim.byId[G.sel];
  if (me && !G.scn) s.pos = { x: me.x, y: me.y };
  var ok = DS.Save.store(s);
  if (ok === false) { var t = Date.now(); if (!G.saveFailAt || t - G.saveFailAt > 60000) { G.saveFailAt = t; toast('저장하지 못했다. 브라우저 저장 공간이 가득 찼거나 막혀 있다.', 4200); } }      // 2.8.0: 말없이 실패하던 것
  else { G.saveFailAt = 0; if (G.tickDue) { var due = G.tickDue; G.tickDue = 0; if (performance.now() < due) savedTick(); } }
}
// 2.6 「저장됨」: 의식 · 구매 · 결과 뒤에 메뉴 단추 곁에 1초 (저장이 실제로 된 때만). 부르는 쪽은 DS.saveTick() 뒤에 저장한다
function savedTick() {
  var host = root(), sg = $('#s-game'); if (!host || !sg || sg.hidden) return;
  var el = $('#savedTick'); if (!el) { el = h('<div id="savedTick" role="status"><i aria-hidden="true">✓</i>저장됨</div>'); host.appendChild(el); }
  var m = $('#bMenu'), r = m && m.getBoundingClientRect(), hr = host.getBoundingClientRect();
  if (r && r.width) { el.style.left = Math.round(r.left - hr.left) + 'px'; el.style.top = Math.round(r.bottom - hr.top + 3) + 'px'; }
  el.classList.toggle('on', false); void el.offsetWidth; el.classList.add('on');
  clearTimeout(el._t); el._t = setTimeout(function () { el.classList.toggle('on', false); }, 1100);
}
DS.saveTick = function () { G.tickDue = performance.now() + 3000; };
function wipeSave() { DS.Save.wipe(); }
function root() { return app || (app = $('#app')); }
function show(id) { $$('.screen', root()).forEach(function (s) { s.hidden = s.id !== id; }); }
// 겹쳐 띄우는 창. 열려 있는 동안 게임 시간은 멈춘다.
function overlay(html, cls) {
  var o = h('<div class="ov ' + (cls || '') + '"><div class="sheet">' + html + '</div></div>');
  o.born = performance.now();      // 창을 연 탭의 click 이 곧바로 새 창(바탕·이야기)에 떨어지는 것을 막는다 (마을 사람을 다시 누르면 창이 열리자마자 닫히던 결함)
  root().appendChild(o); G.hold++; toastPlace();
  var story0 = o.classList.contains('story');
  if (!story0 && !o.classList.contains('modal')) A('open');      // r26: 창 여는 소리 (안드로이드 「뒤로」는 histInit 이 맨 위 창을 닫는다)
  o.close = function () {
    if (!o.isConnected) return;
    if (!story0 && !calm()) ghostOut(o);      // r26: 닫히는 모습은 복제본이 보여 준다 (진짜 창은 바로 빠진다 — 창을 찾는 코드·시험이 그대로)
    o.remove(); G.hold = Math.max(0, G.hold - 1); G.shutAt = performance.now(); toastPlace();
    if (o.onclose) o.onclose();
  };
  o.addEventListener('click', function (e) { if (e.target === o && !o.classList.contains('modal') && performance.now() - o.born > 250) { A('close'); o.close(); } var c = e.target.closest('[data-close]'); if (c && !(e.isTrusted && performance.now() - o.born < 250)) { A(story0 ? 'cancel' : 'close'); o.close(); } });      // 3차 ui: 「확인」 연타의 둘째 탭이 바로 뒤에 뜬 다음 창(승급 대기열 등)의 같은 자리 단추를 눌러 보지도 못하고 닫던 것
  return o;
}
function closeAll() { $$('.ov', root()).forEach(function (o) { if (o.close) o.close(); else o.remove(); }); G.hold = 0; }
// r26: 닫히는 창의 복제본 (누를 수 없음 · id 없음 · .ghost). 다른 창들 맨 앞에 끼워 querySelector('.ov') 가 먼저 진짜 창을 찾게 한다
function ghostOut(o) {
  try {
    var g = o.cloneNode(true), oc = o.querySelectorAll('canvas'), gc = g.querySelectorAll('canvas'), i;
    for (i = 0; i < gc.length && i < 40; i++) { try { gc[i].getContext('2d').drawImage(oc[i], 0, 0); } catch (x) {} }
    $$('[id]', g).forEach(function (x) { x.removeAttribute('id'); });
    g.classList.add('ghost'); g.setAttribute('inert', ''); g.setAttribute('aria-hidden', 'true');
    var first = $('.ov', root()); root().insertBefore(g, first && first !== o ? first : o);
    setTimeout(function () { g.remove(); }, 170);
  } catch (x) {}
}
// r26: 안드로이드 「뒤로」·브라우저 뒤로 = 맨 위 창 닫기. 확인 창(modal)·이야기 창은 닫지 않는다. 창이 없으면 부대 창을 연다.
//   방식: 게임을 켤 때 「지킴」 기록을 하나 쌓고, 뒤로가 눌리면(popstate) 할 일을 한 뒤 지킴을 다시 쌓는다. 코드가 history.back() 을 부르지 않으니 기록이 어긋나 페이지를 벗어나는 일이 없다.
var histOn = false;
function histInit() {
  if (histOn) return;
  try { history.pushState({ guard: 1 }, ''); histOn = true; } catch (x) { histOn = false; return; }
  window.addEventListener('popstate', function () {
    var guard = function () { try { history.pushState({ guard: 1 }, ''); } catch (x) {} };
    if (!G.save || $('#s-game').hidden) return;      // 타이틀: 다음 뒤로는 앱을 떠난다
    guard();
    var all = $$('.ov:not(.ghost)', root()), top = all[all.length - 1];
    if (top) { if (!top.classList.contains('modal') && !top.classList.contains('story') && top.close) { A('close'); top.close(); } return; }
    if (!G.ending && DS.openMenu) { A('open'); DS.openMenu('party'); }
  });
}
// 이야기 창: 한 줄씩 넘긴다. 줄은 글(지문) 또는 { w: 화자, c: 초상(병과·보스·적 키), t: 대사 }. 글 안의 {hero} 는 주인공 이름.
function fill(t) { return String(t == null ? '' : t).replace(/\{hero\}/g, (G.save && G.save.name) || '대장'); }
function lineText(l) { return fill(l && typeof l === 'object' ? l.t : l); }
function speakerSpr(c) {
  var C = DS.CLASSES[c], B = DS.BOSSES[c], E = DS.ENEMIES[c], s = G.save;
  if (C) {      // 지금 그 병과 지휘관의 모습으로 (합일해 떠났으면 7단, 아직 없으면 첫 모습)
    var t = C.start, F = DS.FAMILY[C.fam];
    var own = null; if (s) { if (F && DS.hasClass(s, F.master) && !C.master) t = 7; DS.charList(s).forEach(function (x) { if (x.cls === c) { t = DS.tierOfL(x.L); own = x; } }); }
    if (own && own.id !== s.hero) return charSpr(own, 2);      // r27: 그 가문의 가주(아홉·부대원)는 제 모습으로 말한다
    return sprTag(DS.lookName(c, t), '', 2);
  }
  if (B) return sprTag(B.sprite, B.pal, 1.5);
  if (E) return sprTag(E.sprite, '', 2);
  if (DS.SPR && DS.SPR[c]) return sprTag(c, '', 2);      // 이야기 전용 인물 그림 (예: 옛 대장 먼동 elder_mundong)
  return '';
}
// 줄을 지금 판에 맞춘다 (화자가 지금도 그 사람인가 · 선대의 훈수). 이야기 창과 시험(tools/t_story.js)이 같은 것을 쓴다.
function storyLines(lines) {
  // r8 이야기: 화자가 지금도 그 사람인가. 깃발을 든 열 사람과 가주(줄의 c, 그리고 그 줄이 기대는 사람 of)가 숨을 거두었으면 본인 목소리로 띄우지 않는다.
  //   자리를 이은 이가 있다(heir) — 화자 칸은 지금 그 사람의 화면 이름, 글은 줄의 heir 칸(없으면 그대로, 빈 글이면 그 줄을 건너뛴다)
  //   방금 쓰러져 아직 빈자리다(gone) — 줄의 gone 칸을 띄운다(화자 본인이 쓰러졌으면 지문으로). gone 칸이 없고 화자 본인이면 건너뛴다
  //   합일 뒤 마스터 자리를 후계가 이었다(one) — 그 깃발 속 서너 목소리가 한 사람이 된다. 초상은 지금 그 사람(마스터)으로, 한 이야기 안에서는 처음 입을 연 배역의 줄만 그대로 띄우고
  //     다른 배역의 줄은 heir 글이 있을 때만. 가주의 몸이면 가주에게는 제 줄(hero)이 있으니, 깃발 속 목소리의 줄은 heir 글이 있는 것만 띄운다(제 이름을 부르며 제게 말을 걸지 않게)
  var one = {};      // 마스터 후계의 자리 id → 이 이야기에서 처음 입을 연 배역 키
  function castNow(k) { var r = DS.castNow ? DS.castNow(G.save, k) : 0; castNow.r = r || {}; return r ? r.st : 0; }      // 0 본인(또는 아직 합류 전) · 1 후계 · 2 빈자리 (셈은 story.js 의 DS.castNow)
  function castLine(l) {
    if (!l || typeof l !== 'object' || typeof l.t !== 'string') return l;
    if (l.anc) return l;      // 2.4.0: 선대의 훈수 (story.js storyFit 이 이미 맞췄다)
    if (l.c && DS.castAnc && DS.CAST_NAME[l.c] && l.gone === undefined && l.no === undefined && DS.castAnc(G.save, l.c)) { if (l.a === '') return null; return { w: DS.ancName(l.c), c: l.c, t: l.a != null ? l.a : l.t, anc: 1 }; }      // 가문이 닫혀 있거나 가주 자리가 비었다 — 그 집 선대가 대신 말한다
    var self = l.c ? castNow(l.c) : 0, r = castNow.r, st = self, t = l.t, w = l.w, c = l.c;
    [].concat(l.of || []).forEach(function (k) { st = Math.max(st, castNow(k)); });
    if (st === 2 && l.gone !== undefined) { if (!l.gone) return null; if (self === 2) return String(l.gone); t = l.gone; }
    else if (self === 2) return null;
    else if (st && l.heir !== undefined) { if (!l.heir) return null; t = l.heir; }
    else if (self === 1 && r.one != null && (r.head || (one[r.one] && one[r.one] !== l.c))) return null;
    if (self === 1) { if (r.nm) w = r.nm; if (r.c) c = r.c; if (r.one != null && !one[r.one]) one[r.one] = l.c; }
    if (c === 'hero') { var hc = G.save && G.save.chars[G.save.hero]; c = hc ? hc.cls : ''; }
    return w === l.w && c === l.c && t === l.t ? l : { w: w, c: c, t: t };
  }
  return lines.map(castLine).filter(function (l) { return l != null; });
}
DS.storyResolve = function (lines) {      // 화면에 뜨는 그대로: [{ w, c, t }] ({hero} 까지 채운 글)
  if (lines && !(lines instanceof Array)) lines = [lines];
  return storyLines(lines || []).map(function (l) { var o = !!l && typeof l === 'object'; return { w: o && l.w ? fill(l.w) : '', c: (o && l.c) || '', t: lineText(l), anc: !!(o && l.anc) }; });
};
function story(lines, cb, who) {
  if (lines && !(lines instanceof Array)) lines = [lines];
  if (lines) { try { lines = storyLines(lines); } catch (x) {} }
  if (!lines || !lines.length) { if (cb) cb(); return; }
  var i = 0, done = false, n = lines.length;
  var o = overlay('<div class="story-box"><span class="sp"></span><p class="who"></p><p class="line"></p>' + (n > 2 ? '<button class="skip">건너뛰기 ▸▸</button>' : '') + '<span class="next"></span></div>', 'story modal');
  var tt = $('#toast'); if (tt) { tt.classList.remove('on'); clearTimeout(toastT); }      // 이야기 창이 열리면 떠 있던 토스트(튜토리얼 등)는 걷는다 — 글 상자가 둘 겹치지 않게 (QA K8)
  function end() { if (done) return; done = true; o.close(); if (cb) cb(); }
  function put() {
    var l = lines[i], obj = !!l && typeof l === 'object', sp = $('.sp', o), box = $('.story-box', o), pic = '';
    if (obj && l.c) { try { pic = speakerSpr(l.c); } catch (x) { pic = ''; } }
    $('.who', o).textContent = obj && l.w ? fill(l.w) : (who || '');
    $('.line', o).textContent = lineText(l);
    sp.innerHTML = pic; hydrate(sp);
    box.classList.toggle('talk', obj && !!(l.w || l.c)); box.classList.toggle('pic', !!pic);
    box.classList.toggle('memo', obj && l.w === '전장 메모');      // 이야기 속 목소리가 아니라 조작 안내
    box.classList.toggle('anc', obj && (!!l.anc || l.w === '선대 단톡방' || /^(선대|단톡방 ·) /.test(l.w || '')));      // 2.4.0: 선대의 훈수 (초상이 바랜다)
    $('.next', o).textContent = (n > 2 ? (i + 1) + ' / ' + n + '  ' : '') + (i >= n - 1 ? '▼ 닫기' : '▼ 눌러서 계속');
  }
  o.addEventListener('click', function (e) {
    if (performance.now() - o.born < 250) return;      // 연 탭의 click 이 넘김으로 읽히지 않게
    A('tap');
    if (e.target.closest && e.target.closest('.skip')) { end(); return; }
    if (++i >= n) end(); else put();
  });
  put();
}
DS.ui = { josa: josa, $: $, $$: $$, h: h, esc: esc, sprTag: sprTag, charSpr: charSpr, toast: toast, banner: banner, overlay: overlay, closeAll: closeAll, story: story, A: A, persist: persist, load: load, wipeSave: wipeSave, show: show, hydrate: hydrate,
  deny: deny, haptic: haptic, calm: calm, countUp: countUp, coach: coach, vban: vban, svg: icon, fmtN: fmtN };

// ───────── 부대 배치 ─────────
DS.sortieHold = function () { return !!(G.scn || (G.sim && G.sim.combat)); };      // 2.2.8: 싸우는 동안은 출전 셋을 고치지 않는다 (meta.js DS.sortieFix)
function sortieFree(f) { var h = DS.sortieHold; DS.sortieHold = null; try { f(); } finally { DS.sortieHold = h; } }      // 2.2.8: 싸움 직전 · 직후처럼 지금 고쳐야 할 때
function sortieNote() { var t = DS.sortieNewsText ? DS.sortieNewsText(G.save) : ''; if (t) later(t, 4200); return !!t; }      // 2.2.8: 출전 자리를 저절로 채운 소식
function reviveAll() { DS.charList(G.save).forEach(function (c) { if (c.down) { c.down = false; c.hp = 0.5; c.mp = 0.5; } }); }
function placeParty(sim, x, y, starts) {
  var s = G.save;
  var egp = !!(DS.egPassOn && DS.egPassOn(s));      // 3.3.0: 스무 해 창이 열려 있으면 빈자리는 그 창의 멈춤이 정한다 (안전망이 먼저 채우지 않는다)
  if (!G.riteBusy && !egp && DS.linVacant && DS.linVacant(s).length) { (DS.linAutoAll(s) || []).forEach(function (e) { if (e.ev) later(DS.linEvText(s, e.ev), 4200); }); }      // 안전망: 의식을 거치지 않은 빈자리는 출전 전에 채운다
  if (!egp && !G.scn && !sim.combat && DS.sbTick) bnNote(DS.sbTick(s));      // 2.2.0: 싸움 밖이면 빈 가문은 막사의 같은 병과가 곧바로 잇는다 (마을에서 천수로 떠난 가주 · 방출 · 판 올림 뒤)
  if (DS.mercTidy) DS.mercTidy(s);      // 2.2.0: 자리 불변식 · 2.2.8: 출전 목록(s.party) = 맹주 + 출전한 가주 둘
  sortieNote();
  if (!egp && !s.party.some(function (id) { return s.chars[id] && !s.chars[id].down; })) reviveAll();
  var specs = DS.partySpecs(s), first = null, keep = G.sel, pos = starts && DS.formation ? DS.formation(specs, starts) : null;      // r44 대열: 튼튼한 이가 앞줄
  specs.forEach(function (u, i) {
    var p = pos ? pos[i] : starts ? starts[i % starts.length] : [x, y];
    u.x = p[0]; u.y = p[1];
    if (u.role === 'cmd') u.auto = !s.chars[u.ch].manual;
    var nu = sim.add(u);
    if (nu) {      // 남아 있던 체력·마나 그대로
      var src = nu.role === 'cmd' ? s.chars[nu.ch] : s.mercs.filter(function (x) { return x.id === nu.mid; })[0], vt = nu.role === 'cmd' ? vitOf(s, src) : src;
      if (src) { nu.hp = Math.max(1, Math.round(nu.mhp * (!vt || vt.hp == null ? 1 : vt.hp))); if (nu.role === 'cmd') { nu.mp = Math.round(nu.mmp * (src.mp == null ? 1 : src.mp)); if (nu.ch !== s.hero) nu.mn = nu.name || ''; } else nu.mn = src.n || ''; }      // mn: 필드 이름표(그래픽팀) — 4.0: 깃발 유닛은 든 사람 이름
    }
    if (nu && nu.role === 'cmd') { setStance(nu, s.chars[nu.ch].st); if (!first) first = nu; }
  });
  G.sel = (keep && sim.byId[keep]) ? keep : (first && first.id);
  sim.leader = G.sel;
}
// 용병 태세('side' = 곁에, 없음 = 앞장)를 살아 있는 지휘관 유닛에 적는다.
// 엔진의 u.st 는 지금 상태 이상 표(객체)라서 덮어쓰면 안 된다 — 그 칸이 비어 있을 때만 약속대로 u.st 에도 적고, 늘 u.stance 에 적어 둔다.
function setStance(u, v) { u.stance = v || null; if (typeof u.st !== 'object' || u.st === null) u.st = v || undefined; }
// 레벨이 오르거나 장비가 바뀌면 능력치만 새로 맞춘다. 베끼는 칸: 기본 목록 + 장비 파일이 DS.UNIT_KEYS 에 적어 둔 칸(fx, twin, passive, tags, mt, mv, dtype, surv …)
DS.applyStance = function (id) { var ch = G.save && G.save.chars[id], u = G.sim && G.sim.byId['c' + id]; if (u) setStance(u, ch && ch.st); if (G.sim) renderSys(); };      // 지휘관 창에서 태세를 바꾸면 필드의 유닛에도 바로
var UNIT_KEYS = ['L', 'tier', 'look', 'mhp', 'mmp', 'atk', 'def', 'mag', 'res', 'rng', 'skills', 'name', 'drain', 'grade', 'crit', 'spd', 'enh', 'vet', 'trait'];
var UNIT_LIVE = { id: 1, side: 1, role: 1, x: 1, y: 1, hp: 1, mp: 1, st: 1, buffs: 1, cd: 1, gauge: 1, order: 1, dead: 1, owner: 1, ch: 1, mid: 1, auto: 1, home: 1 };      // 전투 중의 상태는 사양으로 덮지 않는다
function refreshUnits(full) {
  var sim = G.sim, s = G.save; if (!sim) return;
  sim.units.forEach(function (u) {
    if (u.side !== 'ally' || u.dead) return;
    var spec = null;
    if (u.role === 'cmd') { var ch = s.chars[u.ch], who = ch && DS.bearer ? DS.bearer(s, ch) : null; if (ch && (who || !DS.bearer)) spec = DS.cmdSpec(ch, ch.id === s.hero, who); }      // 4.0: 든 사람의 공훈·특성이 얹힌다
    else if (u.role === 'merc') { var own = sim.byId[u.owner], oc = own && s.chars[own.ch], mm = s.mercs.filter(function (x) { return x.id === u.mid; })[0]; if (oc && mm) spec = DS.mercSpec(oc, mm); }
    if (!spec) return;
    var up = spec.L > u.L || full, r = u.hp / u.mhp, rm = u.mmp ? u.mp / u.mmp : 0;
    UNIT_KEYS.concat(DS.UNIT_KEYS || []).forEach(function (k) { if (spec[k] !== undefined && !UNIT_LIVE[k]) u[k] = spec[k]; });
    u.hp = up ? u.mhp : Math.max(1, Math.round(u.mhp * r)); u.mp = up ? u.mmp : Math.round(u.mmp * rm);
  });
}
// 편성이 바뀌면 통째로 다시 세운다 (전투 중이 아닐 때만)
function rebuildParty() {
  var sim = G.sim; if (!sim) return;
  syncVitals();
  var me = sim.byId[G.sel] || sim.cmds()[0], x = me ? me.x : 1, y = me ? me.y : 1;
  sim.units.filter(function (u) { return u.side === 'ally'; }).forEach(function (u) { sim.remove(u); delete G.view.vu[u.id]; });
  placeParty(sim, x, y);
  sim.units.forEach(function (u) { if (u.side === 'ally' && !G.view.vu[u.id]) G.view.vu[u.id] = G.view.mkVu(u, true); });
  sim.ev = sim.ev.filter(function (e) { return e.t !== 'spawn'; });
  select(G.sel); renderChips(); renderActs();
}
DS.rebuildParty = rebuildParty; DS.refreshUnits = refreshUnits;

// ───────── 지역 ─────────
function gateScn(p) {
  if (p.t === 'dungeon') return DS.pit(DS.pitNext ? DS.pitNext(G.save) : 1);      // 2.2.3: 문 앞의 표시는 다음 층 (들어가면 층 고르기 창)
  var eg = DS.egGate ? DS.egGate(p, G.save) : null; if (eg) return eg;      // endgame: 다음 세대의 장 — 그 장의 시나리오
  for (var i = 0; i < p.ids.length; i++) if (!G.save.cleared[p.ids[i]]) return DS.scn(p.ids[i]);
  return DS.scn(p.ids[p.ids.length - 1]);
}
function scnLock(s) {
  var sv = G.save, tier = DS.partyTier(sv);
  if (s.pit) return tier < 5 ? '5단부터 입장 가능' : null;
  if (s.gen && DS.egLock) { var gl = DS.egLock(s, sv); if (gl) return gl; }      // endgame: 장 안의 앞 번호를 먼저
  if (s.id > 1 && !sv.cleared[s.id - 1]) { var pv = DS.scn(s.id - 1).name; return '앞 시나리오(' + (s.id - 1) + '. ' + pv + ')' + josa(pv, '을를').slice(pv.length) + ' 먼저 끝내야 합니다'; }
  if (s.tier > tier) return s.tier + '단 전용 시나리오입니다';
  return null;
}
function markPois() {
  var z = G.zone, sv = G.save, next = DS.nextScn(sv);
  z.pois.forEach(function (p) {
    if (p.t === 'gate' || p.t === 'dungeon') {
      var s = gateScn(p), lock = scnLock(s), done = !s.pit && (s.gen ? sv.eg.c[s.id] : sv.cleared[s.id]);      // endgame: 장 시나리오는 그 장에서 깼는가
      p.state = lock ? 'lock' : (!s.pit && next && s.id === next.id) ? 'next' : 'open';
      p.label = s.pit ? '바닥 없는 갱도' : s.id + '. ' + s.name; p.lx = p.x; p.ly = p.y - 2.9;
      p.sub = lock ? '잠김' : s.pit ? (sv.pitBest ? '최고 ' + sv.pitBest + '층' : '1층부터') : done ? '완료 (다시 도전)' : '권장 ' + lvText(recL(s));
    } else if (p.t === 'shop' && p.kind !== 'house') { p.label = DS.SHOP_NAME[p.kind]; p.lx = p.bx + 1; p.ly = p.by - 0.55; }
    else if (p.t === 'exit') {
      p.label = (p.side === 'W' ? '← ' : p.side === 'N' ? '↑ ' : '') + DS.ZONES[p.to].name + (p.side === 'E' ? ' →' : p.side === 'S' ? ' ↓' : '');
      p.lx = p.x + (p.side === 'E' ? -1.6 : p.side === 'W' ? 1.6 : 0); p.ly = p.y + (p.side === 'S' ? -1.2 : p.side === 'N' ? 1.2 : -1.1);
      p.state = zoneDanger(p.to) ? 'lock' : 'open'; if (p.state === 'lock') p.label = '⚠ ' + p.label;      // 4.0.6: 잠김 대신 위험 표시
    }
  });
}
DS.markPois = function () { if (G.zone && G.zone.pois && G.save && !G.scn) { markPois(); updateQuest(); } };      // 2.3.2: 대가 끊겨 깬 시나리오가 사라지면 이 지역 입구 표시를 곧바로 다시
function lvText(L) { return DS.tierOfL(L) + '단 Lv' + DS.lvOfL(L); }
// 권장 레벨(화면 표시용): 기획팀의 DS.recL(scn) 이 있으면 그 값(실제 승률 기준), 없으면 시나리오의 적 레벨 s.L. 화면의 「권장」은 모두 이것을 읽는다.
function recL(s) { if (!s) return 1; var v = null; if (DS.recL) { try { v = DS.recL(s); } catch (e) { v = null; } } return v > 0 ? Math.round(v) : s.L; }
DS.recLOf = recL;
function recOfL(L) { var v = null; if (DS.recOfL) { try { v = DS.recOfL(L); } catch (e) { v = null; } } return v > 0 ? Math.round(v) : L; }      // 필드 머리글: 적 레벨 → 권장 표시 (기획팀 보간)
function zoneRec(z) { var r = DS.zoneRec ? DS.zoneRec(z.id) : [recOfL(z.def.L[0]), recOfL(z.def.L[1])]; return '권장 ' + lvText(r[0]) + ' ~ ' + lvText(r[1]); }      // 2.2.3: 잰 표 (DS.REC.zone)
function lvShort(L) { return DS.tierOfL(L) + '단 Lv' + DS.lvOfL(L); }      // 칩용 짧은 표기 (QA: 「1단1」이 읽히지 않는다 → 「1단·1」)
DS.lvText = lvText;
// 2.6 지역 띠의 아랫줄. 마을: 첫 시나리오를 깨기 전의 처음 세 번은 「가게 문을 누르면 들어간다」, 그 뒤로는 「가문력 44년 가을 · 로저스 가문 2대」.
//   들판: 권장 레벨 그대로. 지난번 지역에 들어선 뒤로 계절이 바뀌었으면 그 한 줄이 먼저 (영웅관 값은 정말 내렸을 때만 말한다 — 모집 열기는 계절마다 식는다, meta.js DS.recruitHeat)
var SEA_LINE = ['꽃잎이 날린다.', '풀빛이 짙어졌다.', '낙엽이 진다.', '눈이 내린다.'];
function heatNow(s) { try { var r = s.rh; if (!r || !(r.h > 0)) return 0; var c = DS.calNow(s), q = ((DS.AGE && DS.AGE.year) || 600) / 4; return Math.max(0, r.h - Math.max(0, c.t - r.t) / q * DS.RECRUIT.ease); } catch (x) { return 0; } }
function zoneSub(z, s) {
  var c = null, hn = '', gen = 0, sea = '';
  try { c = DS.calNow ? DS.calNow(s) : null; } catch (x) { c = null; }
  if (c) {
    var key = c.yr * 4 + c.season, ht = heatNow(s), was = G.seaSeen && G.seaSeen.save === s ? G.seaSeen : null;
    if (was && key > was.key && key - was.key <= 4) sea = josa(c.sname, '이가') + ' 왔다. ' + (ht < was.heat - 0.01 ? '영웅관 값이 내렸다.' : DS.seasonLand && DS.seasonLand(z.theme) ? SEA_LINE[c.season] : '');
    G.seaSeen = { save: s, key: key, heat: ht };
  }
  if (sea) return sea.trim();
  if (!z.town) return '들판, ' + zoneRec(z);
  G.townN = (G.townSave === s ? G.townN || 0 : 0) + 1; G.townSave = s;
  if (!c || (!Object.keys(s.cleared || {}).length && G.townN <= 3)) return '마을. 가게 문을 누르면 들어간다';
  try { hn = DS.houseName ? DS.houseName(s) : ''; var h = s.chars[s.hero], P = s.lin && s.lin.P, p = h && P && P[h.pid]; gen = (p && p.gen) || 1; } catch (x) { hn = ''; }
  return '가문력 ' + c.text + (hn ? ' · ' + hn + ' ' + gen + '대' : '');
}
DS.zoneSub = zoneSub;
// 2.6: 마을 사람이 오갈 옆 칸 — 맨땅이고, 가게 · 문 · 다른 사람 · 출구 길이 아닌 쪽 (없으면 제자리에만)
function npcAlt(z, p) {
  var c = p.look % 2 ? [p.x + 1, p.x - 1] : [p.x - 1, p.x + 1], i, x;
  for (i = 0; i < 2; i++) { x = c[i]; if (x < 1 || x >= z.w - 1) continue;
    var k = DS.TILE_CH[z.rows[p.y][x]]; if (k !== 'plain' && k !== 'sand') continue;
    if (z.pois.some(function (q) { return q !== p && ((q.x === x && q.y === p.y) || (q.ax === x && q.y === p.y) || (q.t === 'shop' && x >= q.bx && x <= q.bx + 2 && p.y >= q.by && p.y <= q.by + 2)); })) continue;
    return x; }
  return null;
}
function enterZone(id, from, pos) {
  var z = DS.buildZone(id), s = G.save;
  syncVitals();
  G.zone = z; G.scn = null; G.aim = null; G.bossId = null; G.pendPoi = null; G.ending = false; G.wasCombat = false; G.gain = { exp: 0, gold: 0, loot: [] };
  G.goal = null; G.bcast = null; G.mercSeen = false; G.stats = { kills: {}, dmg: {} }; G.dangerOn = false; G.bearLost = [];
  s.zone = id; s.visited[id] = true; if (z.town) s.town = id;
  if (pos && !(pos.x >= 0 && pos.y >= 0 && pos.x < z.w && pos.y < z.h && DS.COST[DS.TILE_CH[z.rows[pos.y][pos.x]] || 'plain'][0] > 0)) pos = null;
  var start = pos || DS.zoneEntry(z, from);
  var nU = DS.partySpecs ? DS.partySpecs(s).length : 3;      // 2.2.2: 무리는 싸우는 유닛 수만큼 불어난다 (DS.packOf)
  var spawns = z.spawns.map(function (g) { return DS.packOf ? DS.packOf(g, nU) : { id: g.id, x: g.x, y: g.y, L: g.L, list: g.list.slice() }; });
  var block = new Uint8Array(z.w * z.h), decor = [];
  z.pois.forEach(function (p) { if (p.t === 'npc' || p.t === 'arena') { block[p.y * z.w + p.x] = 1; var dc = { x: p.x, y: p.y, sprite: p.sprite || 'npc_' + (p.look % 4), flip: p.look % 2 === 1 }; decor.push(dc);
    if (p.t === 'npc' && z.town) { var ax = npcAlt(z, p); p.ax = ax; p.dx = 0; if (ax != null) { dc.ax = ax; dc.poi = p; block[p.y * z.w + ax] = 1; } } } });      // 2.6: 마을 사람은 옆 칸과 제자리를 오간다 (두 칸 모두 막아 겹치지 않게 — view.js drawDecor)      // r39: 연무장 교관(arena.js)도 마을 사람처럼 선다
  var sim = new DS.Sim({ map: z.rows, mode: z.town ? 'town' : 'zone', spawns: spawns, seed: (Date.now() & 0xffff) + 1, inv: s.items, block: block,
    mk: function (type, o) { return DS.fieldSpec(type, o.L, { x: o.x, y: o.y, grp: o.grp, zone: id, save: s }); } });      // 2.2.7: DS.fieldSpec (tune.js — 세기 0.72 · 체력 · 공격 손잡이) · zone: 기획팀 정예 무리가 어느 지역인지 안다
  G.sim = sim; G.lost = []; if (DS.shadeUI) DS.shadeUI.off();
  var sbS = [];
  if (!(DS.egPassOn && DS.egPassOn(s))) { if (DS.sbTick) sbS = DS.sbTick(s); if (DS.mercTidy) DS.mercTidy(s); }      // 2.2.0: 가주가 떠난 가문은 막사의 같은 병과가 잇는다 · 3.3.0: 스무 해 창 동안은 편성을 건드리지 않는다
  placeParty(sim, start.x, start.y);
  sim.hunt = false;
  if (DS.fieldEnter) DS.fieldEnter(sim, z, s);      // r47: 들판의 기습·필드 보스 (field.js)
  markPois();
  G.view.setScene(sim, { rows: z.rows, theme: z.theme, seed: z.seed, pois: z.pois, decor: decor });
  select(G.sel); renderChips(); renderActs(); updateQuest(); renderSys();
  $('#zName').textContent = z.name; $('#zSub').textContent = z.town ? '마을' : zoneRec(z); if (DS.hudCal) try { DS.hudCal(); } catch (x) {}      // r35 달력
  $('#boss').hidden = true; layoutInsets();
  zoneBgm(z);
  sbS.forEach(function (e) { if (e.text) later(e.text, 4200); });
  bannerSoon(z.name, zoneSub(z, s), 2400);      // 이야기 창이 떠 있으면 닫힌 뒤에 · 2.6: 마을의 아랫줄은 처음 몇 번만 안내, 그 뒤로는 달력과 가문 (계절이 바뀌었으면 그 한 줄)
  G.pendCamp = z.town ? campPick(s) : null; G.campAt = performance.now() + 1600;
  if (z.town && DS.egPassOn && DS.egPassOn(s)) { if (DS.egPassOpen) setTimeout(function () { if (G.zone === z && DS.egPassOn(s) && !document.querySelector('.ov.egpass')) DS.egPassOpen(s); }, 400); }      // 3.3.0: 스무 해 창이 열려 있다 — 마을 판정을 건너뛰고 그 창을 그 면에서 다시 연다
  if (z.town && DS.egPassOn && DS.egPassOn(s)) {}
  else if (z.town && DS.ageCheck && DS.linSettle) {      // 나이: 마을에 들어서면 쉬는 때 — 성년·노년·천수
    var aq = []; try { aq = DS.ageCheck(s, z.name).concat(DS.ageSettle ? DS.ageSettle(s, z.name) : []); } catch (x) { if (DS.DEBUG) throw x; }      // 자연사만 확정 (싸움 밖에서 down 인 지휘관은 정상 플레이에선 생기지 않는다 — 시험의 유령을 건드리지 않게)
    if (aq.length) { G.lineageQ = (G.lineageQ || []).concat(aq); setTimeout(function () { if (G.zone === z && !G.scn && G.sim && !G.sim.combat) lineageFlush(function () { rebuildParty(); persist(); }); }, 900); }
    if (DS.egLateNote && DS.egCallOpen && DS.egCallOpen(s) && s.eg.call.late && !s.eg.call.seen) setTimeout(function go() { if (G.zone !== z || G.scn) return; if (G.hold > 0) { setTimeout(go, 800); return; } DS.egLateNote(s); }, 1600);      // 3.3.0: 3.2.x 의 진행 중 장 — 밀린 새벽 알림 (한 번)
  }
  persist();
}
DS.enterZone = enterZone;
// ───────── 시나리오 ─────────
function startScenario(s) {
  var sv = G.save, me = G.sim.byId[G.sel];
  syncVitals();
  G.ret = G.keepRet || { zone: G.zone.id, pos: me ? { x: me.x, y: me.y } : null }; G.keepRet = null;      // 2.2.3: 갱도 층을 잇달아 들어가면 처음 들어온 자리로 돌아간다
  sortieFree(function () { if (DS.mercTidy) DS.mercTidy(sv); });      // 2.2.8: 출전 목록 = 맹주 + 출전한 가주 둘 (+ 가문원) — 들판 싸움이 막 끝나지 않았어도 들어가기 전에 자리를 채운다
  sortieNote();
  if (DS.ui && DS.ui.takeSnap) DS.ui.takeSnap(s);      // 2.2.2: 결과 창의 경험치 막대는 이 순간(싸움 직전)부터 — 관문 창을 거치지 않고 들어와도
  G.scnPL = null; try { G.scnPL = { id: s.id, pit: s.pit || 0, L: DS.partyL(sv) }; } catch (x) {}      // 2.6: 전멸 화면의 「우리 평균」은 들어설 때의 평균 (싸우다 가주가 쓰러지면 그 가문이 1레벨로 내려가, 뒤에 재면 엉뚱하게 「레벨이 모자랐다」고 했다)
  var b = DS.buildScenario(s, DS.partySpecs ? DS.partySpecs(sv).length : sv.party.length, sv.chars[sv.hero] ? sv.chars[sv.hero].cls : 'inf');
  var sim = new DS.Sim({ map: b.map, units: b.units, mk: b.mk, objective: b.objective, waves: b.waves, seed: (Date.now() & 0xffff) + s.id, inv: sv.items, mode: 'scn' });
  G.sim = sim; G.scn = s; G.aim = null; G.bossId = null; G.pendPoi = null; G.ending = false; G.gain = { exp: 0, gold: 0, loot: [] }; G.wasCombat = false; G.lost = [];
  G.goal = null; G.bcast = null; G.pendCamp = null; G.scnSaid = false; G.stats = { kills: {}, dmg: {} }; G.dangerOn = false; G.bearLost = [];
  var cvS = $('#cv'); if (cvS) cvS.classList.remove('defeat');
  sim.heroId = 'c' + sv.hero; G.er = null; G.erased = []; G.erSavedN = 0; G.erMarkN = 0; erBandOff();
  if (s.boss === 'herald') { sv.erN = (sv.erN || 0) + 1; sim.erSeed = [sv.hero, sv.name || '', (sv.eg && sv.eg.gen) || 1, sv.erN].join(':'); }      // r17 boss: 이름 지우기 대상은 저장 + 30번 시도 횟수로 정해진다 (같은 시도면 같은 사람, 다시 하면 다른 사람)
  if (DS.linBattleStart) DS.linBattleStart(sv);      // 갓 숨진 이를 관에 모실 때는 다음 싸움 전까지
  placeParty(sim, 6, 17, b.start);
  if (DS.shadeArm) { if (DS.shadeUI) DS.shadeUI.off(); DS.shadeArm(sim, sv, { scn: s }); }      // 2.5.0 이름 부르기: 출전마다 부를 이름 (shade.js — 갱도 · 다음 세대의 장도)
  sim.hunt = !!sv.opt.hunt;
  G.view.setScene(sim, { rows: b.map, theme: b.theme, seed: s.id });
  select(G.sel); renderChips(); renderActs(); updateQuest(); renderSys();
  $('#zName').textContent = s.name; $('#zSub').textContent = s.pit ? '던전' : '시나리오 ' + s.id; if (DS.hudCal) try { DS.hudCal(); } catch (x) {}
  $('#boss').hidden = true; layoutInsets();
  G.mournOn = false; DS.Audio.bgm('battle');
  bannerSoon(s.pit ? s.name : '시나리오 ' + s.id, s.pit ? josa(DS.BOSSES[s.boss] ? DS.BOSSES[s.boss].name : '갱도지기', '을를') + ' 쓰러뜨려라' : s.name + (s.boss ? ', ' + DS.BOSSES[s.boss].name + ' 격파' : ', 습격을 모두 막아라'), 2600);
  G.beatArm = true; G.beatAt = performance.now(); G.beatT = G.beatAt + BEAT_MS;      // 2.6 첫 박자: 띠가 내리꽂히고 한 박자(1.2초) 뒤에 싸움이 움직인다 (loop1 이 띠가 뜬 때부터 다시 잰다 · 훈수 말풍선은 0.8초에 — mission.js)
}
var BEAT_MS = 1200;
DS.startScenario = startScenario;
// 2.2.3 갱도 결과 창의 「다음 층 · 같은 층 다시 · 다시 도전」: 들판으로 나가지 않고 곧장 그 층으로 (돌아갈 자리 G.ret 는 처음 들어온 그대로).
//   진 뒤에는 남은 사람이 있어야 한다 (가문들은 막사에서 잇는다 · 맹주는 의식에서 정한다). 싸울 이가 없거나 층이 잠겼으면 예전처럼 교회 · 들판으로
function pitChain(lost) {
  var f = G.pitGo, sv = G.save, r = G.ret; G.pitGo = null;
  var sc = f ? DS.pit(f) : null, why = sc ? scnLock(sc) : 'none';
  G.scn = null; G.ending = false;
  if (!why && DS.sbTick) bnNote(DS.sbTick(sv));
  sortieFree(function () { if (DS.mercTidy) DS.mercTidy(sv); });      // 2.2.8: 다음 층 앞에서 빈 출전 자리를 채운다
  if (why || !DS.partySpecs(sv).length) { if (why && why !== 'none') toast(why, 2600); backToField(lost); if (!lost) flushPromos(); return; }
  G.keepRet = r;
  if (DS.pitGo) DS.pitGo(f); else startScenario(sc);
}
function backToField(lost) {
  var r = G.ret || { zone: G.save.town }, cvD = $('#cv'); if (cvD) cvD.classList.remove('defeat');
  if (lost) { enterZone(G.save.town, null, churchPos(G.save.town)); return; }
  enterZone(r.zone, null, r.pos);
}
function churchPos(town) { var z = DS.buildZone(town), p = z.pois.filter(function (p) { return p.t === 'shop' && p.kind === 'church'; })[0]; return p ? { x: p.x, y: p.y + 1 } : null; }
function onWin() {
  if (G.ending) return; G.ending = true;
  var s = G.scn, sv = G.save, before = DS.charList(sv).map(function (c) { return c.id; });
  DS.Audio.bgm('victory'); if (!G.save.opt.bgm) A('win');
  dangerOff();
  syncVitals();
  G.vetUps = meritAll(10);
  var ulw0 = DS.ultOpen && DS.ultOpen(sv);
  var out = DS.applyClear(sv, s), drops = (G.gain.loot || []).slice(), bl = null;      // r38: 필살기가 깨어나면(시나리오 3) 들판에 돌아와 「타고난 필살기가 깨어났다」 창 (loop1 이 본다)
  // 전리품: 싸우며 주운 것 + 보스(갱도 층)가 남긴 것 → 결과 창이 out.drops 를 읽는다
  try { bl = s.pit ? (DS.pitLoot ? DS.pitLoot(sv, s.pit) : null) : (DS.bossLoot ? DS.bossLoot(sv, s, out.first) : null); } catch (x) { bl = null; }
  if (bl && bl.length) drops = drops.concat(bl);
  if (out.gear && DS.gear(out.gear)) drops.unshift({ kind: 'gear', id: out.gear, n: 1, grade: DS.gear(out.gear).grade, name: DS.gear(out.gear).name, boss: s.boss || 'scn' });      // 2.1.0: 정해진 보상 전설 (맹세의 검 · 용뼈 창)
  out.drops = drops; if (!ulw0 && DS.ultOpen && DS.ultOpen(sv)) G.ulwArm = true;
  if (s.boss === 'herald') { if (sv.erLast && sv.erLast.g !== ((DS.egActive && DS.egActive(sv) && sv.eg && sv.eg.gen) || 1)) sv.erPrev = sv.erLast;      // r24: 지난 대에 왕이 쥐고 간 이름 — 이 대의 장을 닫는 낭독이 먼저 부른다 (endgame.js egCloseLines)
    sv.erLast = { g: (DS.egActive && DS.egActive(sv) && sv.eg && sv.eg.gen) || 1, names: (G.erased || []).slice(), saved: G.erSavedN || 0, marked: G.erMarkN || 0 }; }      // r17 boss: 맺음 낭독이 읽는다
  barkAny('win', true);      // r32 전투 대사
  linEnd(true);      // 2.9 가계도: 쓰러진 지휘관은 숨을 거둔다 (예전: 간신히 일어났다) · 함께 이긴 부부의 정·출산 · 슬픔 판 수
  persist();
  // r26 juice: 마지막 적이 쓰러지면 잠깐 번쩍 → 「승리」 띠가 내리꽂힌다 → 결과 창
  var bh = G.bossHold > performance.now();
  if (G.view && !calm()) { G.view.flashA = Math.max(G.view.flashA || 0, 0.08); }
  setTimeout(function () { if (G.scn !== s) return; vban('win', '승리', s.pit ? s.name : '시나리오 ' + s.id + ' · ' + s.name, 1250); A('slam'); if (DS.Audio.duck) DS.Audio.duck(6, 1400); if (G.view && !calm()) G.view.shake = Math.max(G.view.shake || 0, 0.25); }, bh ? 1500 : 380);
  setTimeout(function () {
    story(out.first && !s.pit ? s.outro : null, function () { DS.saveTick(); persist(); DS.showResult(s, out, function () { lineageFlush(function () { if (G.pitGo) pitChain(false); else { backToField(false); flushPromos(); } }); }); }, s.name);
  }, bh ? 3100 : 1900);
}
// ───────── 가계도 (2.9) ─────────
// 싸움이 끝났다: 시나리오면 슬픔 판 수·부부의 정·출산(이겼을 때), 그리고 쓰러진 지휘관의 죽음 확정 → 사건을 G.lineageQ 에
function linEnd(win) {
  var sv = G.save, at = G.scn ? G.scn.name : (G.zone ? G.zone.name : ''), q = [];
  if (!DS.linSettle) return;
  try {
    if (G.scn && DS.linAfterScn) q = q.concat(DS.linAfterScn(sv, { win: !!win, cmds: DS.linPresent(G.sim).cmds, mercs: DS.linPresent(G.sim).mercs, scn: DS.linScnKey ? DS.linScnKey(G.scn) : G.scn.id }));
    if (DS.ageCheck) q = q.concat(DS.ageCheck(sv, at));      // 나이: 싸움이 끝난 때만 — 성년·노년·천수 (지휘관은 아래 linSettle 이 사인 「천수를 누림」으로 확정)
    q = q.concat(DS.linSettle(sv, at));
  } catch (x) { if (DS.DEBUG) throw x; }
  G.lineageQ = (G.lineageQ || []).concat(q);
}
// 쌓인 가계도 사건을 화면에 넘긴다. lineage_ui 의 DS.openLineageRite(queue, done) 가 있으면 그 창(후계 의식·관·출생 알림)이, 없으면 자동으로 후계를 정하고 토스트로.
function lineageFlush(cb) {
  if (DS.egPassOn && DS.egPassOn(G.save)) { if (cb) cb(); return; }      // 3.3.0: 스무 해 창 동안은 그 창이 다룬다
  var sv = G.save, q = G.lineageQ || [], fin = function () { G.riteBusy = false; if (DS.linVacant && DS.linVacant(sv).length) (DS.linAutoAll(sv) || []).forEach(function (e) { if (e.ev) later(DS.linEvText(sv, e.ev), 4200); }); if (sv.runs && sv.runs.n !== G.runsN) { G.runsN = sv.runs.n; DS.markPois(); } persist(); if (cb) cb(); };      // 2.3.2: 대가 끊겨 깬 시나리오가 사라졌으면 입구 표시 · 목표 줄을 곧바로
  G.lineageQ = [];
  q.filter(function (e) { return e && e.t === 'streak'; }).forEach(function (e) { later(e.text, 5200); }); q = q.filter(function (e) { return !(e && e.t === 'streak'); });      // 나선 방지: 토스트 한 줄
  var AGEV = { adult: 1, elder: 1, mnat: 1, adultWait: 1 }, ag = q.filter(function (e) { return e && AGEV[e.t]; });      // 나이 소식: age_ui 의 DS.openAgeNews(목록) 가 있으면 그 창, 없으면 토스트
  if (ag.length) { q = q.filter(function (e) { return !(e && AGEV[e.t]); }); if (DS.openAgeNews) { try { DS.openAgeNews(ag); } catch (x) { if (DS.DEBUG) throw x; } } else ag.forEach(function (e) { var tx = e.text || (e.ev ? DS.linEvText(sv, e.ev) : ''); if (tx) later(tx, 4200); }); }
  if (!DS.linSettle || (!q.length && !(DS.linVacant && DS.linVacant(sv).length))) { if (cb) cb(); return; }
  if (DS.openLineageRite) { try { G.riteBusy = true; DS.openLineageRite(q, fin); return; } catch (x) { G.riteBusy = false; if (DS.DEBUG) throw x; } }      // 3.2.2: 후계 의식이 여럿 대기할 때(전멸) 첫 의식 뒤 rebuildParty 의 안전망이 남은 자리를 먼저 채워, 다음 의식이 「정할 수 없습니다」로 닫히지 않던 것
  q.forEach(function (e) { if (e.ev && e.t !== 'heir') later(DS.linEvText(sv, e.ev), 4200); });
  fin();
}
DS.lineageFlush = lineageFlush;
// r8 hud: 전멸 화면의 까닭 — 레벨 차 · 가장 아팠던 상대 · 남은 소모품 (자동은 폭탄·기운초를 쓰지 않는다)
function loseWhy() {
  var sv = G.save, s = G.scn, out = [], st = G.stats || {}, it = sv.items || {}, top = null, k;
  try {
    if (s) { var rec = recL(s), pl = G.scnPL && G.scnPL.id === s.id && G.scnPL.pit === (s.pit || 0) && G.scnPL.L > 0 ? G.scnPL.L : DS.partyL(sv); out.push((DS.recText ? DS.recText(s) : '권장 ' + lvText(rec)) + ', 우리 평균 ' + lvText(pl) + (pl < rec ? ', ' + (rec - pl) + '레벨 모자랐다' : '')); }
    for (k in st.hurt || {}) if (!top || st.hurt[k] > st.hurt[top]) top = k;
    if (top && st.hurtAll > 0) out.push('가장 아팠던 상대 ' + top + ', 받은 피해의 ' + Math.round(st.hurt[top] / st.hurtAll * 100) + '%');
    out.push(it.endo > 0 ? '남은 기운초 ' + it.endo + ' (자동 전투는 안 씀)' : '기운초 없음 (잡화점)');
  } catch (x) { if (DS.DEBUG) throw x; }
  return out;
}
function onLose() {
  if (G.ending) return; G.ending = true;
  var sv = G.save, n = sv.party.filter(function (id) { return sv.chars[id] && sv.chars[id].down; }).length + (G.bearLost || []).length, why = loseWhy(), hd = !!(sv.chars[sv.hero] && sv.chars[sv.hero].down), pitF = G.scn && G.scn.pit ? G.scn.pit : 0;      // 4.0: 쓰러진 대장 + 그 자리에서 잠든 든 사람
  dangerOff(); DS.Audio.bgm(null); A('lose'); G.mournOn = true; setTimeout(function () { if (G.mournOn && G.ending) DS.Audio.bgm('mourn'); }, 1300);      // 2.6 애도 곡: 「전멸」 소리가 가라앉으면 시작해 의식 · 교회 앞까지 잇는다
  var cvL = $('#cv'); if (cvL) cvL.classList.add('defeat');      // r26: 화면이 잿빛으로 가라앉고 「전멸」이 떨어진다
  setTimeout(function () { if (G.ending) { vban('lose', '전멸', '', 1000); A('slam'); } }, 420);
  linEnd(false); persist();      // 2.9 가계도: 쓰러진 지휘관은 모두 숨을 거두었다 (부활 골드 없음) — 교회에서 후계를 정한다
  setTimeout(function () {
    toastOff();
    var o = overlay('<div class="result lose r26">' + (DS.sceneArt ? DS.sceneArt('lose') || '' : '') + '<div class="rhead"><span class="rskull">' + icon('skull', 34) + '</span><h2><span class="gtext">전멸</span></h2></div><p class="gfx-in" style="--i:0">가주 ' + n + '명이 쓰러져 돌아오지 못한다. 가문과 남은 이들이 ' + esc(DS.ZONES[sv.town].name) + ' 교회로 돌아왔다.</p>' +
      (why.length ? '<ul class="why">' + why.map(function (t, i) { return '<li class="gfx-in" style="--i:' + (i + 1) + '">' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="dim">' + (hd ? '교회에서 맹주의 뒤를 이을 사람을 정한다. ' : '') + '가주를 잃은 가문은 막사의 같은 병과가 잇는다. 없으면 빈 가문으로 남는다.</p>' +
      (pitF ? '<div class="pitrb two"><button class="btn gold" data-pitre="' + pitF + '">다시 도전<small class="num">' + pitF + '층</small></button><button class="btn" data-close>나가기<small>교회로</small></button></div></div>' : '<button class="btn gold wide" data-close>교회로</button></div>'), 'modal center');      // 2.2.3: 갱도에서 지면 같은 층 다시 · 나가기
    if (pitF) o.addEventListener('click', function (e) { if (e.target.closest('[data-pitre]')) { A('ok'); G.pitGo = pitF; o.close(); } });
    o.onclose = function () { lineageFlush(function () { if (G.pitGo) pitChain(true); else backToField(true); }); };
  }, 1400);
}

// ───────── 조작 ─────────
DS.select = function (id) { return select(id); }; DS.renderActs = function () { return renderActs(); };      // 2.1.0: 시험(t47)이 조작할 사람을 고른다
function select(id) {
  var sim = G.sim, u = sim && sim.byId[id]; if (!u || u.dead) { u = sim && sim.cmds()[0]; if (!u) return; }
  G.sel = u.id; sim.leader = u.id; G.view.sel = u.id; G.view.focus = u.id; G.view.pan = { x: 0, y: 0 }; G.view.tgt = u.order && u.order.tid || null;
  cancelAim(); renderActs(); renderSys();
  for (var k in G.chipEls) G.chipEls[k].el.classList.toggle('sel', k === u.id);
  chipFollow(u.id);      // 2.2.2: 밀어 보는 칩 줄에서 고른 가문이 보이게 (부드럽게)
}
function order(u, o) { softResume(); G.itemsOpen = null; G.sim.setOrder(u.id, o); G.view.pan = { x: 0, y: 0 }; G.view.tgt = o && o.tid && G.sim.byId[o.tid] && G.sim.byId[o.tid].side === 'enemy' ? o.tid : null; }
function poiAt(t) {
  var ps = G.zone && !G.scn ? G.zone.pois : [];
  for (var i = 0; i < ps.length; i++) {
    var p = ps[i];
    if ((p.t === 'npc' || p.t === 'arena') && (p.x === t.x || (p.ax != null && p.ax === t.x)) && p.y === t.y) return p;
    if ((p.t === 'gate' || p.t === 'dungeon') && Math.abs(t.x - p.x) <= 1 && t.y <= p.y && t.y >= p.y - 2) return p;
    if (p.t === 'shop' && t.x >= p.bx && t.x <= p.bx + 2 && t.y >= p.by && t.y <= p.by + 2) return p;
  }
  return null;
}
function rangeTiles(u, S) {
  var out = [], sim = G.sim, r0 = S.rng ? S.rng[0] : 1, r1 = S.rng ? S.rng[1] : S.len || 1;
  for (var dy = -r1; dy <= r1; dy++) for (var dx = -r1; dx <= r1; dx++) {
    var d = Math.abs(dx) + Math.abs(dy);
    if (d > r1 || d < r0 || !sim.inb(u.x + dx, u.y + dy)) continue;
    if (S.tg === 'dir' && dx && dy) continue;
    out.push([u.x + dx, u.y + dy]);
  }
  return out;
}
function cancelAim() { G.aim = null; if (G.view) G.view.aim = null; $$('#acts .act.on').forEach(function (b) { b.classList.remove('on'); }); var cb = $('#chips'); if (cb) cb.classList.remove('pick'); setInfo(); }
// 약초·마나초 (2.3.3: 겨누지 않고 조작하는 이가 바로 먹는다 — 이 표는 이름 · 건넬 거리만 남는다)
var ITEM_AIM = { herb: { name: '약초', tg: 'ally', rng: [0, 2], give: 'herb' }, mana: { name: '마나초', tg: 'ally', rng: [0, 2], give: 'mana', cmdOnly: true } };
function aimDef(id) { return SK[id] || ITEM_AIM[id]; }
function startAim(id, who) {      // r36: who = 쓰는 이 (맹주의 필살기는 다른 가문을 고른 채로도 맹주가 쓴다)
  var me = G.sim.byId[who || G.sel], S = aimDef(id); if (!me || !S) return;
  if (G.aim && G.aim.id === id) { cancelAim(); return; }
  cancelAim();
  if (S.tg === 'self' || S.tg === 'multi') { order(me, { t: 'skill', id: id }); A('ok'); return; }
  G.aim = { id: id, pt: null, miss: 0, who: who || null };
  if (S.tg === 'ally') $('#chips').classList.add('pick');      // 초상을 눌러도 된다는 표시
  G.view.aim = { range: rangeTiles(me, S), area: [] };
  var b = $(S.give ? '#acts .act[data-it="' + id + '"]' : S.item ? '#acts .act[data-it="' + id.slice(2) + '"]' : '#acts .act[data-sk="' + id + '"]'); if (b) b.classList.add('on');
  setInfo(S.name + ': ' + (S.give ? (S.cmdOnly ? '사용할 가문을 누른다' : '사용할 아군을 누른다') + ', 한 번 더 누르면 자신' :
    ({ enemy: '적을 누른다', ally: '아군이나 위쪽 초상을 누른다', tile: '칸을 누르고, 한 번 더 눌러 사용', dir: '방향을 누른다' }[S.tg] || '')));
  A('tap');
}
// 눌린 칸에서 한 칸 안(대각선 포함)에 있는 가장 가까운 대상. 움직이는 적을 엄지로 정확히 찍기는 어렵다.
function nearUnit(t, side, cmdOnly) {
  var best = null, bd = 9;
  G.sim.units.forEach(function (v) {
    if (v.dead || v.side !== side || (cmdOnly && v.role !== 'cmd')) return;
    var vn = DS.fpNear ? DS.fpNear(v, t.x, t.y) : v, dx = Math.abs(vn.x - t.x), dy = Math.abs(vn.y - t.y); if (dx > 1 || dy > 1) return;      // 2.3.0: 큰 몸은 가장 가까운 칸으로
    if (dx + dy < bd) { bd = dx + dy; best = v; }
  });
  return best;
}
// 약초·마나초를 대상에게 건넨다 (2칸 안으로 다가가서 쓴다)
function giveItem(me, key, v) {
  var nm = DS.ITEMS[key].name;
  var ib = $('#acts .act[data-it="' + key + '"]'), ce = G.chipEls[v.id];
  if (key === 'mana' && !v.mmp) { deny(ce ? ce.el : ib, '마나 없음', v.name + ': 마나를 쓰지 않는다'); if (!ce) toast(v.name + ': 마나를 쓰지 않는다'); return false; }
  if (key === 'herb' ? v.hp >= v.mhp : v.mp >= v.mmp) { deny(ce ? ce.el : ib, '가득', v.name + ': ' + (key === 'herb' ? '체력이' : '마나가') + ' 가득하다'); return false; }      // r26: 글 상자 대신 그 칩(없으면 단추)이 흔들린다
  order(me, { t: 'item', key: key, tid: v.id }); A('ok');
  if (v !== me) setInfo(nm + ' → ' + v.name, 1800);
  return true;
}
function aimAt(me, id, S, v) {
  cancelAim();
  if (S.give) { giveItem(me, S.give, v); return; }
  order(me, { t: 'skill', id: id, tid: v.id }); A('ok');
}
function aimTap(t, u) {
  var me = G.sim.byId[(G.aim && G.aim.who) || G.sel], id = G.aim.id, S = aimDef(id);
  if (S.tg === 'enemy' || S.tg === 'ally') {
    // 빗맞혀도 한 칸 안의 가장 가까운 대상으로 잡아 준다. 아무도 없으면 조준을 풀지 않고 기다린다 (빈 곳을 두 번 누르면 취소).
    var side = S.tg === 'enemy' ? 'enemy' : 'ally', v = u && !u.dead && u.side === side && !(S.cmdOnly && u.role !== 'cmd') ? u : nearUnit(t, side, S.cmdOnly);
    if (v) { aimAt(me, id, S, v); return; }
    A('cancel');
    if (++G.aim.miss >= 2) { cancelAim(); return; }
    setInfo(S.name + ': 사거리 안에 대상이 없다. 빈 곳을 누르면 취소.');
    return;
  }
  if (S.tg === 'dir') { if (t.x !== me.x || t.y !== me.y) { order(me, { t: 'skill', id: id, x: t.x, y: t.y }); A('ok'); } cancelAim(); return; }
  // 칸 지정: 두 번 눌러 확정
  if (G.aim.pt && G.aim.pt.x === t.x && G.aim.pt.y === t.y) { order(me, { t: 'skill', id: id, x: t.x, y: t.y }); A('ok'); cancelAim(); return; }
  if (!G.sim.inb(t.x, t.y)) { cancelAim(); return; }
  G.aim.pt = t; G.view.aim.area = G.sim.areaTiles(me, S, t.x, t.y) || []; A('tap');
}
// 버프·상태 이상과 남은 초: [[종류, 이름, 초], …]
function fxList(u) {
  var out = [], k, b;
  for (k in u.buffs) { b = u.buffs[k]; out.push([b.p < 0 ? 'bad' : k, k === 'quick' ? '신속' : (k === 'atk' ? '공격' : k === 'def' ? '방어' : k === 'ctr' ? '되치기' : k) + (b.p < 0 ? '↓' : '↑'), Math.ceil(b.t), k === 'quick' ? '속' : (k === 'atk' ? '공' : k === 'def' ? '방' : k === 'ctr' ? '되' : k) + (b.p < 0 ? '↓' : '↑')]); }
  if (u.st && typeof u.st === 'object') for (k in u.st) out.push([k, DS.STATUS[k] ? DS.STATUS[k].name : k, Math.ceil(u.st[k].t), k === 'poison' ? '독' : k === 'slow' ? '둔' : (DS.STATUS[k] ? DS.STATUS[k].name : k).charAt(0)]);
  return out;
}
function unitLine(u) {
  var fx = fxList(u).map(function (f) { return f[1] + ' ' + f[2] + '초'; }).join(', ');
  if (u.side === 'enemy') return (u.role === 'boss' ? '보스 ' : '') + u.name + ', ' + lvText(u.L) + ', HP ' + Math.ceil(u.hp) + '/' + u.mhp + (fx ? ', ' + fx : u.info ? ' — ' + u.info : '');
  return u.name + ', HP ' + Math.ceil(u.hp) + '/' + u.mhp + (fx ? ', ' + fx : '');
}
// 2.2.2: 빈 칸을 눌렀을 때, 눌린 자리에서 화면으로 18px(적어도 0.6칸) 안에 선 유닛 — 지도를 멀리 보면 칸이 작아 손가락이 빗맞는다
function tapUnit(t) {
  if (t.fx == null || !G.view) return null;
  var r = Math.max(0.6, 18 / (16 * (G.view.k || 2))), best = null, bd = r * r;
  G.sim.units.forEach(function (u) {
    if (u.dead || u.gone) return; var v = G.view.vu[u.id], ux = (v ? v.x : u.x) + 0.5, uy = (v ? v.y : u.y) + 0.45, dx = t.fx - ux, dy = t.fy - uy, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = u; }
  });
  return best;
}
function onTap(t) {
  var sim = G.sim, me = sim.byId[G.sel], u = sim.at(t.x, t.y) || (poiAt(t) ? null : tapUnit(t));
  DS.Audio.unlock();
  if (!me || me.dead || G.ending) return;
  if (G.aim) return aimTap(t, u);
  if (u && u.id === me.id && !G.scn) { var ps = poiAt(t); if (ps && ps.t !== 'npc' && ps.t !== 'arena' && Math.abs(me.x - ps.x) + Math.abs(me.y - ps.y) <= 0) { A('tap'); openPoi(ps); return; } }      // 가게 문 칸에 선 채 자기 칸을 눌렀다: 선택이 아니라 문을 연다 (QA)
  if (u && u.side === 'ally') { A('tap'); select(u.role === 'cmd' ? u.id : u.owner); if (u.role !== 'cmd') setInfo(unitLine(u), 2600); return; }
  var g0 = G.goal, ge0 = G.guideExit; G.goal = null; G.guideExit = null;      // 직접 찍은 명령이 길 안내보다 먼저다
  if (u && u.side === 'enemy') { order(me, { t: 'attack', tid: u.id }); setInfo(unitLine(u), 3500); A('ok'); return; }
  var p = poiAt(t);
  if (p) {
    G.pendPoi = p; A('tap');
    if (Math.abs(me.x - p.x) + Math.abs(me.y - p.y) <= (p.t === 'npc' || p.t === 'arena' ? 1 : 0)) { openPoi(p); return; }
    order(me, { t: 'move', x: p.x, y: p.y }); G.view.mark = { x: p.x, y: p.y, t: 0 }; return;      // 마을 사람이 선 칸은 막혀 있어, 엔진이 닿을 수 있는 가장 가까운 이웃 칸으로 데려다준다 (아래쪽 칸이 막힌 사람도 말을 건다)
  }
  if (!sim.inb(t.x, t.y)) return;
  if (DS.Joy && DS.Joy.on() && !G.scn) { var ex = exitAt(t); if (ex) { G.pendPoi = null; order(me, { t: 'move', x: ex[0], y: ex[1] }); G.view.mark = { x: ex[0], y: ex[1], t: 0 }; A('tap'); return; } }      // r40: 조이스틱 모드에서도 지역 출구는 눌러서 간다
  if (DS.Joy && DS.Joy.on()) { var ne = nearUnit(t, 'enemy'); if (ne) { G.pendPoi = null; order(me, { t: 'attack', tid: ne.id }); setInfo(unitLine(ne), 3500); A('ok'); return; } }      // r40: 조이스틱 모드의 맨땅 누름은 걷지 않으니, 움직이는 적을 한 칸 빗맞혀도 그 적을 친다
  if (DS.Joy && DS.Joy.on()) { G.goal = g0; G.guideExit = ge0; DS.Joy.groundTap(); return; }      // r40: 맨땅 누름은 움직이지 않는다 (조이스틱으로 걷는다 — 설정에서 터치 이동으로 되돌린다)
  G.pendPoi = null; order(me, { t: 'move', x: t.x, y: t.y }); G.view.mark = { x: t.x, y: t.y, t: 0 };
}
// r40: 눌린 칸(한 칸 안)이 지역 출구면 그 출구 칸
function exitAt(t) {
  var ps = G.zone ? G.zone.pois : [];
  for (var i = 0; i < ps.length; i++) { var p = ps[i]; if (p.t !== 'exit') continue; for (var k = 0; k < p.tiles.length; k++) if (Math.abs(p.tiles[k][0] - t.x) + Math.abs(p.tiles[k][1] - t.y) <= 1) return p.tiles[k]; }
  return null;
}
// 선두 가까이에 달려든 적이 있는가. 멀리서 이어지는 실랑이는 발목을 잡지 않는다.
function pressed() {
  var sim = G.sim, me = sim && sim.byId[G.sel]; if (!me || !sim.combat) return false;
  return sim.units.some(function (u) { return u.side === 'enemy' && u.aggro && !u.dead && Math.abs(u.x - me.x) + Math.abs(u.y - me.y) <= 6; });
}
function openPoi(p) {
  G.pendPoi = null;
  if (pressed()) { toast('적이 가까이 있어 들어갈 수 없다'); return; }
  if (p.t === 'npc') { A('tap'); var nsp = p.sprite || 'npc_' + (p.look % 4); story((npcLine(p.look) || [p.text]).map(function (l) { return l && typeof l === 'object' ? (l.c ? l : { w: l.w, c: nsp, t: l.t }) : { w: '', c: nsp, t: l }; }), null, '마을 사람'); return; }      // 2.6: 마을 사람은 제 얼굴로 말한다 (초상 = 지도에 선 그 모습)
  if (p.t === 'arena') { if (DS.arenaOpen) { A('ok'); DS.arenaOpen(); } return; }      // r39 연무장
  if (p.t === 'shop') {
    var hl = p.kind === 'house' ? npcLine('house') : null;
    if (hl) { A('tap'); story(hl, null, '집주인'); return; }
    A('ok'); DS.openShop(p.kind);
    if (p.kind === 'merc' && !G.mercSeen) { G.mercSeen = true; updateQuest(); }
    return;
  }
  if (p.t === 'dungeon' && DS.openPit) { A('ok'); DS.openPit(scnLock(gateScn(p))); return; }      // 2.2.3: 층 고르기 창 (같은 층 다시 · 다음 층 도전)
  if (p.t === 'gate' || p.t === 'dungeon') { A('ok'); DS.openGate(gateScn(p), scnLock(gateScn(p))); return; }
}
// 마을 사람·민가의 대사: DS.LORE.npc(지역, 번호 또는 'house', 저장) 이 있으면 그것으로
function npcLine(i) {
  var L = DS.LORE, t = null;
  if (L && typeof L.npc === 'function') { try { t = L.npc(G.zone.id, i, G.save); } catch (x) { t = null; } }
  return t ? (t instanceof Array ? t : [t]) : null;
}
// 마을에 들어설 때 들려줄 이야기 한 편 (조건이 맞고 아직 안 본 것)
function campPick(sv) {
  var L = DS.LORE, list = L && L.camp; if (!(list instanceof Array)) return null;
  var masters = DS.fuseUnions ? DS.fuseUnions(sv).length : 0;      // 1.0.1: 함께 오른 묶음 수 (자유 합일)
  var top = 0; for (var k in sv.cleared) if (sv.cleared[k] && +k > top) top = +k;
  for (var i = 0; i < list.length; i++) {
    var c = list[i], w = c && c.when || {}; if (!c || !c.lines || !c.lines.length || sv.seen['camp_' + c.id]) continue;
    if (w.cleared != null && sv.cleared[w.cleared] && w.cleared < top - 3 && w.fused == null && !w.ended) { sv.seen['camp_' + c.id] = 1; continue; }      // 한참 지난 막간은 본 것으로 (옛 저장에서 지난 이야기가 마을마다 하나씩 밀려 나오던 것 — QA)
    if (w.cleared != null && !sv.cleared[w.cleared]) continue;
    if (w.L != null && DS.partyL(sv) < w.L) continue;
    if (w.fused != null && w.fused !== false && !(typeof w.fused === 'string' ? masters >= 1 : masters >= (w.fused === true ? 1 : +w.fused))) continue;
    if (w.eg) { if (!(DS.egActive && DS.egActive(sv) && !DS.egPassOn(sv) && DS.egGen(sv) >= (w.eg.g || 2) && DS.egDone(sv) >= (w.eg.after || 0))) continue; }      // 3.3.0: 맺음 뒤 막간을 장 안에 나눈다 — 그 세대 이상이고 그 장에서 after 판 이상 깼을 때
    else if (w.ended && DS.nextScn(sv)) continue;
    if (w.pit != null && (sv.pit || 1) < w.pit) continue;      // 시나리오팀(2.8): 갱도 층 조건 — 그 층이 열렸으면
    return c;
  }
  return null;
}
function bindInput(cv) {
  var down = null;
  if (DS.Joy) DS.Joy.bind(cv, { tap: function (x, y) { if (G.hold === 0 && performance.now() - (G.shutAt || 0) > 300) onTap(G.view.tileAt(x, y)); }, order: order });      // r40 조이스틱 (src/joystick.js)
  cv.addEventListener('pointerdown', function (e) { if (DS.Joy && DS.Joy.claim(e, cv)) return; down = { x: e.clientX, y: e.clientY, px: G.view.pan.x, py: G.view.pan.y, moved: false, id: e.pointerId }; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
  cv.addEventListener('pointermove', function (e) {
    if (!down || e.pointerId !== down.id) return;
    var dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!down.moved && Math.abs(dx) + Math.abs(dy) < 12) return;
    down.moved = true; G.view.pan.x = down.px - dx / G.view.k; G.view.pan.y = down.py - dy / G.view.k;
  });
  cv.addEventListener('pointerup', function (e) {
    if (!down || e.pointerId !== down.id) return;
    var d = down; down = null;
    if (!d.moved && G.hold === 0 && performance.now() - (G.shutAt || 0) > 300) onTap(G.view.tileAt(e.clientX, e.clientY));      // 3차 ui: 창 단추(닫기·길 안내) 연타의 둘째 탭이 맵에 떨어져 지휘관을 엉뚱한 칸으로 보내거나 길 안내를 지우던 것
  });
  cv.addEventListener('pointercancel', function () { down = null; });
}

// ───────── HUD ─────────
function vetDots() {      // 1.0.5: 공훈 계급이 바뀌면 표식만 바꿔 끼운다 (0.4초마다 살핀다)
  var sv = G.save; if (!sv || !G.chipEls) return;
  for (var id in G.chipEls) { var c = G.chipEls[id], ch = sv.chars[+id.slice(1)]; if (!ch) continue; var r = vetOfCh(sv, ch); if (c.vr === r) continue; c.vr = r; var o = c.el.querySelector('.vet'); if (o) o.outerHTML = vetBadge(r); }
}
// 1.0.5: 위 초상에 공훈 계급 표식 (갈매기 1~3 · 별 · 금별) — 가주(대장은 대장 줄)의 공훈
function vetOfCh(sv, ch) { return ch ? DS.hRank(ch) : -1; }      // r42: 가문 공훈 계급 (위 초상의 표식은 가문의 것)      // r32: 10의 자리 = 불멸 뒤의 별
function vetBadge(r) {
  if (!(r >= 1)) return '<i class="vet" hidden></i>';
  var st = Math.floor(r / 10); r = r % 10;
  var nm = (DS.VET[r] ? DS.VET[r].name : '') + (st && DS.STAR_NAME ? ', ' + DS.STAR_NAME[st] : ''), g = '';
  if (r <= 3) { for (var i = 0; i < r; i++) g += '<path d="M2 ' + (9 - i * 3.2) + 'l4-3 4 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'; }
  else g = '<path d="M6 1.2l1.4 3 3.3.4-2.4 2.3.6 3.3L6 8.6 3.1 10.2l.6-3.3L1.3 4.6l3.3-.4z" fill="currentColor"/>';
  return '<i class="vet v' + r + (st ? ' st st' + st : '') + '" title="가문 공훈 ' + nm + '" aria-label="가문 공훈 ' + nm + '"><svg viewBox="0 0 12 12" width="12" height="12">' + g + '</svg>' + (st ? '<b class="vst">' + '★★★'.slice(0, st) + '</b>' : '') + '</i>';
}
DS.vetBadge = vetBadge;
function renderChips() {
  var box = $('#chips'), sv = G.save, sim = G.sim; box.innerHTML = ''; G.chipEls = {};
  if (DS.partyOrder) sv.party = DS.partyOrder(sv, sv.party);      // 2.2.3: 맹주 → 다른 가문(부대 탭 격자 차례). 덧붙여진 낡은 차례를 바로잡는다
  var n = sv.party.filter(function (id) { return sv.chars[id]; }).length;
  box.classList.toggle('swipe', n > 3); chipSwipe(box);      // 2.2.2: 넷부터는 2.1.2 의 큰 칩 그대로 한 줄 — 390 폭에 셋, 옆으로 밀어 본다 (작은 칩은 뺐다)
  sv.party.forEach(function (id) {
    var ch = sv.chars[id]; if (!ch) return;
    var uid = 'c' + id, u = sim && sim.byId[uid];
    var nm = DS.charName(ch);      // 클래스명은 길다 — 이름은 한 줄을 통째로 쓰고, 단·레벨은 얼굴 아래에 둔다
    // r26 art: 둥근 초상 테(--hc 가문 색) · 문장은 테 왼쪽 위 · 레벨은 초상 밑 알약 · 이름 옆 작은 「n단」 · 체력 막대 뒤에 흰 잔상(lag)
    var el = h('<button class="chip' + (u ? '' : ' down') + '" data-u="' + uid + '" style="--hc:' + (DS.FLAG[ch.cls] || '#c9a96a') + '"><span class="por">' + charSpr(ch, 1.5) + '</span>' + (DS.houseCrestOf ? '<i class="ccr">' + DS.houseCrestOf(sv, ch, 16) + '</i>' : '') + (id === sv.hero && DS.lgBadge ? DS.lgBadge(sv).replace('lgxgen', 'lgxgen chipg') : '') + '<em class="lv num">' + DS.tierOfL(ch.L) + '단 <i>Lv' + DS.lvOfL(ch.L) + '</i></em>' +
      vetBadge(vetOfCh(sv, ch)) + '<span class="cn' + (nm.length >= 7 ? ' long' : '') + '"><b>' + esc(nm) + '</b></span><small class="tr clv num">Lv' + DS.lvOfL(ch.L) + '</small>' +
      '<span class="bars"><i class="hp"><u class="lag"></u><u class="v"></u></i><i class="mp"><u></u></i><i class="tk"><u></u></i></span><span class="md"></span><i class="urd" aria-hidden="true">필</i><i class="crs" aria-hidden="true">예</i><span class="ghost">' + icon('skull', 16) + '<b>쓰러짐</b><small>' + esc(nm) + '</small></span></button>');
    el.addEventListener('click', function () {
      DS.Audio.unlock();
      var cu = G.sim.byId[uid], S = G.aim && aimDef(G.aim.id), me = G.sim.byId[G.sel];
      if (!cu) { toast(id === sv.hero ? '숨을 거둔 맹주다. 싸움이 끝나면 누가 이을지 고른다.' : '쓰러진 가주다. 싸움이 끝나면 막사의 같은 병과가 잇는다.'); return; }
      if (S && S.tg === 'ally' && me && !cu.dead) { aimAt(me, G.aim.id, S, cu); return; }      // 아군 대상 기술·아이템은 초상을 눌러 건넨다
      if (G.sel === uid && !G.sim.combat && DS.charSheetOpen) { A('tap'); DS.charSheetOpen(id); return; }      // 2.2.0: 고른 가문을 한 번 더 누르면 가문 창 (장비는 머리에)
      A('tap'); select(uid);
    });
    box.appendChild(el);
    G.chipEls[uid] = { el: el, hp: $('.hp u.v', el), lag: $('.hp u.lag', el), mp: $('.mp u', el), tk: $('.tk u', el), lv: $('em', el), tr: $('.tr', el), L: ch.L, md: $('.md', el), ch: id, sig: '', hpW: -1 };
  });
  if (G.chipEls[G.sel]) G.chipEls[G.sel].el.classList.add('sel');
  G.mdT = 0;
  chipFollow(G.sel, true); chipEdges(box);
}
// ───────── 2.2.2 칩 줄 밀기 ─────────
//   손가락: 브라우저의 가로 스크롤(관성 · scroll-snap 이 칩 가장자리에 맞춘다). 마우스·펜: 끌면 직접 밀고, 놓으면 관성 뒤 가장 가까운 칩 가장자리로.
//   8px 넘게 움직였으면 그 누름은 칩 고르기가 아니다 (click 을 잡아먹는다). 세로로 먼저 움직이면 끌기를 시작하지 않는다.
//   더 있는 쪽 가장자리만 흐리게(fl · fr).
var CHIP_TH = 8;
function chipEdges(box) {
  box = box || $('#chips'); if (!box) return;
  var sl = box.scrollLeft, mx = box.scrollWidth - box.clientWidth, on = box.classList.contains('swipe');
  box.classList.toggle('fl', on && sl > 2); box.classList.toggle('fr', on && sl < mx - 2);
}
function chipStep(box) { var c = box.querySelector('.chip'), c2 = c && c.nextElementSibling; return c2 ? c2.offsetLeft - c.offsetLeft : c ? c.offsetWidth : 80; }
function chipSnapTo(box, left, smooth, rd) {      // 가장 가까운 칩 가장자리 (칩 너비가 모두 같다) · rd: Math.ceil / Math.floor (따라가기 — 칩이 잘리지 않게)
  var st = chipStep(box), mx = box.scrollWidth - box.clientWidth, t = Math.max(0, Math.min(mx, (rd || Math.round)(left / st - (rd ? (rd === Math.ceil ? 0.02 : -0.02) : 0)) * st));
  if (mx - t < st / 2) t = mx;
  var sm = smooth && !calm(); box._tgt = t; box._tgtT = sm ? performance.now() : 0;      // 가는 중인 자리 (부드럽게 미는 동안 따라가기가 그 자리를 기준으로 본다)
  try { box.scrollTo({ left: t, behavior: sm ? 'smooth' : 'auto' }); } catch (x) { box.scrollLeft = t; }
  return t;
}
function chipGlideStop(box) { if (box._gl) { cancelAnimationFrame(box._gl); box._gl = 0; } }
function chipSwipe(box) {
  if (!box || box._sw) return; box._sw = 1;
  var d = null, raf = 0;
  box.addEventListener('pointerdown', function (e) {
    if (e.button > 0 || !box.classList.contains('swipe')) { d = null; return; }
    chipGlideStop(box); box._tgtT = 0;
    d = { id: e.pointerId, x: e.clientX, y: e.clientY, sl: box.scrollLeft, m: e.pointerType !== 'touch', moved: false, drag: false, lx: e.clientX, lt: performance.now(), v: 0 };
  });
  box.addEventListener('pointermove', function (e) {
    if (!d || e.pointerId !== d.id) return;
    var dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dx) > CHIP_TH && Math.abs(dx) >= Math.abs(dy)) d.moved = true;
    if (!d.moved && Math.abs(dy) > CHIP_TH) { d = null; return; }      // 세로 몸짓은 놓아준다
    if (!d.m || !d.moved) return;
    if (!d.drag) { d.drag = true; box.classList.add('drag'); try { box.setPointerCapture(e.pointerId); } catch (x) {} }
    var now = performance.now(), dt = Math.max(1, now - d.lt);
    d.v = 0.7 * ((e.clientX - d.lx) / dt) + 0.3 * d.v; d.lx = e.clientX; d.lt = now;
    box.scrollLeft = d.sl - dx; e.preventDefault();
  });
  function end(e, cancel) {
    if (!d || (e && e.pointerId !== d.id)) return;
    var q = d; d = null;
    if (cancel && !q.m) q.moved = true;      // 손가락: 브라우저가 가로 스크롤을 넘겨받았다
    if (q.moved) G.chipDragT = performance.now();
    if (!q.drag) return;
    try { box.releasePointerCapture(q.id); } catch (x) {}
    var v = performance.now() - q.lt > 90 ? 0 : -q.v, last = performance.now();      // px/ms (멈췄다 놓으면 관성 없음)
    if (calm()) v = 0;
    (function glide() {
      var now = performance.now(), dt = Math.min(40, now - last); last = now;
      if (Math.abs(v) > 0.05) { var before = box.scrollLeft; box.scrollLeft += v * dt; v *= Math.pow(0.94, dt / 16); if (box.scrollLeft !== before) { box._gl = requestAnimationFrame(glide); return; } }
      box._gl = 0; box.classList.remove('drag'); chipSnapTo(box, box.scrollLeft, true);
    })();
  }
  box.addEventListener('pointerup', function (e) { end(e, false); });
  box.addEventListener('pointercancel', function (e) { end(e, true); });
  box.addEventListener('click', function (e) {      // 끌기 끝의 click 은 고르기가 아니다
    if (performance.now() - (G.chipDragT || 0) < 400) { e.stopPropagation(); e.preventDefault(); G.chipDragT = 0; }
  }, true);
  box.addEventListener('scroll', function () {
    if (d && !d.moved && Math.abs(box.scrollLeft - d.sl) > CHIP_TH) d.moved = true;
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; chipEdges(box); });
  }, { passive: true });
  box.addEventListener('scrollend', function () { box._tgtT = 0; chipEdges(box); }, { passive: true });
  window.addEventListener('resize', function () { chipEdges(box); });
}
// 고른 칩이 줄 밖에 있으면 보이는 자리까지 민다 (now: 바로)
function chipFollow(uid, now) {
  var ce = G.chipEls[uid], box = $('#chips'); if (!ce || !box || !box.classList.contains('swipe') || box.classList.contains('drag')) return;
  var cs = getComputedStyle(box), pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0;
  var br = box.getBoundingClientRect(), cr = ce.el.getBoundingClientRect(), t = null, rd = null, sl = box.scrollLeft;
  var base = box._tgtT && performance.now() - box._tgtT < 2500 && Math.abs(sl - box._tgt) > 1 ? box._tgt : sl, l = cr.left + sl - base, r = cr.right + sl - base;      // 부드럽게 미는 중이면 닿을 자리에서 본다 (2.2.4: 0.7초로 끊지 않고 닿을 때까지 — 느린 폰에서는 밀기가 더 걸린다. scrollend · 손가락이 닿으면 지운다)
  if (l < br.left + pl - 1) { t = base + l - (br.left + pl); rd = Math.floor; }
  else if (r > br.right - pr + 1) { t = base + r - (br.right - pr); rd = Math.ceil; }
  if (t == null) return;
  chipGlideStop(box); chipSnapTo(box, t, !now, rd);
}
DS.chipFollow = chipFollow;
// 전투 아이템 버튼에 올릴 소모품. 아이템팀의 DS.itemKeys 가 있으면 그 순서로 "가진 것만", 없으면 지금의 네 가지.
var ITEM_BASE = ['herb', 'mana', 'endo'];      // r15: 소모품은 회복 셋뿐
function itemKeys() {
  var ks = null, inv = G.save.items;
  if (DS.itemKeys) { try { ks = DS.itemKeys(G.save); } catch (x) { ks = null; } }
  if (!ks || !ks.filter) return ITEM_BASE;
  ks = ks.filter(function (k) { return DS.ITEMS[k] && (inv[k] > 0 || ITEM_BASE.indexOf(k) >= 0); });
  return ks.length ? ks : ITEM_BASE;
}
// r8 hud: 막대에는 기본 넷만(가진 것만 — 약초는 0개여도 남긴다: 떨어진 줄 알아야 한다), 나머지는 「더 보기」 단추 하나 뒤로.
//   전투 밖 전용(귀환 두루마리·모닥불 꾸러미)은 싸움·시나리오 중에는 그리지 않는다. 나머지가 한 가지뿐이면 단추 뒤에 숨기지 않고 그대로 깐다.
//   칸 수(n)는 싸움 안팎에서 같게 잡는다 — 싸움이 붙고 끝나는 순간에 단추 자리가 밀려 엉뚱한 것을 누르지 않게.
function itemPlan() {
  var inv = G.save.items, fight = !!(G.scn || (G.sim && G.sim.combat));
  var base = ITEM_BASE.filter(function (k) { return DS.ITEMS[k]; });      // r15: 늘 세 칸 (0개여도 남긴다 — 떨어진 줄 알아야 한다). 「더 보기」는 없앴다
  var sh = !!(DS.shadeOn && DS.shadeOn(G.sim));      // 2.5.0: 출전이면 넷째 칸에 「이름 부르기」 (판이 시작될 때 정해져 싸우는 동안 칸 수가 바뀌지 않는다)
  return { base: base, ext: [], one: false, open: false, aim: null, n: base.length + (sh ? 1 : 0), sh: sh, sig: base.join() + (fight ? '|f' : '') + (sh ? '|s' : '') };
}
// 전투 밖 전용 소모품 (아이템팀 DS.useFieldItem — 쓸 수 없으면 까닭을 돌려준다)
function useCtl(key) {
  var it = DS.ITEMS[key], why = DS.useFieldItem ? DS.useFieldItem(key) : '지금은 쓸 수 없다';
  if (why) { var ub = $('#acts .act[data-it="' + key + '"]'); if (ub) deny(ub, '안 됨', it.name + ': ' + why); else { A('deny'); toast(it.name + ': ' + why); } return false; }
  A('ok'); if (it.ctl === 'camp') { toast(it.name + '. 부대의 체력과 마나가 30% 찼다'); if (G.sim) G.sim.cmds().forEach(function (c) { G.view.burst(c.x, c.y, ['#f6cf57', '#ffb36b'], 8, { up: 30, grav: -8, spd: 10, life: 0.8 }); }); syncVitals(); }
  else if (it.ctl === 'recall') toast(it.name + '. ' + josa(DS.ZONES[G.save.town].name, '으로') + ' 돌아왔다');
  return true;
}
DS.useCtl = useCtl;
// r26 art: 기술 종류 → 아이콘·소켓 빛 (치유 · 지킴 · 강화 · 마법 · 원거리 · 공격)
var ITEM_IC = { herb: 'herb', mana: 'mana', endo: 'stamina' };
function skIcon(S, ty) { var k = S && S.ic && DS.ICONS.indexOf('sk_' + S.ic) >= 0 ? 'sk_' + S.ic : 'sk_' + (ty || skType(S)); return k; }      // 2.2.6: 기술마다 그림 (없으면 종류 그림)
DS.skIcon = skIcon;
function skType(S) {
  var ef = S.eff || [], t = function (k) { return ef.some(function (e) { return e.t === k; }); }, dmg = ef.filter(function (e) { return e.t === 'dmg'; })[0];
  if (S.fist) return 'fist';      // 2.2.5 승려(무투가)의 맨손 기술
  if (!dmg && ef.some(function (e) { return e.t === 'buff' && e.s === 'shd'; })) return 'guard';      // 2.2.6 보호막
  if (t('heal') || t('cleanse')) return 'heal';
  if (!dmg && ef.some(function (e) { return e.t === 'buff' && e.p > 0 && e.s === 'def'; })) return 'guard';
  if (!dmg && ef.some(function (e) { return (e.t === 'buff' && e.p > 0) || e.t === 'gauge'; })) return 'buff';
  if ((dmg && (dmg.type === 'magic' || dmg.type === 'holy')) || (!dmg && (t('status') || t('buff') || t('summon')))) return 'magic';
  if (/arrow/.test(S.fx || '') || (S.rng && S.rng[1] > 1 && !S.leap)) return 'ranged';
  return 'attack';
}
// 명령 줄: 기술은 줄바꿈 격자(다섯까지 한 줄, 여섯부터 두 줄), 아이템은 그 아래 늘 보이는 낮은 줄
// 2.6 다음에 배울 기술: 병과의 기술 표(DS.CLASSES[cls].skills = [기술, 배우는 단])에서 지금 단보다 위의 첫 기술. 돌려주는 것 { S, t 단, p 그 단까지 얼마나 왔나 0~1, lv 「Lv 3/10」 }
function nextSkill(me) {
  if (!me || me.role !== 'cmd' || me.shade) return null;
  var ch = G.save && G.save.chars[me.ch], C = DS.CLASSES[me.cls], L = (ch && ch.L) || me.L || 1, t = DS.tierOfL(L), best = null;
  if (!C || !C.skills || (ch && DS.risen && DS.risen(ch))) return null;
  C.skills.forEach(function (q) { if (q[1] > t && SK[q[0]] && (!best || q[1] < best[1])) best = q; });
  if (!best) return null;
  var N = DS.LV_PER_TIER, L0 = (t - 1) * N + 1, L1 = (best[1] - 1) * N + 1;
  return { S: SK[best[0]], id: best[0], t: best[1], p: Math.max(0.04, Math.min(1, (L - L0) / Math.max(1, L1 - L0))), lv: 'Lv ' + DS.lvOfL(L) + '/' + N };
}
// 2.6 갓 배운 기술: 같은 사람의 기술 목록에 새 기술이 생기면 표를 달아 둔다 (세션 안에서만 — 저장에 남기지 않는다). 돌려주는 것 { 기술: 생긴 때 }
function skFresh(me) {
  if (!me || me.role !== 'cmd' || me.shade) return {};
  if (G.skSave !== G.save) { G.skSave = G.save; G.skSeen = {}; G.skNew = {}; }
  var ch = G.save.chars[me.ch], key = me.ch + ':' + ((ch && ch.pid) || 0), was = G.skSeen[key], now = performance.now(), nw = G.skNew[key] || (G.skNew[key] = {}), got = false, k;
  if (was) me.skills.forEach(function (id) { if (was.indexOf(id) < 0 && SK[id] && !SK[id].ult) { nw[id] = now; got = true; } });
  G.skSeen[key] = me.skills.slice();
  for (k in nw) if (now - nw[k] > 45000 || me.skills.indexOf(k) < 0) delete nw[k];
  if (got) { A('ready'); var sv = G.save; setTimeout(function () { var b = $('#acts .act.isnew'); if (!b) return; if (!sv.seen.skNew && !G.quiet) { sv.seen.skNew = 1; coach(b, '새 기술. 눌러서 쓴다', { ms: 5000 }); } }, 350); }
  return nw;
}
DS.nextSkill = nextSkill;
function renderActs() {
  var box = $('#acts'), me = G.sim && G.sim.byId[G.sel]; if (!box) return; box.innerHTML = ''; G.actEls = [];
  // r25 dock: 기술 줄은 늘 자리를 잡는다(기술이 없으면 「기술 없음」 빈 칸) — 마을·필드·싸움에서 아래 띠 높이가 같아 지도가 튀지 않는다
  var n = me ? me.skills.length : 0;
  G.ultSig = ultSig();
  var nx = me ? nextSkill(me) : null;      // 2.6: 빈 기술 줄에는 다음에 배울 기술을 흐리게 보여 준다 (「기술 없음」 빈 상자 대신)
  if (!n) box.appendChild(h('<div class="arow sk none" style="--n:4"><span class="sknone' + (nx ? ' f26nx' : '') + '">' + (nx ? '<i class="nxi" aria-hidden="true">' + icon(skIcon(nx.S, skType(nx.S)), 22) + '</i><span class="nxt"><b>다음 기술 「' + esc(nx.S.name) + '」 · ' + nx.t + '단에 배운다</b><i class="nxbar" aria-hidden="true"><u style="width:' + Math.round(nx.p * 100) + '%"></u></i></span><small class="num">' + esc(nx.lv) + '</small>' : '<b>' + (me ? '기술 없음' : '가문을 고르면 기술') + '</b>') + '</span></div>'));
  if (!me) return;
  var fresh = skFresh(me);
  if (n) {
    var row = h('<div class="arow sk' + (n > 5 ? ' two' : '') + (n > 4 ? ' scroll' : '') + '" style="--n:' + (n > 5 ? Math.ceil(n / 2) : Math.max(4, n)) + '"></div>');
    me.skills.forEach(function (id) {
      var S = SK[id];
      // r26 art: 둥근 소켓(종류 색 빛) + 충전 고리(--p) + 이름 · 위 모서리에 마나 보석과 틱 값
      var ty = skType(S);
      var b = h('<button class="act" data-sk="' + id + '" style="--k:var(--sk-' + ty + ')" aria-label="' + esc(S.name + ', 마나 ' + S.mp + ', 틱 ' + S.tick) + '"><span class="sock"><i class="cring"></i>' + icon(skIcon(S, ty), 22) + '</span><b>' + esc(S.name) + '</b>' +
        '<i class="mpb">' + icon('drop', 9) + '<span class="m">' + S.mp + '</span></i><i class="tkc">' + icon('tick', 9) + '<span class="t">' + S.tick + '</span></i><i class="rsvb" aria-hidden="true">예약</i></button>');
      if (fresh[id]) { b.classList.add('isnew'); if (performance.now() - fresh[id] < 3000) b.classList.add('newp'); b.appendChild(h('<i class="newb" aria-hidden="true">NEW</i>')); }      // 2.6: 갓 배운 기술 — 「NEW」 표와 3초 맥박 (누르면 걷힌다)
      b.addEventListener('click', function () {
        DS.Audio.unlock();
        var me2 = G.sim.byId[G.sel]; if (!me2) return;
        if (fresh[id]) { delete fresh[id]; b.classList.remove('isnew', 'newp'); var nb0 = $('.newb', b); if (nb0) nb0.remove(); }
        if (me2.auto && rsvTap(me2, id, b)) return;      // 2.2.3: 자동 전투 중 지금 못 쓰는 기술은 예약 (다시 누르면 취소)
        if (me2.mp < S.mp) { deny(b, '마나', '마나가 모자라다. ' + Math.floor(me2.mp) + ' / ' + S.mp); return; }      // r26: 글 상자 대신 흔들림 + 꼬리표 (다시 누르면 글로)
        if (b.classList.contains('off') && !(G.aim && G.aim.id === id)) setInfo(S.name + ' 예약. 틱 ' + Math.ceil(S.tick * G.sim.q(me2)) + '에 쓴다', 2600);      // r8 hud: 「모자랍니다」가 오류처럼 읽혔다 → r26: 예약은 정보 줄에 (예약 꼬리표가 단추에 뜬다)
        else if (!(G.aim && G.aim.id === id)) { b.classList.remove('fire'); void b.offsetWidth; b.classList.add('fire'); haptic(8); }
        startAim(id);
      });
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      var lp = null; b.addEventListener('pointerdown', function () { lp = setTimeout(function () { toast(S.name + ': ' + S.desc, 3500); }, 480); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { clearTimeout(lp); }); });
      row.appendChild(b);
      G.actEls.push({ b: b, S: S, id: id, p: -1 });
    });
    for (var g = n; g < 4; g++) row.appendChild(g === n && nx ? h('<i class="skg f26nx" title="' + esc('다음 기술 「' + nx.S.name + '」 · ' + nx.t + '단에 배운다') + '">' + icon(skIcon(nx.S, skType(nx.S)), 18) + '<small>' + nx.t + '단</small></i>') : h('<i class="skg" aria-hidden="true"></i>'));      // r25 dock: 넷보다 적으면 빈 칸으로 채워 칸 너비를 같게
    var uu = ultU();      // 2.1.0: 누구나 필살기를 타고난다 — 금테 칸은 지금 조작하는 사람의 것 (쓰러지면 맹주, 그다음 살아 있는 가주). 5단 아래면 잠긴 칸
    if (uu) ultBtn(row, uu, me);
    box.appendChild(row);
  }
  var plan = itemPlan(), irow = h('<div class="arow it r8' + (plan.n > 4 ? ' more' : '') + '" style="--n:' + plan.n + '"></div>'), tray = plan.open ? h('<div class="arow it more tray"></div>') : null;
  G.itemSig = plan.sig;
  function itemBtn(key, into) {
    var nm = DS.ITEMS[key].name, ik = ITEM_IC[key] || 'potion', b = h('<button class="act item ' + ik + (nm.length > 4 ? ' long' : '') + '" data-it="' + key + '" aria-label="' + esc(nm) + '">' + icon(ik, 24) + '<b class="nm">' + esc(nm) + '</b><span class="cnt num"><i class="n">0</i></span></button>');      // r26 art: 둥근 슬롯 · 그림 + 개수 배지 (이름은 길게 누르면)
    b.addEventListener('click', function () {
      DS.Audio.unlock();
      var me2 = G.sim.byId[G.sel]; if (!me2) return;
      if (!(G.save.items[key] > 0)) { deny(b, '없음', josa(nm, '이가') + ' 없다. 잡화점에서 판다'); return; }
      // 펼친 판에서 고르면 판부터 닫는다 — 겨누는 동안 판이 전장 아래쪽을 덮어 칸을 볼 수도 누를 수도 없었다 (겨눈 물건 이름은 「더 보기」 단추에 남는다)
      if (into === tray && tray) { G.itemsOpen = null; cancelAim(); if (!DS.ITEMS[key].ctl) { if (SK['i_' + key]) startAim('i_' + key); else if (ITEM_AIM[key]) giveItem(me2, key, me2); else { order(me2, { t: 'item', key: key }); A('ok'); } } else useCtl(key); renderActs(); return; }
      if (DS.ITEMS[key].ctl) { useCtl(key); return; }      // 귀환 두루마리·모닥불 꾸러미: 전투 밖에서 컨트롤러가 처리 (전엔 엔진에 넘어가 개수만 깎였다)
      if (SK['i_' + key]) { startAim('i_' + key); return; }      // 폭탄처럼 기술로 풀리는 소모품 (엔진이 일반 처리)
      if (key === 'endo' && G.sim.t < (G.sim.endoT || 0)) { deny(b, Math.ceil(G.sim.endoT - G.sim.t) + '초', '기운초는 ' + Math.ceil(G.sim.endoT - G.sim.t) + '초 뒤에 다시 쓴다'); return; }      // 2.3.4: 부대가 함께 쉰다
      if (!ITEM_AIM[key]) { cancelAim(); order(me2, { t: 'item', key: key }); A('ok'); return; }      // 기운초처럼 바로 쓰는 것
      // 2.3.3: 약초·마나초는 겨누지 않는다 — 누르면 조작하는 이가 바로 먹는다
      cancelAim(); giveItem(me2, key, me2);
    });
    var lp2 = null; b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    b.addEventListener('pointerdown', function () { lp2 = setTimeout(function () { toast(nm + ': ' + (DS.ITEMS[key].desc || ''), 3500); }, 480); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { clearTimeout(lp2); }); });
    into.appendChild(b);
    G.actEls.push({ b: b, key: key, n: $('.n', b), cnt: -1 });
  }
  plan.base.forEach(function (key) { itemBtn(key, irow); });
  if (plan.sh && DS.shadeUI) DS.shadeUI.btn(irow);      // 2.5.0 이름 부르기 (shade.js)
  box.appendChild(irow); if (tray) box.appendChild(tray);
  updateActs(); layoutInsets();
}
// r32 필살기 단추: 충전 고리(--p = 필살 게이지) · 「필살」 꼬리표 · 가득 차면 금빛으로 빛난다. 누르면 보통 기술처럼 겨눈다 (차지 않았으면 흔들림)
// 2.1.0: 필살기 칸은 조작하는 사람(조이스틱이 쥔 고른 가문의 선두) 몫. 누르면 겨누지 않고 바로 쓴다 (대상은 알아서). 조작하지 않는 사람은 스스로 쓰지 않는다
function ultU() {
  var sim = G.sim, sv = G.save; if (!sim || !sv) return null;
  var me = sim.byId[G.sel]; if (me && me.role !== 'cmd' && me.owner) me = sim.byId[me.owner];
  if (me && !me.dead && me.side === 'ally' && me.role === 'cmd') return me;
  var hu = heroU(); if (hu && !hu.dead) return hu;
  return sim.units.filter(function (u) { return u.side === 'ally' && u.role === 'cmd' && !u.dead; })[0] || null;
}
DS.ultU = ultU;
function ultWho(u) { var sv = G.save, ch = u && sv.chars[u.ch]; if (!ch) return null; return ch.id === sv.hero ? (ch.vac ? null : ch.ps) : DS.bearer(sv, ch); }
function ultInfo(u) {      // { id: 쓸 수 있는 필살기, born: 타고난 것, lock: 잠긴 까닭 }
  var who = ultWho(u), born = who && DS.ultFor ? DS.ultFor(G.save, who) : null;
  if (u && u.ult && SK[u.ult]) return { id: u.ult, born: u.ult, lock: '' };
  return { id: null, born: born && SK[born] ? born : null, lock: !born ? '필살기가 없다' : !(DS.ultAwake && DS.ultAwake(who)) ? '5단에 깨어난다. 지금 ' + DS.tierOfL(DS.pL(who)) + '단' : '아직 깨어나지 않았다' };
}
function ultSig() { var u = ultU(); if (!u) return ''; var i = ultInfo(u); return u.id + ':' + (u.dead ? 'x' : (i.id || '') + '/' + (i.born || '') + (i.lock ? 'l' : '')); }
function ultTarget(u, S) {      // 겨누지 않는다: 보스 → 가장 가까운 적 (치유·가호는 저 스스로나 가장 다친 가주)
  var foes = G.sim.units.filter(function (v) { return !v.dead && v.side !== u.side && v.side !== 'neutral'; }), d = function (v) { return DS.fpDist ? DS.fpDist(v, u) : Math.abs(v.x - u.x) + Math.abs(v.y - u.y); };      // 2.3.0: 큰 몸은 가장 가까운 칸까지
  if (S.tg === 'self' || S.tg === 'multi') return {};
  if (S.tg === 'ally') { var al = G.sim.units.filter(function (v) { return !v.dead && v.side === u.side && v.role === 'cmd'; }).sort(function (a, b) { return a.hp / a.mhp - b.hp / b.mhp; })[0]; return { tid: (al || u).id }; }
  if (!foes.length) return null;
  var boss = foes.filter(function (v) { return v.role === 'boss'; }).sort(function (a, b) { return d(a) - d(b); })[0], f = boss && d(boss) <= 12 ? boss : foes.sort(function (a, b) { return d(a) - d(b); })[0];
  if (S.tg === 'enemy') return { tid: f.id };
  var fn = DS.fpNear ? DS.fpNear(f, u.x, u.y) : f;
  if (S.tg === 'dir') { var dx = fn.x - u.x, dy = fn.y - u.y; return Math.abs(dx) >= Math.abs(dy) ? { x: u.x + (dx > 0 ? 1 : -1), y: u.y } : { x: u.x, y: u.y + (dy > 0 ? 1 : -1) }; }
  return { x: fn.x, y: fn.y };
}
// ───────── 2.2.3 기술 예약 ─────────
// 자동 전투 중(고른 사람이 자동) 지금 못 쓰는 기술(마나 · 틱 · 재사용 · 닿는 대상 · 시전 중)을 누르면 예약 — 엔진(DS.Sim.rsvTry)이 쓸 수 있게 되는 대로 무엇보다 먼저 쓴다.
//   지금 쓸 수 있으면 예전 그대로(겨누기 · 바로 쓰기). 다시 누르면 취소. 영영 못 쓰면(봉인 · 마나 값이 최대 마나를 넘음) 짧은 토스트만. 돌려주는 것: 처리했는가
function rsvNow(u, id) {      // 지금 바로 쓸 수 있는가 (예전 흐름으로 넘긴다)
  var sim = G.sim, S = SK[id]; if (!sim || !S || !u || u.dead) return false;
  if (u.casting || (u.mp || 0) < (S.mp || 0) || u.cd[id] > 0 || u.gauge < S.tick * sim.q(u)) return false;
  if (S.ult && !((u.uc || 0) >= 100)) return false;
  return !!sim.rsvTarget(u, S, sim.foes(u));
}
function rsvTap(u, id, b) {
  var sim = G.sim, S = SK[id]; if (!sim || !S) return false;
  if (S.ult ? u.rsvU : u.rsv === id) { if (S.ult) sim.reserveUlt(u.id, false); else sim.reserve(u.id, null); A('cancel'); setInfo(S.name + ' 예약 취소', 1800); updateActs(); chipRsv(); return true; }
  if (rsvNow(u, id)) return false;
  var why = sim.rsvNever(u, id); if (why) { deny(b, '못 씀', S.name + ': ' + why); return true; }
  cancelAim(); if (u.order && u.order.t === 'skill') u.order = null;
  if (S.ult) sim.reserveUlt(u.id, true); else sim.reserve(u.id, id);
  A('ok'); haptic(8); setInfo(S.name + ' 예약. 쓸 수 있게 되면 가장 먼저 쓴다', 2600); updateActs(); chipRsv();
  return true;
}
DS.rsvTap = function (sk) { var me = G.sim && G.sim.byId[G.sel], b = document.querySelector('#acts .act[data-sk="' + sk + '"]'); return me ? rsvTap(SK[sk] && SK[sk].ult ? ultU() || me : me, sk, b) : false; };      // 시험용
function chipRsv() { if (!G.sim || !G.chipEls) return; for (var k in G.chipEls) { var c = G.chipEls[k], cu = G.sim.byId[k], r = !!(cu && !cu.dead && (cu.rsv || cu.rsvU)); if (r !== !!c.rsv) { c.rsv = r; c.el.classList.toggle('rsv', r); } } }
function fireUlt(u, b) {      // 돌려주는 것: 명령을 냈는가
  var i = ultInfo(u), S = i.id && SK[i.id];
  if (!u || u.dead) { deny(b, '없음', '쓸 사람이 쓰러졌다'); return false; }
  if (!S) { deny(b, '5단부터', (i.born ? SK[i.born].name + ': ' : '') + i.lock); return false; }
  if (u.auto && rsvTap(u, i.id, b)) return false;      // 2.2.3: 덜 찼거나 대상이 없으면 예약 (자동 전투 중)
  if (!((u.uc || 0) >= 100)) { deny(b, '충전 ' + Math.floor(u.uc || 0) + '%', S.name + ': 필살 게이지가 아직 덜 찼다. 싸우는 동안 찬다'); return false; }
  var t = ultTarget(u, S); if (!t) { deny(b, '대상 없음', S.name + ': 쓸 상대가 없다'); return false; }
  cancelAim(); var o = { t: 'skill', id: i.id }; for (var k in t) o[k] = t[k]; order(u, o); A('ok');
  setTimeout(function () { if (G.sim && G.sim.byId[u.id] === u && u.order === o) { u.order = null; setInfo(S.name + ': 쓸 자리를 못 찾아 거두었다', 2200); } }, 5000);      // 누른 그때 쓰는 것 — 못 쓴 명령이 남아 나중에(전체 자동 중에) 저절로 나가지 않게
  return true;
}
DS.fireUlt = function () { var u = ultU(); return u ? fireUlt(u, $('#acts .act.ult')) : false; };
function ultBtn(row, u, me) {
  var i = ultInfo(u), id = i.id || i.born, S = id && SK[id], mine = me === u || (me && me.owner === u.id), lock = !i.id; if (!S && !lock) return;
  var ty = S ? skType(S) : 'attack', nm = S ? S.name : '필살기', who = DS.charName ? DS.charName(G.save.chars[u.ch]) : '';
  row.classList.add('hasult');
  var b = h('<button class="act ult' + (mine ? '' : ' lord') + (lock ? ' lockd' : '') + '" data-sk="' + esc(id || '') + '"' + (lock ? ' aria-disabled="true"' : '') + ' style="--k:var(--sk-' + ty + ')" aria-label="' + esc(who + '의 필살기 ' + nm + (lock ? '. ' + i.lock : S ? '. ' + S.desc : '')) + '"><span class="usock"><i class="uring"></i>' + icon(S ? skIcon(S, ty) : 'sk_' + ty, 22) + '</span><b>' + esc(nm) + '</b><i class="ulab">' + (lock ? '5단부터' : mine ? '✦ 필살' : '✦ ' + esc(String(who).slice(0, 4))) + '</i><i class="upct num"></i><i class="rsvb" aria-hidden="true">예약</i></button>');
  b.addEventListener('click', function () {
    DS.Audio.unlock();
    var u2 = ultU(); if (!u2) { deny(b, '없음', '쓸 사람이 없다'); return; }
    if (fireUlt(u2, b)) { b.classList.remove('fire'); void b.offsetWidth; b.classList.add('fire'); haptic(14); }
  });
  b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  var lp = null; b.addEventListener('pointerdown', function () { lp = setTimeout(function () { toast('필살기 ' + nm + ': ' + (S ? S.desc : '') + (lock ? ' (' + i.lock + ')' : ''), 3800); }, 480); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { clearTimeout(lp); }); });
  row.insertBefore(b, row.firstChild);      // 왼쪽 끝에 붙여 둔다 (기술이 넷을 넘어 줄을 밀어도 늘 보인다)
  G.actEls.push({ b: b, ult: id, hid: u.id, S: S, id: id, p: -1, pc: $('.upct', b), lock: lock });
}
// r36: 맹주의 필살기가 가득하면 맹주 초상 칩에 금빛 「필」. 싸움 밖에서도 찬 채로 기다린다
function ultReady(sim, cu) { return !!(cu && !cu.dead && cu.ult && (cu.uc || 0) >= 100); }
function heroU() { var sim = G.sim, sv = G.save; return sim && sv ? sim.byId['c' + sv.hero] : null; }
function updateUlt(e, me) {
  var uc = Math.floor(me.uc || 0), full = uc >= 100;
  if (uc !== e.p) { e.p = uc; e.b.style.setProperty('--p', uc + '%'); if (e.pc) e.pc.textContent = full ? '' : uc + '%'; }
  var was = e.b.classList.contains('full'); e.b.classList.toggle('full', full);
  if (!was && full && e.rdy && G.sim.combat) { e.b.classList.remove('ping'); void e.b.offsetWidth; e.b.classList.add('ping'); A('ultReady'); }
  e.rdy = true;
  var o = me.order; e.b.classList.toggle('queued', !!(o && o.t === 'skill' && o.id === e.id));
  e.b.classList.toggle('rsv', !!me.rsvU);      // 2.2.3: 필살기 예약
}
function updateActs() {
  var me = G.sim && G.sim.byId[G.sel], els = G.actEls; if (!me || !els) return;
  var q = G.sim.q(me), o = me.order;
  for (var i = 0; i < els.length; i++) {
    var e = els[i];
    if (e.shade) { if (DS.shadeUI) DS.shadeUI.upd(e); continue; }      // 2.5.0 이름 부르기
    if (e.ult || e.lock) { var hu = G.sim.byId[e.hid]; if (hu && !hu.dead && !e.lock) updateUlt(e, hu); continue; }      // 2.1.0: 조작하는 사람의 필살기 칸 (잠긴 칸은 그대로)
    if (e.S) {
      var need = e.S.tick * q, nomp = me.mp < e.S.mp, p = Math.round(Math.min(1, me.gauge / need) * 20) * 5;
      if (p !== e.p) { e.p = p; e.b.style.setProperty('--p', p + '%'); }      // 버튼 바탕에 게이지가 차오른다
      var wasOff = e.b.classList.contains('off'), off = nomp || me.gauge < need;
      e.b.classList.toggle('nomp', nomp); e.b.classList.toggle('off', off);
      if (wasOff && !off && e.rdy && G.sim.combat && !calm()) { var tn = performance.now(); e.b.classList.remove('ping'); void e.b.offsetWidth; e.b.classList.add('ping'); if (tn - (G.readyAt || 0) > 900) { G.readyAt = tn; A('ready'); } }      // r26: 다 찬 순간 한 번 튀고 「띵」
      e.rdy = true;
      e.b.classList.toggle('queued', !!(o && o.t === 'skill' && o.id === e.id));
      var rv = me.rsv === e.id; if (rv !== !!e.rv) { e.rv = rv; e.b.classList.toggle('rsv', rv); e.b.setAttribute('aria-label', e.S.name + ', 마나 ' + e.S.mp + ', 틱 ' + e.S.tick + (rv ? ', 예약됨' : '')); }      // 2.2.3: 예약
    } else {
      var n = G.save.items[e.key] || 0;
      if (n !== e.cnt) { e.cnt = n; e.n.textContent = n; e.b.classList.toggle('off', n <= 0); e.b.setAttribute('aria-label', DS.ITEMS[e.key].name + ' ' + n + '개'); }
      if (e.key === 'endo') { var cl = Math.max(0, Math.ceil((G.sim.endoT || 0) - G.sim.t)); if (cl !== e.cl) { e.cl = cl; e.b.classList.toggle('cool', cl > 0); var ce = e.b.querySelector('.cdn'); if (!ce && cl) { ce = document.createElement('i'); ce.className = 'cdn num'; ce.setAttribute('aria-hidden', 'true'); e.b.appendChild(ce); } if (ce) ce.textContent = cl ? cl : ''; e.b.style.setProperty('--cdp', (cl / ((DS.ENDO || {}).cd || 15) * 100) + '%'); } }      // 2.3.4: 기운초 쉬는 시간
      if (e.key === 'herb') e.b.classList.toggle('hint', (G.herbHint || 0) > performance.now());      // r8 hud: 지휘관이 위태로울 때 약초 단추가 깜빡인다
      e.b.classList.toggle('queued', !!(o && (o.t === 'item' ? o.key === e.key : o.t === 'skill' && o.id === 'i_' + e.key)));
    }
  }
  if (itemPlan().sig !== G.itemSig || ultSig() !== G.ultSig) renderActs();      // r36: 맹주가 필살기를 고르거나 쓰러지면 금테 칸도 다시      // 새 소모품을 줍거나 다 쓰거나, 싸움이 붙고 끝나면 버튼 줄을 다시 짠다
}
function renderSys() {
  var me = G.sim && G.sim.byId[G.sel], sv = G.save; if (!sv) return;
  // r20 house: 왼쪽 묶음(#selSeg) = 고른 가문 하나(문장 + 조작 자동/수동 + 가문원 돌격/호위), 오른쪽 = 부대 전체(전체 자동 켜짐/꺼짐 · 속도 · 멈춤). 글자는 「지금 상태」를 쓴다
  var sch = me && sv.chars[me.ch], hn = sch ? DS.flagName(sch.cls) : '', seg = $('#selSeg');
  var au = !!(me && me.auto), ba = $('#bAutoU');
  ba.classList.toggle('on', au); $('b', ba).textContent = au ? '자동' : '수동'; $('small', ba).textContent = au ? '알아서 싸운다. 필살기도 쓴다' : '누른 곳으로 가고, 닿는 적만 친다';
  ba.setAttribute('aria-label', hn + ' 조작: ' + (au ? '자동' : '수동'));
  var bs = $('#bStance'), side = !!(sch && sch.st === 'side');
  var hasF = !!(sch && DS.mercsOf(sv, sch.id).length);      // 2.2.0: 태세는 따르는 이(맹주 가문의 가문원)가 있을 때만
  if (bs) { bs.hidden = !hasF; bs.classList.toggle('side', side); $('b', bs).textContent = side ? '호위' : '돌격'; $('small', bs).textContent = side ? '맹주 곁만 지킨다. 덜 쓰러진다' : '가문원이 먼저 달려든다'; bs.setAttribute('aria-label', hn + ' 가문원: ' + (side ? '호위' : '돌격')); }
  if (seg) {
    var ck = sch ? sch.cls + (sch.id === sv.hero ? 'L' : '') : '';
    if (seg.dataset.ck !== ck) { seg.dataset.ck = ck; $('#selCrest').innerHTML = sch && DS.houseCrestOf ? DS.houseCrestOf(sv, sch, 20) : ''; var fc = sch ? (DS.FLAG[sch.cls] || '#c9a96a') : '#5a4a36'; seg.style.setProperty('--fc', fc); $('#info').style.setProperty('--fc', fc); }
    seg.classList.toggle('none', !me); $('#selCrest').title = hn;
    var sn = $('#selName'), sh = me ? '<i class="' + (au ? 'au' : 'mn') + '">' + (au ? '자동' : '수동') + '</i>' + (hasF ? '<i class="' + (side ? 'sd' : 'ch') + '">' + (side ? '호위' : '돌격') + '</i>' : '') : '';      // r27 ux: 이름은 위 칩에 있다 — 여기에는 지금 지휘 상태만 (누르면 판)
    if (sn && sn.innerHTML !== sh) sn.innerHTML = sh;
    var spn = $('#spName'); if (spn) { spn.textContent = hn; $('#spCrest').innerHTML = $('#selCrest').innerHTML; var who = sch ? (sch.id === sv.hero ? DS.charName(sch) : DS.bearerName ? DS.bearerName(sv, sch) : '') : ''; $('#spWho').textContent = who ? '가주 ' + who : ''; $('#selPop').style.setProperty('--fc', sch ? (DS.FLAG[sch.cls] || '#c9a96a') : '#5a4a36'); }
    if (!me && selPopOn()) selPop(false);
  }
  $('#bHunt').classList.toggle('on', !!G.sim.hunt); $('#bHunt').hidden = !!(G.zone && G.zone.town && !G.scn);
  $('#bHunt small').textContent = G.sim.hunt ? '켜짐' : '꺼짐'; $('#bHunt').setAttribute('aria-label', (G.scn ? '전체 자동 진행: ' : '전체 자동 사냥: ') + (G.sim.hunt ? '켜짐' : '꺼짐'));
  var spd = DS.spdOf(sv.opt.speed), bsp = $('#bSpeed'); $('#bSpeed b').textContent = spd + '배속'; bsp.dataset.s = DS.SPEEDS.indexOf(spd) + 1;      // r36: 그림 ▶ ▶▶ ▶▶▶ = 1 · 1.5 · 2배속
  bsp.classList.toggle('on', spd > 1); bsp.setAttribute('aria-label', '속도 ' + spd + '배');      // r26: 아이콘이 ▶ ▶▶ ▶▶▶ 로 바뀐다
  $('#bPause').classList.toggle('on', G.pause); $('#bPause b').textContent = G.pause ? '▶' : 'Ⅱ'; $('#bPause small').textContent = G.pause ? '재개' : '멈춤'; $('#bPause').setAttribute('aria-label', G.pause ? '재개' : '멈춤');
  var sg0 = $('#s-game'); if (sg0) sg0.classList.toggle('paused', !!G.pause);
}
var infoT = 0, infoMsg = '', infoShown = null;
// r27 ux: 고른 가문의 지휘 판 (#selPop) — 정보 줄의 문장을 누르면 뜨고, 바깥을 누르거나 ✕ 로 닫는다
function selPopOn() { var p = $('#selPop'); return !!(p && !p.hidden); }
function selPop(on) { var p = $('#selPop'), c = $('#selCtx'); if (!p) return; p.hidden = !on; if (c) { c.classList.toggle('open', !!on); c.setAttribute('aria-expanded', on ? 'true' : 'false'); } if (on) renderSys(); }
DS.selPop = selPop;
function putInfo(text) { if (text === infoShown) return; var el = $('#infoText'); if (!el) return; el.textContent = text; infoShown = text; }
function setInfo(text, ms) { if (text) { infoMsg = text; infoT = performance.now() + (ms || 60000); putInfo(text); } else infoT = 0; }
// 맹주 초상 옆의 가문원 점: 체력에 따라 색이 바뀐다 (2.2.0: 빈 칸 테두리는 없다 — 인구 칸이 없어졌다)
function mercDots() {
  var sv = G.save, sim = G.sim;
  for (var id in G.chipEls) {
    var c = G.chipEls[id]; if (!c.md) continue;
    var ms = DS.mercsOf(sv, c.ch), html = '', sig = '', pop = 0;
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i], u = sim.byId['m' + m.id], live = u && !u.dead, r = live ? u.hp / u.mhp : (m.hp == null ? 1 : m.hp);
      var cls = 'd' + (live ? '' : ' away') + (r < 0.3 ? ' low' : r < 0.6 ? ' mid' : '') + (DS.mercPop(m) > 1 ? ' big' : '');
      sig += cls + ';'; html += '<i class="' + cls + '"></i>'; pop += DS.mercPop(m);
    }
    if (sig !== c.sig) { c.sig = sig; c.md.innerHTML = html; }
  }
}
function updateHud(now) {
  var sim = G.sim, sv = G.save, id, c, u, i, dz = sim.dz && sim.dz.ally;
  for (id in G.chipEls) {
    c = G.chipEls[id]; u = sim.byId[id];
    if (!u || u.dead) { c.el.classList.add('down'); c.el.classList.remove('danger'); continue; }
    c.el.classList.remove('down');
    var hw = Math.max(0, Math.round(u.hp / u.mhp * 1000) / 10);
    if (hw !== c.hpW) { c.hp.style.width = hw + '%'; if (c.lag) { if (hw > c.hpW) { c.lag.style.transition = 'none'; c.lag.style.width = hw + '%'; } else { c.lag.style.transition = ''; c.lag.style.width = hw + '%'; } } c.hpW = hw; }      // r26: 깎인 만큼 흰 잔상이 0.3초 뒤 따라 줄어든다
    c.mp.style.width = (u.mmp ? u.mp / u.mmp * 100 : 0) + '%'; c.tk.style.width = u.gauge + '%';
    c.el.classList.toggle('low', u.hp < u.mhp * 0.35);
    c.el.classList.toggle('danger', !!(dz && dz[u.y * sim.w + u.x]));      // 예고 칸 안에 서 있다
  }
  if (now - (G.mdT || 0) > 400) { G.mdT = now; mercDots(); vetDots(); chipRsv(); for (id in G.chipEls) { c = G.chipEls[id]; var ur = ultReady(sim, sim.byId[id]); if (ur !== !!c.ur) { c.ur = ur; c.el.classList.toggle('ultrdy', ur); c.el.setAttribute('aria-description', ur ? '필살기 준비됨' : ''); } } }      // r36: 필살기가 가득한 집
  // r26: 골드는 한 번에 바뀌지 않고 따라 오른다 (0.35씩) · 쓸 때는 붉게
  var gs = G.goldShown == null ? sv.gold : G.goldShown;
  if (gs !== sv.gold) { var gd = sv.gold - gs, gel = $('#gold'); gs = Math.abs(gd) < 3 || calm() ? sv.gold : gs + Math.ceil(Math.abs(gd) * 0.35) * (gd > 0 ? 1 : -1); G.goldShown = gs; gel.textContent = fmtN(gs);
    if (gd > 0 && now - (G.tickAt || 0) > 70) { G.tickAt = now; A('coinTick'); }
    if (gd < 0 && !gel.classList.contains('spend')) { gel.classList.add('spend'); setTimeout(function () { gel.classList.remove('spend'); }, 600); } }
  else if (G.goldShown == null) { G.goldShown = sv.gold; $('#gold').textContent = fmtN(sv.gold); }
  var me = sim.byId[G.sel];
  // r26: 고른 대장의 체력이 35% 아래면 화면 가장자리가 붉게 뛴다 (싸움·시나리오 중)
  if (G.view) G.view.lowHp = me && !me.dead && (sim.combat || G.scn) && !G.ending ? Math.max(0, Math.min(1, (0.35 - me.hp / me.mhp) / 0.25)) : 0;
  if (me) {
    $('#tick u').style.width = me.gauge + '%'; $('#tickN').textContent = Math.floor(me.gauge);
    var danger = !!(dz && !me.dead && !G.ending && dz[me.y * sim.w + me.x]), fx = fxList(me), sig = '';
    if (danger !== G.dangerOn) { G.dangerOn = danger; $('#info').classList.toggle('danger', danger); }
    for (i = 0; i < fx.length; i++) sig += fx[i][0] + fx[i][2] + '|';
    if (sig !== G.fxSig) { G.fxSig = sig; var fe = $('#infoFx'); if (fe) { var bad = fx.filter(function (f) { return f[0] === 'bad' || f[0] === 'poison' || f[0] === 'slow' || (DS.STATUS && DS.STATUS[f[0]]); }), f0 = bad[0] || fx[0]; fe.innerHTML = f0 ? '<i class="fx-' + f0[0] + '" title="' + esc(fx.map(function (f) { return f[1] + ' ' + f[2]; }).join(', ')) + '">' + f0[3] + (fx.length > 1 ? '<sup>+' + (fx.length - 1) + '</sup>' : '') + '</i>' : ''; fe.setAttribute('aria-label', fx.length ? '효과 ' + fx.length + '개, 누르면 목록' : ''); } }      // r27 ux: 효과는 표 하나(나쁜 것이 먼저) + 개수 — 누르면 전부
    var idle = !!(G.scn && !sim.combat && !sim.hunt && !G.ending && !G.pause && !G.hold && !me.order && !me.dead && sim.units.some(function (x) { return x.side === 'enemy' && !x.dead; }));
    if (!idle) G.idleT = 0; else if (!G.idleT) G.idleT = now;
    if (danger) putInfo('붉은 칸 안이다. 비켜라.');
    else if (now <= infoT) putInfo(infoMsg);
    else if (G.idleT && now - G.idleT > 4000) {      // r8 hud: 앞 무리를 잡고 서 있을 때 — 다음에 무엇을 하면 되는지
      putInfo('남은 적을 누르거나 전체 자동');
      if (!sv.seen.idle) { sv.seen.idle = 1; var bh = $('#bHunt'); bh.classList.add('hint'); setTimeout(function () { bh.classList.remove('hint'); }, 6000); }      // r27 ux: 코치 표시 대신 단추만 반짝인다
    }
    else {
      var ch = sv.chars[me.ch], o = me.order, busy = sim.combat || G.gain.exp;
      var doing = me.casting ? '시전 중' : me.saving && sim.combat ? '기술 준비' : o ? ({ move: '이동 중', attack: '공격 명령', skill: (SK[o.id] ? SK[o.id].name : '') + ' 예약', item: (DS.ITEMS[o.key] ? DS.ITEMS[o.key].name : '아이템') + ' 사용', hold: '자리 지킴', call: '이름을 부르는 중' }[o.t] || '명령') : sim.combat ? (me.auto ? '자동 전투' : '수동 (명령 대기)') : '쉬는 중';
      // 싸우는 동안은 짧게: 하는 일과 얻은 것만. 한가할 때는 단·호칭까지.
      putInfo(doing);      // r27 ux: 단·레벨은 위 칩에 있다 — 여기는 지금 하는 일만      // r26: 싸우는 동안 얻는 골드·경험치는 글 대신 날아가는 동전과 위 골드 칸으로 (싸움이 끝나면 한 줄로 모아 보인다)
    }
  }
  if (G.bossId) {
    var b = sim.byId[G.bossId], bel = $('#boss'), alive = b && !b.dead;
    if (!alive && !(G.bossHold > now)) { G.bossId = null; G.bcast = null; bel.hidden = true; bel.classList.remove('casting'); layoutInsets(); }
    else {
      $('.bbar u', bel).style.width = (alive ? Math.max(0, b.hp / b.mhp * 100) : 0) + '%';
      // 시전 중인 기술 이름과 남은 시간 (예고가 있는 기술은 막대가 줄어든다)
      var bc = alive ? G.bcast : null, txt = '', cw = 0;      // 칭호(em)는 그대로 두고, 시전 중인 기술은 오른쪽 칸(.bct)에
      if (bc && bc.tid) { var rem = Math.max(0, bc.dur - (sim.t - bc.t0)); txt = '▶ ' + bc.name + ' ' + rem.toFixed(1) + '초'; cw = rem / bc.dur * 100; }
      else if (bc && now < bc.until) txt = '▶ ' + bc.name;
      else bc = G.bcast = null;
      if (txt !== G.bossTxt) { G.bossTxt = txt; var bct = $('.bct', bel); if (bct) bct.textContent = txt; else $('em', bel).textContent = txt || G.bossTitle || ''; bel.classList.toggle('casting', !!bc); }
      var cb = $('.cbar u', bel); if (cb) cb.style.width = cw + '%';
    }
  }
  updateActs();
}
// 보스의 한마디: 보스 바 바로 아래에 3초 (DS.LORE.boss[key].say / .last 가 있을 때만)
function bossSay(text, ms) {
  var el = $('#bsay'); if (!el || !text) return;
  el.textContent = text; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('on'); }, ms || 3000);
}
function bossLore(u, k) { var L = DS.LORE, b = L && L.boss && u && L.boss[u.type]; return b && b[k] ? lineText(b[k]) : ''; }
function bossQuote(u, k) { var t = bossLore(u, k); return !t ? '' : /^[—–-]/.test(t) ? t : '“' + t.replace(/^["“]|["”]$/g, '') + '”'; }
function showBoss(u) {
  var L = DS.LORE, lb = L && L.boss && L.boss[u.type], fl = lb && lb.floors && G.scn && G.scn.pit ? lb.floors[(G.scn.pit - 1) % lb.floors.length] : null;      // 갱도지기는 층마다 이름이 다르다
  G.bossId = u.id; G.bossTitle = bossLore(u, 'title') || u.title || ''; G.bossTxt = null; G.bcast = null; G.bossHold = 0;
  var el = $('#boss'); el.hidden = false; el.classList.remove('casting', 'rage'); if (u.enraged) el.classList.add('rage');
  $('b', el).textContent = fl ? fill(fl) : u.name; $('em', el).textContent = G.bossTitle;
  layoutInsets(); DS.Audio.bgm('boss');
  bossSay(bossQuote(u, 'say'));
}
function updateQuest() {
  var sv = G.save, el = $('#quest'), z = G.zone, n = DS.nextScn(sv), text = '', guide = null, hero = sv.chars[sv.hero];
  var huntN = 0, retreat = false, menu = null, slots = 0, dest = null, mc = DS.charList(sv).filter(function (c) { return DS.CLASSES[c.cls].master; }).length;
  var hb = huntCur(sv); huntN = hb ? 0 : bountyOpen(sv);
  if (G.scn) { text = G.scn.boss ? '목표: ' + DS.BOSSES[G.scn.boss].name + ' 격파' : '목표: 습격을 모두 막아라'; retreat = true; }
  else if (hb) {      // 부대 탭 「현상 수배」에서 고른 것: 그 지역까지 길 안내, 닿으면 진행도
    if (z.id !== hb.zone) { text = '수배: ' + hb.title + ', ' + (hb.zoneName || DS.ZONES[hb.zone].name) + ' 쪽'; guide = wayTo(z, hb.zone, function () { return false; }); dest = { zone: hb.zone }; }
    else {
      text = '수배: ' + hb.title + (hb.need ? ' ' + (hb.have || 0) + ' / ' + hb.need : '');
      if (hb.x != null && hb.y != null) guide = { t: 'spot', x: hb.x, y: hb.y };      // 정예 무리: 그 자리까지 화살표·길 안내
      else if (G.sim && !G.sim.hunt) text += ', 전체 자동으로 사냥';
    }
  }
  else if (z.town && !G.mercSeen && (slots = emptyHouses(sv)) > 0 && (sv.tickets > 0 || sv.gold >= (DS.recruitPrice ? DS.recruitPrice(sv, 0) : DS.mercCost(DS.heroTier(sv))))) {
    // 2.2.0: 마을에 있는 동안 빈 가문을 먼저 알린다 (영웅관에 한 번 들르면 본래 안내로 돌아간다)
    text = '빈 가문 ' + slots + '곳, 영웅관'; guide = z.pois.filter(function (p) { return p.kind === 'merc'; })[0];
  }
  else if (!n) {      // 엔딩 뒤: 갱도가 남아 있다
    var L = DS.LORE, pz = pitZone();
    text = (L && L.after ? fill(L.after) : '모든 시나리오를 마쳤다') + ', 갱도 ' + (sv.pitBest ? '최고 ' + sv.pitBest + '층' : '1층부터');
    if (pz) { guide = wayTo(z, pz, function (p) { return p.t === 'dungeon'; }); dest = { zone: pz, pick: function (p) { return p.t === 'dungeon'; } }; }
    var eq = DS.egQuest ? DS.egQuest(sv) : null; if (eq) { text = eq; menu = 'party'; guide = null; dest = null; }      // endgame: 다음 세대의 장을 열 수 있다 (누르면 부대 탭)
  }
  else if (n.tier > DS.partyTier(sv)) {
    // 가장 긴 구간: 합일(8단)·9단 준비. 어느 깃발이 얼마나 남았는지 한 줄로 보여 주고, 누르면 부대 화면으로.
    var ms = DS.charList(sv).filter(function (c) { return DS.CLASSES[c.cls].master || c.L > 70; }).sort(function (a, b) { return b.L - a.L; }), plan = fusePlan(sv);
    if (ms.length && DS.tierOfL(ms[0].L) >= n.tier) { text = DS.charName(ms[0]) + ' ' + lvText(ms[0].L) + ', ' + n.id + '. ' + n.name; menu = 'party'; }
    else if (n.tier >= 9 && ms.length) { text = DS.charName(ms[0]) + ' ' + lvText(ms[0].L) + ' → 9단, ' + n.id + '. ' + n.name; menu = 'party'; }
    else if (plan && plan.st.ok) { text = '합일 준비 끝, 교회로'; guide = wayTo(z, z.town ? z.id : sv.town, function (p) { return p.t === 'shop' && p.kind === 'church'; }); dest = { zone: z.town ? z.id : sv.town, pick: function (p) { return p.t === 'shop' && p.kind === 'church'; } }; }
    else if (plan) {
      text = '합일: 7단 Lv10 가문 ' + plan.done + '/' + plan.total + ', ' + (plan.low.length ? DS.flagName(plan.low[0].cls) + ' ' + lvText(plan.low[0].L) : '맹세의 깃대가 필요하다');
      menu = 'party'; var ptx = text;
      // r8 hud (pace 1): 가장 긴 구간에 목적지를 준다 — 지금 층의 갱도가 부대 평균에 맞으면 그리로 길 안내 (깃발 사정은 글에 그대로, 부대 창은 ☰ 로)
      var pzq = pitZone(), pfl = DS.pitFarm ? DS.pitFarm(sv) : 0, psc = pzq && pfl && !plan.st.miss.length && DS.partyTier(sv) >= 5 ? DS.pit(pfl) : null;      // 2.2.3: 부대 평균에 맞는 가장 깊은 층
      if (psc) { var pk = function (p) { return p.t === 'dungeon'; }; text = '갱도 ' + pfl + '층, 합일 ' + plan.done + '/' + plan.total; menu = null; guide = wayTo(z, pzq, pk); dest = { zone: pzq, pick: pk }; if (!guide) { menu = 'party'; dest = null; text = ptx; } }      // 목적지를 앞에 (390 폭에서 줄 끝의 목적지가 잘려 「어디로」가 안 보였다) — 병과·단 사정은 부대 창에서
    }
    else text = '다음: ' + n.tier + '단이 되면 ' + n.id + '. ' + n.name;
  }
  else {
    text = (n.gen ? n.gen + '대째, ' : '') + '다음: ' + n.id + '. ' + n.name;      // endgame: 장 시나리오면 세대를 붙인다
    if (z.id === n.zone) { guide = z.pois.filter(function (p) { return p.t === 'gate' && p.ids.indexOf(n.id) >= 0; })[0]; if (DS.partyL(sv) < recL(n)) text += ', 권장 ' + lvText(recL(n)); }      // 그 들판에서 권장에 못 미치면 함께 보여 준다
    else { var to = DS.routeExit(z.id, n.zone); guide = z.pois.filter(function (p) { return p.t === 'exit' && p.to === to; })[0]; if (guide) text += ', ' + DS.ZONES[to].name + ' 쪽'; dest = { zone: n.zone, pick: function (p) { return p.t === 'gate' && p.ids.indexOf(n.id) >= 0; } }; }
  }
  if (menu === 'party' && huntN) text += ', 수배 ' + huntN;      // 합일 준비 구간: 걸려 있는 현상 수배가 있으면 덧붙인다 (누르면 부대 탭 맨 위가 게시판)
  var wp = guide && dest ? warpPlan(dest) : null;      // r4 map: 목적지 쪽에 가 본 지역이 있으면 걷지 않고 바로 (단추 글도 「바로 가기」)
  var qh = '<i class="qm" aria-hidden="true">' + (retreat ? icon('skull', 13) : '<i>!</i>') + '</i><span>' + esc(text) + '</span>' + (retreat ? '<b>퇴각' + icon('chev', 12) + '</b>' : wp ? '<b>바로 가기' + icon('chev', 12) + '</b>' : guide ? '<b>길 안내' + icon('chev', 12) + '</b>' : menu ? '<b>부대' + icon('chev', 12) + '</b>' : '');      // r26 art: 금빛 마름모 표식 + 리본 + 오른쪽 알약 단추
  if (el._qt !== text) { el._qt = text; el.innerHTML = qh; if (!calm()) { el.classList.remove('qnew'); void el.offsetWidth; el.classList.add('qnew'); } } else if (el.innerHTML !== qh) el.innerHTML = qh;
  el._guide = guide || null; el._retreat = retreat; el._menu = menu; el._dest = guide ? dest : null;
  el.classList.toggle('retreat', !!retreat);      // r4 polish: 퇴각 단추는 붉게 구분 (style.css)
  G.view.guide = guide ? { x: guide.x, y: guide.t === 'gate' || guide.t === 'dungeon' ? guide.y - 1 : guide.y } : null;
}
DS.updateQuest = updateQuest;
// 현상 수배 (기획팀 DS.bountyList): 고른 것을 따라가고, 달성하거나 사라지면 놓는다
function bountyAll(sv) { var l = null; if (DS.bountyList) { try { l = DS.bountyList(sv); } catch (x) { l = null; } } return l instanceof Array ? l : []; }
function bountyOpen(sv) { return bountyAll(sv).filter(function (b) { return !b.done; }).length; }
function huntCur(sv) {
  if (!G.hunt) return null;
  var b = bountyAll(sv).filter(function (x) { return x.id === G.hunt.id; })[0];
  if (!b || b.done || !DS.ZONES[b.zone]) { G.hunt = null; return null; }
  return b;
}
DS.huntGo = function (b) {
  if (!b || !DS.ZONES[b.zone]) return;
  G.hunt = { id: b.id }; G.goal = null; updateQuest();
  var q = $('#quest');
  if (G.zone.id === b.zone) toast('이 지역이다. ' + (b.title || '') + (G.sim && !G.sim.hunt && !G.scn ? '. AUTO 로 사냥하면 빠르다' : ''), 3200);
  else if (q && q._guide && !G.scn) questGo();
};
// 합일까지 (1.0.1: 묶음은 자유 — 7단 Lv10 가문 아무 셋). 조건은 DS.fuseProg 를 읽기만 한다. 셋을 채울 가문이 모자라면 null
function fusePlan(sv) {
  var P = DS.fuseProg(sv); if (!P.can) return null;
  return { name: '합일', st: { ok: P.ok, miss: [] }, total: P.of, done: P.n, low: P.low.slice(0, Math.max(0, P.of - P.ready.length)), crest: P.crest };
}
function emptyHouses(sv) { return DS.bnEmpty ? DS.bnEmpty(sv).length : 0; }      // 2.2.0: 가주가 없고 막사에 같은 병과도 없는 가문
var pitZ;
function pitZone() { if (pitZ === undefined) { pitZ = null; for (var id in DS.ZONES) if ((DS.ZONES[id].gates || []).some(function (g) { return g.dungeon; })) pitZ = id; } return pitZ; }
// 지금 지역에서 목적지(다른 지역의 장소)로 가는 길잡이: 같은 지역이면 그 장소, 아니면 그쪽 출구
function wayTo(z, zoneId, pick) {
  if (z.id === zoneId) return z.pois.filter(pick)[0] || null;
  var to = DS.routeExit(z.id, zoneId);
  return z.pois.filter(function (p) { return p.t === 'exit' && p.to === to; })[0] || null;
}
// 창이 열려 있는 동안에는 미뤄 두었다가 띄우는 안내
function later(msg, ms) { (G.laterQ = G.laterQ || []).push([msg, ms]); }
function bannerSoon(title, sub, ms) { G.pendBan = [title, sub, ms]; G.banAt = performance.now() + 120; }
function questGo(e) {
  if (e !== 'warp' && e !== 'cont' && performance.now() - (G.warpAt || 0) < 700) return;      // r4 map: 바로 이동 직후의 두 번째 탭은 먹는다 (입구 창이 두 번 뜨지 않게)
  var q = $('#quest');
  if (q._retreat && G.scn && !G.ending) {
    // r8 hud: 줄 전체가 아니라 「퇴각 ▸」 칩만 단추다 (위쪽 적을 누르다 퇴각 창이 뜨던 것)
    var qb = $('b', q), qr = qb && e && e.detail !== 0 && e.clientX != null ? qb.getBoundingClientRect() : null;
    if (qr && (e.clientX < qr.left - 16 || e.clientX > qr.right + 16 || e.clientY < qr.top - 8 || e.clientY > qr.bottom + 8)) {
      // 글 쪽 탭은 아무 일도 하지 않는다: 줄이 거의 불투명해 그 아래 칸·적은 보이지 않는다 — 전장으로 넘기면 보이지 않는 칸으로 걸어가거나 가려진 적을 치러 갔다
      return;
    }
    retreatAsk(null);
    return;
  }
  if (q._menu) { A('tap'); DS.openMenu(q._menu); return; }
  var g = q._guide, me = G.sim.byId[G.sel]; if (!g || !me) return;
  if (pressed()) { toast('적이 가까이 있다'); return; }
  var wp = warpPlan(q._dest), wfight = wp && G.sim && G.sim.combat;      // r4 map: 가 본 지역까지는 바로 옮기고, 그다음은 걸어서 (싸움이 남아 있으면 지금처럼 걷는다)
  if (wfight) wp = null;
  if (wp) { warpTo(wp.zone, wp.pick, wp.open, !wp.last); if (!wp.last) { toast(DS.ZONES[wp.zone].name + '에 도착했다. 여기서부터 걸어간다', 2600); setTimeout(function () { if (!G.hold && !G.scn && G.zone.id === wp.zone) questGo('warp'); }, 500); } return; }
  // 길 안내의 목적지는 기억해 둔다: 싸움에 휘말려 명령이 끊겨도 끝나면 다시 간다. 다른 곳을 찍으면 잊는다.
  G.guideExit = g.t === 'exit' ? { zone: G.zone.id, to: g.to } : null;      // r8 hud: 출구로 가는 길 안내는 다음 지역에서도 이어 준다 (구역 입구마다 다시 누르던 것)
  A('ok'); G.goal = { x: g.x, y: g.y, poi: g.t === 'exit' || g.t === 'spot' ? null : g, zone: G.zone.id, tries: 0 };
  G.pendPoi = G.goal.poi; order(me, { t: 'move', x: g.x, y: g.y }); if (e !== 'cont') toast(wfight ? '싸우는 중이라 걸어서 안내한다' : '목표로 간다');      // 저절로 이어 가는 길 안내는 말없이 (한 번짜리 안내를 덮던 것)
}
// r8 hud: 퇴각 창. fell = 방금 쓰러진 지휘관(그 판의 첫 사람)일 때는 그 소식을 먼저 말한다.
function downNames() { var sv = G.save; return sv.party.filter(function (id) { return sv.chars[id] && sv.chars[id].down && !sv.chars[id].vac; }).map(function (id) { return DS.charName(sv.chars[id]); }); }
function retreatAsk(fell, goneNm, goneM) {
  var sv = G.save, dn = downNames(), live = G.sim ? G.sim.cmds().length : 0, html;
  if (fell) {
    var nm = goneNm || DS.charName(fell);
    html = '<div class="result fell"><span class="fellpic">' + charSpr(fell, 3, 0, goneM) + '</span><h2>' + esc(nm) + ' 쓰러짐</h2>' +
      '<p><b>' + esc(josa(nm, '이가')) + ' 쓰러졌다.</b> ' + (goneNm ? '돌아오지 못한다.' : '이 싸움이 끝나면 돌아오지 못한다.') + '</p>' +
      '<p class="dim">물러나면 남은 사람을 지킨다. 남은 가문 ' + live + '개와 가문원은 살아 돌아가고 얻은 경험치와 골드도 남는다. ' + esc(goneNm ? DS.flagName(fell.cls) + '은 막사에 같은 병과가 있으면 그이가 잇고, 없으면 빈 가문이 된다.' : nm + '의 자리는 후계가 잇는다.') + '</p>' +
      '<button class="btn red wide" id="yesRet">퇴각</button><button class="btn wide" data-close>계속 싸우기</button></div>';
  } else {
    html = '<div class="result"><h2>퇴각할까?</h2><p>얻은 경험치와 골드는 남는다.</p>' +
      (dn.length ? '<p class="dim">쓰러진 ' + esc(dn.join(', ')) + josa(dn[dn.length - 1], '은는').slice(dn[dn.length - 1].length) + ' 돌아오지 못한다. 남은 이들만 물러난다.</p>' : '') +
      '<button class="btn red wide" id="yesRet">퇴각</button><button class="btn wide" data-close>계속 싸우기</button></div>';
  }
  toastOff();
  var o = overlay(html, 'modal center'), yes = $('#yesRet', o);
  // 쓰러짐 창은 싸움 도중 저절로 뜬다 — 전장을 누르던 손가락이 「물러난다」에 떨어져 읽지도 못하고 판을 버리지 않게 잠깐 잠근다 (직접 연 퇴각 창은 그대로)
  if (fell) { yes.disabled = true; setTimeout(function () { if (yes.isConnected) yes.disabled = false; }, 800); }
  yes.addEventListener('click', function () { if (fell && performance.now() - o.born < 800) return; o.close(); doRetreat(); });
  return o;
}
// 물러난다: 쓰러진 지휘관이 있으면 그 죽음을 여기서 확정하고(가계도 훅 linEnd — 진 판으로 센다) 후계 의식을 거친 뒤 들판으로. 아무도 쓰러지지 않았으면 예전 그대로.
function doRetreat() {
  if (G.ending) return; G.ending = true; DS.Audio.bgm(null);
  var back = function () { backToField(false); flushPromos(); };
  if (downNames().length && DS.linSettle) { linEnd(false); persist(); lineageFlush(back); }
  else back();
}
// 그 판(시나리오 한 판·들판의 한 싸움)에서 첫 지휘관이 쓰러졌다: 싸움을 멈추고 알린다. 둘째부터는 토스트.
//   자동 사냥·자동 진행 중에도 멈춘다 — 영구 사망은 승급 창처럼 미뤄 둘 소식이 아니다. 들판에서는 자동 사냥을 끈다(자리를 비운 사이 줄줄이 쓰러지지 않게).
//   자동 시험은 DS.G.quiet = true 로 끌 수 있다(토스트만).
function cmdFell(u, gone) {
  var sv = G.save, sim = G.sim, ch = sv.chars[u.ch], nm = gone ? (gone.ttl || gone.n || u.name) : ch ? DS.charName(ch) : u.name, key = G.scn ? sim : (G.fightN || 0), first = G.fellKey !== key || G.fellSim !== sim;
  G.fellKey = key; G.fellSim = sim;
  if (!sim.cmds().length || sim.result || G.ending) return;      // 마지막 깃발 유닛이면 곧 전멸 화면이 말한다
  var tail = gone ? '돌아오지 못한다. ' + DS.flagName(ch ? ch.cls : u.cls) + '은 남는다' : '싸움이 끝나면 돌아오지 못한다';
  if (!first || G.quiet || !ch) { toast(nm + ' 쓰러짐. ' + tail + (G.scn ? '. 위의 퇴각으로 물러난다' : ''), 4200); pulseRetreat(); return; }
  A('mourn');
  if (G.scn) { retreatAsk(ch, gone ? nm : null, gone || null).onclose = pulseRetreat; return; }
  var hunt = !!sim.hunt;
  if (hunt) { sim.hunt = false; sv.opt.hunt = false; renderSys(); }
  toastOff();
  overlay('<div class="result fell"><span class="fellpic">' + charSpr(ch, 3, 0, gone || null) + '</span><h2>' + esc(nm) + ' 쓰러짐</h2>' +
    '<p><b>' + esc(josa(nm, '이가')) + ' 쓰러졌다.</b> ' + esc(gone ? '돌아오지 못한다. ' + DS.flagName(ch.cls) + '은 막사에 같은 병과가 있으면 그이가 잇고, 없으면 빈 가문이 된다.' : '이 싸움이 끝나면 돌아오지 못한다.') + '</p>' +
    '<p class="dim">' + (hunt ? '자동 사냥을 멈췄다. ' : '') + '쓰러진 이는 돌아오지 않는다. 남은 이들은 적에게서 멀어지면 싸움에서 벗어난다.</p>' +
    '<button class="btn wide" data-close>확인</button></div>', 'modal center');
}
function pulseRetreat() { var q = $('#quest'); if (!q || !q._retreat) return; q.classList.remove('pulse'); void q.offsetWidth; q.classList.add('pulse'); clearTimeout(q._pt); q._pt = setTimeout(function () { q.classList.remove('pulse'); }, 5200); }
// 지휘관이 위태롭다: HP 절반 아래 첫 순간에 약초를 가리키고(저장에서 한 번), 35% 아래로 내려가면 정보 줄에 알린다 — 저장에서 처음이면 잠깐 멈춘다.
function cmdLow(u) {
  var sv = G.save, r = u.hp / u.mhp, herb = sv.items.herb || 0, sel = u.id === G.sel, now = performance.now();
  if (r > 0.5) { u.lowInfo = false; return; }
  if (!sv.seen.herb && herb > 0 && sel && r > 0.35) { sv.seen.herb = 1; G.herbHint = now + 7000; setInfo('체력 절반 아래. 약초를 누르면 회복', 4200); coach($('#acts [data-it="herb"]'), '눌러서 회복', { long: '체력 절반 아래. 약초를 누르면 회복' }); return; }
  if (r >= 0.35 || u.lowInfo) return;
  u.lowInfo = true;
  if (herb > 0) G.herbHint = now + 6000;
  var nm = u.name, how = herb > 0 ? (sel ? '약초를 누른다' : '초상화를 눌러 고른 뒤 약초를 누른다') : '약초 없음. 퇴각한다';
  setInfo(nm + ' 위험. ' + how, 3600);
  if (!sv.seen.cdanger && !G.quiet) {
    sv.seen.cdanger = 1; softPause(9000);
    var hr = u.ch === sv.hero, cdl = (hr ? '맹주가 쓰러지면 후계가 잇는다.' : '가주는 쓰러지면 돌아오지 못한다.') + ' 잠깐 멈췄다. ' + how + (G.scn ? '. 어려우면 위의 퇴각' : '');      // 2.6: 「대장」 → 맹주 · 가주
    if (herb > 0 && sel) coach($('#acts [data-it="herb"]'), (hr ? '맹주가' : '가주가') + ' 위험하다. 약초!', { long: cdl, ms: 7000 }); else toast(cdl, 9000);
  }
}
// 2.6: 싸움이 끝났다 — 위험 안내(코치 · 정보 줄 · 약초 단추의 깜빡임 · 붉은 테)는 승리 · 전멸 화면까지 따라오지 않는다
function dangerOff() {
  var c = $('.coach'); if (c && c.parentNode) c.parentNode.removeChild(c);
  G.herbHint = 0; setInfo(''); softResume();
  $$('#acts .act.hint').forEach(function (b) { b.classList.toggle('hint', false); });
  if (G.dangerOn) { G.dangerOn = false; var inf = $('#info'); if (inf) inf.classList.toggle('danger', false); }
  if (G.view) G.view.lowHp = 0;
}
// 잠깐 멈춤: 명령을 내리거나 ms 가 지나면 저절로 다시 흐른다 (Ⅱ 단추로도 풀린다)
function softPause(ms) {
  if (G.quiet || G.pause) return;
  var me = G.sim && G.sim.byId[G.sel];
  if ((G.sim && G.sim.hunt) || (me && me.auto)) return;      // r30: 전체 자동(또는 고른 가문 자동)이면 멈추지 않는다 — 명령을 내릴 일이 없어 6~9초 동안 화면이 굳은 것처럼 보였다 (안내 글은 그대로)
  G.pause = true; G.softUntil = performance.now() + Math.min(ms, 4000); renderSys();      // 길어야 4초
}
function softResume() { if (!G.softUntil) return; var late = performance.now() >= G.softUntil; G.softUntil = 0; if (G.pause) { G.pause = false; renderSys(); } if (!late) toastOff(); }      // 명령을 내려 풀었으면 안내 글도 걷는다
// 받은 피해: 때린 적의 이름별로 (독·지형처럼 때린 이가 없으면 따로)
function hurtBy(e) {
  var src = e.by ? G.sim.byId[e.by] : null, vu = !src && e.by && G.view.vu[e.by] ? G.view.vu[e.by].u : null, who = src || vu, st = G.stats;
  var k = who ? (who.role === 'boss' ? '보스 ' : '') + who.name : '독, 지형';
  st.hurt = st.hurt || {}; st.hurt[k] = (st.hurt[k] || 0) + e.v; st.hurtAll = (st.hurtAll || 0) + e.v;
}
function resumeGoal() {
  var g = G.goal, me = G.sim && G.sim.byId[G.sel];
  if (!g) return;
  if (!me || me.dead || G.scn || G.ending || g.zone !== G.zone.id) { G.goal = null; return; }
  if (Math.abs(me.x - g.x) + Math.abs(me.y - g.y) <= 1) { G.goal = null; if (g.poi && !G.hold && !(G.sim.combat && pressed())) openPoi(g.poi); return; }      // 싸우다 보니 이미 닿아 있었다: 문을 열어 준다 (전엔 그냥 멈춰 섰다)
  if (me.order && me.order.t === 'move' && me.order.x === g.x && me.order.y === g.y) return;      // 아직 가는 중
  if (++g.tries > 6) { G.goal = null; G.pendPoi = null; toast('길이 막혔다. 길 안내를 멈춘다'); return; }
  G.pendPoi = g.poi; order(me, { t: 'move', x: g.x, y: g.y }); if (performance.now() < (G.laterAt || 0) || (G.laterQ && G.laterQ.length)) setInfo('길 안내를 이어 갑니다', 2400); else toast('길 안내를 잇는다');      // 한 번짜리 안내가 떠 있으면 덮지 않는다
}

// ───────── r4 map: 바로 이동 ─────────
// 지도에서 가 본 지역·시나리오 입구를 누르거나, 길 안내의 목적지가 가 본 지역이면 걷지 않고 곧장 옮긴다.
// 도착 자리: 지역은 기본 입구(DS.zoneEntry — 가장 순한 들머리), 장소(입구·가게·출구)는 그 문 앞 한 칸. 막혀 있으면 enterZone·sim.add 가 가까운 빈칸으로.
// 저장 위치·승급 대기열(G.promos)·막간 이야기(G.pendCamp)는 걸어서 들어갈 때와 같은 enterZone 을 거치므로 그대로 이어진다.
function zoneTier(id) { var t = 0; for (var k in DS.ZONES) (DS.ZONES[k].exits || []).forEach(function (e) { if (e.to === id && e.tier) t = Math.max(t, e.tier); }); return t; }
function warpPlaceWhy(id) {      // 4.0.6: 입장 조건 없음 — 어디든 간다 (위험하면 zoneDanger 가 경고)
  var s = G.save, Z = DS.ZONES[id];
  if (!Z || !s) return '갈 수 없는 곳입니다';
  return '';
}
// 위험 경고 한 줄 ('' = 안전). 단 수가 모자라거나, 우리 평균 레벨이 그 지역 권장보다 낮을 때
function zoneDanger(id) {
  var s = G.save, Z = DS.ZONES[id]; if (!Z || !s || Z.town) return '';
  var t = zoneTier(id), pt = DS.partyTier(s), pl = DS.partyL ? DS.partyL(s) : 0, rec = Z.L ? (DS.zoneRec ? DS.zoneRec(id)[0] : recOfL(Z.L[0])) : 0, half = Z.L && DS.zoneHalf ? DS.zoneHalf(id) : rec - 3;
  if (t > pt) return '위험: ' + josa(Z.name, '은는') + ' ' + t + '단 지역입니다. 지금 ' + pt + '단';
  if (rec && pl && pl < Math.min(rec, half)) return '위험: ' + Z.name + ' 권장 ' + lvText(rec) + ', 우리 평균 ' + lvText(pl);      // 2.2.3: 센 무리와 반반도 안 되면
  return '';
}
var dangerOk = {};      // 경고를 한 번 본 지역 (이 판 동안). 다시 누르거나 다시 들어가면 간다
function dangerGate(id) {      // true = 이번에는 멈추고 경고만
  var w = zoneDanger(id); if (!w) return false;
  if (dangerOk[id] && performance.now() - dangerOk[id] < 15000) return false;
  dangerOk[id] = performance.now(); A('cancel'); toast(w + '. 한 번 더 하면 들어갑니다' + (DS.sortieNames ? '. 출전: ' + DS.sortieNames(G.save) : ''), 4200); return true;      // 2.2.8: 나가는 셋
}
function warpWhy(id) {      // '' = 지금 바로 갈 수 있다, 글 = 못 가는 까닭
  if (G.ending) return '결과를 다 본 뒤에 간다';
  if (G.scn) return '시나리오 안에서는 갈 수 없다. 끝내거나 물러난 뒤에';
  if (G.sim && G.sim.combat) return '싸우는 중에는 갈 수 없다';
  return warpPlaceWhy(id);
}
function frontOf(z, p) {
  if (!p) return null;
  if (p.t === 'exit') return { x: p.inx, y: p.iny };
  var c = [[p.x, p.y + 1], [p.x - 1, p.y + 1], [p.x + 1, p.y + 1], [p.x, p.y]];
  for (var i = 0; i < c.length; i++) { var x = c[i][0], y = c[i][1]; if (x >= 0 && y >= 0 && x < z.w && y < z.h && DS.COST[DS.TILE_CH[z.rows[y][x]] || 'plain'][0] > 0) return { x: x, y: y }; }
  return null;
}
function movePartyTo(x, y) {      // 같은 지역 안에서 옮기기 (지역을 다시 세우지 않는다 — 몬스터·배너·막간 이야기는 그대로)
  var sim = G.sim; syncVitals();
  sim.units.filter(function (u) { return u.side === 'ally'; }).forEach(function (u) { sim.remove(u); delete G.view.vu[u.id]; });
  placeParty(sim, x, y);
  sim.units.forEach(function (u) { if (u.side === 'ally' && !G.view.vu[u.id]) G.view.vu[u.id] = G.view.mkVu(u, true); });
  sim.ev = sim.ev.filter(function (e) { return e.t !== 'spawn'; });
  G.view.snap = true; G.view.pan = { x: 0, y: 0 }; G.view.aim = null; G.view.mark = null; G.aim = null;
  select(G.sel); renderChips(); renderActs(); updateQuest(); persist();
}
// id: 지역 키, pick: 그 지역에서 문 앞에 설 장소(없으면 기본 입구), open: 닿으면 그 장소를 연다(입구 창·가게 — 걸어서 닿았을 때와 같은 창).
// 돌려주는 값: '' = 옮겼다, 글 = 못 옮긴 까닭 (부른 쪽이 토스트로)
function warpTo(id, pick, open, quiet) {
  var why = warpWhy(id); if (why) return why;
  var z = DS.buildZone(id), p = pick ? z.pois.filter(pick)[0] || null : null, pos = frontOf(z, p), same = G.zone && G.zone.id === id;
  if (same && !pos) return '지금 있는 곳입니다';
  G.goal = null; G.pendPoi = null; G.warpAt = performance.now();
  if (same) movePartyTo(pos.x, pos.y); else enterZone(id, null, pos);
  A('ok');
  if (!quiet) toast(p && (p.t === 'gate' || p.t === 'dungeon') ? (same ? '' : z.name + ', ') + (p.label || '입구') + ' 앞에 도착했다' : z.name + '에 도착했다', 2400);
  if (p && open) setTimeout(function () { if (G.zone && G.zone.id === id && !G.scn && !G.ending && !(G.sim && G.sim.combat) && !G.hold) openPoi(p); }, 420);
  return '';
}
// 길 안내: 목적지까지의 지역 길(출구를 따라)에서 바로 갈 수 있는 가장 먼 지역. 목적지 자체면 그 장소 앞, 아니면 다음 지역으로 나가는 출구 앞.
function zonePath(from, to) {
  if (!DS.ZONES[from] || !DS.ZONES[to]) return null;
  var prev = {}, q = [from]; prev[from] = from;
  while (q.length) {
    var c = q.shift(); if (c === to) break;
    (DS.ZONES[c].exits || []).forEach(function (e) { if (prev[e.to] == null && DS.ZONES[e.to]) { prev[e.to] = c; q.push(e.to); } });
  }
  if (prev[to] == null) return null;
  var path = [to]; while (path[0] !== from) path.unshift(prev[path[0]]);
  return path;
}
function warpPlan(dest) {
  if (!dest || !G.zone || G.scn || G.ending || dest.zone === G.zone.id) return null;
  var path = zonePath(G.zone.id, dest.zone); if (!path) return null;
  for (var k = path.length - 1; k >= 1; k--) if (!warpPlaceWhy(path[k])) {
    if (k === path.length - 1) return { zone: path[k], pick: dest.pick || null, open: !!dest.pick, last: true };
    var nx = path[k + 1]; return { zone: path[k], pick: function (p) { return p.t === 'exit' && p.to === nx; }, open: false, last: false };
  }
  return null;
}
DS.warpTo = warpTo; DS.warpWhy = warpWhy; DS.zoneDanger = zoneDanger; DS.dangerGate = dangerGate; DS.warpPlaceWhy = warpPlaceWhy; DS.zoneTier = zoneTier;

// ───────── 엔진 이벤트 처리 ─────────
function flushPromos() {
  if (G.promos.length) G.promos = G.promos.filter(promoOk);
  if (!G.promos.length || G.hold > 0) return;
  var cw = G.view && G.view.cerHold ? G.view.cerHold() : 0;      // r16 fx: 전장의 승급 연출이 먼저 — 끝나면 창(·띠)
  if (cw > 0) { if (!G.promoWait) G.promoWait = setTimeout(function () { G.promoWait = 0; flushPromos(); }, cw + 120); return; }
  if (G.sim && G.sim.hunt && !G.scn && !G.ending && G.zone && !G.zone.town) {      // 2.8.0: 자동 사냥 중에는 창으로 멈추지 않는다 — 띠로만 알리고, 자세한 창은 자동 사냥을 끄거나 마을에 들어갈 때
    var fresh = G.promos.filter(function (q) { return !q.told; });
    if (fresh.length) { fresh.forEach(function (q) { q.told = true; });
      var q0 = fresh[fresh.length - 1], c0 = G.save.chars[q0.id];
      var bt = q0.to + '단 승급', bs = (c0 ? DS.charName(c0) : DS.tierName(q0.cls, q0.to)) + (fresh.length > 1 ? ' 외 ' + (fresh.length - 1) + '명' : '') + ', 자동 사냥을 끄면 자세히';      // 3차 ui: banner() 가 이미 esc 한다 (이름의 &·< 가 &amp; 로 두 번 바뀌어 보이던 것)
      if (G.pendBan) later(bt + ', ' + bs, 3200); else banner(bt, bs, 2400); A('promo'); }      // 3차 ui: 같은 싸움 끝의 현상 수배 달성 띠(대기 중)가 120ms 만에 승급 띠를 덮던 것 → 그때는 토스트로
    return;
  }
  var p = G.promos.shift(); DS.showPromo(p, flushPromos);
}
// 2.6: 줄 서 있던 승급 창의 주인이 바뀌었으면(쓰러졌다 · 자리가 비었다 · 다른 사람이 이었다 · 그 단이 아니다) 그 창은 버린다 — 엉뚱한 사람의 승급으로 뜨지 않게
function promoOk(q) {
  var c = q && G.save && G.save.chars[q.id]; if (!c || c.down || c.vac) return false;
  if (q.pid != null && (c.pid || 0) !== q.pid) return false;
  if (q.cls && c.cls !== q.cls) return false;
  return q.fused || DS.tierOfL(c.L) >= q.to;
}
DS.flushPromos = flushPromos;
function onEvents(evs) {
  var sim = G.sim, sv = G.save, i, e, u, lvl = false;
  for (i = 0; i < evs.length; i++) {
    e = evs[i];
    try {      // r30: 사건 하나의 오류가 같은 프레임의 나머지 사건(승리·패배·죽음)을 삼키지 않게
    switch (e.t) {
      case 'reward':
        sv.gold += Math.round(e.gold * DS.BAL.gold); sv.kills++; G.gain.exp += e.exp; G.gain.gold += e.gold;
        if (e.gold > 0 && e.x != null) coinFly(e.x, e.y, e.gold);      // r26: 동전이 골드 칸으로 날아간다
        onDrops(e);
        if (G.hunt && !G.scn) G.huntDirty = true;
        var ups = DS.gainExp(sv, e.exp, e.L), ripe = null;
        if (ups.length) {
          lvl = true;
          ups.forEach(function (up) {      // r42: 사람마다 — 가주·맹주는 깃발 유닛('c'), 가솔은 제 유닛('m')
            var ch = sv.chars[up.id], cu = up.bear ? sim.byId['c' + up.id] : sim.byId['m' + up.mid];
            if (cu && up.dep) {      // r16 fx: 그 유닛 위에서 — 레벨업은 빛기둥·한 바퀴·「Lv n」, 승급은 금빛 고리·빙글·새 모습·「n단 → m단」 (view.cere: 실제 시간, 겹치면 합치거나 줄 선다)
              var shown = G.view.cere && up.bear ? G.view.cere(cu.id, up.promo ? 'promo' : 'lv', { lv: up.to, from: DS.tierOfL(up.from), to: DS.tierOfL(up.to), sub: up.promo && ch ? DS.tierName(ch.cls, DS.tierOfL(up.to)) : '' }) : false;
              if (!shown) { G.view.float(cu.x, cu.y, up.promo ? DS.tierOfL(up.to) + '단!' : 'LEVEL UP', '#f6cf57', { dy: -10, life: 1.4 }); G.view.burst(cu.x, cu.y, ['#f6cf57', '#fff6d0'], up.bear ? 14 : 8, { up: 40, grav: -10, spd: 14, life: 0.9 }); }
            }
            if (up.promo && up.bear && ch && !up.dep && !up.hero) later((up.who.ttl || up.who.n || DS.charName(ch)) + ', 쉬는 동안 ' + DS.tierOfL(up.to) + '단이 되었다', 3600);      // 2.2.8: 쉬는 가주의 승급 (결과 창에도)
            if (up.promo && up.bear && ch && up.dep) G.promos.push({ id: up.id, from: DS.tierOfL(up.from), to: DS.tierOfL(up.to), cls: ch.cls, pid: ch.pid || 0 });
            if (up.promo && up.dep && DS.tmRankMsg && (up.pg || []).length) later(DS.tmRankMsg({ who: up.who, name: up.who.ttl || up.who.n || (ch ? DS.charName(ch) : ''), t1: DS.tierOfL(up.to), gains: up.pg, flag: up.bear }), 4200);      // r41 temper → r42: 개인 단이 오를 때 성장
            if (up.hero && up.promo && DS.heroUlt && DS.heroUlt(sv) && DS.ULT.vetP) DS.ULT.vetP.forEach(function (q) { if (up.to >= q[0] && up.from < q[0]) { later('맹주의 필살기 「' + SK[DS.heroUlt(sv)].name + '」가 세졌다 (+' + Math.round(q[1] * 100) + '%)', 4200); A('star'); } });      // r42: 맹주의 개인 5단 · 8단
            if (up.hero && DS.vetStars(up.to) > DS.vetStars(up.from) && DS.heroUlt && DS.heroUlt(sv)) later('맹주, ' + DS.STAR_NAME[DS.vetStars(up.to)] + '. 필살기 세기 +' + Math.round(DS.ULT.starP * 100) + '%', 3600);
            if (up.from < DS.FUSE_MIN && up.to >= DS.FUSE_MIN && !up.who.fz) ripe = up;
          });
          A('level');
          if (ripe) fuseNews(ripe);
        }
        break;
      case 'hit':      // 누가 얼마나 때렸나 (엔진이 by 를 실어 줄 때만) · 용병이 위태로우면 한마디
        u = sim.byId[e.id]; if (!u) break;
        if (e.by && u.side === 'enemy') { var hb = statId(e.by); G.stats.dmg[hb] = (G.stats.dmg[hb] || 0) + e.v; }
        else if (u.side === 'ally' && u.role !== 'shade') hurtBy(e);      // r8 hud: 누구에게 가장 많이 맞았나 (전멸 화면이 읽는다) · 2.5.0: 그림자가 받은 것은 빼고
        if (u.side === 'ally' && u.role === 'cmd' && G.chipEls[u.id] && !calm()) { var cel = G.chipEls[u.id].el; cel.classList.remove('hit'); void cel.offsetWidth; cel.classList.add('hit'); if (e.crit && u.id === G.sel) haptic(30); }      // r26: 맞은 가문의 칩이 붉게 떨린다
        if (u.side === 'ally' && !u.dead && (u.role === 'cmd' || u.role === 'merc') && u.hp < u.mhp * 0.3 && !u.barkLow) { if (bark(u, 'low')) u.barkLow = true; } else if (u.side === 'ally' && u.hp > u.mhp * 0.6) u.barkLow = false;      // r32 전투 대사
        if (u.side === 'ally' && u.role === 'cmd' && !u.dead) cmdLow(u);
        else if (u.role === 'merc' && !u.dead && u.side === 'ally') {
          if (u.hp > u.mhp * 0.5) { u.lowSaid = false; u.lowInfo = false; }
          else if (u.hp < u.mhp * 0.3) {
            if (!u.lowSaid && mercTalk(u, 'low')) u.lowSaid = true;
            // 고른 지휘관의 용병이 위태로우면 정보 줄에 한 번: 무엇을 하면 되는지까지 (약초는 용병에게도 건넬 수 있다)
            if (!u.lowInfo && u.owner === G.sel) { u.lowInfo = true; var lm = mercOf(u.mid); setInfo((lm && lm.n ? lm.n : u.name) + ' 위험. 치유 기술로 돌본다', 3200); }
          }
        }
        break;
      case 'die':
        u = G.view.vu[e.id] && G.view.vu[e.id].u;
        if (u && u.role === 'boss' && e.id === G.bossId && !e.flee) { var lw = bossQuote(u, 'last'); if (lw) { bossSay(lw); G.bossHold = performance.now() + 3000; } }      // 보스의 마지막 한마디
        if (u && u.side === 'ally' && u.role === 'cmd') {      // 4.0: 대장은 미뤄진 죽음(싸움이 끝나면 DS.linSettle → 후계 의식), 든 사람은 그 자리에서 확정 — 따르는 이와 같은 길 (깃발은 아무것도 잃지 않는다)
          var dch = sv.chars[u.ch], gone = null, dsMs = 0, bm0 = null;
          if (dch && u.ch === sv.hero) dch.down = true;
          else if (dch && DS.bearer) { bm0 = DS.bearer(sv, dch); if (bm0) { if (!e.flee) keepLW(u, bm0); gone = bearerFell(u, bm0, true); } }      // r32: 한마디를 먼저 남겨야 추모·가계 기록에 들어간다
          if (dch && (u.ch === sv.hero || gone) && !e.flee) dsMs = deathFx(u, e, gone || bm0, u.flag != null ? !!u.flag : true, gone ? (gone.ttl || gone.n) : DS.charName(dch));
          if (!gone && u.ch !== sv.hero) cmdFell(u, gone);
          else if (dsMs > 0) (function (u0, g0) { setTimeout(function () { if (G.sim === sim) cmdFell(u0, g0); }, dsMs + 150); })(u, gone);      // 장면이 먼저, 창(쓰러짐 안내)은 그 뒤
          else cmdFell(u, gone);
        }
        if (u && u.side === 'enemy' && e.by && !e.flee) bark(sim.byId[e.by], 'kill');      // r32 전투 대사
        if (u && u.side === 'ally' && (u.role === 'merc' || u.role === 'cmd') && !e.flee) barkDown(u);
        if (u && u.side === 'enemy' && e.by) {      // 용병이 쓰러뜨린 적은 그 용병의 공훈
          var ku = sim.byId[e.by], km = ku && ku.role === 'merc' && ku.mid ? mercOf(ku.mid) : ku && ku.role === 'cmd' && ku.side === 'ally' && DS.bearer ? DS.bearer(sv, sv.chars[ku.ch]) : null, kb = statId(e.by);      // 4.0: 든 사람도 처치 공훈 +1 (보스 +6)
          G.stats.kills[kb] = (G.stats.kills[kb] || 0) + 1;
          if (km) {
            var kt0 = DS.mercTitle ? DS.mercTitle(km) || '' : '';
            km.k = (km.k || 0) + 1; DS.meritAdd(km, u.role === 'boss' ? 6 : 1);      // ⑭-4: 잠재력만큼 빨리
            if (u.role === 'boss') km.bk = (km.bk || 0) + 1;      // 보스를 잡은 전공
            if (u.role === 'boss') mercTalk(ku, 'boss', true); else if (Math.random() < 0.3) mercTalk(ku, 'kill');      // 보스를 잡았으면 꼭 한마디
            var kt1 = DS.mercTitle ? DS.mercTitle(km) || '' : '';
            if (kt1 && kt1 !== kt0) { G.view.float(ku.x, ku.y, '「' + kt1 + '」', '#f6cf57', { dy: -24, life: 2.2, delay: 0.4 }); later((km.n || ku.name || '') + '에게 별명이 붙었다. 「' + kt1 + '」', 3600); A('star'); }      // 전공 별명 (QA: 생겨도 알림이 없었다)
          }
        }
        else if (u && u.role === 'merc' && u.mid && !e.flee) {      // 용병은 쓰러지면 영영 잃는다
          var lm0 = mercOf(u.mid), lnk = ''; if (lm0) keepLW(u, lm0);      // r32: 마지막 한마디를 남긴다 if (lm0 && DS.mercTitle) { try { lnk = DS.mercTitle(lm0) || ''; } catch (x) { lnk = ''; } }      // 별명은 잃기 전에 (추모 목록에도 남긴다)
          var mrec = lm0, lost = DS.loseMerc(sv, u.mid);
          if (lost) {
            var dsM = deathFx(u, e, mrec || lost, false, lost.n || u.name);      // r16 fx: 따르는 이의 죽음 장면
            G.lost.push(lost); G.mdT = 0;
            var fat = G.scn ? G.scn.name : G.zone.name, frec = DS.fallenRecord ? DS.fallenRecord(lost, fat) : { n: lost.n, type: lost.type, g: lost.g, x: lost.x || 0, k: lost.k || 0, b: lost.b || 0, at: fat };      // 기획팀의 추모 기록(별명·버릇까지)
            if (lnk && !frec.nk) frec.nk = lnk;
            sv.fallen = DS.fallenTrim((sv.fallen || []).concat([frec]));
            if (!dsM) G.view.float(u.x, u.y, (lost.n || '') + ' 전사', '#ff8a9a', { dy: -20, life: 2, delay: 0.15 });      // 피해 숫자·말버릇과 겹치지 않게 조금 위·한 박자 뒤 G.view.shake = Math.max(G.view.shake, 0.5);
            mourn(lost); mournTalk(u);
            if (DS.linMercDied) { try { G.lineageQ = (G.lineageQ || []).concat(DS.linMercDied(sv, lost, fat)); } catch (x) {} }      // 가계도의 사람(배우자·아이)이면 가족이 슬퍼한다
            if (!sv.seen.mdead) { sv.seen.mdead = 1; setTimeout(function () { coach($('.chip.sel .md') || $('.chip .md'), '가문원은 돌아오지 않는다', { long: '가문원은 쓰러지면 돌아오지 않는다. 많이 다치면 스스로 물러난다.', ms: 5600 }); }, 3200); }
          }
        }
        break;
      case 'leader': select(e.id); break;
      case 'ult': u = sim.byId[e.id]; if (u) ultFx(u, e.sk); break;      // r32 필살기: 컷인 · 번쩍 · 흔들림 · 소리
      case 'taunt':      // 엔진(2.8): 방패 용병의 도발 — 「도발!」 말풍선은 엔진이 say 로 함께 보낸다. 처음 한 번만 무엇인지 알려 준다
        if (!sv.seen.taunt) { sv.seen.taunt = 1; }      // r27 ux: 도발 코치 표시는 뺐다 (전장 글자 「도발」로 충분)
        break;
      case 'arrive':
        if (e.id === G.sel) {
          var me = sim.byId[G.sel], p = G.pendPoi, g = G.goal, at = function (q) { return me && Math.abs(me.x - q.x) + Math.abs(me.y - q.y) <= 1; };
          if (p && at(p) && pressed()) { G.goal = { x: p.x, y: p.y, poi: p, zone: G.zone.id, tries: 0 }; toast('적이 가까이 있다. 물리치면 들어간다', 2400); break; }      // 문 앞에서 싸움이 붙었다: 끝나면 연다(전엔 잊고 멈춰 섰다)
          if (p) { if (at(p)) { G.goal = g = null; openPoi(p); } else if (!g) G.pendPoi = null; }
          if (g) { if (at(g)) G.goal = null; else if (!sim.combat) setTimeout(function () { if (G.goal === g) resumeGoal(); }, 500); }      // 싸움 중이면 끝난 뒤에 다시 간다
        }
        break;
      case 'blocked':      // 엔진: 이동 명령이 끝내 막혀 포기했다
        if (e.id === G.sel) { G.goal = null; G.pendPoi = null; toast('길이 막혔다. 다른 곳을 눌러 돌아간다', 2800); }
        break;
      case 'aggro': u = sim.byId[e.id]; if (u && u.role === 'boss' && u.obj && !u.fake && G.bossId !== u.id) { showBoss(u); bigCine(u, sim); } break;
      case 'phase': u = sim.byId[e.id]; if (u) { showBoss(u); if (!bigCine(u, sim, '쓰러뜨려도 끝이 아니었다')) banner(u.name, '쓰러뜨려도 끝이 아니었다', 2600); if (G.view && !calm()) G.view.hitStop(0.12); } break;
      case 'bossUlt': u = sim.byId[e.id]; if (u && SK[e.sk]) bossCut(u, SK[e.sk]); break;      // 2.3.0 큰 보스의 비기: 보스 컷인
      case 'enrage': u = sim.byId[e.id]; if (u) { vban('rage', u.name + ' 격노', (u.enr && u.enr.say) || '', calm() ? 1100 : 1500); A('phase'); if (u.id === G.bossId) { var bel0 = $('#boss'); if (bel0) bel0.classList.add('rage'); } } break;
      case 'wave': vban('wave', e.text || '증원!', '', 1400); A('warn'); break;
      case 'erase': erBegin(e); break;      // r17 boss: 어스름의 왕의 이름 지우기
      case 'shade': case 'shadeEnd': if (DS.shadeUI) DS.shadeUI.ev(e); break;      // 2.5.0 이름 부르기 (shade.js)
      case 'eraseSave': erSaved(e); break;
      case 'eraseEnd': erEnd(e); break;
      case 'say': if (e.id === G.bossId && !(G.bcast && G.bcast.tid)) G.bcast = { name: e.text, until: performance.now() + 1500 }; break;
      case 'cast':
        if (e.id === G.bossId && SK[e.sk]) G.bcast = { tid: e.tid, name: SK[e.sk].name, dur: e.dur, t0: sim.t };
        if (e.side === 'enemy' && !sv.seen.tele) { sv.seen.tele = 1; softPause(6000); var tt0 = e.tiles && e.tiles[0]; coach(tt0 ? { x: tt0[0], y: tt0[1] } : null, '붉은 칸을 피해라', { long: '붉게 깜빡이는 칸에 곧 공격이 떨어진다. ' + (DS.Joy && DS.Joy.on() ? '조이스틱으로 붉지 않은 칸으로 비킨다' : '붉지 않은 칸을 눌러 비킨다'), ms: 6000 }); }      // r8 hud: 첫 회만 잠깐 멈춘다 (명령을 내리거나 6초 뒤 다시 흐른다)
        break;
      case 'castEnd': if (G.bcast && G.bcast.tid === e.tid) G.bcast = { name: G.bcast.name, until: performance.now() + 600 }; break;
      case 'win': if (G.scn) onWin(); break;
      case 'lose': onLose(); break;
    }
    } catch (x) { loopErr(x, 'ev:' + e.t); }
  }
  if (G.huntDirty) { G.huntDirty = false; updateQuest(); }
  if (lvl) { refreshUnits(); for (var id in G.chipEls) { var c = G.chipEls[id], ch2 = sv.chars[+id.slice(1)]; if (ch2 && c.L !== ch2.L) { var pro0 = DS.tierOfL(ch2.L) > DS.tierOfL(c.L); c.L = ch2.L; c.lv.innerHTML = DS.tierOfL(ch2.L) + '단 <i>Lv' + DS.lvOfL(ch2.L) + '</i>'; if (c.tr) c.tr.textContent = 'Lv' + DS.lvOfL(ch2.L); if (!calm()) { c.el.classList.remove('lvup', 'promo'); void c.el.offsetWidth; c.el.classList.add('lvup'); if (pro0) c.el.classList.add('promo'); } var nb = $('.cn b', c.el), nn = DS.charName(ch2); if (nb && nb.textContent !== nn) { nb.textContent = nn; nb.parentNode.classList.toggle('long', nn.length >= 7); }; } } if (!G.scn) updateQuest(); renderActs(); }
  // 전투 시작·끝
  if (sim.combat !== G.wasCombat) {
    G.wasCombat = sim.combat;
    if (sim.combat) {
      if (!G.scn && DS.linBattleStart) DS.linBattleStart(sv);
      if (!G.scn) { G.gain = { exp: 0, gold: 0, loot: [] }; DS.Audio.bgm('battle'); G.fightN = (G.fightN || 0) + 1; G.stats.hurt = {}; G.stats.hurtAll = 0; G.bearLost = []; }      // r8 hud: 들판은 싸움마다 「첫 지휘관」·받은 피해를 새로 센다
      setTimeout(function () { if (G.sim === sim && sim.combat) barkAny('start'); }, 1200);      // r32 전투 대사: 싸움이 붙은 직후
      if (!sv.seen.combat) { sv.seen.combat = 1; }      // r27 ux: 첫 싸움의 코치 표시는 둘만 (전체 자동 · 붉은 칸). 틱 설명은 도움말에      // r26: 글 상자 대신 코치 표시      // r8 hud: 세 줄짜리 상자가 첫 싸움의 전장을 덮었다 → 짧게
      else if (G.scn ? !G.scnSaid : Math.random() < 0.35) {      // 싸움이 붙으면 용병 하나가 한마디 (시나리오는 첫 싸움에, 들판은 가끔)
        var ms = sim.units.filter(function (x) { return x.role === 'merc' && !x.dead && x.mid; });
        if (ms.length && mercTalk(ms[Math.floor(Math.random() * ms.length)], 'start')) G.scnSaid = true;
      }
    }
    else if (!G.scn && !G.ending) {
      zoneBgm(G.zone); G.view.tgt = null;
      if (G.gain.exp) setInfo('전투 종료, 경험치 +' + fmtN(G.gain.exp) + ' · +' + fmtN(G.gain.gold) + '골드' + (G.gain.loot && G.gain.loot.length ? ' · 전리품 ' + G.gain.loot.length : ''), 2400);      // r8 hud: 토스트 → 아래 정보 줄 (자동 사냥에서 6초마다 글 상자가 뜨던 것)
      if (G.itemsOpen) { G.itemsOpen = null; }
      // 「자동이 둘」 안내는 첫 들판 싸움이 끝난 뒤에 (들판에 들어서자마자 띄우면 길 안내·첫 전투 안내가 1초 만에 덮었다)
      if (!sv.seen.autoTip && !sv.cleared[1] && !sv.opt.hunt) { sv.seen.autoTip = 1; var hb = $('#bHunt'); if (hb) { hb.classList.add('hint'); setTimeout(function () { hb.classList.remove('hint'); }, 5600); } coach(hb, '켜면 모두 알아서 싸운다', { long: '전체 자동을 켜면 모든 가문이 알아서 싸운다. 아래 문장을 누르면 고른 가문만 따로 정한다', ms: 5200 }); }
      setTimeout(function () { if (!G.scn && !(G.sim && G.sim.combat)) G.gain = { exp: 0, gold: 0, loot: [] }; }, 2500);
      if (G.gain.exp) meritAll(2);
      linEnd(false);      // 필드에서 쓰러진 지휘관도 싸움이 끝나면 숨을 거둔다
      refillMercs(); renderChips(); persist(); flushPromos();
      if ((G.lineageQ && G.lineageQ.length) || (DS.linVacant && DS.linVacant(sv).length)) lineageFlush(function () { if (!G.scn && !(G.sim && G.sim.combat)) rebuildParty(); persist(); });
      if (G.goal) setTimeout(resumeGoal, 700);      // 길 안내를 받던 중이었으면 싸움이 끝난 뒤 다시 간다
    }
  }
}
// 전리품: 굴림과 가방에 넣기는 아이템팀(DS.rollDrop)의 함수가 하고, 여기서는 떨어진 자리에 보여 주기만 한다.
// 3배속 자동 사냥에서도 화면을 덮지 않게: 소모품·보통 장비는 글자만(0.5초에 하나), 유니크·전설(장비 등급 4·5)은 크게 불꽃과 소리.
var dropT = 0;
function showDrop(d, x, y, i) {
  if (d && d.kind === 'bounty') { bannerSoon('현상 수배 달성', String(d.line || d.title || d.name || ''), 2800); A('rare'); return; }      // 글자는 띄우지 않고 배너로 (같은 자리의 보상 장비 글자와 겹치지 않게)
  var g = Math.max(1, Math.min(5, d.grade || 1)), col = (DS.GRADES[g] || {}).col || '#efe6d0', nm = String(d.name || '') + (d.n > 1 ? ' ×' + d.n : ''), now = performance.now();
  if (G.view.lootFx) { try { G.view.lootFx(x, y, g, { kind: d.kind, id: d.id, i: i }); } catch (e) {} }      // 그래픽팀의 아이콘 튀어오름·빛기둥 (없으면 글자만)
  if (g <= 2) { if (now - dropT < 500) return; dropT = now; G.view.float(x, y, nm, col, { dy: -4, life: 0.9, delay: 0.15, small: true }); return; }      // small: 그래픽팀이 작은 글씨를 지원하면 그때 작아진다
  G.view.float(x, y, nm, col, { dy: -6 - i * 8, life: g >= 4 ? 2.2 : 1.5, big: g >= 4, delay: 0.15 + i * 0.12 });
  G.view.burst(x, y, [col, '#fff6d0'], g >= 4 ? 14 : 6, { up: 30, grav: -12, spd: 12, life: 0.8 });
  lootFly(x, y, d);      // r26: 귀한 것은 그림이 부대(가방) 단추로 날아가고 붉은 점이 남는다
  if (d.kind === 'gear' && g >= 4) { DS.lootCall([d], { delay: 350 }); return; }      // 2.1.1: 귀한 장비는 가운데에 크게 (소리도 거기서)
  A(g >= 4 ? 'rare' : 'star');
}
// 2.1.1: 귀한 장비(유니크·전설)를 얻으면 화면 가운데에 크게 띄운다 — 싸움은 멈추지 않는다. 누르면 닫히고, 몇 초 뒤 저절로 사라진다. 여러 점이면 차례로.
//   전설: 금빛 빛살·번쩍임·흔들림·팡파르 · 유니크: 보랏빛 빛살·종소리. 결과 창 위에도 뜬다 (시나리오 승리 보상).
var lcQ = [], lcCur = null;
function lcInfo(d) { var g = null; try { g = DS.gear(d.id); } catch (x) { g = null; } return g; }
DS.lootCall = function (list, o) {
  (list || []).forEach(function (d) { if (d && d.kind === 'gear' && (d.grade || 0) >= 4 && !d._lc) { d._lc = 1; lcQ.push(d); } });      // _lc: 한 번 보인 것은 다시 띄우지 않는다 (들판에서 주워 결과 창에도 실린 것)
  lcQ.sort(function (a, b) { return (b.grade || 0) - (a.grade || 0); });
  if (!lcCur) setTimeout(lcNext, (o && o.delay) || 0);
};
function lcNext() {
  if (lcCur) return;
  var d = lcQ.shift(), host = $('#app'); if (!d || !host) return;
  var g = lcInfo(d), leg = (d.grade || 0) >= 5, col = (DS.gearCol && DS.gearCol(d.grade)) || (leg ? '#f0b64a' : '#b181e6');
  var ic = ''; try { ic = DS.iconHtml ? DS.iconHtml('gear', d.id, { size: 56 }) : ''; } catch (x) { ic = ''; }
  var lore = g && (g.lore || (g.def && g.def.lore)) || '', st = g ? String(g.stat || '') : '';
  var el = document.createElement('div'); el.className = 'lootcall ' + (leg ? 'lg' : 'uq'); el.setAttribute('role', 'status'); el.style.setProperty('--lc', col);
  el.innerHTML = '<i class="lcrays"></i><div class="lccard"><small class="lctag">' + (leg ? '전설 장비' : '유니크 장비') + (d.sold ? ' · 가방이 가득 차 팔았다' : '') + '</small>' +
    '<span class="lcic">' + ic + '</span><b class="lcnm">' + esc(String((g && g.short) || d.name || '')) + '</b>' +
    (g && g.name && g.short && g.name !== g.short ? '<em class="lcsuf">' + esc(g.name.slice(g.short.length).trim()) + '</em>' : '') +
    (st ? '<span class="lcst">' + esc(st) + '</span>' : '') + (lore ? '<q class="lclore">' + esc(lore) + '</q>' : '') + '<small class="lcok">눌러서 닫기</small></div>';
  host.appendChild(el);
  var cm = calm(), done = false;
  var close = function () { if (done) return; done = true; clearTimeout(t); el.classList.add('out'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); lcCur = null; lcNext(); }, 260); };
  el.addEventListener('click', function (ev) { ev.stopPropagation(); close(); });
  var t = setTimeout(close, leg ? 4600 : 3400);
  lcCur = { d: d, el: el, close: close };
  A(leg ? 'legend' : 'rare'); if (DS.Audio && DS.Audio.duck) DS.Audio.duck(leg ? 8 : 5, leg ? 2200 : 1400);
  if (G.view && !cm) { G.view.flashA = Math.max(G.view.flashA || 0, leg ? 0.22 : 0.1); if (leg) G.view.shake = Math.max(G.view.shake || 0, 0.35); }
  try { if (leg && navigator.vibrate && !cm) navigator.vibrate([40, 60, 90]); } catch (x) {}
}
DS.lootCallClear = function () { lcQ.length = 0; if (lcCur) lcCur.close(); };
function lootFly(x, y, d) {
  var bm = $('#bMenu'), cv = $('#cv'), host = $('#s-game'); if (!bm || !cv || !host || !G.view) return;
  bm.classList.add('newdot'); G.bagNew = true;
  if (calm() || host.hidden || (G.view.onScreen && !G.view.onScreen(x, y))) return;
  var ic = ''; try { ic = DS.iconHtml ? DS.iconHtml(d && d.kind === 'item' ? 'item' : 'gear', d && d.id, { size: 24 }) : ''; } catch (e) { ic = ''; }
  if (!ic) return;
  var s = G.view.screenOf(x, y), cr = cv.getBoundingClientRect(), br = bm.getBoundingClientRect(), hr = host.getBoundingClientRect();
  var el = document.createElement('i'); el.className = 'coinfly loot'; el.innerHTML = '<i class="cf">' + ic + '</i>';
  el.style.cssText = '--x0:' + Math.round(cr.left - hr.left + s.x - 12) + 'px;--y0:' + Math.round(cr.top - hr.top + s.y - 20) + 'px;--x1:' + Math.round(br.left - hr.left + br.width / 2 - 12) + 'px;--y1:' + Math.round(br.top - hr.top + br.height / 2 - 12) + 'px;--d:.7s;animation-delay:.35s';
  el.firstChild.style.animationDelay = '.35s'; host.appendChild(el);
  var fin = function () { if (!el.parentNode) return; el.parentNode.removeChild(el); bm.classList.remove('jr'); void bm.offsetWidth; bm.classList.add('jr'); };
  el.addEventListener('animationend', function (ev) { if (ev.target === el) fin(); }); setTimeout(fin, 1400);
}
function onDrops(e) {
  var sv = G.save, drops = null;
  if (G.scn && e && !e.scn) e.scn = 1;      // 2.1.1: 시나리오 싸움에서는 장비가 떨어지지 않는다 (승리 보상에서 한 번)
  if (DS.rollDrop) { try { drops = DS.rollDrop(sv, e); } catch (x) { drops = null; } }
  if (drops && drops.length) { G.gain.loot = G.gain.loot || []; var k = 0; drops.forEach(function (d) { if (!d) return; G.gain.loot.push(d); showDrop(d, e.x, e.y, d.kind === 'bounty' ? 0 : k++); }); }
}
// 지역 배경음: 그래픽팀의 지역 곡 고르기가 있으면 그것으로
function zoneBgm(z) {
  var a = DS.Audio, t = null;
  if (G.mournOn && z && z.town && !G.scn) { a.bgm('mourn'); return; }      // 2.6 애도: 전멸 뒤 교회 앞을 떠날 때까지는 애도 곡 (mournTick 이 푼다)
  G.mournOn = false;
  if (a.zoneTrack) { try { t = a.zoneTrack(z); } catch (x) { t = null; } }
  a.bgm(typeof t === 'string' && t ? t : z.town ? 'town' : 'map');
}
// 2.6 애도 곡은 전멸 카드에서 시작해 의식을 지나, 교회 앞을 떠나면(문에서 네 칸 · 마을을 나섬 · 싸움에 들어감) 지역 곡으로 돌아간다. 다른 곳에서 쓰려면 DS.Audio.bgm('mourn') · DS.mournBgm(true|false)
function mournTick(now) {
  if (!G.mournOn || now - (G.mournT || 0) < 400) return; G.mournT = now;
  if (G.ending || $('.ov', root()) || (DS.cineBusy && DS.cineBusy())) return;
  var z = G.zone, me = G.sim && G.sim.byId[G.sel], cp = z && z.town ? churchPos(z.id) : null;
  if (G.scn || !z || !z.town || !cp || !me || Math.abs(me.x - cp.x) + Math.abs(me.y - cp.y) > 4) { G.mournOn = false; if (z && !G.scn) zoneBgm(z); }
}
DS.mournBgm = function (on) { G.mournOn = !!on; if (on) DS.Audio.bgm('mourn'); else if (G.zone && !G.scn) zoneBgm(G.zone); };
function mercOf(mid) { var ms = G.save.mercs; for (var i = 0; i < ms.length; i++) if (ms[i].id === mid) return ms[i]; return null; }
// 전투 통계의 주인: 소환수가 한 일은 부른 지휘관의 몫으로 센다
function statId(id) { var u = G.sim.byId[id]; return u && u.role === 'summon' && u.owner ? u.owner : id; }
// 용병의 한마디 (DS.mercSay 가 있을 때만). 4초(실시간)에 하나를 넘지 않는다 — 3배속에서도 화면을 덮지 않게.
var sayT = 0;
function mercTalk(u, when, force, delay) {
  if (!DS.mercSay || !u || u.dead || !u.mid || !G.view) return false;
  if (!force && G.view.casting && G.view.casting()) return false;      // r8 gfx: 화면 안에 적 예고가 떠 있는 동안은 잡담을 미룬다 — 그 순간엔 예고만 보이게
  var now = performance.now(); if (!force && now - sayT < 4000) return false;
  var m = mercOf(u.mid), t = null; if (!m) return false;
  try { t = DS.mercSay(m, when); } catch (x) { t = null; }
  if (!t) return false;
  sayT = now; G.view.float(u.x, u.y, String(t), (DS.GRADES[m.g] || {}).col || '#fff3c4', { dy: -16, life: 2.2, delay: delay || 0 });
  return true;
}
DS.mercTalk = function (u, when) { return mercTalk(u, when, true); };      // 시험용: 그 사람의 성격 한마디를 지금 띄운다 (tools/t_text.js)
// 동료가 쓰러지면 곁의 용병이 한마디 (같은 지휘관의 용병 먼저)
function mournTalk(dead) {
  setTimeout(function () {
    var sim = G.sim, ms = sim ? sim.units.filter(function (x) { return x.role === 'merc' && !x.dead && x.mid; }) : [];
    ms.sort(function (a, b) { return (a.owner === dead.owner ? 0 : 1) - (b.owner === dead.owner ? 0 : 1); });
    if (ms.length) mercTalk(ms[0], 'mourn', true);
  }, 900);
}
// ── r32 전투 대사: 그 집(가문 이름)에 맞는 한마디를 말풍선으로 (설정 「전투 대사」 sv.opt.bark, 기본 켬).
//   전체로 6~10초(실시간)에 하나. 잡담(mercTalk)과 2초 안에 겹치지 않는다. 고른 가문 유닛과 그 바로 밑(말풍선이 고른 이의 체력 막대를 덮는 자리)은 말하지 않는다.
var barkT = 0, barkGap = 7000;
function barkHouse(u) {
  var sv = G.save, B = DS.BARKS || {}, ch = u.role === 'merc' || u.role === 'summon' ? (G.sim.byId[u.owner] ? sv.chars[G.sim.byId[u.owner].ch] : null) : sv.chars[u.ch];
  if (!ch) return null;
  var nm = ch.id === sv.hero ? (sv.lin && sv.lin.sur) || '' : (DS.LIN_HOUSE && DS.LIN_HOUSE[ch.cls]) || '';
  return B[nm] || (ch.id === sv.hero ? B._lord : null) || B._lord;
}
function barkOk(u) {
  if (!u || u.dead || u.side !== 'ally' || !(u.role === 'cmd' || u.role === 'merc') || !G.view || !G.view.bark) return false;
  var sel = G.sim.byId[G.sel];
  if (sel && sel !== u && Math.abs(u.x - sel.x) <= 2 && u.y >= sel.y && u.y - sel.y <= 2) return false;
  return G.view.onScreen(u.x, u.y);
}
function bark(u, when, force) {
  var sv = G.save; if (!sv || (sv.opt && sv.opt.bark === false) || !G.sim) return false;
  if (!u || (u.id === G.sel && when !== 'win' && when !== 'skill')) return false;
  if (!barkOk(u)) return false;      // force 는 확률만 건너뛴다 (자리 규칙은 그대로)
  var now = performance.now(); if (now - barkT < barkGap || now - sayT < 2000) return false;
  if (G.view.dz || (G.view.casting && G.view.casting())) return false;      // 죽음 장면·적 예고가 먼저
  if (!force && !(Math.random() < ((DS.BARK_P || {})[when] == null ? 0.3 : DS.BARK_P[when]))) return false;
  var H = barkHouse(u), L = H && H[when]; if (!L || !L.length) return false;
  barkT = now; barkGap = 6000 + Math.random() * 4000;
  G.view.bark(u.id, L[Math.floor(Math.random() * L.length)], 2.1);
  return true;
}
function barkAny(when, force) {
  if (!G.sim) return false;
  var us = G.sim.units.filter(function (x) { return x.side === 'ally' && !x.dead && (x.role === 'cmd' || x.role === 'merc') && x.id !== G.sel && barkOk(x); });
  if (!us.length) return false;
  return bark(us[Math.floor(Math.random() * us.length)], when, force);
}
function barkDown(dead) {
  setTimeout(function () {
    var sim = G.sim; if (!sim) return;
    var own = dead.role === 'merc' ? dead.owner : dead.id;
    var us = sim.units.filter(function (x) { return x.side === 'ally' && !x.dead && x.id !== dead.id && (x.owner === own || x.id === own) && barkOk(x) && x.id !== G.sel; });
    if (us.length) bark(us[Math.floor(Math.random() * us.length)], 'down');
  }, 2600);
}
DS.bark = bark;
// ── r32 필살기 연출 (r38: 컷인은 위 막대 아래의 얇은 이름표 0.7초 — 가운데 띠가 기술 그림을 가렸다). 그 밖의 가솔은 7초에 한 번만 컷인, 나머지는 금빛 외침.
//   움직임 줄이기면 미끄러짐·흔들림·번쩍임 없이 띠만 짧게.
function ultFx(u, sk) {
  var S = SK[sk]; if (!S || !G.view) return;
  var now = performance.now(), own = u.role === 'cmd' ? u.id : u.owner, mine = own === G.sel, big = u.side === 'ally' && (u.role === 'cmd' || mine || now - (G.ultCutT || 0) > 7000);
  if (!G.view.onScreen(u.x, u.y) && !mine && u.role !== 'cmd') return;
  A('ult');
  if (big && now - (G.ultCutT || 0) > 1400) { G.ultCutT = now; ultCut(u, S); }
  else G.view.float(u.x, u.y, S.name, '#f6cf57', { dy: -20, life: 1.3, call: true });
  if (!calm()) { var gx = S.grand ? 1.5 : 1; G.view.flashA = Math.max(G.view.flashA || 0, (big ? 0.06 : 0.04) * gx); G.view.shake = Math.max(G.view.shake || 0, (big ? 0.16 : 0.1) * gx); if (big && G.view.hitStop) G.view.hitStop(0.05); }      // 2.2.9: 윗길 필살기는 조금 더 세게      // r38: 번쩍임·흔들림은 가볍게, 멈춤은 50ms — 기술 그림이 그대로 보이게
  if (u.side === 'ally') setTimeout(function () { if (G.sim && G.sim.byId[u.id] && !u.dead) bark(u, 'skill'); }, 950);
}
// ───────── 2.3.0 큰 보스: 등장 연출 · 비기 컷인 ─────────
// 등장 연출 (사건 연출 DS.cine 의 「강적」): 큰 몸의 보스가 처음 깨어날 때 한 번 — 큰 그림 · 이름 · 칭호 · 한마디. 설정 「사건 연출: 끔」이면 없다. 「짧게」 · 움직임 줄이기면 짧게
function bigCine(u, sim, sub) {
  if (!u || !(u.fw > 1 || u.fh > 1) || (G.quiet && !DS.bigCineForce) || (DS.cineMode && DS.cineMode() === 'off')) return false;
  var seen = sim.bigSeen || (sim.bigSeen = {}); if (seen[u.type]) return false; seen[u.type] = 1;
  var pic = DS.bigPortrait ? DS.bigPortrait(u.type, u.fw, u.fh, 3) : null, por = [];
  if (pic) { try { por.push('<img class="cbimg" alt="" src="' + pic.toDataURL() + '" style="--bw:' + u.fw + ';--bh:' + u.fh + '">'); } catch (x) {} }
  var sz = u.fw + '×' + u.fh + ' 칸';
  DS.cine({ k: 'boss', title: u.name, sub: sub || bossLore(u, 'title') || u.title || '', say: bossQuote(u, 'say'), note: '큰 몸 · ' + sz + (u.enr ? ' · 체력이 ' + Math.round(u.enr.th * 100) + '% 아래면 격노' : ''), por: por, fc: '#ff4d6d' }, function () {});
  return true;
}
DS.bigCine = bigCine;
// 비기 컷인: 필살기 컷인 띠를 붉게 — 큰 그림 · 보스 이름 · 비기 이름. 효과 「가볍게」 · 빠른 배속이면 더 짧고 수수하게
function bossCut(u, S) {
  var sg = $('#s-game'); if (!sg || !G.view) return;
  A('ult'); if (!calm() && G.view.hitStop) G.view.hitStop(0.06);
  var el = $('#ultcut'); if (!el) { el = document.createElement('div'); el.id = 'ultcut'; el.setAttribute('aria-hidden', 'true'); sg.appendChild(el); }
  var sv = G.save, spd = DS.spdOf ? DS.spdOf(sv.opt && sv.opt.speed) : 1, lite = DS.fxLite && DS.fxLite(), ud = Math.round((spd >= 2 ? 700 : spd >= 1.5 ? 820 : 980) * (lite ? 0.75 : 1));
  el.style.setProperty('--fc', '#ff4d6d'); el.style.setProperty('--ud', ud + 'ms'); el.dataset.k = 'boss';
  el.innerHTML = '<div class="ucb"><i class="ucl"></i><span class="ucp"></span><span class="uct"><small>' + esc(u.name || '') + '</small><span class="ucn"><i>비기</i><b>' + esc(S.name) + '</b></span></span></div>';
  try { var pic = DS.bigPortrait ? DS.bigPortrait(u.type, u.fw || 1, u.fh || 1, 1) : null; if (pic) { var c2 = document.createElement('canvas'), Wc = 96; c2.width = Wc; c2.height = Wc; var g = c2.getContext('2d'), k = Math.min(Wc / pic.width, Wc / pic.height) * 1.25; g.imageSmoothingEnabled = true; g.drawImage(pic, (Wc - pic.width * k) / 2, Wc - pic.height * k * 0.92, pic.width * k, pic.height * k); $('.ucp', el).appendChild(c2); } } catch (x) {}
  var tp = $('#top'), sgr = sg.getBoundingClientRect(); if (tp) { var tr = tp.getBoundingClientRect(); el.style.top = Math.max(4, Math.round(tr.bottom - sgr.top + 4)) + 'px'; }
  el.classList.remove('on', 'calm', 'grand', 'boss', 'lite'); void el.offsetWidth; if (calm()) el.classList.add('calm'); if (lite) el.classList.add('lite'); el.classList.add('boss', 'on');
  clearTimeout(G.ultCutTm); G.ultCutTm = setTimeout(function () { el.classList.remove('on'); }, ud + 30); G.ultCutT = performance.now();
  if (u.id === G.bossId) G.bcast = { name: S.name, until: performance.now() + 2600 };
}
DS.bossCut = bossCut;
function ultCut(u, S) {
  var sg = $('#s-game'); if (!sg) return;
  var el = $('#ultcut'); if (!el) { el = document.createElement('div'); el.id = 'ultcut'; el.setAttribute('aria-hidden', 'true'); sg.appendChild(el); }
  var sv = G.save, ch = u.role === 'cmd' ? sv.chars[u.ch] : (G.sim.byId[u.owner] ? sv.chars[G.sim.byId[u.owner].ch] : null);
  var hn = ch ? (ch.id === sv.hero ? (DS.houseName ? DS.houseName(sv) : '') : (DS.LIN_HOUSE && DS.LIN_HOUSE[ch.cls] ? DS.LIN_HOUSE[ch.cls] + ' 가문' : DS.flagName(ch.cls))) : '';
  var fc = ch ? (DS.FLAG[ch.cls] || '#c9a96a') : '#c9a96a', who = u.mn || u.name || '';
  var grand = !!(S.grand || (u.tier >= 8 && u.role === 'cmd'));      // 2.2.9: 8단 위 — 금 테 · 긴 이름 띠 · 더 큰 빛 (빠른 배속이면 그만큼 짧게)
  var spd = DS.spdOf ? DS.spdOf(sv.opt && sv.opt.speed) : 1, ud = Math.round((spd >= 2 ? 620 : spd >= 1.5 ? 720 : 850) * (grand ? 1.18 : 1));      // 2.2.5: 빠른 배속이면 더 짧게 (싸움은 멈추지 않는다)
  el.style.setProperty('--fc', fc); el.style.setProperty('--ud', ud + 'ms'); el.dataset.k = DS.ultCls ? DS.ultCls(S, u) : '';
  var tn = grand && ch ? u.tier + '단 ' + DS.tierName(ch.cls, u.tier) : '';
  el.innerHTML = '<div class="ucb"><i class="ucl"></i>' + (grand ? '<i class="ucg"></i>' : '') + '<span class="ucp"></span><span class="uct"><small>' + esc([tn, hn, who].filter(Boolean).join(', ')) + '</small><span class="ucn"><i>' + (grand ? '오의' : '필살') + '</i><b>' + esc(S.name) + '</b></span></span>' + (S.ic && DS.ICONS.indexOf('sk_' + S.ic) >= 0 ? '<span class="uci">' + DS.icon('sk_' + S.ic, 30) + '</span>' : '') + '</div>';      // 2.2.6: 오른쪽 끝에 그 필살기의 그림      // 2.2.5: 위 막대 아래의 넓은 띠 — 큰 초상 · 가문과 이름 · 기술 이름 · 속도선
  try {
    var sp = DS.unitSprite(u), cv = DS.spriteCanvas(sp[0], sp[1], { hd: 1 }), c2 = document.createElement('canvas'), W = 72;
    c2.width = W; c2.height = W; var g = c2.getContext('2d'); g.imageSmoothingEnabled = false; var hh = W * cv.height / cv.width; g.drawImage(cv, 0, 0, cv.width, cv.height, 0, W - hh, W, hh);
    $('.ucp', el).appendChild(c2);
  } catch (x) {}
  var tp = $('#top'), sgr = sg.getBoundingClientRect(); if (tp) { var tr = tp.getBoundingClientRect(); el.style.top = Math.max(4, Math.round(tr.bottom - sgr.top + 4)) + 'px'; }      // r38: 위 막대 바로 아래에 붙는다 (전장 가운데를 가리지 않는다) · 2.2.5: 좌우 끝까지
  el.classList.remove('on', 'calm', 'grand'); void el.offsetWidth; if (calm()) el.classList.add('calm'); if (grand) el.classList.add('grand'); el.classList.add('on');
  clearTimeout(G.ultCutTm); G.ultCutTm = setTimeout(function () { el.classList.remove('on'); }, ud + 30);
}
DS.ultCut = ultCut;
// 누군가 7단 10레벨에 닿았다: 그 깃발이 얼마나 모였는지 알린다. 다 모였으면 교회로.
function fuseNews(up) {
  var sv = G.save, P = DS.fuseProg(sv); if (!P.can) return;
  var nm = up && up.who ? (up.hero ? DS.charName(sv.chars[sv.hero]) : (up.who.ttl || up.who.n || '')) : '';
  if (P.ok) banner('합일 준비 끝', '교회에서 서로 다른 가문의 가주 셋을 고른다', 3400);
  else banner((nm ? nm + ', ' : '') + '7단 Lv10', '합일: 7단 Lv10 가주 ' + P.n + '/' + P.of + (sv.crest ? '' : ', 맹세의 깃대는 아직'), 2800);
  if (!G.scn) updateQuest();
}
// ───────── r17 boss: 이름 지우기 (30번 어스름의 왕) ─────────
// 엔진(engine.js erStart…)이 'erase' → 'eraseSave'* → 'eraseEnd' 를 보낸다. 여기서는 화면 위 띠(이름 · 남은 시간 · 감싼다/부른다), 왕의 한마디, 곡, 외침.
//   띠의 단추: 「감싼다」 = 그 사람을 감쌀 수 있는 가장 가까운 가주에게 그 자리로 가라는 이동 명령 · 「부른다」 = 대장의 이름 부르기(한 싸움에 한 번, 틱이 차는 대로).
function erFill(t, o) { return fill(String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return o && o[k] != null ? o[k] : m; })); }
function erNm(u) { return u ? String(u.mn || u.name || '') : ''; }
function erBandEl() { var el = $('#erase'); if (!el) { var sg = $('#s-game'); if (!sg) return null; el = document.createElement('div'); el.id = 'erase'; el.setAttribute('role', 'alert'); sg.appendChild(el); } return el; }
function erBandOff() { var el = $('#erase'); if (el) { el.classList.remove('on'); el.innerHTML = ''; } }
function erBegin(e) {
  var sim = G.sim, sv = G.save, T = DS.ERASE_TXT, K = sim.byId[e.id], gen = (DS.egActive && DS.egActive(sv) && sv.eg && sv.eg.gen) || 1;
  var us = e.ids.map(function (id) { return sim.byId[id]; }).filter(Boolean), names = {}, list = us.map(function (u) { names[u.id] = erNm(u); return erNm(u); });
  G.er = { k: e.k, ids: e.ids.slice(), names: names, king: e.id, t0: performance.now(), real: e.dur / DS.ERASE.slow, saved: {}, how: {} };
  G.erMarkN += us.length;
  var line = (gen > 1 && T.kingGen ? T.kingGen : T.king)[e.k % T.king.length];
  if (K) G.view.float(K.x, K.y, line, '#c7c2dc', { dy: -30, life: 2.6 });
  if (G.view.erOn) G.view.erOn({ ids: e.ids, names: names, dur: G.er.real, king: e.id });
  DS.Audio.bgm('erase'); A('dark'); setTimeout(function () { A('phase'); }, 120);
  var el = erBandEl(); if (!el) return;
  var first = !sv.seen.erase; sv.seen.erase = 1;
  el.innerHTML = '<p class="ek">' + esc(line) + '</p><b class="et">' + esc(erFill(T.band, { list: list.join(', ') })) + '</b><i class="ebar"><u></u></i>' +
    '<div class="erow">' + us.map(function (u) { return '<span class="echip" data-er="' + u.id + '"><em>' + esc(names[u.id]) + '</em><button class="ecov" data-cov="' + u.id + '">' + esc(T.cover) + '</button><button class="ecall" data-call="' + u.id + '">' + esc(T.call) + '</button></span>'; }).join('') + '</div>' +
    (first ? '<small class="ehint">' + esc(T.hint) + '</small>' : '');
  el.classList.remove('done'); el.classList.add('on');
  Array.prototype.forEach.call(el.querySelectorAll('[data-cov]'), function (b) { b.addEventListener('click', function () { DS.Audio.unlock(); erCover(b.getAttribute('data-cov')); }); });
  Array.prototype.forEach.call(el.querySelectorAll('[data-call]'), function (b) { b.addEventListener('click', function () { DS.Audio.unlock(); erCall(b.getAttribute('data-call')); }); });
  erBandTick();
}
function erCover(id) {
  var sim = G.sim, u = sim && sim.byId[id]; if (!u || !u.erM || !sim._er) return;
  var gs = sim.erGuard(u).filter(function (c) { return !c.dead && !(c.order && c.order.t === 'call'); }).sort(function (a, b) { return (Math.abs(a.x - u.x) + Math.abs(a.y - u.y)) - (Math.abs(b.x - u.x) + Math.abs(b.y - u.y)); });
  if (!gs.length) { A('cancel'); toast(DS.ERASE_TXT.noGuard, 1600); return; }
  sim.setOrder(gs[0].id, { t: 'move', x: u.x, y: u.y }); G.er.how[id] = 'cover:' + gs[0].id; A('ok');
  G.view.float(gs[0].x, gs[0].y, erFill(DS.ERASE_TXT.go, { a: erNm(u) }), '#f6cf57', { dy: -16, life: 1.4 });
}
function erCall(id) {
  var sim = G.sim, u = sim && sim.byId[id], h = sim && sim.erHero(), K = sim && sim._er; if (!u || !u.erM || !K) return;
  if (K.er.called || !h || h.dead || h.erM) { A('cancel'); toast(DS.ERASE_TXT.callUsed, 1600); return; }
  sim.setOrder(h.id, { t: 'call', tid: id }); G.er.callT = id; A('ok');
}
function erBandTick() {
  var E = G.er, el = $('#erase'), sim = G.sim; if (!E || !el || !sim) return;
  var K = sim._er, O = K && K.er.on, f = O ? Math.max(0, O.t / O.dur) : 0, bar = $('.ebar u', el); if (bar) bar.style.width = (f * 100).toFixed(1) + '%';
  if (!O) return;
  var h = sim.erHero(), callable = !K.er.called && h && !h.dead && !h.erM;
  Array.prototype.forEach.call(el.querySelectorAll('.echip'), function (c) {
    var id = c.getAttribute('data-er'), u = sim.byId[id], live = u && !u.dead && u.erM, cb = $('.ecall', c), vb = $('.ecov', c);
    c.classList.toggle('saved', !!E.saved[id]); c.classList.toggle('gone', !u || (u.dead && !E.saved[id]));
    if (vb) vb.disabled = !live || !sim.erGuard(u).length;
    if (cb) { cb.disabled = !live || !callable || (E.callT && E.callT !== id); var pend = E.callT === id && live && callable; cb.classList.toggle('pend', !!pend); cb.textContent = pend ? DS.ERASE_TXT.calling + ' ' + Math.floor(h.gauge) + '/' + DS.ERASE.call : DS.ERASE_TXT.call; }
  });
}
function erSaved(e) {
  var sim = G.sim, u = sim.byId[e.id], by = e.by && sim.byId[e.by], T = DS.ERASE_TXT; if (!G.er) return;
  G.er.saved[e.id] = e.how; G.erSavedN++;
  if (G.view.erSaved) G.view.erSaved(e.id);
  if (u) G.view.float(u.x, u.y, T.saved[e.how] || T.saved.heal, '#f6cf57', { dy: -26, life: 1.8 });
  if (by && e.how === 'call') G.view.float(by.x, by.y, '「' + erNm(u) + '」', '#fff3c4', { dy: -20, life: 2.2, big: true });
  A(e.how === 'heal' ? 'heal' : 'star'); erBandTick();
}
function erEnd(e) {
  var sim = G.sim, T = DS.ERASE_TXT, el = $('#erase'), E = G.er; if (!E) return;
  var names = e.dead.map(function (id) { return E.names[id]; }).filter(Boolean);
  G.erased = (G.erased || []).concat(names);
  if (G.view.erOff) G.view.erOff();
  if (el) { var b = $('.et', el); if (b) b.textContent = names.length ? erFill(T.gone, { list: names.join(', ') }) : T.none; el.classList.add('done'); Array.prototype.forEach.call(el.querySelectorAll('button'), function (x) { x.disabled = true; }); setTimeout(function () { if (G.er === E || !G.er) { erBandOff(); } }, 2600); }
  e.dead.forEach(function (id, i) {      // 남은 사람이 짧게 그 이름을 외친다 (같은 가문 먼저)
    var dv = G.view.vu[id], du = dv && dv.u, own = du && (du.role === 'merc' ? du.owner : du.id);
    var near = sim.units.filter(function (x) { return !x.dead && x.side === 'ally' && (x.role === 'merc' || x.role === 'cmd') && x.id !== id && x.ch !== G.save.hero; }).sort(function (a, b) { return ((a.owner === own || a.id === own) ? 0 : 1) - ((b.owner === own || b.id === own) ? 0 : 1); })[0];
    if (near) G.view.float(near.x, near.y, erFill(T.shout[(i + e.k) % T.shout.length], { a: E.names[id] }), '#efe6d0', { dy: -16, life: 2.4, delay: 0.9 + i * 0.5 });
  });
  if (!sim.result) setTimeout(function () { if (G.sim === sim && !sim.result && !sim._er) DS.Audio.bgm('boss'); }, 2200);
  G.er = null;
}
// r16 fx: 우리 편 사람이 영영 쓰러지는 순간의 장면 (view.deathScene) — 나이·성격·깃발을 실어 보낸다. 그린 시간(ms), 안 그리면 0
// r32: 마지막 한마디를 고르고 남긴다 — 부대원 줄이면 rec.lw (추모 기록·가계 기록이 옮긴다), 대장이면 가계의 사람 줄 P.lw. 장면이 없어도(Node·연출 끔) 남긴다
function dieAge(u, rec) { var age = ''; try { var dr = DS.unitDress ? DS.unitDress(u) : null; age = dr && dr.g || ''; } catch (x) { age = ''; } if (!age && rec && rec.eld) age = 'elder'; return age; }
function keepLW(u, rec) {
  if (rec && rec.lw) return rec.lw;
  var lw = ''; try { var ck = rec && rec.cast; lw = ck && DS.CAST_LAST && DS.CAST_LAST[ck] || ''; } catch (x) { lw = ''; }      // r24: 아홉(그 집을 이은 이도)의 마지막 한마디
  if (!lw) { try { lw = lastWords(u, rec, dieAge(u, rec)); } catch (x) { lw = ''; } }      // r30: 그 밖의 모두 — 성격·가족·가문에 맞춘 한마디
  lw = Array.from(String(lw || '')).slice(0, 24).join('');
  try {
    var sv = G.save, ch = u.role === 'cmd' ? sv.chars[u.ch] : null;
    if (ch && ch.id === sv.hero) { var P = sv.lin && sv.lin.P, p = P && ch.pid ? P[ch.pid] : null; if (p && lw) p.lw = lw; }
    else if (rec && rec.type && lw) rec.lw = lw;
  } catch (x) {}
  return lw;
}
function deathFx(u, e, rec, flag, name) {
  var lw = keepLW(u, rec);
  if (!G.view || !G.view.deathScene) return 0;
  var age = dieAge(u, rec), light = false;
  try { var pk = rec && DS.mercPersona ? DS.mercPersona(rec).key : ''; light = pk === 'chatty' || pk === 'brag'; } catch (x) { light = false; }
  if (e && e.erase && G.view.erSuck) G.view.erSuck(u.id, name || u.mn || u.name);      // r17 boss: 지워진 이름이 왕 쪽으로 빨려 든다
  return G.view.deathScene(u.id, { by: e.by, name: name || u.name, flag: !!flag && u.role === 'cmd', flagCol: u.flagCol, age: age, light: light, last: lw, force: e && e.erase ? 'dusk' : undefined });
}
// r30: 마지막 한마디 고르기 — 산 아이가 있으면 아이, 산 배우자가 있으면 배우자, 가문을 잇는 사람(가주·대장)은 가문, 아니면 성격(대장은 lead · 노년 elder · 어린 몸 young).
//   18자를 넘으면 이름 없는 줄. 같은 사람은 같은 싸움에서 같은 줄 (해시)
function lastWords(u, rec, age) {
  var sv = G.save, W = DS.LAST_WORDS || {}, ch = u.role === 'cmd' ? sv.chars[u.ch] : null, hero = !!(ch && ch.id === sv.hero), P = sv.lin && sv.lin.P, p = null, seed = 0, i;
  if (hero) p = P && ch.pid ? P[ch.pid] : null; else if (rec && rec.pid && P) p = P[rec.pid];
  var nm = String((rec && (rec.n || rec.id)) || (ch && ch.id) || u.id); for (i = 0; i < nm.length; i++) seed = (seed * 31 + nm.charCodeAt(i)) >>> 0;
  seed = (seed + ((G.sim && G.sim.seed) || 0) + (G.fightN || 0) * 7) >>> 0;
  var pick = function (a) { return a && a.length ? a[seed % a.length] : ''; };
  var short = function (n) { n = String(n || ''); return n && Array.from(n).length <= 4 ? n : ''; };
  var fill = function (t, o) { return t.replace(/\{(\w+)\}\{(을를|이가|은는)\}/g, function (m0, k) { return josa(o[k] || '', m0.slice(k.length + 3, -1)); }).replace(/\{(\w+)\}/g, function (m0, k) { return o[k] || ''; }); };
  var ok = function (t) { return t && Array.from(t).length <= 18 ? t : ''; };
  var cand = [];
  if (age === 'child') return pick(W.young);
  if (p) {
    var live = function (q) { return q && (q.st === 'live' || q.st === 'young'); };
    var kids = DS.linKids ? DS.linKids(sv, p.id).filter(live) : [], sp = p.sp && P[p.sp] && live(P[p.sp]) ? P[p.sp] : null;
    if (kids.length) { var kn = short(kids[seed % kids.length].n); cand.push(kn && seed % 3 ? ok(fill(pick(W.kidN), { k: kn })) : '', pick(W.kid)); }
    else if (sp) { var sn = short(sp.n); cand.push(sn && seed % 3 ? ok(fill(pick(W.spN), { sp: sn })) : '', pick(W.sp)); }
  }
  var house = hero ? sv.lin && sv.lin.sur : (u.role === 'cmd' && rec && rec.sn) || '';
  if (house && !cand.length && seed % 2 === 0) cand.push(ok(fill(pick(W.house), { h: house })));
  if (age === 'elder') cand.push(pick(W.elder));
  if (hero) cand.push(pick(W.lead));
  else { try { var per = rec && DS.mercPersona ? DS.mercPersona(rec) : null; if (per && per.say && per.say.last) cand.push(pick(per.say.last)); } catch (x) {} }
  cand.push(pick(W.lead));
  for (i = 0; i < cand.length; i++) if (cand[i]) return cand[i];
  return '';
}
DS.lastWords = lastWords;
// 4.0: 깃발을 든 사람이 쓰러졌다 — 그 자리에서 확정 (명부에서 빠짐 → 추모 기록(들던 깃발 f) → 가계 기록 → 가족의 비탄 · 아홉이면 그 집의 다음 사람). 잃은 사람을 돌려준다
function bearerFell(u, bm, quiet) {
  var sv = G.save, lnk = ''; if (DS.mercTitle) { try { lnk = DS.mercTitle(bm) || ''; } catch (x) { lnk = ''; } }
  if (bm.it && DS.giveMercItem) { try { DS.giveMercItem(sv, bm.id, null); } catch (x) {} }      // 든 물건은 가방으로 돌아온다
  var lost = DS.loseMerc(sv, bm.id); if (!lost) return null;
  G.lost.push(lost); G.mdT = 0; G.bearLost = (G.bearLost || []).concat([lost]);
  var fat = G.scn ? G.scn.name : G.zone.name, frec = DS.fallenRecord ? DS.fallenRecord(lost, fat) : { n: lost.n, type: lost.type, g: lost.g, x: lost.x || 0, at: fat, f: lost.o };
  if (lnk && !frec.nk) frec.nk = lnk;
  sv.fallen = DS.fallenTrim((sv.fallen || []).concat([frec]));
  if (!(quiet && DS.deathFxOn && DS.deathFxOn() && G.view.onScreen(u.x, u.y))) G.view.float(u.x, u.y, (lost.ttl || lost.n || '') + ' 전사', '#ff8a9a', { dy: -20, life: 2, delay: 0.15 });
  mourn(lost);
  if (DS.linMercDied) { try { var le = DS.linMercDied(sv, lost, fat); G.lineageQ = (G.lineageQ || []).concat(le);  } catch (x) { if (DS.DEBUG) throw x; } }
  return lost;
}
// 전사한 용병을 기린다: 전장 위쪽 가장자리에 이름과 발자취 (한가운데를 가리면 예고 칸이 안 보인다)
function mourn(m) {
  var el = $('#mourn'); if (!el) return;
  var title = ''; if (DS.mercTitle) { try { title = DS.mercTitle(m) || ''; } catch (x) { title = ''; } }
  el.innerHTML = '<i>전사</i><b style="color:' + DS.GRADES[m.g].col + '">' + (title ? '<em>' + esc(title) + '</em> ' : '') + esc(m.n || '') + '</b><span>' + esc(DS.mercKind(m)) + ', ' + DS.VET[DS.vetRank(m.x)].name + ', 전투 ' + (m.b || 0) + '회, 처치 ' + (m.k || 0) + '</span>';
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  A('mourn');
  if (!(DS.Audio.has && DS.Audio.has('mourn'))) { A('dark'); setTimeout(function () { A('lose'); }, 200); }      // 전용 소리가 아직 없으면 예전 소리로
}
// r41 temper: 계급이 오르기 전후의 전투력과 가주 얹힘 (가주는 깃발 유닛, 가솔은 따르는 자리)
function tmPow(sv, u, m) { var ch = u.role === 'cmd' ? sv.chars[u.ch] : m.o && sv.chars[m.o], flag = u.role === 'cmd'; var p = 0; try { p = !ch ? 0 : flag ? DS.flagPower(sv, ch, ch.id === sv.hero ? ch.ps : m) : DS.power(DS.mercSpec(ch, m)); } catch (x) { p = 0; } return { p: p, flag: flag, b: DS.bnMerit ? DS.bnMerit(m) : 0 }; }
// 살아남아 싸운 용병에게 공훈을 준다. 계급이 오른 용병의 목록을 돌려준다.
function meritAll(pts) {
  var sim = G.sim, sv = G.save, ups = [];
  sim.units.forEach(function (u) {
    if (u.dead || u.side !== 'ally') return;
    var m = u.role === 'merc' && u.mid ? mercOf(u.mid) : u.role === 'cmd' && DS.bearer ? DS.bearer(sv, sv.chars[u.ch]) : null; if (!m) return;      // 4.0: 깃발을 든 사람도 같은 길로 공훈을 받는다
    if (u.surv && !u.svDone) { u.svDone = true; m.sv = (m.sv || 0) + 1; }      // 구사일생으로 버티고 살아 돌아왔다
    var hh = DS.whoHouse(sv, m), r0 = DS.hRank(hh); DS.meritAdd(m, pts * (u.role === 'cmd' ? (DS.BN.meritK || 1) : 1), sv); m.b = (m.b || 0) + 1;      // r42: 공은 가문의 공훈으로 · 2.2.0: 가주는 가솔 몫까지 (BN.meritK)
    if (hh && DS.hRank(hh) > r0 && ups.every(function (x) { return x.ch !== hh; })) {
      var cu = sim.byId['c' + hh.id], r1 = DS.hRank(hh); ups.push({ ch: hh, from: r0, to: r1 });
      if (cu && !(G.view.cere && G.view.cere(cu.id, 'rank', { txt: DS.hName(r1) }))) G.view.float(cu.x, cu.y, DS.hName(r1) + '!', '#f6cf57', { dy: -10, life: 1.6 });
      mercTalk(u, 'rank', false, 0.9);
    }
  });
  if (pts >= 10 && G.scn && DS.BN) DS.charList(sv).forEach(function (c) {      // 싸우지 않은 가문(빈 가문)은 승리 때 +2 (가문 공훈)
    if (sv.party.indexOf(c.id) >= 0) return;
    var r0 = DS.hRank(c); DS.hAdd(sv, c, DS.BN.bench); if (DS.hRank(c) > r0) ups.push({ ch: c, from: r0, to: DS.hRank(c) });
  });
  if (ups.length) { refreshUnits(); try { renderActs(); } catch (x) {} A('level'); later(ups.map(function (x) { return DS.flagName(x.ch.cls) + ' 공훈 ' + DS.hName(x.to) + ' (가주 +' + DS.HVET[x.to].pct + '%)'; }).join(' · '), 4200); }
  DS.hUps = [];
  return ups;
}
// 전투가 끝나면: 막사의 같은 병과가 빈 가문을 잇고(DS.sbTick), 가주가 선 가문의 깃발 유닛과 흩어졌던 가문원이 이끄는 이 곁으로 돌아온다 (쓰러진 이는 돌아오지 않는다)
function refillMercs() {
  var sim = G.sim, s = G.save, seat = DS.sbTick && !G.scn ? DS.sbTick(s) : [];
  if (DS.mercTidy) DS.mercTidy(s);
  bnNote(seat);
  var swap = sortieNote();
  sim.cmds().forEach(function (c) { if (!c.dead && c.ch !== s.hero && s.party.indexOf(c.ch) < 0) { sim.remove(c); delete G.view.vu[c.id]; swap = true; } });      // 2.2.8: 출전에서 빠진 가문은 물러난다
  if (swap && !sim.byId[G.sel] && sim.cmds()[0]) { G.sel = sim.cmds()[0].id; sim.leader = G.sel; }
  var lead = sim.byId[G.sel] || sim.cmds()[0];
  if (lead) s.party.forEach(function (id) {
    var ch = s.chars[id], u = sim.byId['c' + id]; if (!ch || (u && !u.dead) || ch.down || ch.vac) return;
    var who = DS.bearer ? DS.bearer(s, ch) : null; if (!who) return;
    if (u) { sim.remove(u); delete G.view.vu[u.id]; }
    var sp = DS.cmdSpec(ch, id === s.hero, who); sp.x = lead.x; sp.y = lead.y; sp.auto = !ch.manual;
    var nu = sim.add(sp); if (nu) { var vt = vitOf(s, ch); nu.hp = Math.max(1, Math.round(nu.mhp * (vt && vt.hp != null ? vt.hp : 1))); nu.mp = Math.round(nu.mmp * (ch.mp == null ? 1 : ch.mp)); nu.mn = nu.name || ''; setStance(nu, ch.st); G.view.vu[nu.id] = G.view.mkVu(nu, false); }
  });
  sim.cmds().forEach(function (c) {
    var ch = s.chars[c.ch]; if (!ch) return;
    DS.mercsOf(s, ch.id).forEach(function (m) {
      var id = 'm' + m.id, u = sim.byId[id];
      if (u && !u.dead) return;
      if (u) { sim.remove(u); delete G.view.vu[id]; }
      var sp = DS.mercSpec(ch, m); sp.x = c.x; sp.y = c.y;
      var nu = sim.add(sp); if (nu) { nu.hp = Math.max(1, Math.round(nu.mhp * (m.hp == null ? 1 : m.hp))); nu.mn = m.n || ''; G.view.vu[nu.id] = G.view.mkVu(nu, false); }
    });
  });
  sim.ev = sim.ev.filter(function (e) { return e.t !== 'spawn'; });
  if (seat.length || swap) renderChips();
}
// 2.2.0: 막사의 사람이 빈 가문을 이었다 — 「센주 가문의 가주를 막사의 난새가 잇는다」. 같은 병과가 없으면 그 가문은 빈 채로 (부대 탭에 「빈 가문」)
function bnNote(list) {
  (list || []).forEach(function (e) {
    if (e && e.text) later(e.text, 4200);      // 기록 · 알림 글은 그대로
    var ch = e && e.t === 'sbSeat' && G.save && G.save.chars[e.ch], m = ch && DS.bearer ? DS.bearer(G.save, ch) : null;
    if (m && DS.cine) DS.cine({ k: 'succ', por: [charSpr(ch, 4)], fc: DS.FLAG[ch.cls] || '', title: (m.n || '') + ', ' + DS.flagName(ch.cls) + ' 가주', sub: '막사에서 나와 가문을 이었다. 인수인계는 단톡방에서 한다' });      // 2.2.4: 가주를 잇는 순간 (한가할 때)
  });
}
DS.bnNote = bnNote;
function checkExit() {
  if (G.scn || G.ending || G.hold) return;
  var sim = G.sim, me = sim.byId[G.sel]; if (!me || pressed()) return;      // 적을 따돌렸으면 싸움이 남아 있어도 빠져나간다
  var ps = G.zone.pois;
  for (var i = 0; i < ps.length; i++) {
    var p = ps[i]; if (p.t !== 'exit') continue;
    for (var k = 0; k < p.tiles.length; k++) if (p.tiles[k][0] === me.x && p.tiles[k][1] === me.y) {
      if (dangerGate(p.to)) { order(me, { t: 'move', x: p.inx, y: p.iny }); return; }      // 4.0.6: 막지 않고 한 번 경고
      var cont = G.guideExit && G.guideExit.zone === G.zone.id && G.guideExit.to === p.to; G.guideExit = null;
      A('swoosh'); enterZone(p.to, G.zone.id);      // r26: 지역을 넘는 바람 소리
      if (cont) setTimeout(function () { var q = $('#quest'); if (q && q._guide && !q._retreat && !G.hold && !G.scn && !G.ending && !G.goal && G.zone.id === p.to) questGo('cont'); }, 900);
      return;
    }
  }
}
// r30: 프레임 안의 오류는 적어 두고 넘어간다 — 전에는 한 번의 예외가 requestAnimationFrame 사슬을 끊어 화면째 굳었다 (「한 번씩 멈춤」의 한 갈래)
function loopErr(x, where) {
  var n = (G.errN = (G.errN || 0) + 1), m = (x && x.message) || String(x);
  (G.errs = G.errs || []).push({ at: Math.round(performance.now()), w: where, m: m }); if (G.errs.length > 20) G.errs.shift();
  if (n <= 5 || n % 200 === 0) { try { console.error('[loop:' + where + '] ' + m + (x && x.stack ? '\n' + String(x.stack).split('\n').slice(1, 4).join('\n') : '')); } catch (y) {} }
  if (DS.DEBUG) throw x;
}
DS.loopErr = loopErr;
function loop(now) {
  if (!G.running) return;
  if (!G.save) { G.running = false; return; }      // 저장을 지운 뒤에는 멈춘다
  try { loop1(now); } catch (x) { loopErr(x, 'loop'); }
  if (G.running) requestAnimationFrame(loop);
}
function loop1(now) {
  var raw = Math.max(0, (now - G.last) / 1000 || 0), dt = Math.min(0.1, raw); G.last = now;      // r38: 0.05 → 0.1 — 프레임이 20 아래로 떨어지면(중저가 폰의 시나리오·갱도 난전) 게임 시간이 실제보다 느리게 흘러 배속이 덜 먹었다. 0.1 을 넘는 끊김(창 전환 등)만 버린다
  var sim = G.sim, evs = [];
  if (!G.pause && !document.hidden) G.save.time = (G.save.time || 0) + Math.min(1, raw);      // 플레이 시간(초): 멈춤과 가려진 화면은 세지 않는다 (가게·부대 창을 보는 시간은 센다)
  if (G.softUntil && (now >= G.softUntil || !G.pause)) softResume();      // r8 hud: 첫 회 안내의 잠깐 멈춤은 저절로 풀린다
  if (G.hold > 0) { G.banAt = G.campAt = G.laterAt = now + 350; }      // 창이 닫히고 한 박자 뒤에
  else {
    if (G.pendBan && now >= G.banAt) { banner(G.pendBan[0], G.pendBan[1], G.pendBan[2]); G.banEnd = now + (G.pendBan[2] || 2400) - 300; G.pendBan = null; if (G.beatArm && G.scn) { G.beatArm = false; G.beatAt = now; G.beatT = now + BEAT_MS - 120; A('slam'); } }      // 2.6: 시나리오 띠가 뜬 순간이 첫 박자의 0초
    if (G.beatArm && !G.pendBan) G.beatArm = false;
    if (G.laterQ.length && now >= (G.laterAt || 0)) { var lq = G.laterQ.shift(); toast(lq[0], lq[1]); G.laterAt = now + (lq[1] || 2200) + 300; }
    if (G.pendCamp && !G.quiet && now >= G.campAt && sim && !sim.combat && !G.scn && !G.ending && G.zone.town) {      // 막간 이야기 (자동 테스트는 DS.G.quiet = true 로 끌 수 있다)
      var camp = G.pendCamp; G.pendCamp = null; G.save.seen['camp_' + camp.id] = 1; persist();
      story(camp.lines, null, camp.title || '모닥불 곁에서');
    }
    if (DS.ultNeedReveal) {      // r38: 깨어남 창은 그 순간에만 — 불러온 저장이 기다리던 것 · 시나리오 3을 깬 뒤(onWin) · 새 맹주가 섰을 때 (G.ulwArm)
      var uhc = G.save.chars[G.save.hero], ukey = G.save.hero + ':' + (uhc && uhc.pid || 0) + ':' + (uhc && uhc.vac ? 'v' : '');
      if (G.ulwSave !== G.save) { G.ulwSave = G.save; G.ulwKey = ukey; }      // 저장이 바뀌면 열쇠만 다시 (불러온 저장의 기다리던 깨어남은 DS.startGame 이 건다)
      else if (ukey !== G.ulwKey) { G.ulwKey = ukey; G.ulwArm = true; }
      else if (!G.ulwArm && now - (G.ulwChk || 0) > 2000) { G.ulwChk = now; try { var uh = G.save.chars[G.save.hero]; if (uh && !uh.down && !uh.vac && DS.ultNeedReveal(G.save)) G.ulwArm = true; } catch (x) {} }      // 2.1.0: 맹주가 개인 5단에 오르면 깨어남 창
    }
    if (G.ulwArm && DS.ultNeedReveal && now >= (G.ulwAt || 0) && now >= G.campAt + 600 && !G.pendBan && now >= (G.banEnd || 0) && !G.promos.length && sim && !sim.combat && !(sim.fld && (sim.fld.boss || sim.fld.amb)) && !G.scn && !G.ending && !$('.ov', root())) { G.ulwAt = now + 1500; var uhd = G.save.chars[G.save.hero]; if (uhd && (uhd.down || uhd.vac)) G.ulwArm = false; else if (DS.ultNeedReveal(G.save) && DS.ultRevealOpen) DS.ultRevealOpen();      // 2.1.0: 쓰러진 맹주에게는 띄우지 않는다
    else if (DS.ultOpen(G.save)) G.ulwArm = false; }      // r38: 타고난 필살기가 깨어났다 (한 번 — 시나리오 3 뒤, 대를 이은 맹주마다)
    if (DS.sbTick && G.save && now - (G.succT || 0) > 900 && sim && !sim.combat && !G.scn && !G.ending && !(DS.egPassOn && DS.egPassOn(G.save)) && !(G.riteBusy && $('.ov', root())) && !(DS.linVacant && DS.linVacant(G.save).length)) { G.succT = now; var sq = []; try { sq = DS.sbTick(G.save); } catch (x) { loopErr(x, 'succ'); } if (sq.length) { sq.forEach(function (e) { if (e.text) later(e.text, 4600); }); try { rebuildParty(); } catch (x) { loopErr(x, 'succ2'); } persist(); } }      // 2.2.0: 가주가 떠난 가문은 싸움·시나리오 밖이면 언제든 막사의 같은 병과가 잇는다 (없으면 빈 채로)
    if (G.promos.length && G.hold === 0 && !G.pendBan && now >= (G.banEnd || 0) && now >= G.campAt + 400 && !G.pendCamp && sim && !sim.combat && !G.scn && !G.ending && G.zone && (G.zone.town || !sim.hunt) && !$('.ov', root())) flushPromos();      // 자동 사냥 중 미뤄 둔 승급 창은 마을에서 · 3차 ui: 필드에서도 자동 사냥이 꺼져 있으면 (결과 창 닫을 때 다른 창이 떠 있어 못 띄운 승급 창이 다음 싸움까지 밀리던 것)
  }
  if (sim) {
    var slw = G.view && G.view.slowMul ? G.view.slowMul() : 1;      // r16 fx: 죽음 연출 동안 잠깐 느리게 (실제 시간으로 짧게)
    var spdM = sim._er ? (slw < 1 ? 1 : DS.ERASE.slow) : DS.spdOf(G.save.opt.speed);      // r36: 1 · 1.5 · 2 · r30: 죽음 슬로우와 지우기 슬로우는 겹치지 않는다 (더 느린 하나만)      // r17 boss: 이름 지우기 예고 동안은 배속과 상관없이 실제 시간보다 조금 느리게
    if (DS.Joy) { try { DS.Joy.tick(); } catch (x) { loopErr(x, 'joy'); } }      // r40: 조이스틱이 쥔 걸음을 한 칸 앞씩 고친다
    if (!G.pause && G.hold === 0 && !G.ending && !(G.scn && (G.beatArm || now < (G.beatT || 0)))) { try { sim.update(dt * slw * spdM); } catch (x) { loopErr(x, 'sim'); } if (DS.ageAdvance) DS.ageAdvance(G.save, dt * slw * DS.spdOf(G.save.opt.speed)); }      // 나이: 세계 달력은 게임 속 시간(배속 포함)으로 흐른다
    else if (G.ending && sim.result) sim.acc = 0;
    evs = sim.drain();
    try { G.view.frame(dt, evs); } catch (x) { loopErr(x, 'view'); }      // 그림의 오류가 사건(승리·죽음)을 잃게 하지 않는다
    if (evs.length) onEvents(evs);
    if (DS.fieldFrame) { try { DS.fieldFrame(now, evs); } catch (x) { loopErr(x, 'field'); } }      // r47: 기습·필드 보스 연출 (field.js)
    try { if (G.er) erBandTick(); if (now - G.hudT > 90) { G.hudT = now; updateHud(now); } if (now - (G.barT || 0) > 1500 && DS.barBadge) { G.barT = now; DS.barBadge(); } } catch (x) { loopErr(x, 'hud'); }      // r38: 메뉴 단추의 막사 배지
    checkExit();
    if (G.mournOn) mournTick(now);
    if (!!G.riteBusy !== !!G.riteWas) { if (G.riteWas && !G.saveFailAt) savedTick(); G.riteWas = !!G.riteBusy; }      // 2.6: 의식이 끝나면 (그 끝에 저장한다 — lineageFlush) 「저장됨」
  }
}
// 게임 화면 켜기
DS.startGame = function () {
  setTimeout(function () { if (DS.wakeSync) DS.wakeSync(); }, 0);      // 2.1.2: 화면 켜 두기
  G.ulwArm = !!(DS.ultNeedReveal && G.save && DS.ultNeedReveal(G.save));      // r38: 불러온 저장이 깨어남을 기다린다 (1.3.0 에서 고르지 않은 채 시나리오 3을 넘긴 저장 등)
  var sv = G.save;
  if (DS.goneGold > 0) { var gg = DS.goneGold; DS.goneGold = 0; setTimeout(function () { toast('쓰지 않게 된 물건을 ' + fmtN(gg) + '골드로 바꿨다', 4200); }, 1800); }
  show('s-game');
  if (!G.view) {
    G.view = new DS.View($('#cv'));
    bindInput($('#cv'));
    window.addEventListener('resize', function () { if (G.view) { G.view.resize(); layoutInsets(); } });
    if (window.ResizeObserver) { var ro = new ResizeObserver(function () { layoutInsets(); }); ro.observe($('#top')); ro.observe($('#bot')); }      // r18 hud: 목표 줄이 두 줄이 되거나 안내 칩이 붙어 띠 높이가 바뀌면 카메라 여백도 바로 맞춘다
    $('#quest').addEventListener('click', questGo);
    (function () { var q = $('#quest'), lp = null; q.addEventListener('pointerdown', function () { clearTimeout(lp); lp = setTimeout(function () { if (q._qt) toast(q._qt, 3600); }, 520); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { q.addEventListener(ev, function () { clearTimeout(lp); }); }); })();      // r26: 길게 누르면 목표 전문
    $('#bMenu').addEventListener('click', function () { A('tap'); DS.openMenu('party'); });
    $('#bMap').addEventListener('click', function () { A('tap'); DS.openMenu('map'); });
    $('#bPause').addEventListener('click', function () { if (G.sim && G.sim._er && !G.pause) { A('cancel'); toast(DS.ERASE_TXT.noPause, 1800); return; } G.softUntil = 0; G.pause = !G.pause; A('tap'); renderSys(); if (G.pause) toast('멈춤. 멈춘 채로 명령을 내린다'); });
    $('#bSpeed').addEventListener('click', function () { sv = G.save; var SP = DS.SPEEDS, si = SP.indexOf(DS.spdOf(sv.opt.speed)); sv.opt.speed = SP[(si + 1) % SP.length]; A('tap'); renderSys(); });      // r36: 1 → 1.5 → 2 → 1
    $('#bAutoU').addEventListener('click', function () {
      var me = G.sim.byId[G.sel]; if (!me) return;
      me.auto = !me.auto; G.save.chars[me.ch].manual = !me.auto; A('tap'); renderSys();      // r27 ux: 뜻은 판의 단추 아래 한 줄에 (토스트 없음)
    });
    $('#bHunt').addEventListener('click', function () {
      G.sim.hunt = !G.sim.hunt; G.save.opt.hunt = G.sim.hunt; A('tap'); renderSys(); if (!G.sim.hunt && !G.sim.combat) setTimeout(flushPromos, 300);      // 미뤄 둔 승급 창
      if (G.sim.hunt) G.sim.cmds().forEach(function (c) { c.auto = true; G.save.chars[c.ch].manual = false; });
      toast(G.sim.hunt ? (G.scn ? '전체 자동 켜짐. 모든 가문이 알아서 나아간다' : '전체 자동 켜짐. 모든 가문이 알아서 적을 찾아 싸운다') : '전체 자동 꺼짐');
    });
    // 판에 없는 HUD 칸은 여기서 덧붙인다: 버프·상태 칩, 보스 시전 막대와 한마디, 용병 태세 버튼
    $('#info').insertBefore(h('<span id="infoFx"></span>'), $('#info .tick'));
    $('#boss').insertBefore(h('<i class="bct"></i>'), $('#boss .bbar')); $('#boss').appendChild(h('<i class="cbar"><u></u></i>')); $('#boss').appendChild(h('<p id="bsay"></p>'));
    var bs = h('<button id="bStance" class="sy"><span class="lb">가문원</span><b>돌격</b><small>먼저 달려든다</small></button>');
    $('#selSeg').appendChild(bs);
    hudIcons(); pressFx(); histInit();      // r26
    // r27 ux: 「조작」「태세」는 아래 띠에서 빼고, 고른 가문의 문장(정보 줄 왼쪽)을 누르면 뜨는 작은 판으로 — 아래 띠는 부대 전체(전체 자동·속도·멈춤) + 소모품 + 기술만
    $('#selCtx').setAttribute('role', 'button'); $('#selCtx').setAttribute('aria-haspopup', 'dialog'); $('#selCtx').setAttribute('aria-label', '고른 가문 지휘: 조작, 태세');
    $('#selCtx').insertAdjacentHTML('beforeend', '<i class="car" aria-hidden="true"></i>');
    $('#selCtx').addEventListener('click', function () { var me = G.sim && G.sim.byId[G.sel]; if (!me) return; A('tap'); selPop(!selPopOn()); });
    $('#spX').addEventListener('click', function () { A('close'); selPop(false); });
    document.addEventListener('pointerdown', function (e) { if (!selPopOn()) return; var t = e.target; if (t.closest && (t.closest('#selPop') || t.closest('#selCtx') || t.closest('#chips'))) return; selPop(false); }, true);
    $('#infoFx').addEventListener('click', function () { var me = G.sim && G.sim.byId[G.sel]; if (!me) return; var fx = fxList(me); if (fx.length) toast(fx.map(function (f) { return f[1] + ' ' + f[2] + '초'; }).join(', '), 3000); });
    bs.addEventListener('click', function () {
      var me = G.sim.byId[G.sel], ch = me && G.save.chars[me.ch]; if (!ch) return;
      if (ch.st === 'side') delete ch.st; else ch.st = 'side';
      setStance(me, ch.st); A('tap'); renderSys(); persist();
      G.save.seen.stance = 1;      // r27 ux: 대가는 판의 단추 아래 한 줄이 늘 말한다 (코치 표시는 뺐다)
    });
    setInterval(persist, 15000);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { persist(); DS.Audio.pause(); } else { DS.Audio.resume(); G.last = performance.now(); } });
  }
  applyCalm(); G.goldShown = null;
  layoutInsets();
  G.view.mtag = (sv.opt && sv.opt.mtag) || 'sel';      // 용병 이름표 (그래픽팀이 읽는다): 'sel' 고른 지휘관의 용병만 · 'all' · 'off'
  var vac = DS.linVacant && DS.openLineageRite && !(DS.egPassOn && DS.egPassOn(sv)) ? DS.linVacant(sv).length : 0;      // 3.3.0: 스무 해 창의 빈자리는 그 창이 (enterZone 이 창을 다시 연다)      // 3.3 (tech 2): 싸움 중에 꺼진 판 — 읽을 때 죽음만 확정되고(DS.linFix) 자리는 비어 있다. 말없이 후계를 정하지 않고 교회에서 의식을 띄운다
  if (vac) { G.riteBusy = true; sv.zone = sv.town || sv.zone; sv.pos = churchPos(sv.zone); }      // riteBusy: placeParty 의 안전망이 먼저 채우지 않게 (의식이 끝나면 내린다)
  enterZone(sv.zone || 'caosia', null, sv.pos);
  if (vac) resumeRite();
  if (!G.running) { G.running = true; G.last = performance.now(); requestAnimationFrame(loop); }
};
// r26 art: 위·아래 단추에 아이콘 (판의 글자는 그대로 두고 앞에 끼운다 — 단추 id·글자를 읽는 코드가 그대로)
function hudIcons() {
  if (!DS.icon) return;
  var put = function (sel, html) { var b = $(sel); if (b && !$(':scope > .ic2', b)) b.insertAdjacentHTML('afterbegin', '<i class="ic2" aria-hidden="true">' + html + '</i>'); };
  var bm = $('#bMenu'); if (bm && bm.firstChild && bm.firstChild.nodeType === 3) bm.firstChild.textContent = '';      // 「☰」 글자 → 아이콘
  put('#bMenu', icon('menu', 22)); put('#bMap', icon('map', 22));
  var bmp = $('#bMap'); if (bmp && !$(':scope > span', bmp)) { var tx = ''; [].slice.call(bmp.childNodes).forEach(function (n) { if (n.nodeType === 3) { tx += n.textContent; n.textContent = ''; } }); bmp.insertAdjacentHTML('beforeend', '<span>' + esc(tx.trim() || '지도') + '</span>'); }
  put('#bAutoU', icon('manual', 20, 'i-off') + icon('auto', 20, 'i-on'));
  put('#bStance', icon('atk', 20, 'i-off') + icon('def', 20, 'i-on'));
  put('#bHunt', icon('hunt', 20));
  put('#bSpeed', icon('spd1', 20, 'i-1') + icon('spd2', 20, 'i-2') + icon('spd3', 20, 'i-3'));
  put('#bPause', icon('pause', 20, 'i-off') + icon('play', 20, 'i-on'));
  var cn = $('.tbar .cur .coin'); if (cn) cn.outerHTML = icon('coin', 18, 'coin');
  var tk = $('#info .tick > i'); if (tk) { tk.innerHTML = icon('tick', 13); tk.setAttribute('aria-label', '틱'); }
}
// r26 juice: 누르면 줄었다가(.jp) 떼면 튀어 오른다(.jr) — 앱 전체에 하나의 위임 손잡이
function pressFx() {
  var JP = '.btn,.act,.sy,.tb,.chip,.mtabs button,.fcard,.pcard,.slot,.hgc,#quest,.mz,.row.grow,.hch,.pfold';
  document.addEventListener('pointerdown', function (e) { var b = e.target.closest && e.target.closest(JP); if (!b) return; G.lastBtn = b; G.lastBtnAt = performance.now(); if (b.disabled) return; b.classList.remove('jr'); b.classList.add('jp'); }, { passive: true, capture: true });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
    document.addEventListener(t, function (e) { var b = e.target.closest && e.target.closest('.jp'); if (!b) { if (t !== 'pointerleave') $$('.jp').forEach(function (x) { x.classList.remove('jp'); }); return; } b.classList.remove('jp'); if (t === 'pointerup' && !calm()) { void b.offsetWidth; b.classList.add('jr'); } }, { passive: true, capture: true });
  });
  document.addEventListener('animationend', function (e) { var n = e.animationName, el = e.target; if (!el.classList) return; if (n === 'jRel') el.classList.remove('jr'); else if (n === 'jDeny') el.classList.remove('deny'); else if (n === 'jPing') el.classList.remove('ping'); else if (n === 'jFire') el.classList.remove('fire'); else if (n === 'jChipHit') el.classList.remove('hit'); else if (n === 'jLvTag') el.classList.remove('lvup', 'promo'); }, true);
}
// 이어하기 직후의 후계 의식: 떠 있는 창(새 소식 등)이 닫히고 싸움이 아닐 때 한 번. 그새 다른 길(안전망·싸움 뒤 의식)로 자리가 찼으면 그만둔다.
function resumeRite() {
  if (DS.linVacant(G.save).length) toast('맹주가 쓰러진 채 멈춘 게임이다. 누가 이을지 고른다', 5200);
  setTimeout(function go() {
    if (!G.save || !DS.linVacant(G.save).length) { G.riteBusy = false; return; }
    if (G.hold > 0 || G.scn || (G.sim && G.sim.combat)) { setTimeout(go, 500); return; }
    lineageFlush(function () { G.riteBusy = false; rebuildParty(); persist(); });
  }, 900);
}
function layoutInsets() {
  var top = $('#top'), bot = $('#bot'); if (!G.view) return;
  var t0 = G.view.inset.top, b0 = G.view.inset.bottom;
  G.view.inset.top = top ? top.offsetHeight : 0; G.view.inset.bottom = bot ? bot.offsetHeight : 0;
  if ((t0 !== G.view.inset.top || b0 !== G.view.inset.bottom) && G.view.sim && G.view.resize) G.view.resize();      // 2.2.2: 지도 보기의 배율은 위아래 판 사이 높이를 본다
  var sg = $('#s-game'); if (sg) { sg.style.setProperty('--top-h', G.view.inset.top + 'px'); sg.style.setProperty('--bot-h', G.view.inset.bottom + 'px'); }
}
DS.layoutInsets = layoutInsets;
})();

// 2.1.2: 화면 켜 두기 — 보고만 있어도 기기가 절전으로 화면을 끄지 않게 (Screen Wake Lock). 설정 「화면 켜 두기」(기본 켬).
//   창이 가려지면 브라우저가 풀어 버리므로, 다시 보일 때와 화면을 누를 때 다시 건다. 지원하지 않거나 거절되면 조용히 넘어간다.
(function () {
var wakeL = null, wakeBusy = false;
DS.wakeOk = function () { return !!(typeof navigator !== 'undefined' && navigator.wakeLock && navigator.wakeLock.request); };
function wakeWant() { var s = DS.G && DS.G.save; return !!(s && s.opt && s.opt.wake !== false) && document.visibilityState === 'visible'; }
DS.wakeSync = function () {
  if (!DS.wakeOk()) return;
  if (!wakeWant()) { if (wakeL) { try { wakeL.release(); } catch (x) {} wakeL = null; } return; }
  if (wakeL || wakeBusy) return;
  wakeBusy = true;
  try {
    navigator.wakeLock.request('screen').then(function (l) { wakeBusy = false; wakeL = l; l.addEventListener('release', function () { if (wakeL === l) wakeL = null; }); if (!wakeWant()) DS.wakeSync(); }, function () { wakeBusy = false; });
  } catch (x) { wakeBusy = false; }
};
DS.wakeHeld = function () { return !!wakeL; };
document.addEventListener('visibilitychange', function () { DS.wakeSync(); });
['pointerdown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, function () { if (!wakeL) DS.wakeSync(); }, { passive: true }); });
})();
