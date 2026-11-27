// 전민 — 칼무덤: 마을마다 넷째 민가 자리(15, 9)에 선 낮은 무덤. 먼저 간 이들의 칼이 자루를 위로 꽂혀 있다.
//   골드를 바치고 손을 뻗으면 한 자루가 뽑힌다: 일반 장비 · 유니크 · 전설 · 강화 보호 부적. 전설이 아홉 번 나오지 않으면 열 번째는 전설.
//   숫자는 모두 DS.BLADES 한 곳에. 굴림은 rnd 를 받는다 (없으면 Math.random — 시험은 씨앗 굴림을 넘긴다).
//   장비는 다른 드랍과 같은 길(DS.lootPut)로 가방에 들어간다 — 가방 한도 · 잠금 · 내력(얻은 곳 「칼무덤」)이 그대로.
//   저장: save.blades = { n: 뽑은 수, p: 마지막 전설 뒤로 뽑은 수 } (뽑은 적이 있을 때만 · save.js fixSave 가 바로잡는다)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
DS.BLADES = {
  price: 10000,                                   // 한 자루 값 (골드)
  many: 10,                                       // 「열 자루 뽑기」 수 (값은 그대로 열 배 · 덜어 주지 않는다)
  rate: { plain: 37, uq: 30, leg: 25, prot: 8 },  // 나올 몫 (%)
  pity: 10,                                       // 전설이 이만큼째에는 반드시 (아홉 번 없으면 열 번째)
  uq: [[2, 50], [3, 35], [4, 15]],                // 유니크의 굴림: 옵션 하나 · 옵션 둘 · 높은 굴림 (DS.rollGear 의 grade)
  protN: 2,                                       // 부적이 나오면 몇 장
  protRefund: 3000,      // 바닥값 — 실제로는 지금 대장간 값(DS.protPrice)과 견줘 큰 쪽 (2.7.2)                               // 부적이 가득 차 못 든 한 장마다 돌려주는 골드
  at: '칼무덤'                                    // 장비 내력에 남는 얻은 곳
};
function refundOf(save) { return Math.max(T().protRefund, DS.protPrice ? DS.protPrice(save) : 0); }      // 2.7.2: 늦게 가면 대장간 값이 더 비싸다

