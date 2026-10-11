# 0005. 글 위젯에 UI 프레임워크(React)를 쓰지 않는다

- 상태: 채택 ([0002](0002-astro-and-mdx.md)의 React 부분을 대체)
- 날짜: 2026-10-11

## 배경
React는 두 가지 이유로 들어왔다. Architecture 그래프(React Flow는 React 전용)와 글 안의 조작 가능한 위젯이다. 그래프가 사라진 뒤([0004](0004-tech-flow-instead-of-graph.md)) React를 쓰는 곳은 `BenchmarkChart` 하나였다. 그런데 이 컴포넌트는 상태도 이벤트도 없는 정적 막대였고, 그 글을 열면 React 런타임 `client.js`(빌드 결과 191KB, 압축 전)를 내려받았다.

## 결정
위젯은 Astro 컴포넌트로 만들고, 조작이 필요하면 컴포넌트 안에 짧은 `<script>`를 둔다. 현재 위젯 5종(`src/components/widgets/`)은 모두 이 방식이다.

- `BenchmarkChart`: 정렬, 최고 대비 배율 표시
- `CodeCompare`: Before/After/변경점 탭. 변경점은 빌드 시점에 LCS로 계산
- `Quiz`
- `Stepper`
- `NPlusOneCalculator`

## 검토한 대안
- **React 유지**: 기능은 같지만 정적 차트 하나 때문에 런타임과 의존성 5개(`@astrojs/react`, `react`, `react-dom`, 타입 2개)를 유지해야 한다.
- **Preact / Svelte**: 몇 KB로 가볍다. 상태가 많은 위젯이 생기면 그 위젯에만 도입한다.

## 결과
- 위젯이 있는 글에서도 사이트 자체 JS 파일 요청이 0이다. 위젯 스크립트는 페이지에 인라인으로 들어간다.
- 상태가 복잡한 위젯은 순수 JS로 쓰기 번거로워진다.
- 다시 볼 조건: React 전용 라이브러리가 꼭 필요할 때(예: 글 안에서 코드를 실행하는 Sandpack). Astro는 위젯 단위로 프레임워크를 붙일 수 있으므로 그 위젯에만 넣는다.
