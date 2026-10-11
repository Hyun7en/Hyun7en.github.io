# 0011. 댓글을 utterances에서 giscus로 전환한다

- 상태: 제안 (코드 준비됨, 카테고리 ID 입력 전까지 utterances 유지)
- 날짜: 2026-10-11

## 배경
댓글은 utterances(GitHub Issues 기반)를 쓴다. utterances 저장소의 마지막 커밋은 2022-02-11로, 유지보수가 사실상 멈췄다.

## 결정 (제안)
같은 GitHub 기반이면서 지금도 관리되는 giscus(GitHub Discussions 기반, 마지막 커밋 2026-05-26)로 바꾼다. 리액션, 지연 로딩, 테마 전환을 지원한다.

## 구현
- `src/components/Comments.astro`가 `src/site.config.ts`의 `giscus.categoryId`를 본다. 값이 있으면 giscus, 비어 있으면 utterances를 그린다. 저장소 설정과 코드 머지 순서에 상관없이 댓글이 사라지지 않게 하려는 것이다.
- 설정값: 매핑 `pathname`, `data-strict="1"`(제목 해시로 정확히 매칭), 지연 로딩, 한국어, 라이트 테마.
- 저장소 ID(`R_kgDORK34SQ`)는 확인해서 넣었다.

## 적용에 필요한 것 (저장소 소유자)
1. 저장소 Settings → General → Features에서 **Discussions**를 켠다.
2. Discussions에 **Announcements 형식**의 카테고리 `Comments`를 만든다. 이 형식이면 새 토론은 giscus(봇)와 관리자만 만들 수 있어 스팸 토론을 막는다.
3. https://github.com/apps/giscus 에서 앱을 이 저장소에만 설치한다.
4. https://giscus.app 에서 저장소와 카테고리를 고르면 나오는 `data-category-id` 값을 `giscus.categoryId`에 넣는다. 그다음 `status`를 채택으로 바꾼다.

## 결과 (예상)
- 기존 utterances 댓글은 Issue #1 하나(댓글 1개)다. Jekyll 시절 주소(`spring/2026/02/16/first-post`)에 매핑되어 있어 Astro로 옮긴 뒤 이미 어느 글에도 표시되지 않는다. 옮길 댓글은 사실상 없다.
