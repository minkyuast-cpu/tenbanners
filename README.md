# 전민 — 소스 (source 브랜치)

웹 페이지(main 브랜치)는 이 소스로 만든 결과물이다.

- `node build.js` → `../dist/index.html` (아티팩트 판), `../dist/test.html`
- `TARGET=web node build.js` → `../dist/web/` (main 브랜치에 올리는 파일)
- `src/` 게임 코드와 스타일, `fonts/` 부분 집합 글꼴, `tmpl/` 페이지 틀, `web_assets/` 웹 판 아이콘·설정

2.1.2 배포본에서 되살린 소스다. 같은 소스로 빌드하면 2.1.2 배포본과 바이트까지 같다.
