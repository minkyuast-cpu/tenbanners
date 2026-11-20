// 전민 — 2.3.0 「더 다채로운 적」: 새 몬스터 열둘 · 여러 칸을 차지하는 큰 보스 (1×2 · 2×1 · 2×2 · 4×2 · 2×4) · 예고 · 돌진 · 충격파 · 땅의 위험 · 격노 · 비기(보스 컷인)
//   엔진 규칙(차지 · 길 찾기 · 거리 · 밀기 거부 …)은 engine.js 의 「2.3.0 큰 몸」 머리말에 있다. 여기는 표(기술 · 몬스터 · 보스 · 지역 · 시나리오 · 갱도)만.
//   그림은 art5.js (작은 몬스터는 새 그림 표 · 큰 보스는 몸 크기 그대로 그린 큰 그림), 화면은 view.js (큰 몸 · 예고 · 땅의 위험 · 격노) · game.js (등장 연출 · 보스 컷인)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var SK = DS.SKILLS, EN = DS.ENEMIES, BO = DS.BOSSES; if (!SK || !EN || !BO) return;

// 큰 몸의 체력 배율 (차지하는 칸 수 → 배율). 둘레에 붙어 때릴 자리가 넓어진 몫을 되돌린다 (봇 · 권장 재기로 맞춘 값)
DS.BIG_HP = { 2: 1.05, 4: 1.12, 8: 1.2 };

