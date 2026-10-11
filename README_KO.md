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
- Astro (Content Collections + MDX)
- 포스트 안 위젯은 Astro 컴포넌트(조작이 필요하면 짧은 `<script>`)로 작성 — UI 프레임워크 없음
- GitHub Pages, GitHub Actions로 빌드/배포

**다루는 학습 주제:**
- Java, Spring Boot, JPA, Kafka 등

---

## 기술 흐름

기술마다 먼저 알아야 할 기술(`requires`)만 적어 두면, 사이트가 나머지를 자동으로 만듭니다.

- **로드맵**(`/tech/`) — 분야별로 단계 순서대로 나열. "글 있는 기술만 보기"로 걸러 볼 수 있음
- **기술 허브**(`/tech/<id>/`) — 선행 기술 ← 기술 → 다음 기술, 전체 학습 경로, 관련 글과 TIL 코드
- **이어서 읽기** — 글 하단에 이 기술 다음으로 이어지는 기술의 글을 추천
- **추천 학습 경로** — 글이 쌓인 흐름을 홈에서 자동으로 골라 보여줌

설계 메모: [docs/architecture-blog-plan.md](docs/architecture-blog-plan.md) 24절.

---

## 사용 방법

- `npm install && npm run dev` — 로컬 개발 서버
- 블로그 글은 `src/content/posts/`(Markdown/MDX)에 위치. frontmatter에 `tech: [spring-boot, jpa]`로 기술을 연결
- 기술은 `src/content/tech/<분야>.yaml`에 위치. 분야당 파일 하나, 기술당 항목 하나(`requires`, `related`, `til`)
- 없는 기술 ID를 쓰거나 `requires`가 순환하면 빌드가 실패
- 글(MDX) 안 위젯은 `src/components/widgets/`: `BenchmarkChart`, `CodeCompare`, `Quiz`, `Stepper`, `NPlusOneCalculator` — 각 파일 상단의 `Props`가 사용법
- `npm run build` — `dist/`로 정적 빌드, `main` 브랜치 푸시 시 GitHub Actions가 자동 배포

---

## 기여

개인 학습용 블로그이므로 기여는 예상하지 않습니다.  
하지만 학습 목적이라면 자유롭게 포크하거나 코드 참고가 가능합니다.
