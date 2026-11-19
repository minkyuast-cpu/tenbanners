// 열 개의 깃발 — 전리품: 옵션(접두·접미) 장비, 고유 장비, 드랍 굴림, 소모품, 용병 물건, 가방의 장비 구역
// 이 파일 하나로 끝낸다: data.js·meta.js·game.js·ui.js 는 고치지 않고 DS.gear·gearScore·charStats·cmdSpec·mercSpec 을 감싼다.
//   식별자 문법 (2.1.0 — 단이 없다):  계열.형[~접두N][~접미N][+강화]     예) 'lance.A~keen6~fang3+2' · 고유는 새 '형' 'sword.grok' · 'robe.nuri~dew4' · 강화는 +1~+20
//   - 수치의 크기는 입은 사람의 레벨이 정한다 (meta.js DS.gearAt). 장비는 계수(g.k)와 옵션만 지닌다 — 아끼는 물건을 끝까지 쓰고, 강화로 키운다.
//   - 옵션은 '+' 앞에 온다 → meta.js 의 enhance 가 만드는  g.base + '+' + n  이 옵션을 그대로 지닌다 (enhance 는 손대지 않는다)
//   - N = 굴림 눈금 1~9 (값이 고정인 옵션은 눈금 없음). 접두 하나 + 접미 하나까지, 접두가 먼저 (같은 물건이 두 이름을 갖지 않게)
//   - 등급은 식별자에서 나온다(저장 칸 없음) — 셋뿐이다: 1 보통(옵션 없음) · 4 유니크(옵션이 하나라도 있으면) · 5 전설(고유 장비 — 이름과 대표 효과가 정해진 물건)
//     숫자 4·5 는 옛 영웅·전설 자리를 그대로 쓴다 (잠금·정렬·색·화면의 >=4 비교가 그대로 맞게). 2·3 은 장비에 더는 나오지 않는다 (옛 고급·희귀도 유니크로 읽힌다)
//     유니크의 값어치는 굴림이 정한다: 옵션 하나/둘 · 눈금 1~9 · 「높은 굴림」(g.hi: 눈금 7 이상 또는 높은 굴림 전용 옵션)
//     화면은 등급을 색으로만 보인다 (이름 색 · 아이콘 테두리). 2.1.0: 이름 앞의 등급 눈금(깃발)은 없앴다
//   - 내력(save.gh): 유니크·전설은 얻은 해·곳과 거쳐 간 손을 남긴다 (아래 「내력」). 수치에는 아무 영향이 없다
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
function pct(v) { return Math.round(v * 100); }
function pm(v) { return (Math.round(v * 1000) / 10).toFixed(1).replace(/\.0$/, ''); }

// ───────── 옵션 표 ─────────
// [접두인가, 이름, 붙는 장비('w' 무기 · 'a' 방어구 · 'wa' 전부 · 계열 배열), 굴림 범위(없으면 고정), 효과, 설명, 영웅 전용]
// 효과: powp 위력 % · amp 공격·마공 % · crit · spd · mp · defp/resp/hpp = 방어구 기준값(aDef)의 배수(계수에 더한다). 1 = 굴림값 그대로, 음수 = 고정된 대가
//       drain·hpm·rng·trait·passive·mt·mvm·dtype·skill·lead·tags = 엔진이 이미 읽는 칸(사양에 직접 얹는다) · eng = 엔진이 읽는 fx 칸 (engine.js 의 2.1.0 장비 훅 포함)
// 설명 글: {p} 굴림값 % · {n} 지금 부대 레벨 기준 실제 수치 · {g} 굴림값 그대로 · {m} 소수 한 자리 % · {q} (1 − 굴림값) %
// 2.2.6: 권갑(fist) · 도복(gi)에도 맞는 옵션 — 별 스민 · 바람 탄 · 불꽃 튀는 · 쌍두 · 축성 · 메아리 · 자비 / 아지랑이
var AFFIX = {
  keen:   [1, '날 선', 'w', [0.10, 0.30], { powp: 1 }, '위력 +{p}%'],
  honed:  [1, '벼린', 'w', [0.02, 0.08], { amp: 1 }, '공격, 마공 +{p}%'],
  sharp:  [1, '매서운', 'w', [0.04, 0.16], { crit: 1 }, '치명타 +{p}%'],
  heavy:  [1, '묵직한', 'w', [0.20, 0.40], { powp: 1, spd: -0.04 }, '위력 +{p}%, 행동 회복 −4%'],
  fierce: [1, '사나운', 'w', [0.25, 0.45], { powp: 1, defp: -0.4 }, '위력 +{p}%, 방어가 깎인다'],
  dusk:   [1, '빛바랜', 'w', [0.06, 0.12], { amp: 1, hpp: -1.5 }, '공격, 마공 +{p}%, 최대 HP가 깎인다'],
  even:   [1, '고른', 'w', [0.05, 0.15], { powp: 1, crit: 0.4 }, '위력 +{p}%, 치명타 조금'],
  oiled:  [1, '기름 먹인', 'w', [0.02, 0.06], { spd: 1, crit: 1 }, '행동 회복, 치명타 +{p}%'],
  guard:  [1, '막아서는', 'w', [0.15, 0.45], { defp: 1 }, '방어 +{n}'],
  star:   [1, '별 스민', ['wand', 'staff', 'fist'], [0.06, 0.20], { mp: 1, powp: 0.5 }, '마나 +{p}%, 위력 조금'],
  wind:   [1, '바람 탄', ['bow', 'lance', 'fist'], [0.02, 0.07], { spd: 1 }, '행동 회복 +{p}%'],
  light:  [1, '가벼운', 'a', [0.02, 0.08], { spd: 1 }, '행동 회복 +{p}%'],
  hard:   [1, '단단한', 'a', [0.12, 0.40], { defp: 1 }, '방어 +{n}'],
  fine:   [1, '결 고운', 'a', [0.15, 0.55], { resp: 1 }, '마방 +{n}'],
  thick:  [1, '두터운', 'a', [0.40, 1.30], { hpp: 1 }, 'HP +{n}'],
  padded: [1, '덧댄', 'a', [0.08, 0.34], { defp: 1, resp: 1 }, '방어, 마방 +{n}'],
  deep:   [1, '속 깊은', 'a', [0.06, 0.25], { mp: 1 }, '마나 +{p}%'],
  nimble: [1, '날랜', 'a', [0.04, 0.10], { spd: 1, defp: -0.3 }, '행동 회복 +{p}%, 방어가 깎인다'],
  steel:  [1, '무쇠 두른', ['heavy'], [0.25, 0.60], { defp: 1, spd: -0.03 }, '방어 +{n}, 행동 회복 −3%'],
  silver: [1, '성수 바른', 'w', [0.10, 0.25], { eng: 'slay' }, '망자, 악마에게 주는 피해 +{p}%'],
  frost:  [1, '서리 맞은', 'w', [0.10, 0.25], { eng: 'slow' }, '기본 공격이 {p}% 확률로 둔화시킨다'],
  venom:  [1, '독 바른', 'w', [0.10, 0.25], { eng: 'poison' }, '기본 공격이 {p}% 확률로 중독시킨다'],
  thorn:  [1, '가시 선', 'a', [0.08, 0.20], { eng: 'reflect' }, '받은 피해의 {p}%를 되돌린다'],
  // 2.1.0 새 접두 (엔진의 장비 훅)
  cruel:  [1, '잔혹한', 'w', [0.15, 0.40], { eng: 'exec' }, 'HP 30% 아래인 적에게 주는 피해 +{p}%'],
  angry:  [1, '성난', 'w', [0.15, 0.35], { eng: 'rage' }, '잃은 HP만큼 주는 피해가 는다 (빈사일 때 +{p}%)'],
  deadly: [1, '치명적인', 'w', [0.15, 0.40], { eng: 'critX' }, '치명타 피해 +{p}% (기본 150%)'],
  greedy: [1, '탐욕스러운', 'w', [0.10, 0.25], { eng: 'goldUp' }, '쓰러뜨린 적의 골드 +{p}%'],
  spear:  [1, '꿰뚫는', ['bow', 'lance'], [0.20, 0.45], { eng: 'pierce' }, '기본 공격이 맞힌 적 뒤(두 칸 안)의 적도 {p}% 위력으로 꿰뚫는다'],
  quick:  [1, '재빠른', 'w', [0.05, 0.15], { eng: 'atkTick' }, '기본 공격에 드는 틱 −{p}%'],
  spark:  [1, '불꽃 튀는', ['staff', 'wand', 'fist'], [0.20, 0.40], { eng: 'splash' }, '기본 공격이 맞힌 적 둘레의 적에게도 {p}% 피해'],

  fang:   [0, '늑대 이빨', 'w', [0.03, 0.08], { drain: 1 }, '준 피해의 {p}%만큼 HP 회복'],
  leech:  [0, '수렁 거머리', 'w', [0.08, 0.12], { drain: 1, hpm: 0.9 }, '준 피해의 {p}%만큼 HP 회복, 최대 HP −10%'],
  dew:    [0, '새벽 이슬', 'a', [0.03, 0.07], { hpm: 1 }, '최대 HP +{p}%'],
  brave:  [0, '투지', 'wa', null, { trait: 'brave' }, 'HP가 절반 아래면 공격 +20%'],
  last:   [0, '구사일생', 'a', null, { trait: 'survivor' }, '쓰러질 피해를 전투마다 한 번 버틴다', 1],
  hawk:   [0, '매의 눈', ['bow', 'staff', 'lance'], null, { rng: 1 }, '사거리 +1', 1],
  twin:   [0, '쌍두', ['sword', 'lance', 'fist'], null, { passive: 'twin' }, '기본 공격을 두 번 한다 (각 65%)'],
  moon:   [0, '물비늘', 'wa', null, { passive: 'marine' }, '물 위에서 공격 +25%, 받는 피해 −25%'],
  ember:  [0, '불목', 'a', null, { passive: 'fireborn' }, '용암에서 화상을 입지 않는다'],
  ford:   [0, '물길', 'a', null, { mt: 'swim' }, '물 위를 걷는다', 1],
  gale:   [0, '맞바람', 'a', [0.06, 0.18], { mvm: 1 }, '이동에 드는 틱 −{p}%'],
  holy:   [0, '축성', ['wand', 'fist'], null, { dtype: 'holy' }, '기본 공격이 신성 속성이 된다 (망자, 악마에게 1.5배)'],
  whirl:  [0, '회오리', ['sword', 'lance'], null, { skill: 'whirl' }, '기술 「선풍」을 쓸 수 있다'],
  bolt:   [0, '뇌운', ['lance', 'sword', 'bow'], null, { skill: 'thunder' }, '기술 「번개」를 쓸 수 있다'],
  hex:    [0, '둔화의 끈', 'w', null, { skill: 'slow' }, '기술 「둔화」를 쓸 수 있다'],
  mend:   [0, '돌봄의 끈', ['wand', 'staff'], null, { skill: 'cure' }, '기술 「정화」를 쓸 수 있다'],
  bone:   [0, '초혼', ['staff', 'wand'], null, { skill: 'summon' }, '기술 「망자 부름」을 쓸 수 있다', 1],
  bsteel: [0, '강철 매듭', 'wa', [0.04, 0.12], { lead: 'def' }, '방어 +{p}% (깃발 유닛)'],
  bwind:  [0, '바람 매듭', 'wa', [0.03, 0.08], { lead: 'spd' }, '행동 회복 +{p}% (깃발 유닛)'],
  bstar:  [0, '별 매듭', 'wa', [0.04, 0.12], { lead: 'at' }, '공격 +{p}% (깃발 유닛)'],
  wing:   [0, '하피 깃', 'a', null, { tags: 'fly', mt: 'fly' }, '산과 물을 넘는다, 대신 화살에 1.5배로 맞는다', 1],
  breath: [0, '숨 고르기', 'a', [0.003, 0.010], { eng: 'mpRegen' }, '전투 중 마나가 초마다 최대치의 {m}% 더 찬다'],
  rush:   [0, '처치의 기세', 'w', [10, 30], { eng: 'killGauge' }, '적을 쓰러뜨리면 게이지 +{g}'],
  warden: [0, '파수꾼', 'a', [0.10, 0.25], { eng: 'teleRes' }, '예고된(붉은 칸) 기술로 받는 피해 −{p}%'],
  giant:  [0, '거인 잡이', 'w', [0.05, 0.12], { eng: 'bossDmg' }, '보스에게 주는 피해 +{p}%'],
  pure:   [0, '맑은 피', 'a', [0.30, 0.60], { eng: 'stRes' }, '중독, 둔화에 걸리는 시간 −{p}%'],
  // 2.1.0 새 접미 (엔진의 장비 훅)
  echo:   [0, '메아리', ['staff', 'wand', 'fist'], [0.06, 0.15], { eng: 'echo' }, '기술이 {p}% 확률로 한 번 더 나간다 (필살기 제외)'],
  thirst: [0, '피의 갈증', 'w', [0.010, 0.025], { eng: 'killDrain' }, '적을 쓰러뜨릴 때마다 흡혈 +{m}% (그 싸움 동안, 6번까지)'],
  regen:  [0, '아무는 살', 'a', [0.003, 0.008], { eng: 'hpRegen' }, '싸우는 동안 초마다 최대 HP의 {m}% 회복'],
  alone:  [0, '외톨이', 'a', [0.10, 0.25], { eng: 'lone' }, '2칸 안에 다른 가주가 없으면 받는 피해 −{p}%, 주는 피해 +{p}%'],
  mercy:  [0, '자비', ['wand', 'staff', 'fist'], [0.10, 0.30], { eng: 'healUp' }, '치유 기술의 회복량 +{p}%'],
  blur:   [0, '아지랑이', ['light', 'robe', 'gi'], [0.04, 0.12], { eng: 'eva' }, '적의 기본 공격을 {p}% 확률로 피한다'],
  feast:  [0, '잔치', 'a', [0.02, 0.06], { eng: 'killHp' }, '적을 쓰러뜨리면 HP {p}% 회복'],
  surge:  [0, '기세', 'wa', [0.15, 0.40], { eng: 'ultUp' }, '필살 게이지가 {p}% 빨리 찬다 (필살기가 깨어난 사람)']
};
DS.AFFIX = AFFIX;
DS.AFFIX_NEW = ['cruel', 'angry', 'deadly', 'greedy', 'spear', 'quick', 'spark', 'echo', 'thirst', 'regen', 'alone', 'mercy', 'blur', 'feast', 'surge'];      // 2.1.0 에 더한 옵션 (시험 t46 이 엔진에서 하나씩 확인한다)
function axPre(A) { return !!A[0]; }
function axFits(A, cat, slot) { return A[2] === 'wa' || A[2] === slot || (A[2] instanceof Array && A[2].indexOf(cat) >= 0); }
function axVal(A, roll) { return A[3] ? A[3][0] + (A[3][1] - A[3][0]) * (roll - 1) / 8 : 0; }
function axDesc(A, v, aD) {
  return A[5].split('{p}').join(pct(v)).replace('{n}', Math.round(aD * v)).replace('{g}', Math.round(v)).replace('{m}', pm(v));
}

