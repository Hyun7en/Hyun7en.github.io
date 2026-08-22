# Architecture-Based Developer Knowledge Blog (v2)

## 1. Project Overview

GitHub Pages 기반의 개발 블로그를 구축한다.

일반적인 카테고리형 개발 블로그가 아니라, **개발 아키텍처를 인터랙티브하게 탐색하면서 기술, 개념, 블로그 글, 실제 구현 코드(TIL Repository)를 연결하는 개발 지식 시스템**을 목표로 한다.

핵심 구조:

```text
Architecture
    ↓
Technology
    ↓
Concept
    ├── Blog
    └── TIL Repository
            ↓
          Code
```

---

## 2. Core Concept

### Architecture
전체 개발 시스템과 기술의 관계를 시각적으로 표현한다.

### Blog
학습한 기술과 개념을 깊이 있게 정리한다. 텍스트뿐 아니라 벤치마크 차트, 코드 비교 탭 같은 **조작 가능한 위젯**을 포스트 본문에 자연스럽게 포함한다.

### TIL Repository
실제로 코드를 작성하고 실험한 결과를 저장한다.

```text
Architecture
      │
      ▼
Technology
      │
      ▼
Concept
   ┌──┴──┐
   ▼     ▼
 Blog    TIL
          │
          ▼
         Code
```

---

# 3. User Experience

## 3.1 Initial Screen

블로그에 접속하면 일반적인 글 목록이 첫 화면이 아니라 **전체 개발 아키텍처**를 보여준다. 단, 개별 Blog 포스트는 검색엔진에 정상 색인될 수 있도록 독립된 URL을 유지한다. Architecture 뷰는 홈의 탐색 진입점이지 유일한 경로가 아니다.

각 요소는 클릭 가능한 Node다.

## 3.2 / 3.3 / 3.4 (기존과 동일)

Architecture Node → Technology → Concept로 드릴다운한다.

`MVCC`처럼 하나의 Technology에만 속하는 Concept는 Blog/TIL이 그대로 표시된다. `Transaction`처럼 여러 Technology(Spring, PostgreSQL, MySQL, Distributed System)에 걸치는 Concept는, **어느 Technology 경로로 진입했는지에 따라 해당 관점(context)의 Blog/TIL을 우선 표시**하고, 나머지 관점은 "다른 기술에서 보기"로 접어서 보여준다.

---

# 4. Content Model

## 4.1 Architecture
전체 지식을 탐색하기 위한 지도(Map). 관계와 위치만 보여주고 상세 설명은 담지 않는다.

## 4.2 Technology
기술 또는 제품을 나타낸다.

## 4.3 Concept

특정 기술에 대한 세부 개념을 나타낸다. Concept는 하나의 Technology에만 속한다고 가정하지 않는다.

```text
Transaction
├── Spring
├── PostgreSQL
├── MySQL
└── Distributed System
```

**다중 소속 규칙**: Concept 노드 자체는 하나만 존재한다(그래프 탐색·"관련 개념 추천" 기능이 노드 단위로 동작하기 때문). 대신 그 노드에 딸린 `articles`/`til`은 배열이며, 각 항목에 어느 기술 관점(`context`)인지를 태그한다. 즉 "Transaction이라는 개념은 하나"지만 "그걸 설명하는 글은 관점별로 여러 개" 있을 수 있다는 뜻이다.

---

# 5. Blog

개념, 동작 원리, 내부 구조, 트레이드오프, 실제 사용 사례, 직접 구현한 결과, 성능 테스트, 문제 해결 과정, TIL 코드 설명을 다룬다.

Blog는 TIL의 내용을 복사하는 공간이 아니라 **TIL에서 실제로 구현·실험한 내용을 기반으로 더 정리된 기술 문서를 작성**하는 공간이다.

벤치마크 결과나 코드 버전 비교처럼 조작이 필요한 내용은 MDX 안에 React 컴포넌트(아일랜드)로 삽입한다. 예: `<BenchmarkChart data="..." />`, `<CodeDiff before="..." after="..." />`.

---

# 6. TIL Repository

실제 코드를 작성하고 실험하는 저장소. Blog Repository에 코드를 복사하지 않고, **코드의 Source of Truth**로 사용한다.

```text
TIL/
├── Java/JVM/GC/
├── Database/PostgreSQL/MVCC/
│   ├── MVCCTest.java
│   ├── TransactionTest.java
│   └── benchmark/
└── Redis/Cache/
```

---

# 7. Blog와 TIL의 관계

> TIL은 실제 구현과 실험의 공간이다. Blog는 그 결과를 정리하고 설명하는 공간이다.

---

# 8. Example — PostgreSQL MVCC

```text
┌─────────────────────────────────┐
│ PostgreSQL / MVCC               │
├─────────────────────────────────┤
│ Blog                             │
│ PostgreSQL MVCC 이해하기         │
│                                  │
│ Implementation                   │
│ MVCCTest.java / TransactionTest.java │
│                                  │
│ Benchmark (interactive)          │
│ MVCC Benchmark                   │
│                                  │
│ Related Concepts                 │
│ Transaction / Snapshot / Isolation Level │
└─────────────────────────────────┘
```

