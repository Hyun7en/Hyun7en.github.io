# Hyun Dev Blog

여기는 개발 공부와 프로젝트 실험 기록을 남기는 개인 블로그입니다.

---

## 소개

이 블로그는 개발 학습과 지식 공유를 목적으로 합니다:  
- 개인 프로젝트와 코딩 실험 기록  
- 학습 진행 상황과 기술 팁 공유  
- Jekyll, HTML/CSS/JS 등 웹 개발 도구 실습

블로그 방문: [Hyun Dev Blog](https://hyun7en.github.io)

For English version → [English](README.md)  
한국어 버전 → [한국어](README_KO.md)

---

## 기술 스택

**사이트 구현 스택 (현재):**
- Jekyll, HTML, CSS, JavaScript
- GitHub Pages

**다루는 학습 주제:**
- Java, Spring Boot, JPA, Kafka 등

---

## 로드맵

현재는 Jekyll 기반이지만, **Astro + MDX + React**로 이전하여 단순 카테고리 목록이 아닌 아키텍처/지식 그래프 기반의 인터랙티브한 구조로 재설계할 계획입니다.

핵심 이유는 앞으로 작성할 글에 벤치마크 차트, 코드 diff 같은 조작 가능한 위젯을 본문에 자연스럽게 삽입해야 하는데, Jekyll(Liquid)로는 이를 지원하기 어렵고 MDX는 React 컴포넌트를 포스트 본문에 그대로 끼워 넣을 수 있기 때문입니다.

현재 상태: **계획만 수립된 상태이며 구현은 아직 시작 전**입니다 — 자세한 설계 문서는 [docs/architecture-blog-plan.md](docs/architecture-blog-plan.md)를 참고하세요.

---

## 사용 방법

(현재 Jekyll 기준)

- 모든 콘텐츠는 Markdown으로 작성되어 쉽게 업데이트 가능  
- 레이아웃과 include로 페이지 구조, 헤더, 푸터, 스타일을 관리  
- 포스트는 `_posts/` 폴더에 저장

---

## 기여

개인 학습용 블로그이므로 기여는 예상하지 않습니다.  
하지만 학습 목적이라면 자유롭게 포크하거나 코드 참고가 가능합니다.
