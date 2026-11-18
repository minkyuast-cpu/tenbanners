// 열 개의 깃발 — r14 새 그림: 코드로 그리는 카툰 (벡터 경로 → 캔버스에 한 번 굽고 캐시)
// DS.ART = 'new'(새 그림) | 'toon'(r13 자동 카툰) | 'pixel'(r11 픽셀). DS.setArt(mode) 로 바꾼다(그림 캐시를 비운다).
// 톤: 「진중한 판타지 카툰」 — 2.5등신·매끈한 색 있는 윤곽선·셀 셰이딩(밝음/그늘 두 단 + 하이라이트)은 살리고,
//      색은 채도를 눌러(먹빛 그늘·바랜 금속·천과 가죽) 원색·형광을 피한다. 눈은 또렷하되 반짝임은 한 점.
// 파츠 체계: 사람 = 다리 · 몸통(갑옷/튜닉/로브/뼈) · 뒷팔(방패) · 머리(머리카락·얼굴·머리쓰개) · 앞팔(무기) · 망토 · 날개
//   + 옷차림(장비 계열·재질 단·유니크 술·전설 고유 모습, 나이·성별·돌아온 이) + 자세(서기·걷기 1·2·공격·피격·시전)
//   탈것(말·새·천마·용)·괴물은 같은 칠 함수(part)와 같은 윤곽·테 빛 손질로 그린다.
// 그림 좌표: 논리 1px = 4 단위 (16px 몸 = 64 단위, 큰 몸 24px = 96 단위). 캔버스는 논리 1px = ART_X 화소 (기본 6 → 96·144px).
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
if (!DS.ART) DS.ART = 'new';
var AX = 6; DS.ART_X = AX;
var stat = { n: 0, px: 0, ms: 0 };
DS.artStat = function () { return { canvases: stat.n, bytes: stat.px * 4, ms: Math.round(stat.ms) }; };
DS.setArt = function (m) { DS.ART = m; DS.TOON = m !== 'pixel'; if (DS.spriteFlush) DS.spriteFlush(); };

// ───────── 색 ─────────
var cC = {};
function rgb(h) {
  if (typeof h !== 'string') return h;
  var c = cC[h]; if (c) return c;
  var s = h.charAt(0) === '#' ? h.slice(1) : h; if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  var v = parseInt(s, 16); return (cC[h] = [(v >> 16) & 255, (v >> 8) & 255, v & 255]);
}
function mix(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
function css(c, a) { var r = Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]); return a == null || a >= 1 ? 'rgb(' + r + ')' : 'rgba(' + r + ',' + a + ')'; }
function lum(c) { return c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; }
var muteC = {};
function mute(h) {      // 진중한 톤: 채도 25% 덜고 살짝 따뜻하게, 아주 밝은 색은 양피지 쪽으로
  var key = typeof h === 'string' ? h : h.join(','); if (muteC[key]) return muteC[key];
  var c = rgb(h), l = lum(c), m = mix(c, [l, l, l], 0.25);
  m = mix(m, [m[0] + 8, m[1] + 3, m[2] - 8], 0.6);
  if (l > 205) m = mix(m, [232, 222, 198], 0.3);
  if (l < 40) m = mix(m, [42, 34, 46], 0.3);
  return (muteC[key] = [Math.max(0, Math.min(255, m[0])), Math.max(0, Math.min(255, m[1])), Math.max(0, Math.min(255, m[2]))]);
}
function shT(c) { return [c[0] * 0.34 + 14, c[1] * 0.32 + 12, c[2] * 0.44 + 32]; }      // 그늘은 먹빛 남보라 쪽으로
function sh1(c) { return mix(c, shT(c), 0.42); }
function sh2(c) { return mix(c, shT(c), 0.74); }
function lt(c, f) { return mix(c, [255, 244, 220], f == null ? 0.3 : f); }
function ink(c) { return mix(c, [24, 17, 28], 0.74); }      // 색 있는 어두운 선
var INK = [30, 22, 32];

