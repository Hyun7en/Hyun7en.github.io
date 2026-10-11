# Hyun Dev Blog

여기는 개발 공부와 프로젝트 실험 기록을 남기는 개인 블로그입니다.

---

## 소개

이 블로그는 개발 학습과 지식 공유를 목적으로 합니다:  
- 개인 프로젝트와 코딩 실험 기록  
- 학습 진행 상황과 기술 팁 공유  
- 기술 간 선행 관계를 따라 블로그 글과 실제 구현 코드를 연결하는 기술 흐름(로드맵)

블로그 방문: [Hyun Dev Blog](https://hyun7en.github.io)

For English version → [English](README.md)  
한국어 버전 → [한국어](README_KO.md)

---

## 기술 스택

**사이트 구현 스택:**

| 영역 | 구성 |
|---|---|
| 프레임워크 | Astro 7 (정적 생성) + MDX |
| 콘텐츠 | Content Collections — 글 `src/content/posts/`, 기술 `src/content/tech/`, 트랙 `src/content/tracks/` |
| 위젯 | Astro 컴포넌트 + 필요할 때만 짧은 인라인 `<script>` — UI 프레임워크 없음 |
| 스타일 | 직접 작성한 CSS (`src/styles/global.css` + 컴포넌트별 스타일) |
| 코드 하이라이트 | Shiki (dracula), 빌드 시 처리 |
| 폰트 | Pretendard + JetBrains Mono, 사이트에서 직접 제공 |
| 댓글 | giscus (GitHub Discussions) |
| SEO | 직접 생성하는 sitemap, RSS(`@astrojs/rss`), canonical 링크, Open Graph 태그, robots.txt |
| 배포 / CI | GitHub Pages. GitHub Actions가 PR과 `main` 배포 전에 타입 검사, 빌드, 내부 링크 검사를 실행 |

**다루는 학습 주제:**
- Java, Spring Boot, JPA, Kafka 등

---

## 기술 흐름

기술마다 먼저 알아야 할 기술(`requires`)만 적어 두면, 사이트가 나머지를 자동으로 만듭니다.

- **로드맵**(`/tech/`) — 분야별로 단계 순서대로 나열. "글 있는 기술만 보기"로 걸러 볼 수 있음
- **기술 허브**(`/tech/<id>/`) — 선행 기술 ← 기술 → 다음 기술, 전체 학습 경로, 관련 글과 TIL 코드
- **이어서 읽기** — 글 하단에 이 기술 다음으로 이어지는 기술의 글을 추천
- **학습 트랙**(`/tracks/<id>/`) — 직접 고른 순서의 중심 줄기 + 곁가지, 택1 단계 표시 (roadmap.sh 방식)

설계 메모: [docs/architecture-blog-plan.md](docs/architecture-blog-plan.md) 24절. 기술을 왜 이렇게 골랐는지는 [docs/adr/](docs/adr/README.md)(ADR)에 정리했습니다.

---

## 사용 방법

글은 `src/content/posts/`에 Markdown 또는 MDX로 씁니다. 맨 위 frontmatter에 글 정보를 적습니다.

```md
---
title: "Spring Boot + JPA 시작하기"
date: 2026-02-16
description: 카드, 검색 결과, 링크 미리보기에 쓰이는 한 줄 요약
tech: [spring-boot, jpa]   # src/content/tech/*.yaml의 기술 ID
kind: study                # study(기본값, 진행도에 집계) | news(/news/에 모임, 집계 안 함)
draft: false               # true면 사이트에 안 나옴
---
```

- 기술: `src/content/tech/<분야>.yaml`. 분야당 파일 하나, 기술당 항목 하나(`requires`, `related`, `til`)
- 학습 트랙: `src/content/tracks/<id>.yaml`. 단계마다 `tech`(하나) 또는 `pick`(택1), 곁가지는 `with`, 이미 안다고 가정하는 선수 지식은 `assumes`. 각 기술의 `requires`가 트랙 앞쪽이나 `assumes`에 없으면 빌드가 실패한다
- 위젯(MDX): `src/components/widgets/`의 `BenchmarkChart`, `CodeCompare`, `Quiz`, `Stepper`, `NPlusOneCalculator`. 사용법은 각 파일의 `Props`
- 없는 기술 ID를 쓰거나 `requires`가 순환하면 빌드가 실패합니다.

```bash
npm install                           # Node.js 22.12 이상
npm run dev                           # 로컬 개발 서버 (http://localhost:4321)
npm run check                         # 타입 검사
npm run build && npm run check:links  # 정적 빌드 후 깨진 내부 링크 검사
```

`main`에 병합되면 GitHub Actions가 자동으로 배포합니다.

---

## 기여

개인 학습용 블로그이므로 기여는 예상하지 않습니다.  
하지만 학습 목적이라면 자유롭게 포크하거나 코드 참고가 가능합니다.
