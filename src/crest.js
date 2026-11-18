// r20 house: 가문 마크 — 열세 가문(아홉 집 + 세 합일 가문 + 맹주 가문)의 문장. 화면에서만 쓰는 인라인 SVG 문자열.
//   DS.houseCrest(cls, size, opt)  → '<svg class="crest" …>'   opt: { lord: 1 } 맹주 가문(작은 왕관), { title: '…' } 읽기 글
//   DS.houseCrestOf(s, ch, size)   → 그 가문(save.chars 한 줄)의 문장. 대장 가문이면 lord
// 모양: 아홉 집은 방패, 합일 가문(타르가르옌·아트레이데스·죠스타)은 금테 두 겹의 둥근 방패. 맹주 가문은 대장 병과의 문장에 금관을 얹는다
//   (대장 가문이 곧 그 병과의 집이라 같은 문장이 둘로 겹칠 일이 없다 — 병과 그림은 그대로 두고 「맹주」만 왕관으로 알린다).
// 32×32 격자에 그린다. 16px 에서는 1칸 = 0.5px — 그림은 굵은 면 위주로, 가는 선은 쓰지 않는다. build.js 에서 banner 뒤.
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
// [바탕, 그림, 테] — 테는 DS.FLAG(병과 색)를 따른다
var COL = {
  inf:  ['#1f3a66', '#e4e9f1', '#5b8fd6'],
  cav:  ['#5e1b1b', '#e8bb45', '#e8bb45'],
  fly:  ['#174566', '#f2f6fa', '#62b0ee'],
  mar:  ['#0d3647', '#e9dfc4', '#2f86a6'],
  pike: ['#173f38', '#dfe7e2', '#4c9a8a'],
  arc:  ['#1f421e', '#e8d9a0', '#5fae5a'],
  cle:  ['#e9e2cf', '#a8791f', '#c9a96a'],
  mon:  ['#5c2410', '#f6a456', '#f09a4a'],
  mag:  ['#2b1e5c', '#ece2ff', '#8d6be0'],
  sha:  ['#1b1230', '#c8b3f0', '#9a6ad0'],
  bm:   ['#4f1217', '#ece6da', '#e0525e'],
  tm:   ['#0f3a31', '#f2df7a', '#3fa88a'],
  mm:   ['#271b4a', '#f6cf57', '#f6cf57']
};
var GOLD = '#d9b66a', EDGE = '#0b0907';
var SHIELD = 'M5 5H27V15.5C27 22.5 22 27.5 16 30.5C10 27.5 5 22.5 5 15.5Z';
var ROUND = 'M16 3.5C21 3.5 27 5 27 5V15.5C27 22.5 22 27.5 16 30.5C10 27.5 5 22.5 5 15.5V5S11 3.5 16 3.5Z';
// 그림: f = 바탕색, c = 그림색
var ART = {
  // 보병 로저스: 큰 방패(스쿠툼)와 방패 혹
  inf: function (c, f) { return '<rect x="10.5" y="8" width="11" height="17" rx="2" fill="' + c + '"/><rect x="15" y="8" width="2" height="17" fill="' + f + '"/><circle cx="16" cy="16.5" r="3" fill="' + c + '" stroke="' + f + '" stroke-width="1.4"/>'; },
  // 기병 라니스터: 말 머리
  cav: function (c, f) { return '<path d="M11 26V21.5C11 18.5 12.3 16.5 13.6 14.8L10.6 16L9.2 13.6L14.6 8.6L15.6 6.2L17.6 8.2C21.4 9.2 23.2 12.6 23.2 17V26Z" fill="' + c + '"/><circle cx="16.6" cy="11.6" r="1.1" fill="' + f + '"/>'; },
  // 비병 스카이워커: 펼친 날개
  fly: function (c, f) { return '<path d="M7.5 21C9 13 15 8.2 24.5 7C23 9 22.4 10.6 22.2 12C20.6 12.4 19.2 13.2 18 14.2C19.4 14.2 20.6 14.4 21.4 15C19.8 16.4 18 17.2 16 17.6C17 18.2 18 18.4 18.8 18.6C15.6 21.4 11.6 22.2 7.5 21Z" fill="' + c + '"/><path d="M9.5 24.5L13.5 20.5" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>'; },
  // 수군 앗쎄이: 닻 (r29: 옛 이름 스패로우)
  mar: function (c, f) { return '<circle cx="16" cy="8.6" r="2.3" fill="none" stroke="' + c + '" stroke-width="1.9"/><rect x="15" y="10.6" width="2" height="15" fill="' + c + '"/><rect x="11" y="12.6" width="10" height="2.2" rx="1" fill="' + c + '"/><path d="M9.4 18.6C9.6 23 12.6 25.6 16 25.6C19.4 25.6 22.4 23 22.6 18.6" fill="none" stroke="' + c + '" stroke-width="2.3"/><path d="M7.4 19.6L9.4 16.4L11.4 19.6ZM20.6 19.6L22.6 16.4L24.6 19.6Z" fill="' + c + '"/>'; },
  // 창병 프레이: 엇갈린 두 창
  pike: function (c, f) { var sp = '<rect x="15" y="9" width="2" height="16.5" fill="' + c + '"/><path d="M16 3.6L19 9.4L16 11.6L13 9.4Z" fill="' + c + '"/>'; return '<g transform="rotate(38 16 16.5)">' + sp + '</g><g transform="rotate(-38 16 16.5)">' + sp + '</g>'; },
  // 궁병 퀸: 활과 화살
  arc: function (c, f) { return '<path d="M11.2 7C20.8 9.6 20.8 22.6 11.2 25.2" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/><path d="M11.2 7.4V24.8" stroke="' + c + '" stroke-width="1"/><path d="M8 16.1H21.5" stroke="' + c + '" stroke-width="1.8"/><path d="M25 16.1L20.6 13.4V18.8Z" fill="' + c + '"/><path d="M7.4 13.8L10.2 16.1L7.4 18.4Z" fill="' + c + '"/>'; },
  // 승려 센주: 해
  cle: function (c, f) { var r = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4, x1 = 16 + Math.cos(a) * 6.8, y1 = 16.5 + Math.sin(a) * 6.8, x2 = 16 + Math.cos(a) * 9.6, y2 = 16.5 + Math.sin(a) * 9.6; r += 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1); } return '<path d="' + r + '" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/><circle cx="16" cy="16.5" r="4.6" fill="' + c + '"/>'; },
  // 무도가 카마도: 불꽃
  mon: function (c, f) { return '<path d="M16 5.6C17.2 10 22.6 12.2 22.6 18.6C22.6 22.8 19.6 26 16 26C12.4 26 9.4 22.8 9.4 18.6C9.4 15.4 11.4 13.2 12.8 11C13 14 13.8 15.4 15 15.6C14.8 12.4 15 9 16 5.6Z" fill="' + c + '"/><path d="M16 16.4C17.2 18.4 19.2 19.4 19.2 21.6C19.2 23.4 17.8 24.6 16 24.6C14.2 24.6 12.8 23.4 12.8 21.6C12.8 19.4 14.8 18.4 16 16.4Z" fill="' + f + '"/>'; },
  // 법사 그레인저: 여덟 갈래 별
  mag: function (c, f) { return '<path d="M16 6L18 14.5L25.5 16.5L18 18.5L16 27L14 18.5L6.5 16.5L14 14.5Z" fill="' + c + '"/><path d="M11 11.5L14.6 15.1M21 11.5L17.4 15.1M11 21.5L14.6 17.9M21 21.5L17.4 17.9" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="16.5" r="1.4" fill="' + f + '"/>'; },
  // 주술사 아담스: 초승달과 눈
  sha: function (c, f) { return '<path d="M18.6 6.6A10 10 0 1 0 18.6 26.4A8 8 0 1 1 18.6 6.6Z" fill="' + c + '"/><path d="M15.4 16.5Q19.6 12.4 23.8 16.5Q19.6 20.6 15.4 16.5Z" fill="' + c + '"/><circle cx="19.6" cy="16.5" r="1.5" fill="' + f + '"/>'; },
  // 타르가르옌(보병·기병·비병 합일): 날개 달린 검
  bm: function (c, f) { return '<path d="M16 5L18 8.4V20H14V8.4Z" fill="' + c + '"/><rect x="10" y="20" width="12" height="2.4" rx="1" fill="' + c + '"/><rect x="15" y="22.4" width="2" height="3.6" fill="' + c + '"/><circle cx="16" cy="27" r="1.6" fill="' + c + '"/><path d="M13.4 12.6C11 12 8.6 10.2 7.6 7.6C9.6 8.6 11.6 9 13.4 9ZM18.6 12.6C21 12 23.4 10.2 24.4 7.6C22.4 8.6 20.4 9 18.6 9Z" fill="' + c + '"/>'; },
  // 아트레이데스(수군·창병·궁병 합일): 번개
  tm: function (c, f) { return '<path d="M19 5L10.4 17.6H15.4L12.8 27.6L22.2 13.6H17.2L20.6 5Z" fill="' + c + '"/>'; },
  // 죠스타(승려·무도가·법사·주술사 합일): 다섯 갈래 별
  mm: function (c, f) { var p = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.2 : 10; p.push((16 + Math.cos(a) * r).toFixed(1) + ' ' + (17 + Math.sin(a) * r).toFixed(1)); } return '<path d="M' + p.join('L') + 'Z" fill="' + c + '"/>'; }
};
var CROWN = '<path d="M9.5 6.6L8.6 0.8L12.4 3.6L16 0L19.6 3.6L23.4 0.8L22.5 6.6Z" fill="' + GOLD + '" stroke="' + EDGE + '" stroke-width="1" stroke-linejoin="round"/>';
var cache = {};
DS.HOUSE_CREST_COL = COL;
DS.houseCrest = function (cls, size, opt) {
  opt = opt || {};
  var C = COL[cls] ? cls : 'inf', k = C + (opt.lord ? 'L' : '') + '|' + (size || 24) + '|' + (opt.title || '') + '|' + (opt.cls || '');
  if (cache[k]) return cache[k];
  var col = COL[C], f = col[0], c = col[1], rim = col[2], fused = !!(DS.CLASSES && DS.CLASSES[C] && DS.CLASSES[C].master), sz = size || 24;
  var sh = fused ? ROUND : SHIELD, g = '';
  g += '<path d="' + sh + '" fill="' + f + '" stroke="' + EDGE + '" stroke-width="3" stroke-linejoin="round"/>';
  g += '<path d="' + sh + '" fill="none" stroke="' + (fused ? GOLD : rim) + '" stroke-width="1.5" stroke-linejoin="round"/>';
  if (fused) g += '<path d="' + sh + '" fill="none" stroke="' + rim + '" stroke-width="1" stroke-linejoin="round" transform="translate(16 16.6) scale(.82) translate(-16 -16.6)"/>';
  g += '<path d="M16 6.4V29C10.6 26.2 6.4 21.8 6.4 15.5V6.4Z" fill="#fff" opacity=".07"/>';      // 왼쪽 반에 옅은 빛 (64px 에서 입체감)
  g += ART[C](c, f);
  if (opt.lord) g += CROWN;
  var t = opt.title ? '<title>' + String(opt.title).replace(/[&<>]/g, '') + '</title>' : '';
  var out = '<svg class="crest' + (opt.lord ? ' lord' : '') + (opt.cls ? ' ' + opt.cls : '') + '" viewBox="' + (opt.lord ? '-0.25 -0.5 32.5 32.5' : '0.75 1.5 30.5 30.5') + '" width="' + sz + '" height="' + sz + '"' + (t ? ' role="img"' : ' aria-hidden="true"') + ' focusable="false">' + t + g + '</svg>';
  cache[k] = out; return out;
};
DS.houseCrestOf = function (s, ch, size, opt) {
  if (!ch) return '';
  s = s || (DS.G && DS.G.save);
  var o = {}; for (var k in (opt || {})) o[k] = opt[k];
  var cls = ch.cls;
  if (s && ch.id === s.hero) { o.lord = 1; var L = s.lin; if (L && L.hns && L.hns.length && COL[L.hs]) cls = L.hs; }      // r22: 문패가 옮겨 갔으면 맹주 가문의 문장도 그 집 것 (lin.hs) — 금관은 그대로
  return DS.houseCrest(cls, size, o);
};
})();
