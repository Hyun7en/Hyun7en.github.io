# Hyun Dev Blog

여기는 개발 공부와 프로젝트 실험 기록을 남기는 개인 블로그입니다.

---

## 소개

이 블로그는 개발 학습과 지식 공유를 목적으로 합니다:  
- 개인 프로젝트와 코딩 실험 기록  
- 학습 진행 상황과 기술 팁 공유  
- 기술, 개념, 블로그 글, 실제 구현 코드를 연결하는 인터랙티브 Architecture 그래프

블로그 방문: [Hyun Dev Blog](https://hyun7en.github.io)

For English version → [English](README.md)  
한국어 버전 → [한국어](README_KO.md)

---

## 기술 스택

**사이트 구현 스택:**
- Astro (Content Collections + MDX)
- React 아일랜드 — Architecture 그래프는 `@xyflow/react`
- GitHub Pages, GitHub Actions로 빌드/배포

**다루는 학습 주제:**
- Java, Spring Boot, JPA, Kafka 등

---

## Architecture

단순 카테고리 목록 대신, 홈 화면은 제가 공부하는 기술과 그걸 설명하는 블로그 글, 실제 구현 코드가 담긴 [TIL 저장소](https://github.com/Hyun7en/MY_PJT)를 연결하는 인터랙티브 그래프(Architecture → Technology → Concept)로 되어 있습니다. 설계 배경과 데이터 모델 전체는 [docs/architecture-blog-plan.md](docs/architecture-blog-plan.md)를 참고하세요.

---

## 사용 방법

- `npm install && npm run dev` — 로컬 개발 서버
- 블로그 글은 `src/content/posts/`(Markdown/MDX)에 위치
- Architecture/Technology/Concept 노드는 `src/content/nodes/`(YAML)에 위치
- `npm run build` — `dist/`로 정적 빌드, `main` 브랜치 푸시 시 GitHub Actions가 자동 배포

---

## 기여

개인 학습용 블로그이므로 기여는 예상하지 않습니다.  
하지만 학습 목적이라면 자유롭게 포크하거나 코드 참고가 가능합니다.
