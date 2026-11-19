// 열 개의 깃발 — 픽셀 스프라이트 (문자 격자 → 캔버스)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';

// 기본 팔레트
var PAL = {
  k: '#1b1626', s: '#f3c9a1', S: '#cf9670', w: '#ffffff', m: '#cdd5e3', M: '#8f9ab3', n: '#5b6480',
  g: '#f6cf57', G: '#c08f2c', o: '#a8754a', O: '#6f4a2c', r: '#e0525e', R: '#9c2f45',
  e: '#79c267', E: '#3f8f4c', u: '#62b0ee', U: '#3572b8', p: '#b181e6', P: '#7446ad',
  y: '#fff0a0', c: '#9fe8ec', t: '#f09a4a', T: '#b8642a', d: '#3a3350', D: '#262036',
  l: '#e9e2d0', L: '#b9ae96', a: '#62b0ee', A: '#3572b8', b: '#f6cf57', B: '#c08f2c',
  h: '#8a5a36', H: '#5e3a22', x: '#ff4d6d', z: '#2b2440'
};
DS.PAL = PAL;

// ── 부품: 머리 (8행) ──
var HEAD = {
  helm: [
    '................',
    '.....kkkkkk.....',
    '....kmmmmmmk....',
    '...kmwmmmmmMk...',
    '...kmmmmmmmMk...',
    '...kMssssssMk...',
    '...kMskssksMk...',
    '....kssssssk....'],
  plume: [
    '......krrk......',
    '.....kkrRkk.....',
    '....kmmmmmmk....',
    '...kmwmmmmmMk...',
    '...kmmmmmmmMk...',
    '...kMssssssMk...',
    '...kMskssksMk...',
    '....kssssssk....'],
  darkhood: [
    '................',
    '.....kkkkkk.....',
    '....kaaaaaak....',
    '...kaaaaaaaAk...',
    '...kaAzzzzAAk...',
    '...kAzzzzzzAk...',
    '...kAzxzzxzAk...',
    '....kzzzzzzk....'],
  hood: [
    '................',
    '.....kkkkkk.....',
    '....kaaaaaak....',
    '...kaaaaaaaAk...',
    '...kaAssssAAk...',
    '...kAssssssAk...',
    '...kAskssksAk...',
    '....kssssssk....'],
  wizhat: [
    '.......kk.......',
    '......kaak......',
    '.....kaaaAk.....',
    '....kaaaaaAk....',
    '..kkkbbbbbbkkk..',
    '..kaaaaaaaaaAk..',
    '....kskssksk....',
    '....kssssssk....'],
  bald: [
    '................',
    '.....kkkkkk.....',
    '....kssssssk....',
    '...kssssssssk...',
    '...kbbbbbbbbk...',
    '...kssssssssk...',
    '...ksskssksSk...',
    '....kssssssk....'],
  // 2.2.6 무투가: 이마 띠(뒤로 매듭) · 상투 · 금 테 머리띠
  band: [
    '................',
    '.....kkkkkk.....',
    '....khhhhhhk....',
    '...khhhhhhhHk...',
    '.rrkrrrrrrrrk...',
    '.R.khssssssHk...',
    '...khskssksHk...',
    '....kssssssk....'],
  knot: [
    '.......kk.......',
    '......khhk......',
    '.....kkrrkk.....',
    '....kssssssk....',
    '...kssssssssk...',
    '...kSssssssSk...',
    '...ksskssksSk...',
    '....kssssssk....'],
  circlet: [
    '................',
    '.....kkkkkk.....',
    '....khhhhhhk....',
    '...khhhhhhhHk...',
    '...kiiiiciiik...',
    '...khssssssHk...',
    '...khskssksHk...',
    '....kssssssk....'],
  mitre: [
    '......kkkk......',
    '.....kwwwwk.....',
    '.....kwggwk.....',
    '....kwwggwwk....',
    '....kggggggk....',
    '...khssssssHk...',
    '...khskssksHk...',
    '....kssssssk....'],
  tricorn: [
    '................',
    '....kkkkkkkk....',
    '...kaaaaaaaak...',
    '..kaaaaggaaaAk..',
    '.kkAAAAAAAAAAkk.',
    '...khssssssHk...',
    '...khskssksHk...',
    '....kssssssk....'],
  goblin: [
    '................',
    '................',
    '.....kkkkkk.....',
    '.kk.keeeeeek.kk.',
    '.keekeeeeeekeek.',
    '..kkeeyeeyeekk..',
    '....keeeeeek....',
    '.....keEEek.....'],
  skull: [
    '................',
    '.....kkkkkk.....',
    '....kllllllk....',
    '...kllllllllk...',
    '...klkkllkklk...',
    '...klkkllkklk...',
    '....klllLllk....',
    '.....klklkk.....'],
  orc: [
    '................',
    '....kkkkkkkk....',
    '...knnnnnnnnk...',
    '...kEEEEEEEEk...',
    '..kEExEEEExEEk..',
    '..kEEEEEEEEEEk..',
    '...kwEEEEEEwk...',
    '....kkEEEEkk....']
};
// ── 부품: 몸 (8행) ──
var BODY = {
  armor: [
    '...kkaaaaaakk...',
    '..kaAaaaaaaAak..',
    '..kskabbbbaksk..',
    '...kkaaaaaakk...',
    '....kaAkkAak....',
    '....kMMkkMMk....',
    '....kkk..kkk....',
    '................'],
  robe: [
    '...kkaaaaaakk...',
    '..kaAaaaaaaAak..',
    '..kskaabbaaksk..',
    '...kaaaaaaaak...',
    '...kaaaaaaaak...',
    '..kaAaaaaaaAak..',
    '..kkkkkkkkkkkk..',
    '................'],
  tunic: [
    '...kkaaaaaakk...',
    '..kaAaaaaaaAak..',
    '..kskabbbbaksk..',
    '...kkaaaaaakk...',
    '....kBBkkBBk....',
    '....kOOkkOOk....',
    '....kkk..kkk....',
    '................'],
  gi: [      // 2.2.6 무투가의 도복: 엇갈린 깃 · 띠 · 넓은 바지 · 맨발
    '...kkaalsaakk...',
    '..kaAaalsaaAak..',
    '..kskaaalaaksk..',
    '...kbbbbbbbbk...',
    '....kaBkkAak....',
    '....kAAkkAAk....',
    '....kssk.kssk...',
    '................'],
  bones: [
    '...kkllllllkk...',
    '..klkLlLLlLklk..',
    '..klklLllLlklk..',
    '...kkkLllLkkk...',
    '....klkkkklk....',
    '....klk..klk....',
    '....kkk..kkk....',
    '................']
};
// ── 부품: 장비 [x, y, rows] ──
var ITEM = {
  sword:  [12, 1, ['.w.', '.w.', '.w.', '.w.', '.w.', '.w.', '.w.', '.M.', 'ggg', '.o.']],
  shield: [0, 8, ['.kkk.', 'kuuuk', 'kuwuk', 'kuuuk', '.kkk.']],
  bow:    [12, 4, ['wo.', 'w.o', 'w.o', 'w.o', 'w.o', 'w.o', 'w.o', 'wo.']],
  staff:  [12, 0, ['.k.', 'kck', 'kck', '.k.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.']],
  cross:  [12, 0, ['.g.', 'ggg', '.g.', '.g.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.']],
  trident:[11, 0, ['m.m.m', 'm.m.m', 'mmmmm', '..M..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..', '..o..']],
  club:   [12, 3, ['.oo', 'ooo', 'ooO', '.oO', '.o.', '.o.', '.o.', '.o.']],
  axe:    [12, 2, ['.omm', '.ommm'.slice(0, 4), '.omM', '.om.', '.o..', '.o..', '.o..', '.o..', '.o..']],
  beads:  [5, 8, ['.l..l.', 'l....l', '.l..l.', '..ll..']],
  fists:  [1, 9, ['.kk.........kk.', 'kssk.......kssk', '.kk.........kk.']],
  wraps:  [2, 10, ['l..........l']],      // 2.2.6 무투가: 손에 감은 천
  gaunt:  [2, 9, ['M..........M', 'm..........m']],      // 권갑
  scarf:  [0, 8, ['.qq', 'qqk', 'qk.']]
};

function compose(head, body, items) {
  var rows = HEAD[head].concat(BODY[body]).map(function (r) { return r.split(''); });
  (items || []).forEach(function (name) {
    var it = ITEM[name], x0 = it[0], y0 = it[1];
    it[2].forEach(function (r, dy) {
      for (var dx = 0; dx < r.length; dx++) {
        var ch = r[dx], y = y0 + dy, x = x0 + dx;
        if (ch !== '.' && y >= 0 && y < 16 && x >= 0 && x < 16) rows[y][x] = ch;
      }
    });
  });
  return rows.map(function (r) { return r.join(''); });
}

