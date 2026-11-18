// 열 개의 깃발 — 소리 (WebAudio 신시사이저, 외부 음원 없음)
var DS = globalThis.DS = globalThis.DS || {};
(function () {
'use strict';
var ctx = null, master = null, sfxG = null, bgmG = null, noiseBuf = null;
var opt = { sfx: true, bgm: true };
var seq = { name: null, timer: null, step: 0, next: 0, g: null };

var VOL = 1;      // 효과음마다의 음량 보정 (LVL) — sfx() 가 부르는 동안만 1이 아니다
var T0 = 0;      // 오프라인 점검(probe)에서 여러 소리를 시간 차로 겹칠 때만 쓰는 밀림
function graph(c, noComp) {      // 소리 길: 효과음·배경음 → 마스터 → 압축기 → 출력 (실제 재생과 점검이 같은 길을 쓴다)
  master = c.createGain(); master.gain.value = 0.9;
  var out = master;
  try { var sh = c.createBiquadFilter(); sh.type = 'highshelf'; sh.frequency.value = 4500; sh.gain.value = -4; master.connect(sh); out = sh; } catch (e1) { out = master; }      // 사각파의 쨍한 윗소리를 조금 눅인다 (폰 스피커에서 찌르지 않게)
  try {
    if (noComp) throw 0;
    var comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.18;      // 3배속 난전에서 소리가 겹쳐도 찢어지지 않게
    var lim = c.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.06;      // 마지막 울타리: 0dB 를 넘지 않게
    out.connect(comp); comp.connect(lim); lim.connect(c.destination);
  } catch (e2) { out.connect(c.destination); }
  sfxG = c.createGain(); sfxG.gain.value = opt.sfx ? 1 : 0; sfxG.connect(master);
  bgmG = c.createGain(); bgmG.gain.value = opt.bgm ? 1 : 0; bgmG.connect(master);
  noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
  var d = noiseBuf.getChannelData(0), r = 12345;
  for (var i = 0; i < d.length; i++) { r = (r * 1103515245 + 12345) & 0x7fffffff; d[i] = r / 0x3fffffff - 1; }      // 늘 같은 잡음 (점검 수치가 매번 같게)
}
function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try { ctx = new AC(); graph(ctx); } catch (e) { ctx = null; return false; }
  return true;
}
function tone(f0, f1, dur, type, vol, when, dest) {
  if (!ctx) return;
  var t = ctx.currentTime + T0 + (when || 0), o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  if (!dest) vol *= VOL;
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || sfxG);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, freq, q, when, type) {
  if (!ctx) return;
  var t = ctx.currentTime + T0 + (when || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; s.loop = true;
  f.type = type || 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || 0.8;
  g.gain.setValueAtTime(vol * VOL, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxG);
  s.start(t); s.stop(t + dur + 0.02);
}
// r26: 같은 소리가 기계처럼 들리지 않게 음높이를 조금씩 돌린다 (난수 대신 차례 — probe 점검이 매번 같게)
var VAR = [1, 1.03, 0.97, 1.015, 0.985], vi = 0;
function vr() { vi = (vi + 1) % VAR.length; return VAR[vi]; }
var SFX = {
  tap:    function () { tone(700, 700, 0.04, 'square', 0.035); },
  // ── r26 화면 소리: 누름·창·탭·거절·준비·동전·카드·띠·심장 ──
  press:    function () { var k = vr(); tone(1250 * k, 950 * k, 0.03, 'triangle', 0.04); noise(0.015, 0.06, 5200, 1.2); },
  open:     function () { tone(300, 640, 0.11, 'sine', 0.035); noise(0.1, 0.05, 1600, 0.7); noise(0.06, 0.04, 2600, 0.9, 0.04); },
  close:    function () { tone(620, 300, 0.09, 'sine', 0.03); noise(0.07, 0.04, 1400, 0.7); },
  tab:      function () { tone(880, 990, 0.035, 'square', 0.028); },
  deny:     function () { tone(180, 130, 0.1, 'square', 0.06); noise(0.05, 0.12, 320, 0.8); },
  ready:    function () { tone(1319, 1319, 0.06, 'sine', 0.04); tone(1976, 1976, 0.11, 'sine', 0.035, 0.05); },
  coinTick: function () { var k = vr(); tone(1568 * k, 1568 * k, 0.025, 'square', 0.02); },
  coinLand: function () { tone(1976, 2349, 0.05, 'square', 0.03); },
  flip:     function () { noise(0.05, 0.12, 3600, 1.4); tone(600, 900, 0.04, 'triangle', 0.03); },
  swell:    function () { tone(80, 160, 0.7, 'sawtooth', 0.05); noise(0.7, 0.05, 900, 0.5, 0, 'lowpass'); },
  slam:     function () { noise(0.28, 0.28, 200, 0.6, 0, 'lowpass'); tone(110, 52, 0.28, 'square', 0.09); tone(523, 523, 0.18, 'triangle', 0.04, 0.02); },
  heart:    function () { tone(68, 48, 0.12, 'sine', 0.12); tone(62, 44, 0.1, 'sine', 0.09, 0.17); },
  swoosh:   function () { noise(0.22, 0.07, 900, 0.6); noise(0.16, 0.06, 2200, 0.9, 0.06); },
  ok:     function () { tone(520, 780, 0.09, 'square', 0.05); },
  cancel: function () { tone(420, 280, 0.08, 'square', 0.04); },
  step:   function () { tone(190, 150, 0.05, 'triangle', 0.08); },
  slash:  function () { noise(0.11, 0.2, 2600, 0.7); tone(520, 180, 0.09, 'sawtooth', 0.05); },
  punch:  function () { noise(0.07, 0.22, 500, 0.9); tone(160, 90, 0.08, 'square', 0.08); },
  arrow:  function () { noise(0.09, 0.12, 4200, 2); tone(1100, 700, 0.08, 'sine', 0.04); },
  magic:  function () { tone(480, 1250, 0.18, 'sine', 0.07); tone(960, 1900, 0.16, 'triangle', 0.03, 0.03); },
  skill:  function () { tone(440, 880, 0.12, 'square', 0.045); tone(660, 1320, 0.12, 'square', 0.035, 0.05); },
  hit:    function (r) { r = r || 1; noise(0.07, 0.2, 900 * r, 0.8); tone(170 * r, 80 * r, 0.09, 'square', 0.09); },      // r26: r = 연타 음높이 (고른 가문이 잇달아 때리면 조금씩 오른다)
  crit:   function () { noise(0.1, 0.26, 1500, 0.8); tone(240, 70, 0.14, 'square', 0.11); tone(900, 1400, 0.07, 'square', 0.04); },
  miss:   function () { tone(900, 1300, 0.07, 'sine', 0.04); },
  die:    function () { tone(320, 55, 0.3, 'sawtooth', 0.07); noise(0.25, 0.1, 400, 0.6); },
  heal:   function () { [660, 880, 1320].forEach(function (f, i) { tone(f, f, 0.1, 'sine', 0.06, i * 0.06); }); },
  buff:   function () { tone(392, 784, 0.2, 'triangle', 0.08); tone(588, 1176, 0.2, 'triangle', 0.05, 0.04); },
  fire:   function () { noise(0.4, 0.14, 500, 0.5, 0, 'lowpass'); tone(900, 200, 0.35, 'sawtooth', 0.03); },
  boom:   function () { noise(0.35, 0.3, 240, 0.6, 0, 'lowpass'); tone(110, 40, 0.3, 'square', 0.1); },
  thunder:function () { noise(0.3, 0.3, 1800, 0.4); tone(90, 50, 0.3, 'square', 0.1); },
  water:  function () { noise(0.3, 0.16, 1400, 1.2); tone(400, 700, 0.2, 'sine', 0.04); },
  wind:   function () { noise(0.28, 0.14, 2200, 1.5); },
  dark:   function () { tone(220, 110, 0.3, 'sawtooth', 0.05); tone(233, 116, 0.3, 'sawtooth', 0.05); },
  poison: function () { tone(300, 240, 0.12, 'square', 0.04); tone(260, 200, 0.12, 'square', 0.04, 0.09); },
  holy:   function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, f, 0.16, 'sine', 0.05, i * 0.04); }); },
  warn:   function () { tone(880, 880, 0.09, 'square', 0.06); tone(880, 880, 0.09, 'square', 0.06, 0.14); },
  blink:  function () { tone(1400, 300, 0.16, 'sine', 0.06); },
  leap:   function () { tone(300, 900, 0.14, 'triangle', 0.07); },
  spawn:  function () { tone(120, 360, 0.2, 'sawtooth', 0.05); },
  sword:  function () { tone(160, 1800, 0.5, 'sawtooth', 0.07); noise(0.5, 0.12, 3000, 0.5); tone(80, 80, 0.5, 'square', 0.05); },
  phase:  function () { tone(60, 240, 0.8, 'sawtooth', 0.1); noise(0.8, 0.2, 300, 0.4, 0, 'lowpass'); },
  level:  function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, f, 0.1, 'square', 0.05, i * 0.07); }); },
  star:   function () { tone(1047, 1568, 0.14, 'triangle', 0.08); },
  win:    function () { [523, 523, 523, 659, 784, 659, 784, 1047].forEach(function (f, i) { tone(f, f, i === 7 ? 0.5 : 0.12, 'square', 0.055, [0, 0.13, 0.26, 0.39, 0.55, 0.71, 0.84, 1.0][i]); }); },
  lose:   function () { [392, 370, 349, 262].forEach(function (f, i) { tone(f, f, i === 3 ? 0.6 : 0.22, 'triangle', 0.08, i * 0.24); }); },
  coin:   function () { tone(988, 988, 0.05, 'square', 0.05); tone(1319, 1319, 0.14, 'square', 0.05, 0.05); },
  // ── 연출용 (2.7) ──
  // 승급: 한 계단씩 오르는 아르페지오 끝에 화음이 번진다
  promo:  function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, f, 0.11, 'square', 0.05, i * 0.075); }); [1047, 1319, 1568].forEach(function (f) { tone(f, f, 0.55, 'triangle', 0.05, 0.4); }); noise(0.35, 0.025, 6000, 0.8, 0.4, 'highpass'); },
  // 합일: 낮은 울림 → 세 병과가 차례로 부르는 세 화음 → 길게 터지는 큰 화음
  fuse:   function () {
    tone(82, 165, 0.6, 'sawtooth', 0.07); noise(0.6, 0.07, 300, 0.5, 0, 'lowpass');
    [[392, 494, 587], [440, 554, 659], [494, 622, 740]].forEach(function (ch, i) { ch.forEach(function (f) { tone(f, f, 0.2, 'square', 0.035, 0.45 + i * 0.2); }); });
    [262, 523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, f, 1.1, i < 2 ? 'triangle' : 'square', i < 2 ? 0.07 : 0.035, 1.08); });
    noise(0.7, 0.05, 5000, 0.6, 1.08, 'highpass'); tone(1568, 2093, 0.5, 'sine', 0.025, 1.3);      // 2.8: 쉬익 소리와 끝 고음을 줄임
  },
  // 영웅 이상 모집: 반짝이며 오르는 소리 끝에 종
  pullHi: function () { [784, 988, 1175, 1568, 1976].forEach(function (f, i) { tone(f, f, 0.09, 'sine', 0.055, i * 0.055); }); [784, 1175, 1568].forEach(function (f, i) { tone(f, f, 0.6, 'triangle', i ? 0.04 : 0.05, 0.3); }); noise(0.4, 0.015, 7000, 1, 0.3, 'highpass'); },      // 2.8: 맨 위 2349Hz 를 빼고 끝 화음을 한 옥타브 내림 (귀를 찌르던 소리)
  // 전설 장비·귀한 물건: 낮은 울림 위의 두 번 종소리
  // 2.1.1 전설 장비: 낮은 북 · 오르는 팡파르 · 길게 번지는 금빛 화음과 종
  legend: function () { tone(73, 73, 1.2, 'sine', 0.1); noise(0.5, 0.05, 400, 0.4, 0, 'lowpass'); [392, 523, 659, 784].forEach(function (f, i) { tone(f, f, 0.12, 'square', 0.05, 0.12 + i * 0.09); }); [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, f, 1.3, i < 2 ? 'triangle' : 'square', i < 2 ? 0.07 : 0.03, 0.5); }); tone(1568, 1568, 0.9, 'triangle', 0.05, 0.62); tone(2093, 2093, 1.1, 'sine', 0.035, 0.8); },
  rare:   function () { tone(110, 110, 0.9, 'sine', 0.08); tone(880, 880, 0.5, 'triangle', 0.07, 0.05); tone(1320, 1320, 0.5, 'triangle', 0.045, 0.05); tone(1109, 1109, 0.7, 'triangle', 0.07, 0.4); tone(1661, 1661, 0.7, 'triangle', 0.045, 0.4); },
  // 용병 전사: 내려앉는 단조 네 음과 낮은 지속음
  mourn:  function () { tone(98, 92, 1.5, 'sine', 0.09); [392, 370, 311, 262].forEach(function (f, i) { tone(f, f, i === 3 ? 0.8 : 0.3, 'triangle', 0.075, 0.1 + i * 0.3); }); tone(131, 131, 0.8, 'triangle', 0.05, 1.0); },
  // r32 필살기: 휙 하고 모였다가 낮은 한 방 위로 금빛 화음 · 필살 게이지가 다 찼을 때의 짧은 종
  ult:    function () { noise(0.18, 0.08, 1800, 0.7); tone(220, 880, 0.16, 'sawtooth', 0.05); noise(0.32, 0.26, 220, 0.6, 0.16, 'lowpass'); tone(98, 49, 0.3, 'square', 0.09, 0.16); [523, 659, 784, 1047].forEach(function (f) { tone(f, f, 0.45, 'triangle', 0.035, 0.2); }); },
  ultReady: function () { tone(1175, 1175, 0.08, 'triangle', 0.05); tone(1568, 1568, 0.08, 'triangle', 0.05, 0.07); tone(2093, 2093, 0.2, 'sine', 0.04, 0.14); },
  // 도발 (2.8, 엔진의 taunt 이벤트): 낮게 으르렁대는 짧은 외침
  taunt:  function () { tone(196, 147, 0.16, 'sawtooth', 0.06); tone(294, 220, 0.12, 'square', 0.03, 0.02); noise(0.08, 0.1, 700, 0.8); },
  // 보스가 싸움을 건다: 묵직한 한 방과 불협화음
  bossIn: function () { noise(0.5, 0.26, 180, 0.6, 0, 'lowpass'); tone(55, 110, 0.6, 'sawtooth', 0.09); tone(233, 220, 0.5, 'square', 0.04, 0.08); tone(247, 233, 0.5, 'square', 0.04, 0.08); }
};

