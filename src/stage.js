// 전민 戰民, 열 가문의 시대 — 2.6.0 연출 (무대)
//   ① 도입의 무대 (DS.stagePrologue): 검은 화면의 첫 두 줄 → 밤 언덕의 열 깃발(아홉이 차례로 내려간다) → 단톡방 말풍선 → 마을로 스민다. 조작 안내(전장 메모)는 이야기에서 빼 코치 표시로.
//   ② 엔딩의 무대 (DS.stageEnding): 검게 가라앉고(싸움 화면 · HUD 가 걷힌다) 해가 8초 남짓 떠오른다. 줄은 가운데 하나씩. 「1」 줄은 말풍선, 먼저 간 이름은 한 사람씩, 마지막 줄은 잠깐 머문다.
//   ③ 깃대 (DS.poleOpen): 마을 한가운데의 깃대. 대마다 새긴 이름, 이름을 누르면 그 사람의 카드, 「이름을 부른다」 (보기만 — 규칙은 없다). 20번 전에는 「낡은 깃발」.
//   ④ 교회의 의식 (DS.riteVeil): 전멸 뒤의 추도 · 후계는 싸움터가 아니라 교회에서 — 어둑한 바탕과 촛불.
//   줄을 넘기는 창은 game.js 의 story() 그대로다 (opt.stage). 조용한 시험(G.quiet) · 움직임 줄이기는 모두 바로.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var U = DS.ui; if (!U || typeof document === 'undefined') return;
var G = DS.G, esc = U.esc, $ = U.$, $$ = U.$$;
function A(n) { try { U.A(n); } catch (x) {} }
function quick() { return !!G.quiet || !!(U.calm && U.calm()); }
function sg() { return document.getElementById('s-game'); }
function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

// ───────── 줄의 갈래 (글이 아니라 꼴로 가른다): nar 지문 · hero 맹주 · chat 단톡방(선대) · memo 전장 메모 · talk 그 밖의 사람 ─────────
function heroName() { var s = G.save, h = s && s.chars && s.chars[s.hero]; try { return h ? DS.charName(h, s) : ''; } catch (x) { return ''; } }
function kindOf(l) {
  if (!l || typeof l !== 'object') return 'nar';
  var w = l.w || '';
  if (w === '전장 메모') return 'memo';
  if (l.anc || w === '선대 단톡방' || /^(선대|단톡방 ·) /.test(w)) return 'chat';
  if (w === '{hero}' || (w && (w === heroName() || (G.save && w === G.save.name)))) return 'hero';
  return w || l.c ? 'talk' : 'nar';
}
DS.stageKind = kindOf;

