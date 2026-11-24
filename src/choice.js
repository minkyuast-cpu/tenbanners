// 전민 戰民, 열 가문의 시대 — 2.5.0 「판의 선택지」: 3 · 13 · 24번 맺음 끝에 두 갈래 (글은 story2.js DS.CHOICE_TXT · 경전 §11)
//   고른 것은 대마다 따로 (DS.cycKey — 다음 세대의 장 · 대가 끊겨 다시 걸을 때 처음부터 다시 고른다). 뒷글은 줄의 ch 로 갈린다 (story.js DS.chOk): 21 · 29 · 30번, 엔딩, 막간 「문 앞의 불」, 다음 세대의 장 29번 도입.
//   아직 안 골랐으면('') 뒷글은 처음 쓴 그대로(바르간은 고갯마루 안내원 · 30번은 「마루」를 읽는다) — 이미 그 판을 지난 옛 저장은 묻지 않고 그 길로 읽힌다.
//   보상은 작고 값이 비슷하다 (DS.CHOICE). 고를 때 한 번, 그 대에 한 번.
//   묻는 때: 그 판을 처음 깬 맺음 끝 (다음 세대의 장에서는 그 장에서 처음 깰 때 — 맺음 대신 묻는 줄 하나). 자동 시험(DS.G.quiet)과 봇(tools/bot.js → DS.chAuto)은 묻지 않고 a 를 고른다.
// 저장: save.chs = { k: 이번 대의 열쇠, 3: 'a' | 'b', 13: …, 24: … } (DS.chFix — save.js 의 fixSave 가 부른다)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
DS.CHOICE_IDS = [3, 13, 24];
//  tk 영웅 모집권 · gold 골드 · ember 맹주 병과의 〈불목〉 방어구 · uw 맹주 병과의 유니크 무기 (그 판 레벨)
DS.CHOICE = { 3: { a: { tk: 1 }, b: { ember: 1 } }, 13: { a: { tk: 1 }, b: { gold: 3000 } }, 24: { a: { uw: 1 }, b: { tk: 1 } } };
function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function key(s) { return DS.cycKey ? DS.cycKey(s) : 'g1r0'; }
DS.chPick = function (s, n) { var c = s && s.chs; return c && typeof c === 'object' && c.k === key(s) && (c[n] === 'a' || c[n] === 'b') ? c[n] : ''; };
DS.chFix = function (s) {
  if (!s || typeof s !== 'object' || s.chs == null) return s;
  var c = s.chs; if (typeof c !== 'object' || Array.isArray(c) || typeof c.k !== 'string') { delete s.chs; return s; }
  var o = { k: c.k.slice(0, 16) }; DS.CHOICE_IDS.forEach(function (n) { if (c[n] === 'a' || c[n] === 'b') o[n] = c[n]; });
  s.chs = o; return s;
};
function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function heroCls(s) { var h = s && s.chars && s.chars[s.hero]; return h ? h.cls : 'inf'; }
function emberId(s) { var G0 = DS.CLS_GEAR[heroCls(s)] || DS.CLS_GEAR.inf; return G0.a[0] + '.A~ember'; }
DS.chRwText = function (n, k) {
  var r = DS.CHOICE[n] && DS.CHOICE[n][k]; if (!r) return '';
  if (r.tk) return '영웅 모집권 ' + r.tk + '장';
  if (r.gold) return fmt(r.gold) + '골드';
  if (r.ember) { var eg = DS.gear('heavy.A~ember'), ax = eg && (eg.affix || []).filter(function (x) { return x.key === 'ember'; })[0]; return '〈불목〉 방어구 한 점, ' + (ax ? ax.desc : '용암에서 화상을 입지 않는다'); }
  if (r.uw) return '맹주 병과의 유니크 무기 한 점';
  return '';
};
// 보상을 넣는다. 돌려주는 것: { txt: 받은 것, drop: 장비면 결과 창 줄 }
function give(s, n, k, sc) {
  var r = DS.CHOICE[n][k], out = { txt: DS.chRwText(n, k) };
  if (r.tk) s.tickets = (s.tickets || 0) + r.tk;
  if (r.gold) s.gold = (s.gold || 0) + r.gold;
  if (r.ember || r.uw) {
    var id = r.ember ? emberId(s) : null;
    if (r.uw) { var Gw = DS.CLS_GEAR[heroCls(s)] || DS.CLS_GEAR.inf; try { id = DS.rollGear({ L: (sc && sc.L) || 30, cat: Gw.w[0], grade: 4, boss: true, save: s }); } catch (x) { id = null; } if (!id || !DS.gear(id)) id = Gw.w[0] + '.A~keen5'; }
    var d = DS.lootPut ? DS.lootPut(s, id, { at: (sc && sc.name) || '' }) : null;
    if (!DS.lootPut) s.gear[id] = (s.gear[id] || 0) + 1;
    var g = DS.gear(id); out.id = id; out.drop = d;
    if (g) out.txt = g.name + (d && d.sold ? ' (가방이 가득해 ' + fmt(d.sold) + '골드에 팔았다)' : '');
  }
  return out;
}
// 고른다 (순수 — 화면 · 봇 · 시험이 같은 것). 이 대에 이미 골랐으면 null
DS.chSet = function (s, n, k, sc) {
  if (!s || DS.CHOICE_IDS.indexOf(+n) < 0 || (k !== 'a' && k !== 'b') || DS.chPick(s, n)) return null;
  var c = s.chs; if (!c || typeof c !== 'object' || c.k !== key(s)) c = s.chs = { k: key(s) };
  c[n] = k;
  return give(s, n, k, sc || (DS.scn ? DS.scn(n) : null));
};
// 지금 물어야 하는가 (결과 창 앞): 그 판을 이 대에 처음 깼고 아직 안 골랐다
DS.chDue = function (s, sc, out) {
  if (!s || !sc || sc.pit || DS.CHOICE_IDS.indexOf(sc.id) < 0 || DS.chPick(s, sc.id)) return 0;
  if (sc.gen) return DS.egActive && DS.egActive(s) && s.eg.gen === sc.gen ? sc.id : 0;
  return out && out.first ? sc.id : 0;
};
DS.chAuto = function (s, sc, out) { var n = DS.chDue(s, sc, out || { first: true }); return n ? DS.chSet(s, n, 'a', sc) : null; };      // 봇: 묻지 않고 a
// 고른 뒤의 줄 (+ 받은 것 메모)
DS.chAfter = function (n, k, got) {
  var T = DS.CHOICE_TXT[n], l = (T && T[k] && T[k].after || []).slice();
  if (got && got.txt) l.push(DS.say('memo', String(DS.CHOICE_TXT.got).replace('{r}', got.txt)));
  return l;
};
// 다음 세대의 장 29번 도입: 이 장에서 고른 갈림의 뒷모습 (지난 대의 것은 이미 장부에)
DS.chEgLines = function (s) {
  var out = []; DS.CHOICE_IDS.forEach(function (n) { var k = DS.chPick(s, n), T = DS.CHOICE_TXT[n]; if (k && T && T[k] && T[k].eg) out.push(T[k].eg); });
  return out;
};
var es0 = DS.egScn;
if (es0) DS.egScn = function (n, g, save) {
  var sc = es0.apply(this, arguments);
  if (sc && save && n === 29) { var l = []; try { l = DS.chEgLines(save); } catch (x) { l = []; } if (l.length) sc.intro = (sc.intro || []).concat(l); }
  return sc;
};