// ───────── 고유 장비 (전설) ─────────
// 계열 → 형 → { n 이름, pow·def·res·hp·crit·spd·mp (A/B 형과 같은 뜻 — 계수), x 대표 효과, from 얻는 곳, lore 한 줄 }
//   from: 보스 키(그 보스를 처음 깨면 준다) · 'zone:지역'(그 지역의 적이 드물게 · 깃술 조각 보상이 그 지역 것을 먼저) · 'scn:번호'(그 시나리오를 처음 깨면)
//   x 칸: lead · skill · drain · hpm · rng · mvm · trait · passive · mt · tags · dtype · basic(기본 공격 배율) · eng(엔진 fx 묶음 — 아래 ENG_TXT 가 글을 만든다)
//         · enx 강화 몫 배율(2 = 두 배) · nobrk 강화에 실패해도 부서지지 않는다 · pair '짝이름'(같은 짝의 다른 물건을 다른 가주가 들고 함께 나가면 둘 다 세진다)
var UNIQ = {
  sword: {
    grok:    { n: '그록의 방아공이', pow: 1.25, spd: -0.05, from: 'grok', lore: '방앗간을 차지한 혹부리가 휘두르던 공이. 아직 밀가루가 묻어 있다.' },
    mire:    { n: '가라앉은 종의 추', pow: 1.0, x: { drain: 0.10, hpm: 0.9 }, from: 'mire', lore: '수렁에 잠긴 마을의 종에서 떼어 낸 추. 울릴 때마다 무언가를 가져간다.' },
    kardan:  { n: '불가마 대검', pow: 1.3, def: -0.4, from: 'kardan', lore: '성채의 가마에서 한 번도 식힌 적이 없는 칼. 쥔 손도 함께 탄다.' },
    ignar:   { n: '이그나르의 송곳니', pow: 1.2, crit: 0.10, from: 'ignar', lore: '성난 화산이 잠들며 남긴 이빨 하나.' },
    oath:    { n: '맹세의 검', pow: 1.1, crit: 0.05, x: { nobrk: 1 }, from: 'scn:10', lore: '옛 대장 먼동이 돌아오면 찾겠다며 달못에 맡긴 검. 닳지 않는다.' },
    thirst:  { n: '목마른 칼', pow: 1.0, x: { eng: { killDrain: 0.03 } }, from: 'zone:stone', lore: '피를 마실수록 날이 맑아진다는 칼. 씻어 둘 필요가 없다.' },
    blood:   { n: '핏빛 대검', pow: 1.55, x: { eng: { curse: 0.006 } }, from: 'zone:spire', lore: '첨탑 기슭에 꽂혀 있던 대검. 뽑은 사람마다 조금씩 말라 갔다.' },
    first:   { n: '대장장이의 첫 칼', pow: 0.9, x: { enx: 2 }, from: 'zone:dawn', lore: '해밀 대장장이가 처음 두드린 칼. 두드릴수록 제 솜씨를 드러낸다.' },
    sun:     { n: '해의 칼', pow: 1.05, crit: 0.05, x: { pair: 'sun' }, from: 'zone:coast', lore: '물비늘 해안의 쌍둥이 대장장이 가운데 언니가 벼린 칼. 늘 짝을 찾는다.' }
  },
  lance: {
    heron:   { n: '통행세 걷는 창', pow: 1.0, spd: 0.06, crit: 0.05, from: 'heron', lore: '다리를 막고 세를 걷던 말몰이꾼의 창. 이제는 우리가 길을 연다.' },
    twin:    { n: '쌍두 송곳니', pow: 0.95, crit: 0.14, spd: 0.03, from: 'twinsnake', lore: '이끼 낀 사당의 구렁이 이빨 두 개를 한 자루에 묶었다. 어느 쪽이든 급소를 문다.' },
    volko:   { n: '선장의 갈고리 작살', pow: 1.05, x: { skill: 'harpoon' }, from: 'volko', lore: '해적 부두의 주인이 배마다 걸어 당기던 작살.' },
    keeper:  { n: '갱도지기의 곡괭이', pow: 1.35, spd: -0.08, from: 'keeper', lore: '광부들이 돌 파수꾼의 손에 쥐여 준 곡괭이. 내려오는 것은 무엇이든 찍는다.' },
    dawn:    { n: '먼동의 깃발', pow: 1.2, x: { lead: { at: 1.10 } }, from: 'duskking', lore: '옛 대장이 문 안에서 끝까지 들고 섰던 깃발. 바랬던 빛깔이 돌아왔다.' },
    moon:    { n: '달의 창', pow: 1.05, spd: 0.04, x: { pair: 'sun' }, from: 'zone:isle', lore: '쌍둥이 대장장이 가운데 아우가 벼린 창. 해의 칼과 같은 쇠를 나눠 썼다.' },
    finish:  { n: '마무리 창', pow: 1.0, x: { eng: { exec: 0.5 } }, from: 'zone:windy', lore: '쓰러지는 짐승을 한 번에 보내 주던 사냥꾼의 창. 마지막 한 번이 가장 깊다.' },
    wyrm:    { n: '용뼈 창', pow: 1.25, x: { rng: 1 }, from: 'scn:26', lore: '주인을 기다리던 용의 뼈 사이에서 찾은 창. 한 칸 더 닿는다.' }
  },
  bow: {
    shara:   { n: '샤라의 꼬리침 활', pow: 0.95, crit: 0.16, from: 'shara', lore: '마른 샘의 여왕 전갈이 남긴 꼬리로 시위를 걸었다.' },
    hagen:   { n: '가주 사냥꾼의 석궁', pow: 1.2, spd: -0.04, x: { rng: 1 }, from: 'hagen', lore: '가주만 골라 쏘던 사냥꾼 대장의 석궁.' },
    harpy:   { n: '바람재 깃 활', pow: 0.9, spd: 0.10, from: 'zone:windy', lore: '하피의 깃으로 살깃을 단 활. 바람재의 바람을 탄다.' },
    pierce:  { n: '꿰뚫는 활', pow: 0.95, x: { eng: { pierce: 0.6 } }, from: 'zone:desert', lore: '모래바람을 뚫고 쏘라고 만든 활. 화살이 멈출 줄 모른다.' },
    gale:    { n: '바람 매 활', pow: 0.85, x: { eng: { atkTick: 0.8 } }, from: 'zone:coast', lore: '매처럼 연달아 내리꽂는다. 시위가 식을 틈이 없다.' },
    final:   { n: '마지막 한 발', pow: 0.9, crit: 0.08, x: { eng: { critX: 0.5 } }, from: 'zone:mire', lore: '화살이 하나 남았을 때 쓰던 활. 급소를 놓치는 법이 없다.' }
  },
  wand: {
    tormak:  { n: '울림뿔 메이스', pow: 1.25, mp: -0.10, from: 'tormak', lore: '울림 바위를 흔들던 뿔거인의 뿔. 내려치면 땅이 대답한다.' },
    king:    { n: '잠 못 드는 왕의 홀', pow: 1.05, mp: 0.15, x: { skill: 'curse' }, from: 'king', lore: '옛 왕은 잠들었지만, 홀은 아직 거역하는 자를 꾸짖는다.' },
    morga:   { n: '역병 성의 향로', pow: 1.05, mp: 0.25, x: { skill: 'deathCloud' }, from: 'morga', lore: '역병을 피우던 향로. 이제는 적진 쪽으로만 연기를 낸다.' },
    scale:   { n: '장사꾼의 저울추', pow: 1.0, x: { eng: { goldUp: 0.3 } }, from: 'zone:isle', lore: '가온 시장에서 무게를 속이던 저울추. 이제는 전리품 무게를 늘린다.' },
    mercy:   { n: '자비의 홀', pow: 0.9, mp: 0.15, x: { eng: { healUp: 0.35 } }, from: 'zone:stone', lore: '순례자들이 돌마루 고원을 넘으며 돌려 쥐던 홀. 상처가 빨리 아문다.' },
    bell:    { n: '새벽 종 메이스', pow: 1.1, x: { dtype: 'holy', eng: { slay: { undead: 0.25, demon: 0.25 } } }, from: 'zone:end', lore: '어스름이 짙어질 때마다 울리던 종을 녹여 만들었다.' }
  },
  staff: {
    pippin:  { n: '피핀의 요술 지팡이', pow: 0.9, mp: 0.4, crit: 0.08, from: 'pippin', lore: '산마을을 속여 빼앗은 요술쟁이의 지팡이. 주인도 자주 속인다.' },
    orbel:   { n: '별 보는 탑의 자', pow: 1.0, x: { rng: 1 }, from: 'orbel', lore: '점성술사가 하늘과 땅 사이를 재던 자. 한 칸 더 멀리 닿는다.' },
    apostle: { n: '잿불 지팡이', pow: 1.25, mp: -0.15, from: 'apostle', lore: '대장이 돌아올 길을 밝히던 표석 불의 마지막 불씨. 마나를 태워 키운다.' },
    echo:    { n: '메아리 지팡이', pow: 0.95, mp: 0.1, x: { eng: { echo: 0.2 } }, from: 'zone:mire', lore: '별 보는 탑의 견습생이 쓰던 지팡이. 주문을 외우면 늘 한 번 더 들린다.' },
    lamp:    { n: '마른 샘 등불', pow: 0.95, x: { eng: { killHp: 0.08, mpRegen: 0.004 } }, from: 'zone:desert', lore: '마른 샘을 지키던 등불을 지팡이 끝에 매달았다. 꺼질 듯하다가 다시 붙는다.' },
    spark:   { n: '불티 지팡이', pow: 1.0, x: { eng: { splash: 0.4 } }, from: 'zone:ash', lore: '잿빛 변경의 불씨를 품은 지팡이. 한 대 맞히면 옆에도 튄다.' }
  },
  heavy: {
    bargan:  { n: '불목 흉갑', def: 1.2, res: 0.7, hp: 0.8, from: 'bargan', lore: '끓는 고개의 거인이 두르던 쇠판. 두껍고, 아직 따뜻하다.' },
    warden:  { n: '돌지기의 흉갑', def: 1.35, res: 0.3, spd: -0.06, from: 'warden', lore: '정신이 든 돌지기가 벗어 준 돌 흉갑. 무겁고, 잘 안 깨진다.' },
    gate:    { n: '첨탑 문의 빗장', def: 1.25, res: 0.9, from: 'gatekeeper', lore: '검은 첨탑의 문을 잠그던 빗장을 펴서 가슴에 댔다.' },
    roen:    { n: '대공의 문장 갑옷', def: 1.1, res: 1.0, x: { lead: { def: 1.10 } }, from: 'roen', lore: '맨 먼저 무릎을 꿇은 대공의 갑옷. 문장만은 닳지 않았다.' },
    wyrm:    { n: '뼈용 비늘 갑옷', def: 1.2, res: 1.2, from: 'bonewyrm', lore: '뼈 사막의 용에게 남아 있던 마지막 비늘들.' },
    mirror:  { n: '되받는 방패갑', def: 1.15, res: 0.6, x: { eng: { reflect: 0.25 } }, from: 'zone:stone', lore: '돌마루 석공들이 바위를 깎아 덧댄 갑옷. 친 만큼 되돌아온다.' },
    wall:    { n: '마지막 성벽', def: 1.2, res: 0.8, x: { eng: { lone: 0.3 } }, from: 'zone:ash', lore: '무너진 변경 성채에서 끝까지 서 있던 한 사람의 갑옷.' },
    elder:   { n: '맏이의 갑옷', def: 1.15, res: 0.7, hp: 0.4, x: { pair: 'bro' }, from: 'zone:end', lore: '먼저 떠난 형이 남긴 갑옷. 동생이 곁에 서면 더 단단해진다.' },
    heal:    { n: '아무는 비늘 갑옷', def: 1.1, res: 0.6, x: { eng: { hpRegen: 0.008 } }, from: 'zone:end', lore: '끝의 땅 용암 도마뱀의 비늘로 엮었다. 긁힌 자리가 금세 아문다.' }
  },
  light: {
    shewolf: { n: '늑대골 털가죽', def: 0.9, res: 0.5, spd: 0.08, from: 'shewolf', lore: '늑대골 초소 바닥에 깔려 있던 잿빛 가죽. 입으면 발이 가벼워진다.' },
    tomb:    { n: '석수의 갈기', def: 1.25, res: 1.0, spd: -0.03, from: 'tombbeast', lore: '왕의 무덤을 지키던 돌짐승의 갈기. 가죽옷인데 돌처럼 단단하다.' },
    basil:   { n: '바실의 비늘옷', def: 0.85, res: 0.8, spd: 0.10, from: 'basil', lore: '독니 바실이 벗어 둔 허물. 독은 빠지고 날램만 남았다.' },
    swarm:   { n: '파리 떼 왕의 겉날개', def: 0.85, res: 0.7, spd: 0.10, x: { mvm: 0.15 }, from: 'swarm', lore: '썩은 평원의 왕이 남긴 겉날개. 날지는 못해도 걸음이 바람 같다.' },
    young:   { n: '막내의 가죽옷', def: 0.95, res: 0.6, spd: 0.05, x: { pair: 'bro' }, from: 'zone:ash', lore: '형을 따라나선 막내가 입던 가죽옷. 형의 갑옷과 같은 문장이 찍혀 있다.' },
    trick:   { n: '요술쟁이 망토', def: 0.85, res: 0.7, x: { eng: { eva: 0.15 } }, from: 'zone:windy', lore: '바람재 장터의 요술쟁이가 두르던 망토. 눈앞에서 사라지는 재주가 남아 있다.' },
    rage:    { n: '광전사의 가죽', def: 0.9, res: 0.4, x: { eng: { rage: 0.5 } }, from: 'zone:coast', lore: '해적들이 겁을 주려 입던 가죽. 다칠수록 눈빛이 바뀐다.' },
    post:    { n: '파발꾼 가죽옷', def: 0.85, res: 0.5, spd: 0.04, x: { mvm: 0.25, eng: { killGauge: 20 } }, from: 'zone:dawn', lore: '새벽 들판을 달리던 파발꾼의 옷. 멈춰 서는 법을 잊었다.' }
  },
  robe: {
    nuri:    { n: '달못 물빛 로브', def: 0.8, res: 1.35, spd: 0.04, from: 'nuri', lore: '달못의 정령이 맑아지며 벗어 둔 물빛. 마법이 수면처럼 흩어진다.' },
    belmar:  { n: '깃대지기의 로브', def: 0.7, res: 1.1, mp: 0.45, hp: -1.5, from: 'belmar', lore: '어스름과 계약한 자의 옷. 마나는 넘치고, 목숨은 조금 빌려 간다.' },
    ilva:    { n: '서리 궁의 휘장', def: 0.9, res: 1.3, x: { skill: 'slow' }, from: 'ilva', lore: '서리 마녀의 궁에 걸려 있던 휘장. 스치는 것마다 느려진다.' },
    glacia:  { n: '글라시아의 서리 비늘', def: 1.0, res: 1.5, from: 'glacia', lore: '얼어붙은 성의 용이 부서지며 남긴 비늘. 마법이 미끄러진다.' },
    ghost:   { n: '안개 수렁의 수의', def: 0.6, res: 1.3, spd: 0.05, from: 'zone:mire', lore: '망령이 두르고 떠돌던 천. 가볍고, 조금 춥다.' },
    star:    { n: '별빛 로브', def: 0.75, res: 1.2, x: { eng: { ultUp: 0.5 } }, from: 'zone:spire', lore: '검은 첨탑 꼭대기에서 별을 받아 짠 로브. 입은 이가 부르면 별이 먼저 대답한다.' },
    clear:   { n: '맑은 샘 로브', def: 0.8, res: 1.25, x: { eng: { immune: { poison: 1, slow: 1 } } }, from: 'zone:desert', lore: '마른 샘이 다시 솟던 날 길어 올린 물로 빨았다. 독도 묶임도 씻겨 나간다.' },
    well:    { n: '샘솟는 로브', def: 0.75, res: 1.1, mp: 0.3, x: { eng: { mpRegen: 0.008 } }, from: 'zone:isle', lore: '가온 섬 우물지기의 로브. 마를 날이 없다.' }
  }
};
DS.UNIQ = UNIQ;
// 2.1.0 에 더한 전설 (시험 t46 이 엔진에서 효과를 하나씩 확인한다)
DS.UNIQ_NEW = ['sword.oath', 'sword.thirst', 'sword.blood', 'sword.first', 'sword.sun', 'lance.moon', 'lance.finish', 'lance.wyrm', 'bow.pierce', 'bow.gale', 'bow.final',
  'wand.scale', 'wand.mercy', 'wand.bell', 'staff.echo', 'staff.lamp', 'staff.spark', 'heavy.mirror', 'heavy.wall', 'heavy.elder', 'heavy.heal',
  'light.young', 'light.trick', 'light.rage', 'light.post', 'robe.star', 'robe.clear', 'robe.well'];
var PAIR_NAME = { sun: ['해의 칼', '달의 창'], bro: ['맏이의 갑옷', '막내의 가죽옷'] };
// 엔진 fx 칸 → 설명 글 (전설의 대표 효과 줄)
var ENG_TXT = {
  killDrain: function (v) { return '적을 쓰러뜨릴 때마다 흡혈 +' + pm(v) + '% (그 싸움 동안, 6번까지)'; },
  pierce: function (v) { return '기본 공격이 맞힌 적 뒤(두 칸 안)의 적도 꿰뚫는다 (' + pct(v) + '% 위력)'; },
  echo: function (v) { return '기술이 ' + pct(v) + '% 확률로 한 번 더 나간다 (필살기 제외)'; },
  lone: function (v) { return '2칸 안에 다른 가주가 없거나 홀로 남으면 받는 피해 −' + pct(v) + '%, 주는 피해 +' + pct(v) + '%'; },
  curse: function (v) { return '저주: 싸우는 동안 초마다 최대 HP의 ' + pm(v) + '%를 잃는다 (30% 아래로는 깎이지 않는다)'; },
  ultUp: function (v) { return '필살 게이지가 ' + pct(v) + '% 빨리 찬다 (필살기가 깨어난 사람)'; },
  exec: function (v) { return 'HP 30% 아래인 적에게 주는 피해 +' + pct(v) + '%'; },
  rage: function (v) { return '잃은 HP만큼 주는 피해가 는다 (빈사일 때 +' + pct(v) + '%)'; },
  hpRegen: function (v) { return '싸우는 동안 초마다 최대 HP의 ' + pm(v) + '% 회복'; },
  splash: function (v) { return '기본 공격이 맞힌 적 둘레의 적에게도 ' + pct(v) + '% 피해'; },
  goldUp: function (v) { return '쓰러뜨린 적의 골드 +' + pct(v) + '%'; },
  healUp: function (v) { return '치유 기술의 회복량 +' + pct(v) + '%'; },
  critX: function (v) { return '치명타 피해 +' + pct(v) + '% (기본 150%)'; },
  killHp: function (v) { return '적을 쓰러뜨리면 HP ' + pct(v) + '% 회복'; },
  killGauge: function (v) { return '적을 쓰러뜨리면 게이지 +' + Math.round(v); },
  reflect: function (v) { return '받은 피해의 ' + pct(v) + '%를 때린 적에게 돌려준다'; },
  eva: function (v) { return '적의 기본 공격을 ' + pct(v) + '% 확률로 피한다'; },
  atkTick: function (v) { return '기본 공격에 드는 틱 −' + pct(1 - v) + '%'; },
  mpRegen: function (v) { return '싸우는 동안 마나가 초마다 최대치의 ' + pm(v) + '% 더 찬다'; },
  immune: function (v) { return Object.keys(v).map(function (q) { return (DS.STATUS[q] || { name: q }).name; }).join(', ') + '에 걸리지 않는다'; },
  slay: function (v) { var ks = Object.keys(v); return (ks.indexOf('undead') >= 0 && ks.indexOf('demon') >= 0 ? '망자, 악마' : ks.join(', ')) + '에게 주는 피해 +' + pct(v[ks[0]]) + '%'; },
  bossDmg: function (v) { return '보스에게 주는 피해 +' + pct(v) + '%'; },
  teleRes: function (v) { return '예고된(붉은 칸) 기술로 받는 피해 −' + pct(v) + '%'; },
  stRes: function (v) { return '중독, 둔화에 걸리는 시간 −' + pct(v) + '%'; }
};
// 장비 등급 이름표 (용병 등급 DS.GRADES 와 따로). 보통은 꼬리표를 달지 않는다
DS.GEAR_GRADE = [null, { name: '보통', tag: '', col: '#efe6d0' }, null, null, { name: '유니크', tag: '유니크', col: '#b181e6' }, { name: '전설', tag: '전설', col: '#f0b64a' }];
DS.GEAR_UQ = 4; DS.GEAR_LEG = 5;
DS.gearTag = function (g) { var G = g && DS.GEAR_GRADE[g.grade]; return G ? G.tag : ''; };
DS.gearCol = function (gr) { var G = DS.GEAR_GRADE[gr >= 5 ? 5 : gr >= 2 ? 4 : 1]; return G.col; };
// 팔 때: 기본형 정가의 15% × k (정가의 「단」 자리는 지금 부대 레벨의 눈금). 유니크는 굴림만큼(옵션 하나 낮은 눈금 ≈ 1.4 · 둘 다 9 에 높은 굴림 ≈ 3.2), 전설은 3
var LEAD_TXT = { at: '공격', def: '방어', spd: '행동 회복', hp: 'HP', res: '마방' };

