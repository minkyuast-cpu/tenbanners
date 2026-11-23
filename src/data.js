// 열 개의 깃발 — 데이터 (10병과, 합일, 용병, 기술, 몬스터, 보스, 아이템)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

DS.LV_PER_TIER = 10;      // 단마다 레벨 1~10
DS.MAX_TIER = 10;
DS.ENDO = { gauge: 50, cd: 15 };      // 2.3.4: 기운초 — 게이지 +50 (예전 100으로 채움), 부대가 함께 15초 쉰다 (예전엔 쉼 없이 거듭 먹어 기술을 끝없이 썼다)
DS.TICK = { regen: 11, attack: 40, item: 25, step: 12, quick: 0.65 };   // 틱(행동) 게이지 규칙
DS.PARTY_MAX = 3;         // 2.2.8: 출전은 셋 — 맹주 + 고른 가주 둘 (meta.js DS.sortieFix · s.party 는 저절로 맞춘 목록). 맹주 가문의 가문원은 따로 함께 싸운다

// 깃발(합일 단위)
DS.FAMILY = {
  battle:  { name: '강철의 세 집', master: 'bm', members: ['inf', 'cav', 'fly'] },
  tactics: { name: '바람의 세 집', master: 'tm', members: ['mar', 'pike', 'arc'] },
  magic:   { name: '별의 네 집', master: 'mm', members: ['cle', 'mon', 'mag', 'sha'] }
};

// ───────── 병과 ─────────
// start: 편입될 때의 단. tiers[0] 이 start 단의 이름.
// base/grow: 레벨지수(L = (단-1)*10 + 레벨) 1 기준 값과 L 당 증가
// mv: 한 칸 이동에 드는 틱 배율, kind: 상성용 분류
DS.CLASSES = {
  inf: { name: '보병', fam: 'battle', start: 1, kind: 'inf', mt: 'foot',
    tiers: ['파이터', '글라디에이터', '히어로', '킹', '카이저', '엠퍼러', '그레이트 엠퍼러'],
    base: { hp: 62, mp: 10, atk: 14, def: 10, mag: 3, res: 5 }, grow: { hp: 5.0, mp: 0.6, atk: 1.25, def: 1.0, mag: 0.3, res: 0.5 },
    spd: 10, mv: 1, rng: [1, 1], atk: 'melee', dtype: 'phys',
    skills: [['cmd_inf', 3], ['inf_bash', 2], ['inf_wall', 4], ['inf_cover', 5]], merc: 'm_sword',
    blurb: '방패를 든 전열. 적을 제게로 끌어 뒤를 지킨다. 4단 킹이 되면 「철벽」, 5단 카이저가 되면 「수호」를 익힌다.' },
  cav: { name: '기병', fam: 'battle', start: 1, kind: 'cav', mt: 'horse',
    tiers: ['나이트', '아크나이트', '실버나이트', '나이트마스터', '골드나이트', '로얄나이트', '로얄가드'],
    base: { hp: 56, mp: 14, atk: 15, def: 8, mag: 7, res: 4 }, grow: { hp: 4.6, mp: 0.9, atk: 1.35, def: 0.85, mag: 0.7, res: 0.45 },
    spd: 11, mv: 0.75, rng: [1, 2], atk: 'thrust', dtype: 'phys',
    skills: [['cmd_cav', 3], ['cav_charge', 3], ['cav_trample', 5], ['cav_hunt', 6]], merc: 'm_lancer',
    blurb: '말을 달려 적진을 꿰뚫는 돌격대. 두 칸 앞까지 닿는 창. 평지에서 빠르지만 숲과 고지에서는 느리다.' },
  fly: { name: '비병', fam: 'battle', start: 2, kind: 'fly', mt: 'fly', tags: ['fly'],
    tiers: ['호크나이트', '페가서스나이트', '유니콘나이트', '드래곤나이트', '드래곤로드', '드래곤마스터'],
    base: { hp: 50, mp: 10, atk: 14, def: 7, mag: 4, res: 6 }, grow: { hp: 4.2, mp: 0.6, atk: 1.3, def: 0.75, mag: 0.4, res: 0.55 },
    spd: 12, mv: 0.7, rng: [1, 2], atk: 'thrust', dtype: 'phys',
    skills: [['cmd_fly', 3], ['fly_dive', 3], ['fly_gale', 5]], merc: 'm_griffin',
    blurb: '내리꽂고 다시 날아오르는 치고 빠지기. 물과 산을 그냥 넘는다. 화살에 약하다.' },
  mar: { name: '해병', fam: 'tactics', start: 2, kind: 'inf', mt: 'swim',
    tiers: ['캡틴', '서펜트나이트', '서펜트로드', '서펜트마스터', '크라켄나이트', '크라켄마스터'],
    base: { hp: 58, mp: 10, atk: 13, def: 9, mag: 5, res: 5 }, grow: { hp: 4.8, mp: 0.6, atk: 1.2, def: 0.95, mag: 0.45, res: 0.55 },
    spd: 10, mv: 1, rng: [1, 1], atk: 'melee', dtype: 'phys', passive: 'marine',
    skills: [['cmd_mar', 3], ['mar_hook', 2], ['mar_surge', 4]], merc: 'm_merman',
    blurb: '작살로 끌어오고 물보라로 밀어낸다. 물 위에서 멀리 움직이고, 물에 서면 강해진다.' },
  pike: { name: '창병', fam: 'tactics', start: 2, kind: 'pike', mt: 'foot',
    tiers: ['로드', '하이로드', '제너럴', '하이랜더', '카운트', '듀크'],
    base: { hp: 54, mp: 16, atk: 14, def: 9, mag: 6, res: 5 }, grow: { hp: 4.5, mp: 1.0, atk: 1.25, def: 0.9, mag: 0.6, res: 0.5 },
    spd: 10, mv: 1, rng: [1, 2], atk: 'thrust', dtype: 'phys',
    skills: [['cmd_pike', 3], ['pike_pin', 2], ['pike_skewer', 3], ['pike_brace', 5]], merc: 'm_pike',
    blurb: '두 칸 창끝으로 발을 묶고, 창벽을 세워 되찌른다. 기병에게 강하다.' },
  arc: { name: '궁병', fam: 'tactics', start: 2, kind: 'arc', mt: 'foot',
    tiers: ['스나이퍼', '레인저', '헌터', '보우로드', '보우마스터', '닌자마스터'],
    base: { hp: 44, mp: 12, atk: 14, def: 5, mag: 4, res: 5 }, grow: { hp: 3.6, mp: 0.7, atk: 1.3, def: 0.55, mag: 0.4, res: 0.5 },
    spd: 11, mv: 1, rng: [2, 4], atk: 'arrow', dtype: 'phys',
    skills: [['charisma', 4], ['arc_mark', 2], ['arc_retreat', 6]], merc: 'm_archer',
    blurb: '표식을 남기고 물러서며 쏜다. 표식이 있는 적은 누구에게나 더 아프게 맞는다. 비병에게 강하다.' },
  cle: { name: '승려', fam: 'magic', start: 1, kind: 'holy', mt: 'foot',
    tiers: ['수련생', '권사', '무승', '철권', '권호', '권성', '무신'],      // 2.2.6: 무투가의 단 이름 (옛 클레릭 … 퀸)
    base: { hp: 54, mp: 24, atk: 13, def: 8, mag: 11, res: 9 }, grow: { hp: 4.6, mp: 1.5, atk: 1.15, def: 0.85, mag: 0.95, res: 0.85 },
    spd: 10, mv: 1, rng: [1, 1], atk: 'melee', dtype: 'phys', martial: true,      // 2.2.5 무투가: 무기의 힘은 공격에도 기공(마공)에도 그대로 (DS.charStats)
    skills: [['cle_combo', 1], ['cmd_cle', 3], ['cle_kick', 3], ['cle_palm', 5]], merc: 'm_sister',
    blurb: '맨손으로 싸우는 무투가. 주먹과 발로 붙어 싸우고, 기공 장풍을 쏘면 곁의 아군이 조금씩 낫는다.' },
  mon: { name: '신관', fam: 'magic', start: 2, kind: 'holy', mt: 'foot',
    tiers: ['몽크', '비숍', '세이지', '패러딘', '세인트', '홀리마스터'],
    base: { hp: 48, mp: 28, atk: 9, def: 6, mag: 12, res: 10 }, grow: { hp: 4.0, mp: 1.9, atk: 0.75, def: 0.65, mag: 1.1, res: 1.0 },
    spd: 11, mv: 1, rng: [1, 1], atk: 'melee', dtype: 'phys',
    skills: [['cmd_mon', 3], ['mon_smite', 2], ['mon_ward', 3], ['mon_sanct', 6], ['mon_haste', 4]], merc: 'm_templar',
    blurb: '등불로 아군을 지키는 서포터. 보호막을 씌우고 상태 이상을 푼다. 4단 세이지가 되면 「신속」을 익힌다. 신성 마법은 망자에게 아프다.' },
  mag: { name: '법사', fam: 'magic', start: 1, kind: 'mage', mt: 'foot',
    tiers: ['매지션', '위저드', '하이위저드', '메이지', '아크메이지', '소서러', '로열위저드'],
    base: { hp: 38, mp: 34, atk: 5, def: 4, mag: 16, res: 9 }, grow: { hp: 3.2, mp: 2.3, atk: 0.4, def: 0.45, mag: 1.45, res: 0.85 },
    spd: 10, mv: 1, rng: [1, 3], atk: 'bolt', dtype: 'magic', basic: 0.75,
    skills: [['cmd_mag', 3], ['mag_ember', 1], ['mag_frost', 3], ['mag_bolt', 5], ['mag_meteor', 7]], merc: 'm_spirit',
    blurb: '불, 얼음, 번개를 맞물려 쓴다. 불에 탄 적은 얼음에, 얼거나 젖은 적은 번개에 약하다. 몸은 약하다.' },
  sha: { name: '사교', fam: 'magic', start: 2, kind: 'mage', mt: 'foot',
    tiers: ['셔먼', '서머너', '워록', '네크로맨서', '일루저니스트', '다크마스터'],
    base: { hp: 42, mp: 32, atk: 6, def: 5, mag: 15, res: 10 }, grow: { hp: 3.5, mp: 2.2, atk: 0.5, def: 0.5, mag: 1.4, res: 0.9 },
    spd: 10, mv: 1, rng: [1, 3], atk: 'bolt', dtype: 'magic', basic: 0.75,
    skills: [['cmd_sha', 3], ['sha_drain', 2], ['sha_raise', 3], ['sha_hex', 4], ['sha_plague', 5]], merc: 'm_skeleton',
    blurb: '저주와 역병으로 적을 무르게 하고, 빨아들인 생기를 아군에게 나눈다. 망자를 불러낸다.' },
  // ── 합일 (8단~10단) ──
  bm: { name: '배틀마스터', short: '배틀', fam: 'battle', start: 8, kind: 'cav', mt: 'horse', master: true,
    tiers: ['배틀마스터', '그랑나이트', '그랜드나이트'],
    base: { hp: 80, mp: 16, atk: 17, def: 11, mag: 7, res: 6 }, grow: { hp: 5.6, mp: 0.9, atk: 1.5, def: 1.1, mag: 0.7, res: 0.6 },
    spd: 12, mv: 0.75, rng: [1, 2], atk: 'thrust', dtype: 'phys',
    skills: [['cmd_bm', 8], ['bm_tempest', 10], ['bm_drive', 9], ['inf_bash', 8], ['cav_charge', 8], ['inf_wall', 8], ['inf_cover', 8], ['fly_gale', 8]], merc: 'm_lancer', mercs: ['m_sword', 'm_lancer', 'm_griffin'],
    blurb: '보병, 기병, 비병이 하나로 합일한 전장의 주인. 9단에 「강철 돌파」, 10단에 「강철 폭풍」을 익힌다.' },
  tm: { name: '택틱스마스터', short: '택틱스', fam: 'tactics', start: 8, kind: 'arc', mt: 'swim', master: true,
    tiers: ['택틱스마스터', '그랑아처', '그랜드아처'],
    base: { hp: 66, mp: 16, atk: 17, def: 8, mag: 6, res: 6 }, grow: { hp: 4.8, mp: 0.9, atk: 1.5, def: 0.85, mag: 0.6, res: 0.6 },
    spd: 12, mv: 1, rng: [1, 4], atk: 'arrow', dtype: 'phys', passive: 'marine',
    skills: [['charisma', 8], ['tm_squall', 10], ['tm_hunt', 9], ['arc_mark', 8], ['pike_pin', 8], ['mar_surge', 8], ['arc_retreat', 8]], merc: 'm_archer', mercs: ['m_merman', 'm_pike', 'm_archer'],
    blurb: '해병, 창병, 궁병이 하나로 합일한 전술의 달인. 9단에 「바람길 화살」, 10단에 「소나기 화살」을 익힌다.' },
  mm: { name: '매직마스터', short: '매직', fam: 'magic', start: 8, kind: 'mage', mt: 'foot', master: true,
    tiers: ['매직마스터', '그랑메이지', '그랜드메이지'],
    base: { hp: 56, mp: 44, atk: 8, def: 6, mag: 19, res: 12 }, grow: { hp: 4.2, mp: 2.6, atk: 0.6, def: 0.65, mag: 1.65, res: 1.1 },
    spd: 11, mv: 1, rng: [1, 3], atk: 'bolt', dtype: 'magic', basic: 0.75,
    skills: [['mon_ward', 8], ['cmd_mm', 8], ['mm_sun', 10], ['mm_star', 9], ['mon_haste', 8], ['mag_ember', 8], ['mag_bolt', 8], ['cle_palm', 8], ['sha_raise', 8], ['mag_meteor', 8]], merc: 'm_spirit', mercs: ['m_sister', 'm_templar', 'm_spirit', 'm_skeleton'],
    blurb: '승려, 신관, 법사, 사교가 하나로 합일한 마도의 정점. 9단에 「별의 가호」, 10단에 「여명의 빛」을 익힌다.' }
};

