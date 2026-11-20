// 전민 — 2.2.9 「합일의 길」: 가문마다 제 8 · 9 · 10단 (열 가문 × 세 단 = 서른 모습)
//   합일(meta.js DS.fuse)로 8단에 오른 가주는 제 가문 병과의 윗길(DS.RISE_OF[병과])로 자란다. 가문 줄의 병과(ch.cls)는 그대로 — 세기 · 기술 · 단 이름 · 모습만 이 길을 따른다 (DS.riseCls).
//   세기: 그 병과의 7단 Lv10(L70) 값의 RISE_K 배에서 시작하고(8단 Lv1 = L71), 레벨마다 그 병과 성장의 RISE_G 배씩 자란다 — 열 길의 몫이 같다.
//   기술: 8단에 그 병과의 대표 기술 하나가 윗길 기술로 바뀌고(kit), 9단 · 10단에 고유 기술을 하나씩 익힌다. 필살기 셋은 8단부터 윗길 필살기(DS.ULT_UP)로 쓴다.
//   옛 판의 세 마스터(배틀 · 택틱스 · 매직마스터)는 표에 그대로 둔다 (옛 기록이 읽는다). 옛 마스터 기술은 그 병과 윗길의 고유 기술로 옮긴다 (DS.SK_OLD · DS.SK_ALIAS).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
DS.RISE_K = { hp: 1.3, mp: 1.2, atk: 1.3, def: 1.3, mag: 1.3, res: 1.3 };
DS.RISE_G = 1.22;
// 병과 → 윗길 [8단, 9단, 10단 이름, 짧은 이름, 한 줄 소개, 빛깔(오라)]
var LINE = {
  inf:  { k: 'xinf',  t: ['성벽기사', '철옹공', '불괴왕'], short: '성벽', aura: '#8fc8ff', blurb: '무너지지 않는 성채가 된 방패. 9단에 「불괴의 방진」, 10단에 「성벽 붕괴」를 익힌다.' },
  cav:  { k: 'xcav',  t: ['뇌전기사', '천둥군주', '뇌제'], short: '뇌전', aura: '#ffe27a', blurb: '번개를 끌고 달리는 기병의 왕. 9단에 「천둥 창」, 10단에 「뇌운 질주」를 익힌다.' },
  fly:  { k: 'xfly',  t: ['폭풍기수', '창공군주', '천룡왕'], short: '폭풍', aura: '#9fe8ec', blurb: '폭풍을 타는 용의 기수. 9단에 「용의 포효」, 10단에 「천룡의 숨결」을 익힌다.' },
  mar:  { k: 'xmar',  t: ['해일장군', '파도군주', '해신'], short: '해일', aura: '#62d0ee', blurb: '바다를 부리는 장수. 9단에 「소용돌이」, 10단에 「대해일」을 익힌다.' },
  pike: { k: 'xpike', t: ['창벽장군', '만창공', '창성'], short: '창벽', aura: '#b6f0a0', blurb: '창의 숲을 세우는 수문장. 9단에 「창의 숲」, 10단에 「천 갈래 창」을 익힌다.' },
  arc:  { k: 'xarc',  t: ['매눈사수', '신궁', '천궁성'], short: '매눈', aura: '#d8ff9a', blurb: '한 번 본 것은 놓치지 않는 명사수. 9단에 「꿰뚫는 매눈」, 10단에 「천궁 소나기」를 익힌다.' },
  cle:  { k: 'xcle',  t: ['금강권', '무성', '천무신'], short: '금강', aura: '#ffd27a', blurb: '맨손으로 산을 여는 무의 성인. 9단에 「천수권」, 10단에 「천지개벽장」을 익힌다.' },
  mon:  { k: 'xmon',  t: ['성등사', '대성관', '일륜성자'], short: '성등', aura: '#fff0a0', blurb: '꺼지지 않는 등불의 성자. 9단에 「광륜」, 10단에 「일륜 강림」을 익힌다.' },
  mag:  { k: 'xmag',  t: ['대마도사', '원소왕', '천원현자'], short: '마도', aura: '#c9a8ff', blurb: '세 원소를 한 손에 쥔 대마도사. 9단에 「원소 폭주」, 10단에 「천원 운석」을 익힌다.' },
  sha:  { k: 'xsha',  t: ['사령군주', '명계왕', '불사왕'], short: '사령', aura: '#b6ff5a', blurb: '죽음을 다스리는 불사의 군주. 9단에 「망령 군단」, 10단에 「죽음의 장막」을 익힌다.' }
};
DS.RISE_LINE = LINE;
DS.RISE_OF = {}; for (var c0 in LINE) DS.RISE_OF[c0] = LINE[c0].k;
DS.RISE_BASE = {}; for (var c1 in LINE) DS.RISE_BASE[LINE[c1].k] = c1;
// ── 기술: kit = 8단에 바뀌는 대표 기술 · s9 · s10 = 고유 기술 ──
var G = 1;      // 모든 윗길 기술은 화려한 빛(grand)이 덧붙는다 (view.js V.fx)
var SK = {
  // 보병 (성벽기사)
  xinf_bash:  { name: '성벽 강타', mp: 4, tick: 45, rng: [1, 1], tg: 'enemy', fx: 'shield', ic: 'shieldbash', eff: [{ t: 'dmg', m: 3.0 }, { t: 'gauge', v: -40 }, { t: 'taunt', dur: 8 }, { t: 'buff', s: 'shd', m: 0.8, stat: 'atk', dur: 10, to: 'self' }], desc: '붙은 적을 성벽처럼 쳐 300%, 게이지를 깎고 8초 동안 나를 노리게 한다. 내게 보호막(공격의 80%).' },
  xinf_aegis: { name: '불괴의 방진', mp: 12, tick: 50, tg: 'self', area: 'r2', side: 'ally', fx: 'guard', ic: 'bulwark', eff: [{ t: 'buff', s: 'shd', m: 1.4, stat: 'atk', dur: 15 }, { t: 'buff', s: 'def', p: 30, dur: 15 }, { t: 'taunt', to: 'foe', r: 3, dur: 8 }], desc: '둘레 2칸 아군에게 보호막(공격의 140%)과 방어 +30% (15초). 둘레 3칸 적은 나를 노린다.' },
  xinf_quake: { name: '성벽 붕괴', mp: 16, tick: 60, tg: 'self', area: 'r2', side: 'enemy', fx: 'quake', ic: 'shieldbash', eff: [{ t: 'dmg', m: 2.2 }, { t: 'knock', n: 1 }, { t: 'gauge', v: -40 }, { t: 'status', s: 'slow', dur: 8 }], desc: '방패로 땅을 내리쳐 둘레 2칸 적에게 220%, 밀어내고 게이지를 깎고 둔화.' },
  // 기병 (뇌전기사)
  xcav_charge:{ name: '뇌전 돌파', mp: 7, tick: 50, tg: 'dir', len: 5, dash: true, fx: 'charge', ic: 'charge', eff: [{ t: 'dmg', m: 1.9 }, { t: 'gauge', v: -30 }, { t: 'chain', n: 2, r: 2, m: 0.5 }], desc: '번개를 끌고 직선 5칸을 꿰뚫어 달린다. 190%, 게이지를 깎고 곁의 둘에게 번개(50%).' },
  xcav_bolt:  { name: '천둥 창', mp: 10, tick: 50, rng: [2, 5], tg: 'enemy', leap: true, fx: 'thunder', ic: 'bolt', eff: [{ t: 'dmg', m: 2.4, vs: 'low', vx: 1.4 }, { t: 'chain', n: 3, r: 2, m: 0.6 }], desc: '2~5칸 밖의 적에게 벼락처럼 뛰어들어 240% (체력이 절반 아래면 1.4배), 곁의 셋에게 번개(60%).' },
  xcav_storm: { name: '뇌운 질주', mp: 16, tick: 60, tg: 'dir', len: 7, dash: true, fx: 'thunder', ic: 'charge', eff: [{ t: 'dmg', m: 2.4 }, { t: 'gauge', v: -40 }, { t: 'chain', n: 4, r: 2, m: 0.5 }], desc: '먹구름을 끌고 직선 7칸을 달린다. 길 위의 적에게 240%, 게이지를 깎고 곁의 넷에게 번개(50%).' },
  // 비병 (폭풍기수)
  xfly_dive:  { name: '용의 급강하', mp: 6, tick: 45, rng: [2, 5], tg: 'enemy', leap: true, back: 3, fx: 'dive', ic: 'dive', eff: [{ t: 'dmg', m: 1.9, vs: 'mark', vx: 1.5 }, { t: 'status', s: 'mark', dur: 8, p: 20 }], desc: '2~5칸 밖의 적에게 내리꽂아 190%(표식이 있으면 1.5배), 표식을 남기고 세 칸 날아오른다.' },
  xfly_roar:  { name: '용의 포효', mp: 11, tick: 50, tg: 'self', area: 'r2', side: 'enemy', back: 2, fx: 'wind', ic: 'gust', eff: [{ t: 'dmg', m: 1.8 }, { t: 'knock', n: 1 }, { t: 'buff', s: 'atk', p: -20, dur: 10 }, { t: 'gauge', v: -30 }], desc: '둘레 2칸 적에게 180%, 밀어내고 공격 −20% (10초), 게이지를 깎은 뒤 날아오른다.' },
  xfly_breath:{ name: '천룡의 숨결', mp: 16, tick: 60, tg: 'dir', len: 5, fx: 'fire', ic: 'flame', eff: [{ t: 'dmg', m: 2.2, type: 'magic', stat: 'atk' }, { t: 'status', s: 'burn', dur: 8, p: 3 }, { t: 'status', s: 'mark', dur: 8, p: 20 }], desc: '용이 직선 5칸에 불을 뿜는다. 220%, 화상과 표식.' },
  // 해병 (해일장군)
  xmar_surge: { name: '해일 밀기', mp: 8, tick: 50, tg: 'dir', len: 4, fx: 'water', ic: 'wave', eff: [{ t: 'dmg', m: 1.9, type: 'magic', stat: 'atk' }, { t: 'knock', n: 2 }, { t: 'status', s: 'wet', dur: 14 }], desc: '직선 4칸에 해일 190%, 두 칸 밀어내고 젖게 한다.' },
  xmar_whirl: { name: '소용돌이', mp: 11, tick: 50, rng: [1, 4], tg: 'tile', area: 'r2', fx: 'water', ic: 'hook', eff: [{ t: 'dmg', m: 1.6, type: 'magic', stat: 'atk' }, { t: 'pull', n: 1 }, { t: 'status', s: 'wet', dur: 12 }, { t: 'status', s: 'slow', dur: 8 }], desc: '2칸 반경에 소용돌이 160%, 한 칸 끌어오고 젖게 하며 둔화.' },
  xmar_tsunami:{ name: '대해일', mp: 16, tick: 60, tg: 'dir', len: 6, fx: 'water', ic: 'wave', eff: [{ t: 'dmg', m: 2.4, type: 'magic', stat: 'atk' }, { t: 'knock', n: 2 }, { t: 'status', s: 'wet', dur: 14 }, { t: 'gauge', v: -40 }], desc: '직선 6칸을 덮는 해일 240%, 두 칸 밀어내고 젖게 하며 게이지를 깎는다.' },
  // 창병 (창벽장군)
  xpike_skewer:{ name: '관통창', mp: 7, tick: 50, tg: 'dir', len: 4, fx: 'thrust', ic: 'skewer', eff: [{ t: 'dmg', m: 2.3, vs: 'slow', vx: 1.4 }, { t: 'status', s: 'slow', dur: 8 }], desc: '직선 4칸을 꿰뚫어 230% (둔화된 적에게 1.4배), 둔화.' },
  xpike_forest:{ name: '창의 숲', mp: 11, tick: 50, tg: 'self', area: 'r2', side: 'enemy', fx: 'brace', ic: 'brace', eff: [{ t: 'dmg', m: 1.9 }, { t: 'status', s: 'slow', dur: 10 }, { t: 'buff', s: 'ctr', p: 80, dur: 12, to: 'self' }], desc: '둘레 2칸에 창을 세운다. 적에게 190%와 둔화, 12초 동안 붙어 때린 적을 80%로 되찌른다.' },
  xpike_lance:{ name: '천 갈래 창', mp: 16, tick: 60, rng: [1, 3], tg: 'tile', area: 'r2', fx: 'thrust', ic: 'pin', eff: [{ t: 'dmg', m: 2.2, vs: 'slow', vx: 1.3 }, { t: 'gauge', v: -30 }, { t: 'status', s: 'slow', dur: 8 }], desc: '2칸 반경에 창끝이 쏟아진다. 220% (둔화된 적에게 1.3배), 게이지를 깎고 둔화.' },
  // 궁병 (매눈사수)
  xarc_mark:  { name: '매눈 표식', mp: 5, tick: 45, rng: [2, 6], tg: 'enemy', fx: 'mark', ic: 'mark', eff: [{ t: 'dmg', m: 1.6 }, { t: 'status', s: 'mark', dur: 14, p: 25 }], desc: '최대 6칸. 160%, 표식(받는 피해 +25%, 14초).' },
  xarc_pierce:{ name: '꿰뚫는 매눈', mp: 10, tick: 50, tg: 'dir', len: 6, fx: 'arrow', ic: 'mark', eff: [{ t: 'dmg', m: 2.4, vs: 'mark', vx: 1.4 }, { t: 'status', s: 'mark', dur: 10, p: 20 }], desc: '직선 6칸을 꿰뚫는 한 발. 240% (표식이 있으면 1.4배), 표식.' },
  xarc_storm: { name: '천궁 소나기', mp: 16, tick: 60, rng: [2, 6], tg: 'tile', area: 'r2', fx: 'arrowRain', ic: 'volley', eff: [{ t: 'dmg', m: 1.9, vs: 'mark', vx: 1.4 }, { t: 'status', s: 'mark', dur: 10, p: 20 }], desc: '2칸 반경에 화살비 190% (표식이 있으면 1.4배), 표식.' },
  // 승려 (금강권)
  xcle_combo: { name: '금강 연환권', mp: 5, tick: 45, rng: [1, 1], tg: 'enemy', fx: 'fist', fist: true, eff: [{ t: 'dmg', m: 0.8 }, { t: 'dmg', m: 0.8 }, { t: 'dmg', m: 0.9 }, { t: 'mend', r: 4, m: 1.6 }], desc: '붙은 적을 세 번 친다. 모두 250%. 4칸 안에서 가장 다친 아군 하나를 회복.' },
  xcle_hands: { name: '천수권', mp: 10, tick: 50, rng: [1, 1], tg: 'enemy', fx: 'fist', fist: true, eff: [{ t: 'dmg', m: 0.5 }, { t: 'dmg', m: 0.5 }, { t: 'dmg', m: 0.5 }, { t: 'dmg', m: 0.5 }, { t: 'dmg', m: 0.5 }, { t: 'dmg', m: 0.6 }, { t: 'gauge', v: -40 }, { t: 'mend', r: 4, m: 1.2 }], desc: '천 개의 손처럼 여섯 번 몰아친다. 모두 310%, 게이지를 깎고 가장 다친 아군을 회복.' },
  xcle_heaven:{ name: '천지개벽장', mp: 16, tick: 60, tg: 'dir', len: 5, fx: 'palm', fist: true, eff: [{ t: 'dmg', m: 2.6, type: 'magic', stat: 'mix' }, { t: 'knock', n: 2 }, { t: 'aura', r: 2, m: 1.2 }], desc: '직선 5칸에 기공 260%, 두 칸 밀어낸다. 둘레 2칸 아군을 회복.' },
  // 신관 (성등사)
  xmon_smite: { name: '성등 치기', mp: 6, tick: 45, rng: [1, 3], tg: 'enemy', fx: 'holy', ic: 'lamp', eff: [{ t: 'dmg', m: 3.0, type: 'holy' }, { t: 'ward', r: 4, m: 1.3 }], desc: '신성 300% (망자, 악마에게 1.5배). 4칸 안 가장 다친 아군에게 보호막.' },
  xmon_halo:  { name: '광륜', mp: 13, tick: 50, tg: 'self', area: 'r2', side: 'ally', fx: 'sanct', ic: 'sanct', eff: [{ t: 'buff', s: 'shd', m: 1.6, dur: 15 }, { t: 'cleanse' }, { t: 'heal', m: 0.8 }], desc: '둘레 2칸 아군에게 빛의 고리. 보호막(마공의 160%, 15초), 상태 이상을 풀고 회복.' },
  xmon_sun:   { name: '일륜 강림', mp: 18, tick: 60, rng: [1, 5], tg: 'tile', area: 'r2', fx: 'holy', ic: 'sun', eff: [{ t: 'dmg', m: 2.2, type: 'holy' }, { t: 'ward', r: 4, m: 1.5 }], desc: '2칸 반경에 해가 내려앉는다. 신성 220% (망자, 악마에게 1.5배), 가장 다친 아군에게 보호막.' },
  // 법사 (대마도사)
  xmag_bolt:  { name: '연쇄 뇌우', mp: 13, tick: 55, rng: [1, 4], tg: 'enemy', fx: 'thunder', ic: 'bolt', eff: [{ t: 'dmg', m: 1.6, type: 'magic', stat: 'mix', vs: 'wet|slow', vx: 1.5 }, { t: 'chain', n: 3, r: 2, m: 0.8, type: 'magic', stat: 'mix', vs: 'wet|slow', vx: 1.5 }], desc: '번개 160%, 2칸 안의 셋에게 옮겨 간다(80%). 얼거나 젖은 적에게 1.5배.' },
  xmag_prism: { name: '원소 폭주', mp: 14, tick: 55, rng: [1, 4], tg: 'tile', area: 'r2', fx: 'fire', ic: 'flame', eff: [{ t: 'dmg', m: 1.5, type: 'magic', vs: 'burn', vx: 1.3 }, { t: 'status', s: 'burn', dur: 8, p: 2 }, { t: 'status', s: 'slow', dur: 8 }], desc: '불과 얼음이 2칸 반경에 함께 터진다. 150% (화상 입은 적에게 1.3배), 화상과 둔화.' },
  xmag_nova:  { name: '천원 운석', mp: 20, tick: 65, rng: [2, 6], tg: 'tile', area: 'r2', fx: 'meteor', ic: 'meteor', eff: [{ t: 'dmg', m: 2.3, type: 'magic', vs: 'burn', vx: 1.3 }, { t: 'status', s: 'burn', dur: 8, p: 3 }, { t: 'gauge', v: -30 }], desc: '2칸 반경에 큰 운석 230% (화상 입은 적에게 1.3배), 화상과 게이지 깎기.' },
  // 사교 (사령군주)
  xsha_drain: { name: '영혼 흡수', mp: 6, tick: 45, rng: [1, 3], tg: 'enemy', fx: 'dark', ic: 'drain', eff: [{ t: 'dmg', m: 2.0, type: 'magic', share: 0.8 }], desc: '흑마법 200%. 준 피해의 80%로 가장 다친 아군을 고친다.' },
  xsha_legion:{ name: '망령 군단', mp: 14, tick: 55, cd: 16, tg: 'self', fx: 'dark', ic: 'skull', ai: 'summon', cap: 4, eff: [{ t: 'summon', type: 'm_skeleton', n: 2, dur: 40, k: 0.95, ka: 1.25, kh: 1.3, kd: 1.5 }], desc: '40초 동안 싸울 망령 병사 둘을 부른다 (넷까지).' },
  xsha_doom:  { name: '죽음의 장막', mp: 18, tick: 60, rng: [1, 5], tg: 'tile', area: 'r2', fx: 'poison', ic: 'plague', eff: [{ t: 'dmg', m: 1.8, type: 'magic', vs: 'curse', vx: 1.4 }, { t: 'status', s: 'poison', dur: 12, p: 4 }, { t: 'buff', s: 'def', p: -25, dur: 12 }], desc: '2칸 반경에 죽음의 장막 180% (저주받은 적에게 1.4배), 강한 중독, 방어 −25%.' }
};
var KIT = { inf: ['inf_bash', 'xinf_bash'], cav: ['cav_charge', 'xcav_charge'], fly: ['fly_dive', 'xfly_dive'], mar: ['mar_surge', 'xmar_surge'], pike: ['pike_skewer', 'xpike_skewer'],
  arc: ['arc_mark', 'xarc_mark'], cle: ['cle_combo', 'xcle_combo'], mon: ['mon_smite', 'xmon_smite'], mag: ['mag_bolt', 'xmag_bolt'], sha: ['sha_drain', 'xsha_drain'] };
