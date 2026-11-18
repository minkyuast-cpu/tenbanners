// 열 개의 깃발 — 화면: 타이틀, 가게, 입구, 메뉴, 결과
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var U = DS.ui, josa = U.josa, $ = U.$, $$ = U.$$, h = U.h, esc = U.esc, sprTag = U.sprTag, charSpr = U.charSpr, toast = U.toast, overlay = U.overlay, A = U.A, G = DS.G;
function story(lines, cb, who) { return U.story(lines, cb, who); }      // 이야기 창은 game.js 의 것 (줄 객체·건너뛰기는 그쪽이 처리한다)
function lv(L) { return DS.lvText(L); }
function lvS(L) { return DS.tierOfL(L) + '단 Lv' + DS.lvOfL(L); }
function busy() { return !!(G.scn || (G.sim && G.sim.combat)); }
function coin(n) { return '<span class="cur">' + (U.svg ? U.svg('coin', 16, 'coin') : '<i class="coin"></i>') + '<b class="num">' + (typeof n === 'number' ? U.fmtN(n) : n) + '</b></span>'; }      // r26 art: 동전 아이콘 + 픽셀 숫자
// 공통 창: 제목 + 골드 + 닫기, 내용은 render() 가 다시 그린다. cls 'sub' = 다른 창 위에 뜨는 고르기 창
// r8 menus: 접어 두는 구역 — 이 판(페이지) 동안만 기억한다 (저장 칸 없음). data-pfold 단추는 sheet() 가 받는다.
var FOLD = {};      // 1.0.1: 부대 탭의 「출전 가문 편성」 긴 카드는 없앴다 (가주·가솔은 가문 칸 안에)
function pills(list) { list = (list || []).filter(Boolean); return list.length ? '<span class="pills">' + list.map(function (t) { return '<i>' + esc(t) + '</i>'; }).join('') + '</span>' : ''; }      // r45 ui: 쉼표로 잇던 낱말 묶음 → 작은 알약
function foldBtn(key, label, sub) { var on = !!FOLD[key]; return '<button class="pfold' + (on ? ' on' : '') + '" data-pfold="' + key + '" aria-expanded="' + on + '"><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '<i aria-hidden="true">' + (on ? '▾' : '▸') + '</i></button>'; }
// r8 menus (ux 3): 같은 종류(제목+틀)의 창이 이미 열려 있으면 그 창과 그 위에 쌓인 창들을 닫고 그 자리에 다시 연다 — 지휘관 → 가계도 → 사람 → 지휘관 … 으로 겹이 끝없이 쌓이지 않게.
// 사이에 확인 창(modal)이나 sheet 가 아닌 창이 끼어 있으면 건드리지 않고 예전처럼 위에 쌓는다.
var SHEET_STEP = { '가문 사람|sub lgs': ['가문|', '인물|sub', '대장|sub'] };
function sheetReuse(kind) {
  var st = Array.prototype.slice.call(document.querySelectorAll('.ov:not(.ghost)')), at = -1, i;
  for (i = 0; i < st.length; i++) if (st[i].shKind === kind) { at = i; break; }
  if (at < 0) {      // 가계도의 사람 카드는 디딤돌이다 — 거기서 지휘관·용병 창을 열면 카드 자리를 그 창이 차지한다
    var top = st[st.length - 1], step = top && SHEET_STEP[top.shKind];
    if (step && step.indexOf(kind) >= 0 && top.close) { top.close(); return st.length > 1 ? st[st.length - 2] : document.body; }
    return null;
  }
  var up = st.slice(at);
  if (!up.every(function (x) { return x.shKind && x.close && !x.classList.contains('modal'); })) return null;
  up.forEach(function (x) { x.close(); });      // 아래 것부터 닫는다 (위 창의 onclose 는 닫힌 부모를 다시 그리지 않는다)
  return at > 0 ? st[at - 1] : document.body;
}
function sheet(title, render, cls, after) {
  var kind = title || cls ? title + '|' + (cls || '') : '', under = kind ? sheetReuse(kind) : null;
  // r12 screen: 단추 위치 문법 — 머리 ✕ 없음. 닫기는 아래 한 곳, 으뜸 행동(o.foot 이 돌려주는 단추)이 있으면 1:2 로 나눈다
  var o = overlay('<header class="sh"><h3>' + esc(title) + '</h3><span class="gold"></span></header><div class="sb"></div><div class="sfoot"></div>', cls || '');
  var footHtml = null;
  o.draw = function () {
    $('.gold', o).innerHTML = G.save ? coin(G.save.gold) : '';
    var body = $('.sb', o), top = body.scrollTop;
    body.innerHTML = render(); U.hydrate(body); body.scrollTop = top;
    var pr = o.foot ? o.foot() || '' : '', f = $('.sfoot', o), fh = '<button class="btn" data-close>닫기</button>' + pr;
    if (f && fh !== footHtml) { footHtml = fh; f.className = 'sfoot' + (pr ? ' two' : ''); f.innerHTML = fh; }
    if (after) after(body, o);      // 그린 뒤에 할 일 (남의 조각에 손잡이를 다는 등)
  };
  o.shKind = kind || '-';
  o.addEventListener('click', function (e) { var b = e.target.closest('[data-pfold]'); if (!b || !o.contains(b)) return; FOLD[b.dataset.pfold] = !FOLD[b.dataset.pfold]; A('tap'); o.draw(); });
  if (under && under.draw) { var close0 = o.close; o.close = function () { var was = o.isConnected; close0(); if (was && under.isConnected) under.draw(); }; }      // 다시 쓴 창을 닫으면 바로 아래 창을 새로 그린다 (원래 부모는 닫혔다)
  o.draw();
  return o;
}
U.sheet = sheet;      // 다른 파일(아이템 등)이 자기 창을 만들 때 쓴다
// r12 screen: 등급은 색 글씨가 아니라 깃발 눈금 개수로 (다섯째만 금). 부대원 1~5, 장비 보통 1 · 유니크 4 · 전설 5
// r45 ui: 사람의 등급은 눈금이 아니라 색 이름표 하나 (「희귀」). 등급 이름을 따로 또 쓰지 않는다. 눈금은 장비(보통·유니크·전설)에만 — label 을 주면 예전 눈금
function gpips(g, label) { if (label == null) return gbadge(g); return gpipsRaw(g, label); }
function gbadge(g) { g = Math.max(0, Math.min(5, g | 0)); var G0 = DS.GRADES[g]; return G0 ? '<i class="gbdg g' + g + '" style="--gc:' + G0.col + '" role="img" aria-label="등급 ' + esc(G0.name) + '">' + esc(G0.name) + '</i>' : ''; }
function gpipsRaw(g, label) { g = Math.max(0, Math.min(5, g | 0)); var h = '<i class="gp" role="img" aria-label="' + esc(label || (DS.GRADES[g] ? DS.GRADES[g].name : '')) + '">'; for (var i = 0; i < g; i++) h += '<b' + (i === 4 ? ' class="g5"' : '') + '></b>'; return h + '</i>'; }
function gearPips(g) { return gpips(g.grade >= 5 ? 5 : g.grade >= 4 ? 4 : 1, (DS.gearTag && DS.gearTag(g)) || '보통'); }
function enhCls(n) { return DS.enhClass ? DS.enhClass(n || 0) : 'en en' + DS.enhTier(n || 0); }
U.gpips = gpips; U.gbadge = gbadge; U.gearPips = gearPips; U.enhCls = enhCls;
// ── 다른 팀이 만드는 것들: 없으면 지금처럼 동작한다 ──
function LORE() { return DS.LORE || {}; }
function lt(x) { var t = x && typeof x === 'object' ? x.t : x; return String(t == null ? '' : t).replace(/\{hero\}/g, (G.save && G.save.name) || '대장'); }      // LORE 의 한 줄 → 글
function A2(name, old) { var Au = DS.Audio; A(Au && Au.has && !Au.has(name) ? old : name); }      // 새 효과음. 없다고 알려 주면 예전 소리로
function partyFirst() {
  var s = G.save, list = DS.charList(s);
  return list.sort(function (a, b) { var ia = s.party.indexOf(a.id), ib = s.party.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (DS.houseCmp ? DS.houseCmp(a, b) : a.id - b.id); });      // 2.1.0: 출전 차례 → 공훈 순 (가문 수를 열로 셈하지 않는다)
}
function benchTag(ch) { return G.save.party.indexOf(ch.id) < 0 ? ' <i class="own bench">대기</i>' : ''; }
function spend(n) { if (G.save.gold < n) { no('골드', '골드가 모자라다. ' + U.fmtN(G.save.gold) + ' / ' + U.fmtN(n)); goldShake(); return false; } G.save.gold -= n; A('coin'); return true; }
// r26: 거절은 누른 단추가 흔들리고 짧은 꼬리표 (다시 누르면 글로). 누른 단추를 모르면 예전처럼 글 상자
function no(tag, msg) { var b = G.lastBtn && G.lastBtn.isConnected && performance.now() - (G.lastBtnAt || 0) < 4000 ? G.lastBtn : null; if (b) U.deny(b, tag, msg); else { A('deny'); toast(msg); } }
function goldShake() { $$('.ov .sh .cur').forEach(function (c) { c.classList.remove('deny'); void c.offsetWidth; c.classList.add('deny'); }); }

// ── 능력치가 어떻게 달라지나 (장비를 바꾸기 전에 보여 준다) ──
var SNAME = { hp: 'HP', mp: '마나', atk: '공격', def: '방어', mag: '마공', res: '마방' };
function mainKey(ch) { var c = DS.CLASSES[ch.cls]; return c.dtype === 'magic' || c.kind === 'holy' ? 'mag' : 'atk'; }
function withChange(ch, o) { var c = {}, k; for (k in ch) c[k] = ch[k]; for (k in o) c[k] = o[k]; return DS.charStats(c); }
function statDiff(a, b) {
  var out = [];
  function add(name, x, y, unit) { var d = Math.round((y - x) * 10) / 10; if (d) out.push({ n: name, d: d, t: name + ' ' + (d > 0 ? '+' : '−') + Math.abs(d) + (unit || '') }); }
  add('공격', a.atk, b.atk); add('마공', a.mag, b.mag); add('HP', a.hp, b.hp); add('방어', a.def, b.def); add('마방', a.res, b.res); add('마나', a.mp, b.mp);
  add('치명타', Math.round(a.crit * 100), Math.round(b.crit * 100), '%'); add('흡혈', Math.round((a.drain || 0) * 100), Math.round((b.drain || 0) * 100), '%');
  if (a.spd) add('행동 회복', 0, Math.round((b.spd / a.spd - 1) * 100), '%'); else add('행동 회복', a.spd, b.spd);      // 장비 설명(「행동 회복 +4%」)과 같은 단위로 (QA)
  if (a.rng[1] !== b.rng[1] || a.rng[0] !== b.rng[0]) out.push({ n: '사거리', d: b.rng[1] - a.rng[1] || 1, t: '사거리 ' + a.rng[0] + '~' + a.rng[1] + ' → ' + b.rng[0] + '~' + b.rng[1] });
  return out;
}
function diffHtml(list, max) {
  if (!list.length) return '<i class="eq">능력치 변화 없음</i>';
  return '<span class="schips">' + list.slice(0, max || 9).map(function (x) { var v = x.t.slice(x.n.length).trim(); return DS.chip ? DS.chip(x.n, v, x.d < 0 ? -1 : 1) : '<em class="' + (x.d < 0 ? 'neg' : '') + '">' + x.t + '</em>'; }).join('') + (list.length > (max || 9) ? '<span class="sch tag">…</span>' : '') + '</span>';      // r45 ui: 쉼표 줄 → 칩
}

// ───────── 장비 줄 (r37: 무기점·방어구점은 없어졌다 — 장비는 드랍으로 얻고, 마을 대장간에서는 강화만) ─────────
function gearRowName(g) { return DS.gearTitle ? DS.gearTitle(g) : '<b><span class="' + enhCls(g.enh) + '">' + esc(g.name) + '</span> <i class="own">' + g.kind + '</i></b>'; }      // r12: 가방·가게·대장간이 같은 줄 머리
function gearLine(g, ch) { if (DS.gearHtml) return DS.gearHtml(g, false, ch); return '<b><span class="' + enhCls(g.enh) + '">' + esc(g.name) + '</span> <i class="own">' + g.kind + '</i></b><small>' + g.stat + '</small>'; }      // 2.1.0: ch 를 주면 그 사람 기준 수치
function offTag(ch, g) { return DS.gearFits && !DS.gearFits(ch.cls, g) ? ' <i class="goff" title="맞지 않는 병과: 능력치 −' + Math.round((1 - DS.GEAR_OFF) * 100) + '%">−' + Math.round((1 - DS.GEAR_OFF) * 100) + '%</i>' : ''; }      // 2.1.0: 병과에 맞지 않는 장비 표시
function wearers(sl, cat) { return partyFirst(); }      // 2.1.0: 누구나 입는다
function gearDiff(ch, id) { var g = DS.gear(id), o = {}; o[g.slot] = id; return statDiff(DS.charStats(ch), withChange(ch, o)); }
// 한 숫자로: 무기는 주 공격 능력, 방어구는 방어
function gearGain(ch, id) {
  var g = DS.gear(id), o = {}; o[g.slot] = id;
  var a = DS.charStats(ch), b = withChange(ch, o), k = g.slot === 'w' ? mainKey(ch) : 'def';
  return { k: SNAME[k], d: b[k] - a[k] };
}
// 방금 산(또는 가방의) 장비를 누구에게 입힐지
function pickWearer(id, parent) {
  var g = DS.gear(id), list = DS.charList(G.save).filter(function (c) { return DS.canEquip(c, id); });
  if (!list.length) { toast(josa(g.name, '을를') + ' 가방에 넣었다.', 3600); return; }
  var o = sheet('어느 가문에 장착할까', function () {
    var html = '<div class="row"><div class="tx">' + gearLine(g) + '</div></div>';
    partyFirst().filter(function (c) { return DS.canEquip(c, id); }).forEach(function (ch) {
      var cur = DS.gear(ch[g.slot]);
      html += '<div class="row">' + charSpr(ch, 2) + '<div class="tx"><b>' + esc(DS.charName(ch)) + benchTag(ch) + offTag(ch, g) + '</b><small>지금: ' + (cur ? esc(cur.name) : '없음') + '</small><small class="df">' + diffHtml(gearDiff(ch, id), 4) + '</small></div>' +
        '<button class="btn small gold" data-wear="' + ch.id + '">장착</button></div>';
    });
    return html;
  }, 'sub');
  o.addEventListener('click', function (e) {
    var b = e.target.closest('[data-wear]'); if (!b) return;
    var ch = G.save.chars[+b.dataset.wear];
    if (DS.equip(G.save, ch, id)) { A('ok'); DS.refreshUnits(); U.persist(); toast(DS.charName(ch) + ': ' + g.name + ' 장착'); }
    o.close();
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
}
// 가온(Z.special) 대장간의 「귀한 물건」: 2.1.0 강화 보호 부적 (옛 유물 진열 자리). 값은 깬 시나리오만큼 오른다 (loot.js DS.protPrice)
function shopZ() { var s = G.save, z = G.zone; if (z && z.town) return { id: z.id, def: z.def || DS.ZONES[z.id] || {} }; var t = (s && s.town) || 'haemil'; return { id: t, def: DS.ZONES[t] || {} }; }      // 2.1.0: 마을 밖에서 연 가게(「마을 일」)는 마지막에 들른 마을의 진열
function protShelf(s, any) {
  var Z = shopZ().def; if (!DS.ITEMS.prot || !(any || (Z && Z.special))) return '';
  var c = DS.protPrice(s), have = s.items.prot || 0, full = have >= DS.itemMax('prot');
  return '<h4>귀한 물건</h4><div class="row prot">' + icon('item', 'prot') + '<div class="tx"><b>' + esc(DS.ITEMS.prot.name) + ' <i class="own">' + have + '개</i></b><small>' + esc(DS.ITEMS.prot.desc) + '</small></div>' +
    (full ? '<span class="why">가득</span>' : '<button class="btn small' + (s.gold >= c ? ' gold' : ' poor') + '" data-prot="1">' + coin(c) + '</button>') + '</div>';
}
function protBuy(o) {
  var s = G.save, c = DS.protPrice(s);
  if (s.gold < c) { no('골드', '골드가 모자라다. ' + fmtN(s.gold) + ' / ' + fmtN(c)); goldShake(); return; }
  if (!DS.buyProt(s)) { A('cancel'); toast('더 가질 수 없다'); return; }
  A('coin'); U.persist(); o.draw(); toast(DS.ITEMS.prot.name + ' ×' + s.items.prot);
}
// ───────── 강화 (대장간: 무기·방어구) ─────────
function rateTable(cur) {      // 2.1.0: +5 부터 끝(+20)까지 같은 확률이라 한 칸으로 묶는다
  var h = '<div class="rtab">', fl = 1;
  while (fl < DS.ENH.max && DS.ENH.rate[fl + 1] !== DS.ENH.rate[fl]) fl++;
  for (var n = 1; n < fl; n++) h += '<span class="' + (n === cur ? 'now' : '') + ' ' + enhCls(n) + '"><i>+' + n + '</i><b>' + DS.ENH.rate[n] + '%</b></span>';
  h += '<span class="' + (cur >= fl ? 'now' : '') + ' ' + enhCls(fl) + '"><i>+' + fl + '~' + DS.ENH.max + '</i><b>' + DS.ENH.rate[fl] + '%</b></span>';
  return h + '</div>';
}
// ── r4 forge: 강화 창 하나로 — 확인(확률·전후 능력치) → 망치질 → 결과(「한 번 더」), 창을 닫지 않는다. 대장간·지휘관 창·가방 자세히가 함께 쓴다 ──
// ref = { ch, sl } 의 sl: 'w' 무기(없으면) · 'a' 방어구
function enhSl(ref) { return ref && ref.sl === 'a' ? 'a' : 'w'; }
function enhGear(ref) { var s = G.save, own = ref.ch ? s.chars[ref.ch] : null, g = DS.gear(own ? own[enhSl(ref)] : ref.id); if (!g || (!own && !(s.gear[ref.id] > 0))) return null; return { g: g, own: own }; }
function enhWord(g) { return g && g.slot === 'a' ? '방어구' : '무기'; }
function enhBare(g) { return g && g.slot === 'a' ? '맨몸' : '맨손'; }
// r37: 강화 값 (골드). 단추마다 값을 보이고, 모자라면 흐리게 + 까닭
function enhCostOf(g) { return DS.enhCost ? DS.enhCost(g) : 0; }
function enhBtn(g, attr) {      // 목록 줄 끝의 작은 단추: 「강화 45%」 + 값
  var r = DS.enhRate(g); if (!r) return '<span class="why">최고 단계</span>';
  var c = enhCostOf(g), poor = G.save.gold < c;
  return '<button class="btn small enhb ' + (poor ? 'poor' : 'gold') + '" ' + attr + '>강화 ' + r + '%<small>' + (poor ? '골드 부족, ' : '') + fmtN(c) + 'G</small></button>';
}
function enhFailTxt(g, prot) { return DS.enhSafe && DS.enhSafe(g) ? '그대로 남는다' : prot ? '그대로 남는다 (부적 1개)' : enhWord(g) + '가 부서진다'; }
// 한 번 더 묻는 장비: 잠금·유니크·전설·+4 이상 (r37: 실패해도 부서지지 않는 +3 까지는 묻지 않는다)
function enhRisk(g, ref) {
  var s = G.save, out = [];
  if ((DS.enhSafe && DS.enhSafe(g)) || (ref && ref.prot)) return out;      // 2.1.0: 보호 부적을 쓰면 부서지지 않는다
  if (s.lock && s.lock[g.id]) out.push('잠근 ' + enhWord(g));
  if ((g.grade || 1) >= 4 || g.uniq) out.push((DS.gearTag ? DS.gearTag(g) : '') || '유니크');
  if (g.enh >= 4) out.push('+' + g.enh + ' 고단계');
  return out;
}
// 강화 전후: 누가 들었을 때 기준인지 + 단계·주 능력·치명타
function enhWho(g, own) { if (own) return own; return partyFirst().filter(function (c) { return DS.canEquip(c, g.id); })[0] || null; }
function enhPv(g, own, done) {
  var nx = DS.gear(g.base + '+' + (g.enh + 1)); if (!nx) return '';
  var ch = enhWho(g, own), h = '<div class="enhpv">', row = function (n, a, b, unit) { var d = Math.round((b - a) * 10) / 10; return '<span class="pk">' + n + '</span><b>' + a + (unit || '') + '</b><i>→</i><b class="up">' + b + (unit || '') + '</b><em>' + (d ? '+' + d + (unit || '') : '') + '</em>'; };
  var arm = g.slot === 'a', o1 = {}, o2 = {};
  h += '<p class="pw">' + (ch ? (own ? esc(DS.charName(ch)) : esc(josa(DS.charName(ch), '이가')) + ' 들면') + (done ? ', 오른 능력치' : ', 성공하면') : enhWord(g) + ' 능력치' + (done ? ', 오른 능력치' : ', 성공하면')) + '</p>';
  h += '<span class="pk">단계</span><b>+' + g.enh + '</b><i>→</i><b class="up ' + enhCls(g.enh + 1) + '">+' + (g.enh + 1) + '</b><em></em>';
  if (ch) {
    o1[g.slot] = g.id; o2[g.slot] = nx.id;
    var a = withChange(ch, o1), b = withChange(ch, o2), k = mainKey(ch);
    if (arm) h += row('방어', a.def, b.def) + row('마방', a.res, b.res) + row('HP', a.hp, b.hp);
    else { h += row(SNAME[k], a[k], b[k]); h += row('치명타', Math.round(a.crit * 100), Math.round(b.crit * 100), '%'); }
  } else if (arm) h += row('방어, 마방', Math.round((g.ad || 0) * 100), Math.round((nx.ad || 0) * 100), '%') + row('방어구 HP', Math.round((g.ad || 0) * 100), Math.round((nx.ad || 0) * 100), '%');
  else h += row('공격, 마공', Math.round(g.amp * 100), Math.round(nx.amp * 100), '%') + row('치명타', Math.round(g.crit * 100), Math.round(nx.crit * 100), '%');
  return h + '</div>';
}
function enhNextGain(g, own) {      // 「다음 +2 (공격 75→81)」
  var nx = DS.gear(g.base + '+' + (g.enh + 1)), ch = enhWho(g, own); if (!nx || !ch) return '';
  var k = g.slot === 'a' ? 'def' : mainKey(ch), o1 = {}, o2 = {}; o1[g.slot] = g.id; o2[g.slot] = nx.id;
  var a = withChange(ch, o1)[k], b = withChange(ch, o2)[k];
  return ' ' + (DS.chip ? DS.chip(SNAME[k], a + '→' + b, b > a ? 1 : b < a ? -1 : 0) : '<small>(' + SNAME[k] + ' ' + a + '→' + b + ')</small>');
}
var enhOpen = null;
// ref = { ch: 지휘관 id, sl: 'w'|'a' } 또는 { id: 가방 장비 }. opt.done(res, 다음 ref) 는 굴릴 때마다, opt.close() 는 창이 닫힐 때.
function forgeOpen(ref, opt) {
  opt = opt || {};
  if (enhOpen && enhOpen.isConnected) return enhOpen;      // 연타로 창이 둘 뜨지 않게
  if (busy()) { no('전투 중', '싸우는 중에는 강화할 수 없다'); return null; }
  var s = G.save, first = enhGear(ref); if (!first || !DS.enhRate(first.g)) { A('cancel'); toast(first ? '최고 단계다' : '강화할 장비가 없다'); return null; }
  var o = overlay('', 'modal center enhov'), sh = $('.sheet', o), rolling = false, readyAt = 0, protPick = null;
  enhOpen = o;
  // 2.1.0 강화 보호 부적: 가진 것이 있으면 값진 장비(+4 이상·유니크·전설·잠금)에는 저절로 켠다. 단추로 끄고 켠다
  function protOn(g) { if (!(s.items.prot > 0) || (DS.enhSafe && DS.enhSafe(g))) return false; if (protPick != null) return protPick; return g.enh >= 4 || (g.grade || 1) >= 4 || !!(s.lock && s.lock[g.id]); }
  function protRow(g) {
    if (!(s.items.prot > 0) || (DS.enhSafe && DS.enhSafe(g))) return '';
    var on = protOn(g);
    return '<button class="btn wide ptog' + (on ? ' on' : '') + '" id="protEnh" aria-pressed="' + on + '">' + icon('item', 'prot') + '<span>' + esc(DS.ITEMS.prot.name) + (on ? ' 쓴다' : ' 쓰지 않는다') + ' <small>' + s.items.prot + '개 남음</small></span></button>';
  }
  function ask() {
    var x = enhGear(ref); if (!x) { o.close(); return; }
    var g = x.g, own = x.own, r = DS.enhRate(g), nx = DS.gear(g.base + '+' + (g.enh + 1)); ref.prot = protOn(g); var risk = enhRisk(g, ref);
    sh.innerHTML = '<div class="result enhq"><h2><span class="' + ((g.grade || 1) >= 2 ? 'lg lg' + g.grade : enhCls(g.enh)) + '">' + esc(g.name) + '</span></h2>' +
      (risk.length ? '<p class="risk">' + risk.map(function (t) { return '<i>' + esc(t) + '</i>'; }).join('') + '<span>한 번 더 확인</span></p>' : '') +
      enhPv(g, own) +
      '<div class="odds"><div class="win"><b>' + r + '%</b><span>성공</span><small>' + esc(nx.name) + '</small></div><div class="lose"><b>' + (100 - r) + '%</b><span>실패</span><small>' + enhFailTxt(g, ref.prot) + '</small></div></div>' +
      protRow(g) + (own && !(DS.enhSafe && DS.enhSafe(g)) && !ref.prot ? '<p class="lock">' + esc(DS.charName(own)) + '의 ' + enhWord(g) + '다. 부서지면 ' + enhBare(g) + '이다.</p>' : '') +
      enhPay(g) + '<button class="btn wide" data-close>취소</button></div>';
  }
  // 값 줄 + 강화 단추 (골드가 모자라면 단추를 끄고 까닭을 적는다)
  function enhPay(g) {
    var c = enhCostOf(g), r = DS.enhRate(g), poor = s.gold < c;
    return '<p class="enhcost">값 ' + coin(c) + ' <small>가진 골드 ' + fmtN(s.gold) + '</small></p>' +
      '<button class="btn gold wide" id="yesEnh"' + (poor ? ' disabled' : '') + '>' + (poor ? '골드가 모자라다' : '강화 ' + r + '% <small class="bsub"><i>' + fmtN(c) + '골드</i></small>') + '</button>';
  }
  // 잠금·유니크·전설·고단계: 굴리기 전에 붉은 단추로 한 번 더 (2.8.0 에는 없던 확인 — audit F4)
  function sure() {
    var x = enhGear(ref); if (!x) { o.close(); return; }
    var g = x.g, r = DS.enhRate(g), risk = enhRisk(g, ref);
    sh.innerHTML = '<div class="result enhq sure"><h2>부서져도 강화할까?</h2><p class="risk">' + risk.map(function (t) { return '<i>' + esc(t) + '</i>'; }).join('') + '</p>' +
      '<p><span class="' + ((g.grade || 1) >= 2 ? 'lg lg' + g.grade : enhCls(g.enh)) + '">' + esc(g.name) + '</span></p>' +
      '<p class="enhwarn">' + (100 - r) + '% 확률로 부서진다' + ((g.affix && g.affix.length) || g.uniq ? '. 옵션도 함께' : '') + '.</p>' +
      (x.own ? '<p class="lock">' + esc(DS.charName(x.own)) + '의 ' + enhWord(g) + '다. 부서지면 ' + enhBare(g) + '이다.</p>' : '') +
      '<button class="btn red wide" id="yesRisk"' + (s.gold < enhCostOf(g) ? ' disabled' : '') + '>부서져도 강화한다 <small class="bsub"><i>' + r + '%</i><i>' + fmtN(enhCostOf(g)) + '골드</i></small></button><button class="btn wide" data-close>취소</button></div>';
  }
  function go() { var x = enhGear(ref); if (x) ref.prot = protOn(x.g); if (x && enhRisk(x.g, ref).length) sure(); else roll(); }
  function roll() {
    if (rolling) return; var x = enhGear(ref); if (!x || !DS.enhRate(x.g)) return;
    if (s.gold < enhCostOf(x.g)) { no('골드', '골드가 모자라다. ' + fmtN(s.gold) + ' / ' + fmtN(enhCostOf(x.g))); goldShake(); return; }
    rolling = true;
    var lk = !ref.ch && s.lock && s.lock[ref.id], had = !ref.ch ? (s.gear[ref.id] || 0) : 0;
    var res = DS.enhance(s, ref); if (!res) { rolling = false; toast('강화할 수 없다'); return; }
    if (res.cost) A('coin');
    if (lk) { if (res.ok && res.to) s.lock[res.to.id] = 1; if (had <= 1) delete s.lock[ref.id]; }      // 잠금이 새 식별자(+1)를 따라간다 (QA)
    var own = x.own;
    if (!own) ref = res.ok ? { id: res.to.id } : ref;
    ref.prot = false;      // 다음 굴림 앞에 go() 가 다시 정한다
    DS.refreshUnits(); U.persist(); if (opt.done) opt.done(res, ref);
    var to = res.to, t = res.ok ? DS.enhTier(to.enh) : 0;
    sh.innerHTML = '<div class="result forge"><p class="eyebrow">강화 <i class="esep"></i>성공 ' + res.rate + '%' + (res.cost ? '<i class="esep"></i>' + fmtN(res.cost) + '골드' : '') + '</p><div class="anvil"><span class="blade ' + enhCls(res.from.enh) + '">' + esc(res.from.name) + '</span><i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i></div><h2 class="fr">…</h2><p class="rn fr2"></p><div class="fdone" hidden></div>' +
      '<button class="btn gold wide" id="againEnh" hidden></button>' + (own && !res.ok ? '<button class="btn wide" id="swapEnh" hidden>교체</button>' : '') + '<button class="btn wide" data-close hidden>닫기</button></div>';
    A('punch'); setTimeout(function () { A('punch'); }, 380); setTimeout(function () { A('punch'); }, 760);
    setTimeout(function () {
      if (!o.isConnected) return;
      var box = $('.forge', o), blade = $('.blade', o), dn = $('.fdone', o);
      if (res.ok) {
        box.classList.add('ok', 'ok' + t); blade.className = 'blade ' + enhCls(to.enh); blade.textContent = to.name;
        $('.fr', o).textContent = '+' + to.enh + ' 성공'; $('.fr2', o).innerHTML = DS.statChips ? DS.statChips(to.stat) : esc(to.stat);
        A(t >= 3 ? 'sword' : t >= 2 ? 'level' : 'star'); if (t >= 2) setTimeout(function () { A('holy'); }, 250);
        dn.innerHTML = enhPv(res.from, own, true); dn.hidden = false;
        var r2 = DS.enhRate(to);
        if (r2) {
          var risk = enhRisk(to, ref), ab = $('#againEnh', o);
          dn.insertAdjacentHTML('beforeend', '<p class="enhnext">다음 <b class="' + enhCls(to.enh + 1) + '">+' + (to.enh + 1) + '</b>' + enhNextGain(to, own) + ' <span class="sch"><i>성공</i><b>' + r2 + '%</b></span>' + (risk.length ? '<small class="enrk">' + risk.map(function (t) { return '<i>' + esc(t) + '</i>'; }).join('') + '한 번 더 확인</small>' : '') + '</p>');
          ab.innerHTML = againTxt('한 번 더', to, r2); ab.hidden = false; ab.dataset.risk = risk.length ? '1' : '';
        } else dn.insertAdjacentHTML('beforeend', '<p class="enhnext">최고 단계다.</p>');
      } else if (res.kept) {      // r37: 안전 구간(+3 까지)의 실패 — 골드만 들고 그대로
        box.classList.add('fail', 'kept');
        $('.fr', o).textContent = '실패, 그대로다'; $('.fr2', o).textContent = res.from.name + '. 부서지지 않았다. ' + (res.prot ? DS.ITEMS.prot.name + '가 지켰다. 남은 부적 ' + (s.items.prot || 0) + '개.' : res.from.nobrk ? '닳지 않는 장비다.' : '+' + DS.ENH.safe + '까지는 실패해도 남는다.');
        A('cancel');
        var ak = $('#againEnh', o), rk2 = DS.enhRate(res.from);
        dn.innerHTML = '<p class="enhnext">다시 <b class="' + enhCls(res.from.enh + 1) + '">+' + (res.from.enh + 1) + '</b> <span class="sch"><i>성공</i><b>' + rk2 + '%</b></span></p>'; dn.hidden = false;
        ak.innerHTML = againTxt('다시', res.from, rk2); ak.hidden = false; ak.dataset.risk = '';
      } else {
        box.classList.add('fail'); blade.classList.add('broken');
        $('.fr', o).textContent = '부서졌다'; $('.fr2', o).textContent = res.from.name + '. 산산조각 났다.' + (own ? ' ' + josa(DS.charName(own), '은는') + ' 지금 ' + enhBare(res.from) + '이다.' : '');
        A('crit'); setTimeout(function () { A('lose'); }, 200);
        var sw = $('#swapEnh', o); if (sw) sw.hidden = false;
        if (!own && s.gear[ref.id] > 0) {      // 가방에 같은 장비가 더 있으면 그것으로 다시
          var rf = DS.enhRate(res.from), rk = enhRisk(res.from, ref), ab2 = $('#againEnh', o);
          dn.innerHTML = '<p class="enhnext">같은 ' + enhWord(res.from) + ' ×' + s.gear[ref.id] + ' <span class="sch"><i>성공</i><b>' + rf + '%</b></span></p>'; dn.hidden = false;
          ab2.innerHTML = againTxt('남은 것으로 다시', res.from, rf); ab2.hidden = false; ab2.dataset.risk = rk.length ? '1' : '';
        }
      }
      $('[data-close]', o).hidden = false;
      rolling = false; readyAt = performance.now() + 600;      // 결과가 뜨자마자 들어온 연타는 「한 번 더」로 받지 않는다 (잠깐 흐리게 보였다가 켜진다)
      var ag = $('#againEnh', o); if (ag && !ag.hidden) { ag.disabled = true; setTimeout(function () { ag.disabled = false; }, 600); }
    }, 1250);
  }
  function againTxt(w, g, r) { var c = enhCostOf(g); return w + ' <small class="bsub"><i>+' + g.enh + ' → +' + (g.enh + 1) + '</i><i>' + r + '%</i><i>' + (s.gold < c ? '골드 부족 ' : '') + fmtN(c) + 'G</i></small>'; }
  ask();
  o.addEventListener('click', function (e) {
    if (rolling) { e.stopPropagation(); return; }
    if (e.target.closest('#yesEnh')) { A('tap'); go(); return; }
    if (e.target.closest('#protEnh')) { var px = enhGear(ref); if (px) { protPick = !protOn(px.g); A('tap'); ask(); } return; }
    if (e.target.closest('#yesRisk')) { A('tap'); roll(); return; }
    var ab = e.target.closest('#againEnh');
    if (ab) { if (performance.now() < readyAt) return; A('tap'); go(); return; }
    if (e.target.closest('#swapEnh')) { var cid = ref.ch; A('tap'); o.close(); if (cid) pickGear(cid, enhSl(ref), opt.parent || null); return; }
  }, true);
  o.onclose = function () { if (enhOpen === o) enhOpen = null; if (opt.close) opt.close(); };
  return o;
}
DS.forgeOpen = forgeOpen;      // 가방 자세히 창(loot.js)이 쓴다
// 대장간 목록 한 줄의 강화 정보: 다음 단계·확률
function enhTag(g) { var r = DS.enhRate(g); return r ? '<small class="enht">다음 <b class="' + enhCls(g.enh + 1) + '">+' + (g.enh + 1) + '</b> 성공 <b>' + r + '%</b></small>' : '<small class="enht">최고 단계 +' + g.enh + '</small>'; }
var FORGE_SL = 'w';      // 대장간의 탭: 'w' 무기 · 'a' 방어구 (DS.openShop('armor') 로 열면 방어구부터)
function forge(parent, sl0) {
  if (sl0 === 'a' || sl0 === 'w') FORGE_SL = sl0;
  var o = sheet('대장간', function () {
    var s = G.save, html = '', sl = FORGE_SL, W = sl === 'a' ? '방어구' : '무기';
    html += '<div class="kvbox fgrule"><h5>강화 규칙 <small>한 번에 한 단계, +' + DS.ENH.max + '까지</small></h5><dl class="kvr"><dt>무기</dt><dd>' + DS.chip('공격·마공', '+' + Math.round(DS.ENH.amp * 100) + '%', 1) + '<small>단계마다</small></dd><dt>방어구</dt><dd>' + DS.chip('방어·마방', '+' + Math.round(DS.ENH.ad * 100) + '%', 1) + '<small>단계마다</small></dd>' +
      '<dt>값</dt><dd>단계가 오를수록 비싸다</dd><dt class="warn">실패</dt><dd><b class="warn">' + (DS.ENH.safe ? '+' + (DS.ENH.safe + 1) + '부터 부서진다' : '부서진다') + '</b>' + (DS.ENH.safe ? '<small>+' + DS.ENH.safe + '까지는 남는다</small>' : '') + '</dd>' +
      (s.items.prot > 0 && DS.ITEMS.prot ? '<dt>보호 부적</dt><dd>' + DS.chip('가진 것', s.items.prot + '개', 0) + '<small>실패해도 부서지지 않는다</small></dd>' : '') + '</dl><h5 class="sub">단계별 성공 확률</h5>' + rateTable(0) + '</div>' +      // r45 ui: 한 문단 → 규칙 표 · 2.1.0: +20 까지, 보호 부적
      '<p class="hint sm">장비는 적에게서만 얻는다. 장비의 힘은 입은 사람의 레벨을 따르니, 아끼는 장비를 강화해 오래 쓴다.</p>' + protShelf(s);
    html += '<nav class="chips2 lt2 fsl"><button data-fsl="w"' + (sl === 'w' ? ' aria-current="true"' : '') + '>무기</button><button data-fsl="a"' + (sl === 'a' ? ' aria-current="true"' : '') + '>방어구</button></nav>';
    html += '<h4>쓰고 있는 ' + W + ' <i class="own">가문 순서</i></h4>';
    var any = false;
    partyFirst().forEach(function (ch) {
      var g = DS.gear(ch[sl]);
      if (!g) { html += '<div class="row grow dim">' + charSpr(ch, 2) + '<div class="tx"><b>' + esc(DS.flagName(ch.cls)) + benchTag(ch) + '</b><small>' + (sl === 'a' ? '맨몸' : '맨손') + '</small></div><button class="btn small" data-enh-pick="' + ch.id + '">장착</button></div>'; return; }
      any = true;
      var r = DS.enhRate(g), lk = s.lock && s.lock[g.id];
      html += '<div class="row grow">' + (DS.iconHtml ? DS.iconHtml('gear', g.id) : charSpr(ch, 2)) + '<div class="tx">' + gearRowName(g) + '<small>' + esc(DS.flagName(ch.cls)) + benchTag(ch) + offTag(ch, g) + (lk ? ' <i class="llock">잠김</i>' : '') + '</small>' + enhTag(g) + '</div>' +
        enhBtn(g, 'data-enh-ch="' + ch.id + '"') + '</div>';
    });
    if (!any) html += '<p class="hint">' + W + ' 장착한 가문 없음</p>';
    var users = function (g) { return partyFirst().filter(function (c) { return DS.canEquip(c, g.id); }); };
    var bag = Object.keys(s.gear).filter(function (id) { var g = DS.gear(id); return g && g.slot === sl && s.gear[id] > 0; }).sort(function (a, b) {
      var ga = DS.gear(a), gb = DS.gear(b), fit = function (g) { return users(g).some(function (c) { return DS.gearFits(c.cls, g); }) ? 1 : 0; }; return fit(gb) - fit(ga) || DS.gearScore(gb) - DS.gearScore(ga);
    });
    var fk = 'forgebag' + sl;      // r12: 가방 속은 접어 둔다 (입고 있는 것만 펴고)
    if (bag.length) html += foldBtn(fk, '가방 속 ' + W + ' ' + bag.length + '종', '병과에 맞는 것 먼저');
    else html += '<p class="hint dimh">가방에 ' + W + ' 없음</p>';
    if (FOLD[fk]) bag.forEach(function (id) {
      var g = DS.gear(id), r = DS.enhRate(g), us = users(g), lk = s.lock && s.lock[id];
      var fits = us.filter(function (c) { return DS.gearFits(c.cls, g); });      // 2.1.0: 누구나 입는다 — 병과에 맞는 가문만 알약으로 (계열은 줄 머리에)
      html += '<div class="row grow">' + (DS.iconHtml ? DS.iconHtml('gear', id) : '') + '<div class="tx">' + gearRowName(g) + '<small class="lmeta"><i class="lcnt">×' + s.gear[id] + '</i>' + (lk ? '<i class="llock">잠김</i>' : '') + (fits.length ? fits.slice(0, 3).map(function (c) { return '<i class="who" title="맞는 가문">' + esc(DS.flagName(c.cls)) + '</i>'; }).join('') : '<i class="warn goff">맞는 가문 없음</i>') + '</small>' + enhTag(g) + '</div>' +
        enhBtn(g, 'data-enh-id="' + id + '"') + '</div>';
    });
    return html;
  }, 'forge');
  o.addEventListener('click', function (e) {
    var bc = e.target.closest('[data-enh-ch]'), bi = e.target.closest('[data-enh-id]'), bp = e.target.closest('[data-enh-pick]'), bt = e.target.closest('[data-fsl]'), br = e.target.closest('[data-prot]');
    if (br) { protBuy(o); return; }
    if (bt) { if (FORGE_SL !== bt.dataset.fsl) { FORGE_SL = bt.dataset.fsl; A('tap'); o.draw(); } return; }
    if (bp) { A('tap'); pickGear(+bp.dataset.enhPick, FORGE_SL, o); return; }
    if (!bc && !bi) return;
    A('tap'); forgeOpen(bc ? { ch: +bc.dataset.enhCh, sl: FORGE_SL } : { id: bi.dataset.enhId }, { parent: o, close: function () { if (o.isConnected) o.draw(); } });
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
}
// ── r4 forge: 지휘관 창의 장비 줄 — 무기는 바로 「강화」, 가방에 더 좋은 것이 있으면 한 번에 「입기」 ──
function bestInBag(ch, sl) {
  var s = G.save, cur = DS.gearScore(DS.gear(ch[sl]), ch), best = null, bs = cur;      // 2.1.0: 그 사람의 레벨·병과로 잰다
  for (var id in s.gear) { var g = DS.gear(id); if (g && g.slot === sl && s.gear[id] > 0 && DS.canEquip(ch, id) && DS.gearScore(g, ch) > bs + 0.5) { bs = DS.gearScore(g, ch); best = id; } }
  return best;
}
function cmdGearRow(ch, sl) {      // r12: 줄을 누르면 교체 시트, 줄 끝은 「강화」 하나
  var g = DS.gear(ch[sl[0]]), r = g ? DS.enhRate(g) : 0, bb = bestInBag(ch, sl[0]), h = '';
  var cst = g ? (DS.gearStatTxt ? DS.gearStatTxt(g, DS.gearAt(g, ch.L, ch.cls, ch.gt)) : g.stat) : '', coff = g && DS.gearFits && !DS.gearFits(ch.cls, g);      // 2.1.0: 그 사람의 레벨·병과로
  h += '<div class="row cgear cg2" data-gear="' + sl[0] + '">' + (g && DS.iconHtml ? DS.iconHtml('gear', g.id) : '') + '<div class="tx">' + (g ? gearRowName(g) + (DS.statChips ? DS.statChips(cst, '', coff && DS.gearOffChip ? DS.gearOffChip() : '') : '<small>' + cst + offTag(ch, g) + '</small>') + '' : '<b>' + sl[1] + ' 없음</b><small>눌러서 가방에서 고른다</small>') + '</div>' +
    (r ? enhBtn(g, 'data-enh-' + sl[0] + '="' + ch.id + '"') : '') + '</div>';
  if (bb) { var bg = DS.gear(bb); h += '<div class="row cbetter"><div class="tx"><small class="lup">▲ 가방에 더 좋은 것 <b>' + esc(bg.name) + '</b></small><small class="df">' + diffHtml(gearDiff(ch, bb), 3) + '</small></div><button class="btn small" data-qwear="' + esc(bb) + '">장착</button></div>'; }
  return h;
}
// charSheet 의 클릭에서 부른다: 처리했으면 true
function cmdGearClick(e, chId, o) {
  var s = G.save, ch = s.chars[chId], b;
  if ((b = e.target.closest('[data-enh-w], [data-enh-a]'))) { A('tap'); forgeOpen({ ch: chId, sl: b.hasAttribute('data-enh-a') ? 'a' : 'w' }, { parent: o, close: function () { if (o.isConnected) o.draw(); } }); return true; }
  if ((b = e.target.closest('[data-qwear]'))) {
    var id = b.dataset.qwear, g = DS.gear(id);
    if (ch && g && DS.equip(s, ch, id)) { A('ok'); DS.refreshUnits(); U.persist(); toast(DS.charName(ch) + ': ' + g.name + ' 착용'); o.draw(); }
    return true;
  }
  return false;
}
// 지휘관 창에서 장비 바꾸기
function pickGear(chId, slot, parent) {
  var o = sheet(slot === 'w' ? '무기 바꾸기' : '방어구 바꾸기', function () {
    var s = G.save, ch = s.chars[chId], cur = DS.gear(ch[slot]), html = '';
    html += '<div class="row"><div class="tx">' + (cur ? gearLine(cur, ch) + '<small>지금 쓰는 것</small>' : '<b>맨몸</b>') + '</div>' + (cur ? '<button class="btn small" data-off="1">해제</button>' : '') + '</div>';
    var list = Object.keys(s.gear).filter(function (id) { var g = DS.gear(id); return g && g.slot === slot && s.gear[id] > 0; }).sort(function (a, b) { return DS.gearScore(DS.gear(b), ch) - DS.gearScore(DS.gear(a), ch); });      // 2.1.0: 누구나 입는다 (맞지 않는 병과는 −10%)
    if (!list.length) html += '<p class="hint">가방에 장비 없음. 적에게서 얻는다</p>';
    list.forEach(function (id) {
      var g = DS.gear(id), ok = DS.canEquip(ch, id);
      html += '<div class="row' + (ok ? '' : ' dim') + '"><div class="tx">' + gearLine(g, ch) + '<small>' + s.gear[id] + '개 보유</small>' + (ok ? '<small class="df">' + diffHtml(gearDiff(ch, id), 4) + '</small>' : '') + '</div>' +
        (ok ? '<button class="btn small gold" data-on="' + id + '">장착</button>' : '<span class="why">입을 수 없음</span>') + '</div>';
    });
    return html;
  }, 'sub');
  o.addEventListener('click', function (e) {
    var s = G.save, ch = s.chars[chId], on = e.target.closest('[data-on]'), off = e.target.closest('[data-off]');
    if (on && DS.equip(s, ch, on.dataset.on)) { A('ok'); DS.refreshUnits(); U.persist(); o.close(); }
    else if (off) { DS.unequip(s, ch, slot); A('cancel'); DS.refreshUnits(); U.persist(); o.close(); }
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
}

// ───────── 사람 한 줄 · 사람 창 · 영웅관(모집) ─────────
function gcol(g) { return DS.GRADES[g].col; }
function mercSpr(m, px) { var M = DS.MERCS[m.type]; return M.big ? sprTag(M.sprite, M.pal, (px || 2) * 0.75) : sprTag(m.type + '_' + m.g + '_' + (m.v || 0), '', px || 2); }
function mercById(id) { return G.save.mercs.filter(function (x) { return x.id === id; })[0] || null; }
// 특성의 효과 한 마디 (좁은 칸용)
var TR_SHORT = { brave: '위기에 공격 +20%', medic: '물러나면 회복', survivor: '쓰러질 때 한 번 버팀' };
function trShort(id) { var T = DS.TRAITS[id]; if (!T) return ''; return T.short || TR_SHORT[id] || (T.desc && T.desc.length <= 12 ? T.desc : ''); }
function traitTxt(m) { var T = DS.TRAITS[m.t]; if (!T) return ''; var s = trShort(m.t); return T.name + (s ? '<i class="fx">' + esc(s) + '</i>' : ''); }
function quirkOf(m) { return m.q && DS.QUIRKS && DS.QUIRKS[m.q] ? DS.QUIRKS[m.q] : null; }      // 버릇(둘째 특성)
function mercTtl(m) { var t = DS.mercTitle ? DS.mercTitle(m) : ''; return t ? '<i class="ttl">' + esc(t) + '</i> ' : ''; }      // 전공 별명
// r8 menus (trim 6): 줄에는 [별명] 이름 · 종류 · 공훈 · 특성 이름까지만. 특성 효과·버릇·든 물건·나이는 「살펴보기」에서 (노년·인구 2만 줄에 남긴다)
function mercSub(m) {      // r45 ui: 「6단 Lv6, 투지, 16살」 → 단 · 특성 · 나이 꼬리표
  var out = '<i class="mlv">' + lv(DS.pL(m)) + '</i>';      // r42: 개인 단·레벨
  if (DS.TRAITS[m.t]) out += '<i class="mtr">' + esc(DS.TRAITS[m.t].name) + '</i>';
  return '<span class="msub">' + out + agTag(m).trim() + '</span>';      // r16 person: 나이는 늘 (노년, 장수 꼬리표)
}
// 2.2.0: 사람의 자리 이름 — 가주 · 막사 · 가문원 (맹주는 따로)
function roleOf(m) { var s = G.save; return !m ? '' : m.h && m.o && m.o !== s.hero ? '가주' : DS.isSb(m) ? '막사' : m.o ? '가문원' : ''; }
function mercChip(m, ch) {
  var pl = roleOf(m);
  return mercSpr(m, 2) + '<span class="mn">' + mercTtl(m) + '<b>' + esc(m.n || '') + '</b> ' + gpips(m.g) + ' <span class="mk">' + DS.MERCS[m.type].name + (ch && DS.mercMatch(ch, m) ? ' <i class="match mdot" role="img" aria-label="병과 일치"></i>' : '') + '</span>' + (m.lk ? ' <i class="mlk">잠김</i>' : '') + (m.nf ? ' <i class="mlk nf">✎ 이름</i>' : '') + (m.cast ? ' <i class="mlk">본가</i>' : '') + (pl ? ' <i class="mlk">' + pl + '</i>' : '') + '<small>' + mercSub(m) + '</small></span>';
}
// 따르는 자리(가문원)에서의 실제 능력 (병과 일치·등급·공훈·특성이 다 들어간 숫자)
function mercNum(ch, m) { var sp = DS.mercSpec(ch, m); return { hp: sp.mhp, atk: sp.atk, def: sp.def, res: sp.res, spd: Math.round(sp.spd * 10) / 10 }; }
function mercPow(ch, m) { if (DS.mercPower) return DS.mercPower(ch, m); var n = mercNum(ch, m); return n.hp * 0.25 + n.atk * 3 + n.def * 1.2 + n.res * 0.6; }
function mercStatLine(n, base) {
  return [['hp', 'HP'], ['atk', '공격'], ['def', '방어'], ['res', '마방']].map(function (k) {
    var d = base ? n[k[0]] - base[k[0]] : 0;
    return '<i>' + k[1] + ' <b class="num">' + n[k[0]] + '</b>' + (d ? '<em class="' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '▲' : '▼') + Math.abs(d) + '</em>' : '') + '</i>';
  }).join('');
}
// ── r12 screen: 부대원 한 줄 · 사람 창 · 고르기 시트 · 막사(여럿 고르기) ──
// 단추 위치 문법: 줄을 누르면 살펴본다(「살펴보기」 단추 없음) · 명부의 사람 줄 끝에는 단추가 없다 · 맡기는 일은 깃발 카드의 칸에서 · 되돌릴 수 없는 것은 창 맨 아래 붉은 단추 하나
function mercLine(m) { return '<b>' + esc(DS.mercCall(m) || '') + '</b> ' + gpips(m.g) + ' <i class="own">' + DS.MERCS[m.type].name + ', ' + lv(DS.pL(m)) + '</i>'; }
// 내보낸다: 들린 물건은 가방으로 (쓰러질 때만 잃는다). 가방으로 돌아온 물건 이름들
function fireMercs(s, list) {
  var back = [];
  list.forEach(function (m) { if (m.it && DS.giveMercItem) { var k = m.it; if (DS.giveMercItem(s, m.id, null) && DS.ITEMS[k]) back.push(DS.ITEMS[k].name); } DS.loseMerc(s, m.id); });
  DS.rebuildParty(); DS.updateQuest(); U.persist();
  return back;
}
// 3.0 가계도: 가족(배우자·자식·부모)인 부대원을 내보내면 혼인이 끝나고 가문을 떠난다
function famWarn(s, m) {
  try {
    if (!DS.linOf || !DS.linSpouse) return '';
    var p = DS.linOf(s, m); if (!p) return '';
    var sp = DS.linSpouse(s, p.id), kids = DS.linKids ? DS.linKids(s, p.id).filter(function (q) { return q.st === 'live'; }) : [], pa = DS.linParents ? DS.linParents(s, p.id).filter(function (q) { return q.st === 'live'; }) : [];
    var bits = [];
    if (sp && sp.st === 'live') bits.push(esc(DS.linName(s, sp.id)) + '의 배우자');
    if (pa.length) bits.push(pa.map(function (q) { return esc(DS.linName(s, q.id)); }).join(', ') + '의 자식');
    if (kids.length) bits.push('자식 ' + kids.length + '명의 부모');
    return bits.length ? '<p class="mwarn">' + bits.join(', ') + '<br>방출하면 혼인이 끝나고 가문을 떠난다</p>' : '';
  } catch (e) { return ''; }
}
function fireWhy(m) { return m.cast ? '방출 불가: 자기 가문의 사람' : m.h ? '방출 불가: 가주' : !DS.isSb(m) ? '방출 불가: 맹주 집 사람' : m.lk ? '방출 불가: 잠김' : ''; }      // 2.2.0: 내보낼 수 있는 이는 막사의 사람뿐
// 내보내기 확인 (하나든 여럿이든 같은 창). 확인 단추만 「내보낸다」
function askFire(ids, done) {
  var s = G.save; ids = [].concat(ids);
  if (busy()) { no('전투 중', '전투 중에는 방출할 수 없다'); return; }
  var list = ids.map(mercById).filter(Boolean);
  var bad = list.filter(function (m) { return fireWhy(m); });
  if (list.length === 1 && bad.length) { A('cancel'); toast(fireWhy(bad[0])); return; }
  list = list.filter(function (m) { return !fireWhy(m); }); if (!list.length) return;
  var its = list.filter(function (m) { return m.it && DS.ITEMS[m.it]; }).length, one = list.length === 1 ? list[0] : null;
  var q = overlay('<div class="result mfirebox"><h2>' + (one ? esc(josa(DS.mercCall(one), '을를')) + ' 방출할까?' : list.length + '명을 방출할까?') + '</h2>' +
    (one ? '<div class="mwho">' + mercSpr(one, 3) + '<span>' + mercLine(one) + '<small>함께한 전투 ' + (one.b || 0) + ', 처치 ' + (one.k || 0) + '</small></span></div>' : '<ul class="mlist">' + list.map(function (m) { return '<li>' + mercLine(m) + '</li>'; }).join('') + '</ul>') +
    (its ? '<p class="mnote">장착한 물건 ' + its + '개: 가방으로</p>' : '') + (one ? famWarn(s, one) : '') +
    '<p class="mwarn">되돌릴 수 없음</p><button class="btn red wide" id="yesFire">방출</button><button class="btn wide" data-close>취소</button></div>', 'modal center');
  var ids2 = list.map(function (m) { return m.id; });
  $('#yesFire', q).addEventListener('click', function () {
    if (q.dataset.done) return; q.dataset.done = '1'; q.close(); if (busy()) return;
    var now = ids2.map(mercById).filter(function (m) { return m && !fireWhy(m); }); if (!now.length) return;
    var nm = now.length === 1 ? DS.mercCall(now[0]) : '', back = fireMercs(s, now); A('cancel');
    toast((nm ? josa(nm, '을를') : now.length + '명을') + ' 방출했다.' + (back.length ? ' 물건 ' + back.length + '개는 가방으로.' : ''));
    if (done) done(now);
  });
}
// 어느 창이든 [data-fire] 단추 하나로. 끝나면 그 창을 다시 그리거나(data-fclose 면) 닫는다
document.addEventListener('click', function (e) {
  var f = e.target && e.target.closest ? e.target.closest('.ov [data-fire]') : null; if (!f) return;
  var o = f.closest('.ov'); A('tap');
  askFire(+f.dataset.fire, function () { if (!o || !o.isConnected) return; if (f.dataset.fclose) o.close(); else if (o.draw) o.draw(); });
});
// r45 ui · 2.1: 잠재력 = 등급 → 별 대신 등급 이름표 gbadge (별 ★ 은 가문 공훈에만)
function placeOf(m) {      // 지금 자리 한 줄과 그 가문 번호 (2.2.0: 가주 · 막사 · 가문원). 막사면 ch = 가주로 설 수 있는 같은 병과 가문 (없으면 0)
  var s = G.save, own = m && m.o && s.chars[m.o] ? s.chars[m.o] : null;
  if (m && DS.isSb(m)) { var hm = DS.sbHome ? DS.sbHome(s, m) : null; return { t: '막사', ch: hm ? hm.id : 0, k: 'sb' }; }
  if (!own) return { t: '자리 없음', ch: 0, k: '' };
  if (m.h && own.id !== s.hero) return { t: DS.flagName(own.cls) + ' 가주', ch: own.id, k: 'bear' };
  return { t: DS.flagName(own.cls) + ' 가문원', ch: own.id, k: 'fol' };
}
// ───────── r46 sheet: 사람 창 · 가문 창의 같은 틀 ─────────
// 머리(초상 · 이름 · 자리 · 등급 · 단 · 큰 전투력) → 막대(HP · 마나 · 경험치) → 할 일(자리 · 교체 · 보내기) → 능력치 막대 → 특성 칩 → 접힌 「자세히」
function gcolOf(g) { var G0 = DS.GRADES[Math.max(1, Math.min(5, g | 0))] || {}; return G0.col || '#8a867d'; }
function vb(k, lab, frac, txt) { var w = Math.max(0, Math.min(100, (+frac || 0) * 100)); return '<div class="vb2 ' + k + '"><i>' + lab + '</i><span class="vt"><u style="width:' + w.toFixed(1) + '%"></u></span><b class="num">' + txt + '</b></div>'; }
function expBar(who) {
  var L = DS.pL(who), cap = DS.pCap(who), e = +(who && who.exp) || 0, need = DS.expNeed(L), top = L >= cap;
  return vb('xp', '경험치', top ? 1 : e / need, top ? (cap < 100 ? '합일 대기' : '최고') : Math.floor(e / need * 100) + '%');
}
function meritBar(ch) { var nx = DS.hNext(ch), x = +(ch.hx || 0); return vb('mr', '공훈', nx ? (x - nx.from) / (nx.at - nx.from) : 1, '가주 +' + DS.hPct(ch) + '%'); }
// u = 그 자리의 유닛 사양 · hpF/mpF = 지금 남은 몫(0~1, 없으면 가득) · who = 경험치 막대의 사람
function vitBars(u, hpF, mpF, who, more) {
  var h = '';
  if (u) {
    var hf = hpF == null ? 1 : Math.max(0, Math.min(1, +hpF)); h += vb('hp', 'HP', hf, fmtN(Math.ceil(u.mhp * hf)) + '/' + fmtN(u.mhp));
    if (u.mmp > 0) { var mf = mpF == null ? 1 : Math.max(0, Math.min(1, +mpF)); h += vb('mp', '마나', mf, fmtN(Math.round(u.mmp * mf)) + '/' + fmtN(u.mmp)); }
  }
  if (who) h += expBar(who);
  return h || more ? '<div class="vbs">' + h + (more || '') + '</div>' : '';
}
// 머리: o = { spr, g(테 색 — 사람 등급 · 가문은 깃발 색 fc), name(HTML), sn, tags(HTML), lv(사람 — 단·Lv 알약), pow, powLab, cls }
function sheetHead(o) {
  return '<div class="ph2' + (o.cls ? ' ' + o.cls : '') + '" style="--gc:' + (o.fc || gcolOf(o.g)) + '"><div class="ppor">' + o.spr + '</div><div class="pid"><h2>' + o.name + (o.sn ? ' <small>' + esc(o.sn) + '</small>' : '') + '</h2>' +
    '<p class="ptg">' + o.tags + '</p>' + (o.lv ? '<p class="plv">' + pTier(o.lv) + '</p>' : '') + '</div>' + (o.pow != null ? '<div class="ppw"><small>' + (o.powLab || '전투력') + '</small>' + pwNum(o.pow) + '</div>' : '') + '</div>';
}
// 능력치 막대: 같은 레벨의 다른 가문(가문원이면 같은 가문의 다른 종류)과 견준 자리(레이더와 같은 0~100) + 작은 실제 숫자
var SB2 = [['hp', '체력'], ['off', '공격'], ['def', '방어'], ['res', '마방'], ['spd', '속도'], ['crit', '치명']];
function statBars(seat, who) {
  var ref = rdRef(seat), u = null; try { u = seatSpec(seat, who); } catch (x) { u = null; } if (!ref || !u) return '';
  var sc = rdScore(rdRaw(u), ref), mag = (u.mag || 0) > (u.atk || 0);
  var val = { hp: fmtN(u.mhp), off: fmtN(mag ? u.mag : u.atk), def: fmtN(u.def), res: fmtN(u.res), spd: String(Math.round(u.spd * 10) / 10), crit: Math.round((u.crit == null ? 0.06 : u.crit) * 100) + '%' };
  var ex = ['사거리 ' + u.rng[0] + '~' + u.rng[1], '기술 ' + (u.skills || []).length].concat(u.drain ? ['흡혈 ' + Math.round(u.drain * 100) + '%'] : []);
  return '<div class="sbars">' + SB2.map(function (a) { var v = sc[a[0]]; return '<div class="sbr' + (v >= RD_TOP ? ' hi' : v < 30 ? ' lo' : '') + '"><i>' + (a[0] === 'off' && mag ? '마공' : a[1]) + '</i><span class="st"><u style="width:' + v + '%"></u></span><b class="num">' + val[a[0]] + '</b></div>'; }).join('') + '</div>' +
    '<p class="sbx">' + ex.map(function (t) { return '<i>' + esc(t) + '</i>'; }).join('') + '<small>' + esc(pst('barNote', '막대: 같은 레벨 기준')) + '</small></p>';
}
// 견주기 (사람 창): 고른 사람이 있을 때만 레이더를 겹쳐 그린다
function cmpBlock(key, seat, who) {
  var c = CMP[key], other = c ? (c === 'h' ? (heroCh() || {}).ps : mercById(+String(c).slice(1))) : null;
  if (c && !other) { delete CMP[key]; other = null; }
  if (!other) return '';
  var oname = c === 'h' ? DS.charName(heroCh()) : other.n || '', nm = key === 'h' ? DS.charName(heroCh()) : (who && who.n) || '';
  return '<div class="cmp2"><div class="rdg">' + radarSvg(seat, who, other) + rdLegend(nm, oname) + '</div><p class="pwd2">' + pwDelta(seatPow(seat, who), seatPow(seat, other)) + '</p><button class="btn small" data-cmpx="1">비교 끄기</button></div>';
}
function statHead(key) { return '<h4 class="hbtn">능력치' + (key && !CMP[key] ? '<button class="btn small" data-cmp="' + key + '">비교</button>' : '') + '</h4>'; }
// 특성 칩: 태생 · 특성 · 버릇 · 성격 (효과는 짧게)
function trChips(who, bfl) {
  var T = DS.TRAITS[who.t], q = quirkOf(who), N = DS.mercNature ? DS.mercNature(who) : null, out = [];
  out.push(['태생', esc(DS.nativeName ? DS.nativeName(who) : ''), bfl && DS.bnNative ? (DS.bnNative(bfl.cls, who) ? '<em class="ok">가문과 맞음</em>' : '<em class="no">가문과 다름</em>') : '']);
  if (T) out.push(['특성', esc(T.name), esc(trShort(who.t))]);
  if (q) out.push(['버릇', esc(q.name), esc(q.short || '')]);
  if (N) out.push(['성격', esc(N.name), '']);
  if (DS.KIND_GROW && who.type && DS.KIND_GROW[who.type]) out.push(['성장', '장수 종족', '더디게 큼']);
  return '<div class="trs2">' + out.map(function (x) { return '<span class="tr2c"><i>' + x[0] + '</i><b>' + x[1] + '</b>' + (x[2] ? '<small>' + x[2] + '</small>' : '') + '</span>'; }).join('') + '</div>';
}
// 필살기: 이름 한 줄 (누르면 자세히)
function ultChip(who, key) {
  var s = G.save; if (!who || !DS.ULT || !DS.ultFor) return '';
  var id = DS.ultFor(s, who), S = id && DS.SKILLS[id]; if (!S) return '';
  var on = !!(DS.ultAwake && DS.ultAwake(who)), fk = 'ult' + key;
  return foldBtn(fk, '<span class="ulc' + (on ? '' : ' lk') + '">✦ ' + esc(S.name) + '</span>', on ? '타고난 필살기' : '타고난 필살기. 개인 5단에 깨어난다') + (FOLD[fk] ? '<div class="fold-in">' + ultBlock(who) + '</div>' : '');
}
// 접힌 「자세히」: 등급·단 사다리 · 전투력 내역 · 기질 · 능력치 합 · 성장 · 기록
function personMore(key, seat, who, parts, rec) {
  var h = foldBtn('pmore', '자세히', '등급과 단, 전투력 내역, 기질, 기록');
  if (!FOLD.pmore) return h;
  return h + '<div class="fold-in pmore">' + rankBlock(who, key !== 'h', seat.k === 'fol') + (parts ? '<h4>전투력 내역</h4>' + pwTable(parts) : '') +
    '<div class="pmx">' + sumLine(seat, who) + potLine(key, who) + tmLine(who) + '</div>' + (rec || '') + '</div>';
}
// 사람 창 (부대원 한 사람): 가주 · 막사 · 가문원
U.takeSnap = takeSnap;
U.mercInfo = function (id, parent) { return mercInfo(id, parent); };      // r13: 화면 시험(사람 창)이 부른다
function mercInfo(id, parent) {
  var o = sheet('인물', function () {
    var s = G.save, m = mercById(id); if (!m) return '<p class="hint">떠난 사람</p>';
    var ttl = DS.mercTitle ? DS.mercTitle(m) : '', pl = placeOf(m), ph = pl.ch && s.chars[pl.ch] ? s.chars[pl.ch] : null, seat = pplSeat(m), u = null, key = 'm' + m.id;
    try { u = seatSpec(seat, m); } catch (x) { u = null; }
    var og = null; if (DS.mercOrigin) { try { og = DS.mercOrigin(m); } catch (x) { og = null; } }
    var tag = DS.castTag ? DS.castTag(m) : '', pct = Math.round((DS.BAL.sbShare || 0) * 100);
    var pow = pl.k === 'bear' && ph ? DS.flagPower(s, ph, m) : pl.k === 'fol' && ph ? DS.power(DS.mercSpec(ph, m)) : seatPow(seat, m);
    var tags = '<i class="rtag r-' + (pl.k || 'bar') + '">' + esc(roleOf(m) || '자리 없음') + '</i>' + gbadge(m.g) + '<i class="ctag">' + esc(DS.MERCS[m.type].name) + '</i>' + (m.sx ? '<i class="ctag sx-' + esc(m.sx) + '">' + esc(lgSexTxt(m.sx)) + '</i>' : '') + agTag(m) + (tag ? '<i class="ctag">' + esc(tag) + '</i>' : '') + (ttl ? '<i class="ttl">' + esc(ttl) + '</i>' : '');
    var html = sheetHead({ spr: mercSpr(m, 4), g: m.g, name: esc(m.n || ''), sn: m.sn, tags: tags, lv: m, pow: pow, powLab: pl.k === 'sb' ? (ph ? '가주가 되면' : '전투력') : '전투력' });
    html += vitBars(u, m.hp, pl.k === 'bear' && ph ? ph.mp : 1, m);
    if (pl.k === 'sb') html += '<button class="row place pl2" data-goflag="' + pl.ch + '"' + (pl.ch ? '' : ' disabled') + '>' + (ph ? crestH(ph, 20) : '') + '<span class="tx"><b>막사에서 기다린다</b><small>' + esc((ph ? DS.flagName(ph.cls) + '이 비면 저절로 가주가 된다' : heroFits(s, m) ? '맹주와 같은 병과. 맹주가 쓰러지면 뒤를 이을 수 있다' : '같은 병과 가문이 없다') + '. 같은 병과 가주가 얻는 경험치의 ' + pct + '%를 함께 얻는다') + '</small></span>' + (pl.ch ? '<i class="go" aria-hidden="true">›</i>' : '') + '</button>';
    else if (ph) html += '<button class="row place pl2" data-goflag="' + ph.id + '">' + crestH(ph, 20) + '<span class="tx"><b>' + esc(pl.t) + '</b><small class="fx2">' + hFx(ph, pl.k === 'fol') + '</small></span><i class="go" aria-hidden="true">›</i></button>';
    html += statHead(key) + statBars(seat, m) + cmpBlock(key, seat, m);
    var bfl = DS.bearsFlag ? DS.bearsFlag(s, m) : null; if (!bfl && pl.k === 'sb' && ph) bfl = ph;      // r27: 태생 병과 (가주·막사면 그 가문과 맞는지)
    html += trChips(m, bfl) + ultChip(m, key);
    var hasMI = DS.lootUI && DS.lootUI.mercItem && (m.it || Object.keys(DS.MGEAR || {}).some(function (k) { return (s.items[k] || 0) > 0; }));
    if (hasMI || m.it) html += '<div class="row mit2"><div class="tx"><b>장착 물건</b><small>' + (m.it && DS.ITEMS[m.it] ? esc(DS.ITEMS[m.it].name) : '없음') + '</small></div>' + (hasMI ? '<button class="btn small' + (m.it ? '' : ' gold') + '" data-act="mitem">' + (m.it ? '교체' : '장착') + '</button>' : '') + '</div>';
    html += lgSpouseRow('merc', m.id);      // r4 가문
    var rec = '<dl class="kv tr2"><dt>함께한 전투</dt><dd class="num">' + (m.b || 0) + '</dd><dt>처치</dt><dd class="num">' + (m.k || 0) + '</dd>' + natureRow(m) + (og && og.name ? '<dt>출신</dt><dd><b>' + esc(og.name) + '</b>' + (og.desc ? ' <small class="dim">' + esc(og.desc) + '</small>' : '') + '</dd>' : '') + '</dl>' + agRow(m);
    var parts = pl.k === 'bear' && ph ? DS.powerParts(s, ph, m) : pl.k === 'fol' && ph ? DS.mercParts(s, ph, m) : null;
    html += personMore(key, seat, m, parts, rec);
    if (DS.rnBtn) html += DS.rnBtn('m', m.id);      // r10 social: 개명권
    var why = m.cast ? '자기 가문의 사람' : m.h ? '가주' : !DS.isSb(m) ? '맹주 집 사람' : '';
    html += '<div class="dangerz"><button class="btn' + (m.lk ? ' gold' : '') + '" data-act="lock" aria-pressed="' + (m.lk ? 'true' : 'false') + '">' + (m.lk ? '잠김' : '잠금') + '</button>' +
      '<button class="btn red mfire" data-act="fire"' + (m.lk || why ? ' disabled' : '') + '>방출</button></div>' + (why ? '<p class="dz">방출 불가: ' + why + '</p>' : m.lk ? '<p class="dz">잠김: 방출 대상에서 제외</p>' : '');
    return '<div class="cs2">' + html + '</div>';
  }, 'sub');
  o.addEventListener('click', function (e) {
    if (lgRowClick(e, o)) return;      // r4 가문
    var mm0 = mercById(id); if (mm0 && cmpClick(e, o, 'm' + id, pplSeat(mm0))) return;      // r16 person: 비교
    var gf = e.target.closest('[data-goflag]'); if (gf && +gf.dataset.goflag) { A('tap'); charSheet(+gf.dataset.goflag, o); return; }
    if (e.target.closest('[data-act="mitem"]')) { var mm = mercById(id); if (mm && DS.lootUI && DS.lootUI.mercItem) { A('tap'); DS.lootUI.mercItem(G.save, mm.id, function () { if (o.isConnected) o.draw(); }); } return; }
    if (e.target.closest('[data-act="lock"]')) { var ml = mercById(id); if (!ml) return; if (ml.lk) delete ml.lk; else ml.lk = 1; A('tap'); U.persist(); o.draw(); return; }
    if (!e.target.closest('[data-act="fire"]')) return;
    A('tap'); askFire(id, function () { o.close(); });
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
}
// 사람 창 (맹주). 같은 틀 — 내보내기 대신 혼인과 개명
function heroInfo(parent) {
  var o = sheet('대장', function () {
    var s = G.save, ch = s.chars[s.hero]; if (!ch) return '';
    var p = ch.ps || {}, seat = { k: 'hero', ch: ch }, u = null; try { u = seatSpec(seat, p); } catch (x) { u = null; }
    var tags = '<i class="rtag r-hero">맹주</i>' + gbadge(p.g || 3) + '<i class="ctag">' + (p.type && DS.MERCS[p.type] ? DS.MERCS[p.type].name : '사람') + '</i>' + (ch.sx ? '<i class="ctag sx-' + esc(ch.sx) + '">' + esc(lgSexTxt(ch.sx)) + '</i>' : '') + agTag(ch);
    var html = sheetHead({ spr: charSpr(ch, 4), g: p.g || 3, name: esc(DS.heroCall ? DS.heroCall(s) : DS.charName(ch)), tags: tags, lv: p, pow: DS.flagPower(s, ch, p) });
    html += vitBars(u, ch.hp, ch.mp, p);
    html += '<button class="row place pl2" data-goflag="' + ch.id + '">' + crestH(ch, 20) + '<span class="tx"><b>' + esc(DS.flagName(ch.cls)) + ' 가주</b><small class="fx2">' + hFx(ch, false) + '</small></span><i class="go" aria-hidden="true">›</i></button>';
    html += statHead('h') + statBars(seat, p) + cmpBlock('h', seat, p);
    html += trChips(p, ch) + ultChip(p, 'h');
    html += wedBox() + lgSpouseRow('ch', ch.id);      // r16 person: 혼인 칸
    html += personMore('h', seat, p, DS.powerParts(s, ch, p), '<dl class="kv tr2">' + natureRow(p) + '</dl>' + agRow(ch));
    if (DS.rnBtn) html += DS.rnBtn('c', ch.id);
    return '<div class="cs2">' + html + '</div>';
  }, 'sub');
  o.addEventListener('click', function (e) {
    if (lgRowClick(e, o)) return;
    var hc = G.save.chars[G.save.hero]; if (hc && cmpClick(e, o, 'h', { k: 'hero', ch: hc })) return;      // r16 person: 비교
    if (e.target.closest('[data-gowed]')) { A('tap'); DS.openPeople('wed'); return; }
    var gf = e.target.closest('[data-goflag]'); if (gf) { A('tap'); charSheet(+gf.dataset.goflag, o); }
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
  return o;
}
DS.heroInfo = heroInfo;
// r26 juice: 뒤집힌 카드가 깔리고 → 가장 좋은 카드 뒷면만 등급 빛으로 떨며 기대를 모으고 → 낮은 등급부터 한 장씩 뒤집혀 가장 좋은 것이 마지막.
//   카드를 누르면 그 카드가 바로, 「모두 열기」는 한꺼번에. 결과를 먼저 알려 주는 소리는 없다 (뒤집힐 때 등급 소리)
// r44: 모집 카드의 능력치 합 (2.2.0: 그 사람이 선 가문의 가주라면) + 성장 % (잠재력 = 등급)
function pullSum(m) { var s = G.save, h = m && m.o && s.chars[m.o] ? s.chars[m.o] : heroCh(), n = 0; try { n = h && DS.statTotal ? DS.statTotal(DS.cmdSpec(h, false, m)) : 0; } catch (x) { n = 0; } var pc = DS.potMul && DS.potOf2 && DS.potOf2(m) ? Math.round((DS.potMul({ pot: DS.potOf2(m) }) - 1) * 100) : null; return n || pc != null ? '<span class="tr schips">' + (n ? DS.chip('능력치 합', fmtN(n)) : '') + (pc != null ? DS.chip('성장', (pc > 0 ? '+' : pc < 0 ? '−' : '±') + Math.abs(pc) + '%', pc > 0 ? 1 : pc < 0 ? -1 : 0) : '') + '</span>' : ''; }      // r44 능력치 합 + r45 칩 (잠재력은 등급 = 성장 %, 별 없음)
function showPull(list, cb, notes) {      // 2.2.0: notes[i] = 카드 밑 한 줄 (「센주 가문 가주」 · 「막사」)
  var top = 0, many = list.length > 1, calm = U.calm && U.calm(); list.forEach(function (m) { top = Math.max(top, m.g); });
  var best = -1; list.forEach(function (m, i) { if (best < 0 || m.g > list[best].g) best = i; });
  var titleOf = function () { return top >= 5 ? '전설이 왔다' : top >= 4 ? '이름난 이가 왔다' : list.length > 1 ? list.length + '명이 찾아왔다' : '한 사람이 찾아왔다'; };
  var o = overlay('<div class="result pull r26"><h2>' + (calm ? titleOf() : '누가 올까') + '</h2><div class="cards n' + (many ? 'm' : '1') + '">' +
    list.map(function (m, i) {
      var T = DS.TRAITS[m.t], q = quirkOf(m);
      return '<div class="pcard2 g' + m.g + (calm ? '' : ' back' + (i === best && m.g >= 3 ? ' hint' + m.g : '')) + '" data-pi="' + i + '" style="--i:' + i + '">' + mercSpr(m, many ? 2 : 4) + '<b>' + esc(m.n || '') + '</b>' + gpips(m.g) + '<span class="pkind">' + esc(DS.nativeName ? DS.nativeName(m) : DS.MERCS[m.type].name) + '<i class="plv">' + lv(DS.pL(m)) + '</i></span>' + (notes && notes[i] ? '<span class="pnote">' + notes[i] + '</span>' : '') +      // r45 ui: 특성은 이름 + 효과 칩, 한 줄씩 · r44: 능력치 합 · 성장 · 가주 배율 (×)
        (T || q ? '<span class="ptrs">' + [T ? ['특성', T] : null, q ? ['버릇', q] : null].filter(Boolean).map(function (x) { return '<span class="ptr"><small>' + x[0] + '</small><b>' + esc(x[1].name) + '</b>' + (DS.descChips ? DS.descChips(x[1].desc || '') : '<small>' + esc(x[1].desc || '') + '</small>') + '</span>'; }).join('') + '</span>' : '') +
        '<span class="tr hi">' + DS.chip('가주일 때', '×' + DS.bnGMul(m).toFixed(2), DS.bnGMul(m) > 1 ? 1 : DS.bnGMul(m) < 1 ? -1 : 0) + '</span>' + pullSum(m) + (DS.rnBtn ? DS.rnBtn('m', m.id) : '') + '</div>';
    }).join('') +
    '</div><div class="pbtns">' + (calm ? '' : '<button class="btn" data-flipall>모두 열기</button>') + '<button class="btn gold wide" data-close>확인</button></div></div>', 'modal center pullov');
  var timers = [], left = calm ? 0 : list.length, order = list.map(function (m, i) { return i; }).sort(function (a, b) { return list[a].g - list[b].g || a - b; });
  var later = function (f, ms) { timers.push(setTimeout(f, ms)); };
  function done() { var h2 = $('h2', o); if (h2) { h2.textContent = titleOf(); h2.classList.add('gfx-in'); } var fa = $('[data-flipall]', o); if (fa) fa.remove(); o.classList.add('opened'); }
  function flip(i, quick) {
    var c = $('.pcard2[data-pi="' + i + '"]', o); if (!c || !c.classList.contains('back') || c._fl) return;
    c._fl = true; var g = list[i].g; c.classList.add('flip1');
    later(function () {
      c.classList.remove('back', 'flip1', 'hint3', 'hint4', 'hint5'); c.classList.add('flip2');
      if (many && c.scrollIntoView) { try { c.scrollIntoView({ block: 'nearest', behavior: quick ? 'auto' : 'smooth' }); } catch (x) {} }
      A('flip'); if (!quick || g >= 4) A(g >= 4 ? 'pullHi' : g >= 3 ? 'star' : 'coin'); if (g >= 5) later(function () { A('rare'); }, 120);
      if (g >= 4) { o.classList.remove('flash'); void o.offsetWidth; o.classList.add('flash'); if (DS.Audio.duck) DS.Audio.duck(6, 1500); }
      if (--left <= 0) later(done, 260);
    }, quick ? 60 : 120);
  }
  if (!calm) {
    A('flip');
    if (top >= 4) later(function () { A('swell'); }, 150);
    var t0 = 700 + list.length * 70;
    order.forEach(function (i, k) { later(function () { flip(i); }, t0 + k * (list[i].g >= 4 && k === order.length - 1 ? 420 : 200)); });
    o.addEventListener('click', function (e) {
      if (e.target.closest('[data-flipall]')) { order.forEach(function (i, k) { later(function () { flip(i, true); }, k * 40); }); return; }
      var c = e.target.closest('.pcard2.back'); if (c) flip(+c.dataset.pi);
    });
  } else done();
  o.onclose = function () { timers.forEach(clearTimeout); if (cb) cb(); };
}
// 목록 위 한 줄 문법 (막사·가방 같은 자리): 정렬 seg · 거르기 chip · 고르기 줄
function listTools(sortBtns, chips, selLine) {
  return '<div class="ltools"><div class="lt1"><span>정렬</span><div class="seg" role="group" aria-label="정렬">' + sortBtns + '</div></div>' + (chips ? '<nav class="chips2 lt2" aria-label="필터">' + chips + '</nav>' : '') + '<p class="lt3">' + selLine + '</p></div>';
}
U.listTools = listTools;
// 2.2.0: 막사는 없어졌다. 메뉴 단추(☰ 부대)의 작은 배지 = 빈 가문이 있고 보낼 수 있는 어른 가문원이 있다
DS.barFill = function (s) { if (!s || !s.chars) return { slots: 0, can: 0 }; var e = DS.bnEmpty ? DS.bnEmpty(s).length : 0; return { slots: e, can: e ? DS.mercsOf(s, s.hero).length : 0 }; };
DS.barNew = function () { return 0; };
DS.openBarracks = function () { return DS.openMenu('party'); };      // 옛 이름 (막사 → 부대 탭)
DS.barBadge = function () {
  var bm = document.getElementById('bMenu'), s = G.save; if (!bm || !s) return;
  var f = DS.barFill(s), on = !!(f.slots && f.can); bm.classList.toggle('bardot', on);
};
// r32 추모 한 줄: [별명] 이름 · 종류 · 공훈 / 쓰러진 곳 · 전투 · 처치 / 마지막 말
function fallenRow(f) {
  return '<div class="row fallen"><div class="tx"><b>' + (f.nk ? '<i class="ttl">' + esc(f.nk) + '</i> ' : '') + esc(f.n || '') + ' ' + gpips(f.g) + ' <i class="own">' + (DS.MERCS[f.type] ? DS.MERCS[f.type].name : '') + ', ' + (f.L ? lv(f.L) : '') + (f.f && G.save.chars[f.f] ? ', ' + esc(DS.flagName(G.save.chars[f.f].cls)) + ' 가주' : '') + '</i></b><small>' + esc(f.at || '') + '에서 쓰러짐, 전투 ' + (f.b || 0) + ', 처치 ' + (f.k || 0) + '</small>' +
    (f.lw ? '<small class="lw">마지막 말 「' + esc(f.lw) + '」</small>' : '') + '</div></div>';
}
// ───────── 2.2.0 영웅관: 영웅 모집 (한 번에 한 사람 · 비싸다 · 병과는 무작위) ─────────
// 등급은 확률표 + 천장. 병과는 합류한 가문 가운데 고르게 하나 (DS.recruitHero). 그 가문이 비었으면 곧바로 가주, 아니면 막사로.
//   막사가 가득(DS.MERC_MAX)하면 빈 가문 가운데서만 오고, 빈 가문도 없으면 단추가 잠기고 까닭을 보인다.
function heroRoomLine(s) {
  var room = DS.heroRoom(s), vac = room.filter(function (ch) { return DS.vacant(s, ch); }), nb = DS.barracks(s).length;
  if (!room.length) return '<p class="gap">' + esc(DS.recruitWhy(s)) + '</p>';
  return '<p class="hroom"><small>막사 ' + nb + '/' + DS.MERC_MAX + '명</small>' + (vac.length ? vac.map(function (ch) { return '<i class="hrm vac">' + crestH(ch, 14) + esc(hgShort(ch)) + '<small>빈 가문</small></i>'; }).join('') : '') + '</p>' +
    '<p class="hint sm">' + (vac.length ? '빈 가문의 병과가 나오면 바로 가주가 된다. 아니면 막사로 간다' : '오는 사람은 막사에서 기다린다') + '</p>';
}
function mercShop() {
  var o = sheet('영웅관', function () {
    var s = G.save, cost = DS.recruitPrice(s, 0), next = DS.recruitPrice(s, 1), base = Math.round(DS.mercCost(DS.heroTier(s)) * (DS.RECRUIT.k || 1) / 10) * 10, html = '', why = DS.recruitWhy(s);
    var pityLeft = Math.max(1, DS.PITY - (s.pity || 0)), ease = DS.recruitEase(s), pg = (DS.GRADES[DS.PITY_G || 5] || {}).name || '', can = !why && (s.tickets > 0 || s.gold >= cost);
    html += '<div class="gacha"><div class="gh"><b>영웅 모집</b><span>모집권 <b class="num">' + (s.tickets || 0) + '</b>장</span></div>' +
      '<p class="hint sm">한 번에 한 사람. 병과는 무작위. <b class="warn">쓰러지면 잃는다</b></p>' +
      '<div class="gprice"><span>지금 ' + coin(cost) + '</span><i aria-hidden="true">→</i><span>다음 ' + coin(next) + '</span></div>' +
      '<p class="gwhy">부를 때마다 값이 오른다. 계절이 지나면 조금씩 내려간다.' + (ease > 0 ? ' <b>기본값 ' + coin(base) + '까지 ' + ease + '계절</b>' : '') + ' 모집권은 시나리오 ' + (DS.TICKET_EVERY || 10) + '개마다 한 장.</p>' +
      heroRoomLine(s) +
      '<div class="gbtn one"><button class="btn' + (can ? ' gold' : ' poor') + '" data-pull="1"' + (why ? ' disabled aria-disabled="true"' : '') + '><span>영웅 모집</span><small>' + (why ? '막사 가득' : s.tickets > 0 ? '모집권 1장' : coin(cost)) + '</small></button></div>' +
      '<p class="pity">' + (pityLeft <= 5 || FOLD.rates ? pg + '까지 ' + pityLeft + '회, ' : '') + '<button class="lnk" data-pfold="rates" aria-expanded="' + !!FOLD.rates + '">등급 확률 ' + (FOLD.rates ? '▾' : '▸') + '</button></p>' +
      (FOLD.rates ? '<p class="rates">' + [1, 2, 3, 4, 5].map(function (g) { return '<i>' + gbadge(g) + ' <b class="num">' + DS.GRADES[g].p + '%</b></i>'; }).join('') + '</p>' : '') + '</div>';
    var fl = (s.fallen || []).slice().reverse();
    if (fl.length) {
      html += foldBtn('mfl', '추모 ' + fl.length + '명', '함께 싸우다 쓰러진 이들');
      if (FOLD.mfl) html += '<div class="flist">' + fl.map(fallenRow).join('') + '</div>';      // r32: 모두 (스크롤) · 마지막 한마디
    }
    return html;
  }, 'mercs');
  o.foot = function () { return '<button class="btn" data-goparty="1">부대</button>'; };  o.draw();
  function pull() {
    var s = G.save, cost = DS.recruitPrice(s, 0), byT = false;
    if (busy()) { no('전투 중', DS.townWorkWhy ? DS.townWorkWhy() : '싸우는 중에는 할 수 없다'); return; }
    var why = DS.recruitWhy(s); if (why) { A('cancel'); toast(why); return; }
    if (s.tickets > 0) { s.tickets--; byT = true; A('coin'); } else if (!spend(cost)) return;
    if (!byT) DS.recruitPaid(s, 1);      // r35: 골드로 부르면 다음 값이 오른다 (모집권은 그대로)
    var r = DS.recruitHero(s); if (!r) { if (byT) s.tickets++; else s.gold += cost; toast(DS.recruitWhy(s) || '모집할 수 없다'); return; }
    r.m.nf = 1;      // 4.0.6: 찾아온 사람은 이름을 한 번 무료로 정한다
    var note = r.role === 'bear' ? crestH(r.ch, 14) + esc(DS.flagName(r.ch.cls)) + ' <b>가주</b>' : '<b>막사</b> <small>' + esc(DS.CLASSES[r.ch.cls].name) + ', 같은 병과 가주가 떠나면 잇는다</small>';
    DS.rebuildParty(); DS.updateQuest(); U.persist(); o.draw();
    showPull([r.m], function () { o.draw(); toast(josa(r.m.n || '', '이가') + ' ' + (r.role === 'bear' ? DS.flagName(r.ch.cls) + '의 가주가 되었다' : '막사에 들었다. ' + DS.CLASSES[r.ch.cls].name), 3200); }, [note]);
  }
  o.addEventListener('click', function (e) {
    var p = e.target.closest('[data-pull]');
    if (e.target.closest('[data-goparty]')) { A('tap'); o.close(); DS.openMenu('party'); return; }
    if (p) { if (p.disabled) { A('cancel'); toast(DS.recruitWhy(G.save) || '모집할 수 없다'); return; } pull(); return; }
  });
  return o;
}
DS.heroHall = mercShop;
// 소모품: 아이템팀이 늘리면 DS.itemKeys 가 보일 것을 알려 준다 (없으면 지금의 네 가지)
var ITEM4 = ['herb', 'mana', 'endo'];
function itemKeys() { var k = DS.itemKeys ? DS.itemKeys(G.save) : null; return (k && k.length ? k : ITEM4).filter(function (x) { return DS.ITEMS[x]; }); }
// 아이콘 자리: 그래픽팀의 DS.iconHtml(kind, id, opt) 이 있으면 그 HTML, 없으면 CSS 그림(.ico.i-<id>). kind: 'item' | 'gear' | 'misc'(ticket·crest·stone·pray)
// 늘 붙는 클래스: ico i-<id> k-<kind> (+ lr<등급> 테두리) — CSS 만으로도 칠할 수 있게
function icon(kind, id, grade, txt) {
  if (DS.iconHtml && id && (kind !== 'misc' || id === 'ticket' || id === 'crest')) { try { var x = DS.iconHtml(kind, id, grade ? { grade: grade } : undefined); if (x) return x; } catch (e) {} }      // 그래픽팀 약속: kind 'misc' 는 id 'ticket'·'crest'
  return '<span class="ico i-' + esc(id || '') + ' k-' + kind + (grade ? ' lr' + grade : '') + '">' + (txt ? esc(txt) : '') + '</span>';
}
U.icon = icon;
function scene(k) { if (!DS.sceneArt) return ''; try { return DS.sceneArt(k) || ''; } catch (e) { return ''; } }      // 그래픽팀: 승리·전멸·맺음 그림 (없으면 빈칸)
U.scene = scene;
function itemIco(k) { return icon('item', k, 0, ITEM4.indexOf(k) >= 0 ? '' : (DS.ITEMS[k].name || '').charAt(0)); }
function itemHave(k) { var it = DS.ITEMS[k], n = G.save.items[k] || 0; return it.max ? n + ' / ' + it.max : '× ' + n; }
function soldHere(k) {      // town: 없으면 드랍 전용(옛 네 가지는 어디서나), true·'all' 이면 어디서나, 그 밖에는 마을 키(들)
  var t = DS.ITEMS[k].town, z = shopZ().id;
  if (t === undefined) return ITEM4.indexOf(k) >= 0;
  if (!t) return false;
  if (t === true || t === 'all') return true;
  return Array.isArray(t) ? t.indexOf(z) >= 0 : t === z;
}
function itemShop(tw) {      // tw = 「마을 일」에서 열었다 (보호 부적 칸이 함께)
  var o = sheet('잡화점', function () {
    var s = G.save, html = '', keys = itemKeys();
    Object.keys(DS.ITEMS).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    keys = keys.filter(soldHere);
    if (!keys.length) html += '<p class="hint empty">파는 물건 없음</p>';
    keys.forEach(function (k) {
      if (k === 'prot' && tw) return;      // 2.1.0: 「마을 일」의 상점은 아래 보호 부적 칸이 판다
      var it = DS.ITEMS[k], n = s.items[k] || 0, full = it.max && n >= it.max, poor = s.gold < it.price;
      html += '<div class="row">' + itemIco(k) + '<div class="tx"><b>' + it.name + ' <i class="own">보유 ' + (it.max ? n + ' / ' + it.max : n) + '</i></b><small>' + it.desc + '</small></div><div class="btns">' +
        '<button class="btn small' + (full || poor ? ' poor' : ' gold') + '" data-it="' + k + '" data-n="1">' + it.price + ' G</button><button class="btn small' + (full || s.gold < it.price * 5 ? ' poor' : '') + '" data-it="' + k + '" data-n="5">×5</button></div></div>';
    });
    if (tw) html += protShelf(s, true);      // 2.1.0: 「마을 일」의 상점 — 강화 보호 부적 칸
    return html;
  });
  o.addEventListener('click', function (e) {
    if (e.target.closest('[data-prot]')) { protBuy(o); return; }
    var b = e.target.closest('[data-it]'); if (!b) return;
    var k = b.dataset.it, it = DS.ITEMS[k], n = +b.dataset.n, have = G.save.items[k] || 0;
    if (it.max) { if (have >= it.max) { A('cancel'); toast(it.name + ': 더 들 수 없다 (최대 ' + it.max + '개)'); return; } n = Math.min(n, it.max - have); }
    if (!spend(it.price * n)) return;
    G.save.items[k] = have + n; U.persist(); o.draw();
  });
}
// 1.0.1 합일: 묶음이 정해져 있지 않다 — 교회에서 7단 Lv10 가문 셋을 골라 함께 8단으로. 이름은 고른 셋 중 가주 공훈 1등 가문 + 「대가문」
function fuRow(s, u) {      // 이미 맺은 묶음 한 줄: 문장 셋 + 이름 + 가문
  var cs = u.ids.map(function (id) { return s.chars[id]; }).filter(Boolean);
  return '<div class="row fuu-row"><span class="fucr">' + cs.map(function (c) { return crestH(c, 22); }).join('') + '</span><div class="tx"><b>' + esc(DS.unionName(s, u)) + '</b><small>' + esc(cs.map(function (c) { return hsShort(c.cls); }).join(', ') + ' 가문') + '' + '</small></div></div>';
}
// r42: 합일은 사람 셋 — 후보 한 줄 = 선 가문의 문장 · 이름 · 자리 · 태생 · 단 Lv
function fuWho(s, c) { return c.role === 'hero' ? DS.charName(s.chars[s.hero]) : (c.who.ttl || c.who.n || ''); }
function fuRole(c) { return c.role === 'hero' ? '맹주' : c.role === 'bear' ? '가주' : c.role === 'kin' ? '가문원' : c.role === 'sb' ? '막사' : '가문 밖'; }
function fuSpr(s, c) { return c.role === 'hero' ? charSpr(s.chars[s.hero], 1.2) : mercSpr(c.who, 1.2); }
function fuPickRow(s, c, on) {
  var nat = DS.CLASSES[DS.pNative(s, c.who)] || {};
  return '<button class="row fupick' + (on ? ' on' : '') + '" data-fupick="' + c.key + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + (c.ch ? crestH(c.ch, 22) : '') + '<span class="fusp">' + fuSpr(s, c) + '</span>' +
    '<span class="tx"><b>' + esc(fuWho(s, c)) + ' <i class="tg">' + fuRole(c) + '</i></b><small>' + (c.ch ? esc(hsShort(c.ch.cls)) + ' 가문, ' : '') + esc(c.role === 'hero' || c.role === 'bear' ? (nat.name || '') : DS.mercKind(c.who)) + ', ' + lv(c.L) + '</small></span>' +
    '<i class="fuck">' + (on ? '✓' : '') + '</i></button>';
}
function church() {
  var pick = null;      // 고른 가문 번호들 (창이 열려 있는 동안)
  var o = sheet('교회', function () {
    var s = G.save, html = '';      // 3.3.0: 「부활」 줄은 없앴다 (지휘관은 쓰러지면 돌아오지 않는다 — 관과 다시 부름은 아래 「관」)
    var hurt = partyHp(), fee = 20 * DS.heroTier(s);
    html += '<div class="row"><span class="ico i-herb"></span><div class="tx"><b>치료 <i class="own">부대 체력 ' + Math.round(hurt * 100) + '%</i></b><small>부대 모두의 체력과 마나를 채운다. 체력은 저절로 차지 않는다.</small></div>' +
      (hurt < 0.995 ? '<button class="btn small gold" data-act="heal">' + coin(fee) + '</button>' : '<span class="why">치료 불필요</span>') + '</div>';
    html += lgChurchRow();      // r4 가문: 관
    // r38: 「맹주의 필살기」 바꾸기 줄은 없앴다 — 필살기는 고르는 것이 아니라 타고난다 (사람 창의 「타고난 필살기」)
    var P = DS.fuseProg(s), cands = P.ready;
    html += '<h4>합일 <i class="own' + (P.ok ? ' ok' : '') + '">7단 Lv10 ' + cands.length + '명</i></h4><p class="hint">7단 Lv10 사람 셋을 고르면 셋이 함께 8단에 오르고, 레벨 70을 넘어 자란다. 셋 가운데 공훈이 가장 큰 가문이 대표 가문이 되어 공훈 +' + fmtN(DS.FUSE_HX || 0) + '을 받는다. 셋은 제 자리를 떠나지 않는다. 맹세의 깃대 ' + (s.crest ? '보유' : '<b class="warn">없음</b>') + (P.fused ? '. 합일한 사람 ' + P.fused + '명' : '') + '</p>';
    if (pick == null) pick = cands.length === DS.FUSE_N ? cands.map(function (c) { return c.key; }) : [];
    pick = pick.filter(function (k) { return cands.some(function (c) { return c.key === k; }); });
    if (cands.length) {
      html += '<p class="fuhd">고른 사람 <b class="num">' + pick.length + ' / ' + DS.FUSE_N + '</b></p>';
      var rp = pick.length && DS.fuseRep ? DS.fuseRep(s, pick.map(function (k) { return DS.pByKey(s, k); })) : null; if (rp) html += '<p class="hint sm furep">' + crestH(rp, 18) + ' 대표 가문 <b>' + esc(DS.flagName(rp.cls, s)) + '</b> ' + DS.chip('공훈', '+' + fmtN(DS.FUSE_HX || 0), 1) + '</p>';      // 2.1.0
      cands.forEach(function (c) { html += fuPickRow(s, c, pick.indexOf(c.key) >= 0); });
    }
    if (cands.length < DS.FUSE_N) {
      var near = P.low.slice(0, DS.FUSE_N - cands.length + 1);
      html += '<p class="hint sm">' + (P.can ? '합일: 7단 Lv10 사람 ' + P.n + '/' + P.of : '합일할 사람이 셋 남지 않았다') + '</p>';
      near.forEach(function (c) { html += '<div class="row fupick off">' + (c.ch ? crestH(c.ch, 22) : '') + '<span class="fusp">' + fuSpr(s, c) + '</span><span class="tx"><b>' + esc(fuWho(s, c)) + ' <i class="tg">' + fuRole(c) + '</i></b><small>' + lv(c.L) + ', ' + (DS.FUSE_MIN - c.L) + '레벨 남음</small></span></div>'; });
    }
    return html;
  });
  o.foot = function () { var s = G.save, ok = pick && DS.fuseOk(s, pick).ok; return pick && DS.fuseCands(s).length ? '<button class="btn gold' + (ok ? '' : ' poor') + '" data-fugo="1">합일</button>' : ''; };
  o.draw();
  o.addEventListener('click', function (e) {
    var s = G.save;
    if (lgChurchClick(e, o)) return;      // r4 가문: 관
    if (e.target.closest('[data-act="heal"]')) {
      if (!spend(20 * DS.heroTier(s))) return;
      DS.charList(s).forEach(function (c) { if (!c.down) { c.hp = 1; c.mp = 1; } }); s.mercs.forEach(function (m) { m.hp = 1; });
      G.sim.units.forEach(function (u) { if (u.side === 'ally' && !u.dead) { u.hp = u.mhp; u.mp = u.mmp; } });
      A('heal'); U.persist(); o.draw(); return;
    }
    var pk = e.target.closest('[data-fupick]');
    if (pk) {
      var id = pk.dataset.fupick, i = pick.indexOf(id);
      if (i >= 0) pick.splice(i, 1); else if (pick.length < DS.FUSE_N) pick.push(id); else { A('cancel'); toast('사람은 ' + DS.FUSE_N + '명까지 고른다'); return; }
      A('tap'); o.draw(); return;
    }
    if (!e.target.closest('[data-fugo]')) return;
    if (busy()) { no('전투 중', '싸우는 중에는 할 수 없다'); return; }
    var chk = DS.fuseOk(s, pick); if (!chk.ok) { A('cancel'); toast(chk.why); return; }
    var m = DS.fuse(s, pick.slice()); if (!m) return;
    DS.rebuildParty(); DS.updateQuest(); U.persist(); o.close();
    var LF = DS.lastFuse || {}, names = (LF.names || []).join(', ');
    var lead = (LF.who || []).map(function (w) { return DS.whoHouse(s, w); }).filter(function (h, i) { var w = LF.who[i]; return h && (h.id === s.hero ? DS.heroPs(s) === w : DS.bearer(s, h) === w); })[0];
    var note = names + ', 셋이 뜻을 모아 함께 8단에 올랐다. 이제 레벨 70을 넘어 자란다.' + (LF.repName ? ' 대표 가문 ' + LF.repName + ', 공훈 +' + fmtN(LF.hx || 0) + '.' : '');
    var reveal = function () { if (lead) DS.showPromo({ id: lead.id, from: 7, to: 8, cls: lead.cls, fused: '세 사람', note: note }, null); else toast(note, 4200); };
    var FL = LORE().fuse || {}, ll = (FL.any || []).map(function (t) { return typeof t === 'string' ? t.replace(/\{h\}/g, names).replace(/\{u\}/g, '세 사람').replace(/\{t\}/g, '세 사람') : t; });
    var go = function () { if (ll && ll.length) story(ll, reveal, '합일'); else reveal(); };
    var V0 = G.view; if (V0 && V0.cere) (LF.who || []).forEach(function (w) { var h = DS.whoHouse(s, w); if (!h) return; var fu = G.sim && G.sim.byId[(h.id === s.hero ? DS.heroPs(s) === w : DS.bearer(s, h) === w) ? 'c' + h.id : 'm' + w.id]; if (!fu) return; var nn = ''; try { nn = DS.unitSpriteName(fu); } catch (x) { nn = ''; } var a7 = DS.lookName(h.cls, 7), a8 = DS.lookName(h.cls, 8); V0.cere(fu.id, 'fuse', { to: 8, old: nn && a7 !== a8 ? nn.replace(a8, a7) : null }); });
    go();
  });
}
// ── 2.1.0 「마을 일」: 대장간 · 영웅관 · 상점(보호 부적) · 교회(치료 · 관 · 합일) · 혼인/이별 · 관 — 시나리오와 전투 밖이면 어디서나 ──
DS.townBusy = function () { return !!(G.scn || G.ending || (G.sim && G.sim.combat)); };
DS.townWorkWhy = function () { return G.scn ? '시나리오 중에는 마을 일을 볼 수 없다' : '싸우는 중에는 마을 일을 볼 수 없다'; };
DS.openTownWork = function (parent) {
  if (DS.townBusy()) { A('cancel'); toast(DS.townWorkWhy(), 2600); return null; }
  var o = sheet('마을 일', function () {
    var s = G.save, cf = lgCoffins ? lgCoffins() : null, z = shopZ(), here = G.zone && G.zone.town;
    var row = function (k, ic, nm, sub) { return '<button class="row twrow" data-tw="' + k + '">' + (U.svg ? '<i class="twic" aria-hidden="true">' + U.svg(ic, 22) + '</i>' : '') + '<span class="tx"><b>' + esc(nm) + '</b><small>' + esc(sub) + '</small></span><i class="twgo" aria-hidden="true">›</i></button>'; };
    var html = '<p class="hint sm">' + esc(here ? z.def.name + '에서 본다' : '어디서나 볼 수 있다. 진열은 ' + (z.def.name || '마을') + ' 것') + '</p>';
    html += row('forge', 'sword', '대장간', '강화, 장비 맞추기');
    html += row('merc', 'party', '영웅관', '영웅 모집. 병과는 무작위, 빈 가문이면 가주로');
    html += row('item', 'bag', '상점', '소모품' + (DS.ITEMS.prot ? ', 강화 보호 부적' : ''));
    html += row('church', 'scroll', '교회', '치료, 관, 합일');
    if (lgOn && lgOn()) html += row('wed', 'heart', '혼인과 이별', '맹주의 혼인');
    if (cf) html += lgBuyRow(cf);
    return html;
  }, 'twork');
  o.addEventListener('click', function (e) {
    if (lgCoffinClick && lgCoffinClick(e, o)) return;
    var b = e.target.closest('[data-tw]'); if (!b) return;
    if (DS.townBusy()) { A('cancel'); toast(DS.townWorkWhy(), 2600); return; }
    var k = b.dataset.tw; A('tap');
    if (k === 'wed') { var s = G.save, q = sheet('혼인과 이별', function () { return lgSpouseRow('ch', s.hero) || '<p class="hint">맹주가 없다</p>'; }, 'sub'); q.addEventListener('click', function (ev) { lgRowClick(ev, q); }); return; }
    DS.openShop(k, { tw: 1 });
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
  return o;
};
DS.openShop = function (kind, opt) {
  if (kind === 'house') { var hs = LORE().npc ? LORE().npc(G.zone.id, 'house', G.save) : ''; story([hs || '"밤마다 북쪽 하늘이 어스름하게 물든다오. 조심해서 다니시게."'], null, '집주인'); return; }
  if (kind === 'forge' || kind === 'weapon' || kind === 'armor') return forge(null, kind === 'armor' ? 'a' : 'w');      // r37: 무기점·방어구점은 없어졌다 — 옛 이름으로 불러도 대장간
  if (kind === 'merc') return mercShop();
  if (kind === 'item') return itemShop(!!(opt && opt.tw));
  if (kind === 'church') return church();
  if (kind === 'town') return DS.openTownWork();
};


// 싸우는 부대의 남은 체력 (가주 + 가문원 평균)
function partyHp() {
  DS.syncVitals();
  var s = G.save, sum = 0, n = 0;
  s.party.forEach(function (id) { var c = s.chars[id]; if (!c || c.down) return; sum += c.hp == null ? 1 : c.hp; n++; DS.mercsOf(s, id).forEach(function (m) { sum += m.hp == null ? 1 : m.hp; n++; }); });
  return n ? sum / n : 1;
}
// ───────── 시나리오 입구 ─────────
function rewardText(s) {
  var r = s.reward || {}, out = [], sv = G.save;
  if (s.pit) return DS.scnGold(s) + ' 골드';
  if (sv.cleared[s.id]) return Math.round(DS.scnGold(s) * 0.35) + ' 골드 (다시 도전)';
  out.push(DS.scnGold(s) + ' 골드');
  var j = DS.joinOf(sv, s);
  if (j) out.push('새 가문: ' + DS.flagName(j));
  if (r.gear && DS.gear(r.gear)) out.push('전설 「' + DS.gear(r.gear).short + '」');      // 2.1.0: 정해진 보상 전설 장비
  if (r.crest) out.push('맹세의 깃대');
  if (r.items) for (var k in r.items) out.push(DS.ITEMS[k].name + ' ×' + r.items[k]);
  if (s.id % (DS.TICKET_EVERY || 10) === 0) out.push('영웅 모집권 ×1');      // r35 · 2.2.0: 열 번째마다
  return out.join(', ');
}
// 들어가기 직전의 모습을 적어 둔다 — 결과 창이 "전 → 후"를 보여 주려고
var snap = null;
function takeSnap(s) {
  var sv = G.save; snap = { key: s.pit ? 'p' + s.pit : 's' + s.id, L: {}, mx: {}, mt: {} };
  DS.charList(sv).forEach(function (c) { snap.L[c.id] = c.L; });
  snap.pw = DS.partyPower ? DS.partyPower(sv) : 0; snap.cp = {}; sv.party.forEach(function (id) { snap.cp[id] = DS.cardPower(sv, sv.chars[id]); });      // r15: 결과 창의 「이번 판 전투력 변화」
  sv.mercs.forEach(function (m) { snap.mx[m.id] = DS.pL(m); snap.mt[m.id] = DS.mercTitle ? DS.mercTitle(m) || '' : ''; });      // 판 전의 별명 (결과 창이 새로 붙은 별명을 알린다)
}
DS.openGate = function (s, lock) {
  var sv = G.save, B = s.boss ? DS.BOSSES[s.boss] : null, pl = DS.partyL(sv), rec = DS.recLOf ? DS.recLOf(s) : s.L, low = DS.recLow ? !!DS.recLow(sv, s) : pl < rec - 2;
  var foes = s.mobs.map(function (m) { return sprTag(DS.ENEMIES[m].sprite, '', 2); }).join('');
  var lb = B && LORE().boss && LORE().boss[s.boss], title = B ? (lb && lb.title ? lt(lb.title) : B.title) : '';
  var moves = B ? (B.skills || []).map(function (k) { return DS.SKILLS[k] && DS.SKILLS[k].name; }).filter(Boolean).slice(0, 3) : [];
  var empt = DS.bnEmpty ? DS.bnEmpty(sv).length : 0, hp = partyHp();      // 2.2.0: 빈 가문 (가주도 막사의 같은 병과도 없다)
  // r12 screen: 흐름 창 — 닫기 | 입장(금) 아래 한 줄. 경고는 한 줄씩, 권유는 그 자리의 단추로
  var o = overlay('<header class="sh"><h3>' + (s.pit ? esc(s.name) : '시나리오 ' + s.id) + '</h3></header><div class="sb gate">' +
    '<div class="gate-head">' + (B ? sprTag(B.sprite, B.pal, 3) : '<span class="noboss">방어전</span>') + '<div><h2>' + esc(s.name) + '</h2><p>' + (B ? '<b class="boss">' + esc(B.name) + '</b>' + (title ? ', ' + esc(title) : '') : '세 차례 습격을 모두 막아라') + '</p></div></div>' +
    '<dl class="facts"><dt>권장</dt><dd>' + lv(rec) + (s.tier ? ', ' + s.tier + '단 전용' : '') + (rec !== s.L ? ' <small class="dim">적 ' + lv(s.L) + '</small>' : '') + '</dd><dt>우리 부대</dt><dd class="' + (low ? 'warn' : '') + '">' + (DS.partySpecs ? DS.partySpecs(sv).length + '명, ' : '') + '평균 ' + lv(pl) + (low ? ' <i class="tagw">권장 미달</i>' : pl < rec ? ' <i class="tagw soft">조금 모자람</i>' : '') + '</dd>' +
    '<dt>적</dt><dd class="foes">' + foes + '</dd>' + (moves.length ? '<dt>보스의 기술</dt><dd class="moves">' + moves.map(function (n) { return '<i>' + esc(n) + '</i>'; }).join('') + '</dd>' : '') + '<dt>보상</dt><dd>' + esc(rewardText(s)) + '</dd></dl>' +
    (empt ? '<p class="soft">빈 가문 ' + empt + '곳은 싸우지 않는다. <button class="lnk2" data-go="party">부대</button></p>' : '') +
    (hp < 0.6 ? '<p class="lock">부대 체력 ' + Math.round(hp * 100) + '% (자동 회복 안 됨)</p>' : '') +
    (low ? '<p class="lock">자동 전투: 기운초 안 씀. 위험하면 퇴각</p>' : '') +      // r8 hud (fun 6 · newbie 1d)
    (!low && pl < rec && !sv.cleared[s.id] && s.id <= 3 ? '<p class="soft">권장: 들판에서 ' + lv(rec) + '까지</p>' : '') +      // 첫 판들: 안내대로 곧장 들어가 지는 일이 많았다 (QA K9)
    (lock ? '<p class="lock">' + esc(lock) + '</p>' : '') +
    '</div><div class="sfoot two"><button class="btn" data-close>닫기</button><button class="btn gold" id="goScn"' + (lock ? ' disabled' : '') + '>입장</button></div>');
  o.addEventListener('click', function (e) { if (e.target.closest('[data-go="party"]')) { A('tap'); o.close(); DS.openMenu('party'); } });
  $('#goScn', o).addEventListener('click', function () {
    A('ok'); o.close();
    var seenK = s.pit ? 'pit' + s.pit : null, skipIntro = s.pit ? !!sv.seen[seenK] : !!sv.cleared[s.id];      // 갱도 층 도입 글은 층마다 한 번만 (QA)
    if (seenK) sv.seen[seenK] = 1;
    story(skipIntro ? null : s.intro, function () { takeSnap(s); DS.startScenario(s); }, s.name);
  });
};

// ───────── 결과·승급 ─────────
// 출전 지휘관 가운데 가방의 장비로 더 좋아질 수 있는 사람 수 (DS.autoEquip 과 같은 셈)
function upgradable() {
  var s = G.save, n = 0;
  s.party.forEach(function (id) {
    var ch = s.chars[id]; if (!ch) return;
    var up = ['w', 'a'].some(function (sl) { var cur = DS.gearScore(DS.gear(ch[sl])); for (var gid in s.gear) { var g = DS.gear(gid); if (g && g.slot === sl && s.gear[gid] > 0 && DS.canEquip(ch, gid) && DS.gearScore(g) > cur) return true; } return false; });
    if (up) n++;
  });
  return n;
}
function nextLine() {      // 결과 창 맨 아래 한 줄: 이제 무엇을 하면 되나
  var sv = G.save, n = DS.nextScn(sv);
  if (!n) return LORE().after ? lt(LORE().after) : '모든 시나리오 완료 (남은 곳: 바닥 없는 갱도)';
  if (n.tier > DS.partyTier(sv)) {
    if (n.tier === 8) {
      var P = DS.fuseProg(sv);
      if (P.can) return P.ok ? '합일할 수 있다. 교회에서 가문 셋을 고른다' : '합일: 7단 Lv10 가문 ' + P.n + '/' + P.of + (sv.crest ? '' : ', 맹세의 깃대 필요');
      return '8단 합일: 7단 Lv10 가문 셋 (교회)';
    }
    return n.tier + '단이 되면 ' + n.id + '. ' + n.name;
  }
  return n.id + '. ' + n.name + ' — ' + DS.ZONES[n.zone].name;
}
function vetBar(m) { var L = DS.pL(m); return L >= DS.pCap(m) ? 100 : Math.max(0, Math.min(100, (+m.exp || 0) / DS.expNeed(L) * 100)); }      // r42: 개인 경험치
DS.showResult = function (s, out, cb) {
  var sv = G.save, sn = snap && snap.key === (s.pit ? 'p' + s.pit : 's' + s.id) ? snap : null, st = G.stats || null, kills = st && st.kills ? st.kills : null;
  // r8 menus (newbie 1): 지휘관을 잃었으면 제목 바로 아래에 — 금색 「승리」 밑 스크롤 끝에 묻히지 않게
  // 죽음 사건이 싣고 온 지휘관 자리(e.ch)로 잡는다 — 결과 창이 뜰 때는 linSettle 이 이미 그 사람을 떠난 이로 바꿔 놓아 lgP(..).ref 가 0 이다. e.nat = 싸움 뒤의 천수
  var deadCh = {}, deadNames = [], natNames = [];
  if (lgOn()) (G.lineageQ || []).forEach(function (e) {
    if (!e || e.t !== 'death' || e.k !== 'c' || e.ch == null || deadCh[e.ch]) return;
    var p = lgP(e.a), nm = (p && p.name) || (sv.chars[e.ch] ? DS.charName(sv.chars[e.ch]) : ''), nat = !!(e.nat || (e.ev && e.ev.x && /천수/.test(e.ev.x.why || '')));
    deadCh[e.ch] = nat ? 2 : 1; (nat ? natNames : deadNames).push(nm);
  });
  var anyDead = deadNames.length + natNames.length;
  // r26 art: 월계 + 별 셋(아무도 잃지 않으면 셋) + 금빛 「승리」 + 붉은 리본, 그 아래 전리품 칸·수치 홈. 줄은 차례로 떠오르고 숫자는 차오른다
  var lostM = G.lost ? G.lost.length : 0, stars = anyDead ? 1 : lostM ? 2 : 3, ic = U.svg || function () { return ''; }, gi = 0;
  var killsN = 0; if (kills) for (var kk in kills) killsN += kills[kk] || 0;
  var html = '<div class="result res2 r26' + (anyDead ? ' rdead' : '') + '"><p class="eyebrow">' + (s.pit ? '갱도' : '시나리오 ' + s.id) + '</p>' + scene('win') +
    '<div class="rhead"><svg class="laurel" width="250" height="64" viewBox="0 0 250 64" aria-hidden="true"><g fill="none" stroke="#dcb46a" stroke-width="2" stroke-linecap="round"><path d="M70 50C40 48 18 34 8 12M180 50c30-2 52-16 62-38"/></g><g fill="#b38a45"><path d="M14 22l-8 2 4-7zM24 32l-9 1 5-7zM36 40l-9-1 6-6zM50 46l-8-2 7-5z"/><path d="M236 22l8 2-4-7zM226 32l9 1-5-7zM214 40l9-1-6-6zM200 46l8-2-7-5z"/></g></svg>' +
    '<span class="rstars" role="img" aria-label="별 ' + stars + '개">' + [0, 1, 2].map(function (i) { return '<i class="st' + (i < stars ? '' : ' off') + '" style="--i:' + i + '">' + ic('star', i === 1 ? 40 : 30) + '</i>'; }).join('') + '</span>' +
    '<h2><span class="gtext">승리</span></h2><p class="rn"><span>' + (s.pit ? '갱도 ' + s.pit + '층' : '시나리오 ' + s.id) + ' · ' + esc(s.name) + '</span></p></div>' +
    (anyDead ? '<p class="rlost">' + (deadNames.length ? '<b>' + deadNames.map(esc).join(', ') + '</b>, 돌아오지 못했다.' : '') + (deadNames.length && natNames.length ? '<br>' : '') + (natNames.length ? '<b>' + natNames.map(esc).join(', ') + '</b>, 천수를 누리고 눈을 감았다.' : '') + '<small>창을 닫으면 떠난 이를 기리고 후계를 정합니다.</small></p>' : '') +
    '<h5 class="sec-h gfx-in" style="--i:' + (gi++) + '">보상</h5><div class="rw">';
  var slot = function (icn, acc, q, label, cls) { return '<div class="slot gfx-in' + (cls ? ' ' + cls : '') + '" style="--i:' + (gi++) + '"><span class="box" style="--ic-a:' + acc + '">' + icn + '</span>' + (q ? '<span class="q num">' + q + '</span>' : '') + '<small>' + label + '</small></div>'; };
  html += slot(ic('coin', 30), '#f0c860', '<b data-cu="' + (out.gold || 0) + '" data-pre="+">+' + fmtN(out.gold || 0) + '</b>', '골드');
  for (var k in out.items) html += slot(DS.iconHtml ? DS.iconHtml('item', k, { size: 36 }) : ic('potion', 30), '#86d46a', '×' + out.items[k], esc(DS.ITEMS[k].name));
  if (out.tickets) html += slot(ic('ticket', 30), '#e0c088', '×' + out.tickets, '모집권');
  if (out.crest) html += slot(ic('crown', 30), '#f6c65a', '', '맹세의 깃대', 'gr5');
  // 전리품 중 앞의 몇 점은 등급 테를 두른 칸으로 (자세한 줄은 아래 「전리품」에 그대로)
  var dr0 = (out.drops || []).concat(G.gain && G.gain.loot && G.gain.loot !== out.drops ? G.gain.loot : []).filter(function (d, i, a) { return d && typeof d === 'object' && d.kind !== 'bounty' && a.indexOf(d) === i; }).sort(function (a, b) { return (b.grade || 0) - (a.grade || 0); });
  dr0.slice(0, Math.max(0, 4 - (1 + Object.keys(out.items || {}).length + (out.tickets ? 1 : 0) + (out.crest ? 1 : 0)))).forEach(function (d) {
    var gr = Math.max(1, Math.min(5, d.grade || 1)), kind = d.kind === 'item' ? 'item' : 'gear';
    html += slot(DS.iconHtml ? DS.iconHtml(kind, d.id, { size: 36 }) : ic('shop_item', 30), '#dcb46a', d.n > 1 ? '×' + d.n : '', esc(String(d.name || '')), 'gr' + gr);
  });
  html += '</div><div class="kv a-recess gfx-in" style="--i:' + (gi++) + '">' + (G.gain.exp ? '<span>전투 경험치</span><b class="num" data-cu="' + G.gain.exp + '">' + fmtN(G.gain.exp) + '</b>' : '') +
    (sn && sn.pw && DS.partyPower ? '<span>부대 전투력</span><b class="num rpw">' + pwDelta(sn.pw, DS.partyPower(sv)) + '</b>' : '') +
    (killsN ? '<span>쓰러뜨린 적</span><b class="num">' + killsN + '</b>' : '') + (G.sim && G.sim.t ? '<span>걸린 시간</span><b class="num">' + Math.floor(G.sim.t / 60) + '분 ' + Math.floor(G.sim.t % 60) + '초</b>' : '') + '</div><ul class="loot">';
  var gotR = out.gear && DS.gear(out.gear) ? [DS.gear(out.gear)] : [];      // 2.1.0: 정해진 보상 전설 장비 (옛 유물 자리 — 자세한 줄은 아래 전리품 목록에)
  gotR.forEach(function (g) { html += '<li class="hl lg5"><b><i class="tg">정해진 보상</i> 전설 「' + esc(g.short) + '」</b><br><small>가방에 넣었다</small></li>'; });
  if (out.crest) html += '<li class="hl">맹세의 깃대 <small>합일 조건: 7단 Lv10 가문 셋 (어느 가문이든)</small></li>';
  if (out.tickets) html += '<li>모집권 ×' + out.tickets + '</li>';
  html += '</ul>';
  // 전리품: 보스가 남긴 것(out.drops)과 싸우는 동안 주운 것(G.gain.loot)
  var drops = (out.drops || []).slice();
  if (G.gain && G.gain.loot && G.gain.loot.length && G.gain.loot !== out.drops) G.gain.loot.forEach(function (d) { if (drops.indexOf(d) < 0) drops.push(d); });
  if (drops.length) {
    html += '<h5>전리품 <em>' + drops.length + '점</em></h5>';
    if (DS.lootUI && DS.lootUI.list) html += '<div class="drops"><ul class="loot">' + DS.lootUI.list(drops) + '</ul></div>';
    else html += '<ul class="loot drops">' + drops.map(function (d) {
      var t = typeof d === 'string' ? d : (d && (d.name || d.id)) || '', col = d && d.grade && DS.GRADES[d.grade] ? DS.GRADES[d.grade].col : '';
      return t ? '<li' + (d && d.grade >= 4 ? ' class="hl"' : '') + '><b' + (col ? ' style="color:' + col + '"' : '') + '>' + esc(t) + '</b>' + (d && d.n > 1 ? ' ×' + d.n : '') + '</li>' : '';
    }).join('') + '</ul>';
    var nUp = upgradable();      // 가방에 출전 지휘관이 입던 것보다 좋은 장비가 생겼으면 여기서 바로 (가방 → 입히기 → 고르기를 건너뛴다)
    if (nUp) html += '<button class="btn wide upg" data-upg="1">▲ 자동 장착 <small>가문 ' + nUp + '개</small></button>';
  }
  // 깃발: 레벨 전 → 후와 경험치 막대
  var crows = '', anyUp = false, lvHint = '';
  sv.party.forEach(function (id) {
    var ch = sv.chars[id]; if (!ch || out.joins.indexOf(ch) >= 0) return;
    var cap = DS.capL(ch), b = sn && sn.L[id] != null ? sn.L[id] : null, up = b != null && ch.L > b, pro = up && DS.tierOfL(ch.L) > DS.tierOfL(b);
    if (deadCh[id]) { crows += '<li class="gone">' + charSpr(ch, 1.5) + '<span class="nm">' + esc(DS.charName(ch)) + '</span><span class="lvs"><b>' + lvS(b != null ? b : ch.L) + '</b> <em class="lostt">' + (deadCh[id] === 2 ? '천수' : '쓰러짐') + '</em></span></li>'; return; }      // 떠난 이에게 레벨업 줄을 붙이지 않는다
    if (up) anyUp = true;
    var cp1 = DS.cardPower(sv, ch), cp0 = sn && sn.cp && sn.cp[id] != null ? sn.cp[id] : cp1, dcp = cp1 - cp0;
    crows += '<li' + (up ? ' class="up"' : '') + '>' + charSpr(ch, 1.5) + '<span class="nm">' + esc(DS.charName(ch)) + '<small class="num rcp">' + fmtN(cp1) + (dcp ? ' <em class="' + (dcp > 0 ? 'up' : 'dn') + '">' + (dcp > 0 ? '+' : '−') + fmtN(Math.abs(dcp)) + '</em>' : '') + '</small></span><span class="lvs">' + (up ? '<i>' + lvS(b) + '</i> → ' : '') + '<b>' + lvS(ch.L) + '</b>' + (pro ? ' <em>승급</em>' : up ? ' <em>+' + (ch.L - b) + '</em>' : '') + '</span>' +
      '<i class="bar exp"><u style="width:' + (ch.L >= cap ? 100 : Math.min(100, ch.exp / DS.expNeed(ch.L) * 100)) + '%"></u></i></li>';
  });
  if (anyUp && sv.seen && !sv.seen.lvx) { sv.seen.lvx = 1; lvHint = '<p class="dim lvx">10레벨마다 단 +1 (새 기술)</p>'; }      // 「단」 첫 설명 (한 번)
  var hup = (G.vetUps || []).filter(function (x) { return x && x.ch; });
  if (hup.length) lvHint += '<ul class="rnote hup">' + hup.map(function (x) { return '<li><span>' + esc(DS.flagName(x.ch.cls)) + '</span><small>가문 공훈</small><b>' + esc(DS.hName(x.to)) + '</b></li>'; }).join('') + '</ul>';      // r45 ui: 한 줄 → 가문마다 줄      // r42: 가문 공훈 계급이 올랐다
  if (crows) html += '<h5>가문</h5><ul class="rc">' + crows + '</ul>' + lvHint;
  // 가문원: 이번 싸움의 처치 수, 최다 처치 한 명, 경험치 막대
  var ms = [], topId = null, topK = 0;
  sv.party.forEach(function (id) { if (sv.chars[id]) DS.mercsOf(sv, id).forEach(function (m) { ms.push(m); }); });
  if (kills) ms.forEach(function (m) { var n = kills['m' + m.id] || 0; if (n > topK) { topK = n; topId = m.id; } });
  var ups = {}; ms.forEach(function (m) { var b0 = sn && sn.mx ? sn.mx[m.id] : null; if (b0 != null && DS.pL(m) > b0) ups[m.id] = { from: b0, to: DS.pL(m) }; });      // r42: 가문원의 개인 레벨 전 → 후
  var lostN = G.lost ? G.lost.length : 0;
  if (ms.length || lostN) {
    // r8 menus (trim 7): 공훈이 오른 용병·새 별명·최다 처치만 줄로, 나머지는 한 줄로 모은다
    var mNote = function (m) { var ttl = DS.mercTitle ? DS.mercTitle(m) || '' : ''; return !!(ups[m.id] || m.id === topId || (ttl && sn && sn.mt && sn.mt[m.id] !== undefined && sn.mt[m.id] !== ttl)); };
    var msShow = ms.filter(mNote), msRest = ms.length - msShow.length;
    html += '<h5>가문원' + (ms.length && !lostN ? ' <em class="safe">모두 돌아옴 ' + ms.length + '명</em>' : '') + '</h5>';
    if (msShow.length) html += '<ul class="rm">' + msShow.map(function (m) {
      var up = ups[m.id], kn = kills ? kills['m' + m.id] || 0 : null, ttl = DS.mercTitle ? DS.mercTitle(m) || '' : '', newT = ttl && sn && sn.mt && sn.mt[m.id] !== undefined && sn.mt[m.id] !== ttl;
      return '<li' + (up || newT ? ' class="up"' : '') + '><b>' + (ttl ? '<i class="ttl">' + esc(ttl) + '</i> ' : '') + esc(m.n || DS.MERCS[m.type].name) + '</b>' + (newT ? '<em class="top nt">새 별명</em>' : '') + (m.id === topId ? '<em class="top">최다 처치</em>' : '') +
        '<span>' + (kn != null ? '<i class="rk">처치 ' + kn + '</i> ' : '') + (up ? (DS.tierOfL(up.from) === DS.tierOfL(up.to) ? DS.tierOfL(up.to) + '단 Lv' + DS.lvOfL(up.from) + '→<b>' + DS.lvOfL(up.to) + '</b>' : lvS(up.from) + '→<b>' + lvS(up.to) + '</b>') : lvS(DS.pL(m))) + '</span><i class="bar"><u style="width:' + vetBar(m) + '%"></u></i></li>';
    }).join('') + (msRest && msShow.length ? '<li class="rest">그 외 ' + msRest + '명 귀환</li>' : '') + '</ul>';
    if (lostN) html += '<ul class="loot"><li class="lost">쓰러진 이 ' + lostN + '명' + pills(G.lost.map(function (m) { return DS.mercCall(m); })) + '</li></ul>';
  }
  if (out.joins.length) {
    html += '<ul class="loot">';
    out.joins.forEach(function (ch) {
      var cast = LORE().cast && LORE().cast[ch.cls], heard = cast && cast.join && s && s.outro && JSON.stringify(s.outro).indexOf(cast.join) >= 0;      // 맺음 이야기에서 방금 한 말이면 되풀이하지 않는다
      var say = cast && cast.join && !heard ? (cast.w ? lt(cast.w) + ' — ' : '') + '"' + lt(cast.join) + '"' : '';
      html += '<li class="join">' + charSpr(ch, 3) + '<span><b><i class="tg ok">새 가문</i> ' + esc(DS.flagName(ch.cls)) + '</b>' + DS.charTitle(ch) + ' Lv' + DS.lvOfL(ch.L) + (say ? '<q>' + esc(say) + '</q>' : '') + '<small>' + DS.CLASSES[ch.cls].blurb + '</small></span></li>';
    });
    html += '</ul>';
  }
  // r8 menus (trim 7): 결과 창의 「가문」 줄(lgResultRows)은 뺐다 — 지휘관의 죽음은 제목 아래에, 출생·성년은 창을 닫은 뒤의 소식 창 한 곳에서만 (같은 소식을 두 번 듣지 않게)
  if (s.pit && s.pit < 10) html += '<p class="dim">갱도 ' + (s.pit + 1) + '층 열림</p>';
  html += '<div class="rfoot"><p class="nextl"><i>다음</i>' + esc(nextLine()) + '</p><button class="btn gold wide" data-close>계속' + (U.svg ? U.svg('chev', 16) : '') + '</button></div></div>';      // 「다음」과 「계속」은 늘 보이게 아래에 붙여 둔다
  var rareD = (out.drops || []).filter(function (d) { return d && d.kind === 'gear' && (d.grade || 0) >= 4; });      // 2.1.1: 승리 보상의 귀한 장비는 결과 창 위에 크게 (소리도 거기서)
  if (gotR.length && !(rareD.length && DS.lootCall)) A2('rare', 'star');
  var o = overlay(html, 'modal center res26');
  if (rareD.length && DS.lootCall) DS.lootCall(rareD, { delay: 900 });
  snap = null;
  // r26: 별이 하나씩 튀고 · 골드·경험치가 0 부터 차오른다 (움직임 줄이기면 바로 끝값)
  setTimeout(function () { $$('[data-cu]', o).forEach(function (el, i) { setTimeout(function () { U.countUp(el, +el.dataset.cu, 650, el.dataset.pre || ''); }, i * 120); }); }, U.calm && U.calm() ? 0 : 420);
  if (!(U.calm && U.calm())) $$('.rstars .st:not(.off)', o).forEach(function (el, i) { setTimeout(function () { A('star'); }, 160 + i * 140); });
  o.addEventListener('click', function (e) {
    var ub = e.target.closest('[data-upg]'); if (!ub) return;
    var sv2 = G.save, names = [];
    sv2.party.forEach(function (id) { var c = sv2.chars[id]; if (c && DS.autoEquip(sv2, c)) names.push(DS.charName(c)); });
    DS.refreshUnits(); U.persist(); A(names.length ? 'ok' : 'cancel');
    ub.outerHTML = '<p class="upg done">' + (names.length ? '<b>장비 교체</b>' + pills(names) + '<small>쓰던 것은 가방으로</small>' : '바꿀 장비 없음') + '</p>';
  });
  o.onclose = function () {
    var done = function () { if (cb) cb(); };
    var after = function () { done(); };
    if (s.id === DS.SCENARIOS.length && out.first) {
      DS.Audio.bgm('ending');
      var end = LORE().ending && LORE().ending.length ? LORE().ending : ['어스름의 문이 닫히자 북쪽 하늘이 처음으로 맑게 개었다.', '열 가문은 세 개의 큰 가문이 되어 한 곳에 섰다. 풋내기 용병대장의 이야기는 여기까지.',
        '끝까지 함께해 주셔서 고맙습니다. 바닥 없는 갱도와 지난 시나리오는 계속 열려 있습니다.'];
      story(end, function () { DS.showRecord(after, true); }, '엔딩');
      return;
    }
    after();
  };
};
// 맺음 기록: 여기까지의 발자취 (엔딩 직후, 그리고 설정 탭에서 언제든)
function bestEnh(sv) {
  var best = null;
  function see(id) { var g = DS.gear(id); if (g && g.enh && (!best || g.enh > best.enh)) best = g; }
  DS.charList(sv).forEach(function (c) { see(c.w); }); Object.keys(sv.gear || {}).forEach(see);
  return best;
}
DS.showRecord = function (cb, ending) {
  var sv = G.save, t = Math.floor(+sv.time || 0), fl = sv.fallen || [], be = bestEnh(sv), cleared = Object.keys(sv.cleared || {}).length;
  var fz = DS.fuseProg ? DS.fuseProg(sv).fused : 0;      // r42: 합일한 사람 수
  var html = '<div class="result record"><p class="eyebrow">' + (ending ? '엔딩' : '기록') + '</p>' + (ending ? scene('ending') : '') + '<h2>' + esc(sv.name) + '의 가문</h2><dl class="rec">' +
    (t >= 60 ? '<dt>플레이 시간</dt><dd><b class="num">' + (t >= 3600 ? Math.floor(t / 3600) + '</b>시간 <b class="num">' : '') + Math.floor(t % 3600 / 60) + '</b>분</dd>' : '') +
    '<dt>끝낸 시나리오</dt><dd><b class="num">' + cleared + '</b> / ' + DS.SCENARIOS.length + (sv.pit > 1 ? ', 갱도 ' + sv.pit + '층까지 열림' : '') + '</dd>' +
    '<dt>쓰러뜨린 적</dt><dd><b class="num">' + (sv.kills || 0) + '</b></dd>' +
    '<dt>합일한 사람</dt><dd>' + (fz ? '<b class="num">' + fz + '</b>명' : '아직 없음') + '</dd>' +
    '<dt>최고 강화</dt><dd>' + (be ? '<span class="' + enhCls(be.enh) + '">' + esc(be.name) + '</span>' : '아직 없음') + '</dd></dl>';
  html += '<h5>깃대에 새긴 이름들 ' + (fl.length ? fl.length + '명' : '') + '</h5>' +
    (fl.length ? '<p class="names">' + fl.map(function (f) { return '<i style="color:' + gcol(f.g) + '">' + esc(f.n || (DS.MERCS[f.type] ? DS.MERCS[f.type].name : '')) + '</i>'; }).join('') + '</p>' : '<p class="dim">새길 이름이 없다. 한 사람도 잃지 않았다.</p>');
  html += '<button class="btn gold wide stick" data-close>' + (ending ? '계속' : '닫기') + '</button></div>';
  var o = overlay(html, 'modal center');
  o.onclose = function () { if (cb) cb(); };
};
DS.showPromo = function (p, cb) {
  var ch = G.save.chars[p.id]; if (!ch) { if (cb) cb(); return; }
  var c = DS.CLASSES[ch.cls], learned = c.skills.filter(function (s) { return s[1] > p.from && s[1] <= p.to; }).map(function (s) { return DS.SKILLS[s[0]]; });
  var nextSk = c.skills.filter(function (s) { return s[1] > p.to; }).sort(function (a, b) { return a[1] - b[1]; })[0];
  A2(p.fused ? 'fuse' : 'promo', p.fused ? 'phase' : 'level');
  // 지난 단을 지나며 오른 능력 (같은 장비 기준). 합일은 새 몸이라 지금 능력만 보여 준다
  var now = DS.charStats(ch), was = p.fused ? null : withChange(ch, { L: Math.max(1, (p.to - 2) * DS.LV_PER_TIER + 1) }), mk = mainKey(ch);
  var bw = ch.id !== G.save.hero && DS.bearer ? DS.bearer(G.save, ch) : null;      // r27: 가주가 부대원이면 그 사람의 능력치(실제 유닛 사양)로
  if (bw) { var sp2 = function (c) { var u = DS.cmdSpec(c, false, bw); return { hp: u.mhp, atk: u.atk, mag: u.mag, def: u.def, res: u.res }; }, cw = {}, kq; for (kq in ch) cw[kq] = ch[kq]; cw.L = Math.max(1, (p.to - 2) * DS.LV_PER_TIER + 1); now = sp2(ch); if (was) was = sp2(cw); }
  var cells = [['hp', 'HP'], [mk, SNAME[mk]], ['def', '방어'], ['res', '마방']].map(function (k) {
    var d = was ? now[k[0]] - was[k[0]] : 0;
    return '<span><i>' + k[1] + '</i><b class="num">' + now[k[0]] + '</b>' + (d > 0 ? '<em>+' + d + '</em>' : '') + '</span>';
  }).join('');
  var cast = LORE().cast && LORE().cast[ch.cls], t7 = !p.fused && p.to === 7 && cast && cast.t7 && ch.id !== G.save.hero ? (cast.w ? lt(cast.w) + ' — ' : '') + '"' + lt(cast.t7) + '"' : '';
  var tail = '';
  if (nextSk && DS.SKILLS[nextSk[0]]) tail = '다음 기술: ' + nextSk[1] + '단에 「' + DS.SKILLS[nextSk[0]].name + '」';
  else if (!c.master && p.to === 7) tail = '7단 Lv10 가문 셋이 모이면 교회에서 함께 오릅니다';
  var pl = DS.charLook ? lgTry(function () { return DS.charLook(ch, G.save); }) : null;      // r27: 부대원이 가주면 제 모습 그대로 — 테두리 빛만 오른다
  var o = overlay('<div class="result promo res2"><p class="eyebrow">' + (p.fused ? p.fused + ' 합일' : '승급') + '</p><h2>' + p.to + '단 ' + esc(DS.tierName(ch.cls, p.to)) + '</h2>' +
    '<div class="evo' + (pl ? ' keep' : '') + '">' + (p.fused ? '' : charSpr(ch, 4, p.from) + '<span class="arr">▶</span>') + charSpr(ch, 5, p.to) + '</div>' +
    '<p class="rn">' + esc(DS.charName(ch)) + (p.fused ? '. 세 가문이 함께 올랐다' : pl ? '. 단이 올랐다' : '. 모습이 바뀌었다') + '</p>' +
    (t7 ? '<p class="say">' + esc(t7) + '</p>' : '') +
    '<div class="stats grow">' + cells + '</div>' + (was ? '<p class="dim">' + (p.to - 1) + '단 동안 오른 능력</p>' : '') +
    (learned.length ? '<ul class="loot">' + learned.map(function (S) { return '<li class="hl"><b>' + S.name + '</b> 습득. ' + S.desc + '</li>'; }).join('') + '</ul>' : '') +
    (p.note ? '<p class="dim">' + esc(p.note) + '</p>' : '') +
    (tail ? '<p class="nextl"><i>앞으로</i>' + esc(tail) + '</p>' : '') +
    '<button class="btn gold wide stick" data-close>확인</button></div>', 'modal center');
  o.onclose = function () { if (cb) cb(); };
};

// ───────── 공지사항 ─────────
var KIND = { '새로': 'new', '변경': 'chg', '고침': 'fix', '선물': 'gift', '안내': 'info', '확인': 'fix' };
DS.openNotes = function (after) {
  var seen = DS.Save.meta().seenVer, sv = G.save || null;
  var o = sheet('공지사항', function () {
    var html = '<p class="hint">현재 버전 <b class="num">v' + DS.VERSION + '</b></p>';
    DS.NOTES.forEach(function (n, i) {
      html += '<details class="note"' + (i === 0 ? ' open' : '') + '><summary><span class="ntag' + (i === 0 ? ' now' : '') + '">' + esc(n.tag) + '</span><b>' + esc(n.title) + '</b>' +
        '<small>v' + n.ver + (n.date ? ', ' + n.date : '') + (n.ver === DS.VERSION && seen !== DS.VERSION ? ', <em>NEW</em>' : '') + '</small></summary>' +
        '<p class="lead">' + esc(n.lead) + '</p><ul>' + n.items.map(function (it) { return '<li><i class="k k-' + KIND[it[0]] + '">' + it[0] + '</i><span>' + esc(it[1]) + '</span></li>'; }).join('') + '</ul></details>';
    });
    html += '<h4>저장 안내</h4><p class="hint">저장은 이 브라우저에 남습니다. 로그인하면 설정의 클라우드 저장으로 계정에도 올립니다. 버전이 올라가면 저장을 새 구조로 바꾸고, 바꾸기 전 원본을 백업해 둡니다.' +
      (sv ? ' 지금 저장: 구조 ' + sv.v + '번, 마지막으로 저장한 버전 v' + esc(sv.ver || DS.VERSION) + (sv.perk ? ', ' + esc(sv.perk.rank) + ' 특전 적용 중' : '') + '.' : '') + '</p>';
    return html;
  }, 'notes');
  DS.Save.setMeta({ seenVer: DS.VERSION });
  o.onclose = function () { var d = $('#btnNotes .dot'); if (d) d.hidden = true; if (after) after(); };
};
// 회귀자 특전 안내
function showPerk(p, cb) {
  A('level');
  var o = overlay('<div class="result promo"><p class="eyebrow">회귀자 특전</p><h2>다시 오셨습니다</h2>' +
    '<p class="rn">이전 버전을 플레이해 주신 분께 드립니다. 많이 바뀌어 처음부터 시작합니다.</p>' +
    '<ul class="loot">' + p.lines.map(function (l) { return '<li class="hl">' + esc(l) + '</li>'; }).join('') + '</ul>' +
    '<button class="btn gold wide" data-close>받기</button></div>', 'modal center');
  o.onclose = function () { if (cb) cb(); };
}
// 이어받은 저장에 쌓인 소식 (업데이트 선물 등)
DS.showNews = function () {
  var s = G.save; if (!s || !s.news || !s.news.length) return;
  var list = s.news.slice(); s.news = []; U.persist(); A('coin');
  overlay('<div class="result"><p class="eyebrow">v' + DS.VERSION + '</p><h2>소식</h2><ul class="loot">' + list.map(function (l) { return '<li class="hl">' + esc(l) + '</li>'; }).join('') + '</ul>' +
    '<p class="dim">자세한 것은 메뉴 → 설정 → 공지사항에.</p><button class="btn gold wide" data-close>확인</button></div>', 'modal center');
};

// ───────── 메뉴 ─────────
var STAT = [['hp', 'HP'], ['mp', '마나'], ['atk', '공격'], ['def', '방어'], ['mag', '마공'], ['res', '마방']];
function famOf(cls) { var f = DS.CLASSES[cls].fam; return f && DS.FAMILY[f] ? f : null; }
// r16 person: 묶음과 합일 가문도 가문 이름으로 — 「로저스, 라니스터, 스카이워커 가문」, 「타르가르옌 가문」
function hsShort(cls) { var h = DS.flagHouse ? DS.flagHouse(G.save, cls) : ''; return String(h || '').replace(/ 가문$/, '') || DS.CLASSES[cls].name; }
function famHouses(f) { var F = DS.FAMILY[f]; return F ? F.members.map(hsShort).join(', ') + ' 가문' : ''; }
// 1.0.1: 그 가문이 든 합일 묶음의 이름 꼬리표 (「라니스터 대가문」). 없으면 빈칸
function fuTag(s, ch, cls) { var u = ch && DS.unionOf ? DS.unionOf(s, ch.id) : null; return u ? '<i class="fuu' + (cls ? ' ' + cls : '') + '">' + esc(DS.unionName(s, u)) + '</i>' : ''; }
// ── r12 screen: 깃발 창 · 「이 깃발을 들 사람」 시트 (규칙은 DS.hand · DS.bnPct · DS.cmdSpec) ──
function bnWhere() { return G.scn || (G.sim && G.sim.combat) ? 'battle' : G.zone && G.zone.town ? 'town' : 'field'; }
function flagPow(ch, who) { return DS.power(DS.cmdSpec(ch, ch.id === G.save.hero, who || null)); }      // r15: 전투력 = DS.power(유닛 사양)
// ── r15 power: 전투력 숫자 · 공훈 효과 꼬리표 · 전투력 내역 표 ──
function fmtN(n) { n = Math.round(n || 0); return (n < 0 ? '−' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function pwNum(n, cls) { return '<b class="pw num' + (cls ? ' ' + cls : '') + '">' + (n > 0 ? fmtN(n) : '—') + '</b>'; }
function pwBox(n, lab, cls) { return '<span class="pwb' + (cls ? ' ' + cls : '') + '"><small>' + (lab || '전투력') + '</small>' + pwNum(n) + '</span>'; }
function pwDelta(a, b) { var d = b - a; return '<span class="pwd"><i class="num">' + fmtN(a) + '</i> → <b class="num">' + fmtN(b) + '</b> <em class="num ' + (d > 0 ? 'up' : d < 0 ? 'dn' : '') + '">' + (d > 0 ? '+' : d < 0 ? '−' : '±') + fmtN(Math.abs(d)) + '</em></span>'; }
// 공훈 효과: 계급 이름은 그대로 두고, 옆에 실제 효과를 숫자로. follow = 따르는 자리(배율), 아니면 깃발 얹힘(%)
// 4.0.6: 등급과 공훈 단계표 — 지금 단계에 불이 들어오고, 효과를 숫자로
// r42: 사람의 사다리 — 등급 · 개인 단(단마다 받은 성장, 맹주는 필살기 표식). 공훈은 이제 가문의 것 (가문 창)
function rankBlock(who, merc, follow) {
  if (!who) return '';
  var g = Math.max(1, Math.min(5, Math.round(+who.g || (merc ? 1 : 3)))), G0 = DS.GRADES[g] || {}, L = DS.pL(who), t = DS.tierOfL(L);
  var gm = DS.bnGMul(who), gEff = (merc && G0.mul ? DS.chip('능력', '×' + G0.mul.toFixed(2), G0.mul > 1 ? 1 : G0.mul < 1 ? -1 : 0) : '') + DS.chip('가주일 때', '×' + gm.toFixed(2), gm > 1 ? 1 : gm < 1 ? -1 : 0);      // r45 ui 칩 · r44 등급 배율
  var h = '<div class="rkbox">';
  h += '<div class="rkhd"><span class="rkk">등급</span><b style="color:' + (G0.col || '#efe6d0') + '">' + esc(G0.name || '') + '</b><small class="schips">' + gEff + '</small></div>';
  h += '<ol class="rkl">' + DS.GRADES.slice(1).map(function (q, i) { var k = i + 1; return '<li class="' + (k === g ? 'on' : k < g ? 'past' : '') + '" style="--rc:' + q.col + '">' + esc(q.name) + '</li>'; }).join('') + '</ol>';
  h += '<div class="rkhd"><span class="rkk">단</span><b>' + t + '단 Lv' + DS.lvOfL(L) + '</b><small>' + esc((who.fz ? '합일함. 레벨 100까지' : L >= 70 ? '7단 Lv10. 교회에서 합일하면 70을 넘는다' : '단이 오를 때마다 기질에 맞는 능력치가 오른다')) + '</small></div>';
  var lord = !!(DS.ultFor && DS.ultFor(G.save, who)), uv = {}; if (lord && DS.ULT && DS.ULT.vetP) DS.ULT.vetP.forEach(function (q) { uv[DS.tierOfL(q[0])] = q[1]; });      // 맹주: 5단 · 8단 = 필살기 +15%
  var pgl = DS.pgList ? DS.pgList(who) : [], st = DS.vetStars(L);
  h += '<ol class="rkl v t10">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (k) { var uu = uv[k], gg = k > 1 ? pgl[k - 2] : null, sk = lord && DS.ULT && DS.ULT.stars.indexOf((k - 1) * 10 + 1) >= 0; return '<li class="' + (k === t ? 'on' : k < t ? 'past' : '') + (uu || sk ? ' ult' : '') + '">' + k + '단' + (uu ? '<i class="rku">필살 +' + Math.round(uu * 100) + '%</i>' : '') + (sk ? '<i class="rku ust">✦</i>' : '') + (gg ? '<i class="rkg">' + esc(DS.pgText(gg)) + '</i>' : '') + '</li>'; }).join('') + '</ol>';
  if (DS.ULT && lord && st) h += '<p class="rkgs">' + esc('필살기 강화 ✦' + st + '. ✦마다 필살기 세기 +' + Math.round(DS.ULT.starP * 100) + '%, 충전 +' + Math.round(DS.ULT.starR * 100) + '%') + '</p>';
  return h + '</div>';
}
// r32: 필살기 칸 (사람 창). r36: 맹주만 · r38: 「타고난 필살기」 — 깨어나기 전에도 무엇인지 보인다 (흐리게, 「3번 시나리오를 깨면 깨어난다」). 고르기·바꾸기는 없다
function ultBlock(who) {      // 2.1.0: 누구나 하나씩 타고난다. 개인 5단에 깨어난다 (잠긴 칸은 흐리게). 쓰는 것은 조작하는 사람만
  var s = G.save; if (!who || !DS.ULT || !DS.ultFor) return '';
  var id = DS.ultFor(s, who), S = id && DS.SKILLS[id], on = !!(S && DS.ultAwake && DS.ultAwake(who)), lord = DS.ultHeroWho && DS.ultHeroWho(s) === who;
  if (!S) return '';
  var tag = S.cls && DS.CLASSES[S.cls] ? DS.CLASSES[S.cls].name + ' 몫' : '성격 몫';
  if (!on) return '<div class="ultbox inn lock"><span class="ulab">✦ 타고난 필살기</span><b>' + esc(S.name) + ' <i class="tg">' + esc(tag) + '</i></b><small class="ud">' + esc(S.desc) + '</small>' + (S.fl ? '<small class="uf">「' + esc(S.fl) + '」</small>' : '') +
    '<small class="uw lk">' + (U.svg ? U.svg('lock', 14) : '') + esc('개인 5단에 깨어난다. 지금 ' + DS.tierOfL(DS.pL(who)) + '단') + '</small></div>';
  var pw = DS.ultPow(who), rt = DS.ultRate(who), st = DS.pStars(who);
  return '<div class="ultbox inn"><span class="ulab">✦ 타고난 필살기</span><b>' + esc(S.name) + ' <i class="tg">' + esc(tag) + '</i></b><small class="ud">' + esc(S.desc) + '</small>' + (S.fl ? '<small class="uf">「' + esc(S.fl) + '」</small>' : '') +
    '<small class="uw">' + esc((lord ? '맹주의 것. ' : '가주로 서서 조작할 때 쓴다. ') + '싸우는 동안 게이지가 찬다. 직접 눌러야 쓴다. 8단에 오르면 세지고 9단, 10단, 레벨 100에 ✦ 강화가 붙는다' + (pw > 1.001 ? '. 세기 ×' + pw.toFixed(2) : '') + (rt > 1.001 ? ', 충전 ×' + rt.toFixed(2) : '') + (st ? ' (✦' + st + ')' : '')) + '</small></div>';
}
// r38: 깨어남 — 시나리오 3을 깬 뒤(또는 대를 이은 새 맹주가 처음) 한 번. 「타고난 필살기가 깨어났다」 + 이름·효과·내력
function ultRevealOpen() {
  var s = G.save, id = DS.heroUlt(s), S = id && DS.SKILLS[id], who = DS.ultHeroWho(s); if (!S || !who) return null;
  DS.ultRevealed(s); U.persist();
  var hc = s.chars[s.hero], nm = (hc && (hc.name || s.name)) || '맹주', tag = S.cls && DS.CLASSES[S.cls] ? DS.CLASSES[S.cls].name + ' 몫' : '성격 몫';
  var o = overlay('<div class="result ultrv"><p class="urk">' + esc(nm) + '</p><h2>타고난 필살기가 깨어났다</h2><div class="ultbox inn wake"><span class="ulab">타고난 필살기</span><b>' + esc(S.name) + ' <i class="tg">' + esc(tag) + '</i></b><small class="ud">' + esc(S.desc) + '</small>' + (S.fl ? '<small class="uf">「' + esc(S.fl) + '」</small>' : '') + '</div>' +
    '<p class="dim">' + esc('태어날 때부터 지니고 있던 것이다. 개인 5단에 깨어났다. 싸우는 동안 게이지가 차면 기술 줄 왼쪽 끝 ✦ 칸을 눌러 쓴다') + '</p><button class="btn wide gold" data-close>알았다</button></div>', 'modal center');
  A('star'); DS.refreshUnits();
  return o;
}
DS.ultRevealOpen = ultRevealOpen;
function vnBar(who) {      // r42: 사람의 경험치 막대 — 다음 레벨까지
  var L = DS.pL(who), cap = DS.pCap(who), e = +(who && who.exp) || 0, need = DS.expNeed(L);
  return '<div class="bar exp"><u style="width:' + (L >= cap ? 100 : Math.max(0, Math.min(100, e / need * 100))) + '%"></u></div><small class="fx2"><i class="nx">' + (L >= cap ? (cap < 100 ? '7단 Lv10. 합일을 기다린다' : '최고 레벨') : '다음 레벨까지 <b class="num">' + fmtN(Math.ceil(need - e)) + '</b>') + '</i></small>';
}
function pTier(who) { var L = DS.pL(who); return '<span class="ptier num">' + DS.tierOfL(L) + '단 <i>Lv' + DS.lvOfL(L) + '</i></span>'; }      // r42: 사람의 단 (사람 창 이름 옆)
function hFx(ch, follow) { if (!ch) return ''; var r = DS.hRank(ch); return '<i class="vtag">가문 공훈 ' + DS.hName(r) + '</i>' + (follow ? '<i class="fxt">가문원 ×' + DS.hMul(ch).toFixed(2) + '</i>' : '<i class="fxt">가주 +' + DS.hPct(ch) + '%</i>'); }
function natureRow(who) {
  var N = DS.mercNature ? DS.mercNature(who) : null; if (!N) return '';
  return '<dt>성격</dt><dd><b>' + esc(N.name) + '</b> <small class="dim">' + esc(N.desc) + '</small></dd>';
}
function vetFx(who, follow) { if (!who) return ''; return pTier(who).replace('ptier', 'ptier vtag'); }      // r42: 사람의 단
function gradeFx(who) { var g = DS.bnGrade(who); return g ? '<i class="fxt">등급 ' + DS.pctTxt(g) + '</i>' : ''; }
var PW_ROW = { base: '기본', gear: '장비와 강화', merit: '가문 공훈', grade: '등급', trait: '특성', native: '태생', tm: '기질', pg: '개인 성장', age: '노년과 비탄' };
function pwTable(pp) {
  if (!pp || !pp.rows) return '';
  var top = 1, h = '<table class="pwt"><tbody>';
  pp.rows.forEach(function (r) { if (r.k !== 'base') top = Math.max(top, Math.abs(r.n)); });
  pp.rows.forEach(function (r) {
    if (r.k === 'age' && !r.n) return;
    var w = r.k === 'base' ? 0 : Math.min(100, Math.abs(r.n) / top * 100);
    h += '<tr class="' + (r.k === 'base' ? 'base' : r.n < 0 ? 'neg' : !r.n ? 'zero' : '') + '"><th>' + (PW_ROW[r.k] || esc(r.lb || r.k)) + (r.t ? '<small>' + esc(r.t) + '</small>' : '') + '</th><td class="pb">' + (w ? '<i style="width:' + w.toFixed(1) + '%"></i>' : '') + '</td><td class="num">' + (r.k === 'base' ? '' : r.n > 0 ? '+' : r.n < 0 ? '−' : '') + fmtN(Math.abs(r.n)) + '</td></tr>';
  });
  return h + '<tr class="sum"><th>합계</th><td></td><td class="num">' + fmtN(pp.total) + '</td></tr></tbody></table>';
}

function kinFree(s) { return DS.mercsOf(s, s.hero).filter(function (m) { return !m.cast; }); }      // 빈 가문의 가주로 보낼 수 있는 어른 가문원
// 맹주 가문의 가문원 한 사람을 빈 가문의 가주로 보낸다: 빈 가문 고르기
function kinSend(mid, parent) {
  var s = G.save, m = mercById(mid); if (!m) return;
  var hs = DS.charList(s).filter(function (ch) { return DS.vacant(s, ch); });
  if (!hs.length) { A('cancel'); toast('빈 가문이 없다'); return; }
  var q = overlay('<div class="result bsendbox"><h2>' + esc(josa(m.ttl || m.n || '', '을를')) + ' 어느 가문의 가주로?</h2><p class="dim">그 가문의 병과를 받아 가주가 된다. 맹주 곁을 떠난다.</p><div class="bto">' +
    hs.map(function (ch) { var pw = DS.flagPower(s, ch, m); return '<button class="row bto1" data-bto="' + ch.id + '">' + crestH(ch, 22) + '<span class="tx"><b>' + esc(DS.flagName(ch.cls)) + '</b><small>' + esc(DS.CLASSES[ch.cls].name) + ' 가주로, 전투력 ' + U.fmtN(pw) + '</small></span></button>'; }).join('') +
    '</div><button class="btn wide" data-close>그만둔다</button></div>', 'modal center');
  q.addEventListener('click', function (e) {
    var b = e.target.closest('[data-bto]'); if (!b) return;
    var chId = +b.dataset.bto, r = DS.hand(s, chId, mid, { where: bnWhere() });
    if (!r.ok) { A('cancel'); toast(r.why); return; }
    A('ok'); DS.rebuildParty(); DS.updateQuest(); U.persist(); q.close();
    toast(josa(m.ttl || m.n || '', '이가') + ' ' + DS.flagName(s.chars[chId].cls) + '의 가주가 되었다', 2600);
    if (r.nf && DS.nfAsk) setTimeout(function () { DS.nfAsk({ k: 'm', id: mid }, null, '새 가주, 처음 이름 정하기 (무료)'); }, 250);
    if (parent && parent.isConnected && parent.draw) parent.draw();
  });
  return q;
}
DS.kinSendOpen = kinSend;
// 이 가문의 가주: 막사의 같은 병과와 맞바꾸기 · 빈 가문이면 맹주 가문의 어른 가문원(아이)을 보낸다 (규칙 DS.hand)
function bnPick(chId, parent) {
  var cmpId = 0;      // r16 person: 겹쳐 볼 후보
  var o = sheet('이 가문의 가주', function () {
    var s = G.save, ch = s.chars[chId], cur = DS.bearer(s, ch), html = '', w = bnWhere();
    if (!ch) return '';
    var base = cur ? flagPow(ch, cur) : 0, pool = DS.sbOf(s, chId).concat(cur ? [] : kinFree(s));
    var list = pool.map(function (m) { var p = flagPow(ch, m); return { m: m, p: p, d: p - base, kin: !m.sb }; }).sort(function (a, b) { return (a.kin ? 1 : 0) - (b.kin ? 1 : 0) || b.d - a.d || DS.pL(b.m) - DS.pL(a.m); });
    html += '<div class="pkhd"><span><b>' + crestH(ch, 18) + esc(DS.flagName(ch.cls)) + '</b><small>' + esc(DS.houseTitle(s, ch).sub) + '</small></span>' + pwBox(base, '지금 전투력') + '</div>';
    html += '<p class="hint sm">' + (cur ? '막사의 같은 병과와 자리를 바꾼다. 물러난 가주는 막사로 간다.' : '빈 가문이다. 맹주의 어른 아이를 보내면 이 가문의 병과를 받아 가주가 된다.') + '</p>';
    var cand = cmpId ? mercById(cmpId) : null; if (cand === cur) cand = null;
    html += pickRadar({ k: 'bear', ch: ch }, cur, cand);
    if (cur) html += '<div class="row merc now pk" data-info="' + cur.id + '">' + mercChip(cur, null) + '<span class="pkv">' + natTag(ch, cur) + '<em class="bp' + (DS.bnPct(cur, ch) < 0 ? ' neg' : '') + '">' + DS.pctTxt(DS.bnPct(cur, ch)) + '</em><small>지금 가주, ' + lv(DS.pL(cur)) + '</small></span></div>';
    list.forEach(function (x) {
      var m = x.m, at = x.kin ? '맹주 가문원' : '막사';
      html += '<div class="row merc pk" data-info="' + m.id + '">' + mercChip(m, null) + '<span class="pkv">' + (x.kin ? '<i class="nat ok">가문 병과를 받는다</i>' : natTag(ch, m)) + '<em class="bp' + (DS.bnPct(m, ch) < 0 ? ' neg' : '') + '">' + DS.pctTxt(DS.bnPct(m, ch)) + '</em><small>' + esc(at) + ', ' + lv(DS.pL(m)) + '</small></span><button class="btn small gold" data-bnto="' + m.id + '"' + (w === 'battle' ? ' disabled' : '') + '>' + (cur ? '교체' : x.kin ? '보내기' : '가주로') + '</button><p class="ms pwl">' + (cur ? pwDelta(base, x.p) : '<span class="pwd"><b class="num">' + fmtN(x.p) + '</b></span>') + cmpBtn(m.id, cmpId) + '</p></div>';
    });
    if (!list.length) html += '<p class="hint">' + (cur ? '막사에 같은 병과가 없다. 영웅관에서 모집하면 올 수 있다' : '보낼 사람이 없다. 영웅관에서 모집하거나 맹주의 아이가 자라길 기다린다') + '</p>';
    return html;
  }, 'sub');
  o.addEventListener('click', function (e) {
    var b = e.target.closest('[data-bnto]'), inf = e.target.closest('[data-info]'), cb = e.target.closest('[data-cmp2]');
    if (cb) { cmpId = +cb.dataset.cmp2 === cmpId ? 0 : +cb.dataset.cmp2; A('tap'); o.draw(); return; }
    if (!b) { if (inf) { A('tap'); mercInfo(+inf.dataset.info, o); } return; }
    var mid = +b.dataset.bnto, pm = mercById(mid), pch = G.save.chars[chId];
    var go = function () {
      var r = DS.hand(G.save, chId, mid, { where: bnWhere() });
      if (!r.ok) { A('cancel'); toast(r.why); return; }
      A('ok'); if (DS.rebuildParty && !busy()) DS.rebuildParty(); DS.updateQuest(); U.persist(); o.close();
      var nm = pm ? (pm.ttl || pm.n || '') : ''; if (nm && pch) toast(josa(nm, '이가') + ' ' + DS.flagName(pch.cls) + '의 가주가 되었다', 2600);
      if (r.nf && DS.nfAsk) setTimeout(function () { DS.nfAsk({ k: 'm', id: mid }, null, '새 가주, 처음 이름 정하기 (무료)'); }, 250);      // r32: 처음 가주가 된 이
    };
    if (pm && pm.sb && pch && DS.bnNative && !DS.bnNative(pch.cls, pm)) { natAsk(pch, pm, go); return; }      // r27: 태생이 다르면 한 번 묻는다 (가문원은 가문 병과를 받으니 묻지 않는다)
    go();
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
  return o;
}
DS.bnPickOpen = bnPick;
// r27 태생 병과: 후보 줄의 작은 꼬리표 · 태생이 다른 가주를 세우기 전의 확인 창
function natTag(ch, m) { if (!DS.bnNative || !m || !m.type) return ''; var ok = DS.bnNative(ch.cls, m); return '<i class="nat ' + (ok ? 'ok' : 'no') + '">' + (ok ? '태생 맞음' : '태생 다름') + '</i>'; }
function natAsk(ch, m, yes) {
  var nm = m.ttl || m.n || DS.MERCS[m.type].name, nat = DS.nativeName(m), hn = DS.flagName(ch.cls), cn = DS.CLASSES[ch.cls].name;
  var q = overlay('<div class="result natask"><h2>태생 병과가 다릅니다</h2><p>' + mercSpr(m, 3) + '</p><p><b>' + esc(nm) + '(' + esc(nat) + ')</b>' + esc(josa(nm, '은는').slice(nm.length)) + ' ' + esc(hn) + '(' + esc(cn) + ')의 기술을 제 능력치로 씁니다. 몸이 맞지 않아 능력치가 조금 줄어듭니다.</p><p class="dim">그래도 가주로 세울까요?</p>' +
    '<button class="btn gold wide" id="yesNat">세운다</button><button class="btn wide" data-close>취소</button></div>', 'modal center');
  $('#yesNat', q).addEventListener('click', function () { q.close(); yes(); });
  return q;
}
DS.natAsk = natAsk;
// 이 깃발을 들었던 이: 깃발을 든 채 잠든 사람(가계도의 d.fb) + 추모 기록(f.f)
function flagPast(ch) {
  var s = G.save, out = [], seen = {}, P = s.lin && s.lin.P || {};
  for (var k in P) { var p = P[k]; if (p && p.d && +p.d.fb === ch.id) { seen[p.n] = 1; out.push({ n: DS.linName ? lgTry(function () { return DS.linName(s, p.id); }) || p.n : p.n, at: p.d.at || '', why: '잠듦' }); } }
  (s.fallen || []).forEach(function (f) { if (f && +f.f === ch.id && f.h !== 0 && !seen[f.n] && DS.bearsFlag) { seen[f.n] = 1; out.push({ n: f.n, at: f.at || '', why: '쓰러짐' }); } });
  return out.slice(-12).reverse();
}
// 합일 조건 진행: ■■□ (7단 Lv10 가문 수 / 셋). 묶음에 들었으면 그 이름
function fuseLine(s, ch) {      // r42: 그 가문 가주의 합일 (사람 셋)
  var C = DS.CLASSES[ch.cls], b = ch.id === s.hero ? DS.heroPs(s) : DS.bearer(s, ch); if (C.master || !DS.fuseProg || !b) return '';
  if (b.fz) return '<p class="fzl"><i>합일</i><small>가주가 합일했다. 레벨 100까지</small></p>';
  var L = DS.pL(b), P = DS.fuseProg(s), ok = P.n, n = P.of, near = L >= DS.FUSE_MIN || DS.FUSE_MIN - L <= FUSE_NEAR; if (!P.can || (!near && !ok)) return '';
  var box = ''; for (var i = 0; i < n; i++) box += i < ok ? '■' : '□';
  return '<p class="fzl"><i>합일 조건</i><b class="fzb" aria-label="' + ok + ' / ' + n + '">' + box + '</b><small>7단 Lv10 사람 ' + ok + '/' + n + '</small></p>';
}
// r42: 가문 공훈 칸 — 표식 · 계급 · 효과 · 다음 계급까지 막대
function hMeritBox(ch) {
  var r = DS.hRank(ch), nx = DS.hNext(ch), x = +(ch.hx || 0);
  return '<div class="hmbox">' + (DS.vetBadge ? DS.vetBadge(r) : '') + '<b>가문 공훈 ' + esc(DS.hName(r)) + '</b><small class="schips">' + DS.chip('가주', '+' + DS.hPct(ch) + '%', DS.hPct(ch) > 0 ? 1 : 0) + (ch.id === G.save.hero ? DS.chip('가문원', '×' + DS.hMul(ch).toFixed(2), DS.hMul(ch) > 1 ? 1 : 0) : '') + '</small>' +
    '<div class="bar exp hm"><u style="width:' + (nx ? Math.max(0, Math.min(100, (x - nx.from) / (nx.at - nx.from) * 100)) : 100) + '%"></u></div><small class="fx2"><i class="nx">' + (nx ? '다음 ' + esc(nx.name) + ' <b class="num">' + fmtN(Math.ceil(nx.at - x)) + '</b>' : '가장 높은 계급') + '</i></small></div>';
}
// 가문 창 (r46 sheet): 머리(초상 · 가문 · 처지 · 공훈 · 가주의 단 · 가문 전투력) → 막대(HP · 마나 · 경험치 · 공훈) → 가주(빈 가문이면 채우는 길) → 가문원 또는 막사의 같은 병과 → 능력치 막대 → 장비 → 기술 → 접힌 「자세히」
function pRow(attr, spr, name, g, sub, right, cls) { return '<div class="row pr2' + (cls ? ' ' + cls : '') + '" ' + attr + '>' + spr + '<div class="tx"><b>' + name + ' ' + gbadge(g) + '</b><small class="msub">' + sub + '</small></div>' + (right ? '<span class="pra">' + right + '</span>' : '') + '</div>'; }
function charSheet(id, parent) {
  var o = sheet('가문', function () {
    var s = G.save, ch = s.chars[id]; if (!ch) return '';
    var c = DS.CLASSES[ch.cls], hero = id === s.hero, bw = hero ? (ch.vac ? null : ch.ps) : DS.bearer(s, ch), inP = s.party.indexOf(ch.id) >= 0, vacH = !hero && !bw, w = bnWhere();
    var seat = hero ? { k: 'hero', ch: ch } : { k: 'bear', ch: ch }, u = null; if (bw) { try { u = seatSpec(seat, bw); } catch (x) { u = null; } }
    var r = DS.hRank(ch), st = ch.down ? ['dn', '쓰러짐'] : vacH ? ['dn', '빈 가문'] : inP ? ['ok', '싸운다'] : ['', '쉰다'];
    var tags = '<i class="rtag s-' + st[0] + '">' + st[1] + '</i><i class="ctag">' + esc(c.name) + '</i><i class="ctag mr">' + (DS.vetBadge ? DS.vetBadge(r) : '') + esc(DS.hName(r)) + '</i>' + (hero ? '<i class="tg">맹주</i>' : '') + fuTag(s, ch);
    var html = sheetHead({ spr: bw && !hero ? mercSpr(bw, 4) : charSpr(ch, 4), fc: DS.FLAG[ch.cls] || '#f6cf57', name: crestH(ch, 22) + esc(DS.flagName(ch.cls)), tags: tags, lv: bw, pow: bw ? DS.cardPower(s, ch) : null, powLab: '가문 전투력', cls: 'hs2' + (vacH ? ' vac' : '') });
    html += vitBars(u, hero ? ch.hp : bw && bw.hp, ch.mp, bw, meritBar(ch)) + fuseLine(s, ch);
    // 가주
    var sbs = hero ? [] : DS.sbOf(s, ch.id), nk = kinFree(s).length;
    if (hero) html += '<h4>가주</h4>' + (bw ? pRow('data-hinfo="1"', charSpr(ch, 2), esc(DS.charName(ch)), bw.g || 3, '<i class="mlv">' + lv(DS.pL(bw)) + '</i><i class="tg">맹주</i>' + agTag(ch), '<i class="go" aria-hidden="true">›</i>') : '<p class="hint">맹주의 자리가 비었다. 교회에서 뒤를 이을 사람을 정한다</p>');
    else if (bw) {
      var own = bw.cast && DS.castFlag(s, bw.cast) === ch;
      html += '<h4>가주</h4>' + pRow('data-info="' + bw.id + '"', mercSpr(bw, 2), esc(bw.ttl || bw.n || '') + (bw.cast && !own ? ' <i class="own">' + esc(DS.castHouse(bw.cast)) + '</i>' : ''), bw.g, '<i class="mlv">' + lv(DS.pL(bw)) + '</i>' + (bw.t && DS.TRAITS[bw.t] ? '<i class="mtr">' + esc(DS.TRAITS[bw.t].name) + '</i>' : '') + agTag(bw), sbs.length ? '<button class="btn small" data-bn="pick"' + (w === 'battle' ? ' disabled' : '') + '>교체</button>' : '<i class="go" aria-hidden="true">›</i>');
    } else {
      html += '<div class="vf2"><p><b>가주가 없다.</b> 레벨과 단도 사라졌다. 이 가문은 싸우지 않는다.</p><p class="hint sm">' + (sbs.length ? '막사의 ' + esc(c.name) + ' ' + sbs.length + '명 가운데 한 사람이 싸움이 끝나면 잇는다.' : '막사에 ' + esc(josa(c.name, '이가')) + ' 오면 저절로 가주가 된다.' + (nk ? ' 맹주의 어른 아이를 보낼 수도 있다.' : '')) + '</p><div class="btns">' +
        '<button class="btn small gold" data-gohall="1"' + (w === 'battle' ? ' disabled' : '') + '>영웅관</button>' + (nk ? '<button class="btn small gold" data-bn="pick"' + (w === 'battle' ? ' disabled' : '') + '>아이 보내기 <b class="num">' + nk + '</b></button>' : '') + '</div></div>';
    }
    // 가문원 (맹주 가문) · 막사의 같은 병과 (다른 가문)
    if (hero) {
      var kin = DS.mercsOf(s, ch.id), nEmp = DS.bnEmpty(s).length;
      html += '<h4>가문원 <i class="own">' + kin.length + '명, 함께 싸운다</i></h4>';
      kin.forEach(function (m) { html += pRow('data-info="' + m.id + '"', mercSpr(m, 2), esc(m.n || ''), m.g, '<i class="mlv">' + lv(DS.pL(m)) + '</i>' + agTag(m), pwNum(DS.power(DS.mercSpec(ch, m)), 'sm') + (nEmp && !m.cast ? '<button class="btn small gold" data-kinsend="' + m.id + '">보내기</button>' : '')); });
      if (!kin.length) html += '<p class="hint dimh">아직 없다. 맹주의 아이가 열다섯이 되면 함께 싸운다</p>';
      else if (nEmp) html += '<p class="hint sm">빈 가문의 가주로 보낼 수 있다. 그 가문의 병과를 받는다</p>';
    } else if (bw) {
      html += '<h4>막사 <i class="own">같은 병과 ' + sbs.length + '명</i></h4>';
      sbs.forEach(function (m) { html += pRow('data-info="' + m.id + '"', mercSpr(m, 2), esc(m.n || ''), m.g, '<i class="mlv">' + lv(DS.pL(m)) + '</i>' + agTag(m), pwNum(DS.flagPower(s, ch, m), 'sm') + '<button class="btn small" data-sbup="' + m.id + '"' + (w === 'battle' ? ' disabled' : '') + '>교체</button>', 'sb2'); });
      html += sbs.length ? '<p class="hint sm">가주가 떠나면 가장 나은 이가 저절로 잇는다</p>' : '<p class="hint dimh">없다. 가주가 떠나면 빈 가문이 된다 <button class="lnk" data-gohall="1">영웅관</button></p>';
    }
    if (bw) html += '<h4>능력치</h4>' + statBars(seat, bw);
    html += '<h4 class="hbtn">장비<button class="btn small" data-gear="best">자동 장착</button></h4>';
    [['w', '무기'], ['a', '방어구']].forEach(function (sl) { html += cmdGearRow(ch, sl); });
    var t = DS.tierOfL(ch.L), nHas = c.skills.filter(function (sk) { return t >= sk[1]; }).length;
    html += foldBtn('csk', '기술 ' + nHas + (c.skills.length > nHas ? ' <i class="own">/ ' + c.skills.length + '</i>' : ''), pills(c.skills.filter(function (sk) { return t >= sk[1]; }).map(function (sk) { return DS.SKILLS[sk[0]].name; })) || '없음');
    if (FOLD.csk) {
      c.skills.forEach(function (sk) {
        var S = DS.SKILLS[sk[0]], has = t >= sk[1];
        html += '<div class="row sk' + (has ? '' : ' dim') + '"><div class="tx"><b>' + S.name + ' <span class="skc"><i>마나 ' + S.mp + '</i><i>틱 ' + S.tick + '</i></span>' + (has ? '' : ' <i class="tg">' + sk[1] + '단</i>') + '</b><small>' + S.desc + '</small></div></div>';
      });
      if (c.passive) html += '<div class="row sk"><div class="tx"><b>' + DS.PASSIVES[c.passive].name + ' <i class="own">특성</i></b><small>' + DS.PASSIVES[c.passive].desc + '</small></div></div>';
    }
    var past = hero ? [] : flagPast(ch);
    html += foldBtn('cmore', '자세히', '공훈, 전투력 내역' + (hero ? '' : ', 옛 가주 ' + past.length + '명'));
    if (FOLD.cmore) {
      html += '<div class="fold-in pmore">' + hMeritBox(ch) + (bw ? '<h4>전투력 내역</h4>' + pwTable(DS.powerParts(s, ch, bw)) : '');
      if (!hero) { html += '<h4>옛 가주 <i class="own">' + past.length + '명</i></h4>'; past.forEach(function (x) { html += '<div class="row past"><div class="tx"><b>' + esc(x.n) + '</b><small>' + pills([x.why, x.at]) + '</small></div></div>'; }); if (!past.length) html += '<p class="hint dimh">없다</p>'; }
      html += '</div>';
    }
    return '<div class="cs2">' + html + '</div>';
  });
  o.addEventListener('click', function (e) {
    var s = G.save, ch = s.chars[id], ge = e.target.closest('[data-gear]');
    var bnb = e.target.closest('[data-bn]');
    if (bnb) { if (busy()) { no('전투 중', '싸우는 중에는 바꿀 수 없다'); return; } A('tap'); bnPick(id, o); return; }
    var hb = e.target.closest('[data-gohall]'); if (hb) { if (DS.townBusy && DS.townBusy()) { A('cancel'); toast(DS.townWorkWhy(), 2600); return; } A('tap'); mercShop(); return; }
    var sbu = e.target.closest('[data-sbup]'); if (sbu) { if (busy()) { no('전투 중', '싸우는 중에는 바꿀 수 없다'); return; } var r = DS.hand(s, id, +sbu.dataset.sbup, { where: bnWhere() }); if (!r.ok) { A('cancel'); toast(r.why); return; } A('ok'); DS.rebuildParty(); DS.updateQuest(); U.persist(); o.draw(); if (r.nf && DS.nfAsk) { var nid = +sbu.dataset.sbup; setTimeout(function () { DS.nfAsk({ k: 'm', id: nid }, null, '새 가주, 처음 이름 정하기 (무료)'); }, 250); } return; }
    var ks = e.target.closest('[data-kinsend]'); if (ks) { if (busy()) { no('전투 중', '싸우는 중에는 바꿀 수 없다'); return; } A('tap'); kinSend(+ks.dataset.kinsend, o); return; }
    if (e.target.closest('[data-hinfo]')) { A('tap'); heroInfo(o); return; }
    if (cmdGearClick(e, id, o)) return;      // r4 forge (강화·바로 장착) — data-info 보다 먼저
    if (ge) {
      if (ge.dataset.gear === 'best') { var ok = DS.autoEquip(s, ch); A(ok ? 'ok' : 'cancel'); toast(ok ? '가방의 더 좋은 장비로 바꿨다.' : '가방에 더 좋은 장비가 없다.'); DS.refreshUnits(); U.persist(); o.draw(); }
      else { A('tap'); pickGear(id, ge.dataset.gear, o); }
      return;
    }
    var inf = e.target.closest('[data-info]'); if (inf) { A('tap'); mercInfo(+inf.dataset.info, o); return; }
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
}
// 부대: 깃발별로 묶어, 합일(전원 7단 Lv10)까지 얼마나 남았는지 보여 준다
function joinScn(cls) { if (DS.joinPlan && G.save) { var pl = DS.joinPlan(G.save); if (pl[cls]) return pl[cls]; } var a = DS.SCENARIOS.filter(function (sc) { return sc.reward && sc.reward.join === cls; })[0] || DS.SCENARIOS.filter(function (sc) { return sc.reward && sc.reward.alt === cls; })[0]; return a ? a.id : 0; }      // r44: 대장 병과로 자리가 바뀐 집까지 (DS.joinPlan)
var FUSE_NEAR = 20;      // r8 menus (newbie 3): 「합일까지 N레벨」은 이만큼 가까워졌을 때만 보인다
// 현상 수배 게시판 (기획팀 DS.bountyList — 20번 뒤 합일 준비 구간). 없으면 아무것도 그리지 않는다.
function bounties() { var l = null; if (DS.bountyList) { try { l = DS.bountyList(G.save); } catch (x) { l = null; } } return l instanceof Array ? l : []; }
var BKIND = { hunt: '사냥', elite: '정예', sweep: '출몰' };
function bountyBoard() {
  var l = bounties(); if (!l.length) return '';
  var cur = G.hunt && G.hunt.id;
  var sh = null; if (DS.bountyShard) { try { sh = DS.bountyShard(G.save); } catch (x) { sh = null; } }
  return '<h4 class="fam">현상 수배 <i class="own">' + (sh && sh.need ? '깃술 조각 ' + (sh.have || 0) + ' / ' + sh.need + (sh.next ? ' → ' + esc(sh.next) : '') : '경험치는 그대로, 골드, 모집권, 장비') + '</i></h4><div class="bty">' + l.map(function (b) {
    var p = b.need ? Math.min(100, (b.have || 0) / b.need * 100) : 0;
    return '<div class="row bt' + (b.done ? ' done' : '') + (cur === b.id ? ' on' : '') + '"><div class="tx"><b><i class="bk k-' + esc(b.kind || '') + '">' + (BKIND[b.kind] || '수배') + '</i>' + esc(b.title || '') + '</b>' +
      '<small>' + esc(b.zoneName || (DS.ZONES[b.zone] ? DS.ZONES[b.zone].name : '')) + (b.need ? ', <b class="num">' + (b.have || 0) + ' / ' + b.need + '</b>' : '') + (b.reward ? ', ' + esc(b.reward) : '') + '</small>' +
      (b.need && !b.done ? '<i class="bar exp"><u style="width:' + p + '%"></u></i>' : '') + '</div>' +
      (b.done ? '<span class="why">달성</span>' : '<button class="btn small' + (cur === b.id ? '' : ' gold') + '" data-bty="' + esc(b.id) + '">' + (cur === b.id ? '안내 중' : '길 안내') + '</button>') + '</div>';
  }).join('') + '</div>';
}
// r8 menus (ux 1·7, trim 2): 달력 · 가문 · N대째 줄을 한 줄로. 초반(시나리오 셋을 깨기 전·첫 해·가문에 적힌 일이 없을 때)에는 열리지 않는다.
function clearedN(s) { var n = 0, k; for (k in s.cleared || {}) if (s.cleared[k]) n++; return n; }
function partyMeta(s, top) {
  var c = agCal(), eg = !!(DS.egOn && DS.egPartyRow && DS.egOn(s)), lin = lgOn();
  if (!(clearedN(s) >= 3 || (c && c.yr >= 2) || eg || (lin && lgEvents().length > 0))) return '';
  var egT = '', egRow = '';
  if (eg) {      // 장이 도는 동안에는 「2대째의 장 3 / 30」 한 마디로, 「다음 세대의 장」 단추가 있을 때(맺음 직후)는 그 줄 그대로
    var er = DS.egPartyRow(s) || '', m = DS.egActive && DS.egActive(s) ? /<b>([\s\S]*?)<\/b>/.exec(er) : null;
    egT = m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
    if (!egT) egRow = er;
  }
  if (top) return egRow;      // 맺음 직후의 「다음 세대의 장」 단추 줄만은 명단 위에 (그때만 보인다)
  var head = [egT, c ? agCalText(c) : ''].filter(Boolean).map(esc).join(', '), row = lin ? lgPartyRow() : '', hook = '<div class="tx"><b>';
  if (row && head && row.indexOf(hook) >= 0) row = row.replace(hook, hook + '<i class="pcal">' + head + '</i> ').replace('class="row lgentry', 'class="row lgentry pmeta');
  else row = (egT ? DS.egPartyRow(s) : '') + agCalRow() + row;      // 가문 줄의 모양이 바뀌었으면 합치지 않고 예전처럼
  return row;
}
// 현상 수배: 접힌 한 줄 (펼치면 게시판)
function bountyFold() {
  var l = bounties(); if (!l.length) return '';
  var cur = G.hunt && G.hunt.id, done = l.filter(function (b) { return b.done; }).length;
  var sub = l.map(function (b) { return (BKIND[b.kind] || '수배') + (b.done ? ' 달성' : b.need ? ' ' + (b.have || 0) + '/' + b.need : ''); }).join(', ');
  return foldBtn('bty', '현상 수배 ' + l.length + (done ? ' <em class="ok">달성 ' + done + '</em>' : '') + (cur && l.some(function (b) { return b.id === cur; }) ? ' <em>안내 중</em>' : ''), esc(sub)) + (FOLD.bty ? bountyBoard() : '');
}
// ── r20 house: 가문 한눈에 — 맹주 가문 한 칸(가로 꽉) + 나머지 아홉 가문 3×3. 칸을 누르면 가문 창(charSheet) ──
function crestH(ch, sz) { return DS.houseCrestOf && ch ? DS.houseCrestOf(G.save, ch, sz || 18) : ''; }      // r20 house: 그 가문의 문장 (대장 가문은 왕관)
function hgShort(ch, cls) { return String(DS.flagName(cls || ch.cls)).replace(/ 가문$/, ''); }
function hgMeta(s, ch) {
  var hero = ch.id === s.hero, b = hero ? (ch.vac ? null : ch.ps) : DS.bearer(s, ch), pi = s.party.indexOf(ch.id), n = (b ? 1 : 0) + DS.mercsOf(s, ch.id).length;
  return { hero: hero, b: b, pi: pi, n: n, pw: DS.cardPower(s, ch), bn: hero ? DS.charName(ch) : b ? (b.ttl || b.n || '') : '', sb: DS.sbOf(s, ch.id).length };
}
// 부대 탭 한 화면: 가문 칸 안에 가주 · 맹주 가문은 어른 가문원을 작은 얼굴로. 칸 머리를 누르면 가문 창 (2.2.0)
function hgChip(attrs, spr, name, g, cls, L) { return '<button class="hch' + (cls ? ' ' + cls : '') + '" ' + attrs + ' style="--gc:' + (g ? gcol(g) : 'transparent') + '">' + spr + (L ? '<i class="hcl num">' + DS.tierOfL(L) + '·' + DS.lvOfL(L) + '</i>' : '') + '<small>' + esc(name || '') + '</small></button>'; }      // r42: 사람마다 단·Lv (「4·7」 = 4단 Lv7)
function hgChips(s, ch, hero) {
  var b = hero ? null : DS.bearer(s, ch), kin = hero ? DS.mercsOf(s, ch.id) : [], h = '';
  if (hero) h += hgChip('data-hinfo="1"', charSpr(ch, 1), ch.vac || ch.down ? '없음' : DS.charName(ch), (ch.ps && ch.ps.g) || 3, 'lead' + (ch.vac || ch.down ? ' empty' : ''), ch.vac || !ch.ps ? 0 : DS.pL(ch.ps));
  else if (b) h += hgChip('data-info="' + b.id + '"', mercSpr(b, 1), b.ttl || b.n || '', b.g, 'lead', DS.pL(b));
  else h += hgChip('data-ch="' + ch.id + '"', '<i class="add">+</i>', '빈 가문', 0, 'lead empty vac');
  kin.forEach(function (m) { h += hgChip('data-info="' + m.id + '"', mercSpr(m, 1), m.ttl || m.n || '', m.g, 'kin', DS.pL(m)); });
  return '<div class="hgm">' + h + '</div>';
}
function hgCell(s, ch, cls) {
  if (!ch) {      // 아직 없는 가문
    var sc = joinScn(cls);
    return '<button class="hgc none" data-hgnone="' + cls + '" style="--fc:' + (DS.FLAG[cls] || '#c9a96a') + '">' + DS.houseCrest(cls, 22) + '<b>' + esc(hgShort(null, cls)) + '</b><small>' + (sc ? '시나리오 ' + sc + '에서 합류' : '아직 없음') + '</small></button>';
  }
  var m = hgMeta(s, ch);
  return '<div class="hgc' + (m.hero ? ' mj' : '') + (m.pi >= 0 ? ' in' : '') + (ch.down ? ' down' : '') + (m.b ? '' : ' nob') + '" style="--fc:' + (DS.FLAG[ch.cls] || '#c9a96a') + '">' +
    '<button class="hgh" data-ch="' + ch.id + '">' + DS.houseCrestOf(s, ch, 20) + '<b>' + esc(hgShort(ch)) + (m.hero ? ' <i class="tg">맹주</i>' : '') + '</b>' +
    '<small class="hgl">' + (m.b ? lv(ch.L) : '<em class="warn">빈 가문</em>') + (ch.down ? ' <em class="warn">쓰러짐</em>' : m.b ? pwNum(m.pw, 'sm') : '') + '</small><span class="hgv">' + DS.vetBadge(DS.hRank(ch)) + '<small>' + esc(DS.hName(DS.hRank(ch))) + '</small></span></button>' + hgChips(s, ch, m.hero) + '</div>';
}
// 2.1.0: 가문은 모두 한 격자에 공훈 순 (같으면 계급, 그다음 먼저 합류한 가문). 맹주가 선 가문은 왕관과 「맹주」 꼬리표만 다르다. 아직 오지 않은 가문은 맨 뒤 (가문 수를 열로 셈하지 않는다)
function houseGrid(s) {
  var all = DS.houseSort ? DS.houseSort(s, DS.charList(s)) : DS.charList(s), cells = [], have = {};
  all.forEach(function (c) { have[c.cls] = 1; var C = DS.CLASSES[c.cls]; if (C && C.master && DS.FAMILY[C.fam]) DS.FAMILY[C.fam].members.forEach(function (k) { have[k] = 1; }); cells.push(hgCell(s, c)); });
  Object.keys(DS.CLASSES).forEach(function (k) { var C = DS.CLASSES[k]; if (!C.master && !have[k]) cells.push(hgCell(s, null, k)); });
  return '<div class="hgrid"><p class="hgsort">' + esc(DS.allyFull ? DS.allyFull(s) : '') + ' · 가문은 공훈 순</p><div class="hg9">' + cells.join('') + '</div></div>';
}
// 부대 탭 한 줄: 합일까지 (7단 Lv10 가문 수). 5단 넘은 가문이 없으면 빈칸
function fuNear(s) {
  var P = DS.fuseProg(s); if (!P.can) return '';
  if (P.ok) return '합일할 수 있다. 교회에서 가문 셋을 고른다';
  var topT = 0; P.pool.forEach(function (c) { topT = Math.max(topT, DS.tierOfL(c.L)); });
  return topT >= 5 ? '합일: 7단 Lv10 가문 ' + P.n + '/' + P.of + (s.crest || topT < 6 ? '' : ', 맹세의 깃대 없음') : '';
}
function heroFits(s, m) { var h = s.chars[s.hero]; return !!(h && DS.sbFits && DS.sbFits(h, m)); }      // 맹주 가문과 같은 병과 (가주로 설 가문은 없고, 맹주의 후계 후보)
// 막사 목록 (부대 탭): 등급 → 레벨 순. 줄을 누르면 사람 창, 「교체」 = 같은 병과 가문의 가주 고르기, 「방출」
function barList(s) {
  var list = DS.barracks(s).slice().sort(function (a, b) { return (b.g || 0) - (a.g || 0) || DS.pL(b) - DS.pL(a) || a.id - b.id; }), w = bnWhere();
  var h = '<h4 class="fam" id="hjbar">막사 <i class="own">' + list.length + ' / ' + DS.MERC_MAX + '명</i></h4><p class="hint sm">' + esc('싸우지 않는다. 같은 병과 가주가 얻는 경험치의 ' + Math.round((DS.BAL.sbShare || 0) * 100) + '%를 함께 얻는다. 같은 병과 가문이 비면 저절로 가주가 된다.') + '</p>';
  if (!list.length) return h + '<p class="hint dimh">비어 있다. 영웅관에서 모집한 사람이 여기서 기다린다</p>';
  return h + '<div class="bar2">' + list.map(function (m) {
    var hm = DS.sbHome ? DS.sbHome(s, m) : null, pw = hm ? DS.flagPower(s, hm, m) : 0, cant = !hm || w === 'battle';
    return '<div class="row pr2 brow" data-info="' + m.id + '">' + mercSpr(m, 2) + '<div class="tx"><b>' + esc(m.n || '') + ' ' + gbadge(m.g) + '</b><small class="msub"><i class="mlv">' + lv(DS.pL(m)) + '</i><i class="mtr">' + esc(DS.nativeName ? DS.nativeName(m) : '') + '</i>' + (hm ? '' : heroFits(s, m) ? '<i class="tg">맹주의 후계 후보</i>' : '<i class="tg dn">같은 병과 가문 없음</i>') + '</small></div>' +
      '<span class="pra">' + (hm ? '<small class="bhm">' + crestH(hm, 14) + esc(hgShort(hm)) + '</small>' : '') + pwNum(pw, 'sm') + '</span><span class="bbt"><button class="btn small" data-barsw="' + (hm ? hm.id : 0) + '"' + (cant ? ' disabled' : '') + '>교체</button><button class="btn small" data-fire="' + m.id + '"' + (m.lk || m.cast ? ' disabled' : '') + '>방출</button></span></div>';
  }).join('') + '</div>';
}
// 부대 탭 = 가문 격자 (가주 · 가문원이 칸 안에) → 막사 목록 → 한 줄 요약 → 아래 단추 줄(가계도 · 마을 일 · 수배). 2.2.0: 출전 고르기·막사는 없다 — 가주가 선 가문은 모두 싸운다
function tabParty() {
  var s = G.save, html = '', emp = DS.bnEmpty ? DS.bnEmpty(s) : [];
  html += partyMeta(s, 1);      // 맺음 직후: 「다음 세대의 장」 단추
  if (emp.length) html += '<p class="lock vacl">빈 가문 ' + emp.length + '곳은 싸우지 않는다. 가문을 눌러 채운다 (영웅관 · 맹주의 아이)</p>';
  html += houseGrid(s);
  html += barList(s);
  var near = fuNear(s), c = agCal(), eg = '';
  if (DS.egOn && DS.egPartyRow && DS.egOn(s) && DS.egActive && DS.egActive(s)) { var mm = /<b>([\s\S]*?)<\/b>/.exec(DS.egPartyRow(s) || ''); eg = mm ? mm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : ''; }
  var sub = [eg, c ? agCalText(c) : '', near, s.perk ? s.perk.rank + ' 특전: 경험치 +' + Math.round(s.perk.exp * 100) + '%' : ''].filter(Boolean);
  html += '<div class="pstat"><span><small>부대 전투력</small>' + pwNum(DS.partyPower(s)) + '</span><span><small>싸우는 이</small><b class="num">' + (DS.partySpecs ? DS.partySpecs(s).length : s.party.length) + '</b></span>' +
    (sub.length ? '<dl class="kvr psub">' + sub.map(function (t) { var m = /^(합일|가문력|\S+ 특전)[:\s]\s*(.*)$/.exec(t) || /^(\d+대째의 장)\s*(.*)$/.exec(t); return m ? '<dt>' + esc(m[1]) + '</dt><dd>' + esc(m[2]) + '</dd>' : '<dt></dt><dd>' + esc(t) + '</dd>'; }).join('') + '</dl>' : '') + '</div>';      // r45 ui: 「·」 한 줄 → 이름/값 줄
  var bl = bounties(), bd = bl.filter(function (b) { return b.done; }).length, lin = lgOn();
  var lk = function (key, label, cnt) { return '<button class="plk' + (FOLD[key] ? ' on' : '') + '" data-pfold="' + key + '" aria-expanded="' + !!FOLD[key] + '"><b>' + label + '</b><small>' + cnt + '</small></button>'; };
  html += '<div class="plinks">' + (lin ? '<button class="plk" data-lgmenu="1"><b>가계도</b><small>' + (function () { var al = lgAll(), n = 0; for (var k in al) if (al[k].alive) n++; return n + '명'; })() + '</small></button>' : '') +
    '<button class="plk tw" data-twopen="1"><b>마을 일</b><small>어디서나</small></button>' + (bl.length ? lk('bty', '수배', bl.length + (bd ? ', 달성 ' + bd : '')) : '') + (DS.lgLink ? DS.lgLink(s) : '') + '</div>';      // 2.1.0 「마을 일」      // r33 legacy: 「가문의 유산」 단추
  if (FOLD.bty && bl.length) html += bountyBoard();
  return html;
}
// 부대 탭의 손잡이 (openMenu 가 부른다): 처리했으면 true
function partyClick(e, o) {
  var t = e.target, b, s = G.save;
  if (t.closest('[data-gohall]')) { if (DS.townBusy && DS.townBusy()) { A('cancel'); toast(DS.townWorkWhy(), 2600); return true; } A('tap'); mercShop(); return true; }
  if (t.closest('[data-fire]')) return true;      // 방출: 문서 손잡이(askFire)가 받는다
  if ((b = t.closest('[data-barsw]'))) { if (busy()) { no('전투 중', '싸우는 중에는 바꿀 수 없다'); return true; } if (+b.dataset.barsw) { A('tap'); bnPick(+b.dataset.barsw, o); } return true; }
  if ((b = t.closest('.hgm [data-info], .bar2 [data-info]'))) { A('tap'); mercInfo(+b.dataset.info, o); return true; }
  if (t.closest('[data-hinfo]')) { A('tap'); heroInfo(o); return true; }
  if ((b = t.closest('[data-hgnone]'))) { var sc = joinScn(b.dataset.hgnone); A('cancel'); toast(DS.flagName(b.dataset.hgnone) + '은 아직 없다.' + (sc ? ' 시나리오 ' + sc + '에서 합류한다.' : ''), 3200); return true; }
  if ((b = t.closest('[data-bnslot]'))) { if (busy()) { no('전투 중', '싸우는 중에는 바꿀 수 없다'); return true; } A('tap'); bnPick(+b.dataset.bnslot, o); return true; }
  return false;
}
function tabBag() {      // r12: 줄 문법 = 그림 · 이름 ×n · 풀이 한 줄 · 줄 끝 단추 하나
  var s = G.save, gn = Object.keys(s.gear).filter(function (id) { return s.gear[id] > 0; }).length;
  var html = '<nav class="hjump"><button class="chipbtn" data-hj="b0">소모품</button><button class="chipbtn" data-hj="b2">장비 ' + gn + '</button></nav><h4 id="hjb0">소모품</h4>';
  itemKeys().forEach(function (k) {
    var it = DS.ITEMS[k], use = it.ctl && (s.items[k] || 0) > 0;
    html += '<div class="row">' + itemIco(k) + '<div class="tx"><b>' + it.name + ' <i class="own">' + itemHave(k) + '</i></b><small>' + it.desc + '</small></div>' + (use ? '<button class="btn small gold" data-use="' + k + '">사용</button>' : '') + '</div>';
  });
  html += '<div class="row">' + icon('misc', 'ticket') + '<div class="tx"><b>영웅 모집권 <i class="own">×' + (s.tickets || 0) + '</i></b><small>영웅 모집 1회 (영웅관)</small></div></div>';
  if (s.crest) html += '<div class="row">' + icon('misc', 'crest') + '<div class="tx"><b>맹세의 깃대</b><small>7단 Lv10 가문 셋을 골라 교회에서 합일한다. 어느 가문이든 된다.</small></div></div>';
  if (DS.lootUI && DS.lootUI.bag) return html + '<div class="lootbag" id="hjb2">' + DS.lootUI.bag(s) + '</div>';      // 정렬·잠금·모두 팔기는 그 안에서 (openMenu 가 손잡이를 단다)
  var gl = Object.keys(s.gear).filter(function (id) { return DS.gear(id); }).sort(function (a, b) { return DS.gearScore(DS.gear(b)) - DS.gearScore(DS.gear(a)); });
  html += '<h4 id="hjb2">장비 ' + gl.length + '종</h4>';
  if (!gl.length) html += '<p class="hint empty">가방에 남는 장비가 없다.</p>';
  gl.forEach(function (id) { var g = DS.gear(id); html += '<div class="row"><div class="tx">' + gearLine(g) + '<small>' + s.gear[id] + '개</small></div><button class="btn small" data-wearpick="' + id + '">장착</button></div>'; });
  return html;
}
// r4 map: 지도 탭 — 가 본 지역·시나리오 입구를 누르면 바로 이동 (game.js DS.warpTo). 칸: 이름·권장 단·여기·현상 수배·다음 시나리오
function mapPitZone() { for (var id in DS.ZONES) if ((DS.ZONES[id].gates || []).some(function (g) { return g.dungeon; })) return id; return null; }
function mapRecT(L) { var v = DS.recOfL ? DS.recOfL(L) : L; return DS.tierOfL(v > 0 ? Math.round(v) : L); }
function mapNear(id) {      // 안 가 본 곳: 이웃한 가 본 지역 (어디서 걸어 들어가는지)
  var s = G.save, n = null;
  (DS.ZONES[id].exits || []).forEach(function (e) { if (!n && s.visited[e.to]) n = e.to; });
  return n;
}
function mapZoneWhy(id) {
  var s = G.save, Z = DS.ZONES[id];
  return DS.warpWhy ? DS.warpWhy(id) : (busy() ? '싸우는 중에는 갈 수 없다' : '');
}
function mapScnWhy(sc) {
  var s = G.save, next = DS.nextScn(s), tier = DS.partyTier(s);
  if (!s.cleared[sc.id] && !(next && next.id === sc.id)) return sc.tier > tier ? sc.tier + '단 전용 시나리오입니다' : '앞 시나리오를 먼저 끝내야 합니다';
  if (!s.cleared[sc.id] && sc.tier > tier) return sc.tier + '단부터 입장 가능';
  return DS.warpWhy ? DS.warpWhy(sc.zone) : '';
}
function tabMap() {
  var s = G.save, id, next = DS.nextScn(s), here = G.zone && !G.scn ? G.zone.id : null, tier = DS.partyTier(s), bty = {}, cells = '', minR = 99, used = {};
  bounties().forEach(function (b) { if (!b.done && b.zone) bty[b.zone] = (bty[b.zone] || 0) + 1; });
  for (id in DS.ZONE_POS) { var q = DS.ZONE_POS[id]; used[q[0] + ',' + q[1]] = 1; if (q[1] < minR) minR = q[1]; }
  for (id in DS.ZONE_POS) {
    var p = DS.ZONE_POS[id], Z = DS.ZONES[id], seen = !!s.visited[id], cls = 'mz' + (Z.town ? ' town' : ' field'), sub = '', link = '';
    (Z.exits || []).forEach(function (e) { var o = DS.ZONE_POS[e.to], d = !o ? '' : o[0] === p[0] + 1 && o[1] === p[1] ? 'E' : o[1] === p[1] + 1 && o[0] === p[0] ? 'S' : ''; if (d) link += ' l' + d + (seen && s.visited[e.to] ? '' : ' ld' + d); });      // 이웃 지역으로 이어진 길 (둘 다 가 봤으면 밝게)
    if (!seen) cls += ' unseen';      // 4.0.6: 안 가 본 곳도 이름과 단을 보이고 바로 갈 수 있다
    if (Z.town) sub = '마을';
    else { var a = mapRecT(Z.L[0]), b = mapRecT(Z.L[1]); sub = (a === b ? '' : a + '~') + b + '단'; if (tier < a) cls += ' hard'; else if (tier > b) cls += ' easy'; }
    if (id === here) cls += ' here';
    if (next && next.zone === id) cls += ' goal';
    cells += '<button class="' + cls + link + '" style="grid-column:' + (p[0] + 1) + ';grid-row:' + (p[1] + 1) + '" data-z="' + id + '"' + (id === here ? ' aria-current="location"' : '') + ' aria-label="' + esc(Z.name) + '">' +
      (id === here ? '<i class="mzhere">여기</i>' : '') + (bty[id] ? '<i class="mzbty" title="현상 수배">수배' + (bty[id] > 1 ? ' ' + bty[id] : '') + '</i>' : '') +
      '<b>' + esc(Z.name) + '</b><small>' + (DS.zoneDanger && DS.zoneDanger(id) ? '⚠ ' : '') + sub + '</small></button>';
  }
  // 빈 왼쪽 위(지역이 없는 칸들)에 지금 위치·다음 목표 카드 — 칸 배치가 바뀌어 자리가 없으면 지도 위에 따로 둔다
  var fit = true, x, y; for (y = 0; y < 3; y++) for (x = 0; x < 4; x++) if (used[x + ',' + y]) fit = false;
  var nowT = G.scn ? (G.scn.pit ? esc(G.scn.name) : '시나리오 ' + G.scn.id + ' 진행 중') : G.zone ? esc(G.zone.name) : '',
    nowS = G.scn ? '끝내거나 물러나면 지도로 간다' : G.zone ? (G.zone.town ? '마을' : '필드, 권장 ' + mapRecT(G.zone.def.L[0]) + '~' + mapRecT(G.zone.def.L[1]) + '단') + ', 지금 부대 ' + tier + '단' : '',
    nb = Object.keys(bty).reduce(function (n, k) { return n + bty[k]; }, 0);
  var card = '<div class="mapnow' + (fit ? ' infit' : '') + '"><small class="mnowk">지금 있는 곳</small><b>' + nowT + '</b><small>' + nowS + '</small>' +
    (next ? '<small class="mnext">다음 <b>' + next.id + '. ' + esc(next.name) + '</b>, ' + esc(DS.ZONES[next.zone].name) + '</small>' : '') +
    (nb ? '<small class="mbty">현상 수배 ' + nb + '건. 「수배」 칸</small>' : '') + (G.scn || G.ending ? '' : '<small class="mtip' + (busy() ? ' warn">싸우는 중. 끝나면 간다' : '">어느 곳이든 누르면 바로 간다') + '</small>') + '</div>';
  var html = (fit ? '' : card) + '<div class="mapgrid' + (busy() || G.ending ? ' off' : '') + '">' + (fit ? card.replace('class="mapnow infit"', 'class="mapnow infit" style="grid-column:1/5;grid-row:1/4"') : '') + cells + '</div>' +
    '<p class="maplg"><span><i class="k here"></i>여기</span><span><i class="k goal"></i>다음 시나리오</span><span><i class="k hard"></i>권장보다 낮음</span><span><i class="k town"></i>마을</span></p>' +
    '<p class="hint">싸우는 중에는 갈 수 없다. 칸 아래 숫자는 권장 단. ⚠ 표시는 지금 부대에 위험한 곳이다.</p>';
  // 시나리오: 다음 것 먼저 크게, 끝낸 것은 누르면 그 입구 앞으로, 잠긴 것은 한 줄로 줄인다
  var rows = '', done = [], lockN = 0, lockT = {};
  DS.SCENARIOS.forEach(function (sc) { if (s.cleared[sc.id]) done.push(sc); else if (!(next && next.id === sc.id)) { lockN++; if (sc.tier) lockT[sc.tier] = (lockT[sc.tier] || 0) + 1; } });
  function scRow(sc, isNext) {
    var why = mapScnWhy(sc), z = DS.ZONES[sc.zone], hereG = G.zone && !G.scn && G.zone.id === sc.zone;
    return '<button class="msl' + (isNext ? ' next' : ' done') + (why ? ' off' : '') + '" data-scn="' + sc.id + '"><i class="num">' + sc.id + '</i><span class="tx"><b>' + esc(sc.name) + '</b><small>' + esc(z.name) + ', ' + (isNext ? '권장 ' + lv(DS.recLOf ? DS.recLOf(sc) : sc.L) : '완료 (다시 도전)') + (why && isNext ? '<em>' + esc(why.replace(z.name + ' — ', '')) + '</em>' : '') + '</small></span>' +
      '<span class="go">' + (why ? '잠김' : hereG ? '입구로' : '바로 가기') + '</span></button>';
  }
  html += '<h4>시나리오</h4><div class="mslist">';
  if (next) rows += scRow(next, true);
  else rows += '<p class="hint">모든 시나리오를 마쳤다.</p>';
  var pz = mapPitZone();
  if (pz && s.visited[pz]) { var pf = Math.min(10, s.pit || 1), pw = tier < 5 ? '5단부터 입장 가능' : (DS.warpWhy ? DS.warpWhy(pz) : ''); rows += '<button class="msl pit' + (pw ? ' off' : '') + '" data-wpit="1"><i class="num">' + pf + '층</i><span class="tx"><b>바닥 없는 갱도</b><small>' + esc(DS.ZONES[pz].name) + ', 층마다 보스' + (pw && tier < 5 ? '<em>' + pw + '</em>' : '') + '</small></span><span class="go">' + (tier < 5 ? '잠김' : pw ? '잠김' : '바로 가기') + '</span></button>'; }
  if (done.length) { rows += '<p class="mshd">끝낸 시나리오 ' + done.length + (done.length > 1 ? ', 최근 것부터' : '') + '</p>'; done.slice().reverse().forEach(function (sc) { rows += scRow(sc, false); }); }
  if (lockN) rows += '<p class="mslock">아직 열리지 않은 시나리오 ' + lockN + '개. 앞 시나리오를 끝내면 하나씩 열린다' + Object.keys(lockT).map(function (t) { return ', ' + t + '단 전용 ' + lockT[t]; }).join('') + '</p>';
  return html + rows + '</div>';
}
// 지도에서 누른 것: 지역 칸(data-z)·시나리오 줄(data-scn)·갱도(data-wpit). 확인 없이 한 번에 옮기고, 못 가면 까닭을 토스트로. 지금 있는 지역은 눌러도 아무 일 없다.
function mapTap(el, o) {
  var s = G.save, id = null, pick = null, open = false, why = '';
  if (el.dataset.z) {
    id = el.dataset.z;
    if (G.zone && G.zone.id === id && !G.scn) return;      // 실수 방지: 지금 있는 곳은 그대로
    why = mapZoneWhy(id);
  } else if (el.dataset.scn) {
    var sc = DS.scn(+el.dataset.scn); if (!sc) return;
    id = sc.zone; open = true; why = mapScnWhy(sc);
    pick = function (p) { return p.t === 'gate' && p.ids.indexOf(sc.id) >= 0; };
  } else if (el.dataset.wpit) {
    id = mapPitZone(); if (!id) return; open = true;
    why = DS.partyTier(s) < 5 ? '바닥 없는 갱도는 5단부터' : DS.warpWhy ? DS.warpWhy(id) : '';
    pick = function (p) { return p.t === 'dungeon'; };
  }
  if (!id) return;
  if (!why && !DS.warpTo) why = '지금은 갈 수 없다';
  if (why) { A('cancel'); toast(why, 2800); return; }
  if (!el.dataset.scn && DS.dangerGate && DS.dangerGate(id)) return;      // 4.0.6: 위험한 곳은 한 번 경고, 다시 누르면 간다
  o.close();
  var r = DS.warpTo(id, pick, open);
  if (r) toast(r, 2600);
}
function tabOpt() {
  var o = G.save.opt;
  return '<div class="row"><div class="tx"><b>효과음</b></div><button class="btn small' + (o.sfx ? ' gold' : '') + '" data-opt="sfx">' + (o.sfx ? '켬' : '끔') + '</button></div>' +
    '<div class="row"><div class="tx"><b>배경음</b></div><button class="btn small' + (o.bgm ? ' gold' : '') + '" data-opt="bgm">' + (o.bgm ? '켬' : '끔') + '</button></div>' +
    '<div class="row"><div class="tx"><b>움직임 줄이기</b><small>흔들림, 튀는 움직임, 번쩍임을 줄인다. 비워 두면 기기 설정을 따른다</small></div><button class="btn small' + (DS.calmFx && DS.calmFx() ? ' gold' : '') + '" data-opt="calm">' + (o.calm == null ? (DS.calmFx && DS.calmFx() ? '켬 (기기)' : '끔') : o.calm ? '켬' : '끔') + '</button></div>' +
    (DS.Joy ? DS.Joy.opt() : '') +      // r40: 이동 방식 조이스틱/터치 · 조이스틱 자리 (joystick.js)
    '<div class="row"><div class="tx"><b>화면 켜 두기</b><small>보고만 있어도 화면이 꺼지지 않는다' + (DS.wakeOk && !DS.wakeOk() ? ' (이 브라우저는 지원하지 않는다)' : '') + '</small></div><button class="btn small' + (o.wake !== false ? ' gold' : '') + '" data-opt="wake">' + (o.wake !== false ? '켬' : '끔') + '</button></div>' +
    '<div class="row"><div class="tx"><b>진동</b><small>거절, 기술, 큰 피해에 짧게 떨린다 (안드로이드)</small></div><button class="btn small' + (o.hap !== false ? ' gold' : '') + '" data-opt="hap">' + (o.hap !== false ? '켬' : '끔') + '</button></div>' +
    '<div class="row"><div class="tx"><b>죽음 연출</b><small>아군이 영영 쓰러질 때 화면을 확대해 마지막 모습을 보여 준다</small></div><button class="btn small' + (o.dfx !== false ? ' gold' : '') + '" data-opt="dfx">' + (o.dfx !== false ? '켬' : '끔') + '</button></div>' +
    '<div class="row"><div class="tx"><b>전투 대사</b><small>싸우는 동안 가끔 가문마다 제 말버릇을 말풍선으로 한다</small></div><button class="btn small' + (o.bark !== false ? ' gold' : '') + '" data-opt="bark">' + (o.bark !== false ? '켬' : '끔') + '</button></div>' +
    (DS.fieldOptRow ? DS.fieldOptRow(o) : '') +      // r47: 들판 습격 (field.js)
    '<div class="row"><div class="tx"><b>가문원 이름표</b><small>필드에서 가문원 발밑에 이름 표시</small></div><div class="seg" role="group" aria-label="가문원 이름표">' +
      [['sel', '선택 가문'], ['all', '모두'], ['off', '끔']].map(function (x) { return '<button data-mtag="' + x[0] + '"' + ((o.mtag || 'sel') === x[0] ? ' aria-pressed="true"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div></div>' +
    '<div class="row"><div class="tx"><b>공지사항 <i class="own">v' + DS.VERSION + '</i></b><small>버전별 변경 사항과 저장 안내</small></div><button class="btn small" data-opt="notes">보기</button></div>' +
    '<div class="row"><div class="tx"><b>기록</b><small>끝낸 시나리오, 쓰러뜨린 적, 깃대에 새긴 이름들</small></div><button class="btn small" data-opt="record">보기</button></div>' +
    (DS.Move ? DS.Move.opt() : '') +      // r7 migrate: 새 집으로 이사 (claude 판) / 이사해 온 저장 (Firebase 판)
    (DS.Online ? DS.Online.opt() : '') +      // r4 online: 공개 기록·클라우드 저장 칸 (online.js)
    '<h4>게임 정보</h4><p class="hint">고전 실시간 전술 RPG에서 영감을 받아 새로 만든 게임입니다. 저장은 이 브라우저에 남고, 로그인하면 계정에도 올라갑니다.</p>' +
    '<p class="credit">글꼴 Pretendard © Kil Hyung-jin, Galmuri © Lee Minseo — 모두 SIL Open Font License 1.1 (이름을 바꾼 부분 집합)</p>' +
    '<div class="dangerz one"><button class="btn red wide" data-opt="reset">처음부터 다시 시작</button></div>';
}
// 도움말: 시나리오팀 글(DS.LORE.help = [{ h, short?, items }])을 그린다. 묶음 제목 칩을 누르면 그 묶음으로 건너뛴다.
function tabHelp() {
  // r12 screen: 4.0 도움말 (부대원과 깃발). 게임 안 글이라 반말, 줄표·괄호 없이 한 줄에 한 가지. lore.js 의 옛 HELP(지휘관·용병 시절)는 읽지 않는다 — 글팀이 4.0 판을 LORE.help40 으로 주면 그것을 쓴다
  var S = [
    ['사람과 가문', '가문', [
      '연맹에는 <b>맹주</b> 한 명과 가문들이 있다. 가문들이 모여 <b>' + esc(DS.allyFull ? DS.allyFull(G.save) : '연맹') + '</b>을 이룬다. 맹주는 자기가 선 가문의 가주다. 연맹의 이름은 대가 바뀌어도 그대로다.',
      '<b>가주가 선 가문은 모두 싸운다.</b> 출전을 고르는 일은 없다. 가문은 가주의 레벨로 싸우고, 가문 공훈과 가주의 등급만큼 강해진다.',
      '사람의 자리는 셋이다. <b>가주</b>는 가문을 이끌고 싸운다. <b>막사</b>는 모집한 영웅이 기다리는 곳 하나로, 가문에 매이지 않고 싸우지 않는다. <b>가문원</b>은 맹주 집 사람(아이, 배우자)으로, 어른이면 모두 맹주를 따라 싸운다.',
      '가주가 쓰러지거나 천수를 누리거나 맹주가 되어 떠나면 그 가문은 <b>레벨과 단을 잃는다</b>. 싸움 밖에서 막사의 <b>같은 병과</b> 가운데 등급, 레벨이 가장 나은 이가 저절로 가주가 된다. 새 가주는 제 레벨 그대로 싸운다. 같은 병과가 없으면 그 가문은 <b>빈 가문</b>으로 남아 싸우지 않는다. 장비와 공훈은 가문에 남는다.',
      '빈 가문을 채우는 길은 둘이다. <b>영웅관</b>에서 모집하거나, 맹주의 <b>어른 아이</b>를 그 가문의 가주로 보낸다. 보낸 아이는 그 가문의 병과를 받는다. 맹주의 자리는 늘 이어지니 싸울 이가 아무도 없어지는 일은 없다.',
      '<b>영웅 모집</b>은 비싸다. 한 번에 한 사람, 부를 때마다 값이 오르고 계절이 지나면 조금씩 내려간다. 모집권은 시나리오 ' + (DS.TICKET_EVERY || 10) + '개마다 한 장. 병과는 합류한 가문 가운데 무작위로 정해지고, 그 가문이 비어 있으면 곧바로 가주, 아니면 막사로 간다. 맹주와 같은 병과면 막사에서 맹주의 뒤를 받친다. 막사는 ' + DS.MERC_MAX + '명까지다.',
      '막사의 사람은 같은 병과 가주가 얻는 경험치의 ' + Math.round(DS.BAL.sbShare * 100) + '%를 함께 얻는다. 같은 병과 가주와 자리를 바꿀 수 있고, 물러난 가주는 막사로 간다. 막사의 사람은 방출할 수 있다. 가주를 그냥 내리는 길은 없다.',
      '혼인, 아이, 입양, 가계도는 <b>맹주의 계보</b>에만 있다. <b>맹주가 쓰러지면 누가 이을지 고른다.</b> 어른 자식, 막사의 같은 병과, 다른 가문의 가주 가운데 하나다. 고를 이가 없으면 대가 끊기고 스무 해가 흐른다.',
      '<b>쓰러진 사람은 돌아오지 않는다.</b> 가주도, 가문원도 그렇다. 많이 다치면 스스로 물러난다. 한 사람 한 사람이 귀하다.']],
    ['등급, 단, 가문 공훈', 0, [
      '<b>등급</b>은 타고난 그릇이다. 모집하거나 태어날 때 정해지고 바뀌지 않는다. 등급이 높은 사람이 가주가 되면 가문이 더 강해진다. 맹주 자리는 희귀 밑으로 치지 않는다. 등급이 높을수록 경험치도 빨리 쌓인다.' +      // r45 표 · r44 숫자
        '<table class="htab"><thead><tr><th>등급</th><th>가문원</th><th>가주일 때</th><th>성장</th></tr></thead><tbody>' + DS.GRADES.slice(1).map(function (q, i) { var pc = DS.potMul ? Math.round((DS.potMul({ pot: i + 1 }) - 1) * 100) : 0; return '<tr><th style="color:' + q.col + '">' + q.name + '</th><td class="num">×' + q.mul.toFixed(2) + '</td><td class="num">×' + DS.BN.gmul[i + 1].toFixed(2) + '</td><td class="num">' + (pc > 0 ? '+' : pc < 0 ? '−' : '±') + Math.abs(pc) + '%</td></tr>'; }).join('') + '</tbody></table>',
      '<b>단과 레벨</b>은 사람마다 따로다. 싸우면 경험치를 얻어 오르고, 10레벨마다 단이 오른다. 단이 오를 때마다 기질에 맞는 능력치가 하나씩 더 오른다. 합일하지 않은 사람은 7단 Lv10에서 멈춘다.',
      '<b>가문 공훈</b>은 가문의 레벨이다. 그 가문의 가주가 싸우고 이길수록 가문에 쌓이고, 계급이 오르면 가주(맹주 가문은 가문원도)가 강해진다. 공훈은 대를 넘어 쌓이고 스무 해가 흘러도 그대로다. 가문 목록은 공훈 순이다.' +
        '<table class="htab"><thead><tr><th>계급</th><th>공훈</th><th>가주</th><th>가문원</th></tr></thead><tbody>' + DS.HVET.map(function (q, i) { return '<tr><th>' + DS.hName(i) + '</th><td class="num">' + q.at + '</td><td class="num">+' + q.pct + '%</td><td class="num">×' + q.mul.toFixed(2) + '</td></tr>'; }).join('') + '</tbody></table>',
      '가문에서 태어난 아이는 등급이 높을수록 경험치가 빨리 쌓인다. 희귀가 보통이고 일반은 30% 느리고 전설은 30% 빠르다.',
      '<b>대물림</b>: 맹주가 바뀌면 다음 맹주는 선대와의 레벨 차이 가운데 일부를 잇는다. 공훈 계급이 높을수록 많이 잇는다.' + '<table class="htab"><thead><tr><th>누가</th><th>신참</th><th>' + esc(DS.hName(DS.HVET.length - 1)) + '</th></tr></thead><tbody>' + [['맹주의 핏줄', 'kid'], ['맹주의 양자', 'adopt']].map(function (r) { var H = DS.HEIR[r[1]]; return '<tr><th>' + r[0] + '</th><td class="num">' + Math.round(H[0] * 100) + '%</td><td class="num">' + Math.round(H[1] * 100) + '%</td></tr>'; }).join('') + '</tbody></table>' + '<small>다른 가문의 가주를 맹주로 세우면 그 사람 가문의 계급으로 양자 몫을 잇는다. 막사에서 저절로 이은 이는 제 레벨 그대로다.</small>',
      '위쪽 초상: 아래 알약은 그 가문 가주의 「단과 레벨」, 오른쪽 위 표식은 <b>가문 공훈</b>이다. 갈매기 하나 숙련, 둘 고참, 셋 정예, 별 용사, 빛나는 별 불멸, 그 위로 명가, 명문, 천하명문.',
      '사람의 등급과 단은 인물 정보의 단계표에서, 가문 공훈은 가문 창 맨 위에서 본다.']],
    ['조작', 0, [
      '<b>화면 왼쪽 아래를 누른 채 끌면 조이스틱으로 이동</b>, <b>적을 누르면 공격</b>. 선택한 가문이 앞장서고 나머지가 따라온다. 손을 떼면 그 자리에 선다.',
      '가게, 마을 사람, 시나리오 입구, 지역 출구는 눌러도 그리로 걸어간다. PC에서는 WASD나 방향키로도 걷는다.',
      '설정의 <b>이동 방식</b>에서 예전처럼 땅을 눌러 이동하는 <b>터치</b>로 바꿀 수 있다. 조이스틱을 늘 같은 자리에 두는 고정도 있다.',
      '위쪽 초상화를 눌러 가문을 고른다. 고른 가문은 아래 정보 줄 왼쪽에 문장과 이름으로 보이고, 맨 아래 줄 <b>조작·태세</b> 칸은 그 가문 하나만 바꾼다.',
      '<b>조작 자동/수동</b>: 자동이면 알아서 싸우고 기술도 쓴다. 필살기만은 직접 눌러야 한다. 수동이면 내가 누른 대로 움직인다.',
      '<b>필살기</b>는 누구나 하나씩 타고나고 개인 5단에 깨어난다. 기술 줄 왼쪽 끝 ✦ 칸은 지금 조작하는 가문의 가주 것이다. 누르면 겨누지 않고 바로 쓴다. 조작하지 않는 사람과 전체 자동은 필살기를 쓰지 않는다. 조작하던 사람이 쓰러지면 맹주의 것으로 바뀐다.',
      '<b>태세 돌격/호위</b>: 맹주를 따르는 가문원에게만 있다. 돌격은 먼저 달려들고, 호위는 맹주 곁의 적만 상대한다.',
      '<b>전체 자동</b>을 켜면 모든 가문이 자동이 되어 적을 찾아 싸운다. 오른쪽 끝은 속도와 멈춤.',
      '전투 중에 조이스틱으로 걸으면 자동이든 수동이든 그 걸음이 먼저다. 손을 떼면 잠시 그 자리를 지킨다.',
      '목표 줄을 누르면 <b>길 안내</b>가 시작된다. 지도에서 어느 지역이든 눌러 바로 이동한다. 위험한 곳은 ⚠ 표시가 붙고, 한 번 경고한 뒤 다시 누르면 들어간다.']],
    ['전투', 0, [
      '<b>틱</b>이 차야 이동하고 공격한다. 한 칸 이동에 약 12, 공격에 40, 기술은 버튼에 적힌 만큼 든다.',
      '<b>체력과 마나는 저절로 차지 않는다.</b> 약초, 치유 기술, 교회의 치료로 채운다.',
      '<b>붉게 깜빡이는 칸</b>은 곧 공격이 떨어질 자리다. 틱이 남아 있으면 부대가 알아서 피한다.',
      '상성은 보병 ▶ 창병 ▶ 기병 ▶ 보병. 화살은 나는 적에게, 신성 공격은 망자와 악마에게 1.5배.',
      '<b>맹주가 쓰러지면</b> 전투가 끝난 뒤에 누가 이을지 고른다. 시나리오 중이면 시나리오가 끝난 뒤에. 고르기 전에 게임을 꺼도 다시 켜면 그 창이 돌아온다.']],
    ['장비', 0, [
      '장비는 적에게서만 얻는다. 마을에는 장비 가게가 없다. 누구나 어떤 장비든 장착한다. 병과에 맞지 않는 계열은 능력치가 ' + Math.round((1 - DS.GEAR_OFF) * 100) + '% 깎인다.',
      '장비에는 단이 없다. 위력, 방어 같은 수치는 <b>입은 사람의 레벨</b>을 따라 오르니, 마음에 드는 장비는 끝까지 쓸 수 있다.',
      '등급은 셋이다. <b class="lg lg1">보통</b>, <b class="lg lg4">유니크</b>(옵션 하나나 둘), <b class="lg lg5">전설</b>(이름과 대표 효과가 정해진 물건). 이름과 그림 테두리의 색으로 등급을 표시한다. 사람의 등급도 색 이름표로 보인다. 전설은 지역마다 다르니 여러 곳을 사냥해 본다.',
      '<b>강화</b>는 대장간(「마을 일」에서는 어디서나)에서 골드를 내고 한 단계씩, +' + DS.ENH.max + '까지. +1 성공 ' + DS.ENH.rate[1] + '%, 단계마다 낮아져 +5부터는 ' + DS.ENH.rate[DS.ENH.max] + '%. 실패하면 부서진다. 값은 단계가 오를수록 비싸다.',
      '<b>강화 보호 부적</b>을 쓰면 강화에 실패해도 장비가 부서지지 않는다. 가온 대장간에서 사거나, 깃술 조각을 모으면 받는다.',
      '가방 목록도 다중 선택이 기본이다. 고른 뒤 아래 붉은 버튼으로 한꺼번에 판매한다. 잠근 장비는 선택할 수 없다.']],
    ['성장과 합일', 0, [
      '경험치는 <b>사람마다</b> 받는다. 싸우는 맹주, 가주, 가문원은 모두 받는다. 막사의 사람은 같은 병과 가주가 얻는 경험치의 ' + Math.round(DS.BAL.sbShare * 100) + '%를 함께 얻는다. 뒤처진 사람은 더 빨리 따라잡는다.',
      '레벨 10마다 <b>단</b>이 오른다. 맹주는 모습이 바뀌고, 가주와 가문원은 테두리 빛이 바뀐다. 가주의 단만큼 가문의 기술이 열리고, 가문원은 3단, 5단, 7단에 제 기술을 익힌다.',
      '<b>가주는 제 모습과 능력치로 싸우고, 기술만 가문의 것을 쓴다.</b> 태생 병과가 가문과 맞으면 기술을 제대로 살린다.',
      '<b>7단 Lv10</b>인 사람 셋과 맹세의 깃대가 있으면, 교회에서 셋을 골라 함께 8단에 오른다. 누구끼리든 된다. 합일한 사람은 레벨 70을 넘어 자란다. 셋이 선 가문 가운데 공훈이 가장 큰 곳이 <b>대표 가문</b>이 되어 공훈 +' + DS.FUSE_HX + '을 받는다. 아무도 제 자리를 떠나지 않는다.',
      '8단부터의 모습과 기술은 그 사람이 선 가문의 계열(강철, 바람, 별)을 따른다.',
      '맹주가 쓰러지면 어른 자식, 막사의 같은 병과, 다른 가문의 가주 가운데 뒤를 고른다. 막사에서 이은 이는 제 레벨 그대로다. 다른 가문의 가주를 고르면 맹주 자리가 그 가문으로 간다. 그 가문의 장비와 공훈은 그대로다.', '옛 맹주 가문은 보통 가문이 된다. 어른 자식 가운데 레벨이 가장 높은 이가 가주가 되고, 없으면 막사의 같은 병과가, 그도 없으면 빈 가문이 된다. 남은 가문원은 새 맹주를 따른다. 고를 이가 아무도 없으면 대가 끊기고 스무 해가 흐른다.']],
    ['혼인과 아이', '혼인', [
      '혼인은 <b>맹주만</b> 할 수 있다. 성별이 다른 가주나 막사의 사람을 배우자로 맞는다. 막사에 있던 배우자는 맹주 가문의 가문원이 되어 함께 싸운다. 시나리오와 전투 밖이면 어디서나 「마을 일」에서 한다.',
      '<b>인물 탭</b>의 「배우자 후보」 필터에서 혼인할 수 있는 사람과 아이의 예상 등급을 볼 수 있다.',
      '혼인하면 <b>해마다 확률로</b> 아이가 태어난다. 첫해가 가장 높고, 해가 갈수록, 아이가 늘수록 드물어진다.',
      '아이의 등급은 <b>배우자의 등급</b>을 닮는다. 운에 따라 한 단계 오르거나 내린다.',
      '대장 인물 정보의 <b>혼인 칸</b>에서 함께한 햇수, 아이 수, 다음 해 출산 확률을 볼 수 있다.',
      '아이는 가계도에서 자라 15살에 <b>가문원</b>이 되어 맹주를 따라 싸운다. 빈 가문이 있으면 그 가문의 가주로 보낼 수 있다.', '<b>아이는 귀하다.</b> 영웅 모집은 비싸고, 가문원은 쓰러지면 돌아오지 않는다.']],
    ['나이', 0, [
      '모두 함께 나이를 먹는다. 1배속으로 10분이 한 해다.',
      '나이는 인물 정보 위쪽에 크게, 목록과 가문 카드에 작게 표시된다.',
      '늙으면 <b>노년</b> 표시가 붙고 공격과 마공이 조금 줄어든다. 15살이 안 된 아이는 <b>어린</b>, 72살을 넘기면 <b>장수</b> 표시가 붙는다.',
      '수명은 아무도 모른다. 노년이 다가오면 후계자를 미리 정해 두는 것이 좋다.']]
  ];
  var LH = LORE().help40;
  if (LH instanceof Array && LH.length) S = LH.filter(function (x) { return x && x.h && x.items; }).map(function (x) { return [esc(x.h), x.short ? esc(x.short) : 0, x.items]; });
  var jump = '<nav class="hjump">' + S.map(function (x, i) { return '<button class="chipbtn" data-hj="' + i + '">' + (x[1] || x[0]) + '</button>'; }).join('') + '</nav>';
  return jump + S.map(function (x, i) { return '<h4 id="hj' + i + '">' + x[0] + '</h4><ul class="help">' + x[2].map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>'; }).join('');
}
// ───────── r16 person: 인물 탭 · 육각형 능력치 · 나이 · 혼인 안내 ─────────
// 화면 글은 LORE.person(lore.js)에서, 없으면 아래 기본 글. 규칙은 건드리지 않고 읽기만 한다 (DS.cmdSpec · DS.mercSpec · DS.linBirthP · DS.potOf).
function PSL() { return LORE().person || {}; }
function pst(k, d) { var v = PSL()[k]; return v == null ? d : v; }
var PV = { sort: 'p', f: '', h: 0, cmp: false, sel: [] };      // r45 ui: h = 가문 거르기(지휘관 id) · cmp = 비교 모드 · sel = 고른 두 사람
var PSORT = [['p', '전투력'], ['x', '단·Lv'], ['g', '등급'], ['a', '나이'], ['h', '가문']];
var PFILT = [['', '모두'], ['out', '싸운다'], ['sb', '막사'], ['fam', '가족'], ['wed', '배우자 후보']];      // 2.2.0: 싸우는 이와 막사
function heroCh() { var s = G.save; return s && s.chars[s.hero] || null; }
// 한 사람의 자리: hero(맹주) · bear(가주) · sb(막사 — 같은 병과 가문의 가주라고 치고 잰다) · fol(가문원 — 맹주를 따른다) · bar(자리 없음 — 맹주를 따른다고 치고 잰다)
function pplSeat(m) {
  var s = G.save, pl = placeOf(m), ch = pl.ch ? s.chars[pl.ch] : null;
  if (pl.k === 'bear' && ch) return { k: 'bear', ch: ch, t: pl.t };
  if (pl.k === 'sb' && ch) return { k: 'bear', ch: ch, t: pl.t, sb: 1 };
  if (pl.k === 'fol' && ch) return { k: 'fol', ch: ch, t: pl.t };
  return { k: 'bar', ch: heroCh(), t: '자리 없음' };
}
// 그 자리에서 실제로 쓰는 유닛 사양
function seatSpec(seat, who) {
  var s = G.save, ch = seat.ch; if (!ch) return null;
  if (seat.k === 'hero') return who && who !== ch.ps ? DS.cmdSpec(ch, false, who) : DS.cmdSpec(ch, true, ch.ps);
  if (seat.k === 'bear') return DS.cmdSpec(ch, false, who);
  return DS.mercSpec(ch, who);
}
function seatPow(seat, who) { var u = seatSpec(seat, who); return u ? DS.power(u) : 0; }
function pplOne(m) {
  var s = G.save, hero = heroCh();
  if (m === 'h') {
    var p = hero.ps || {}, fl = DS.houseTitle(s, hero);
    return { key: 'h', kind: 'ch', ref: hero.id, ent: hero, who: p, name: DS.charName(hero), house: DS.houseName ? String(DS.houseName(s)).replace(/ 가문$/, '') : '', g: p.g || 3, xp: DS.pL(p), sx: hero.sx || '', ag: agInfo(hero),
      seat: { k: 'hero', ch: hero, t: fl.name + ' 가주' }, place: fl.name + ' 가주', spr: charSpr(hero, 2), out: true, wait: false, bar: false };
  }
  var st = pplSeat(m), inP = st.k !== 'bar' && !st.sb && s.party.indexOf(st.ch.id) >= 0;
  return { key: 'm' + m.id, kind: 'merc', ref: m.id, ent: m, who: m, name: m.n || '', house: m.sn || '', g: m.g, xp: DS.pL(m), sx: m.sx || '', ag: agInfo(m),
    seat: st, place: st.k === 'bar' ? '자리 없음' : (st.sb ? '막사' : DS.flagName(st.ch.cls) + (st.k === 'bear' ? ' 가주' : ' 가문원')), spr: mercSpr(m, 2), out: inP, sb: !!st.sb, wait: false, bar: st.k === 'bar' };
}
// 배우자감: 맹주와 성별이 다른 어른 가운데 지금 맺을 수 있는 사람 (마을 밖이라는 까닭은 빼고 본다) — 2.2.0: 막사의 사람는 혼인하면 가문원이 되어 함께 싸운다
function wedWhy(m) {
  var s = G.save, hero = heroCh(); if (!hero || !lgOn() || !DS.linWed) return '혼인 없음';
  var a = agInfo(m); if (a && a.young) return '아직 어리다';
  var w = lgWhyNot('ch', hero.id, 'merc', m.id); if (w) return w;
  var p = lgLivePid('merc', m.id); if (p && p.rv) return '돌아온 이는 혼인하지 않는다';
  var hp = lgLivePid('ch', hero.id); if (hp && hp.rv) return '대장이 돌아온 이다';
  return '';
}
function heroSpouse() { var s = G.save, hero = heroCh(), P = LS() && LS().P, hp = hero && hero.pid && P ? P[hero.pid] : null; return hp && hp.sp && P[hp.sp] ? { hp: hp, sp: P[hp.sp] } : null; }
function heroCanWed() { var hero = heroCh(); if (!hero || !lgOn() || !DS.linWed || heroSpouse()) return false; var a = agInfo(hero); if (a && a.young) return false; if (hero.vac || hero.down) return false; var hp = lgLivePid('ch', hero.id); return !(hp && hp.rv); }
function wedCands() { if (!heroCanWed()) return []; return G.save.mercs.filter(function (m) { return !wedWhy(m); }); }
// 아이 잠재력 예상: 배우자 등급 ±1 (대장 깃발 7단 이상이면 위로 조금 기운다)
function kidPot(g) { g = Math.max(1, Math.min(5, g | 0 || 2)); return '<span class="kpot"><small>' + esc(pst('kidPot', '아이')) + ' 등급</small>' + gbadge(g) + '<small>' + (g > 1 && g < 5 ? '±1단계' : g >= 5 ? '−1단계' : '+1단계') + '</small></span>'; }
function pplFam(e) { var p = lgPOf(e.kind, e.ref); if (!p) return false; return e.key === 'h' ? !!(p.spouses.length || p.kids.length) : !!(p.spouses.length || p.kids.length || (p.pa.length && !p.ad)); }
function pplPow(e) { return e.key === 'h' ? DS.flagPower(G.save, e.ent, e.who) : seatPow(e.seat, e.ent); }
// 나이 꼬리표: 「42살」 + 노년 · 어린 · 장수. 정해진 수명은 보이지 않는다
function agBadges(ent, big) {
  var a = agInfo(ent); if (!a) return '';
  var lg = !a.dead && DS.ageLong && lgTry(function () { return DS.ageLong(ent, G.save); });
  return '<span class="agb' + (big ? ' big' : '') + (a.old ? ' old' : '') + (a.young ? ' yg' : '') + '"><b class="num">' + a.y + '</b><small>살</small>' +
    (a.old ? '<i class="agk old">' + esc(AGL().elderWord || '노년') + '</i>' : '') + (a.young ? '<i class="agk yg">' + esc(pst('young', '어린')) + '</i>' : '') + (lg ? '<i class="agk lg">' + esc(pst('long', '장수')) + '</i>' : '') + '</span>';
}
function tabPeople() {
  var s = G.save, hero = heroCh(); if (!hero) return '';
  if (!PV.ld) { PV.ld = 1; var po = s.opt || {}; if (po.pplSort && PSORT.some(function (k) { return k[0] === po.pplSort; })) PV.sort = po.pplSort; if (po.pplH && s.chars[po.pplH]) PV.h = po.pplH; if (!PV.f && po.pplF) PV.f = po.pplF; }      // r45 ui: 고른 정렬·거르기를 기억한다 (s.opt)
  if (PV.h && !s.chars[PV.h]) PV.h = 0;
  var all = ['h'].concat(s.mercs).map(pplOne), n = {}, canWed = heroCanWed();
  all.forEach(function (e) { e.pow = pplPow(e); e.fam = pplFam(e); e.wed = canWed && e.key !== 'h' && !wedWhy(e.ent); });
  PFILT.forEach(function (f) { n[f[0]] = all.filter(function (e) { return pplPass(e, f[0]); }).length; });
  if (PV.f === 'wed' && !canWed) PV.f = '';
  if (PV.f && !PFILT.some(function (f) { return f[0] === PV.f; })) PV.f = '';      // 옛 거르기(막사·대기)
  var list = all.filter(function (e) { return pplPass(e, PV.f) && (!PV.h || (e.seat && e.seat.k !== 'bar' && e.seat.ch && e.seat.ch.id === PV.h)); });
  var hkey = function (e) { return e.seat && e.seat.k !== 'bar' && e.seat.ch ? (e.key === 'h' ? 0 : 1 + s.party.concat(Object.keys(s.chars).map(Number)).indexOf(e.seat.ch.id)) * 4 + (e.seat.sb ? 3 : e.seat.k === 'fol' ? 2 : 1) : 999; };
  var by = { h: function (a, b) { return hkey(a) - hkey(b) || b.pow - a.pow; }, p: function (a, b) { return b.pow - a.pow; }, a: function (a, b) { return ((b.ag && b.ag.y) || 0) - ((a.ag && a.ag.y) || 0) || b.pow - a.pow; }, g: function (a, b) { return b.g - a.g || b.pow - a.pow; }, x: function (a, b) { return b.xp - a.xp || b.pow - a.pow; } }[PV.sort] || null;
  if (by) list.sort(function (a, b) { return (a.key === 'h' ? -1 : 0) - (b.key === 'h' ? -1 : 0) || by(a, b); });      // 대장은 늘 맨 위
  var html = '<p class="hint sm pplh">' + esc(pst('tabHint', '맹주와 가주, 막사, 가문원 모두. 누르면 인물 정보.')) + '</p>';
  html += wedNote(canWed);
  html += listTools(PSORT.map(function (k) { return '<button data-psort="' + k[0] + '"' + (PV.sort === k[0] ? ' aria-pressed="true"' : '') + '>' + k[1] + '</button>'; }).join(''),
    PFILT.filter(function (f) { return f[0] !== 'wed' || canWed; }).map(function (f) { return '<button data-pf="' + f[0] + '"' + (PV.f === f[0] ? ' aria-current="true"' : '') + (f[0] === 'wed' ? ' class="wedf"' : '') + '>' + f[1] + ' <b class="num">' + n[f[0]] + '</b></button>'; }).join(''),
    '<span>' + list.length + '명</span>' + pplCmpBtns() + (PV.f === 'wed' ? '<span class="dim">' + esc(pst('wedListHint', '아이의 등급은 배우자 등급을 닮는다')) + '</span>' : ''));
  html += pplHouses(s) + pplCmpBar(all);
  if (!list.length) html += '<p class="hint empty">' + (PV.f === 'wed' ? esc(pst('noCand', '지금 맞을 수 있는 사람이 없다')) : '없음') + '</p>';
  var top = 1; list.forEach(function (e) { top = Math.max(top, e.pow || 0); });
  if (list.length) html += '<div class="pph" aria-hidden="true"><span>인물</span>' + [['x', '단·Lv'], ['a', '나이'], ['p', '전투력']].map(function (k) { return '<span data-psort="' + k[0] + '"' + (PV.sort === k[0] ? ' class="on"' : '') + '>' + k[1] + (PV.sort === k[0] ? ' ▾' : '') + '</span>'; }).join('') + '</div>';
  list.forEach(function (e) { html += pplRow(e, PV.f === 'wed', top); });
  return '<div class="pplv' + (PV.cmp ? ' cmpon' : '') + '">' + html + '</div>';
}
function pplPass(e, f) { return !f || (f === 'out' ? e.out : f === 'sb' ? e.sb : f === 'fam' ? e.fam : f === 'wed' ? e.wed : true); }
// r45 ui: 한눈에 견줄 수 있게 고정 칸 — [등급 테 초상] [이름·등급 / 자리·가문] [단·Lv] [나이] [전투력 + 막대(목록의 가장 센 사람 기준)]
function pplRole(e) { var k = e.key === 'h' ? 'hero' : e.seat ? (e.seat.sb ? 'sb' : e.seat.k) : 'bar'; return '<i class="prole r-' + k + '">' + (k === 'hero' ? '맹주' : k === 'bear' ? '가주' : k === 'sb' ? '막사' : k === 'fol' ? '가문원' : '자리 없음') + '</i>'; }
function pplRow(e, wedMode, top) {
  var G0 = DS.GRADES[e.g] || {}, L = e.xp || 1, a = e.ag, sel = PV.cmp && PV.sel.indexOf(e.key) >= 0, hs = e.seat && e.seat.k !== 'bar' && e.seat.ch ? e.seat.ch : null;
  return '<button class="row ppl pgrid' + (e.key === 'h' ? ' hero' : '') + (sel ? ' psel' : '') + '" data-pp="' + e.key + '"' + (PV.cmp ? ' aria-pressed="' + sel + '"' : '') + '>' +
    '<span class="pfr" style="--gc:' + (G0.col || '#8a867d') + '">' + e.spr + (sel ? '<i class="pck">' + (PV.sel.indexOf(e.key) + 1) + '</i>' : '') + '</span>' +
    '<span class="pn"><span class="p1"><b>' + esc(e.name) + '</b>' + gbadge(e.g) + (e.sx ? '<i class="psx sx-' + esc(e.sx) + '">' + esc(lgSexTxt(e.sx)) + '</i>' : '') + '</span>' +
    '<small class="pl">' + pplRole(e) + (hs ? crestH(hs, 14) + '<span>' + esc(hgShort(hs)) + '</span>' : '') + '</small>' + (wedMode || (e.wed && PV.f === 'fam') ? kidPot(e.g) : '') + '</span>' +
    '<span class="pc plv"><b class="num">' + DS.tierOfL(L) + '단</b><small class="num">Lv' + DS.lvOfL(L) + '</small></span>' +
    '<span class="pc pag' + (a && a.old ? ' old' : a && a.young ? ' yg' : '') + '">' + (a ? '<b class="num">' + a.y + '</b><small>' + (a.old ? esc(AGL().elderWord || '노년') : '살') + '</small>' : '<b>—</b>') + '</span>' +
    '<span class="pc ppw' + (e.bar || e.sb ? ' dim' : '') + '"><b class="num">' + (e.pow > 0 ? fmtN(e.pow) : '—') + '</b><i class="pbar"><u style="width:' + Math.max(2, Math.min(100, (e.pow || 0) / (top || 1) * 100)).toFixed(1) + '%"></u></i></span></button>';
}
// 가문 거르기: 문장 띠 (가로로 밀어 본다)
function pplHouses(s) {
  var chs = DS.charList(s).filter(function (c) { return c && DS.CLASSES[c.cls]; }); if (DS.houseSort) chs = DS.houseSort(s, chs);      // 2.1.0: 공훈 순
  if (chs.length < 2) return '';
  return '<nav class="phs" aria-label="가문으로 거르기"><button data-ph="0"' + (!PV.h ? ' aria-current="true"' : '') + '>모든 가문</button>' + chs.map(function (c) { return '<button data-ph="' + c.id + '"' + (PV.h === c.id ? ' aria-current="true"' : '') + '>' + crestH(c, 16) + '<span>' + esc(hgShort(c)) + '</span></button>'; }).join('') + '</nav>';
}
// 비교 모드: 두 사람을 골라 나란히 (같은 자리 기준 육각형 겹침 + 지금 자리의 실제 능력치)
var PCMP_ROWS = [['mhp', 'HP'], ['atk', '공격'], ['mag', '마공'], ['def', '방어'], ['res', '마방'], ['crit', '치명타', 100, '%'], ['spd', '행동 회복', 1]];
function pplCmpBtns() { return '<span class="pcmpb"><button class="btn small' + (PV.cmp ? ' gold' : '') + '" data-pcmp="1" aria-pressed="' + PV.cmp + '">' + (PV.cmp ? '비교 끝내기' : '비교') + '</button><button class="btn small pkey" data-pkey="1" aria-expanded="' + !!FOLD.pkey + '">표시 안내</button></span>'; }
function pplCmpBar(all) {
  var bar = PV.cmp ? '<p class="pcmph0">' + (PV.sel.length < 2 ? '비교할 두 사람을 누른다 <b class="num">' + PV.sel.length + '/2</b>' : '다른 사람을 누르면 바뀐다') + '</p>' : '';
  if (FOLD.pkey) bar += pplKey();
  if (!PV.cmp || PV.sel.length < 2) return bar;
  var es = PV.sel.map(function (k) { return all.filter(function (e) { return e.key === k; })[0]; }).filter(Boolean); if (es.length < 2) return bar;
  var A0 = es[0], B0 = es[1], ua = lgTry(function () { return seatSpec(A0.seat, A0.who); }) || {}, ub = lgTry(function () { return seatSpec(B0.seat, B0.who); }) || {};
  var rows = [['전투력', A0.pow || 0, B0.pow || 0, fmtN], ['단·Lv', A0.xp || 0, B0.xp || 0, lvS], ['등급', A0.g || 0, B0.g || 0, function (g) { return gbadge(g); }], ['나이', A0.ag ? A0.ag.y : 0, B0.ag ? B0.ag.y : 0, null]].concat(PCMP_ROWS.map(function (r) {
    var f = r[2] || 1, ua2 = r[0] === 'crit' ? (ua.crit || 0) * f : r[2] === 1 ? Math.round((ua[r[0]] || 0) * 10) / 10 : ua[r[0]] || 0, ub2 = r[0] === 'crit' ? (ub.crit || 0) * f : r[2] === 1 ? Math.round((ub[r[0]] || 0) * 10) / 10 : ub[r[0]] || 0;
    return [r[1], Math.round(ua2 * 10) / 10, Math.round(ub2 * 10) / 10, r[3] ? function (v) { return v + r[3]; } : null];
  }));
  var h = '<div class="pcmp"><div class="pcmph"><span class="ka">' + esc(A0.name) + '</span><span class="kb">' + esc(B0.name) + '</span></div>' +
    '<div class="pcmpr">' + lgTry(function () { return radarSvg(A0.seat, A0.who, B0.who); }) + '<small class="rdn">' + esc(A0.name) + '의 자리에 둘을 세운 기준 (0~100)</small></div>' +
    '<table class="pcmpt"><thead><tr><th></th><th class="ka">' + esc(A0.name) + '</th><th class="kb">' + esc(B0.name) + '</th></tr></thead><tbody>' +
    rows.map(function (r) {      // 나이는 좋고 나쁨이 없으니 색을 칠하지 않는다
      var fa = r[3] ? r[3](r[1]) : r[1], fb = r[3] ? r[3](r[2]) : r[2], na = r[0] === '나이' ? 0 : r[1], nb = r[0] === '나이' ? 0 : r[2];
      return '<tr><th>' + r[0] + '</th><td class="num' + (na > nb ? ' up' : na < nb ? ' dn' : '') + '">' + fa + '</td><td class="num' + (nb > na ? ' up' : nb < na ? ' dn' : '') + '">' + fb + '</td></tr>'; }).join('') +
    '</tbody></table><small class="rdn">능력치는 각자 지금 자리에서의 실제 수치. 더 높은 쪽이 초록</small></div>';
  return bar + h;
}
// 표시 안내: 등급 이름표 · 가문 공훈 별 · 필살기 ✦ · 단·Lv
function pplKey() {
  return '<div class="pkeyb"><dl class="kvr"><dt>등급</dt><dd>' + [1, 2, 3, 4, 5].map(function (g) { return gbadge(g); }).join('') + '<small>색 이름표 하나로만 보인다. 초상 테두리도 같은 색. 가문에서 태어난 아이도 같은 다섯 등급이다</small></dd>' +
    '<dt>단·Lv</dt><dd><b class="num">5단 Lv7</b><small>사람마다 따로. 10레벨마다 단이 오른다</small></dd>' +
    '<dt>자리</dt><dd>' + ['hero', 'bear', 'sb', 'fol'].map(function (k) { return '<i class="prole r-' + k + '">' + { hero: '맹주', bear: '가주', sb: '막사', fol: '가문원' }[k] + '</i>'; }).join('') + '<small>막사는 싸우지 않는다. 전투력은 같은 병과 가주가 되었을 때</small></dd>' +
    '<dt>별</dt><dd>' + (DS.vetBadge ? DS.vetBadge(4) : '★') + '<small>가문 공훈 계급에만 쓴다</small></dd>' +
    '<dt>✦</dt><dd><small>필살기 강화 (9단 · 10단 · 레벨 100)</small></dd>' +
    '<dt>전투력</dt><dd><i class="pbar demo"><u style="width:60%"></u></i><small>막대는 지금 목록에서 가장 센 사람 기준</small></dd></dl></div>';
}
// 인물 탭 위 안내: 대장이 혼인할 수 있으면 배우자감 수, 혼인했으면 한 줄
function wedNote(canWed) {
  var sp = heroSpouse(), all = lgAll();
  if (sp) { var q = all[sp.sp.id]; return '<div class="wednote on"><i class="lgring" aria-hidden="true"></i><span><b>' + esc(pst('marriedNote', '대장은 혼인했다')) + '</b><small>' + esc((q ? q.name : '') + ', ' + birthWord().t) + '</small></span><button class="btn small" data-pp="h">혼인 칸</button></div>'; }
  if (!canWed) return '';
  var c = wedCands().length;
  return '<div class="wednote"><i class="lgring" aria-hidden="true"></i><span><b>' + esc(pst('canWed', '대장이 혼인할 수 있다')) + '</b><small>' + esc(pst('candN', '배우자 후보')) + ' ' + c + '명, ' + esc(pst('wedRule', '아이는 해마다 확률로 태어난다')) + '</small></span>' + (PV.f !== 'wed' && c ? '<button class="btn small gold" data-pf="wed">배우자감</button>' : '') + '</div>';
}
function peopleClick(e, o) {
  var b;
  var popt = function () { var so = G.save.opt || (G.save.opt = {}); so.pplSort = PV.sort; so.pplF = PV.f === 'wed' ? '' : PV.f; so.pplH = PV.h || 0; U.persist(); };      // r45 ui: 고른 것을 기억
  if ((b = e.target.closest('[data-psort]'))) { PV.sort = b.dataset.psort; popt(); A('tap'); o.draw(); return true; }
  if ((b = e.target.closest('[data-ph]'))) { PV.h = +b.dataset.ph || 0; popt(); A('tap'); o.draw(); return true; }
  if ((b = e.target.closest('[data-pcmp]'))) { PV.cmp = !PV.cmp; PV.sel = []; A('tap'); o.draw(); return true; }
  if ((b = e.target.closest('[data-pkey]'))) { FOLD.pkey = !FOLD.pkey; A('tap'); o.draw(); return true; }
  if ((b = e.target.closest('[data-pf]'))) { PV.f = b.dataset.pf; popt(); A('tap'); o.draw(); return true; }
  if (PV.cmp && (b = e.target.closest('[data-pp]')) && !b.closest('.wednote')) { var pk = b.dataset.pp, pi = PV.sel.indexOf(pk); if (pi >= 0) PV.sel.splice(pi, 1); else { PV.sel.push(pk); if (PV.sel.length > 2) PV.sel.shift(); } A('tap'); o.draw(); var sb2 = $('.sb', o); if (PV.sel.length === 2 && sb2) { var pc = $('.pcmp', o); if (pc) sb2.scrollTop += pc.getBoundingClientRect().top - sb2.getBoundingClientRect().top - 70; } return true; }
  if ((b = e.target.closest('[data-pp]'))) { A('tap'); var k = b.dataset.pp; if (k === 'h') heroInfo(o); else mercInfo(+k.slice(1), o); return true; }
  return false;
}
DS.openPeople = function (f) { if (f != null) PV.f = f; return DS.openMenu('people'); };

// ── 능력치 다각형 (레이더). 축 아홉: 체력 · 공격(또는 마공) · 치명 · 기술 · 사거리 · 속도(행동 회복) · 이동 · 마방 · 방어 — 모두 유닛 사양에 실제로 있는 값
//   오른쪽은 치고, 아래는 움직이고, 왼쪽은 버틴다. 눈금 0~100 = 같은 레벨의 다른 가문(가솔이면 같은 가문의 다른 종류)과 견준 자리. 견줌 무리에서 가장 높은 값이 72(r44, 예전 85), 가장 낮은 값의 절반이 0.
var RD_AX = [['hp', '체력'], ['off', '공격'], ['crit', '치명'], ['sk', '기술'], ['rng', '사거리'], ['spd', '속도'], ['mov', '이동'], ['res', '마방'], ['def', '방어']];
function rdRaw(u) { return u ? { hp: +u.mhp || +u.hp || 0, off: Math.max(+u.atk || 0, +u.mag || 0), crit: (u.crit == null ? 0.06 : +u.crit) * 100, sk: (u.skills || []).length, rng: u.rng ? +u.rng[1] || 1 : 1, spd: +u.spd || 10, mov: 10 / (+u.mv || 1), res: +u.res || 0, def: +u.def || 0 } : null; }
var rdRefC = {};
function rdRef(seat) {
  var ch = seat.ch; if (!ch) return null;
  var flag = seat.k === 'hero' || seat.k === 'bear', key = (flag ? 'f' : 'm:' + ch.cls) + ':' + ch.L;
  if (rdRefC[key]) return rdRefC[key];
  var rows = [];
  if (flag) Object.keys(DS.CLASSES).forEach(function (k) { if (DS.CLASSES[k].master) return; var r = {}, q; for (q in ch) r[q] = ch[q]; r.cls = k; delete r.eld; delete r.gr; lgTry(function () { DS.stdGear(r, DS.tierOfL(ch.L)); rows.push(rdRaw(DS.cmdSpec(r, false, null))); }); });
  else Object.keys(DS.MERCS).forEach(function (k) { if (DS.MERCS[k].pop > 1 || DS.MERCS[k].big) return; lgTry(function () { rows.push(rdRaw(DS.mercSpec(ch, { id: 0, type: k, g: 3, x: 0, n: '' }))); }); });
  rows = rows.filter(Boolean); if (!rows.length) return null;
  var ref = {}; RD_AX.forEach(function (a) { var v = rows.map(function (r) { return r[a[0]]; }); ref[a[0]] = { lo: Math.min.apply(null, v), hi: Math.max.apply(null, v) }; });
  return (rdRefC[key] = ref);
}
var RD_TOP = 72;      // r44: 견줌 무리(희귀 기준)의 가장 높은 값이 놓이는 자리 (예전 85) — 영웅·전설이 100 에 막혀 등급 차가 지워지지 않게 위를 비운다
// 견줌 무리가 모두 0 인 축(기술 없는 용병 무리)은 있으면 꼭대기, 없으면 바닥
function rdScore(raw, ref) {
  var o = {}; RD_AX.forEach(function (a) { var r = ref[a[0]], v = raw[a[0]], z = r.lo / 2, sc = r.hi > z ? RD_TOP * (v - z) / (r.hi - z) : v > r.hi ? 100 : 4; o[a[0]] = Math.max(4, Math.min(100, Math.round(sc))); }); return o;
}
// seat 한 자리에 a(지금 사람)와 b(견줄 사람)를 세워 본다. 돌려주는 값: svg 글
function radarSvg(seat, a, b, opt) {
  opt = opt || {};
  var ref = rdRef(seat), ua = seatSpec(seat, a); if (!ref || !ua) return '';
  var ra = rdRaw(ua), sa = rdScore(ra, ref), ub = b ? seatSpec(seat, b) : null, sb = ub ? rdScore(rdRaw(ub), ref) : null;
  var s0 = !sb && DS.tmWith ? rdScore(rdRaw(DS.tmWith(1, function () { return seatSpec(seat, a); })), ref) : null;      // r41 temper: 기질·성장을 뺀 바탕 (겹쳐 그린다)
  var W = 280, H = 252, cx = 140, cy = 124, R = 78, n = RD_AX.length;
  var pt = function (i, v) { var t = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(t) * R * v / 100, cy + Math.sin(t) * R * v / 100]; };
  var poly = function (sc) { return RD_AX.map(function (ax, i) { var p = pt(i, sc[ax[0]]); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); };
  var offName = (ua.mag || 0) > (ua.atk || 0) ? '마공' : '공격';
  var g = '<svg class="radar" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('능력치 ' + RD_AX.map(function (ax) { return (ax[0] === 'off' ? offName : ax[1]) + ' ' + sa[ax[0]]; }).join(', ')) + '">';
  [25, 50, 75, 100].forEach(function (v) { g += '<polygon class="rg' + (v === 100 ? ' o' : '') + '" points="' + RD_AX.map(function (ax, i) { var p = pt(i, v); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>'; });
  RD_AX.forEach(function (ax, i) { var p = pt(i, 100); g += '<line class="rg" x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"/>'; });
  if (sb) g += '<polygon class="rb" points="' + poly(sb) + '"/>';
  g += '<polygon class="ra" points="' + poly(sa) + '"/>';
  if (s0) { g += '<polygon class="rtm0" points="' + poly(s0) + '"/>'; RD_AX.forEach(function (ax, i) { var d = sa[ax[0]] - s0[ax[0]]; if (!d) return; var p0 = pt(i, s0[ax[0]]), p1 = pt(i, sa[ax[0]]); g += '<line class="rtm ' + (d > 0 ? 'up' : 'dn') + '" x1="' + p0[0].toFixed(1) + '" y1="' + p0[1].toFixed(1) + '" x2="' + p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) + '"/>'; }); }
  RD_AX.forEach(function (ax, i) { var p = pt(i, sa[ax[0]]); g += '<circle class="rd" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6"/>'; });
  RD_AX.forEach(function (ax, i) {
    var p = pt(i, 122), dx = p[0] - cx, anc = Math.abs(dx) < 12 ? 'middle' : dx > 0 ? 'start' : 'end', dy = p[1] < cy - R * 0.6 ? -4 : p[1] > cy + R * 0.6 ? 8 : 2;
    var nm = ax[0] === 'off' ? offName : ax[1], v = sa[ax[0]], d = sb ? sb[ax[0]] - v : 0;
    g += '<text class="rl" x="' + p[0].toFixed(1) + '" y="' + (p[1] + dy - 6).toFixed(1) + '" text-anchor="' + anc + '">' + nm + '</text>' +
      '<text class="rv" x="' + p[0].toFixed(1) + '" y="' + (p[1] + dy + 7).toFixed(1) + '" text-anchor="' + anc + '">' + v + (sb ? '<tspan class="' + (d > 0 ? 'up' : d < 0 ? 'dn' : 'eq') + '"> ' + (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d) + '</tspan>' : '') + '</text>';
  });
  return g + '</svg>';
}
function cmpBtn(id, on) { return '<button class="cmpb" data-cmp2="' + id + '" aria-pressed="' + (on === id) + '">' + (on === id ? '비교 중' : '비교') + '</button>'; }
function rdLegend(a, b) { return '<p class="rleg"><i class="ka"></i>' + esc(a) + (b ? '<i class="kb"></i>' + esc(b) : '<i class="ktm"></i>기질·성장 <i class="ktu">+</i><i class="ktd">−</i>') + '</p>'; }
function seatNote(seat) { return seat.k === 'bar' ? pst('seatBar', '맹주를 따른다면') : seat.k === 'fol' ? pst('seatFol', '가문원 자리에서') : seat.sb ? pst('seatSb', '같은 병과 가주가 되면') : pst('seatFlag', '가주 자리에서'); }
// 사람 창 머리 아래: 레이더 + 전투력 + 비교
var CMP = {};      // 사람 창마다 견줄 사람 (열쇠: 'h' | 'm<id>')
function radarBlock(key, seat, who, powHtml) {
  var c = CMP[key], other = c ? (c === 'h' ? (heroCh() || {}).ps : mercById(+String(c).slice(1))) : null, oname = c ? (c === 'h' ? DS.charName(heroCh()) : (other && other.n) || '') : '';
  if (c && !other) { delete CMP[key]; other = null; }
  var nm = key === 'h' ? DS.charName(heroCh()) : (who && who.n) || '';
  var h = '<div class="rdrow"><div class="rdg">' + radarSvg(seat, who, other) + rdLegend(nm, other ? oname : '') + '</div><div class="rdside">' + powHtml + sumLine(seat, who) + potLine(key, who) + tmLine(who) +
    '<small class="rdn">' + esc(seatNote(seat)) + '<br>' + esc(pst('scaleNote', '같은 레벨 기준 0~100')) + '</small>' +
    (other ? '<p class="pwd2">' + pwDelta(seatPow(seat, who), seatPow(seat, other)) + '</p><button class="btn small" data-cmpx="1">비교 끄기</button>' : '<button class="btn small" data-cmp="' + key + '">비교</button>') + '</div></div>';
  return h;
}
// r44: 능력치 합 한 줄 (그 자리의 유닛 사양 — 등급 배율이 그대로 담긴다). 가주·맹주·막사 자리면 가주 등급 배율, 가문원이면 따르는 이 등급 배율
function sumLine(seat, who) {
  if (!who || !DS.statTotal) return '';
  var u = null; try { u = seatSpec(seat, who); } catch (x) { u = null; } if (!u) return '';
  var flag = seat.k === 'hero' || seat.k === 'bear', g = Math.max(1, Math.min(5, Math.round(+who.g || 3))), lord = seat.k === 'hero' && seat.ch && who === seat.ch.ps, k = lord ? DS.bnHeroGMul(who) : flag ? DS.bnGMul(who) : (DS.GRADES[g] || {}).mul || 1;      // 맹주 자리는 희귀 밑으로 치지 않는다
  return '<p class="rdsum"><small>능력치 합</small><b class="num">' + fmtN(DS.statTotal(u)) + '</b><i class="fxt">' + esc((DS.GRADES[g] || {}).name || '') + ' ×' + k.toFixed(2) + '</i></p>';
}
// 잠재력 한 줄 (등급 1~5 → 성장 %). 공훈 속도는 공훈을 받는 기록에 잠재력이 있을 때만 (DS.potMul). 대장은 가계의 사람 기록에서 읽는다
// r41 temper: 「기질」 한 줄 — 이름 + 숫자 (주 공격이 아닌 칸은 뺀다) + 받은 개인 성장 합
function tmLine(who) {
  if (!who || !DS.tmLabel) return '';
  var L = DS.tmLabel(who), pg = DS.pgOf(who), pgs = DS.TM_KEYS.map(function (k, i) { return pg[i] ? DS.TM_STAT[k] + ' +' + pg[i] + '%' : ''; }).filter(Boolean);
  return '<p class="tmrow"><small>기질</small><b>' + esc(L.text) + '</b>' + (L.neg ? '<i class="tmn">' + esc(L.neg) + '</i>' : '') + '<span class="tmv">' + (L.nums.length && DS.statChips ? DS.statChips(L.nums.join(', ')) : esc(L.nums.join(', ') || '치우침 없음')) + '</span>' + (pgs.length ? '<span class="tmg"><i>개인 성장</i>' + (DS.statChips ? DS.statChips(pgs.join(', ')) : esc(pgs.join(', '))) + '</span>' : '') + '</p>';      // r45 ui: 칩
}
function potOf(key, who) {
  var v = who && who.pot, L = LS(), hero = key === 'h' ? heroCh() : null;
  if (!(v >= 1 && v <= 5) && hero && L && hero.pid && L.P[hero.pid]) v = L.P[hero.pid].pot;
  if (!(v >= 1 && v <= 5) && DS.potOf2) v = DS.potOf2(who);      // r44: 적힌 잠재력이 없으면 등급이 곧 잠재력
  return v >= 1 && v <= 5 ? v | 0 : 0;
}
function potLine(key, who) {
  var v = potOf(key, who); if (!v) return '';
  var pc = DS.potMul ? Math.round((DS.potMul({ pot: v }) - 1) * 100) : null; if (pc == null) return '';      // r44: 모든 사람이 등급만큼 빨리 자란다 · r45: 별 없이 칩 하나
  return '<p class="rdpot"><small>경험치 쌓이는 속도</small><i class="fxt">성장 ' + (pc > 0 ? '+' : pc < 0 ? '−' : '±') + Math.abs(pc) + '%</i></p>';
}
function cmpPick(key, seat, parent) {
  var o = sheet(pst('cmpTitle', '비교할 사람'), function () {
    var s = G.save, html = '<p class="hint sm">' + esc(pst('cmpHint', '고른 사람을 이 자리에 놓고 겹쳐 비교')) + '</p>';
    var all = ['h'].concat(s.mercs).map(pplOne).filter(function (e) { return e.key !== key; });
    all.forEach(function (e) { e.pow = seatPow(seat, e.key === 'h' ? e.who : e.ent); });
    all.sort(function (a, b) { return b.pow - a.pow; }).slice(0, 80).forEach(function (e) {
      html += '<button class="row ppl" data-cmpto="' + e.key + '">' + e.spr + '<span class="pn"><span class="p1"><b>' + esc(e.name) + '</b> ' + gpips(e.g) + '</span><small class="pl">' + esc(e.place) + '</small></span><span class="pr">' + agBadges(e.ent) + '<span class="pp">' + pwNum(e.pow, 'sm') + '</span></span></button>';
    });
    return html;
  }, 'sub');
  o.addEventListener('click', function (e) { var b = e.target.closest('[data-cmpto]'); if (!b) return; CMP[key] = b.dataset.cmpto; A('tap'); o.close(); });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
}
// 사람 창의 비교 손잡이: 처리했으면 true
function cmpClick(e, o, key, seat) {
  if (e.target.closest('[data-cmpx]')) { delete CMP[key]; A('tap'); o.draw(); return true; }
  if (e.target.closest('[data-cmp]')) { A('tap'); cmpPick(key, seat, o); return true; }
  return false;
}
// 고르기 시트(이 깃발을 들 사람 · 이 자리에 설 사람)의 겹쳐 보기: 「지금 든 사람」 위에 「후보」
var PKC = {};
function pickRadar(seat, cur, cand, curName) {
  if (!cur && !cand) return '';
  var a = cur || cand, b = cur && cand ? cand : null;
  return '<div class="rdpick">' + radarSvg(seat, a, b) + rdLegend(cur ? (curName || pst('curWho', '지금 가주')) : (cand.n || ''), b ? (cand.n || '') + ' (' + pst('candWho', '후보') + ')' : '') + (b ? '' : '<p class="hint sm">' + esc(pst('pickCmpHint', '후보 줄의 「비교」로 겹쳐 본다')) + '</p>') + '</div>';
}
// 대장 사람 창의 「혼인」 칸
function birthWord() {
  var s = G.save, x = heroSpouse(); if (!x) return { t: '', p: 0 };
  var b = LS().bd && LS().bd[Math.min(x.hp.id, x.sp.id) + ':' + Math.max(x.hp.id, x.sp.id)], kids = DS.linKids ? DS.linKids(s, x.hp.id).filter(function (q) { return !q.ad && (q.pa || [])[0] === x.hp.id; }).length : 0;
  var yr = ((b && b.y) || 0) + 1, p = DS.linBirthP ? DS.linBirthP(yr, kids) : 0;
  if (x.sp.st !== 'live' || x.hp.rv || x.sp.rv) return { t: pst('birthNone', '출산 가능성 없음'), p: 0, kids: kids, b: b };
  var w = p >= 0.25 ? pst('hi', '높음') : p >= 0.1 ? pst('mid', '보통') : pst('lo', '낮음');
  return { t: pst('birthNext', '다음 해 아이') + ' ' + w, w: w, p: p, kids: kids, b: b, k: p >= 0.25 ? 'hi' : p >= 0.1 ? 'mid' : 'lo' };
}
function wedBox() {
  var s = G.save, hero = heroCh(); if (!hero || !lgOn() || !DS.linWed) return '';
  var x = heroSpouse(), all = lgAll(), Y = (DS.AGE && DS.AGE.year) || 600;
  var h = '<h4>' + esc(pst('wedHead', '혼인')) + '</h4>';
  if (!x) {
    if (!heroCanWed()) return h + '<div class="wedbox none"><p class="hint sm">' + esc(pst('cantWed', '지금은 혼인할 수 없다')) + '</p></div>';
    var c = wedCands().length;
    return h + '<div class="wedbox none"><p><b>' + esc(pst('notYet', '아직 혼인하지 않았다')) + '</b></p><ul class="wrule">' + wedRules() + '</ul>' +
      '<div class="btns"><button class="btn small gold" data-gowed="1">' + esc(pst('seeCand', '배우자 후보 보기')) + ' <b class="num">' + c + '</b></button></div></div>';
  }
  var q = all[x.sp.id], bw = birthWord(), b = bw.b, cal = agCal(), wy = b && b.w != null ? Math.floor(b.w / Y) + 1 : null, togo = b && b.w != null && cal ? Math.max(0, Math.floor((cal.t - b.w) / Y)) : null;
  return h + '<div class="wedbox"><div class="wsp">' + (q && q.spr ? q.spr : '') + '<span><b>' + esc(q ? q.name : '') + '</b>' + (q && q.m ? ' ' + gpips(q.m.g) : '') + '<small>' + esc(q ? lgSexTxt(q.sx) + (q.ag ? ', ' + agWord(q.ag) : '') : '') + '</small></span>' + (q && q.m ? kidPot(q.m.g) : '') + '</div>' +
    '<dl class="kv wkv">' + (wy ? '<dt>' + esc(pst('wedYear', '혼인한 해')) + '</dt><dd>' + esc((AGL().calName || '가문력') + ' ' + wy + '년') + '</dd>' : '') + (togo != null ? '<dt>' + esc(pst('together', '함께한 해')) + '</dt><dd class="num">' + togo + '년</dd>' : '') +
    '<dt>' + esc(pst('kids', '아이')) + '</dt><dd class="num">' + (bw.kids || 0) + '명</dd><dt>' + esc(pst('nextBirth', '다음 해 아이')) + '</dt><dd><b class="bw ' + (bw.k || 'lo') + '">' + esc(bw.w || bw.t) + '</b>' + (bw.p ? ' <small class="dim">약 ' + Math.round(bw.p * 100) + '%</small>' : '') + '</dd></dl>' +
    '<p class="hint sm">' + esc(pst('wedFade', '해가 갈수록, 아이가 늘수록 드물어진다')) + '</p></div>';
}
function wedRules() { return (PSL().rules || ['아이는 해마다 확률로 태어난다', '아이의 등급은 배우자 등급을 닮는다', '해가 갈수록, 아이가 늘수록 드물어진다']).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join(''); }
// 마을 안내 띠: 대장이 혼인할 수 있고 배우자감이 있으면 한 번만 (끄기 가능, 다시 뜨지 않는다 — opt.wedTip)
function wedTipTick() {
  var s = G.save; if (!s || !s.opt || s.opt.wedTip || $('#wedtip')) return;
  if (!(G.zone && G.zone.town && !G.scn && !(G.sim && G.sim.combat)) || $('.ov')) return;
  if (!heroCanWed() || !wedCands().length) return;
  var top = $('#top'), q = $('#quest'); if (!top) return;
  s.opt.wedTip = 1; U.persist();
  var el = document.createElement('div'); el.id = 'wedtip'; el.setAttribute('role', 'status');
  el.innerHTML = '<i class="lgring" aria-hidden="true"></i><span><b>' + esc(pst('tipTitle', '대장이 혼인할 수 있다')) + '</b><small>' + esc(pst('tipSub', '인물 탭에서 배우자 후보 확인')) + '</small></span><button class="btn small gold" data-wt="go">보기</button><button class="btn small wtx" data-wt="x" aria-label="끄기">끄기</button>';
  if (q && q.nextSibling) top.insertBefore(el, q.nextSibling); else top.appendChild(el);
  el.addEventListener('click', function (e) { var b = e.target.closest('[data-wt]'); if (!b) return; A('tap'); el.remove(); if (b.dataset.wt === 'go') DS.openPeople('wed'); });
  setTimeout(function () { if (el.isConnected) el.remove(); }, 20000);
}
var TABS = [['party', '부대', tabParty], ['people', '인물', tabPeople], ['bag', '가방', tabBag], ['map', '지도', tabMap], ['online', '현황', function () { return DS.Online ? DS.Online.tab() : '<p class="hint">여기서는 현황이 안 보입니다.</p>'; }], ['help', '도움말', tabHelp], ['opt', '설정', tabOpt]];      // r4 online: 모험가 현황 (online.js)
var TAB_IC = { party: 'party', people: 'people', bag: 'bag', map: 'map', online: 'online', help: 'help', opt: 'settings' };
DS.openMenu = function (tab) {
  var cur = tab || 'party';
  if (cur === 'bag') { var bmn0 = document.getElementById('bMenu'); if (bmn0) bmn0.classList.remove('newdot'); G.bagNew = false; }
  var o = sheet('', function () {
    var T = TABS.filter(function (t) { return t[0] === cur; })[0] || TABS[0];
    // r26 art: 아이콘 탭 (그림 + 짧은 이름). 고른 탭은 솟아 몸판과 이어진다. 혼인할 수 있는 사람이 있으면 「인물」에 붉은 점
    var dot = { people: lgTry(function () { return wedCands().length > 0; }), party: lgTry(function () { var f = DS.barFill(G.save); return !!(f.slots && f.can); }), bag: !!G.bagNew };      // 인물 = 혼인 후보 · 2.2.0 부대 = 빈 가문에 보낼 어른 가문원
    return '<nav class="mtabs gtabs">' + TABS.map(function (t) { return '<button data-tab="' + t[0] + '"' + (t[0] === T[0] ? ' aria-current="true"' : '') + ' aria-label="' + t[1] + '">' + (U.svg ? '<i class="ic2" aria-hidden="true">' + U.svg(TAB_IC[t[0]] || 'scroll', 20) + '</i>' : '') + '<small>' + t[1] + '</small>' + (dot[t[0]] ? '<i class="dot" aria-hidden="true"></i>' : '') + '</button>'; }).join('') + '</nav>' + T[2]();
  }, 'menu', function (body, ov) {
    var T0 = TABS.filter(function (t) { return t[0] === cur; })[0] || TABS[0], h3 = $('.sh h3', ov); if (h3 && h3.textContent !== T0[1]) h3.textContent = T0[1];      // r26: 창 머리 붉은 리본에 지금 탭 이름
    var box = cur === 'bag' && DS.lootUI && DS.lootUI.bind ? $('.lootbag', body) : null;      // 아이템팀의 가방 구역: 그릴 때마다 새 상자에 손잡이를 단다
    if (box) DS.lootUI.bind(box, function () { if (ov.isConnected) ov.draw(); });
  });
  // r12: 창 아래 줄 — 막사에서 고른 사람이 있으면 붉은 「n명 내보내기」, 가방에서 고른 장비가 있으면 붉은 「n점 판매」
  o.foot = function () {
    if (cur === 'party') { var em = DS.bnEmpty ? DS.bnEmpty(G.save).length : 0, why = DS.recruitWhy ? DS.recruitWhy(G.save) : ''; return '<button class="btn' + (em && !why ? ' gold' : '') + '" data-gohall="1">영웅관' + (em ? ' <small>빈 가문 ' + em + '</small>' : '') + '</button>'; }      // 2.2.0: 막사 입구 자리에 영웅관
    if (cur === 'bag' && DS.lootUI && DS.lootUI.sellFoot) return DS.lootUI.sellFoot(G.save);
    return '';
  };
  o.draw();
  o.addEventListener('click', function (e) {
    var s = G.save, t = e.target.closest('[data-tab]'), c = e.target.closest('[data-ch]'), z = e.target.closest('[data-z]'), op = e.target.closest('[data-opt]');
    if (t && t.dataset.tab === 'bag') { var bmn = $('#bMenu'); if (bmn) bmn.classList.remove('newdot'); G.bagNew = false; }      // r26: 가방을 보면 붉은 점을 걷는다
    if (t) { var ti0 = TABS.map(function (x) { return x[0]; }).indexOf(cur), ti1 = TABS.map(function (x) { return x[0]; }).indexOf(t.dataset.tab); if (ti0 === ti1) return; cur = t.dataset.tab; A('tab'); o.draw(); var sb0 = $('.sb', o); sb0.scrollTop = 0; if (!(U.calm && U.calm())) { sb0.style.setProperty('--dir', ti1 > ti0 ? '1' : '-1'); sb0.classList.remove('tsl'); void sb0.offsetWidth; sb0.classList.add('tsl'); } return; }      // r26: 탭 소리 + 가는 쪽으로 미끄러진다
    if (cur === 'party' && partyClick(e, o)) return;      // r12: 깃발 카드 칸 · 막사 여럿 고르기
    if (cur === 'people' && peopleClick(e, o)) return;      // r16 person: 인물 탭
    if (e.target.closest('.sfoot [data-loot-sellsel]') && DS.lootUI && DS.lootUI.sellSel) { A('tap'); DS.lootUI.sellSel(function () { if (o.isConnected) o.draw(); }); return; }
    var hj = e.target.closest('[data-hj]'); if (hj) { var hd = $('#hj' + hj.dataset.hj, o), sb = $('.sb', o); if (hd && sb) { var nv = $('.mtabs', o); sb.scrollTop += hd.getBoundingClientRect().top - sb.getBoundingClientRect().top - (nv ? nv.offsetHeight : 0) - 6; } A('tap'); return; }
    var mt = e.target.closest('[data-mtag]');
    if (mt) { G.save.opt.mtag = mt.dataset.mtag; if (G.view) G.view.mtag = mt.dataset.mtag; A('tap'); U.persist(); o.draw(); return; }
    var us = e.target.closest('[data-use]');
    if (us) { var uk = us.dataset.use, zid = G.zone && G.zone.id; if (DS.useCtl && DS.useCtl(uk)) { if (G.zone && G.zone.id !== zid) o.close(); else o.draw(); } return; }
    var bt = e.target.closest('[data-bty]');
    if (bt) { var bb = bounties().filter(function (x) { return String(x.id) === bt.dataset.bty; })[0]; if (bb && DS.huntGo) { A('ok'); o.close(); DS.huntGo(bb); } return; }
    if (e.target.closest('[data-lgmenu]')) { A('tap'); DS.openLineage('tree', null, o); return; }      // r4 가문
    if (e.target.closest('[data-twopen]')) { A('tap'); DS.openTownWork(o); return; }      // 2.1.0 마을 일
    var wp = e.target.closest('[data-wearpick]'); if (wp) { A('tap'); pickWearer(wp.dataset.wearpick, o); return; }
    if (c) { A('tap'); charSheet(+c.dataset.ch, o); return; }
    var mz = z || e.target.closest('[data-scn],[data-wpit]'); if (mz) { mapTap(mz, o); return; }      // r4 map: 지도에서 바로 이동
    if (op) {
      var k = op.dataset.opt;
      if (k === 'dfx') { s.opt.dfx = s.opt.dfx === false; A('tap'); U.persist(); o.draw(); return; }
      if (k === 'fev') { s.opt.fev = s.opt.fev === false; A('tap'); U.persist(); o.draw(); return; }      // r47: 들판 습격 (기본 켬)
      if (k === 'bark') { s.opt.bark = s.opt.bark === false; if (s.opt.bark === false && G.view) G.view.barks = []; A('tap'); U.persist(); o.draw(); return; }      // r32 전투 대사: 기본 켬      // r16 fx: 기본 켬
      if (k === 'calm') { s.opt.calm = !(DS.calmFx && DS.calmFx()); if (DS.applyCalm) DS.applyCalm(); A('tap'); U.persist(); o.draw(); return; }      // r26: 움직임 줄이기 (DS.calmFx · html.calm)
      if (k === 'wake') { s.opt.wake = s.opt.wake === false; if (DS.wakeSync) DS.wakeSync(); A('tap'); U.persist(); o.draw(); return; }      // 2.1.2: 화면 켜 두기 (기본 켬)
      if (k === 'hap') { s.opt.hap = s.opt.hap === false; if (s.opt.hap && U.haptic) U.haptic(20); A('tap'); U.persist(); o.draw(); return; }
      if (k === 'notes') { A('tap'); DS.openNotes(); return; }
      if (k === 'record') { A('tap'); DS.showRecord(null, false); return; }
      if (k === 'help') { cur = 'help'; A('tap'); o.draw(); $('.sb', o).scrollTop = 0; return; }
      if (k === 'reset') {
        var q = overlay('<div class="result"><h2>처음부터 다시 시작할까?</h2><p>지금까지의 진행이 모두 지워진다.</p><button class="btn red wide" id="yes">삭제</button><button class="btn wide" data-close>취소</button></div>', 'modal center');
        $('#yes', q).addEventListener('click', function () { G.save = null; U.wipeSave(); location.reload(); });
        return;
      }
      s.opt[k] = !s.opt[k]; var a = {}; a[k] = s.opt[k]; DS.Audio.set(a); A('tap'); U.persist(); o.draw();
    }
  });
};

// ───────── r4 가문 (lineage_ui): 가계도·연대기·혼인·출생·후계 의식·슬픔·관 ─────────
// 규칙과 저장은 lineage 팀(src/lineage.js, 설계서 r4/lineage_spec.md)의 save.lin·save.coffins 와 DS.lin* 함수가 맡는다.
// 여기서는 읽어서 보여 주고, 고른 것을 그 함수에 넘기기만 한다. 그 함수·칸이 없으면 단추도 창도 나타나지 않는다 (지금 게임 그대로).
function LGL() { return (LORE().lineage) || {}; }
function LGU() { return LGL().ui || {}; }      // 화면 전용 글 (설계서 키와 겹치지 않게 ui 아래에)
function lgPick(a, seed) { if (!(a instanceof Array) || !a.length) return ''; var i = seed == null ? Math.floor(Math.random() * a.length) : Math.abs(seed | 0) % a.length; return a[i]; }
// 글 채우기: {x} 그대로, {x:이가} 받침에 맞는 조사 (이가·을를·은는·와과·으로)
function lgFill(t, v) {
  t = t && typeof t === 'object' ? t.t : t;
  var J = '(이가|을를|은는|와과|과와|으로)';
  return lt(String(t == null ? '' : t).replace(new RegExp('\\{(\\w+)(?::' + J + ')?\\}(?:\\{' + J + '\\})?', 'g'), function (all, k, j1, j2) { var w = v && v[k] != null ? String(v[k]) : '', j = j1 || j2; if (j === '과와') j = '와과'; return j ? josa(w, j) : w; }));
}
function lgTry(f) { try { return f(); } catch (x) { return null; } }
// ── 어댑터: save.lin.P 의 사람 → 화면이 쓰는 한 사람
//   { id, kind 'ch'|'merc', ref, ch, m, name, full, sur, sx, gen, role, grade, L, alive, st, pa, ad, spouses, kids, died, fused, fu, mood, spr }
function LS() { return G.save && G.save.lin && G.save.lin.P ? G.save.lin : null; }
function lgOn() { return !!LS(); }
var lgCache = null;
function lgAll() {
  var L = LS(); if (!L) return {};
  var key = L.P, n = 0; for (var q in L.P) n++;
  if (lgCache && lgCache.P === key && lgCache.n === n && lgCache.lg === (L.log || []).length && lgCache.t > performance.now() - 300) return lgCache.all;
  var s = G.save, all = {}, id, ex = {};
  for (id in L.P) all[id] = lgNorm(L.P[id], s);
  // 혼인: 지금 배우자(sp) + 연대기의 혼인 사건(사별·이별한 옛 배우자도 나무에 남긴다)
  (L.log || []).forEach(function (e) { if (e && e.t === 'wed' && all[e.a] && all[e.b]) { ex[e.a + ':' + e.b] = 1; } });
  for (id in all) { var p = all[id], r = L.P[id]; if (r.sp && all[r.sp]) ex[id + ':' + r.sp] = 1; }
  Object.keys(ex).forEach(function (k) { var ab = k.split(':'); [[ab[0], ab[1]], [ab[1], ab[0]]].forEach(function (x) { var p = all[x[0]]; if (p && p.spouses.indexOf(x[1]) < 0) p.spouses.push(x[1]); }); });
  // 자식: pa 를 거꾸로. 합일로 하나가 된 사람의 자식은 마스터의 자식으로 (fu)
  var into = {};
  for (id in all) (all[id].fu || []).forEach(function (f) { into[f] = id; if (all[f]) all[f].fusedInto = id; });
  for (id in all) if (all[id].into && all[all[id].into]) { into[id] = all[id].into; all[id].fusedInto = all[id].into; }
  for (id in all) (all[id].pa || []).forEach(function (pid) { var to = into[pid] && all[into[pid]] ? into[pid] : pid; if (all[to] && all[to].kids.indexOf(id) < 0) all[to].kids.push(id); if (to !== pid && all[pid]) all[pid].kidsGone = (all[pid].kidsGone || 0) + 1; });
  lgCache = { P: key, n: n, lg: (L.log || []).length, t: performance.now(), all: all };
  return all;
}
function lgNorm(r, s) {
  var ch = (r.st || 'live') === 'live' && r.c && s.chars[r.c] && (s.chars[r.c].pid == null || s.chars[r.c].pid === r.id) ? s.chars[r.c] : null, m = r.m ? mercById(r.m) : null;
  var young = r.st === 'young', alive = (r.st || 'live') === 'live' || young, sn = r.snap || (young && r.ya) || {}, cls = ch ? ch.cls : m ? null : r.cls || sn.cls, L = ch ? ch.L : m ? null : r.L || 0;      // 3.3.0: 부대원으로 돌아온 이·깃대를 넘긴 선대는 지금의 용병 모습으로
  var full = r.gv || r.k === 'm' || r.kin ? DS.snName(r.sn, r.n) : (r.sn ? r.sn + ' 가문 ' : '') + (r.n || '');
  var ln = DS.linName ? lgTry(function () { return DS.linName(s, r.id); }) : '';
  var name = ch && alive ? DS.charName(ch) : ln || r.ttl || (r.k === 'c' && cls && DS.CLASSES[cls] ? (r.n && r.n !== DS.CLASSES[cls].name ? r.n : DS.tierName(cls, DS.tierOfL(L || 1))) : '') || full || (m ? m.n : '') || '이름 없음';
  var type = m ? m.type : r.type || sn.type, g = m ? m.g : r.g || sn.g;
  var role = cls && DS.CLASSES[cls] ? DS.CLASSES[cls].name + (L ? ', ' + DS.tierName(cls, DS.tierOfL(L)) : '') : type && DS.MERCS[type] ? (g && DS.GRADES[g] ? DS.GRADES[g].name + ' ' : '') + DS.MERCS[type].name : '';
  var mood = DS.linMood ? lgTry(function () { return DS.linMood(ch || m || r); }) : null;
  if (young && role) role = (AGL().youngRole || '자라면') + ' ' + role;      // r6 나이: 아직 아이 — 성년이 되면 될 용병
  return { id: r.id, kind: r.k === 'c' ? 'ch' : 'merc', ref: ch ? ch.id : m ? m.id : 0, ch: ch, m: m, name: name, full: full !== name ? full : '', sur: r.sn || '', sx: r.sx || (ch && ch.sx) || (m && m.sx) || '',
    gen: r.gen || 0, role: role, grade: cls ? 0 : g || 0, L: L || 0, alive: alive, st: r.st || 'live', pa: (r.pa || []).slice(), ad: !!r.ad, osn: r.osn || '', spouses: [], kids: [], died: r.d || null, fu: r.fu || null,
    fused: r.st === 'fused', into: r.into || 0, coffin: r.st === 'coffin', born: r.born || 0, mood: mood, spr: lgSpr(r, ch, m, cls, type, g, L), young: young, ag: agInfo(ch || m || r) };
}
function lgSpr(r, ch, m, cls, type, g, L) {
  if (ch) return charSpr(ch, 2);
  if (m) return mercSpr(m, 2);
  if (cls && DS.lookName) return lgTry(function () { return sprTag(DS.lookName(cls, DS.tierOfL(L || 1)), '', 2); }) || '';
  var M = type && DS.MERCS[type]; if (!M) return '';
  var v = (r.snap && r.snap.v) || (r.ya && r.ya.v) || r.v || 0; return M.big ? sprTag(M.sprite, M.pal, 1.5) : sprTag(type + '_' + (g || 1) + '_' + v, '', 2);
}
function lgP(id) { return lgAll()[id] || null; }
function lgPOf(kind, ref) { var x = kind === 'ch' ? G.save.chars[ref] : mercById(ref), pid = x && x.pid, all = lgAll(); if (pid && all[pid]) return all[pid]; for (var k in all) if (all[k].kind === kind && all[k].ref === ref && all[k].alive) return all[k]; return null; }
function lgSexTxt(s) { var S = DS.SEX && DS.SEX[s]; return S ? S.name : s === 'f' ? '여' : s === 'm' ? '남' : ''; }
function lgSexOf(kind, ref) { var x = kind === 'ch' ? G.save.chars[ref] : mercById(ref), p = x && x.pid ? lgP(x.pid) : null; return (x && x.sx) || (p && p.sx) || ''; }
function lgWhen(o) { return o && o.s != null ? '시나리오 ' + o.s + ' 뒤' : ''; }      // 사건의 s = 그때까지 깬 시나리오 수
function lgDiedTxt(p) { var d = p && p.died; if (!d) return ''; return [lgWhen(d), d.at, d.why].filter(Boolean).join(', '); }
function lgEvents() {
  var L = LS(); if (!L) return [];
  var all = lgAll();
  return (L.log || []).filter(Boolean).map(function (e) {
    var t = DS.linEvText ? lgTry(function () { return DS.linEvText(G.save, e); }) : null;
    if (typeof t !== 'string' || !t) { var C = LGU().chronicle || {}, a = all[e.a], b = all[e.b], x = e.x || {}; t = lgFill(C[e.t] || '{a} — {t}', { a: a ? a.name : '누군가', b: b ? b.name : '', at: x.at || '', why: x.why || '', t: LG_KIND[e.t] || e.t }); }
    var k = e.t === 'part' && e.x && e.x.why === '합일' ? 'fuse' : e.t === 'gone' ? 'part' : e.t === 'death' && e.x && /천수/.test(e.x.why || '') ? 'nat' : e.t;
    return { k: k, s: e.s, at: (e.x && e.x.at) || '', text: t, who: [e.a, e.b].concat((e.x && e.x.pa) || []).filter(Boolean).map(String), raw: e };
  });
}
function lgCoffins() {
  var c = G.save && (DS.coffins ? lgTry(function () { return DS.coffins(G.save); }) : G.save.coffins); if (!c || !DS.buyCoffin) return null;
  var max = DS.COFFIN_MAX || 10, have = Math.max(0, Math.min(max, +c.have || 0)), list = c.list || [];
  return { max: max, have: have, list: list, used: list.length, free: Math.max(0, have - list.length), price: DS.coffinPrice ? lgTry(function () { return DS.coffinPrice(G.save); }) : 0 };
}
// ── 가계도 한 칸
function lgTag(p) {
  if (p.fused) return '<small class="fzt">' + esc(LGU().fuseTag || '함께 오름') + '</small>';
  if (p.coffin) return '<small class="dd">관에 모심</small>';
  if (!p.alive) return '<small class="dd">' + esc(p.ag ? agWord(p.ag) + (p.died && /천수/.test(p.died.why || '') ? ', 천수' : '') : p.died && p.died.s != null ? lgWhen(p.died) + ' 잠듦' : '잠듦') + '</small>';
  if (p.young) return '<small class="gn yg">' + esc(agWord(p.ag) + ', ' + (AGL().youngTag || '15살에 성년')) + '</small>';      // r6 나이: 아직 막사에 들지 않은 아이
  return p.gen ? '<small class="gn"><i>' + p.gen + '대</i>' + (p.ad ? '<i>양' + (p.sx === 'f' ? '녀' : '자') + '</i>' : '') + (p.ag ? '<i class="agt' + (p.ag.old ? ' old' : '') + '">' + p.ag.y + '살</i>' : p.kind === 'ch' ? '<i>대장</i>' : '') + '</small>' : '';      // r45 ui: 쉼표 → 칸
}
function lgNode(p, cur) {
  if (!p) return '';
  return '<button class="lgn s-' + (p.sx || 'x') + (p.alive ? '' : ' dead') + (p.young ? ' yg' : '') + (p.ag && p.ag.old && p.alive ? ' old' : '') + (p.fused ? ' fz' : '') + (p.fu ? ' ms' : '') + (p.ad ? ' ad' : '') + (p.kind === 'ch' && p.alive ? ' cmd' : '') + (cur === p.id ? ' cur' : '') + '" data-lgp="' + esc(p.id) + '">' +
    '<span class="ps">' + (p.spr || '') + '</span><b' + (p.grade && p.alive ? ' style="color:' + gcol(p.grade) + '"' : '') + '>' + esc(p.name) + '</b>' +
    '<small class="lgr">' + (p.sx ? '<i class="sx sx-' + esc(p.sx) + '">' + esc(lgSexTxt(p.sx)) + '</i>' : '') + esc(String((p.kind === 'ch' ? p.role : p.full || p.role) || '').replace(/,\s*/g, ' ')) + '</small>' + lgTag(p) + '</button>';
}
// 한 집(그 사람 + 배우자들) 아래로 자식들. 양자·양녀는 점선. 마스터는 하나가 된 이들을 위에 단다.
function lgBranch(p, all, seen, cur, adopt) {
  if (!p || seen[p.id]) return '';
  seen[p.id] = 1;
  var sp = p.spouses.map(function (id) { return all[id]; }).filter(function (x) { return x && !seen[x.id]; });
  sp.forEach(function (x) { seen[x.id] = 1; });
  var kids = [], kseen = {};
  [p].concat(sp).forEach(function (x) { x.kids.forEach(function (k) { if (!kseen[k] && all[k] && !seen[k]) { kseen[k] = 1; kids.push(all[k]); } }); });
  kids.sort(function (a, b) { return (a.born || 0) - (b.born || 0) || (a.id < b.id ? -1 : 1); });
  var fu = p.fu ? '<div class="fug"><span>' + p.fu.map(function (f) { var q = all[f]; return q ? '<button class="lgl" data-lgp="' + esc(q.id) + '">' + esc(q.name) + '</button>' : ''; }).join('') + '</span><i>' + esc(LGU().fuseTag || '함께 오름') + '</i></div>' : '';
  var html = '<li' + (adopt ? ' class="ad"' : '') + '>' + fu + '<div class="cp">' + lgNode(p, cur) + sp.map(function (x) { var on = x.alive && p.alive && (LS().P[p.id] || {}).sp === x.id; return '<i class="wl' + (on ? '' : ' gone') + '" aria-hidden="true"></i>' + lgNode(x, cur); }).join('') + '</div>';
  if (p.fusedInto && all[p.fusedInto]) html += '<small class="fzto">→ ' + esc(all[p.fusedInto].name) + '</small>';
  var sub = kids.map(function (k) { return lgBranch(k, all, seen, cur, k.ad); }).join('');
  if (sub) html += '<ul>' + sub + '</ul>';
  return html + '</li>';
}
function lgHasUp(p, all) { return p.pa.some(function (x) { return all[x]; }); }
function lgRoots(all) {
  var roots = [];
  for (var id in all) { var p = all[id]; if (!lgHasUp(p, all) && !p.spouses.some(function (s) { var q = all[s]; return q && lgHasUp(q, all); })) roots.push(p); }
  // 혼인한 둘이 모두 뿌리면 지휘관 쪽을 뿌리로 (용병 배우자는 그 곁에 그려진다)
  var hero = G.save.chars[G.save.hero], hp = hero && hero.pid;
  roots.sort(function (a, b) { return (a.fu ? 1 : 0) - (b.fu ? 1 : 0) || (b.id === hp || (b.sur && b.sur === LS().sur)) - (a.id === hp || (a.sur && a.sur === LS().sur)) || (b.kind === 'ch') - (a.kind === 'ch') || (a.born || 0) - (b.born || 0) || (a.id < b.id ? -1 : 1); });
  return roots;
}
function lgTree(cur) {
  var all = lgAll(), roots = lgRoots(all), seen = {}, html = '', alone = [];
  if (!Object.keys(all).length) return '<p class="hint lgempty">아직 가문의 기록이 없다.</p>';
  roots.forEach(function (r) {
    if (seen[r.id]) return;
    if (!r.spouses.length && !r.kids.length && !r.fu) { seen[r.id] = 1; if (r.kind === 'ch' && r.alive) alone.push(r); return; }      // 짝도 자식도 없는 용병(관에 모신 이 등)은 나무에 그리지 않는다      // 혼인도 자식도 없는 이는 아래에 한 줄로 모은다
    var b = lgBranch(r, all, seen, cur); if (!b) return;
    html += '<h5 class="lghd">' + esc(r.sur ? r.sur + ' 가문' : '가문') + (r.fu ? ' <i>합일</i>' : '') + '</h5><div class="lgwrap" data-lgwrap><ul class="lgt">' + b + '</ul></div>';
  });
  if (alone.length) html += '<h5 class="lghd">아직 혼인하지 않은 이 <i>' + alone.length + '</i></h5><div class="lgwrap" data-lgwrap><div class="lgrow2">' + alone.map(function (p) { return lgNode(p, cur); }).join('') + '</div></div>';
  return html + '<p class="hint lglegend"><span><i class="k s-m"></i>남</span><span><i class="k s-f"></i>여</span><span><i class="k wl"></i>혼인</span><span><i class="k ad"></i>양자, 양녀</span><span><i class="k dead"></i>잠든 이</span><span>옆으로 밀어서 보기</span></p>';
}
// ── 한 사람 카드 (가계도에서 누르면)
function lgNames(ids) { var all = lgAll(); return (ids || []).map(function (i) { var q = all[i]; return q ? '<button class="lgl' + (q.alive ? '' : ' dead') + '" data-lgp="' + esc(q.id) + '">' + esc(q.name) + '</button>' : ''; }).join('') || '<i class="none">없음</i>'; }
function lgMoodTxt(md) { return md && md.name ? '<em class="lgmood k-' + esc(md.k || '') + '">' + esc(md.name) + (md.n ? ' ' + md.n + '판' : '') + '</em>' : ''; }
function lgCard(id, parent) {
  var o = sheet('가문 사람', function () {
    var p = lgP(id); if (!p) return '<p class="hint">기록이 없다.</p>';
    var all = lgAll(), kidW = p.sx === 'f' ? '녀' : '자', R = LS().P[p.id] || {}, CD = GN().card || {}, badge = '';
    if (R.hand) badge = CD.hand || '집안을 맡긴 이, 한때 가주';
    else if (R.rv && !p.alive) badge = CD.twice || '두 번 떠난 이';
    else if (R.rv || R.ret) { badge = R.cls && R.d0 ? lgFill(CD.back || '돌아온 자, 한때 {f} {t}단', { f: DS.egFlagName ? DS.egFlagName(R.cls) : '', t: DS.tierOfL(R.L || 1) }) : CD.backM || '돌아온 자'; }
    var title = p.ch && p.ch.id === G.save.hero && DS.heroCall ? DS.heroCall(G.save) : p.name;
    var html = '<div class="chead lgch' + (p.alive ? '' : ' dead') + '">' + (p.spr || '<span class="noboss">' + esc(lgSexTxt(p.sx)) + '</span>') + '<div><h2' + (p.grade && p.alive ? ' style="color:' + gcol(p.grade) + '"' : '') + '>' + esc(title) + '</h2>' + (badge ? '<small class="egbadge">' + esc(badge) + '</small>' : '') +
      '<p class="chsub">' + (p.sx ? '<i class="csx sx-' + esc(p.sx) + '">' + esc(lgSexTxt(p.sx)) + '</i>' : '') + (p.role ? '<i class="ccls">' + esc(String(p.role).replace(/,\s*/g, ' ')) + '</i>' : '') + (p.L ? '<i class="ccls">' + lvS(p.L) + '</i>' : '') + (p.gen ? '<i class="ccls">' + p.gen + '대</i>' : '') + agTag(p.ch || p.m || LS().P[p.id]) + ' ' + lgMoodTxt(p.mood) + '</p>' +
      (p.alive ? '' : '<small class="dd">' + esc(p.fused ? (LGU().fuseTag || '함께 오름') + (p.fusedInto && all[p.fusedInto] ? ' → ' + all[p.fusedInto].name : '') : p.coffin ? '관에 모심, ' + lgDiedTxt(p) : lgDiedTxt(p)) + '</small>') + '</div></div>';
    html += '<dl class="facts lgf"><dt>이름, 성</dt><dd>' + esc(p.full || p.name) + (p.osn ? ' <i class="own">옛 성 ' + esc(p.osn) + '</i>' : '') + '</dd>' +
      (p.ag ? '<dt>나이</dt><dd>' + esc(agWord(p.ag) + (p.ag.old && p.alive ? ', ' + (AGL().elderWord || '노년') : '') + (p.young ? ' — ' + (AGL().youngHint || '15살에 가문원이 되어 함께 싸운다.') : '')) + '</dd>' : '') +
      '<dt>부모</dt><dd>' + lgNames(p.pa) + (p.ad ? ' <i class="own">양' + kidW + '</i>' : '') + '</dd>' +
      '<dt>배우자</dt><dd>' + lgNames(p.spouses) + '</dd><dt>자식</dt><dd>' + lgNames(p.kids) + '</dd>' +
      (p.fu ? '<dt>하나가 된 이</dt><dd>' + lgNames(p.fu) + '</dd>' : '') +
      (p.died && !p.fused ? '<dt>사인</dt><dd>' + esc(p.died.why || '전사') + (p.died.at ? ' — ' + esc(p.died.at) : '') + '</dd>' : '') +
      (!p.alive && R.lw ? '<dt>마지막 말</dt><dd class="lw">「' + esc(R.lw) + '」</dd>' : '') +
      (p.m ? '<dt>전공</dt><dd><span class="schips">' + DS.chip('함께한 전투', String(p.m.b || 0)) + DS.chip('쓰러뜨린 적', String(p.m.k || 0)) + (DS.mercTitle && DS.mercTitle(p.m) ? '<span class="sch tag">「' + esc(DS.mercTitle(p.m)) + '」</span>' : '') + '</span></dd>' : '') + '</dl>';
    var ev = lgEvents().filter(function (e) { return e.who.indexOf(String(p.id)) >= 0; });
    if (ev.length) html += '<h4>기록</h4>' + lgChronHtml(ev);
    if (DS.rnBtn) html += DS.rnBtn('p', p.id);      // r10 social: 개명권 (대장·용병·아이 — 그 밖의 사람은 빈 글)
    var btn = p.alive && p.ref ? '<button class="btn wide" data-lgopen="1">' + (p.kind === 'ch' ? '가문 정보' : '인물 정보') + '</button>' : '';
    return html + (btn ? '<div class="foot">' + btn + '</div>' : '');
  }, 'sub lgs');
  o.addEventListener('click', function (e) {
    var pb = e.target.closest('[data-lgp]'); if (pb && pb.dataset.lgp !== String(id)) { A('tap'); lgCard(pb.dataset.lgp, o); return; }
    if (e.target.closest('[data-lgopen]')) { var p = lgP(id); if (!p) return; A('tap'); if (p.kind === 'ch') charSheet(p.ref, o); else mercInfo(p.ref, o); }
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
  return o;
}
// ── 연대기: 시간순, 「시나리오 n 뒤」가 바뀔 때마다 머리줄
var LG_KIND = { wed: '혼인', part: '이별', birth: '출생', adopt: '입양', death: '잠듦', heir: '계승', kin: '먼 친척', grief: '슬픔', fuse: '합일', coffin: '관', bury: '묻음', revive: '돌아옴', recall: '돌아옴', hand: '맡김', nat: '천수', adult: '성년', elder: '노년', rename: '개명' };
function lwLine(t) { return t ? '<small class="lw">마지막 말 「' + esc(t) + '」</small>' : ''; }
function lgChronHtml(list) {
  var last = null, html = '<ol class="lgc">';
  list.forEach(function (e) {
    var head = lgWhen(e) || '처음';
    if (head !== last) { html += '<li class="hd">' + esc(head) + '</li>'; last = head; }
    var lw0 = e.k === 'death' && e.raw && e.raw.a && LS() && LS().P[e.raw.a] ? LS().P[e.raw.a].lw : '';      // r32: 잠든 이의 마지막 말
    html += '<li class="k-' + esc(e.k) + '"><i>' + (LG_KIND[e.k] || '기록') + '</i><span>' + esc(e.text || '') + (e.at && (e.text || '').indexOf(e.at) < 0 ? ' <small>' + esc(e.at) + '</small>' : '') + (lw0 ? ' <small class="lw">「' + esc(lw0) + '」</small>' : '') + '</span></li>';
  });
  return html + '</ol>';
}
// ── 「가문」 창: 가계도 / 연대기 / 관
DS.openLineage = function (tab, focus, parent) {
  if (!lgOn()) { toast('가문 기록이 아직 없다'); return null; }
  var cur = tab || 'tree', logSeen = false, o = null;
  o = sheet('가문', function () {
    var ev = lgEvents(), cf = lgCoffins();
    var html = '<nav class="lgtab">' + [['tree', '가계도'], ['log', '연대기 ' + ev.length], ['coffin', '관' + (cf ? ' ' + cf.used + '/' + cf.have : '')]].filter(function (t) { return t[0] !== 'coffin' || cf; })
      .map(function (t) { return '<button data-lgtab="' + t[0] + '"' + (t[0] === cur ? ' aria-current="true"' : '') + '>' + t[1] + '</button>'; }).join('') + '</nav>';
    if (cur === 'tree') html += agCalRow() + lgHouseBar() + (DS.lgPartyRow ? DS.lgPartyRow(G.save) : '') + lgTree(focus);      // r33 legacy: 가문의 유산 줄      // r6 나이: 달력
    else if (cur === 'log') html += ev.length ? lgChronHtml(ev) : '<p class="hint">아직 적힌 일이 없다.</p>';
    else html += lgCoffinHtml();
    return html;
  }, 'lgs', function (body, ov) {
    var L0 = LS(), hh = ov.querySelector('.sh h3'); if (hh && DS.crestHtml && L0 && !hh.dataset.crest) { hh.dataset.crest = '1'; hh.innerHTML = (DS.houseCrestOf && G.save.chars[G.save.hero] ? DS.houseCrestOf(G.save, G.save.chars[G.save.hero], 24) : DS.crestHtml(L0.sur || L0.hn || '', 24)) + ' ' + esc(DS.houseName ? lgTry(function () { return DS.houseName(G.save); }) || '가문' : '가문'); }      // r12: 그래픽 2차, 제목 앞 문패 문장
    U.$$('[data-lgwrap]', body).forEach(function (w) { var c = $('.lgn.cur', w); if (c) w.scrollLeft = Math.max(0, c.offsetLeft + c.offsetWidth / 2 - w.clientWidth / 2); });
    if (cur === 'log' && !logSeen) { body.scrollTop = body.scrollHeight; logSeen = true; }      // 연대기는 맨 아래(가장 최근)부터
  });
  o.addEventListener('click', function (e) {
    var t = e.target.closest('[data-lgtab]'); if (t) { cur = t.dataset.lgtab; logSeen = false; A('tap'); $('.sb', o).scrollTop = 0; o.draw(); return; }
    var pb = e.target.closest('[data-lgp]'); if (pb) { A('tap'); focus = pb.dataset.lgp; lgCard(pb.dataset.lgp, o); return; }
    if (lgHouseClick(e, o)) return;
    if (lgCoffinClick(e, o)) return;
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
  return o;
};
// 가계도 맨 위: 주인공 가문의 성과 주인공의 성별 (설계서 linSetSurname·linSetSex)
function lgHouseBar() {
  var s = G.save, hero = s.chars[s.hero], L = LS(); if (!hero || !L) return '';
  var canSur = !!(DS.linSetSurname && DS.SURNAMES), canSex = !!DS.linSetSex, sx = lgSexOf('ch', hero.id);
  if (!canSur && !canSex) return '';
  var hn = DS.allyFull ? DS.allyFull(s) : '연맹';      // 2.1.0: 이 창의 머리는 연맹 이름 (맹주의 가문 이름은 줄마다 그대로)
  return '<div class="row lgbar"><div class="tx"><b>' + esc(hn) + ' <i class="own">' + esc(DS.charName(hero)) + ', ' + esc(DS.houseName(s)) + '</i></b><small>' + '연맹의 이름은 대가 바뀌어도 그대로다. 「연맹 이름」에서 바꾼다.</small></div><div class="btns">' +
    (canSur ? '<button class="btn small" data-lgsur="1">연맹 이름</button>' : '') +
    (canSex ? '<div class="seg" role="group" aria-label="주인공 성별"><button data-lgsex="m"' + (sx === 'm' ? ' aria-pressed="true"' : '') + '>남</button><button data-lgsex="f"' + (sx === 'f' ? ' aria-pressed="true"' : '') + '>여</button></div>' : '') + '</div></div>';
}
function lgHouseClick(e, o) {
  var sx = e.target.closest('[data-lgsex]'), su = e.target.closest('[data-lgsur]'), s = G.save;
  if (sx) { var ok = lgTry(function () { return DS.linSetSex(s, s.hero, sx.dataset.lgsex); }); if (ok === false) { A('cancel'); toast('혼인 중에는 성별을 바꿀 수 없다'); } else { A('tap'); lgCache = null; U.persist(); o.draw(); } return true; }
  if (!su) return false;
  A('tap');
  var q = sheet('연맹의 이름', function () {      // 2.1.0: 「가문의 성」 창 → 연맹 이름 고르기 (큰 이름 여덟 + 장을 마치며 연 이름). 가문 이름·사람의 성은 바뀌지 않는다
    var cur = DS.allyName(G.save), btn = function (n) { return '<button class="lgl' + (cur === n ? ' on' : '') + '" data-lgsn="' + esc(n) + '">' + esc(n) + '</button>'; };
    return '<p class="hint">연맹의 이름을 고른다. 지금은 「' + esc(DS.allyFull(G.save)) + '」. 맹주가 바뀌어도, 대가 넘어가도 이 이름은 그대로다. 가문 이름과 사람의 성은 바뀌지 않는다.</p>' +
      '<div class="lgsurs">' + (DS.GRAND_HOUSES || []).map(function (g) { return btn(g[0]); }).join('') + '</div>';
  }, 'sub lgs');
  q.addEventListener('click', function (ev) { var b = ev.target.closest('[data-lgsn]'); if (!b) return; lgTry(function () { return DS.allySet(s, b.dataset.lgsn); }); lgCache = null; A('ok'); U.persist(); q.close(); toast(DS.allyFull(s) + '이 되었다'); });
  q.onclose = function () { if (o.isConnected) o.draw(); };
  return true;
}
// ── 배우자: 지휘관 창·용병 정보 창의 「가문」 줄 (kind 'ch' | 'merc', ref = 지휘관 id | 용병 id)
function lgInTown() { return !(G.scn || G.ending || (G.sim && G.sim.combat)); }      // 2.1.0: 「마을 일」은 어디서나 — 시나리오와 전투 중만 막는다
function lgSpouseRow(kind, ref) {
  if (!lgOn() || !DS.linWed) return '';
  var p = lgPOf(kind, ref), sx = lgSexOf(kind, ref), all = lgAll(), r = p && LS().P[p.id];
  var sp = r && r.sp && all[r.sp] ? all[r.sp] : null, kids = p ? p.kids.map(function (k) { return all[k]; }).filter(Boolean) : [];
  var mood = p && p.mood ? ' ' + lgMoodTxt(p.mood) : '';
  var bd = sp && DS.linBond ? lgTry(function () { return DS.linBond(G.save, p.id); }) : null;
  var sub = sp ? (kids.length ? '자식 ' + kids.length + '명: ' + kids.map(function (k) { return (k.full || k.name) + (k.alive ? (k.young && k.ag ? '(' + k.ag.y + '살)' : '') : '(잠듦)'); }).join(', ') : '아직 자식이 없다') + ''      /* r16 person: 4.0 은 해마다 굴린다 — 옛 「정 n/3」 줄은 뺐다 (혼인 칸이 다음 해 가망을 보인다) */
    : p && p.pa.length && !kids.length ? (p.ad ? '양' + (p.sx === 'f' ? '녀' : '자') + ', ' : '') + '부모 ' + p.pa.map(function (x) { return all[x] ? all[x].name + (all[x].alive ? '' : '(잠듦)') : ''; }).filter(Boolean).join(', ') + '. ' + (kind === 'merc' ? '대장과 혼인할 수 있다.' : '혼인할 수 있다.')
    : kids.length ? '자식 ' + kids.length + '명: ' + kids.map(function (k) { return (k.full || k.name) + (k.alive ? (k.young && k.ag ? '(' + k.ag.y + '살)' : '') : '(잠듦)'); }).join(', ')
    : (kind === 'merc' ? '맹주와 혼인할 수 있다. ' : '가주나 막사의 사람과 혼인할 수 있다. ') + '성별이 달라야 한다.';
  var html = '<h4>집안 <i class="own">' + esc(p && p.sur ? p.sur + ' 가문' : '') + (p && p.gen ? ' ' + p.gen + '세' : '') + '</i></h4><div class="row lgrow"><div class="tx"><b>' + (sp ? '배우자 ' + esc(sp.name) : '배우자 없음') + ' <i class="own">' + esc(lgSexTxt(sp ? sp.sx : sx)) + '</i>' + mood + '</b>' +
    '<small>' + esc(sub) + '</small></div><div class="btns">' + (sp ? '<button class="btn small" data-lgpart="' + kind + ':' + ref + '">이별</button>' : '<button class="btn small gold" data-lgwed="' + kind + ':' + ref + '">배우자로 맞기</button>') +
    (p ? '<button class="btn small" data-lgtree="' + esc(p.id) + '">가계도</button>' : '') + '</div></div>';
  return html;
}
// 지휘관 창·용병 정보 창의 click 에서 부른다. 처리했으면 true
function lgRowClick(e, o) {
  var w = e.target.closest('[data-lgwed]'), t = e.target.closest('[data-lgtree]'), pt = e.target.closest('[data-lgpart]');
  if (t) { A('tap'); DS.openLineage('tree', t.dataset.lgtree, o); return true; }
  if (!w && !pt) return false;
  if (!lgInTown()) { A('cancel'); toast(DS.townWorkWhy()); return true; }
  var k = (w || pt).dataset[w ? 'lgwed' : 'lgpart'].split(':');
  if (w) { A('tap'); lgPickSpouse(k[0], +k[1], o); return true; }
  var me = lgPOf(k[0], +k[1]), sp = me && LS().P[me.id] && lgP(LS().P[me.id].sp); if (!me || !sp) return true;
  var q = overlay('<div class="result lgq"><p class="eyebrow">이별</p><h2>' + esc(me.name) + ', ' + esc(sp.name) + '</h2><p>두 사람이 이별할까? 쌓인 정은 사라지고, 자식은 그대로 두 사람의 자식으로 남는다.</p><button class="btn red wide" id="yesPart">이별한다</button><button class="btn wide" data-close>취소</button></div>', 'modal center');
  $('#yesPart', q).addEventListener('click', function () { q.close(); lgTry(function () { return DS.linPart(G.save, me.id, '이별'); }); lgCache = null; A('cancel'); U.persist(); if (o.isConnected) o.draw(); toast(me.name + ', ' + sp.name + ', 헤어졌다'); });
  return true;
}
function lgLivePid(kind, ref) { var x = kind === 'ch' ? G.save.chars[ref] : mercById(ref), P = LS().P, p = x && x.pid && P[x.pid]; return p && p.st === 'live' ? p : null; }
function lgWhyNot(k1, r1, k2, r2) {
  var s = G.save, x1 = k1 === 'ch' ? s.chars[r1] : mercById(r1), x2 = k2 === 'ch' ? s.chars[r2] : mercById(r2);
  if (!x1 || !x2) return '찾을 수 없다';
  if (k1 !== 'ch' && k2 !== 'ch') return '한쪽은 대장이어야 한다';
  if (x1.sx && x2.sx && x1.sx === x2.sx) return '성별이 같으면 맺을 수 없다';
  var p1 = lgLivePid(k1, r1), p2 = lgLivePid(k2, r2);
  if ((p1 && p1.sp) || (p2 && p2.sp)) return '이미 배우자가 있다';
  if ((k1 === 'ch' && (x1.vac || x1.down)) || (k2 === 'ch' && (x2.vac || x2.down))) return '쓰러진 가문이다';
  if (p1 && p2) { var pa1 = p1.pa || [], pa2 = p2.pa || []; if (pa1.indexOf(p2.id) >= 0 || pa2.indexOf(p1.id) >= 0 || pa1.some(function (q) { return pa2.indexOf(q) >= 0; })) return '가까운 혈육입니다'; }
  return '';
}
function lgRef(kind, ref) { return kind === 'ch' ? { c: ref } : { m: ref }; }
function lgCanWed(a, b) { var r = DS.linCanWed ? lgTry(function () { return DS.linCanWed(G.save, a, b); }) : null; return r && typeof r === 'object' ? r : { ok: !!r, why: r ? '' : '혼인할 수 없다' }; }
function lgPickSpouse(kind, ref, parent) {
  var showNo = false;
  var o = sheet('배우자 선택', function () {
    var s = G.save, me = lgPOf(kind, ref), myName = kind === 'ch' ? DS.charName(s.chars[ref]) : (mercById(ref) || {}).n || '', mySx = lgSexOf(kind, ref), list = [];
    DS.charList(s).forEach(function (c) { if (kind === 'ch' && c.id === ref) return; if (c.down || c.id !== s.hero) return;      /* r16 person: 4.0 은 사람이 부대원 줄에 있다 — 깃발 줄은 대장만 사람 */ list.push({ kind: 'ch', ref: c.id, name: DS.charName(c), sx: lgSexOf('ch', c.id), role: DS.flagName(c.cls) + ', ' + lvS(c.L), spr: charSpr(c, 2) }); });
    if (kind === 'ch') s.mercs.forEach(function (m) { list.push({ kind: 'merc', ref: m.id, name: (DS.fullName ? lgTry(function () { return DS.fullName(m); }) : '') || m.n || '', sx: lgSexOf('merc', m.id), role: DS.mercKind(m) + (m.o && s.chars[m.o] ? ', ' + DS.flagName(s.chars[m.o].cls) + (m.h ? ' 가주' : ' 가솔') : ', 막사'), grade: m.g, ag: agInfo(m), spr: mercSpr(m, 2) }); });
    list.forEach(function (c) { c.why = lgWhyNot(kind, ref, c.kind, c.ref); c.same = mySx && c.sx === mySx; });      // 고르기 전에는 화면에서만 따진다 (linCanWed 는 용병마다 가계도 사람을 만들기 때문에 누를 때만 부른다)
    var ok = list.filter(function (c) { return !c.why; }), no = list.filter(function (c) { return c.why; }), same = no.filter(function (c) { return c.same; }).length;
    var html = '<p class="hint">' + esc(myName) + '의 짝을 고른다. 성별이 달라야 한다.' + (kind === 'merc' ? ' 혼인은 맹주와만 한다.' : ' 막사에 있던 배우자는 가문원이 되어 함께 싸운다.') + '</p>';
    if (same) html += '<p class="lgsame">같은 성별(' + esc(lgSexTxt(mySx)) + ') ' + same + '명은 선택할 수 없다.</p>';
    if (!ok.length) html += '<p class="lock">지금 맞을 수 있는 사람이 없다.</p>';
    ok.forEach(function (c) { html += lgCandRow(c, '<button class="btn small gold" data-lgto="' + c.kind + ':' + c.ref + '">선택</button>'); });
    if (no.length) html += '<button class="btn wide lgmore" data-lgno="1">' + (showNo ? '선택할 수 없는 사람 접기' : '선택할 수 없는 사람 ' + no.length + '명과 이유 보기') + '</button>' + (showNo ? no.map(function (c) { return lgCandRow(c, '<span class="why">' + esc(c.why) + '</span>', true); }).join('') : '');
    return html;
  }, 'sub lgs');
  o.addEventListener('click', function (e) {
    if (e.target.closest('[data-lgno]')) { showNo = !showNo; A('tap'); o.draw(); return; }
    var b = e.target.closest('[data-lgto]'); if (!b) return;
    var k = b.dataset.lgto.split(':'), s = G.save, a = kind === 'ch' ? lgRef(kind, ref) : lgRef(k[0], +k[1]), bb = kind === 'ch' ? lgRef(k[0], +k[1]) : lgRef(kind, ref);
    var chk = lgCanWed(a, bb); if (!chk.ok) { A('cancel'); toast(chk.why || '혼인할 수 없다'); return; }
    var nm = function (x) { return x.c ? DS.charName(s.chars[x.c]) : ((DS.fullName ? lgTry(function () { return DS.fullName(mercById(x.m)); }) : '') || (mercById(x.m) || {}).n || ''); };
    var an = nm(a), bn = nm(bb);
    var q = overlay('<div class="result lgq"><p class="eyebrow">혼인</p><div class="lgrings" aria-hidden="true"><i></i><i></i></div><h2>' + esc(an) + ', ' + esc(bn) + '</h2><p>두 사람이 혼인할까?</p><ul class="wrule">' + wedRules() + '</ul><p class="dim">이별은 마을에서 한다.</p><button class="btn gold wide" id="yesWed">혼인한다</button><button class="btn wide" data-close>취소</button></div>', 'modal center');
    $('#yesWed', q).addEventListener('click', function () {
      q.close();
      var r = lgTry(function () { return DS.linWed(s, a, bb); });
      if (!r) { A('cancel'); toast('혼인할 수 없다'); return; }
      lgCache = null; U.persist(); o.close(); lgWedShow(an, bn);
    });
  });
  o.onclose = function () { if (parent && parent.isConnected && parent.draw) parent.draw(); };
}
function lgCandRow(c, right, dim) {
  return '<div class="row merc lgcand' + (dim ? ' dim' : '') + '">' + (c.spr || '') + '<span class="mn"><b' + (c.grade ? ' style="color:' + gcol(c.grade) + '"' : '') + '>' + esc(c.name) + '</b> <i class="own sx-' + esc(c.sx || 'x') + '">' + esc(lgSexTxt(c.sx)) + '</i>' + (c.grade ? ' ' + gbadge(c.grade) : '') + '<small>' + pills([c.role || '', c.ag ? agWord(c.ag) : '']) + '</small>' + (c.grade && !dim ? kidPot(c.grade) : '') + '</span>' + right + '</div>';      // r16 person: 나이와 아이 잠재력 예상
}
// 혼인 짧은 연출: 두 고리 + 한 줄
function lgWedShow(a, b, cb) {
  A2('wed', 'star');
  var line = lgFill(lgPick(LGL().wed) || '{a}, {b}. 두 사람이 혼인했다.', { a: a, b: b });
  var o = overlay('<div class="result lgev wed"><p class="eyebrow">혼인</p><div class="lgrings" aria-hidden="true"><i></i><i></i></div><h2>' + esc(a) + ' <em>, </em> ' + esc(b) + '</h2><p>' + esc(line) + '</p><button class="btn gold wide" data-close>확인</button></div>', 'modal center');
  o.onclose = function () { if (cb) cb(); };
  return o;
}
// ── 출생 연출: 「<이름> 2세가 태어났습니다」 (사건 birth 여럿이면 한 장에)
function lgBirthShow(evs, cb) {
  var all = lgAll(), kids = evs.map(function (e) { return all[e.a]; }).filter(Boolean);
  if (!kids.length) { if (cb) cb(); return; }
  A2('birth', 'level');
  var html = '<div class="result lgev birth' + (kids.length > 1 ? ' many' : '') + '"><p class="eyebrow">출생</p>' + (kids.length > 1 ? '<h2>아이 ' + kids.length + '명이 태어났다</h2><p>' + esc(lgFill(lgPick((LGL().birth || []).slice(1)) || '', {})) + '</p>' : '');
  if (kids.length > 1) kids.forEach(function (k) {
    var pa = k.pa.map(function (x) { return all[x] ? all[x].name : ''; }).filter(Boolean).join(', ');
    html += '<div class="lgod">' + (k.spr || '') + '<span><b>' + esc(k.name) + (k.full && k.full !== k.name ? ' <i class="own">' + esc(k.full) + '</i>' : '') + '</b><small>' + esc([lgSexTxt(k.sx), k.role, pa ? '부모 ' + pa : ''].filter(Boolean).join(', ')) + '</small>' + tmBirthLine(k.id, true) + '</span>' + (DS.rnBtn ? DS.rnBtn('p', k.id) : '') + '</div>';
  });
  else kids.forEach(function (k, i) {
    var pa = k.pa.map(function (x) { return all[x] ? all[x].name : ''; }).filter(Boolean).join(', '), house = k.sur ? k.sur + ' 가문' : '';
    html += (i ? '<hr class="lgsep">' : '') + (k.spr ? '<div class="lgbaby">' + k.spr + '</div>' : '') + '<h2>' + esc(josa(k.name, '이가')) + ' 태어났다</h2>' +
      '<p>' + esc(lgFill(lgPick(LGL().birth) || '{a}. 집에 아기 울음소리가 울렸다.', { a: k.name, b: pa, house: house, kid: k.full && k.full !== k.name ? k.name + ' ' + k.full : k.name })) + '</p>' +      // 3.2.1: {kid} 가 비어 「— .」 로 끝나던 것
      '<p class="dim">' + esc([k.full && k.full !== k.name ? k.full : '', lgSexTxt(k.sx), k.role, pa ? '부모 ' + pa : ''].filter(Boolean).join(', ')) + '</p>' + tmBirthLine(k.id) + (DS.rnBtn ? DS.rnBtn('p', k.id) : '');
  });
  var anyYoung = kids.some(function (k) { return k.young; });      // r6 나이: 갓난아기는 가계도에서 자라 15살에 막사로
  html += '<p class="dim">' + esc(anyYoung ? (AGL().birthYoung || '갓난아기다. 가계도에서 자라 15살에 가문원이 된다.') : (LGU().birthNote || '가문원으로 함께 싸운다.')) + '</p><button class="btn gold wide" data-close>확인</button></div>';
  var o = overlay(html, 'modal center');
  o.onclose = function () { if (cb) cb(); };
}
// r41 temper: 출생 창의 닮은 한 줄 (「아버지를 닮아 힘이 세다」 + 기질 이름)
function tmBirthLine(pid, sm) {
  var L = LS(), p = L && L.P[pid]; if (!p || !DS.tmLikeLine) return '';
  var t = lgTry(function () { return DS.tmLikeLine(G.save, p); }) || '', lb = lgTry(function () { return DS.tmLabel({ type: p.type || (p.ya && p.ya.type), tm: DS.tmOfP(G.save, p) }); });
  return t ? (sm ? '<small class="tmb">' : '<p class="tmb">') + '<i class="tmk">기질</i>' + esc(t) + (lb && lb.names.length ? ' <b>「' + esc(lb.text) + '」</b>' : '') + (sm ? '</small>' : '</p>') : '';
}
DS.showBirth = function (pidOrEv, cb) { lgBirthShow([typeof pidOrEv === 'object' ? pidOrEv : { a: pidOrEv }], cb); };
// ── 슬픔: 남은 가족의 짧은 말. rel(설계서) = 슬퍼하는 이가 고인의 무엇인가 — 'spouse' | 'child'(부모를 잃은 자식) | 'parent'(자식을 잃은 부모)
function lgGriefSay(rel, deadSx) { var g = LGU().griefSay || {}, k = rel === 'child' ? (deadSx === 'f' ? 'mother' : 'father') : rel; return lgPick(g[k] || g[rel]) || ''; }
DS.lgGriefSay = lgGriefSay;      // lineage 팀: 전장 머리 위 글에 쓸 수 있다 (rel, 고인의 성별)
function lgMourners(d, griefs) {      // 고인을 슬퍼할 산 가족: [{ p, rel }]
  var all = lgAll(), out = [], seen = {};
  function add(id, rel) { var q = all[id]; if (q && q.alive && !seen[id]) { seen[id] = 1; out.push({ p: q, rel: rel }); } }
  (griefs || []).forEach(function (g) { if (String(g.b) === String(d.id)) add(g.a, g.rel); });
  if (!griefs || !griefs.length) {
    var r = LS().P[d.id] || {}; if (r.sp) add(r.sp, 'spouse'); if (r.lsp && all[r.lsp] && (LS().P[r.lsp] || {}).lsp === d.id && !(LS().P[r.lsp] || {}).sp) add(r.lsp, 'spouse');
    d.kids.forEach(function (k) { add(k, 'child'); });
    d.pa.forEach(function (x) { add(x, 'parent'); });
  }
  return out;
}
function lgMournHtml(d, griefs) {
  var ms = lgMourners(d, griefs); if (!ms.length) return '';
  return '<ul class="lgmourn">' + ms.slice(0, 4).map(function (x) { var t = lgGriefSay(x.rel, d.sx); return '<li><b>' + esc(x.p.name) + '</b><small>' + esc(x.rel === 'spouse' ? '배우자' : x.rel === 'child' ? (x.p.sx === 'f' ? '딸' : '아들') : (x.p.sx === 'f' ? '어머니' : '아버지')) + '</small>' + (t ? '<q>' + esc(t) + '</q>' : '') + '</li>'; }).join('') + '</ul>';
}
// ── 사망과 후계 지정 의식 (지휘관): 추도 → 관에 모신다/묻는다 → 후계 고르기 → 되돌릴 수 없음 확인 → 이어받는 글
//   창 바깥을 눌러도 닫히지 않는다(modal). 끝까지 가야 닫힌다 — 빈자리는 저장을 넘어가지 않는다(설계서 §6).
function lgHeirKind(c) {      // 설계서 linHeirs: kind 'kid' | 'adopt' | 'kin', kin 0 혈육 · 1 들인 자식 · 2 들일 용병 · 3.3.0 'back' 제 옛 자리를 되찾는 돌아온 이 · 4.0 'pull' 값없는 모집 한 번
  if (!c || c.kind === 'kin') return 'kin';
  if (c.kind === 'pull') return 'merc';
  if (c.kind === 'back') return 'adkid';
  if (c.kind === 'kid' || c.kin === 0) return 'kid';
  if (c.kin === 1 || (c.blood && c.kind === 'adopt')) return 'adkid';      // (kin 2 막사 용병 · 3 출전 중인 용병 · 4 먼 친척)
  return 'merc';
}
function lgRite(ev, cb, griefs) {
  var s = G.save, d = lgP(ev.a), chId = ev.ch;
  if (!d || !chId || !s.chars[chId]) { if (cb) cb(); return; }
  var step = 'mourn', pick = null, more = false, lock = 0, HO = { k: 'new', t: '' };      // 4.0 ⑬: 가문이 옮겨 갈 때의 호 (확인 걸음)
  var canE = DS.linEntomb && DS.linCanEntomb ? lgTry(function () { return DS.linCanEntomb(s, d.id); }) : null, cf = lgCoffins();
  var body = canE && canE.ok ? 'keep' : 'bury', nat = agNatural(d, ev);      // r6 나이: 천수를 누린 이는 이야기 창부터 조용히
  if (nat && !ev.natSaid) { ev.natSaid = 1; agNaturalStory(d, function () { lgRite(ev, cb, griefs); }); return; }
  A2('mourn', 'lose');
  var o = overlay('<div class="result lgrite' + (nat ? ' nat' : '') + '"></div>', 'modal center rite');
  function cands() { var l = DS.linChoices ? lgTry(function () { return DS.linChoices(s, chId); }) : null; return l instanceof Array ? l : []; }      // 2.2.0: 고를 수 있는 이 — ① 자식 ② 막사의 같은 병과 ③ 다른 가문의 가주 (미성년은 고를 수 없다)
  function cKey(c, i) { return String(c.mid || c.pid || c.kind || '') + ':' + i; }
  // r35 가문이 끊겼을 때: 스무 해 안에 자랄 핏줄 아이 · 글 자리표 · 이름 고르기 상태
  function lpYoung() { var l = DS.linHeirs ? lgTry(function () { return DS.linHeirs(s, chId); }) || [] : []; return l.filter(function (c) { return c.young && c.blood && (c.inY == null || c.inY <= DS.LAPSE.years); })[0] || null; }
  function lpV(x) { var o = { b: d.name, house: LS().hn || DS.houseOf(LS().sur || '') || '가문', y1: ((agCal() || {}).yr || 0) + DS.LAPSE.years }; for (var k in x || {}) o[k] = x[k]; return o; }
  var LPH = { k: 'keep', n: '' };
  function lapsePass() {
    var LT = DS.LAPSE_TXT, yk = lpYoung(), v = lpV();
    if (!LPH.n) { var yp = yk && LS().P[yk.pid]; LPH.n = (yp && yp.n) || lgTry(function () { return DS.pickMercName(s, Math.random); }) || ''; }
    A2('mourn', 'lose');
    story(LT.fall.concat(LT.pass, yk ? LT.kid : LT.stranger).map(function (l) { return lgFill(l, v); }), function () { step = 'lname'; draw(); }, '스무 해');
  }
  function lapseGo() {
    var inp = $('#lpName', o), nm = inp ? DS.rnClean(inp.value) : LPH.n;
    if (!nm || (DS.nameOK && !DS.nameOK(nm))) { A('cancel'); toast('이름은 한글 1~8자입니다'); return; }
    if (DS.CAST_NAME && Object.keys(DS.CAST_NAME).some(function (k) { return DS.CAST_NAME[k] === nm; })) { A('cancel'); toast('이야기 인물의 이름이다. 다른 이름을 고른다'); return; }
    if (body === 'keep' && DS.linEntomb) lgTry(function () { return DS.linEntomb(s, d.id); });
    var res = lgTry(function () { return DS.linLapse(s, chId, { name: nm, house: LPH.k }); });
    if (!res) { var still = DS.linVacant ? DS.linVacant(s).some(function (x) { return x.id === chId; }) : false; if (still && DS.linAutoHeir) lgTry(function () { return DS.linAutoHeir(s, chId); }); }      // 갇히지 않게: 어떤 까닭으로 못 하면 자동 후계
    lgCache = null; if (DS.rebuildParty) lgTry(function () { DS.rebuildParty(); }); U.persist(); o.close();
    if (!res) { if (cb) cb(); return; }
    var LT = DS.LAPSE_TXT, v = lpV({ a: res.name, house: res.old, 'new': res.house, y1: res.y1, n: res.gone }), lines = LT.rise.map(function (l) { return lgFill(l, v); });
    lines.push(lgFill(res.house === res.old ? LT.keep : LT.renew, v));
    if (res.lost) lines.push(LT.cost + ' ' + U.fmtN(res.lost) + '골드.');
    if (res.gone) lines.push(lgFill(LT.gone, v));
    if (res.tickets) lines.push(lgFill(LT.call, { t: res.tickets }));
    A('level');
    story(lines, function () { if (cb) cb(); }, '스무 해 뒤');
  }
  function draw() {
    var box = $('.lgrite', o), H = LGU().heir || {}, C = LGU().coffin || {}, html = '', at = (d.died && d.died.at) || (ev.x && ev.x.at) || '';
    if (step === 'pick' && !cands().length) step = 'lapse';      // r35 · 2.2.0: 고를 이가 아무도 없으면 대가 끊긴다
    if (step === 'mourn') {
      html = '<p class="eyebrow">' + (nat ? esc(AGL().natTitle || '천수') : '추도') + '</p>' + (d.spr ? '<div class="lgdead">' + d.spr + '</div>' : '') + '<h2>' + esc(d.name) + '</h2><p class="rn">' + esc([d.full && d.full.indexOf(d.name) < 0 ? d.full : '', d.role, d.gen ? d.gen + '대' : '', d.ag ? agWord(d.ag) : ''].filter(Boolean).join(', ')) + '</p>' +
        '<p class="ep">' + esc(lgFill(nat ? (LGL().deathNat && LGL().deathNat[0]) || '{a}{이가} 천수를 누리고 잠들었다.' : lgPick(LGL().death) || '{a}, {at}에서 잠들다.', { a: d.name, at: at || '싸움터', house: d.sur })) + '</p>' +
        (d.died && (d.died.why || at) ? '<p class="dim">' + esc([lgWhen(d.died), at, d.died.why].filter(Boolean).join(', ')) + '</p>' : '') + lgMournHtml(d, griefs);
      var twice = (LS().P[d.id] || {}).rv, TW = (GN().rite && GN().rite.twice) || [];
      if (DS.linEntomb && twice) html += '<p class="dim lgtwice">' + TW.map(function (l) { return esc(lgFill(l, { a: d.name })); }).join('<br>') + '</p>';      // 3.3.0: 한 번 돌아온 이는 다시 관에 들지 않는다
      else if (DS.linEntomb) html += '<h5>' + esc(lgFill(C.ask || '{a:을를} 어떻게 보냅니까?', { a: d.name })) + '</h5><div class="seg2" role="group">' +
        '<button data-lgbody="keep"' + (body === 'keep' ? ' aria-pressed="true"' : '') + (canE && canE.ok ? '' : ' disabled') + '><b>' + esc(C.keep || '관에 모신다') + '</b><small>' + esc(canE && canE.ok ? (C.keepNote || '') + (cf ? ' 빈 관 ' + cf.free + '개.' : '') : (canE && canE.why) || C.empty || '빈 관이 없다.') + '</small></button>' +
        '<button data-lgbody="bury"' + (body === 'bury' ? ' aria-pressed="true"' : '') + '><b>' + esc(C.bury || '묻는다') + '</b><small>' + esc(C.buryNote || '') + '</small></button></div>';
      html += '<button class="btn gold wide" data-lgstep="pick">후계를 정한다</button>';
    } else if (step === 'lapse') {      // r35 가문이 끊겼다: 스무 해가 흐르고 새 대장이 옛 깃발을 든다
      var LT = DS.LAPSE_TXT, lost = Math.floor((s.gold || 0) * DS.LAPSE.gold / 10) * 10, yk = lpYoung();
      html = '<p class="eyebrow">가문이 끊겼다</p><h2>이을 사람이 없다</h2><p class="rn">' + esc(d.name) + '의 자리, ' + esc(d.role) + '</p>' +
        '<p class="ep">' + LT.fall.map(function (l) { return esc(lgFill(l, lpV())); }).join('<br>') + '</p>' +
        '<ul class="lgafter"><li>스무 해가 흐른다. 모두 스무 살을 더 먹는다</li><li>깬 시나리오, 깃발과 레벨, 장비, 관은 남는다</li><li>금고의 절반을 잃는다' + (lost ? ' (' + U.fmtN(lost) + '골드)' : '') + '</li><li>빈 깃발은 다시 세워야 한다. 모집권 ' + DS.LAPSE.tickets + '장을 받는다</li>' +
        '<li>' + (yk ? esc(josa(yk.name, '이가')) + ' 자라 뒤를 잇는다' : '새 대장이 옛 깃발을 든다. 이름과 가문 이름을 고른다') + '</li></ul>' +
        '<button class="btn gold wide" data-lgstep="lpass">스무 해를 보낸다</button><button class="btn wide" data-lgstep="mourn">← 추도로</button>';
    } else if (step === 'lname') {
      var hk = LPH.k, gh = DS.GRAND_HOUSES || [], oldN = LS().hn || DS.houseOf(LS().sur || '');
      html = '<p class="eyebrow">새 대장</p><h2>누가 깃발을 드나</h2>' +
        '<label class="fld lpfld"><span>새 대장의 이름 (8자까지)</span><input id="lpName" maxlength="8" value="' + esc(LPH.n) + '" autocomplete="off" enterkeyhint="done"></label>' +
        '<h5>가문 이름</h5><div class="lphouse" role="group"><button data-lphouse="keep"' + (hk === 'keep' ? ' aria-pressed="true"' : '') + '><b>옛 이름을 잇는다</b><small>' + esc(oldN) + '</small></button>' +
        gh.map(function (g) { return '<button data-lphouse="' + esc(g[0]) + '"' + (hk === g[0] ? ' aria-pressed="true"' : '') + '><b>' + esc(DS.houseOf(g[0])) + '</b><small>' + esc(g[1]) + '</small></button>'; }).join('') + '</div>' +
        '<p class="lgwarn">정하면 되돌릴 수 없다.</p><button class="btn gold wide" id="lpYes">깃발을 든다</button>';
    } else if (step === 'pick') {      // 2.2.0: 셋 가운데 고른다 — 자식 · 막사(같은 병과) · 다른 가문(맹주 자리가 그 가문으로)
      var list = cands(), g3 = { 1: [], 2: [], 3: [] };
      list.forEach(function (c, i) { c._k = cKey(c, i); (g3[c.opt] || g3[3]).push(c); });
      html = '<p class="eyebrow">후계</p><h2>맹주가 쓰러졌다. 누가 잇는가</h2><p class="rn">' + esc(d.name) + '의 자리, ' + esc(d.role) + '</p>';
      [[1, '자식'], [2, '막사'], [3, '다른 가문']].forEach(function (x) { var l = g3[x[0]]; if (l.length) html += '<h5 class="lghd">' + x[1] + ' <i>' + l.length + '</i></h5>' + l.map(heirRow).join(''); });
      html += '<button class="btn wide" data-lgstep="mourn">← 추도로</button>';
    } else if (step === 'confirm') {
      var c = pick, kk = lgHeirKind(c), adopt = kk === 'merc', kin = kk === 'kin', ch = s.chars[chId], mvf = c.move && (c.h || c.hf) ? s.chars[c.h || c.hf] : null, own0 = c.cast && DS.CAST_NAME[c.cast] ? DS.CAST_NAME[c.cast] : c.name || '', cst = !!c.cast;
      html = '<p class="eyebrow">' + (c.opt === 3 ? '다른 가문' : c.opt === 2 ? '막사' : adopt ? '입양' : kin ? '먼 친척' : '계승') + '</p>' + (c._spr ? '<div class="lgdead heir">' + c._spr + '</div>' : '') + '<h2>' + esc(c.name || (kin ? '먼 친척' : '')) + '</h2>' +
        '<p class="ep">' + esc(adopt ? (H.adoptAsk || '이 이름을 잇겠는가.') : lgFill(kin ? (H.kinAsk || '{house}의 먼 친척이 {a}의 자리를 잇는다.') : (H.childAsk || '{b:이가} {a}의 자리를 잇는다.'), { a: d.name, b: c.name, house: d.sur ? d.sur + ' 가문' : '가문' })) + '</p>' +
        '<ul class="lgafter"><li>' + esc(mvf ? '맹주 자리가 ' + DS.flagName(mvf.cls) + '으로 간다. 그 가문의 장비와 공훈은 그대로다' : (ch ? DS.flagName(ch.cls) : '맹주의 가문') + '을 그대로 잇는다. 장비와 공훈은 가문에 남는다') + '</li>' + (mvf ? '<li>' + esc((ch ? DS.flagName(ch.cls) : '옛 맹주의 가문') + '은 보통 가문이 된다. ' + oldFate()) + '</li>' : '') +      // 2.1.0: 문패는 옮겨 가지 않는다
          (c.why && !cst ? '<li>' + esc(c.why) + '</li>' : '') +
          (adopt && !mvf ? '<li>' + esc((d.sur ? d.sur + ' ' : '') + '가문의 성을 받는다') + '</li>' : '') + '</ul>' +
          (mvf ? '<h5>호를 고릅니다</h5><div class="seg2 lgho" role="group">' + [['new', own0 + ' 1세'], ['cont', own0 + ' ' + ((d.gen || 1) + 1) + '세']].map(function (x) { return '<button data-lgho="' + x[0] + '"' + (HO.k === x[0] ? ' aria-pressed="true"' : '') + '><b>' + esc(x[1]) + '</b></button>'; }).join('') +
            '<button data-lgho="free"' + (HO.k === 'free' ? ' aria-pressed="true"' : '') + '><b>직접 입력</b></button></div>' + (HO.k === 'free' ? '<input id="lgHoIn" maxlength="10" placeholder="한글 1~6자 (+ N세)" value="' + esc(HO.t || '') + '">' : '') : '') +
        '<p class="lgwarn">' + esc(adopt ? (H.adoptWarn || '되돌릴 수 없다.') : (H.childWarn || '정하면 되돌릴 수 없다.')) + '</p>' +
        '<button class="btn ' + (adopt ? 'red' : 'gold') + ' wide" id="yesHeir" disabled>' + esc(adopt ? (H.adoptYes || '이 이름을 잇는다') : (H.childYes || '잇게 한다')) + '</button><button class="btn wide" data-lgstep="pick">다시 고른다</button>';
    }
    box.innerHTML = html; U.hydrate(box); box.scrollTop = 0;
    var yes = $('#yesHeir', box); if (yes) { lock = performance.now(); setTimeout(function () { if (yes.isConnected) yes.disabled = false; }, 900); }      // 연타가 확인으로 넘어가지 않게 잠깐 잠근다
  }
  // 2.2.0 후계 한 줄: 얼굴 · 이름 · 등급 · 병과 · 레벨 · 전투력 · 무슨 일이 일어나는지 한 문장
  function heirRow(c) {
    var m = c.mid ? mercById(c.mid) : null, ch = s.chars[chId], hf = c.opt === 3 && (c.hf || c.h) ? s.chars[c.hf || c.h] : null;
    if (!m || !ch) return '';
    c._spr = mercSpr(m, 2);
    var cls = hf ? hf.cls : ch.cls, pw = lgTry(function () { return hf ? flagPow(hf, m) : flagPow(ch, m); }) || 0;
    var say = c.opt === 1 ? '맹주가 된다. 선대와의 레벨 차이 일부를 받는다' : c.opt === 2 ? '막사에서 나와 맹주가 된다. 제 레벨 그대로' : '맹주 자리가 이 가문으로 간다. 옛 맹주 가문은 보통 가문이 된다';
    var sub = [c.opt === 1 ? (c.sx === 'f' ? '딸' : '아들') : '', DS.CLASSES[cls] ? (hf ? DS.flagName(hf.cls) + ' 가주' : DS.CLASSES[cls].name) : '', lv(DS.pL(m))].filter(Boolean);
    return '<button class="lgcb lgh k-o' + c.opt + '" data-lgheir="' + esc(c._k) + '">' + c._spr + '<span><span class="lgnm"><b' + (m.g ? ' style="color:' + gcol(m.g) + '"' : '') + '>' + esc(c.name || '') + '</b>' + gbadge(m.g) + '</span><small>' + esc(sub.join(', ')) + '</small><small class="lgsay">' + esc(say) + '</small></span><em class="lgpw">' + pwNum(pw, 'sm') + '<small>전투력</small></em></button>';
  }
  // 옛 맹주 가문은 어떻게 되나 (다른 가문의 가주를 고를 때): 어른 핏줄 → 막사의 같은 병과 → 빈 가문
  function oldFate() {
    var ch = s.chars[chId]; if (!ch) return '';
    var k = (s.mercs || []).filter(function (x) { return x.o === ch.id && !x.h && !x.sb && !x.cast && DS.kidOf && DS.kidOf(s, x); }).sort(function (a, b) { return DS.pL(b) - DS.pL(a) || (b.g || 0) - (a.g || 0) || a.id - b.id; })[0];
    if (k) return josa(k.ttl || k.n || '', '이가') + ' 그 가문의 가주가 된다';
    var b = DS.barracks(s).filter(function (x) { return DS.sbFits(ch, x); }).sort(function (a, b) { return (b.g || 0) - (a.g || 0) || DS.pL(b) - DS.pL(a) || a.id - b.id; })[0];
    if (b) return '막사의 ' + josa(b.n || '', '이가') + ' 그 가문의 가주가 된다';
    return '빈 가문이 되어 레벨과 단을 잃는다';
  }
  function lgCandBtn(c) {
    var kk = lgHeirKind(c), m = c.mid ? mercById(c.mid) : null, all = lgAll(), p = c.pid && all[c.pid];
    c._spr = m ? mercSpr(m, 2) : p ? p.spr : '';
    var sub = [kk === 'kid' || kk === 'adkid' ? (c.sx === 'f' ? '딸' : '아들') + (kk === 'adkid' ? '(입양)' : '') : lgSexTxt(c.sx), m ? DS.mercKind(m) : c.type && DS.MERCS[c.type] ? DS.MERCS[c.type].name : '', kk === 'merc' && c.h && G.save.chars[c.h] ? DS.flagName(G.save.chars[c.h].cls) + ' 가주' : kk === 'merc' && c.o && G.save.chars[c.o] ? DS.flagName(G.save.chars[c.o].cls) + ' 가솔' : '', m ? '공훈 ' + DS.VET[DS.vetRank(m.x || 0)].name : '', c.why || ''].filter(Boolean), hg = m && DS.GRADES[m.g] ? m.g : c.pot || 0;      // r45 ui: 등급은 이름표 하나 (잠재력 별은 등급과 같은 것이라 뺐다)      // 4.0: 후보 줄의 까닭 한 마디 · ⑭ 잠재력
    return '<button class="lgcb k-' + kk + '" data-lgheir="' + esc(c._k) + '">' + (c._spr || '<span class="lgnoq">' + (kk === 'kin' ? '친' : '?') + '</span>') + '<span><b' + (c.g ? ' style="color:' + gcol(c.g) + '"' : '') + '>' + esc(c.name || (kk === 'kin' ? '먼 친척' : '')) + '</b>' + (hg ? ' ' + gbadge(hg) : '') + '<small>' + pills(sub) + '</small></span><i>›</i></button>';
  }
  o.addEventListener('click', function (e) {
    var bb = e.target.closest('[data-lgbody]'); if (bb && !bb.disabled) { body = bb.dataset.lgbody; A('tap'); draw(); return; }
    var lph = e.target.closest('[data-lphouse]'); if (lph) { var ni = $('#lpName', o); if (ni) LPH.n = ni.value; LPH.k = lph.dataset.lphouse; A('tap'); draw(); return; }      // r35
    if (e.target.closest('#lpYes')) { lapseGo(); return; }
    var hob = e.target.closest('[data-lgho]'); if (hob) { var hi = $('#lgHoIn', o), hn0 = $('#lgHnIn', o); if (hi) HO.t = hi.value; if (hn0) HO.hn = hn0.value; HO.k = hob.dataset.lgho; A('tap'); draw(); return; }
    if (e.target.closest('[data-lgmore]')) { more = true; A('tap'); draw(); return; }
    var st = e.target.closest('[data-lgstep]');
    if (st) { var to = st.dataset.lgstep; A('tap'); if (to === 'auto') { finish(null); return; } if (to === 'lpass') { lapsePass(); return; } step = to; draw(); return; }
    var hb = e.target.closest('[data-lgheir]');
    if (hb) { var l = cands(); l.forEach(function (c, i) { c._k = cKey(c, i); }); pick = l.filter(function (c) { return c._k === hb.dataset.lgheir; })[0]; if (pick) { lgCandBtn(pick); A('tap'); step = 'confirm'; draw(); } return; }
    if (e.target.closest('#yesHeir')) { if (performance.now() - lock < 900) return; var hin = $('#lgHoIn', o), hnn = $('#lgHnIn', o); if (hin) HO.t = hin.value; if (hnn) HO.hn = hnn.value; if (pick && pick.move && HO.hn != null && !(DS.linHouseOK && DS.linHouseOK(HO.hn))) { A('cancel'); toast('가문 이름은 한글 1~12자입니다'); return; } if (pick && pick.move && HO.k === 'free' && !(DS.linHoOK && DS.linHoOK(HO.t))) { A('cancel'); toast('호는 한글 1~6자, 끝에 「N세」를 붙일 수 있다'); return; } finish(pick); }
  });
  function finish(c) {
    var kept = false;
    if (body === 'keep' && DS.linEntomb) kept = !!lgTry(function () { return DS.linEntomb(s, d.id); });
    var res = c ? lgTry(function () { return DS.linSucceed(s, chId, c, { ho: HO, house: HO.hn }); }) : (DS.linAutoHeir ? lgTry(function () { return DS.linAutoHeir(s, chId); }) : null);
    if (c && !res) {      // 이미 자리가 찼거나(안전망·다른 탭) 후보가 사라졌으면 갇히지 않게 닫고 넘어간다 (3.2.2)
      var still = DS.linVacant ? DS.linVacant(s).some(function (x) { return x.id === chId; }) : true;
      A('cancel'); if (still) { toast('정할 수 없다. 다른 후보를 고른다'); step = 'pick'; pick = null; draw(); return; }
      toast('이 자리는 이미 이어졌다'); lgCache = null; o.close(); if (cb) cb(); return;
    }
    lgCache = null; if (DS.rebuildParty) lgTry(function () { DS.rebuildParty(); }); U.persist(); o.close();
    var H = LGL(), kk = c ? lgHeirKind(c) : 'kin', ch = s.chars[s.hero] || s.chars[chId], heir = ch ? DS.charName(ch) : (c && c.name) || '';      // 4.0 ⑬: 가문이 옮겨 가면 대장의 깃발이 바뀐다
    // 글 자리표: {a} = 자리를 잇는 이, {b} = 떠난 이 (lore.js heir·adopt·kin). 관·무덤 글은 {a} = 떠난 이 — 3.2.1: 둘이 뒤바뀌어 「고인이 후계의 깃발을 이었다」로 나오던 것
    var hn = c && c.kind !== 'kin' && c.name ? c.name : ((ch && DS.fullName ? lgTry(function () { return DS.fullName(ch, s); }) : '') || heir);
    var v = { a: hn, b: d.name, heir: heir, house: d.sur ? d.sur + ' 가문' : '가문', at: (d.died && d.died.at) || '' }, vd = { a: d.name, house: v.house, at: v.at }, C = LGU().coffin || {};
    var lines = [];
    if (DS.linEntomb) lines.push(lgFill(lgPick(kept ? (LGL().coffin || C.keepLine) : C.buryLine) || '', vd));
    var sbE = c && c.sb && res instanceof Array ? res.filter(function (e) { return e.t === 'heir' && e.sb && e.ev; })[0] : null;
    lines.push(sbE ? DS.linEvText(s, sbE.ev) : lgFill(lgPick(kk === 'merc' ? H.adopt : kk === 'kin' ? H.kin : H.heir) || '{a}, {b}의 뒤를 잇다.', v));      // 2.2.0: 막사의 같은 병과가 이었다
    if (heir && c && c.name && heir !== c.name) lines.push(lgFill(LGU().heirName || '이제 {b:은는} {heir:으로} 불린다.', { b: c.name, heir: heir }));
    lines.push(lgFill(lgPick(H.will) || '', v));
    A(kk === 'merc' ? 'holy' : 'level');
    story(lines.filter(Boolean), function () { if (cb) cb(); nfLater({ k: 'c', id: s.hero }, '새 대장, 처음 이름 정하기 (무료)'); }, kk === 'merc' ? '입양' : kk === 'kin' ? '먼 친척' : '계승');      // r32: 새 대장의 이름을 값없이 (의식이 다 끝나고 창이 걷힌 뒤)
  }
  draw();
  return o;
}
// ── 지휘관이 아닌 이(용병·아이)가 잠들었을 때: 한 장에 모아 추도, 관이 있으면 하나씩 모실 수 있다
// r32: 다른 창이 모두 닫히고 싸움이 아닐 때 이름 짓기 창을 띄운다 (1초마다 살피고 20초가 지나면 그만 — 사람 창의 ★ 단추는 남는다)
function nfLater(ref, head, n) {
  n = n || 0; if (n > 20 || !DS.nfAsk) return;
  setTimeout(function () { if (document.querySelector('#app .ov') || busy() || G.riteBusy) { nfLater(ref, head, n + 1); return; } DS.nfAsk(ref, null, head); }, n ? 1000 : 500);
}
function lgMournOthers(evs, cb, griefs) {
  var all = lgAll(), ds = evs.map(function (e) { return all[e.a]; }).filter(Boolean); if (!ds.length) { if (cb) cb(); return; }
  var C = LGU().coffin || {}, kept = {};
  A2('mourn', 'lose');
  var o = overlay('<div class="result lgrite lgothers"></div>', 'modal center rite');
  function draw() {
    var natAll = ds.every(function (d) { return agNatural(d); });
    var html = '<p class="eyebrow">' + (natAll ? esc(AGL().natTitle || '천수') : '추도') + '</p><h2>' + (ds.length > 1 ? '잠든 이 ' + ds.length + '명' : esc(ds[0].name)) + '</h2>' + (natAll && ds.length === 1 ? '<p class="ep">' + esc(lgFill((LGL().deathNat && LGL().deathNat[0]) || '{a}{이가} 천수를 누리고 잠들었다.', { a: ds[0].name })) + '</p>' : '');
    ds.forEach(function (d) {
      var can = DS.linEntomb && DS.linCanEntomb ? lgTry(function () { return DS.linCanEntomb(G.save, d.id); }) : null;
      html += '<div class="lgod">' + (d.spr ? '<div class="lgdead">' + d.spr + '</div>' : '') + '<span><b>' + esc(d.name) + '</b><small>' + esc([d.full, d.role, d.ag ? agWord(d.ag) : '', lgDiedTxt(d)].filter(Boolean).join(', ')) + '</small></span>' +
        (kept[d.id] ? '<em class="why">관에 모심</em>' : can && can.ok ? '<button class="btn small" data-lgkeep="' + esc(d.id) + '">' + esc(C.keep || '관에 모신다') + '</button>' : '') + '</div>' +
        ((LS().P[d.id] || {}).rv ? '<p class="dim lgtwice">' + ((GN().rite && GN().rite.twice) || []).map(function (l) { return esc(lgFill(l, { a: d.name })); }).join('<br>') + '</p>' : '') + lgMournHtml(d, griefs);
    });
    html += '<button class="btn gold wide" data-close>' + esc(LGU().farewell || '보낸다') + '</button>';
    var box = $('.lgrite', o); box.innerHTML = html; U.hydrate(box);
  }
  o.addEventListener('click', function (e) { var k = e.target.closest('[data-lgkeep]'); if (!k) return; if (lgTry(function () { return DS.linEntomb(G.save, k.dataset.lgkeep); })) { kept[k.dataset.lgkeep] = 1; lgCache = null; A('holy'); U.persist(); } else { A('cancel'); toast((LGU().coffin || {}).empty || '모실 수 없다'); } draw(); });
  o.onclose = function () { if (cb) cb(); };
  draw();
}
// ── 대기열: game.js 가 쌓은 G.lineageQ 를 DS.lineageFlush 가 넘긴다. 잠든 지휘관 → 다른 잠든 이 → 출생 순서로, 하나씩 닫힐 때마다 다음
DS.openLineageRite = function (queue, done) {
  var q = (queue || []).filter(Boolean), s = G.save, steps = [], rites = [], other = [], births = [], griefs = [], adults = [], elders = [], mnats = [], seenR = {};
  lgCache = null;
  q.forEach(function (e) {
    if (e.t === 'rite' && e.ch && s.chars[e.ch] && s.chars[e.ch].vac && !seenR[e.ch]) { seenR[e.ch] = 1; rites.push(e); }
    else if (e.t === 'death' && e.k !== 'c') other.push(e);
    else if (e.t === 'birth') births.push(e);
    else if (e.t === 'grief') griefs.push(e);
    else if (e.t === 'adult') adults.push(e);      // r6 나이: 성년
    else if (e.t === 'elder') elders.push(e);      // r6 나이: 노년
    else if (e.t === 'mnat') mnats.push(e);      // r6 나이: 가계도 밖 용병의 천수
  });
  (DS.linVacant ? lgTry(function () { return DS.linVacant(s); }) || [] : []).forEach(function (ch) { if (!seenR[ch.id] && ch.vac) { seenR[ch.id] = 1; rites.push({ t: 'rite', ch: ch.id, a: ch.vac.pid }); } });      // 대기열에 없던 빈자리도 (저장을 불러온 뒤 등)
  rites.forEach(function (e) { steps.push(function (next) { lgRite(e, next, griefs); }); });
  if (other.length) steps.push(function (next) { lgMournOthers(other, next, griefs); });
  if (births.length) steps.push(function (next) { lgBirthShow(births, next); });
  if (adults.length || elders.length || mnats.length) steps.push(function (next) { agComingShow(adults, elders, next, mnats); });
  (function run() { var f = steps.shift(); if (!f) { lgCache = null; if (done) done(); return; } f(run); })();
};
// r8 menus (newbie 하): 가주의 자리가 이어지면 선택도 가주에게. 의식(lgRite) 안은 건드리지 않고, 의식 사슬이 모두 닫힌 뒤에 한 번 — 부른 쪽(game.js)의 rebuildParty·enterZone 이 G.sel 을 그대로 잇는다
(function () {
  var open = DS.openLineageRite; if (!open) return;
  DS.openLineageRite = function (queue, done) {
    var s = G.save, h0 = s && s.chars[s.hero], gone = !!(h0 && (h0.vac || h0.down));
    return open(queue, function () {
      var h = s.chars[s.hero], id = 'c' + s.hero;
      if (gone && h && !h.vac && !h.down && s.party.indexOf(s.hero) >= 0 && G.sel !== id) {
        if (G.scn) G.sel = id;      // 시나리오 뒤: 곧 필드로 돌아가며 부대를 다시 놓는다
        else if (G.sim && !G.sim.combat && G.sim.byId[id] && DS.rebuildParty) { G.sel = id; DS.rebuildParty(); }
      }
      if (done) done();
    });
  };
})();
// ── 관: 열 칸. 산 관 수만큼 빈 관, 모신 이(이름·병과·레벨·사인·모신 날), 부르기
function lgCofName(c) { return c.name || c.ttl || DS.snName(c.sn, c.n) || '이름 없음'; }
function lgCofRole(c) { var sn = c.snap || {}, cls = c.cls && DS.CLASSES[c.cls], M = (c.type || sn.type) && DS.MERCS[c.type || sn.type]; c = { L: c.L, g: c.g || sn.g }; return cls ? cls.name + (c.L ? ', ' + lvS(c.L) : '') : M ? (c.g && DS.GRADES[c.g] ? DS.GRADES[c.g].name + ' ' : '') + M.name : ''; }
function lgCofSpr(c) { var sn = c.snap || {}; return lgTry(function () { return lgSpr(c, null, null, c.cls, sn.type, sn.g, c.L); }) || ''; }
function GN() { return (LORE().gen) || {}; }
function lgCoffinHtml() {
  var cf = lgCoffins(), C = LGU().coffin || {}; if (!cf) return '';
  var g = GN(), cofH = (g.cof && g.cof.head) || [C.listHint || ''], late = DS.egCallOpen && DS.egCallOpen(G.save) && G.save.eg.call.late;
  var html = '<p class="hint">' + cofH.map(esc).join('<br>') + '</p>' + (late ? '<div class="row lgbuy"><div class="tx"><b>' + esc((g.late && g.late.title) || '밀린 새벽') + '</b><small>' + esc(((g.late && g.late.lines) || [])[1] || '') + '</small></div><button class="btn small gold" data-eg="late">' + esc((g.late && g.late.go) || '관으로') + '</button></div>' : '') + lgBuyRow(cf) + '<div class="lgcof">';
  for (var i = 0; i < cf.max; i++) {
    var c = cf.list[i];
    if (!c && i >= cf.have) { html += '<div class="cofs none unbought"><i class="lid"></i><span class="tx"><b>' + (cf.max - i) + '자리 더 마련한다</b></span></div>'; break; }
    if (!c) { html += '<div class="cofs none"><i class="lid"></i><span class="tx"><b>' + esc(C.emptySlot || '빈 관') + '</b></span></div>'; continue; }
    var d = c, pr = DS.egCallP ? lgTry(function () { return DS.egCallP(G.save, c); }) : null;
    html += '<div class="cofs"><i class="lid on' + (c.tr ? ' tr' : '') + '"></i><span class="tx"><b>' + esc(lgCofName(c)) + '</b><small>' + esc([c.ttl && c.n ? DS.snName(c.sn, c.n) : '', lgSexTxt(c.sx), lgCofRole(c), c.gen ? c.gen + '대' : ''].filter(Boolean).join(', ')) + '</small><small class="dd">' + esc([c.age != null ? '향년 ' + c.age : '', d.why, d.at, lgWhen(d)].filter(Boolean).join(', ')) + '</small>' + lwLine(c.lw || ((LS().P[c.pid] || {}).lw)) +
      (pr != null ? '<small class="egp2">' + esc((c.tr ? ((g.call && g.call.crack) || '뚜껑에 금') + ', ' : '') + pr + '%') + '</small>' : '') + '</span>' +
      '<div class="btns">' + (c.pid && lgP(c.pid) ? '<button class="btn small" data-lgp="' + esc(c.pid) + '">가계도</button>' : '') + '<button class="btn small" data-lgbury="' + i + '">' + esc((g.cof && g.cof.bury) || '묻는다') + '</button></div></div>';
  }
  return html + '</div>';
}
function lgBuyRow(cf) {
  var C = LGU().coffin || {}, town = lgInTown();
  return '<div class="row lgbuy"><div class="tx"><b>' + esc(C.buy || '관') + ' <i class="own">' + cf.have + ' / ' + cf.max + ', 모신 이 ' + cf.used + '</i></b><small>' + esc(G.zone && G.zone.town ? (C.buyNote || '마을 교회에서 마련합니다.') : town ? '마을 일에서 어디서나 마련한다.' : '싸우는 동안에는 살 수 없다.') + '</small></div>' +
    (cf.have >= cf.max ? '<span class="why">가득</span>' : town ? '<button class="btn small gold" data-lgbuy="1">' + coin(cf.price || 0) + '</button>' : '') + '</div>';
}
function lgCoffinClick(e, o) {
  var b = e.target.closest('[data-lgbuy]'), r = e.target.closest('[data-lgbury]');
  if (b) {
    var cf = lgCoffins(); if (!cf) return true;
    if (!lgInTown()) { A('cancel'); toast(DS.townWorkWhy()); return true; }
    if (G.save.gold < (cf.price || 0)) { A('cancel'); toast('골드가 모자랍니다'); return true; }
    var ok = lgTry(function () { return DS.buyCoffin(G.save); });
    if (!ok) { A('cancel'); toast(cf.have >= cf.max ? '관은 ' + cf.max + '개까지입니다' : '관을 살 수 없다'); } else { A('coin'); U.persist(); toast('관을 마련했다 (' + (cf.have + 1) + ' / ' + cf.max + ')'); o.draw(); }
    return true;
  }
  if (r) { A('tap'); lgBury(+r.dataset.lgbury, o); return true; }
  return false;
}
// 3.3.0: 관의 한 사람을 묻는다 (1만 골드 부활 자리) — 되돌릴 수 없다. 0.9초 잠금
function lgBury(i, parent) {
  var cf = lgCoffins(), c = cf && cf.list[i]; if (!c) return;
  if (DS.egPassOn && DS.egPassOn(G.save)) { A('cancel'); toast('스무 해 창에서 묻는다'); return; }
  var g = GN().cof || {}, nm = lgCofName(c), spr = lgCofSpr(c);
  var q = overlay('<div class="result lgev revive"><p class="eyebrow">관</p>' + (spr ? '<div class="lgdead">' + spr + '</div>' : '') + '<h2>' + esc(lgFill(g.buryAsk || '{a:을를} 묻는다', { a: nm })) + '</h2><p class="rn">' + esc(lgCofRole(c)) + '</p>' +
    '<p class="dim">' + esc(g.buryNote || '이름은 깃대에 남는다. 되돌릴 수 없다.') + '</p><button class="btn red wide" id="yesBury" disabled>' + esc(g.bury || '묻는다') + '</button><button class="btn wide" data-close>' + esc(g.buryNo || '취소') + '</button></div>', 'modal center rite');
  var y = $('#yesBury', q), at = performance.now();
  setTimeout(function () { if (y.isConnected) y.disabled = false; }, 900);
  y.addEventListener('click', function () {
    if (performance.now() - at < 900) return;
    var list = lgCoffins().list, k = list.indexOf(c); q.close(); if (k < 0) return;
    lgTry(function () { return DS.linBury(G.save, k); }); lgCache = null; U.persist(); A('cancel');
    if (parent && parent.isConnected && parent.draw) parent.draw();
  });
}
// ── 들머리들
function lgPartyRow() {      // 부대 탭 맨 위
  var all = lgAll(), ids = Object.keys(all), live = ids.filter(function (k) { return all[k].alive; }).length, cf = lgCoffins(), ev = lgEvents(), last = ev.length ? ev[ev.length - 1] : null;
  return '<div class="row lgentry"><div class="tx"><b>가계도 <i class="own">' + live + '명' + (ids.length > live ? ', 잠든 이 ' + (ids.length - live) : '') + (cf && cf.have ? ', 관 ' + cf.used + '/' + cf.have : '') + '</i></b><small>' + esc(last ? last.text || '' : '혼인, 출생, 후계가 가계도에 남는다') + '</small></div><button class="btn small gold" data-lgmenu="1">보기</button></div>';
}
function lgChurchRow() {      // 교회
  var cf = lgCoffins(); if (!cf || !lgOn()) return '';
  var C = LGU().coffin || {};
  return '<h4>관</h4><div class="row lgbuy"><i class="lid cofi"></i><div class="tx"><b>' + esc(C.buy || '관') + ' <i class="own">' + cf.have + ' / ' + cf.max + (cf.used ? ', 모신 이 ' + cf.used : '') + '</i></b><small>' + esc(C.churchNote || C.listHint || '') + '</small></div>' +
    '<div class="btns">' + (cf.have < cf.max ? '<button class="btn small gold" data-lgbuy="1">' + coin(cf.price || 0) + '</button>' : '<span class="why">가득</span>') + '<button class="btn small" data-lgcof="1">관 보기</button></div></div>';
}
function lgChurchClick(e, o) { if (e.target.closest('[data-lgcof]')) { A('tap'); DS.openLineage('coffin', null, o); return true; } return lgCoffinClick(e, o); }
// 결과 창: 이번 판의 가문 소식 (G.lineageQ — 창이 닫힌 뒤 의식이 이어진다)
function lgResultRows() {
  var q = (G.lineageQ || []).filter(Boolean); if (!q.length || !lgOn()) return '';
  var all = lgAll(), html = '', dead = [], born = [];
  var griefs = q.filter(function (e) { return e.t === 'grief'; });
  q.forEach(function (e) { var p = all[e.a]; if (!p) return; if (e.t === 'death') dead.push(p); else if (e.t === 'birth') born.push(p); });
  if (!dead.length && !born.length) return '';
  html += '<h5>가문</h5><ul class="loot lgres">';
  dead.forEach(function (p) {
    var ms = lgMourners(p, griefs), m0 = ms[0], g = (LGU().griefLine || {})[m0 ? m0.rel : ''] || '';
    html += '<li class="lost"><b>' + esc(p.name) + '</b>, 잠들었다.' + (p.kind === 'ch' ? ' 창을 닫으면 후계를 정합니다.' : '') + (g ? '<br><small>' + esc(lgFill(g, { a: m0.p.name, b: p.name })) + '</small>' : '') + '</li>';
  });
  born.forEach(function (p) { html += '<li class="hl born"><b>' + esc(p.name) + '</b>, 태어났다.</li>'; });
  return html + '</ul>';
}

// ── 전장 머리 위 슬픔: 가족이 쓰러지면 곁의 가족이 한마디 (설계서의 grief 사건 {a 슬퍼하는 이, b 고인, rel})
//   game.js 를 고치지 않으려고 DS.linMercDied·DS.linSettle 이 돌려주는 사건을 받아 띄운다 (돌려주는 값은 그대로).
DS.lgGriefFloat = function (evs) {
  var sim = G.sim, v = G.view, s = G.save; if (!sim || !v || !v.float || !LS()) return;
  var P = LS().P, n = 0;
  (evs || []).forEach(function (e) {
    if (!e || e.t !== 'grief' || n >= 2) return;
    var q = P[e.a], d = P[e.b]; if (!q || !d) return;
    var u = sim.units.filter(function (x) { return !x.dead && x.side === 'ally' && ((q.c && x.role === 'cmd' && x.ch === q.c) || (q.m && x.mid === q.m)); })[0]; if (!u) return;
    var t = lgGriefSay(e.rel, d.sx); if (!t) return;
    v.float(u.x, u.y, t, '#cfc6e6', { dy: -22, life: 2.6, delay: 1.1 + n * 0.8 }); n++;
  });
};
(function () {
  ['linMercDied', 'linSettle'].forEach(function (k) {
    var f = DS[k]; if (typeof f !== 'function' || f.lgWrap) return;
    var w = function () { var r = f.apply(this, arguments); try { if (r instanceof Array) DS.lgGriefFloat(r); } catch (x) {} return r; };
    w.lgWrap = 1; DS[k] = w;
  });
})();

// ───────── r6 나이 (age_ui): 나이·노년 표식·세계 달력·자연사·성년·생일 알림 ─────────
// 규칙과 저장은 age 팀(teams6/age, 설계서 r6/age_spec.md)의 save.cal·DS.calNow·DS.ageLife·DS.ageOf·DS.ageMood 가 맡는다.
// 여기서는 읽어서 보여 주기만 한다. 함수가 없으면 나이 글자도 달력도 나오지 않는다 (3.0.0 그대로).
function AGL() { return LGU().age || {}; }      // DS.LORE.lineage.ui.age — 화면 전용 글
function agOn() { return !!(G.save && DS.ageLife && DS.calNow); }
// 한 사람(지휘관·용병·가계도 사람 P·관 기록)의 나이: { y, ls, left, stage: 'young'|'adult'|'elder', old, young, dead }
function agInfo(ent) {
  if (!ent || !agOn()) return null;
  if (ent.st && ent.st !== 'live' && ent.st !== 'young' && ent.age != null) return { y: ent.age, dead: true };      // 숨진 이: 그 나이로 멈춘다
  var r = lgTry(function () { return DS.ageLife(G.save, ent); });
  if (!r || r.age == null || isNaN(r.age)) return null;
  var st = r.stage || (DS.ageStage ? lgTry(function () { return DS.ageStage(G.save, ent); }) : '') || 'adult';
  return { y: Math.max(0, Math.floor(r.age)), ls: r.ls, left: r.left, stage: st, old: st === 'elder', young: st === 'young' };
}
// 짧은 표기: 「34세」(노년이면 은빛), 미성년은 「7살」, 숨진 이는 「향년 71」
function agWord(a) { return !a ? '' : a.dead ? '향년 ' + a.y : a.y + '살'; }
function agTag(ent) {      // r16 person: 「31살」 + 노년 · 어린 · 장수 꼬리표 (정해진 수명은 보이지 않는다)
  var a = agInfo(ent); if (!a) return '';
  var lg = !a.dead && DS.ageLong && lgTry(function () { return DS.ageLong(ent, G.save); });
  return ' <i class="agt' + (a.old ? ' old' : '') + (a.young ? ' yg' : '') + '"' + (a.old ? ' title="' + esc(AGL().elderTitle || '노년') + '"' : '') + '>' + agWord(a) + '</i>' +
    (a.old && !a.dead ? '<i class="agk old">' + esc(AGL().elderWord || '노년') + '</i>' : '') + (a.young ? '<i class="agk yg">' + esc(pst('young', '어린')) + '</i>' : '') + (lg ? '<i class="agk lg">' + esc(pst('long', '장수')) + '</i>' : '');
}
function agTxt(ent) { var a = agInfo(ent); return a ? agWord(a) + (a.old ? ', ' + (AGL().elderWord || '노년') : '') : ''; }
// 지휘관 창·용병 정보의 한 줄: 나이 · 단계 (남은 해는 숫자로 보이지 않는다 — 사람마다 다르고, 노년이 신호다)
function agRow(ent) {
  var a = agInfo(ent); if (!a) return '';
  var M = DS.ageMood ? lgTry(function () { return DS.ageMood(G.save, ent); }) : null, W = AGL();
  return '<div class="row agrow' + (a.old ? ' old' : '') + '"><div class="tx"><b>나이 <span class="num">' + a.y + '</span>' + (a.old ? ' <i class="agt old">' + esc(W.elderWord || '노년') + '</i>' : '') + '</b>' +
    (a.old ? '<small class="fx2"><i class="fxt dn">공격, 마공 ×' + (DS.AGE && DS.AGE.elderMul || 1) + '</i>' + (M && M.name ? '<i class="tg">' + esc(M.name) + '</i>' : '') + '<i class="tg">후계 준비</i></small>' : a.young ? '<small class="fx2"><i class="tg">15살에 가문원으로</i></small>' : '') + '</div></div>';
}
// 세계 달력 한 줄 (부대 탭 맨 위·가문 창): 「3년 가을」
var AG_SEASON = ['봄', '여름', '가을', '겨울'];
function agCal() { if (!agOn()) return null; var c = lgTry(function () { return DS.calNow(G.save); }); return c && c.yr != null ? c : null; }
function agCalText(c) { c = c || agCal(); if (!c) return ''; return (AGL().calName || '가문력') + ' ' + (c.text || c.yr + '년 ' + (c.sname || AG_SEASON[c.season] || '')); }
function agCalRow() {
  var c = agCal(); if (!c) return '';
  var s = G.save, party = s.party.map(function (id) { return s.chars[id]; }).filter(Boolean), old = DS.charList(s).filter(function (ch) { var a = agInfo(ch); return a && a.old; });
  return '<div class="agcal s' + (c.season | 0) + '"><i class="sea" aria-hidden="true"></i><span><b>' + esc(agCalText(c)) + '</b><small>' + esc(old.length ? (AGL().elderCount || '노년에 든 이') + ' ' + old.map(function (ch) { return DS.charName(ch); }).join(', ') : (AGL().calHint || '모두 함께 한 해씩 나이를 먹는다.')) + '</small></span></div>';
}
// 지휘관 칩(전장 위쪽 초상): game.js 를 고치지 않고, 칩이 다시 그려질 때마다 나이 글자를 붙인다
function agChips() {
  var box = $('#chips'); if (!box || !agOn()) return;
  U.$$('.chip[data-u]', box).forEach(function (el) {
    var id = +String(el.dataset.u).slice(1), ch = G.save.chars[id], bm = ch && id !== G.save.hero && DS.bearer ? lgTry(function () { return DS.bearer(G.save, ch); }) : null, a = ch ? agInfo(bm || ch) : null, t = $('.agc', el);
    if (!a) { if (t) t.remove(); return; }      // 4.0.6: 모든 칩에 가주의 나이 (사용자 「다른 친구들도 나이는 적어줘」)
    if (!t) { t = document.createElement('i'); t.className = 'agc'; el.appendChild(t); }
    var w = a.y + '살'; if (t.textContent !== w) t.textContent = w;
    t.classList.toggle('old', !!a.old);
  });
}
// 생일·새해: 실시간으로 나이가 오르면 짧게 (저장 칸 없음 — 처음 본 나이를 기억해 두고 견준다)
var agSeen = null, agYear = null;
function agTick() {
  if (!agOn() || !G.save || !G.save.chars) return;
  var s = G.save, c = agCal(), now = {}, ups = [], W = AGL();
  DS.charList(s).forEach(function (ch) { var a = agInfo(ch); if (a) now[ch.id] = a.y; });
  if (!agSeen || agSeen.save !== s) { agSeen = { save: s, ages: now }; agYear = c ? c.yr : null; return; }
  if ($('.ov') || (G.sim && G.sim.combat)) return;      // 창이 열려 있거나 싸우는 중이면 다음에 알린다 (기억은 그대로)
  for (var id in now) if (agSeen.ages[id] != null && now[id] > agSeen.ages[id] && s.party.indexOf(+id) >= 0) ups.push(DS.charName(s.chars[id]) + ' ' + now[id] + '세');
  var newYear = c && agYear != null && c.yr > agYear;
  var inTown = !!(G.zone && G.zone.town && !G.scn);      // r8 hud: 새해 띠는 마을에 들어섰을 때 한 번(들판·자동 사냥 중에는 미룬다), 생일 토스트는 뺐다(쓰러진 주인공에게도 뜨던 것)
  agSeen.ages = now; if (c && inTown) agYear = c.yr;
  if (newYear && inTown && U.banner) U.banner(agCalText(c), lgPick(W.newYear) || '한 해가 지났다', 2600);
}
// r35 위 띠의 달력: 지역 이름 옆에 「23년 가을」과 계절 그림 (「가문력」은 소리 읽기·풀이 글에). 계절·해가 바뀌면 그 자리에서 짧게 알린다
//   알림은 60초에 한 번까지, 창이 열려 있으면 미룬다. 움직임 줄이기면 움직이지 않고 나타났다 사라진다. 마을의 새해 띠(agTick)와 겹치면 띠에 맡긴다
var hcSeen = null, hcLast = 0, hcWait = null;
function hudCal() {
  var el = document.getElementById('zCal'); if (!el) return;
  var c = G.save && G.zone ? agCal() : null;
  if (!c) { if (!el.hidden) el.hidden = true; return; }
  var key = c.yr + ':' + c.season, nm = AGL().calName || '가문력';
  if (el.hidden) el.hidden = false;
  if (el.dataset.k !== key) {
    el.dataset.k = key; el.className = 'zcal s' + (c.season | 0);
    $('.zct', el).innerHTML = '<span class="zcy">' + esc(nm) + ' </span>' + c.yr + '년 ' + esc(c.sname || AG_SEASON[c.season] || '');
    el.setAttribute('aria-label', nm + ' ' + c.yr + '년 ' + (c.sname || '')); el.title = nm + ' ' + c.yr + '년 ' + (c.sname || '');
  }
  var nmEl = document.getElementById('zName'), zl = el.parentNode;      // 지역 이름이 잘리면 글은 접고 계절 그림만 (이름이 먼저다)
  if (nmEl && zl && zl.clientWidth) { if (!el.classList.contains('tight')) el._w = el.offsetWidth; var tight = nmEl.scrollWidth + (el._w || 0) + 6 > zl.clientWidth + 0.5; if (tight !== el.classList.contains('tight')) el.classList.toggle('tight', tight); }
  if (!hcSeen || hcSeen.save !== G.save) { hcSeen = { save: G.save, yr: c.yr, se: c.season }; hcWait = null; return; }
  if (hcSeen.yr !== c.yr || hcSeen.se !== c.season) {
    var jump = (c.yr - hcSeen.yr) * 4 + (c.season - hcSeen.se), ny = c.yr > hcSeen.yr;
    hcSeen.yr = c.yr; hcSeen.se = c.season;
    if (jump <= 0 || jump > 4) { hcWait = null; return; }      // 달력이 뒤로 갔거나(저장을 바꿔 끼움) 한꺼번에 흘렀다(스무 해 — 이야기가 이미 말했다): 알리지 않는다
    hcWait = { yr: c.yr, ny: ny || !!(hcWait && hcWait.ny), sname: c.sname || AG_SEASON[c.season] || '', season: c.season };
  }
  if (!hcWait) return;
  var now = Date.now(), inTown = !!(G.zone && G.zone.town && !G.scn);
  if ($('.ov') || now - hcLast < 60000) return;
  var w = hcWait; hcWait = null;
  if (w.ny && inTown) return;      // 마을의 새해는 agTick 의 띠가 알린다
  hcLast = now; hudCalToast(w.ny ? '새해, ' + nm + ' ' + w.yr + '년' : josaW(w.sname) + ' 왔다', w.season);
}
function josaW(w) { return josa(w, '이가'); }
function hudCalToast(t, season) {
  var el = document.getElementById('zCal'), top = document.getElementById('top'); if (!el || !top) return;
  var old = document.getElementById('calToast'); if (old) old.remove();
  var b = document.createElement('div'); b.id = 'calToast'; b.className = 'caltoast s' + (season | 0) + (DS.calmFx && DS.calmFx() ? ' calm' : ''); b.setAttribute('role', 'status');
  b.innerHTML = '<i class="sea" aria-hidden="true"></i><span>' + esc(t) + '</span>';
  top.appendChild(b); el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip');
  setTimeout(function () { if (b.parentNode) b.remove(); el.classList.remove('flip'); }, 3200);
}
DS.hudCal = hudCal; DS.hudCalToast = hudCalToast;
setInterval(function () { try { hudCal(); } catch (x) {} }, 1000);
(function () {
  if (typeof MutationObserver === 'function') {
    var on = function () { var box = document.getElementById('chips'); if (!box) return false; new MutationObserver(function () { try { agChips(); } catch (x) {} }).observe(box, { childList: true }); return true; };
    if (!on()) document.addEventListener('DOMContentLoaded', on);
  }
  setInterval(function () { try { agChips(); agTick(); wedTipTick(); } catch (x) {} }, 5000);      // r16 person: 혼인 안내 띠
})();
// ── 자연사·성년·노년 연출 (DS.openLineageRite 가 대기열에서 부른다)
// game.js 의 lineageFlush 가 나이 소식(adult·elder·mnat·adultWait)을 따로 넘긴다 — 후계 의식 등 다른 창이 모두 닫힌 뒤 한 장으로 띄운다
var agNewsQ = [], agNewsT = 0;
DS.openAgeNews = function (list) {
  agNewsQ = agNewsQ.concat((list || []).filter(Boolean));
  if (agNewsT) return;
  agNewsT = setInterval(function () {
    if (!agNewsQ.length) { clearInterval(agNewsT); agNewsT = 0; return; }
    if ($('.ov') || (G.sim && G.sim.combat)) return;
    var q = agNewsQ; agNewsQ = []; clearInterval(agNewsT); agNewsT = 0; lgCache = null;
    agComingShow(q.filter(function (e) { return e.t === 'adult'; }), q.filter(function (e) { return e.t === 'elder'; }), null, q.filter(function (e) { return e.t === 'mnat' || e.t === 'adultWait'; }));
  }, 500);
};
function agNatural(d, ev) { var r = LS() && LS().P[d.id]; return !!((ev && ev.nat) || (d.died && /천수/.test(d.died.why || '')) || (r && r.d && /천수/.test(r.d.why || ''))); }
function agNaturalStory(d, cb) {      // 「○○이 천수를 누리고 잠들었다」 — 후계 의식 앞에, 조용히
  var a = agInfo(LS().P[d.id] || {}) || {}, L = LORE().lineage || {}, W = AGL();
  var NL = L.deathNat || [], lines = [lgFill(lgPick(NL.slice(1)) || NL[0] || '{a}{이가} 천수를 누리고 잠들었다.', { a: d.name, at: (d.died && d.died.at) || '' })];
  if (a.y) lines.push(lgFill(W.natAge || '향년 {n}. 오래 걸었다.', { n: a.y }));
  A2('mourn', 'lose');
  story(lines, cb, W.natTitle || '천수');
}
function agComingShow(adults, elders, cb, mnats) {
  mnats = mnats || [];
  var all = lgAll(), W = AGL(), L = LORE().lineage || {};
  var ad = adults.map(function (e) { return all[e.a]; }).filter(Boolean), el = elders.map(function (e) { return all[e.a]; }).filter(function (p) { return p && p.alive; });      // 같은 때에 숨진 이는 노년 줄에서 뺀다
  if (!ad.length && !el.length && !mnats.length) { if (cb) cb(); return; }      // (mnats 에는 adultWait 도 섞여 온다)
  A2('birth', 'level');
  var html = '<div class="result lgev agev"><p class="eyebrow">' + esc(W.timeTitle || '세월') + '</p>' + (!ad.length && !el.length ? '<h2>' + esc(W.mnatTitle || '오래 함께한 이들이 잠들었다') + '</h2>' : '');
  if (ad.length) {
    html += '<h2>' + esc(ad.length > 1 ? '아이 ' + ad.length + '명이 성년이 되었다' : josa(ad[0].name, '이가') + ' 성년이 되었다') + '</h2><p>' + esc(lgFill(lgPick((L.adult || []).slice(1)) || '', { a: ad[0].name })) + '</p>';
    ad.forEach(function (k) { html += '<div class="lgod">' + (k.spr || '') + '<span><b>' + esc(k.name) + (k.full && k.full !== k.name ? ' <i class="own">' + esc(k.full) + '</i>' : '') + '</b><small>' + esc([lgSexTxt(k.sx), k.role, agTxt(k.ref ? k.m || k : LS().P[k.id])].filter(Boolean).join(', ')) + '</small></span></div>'; });
    html += '<p class="dim">' + esc(W.adultNote || '가문원이 되어 맹주를 따라 싸운다.') + '</p>';
  }
  if (el.length) {
    html += (ad.length ? '<hr class="lgsep">' : '') + '<h5>' + esc(W.elderHead || '머리에 서리가 내린 이') + '</h5>';
    el.forEach(function (p) { html += '<div class="lgod">' + (p.spr || '') + '<span><b>' + esc(p.name) + ' <i class="agt old">' + esc(agWord(agInfo(p.ch || p.m || LS().P[p.id]))) + '</i></b><small>' + esc(lgFill(lgPick((L.elder || []).slice(1)) || L.elder && L.elder[0] || '', { a: p.name })) + '</small></span></div>'; });
    html += '<p class="dim">' + esc(W.elderNote || '노년에는 공격, 마공이 조금 줄어든다. 후계자를 정해 둔다.') + '</p>';
  }
  var waits = mnats.filter(function (e) { return e.t === 'adultWait'; }); mnats = mnats.filter(function (e) { return e.t !== 'adultWait'; });
  if (waits.length) html += '<p class="lgwarn">' + esc(waits.map(function (e) { return e.text || ''; }).join(', ')) + '</p>';      // 성년이 되었지만 막사가 가득
  if (mnats.length) {      // 가계도에 오르지 않은 용병의 천수 (age.js 사건 mnat)
    html += (ad.length || el.length ? '<hr class="lgsep">' : '') + '<h5>' + esc(W.mnatHead || '천수를 누리고 떠난 이') + '</h5><ul class="agnat">' + mnats.map(function (e) { return '<li><b>' + esc(e.name || '') + '</b><small>' + esc([e.kind, e.age != null ? '향년 ' + e.age : ''].filter(Boolean).join(', ')) + '</small></li>'; }).join('') + '</ul>' +
      '<p class="dim">' + esc(W.mnatNote || '이름은 추모 목록에 남았다.') + '</p>';
  }
  var o = overlay(html + '<button class="btn gold wide" data-close>확인</button></div>', 'modal center');
  o.onclose = function () { if (cb) cb(); };
}

// ───────── 타이틀 ─────────
function drawTitleArt(cv) {
  var g = cv.getContext('2d'), W = cv.width, H = cv.height, t = 0;
  var who = ['inf_2', 'cav_3', 'fly_3', 'mar_2', 'pike_3', 'arc_2', 'cle_2', 'mon_3', 'mag_2', 'sha_2'];
  var cols = ['#5b8fd6', '#cdd5e3', '#62b0ee', '#2f86a6', '#3f8fa8', '#5fae5a', '#f4efe2', '#3fa88a', '#8d6be0', '#6a4f9e'];
  function draw() {
    if (!cv.isConnected) return;
    t += 1 / 30;
    g.fillStyle = '#1c1736'; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 26; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.3 * Math.sin(t * 2 + i)) + ')'; g.fillRect((i * 53) % W, (i * 29) % 34, 1, 1); }
    g.fillStyle = '#3a2f5a'; for (var x = 0; x < W; x += 2) { var hh = 8 + Math.sin(x * 0.11) * 4 + Math.sin(x * 0.037) * 6; g.fillRect(x, 44 - hh, 2, hh + 30); }
    g.fillStyle = '#2f6b3a'; g.fillRect(0, 62, W, H - 62); g.fillStyle = '#4c9a52'; g.fillRect(0, 62, W, 2);
    g.imageSmoothingEnabled = false;
    who.forEach(function (name, n) {
      var px = 6 + n * 17 + (n % 2) * 1, py = 46 + (n % 2) * 6 + Math.round(Math.sin(t * 3 + n) * 0.6);
      g.fillStyle = '#1b1626'; g.fillRect(px + 13, py - 12, 1, 14);
      g.fillStyle = cols[n]; var wv = Math.round(Math.sin(t * 5 + n) * 1); g.fillRect(px + 14, py - 12, 6 + wv, 4); g.fillRect(px + 14, py - 8, 4 + wv, 1);
      g.drawImage(DS.spriteCanvas(name, null, {}), px, py);
    });
    requestAnimationFrame(draw);
  }
  draw();
}
// 저장 칸에 글이 있는데 읽지 못했다 (save.js 가 _broken 으로 따로 떠 둔다) — 아무 말 없이 「새로 시작」만 보이던 것 (QA)
function brokenSave() { try { var K = (DS.Save && DS.Save.KEY) || 'tenbanners_v1'; return !!(localStorage.getItem(K) && localStorage.getItem(K + '_broken')); } catch (e) { return false; } }
function renderTitle() {
  var s = U.load(), el = $('#s-title'), r = DS.Save.legacy(), meta = DS.Save.meta();
  if (!s && !r && !meta.seenVer) meta = DS.Save.setMeta({ seenVer: DS.VERSION });     // 처음 온 분께는 NEW 표시를 띄우지 않는다
  var fresh = meta.seenVer !== DS.VERSION, nv = !s && DS.Save.newerLocal ? DS.Save.newerLocal() : 0;      // 더 새 판의 저장: 읽지 않고, 덮어쓸 「새로 시작」도 내지 않는다
  // 제목 「전민 戰民」, 부제 「열 개의 깃발」. 맺음(30번)을 본 저장이면 한자가 「傳民」(전할 전)으로 바뀐다 — 싸우던 백성이 다음 대에 전하는 백성이 된다.
  var passed = !!(s && s.cleared && s.cleared[30]);
  var arch = !s && DS.Save.archNote && DS.Save.archNote();      // r42: 처음 한 번 「새 시대가 열렸다」 (옛 저장은 보관만 한다)
  el.innerHTML = '<div class="title-top pad">' +
    '<h1 class="logo" aria-label="전민 ' + (passed ? '傳民' : '戰民') + '"><span class="lg-ko" data-t="전민">전민</span><span class="lg-han' + (passed ? ' passed' : '') + '">' + (passed ? '傳民' : '戰民') + '</span></h1>' +
    '<p class="logo-sub">열 가문의 시대</p>' + (passed ? '<p class="logo-gloss">싸우던 백성이 이제 전하는 백성이 되었다</p>' : '') + '</div>' +
    '<div class="title-art"><canvas class="px" width="180" height="80"></canvas></div>' +
    '<div class="title-bottom pad">' +
    (nv ? '<p class="welcome warnbox"><b>' + esc(DS.NEWER_MSG) + '.</b> 이 기기의 저장은 더 최신 버전(' + nv + ')이라 읽지 않고 그대로 둡니다.</p><button class="btn gold wide" id="btnReload">새로 고침</button>' : '') +
    (!s && !nv && brokenSave() ? '<p class="welcome warnbox"><b>저장을 읽지 못했습니다.</b> 깨진 저장은 지우지 않고 따로 두었습니다. 새로 시작하면 새로 저장합니다.</p>' : '') +
    (r && !s ? '<p class="welcome"><b>회귀자로 맞이합니다.</b> 예전 기록에 따라 특전을 드립니다. 진행은 처음부터입니다.</p>' : '') +
    (s ? '<button class="btn gold wide" id="btnCont">이어하기 <small>' + esc(s.name) + ', ' + DS.ZONES[s.zone].name + '</small></button>' : '') +
    (!nv && arch ? '<p class="welcome arch"><b>새 판이 열렸다. 이전 기록은 보관되었다.</b> ' + esc(DS.VERSION) + ' 은 처음부터 시작합니다. 옛 저장은 지우지 않고 이 기기에 그대로 두지만, 이어 하거나 사람을 데려오지는 않습니다.</p>' : '') +
    (nv ? '' : '<button class="btn wide' + (s || oldEra() ? '' : ' gold') + '" id="btnNew">' + (r && !s ? '회귀자로 새로 시작' : oldEra() ? '새 대장으로 시작' : '새로 시작') + '</button>') +
    '<div class="tver"><button id="btnNotes" class="lnk">공지사항<i class="dot"' + (fresh ? '' : ' hidden') + '></i></button><span class="num">v' + DS.VERSION + '</span></div>' +
    '<p class="title-note">저장은 이 브라우저에 남습니다.</p></div>';
  if (s && DS.lgTitleRow) { try { DS.lgTitleRow(el, s); } catch (x) {} }      // r33 legacy: 가문 이름과 등급
  if (DS.titleArt) { try { DS.titleArt($('canvas', el)); } catch (x) { drawTitleArt($('canvas', el)); } } else drawTitleArt($('canvas', el)); if (DS.Audio && DS.Audio.bgm) DS.Audio.bgm('title');
  if (s) $('#btnCont').addEventListener('click', function () { DS.Audio.unlock(); A('ok'); G.save = s; DS.Audio.set({ sfx: s.opt.sfx, bgm: s.opt.bgm }); DS.startGame(); DS.showNews(); setTimeout(askGrand, 2500); });
  var be = $('#btnEra'); if (be) be.addEventListener('click', function () { DS.Audio.unlock(); A('tap'); DS.openNewEra(DS.Save.oldRaw(), !!s); });
  if (!nv) $('#btnNew').addEventListener('click', function () { DS.Audio.unlock(); A('tap'); newGame(!!s, r); });
  else { $('#btnReload').addEventListener('click', function () { try { location.reload(); } catch (e) {} }); setTimeout(function () { toast(DS.NEWER_MSG, 4200); }, 300); }
  $('#btnNotes').addEventListener('click', function () { DS.Audio.unlock(); A('tap'); DS.openNotes(); });
  if (arch) DS.Save.archSeen();
  if (fresh && (s || r || arch)) setTimeout(function () { if (!$('.ov') && !$('#s-title').hidden) DS.openNotes(); }, 500);   // 판이 바뀐 뒤 처음이면 공지를 먼저 보여 준다
}
// ㉑ 새 시대를 연다: 옛 저장(읽기 전용)의 사람 목록에서 한 사람 → 새 판의 대장(1세, 레벨 1). 옛 지휘관이면 그 병과, 용병이면 병과를 고른다
function oldEra() { return false; }      // r42 (2.0.0): 옛 저장에서 사람을 데려오는 길은 닫았다 — 보관만 한다 (DS.Save.archNote)
// r12 screen: 옛 사람 목록(초상 · 이름 · 옛 자리 · 등급 눈금)을 갈래별로 → 한 사람을 고르면 아래 줄에 「이 사람으로 시작」 또는 병과 둘 → 시작. 맨 아래 「처음 사람으로」
//   QA 17 · t9 가 쓰는 선택자: #btnEra · [data-era] · [data-ec] (고르면 [data-ec] 가 늘 나온다)
DS.openNewEraOld = function (raw, hasSave) { return newEra0(raw, hasSave); };      // 옛 길 (2.0.0 에서는 부르지 않는다 — 시험용)
DS.openNewEra = function () {      // r42 (2.0.0): 옛 판 저장(1.x)은 이어 하지도, 사람을 데려오지도 않는다 — 안내만
  overlay('<div class="result"><h2>새 판이 열렸다</h2><p>이전 기록은 보관되었다. ' + esc(DS.VERSION) + ' 은 판의 뼈대가 달라 옛 저장을 이어 하거나 사람을 데려올 수 없습니다. 옛 저장은 지우지 않고 그대로 둡니다. 새로 시작해 주세요.</p><button class="btn gold wide" data-close>확인</button></div>', 'modal center');
};
var newEra0 = function (raw, hasSave) {
  var L = DS.oldPeople(raw), ver = '', pick = -1; try { ver = JSON.parse(raw).ver || ''; } catch (e) {}
  var SRC = { hero: '옛 대장', cmd: '가주였던 이', merc: '사람', young: '아이', coffin: '관 속' };
  function face(p) {
    try {
      if (p.cls && DS.CLASSES[p.cls]) return sprTag(DS.lookName(p.cls, DS.CLASSES[p.cls].start || 1), '', 2);
      if (p.type && DS.MERCS[p.type]) return mercSpr({ type: p.type, g: p.g || 1, v: p.v || 0 }, 2);
    } catch (x) {}
    return '<span class="q">？</span>';
  }
  function body() {
    var h = '<p class="hint">고른 사람이 첫 대장이 됩니다. 이름, 외모, 특성은 그대로 가져오고 레벨과 장비는 처음부터 시작합니다.</p>' + (hasSave ? '<p class="lock">4.0 진행이 있습니다. 새로 시작하면 덮어씁니다.</p>' : ''), last = '';
    L.forEach(function (p, i) {
      if (p.src !== last) { last = p.src; h += '<h4>' + SRC[p.src] + '</h4>'; }
      h += '<button class="row merc erow' + (i === pick ? ' on' : '') + '" data-era="' + i + '">' + face(p) + '<span class="mn"><b>' + esc(p.name) + '</b>' + (p.g ? ' ' + gpips(p.g) : '') + '<small>' + esc(String(p.note || '').replace(/\s*—\s*/g, ', ')) + (p.t && DS.TRAITS[p.t] ? ', ' + DS.TRAITS[p.t].name : '') + '</small></span></button>';
    });
    h += '<div class="dangerz one"><button class="btn wide" data-era-new="1">새 대장으로 시작</button></div>';
    return h;
  }
  function foot() {
    var p = L[pick], cls = p ? DS.oldCls(p) : null;
    if (!p) return '<button class="btn" data-close>닫기</button>';
    if (cls) return '<button class="btn" data-close>닫기</button><button class="btn gold" data-ec="' + cls + '">' + esc(josa(p.name, '으로')) + ' 시작</button>';
    return '<button class="btn" data-close>닫기</button><span class="ecs ten">' + startClasses().map(function (k) { return '<button class="btn gold" data-ec="' + k + '">' + DS.CLASSES[k].name + '</button>'; }).join('') + '</span>';      // r44: 열 병과 가운데 아무것이나
  }
  var o = overlay('<header class="sh"><h3>새 시대를 연다</h3><small class="dim">옛 진행' + (ver ? ' v' + esc(ver) : '') + ', 보관</small></header><div class="sb"></div><div class="sfoot"></div>');
  function draw() { var sb = $('.sb', o), t = sb.scrollTop; sb.innerHTML = body(); U.hydrate(sb); sb.scrollTop = t; var f = $('.sfoot', o); f.className = 'sfoot' + (pick >= 0 ? ' two' : ''); f.innerHTML = foot(); }
  draw();
  o.addEventListener('click', function (e) {
    var c = e.target.closest('[data-ec]'); if (c && pick >= 0) { A('ok'); var p0 = L[pick]; o.close(); eraStart(p0, c.dataset.ec, ver); return; }
    if (e.target.closest('[data-era-new]')) { A('tap'); o.close(); newGame(hasSave, null); return; }
    var b = e.target.closest('[data-era]'); if (!b) return;
    pick = +b.dataset.era; A('tap'); draw();
  });
  return o;
};
function eraStart(p, cls, ver) {
  G.save = DS.newFromOld(p, cls, ver);
  DS.Save.setMeta({ seenVer: DS.VERSION, eraFrom: { n: p.name, ver: ver } });
  U.persist(); DS.startGame();
  var pro = (LORE().prologue && LORE().prologue.length) ? LORE().prologue : ['그대는 해밀 마을의 풋내기 용병대장. 이름 하나와 300골드가 전부다.'];
  story(['옛 시대에서 온 이름, ' + p.name + '.'].concat(pro), null, '전민 새 시대');
}
// 1.0.9: 맹주 가문 이름이 여덟 이름 밖(옛 판의 홈즈·캐퓰렛 등)이면 반드시 고르게 한다 — 닫을 수 없고, 고를 때까지 접속마다 다시 묻는다 (사용자 「지금 이대로는 없어 반드시 바꿔야해」)
function askGrand(tries) {
  var s = G.save; tries = tries || 0;
  if (!s || !s.lin || !s.opt || !DS.GRAND_HOUSES || !DS.allySet || document.querySelector('.result.ghask')) return;
  var cur = typeof s.ally === 'string' ? s.ally : '';      // 2.1.0: 연맹 이름이 없는 저장만 묻는다 (새 판은 시작할 때 고른다)
  if (cur || s.opt.ghAsked) { s.opt.ghAsked = 1; return; }
  if (G.scn || (G.sim && G.sim.combat) || G.ending || document.querySelector('.ov')) { if (tries < 40) setTimeout(function () { askGrand(tries + 1); }, 3000); return; }
  var pick = 0;
  var o = overlay('<div class="result ghask"><p class="eyebrow">연맹</p><h2>연맹의 이름을 정하세요</h2>' +
    '<p class="dim">가문들이 모인 연맹의 이름입니다. 대가 바뀌어도 그대로입니다.</p>' +
    '<div class="gh-pick">' + DS.GRAND_HOUSES.map(function (g, i) { return '<button class="gh' + (i === pick ? ' on' : '') + '" data-gh="' + i + '"><b>' + esc(g[0]) + '</b><small>' + esc(g[1]) + '</small></button>'; }).join('') + '</div>' +
    '<button class="btn gold wide" data-ghok="1">이 이름으로 정한다</button></div>', 'modal center');
  o.classList.add('nodismiss'); o.onclose = function () { if (G.save && !G.save.ally && !G.save.opt.ghAsked) setTimeout(askGrand, 600); };
  o.addEventListener('click', function (e) {
    var b = e.target.closest('[data-gh]');
    if (b) { pick = +b.dataset.gh; A('tap'); o.querySelectorAll('.gh').forEach(function (x) { x.classList.toggle('on', x === b); }); return; }
    if (e.target.closest('[data-ghok]')) {
      var nm = DS.GRAND_HOUSES[pick][0];
      try { DS.allySet(s, nm); } catch (x) {}
      s.opt.ghAsked = 1; lgCache = null; U.persist(); A('ok'); o.close();
      toast(nm + ' 연맹이 되었다', 3200); return;
    }
  });
}
DS.askGrand = askGrand;
// r44: 첫 가문은 열 병과 가운데 아무것이나 (사용자 「보병 말고 다른 원하는 병과를 선택할 수 있게」). 카드 열 장(세로 2×5, 가로 5×2) + 고른 병과의 자세한 칸.
//   그 병과를 데려오던 시나리오에서는 어느 시나리오도 주지 않던 집(보병 바우)이 대신 온다 — DS.joinOf / DS.startSwap. 열 집은 늘 한 번씩 모인다
var START_LINE = { inf: '튼튼한 전열. 앞에서 버틴다', cav: '두 칸 창과 번개. 평지에서 빠르다', fly: '산과 물을 넘는다. 화살에 약하다', mar: '물에 서면 강해지는 전열',
  pike: '두 칸 찌르기와 보조 마법', arc: '멀리서 쏜다. 몸이 약하다', cle: '아군을 고치는 치유사', mon: '가호를 거는 서포터', mag: '여럿을 태우는 마법. 몸이 약하다', sha: '생기를 빨고 망자를 부른다' };
DS.START_LINE = START_LINE;
var START_HARD = { fly: '어려움' };      // r44: 봇 8판에서 대장이 가장 자주 쓰러진 병과 (화살에 약하고 보병이 11번에야 온다) — 카드에 꼬리표
function startClasses() { return Object.keys(DS.CLASSES).filter(function (k) { return !DS.CLASSES[k].master; }); }
function startCard(k, on) {
  var c = DS.CLASSES[k];
  return '<button class="pcard ncard' + (on ? ' on' : '') + '" data-c="' + k + '" aria-pressed="' + (on ? 'true' : 'false') + '" style="--fc:' + (DS.FLAG[k] || '#c9a96a') + '">' +
    '<span class="ncs">' + sprTag(DS.lookName ? DS.lookName(k, c.start || 1) : k + '_1', '', 2) + '</span><span class="nct"><b>' + (DS.houseCrest ? DS.houseCrest(k, 14) : '') + esc(c.name) + (START_HARD[k] ? '<i class="nhard">' + START_HARD[k] + '</i>' : '') + '</b><small>' + esc(START_LINE[k] || '') + '</small></span></button>';
}
function startDetail(k, gh) {
  var c = DS.CLASSES[k], sw = DS.startSwap ? DS.startSwap(k) : null, hn = (gh ? gh + ' 연맹, ' : '') + (DS.castHouse ? DS.castHouse(k) : '');      // 2.1.0: 연맹 이름 + 그 병과의 가문명
  var swap = sw ? sw.scn.id + '번 「' + sw.scn.name + '」에서는 ' + DS.castHouse(sw.from) + ' ' + c.name + ' ' + DS.CAST_NAME[sw.from] + ' 대신 ' + DS.castHouse(sw.to) + '의 ' + DS.CLASSES[sw.to].name + ' ' + josa(DS.CAST_NAME[sw.to], '이가') + ' 온다. 열 집은 그대로 모인다.'
    : '아홉 집이 모두 제 시나리오에서 모인다.';
  return '<div class="ndh">' + (DS.houseCrest ? DS.houseCrest(k, 30, { lord: 1 }) : '') + '<span><b>' + esc(hn ? hn + ', ' : '') + esc(c.name) + ' 가주</b><small>' + (c.start || 1) + '단 ' + esc(c.tiers[0]) + '부터 · 특성 「' + esc(((DS.TRAITS || {})[DS.heroTrait ? DS.heroTrait(k) : ''] || {}).name || '') + '」</small></span></div>' +
    '<p class="ndb">' + esc(String(c.blurb).replace(/\s*가장 마지막에 합류한다\.?/, '')) + '</p><p class="ndj">' + esc(swap) + '</p>';
}
DS.startDetail = startDetail;
function newGame(hasSave, r) {
  var pick = 'inf', perk = r ? DS.returneePerk(r) : null, ghI = Math.floor(Math.random() * ((DS.GRAND_HOUSES || [1]).length));      // 1.0.7: 맹주 가문 이름을 고른다 (처음엔 무작위 하나)
  var ghName = function () { var g = DS.GRAND_HOUSES && DS.GRAND_HOUSES[ghI]; return g ? g[0] : ''; };
  var o = overlay('<header class="sh"><h3>새로 시작</h3></header><div class="sb ngsb"><div class="ngl">' +
    '<label class="fld"><span>대장의 이름</span><input id="cmdName" maxlength="8" value="' + esc((r && r.name) || '대장') + '" autocomplete="off"></label>' +
    (DS.GRAND_HOUSES ? '<p class="hint">연맹의 이름</p><div class="gh-pick ngh">' + DS.GRAND_HOUSES.map(function (g, i) { return '<button class="gh' + (i === ghI ? ' on' : '') + '" data-gh="' + i + '"><b>' + esc(g[0]) + '</b><small>' + esc(g[1]) + '</small></button>'; }).join('') + '</div><p class="nghd">' + esc((DS.GRAND_HOUSES[ghI] || [])[1] || '') + '</p>' : '') +
    (perk ? '<div class="perkbox"><b>' + esc(perk.rank) + ' 특전</b><ul>' + perk.lines.slice(1).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>' : '') +
    (hasSave ? '<p class="lock">저장된 진행이 있습니다. 새로 시작하면 덮어씁니다.</p>' : '') + '</div><div class="ngr">' +
    '<p class="hint">첫 가문의 병과를 고르세요. 나머지 아홉 집은 시나리오를 깨며 모입니다.</p><div class="pick ten">' +
    startClasses().map(function (k) { return startCard(k, k === pick); }).join('') +
    '</div><div class="ndet" aria-live="polite">' + startDetail(pick, ghName()) + '</div></div></div><div class="sfoot two"><button class="btn" data-close>닫기</button><button class="btn gold" id="goNew">출발</button></div>', 'ngov');
  function det() { var d = $('.ndet', o); if (d) d.innerHTML = startDetail(pick, ghName()); }
  o.addEventListener('click', function (e) {
    var gb = e.target.closest('[data-gh]'); if (gb) { ghI = +gb.dataset.gh; A('tap'); o.querySelectorAll('.gh').forEach(function (b) { b.classList.toggle('on', b === gb); }); var gd = $('.nghd', o); if (gd) gd.textContent = (DS.GRAND_HOUSES[ghI] || [])[1] || ''; det(); return; }
    var c = e.target.closest('[data-c]'); if (!c) return;
    pick = c.dataset.c; A('tap'); $$('.pcard', o).forEach(function (b) { b.classList.toggle('on', b === c); b.setAttribute('aria-pressed', b === c ? 'true' : 'false'); }); det();
    var d = $('.ndet', o); if (d && d.scrollIntoView && e.isTrusted) { try { d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (x) {} }
  });
  $('#goNew', o).addEventListener('click', function () {
    var name = Array.from((($('#cmdName', o).value || '').trim())).slice(0, 8).join('') || '대장';      // 한글 입력기가 조합 중에 maxlength 를 넘길 수 있다
    A('ok'); o.close();
    G.save = DS.newSave(name, pick);
    if (DS.GRAND_HOUSES && DS.GRAND_HOUSES[ghI] && DS.allySet) { try { DS.allySet(G.save, DS.GRAND_HOUSES[ghI][0]); } catch (x) {} }      // 2.1.0: 고른 이름은 연맹의 이름 (맹주의 가문은 병과의 가문명)
    if (G.save.opt) G.save.opt.ghAsked = 1;
    if (r) DS.grantReturnee(G.save, r, false);
    DS.Save.setMeta({ seenVer: DS.VERSION });
    U.persist();
    DS.startGame();
    // 도입: 시나리오팀의 글(LORE.prologue, 회귀자는 prologueR)이 있으면 그것으로 — 마지막 줄이 조작 안내다. 없으면 예전 문장
    var L0 = LORE(), lore = r && L0.prologueR && L0.prologueR.length ? L0.prologueR : L0.prologue;
    var pro = lore && lore.length ? lore : ['옛날, 열 가문이 세상을 덮치던 「어스름」을 막아 냈다.', '세월이 흘러 가문은 흩어지고, 북쪽 하늘이 다시 어스름하게 물든다.',
      r ? '그대는 해밀 마을의 용병대장. 어쩐지 이 길이 처음이 아닌 것만 같다.' : '그대는 해밀 마을의 풋내기 용병대장. 이름 하나와 300골드가 전부다.',
      r ? '마을 위쪽 출구로 나가세요. 왼쪽 아래를 누른 채 끌면 이동, 적을 누르면 공격.' : '마을 위쪽 출구로 나가세요. 왼쪽 아래를 누른 채 끌면 이동, 적을 누르면 공격.'];
    story(pro, perk ? function () { showPerk(perk, null); } : null, '전민 열 가문의 시대');
  });
}
function boot() {
  var hot = window.claude && window.claude.hot;
  function start(data) {
    renderTitle(); U.show('s-title');
    var s = data && data.resume ? U.load() : null;     // 페이지가 새로 올라오면 하던 자리에서 잇는다
    if (s) { G.save = s; DS.Audio.set({ sfx: s.opt.sfx, bgm: s.opt.bgm }); DS.startGame(); DS.showNews(); setTimeout(askGrand, 2500); }
  }
  if (hot && hot.snapshot) { try { hot.snapshot(function () { U.persist(); return { resume: !!(G.sim && G.save) }; }); } catch (e) {} }
  if (hot && hot.ready) { try { hot.ready(start); } catch (e) { start({}); } } else start((hot && hot.data) || {});
}
DS.boot = boot;
if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot(); }
})();
