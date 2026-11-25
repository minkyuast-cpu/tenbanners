# 전민 — 소스 (source 브랜치)

웹 페이지(main 브랜치)는 이 소스로 만든 결과물이다.

- `node build.js` → `../dist/index.html` (아티팩트 판), `../dist/test.html`
- `TARGET=web node build.js` → `../dist/web/` (main 브랜치에 올리는 파일)
- `src/` 게임 코드와 스타일, `fonts/` 부분 집합 글꼴, `tmpl/` 페이지 틀, `web_assets/` 웹 판 아이콘·설정
- 이야기 글: `src/story2.js`(서른 판 · 엔딩) · `src/lore.js`(보스 · 막간 · 마을 · 가문 기록), 적용은 `src/story.js`. 말투와 장치는 `docs/STORY_BIBLE_2.4.md`
- 글을 고친 뒤: `python3 tools/fontcheck.py` (본문 글꼴에 없는 한글이 0 이어야 한다). 없는 글자가 나오면 `python3 tools/fontsub.py <Pretendard 1.3.9 정적 OTF 폴더>` 로 글꼴을 다시 자른다 (TB Sans = Pretendard, OFL)
- 이야기 시험: `H=844 OUT=qa_out/story node tools/shot.js tools/t_story.js` (서른 판과 그 밖의 글 표) · 글 화면 시험: `H=844 OUT=qa_out/text node tools/shot.js tools/t_text.js` (현상 수배 · 영웅관 · 장비 내력 · 연무장 · 연출 · 도움말 · 성격 한마디가 진짜 화면에 뜨는가) · 싸움 도중의 한마디 시험: `H=844 OUT=qa_out/banter node tools/shot.js tools/t_banter.js` (글은 `src/story2.js` 의 `DS.BANTER_TXT`, 띄우는 것은 `src/banter.js`)

2.1.2 배포본에서 되살린 소스다. 같은 소스로 빌드하면 2.1.2 배포본과 바이트까지 같다.
- 한자 「大」(합일한 가문 이름 앞) 한 글자는 `fonts/TBHan-Medium.woff2` 에 있다 (Noto Sans KR 500 의 부분 집합, SIL OFL 1.1). 글꼴 묶음마다 원래 굵기와 똑같은 굵기로 `unicode-range: U+5927` 얼굴을 하나씩 얹는다 (tmpl/*.html). 굵기를 범위(100 900)로 적으면 굵은 글씨의 글꼴 고르기가 바뀌어 한글 너비가 달라진다.