---

# 9. Data Model

핵심 데이터 모델은 `Node`, `Relation`, `Article`, `TIL`로 구성한다. `articles`와 `til`은 리스트이며 각 항목은 선택적으로 `context`(어느 기술 관점인지)를 가진다.

**단일 Technology에 속하는 Concept (MVCC)**:

```yaml
id: postgresql-mvcc
name: MVCC
type: concept
parent:
  - postgresql

articles:
  - path: /database/postgresql/mvcc

til:
  - repository: TIL
    path: Database/PostgreSQL/MVCC

related:
  - transaction
  - snapshot
  - isolation-level
```

**여러 Technology에 걸치는 Concept (Transaction)**:

```yaml
id: transaction
name: Transaction
type: concept
parent:
  - spring
  - postgresql
  - mysql
  - distributed-system

articles:
  - context: spring
    path: /backend/spring/transaction
  - context: postgresql
    path: /database/postgresql/transaction

til:
  - context: spring
    repository: TIL
    path: Spring/Transaction
  - context: postgresql
    repository: TIL
    path: Database/PostgreSQL/Transaction

related:
  - mvcc
  - isolation-level
```

`context`가 없는 항목은 "모든 관점 공통"으로 취급한다.

---

# 10. Graph Structure

Node 간의 관계는 frontmatter(`parent`, `related`)만을 단일 소스로 삼는다. 별도의 relations 파일을 두지 않고, 빌드 시점에 모든 Node의 frontmatter를 모아 그래프(JSON)를 파생시킨다. 두 곳에 관계를 중복 기록하면 노드가 늘어날수록 동기화가 깨지기 때문이다.

```text
Node
  │
  ├── parent
  ├── related
  ├── articles (context별)
  └── til (context별)
```

하나의 Concept가 여러 Technology와, 하나의 Blog가 여러 Concept와 연결될 수 있는 **many-to-many** 관계를 지원한다. children/그래프의 역방향 엣지는 전부 빌드 스크립트가 계산한다(손으로 유지하지 않는다).

---

# 11. Repository Structure

## Blog Repository (Astro 기반)

```text
blog/
├── src/
│   ├── content/
│   │   ├── posts/           # Blog 글 (Markdown/MDX)
│   │   │   ├── database/
│   │   │   ├── backend/
│   │   │   └── infrastructure/
│   │   ├── nodes/           # Architecture/Technology/Concept 정의 (frontmatter, 단일 소스)
│   │   └── config.ts        # Astro Content Collections 스키마 (zod)
│   │
│   ├── components/
│   │   ├── ArchitectureGraph/  # React Flow 기반, client:load 아일랜드
│   │   ├── BenchmarkChart/     # 포스트 내 삽입용 아일랜드
│   │   ├── CodeDiff/
│   │   └── NodeDetailPanel/
│   │
│   ├── pages/
│   │   ├── index.astro         # Architecture 홈
│   │   ├── posts/[...slug].astro
│   │   └── architecture/[id].astro
│   │
│   └── scripts/
│       └── build-graph.ts      # content/nodes → graph.json 생성 (relations 파일 대체)
│
├── public/
├── astro.config.mjs
└── package.json
```

## TIL Repository

별도 유지, 코드의 원본(Source of Truth). Blog Repository와 합치지 않는다.

```text
TIL/
├── Java/
├── Spring/
├── Database/
├── Redis/
├── Kafka/
└── ...
```

---

# 12. GitHub Integration

Blog는 TIL 코드를 복사하지 않고, TIL Repository의 실제 파일/디렉터리를 링크한다.

추가: 빌드 시점에 `til.path`가 실제로 TIL Repository에 존재하는지 GitHub API로 검증하는 링크 체커를 최소한으로 넣는다. 경로 문자열만 믿고 링크를 거는 건 TIL 쪽 구조가 바뀌면 조용히 깨지기 때문이다.

---

# 13. Automation

초기 구현에서는 자동화보다 데이터 구조와 인터랙션을 먼저 안정화한다. `build-graph.ts`(11절)는 "자동화 기능"이 아니라 핵심 빌드 스텝이며, TIL Push 감지 후 Node를 자동 생성/갱신하는 것은 이후 단계로 유지한다.

```text
TIL Repository Push → GitHub Actions → TIL Directory 분석
→ Node frontmatter 생성/갱신 → Blog Build → GitHub Pages Deploy
```

---

# 14. Technology Stack

```text
Framework
└── Astro (Content Collections + MDX)

Interactive Islands
├── React (client:load / client:visible)
├── Architecture Graph → React Flow (수동 좌표)
└── 포스트 내 위젯 (Benchmark Chart, Code Diff 등)

Content
└── Markdown / MDX

Build
└── Astro build + astro.config.mjs

Hosting
└── GitHub Pages

CI/CD
└── GitHub Actions (astro build → dist 배포)

Source
├── Blog Repository (Astro)
└── TIL Repository (코드 원본)
```

