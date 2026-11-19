// r26 art: 전민 HUD·도크·메뉴 아이콘 세트 — 인라인 SVG 문자열 (외부 그림 없음).
//   DS.icon(name, size, opt) → '<svg class="ic ic-name" …>'
//     size: px (기본 24). opt.cls: 덧붙일 클래스. opt.title: 읽기 글(있으면 role="img", 없으면 aria-hidden).
//   격자: 24×24 viewBox, 2px 획(stroke=currentColor), 둥근 끝. 16px 에서도 읽히게 굵은 면 위주.
//   강조색: class="a" 조각은 fill: var(--ic-a, currentColor). 부모에 --ic-a 를 주면 물약 액체·동전 면 등이 그 색이 된다.
//     예) .slot.herb { --ic-a: #7fcf6a }  .slot.mana { --ic-a: #5fa8e6 }  .cur { --ic-a: #e8c060 }
//   DS.ICONS: 이름 목록 (도감·시험용).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var A = ' class="a"';                       // 강조 면 (채움)
var AS = ' class="as"';                     // 강조 획
var F = ' fill="currentColor" stroke="none"';
var SHIELD = 'M12 2.8l7.5 2.7v6c0 5-3.3 8.4-7.5 9.7-4.2-1.3-7.5-4.7-7.5-9.7v-6z';
var BOTTLE = 'M10 3.5h4M10.6 3.5v4.2L6.4 13a5.6 5.6 0 0 0 4.6 8h2a5.6 5.6 0 0 0 4.6-8l-4.2-5.3V3.5';
var LIQ = '<path' + A + ' stroke="none" d="M7.1 14.2h9.8a4.9 4.9 0 0 1-4.4 5.6h-1A4.9 4.9 0 0 1 7.1 14.2z"/>';
var ARROWS = '<path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1"/><path d="M18 3.6v3.6h-3.6M6 20.4v-3.6h3.6"/>';
var P = {
  // ── 시스템 ──
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/><path' + A + ' stroke="none" d="M2 6.5l1.5-1.5L5 6.5 3.5 8zM2 12l1.5-1.5L5 12l-1.5 1.5zM2 17.5L3.5 16 5 17.5 3.5 19z"/>',
  map: '<path d="M3 6.2l6-2.2 6 2.2 6-2.2v13.8l-6 2.2-6-2.2-6 2.2z"/><path d="M9 4v13.8M15 6.2V20"/><path' + AS + ' d="M16.6 9.4l2.4 2.4M19 9.4l-2.4 2.4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M4.5 12.5l4.5 4.5L19.5 6.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.4a2.7 2.7 0 1 1 3.8 2.5c-.7.3-1.2 1-1.2 1.8v.5"/><circle cx="12" cy="17.3" r="1.2"' + F + '/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><circle cx="12" cy="12" r="6.3"/>',
  online: '<circle' + A + ' cx="12" cy="12" r="2.6" stroke="none"/><path d="M8.1 8.1a5.5 5.5 0 0 0 0 7.8M15.9 8.1a5.5 5.5 0 0 1 0 7.8M5.2 5.2a9.6 9.6 0 0 0 0 13.6M18.8 5.2a9.6 9.6 0 0 1 0 13.6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path' + A + ' stroke="none" d="M12 13.4a1.6 1.6 0 0 1 .8 3v1.8h-1.6v-1.8a1.6 1.6 0 0 1 .8-3z"/>',
  star: '<path' + A + ' d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2-4.6-4.4 6.3-.9z"/>',
  heart: '<path' + A + ' d="M12 20.2s-8-4.6-8-10.4A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8 2.4c0 5.8-8 10.4-8 10.4z"/>',
  drop: '<path' + A + ' d="M12 3s6.3 6.6 6.3 11.2a6.3 6.3 0 0 1-12.6 0C5.7 9.6 12 3 12 3z"/>',
  tick: '<path d="M6.5 3h11M6.5 21h11"/><path d="M8 3v2.4c0 1.3.6 2.4 1.6 3.2L12 12l2.4-3.4c1-.8 1.6-1.9 1.6-3.2V3M8 21v-2.4c0-1.3.6-2.4 1.6-3.2L12 12l2.4 3.4c1 .8 1.6 1.9 1.6 3.2V21"/><path' + A + ' stroke="none" d="M9.4 19.6c.4-1.7 1.4-2.7 2.6-3.6 1.2.9 2.2 1.9 2.6 3.6z"/>',
  crown: '<path' + A + ' d="M3.5 8.5l4.3 3.8L12 5l4.2 7.3 4.3-3.8-1.8 10H5.3z"/><path d="M5.6 21h12.8"/>',
  skull: '<path d="M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.4 3 5.5V19.5h9V16c1.7-1.1 3-2.9 3-5.5A7.5 7.5 0 0 0 12 3z"/><circle cx="9" cy="11" r="1.7"' + F + '/><circle cx="15" cy="11" r="1.7"' + F + '/><path d="M10.5 19.5v-2M13.5 19.5v-2"/>',
  // ── 재화 ──
  coin: '<circle' + A + ' cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6.2" stroke-width="1.4"/><rect x="9.8" y="9.8" width="4.4" height="4.4" rx=".4" stroke-width="1.8"/>',
  ticket: '<path' + A + ' d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M15 7.5v1.6M15 11.2v1.6M15 14.9v1.6" stroke-width="1.6"/><path d="M7 10.5h4.5M7 13.5h3" stroke-width="1.6"/>',
  // ── 소모품 ──
  herb: '<path' + A + ' d="M5 19.5C5 10.8 10.6 5 20 4c0 9.4-5.6 15.5-15 15.5z"/><path d="M5 19.5l9.5-9.5M9.6 15v-3.4M12.4 12.2h3.2"/>',
  mana: '<path d="' + BOTTLE + '"/>' + LIQ + '<path d="M9.8 16.8l1.2-1.2" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/>',
  stamina: '<path d="' + BOTTLE + '"/>' + LIQ + '<path d="M12.8 9.8l-2.4 4h2.6l-1.6 3.8" stroke-width="1.6"/>',
  potion: '<path d="' + BOTTLE + '"/>' + LIQ,
  // ── 지휘 토글 ──
  auto: ARROWS + '<path' + A + ' stroke="none" d="M10 8.8l5.4 3.2-5.4 3.2z"/>',
  auto_off: ARROWS + '<path d="M10.2 9.2v5.6"/><path d="M3.5 3.5l17 17" stroke-width="2.4"/>',
  manual: '<path d="M9 12V5.5a1.5 1.5 0 0 1 3 0V11M12 10.5V4.5a1.5 1.5 0 0 1 3 0v6M15 10.8V6.5a1.5 1.5 0 0 1 3 0v7.3a7 7 0 0 1-7 7h-.4a6 6 0 0 1-4.8-2.4L3.6 15.5a1.6 1.6 0 0 1 2.3-2.1L9 15.5"/>',
  atk: '<path d="M4 4l11 11M20 4L9 15"/><path d="M12.5 17.5l5-5M6.5 12.5l5 5"/><path' + AS + ' d="M16.6 16.6l3 3M7.4 16.6l-3 3"/>',
  def: '<path d="' + SHIELD + '"/><path' + A + ' stroke="none" d="M12 5.4l5 1.8v4.3c0 3.5-2.2 6-5 7.1z"/>',
  hunt: '<path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1"/><path d="M18 3.6v3.6h-3.6M6 20.4v-3.6h3.6"/><path' + AS + ' d="M14.6 8.6l-5 5M9 12.3l2.7 2.7M10.4 14.4l-1.6 1.6"/>',
  spd1: '<path' + A + ' stroke="none" d="M8 5.5l9 6.5-9 6.5z"/>',
  spd2: '<path' + A + ' stroke="none" d="M3.5 6l8 6-8 6zM12.5 6l8 6-8 6z"/>',
  spd3: '<path' + A + ' stroke="none" d="M1.5 7l6.5 5-6.5 5zM8.75 7l6.5 5-6.5 5zM16 7l6.5 5L16 17z"/>',
  pause: '<rect' + A + ' x="6" y="5" width="4" height="14" rx="1" stroke="none"/><rect' + A + ' x="14" y="5" width="4" height="14" rx="1" stroke="none"/>',
  play: '<path' + A + ' d="M7.5 4.8l11.5 7.2-11.5 7.2z"/>',
  retreat: '<path d="M9.5 14.5L4.5 9.5l5-5"/><path d="M4.5 9.5H15a5.5 5.5 0 0 1 0 11h-3.5"/>',
  // ── 메뉴 ──
  party: '<path d="M6 21.5V2.5"/><path' + A + ' d="M6 3.5h12.5l-3.2 4.2 3.2 4.3H6"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.8 14.3A5 5 0 0 1 21.5 19"/>',
  bag: '<path d="M9 4.5h6l-1.6 3.2c4 1 6.6 4.6 6.6 8.2 0 3-2 5.1-5 5.1H9c-3 0-5-2.1-5-5.1 0-3.6 2.6-7.2 6.6-8.2z"/><path' + AS + ' d="M9.6 7.7h4.8"/><path' + A + ' stroke="none" d="M12 12.2l1.6 1.6-1.6 1.6-1.6-1.6z"/>',
  scroll: '<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7"/><path d="M6 4a2 2 0 0 0-2 2v1.5h4V6a2 2 0 0 0-2-2zM7 20a2 2 0 0 1-2-2v-1.5h4V18a2 2 0 0 1-2 2z"/><path d="M11 9h5M11 12.5h5M11 16h3"/>',
  house: '<path d="' + SHIELD + '"/><path d="M8 9.5l4 3 4-3"/><path' + A + ' stroke="none" d="M12 13.8l1.1 2.1 2.2.3-1.6 1.5.4 2.2-2.1-1.1-2.1 1.1.4-2.2-1.6-1.5 2.2-.3z"/>',
  church: '<path d="M12 2v5M9.8 4h4.4"/><path d="M4.5 21V11l7.5-4 7.5 4v10z"/><path' + A + ' d="M10 21v-3.8a2 2 0 0 1 4 0V21"/><path d="M3 21h18"/>',
  // ── 상점 ──
  shop_weapon: '<path d="M20 4l-9.8 9.8"/><path' + A + ' d="M20 4h-3.4L8.4 12.2l3.4 3.4L20 7.4z" stroke-width="1.4"/><path d="M6.8 11.6l5.6 5.6M9.4 14.6L5 19"/><circle cx="4.4" cy="19.6" r="1.3"' + F + '/>',
  shop_armor: '<path' + A + ' d="M8 3L4 5v6l2 1v8.5h12V12l2-1V5l-4-2c-.5 1.8-2 3-4 3s-3.5-1.2-4-3z"/><path d="M12 9v11.5M8.5 14h7"/>',
  shop_item: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 9.5A3.5 3.5 0 0 1 7 5.5h10a3.5 3.5 0 0 1 3.5 4"/><path d="M3.5 13h17"/><rect' + A + ' x="10.3" y="11.3" width="3.4" height="4.4" rx=".8" stroke-width="1.4"/>',
  shop_merc: '<path d="M5 19v-6.5a7 7 0 0 1 14 0V19h-5v-4.5h-4V19z"/><path d="M5 12.5h14"/><path' + A + ' d="M12 5.5V3c2.5 0 4.5 1 5.5 2.5" stroke-width="1.8"/>',
  // ── 기술 종류 ──
  sk_attack: '<path d="M4 20l11-11"/><path d="M13.5 7.5l3-3 3 3-3 3"/><path d="M5 15.5L8.5 19M3 19.5l1.5 1.5"/><path' + AS + ' d="M10.5 3.5c4.5-.5 9 2.6 10 7.5M14.5 2.5c2.6.6 4.6 2.2 5.6 4"/>',
  sk_heal: '<path' + A + ' d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z"/>',
  sk_fist: '<rect' + A + ' x="6.6" y="7" width="3.3" height="6" rx="1.6"/><rect' + A + ' x="10" y="6.5" width="3.3" height="6.5" rx="1.6"/><rect' + A + ' x="13.4" y="7" width="3.3" height="6" rx="1.6"/><rect' + A + ' x="16.8" y="8" width="3" height="5" rx="1.5"/><path d="M6.6 13h13.2v2.4a5.6 5.6 0 0 1-5.6 5.6h-2.8a4.8 4.8 0 0 1-4.8-4.8z"/><path d="M6.8 15.5h5.6"/><path' + AS + ' d="M2.5 10h2.2M2 13.5h2.8M2.5 17h2.2"/>',      // 2.2.5 무투가: 쥔 주먹(손가락 넷 · 엄지) · 기세 선
  // ── 2.2.6 병과마다 기술 그림 (기술 표의 ic — 없으면 위의 종류 그림) ──
  sk_shieldbash: '<path' + A + ' d="M10 3l6 2.2v5c0 4-2.7 6.8-6 7.8-3.3-1-6-3.8-6-7.8v-5z"/><path d="M10 6.5v8"/><path' + AS + ' d="M18.5 7.5l3-1.5M19 11.5h3M18.5 15.5l3 1.5"/>',
  sk_bulwark: '<path' + A + ' d="' + SHIELD + '"/><path d="M12 5.5v13M7.5 10h9"/>',
  sk_cover: '<circle cx="6.5" cy="7" r="2.6"/><path d="M2.5 20a4.5 4.5 0 0 1 8.5-2"/><path' + A + ' d="M16.5 6.5l5 1.8v4c0 3.4-2.2 5.8-5 6.7-2.8-.9-5-3.3-5-6.7v-4z"/>',
  sk_charge: '<path d="M2.5 12h14"/><path' + A + ' d="M16 8.5l6 3.5-6 3.5z"/><path' + AS + ' d="M3 7h5M3 17h6M6 4.5h3"/>',
  sk_hoof: '<path d="M6.5 4v6.5a5.5 5.5 0 0 0 11 0V4"/><path' + A + ' d="M4 3.5h5v2.5H4zM15 3.5h5v2.5h-5z" stroke-width="1.4"/><path' + AS + ' d="M3 21h18M6 18.5l-1.5 2.5M18 18.5l1.5 2.5"/>',
  sk_hunt: '<path d="M3.5 20.5l12-12"/><path' + A + ' d="M13.5 4.5h6v6z"/><path' + AS + ' d="M3 11l3 3M7 6.5l3 3"/>',
  sk_dive: '<path' + A + ' d="M2.5 5.5c4.5 0 7.5 2 9.5 5.5-3.2-1.2-6.4-1.2-9.5.8z"/><path d="M16 2.5v15"/><path' + AS + ' d="M12 14l4 5 4-5"/>',
  sk_gust: '<path d="M3 8.5h11a3 3 0 1 0-3-3"/><path' + AS + ' d="M3 13h15a3 3 0 1 1-3 3"/><path d="M3 17.5h6"/>',
  sk_hook: '<path d="M4.5 19.5l11-11"/><path' + A + ' d="M13 5l6-1-1 6z"/><path d="M14 9l-2.6-.4M10.6 12.4l-.4-2.6"/><path' + AS + ' d="M4.5 19.5c-2.2-2.6.4-5.2 3-4.2"/>',
  sk_wave: '<path d="M2 15.5c3 0 3-4 6.5-4s3.5 4 6.5 4 3-4 6.5-4"/><path' + AS + ' d="M2 20c3 0 3-3 6.5-3s3.5 3 6.5 3 3-3 6.5-3"/><path' + A + ' d="M5.5 10.5c.6-4.5 6.5-6.5 9.5-3.5-2.5-.3-4.5 1-5.5 3.5z" stroke-width="1.4"/>',
  sk_pin: '<path d="M12 2.5v14"/><path' + A + ' d="M9 6.5l3-4 3 4z"/><path d="M4 20.5h16"/><path' + AS + ' d="M7.5 17.5a4.5 2.4 0 0 0 9 0"/>',
  sk_skewer: '<path d="M2 12h17"/><path' + A + ' d="M17 8.5l5 3.5-5 3.5z"/><circle' + AS + ' cx="6.5" cy="12" r="2.6"/><circle' + AS + ' cx="12.5" cy="12" r="2.6"/>',
  sk_brace: '<path d="M4.5 20.5L17 8M19.5 20.5L7 8"/><path' + A + ' d="M15.5 6.5l5-3.5-2 5.5zM8.5 6.5l-5-3.5 2 5.5z"/><path' + AS + ' d="M3 21.5h18"/>',
  sk_mark: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/><circle' + A + ' cx="12" cy="12" r="2.4" stroke="none"/>',
  sk_retreat: '<path d="M9 12h12.5M18.5 9l3 3-3 3"/><path' + AS + ' d="M6.5 7l-4 5 4 5M10.5 8.5l-3 3.5 3 3.5"/>',
  sk_lamp: '<path d="M4 15h13l-2 4H7.5z"/><path d="M17 15c2.5 0 3.5-1.4 3.5-3"/><path' + A + ' d="M10.5 3.5c2.2 2.6 3.2 4.6 1.6 7.2-1 1.5-3 1.5-4-.2-1-2 1-3.6 2.4-7z" stroke-width="1.4"/>',
  sk_ward: '<path d="' + SHIELD + '"/><path' + A + ' d="M12 7c2 2.4 3 4 1.8 6.2-.8 1.4-2.8 1.4-3.6 0C9 11 10.2 9.6 12 7z" stroke-width="1.3"/>',
  sk_haste: '<path' + A + ' d="M8.5 4.5v9l-3.5 4h11c2 0 3-1 3-2.8l-5-1.2V4.5z" stroke-width="1.6"/><path' + AS + ' d="M8.5 8C5.5 7 3 7.5 2 9M8.5 11c-3 0-4.8.6-6 2"/>',
  sk_sanct: '<path d="M3 19.5h18"/><path' + A + ' d="M5 19.5a7 7 0 0 1 14 0z"/><path' + AS + ' d="M12 5.5V2.5M6.5 7.5L4.8 5.8M17.5 7.5l1.7-1.7"/>',
  sk_flame: '<path' + A + ' d="M12 2.5c3 4 6.5 6.2 6.5 10.5a6.5 6.5 0 0 1-13 0c0-2.6 1.5-4.4 3.2-5.4 0 2 1 3.2 2.1 3.2 0-3.2-1-5.4 1.2-8.3z"/><path' + AS + ' d="M12 14c1.4 1.2 1.8 2.6.2 4.2"/>',
  sk_frost: '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6"/><path' + AS + ' d="M9.5 4l2.5 2 2.5-2M9.5 20l2.5-2 2.5 2"/>',
  sk_bolt: '<path' + A + ' d="M13.5 2L5 13.5h6l-2 8.5 9.5-12.5h-6l2-7.5z"/><path' + AS + ' d="M19 15.5l2.5 1.5M2.5 6l2.5 1"/>',
  sk_meteor: '<circle' + A + ' cx="15.5" cy="15.5" r="5"/><path' + AS + ' d="M3 3l8 8M8 2.5l5.5 5.5M2.5 8l5.5 5.5"/>',
  sk_drain: '<path' + A + ' d="M12 3c3 4.5 6.5 7.5 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.5 9 7.5 12 3z"/><path' + AS + ' d="M9 14.5a3 3 0 1 0 3-3M12 9.5l.5 2-2 .5"/>',
  sk_skull: '<path d="M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.4 3 5.5V19.5h9V16c1.7-1.1 3-2.9 3-5.5A7.5 7.5 0 0 0 12 3z"/><circle' + A + ' cx="9" cy="11" r="1.8" stroke="none"/><circle' + A + ' cx="15" cy="11" r="1.8" stroke="none"/><path d="M10.5 19.5v-2M13.5 19.5v-2"/>',
  sk_hex: '<path d="M2 12c3-5 6.5-7 10-7s7 2 10 7c-3 5-6.5 7-10 7s-7-2-10-7z"/><circle' + A + ' cx="12" cy="12" r="3"/><path' + AS + ' d="M12 1.5v2M12 20.5v2M4 4.5l1.5 1.5M20 4.5L18.5 6"/>',
  sk_plague: '<path' + A + ' d="M6.5 15.5a4 4 0 0 1 .4-8 5.2 5.2 0 0 1 10 .8 3.6 3.6 0 0 1 .6 7.2z"/><circle' + AS + ' cx="8" cy="19.5" r="1.4"/><circle' + AS + ' cx="13" cy="20.5" r="1"/><circle' + AS + ' cx="17" cy="19" r="1.2"/>',
  sk_volley: '<path d="M6 3v12M12 3v14M18 3v12"/><path' + AS + ' d="M4 12.5l2 3 2-3M10 14.5l2 3 2-3M16 12.5l2 3 2-3"/><path d="M3 21h18" stroke-width="1.4"/>',
  sk_star: '<path' + A + ' d="M12 2.5l2.8 6 6.5.6-4.9 4.3 1.5 6.4L12 16.5l-5.9 3.3 1.5-6.4-4.9-4.3 6.5-.6z"/>',
  sk_sun: '<circle' + A + ' cx="12" cy="12" r="4.2"/><path' + AS + ' d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  sk_horn: '<path' + A + ' d="M3 9.5l4-.5 9-5v16l-9-5-4-.5z"/><path' + AS + ' d="M19 8.5c1.4 1 2 2.2 2 3.5s-.6 2.5-2 3.5"/>',
  sk_buff: '<path d="M6 12.5l6-6 6 6"/><path' + AS + ' d="M6 18.5l6-6 6 6"/>',
  sk_guard: '<path d="' + SHIELD + '"/><path' + AS + ' d="M8.5 11.8l2.5 2.5 4.6-4.6"/>',
  sk_magic: '<path' + A + ' d="M11 3l1.9 6.6L19.5 11.5l-6.6 1.9L11 20l-1.9-6.6-6.6-1.9 6.6-1.9z"/><path' + A + ' d="M18.5 2.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" stroke-width="1.2"/>',
  sk_ranged: '<path d="M7 3a14 14 0 0 1 0 18"/><path d="M7 3v18" stroke-width="1.2"/><path' + AS + ' d="M3 12h17M17 9l3 3-3 3"/>',
  // ── 능력치 ──
  st_atk: '<path d="M18 3.5h2.5V6L10 16.5 7.5 14z"/><path d="M6 12.5l5.5 5.5M8 16l-4 4"/>',
  st_def: '<path d="' + SHIELD + '"/>'
};
var cache = {};
DS.ICONS = Object.keys(P);
DS.icon = function (name, size, opt) {
  opt = opt || {};
  var n = P[name] ? name : 'house', sz = size || 24, k = n + '|' + sz + '|' + (opt.cls || '') + '|' + (opt.title || '');
  if (cache[k]) return cache[k];
  var t = opt.title ? '<title>' + String(opt.title).replace(/[&<>]/g, '') + '</title>' : '';
  return (cache[k] = '<svg class="ic ic-' + n + (opt.cls ? ' ' + opt.cls : '') + '" viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (t ? ' role="img"' : ' aria-hidden="true"') + '>' + t + P[n] + '</svg>');
};
// 강조 조각의 색 규칙 — 한 번만 문서에 넣는다 (게임에서는 style.css 로 옮긴다)
DS.ICON_CSS = '.ic{flex:none;display:block}.ic .a{fill:var(--ic-a,currentColor)}.ic .as{stroke:var(--ic-a,currentColor)}';
if (typeof module !== 'undefined') module.exports = DS;
})();
