// 전민 — 빌드: src/*.js · src/style.css · fonts/*.woff2 → ../dist/index.html (아티팩트 판) · ../dist/test.html · ../dist/web/ (TARGET=web, Firebase 판)
// 2.2.0 복구판: 2.1.2 배포본에서 되살린 틀(tmpl/)에 그대로 끼워 넣는다 — 같은 소스면 배포본과 바이트까지 같다.
const fs = require('fs'), path = require('path');
const WEB = process.env.TARGET === 'web';
const SRC = path.join(__dirname, 'src');
const ORDER = ['data', 'rise', 'notes', 'meta', 'loot', 'lineage', 'age', 'banner', 'temper', 'crest', 'icons', 'tune', 'world', 'lore', 'story2', 'story', 'save', 'engine', 'shade', 'field', 'bigmon', 'sprites', 'sprites2', 'art', 'art2', 'art3', 'rise_art', 'art4', 'art5', 'tiles', 'view', 'death', 'audio', 'game', 'joystick', 'ui', 'cine', 'endgame', 'social', 'legacy', 'arena', 'mission', 'heirloom', 'choice', 'stage'];
const list = ORDER.concat(WEB ? ['online_fb', 'online'] : ['online']).concat(['migrate']).filter(f => fs.existsSync(path.join(SRC, f + '.js')));
const js = '\n' + list.map(f => fs.readFileSync(path.join(SRC, f + '.js'), 'utf8')).join('\n');
const css = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');
let html = fs.readFileSync(path.join(__dirname, 'tmpl', WEB ? 'web.html' : 'art.html'), 'utf8');
html = html.replace(/@F:([A-Za-z0-9-]+)@/g, (m, n) => fs.readFileSync(path.join(__dirname, 'fonts', n + '.woff2')).toString('base64'));
html = html.split('@CSS@').join(css).split('@JS@').join(js);
const OUT = path.join(__dirname, '..', 'dist');
fs.mkdirSync(OUT, { recursive: true });
if (WEB) {
  const W = path.join(OUT, 'web'); fs.mkdirSync(W, { recursive: true });
  fs.writeFileSync(path.join(W, 'index.html'), html);
  const A = path.join(__dirname, 'web_assets');
  if (fs.existsSync(A)) fs.readdirSync(A).forEach(f => fs.copyFileSync(path.join(A, f), path.join(W, f)));
  console.log('web', html.length, 'chars,', list.length, 'files');
} else {
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
  fs.writeFileSync(path.join(OUT, 'test.html'), html);
  console.log('artifact', html.length, 'chars,', list.length, 'files');
}
