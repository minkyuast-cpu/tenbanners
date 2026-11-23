# 전민 — 소스 (source 브랜치)

웹 페이지(main 브랜치)는 이 소스로 만든 결과물이다.

- `node build.js` → `../dist/index.html` (아티팩트 판), `../dist/test.html`
- `TARGET=web node build.js` → `../dist/web/` (main 브랜치에 올리는 파일)
- `src/` 게임 코드와 스타일, `fonts/` 부분 집합 글꼴, `tmpl/` 페이지 틀, `web_assets/` 웹 판 아이콘·설정
- 이야기 글: `src/story2.js`(서른 판 · 엔딩) · `src/lore.js`(보스 · 막간 · 마을 · 가문 기록), 적용은 `src/story.js`. 말투와 장치는 `docs/STORY_BIBLE_2.4.md`
- 글을 고친 뒤: `python3 tools/fontcheck.py` (본문 글꼴에 없는 한글이 0 이어야 한다). 없는 글자가 나오면 `python3 tools/fontsub.py <Pretendard 1.3.9 정적 OTF 폴더>` 로 글꼴을 다시 자른다 (TB Sans = Pretendard, OFL)
- 이야기 시험: `H=844 OUT=qa_out/story node tools/shot.js tools/t_story.js`

2.1.2 배포본에서 되살린 소스다. 같은 소스로 빌드하면 2.1.2 배포본과 바이트까지 같다.