// ───────── 그림: 도입의 밤 언덕 (타이틀과 같은 붓 — view.js DS.sceneKit) ─────────
// 열 깃발 가운데 아홉이 하나씩 내려가고 맹주의 깃발 하나만 남는다. 돌려주는 것 { lower(n), stop() }
var LOW_ORDER = [9, 0, 8, 1, 7, 2, 6, 3, 5, 4];
function prologueArt(cv, keep) {
  var KIT = DS.sceneKit; if (!KIT || !cv.getContext) return { lower: function () {}, stop: function () {} };
  var W = 180, H = 80; cv.width = W * 2; cv.height = H * 2;
  var g = cv.getContext('2d'), t = 0, r = KIT.sr(11), stars = [], i, off = false, TEN = KIT.TEN, TT = KIT.TEN_T, K = KIT.K;
  var kp = Math.max(0, TEN.indexOf(keep)), order = LOW_ORDER.filter(function (n) { return n !== kp; }), want = {}, dn = TEN.map(function () { return 0; });
  for (i = 0; i < 34; i++) stars.push([Math.floor(r() * W), Math.floor(r() * 40), r() * 6, r() < 0.15]);
  var cols = TEN.map(function (c) { return (DS.FLAG && DS.FLAG[c]) || '#f6cf57'; });
  function draw() {
    if (off || !cv.isConnected) return;
    t += 1 / 60;
    g.imageSmoothingEnabled = false; g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, W, H); g.drawImage(KIT.titleBg(W, H), 0, 0);
    for (i = 0; i < stars.length; i++) { var s = stars[i], a = 0.35 + 0.45 * Math.sin(t * (1.2 + s[2] * 0.3) + s[2] * 7); g.globalAlpha = Math.max(0.1, a); g.fillStyle = s[3] ? '#fff3c4' : '#ffffff'; g.fillRect(s[0], s[1], 1, 1); }
    g.globalAlpha = 1;
    TEN.forEach(function (c, n) {
      var tg = want[n] ? 1 : 0; dn[n] += (tg - dn[n]) * (quick() ? 1 : 0.05); if (Math.abs(tg - dn[n]) < 0.01) dn[n] = tg;
      var d = dn[n], px = 3 + n * 17 + (n % 2), py = 46 + (n % 2) * 5 + (d < 0.5 ? Math.round(Math.sin(t * 3 + n) * 0.6) : 0), wv = d > 0.4 ? 0 : Math.round(Math.sin(t * 5 + n) * 1), fy = Math.round(d * 12);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(px + 3, py + 15, 10, 2);
      g.fillStyle = K; g.fillRect(px + 13, py - 13, 1, 16);
      g.globalAlpha = 1 - d * 0.55;
      g.fillStyle = K; g.fillRect(px + 14, py - 14 + fy, 8 + wv, 6 - Math.round(d * 2));
      g.fillStyle = d > 0.6 ? '#5b5870' : cols[n]; g.fillRect(px + 14, py - 13 + fy, 6 + wv, 4 - Math.round(d * 2));
      g.globalAlpha = 1;
      g.fillStyle = d > 0.6 ? '#6b6880' : '#f6cf57'; g.fillRect(px + 13, py - 14, 1, 1);
      try {
        var sc = DS.spriteCanvas(c + '_' + TT[n], null, d > 0.02 ? { hd: 1, toon: 0, tint: '#1a1528' } : { hd: 1, toon: 0 });
        if (d > 0.02 && d < 0.98) { g.drawImage(DS.spriteCanvas(c + '_' + TT[n], null, { hd: 1, toon: 0 }), px, py, 16, 16); g.globalAlpha = d; g.drawImage(sc, px, py, 16, 16); g.globalAlpha = 1; }
        else { g.globalAlpha = d >= 0.98 ? 0.5 : 1; g.drawImage(sc, px, py, 16, 16); g.globalAlpha = 1; }
      } catch (x) { g.globalAlpha = 1; }
      if (n === kp) { g.globalAlpha = 0.22 + 0.1 * Math.sin(t * 2); g.fillStyle = '#fff3c4'; g.fillRect(px + 2, py + 16, 12, 1); g.globalAlpha = 1; }      // 남는 하나: 발밑의 옅은 빛
    });
    requestAnimationFrame(draw);
  }
  draw();
  return (cv._art = { lower: function (n) { want = {}; order.slice(0, Math.max(0, Math.min(9, n))).forEach(function (k) { want[k] = 1; }); }, stop: function () { off = true; }, down: function () { return Object.keys(want).length; } });      // _art: 시험이 읽는다
}
// ───────── 그림: 엔딩의 해돋이 — p(0~1)가 8초 남짓 오른다. 밤하늘이 걷히고 해가 능선 뒤에서 뜨고 열 깃발에 빛이 든다 ─────────
var skyCache = {};
function skyCv(key, W, H, cols) {
  if (skyCache[key]) return skyCache[key];
  var cv = document.createElement('canvas'); cv.width = W; cv.height = H; DS.sceneKit.sky(cv.getContext('2d'), W, 0, H, cols); return (skyCache[key] = cv);
}
function endingArt(cv, ms) {
  var KIT = DS.sceneKit; if (!KIT || !cv.getContext) return { stop: function () {}, p: function () { return 1; } };
  var W = 120, H = 76, HZ = 52, g, t0 = performance.now(), off = false, r = KIT.sr(9), stars = [], i, p = 0, TEN = KIT.TEN;
  cv.width = W * 2; cv.height = H * 2; g = cv.getContext('2d');
  for (i = 0; i < 26; i++) stars.push([Math.floor(r() * W), Math.floor(r() * (HZ - 12)), r() * 6]);
  var night = skyCv('n', W, HZ, ['#0e0c1c', '#131024', '#1a1630', '#221c3a', '#2a2248', '#33285a']);
  var dawn = skyCv('d', W, HZ, ['#241e48', '#3a2c5c', '#6a4068', '#b05a68', '#e88a66', '#ffc880', '#ffe6a8']);
  function mix(a, b, k) { var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), c = function (s) { return Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * k); }; return 'rgb(' + c(16) + ',' + c(8) + ',' + c(0) + ')'; }
  function draw(now) {
    if (off || !cv.isConnected) return;
    p = quick() ? 1 : Math.max(0, Math.min(1, (now - t0) / (ms || 8000)));
    var e = p * p * (3 - 2 * p), t = now / 1000, sy = Math.round(HZ + 8 - e * 24);
    g.imageSmoothingEnabled = false; g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, W, H);
    g.drawImage(night, 0, 0); g.globalAlpha = e; g.drawImage(dawn, 0, 0); g.globalAlpha = 1;
    for (i = 0; i < stars.length; i++) { var s = stars[i]; g.globalAlpha = Math.max(0, (0.3 + 0.4 * Math.sin(t * 1.4 + s[2] * 7)) * (1 - e * 1.4)); g.fillStyle = '#ffffff'; g.fillRect(s[0], s[1], 1, 1); }
    if (e > 0.45) { var ra = (e - 0.45) / 0.55; for (i = 0; i < 16; i++) { var an = Math.PI + i / 15 * Math.PI, rl = 20 + (i % 2) * 9 + Math.sin(t * 1.3 + i) * 1.5; g.globalAlpha = 0.2 * ra; g.fillStyle = '#fff3c4'; for (var rr = 12; rr < rl; rr += 2) g.fillRect(60 + Math.round(Math.cos(an) * rr), sy + Math.round(Math.sin(an) * rr * 0.7), 1, 1); } }      // 햇살
    g.globalAlpha = 0.14 + 0.2 * e; KIT.disc(g, 60, sy, 12, '#fff3c4'); g.globalAlpha = 1; KIT.disc(g, 60, sy, 8, '#fff6d8', '#ffe6a0');
    KIT.ridge(g, W, HZ + 2, HZ - 2, 2, 0.11, 0.04, 0.8, mix('#231c38', '#5a3e5e', e));
    g.fillStyle = mix('#1c3024', '#3f6a3a', e); g.fillRect(0, HZ, W, H - HZ); g.fillStyle = mix('#284a32', '#7ab86a', e); g.fillRect(0, HZ, W, 1);
    g.fillStyle = '#ffe6a0'; g.globalAlpha = 0.35 * e; g.fillRect(40, HZ, 40, 1); g.globalAlpha = 1;
    TEN.forEach(function (c, n) { var x = n < 5 ? 5 + n * 8 : 80 + (n - 5) * 8, y = HZ + 5 + (n % 2) * 2; KIT.flagOn(g, x, y, mix('#4a4860', (DS.FLAG && DS.FLAG[c]) || '#f6cf57', Math.max(0, Math.min(1, e * 1.5 - n * 0.04))), false); });      // 다섯씩 해를 비켜 선다 — 빛이 들며 제 빛깔을 찾는다
    KIT.fadeEdges(g, W, H, 8, 10);
    if (p < 1 || !quick()) requestAnimationFrame(draw);
  }
  draw(t0);
  return (cv._art = { stop: function () { off = true; }, p: function () { return p; } });
}
DS.stageArt = { prologue: prologueArt, ending: endingArt };