var SIG = { inf: ['xinf_aegis', 'xinf_quake'], cav: ['xcav_bolt', 'xcav_storm'], fly: ['xfly_roar', 'xfly_breath'], mar: ['xmar_whirl', 'xmar_tsunami'], pike: ['xpike_forest', 'xpike_lance'],
  arc: ['xarc_pierce', 'xarc_storm'], cle: ['xcle_hands', 'xcle_heaven'], mon: ['xmon_halo', 'xmon_sun'], mag: ['xmag_prism', 'xmag_nova'], sha: ['xsha_legion', 'xsha_doom'] };
DS.RISE_SIG = SIG; DS.RISE_KIT = KIT;
for (var sk in SK) { SK[sk].grand = G; SK[sk].rise = 1; DS.SKILLS[sk] = SK[sk]; }
// ── 윗길 필살기 (8단부터 — 사람이 타고난 필살기 자리 그대로 이것으로 쓴다). DS.ULTS 에는 넣지 않는다 (타고난 굴림의 후보가 바뀌지 않게)
var UX = {
  u_bastion: { name: '천년 성벽', tick: 40, tg: 'self', area: 'r2', side: 'ally', fx: 'guard', ic: 'bulwark', eff: [{ t: 'buff', s: 'def', p: 70, dur: 16 }, { t: 'buff', s: 'shd', m: 2.2, stat: 'atk', dur: 16 }, { t: 'taunt', to: 'foe', r: 4, dur: 10 }], fl: '천 년을 버틴 성벽이 다시 선다.', desc: '둘레 2칸 아군의 방어 +70%, 보호막(공격의 220%, 16초). 둘레 4칸 적은 나를 노린다.' },
  u_ram:     { name: '성문 파쇄', tick: 40, rng: [1, 1], tg: 'enemy', fx: 'shield', ic: 'shieldbash', eff: [{ t: 'dmg', m: 4.4 }, { t: 'gauge', v: -80 }, { t: 'knock', n: 3 }], fl: '어떤 문도 두 번은 버티지 못한다.', desc: '붙은 적 하나에 440%, 게이지를 크게 깎고 3칸 밀어낸다.' },
  u_riposte: { name: '강철 회오리', tick: 40, tg: 'self', area: 'r2', side: 'enemy', fx: 'wind', ic: 'gust', eff: [{ t: 'dmg', m: 2.5 }, { t: 'knock', n: 1 }, { t: 'buff', s: 'ctr', p: 120, dur: 12, to: 'self' }], fl: '강철이 소용돌이친다.', desc: '둘레 2칸 모든 적에게 250%, 밀어낸다. 12초 동안 붙어 때린 적을 120%로 되친다.' },
  u_goldrush:{ name: '뇌광 돌격', tick: 40, tg: 'dir', len: 8, dash: true, fx: 'thunder', ic: 'charge', eff: [{ t: 'dmg', m: 3.4 }, { t: 'gauge', v: -60 }, { t: 'chain', n: 3, r: 2, m: 0.6 }], fl: '번개가 지나간 자리에 길이 난다.', desc: '직선 8칸을 번개처럼 꿰뚫는다. 340%, 게이지를 깎고 곁의 셋에게 번개.' },
  u_stampede:{ name: '천둥 말발굽', tick: 40, tg: 'self', area: 'r2', side: 'enemy', fx: 'quake', ic: 'hoof', eff: [{ t: 'dmg', m: 2.4 }, { t: 'status', s: 'slow', dur: 10 }, { t: 'buff', s: 'quick', p: 40, dur: 12, to: 'self' }], fl: '말굽마다 천둥이 친다.', desc: '둘레 2칸 적에게 240%와 둔화. 12초 동안 내 행동 소모 −40%.' },
  u_debt:    { name: '벼락 빚잔치', tick: 40, rng: [1, 5], tg: 'enemy', leap: true, fx: 'thunder', ic: 'hunt', eff: [{ t: 'dmg', m: 3.6, drain: 0.5, vs: 'low', vx: 1.6 }], fl: '빚은 벼락으로 갚는다.', desc: '5칸 안의 적에게 벼락처럼 달려들어 360%, 체력이 절반 아래면 1.6배. 준 피해의 절반만큼 회복.' },
  u_stoop:   { name: '천공 낙하', tick: 40, rng: [2, 7], tg: 'enemy', leap: true, back: 4, fx: 'dive', ic: 'dive', eff: [{ t: 'dmg', m: 4.0, vs: 'mark', vx: 1.6 }], fl: '하늘 끝에서 한 점으로.', desc: '2~7칸 밖의 적에게 내리꽂아 400%(표식이 있으면 1.6배), 네 칸 날아오른다.' },
  u_gale:    { name: '태풍의 눈', tick: 40, rng: [1, 5], tg: 'tile', area: 'r2', fx: 'wind', ic: 'gust', eff: [{ t: 'dmg', m: 2.3 }, { t: 'knock', n: 1 }, { t: 'status', s: 'mark', dur: 12, p: 25 }], fl: '날개 한 번에 태풍이 인다.', desc: '2칸 반경에 230%, 밀어내고 표식(+25%)을 남긴다.' },
  u_canopy:  { name: '용익의 그늘', tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold', ic: 'haste', eff: [{ t: 'buff', s: 'quick', p: 45, dur: 16 }, { t: 'gauge', v: 50 }, { t: 'buff', s: 'shd', m: 1.3, stat: 'atk', dur: 12 }], fl: '용의 날개 아래 모두가 가볍다.', desc: '모든 아군의 행동 소모 −45% (16초), 게이지 +50, 보호막(공격의 130%).' },
  u_landing: { name: '거대 해일', tick: 40, tg: 'dir', len: 7, dash: true, fx: 'water', ic: 'wave', eff: [{ t: 'dmg', m: 3.0, type: 'magic', stat: 'atk' }, { t: 'status', s: 'wet', dur: 14 }, { t: 'gauge', v: -50 }], fl: '바다째 뭍으로 올라온다.', desc: '해일을 타고 직선 7칸을 달린다. 300%, 젖게 하고 게이지를 깎는다.' },
  u_warcry:  { name: '바다의 함성', tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffRed', ic: 'horn', eff: [{ t: 'buff', s: 'atk', p: 35, dur: 16 }, { t: 'gauge', v: 50 }, { t: 'cleanse' }, { t: 'buff', s: 'shd', m: 0.6, stat: 'atk', dur: 12 }], fl: '파도 소리가 함성이 된다.', desc: '모든 아군의 공격 +35% (16초), 게이지 +50, 상태 이상을 털고 보호막.' },
  u_moor:    { name: '심해의 닻', tick: 40, rng: [1, 4], tg: 'tile', area: 'r2', fx: 'hook', ic: 'hook', eff: [{ t: 'dmg', m: 2.6 }, { t: 'pull', n: 1 }, { t: 'status', s: 'slow', dur: 12 }], fl: '바닥 모를 닻이 땅을 문다.', desc: '2칸 반경에 260%, 한 칸 끌어오고 오래 묶는다.' },
  u_crossbar:{ name: '빗장 관통', tick: 40, tg: 'dir', len: 6, fx: 'thrust', ic: 'skewer', eff: [{ t: 'dmg', m: 3.2, vs: 'slow', vx: 1.4 }, { t: 'status', s: 'slow', dur: 10 }, { t: 'gauge', v: -50 }], fl: '한 줄에 꿰어 문을 건다.', desc: '직선 6칸을 꿰뚫어 320%(둔화된 적에게 1.4배), 둔화와 게이지 깎기.' },
  u_feast:   { name: '잔치의 끝장', tick: 40, tg: 'self', area: 'r2', side: 'enemy', fx: 'thrust', ic: 'pin', eff: [{ t: 'dmg', m: 2.1 }, { t: 'buff', s: 'atk', p: -40, dur: 14 }, { t: 'status', s: 'slow', dur: 10 }], fl: '잔치는 끝났다. 창이 대답한다.', desc: '둘레 2칸 적에게 210%, 공격 −40% (14초)와 둔화.' },
  u_gatekeep:{ name: '철문 수문장', tick: 40, tg: 'self', area: 'r2', side: 'ally', fx: 'brace', ic: 'brace', eff: [{ t: 'buff', s: 'def', p: 55, dur: 18 }, { t: 'buff', s: 'atk', p: 30, dur: 18 }, { t: 'buff', s: 'ctr', p: 90, dur: 18 }], fl: '쇠문 앞의 창은 물러서지 않는다.', desc: '둘레 2칸 아군의 방어 +55%, 공격 +30%, 붙어 때린 적을 90%로 되찌른다 (18초).' },
  u_oneshot: { name: '일격필살', tick: 40, rng: [2, 9], tg: 'enemy', fx: 'mark', ic: 'mark', eff: [{ t: 'dmg', m: 4.6, vs: 'mark', vx: 1.5 }], fl: '보인 순간 끝났다.', desc: '최대 9칸. 적 하나에 460%, 표식이 있으면 1.5배.' },
  u_deluge:  { name: '하늘 가르는 비', tick: 40, rng: [2, 6], tg: 'tile', area: 'r2', fx: 'arrowRain', ic: 'volley', eff: [{ t: 'dmg', m: 2.1 }, { t: 'status', s: 'mark', dur: 12, p: 25 }], fl: '하늘이 화살로 갈라진다.', desc: '2칸 반경에 화살 210%, 맞은 적 모두에게 표식(+25%).' },
  u_three:   { name: '다섯 갈래 화살', tick: 40, tg: 'multi', n: 5, area: 'single', fx: 'arrow', ic: 'retreat', eff: [{ t: 'dmg', m: 2.2 }, { t: 'status', s: 'mark', dur: 10, p: 20 }, { t: 'status', s: 'slow', dur: 6 }], fl: '시위 하나에 화살 다섯.', desc: '적 다섯에게 220%, 표식과 둔화.' },
  u_flurry:  { name: '백만권', tick: 40, rng: [1, 1], tg: 'enemy', fx: 'fist', fist: true, eff: [{ t: 'dmg', m: 0.7 }, { t: 'dmg', m: 0.7 }, { t: 'dmg', m: 0.7 }, { t: 'dmg', m: 0.7 }, { t: 'dmg', m: 0.7 }, { t: 'dmg', m: 0.8, drain: 0.3 }, { t: 'gauge', v: -60 }], fl: '헤아릴 수 없는 주먹.', desc: '붙은 적 하나에 여섯 번 몰아쳐 모두 430%, 게이지를 크게 깎는다. 마지막 한 방의 피해 일부만큼 회복.' },
  u_stance:  { name: '금강부동', tick: 40, tg: 'self', side: 'ally', fx: 'chi', fist: true, eff: [{ t: 'buff', s: 'def', p: 70, dur: 16 }, { t: 'buff', s: 'ctr', p: 120, dur: 16 }, { t: 'aura', r: 2, m: 2.2 }], fl: '금강은 깨지지 않는다.', desc: '16초 동안 자기 방어 +70%, 붙어서 때린 적을 120%로 되친다. 둘레 2칸 아군을 크게 회복.' },
  u_palm:    { name: '파천장', tick: 40, tg: 'dir', len: 6, fx: 'palm', fist: true, eff: [{ t: 'dmg', m: 3.2, type: 'magic', stat: 'mix' }, { t: 'knock', n: 2 }, { t: 'aura', r: 2, m: 1.2 }], fl: '손바닥 하나로 하늘을 연다.', desc: '직선 6칸에 기공 320%, 2칸 밀어낸다. 둘레 2칸 아군을 회복.' },
  u_lampdance:{ name: '성화의 춤', tick: 40, tg: 'dir', len: 6, fx: 'fire', ic: 'lamp', eff: [{ t: 'dmg', m: 3.0, type: 'holy' }, { t: 'status', s: 'burn', dur: 10, p: 3 }, { t: 'ward', r: 4, m: 2.2 }], fl: '성화를 들고 추는 춤.', desc: '직선 6칸에 신성 300%와 화상 (망자, 악마에게 1.5배). 가장 다친 아군에게 큰 보호막.' },
  u_lantern: { name: '천 개의 등불', tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'ward', ic: 'haste', eff: [{ t: 'buff', s: 'quick', p: 45, dur: 20 }, { t: 'buff', s: 'shd', m: 1.4, dur: 16 }], fl: '등불 천 개가 밤을 지운다.', desc: '모든 아군의 행동 소모 −45% (20초), 보호막(마공의 140%).' },
  u_sunrise: { name: '해돋이', tick: 40, tg: 'self', area: 'r2', side: 'enemy', fx: 'holy', ic: 'sun', eff: [{ t: 'dmg', m: 2.5, type: 'holy' }, { t: 'cleanse', to: 'ally', r: 3 }, { t: 'buff', s: 'shd', m: 1.2, dur: 14, to: 'ally', r: 3 }], fl: '어둠이 걷히고 해가 뜬다.', desc: '둘레 2칸 적에게 신성 250%. 둘레 3칸 아군의 상태 이상을 풀고 보호막.' },
  u_skyfire: { name: '유성우', tick: 40, rng: [2, 6], tg: 'tile', area: 'r2', fx: 'meteor', ic: 'meteor', eff: [{ t: 'dmg', m: 2.8, type: 'magic' }, { t: 'status', s: 'burn', dur: 12, p: 4 }], fl: '하늘의 별이 다 떨어진다.', desc: '2칸 반경에 유성 280%, 긴 화상.' },
  u_spellbook:{ name: '금단의 주문', tick: 40, rng: [1, 6], tg: 'enemy', fx: 'thunder', ic: 'bolt', eff: [{ t: 'dmg', m: 3.6, type: 'magic', stat: 'mix', vs: 'wet|slow', vx: 1.4 }, { t: 'chain', n: 5, r: 2, m: 0.7, type: 'magic', stat: 'mix', vs: 'wet|slow', vx: 1.4 }], fl: '책 맨 끝장의 주문.', desc: '적 하나에 뇌격 360%, 곁의 다섯에게 옮겨 간다(70%). 얼거나 젖은 적에게 1.4배.' },
  u_icejail: { name: '영겁의 서리', tick: 40, rng: [1, 5], tg: 'tile', area: 'r2', fx: 'frost', ic: 'frost', eff: [{ t: 'dmg', m: 1.9, type: 'magic', vs: 'burn', vx: 1.4 }, { t: 'status', s: 'slow', dur: 14 }, { t: 'gauge', v: -60 }], fl: '시간마저 얼린다.', desc: '2칸 반경에 190%(화상 입은 적에게 1.4배), 긴 둔화, 게이지를 크게 깎는다.' },
  u_newmoon: { name: '불사의 군단', tick: 40, tg: 'self', fx: 'dark', ic: 'skull', ai: 'summon', cap: 5, eff: [{ t: 'summon', type: 'm_skeleton', n: 5, dur: 35, k: 1.0, ka: 1.3, kh: 1.35, kd: 1.5 }], fl: '죽지 않는 이들이 줄지어 선다.', desc: '35초 동안 싸울 불사 병사 다섯을 부른다.' },
  u_violet:  { name: '명계의 장막', tick: 40, rng: [1, 5], tg: 'tile', area: 'r2', fx: 'poison', ic: 'plague', eff: [{ t: 'dmg', m: 1.7, type: 'magic' }, { t: 'status', s: 'poison', dur: 14, p: 6 }, { t: 'buff', s: 'def', p: -30, dur: 14 }], fl: '장막 너머는 명계다.', desc: '2칸 반경에 피해와 아주 강한 중독, 방어 −30% (14초).' },
  u_supper:  { name: '망자의 만찬', tick: 40, tg: 'self', area: 'r2', side: 'enemy', fx: 'dark', ic: 'drain', eff: [{ t: 'dmg', m: 2.1, type: 'magic', share: 0.8 }], fl: '산 자의 생기로 차린 만찬.', desc: '둘레 2칸 적에게 흑마법 210%. 준 피해의 80%로 가장 다친 아군들을 고친다.' }
};
DS.ULT_UP = {}; DS.ULT_BASE = {}; DS.ULTX = {};
for (var u0 in UX) { var id = 'ux_' + u0.slice(2), X = UX[u0], B = DS.ULTS[u0]; if (!B) continue; X.mp = 0; X.ult = true; X.grand = 1; X.rise = 1; X.of = u0; X.up = B.cls; DS.SKILLS[id] = X; DS.ULTX[id] = X; DS.ULT_UP[u0] = id; DS.ULT_BASE[id] = u0; }
DS.ultUp = function (id, L) { return id && L > 70 && DS.ULT_UP[id] ? DS.ULT_UP[id] : id; };      // 8단(L71)부터 윗길 필살기
DS.ultBaseOf = function (id) { return id && DS.ULT_BASE[id] ? DS.ULT_BASE[id] : id; };
// ── 병과 표: 윗길 열 ──
function r1(v) { return Math.round(v * 100) / 100; }
for (var cls in LINE) {
  var C = DS.CLASSES[cls], Ln = LINE[cls]; if (!C) continue;
  var base = {}, grow = {};
  for (var st in C.base) { var g = C.grow[st] * DS.RISE_G, v70 = C.base[st] + C.grow[st] * 69; grow[st] = r1(g); base[st] = r1(v70 * (DS.RISE_K[st] || 1.3) - grow[st] * 70); }
  var X2 = { name: Ln.t[0], short: Ln.short, rise: cls, start: 8, kind: C.kind, mt: C.mt, master: true, tiers: Ln.t.slice(), base: base, grow: grow, spd: C.spd + 1, mv: C.mv, rng: C.rng.slice(), atk: C.atk, dtype: C.dtype,
    skills: [[SIG[cls][1], 10], [SIG[cls][0], 9], [KIT[cls][1], 8]], merc: C.merc, aura: Ln.aura, kit: {}, blurb: Ln.blurb };
  X2.kit[KIT[cls][0]] = KIT[cls][1];
  ['passive', 'basic', 'martial', 'tags'].forEach(function (k) { if (C[k] != null) X2[k] = C[k] instanceof Array ? C[k].slice() : C[k]; });
  DS.CLASSES[Ln.k] = X2;
  DS.CLS_GEAR[Ln.k] = DS.CLS_GEAR[cls];
  if (DS.GEAR_ALSO && DS.GEAR_ALSO[cls]) DS.GEAR_ALSO[Ln.k] = DS.GEAR_ALSO[cls];
  DS.FLAG[Ln.k] = DS.FLAG[cls];
  if (DS.ORDER && DS.ORDER[cls]) DS.ORDER[Ln.k] = DS.ORDER[cls];
}
// 옛 마스터 키 (배틀 · 택틱스 · 매직마스터) → 묶음의 첫 병과 (옛 기록 · 연무장 · 옛 저장)
DS.OLD_MASTER = { bm: 'inf', tm: 'mar', mm: 'cle' };
DS.oldMasterBase = function (cls, hs) { var F = DS.CLASSES[cls] && DS.FAMILY[DS.CLASSES[cls].fam]; if (!DS.OLD_MASTER[cls]) return cls; return F && hs && F.members.indexOf(hs) >= 0 ? hs : DS.OLD_MASTER[cls]; };
// 옛 마스터 기술 → 그 병과 윗길의 고유 기술 (9단 몫 · 10단 몫)
var OLD9 = ['bm_drive', 'bm_charge', 'tm_hunt', 'tm_gale', 'mm_star', 'mm_grace'], OLD10 = ['bm_tempest', 'bm_storm', 'tm_squall', 'tm_rain', 'mm_sun', 'mm_dawn'];
for (var c2 in SIG) { var M = DS.SK_OLD[c2] = DS.SK_OLD[c2] || {}; OLD9.forEach(function (k) { M[k] = SIG[c2][0]; }); OLD10.forEach(function (k) { M[k] = SIG[c2][1]; }); }
['bm', 'tm', 'mm'].forEach(function (m) { var b = DS.OLD_MASTER[m], M2 = DS.SK_OLD[m] = DS.SK_OLD[m] || {}; OLD9.forEach(function (k) { M2[k] = SIG[b][0]; }); OLD10.forEach(function (k) { M2[k] = SIG[b][1]; }); });
OLD9.forEach(function (k) { DS.SK_OLD._[k] = SIG.inf[0]; }); OLD10.forEach(function (k) { DS.SK_OLD._[k] = SIG.inf[1]; });
// 2.2.9: 윗길 필살기 이름이 저장 · 기록에 남아 있으면 원래 자리의 것으로 (타고난 필살기는 늘 원래 이름으로 적는다)
for (var ux in DS.ULT_BASE) DS.SK_ALIAS[ux] = DS.ULT_BASE[ux];
})();