// ───────── 기술 ─────────
// mp: 마나, tick: 틱 소모, rng: 사거리, tg: enemy|ally|tile|self|dir|allAllies, area: single|r1|r2|adj|all
// 지속 시간(dur)은 초. 보스 기술의 cast 는 예고 시간(초).
DS.SKILLS = {
  bash:      { name: '강타', mp: 4, tick: 50, rng: [1, 1], tg: 'enemy', fx: 'slash', eff: [{ t: 'dmg', m: 1.7 }], desc: '170% 피해.' },
  attackUp:  { name: '강화', mp: 8, tick: 45, rng: [0, 3], tg: 'ally', fx: 'buffRed', eff: [{ t: 'buff', s: 'atk', p: 30, dur: 25 }], desc: '아군 하나의 공격력 +30% (25초).' },
  protect:   { name: '수호', mp: 8, tick: 45, rng: [0, 3], tg: 'ally', fx: 'buffBlue', eff: [{ t: 'buff', s: 'def', p: 30, dur: 25 }], desc: '아군 하나의 방어력 +30% (25초).' },
  thunder:   { name: '번개', mp: 7, tick: 55, rng: [1, 3], tg: 'enemy', fx: 'thunder', eff: [{ t: 'dmg', m: 1.5, type: 'magic', stat: 'mix' }], desc: '뇌격 마법. 방어 대신 마법 저항으로 막는다.' },
  dive:      { name: '급강하', mp: 5, tick: 50, rng: [2, 4], tg: 'enemy', leap: true, fx: 'slash', eff: [{ t: 'dmg', m: 1.5 }], desc: '2~4칸 떨어진 적에게 날아들어 150% 피해.' },
  whirl:     { name: '선풍', mp: 8, tick: 55, tg: 'self', area: 'adj', side: 'enemy', fx: 'wind', eff: [{ t: 'dmg', m: 1.15 }, { t: 'knock', n: 1 }], desc: '인접한 모든 적에게 115% 피해, 1칸 밀어낸다.' },
  harpoon:   { name: '작살', mp: 4, tick: 45, rng: [2, 3], tg: 'enemy', fx: 'arrow', eff: [{ t: 'dmg', m: 1.3 }, { t: 'status', s: 'slow', dur: 10 }], desc: '2~3칸 거리에 130% 피해와 둔화.' },
  tidal:     { name: '해일', mp: 8, tick: 55, tg: 'dir', len: 3, fx: 'water', eff: [{ t: 'dmg', m: 1.4, type: 'magic', stat: 'atk' }, { t: 'knock', n: 1 }], desc: '직선 3칸에 물보라 140%, 1칸 밀어낸다.' },
  slow:      { name: '둔화', mp: 6, tick: 40, rng: [1, 4], tg: 'enemy', fx: 'dark', eff: [{ t: 'status', s: 'slow', dur: 15 }], desc: '보조 마법. 적 하나의 게이지 회복을 15초 동안 늦춘다.' },
  pierce:    { name: '관통', mp: 5, tick: 50, tg: 'dir', len: 3, fx: 'thrust', eff: [{ t: 'dmg', m: 1.3 }], desc: '직선 3칸을 꿰뚫어 130% 피해.' },
  aimed:     { name: '조준 사격', mp: 4, tick: 50, rng: [2, 5], tg: 'enemy', fx: 'arrow', eff: [{ t: 'dmg', m: 1.8 }], desc: '최대 5칸. 180% 피해.' },
  charisma:  { name: '통솔', mp: 10, tick: 50, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold',
               eff: [{ t: 'buff', s: 'atk', p: 20, dur: 30 }, { t: 'buff', s: 'def', p: 20, dur: 30 }, { t: 'gauge', v: 25 }], desc: '호령 — 모든 아군의 공격, 방어 +20% (30초), 게이지 +25.' },
  arrowRain: { name: '화살비', mp: 10, tick: 60, rng: [2, 4], tg: 'tile', area: 'r1', fx: 'arrowRain', eff: [{ t: 'dmg', m: 1.25 }], desc: '십자 범위에 125% 피해.' },
  heal:      { name: '치유', mp: 6, tick: 40, rng: [0, 3], tg: 'ally', fx: 'heal', eff: [{ t: 'heal', m: 2.4 }], desc: '아군 하나의 HP를 회복.' },
  cure:      { name: '정화', mp: 5, tick: 35, rng: [0, 3], tg: 'ally', fx: 'heal', eff: [{ t: 'cleanse' }, { t: 'heal', m: 1.0 }], desc: '상태 이상을 풀고 조금 회복.' },
  healAll:   { name: '모두 치유', mp: 16, tick: 60, tg: 'self', area: 'r2', side: 'ally', fx: 'heal', eff: [{ t: 'heal', m: 1.7 }], desc: '주변 2칸의 아군을 모두 회복.' },
  holy:      { name: '빛의 창', mp: 6, tick: 50, rng: [1, 3], tg: 'enemy', fx: 'holy', eff: [{ t: 'dmg', m: 1.5, type: 'holy' }], desc: '신성 마법. 망자, 악마에게 1.5배.' },
  quick:     { name: '신속', mp: 10, tick: 45, rng: [0, 3], tg: 'ally', fx: 'buffGold', eff: [{ t: 'buff', s: 'quick', p: 35, dur: 30 }], desc: '아군 하나의 행동 소모를 30초 동안 35% 줄인다.' },
  bless:     { name: '큰 축복', mp: 16, tick: 60, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold', eff: [{ t: 'buff', s: 'def', p: 25, dur: 30 }, { t: 'heal', m: 0.8 }], desc: '모든 아군의 방어 +25% (30초), 조금 회복.' },
  fire:      { name: '화염', mp: 7, tick: 55, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'fire', eff: [{ t: 'dmg', m: 1.15, type: 'magic' }], desc: '십자 범위에 불 115%.' },
  ice:       { name: '얼음창', mp: 7, tick: 50, rng: [1, 4], tg: 'enemy', fx: 'water', eff: [{ t: 'dmg', m: 1.7, type: 'magic' }, { t: 'status', s: 'slow', dur: 10 }], desc: '얼음 170% 피해와 둔화.' },
  blizzard:  { name: '눈보라', mp: 14, tick: 65, rng: [1, 4], tg: 'tile', area: 'r2', fx: 'water', eff: [{ t: 'dmg', m: 1.3, type: 'magic' }, { t: 'status', s: 'slow', dur: 8 }], desc: '2칸 반경에 눈보라 130%와 둔화.' },
  meteor:    { name: '별똥별', mp: 22, tick: 80, rng: [2, 5], tg: 'tile', area: 'r2', fx: 'meteor', eff: [{ t: 'dmg', m: 2.0, type: 'magic' }], desc: '2칸 반경에 운석 200%.' },
  drain:     { name: '생기 흡수', mp: 6, tick: 50, rng: [1, 3], tg: 'enemy', fx: 'dark', eff: [{ t: 'dmg', m: 1.3, type: 'magic', drain: 0.6 }], desc: '흑마법 130%. 준 피해의 60%만큼 회복.' },
  summon:    { name: '망자 부름', mp: 14, tick: 60, tg: 'self', fx: 'dark', ai: 'summon', cap: 2, eff: [{ t: 'summon', type: 'm_skeleton', n: 1, dur: 45 }], desc: '45초 동안 싸워 줄 해골 병사를 부른다 (최대 2).' },
  curse:     { name: '저주', mp: 8, tick: 45, rng: [1, 4], tg: 'enemy', fx: 'dark', eff: [{ t: 'buff', s: 'atk', p: -25, dur: 20 }, { t: 'buff', s: 'def', p: -25, dur: 20 }], desc: '적 하나의 공격, 방어 -25% (20초).' },
  deathCloud:{ name: '독안개', mp: 14, tick: 60, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'poison', eff: [{ t: 'dmg', m: 1.1, type: 'magic' }, { t: 'status', s: 'poison', dur: 12, p: 4 }], desc: '십자 범위에 독안개. 피해와 중독.' },
  // ── 호령: 병과마다 하나인 지휘 기술 (궁병·택틱스마스터는 위의 「통솔」).
  //    2.2.0: 가솔이 없어져 모든 아군에게 걸린다 (예전 mercOnly — 세기는 절반). 자동 전투는 버프가 꺼진 아군이 둘 이상인 큰 싸움에서 쓴다.
  cmd_inf:  { name: '방패 올려!', mp: 8, tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffBlue', eff: [{ t: 'buff', s: 'def', p: 15, dur: 25 }, { t: 'taunt', to: 'foe', r: 2, dur: 6 }], desc: '호령 — 모든 아군의 방어 +15% (25초). 둘레 2칸 적은 6초 동안 나를 노린다.' },      // 2.2.6 보병: 방패 전열은 호령에도 도발이 붙는다
  cmd_cav:  { name: '돌격!', mp: 8, tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffRed', eff: [{ t: 'buff', s: 'atk', p: 12, dur: 12 }, { t: 'gauge', v: 40 }], desc: '호령 — 모든 아군의 공격 +12% (12초), 게이지 +40.' },
  cmd_fly:  { name: '강습 신호', mp: 8, tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold', eff: [{ t: 'buff', s: 'quick', p: 15, dur: 25 }, { t: 'gauge', v: 15 }], desc: '호령 — 모든 아군의 행동 소모 −15% (25초), 게이지 +15.' },
  cmd_mar:  { name: '버텨라!', mp: 8, tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffBlue', eff: [{ t: 'buff', s: 'def', p: 12, dur: 20 }, { t: 'gauge', v: 25 }], desc: '호령 — 모든 아군의 방어 +12% (20초), 게이지 +25.' },
  cmd_pike: { name: '창벽 세워!', mp: 8, tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffBlue', eff: [{ t: 'buff', s: 'def', p: 15, dur: 25 }, { t: 'buff', s: 'atk', p: 5, dur: 25 }], desc: '호령 — 모든 아군의 방어 +15%, 공격 +5% (25초).' },
  cmd_cle:  { name: '호흡을 맞춰라', mp: 10, tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'chi', eff: [{ t: 'buff', s: 'def', p: 15, dur: 20 }, { t: 'heal', m: 0.7 }], desc: '호령 — 모든 아군의 방어 +15% (20초), 기를 고르게 돌려 모두 조금 회복.' },      // 2.2.5: 무투가가 맡던 치유 몫 일부
  cmd_mon:  { name: '축복의 구령', mp: 10, tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold', eff: [{ t: 'buff', s: 'quick', p: 12, dur: 20 }, { t: 'buff', s: 'def', p: 8, dur: 20 }], desc: '호령 — 모든 아군의 행동 소모 −12%, 방어 +8% (20초).' },
  cmd_mag:  { name: '마력을 받아라', mp: 10, tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffRed', eff: [{ t: 'buff', s: 'atk', p: 15, dur: 25 }], desc: '호령 — 모든 아군의 공격 +15% (25초).' },
  cmd_sha:  { name: '피의 계약', mp: 10, tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffRed', eff: [{ t: 'buff', s: 'atk', p: 22, dur: 20 }, { t: 'buff', s: 'def', p: -8, dur: 20 }], desc: '호령 — 모든 아군의 공격 +22%, 대신 방어 −8% (20초).' },
  cmd_bm:   { name: '전군 돌격', mp: 12, tick: 45, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold', eff: [{ t: 'buff', s: 'quick', p: 15, dur: 20 }, { t: 'gauge', v: 40 }], desc: '호령 — 모든 아군의 행동 소모 −15% (20초), 게이지 +40.' },
  cmd_mm:   { name: '별빛 가호', mp: 14, tick: 45, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold', eff: [{ t: 'buff', s: 'atk', p: 15, dur: 20 }, { t: 'buff', s: 'quick', p: 15, dur: 20 }], desc: '호령 — 모든 아군의 공격 +15%, 행동 소모 −15% (20초).' },
  // ── 2.2.5 승려(무투가)의 기술: 맨손 · 발 · 기공. fist = 기술 칸의 주먹 그림 (game.js skType). aura = 쓰는 이 둘레 r칸 아군을 마공 × m 만큼 고친다 (우리 편 치유 배율 그대로)
  cle_combo: { name: '연환권', mp: 4, tick: 45, rng: [1, 1], tg: 'enemy', fx: 'fist', fist: true, eff: [{ t: 'dmg', m: 0.6 }, { t: 'dmg', m: 0.6 }, { t: 'dmg', m: 0.7 }, { t: 'mend', r: 4, m: 1.3 }], desc: '붙은 적을 주먹, 주먹, 발로 세 번 친다. 모두 190%. 기를 돌려 4칸 안에서 가장 다친 아군 하나(자신 포함)를 조금 회복.' },
  cle_kick:  { name: '비연각', mp: 5, tick: 50, rng: [2, 3], tg: 'enemy', leap: true, fx: 'kick', fist: true, eff: [{ t: 'dmg', m: 1.6 }, { t: 'gauge', v: -25 }], desc: '2~3칸 밖의 적에게 날아차기 160%, 게이지를 깎는다.' },
  cle_palm:  { name: '기공장', mp: 10, tick: 55, rng: [1, 2], tg: 'enemy', fx: 'palm', fist: true, eff: [{ t: 'dmg', m: 1.8, type: 'magic', stat: 'mix' }, { t: 'knock', n: 1 }, { t: 'aura', r: 2, m: 1.2 }, { t: 'mend', r: 4, m: 1.0 }], desc: '2칸 안의 적 하나에 기공 180%(마법 저항으로 막는다), 1칸 밀어낸다. 둘레 2칸 아군을 회복하고, 4칸 안에서 가장 다친 아군은 더 회복.' },
  // ── 2.2.6 병과마다 새 기술 (옛 기술은 아래에 그대로 둔다 — 장비 · 옛 기록이 쓴다. 옛 이름 → 새 이름은 DS.SK_OLD)
  //   덧효과: taunt 도발(그 적이 dur 초 동안 나를 노린다) · pull 끌어오기 · buff s 'shd' 보호막(공격 · 마공 × m 을 먼저 막는다) · ward 4칸 안 가장 다친 아군에게 보호막 · share 준 피해의 몫으로 가장 다친 아군 회복
  //           chain 곁의 적에게 옮겨 간다 · status mark 표식(누구에게나 받는 피해 +p%) · burn 화상(2초마다 최대 체력의 p%) · wet 젖음(번개에 약하다)
  //   vs: 그 상태인 적에게 vx 배 (slow 둔화 · mark 표식 · burn 화상 · wet 젖음 · curse 저주(공격 · 방어가 깎임) · low 체력 절반 아래, '|' 는 「또는」)
  //   to: 'foe' | 'ally' | 'self' — 그 덧효과만 다른 무리에게 (r 칸 안, at: 'tgt' 면 대상 둘레) · dash 직선 끝까지 달려 나간다 · back 쓰고 나서 n 칸 물러선다 · ic 기술 칸 그림
  // 보병 (로저스): 방패 전열 — 도발 · 보호막 · 되치기
  inf_bash:   { name: '방패 치기', mp: 3, tick: 45, rng: [1, 1], tg: 'enemy', fx: 'shield', ic: 'shieldbash', eff: [{ t: 'dmg', m: 2.6 }, { t: 'gauge', v: -30 }, { t: 'taunt', dur: 6 }], desc: '붙은 적을 방패로 쳐 260%, 게이지를 깎고 6초 동안 나를 노리게 한다.' },
  inf_wall:   { name: '철벽', mp: 8, tick: 45, tg: 'self', side: 'ally', fx: 'guard', ic: 'bulwark', eff: [{ t: 'buff', s: 'def', p: 40, dur: 12 }, { t: 'buff', s: 'ctr', p: 100, dur: 12 }, { t: 'taunt', to: 'foe', r: 2, dur: 8 }], desc: '12초 동안 방어 +40%, 붙어 때린 적을 100%로 되친다. 둘레 2칸 적은 나를 노린다.' },
  inf_cover:  { name: '수호', mp: 8, tick: 40, rng: [1, 3], tg: 'ally', fx: 'cover', ic: 'cover', eff: [{ t: 'buff', s: 'shd', m: 1.8, stat: 'atk', dur: 15 }, { t: 'taunt', to: 'foe', at: 'tgt', r: 1, dur: 6 }], desc: '3칸 안 아군 하나에게 방패를 대 준다. 보호막(공격의 180%, 15초), 그 곁의 적은 나를 노린다.' },
  // 기병 (라니스터): 돌격 — 꿰뚫고 달려 나가기 · 짓밟기 · 추격
  cav_charge: { name: '돌파', mp: 6, tick: 50, tg: 'dir', len: 4, dash: true, fx: 'charge', ic: 'charge', eff: [{ t: 'dmg', m: 1.5 }, { t: 'gauge', v: -20 }], desc: '직선 4칸을 꿰뚫고 달려 나간다. 길 위의 적에게 150%, 게이지를 깎는다.' },
  cav_trample:{ name: '말발굽', mp: 7, tick: 50, tg: 'self', area: 'r1', side: 'enemy', fx: 'quake', ic: 'hoof', eff: [{ t: 'dmg', m: 1.35 }, { t: 'status', s: 'slow', dur: 6 }], desc: '말을 세워 둘레 1칸 적을 짓밟는다. 135%와 둔화.' },
  cav_hunt:   { name: '추격', mp: 5, tick: 45, rng: [2, 4], tg: 'enemy', leap: true, fx: 'thrust', ic: 'hunt', eff: [{ t: 'dmg', m: 1.5, vs: 'low', vx: 1.5 }], desc: '2~4칸 밖의 적에게 달려들어 150%. 체력이 절반 아래인 적에게 1.5배.' },
  // 비병 (스카이워커): 치고 빠지기 — 내리꽂고 날아오른다
  fly_dive:   { name: '급강하', mp: 5, tick: 45, rng: [2, 4], tg: 'enemy', leap: true, back: 2, fx: 'dive', ic: 'dive', eff: [{ t: 'dmg', m: 1.4, vs: 'mark', vx: 1.5 }], desc: '2~4칸 밖의 적에게 내리꽂아 140%(표식이 있으면 1.5배), 두 칸 날아오른다.' },
  fly_gale:   { name: '날개 바람', mp: 7, tick: 50, tg: 'self', area: 'adj', side: 'enemy', back: 2, fx: 'wind', ic: 'gust', eff: [{ t: 'dmg', m: 1.25 }, { t: 'knock', n: 1 }, { t: 'gauge', v: -25 }], desc: '둘레 적에게 125%, 밀어내고 게이지를 깎은 뒤 두 칸 날아오른다.' },
  // 해병 (앗쎄이): 물길 — 끌어오고 밀어내고 젖게 한다
  mar_hook:   { name: '갈고리 작살', mp: 4, tick: 45, rng: [2, 4], tg: 'enemy', fx: 'hook', ic: 'hook', eff: [{ t: 'dmg', m: 1.1 }, { t: 'pull', n: 2 }, { t: 'status', s: 'slow', dur: 6 }], desc: '2~4칸 밖의 적에게 작살 110%, 두 칸 끌어오고 둔화.' },
  mar_surge:  { name: '파도 밀기', mp: 7, tick: 50, tg: 'dir', len: 3, fx: 'water', ic: 'wave', eff: [{ t: 'dmg', m: 1.5, type: 'magic', stat: 'atk' }, { t: 'knock', n: 1 }, { t: 'status', s: 'wet', dur: 12 }], desc: '직선 3칸에 물보라 150%, 밀어내고 젖게 한다. 젖은 적은 번개에 1.5배로 맞는다.' },
  // 창병 (프레이): 창벽 — 발 묶기 · 꿰뚫기 · 되찌르기
  pike_pin:   { name: '발 묶기', mp: 4, tick: 45, rng: [1, 2], tg: 'enemy', fx: 'thrust', ic: 'pin', eff: [{ t: 'dmg', m: 1.6 }, { t: 'status', s: 'slow', dur: 10 }, { t: 'gauge', v: -20 }], desc: '두 칸 창끝으로 160%, 10초 둔화, 게이지를 깎는다.' },
  pike_skewer:{ name: '꿰뚫기', mp: 6, tick: 50, tg: 'dir', len: 3, fx: 'thrust', ic: 'skewer', eff: [{ t: 'dmg', m: 1.8, vs: 'slow', vx: 1.4 }], desc: '직선 3칸을 꿰뚫어 180%. 둔화된 적에게 1.4배.' },
  pike_brace: { name: '창벽', mp: 8, tick: 45, tg: 'self', area: 'r1', side: 'ally', fx: 'brace', ic: 'brace', eff: [{ t: 'buff', s: 'def', p: 20, dur: 12 }, { t: 'buff', s: 'ctr', p: 50, dur: 12 }], desc: '나와 곁의 아군이 창을 세운다. 방어 +20%, 붙어 때린 적을 50%로 되찌른다 (12초).' },
  // 궁병 (퀸): 표식 사냥 — 표식 · 물러서며 쏘기
  arc_mark:   { name: '표식 사격', mp: 4, tick: 45, rng: [2, 5], tg: 'enemy', fx: 'mark', ic: 'mark', eff: [{ t: 'dmg', m: 1.2 }, { t: 'status', s: 'mark', dur: 12, p: 20 }], desc: '최대 5칸. 120%, 표식을 남긴다. 표식이 있는 적은 누구에게나 20% 더 아프게 맞는다 (12초).' },
  arc_retreat:{ name: '뒷걸음 사격', mp: 5, tick: 45, rng: [1, 5], tg: 'enemy', back: 2, fx: 'arrow', ic: 'retreat', eff: [{ t: 'dmg', m: 1.7, vs: 'mark', vx: 1.3 }], desc: '쏘고 두 칸 물러선다. 170%, 표식이 있으면 1.3배.' },
  // 신관 (카마도): 등불 가호 — 보호막 · 정화 · 신성
  mon_smite:  { name: '등불 치기', mp: 5, tick: 45, rng: [1, 3], tg: 'enemy', fx: 'holy', ic: 'lamp', eff: [{ t: 'dmg', m: 2.4, type: 'holy' }, { t: 'ward', r: 4, m: 0.9 }], desc: '신성 240% (망자, 악마에게 1.5배). 그 빛이 4칸 안 가장 다친 아군에게 작은 보호막이 된다.' },
  mon_ward:   { name: '등불 가호', mp: 7, tick: 40, rng: [0, 3], tg: 'ally', fx: 'ward', ic: 'ward', eff: [{ t: 'buff', s: 'shd', m: 2.2, dur: 15 }, { t: 'cleanse' }], desc: '아군 하나에게 보호막(마공의 220%, 15초)을 씌우고 상태 이상을 푼다.' },
  mon_haste:  { name: '신속', mp: 10, tick: 40, rng: [0, 3], tg: 'ally', ai: 'boss', fx: 'buffGold', ic: 'haste', eff: [{ t: 'buff', s: 'quick', p: 35, dur: 20 }, { t: 'gauge', v: 30 }], desc: '아군 하나의 행동 소모 −35% (20초), 게이지 +30.' },
  mon_sanct:  { name: '성역', mp: 14, tick: 55, tg: 'self', area: 'r2', side: 'ally', fx: 'sanct', ic: 'sanct', eff: [{ t: 'buff', s: 'shd', m: 1.2, dur: 15 }, { t: 'buff', s: 'def', p: 20, dur: 20 }, { t: 'heal', m: 0.5 }], desc: '둘레 2칸 아군에게 보호막(마공의 120%)과 방어 +20% (20초), 조금 회복.' },
  // 법사 (그레인저): 원소 맞물림 — 불은 화상, 얼음은 화상 입은 적에게, 번개는 얼거나 젖은 적에게
  mag_ember:  { name: '불씨', mp: 7, tick: 50, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'fire', ic: 'flame', eff: [{ t: 'dmg', m: 0.8, type: 'magic' }, { t: 'status', s: 'burn', dur: 8, p: 2 }], desc: '십자 범위에 불 80%, 8초 화상.' },
  mag_frost:  { name: '얼음창', mp: 6, tick: 50, rng: [1, 4], tg: 'enemy', fx: 'frost', ic: 'frost', eff: [{ t: 'dmg', m: 1.5, type: 'magic', vs: 'burn', vx: 1.4 }, { t: 'status', s: 'slow', dur: 10 }], desc: '얼음 150%, 10초 둔화. 화상을 입은 적에게 1.4배.' },
  mag_bolt:   { name: '연쇄 번개', mp: 12, tick: 55, rng: [1, 4], tg: 'enemy', fx: 'thunder', ic: 'bolt', eff: [{ t: 'dmg', m: 1.3, type: 'magic', stat: 'mix', vs: 'wet|slow', vx: 1.5 }, { t: 'chain', n: 2, r: 2, m: 0.7, type: 'magic', stat: 'mix', vs: 'wet|slow', vx: 1.5 }], desc: '번개 130%, 2칸 안의 두 적에게 옮겨 간다(70%). 얼거나(둔화) 젖은 적에게 1.5배.' },
  mag_meteor: { name: '별똥별', mp: 20, tick: 70, rng: [2, 5], tg: 'tile', area: 'r1', fx: 'meteor', ic: 'meteor', eff: [{ t: 'dmg', m: 1.2, type: 'magic', vs: 'burn', vx: 1.3 }, { t: 'status', s: 'burn', dur: 6, p: 1.5 }], desc: '십자 범위에 운석 120%, 화상. 이미 화상을 입은 적에게 1.3배.' },
  // 사교 (아담스): 저주와 망자 — 생기 나눔 · 저주 · 역병 · 부름
  sha_drain:  { name: '생기 나눔', mp: 5, tick: 45, rng: [1, 3], tg: 'enemy', fx: 'dark', ic: 'drain', eff: [{ t: 'dmg', m: 1.6, type: 'magic', share: 0.6 }], desc: '흑마법 160%. 준 피해의 60%로 4칸 안 가장 다친 아군(자신 포함)을 고친다.' },
  sha_raise:  { name: '망자 부름', mp: 12, tick: 55, cd: 14, tg: 'self', fx: 'dark', ic: 'skull', ai: 'summon', cap: 2, eff: [{ t: 'summon', type: 'm_skeleton', n: 1, dur: 40, k: 0.85, ka: 1.2, kh: 1.3, kd: 1.5 }], desc: '40초 동안 싸울 해골 병사를 부른다 (둘까지).' },
  sha_hex:    { name: '저주', mp: 7, tick: 45, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'curse', ic: 'hex', eff: [{ t: 'dmg', m: 1.2, type: 'magic' }, { t: 'buff', s: 'def', p: -20, dur: 12 }, { t: 'buff', s: 'atk', p: -15, dur: 12 }], desc: '십자 범위에 120%, 방어 −20%, 공격 −15% (12초).' },
  sha_plague: { name: '역병 안개', mp: 12, tick: 55, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'poison', ic: 'plague', eff: [{ t: 'dmg', m: 1.4, type: 'magic', vs: 'curse', vx: 1.4 }, { t: 'status', s: 'poison', dur: 12, p: 3 }], desc: '십자 범위에 독안개 140%, 12초 중독. 저주받은 적에게 1.4배.' },
  // ── 합일한 마스터의 고유 기술 (9단·10단). 자동 전투는 목록의 앞쪽 기술부터 살피므로 병과 표에서 앞에 둔다 ──
  bm_charge: { name: '강철 돌격', mp: 12, tick: 55, tg: 'dir', len: 4, fx: 'thrust', eff: [{ t: 'dmg', m: 1.6 }, { t: 'knock', n: 1 }], desc: '직선 4칸을 꿰뚫어 160%, 1칸 밀어낸다.' },
  bm_storm:  { name: '강철 폭풍', mp: 18, tick: 65, tg: 'self', area: 'r2', side: 'enemy', fx: 'slash', eff: [{ t: 'dmg', m: 1.7 }, { t: 'gauge', v: -30 }], desc: '둘레 2칸의 모든 적에게 170%, 게이지를 깎는다.' },
  tm_gale:   { name: '바람길 화살', mp: 10, tick: 50, rng: [2, 6], tg: 'enemy', fx: 'arrow', eff: [{ t: 'dmg', m: 2.2 }, { t: 'status', s: 'slow', dur: 8 }], desc: '최대 6칸. 220% 피해와 둔화.' },
  tm_rain:   { name: '소나기 화살', mp: 18, tick: 65, rng: [2, 5], tg: 'tile', area: 'r2', fx: 'arrowRain', eff: [{ t: 'dmg', m: 1.5 }], desc: '2칸 반경에 화살 소나기 150%.' },
  mm_grace:  { name: '별의 가호', mp: 22, tick: 60, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold', eff: [{ t: 'buff', s: 'atk', p: 20, dur: 25 }, { t: 'heal', m: 1.0 }], desc: '모든 아군의 공격 +20% (25초), 조금 회복.' },
  mm_dawn:   { name: '여명의 빛', mp: 26, tick: 75, rng: [1, 5], tg: 'tile', area: 'r2', fx: 'holy', eff: [{ t: 'dmg', m: 1.8, type: 'holy' }], desc: '2칸 반경에 신성 180%. 망자, 악마에게 1.5배.' },
  // 2.2.6 합일한 마스터의 새 고유 기술 (옛 bm_charge · bm_storm · tm_gale · tm_rain · mm_grace · mm_dawn 은 위에 그대로 — DS.SK_OLD)
  bm_drive:   { name: '강철 돌파', mp: 12, tick: 55, tg: 'dir', len: 5, dash: true, fx: 'charge', ic: 'charge', eff: [{ t: 'dmg', m: 1.8 }, { t: 'gauge', v: -30 }], desc: '직선 5칸을 꿰뚫고 달려 나간다. 길 위의 적에게 180%, 게이지를 깎는다.' },
  bm_tempest: { name: '강철 폭풍', mp: 16, tick: 60, tg: 'self', area: 'r2', side: 'enemy', fx: 'slash', ic: 'bulwark', eff: [{ t: 'dmg', m: 1.7 }, { t: 'gauge', v: -30 }, { t: 'taunt', dur: 6 }], desc: '둘레 2칸의 모든 적에게 170%, 게이지를 깎고 나를 노리게 한다.' },
  tm_hunt:    { name: '바람길 화살', mp: 10, tick: 50, rng: [2, 6], tg: 'enemy', fx: 'mark', ic: 'mark', eff: [{ t: 'dmg', m: 2.0, vs: 'mark', vx: 1.3 }, { t: 'status', s: 'slow', dur: 8 }, { t: 'status', s: 'mark', dur: 10, p: 20 }], desc: '최대 6칸. 200%(표식이 있으면 1.3배), 둔화와 표식.' },
  tm_squall:  { name: '소나기 화살', mp: 16, tick: 60, rng: [2, 5], tg: 'tile', area: 'r2', fx: 'arrowRain', ic: 'volley', eff: [{ t: 'dmg', m: 1.4, vs: 'mark', vx: 1.4 }], desc: '2칸 반경에 화살 소나기 140%. 표식이 있는 적에게 1.4배.' },
  mm_star:    { name: '별의 가호', mp: 20, tick: 55, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold', ic: 'star', eff: [{ t: 'buff', s: 'atk', p: 20, dur: 25 }, { t: 'heal', m: 1.0 }], desc: '모든 아군의 공격 +20% (25초), 조금 회복.' },
  mm_sun:     { name: '여명의 빛', mp: 22, tick: 65, rng: [1, 5], tg: 'tile', area: 'r2', fx: 'holy', ic: 'sun', eff: [{ t: 'dmg', m: 1.7, type: 'holy' }, { t: 'ward', r: 4, m: 1.2 }], desc: '2칸 반경에 신성 170% (망자, 악마에게 1.5배). 가장 다친 아군에게 보호막.' },
  // ── 이름난 용병(영웅·전설)의 고유 기술: 마나 0, 재사용 시간(cd) ──
  ms_cleave: { name: '휩쓸기', mp: 0, tick: 50, cd: 9, tg: 'self', area: 'adj', side: 'enemy', fx: 'slash', eff: [{ t: 'dmg', m: 1.2 }], desc: '둘레의 적을 모두 벤다 (120%).' },
  ms_rush:   { name: '몸통 박치기', mp: 0, tick: 45, cd: 10, rng: [2, 4], tg: 'enemy', leap: true, fx: 'slash', eff: [{ t: 'dmg', m: 1.4 }, { t: 'gauge', v: -30 }], desc: '2~4칸 밖의 적에게 뛰어들어 140%, 게이지를 깎는다.' },
  ms_dive:   { name: '내리꽂기', mp: 0, tick: 45, cd: 9, rng: [2, 4], tg: 'enemy', leap: true, fx: 'wind', eff: [{ t: 'dmg', m: 1.5 }], desc: '2~4칸 밖의 적에게 내리꽂아 150%.' },
  ms_tide:   { name: '물보라', mp: 0, tick: 50, cd: 10, tg: 'dir', len: 3, fx: 'water', eff: [{ t: 'dmg', m: 1.3 }, { t: 'knock', n: 1 }], desc: '직선 3칸에 130%, 1칸 밀어낸다.' },
  ms_brace:  { name: '꿰기', mp: 0, tick: 50, cd: 8, tg: 'dir', len: 3, fx: 'thrust', eff: [{ t: 'dmg', m: 1.35 }], desc: '직선 3칸을 꿰뚫어 135%.' },
  ms_guard:  { name: '버티기', mp: 0, tick: 40, cd: 16, tg: 'self', side: 'ally', fx: 'buffBlue', eff: [{ t: 'buff', s: 'def', p: 40, dur: 8 }], desc: '8초 동안 자기 방어 +40%.' },
  ms_cheer:  { name: '함성', mp: 0, tick: 45, cd: 20, tg: 'self', area: 'r2', side: 'ally', fx: 'buffRed', eff: [{ t: 'buff', s: 'atk', p: 20, dur: 10 }], desc: '둘레 2칸 아군의 공격 +20% (10초).' },
  ms_snipe:  { name: '꿰뚫는 한 발', mp: 0, tick: 50, cd: 8, rng: [2, 5], tg: 'enemy', fx: 'arrow', eff: [{ t: 'dmg', m: 1.8 }], desc: '최대 5칸. 180% 피해.' },
  ms_volley: { name: '연달아 쏘기', mp: 0, tick: 55, cd: 10, rng: [2, 4], tg: 'tile', area: 'r1', fx: 'arrowRain', eff: [{ t: 'dmg', m: 1.1 }], desc: '십자 범위에 110%.' },
  ms_pin:    { name: '발 묶기', mp: 0, tick: 40, cd: 12, rng: [1, 4], tg: 'enemy', fx: 'arrow', eff: [{ t: 'status', s: 'slow', dur: 10 }], desc: '적 하나를 10초 동안 둔하게 한다.' },
  ms_mend:   { name: '급한 손길', mp: 0, tick: 40, cd: 10, rng: [0, 3], tg: 'ally', fx: 'heal', eff: [{ t: 'heal', m: 1.6 }], desc: '아군 하나를 크게 고친다.' },
  ms_smite:  { name: '심판의 빛', mp: 0, tick: 50, cd: 9, rng: [1, 3], tg: 'enemy', fx: 'holy', eff: [{ t: 'dmg', m: 1.5, type: 'holy' }], desc: '신성 150%. 망자, 악마에게 1.5배.' },
  ms_quake:  { name: '땅 구르기', mp: 0, tick: 55, cd: 12, tg: 'self', area: 'r1', side: 'enemy', fx: 'quake', eff: [{ t: 'dmg', m: 1.2 }, { t: 'gauge', v: -30 }], desc: '둘레 1칸의 적에게 120%, 게이지를 깎는다.' },
  ms_leech:  { name: '기운 훔치기', mp: 0, tick: 50, cd: 8, rng: [1, 2], tg: 'enemy', fx: 'dark', eff: [{ t: 'dmg', m: 1.2, type: 'magic', drain: 0.5 }], desc: '흑마법 120%. 준 피해의 절반만큼 회복.' },
  // 아이템

  // ── 적 전용 ──
  e_smash:  { name: '내려찍기', mp: 0, tick: 50, rng: [1, 1], tg: 'enemy', fx: 'slash', cd: 8, eff: [{ t: 'dmg', m: 1.5 }] },
  e_fire:   { name: '화염구', mp: 0, tick: 55, rng: [1, 3], tg: 'tile', area: 'r1', fx: 'fire', cd: 9, eff: [{ t: 'dmg', m: 0.95, type: 'magic' }] },
  e_heal:   { name: '암흑 치유', mp: 0, tick: 45, rng: [0, 3], tg: 'ally', fx: 'healDark', cd: 6, eff: [{ t: 'heal', m: 2.0 }] },
  e_drain:  { name: '기운 빨기', mp: 0, tick: 50, rng: [1, 2], tg: 'enemy', fx: 'dark', cd: 7, eff: [{ t: 'dmg', m: 1.15, type: 'magic', drain: 0.5 }] },
  e_poison: { name: '독침', mp: 0, tick: 45, rng: [1, 1], tg: 'enemy', fx: 'slash', cd: 8, eff: [{ t: 'dmg', m: 1.0 }, { t: 'status', s: 'poison', dur: 10, p: 3 }] },
  // ── 보스 (cast = 예고 후 발동) ──
  b_charge: { name: '짓밟는 돌격', tick: 50, tg: 'dir', len: 4, cast: 1.8, fx: 'thrust', cd: 10, eff: [{ t: 'dmg', m: 1.4 }, { t: 'knock', n: 1 }] },
  b_boulder:{ name: '바위 던지기', tick: 50, tg: 'unit', area: 'r1', cast: 2.2, fx: 'quake', cd: 10, eff: [{ t: 'dmg', m: 1.3 }, { t: 'status', s: 'slow', dur: 6 }] },
  b_harden: { name: '돌 살갗', tick: 40, tg: 'self', side: 'ally', fx: 'buffBlue', cd: 20, ai: 'buff', eff: [{ t: 'buff', s: 'def', p: 30, dur: 8 }] },
  b_cavein: { name: '낙반', tick: 50, tg: 'multi', n: 4, area: 'single', cast: 2.0, fx: 'quake', cd: 11, eff: [{ t: 'dmg', m: 1.5 }, { t: 'gauge', v: -30 }] },
  b_gloom:  { name: '갱도의 어둠', tick: 50, tg: 'self', area: 'r2', side: 'enemy', cast: 2.4, fx: 'dark', cd: 13, eff: [{ t: 'dmg', m: 1.3, type: 'magic', stat: 'atk' }, { t: 'buff', s: 'atk', p: -20, dur: 10 }] },
  b_howl:   { name: '포효', tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffRed', cd: 16, ai: 'buff', eff: [{ t: 'buff', s: 'atk', p: 25, dur: 12 }, { t: 'gauge', v: 30 }] },
  b_pounce: { name: '도약 습격', tick: 50, rng: [2, 4], tg: 'enemy', leap: true, fx: 'slash', cd: 9, eff: [{ t: 'dmg', m: 1.4 }] },
  b_quake:  { name: '대지 분쇄', tick: 50, tg: 'self', area: 'r2', side: 'enemy', cast: 2.6, fx: 'quake', cd: 13, eff: [{ t: 'dmg', m: 1.6 }, { t: 'gauge', v: -40 }] },
  b_erupt:  { name: '용암 분출', tick: 50, tg: 'multi', n: 3, area: 'r1', cast: 2.4, fx: 'fire', cd: 11, eff: [{ t: 'dmg', m: 1.2, type: 'magic', stat: 'atk' }] },
  b_fire:   { name: '폭염구', tick: 55, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'fire', cd: 8, eff: [{ t: 'dmg', m: 1.2, type: 'magic' }] },
  b_blink:  { name: '점멸', tick: 30, tg: 'self', fx: 'dark', ai: 'blink', cd: 12, eff: [{ t: 'blink' }] },
  b_tide:   { name: '밀물', tick: 55, tg: 'row', cast: 2.6, fx: 'water', cd: 13, eff: [{ t: 'dmg', m: 1.35, type: 'magic' }, { t: 'knock', n: 1, dir: 'down' }] },
  b_venom:  { name: '맹독 숨결', tick: 50, tg: 'unit', area: 'r1', cast: 2.2, fx: 'poison', cd: 10, eff: [{ t: 'dmg', m: 1.0, type: 'magic', stat: 'atk' }, { t: 'status', s: 'poison', dur: 12, p: 4 }] },
  b_sumSkel:  { name: '망자 소환', tick: 50, tg: 'self', fx: 'dark', ai: 'summon', cap: 4, cd: 15, eff: [{ t: 'summon', type: 'skeleton', n: 2 }] },
  b_sumGhost: { name: '망령 부름', tick: 50, tg: 'self', fx: 'dark', ai: 'summon', cap: 4, cd: 15, eff: [{ t: 'summon', type: 'ghost', n: 2 }] },
  b_sumImp:   { name: '파리 떼', tick: 50, tg: 'self', fx: 'dark', ai: 'summon', cap: 5, cd: 13, eff: [{ t: 'summon', type: 'imp', n: 2 }] },
  b_sumGob:   { name: '졸개 호출', tick: 50, tg: 'self', fx: 'dark', ai: 'summon', cap: 4, cd: 15, eff: [{ t: 'summon', type: 'goblin', n: 2 }] },
  b_scythe: { name: '사신의 낫', tick: 50, tg: 'self', area: 'adj', side: 'enemy', fx: 'slash', cd: 9, eff: [{ t: 'dmg', m: 1.3, drain: 0.5 }] },
  b_spikes: { name: '독침 난사', tick: 50, tg: 'multi', n: 4, area: 'single', cast: 1.8, fx: 'poison', cd: 10, eff: [{ t: 'dmg', m: 1.3 }, { t: 'status', s: 'poison', dur: 8, p: 4 }] },
  b_volley: { name: '화살 장막', tick: 50, tg: 'multi', n: 3, area: 'r1', cast: 2.2, fx: 'arrowRain', cd: 10, eff: [{ t: 'dmg', m: 1.2 }] },
  b_cross:  { name: '지옥의 십자', tick: 55, tg: 'unit', area: 'cross', cast: 2.6, fx: 'dark', cd: 13, eff: [{ t: 'dmg', m: 1.7, type: 'magic' }] },
  b_curse:  { name: '계약의 저주', tick: 45, rng: [1, 4], tg: 'enemy', fx: 'dark', cd: 12, eff: [{ t: 'buff', s: 'atk', p: -25, dur: 15 }, { t: 'status', s: 'poison', dur: 10, p: 3 }] },
  b_plague: { name: '역병', tick: 50, tg: 'self', area: 'all', side: 'enemy', fx: 'poison', ai: 'plague', cd: 18, eff: [{ t: 'status', s: 'poison', dur: 10, p: 3 }] },
  b_cloud:  { name: '부패의 구름', tick: 55, tg: 'unit', area: 'r2', cast: 2.6, fx: 'poison', cd: 13, eff: [{ t: 'dmg', m: 1.2, type: 'magic' }, { t: 'status', s: 'poison', dur: 12, p: 4 }] },
  b_breath: { name: '지옥불', tick: 55, tg: 'dir', len: 4, fx: 'fire', cd: 9, eff: [{ t: 'dmg', m: 1.4, type: 'magic' }] },
  b_judge:  { name: '멸망의 낙인', tick: 60, tg: 'multi', n: 12, area: 'single', cast: 3.0, fx: 'dark', cd: 16, eff: [{ t: 'dmg', m: 1.8, type: 'magic' }] },
  b_meteor: { name: '흑요석 유성', tick: 60, tg: 'unit', area: 'r2', cast: 3.0, fx: 'meteor', cd: 15, eff: [{ t: 'dmg', m: 1.9, type: 'magic' }] },
  b_dark:   { name: '암흑 파동', tick: 55, tg: 'self', area: 'r2', side: 'enemy', cast: 2.4, fx: 'dark', cd: 12, eff: [{ t: 'dmg', m: 1.5, type: 'magic' }] },
  b_charm:  { name: '유혹', tick: 45, rng: [1, 4], tg: 'enemy', fx: 'dark', cd: 12, eff: [{ t: 'gauge', v: -100 }, { t: 'status', s: 'slow', dur: 8 }] },
  b_frost:  { name: '빙결의 숨결', tick: 55, tg: 'unit', area: 'r2', cast: 2.6, fx: 'water', cd: 13, eff: [{ t: 'dmg', m: 1.4, type: 'magic' }, { t: 'status', s: 'slow', dur: 10 }] }
};
// ── r8: 하위 호환 정리 (DS.BAL.skTune, 기본 켬) ── 위 표는 3.2.1 값 그대로 두고, 켜져 있을 때만 아래 값으로 바꿔 쓴다 (엔진이 읽을 때 DS.skTune 을 부른다).
//   조준 사격: 바람길 화살(220%·6칸·둔화, 틱 50)의 아랫것이기만 하던 것 → 틱 45 의 가벼운 견제로 역할을 가른다.
//     (비평의 제안은 40. 재 보니 40 이면 자동 궁수가 평타 대신 이것만 쏴서 판당 3.5 → 10.3번, 바람길 화살은 4.5 → 2.9번으로 줄었다. 45 면 5.3번·4.5번. 수치는 r8/fix/engine.md)
//   짧은 호령(12·15초): 싸움 내내 다시 외치느라 말풍선과 마나만 쓰던 것 → 20·25초. 효과 크기는 그대로.
//     기병의 「돌격!」(12초)은 그대로 둔다 — 외칠 때마다 게이지 +40 을 주는 호령이라, 길게 잡으면 그만큼 덜 외쳐 약해진다.
DS.SK_R8 = {
  aimed: { tick: 45, desc: '최대 5칸. 180% 피해. 틱이 가벼운 견제 사격.' }      // 2.2.6: 호령의 늘린 지속은 기술 표에 바로 적었다 (도발 · 게이지 같은 덧효과의 시간은 따로)
};
DS.skTune = function (on) {
  var R = DS.SK_R8, id, S, T, k, d0;
  for (id in R) {
    S = DS.SKILLS[id]; T = R[id]; if (!S) continue;
    if (!S._r8) { S._r8 = { tick: S.tick, desc: S.desc, dur: null }; for (k = 0; k < S.eff.length; k++) if (S.eff[k].dur != null && S._r8.dur == null) S._r8.dur = S.eff[k].dur; }
    d0 = S._r8.dur;
    S.tick = on && T.tick ? T.tick : S._r8.tick;
    if (T.dur) for (k = 0; k < S.eff.length; k++) if (S.eff[k].dur != null) S.eff[k].dur = on ? T.dur : d0;
    S.desc = !on ? S._r8.desc : T.desc ? T.desc : T.dur ? S._r8.desc.replace('(' + d0 + '초)', '(' + T.dur + '초)') : S._r8.desc;
  }
  if (DS.BAL) DS.BAL.skTune = !!on;
};

// ───────── 용병 ─────────
// 모집(뽑기)으로 얻는다. 능력은 이끄는 지휘관의 레벨을 따라가고, 등급이 배율을 정한다. 쓰러지면 사라진다.
DS.MERCS = {
  m_sword:    { name: '소드맨', kind: 'inf', mt: 'foot', rng: [1, 1], atk: 'melee', dtype: 'phys', hp: 0.8, at: 0.56, df: 0.8, spd: 10, mv: 1, taunt: 1 },
  m_lancer:   { name: '랜서', kind: 'cav', mt: 'horse', rng: [1, 1], atk: 'thrust', dtype: 'phys', hp: 0.75, at: 0.6, df: 0.7, spd: 11, mv: 0.75 },
  m_griffin:  { name: '그리폰', kind: 'fly', mt: 'fly', tags: ['fly'], rng: [1, 1], atk: 'melee', dtype: 'phys', hp: 0.68, at: 0.58, df: 0.65, spd: 12, mv: 0.7 },
  m_merman:   { name: '머맨', kind: 'inf', mt: 'swim', passive: 'marine', rng: [1, 1], atk: 'thrust', dtype: 'phys', hp: 0.78, at: 0.56, df: 0.75, spd: 10, mv: 1 },
  m_pike:     { name: '파이크맨', kind: 'pike', mt: 'foot', rng: [1, 2], atk: 'thrust', dtype: 'phys', hp: 0.75, at: 0.54, df: 0.75, spd: 10, mv: 1 },
  m_archer:   { name: '아처', kind: 'arc', mt: 'foot', rng: [2, 3], atk: 'arrow', dtype: 'phys', hp: 0.6, at: 0.54, df: 0.6, spd: 11, mv: 1, kite: 2 },
  m_sister:   { name: '시스터', kind: 'holy', mt: 'foot', rng: [1, 1], atk: 'melee', dtype: 'phys', hp: 0.68, at: 0.45, df: 0.7, spd: 10, mv: 1, heal: 1.2, useMag: true },      // 2.8: 승려의 용병인데 공격(물리)을 물려받아 치유·공격이 템플러의 2/3 였다 → 마공을 물려받는다
  m_templar:  { name: '템플러', kind: 'holy', mt: 'foot', rng: [1, 1], atk: 'melee', dtype: 'holy', hp: 0.85, at: 0.54, df: 0.82, spd: 10, mv: 1, useMag: true },
  m_spirit:   { name: '돌 정령', kind: 'giant', mt: 'foot', rng: [1, 1], atk: 'melee', dtype: 'phys', hp: 0.95, at: 0.5, df: 1.5, spd: 9, mv: 1.1, useMag: true, taunt: 2 },
  m_skeleton: { name: '해골 병사', kind: 'inf', mt: 'foot', tags: ['undead'], rng: [1, 1], atk: 'melee', dtype: 'phys', hp: 0.7, at: 0.5, df: 0.7, spd: 10, mv: 1, useMag: true },
  // 인구수 2: 한 지휘관의 두 자리를 모두 차지하는 큰 용병. 한 몸이라 덜 쓰러지는 대신, 같은 등급의 보통 용병 둘보다 주는 피해는 적다
  //   (피해 = 공격 − 방어/2 라서 능력이 한 몸에 모이면 값어치가 커진다 — 같은 등급 보통 용병 둘과 승률·판 길이가 비슷하도록 잰 값. 2.6.2 까지는 일반 하나가 희귀 둘보다 나았다)
  m2_ogre:    { name: '오우거', pop: 2, big: true, sprite: 'b_brute', pal: 'ogre', kind: 'giant', mt: 'foot', rng: [1, 1], atk: 'melee', dtype: 'phys', hp: 1.35, at: 0.66, df: 0.75, spd: 8, mv: 1.2, taunt: 2 },
  m2_wyvern:  { name: '와이번', pop: 2, big: true, sprite: 'b_dragon', pal: 'wyv', kind: 'fly', mt: 'fly', tags: ['fly'], rng: [1, 1], atk: 'melee', dtype: 'phys', hp: 0.85, at: 0.85, df: 0.55, spd: 12, mv: 0.7 },
  m2_ballista:{ name: '발리스타', pop: 2, big: true, sprite: 'b_ballista', pal: 'wood', kind: 'arc', mt: 'foot', rng: [2, 5], atk: 'arrow', dtype: 'phys', hp: 0.65, at: 0.85, df: 0.45, spd: 8, mv: 1.5, kite: 3 },
  m2_abbess:  { name: '대수녀', pop: 2, big: true, sprite: 'b_caster', pal: 'abbess', kind: 'holy', mt: 'foot', rng: [1, 2], atk: 'bolt', dtype: 'holy', hp: 0.95, at: 0.4, df: 0.7, spd: 10, mv: 1, heal: 1.5, useMag: true }
};
// 종류별 고유 행동 (엔진이 읽는 칸 — 없으면 지금과 같은 행동. mercSpec 이 유닛에 kite·taunt 로 싣는다)
//   kite: 적이 이 칸 수 안으로 붙으면 쏘기 전에 물러날 자리를 찾는다(최소 거리) · taunt: 이 반경 안의 적을 끌어당긴다(도발. 값이 클수록 넓다)
// 병과 계열마다 잘 맞는 큰 용병
DS.BIG_MATCH = { inf: ['m2_ogre'], cav: ['m2_ogre'], fly: ['m2_wyvern'], mar: ['m2_ballista'], pike: ['m2_ballista'], arc: ['m2_ballista'], cle: ['m2_abbess'], mon: ['m2_abbess'], mag: ['m2_abbess'], sha: ['m2_abbess'],
                 bm: ['m2_ogre', 'm2_wyvern'], tm: ['m2_ballista'], mm: ['m2_abbess'] };
// 용병 한 명 한 명의 이름 (순우리말 결). 보스·지명·시나리오 이름, 이야기에 나오는 동료 열한 사람의 이름(바우·우레·제비·너울·서슬·솔개·달래·등불·슬기·그믐·먼동)과 겹치지 않게 고른다.
// ※ 옛 저장의 용병은 그때 받은 이름을 그대로 지닌다 (도담·가온·누리·새벽·마루·달·별 은 이제 새로 뽑히지 않을 뿐).
DS.MERC_NAMES = ['가람', '나래', '한결', '다솜', '다온', '라온', '바론', '새론', '아라', '이든', '하람', '미르', '보람', '솔', '아름', '은솔', '재하', '초롱', '해솔', '단비',
  '로운', '마리', '산', '여울', '율', '찬', '태양', '푸름', '하늘', '겨레', '노을', '모아', '봄', '온', '이룸', '잔디', '참', '큰별', '한솔', '휘',
  '강', '늘봄', '우리', '가을', '겨울', '여름', '고운', '고요', '그루', '기쁨', '꽃님', '나리', '나봄', '나비', '나무', '난새', '너른', '노루', '눈꽃', '느루',
  '늘솔', '늘찬', '다래', '다슬', '담비', '도란', '도래', '동이', '두나', '두루', '두리', '둥지', '들꽃', '들샘', '라미', '루리', '마음', '마중', '맑음', '머루',
  '모람', '모루', '물결', '미리내', '민들레', '바다', '반디', '방울', '버들', '벼리', '보늬', '보라', '보미', '보슬', '봄비', '부루', '불꽃', '비나', '빛나', '사랑',
  '산들', '새길', '새나', '새솔', '새암', '새얀', '샛별', '세찬', '소담', '소리', '솔잎', '송이', '수리', '수풀', '슬아', '시내', '싸리', '아람', '아롱', '아리',
  '아미', '아침', '알찬', '예솔', '오름', '온새', '올찬', '옹달', '우람', '우솔', '윤슬', '으뜸', '은비', '이랑', '이레', '이슬', '잎새', '자람', '잔별', '조은',
  '종달', '진솔', '차돌', '찬솔', '참솔', '채움', '채운', '초아', '큰솔', '타래', '토리', '파란', '파랑', '풀잎', '하나', '하늬', '하루', '하얀', '한길', '한별',
  '한울', '해나', '해님', '해찬', '햇살'];
// 특성: 등급과 상관없이 하나씩 타고난다
DS.TRAITS = {
  tough:    { name: '강인함', desc: 'HP +15%', hp: 1.15 },
  keen:     { name: '날카로움', desc: '공격 +10%', at: 1.1 },
  guard:    { name: '굳건함', desc: '방어 +15%', def: 1.15 },
  swift:    { name: '날렵함', desc: '행동 회복 +10%', spd: 1.1 },
  ward:     { name: '마법 저항', desc: '마방 +25%', res: 1.25 },
  deadeye:  { name: '급소 찌르기', desc: '치명타 +10%', crit: 0.1 },
  brave:    { name: '투지', desc: 'HP가 절반 아래면 공격 +20%' },
  medic:    { name: '응급 처치', desc: '물러나 있을 때 스스로 HP를 회복한다' },
  survivor: { name: '구사일생', desc: '쓰러질 피해를 전투마다 한 번 버틴다' }
};
// 버릇(둘째 특성): 새로 뽑는 용병 열에 넷쯤이 하나씩 지닌다. 엔진이 이미 읽는 칸만 쓴다 (meta.js 의 mercSpec 이 얹는다) — 옛 용병에게는 없다.
//   hp·at·def·spd: 배율 / crit: 더하기 / rng: 사거리 더하기 / mv: 이동 틱 배율 / basic: 기본 공격 배율 / drain: 흡혈 비율 / heal: 치유 계수 / dtype: 공격 속성 / passive: 엔진 패시브
DS.QUIRKS = {
  leech:    { name: '피맛을 안다', desc: '준 피해의 12%만큼 HP를 회복', drain: 0.12 },
  twin:     { name: '쌍수잡이', desc: '기본 공격을 두 번 나눠 친다 (65% × 2)', passive: 'twin' },
  reach:    { name: '긴 팔', desc: '사거리 +1, 공격 −8%', rng: 1, at: 0.92 },
  holy:     { name: '성수 바른 칼날', desc: '공격이 신성 속성 — 망자, 악마에게 1.5배, 마방으로 막는다', dtype: 'holy' },
  ember:    { name: '불가마 출신', desc: '용암 위에서도 화상을 입지 않는다', passive: 'fireborn' },
  fleet:    { name: '잰걸음', desc: '이동에 드는 틱 −20%', mv: 0.8 },
  nurse:    { name: '틈틈이 간호', desc: '싸우다 말고 곁의 다친 아군을 돌본다', heal: 0.5 },
  heavy:    { name: '묵직한 한 방', desc: '기본 공격 +15%, 행동 회복 −6%', basic: 1.15, spd: 0.94 },
  reckless: { name: '앞뒤 안 가림', desc: '공격 +15%, 방어 −15%', at: 1.15, def: 0.85 },
  careful:  { name: '몸을 사림', desc: '방어 +20%, 공격 −10%', def: 1.2, at: 0.9 },
  gambler:  { name: '한탕주의', desc: '치명타 +15%, 공격 −8%', crit: 0.15, at: 0.92 },
  glutton:  { name: '먹보', desc: 'HP +18%, 행동 회복 −6%', hp: 1.18, spd: 0.94 },
  loud:     { name: '목청 큰', desc: '고함을 질러 곁의 적을 제게로 끈다 (도발), 방어 +5%', taunt: 1, def: 1.05, melee: true }
};
DS.QUIRK_P = 0.4;       // 새로 뽑는 용병이 버릇을 지닐 확률
// 그 종류에게 붙을 수 있는 버릇인가 (이미 패시브·신성·치유를 지닌 종류에는 겹치는 버릇을 주지 않는다)
DS.quirkFits = function (type, q) {
  var M = DS.MERCS[type], Q = DS.QUIRKS[q]; if (!M || !Q) return false;
  if (Q.passive && M.passive) return false;
  if (Q.dtype && M.dtype !== 'phys') return false;
  if (Q.heal && M.heal) return false;
  if (Q.melee && (M.rng[1] > 1 || M.heal || M.taunt)) return false;      // 도발 버릇은 이미 도발하는 종류·활·치유 종류에는 붙지 않는다
  return true;
};
// 공훈: 살아남아 싸울수록 쌓이고, 계급이 오르면 능력이 오른다. 낮은 등급도 오래 살면 귀해진다.
DS.VET = [{ name: '신참', at: 0, mul: 1 }, { name: '숙련', at: 25, mul: 1.06 }, { name: '고참', at: 70, mul: 1.12 }, { name: '정예', at: 150, mul: 1.18 }, { name: '용사', at: 280, mul: 1.25 }, { name: '불멸', at: 450, mul: 1.33 }];
DS.vetRank = function (x) { var r = 0; for (var i = 0; i < DS.VET.length; i++) if ((x || 0) >= DS.VET[i].at) r = i; return r; };
// 성격과 말버릇 (글: 시나리오팀). 성격은 용병 번호에서 정해진다 — 저장 칸 없음. 머리 위에 뜨는 글이라 한 줄 12자 안팎.
//   상황: start 싸움이 붙을 때 · kill 적을 쓰러뜨렸을 때 · low 크게 다쳤을 때 · mourn 동료 용병이 쓰러졌을 때 · rank 공훈 계급이 올랐을 때
//         boss 보스를 잡았을 때 · flee 주인이 쓰러져 흩어질 때 · join 모집되어 처음 왔을 때 · heal 치유를 받았을 때
DS.PERSONAS = [
  { key: 'plain', name: '무던함', desc: '보수만큼 일하고, 일한 만큼만 말한다.', say: {
    start: ['일하러 가자', '밥값은 한다', '늘 하던 대로', '또 시작이군'],
    kill: ['하나', '다음', '밥값 했다', '끝났다, 다음'],
    low: ['좀 맞았군', '아직은 선다', '물러날 때다', '보수에 비해 아프다'],
    mourn: ['…먼저 갔군', '보수는 전해 주마', '빈자리는 내가 선다', '수고했다'],
    rank: ['오래 버텼군', '보수나 올려 주지', '하던 대로 한 거다', '달라질 건 없다'],
    boss: ['큰 놈 끝났다', '보수 더 얹어 주나', '이제 쉬자', '일 하나 마쳤다'],
    flee: ['대장이 쓰러졌다', '일단 흩어진다', '교회에서 보자', '보수는 나중이다'],
    join: ['보수만 맞으면 된다', '잘 부탁한다', '시키는 대로 하지'],
    heal: ['고맙다', '다시 선다', '됐다, 충분해'],
    last: ['…여기까지군', '보수는… 됐다', '할 만큼은… 했다', '…조금 쉬겠다', '나머진… 맡긴다', '하던 대로… 가라', '…생각보다 춥군'] } },
  { key: 'chatty', name: '수다', desc: '입이 쉬지 않는다. 조용해지면 큰일이 난 것이다.', say: {
    start: ['오늘은 몇이나 될까', '어제 꿈이 말이야', '끝나고 한잔하지', '대장, 내 말 들려?'],
    kill: ['봤어? 방금 봤어?', '하나 더 얹었다', '이건 꼭 적어 둬', '저놈 꽤 버티던데'],
    low: ['아야, 이건 좀', '약초! 누구 약초!', '말할 힘은 있어', '농담이 안 나온다'],
    mourn: ['…할 말이 없다', '어제도 웃었는데', '이름은 안 잊는다', '오늘은 조용히 하지'],
    rank: ['들었어? 나 올랐어', '이제 고참 소리 듣나', '한턱은 못 낸다', '신참 때 얘기 해 줄까'],
    boss: ['평생 얘깃거리다', '마지막은 내 칼이지?', '손주한테 들려준다', '봤지? 다들 봤지?'],
    flee: ['대장! 대장이!', '이건 얘기가 달라', '흩어져, 나중에 봐', '다시 부르면 온다'],
    join: ['여기 밥은 어때?', '전 대장은 말이야', '오는 길에 봤는데'],
    heal: ['살 것 같다! 그래서', '아까 하던 얘긴데', '이 은혜는 말로 갚지'],
    last: ['…할 말이 많았는데', '이번엔… 농담 아냐', '내 얘기… 해 줘', '조용하네… 이상하다', '술은… 네가 사', '…끝까지 못 했네'] } },
  { key: 'timid', name: '겁 많음', desc: '무서워하면서도 끝까지 따라온다.', say: {
    start: ['많다, 너무 많아', '뒤는 비워 둬', '숨 좀 고르고…', '살아서 받자, 보수'],
    kill: ['쓰, 쓰러졌다…', '내가 한 거야?', '일어나지 마라', '휴, 하나 줄었다'],
    low: ['피, 피가…', '이제 물러날래', '죽기는 싫다', '대장, 나 여기!'],
    mourn: ['안 돼, 일어나', '거짓말이지…', '눈을 못 떼겠다', '같이 가자 했잖아'],
    rank: ['사, 살아남았다', '운이 좋았을 뿐', '다음에도 살자', '아직 손이 떨려'],
    boss: ['끝… 끝난 거지?', '다리가 풀린다', '다신 안 볼 얼굴', '살았다, 정말로'],
    flee: ['끝났어, 달아나', '대장 없인 못 해', '나, 나 먼저 간다', '돌아올게, 꼭…'],
    join: ['위, 위험한 일은…', '뒷줄이면 좋겠다', '살려서 써 줘'],
    heal: ['살았다…', '조, 조금만 더', '아직 뒤에 있을래'],
    last: ['무서워… 대장', '…이제 안 떨려', '도망 안 쳤지…?', '살고… 싶었는데', '…혼자 두지 마', '끝까지… 따라왔어'] } },
  { key: 'brag', name: '허세', desc: '큰소리를 친 만큼은 싸운다.', say: {
    start: ['나 하나면 된다', '눈 감고도 이긴다', '다 내 몫이다', '잘 봐 둬라'],
    kill: ['시시하군', '다음은 누구냐', '벌써 끝이야?', '이름값은 했나'],
    low: ['긁힌 거다', '이 정도쯤이야', '…조금만 쉰다', '일부러 맞아 줬다'],
    mourn: ['…큰소리가 안 나온다', '네 몫까지 벤다', '웃을 수가 없군', '먼저 가라고는 안 했다'],
    rank: ['당연한 결과다', '이제야 알아보나', '불멸까지 간다', '이름을 새겨 둬라'],
    boss: ['큰 놈도 별것 없군', '내 이름 기억해라', '다음엔 더 큰 놈', '한 수 가르쳤다'],
    flee: ['…물러남도 전술이다', '오늘은 봐준다', '대장 몫은 남겨 둔다', '다시 온다, 두고 봐'],
    join: ['운이 좋군, 대장', '보는 눈이 있군', '보수는 싸게 해 주지'],
    heal: ['안 고쳐도 됐는데', '…받아는 두지', '이제 두 배로 벤다'],
    last: ['…계산에 없던 일이다', '내 이름… 크게 불러', '아직… 안 졌다', '웃지 마… 다 봤다', '…좀 아프군, 이건', '노래로… 남겨 줘'] } },
  { key: 'quiet', name: '과묵', desc: '말 대신 고개를 끄덕인다.', say: {
    start: ['간다', '…', '맡겨'],
    kill: ['하나.', '됐다.', '…다음.'],
    low: ['…깊다.', '아직.', '물러난다.'],
    mourn: ['…잘 가라.', '기억한다.', '갚아 주마.'],
    rank: ['…그런가.', '고맙다.', '계속한다.'],
    boss: ['끝.', '…해냈다.', '쉰다.'],
    flee: ['…물러난다.', '대장.', '기다린다.'],
    join: ['…왔다.', '쓰면 된다.', '칼은 있다.'],
    heal: ['…고맙다.', '된다.', '간다.'],
    last: ['…됐다.', '…간다.', '고마웠다.', '…기억해라.', '뒤는… 부탁한다.', '…조용하군.'] } },
  { key: 'kind', name: '다정', desc: '제 몸보다 옆 사람을 먼저 본다.', say: {
    start: ['다치지들 마', '곁에 있을게', '같이 돌아가자', '옆은 내가 본다'],
    kill: ['미안하게 됐다', '뒤는 괜찮아?', '이쪽은 정리됐어', '고이 가라'],
    low: ['난 됐어, 저쪽 먼저', '걱정 끼쳐 미안', '조금만 쉴게', '아직 지킬 수 있어'],
    mourn: ['편히 쉬어', '내가 기억할게', '춥지 않게 덮어 줘', '집에는 내가 전할게'],
    rank: ['다들 덕분이야', '같이 오른 거지', '오래 함께하자', '대장 덕이야'],
    boss: ['다들 무사해?', '다친 사람부터', '같이 해낸 거야', '잘 버텼어, 모두'],
    flee: ['대장, 버텨요', '꼭 데리러 올게', '교회에서 기다려', '두고 가서 미안'],
    join: ['잘 지내 봅시다', '다들 반가워요', '짐은 내가 들게'],
    heal: ['고마워, 살았어', '다음엔 내가 갚을게', '다른 이도 봐 줘'],
    last: ['다들… 무사해?', '울지 마… 괜찮아', '…다친 사람 먼저', '같이 못 가서… 미안', '내 몫까지… 살아', '…따뜻하다'] } }
];
// r30: 싸움터에서 영영 쓰러지는 순간의 마지막 한마디 (아홉 집은 DS.CAST_LAST). 18자 안쪽, 담담하게. {k} 아이 · {sp} 배우자 · {h} 가문명 — 이름이 길면 이름 없는 줄로
//   성격(PERSONAS[].say.last) 위에 가족이 있으면 가족 줄이 먼저 온다. 대장은 lead, 노년은 elder, 어린 몸은 young.
DS.LAST_WORDS = {
  lead: ['깃발을… 내리지 마라', '…다들, 살아서 가라', '내 자리는… 누가 잇겠지', '다 못 했다… 뒤를 부탁한다', '비밀번호는… 내 생일이다', '열 가문을… 부탁한다'],
  kidN: ['…{k}{을를}… 부탁해', '{k}에게… 미안하다고', '…{k}, 밥은 먹었니'],
  kid: ['…아이를… 부탁해', '우리 애한테… 전해 줘', '…아이가 기다리는데'],
  spN: ['…{sp}에게… 미안하다고', '{sp}… 먼저 가서 미안해', '…{sp}{을를} 혼자 두네'],
  sp: ['…집에 가야 하는데', '기다리는 사람이… 있어', '…약속을 못 지키네'],
  house: ['…{h} 가문을… 지켜', '{h}의 이름을… 이어 줘', '…{h} 깃발을 들어'],
  elder: ['…오래도 살았다', '이만하면… 됐다', '…먼저 간 이들이 부르네'],
  young: ['…무서워', '집에… 가고 싶어', '…엄마']
};
// 전공 별명 (글: 시나리오팀): 이름 앞에 붙는다. 표시만 — 능력은 그대로. 귀한 것부터 적었고, 가진 것 가운데 가장 앞의 것 하나를 쓴다.
//   need 가 있는 것은 용병의 칸에서 저절로 정해진다 (k 처치 · b 함께한 전투 · bk 보스 마지막 일격 · sv 구사일생 뒤 생환 · weed 일반 등급으로 「용사」 이상).
//   need 가 없는 것은 전투 화면(game.js)이 그 일이 일어났을 때 DS.mercAward(m, id) 로 준다 (m.nk 에 남는다).
DS.MERC_TITLES = [
  { id: 'gate', name: '문 닫은', when: '30번 「어스름의 문」을 함께 깸' },
  { id: 'pit10', name: '밑바닥 본', when: '바닥 없는 갱도 10층을 함께 깸' },
  { id: 'k400', name: '만인적', when: '쓰러뜨린 적 400 (만 사람을 맞설 만한 이)', need: { k: 400 } },
  { id: 'lord', name: '성주잡이', when: '여섯 변경 성주(21~26번 보스) 가운데 하나에게 마지막 일격' },
  { id: 'left', name: '남은 사람', when: '곁에서 동료 다섯이 쓰러지는 것을 보고도 살아 있음' },
  { id: 'alone', name: '끝까지 선', when: '같은 편이 모두 쓰러지거나 물러난 뒤에도 남아 승리' },
  { id: 'weed', name: '잡초', when: '일반 등급으로 공훈 「용사」 이상에 오름', need: { weed: 1 } },
  { id: 'k150', name: '일당백', when: '쓰러뜨린 적 150', need: { k: 150 } },
  { id: 'b100', name: '백전노장', when: '함께한 전투 100', need: { b: 100 } },
  { id: 'spree', name: '칼바람', when: '한 전투에서 5명 이상 쓰러뜨림' },
  { id: 'surv', name: '명줄 긴', when: '구사일생이 터진 전투에서 살아 돌아옴', need: { sv: 1 } },
  { id: 'boss1', name: '큰놈잡이', when: '보스에게 마지막 일격', need: { bk: 1 } },
  { id: 'nopay', name: '보수 안 받은', when: '10번 「달못」을 함께 깸 (보수 없는 첫 일)' },
  { id: 'k50', name: '손 매운', when: '쓰러뜨린 적 50', need: { k: 50 } },
  { id: 'b30', name: '한솥밥', when: '함께한 전투 30', need: { b: 30 } }
];
// 출신 (표시만 — 저장 칸 없음. 종류마다 그럴듯한 고장 몇 곳 가운데 용병 번호로 하나가 정해진다). 키는 지역 키(DS.ZONES)거나 그 밖의 곳.
//   글: DS.LORE.origin[키] 가 있으면 그것(시나리오팀), 없으면 아래 기본 한 줄.
DS.ORIGIN = {
  haemil: { name: '해밀', desc: '방앗간 마을에서 나고 자랐다. 보수가 밀린 적이 없다는 게 자랑이다.' },
  dawn:   { name: '새벽 들판', desc: '들판 양치기 집안. 늑대 소리에는 눈을 뜨고 잔다.' },
  windy:  { name: '바람재 평원', desc: '파발꾼 마을 출신. 바람이 어디서 부는지 먼저 안다.' },
  stone:  { name: '돌마루 고원', desc: '고원 채석장에서 돌을 깼다. 손바닥이 돌보다 단단하다.' },
  dodam:  { name: '도담', desc: '짐꾼 거리에서 컸다. 무거운 것을 오래 드는 법을 안다.' },
  coast:  { name: '물비늘 해안', desc: '어부의 자식. 물때를 읽고 짠물에 눈을 뜬다.' },
  isle:   { name: '가온 섬', desc: '섬 나루에서 배를 끌었다. 돌지기에게 인사하며 자랐다.' },
  gaon:   { name: '가온', desc: '무기상 골목에서 컸다. 날의 값을 눈으로 매긴다.' },
  desert: { name: '붉은 모래 사막', desc: '샘을 지키던 집안. 물 한 모금도 남기지 않는다.' },
  mire:   { name: '안개 수렁', desc: '가라앉은 마을의 마지막 아이들 가운데 하나. 이름만은 잊지 않았다.' },
  spire:  { name: '검은 첨탑 기슭', desc: '첨탑 아래 깃대지기 마을에서 왔다. 깃대 다루는 솜씨가 남다르다.' },
  ash:    { name: '잿빛 변경', desc: '성주를 버리고 나온 변경 사람. 빛깔이 남아 있는 쪽을 골랐다.' },
  temple: { name: '산마을 사당', desc: '사당의 불을 지키던 손. 꺼진 불을 다시 붙이는 법을 안다.' },
  tomb:   { name: '왕의 무덤', desc: '무덤에서 깨어난 옛 병사. 자장가를 들으면 걸음을 멈춘다.' },
  forge:  { name: '끓는 고개', desc: '불목 거인의 고개 아래 대장간 마을. 뜨거운 것을 맨손으로 쥔다.' }
};
DS.MERC_FROM = {
  m_sword: ['haemil', 'dodam', 'windy'], m_lancer: ['windy', 'dawn', 'dodam'], m_griffin: ['windy', 'stone'], m_merman: ['coast', 'isle'], m_pike: ['dodam', 'stone', 'spire'],
  m_archer: ['dawn', 'windy', 'desert'], m_sister: ['temple', 'haemil', 'gaon'], m_templar: ['temple', 'mire', 'spire'], m_spirit: ['stone', 'forge'], m_skeleton: ['tomb', 'mire'],
  m2_ogre: ['forge', 'stone', 'ash'], m2_wyvern: ['ash', 'spire'], m2_ballista: ['gaon', 'dodam'], m2_abbess: ['temple', 'gaon', 'mire']
};
DS.SAY_P = { start: 0.3, kill: 0.22, low: 1, mourn: 0.7, rank: 1, boss: 1, flee: 1, join: 1, heal: 0.25 };      // 상황마다 입을 여는 확률 (화면이 조용하도록)
// 이름난 용병: 영웅·전설은 종류에 맞는 고유 기술 하나를 타고난다 (마나 없이 재사용 시간으로 쓴다 — 기술 정의는 아래 DS.SKILLS 의 ms_*)
DS.MERC_SK = {
  m_sword: ['ms_cleave', 'ms_guard', 'ms_cheer'], m_lancer: ['ms_rush', 'ms_cleave', 'ms_cheer'], m_griffin: ['ms_dive', 'ms_cleave'], m_merman: ['ms_tide', 'ms_guard'],
  m_pike: ['ms_brace', 'ms_guard', 'ms_pin'], m_archer: ['ms_snipe', 'ms_volley', 'ms_pin'], m_sister: ['ms_mend', 'ms_smite', 'ms_cheer'], m_templar: ['ms_smite', 'ms_guard', 'ms_mend'],
  m_spirit: ['ms_quake', 'ms_guard'], m_skeleton: ['ms_leech', 'ms_cleave'],
  m2_ogre: ['ms_quake', 'ms_cleave'], m2_wyvern: ['ms_dive', 'ms_cleave'], m2_ballista: ['ms_snipe', 'ms_volley'], m2_abbess: ['ms_mend', 'ms_smite', 'ms_cheer']
};
// ── r32 필살기 (r36 1.3.0 부터 맹주만: 시나리오 3을 깨면 맹주 가문 병과의 셋 가운데 하나를 고른다 — meta.js DS.ultOpts·DS.ultPick. 아래 DS.ultOf 의 「누구나 하나」 규칙은 더 쓰지 않는다) ──
//   마나 0. 쓰려면 필살 게이지(u.uc, 0~100)가 가득해야 한다. 게이지는 싸우는 동안에만 차고(DS.ULT.charge 초), 맞거나 때리면 조금 더 찬다. 쓰면 0 으로.
//   한 사람에 하나, 저장 칸 없이 태생(종류·아홉 집)과 성격, 사람 번호에서 정해진다 (DS.ultOf). 효과 수치는 엔진이 u.ultP 를 곱한다 (전설·영웅·별).
//   cls = 그 기술이 속한 태생 병과, pk = 성격 몫(누구나 쓸 수 있는 꼴). fl = 한 줄 내력.
DS.ULT = { at: 280, charge: 60, hitGain: 0.4, hurtGain: 15, stars: [1000, 1500, 2000], starP: 0.08, starR: 0.12, gradeP: [0, 0, 0, 0, 0.08, 0.15] };
DS.ULTS = {
  // 2.2.6: 병과마다 새 필살기 셋 (자리 차례는 그대로 — 옛 것은 같은 자리의 새 것으로, DS.SK_ALIAS)
  // 보병 (로저스): 앞에 선다
  u_bastion: { cls: 'inf', name: '불락 성벽', tick: 40, tg: 'self', area: 'r2', side: 'ally', fx: 'guard', ic: 'bulwark', eff: [{ t: 'buff', s: 'def', p: 50, dur: 14 }, { t: 'buff', s: 'shd', m: 1.5, stat: 'atk', dur: 14 }, { t: 'taunt', to: 'foe', r: 3, dur: 8 }], fl: '이 뒤로는 한 걸음도 못 간다.', desc: '둘레 2칸 아군의 방어 +50%, 보호막(공격의 150%, 14초). 둘레 3칸 적은 나를 노린다.' },
  u_ram:     { cls: 'inf', name: '성문 부수기', tick: 40, rng: [1, 1], tg: 'enemy', fx: 'shield', ic: 'shieldbash', eff: [{ t: 'dmg', m: 3.2 }, { t: 'gauge', v: -60 }, { t: 'knock', n: 2 }], fl: '문짝째 부수는 한 번의 내려침.', desc: '붙은 적 하나에 320%, 게이지를 크게 깎고 2칸 밀어낸다.' },
  u_riposte: { cls: 'inf', name: '반격의 회오리', tick: 40, tg: 'self', area: 'adj', side: 'enemy', fx: 'wind', ic: 'gust', eff: [{ t: 'dmg', m: 1.9 }, { t: 'knock', n: 1 }, { t: 'buff', s: 'ctr', p: 100, dur: 10, to: 'self' }], fl: '둘러싸였을 때 쓰라고 배운 칼.', desc: '둘레 모든 적에게 190%, 밀어낸다. 10초 동안 붙어 때린 적을 100%로 되친다.' },
  // 기병 (라니스터): 말은 제 주인을 안다
  u_goldrush:{ cls: 'cav', name: '황금 돌격', tick: 40, tg: 'dir', len: 6, dash: true, fx: 'charge', ic: 'charge', eff: [{ t: 'dmg', m: 2.6 }, { t: 'gauge', v: -40 }], fl: '금빛 말굽이 여섯 칸을 꿰뚫는다.', desc: '직선 6칸을 꿰뚫고 달려 나간다. 길 위의 적에게 260%, 게이지를 깎는다.' },
  u_stampede:{ cls: 'cav', name: '말발굽 폭풍', tick: 40, tg: 'self', area: 'r2', side: 'enemy', fx: 'quake', ic: 'hoof', eff: [{ t: 'dmg', m: 1.8 }, { t: 'status', s: 'slow', dur: 8 }, { t: 'buff', s: 'quick', p: 30, dur: 10, to: 'self' }], fl: '말을 세우고 한 바퀴 돈다.', desc: '둘레 2칸 적에게 180%와 둔화. 10초 동안 내 행동 소모 −30%.' },
  u_debt:    { cls: 'cav', name: '빚은 갚는다', tick: 40, rng: [1, 4], tg: 'enemy', leap: true, fx: 'thrust', ic: 'hunt', eff: [{ t: 'dmg', m: 2.7, drain: 0.5, vs: 'low', vx: 1.5 }], fl: '라니스터는 빚을 갚는다. 셈은 정확하다.', desc: '4칸 안의 적에게 달려들어 270%, 체력이 절반 아래면 1.5배. 준 피해의 절반만큼 회복.' },
  // 비병 (스카이워커): 먼저 본다
  u_stoop:   { cls: 'fly', name: '하늘 낙하', tick: 40, rng: [2, 6], tg: 'enemy', leap: true, back: 3, fx: 'dive', ic: 'dive', eff: [{ t: 'dmg', m: 3.0, vs: 'mark', vx: 1.5 }], fl: '구름 위에서 한 점을 고른다.', desc: '2~6칸 밖의 적에게 내리꽂아 300%(표식이 있으면 1.5배), 세 칸 날아오른다.' },
  u_gale:    { cls: 'fly', name: '돌개바람', tick: 40, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'wind', ic: 'gust', eff: [{ t: 'dmg', m: 1.8 }, { t: 'knock', n: 1 }, { t: 'status', s: 'mark', dur: 10, p: 20 }], fl: '날개를 한 번 접었다 편다.', desc: '십자 범위에 180%, 밀어내고 표식을 남긴다.' },
  u_canopy:  { cls: 'fly', name: '날개 그늘', tick: 40, tg: 'self', area: 'r2', side: 'ally', fx: 'buffGold', ic: 'haste', eff: [{ t: 'buff', s: 'quick', p: 40, dur: 15 }, { t: 'gauge', v: 40 }, { t: 'buff', s: 'shd', m: 1.0, stat: 'atk', dur: 12 }], fl: '그늘 아래 선 이는 발이 가볍다.', desc: '둘레 2칸 아군의 행동 소모 −40% (15초), 게이지 +40, 보호막(공격의 100%).' },
  // 해병 (앗쎄이): 물길을 연다
  u_landing: { cls: 'mar', name: '해일 상륙', tick: 40, tg: 'dir', len: 5, dash: true, fx: 'water', ic: 'wave', eff: [{ t: 'dmg', m: 2.2, type: 'magic', stat: 'atk' }, { t: 'status', s: 'wet', dur: 12 }, { t: 'gauge', v: -30 }], fl: '파도와 함께 뭍에 오른다.', desc: '파도를 타고 직선 5칸을 달려 나간다. 물보라 220%, 젖게 하고 게이지를 깎는다.' },
  u_warcry:  { cls: 'mar', name: '기합!', tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffRed', ic: 'horn', eff: [{ t: 'buff', s: 'atk', p: 25, dur: 15 }, { t: 'gauge', v: 40 }, { t: 'cleanse' }], fl: '악! 한 사람의 기합이 부대를 돈다.', desc: '모든 아군의 공격 +25% (15초), 게이지 +40, 상태 이상을 털어 낸다.' },
  u_moor:    { cls: 'mar', name: '닻 끌기', tick: 40, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'hook', ic: 'hook', eff: [{ t: 'dmg', m: 2.0 }, { t: 'pull', n: 1 }, { t: 'status', s: 'slow', dur: 10 }], fl: '쇠닻을 던져 땅을 묶는다.', desc: '십자 범위에 200%, 한 칸 끌어오고 묶는다(둔화).' },
  // 창병 (프레이): 빗장은 안에서 건다
  u_crossbar:{ cls: 'pike', name: '빗장 꿰기', tick: 40, tg: 'dir', len: 4, fx: 'thrust', ic: 'skewer', eff: [{ t: 'dmg', m: 2.5, vs: 'slow', vx: 1.3 }, { t: 'status', s: 'slow', dur: 8 }, { t: 'gauge', v: -30 }], fl: '문을 걸듯 한 줄을 꿴다.', desc: '직선 4칸을 꿰뚫어 250%(둔화된 적에게 1.3배), 둔화와 게이지 깎기.' },
  u_feast:   { cls: 'pike', name: '연회의 끝', tick: 40, tg: 'self', area: 'r2', side: 'enemy', fx: 'thrust', ic: 'pin', eff: [{ t: 'dmg', m: 1.6 }, { t: 'buff', s: 'atk', p: -30, dur: 12 }, { t: 'status', s: 'slow', dur: 8 }], fl: '잔치는 끝났다. 문은 이미 닫혔다.', desc: '둘레 2칸 적에게 160%, 공격 −30% (12초)와 둔화.' },
  u_gatekeep:{ cls: 'pike', name: '문지기', tick: 40, tg: 'self', area: 'r2', side: 'ally', fx: 'brace', ic: 'brace', eff: [{ t: 'buff', s: 'def', p: 40, dur: 15 }, { t: 'buff', s: 'atk', p: 20, dur: 15 }, { t: 'buff', s: 'ctr', p: 60, dur: 15 }], fl: '빗장 앞에 선 사람은 물러서지 않는다.', desc: '둘레 2칸 아군의 방어 +40%, 공격 +20%, 붙어 때린 적을 60%로 되찌른다 (15초).' },
  // 궁병 (퀸): 한 대면 된다
  u_oneshot: { cls: 'arc', name: '한 대면 된다', tick: 40, rng: [2, 7], tg: 'enemy', fx: 'mark', ic: 'mark', eff: [{ t: 'dmg', m: 3.4, vs: 'mark', vx: 1.4 }], fl: '숨을 멈추고, 한 대.', desc: '최대 7칸. 적 하나에 340%, 표식이 있으면 1.4배.' },
  u_deluge:  { cls: 'arc', name: '화살 폭우', tick: 40, rng: [2, 5], tg: 'tile', area: 'r2', fx: 'arrowRain', ic: 'volley', eff: [{ t: 'dmg', m: 1.5 }, { t: 'status', s: 'mark', dur: 10, p: 20 }], fl: '하늘이 잠깐 어두워진다.', desc: '2칸 반경에 화살 150%, 맞은 적 모두에게 표식.' },
  u_three:   { cls: 'arc', name: '세 갈래 화살', tick: 40, tg: 'multi', n: 3, area: 'single', fx: 'arrow', ic: 'retreat', eff: [{ t: 'dmg', m: 1.8 }, { t: 'status', s: 'mark', dur: 8, p: 20 }, { t: 'status', s: 'slow', dur: 6 }], fl: '시위 하나에 화살 셋.', desc: '적 셋에게 180%, 표식과 둔화.' },
  // 승려 (센주): 가리지 않는다 — 2.2.5 무투가 (옛 흰 매듭 기도 · 가리지 않는 손 · 나무 울타리 → 차례대로 아래 셋, DS.SK_ALIAS)
  u_flurry:  { cls: 'cle', name: '백렬권', tick: 40, rng: [1, 1], tg: 'enemy', fx: 'fist', fist: true, eff: [{ t: 'dmg', m: 0.55 }, { t: 'dmg', m: 0.55 }, { t: 'dmg', m: 0.55 }, { t: 'dmg', m: 0.55 }, { t: 'dmg', m: 0.55 }, { t: 'dmg', m: 0.6, drain: 0.3 }, { t: 'gauge', v: -40 }], fl: '셀 수 없으면 막을 수도 없다.', desc: '붙은 적 하나에 여섯 번 몰아쳐 모두 335%, 게이지를 깎는다. 마지막 한 방의 피해 일부만큼 회복.' },
  u_stance:  { cls: 'cle', name: '부동심', tick: 40, tg: 'self', side: 'ally', fx: 'chi', fist: true, eff: [{ t: 'buff', s: 'def', p: 50, dur: 15 }, { t: 'buff', s: 'ctr', p: 90, dur: 15 }, { t: 'aura', r: 2, m: 1.6 }], fl: '산은 비켜서지 않는다.', desc: '15초 동안 자기 방어 +50%, 붙어서 때린 적을 90%로 되친다. 둘레 2칸 아군을 회복.' },
  u_palm:    { cls: 'cle', name: '파산장', tick: 40, tg: 'dir', len: 4, fx: 'palm', fist: true, eff: [{ t: 'dmg', m: 2.3, type: 'magic', stat: 'mix' }, { t: 'knock', n: 1 }, { t: 'aura', r: 2, m: 0.8 }], fl: '손바닥 하나로 산길을 연다.', desc: '직선 4칸에 기공 230%, 1칸 밀어낸다. 둘레 2칸 아군을 조금 회복.' },
  // 신관 (카마도): 불은 꺼뜨리지 않는다
  u_lampdance:{ cls: 'mon', name: '등잔불 춤', tick: 40, tg: 'dir', len: 4, fx: 'fire', ic: 'lamp', eff: [{ t: 'dmg', m: 2.3, type: 'holy' }, { t: 'status', s: 'burn', dur: 8, p: 2 }, { t: 'ward', r: 4, m: 1.5 }], fl: '불씨를 들고 추는 집안의 춤.', desc: '직선 4칸에 신성 230%와 화상 (망자, 악마에게 1.5배). 가장 다친 아군에게 보호막.' },
  u_lantern: { cls: 'mon', name: '감빛 등잔', tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'ward', ic: 'haste', eff: [{ t: 'buff', s: 'quick', p: 35, dur: 18 }, { t: 'buff', s: 'shd', m: 0.9, dur: 15 }], fl: '등잔 하나로 밤길을 다 건넜다.', desc: '모든 아군의 행동 소모 −35% (18초), 보호막(마공의 90%).' },
  u_sunrise: { cls: 'mon', name: '해 뜨는 쪽', tick: 40, tg: 'self', area: 'r2', side: 'enemy', fx: 'holy', ic: 'sun', eff: [{ t: 'dmg', m: 1.9, type: 'holy' }, { t: 'cleanse', to: 'ally', r: 2 }, { t: 'buff', s: 'shd', m: 0.8, dur: 12, to: 'ally', r: 2 }], fl: '어둠은 늘 해 뜨는 쪽에서 물러난다.', desc: '둘레 2칸 적에게 신성 190%. 둘레 2칸 아군의 상태 이상을 풀고 보호막.' },
  // 법사 (그레인저): 모르면 적는다
  u_skyfire: { cls: 'mag', name: '밤하늘 낙하', tick: 40, rng: [2, 5], tg: 'tile', area: 'r2', fx: 'meteor', ic: 'meteor', eff: [{ t: 'dmg', m: 2.0, type: 'magic' }, { t: 'status', s: 'burn', dur: 10, p: 3 }], fl: '책 끝에 적어 둔 별 하나.', desc: '2칸 반경에 운석 200%, 긴 화상.' },
  u_spellbook:{ cls: 'mag', name: '적어 둔 주문', tick: 40, rng: [1, 5], tg: 'enemy', fx: 'thunder', ic: 'bolt', eff: [{ t: 'dmg', m: 2.8, type: 'magic', stat: 'mix', vs: 'wet|slow', vx: 1.4 }, { t: 'chain', n: 3, r: 2, m: 0.6, type: 'magic', stat: 'mix', vs: 'wet|slow', vx: 1.4 }], fl: '밤새 외운 주문을 한 번에.', desc: '적 하나에 뇌격 280%, 곁의 셋에게 옮겨 간다(60%). 얼거나 젖은 적에게 1.4배.' },
  u_icejail: { cls: 'mag', name: '서리 감옥', tick: 40, rng: [1, 4], tg: 'tile', area: 'r2', fx: 'frost', ic: 'frost', eff: [{ t: 'dmg', m: 1.3, type: 'magic', vs: 'burn', vx: 1.4 }, { t: 'status', s: 'slow', dur: 12 }, { t: 'gauge', v: -40 }], fl: '숨까지 얼리는 겨울 한 장.', desc: '2칸 반경에 140%(화상 입은 적에게 1.4배), 긴 둔화, 게이지를 깎는다.' },
  // 사교 (아담스): 죽은 이도 편이 있다
  u_newmoon: { cls: 'sha', name: '그믐 군단', tick: 40, tg: 'self', fx: 'dark', ic: 'skull', ai: 'summon', cap: 3, eff: [{ t: 'summon', type: 'm_skeleton', n: 3, dur: 30, k: 0.9, ka: 1.25, kh: 1.3, kd: 1.5 }], fl: '그믐밤에는 집안 어른들이 일어난다.', desc: '30초 동안 싸울 해골 병사 셋을 부른다.' },
  u_violet:  { cls: 'sha', name: '자줏빛 장막', tick: 40, rng: [1, 4], tg: 'tile', area: 'r2', fx: 'poison', ic: 'plague', eff: [{ t: 'dmg', m: 1.2, type: 'magic' }, { t: 'status', s: 'poison', dur: 12, p: 5 }, { t: 'buff', s: 'def', p: -20, dur: 12 }], fl: '장막 안에서는 숨이 무겁다.', desc: '2칸 반경에 피해와 강한 중독, 방어 −20% (12초).' },
  u_supper:  { cls: 'sha', name: '망자의 저녁', tick: 40, tg: 'self', area: 'r2', side: 'enemy', fx: 'dark', ic: 'drain', eff: [{ t: 'dmg', m: 1.6, type: 'magic', share: 0.6 }], fl: '식탁에 빈자리는 없다.', desc: '둘레 2칸 적에게 흑마법 160%. 준 피해의 60%로 가장 다친 아군들을 고친다.' },
  // 성격 몫 (누구의 몸에도 맞는 꼴)
  u_steady:  { pk: 'plain', name: '늘 하던 대로', tick: 40, tg: 'self', side: 'ally', fx: 'buffRed', eff: [{ t: 'buff', s: 'atk', p: 40, dur: 15 }, { t: 'buff', s: 'def', p: 30, dur: 15 }, { t: 'gauge', v: 50 }], fl: '특별한 건 없다. 그게 비결이다.', desc: '자기 공격 +40%, 방어 +30% (15초), 게이지 +50.' },
  u_rally:   { pk: 'chatty', name: '끝나고 한잔', tick: 40, tg: 'self', area: 'r2', side: 'ally', fx: 'buffRed', eff: [{ t: 'buff', s: 'atk', p: 30, dur: 15 }, { t: 'gauge', v: 30 }], fl: '술값은 이긴 쪽이 낸다.', desc: '둘레 2칸 아군의 공격 +30% (15초), 게이지 +30.' },
  u_live:    { pk: 'timid', name: '살고 싶다', tick: 40, tg: 'self', side: 'ally', fx: 'heal', eff: [{ t: 'heal', m: 2.6 }, { t: 'buff', s: 'def', p: 60, dur: 10 }], fl: '무서워서 끝까지 살아남았다.', desc: '자기 체력을 크게 회복, 방어 +60% (10초).' },
  u_show:    { pk: 'brag', name: '잘 봐 둬라', tick: 40, tg: 'self', area: 'adj', side: 'enemy', fx: 'slash', eff: [{ t: 'dmg', m: 2.4 }], fl: '큰소리친 만큼은 보여 준다.', desc: '둘레 모든 적에게 240%.' },
  u_silent:  { pk: 'quiet', name: '말없이 한 번', tick: 40, rng: [1, 2], tg: 'enemy', fx: 'slash', eff: [{ t: 'dmg', m: 3.2 }], fl: '…', desc: '적 하나에 320%.' },
  u_cover:   { pk: 'kind', name: '곁을 지킨다', tick: 40, tg: 'self', area: 'r2', side: 'ally', fx: 'heal', eff: [{ t: 'heal', m: 1.4 }, { t: 'buff', s: 'def', p: 30, dur: 12 }], fl: '옆 사람이 먼저다.', desc: '둘레 2칸 아군을 회복, 방어 +30% (12초).' }
};
(function () { for (var k in DS.ULTS) { var U = DS.ULTS[k]; U.mp = 0; U.ult = true; DS.SKILLS[k] = U; } })();
// 2.2.5: 없어진 기술 이름 → 새 이름. 옛 저장의 타고난 필살기(ps.ul) · 연무장 기록(ul · sk)을 읽을 때 옮긴다 (save.js DS.fixSave · arena.js). 승려의 치유 · 정화 · 모두 치유는 기술 표에 그대로 있다 (매직마스터 · 장비가 쓴다)
DS.SK_ALIAS = { u_prayer: 'u_flurry', u_mercy: 'u_stance', u_grove: 'u_palm',
  // 2.2.6: 병과마다 새 필살기 — 같은 자리의 새 것으로 (타고난 굴림의 차례가 그대로라 같은 사람은 같은 자리를 지닌다)
  u_wall: 'u_bastion', u_breach: 'u_ram', u_cyclone: 'u_riposte', u_lance: 'u_goldrush', u_trample: 'u_stampede', u_skyfall: 'u_stoop', u_wings: 'u_canopy',
  u_gihap: 'u_warcry', u_anchor: 'u_moor', u_bolt: 'u_crossbar', u_keeper: 'u_gatekeep', u_onearrow: 'u_oneshot', u_downpour: 'u_deluge',
  u_ember: 'u_lantern', u_dawn: 'u_sunrise', u_starfall: 'u_skyfire', u_notes: 'u_spellbook', u_frost: 'u_icejail', u_legion: 'u_newmoon', u_veil: 'u_violet' };
// 2.2.6: 병과의 옛 보통 기술 → 새 기술 (병과마다 — 같은 옛 기술이 병과에 따라 다른 새 기술이 된다). 옛 기술은 기술 표에 그대로 있다 (장비의 기술 · 옮기기 전의 줄)
//   쓰는 곳: 돌아온 이의 옛 깃발 기술(m.s · save.js) · 연무장 기록(sk · arena.js). 병과를 모르면 SK_OLD._ (가장 먼저 그 기술을 지녔던 병과의 것)
DS.SK_OLD = {
  inf: { bash: 'inf_bash', attackUp: 'inf_wall', protect: 'inf_cover' },
  cav: { thunder: 'cav_charge', protect: 'cav_trample', attackUp: 'cav_hunt' },
  fly: { dive: 'fly_dive', whirl: 'fly_gale' },
  mar: { harpoon: 'mar_hook', tidal: 'mar_surge' },
  pike: { slow: 'pike_pin', pierce: 'pike_skewer', protect: 'pike_brace' },
  arc: { aimed: 'arc_mark', arrowRain: 'arc_retreat' },
  cle: { heal: 'cle_combo', cure: 'cle_kick', healAll: 'cle_palm' },
  mon: { holy: 'mon_smite', protect: 'mon_ward', quick: 'mon_haste', bless: 'mon_sanct' },
  mag: { fire: 'mag_ember', ice: 'mag_frost', blizzard: 'mag_bolt', meteor: 'mag_meteor' },
  sha: { drain: 'sha_drain', summon: 'sha_raise', curse: 'sha_hex', deathCloud: 'sha_plague' },
  bm: { bash: 'inf_bash', thunder: 'cav_charge', attackUp: 'inf_wall', protect: 'inf_cover', whirl: 'fly_gale', bm_charge: 'bm_drive', bm_storm: 'bm_tempest' },
  tm: { aimed: 'arc_mark', slow: 'pike_pin', tidal: 'mar_surge', arrowRain: 'arc_retreat', tm_gale: 'tm_hunt', tm_rain: 'tm_squall' },
  mm: { heal: 'mon_ward', quick: 'mon_haste', fire: 'mag_ember', blizzard: 'mag_bolt', healAll: 'cle_palm', summon: 'sha_raise', meteor: 'mag_meteor', mm_grace: 'mm_star', mm_dawn: 'mm_sun' }
};
(function () {      // 병과를 모를 때: 그 옛 기술을 가장 먼저(병과 표 차례로) 지녔던 병과의 새 기술
  var A = DS.SK_OLD._ = {}; for (var c in DS.SK_OLD) { if (c === '_') continue; var M = DS.SK_OLD[c]; for (var k in M) if (!Object.prototype.hasOwnProperty.call(A, k)) A[k] = M[k]; }
  // 합일한 이(8단 위)의 9 · 10단 고유 기술은 병과가 아니라 묶음을 따른다 — 아홉 병과 표에도 그 묶음의 것을 넣는다
  ['inf', 'cav', 'fly'].forEach(function (c) { DS.SK_OLD[c].bm_charge = 'bm_drive'; DS.SK_OLD[c].bm_storm = 'bm_tempest'; });
  ['mar', 'pike', 'arc'].forEach(function (c) { DS.SK_OLD[c].tm_gale = 'tm_hunt'; DS.SK_OLD[c].tm_rain = 'tm_squall'; });
  ['cle', 'mon', 'mag', 'sha'].forEach(function (c) { DS.SK_OLD[c].mm_grace = 'mm_star'; DS.SK_OLD[c].mm_dawn = 'mm_sun'; });
})();
DS.skOld = function (id, cls) {      // 옛 기술 id → 새 id (필살기는 DS.skAlias). 모르는 것 · 새것은 그대로
  if (typeof id !== 'string') return id;
  var own = Object.prototype.hasOwnProperty, M = cls && own.call(DS.SK_OLD, cls) ? DS.SK_OLD[cls] : null;
  if (M && own.call(M, id)) return M[id];
  if (own.call(DS.SK_OLD._, id)) return DS.SK_OLD._[id];
  return DS.skAlias(id);
};
DS.skAlias = function (id) { return typeof id === 'string' && Object.prototype.hasOwnProperty.call(DS.SK_ALIAS, id) ? DS.SK_ALIAS[id] : id; };
// 등급: 이름, 능력 배율, 모집 확률(%), 색
DS.GRADES = [null,
  { name: '일반', mul: 0.85, p: 10, col: '#a7a1c2' },      // r35: 모집은 귀하게, 대신 가운데를 넓게 (10 · 30 · 30 · 20 · 10)
  { name: '고급', mul: 1.0, p: 30, col: '#7fcf6a' },
  { name: '희귀', mul: 1.15, p: 30, col: '#5fc4d6' },
  { name: '영웅', mul: 1.32, p: 20, col: '#b181e6' },
  { name: '전설', mul: 1.52, p: 10, col: '#f0b64a' }];      // r44: 1.5 → 1.52 (전설 가솔은 종류가 달라도 희귀 평균 밑으로 내려가지 않는다 · 전설/일반 1.79배). 가주·맹주의 등급 배율은 banner.js DS.BN.gmul
// 2.2.0: 통솔(지휘관이 이끄는 가솔에게 주던 버프·패널티 표 DS.LEAD)은 없어졌다 — 가솔이 없다. 호령 기술은 모든 아군에게 절반 세기로 걸린다
// 병과의 호령(지휘 기술) id
DS.ORDER = { inf: 'cmd_inf', cav: 'cmd_cav', fly: 'cmd_fly', mar: 'cmd_mar', pike: 'cmd_pike', arc: 'charisma', cle: 'cmd_cle', mon: 'cmd_mon', mag: 'cmd_mag', sha: 'cmd_sha', bm: 'cmd_bm', tm: 'charisma', mm: 'cmd_mm' };
// 지휘관의 깃발 색
DS.FLAG = { inf: '#5b8fd6', cav: '#e8bb45', fly: '#62b0ee', mar: '#2f86a6', pike: '#4c9a8a', arc: '#5fae5a', cle: '#f4efe2', mon: '#f09a4a', mag: '#8d6be0', sha: '#9a6ad0', bm: '#e0525e', tm: '#3fa88a', mm: '#f6cf57' };
DS.MERC_SLOTS = 2;      // (2.2.0: 가솔이 없어졌다 — 옛 저장을 옮길 때만 읽는다)
DS.MERC_MAX = 50;       // 2.2.0: 막사 정원 (넉넉히 — 모집값이 오르는 것이 진짜 한계다)
DS.PITY = 20;           // r35: 이 횟수 안에 전설이 한 번은 나온다 (예전: 40회 안에 영웅 이상)
DS.PITY_G = 5;
DS.PULL5_G = 3;         // r35: 5회 모집은 희귀 이상 한 명 (예전: 고급 이상)
DS.mercCost = function (tier) { return [300, 300, 450, 650, 900, 1200, 1600, 2000, 2500, 3000, 3600][Math.max(1, Math.min(10, tier))]; };      // 기본값 (열기가 0일 때)
// r35 모집 값: 부를 때마다 열기가 1 오르고 값은 기본값의 +step 만큼 오른다. 열기는 계절마다 ease 씩 식는다 (save.rh = { h 열기, t 마지막으로 잰 달력 초 })
DS.RECRUIT = { step: 0.5, ease: 0.5, max: 40, k: 8, emp: 4 };      // 2.2.0: k = 영웅 모집 값 배율 (기본값 × 8) · 2.2.9: emp = 빈 가문 배율 (값 × emp ÷ 열 수 있는 닫힌 가문 수 — meta.js DS.recruitEmp)
DS.TICKET_EVERY = 10;  // 2.2.0: 영웅 모집권은 열 번째 시나리오마다 한 장 (r35: 다섯 번째마다)

// ───────── 몬스터 ─────────
// 능력치는 레벨지수 L 기준 (base + grow*(L-1))
DS.ENEMIES = {
  slime:     { name: '슬라임', kind: 'beast', mt: 'foot', sprite: 'slime',
               base: { hp: 26, atk: 9, def: 2, mag: 0, res: 2 }, grow: { hp: 3.2, atk: 1.0, def: 0.5, mag: 0, res: 0.4 }, spd: 8, mv: 1.2, rng: [1, 1], atk: 'melee', info: '말랑한 초보 사냥감.' },
  goblin:    { name: '고블린', kind: 'inf', mt: 'foot', sprite: 'goblin',
               base: { hp: 30, atk: 11, def: 3, mag: 0, res: 2 }, grow: { hp: 3.4, atk: 1.1, def: 0.6, mag: 0, res: 0.4 }, spd: 10, mv: 1, rng: [1, 1], atk: 'melee', info: '떼로 몰려다니는 약탈자.' },
  gobArcher: { name: '고블린 궁수', kind: 'arc', mt: 'foot', sprite: 'gobArcher',
               base: { hp: 24, atk: 10, def: 2, mag: 0, res: 2 }, grow: { hp: 2.8, atk: 1.05, def: 0.45, mag: 0, res: 0.4 }, spd: 10, mv: 1, rng: [2, 3], atk: 'arrow', info: '멀리서 쏜다.' },
  wolf:      { name: '늑대', kind: 'beast', mt: 'foot', sprite: 'wolf',
               base: { hp: 26, atk: 11, def: 2, mag: 0, res: 2 }, grow: { hp: 3.0, atk: 1.1, def: 0.45, mag: 0, res: 0.4 }, spd: 13, mv: 0.8, rng: [1, 1], atk: 'melee', info: '빠르다.' },
  orc:       { name: '오크', kind: 'inf', mt: 'foot', sprite: 'orc', skills: ['e_smash'],
               base: { hp: 48, atk: 13, def: 6, mag: 0, res: 2 }, grow: { hp: 4.8, atk: 1.2, def: 0.9, mag: 0, res: 0.4 }, spd: 8, mv: 1.2, rng: [1, 1], atk: 'melee', info: '느리지만 단단하다. 마법에 약하다.' },
  skeleton:  { name: '스켈레톤', kind: 'inf', mt: 'foot', sprite: 'skeleton', tags: ['undead'],
               base: { hp: 34, atk: 12, def: 5, mag: 0, res: 2 }, grow: { hp: 3.6, atk: 1.15, def: 0.85, mag: 0, res: 0.35 }, spd: 10, mv: 1, rng: [1, 1], atk: 'melee', info: '망자. 신성 공격에 약하다.' },
  skelArcher:{ name: '해골 궁수', kind: 'arc', mt: 'foot', sprite: 'skelArcher', tags: ['undead'],
               base: { hp: 26, atk: 12, def: 3, mag: 0, res: 2 }, grow: { hp: 3.0, atk: 1.15, def: 0.55, mag: 0, res: 0.35 }, spd: 10, mv: 1, rng: [2, 4], atk: 'arrow', info: '망자 궁수.' },
  darkMage:  { name: '다크 메이지', kind: 'mage', mt: 'foot', sprite: 'darkMage', skills: ['e_fire'],
               base: { hp: 26, atk: 4, def: 2, mag: 14, res: 7 }, grow: { hp: 2.9, atk: 0.3, def: 0.4, mag: 1.3, res: 0.9 }, spd: 10, mv: 1, rng: [1, 3], atk: 'bolt', dtype: 'magic', info: '범위 화염을 쓴다. 뭉치지 말 것.' },
  harpy:     { name: '하피', kind: 'fly', mt: 'fly', sprite: 'harpy', tags: ['fly'],
               base: { hp: 28, atk: 11, def: 3, mag: 0, res: 4 }, grow: { hp: 3.1, atk: 1.1, def: 0.55, mag: 0, res: 0.55 }, spd: 13, mv: 0.7, rng: [1, 1], atk: 'melee', info: '날아서 덮친다. 화살에 약하다.' },
  lizard:    { name: '리자드맨', kind: 'pike', mt: 'swim', sprite: 'lizard', passive: 'marine',
               base: { hp: 40, atk: 12, def: 5, mag: 0, res: 4 }, grow: { hp: 4.2, atk: 1.15, def: 0.85, mag: 0, res: 0.55 }, spd: 11, mv: 1, rng: [1, 1], atk: 'thrust', info: '물속에서 강해진다.' },
  golem:     { name: '골렘', kind: 'giant', mt: 'foot', sprite: 'golem', skills: ['e_smash'],
               base: { hp: 72, atk: 14, def: 11, mag: 0, res: 2 }, grow: { hp: 6.6, atk: 1.25, def: 1.5, mag: 0, res: 0.3 }, spd: 7, mv: 1.4, rng: [1, 1], atk: 'melee', info: '바위 몸. 마법으로 부숴라.' },
  imp:       { name: '임프', kind: 'fly', mt: 'fly', sprite: 'imp', tags: ['fly', 'demon'],
               base: { hp: 22, atk: 3, def: 2, mag: 12, res: 6 }, grow: { hp: 2.6, atk: 0.2, def: 0.4, mag: 1.2, res: 0.75 }, spd: 13, mv: 0.8, rng: [1, 2], atk: 'bolt', dtype: 'magic', info: '날아다니며 마력탄을 쏘는 작은 악마.' },
  ghost:     { name: '망령', kind: 'spirit', mt: 'fly', sprite: 'ghost', tags: ['undead', 'ethereal'], skills: ['e_drain'],
               base: { hp: 28, atk: 3, def: 2, mag: 12, res: 8 }, grow: { hp: 3.2, atk: 0.2, def: 0.4, mag: 1.15, res: 0.9 }, spd: 11, mv: 0.9, rng: [1, 1], atk: 'bolt', dtype: 'magic', info: '물리 공격은 절반만 통한다.' },
  darkKnight:{ name: '암흑기사', kind: 'cav', mt: 'horse', sprite: 'darkKnight',
               base: { hp: 50, atk: 15, def: 8, mag: 0, res: 4 }, grow: { hp: 4.8, atk: 1.35, def: 1.05, mag: 0, res: 0.55 }, spd: 11, mv: 0.75, rng: [1, 2], atk: 'thrust', info: '기병. 창병으로 막아라.' },
  darkPriest:{ name: '암흑사제', kind: 'holy', mt: 'foot', sprite: 'darkPriest', skills: ['e_heal'],
               base: { hp: 28, atk: 3, def: 3, mag: 12, res: 8 }, grow: { hp: 3.0, atk: 0.2, def: 0.45, mag: 1.15, res: 1.0 }, spd: 11, mv: 1, rng: [1, 2], atk: 'bolt', dtype: 'magic', info: '적을 치료한다. 먼저 쓰러뜨려라.' },
  demon:     { name: '데몬', kind: 'inf', mt: 'foot', sprite: 'demon', tags: ['demon'], skills: ['e_smash'],
               base: { hp: 54, atk: 16, def: 7, mag: 8, res: 8 }, grow: { hp: 5.1, atk: 1.4, def: 1.0, mag: 0.7, res: 0.9 }, spd: 11, mv: 1, rng: [1, 1], atk: 'melee', info: '지옥의 병사.' },
  gargoyle:  { name: '가고일', kind: 'fly', mt: 'fly', sprite: 'gargoyle', tags: ['fly', 'demon'],
               base: { hp: 42, atk: 13, def: 9, mag: 0, res: 5 }, grow: { hp: 4.2, atk: 1.2, def: 1.15, mag: 0, res: 0.6 }, spd: 10, mv: 0.85, rng: [1, 1], atk: 'melee', info: '단단한 석상 악마.' },
  salamander:{ name: '샐러맨더', kind: 'beast', mt: 'foot', sprite: 'salamander', tags: ['fire'], passive: 'fireborn',
               base: { hp: 36, atk: 13, def: 4, mag: 6, res: 6 }, grow: { hp: 3.8, atk: 1.2, def: 0.7, mag: 0.5, res: 0.7 }, spd: 11, mv: 1, rng: [1, 1], atk: 'melee', info: '용암 위를 걸어 다닌다.' },
  soldier:   { name: '제국 병사', kind: 'inf', mt: 'foot', sprite: 'soldier',
               base: { hp: 46, atk: 13, def: 8, mag: 0, res: 4 }, grow: { hp: 4.7, atk: 1.2, def: 1.05, mag: 0, res: 0.55 }, spd: 10, mv: 1, rng: [1, 1], atk: 'melee', info: '어스름에 넘어간 병사.' },
  archer:    { name: '제국 궁병', kind: 'arc', mt: 'foot', sprite: 'archer',
               base: { hp: 32, atk: 13, def: 4, mag: 0, res: 4 }, grow: { hp: 3.3, atk: 1.2, def: 0.6, mag: 0, res: 0.55 }, spd: 11, mv: 1, rng: [2, 4], atk: 'arrow', info: '궁병. 비병은 조심.' },
  mummy:     { name: '머미', kind: 'inf', mt: 'foot', sprite: 'mummy', tags: ['undead'], skills: ['e_poison'],
               base: { hp: 44, atk: 13, def: 6, mag: 0, res: 3 }, grow: { hp: 4.5, atk: 1.2, def: 0.9, mag: 0, res: 0.4 }, spd: 9, mv: 1.1, rng: [1, 1], atk: 'melee', info: '사막의 망자. 독을 옮긴다.' },
  scorpion:  { name: '스콜피온', kind: 'beast', mt: 'foot', sprite: 'scorpion', skills: ['e_poison'],
               base: { hp: 34, atk: 13, def: 7, mag: 0, res: 3 }, grow: { hp: 3.6, atk: 1.2, def: 1.0, mag: 0, res: 0.4 }, spd: 11, mv: 0.9, rng: [1, 1], atk: 'melee', info: '단단한 껍질과 독침.' },
  iceGolem:  { name: '아이스 골렘', kind: 'giant', mt: 'foot', sprite: 'iceGolem', skills: ['e_smash'],
               base: { hp: 70, atk: 14, def: 10, mag: 0, res: 6 }, grow: { hp: 6.4, atk: 1.25, def: 1.4, mag: 0, res: 0.6 }, spd: 7, mv: 1.4, rng: [1, 1], atk: 'melee', info: '얼음 몸. 불에 약하다.' }
};

// ───────── 보스 ─────────
DS.BOSSES = {
  grok:     { name: '혹부리 그록', title: '방앗간을 차지한 두목', like: 'orc', sprite: 'b_brute', pal: 'orc', mul: { hp: 2.6, atk: 1.15, def: 1.1, res: 1.5 }, skills: ['e_smash'], guard: 4 },
  shewolf:  { name: '잿빛 어미늑대', title: '늑대골의 우두머리', like: 'wolf', sprite: 'b_beast', pal: 'wolf', mul: { hp: 3.4, atk: 1.2, def: 1.6, res: 1.6, spd: 0.85 }, skills: ['b_howl', 'b_pounce'], guard: 4 },
  bargan:   { name: '불목 거인 바르간', title: '끓는 고개의 주인', like: 'salamander', sprite: 'b_brute', pal: 'lava', tags: ['fire'], passive: 'fireborn', mul: { hp: 4.0, atk: 1.2, def: 1.7, res: 1.4, spd: 0.8 }, skills: ['b_erupt', 'e_smash'], guard: 4 },
  heron:    { name: '말몰이꾼 헤론', title: '통행세 다리의 무법자', like: 'darkKnight', sprite: 'b_beast', pal: 'manti', mul: { hp: 3.0, atk: 1.15, def: 1.2, res: 1.5 }, skills: ['b_charge', 'b_pounce'], guard: 5 },
  tormak:   { name: '뿔거인 토르막', title: '울림 바위의 괴수', like: 'orc', sprite: 'b_brute', pal: 'mino', mul: { hp: 3.4, atk: 1.25, def: 1.2, res: 1.6, spd: 1.1 }, skills: ['b_quake', 'e_smash'], guard: 4 },
  pippin:   { name: '요술쟁이 피핀', title: '산마을을 빼앗은 자', like: 'darkMage', sprite: 'b_caster', pal: 'trick', mul: { hp: 4.6, def: 1.9, res: 1.3, mag: 1.15 }, skills: ['b_fire', 'b_blink', 'b_sumGob'], guard: 5 },
  twinsnake:{ name: '쌍두 구렁이', title: '이끼 낀 사당의 터줏대감', like: 'lizard', sprite: 'b_serpent', pal: 'venom', passive: 'twin', mul: { hp: 4.0, atk: 0.95, def: 1.3, res: 1.4 }, skills: ['b_venom'], guard: 3 },      // 2.8: 호위 5→3 — 2단 끝(L19~20)으로 오는 부대가 벽에 막히지 않게 (L20 승률 30%→60%, L23 은 그대로)
  volko:    { name: '선장 볼코', title: '해적 부두의 주인', like: 'lizard', sprite: 'b_brute', pal: 'pirate', mt: 'swim', passive: 'marine', mul: { hp: 3.6, atk: 1.2, def: 1.25, res: 1.5 }, skills: ['e_smash', 'b_tide'], guard: 5 },
  warden:   { name: '돌지기', title: '석상 나루의 파수꾼', like: 'golem', sprite: 'b_brute', pal: 'stone', mul: { hp: 3.0, atk: 1.15, def: 1.15, res: 3.0, spd: 1.2 }, skills: ['b_boulder', 'b_harden', 'e_smash'], guard: 4 },
  nuri:     { name: '물의 정령 누리', title: '달못에 깃든 정령', like: 'lizard', sprite: 'b_caster', pal: 'aqua', mt: 'swim', passive: 'marine', dtype: 'magic', rng: [1, 3], atk: 'bolt', mul: { hp: 3.6, def: 1.2, res: 1.8, mag: 1.1 }, skills: ['b_tide', 'e_drain'], guard: 5 },
  shara:    { name: '여왕 전갈 샤라', title: '마른 샘의 여왕', like: 'scorpion', sprite: 'b_beast', pal: 'manti', mul: { hp: 4.2, atk: 1.2, def: 1.5, res: 2.4, spd: 0.9 }, skills: ['b_spikes', 'b_pounce'], guard: 5 },
  tombbeast:{ name: '무덤지기 석수', title: '왕의 무덤을 지키는 돌짐승', like: 'wolf', sprite: 'b_beast', pal: 'stone', mul: { hp: 4.6, atk: 1.3, def: 2.4, res: 2.2, spd: 0.8 }, skills: ['b_quake', 'b_pounce'], guard: 5 },
  king:     { name: '잠 못 드는 왕', title: '무덤 속의 옛 왕', like: 'mummy', sprite: 'b_caster', pal: 'pharaoh', tags: ['undead'], mul: { hp: 4.2, atk: 1.2, def: 1.5, res: 2.4 }, dtype: 'magic', rng: [1, 3], atk: 'bolt', skills: ['b_sumSkel', 'b_curse', 'b_dark'], guard: 5 },
  mire:     { name: '수렁의 그림자', title: '가라앉은 마을의 원혼', like: 'ghost', sprite: 'b_brute', pal: 'specter', tags: ['undead'], mul: { hp: 5.0, def: 3.4, res: 1.3, mag: 1.2 }, skills: ['b_scythe', 'e_drain', 'b_sumGhost'], guard: 5 },
  orbel:    { name: '점성술사 오르벨', title: '별 보는 탑의 주인', like: 'darkMage', sprite: 'b_caster', pal: 'illusion', mul: { hp: 5.0, def: 2.2, res: 1.4, mag: 1.2 }, skills: ['b_meteor', 'b_fire', 'b_blink'], guard: 5 },
  hagen:    { name: '사냥꾼 대장 하겐', title: '까마귀 벌판의 군세', like: 'demon', sprite: 'b_demon', pal: 'hunter', tags: ['demon'], rng: [1, 4], atk: 'arrow', mul: { hp: 3.6, atk: 1.05, def: 1.2, res: 1.3 }, skills: ['b_volley', 'e_smash'], guard: 6 },
  gatekeeper:{ name: '첨탑 문지기', title: '검은 첨탑의 문', like: 'golem', sprite: 'b_brute', pal: 'obsidian', mul: { hp: 3.2, atk: 1.2, def: 1.15, res: 3.0, spd: 1.2 }, skills: ['b_quake', 'b_sumImp', 'e_smash'], guard: 5 },
  basil:    { name: '독니 바실', title: '첨탑 아래층의 뱀', like: 'lizard', sprite: 'b_serpent', pal: 'cobra', passive: 'twin', mul: { hp: 4.4, atk: 1.0, def: 1.4, res: 1.6 }, skills: ['b_venom', 'b_spikes'], guard: 5 },
  belmar:   { name: '첨탑의 주인 벨마르', title: '어스름과 계약한 자', like: 'darkMage', sprite: 'b_caster', pal: 'mephisto', tags: ['demon'], mul: { hp: 5.8, def: 2.6, res: 1.4, mag: 1.2, spd: 1.1 }, skills: ['b_cross', 'b_curse', 'b_blink'], guard: 6 },
  ilva:     { name: '서리 마녀 일바', title: '서리 궁의 주인', like: 'imp', sprite: 'b_witch', pal: 'frost', tags: ['demon', 'fly'], mt: 'fly', dtype: 'magic', rng: [1, 3], atk: 'bolt', mul: { hp: 7.0, def: 3.0, res: 1.5, mag: 1.15 }, skills: ['b_charm', 'b_frost', 'b_sumImp'], guard: 6 },
  kardan:   { name: '화염 성주 카르단', title: '불가마 성채', like: 'demon', sprite: 'b_lord', pal: 'lava', tags: ['fire', 'demon'], passive: 'fireborn', mul: { hp: 4.2, atk: 1.15, def: 1.3, res: 1.4 }, skills: ['b_erupt', 'b_breath', 'e_smash'], guard: 6 },
  swarm:    { name: '파리 떼의 왕', title: '썩은 평원', like: 'demon', sprite: 'b_swarm', pal: 'fly', tags: ['demon', 'fly'], mt: 'fly', mul: { hp: 3.8, atk: 1.05, def: 1.2, res: 1.3 }, skills: ['b_sumImp', 'b_cloud', 'e_smash'], guard: 6 },
  roen:     { name: '협곡 대공 로엔', title: '협곡 성채', like: 'demon', sprite: 'b_lord', pal: 'duke', tags: ['demon'], mul: { hp: 4.2, atk: 1.12, def: 1.3, res: 1.4 }, skills: ['b_cross', 'b_breath', 'e_smash'], guard: 6 },
  morga:    { name: '역병의 주인 모르가', title: '역병 성', like: 'demon', sprite: 'b_witch', pal: 'plague', tags: ['demon'], mul: { hp: 4.6, atk: 1.15, def: 1.3, res: 1.4 }, skills: ['b_plague', 'b_quake', 'b_sumSkel', 'e_smash'], guard: 6 },
  bonewyrm: { name: '뼈용', title: '뼈 사막', like: 'demon', sprite: 'b_dragon', pal: 'bone', tags: ['undead'], mul: { hp: 5.0, atk: 1.2, def: 1.4, res: 1.3 }, skills: ['b_breath', 'b_sumSkel', 'b_dark'], guard: 6 },
  apostle:  { name: '잿불의 사도', title: '불타는 표석', like: 'demon', sprite: 'b_demon', pal: 'avatar', tags: ['demon'], mul: { hp: 4.8, atk: 1.15, def: 1.3, res: 1.4 }, skills: ['b_cross', 'b_erupt', 'e_smash'], guard: 6 },
  glacia:   { name: '서리용 글라시아', title: '얼어붙은 성', like: 'demon', sprite: 'b_dragon', pal: 'ice', mul: { hp: 5.2, atk: 1.2, def: 1.4, res: 1.5 }, skills: ['b_frost', 'b_breath', 'e_smash'], guard: 6 },
  ignar:    { name: '용암용 이그나르', title: '성난 화산', like: 'demon', sprite: 'b_dragon', pal: 'lava', tags: ['fire'], passive: 'fireborn', mul: { hp: 5.6, atk: 1.25, def: 1.4, res: 1.5 }, skills: ['b_erupt', 'b_breath', 'b_quake'], guard: 6 },
  herald:   { name: '어스름에 묶인 먼동', title: '어스름의 문 앞', like: 'darkMage', sprite: 'b_caster', pal: 'jade', mul: { hp: 6.5, def: 3.0, res: 1.5, mag: 1.2, spd: 1.1 }, skills: ['b_cross', 'b_meteor', 'b_blink', 'b_curse'], guard: 0, phase2: 'duskking' },
  duskking: { name: '어스름의 왕', title: '문 너머에서 온 것', like: 'demon', sprite: 'b_dusk', pal: 'jade2', tags: ['demon'], mul: { hp: 5.6, atk: 1.22, def: 1.35, res: 1.5, spd: 1.1 }, skills: ['b_judge', 'b_cross', 'b_breath', 'b_dark', 'e_smash'], guard: 0 },
  keeper:   { name: '갱도지기', title: '바닥 없는 갱도', like: 'golem', sprite: 'b_brute', pal: 'obsidian', mul: { hp: 2.8, atk: 1.15, def: 1.15, res: 3.0, spd: 1.2 }, skills: ['b_cavein', 'b_quake', 'e_smash'], guard: 4,
              sets: [['b_cavein', 'b_quake', 'e_smash'], ['b_gloom', 'b_cavein', 'b_harden'], ['b_cavein', 'b_gloom', 'b_sumImp', 'e_smash']] }      // 갱도 1~3층 / 4~6층 / 7~10층의 구성 (meta.js enemySpec 이 레벨로 고른다)
};

// ───────── 지형 ─────────
DS.TILE_CH = { '.': 'plain', r: 'road', f: 'forest', h: 'hill', M: 'mount', w: 'water', '~': 'ford', '=': 'bridge',
               '#': 'wall', _: 'floor', L: 'lava', s: 'swamp', p: 'pillar', i: 'ice', d: 'sand', H: 'house', F: 'fence', v: 'void' };
// 이동 비용 [도보, 기마, 비행, 수영] (0 = 통과 불가)
DS.COST = {
  plain: [1, 1, 1, 1], road: [1, 1, 1, 1], bridge: [1, 1, 1, 1], floor: [1, 1, 1, 1], ice: [1, 1, 1, 1], sand: [1.2, 1.5, 1, 1.2],
  forest: [1.6, 2.4, 1, 1.6], hill: [1.6, 2.4, 1, 1.6], ford: [1.6, 1.6, 1, 0.7], water: [0, 0, 1, 0.7], swamp: [1.8, 2.6, 1, 1],
  lava: [1.6, 2.4, 1, 1.6], mount: [0, 0, 1.6, 0], wall: [0, 0, 0, 0], pillar: [0, 0, 0, 0], house: [0, 0, 0, 0], fence: [0, 0, 0, 0], void: [0, 0, 1, 0]
};
DS.MT = { foot: 0, horse: 1, fly: 2, swim: 3 };
DS.TERRAIN = {
  plain: { name: '평지', note: '효과 없음' }, road: { name: '길', note: '효과 없음' }, bridge: { name: '다리', note: '효과 없음' },
  floor: { name: '석판', note: '효과 없음' }, ice: { name: '얼음', note: '효과 없음' }, sand: { name: '모래', note: '이동이 조금 느림' },
  forest: { name: '숲', note: '받는 피해 -20%, 이동 느림' }, hill: { name: '고지', note: '받는 피해 -10%, 궁병 사거리 +1' },
  ford: { name: '여울', note: '얕은 물, 해병 유리' }, water: { name: '물', note: '해병, 비병만 진입' }, swamp: { name: '늪', note: '받는 피해 +10%, 이동 느림' },
  lava: { name: '용암', note: '서 있으면 화상' }, mount: { name: '산', note: '비병만 통과' }, wall: { name: '벽', note: '통과 불가' },
  pillar: { name: '기둥', note: '통과 불가' }, house: { name: '건물', note: '' }, fence: { name: '울타리', note: '통과 불가' }, void: { name: '허공', note: '비병만 통과' }
};

// ───────── 아이템·장비 ─────────
DS.ITEMS = {
  herb:  { name: '약초', price: 30, desc: 'HP +40% (아군 하나, 가문원 포함)' },
  mana:  { name: '마나초', price: 50, desc: '마나 +50% (가주 하나)' },
  endo:  { name: '기운초', price: 80, desc: '틱 게이지 +50%. 쓰고 나면 15초 쉰다 (부대 함께)' }
};
DS.gearPrice = function (tier) { return Math.round(10 * Math.pow(tier, 1.9)) * 10; };      // 정가의 바탕 — 2.1.0: 장비에 단이 없어 「단」 자리에 지금 부대 레벨의 눈금(DS.gearTe)을 넣는다. 되팔 값에만 쓴다
// 장비는 적이 떨어뜨린다(r37: 무기점·방어구점 없음). 가방에 넣고 가문에 입힌다. 2.1.0: 누구나 무엇이든 입는다 — 병과에 맞지 않으면 능력치가 조금 깎인다(DS.GEAR_OFF).
// pow: 무기 위력 배율, def/res/hp: 방어구 배율, crit: 치명타 확률, spd: 행동 회복, mp: 마나 (수치의 크기는 입은 사람의 레벨이 정한다 — meta.js DS.gearAt)
DS.GEAR_CAT = {
  sword: { name: '검', slot: 'w', A: { n: '롱소드', pow: 1 }, B: { n: '레이피어', pow: 0.85, crit: 0.1, note: '치명타 +10%' } },
  lance: { name: '창', slot: 'w', A: { n: '랜스', pow: 1 }, B: { n: '할버드', pow: 0.9, def: 0.25, note: '방어도 함께 오른다' } },
  bow:   { name: '활', slot: 'w', A: { n: '롱보우', pow: 1 }, B: { n: '크로스보우', pow: 0.85, crit: 0.1, note: '치명타 +10%' } },
  wand:  { name: '성구', slot: 'w', A: { n: '메이스', pow: 1 }, B: { n: '홀리 완드', pow: 0.85, mp: 0.25, note: '마나 +25%' } },
  staff: { name: '지팡이', slot: 'w', A: { n: '스태프', pow: 1 }, B: { n: '룬 스태프', pow: 0.85, mp: 0.25, note: '마나 +25%' } },
  heavy: { name: '중갑', slot: 'a', A: { n: '플레이트', def: 1, res: 0.5 }, B: { n: '체인메일', def: 0.8, res: 0.95, note: '마법에 강하다' } },
  light: { name: '경갑', slot: 'a', A: { n: '레더 아머', def: 1, res: 0.5 }, B: { n: '윙 가드', def: 0.8, res: 0.5, spd: 0.06, note: '행동 회복 +6%' } },
  robe:  { name: '로브', slot: 'a', A: { n: '로브', def: 1, res: 0.5 }, B: { n: '실크 로브', def: 0.7, res: 1.0, mp: 0.15, note: '마방 중심, 마나 +15%' } },
  // 2.2.6 무투가(승려)의 장비: 권갑 · 도복 (수치의 크기는 다른 계열과 같다 — 위력 1 · 방어 1)
  fist:  { name: '권갑', slot: 'w', A: { n: '너클', pow: 1 }, B: { n: '수투', pow: 0.85, spd: 0.06, note: '행동 회복 +6%' } },
  gi:    { name: '도복', slot: 'a', A: { n: '도복', def: 1, res: 0.5 }, B: { n: '띠 도복', def: 0.8, res: 0.75, spd: 0.04, note: '행동 회복 +4%' } }
};
// 병과에 「맞는」 계열 (2.1.0: 입는 제한이 아니다 — 맞지 않는 계열은 능력치 −10%)
DS.CLS_GEAR = {
  inf: { w: ['sword'], a: ['heavy'] }, cav: { w: ['lance'], a: ['heavy'] }, fly: { w: ['lance'], a: ['light'] }, mar: { w: ['lance'], a: ['heavy'] }, pike: { w: ['lance'], a: ['heavy'] },
  arc: { w: ['bow'], a: ['light'] }, cle: { w: ['fist'], a: ['gi'] }, mon: { w: ['wand'], a: ['robe'] }, mag: { w: ['staff'], a: ['robe'] }, sha: { w: ['staff'], a: ['robe'] },
  bm: { w: ['sword', 'lance'], a: ['heavy'] }, tm: { w: ['bow', 'lance'], a: ['light', 'heavy'] }, mm: { w: ['staff', 'wand'], a: ['robe'] }
};
// 2.2.6: 무투가가 되기 전에 승려가 들던 성구 · 로브도 맞는 계열로 친다 (가방 · 저장의 옛 장비가 깎이지 않게 — 떨어지는 장비는 권갑 · 도복)
DS.GEAR_ALSO = { cle: { w: ['wand'], a: ['robe'] } };
DS.GEAR_OFF = 0.9;      // 2.1.0: 병과에 맞지 않는 장비는 위력·방어·마방·HP 를 이만큼만 낸다 (사용자: 「불리하게」 — 맞는 장비에 덤은 없다)
// 강화(무기·방어구): 대장간에서 골드를 내고 한 번 굴린다. rate[n] = +n 으로 올릴 때의 성공 확률(%).
//   r37 확률: 사용자 「90%부터 10%씩」 + 「50프로를 하한으로」 — +1 90%, +2 80%, +3 70%, +4 60%, +5 부터 끝까지 50%. 실패하면 부서진다(강화 보호 부적이 있으면 그대로).
//   2.1.0: 장비에 단이 없어지고 강화가 장비를 키우는 길이다 — 끝을 +20 으로, 한 단계의 몫은 무기 공격·마공 +6%·치명타 +1% · 방어구 방어·마방·방어구 HP +6%.
//   값 = cost.base × (지금 단계 + 1)^cost.pow × 등급(유니크 1.5 · 전설 2), 성공과 상관없이 든다 — 단이 아니라 단계만 본다.
//   safe: +safe 까지는 실패해도 부서지지 않는다(골드만 든다). 0 = 늘 부서진다 (지금 값)
DS.ENH = { max: 20, rate: [0, 90, 80, 70, 60, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50], amp: 0.06, crit: 0.01, ad: 0.06, safe: 0,
  cost: { base: 250, pow: 2.2, grade: [1, 1, 1, 1, 1.5, 2] } };
DS.enhCost = function (g) {
  if (!g || !(g.slot === 'w' || g.slot === 'a') || g.enh >= DS.ENH.max) return 0;
  var C = DS.ENH.cost, k = C.grade[Math.max(1, Math.min(5, g.grade || 1))] || 1;
  return Math.max(10, Math.round(C.base * Math.pow(g.enh + 1, C.pow) * k / 10) * 10);
};
DS.enhSafe = function (g) { return !!g && (g.enh + 1 <= (DS.ENH.safe || 0) || !!g.nobrk); };      // 이번 굴림이 실패해도 부서지지 않는가 (nobrk: 「닳지 않는」 전설)
// 무기: 한 단계마다 공격·마공 +6%, 치명타 +1% · 방어구(ad): 방어·마방·방어구 HP +6% (치명타 덤 없음)
DS.enhTier = function (n) { return n >= 16 ? 4 : n >= 10 ? 3 : n >= 5 ? 2 : n >= 1 ? 1 : 0; };      // 이펙트 단계: 1~4 / 5~9 / 10~15 / 16~20
DS.ENH_COL = ['', '#dff0ff', '#5fc4ff', '#c58cff', '#ffd75e'];
DS.STATUS = { poison: { name: '중독' }, slow: { name: '둔화' }, burn: { name: '화상' }, mark: { name: '표식' }, wet: { name: '젖음' } };      // 2.2.6: 화상(법사) · 표식(궁병) · 젖음(해병)
DS.PASSIVES = {
  marine:   { name: '수전', desc: '물 위에서 공격 +25%, 받는 피해 -25%.' },
  fireborn: { name: '화염의 몸', desc: '용암에서 화상을 입지 않는다.' },
  twin:     { name: '쌍두', desc: '기본 공격을 두 번 한다.' }
};
// 상성: 보병 > 창병 > 기병 > 보병
DS.COUNTER = { inf: 'pike', pike: 'cav', cav: 'inf' };

// ───────── 권장 레벨 (표시용) ─────────
// 2.2.3: 잰 값. tools/calib.js 가 봇이 실제로 닿은 판(가문 수 · 장비 · 막사 그대로, BOTSNAP)을 레벨만 옮겨 진짜 엔진에서 싸워 본 결과다 (판마다 6판 × 6번, ±1 레벨을 섞어 본다).
//   읽는 곳은 meta.js 의 DS.recL · DS.recHalf · DS.recSafe · DS.recTag · DS.zoneRec · DS.pitRec 하나뿐 (화면 · 봇 · 갱도가 같은 값을 본다).
//   scn[번호] = [권장, 반반, 안전] — 권장: 열에 여덟 넘게 이기고 아무도 쓰러지지 않는 부대 평균 레벨 · 반반: 이길 확률 50% · 안전: 봇이 들어가는 레벨(2.2.2 의 권장 —
//     봇이 그 레벨로 닿은 진짜 부대는 열 번 다 이겼다). 번호를 따라 줄지 않게(단조) 다듬었다. 21~30 은 단 문턱(8단 · 9단)이 따로 있다 — 합일한 셋이 앞서면 나머지가 이만큼이면 된다.
//   zone[지역] = [권장 낮은 끝, 높은 끝, 반반] — 낮은 끝: 그 지역의 센 무리 둘을 한꺼번에 끌어도 스물에 열아홉은 아무도 안 쓰러지는 레벨(단 문턱이 있는 곳은 그 단의 첫 레벨) ·
//     높은 끝: 그 지역 적의 가장 높은 레벨(그 위로는 처치 경험치가 준다)
//   pit = 갱도 층의 식: 권장 = a + b × (적 레벨 + 수문장 b5 · 밑바닥 b10) + over × (힘 배율 − 1) × 100 · 반반 = 권장 − half (봇이 닿은 부대 그대로 1 ~ 40층을 싸워 맞춘 직선)
//   easy: 「여유」는 안전 레벨 이상 (갱도 · 들판은 권장 + easy)
// 2.2.4: 시나리오가 조금 세졌다 (tune.js DS.HARD — 1~6 그대로, 14~20 체력·공격 ×1.15, 30번 ×1.05). scn 은 2.2.3 의 값에 「세기만 바꾼 차이」를 더했다:
//   같은 판(봇 넷이 실제로 닿은 판 — 가문은 영웅관에서 열렸다) · 같은 씨앗 · 같은 레벨 옮김(-26 ~ +8)으로 옛 세기와 새 세기를 각각 싸워(tools/calib.js scn · 판마다 8번),
//   권장 · 반반 · 안전(tools/calsum.py)이 몇 레벨 올랐는지를 이웃 셋과 고르게 해 더하고 단조로 다듬었다. 들판 · 갱도는 그대로
// 2.2.7: 다시 세졌다 (tune.js DS.HARD7 · DS.BOSS7 · DS.FIELD_EN). 2.2.6 의 새 병과 기술로 쉬워진 몫(권장에서 4~12 레벨)을 되돌리고 조금 더 — scn 은 2.2.4 의 값에 「2.2.5 와 견준 차이」를 더했다:
//   2.2.5 봇 열 판이 닿은 판 그대로(병과마다 한 판 · 시나리오마다) 2.2.5 · 2.2.7 엔진에서 같은 씨앗 · 같은 레벨 옮김(-24 ~ +2, 네 번씩)으로 싸워(tools/calib.js scn),
//   권장(이기고 쓰러짐 ≤ 1 이 80%)이 몇 레벨 올랐는지를 이웃 셋과 고르게 해 권장 · 반반에 더했다. 안전(봇이 들어가는 레벨)은 그보다 한 레벨 덜, 21번부터는 많아야 둘 (단조).
//   확인(tools/calib.js at — 봇이 닿은 열 판을 권장 레벨로 옮겨 백 번씩): 이김 99~100%, 쓰러짐 ≤ 1 이 91~100%, 아무도 안 쓰러짐은 12번 46% · 그 밖 62~100%.
//   zone 의 낮은 끝 · 반반은 같은 판으로 두 무리를 함께 싸워(tools/calib.js zone, 2.2.5 와 견줌) 오른 만큼 (단 문턱인 잿빛 · 끝의 땅은 그대로). 갱도는 그대로
// 2.2.9: 셋이 나가는 싸움(2.2.8)으로 다시 재었다 — 적의 세기는 그대로. 2.2.9 봇 열 판(병과마다 한 판 · 새 합일 규칙 · 출전 셋)이 시나리오마다 처음 들어가기 직전의 판을
//   레벨만 옮겨(-28 ~ +8, 세 번씩 · tools/calib.js scn — 싸우는 것은 출전한 셋과 맹주의 가문원뿐) 진짜 엔진에서 싸우고 tools/calsum.py 로 권장 · 반반 · 안전을 찾고, 번호를 따라 줄지 않게 앞의 큰 값을 이어 썼다 (평균으로 다듬으면 21번처럼 어려운 판이 낮아진다).
//   21~30 은 단 문턱(8단 · 9단)이 있어 합일한 가주를 그 단의 첫 레벨 밑으로 내리지 않는다 — 그 아래는 들어가지 못하니 권장은 「합일한 이가 있는 셋의 평균」이다.
//   30번의 안전이 높은 것은 이름 지우기 때문이다 (지워진 이는 쓰러짐으로 세지 않지만 그만큼 싸움이 거칠다).
// 2.3.0: 큰 보스와 새 몬스터로 다시 재었다 — 2.2.9 와 같은 판(봇 열 판이 시나리오마다 처음 들어가기 직전의 판) · 같은 레벨 옮김(-28 ~ +8, 세 번씩) · tools/calsum.py · 번호를 따라 앞의 큰 값을 이어 쓴다.
//   2.2.9 의 값보다 낮게 잰 판은 2.2.9 값을 그대로 둔다 (13 · 25번처럼 재어 보니 낮았지만 봇 첫 시도가 더 자주 졌다 — 21~30 은 원래 출렁인다. 권장은 올리기만 했다). 들판은 센 무리 둘로 다시 재어 가온 섬만 낮은 끝 +2 (독두꺼비 · 파도 무당). 갱도는 수문장 층의 큰 수문장만큼 b5 · b10.
DS.REC = {
  scn: { 1: [1, 1, 1], 2: [1, 1, 1], 3: [1, 1, 3], 4: [5, 4, 7], 5: [11, 9, 13], 6: [17, 15, 21], 7: [17, 15, 21], 8: [24, 20, 28], 9: [27, 23, 29], 10: [28, 23, 34], 11: [35, 31, 42], 12: [35, 31, 42], 13: [36, 33, 42], 14: [41, 34, 45], 15: [45, 38, 49],
         16: [45, 41, 49], 17: [45, 41, 56], 18: [48, 42, 59], 19: [51, 45, 62], 20: [61, 48, 62], 21: [70, 66, 77], 22: [70, 68, 77], 23: [71, 68, 77], 24: [71, 69, 77], 25: [78, 69, 82], 26: [78, 69, 82], 27: [78, 76, 82], 28: [78, 76, 82], 29: [78, 76, 82], 30: [78, 76, 87] },
  zone: { dawn: [1, 9, 1], windy: [5, 14, 1], stone: [9, 26, 1], coast: [28, 36, 16], isle: [19, 42, 9], desert: [25, 47, 13], mire: [36, 58, 26], spire: [36, 70, 25], ash: [71, 81, 29], end: [81, 100, 25] },      // 2.2.9: 셋이 나가면 무리도 그만큼 작다 (DS.packOf) — 센 무리 둘을 함께 끌어도 스물에 열아홉은 아무도 안 쓰러지는 레벨 (잿빛 · 끝의 땅은 단 문턱)
  pit: { a: 29, b: 0.52, b5: 5, b10: 12, over: 0.35, half: 6 },      // 2.2.9: 1 ~ 50층을 출전 셋으로 다시 싸워 맞춘 직선 (깊은 층은 합일한 이가 앞장서면 예전 식보다 훨씬 낮다) · 2.3.0: 큰 수문장(돌무쇠 · 큰지렁이 · 거신)만큼 b5 2 → 5 · b10 5 → 12 (재어 보니 5층 묶음 +1.5 · 10층 묶음 +3 ~ 4 레벨)
  easy: 12,
  farm: 10      // 갱도에서 되풀이해 다질 층: 권장보다 이만큼 높은 부대 (DS.pitFarm — 길 안내 · 봇)
};

// ───────── 현상 수배 (합일 준비 구간의 목표) ─────────
// 20번(맹세의 깃발)을 깬 뒤부터 게시판에 늘 셋이 걸린다. 경험치는 건드리지 않는다 — 보상은 골드·모집권·목표 장비·용병 공훈.
//   hunt  사냥: 그 지역의 그 적 n마리 → 골드 + 옵션 둘 붙은 유니크(가장 처진 지휘관이 입을 계열)
//   elite 정예: 그 지역 무리 하나가 이름난 우두머리와 정예들이 된다 → 우두머리를 쓰러뜨리면 높은 굴림 유니크 + 모집권 + 그 자리 용병 공훈
//   sweep 출몰: 그 지역에 무리가 들끓는다(전리품이 잦다) → 아무 적 n마리 → 골드 + 소모품
DS.BTY = {
  mul: 1,            // 0 = 끈다 (게시판이 비고, 정예·출몰도 나오지 않는다)
  from: 20,          // 이 시나리오를 깬 뒤부터
  slots: 3,
  merit: 6,          // 달성할 때 출전 중인 용병 모두의 공훈 +
  hunt:  { n: [14, 22], gold: 14, grade: 3 },                      // gold: 적 레벨 × 이 값 · grade: 보상 장비 굴림(loot.js rollGear — 3 옵션 둘 · 4 높은 굴림)
  sweep: { n: [28, 40], gold: 10, drop: 1.6 },                     // drop: 출몰한 지역에서의 드랍 배율
  elite: { gold: 30, grade: 4, ticket: 0, merit: 20,      // r35: 정예 현상금의 모집권은 뺐다 (가솔은 귀하다)
    boss: { hp: 2.6, atk: 1.15, def: 1.15, res: 1.15, gold: 4 }, crew: { hp: 1.4, atk: 1.05, gold: 1.5 } },
  shard: { need: 6, elite: 2 }      // 깃술 조각: 현상금마다 1(정예 2), need 개가 모이면 전설 장비 하나(아직 없는 것, 그 지역 것 먼저) + 강화 보호 부적 2 (2.1.0 — 옛 깃술 유물 자리)
};
// 정예 우두머리의 칭호 (이름 앞에 붙는다). DS.LORE.bounty.titles 가 있으면 그것
DS.ELITE_TITLES = ['외눈', '뿔 부러진', '흉터투성이', '세 번 살아난', '쇠사슬 끄는', '잿불 두른', '굶주린', '늙은', '목에 값 걸린', '이름난', '돌 씹는', '가주 노리는'];      // 시나리오팀 감수본과 같게
DS.BTY_TXT = {      // 기본 글 ({zone} 지역 이름 · {mob} 적 이름 · {n} 수 · {name} 정예 이름). DS.LORE.bounty 가 있으면 그쪽이 먼저
  hunt:  { title: '{mob} 사냥', line: '「{zone}」의 {mob} {n}마리' },
  elite: { title: '{name} 토벌', line: '「{zone}」에 정예 무리가 나타났다. 우두머리 {name}' },
  sweep: { title: '{mob} 떼 출몰', line: '「{zone}」에 {mob} 떼가 들끓는다. 아무 적 {n}마리 (그동안 전리품이 잦다)' },
  done:  '현상금 「{title}」 달성',
  shard: '깃술 조각 {n}/{need}',
  flag:  '깃술 조각이 모였다 — 전설 「{name}」'
};
})();
