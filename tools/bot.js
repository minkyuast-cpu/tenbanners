// 전민 — 머리 없는 캠페인 봇 (2.2.0 「한 사람 한 사람」 규칙). 진짜 엔진(DS.Sim)과 진짜 규칙 함수로 30번까지 깬다.
//   node tools/bot.js [cls=inf] [seed=1] [gen2=0]          예: node tools/bot.js mag 3
//   BOTCHECK=1: 싸움 밖마다 자리 불변식 검사(tools/inv.js) — 어김은 「INV …」 줄, 요약의 inv 칸에 수
//   BOTPIT=1: 5단부터는 들판 대신 바닥 없는 갱도에서 키를 다진다 (DS.pitFarm 층 — 갱도 농사가 캠페인을 너무 빠르게 하지 않는지 보는 용도)
//   BOTSNAP=폴더: 시나리오마다 처음 들어가기 직전의 판을 <폴더>/<병과>_<씨앗>_<번호>.json 으로 (tools/calib.js 의 재료)
//   BOTLAPSE=n (2.3.2): n번을 깬 뒤 한 번 대를 일부러 끊는다 — 대가 끊기면 깬 시나리오가 모두 사라지니(DS.lapseRestart) 봇은 1번부터 다시 걷는다.
//     요약의 lapses: [{ lost 잃은 시나리오 수, top, h 끊긴 때(시간), back 그 번호까지 되찾는 데 든 시간, forced }] · 저절로 끊긴 대도 같은 칸에 (forced 0)
//   BOTSAVE=파일 BOTSAVEAT=15: 그 시나리오를 깬 판을 저장 글(JSON)로 쓰고 끝낸다 (화면 시험용 중반 저장)
//   BOTNOKEEP=1 (2.6.0): 뒤를 이은 이에게 선대가 입던 것을 먼저 입히지 않는다 — 출전 셋이 가방에서 먼저 고르던 첫 판 (비교용: 대를 이은 가문이 남은 것만 입어 다시 합일하는 긴 판이 잦았다)
//   2.8: gen2=1 이면 다음 세대의 장 앞에서 마지막 물결을 치른다 (DS.standRun · 요약의 g2.stand = { w 막은 물결, r 닿은 물결, b 보스, p 평화의 해, t 엔진 초, allies }). BOTNOSTAND=1 이면 예전처럼 스무 해
//   끝에 한 줄 요약과 「BOT {json}」 (hours · cleared · wipes · deaths · vacancies · recruits …).
//
// 정책 (사람이 하듯이, 단순하게):
//   · 다음 시나리오의 권장 레벨(DS.recL)에 부대 평균(DS.partyL)이 닿을 때까지 들판에서 싸운다. 들판 = 부대 평균에 맞는 지역의 무리 하나
//     (그 무리 레벨이 평균 + 1 이하), 그 지역 지도 위에서 진짜 엔진으로. 걸어 다니는 시간은 싸움마다 FIELD_OVER 초를 더해 셈한다.
//   · 합일: 맹세의 깃대를 얻은 뒤 7단 Lv10 셋이 모일 때마다 교회에서 합일(DS.fuseAuto). 단 문턱(8단 · 9단) 앞에서는 가장 앞선 사람의 레벨 쪽 무리를 잡는다.
//   · 싸움 앞: 교회 치료(골드), 약초 다섯까지 사기, 가방의 더 좋은 장비 입히기(DS.lootAutoEquip · 2.6.0: 뒤를 이은 이의 빈 칸도 — equipAll), 맹주가 홀몸이면 혼인(DS.linAutoWed — 막사의 같은 병과가 하나뿐이면 그이는 빼고).
//   · 영웅 모집: 모집권은 바로 쓴다. 빈 가문(막사도 비었음)이 있으면 골드로도 부른다 (예비 골드 200 × 단은 남긴다).
//     빈 가문이 없어도 골드가 값의 세 배를 넘고 막사가 싸우는 가문 수의 절반보다 적으면 부른다. 병과는 무작위다 (게임 규칙 그대로).
//   · 맹주의 어른 아이(가문원)는 빈 가문이 생기면 레벨이 가장 높은 이를 그 가문의 가주로 보낸다 (DS.hand).
//   · 싸움 뒤: 진짜 규칙 그대로 — 쓰러진 가주·가문원은 영영 잃는다(DS.loseMerc · DS.linMercDied), 맹주는 미뤄진 죽음 → 후계는 사람처럼 고른다(자식 · 막사의 같은 병과 · 다른 가문의 가주 가운데 맹주가 되었을 때 레벨이 가장 높은 이 — 고를 이가 없으면 DS.linAutoAll 의 대 끊김. BOTAUTO=1: 게임의 저절로 차례),
//     나이·출생(DS.ageCheck), 막사의 사람이 빈 가문을 잇기(DS.sbTick). 지면(전멸) 같은 시나리오를 다시 한다 (wipe 하나).
//   · 필살기: 2.2.7 부터 자동 전투가 가문마다 스스로 쓴다 (engine.js P.ultSelf — 봇의 가문은 모두 자동). DS.BAL.ultAuto 는 조작하는 한 사람을 수동이어도 누른 것으로 친다.
//   2.2.8: 출전은 맹주 + 가주 둘 — 싸우기 전마다 가장 센 둘을 고른다 (DS.sortieRank · 바꾼 수 sortieSw). 맹주의 어른 가문원은 늘 함께 싸운다.
//     전멸하면 그 시나리오는 두 레벨씩 더 다지고 다시 들어간다 (셋째 패배까지 · BOTNOLEARN=1 이면 예전처럼 곧장)
//   2.2.7: 요약에 시나리오 · 들판마다 쓰러짐(dAt) · 전멸(wAt) · 필살기(uAt) · 처음 싸운 길이(tAt) · 처음 싸움 [이김, 쓰러짐, 레벨](ft). BOTREC=1: 안전 대신 권장에서 들어간다
//   2.2.9 합일(새 규칙): 깃대가 있고 서로 다른 세 가문의 가주 셋이 7단 Lv10 이면 합일 — 대표는 남은 해가 가장 긴 가주(맹주가 늙었으면 넣지 않는다), 흡수할 둘도 남은 해가 긴 이(대표가 그 해를 받는다).
//     합일한 가주를 셋(BOTFUSET)까지 두고, 떠나면 다시 (가문이 BOTKEEP(4) 넘게 남는 동안 · 문턱 앞인데 합일한 이가 없으면 둘까지). 시나리오에서는 처음 세 번(BOTRETTRIES)만 물러난다 —
//     가주 · 맹주가 둘째로 쓰러지거나 합일한 이의 체력이 15%(맹주는 30%) 밑이면 퇴각(진 판으로 센다).
//     요약 칸: fuse · fuseAt · shut(잠든 가문@시나리오) · xDeaths(8단 위의 죽음) · xNat(8단 위의 천수) · retreats · retX · reopens · wake · openGold(가문을 열 때 쓴 골드)
// 시간: hours = (엔진 시간 + 걷는 몫) / 3600. 게임 달력도 엔진 시간만큼 흐른다 (DS.ageAdvance — 게임과 같다).
// 옛 규칙 비교: LOAD_SRC=/home/user/src/src node tools/bot.js inf 1 — 2.1.2(저장 v12) 규칙으로 같은 정책을 돌린다 (가솔 자동 채움 · 출전 셋 = 레벨 높은 셋 ·
//   가솔 빈자리가 있으면 1회 모집 · 자동 후계 DS.succTick). 같은 시간 셈이라 전 → 후 를 견줄 수 있다.
'use strict';
const D = require('./load.js')();
const cls = process.argv[2] || 'inf', seed = +(process.argv[3] || 1), gen2 = +(process.argv[4] || 0);
const FIELD_OVER = 14, SCN_OVER = 45, PIT_OVER = 20, MAX_FIELD = 20000, STEP = 0.5;
let rs = seed * 2654435761 >>> 0; const rnd = () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ rs >>> 15, 1 | rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
Math.random = rnd;      // 규칙 함수의 난수도 씨앗에 묶는다 (같은 씨앗이면 같은 판)
D.BAL.ultAuto = true;
if (process.env.CMDK) D.BN.cmdK = +process.env.CMDK;      // 조율용: 깃발 유닛 배율 덮어쓰기
if (process.env.KINK) D.BN.kinK = +process.env.KINK;
const st = { eL: {}, fieldT: 0, simT: 0, over: 0, field: 0, scn: 0, wipes: 0, deaths: 0, kinDeaths: 0, bearDeaths: 0, heroDeaths: 0, recruits: 0, recruitGold: 0, tickets: 0, kinSent: 0, sbSeat: 0, births: 0, vacMax: 0, vacSum: 0, vacN: 0, fuse: 0, lapse: 0, perScn: [], log: [], bdc: {}, dmg: {}, sk: {}, ult: {}, atkN: {}, dAt: {}, wAt: {}, uAt: {}, tAt: {}, ft: {} };
let where = '';      // 2.2.7: 지금 싸우는 곳 (쓰러짐 · 필살기를 시나리오 · 들판마다 센다) — 's12' · 'f:coast' · 'p40'
const OLD = D.SAVE_V === 12;      // 2.1.2 규칙 (비교용)
const s = D.newSave('봇', cls);
D.allySet && D.allySet(s, '펜드래곤');
const zc = {};
function zone(id) { return zc[id] || (zc[id] = D.buildZone(id)); }
function oldTidy() {
  if (D.linVacant(s).length) { const ev = D.linAutoAll(s) || []; ev.forEach(e => { if (e.t === 'lapse') st.lapse++; }); }
  if (D.succTick) D.succTick(s);
  D.autoAssign(s);
  const ids = D.charList(s).filter(c => !c.down && !c.vac && (c.id === s.hero || D.bearer(s, c))).sort((a, b) => b.L - a.L).slice(0, D.PARTY_MAX).map(c => c.id);
  if (ids.length) s.party = ids;
  D.autoAssign(s); D.pSync(s);
}
function oldRecruit() {
  for (let guard = 0; guard < 6; guard++) {
    let slots = 0; s.party.forEach(id => { if (s.chars[id]) slots += Math.max(0, D.MERC_SLOTS - D.popOf(s, id)); });
    const empty = D.bnEmpty(s).length, price = D.recruitPrice(s, 0), keep = 200 * D.heroTier(s);
    if (!slots && !empty) return;
    let pay = 0;
    if (s.tickets > 0) s.tickets--; else if (s.gold >= price + keep) { s.gold -= price; D.recruitPaid(s, 1); pay = price; } else return;
    D.pullMerc(s, rnd, 0); st.recruits++; st.recruitGold += pay; D.autoAssign(s);
  }
}
const INV = process.env.BOTCHECK && !OLD ? require('./inv.js') : null, invSeen = {};
let invBad = 0;
function check(where) {      // BOTCHECK=1: 싸움 밖마다 자리 불변식 (tools/inv.js). 처음 보는 어김만 찍는다
  if (!INV) return;
  INV(D, s, true).forEach(b => { invBad++; const k = b.replace(/[0-9]+/g, '#'); if (!invSeen[k]) { invSeen[k] = 1; console.log('INV ' + where + ' @' + Object.keys(s.cleared).length + ': ' + b); } });
}
function tidy() {
  if (OLD) return oldTidy();
  if (D.linVacant(s).length && process.env.BOTLOG) { const hs = D.linHeirs(s, s.hero); st.log.push('RITE @h' + ((st.simT + st.over) / 3600).toFixed(1) + ' yr' + D.calNow(s).yr + ' heirs ' + hs.map(h => h.kind + (h.young ? 'Y' : '')).join(',') + ' mercs ' + s.mercs.length + ' party ' + D.partyIds(s).length + ' gold ' + s.gold + ' price ' + D.recruitPrice(s, 0)); }
  if (D.linVacant(s).length && D.linChoices && !process.env.BOTAUTO) {      // 사람이 하듯 고른다: 자식 · 막사의 같은 병과 · 다른 가문의 가주 가운데 맹주가 되었을 때 레벨이 가장 높은 이 (같으면 자식 → 막사 → 다른 가문). BOTAUTO=1 이면 게임의 저절로 차례(핏줄 → 막사 → 끊김)
    const ch3 = D.linChoices(s, s.hero).sort((a, b) => (b.nL || b.pL || 0) - (a.nL || a.pL || 0) || a.opt - b.opt)[0];
    if (ch3 && D.linSucceed(s, s.hero, ch3, {})) { st['pick' + ch3.opt] = (st['pick' + ch3.opt] || 0) + 1; st.log.push('pick' + ch3.opt + ' @h' + ((st.simT + st.over) / 3600).toFixed(1) + ' L' + (ch3.nL || ch3.pL) + ' → ' + (s.chars[s.hero] || {}).cls); }
  }
  if (D.linVacant(s).length) { const ev = D.linAutoAll(s) || []; ev.forEach(e => { if (e.t === 'lapse') lapsed(e); }); }
  const seat = D.sbTick(s); st.sbSeat += seat.length;
  D.mercTidy(s); D.pSync(s);
  const v = D.bnEmpty(s).length; st.vacMax = Math.max(st.vacMax, v); st.vacSum += v; st.vacN++;
}
// 2.3.2 대가 끊기면 이야기는 처음으로 (DS.lapseRestart): 깬 시나리오가 모두 사라진다 → 캠페인을 1번부터 다시 (st.restart). 잃은 길을 되찾는 데 든 시간을 lapses 에
function lapsed(e, forced) {
  const H = (st.simT + st.over) / 3600, top = s.runs && s.runs.hist && s.runs.hist.length ? s.runs.hist[s.runs.hist.length - 1].top : 0;
  st.lapse++; st.restart = 1;
  st.lapses = (st.lapses || []).concat([{ lost: e.scn || 0, top: top, h: +H.toFixed(2), g: D.genNow ? D.genNow(s) : 1, forced: forced ? 1 : 0 }]);
  st.log.push('LAPSE @h' + H.toFixed(1) + ' lost ' + (e.scn || 0) + ' houses ' + (D.sortieCands ? D.sortieCands(s) : D.partyIds(s)).length + ' kin ' + D.mercsOf(s, s.hero).length);
}
// BOTLAPSE=n: n번을 처음 깬 뒤(그때 어른 자식이 다른 가문의 가주로 있으면 그다음 판들에서) 한 번, 대를 일부러 끊는다 (맹주의 가문원 · 막사의 같은 병과를 떠나보내고 맹주가 쓰러진다 — 다시 걷는 데 드는 시간을 재는 용도)
function forceLapse() {
  const h = s.chars[s.hero]; if (!h || h.vac) return false;
  if (D.linHeirs(s, s.hero).some(x => !x.young && x.blood && x.h)) return false;      // 다른 가문의 가주로 간 어른 자식이 있으면 끊기지 않는다 — 다음 판에 다시 본다
  s.mercs.slice().forEach(m => { if ((m.o === s.hero && !m.h) || (D.isSb(m) && D.sbFits(h, m))) D.loseMerc(s, m.id); });
  D.linTidy(s); D.mercTidy(s);
  h.down = true; D.linSettle(s, '봇');
  const ev = D.linAutoAll(s) || [];
  ev.forEach(e => { if (e.t === 'lapse') lapsed(e, true); });
  tidy();
  return ev.some(e => e.t === 'lapse');
}
function heal(pay) { const fee = 20 * D.heroTier(s); if (pay && s.gold >= fee) s.gold -= fee; D.charList(s).forEach(c => { if (!c.down) { c.hp = 1; c.mp = 1; } }); s.mercs.forEach(m => { m.hp = 1; }); }
function shop() {
  const hp = D.ITEMS.herb.price; while ((s.items.herb || 0) < 5 && s.gold >= hp + 100) { s.gold -= hp; s.items.herb = (s.items.herb || 0) + 1; }
}
function recruit() {
  for (let guard = 0; guard < 6; guard++) {
    const room = D.heroRoom(s), shut = D.closedCls ? D.closedCls(s).length : 0; if (!room.length && !shut) return;
    const vac = D.bnEmpty(s).length, price = D.recruitPrice(s, 0), keep = 200 * D.heroTier(s);
    let pay = 0;
    const bar = D.barracks(s).length, old = !bar && D.charList(s).some(ch => { const b = ch.id === s.hero ? null : D.bearer(s, ch, 1); return b && b.eld; });      // 노년 가주가 있는데 막사가 비었다 (사람이 「노년」 꼬리표를 보고 준비하듯)
    const spare = bar < Math.ceil(D.charList(s).filter(ch => ch.id === s.hero || D.bearer(s, ch, 1)).length / 2);      // 넉넉하면 막사에 몇 사람 (가주가 선 가문 수의 절반까지 — 2.2.8: 싸우는 셋이 아니라 선 가문 모두로 센다, 2.2.7 과 같게)
    if (s.tickets > 0) { s.tickets--; st.tickets++; }
    else if (((vac || old || shut) && s.gold >= price + keep) || (spare && s.gold >= price * 3 + keep)) { s.gold -= price; D.recruitPaid(s, 1); pay = price; }      // 2.2.4: 닫힌 가문이 있으면 빈 가문처럼 골드로도 부른다 (가문은 영웅관에서만 열린다)
    else return;
    const r = D.recruitHero(s, rnd); if (!r) { s.gold += pay; return; }
    st.recruits++; st.recruitGold += pay; if (r.role === 'open') st.openGold = (st.openGold || 0) + pay; if (r.reopen) { st.reopens = (st.reopens || 0) + 1; st.log.push('REOPEN ' + r.ch.cls); }
    if (r.role === 'open') { st.opens = (st.opens || 0) + 1; st.log.push('OPEN ' + r.ch.cls + ' #' + D.charList(s).length + ' @' + Object.keys(s.cleared).length + ' h' + ((st.simT + st.over) / 3600).toFixed(2) + (pay ? ' gold' : ' ticket')); }
    st.log.push('recruit ' + r.ch.cls + ' ' + r.role + ' g' + r.g + ' L' + r.m.L + (pay ? ' ' + pay + 'G' : ' 권'));
  }
}
function sendKin() {
  D.charList(s).forEach(ch => {
    if (!D.vacant(s, ch) || D.sbOf(s, ch.id).length) return;
    const k = D.mercsOf(s, s.hero).filter(m => !m.cast).sort((a, b) => D.pL(b) - D.pL(a))[0];
    if (!k) return;
    const r = D.hand(s, ch.id, k.id, { where: 'town' }); if (r.ok) { st.kinSent++; st.log.push('kin→' + ch.cls + ' L' + k.L); }
  });
}
// 2.2.9 합일 (사람이 하듯): 맹세의 깃대가 있고 서로 다른 세 가문의 가주 셋이 7단 Lv10 이면 합일한다.
//   셋: 맹주가 들 수 있으면 맹주(대표는 맹주 가문으로 잠긴다) → 출전 중인 가주 → 쉬는 가주 가운데 공훈이 낮은 둘(잃어도 덜 아픈 가문)을 흡수한다.
//   대표: 맹주 가문 · 아니면 출전 중인 가문 가운데 공훈이 가장 큰 곳 · 아니면 셋 가운데 공훈이 가장 큰 곳.
//   더 하지 않는다: 남는 가문이 BOTKEEP(4) 밑이 되면 · 출전 셋이 모두 합일했으면 · 이번 세대에 이미 BOTFUSEMAX(3) 번 했으면. 단 문턱 앞인데 출전에 합일한 이가 없으면 가문이 셋 넘게 남는 한 한 번 더
const FUSE_KEEP = +(process.env.BOTKEEP || 4), FUSE_MAX = +(process.env.BOTFUSEMAX || 3), FUSE_TARGET = +(process.env.BOTFUSET || 3);
function fusedIn() { return D.persons(s).filter(p => p.dep && p.who.fz).length; }
function fuseGen() { return (st.fuseG || {})[D.genNow ? D.genNow(s) : 1] || 0; }
function fusedAll() { return D.persons(s).filter(p => (p.role === 'hero' || p.role === 'bear') && p.who.fz).length; }      // 살아 있는 합일한 가주 (쉬는 이 포함)
function fuseWant() { return !OLD && !!s.crest && fuseGen() < FUSE_MAX && fusedAll() < FUSE_TARGET && D.charList(s).length - 2 >= FUSE_KEEP; }      // 2.2.9: 합일한 가주를 FUSE_TARGET 만큼 두고, 하나가 떠나면 다시 (가문이 KEEP 넘게 남는 동안)
function lifeLeft(c) { const e = c.role === 'hero' ? s.chars[s.hero] : c.who, L = D.ageLife ? D.ageLife(s, e) : null; return L && L.left != null ? L.left : 99; }
//   2.2.9: 대표는 남은 해가 가장 긴 가주 (늙은 이를 올리면 곧 천수를 다해 그 가문의 8단이 사라진다 — 다음 가주는 제 단으로 선다). 맹주가 늙었으면 셋에 넣지 않는다 (넣으면 맹주 가문이 대표로 잠긴다).
//     흡수할 둘도 남은 해가 긴 이부터 (그 해를 대표가 받는다 — DS.fuse)
function fusePick(cs) {
  const by = cs.slice().sort((a, b) => lifeLeft(b) - lifeLeft(a) || (b.dep ? 1 : 0) - (a.dep ? 1 : 0));
  const top = by[0], hero = cs.filter(c => c.role === 'hero')[0];
  const pool = by.filter(c => c !== top && !(hero && c === hero && top !== hero));
  if (pool.length < 2) return null;
  const tail = pool.slice().sort((a, b) => lifeLeft(b) - lifeLeft(a) || (a.dep ? 1 : 0) - (b.dep ? 1 : 0));      // 흡수된 둘의 남은 해를 대표가 받는다 — 남은 해가 긴 둘 (출전하지 않는 이 먼저)
  return [top].concat(tail.slice(0, 2)).map(c => c.key);
}
function fuseRepOf(sv, keys) {
  const who = keys.map(k => D.pByKey(sv, k)), lock = D.fuseRepLock(sv, who); if (lock) return lock.id;
  return D.whoHouse(sv, who[0]).id;      // fusePick 이 맨 앞에 둔 이 (남은 해가 가장 긴 가주)
}
function fuseMaybe(gate) {
  if (OLD || !s.crest || D.fuseCands(s).length < D.FUSE_N) return 0;
  if (!(gate || fuseWant())) return 0;
  if (!fuseWant() && !(gate && !fusedAll() && D.charList(s).length - 2 >= 2)) return 0;      // 문턱 앞인데 합일한 가주가 하나도 없으면 가문이 둘 남더라도 한 번 더 (다시 합일하지 않으면 나아가지 못한다)
  const n0 = D.charList(s).length, k = D.fuseAuto(s, 1, { pick: fusePick, rep: fuseRepOf });
  if (k) { const LF = D.lastFuse || {}, g = D.genNow ? D.genNow(s) : 1; st.fuse += k; st.fuseG = st.fuseG || {}; st.fuseG[g] = (st.fuseG[g] || 0) + k; st.fuseAt = (st.fuseAt || []).concat([Object.keys(s.cleared).length]); st.shut = (st.shut || []).concat((LF.gone || []).map(g => g.cls + '@' + Object.keys(s.cleared).length)); st.log.push('fuse @' + Object.keys(s.cleared).length + ' h' + ((st.simT + st.over) / 3600).toFixed(1) + ' left ' + (D.ageLife(s, LF.repWho === D.heroPs(s) ? s.chars[s.hero] : LF.repWho).left) + ' (+' + LF.ls + ') rep ' + LF.repCls + ' absorbs ' + (LF.gone || []).map(g => g.cls).join(',') + ' houses ' + n0 + '→' + D.charList(s).length); }
  return k;
}
// 2.6.0 떠난 이의 장비는 가방으로: 뒤를 이은 가주 · 맹주는 빈 칸으로 선다 — 사람이 「장비 자동 착용」을 누르듯 다시 입힌다.
//   ① 뒤를 이은 이(빈 칸이 있는 가문)는 먼저 선대가 입던 것을 가방에서 찾아 입는다 (사람이 「아버지 것을 아들에게」 하듯 — 출전 셋이 그 가문의 장비를 먼저 집어 가 후계가 남은 것만 입지 않게)
//   ② 출전 셋이 가방에서 가장 좋은 것을 고르고(DS.lootAutoEquip) ③ 쉬는 가문은 그래도 빈 칸이 있을 때만 남은 것으로 채운다 (쉬는 가문의 멀쩡한 장비는 예전처럼 건드리지 않는다)
const worn = {};      // 가문 번호 → { w, a } 그 가문이 마지막으로 입고 있던 것
function seatedCh(ch) { return !ch.vac && !ch.down && (ch.id === s.hero || !!D.bearer(s, ch, 1)); }
function equipAll() {
  if (!process.env.BOTNOKEEP) D.charList(s).forEach(ch => { const o = worn[ch.id]; if (!o || !seatedCh(ch)) return; ['w', 'a'].forEach(sl => { if (!ch[sl] && o[sl] && s.gear[o[sl]] > 0 && D.equip(s, ch, o[sl])) st.reKeep = (st.reKeep || 0) + 1; }); });
  D.lootAutoEquip(s);
  D.charList(s).forEach(ch => { if (s.party.indexOf(ch.id) >= 0 || !seatedCh(ch) || (ch.w && ch.a)) return; if (D.autoEquip(s, ch)) st.reEquip = (st.reEquip || 0) + 1; });
  D.charList(s).forEach(ch => { const o = worn[ch.id] = worn[ch.id] || {}; ['w', 'a'].forEach(sl => { if (ch[sl]) o[sl] = ch[sl]; }); });
}
function prep() {
  tidy();
  if (!OLD) equipAll();      // 2.6.0: 출전을 고르기 전에 — 빈손인 새 가주가 전투력 차례에서 밀리지 않게
  if (D.linAutoWed) {      // 혼인: 막사에 맹주와 같은 병과가 한 사람뿐이면 그이는 짝으로 고르지 않는다 (맹주의 뒤를 받칠 사람 — 사람이 하듯)
    const hc = s.chars[s.hero], bk = hc && !OLD ? D.barracks(s).filter(m => D.sbFits(hc, m)) : [], keep = bk.length === 1 ? bk[0] : null, sx0 = keep && keep.sx;
    if (keep && hc.sx) keep.sx = hc.sx;
    try { D.linAutoWed(s); } finally { if (keep) keep.sx = sx0; }
  }
  if (OLD) { oldRecruit(); tidy(); } else { recruit(); sendKin(); tidy(); }
  fuseMaybe();      // 2.2.9: 서로 다른 세 가문의 가주 셋 (7단 Lv10) — 대표를 고르고 두 가문을 잃는다 (fuseMaybe)
  if (!OLD && D.sortieSet) {      // 2.2.8: 출전은 가장 센 가주 둘 (사람이 하듯 — 싸우기 전에 본다). 2.2.9: 합일한 가주(8단~)는 늘 나가고, 합일을 더 할 셈이면 남은 자리에 7단 Lv10 에 가장 가까운 가주를 (쉬면 30% 라 끝내 못 모인다)
    const rank = D.sortieRank(s); let r = rank.slice(0, 2);
    if (fuseWant()) {
      const fz = rank.filter(ch => { const b = D.bearer(s, ch); return b && b.fz; });
      const near = rank.filter(ch => { const b = D.bearer(s, ch); return b && !b.fz && D.pL(b) < 70 && D.pL(b) >= 55; }).sort((a, b) => D.pL(D.bearer(s, b)) - D.pL(D.bearer(s, a)));
      if (near.length) { r = fz.slice(0, 1).concat(near).slice(0, 2); rank.forEach(ch => { if (r.length < 2 && r.indexOf(ch) < 0) r.push(ch); }); st.fuseTrain = (st.fuseTrain || 0) + 1; }
    }
    r = r.map(ch => ch.id); const cur = (s.sortie || []).map(e => e.h);
    if (r.slice().sort().join() !== cur.slice().sort().join()) { D.sortieSet(s, r); st.sortieSw = (st.sortieSw || 0) + 1; }
  }
  if (OLD) D.lootAutoEquip(s); else equipAll(); heal(false); shop();      // 2.2.8: 봇은 싸움 사이 체력을 잇지 않는다 (늘 가득) — 교회 값은 시나리오에 들어갈 때만 낸다 (들판 싸움마다 내던 것은 작은 무리의 벌이를 모두 먹었다)
  check('prep');
}
// 한 싸움: specs 를 starts(또는 x,y 근처)에 세우고 끝날 때까지. 돌려주는 것: 'win' | 'lose' | 'end'
let curTries = 0; const RETREAT_TRIES = +(process.env.BOTRETTRIES || 3);      // 2.2.9: 한 판에서 처음 몇 번만 물러난다 (그 뒤로는 끝까지 — 물러나기만 하면 나아가지 못한다)
const RETREAT = process.env.BOTRETREAT !== '0', RETREAT_AT = +(process.env.BOTRETREAT || 2), RETREAT_HP = +(process.env.BOTRETHP || 0.15);      // 2.2.9: BOTRETREAT=0 이면 예전처럼 끝까지 싸운다 (수 = 몇째로 쓰러질 때 물러나는가)
function run(sim, mode, zid, maxT) {
  let res = null, quiet = 0, fell = 0;
  const born = sim.t;
  while (!res) {
    sim.update(STEP);
    const evs = sim.drain();
    for (const e of evs) {
      if (e.t === 'reward') {
        s.gold += Math.round(e.gold * D.BAL.gold); s.kills++;
        if (mode === 'scn') e.scn = 1; else e.zone = zid;
        try { D.rollDrop(s, e, rnd); } catch (x) {}
        D.gainExp(s, e.exp, e.L);
      } else if (e.t === 'die') {
        const u = sim.byId[e.id]; if (!u) continue;
        if (u.side === 'ally' && !e.flee) {
          if (u.role === 'cmd' && mode === 'scn' && RETREAT && !res) fell++;      // 2.2.9: 시나리오에서 가주 · 맹주가 둘째로 쓰러지면 남은 이를 지키러 물러난다 (사람이 하듯 — 쓰러짐 창의 「퇴각」)
          if (u.role === 'cmd') {
            const ch = s.chars[u.ch]; if (!ch) continue;
            if (u.ch === s.hero) { if (ch.ps && D.pL(ch.ps) > 70) { st.xDeaths = (st.xDeaths || 0) + 1; st.log.push('8+ hero died L' + D.pL(ch.ps) + ' @' + Object.keys(s.cleared).length); } ch.down = true; st.heroDeaths++; st.deaths++; st.dAt[where] = (st.dAt[where] || 0) + 1; st.log.push('hero died ' + mode + (zid ? ' ' + zid : '') + ' L' + D.pL(ch.ps) + ' houses ' + D.partyIds(s).length + ' @h' + ((st.simT + st.over) / 3600).toFixed(2)); }
            else { const bm = D.bearer(s, ch); if (bm) { if (D.pL(bm) > 70) { st.xDeaths = (st.xDeaths || 0) + 1; st.log.push('8+ died ' + ch.cls + ' L' + D.pL(bm) + ' @' + Object.keys(s.cleared).length); } if (bm.it) D.giveMercItem(s, bm.id, null); const lost = D.loseMerc(s, bm.id); if (lost) { s.fallen = D.fallenTrim((s.fallen || []).concat([D.fallenRecord(lost, mode)])); D.linMercDied(s, lost, mode); st.deaths++; st.dAt[where] = (st.dAt[where] || 0) + 1; st.bearDeaths++; st.bdc[ch.cls] = (st.bdc[ch.cls] || 0) + 1; } } }
          } else if (u.role === 'merc' && u.mid) {
            const lost = D.loseMerc(s, u.mid); if (lost) { s.fallen = D.fallenTrim((s.fallen || []).concat([D.fallenRecord(lost, mode)])); D.linMercDied(s, lost, mode); st.deaths++; st.dAt[where] = (st.dAt[where] || 0) + 1; st.kinDeaths++; st.log.push('kin died ' + mode + ' L' + D.pL(lost) + ' party L' + D.partyL(s) + ' age ' + D.ageOf(s, lost)); }
          }
        } else if (u.side === 'enemy' && e.by) {
          const ku = sim.byId[e.by]; let km = null;
          if (ku && ku.role === 'merc' && ku.mid) km = s.mercs.find(m => m.id === ku.mid);
          else if (ku && ku.role === 'cmd' && ku.side === 'ally' && s.chars[ku.ch]) km = D.bearer(s, s.chars[ku.ch]);
          if (km) { km.k = (km.k || 0) + 1; D.meritAdd(km, u.role === 'boss' ? 6 : 1, s); }
        }
      } else if (e.t === 'atk') {      // 2.2.6: 가문마다 평타 수
        const u = sim.byId[e.id]; if (u && u.side === 'ally' && u.role === 'cmd') { const k = hcls(sim, u); if (k) st.atkN[k.replace('+', '')] = (st.atkN[k.replace('+', '')] || 0) + 1; }
      } else if (e.t === 'skill') {      // 2.2.6: 기술 · 필살기 쓴 수 (준 피해는 아래 hurt 감싸기)
        const u = sim.byId[e.id]; if (!u || u.side !== 'ally' || u.role !== 'cmd') continue;
        const S = D.SKILLS[e.sk]; if (!S) continue;
        if (S.ult) { const k = hcls(sim, u) || '?'; st.ult[k + ':' + e.sk] = (st.ult[k + ':' + e.sk] || 0) + 1; st.uAt[where] = (st.uAt[where] || 0) + 1; } else st.sk[e.sk] = (st.sk[e.sk] || 0) + 1;
      } else if (e.t === 'shade') { st.shade = (st.shade || 0) + 1; if (e.auto) st.shadeAuto = (st.shadeAuto || 0) + 1; st.shAt = st.shAt || {}; st.shAt[where] = (st.shAt[where] || 0) + 1;
      } else if (e.t === 'shadeEnd') { st.shadeEnd = st.shadeEnd || {}; st.shadeEnd[e.why] = (st.shadeEnd[e.why] || 0) + 1;
      } else if (e.t === 'win') res = 'win';
      else if (e.t === 'lose') res = 'lose';
    }
    if (sim.result) res = sim.result;
    const mayRet = mode !== 'scn' || curTries <= RETREAT_TRIES;
    if (mayRet && fell >= RETREAT_AT && !res && sim.units.some(u => !u.dead && u.side === 'ally' && u.role === 'cmd')) { res = 'retreat'; st.retreats = (st.retreats || 0) + 1; }
    if (RETREAT && mayRet && !res && sim.units.some(u => !u.dead && u.side === 'ally' && u.role === 'cmd' && u.tier >= 8 && u.hp < u.mhp * RETREAT_HP * (u.hero ? 2 : 1))) {      // 합일한 맹주는 더 일찍 (맹주가 쓰러지면 퇴각해도 떠난다)      // 2.2.9: 합일한 가주(8단~)가 위태로우면 물러난다 — 시나리오는 퇴각(진 판), 들판은 싸움을 버리고 떠난다 (8단은 다시 얻기 어렵다)
      if (mode === 'scn') { res = 'retreat'; st.retreats = (st.retreats || 0) + 1; st.retX = (st.retX || 0) + 1; } else { res = 'end'; st.fieldRet = (st.fieldRet || 0) + 1; }
    }
    if (mode === 'zone' && !res) {
      const foes = sim.units.filter(u => !u.dead && u.side === 'enemy');
      if (!foes.length) res = 'end';
      if (!sim.combat) quiet += STEP; else quiet = 0;
      if (quiet > 12 && sim.t - born > 15) res = 'end';
    }
    if (sim.t - born > maxT) res = res || 'end';
  }
  const dt = sim.t - born; st.simT += dt; s.time = (s.time || 0) + dt; D.ageAdvance(s, dt);
  return res;
}
{ const h0 = D.Sim.prototype.hurt, r0 = D.Sim.prototype.resolve;      // 2.2.6: 가문(병과)마다 실제로 깎은 체력 (넘친 피해는 빼고) · 무엇으로 깎았는가(기술 · 평타 · 상태 · 부른 것) — 균형 보기
  st.dsk = {};
  D.Sim.prototype.resolve = function (u) { const p = this._bsk; this._bsk = arguments[1]; try { return r0.apply(this, arguments); } finally { this._bsk = p; } };
  D.Sim.prototype.hurt = function (v, dmg, src, o) {
    if (src && v && !v.dead && v.side === 'enemy' && src.side === 'ally' && src.role === 'shade') st.shadeDmg = (st.shadeDmg || 0) + Math.min(dmg, Math.max(0, v.hp));      // 2.5.0: 그림자가 깎은 체력
    if (src && v && !v.dead && v.side === 'enemy' && src.side === 'ally') {
      const k = hcls(this, src); if (k) { const a = Math.min(dmg, Math.max(0, v.hp)); st.dmg[k] = (st.dmg[k] || 0) + a; const how = src.role === 'summon' ? 'summon' : o && (o.type === 'burn' || o.type === 'poison') ? o.type : o && o.refl ? 'ctr' : this._bsk || 'basic'; const kk = k.replace('+', '') + ':' + how; st.dsk[kk] = (st.dsk[kk] || 0) + a; }
    }
    return h0.apply(this, arguments);
  }; }