// ── 음량 맞춤 (2.8) ──
// 2.7 까지는 효과음마다 크기가 제각각이었다(화살 −38dB·두드림 −43dB 가 배경음 −31dB 밑에 묻히고, 합일은 −22dB). 오프라인 렌더(DS.Audio.probe)로
// 50ms 창의 최대 RMS 를 재어 갈래마다 같은 크기가 되게 곱한다: 조작 −32 · 전투 −27 · 치명타·폭발 −23 · 연출 −22 (dBFS, 압축기 앞). 배경음은 16초 RMS −38 로 곡끼리 맞춘다.
var LVL = {"tap":3.63,"ok":1.95,"cancel":2.26,"step":1.3,"slash":2.26,"punch":2.04,"arrow":3.67,"magic":1.88,"skill":2.95,"hit":1.74,"crit":1.68,"miss":2.88,"die":2.14,"heal":2.95,"buff":1.95,"fire":3.2,"boom":1.3,"thunder":0.96,"water":2.29,"wind":3.35,"dark":2.42,"poison":3.31,"holy":2.6,"warn":2.63,"blink":2.37,"leap":2.69,"spawn":2.4,"sword":1.45,"phase":1.66,"level":3.71,"star":2.11,"win":2.37,"lose":1.97,"coin":2.26,"promo":2.09,"fuse":1.19,"pullHi":2.48,"rare":1.8,"mourn":1.62,"bossIn":2.02,"taunt":2.85,
  "press":5.13,"open":2.45,"close":3.2,"tab":4.9,"deny":1.38,"ready":2.66,"coinTick":3.2,"coinLand":4.03,"flip":3.94,"swell":2.6,"slam":1.9,"heart":1.43,"swoosh":4.27,"ult":1.5,"ultReady":2.4};      // r26: 새 화면 소리 — 같은 probe 로 조작 −32 · 동전 똑딱 −40 · 기대 −27 · 띠 −22 · 심장 −27
