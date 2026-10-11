# 0011. 댓글을 utterances에서 giscus로 전환한다

- 상태: 제안 (저장소 설정이 필요해 아직 적용하지 않음)
- 날짜: 2026-10-11

## 배경
댓글은 utterances(GitHub Issues 기반)를 쓴다. utterances 저장소의 마지막 커밋은 2022-02-11로, 유지보수가 사실상 멈췄다.

## 결정 (제안)
같은 GitHub 기반이면서 지금도 관리되는 giscus(GitHub Discussions 기반, 마지막 커밋 2026-05-26)로 바꾼다. 리액션, 지연 로딩, 테마 전환을 지원한다.

## 적용 전 필요한 것
저장소 소유자가 해야 한다.
1. 저장소 Settings에서 Discussions를 켠다.
2. giscus GitHub App을 이 저장소에 설치한다.
3. giscus.app에서 저장소 ID와 카테고리 ID를 발급받는다.

## 결과 (예상)
- 기존 utterances 댓글(Issues)은 자동으로 옮겨지지 않는다. 지금은 댓글이 거의 없어 비용이 작다.
