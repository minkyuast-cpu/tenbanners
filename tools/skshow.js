// 전민 — 기술 연출 보기: 고른 기술을 시험 무대에서 걸고, 건 순간부터의 프레임을 한 장(접촉 인화)으로 남긴다.
//   SK="inf_bash,mag_meteor" OUT=<폴더> PAGE=<…/dist/test.html> H=844 node tools/shot.js tools/skshow.js
//   SK      기술 id 들 (쉼표). cls:inf · cls:mag 처럼 쓰면 그 병과의 기술 · 윗길 기술 · 필살기 · 윗길 필살기 모두. all 이면 연출이 등록된 기술 모두
//   SIDE    ally(기본) | enemy — 적이 쓰는 모습
//   MODE    '' | lite(효과 가볍게) | calm(움직임 줄이기)
//   SECS    찍을 길이(초). 없으면 단계 예산의 dur + 여운으로 · START 건 뒤 그 초부터 찍는다 (충격의 순간만 촘촘히: START=0.4 SECS=0.5 EVERY=1)
//   EVERY   몇 틱(0.05초)마다 한 칸 (없으면 길이에 맞춰 24칸 안팎)
//   COLS    한 줄의 칸 수(기본 6) · CW · CH 칸 크기(기본 256×208) · ZOOM 확대(기본 1.6 — 큰 기술은 1.2) · THEME 땅(기본 meadow · nether 같은 어두운 땅도) · BURN=1 · SLOW=1 맞을 무리에 미리 화상 · 둔화
// 돌려주는 것: <OUT>/<기술 id>[_<side>][_<mode>].png 와 한 줄 요약 (맞은 횟수 · 피해 합 · 가장 많았던 알갱이 · 그림 조각)
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, shot, L, env) => {
  const ev = (f, a) => page.evaluate(f, a), E = process.env;
  await L.newGame(page, { cls: 'inf', name: '연출' });
  await L.closeAll(page);
  await page.addScriptTag({ path: path.join(__dirname, 'skstage_page.js') });
  const mode = E.MODE || '', side = E.SIDE || 'ally';
  await ev((m) => { DS.G.save.opt.speed = 1; if (m === 'lite') DS.G.save.opt.fxq = 'lite'; if (m === 'calm') DS.gfxOpt = Object.assign(DS.gfxOpt || {}, { calm: true }); DS.Audio.set({ sfx: false, bgm: false }); }, mode);
  let ids = [];
  for (const tok of (E.SK || 'cls:inf').split(',').map(s => s.trim()).filter(Boolean)) {
    if (tok === 'all') ids = ids.concat(await ev(() => Object.keys(DS.SKFX)));
    else if (/^cls:/.test(tok)) ids = ids.concat(await ev((c) => { var C = DS.CLASSES[c], X = DS.CLASSES[DS.RISE_OF[c]]; return C.skills.map(function (s) { return s[0]; }).concat(X ? X.skills.map(function (s) { return s[0]; }).reverse() : []).concat(Object.keys(DS.ULTS).filter(function (k) { return DS.ULTS[k].cls === c; })).concat(Object.keys(DS.ULTX).filter(function (k) { return DS.ULTX[k].up === c; })); }, tok.slice(4)));
    else ids.push(tok);
  }
  for (const id of ids) {
    const r = await ev((a) => {
      if (!DS.SKILLS[a.id]) return { err: 'no such skill' };
      var st = SKS.stage(a.id, { side: a.side, theme: a.theme, burn: a.burn, slow: a.slow }), B = DS.skfx.BUDGET[st.fxTier], K = DS.SKILLS[a.id];
      var secs = a.secs || Math.min(6, Math.max(0.9, B.dur * 1.15 + 0.5 + (K.zone ? Math.min(3, K.zone.dur) : 0)));
      var every = a.every || Math.max(1, Math.round(secs / 0.05 / 23));
      var out = SKS.sheet({ secs: secs, every: every, cols: a.cols, cw: a.cw, ch: a.ch, zoom: a.zoom, start: a.start, tag: (a.side === 'enemy' ? 'enemy ' : '') + (a.mode || '') });
      out.st = st; return out;
    }, { id, side, mode, theme: E.THEME, burn: !!E.BURN, slow: !!E.SLOW, secs: +E.SECS || 0, start: +E.START || 0, every: +E.EVERY || 0, cols: +E.COLS || 6, cw: +E.CW || 256, ch: +E.CH || 208, zoom: +E.ZOOM || 1.6 });
    if (r.err) { console.log(id + ': ' + r.err); continue; }
    const f = path.join(env.OUT, id + (side === 'enemy' ? '_enemy' : '') + (mode ? '_' + mode : '') + '.png');
    fs.writeFileSync(f, Buffer.from(r.url.split(',')[1], 'base64'));
    console.log(id + '  T' + r.st.fxTier + (r.st.sig ? '' : ' (generic)') + '  cast ' + r.ok + '  hits ' + r.hits + ' dmg ' + r.dmg + '  peak ' + JSON.stringify(r.stat) + (r.pend || r.zones ? '  pending ' + r.pend + ' zones ' + r.zones : '') + '  → ' + f);
  }
};
