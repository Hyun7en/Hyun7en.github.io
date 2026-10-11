# Architecture Decision Records

이 블로그를 만들면서 내린 기술 결정과 그 이유를 기록한다. 결정 하나에 파일 하나이며, 지난 결정을 고치지 않고 새 ADR로 대체(Superseded)한다.

| # | 결정 | 상태 | 날짜 |
|---|---|---|---|
| [0001](0001-static-site-on-github-pages.md) | 서버 없는 정적 사이트를 GitHub Pages로 배포 | 채택 | 2026-02-08 |
| [0002](0002-astro-and-mdx.md) | Jekyll에서 Astro + MDX로 이전 | 채택 | 2026-08-26 |
| [0003](0003-content-in-git-with-build-time-validation.md) | 콘텐츠와 관계 데이터는 Git의 파일로, 검증은 빌드 시점에 | 채택 | 2026-08-26 |
| [0004](0004-tech-flow-instead-of-graph.md) | Architecture 그래프 대신 기술 흐름(선행 관계) 모델 | 채택 | 2026-10-11 |
| [0005](0005-no-ui-framework-for-widgets.md) | 위젯에 UI 프레임워크(React)를 쓰지 않음 | 채택 | 2026-10-11 |
| [0006](0006-drop-til-existence-check.md) | 빌드 시 TIL 경로 존재 확인(GitHub API) 제거 | 채택 | 2026-10-11 |
| [0007](0007-self-hosted-fonts.md) | Google Fonts 대신 Pretendard·JetBrains Mono 직접 제공 | 채택 | 2026-10-11 |
| [0008](0008-sitemap-and-rss.md) | sitemap은 직접 생성, RSS는 @astrojs/rss | 채택 | 2026-10-11 |
| [0009](0009-type-check-in-ci.md) | PR마다 타입 검사와 빌드 실행 | 채택 | 2026-10-11 |
| [0010](0010-curated-learning-tracks.md) | 자동 추천 경로 대신 직접 고른 학습 트랙 | 채택 | 2026-10-11 |
| [0011](0011-comments-giscus.md) | 댓글을 utterances에서 giscus로 전환 | 채택 | 2026-10-11 |
| [0012](0012-project-scoped-ai-coding-rules.md) | AI 코딩 규칙을 이 저장소에만 적용 | 채택 | 2026-10-11 |
| [0013](0013-study-and-news-posts.md) | 학습 글과 소식 글을 구분하고, 루틴은 소식 글만 쓴다 | 채택 | 2026-10-11 |
| [0014](0014-dark-mode-follows-os.md) | 다크 모드는 OS 설정을 따르고 토글은 두지 않는다 | 채택 | 2026-10-11 |

## 새 ADR 쓰는 법

다음 번호로 파일을 만들고 아래 형식을 따른다.

```md
# NNNN. 제목 (결정을 한 문장으로)

- 상태: 제안 | 채택 | 대체됨(→ NNNN)
- 날짜: YYYY-MM-DD

## 배경
무엇이 문제였고 어떤 제약이 있었나.

## 결정
무엇을 하기로 했나.

## 검토한 대안
대안과, 고르지 않은 이유.

## 결과
좋아진 점, 감수한 점, 나중에 다시 볼 조건.
```