var BGV = {"map":1.86,"town":1.6,"battle":1.17,"boss":1.06,"title":1.92,"dark":2.04,"victory":1.35,"ending":1.89,"erase":2.0};

// ── 배경음: 16분음표 시퀀서 ──
// 음 이름 → 주파수
var N = {};
(function () {
  var names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (var o = 1; o <= 6; o++) for (var i = 0; i < 12; i++) N[names[i] + o] = 440 * Math.pow(2, (i - 9) / 12 + (o - 4));
})();
function pat(str) { return str.trim().split(/\s+/); }
var DARK = { styx: 1, nether: 1, blood: 1, lava: 1 };
var TRACKS = {
  // 필드
  map: { bpm: 84, lead: pat('D5 - F5 - A5 - G5 F5 E5 - C5 - E5 - D5 - A#4 - D5 - F5 - E5 D5 C#5 - A4 - C#5 - E5 - F5 - A5 - C6 - A5 G5 F5 - D5 - F5 - E5 - D5 - C5 - A4 - C5 - D5 - - - A4 - - -'),
    bass: pat('D3 - - - A3 - - - C3 - - - G3 - - - A#2 - - - F3 - - - A2 - - - E3 - - - D3 - - - A3 - - - A#2 - - - F3 - - - G2 - - - D3 - - - A2 - - - A2 - E3 -'), lv: 0.028, bv: 0.05, type: 'triangle', echo: true },
  // 마을
  town: { bpm: 96, lead: pat('G4 - B4 D5 - B4 G4 - A4 - C5 E5 - C5 A4 - F#4 - A4 D5 - A4 F#4 - G4 - B4 D5 G5 - D5 - D5 - B4 G4 - B4 D5 - E5 - C5 A4 - C5 E5 - D5 - A4 F#4 - A4 D5 - B4 - G4 D5 G5 - - -'),
    bass: pat('G2 - - D3 - - G2 - A2 - - E3 - - A2 - D3 - - A2 - - D3 - G2 - - D3 - - G2 -'), lv: 0.03, bv: 0.05, type: 'triangle', echo: true },
  // 전투
  battle: { bpm: 132, lead: pat('A4 C5 E5 C5 A4 C5 E5 A5 F4 A4 C5 A4 F4 A4 C5 F5 G4 B4 D5 B4 G4 B4 D5 G5 E5 D5 C5 B4 E4 G#4 B4 E5 E5 - E5 D5 C5 - A4 - F5 - F5 E5 D5 - A4 - G5 - G5 F5 E5 - B4 - E5 G#5 B5 G#5 E5 D5 C5 B4'),
    bass: pat('A2 - A2 - A2 - A2 A3 F2 - F2 - F2 - F2 F3 G2 - G2 - G2 - G2 G3 E2 - E2 - E2 - E3 E2'), lv: 0.022, bv: 0.05, type: 'square', drum: true },
  // 보스
  boss: { bpm: 150, lead: pat('E5 - G5 F#5 E5 - B4 - C5 - E5 D5 C5 - G4 - A4 C5 E5 A5 G5 E5 C5 A4 B4 D#5 F#5 B5 A5 F#5 D#5 B4 B5 - A5 G5 F#5 - E5 - G5 - F#5 E5 D5 - C5 - A5 - G5 F#5 E5 - C5 - B4 D#5 F#5 A5 B5 - - -'),
    bass: pat('E2 E2 E3 E2 E2 E2 E3 E2 C2 C2 C3 C2 C2 C2 C3 C2 A2 A2 A3 A2 A2 A2 A3 A2 B2 B2 B3 B2 B2 B2 D#3 B2'), lv: 0.022, bv: 0.05, type: 'square', drum: true },
  // 타이틀 — 느린 행진
  title: { bpm: 76, lead: pat('D4 - - A4 - - D5 - - - C#5 - B4 - A4 - B4 - - G4 - - B4 - A4 - - - - - - - D4 - - A4 - - D5 - - - E5 - F#5 - E5 - D5 - - B4 - - C#5 - D5 - - - - - - -'),
    bass: pat('D2 - - - A2 - - - D3 - - - A2 - - - G2 - - - D3 - - - A2 - - - E2 - - - D2 - - - A2 - - - D3 - - - A2 - - - G2 - - - D3 - - - A2 - - - D2 - - -'), lv: 0.034, bv: 0.05, type: 'triangle', echo: true },
  // 어두운 지역(수렁·첨탑·변경·끝의 땅) — 낮고 성긴 단조
  dark: { bpm: 72, lead: pat('E4 - - - G4 - - F#4 - - E4 - - - B3 - - - - - C4 - - - B3 - - - - - - - E4 - - - G4 - - A4 - - B4 - - - G4 - - - - - F4 - - - E4 - - - - - - -'),
    bass: pat('E2 - - - - - - - E2 - - - B2 - - - C2 - - - - - - - B1 - - - - - - - E2 - - - - - - - E2 - - - G2 - - - F2 - - - - - - - E2 - - - - - - -'), lv: 0.036, bv: 0.055, type: 'sine', echo: true },
  // 승리 — 한 번만 울리는 짧은 곡
  victory: { bpm: 120, lead: pat('C5 - C5 C5 E5 - G5 - C6 - - - G5 - E5 - F5 - A5 - C6 - A5 - G5 - - - C6 - - -'),
    bass: pat('C3 - - - G2 - - - C3 - - - E3 - - - F2 - - - A2 - - - G2 - - - C3 - - -'), lv: 0.04, bv: 0.05, type: 'square', once: true },
  // r17 boss: 이름 지우기 — 느리고 낮은 반음 맴돌기 (북 없이)
  erase: { bpm: 56, lead: pat('E4 - F4 - E4 - - - D#4 - E4 - - - - - B3 - C4 - B3 - - - A#3 - B3 - - - - -'),
    bass: pat('E1 - - - - - - - E1 - - - - - - - F1 - - - - - - - E1 - - - - - - -'), lv: 0.04, bv: 0.07, type: 'sine', echo: true },
  // 엔딩 — 따뜻한 장조
  ending: { bpm: 80, lead: pat('G4 - B4 - D5 - - - E5 - D5 - B4 - - - C5 - E5 - G5 - - - F#5 - E5 - D5 - - - G4 - B4 - D5 - - - G5 - F#5 - E5 - - - D5 - C5 - B4 - A4 - G4 - - - - - - -'),
    bass: pat('G2 - - - D3 - - - E2 - - - B2 - - - C3 - - - G2 - - - D3 - - - D2 - - - G2 - - - D3 - - - E2 - - - B2 - - - C3 - - - D3 - - - G2 - - - - - - -'), lv: 0.034, bv: 0.05, type: 'triangle', echo: true }
};
function schedule(horizon) {
  if (!ctx || !seq.name) return;
  var tr = TRACKS[seq.name], dur = 60 / tr.bpm / 2;
  if (!opt.bgm) { seq.next = ctx.currentTime + 0.1; return; }
  while (seq.next < (horizon || ctx.currentTime + 0.25)) {
    if (tr.once && seq.step >= tr.lead.length) { clearInterval(seq.timer); seq.timer = null; seq.name = null; return; }      // 한 번만 울리는 곡 (승리)
    var i = seq.step % tr.lead.length, when = Math.max(0, seq.next - ctx.currentTime), out = seq.g || bgmG;
    var l = tr.lead[i], b = tr.bass[i % tr.bass.length];
    if (l !== '-' && N[l]) { tone(N[l], N[l], dur * 1.6, tr.type, tr.lv, when, out); if (tr.echo) tone(N[l], N[l], dur * 1.6, tr.type, tr.lv * 0.35, when + dur * 1.5, out); }
    if (b !== '-' && N[b]) tone(N[b], N[b], dur * 1.8, 'triangle', tr.bv, when, out);
    if (tr.drum && i % 8 === 0) tone(120, 45, 0.09, 'sine', 0.09, when, out);      // 킥
    if (tr.drum && i % 4 === 2) { // 가벼운 스네어 대용
      var t = ctx.currentTime + when, s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 3000;
      g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 0.08);
    }
    seq.next += dur; seq.step++;
  }
}
DS.Audio = {
  unlock: function () { if (init() && seq.name && !seq.timer) this.bgm(seq.name, true); },
  set: function (o) {
    if (o.sfx !== undefined) opt.sfx = o.sfx;
    if (o.bgm !== undefined) opt.bgm = o.bgm;
    if (ctx) { sfxG.gain.value = opt.sfx ? 1 : 0; try { bgmG.gain.cancelScheduledValues(ctx.currentTime); } catch (e) {} bgmG.gain.value = opt.bgm ? 1 : 0; }
  },
  sfx: function (name, arg) { if (ctx && opt.sfx && SFX[name]) { VOL = LVL[name] || 1; try { SFX[name](arg); } catch (e) {} VOL = 1; } },
  // r26: 배경음을 잠깐 낮춘다 (승리 띠·영웅 모집·승급) — db 만큼, ms 동안
  duck: function (db, ms) { if (!ctx || !bgmG) return; try { var t = ctx.currentTime, to = Math.pow(10, -(db || 6) / 20) * (opt.bgm ? 1 : 0); bgmG.gain.cancelScheduledValues(t); bgmG.gain.setValueAtTime(bgmG.gain.value, t); bgmG.gain.setTargetAtTime(to, t, 0.04); bgmG.gain.setTargetAtTime(opt.bgm ? 1 : 0, t + (ms || 1200) / 1000, 0.25); } catch (e) {} },
  bgm: function (name, force) {
    if (seq.name === name && seq.timer && !force) return;
    seq.name = name;
    if (seq.timer) { clearInterval(seq.timer); seq.timer = null; }
    if (!ctx) return;
    // 교차 페이드: 치던 곡은 0.4초에 걸쳐 잦아들고, 새 곡은 제 게인으로 올라온다
    var old = seq.g, now = ctx.currentTime;
    if (old) { try { old.gain.cancelScheduledValues(now); old.gain.setValueAtTime(old.gain.value, now); old.gain.linearRampToValueAtTime(0.0001, now + 0.4); } catch (e) {} setTimeout(function () { try { old.disconnect(); } catch (e) {} }, 900); seq.g = null; }
    if (!name || !TRACKS[name]) return;
    seq.g = ctx.createGain(); seq.g.gain.setValueAtTime(0.0001, now); seq.g.gain.linearRampToValueAtTime(BGV[name] || 1, now + (old ? 0.4 : 0.15)); seq.g.connect(bgmG);
    seq.step = 0; seq.next = now + (old ? 0.22 : 0.08);
    seq.timer = setInterval(function () { schedule(); }, 90);
  },
  has: function (name) { return !!(SFX[name] || TRACKS[name]); },
  names: function () { return { sfx: Object.keys(SFX), bgm: Object.keys(TRACKS) }; },
  // 개발용 점검: 같은 소리 길을 OfflineAudioContext 에 만들어 렌더한다 → Promise(AudioBuffer). 실제 재생 상태는 건드리지 않는다.
  // what: 효과음 이름(o.bgm 이면 곡 이름) · [[이름, 초], …](겹쳐 울리기). o.noComp 압축기 빼고, o.secs 길이
  probe: function (what, o) {
    o = o || {};
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC) return null;
    var sr = o.sr || 44100, secs = o.secs || 2, keep = [ctx, master, sfxG, bgmG, noiseBuf, seq, opt, T0];
    var oc = new OAC(1, Math.ceil(secs * sr), sr);
    try {
      ctx = oc; opt = { sfx: true, bgm: true }; graph(oc, o.noComp);
      if (typeof what === 'string' && o.bgm && TRACKS[what]) { seq = { name: what, timer: null, step: 0, next: 0.02, g: null }; if (!o.raw) { seq.g = oc.createGain(); seq.g.gain.value = BGV[what] || 1; seq.g.connect(bgmG); } schedule(secs); }
      else (typeof what === 'string' ? [[what, 0]] : what).forEach(function (e) { T0 = e[1]; VOL = o.raw ? 1 : LVL[e[0]] || 1; if (SFX[e[0]]) SFX[e[0]](); VOL = 1; });
    } finally { ctx = keep[0]; master = keep[1]; sfxG = keep[2]; bgmG = keep[3]; noiseBuf = keep[4]; seq = keep[5]; opt = keep[6]; T0 = keep[7]; }
    return oc.startRendering();
  },
  stop: function () { if (seq.timer) clearInterval(seq.timer); seq.timer = null; seq.name = null; },
  // 지역에 맞는 곡 이름: 마을 · 어두운 땅(수렁·첨탑·변경·끝의 땅) · 그 밖의 필드
  zoneTrack: function (z) { return !z ? 'map' : z.town ? 'town' : DARK[z.theme] ? 'dark' : 'map'; },
  // 화면이 가려지면 멈추고, 돌아오면 같은 곡을 잇는다
  pause: function () { if (seq.timer) clearInterval(seq.timer); seq.timer = null; if (ctx && ctx.state === 'running') { try { ctx.suspend(); } catch (e) {} } },
  resume: function () { if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} } if (seq.name && !seq.timer) this.bgm(seq.name, true); }
};
})();
