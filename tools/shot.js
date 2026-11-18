// 전민 — 브라우저 시험 틀. dist/test.html 을 Chromium 390×H 로 열고, 시험 모듈에 (page, shot, lib) 을 넘긴다.
//   H=844 OUT=qa_out/x node tools/shot.js tools/t_smoke.js
//   콘솔 오류·페이지 오류마다 「SCRIPT ERROR …」 를 찍고, 하나도 없으면 끝에 「no errors」.
//   시험 모듈: module.exports = async function (page, shot, lib) { … }  — 실패는 throw (「FAIL …」 로 찍고 종료 코드 1)
'use strict';
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const lib = require('./lib.js');
(async () => {
  const test = process.argv[2]; if (!test) { console.log('usage: node tools/shot.js tools/<test>.js'); process.exit(2); }
  const H = +process.env.H || 844, W = +process.env.W || 390, OUT = path.resolve(process.env.OUT || path.join(__dirname, '..', 'qa_out', path.basename(test, '.js')));
  fs.mkdirSync(OUT, { recursive: true });
  const url = 'file://' + path.resolve(process.env.PAGE || '/home/user/dist/test.html');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: false, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') { const t = m.text(); if (/Failed to load resource|net::ERR_|favicon/.test(t)) return; errs.push(t); console.log('SCRIPT ERROR ' + t); } });
  page.on('pageerror', e => { const t = (e && e.stack) || String(e); errs.push(t); console.log('SCRIPT ERROR ' + t.split('\n').slice(0, 4).join(' | ')); });
  let n = 0;
  const shot = async (name) => { n++; const f = path.join(OUT, String(n).padStart(2, '0') + '_' + name + '.png'); await page.screenshot({ path: f }); return f; };
  let ok = true;
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.DS && DS.boot && document.querySelector('#s-title'), null, { timeout: 30000 });
    const mod = require(path.resolve(test));
    await mod(page, shot, lib, { OUT, W, H, errs });
  } catch (e) { ok = false; console.log('FAIL ' + ((e && e.stack) || e)); try { await shot('fail'); } catch (x) {} }
  await browser.close();
  if (!errs.length) console.log('no errors');
  console.log(ok && !errs.length ? 'PASS' : 'DONE WITH PROBLEMS');
  process.exit(ok && !errs.length ? 0 : 1);
})();
