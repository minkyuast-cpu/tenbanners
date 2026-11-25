// 전민 戰民, 열 가문의 시대 — 이야기 적용기 (2.4.0 「삶은 후계로 계승된다」 — docs/STORY_BIBLE_2.4.md)
// 이야기 글(src/story2.js)이 쌓은 DS.STORY_PATCH 를 lore 다음에 덮어쓴다. 규칙은 바꾸지 않는다.
//
// 패치 모양:  DS.STORY_PATCH = (DS.STORY_PATCH || []).concat([{ scn: { 3: { intro: [...], outro: [...] } }, lore: { 'boss.grok.say': '…' } }]);
//   scn  — 시나리오 번호 → { intro, outro, outroAlt }. 줄은 world.js 와 같다: 문자열(지문) 또는 { w: 화자, t: 글 }.
//   lore — DS.LORE 안의 경로 → 값. 'prologue', 'boss.grok.say', 'cast.inf.join', 'fuse.battle', 'pit.3', 'campAll.c01.lines' …
//          · 점으로 내려간다. 배열 안에서 숫자가 아닌 칸은 그 배열에서 id 가 같은 것을 찾는다 ('campAll.c01').
//          · 경로 끝에 + 를 붙이면 그 배열 뒤에 덧붙인다 ('campAll+': [새 막간…]). 막간의 need(sv) 함수도 그대로 쓴다.
//          · 없는 경로는 아무 말 없이 건너뛴다(새 칸을 만들지 않는다). 무엇을 했는지는 DS.STORY_LOG 에 남는다.
//   줄의 화자: w 가 say 키('cle' · 'hero' · 'memo' · 'far' · 'dawn' · 'flag' · 보스 키)이거나 s 를 주면 DS.say 로 바꿔 초상이 붙는다.
//          w 가 「승려 달래」처럼 화면 이름이어도 그 사람의 초상을 붙인다. 그 밖의 화자는 쓴 그대로 둔다.
//   줄의 갈림(r8): { w, t, heir, gone, of } — 화자(또는 of 에 적은 사람)가 숨을 거두어 후계가 이었으면 heir 글, 방금 쓰러져 빈자리면 gone 글. 빈 글('')이면 그 줄을 건너뛴다.
//          w 없이 { t, of, heir, gone } 이면 지문이다. 화자 칸은 후계가 이었을 때 지금 그 사람의 이름으로 바뀐다(game.js story()).
//   엔딩: 'ending' 배열에 '{fallen}' 한 줄을 넣으면 그 자리에 이번 판에 쓰러진 이의 수를 읽은 줄이 들어간다(글은 'endingFallen' — some(n, 추모 기록)).
//   4.0: 줄에 { no, ab } — 그 집 사람이 이 판에 없을 때(㉑ 대장이 그 집 병과)의 글과, 지문이 기대는 사람 키. DS.storyFit 이 시나리오·맺음·막간 줄을 화면에 넘기기 전에 맞춘다.
//   2.4.0: 가문의 목소리는 물려받는다 — 화자가 열 가문 배역(c)인데 그 가문이 아직 닫혀 있거나, 맹주 자신의 가문이거나, 가주 자리가 비었으면
//          그 줄은 「선대 ○○」(삼백 년 전 그 집 가주)의 훈수로 뜬다. 글은 줄의 a (없으면 t 그대로, 빈 글이면 뺀다). 가문이 열려 있으면 지금 가주가 t 를 말한다. (DS.castAnc)
//          글 속의 {prev} 는 바로 앞 맹주의 이름 — 대를 이은 적이 없으면 그 줄은 뺀다.
//   2.6.0: 줄의 roll — 이름 낭독 (game.js story(): 이름이 한 사람씩 가운데에 뜨고 상자에 모인다). roll: 1 = 글이 「. 」로 이은 이름들(「…」 안이면 그 안), roll: [이름…] = 글 안의 그 이름들.
//          줄의 chat: 1 — 엔딩의 무대에서 글 끝의 「…」를 답장 말풍선으로 (stage.js). 도입(prologue)의 전장 메모 줄은 이야기에 뜨지 않고 코치 표시로 간다.
// 늦게 오는 패치가 앞의 것을 덮는다 (build.js 순서: story2 → story).
var DS = globalThis.DS = globalThis.DS || {};
// r51 (2.1.0) 대체 함수: 연맹의 이름(「펜드래곤 연맹」의 「펜드래곤」). 게임 쪽에 DS.allyName 이 아직 없을 때만 쓴다.
DS.allyName = DS.allyName || function (s) { return String(DS.houseName ? DS.houseName(s) : '').replace(/ 가문$/, ''); };
(function () {
'use strict';
var LOG = DS.STORY_LOG = { ok: [], skip: [], err: [] };

// ───────── r8: 그 사람이 지금도 그 사람인가 (영구 사망·후계와 고정 배역) ─────────
// k = 깃발을 든 열 사람의 병과 키 또는 'hero'(가주). 돌려주는 값: 0 = 본인이 살아 있다(또는 아직 합류 전) · { st: 1, nm } = 숨을 거두어 후계가 그 깃발을 들었다 · { st: 2 } = 방금 쓰러져 아직 빈자리다.
//   nm 은 화면 이름이다(지휘관 화면 이름 = 클래스명, 가주는 「이름 N세」) — 후계 의식의 「이제 ○○은 △△로 불린다」와 같은 이름. 가계도의 호·성이름은 쓰지 않는다(가주 집 아이가 다른 깃발을 맡아도 화자 칸이 가주와 겹치지 않게).
// 합일한 깃발 속의 목소리는, 묶일 때 그 사람이 본인이었으면 본인이다(묶일 때 후계였으면 그 병과의 7단 이름).
//   마스터가 쓰러져 후계가 이으면 그 깃발의 목소리는 그 한 사람이다: { st: 1, nm, one: 그 자리 id, c: 마스터 병과, head: 가주의 자리인가 } — 읽는 쪽(game.js story())이 한 몸에 한 목소리만 띄운다. 저장은 읽기만 한다.
// 4.0 (⑥-2 · ⑫-2): 깃발이 아니라 사람의 상태로. 열쇠(m.cast)를 쥔 부대원이 그 배역이다.
//   열쇠를 쥔 이가 1세 본인이면 0(본인이 말한다 — 무엇을 들었든), 그 집을 이은 「○○ N세」면 { st: 1, nm: 그 사람의 화면 이름 } (줄의 heir 글이 있으면 그 글),
//   열쇠를 쥔 이가 없으면(옛 저장에서 본인이 먼저 잠들었다) 그 집 깃발을 든 사람이 { st: 1, nm } 로 잇고, 든 사람도 없으면 { st: 2 } (gone 글, 없으면 건너뛴다).
//   아직 합류 전이면 0. 'hero' = 대장: 1세면 0, 아니면 { st: 1, nm: 「민규 2세」 }.
// r22: 아홉(또는 그 집 2대)이 대장의 후계가 되어 그 집이 맹주 가문이 되었으면, 그 배역의 목소리는 대장이다 — { st: 1, nm: 대장 화면 이름, c: 'hero', me: 1 }.
//   줄은 DS.storyFit 이 먼저 맞춘다(줄의 me 글 → 대장의 입 · 지문). 그 사람 본인이 살아 있으니 castOrig 는 거짓(「본인과 대장이 주고받는」 막간·7단 한마디는 닫힌다).
DS.castHero = function (s) {
  var hc = s && s.chars && s.chars[s.hero], P = s && s.lin && s.lin.P; if (!hc || hc.vac || !P) return '';
  var p = hc.pid && P[hc.pid]; return p && p.c === hc.id && p.st === 'live' && p.cast && DS.CAST_NAME && DS.CAST_NAME[p.cast] ? p.cast : '';
};
DS.castNow = function (s, k) {
  var P = s && s.lin && s.lin.P, hero = k === 'hero';
  if (!s || !P || !s.chars || !(hero || (DS.CAST_NAME && DS.CAST_NAME[k]))) return 0;
  if (!hero && DS.castHero(s) === k) { var mn = ''; try { mn = DS.charName(s.chars[s.hero], s); } catch (x) { mn = ''; } return { st: 1, nm: mn || s.name || '대장', c: 'hero', me: 1 }; }
  if (hero) {
    var hc = s.chars[s.hero]; if (!hc) return 0;
    if (hc.vac) return { st: 2 };
    var hp = hc.pid && P[hc.pid]; if (!hp || !(hp.gen > 1)) return 0;
    var hn = ''; try { hn = DS.charName(hc, s); } catch (x) { hn = ''; }
    return { st: 1, nm: hn };
  }
  if (DS.castAbsent(s, k)) return { st: 2, none: 1 };      // 4.0 ㉑: 대장이 이 집 병과로 섰다 — 이 집 사람은 이 판에 없다 (줄은 적용기가 먼저 걸러 no 글로)
  var h = null; (s.mercs || []).forEach(function (m) { if (m.cast === k) h = m; });
  if (h) { var q = h.pid && P[h.pid]; if (!q || !(q.gen > 1) || !q.hh) return 0; var tg = DS.castTag ? DS.castTag(h) : ''; return { st: 1, nm: (tg ? tg + ' ' : '') + (h.ttl || h.n || '') }; }      // ⑱ 그 집이 거둔 아이 — 「센주 가문 2대 달래」
  var C = DS.CLASSES[k], F = C && DS.FAMILY && DS.FAMILY[C.fam], flag = null, any = false;
  Object.keys(s.chars).forEach(function (id) { var c = s.chars[id]; if (c.cls === k) flag = c; else if (F && c.cls === F.master && !flag) flag = c; });
  for (var id in P) if (P[id].cast === k || (P[id].cls === k && P[id].k === 'c' && (P[id].gen || 1) === 1)) { any = true; break; }
  if (!flag && !any) return 0;      // 아직 합류 전
  if (!flag) return { st: 2 };
  if (flag.id === s.hero) {      // 주인공 자신의 병과는 배역이 아니다. r42: 맹주 가문이 그 집으로 옮겨 왔으면(그 집 사람이 대를 이었다) 그 배역의 목소리는 대장이다
    var seen = false; for (var q in P) if (P[q].cast === k) { seen = true; break; }
    if (!seen) return 0;
    var mn2 = ''; try { mn2 = DS.charName(flag, s); } catch (x) { mn2 = ''; } return { st: 1, nm: mn2 || s.name || '대장', c: 'hero', me: 1 };
  }
  var b = DS.bearer ? DS.bearer(s, flag) : null;
  return b ? { st: 1, nm: b.ttl || b.n || '' } : { st: 2 };
};
DS.castOrig = function (s, k) { return !DS.castNow(s, k); };
// ㉑ 옛 시대에서 데려온 대장이 아홉 집 병과로 섰으면, 그 집의 마지막 사람은 이 판에 오지 않는다(그 시나리오에서는 보병 바우가 대신 온다 — world.js DS.joinOf).
//   대장이 든 깃발이 곧 그 집 깃발이다(경전 §1 「기수 가문은 열 집 가운데 한 집의 깃발을 맡아 들었다」). 그 사람의 줄은 줄의 no 글로 바꾸거나(대장의 입·지문), heir 글을 대장이 말하거나, 뺀다.
DS.castAbsent = function (s, k) {
  if (!s || !s.chars || !DS.CAST_NAME || !DS.CAST_NAME[k]) return false;
  var hc = s.chars[s.hero]; if (!hc || hc.cls !== k) return false;
  if ((s.mercs || []).some(function (m) { return m.cast === k; })) return false;
  var P = (s.lin && s.lin.P) || {}; for (var id in P) if (P[id] && P[id].cast === k) return false;
  return true;
};      // 막간의 need 에 쓴다: 본인이 살아 있을 때만 여는 막간
// 2.4.0 가문의 목소리가 선대에게서 오는가: 그 가문이 아직 닫혀 있다(아무도 없다) · 맹주 자신의 가문이다 · 가주 자리가 비었다(잠든 가문도)
DS.castAnc = function (s, k) {
  if (!s || !s.chars || !DS.CAST_NAME || !DS.CAST_NAME[k]) return false;
  if (DS.castHero(s) === k) return false;      // 그 배역 본인이 맹주가 되었다 (옛 저장) — 맹주의 입으로 (meFit)
  var r = DS.castNow(s, k);
  if (!r) return !(s.mercs || []).some(function (m) { return m.cast === k; });
  return r.st === 2;
};
DS.ancName = function (k) { return '선대 ' + ((DS.CAST_NAME && DS.CAST_NAME[k]) || ''); };
// 바로 앞 맹주의 이름 ('' = 대를 이은 적이 없다). 가문 기록의 마지막 후계 줄에서 읽는다 (저장은 읽기만)
DS.storyPrev = function (s) {
  var lg = s && s.lin && s.lin.log, P = s && s.lin && s.lin.P; if (!lg || !P) return '';
  for (var i = lg.length - 1; i >= 0; i--) { var e = lg[i]; if (e && (e.t === 'heir' || e.t === 'lapse') && e.b && P[e.b]) { var n = ''; try { n = DS.linName(s, e.b); } catch (x) { n = ''; } if (n && n !== '누군가') return n; } }
  return '';
};
// 2.4.2 이번 대에 먼저 간 사람들 — 가문을 잇다 떠난 이(가문 기록의 후계 줄)가 먼저, 그다음 가주였던 이 · 이름난 이 (저장은 읽기만)
//   [{ n: 화면 이름, lw: 마지막 한마디('' 가능) }] · 열 가문의 시조 이름과 길에서 이름을 돌려준 이들은 뺀다(30번에서 따로 부른다)
var DEAD_SKIP = { '나루': 1, '마루': 1, '돌쇠': 1, '평원지기': 1, '벨마르': 1, '먼동': 1, '누군가': 1 };
DS.storyDead = function (s, max) {
  var out = [], seen = {}, lwOf = {}, P = s && s.lin && s.lin.P || {}, lg = s && s.lin && s.lin.log || [], fl = (s && s.fallen) || [];
  Object.keys(DS.CAST_NAME || {}).forEach(function (k) { seen[DS.CAST_NAME[k]] = 1; });
  fl.forEach(function (f) { if (f && f.n && f.lw) lwOf[f.n] = String(f.lw); });
  function add(n, w) { n = String(n || '').trim(); if (!n || seen[n] || DEAD_SKIP[n] || n === (s && s.name)) return; seen[n] = 1; out.push({ n: n, lw: lwOf[n] || '', w: w }); }
  for (var i = lg.length - 1; i >= 0; i--) { var e = lg[i]; if (e && (e.t === 'heir' || e.t === 'lapse') && e.b && P[e.b]) { try { add(DS.linName(s, e.b), 3); } catch (x) {} } }
  for (var j = fl.length - 1; j >= 0; j--) { var f = fl[j]; if (f && f.n) add(f.n, f.f || f.pid ? 2 : DS.fallenNote && DS.fallenNote(f) ? 1 : 0); }
  out = out.filter(function (d) { return d.w > 0; });
  out.sort(function (a, b) { return b.w - a.w; });      // 같은 무게 안에서는 최근에 간 이가 앞 (sort 는 안정)
  return out.slice(0, max || 8);
};
function strHash(t) { var h = 7; t = String(t); for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h; }
if (!DS.LORE) return;
var own = function (o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); };

// ───────── 엔딩의 용병 줄 (lore.js 의 게터와 같은 셈 — 글만 바꿔 끼울 수 있게 칸을 둔다) ─────────
var FALLEN_TOKEN = '{fallen}', FALLEN_OLD = '쓰러진 이들의 이름은 깃대에 새겼다. 한 줄도 건너뛰지 않았다.';      // 글은 story2.js 의 'endingFallen.*' 이 덮는다
Object.defineProperty(DS.LORE, 'endingFallen', { writable: true, configurable: true, enumerable: false, value: {      // 글 점검(v_text)이 엔딩 줄과 겹친다고 세지 않게 숨긴 칸
  base: FALLEN_OLD,
  none: '한 사람도 잃지 않았다. 모두 같이 돌아왔다.',
  some: function (n) { return '쓰러진 이 ' + n + '명의 이름을 깃대에 새겼다. 한 줄도 건너뛰지 않았다.'; }
} });

// ───────── 줄 다듬기 ─────────
var REV = {};       // 화면 이름 → 초상 키 (「승려 달래」 → cle, 「불목 거인 바르간」 → bargan)
Object.keys(DS.CAST_NAME || {}).forEach(function (k) { if (DS.CLASSES[k]) REV[DS.CLASSES[k].name + ' ' + DS.CAST_NAME[k]] = k; });
Object.keys(DS.BOSSES || {}).forEach(function (k) { if (DS.BOSSES[k].name) REV[DS.BOSSES[k].name] = k; });
var LINE = Object.getPrototypeOf(DS.say('memo', ''));
function isKey(k) { if (typeof k !== 'string' || !k) return false; var l = DS.say(k, ''); return l.w !== k || !!l.c; }
// r8: 화자의 사망·후계에 따라 갈리는 글 — heir(자리를 이은 이가 있을 때) · gone(방금 쓰러져 빈자리일 때) · of(그 줄이 기대는 사람 키). 읽는 쪽은 game.js 의 story()
function keep(o, x) { ['heir', 'gone', 'of', 'no', 'ab', 'me', 'need', 'er', 'a', 'y', 'dz', 'ch', 'roll', 'chat'].forEach(function (k) { if (own(x, k)) o[k] = x[k]; }); return o; }
function toLine(x) {
  if (x == null || typeof x !== 'object' || typeof x.t !== 'string' || 'lines' in x) return x;
  if (x.s && isKey(x.s)) return keep(DS.say(x.s, x.t), x);
  if (!x.c && isKey(x.w)) return keep(DS.say(x.w, x.t), x);
  var o = Object.create(LINE); if (x.w) o.w = x.w; if (x.c || REV[x.w]) o.c = x.c || REV[x.w]; o.t = x.t;      // world.js 의 줄과 같은 꼴 (글자로 바꾸면 「화자: 글」)
  return keep(o, x);
}
function norm(v) {
  if (Array.isArray(v)) return v.map(function (x) {
    var d = x && typeof x === 'object' && Object.getOwnPropertyDescriptor(x, 'lines');
    if (d) { if ('value' in d && Array.isArray(d.value)) x.lines = norm(d.value); return x; }      // 막간: 객체째 두고 줄만 다듬는다 (lines 게터는 건드리지 않는다)
    return toLine(x);
  });
  return toLine(v);
}

// ───────── 경로 ─────────
function step(o, k) {
  if (o == null) return { miss: true };
  if (Array.isArray(o) && !/^\d+$/.test(k)) { for (var i = 0; i < o.length; i++) if (o[i] && o[i].id === k) return { key: String(i) }; return { miss: true }; }
  if (!(k in Object(o))) return { miss: true };
  return { key: k };
}
// 바꿀 수 없는 게터(lore.js 가 defineProperty 로 건 것)는 그 칸을 가진 객체를 통째로 복제해 갈아 끼운다
function clone(o) {
  var c = Array.isArray(o) ? [] : Object.create(Object.getPrototypeOf(o));
  Object.getOwnPropertyNames(o).forEach(function (k) { if (Array.isArray(o) && k === 'length') return; var d = Object.getOwnPropertyDescriptor(o, k); d.configurable = true; if ('value' in d) d.writable = true; Object.defineProperty(c, k, d); });
  return c;
}
function put(chain, keys, val) {      // chain[i] 의 keys[i] 칸에 chain[i+1] 이 있다. 마지막 칸에 val
  var n = keys.length, o = chain[n - 1], k = keys[n - 1], d = Object.getOwnPropertyDescriptor(o, k);
  if (d && 'value' in d && d.writable) {
    if (Array.isArray(d.value) && Array.isArray(val) && n > 1) { d.value.length = 0; Array.prototype.push.apply(d.value, val); }     // 배열은 제자리에서 (다른 코드가 쥐고 있는 참조를 살린다)
    else o[k] = val;
    return true;
  }
  if (d && d.set) { o[k] = val; return true; }
  if (d && d.configurable) { Object.defineProperty(o, k, { value: val, writable: true, enumerable: true, configurable: true }); return true; }
  if (n < 2) return false;
  var c = clone(o); Object.defineProperty(c, k, { value: val, writable: true, enumerable: true, configurable: true });
  return put(chain, keys.slice(0, n - 1), c);
}
function setLore(path, val) {
  var add = /\+$/.test(path), p = path.replace(/\+$/, ''), segs = p.split('.'), chain = [DS], keys = ['LORE'], cur = DS.LORE;
  for (var i = 0; i < segs.length; i++) {
    var s = step(cur, segs[i]); if (s.miss) { LOG.skip.push(path); return; }
    chain.push(cur); keys.push(s.key); cur = cur[s.key];
  }
  // 갱도지기의 한마디는 층마다 다르다: 배열(층 1~10)을 주면 지금 층을 고르는 게터로
  if (/^boss\.keeper\.(say|last)$/.test(p) && Array.isArray(val)) {
    var arr = val.slice(), base = typeof cur === 'string' ? cur : '';
    val = null; put(chain, keys, base);
    var kp = DS.LORE.boss.keeper, kk = segs[2];
    Object.defineProperty(kp, kk, { enumerable: true, configurable: true, get: function () { var f = DS.G && DS.G.scn && DS.G.scn.pit; return (f && arr[(f - 1) % arr.length]) || base; } });
    LOG.ok.push(path); return;
  }
  if (add) {
    if (!Array.isArray(cur)) { LOG.skip.push(path); return; }
    var dd = Object.getOwnPropertyDescriptor(chain[chain.length - 1], keys[keys.length - 1]);
    if (dd && 'value' in dd) Array.prototype.push.apply(cur, norm([].concat(val)));      // 제자리에 덧붙인다 (CAMP 같은 속 배열을 살린다)
    else if (!put(chain, keys, cur.concat(norm([].concat(val))))) { LOG.skip.push(path); return; }      // 게터가 내준 사본이면 새 배열로
    LOG.ok.push(path); return;
  }
  if (put(chain, keys, norm(val))) LOG.ok.push(path); else LOG.skip.push(path);
}

// ───────── 시나리오 ─────────
function setScn(id, o) {
  var s = DS.scn && DS.scn(+id); if (!s || !o) { LOG.skip.push('scn.' + id); return; }
  if (o.intro) { s.intro = norm(o.intro); LOG.ok.push('scn.' + id + '.intro'); }
  if (o.outroAlt && own(s, 'outroAlt')) { s.outroAlt = norm(o.outroAlt); LOG.ok.push('scn.' + id + '.outroAlt'); }
  if (o.outro) {
    var d = Object.getOwnPropertyDescriptor(s, 'outro'), base = norm(o.outro);
    if (d && d.get && own(s, 'outroAlt')) {     // 5번: 주인공의 병과에 따라 맺음이 갈린다 (world.js 의 셈 그대로)
      Object.defineProperty(s, 'outro', { enumerable: true, configurable: true, get: function () {
        var sv = DS.G && DS.G.save, h = sv && sv.chars && sv.chars[sv.hero], C = h && DS.CLASSES[h.cls], J = DS.CLASSES[s.reward.join];
        return C && J && s.reward.alt && (h.cls === s.reward.join || (C.master && C.fam === J.fam)) ? s.outroAlt : base;
      } });
    } else if (d && !('value' in d)) Object.defineProperty(s, 'outro', { value: base, writable: true, enumerable: true, configurable: true });
    else s.outro = base;
    LOG.ok.push('scn.' + id + '.outro');
  }
}

var endingTouched = false;
(DS.STORY_PATCH || []).forEach(function (P, pi) {
  if (!P) return;
  Object.keys(P.scn || {}).forEach(function (id) { try { setScn(id, P.scn[id]); } catch (e) { LOG.err.push('scn.' + id + ': ' + e.message); } });
  Object.keys(P.lore || {}).forEach(function (path) {
    try { if (/^ending\+?$/.test(path)) endingTouched = true; setLore(path, P.lore[path]); } catch (e) { LOG.err.push(path + ': ' + e.message); }
  });
});

// 엔딩을 바꿨으면, 용병 줄을 읽는 게터를 새 글 위에 다시 건다 ('{fallen}' 또는 옛 용병 줄이 있는 자리)
if (endingTouched) {
  var L = DS.LORE, d = Object.getOwnPropertyDescriptor(L, 'ending'), base = d && ('value' in d ? d.value : d.get && d.get.call(L));
  if (Array.isArray(base)) {
    var at = base.indexOf(FALLEN_TOKEN); if (at < 0) at = base.indexOf(FALLEN_OLD);
    var fix = base.slice(); if (at >= 0) fix[at] = L.endingFallen.base;
    var get = function () {
      var sv = DS.G && DS.G.save, f = sv && sv.fallen, out = fix.slice(), F = DS.LORE.endingFallen || {};
      if (at >= 0) out[at] = !f || f.length >= 30 ? (F.base || FALLEN_OLD) : f.length ? (typeof F.some === 'function' ? F.some(f.length, f) : F.base) : (F.none || F.base);
      var ei = out.indexOf('{erased}');      // r17 boss: 이번 30번 승리에서 지워진 이름 (없으면 뺀다 · 지킬 이름이 있었는데 다 지켰으면 그 줄)
      if (ei >= 0) { var er = sv && sv.erLast, ET = DS.ERASE_TXT; if (er && ET && er.names && er.names.length) { var el = ET.ending(er.names); Array.prototype.splice.apply(out, [ei, 1].concat(norm([].concat(el)))); } else if (er && ET && er.marked) out[ei] = ET.endingKept; else out.splice(ei, 1); }      // r24: 지워진 이름 줄은 여러 줄(지문 + 대장의 다짐)일 수 있다
      return DS.storyFit ? DS.storyFit(out) : out;
    };
    if (d.configurable) Object.defineProperty(L, 'ending', { enumerable: true, configurable: true, get: get });
    else { var c = clone(L); Object.defineProperty(c, 'ending', { enumerable: true, configurable: true, get: get }); DS.LORE = c; }
  }
}

// ───────── 4.0: 줄을 지금 판에 맞춘다 (화면 story() 에 닿기 전에) ─────────
// ① ㉑ 대장이 아홉 집 병과로 섰으면(DS.castAbsent) 그 집 사람의 줄: 줄의 no 글(빈 글이면 뺀다 · 배열이면 여러 줄) → 없으면 heir 글(그 집 깃발을 든 대장의 입으로, 지문은 지문으로) → 없으면 뺀다.
//    열쇠는 줄의 화자(c), 지문의 ab, 그리고 of. 대장이 보병·법사(새 판)면 아무것도 바뀌지 않는다(보병·법사의 줄은 없다).
// ② {hero}: 화면은 처음 대장 이름(save.name)으로 채운다 — 대가 바뀐 뒤에는 지금 대장의 화면 이름(「민규 2세」)으로 먼저 바꿔 둔다(heir·gone 글까지).
function heroNow(sv) {
  var hc = sv && sv.chars && sv.chars[sv.hero], P = sv && sv.lin && sv.lin.P, hp = hc && hc.pid && P && P[hc.pid];
  if (!hc || !(hp && hp.gen > 1) && !hc.vac) return '';
  var n = ''; try { n = DS.charName(hc, sv); } catch (x) { n = ''; }
  return n && n !== sv.name ? n : '';
}
function subHero(t, hn) { return hn && typeof t === 'string' ? t.replace(/\{hero\}/g, hn) : t; }
function cpLine(l, hn) {
  if (!l || typeof l !== 'object' || typeof l.t !== 'string' || !hn) return l;
  var o = Object.create(Object.getPrototypeOf(l)); Object.keys(l).forEach(function (k) { o[k] = l[k]; });
  ['t', 'heir', 'gone', 'a'].forEach(function (k) { if (typeof o[k] === 'string') o[k] = subHero(o[k], hn); });
  return o;
}
function keysOf(l) { var a = []; if (l.c && DS.CAST_NAME[l.c]) a.push(l.c); if (l.ab) a = a.concat(l.ab); if (l.of) a = a.concat(l.of); return a; }
// r22 ③ 아홉이 대장이 되었다(DS.castHero = K): 그 사람이 따로 있는 듯 읽히는 줄을 맞춘다.
//   · 줄에 me 가 있으면 그것 (빈 글 = 뺀다 · 배열 = 여러 줄. 화자 K 의 말은 대장의 입으로)
//   · K 의 말: 대장의 입으로 (화자 칸 = 지금 대장 이름, 초상 = 대장). 글이 대장을 따로 부르면({hero}·「대장」) heir 글로, 없으면 뺀다
//   · K 에 기대는 지문(ab · of)과 남의 말: 글이 대장과 K 를 둘로 세우면({hero} 와 K 의 이름이 함께) heir 글로, 없으면 뺀다. 아니면 그대로 (그 사람이 곧 대장이니 이름도 맞다)
//   · 그 밖의 줄도 {hero} 와 K 의 이름을 함께 부르면 뺀다
var CALLS = { test: function (t) { t = String(t).replace(/옛 대장/g, ''); return /\{hero\}|대장님|(^|[\s"'「(])대장([,.!?\s]|[이은을께도의]|$)/.test(t); } };
function twoOf(t, K) { return typeof t === 'string' && /\{hero\}/.test(t) && t.indexOf(DS.CAST_NAME[K]) >= 0; }
var HV = '';      // 지금 대장의 화면 이름 (storyFit 이 줄마다 채운다)
function heroVoice(t, hn) { var o = DS.say('hero', subHero(t, hn)); o.w = HV || '{hero}'; return o; }
function bareLine(o) { var c = Object.create(Object.getPrototypeOf(o)); ['w', 'c', 't'].forEach(function (k) { if (o[k] != null) c[k] = o[k]; }); return c; }
// r24: me 글 속 대장의 말(c: 'hero')도 지금 대장의 입으로
function meFit(l, K, hn, out) {
  var ks = keysOf(l), mine = ks.indexOf(K) >= 0, talk = l.c === K;
  if (l.me !== undefined && (mine || twoOf(l.t, K))) {
    [].concat(l.me).forEach(function (x) { if (!x) return; x = toLine(x); if (typeof x === 'string') out.push(subHero(x, hn)); else if (x.c === K || x.c === 'hero') out.push(heroVoice(x.t, hn)); else out.push(cpLine(bareLine(x), hn)); });
    return true;
  }
  if (talk) {
    var t = l.t; if (CALLS.test(t)) t = typeof l.heir === 'string' && l.heir && !CALLS.test(l.heir) ? l.heir : '';
    if (t) out.push(heroVoice(t, hn)); return true;
  }
  if (mine || twoOf(l.t, K)) {
    var t2 = l.t; if (twoOf(t2, K) || (mine && /\{hero\}/.test(t2))) t2 = typeof l.heir === 'string' && l.heir && !twoOf(l.heir, K) ? l.heir : '';
    if (!t2) return true;
    var o = bareLine(l); o.t = t2; if (l.of) { var of = [].concat(l.of).filter(function (k) { return k !== K; }); if (of.length) { o.of = of; ['heir', 'gone'].forEach(function (k) { if (own(l, k)) o[k] = l[k]; }); } }
    out.push(cpLine(o, hn)); return true;
  }
  return false;
}
function bare(x, hn) { x = toLine(x); return typeof x === 'string' ? subHero(x, hn) : cpLine(x, hn); }
// r24: 그 사람 본인이 이 판에 있다 — 합류했고, 숨을 거두지 않았고, 대장이 되지도 않았다 (바우·슬기처럼 대장 병과와 겹칠 수 있는 이의 줄 { need: 키 })
DS.castHere = function (s, k) { return !!(s && DS.CAST_NAME && DS.CAST_NAME[k]) && (s.mercs || []).some(function (m) { return m.cast === k; }) && !DS.castNow(s, k); };
// r24: 이번 30번 승리에서 지워진 이름이 있었다 — 줄의 er 글(빈 글 = 뺀다)로 바꾼다 (웃음으로 맺지 않게)
function erNow(sv) { var e = sv && sv.erLast; return !!(e && e.names && e.names.length); }
// 2.5.0 판의 선택지: 줄의 ch = '3a' · '3b' · '3-'(아직 안 골랐다) · '3a-'(a 이거나 안 골랐다). 이번 대에 고른 것은 choice.js 의 DS.chPick (없으면 '' — 안 골랐다)
DS.chOk = function (sv, spec) {
  var m = /^(\d+)([ab-]+)$/.exec(String(spec || '')); if (!m) return true;
  var p = ''; try { p = DS.chPick ? DS.chPick(sv, +m[1]) || '' : ''; } catch (x) { p = ''; }
  return m[2].indexOf(p || '-') >= 0;
};
DS.storyFit = function (lines, sv) {
  sv = sv || (DS.G && DS.G.save);
  if (!Array.isArray(lines) || !sv || !sv.chars) return lines;
  var hn = heroNow(sv), out = [], K = DS.castHero(sv);
  if (K) { HV = ''; try { HV = DS.charName(sv.chars[sv.hero], sv); } catch (x) { HV = ''; } }
  var pv = null;      // 2.4.0 {prev}: 바로 앞 맹주의 이름 (처음 쓸 때 한 번 읽는다)
  function prevOf() { if (pv == null) { try { pv = DS.storyPrev(sv) || ''; } catch (x) { pv = ''; } } return pv; }
  function hasPrev(l) { return typeof l === 'string' ? l.indexOf('{prev}') >= 0 : !!l && typeof l === 'object' && ['w', 't', 'a', 'heir', 'gone'].some(function (k) { return typeof l[k] === 'string' && l[k].indexOf('{prev}') >= 0; }); }
  function subPrev(l) {
    var n = prevOf(), f = function (t) { return t.replace(/\{prev\}/g, n); };
    if (typeof l === 'string') return f(l);
    var o = Object.create(Object.getPrototypeOf(l)); Object.keys(l).forEach(function (k) { o[k] = typeof l[k] === 'string' && k !== 'c' ? f(l[k]) : l[k]; });
    return o;
  }
  var dd = null;      // 2.4.2 먼저 간 이들 (처음 쓸 때 한 번 읽는다)
  function deadOf() { if (dd == null) { try { dd = DS.storyDead(sv) || []; } catch (x) { dd = []; } } return dd; }
  var DT = /\{dead(w|lw)?\}/;
  function hasDead(l) { return typeof l === 'string' ? DT.test(l) : !!l && typeof l === 'object' && ['w', 't', 'a', 'heir', 'gone'].some(function (k) { return typeof l[k] === 'string' && DT.test(l[k]); }); }
  function subDead(l) {
    var d = deadOf(), lw = d.filter(function (x) { return x.lw; })[0];
    var f = function (t) { return t.replace(/\{dead\}/g, d.slice(0, 5).map(function (x) { return x.n; }).join('. ')).replace(/\{deadw\}/g, lw ? lw.n : '').replace(/\{deadlw\}/g, lw ? lw.lw : ''); };
    if (/\{dead(w|lw)\}/.test(JSON.stringify(l)) && !lw) return null;
    if (typeof l === 'string') return f(l);
    var o = Object.create(Object.getPrototypeOf(l)); Object.keys(l).forEach(function (k) { o[k] = typeof l[k] === 'string' && k !== 'c' ? f(l[k]) : l[k]; });
    return o;
  }
  lines.forEach(function (l) {
    if (l && typeof l === 'object' && l.ch && !DS.chOk(sv, l.ch)) return;      // 2.5.0 판의 선택지
    if (l && typeof l === 'object' && l.dz && deadOf().length) return;
    if (hasDead(l)) { if (!deadOf().length) return; l = subDead(l); if (l == null) return; }
    if (l && typeof l === 'object' && l.y && typeof l.t === 'string' && deadOf().length) {      // 단톡방이 이번 대의 사람들로 채워진다
      var dl = deadOf(), who = dl[strHash(l.t) % dl.length], yo = Object.create(Object.getPrototypeOf(l)); Object.keys(l).forEach(function (k) { if (k !== 'y') yo[k] = l[k]; });
      yo.w = '단톡방 · ' + who.n; l = yo;
    }
    if (l && typeof l === 'object' && l.er !== undefined && erNow(sv)) { if (!l.er) return; l = toLine(l.er); }
    if (l && typeof l === 'object' && l.need && !DS.castHere(sv, l.need)) return;
    if (hasPrev(l)) { if (!prevOf()) return; l = subPrev(l); }
    if (typeof l === 'string') { if (!(K && twoOf(l, K))) out.push(subHero(l, hn)); return; }
    if (!l || typeof l !== 'object' || typeof l.t !== 'string') { out.push(l); return; }
    if (l.c && DS.CAST_NAME[l.c] && l.gone === undefined && l.no === undefined && DS.castAnc(sv, l.c)) {      // 2.4.0: 선대의 훈수로
      if (l.a === '') return;
      var an = Object.create(LINE); an.w = DS.ancName(l.c); an.c = l.c; an.t = subHero(l.a != null ? l.a : l.t, hn); an.anc = 1; out.push(an); return;
    }
    if (K && meFit(l, K, hn, out)) return;
    var gone = keysOf(l).filter(function (k) { return DS.castAbsent(sv, k); });
    if (!gone.length) { out.push(cpLine(l, hn)); return; }
    if (l.no !== undefined) { [].concat(l.no).forEach(function (x) { if (x) out.push(bare(x, hn)); }); return; }
    if (typeof l.heir === 'string' && l.heir) {
      var talk = l.c && gone.indexOf(l.c) >= 0, other = l.c && !talk;
      out.push(talk ? cpLine(DS.say('hero', l.heir), hn) : other ? cpLine(toLine({ w: l.w, c: l.c, t: l.heir }), hn) : subHero(l.heir, hn));
    }
  });
  return out;
};
DS.storyCastOK = function (lines, sv) {      // 막간: 이 판에 없는 사람이 말하는 막간은 열지 않는다 (주고받는 말이 반쪽이 되지 않게)
  sv = sv || (DS.G && DS.G.save); if (!sv || !Array.isArray(lines)) return true;
  if (lines.some(function (l) { return l && typeof l === 'object' && l.c && DS.CAST_NAME[l.c] && DS.castAbsent(sv, l.c) && (l.gone !== undefined || l.no !== undefined); })) return false;      // 2.4.0: 그 밖의 줄은 선대가 대신 말한다
  var K = DS.castHero(sv);      // r22: 대장이 된 아홉과 대장이 주고받는 막간은 열지 않는다 (한 사람이 제게 말을 걸지 않게)
  return !(K && lines.some(function (l) { return l && l.c === K && l.me === undefined; }) && lines.some(function (l) { return l && l.c === 'hero'; }));
};
(DS.SCENARIOS || []).forEach(function (sc) {
  ['intro', 'outro', 'outroAlt'].forEach(function (k) {
    var d = Object.getOwnPropertyDescriptor(sc, k); if (!d || !d.configurable) return;
    var get = d.get ? d.get : function () { return d.value; }, set = d.get ? null : function (v) { d.value = v; };
    Object.defineProperty(sc, k, { enumerable: true, configurable: true, get: function () { return DS.storyFit(get.call(sc)); }, set: set || undefined });
  });
});
// 다음 세대의 장: 30번의 두 얼굴은 대마다 다르게 말한다 (boss.herald · boss.duskking 의 say/last 에 genSay 배열을 주면 2대째부터 그것을 — 대수에 따라 돌아가며)
(function () {
  var G2 = DS.STORY_BOSSGEN || {};
  Object.keys(G2).forEach(function (bk) {
    var b = DS.LORE.boss && DS.LORE.boss[bk]; if (!b) return;
    ['say', 'last'].forEach(function (k) {
      var arr = G2[bk][k], d = Object.getOwnPropertyDescriptor(b, k); if (!arr || !arr.length || !d || !d.configurable) return;
      var base = 'value' in d ? d.value : d.get.call(b);
      Object.defineProperty(b, k, { enumerable: true, configurable: true, get: function () { var sc = DS.G && DS.G.scn, g = sc && sc.gen; return g > 1 ? arr[(g - 2) % arr.length] : base; } });
    });
  });
})();

// 2.4.0: 7단 승급 창의 한마디(cast.t7)는 그 가문 선대의 훈수다 — 그 배역 본인이 살아서 곁에 있는 옛 저장에서는 내주지 않는다(ui.js showPromo 는 빈 글이면 그 줄을 뺀다).
Object.keys((DS.LORE && DS.LORE.cast) || {}).forEach(function (k) {
  var c = DS.LORE.cast[k], d = c && Object.getOwnPropertyDescriptor(c, 't7'); if (!d || !('value' in d) || !d.configurable) return;
  var v = d.value;
  Object.defineProperty(c, 't7', { enumerable: true, configurable: true, get: function () { var sv = DS.G && DS.G.save; return sv && DS.castHere && DS.castHere(sv, k) ? '' : v; }, set: function (x) { v = x; } });
});
})();
