// 전민 戰民, 열 가문의 시대 — 2.6.0 「싸움 도중의 한마디」: 보스의 체력이 문턱을 지날 때 보스와 맹주가 머리 위 말풍선으로 한 줄씩 주고받는다 (글은 story2.js DS.BANTER_TXT · 경전 §14)
// 규칙은 바꾸지 않는다 — mission.js 처럼 싸움의 사건(sim.emit)을 몰래 듣기만 하고, 말풍선은 전투 대사와 같은 것(view.bark)을 쓴다. 창을 띄우지 않고 입력을 막지 않는다. 저장 칸도 없다.
//   뜨는 곳: 시나리오 싸움(DS.startScenario)의 첫 대뿐. 갱도(sc.pit) · 다음 세대의 장(sc.gen — 그 장의 도입은 다른 글이다) · 들판 · 연무장 · 무술대회 · 온라인에는 없다
//     (연무장 · 온라인의 싸움은 DS.G.sim / DS.G.scn 을 쓰지 않는다). 설정 「전투 대사」(opt.bark)를 끄면 같이 꺼진다.
//   때: 목표 보스(u.obj)의 체력이 DS.BANTER_TXT.at 의 문턱(7할 · 3할) 아래로 처음 내려갈 때 한 번씩. 한 번에 두 문턱을 넘으면 낮은 쪽 하나만. 숨이 넘어가는 한 방에는 말하지 않는다(마지막 한마디가 먼저).
//     보스 없는 판(17번)은 n번째 습격이 올 때 맹주가 한마디.
//   죽음 장면 · 붉은 칸 예고 · 30번 마지막 싸움의 막 넘김 중에는 미뤘다가, 5초 안에 틈이 안 나면 버린다.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
DS.BANTER = { gap: 1.7, life: 2.6, hold: 5 };      // 보스의 말 뒤 맹주가 대꾸하기까지(초) · 말풍선이 떠 있는 시간(초) · 미루다 버리기까지(초)
function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
// 이 싸움에 한마디가 있는가 (순수): sim 은 시나리오 싸움, sc 는 그 시나리오
DS.banterOk = function (sim, sc) {
  var T = DS.BANTER_TXT; if (!T || !sim || !sc || sim.mode !== 'scn' || sc.pit || sc.gen || sc.stand) return false;
  return !!((sc.boss && T.boss) || (T.wave && own(T.wave, sc.id)));
};
DS.banterArm = function (sim, sc) { return { id: sc.id, said: {}, q: [], log: [] }; };
// 몰래 듣기 (순수): 사건 하나를 보고 할 말을 줄(q)에 세운다 — { who: 'boss' | 'hero', id: 유닛, text, dt: 지금부터 몇 초 뒤 }
DS.banterSee = function (B, sim, e) {
  var T = DS.BANTER_TXT; if (!B || !T || !e) return;
  if (e.t === 'hit') {
    var u = sim.byId[e.id]; if (!u || u.side !== 'enemy' || u.role !== 'boss' || !u.obj || u.fake || !(u.hp > 0) || !(u.mhp > 0)) return;
    var L = T.boss && own(T.boss, u.type) ? T.boss[u.type] : null; if (!L) return;
    var r = u.hp / u.mhp, at = T.at || [], pick = -1;
    for (var i = 0; i < at.length && i < L.length; i++) if (r <= at[i] && !B.said[u.type + ':' + i]) { B.said[u.type + ':' + i] = 1; pick = i; }      // 넘은 문턱은 모두 지나간 것으로, 말은 가장 낮은 것 하나
    if (pick < 0 || !L[pick]) return;
    if (L[pick][0]) B.q.push({ who: 'boss', id: u.id, key: u.type, i: pick, text: String(L[pick][0]), dt: 0 });
    if (L[pick][1]) B.q.push({ who: 'hero', id: sim.heroId, key: u.type, i: pick, text: String(L[pick][1]), dt: L[pick][0] ? DS.BANTER.gap : 0 });
  } else if (e.t === 'wave') {
    var W = T.wave && own(T.wave, B.id) ? T.wave[B.id] : null, t = W && own(W, e.n) ? W[e.n] : '';
    if (t && !B.said['w' + e.n]) { B.said['w' + e.n] = 1; B.q.push({ who: 'hero', id: sim.heroId, key: 'wave', i: e.n, text: String(t), dt: 1.2 }); }
  }
};

// ── 화면 (브라우저에서만) ──
if (typeof document === 'undefined') return;
var G = DS.G, cur = null;      // 지금 싸움의 것 { sim, B }
DS.banterCur = function () { return cur ? cur.B : null; };
function on() { var sv = G && G.save; return !!(sv && !(sv.opt && sv.opt.bark === false)); }
function busy() {      // 지금은 말풍선을 띄울 때가 아니다
  var v = G.view; if (!v || !v.bark) return true;
  if (v.dz || (v.casting && v.casting()) || G.ending || (DS.finBusy && DS.finBusy())) return true;
  return !!document.querySelector('.cine');
}
function start(sim, sc) {
  var B = DS.banterArm(sim, sc), me = cur = { sim: sim, B: B }, e0 = sim.emit;
  sim.emit = function (e) {      // 이 싸움의 사건만 몰래 듣는다 (엔진은 그대로)
    try { if (cur === me) { var n = B.q.length; DS.banterSee(B, sim, e); for (var i = n; i < B.q.length; i++) B.q[i].due = performance.now() + B.q[i].dt * 1000; } } catch (x) {}
    return e0.call(this, e);
  };
}
setInterval(function () {
  try {
    var sim = G && G.sim, sc = G && G.scn;
    if (!sc || !sim || sim.result) { if (!sc || !sim) cur = null; return; }
    if (cur && cur.sim !== sim) cur = null;      // 지난 싸움의 것
    if (!cur && on() && DS.banterOk(sim, sc)) start(sim, sc);
    if (!cur || !cur.B.q.length) return;
    var B = cur.B, now = performance.now(), it = B.q[0];
    if (now < it.due) return;
    var u = sim.byId[it.id], dead = !u || u.dead || !(u.hp > 0);
    if (dead || !on() || now - it.due > DS.BANTER.hold * 1000) { B.q.shift(); return; }      // 말할 사람이 없다 · 너무 늦었다
    if (busy() || !G.view.onScreen(u.x, u.y)) return;
    B.q.shift();
    G.view.bark(u.id, it.text, DS.BANTER.life);
    B.log.push({ who: it.who, key: it.key, i: it.i, text: it.text });
  } catch (x) { if (DS.DEBUG) throw x; }
}, 200);
})();