// ───────── 기술 ─────────
var NEW_SK = {
  // ── 새 몬스터 ──
  e_blast:    { name: '자폭', tick: 30, tg: 'self', area: 'r1', side: 'enemy', cast: 1.1, fx: 'fire', ai: 'bomb', cd: 99, eff: [{ t: 'dmg', m: 1.9, type: 'magic' }, { t: 'status', s: 'burn', dur: 6, p: 2 }, { t: 'boom' }] },
  e_ward:     { name: '수호 부적', tick: 40, tg: 'self', fx: 'ward', ai: 'ward', cd: 9, eff: [{ t: 'ward', r: 3, m: 1.0, dur: 10 }] },
  e_drum:     { name: '전투 북', tick: 40, tg: 'self', area: 'all', side: 'ally', fx: 'buffRed', ai: 'buff', cd: 18, eff: [{ t: 'buff', s: 'atk', p: 15, dur: 10 }] },
  e_bulwark:  { name: '방패 세우기', tick: 35, tg: 'self', area: 'adj', side: 'ally', fx: 'guard', ai: 'ward', cd: 11, eff: [{ t: 'buff', s: 'shd', m: 0.9, stat: 'atk', dur: 8 }, { t: 'buff', s: 'shd', m: 1.2, stat: 'atk', dur: 8, to: 'self' }, { t: 'taunt', to: 'foe', r: 2, dur: 4, p: 30 }] },
  e_soak:     { name: '물벼락', tick: 45, rng: [1, 4], tg: 'tile', area: 'r1', cast: 1.2, fx: 'water', cd: 11, eff: [{ t: 'dmg', m: 0.6, type: 'magic' }, { t: 'status', s: 'wet', dur: 10 }] },
  e_chain:    { name: '사슬 번개', tick: 50, rng: [1, 4], tg: 'enemy', fx: 'thunder', cd: 8, eff: [{ t: 'dmg', m: 0.95, type: 'magic', vs: 'wet', vx: 1.5 }, { t: 'chain', n: 2, r: 2, m: 0.6, type: 'magic' }] },
  e_burrow:   { name: '땅굴 습격', tick: 50, rng: [2, 6], tg: 'unit', area: 'r1', cast: 1.4, fx: 'quake', ai: 'far', cd: 10, eff: [{ t: 'emerge' }, { t: 'dmg', m: 1.25 }, { t: 'status', s: 'slow', dur: 4 }] },
  e_shadow:   { name: '그림자 걸음', tick: 45, rng: [2, 6], tg: 'unit', cast: 0.8, fx: 'dark', ai: 'far', cd: 9, eff: [{ t: 'emerge' }, { t: 'dmg', m: 1.5, vs: 'low', vx: 1.3 }, { t: 'status', s: 'mark', dur: 6, p: 20 }] },
  e_spit:     { name: '독물 쏘기', tick: 45, rng: [1, 3], tg: 'tile', area: 'single', fx: 'poison', cd: 9, eff: [{ t: 'dmg', m: 0.8, type: 'magic', stat: 'atk' }, { t: 'status', s: 'poison', dur: 8, p: 3 }, { t: 'hazard', k: 'poison', dur: 5, p: 2 }] },
  e_frostbolt:{ name: '서리 화살', tick: 45, rng: [1, 3], tg: 'enemy', fx: 'frost', cd: 7, eff: [{ t: 'dmg', m: 1.0, type: 'magic' }, { t: 'status', s: 'slow', dur: 5 }] },
  e_wail:     { name: '울부짖음', tick: 50, tg: 'self', area: 'r2', side: 'enemy', cast: 1.4, fx: 'dark', ai: 'near', near: 2, cd: 12, eff: [{ t: 'dmg', m: 0.85, type: 'magic' }, { t: 'gauge', v: -30 }, { t: 'status', s: 'slow', dur: 4 }] },
  e_firewall: { name: '불길 긋기', tick: 55, tg: 'dir', len: 4, cast: 1.2, fx: 'fire', cd: 12, eff: [{ t: 'dmg', m: 0.9, type: 'magic' }, { t: 'hazard', k: 'fire', dur: 6, p: 3, s: 'burn' }] },
  e_pounce:   { name: '덮치기', tick: 45, rng: [2, 3], tg: 'enemy', leap: true, fx: 'slash', cd: 8, eff: [{ t: 'dmg', m: 1.2 }, { t: 'status', s: 'burn', dur: 4, p: 2 }] },
  b_sumScorp: { name: '새끼 전갈', tick: 50, tg: 'self', fx: 'quake', ai: 'summon', cap: 4, cd: 16, eff: [{ t: 'summon', type: 'scorpion', n: 2 }] },
  b_sumSlime: { name: '진흙 토하기', tick: 50, tg: 'self', fx: 'poison', ai: 'summon', cap: 4, cd: 16, eff: [{ t: 'summon', type: 'slime', n: 2 }] },
  b_sumHound: { name: '사냥개 부름', tick: 50, tg: 'self', fx: 'fire', ai: 'summon', cap: 4, cd: 16, eff: [{ t: 'summon', type: 'hellhound', n: 2 }] },
  // ── 큰 보스 (예고 뒤 발동) ──
  bb_rush:     { name: '돌진', tick: 50, tg: 'dir', len: 6, cast: 1.6, dash: true, fx: 'thrust', cd: 11, minN: 1, eff: [{ t: 'dmg', m: 1.45 }, { t: 'knock', n: 1, dir: 'side' }, { t: 'gauge', v: -20 }] },
  bb_slam:     { name: '땅울림', tick: 50, tg: 'self', area: 'r2', side: 'enemy', cast: 2.0, fx: 'quake', ai: 'near', near: 3, cd: 12, eff: [{ t: 'dmg', m: 1.35 }, { t: 'knock', n: 2 }, { t: 'gauge', v: -25 }] },
  bb_stomp:    { name: '발 구르기', tick: 40, tg: 'self', area: 'adj', side: 'enemy', fx: 'quake', ai: 'near', near: 1, cd: 7, eff: [{ t: 'dmg', m: 1.05 }, { t: 'knock', n: 1 }] },
  bb_tail:     { name: '꼬리 후리기', tick: 40, tg: 'self', area: 'adj', side: 'enemy', fx: 'slash', ai: 'near', near: 1, cd: 8, eff: [{ t: 'dmg', m: 1.15 }, { t: 'knock', n: 1 }] },
  bb_rocks:    { name: '바위 비', tick: 55, tg: 'multi', n: 6, area: 'single', cast: 2.2, fx: 'quake', cd: 13, eff: [{ t: 'dmg', m: 1.3 }, { t: 'status', s: 'slow', dur: 5 }] },
  bb_meteor:   { name: '불비', tick: 55, tg: 'multi', n: 6, area: 'single', cast: 2.4, fx: 'meteor', cd: 14, eff: [{ t: 'dmg', m: 1.35, type: 'magic' }, { t: 'hazard', k: 'fire', dur: 5, p: 3, s: 'burn' }] },
  bb_pool:     { name: '독웅덩이', tick: 50, tg: 'multi', n: 4, area: 'r1', cast: 1.8, fx: 'poison', cd: 13, eff: [{ t: 'dmg', m: 0.9, type: 'magic', stat: 'atk' }, { t: 'hazard', k: 'poison', dur: 7, p: 3, s: 'poison', every: 2 }] },
  bb_firebreath: { name: '불숨', tick: 50, tg: 'dir', len: 4, cone: true, cast: 1.8, fx: 'fire', cd: 11, minN: 1, eff: [{ t: 'dmg', m: 1.4, type: 'magic' }, { t: 'status', s: 'burn', dur: 6, p: 2 }, { t: 'hazard', k: 'fire', dur: 5, p: 3, every: 2 }] },
  bb_frostbreath:{ name: '서리숨', tick: 50, tg: 'dir', len: 4, cone: true, cast: 1.8, fx: 'frost', cd: 11, minN: 1, eff: [{ t: 'dmg', m: 1.3, type: 'magic' }, { t: 'status', s: 'slow', dur: 8 }, { t: 'hazard', k: 'frost', dur: 5, p: 2, s: 'slow', every: 2 }] },
  bb_venombreath:{ name: '독숨', tick: 50, tg: 'dir', len: 4, cone: true, cast: 1.8, fx: 'poison', cd: 11, minN: 1, eff: [{ t: 'dmg', m: 1.1, type: 'magic', stat: 'atk' }, { t: 'status', s: 'poison', dur: 10, p: 4 }, { t: 'hazard', k: 'poison', dur: 6, p: 3, every: 2 }] },
  bb_bonebreath: { name: '망자의 숨', tick: 50, tg: 'dir', len: 4, cone: true, cast: 1.8, fx: 'dark', cd: 11, minN: 1, eff: [{ t: 'dmg', m: 1.4, type: 'magic' }, { t: 'buff', s: 'atk', p: -20, dur: 10 }] },
  bb_wing:     { name: '날갯짓', tick: 45, tg: 'self', area: 'r2', side: 'enemy', cast: 1.4, fx: 'wind', ai: 'near', near: 2, cd: 12, eff: [{ t: 'dmg', m: 0.8 }, { t: 'knock', n: 2 }, { t: 'gauge', v: -30 }] },
  bb_burrow:   { name: '땅굴', tick: 50, rng: [2, 7], tg: 'unit', area: 'r1', cast: 1.6, fx: 'quake', ai: 'far', cd: 14, eff: [{ t: 'emerge' }, { t: 'dmg', m: 1.2 }, { t: 'gauge', v: -20 }] },
  // ── 비기 (격노한 뒤에만 · 보스 컷인) ──
  bu_cataclysm: { name: '대지 붕괴', tick: 60, tg: 'self', area: 'r4', side: 'enemy', cast: 3.0, fx: 'quake', ai: 'enr', near: 6, bult: true, cd: 22, eff: [{ t: 'dmg', m: 1.8 }, { t: 'knock', n: 2 }, { t: 'gauge', v: -40 }] },
  bu_inferno:   { name: '겁화', tick: 60, tg: 'multi', n: 9, area: 'r1', cast: 3.0, fx: 'meteor', ai: 'enr', bult: true, cd: 22, eff: [{ t: 'dmg', m: 1.55, type: 'magic' }, { t: 'hazard', k: 'fire', dur: 6, p: 3, s: 'burn', every: 2 }] },
  bu_glacier:   { name: '얼음 시대', tick: 60, tg: 'self', area: 'r4', side: 'enemy', cast: 3.0, fx: 'frost', ai: 'enr', near: 6, bult: true, cd: 22, eff: [{ t: 'dmg', m: 1.5, type: 'magic' }, { t: 'status', s: 'slow', dur: 10 }, { t: 'gauge', v: -50 }] },
  bu_plague:    { name: '죽음의 안개', tick: 60, tg: 'multi', n: 9, area: 'r1', cast: 3.0, fx: 'poison', ai: 'enr', bult: true, cd: 22, eff: [{ t: 'dmg', m: 1.05, type: 'magic' }, { t: 'status', s: 'poison', dur: 10, p: 3 }, { t: 'hazard', k: 'poison', dur: 6, p: 3, every: 2 }] },
  bu_horn:      { name: '뿔 폭풍', tick: 60, tg: 'dir', len: 8, cast: 2.2, dash: true, fx: 'thrust', ai: 'enr', bult: true, cd: 18, eff: [{ t: 'dmg', m: 1.9 }, { t: 'knock', n: 1, dir: 'side' }, { t: 'gauge', v: -30 }] },
  bu_moon:      { name: '달 울음', tick: 60, tg: 'self', area: 'r3', side: 'enemy', cast: 2.4, fx: 'wind', ai: 'enr', near: 5, bult: true, cd: 20, eff: [{ t: 'dmg', m: 1.4 }, { t: 'gauge', v: -40 }, { t: 'status', s: 'slow', dur: 6 }] },
  bu_tomb:      { name: '왕의 저주', tick: 60, tg: 'multi', n: 8, area: 'single', cast: 2.6, fx: 'dark', ai: 'enr', bult: true, cd: 20, eff: [{ t: 'dmg', m: 1.5, type: 'magic' }, { t: 'buff', s: 'atk', p: -20, dur: 12 }] },
  bu_dusk:      { name: '어스름 강림', tick: 60, tg: 'self', area: 'ring', r0: 2, side: 'enemy', cast: 3.2, fx: 'dark', ai: 'enr', near: 6, bult: true, cd: 24, eff: [{ t: 'dmg', m: 1.9, type: 'magic' }, { t: 'gauge', v: -50 }] }
};
for (var k in NEW_SK) if (!SK[k]) SK[k] = NEW_SK[k];
DS.BIG_ULT = Object.keys(NEW_SK).filter(function (k) { return NEW_SK[k].bult; });

