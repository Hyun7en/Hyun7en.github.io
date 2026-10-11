# 0009. PR마다 타입 검사와 빌드를 실행한다

- 상태: 채택
- 날짜: 2026-10-11

## 배경
배포 워크플로는 `main` 푸시 때만 돌았다. 그래서 PR 단계에서는 아무 검사도 없었다. 타입 검사도 하지 않아서 `astro check`를 처음 돌렸을 때 오류가 있었다.

## 결정
- `npm run check`(`astro check`)를 추가한다. 개발 의존성은 `@astrojs/check`, `typescript` 6.x다. `@astrojs/check`가 TypeScript 5·6만 지원하기 때문이다.
- 새 워크플로 `.github/workflows/ci.yml`이 모든 PR에서 `npm ci` → 타입 검사 → 빌드를 실행한다.
- 배포 워크플로에도 빌드 전에 타입 검사를 넣는다.

## 결과
- 데이터 검증([0003](0003-content-in-git-with-build-time-validation.md))과 타입 오류가 머지 전에 걸린다.
- 남은 경고: `astro:content`의 `z`가 deprecated라는 힌트가 남아 있다. Astro가 권장하는 import로 옮길지는 별도로 정한다.