function hcls(sim, u) {      // 그 유닛이 어느 가문(병과) 몫인가: 가주 · 맹주는 제 가문, 부른 것은 부른 이의 가문, 가문원(맹주 가문)은 kin
  for (let n = 0; u && n < 3; n++) {
    if (u.role === 'cmd' && s.chars[u.ch]) { const ch = s.chars[u.ch]; return ch.cls + (D.risen && D.risen(ch) ? '+' : ''); }      // + : 합일한 마스터 (8단~)
    if (u.role === 'merc') return 'kin';
    u = u.owner != null ? sim.byId[u.owner] : null;
  }
  return null;
}
// 2.5.0 이름 부르기: 출전(시나리오 · 갱도)마다 게임처럼 부를 이름을 단다 — 봇의 맹주는 자동이라 엔진(shadeTick)이 위태로울 때 스스로 부른다. BOTSHADE=0 이면 없이
const SHADE = process.env.BOTSHADE !== '0';
function arm(sim) { if (SHADE && D.shadeArm) D.shadeArm(sim, s); }
if (D.SHADE) { if (process.env.SHADEK) D.SHADE.k = +process.env.SHADEK; if (process.env.SHADEHK) D.SHADE.hk = +process.env.SHADEHK; if (process.env.SHADEDUR) D.SHADE.dur = +process.env.SHADEDUR; if (process.env.SHADELOW) D.SHADE.low = +process.env.SHADELOW; if (process.env.SHADESHUN) D.SHADE.shun = +process.env.SHADESHUN; }      // 조율용
function place(sim, specs, starts, x, y) {
  const pos = starts ? D.formation(specs, starts) : null;
  let first = null;
  specs.forEach((u, i) => { const p = pos ? pos[i] : [x, y]; u.x = p[0]; u.y = p[1]; u.auto = true; const nu = sim.add(u); if (nu && nu.role === 'cmd' && !first) first = nu; });
  sim.leader = first && first.id; sim.hunt = true;
}
function after(scnWin, sc) {
  if (sc && D.linAfterScn) D.linAfterScn(s, { win: scnWin, cmds: [], mercs: [] });
  const ev = D.ageCheck(s, sc ? sc.name : '들판').concat(D.linSettle(s, sc ? sc.name : '들판'));
  ev.forEach(e => { if (e.t === 'birth') st.births++; if (e.t === 'death' && e.nat) { const q = s.lin.P[e.a], x = q && q.snap && (q.snap.fz || q.snap.L > 70); if (x) st.xNat = (st.xNat || 0) + 1; st.log.push('천수 ' + (e.k || '') + (x ? ' 8+' : '') + ' @h' + ((st.simT + st.over) / 3600).toFixed(1) + ' yr' + D.calNow(s).yr); } });
  tidy();
  check(sc ? 'scn' : 'field');
}
function farmL() {      // 들판의 기준 레벨: 보통은 부대 평균, 단 문턱(8단·9단) 앞에서는 가장 앞선 사람 쪽으로 (그 사람이 경험치를 제대로 받게)
  const sc = D.nextScn ? D.nextScn(s) : null, L = D.partyL(s);
  if (!sc || !(sc.tier > D.partyTier(s))) return L;
  let top = 0; D.persons(s).forEach(p => { if (p.dep && (p.who.fz || DS_pL(p.who) < 70)) top = Math.max(top, DS_pL(p.who)); });
  return Math.max(L, Math.min(top, L + 8));
}
function DS_pL(w) { return D.pL(w); }
function farmZone() {
  const L = farmL(); let best = null;
  Object.keys(D.ZONES).forEach(k => { const Z = D.ZONES[k]; if (Z.town || !Z.L) return; if (Z.L[0] <= L + 2 && (!best || Z.L[0] > D.ZONES[best].L[0])) best = k; });
  return best || 'dawn';
}
function fieldFight() {
  const zid = farmZone(), z = zone(zid), L = farmL(); where = 'f:' + zid;
  let gs = z.spawns.filter(g => g.L <= L + 1); if (!gs.length) gs = z.spawns.slice().sort((a, b) => a.L - b.L).slice(0, 2);
  const g = gs[Math.floor(rnd() * gs.length)];
  const sim = new D.Sim({ map: z.rows, mode: 'zone', spawns: [D.packOf ? D.packOf(g, D.partySpecs(s).length) : { id: g.id, x: g.x, y: g.y, L: g.L, list: g.list.slice() }],      // 2.2.2: 무리는 유닛 수만큼 불어난다 (게임과 같다) seed: (rnd() * 1e6 | 0) + 1, inv: s.items,
    mk: (type, o) => (D.fieldSpec ? D.fieldSpec(type, o.L, { x: o.x, y: o.y, grp: o.grp, zone: zid, save: s }) : D.enemySpec(type, o.L, { x: o.x, y: o.y, grp: o.grp, diff: 0.72, zone: zid, save: s })) });
  const p = sim.freeNear(g.x, Math.min(z.h - 2, g.y + 5), 'foot', 8) || sim.freeNear(g.x, g.y, 'foot', 10) || { x: g.x, y: g.y };
  place(sim, D.partySpecs(s), null, p.x, p.y);
  const t0f = st.simT, r = run(sim, 'zone', zid, 150);
  st.fieldT += st.simT - t0f + FIELD_OVER;
  st.field++; st.over += FIELD_OVER; s.time += FIELD_OVER; D.ageAdvance(s, FIELD_OVER);
  after(false, null);
  return r;
}
// BOTPIT=1: 5단부터는 들판 대신 갱도에서 키를 다진다 — 부대 평균에 맞는 가장 깊은 층(DS.pitFarm: 권장 ≤ 평균, 열린 층 안에서). 사람이 「같은 층 다시 · 다음 층」으로 하듯
function pitFight(f) {
  where = 'p' + f;
  const sc = D.pit(f), b = D.buildScenario(sc, D.partySpecs(s).length, s.chars[s.hero] ? s.chars[s.hero].cls : 'inf');
  const sim = new D.Sim({ map: b.map, units: b.units, mk: b.mk, objective: b.objective, waves: b.waves, seed: (rnd() * 1e6 | 0) + 100 + f, inv: s.items, mode: 'scn' });
  sim.heroId = 'c' + s.hero;
  if (D.linBattleStart) D.linBattleStart(s);
  place(sim, D.partySpecs(s), b.start); arm(sim);
  const r = run(sim, 'scn', null, 900);
  st.pit = (st.pit || 0) + 1; st.over += PIT_OVER; s.time += PIT_OVER; D.ageAdvance(s, PIT_OVER);
  if (r === 'win') { const out = D.applyClear(s, sc); try { D.pitLoot(s, f, rnd); } catch (x) {} st.pitBest = Math.max(st.pitBest || 0, f); if (out.tickets) st.pitTickets = (st.pitTickets || 0) + out.tickets; }
  else { st.pitLoss = (st.pitLoss || 0) + 1; st.log.push('pit loss f' + f + ' L' + D.partyL(s)); }
  after(r === 'win', sc);
  return r === 'win';
}
function scenario(sc) {
  where = 's' + sc.id; heal(true);
  const b = D.buildScenario(sc, D.partySpecs(s).length, s.chars[s.hero] ? s.chars[s.hero].cls : 'inf');
  const sim = new D.Sim({ map: b.map, units: b.units, mk: b.mk, objective: b.objective, waves: b.waves, seed: (rnd() * 1e6 | 0) + sc.id, inv: s.items, mode: 'scn' });
  sim.heroId = 'c' + s.hero;
  if (D.linBattleStart) D.linBattleStart(s);
  place(sim, D.partySpecs(s), b.start); arm(sim);
  const t0s = st.simT, r = run(sim, 'scn', null, 900);
  if (!st.tAt[sc.id]) st.tAt[sc.id] = Math.round(st.simT - t0s);      // 2.2.7: 처음 싸운 길이 (초)
  st.scn++; st.over += SCN_OVER; s.time += SCN_OVER; D.ageAdvance(s, SCN_OVER);
  if (r === 'win') {
    sim.units.forEach(u => { if (u.dead || u.side !== 'ally') return; const m = u.role === 'merc' && u.mid ? s.mercs.find(x => x.id === u.mid) : u.role === 'cmd' ? D.bearer(s, s.chars[u.ch]) : null; if (m) { D.meritAdd(m, 10 * (u.role === 'cmd' ? (D.BN.meritK || 1) : 1), s); m.b = (m.b || 0) + 1; } });
    D.charList(s).forEach(c => { if (s.party.indexOf(c.id) < 0) D.hAdd(s, c, D.BN.bench); });
    const out = D.applyClear(s, sc); try { D.bossLoot(s, sc, out.first, rnd); } catch (x) {}
    if (D.chAuto) { const ch = D.chAuto(s, sc, out); if (ch) st.choices = (st.choices || 0) + 1; }      // 2.5.0 판의 선택지: 봇은 묻지 않고 a (화면의 선택 창에 걸리지 않게)
  }
  after(r === 'win', sc);
  return r === 'win';
}
function partyTier() { return D.partyTier(s); }
function capL() { const ids = s.party || []; let t = 0, n = 0; ids.forEach(id => { const ch = s.chars[id]; if (!ch) return; const b = id === s.hero ? ch.ps : D.bearer(s, ch); t += b ? D.pCap(b) : ch.L; n++; }); return n ? Math.floor(t / n) : 100; }
// 들어갈 레벨: 2.2.3 — 잰 표의 「안전」(DS.recSafe: 열 번 다 이기고 쓰러지는 이가 드문 레벨), 없으면 권장. 사람이 권장을 넘겨 조금 더 다지고 들어가듯
//   조율용(tools/calib.js 의 재료): BOTFOCUS=N BOTD=d — N번만 2.2.2 의 권장(OLD_REC) + d 에 들어가고 나머지는 OLD_REC 그대로. N번 직전의 판을 BOTSNAP 에 쓰고 끝낸다
const OLD_REC = { 1: 2, 2: 4, 3: 6, 4: 9, 5: 11, 6: 15, 7: 21, 8: 24, 9: 26, 10: 29, 11: 31, 12: 34, 13: 36, 14: 39, 15: 42, 16: 45, 17: 47, 18: 50, 19: 53, 20: 55, 21: 66, 22: 67, 23: 68, 24: 70, 25: 71, 26: 73, 27: 79, 28: 80, 29: 81, 30: 82 };
const FOCUS = +(process.env.BOTFOCUS || 0), FD = +(process.env.BOTD || 0);
const PLUS = +(process.env.BOTPLUS || 0);      // 2.2.8 조율용: 들어갈 레벨에 더하는 몫
function target(sc) { if (PLUS) return (D.recSafe ? D.recSafe(sc) : D.recL(sc)) + PLUS; if (FOCUS) return Math.max(1, OLD_REC[sc.id] + (sc.id === FOCUS ? FD : 0)); if (process.env.BOTREC) return D.recL(sc); return D.recSafe ? D.recSafe(sc) : D.recL(sc); }      // 2.2.7 BOTREC=1: 권장(DS.recL)에 닿으면 들어간다 (권장 표 확인 — 처음 싸움의 이김 · 쓰러짐을 ft 에)
// BOTNOFIELD=1 (2.2.4): 들판에 나가지 않는 사람 — 권장(DS.recL)에 못 미치면 깬 시나리오 가운데 가장 뒤의 것을 다시 한다(시나리오마다 많아야 BOTREPLAY=6 번), 그래도 못 미치면 그냥 들어간다.
//   단 문턱에 막히거나 세 번 지면 또 앞 시나리오를 다시 한다 (시나리오만 되풀이). 들어갈 때의 레벨 − 권장을 eL · rAt 로 남긴다
const NOFIELD = !!process.env.BOTNOFIELD;
function replay() { const L = D.partyL(s), ks = Object.keys(s.cleared).map(Number).filter(k => s.cleared[k] && k <= 30).sort((a, b) => b - a); const n = ks.find(k => D.recL(D.scn(k)) <= L) || ks[ks.length - 1] || 0; if (!n) return fieldFight(); st.replays = (st.replays || 0) + 1; return scenario(D.scn(n)); }      // 깬 시나리오 가운데 권장이 지금 레벨 이하인 가장 뒤의 것 (없으면 1번)
function farm() { if (NOFIELD) return replay(); const f = process.env.BOTPIT && D.partyTier(s) >= 5 && D.pitFarm ? D.pitFarm(s) : 0; return f ? pitFight(f) : fieldFight(); }
const t0 = Date.now();
let stuck = false;
const FORCE_AT = +(process.env.BOTLAPSE || 0); let forced = false;
function campaign(getSc, done, tag) {
for (let n = 1; n <= 30 && !stuck; n++) {
  if (st.restart) { st.restart = 0; if (tag) return 'lapse'; n = 0; continue; }      // 2.3.2: 대가 끊겼다 — 1번부터 다시 (다음 세대의 장이었으면 그 장은 닫혔다: 밖에서 본편을 다시)
  const sc = getSc(n); let tries = 0, fields = 0; if (!sc) continue;
  while (!done(n) && !st.restart) {
    prep(); if (st.restart) break;
    if (sc.tier > partyTier()) {
      if (fuseMaybe(true)) continue;
      farm(); fields++; if (fields > MAX_FIELD) { stuck = true; break; } continue;
    }
    if (NOFIELD && !tries && D.partyL(s) < D.recL(sc) && fields < +(process.env.BOTREPLAY || 6)) { farm(); fields++; continue; }      // 시나리오만: 권장에 못 미치면 앞 시나리오를 몇 번 다시
    if (NOFIELD && tries >= 3 && tries % 3 === 0 && fields < tries * 4 + 6) { farm(); fields++; continue; }      // 시나리오만: 세 번 지면 앞 시나리오를 몇 번 다시
    const learn = process.env.BOTNOLEARN ? 0 : 2 * Math.min(n >= 21 ? 6 : 3, tries);      // 2.2.9: 21번부터는 여섯째 패배까지 (합일한 이는 100 까지 자란다 — 물러난 판은 더 다지고)      // 2.2.8: 지면 두 레벨 더 다지고 다시 (셋째 패배까지 — 사람이 하듯. BOTNOLEARN=1 이면 예전처럼 곧장 다시)
    if (!NOFIELD && D.partyL(s) < Math.min(target(sc) + (D.partySpecs(s).length < 3 ? 3 : 0) + learn, capL()) && fields < MAX_FIELD) { farm(); fields++; continue; }      // 2.2.9: 출전한 이가 모두 제 상한(합일 전 70)이면 더 다지지 못한다 — 그 자리에서 들어간다      // 싸우는 이가 셋보다 적으면 권장보다 세 레벨 더 (사람이 하듯 조심스럽게)
    tries++; curTries = tries; if (tries === 1) st.eL[n] = D.partyL(s);
    if (process.env.BOTSNAP && tries === 1 && !tag && (!FOCUS || FOCUS === n)) { require('fs').writeFileSync(require('path').join(process.env.BOTSNAP, cls + '_' + seed + '_' + n + '.json'), JSON.stringify(s)); if (FOCUS) process.exit(0); }      // 조율용(tools/calib.js): 시나리오 N 에 처음 들어가기 직전의 판
    const d0 = st.deaths, ok = scenario(sc); if (st.restart) break;
    if (tries === 1) st.ft[n] = [ok ? 1 : 0, st.deaths - d0, D.partyL(s) >= 0 ? st.eL[n] : 0];      // 2.2.7: 처음 싸움 [이김, 쓰러진 수, 들어간 레벨]
    if (!ok) { st.wipes++; st.wAt[n] = (st.wAt[n] || 0) + 1; st.log.push('wipe @' + n + ' try ' + tries + ' L' + D.partyL(s) + '/' + target(sc)); if (tries > 40) { stuck = true; break; } }
  }
  if (st.restart) { n--; continue; }      // 위 for 머리에서 1번으로
  if (FORCE_AT && !forced && !tag && n >= FORCE_AT) { if (forceLapse()) { forced = true; n--; continue; } }      // n번부터, 끊을 수 있는 첫 판에서
  if (process.env.BOTSAVE && !tag && n === +(process.env.BOTSAVEAT || 15)) { require('fs').writeFileSync(process.env.BOTSAVE, JSON.stringify(s)); console.log('saved', process.env.BOTSAVE); process.exit(0); }      // 화면 시험용: N번을 깬 판을 저장 글로
  { const Hn = (st.simT + st.over) / 3600; (st.lapses || []).forEach(L => { if (L.back == null && !tag && n >= L.top) { L.back = +(Hn - L.h).toFixed(2); L.backAt = +Hn.toFixed(2); } }); }      // 2.3.2: 잃은 길(top 번까지)을 되찾은 데 든 시간
  st.perScn.push({ n: tag + n, h: +((st.simT + st.over) / 3600).toFixed(2), L: D.partyL(s), units: D.partySpecs(s).length, vac: D.bnEmpty(s).length, tries, houses: D.charList(s).length, fh: +(st.fieldT / 3600).toFixed(2), rec: target(sc), rL: D.recL(sc) });
}
}
campaign(n => D.scn(n), n => !!s.cleared[n], '');
st.restart = 0;
const main = { hours: +((st.simT + st.over) / 3600).toFixed(2), cleared: Object.keys(s.cleared).length, wipes: st.wipes, deaths: st.deaths };
let g2 = null;
if (gen2 && !stuck && s.cleared[30]) {      // 다음 세대의 장: 스무 해 창을 정책대로 치르고(DS.egRunAuto) 2대째 1~30번
  tidy();
  let sr = null;      // 2.8 마지막 물결: 다음 세대의 장을 열기 전에, 모두 함께 끝없는 물결을 막는다 (같은 엔진 · 모두 자동). 막은 물결 = 평화의 해 = 스무 해 창의 길이
  if (D.standRun && !process.env.BOTNOSTAND) {
    sr = D.standRun(s, { seed: (rnd() * 1e6 | 0) + 1 });
    D.standClose(s, sr); st.simT += sr.t; s.time = (s.time || 0) + sr.t; D.ageAdvance(s, sr.t); check('stand');
  }
  const e0 = D.egStart(s);
  if (e0) {
    st.wake = (s.fzWake || []).slice();      // 2.2.9: 세대가 바뀌어 깨어난 가문
    const r = D.egRunAuto(s, { heir: 'first', keep: 'light', hand: true, call: 'heavy' }); tidy();
    const w0 = st.wipes, d0 = st.deaths, h0 = (st.simT + st.over) / 3600;
    const g2r = campaign(n => D.egScn(n, s.eg.gen, s), n => !!(s.eg && s.eg.c && s.eg.c[n]), 'g2.');
    if (g2r === 'lapse') { st.g2lapse = 1; st.restart = 0; campaign(n => D.scn(n), n => !!s.cleared[n], ''); st.restart = 0; }      // 2.3.2: 장 안에서 대가 끊기면 장이 닫힌다 — 본편 1~30 을 다시
    g2 = { gen: s.eg.gen, stand: sr ? { w: sr.w, r: sr.r, b: sr.b, k: sr.k, p: sr.p, t: sr.t, allies: sr.allies, last: sr.last } : null, peace: (s.eg.hist.filter(h => h.g === 1)[0] || {}).p || null, pass: r, cleared: Object.keys((s.eg && s.eg.c) || {}).length, hours: +((st.simT + st.over) / 3600 - h0).toFixed(2), wipes: st.wipes - w0, deaths: st.deaths - d0, units: D.partySpecs(s).length };
  }
}
const H = (st.simT + st.over) / 3600;
const out = { cls, seed, main, g2, hours: +H.toFixed(2), choices: st.choices || 0, heirlooms: Object.keys(s.gh || {}).filter(k => s.gh[k] && s.gh[k].hl).length, reEquip: st.reEquip || 0, reKeep: st.reKeep || 0, bare: D.gearBare ? D.gearBare(s).length : 0, bag: Object.keys(s.gear || {}).reduce((n, k) => n + s.gear[k], 0), shade: st.shade || 0, shadeAuto: st.shadeAuto || 0, shadeDmg: Math.round(st.shadeDmg || 0), shadeEnd: st.shadeEnd || {}, shAt: st.shAt || {}, cleared: Object.keys(s.cleared).length, wipes: st.wipes, deaths: st.deaths, heroDeaths: st.heroDeaths, bearDeaths: st.bearDeaths, kinDeaths: st.kinDeaths, bdc: st.bdc, dmg: st.dmg, dsk: st.dsk, atkN: st.atkN, sk: st.sk, ult: st.ult, dAt: st.dAt, wAt: st.wAt, uAt: st.uAt, tAt: st.tAt, ft: st.ft, hcls: D.charList(s).map(c => c.cls),
  vacMax: st.vacMax, vacAvg: +(st.vacSum / Math.max(1, st.vacN)).toFixed(2), vacEnd: D.bnEmpty(s).length, recruits: st.recruits, recruitGold: st.recruitGold, tickets: st.tickets, kinSent: st.kinSent, sbSeat: st.sbSeat,
  births: st.births, inv: invBad, pit: st.pit || 0, pitBest: st.pitBest || 0, pitLoss: st.pitLoss || 0, pitTickets: st.pitTickets || 0, pick: [st.pick1 || 0, st.pick2 || 0, st.pick3 || 0], fuse: st.fuse, lapse: st.lapse, lapses: st.lapses || [], g2lapse: st.g2lapse || 0, runs: s.runs || null, field: st.field, fieldH: +(st.fieldT / 3600).toFixed(2), opens: st.opens || 0, reopens: st.reopens || 0, houses: D.charList(s).length, openGold: st.openGold || 0, xDeaths: st.xDeaths || 0, xNat: st.xNat || 0, retreats: st.retreats || 0, retX: st.retX || 0, fieldRet: st.fieldRet || 0, fuseAt: st.fuseAt || [], shut: st.shut || [], wake: st.wake || [], fzEnd: D.persons(s).filter(p => p.who.fz).length, sortieSw: st.sortieSw || 0, fuseTrain: st.fuseTrain || 0,
  hAt: st.perScn.filter(p => !/^g/.test(p.n)).map(p => p.houses), LAt: st.perScn.filter(p => !/^g/.test(p.n)).map(p => p.L), eL: Object.keys(st.eL).map(k => st.eL[k]), replays: st.replays || 0, rAt: st.perScn.filter(p => !/^g/.test(p.n)).map(p => p.rL), hrAt: st.perScn.filter(p => !/^g/.test(p.n)).map(p => p.h), scn: st.scn, units: D.partySpecs(s).length, gold: s.gold, realS: +((Date.now() - t0) / 1000).toFixed(1), stuck };
if (process.env.BOTLOG) { console.log(st.log.join('\n')); console.log(st.perScn.map(p => p.n + ':' + p.h + 'h L' + p.L + ' u' + p.units + ' v' + p.vac + (p.tries > 1 ? ' t' + p.tries : '')).join('  ')); }
console.log(`${cls} seed${seed}: ${out.cleared}/30 in ${out.hours}h, wipes ${out.wipes}, deaths ${out.deaths} (hero ${out.heroDeaths}, bearer ${out.bearDeaths}, kin ${out.kinDeaths}), recruits ${out.recruits}, kin sent ${out.kinSent}, vacancies max ${out.vacMax}/avg ${out.vacAvg}`);
if (g2) console.log(`gen2: last stand ${g2.stand ? g2.stand.w + ' waves (reached ' + g2.stand.r + ', bosses ' + g2.stand.b + ', ' + g2.stand.allies + ' fought, ' + g2.stand.t + 's)' : 'skipped'}, peace ${g2.pass.years} years, ${g2.cleared}/30 in ${g2.hours}h, wipes ${g2.wipes}, deaths ${g2.deaths}`);
console.log('BOT ' + JSON.stringify(out));
module.exports = { s, st, out };