// ── 통짜 스프라이트 ──
var RAW = {
  knight: [   // 기마 (오른쪽을 본다)
    '................',
    '.....kkkk.......',
    '....kmmmmk......',
    '....kmwmMk..kk..',
    '....kMsksk.kHhk.',
    '.....kssk.khhhk.',
    '....kaaaakkhhkhk',
    '...kaaAaammmmmmw',
    '.kkkaaaakhhhhkk.',
    'kHkhhhhhhhhhhk..',
    'kHkhhHhhhhhHhk..',
    '.kkhhhhhhhhhhk..',
    '..khkkhkkkhkhk..',
    '..khkkhk.khkhk..',
    '..kkkkkk.kkkkk..',
    '................'],
  hawk: [     // 비병: 큰 매 + 기수
    '................',
    '......kkkk......',
    '.....kaaaak.....',
    '.....kskskk.....',
    '.k...kssssk...k.',
    'khk..kaaaak..khk',
    'khhkkkabbakkkhhk',
    'khhhhkaaaakhhhhk',
    '.khhHhhkkhhHhhk.',
    '..kHhhhhhhhhHk..',
    '...kkhhyyhhkk...',
    '.....khyyhk.....',
    '.....khhhhk.....',
    '......kTTk......',
    '......k..k......',
    '................'],
  wolf: [
    '................',
    '................',
    '................',
    '..........k..k..',
    '.........kmkkmk.',
    '.........kmmmmk.',
    '.kk.....kmmxmmk.',
    'kmk.kkkkkmmmmwk.',
    'kmmkmmmmmmmmkk..',
    '.kmmmmmmmmMmk...',
    '..kmmMmmmmMmk...',
    '..kmmkkkkkmmk...',
    '..kMk....kMk....',
    '..kMk....kMk....',
    '..kkk....kkk....',
    '................'],
  harpy: [
    '................',
    '......kkkk......',
    '.....kppppk.....',
    '.....kskskk.....',
    '.kk..kssssk..kk.',
    'kcck..kssk..kcck',
    'kcccckkaakkcccck',
    'kcCcccaaaacccCck',
    '.kcCccaaaaccCck.',
    '..kkCckaakcCkk..',
    '....kkkaakkk....',
    '......kssk......',
    '.....ktkktk.....',
    '.....kt..tk.....',
    '................',
    '................'],
  lizard: [
    '................',
    '..............m.',
    '.....kkkk.....m.',
    '....keeeek....m.',
    '...keyeeyek...m.',
    '...keeeeeeek..M.',
    '....kkeEEwwk..o.',
    '...kkaaaakk..ko.',
    '..keEaaaaEekkso.',
    '..kekaggakeek.o.',
    '.kkkkaaaakkk..o.',
    'kEek.keekek...o.',
    'keEkkeEkkEek....',
    '.kkEkkkk.kkk....',
    '...kk...........',
    '................'],
  golem: [
    '................',
    '....kkkkkkkk....',
    '...kMMMMMMMMk...',
    '...kMxMMMMxMk...',
    '...kMMMMMMMMk...',
    '.kkkknnnnnnkkkk.',
    'kMMMkmmmmmmkMMMk',
    'kMMmkmMmmMmkmMMk',
    'kMMmkmmmmmmkmMMk',
    'kMMkkmmMMmmkkMMk',
    'kMnk.kmmmmk.knMk',
    'kkkk.kMkkMk.kkkk',
    '.....kMkkMk.....',
    '....kMMkkMMk....',
    '....kkkkkkkk....',
    '................'],
  imp: [
    '................',
    '................',
    '....k......k....',
    '....kk....kk....',
    '.kk.krkkkkrk.kk.',
    'kRRkkrrrrrrkkRRk',
    'kRrRkryrryrkRrRk',
    '.kRRkrrrrrrkRRk.',
    '..kk.krwwrk.kk..',
    '.....krrrrk.....',
    '....kkrRRrkk....',
    '....krk..krk..k.',
    '....kk....kkkrk.',
    '............kk..',
    '................',
    '................'],
  ghost: [
    '................',
    '.....kkkkkk.....',
    '....kccccccck...',
    '...kcwwcccwwck..',
    '...kcwkcccwkck..',
    '...kccccccccck..',
    '...kcccckkcccck.',
    '..kccccckkccccck',
    '..kcccccccccccck',
    '..kcCccccccccCck',
    '...kcCcccccCcck.',
    '...kccCcccCcck..',
    '....kccckcckk...',
    '.....kck.kk.....',
    '......k.........',
    '................'],
  demon: [
    '.k............k.',
    '.kk..........kk.',
    '.krk.kkkkkk.krk.',
    '..krkrrrrrrkrk..',
    '...krryrryrrk...',
    '...krrrrrrrrk...',
    '....krwkkwrk....',
    '..kkkkrrrrkkkk..',
    '.krrRkrrrrkRrrk.',
    '.krkkrRggRrkkrk.',
    '.kyk.krrrrk.kyk.',
    '.....krRRrk.....',
    '....krrkkrrk....',
    '....kRRk.kRRk...',
    '....kkk..kkk....',
    '................'],
  gargoyle: [
    '.k............k.',
    'kMk..kkkkkk..kMk',
    'kMMk.kMMMMMk.kMMk'.slice(0, 16),
    'kMmMkMxMMxMkMmMk',
    'kMmmkMMMMMMkmmMk',
    '.kMmmkMwwMkmmMk.',
    '..kMmkkMMkkmMk..',
    '...kkkMMMMkkk...',
    '....kMMmmMMk....',
    '....kMkmmkMk....',
    '....kyk..kyk....',
    '.....kMMMMk.....',
    '....kMMkkMMk....',
    '....kyyk.kyyk...',
    '................',
    '................'],
  salamander: [
    '................',
    '................',
    '................',
    '......y.........',
    '.....yty..y.....',
    '....ktttkyty....',
    '...ktrrtttttk...',
    '..krrrrrrrrrkkk.',
    '.krRrrrrrrrrryrk',
    'krk.krrRrrrrrrrk',
    'kk..krrrrrkkrwk.',
    '....krkkkrk.kk..',
    '...krk..krk.....',
    '...kkk..kkk.....',
    '................',
    '................']
};

// ── 보스 (24×24) ──
var BIG = {
  b_beast: [  // 거대한 짐승 (늑대/만티코어)
    '........................',
    '........................',
    '...............k....k...',
    '..............kak..kak..',
    '..............kaakkaak..',
    '.............kaaaaaaak..',
    '............kaaaxaaxaak.',
    '............kaaaaaaaaak.',
    '.kk.........kaaaaaawwak.',
    'kaak.......kaaaakkwkwk..',
    'kaAk..kkkkkaaaaaakkkk...',
    'kaaakkaaaaaaaaaaaak.....',
    '.kaaaaaaaaaaaaaaaak.....',
    '..kaaaaaaaaaaaaAaak.....',
    '..kaaAaaaaaaaaaAaak.....',
    '..kaaAaaaabbbbaaaak.....',
    '..kaaaakkkbbbbkaaak.....',
    '..kaAak..kkkk.kaAak.....',
    '..kaAak.......kaAak.....',
    '..kaAak.......kaAak.....',
    '.kwawak......kwawak.....',
    '.kkkkkk......kkkkkk.....',
    '........................',
    '........................'],
  b_brute: [  // 거인 (오크 장군/불거인/석상)
    '........................',
    '....k..............k....',
    '....kk....kkkk....kk....',
    '....kbk.kkaaaakk.kbk....',
    '.....kbkaaaaaaaakbk.....',
    '......kaaaaaaaaaak......',
    '......kaxxaaaaxxak......',
    '......kaaaaaaaaaak......',
    '......kawkaaaakwak......',
    '...kkkkkaakkkkaakkkkk...',
    '..kaaaakkaaaaaakkaaaak..',
    '.kaaAaakbbbbbbbbkaaAaak.',
    '.kaaAakbbbBBBBbbbkaAaak.',
    '.kaaakkbbbbbbbbbbkkaaak.',
    '.kaaak.kbbBbbBbbk.kaaak.',
    '.kaaak.kaaaaaaaak.kaaak.',
    '.kaaak.kaaAaaAaak.kaaak.',
    '..kwwk.kaaakkaaak.kwwk..',
    '..kkkk.kaaak.kaaak.kkk..',
    '.......kaAak.kaAak......',
    '......kaaaak.kaaaak.....',
    '......kkkkkk.kkkkkk.....',
    '........................',
    '........................'],
  b_serpent: [ // 쌍두사
    '........................',
    '...kkkk..........kkkk...',
    '..kaaaak........kaaaak..',
    '.kaxaaxak......kaxaaxak.',
    '.kaaaaaak......kaaaaaak.',
    '.kawkkwak......kawkkwak.',
    '..kkaakk........kkaakk..',
    '...kaak..........kaak...',
    '...kaAk..........kAak...',
    '...kaaak........kaaak...',
    '....kaaak......kaaak....',
    '....kaAaakkkkkkaaAak....',
    '.....kaaaaaaaaaaaak.....',
    '.....kaabbaaaabbaak.....',
    '....kaaaaaaaaaaaaaak....',
    '...kaaAaaabbbbaaaAaak...',
    '...kaaaaaaaaaaaaaaaak...',
    '...kaabbaaaaaaaabbaak...',
    '....kaaaaaAAAAaaaaak....',
    '.....kkaaaaaaaaaakk.....',
    '.......kkkkkkkkkk.......',
    '........................',
    '........................',
    '........................'],
  b_caster: [ // 로브의 술사
    '........................',
    '.........kkkkkk.........',
    '........kaaaaaak...kkk..',
    '.......kaaaaaaaak.kbybk.',
    '......kaaAAAAAAaak.kbk..',
    '......kaAzzzzzzAak..k...',
    '......kaAzxzzxzAak.kok..',
    '......kaAzzzzzzAak.kok..',
    '.......kaAzzzzAak..kok..',
    '.....kkkaaAAAAaakkkkok..',
    '....kaaaaaaaaaaaaaakok..',
    '...kaaAaaaabbaaaaAaskk..',
    '...kaAkaaaabbaaaakAakk..',
    '...kak.kaaabbaaak.kok...',
    '...ksk.kaaabbaaak.kok...',
    '....k..kaaaaaaaak.kok...',
    '.......kaaAaaAaak.kok...',
    '......kaaaAaaAaaak.k....',
    '......kaaAaaaaAaak......',
    '.....kaaaAaaaaAaaak.....',
    '.....kaAaaaaaaaaAak.....',
    '.....kkkkkkkkkkkkkk.....',
    '........................',
    '........................'],
  b_demon: [  // 날개 달린 마왕
    '...k................k...',
    '..kbk..............kbk..',
    '..kbbk....kkkk....kbbk..',
    '...kbbk.kkaaaakk.kbbk...',
    '....kbkkaaaaaaaakkbk....',
    'k....kkaaaaaaaaaakk....k',
    'kk....kaxxaaaaxxak....kk',
    'kAk...kaaaaaaaaaak...kAk',
    'kAAk..kaawkkkkwaak..kAAk',
    'kAAAk..kkaaaaaakk..kAAAk',
    'kAAAAkkkaaaaaaaakkkAAAAk',
    'kAAAAkaaaabbbbaaaakAAAAk',
    'kAAAkaaAaabggbaaAaakAAAk',
    '.kAkkaaAkabbbbakAaakkAk.',
    '..k.kaak.kaaaak.kaak.k..',
    '....kaak.kaAAak.kaak....',
    '....kyyk.kaaaak.kyyk....',
    '.........kaAAak.........',
    '........kaaakaaak.......',
    '........kaAk.kAak.......',
    '.......kaaak.kaaak......',
    '.......kyyyk.kyyyk......',
    '........................',
    '........................']
};