// ───────── 말풍선 기록: 무대의 단톡방 줄은 앞의 말이 위에 남는다 ─────────
function logOf(o) { var lg = $('.stg-log', o); if (!lg) { lg = el('<div class="stg-log" aria-hidden="true"></div>'); var sh = $('.sheet', o), bx = $('.story-box', o); sh.insertBefore(lg, bx); } return lg; }
function bubble(k, who, text) { return '<div class="sbub k-' + k + '">' + (who ? '<b class="mh">' + esc(who) + '</b>' : '') + '<span class="mt">' + esc(text) + '</span></div>'; }
function chatty(k) { return k === 'chat' || k === 'hero' || k === 'talk'; }
function fillLog(o, lines, i, max) {
  var out = [], j = i - 1; while (j >= 0 && chatty(kindOf(lines[j])) && out.length < (max || 3)) { var rl = DS.storyResolve([lines[j]])[0]; out.unshift(bubble(kindOf(lines[j]), rl ? rl.w : '', rl ? rl.t : '')); j--; }
  logOf(o).innerHTML = chatty(kindOf(lines[i])) ? out.join('') : '';
}

// ───────── ① 도입 ─────────
// lines: 도입 글 그대로 (ui.js 가 넘긴다). 전장 메모 줄은 여기서 빼 코치 표시로 띄운다. 줄 수가 달라져도 갈래로 박자를 나눈다:
//   앞머리 지문 가운데 첫 두 줄 = 검은 화면 · 그다음 지문(첫 말이 나오기 전까지) = 밤 언덕(아홉 깃발이 그 줄들에 걸쳐 내려간다) · 말(단톡방 · 맹주 · 사람) = 말풍선
DS.stagePrologue = function (lines, cb, who) {
  var all = [].concat(lines || []), memo = [], rest = [];
  all.forEach(function (l) { if (kindOf(l) === 'memo') memo.push(l); else rest.push(l); });
  var tips = memo.length ? DS.storyResolve(memo).map(function (x) { return x.t; }) : [];
  var after = function () { if (cb) cb(); if (tips.length) proTip(tips.join(' ')); };
  if (!rest.length) { after(); return null; }
  var bg = el('<div class="stg-bg"><canvas class="px stg-cv" width="180" height="80" aria-hidden="true"></canvas></div>');
  var hero = G.save && G.save.chars && G.save.chars[G.save.hero], art = null, LS = [], nA = 0, nB = 0;
  var ST = {
    cls: 'stg-pro', bg: bg,
    kind: kindOf,
    init: function (ls) {      // story() 가 지금 판에 맞춘 줄 목록 — 갈래를 훑어 박자를 나눈다
      LS = ls; var lead = 0; while (lead < LS.length && kindOf(LS[lead]) === 'nar') lead++;
      nA = Math.min(2, lead); nB = lead - nA;
    },
    fade: function (i, l, k) { return k !== 'nar' ? 0 : i < nA ? 1200 : 700; },
    onLine: function (i, l, k, o) {
      var beat = i < nA ? 'a' : i < nA + nB ? 'b' : 'c';
      o.dataset.beat = beat;
      if (!art && beat !== 'a') art = prologueArt($('.stg-cv', o), hero ? hero.cls : 'inf');
      if (art) art.lower(beat === 'b' ? Math.round(9 * (i - nA + 1) / nB) : beat === 'c' ? 9 : 0);
      fillLog(o, LS, i, 3);
      if (chatty(k) && !quick()) { var bx = $('.story-box', o); bx.style.animation = 'none'; void bx.offsetWidth; bx.style.animation = ''; A(k === 'hero' ? 'press' : 'ready'); }      // 말풍선이 줄마다 다시 미끄러져 들어온다
    },
    out: function (fin, o) { o.classList.add('out'); setTimeout(function () { if (art) art.stop(); fin(); }, 720); }
  };
  return U.story(rest, after, who || '', { stage: ST });
};
// 조작 안내: 조이스틱 코치(joystick.js)가 먼저 「여기를 누른 채 끌면 이동」을 밝히고, 그다음 마을 위쪽 출구를 밝힌다. 코치가 뜰 수 없으면(창이 열려 있다 등) 예전처럼 글 상자로
function proTip(text, n) {
  n = n || 0; if (G.quiet || !DS.coach || !text) return;
  if (n > 40 || !G.save || G.scn || !G.zone || !G.zone.town) return;
  if (G.hold > 0 || document.querySelector('.coach') || document.querySelector('#app .ov:not(.ghost)') || (n < 7 && DS.Joy && DS.Joy.on && DS.Joy.on() && G.save.seen && !G.save.seen.joy)) { setTimeout(function () { proTip(text, n + 1); }, 700); return; }
  var ex = (G.zone.pois || []).filter(function (p) { return p.t === 'exit' && p.side === 'N'; })[0] || (G.zone.pois || []).filter(function (p) { return p.t === 'exit'; })[0];
  var short = String(text).split(/[.!?]\s/)[0].replace(/[.!?]$/, '');
  G.coachAt = -1e9;      // 조이스틱 코치 바로 뒤라도 글 상자로 물러서지 않게 (도입의 한 묶음이다)
  DS.coach(ex ? { x: ex.x, y: ex.y + (ex.side === 'N' ? 1 : 0) } : null, short, { long: text, ms: 5600 });
}
DS.proTip = proTip;

