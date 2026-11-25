// 열 개의 깃발 — 병과별·단별 외형, 용병, 새 몬스터
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var P = DS.SPRP, HEAD = P.HEAD, BODY = P.BODY, ITEM = P.ITEM, RAW = P.RAW, compose = P.compose, def = P.def, SPR = DS.SPR, BIG = DS.BIG, BPAL = DS.BPAL;
DS.PAL.q = '#e0525e'; DS.PAL.Q = '#9c2f45'; DS.PAL.i = '#f6cf57'; DS.PAL.I = '#c08f2c';

// ── 새 머리 ──
HEAD.crown = [
  '....k.k..k.k....',
  '...kikikkikik...',
  '...kiiiiiiiIk...',
  '...kiriiiriIk...',
  '...kkkkkkkkkk...',
  '...khssssssHk...',
  '...khskssksHk...',
  '....kssssssk....'];
HEAD.tiara = [
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhiiiihhk...',
  '...khhhhhhhHk...',
  '...khssssssHk...',
  '...khskssksHk...',
  '...khssssssHk...'];
HEAD.veil = [
  '................',
  '.....kkkkkk.....',
  '....kwwwwwwk....',
  '...kwwwiiwwlk...',
  '...kwwwwwwwlk...',
  '...kwssssssLk...',
  '...kwskssksLk...',
  '....kssssssk....'];
HEAD.horned = [
  '..k..........k..',
  '.kwk.kkkkkk.kwk.',
  '.kwkkmmmmmmkkwk.',
  '..kwmwmmmmmMwk..',
  '...kmmmmmmmMk...',
  '...kMssssssMk...',
  '...kMskssksMk...',
  '....kssssssk....'];
HEAD.mask = [
  '................',
  '.....kkkkkk.....',
  '....kaaaaaak....',
  '...kaaaaaaaAk...',
  '...kaqqqqqqAk...',
  '...kassssssAk...',
  '...kaskssksAk...',
  '....kaaaaaak....'];
HEAD.bandage = [
  '................',
  '.....kkkkkk.....',
  '....kllllllk....',
  '...klLlllLllk...',
  '...kllLllllLk...',
  '...klkxllxklk...',
  '...kLlllLlllk...',
  '....klLllLlk....'];
