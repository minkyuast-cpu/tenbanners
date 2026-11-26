// 전민 — 기술 연출 소리의 음량 재기: 효과음을 오프라인으로 렌더해(DS.Audio.probe · 압축기 앞) 50ms 창의 최대 RMS 를 재고, 목표 크기가 되는 보정값을 찍는다.
//   SND="shieldSlam,zap" [TARGET=-27] PAGE=<…/dist/test.html> node tools/shot.js tools/sklvl.js      (SND 가 없으면 2.7 에 더한 소리 모두)
//   목표: 전투 소리 −27 dBFS · 큰 충격 −23 · 단계 겹(skL2~5) −30 안팎. 찍힌 lvl 을 audio.js 의 LVL 표(또는 X.sound 의 셋째 인자)에 적는다.
'use strict';
module.exports = async (page) => {
  const names = (process.env.SND || 'shieldSlam,shieldUp,wallUp,quakeHit,whirl,shout,emberPop,fireRoar,iceShot,iceBreak,freeze,zap,thunderBig,fallWhistle,meteorHit,starFall,chant,runeTick,skL2,skL3,skL4,skL5').split(',');
  const target = +process.env.TARGET || -27;
  const out = await page.evaluate(async (a) => {
    const res = {};
    for (const n of a.names) {
      const p = DS.Audio.probe(n, { noComp: true, raw: true, secs: 1.6 }); if (!p) { res[n] = null; continue; }
      const buf = await p, d = buf.getChannelData(0), w = Math.round(buf.sampleRate * 0.05); let best = 0;
      for (let i = 0; i + w <= d.length; i += w >> 1) { let s = 0; for (let k = 0; k < w; k++) s += d[i + k] * d[i + k]; best = Math.max(best, Math.sqrt(s / w)); }
      const db = 20 * Math.log10(best || 1e-9); res[n] = { db: +db.toFixed(1), lvl: +Math.pow(10, (a.target - db) / 20).toFixed(2) };
    }
    return res;
  }, { names, target });
  console.log('target ' + target + ' dBFS');
  for (const n of names) console.log(n.padEnd(14) + (out[n] ? 'raw ' + String(out[n].db).padStart(6) + ' dB   lvl ' + out[n].lvl : 'no such sound'));
  console.log('LVL ' + JSON.stringify(Object.fromEntries(names.filter(n => out[n]).map(n => [n, out[n].lvl]))));
};