// ───────── 새 몬스터 ─────────
// 능력치는 비슷한 단의 옛 몬스터에 맞췄다. pri: 우리 편 자동 전투가 먼저 노릴 무게 · split: 쓰러지면 갈라진다 · aura: 둘레를 물들인다
var NEW_EN = {
  boomer:      { name: '불똥 도깨비', kind: 'beast', mt: 'foot', sprite: 'boomer', tags: ['fire'], passive: 'fireborn', skills: ['e_blast'], pri: 8,
                 base: { hp: 22, atk: 8, def: 2, mag: 12, res: 3 }, grow: { hp: 2.4, atk: 0.8, def: 0.35, mag: 1.2, res: 0.45 }, spd: 12, mv: 0.85, rng: [1, 1], atk: 'melee', info: '붙으면 터진다. 멀리서 잡아라.' },
  bigSlime:    { name: '왕슬라임', kind: 'beast', mt: 'foot', sprite: 'bigSlime', split: { type: 'slime', n: 2, dL: 1, hp: 0.75 },
                 base: { hp: 40, atk: 10, def: 3, mag: 0, res: 3 }, grow: { hp: 4.4, atk: 1.0, def: 0.55, mag: 0, res: 0.45 }, spd: 7, mv: 1.3, rng: [1, 1], atk: 'melee', info: '쓰러지면 둘로 갈라진다.' },
  gobShaman:   { name: '고블린 주술사', kind: 'mage', mt: 'foot', sprite: 'gobShaman', skills: ['e_ward', 'e_drum'], pri: 6,
                 base: { hp: 24, atk: 3, def: 2, mag: 11, res: 6 }, grow: { hp: 2.8, atk: 0.2, def: 0.4, mag: 1.1, res: 0.8 }, spd: 10, mv: 1, rng: [1, 3], atk: 'bolt', dtype: 'magic', info: '동료에게 보호막을 씌운다. 먼저 쳐라.' },
  skelGuard:   { name: '해골 방패병', kind: 'inf', mt: 'foot', sprite: 'skelGuard', tags: ['undead'], skills: ['e_bulwark'],
                 base: { hp: 44, atk: 10, def: 9, mag: 0, res: 3 }, grow: { hp: 4.6, atk: 1.0, def: 1.3, mag: 0, res: 0.45 }, spd: 8, mv: 1.2, rng: [1, 1], atk: 'melee', info: '방패를 세우고 눈길을 끈다. 신성에 약하다.' },
  sandworm:    { name: '모래 벌레', kind: 'beast', mt: 'foot', sprite: 'sandworm', skills: ['e_burrow'],
                 base: { hp: 46, atk: 14, def: 6, mag: 0, res: 3 }, grow: { hp: 4.6, atk: 1.25, def: 0.9, mag: 0, res: 0.45 }, spd: 9, mv: 1.1, rng: [1, 1], atk: 'melee', info: '모래 밑으로 숨어 뒷줄을 노린다.' },
  shade:       { name: '그림자 자객', kind: 'inf', mt: 'foot', sprite: 'shade', tags: ['demon'], skills: ['e_shadow'],
                 base: { hp: 30, atk: 15, def: 4, mag: 0, res: 6 }, grow: { hp: 3.2, atk: 1.35, def: 0.6, mag: 0, res: 0.8 }, spd: 13, mv: 0.8, rng: [1, 1], atk: 'melee', info: '그림자로 건너와 약한 이를 찌른다.' },
  stormcaller: { name: '파도 무당', kind: 'mage', mt: 'foot', sprite: 'stormcaller', skills: ['e_soak', 'e_chain'], pri: 4,
                 base: { hp: 26, atk: 3, def: 3, mag: 14, res: 8 }, grow: { hp: 2.9, atk: 0.2, def: 0.45, mag: 1.3, res: 1.0 }, spd: 10, mv: 1, rng: [1, 3], atk: 'bolt', dtype: 'magic', info: '물벼락으로 적시고 번개로 꿴다.' },
  toad:        { name: '독두꺼비', kind: 'beast', mt: 'swim', sprite: 'toad', passive: 'marine', skills: ['e_spit'], aura: { s: 'poison', r: 1, p: 2, dur: 4 },
                 base: { hp: 40, atk: 11, def: 5, mag: 8, res: 5 }, grow: { hp: 4.2, atk: 1.1, def: 0.8, mag: 0.8, res: 0.7 }, spd: 9, mv: 1.1, rng: [1, 1], atk: 'melee', info: '둘레에 독 기운이 돈다. 붙어 싸우면 중독된다.' },
  frostWisp:   { name: '서리 도깨비불', kind: 'spirit', mt: 'fly', sprite: 'frostWisp', tags: ['fly'], skills: ['e_frostbolt'], aura: { s: 'slow', r: 1, dur: 3 },
                 base: { hp: 24, atk: 2, def: 3, mag: 13, res: 9 }, grow: { hp: 2.6, atk: 0.2, def: 0.5, mag: 1.25, res: 1.0 }, spd: 12, mv: 0.8, rng: [1, 3], atk: 'bolt', dtype: 'magic', info: '곁에 서면 몸이 굳는다.' },
  banshee:     { name: '곡하는 망령', kind: 'spirit', mt: 'fly', sprite: 'banshee', tags: ['undead', 'ethereal'], skills: ['e_wail', 'e_drain'],
                 base: { hp: 30, atk: 3, def: 2, mag: 13, res: 9 }, grow: { hp: 3.2, atk: 0.2, def: 0.4, mag: 1.2, res: 1.0 }, spd: 11, mv: 0.9, rng: [1, 1], atk: 'bolt', dtype: 'magic', info: '울음이 게이지를 깎는다. 물리 공격은 절반.' },
  cultist:     { name: '잿불 광신도', kind: 'mage', mt: 'foot', sprite: 'cultist', skills: ['e_firewall', 'e_fire'],
                 base: { hp: 30, atk: 4, def: 3, mag: 15, res: 7 }, grow: { hp: 3.1, atk: 0.3, def: 0.5, mag: 1.35, res: 0.9 }, spd: 10, mv: 1, rng: [1, 3], atk: 'bolt', dtype: 'magic', info: '땅에 불길을 남긴다. 불 위에 서지 마라.' },
  hellhound:   { name: '지옥 사냥개', kind: 'beast', mt: 'foot', sprite: 'hellhound', tags: ['fire', 'demon'], passive: 'fireborn', skills: ['e_pounce'],
                 base: { hp: 38, atk: 15, def: 5, mag: 6, res: 6 }, grow: { hp: 3.9, atk: 1.35, def: 0.75, mag: 0.5, res: 0.8 }, spd: 14, mv: 0.75, rng: [1, 1], atk: 'melee', info: '빠르게 덮치고 불을 옮긴다.' }
};
for (k in NEW_EN) if (!EN[k]) EN[k] = NEW_EN[k];
DS.NEW_MOBS = Object.keys(NEW_EN);