// ───────── HUD 걷기 · 장막 (엔딩 · 교회) ─────────
// #stgkeep: 싸움 화면과 HUD 를 덮는 장막. 엔딩에서는 해돋이 그림을 지닌 채 기록 · 다음 세대 · 위업 창 뒤에 남고, 들판으로 돌아갈 때(DS.stageClear — game.js enterZone · startScenario) 걷힌다.
function keepEl(cls, html) {
  var host = sg(); if (!host) return null;
  var k = document.getElementById('stgkeep'); if (k) k.remove();
  k = el('<div id="stgkeep" class="stgkeep ' + cls + '">' + (html || '') + '</div>'); host.appendChild(k); host.classList.add('hud-off');
  return k;
}
DS.stageClear = function (now) {
  var host = sg(), k = document.getElementById('stgkeep');
  if (host) host.classList.remove('hud-off', 'rite-on');
  if (!k) return;
  if (now || quick()) { k.remove(); return; }
  k.id = ''; k.classList.add('out'); setTimeout(function () { k.remove(); }, 520);      // 새 장면 위에서 스르르 걷힌다
};
DS.stageOn = function () { return !!document.getElementById('stgkeep'); };

// ───────── ② 엔딩 ─────────
// 「1」 줄: 글 끝의 「…」(답장)를 말풍선으로 떼어 낸다. 줄에 chat: 1 을 달았거나 글에 「1」이 있고 따옴표로 끝날 때
function oneOf(l, text) {
  var tag = !!(l && typeof l === 'object' && l.chat); if (!tag && !(/「1」/.test(text) && /」\s*$/.test(text))) return null;
  var m = /^([\s\S]*?)\s*「([^「」]*)」\s*$/.exec(text); if (!m || !m[2] || /^1$/.test(m[2])) return tag ? { nar: '', re: text } : null;
  return { nar: m[1], re: m[2], cut: m[1].length };
}
DS.stageEnding = function (lines, cb) {
  var ls = [].concat(lines || []), sv = G.save, dead = [];
  try { dead = (DS.storyDead(sv) || []).slice(0, 5).map(function (d) { return d.n; }); } catch (x) { dead = []; }
  var joined = dead.join('. ');
  ls = ls.map(function (l) { return typeof l === 'string' && dead.length && l.indexOf(joined) >= 0 ? { t: l, roll: dead } : l; });      // 먼저 간 이름: 한 사람씩 떠오른다 (story() 의 이름 낭독)
  var keep = keepEl('end', '<canvas class="px stg-cv" width="120" height="76" aria-hidden="true"></canvas>'), art = null;
  var go = function () {
    if (keep) { keep.classList.add('lit'); art = endingArt($('.stg-cv', keep), 8000); }
    var n = 0, ST = {
      cls: 'stg-end',
      init: function (l2) { n = l2.length; },
      kind: function (l) { var k = kindOf(l), t = DS.storyResolve([l])[0]; return k === 'nar' && t && oneOf(l, t.t) ? 'one' : k; },
      fade: function (i, l, k) { return k === 'nar' || k === 'one' ? 700 : 450; },
      hold: function (i) { return i === n - 1 ? 2000 : 0; },      // 마지막 줄은 잠깐 머문다
      onLine: function (i, l, k, o, re) {
        var lg = logOf(o), line = $('.line', o), t = DS.storyResolve([l])[0], one = k === 'one' && t ? oneOf(l, t.t) : null;
        lg.innerHTML = '';
        if (one) {      // 단톡방의 「1」이 사라지고 답장이 온다 (훈수 말풍선과 같은 결)
          if (one.cut != null) line.innerHTML = '<span>' + esc(t.t.slice(0, one.cut)) + '</span><span class="re-src">' + esc(t.t.slice(one.cut)) + '</span>';
          lg.innerHTML = '<div class="sbub k-one' + (re || quick() ? ' now' : '') + '"><b class="mh">선대 단톡방</b><span class="mt">읽지 않음 <i class="unread">1</i></span></div>' +
            '<div class="sbub k-re' + (re || quick() ? ' now' : '') + '"><b class="mh">' + esc(mundong()) + '</b><span class="mt">' + esc(one.re) + '</span></div>';
          if (!re && !quick()) { setTimeout(function () { if (lg.isConnected) A('close'); }, 800); setTimeout(function () { if (lg.isConnected) A('ready'); }, 1500); }
        }
      }
    };
    U.story(ls, function () { if (cb) cb(); }, '', { stage: ST });
  };
  if (quick() || !keep) { if (keep) keep.classList.add('on'); go(); return; }
  requestAnimationFrame(function () { keep.classList.add('on'); });      // 600ms 에 걸쳐 검게 가라앉는다
  setTimeout(go, 640);
};
function mundong() { try { var l = DS.say('dawn', ''); return String(l.w || '먼동').replace(/^옛 맹주 /, ''); } catch (x) { return '먼동'; } }