// ── 새 장비 ──
ITEM.cape   = [1, 11, ['kq..........qk', 'kqq........qqk', 'kqQ........Qqk', '.kq........qk.', '..kk......kk..']];
ITEM.gsword = [11, 0, ['..w..', '.www.', '.www.', '.www.', '.www.', '.www.', '.www.', '.wMw.', 'iiiii', '..o..', '..o..']];
ITEM.spear  = [12, 0, ['.w.', '.w.', 'www', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.']];
ITEM.halberd = [11, 0, ['..w..', '.mw..', 'mmw..', 'mmw..', '.mo..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..']];
ITEM.lbow   = [11, 2, ['.wo.', 'w..o', 'w..o', 'w..o', 'w..o', 'w..o', 'w..o', 'w..o', 'w..o', '.wo.']];
ITEM.orb    = [11, 0, ['.kkk.', 'kcwck', 'kcccC', '.kkk.', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..']];
ITEM.mace   = [12, 2, ['mmm', 'mMm', 'mmm', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.']];
ITEM.wand   = [12, 3, ['.y.', 'yiy', '.y.', '.o.', '.o.', '.o.', '.o.', '.o.']];
ITEM.sstaff = [11, 0, ['.lll.', 'lklkl', '.lll.', '..l..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..']];
ITEM.kunai  = [12, 6, ['.w.', '.w.', '.M.', '.k.']];

// ── 새 통짜 스프라이트 ──
RAW.slime = [
  '................', '................', '................', '................', '................',
  '.....kkkkkk.....',
  '....keeeeeek....',
  '...keewweeeek...',
  '..keeeweeeeeek..',
  '..keekeeeekeEk..',
  '.keeekeeeekeeEk.',
  '.keeeeeeeeeeeEk.',
  '.keeeeekkeeeeEk.',
  '.kEeeeeeeeeeEEk.',
  '..kkEEEEEEEEkk..',
  '....kkkkkkkk....'];
RAW.scorpion = [
  '................',
  '..........kkk...',
  '.........ktttk..',
  '.........kkktk..',
  '...........ktk..',
  '..kk......kttk..',
  '.kttk....kttk...',
  'kttkk...kttk....',
  'ktk.kkkkkttk....',
  '.kkktttttttk....',
  '..ktxttttttkk...',
  '.kkttttttttttk..',
  'kTktTkTkkTkTkk..',
  'kk.kk.kk.kk.k...',
  '................', '................'];
BIG.b_dragon = [
  '........................',
  '..............kk....kk..',
  '.............kyk...kyk..',
  '............kaakkkkaak..',
  '...kk......kaaaaaaaaak..',
  '..kbbk.....kaxaaaaxaak..',
  '.kbbbbk....kaaaaaaaaak..',
  '.kbbbbbk....kaakkkaak...',
  'kbbAbbbbk...kaywywak....',
  'kbbAbbbbbk..kaaaaak.....',
  'kbAbbAbbbbkkkaaaak......',
  'kbAbbAbbbbbkaaaaak...kk.',
  'kbAbbAbbbkaaaaaaak..kbbk',
  '.kbbAbbbkaaaaaaaaakkbbbk',
  '..kkbbbkaaaabbbaaaakbbbk',
  '....kkkaaaabbbbbaaakbAbk',
  '......kaaabbbbbbaaakbAbk',
  '......kaaabbbbbbaaak.kk.',
  '.....kaaaabbbbbaaaak....',
  '....kaakaaaabbaakaak....',
  '...kaak.kaaaaak.kaak....',
  '..kyyk..kyyyyk..kyyk....',
  '..kkk...kkkkk...kkk.....',
  '........................'];
var more = {
  mino:     { a: '#8a5a36', A: '#5e3a22', b: '#d8cfb6', B: '#a39a84', x: '#ff4d6d' },
  pirate:   { a: '#2f86a6', A: '#1f5d78', b: '#f6cf57', B: '#c08f2c', x: '#ffffff' },
  cobra:    { a: '#c9a227', A: '#8a6c14', b: '#2b2440', x: '#ff4d6d' },
  pharaoh:  { a: '#e0b33c', A: '#a8782a', b: '#3572b8', z: '#2b2440', x: '#7fe3ff', y: '#7fe3ff' },
  succubus: { a: '#c0447e', A: '#7e2952', b: '#2b2440', x: '#ffd24a', y: '#ff9de1' },
  moon:     { a: '#b9b9c9', A: '#77778a', b: '#7fe3ff', B: '#4a8fb0', x: '#7fe3ff' },
  ice:      { a: '#8fc3dc', A: '#4a86a8', b: '#e9f7fd', x: '#ff4d6d', y: '#ffffff' },
  janus:    { a: '#e9e2d0', A: '#8a2f45', b: '#2b2440', x: '#ffd24a', y: '#ff4d6d' },
  bone:     { a: '#d8d0bc', A: '#a39a84', b: '#8a7fa8', z: '#2b2440', x: '#b6ff5a', y: '#d8d0bc' }
};
for (var k in more) BPAL[k] = more[k];

// 몬스터
SPR.slime = def(RAW.slime, {});
SPR.scorpion = def(RAW.scorpion, { t: '#96402e', T: '#571f19', x: '#ffd24a' });      // r8: 붉은 황토 사막(전갈이 사는 유일한 땅) 위에서 뜨게 주황 → 검붉은 갑각
SPR.mummy = def(compose('bandage', 'bones', ['fists']), { l: '#d6caa2', L: '#a3966c', s: '#d6caa2', x: '#b6ff5a' });
SPR.iceGolem = def(RAW.golem, { m: '#bfe3f2', M: '#8fc3dc', n: '#5a90ac', x: '#ff4d6d' });

// ── 병과별 단 외형 ──  [머리, 몸, 장비, 팔레트]
function L(head, body, items, pal) { return [head, body, items, pal]; }
var LOOKS = {
  inf: [
    L('helm', 'armor', ['sword', 'shield'], { a: '#6f8fc0', A: '#4a6494', b: '#cdd5e3' }),
    L('plume', 'armor', ['sword', 'shield'], { a: '#5b8fd6', A: '#3a62a8', b: '#f6cf57' }),
    L('plume', 'armor', ['cape', 'sword', 'shield'], { a: '#3f6fc8', A: '#27488c', b: '#f6cf57', q: '#e0525e', Q: '#9c2f45', r: '#ffd24a', R: '#c08f2c' }),
    L('crown', 'armor', ['cape', 'sword', 'shield'], { a: '#c0525e', A: '#8a3040', b: '#f6cf57', q: '#3f6fc8', Q: '#27488c', h: '#8a5a36', H: '#5e3a22', u: '#f6cf57', U: '#c08f2c' }),
    L('crown', 'armor', ['cape', 'gsword'], { a: '#7d55c0', A: '#4f3288', b: '#f6cf57', q: '#c0525e', Q: '#8a3040', h: '#3a3350', H: '#262036' }),
    L('crown', 'armor', ['cape', 'gsword'], { a: '#e8bb45', A: '#b07f2a', b: '#ffffff', q: '#c0525e', Q: '#8a3040', h: '#f1ead9', H: '#cfc4a8', M: '#b07f2a', r: '#62b0ee' }),
    L('crown', 'armor', ['cape', 'gsword'], { a: '#f7f2e6', A: '#cfc6ae', b: '#f6cf57', q: '#62b0ee', Q: '#3572b8', h: '#f6cf57', H: '#c08f2c', M: '#c08f2c', w: '#c9f1ff', r: '#ff4d6d' })
  ],
  pike: [
    L('helm', 'armor', ['spear'], { a: '#5fae5a', A: '#3a7d42', b: '#cdd5e3' }),
    L('plume', 'armor', ['spear'], { a: '#4c9a8a', A: '#2f6b62', b: '#f6cf57', r: '#f6cf57', R: '#c08f2c' }),
    L('plume', 'armor', ['cape', 'halberd'], { a: '#3f8fa8', A: '#27607a', b: '#f6cf57', q: '#5fae5a', Q: '#3a7d42' }),
    L('horned', 'armor', ['cape', 'halberd'], { a: '#3a7d42', A: '#24552d', b: '#f6cf57', q: '#8a5a36', Q: '#5e3a22' }),
    L('horned', 'armor', ['cape', 'halberd'], { a: '#cdd5e3', A: '#8f9ab3', b: '#62b0ee', q: '#3572b8', Q: '#24508a', M: '#5b6480' }),
    L('crown', 'armor', ['cape', 'halberd'], { a: '#e8bb45', A: '#b07f2a', b: '#ffffff', q: '#3a7d42', Q: '#24552d', h: '#f1ead9', H: '#cfc4a8' })
  ],
  arc: [
    L('hood', 'tunic', ['bow'], { a: '#5fae5a', A: '#3a7d42', b: '#8a5a36', B: '#6f4a2c' }),
    L('hood', 'tunic', ['bow'], { a: '#3f8f6a', A: '#27604a', b: '#c9a227', B: '#6f4a2c' }),
    L('hood', 'tunic', ['cape', 'lbow'], { a: '#8a6a3a', A: '#5e4522', b: '#5fae5a', B: '#3a7d42', q: '#3a7d42', Q: '#24552d' }),
    L('hood', 'tunic', ['cape', 'lbow'], { a: '#c9a227', A: '#8a6c14', b: '#f1ead9', B: '#6f4a2c', q: '#3f8f6a', Q: '#27604a', w: '#f6cf57' }),
    L('hood', 'tunic', ['cape', 'lbow'], { a: '#e9e2d0', A: '#b9ae96', b: '#f6cf57', B: '#8f9ab3', q: '#62b0ee', Q: '#3572b8', w: '#ffffff' }),
    L('mask', 'tunic', ['cape', 'kunai', 'lbow'], { a: '#2b2440', A: '#1b1626', b: '#e0525e', B: '#3a3350', q: '#3a3350', Q: '#262036', O: '#262036', w: '#cdd5e3' })
  ],
  mar: [
    L('tricorn', 'tunic', ['trident'], { a: '#2f86a6', A: '#1f5d78', b: '#f6cf57', B: '#e9e2d0', h: '#5e3a22', H: '#3d2616' }),
    L('tricorn', 'tunic', ['trident'], { a: '#3fa88a', A: '#27705c', b: '#f6cf57', B: '#e9e2d0', h: '#27705c', H: '#1a4c3e' }),
    L('tricorn', 'armor', ['cape', 'trident'], { a: '#3fa88a', A: '#27705c', b: '#f6cf57', h: '#27705c', H: '#1a4c3e', q: '#2f86a6', Q: '#1f5d78' }),
    L('horned', 'armor', ['cape', 'trident'], { a: '#2f9a6a', A: '#1c6644', b: '#f6cf57', q: '#f6cf57', Q: '#c08f2c', m: '#4fd0a0', M: '#2f9a6a' }),
    L('horned', 'armor', ['cape', 'trident'], { a: '#7d55c0', A: '#4f3288', b: '#9fe8ec', q: '#2f86a6', Q: '#1f5d78', m: '#b181e6', M: '#7446ad' }),
    L('crown', 'armor', ['cape', 'trident'], { a: '#4b3a8a', A: '#2c2160', b: '#f6cf57', q: '#b181e6', Q: '#7446ad', h: '#2b2440', H: '#1b1626', m: '#f6cf57', M: '#c08f2c' })
  ],
  cle: [      // 2.2.6 무투가: 수련생 → 권사 → 무승 → 철권 → 권호 → 권성 → 무신 (도복 · 감은 천 → 권갑 · 목도리 → 금 테 머리띠)
    L('knot', 'gi', ['wraps'], { a: '#d8c8a8', A: '#a89878', b: '#7a5a3a', B: '#5e4228', h: '#2b2440', r: '#8a5a36', l: '#efe6d0', p: '#8a7a5e' }),
    L('band', 'gi', ['wraps'], { a: '#f4efe2', A: '#cfc6ae', b: '#3a3350', B: '#262036', r: '#e0525e', R: '#9c2f45', h: '#3a2a20', l: '#efe6d0', p: '#cfc6ae' }),
    L('knot', 'gi', ['wraps', 'scarf'], { a: '#c0525e', A: '#8a3040', b: '#2b2440', B: '#1b1626', h: '#2b2440', r: '#f6cf57', l: '#efe6d0', q: '#f6cf57', Q: '#c08f2c', p: '#5e2a34' }),
    L('band', 'gi', ['gaunt'], { a: '#3a3350', A: '#262036', b: '#e0525e', B: '#9c2f45', r: '#f6cf57', R: '#c08f2c', h: '#1b1626', l: '#d8d0bc', m: '#aab2c2', M: '#6a7488', p: '#2b2440' }),
    L('band', 'gi', ['scarf', 'gaunt'], { a: '#e8bb45', A: '#b07f2a', b: '#3a3350', B: '#262036', r: '#3a3350', R: '#1b1626', h: '#3a2a20', l: '#f1ead9', q: '#e0525e', Q: '#9c2f45', m: '#cdd5e3', M: '#8f9ab3', p: '#7a5a2a' }),
    L('knot', 'gi', ['cape', 'gaunt'], { a: '#f7f2e6', A: '#cfc6ae', b: '#f6cf57', B: '#c08f2c', h: '#2b2440', r: '#62b0ee', l: '#ffffff', q: '#3572b8', Q: '#24508a', m: '#f6cf57', M: '#c08f2c', p: '#3a4a6a' }),
    L('circlet', 'gi', ['cape', 'scarf', 'gaunt'], { a: '#f7f2e6', A: '#cfc6ae', b: '#e0525e', B: '#9c2f45', h: '#1b1626', i: '#f6cf57', I: '#c08f2c', c: '#ff4d6d', l: '#ffffff', q: '#e0525e', Q: '#9c2f45', m: '#ffe27a', M: '#c08f2c', p: '#7a2a34' })
  ],
  mon: [
    L('bald', 'tunic', ['beads'], { a: '#f09a4a', A: '#b8642a', b: '#e0525e', B: '#f7e3bd', O: '#cf9670' }),
    L('mitre', 'robe', ['cross'], { a: '#f09a4a', A: '#b8642a', b: '#f6cf57', h: '#f4efe2', H: '#cfc6ae' }),
    L('mitre', 'robe', ['orb'], { a: '#3fa88a', A: '#27705c', b: '#f6cf57', h: '#3fa88a', H: '#27705c', c: '#fff0a0', C: '#f6cf57' }),
    L('helm', 'armor', ['mace', 'shield'], { a: '#f4efe2', A: '#cfc6ae', b: '#f6cf57', u: '#f6cf57', U: '#c08f2c' }),
    L('mitre', 'robe', ['cape', 'cross'], { a: '#f4efe2', A: '#cfc6ae', b: '#f6cf57', h: '#f6cf57', H: '#c08f2c', q: '#f09a4a', Q: '#b8642a' }),
    L('crown', 'robe', ['cape', 'orb'], { a: '#f09a4a', A: '#b8642a', b: '#fff6d8', h: '#f4efe2', H: '#cfc6ae', q: '#fff6d8', Q: '#e0c888', c: '#ffffff', C: '#fff0a0' })      // r8: 수도승은 끝까지 주황 옷
  ],
  mag: [
    L('wizhat', 'robe', ['staff'], { a: '#8d6be0', A: '#5f41ad', b: '#f6cf57', c: '#ff9de1' }),
    L('wizhat', 'robe', ['staff'], { a: '#5b8fd6', A: '#3a62a8', b: '#f6cf57', c: '#9fe8ec' }),
    L('wizhat', 'robe', ['cape', 'staff'], { a: '#3f6fc8', A: '#27488c', b: '#f6cf57', c: '#ff9a3c', q: '#8d6be0', Q: '#5f41ad' }),
    L('wizhat', 'robe', ['cape', 'orb'], { a: '#c0525e', A: '#8a3040', b: '#f6cf57', c: '#ff9a3c', C: '#d9442b', q: '#3a3350', Q: '#262036' }),
    L('wizhat', 'robe', ['cape', 'orb'], { a: '#3a3350', A: '#262036', b: '#b181e6', c: '#b181e6', C: '#7446ad', q: '#7446ad', Q: '#4b2c7a' }),
    L('wizhat', 'robe', ['cape', 'orb'], { a: '#1f6b5a', A: '#0f3f36', b: '#f6cf57', c: '#7dffb0', C: '#3fae8c', q: '#c9a227', Q: '#8a6c14' }),
    L('crown', 'robe', ['cape', 'orb'], { a: '#8d6be0', A: '#5f41ad', b: '#f6cf57', c: '#ffffff', C: '#62b0ee', q: '#f7f2e6', Q: '#cfc6ae', h: '#cdd5e3', H: '#8f9ab3' })      // r8: 법사는 끝까지 보라 옷 (흰 망토)
  ],
  sha: [
    L('darkhood', 'robe', ['sstaff'], { a: '#5a7a4a', A: '#3a5230', b: '#d8d0bc', z: '#1b1626', x: '#b6ff5a' }),
    L('darkhood', 'robe', ['sstaff'], { a: '#6a4f9e', A: '#45316f', b: '#b6ff5a', z: '#1b1626', x: '#b6ff5a' }),
    L('darkhood', 'robe', ['cape', 'sstaff'], { a: '#3a3350', A: '#262036', b: '#e0525e', z: '#0f0c18', x: '#ff4d6d', q: '#6a4f9e', Q: '#45316f' }),
    L('darkhood', 'robe', ['cape', 'orb'], { a: '#2b2440', A: '#1b1626', b: '#b6ff5a', z: '#0f0c18', x: '#b6ff5a', q: '#3a5230', Q: '#24361e', c: '#b6ff5a', C: '#5a9a2a' }),
    L('darkhood', 'robe', ['cape', 'orb'], { a: '#7446ad', A: '#4b2c7a', b: '#ff9de1', z: '#1b1626', x: '#ff9de1', q: '#c0447e', Q: '#7e2952', c: '#ff9de1', C: '#c0447e' }),
    L('crown', 'robe', ['cape', 'orb'], { a: '#1b1626', A: '#0f0c18', b: '#e0525e', h: '#cdd5e3', H: '#8f9ab3', i: '#8f9ab3', I: '#5b6480', s: '#cdb7c6', S: '#a8909f', q: '#8a2f45', Q: '#5e1d31', c: '#ff4d6d', C: '#9c2f45' })
  ]
};
// 기병·비병은 탈것째로 색을 바꾼다
var CAV = [
  { a: '#b5814f', A: '#7f5632', h: '#a8754a', H: '#6f4a2c' }, { a: '#5b8fd6', A: '#3a62a8', h: '#a8754a', H: '#6f4a2c' },
  { a: '#cdd5e3', A: '#8f9ab3', h: '#f1ead9', H: '#cfc4a8', m: '#ffffff', M: '#cdd5e3' }, { a: '#c0525e', A: '#8a3040', h: '#3a3350', H: '#262036' },
  { a: '#e8bb45', A: '#b07f2a', h: '#f1ead9', H: '#cfc4a8', m: '#f6cf57', M: '#c08f2c' }, { a: '#7d55c0', A: '#4f3288', h: '#f1ead9', H: '#cfc4a8', m: '#f6cf57', M: '#c08f2c' },
  { a: '#f7f2e6', A: '#cfc6ae', h: '#e8bb45', H: '#b07f2a', m: '#f6cf57', M: '#c08f2c', w: '#c9f1ff' }
];
var FLY = [
  { a: '#e86a9a', A: '#b8436f', b: '#fff0a0', h: '#b5814f', H: '#7f5632', y: '#f1ead9' }, { a: '#62b0ee', A: '#3572b8', b: '#f6cf57', h: '#f7f2e6', H: '#cfc6ae', y: '#ffffff', T: '#cfc6ae' },
  { a: '#ffb3d1', A: '#d6789e', b: '#f6cf57', h: '#ffffff', H: '#dfeaf6', y: '#f6cf57', T: '#f6cf57' }, { a: '#cdd5e3', A: '#8f9ab3', b: '#e0525e', h: '#4fb59a', H: '#2c7d74', y: '#d9d46a', T: '#2c7d74' },
  { a: '#3a3350', A: '#262036', b: '#f6cf57', h: '#d9543a', H: '#8f2f24', y: '#ffb347', T: '#8f2f24' }, { a: '#f6cf57', A: '#c08f2c', b: '#ffffff', h: '#3a3350', H: '#1b1626', y: '#e0525e', T: '#1b1626' }
];
var cls, i;
for (cls in LOOKS) LOOKS[cls].forEach(function (l, n) { SPR[cls + '_' + (n + DS.CLASSES[cls].start)] = def(compose(l[0], l[1], l[2]), l[3]); });
// 통짜 격자 위에 조각을 덧그린다: [x, y, rows] — '.' 은 그대로 둔다. 단이 오를 때마다 색만이 아니라 실루엣이 달라지게.
function over(rows, pats) {
  var g = rows.map(function (r) { return r.split(''); });
  pats.forEach(function (p) { p[2].forEach(function (r, dy) { for (var dx = 0; dx < r.length; dx++) { var y = p[1] + dy, x = p[0] + dx; if (r[dx] !== '.' && g[y] && x >= 0 && x < g[y].length) g[y][x] = r[dx] === '_' ? '.' : r[dx]; } }); });      // r8: '_' 는 지운다(투명)
  return g.map(function (r) { return r.join(''); });
}
// 기병: 깃 장식 → 말옷 → 말 투구 → 망토 → 금창 → 왕관과 뿔
var K_PLUME = [5, 0, ['.rr.', 'krRk']], K_CLOTH = [3, 9, ['hqqqqqqh', 'hqQqqQqh', 'hbbbbbbh']], K_HEAD = [10, 4, ['.kmMk', 'kmmhk']],
    K_CAPE = [0, 6, ['..kq', '.kqq', 'kqQk']], K_LANCE = [9, 7, ['iiiiiiw']], K_CROWN = [5, 0, ['i..i', 'irii']], K_HORN = [14, 1, ['.w', 'w.']],
    K_WING = [0, 2, ['kk', 'kwk', 'kwwk', 'kwmwk', '.kwmk', '..kw']], K_WING2 = [0, 0, ['k', 'wk', 'wwk', 'wwwk', 'kwmwk', 'kwmmk', '.kwmk', '..kw']];
var CAVP = [[], [K_PLUME], [K_PLUME, K_CLOTH], [K_PLUME, K_CLOTH, K_HEAD], [K_PLUME, K_CAPE, K_CLOTH, K_HEAD], [K_PLUME, K_CAPE, K_CLOTH, K_HEAD, K_LANCE], [K_CROWN, K_CAPE, K_CLOTH, K_HEAD, K_LANCE, K_HORN]];
var CAVQ = [null, null, { q: '#5b8fd6', Q: '#3a62a8' }, { q: '#8a3040', Q: '#5e1d31', r: '#f6cf57', R: '#c08f2c' }, { q: '#c0525e', Q: '#8a3040' }, { q: '#f6cf57', Q: '#c08f2c', r: '#ffffff', R: '#cdd5e3' }, { q: '#62b0ee', Q: '#3572b8' }];
CAV.forEach(function (p, n) { SPR['cav_' + (n + 1)] = def(over(RAW.knight, CAVP[n]), CAVQ[n] ? mix(p, CAVQ[n]) : p); });
// 비병: 깃 장식 → 큰 날개 → 금빛 날개 띠 → 창 → 왕관과 긴 꼬리깃
var H_CREST = [6, 0, ['.rr.', 'krRk']], H_WING = [0, 3, ['kk..........kk', 'khk........khk', 'khhk......khhk']], H_BAND = [1, 6, ['b............b', '.b..........b.']],
    H_SPEAR = [11, 0, ['w', 'w', 'o', 'o', 'o']], H_TAIL = [5, 13, ['kTTTTk', 'kTkkTk', '.k..k.']], H_CROWN = [6, 0, ['i..i', 'iiii']];
var FLYP = [[], [H_CREST], [H_CREST, H_WING], [H_CREST, H_WING, H_BAND], [H_CREST, H_WING, H_BAND, H_SPEAR], [H_CROWN, H_WING, H_BAND, H_SPEAR, H_TAIL]];
FLY.forEach(function (p, n) { SPR['fly_' + (n + 2)] = def(over(RAW.hawk, FLYP[n]), p); });
// 합일 8~10단
[{ a: '#e8bb45', A: '#b07f2a', h: '#3a3350', H: '#262036', m: '#f6cf57', M: '#c08f2c', w: '#ff4d6d' },
 { a: '#f7f2e6', A: '#cfc6ae', h: '#c0525e', H: '#8a3040', m: '#f6cf57', M: '#c08f2c', w: '#c9f1ff' },
 { a: '#1b1626', A: '#0f0c18', h: '#f7f2e6', H: '#cfc6ae', m: '#ff4d6d', M: '#9c2f45', w: '#ffd24a', s: '#f3c9a1' }].forEach(function (p, n) { SPR['bm_' + (n + 8)] = def(over(RAW.knight, [K_CROWN, K_CAPE, K_CLOTH, K_HEAD, K_LANCE, n > 1 ? K_WING2 : K_WING].concat(n > 0 ? [K_HORN] : [])), mix(p, [{ q: '#c0525e', Q: '#8a3040' }, { q: '#f6cf57', Q: '#c08f2c' }, { q: '#ff4d6d', Q: '#9c2f45', i: '#ffd24a' }][n])); });      // 배틀마스터: 날개 돋은 군마
// 마스터(8~10단)는 등 뒤에 날개가 돋는다 — 10단은 더 크게
ITEM.mwing = [0, 4, ['wk............kw', 'wwk..........kww', 'wwk..........kww', 'kwk..........kwk', '.k............k.']];
ITEM.mwing2 = [0, 2, ['w..............w', 'wk............kw', 'wwk..........kww', 'wwk..........kww', 'wwk..........kww', 'kwk..........kwk', '.k............k.']];
[L('hood', 'armor', ['mwing', 'cape', 'trident', 'lbow'], { a: '#3fa88a', A: '#27705c', b: '#f6cf57', q: '#2f86a6', Q: '#1f5d78', w: '#f6cf57' }),
 L('horned', 'armor', ['mwing', 'cape', 'lbow'], { a: '#e8bb45', A: '#b07f2a', b: '#ffffff', q: '#3fa88a', Q: '#27705c', w: '#ffffff' }),
 L('crown', 'armor', ['mwing2', 'cape', 'lbow'], { a: '#f7f2e6', A: '#cfc6ae', b: '#62b0ee', q: '#e8bb45', Q: '#b07f2a', h: '#3fa88a', H: '#27705c', w: '#9fe8ec' })
].forEach(function (l, n) { SPR['tm_' + (n + 8)] = def(compose(l[0], l[1], l[2]), l[3]); });
[L('wizhat', 'robe', ['mwing', 'cape', 'orb'], { a: '#e8bb45', A: '#b07f2a', b: '#8d6be0', q: '#8d6be0', Q: '#5f41ad', c: '#ffffff', C: '#b181e6' }),
 L('crown', 'robe', ['mwing', 'cape', 'orb'], { a: '#8d6be0', A: '#5f41ad', b: '#f6cf57', q: '#f7f2e6', Q: '#cfc6ae', c: '#fff0a0', C: '#f6cf57', h: '#f7f2e6', H: '#cfc6ae' }),
 L('crown', 'robe', ['mwing2', 'cape', 'orb'], { a: '#f7f2e6', A: '#cfc6ae', b: '#f6cf57', q: '#f6cf57', Q: '#c08f2c', c: '#ffffff', C: '#9fe8ec', h: '#b181e6', H: '#7446ad' })
].forEach(function (l, n) { SPR['mm_' + (n + 8)] = def(compose(l[0], l[1], l[2]), l[3]); });

// ── 용병: 종류마다 네 가지 생김새, 등급은 장식색으로 ──
var GR = [''].concat([1, 2, 3, 4, 5].map(function (g) { return DS.gradeCol ? DS.gradeCol(g) : ['', '#b5814f', '#7fcf6a', '#62b0ee', '#b181e6', '#f6cf57'][g]; }));   // 등급색: 일반·고급·희귀·영웅·전설 (2.6.0: DS.GRADES 의 색 하나로 — 등급 테와 같은 빛)
function merc(name, vars) {
  for (var g = 1; g <= 5; g++) vars.forEach(function (va, v) {
    var p = {}; for (var k in va[1]) p[k] = va[1][k]; p.b = GR[g];
    var rows = va[0], horse = rows === RAW.knight, human = !horse && rows !== RAW.harpy && rows !== RAW.lizard && rows !== RAW.golem;
    if (g >= 4 && (human || horse)) rows = over(rows, [[horse ? 5 : 6, 0, ['.bb.', 'kbbk']]]);      // 영웅 이상: 머리에 등급색 깃 장식
    if (g >= 5 && human) rows = over(rows, [[2, 8, ['kii......iik']]]);      // 전설: 금빛 견갑
    if (g >= 5 && horse) { rows = over(rows, [K_CLOTH]); p.q = '#f6cf57'; p.Q = '#c08f2c'; }      // 전설의 기병: 금빛 말옷
    SPR[name + '_' + g + '_' + v] = def(rows, p);
    if (v === 0) SPR[name + '_' + g] = SPR[name + '_' + g + '_0'];
  });
}
var SK1 = { s: '#f3c9a1', S: '#cf9670' }, SK2 = { s: '#d9a877', S: '#a8754a' }, SK3 = { s: '#8a5a36', S: '#5e3a22' };
function mix(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
merc('m_sword', [
  [compose('helm', 'armor', ['sword', 'shield']), { a: '#8a94a8', A: '#5b6480', u: '#8a94a8', U: '#5b6480' }],
  [compose('plume', 'armor', ['sword', 'shield']), mix(SK2, { a: '#7a6a58', A: '#52463a', u: '#b84a55', U: '#7e2c3a', r: '#e0525e', R: '#9c2f45' })],
  [compose('hood', 'tunic', ['sword']), mix(SK1, { a: '#5a6a8a', A: '#3a4660', B: '#6f4a2c' })],
  [compose('horned', 'armor', ['axe']), mix(SK3, { a: '#6a5a4a', A: '#463a2e', m: '#a8a294', M: '#7d766a' })]]);
merc('m_lancer', [
  [RAW.knight, { a: '#8a94a8', A: '#5b6480', h: '#8a6a4a', H: '#5e4530' }],
  [RAW.knight, { a: '#7a5a4a', A: '#523a2e', h: '#d8cfb6', H: '#a39a84' }],
  [RAW.knight, mix(SK2, { a: '#4a6a5a', A: '#2e463a', h: '#3a3350', H: '#262036' })],
  [RAW.knight, mix(SK3, { a: '#8a6a3a', A: '#5e4522', h: '#b5814f', H: '#7f5632' })]]);
merc('m_griffin', [
  [RAW.harpy, { a: '#d8b46a', p: '#a8843f', c: '#f1ead9', C: '#cfc4a8' }],
  [RAW.harpy, { a: '#b0a08a', p: '#7d6a50', c: '#8a94a8', C: '#5b6480' }],
  [RAW.harpy, { a: '#e9e2d0', p: '#62b0ee', c: '#ffffff', C: '#cdd5e3' }],
  [RAW.harpy, { a: '#8a5a36', p: '#e0525e', c: '#d8b46a', C: '#a8843f' }]]);
merc('m_merman', [
  [RAW.lizard, { a: '#3a6a8a', e: '#62b0ee', E: '#3572b8', g: '#cdd5e3' }],
  [RAW.lizard, { a: '#2f6b5a', e: '#4fd0a0', E: '#2f9a6a', g: '#f6cf57' }],
  [RAW.lizard, { a: '#5a4a8a', e: '#9fe8ec', E: '#58a0b0', g: '#e9e2d0' }],
  [RAW.lizard, { a: '#3a4a6a', e: '#8fa0d0', E: '#5b6aa0', g: '#b5814f' }]]);
merc('m_pike', [
  [compose('helm', 'armor', ['spear']), { a: '#7a9a6a', A: '#4f6b42' }],
  [compose('plume', 'armor', ['halberd']), mix(SK2, { a: '#6a8a9a', A: '#42606b', r: '#f6cf57', R: '#c08f2c' })],
  [compose('hood', 'tunic', ['spear']), mix(SK3, { a: '#8a7a4a', A: '#5e522e', B: '#6f4a2c' })],
  [compose('horned', 'armor', ['halberd']), { a: '#5a6a5a', A: '#3a463a' }]]);
merc('m_archer', [
  [compose('hood', 'tunic', ['bow']), { a: '#8a9a6a', A: '#5e6b42', B: '#6f4a2c' }],
  [compose('hood', 'tunic', ['lbow']), mix(SK2, { a: '#8a6a4a', A: '#5e452e', B: '#3a3350', w: '#e9e2d0' })],
  [compose('helm', 'tunic', ['bow']), { a: '#6a7a9a', A: '#424e6b', B: '#6f4a2c' }],
  [compose('mask', 'tunic', ['bow']), mix(SK3, { a: '#4a4a5a', A: '#2e2e3a', q: '#b84a55', B: '#3a3350' })]]);
merc('m_sister', [
  [compose('veil', 'robe', ['wand']), { a: '#dfeaf6', A: '#a9bcd6' }],
  [compose('veil', 'robe', ['cross']), mix(SK2, { a: '#f4e6c8', A: '#cfb98a', l: '#a8843f', L: '#7d5f2a' })],
  [compose('tiara', 'robe', ['wand']), { a: '#cfe6d6', A: '#8fbba0', h: '#8a5a36', H: '#5e3a22', i: '#f6cf57' }],
  [compose('veil', 'robe', ['orb']), mix(SK3, { a: '#e6d6ea', A: '#b99ac0', w: '#f4efe2', c: '#fff0a0', C: '#f6cf57' })]]);
merc('m_templar', [
  [compose('helm', 'armor', ['mace', 'shield']), { a: '#e9e2d0', A: '#b9ae96', u: '#e9e2d0', U: '#b9ae96' }],
  [compose('plume', 'armor', ['mace', 'shield']), mix(SK2, { a: '#d8dce6', A: '#9aa2b6', u: '#62b0ee', U: '#3572b8', r: '#62b0ee', R: '#3572b8' })],
  [compose('horned', 'armor', ['cross', 'shield']), { a: '#f1e6c0', A: '#c4b07a', u: '#f6cf57', U: '#c08f2c' }],
  [compose('mitre', 'armor', ['mace']), mix(SK3, { a: '#e9e2d0', A: '#b9ae96', h: '#e9e2d0', H: '#b9ae96' })]]);
merc('m_spirit', [
  [RAW.golem, { m: '#b9a58a', M: '#8a765c', n: '#5e4c36', x: '#62e0ff' }],
  [RAW.golem, { m: '#9aa8a0', M: '#6b7a72', n: '#44524a', x: '#b6ff5a' }],
  [RAW.golem, { m: '#b08a7a', M: '#7d5a4c', n: '#523830', x: '#ffd24a' }],
  [RAW.golem, { m: '#8a8aa8', M: '#5c5c7a', n: '#3a3a52', x: '#ff9de1' }]]);
merc('m_skeleton', [
  [compose('skull', 'bones', ['sword']), { l: '#cfd6c0', L: '#8fa08a' }],
  [compose('skull', 'bones', ['axe']), { l: '#d8cfb6', L: '#a39a84' }],
  [compose('skull', 'bones', ['spear']), { l: '#c0cfd6', L: '#8a9aa0' }],
  [compose('skull', 'bones', ['sword', 'shield']), { l: '#d6c0c0', L: '#a08a8a', u: '#5b6480', U: '#3a4660' }]]);
// ── 보스 몸 변형 (후반 보스가 같은 몸에 색만 달랐다): 마녀 · 벌레 왕 · 갑주의 성주 · 어스름의 왕 ──
BIG.b_witch = [
  '...........kk...........',
  '..........kaak..........',
  '.........kaaAk..........',
  '.kk.....kaaaAAk.........',
  'kyyk...kaaaaaAAk........',
  'kyyk.kkkbbbbbbbbkkk.....',
  '.kk.kaaaaaaaaaaaaaak....',
  '.ko..kkkaaAAAAaakkk.....',
  '.ko....kaAxzzxAak.......',
  '.ko....kaAzzzzAak.......',
  '.ko...kkkaAzzAakkk......',
  '.kokkkaaAkaaaakAaak.kk..',
  '.koaaaaAkaabbaakAakkAAk.',
  '.kokkkkkaaabbaaakkkAAAk.',
  '.ko...kaaaabbaaaak.kAAk.',
  '.ko...kaaaAaaAaaak..kk..',
  '.ko..kaaaaAaaAaaaak.....',
  '.k...kaaaAaaaaAaaak.....',
  '....kaaaaAaaaaAaaaak....',
  '....kaAaaaaaaaaaaAak....',
  '.....kkaaAaaaaAaakk.....',
  '.......kkaaAAaakk.......',
  '.........kkkkkk.........',
  '........................'];
BIG.b_swarm = [
  '........................',
  '.....k............k.....',
  '......k..kkkkkk..k......',
  '.......kkaaaaaakk.......',
  '......kxxkaaaakxxk......',
  '......kxxkaaaakxxk......',
  '.kkkk..kkaayyaakk..kkkk.',
  'kbbbbkk.kkkkkkkk.kkbbbbk',
  'kbwbbbbkkaaaaaakkbbbbwbk',
  'kbbwbbbkaaAAAAaakbbbwbbk',
  '.kbbbbbkaAaaaaAakbbbbbk.',
  '.kkbbbkkaaaaaaaakkbbbkk.',
  'kbbkkk.kaAAAAAAak.kkkbbk',
  'kbwbbbkkaaaaaaaakkbbbwbk',
  '.kbbbbbkaAAAAAAakbbbbbk.',
  '..kkbbkkaaaaaaaakkbbkk..',
  '....kk.kaaAAAAaak.kk....',
  '......kykaaaaaakyk......',
  '.....kyk.kaAAak.kyk.....',
  '....kyk..kaaaak..kyk....',
  '....kk....kaak....kk....',
  '...........kk...........',
  '........................',
  '........................'];
BIG.b_lord = [
  '......k..........k......',
  '.....kbk........kbk.....',
  '.....kbbk.kkkk.kbbk.....',
  '......kbkkaaaakkbk......',
  '......kkaaaaaaaakk..k...',
  '......kaaAAAAAAaak.kwk..',
  '......kaAxxAAxxAak.kwk..',
  '......kaaAAAAAAaak.kwk..',
  '.......kaAkkkkAak..kwk..',
  '...kkkkkkaaaaaakkkkkwk..',
  '..kbbbbkkaabbaakkbbkwk..',
  '.kbaaabkaabggbaakabkwk..',
  '.kaaAaakaaabbaaakayywk..',
  '.kaAAakkaaaaaaaakkyykk..',
  '.kaAak.kaaAaaAaak.kgk...',
  '.kyyk.kkaaAaaAaakk.k....',
  '..kk.kbbkaakkaakbbk.....',
  '....kbbbkaak.kaakbbk....',
  '....kbbkkaAk.kAakkbk....',
  '....kbk.kaak.kaak.kbk...',
  '.....k.kaaak.kaaak.k....',
  '.......kyyyk.kyyyk......',
  '.......kkkkk.kkkkk......',
  '........................'];
// 어스름의 왕: 날개 달린 마왕에 가운데 뿔, 아래 날개 한 쌍, 가슴의 눈을 더한다
BIG.b_dusk = over(BIG.b_demon, [[10, 0, ['.kk.', 'kbbk']], [0, 14, ['k...', 'kk..', 'kAk.', 'kAAk', '.kAk', '..k.']], [20, 14, ['...k', '..kk', '.kAk', 'kAAk', 'kAk.', '.k..']], [10, 11, ['bxxb', 'xwkx', 'bxxb']]]);
BPAL.frost = { a: '#7fb6d6', A: '#3f6f9a', b: '#e9f7fd', x: '#ffd24a', y: '#c9f1ff', z: '#12233a' };
// 큰 용병 (인구수 2)
BIG.b_ballista = [
  '........................',
  '........................',
  '..........kk............',
  '.........kwwk...........',
  '........kwwwwk..........',
  '..kkk....kwwk....kkk....',
  '.kaaak...kwwk...kaaak...',
  '.kaAaakkkkwwkkkkaaAak...',
  '..kaaaaaaawwaaaaaaak....',
  '...kkAaaaawwaaaaAkk.....',
  '.....kkkaawwaakkk.......',
  '........kawwak..........',
  '.......kaabbaak.........',
  '......kaabbbbaak........',
  '.....kaAbbbbbbAak.......',
  '....kaAAbbbbbbAAak......',
  '...kkkkkkkkkkkkkkkk.....',
  '..kyyk..kAAAAk..kyyk....',
  '.kyAAyk.kkkkkk.kyAAyk...',
  '.kyAAyk........kyAAyk...',
  '..kyyk..........kyyk....',
  '...kk............kk.....',
  '........................',
  '........................'];
BPAL.wood = { a: '#a8754a', A: '#6f4a2c', b: '#8a5a36', w: '#cdd5e3', y: '#5e3a22' };
BPAL.ogre = { a: '#c9a56a', A: '#96753f', b: '#7a5a3c', B: '#523a25', x: '#fff0a0' };
BPAL.wyv = { a: '#4fa88a', A: '#2c7d64', b: '#d9d46a', x: '#ff4d6d', y: '#f1ead9' };
BPAL.abbess = { a: '#f4efe2', A: '#cfc6ae', b: '#62b0ee', z: '#f3c9a1', x: '#3a2a1a', y: '#fff0a0' };

// 마을 사람
SPR.npc_0 = SPR.elder;
SPR.npc_1 = def(compose('hood', 'tunic', []), { a: '#a8754a', A: '#6f4a2c', b: '#e9e2d0', B: '#6f4a2c' });
SPR.npc_2 = def(compose('tiara', 'robe', []), { a: '#5fae5a', A: '#3a7d42', b: '#f7e3bd', h: '#8a5a36', H: '#5e3a22', i: '#8a5a36' });
SPR.npc_3 = def(compose('bald', 'tunic', []), { a: '#62b0ee', A: '#3572b8', b: '#e9e2d0', B: '#6f4a2c' });

// r7: 옛 대장 먼동 — 30번 문 안에 남았던 시조, 맺음 뒤 「돌아온 자」. 바랜 백발과 수염, 낡은 망토, 바랜 깃발 끈을 감은 손으로 짚은 깃대 (이야기 화자 초상용)
SPR.elder_mundong = def([
  '.............k..',
  '.....kkkkkk.kqk.',
  '....kllllllkkqqk',
  '...klLllllLlkqQk',
  '...kLssssssLkok.',
  '...kSsSssSsSkok.',
  '...ksskssksSkok.',
  '...klsSSSsslkok.',
  '..kAkllllllkkok.',
  '.kaAkLllllllkok.',
  '.kaAAkLlllLkqqk.',
  '.kaAaAkkkkkssqk.',
  '.kaAaaaAaAkSqok.',
  '.kAaaAaaAaaAkok.',
  '..kAAkAAkAAkkok.',
  '...kk.kk.kk..k..'], { l: '#d8d2c4', L: '#9e9686', s: '#e2b894', S: '#b0866a', a: '#6b7088', A: '#474b60', q: '#b8706a', Q: '#7e4a48', o: '#8a6a4a' });

// ── r8 gfx: 보스마다 얼굴 — 몸통 9종 돌려쓰기 위에 보스별 덧그림 몇 픽셀 + 겹치던 색 벌리기 ──
// 몸통 격자는 그대로 두고 over() 로 모자·뿔·무늬만 얹는다. 전갈 여왕만 새 격자(졸개 전갈을 24px 정면으로).
var HORN_OFF = [[4, 1, ['_']], [19, 1, ['_']], [4, 2, ['__']], [18, 2, ['__']], [4, 3, ['___']], [17, 3, ['___']], [5, 4, ['__']], [17, 4, ['__']]];      // 거인 몸의 뿔을 지운다
BIG.b_grok = over(BIG.b_brute, [[13, 1, ['kk.', 'SSk']]]);      // 혹부리: 이마의 혹
BIG.b_bargan = over(BIG.b_brute, [[9, 0, ['.k..k.', 'kxkkxk', '.bxxb.']]]);      // 불목 거인: 머리 위 불꽃
BIG.b_tormak = over(BIG.b_brute, [[1, 0, ['.kk', 'kbbk', '.kbbk']], [3, 3, ['k']], [18, 0, ['..kk.', '.kbbk', 'kbbk.']], [20, 3, ['k']], [11, 8, ['gg']]]);      // 뿔거인: 밖으로 뻗은 큰 뿔, 코뚜레
BIG.b_volko = over(BIG.b_brute, [[3, 1, ['______kkkkkk______', '____kkzzzzzzkk____', '_kkkzzzzggzzzzkkk_', '__kzzzzzzzzzzzzk__']], [8, 6, ['kk']], [10, 5, ['k']]]);      // 선장: 삼각모와 안대
BIG.b_warden = over(BIG.b_brute, HORN_OFF.concat([[10, 12, ['xxxx']], [11, 13, ['xx']], [10, 14, ['x..x']]]));      // 돌지기: 뿔 없는 석상, 가슴의 빛나는 문양
BIG.b_mire = over(BIG.b_brute, HORN_OFF.concat([[7, 17, ['kaaaaaaaak']], [7, 18, ['_kaaaaaaak_']], [7, 19, ['__kaaAaak__']], [6, 20, ['____kaaak____']], [6, 21, ['_____kkk_____']]]));      // 수렁의 그림자: 다리 대신 흘러내리는 꼬리
BIG.b_keeper = over(BIG.b_brute, [[10, 3, ['kyyk', 'kywk', 'akka']], [3, 12, ['x']], [20, 11, ['x']], [9, 16, ['x']], [14, 15, ['x']]]);      // 갱도지기: 이마의 등불, 몸에 박힌 광석
BIG.b_pippin = over(BIG.b_caster, [[4, 0, ['..kk', '.kbbk', 'kyk.k']], [5, 3, ['k']], [15, 0, ['.kk.', 'kbbk', '..kyk']]]);      // 요술쟁이: 방울 달린 두 갈래 모자
BIG.b_king = over(BIG.b_caster, [[8, 0, ['gkgkkgkg', 'gggggggg']], [8, 13, ['l......l'], ], [9, 15, ['l....l']], [8, 17, ['.l....l.']]]);      // 잠 못 드는 왕: 왕관, 풀린 붕대
BIG.b_belmar = over(BIG.b_caster, [[6, 0, ['kk.', 'krk', '.k.']], [15, 0, ['.kk', 'krk', '.k.']]]);      // 첨탑의 주인: 두건 위 붉은 뿔
BIG.b_tomb = over(BIG.b_beast, [[16, 1, ['.kk.', 'kbbk', '.bb.']], [9, 11, ['bb']], [5, 12, ['bb']], [6, 13, ['b']], [11, 14, ['bb']]]);      // 무덤지기 석수: 외뿔, 등에 낀 이끼
BIG.b_bonewyrm = over(BIG.b_dragon, [[12, 5, ['zxzaazxz']], [12, 14, ['zzz']], [11, 15, ['aaaaa']], [10, 16, ['zzzzzz']], [10, 17, ['aaaaaa']], [10, 18, ['zzzzz']], [12, 19, ['aa']]]);      // 뼈용: 퀭한 눈, 드러난 갈비뼈
BIG.b_heron = over(BIG.b_lord, [[4, 0, ['________________', '______kkkk______', '_____khhhhk_____', '_kkkkkrrrrkkkkk_', 'kHhhhhhhhhhhhhHk']], [7, 5, ['hssssssssh', 'hsksssksSh', 'hrrrrrrrRh']], [8, 8, ['rrRRRRrr']]]);      // 말몰이꾼: 챙 넓은 모자, 얼굴을 가린 붉은 수건, 채찍
BIG.b_scorp = [      // 여왕 전갈: 물음표처럼 말린 꼬리와 독침, 치켜든 두 집게, 머리의 금관
  '...........kkkk.........',
  '..........kaaaak........',
  '..........kaAkaak.......',
  '..........kaakkwwk......',
  '..........kaAk.kwk......',
  '.kk.k.....kaak..k..k.kk.',
  'kaakak....kaAk....kakaak',
  'kaAkak....kaak....kakAak',
  'kaaakk..k.kaAk.k..kkaaak',
  '.kaAak.kgkkaakkgk.kaAak.',
  '..kaaakkgggaagggkkaaak..',
  '...kaAakaxaaaaxakaAak...',
  '....kkkaaakwwkaaakkk....',
  '.kk..kaabbbbbbbbaak..kk.',
  'kyykkaaAaaaaaaaaAaakkyyk',
  '.kk.kaabbbbbbbbbbaak.kk.',
  '.kkkkaaAaaaaaaaaAaakkkk.',
  'kyyk.kaabbbbbbbbaak.kyyk',
  '.kk...kaaAaaaaAaak...kk.',
  '...kkk.kkaaaaaakk.kkk...',
  '..kyyk...kkkkkk...kyyk..',
  '...kk..............kk...',
  '........................',
  '........................'];
// 사막 3연전(11·12·13번)의 보스는 제 판 바닥(붉은 황토 #cf9462 · 무덤 바닥 #a89060)과 명도·색상이 벌어지게 잡는다 — 바닥과 같은 모래색 계열이면 외곽선만 남는다
BPAL.king = { a: '#e8dfc4', A: '#b3a67e', b: '#2fa89a', z: '#1d2a30', x: '#7fe3ff', y: '#7fe3ff', l: '#9c8a5e' };      // 바랜 흰 수의 + 청록 띠 (금관은 덧그림)
BPAL.tomb = { a: '#5d6178', A: '#3c3f55', b: '#7fae5a', x: '#7fe3ff' };      // 검푸른 현무암 돌짐승 + 이끼 (어미늑대의 밝은 회청과도 갈린다)
BPAL.ore = { a: '#3f7f86', A: '#27555c', b: '#c98a3a', B: '#8a5a22', x: '#9dffe0', y: '#ffe27a' };      // 광석 청록 + 등불
BPAL.heron = { a: '#8a5a36', A: '#5e3a22', b: '#b8323c', x: '#ffd24a', y: '#3a2a1a', w: '#c9a56a', h: '#3a3350', H: '#262036' };      // 가죽 외투, 붉은 수건, 검은 모자
BPAL.shara = { a: '#5e3552', A: '#3a2036', b: '#eaa85c', x: '#fff0a0', y: '#9a5a80', w: '#b6ff5a' };      // 검보라 등딱지에 금빛 띠, 독빛 침 (주황이면 붉은 모래에 묻힌다)
BPAL.pirate = { a: '#2f86a6', A: '#1f5d78', b: '#b8323c', B: '#f6cf57', x: '#ffffff' };      // 선장: 붉은 외투에 금단추 (가슴이 금판이었다)
BPAL.bone = { a: '#e2dac4', A: '#a39a84', b: '#5a5072', z: '#2b2440', x: '#b6ff5a', y: '#e2dac4' };      // 뼈용: 해진 어두운 날개막, 흰 뼈
// data.js 의 보스 표(sprite·pal)를 여기서 덮어쓴다 — 보스 표를 고치지 않고 그림만 바꾼다 (입구 창·대화 초상도 같은 값을 읽는다)
var BOSS_LOOK = { grok: ['b_grok'], bargan: ['b_bargan'], tormak: ['b_tormak'], volko: ['b_volko'], warden: ['b_warden'], mire: ['b_mire'], keeper: ['b_keeper', 'ore'], pippin: ['b_pippin'], king: ['b_king', 'king'], belmar: ['b_belmar'],
  tombbeast: ['b_tomb', 'tomb'], bonewyrm: ['b_bonewyrm'], heron: ['b_heron', 'heron'], shara: ['b_scorp', 'shara'] };
if (DS.BOSSES) for (var bk in BOSS_LOOK) if (DS.BOSSES[bk]) { DS.BOSSES[bk].sprite = BOSS_LOOK[bk][0]; if (BOSS_LOOK[bk][1]) DS.BOSSES[bk].pal = BOSS_LOOK[bk][1]; }


// ════════ r11 gfx: 시나리오 보스마다 제 몸 — 같은 몸통을 돌려 쓰던 열둘에 실루엣을 덧그린다 ════════
function er(x, y, w, h) { var r = '', a = []; for (var i = 0; i < w; i++) r += '_'; for (i = 0; i < h; i++) a.push(r); return [x, y, a]; }
var STAFF_OFF = [er(17, 1, 7, 10), er(18, 11, 6, 7), er(21, 11, 3, 2)];
BIG.b_nuri = over(BIG.b_caster, STAFF_OFF.concat([[20, 11, ['k']], [9, 0, ['.kyyk.']], [14, 0, ['.k']], [15, 1, ['kyk']], [16, 2, ['k']],
  [4, 20, ['kybkaybkaybkaybk']], [5, 21, ['kk..kk..kk..kk']], [2, 7, ['.k.', 'kyk', '.k.']], [20, 4, ['.k.', 'kyk', 'kyk', '.k.']], [19, 14, ['.k.', 'kyk', '.k.']]]));      // 물의 정령: 물결 머리, 물결 치마, 떠다니는 물방울
BIG.b_orbel = over(BIG.b_caster, [er(17, 1, 7, 9), [11, 0, ['kk']], [10, 1, ['kuuk']], [9, 2, ['kuguk']], [8, 3, ['kuuuUuk.']], [5, 4, ['kkkkkkkkkkkkkk']],
  [17, 1, ['.kkkk.', 'kg..gk', 'kgyygk', 'kg..gk', '.kkkk.']], [19, 6, ['kok', 'kok', 'kok']]]);      // 점성술사: 별 박힌 뾰족모자, 지팡이 끝의 혼천의
BIG.b_herald = over(BIG.b_caster, STAFF_OFF.concat([[20, 11, ['k']], [9, 0, ['yyyyyy']], [8, 1, ['y']], [15, 1, ['y']],
  [0, 3, ['kk....', 'kzk...', 'kzzk..', 'kzzzk.', '.kzzzk', '..kzzk', '...kk.']], [18, 3, ['....kk', '...kzk', '..kzzk', '.kzzzk', 'kzzzk.', 'kzzk..', '.kk...']]]));      // 어스름의 사도: 머리 위 빛고리, 어둠의 날개
var DEMON_OFF = [er(0, 0, 7, 5), er(17, 0, 7, 5), er(0, 5, 5, 9), er(19, 5, 5, 9)];
BIG.b_hagen = over(BIG.b_demon, DEMON_OFF.concat([[9, 1, ['kkkkkk']], [8, 2, ['kyyyyyyk']], [5, 3, ['kkkkkkkkkkkkkk']], [16, 0, ['.rk', 'rRk']],
  [2, 9, ['.kk', 'kak', 'kak', 'kak', '.k.']], [17, 10, ['kkkkkkk', 'koooooo', 'kkkmkkk']], [22, 7, ['k', 'm', 'm', 'm', 'm', 'm', 'm', 'k']]]));      // 사냥꾼 대장: 챙 넓은 모자·깃털, 날개 대신 쇠뇌
BIG.b_apostle = over(BIG.b_demon, [er(0, 0, 7, 5), er(17, 0, 7, 5), [9, 0, ['t..t..t']], [8, 1, ['ktTktTktk']], [12, 12, ['tt']], [11, 11, ['.tt.']],
  [1, 4, ['t']], [22, 4, ['t']], [0, 3, ['.']]]);      // 잿불의 사도: 불꽃 관, 가슴의 잿불
BIG.b_ilva = over(BIG.b_witch, [er(7, 0, 10, 5), [7, 1, ['.k..k..k.']], [7, 2, ['kck.kck.k']], [7, 3, ['kckkkckkck']], [6, 4, ['kccccccccck']],
  er(0, 3, 4, 3), [0, 2, ['.k.k.', 'kwkwk', '.www.', 'kwkwk', '.k.k.']]]);      // 서리 마녀: 고드름 관, 눈송이 지팡이
BIG.b_morga = over(BIG.b_witch, [[14, 8, ['llllk', 'lLLk.']], [14, 10, ['k']], er(0, 3, 4, 4), [0, 0, ['.e.', 'e.e', '.e.']], [0, 3, ['kkkk', 'kmMk', 'kMMk', '.kk.']]]);      // 역병의 주인: 부리 가면, 연기 피우는 향로
BIG.b_kardan = over(BIG.b_lord, [[10, 0, ['r.tr']], [9, 1, ['ktttTk']], [20, 4, ['t', 't', 'y', 't', 'y', 't', 't', 'y']], [19, 3, ['.r.']], [12, 11, ['tt']]]);      // 화염 성주: 불꽃 투구, 불타는 대검
BIG.b_roen = over(BIG.b_lord, [er(5, 0, 4, 4), er(15, 0, 4, 4), [9, 1, ['g.gg.g']], [9, 2, ['kggggk']], er(19, 4, 5, 9),
  [20, 2, ['k', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'k']], [21, 2, ['kkk', 'bgk', 'ggk', 'bgk', 'bbk', 'kk.']]]);      // 협곡 대공: 대공관, 칼 대신 문장 깃발
BIG.b_glacia = over(BIG.b_dragon, [[1, 2, ['..k..k', '.kck.kck', '.kck.kck']], [5, 1, ['.k', 'kck']], [9, 15, ['c']], [12, 17, ['c']], [3, 9, ['c']], [6, 12, ['c']], [13, 0, ['.k', 'kc']], [19, 0, ['.k', 'kc']]]);      // 서리용: 등의 얼음 결정, 얼음 뿔
BIG.b_ignar = over(BIG.b_dragon, [[13, 0, ['k.', 'kyk']], [20, 0, ['.k', 'kyk']], [3, 8, ['y']], [4, 10, ['y']], [6, 12, ['y']], [5, 13, ['y']], [11, 15, ['tt']], [12, 16, ['ytt']], [13, 18, ['t']], [21, 14, ['y']]]);      // 용암용: 큰 뿔, 날개와 배의 용암 틈
BIG.b_basil = over(BIG.b_serpent, [er(15, 1, 9, 11), [15, 11, ['k']], [0, 1, ['kk.......k']], [0, 2, ['kak.....kak']], [0, 3, ['kaak']], [8, 3, ['kaak']], [0, 4, ['kaak']], [8, 4, ['kaak']], [0, 5, ['kak']], [9, 5, ['kak']], [0, 6, ['k']], [10, 6, ['k']]]);      // 독니 바실: 머리 하나에 넓은 목깃
var BOSS_LOOK2 = { nuri: 'b_nuri', orbel: 'b_orbel', herald: 'b_herald', hagen: 'b_hagen', apostle: 'b_apostle', ilva: 'b_ilva', morga: 'b_morga', kardan: 'b_kardan', roen: 'b_roen', glacia: 'b_glacia', ignar: 'b_ignar', basil: 'b_basil' };
if (DS.BOSSES) for (var bk2 in BOSS_LOOK2) if (DS.BOSSES[bk2]) DS.BOSSES[bk2].sprite = BOSS_LOOK2[bk2];

// 유닛 → [스프라이트 이름, 보스 팔레트]
DS.lookName = function (cls, tier) {
  var c = DS.CLASSES[cls]; if (!c) return cls + '_' + tier;
  if (!c.master && tier >= 8 && DS.RISE_OF && DS.RISE_OF[cls] && DS.CLASSES[DS.RISE_OF[cls]]) { cls = DS.RISE_OF[cls]; c = DS.CLASSES[cls]; }      // 2.2.9: 8단부터 제 윗길의 모습
  var t = Math.max(c.start, Math.min(c.start + c.tiers.length - 1, tier));
  return cls + '_' + t;
};
DS.unitSprite = function (u) {
  if (u.look && u.look.length === 3) return [u.look[0] + '_' + u.look[1] + '_' + u.look[2], null];      // 용병: 종류_등급_생김새
  if (u.look) return [DS.lookName(u.look[0], u.look[1]), null];
  return [u.sprite, u.pal];
};

// ════════ r11 gfx: 옷차림 — 장비가 몸에 보이고, 나이가 몸에 보인다 (32px 원화 격자에 덧그린다) ════════
// 이름 꼴: '병과_단#w=무기id,a=방어구id,g=나이,x=성별,f=1' (DS.dressName). 칸이 없으면 지금 모습 그대로다.
//   g: child(아이·작은 몸) · teen(열다섯~열일곱) · youth(청년) · prime(장년) · elder(노년: 흰머리·굽은 자세) / f=1: 돌아온 이의 빛바랜 빛깔 한 점
var WEAP_IT = { wraps: 0, sword: 1, gsword: 1, spear: 1, halberd: 1, bow: 1, lbow: 1, staff: 1, sstaff: 1, wand: 1, cross: 1, orb: 1, trident: 1, mace: 1, kunai: 1, axe: 1, club: 1 };
DS.LOOKP = DS.LOOKP || {};
for (cls in LOOKS) LOOKS[cls].forEach(function (l, n) { DS.LOOKP[cls + '_' + (n + DS.CLASSES[cls].start)] = l; });
// 단(재질)마다 날의 빛깔 [밝음, 가운데, 그늘] — 청동·철·강철·은·미스릴·황금·용린·성은·창천·여명
var MAT = [null, ['#e6ad6c', '#b8743a', '#7a4a26'], ['#bcc4d2', '#848da2', '#565e74'], ['#e2e9f2', '#a7b2c6', '#6b7590'], ['#f6f8fc', '#c6cedd', '#8a94ab'],
  ['#dcfcff', '#8fd8e6', '#4f97ad'], ['#fff2b4', '#f0c24e', '#b0802a'], ['#ffb894', '#d0503a', '#7e2a2a'], ['#ffffff', '#dde6ff', '#9aa8d8'], ['#dcf2ff', '#74baff', '#3a6fc8'], ['#fff6ea', '#ffb7a6', '#c06a8a']];
var ACC = [null, '#c08f2c', '#c08f2c', '#c08f2c', '#dfe6f0', '#dfe6f0', '#f6cf57', '#f6cf57', '#f6cf57', '#f6cf57', '#ffe7a8'];
// 전설(고유 장비)의 모습: 모양 + 빛깔 [날 밝음, 가운데, 그늘, 장식, 보석]
var LEG = {
  grok: ['club', '#f4ead8', '#c8a878', '#8a6a44', '#8a5a36', '#ffffff'], mire: ['flail', '#9ab8a8', '#5e7f72', '#34504a', '#7a8a6a', '#b6ff5a'],
  kardan: ['great', '#ffe08a', '#ff7a2a', '#a8301e', '#3a2a2a', '#ffd24a'], ignar: ['fang', '#fff4dc', '#e8c89a', '#8a5a3a', '#d9442b', '#ff9a3c'],
  heron: ['tassel', '#e2e9f2', '#a7b2c6', '#6b7590', '#c0303a', '#e0525e'], twin: ['twin', '#f0ffd8', '#b6d27a', '#5a7a3a', '#3a5a2a', '#b6ff5a'],
  volko: ['harpoon', '#d8e8f0', '#8fb0c0', '#4a6a80', '#2f86a6', '#f6cf57'], keeper: ['pick', '#d8d0c0', '#9a8e78', '#5e5444', '#7a5a36', '#7fe3ff'],
  dawn: ['banner', '#fff6ea', '#ffb7a6', '#c06a8a', '#f6cf57', '#ff9a7a'],
  shara: ['sting', '#ffd0a0', '#c8642a', '#7a2a1a', '#f6cf57', '#ff4d6d'], hagen: ['xbow', '#c8ccd6', '#6a7084', '#3a3e50', '#5e3a22', '#e0525e'], harpy: ['feather', '#ffffff', '#cfe6f6', '#8aa8c8', '#8a5a36', '#9fe8ec'],
  tormak: ['horn', '#f4ead8', '#c8b080', '#7a6040', '#6f4a2c', '#ff4d6d'], king: ['scepter', '#f8e8b0', '#d8b060', '#8a6a2a', '#9a8a60', '#7fe3ff'], morga: ['censer', '#c8d0a0', '#8a9a5a', '#4a5a2a', '#5a4a3a', '#b6ff5a'],
  pippin: ['twisty', '#ffe0f4', '#ff9de1', '#c0447e', '#7fcf6a', '#fff0a0'], orbel: ['armil', '#f0f4ff', '#a8b8e8', '#5a6aa8', '#c9a227', '#9fe8ec'], apostle: ['ember', '#ffe8b0', '#ff9a3c', '#a8301e', '#3a3350', '#ffd24a'],
  bargan: ['hot', '#ffb070', '#d9542a', '#7a2a1a', '#ffd24a', '#ffd24a'], warden: ['stone', '#c8c4b8', '#8e8a7e', '#5a564c', '#7a9a6a', '#b6ff5a'], gate: ['bar', '#9aa0b0', '#5e6474', '#353a48', '#c9a227', '#c9a227'],
  roen: ['crest', '#e2e9f2', '#a7b2c6', '#6b7590', '#3572b8', '#f6cf57'], wyrm: ['bone', '#f0e8d4', '#c0b49a', '#7e7460', '#5a5072', '#b6ff5a'],
  shewolf: ['fur', '#d0ccc4', '#9a948a', '#5e5a54', '#5e3a22', '#ffffff'], tomb: ['mane', '#e8d0a0', '#b8955e', '#7a5e34', '#5e8a5a', '#9fe8ec'], basil: ['scale', '#a8e070', '#5a9a3a', '#2f5a24', '#c9a227', '#ffd24a'],
  swarm: ['wings', '#c8f0d8', '#7ab89a', '#3a6a5a', '#5a4a3a', '#7fe3ff'],
  nuri: ['water', '#d8f6ff', '#7fd0ee', '#3a8ab8', '#ffffff', '#ffffff'], belmar: ['dusk', '#b8a0e0', '#6a4a9a', '#3a2a5a', '#ff4d6d', '#ff4d6d'], ilva: ['frost', '#f0fbff', '#a8dcf0', '#5a9ac0', '#ffffff', '#c9f1ff'],
  glacia: ['frost', '#e8f8ff', '#8fc8e8', '#4a7ab0', '#c9f1ff', '#ffffff'], ghost: ['shroud', '#e8e8f0', '#b0b0c4', '#6a6a84', '#9fb8c8', '#ffffff'],
  // 2.1.0 새 전설 (모양은 있는 것을 빌리고 빛깔만 새로 — 빈 모양 '' 은 그 계열의 기본 모양)
  oath: ['great', '#f4f8ff', '#c6d2e6', '#7a88a6', '#f6cf57', '#9fe8ec'], thirst: ['fang', '#ffd8d8', '#d0505a', '#7a1a2a', '#3a2a2a', '#ff4d6d'], blood: ['great', '#ffb0b0', '#b0202a', '#5a0a14', '#2a1a1a', '#ff3040'],
  first: ['', '#e6ad6c', '#b8743a', '#7a4a26', '#f6cf57', '#ffffff'], sun: ['', '#fff6c0', '#f6c84a', '#b07a20', '#ff9a3c', '#ffffff'], moon: ['tassel', '#eef4ff', '#b8c8e8', '#6a7ab0', '#c9f1ff', '#ffffff'],
  finish: ['', '#e2e9f2', '#a7b2c6', '#6b7590', '#c0303a', '#e0525e'], pierce: ['xbow', '#f0e0c0', '#c0a070', '#7a5a34', '#5e3a22', '#ffd24a'], gale: ['feather', '#e8fbff', '#9fd8f0', '#4a8ab0', '#8a5a36', '#ffffff'],
  final: ['', '#ffd0a0', '#c8642a', '#7a2a1a', '#f6cf57', '#ff4d6d'], scale: ['club', '#fff2b4', '#f0c24e', '#b0802a', '#7a5a36', '#ffd24a'], mercy: ['scepter', '#ffffff', '#e6eef8', '#9aa8c8', '#f6cf57', '#9fe8ec'],
  bell: ['censer', '#fff6ea', '#ffd78a', '#b08a3a', '#f6cf57', '#ffffff'], echo: ['armil', '#e8e0ff', '#a890e8', '#5a4aa8', '#c9a227', '#c9f1ff'], lamp: ['ember', '#fff0c0', '#ffc860', '#b07a2a', '#5a4a3a', '#ffd24a'],
  spark: ['ember', '#ffd8a0', '#ff7a2a', '#a8301e', '#3a2a2a', '#ffd24a'], mirror: ['stone', '#f0f4ff', '#c0c8e0', '#7080a8', '#9fe8ec', '#ffffff'], wall: ['bar', '#c8c4b8', '#8e8a7e', '#5a564c', '#c9a227', '#ffd24a'],
  elder: ['crest', '#e2e9f2', '#a7b2c6', '#6b7590', '#b83535', '#f6cf57'], heal: ['scale', '#ffb894', '#d0503a', '#7e2a2a', '#ffd24a', '#ff9a3c'], young: ['fur', '#e8d8c0', '#b0946a', '#6a5034', '#b83535', '#f6cf57'],
  trick: ['', '#e0c8ff', '#9a72c8', '#5a3a8a', '#f6cf57', '#ffffff'], rage: ['fur', '#d8b0a0', '#9a5a4a', '#5a2a24', '#c0303a', '#ff4d6d'], post: ['', '#e6c8a0', '#b08a5a', '#6a4a2a', '#3572b8', '#ffffff'],
  star: ['dusk', '#e8e0ff', '#7a6ad8', '#3a2a8a', '#f6cf57', '#ffffff'], clear: ['water', '#e8fbff', '#9fe0f0', '#4a9ab8', '#ffffff', '#ffffff'], well: ['water', '#d8f0ff', '#6fb8e8', '#2a6aa8', '#c9a227', '#9fe8ec']
};
var UQ = ['#b181e6', '#ecdcff'];      // 유니크 표식 (장비 이름의 유니크 보라와 같은 빛)
function gearOf(id) { try { return id && DS.gear ? DS.gear(id) : null; } catch (e) { return null; } }
DS.dressParse = function (s) {
  var o = {}; String(s || '').split(',').forEach(function (kv) { var j = kv.indexOf('='); if (j > 0) o[kv.slice(0, j)] = kv.slice(j + 1); });
  return o;
};
DS.dressName = function (base, o) {
  if (!o) return base;
  var p = []; if (o.w) p.push('w=' + o.w); if (o.a) p.push('a=' + o.a); if (o.g) p.push('g=' + o.g); if (o.x) p.push('x=' + o.x); if (o.f) p.push('f=1'); if (o.r) p.push('r=' + o.r); if (+o.v > 0 && +o.v <= 3) p.push('v=' + (+o.v));      // 2.6.0 v: 그 사람의 살빛 · 머리빛 (용병 생김새 번호 1~3 — 병과 옷을 입어도 제 얼굴)      // r27 r: 테두리 빛(가주가 된 부대원의 단 — 's' 은빛 4~7단 · 'g' 금빛 8단↑)
  return p.length ? base + '#' + p.join(',') : base;
};
// 나이 단계: 다른 팀의 칸(u.ageSt · ch 의 생년)에서 읽는다. 없으면 '' (지금 모습)
function ageWord(S, e) {
  if (!S || !e || !DS.ageStage) return '';
  try {
    var st = DS.ageStage(S, e), a = DS.ageOf ? DS.ageOf(S, e) : null;
    if (st === 'young') return 'child';
    if (st === 'elder' || e.eld) return 'elder';
    if (a == null) return '';
    return a < 18 ? 'teen' : a < 26 ? 'youth' : 'prime';
  } catch (x) { return ''; }
}
function linP(S, e) { return e && e.pid && S && S.lin && S.lin.P ? S.lin.P[e.pid] : null; }
// 유닛 → 옷차림. 4.0 칸(있으면 먼저): u.gearW / u.gearA (장비 id) · u.ageSt ('child'|'teen'|'youth'|'prime'|'elder') · u.sx ('m'|'f') · u.faded (돌아온 이)
DS.unitDress = function (u) {
  var S = DS.G && DS.G.save, ch = null, m = null, o = {}, i;
  if (S && u.ch != null && S.chars) ch = S.chars[u.ch] || null;
  if (S && !ch && u.mid != null && S.mercs) for (i = 0; i < S.mercs.length; i++) if (S.mercs[i].id === u.mid) { m = S.mercs[i]; break; }
  var bm = null; if (S && u.bear && S.mercs) for (i = 0; i < S.mercs.length; i++) if (S.mercs[i].id === u.bear) { bm = S.mercs[i]; break; }      // r27 · 2.6.0: 가주 — 나이·성별·살빛은 깃발을 든 그 사람에게서 (옷은 가문 병과의 것)
  var e = bm || ch || m, p = linP(S, e), pv = bm || (ch && ch.ps) || m;
  o.w = u.gearW !== undefined ? u.gearW : ch ? ch.w : null;
  o.a = u.gearA !== undefined ? u.gearA : ch ? ch.a : null;
  o.g = u.ageSt !== undefined ? u.ageSt : ageWord(S, e);
  o.x = u.sx || (p && p.sx) || (e && e.sx) || '';
  o.f = u.faded !== undefined ? !!u.faded : !!(p && (p.rv || p.ret));
  if (u.role === 'cmd' && !u.plook && pv && pv.v) o.v = pv.v;      // 2.6.0: 병과 옷을 입은 가주 · 맹주의 제 살빛
  return o;
};
DS.unitSpriteName = function (u) {
  var sp = DS.unitSprite(u);
  if (sp[1] || u.side !== 'ally' || !DS.LOOKP) return sp[0];
  var o = DS.unitDress(u);
  if (u.role !== 'cmd' || u.plook) { o.w = null; o.a = null; }      // 용병은 제 무기(격자)를 쓴다 — 나이만. r27: 가주가 된 부대원도 제 모습(무기 격자) 그대로
  if (u.plook && DS.rimOf) o.r = DS.rimOf(u.tier || 1);      // r27: 대신 단은 테두리 빛으로 (지휘관 그림과 같은 은테·금테)
  return DS.dressName(sp[0], o);
};
// r27: 가문(깃발) 한 줄의 「가주의 모습」 → [그림 이름, 빛깔, 크기 배율] 또는 null(대장 가문·빈 가문 — 병과 그림 그대로).
//   tier 를 주면 그 단의 테두리 빛으로 (승급 창의 전·후)
// 2.6.0 모습은 병과와 단을 따른다 (사용자: 「병과가 바뀌어도 외형이 그대로일 때가 있다 — 자연스럽게 바뀌게」).
//   가주 = 그 가문 병과의 그 단 모습 (DS.lookName — 8단부터 윗길) + 가문의 무기 · 방어구 + 그 사람의 나이 · 성별 · 살빛. 승급하면 테두리 빛만이 아니라 옷이 바뀐다.
//   막사에서 기다리는 이 = 받은 병과(m.nc · 아홉은 제 집)의 제 단 모습 (장비 없이). 맹주 가문원은 따르는 종류(소드맨 · 랜서 …)로 싸우니 그 종류의 모습 그대로.
//   제 몸을 지닌 종족(그리폰 · 머맨 · 돌 정령 · 해골)과 큰 용병은 옷을 갈아입지 못한다 — 제 모습 그대로, 단은 테두리 빛(은 · 금)으로만 (DS.keepsBody).
var HUMAN_KIND = { m_sword: 1, m_lancer: 1, m_pike: 1, m_archer: 1, m_sister: 1, m_templar: 1 };
DS.keepsBody = function (who) { var M = who && who.type && DS.MERCS && DS.MERCS[who.type]; return !!(M && (M.big || !HUMAN_KIND[who.type])); };
var bearerLook0 = DS.bearerLook;
DS.bearerLook = function (who) { return bearerLook0 && DS.keepsBody(who) ? bearerLook0(who) : null; };      // 전투 사양(banner.js cmdSpec)이 읽는다: 사람 꼴이면 null → 가문 병과의 모습 [병과, 단]
// 가문(깃발) 한 줄의 「가주의 모습」 → [그림 이름, 빛깔, 크기 배율] 또는 null(맹주 가문·빈 가문 — 병과 그림 그대로). tier 를 주면 그 단의 모습 (승급 창의 전·후)
DS.charLook = function (ch, save, tier, who) {      // who: 그 사람을 직접 (방금 쓰러져 깃발에서 내려진 가주)
  var S = save || (DS.G && DS.G.save); if (!S || !ch || !DS.bearer || ch.id === +S.hero) return null;
  if (!who) { try { who = DS.bearer(S, ch); } catch (x) { who = null; } }
  if (!who || !who.type || !DS.MERCS || !DS.MERCS[who.type]) return null;
  var t = tier || (DS.tierOfL ? DS.tierOfL(who.L != null && DS.pL ? DS.pL(who) : ch.L) : 1);
  var p = linP(S, who), bl = bearerLook0 && DS.keepsBody(who) ? bearerLook0(who) : null;
  if (bl && bl.big) return [bl.sprite, bl.pal, 0.75];
  if (bl && !(t >= 8 && DS.RISE_OF && DS.RISE_OF[ch.cls])) return [DS.dressName(bl.look.join('_'), { g: ageWord(S, who), x: (p && p.sx) || '', f: !!(p && (p.rv || p.ret)), r: DS.rimOf ? DS.rimOf(t) : '' }), '', 1];
  return [DS.dressName(DS.lookName(ch.cls, t), { w: ch.w, a: ch.a, g: ageWord(S, who), x: (p && p.sx) || who.sx || '', f: !!(p && (p.rv || p.ret)), v: who.v }), '', 1];
};
// 사람 하나(용병 기록)의 초상 → [그림 이름, 빛깔, 크기 배율]. 가주면 가문의 모습, 막사면 받은 병과의 제 단 모습, 그 밖(맹주 가문원 · 제 몸의 종족)은 종류의 모습
DS.personLook = function (m, save) {
  var S = save || (DS.G && DS.G.save), M = m && m.type && DS.MERCS && DS.MERCS[m.type];
  if (!M) return m && m.cls && DS.CLASSES[m.cls] ? [DS.lookName(m.cls, DS.tierOfL(m.L || 1)), '', 1] : ['m_sword_1_0', '', 1];
  if (M.big) return [M.sprite, M.pal, 0.75];
  var own = [m.type + '_' + (m.g || 1) + '_' + (m.v || 0), '', 1];
  if (!S || !S.chars || m.id == null) return own;
  if (m.h && m.o && S.chars[m.o] && m.o !== +S.hero) { var cl = null; try { cl = DS.charLook(S.chars[m.o], S, 0, m); } catch (x) { cl = null; } return cl || own; }
  var c = m.cast || m.nc;
  if (!m.o && c && DS.CLASSES[c] && !DS.keepsBody(m)) { var p = linP(S, m); return [DS.dressName(DS.lookName(c, DS.tierOfL(DS.pL ? DS.pL(m) : m.L || 1)), { g: ageWord(S, m), x: (p && p.sx) || m.sx || '', f: !!(p && (p.rv || p.ret)), v: m.v }), '', 1]; }
  return own;
};
DS.charSprite = function (ch, save) {      // 화면(초상·가계도)용: 지휘관 한 사람의 옷 입은 모습 이름 (game.js charSpr 이 이것을 쓰면 장비·나이가 초상에도 보인다)
  var S = save || (DS.G && DS.G.save), base = DS.lookName(ch.cls, DS.tierOfL ? DS.tierOfL(ch.L) : 1), p = linP(S, ch);
  return DS.dressName(base, { w: ch.w, a: ch.a, g: ageWord(S, ch), x: p && p.sx || '', f: !!(p && (p.rv || p.ret)), v: ch.ps && ch.ps.v });      // 2.6.0 v: 맹주가 된 이의 제 살빛
};

// ── 32px 무기 그림: 층(layer)에 그린 뒤 1px 외곽선을 둘러 몸 위에 얹는다 ──
var HX = 26, HY = 21;      // 오른손(32px 격자)
function wDraw(L, N, cat, line, t, cls, leg) {
  function P(x, y, c) { if (x >= 0 && y >= 0 && x < N && y < N) L[y * N + x] = c; }
  function V(x, y0, y1, c) { for (var y = y0; y <= y1; y++) P(x, y, c); }
  function H(x0, x1, y, c) { for (var x = x0; x <= x1; x++) P(x, y, c); }
  var x = HX, sh = leg ? leg[0] : null, i, y;
  if (cat === 'sword') {
    if (sh === 'club') { V(x, 13, 23, '5'); for (y = 3; y <= 13; y++) { var w = y < 5 || y > 11 ? 1 : 2; H(x - w, x + w, y, '2'); P(x - w, y, '1'); P(x + w, y, '3'); } P(x - 1, 6, '1'); P(x + 1, 9, '1'); return; }
    if (sh === 'flail') { V(x, 15, 23, '5'); P(x, 14, '4'); P(x + 1, 12, '4'); P(x + 1, 10, '4'); for (y = 3; y <= 9; y++) H(x - 1 + (y < 5 ? 1 : 0), x + 3 - (y < 5 ? 1 : 0), y, y < 6 ? '1' : '2'); P(x + 1, 9, '7'); return; }
    if (sh === 'fang') { V(x, 17, 23, '5'); H(x - 2, x + 2, 17, '4'); for (y = 2; y <= 16; y++) { var cx = x + Math.round(2 * Math.sin((16 - y) / 14 * 1.4)); P(cx, y, '1'); P(cx + 1, y, y < 4 ? '1' : '2'); } P(x, 16, '7'); return; }
    if (sh === 'great' || (!sh && line === 'A' && t >= 7)) {      // 대검: 날이 넓고 가운데 홈
      for (y = 2; y <= 16; y++) { if (y < 4) { P(x, y, '1'); P(x + 1, y, '2'); continue; } P(x - 1, y, '1'); P(x, y, '1'); P(x + 1, y, '2'); P(x + 2, y, '3'); if (y > 5 && y < 15) P(x + (y & 1 ? 0 : 1), y, sh === 'great' ? '7' : '3'); }
      H(x - 4, x + 5, 17, '4'); P(x - 4, 16, '4'); P(x + 5, 16, '4'); P(x, 17, '7'); P(x + 1, 17, '7'); V(x, 18, 21, '5'); V(x + 1, 18, 21, '6'); P(x, 22, '4'); P(x + 1, 22, '4'); return;
    }
    if (line === 'B') { V(x + 1, 2, 16, '1'); P(x + 1, 1, '1'); P(x, 17, '4'); P(x + 2, 17, '4'); H(x - 1, x + 3, 18, '4'); P(x - 2, 19, '4'); P(x + 4, 19, '4'); V(x + 1, 19, 21, '5'); P(x + 1, 22, '4'); return; }
    V(x, 3, 16, '1'); V(x + 1, 3, 16, '2'); P(x, 2, '1'); if (t >= 4) V(x, 5, 14, '1'); H(x - 3, x + 4, 17, '4'); if (t >= 4) { P(x - 3, 16, '4'); P(x + 4, 16, '4'); } V(x, 18, 21, '5'); V(x + 1, 18, 21, '6'); P(x, 22, '4'); P(x + 1, 22, '4');
    if (t >= 4) P(x, 17, '7');
    return;
  }
  if (cat === 'lance') {
    if (sh === 'pick') { V(x, 3, 31, '5'); H(x - 4, x + 4, 3, '2'); H(x - 3, x + 3, 2, '1'); P(x - 5, 4, '2'); P(x + 5, 4, '3'); P(x - 6, 5, '3'); P(x + 6, 5, '3'); P(x, 3, '7'); return; }
    if (sh === 'harpoon') { V(x, 6, 31, '5'); V(x, 0, 5, '1'); P(x - 1, 2, '1'); P(x - 2, 3, '2'); P(x + 1, 2, '2'); P(x + 2, 3, '3'); P(x - 1, 6, '4'); P(x + 1, 6, '4'); P(x + 2, 8, '4'); P(x + 3, 9, '4'); P(x + 3, 10, '4'); return; }
    if (sh === 'twin') { V(x, 6, 31, '5'); for (y = 0; y <= 5; y++) { P(x - 2 + (y > 3 ? 1 : 0), y, y < 2 ? '1' : '2'); P(x + 2 - (y > 3 ? 1 : 0), y, y < 2 ? '1' : '3'); } H(x - 1, x + 1, 5, '4'); P(x, 4, '7'); return; }
    if (cls === 'mar' || cls === 'tm') {      // 수군: 창은 삼지창 꼴
      V(x, 5, 31, '5'); for (y = 0; y <= 3; y++) { P(x - 2, y, '1'); P(x, y, '1'); P(x + 2, y, '2'); } H(x - 2, x + 2, 4, '2'); P(x, 5, '4');
      if (t >= 7) { P(x - 3, 2, '2'); P(x + 3, 2, '3'); }
      return;
    }
    if (line === 'B') { V(x, 2, 31, '5'); P(x, 0, '1'); P(x, 1, '1'); var ax = [[3, 2], [4, 3], [5, 4], [6, 4], [7, 4], [8, 3], [9, 2]]; ax.forEach(function (a) { for (var k = 1; k <= a[1]; k++) P(x + k, a[0], k === a[1] ? '3' : k === 1 ? '1' : '2'); }); P(x - 1, 4, '2'); P(x - 2, 5, '2'); P(x - 1, 5, '2'); return; }
    V(x, 7, 31, '5'); P(x, 0, '1'); for (y = 1; y <= 4; y++) { P(x - 1, y, '1'); P(x, y, y < 3 ? '1' : '2'); P(x + 1, y, '2'); } P(x, 5, '2'); H(x - 1, x + 1, 6, '4');
    if (t >= 7) { P(x - 2, 4, '2'); P(x + 2, 4, '3'); P(x - 3, 5, '3'); P(x + 3, 5, '3'); }
    if (sh === 'tassel') { P(x - 1, 7, '7'); P(x - 1, 8, '7'); P(x - 2, 9, '7'); P(x - 1, 9, '4'); }
    if (sh === 'banner') { for (y = 8; y <= 13; y++) for (i = 1; i <= 6 - (y > 11 ? (y - 11) * 2 : 0); i++) P(x - i, y, y < 10 ? '8' : y < 12 ? '7' : '4'); }
    return;
  }
  if (cat === 'bow') {
    if (sh === 'xbow' || line === 'B') {      // 쇠뇌: 가로 개머리 + 세로 활대
      H(x - 7, x + 2, 19, '5'); H(x - 6, x + 1, 20, '6'); for (y = 13; y <= 25; y++) P(x + 3 + (y < 15 || y > 23 ? -1 : 0), y, y < 19 ? '1' : '2');
      for (y = 14; y <= 18; y++) P(x + 2 - Math.round((y - 14) * 0.6), y, '9'); for (y = 20; y <= 24; y++) P(x - 1 + Math.round((y - 20) * 0.6), y, '9'); H(x + 3, x + 5, 18, '1');
      if (sh === 'xbow') { P(x + 4, 13, '4'); P(x + 4, 25, '4'); P(x - 7, 18, '4'); }
      return;
    }
    for (y = 2; y <= 24; y++) { var bx = x + 1 + Math.round(3.4 * Math.sin(Math.PI * (y - 2) / 22)); P(bx, y, sh === 'sting' ? (y < 13 ? '1' : '2') : '5'); if (y > 9 && y < 17) P(bx + 1, y, '6'); }
    V(x, 3, 23, '9'); P(x + 1, 2, '4'); P(x + 1, 24, '4');
    if (t >= 7 || sh) { P(x + 4, 12, '4'); P(x + 4, 13, '7'); P(x + 4, 14, '4'); }
    if (sh === 'sting') { P(x + 2, 1, '1'); P(x + 3, 0, '1'); P(x + 4, 1, '7'); }
    if (sh === 'feather') { P(x + 2, 1, '1'); P(x + 3, 2, '2'); P(x + 2, 25, '1'); P(x + 3, 24, '2'); P(x + 3, 1, '1'); }
    return;
  }
  if (cat === 'wand') {
    if (sh === 'censer') { V(x, 10, 23, '5'); V(x + 1, 6, 10, '4'); H(x - 1, x + 3, 6, '2'); H(x - 1, x + 3, 7, '3'); H(x, x + 2, 8, '3'); P(x + 1, 3, '7'); P(x + 2, 4, '7'); P(x, 2, '8'); return; }
    if (sh === 'horn') { V(x, 9, 23, '5'); for (y = 2; y <= 8; y++) { P(x - 1 + Math.round((8 - y) * 0.4), y, '1'); P(x + Math.round((8 - y) * 0.4), y, '2'); } P(x + 3, 2, '3'); P(x + 3, 1, '3'); return; }
    if (sh === 'scepter' || line === 'B') {      // 홀·성구 지팡이: 금빛 자루, 머리에 별/십자
      V(x, 7, 23, sh === 'scepter' ? '4' : '4'); V(x, 1, 6, '1'); H(x - 2, x + 2, 3, '1'); P(x, 3, '7');
      if (sh === 'scepter') { P(x - 2, 1, '4'); P(x + 2, 1, '4'); P(x, 0, '4'); H(x - 2, x + 2, 2, '2'); }
      if (cls === 'mon') { P(x - 1, 1, '1'); P(x + 1, 1, '1'); P(x - 1, 5, '1'); P(x + 1, 5, '1'); }      // 수도승: 고리 지팡이
      return;
    }
    V(x, 9, 23, '5'); P(x, 2, '1'); for (y = 3; y <= 8; y++) { var mw = y < 4 || y > 7 ? 1 : 2; for (i = -mw; i <= mw; i++) P(x + i, y, i < 0 ? '1' : i > 0 ? '3' : '2'); } P(x - 3, 5, '2'); P(x + 3, 5, '3'); P(x - 3, 6, '2'); P(x + 3, 6, '3');
    if (t >= 7) P(x, 5, '7');
    return;
  }
  if (cat === 'staff') {
    var wood = '5';
    if (sh === 'twisty') { for (y = 5; y <= 31; y++) P(x + ((y >> 1) & 1), y, y & 2 ? '5' : '7'); H(x - 1, x + 1, 2, '8'); V(x, 0, 4, '8'); P(x, 2, '7'); return; }
    if (sh === 'armil') { V(x, 6, 31, wood); for (i = 0; i < 12; i++) { var a = i / 12 * 6.283; P(x + Math.round(Math.cos(a) * 3), 3 + Math.round(Math.sin(a) * 3), '4'); } P(x, 3, '7'); H(x - 4, x + 4, 3, '1'); return; }
    if (sh === 'ember') { V(x, 6, 31, '6'); H(x - 1, x + 1, 5, '4'); P(x, 4, '2'); P(x - 1, 3, '2'); P(x + 1, 3, '2'); P(x, 3, '1'); P(x, 2, '1'); P(x - 1, 1, '7'); P(x + 1, 0, '7'); P(x, 1, '8'); return; }
    if (cls === 'sha') {      // 주술사: 해골 지팡이
      V(x, 6, 31, wood); H(x - 2, x + 2, 1, 'l'); H(x - 2, x + 2, 2, 'l'); H(x - 2, x + 2, 3, 'l'); H(x - 1, x + 1, 4, 'L'); P(x - 1, 2, 'k'); P(x + 1, 2, 'k'); P(x, 5, '4');
      if (line === 'B') { P(x - 3, 0, '7'); P(x + 3, 0, '7'); }
      return;
    }
    if (line === 'B') {      // 룬 지팡이: 떠 있는 결정 + 자루의 룬
      V(x, 6, 31, wood); P(x - 2, 4, '4'); P(x + 2, 4, '4'); P(x - 1, 5, '4'); P(x + 1, 5, '4'); P(x, 0, '8'); H(x - 1, x + 1, 1, '7'); P(x - 1, 1, '8'); H(x - 1, x + 1, 2, '7'); P(x, 3, '7');
      for (y = 10; y <= 25; y += 5) P(x, y, '7');
      return;
    }
    V(x, 5, 31, wood); for (y = 0; y <= 4; y++) for (i = -2; i <= 2; i++) if (i * i + (y - 2) * (y - 2) <= 5) P(x + i, y, i + y < 2 ? '8' : '7');      // 구슬 지팡이
    H(x - 1, x + 1, 5, '4'); if (t >= 7) { P(x - 3, 2, '4'); P(x + 3, 2, '4'); }
    return;
  }
}
function wPal(g, cls, d) {
  var t = g.mat || g.tier || 1, m = MAT[Math.max(1, Math.min(10, t))], lg = g.grade >= 5 ? LEG[g.line] : null;
  var gem = (d && d.pal && d.pal.c) || DS.PAL.c, p = { 1: m[0], 2: m[1], 3: m[2], 4: ACC[Math.max(1, Math.min(10, t))], 5: t >= 8 ? '#6a4a5e' : '#a8754a', 6: t >= 8 ? '#3e2a3a' : '#6f4a2c', 7: gem, 8: '#ffffff', 9: '#efe6d0' };
  if (lg) { p[1] = lg[1]; p[2] = lg[2]; p[3] = lg[3]; p[4] = lg[4]; p[7] = lg[5]; p[8] = '#ffffff'; }
  else if (g.grade === 4) { p[7] = UQ[0]; p[8] = UQ[1]; }
  return p;
}
// 방어구 덧그림 (몸 칸: 32px 격자 16~31줄). 쓰는 글자: ! " # 판금 · $ 장식 · % & 가죽 · ' 보석 · ( ) 비단 결
function aDraw(q, N, g, body) {
  var lg = g.grade >= 5 ? LEG[g.line] : null, sh = lg ? lg[0] : null, x, y, i;
  function at(x, y) { return x < 0 || y < 0 || x >= N || y >= N ? '.' : q[y * N + x]; }
  function P(x, y, c) { if (x >= 0 && y >= 0 && x < N && y < N && q[y * N + x] !== '.') q[y * N + x] = c; }
  function cloth(c) { return c === 'a' || c === 'A'; }
  var rowL = {}, rowR = {};
  for (y = 16; y < 30; y++) { rowL[y] = -1; rowR[y] = -1; for (x = 0; x < N; x++) if (cloth(at(x, y))) { if (rowL[y] < 0) rowL[y] = x; rowR[y] = x; } }
  var cx = 15, cy = 22;
  if (g.cat === 'heavy') {
    var PD = ['.kkkk.', 'k!!!!k', 'k\"\"\"\"k', 'k####k', '.kkkk.'], hi = (g.mat || g.tier) >= 7;      // 견갑: 어깨 밖으로 둥글게 솟은 판금 (7단↑ 장식 테)
    [rowL[17], rowR[17]].forEach(function (ex, side) { if (ex < 0) return; var x0 = side ? ex - 3 : ex - 2, y0 = 15;
      PD.forEach(function (row, yy) { for (var xx = 0; xx < 6; xx++) { var c = row[xx], X = x0 + xx, Y = y0 + yy; if (c === '.' || X < 0 || X >= N) continue; var u = q[Y * N + X];
        if (c === 'k') { if (u === '.' || u === 'k') q[Y * N + X] = 'k'; } else if (u !== 's' && u !== 'S') q[Y * N + X] = hi && yy === 1 ? '$' : c; } }); });
    if (g.line === 'B' && sh !== 'stone') { for (y = 19; y <= 25; y++) for (x = rowL[y]; x >= 0 && x <= rowR[y]; x++) if (cloth(at(x, y)) && ((x + y) & 1)) P(x, y, (y & 1) ? '"' : '#'); }      // 사슬: 촘촘한 쇠고리 결
    else { for (x = rowL[22]; x >= 0 && x <= rowR[22]; x++) if (cloth(at(x, 22))) P(x, 22, '#'); for (y = 18; y <= 21; y++) if (cloth(at(cx, y))) P(cx, y, '!'); }      // 판금: 가슴 판 이음매와 등줄
  } else if (g.cat === 'light') {
    for (i = 0; i < 9; i++) { x = (rowL[18] >= 0 ? rowL[18] + 2 : 9) + i; y = 18 + i; if (cloth(at(x, y)) || at(x, y) === 'b' || at(x, y) === 'B') P(x, y, '%'); }      // 어깨에서 허리로 가죽 끈
    for (x = rowL[24]; x >= 0 && x <= rowR[24]; x++) if (cloth(at(x, 24))) P(x, 24, '&');
    if (g.line === 'B') { [[rowL[17] - 1, -1], [rowR[17] + 1, 1]].forEach(function (s) { if (s[0] < 1) return; for (var k = 0; k < 3; k++) { var X = s[0] + s[1] * k, Y = 17 - k; if (X >= 0 && X < N && q[Y * N + X] === '.') q[Y * N + X] = '!'; } }); }      // 깃 가드: 어깨의 작은 깃
  } else if (g.cat === 'robe') {
    var bot = -1; for (y = 29; y >= 20; y--) if (rowL[y] >= 0) { bot = y; break; }
    if (bot > 0) for (x = rowL[bot]; x <= rowR[bot]; x++) if (cloth(at(x, bot))) P(x, bot, '$');      // 단 장식
    if (g.line === 'B') { for (y = 18; y < bot; y++) for (x = rowL[y]; x >= 0 && x <= rowR[y]; x++) if (cloth(at(x, y)) && (x - y + 40) % 5 === 0) P(x, y, '('); if (bot > 1) for (x = rowL[bot - 1]; x <= rowR[bot - 1]; x++) if (cloth(at(x, bot - 1)) && (x & 1)) P(x, bot - 1, '$'); }      // 비단: 사선 결 + 두 줄 단
  }
  // 전설 방어구의 고유 무늬
  if (sh === 'fur' || sh === 'mane') { for (x = (rowL[16] >= 0 ? rowL[16] : 8) - 1; x <= (rowR[16] >= 0 ? rowR[16] : 23) + 1; x++) { P(x, 16, ((x & 1) ? '!' : '"')); if (x & 1) P(x, 17, '"'); } }
  if (sh === 'bar') { for (x = rowL[20]; x >= 0 && x <= rowR[20]; x++) { P(x, 20, '!'); P(x, 21, '#'); } }
  if (sh === 'crest') { for (y = 19; y <= 24; y++) for (x = cx - 2; x <= cx + 2; x++) if (!(y === 24 && (x === cx - 2 || x === cx + 2))) P(x, y, y === 19 ? '$' : (x === cx || y === 21) ? '$' : "'"); }
  if (sh === 'bone' || sh === 'scale') { for (y = 18; y <= 26; y++) for (x = rowL[y]; x >= 0 && x <= rowR[y]; x++) if (cloth(at(x, y)) && ((x + (y >> 1) * 2) % 4 === 0)) P(x, y, (y & 1) ? '!' : '"'); }
  if (sh === 'hot') { for (y = 19; y <= 25; y += 3) for (x = rowL[y]; x >= 0 && x <= rowR[y]; x++) if ((x + y) % 3) P(x, y, "'"); }
  if (sh === 'stone') { for (y = 18; y <= 26; y++) for (x = rowL[y]; x >= 0 && x <= rowR[y]; x++) if (cloth(at(x, y))) P(x, y, ((x * 7 + y * 3) % 9 === 0) ? '#' : (y % 4 === 0 ? '#' : '"')); }
  if (sh === 'wings') { for (y = 14; y <= 24; y++) { var wx = Math.round((y - 14) * 0.5); [3 + wx, 28 - wx].forEach(function (X) { if (q[y * N + X] === '.') q[y * N + X] = (y & 1) ? '(' : ')'; }); } }
  if (sh === 'water' || sh === 'frost' || sh === 'dusk' || sh === 'shroud') { for (y = 18; y <= 28; y++) for (x = rowL[y]; x >= 0 && x <= rowR[y]; x++) if (cloth(at(x, y)) && ((x + y * 2) % 6 === 0)) P(x, y, '('); }
  // 유니크·전설: 가슴의 보석 한 점
  if (g.grade >= 4 && sh !== 'crest') { P(cx, 19, "'"); P(cx + 1, 19, "'"); }
}
function aPal(g, d) {
  var t = g.mat || g.tier || 1, m = MAT[Math.max(1, Math.min(10, t))], lg = g.grade >= 5 ? LEG[g.line] : null;
  var p = { '!': m[0], '"': m[1], '#': m[2], '$': ACC[Math.max(1, Math.min(10, t))], '%': '#8a5a36', '&': '#5e3a22', "'": g.grade === 4 ? UQ[0] : '#62b0ee', '(': '#ffffff', ')': '#cfd6e6' };
  if (g.cat === 'light' && g.line === 'B') { p['!'] = '#ffffff'; }

  if (g.cat === 'robe' && d && d.pal && d.pal.a && DS.sprTools) { var tt = DS.sprTools.tone(DS.sprTools.rgb(d.pal.a), 0.4); p['('] = '#' + tt.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  if (lg) { p['!'] = lg[1]; p['"'] = lg[2]; p['#'] = lg[3]; p['$'] = lg[4]; p["'"] = lg[5]; p['('] = lg[1]; p[')'] = lg[2]; }
  return p;
}
// 나이: 32px 격자에서 몸을 바꾼다
function agePaint(q, N, age, sx, body) {
  var x, y, Q;
  function at(x, y) { return x < 0 || y < 0 || x >= N || y >= N ? '.' : q[y * N + x]; }
  function cut(y0, n) {      // y0 줄부터 n 줄을 빼고 위쪽을 아래로 내린다 (발은 땅에 그대로)
    Q = q.slice(); for (y = N - 1; y >= 0; y--) for (x = 0; x < N; x++) { var sy = y >= y0 + n ? y : y - n; q[y * N + x] = sy >= 0 && (y >= y0 + n || sy < y0) ? Q[sy * N + x] : '.'; }
  }
  if (age === 'child') cut(21, 5);
  else if (age === 'teen') cut(20, 2);
  if (age === 'elder') {
    // 흰머리: 얼굴 옆의 피부 끝 한 칸·눈썹을 은빛으로, 남자는 턱수염
    for (y = 8; y <= 15; y++) {
      var l = -1, r = -1; for (x = 0; x < N; x++) if (at(x, y) === 's' || at(x, y) === 'S') { if (l < 0) l = x; r = x; }
      if (l >= 0 && r - l > 4 && y >= 9 && y <= 13) { q[y * N + l] = '^'; q[y * N + r] = '^'; }
    }
    for (y = 9; y <= 14; y++) for (x = 1; x < N - 1; x++) if (at(x, y) === 'S' && (at(x, y + 1) === 'k' || at(x, y + 1) === 's')) q[y * N + x] = '^';      // 눈썹
    if (sx !== 'f') for (x = 0; x < N; x++) { if (at(x, 15) === 's' || at(x, 15) === 'S') q[15 * N + x] = (x & 1) ? '^' : '~'; if (at(x, 14) === 's' && (at(x - 1, 14) === 'k' || at(x + 1, 14) === 'k') && false) q[14 * N + x] = '^'; }
    // 굽은 자세: 머리와 어깨(0~17줄)를 한 칸 앞·한 칸 아래로
    Q = q.slice(); for (y = 0; y <= 18; y++) for (x = 0; x < N; x++) q[y * N + x] = y >= 16 ? Q[y * N + x] : '.';
    for (y = 0; y <= 17; y++) for (x = 0; x < N - 1; x++) { var c = Q[y * N + x]; if (c !== '.') q[(y + 1) * N + x + 1] = c; }
  }
  if (age === 'prime' && sx !== 'f') for (x = 0; x < N; x++) if (at(x, 15) === 's' && ((x + 1) & 1)) q[15 * N + x] = 'S';      // 장년: 턱 그늘(수염 자국)
}
function fadePaint(q, N) {      // 돌아온 이: 가슴에 빛바랜 빛깔 한 점
  var best = -1; for (var y = 17; y <= 22 && best < 0; y++) for (var x = 12; x <= 18; x++) { var c = q[y * N + x]; if (c !== '.' && c !== 'k' && c !== 's' && c !== 'S') { best = y * N + x; break; } }
  if (best >= 0) { q[best] = '`'; if (q[best + 1] !== '.' && q[best + 1] !== 'k') q[best + 1] = '`'; if (q[best + N] !== '.' && q[best + N] !== 'k') q[best + N] = '|'; }
}
var WCH = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 };
DS.dressPrep = function (name, s, d) {
  var o = typeof s === 'string' ? DS.dressParse(s) : s, look = DS.LOOKP[name], cls = name.split('_')[0];
  var W = gearOf(o.w), A = gearOf(o.a), out = { pal: {}, flat: {} }, age = o.g || '';
  if (W && (W.cat === 'fist' || cls === 'cle')) W = null;      // 2.2.6 무투가: 권갑 · 옛 성구는 손에 감긴 꼴 그대로 (막대 무기를 그리지 않는다)
  var human = !!look || /_\d+_\d+$/.test(name) && d.size === 16;
  if (look && W && age !== 'child') out.rows = compose(look[0], look[1], look[2].filter(function (it) { return !WEAP_IT[it]; }));
  else if (look && age === 'child') out.rows = compose(look[0], look[1], look[2].filter(function (it) { return !WEAP_IT[it] && it !== 'shield'; }));
  if (out.rows) { var ext = {}; }
  out.paint = function (q, N) {
    if (look && A && age !== 'child') aDraw(q, N, A, look[1]);
    if (human && age) agePaint(q, N, age, o.x, look && look[1]);
    if (human && o.f) fadePaint(q, N);
    if (look && W && age !== 'child') {
      var Ly = new Array(N * N), i, x, y, lg = W.grade >= 5 ? LEG[W.line] : null;
      for (i = 0; i < N * N; i++) Ly[i] = '.';
      var dy = age === 'teen' ? 2 : age === 'elder' ? 1 : 0;
      wDraw(Ly, N, W.cat, W.line, W.mat || W.tier, cls, lg);
      if (dy) { for (y = N - 1; y >= 0; y--) for (x = 0; x < N; x++) Ly[y * N + x] = y - dy >= 0 ? Ly[(y - dy) * N + x] : '.'; }
      if (W.grade === 4) { var gx = HX + 2, gy = HY + 1 + dy; if (Ly[gy * N + gx - 2] !== '.' || true) { Ly[gy * N + gx] = '7'; Ly[(gy + 1) * N + gx] = '7'; Ly[(gy + 2) * N + gx + 1] = '8'; } }      // 유니크: 보라 술
      // 1px 외곽선: 무기 칸 둘레의 빈 칸 (피부 위에는 두르지 않는다 — 손이 무기를 쥔다)
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
        i = y * N + x; if (Ly[i] !== '.') continue;
        if ((x > 0 && WCH[Ly[i - 1]]) || (x < N - 1 && WCH[Ly[i + 1]]) || (y > 0 && WCH[Ly[i - N]]) || (y < N - 1 && WCH[Ly[i + N]]) || Ly[i - 1] === 'l' || Ly[i + 1] === 'l' || (y > 0 && Ly[i - N] === 'l') || (y < N - 1 && Ly[i + N] === 'l')) {
          var u = q[i]; if (u !== 's' && u !== 'S') Ly[i] = 'k';
        }
      }
      for (i = 0; i < N * N; i++) if (Ly[i] !== '.') q[i] = Ly[i];
      if (W.cat !== 'bow' || W.line === 'B') { var fy = HY - 1 + dy; [[HX - 1, fy], [HX, fy], [HX - 1, fy + 1], [HX, fy + 1]].forEach(function (p) { q[p[1] * N + p[0]] = p[1] === fy + 1 && p[0] === HX ? 'S' : 's'; }); q[fy * N + HX - 2] = 'k'; q[(fy + 1) * N + HX - 2] = 'k'; q[(fy + 2) * N + HX - 1] = 'k'; q[(fy + 2) * N + HX] = 'k'; }      // 주먹
    }
  };
  var k;
  if (W && look) { var wp = wPal(W, cls, d); for (k in wp) out.pal[k] = wp[k]; out.wch = WCH; out.flat[7] = 1; out.flat[8] = 1; out.flat[9] = 1; }
  if (A && look) { var ap = aPal(A, d); for (k in ap) out.pal[k] = ap[k]; out.flat["'"] = 1; }
  out.pal['^'] = '#eeeae2'; out.pal['~'] = '#c4beb4'; out.pal['`'] = '#a9bcc4'; out.pal['|'] = '#dfe8ea'; out.flat['`'] = 1; out.flat['|'] = 1;
  if (age === 'elder' && look) { out.pal.h = '#e8e4dc'; out.pal.H = '#b8b2a8'; }
  return out;
};
})();