// ───────── 큰 보스 ─────────
// sz: [가로, 세로] 칸 · enr: 격노 (th 체력 비율 아래로 떨어지면 한 번 — 공격 · 빠르기 + , add 비기) · 기술 목록은 옛 것을 바탕으로 큰 몸의 기술을 얹었다
var ENR = function (add, say, th) { return { th: th || 0.4, atk: 0.12, spd: 0.15, add: add, say: say || '격노' }; };
var BIG_STORY = {
  bargan:    { sz: [2, 2], skills: ['b_erupt', 'bb_slam', 'e_smash'], enr: ENR(['bu_inferno'], '목이 끓는다!') },
  tormak:    { sz: [1, 2], skills: ['bb_rush', 'b_quake', 'e_smash'], enr: ENR(['bu_horn'], '뿔이 달아오른다!') },
  twinsnake: { sz: [2, 1], skills: ['b_venom', 'bb_pool', 'bb_tail'], enr: ENR(['bu_plague'], '두 머리가 한꺼번에 운다') },
  warden:    { sz: [2, 2], skills: ['b_boulder', 'b_harden', 'bb_slam', 'e_smash'], enr: ENR(['bu_cataclysm'], '돌 눈이 붉게 탄다') },
  shara:     { sz: [2, 2], skills: ['b_spikes', 'bb_burrow', 'bb_tail'], enr: ENR(['bu_plague'], '여왕이 집게를 든다') },
  king:      { sz: [1, 2], skills: ['b_sumSkel', 'b_curse', 'b_dark'], enr: ENR(['bu_tomb'], '무덤이 운다') },
  gatekeeper:{ sz: [2, 2], skills: ['b_quake', 'b_sumImp', 'bb_rocks', 'e_smash'], enr: ENR(['bu_cataclysm'], '문이 무너진다') },
  swarm:     { sz: [2, 2], skills: ['b_sumImp', 'b_cloud', 'bb_wing', 'e_smash'], enr: ENR(['bu_plague'], '파리 떼가 하늘을 덮는다', 0.35) },
  bonewyrm:  { sz: [4, 2], skills: ['bb_bonebreath', 'b_sumSkel', 'bb_wing', 'bb_tail'], enr: ENR(['bu_plague'], '뼈가 일어선다', 0.35) },
  glacia:    { sz: [4, 2], skills: ['bb_frostbreath', 'b_frost', 'bb_wing', 'bb_tail'], enr: ENR(['bu_glacier'], '숨이 얼어붙는다', 0.35) },
  ignar:     { sz: [4, 2], skills: ['bb_firebreath', 'b_erupt', 'bb_tail', 'bb_meteor'], enr: ENR(['bu_inferno'], '화산이 깨어난다', 0.35) },
  duskking:  { sz: [2, 4], enr: ENR(['bu_dusk'], '문 너머가 열린다', 0.3) }
};
for (k in BIG_STORY) if (BO[k]) { var b0 = BO[k], X = BIG_STORY[k]; b0.sz = X.sz; if (X.skills) b0.skills = X.skills; b0.enr = X.enr; }
// 들판 보스 (field.js DS.FIELD_BOSS — 지역마다 하나, 드물게 나온다): 모두 큰 몸
var BIG_FIELD = {
  dawn:   { sz: [2, 1], skills: ['bb_rush', 'b_pounce', 'b_howl'], enr: ENR(['bu_moon'], '외눈이 달을 본다') },
  windy:  { sz: [1, 2], skills: ['b_quake', 'b_boulder', 'bb_rush'], enr: ENR(['bu_cataclysm'], '바람이 멎는다') },
  stone:  { sz: [2, 2], skills: ['b_boulder', 'bb_slam', 'b_harden'], enr: ENR(['bu_cataclysm'], '돌 눈이 불타오른다') },
  coast:  { sz: [4, 2], skills: ['b_tide', 'bb_venombreath', 'bb_tail'], enr: ENR(['bu_plague'], '비늘이 곤두선다') },
  isle:   { sz: [2, 2], skills: ['b_quake', 'b_boulder', 'bb_slam'], enr: ENR(['bu_cataclysm'], '섬이 흔들린다') },
  desert: { sz: [2, 2], skills: ['b_spikes', 'bb_burrow', 'b_sumScorp', 'bb_rush'], enr: ENR(['bu_plague'], '모래가 끓는다') },
  mire:   { sz: [2, 2], skills: ['b_dark', 'b_scythe', 'bb_pool'], enr: ENR(['bu_plague'], '물이 검어진다') },
  spire:  { sz: [1, 2], skills: ['b_cross', 'b_dark', 'bb_rush'], enr: ENR(['bu_tomb'], '첨탑이 사냥감을 고른다') },
  ash:    { sz: [2, 2], skills: ['b_erupt', 'bb_slam', 'bb_firebreath'], enr: ENR(['bu_inferno'], '재가 불이 된다') },
  end:    { sz: [4, 2], skills: ['b_meteor', 'bb_firebreath', 'bb_wing', 'bb_tail'], enr: ENR(['bu_inferno'], '재날개가 날개를 편다') }
};
for (k in BIG_FIELD) { var fb = BO['fb_' + k], fd = DS.FIELD_BOSS && DS.FIELD_BOSS[k], Y = BIG_FIELD[k]; if (fb) { fb.sz = Y.sz; fb.skills = Y.skills.slice(); fb.enr = Y.enr; } if (fd) { fd.sz = Y.sz; fd.skills = Y.skills.slice(); } }
if (BO.fb_coast) { BO.fb_coast.mt = 'swim'; BO.fb_coast.passive = 'marine'; }
if (BO.fb_end) { BO.fb_end.mt = 'fly'; BO.fb_end.tags = ['fly']; }
// 갱도 수문장 (5층마다 · 10층마다 밑바닥): 큰 몸 셋이 돈다 — 5 · 15 · 25 … 돌무쇠(2×2) · 10 · 30 … 거신(2×4) · 20 · 40 … 큰지렁이(4×2)
BO.pitGolem = { name: '돌무쇠', title: '갱도 수문장', like: 'golem', sprite: 'bb_pitGolem', pal: '', sz: [2, 2], mul: { hp: 2.8, atk: 1.15, def: 1.15, res: 3.0, spd: 1.2 }, skills: ['b_cavein', 'bb_slam', 'bb_stomp', 'e_smash'], guard: 4, enr: ENR(['bu_cataclysm'], '갱도가 무너진다') };
BO.pitWorm = { name: '바닥 큰지렁이', title: '갱도 밑바닥에 사는 것', like: 'sandworm', sprite: 'bb_pitWorm', pal: '', sz: [4, 2], mul: { hp: 2.8, atk: 1.15, def: 1.1, res: 2.4, spd: 1.1 }, skills: ['bb_burrow', 'bb_venombreath', 'bb_tail', 'b_cavein'], guard: 4, enr: ENR(['bu_plague'], '땅 밑이 꿈틀댄다') };
BO.pitTitan = { name: '갱도 거신', title: '바닥 없는 갱도의 주인', like: 'golem', sprite: 'bb_pitTitan', pal: '', sz: [2, 4], mul: { hp: 2.9, atk: 1.2, def: 1.2, res: 3.0, spd: 1.1 }, skills: ['b_cavein', 'bb_rocks', 'bb_slam', 'b_gloom', 'e_smash'], guard: 4, enr: ENR(['bu_cataclysm'], '거신이 일어선다') };
DS.BIG_BOSSES = Object.keys(BO).filter(function (k) { return BO[k].sz && (BO[k].sz[0] > 1 || BO[k].sz[1] > 1); });