// ── 스프라이트 정의: {rows, pal} ──
function def(rows, pal) { return { rows: rows, pal: pal || {} }; }
var SPR = {
  fighter:  def(compose('plume', 'armor', ['sword', 'shield']), { a: '#5b8fd6', A: '#3a62a8', b: '#f6cf57' }),
  knight:   def(RAW.knight, { a: '#d9a441', A: '#a8742a', h: '#f1ead9', H: '#cfc4a8' }),
  hawk:     def(RAW.hawk, { a: '#e86a9a', A: '#b8436f', b: '#fff0a0', h: '#b5814f', H: '#7f5632' }),
  captain:  def(compose('tricorn', 'tunic', ['trident']), { a: '#2f86a6', A: '#1f5d78', b: '#f6cf57', B: '#e9e2d0', h: '#5e3a22', H: '#3d2616' }),
  sniper:   def(compose('hood', 'tunic', ['bow']), { a: '#5fae5a', A: '#3a7d42', b: '#8a5a36', B: '#6f4a2c' }),
  magician: def(compose('wizhat', 'robe', ['staff']), { a: '#8d6be0', A: '#5f41ad', b: '#f6cf57', c: '#ff9de1' }),
  monk:     def(compose('bald', 'tunic', ['beads']), { a: '#f09a4a', A: '#b8642a', b: '#e0525e', B: '#f7e3bd', O: '#cf9670' }),
  lord:     def(compose('mitre', 'robe', ['cross']), { a: '#f4efe2', A: '#cfc6ae', b: '#f6cf57', h: '#d8b46a', H: '#a8843f' }),
  // 적
  goblin:   def(compose('goblin', 'tunic', ['club']), { a: '#8a5a36', A: '#5e3a22', b: '#3a3350', B: '#5e4a36', s: '#79c267', S: '#3f8f4c' }),
  gobArcher:def(compose('goblin', 'tunic', ['bow']), { a: '#7d4f8a', A: '#55335f', b: '#3a3350', B: '#5e4a36', s: '#79c267', S: '#3f8f4c' }),
  wolf:     def(RAW.wolf, { m: '#9aa3b8', M: '#666f88', x: '#ffd24a' }),
  orc:      def(compose('orc', 'armor', ['axe']), { a: '#7a5a3c', A: '#523a25', b: '#3a3350', s: '#3f8f4c', M: '#4a4258' }),
  skeleton: def(compose('skull', 'bones', ['sword']), {}),
  skelArcher:def(compose('skull', 'bones', ['bow']), {}),
  darkMage: def(compose('darkhood', 'robe', ['staff']), { a: '#6a4f9e', A: '#45316f', b: '#e0525e', s: '#cdb7c6', z: '#1b1626', x: '#ff4d6d', c: '#ff4d6d' }),
  harpy:    def(RAW.harpy, { a: '#e9e2d0', p: '#e0525e', c: '#58c7b0', C: '#2f8f84' }),
  lizard:   def(RAW.lizard, { a: '#7a5a3c', e: '#4fb59a', E: '#2c7d74', g: '#f6cf57' }),
  golem:    def(RAW.golem, { m: '#a9a294', M: '#7d766a', n: '#57524a', x: '#ffd24a' }),
  imp:      def(RAW.imp, {}),
  ghost:    def(RAW.ghost, { c: '#c9f1f5', C: '#8fc9d6' }),
  darkKnight:def(RAW.knight, { a: '#7a5fc0', A: '#513c8a', h: '#565070', H: '#3a3350', m: '#a9a3c4', M: '#6f688c', w: '#ff4d6d', s: '#1b1626', S: '#ff4d6d' }),
  darkPriest:def(compose('mitre', 'robe', ['cross']), { a: '#5b2740', A: '#3a182a', b: '#e0525e', w: '#3a3350', g: '#e0525e', G: '#9c2f45', h: '#2b2440', H: '#2b2440', s: '#cdb7c6', S: '#a8909f' }),
  demon:    def(RAW.demon, { r: '#c0445e', R: '#7e2940', g: '#f6cf57' }),
  gargoyle: def(RAW.gargoyle, { M: '#7f8598', m: '#a9afc2', x: '#ff4d6d', y: '#57524a' }),
  salamander:def(RAW.salamander, {}),
  soldier:  def(compose('helm', 'armor', ['sword', 'shield']), { a: '#b84a55', A: '#7e2c3a', b: '#3a3350', u: '#9c2f45', M: '#6b6377', m: '#a39cae' }),
  archer:   def(compose('helm', 'tunic', ['bow']), { a: '#b84a55', A: '#7e2c3a', b: '#3a3350', B: '#5a4a52', M: '#6b6377', m: '#a39cae' }),
  elder:    def(compose('bald', 'robe', ['staff']), { a: '#8b7355', A: '#5e4c36', b: '#e9e2d0', c: '#e9e2d0' }),
  saber:    def([
    '.......kk.......',
    '......kxwk......',
    '......kxdk......',
    '......kxdk......',
    '......kxdk......',
    '......kxdk......',
    '......kxdk......',
    '......kxdk......',
    '......kxdk......',
    '....kkkxdkkk....',
    '...kgGggggGgk...',
    '....kkkRRkkk....',
    '......kRRk......',
    '......kRRk......',
    '.....kgGGgk.....',
    '......kkkk......'], { d: '#4a2a4a', x: '#ff4d6d' })
};
// 보스 팔레트
var BPAL = {
  wolf:     { a: '#8d95ad', A: '#5c647e', b: '#c9cfe0', x: '#ffd24a' },
  manti:    { a: '#c76b3a', A: '#8a4322', b: '#7e2940', x: '#b6ff5a' },
  specter:  { a: '#7fd6d0', A: '#3f8f95', b: '#d6fbff', x: '#ffffff', k: '#12323a', z: '#0d2329' },
  orc:      { a: '#4c9a52', A: '#2f6b3a', b: '#8a5a36', B: '#5e3a22', x: '#ff4d6d' },
  lava:     { a: '#d9543a', A: '#8f2f24', b: '#ffb347', B: '#f6cf57', x: '#fff0a0' },
  stone:    { a: '#9b97a6', A: '#6a6677', b: '#7c8fb0', B: '#52607c', x: '#7fe3ff' },
  obsidian: { a: '#4b4560', A: '#2c2740', b: '#8d2f4a', B: '#5e1d31', x: '#ff4d6d' },
  venom:    { a: '#6aa84f', A: '#3e7033', b: '#d9d46a', x: '#ff4d6d' },
  trick:    { a: '#4fb07a', A: '#2f7a52', b: '#e0525e', z: '#2b2440', x: '#fff0a0', y: '#ffd24a' },      // r8: 피핀 — 초록 광대옷·붉은 띠·금방울 (잠 못 드는 왕과 같은 노란 두건이었다)
  aqua:     { a: '#4fb6d9', A: '#2a7fa3', b: '#d6fbff', z: '#bfeaf5', x: '#1a4a66', y: '#d6fbff' },
  bone:     { a: '#d8d0bc', A: '#a39a84', b: '#7446ad', z: '#2b2440', x: '#b6ff5a', y: '#b6ff5a' },
  reaper:   { a: '#3a3350', A: '#231d33', b: '#7fd6d0', z: '#0f0c18', x: '#7fe3ff', y: '#7fe3ff' },
  illusion: { a: '#a05cc7', A: '#6b3a8f', b: '#f6cf57', z: '#2b2440', x: '#ffd24a', y: '#ff9de1' },
  mephisto: { a: '#b02a3c', A: '#701627', b: '#1b1626', z: '#1b1626', x: '#ffd24a', y: '#ff4d6d' },
  jade:     { a: '#1f6b5a', A: '#0f3f36', b: '#7dffb0', z: '#0b1a17', x: '#7dffb0', y: '#7dffb0' },
  hunter:   { a: '#6a7f3a', A: '#44541f', b: '#c9a227', x: '#ffd24a', y: '#2b2440' },
  fly:      { a: '#5d7a2c', A: '#3a4f18', b: '#b6ff5a', x: '#ff4d6d', y: '#2b2440' },
  duke:     { a: '#6b3fa0', A: '#432469', b: '#f6cf57', x: '#ffd24a', y: '#2b2440' },
  plague:   { a: '#57524a', A: '#36322c', b: '#9ccc3c', x: '#b6ff5a', y: '#2b2440' },
  avatar:   { a: '#e9e2d0', A: '#a39a84', b: '#1b1626', x: '#ff4d6d', y: '#1b1626', k: '#0f0c18' },
  jade2:    { a: '#14463c', A: '#0a2a24', b: '#7dffb0', x: '#ff4d6d', y: '#7dffb0' }
};
DS.SPR = SPR; DS.BIG = BIG; DS.BPAL = BPAL;
DS.SPRP = { HEAD: HEAD, BODY: BODY, ITEM: ITEM, RAW: RAW, compose: compose, def: def };