// ───────── DS.gear 감싸기 ─────────
var gear0 = DS.gear, cache = Object.create(null), cacheN = 0;
function refTe() { return DS.gearTe(DS.gearRefL()); }
// r37: 보통 장비는 가게가 없어 「값」은 되팔 때만 — 정가의 10%
function plain(g) {
  g.grade = 1; g.affix = []; g.special = []; g.lore = ''; g.uniq = false; g.fx = null;
  Object.defineProperty(g, 'sell', { enumerable: true, configurable: true, get: function () { return Math.max(1, Math.round(g.price * (DS.DROP && DS.DROP.plain ? DS.DROP.plain.sell : 0.1))); } });
  return g;
}
function uniqOf(id) {
  var a = id.indexOf('.'); if (a < 1) return null;
  var c = id.slice(0, a), l = id.slice(a + 1).split(/[~+]/)[0];
  return own(UNIQ, c) && own(UNIQ[c], l) ? UNIQ[c][l] : null;
}
function fxAdd(f, k, v) { f[k] = (f[k] || 0) + v; }
function engAdd(f, kind, v) {
  var e = f.eng = f.eng || {};
  if (kind === 'slay') { e.slay = e.slay || {}; fxAdd(e.slay, 'undead', v); fxAdd(e.slay, 'demon', v); }
  else if (kind === 'slow' || kind === 'poison') { e.hitSt = e.hitSt || {}; fxAdd(e.hitSt, kind, v); }
  else if (kind === 'atkTick') e.atkTick = (e.atkTick || 1) * (1 - v);
  else fxAdd(e, kind, v);
}
function engText(e) {
  var out = [];
  for (var k in e) if (own(e, k) && ENG_TXT[k]) out.push(ENG_TXT[k](e[k]));
  return out;
}
function build(id) {
  var q = id.split('+'), en = 0;
  if (q.length > 2) return null;
  if (q.length === 2) { if (!DS.ENH_RE.test(q[1])) return null; en = +q[1]; }
  var ax = q[0].split('~'); if (ax.length > 3) return null;
  var p = ax[0].split('.'); if (p.length !== 2 || !own(DS.GEAR_CAT, p[0])) return null;
  var C = DS.GEAR_CAT[p[0]], U = own(UNIQ, p[0]) && own(UNIQ[p[0]], p[1]) ? UNIQ[p[0]][p[1]] : null, aD = DS.aDef(refTe()), g, k, i;
  if (!C || !C.slot || (en && ((C.slot !== 'w' && C.slot !== 'a') || en > DS.ENH.max))) return null;
  var X = (U && U.x) || {}, ex = X.enx || 1;
  if (U) {
    var wE = C.slot === 'w' ? en : 0, aE = C.slot === 'a' ? en : 0;
    g = { cat: p[0], line: p[1], slot: C.slot, kind: C.name, note: '', enh: en, pk: 1,
      k: { pow: U.pow || 0, def: U.def || 0, res: U.res || 0, hp: (C.slot === 'a' ? 2 : 0) + (U.hp || 0) },
      amp: DS.ENH.amp * wE * ex, ad: DS.ENH.ad * aE * ex, crit: (U.crit || 0) + DS.ENH.crit * wE * ex, spd: U.spd || 0, mp: U.mp || 0 };
  } else {
    var b = gear0(ax[0] + (en ? '+' + en : '')); if (!b) return null;
    g = { cat: b.cat, line: b.line, slot: b.slot, kind: b.kind, note: b.note, enh: b.enh, pk: b.pk, k: { pow: b.k.pow, def: b.k.def, res: b.k.res, hp: b.k.hp }, amp: b.amp, ad: b.ad, crit: b.crit, spd: b.spd, mp: b.mp };
  }
  g.id = id; g.base = q[0]; g.core = ax[0]; g.uniq = !!U; g.lore = U ? U.lore : ''; g.affix = []; g.special = []; g.from = U ? U.from : '';
  var f = {}, list = [], hi = false, big = false;
  if (U && U.x) {
    for (k in X) {
      if (k === 'lead') { f.lead = {}; for (i in X.lead) { f.lead[i] = X.lead[i]; g.special.push(LEAD_TXT[i] + ' +' + pct(X.lead[i] - 1) + '%'); } }
      else if (k === 'skill') { f.skills = [X.skill]; g.special.push('기술 「' + DS.SKILLS[X.skill].name + '」을 쓸 수 있다'); }
      else if (k === 'drain') { f.drain = X.drain; g.special.push('준 피해의 ' + pct(X.drain) + '%만큼 HP 회복'); }
      else if (k === 'hpm') { f.hpm = X.hpm; g.special.push('최대 HP ' + (X.hpm < 1 ? '−' : '+') + Math.abs(pct(X.hpm - 1)) + '%'); }
      else if (k === 'rng') { f.rng = X.rng; g.special.push('사거리 +' + X.rng); }
      else if (k === 'mvm') { f.mvm = 1 - X.mvm; g.special.push('이동에 드는 틱 −' + pct(X.mvm) + '%'); }
      else if (k === 'dtype') { f.dtype = X.dtype; g.special.push('기본 공격이 ' + (X.dtype === 'holy' ? '신성' : X.dtype) + ' 속성이 된다'); }
      else if (k === 'eng') { f.eng = DS.fxMerge(f.eng, X.eng); g.special = g.special.concat(engText(X.eng)); }
      else if (k === 'enx') g.special.push('강화 효과가 ' + X.enx + '배 (단계마다 공격, 마공 +' + pct(DS.ENH.amp * X.enx) + '%, 치명타 +' + pct(DS.ENH.crit * X.enx) + '%)');
      else if (k === 'nobrk') { g.nobrk = true; g.special.push('닳지 않는다: 강화에 실패해도 부서지지 않는다'); }
      else if (k === 'pair') {
        f.eng = DS.fxMerge(f.eng, { pair: X.pair + '.' + p[0] });
        var pn = PAIR_NAME[X.pair] || [], other = pn.filter(function (n) { return n !== U.n; })[0] || '짝';
        var oc = other.charCodeAt(other.length - 1), ojo = oc >= 0xAC00 && oc <= 0xD7A3 && (oc - 0xAC00) % 28 ? '을' : '를';      // 받침에 맞춘 조사
        g.special.push('짝 장비: 「' + other + '」' + ojo + ' 든 가주와 함께 싸우면 둘 다 주는 피해 +15%, 받는 피해 −10%');
        g.pair = X.pair;
      }
    }
  }
  for (i = 1; i < ax.length; i++) {
    var m = /^([a-z]+)([1-9])?$/.exec(ax[i]), A = m && own(AFFIX, m[1]) ? AFFIX[m[1]] : null;
    if (!A || !!A[3] !== !!m[2]) return null;                                  // 모르는 옵션, 눈금이 어긋난 옵션
    if (list.length && (axPre(A) || !list[0].pre)) return null;                // 접두 → 접미 순서, 각각 하나
    var roll = m[2] ? +m[2] : 0, v = axVal(A, roll), e = A[4];
    list.push({ pre: axPre(A), A: A }); if (A[6]) hi = true; if (roll >= 7) big = true;
    g.affix.push({ key: m[1], name: A[1], desc: axDesc(A, v, aD), pre: axPre(A), roll: roll, v: v });
    var mul = function (key) { return e[key] === 1 ? v : e[key] < 0 ? e[key] : v * e[key]; };
    if (e.powp) g.k.pow = g.k.pow * (1 + mul('powp'));
    if (e.amp) g.amp += mul('amp'); if (e.crit) g.crit += mul('crit'); if (e.spd) g.spd += mul('spd'); if (e.mp) g.mp += mul('mp');
    if (e.defp) g.k.def += mul('defp'); if (e.resp) g.k.res += mul('resp'); if (e.hpp) g.k.hp += mul('hpp');
    if (e.drain) fxAdd(f, 'drain', v);
    if (e.hpm) f.hpm = (f.hpm || 1) * (e.hpm === 1 ? 1 + v : e.hpm);
    if (e.rng) fxAdd(f, 'rng', 1);
    if (e.mvm) f.mvm = (f.mvm || 1) * (1 - v);
    if (e.trait) f.trait = e.trait; if (e.passive) f.passive = e.passive; if (e.mt) f.mt = e.mt; if (e.dtype) f.dtype = e.dtype;
    if (e.tags) f.tags = (f.tags || []).concat([e.tags]);
    if (e.skill) f.skills = (f.skills || []).concat([e.skill]);
    if (e.lead) { f.lead = f.lead || {}; f.lead[e.lead] = (f.lead[e.lead] || 1) * (1 + v); }
    if (e.eng) engAdd(f, e.eng, v);
  }
  // {n} 이 든 옵션 글(방어 +n 등)은 지금 부대 레벨로 다시 읽는다
  g.affix.forEach(function (a) { var A = AFFIX[a.key]; if (A[5].indexOf('{n}') >= 0) Object.defineProperty(a, 'desc', { enumerable: true, configurable: true, get: function () { return axDesc(A, a.v, DS.aDef(refTe())); } }); });
  var any = false; for (k in f) any = true;
  g.fx = any ? f : null;
  g.grade = U ? 5 : list.length ? 4 : 1;
  g.hi = !U && (hi || big);      // 높은 굴림 (옛 영웅) — 등급 이름으로 드러내지 않는다. 얻을 때 잠긴 채로 들어온다
  var pre = g.affix.filter(function (a) { return a.pre; })[0], suf = g.affix.filter(function (a) { return !a.pre; })[0];
  var bare = U ? U.n : gear0(ax[0]).name;
  g.short = (pre ? pre.name + ' ' : '') + bare + (en ? ' +' + en : '');      // 이름 줄에 쓰는 짧은 이름 (접미는 둘째 줄로)
  g.name = g.short + (suf ? ' 〈' + suf.name + '〉' : '');
  DS.gearLive(g);
  // 값: 유니크·전설은 상점에 없으니 "값"은 되팔 때만 쓰인다 (ui 의 price/2 와 맞물린다). 정가의 단 자리는 지금 부대 레벨의 눈금
  if (g.grade >= 4) {
    var gk = U ? 3 : 1.2 + (g.hi ? 0.4 : 0); g.affix.forEach(function (a) { gk += a.roll ? 0.08 * a.roll : 0.5; });
    Object.defineProperty(g, 'sell', { enumerable: true, configurable: true, get: function () { return Math.round(DS.gearPrice(refTe()) * 0.15 * gk * (1 + en * 0.5)); } });
    Object.defineProperty(g, 'price', { enumerable: true, configurable: true, get: function () { return g.sell * 2; } });
  } else plain(g);
  return g;
}
DS.gear = function (id) {
  if (typeof id !== 'string' || (id.indexOf('~') < 0 && !uniqOf(id))) { var g0 = gear0(id); if (g0 && g0.grade === undefined) plain(g0); return g0; }
  if (cache[id] !== undefined) return cache[id];
  if (cacheN > 4000) { cache = Object.create(null); cacheN = 0; }
  cacheN++;
  return (cache[id] = build(id));
};
// 깨진 옵션 식별자를 버리지 않고 살린다: 읽히는 데까지만 남긴 식별자를 돌려준다 (기본형까지 벗겨도 안 읽히면 null). fixSave 가 부르면 된다.
// 2.1.0: 옛 단이 든 식별자('sword.A.7~keen6+2' · 'sword.grok.2')는 단을 빼고 읽는다
DS.gearRepair = function (id) {
  if (DS.gear(id)) return id;
  var q = String(id || '').split('+'), ax = q[0].split('~'), en = q.length === 2 && DS.ENH_RE.test(q[1]) ? '+' + q[1] : '', i, c;
  var p0 = ax[0].split('.'); if (p0.length === 3 && /^(?:[1-9]|10)$/.test(p0[2])) ax[0] = p0[0] + '.' + p0[1];
  var keep = [ax[0]];
  for (i = 1; i < ax.length && keep.length < 3; i++) { c = keep.concat([ax[i]]).join('~'); if (DS.gear(c)) keep.push(ax[i]); }
  c = keep.join('~');
  return DS.gear(c + en) ? c + en : DS.gear(c) ? c : null;
};
DS.gearGrade = function (id) { var g = DS.gear(id); return g ? g.grade : 0; };

// 효과 환산 점수: "기본형(A) ≈ 그 레벨 눈금 × 10" 을 지키면서 옵션·강화·특수 효과를 실제 효과만큼 얹는다 (autoEquip·비교용)
//   ch 를 주면 그 사람의 레벨·병과로 잰다 (맞지 않는 계열의 −10% 가 든다). 없으면 지금 부대 레벨·깎임 없음
DS.gearScore = function (g, ch) {
  if (!g) return -1;
  var x = DS.gearAt(g, ch ? ch.L : DS.gearRefL(), ch && ch.cls, ch && ch.gt), s, f = g.fx, e;
  if (g.slot === 'w') s = (x.pow / 3.2) * 10 * (1 + (x.amp || 0) * 3) * (1 + (x.crit || 0) * 1.5) * (1 + (x.spd || 0) * 3) + (x.mp || 0) * 12 + (x.def || 0) * 0.5;
  else s = ((x.def || 0) + (x.res || 0) * 0.6 + (x.hp || 0) * 0.2) / 3.6 * 10 * (1 + (x.ad || 0) * 3) * (1 + (x.spd || 0) * 3) + (x.mp || 0) * 12;      // ad: 방어구 강화 (몸 전체의 방어·마방에 곱해지므로 무기 amp 처럼 무겁게)
  if (f) {
    s += (f.drain || 0) * 60 + (f.rng ? 6 : 0) + (f.trait ? 5 : 0) + (f.passive ? 3 : 0) + (f.skills ? 5 : 0) + (f.mt ? 3 : 0) + ((f.hpm || 1) - 1) * 60 + (1 - (f.mvm || 1)) * 20 + (f.lead ? 4 : 0);
    if ((e = f.eng)) s += (e.slay ? e.slay.undead * 16 : 0) + (e.hitSt ? ((e.hitSt.slow || 0) + (e.hitSt.poison || 0)) * 16 : 0) + (e.reflect || 0) * 20 + (e.killGauge || 0) * 0.15 + (e.teleRes || 0) * 20 + (e.bossDmg || 0) * 40 + (e.stRes || 0) * 6 + (e.mpRegen || 0) * 300
      + (e.killDrain || 0) * 250 + (e.pierce || 0) * 10 + (e.splash || 0) * 12 + (e.echo || 0) * 40 + (e.lone || 0) * 12 + (e.exec || 0) * 8 + (e.rage || 0) * 10 + (e.critX || 0) * 8 + (e.goldUp || 0) * 6
      + (e.healUp || 0) * 10 + (e.hpRegen || 0) * 600 + (e.killHp || 0) * 60 + (e.eva || 0) * 30 + (e.ultUp || 0) * 8 + (e.atkTick ? (1 - e.atkTick) * 40 : 0) + (e.immune ? 4 : 0) + (e.pair ? 3 : 0) - (e.curse || 0) * 800;
  }
  return Math.round(s * 10) / 10;
};