// ── 화면 (브라우저에서만) ──
if (typeof document === 'undefined' || !DS.ui) return;
var U = DS.ui, G = DS.G, esc = U.esc;
DS.chUi = false;      // 시험이 켜면 자동 시험(quiet)에서도 창을 띄운다
DS.chOpen = function (n, sc, cb) {
  var sv = G.save, T = DS.CHOICE_TXT[n], egc = !!(sc && sc.gen);
  if (!T || !sv) { if (cb) cb(); return null; }
  function after(k) {
    var got = DS.chSet(sv, n, k, sc); U.persist();
    if (!got) { if (cb) cb(); return; }
    var l = DS.chAfter(n, k, got); try { l = DS.storyFit ? DS.storyFit(l, sv) : l; } catch (x) {}
    if (G.quiet && !DS.chUi) { U.toast(String(DS.CHOICE_TXT.got).replace('{r}', got.txt), 2400); if (cb) cb(); return; }
    U.story(l, cb, T.who);
  }
  if (G.quiet && !DS.chUi) { after('a'); return null; }
  var btn = function (k) { return '<button class="chb" data-ch="' + k + '"><b>' + esc(T[k].l) + '</b>' + (T[k].sub ? '<i>' + esc(T[k].sub) + '</i>' : '') + '<small>보상: ' + esc(DS.chRwText(n, k)) + '</small></button>'; };
  var o = U.overlay('<div class="story-box talk chbox"><p class="who">' + esc(T.who) + '</p><p class="line">' + esc(egc ? T.qg : T.q) + '</p><div class="chs">' + btn('a') + btn('b') + '</div><p class="chn">고르면 뒷이야기와 보상이 달라진다. 이번 대에 한 번.</p></div>', 'modal chov');
  var picked = false;
  o.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ch]'); if (!b || picked || performance.now() - o.born < 300) return;
    picked = true; U.A('ok'); o.close(); after(b.dataset.ch);
  });
  return o;
};
var sr0 = DS.showResult;
if (sr0) DS.showResult = function (s, out, cb) {
  var self = this, args = arguments, n = 0; try { n = DS.chDue(G.save, s, out); } catch (x) { n = 0; }
  if (!n) return sr0.apply(self, args);
  DS.chOpen(n, s, function () { sr0.apply(self, args); });
  return null;
};
})();