var KINDS = ['plain', 'uq', 'leg', 'prot'];
DS.BLADES_NAME = { plain: '일반 장비', uq: '유니크', leg: '전설', prot: '강화 보호 부적' };
DS.BLADES_UQ = { 2: '옵션 하나', 3: '옵션 둘', 4: '높은 굴림' };
function T() { return DS.BLADES; }
function rec(save) { var b = save.blades; if (!b || typeof b !== 'object' || Array.isArray(b)) b = save.blades = { n: 0, p: 0 }; b.n = Math.max(0, Math.round(+b.n || 0)); b.p = Math.max(0, Math.min(T().pity - 1, Math.round(+b.p || 0))); return b; }
// 전설까지 몇 번 남았나 (1 = 다음 한 자루는 반드시 전설)
DS.bladesLeft = function (save) { var b = save && save.blades, p = b && b.p > 0 ? Math.min(T().pity - 1, b.p | 0) : 0; return Math.max(1, T().pity - p); };
// 무엇이 나오나: p = 마지막 전설 뒤로 뽑은 수 (천장에 닿았으면 전설)
DS.bladesKind = function (rnd, p) {
  if (p >= T().pity - 1) return 'leg';
  var R = T().rate, tot = 0, i, r;
  for (i = 0; i < KINDS.length; i++) tot += Math.max(0, +R[KINDS[i]] || 0);
  r = rnd() * tot;
  for (i = 0; i < KINDS.length; i++) { r -= Math.max(0, +R[KINDS[i]] || 0); if (r < 0) return KINDS[i]; }
  return KINDS[KINDS.length - 1];
};
function pickW(rnd, list) { var t = 0, i, r; for (i = 0; i < list.length; i++) t += list[i][1]; r = rnd() * t; for (i = 0; i < list.length; i++) { r -= list[i][1]; if (r < 0) return list[i][0]; } return list[list.length - 1][0]; }
function rosterCats(save) { var o = []; DS.charList(save).forEach(function (c) { var G = DS.CLS_GEAR[c.cls]; if (G) G.w.concat(G.a).forEach(function (k) { if (o.indexOf(k) < 0) o.push(k); }); }); return o; }
// 전설의 후보: 들판의 전설(얻는 곳 'zone:') 가운데 아직 없는 것. 다 가졌으면 들판 전설 모두. 시나리오 보상 · 보스 고유 장비는 넣지 않는다 (보스 사냥은 보스 사냥대로)
DS.bladesLegPool = function (save) {
  var dex = DS.legDex ? DS.legDex(save).filter(function (x) { return x.kind === 'zone'; }) : [], free = dex.filter(function (x) { return x.found !== 2; });
  return (free.length ? free : dex).map(function (x) { return x.id; });
};
// 한 자루. 돌려주는 것: { k: 'plain'|'uq'|'leg'|'prot', id, g(장비), d(가방에 넣은 결과), sold(팔린 값), gr(유니크 굴림), fresh(처음 가진 전설), n(받은 부적), miss(못 든 부적), refund }
//   o.flat: 천장을 보지 않는다 (확률 시험용)
DS.bladesRoll = function (save, rnd, o) {
  rnd = rnd || Math.random; o = o || {};
  var b = rec(save), k = DS.bladesKind(rnd, o.flat ? 0 : b.p), r = { k: k }, id = null, L = DS.partyL ? DS.partyL(save) : 1;
  if (k === 'leg') {
    var pool = DS.bladesLegPool(save);
    id = pool.length ? pool[Math.floor(rnd() * pool.length)] : null;
    if (id) r.fresh = !(DS.legFound && DS.legFound(save, id) === 2);
    else { k = r.k = 'uq'; r.gr = 4; }      // 전설이 하나도 없는 판(그럴 일은 없다) — 높은 굴림 유니크로
  }
  if (k === 'plain') id = DS.rollPlain({ L: L, save: save, need: true, boss: true }, rnd);
  else if (k === 'uq') { r.gr = r.gr || pickW(rnd, T().uq); id = DS.rollGear({ L: L, cats: rosterCats(save), grade: r.gr, boss: true, save: save }, rnd); }
  if (k === 'prot') {
    var n = DS.giveItem(save, 'prot', T().protN);
    r.n = n; r.miss = T().protN - n; r.refund = r.miss * refundOf(save); if (r.refund) save.gold += r.refund;
  } else {
    var d = DS.lootPut(save, id, { at: T().at });
    r.id = id; r.d = d; r.g = DS.gear(id); r.sold = d && d.sold ? d.sold : 0;
  }
  b.n++; b.p = r.k === 'leg' ? 0 : Math.min(T().pity - 1, b.p + 1);
  return r;
};
// 못 뽑는 까닭 ('' = 뽑을 수 있다)
DS.bladesWhy = function (save, count) {
  if (DS.townBusy && DS.townBusy()) return DS.townWorkWhy ? DS.townWorkWhy() : '지금은 뽑을 수 없다';
  if (!save || !(save.gold >= T().price * (count || 1))) return '골드가 모자라다';
  return '';
};
// 값을 치르고 count(1 또는 열) 자루를 차례로. 골드가 모자라면 null (아무것도 바뀌지 않는다)
DS.bladesPull = function (save, count, rnd) {
  count = count === T().many ? T().many : 1;
  var cost = T().price * count, list = [], i;
  if (!save || !(save.gold >= cost)) return null;
  save.gold -= cost;
  for (i = 0; i < count; i++) list.push(DS.bladesRoll(save, rnd));
  return { cost: cost, list: list };
};
// 알림판의 한 줄 (표에서 읽는다)
DS.bladesBoard = function () {
  var R = T().rate, P = T().pity;
  return '일반 장비 ' + R.plain + '%, 유니크 ' + R.uq + '%, 전설 ' + R.leg + '%, 강화 보호 부적 ' + R.prot + '%. ' +
    '전설이 ' + (P === 10 ? '아홉 번' : (P - 1) + '번') + ' 나오지 않으면 ' + (P === 10 ? '열 번째는' : P + '번째는') + ' 전설.';
};

