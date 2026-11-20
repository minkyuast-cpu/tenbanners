// 전민 — 2.2.9 윗길(8 · 9 · 10단)의 모습: 열 가문 × 세 단. 새 그림(art3 · 코드로 그린 카툰)과 픽셀 그림(sprites2 · 16칸) 둘 다.
//   단이 오를수록 더 화려하게 — 8단: 윗길의 갑옷 · 망토 · 오라(aura) · 9단: 날개(또는 큰 망토) · 더 밝은 빛 · 오라 알갱이(aura2) · 10단: 큰 날개 · 금관 · 빛 고리와 빛살(aura3).
//   사람 모습은 [머리, 몸, 장비, 빛깔] (sprites2 LOOKS 와 같은 꼴) — DS.LOOKP 에 올리면 새 그림이, DS.SPR 에 올리면 픽셀 그림이 읽는다.
//   기병(뇌전기사)은 말 위, 비병(폭풍기수)은 용 위 — art3 specOf 가 DS.RISE_ART.cav · fly 를 읽는다. 오라는 그림을 다 그린 뒤 뒤에 깐다 (art3 withAura — 테두리 선에 걸리지 않게).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
function L(head, body, items, pal) { return [head, body, items, pal]; }
var LOOK = {
  xinf: [      // 성벽기사 → 철옹공 → 불괴왕: 푸른 강철 → 은빛 → 흰 금
    L('helm', 'armor', ['aura', 'cape', 'sword', 'shield'], { a: '#9fb4d8', A: '#5e72a0', b: '#f6cf57', q: '#3f6fc8', Q: '#27488c', u: '#cdd5e3', U: '#8f9ab3', m: '#e2e9f2', M: '#a7b2c6', Y: '#8fc8ff' }),
    L('horned', 'armor', ['aura2', 'mwing', 'cape', 'sword', 'shield'], { a: '#e2e9f2', A: '#a7b2c6', b: '#f6cf57', q: '#62b0ee', Q: '#3572b8', u: '#f6cf57', U: '#c08f2c', m: '#ffffff', M: '#cdd5e3', w: '#cfe6ff', Y: '#8fc8ff' }),
    L('crown', 'armor', ['aura3', 'mwing2', 'cape', 'gsword', 'shield'], { a: '#fff6dc', A: '#d8c8a0', b: '#62b0ee', q: '#f6cf57', Q: '#c08f2c', h: '#f6cf57', H: '#c08f2c', u: '#ffffff', U: '#f6cf57', w: '#ffffff', i: '#ffffff', I: '#f6cf57', M: '#c08f2c', Y: '#bfe0ff' })
  ],
  xmar: [      // 해일장군 → 파도군주 → 해신: 청록 → 물빛 → 흰 물보라
    L('horned', 'armor', ['aura', 'cape', 'trident'], { a: '#2fb0a0', A: '#1c7468', b: '#f6cf57', q: '#2f86a6', Q: '#1f5d78', m: '#9fe8ec', M: '#4fa8b8', Y: '#62d0ee' }),
    L('crown', 'armor', ['aura2', 'mwing', 'cape', 'trident'], { a: '#3fd0c0', A: '#228a80', b: '#ffffff', q: '#1f5d78', Q: '#123c4e', h: '#9fe8ec', H: '#4fa8b8', w: '#9fe8ec', Y: '#62d0ee' }),
    L('crown', 'armor', ['aura3', 'mwing2', 'cape', 'trident'], { a: '#e8fbff', A: '#9fd8e0', b: '#f6cf57', q: '#2f86a6', Q: '#1f5d78', h: '#f6cf57', H: '#c08f2c', w: '#c9f1ff', i: '#ffffff', I: '#62d0ee', Y: '#9fe8ec' })
  ],
  xpike: [      // 창벽장군 → 만창공 → 창성: 짙은 초록 → 은 → 흰 금
    L('horned', 'armor', ['aura', 'cape', 'halberd'], { a: '#4c9a8a', A: '#2f6b62', b: '#f6cf57', q: '#3a7d42', Q: '#24552d', m: '#cdd5e3', M: '#8f9ab3', Y: '#b6f0a0' }),
    L('crown', 'armor', ['aura2', 'mwing', 'cape', 'halberd'], { a: '#cdd5e3', A: '#8f9ab3', b: '#5fae5a', q: '#3a7d42', Q: '#24552d', h: '#5fae5a', H: '#3a7d42', w: '#d8ffc8', Y: '#b6f0a0' }),
    L('crown', 'armor', ['aura3', 'mwing2', 'cape', 'halberd'], { a: '#f7f2e6', A: '#cfc6ae', b: '#5fae5a', q: '#e8bb45', Q: '#b07f2a', h: '#f6cf57', H: '#c08f2c', w: '#ffffff', Y: '#d8ffb0' })
  ],
  xarc: [      // 매눈사수 → 신궁 → 천궁성: 숲빛 · 금 → 흰 가면 → 금관
    L('hood', 'tunic', ['aura', 'cape', 'lbow'], { a: '#3f8f6a', A: '#27604a', b: '#f6cf57', B: '#6f4a2c', q: '#c9a227', Q: '#8a6c14', w: '#ffffff', Y: '#d8ff9a' }),
    L('mask', 'tunic', ['aura2', 'mwing', 'cape', 'lbow'], { a: '#e9e2d0', A: '#b9ae96', b: '#5fae5a', B: '#8f9ab3', q: '#3f8f6a', Q: '#27604a', w: '#e8ffd0', Y: '#d8ff9a' }),
    L('crown', 'tunic', ['aura3', 'mwing2', 'cape', 'lbow'], { a: '#fff6dc', A: '#d8c8a0', b: '#5fae5a', B: '#c08f2c', q: '#5fae5a', Q: '#3a7d42', h: '#f6cf57', H: '#c08f2c', w: '#ffffff', Y: '#e8ffb0' })
  ],
  xcle: [      // 금강권 → 무성 → 천무신: 금빛 도복 → 흰 도복 · 금 테 → 빛 고리 (무투가는 날개 대신 큰 망토와 목도리)
    L('band', 'gi', ['aura', 'scarf', 'gaunt'], { a: '#f6cf57', A: '#c08f2c', b: '#3a3350', B: '#262036', r: '#e0525e', R: '#9c2f45', h: '#1b1626', l: '#ffffff', q: '#e0525e', Q: '#9c2f45', m: '#ffe27a', M: '#c08f2c', p: '#5e2a34', Y: '#ffd27a' }),
    L('circlet', 'gi', ['aura2', 'cape', 'scarf', 'gaunt'], { a: '#fff6dc', A: '#e8d0a0', b: '#e0525e', B: '#9c2f45', h: '#1b1626', i: '#f6cf57', I: '#c08f2c', c: '#62b0ee', l: '#ffffff', q: '#f6cf57', Q: '#c08f2c', m: '#ffffff', M: '#cdd5e3', p: '#3a3350', Y: '#ffd27a' }),
    L('circlet', 'gi', ['aura3', 'cape', 'scarf', 'gaunt'], { a: '#ffffff', A: '#e8e0cc', b: '#f6cf57', B: '#c08f2c', h: '#1b1626', i: '#ffffff', I: '#f6cf57', c: '#ff4d6d', l: '#fff6dc', q: '#e0525e', Q: '#9c2f45', m: '#ffe27a', M: '#c08f2c', p: '#7a2a34', Y: '#ffe9a0' })
  ],
  xmon: [      // 성등사 → 대성관 → 일륜성자: 흰 법의 · 등불빛 → 주황 · 날개 → 해처럼 흰 금
    L('mitre', 'robe', ['aura', 'cape', 'cross'], { a: '#fff6dc', A: '#e8d0a0', b: '#f09a4a', h: '#f6cf57', H: '#c08f2c', q: '#f09a4a', Q: '#b8642a', Y: '#fff0a0' }),
    L('crown', 'robe', ['aura2', 'mwing', 'cape', 'orb'], { a: '#f09a4a', A: '#b8642a', b: '#fff6d8', h: '#fff6dc', H: '#e0c888', q: '#fff6d8', Q: '#e0c888', c: '#ffffff', C: '#fff0a0', w: '#fff6dc', Y: '#fff0a0' }),
    L('crown', 'robe', ['aura3', 'mwing2', 'cape', 'orb'], { a: '#ffffff', A: '#f0e6c8', b: '#f6cf57', h: '#f6cf57', H: '#c08f2c', q: '#f09a4a', Q: '#b8642a', c: '#ffffff', C: '#ffd24a', w: '#ffffff', Y: '#fff6c0' })
  ],
  xmag: [      // 대마도사 → 원소왕 → 천원현자: 짙은 보라 · 세 원소 구슬 → 흰 망토 → 흰 금 · 보랏빛 날개
    L('wizhat', 'robe', ['aura', 'cape', 'orb'], { a: '#6a4fc8', A: '#45318f', b: '#f6cf57', c: '#ff9a3c', C: '#62b0ee', q: '#2b2440', Q: '#1b1626', Y: '#c9a8ff' }),
    L('crown', 'robe', ['aura2', 'mwing', 'cape', 'orb'], { a: '#8d6be0', A: '#5f41ad', b: '#ffffff', c: '#9fe8ec', C: '#ff9a3c', q: '#f7f2e6', Q: '#cfc6ae', h: '#cdd5e3', H: '#8f9ab3', w: '#e0d0ff', Y: '#c9a8ff' }),
    L('crown', 'robe', ['aura3', 'mwing2', 'cape', 'orb'], { a: '#f7f2e6', A: '#cfc6ae', b: '#b181e6', c: '#ffffff', C: '#b181e6', q: '#8d6be0', Q: '#5f41ad', h: '#f6cf57', H: '#c08f2c', w: '#f0e8ff', Y: '#e0d0ff' })
  ],
  xsha: [      // 사령군주 → 명계왕 → 불사왕(리치): 검은 두건 · 독빛 → 뿔 · 뼈 날개 → 창백한 얼굴 · 해골 관
    L('darkhood', 'robe', ['aura', 'cape', 'sstaff'], { a: '#2b2440', A: '#1b1626', b: '#b6ff5a', z: '#0f0c18', x: '#b6ff5a', q: '#3a5230', Q: '#24361e', Y: '#b6ff5a' }),
    L('horned', 'robe', ['aura2', 'mwing', 'cape', 'orb'], { a: '#1b1626', A: '#0f0c18', b: '#b6ff5a', m: '#8f9ab3', M: '#5b6480', w: '#4a6a3a', q: '#5a2a6a', Q: '#3a1a4a', c: '#b6ff5a', C: '#5a9a2a', Y: '#b6ff5a' }),
    L('crown', 'robe', ['aura3', 'mwing2', 'cape', 'orb'], { a: '#1b1626', A: '#0f0c18', b: '#ff4d6d', h: '#cdd5e3', H: '#8f9ab3', i: '#b6ff5a', I: '#5a9a2a', s: '#cdb7c6', S: '#a8909f', q: '#2f6b3a', Q: '#1a4a24', c: '#b6ff5a', C: '#5a9a2a', w: '#2b3a2a', Y: '#d0ff8a' })
  ]
};
// 기병 · 비병: 탈것째 (새 그림 art3 · 픽셀 sprites2 의 bm 줄과 같은 꼴)
var CAVX = [      // 뇌전기사 → 천둥군주 → 뇌제: 검은 군마 · 번개빛 갈기 → 흰 천마 → 검은 천마 · 하늘빛 갈기 · 금 날개
  { head: 'horned', items: ['aura', 'cape', 'spear'], pal: { a: '#3a3350', A: '#262036', b: '#ffe27a', q: '#5f41ad', Q: '#3a2a78', m: '#ffe27a', M: '#c08f2c', Y: '#ffe27a' }, H: { c: '#2b2440', mane: '#ffe27a', cloth: '#5f41ad', trim: '#ffe27a', helm: '#cdd5e3' } },
  { head: 'crown', items: ['aura2', 'cape', 'spear'], pal: { a: '#ffe27a', A: '#c08f2c', b: '#3a3350', q: '#3a2a78', Q: '#241a50', h: '#3a3350', H: '#262036', m: '#ffffff', M: '#cdd5e3', Y: '#ffe27a' }, H: { c: '#f1ead9', mane: '#ffe27a', cloth: '#3a2a78', trim: '#ffe27a', helm: '#ffe27a', horn: '#e8d8a8', wings: '#fff3b0' } },
  { head: 'crown', items: ['aura3', 'cape', 'spear'], pal: { a: '#fff6dc', A: '#d8c8a0', b: '#62b0ee', q: '#f6cf57', Q: '#c08f2c', h: '#f6cf57', H: '#c08f2c', m: '#ffffff', M: '#9fe8ec', i: '#ffffff', I: '#f6cf57', Y: '#fff3b0' }, H: { c: '#1b1626', mane: '#9fe8ec', cloth: '#f6cf57', trim: '#ffffff', helm: '#f6cf57', horn: '#ffffff', wings: '#ffe27a' } }
];
var FLYX = [      // 폭풍기수 → 창공군주 → 천룡왕: 푸른 용 → 흰 용 · 금 뿔 → 금빛 용 · 붉은 눈
  { head: 'horned', items: ['aura', 'cape', 'spear'], pal: { a: '#62b0ee', A: '#3572b8', b: '#ffffff', q: '#3572b8', Q: '#24508a', m: '#e8f4ff', M: '#9fc8e8', Y: '#9fe8ec' }, F: { mount: 'dragon', c: '#3a6ab0', wing: '#2a4a80', belly: '#cfe6ff', eye: '#9fe8ec', horn: '#e8f4ff' } },
  { head: 'crown', items: ['aura2', 'cape', 'spear'], pal: { a: '#e2e9f2', A: '#a7b2c6', b: '#62b0ee', q: '#62b0ee', Q: '#3572b8', h: '#62b0ee', H: '#3572b8', m: '#ffffff', M: '#cdd5e3', Y: '#9fe8ec' }, F: { mount: 'dragon', c: '#e8f0ff', wing: '#9fc8e8', belly: '#ffffff', eye: '#62b0ee', horn: '#f6cf57' } },
  { head: 'crown', items: ['aura3', 'cape', 'spear'], pal: { a: '#f6cf57', A: '#c08f2c', b: '#ffffff', q: '#e0525e', Q: '#9c2f45', h: '#ffffff', H: '#cdd5e3', m: '#ffffff', M: '#f6cf57', i: '#ffffff', I: '#f6cf57', Y: '#ffe9a0' }, F: { mount: 'dragon', c: '#f6cf57', wing: '#ffe9a0', belly: '#fff6dc', eye: '#ff4d6d', horn: '#ffffff' } }
];
DS.RISE_ART = { look: LOOK, cav: CAVX, fly: FLYX };
DS.auraOf = function (items, pal) {      // 장비 목록의 오라 칸 → { lv, c } (없으면 null)
  var lv = 0; (items || []).forEach(function (n) { var m = /^aura(\d?)$/.exec(n); if (m) lv = Math.max(lv, +(m[1] || 1)); });
  return lv ? { lv: lv, c: (pal && pal.Y) || '#f6cf57' } : null;
};
// ── 새 그림: 오라 (그림 뒤에 깐다 — 부드러운 빛 · 9단 알갱이 · 10단 빛 고리와 빛살). 논리 좌표(64 칸)에서 cx, cy 둘레로
function hexA(c, a) { var h = String(c || '#f6cf57').replace('#', ''); if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join(''); var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
DS.artAura = function (g, A, cx, cy, head) {
  if (!A || !g || !g.createRadialGradient) return;
  var lv = A.lv || 1, R = 17 + lv * 3.4, c = A.c;
  g.save();
  var gr = g.createRadialGradient(cx, cy, 1, cx, cy, R); gr.addColorStop(0, hexA(c, 0.5 + lv * 0.06)); gr.addColorStop(0.55, hexA(c, 0.2 + lv * 0.04)); gr.addColorStop(1, hexA(c, 0));
  g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, R, R * 1.12, 0, 0, Math.PI * 2); g.fill();
  if (lv >= 3) {      // 빛살 여덟
    g.strokeStyle = hexA('#ffffff', 0.32); g.lineWidth = 1;
    for (var k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2 + 0.2; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.45, cy + Math.sin(a) * R * 0.5); g.lineTo(cx + Math.cos(a) * R * 1.02, cy + Math.sin(a) * R * 1.1); g.stroke(); }
  }
  if (lv >= 2) {      // 오라 알갱이 (마름모)
    g.fillStyle = hexA('#ffffff', 0.85);
    var n = lv >= 3 ? 8 : 5;
    for (var i = 0; i < n; i++) { var b = i / n * Math.PI * 2 + 0.5, r = R * (0.78 + 0.12 * (i % 2)), x = cx + Math.cos(b) * r, y = cy + Math.sin(b) * r * 1.1, z = i % 2 ? 1 : 1.4;
      g.beginPath(); g.moveTo(x, y - z); g.lineTo(x + z * 0.7, y); g.lineTo(x, y + z); g.lineTo(x - z * 0.7, y); g.closePath(); g.fill(); }
  }
  if (lv >= 3 && head) {      // 머리 뒤의 빛 고리
    g.strokeStyle = hexA('#fff3c0', 0.95); g.lineWidth = 1.4;
    g.beginPath(); g.ellipse(head[0], head[1], 8.4, 2.8, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = hexA(c, 0.6); g.lineWidth = 0.7; g.beginPath(); g.ellipse(head[0], head[1], 10, 3.4, 0, 0, Math.PI * 2); g.stroke();
  }
  g.restore();
};
// ── 픽셀 그림 (16칸): 오라 알갱이 · 사람 줄 · 기병 · 비병 ──
var P = DS.SPRP; if (!P || !DS.SPR) return;
var ITEM = P.ITEM, SPR = DS.SPR, RAW = P.RAW;
ITEM.aura  = [0, 0, ['................', '................', 'Y...............', '...............Y', '................', '................', '................', '................', '................', '................', '................', 'Y...............', '................', '...............Y']];
ITEM.aura2 = [0, 0, ['.Y............Y.', '................', 'Y...............', '...............Y', '................', '................', '................', '................', '................', '................', '................', 'Y...............', '................', '...............Y', '................', '.Y............Y.']];
ITEM.aura3 = [0, 0, ['Y.Y..........Y.Y', '.Y............Y.', 'Y...............', '...............Y', '................', '................', '................', 'Y..............Y', '................', '................', '................', 'Y...............', '................', '...............Y', '.Y............Y.', 'Y.Y..........Y.Y']];
for (var k in LOOK) LOOK[k].forEach(function (l, n) {
  var nm = k + '_' + (n + 8);
  DS.LOOKP[nm] = l;
  SPR[nm] = P.def(P.compose(l[0], l[1], l[2]), l[3]);
});
function over(rows, pats) {
  var g = rows.map(function (r) { return r.split(''); });
  pats.forEach(function (p) { p[2].forEach(function (r, dy) { for (var dx = 0; dx < r.length; dx++) { var y = p[1] + dy, x = p[0] + dx; if (r[dx] !== '.' && g[y] && x >= 0 && x < g[y].length) g[y][x] = r[dx] === '_' ? '.' : r[dx]; } }); });
  return g.map(function (r) { return r.join(''); });
}
function sparks(lv) { return [[0, 0, ITEM['aura' + (lv > 1 ? lv : '')][2]]]; }
// 기병: 왕관 · 망토 · 말옷 · 말 투구 · 금창 · 날개 (sprites2 의 bm 과 같은 조각)
var K_CLOTH = [3, 9, ['hqqqqqqh', 'hqQqqQqh', 'hbbbbbbh']], K_HEAD = [10, 4, ['.kmMk', 'kmmhk']], K_CAPE = [0, 6, ['..kq', '.kqq', 'kqQk']], K_LANCE = [9, 7, ['iiiiiiw']], K_CROWN = [5, 0, ['i..i', 'irii']], K_HORN = [14, 1, ['.w', 'w.']],
    K_WING = [0, 2, ['kk', 'kwk', 'kwwk', 'kwmwk', '.kwmk', '..kw']], K_WING2 = [0, 0, ['k', 'wk', 'wwk', 'wwwk', 'kwmwk', 'kwmmk', '.kwmk', '..kw']], K_BOLT = [13, 9, ['.Y', 'Y.', '.Y']];
