# 0008. sitemap은 직접 생성하고, RSS는 @astrojs/rss를 쓴다

- 상태: 채택
- 날짜: 2026-10-11

## 배경
검색 노출과 구독은 블로그의 기본인데 sitemap, RSS, canonical 링크가 없었다. 또 글이 없는 기술 페이지는 `noindex`로 검색에서 제외하고 있다([0004](0004-tech-flow-instead-of-graph.md)).

## 결정
- `/sitemap.xml`은 `src/pages/sitemap.xml.ts`에서 기술 데이터를 읽어 직접 만든다. 홈, 로드맵, 글 목록, About, 모든 글, **글이 있는 기술 페이지만** 넣는다.
- `/rss.xml`은 `@astrojs/rss`로 만들고, 글의 기술을 카테고리로 넣는다.
- 레이아웃에 canonical, RSS, sitemap 링크를 넣고 `robots.txt`를 둔다. 404 페이지는 `noindex`다.

## 검토한 대안
- **@astrojs/sitemap**: 설정 몇 줄이면 되지만 콘텐츠 데이터를 읽을 수 없어 `noindex` 페이지까지 sitemap에 넣는다. 검색엔진은 이를 "제출했지만 noindex인 URL"로 경고한다.

## 결과
- sitemap과 noindex가 같은 데이터에서 나오므로 서로 어긋나지 않는다.
- 새 정적 페이지를 추가하면 sitemap 목록에 직접 넣어야 한다.