// ───────── 경로 도우미 ─────────
function E(g, x, y, rx, ry, r) { g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r || 0, 0, 6.2832); }
function RR(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); }
function blob(g, p) {      // 점들을 지나는 매끈한 닫힌 곡선 (중점 사이를 2차 곡선으로)
  var n = p.length / 2, i, x0, y0, x1, y1;
  g.moveTo((p[0] + p[2]) / 2, (p[1] + p[3]) / 2);
  for (i = 1; i <= n; i++) { x0 = p[(i % n) * 2]; y0 = p[(i % n) * 2 + 1]; x1 = p[((i + 1) % n) * 2]; y1 = p[((i + 1) % n) * 2 + 1]; g.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2); }
  g.closePath();
}
function poly(g, p) { g.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); }
// 칠: 바탕 → 오른쪽 아래 그늘 초승달 두 단 → 왼쪽 위 하이라이트 초승달 → 색 있는 선. f(g) 는 경로만 만든다.
//   o.sd 그늘 폭, o.hl 하이라이트 폭, o.ln 선 굵기, o.gl 금속 광택, o.flat 명암 없음, o.lc 선 색
var LX = 0.5, LY = 0.86;
function part(g, f, col, o) {
  o = o || {}; var c = typeof col === 'string' ? mute(col) : col, sd = o.sd == null ? 2.4 : o.sd, hl = o.hl == null ? 0.9 : o.hl;
  g.save(); g.beginPath(); f(g); g.fillStyle = css(c); g.fill();
  if (!o.flat) {
    g.clip();
    g.beginPath(); f(g); g.save(); g.translate(-sd * LX, -sd * LY); f(g); g.restore(); g.fillStyle = css(sh1(c)); g.fill('evenodd');
    g.beginPath(); f(g); g.save(); g.translate(-sd * 0.42 * LX, -sd * 0.42 * LY); f(g); g.restore(); g.fillStyle = css(sh2(c)); g.fill('evenodd');
    if (hl > 0) { g.beginPath(); f(g); g.save(); g.translate(hl * LX, hl * LY); f(g); g.restore(); g.fillStyle = css(lt(c, o.gl ? 0.55 : 0.3), 0.9); g.fill('evenodd'); }
    if (o.gl) { g.fillStyle = css(lt(c, 0.7), 0.75); g.beginPath(); o.gl(g); g.fill(); }
  }
  g.restore();
  if (o.ln !== 0) { g.beginPath(); f(g); g.lineWidth = o.ln || 1.05; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = css(o.lc || ink(c)); g.stroke(); }
}
function line(g, pts, col, w, a) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.lineWidth = w || 0.8; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = typeof col === 'string' ? col : css(col, a); g.stroke(); }
function curve(g, x0, y0, cx, cy, x1, y1, col, w, a) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.lineWidth = w || 0.8; g.lineCap = 'round'; g.strokeStyle = typeof col === 'string' ? col : css(col, a); g.stroke(); }
function dot(g, x, y, r, col, a) { g.beginPath(); E(g, x, y, r, r); g.fillStyle = typeof col === 'string' ? col : css(col, a); g.fill(); }

