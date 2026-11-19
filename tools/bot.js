// 전민 — 머리 없는 캠페인 봇 (2.2.0 「한 사람 한 사람」 규칙). 진짜 엔진(DS.Sim)과 진짜 규칙 함수로 30번까지 깬다.
//   node tools/bot.js [cls=inf] [seed=1] [gen2=0]          예: node tools/bot.js mag 3
//   BOTCHECK=1: 싸움 밖마다 자리 불변식 검사(tools/inv.js) — 어김은 「INV …」 줄, 요약의 inv 칸에 수
//   BOTSNAP=폴더: 시나리오마다 처음 들어가기 직전의 판을 <폴더>/<병과>_<씨앗>_<번호>.json 으로 (tools/calib.js 의 재료)
//   BOTSAVE=파일 BOTSAVEAT=15: 그 시나리오를 깬 판을 저장 글(JSON)로 쓰고 끝낸다 (화면 시험용 중반 저장)
//   끝에 한 줄 요약과 「BOT {json}」 (hours · cleared · wipes · deaths · vacancies · recruits …).
//
// 정책 (사람이 하듯이, 단순하게):
//   · 다음 시나리오의 권장 레벨(DS.recL)에 부대 평균(DS.partyL)이 닿을 때까지 들판에서 싸운다. 들판 = 부대 평균에 맞는 지역의 무리 하나
//     (그 무리 레벨이 평균 + 1 이하), 그 지역 지도 위에서 진짜 엔진으로. 걸어 다니는 시간은 싸움마다 FIELD_OVER 초를 더해 셈한다.
//   · 합일: 맹세의 깃대를 얻은 뒤 7단 Lv10 셋이 모일 때마다 교회에서 합일(DS.fuseAuto). 단 문턱(8단 · 9단) 앞에서는 가장 앞선 사람의 레벨 쪽 무리를 잡는다.
//   · 싸움 앞: 교회 치료(골드), 약초 다섯까지 사기, 가방의 더 좋은 장비 입히기(DS.lootAutoEquip), 맹주가 홀몸이면 혼인(DS.linAutoWed — 막사의 같은 병과가 하나뿐이면 그이는 빼고).
//   · 영웅 모집: 모집권은 바로 쓴다. 빈 가문(막사도 비었음)이 있으면 골드로도 부른다 (예비 골드 200 × 단은 남긴다).
//     빈 가문이 없어도 골드가 값의 세 배를 넘고 막사가 싸우는 가문 수의 절반보다 적으면 부른다. 병과는 무작위다 (게임 규칙 그대로).
//   · 맹주의 어른 아이(가문원)는 빈 가문이 생기면 레벨이 가장 높은 이를 그 가문의 가주로 보낸다 (DS.hand).
//   · 싸움 뒤: 진짜 규칙 그대로 — 쓰러진 가주·가문원은 영영 잃는다(DS.loseMerc · DS.linMercDied), 맹주는 미뤄진 죽음 → 후계는 사람처럼 고른다(자식 · 막사의 같은 병과 · 다른 가문의 가주 가운데 맹주가 되었을 때 레벨이 가장 높은 이 — 고를 이가 없으면 DS.linAutoAll 의 대 끊김. BOTAUTO=1: 게임의 저절로 차례),
//     나이·출생(DS.ageCheck), 막사의 사람이 빈 가문을 잇기(DS.sbTick). 지면(전멸) 같은 시나리오를 다시 한다 (wipe 하나).
//   · 필살기는 봇이 누른다 (DS.BAL.ultAuto — 조작하는 맹주 한 사람).
// 시간: hours = (엔진 시간 + 걷는 몫) / 3600. 게임 달력도 엔진 시간만큼 흐른다 (DS.ageAdvance — 게임과 같다).
// 옛 규칙 비교: LOAD_SRC=/home/user/src/src node tools/bot.js inf 1 — 2.1.2(저장 v12) 규칙으로 같은 정책을 돌린다 (가솔 자동 채움 · 출전 셋 = 레벨 높은 셋 ·
//   가솔 빈자리가 있으면 1회 모집 · 자동 후계 DS.succTick). 같은 시간 셈이라 전 → 후 를 견줄 수 있다.
'use strict';
const D = require('./load.js')();
const cls = process.argv[2] || 'inf', seed = +(process.argv[3] || 1), gen2 = +(process.argv[4] || 0);
const FIELD_OVER = 14, SCN_OVER = 45, MAX_FIELD = 20000, STEP = 0.5;
let rs = seed * 2654435761 >>> 0; const rnd = () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ rs >>> 15, 1 | rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
Math.random = rnd;      // 규칙 함수의 난수도 씨앗에 묶는다 (같은 씨앗이면 같은 판)
D.BAL.ultAuto = true;
if (process.env.CMDK) D.BN.cmdK = +process.env.CMDK;      // 조율용: 깃발 유닛 배율 덮어쓰기
if (process.env.KINK) D.BN.kinK = +process.env.KINK;
const st = { simT: 0, over: 0, field: 0, scn: 0, wipes: 0, deaths: 0, kinDeaths: 0, bearDeaths: 0, heroDeaths: 0, recruits: 0, recruitGold: 0, tickets: 0, kinSent: 0, sbSeat: 0, births: 0, vacMax: 0, vacSum: 0, vacN: 0, fuse: 0, lapse: 0, perScn: [], log: [] };
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
  if (D.linVacant(s).length && process.env.BOTLOG) { const hs = D.linHeirs(s, s.hero); st.log.push('RITE @h' + ((st.simT + st.over) / 3600).toFixed(1) + ' yr' + D.calNow(s).yr + ' heirs ' + hs.map(h => h.kind + (h.young ? 'Y' : '')).join(',') + ' mercs ' + s.mercs.length + ' party ' + D.partyIds(s).length); }
  if (D.linVacant(s).length && D.linChoices && !process.env.BOTAUTO) {      // 사람이 하듯 고른다: 자식 · 막사의 같은 병과 · 다른 가문의 가주 가운데 맹주가 되었을 때 레벨이 가장 높은 이 (같으면 자식 → 막사 → 다른 가문). BOTAUTO=1 이면 게임의 저절로 차례(핏줄 → 막사 → 끊김)
    const ch3 = D.linChoices(s, s.hero).sort((a, b) => (b.nL || b.pL || 0) - (a.nL || a.pL || 0) || a.opt - b.opt)[0];
    if (ch3 && D.linSucceed(s, s.hero, ch3, {})) { st['pick' + ch3.opt] = (st['pick' + ch3.opt] || 0) + 1; st.log.push('pick' + ch3.opt + ' @h' + ((st.simT + st.over) / 3600).toFixed(1) + ' L' + (ch3.nL || ch3.pL) + ' → ' + (s.chars[s.hero] || {}).cls); }
  }
  if (D.linVacant(s).length) { const ev = D.linAutoAll(s) || []; ev.forEach(e => { if (e.t === 'lapse') { st.lapse++; st.log.push('LAPSE @h' + ((st.simT + st.over) / 3600).toFixed(1) + ' houses ' + D.partyIds(s).length + ' kin ' + D.mercsOf(s, s.hero).length); } }); }
  const seat = D.sbTick(s); st.sbSeat += seat.length;
  D.mercTidy(s); D.pSync(s);
  const v = D.bnEmpty(s).length; st.vacMax = Math.max(st.vacMax, v); st.vacSum += v; st.vacN++;
}
function heal() { const fee = 20 * D.heroTier(s); if (s.gold >= fee) s.gold -= fee; D.charList(s).forEach(c => { if (!c.down) { c.hp = 1; c.mp = 1; } }); s.mercs.forEach(m => { m.hp = 1; }); }
function shop() {
  const hp = D.ITEMS.herb.price; while ((s.items.herb || 0) < 5 && s.gold >= hp + 100) { s.gold -= hp; s.items.herb = (s.items.herb || 0) + 1; }
}
function recruit() {
  for (let guard = 0; guard < 6; guard++) {
    const room = D.heroRoom(s); if (!room.length) return;
    const vac = D.bnEmpty(s).length, price = D.recruitPrice(s, 0), keep = 200 * D.heroTier(s);
    let pay = 0;
    const bar = D.barracks(s).length, old = !bar && D.charList(s).some(ch => { const b = ch.id === s.hero ? null : D.bearer(s, ch, 1); return b && b.eld; });      // 노년 가주가 있는데 막사가 비었다 (사람이 「노년」 꼬리표를 보고 준비하듯)
    const spare = bar < Math.ceil(D.partyIds(s).length / 2);      // 넉넉하면 막사에 몇 사람 (싸우는 가문 수의 절반까지)
    if (s.tickets > 0) { s.tickets--; st.tickets++; }
    else if (((vac || old) && s.gold >= price + keep) || (spare && s.gold >= price * 3 + keep)) { s.gold -= price; D.recruitPaid(s, 1); pay = price; }
    else return;
    const r = D.recruitHero(s, rnd); if (!r) { s.gold += pay; return; }
    st.recruits++; st.recruitGold += pay;
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
function prep() {
  tidy();
  if (D.linAutoWed) {      // 혼인: 막사에 맹주와 같은 병과가 한 사람뿐이면 그이는 짝으로 고르지 않는다 (맹주의 뒤를 받칠 사람 — 사람이 하듯)
    const hc = s.chars[s.hero], bk = hc && !OLD ? D.barracks(s).filter(m => D.sbFits(hc, m)) : [], keep = bk.length === 1 ? bk[0] : null, sx0 = keep && keep.sx;
    if (keep && hc.sx) keep.sx = hc.sx;
    try { D.linAutoWed(s); } finally { if (keep) keep.sx = sx0; }
  }
  if (OLD) { oldRecruit(); tidy(); } else { recruit(); sendKin(); tidy(); }
  if (s.crest && D.fuseCands(s).length >= D.FUSE_N) { const k = D.fuseAuto(s); st.fuse += k; if (k) st.log.push('fuse ×' + k); }      // 맹세의 깃대가 있으면 7단 Lv10 셋이 모일 때마다 합일 (합일한 이는 70 을 넘어 자란다)
  D.lootAutoEquip(s); heal(); shop();
  check('prep');
}
// 한 싸움: specs 를 starts(또는 x,y 근처)에 세우고 끝날 때까지. 돌려주는 것: 'win' | 'lose' | 'end'
function run(sim, mode, zid, maxT) {
  let res = null, quiet = 0;
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
          if (u.role === 'cmd') {
            const ch = s.chars[u.ch]; if (!ch) continue;
            if (u.ch === s.hero) { ch.down = true; st.heroDeaths++; st.deaths++; st.log.push('hero died ' + mode + (zid ? ' ' + zid : '') + ' L' + D.pL(ch.ps) + ' houses ' + D.partyIds(s).length + ' @h' + ((st.simT + st.over) / 3600).toFixed(2)); }
            else { const bm = D.bearer(s, ch); if (bm) { if (bm.it) D.giveMercItem(s, bm.id, null); const lost = D.loseMerc(s, bm.id); if (lost) { s.fallen = D.fallenTrim((s.fallen || []).concat([D.fallenRecord(lost, mode)])); D.linMercDied(s, lost, mode); st.deaths++; st.bearDeaths++; } } }
          } else if (u.role === 'merc' && u.mid) {
            const lost = D.loseMerc(s, u.mid); if (lost) { s.fallen = D.fallenTrim((s.fallen || []).concat([D.fallenRecord(lost, mode)])); D.linMercDied(s, lost, mode); st.deaths++; st.kinDeaths++; st.log.push('kin died ' + mode + ' L' + D.pL(lost) + ' party L' + D.partyL(s) + ' age ' + D.ageOf(s, lost)); }
          }
        } else if (u.side === 'enemy' && e.by) {
          const ku = sim.byId[e.by]; let km = null;
          if (ku && ku.role === 'merc' && ku.mid) km = s.mercs.find(m => m.id === ku.mid);
          else if (ku && ku.role === 'cmd' && ku.side === 'ally' && s.chars[ku.ch]) km = D.bearer(s, s.chars[ku.ch]);
          if (km) { km.k = (km.k || 0) + 1; D.meritAdd(km, u.role === 'boss' ? 6 : 1, s); }
        }
      } else if (e.t === 'win') res = 'win';
      else if (e.t === 'lose') res = 'lose';
    }
    if (sim.result) res = sim.result;
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
function place(sim, specs, starts, x, y) {
  const pos = starts ? D.formation(specs, starts) : null;
  let first = null;
  specs.forEach((u, i) => { const p = pos ? pos[i] : [x, y]; u.x = p[0]; u.y = p[1]; u.auto = true; const nu = sim.add(u); if (nu && nu.role === 'cmd' && !first) first = nu; });
  sim.leader = first && first.id; sim.hunt = true;
}
function after(scnWin, sc) {
  if (sc && D.linAfterScn) D.linAfterScn(s, { win: scnWin, cmds: [], mercs: [] });
  const ev = D.ageCheck(s, sc ? sc.name : '들판').concat(D.linSettle(s, sc ? sc.name : '들판'));
  ev.forEach(e => { if (e.t === 'birth') st.births++; if (e.t === 'death' && e.nat) st.log.push('천수 ' + (e.k || '') + ' @h' + ((st.simT + st.over) / 3600).toFixed(1) + ' yr' + D.calNow(s).yr); });
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
  const zid = farmZone(), z = zone(zid), L = farmL();
  let gs = z.spawns.filter(g => g.L <= L + 1); if (!gs.length) gs = z.spawns.slice().sort((a, b) => a.L - b.L).slice(0, 2);
  const g = gs[Math.floor(rnd() * gs.length)];
  const sim = new D.Sim({ map: z.rows, mode: 'zone', spawns: [D.packOf ? D.packOf(g, D.partySpecs(s).length) : { id: g.id, x: g.x, y: g.y, L: g.L, list: g.list.slice() }],      // 2.2.2: 무리는 유닛 수만큼 불어난다 (게임과 같다) seed: (rnd() * 1e6 | 0) + 1, inv: s.items,
    mk: (type, o) => D.enemySpec(type, o.L, { x: o.x, y: o.y, grp: o.grp, diff: 0.72, zone: zid, save: s }) });
  const p = sim.freeNear(g.x, Math.min(z.h - 2, g.y + 5), 'foot', 8) || sim.freeNear(g.x, g.y, 'foot', 10) || { x: g.x, y: g.y };
  place(sim, D.partySpecs(s), null, p.x, p.y);
  const r = run(sim, 'zone', zid, 150);
  st.field++; st.over += FIELD_OVER; s.time += FIELD_OVER; D.ageAdvance(s, FIELD_OVER);
  after(false, null);
  return r;
}
function scenario(sc) {
  const b = D.buildScenario(sc, D.partySpecs(s).length, s.chars[s.hero] ? s.chars[s.hero].cls : 'inf');
  const sim = new D.Sim({ map: b.map, units: b.units, mk: b.mk, objective: b.objective, waves: b.waves, seed: (rnd() * 1e6 | 0) + sc.id, inv: s.items, mode: 'scn' });
  sim.heroId = 'c' + s.hero;
  if (sc.boss === 'herald') sim.erSeed = [s.hero, s.name, 1, (s.erN = (s.erN || 0) + 1)].join(':');
  if (D.linBattleStart) D.linBattleStart(s);
  place(sim, D.partySpecs(s), b.start);
  const r = run(sim, 'scn', null, 900);
  st.scn++; st.over += SCN_OVER; s.time += SCN_OVER; D.ageAdvance(s, SCN_OVER);
  if (r === 'win') {
    sim.units.forEach(u => { if (u.dead || u.side !== 'ally') return; const m = u.role === 'merc' && u.mid ? s.mercs.find(x => x.id === u.mid) : u.role === 'cmd' ? D.bearer(s, s.chars[u.ch]) : null; if (m) { D.meritAdd(m, 10 * (u.role === 'cmd' ? (D.BN.meritK || 1) : 1), s); m.b = (m.b || 0) + 1; } });
    D.charList(s).forEach(c => { if (s.party.indexOf(c.id) < 0) D.hAdd(s, c, D.BN.bench); });
    const out = D.applyClear(s, sc); try { D.bossLoot(s, sc, out.first, rnd); } catch (x) {}
  }
  after(r === 'win', sc);
  return r === 'win';
}
function partyTier() { return D.partyTier(s); }
const t0 = Date.now();
let stuck = false;
function campaign(getSc, done, tag) {
for (let n = 1; n <= 30 && !stuck; n++) {
  const sc = getSc(n); let tries = 0, fields = 0; if (!sc) continue;
  while (!done(n)) {
    prep();
    if (sc.tier > partyTier()) {
      if (s.crest && D.fuseCands(s).length >= D.FUSE_N) { const k = D.fuseAuto(s, 1); st.fuse += k; if (k) { st.log.push('fuse @' + n); continue; } }
      fieldFight(); fields++; if (fields > MAX_FIELD) { stuck = true; break; } continue;
    }
    if (D.partyL(s) < D.recL(sc) + (D.partySpecs(s).length < 3 ? 3 : 0) && fields < MAX_FIELD) { fieldFight(); fields++; continue; }      // 싸우는 이가 셋보다 적으면 권장보다 세 레벨 더 (사람이 하듯 조심스럽게)
    tries++;
    if (process.env.BOTSNAP && tries === 1 && !tag) require('fs').writeFileSync(require('path').join(process.env.BOTSNAP, cls + '_' + seed + '_' + n + '.json'), JSON.stringify(s));      // 조율용(tools/calib.js): 시나리오 N 에 처음 들어가기 직전의 판
    const ok = scenario(sc);
    if (!ok) { st.wipes++; st.log.push('wipe @' + n + ' try ' + tries + ' L' + D.partyL(s) + '/' + D.recL(sc)); if (tries > 12) { stuck = true; break; } }
  }
  if (process.env.BOTSAVE && !tag && n === +(process.env.BOTSAVEAT || 15)) { require('fs').writeFileSync(process.env.BOTSAVE, JSON.stringify(s)); console.log('saved', process.env.BOTSAVE); process.exit(0); }      // 화면 시험용: N번을 깬 판을 저장 글로
  st.perScn.push({ n: tag + n, h: +((st.simT + st.over) / 3600).toFixed(2), L: D.partyL(s), units: D.partySpecs(s).length, vac: D.bnEmpty(s).length, tries });
}
}
campaign(n => D.scn(n), n => !!s.cleared[n], '');
const main = { hours: +((st.simT + st.over) / 3600).toFixed(2), cleared: Object.keys(s.cleared).length, wipes: st.wipes, deaths: st.deaths };
let g2 = null;
if (gen2 && !stuck && s.cleared[30]) {      // 다음 세대의 장: 스무 해 창을 정책대로 치르고(DS.egRunAuto) 2대째 1~30번
  tidy();
  const e0 = D.egStart(s);
  if (e0) {
    const r = D.egRunAuto(s, { heir: 'first', keep: 'light', hand: true, call: 'heavy' }); tidy();
    const w0 = st.wipes, d0 = st.deaths, h0 = (st.simT + st.over) / 3600;
    campaign(n => D.egScn(n, s.eg.gen, s), n => !!(s.eg && s.eg.c && s.eg.c[n]), 'g2.');
    g2 = { gen: s.eg.gen, pass: r, cleared: Object.keys((s.eg && s.eg.c) || {}).length, hours: +((st.simT + st.over) / 3600 - h0).toFixed(2), wipes: st.wipes - w0, deaths: st.deaths - d0, units: D.partySpecs(s).length };
  }
}
const H = (st.simT + st.over) / 3600;
const out = { cls, seed, main, g2, hours: +H.toFixed(2), cleared: Object.keys(s.cleared).length, wipes: st.wipes, deaths: st.deaths, heroDeaths: st.heroDeaths, bearDeaths: st.bearDeaths, kinDeaths: st.kinDeaths,
  vacMax: st.vacMax, vacAvg: +(st.vacSum / Math.max(1, st.vacN)).toFixed(2), vacEnd: D.bnEmpty(s).length, recruits: st.recruits, recruitGold: st.recruitGold, tickets: st.tickets, kinSent: st.kinSent, sbSeat: st.sbSeat,
  births: st.births, inv: invBad, pick: [st.pick1 || 0, st.pick2 || 0, st.pick3 || 0], fuse: st.fuse, lapse: st.lapse, field: st.field, scn: st.scn, units: D.partySpecs(s).length, gold: s.gold, realS: +((Date.now() - t0) / 1000).toFixed(1), stuck };
if (process.env.BOTLOG) { console.log(st.log.join('\n')); console.log(st.perScn.map(p => p.n + ':' + p.h + 'h L' + p.L + ' u' + p.units + ' v' + p.vac + (p.tries > 1 ? ' t' + p.tries : '')).join('  ')); }
console.log(`${cls} seed${seed}: ${out.cleared}/30 in ${out.hours}h, wipes ${out.wipes}, deaths ${out.deaths} (hero ${out.heroDeaths}, bearer ${out.bearDeaths}, kin ${out.kinDeaths}), recruits ${out.recruits}, kin sent ${out.kinSent}, vacancies max ${out.vacMax}/avg ${out.vacAvg}`);
console.log('BOT ' + JSON.stringify(out));
module.exports = { s, st, out };