// ───────── ④ 교회의 의식: 어둑한 바탕 + 촛불 (전멸 뒤 — game.js onLose) ─────────
// DS.riteVeil(true, { solid }) 로 켜고 DS.stageClear() 로 끈다. 마을에 들어선 뒤에 켜면 교회 앞마당이 어둑하게 비친다.
DS.riteVeil = function (on, o) {
  if (!on) { DS.stageClear(); return null; }
  var fl = ''; for (var i = 0; i < 9; i++) fl += '<i class="cdl" style="--i:' + i + ';--x:' + [8, 19, 31, 43, 50, 57, 69, 81, 92][i] + '%;--h:' + [18, 30, 14, 26, 36, 22, 16, 32, 20][i] + 'px"><u></u></i>';
  for (i = 0; i < 8; i++) fl += '<i class="emb" style="--i:' + i + ';--x:' + [12, 24, 37, 46, 55, 66, 78, 90][i] + '%"></i>';
  var k = keepEl('rite' + (o && o.solid ? ' solid' : ''), '<div class="rv-fx" aria-hidden="true">' + fl + '</div>' + (o && o.label ? '<p class="rv-at">' + esc(o.label) + '</p>' : ''));
  var host = sg(); if (host) host.classList.add('rite-on');
  if (k) { if (quick()) k.classList.add('on', 'now'); else requestAnimationFrame(function () { k.classList.add('on'); }); }
  return k;
};
// 검은 장막 한 번: 가라앉고(ms) → mid() → 걷힌다. 조용한 시험이면 곧바로
DS.stageFade = function (mid, ms) {
  var host = sg(); if (quick() || !host) { mid(); return; }
  var c = el('<div class="stg-cut"></div>'); host.appendChild(c);
  requestAnimationFrame(function () { c.classList.add('on'); });
  setTimeout(function () { try { mid(); } finally { requestAnimationFrame(function () { c.classList.remove('on'); }); setTimeout(function () { c.remove(); }, (ms || 420) + 80); } }, (ms || 420) + 30);
};