// ───────── 능력치·전투 사양 감싸기 ─────────
// 지휘관이 입은 두 장비의 특수 효과를 하나로 합친다 (없으면 null)
function gearFx(ch) {
  if (!ch) return null;
  var gs = [DS.gear(ch.w), DS.gear(ch.a)], f = null, i, k, x, e;
  for (i = 0; i < 2; i++) {
    x = gs[i] && gs[i].fx; if (!x) continue;
    f = f || { drain: 0, rng: 0, hpm: 1, mvm: 1 };
    f.drain += x.drain || 0; f.rng += x.rng || 0; f.hpm *= x.hpm || 1; f.mvm *= x.mvm || 1;
    if (x.trait && f.trait !== 'survivor') f.trait = x.trait;
    if (x.trait === 'survivor') f.surv = true;
    if (x.passive) { if (!f.passive) f.passive = x.passive; if (x.passive === 'twin') f.twin = true; }
    if (x.mt && f.mt !== 'fly') f.mt = x.mt;
    if (x.dtype) f.dtype = x.dtype;
    if (x.tags) f.tags = (f.tags || []).concat(x.tags);
    if (x.skills) f.skills = (f.skills || []).concat(x.skills);
    if (x.lead) { f.lead = f.lead || {}; for (k in x.lead) f.lead[k] = (f.lead[k] || 1) * x.lead[k]; }
    if ((e = x.eng)) f.eng = DS.fxMerge(f.eng, e);
  }
  return f;
}
// 엔진이 읽을 fx 칸을 합친다 (INTERFACES 의 "합치는 법" 그대로): 더하기(상한) / 곱하기(하한) / 합집합 / 글(짝 장비 — 먼저 것)
var FX_CAP = { teleRes: 0.6, reflect: 0.4, eva: 0.35, stRes: 0.7, echo: 0.4, lone: 0.5, pierce: 1, splash: 0.8, killDrain: 0.05, hpRegen: 0.02, exec: 1, rage: 1, critX: 1.2, ultUp: 1, healUp: 1, goldUp: 1 };
DS.fxMerge = function (a, b) {
  var o = {}, k, j;
  [a, b].forEach(function (x) {
    if (!x) return;
    for (k in x) {
      if (k === 'hitSt' || k === 'slay') { o[k] = o[k] || {}; for (j in x[k]) o[k][j] = k === 'hitSt' ? Math.min(0.6, (o[k][j] || 0) + x[k][j]) : (o[k][j] || 0) + x[k][j]; }
      else if (k === 'immune') { o.immune = o.immune || {}; for (j in x.immune) o.immune[j] = 1; }
      else if (k === 'atkTick') o.atkTick = Math.max(0.6, (o.atkTick || 1) * x.atkTick);
      else if (k === 'seal') o.seal = o.seal || !!x.seal;
      else if (typeof x[k] === 'string') { if (!o[k]) o[k] = x[k]; }
      else o[k] = FX_CAP[k] ? Math.min(FX_CAP[k], (o[k] || 0) + x[k]) : (o[k] || 0) + x[k];
    }
  });
  return o;
};
(DS.UNIT_KEYS = DS.UNIT_KEYS || []).push('fx', 'passive', 'tags', 'mt', 'mv', 'dtype', 'twin', 'survX');

var cs0 = DS.charStats;
DS.charStats = function (ch) {
  var s = cs0(ch), f = gearFx(ch);
  if (!f) return s;
  s.drain = (s.drain || 0) + f.drain;
  if (f.rng) s.rng[1] += f.rng;
  if (f.hpm !== 1) s.hp = Math.max(1, Math.round(s.hp * f.hpm));
  s.hp = Math.max(1, s.hp);
  s.gearFx = f;
  return s;
};
var cmd0 = DS.cmdSpec;
DS.cmdSpec = function (ch, hero) {
  var u = cmd0(ch, hero), f = gearFx(ch);
  u.passive = u.passive || null; u.trait = u.trait || null; u.twin = false; u.survX = false; u.fx = u.fx || null;      // 장비를 벗었을 때 낡은 값이 유닛에 남지 않게 늘 채운다
  if (!f) return u;
  if (f.trait) u.trait = f.trait;
  u.survX = !!f.surv; u.twin = !!f.twin;      // survX = 구사일생을 지님 (엔진의 u.surv 는 '이번 전투에 이미 씀')
  if (f.passive && !u.passive) u.passive = f.passive;                         // 병과가 타고난 특성(수전 등)이 먼저
  if (f.mt && DS.MT[f.mt] !== undefined && u.mt !== 'fly') u.mt = f.mt;
  if (f.dtype) u.dtype = f.dtype;
  if (f.tags) f.tags.forEach(function (t) { if (u.tags.indexOf(t) < 0) u.tags = u.tags.concat([t]); });
  if (f.skills) f.skills.forEach(function (k) { if (DS.SKILLS[k] && u.skills.indexOf(k) < 0) u.skills = u.skills.concat([k]); });
  if (f.mvm !== 1) u.mv = u.mv * f.mvm;
  if (f.eng) u.fx = DS.fxMerge(u.fx, f.eng);
  var L = f.lead;      // 2.2.0: 옛 「가솔의 ○○ +%」(매듭·고유 장비)는 입은 깃발 유닛 자신에게 걸린다 (가솔이 없다)
  if (L) { if (L.at) { u.atk = Math.round(u.atk * L.at); u.mag = Math.round(u.mag * L.at); } if (L.def) u.def = Math.round(u.def * L.def); if (L.res) u.res = Math.round(u.res * L.res); if (L.spd) u.spd = u.spd * L.spd; if (L.hp) { u.hp = Math.round(u.hp * L.hp); u.mhp = u.hp; } }
  return u;
};
// 따르는 이(가문원): 그 사람이 든 물건이 배율로 얹힌다 (2.2.0: 주인의 매듭은 주인 자신에게)
var ms0 = DS.mercSpec;
DS.mercSpec = function (ch, m) {
  var u = ms0(ch, m), L = {}, I = (m && m.it && own(MGEAR, m.it) && MGEAR[m.it]) || {};
  var at = (L.at || 1) * (I.at || 1), df = (L.def || 1) * (I.def || 1), rs = (L.res || 1) * (I.res || 1), sp = (L.spd || 1) * (I.spd || 1), hp = (L.hp || 1) * (I.hp || 1);
  if (at !== 1) { u.atk = Math.round(u.atk * at); u.mag = Math.round(u.mag * at); }
  if (df !== 1) u.def = Math.round(u.def * df);
  if (rs !== 1) u.res = Math.round(u.res * rs);
  if (sp !== 1) u.spd = u.spd * sp;
  if (hp !== 1) { u.hp = Math.round(u.hp * hp); u.mhp = u.hp; }
  return u;
};