// 이야기 글 (보스 카드 · 마지막 말)
if (DS.LORE) {
  DS.LORE.boss = DS.LORE.boss || {};
  DS.LORE.boss.pitGolem = DS.LORE.boss.pitGolem || { title: '갱도 수문장', say: '— 바위 문이 걸어 나온다.', last: '— 무너진 돌 사이로 아랫길이 보인다.' };
  DS.LORE.boss.pitWorm = DS.LORE.boss.pitWorm || { title: '갱도 밑바닥에 사는 것', say: '— 바닥이 울더니 입이 열린다.', last: '— 긴 몸이 땅속으로 다시 가라앉는다.' };
  DS.LORE.boss.pitTitan = DS.LORE.boss.pitTitan || { title: '바닥 없는 갱도의 주인', say: '더 내려온 자는… 없었다…', last: '그럼… 너희가… 처음이다…' };
}

// ───────── 지역마다 새 몬스터 (목록의 앞쪽이 낮은 레벨 — world.js 의 무리 고르기) ─────────
var ZONE_MOBS = {
  dawn:   ['slime', 'goblin', 'gobArcher', 'bigSlime', 'wolf'],
  windy:  ['goblin', 'wolf', 'gobArcher', 'gobShaman', 'orc', 'boomer', 'harpy'],
  stone:  ['orc', 'harpy', 'skeleton', 'skelGuard', 'darkMage', 'golem'],
  coast:  ['lizard', 'stormcaller', 'harpy', 'skelArcher', 'soldier', 'archer'],
  isle:   ['lizard', 'toad', 'golem', 'stormcaller', 'harpy', 'archer', 'soldier'],
  desert: ['scorpion', 'sandworm', 'mummy', 'skeleton', 'skelGuard', 'skelArcher', 'darkMage'],
  mire:   ['toad', 'ghost', 'skeleton', 'banshee', 'darkPriest', 'gargoyle', 'darkKnight'],
  spire:  ['demon', 'shade', 'gargoyle', 'darkKnight', 'banshee', 'darkMage', 'ghost'],
  ash:    ['demon', 'imp', 'boomer', 'iceGolem', 'frostWisp', 'salamander', 'cultist', 'darkKnight', 'darkPriest'],
  end:    ['hellhound', 'demon', 'gargoyle', 'shade', 'ghost', 'darkMage', 'cultist', 'salamander', 'frostWisp', 'iceGolem']
};
if (DS.ZONES) for (k in ZONE_MOBS) if (DS.ZONES[k] && DS.ZONES[k].mobs) DS.ZONES[k].mobs = ZONE_MOBS[k].filter(function (m) { return EN[m]; });
// 시나리오: 1~20 은 하나를 더하고, 21~30 은 비슷한 세기의 하나를 바꾼다 (2.2.9 에 이미 출렁이는 판 — 세기를 더 얹지 않는다)
var SCN_ADD = { 3: 'boomer', 4: 'gobShaman', 6: 'gobShaman', 7: 'skelGuard', 8: 'stormcaller', 10: 'stormcaller', 12: 'sandworm', 14: 'toad', 15: 'banshee', 17: 'shade' };
var SCN_SWAP = { 22: ['darkMage', 'cultist'], 23: ['imp', 'boomer'], 25: ['ghost', 'banshee'], 26: ['scorpion', 'sandworm'], 27: ['salamander', 'hellhound'], 29: ['gargoyle', 'hellhound'] };
if (DS.SCENARIOS) DS.SCENARIOS.forEach(function (s) {
  if (!s || !s.mobs) return;
  if (SCN_ADD[s.id] && s.mobs.indexOf(SCN_ADD[s.id]) < 0) s.mobs = s.mobs.concat([SCN_ADD[s.id]]);
  var sw = SCN_SWAP[s.id]; if (sw) s.mobs = s.mobs.map(function (m) { return m === sw[0] ? sw[1] : m; });
});
// 갱도: 층 묶음마다 새 몬스터 하나 · 수문장 층(5 · 10)은 큰 수문장
var PIT_ADD = ['skelGuard', 'banshee', 'boomer', 'stormcaller', 'sandworm', 'cultist'];
var pit0 = DS.pit;
if (pit0) DS.pit = function (f) {
  var s = pit0(f), g = Math.floor((s.pit - 1) / 3) % PIT_ADD.length, add = PIT_ADD[g];
  if (add && s.mobs.indexOf(add) < 0) s.mobs = s.mobs.concat([add]);
  if (s.pitKind === 10) s.boss = Math.floor(s.pit / 10) % 2 ? 'pitTitan' : 'pitWorm';
  else if (s.pitKind === 5) s.boss = 'pitGolem';
  return s;
};
// 큰 보스가 설 자리: 시나리오 지도에서 보스 자리(6, 2)에 몸이 들어가게 그 둘레를 비운다 (길만 넓어진다 — 막히는 일은 없다)
var bs0 = DS.buildScenario, FLOOR = { '#': 1, p: 1, M: 1, H: 1, F: 1, v: 1, w: 1, L: 1, s: 1, f: 0, h: 0 };
DS.bigSpot = function (s) {
  var B = s && s.boss && BO[s.boss], P2 = B && B.phase2 && BO[B.phase2], z = [1, 1];
  [B, P2].forEach(function (b) { if (b && b.sz) { z[0] = Math.max(z[0], b.sz[0]); z[1] = Math.max(z[1], b.sz[1]); } });
  return z[0] > 1 || z[1] > 1 ? { x: 6 - ((z[0] - 1) >> 1), y: 2, w: z[0], h: z[1] } : null;
};
if (bs0) DS.buildScenario = function (s, partyN, heroCls, forceDiff) {
  var r = bs0(s, partyN, heroCls, forceDiff), sp = DS.bigSpot(s);
  if (!sp || !r || !r.map) return r;
  var rows = r.map.map(function (row) { return row.split(''); }), base = rows[18][6], fl = base === 'v' ? '_' : (FLOOR[base] ? '.' : base);
  for (var y = sp.y; y < sp.y + sp.h && y < rows.length - 1; y++) for (var x = sp.x; x < sp.x + sp.w && x < rows[0].length - 1; x++) if (FLOOR[rows[y][x]]) rows[y][x] = fl;
  r.map = rows.map(function (row) { return row.join(''); });
  r.units.forEach(function (u) { if (u.obj && u.fw) { u.x = sp.x; u.y = sp.y; } });
  return r;
};
})();