// 승급 단에 따른 아군 장식색 (금테)
DS.TIER_TRIM = ['#f6cf57', '#f6cf57', '#cdd5e3', '#cdd5e3', '#ffe680', '#ffe680', '#ffffff'];

// 스프라이트 격자와 팔레트 해석
DS.spriteDef = function (name, palKey) {
  if (BIG[name]) return { rows: BIG[name], pal: BPAL[palKey] || {}, size: 24 };
  var d = SPR[name] || SPR.goblin;
  return { rows: d.rows, pal: d.pal, size: 16 };
};
// 캔버스에 그리기 (브라우저 전용). flip=true 면 좌우 반전, tint 는 전체 단색(피격 플래시)
var cache = {};
DS.spriteFlush = function () { cache = {}; };
DS.spriteCanvas = function (name, palKey, opt) {
  opt = opt || {};
  if (opt.hd) return hdCanvas(name, palKey, opt);
  var key = name + '|' + (palKey || '') + '|' + (opt.flip ? 1 : 0) + '|' + (opt.tint || '') + '|' + (opt.trim || '');
  if (cache[key]) return cache[key];
  var d = DS.spriteDef(name, palKey), n = d.size;
  var cv = document.createElement('canvas'); cv.width = n; cv.height = n;
  var g = cv.getContext('2d');
  for (var y = 0; y < n; y++) {
    var row = d.rows[y] || '';
    for (var x = 0; x < n; x++) {
      var ch = row[x];
      if (!ch || ch === '.') continue;
      var col = opt.tint || (ch === 'b' && opt.trim) || d.pal[ch] || PAL[ch] || '#f0f';
      g.fillStyle = col;
      g.fillRect(opt.flip ? n - 1 - x : x, y, 1, 1);
    }
  }
  cache[key] = cv;
  return cv;
};
// ── r4 hd: 2배 해상도로 굽는 스프라이트 ──
// 같은 문자 격자를 Scale2x(EPX)로 늘려 외곽선 모서리를 반 픽셀 깎고, 그 위에 손으로 넣듯 한 단계씩만 더한다:
//  · 외곽선 안쪽 반 픽셀 테두리 — 위·왼쪽은 밝게, 아래·오른쪽은 어둡게 (빛은 늘 화면 왼쪽 위)
//  · 밝은색/짙은색 짝(a/A, m/M, s/S …)이 위아래로 맞닿는 줄은 반 픽셀 바둑 디더로 잇는다
//  · 피부 사이의 눈은 반 픽셀 폭으로 좁히고 눈 위 반 픽셀에 눈두덩 그늘
//  · 혼자 박힌 한 점(보석·눈빛·장식)은 손대지 않아 색이 또렷하게 남는다
// 색은 원래 팔레트에서 한 단계 밝게·어둡게만 더한다(색 수는 한 색에 셋). 등급색 윤곽(tint)은 단색 그대로 모양만 2배.
var hdCache = {}, rgbC = {};
function rgb(hex) {
  var c = rgbC[hex]; if (c) return c;
  var h = hex.charAt(0) === '#' ? hex.slice(1) : hex; if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var v = parseInt(h, 16); c = rgbC[hex] = [(v >> 16) & 255, (v >> 8) & 255, v & 255]; return c;
}
function tone(c, f) {      // f>0 밝게(흰빛 쪽, 살짝 따뜻하게), f<0 어둡게(보랏빛 그늘 쪽 — 외곽선 색 #1b1626 으로)
  if (f > 0) return [c[0] + (255 - c[0]) * f, c[1] + (250 - c[1]) * f, c[2] + (235 - c[2]) * f * 0.9];
  f = -f; return [c[0] + (27 - c[0]) * f, c[1] + (22 - c[1]) * f, c[2] + (38 - c[2]) * f];
}
function scale2x(rows, n) {      // 문자 격자 n×n → 2n×2n (EPX)
  var N = n * 2, o = new Array(N * N), x, y;
  function at(x, y) { return x < 0 || y < 0 || x >= n || y >= n ? '.' : (rows[y][x] || '.'); }
  for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
    var P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
    var e0 = P, e1 = P, e2 = P, e3 = P;
    if (C === A && C !== D && A !== B) e0 = A;
    if (A === B && A !== C && B !== D) e1 = B;
    if (D === C && D !== B && C !== A) e2 = C;
    if (B === D && B !== A && D !== C) e3 = D;
    // 외곽선 지키기: 색이 투명을 먹어 실루엣이 부푸는 것만 허용하지 않는다(투명이 모서리를 깎는 건 허용)
    if (P === '.') { e0 = e1 = e2 = e3 = '.'; }
    var i = y * 2 * N + x * 2; o[i] = e0; o[i + 1] = e1; o[i + N] = e2; o[i + N + 1] = e3;
  }
  return o;
}
function hdCanvas(name, palKey, opt) {
  var key = name + '|' + (palKey || '') + '|' + (opt.flip ? 1 : 0) + '|' + (opt.tint || '') + '|' + (opt.trim || '') + '|' + (opt.rim == null ? '~' : opt.rim) + '|' + (opt.step || 0) + (opt.mask ? '|M' : '') + (DS.TOON !== false && opt.toon !== 0 ? '|T' : '') + (opt.pose ? '|p' + opt.pose : '') + (DS.ART === 'new' && opt.toon !== 0 ? '|N' : '');
  if (key in hdCache) return hdCache[key];
  var hs = name.indexOf('#'); if (hs > 0) { opt = mixo(opt, { dress: name.slice(hs + 1) }); name = name.slice(0, hs); }      // r11: '병과_단#옷차림' — 장비·나이를 입힌 모습 (DS.dressName)
  var d = DS.spriteDef(name, palKey), n = d.size, y;
  var rows = []; for (y = 0; y < n; y++) { var r = d.rows[y] || ''; while (r.length < n) r += '.'; rows.push(opt.flip ? r.slice(0, n).split('').reverse().join('') : r.slice(0, n)); }
  if (opt.rim == null && !opt.tint && opt.dress) { var rd = /(?:^|,)r=([sg])/.exec(opt.dress); if (rd) opt = mixo(opt, { rim: rd[1] }); }      // r27: 옷차림의 r= (가주가 된 부대원의 단)
  if (opt.rim == null && !opt.tint) { var lm = /^([a-z]+)_(\d+)$/.exec(name); if (lm && DS.CLASSES && DS.CLASSES[lm[1]]) opt = mixo(opt, { rim: DS.rimOf(+lm[2]) }); }      // 지휘관 모습(병과_단)은 단으로 테두리 빛을 정한다 — 칩·승급 창 초상도 같은 그림
  if (DS.ART === 'new' && opt.toon !== 0 && DS.artCanvas) {      // r14 새 그림: 코드로 그린 카툰이 있는 이름이면 그것을 쓴다 (없으면 아래의 자동 카툰)
    var acv = DS.artCanvas(hs > 0 ? name + '#' + opt.dress : name, palKey, opt); if (acv) return (hdCache[key] = acv);
    if (opt.mask && DS.artSpecOf && DS.artSpecOf(name, palKey, opt.dress)) return (hdCache[key] = null);      // 새 그림인데 무기가 없는 모습
  }
  // r7: rim = 테두리 빛 색 단계('s' 은빛 4~7단, 'g' 금빛 8단↑), step = 걷기 프레임(1 왼발·2 오른발을 반 픽셀 든다)
  if (DS.TOON !== false && opt.toon !== 0) {      // r13 toon: 한 모습(이름·옷차림·테)마다 한 번만 굽고, 뒤집기·걸음·단색은 구운 그림에서 싸게 만든다
    if (opt.mask) return (hdCache[key] = toonBake(name, d, opt));
    var nm0 = hs > 0 ? name + '#' + opt.dress : name, bo;
    if (opt.tint) { bo = hdCanvas(nm0, palKey, { hd: 1, flip: opt.flip, step: opt.step }); return (hdCache[key] = toonTint(bo, opt.tint)); }
    if (opt.flip) { bo = hdCanvas(nm0, palKey, { hd: 1, step: opt.step, rim: opt.rim, trim: opt.trim }); return (hdCache[key] = toonFlip(bo)); }
    if (opt.step) { bo = hdCanvas(nm0, palKey, { hd: 1, rim: opt.rim, trim: opt.trim }); return (hdCache[key] = toonStep(bo, opt.step)); }
    return (hdCache[key] = toonBake(name, d, opt));
  }
  if (DS.HD2 !== false || opt.dress) return (hdCache[key] = bake2(name, d, opt));      // r11 gfx: 32px 원화 격자 (1px 외곽선 + 덧그림)
  return (hdCache[key] = hdBake(rows, n, function (ch) { return opt.tint || (ch === 'b' && opt.trim) || d.pal[ch] || PAL[ch] || '#f0f'; }, !!opt.tint, { rim: RIM[opt.rim] || null, step: opt.step || 0 }));
}
// r8 gfx: 윗 외곽선 색을 외곽선(#1b1626)에서 충분히 띄운다 — 필드 크기에서 은테·금테가 읽히게. 여덟째 칸 1 = 왼쪽 변도 물들인다. e = 붉은·보랏빛 땅의 적(밝은 윗 테)
var RIM = { s: [200, 226, 255, 0.62, 150, 170, 210, 1], g: [255, 206, 74, 0.7, 230, 180, 70, 1], e: [255, 236, 222, 0.5, 176, 152, 156, 0] };      // [빛 r,g,b, 세기, 윗 외곽선 r,g,b, 왼쪽 변]
function mixo(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
// 단 승급에 따른 테두리 빛 단계 (look 의 단으로 정한다): 1~3단 없음 · 4~7단 은빛 · 8단↑ 금빛
DS.rimOf = function (tier) { return tier >= 8 ? 'g' : tier >= 4 ? 's' : ''; };
// 문자 격자(n×n, '.' 투명, 'k' 외곽선) + 문자→색 함수 → 2n×2n 캔버스. 아이콘(view.js)도 같은 손질을 쓴다.
DS.hdBake = hdBake;
function hdBake(rows, n, colFn, flat, ex) {
  var N = n * 2, x, y, i, opt = { tint: flat }, d = { pal: {} }; ex = ex || {};
  var q = scale2x(rows, n);
  var cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  var g = cv.getContext('2d'), img = g.createImageData(N, N), D = img.data;
  function colOf(ch) { return rgb(colFn(ch)); }
  function cq(x, y) { return x < 0 || y < 0 || x >= N || y >= N ? '.' : q[y * N + x]; }
  function sp(x, y) { return x < 0 || y < 0 || x >= n || y >= n ? '.' : rows[y][x]; }
  // 외곽선: 투명, 또는 투명과 닿은 k (눈·띠처럼 안쪽에 박힌 k 옆에는 테두리 빛을 넣지 않는다 — 눈가가 번지지 않게)
  var outer = {}; for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (rows[y][x] === 'k') for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) if (sp(x + ox, y + oy) === '.') outer[y * n + x] = 1;
  function edgeAt(xx, yy) { var c = cq(xx, yy); return c === '.' || (c === 'k' && outer[(yy >> 1) * n + (xx >> 1)] === 1); }
  var hasPair = {}; for (var ch in PAL) hasPair[ch] = true; for (ch in d.pal) hasPair[ch] = true;
  for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
    var c = q[y * N + x]; if (c === '.') continue;
    var col = colOf(c), f = 0;
    if (!opt.tint && c !== 'k') {
      var sx = x >> 1, sy = y >> 1, sc = rows[sy][sx];
      var lone = sp(sx - 1, sy) !== sc && sp(sx + 1, sy) !== sc && sp(sx, sy - 1) !== sc && sp(sx, sy + 1) !== sc;
      if (!lone) {
        var eu = edgeAt(x, y - 1) || edgeAt(x - 1, y), ed = edgeAt(x, y + 1) || edgeAt(x + 1, y);
        if (eu) f = ed ? 0 : 0.2;
        else if (ed) f = -0.18;
        // 짝 색 디더: 이 칸이 아랫줄(반 픽셀)이고 바로 아래 스프라이트 칸이 짝(대문자) 색이면 바둑무늬로 섞는다
        if (!f && (y & 1) && ((x ^ (y >> 1)) & 1)) {
          var below = sp(sx, sy + 1);
          if (below !== sc && below.toLowerCase() === sc.toLowerCase() && hasPair[below] && sc === sc.toLowerCase()) col = colOf(below);
        }
      }
      // 눈: 피부 사이에 홀로 박힌 외곽선 점
    }
    if (f > 0 && ex.rim) { var rm = ex.rim; col = [col[0] + (rm[0] - col[0]) * rm[3], col[1] + (rm[1] - col[1]) * rm[3], col[2] + (rm[2] - col[2]) * rm[3]]; f = 0; }      // r7: 높은 단은 테두리 빛이 은빛·금빛
    else if (ex.rim && c === 'k' && (cq(x, y - 1) === '.' || (ex.rim[7] && cq(x - 1, y) === '.' && cq(x, y + 1) !== '.')) && outer[(y >> 1) * n + (x >> 1)] === 1) col = [ex.rim[4], ex.rim[5], ex.rim[6]];      // 윗 외곽선은 은테·금테
    if (f) col = tone(col, f);
    i = (y * N + x) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
  }
  if (!opt.tint) {      // 눈: 좌우가 피부(s/S)인 외곽선 한 점 → 반 픽셀 폭 눈동자 + 눈 위 그늘
    var skin = colOf('s'), skinD = colOf('S');
    for (y = 1; y < n; y++) for (x = 1; x < n - 1; x++) {
      if (rows[y][x] !== 'k') continue;
      var L0 = rows[y][x - 1], R0 = rows[y][x + 1];
      if (!((L0 === 's' || L0 === 'S') && (R0 === 's' || R0 === 'S'))) continue;
      var face = rows[y - 1][x] === 's' || rows[y - 1][x] === 'S';
      if (!face) continue;
      var inner = (x < n / 2) ? 1 : 0;      // 얼굴 가운데 쪽 반 칸을 남기고 바깥 반 칸을 피부로
      var X = x * 2 + (inner ? 0 : 1), Y = y * 2;
      var sc2 = tone(skin, 0);
      [[X, Y], [X, Y + 1]].forEach(function (p) { var j = (p[1] * N + p[0]) * 4; D[j] = sc2[0]; D[j + 1] = sc2[1]; D[j + 2] = sc2[2]; D[j + 3] = 255; });
      var bw = tone(skinD, 0), j2;
      for (var dx = 0; dx < 2; dx++) { j2 = ((Y - 1) * N + x * 2 + dx) * 4; if (D[j2 + 3]) { D[j2] = bw[0]; D[j2 + 1] = bw[1]; D[j2 + 2] = bw[2]; } }
    }
  }
  if (ex.step) stepFeet(D, N, ex.step);
  g.putImageData(img, 0, 0);
  return cv;
}
// r7 걷기 프레임: 맨 아래 발 줄(2배 기준 6줄)을 가운데에서 좌/우로 나눠 한쪽만 2px(=원래 1px) 들어 올린다.
// 든 발 아래는 비고, 반대쪽 발은 땅에 붙어 있다 — 2프레임을 번갈아 쓰면 걸음이 된다(네발짐승은 앞·뒷발이 번갈아).
function stepFeet(D, N, step) {
  var bot = -1, x, y, x0 = N, x1 = -1;
  for (y = N - 1; y >= 0 && bot < 0; y--) for (x = 0; x < N; x++) if (D[(y * N + x) * 4 + 3]) { bot = y; break; }
  if (bot < 8) return;
  for (x = 0; x < N; x++) if (D[(bot * N + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  var mid = (x0 + x1 + 1) >> 1, top = bot - 5, lo = step === 1 ? 0 : mid, hi = step === 1 ? mid : N;
  for (y = top; y <= bot; y++) for (x = lo; x < hi; x++) {
    var j = (y * N + x) * 4, k = ((y - 2) * N + x) * 4;
    if (D[j + 3] || y - 2 >= top) { D[k] = D[j]; D[k + 1] = D[j + 1]; D[k + 2] = D[j + 2]; D[k + 3] = D[j + 3]; }
  }
  for (y = bot - 1; y <= bot; y++) for (x = lo; x < hi; x++) D[(y * N + x) * 4 + 3] = 0;
}
// ── r11 gfx: 32px 원화 격자 ──
// 16px 문자 격자를 EPX 로 2배(32px 격자)로 늘린 뒤, 그 격자를 「원화」로 삼아 32px 단위로 손질한다:
//  · 바깥 외곽선을 1px 로 깎는다 (EPX 는 2px 두께였다 — 안쪽 한 겹을 이웃 색으로 메운다)
//  · 눈은 1px 폭, 눈 위 1px 눈두덩 그늘
//  · 옷차림(DS.dressPrep — 장비 모양·방어구·나이)을 32px 격자에 덧그린다
//  · 빛은 왼쪽 위: 외곽선 안쪽 1px 은 밝게/어둡게, 밝은·짙은 짝 색의 경계는 바둑 디더 (색은 한 색에 셋)
// 결과 크기는 전과 같은 2n×2n 이라 화면 배율·드로우 콜은 그대로다 (같은 정수 배율).
DS.HD2 = true;
function bake2(name, d, opt) {
  var n = d.size, N = n * 2, x, y, i, r, rows = [];
  for (y = 0; y < n; y++) { r = d.rows[y] || ''; while (r.length < n) r += '.'; rows.push(r.slice(0, n)); }
  var dr = opt.dress && DS.dressPrep ? DS.dressPrep(name, opt.dress, d) : null;
  if (dr && dr.rows) rows = dr.rows;
  function sp(x, y) { return x < 0 || y < 0 || x >= n || y >= n ? '.' : rows[y][x]; }
  var q = scale2x(rows, n), outer = new Uint8Array(n * n), ox, oy;
  for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (rows[y][x] === 'k') for (oy = -1; oy <= 1; oy++) for (ox = -1; ox <= 1; ox++) if (sp(x + ox, y + oy) === '.') outer[y * n + x] = 1;
  function at(a, x, y) { return x < 0 || y < 0 || x >= N || y >= N ? '.' : a[y * N + x]; }
  // 1) 바깥 외곽선 1px: 투명과 4방향으로 닿지 않는 바깥 외곽선 칸은 안쪽 이웃 색으로
  var Q = q.slice(), c, nb, j;
  for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
    i = y * N + x; if (q[i] !== 'k' || !outer[(y >> 1) * n + (x >> 1)]) continue;
    if (at(q, x - 1, y) === '.' || at(q, x + 1, y) === '.' || at(q, x, y - 1) === '.' || at(q, x, y + 1) === '.') continue;
    nb = [at(q, x, y + 1), at(q, x, y - 1), at(q, x + 1, y), at(q, x - 1, y)];
    for (j = 0; j < 4; j++) if (nb[j] !== 'k' && nb[j] !== '.') { Q[i] = nb[j]; break; }
  }
  q = Q;
  // 2) 눈: 좌우가 피부인 외곽선 한 점 → 1px 폭 눈동자(얼굴 가운데 쪽) + 눈 위 그늘
  if (!opt.tint) for (y = 1; y < n; y++) for (x = 1; x < n - 1; x++) {
    if (rows[y][x] !== 'k') continue;
    var L0 = rows[y][x - 1], R0 = rows[y][x + 1];
    if (!((L0 === 's' || L0 === 'S') && (R0 === 's' || R0 === 'S')) || !(rows[y - 1][x] === 's' || rows[y - 1][x] === 'S')) continue;
    var X = x * 2 + (x < n / 2 ? 0 : 1);
    q[y * 2 * N + X] = 's'; q[(y * 2 + 1) * N + X] = 's';
    for (j = 0; j < 2; j++) if (q[(y * 2 - 1) * N + x * 2 + j] === 's') q[(y * 2 - 1) * N + x * 2 + j] = 'S';
  }
  // 3) 옷차림 덧그림 (32px 격자)
  if (dr && dr.paint) dr.paint(q, N, d);
  // 4) 뒤집기는 그림자를 넣기 전에 (빛은 늘 왼쪽 위)
  if (opt.flip) { Q = q.slice(); for (y = 0; y < N; y++) for (x = 0; x < N; x++) q[y * N + x] = Q[y * N + N - 1 - x]; }
  var cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  var g = cv.getContext('2d'), img = g.createImageData(N, N), D = img.data;
  if (opt.mask) {      // 무기 자리만 흰색 (강화 빛·전설의 반짝임을 무기에 얹는다)
    var wch = dr && dr.wch; if (!wch) return null;
    var any = 0;
    for (i = 0; i < N * N; i++) if (wch[q[i]]) { D[i * 4] = D[i * 4 + 1] = D[i * 4 + 2] = 255; D[i * 4 + 3] = 255; any = 1; }
    if (!any) return null;
    if (opt.step) stepFeet(D, N, opt.step);
    g.putImageData(img, 0, 0); return cv;
  }
  var xp = dr && dr.pal || {}, flat = dr && dr.flat || {};
  function colOf(ch) { return rgb(opt.tint || (opt.colFn && opt.colFn(ch)) || xp[ch] || (ch === 'b' && opt.trim) || d.pal[ch] || PAL[ch] || '#f0f'); }
  var E = new Uint8Array(N * N);
  for (y = 0; y < N; y++) for (x = 0; x < N; x++) { c = q[y * N + x]; E[y * N + x] = c === '.' || (c === 'k' && (at(q, x - 1, y) === '.' || at(q, x + 1, y) === '.' || at(q, x, y - 1) === '.' || at(q, x, y + 1) === '.')) ? 1 : 0; }
  function ed(x, y) { return x < 0 || y < 0 || x >= N || y >= N ? 1 : E[y * N + x]; }
  var rim = RIM[opt.rim] || null;
  for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
    c = q[y * N + x]; if (c === '.') continue;
    var col = colOf(c), f = 0;
    if (!opt.tint && c !== 'k' && !flat[c]) {
      var lone = at(q, x - 1, y) !== c && at(q, x + 1, y) !== c && at(q, x, y - 1) !== c && at(q, x, y + 1) !== c;
      if (!lone) {
        var eu = ed(x, y - 1) || ed(x - 1, y), ee = ed(x, y + 1) || ed(x + 1, y);
        if (eu) f = ee ? 0 : 0.2; else if (ee) f = -0.18;
        if (!f && ((x + y) & 1)) { var bl = at(q, x, y + 1); if (bl !== c && c === c.toLowerCase() && bl === c.toUpperCase() && bl !== c && (PAL[bl] || d.pal[bl] || xp[bl])) col = colOf(bl); }
      }
    }
    if (f > 0 && rim) { col = [col[0] + (rim[0] - col[0]) * rim[3], col[1] + (rim[1] - col[1]) * rim[3], col[2] + (rim[2] - col[2]) * rim[3]]; f = 0; }
    else if (rim && c === 'k' && E[y * N + x] && (at(q, x, y - 1) === '.' || (rim[7] && at(q, x - 1, y) === '.' && at(q, x, y + 1) !== '.'))) col = [rim[4], rim[5], rim[6]];
    if (f) col = tone(col, f);
    i = (y * N + x) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255;
  }
  if (opt.step) stepFeet(D, N, opt.step);
  g.putImageData(img, 0, 0);
  return cv;
}
// ── r13 toon: 카툰화 파이프라인 ──
// 같은 16px(보스 24px) 문자 격자를 원화로 삼아 4배(64px·96px) 캔버스로 한 번 굽는다 (캐시 — 프레임마다 굽지 않는다):
//  1) 원화 → EPX 2배(32px 격자, 바깥 외곽선 1px·옷차림 덧그림까지 bake2 와 같은 손질) → EPX 한 번 더(4배 격자)
//  2) 실루엣의 부호 거리장(chamfer)을 흐려 계단 없는 둥근 윤곽 + 반투명 가장자리(안티에일리어싱)
//  3) 색 영역(재질)마다 위·왼쪽에서 오는 빛: 영역 경계까지의 기울기로 하이라이트 / 그늘 두 단 (셀 셰이딩, 단은 딱 끊긴다)
//  4) 바깥 윤곽선을 굵게 다시 긋는다 — 검정이 아니라 맞닿은 색을 어둡게 한 「색 있는」 선, 안쪽 선은 가늘고 부드럽게
//  5) 눈은 지우고 크게 덧그린다(세로로 긴 눈동자 + 흰 하이라이트 점 둘 + 볼 홍조)
// 결과 캔버스에는 cv.lw(논리 폭, 16 또는 24)를 달아 둔다 — 그리는 쪽은 cv.width 가 아니라 lw 로 크기를 정한다.
// DS.TOON = false 면 r11 의 32px 굽기(bake2)로 돌아간다.
DS.TOON = true; DS.TOON_X = 4;
var toonStat = { n: 0, px: 0, ms: 0 };
DS.toonStat = function () { return { canvases: toonStat.n, bytes: toonStat.px * 4, ms: Math.round(toonStat.ms) }; };
function epxA(a, n) {      // 평면 문자 배열 n×n → 2n×2n (EPX). 투명이 색을 먹는 쪽만 허용 (실루엣이 부풀지 않게)
  var N = n * 2, o = new Array(N * N), x, y;
  function at(x, y) { return x < 0 || y < 0 || x >= n || y >= n ? '.' : a[y * n + x]; }
  for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
    var P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1), e0 = P, e1 = P, e2 = P, e3 = P;
    if (P !== '.') {
      if (C === A && C !== D && A !== B) e0 = A;
      if (A === B && A !== C && B !== D) e1 = B;
      if (D === C && D !== B && C !== A) e2 = C;
      if (B === D && B !== A && D !== C) e3 = D;
    } else e0 = e1 = e2 = e3 = '.';
    var i = y * 2 * N + x * 2; o[i] = e0; o[i + 1] = e1; o[i + N] = e2; o[i + N + 1] = e3;
  }
  return o;
}
function stepGrid(q, N, step) {      // stepFeet 와 같은 걷기 프레임을 문자 격자에서 (든 발은 2칸 = 원화 1px)
  var bot = -1, x, y, x0 = N, x1 = -1;
  for (y = N - 1; y >= 0 && bot < 0; y--) for (x = 0; x < N; x++) if (q[y * N + x] !== '.') { bot = y; break; }
  if (bot < 8) return;
  for (x = 0; x < N; x++) if (q[bot * N + x] !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  var mid = (x0 + x1 + 1) >> 1, top = bot - 5, lo = step === 1 ? 0 : mid, hi = step === 1 ? mid : N;
  for (y = top; y <= bot; y++) for (x = lo; x < hi; x++) { var j = y * N + x; if (q[j] !== '.' || y - 2 >= top) q[j - 2 * N] = q[j]; }
  for (y = bot - 1; y <= bot; y++) for (x = lo; x < hi; x++) q[y * N + x] = '.';
}
// 이진 격자 → 안쪽/바깥 거리 (chamfer 3-4) + 바깥 칸에서 가장 가까운 안쪽 칸 번호
function chamfer(on, W, H) {
  var INF = 1e6, din = new Float32Array(W * H), dout = new Float32Array(W * H), near = new Int32Array(W * H), x, y, i;
  for (i = 0; i < W * H; i++) { din[i] = on[i] ? INF : 0; dout[i] = on[i] ? 0 : INF; near[i] = on[i] ? i : -1; }
  function pass(d, nr, fw) {
    var ys = fw ? 0 : H - 1, ye = fw ? H : -1, st = fw ? 1 : -1, nb = fw ? [[-1, 0, 1], [0, -1, 1], [-1, -1, 1.414], [1, -1, 1.414]] : [[1, 0, 1], [0, 1, 1], [1, 1, 1.414], [-1, 1, 1.414]];
    for (y = ys; y !== ye; y += st) for (x = fw ? 0 : W - 1; fw ? x < W : x >= 0; x += st) {
      i = y * W + x; if (d[i] === 0) continue;
      for (var k = 0; k < 4; k++) { var xx = x + nb[k][0], yy = y + nb[k][1]; if (xx < 0 || yy < 0 || xx >= W || yy >= H) { if (d === din && d[i] > nb[k][2] * 0.5) d[i] = nb[k][2] * 0.5; continue; } var j = yy * W + xx, v = d[j] + nb[k][2]; if (v < d[i]) { d[i] = v; if (nr) nr[i] = nr[j]; } }
    }
  }
  pass(din, null, 1); pass(din, null, 0); pass(dout, near, 1); pass(dout, near, 0);
  return { din: din, dout: dout, near: near };
}
function blur3(a, W, H, times) {      // 3×3 상자 흐림 (가장자리는 같은 값으로)
  var b = new Float32Array(W * H), x, y, t;
  for (t = 0; t < times; t++) {
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var s = 0, c = 0;
      for (var dy = -1; dy <= 1; dy++) { var yy = y + dy; if (yy < 0 || yy >= H) continue; for (var dx = -1; dx <= 1; dx++) { var xx = x + dx; if (xx < 0 || xx >= W) continue; s += a[yy * W + xx]; c++; } }
      b[y * W + x] = s / c;
    }
    var tmp = a; a = b; b = tmp;
  }
  return a;
}
var MWS = { 2: [1, 2, 3, 2, 1], 3: [1, 2, 3, 4, 3, 2, 1] };
function modeF(a, M, R) {
  var o = a.slice(), x, y, dx, dy, cnt = new Int32Array(128), seen = [], k, c, MW = MWS[R];
  for (y = 0; y < M; y++) for (x = 0; x < M; x++) {
    c = a[y * M + x]; if (c === '.') continue;
    var best = c, bv = 0, ns = 0;
    for (dy = -R; dy <= R; dy++) { var yy = y + dy; if (yy < 0 || yy >= M) continue; var wy = MW[dy + R], row = yy * M; for (dx = -R; dx <= R; dx++) { var xx = x + dx; if (xx < 0 || xx >= M) continue; k = a[row + xx]; if (k === '.') continue; var cc = k.charCodeAt(0) & 127; if (!cnt[cc]) seen[ns++] = cc; cnt[cc] += MW[dx + R] * wy; } }
    cnt[c.charCodeAt(0) & 127] += R * 2;
    for (k = 0; k < ns; k++) { if (cnt[seen[k]] > bv) { bv = cnt[seen[k]]; best = String.fromCharCode(seen[k]); } cnt[seen[k]] = 0; }
    cnt[c.charCodeAt(0) & 127] = 0;
    o[y * M + x] = best;
  }
  return o;
}
function mixc(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
function lumi(c) { return (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255; }
// 그늘 색: 그냥 어둡게가 아니라 푸른 보랏빛으로 기울인다 (카툰 그늘) — 채도는 지킨다
function shade(c, f) { var t = [c[0] * 0.62 + 18, c[1] * 0.6 + 14, c[2] * 0.72 + 40]; return mixc(c, t, f); }
function lite(c, f) { return mixc(c, [255, 251, 236], f); }
function lineOf(c) { var d = [c[0] * 0.3 + 10, c[1] * 0.26 + 8, c[2] * 0.34 + 22]; return lumi(c) > 0.85 ? [70, 62, 92] : d; }      // 색 있는 어두운 윤곽선
function toonBake(name, d, opt) {
  var t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
  var n = d.size, N = n * 2, XO = DS.TOON_X || 4, X = XO <= 4 ? 4 : 8, M = n * X, x, y, i, j, r, rows = [];      // X = 속 격자 배율(4·8), XO = 내보내는 배율
  for (y = 0; y < n; y++) { r = d.rows[y] || ''; while (r.length < n) r += '.'; rows.push(r.slice(0, n)); }
  var dr = opt.dress && DS.dressPrep ? DS.dressPrep(name, opt.dress, d) : null;
  if (dr && dr.rows) rows = dr.rows;
  function sp(x, y) { return x < 0 || y < 0 || x >= n || y >= n ? '.' : rows[y][x]; }
  // 눈 찾기 (원화 격자): 좌우·위가 피부인 외곽선 한 점 → 지우고 나중에 크게 덧그린다
  var eyes = [];
  if (!opt.tint && !opt.mask && name) for (y = 1; y < n; y++) for (x = 1; x < n - 1; x++) {
    if (rows[y][x] !== 'k') continue;
    var L0 = rows[y][x - 1], R0 = rows[y][x + 1], U0 = rows[y - 1][x];
    if ((L0 === 's' || L0 === 'S') && (R0 === 's' || R0 === 'S') && (U0 === 's' || U0 === 'S')) eyes.push([x, y, rows[y + 1] && (rows[y + 1][x] === 's' || rows[y + 1][x] === 'S')]);
  }
  var q = scale2x(rows, n), outer = new Uint8Array(n * n), ox, oy, Q, nb;
  for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (rows[y][x] === 'k') for (oy = -1; oy <= 1; oy++) for (ox = -1; ox <= 1; ox++) if (sp(x + ox, y + oy) === '.') outer[y * n + x] = 1;
  function at(a, x, y) { return x < 0 || y < 0 || x >= N || y >= N ? '.' : a[y * N + x]; }
  Q = q.slice();
  for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
    i = y * N + x; if (q[i] !== 'k' || !outer[(y >> 1) * n + (x >> 1)]) continue;
    if (at(q, x - 1, y) === '.' || at(q, x + 1, y) === '.' || at(q, x, y - 1) === '.' || at(q, x, y + 1) === '.') continue;
    nb = [at(q, x, y + 1), at(q, x, y - 1), at(q, x + 1, y), at(q, x - 1, y)];
    for (j = 0; j < 4; j++) if (nb[j] !== 'k' && nb[j] !== '.') { Q[i] = nb[j]; break; }
  }
  q = Q;
  for (i = 0; i < eyes.length; i++) { var e = eyes[i], b0 = e[1] * 2 * N + e[0] * 2; q[b0] = q[b0 + 1] = q[b0 + N] = q[b0 + N + 1] = 's'; }
  if (dr && dr.paint) dr.paint(q, N, d);
  if (opt.step) stepGrid(q, N, opt.step);
  if (opt.flip) { Q = q.slice(); for (y = 0; y < N; y++) for (x = 0; x < N; x++) q[y * N + x] = Q[y * N + N - 1 - x]; for (i = 0; i < eyes.length; i++) eyes[i][0] = n - 1 - eyes[i][0]; }
  // 바깥 외곽선 표시 (32 격자): 투명과 맞닿은 k → 윤곽선은 거리장으로 다시 긋는다
  var oK = new Uint8Array(N * N);
  for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (q[y * N + x] === 'k' && (at(q, x - 1, y) === '.' || at(q, x + 1, y) === '.' || at(q, x, y - 1) === '.' || at(q, x, y + 1) === '.')) oK[y * N + x] = 1;
  // 4배 격자
  var s = M / N, q4 = epxA(q, N);
  if (s > 2) q4 = epxA(q4, N * 2);
  // 색 영역 경계도 둥글게: 5×5 가중 최빈값 거르개 (계단 모서리가 깎이고, 가는 선은 남는다)
  if (!opt.mask) q4 = modeF(q4, M, X > 4 ? 3 : 2);
  var A = M * M, on = new Uint8Array(A), isK = new Uint8Array(A);
  var mk = opt.mask ? (dr && dr.wch) : null; if (opt.mask && !mk) return null;
  for (i = 0; i < A; i++) { var c = q4[i]; on[i] = mk ? (mk[c] ? 1 : 0) : (c !== '.' ? 1 : 0); }
  if (mk) { var anyM = 0; for (i = 0; i < A; i++) if (on[i]) { anyM = 1; break; } if (!anyM) return null; }
  var ch = chamfer(on, M, M), sd = new Float32Array(A);
  for (i = 0; i < A; i++) sd[i] = on[i] ? ch.din[i] - 0.5 : -(ch.dout[i] - 0.5);
  sd = blur3(sd, M, M, 1);
  var cv = document.createElement('canvas'); cv.width = M; cv.height = M; cv.lw = n; cv.toon = 1;
  var g = cv.getContext('2d'), img = g.createImageData(M, M), D = img.data;
  if (opt.tint || mk) {      // 단색 실루엣 (피격 번쩍임·등급 윤곽·강화 빛·무기 자리 마스크)
    var tc = mk ? [255, 255, 255] : rgb(opt.tint);
    for (i = 0; i < A; i++) { var al = Math.max(0, Math.min(1, sd[i] + 0.5)); if (!al) continue; j = i * 4; D[j] = tc[0]; D[j + 1] = tc[1]; D[j + 2] = tc[2]; D[j + 3] = al * 255; }
    g.putImageData(img, 0, 0); return toonOut(cv, n, XO);
  }
  var xp = dr && dr.pal || {}, flat = dr && dr.flat || {};
  function colOf(ch) { return rgb((opt.colFn && opt.colFn(ch)) || xp[ch] || (ch === 'b' && opt.trim) || d.pal[ch] || PAL[ch] || '#f0f'); }
  // 밝은·짙은 짝(a/A …)은 한 재질 — 원화의 바둑 디더·손그늘은 반쯤 눌러 두고 명암은 셀 셰이딩이 맡는다
  var bC = {};
  function hasC(ch) { return !!((opt.colFn && opt.colFn(ch)) || xp[ch] || d.pal[ch] || PAL[ch]); }
  function baseOf(c) { if (bC[c]) return bC[c]; var lo = c.toLowerCase(), v = colOf(c); if (lo !== c && hasC(lo) && !flat[c]) v = mixc(v, colOf(lo), 0.6); return (bC[c] = v); }
  // 4배 격자의 바깥 외곽선 칸: 32 격자 oK 를 따라간다 → 이웃 재질 색으로 메운다 (선은 거리장으로)
  var fillC = new Array(A), mat = new Int16Array(A), matId = {}, nm = 0, lineK = new Uint8Array(A);
  for (y = 0; y < M; y++) for (x = 0; x < M; x++) {
    i = y * M + x; c = q4[i]; if (c === '.') { mat[i] = -1; continue; }
    var y2 = Math.floor(y * N / M), x2 = Math.floor(x * N / M);
    if (c === 'k') { isK[i] = 1; if (!oK[y2 * N + x2]) lineK[i] = 1; }
    else { var key = c.toLowerCase(); if (!(key in matId)) matId[key] = nm++; mat[i] = matId[key]; fillC[i] = baseOf(c); }
  }
  // k 칸: 가장 가까운 재질 칸의 색·재질을 물려받는다 (BFS)
  var qu = [], hd = 0, src = new Int32Array(A).fill(-1);
  for (i = 0; i < A; i++) if (on[i] && !isK[i]) { src[i] = i; qu.push(i); }
  while (hd < qu.length) { var p = qu[hd++], px = p % M, py = (p / M) | 0; var NB = [p - 1, p + 1, p - M, p + M], ok = [px > 0, px < M - 1, py > 0, py < M - 1];
    for (j = 0; j < 4; j++) { if (!ok[j]) continue; var w = NB[j]; if (src[w] >= 0 || !on[w]) continue; src[w] = src[p]; qu.push(w); } }
  var KC = colOf('k');
  // 안쪽 칠 영역 F (바깥 외곽선 고리를 뺀 것) — 윤곽선은 F 둘레에 매끈하게 다시 긋는다 (가는 칼날·지팡이도 속 색이 남는다)
  var F = new Uint8Array(A); for (i = 0; i < A; i++) F[i] = on[i] && !(isK[i] && !lineK[i]) ? 1 : 0;
  var chF = chamfer(F, M, M), sdF = new Float32Array(A), LWm = X * 0.4;
  for (i = 0; i < A; i++) sdF[i] = F[i] ? chF.din[i] - 0.5 : -(chF.dout[i] - 0.5);
  sdF = blur3(sdF, M, M, 1);
  for (i = 0; i < A; i++) if (sdF[i] + LWm > sd[i]) sd[i] = sdF[i] + LWm;
  // 셀 셰이딩: 재질 경계까지의 기울기 (R=3칸 표본) + 실루엣 전체의 기울기 (R=7칸)
  var R1 = Math.max(2, Math.round(X * 0.8)), R2 = Math.round(X * 1.8);
  // 셀 셰이딩: 칸마다 「같은 재질의 세로·가로 토막」 안에서의 자리(0 위/왼 … 1 아래/오른)와 실루엣 토막 안의 자리
  //  → 위·왼쪽은 밝게, 아래·오른쪽은 그늘 (빛은 왼쪽 위). 토막이 짧은 작은 조각은 실루엣 쪽만 따른다.
  var tv = new Float32Array(A), th = new Float32Array(A), TV = new Float32Array(A), TH = new Float32Array(A), lv = new Uint16Array(A), lh = new Uint16Array(A);
  function mOf(k2) { return isK[k2] ? -1 : mat[k2]; }
  function runs(len, idx, key, pos, rl) {
    for (var l = 0; l < M; l++) { var a0 = 0; for (var t2 = 1; t2 <= M; t2++) { if (t2 < M && key(idx(l, t2)) === key(idx(l, a0))) continue; var L2 = t2 - a0; for (var u2 = a0; u2 < t2; u2++) { pos[idx(l, u2)] = L2 > 1 ? (u2 - a0) / (L2 - 1) : 0.5; if (rl) rl[idx(l, u2)] = L2; } a0 = t2; } }
  }
  function iV(l, t2) { return t2 * M + l; } function iH(l, t2) { return l * M + t2; } function kS(k2) { return on[k2]; }
  runs(M, iV, mOf, tv, lv); runs(M, iH, mOf, th, lh); runs(M, iV, kS, TV, null); runs(M, iH, kS, TH, null);
  var rim = RIM[opt.rim] || null, LIT = new Float32Array(A);
  for (i = 0; i < A; i++) if (F[i] && !isK[i]) LIT[i] = (0.5 - tv[i]) * (lv[i] >= X * 1.5 ? 1 : lv[i] / (X * 1.5)) + (0.5 - th[i]) * 0.42 * (lh[i] >= X * 1.5 ? 1 : lh[i] / (X * 1.5)) + (0.5 - TV[i]) * 0.55 + (0.5 - TH[i]) * 0.3;
  LIT = blur3(LIT, M, M, 2);      // 명암 경계를 매끈하게 (단은 아래에서 딱 끊는다)
  for (y = 0; y < M; y++) for (x = 0; x < M; x++) {
    i = y * M + x; var cov = Math.max(0, Math.min(1, sd[i] + 0.5)); if (!cov) continue;
    var si = F[i] ? i : chF.near[i]; if (si < 0) continue;
    var base, m0, sx2 = si % M, sy2 = (si / M) | 0;
    if (isK[si]) { var sr = src[si]; if (sr < 0) { base = KC; m0 = -2; } else { base = fillC[sr]; m0 = mat[sr]; } }
    else { base = fillC[si]; m0 = mat[si]; }
    var col = base, lit = 0;
    var flatC = q4[si] !== 'k' && flat[q4[si]];
    if (m0 >= 0 && !flatC) {
      lit = LIT[si];
      if (lit > 0.5) col = rim ? mixc(base, [rim[0], rim[1], rim[2]], rim[3]) : lite(base, 0.36);
      else if (lit > 0.26) col = lite(base, 0.13);
      else if (lit < -0.62) col = shade(base, 0.6);
      else if (lit < -0.22) col = shade(base, 0.3);
    }
    if (lineK[si]) {      // 안쪽 선 (띠·틈): 가운데만 짙게, 가장자리는 반쯤
      var edgeN = !lineK[si - 1] || !lineK[si + 1] || !lineK[si - M] || !lineK[si + M];
      col = src[si] >= 0 ? mixc(base, lineOf(base), edgeN ? 0.55 : 0.9) : KC;
    }
    // 바깥 윤곽선: F 바깥 (원래 외곽선 고리 + 최소 두께), 부드럽게
    var lm = Math.max(0, Math.min(1, 0.5 - sdF[i]));
    if (lm > 0) { var lc = lineOf(base); if (rim && lit > 0.3) lc = [rim[4] * 0.75, rim[5] * 0.75, rim[6] * 0.75]; col = mixc(col, lc, lm); }
    j = i * 4; D[j] = col[0]; D[j + 1] = col[1]; D[j + 2] = col[2]; D[j + 3] = cov * 255;
  }
  g.putImageData(img, 0, 0);
  // 큰 눈 덧그림
  if (eyes.length) {
    var u = X, skin = colOf('s');
    for (i = 0; i < eyes.length; i++) {
      var ex = (eyes[i][0] + 0.5) * u, ey = (eyes[i][1] + 0.45) * u;
      if (eyes[i][2]) { g.fillStyle = 'rgba(255,120,130,.32)'; g.beginPath(); g.ellipse(ex + (eyes[i][0] < n / 2 ? -0.35 : 0.35) * u, ey + 0.95 * u, 0.42 * u, 0.22 * u, 0, 0, 6.2832); g.fill(); }
      g.fillStyle = 'rgb(' + lineOf(skin).map(Math.round).join(',') + ')'; g.beginPath(); g.ellipse(ex, ey, 0.5 * u, 0.7 * u, 0, 0, 6.2832); g.fill();
      g.fillStyle = '#3a2c58'; g.beginPath(); g.ellipse(ex, ey + 0.25 * u, 0.34 * u, 0.36 * u, 0, 0, 6.2832); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex - 0.16 * u, ey - 0.26 * u, 0.2 * u, 0, 6.2832); g.fill();
      g.globalAlpha = 0.8; g.beginPath(); g.arc(ex + 0.2 * u, ey + 0.3 * u, 0.09 * u, 0, 6.2832); g.fill(); g.globalAlpha = 1;
    }
  }
  if (t0) toonStat.ms += performance.now() - t0;
  return toonOut(cv, n, XO);
}
function toonOut(cv, n, XO) {      // 속 격자(8배)에서 내보내는 크기(예: 6배)로 줄인다 — 줄일 때 생기는 고른 안티에일리어싱
  if (cv.width !== n * XO) { var o = document.createElement('canvas'); o.width = o.height = n * XO; var g = o.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(cv, 0, 0, o.width, o.height); o.lw = n; o.toon = 1; cv = o; }
  toonStat.n++; toonStat.px += cv.width * cv.height; return cv;
}
function toonNew(src) { var cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; cv.lw = src.lw; cv.toon = 1; toonStat.n++; toonStat.px += cv.width * cv.height; return cv; }
function toonTint(src, col) { var cv = toonNew(src), g = cv.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, cv.width, cv.height); return cv; }
function toonFlip(src) { var cv = toonNew(src), g = cv.getContext('2d'); g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return cv; }
function toonStep(src, step) {      // 걷기: 발 줄을 반쪽만 든다 (stepFeet 를 4배 그림에서)
  var cv = toonNew(src), g = cv.getContext('2d'), W = cv.width, f = W / (src.lw * 2); g.drawImage(src, 0, 0);
  var img = g.getImageData(0, 0, W, W), D = img.data, bot = -1, x, y, x0 = W, x1 = -1;
  for (y = W - 1; y >= 0 && bot < 0; y--) for (x = 0; x < W; x++) if (D[(y * W + x) * 4 + 3] > 40) { bot = y; break; }
  if (bot < 8 * f) return cv;
  for (x = 0; x < W; x++) if (D[(bot * W + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  var lift = 2 * f, mid = (x0 + x1 + 1) >> 1, top = bot - 6 * f + 1, lo = step === 1 ? 0 : mid, hi = step === 1 ? mid : W, bt = Math.min(W - 1, bot + 2);
  for (y = top; y <= bt; y++) for (x = lo; x < hi; x++) { var j = (y * W + x) * 4, k = ((y - lift) * W + x) * 4; if (D[j + 3] || y - lift >= top) { D[k] = D[j]; D[k + 1] = D[j + 1]; D[k + 2] = D[j + 2]; D[k + 3] = D[j + 3]; } }
  for (y = bt - lift + 1; y <= bt; y++) for (x = lo; x < hi; x++) D[(y * W + x) * 4 + 3] = 0;
  g.putImageData(img, 0, 0); return cv;
}
DS.toonBake = toonBake;
DS.sprTools = { scale2x: scale2x, rgb: rgb, tone: tone };
DS.bakeRows = function (rows, n, colFn) { if (DS.TOON !== false) return toonBake('', { size: n, rows: rows, pal: {} }, { colFn: colFn }); return bake2('', { size: n, rows: rows, pal: {} }, { colFn: colFn }); };      // 아이콘(창 그림)도 같은 32px 손질 (1px 외곽선)
var flush0 = DS.spriteFlush; DS.spriteFlush = function () { flush0(); hdCache = {}; if (DS.artFlush) DS.artFlush(); };
})();