var CAVPX = [
  { a: '#3a3350', A: '#262036', h: '#2b2440', H: '#1b1626', m: '#ffe27a', M: '#c08f2c', q: '#5f41ad', Q: '#3a2a78', b: '#ffe27a', i: '#ffe27a', r: '#ffe27a', w: '#ffe27a', Y: '#ffe27a' },
  { a: '#ffe27a', A: '#c08f2c', h: '#f1ead9', H: '#cfc4a8', m: '#ffe27a', M: '#c08f2c', q: '#3a2a78', Q: '#241a50', b: '#3a3350', i: '#ffffff', r: '#3a3350', w: '#fff3b0', Y: '#ffe27a' },
  { a: '#fff6dc', A: '#d8c8a0', h: '#1b1626', H: '#0f0c18', m: '#9fe8ec', M: '#62b0ee', q: '#f6cf57', Q: '#c08f2c', b: '#62b0ee', i: '#ffffff', r: '#f6cf57', w: '#ffe27a', Y: '#fff3b0' }];
CAVPX.forEach(function (p, n) { SPR['xcav_' + (n + 8)] = P.def(over(RAW.knight, [K_CROWN, K_CAPE, K_CLOTH, K_HEAD, K_LANCE, n > 0 ? (n > 1 ? K_WING2 : K_WING) : [0, 0, []], K_BOLT].concat(n > 0 ? [K_HORN] : []).concat(sparks(n + 1))), p); });
// 비병: 용 기수 (매 바탕 위에 큰 날개 · 금 띠 · 창 · 꼬리깃 · 관)
var H_WING = [0, 3, ['kk..........kk', 'khk........khk', 'khhk......khhk']], H_BAND = [1, 6, ['b............b', '.b..........b.']], H_SPEAR = [11, 0, ['w', 'w', 'o', 'o', 'o']], H_TAIL = [5, 13, ['kTTTTk', 'kTkkTk', '.k..k.']], H_CROWN = [6, 0, ['i..i', 'iiii']];
var FLYPX = [
  { a: '#62b0ee', A: '#3572b8', b: '#ffffff', h: '#3a6ab0', H: '#2a4a80', y: '#cfe6ff', T: '#2a4a80', i: '#e8f4ff', w: '#e8f4ff', Y: '#9fe8ec' },
  { a: '#e2e9f2', A: '#a7b2c6', b: '#62b0ee', h: '#e8f0ff', H: '#9fc8e8', y: '#ffffff', T: '#9fc8e8', i: '#f6cf57', w: '#ffffff', Y: '#9fe8ec' },
  { a: '#f6cf57', A: '#c08f2c', b: '#ffffff', h: '#f6cf57', H: '#c08f2c', y: '#fff6dc', T: '#e0525e', i: '#ffffff', w: '#ffffff', Y: '#ffe9a0' }];
FLYPX.forEach(function (p, n) { SPR['xfly_' + (n + 8)] = P.def(over(RAW.hawk, [H_CROWN, H_WING, H_BAND, H_SPEAR, H_TAIL].concat(sparks(n + 1))), p); });
})();