// ───────── 굽기: 그림 층 → 색 있는 바깥 윤곽 + 테 빛 ─────────
function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function finish(L, lw, o) {
  o = o || {}; var W = L.width, out = mk(W), g = out.getContext('2d'), r = o.r || (o.olw || 1.45) * AX / 4;
  var T = mk(W), tg = T.getContext('2d'); tg.drawImage(L, 0, 0); tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = 'rgba(' + INK.join(',') + ',0.86)'; tg.fillRect(0, 0, W, W);
  for (var i = 0; i < 12; i++) { var a = i / 12 * 6.2832; g.drawImage(T, Math.cos(a) * r, Math.sin(a) * r); }
  g.drawImage(L, 0, 0);
  var rim = o.rim && RIMC[o.rim];
  if (rim) {      // 테 빛 (4~7단 은빛 · 8단↑ 금빛 · e 붉은 땅의 적): 왼쪽 위 가장자리에 빛 띠
    var R = mk(W), rg = R.getContext('2d'); rg.drawImage(L, 0, 0); rg.globalCompositeOperation = 'source-in'; rg.fillStyle = rim[0]; rg.fillRect(0, 0, W, W);
    rg.globalCompositeOperation = 'destination-out'; rg.drawImage(L, r * 0.8, r * 1.1);
    g.globalAlpha = rim[1]; g.drawImage(R, 0, 0); g.globalAlpha = 1;
  }
  return tag(out, lw);
}
var RIMC = { s: ['#d6e2f2', 0.75], g: ['#f0cf78', 0.85], e: ['#f4e2d6', 0.55] };
function tag(cv, lw) { cv.lw = lw; cv.toon = 1; cv.art = 1; stat.n++; stat.px += cv.width * cv.height; return cv; }
function layer(lw) { var c = mk(lw * AX), g = c.getContext('2d'); g.scale(AX / 4, AX / 4); return c; }
DS.artTools = { mk: mk, tag: tag, stat: stat, part: part, mute: mute, blob: blob, E: E, RR: RR, poly: poly, line: line, curve: curve, dot: dot, finish: finish, layer: layer, mix: mix, rgb: rgb, css: css, sh1: sh1, sh2: sh2, lt: lt, ink: ink };

// ───────── 재질 ─────────
var MAT = [null, ['#d9a56c', '#a8703e', '#6e4628'], ['#b4bac6', '#7f8798', '#525a6c'], ['#d6dce6', '#9ea8ba', '#646d84'], ['#eceff4', '#bcc4d2', '#848ca2'],
  ['#cfeef2', '#86c4cf', '#4d8a9c'], ['#f0dea0', '#d4ac52', '#9c7630'], ['#f0b08e', '#b9533e', '#73302c'], ['#f4f4f6', '#d4dae8', '#9aa4c8'], ['#d0e6f4', '#6fa6dc', '#3e68b0'], ['#f6ece0', '#f0b2a0', '#b46a86']];