서버와 데이터베이스는 사용하지 않는다. 콘텐츠와 관계 데이터는 Git Repository에서 관리하고 정적 빌드 과정에서 생성한다.

**변경 이유**: 벤치마크/데모 같은 조작 가능한 위젯이 포스트마다 반복적으로 들어갈 계획이므로, 포스트 본문에 React 컴포넌트를 자연스럽게 끼워 넣을 수 있는 MDX 기반 프레임워크가 필요하다. Jekyll(Liquid)은 이 용도에 맞지 않는다. 또한 현재 포스트가 1개뿐이라 지금이 마이그레이션 비용이 가장 낮은 시점이다.

---

# 15. Architecture UI Requirements

* 전체 아키텍처를 시각적으로 표시 (React Flow)
* 각 Node는 클릭 가능
* Node 클릭 시 하위 Node 또는 상세 정보 표시
* Node 위치는 **MVP 단계에서 수동 좌표**(`x`, `y`를 frontmatter에 지정)로 배치한다. 자동 레이아웃 엔진(dagre/elk)은 노드가 30~40개를 넘어가는 시점에 재검토한다.
* Zoom / Pan (React Flow 기본 제공)
* 모바일 대응
* 필요하면 Architecture와 Knowledge Graph를 별도 View로 제공

---

# 16. Node Detail UI

Node를 선택하면 상세 패널을 표시한다. `Related Blog`/`TIL`은 여러 개(context별)일 수 있다.

```text
┌──────────────────────────────────┐
│ PostgreSQL                       │
│                                  │
│ Database                         │
│                                  │
│ Description                     │
│ PostgreSQL 관련 설명             │
│                                  │
│ Concepts                         │
│ ├── MVCC                         │
│ ├── Index                        │
│ ├── Transaction                  │
│ └── Query Planner                │
│                                  │
│ Related Blog                     │
│ └── PostgreSQL 내부 구조         │
│                                  │
│ TIL / Code                       │
│ └── GitHub Repository            │
│                                  │
└──────────────────────────────────┘
```

---

# 17. Development Flow

```text
기술 학습
    ↓
TIL Repository
    ↓
코드 작성
    ↓
실험 / 테스트
    ↓
결과 확인
    ↓
Blog 작성
    ↓
Concept 연결
    ↓
Architecture Node 연결
```

---

# 18. Final User Flow

사용자는 카테고리를 검색해서 글을 찾는 것이 아니라 **실제 개발 시스템의 구조를 따라가면서 지식을 탐색**한다.

---

# 19. Design Principles

1. **Architecture First** — 진입점은 카테고리가 아니라 Architecture
2. **TIL is the Source of Truth for Code**
3. **Blog Explains the Code**
4. **Graph over Tree** — 단, 그래프 관계는 frontmatter 하나에서 파생시키고 별도 파일로 중복 관리하지 않는다
5. **Static First** — 서버/DB 없이 Astro 정적 빌드
6. **MDX-Native** — 포스트 안에 인터랙티브 위젯이 반복적으로 들어가므로 처음부터 MDX 기반으로 설계한다 *(신규 추가)*
7. **Automation Later** — Data Model → Architecture UI → Node Interaction → Blog Integration → TIL Integration → GitHub Actions Automation 순서로 개발

---

# 20. MVP Scope

### Architecture
- [ ] Astro 기반 Architecture 홈 페이지
- [ ] React Flow 그래프 (수동 좌표)
- [ ] Node 클릭 / 상세 패널
- [ ] Node 확장/축소
- [ ] Zoom / Pan

### Knowledge
- [ ] Technology / Concept Content Collection 스키마
- [ ] `build-graph.ts` (frontmatter → graph.json)
- [ ] Concept Relation (`related`)
- [ ] 다중 소속 Concept의 context별 articles/til 표시

### Blog
- [ ] MDX 기반 포스트
- [ ] Blog ↔ Concept 연결
- [ ] 최소 1개의 인터랙티브 위젯(Benchmark Chart 등) 프로토타입

### TIL
- [ ] TIL Repository 링크
- [ ] TIL 경로 존재 여부 검증(빌드 시)

### Deployment
- [ ] GitHub Pages
- [ ] GitHub Actions (astro build → deploy)

---

# 21. Future Features

- [ ] Knowledge Graph View
- [ ] 전체 기술 관계 시각화
- [ ] 기술 검색 / Concept 검색 / Architecture 검색
- [ ] 관련 개념 추천
- [ ] TIL Repository 자동 분석 / GitHub API 연동 / TIL 변경 감지
- [ ] Blog ↔ TIL 자동 연결
- [ ] 학습 Roadmap / 기술별 학습 진행률
- [ ] Interactive Architecture
- [ ] Code Preview / Code Diff / 변경 이력 표시

---

# 22. Project Definition

> **Architecture를 시작점으로 기술과 개념을 탐색하고, 정리된 Blog와 실제 구현한 TIL 코드를 연결하는 개인 개발 지식 그래프 기반 블로그.** Astro + MDX 기반으로 구축하여, 포스트 본문에도 벤치마크·데모 같은 인터랙티브 위젯을 자연스럽게 포함한다.
