// 전민 — 머리 없는 캠페인 봇 (2.2.0 「한 사람 한 사람」 규칙). 진짜 엔진(DS.Sim)과 진짜 규칙 함수로 30번까지 깬다.
//   node tools/bot.js [cls=inf] [seed=1] [gen2=0]          예: node tools/bot.js mag 3
//   끝에 한 줄 요약과 「BOT {json}」 (hours · cleared · wipes · deaths · vacancies · recruits …).
//
// 정책 (사람이 하듯이, 단순하게):
//   · 다음 시나리오의 권장 레벨(DS.recL)에 부대 평균(DS.partyL)이 닿을 때까지 들판에서 싸운다. 들판 = 부대 평균에 맞는 지역의 무리 하나
//     (그 무리 레벨이 평균 + 1 이하), 그 지역 지도 위에서 진짜 엔진으로. 걸어 다니는 시간은 싸움마다 FIELD_OVER 초를 더해 셈한다.
//   · 단 문턱(8단 · 9단): 7단 Lv10 셋이 되면 교회에서 합일(DS.fuseAuto). 그 전까지는 들판.
//   · 싸움 앞: 교회 치료(골드), 약초 다섯까지 사기, 가방의 더 좋은 장비 입히기(DS.lootAutoEquip), 맹주가 홀몸이면 혼인(DS.linAutoWed).
//   · 영웅 모집: 모집권은 자리가 있으면 바로 쓴다. 빈 가문(대기조도 없음)이 있으면 골드로도 부른다 (예비 골드 200 × 단은 남긴다).
//     빈 가문이 없어도 골드가 값의 세 배를 넘으면 대기조를 채우려 부른다. 병과는 무작위다 (게임 규칙 그대로).
//   · 맹주의 어른 아이(가문원)는 빈 가문이 생기면 레벨이 가장 높은 이를 그 가문의 가주로 보낸다 (DS.hand).
//   · 싸움 뒤: 진짜 규칙 그대로 — 쓰러진 가주·가문원은 영영 잃는다(DS.loseMerc · DS.linMercDied), 맹주는 미뤄진 죽음 → 자동 후계(DS.linAutoAll),
//     나이·출생(DS.ageCheck), 대기조가 빈 가문을 잇기(DS.sbTick). 지면(전멸) 같은 시나리오를 다시 한다 (wipe 하나).
//   · 필살기는 봇이 누른다 (DS.BAL.ultAuto — 조작하는 맹주 한 사람).
// 시간: hours = (엔진 시간 + 걷는 몫) / 3600. 게임 달력도 엔진 시간만큼 흐른다 (DS.ageAdvance — 게임과 같다).
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
const s = D.newSave('봇', cls);
D.allySet && D.allySet(s, '펜드래곤');
const zc = {};
function zone(id) { return zc[id] || (zc[id] = D.buildZone(id)); }
function tidy() {
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
    if (s.tickets > 0) { s.tickets--; st.tickets++; }
    else if ((vac && s.gold >= price + keep) || s.gold >= price * 3 + keep) { s.gold -= price; D.recruitPaid(s, 1); pay = price; }
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
  if (D.linAutoWed) D.linAutoWed(s);
  recruit(); sendKin(); tidy();
  D.lootAutoEquip(s); heal(); shop();
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
            if (u.ch === s.hero) { ch.down = true; st.heroDeaths++; st.deaths++; }
            else { const bm = D.bearer(s, ch); if (bm) { if (bm.it) D.giveMercItem(s, bm.id, null); const lost = D.loseMerc(s, bm.id); if (lost) { s.fallen = D.fallenTrim((s.fallen || []).concat([D.fallenRecord(lost, mode)])); D.linMercDied(s, lost, mode); st.deaths++; st.bearDeaths++; } } }
          } else if (u.role === 'merc' && u.mid) {
            const lost = D.loseMerc(s, u.mid); if (lost) { s.fallen = D.fallenTrim((s.fallen || []).concat([D.fallenRecord(lost, mode)])); D.linMercDied(s, lost, mode); st.deaths++; st.kinDeaths++; }
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
}
function farmZone() {
  const L = D.partyL(s); let best = null;
  Object.keys(D.ZONES).forEach(k => { const Z = D.ZONES[k]; if (Z.town || !Z.L) return; if (Z.L[0] <= L + 2 && (!best || Z.L[0] > D.ZONES[best].L[0])) best = k; });
  return best || 'dawn';
}
function fieldFight() {
  const zid = farmZone(), z = zone(zid), L = D.partyL(s);
  let gs = z.spawns.filter(g => g.L <= L + 1); if (!gs.length) gs = z.spawns.slice().sort((a, b) => a.L - b.L).slice(0, 2);
  const g = gs[Math.floor(rnd() * gs.length)];
  const sim = new D.Sim({ map: z.rows, mode: 'zone', spawns: [{ id: g.id, x: g.x, y: g.y, L: g.L, list: g.list.slice() }], seed: (rnd() * 1e6 | 0) + 1, inv: s.items,
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
for (let n = 1; n <= 30 && !stuck; n++) {
  const sc = D.scn(n); let tries = 0, fields = 0;
  while (!s.cleared[n]) {
    prep();
    if (sc.tier > partyTier()) {
      if (s.crest && D.fuseCands(s).length >= D.FUSE_N) { const k = D.fuseAuto(s, 1); st.fuse += k; if (k) { st.log.push('fuse @' + n); continue; } }
      fieldFight(); fields++; if (fields > MAX_FIELD) { stuck = true; break; } continue;
    }
    if (D.partyL(s) < D.recL(sc) && fields < MAX_FIELD) { fieldFight(); fields++; continue; }
    tries++;
    const ok = scenario(sc);
    if (!ok) { st.wipes++; st.log.push('wipe @' + n + ' try ' + tries + ' L' + D.partyL(s) + '/' + D.recL(sc)); if (tries > 12) { stuck = true; break; } }
  }
  st.perScn.push({ n, h: +((st.simT + st.over) / 3600).toFixed(2), L: D.partyL(s), units: D.partySpecs(s).length, vac: D.bnEmpty(s).length, tries });
}
const H = (st.simT + st.over) / 3600;
const out = { cls, seed, hours: +H.toFixed(2), cleared: Object.keys(s.cleared).length, wipes: st.wipes, deaths: st.deaths, heroDeaths: st.heroDeaths, bearDeaths: st.bearDeaths, kinDeaths: st.kinDeaths,
  vacMax: st.vacMax, vacAvg: +(st.vacSum / Math.max(1, st.vacN)).toFixed(2), vacEnd: D.bnEmpty(s).length, recruits: st.recruits, recruitGold: st.recruitGold, tickets: st.tickets, kinSent: st.kinSent, sbSeat: st.sbSeat,
  births: st.births, fuse: st.fuse, lapse: st.lapse, field: st.field, scn: st.scn, units: D.partySpecs(s).length, gold: s.gold, realS: +((Date.now() - t0) / 1000).toFixed(1), stuck };
if (process.env.BOTLOG) { console.log(st.log.join('\n')); console.log(st.perScn.map(p => p.n + ':' + p.h + 'h L' + p.L + ' u' + p.units + ' v' + p.vac + (p.tries > 1 ? ' t' + p.tries : '')).join('  ')); }
console.log(`${cls} seed${seed}: ${out.cleared}/30 in ${out.hours}h, wipes ${out.wipes}, deaths ${out.deaths} (hero ${out.heroDeaths}, bearer ${out.bearDeaths}, kin ${out.kinDeaths}), recruits ${out.recruits}, kin sent ${out.kinSent}, vacancies max ${out.vacMax}/avg ${out.vacAvg}`);
console.log('BOT ' + JSON.stringify(out));
module.exports = { s, st, out };