var ACC = [null, '#b08a3e', '#b08a3e', '#b08a3e', '#cfd6e0', '#cfd6e0', '#d8b450', '#d8b450', '#d8b450', '#d8b450', '#ecd8a0'];
var WOOD = '#7a5434', LEATH = '#5e4232', BOOT = '#4a3428';
function gearOf(id) { try { return id && DS.gear ? DS.gear(id) : null; } catch (e) { return null; } }
var LEGW = {};      // 전설 무기 빛깔은 sprites2 의 표를 그대로 읽지 못하므로(지역 변수) 같은 값을 둔다
[['grok', 'club', '#f4ead8', '#c8a878', '#8a6a44', '#8a5a36', '#ffffff'], ['mire', 'flail', '#9ab8a8', '#5e7f72', '#34504a', '#7a8a6a', '#b6ff5a'], ['kardan', 'great', '#ffe08a', '#ff7a2a', '#a8301e', '#3a2a2a', '#ffd24a'],
 ['ignar', 'fang', '#fff4dc', '#e8c89a', '#8a5a3a', '#d9442b', '#ff9a3c'], ['heron', 'tassel', '#e2e9f2', '#a7b2c6', '#6b7590', '#c0303a', '#e0525e'], ['twin', 'twin', '#f0ffd8', '#b6d27a', '#5a7a3a', '#3a5a2a', '#b6ff5a'],
 ['volko', 'harpoon', '#d8e8f0', '#8fb0c0', '#4a6a80', '#2f86a6', '#f6cf57'], ['keeper', 'pick', '#d8d0c0', '#9a8e78', '#5e5444', '#7a5a36', '#7fe3ff'], ['dawn', 'banner', '#fff6ea', '#ffb7a6', '#c06a8a', '#f6cf57', '#ff9a7a'],
 ['shara', 'sting', '#ffd0a0', '#c8642a', '#7a2a1a', '#f6cf57', '#ff4d6d'], ['hagen', 'xbow', '#c8ccd6', '#6a7084', '#3a3e50', '#5e3a22', '#e0525e'], ['harpy', 'feather', '#ffffff', '#cfe6f6', '#8aa8c8', '#8a5a36', '#9fe8ec'],
 ['tormak', 'horn', '#f4ead8', '#c8b080', '#7a6040', '#6f4a2c', '#ff4d6d'], ['king', 'scepter', '#f8e8b0', '#d8b060', '#8a6a2a', '#9a8a60', '#7fe3ff'], ['morga', 'censer', '#c8d0a0', '#8a9a5a', '#4a5a2a', '#5a4a3a', '#b6ff5a'],
 ['pippin', 'twisty', '#ffe0f4', '#ff9de1', '#c0447e', '#7fcf6a', '#fff0a0'], ['orbel', 'armil', '#f0f4ff', '#a8b8e8', '#5a6aa8', '#c9a227', '#9fe8ec'], ['apostle', 'ember', '#ffe8b0', '#ff9a3c', '#a8301e', '#3a3350', '#ffd24a'],
 ['bargan', 'hot', '#ffb070', '#d9542a', '#7a2a1a', '#ffd24a', '#ffd24a'], ['warden', 'stone', '#c8c4b8', '#8e8a7e', '#5a564c', '#7a9a6a', '#b6ff5a'], ['gate', 'bar', '#9aa0b0', '#5e6474', '#353a48', '#c9a227', '#c9a227'],
 ['roen', 'crest', '#e2e9f2', '#a7b2c6', '#6b7590', '#3572b8', '#f6cf57'], ['wyrm', 'bone', '#f0e8d4', '#c0b49a', '#7e7460', '#5a5072', '#b6ff5a'], ['shewolf', 'fur', '#d0ccc4', '#9a948a', '#5e5a54', '#5e3a22', '#ffffff'],
 ['tomb', 'mane', '#e8d0a0', '#b8955e', '#7a5e34', '#5e8a5a', '#9fe8ec'], ['basil', 'scale', '#a8e070', '#5a9a3a', '#2f5a24', '#c9a227', '#ffd24a'], ['swarm', 'wings', '#c8f0d8', '#7ab89a', '#3a6a5a', '#5a4a3a', '#7fe3ff'],
 ['nuri', 'water', '#d8f6ff', '#7fd0ee', '#3a8ab8', '#ffffff', '#ffffff'], ['belmar', 'dusk', '#b8a0e0', '#6a4a9a', '#3a2a5a', '#ff4d6d', '#ff4d6d'], ['ilva', 'frost', '#f0fbff', '#a8dcf0', '#5a9ac0', '#ffffff', '#c9f1ff'],
 ['glacia', 'frost', '#e8f8ff', '#8fc8e8', '#4a7ab0', '#c9f1ff', '#ffffff'], ['ghost', 'shroud', '#e8e8f0', '#b0b0c4', '#6a6a84', '#9fb8c8', '#ffffff']].forEach(function (r) { LEGW[r[0]] = { sh: r[1], m: [r[2], r[3], r[4]], acc: r[5], gem: r[6] }; });
// 장비 → 그리기용 묘사 { cat, line, t, grade, sh(전설 모양), m(날 빛깔 셋), acc, gem }
function wDesc(id) {
  var W = gearOf(id); if (!W) return null;
  var lg = W.grade >= 5 ? LEGW[W.line] : null, t = Math.max(1, Math.min(10, W.mat || W.tier || 1));      // 2.1.0: 날 빛깔은 강화 단계(g.mat)
  return { cat: W.cat, line: W.line, t: t, grade: W.grade || 0, sh: lg ? lg.sh : null, m: lg ? lg.m : MAT[t], acc: lg ? lg.acc : ACC[t], gem: lg ? lg.gem : (W.grade === 4 ? '#b181e6' : '#62b0ee') };
}
DS.artWDesc = wDesc; DS.artLEG = LEGW;

DS.artMAT = MAT; DS.artACC = ACC;
DS.ARTP = { WOOD: WOOD, LEATH: LEATH, BOOT: BOOT, gearOf: gearOf, stat: stat, tagC: tag, mk: mk, sh1: sh1, sh2: sh2 };
})();