// ───────── ③ 깃대 ─────────
// 20번(깃대지기 벨마르) 전에는 물려받은 「낡은 깃발」의 자루, 그 뒤로는 「맹세의 깃대」 (경전 §9). 하는 일은 같다.
DS.poleInfo = function (s) {
  var named = !!(s && (s.crest || (s.cleared && s.cleared[20])));
  return named ? { key: 'pole', name: '맹세의 깃대', sub: '맨 끝 줄은 늘 비어 있다. 다음 사람 자리다', where: '깃대에 새긴 이름' } : { key: 'old', name: '낡은 깃발', sub: '물려받은 연맹의 깃발. 이름은 자루에 새긴다', where: '자루에 새긴 이름' };
};
function PP(s) { return (s && s.lin && s.lin.P) || {}; }
function pName(s, p) { return p ? p.ttl || (p.gv && DS.snName ? DS.snName(p.sn, p.n) : p.n) || '' : ''; }      // 읽기만 (DS.linName 은 사람 줄을 맞춰 고친다)
// 대마다 새긴 이름: [{ g, head(그 대의 맹주 이름 · 떠났으면 그 사람도 names 에), cur(지금 대), names: [{ n, nk, role, at, why, lw, k, b, L, gr, cls, type, pid, head }] }]
DS.poleData = function (s) {
  var P = PP(s), lg = (s && s.lin && s.lin.log) || [], fl = (s && s.fallen) || [], heads = [], seen = {}, gens = [];
  lg.forEach(function (e) { if (e && (e.t === 'heir' || e.t === 'lapse') && e.b && P[e.b] && !seen[e.b]) { seen[e.b] = 1; heads.push({ pid: e.b, tm: (P[e.b].d && P[e.b].d.tm) != null ? P[e.b].d.tm : e.tm || 0 }); } });
  var hc = s && s.chars && s.chars[s.hero];
  if (hc && hc.vac && hc.vac.pid && P[hc.vac.pid] && !seen[hc.vac.pid]) { seen[hc.vac.pid] = 1; heads.push({ pid: hc.vac.pid, tm: (P[hc.vac.pid].d && P[hc.vac.pid].d.tm) || 1e12, wait: 1 }); }      // 방금 떠나 아직 뒤를 정하지 않았다
  heads.forEach(function (h, i) {
    var p = P[h.pid], sn = p.snap || {}, d = p.d || {};
    gens.push({ g: i + 1, head: pName(s, p), names: [], tm: h.tm, hd: { n: pName(s, p), nk: '맹주', role: '맹주' + (sn.cls && DS.CLASSES[sn.cls] ? ', ' + DS.CLASSES[sn.cls].name : ''), at: d.at || '', why: d.why || '', lw: p.lw || '', L: sn.L || 0, cls: sn.cls || '', pid: p.id, head: 1, gr: 5 } });
  });
  var curName = ''; try { curName = hc && !hc.vac ? DS.charName(hc, s) : ''; } catch (x) { curName = ''; }
  gens.push({ g: gens.length + 1, head: curName, names: [], tm: Infinity, cur: 1 });
  var gi = 0;
  fl.forEach(function (f) {
    if (!f || !f.n) return;
    var p = f.pid && P[f.pid], tm = p && p.d && p.d.tm != null ? p.d.tm : null;
    if (tm != null) { var k = 0; while (k < gens.length - 1 && tm > gens[k].tm) k++; gi = Math.max(gi, k); }
    var ch = f.f && s.chars && s.chars[f.f], cls = ch ? ch.cls : (f.cast && DS.CLASSES[f.cast] ? f.cast : '');
    gens[gi].names.push({ n: f.n, nk: f.nk || '', role: [ch ? DS.flagName(ch.cls, s) + ' 가주' : '', DS.MERCS[f.type] ? DS.MERCS[f.type].name : ''].filter(Boolean).join(', '), at: f.at || '', why: (p && p.d && p.d.why) || '', lw: f.lw || (p && p.lw) || '', k: f.k || 0, b: f.b || 0, L: f.L || 0, gr: f.g || 1, cls: cls, type: f.type || '', pid: f.pid || 0, lord: !!ch });
  });
  gens.forEach(function (g) { if (g.hd) g.names.push(g.hd); });
  return gens.filter(function (g) { return g.names.length || g.cur; });
};
DS.poleCount = function (s) { var n = 0; try { DS.poleData(s).forEach(function (g) { n += g.names.length; }); } catch (x) { n = (s && s.fallen || []).length; } return n; };
function gcol(g) { return (DS.GRADES && DS.GRADES[g] && DS.GRADES[g].col) || '#d9cfb8'; }
function faceOf(e) {
  var spr = ''; try { spr = e.cls && DS.lookName ? DS.lookName(e.cls, Math.max(1, DS.tierOfL(e.L || 1))) : e.type && DS.MERCS[e.type] ? (DS.MERCS[e.type].big ? DS.MERCS[e.type].sprite : e.type + '_' + (e.gr || 1) + '_0') : ''; } catch (x) { spr = ''; }
  return spr ? U.sprTag(spr, '', 3) : '';
}
function heirloomOf(s, e) {      // 그 사람이 남긴 유품 (heirloom.js — 저장은 읽기만)
  if (!s || !s.gh || !DS.hlOf) return null;
  for (var id in s.gh) { var h = DS.hlOf(s, id); if (!h || !(e.pid && h.p === e.pid) && h.n !== e.n) continue; var g = DS.gear(id); if (!g) continue;
    var who = ''; DS.charList(s).forEach(function (c) { if (c.w === id || c.a === id) who = DS.flagName(c.cls, s); });
    return { id: id, name: g.short || g.name, who: who };
  }
  return null;
}
DS.poleOpen = function () {
  var s = G.save; if (!s) return null;
  var I = DS.poleInfo(s), data = DS.poleData(s), total = 0, flat = [];
  data.forEach(function (g) { g.names.forEach(function (e) { e.i = flat.length; e.g = g.g; flat.push(e); total++; }); });
  var html = '<div class="polew k-' + I.key + '"><header class="pl-h"><h2>' + esc(I.name) + '</h2><p class="pl-sub">' + esc(I.sub) + '</p><button class="pl-x" data-close aria-label="닫기">' + (U.svg ? U.svg('close', 20) : '×') + '</button></header>' +
    '<div class="pl-b"><div class="pl-pole" aria-hidden="true"><i class="pl-top"></i><i class="pl-flag"></i><i class="pl-rod"></i></div><div class="pl-list">' +
    (total ? '<p class="pl-cnt">' + esc(I.where) + ' <b class="num">' + total + '</b>명</p>' : '<p class="pl-none">아직 새긴 이름이 없다.<br>한 사람도 잃지 않았다.</p>') +
    data.map(function (g) {
      if (!g.names.length) return '';
      return '<section class="pl-g"><h5><b>' + g.g + '대</b>' + (g.head ? '<span>맹주 ' + esc(g.head) + (g.cur ? '의 때' : '') + '</span>' : '') + '</h5><div class="pl-ns">' +
        g.names.map(function (e) { return '<button class="pl-n' + (e.head ? ' hd' : e.lord ? ' ld' : '') + '" data-pn="' + e.i + '" style="--gc:' + gcol(e.gr) + '"><span>' + esc(e.n) + '</span></button>'; }).join('') + '</div></section>';
    }).join('') +
    '<p class="pl-next">' + (I.key === 'pole' ? '맨 끝 줄, 다음 사람 자리' : '자루 끝에는 아직 빈 데가 많다') + '</p></div></div>' +
    '<div class="pl-card" hidden></div></div>';
  var o = U.overlay(html, 'modal poleov'), card = $('.pl-card', o), cur = null, callT = 0;
  function show(e) {
    cur = e; var hl = heirloomOf(s, e), f = faceOf(e);
    card.innerHTML = '<div class="pc-in"><span class="pc-f">' + f + '</span><div class="pc-t"><p class="pc-nk">' + esc([e.nk, e.g + '대'].filter(Boolean).join(' · ')) + '</p><h3 style="color:' + gcol(e.gr) + '">' + esc(e.n) + '</h3>' +
      (e.role ? '<p class="pc-r">' + esc(e.role) + (e.L ? ', ' + esc(DS.lvText ? DS.lvText(e.L) : 'Lv' + e.L) : '') + '</p>' : '') + '</div></div>' +
      '<dl class="pc-d">' + (e.at ? '<dt>쓰러진 곳</dt><dd>' + esc(e.at) + (e.why && e.why !== '전사' ? ', ' + esc(e.why) : '') + '</dd>' : '') +
      (e.lw ? '<dt>마지막 말</dt><dd class="lw">「' + esc(e.lw) + '」</dd>' : '') +
      (e.head ? '' : '<dt>싸움</dt><dd>전투 <b class="num">' + (e.b || 0) + '</b>, 처치 <b class="num">' + (e.k || 0) + '</b></dd>') +
      (hl ? '<dt>유품</dt><dd>' + esc(hl.name) + '<small>' + esc(hl.who ? hl.who + '이 들고 있다' : '가방에 있다') + '</small></dd>' : '') + '</dl>' +
      '<p class="pc-say" aria-live="polite"></p><div class="pc-b"><button class="btn gold" data-pcall="1">이름을 부른다</button><button class="btn" data-pback="1">돌아간다</button></div>';
    U.hydrate(card); card.hidden = false; o.classList.add('carded');
    $$('.pl-n', o).forEach(function (b) { b.classList.toggle('sel', +b.dataset.pn === e.i); });
  }
  o.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-pn]'); if (b) { A('tap'); show(flat[+b.dataset.pn]); return; }
    if (ev.target.closest('[data-pback]')) { A('close'); card.hidden = true; o.classList.remove('carded'); $$('.pl-n.sel', o).forEach(function (x) { x.classList.remove('sel'); }); return; }
    if (ev.target.closest('[data-pcall]') && cur) {      // 이름을 부른다 — 보기만 (규칙은 없다). 이름이 2초 남짓 빛나고 한마디가 돌아온다
      var nb = $('.pl-n[data-pn="' + cur.i + '"]', o), say = $('.pc-say', o), T = DS.SHADE_TXT || {};
      A('holy'); clearTimeout(callT);
      [nb, $('.pc-in h3', o)].forEach(function (x) { if (x) { x.classList.remove('call'); void x.offsetWidth; x.classList.add('call'); } });
      if (say) { say.textContent = (T.fade && T.fade[0]) || '…또 불러라.'; say.classList.remove('on'); void say.offsetWidth; say.classList.add('on'); }
      callT = setTimeout(function () { [nb, $('.pc-in h3', o)].forEach(function (x) { if (x) x.classList.remove('call'); }); }, 2200);
    }
  });
  return o;
};
// 깃대 그림 (마을 지도 위): 두 칸 높이의 깃대와 깃발, 이름마다 리본 하나 (열둘까지). 20번 전에는 해진 깃발
var V = DS.View && DS.View.prototype;
if (V) V.drawPole = function (g, d) {
  var s = G.save, I = DS.poleInfo(s), old = I.key === 'old', x = d.x * 16, y = d.y * 16, t = this.time || 0, n = 0, i;
  if (this._plS !== s || (this._plT || 0) < t - 3 || this._plT > t) { this._plS = s; this._plT = t; try { this._plN = DS.poleCount(s); } catch (e) { this._plN = 0; } }
  n = Math.min(12, this._plN || 0);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 4, y + 13, 9, 2); g.fillRect(x + 5, y + 15, 7, 0.5);
  g.fillStyle = '#3b3340'; g.fillRect(x + 5, y + 11, 6, 3); g.fillStyle = '#6a6272'; g.fillRect(x + 5, y + 11, 6, 1);      // 돌 받침
  g.fillStyle = '#1b1626'; g.fillRect(x + 7, y - 20, 2, 32); g.fillStyle = old ? '#6f5a40' : '#a8875a'; g.fillRect(x + 7.5, y - 19.5, 1, 31);
  g.fillStyle = old ? '#9a8a5a' : '#f6cf57'; g.fillRect(x + 6.5, y - 21.5, 3, 2);
  var wv = Math.sin(t * 2.4) > 0 ? 1 : 0, col = old ? '#7a6a58' : ((DS.FLAG && s && s.chars[s.hero] && DS.FLAG[s.chars[s.hero].cls]) || '#c9a96a');
  g.fillStyle = '#1b1626'; g.fillRect(x + 9, y - 19.5, 10 + wv, 8);
  g.fillStyle = col; g.fillRect(x + 9, y - 18.5, 9 + wv, 6); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 9, y - 13.5, 9 + wv, 1);
  if (old) { g.fillStyle = '#1b1626'; g.fillRect(x + 15, y - 15.5, 2, 2); g.fillRect(x + 12, y - 18.5, 1, 2); }      // 해진 자리
  else { g.fillStyle = '#fff3c4'; g.fillRect(x + 11, y - 16.5, 4, 1); g.fillRect(x + 12.5, y - 17.5, 1, 3); }
  var RC = ['#e8e0cc', '#c9a96a', '#b9c4d8', '#d98a8a'];
  for (i = 0; i < n; i++) {      // 리본: 이름 하나에 하나, 바람에 한 칸씩 나부낀다
    var ry = y - 9 + i * 1.5, sd = i % 2 ? -1 : 1, fw = Math.sin(t * 3 + i * 1.7) > 0.2 ? 1 : 0;
    g.fillStyle = RC[i % RC.length]; g.fillRect(sd > 0 ? x + 9 : x + 4 - fw, ry, 3 + fw, 1); g.fillRect(sd > 0 ? x + 11 + fw : x + 4 - fw, ry + 1, 1, 1);
  }
};
})();