// ───────── 화면 ─────────
var U = DS.ui; if (!U || typeof document === 'undefined') return;
var G = DS.G, esc = U.esc, A = U.A, toast = U.toast;
function fmtN(n) { return U.fmtN ? U.fmtN(n) : String(n); }
function calm() { return !!(U.calm && U.calm()); }
function coin(n) { return '<span class="cur">' + (U.svg ? U.svg('coin', 16, 'coin') : '') + '<b class="num">' + fmtN(n) + '</b></span>'; }
function snd(n) { try { A(n); } catch (x) {} }
function duck(a, ms) { try { if (DS.Audio && DS.Audio.duck) DS.Audio.duck(a, ms); } catch (x) {} }
var LIT = { w: '#f1ecdf', v: '#9d86ff', g: '#ffc94a' };      // 새는 빛: 흰빛(일반) · 푸른 보랏빛(유니크) · 금빛(전설)
function litOf(k) { return k === 'leg' ? 'g' : k === 'uq' ? 'v' : 'w'; }
// ── 그림: 무덤(실루엣 판은 가운데 칼을 비운다) · 뽑히는 칼 · 손 · 부적 ──
var imgC = {};
function moundSrc(sil) {
  var z = G.zone && G.zone.town ? G.zone : null, th = (z && (z.def || DS.ZONES[z.id] || {}).theme) || ((DS.ZONES[(G.save && G.save.town) || 'haemil'] || {}).theme) || 'grass', se = DS.seasonNow ? DS.seasonNow() : 0;
  var key = th + ':' + se + ':' + (sil ? 1 : 0);
  if (!imgC[key] && DS.bladeMoundCanvas) { try { imgC[key] = DS.bladeMoundCanvas(th, se || 0, 1, { sil: sil }).toDataURL(); } catch (x) { imgC[key] = ''; } }
  return imgC[key] || '';
}
var KC = '#1b1626';
var BPAL = { plain: ['#c9cdd8', '#6f7486', '#5a5466', '#8a6a3a'], uq: ['#ddd4fa', '#7a64c0', '#7a5ac8', '#b181e6'], leg: ['#fff4d0', '#e0b85a', '#f6cf57', '#ffe27a'], prot: ['#c9cdd8', '#6f7486', '#5a5466', '#8a6a3a'] };
function sprite(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var g = cv.getContext('2d'); draw(function (x, y, ww, hh, c) { g.fillStyle = c; g.fillRect(x, y, ww, hh); }); return cv.toDataURL(); }
function bladeSrc(k) {      // 12 × 42: 0 둘레 · 1 머리 · 2~5 자루 · 6 코 · 7~39 날 · 40 끝
  var key = 'b:' + k; if (imgC[key]) return imgC[key];
  var P = BPAL[k] || BPAL.plain;
  return (imgC[key] = sprite(12, 42, function (R) {
    R(4, 0, 4, 1, KC); R(3, 1, 6, 5, KC); R(0, 5, 12, 3, KC); R(3, 8, 6, 32, KC); R(4, 40, 4, 1, KC); R(5, 41, 2, 1, KC);
    R(4, 1, 4, 1, P[3]); R(5, 1, 1, 1, '#ffffff');
    for (var y = 2; y <= 5; y++) { R(4, y, 2, 1, y % 2 ? '#8a5a36' : '#6f4a2c'); R(6, y, 2, 1, y % 2 ? '#6f4a2c' : '#4a301c'); }
    R(1, 6, 10, 1, P[2]); R(1, 6, 4, 1, P[3]);
    R(4, 7, 2, 33, P[0]); R(6, 7, 2, 33, P[1]); R(5, 8, 1, 30, '#ffffff'); R(5, 40, 2, 1, P[0]);
  }));
}
function handSrc() {      // 16 × 22: 주먹(위) · 손목 · 소매가 오른쪽 아래로
  if (imgC.hand) return imgC.hand;
  return (imgC.hand = sprite(16, 22, function (R) {
    var y, x0;
    for (y = 6; y < 22; y++) { x0 = 4 + Math.round((y - 6) * 0.55); R(x0 - 1, y, 8, 1, KC); R(x0, y, 6, 1, y < 9 ? '#c9a56a' : '#4a3a6a'); R(x0 + 4, y, 2, 1, y < 9 ? '#a8843a' : '#352a50'); }
    R(1, 0, 10, 7, KC); R(2, 1, 8, 5, '#e8b890'); R(2, 1, 8, 1, '#f4cca8'); R(4, 2, 1, 3, '#c08a64'); R(6, 2, 1, 3, '#c08a64'); R(8, 2, 1, 3, '#c08a64'); R(2, 5, 8, 1, '#c08a64'); R(1, 3, 2, 3, '#e8b890'); R(0, 3, 1, 3, KC);
  }));
}
function charmSrc() {      // 10 × 16: 누런 종이에 붉은 글씨
  if (imgC.charm) return imgC.charm;
  return (imgC.charm = sprite(10, 16, function (R) {
    R(0, 0, 10, 16, KC); R(1, 1, 8, 14, '#f3dc8a'); R(1, 1, 8, 1, '#fff1c0'); R(8, 2, 1, 13, '#d8bc68');
    R(4, 2, 2, 1, '#c0303a'); R(3, 4, 4, 1, '#c0303a'); R(4, 5, 2, 3, '#c0303a'); R(2, 9, 6, 1, '#c0303a'); R(3, 11, 1, 3, '#c0303a'); R(6, 11, 1, 3, '#c0303a'); R(4, 12, 2, 1, '#c0303a');
  }));
}
// ── 창 ──
function poolInfo(s) { var dex = DS.legDex ? DS.legDex(s) : [], zn = dex.filter(function (x) { return x.kind === 'zone'; }); return { have: zn.filter(function (x) { return x.found === 2; }).length, all: zn.length, found: dex.filter(function (x) { return x.found; }).length, dex: dex.length }; }
function pullBtn(s, n) {
  var cost = T().price * n, poor = s.gold < cost, busy = DS.townBusy && DS.townBusy();
  return '<button class="btn bldgo' + (poor || busy ? ' poor' : ' gold') + '" data-bpull="' + n + '"' + (poor || busy ? ' disabled aria-disabled="true"' : '') + '><b>' + (n === 1 ? '한 자루 뽑기' : '열 자루 뽑기') + '</b><small>' + fmtN(cost) + '골드</small>' +
    (poor ? '<i class="bldwhy">골드가 모자라다. ' + fmtN(s.gold) + ' / ' + fmtN(cost) + '</i>' : busy ? '<i class="bldwhy">' + esc(DS.townWorkWhy ? DS.townWorkWhy() : '') + '</i>' : '') + '</button>';
}
function render() {
  var s = G.save, R = T().rate, left = DS.bladesLeft(s), b = s.blades || { n: 0, p: 0 }, pi = poolInfo(s), p = Math.min(T().pity - 1, b.p | 0), pips = '', i;
  for (i = 0; i < T().pity; i++) pips += '<i class="' + (i < p ? 'on' : i === T().pity - 1 ? 'end' : '') + '"></i>';
  var h = '<div class="bldhead"><img class="bldimg" alt="" aria-hidden="true" src="' + moundSrc(false) + '"><p class="bldfl">먼저 간 이들의 칼이 꽂힌 언덕. 값을 치르고 손을 뻗으면 한 자루가 뽑힌다.</p></div>';
  h += '<div class="bldboard" role="note"><p class="bldbt">알림판</p><p class="bldline">' + esc(DS.bladesBoard()) + '</p><ul>' +
    '<li><b>일반 장비</b><i class="num">' + R.plain + '%</i><small>부대의 누군가에게 쓸모 있는 것</small></li>' +
    '<li><b class="lg lg4">유니크</b><i class="num">' + R.uq + '%</i><small>' + T().uq.map(function (u) { return DS.BLADES_UQ[u[0]] + ' ' + u[1] + '%'; }).join(', ') + '</small></li>' +
    '<li><b class="lg lg5">전설</b><i class="num">' + R.leg + '%</i><small>들판의 전설 가운데 아직 없는 것부터 (' + pi.have + ' / ' + pi.all + ' 가짐)</small></li>' +
    '<li><b>강화 보호 부적</b><i class="num">' + R.prot + '%</i><small>' + T().protN + '장. 못 들면 한 장에 ' + fmtN(refundOf(DS.G && DS.G.save)) + '골드로 돌려준다</small></li></ul></div>';
  h += '<div class="bldpity"><p><b>전설까지 ' + left + '번</b>' + (left === 1 ? '<small>다음 한 자루는 반드시 전설</small>' : '<small>지금까지 ' + fmtN(b.n || 0) + '자루</small>') + '</p><span class="bldpips" aria-hidden="true">' + pips + '</span></div>';
  h += '<div class="bldbtns">' + pullBtn(s, 1) + pullBtn(s, T().many) + '</div>';
  h += '<button class="row bldlink" data-bdex="1"><span class="tx"><b>전설 도감</b><small>' + pi.found + ' / ' + pi.dex + ' 찾음</small></span><i class="go" aria-hidden="true">›</i></button>';
  return h;
}
DS.openBlades = function () {
  if (DS.townBusy && DS.townBusy()) { snd('cancel'); toast(DS.townWorkWhy(), 2600); return null; }
  var o = U.sheet('칼무덤', render, 'bldsh');
  o.addEventListener('click', function (e) {
    var b = e.target.closest('[data-bpull]');
    if (b) { if (b.disabled) return; snd('tap'); pull(+b.dataset.bpull, o); return; }
    if (e.target.closest('[data-bdex]') && DS.openDex) { snd('tap'); DS.openDex(); }
  });
  return o;
};
function bagDot(res) {
  if (!res.list.some(function (r) { return r.d && !r.sold; })) return;
  G.bagNew = true; var bm = document.getElementById('bMenu'); if (bm) bm.classList.add('newdot');
}
function pull(n, o, ov) {
  var s = G.save, why = DS.bladesWhy(s, n);
  if (why) { snd('deny'); toast(why === '골드가 모자라다' ? why + '. ' + fmtN(s.gold) + ' / ' + fmtN(T().price * n) : why, 2600); return; }
  var res = DS.bladesPull(s, n); if (!res) return;
  snd('coin'); bagDot(res); U.persist();
  if (o && o.isConnected && o.draw) o.draw();
  show(res, o, ov);
}
// ── 결과 카드 ──
function score(r) { return r.k === 'leg' ? 100 + (r.fresh ? 5 : 0) : r.k === 'uq' ? 50 + (r.gr || 2) * 5 : r.k === 'prot' ? 30 : 10 + ((r.g && r.g.enh) || 0); }
function bestOf(list) { var bi = 0; list.forEach(function (r, i) { if (score(r) > score(list[bi])) bi = i; }); return bi; }
function tagOf(r) { return r.k === 'uq' ? '유니크, ' + (DS.BLADES_UQ[r.gr] || '') : r.k === 'leg' ? (r.fresh ? '전설, 처음 찾았다' : '전설, 이미 가진 것') : r.k === 'prot' ? '강화 보호 부적' : '일반 장비'; }
function icoOf(r, sz) { try { return r.k === 'prot' ? DS.iconHtml('item', 'prot', { size: sz }) : DS.iconHtml('gear', r.id, { size: sz }); } catch (x) { return ''; } }
function nameOf(r) { return r.k === 'prot' ? DS.ITEMS.prot.name : r.g ? (r.g.short || r.g.name) : ''; }
function noteOf(r) {
  if (r.k === 'prot') return r.n ? (r.miss ? '부적 ' + r.n + '장을 받고, 가득 차 못 든 ' + r.miss + '장은 ' + fmtN(r.refund) + '골드로 돌려받았다' : '부적 ' + r.n + '장을 받았다') : '부적이 가득 차 ' + r.miss + '장 모두 ' + fmtN(r.refund) + '골드로 돌려받았다';
  if (r.sold) return '가방이 가득 차 그 자리에서 팔았다 (+' + fmtN(r.sold) + '골드)';
  return r.k === 'leg' || (r.g && r.g.hi) ? '잠근 채로 가방에 넣었다' : '가방에 넣었다';
}
function detail(r) {
  var body = r.k === 'prot' ? '<b>' + esc(DS.ITEMS.prot.name) + ' <i class="own">×' + T().protN + '</i></b><small>' + esc(DS.ITEMS.prot.desc) + '</small>' : (DS.gearHtml ? DS.gearHtml(r.g) : esc(nameOf(r)));
  return '<div class="bcard k-' + r.k + '"><span class="bcico">' + icoOf(r, 56) + '</span><div class="tx"><p class="bctag">' + esc(tagOf(r)) + '</p>' + body + '<p class="bcnote' + (r.sold || r.refund ? ' warn' : '') + '">' + esc(noteOf(r)) + '</p></div></div>';
}
function titleOf(res) {
  if (res.list.length > 1) return '열 자루를 뽑았다';
  var k = res.list[0].k; return k === 'leg' ? '전설이 뽑혔다' : k === 'uq' ? '이름 있는 칼이다' : k === 'prot' ? '칼 대신 부적이 나왔다' : '한 자루를 뽑았다';
}
function sumLine(res) { var c = { leg: 0, uq: 0, plain: 0, prot: 0 }; res.list.forEach(function (r) { c[r.k]++; }); return KINDS.slice().reverse().filter(function (k) { return c[k]; }).map(function (k) { return '<span class="bcs k-' + k + '">' + DS.BLADES_NAME[k] + ' <b class="num">' + c[k] + '</b></span>'; }).join(''); }
function resHtml(res, sel) {
  var s = G.save, n = res.list.length, cost = T().price * n, poor = s.gold < cost, h = '<p class="bctitle">' + esc(titleOf(res)) + '</p>';
  if (n > 1) {
    var bi = bestOf(res.list);
    h += '<p class="bcsum">' + sumLine(res) + '</p><div class="bcgrid">' + res.list.map(function (r, i) {
      return '<button class="bcc k-' + r.k + (i === bi ? ' best' : '') + (i === sel ? ' on' : '') + (r.sold || r.refund ? ' sold' : '') + '" data-bci="' + i + '" style="--i:' + i + '" aria-label="' + esc(nameOf(r) + ', ' + tagOf(r)) + '">' + icoOf(r, 40) + '<b>' + esc(nameOf(r)) + '</b>' + (i === bi ? '<i class="bcbest">가장 좋은 것</i>' : '') + (r.sold || r.refund ? '<i class="bcsold">' + (r.sold ? '팔림' : '골드') + '</i>' : '') + '</button>';
    }).join('') + '</div><div class="bcdet" aria-live="polite">' + detail(res.list[sel]) + '</div>';
  } else h += detail(res.list[0]);
  h += '<p class="bcleft">전설까지 ' + DS.bladesLeft(s) + '번<i class="esep"></i>남은 골드 ' + fmtN(s.gold) + '</p>';
  h += '<div class="bcbtns"><button class="btn" data-bcclose>닫기</button><button class="btn gold' + (poor ? ' poor' : '') + '" data-bcagain="' + n + '"' + (poor ? ' disabled aria-disabled="true"' : '') + '><b>다시 뽑기</b><small>' + (poor ? '골드가 모자라다, ' : '') + fmtN(cost) + '골드</small></button></div>';
  return h;
}
// ── 연출 ──
// 한 자루: 저녁 빛으로 어두워지고 → 손이 자루를 쥐고 땅이 떨리고 → 틈에서 빛이 샌다 (빛깔이 결과. 흰빛에서 보랏빛 · 금빛으로 오를 수 있다 — 결과가 정말 그만큼일 때만)
//   → 칼이 빠져나와 카드가 된다. 부적은 칼 대신 종이 한 장이 팔랑이며 나온다. 누르면 바로 카드. 움직임 줄이기면 바로 카드 (흔들림 · 번쩍임 없음)
// 열 자루: 칼이 0.25초마다 한 자루씩 빛을 끌며 솟고 → 열 장의 카드 (가장 좋은 것에 테). 누르면 바로 카드
function plan(k) {      // 빛이 오르는 길 (결과보다 높은 빛은 절대 보이지 않는다)
  var r = Math.random();
  if (k === 'leg') return r < 0.4 ? ['w', 'v', 'g'] : r < 0.8 ? ['v', 'g'] : ['g'];
  if (k === 'uq') return r < 0.5 ? ['w', 'v'] : ['v'];
  return ['w'];
}
DS.bladesPlan = plan;      // 시험용
function kOf() { var app = document.getElementById('app') || document.body, r = app.getBoundingClientRect(), land = r.width > r.height; return Math.max(3, Math.min(8, Math.floor(Math.min(r.width - 32, r.height * (land ? 0.62 : 0.44)) / 48))); }
function show(res, parent, ov) {
  var many = res.list.length > 1, cm = calm(), k1 = res.list[0].k, timers = [], done = false, born = performance.now(), sel = many ? bestOf(res.list) : 0;
  var stg = many ? null : plan(k1), kk = kOf();
  var html = '<div class="bldc ' + (many ? 'n10' : 'n1 r-' + k1) + (cm ? ' calm' : '') + '" style="--k:' + kk + '"><div class="bcsky" aria-hidden="true"></div><div class="bcview"><div class="bcstage" aria-hidden="true">' +
    '<img class="bcmound" alt="" src="' + moundSrc(true) + '"><i class="bccrack"></i><i class="bcpillar"></i>' +
    (many ? '<div class="bcfly"></div>' : '<div class="bcslot"><img class="bcblade" alt="" src="' + bladeSrc(k1) + '"></div><img class="bchand" alt="" src="' + handSrc() + '">' + (k1 === 'prot' ? '<img class="bccharm" alt="" src="' + charmSrc() + '">' : '')) +
    '</div>' + (many ? '<div class="bcrow" aria-hidden="true">' + res.list.map(function (r, i) { return '<i class="k-' + r.k + '" data-bri="' + i + '"></i>'; }).join('') + '</div>' : '') + '</div>' +
    '<i class="bcflash" aria-hidden="true"></i><p class="bctap">누르면 넘긴다</p><div class="bcres" hidden></div></div>';
  if (!ov || !ov.isConnected) { ov = U.overlay(html, 'bldov modal'); }
  else { ov.querySelector('.sheet').innerHTML = html; }
  var root = ov.querySelector('.bldc'), stage = ov.querySelector('.bcstage'), resEl = ov.querySelector('.bcres');
  ov._bld = { res: res };
  function later(f, ms) { timers.push(setTimeout(function () { if (ov.isConnected && !done) f(); }, ms)); }
  function ph(c) { root.classList.add(c); }
  function lit(c) { root.style.setProperty('--bc', LIT[c]); root.classList.remove('lw', 'lv', 'lg'); root.classList.add('l' + c); }
  function flash(strong) { if (cm) return; var f = ov.querySelector('.bcflash'); f.classList.remove('on', 'big'); void f.offsetWidth; f.classList.add('on'); if (strong) f.classList.add('big'); }
  function reveal() {
    if (done) return; done = true; timers.forEach(clearTimeout); timers = [];
    root.classList.add('done', 'reach', 'grip', 'glow', 'pull', 'free'); root.classList.remove('shake');
    var best = many ? res.list[bestOf(res.list)].k : k1;
    lit(litOf(best)); if (best === 'leg') root.classList.add('pil');
    ov.querySelectorAll('.bcrow i').forEach(function (e) { e.classList.add('on'); });
    resEl.innerHTML = resHtml(res, sel); resEl.hidden = false; if (U.hydrate) U.hydrate(resEl);
    var rr = root.getBoundingClientRect(); root.style.setProperty('--k', Math.max(2, Math.floor(kOf() * (rr.width > rr.height ? 1 : many ? 0.42 : 0.62))));
    snd(best === 'leg' ? 'legend' : best === 'uq' ? 'rare' : best === 'prot' ? 'ward' : 'star');
    if (best === 'leg') { duck(8, 2200); if (!cm && U.haptic) try { U.haptic([40, 60, 90]); } catch (x) {} }
    var ag = ov.querySelector('[data-bcagain]'); if (ag && !ag.disabled) { ag.disabled = true; setTimeout(function () { if (ag.isConnected && G.save.gold >= T().price * res.list.length) ag.disabled = false; }, cm ? 0 : 450); }
  }
  ov._bld.reveal = reveal;
  if (cm) { reveal(); }
  else if (!many) {
    ph('in'); snd('swoosh');
    later(function () { ph('reach'); }, 250);
    later(function () { ph('grip'); ph('shake'); snd('heart'); }, 760);
    var t = 900;
    stg.forEach(function (c, i) {
      later(function () { ph('glow'); lit(c); snd(i === 0 ? (c === 'g' ? 'swell' : 'ready') : c === 'g' ? 'swell' : 'magic'); if (i) flash(false); if (c === 'g') ph('pil'); }, t + i * 450);
    });
    t += stg.length * 450 + 150;
    if (k1 === 'prot') {
      later(function () { ph('tug'); snd('quakeHit'); }, t);
      later(function () { root.classList.remove('shake'); ph('charm'); snd('flip'); setTimeout(function () { snd('wind'); }, 120); }, t + 350);
      later(reveal, t + 1250);
    } else {
      later(function () { ph('pull'); snd(k1 === 'leg' ? 'sword' : 'slash'); }, t);
      later(function () { root.classList.remove('shake'); ph('free'); flash(k1 === 'leg'); if (k1 === 'leg') duck(6, 1400); }, t + 380);
      later(reveal, t + 900);
    }
  } else {
    ph('in'); ph('many'); snd('swoosh');
    var fly = ov.querySelector('.bcfly'), spots = [[13, 22], [19, 10], [34, 20], [42, 26], [9, 33], [25, 24], [30, 30], [16, 28], [38, 24], [22, 30]];
    res.list.forEach(function (r, i) {
      later(function () {
        var sp = spots[i % spots.length], e = document.createElement('img'); e.className = 'bcfb k-' + r.k; e.alt = ''; e.src = bladeSrc(r.k);
        e.style.left = 'calc(' + (sp[0] - 3) + 'px * var(--k))'; e.style.top = 'calc(' + sp[1] + 'px * var(--k))'; e.style.setProperty('--c', LIT[litOf(r.k)]);
        fly.appendChild(e); setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 900);
        var ch = ov.querySelector('.bcrow [data-bri="' + i + '"]'); if (ch) ch.classList.add('on');
        lit(litOf(r.k)); ph('glow');
        snd(r.k === 'leg' ? 'pullHi' : r.k === 'uq' ? 'star' : r.k === 'prot' ? 'flip' : 'slash');
        if (r.k === 'leg') { flash(true); root.classList.remove('jolt'); void root.offsetWidth; root.classList.add('jolt'); }
      }, 600 + i * 250);
    });
    later(reveal, 600 + res.list.length * 250 + 450);
  }
  ov.onclose = function () { done = true; timers.forEach(clearTimeout); if (parent && parent.isConnected && parent.draw) parent.draw(); };
  if (!ov._bldWired) {
    ov._bldWired = true;
    ov.addEventListener('click', function (e) {
      var B0 = ov._bld; if (!B0) return;
      if (e.target.closest('[data-bcclose]')) { snd('close'); ov.close(); return; }
      var ag = e.target.closest('[data-bcagain]'); if (ag) { if (ag.disabled) return; snd('tap'); pull(+ag.dataset.bcagain, parent, ov); return; }
      var c = e.target.closest('[data-bci]');
      if (c) { var i = +c.dataset.bci, det = ov.querySelector('.bcdet'); snd('tap'); ov.querySelectorAll('.bcc.on').forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); if (det) { det.innerHTML = detail(B0.res.list[i]); if (U.hydrate) U.hydrate(det); } return; }
      if (!ov.querySelector('.bldc.done') && performance.now() - (ov._bldBorn || 0) > 300 && B0.reveal) { snd('tap'); B0.reveal(); }
    });
  }
  ov._bldBorn = born;
  return ov;
}
DS.bladesShow = show;      // 시험용: DS.bladesShow({ list: [...] })
DS.bladesSkip = function () { var ov = document.querySelector('.ov.bldov'); if (ov && ov._bld && ov._bld.reveal) ov._bld.reveal(); };      // 시험용 · 누른 것과 같다
})();