// ───────── 소모품 ─────────
// sk = 아이템 기술 (DS.SKILLS.i_키 로 들어간다 — 엔진의 i_ 처리는 이미 일반적이다). ctl = 전투 밖에서 컨트롤러가 처리 (DS.useFieldItem)
// max 소지 한도 · town 파는 마을(없으면 드랍 전용) · zone 그 지역의 적이 잘 떨어뜨린다
var NEW_ITEMS = {
  smoke:   { name: '연막 주머니', price: 120, max: 5, town: 'haemil', zone: 'dawn', desc: '십자 범위의 적을 둔화시키고 게이지를 깎는다.',
             sk: { tick: 25, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'dark', eff: [{ t: 'status', s: 'slow', dur: 12 }, { t: 'gauge', v: -40 }] } },
  salve:   { name: '물비늘 연고', price: 90, max: 5, town: 'haemil', zone: 'coast', desc: '아군 하나의 중독, 둔화, 약화를 푼다.',
             sk: { tick: 25, rng: [0, 2], tg: 'ally', fx: 'heal', eff: [{ t: 'cleanse' }] } },
  horn:    { name: '바람재 뿔피리', price: 200, max: 3, town: 'dodam', zone: 'windy', desc: '모든 아군의 공격 +20% (20초), 게이지 +30.',
             sk: { tick: 25, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold', eff: [{ t: 'buff', s: 'atk', p: 20, dur: 20 }, { t: 'gauge', v: 30 }] } },
  feather: { name: '하피 깃 부채', price: 250, max: 3, town: 'dodam', zone: 'windy', desc: '아군 하나의 행동 소모 −35% (20초).',
             sk: { tick: 25, rng: [0, 3], tg: 'ally', fx: 'buffGold', eff: [{ t: 'buff', s: 'quick', p: 35, dur: 20 }] } },
  ward:    { name: '돌마루 부적', price: 150, max: 5, town: 'dodam', zone: 'stone', desc: '아군 하나의 방어 +30% (25초). 누구나 쓸 수 있다.',
             sk: { tick: 25, rng: [0, 3], tg: 'ally', fx: 'buffBlue', eff: [{ t: 'buff', s: 'def', p: 30, dur: 25 }] } },
  recall:  { name: '귀환 두루마리', price: 300, max: 2, town: 'dodam', zone: 'stone', ctl: 'recall', desc: '전투 중이 아닐 때, 마지막에 들른 마을로 돌아간다.' },
  venom:   { name: '전갈 독 단지', price: 180, max: 5, town: 'gaon', zone: 'desert', desc: '십자 범위에 독. 12초 동안 2초마다 최대 HP의 4%.',
             sk: { tick: 25, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'poison', eff: [{ t: 'status', s: 'poison', dur: 12, p: 4 }] } },
  bell:    { name: '해골 방울', price: 400, max: 2, town: 'gaon', zone: 'desert', desc: '45초 동안 싸워 줄 해골 병사를 부른다.',
             sk: { tick: 30, tg: 'self', fx: 'dark', ai: 'summon', cap: 2, eff: [{ t: 'summon', type: 'm_skeleton', n: 1, dur: 45 }] } },
  holyw:   { name: '사당 성수', price: 220, max: 5, town: 'gaon', zone: 'mire', desc: '십자 범위에 신성 피해. 망자, 악마에게 1.5배.',
             sk: { tick: 25, rng: [1, 4], tg: 'tile', area: 'r1', fx: 'holy', eff: [{ t: 'dmg', m: 1.1, type: 'holy', flat: true }] } },
  camp:    { name: '모닥불 꾸러미', price: 250, max: 2, town: 'gaon', zone: 'coast', ctl: 'camp', desc: '전투 중이 아닐 때, 부대 전체의 HP, 마나를 30% 회복.' },
  drum:    { name: '용병대의 북', price: 350, max: 2, town: 'gaon', zone: 'spire', desc: '모든 아군의 공격, 방어 +15% (20초).',      // 2.2.0: 가솔 전용 → 모든 아군, 세기 절반
             sk: { tick: 30, tg: 'self', area: 'all', side: 'ally', fx: 'buffGold', eff: [{ t: 'buff', s: 'atk', p: 15, dur: 20 }, { t: 'buff', s: 'def', p: 15, dur: 20 }] } },
  frostj:  { name: '서리 단지', price: 300, max: 3, town: 'gaon', zone: 'ash', desc: '2칸 반경에 서리. 약한 피해와 둔화.',
             sk: { tick: 25, rng: [1, 4], tg: 'tile', area: 'r2', fx: 'water', eff: [{ t: 'dmg', m: 0.6, type: 'magic', flat: true }, { t: 'status', s: 'slow', dur: 10 }] } },
  sc_bolt: { name: '번개 두루마리', price: 500, max: 2, zone: 'spire', desc: '한 번 읽으면 사라진다. 적 하나에 큰 뇌격.',
             sk: { tick: 30, rng: [1, 4], tg: 'enemy', fx: 'thunder', eff: [{ t: 'dmg', m: 2.2, type: 'magic', flat: true }] } },
  sc_star: { name: '별똥 두루마리', price: 900, max: 1, zone: 'end', desc: '한 번 읽으면 사라진다. 2칸 반경에 운석.',
             sk: { tick: 40, rng: [2, 5], tg: 'tile', area: 'r2', fx: 'meteor', eff: [{ t: 'dmg', m: 1.8, type: 'magic', flat: true }] } }
};
// 사람에게 들려 주는 물건: save.items 에 수량, 사람 줄의 m.it 에 키. 쓰러지면 함께 잃는다. 가문원은 mercSpec, 가주는 banner.js 의 cmdSpec 배율에 곱한다 (2.2.0)
var MGEAR = {
  mg_whet:    { name: '숫돌', price: 600, max: 9, town: 'dodam', at: 1.08, desc: '사람에게 장착한다. 공격 +8%.' },
  mg_buckler: { name: '덧방패', price: 600, max: 9, town: 'dodam', def: 1.12, desc: '사람에게 장착한다. 방어 +12%.' },
  mg_ration:  { name: '마른 고기 자루', price: 600, max: 9, town: 'dodam', hp: 1.12, desc: '사람에게 장착한다. HP +12%.' },
  mg_boots:   { name: '가벼운 장화', price: 800, max: 9, town: 'gaon', spd: 1.06, desc: '사람에게 장착한다. 행동 회복 +6%.' },
  mg_charm:   { name: '문장 조각 부적', price: 800, max: 9, town: 'gaon', res: 1.25, desc: '사람에게 장착한다. 마방 +25%.' },
  mg_plume:   { name: '붉은 깃 장식', price: 1200, max: 9, town: 'gaon', at: 1.05, def: 1.05, hp: 1.05, desc: '사람에게 장착한다. 공격, 방어, HP +5%.' }
};
DS.MGEAR = MGEAR;
// r15: 소모품은 회복 셋(약초·마나초·기운초)만 남긴다. 위의 물건들과 폭탄은 「없어진 물건」 — 표에 싣지 않고, 저장에 남은 것은 save.js fixSave 가 값만큼 골드로 바꾼다.
var BASE_ITEMS = ['herb', 'mana', 'endo'];
DS.GONE_ITEMS = { bomb: { name: '폭탄', price: 150 } };
(function () {
  var k;
  for (k in NEW_ITEMS) DS.GONE_ITEMS[k] = { name: NEW_ITEMS[k].name, price: NEW_ITEMS[k].price };
  for (k in MGEAR) DS.ITEMS[k] = { name: MGEAR[k].name, price: MGEAR[k].price, desc: MGEAR[k].desc, max: MGEAR[k].max, town: null, merc: true };      // r37: 잡화점은 소모품 셋만 — 용병 물건도 드랍으로만
  // 2.1.0 강화 보호 부적: 대장간에서 강화할 때 하나 쓰면 실패해도 장비가 부서지지 않는다 (meta.js DS.enhance 의 ref.prot). 싸움에는 쓰지 않는다
  //   얻는 곳: 가온 대장간 진열(옛 「귀한 물건」 자리) · 깃술 조각 보상 · 위업 가호. 값은 시나리오를 깰수록 오른다(DS.protPrice)
  DS.ITEMS.prot = { name: '강화 보호 부적', price: 3000, desc: '강화에 실패해도 장비가 부서지지 않는다. 한 번 쓰면 사라진다.', max: 20, town: null, forge: true };
})();
DS.protPrice = function (save) { var n = save && save.cleared ? Object.keys(save.cleared).length : 0; return Math.round((3000 + 400 * n) / 100) * 100; };
DS.buyProt = function (save) { var c = DS.protPrice(save); if (!save || save.gold < c || (save.items.prot || 0) >= DS.itemMax('prot')) return false; save.gold -= c; save.items.prot = (save.items.prot || 0) + 1; return true; };
DS.itemMax = function (k) { var it = DS.ITEMS[k]; return it && it.max ? it.max : Infinity; };
// 화면에 보일 소모품 키. where 없음 = 전투 막대(가진 것만, 기본 넷은 늘) · 'bag' = 가방(용병 물건 포함) · 마을 키 = 그 마을 잡화점
DS.itemKeys = function (save, where) {
  var out = BASE_ITEMS.slice(), k, it, has;
  for (k in DS.ITEMS) {
    it = DS.ITEMS[k]; if (out.indexOf(k) >= 0 || !own(DS.ITEMS, k)) continue;
    has = save && save.items && save.items[k] > 0;
    if (where && where !== 'bag') { if (it.town === where) out.push(k); }
    else if (where === 'bag') { if (has) out.push(k); }
    else if (has && !it.merc && !it.forge) out.push(k);      // 보호 부적은 대장간에서만
  }
  return out;
};
// 소지 한도까지만 넣는다. 넣은 수를 돌려준다.
DS.giveItem = function (save, k, n) {
  var have = save.items[k] || 0, add = Math.max(0, Math.min(n, DS.itemMax(k) - have));
  if (add) save.items[k] = have + add;
  return add;
};
// 귀환 두루마리·모닥불 꾸러미: 전투 밖에서만. 돌려주는 값 '' = 썼다, 글 = 못 쓴 까닭 (조작 쪽이 토스트로 보여 준다)
DS.useFieldItem = function (key) {
  var G = DS.G, s = G && G.save, it = DS.ITEMS[key];
  if (!s || !it || !it.ctl || !(s.items[key] > 0)) return (it ? it.name : '물건') + '이(가) 없다';
  if (G.scn || (G.sim && G.sim.combat)) return '싸우는 중에는 쓸 수 없다';
  if (key === 'recall') {
    if (G.zone && G.zone.id === s.town) return '이미 마을이다';
    s.items[key]--; DS.enterZone(s.town, null, null);
  } else if (key === 'camp') {
    var hurt = false;
    G.sim.units.forEach(function (u) { if (u.side === 'ally' && !u.dead && (u.hp < u.mhp || u.mp < u.mmp)) hurt = true; });
    if (!hurt) return '모두 멀쩡하다';
    s.items[key]--;
    G.sim.units.forEach(function (u) { if (u.side !== 'ally' || u.dead) return; u.hp = Math.min(u.mhp, Math.round(u.hp + u.mhp * 0.3)); if (u.mmp) u.mp = Math.min(u.mmp, Math.round(u.mp + u.mmp * 0.3)); });
  }
  if (DS.ui && DS.ui.persist) DS.ui.persist();
  return '';
};
// 용병에게 물건을 들려 준다 (key 가 없으면 거둔다). 들고 있던 것은 가방으로 돌아온다.
DS.giveMercItem = function (save, mercId, key) {
  var m = save.mercs.filter(function (x) { return x.id === mercId; })[0]; if (!m) return false;
  if (key && (!own(MGEAR, key) || !(save.items[key] > 0))) return false;
  if (m.it && own(MGEAR, m.it)) save.items[m.it] = (save.items[m.it] || 0) + 1;
  if (key) { save.items[key]--; m.it = key; } else delete m.it;
  return true;
};

// ───────── 드랍 ─────────
DS.DROP = {
  mul: 1,                      // 드랍 전체 배율 — 통합 때 캠페인으로 재서 맞춘다 (0 이면 끔)
  minL: -8,                    // 적 레벨 >= 부대 평균 레벨 - 8 일 때만 떨어진다
  mob: { gear: 0.0025, item: 0.04 },            // 2.1.1: 유니크는 처치 400번에 한 점쯤 (2.1.0 0.005)
  big: { gear: 0.004, item: 0.06 },             // 덩치 큰 적 (2.1.0 0.008)
  boss: [0.1, 0.05],                            // 2.1.1: 시나리오 승리의 유니크 한 점 — 첫 격파 10% · 다시 깨면 5% (2.1.0 늘 70%)
  leg: { mob: 0.5, boss: 6 },                   // 떨어진 장비가 전설(그 지역 것 먼저 — DS.legPool)일 확률 %
  zl: 0.0004,                                   // 2.1.1: 0.0012 → 0.0004. 2.1.0: 처치 한 번에 그 지역의 전설 하나 (덩치 큰 적 ×2 · 정예 ×6 · 출몰 지역 ×1.6) — 「사냥할 곳」이 고를 거리가 된다
  zlOwn: 0.25,                                  //   이미 가진 전설이면 다시 떨어질 확률 배율 (같은 것을 둘째로)
  uq: { mob: { two: 0.34, hi: 0.08 }, boss: { two: 1, hi: 0.36 } },      // 유니크 굴림: two 옵션 둘 · hi 높은 굴림(눈금 7~9 · 높은 굴림 전용 옵션, 옵션 둘)
  own: [0.2, 0.04],            // 보스의 고유 장비: 첫 격파 / 다시 깼을 때 (2.1.1: 늘 주던 것을 20% · 4%로)
  tierUp: [0.25, 0.05],        // 2.1.0: 장비에 단이 없다 — 「한 단 위」 굴림은 등급과 옵션의 질만 올린다 (한 번마다 옵션 둘 +15%p · 높은 굴림 +4%p)
  enh: [0.04, 0.015, 0.005],   // 무기·방어구가 +1, +2, +3 인 채로 나올 확률
  bag: 40,                     // 유니크·전설 소지 한도 (가득 차면 높은 굴림이 아닌 유니크는 그 자리에서 판다)
  // r37: 무기점·방어구점이 없어졌다 — 보통 장비(옵션 없음)도 적이 떨어뜨린다. 계열은 주로 출전 가문이 쓰는 것 (2.1.0: 수치는 입은 사람의 레벨)
  plain: {
    mob: 0.012, big: 0.02,       // 처치 한 번에 보통 장비 (유니크가 안 나왔을 때) — 2.1.1: 0.035·0.06 에서 줄임
    boss: 0.3, first: 0.55,      // 2.1.1: 시나리오 승리의 보통 장비는 많아야 한 점 — 첫 격파 55% · 다시 깨면 30% (2.1.0: 1점·2점 확정). 장비가 가장 처진 출전 가문 몫
    pit: 0.5,                    // 갱도 층을 깰 때 보통 장비 한 점의 확률 (2.1.1: 늘 → 50%)
    tierUp: [0.3, 0.06],         // 「한 단 위」 굴림 (보스는 tierUp[0] 이 두 배) — 2.1.0: 한 번마다 강화된 채 나올 확률 ×2
    enh: [0.06, 0.02],           // +1, +2 인 채로 나올 확률
    aim: [0.6, 0.25],            // 출전 가문의 계열 · 가문 누구든의 계열 (나머지는 적이 쓰던 계열이나 아무것)
    bag: 40,                     // 가방의 보통 장비 한도 (넘치면 누구에게도 낫지 않은 것은 그 자리에서 판다)
    sell: 0.1                    // 되팔 값 = 정가의 10%
  },
  fx: null                     // 엔진 새 훅이 필요한 옵션(성수 바른 등)을 굴릴지. null = 엔진이 그 칸을 읽는지 보고 정한다
};
var FAM = { goblin: ['sword', 'heavy'], orc: ['sword', 'heavy'], soldier: ['sword', 'lance', 'heavy'], darkKnight: ['lance', 'heavy'], demon: ['sword', 'lance', 'heavy'], lizard: ['lance', 'light'],
  gobArcher: ['bow', 'light'], skelArcher: ['bow', 'light'], archer: ['bow', 'light'], harpy: ['bow', 'light'], gargoyle: ['light', 'heavy'], skeleton: ['sword', 'lance'], mummy: ['wand', 'robe'],
  darkMage: ['staff', 'robe'], imp: ['staff', 'robe'], ghost: ['staff', 'robe'], darkPriest: ['wand', 'robe'], golem: ['heavy'], iceGolem: ['heavy'] };
var BIG = { golem: 1, iceGolem: 1, orc: 1, demon: 1, darkKnight: 1, gargoyle: 1 };
var ENG_KEY = { slay: 'slay', slow: 'hitSt', poison: 'hitSt', reflect: 'reflect', mpRegen: 'mpRegen', killGauge: 'killGauge', teleRes: 'teleRes', bossDmg: 'bossDmg', stRes: 'stRes',
  exec: 'exec', rage: 'rage', critX: 'critX', goldUp: 'goldUp', pierce: 'pierce', atkTick: 'atkTick', splash: 'splash', echo: 'echo', killDrain: 'killDrain', hpRegen: 'hpRegen', lone: 'lone', healUp: 'healUp', eva: 'eva', killHp: 'killHp', ultUp: 'ultUp' };
var engSrc = null;
// 엔진이 그 fx 칸을 읽는가 (엔진 소스에 칸 이름이 있는지로 본다 — 읽지 않는 옵션이 설명만 달고 떨어지지 않게)
function engReady(kind) {
  if (DS.DROP.fx != null) return !!DS.DROP.fx;
  if (engSrc == null) { engSrc = ''; var P = DS.Sim && DS.Sim.prototype; if (P) for (var k in P) if (typeof P[k] === 'function') engSrc += String(P[k]); }
  return engSrc.indexOf(ENG_KEY[kind]) >= 0;
}
function pickW(rnd, w) { var t = 0, i; for (i = 0; i < w.length; i++) t += w[i]; var r = rnd() * t; for (i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; } return w.length - 1; }
function rollDigit(rnd, hi) { return hi ? 7 + Math.floor(3 * Math.pow(rnd(), 1.5)) : 1 + Math.floor(6 * Math.pow(rnd(), 1.4)); }      // 보통 굴림 1~6 (낮은 쪽이 흔하다), 높은 굴림 7~9
function rollAffix(rnd, pre, cat, slot, hi) {
  var pool = [], k, A;
  for (k in AFFIX) { A = AFFIX[k]; if (axPre(A) === pre && axFits(A, cat, slot) && (!A[6] || hi) && (!A[4].eng || engReady(A[4].eng))) pool.push(k); }
  k = pool[Math.floor(rnd() * pool.length)]; A = AFFIX[k];
  return k + (A[3] ? rollDigit(rnd, hi) : '');
}
function rosterCats(save) {
  var o = [];
  DS.charList(save).forEach(function (c) { var G = DS.CLS_GEAR[c.cls]; if (G) G.w.concat(G.a).forEach(function (k) { if (o.indexOf(k) < 0) o.push(k); }); });
  return o;
}
// ───────── 전설 고르기 (2.1.0) ─────────
// 전설 하나의 식별자 ('sword.thirst'). 얻는 곳(from)이 'zone:지역' 인 것은 그 지역 처치·깃술 조각·현상금이, 보스 것은 그 보스가 준다
var LEG_IDS = null;
function legIds() { if (!LEG_IDS) { LEG_IDS = []; for (var c in UNIQ) for (var l in UNIQ[c]) LEG_IDS.push(c + '.' + l); } return LEG_IDS; }
function legOf(id) { var p = id.split('.'); return UNIQ[p[0]][p[1]]; }
function legOwned(save, id) {
  if (!save) return false;
  for (var k in save.gear || {}) if (save.gear[k] > 0 && (k === id || k.indexOf(id + '+') === 0 || k.indexOf(id + '~') === 0)) return true;
  return DS.charList(save).some(function (c) { return [c.w, c.a].some(function (x) { return x && (x === id || x.indexOf(id + '+') === 0 || x.indexOf(id + '~') === 0); }); });
}
function bossScn(b) { for (var i = 0; i < DS.SCENARIOS.length; i++) { var s = DS.SCENARIOS[i], B = DS.BOSSES[s.boss]; if (s.boss === b || (B && B.phase2 === b)) return s.id; } return 0; }
// 그 판에서 「닿은」 전설인가: 가 본 지역의 것 · 깬 보스의 것 · 깬 시나리오의 것 (save 가 없으면 모두)
function legReach(save, id) {
  if (!save) return true;
  var f = legOf(id).from || '', p = f.split(':');
  if (p[0] === 'zone') return !!(save.visited && save.visited[p[1]]);
  if (p[0] === 'scn') return !!(save.cleared && save.cleared[+p[1]]);
  var n = bossScn(f); return !!(n && save.cleared && save.cleared[n]);
}
DS.legPool = function (zone) { return legIds().filter(function (id) { return legOf(id).from === 'zone:' + zone; }); };
// 아직 없는 전설 하나 (깃술 조각·가호 보상): 그 지역 것 → 닿은 것 → 아무것. 다 가졌으면 null
DS.legNext = function (save, zone, rnd) {      // rnd 가 없으면 정해진 하나 (게시판에 미리 보이는 이름과 받는 것이 같게)
  var nOwn = legIds().filter(function (id) { return legOwned(save, id); }).length;
  rnd = rnd || function () { return ((nOwn * 7 + 3) % 97) / 97; };
  var free = legIds().filter(function (id) { return !legOwned(save, id) && legOf(id).from.indexOf('scn:') !== 0; });
  var z = free.filter(function (id) { return legOf(id).from === 'zone:' + zone; }), r = free.filter(function (id) { return legReach(save, id); });
  var list = z.length ? z : r.length ? r : free;
  return list.length ? list[Math.floor(rnd() * list.length)] : null;
};
function legRoll(o, rnd) {      // 떨어진 장비가 전설일 때: 그 지역 것 절반, 나머지는 닿은 것 가운데 (보스 고유 장비 포함)
  var z = o.zone ? DS.legPool(o.zone) : [], all = legIds().filter(function (id) { return legOf(id).from.indexOf('scn:') !== 0 && legReach(o.save, id); });
  var list = z.length && rnd() < 0.5 ? z : all.length ? all : z;
  return list.length ? list[Math.floor(rnd() * list.length)] : null;
}
// 유니크·전설 한 점의 식별자를 굴린다. o: { L 적 레벨, type 적 종류, boss(보스 품질), cats(우리 부대가 쓰는 계열), grade(굴림 고정), up(한 단 위 굴림), zone, save }
//   grade(현상금·갱도가 넘긴다 — 옛 등급 숫자 그대로 받는다): 5 전설 · 4 높은 굴림 · 3 옵션 둘 · 2 옵션 하나 · 없으면 표(DROP.leg·uq)대로
//   2.1.0: 단이 없다 — tierUp 굴림(위로 한 번·두 번)은 옵션 둘·높은 굴림이 나올 확률만 올린다
DS.rollGear = function (o, rnd) {
  rnd = rnd || Math.random;
  var T = DS.DROP, up = (rnd() < T.tierUp[0] ? 1 : 0) + (rnd() < T.tierUp[1] ? 1 : 0) + (o.up || 0);
  var all = Object.keys(DS.GEAR_CAT), fam = FAM[o.type], r0 = rnd();
  var cat = o.cat && DS.GEAR_CAT[o.cat] ? o.cat : fam && r0 < 0.5 ? fam[Math.floor(rnd() * fam.length)] : o.cats && o.cats.length && r0 < 0.85 ? o.cats[Math.floor(rnd() * o.cats.length)] : all[Math.floor(rnd() * all.length)];      // cat: 계열 고정 (현상금 보상)
  var slot = DS.GEAR_CAT[cat].slot, Q = T.uq[o.boss ? 'boss' : 'mob'], gr = o.grade || 0;
  if (gr === 5 || (!gr && rnd() * 100 < T.leg[o.boss ? 'boss' : 'mob'])) {      // 전설
    var lid = legRoll(o, rnd); if (lid) return lid;
    gr = 4;
  }
  var hi = gr ? gr >= 4 : rnd() < Q.hi + 0.04 * up, both = hi || gr === 3 || (!gr && rnd() < Q.two + 0.15 * up);
  var id = cat + '.' + (rnd() < 0.6 ? 'A' : 'B'), preFirst = rnd() < 0.5;
  if (both || preFirst) id += '~' + rollAffix(rnd, true, cat, slot, hi);
  if (both || !preFirst) id += '~' + rollAffix(rnd, false, cat, slot, hi);
  if (slot === 'w' || slot === 'a') { var e = rnd(); id += e < T.enh[2] ? '+3' : e < T.enh[2] + T.enh[1] ? '+2' : e < T.enh[2] + T.enh[1] + T.enh[0] ? '+1' : ''; }
  return id;
};
// r37: 보통 장비 한 점. o: { L 적 레벨, type 적 종류, boss, save, need(장비가 처진 가문 먼저) }
function aimCat(save, need, rnd) {
  var P = DS.DROP.plain, r = rnd(), mem = (save.party || []).map(function (id) { return save.chars[id]; }).filter(Boolean), pick, G, sl;
  if (need && mem.length) {      // 출전 가문 가운데 장비 점수가 가장 낮은 자리
    var lo = null; mem.forEach(function (c) { var C = DS.CLS_GEAR[c.cls]; if (!C) return; ['w', 'a'].forEach(function (s) { var sc = DS.gearScore(DS.gear(c[s]), c) + rnd() * 6; if (!lo || sc < lo.sc) lo = { c: c, s: s, sc: sc }; }); });
    if (lo) { G = DS.CLS_GEAR[lo.c.cls][lo.s]; return G[Math.floor(rnd() * G.length)]; }
  }
  if (mem.length && r < P.aim[0]) pick = mem[Math.floor(rnd() * mem.length)];
  else if (r < P.aim[0] + P.aim[1]) { var all = DS.charList(save); if (all.length) pick = all[Math.floor(rnd() * all.length)]; }
  if (!pick || !DS.CLS_GEAR[pick.cls]) return null;
  sl = rnd() < 0.5 ? 'w' : 'a'; G = DS.CLS_GEAR[pick.cls][sl];
  return G[Math.floor(rnd() * G.length)];
}
DS.rollPlain = function (o, rnd) {
  rnd = rnd || Math.random;
  var P = DS.DROP.plain, tu = P.tierUp, up = (rnd() < tu[0] * (o.boss ? 2 : 1) ? 1 : 0) + (rnd() < tu[1] ? 1 : 0), k = Math.pow(2, up);      // 2.1.0: 한 단 위 굴림 → 강화된 채 나올 확률 ×2
  var fam = FAM[o.type], cat = (o.save && aimCat(o.save, o.need, rnd)) || (fam && rnd() < 0.6 ? fam[Math.floor(rnd() * fam.length)] : null), all = Object.keys(DS.GEAR_CAT);
  if (!cat) cat = all[Math.floor(rnd() * all.length)];
  var e = rnd(), id = cat + '.' + (rnd() < 0.62 ? 'A' : 'B');
  return id + (e < P.enh[1] * k ? '+2' : e < (P.enh[1] + P.enh[0]) * k ? '+1' : '');
};
function plainCount(save) { var n = 0, k, g; for (k in save.gear) { g = DS.gear(k); if (g && g.grade < 2) n += save.gear[k]; } return n; }
function lootState(save) { if (!save.lock || typeof save.lock !== 'object') save.lock = {}; if (!save.lootGot || typeof save.lootGot !== 'object') save.lootGot = {}; return save; }
function fancyCount(save) { var n = 0, k, g; for (k in save.gear) { g = DS.gear(k); if (g && g.grade >= 2) n += save.gear[k]; } return n; }
// 장비 한 점을 가방에 넣고 화면에 보일 항목을 돌려준다. 가방(유니크·전설 DROP.bag 점)이 가득하면 높은 굴림이 아닌 유니크는 그 자리에서 판다.
// src = 내력에 남길 얻은 곳 { at: 이름, w: 1 이면 「…에게서」(보스) }
function putGear(save, id, src) {
  var g = DS.gear(id); if (!g) return null;
  lootState(save); DS.gearRefSave(save);
  var d = { kind: 'gear', id: id, n: 1, grade: g.grade, name: g.name };
  if (g.grade === 4 && !g.hi && fancyCount(save) >= DS.DROP.bag) { save.gold += g.sell; d.sold = g.sell; return d; }
  if (g.grade < 2 && plainCount(save) >= DS.DROP.plain.bag && !better(save, g)) { save.gold += g.sell; d.sold = g.sell; return d; }      // r37: 보통 장비가 넘치면 쓸 데 없는 것은 그 자리에서 판다
  save.gear[id] = (save.gear[id] || 0) + 1;
  if (g.hi || g.grade >= 5) save.lock[id] = 1;      // 높은 굴림의 유니크와 전설은 잠긴 채로 들어온다 (잘못 파는 일을 막는다)
  if (g.grade >= 4) ghNew(save, id, src);
  return d;
}
DS.lootPut = putGear;      // world.js applyClear 의 정해진 보상 전설
function zoneName(z) { return z && DS.ZONES && DS.ZONES[z] ? DS.ZONES[z].name : ''; }
function bossName(b) { return b && DS.BOSSES && DS.BOSSES[b] ? DS.BOSSES[b].name : ''; }
function rollItem(save, zone, rnd, n) {
  var keys = [], w = [], k, it;
  BASE_ITEMS.forEach(function (b, i) { keys.push(b); w.push([3, 2, 1][i]); });
  for (k in MGEAR) { keys.push(k); w.push(0.2); }      // r37: 가게에서 빠져 조금 잦게 (전에는 0.12)
  for (var tries = 0; tries < 6; tries++) {
    k = keys[pickW(rnd, w)]; it = DS.ITEMS[k];
    var got = DS.giveItem(save, k, n || 1);
    if (got) return { kind: 'item', id: k, n: got, grade: 1, name: it.name };
  }
  return null;      // 다 가득 찼다
}
// 필드·시나리오의 처치 한 번. e = 엔진의 reward 이벤트 (+ 있으면 zone, sum). 굴려서 save 에 넣고 목록을 돌려준다.
DS.rollDrop = function (save, e, rnd) {
  rnd = rnd || Math.random;
  var T = DS.DROP, out = [];
  if (!save || !e || e.boss) return out;                                       // 보스는 승리 처리(bossLoot·pitLoot)에서 준다
  if (e.sum || (e.exp != null && e.exp / (e.ek || 1) < (6 + 1.6 * e.L) * 0.5)) return out;      // 소환된 적(경험치 25%)은 떨어뜨리지 않는다
  if (DS.bountyHit) DS.bountyHit(save, e, rnd).forEach(function (b) { out.push.apply(out, DS.bountyReward(save, b, rnd)); });      // 현상 수배: 달성하면 알림·보상이 전리품 목록에 섞여 나온다
  if (!(T.mul > 0) || e.L < DS.partyL(save) + T.minL) return out;              // 한참 약한 적
  var R = BIG[e.type] ? T.big : T.mob, zone = e.zone || save.zone, d, bm = DS.bountyMul ? DS.bountyMul(save, zone, 'drop') : 1;
  if (e.elite != null || e.eliteCrew != null) bm *= e.elite != null ? 6 : 2;      // 정예 무리는 더 잘 떨어뜨린다 (우두머리 장비는 현상금 보상으로 따로)
  var dk = e.dk > 0 ? e.dk : 1; bm *= dk;      // 2.2.2: 큰 부대에 맞춰 불어난 무리는 하나하나가 덜 떨어뜨린다
  DS.gearRefSave(save);
  if (e.scn) { if (rnd() < R.item * T.mul * bm) { d = rollItem(save, zone, rnd, 1); if (d) out.push(d); } return out; }      // 2.1.1: 시나리오 싸움의 처치는 장비를 떨어뜨리지 않는다 — 장비는 승리 보상(bossLoot) 한 번에서만
  if (rnd() < T.zl * T.mul * bm * (BIG[e.type] ? 2 : 1)) {      // 2.1.0: 그 지역의 전설 (가진 것이면 zlOwn 배율로 한 번 더 굴린다)
    var zp = DS.legPool(zone), zid = zp.length ? zp[Math.floor(rnd() * zp.length)] : null;
    if (zid && (!legOwned(save, zid) || rnd() < T.zlOwn)) { d = putGear(save, zid, { at: zoneName(zone) }); if (d) { d.zl = 1; out.push(d); } }
  }
  if (rnd() < R.gear * T.mul * bm) { d = putGear(save, DS.rollGear({ L: e.L, type: e.type, cats: rosterCats(save), zone: zone, save: save }, rnd), { at: zoneName(zone) }); if (d) out.push(d); }
  else if (rnd() < T.plain[BIG[e.type] ? 'big' : 'mob'] * T.mul * Math.min(2, bm)) { d = putGear(save, DS.rollPlain({ L: e.L, type: e.type, save: save }, rnd)); if (d) out.push(d); }      // r37: 보통 장비
  if (rnd() < R.item * T.mul * bm) { d = rollItem(save, zone, rnd, 1); if (d) out.push(d); }
  return out;
};
// 현상금 하나를 달성했을 때 화면에 보일 항목들 (골드·모집권·공훈은 DS.bountyHit 이 이미 넣었다). 장비는 여기서 굴려 가방에 넣는다
DS.bountyReward = function (save, b, rnd) {
  rnd = rnd || Math.random;
  var out = [], r = b.r || {}, bits = [], d;
  if (r.gold) bits.push('+' + r.gold.toLocaleString() + '골드');
  if (r.ticket) bits.push('모집권 +' + r.ticket);
  // name 은 떨어진 자리에 뜨는 짧은 글(화면 폭), line 은 결과 창의 긴 글
  out.push({ kind: 'bounty', id: 'bty' + b.id, n: 1, grade: 4, name: '현상금 달성', title: b.title || '', line: String(DS.BTY_TXT.done).replace('{title}', b.title || '') + (bits.length ? ', ' + bits.join(', ') : ''), gold: r.gold || 0, ticket: r.ticket || 0 });
  if (r.grade) { d = putGear(save, DS.rollGear({ L: b.L + 2, cat: r.cat, cats: rosterCats(save), grade: r.grade, boss: true, zone: b.z, save: save }, rnd), { at: zoneName(b.z) || b.title || '' }); if (d) { d.bounty = b.id; out.push(d); } }
  if (r.item) { d = rollItem(save, b.z, rnd, 2); if (d) out.push(d); }
  var fid = DS.bountyFlag && DS.bountyFlag(save, rnd);      // 깃술 조각이 다 모였다 → 아직 없는 전설 장비 하나 + 강화 보호 부적 2 (2.1.0 — 옛 깃술 유물 자리)
  if (fid) {
    var fg = DS.gear(fid);
    out.push({ kind: 'bounty', id: 'flag' + fid, n: 1, grade: 5, name: '깃술 조각', line: String(DS.BTY_TXT.flag).replace('{name}', fg ? fg.short : fid) });
    d = putGear(save, fid, { at: '깃술 조각' }); if (d) out.push(d);
    var pn = DS.giveItem(save, 'prot', 2); if (pn) out.push({ kind: 'item', id: 'prot', n: pn, grade: 4, name: DS.ITEMS.prot.name });
  }
  return out;
};
DS.loot = { onReward: function (e, save, rnd) { return DS.rollDrop(save, e, rnd); } };      // 옛 약속 이름으로도 부를 수 있게
function uniqFrom(key) {
  for (var c in UNIQ) for (var l in UNIQ[c]) if (UNIQ[c][l].from === key) return c + '.' + l;
  return null;
}
function bossKeys(scn) { var b = scn && scn.boss, B = b && DS.BOSSES[b], o = []; if (b) o.push(b); if (B && B.phase2) o.push(B.phase2); return o; }
// 그 시나리오의 보스가 떨어뜨리는 고유 장비 식별자들 (입구 창의 보상 줄에 쓸 수 있다)
DS.bossUniq = function (scn) { return bossKeys(scn).map(uniqFrom).filter(function (x) { return !!x; }); };
// 시나리오 승리: 유니크 한 점(DROP.boss 확률 · 옵션 둘) + 소모품 + 그 보스의 고유 장비(첫 격파 100%, 다시 깨면 12%)
DS.bossLoot = function (save, scn, first, rnd) {
  rnd = rnd || Math.random;
  var T = DS.DROP, out = [], d;
  if (!save || !scn || scn.pit || !(T.mul > 0)) return out;
  var fresh = scn.L >= DS.partyL(save) + T.minL;
  lootState(save);
  if (first || fresh) {
    if (rnd() < T.mul * (first ? T.boss[0] : T.boss[1])) { d = putGear(save, DS.rollGear({ L: scn.L + 1, type: scn.boss, boss: true, cats: rosterCats(save), zone: scn.zone, save: save }, rnd), { at: scn.name || zoneName(scn.zone) }); if (d) out.push(d); }
    d = rollItem(save, scn.zone, rnd, 1); if (d) out.push(d);
    if (rnd() < T.mul * (first ? T.plain.first : T.plain.boss)) { d = putGear(save, DS.rollPlain({ L: scn.L, type: scn.boss, boss: true, save: save, need: true }, rnd)); if (d) out.push(d); }      // 2.1.1: 많아야 한 점      // r37: 보스는 보통 장비도 (처진 가문 몫 먼저, 단이 잘 오른다)
  }
  bossKeys(scn).forEach(function (b) {
    var u = uniqFrom(b); if (!u) return;
    var give = first ? rnd() < T.mul * T.own[0] : fresh && rnd() < T.mul * T.own[1];      // 2.1.1: 첫 격파도 확정이 아니다 (20%) — 못 받았으면 다시 깨서 노린다 (4%)
    if (!give) return;
    save.lootGot[b] = 1;
    d = putGear(save, u, { at: bossName(b) || scn.name || '', w: bossName(b) ? 1 : 0 }); if (d) { d.boss = b; out.push(d); }
  });
  return out;
};
// 갱도 층 (2.2.3 끝없는 층): 처음 깬 5층마다(수문장 층) 유니크 한 점(옵션 둘 · 10층마다는 높은 굴림 보장), 그 밖에는 — 보통 층의 첫 돌파도, 다시 깬 층도 —
//   적 레벨이 부대 평균 + minL 이상일 때만 절반 확률(× DROP.mul)로 한 점 + 보통 장비 pit 확률. 적 레벨 96 이상(옛 10층)부터 갱도지기의 곡괭이 (처음 · 다시 깨면 own[1] 확률).
//   장비의 레벨은 적 레벨 + 1 (100 에서 멈춘다) — 깊은 층이라고 드랍이 불어나지 않는다
DS.pitLoot = function (save, floor, rnd) {
  rnd = rnd || Math.random;
  var T = DS.DROP, out = [], d, L = Math.min(100, (DS.pitL ? DS.pitL(floor) : 42 + (floor - 1) * 6) + 1);
  if (!save || !(floor >= 1) || !(T.mul > 0)) return out;
  lootState(save);
  var first = floor > (save.lootPit || 0), boss = floor % 5 === 0, fresh = L >= DS.partyL(save) + T.minL, u = uniqFrom('keeper');
  if (first) save.lootPit = floor;
  if ((first && boss) || (fresh && rnd() < 0.5 * T.mul)) {
    d = putGear(save, DS.rollGear({ L: L, type: 'golem', boss: true, cats: rosterCats(save), grade: first && floor % 10 === 0 ? 4 : 0, save: save }, rnd), { at: '갱도 ' + floor + '층' }); if (d) out.push(d);
    d = rollItem(save, 'stone', rnd, 1); if (d) out.push(d);
    if (rnd() < T.plain.pit) { d = putGear(save, DS.rollPlain({ L: L, type: 'golem', boss: true, save: save, need: true }, rnd)); if (d) out.push(d); }      // r37
  }
  if (L >= 97 && u && (!save.lootGot.keeper || (fresh && rnd() < T.own[1]))) { save.lootGot.keeper = 1; d = putGear(save, u, { at: bossName('keeper') || '갱도 ' + floor + '층', w: bossName('keeper') ? 1 : 0 }); if (d) { d.boss = 'keeper'; out.push(d); } }
  return out;
};
// 이미 깬 보스의 고유 장비를 한 번씩 소급 지급한다 (이주에서 부른다. 여러 번 불러도 한 번만 준다)
DS.lootRetro = function (save) {
  var got = [];
  if (!save || !save.cleared) return got;
  lootState(save);
  DS.SCENARIOS.forEach(function (s) {
    if (!save.cleared[s.id]) return;
    bossKeys(s).forEach(function (b) {
      var u = uniqFrom(b); if (!u || save.lootGot[b]) return;
      save.lootGot[b] = 1; save.gear[u] = (save.gear[u] || 0) + 1; save.lock[u] = 1; got.push(u);
    });
  });
  return got;
};
// 자동 플레이(tools/campaign.js)용: 가방에서 더 좋은 것을 출전 지휘관에게 입힌다 (입힌 수)
DS.lootAutoEquip = function (save) {
  var n = 0;
  save.party.forEach(function (id) { var ch = save.chars[id]; if (ch && DS.autoEquip(save, ch)) n++; });
  return n;
};

// ───────── 내력: 유니크·전설이 얻은 해·곳과 거쳐 간 손을 남긴다 (수치 효과 없음) ─────────
// save.gh[식별자] = { y: 얻은 해(달력 DS.calNow 의 yr · 옛 장비는 없음), at: 얻은 곳, w: 1 이면 보스에게서, h: [{ n 이름, p 'p'+가계도 번호 | 'c'+지휘관 번호, y 든 해 }], x: 줄인 손 수 }
//   식별자 묶음(save.gear 는 개수)이라 같은 식별자가 둘이면 기록 하나를 함께 쓴다 — 먼저 얻은 해가 남는다. 유니크는 식별자가 거의 겹치지 않는다.
//   강화로 식별자가 바뀌면 새 식별자로 옮기고(DS.enhance 감싸기), 팔거나 부서져 아무도 지니지 않으면 지운다(ghTidy). 보통 장비는 남기지 않는다.
var GH_MAX = 8;
function ghState(save) { if (!save.gh || typeof save.gh !== 'object' || Array.isArray(save.gh)) save.gh = {}; return save.gh; }
function yrNow(save) { try { return DS.calNow ? DS.calNow(save).yr : null; } catch (e) { return null; } }
function ghNew(save, id, src) {
  var gh = ghState(save); if (own(gh, id)) return gh[id];
  var r = { h: [] }, y = yrNow(save);
  if (y != null) r.y = y;
  if (src && src.at) { r.at = String(src.at).slice(0, 24); if (src.w) r.w = 1; }
  return (gh[id] = r);
}
function held(save, id) {
  if (save.gear && save.gear[id] > 0) return true;
  return DS.charList(save).some(function (c) { return c.w === id || c.a === id; });
}
function holder(save, ch) {      // 4.0: 대장 깃발은 대장, 다른 깃발은 그 깃발을 든 부대원의 사람 번호
  var b = ch.id !== save.hero && DS.bearer ? DS.bearer(save, ch) : null, pid = b ? b.pid : ch.pid;
  var p = pid && DS.linPerson ? DS.linPerson(save, pid) : null;
  return { n: ch.id === save.hero || !p ? DS.charName(ch, save) : DS.linName(save, pid), p: p ? 'p' + pid : 'c' + ch.id };
}
// 지금 그 장비를 든 사람이 기록의 마지막 손이 아니면 덧붙인다 (입힐 때·후계가 자리를 이을 때·불러올 때)
DS.ghTouch = function (save) {
  if (!save || !save.gh) return;
  var gh = save.gh, wear = {};
  DS.charList(save).forEach(function (c) { ['w', 'a'].forEach(function (sl) { if (c[sl] && own(gh, c[sl])) wear[c[sl]] = (wear[c[sl]] || 0) + 1; }); });
  DS.charList(save).forEach(function (c) {
    if (c.vac) return;      // 빈자리(후계를 기다린다)
    if (DS.bearer && c.id !== save.hero && !c.pid && !DS.bearer(save, c)) return;      // 4.0: 든 사람이 없는 깃발 — 새 손이 아니다
    ['w', 'a'].forEach(function (sl) {
      var id = c[sl], r = id && own(gh, id) ? gh[id] : null; if (!r) return;
      var me = holder(save, c), last = r.h[r.h.length - 1];
      if (last && last.p === me.p) { last.n = me.n; return; }
      if (wear[id] > 1 && r.h.some(function (e) { return e.p === me.p; })) return;      // 같은 식별자를 둘이 입었다 — 번갈아 쌓이지 않게
      var y = yrNow(save); r.h.push(y != null ? { n: me.n, p: me.p, y: y } : { n: me.n, p: me.p });
      while (r.h.length > GH_MAX) { r.h.splice(1, 1); r.x = (r.x || 0) + 1; }      // 처음 든 이는 남기고 그다음부터 줄인다
    });
  });
};
// 아무도 지니지 않는 기록을 지운다 (팔았다·부서졌다)
DS.ghTidy = function (save) {
  if (!save || !save.gh) return;
  for (var id in save.gh) if (own(save.gh, id) && !held(save, id)) delete save.gh[id];
};
// 불러올 때 (save.js 의 fixSave 가 부른다): 깨진 칸을 고치고, 지니지 않는 기록을 지우고, 지금 든 손을 맞춘다. 옛 저장은 빈 칸으로 시작한다
DS.lootFix = function (s) {
  var gh = ghState(s), id, r;
  for (id in gh) {
    if (!own(gh, id)) continue; r = gh[id];
    var g = DS.gear(id);
    if (!g || g.grade < 4 || !r || typeof r !== 'object' || Array.isArray(r)) { delete gh[id]; continue; }
    if (!(r.h instanceof Array)) r.h = [];
    r.h = r.h.filter(function (e) { return e && typeof e === 'object' && typeof e.n === 'string' && typeof e.p === 'string'; }).map(function (e) { var o = { n: e.n.slice(0, 24), p: e.p.slice(0, 12) }; if (isFinite(e.y)) o.y = Math.round(+e.y); return o; });
    while (r.h.length > GH_MAX) { r.h.splice(1, 1); r.x = (r.x || 0) + 1; }
    if (r.y != null && !isFinite(r.y)) delete r.y; else if (r.y != null) r.y = Math.round(+r.y);
    if (r.at != null && typeof r.at !== 'string') delete r.at;
    if (r.x != null && !(r.x > 0)) delete r.x;
  }
  DS.ghTidy(s); DS.ghTouch(s);
  return s;
};
// 입히기: 내력이 없는 유니크·전설(옛 저장)은 처음 들린 순간부터 기록한다 — 얻은 해·곳은 모르니 비워 둔다
var eq0 = DS.equip;
DS.equip = function (save, ch, id) {
  var ok = eq0.apply(this, arguments);
  if (ok) { var g = DS.gear(id); if (g && g.grade >= 4) { var gh = ghState(save); if (!own(gh, id)) gh[id] = { h: [] }; } DS.ghTouch(save); }
  return ok;
};
// 강화: 기록이 새 식별자를 따라간다 (부서지면 지운다)
var enh0 = DS.enhance;
DS.enhance = function (save, ref, rnd) {
  var ch = ref && ref.ch ? save.chars[ref.ch] : null, id = ch ? ch[ref.sl === 'a' ? 'a' : 'w'] : ref && ref.id, r = save.gh && id && own(save.gh, id) ? save.gh[id] : null;
  var res = enh0.apply(this, arguments);
  if (res && r) {
    if (res.ok && res.to && !own(save.gh, res.to.id)) save.gh[res.to.id] = JSON.parse(JSON.stringify(r));
    if (!held(save, id)) delete save.gh[id];
  }
  return res;
};
// 화면 글: 「34년 전 · 잿빛 고개에서 · 거쳐 간 손 3」 / 「처음 든 이 바우 → 바우 2세」 / 오래될수록 이름 앞의 꾸밈 한 마디
DS.ghOf = function (save, id) { return save && save.gh && id && own(save.gh, id) ? save.gh[id] : null; };
DS.ghAge = function (save, r) { var y = yrNow(save); return r && r.y != null && y != null ? Math.max(0, y - r.y) : null; };
DS.ghParts = function (save, id) {      // r45 ui: 줄로 잇지 않고 꼬리표로 그릴 수 있게 조각으로
  var r = DS.ghOf(save, id); if (!r) return [];
  var a = DS.ghAge(save, r), out = [], n = r.h.length + (r.x || 0);
  if (a != null) out.push(a < 1 ? '올해 얻음' : a + '년 전');
  if (r.at) out.push(r.at + (r.w ? '에게서' : '에서'));
  if (n) out.push('거쳐 간 손 ' + n);
  return out;
};
DS.ghShort = function (save, id) { return DS.ghParts(save, id).join(', '); };
DS.ghChain = function (save, id) {
  var r = DS.ghOf(save, id); if (!r || !r.h.length) return '';
  var ns = r.h.map(function (e) { return e.n; });
  if (r.x) ns.splice(1, 0, '…');
  return '처음 든 이 ' + ns.join(' → ');
};
DS.GH_WORD = [[100, '전해 내려온'], [50, '대물림된'], [20, '오래된']];
DS.ghWord = function (save, id) {
  var a = DS.ghAge(save, DS.ghOf(save, id)); if (a == null) return '';
  for (var i = 0; i < DS.GH_WORD.length; i++) if (a >= DS.GH_WORD[i][0]) return DS.GH_WORD[i][1];
  return '';
};
function curSave() { return DS.G && DS.G.save; }
function ghLine(id, full) {
  var s = curSave(), t = s ? DS.ghParts(s, id) : [], c = full && s ? DS.ghChain(s, id) : '';
  return (t.length ? '<small class="lher">' + tagsH(t.map(esc), 'gh') + '</small>' : '') + (c ? '<small class="lher lch">' + esc(c) + '</small>' : '');
}
DS.ghHtml = ghLine;      // ui.js(지휘관 창 장비 줄)가 쓴다

// ───────── 화면: 이름·설명, 가방의 장비 구역, 결과 창 목록 ─────────
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
// r45 ui: 쉼표로 이어 쓴 능력치 글(「방어 +17, 마방 +11, 공격, 마공 +8%」)을 칩 줄로 — 이름 · 값, 오름은 초록 · 내림은 붉게.
//   글은 그대로 두고(저장·시험이 읽는다) 그릴 때만 나눈다. 숫자 없는 짧은 이름 하나는 다음 칸과 묶는다 (「공격·마공 +8%」)
function chipParts(t) {
  var seg = String(t == null ? '' : t).split(/,\s+/), out = [];
  for (var i = 0; i < seg.length; i++) {
    var x = seg[i].trim(); if (!x) continue;
    if (i < seg.length - 1 && !/\d/.test(x) && x.length <= 6 && /\d/.test(seg[i + 1])) { seg[i + 1] = x + '·' + seg[i + 1].trim(); continue; }
    out.push(x);
  }
  return out;
}
DS.chip = function (label, val, dir) { return '<span class="sch' + (dir > 0 ? ' up' : dir < 0 ? ' dn' : '') + '"><i>' + esc(label) + '</i><b>' + esc(val) + '</b></span>'; };
var CHIP_RE = /^(.*?\S)\s*((?:[+\-−×]\s?)?[\d.,]+(?:%|초|칸)?(?:\s*(?:→|~)\s*[\d.,]+%?)?)$/;
function chipOne(x) {
  var m = CHIP_RE.exec(x);
  if (!m) return '<span class="sch tag">' + esc(x) + '</span>';
  var v = m[2], d = /^[\-−]/.test(v) ? -1 : /^[+×]/.test(v) ? 1 : 0;
  if (/받는|붉은 칸|느림/.test(m[1])) d = -d;      // 받는 피해가 줄면 좋은 것
  return DS.chip(m[1], v, d);
}
DS.statChips = function (t, cls, extra) {
  var ps = chipParts(t); if (!ps.length && !extra) return '';
  return '<span class="schips' + (cls ? ' ' + cls : '') + '">' + ps.map(chipOne).join('') + (extra || '') + '</span>';
};
// 설명 글: 조각이 모두 「이름 +값」 꼴일 때만 칩으로, 문장이 섞이면 글 그대로 (뜻이 쉼표에서 끊기지 않게)
DS.descChips = function (t, cls) { var ps = chipParts(t); return ps.length && ps.every(function (x) { var m = CHIP_RE.exec(x); return m && m[1].length <= 12; }) ? DS.statChips(t, cls) : '<small class="dtx">' + esc(t) + '</small>'; };
function tagsH(list, cls) { list = list.filter(Boolean); return list.length ? '<span class="tagrow' + (cls ? ' ' + cls : '') + '">' + list.map(function (t) { return '<i>' + t + '</i>'; }).join('') + '</span>' : ''; }      // 이미 HTML 인 조각들
DS.tagsH = tagsH;
function gname(g) {      // r12: 강화 색은 DS.enhClass(그래픽 2차 표). 2.1.0: 등급은 이름 색(보라·금)과 아이콘 테두리로만 — 앞의 눈금(깃발)은 없앴다
  var nm = esc(g.short || g.name), ec = DS.enhClass ? DS.enhClass(g.enh || 0) : 'en en' + DS.enhTier(g.enh || 0);
  if (g.grade < 2) return '<span class="lg lg1 ' + ec + '">' + nm + '</span>';
  if (g.enh) nm = nm.replace(' +' + g.enh, ' <span class="' + ec + '">+' + g.enh + '</span>');
  var s = curSave(), w = s ? DS.ghWord(s, g.id) : '';      // 오래 대물림된 물건은 이름 앞에 꾸밈 한 마디
  return '<span class="lg lg' + (g.grade >= 5 ? 5 : 4) + '">' + (w ? '<i class="lold">' + w + '</i> ' : '') + nm + '</span>';
}
function pips(g) {      // 옛 등급 눈금 — 2.1.0 부터 장비 화면에는 그리지 않는다 (다른 파일이 부를 수 있어 남겨 둔다)
  var n = g.grade >= 5 ? 5 : g.grade >= 4 ? 4 : 1, h = '<i class="gp" role="img" aria-label="' + esc(DS.gearTag(g) || '보통') + '">'; for (var i = 0; i < n; i++) h += '<b' + (i === 4 ? ' class="g5"' : '') + '></b>'; return h + '</i>'; }
DS.gearPips = pips;
// 가방·가게·대장간이 함께 쓰는 줄 머리: 등급색 이름 · 계열 (2.1.0: 단 없음 · 눈금 없음)
DS.gearTitle = function (g) { return '<b>' + gname(g) + ' <i class="own">' + gtag(g) + g.kind + '</i></b>'; };
// 입은 사람 기준 글: 「맞지 않는 병과: 능력치 −10%」
function offTxt() { return '맞지 않는 병과: 능력치 −' + pct(1 - DS.GEAR_OFF) + '%'; }
DS.gearOffTxt = offTxt;
function gtag(g) { var t = DS.gearTag(g); return t ? '<span class="gtg">' + esc(t) + '</span>' : ''; }      // r45: 등급 이름은 쉼표 글이 아니라 작은 꼬리표 (색은 이름이 보인다)
function offChip() { return '<span class="sch tag goff">' + esc(offTxt()) + '</span>'; }      // r45 칩 줄에 붙는 붉은 칩 하나
DS.gearOffChip = offChip;
// 등급색 이름 + 능력치 + 옵션 설명 + 사연. ui.js 의 gearLine 자리에 그대로 들어간다 (.tx 안의 b·small 들)
// full: 내력의 거쳐 간 손까지 (지휘관 창의 장비 줄) · ch: 그 사람 기준 수치 (없으면 지금 부대 레벨)
DS.gearHtml = function (g, full, ch) {
  if (!g) return '';
  var st = ch ? DS.gearStatTxt(g, DS.gearAt(g, ch.L, ch.cls, ch.gt)) : g.stat;      // 2.1.0: 그 사람 기준 수치 · r45: 칩 줄로, 맞지 않는 병과는 붉은 칩 하나 더
  var h = '<b>' + gname(g) + ' <i class="own">' + gtag(g) + g.kind + '</i></b>' + DS.statChips(st, '', ch && !DS.gearFits(ch.cls, g) ? offChip() : '') + (g.grade >= 4 ? ghLine(g.id, full) : '');
  (g.affix || []).forEach(function (a) { h += '<small class="lax"><i>' + (a.pre ? esc(a.name) : '〈' + esc(a.name) + '〉') + '</i> ' + esc(a.desc) + '</small>'; });
  (g.special || []).forEach(function (t) { h += '<small class="lax"><i>고유</i> ' + esc(t) + '</small>'; });
  if (g.lore) h += '<small class="llore">' + esc(g.lore) + '</small>';
  return h;
};
// 이 장비가 누구에게 더 좋은가: 출전 지휘관 가운데 점수가 가장 많이 오르는 사람 (없으면 null)
function better(save, g) {
  var best = null;
  save.party.forEach(function (id) {
    var ch = save.chars[id]; if (!ch || !DS.canEquip(ch, g.id)) return;
    var gain = DS.gearScore(g, ch) - DS.gearScore(DS.gear(ch[g.slot]), ch);      // 2.1.0: 그 사람의 레벨·병과로
    if (gain > 0.5 && (!best || gain > best.gain)) best = { ch: ch, gain: gain };
  });
  return best;
}
var SHOW = [['hp', 'HP'], ['atk', '공격'], ['mag', '마공'], ['def', '방어'], ['res', '마방'], ['mp', '마나']];
// 입혔을 때 능력치가 어떻게 바뀌는지 (바뀌는 것만)
function diffHtml(ch, g) {
  var a = DS.charStats(ch), c2 = {}, k; for (k in ch) c2[k] = ch[k]; c2[g.slot] = g.id;
  var b = DS.charStats(c2), out = [];
  function add(label, x, y, fmt) { if (x === y) return; out.push(DS.chip(label, fmt(x) + '→' + fmt(y), y < x ? -1 : 1)); }
  var num = function (v) { return String(v); }, pc = function (v) { return pct(v) + '%'; }, one = function (v) { return String(Math.round(v * 10) / 10); };
  SHOW.forEach(function (s) { add(s[1], a[s[0]], b[s[0]], num); });
  add('치명', pct(a.crit), pct(b.crit), function (v) { return v + '%'; });
  add('행동 회복', Math.round(a.spd * 10), Math.round(b.spd * 10), function (v) { return String(v / 10); });
  add('사거리', a.rng[1], b.rng[1], num);
  add('흡혈', pct(a.drain || 0), pct(b.drain || 0), function (v) { return v + '%'; });
  return out.length ? '<span class="schips">' + out.join('') + '</span>' : '능력치 변화 없음';
}
var sortBy = 'grade';
var lowOpen = false, LOW_FOLD = 5, TOP_MAX = 12;      // r8 menus: 가방의 「지금 것보다 좋지 않은」 장비가 이보다 많으면 한 줄로 접는다 (이 판 동안 기억)
function bagIds(save) {
  var ids = Object.keys(save.gear).filter(function (id) { return DS.gear(id) && save.gear[id] > 0; });
  ids.sort(function (x, y) {
    var a = DS.gear(x), b = DS.gear(y);
    if (sortBy === 'kind') return (a.slot < b.slot ? 1 : a.slot > b.slot ? -1 : 0) || (a.cat < b.cat ? -1 : a.cat > b.cat ? 1 : 0) || DS.gearScore(b) - DS.gearScore(a);
    if (sortBy === 'score') return DS.gearScore(b) - DS.gearScore(a);
    return b.grade - a.grade || DS.gearScore(b) - DS.gearScore(a);
  });
  return ids;
}
function sellList(save, withPlain) {
  var ids = [], gold = 0, n = 0;
  Object.keys(save.gear).forEach(function (id) {
    var g = DS.gear(id); if (!g || save.lock[id] || g.grade >= 5 || (g.enh || 0) >= 1 || (g.grade === 1 && !withPlain)) return;      // 잠근 것·전설·강화한 것(+1 이상)은 일괄 판매에서 빼 둔다
    ids.push(id); n += save.gear[id]; gold += g.sell * save.gear[id];
  });
  return { ids: ids, n: n, gold: gold };
}
var BSEL = {};      // r12: 가방 여럿 고르기 (장비 id → 1). 이 판 동안만
function bselCan(save, id) { var g = DS.gear(id); return !!g && save.gear[id] > 0 && !save.lock[id]; }
function bselInfo(save) { var ids = Object.keys(BSEL).filter(function (id) { return bselCan(save, id); }), n = 0, gold = 0; ids.forEach(function (id) { var g = DS.gear(id); n += save.gear[id]; gold += g.sell * save.gear[id]; }); return { ids: ids, n: n, gold: gold }; }
DS.lootUI = {
  // 가방 탭의 장비 구역 (HTML). r12: 줄 문법 = [고르기] 그림 · 눈금 이름 · 수치 · 줄 끝 「장착」 하나. 줄을 누르면 자세히. 파는 것은 창 아래 붉은 단추 하나
  bag: function (save) {
    lootState(save);
    var ids = bagIds(save), fancy = fancyCount(save), sl = sellList(save, true), si = bselInfo(save), h = '';
    h += '<h4>장비 ' + ids.length + '종 <small class="lcount' + (fancy >= DS.DROP.bag ? ' full' : '') + '">유니크·전설 ' + fancy + ' / ' + DS.DROP.bag + '</small></h4>';
    if (!ids.length) return h + '<p class="hint">가방에 남는 장비가 없다.</p>';
    h += DS.ui.listTools([['grade', '등급'], ['score', '좋은 순'], ['kind', '종류']].map(function (s) { return '<button data-loot-sort="' + s[0] + '"' + (sortBy === s[0] ? ' aria-pressed="true"' : '') + '>' + s[1] + '</button>'; }).join(''), '',
      (si.n ? '<b class="num">' + si.n + '</b>점 선택 <button class="lnk" data-loot-pick="none">해제</button>' : '여럿 골라 한꺼번에 판다') + (sl.n ? ' <button class="lnk" data-loot-pick="all">정리할 ' + sl.n + '점 선택</button>' : ''));
    var row = function (id) {
      var g = DS.gear(id), bt = better(save, g), lk = !!save.lock[id], on = !!BSEL[id] && !lk, ax = (g.affix || []).map(function (a) { return a.pre ? esc(a.name) : '〈' + esc(a.name) + '〉'; }).concat((g.special || []).length ? ['고유'] : []);
      return '<div class="row lrow grow' + (on ? ' on' : '') + '" data-loot-open="' + esc(id) + '"><button class="ck" data-loot-ck="' + esc(id) + '" role="checkbox" aria-checked="' + on + '" aria-label="선택"' + (lk ? ' disabled' : '') + '></button>' + (DS.iconHtml ? DS.iconHtml('gear', id) : '') + '<div class="tx">' + DS.gearTitle(g) +
        DS.statChips(g.stat, '', ax.length ? '<span class="sch tag laxn">' + ax.join(' ') + '</span>' : '') +
        '<small class="lmeta"><i class="lcnt">×' + save.gear[id] + '</i>' + (lk ? '<i class="llock">잠김</i>' : '') + (bt ? '<em class="lup">▲ ' + esc(DS.charName(bt.ch)) + '에게 더 좋다</em>' : '') + '</small></div>' +
        '<button class="btn small' + (bt ? ' gold' : '') + '" data-wearpick="' + esc(id) + '">장착</button></div>';
    };
    var cut = 4, top = [], low = [], open = function (id) { var g = DS.gear(id); return (cut === 4 ? g.grade >= 4 : g.grade >= 5 || !!save.lock[id]) || !!better(save, g); };
    if (ids.filter(open).length > TOP_MAX) cut = 5;
    ids.forEach(function (id) { (open(id) ? top : low).push(id); });
    if (low.length <= LOW_FOLD) { ids.forEach(function (id) { h += row(id); }); return h; }
    top.forEach(function (id) { h += row(id); });
    var lsel = low.filter(function (id) { return BSEL[id]; }).length;
    h += '<button class="pfold' + (lowOpen ? ' on' : '') + '" data-loot-low="1" aria-expanded="' + lowOpen + '"><b>' + (cut === 5 ? '기타 장비' : '보통 장비') + ' ' + low.length + '종' + (lsel ? ' <em>' + lsel + ' 선택</em>' : '') + '</b><small>지금 쓰는 것보다 좋지 않은 장비</small><i aria-hidden="true">' + (lowOpen ? '▾' : '▸') + '</i></button>';
    if (lowOpen) low.forEach(function (id) { h += row(id); });
    return h;
  },
  // 창 아래 줄의 으뜸 행동(붉은 판매 단추). 고른 것이 없으면 ''
  sellSel: function (redraw) { sellSel(redraw); },
  sellFoot: function (save) { var si = bselInfo(save); return si.n ? '<button class="btn red" data-loot-sellsel="1">' + si.n + '점 판매 +' + si.gold + '</button>' : ''; },
  // root = 가방이 그려지는 창(다시 그려도 남는 요소), redraw = 다시 그리는 함수. 한 번만 묶인다.
  bind: function (root, redraw) {
    if (!root || root._lootBound) return; root._lootBound = true;
    root.addEventListener('click', function (e) {
      var U = DS.ui, s = DS.G.save, t = e.target, b;
      if (!t.closest) return;
      if ((b = t.closest('[data-loot-sort]'))) { sortBy = b.dataset.lootSort; U.A('tap'); redraw(); return; }
      if ((b = t.closest('[data-loot-low]'))) { lowOpen = !lowOpen; U.A('tap'); redraw(); return; }
      if ((b = t.closest('[data-loot-ck]'))) { var id = b.dataset.lootCk; if (BSEL[id]) delete BSEL[id]; else BSEL[id] = 1; U.A('tap'); redraw(); return; }
      if ((b = t.closest('[data-loot-pick]'))) { if (b.dataset.lootPick === 'none') BSEL = {}; else sellList(s, true).ids.forEach(function (i) { BSEL[i] = 1; }); U.A('tap'); redraw(); return; }
      if ((b = t.closest('[data-loot-sellsel]'))) { U.A('tap'); sellSel(redraw); return; }
      if (t.closest('[data-wearpick]')) return;      // 줄 끝 「장착」은 ui.js 가 받는다
      if ((b = t.closest('[data-loot-open]'))) { U.A('tap'); detail(b.dataset.lootOpen, redraw); return; }
    });
  },
  // 결과 창의 전리품 줄들 (<ul class="loot"> 안에 넣는 <li> 묶음)
  list: function (drops) {
    var h = '', items = {}, order = [];
    (drops || []).forEach(function (d) {
      if (d.kind === 'item') { if (!items[d.id]) { items[d.id] = 0; order.push(d.id); } items[d.id] += d.n; return; }
      if (d.kind === 'bounty') { h += '<li class="ldrop lr' + (d.grade || 4) + ' lbty"><b>' + esc(d.line || d.name) + '</b></li>'; return; }      // 현상금 달성 · 깃술 조각
      var g = DS.gear(d.id); if (!g) return;
      h += '<li class="ldrop lr' + g.grade + '">' + (DS.iconHtml ? DS.iconHtml('gear', d.id, { cls: 'li-ico' }) : '') + '<b>' + gname(g) + '</b> ' + tagsH([DS.gearTag(g) || '보통', esc(g.kind), d.boss ? '보스 전리품' : d.zl ? '이 땅의 전설' : '', d.sold ? '가방이 가득해 ' + d.sold + '골드에 팔았다' : ''], 'lgr') + DS.statChips(g.stat) + (d.sold ? '' : ghLine(d.id));
      (g.affix || []).forEach(function (a) { h += '<small class="lax"><i>' + (a.pre ? esc(a.name) : '〈' + esc(a.name) + '〉') + '</i> ' + esc(a.desc) + '</small>'; });
      (g.special || []).forEach(function (x) { h += '<small class="lax"><i>고유</i> ' + esc(x) + '</small>'; });
      if (g.lore) h += '<small class="llore">' + esc(g.lore) + '</small>';
      h += '</li>';
    });
    order.forEach(function (k) { h += '<li>' + (DS.iconHtml ? DS.iconHtml('item', k, { cls: 'li-ico sm', size: 24 }) : '') + esc(DS.ITEMS[k].name) + ' ×' + items[k] + '</li>'; });
    return h;
  },
  // 떨어진 자리에 띄울 한 줄: { text, col, sfx }
  floatOf: function (d) {
    var col = d.kind === 'gear' ? DS.gearCol(d.grade || 1) : DS.GRADES[d.grade || 1].col;
    if (d.kind === 'item') return { text: d.name + ' +' + d.n, col: '#bfe9a8', sfx: 'coin' };
    return { text: d.name + (d.sold ? ' (판매 +' + d.sold + ')' : ''), col: d.grade <= 1 ? '#efe6d0' : col, sfx: d.grade >= 5 ? 'rare' : d.grade >= 4 ? 'level' : 'star' };
  },
  // 용병에게 물건을 들려 주는 창. redraw = 닫힌 뒤 다시 그릴 함수(없어도 된다)
  mercItem: function (save, mercId, redraw) {
    var U = DS.ui, m = save.mercs.filter(function (x) { return x.id === mercId; })[0]; if (!m) return null;
    function body() {
      var cur = m.it && own(MGEAR, m.it) ? MGEAR[m.it] : null, h = '<div class="result ldet"><h2>' + esc(DS.mercCall(m)) + '의 물건</h2>' +
        '<p class="rn">' + (cur ? '지금 ' + esc(cur.name) + '. ' + esc(cur.desc.replace('사람에게 장착한다. ', '')) : '장착한 물건이 없다.') + '</p><p class="lock">쓰러지면 장착한 물건도 함께 잃는다.</p><div class="lcmp">', any = false;
      Object.keys(MGEAR).forEach(function (k) {
        var n = save.items[k] || 0; if (!n) return; any = true;
        h += '<div class="row">' + (DS.iconHtml ? DS.iconHtml('item', k) : '') + '<div class="tx"><b>' + esc(MGEAR[k].name) + ' <i class="own">× ' + n + '</i></b><small>' + esc(MGEAR[k].desc.replace('사람에게 장착한다. ', '')) + '</small></div><button class="btn small gold" data-mg="' + k + '">' + (cur ? '교체' : '장착') + '</button></div>';
      });
      if (!any) h += '<p class="hint">가방에 장착할 물건이 없다. 적이 가끔 떨어뜨린다.</p>';
      return h + '</div>' + (cur ? '<button class="btn wide" data-mg="">해제</button>' : '') + '<button class="btn wide" data-close>닫기</button></div>';
    }
    var o = U.overlay(body(), 'modal center');
    o.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mg]'); if (!b) return;
      if (DS.giveMercItem(save, mercId, b.dataset.mg || null)) { U.A('ok'); if (DS.refreshUnits) DS.refreshUnits(); U.persist(); o.querySelector('.sheet').innerHTML = body(); }
    });
    o.onclose = function () { if (redraw) redraw(); };
    return o;
  }
};
// 한 점 자세히: 설명·사연, 누구에게 입히면 어떻게 바뀌는지, 잠금·판매
function detail(id, redraw) {
  var U = DS.ui, s = DS.G.save;
  function body() {
    var g = DS.gear(id); if (!g || !(s.gear[id] > 0)) return '';
    var lk = !!s.lock[id], h = '<div class="result ldet lr' + g.grade + '"><h2>' + (DS.iconHtml ? DS.iconHtml('gear', id, { cls: 'ldico' }) : '') + gname(g) + '</h2><p class="lsub">' + tagsH([DS.gearTag(g) ? esc(DS.gearTag(g)) : '', esc(g.kind), '×' + s.gear[id], lk ? '잠김' : '']) + '</p><p class="lstat">' + DS.statChips(g.stat) + '</p>' +
      '<p class="lscale">수치는 입은 사람의 레벨을 따른다 (지금 부대 Lv ' + DS.gearRefL() + ' 기준)</p>';
    var gs = DS.ghParts(s, id), gc = DS.ghChain(s, id);
    if (gs.length || gc) h += '<p class="lher">' + tagsH(gs.map(esc), 'gh') + (gs.length && gc ? '<br>' : '') + esc(gc) + '</p>';
    (g.affix || []).forEach(function (a) { h += '<p class="lax"><i>' + (a.pre ? esc(a.name) : '〈' + esc(a.name) + '〉') + '</i> ' + esc(a.desc) + '</p>'; });
    (g.special || []).forEach(function (t) { h += '<p class="lax"><i>고유</i> ' + esc(t) + '</p>'; });
    if (g.lore) h += '<p class="llore">' + esc(g.lore) + '</p>';
    var list = DS.charList(s).filter(function (c) { return DS.canEquip(c, id); });
    list.sort(function (a, b) { var ia = s.party.indexOf(a.id), ib = s.party.indexOf(b.id); return (ia < 0 ? 9 : ia) - (ib < 0 ? 9 : ib) || a.id - b.id; });
    h += '<div class="lcmp">';
    list.forEach(function (ch) {
      var cur = DS.gear(ch[g.slot]), gain = DS.gearScore(g, ch) - DS.gearScore(cur, ch), dtx = diffHtml(ch, g), off = !DS.gearFits(ch.cls, g);
      if (dtx === '능력치 변화 없음') { gain = 0; if (cur && cur.id !== g.id && ((g.affix && g.affix.length) || (cur.affix && cur.affix.length))) dtx = '능력치 같음, 옵션만 다름'; }      // r4 forge: 숫자가 그대로인데 ▲ 가 뜨던 것 (audit F7)
      h += '<div class="row">' + U.charSpr(ch, 2) + '<div class="tx"><b>' + esc(DS.charName(ch)) + (s.party.indexOf(ch.id) < 0 ? ' <i class="own">대기</i>' : '') + ' <em class="' + (gain < 0 ? 'neg' : '') + '">' + (gain > 0.5 ? '▲' : gain < -0.5 ? '▼' : '＝') + '</em></b>' +
        '<small>지금 ' + (cur ? esc(cur.name) : '없음') + '</small>' + (off ? '<span class="schips">' + offChip() + '</span>' : '') + (/^</.test(dtx) ? dtx : '<small>' + dtx + '</small>') + '</div><button class="btn small' + (gain > 0.5 ? ' gold' : '') + '" data-loot-wear="' + ch.id + '">장착</button></div>';
    });
    var er = DS.forgeOpen && DS.enhRate ? DS.enhRate(g) : 0;      // r4 forge: 무기·방어구는 여기서 바로 강화 (확률·부서짐을 단추 곁에)
    var ec = er && DS.enhCost ? DS.enhCost(g) : 0;      // r37: 강화 값 (골드)
    h += '</div>' + (er ? '<button class="btn wide' + (s.gold < ec ? ' poor' : '') + '" data-loot-enh="1">강화 ' + er + '% <small class="bsub"><i>+' + g.enh + ' → +' + (g.enh + 1) + '</i><i>' + (s.gold < ec ? '골드 부족 ' : '') + ec.toLocaleString() + '골드</i></small></button>' : '') +
      '<button class="btn wide" data-loot-lock="1" aria-pressed="' + lk + '">' + (lk ? '잠금 해제' : '잠금') + '</button>' +
      '<div class="dangerz one"><button class="btn red wide" data-loot-sell="1"' + (lk ? ' disabled' : '') + '>판매 +' + g.sell + '</button></div>' +
      '<button class="btn wide" data-close>닫기</button></div>';
    return h;
  }
  var first = body(); if (!first) return;
  var o = U.overlay(first, 'modal center');
  function again() { var b = body(); if (!b) { o.close(); return; } o.querySelector('.sheet').innerHTML = b; if (U.hydrate) U.hydrate(o); }
  if (U.hydrate) U.hydrate(o);
  o.addEventListener('click', function (e) {
    var g = DS.gear(id), b;
    if ((b = e.target.closest('[data-loot-wear]'))) {
      var ch = s.chars[+b.dataset.lootWear];
      if (ch && DS.equip(s, ch, id)) { U.A('ok'); if (DS.refreshUnits) DS.refreshUnits(); U.persist(); U.toast(DS.charName(ch) + ': ' + g.name + ' 장착'); o.close(); }
      return;
    }
    if (e.target.closest('[data-loot-enh]')) {      // r4 forge: 강화 창은 ui.js 의 것. 성공하면 이 창이 강화한 무기를 따라간다
      U.A('tap'); DS.forgeOpen({ id: id }, { done: function (res, ref) { if (ref && ref.id && s.gear[ref.id] > 0) id = ref.id; else if (res.ok && res.to && s.gear[res.to.id] > 0 && !(s.gear[id] > 0)) id = res.to.id; }, close: again });
      return;
    }
    if (e.target.closest('[data-loot-lock]')) { if (s.lock[id]) delete s.lock[id]; else s.lock[id] = 1; U.A('tap'); U.persist(); again(); return; }
    if (e.target.closest('[data-loot-sell]')) {
      if (s.lock[id]) return;
      var doSell = function () { if (!(s.gear[id] > 0)) return; s.gear[id]--; if (!s.gear[id]) delete s.gear[id]; DS.ghTidy(s); s.gold += g.sell; U.A('coin'); U.persist(); again(); };
      if (g.grade >= 4 || g.enh >= 1) ask('판매할까?', gname(g) + '<br>판매한 물건은 되돌릴 수 없다.', '판매 +' + g.sell + '골드', doSell); else doSell();
    }
  });
  o.onclose = function () { if (redraw) redraw(); };
}
// 화면 안의 확인 창 (confirm 은 쓰지 못한다)
function ask(title, html, yes, fn) {
  var U = DS.ui, q = U.overlay('<div class="result ldet"><h2>' + title + '</h2><p>' + html + '</p><button class="btn red wide" data-loot-yes="1">' + yes + '</button><button class="btn wide" data-close>취소</button></div>', 'modal center');
  q.addEventListener('click', function (e) { if (e.target.closest('[data-loot-yes]')) { q.close(); fn(); } });
}
function sellSel(redraw) {      // 고른 것을 판다: 확인 창 하나, 확인 단추만 「판다 +n골드」
  var U = DS.ui, s = DS.G.save, si = bselInfo(s);
  if (!si.n) return;
  var fancy = si.ids.filter(function (id) { var g = DS.gear(id); return g.grade >= 5 || (g.enh || 0) >= 1; });
  var q = U.overlay('<div class="result ldet"><h2>' + si.n + '점을 팔까?</h2><ul class="mlist">' + si.ids.slice(0, 12).map(function (id) { return '<li>' + DS.gearTitle(DS.gear(id)) + (s.gear[id] > 1 ? ' ×' + s.gear[id] : '') + '</li>'; }).join('') + (si.ids.length > 12 ? '<li>그 외 ' + (si.ids.length - 12) + '종</li>' : '') + '</ul>' +
    (fancy.length ? '<p class="mwarn">전설이나 강화한 장비 ' + fancy.length + '점이 들어 있다.</p>' : '') + '<p class="dim">판매한 물건은 되돌릴 수 없다.</p>' +
    '<button class="btn red wide" data-loot-yes="1">판매 +' + si.gold + '골드</button><button class="btn wide" data-close>취소</button></div>', 'modal center');
  q.addEventListener('click', function (e) {
    if (!e.target.closest('[data-loot-yes]') || q.dataset.done) return; q.dataset.done = '1';
    var L = bselInfo(s);
    L.ids.forEach(function (id) { delete s.gear[id]; });
    BSEL = {}; DS.ghTidy(s); s.gold += L.gold; U.A('coin'); U.persist(); q.close(); U.toast(L.n + '점을 팔아 ' + L.gold + '골드를 받았다.'); redraw();
  });
}
})();
