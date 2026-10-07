---
title: "Node.js 26.11 살펴보기: --process-timeout과 histogram.diff()로 멈춘 프로세스와 지연 시간을 다루는 법"
date: 2026-10-08
category: Node.js
tags: [Node.js, Backend, Observability, CI]
description: Node.js 26.11.0에 추가된 --process-timeout, histogram.snapshot()/diff(), http.isValidHeaderName() 등 운영·진단 관련 API를 공식 문서 기준으로 정리하고 실무 적용 기준을 판단한다.
draft: true
---

> **요약**
> - Node.js 26.11.0(Current, 2026-10-07 릴리스)에는 "프로세스가 왜 안 끝나는가", "지연 시간 분포가 구간별로 어떻게 변했는가"를 다루는 진단용 API가 여럿 들어왔다.
> - `--process-timeout`은 종료되지 않는 프로세스를 종료 코드 124로 끝내면서, 그 시점에 이벤트 루프를 붙잡고 있던 리소스를 stderr에 찍어 준다. CI 행(hang) 디버깅에 바로 쓸 만하다.
> - `histogram.snapshot()`과 `histogram.diff()`는 `reset()` 없이 구간별 퍼센타일을 구하게 해 준다.
> - `http.isValidHeaderName()`/`isValidHeaderValue()`는 예외 대신 boolean을 돌려주는 검증 함수다.
> - 다만 `--process-timeout`은 공식 문서상 Stability 1.1(Active development)이다. 운영 서버의 안전장치로 쓰기 전에 한계를 알아야 한다.

## 왜 이 릴리스를 볼 만한가

릴리스 노트에서 눈에 띄는 기능은 대개 새 API 자체지만, 이번 26.11.0의 Notable Changes를 훑어보면 공통 주제가 있다. 새로운 비즈니스 로직용 기능이 아니라 **운영 중 문제를 관찰하고 끊어 내는 도구**가 많다는 점이다. 이 글은 그 흐름에서 실무와 가장 가까운 네 가지를 골라 다룬다.

이 글에서 내세우는 주장은 하나다. **"프로세스 타임아웃과 구간별 히스토그램은 APM 에이전트를 붙이기 어려운 곳(CI, 배치, 작은 서비스)에서 가장 가치가 크다."** 이는 공식 문서가 말하는 사실이 아니라 필자의 판단이며, 아래 TODO 실습으로 검증해야 하는 가설이다.

릴리스 노트 기준 26.11.0의 주요 변경은 다음과 같다(모두 SEMVER-MINOR 표기).

| 영역 | 변경 | 비고 |
| --- | --- | --- |
| buffer | `buffer.isLatin1()`, `Buffer.stringLength()` 추가 | 디코딩 전 길이 확인 |
| http | `isValidHeaderName()`, `isValidHeaderValue()` 추가 | 예외 대신 boolean |
| http2 | `connectionWindowSize` 옵션 추가 | 흐름 제어 조정 |
| perf_hooks | `histogram.snapshot()`, `histogram.diff()`, `monitorEventLoopDelay()` 해상도 잘림 수정 등 | 구간별 지연 분석 |
| process | `process.ref()`/`unref()` 안정화(stable) | |
| sqlite | `DatabaseSync`, `StatementSync` 이름 변경 | 릴리스 노트 항목명 기준, 세부는 문서 확인 필요 |
| CLI | `--process-timeout=N` 추가 | 아래에서 상세히 다룸 |
| 문서 | Alpine Linux를 tier 2 지원으로 승격 | 컨테이너 이미지 선택에 참고 |

## --process-timeout: 끝나지 않는 프로세스를 끝내고 이유를 남긴다

CI에서 테스트가 끝났는데 프로세스가 종료되지 않아 잡이 30분씩 매달려 본 적이 있다면 이 옵션의 용도를 바로 이해할 것이다. 공식 CLI 문서(v26.11.0) 기준 동작은 다음과 같다.

- 프로세스 시작 시점부터 `duration`이 지나도 실행 중이면 **종료 코드 124**로 종료한다. `timeout(1)` 명령과 같은 코드다.
- `duration`은 양의 정수 + 단위(`ms`, `s`, `m`, `h`)다. 예: `500ms`, `30s`, `5m`, `1h`.
- 종료 전에 메인 스레드가 무엇을 하고 있었는지, 이벤트 루프를 붙잡고 있던 리소스가 무엇인지 stderr에 출력한다.

공식 문서의 출력 예시는 다음 형태다(출처: Node.js v26.11.0 CLI 문서).

```console
$ node --process-timeout=5s server.js
(node:25418) Process timed out after 5s (--process-timeout). Exiting with code 124.
Main thread was not executing JavaScript.
Resources keeping the event loop alive:
    TCPServerWrap (listening on [::]:3000, fd 20)
    Timeout x2 (next due in 2931ms)
```

"왜 안 끝나는가"에 대한 답이 곧바로 나온다. 위 예시에서는 리스닝 소켓과 타이머 두 개가 이벤트 루프를 잡고 있다. 메인 스레드가 JavaScript를 실행 중이었다면 대신 스택 트레이스가 출력된다. 더 자세한 정보가 필요하면 `--report-on-process-timeout`을 함께 쓰면 진단 리포트(diagnostic report)가 생성된다. 이 옵션은 `--process-timeout`이 있어야 쓸 수 있다.

### 동작상 알아 둘 점 (공식 문서 기준)

1. **`'beforeExit'`과 `'exit'` 이벤트가 발생하지 않는다.** 종료를 막고 있는 원인이 JavaScript 코드일 수 있기 때문이다. 정리(cleanup) 로직을 `exit` 핸들러에 넣어 두었다면 타임아웃 시에는 실행되지 않는다고 봐야 한다.
2. 코드 커버리지와 프로파일(`NODE_V8_COVERAGE`, `--cpu-prof` 등)은 타임아웃 후에도 기록된다.
3. 메인 스레드가 2초 안에 응답하지 않으면(예: `child_process.execSync()`로 동기 블로킹 중) 스택 트레이스와 리소스 출력 없이 즉시 종료한다.
4. `NODE_OPTIONS`에서는 허용되지 않는다. 인스펙터 옵션(`--inspect` 등), `node inspect`, `--run`, `--build-snapshot`과도 같이 쓸 수 없다.
5. `fork()`로 만든 자식 프로세스가 `execArgv`를 상속하면 **자식은 자신의 시작 시점부터** 타임아웃을 센다. `--watch`에서는 감시 프로세스가 아니라 애플리케이션의 각 실행마다 적용된다. 테스트 러너는 전체 실행에 적용하고, 별도 프로세스로 도는 각 테스트 파일에도 적용한다.

이 중 `NODE_OPTIONS` 금지는 실무에서 걸림돌이 될 수 있다. 환경 변수로 일괄 주입하는 방식은 안 되고, 실행 명령에 직접 플래그를 붙이거나 `package.json`의 스크립트에 넣어야 한다.

```json
{
  "scripts": {
    "test:ci": "node --process-timeout=10m --report-on-process-timeout --test",
    "job:nightly": "node --process-timeout=1h dist/jobs/nightly.js"
  }
}
```

위 스크립트는 공식 문서의 옵션 설명을 조합한 예시이며, 필자가 이 구성을 실제로 실행해 본 것은 아니다. 아래 TODO에서 검증한다.

<!-- TODO(실습): --process-timeout=10s로 의도적으로 hang되는 스크립트(setInterval 방치, 닫지 않은 net.Server)를 만들어 stderr 출력 전문과 종료 코드(124)를 캡처하고, --report-on-process-timeout 리포트에 어떤 항목이 담기는지 확인 -->

| 실습 항목 | 기대(문서 기준) | 실제 결과 |
| --- | --- | --- |
| 닫지 않은 `net.Server`로 hang | 종료 코드 124, `TCPServerWrap` 출력 | TODO |
| `setInterval` 방치 | `Timeout` 리소스 출력 | TODO |
| `execSync('sleep 30')`로 동기 블로킹 | 2초 후 출력 없이 즉시 종료 | TODO |
| `process.on('exit')` 핸들러 | 호출되지 않음 | TODO |

## histogram.snapshot()과 diff(): reset() 없이 구간별 퍼센타일 보기

`perf_hooks`의 `monitorEventLoopDelay()`가 돌려주는 히스토그램은 누적 분포다. 서비스를 며칠 띄워 두면 최근 10초의 p99를 보고 싶어도 과거 값이 섞여 버린다. 그래서 지금까지는 주기적으로 `reset()`을 호출하는 방식을 썼는데, 이러면 다른 곳에서 같은 히스토그램을 읽는 코드와 충돌한다.

26.11.0에서 추가된 두 메서드는 이 문제를 다룬다. 공식 문서 기준 사양은 다음과 같다.

- `histogram.snapshot()`: 현재 상태(설정, 기록된 값, `exceeds` 카운트, EWMA 상태)를 복사한 **독립적인 새 Histogram**을 돌려준다. 이후 원본에 기록되는 값이나 `reset()` 호출은 스냅샷에 영향을 주지 않는다. 스냅샷에는 값을 기록할 수 없다.
- `histogram.diff(other)`: `other`(이전 스냅샷) 이후에 기록된 값만 담은 새 Histogram을 돌려준다. 두 히스토그램 모두 변경되지 않는다.

공식 문서의 예제는 다음과 같다(출처: Node.js v26.11.0 perf_hooks 문서).

```js
const { monitorEventLoopDelay } = require('node:perf_hooks');

const histogram = monitorEventLoopDelay();
histogram.enable();
let previous = histogram.snapshot();

setInterval(() => {
  const current = histogram.snapshot();
  // After a reset, use everything recorded since the reset.
  const delta = current.resetCount === previous.resetCount ?
    current.diff(previous) : current;
  console.log(delta.percentile(99));
  previous = current;
}, 10_000);
```

### 주의할 점

- 스냅샷은 모든 버킷을 복사하므로 **비용이 기록된 값의 개수가 아니라 `lowest`, `highest`, `figures` 설정에 비례**한다. 정밀도를 높게 잡았다면 짧은 주기로 스냅샷을 찍는 것이 부담이 될 수 있다.
- `diff()`는 다음 경우 예외를 던진다: 설정(`lowest`/`highest`/`figures`)이 다른 경우(`ERR_INVALID_ARG_VALUE`), 원본에서 값이 제거된 경우 즉 `resetCount`가 다른 경우(`ERR_INVALID_STATE`), 인자 순서가 뒤바뀌어 `other`에 없는 값이 포함된 경우(`ERR_INVALID_ARG_VALUE`).
- 반환된 diff 히스토그램의 `min`/`max`는 차이 버킷에서 계산되고, EWMA 상태는 없으며, `resetCount`는 0이다.

릴리스 노트에는 `monitorEventLoopDelay()`의 해상도 잘림(truncation) 수정과 `RecordableHistogram`이 0을 기록할 수 있게 된 변경도 함께 적혀 있다. 이전 버전에서 이벤트 루프 지연 수치를 대시보드로 보고 있었다면, 업그레이드 후 수치가 달라질 가능성이 있다. 다만 얼마나 달라지는지는 문서에 없으므로 직접 비교해야 한다.

<!-- TODO(실습): 동일 부하(autocannon 등)에서 Node 24.21.0과 26.11.0의 monitorEventLoopDelay p99를 비교하고, 10초 간격 snapshot/diff 호출이 CPU와 메모리에 주는 오버헤드를 figures=3, 5 두 설정에서 측정 -->

| 측정 항목 | figures=3 | figures=5 |
| --- | --- | --- |
| 스냅샷 1회 소요 시간 | TODO | TODO |
| 스냅샷 메모리 증가량 | TODO | TODO |
| 24.x 대비 p99 차이 | TODO | TODO |

## http.isValidHeaderName()과 isValidHeaderValue(): 예외 없는 헤더 검증

기존의 `http.validateHeaderName()`/`validateHeaderValue()`는 잘못된 입력이면 예외를 던진다. 프록시나 게이트웨이처럼 외부 입력을 그대로 헤더로 옮기는 코드에서는 "잘못된 입력이 흔한" 경로에서 예외를 쓰는 것이 부담이다. 새 함수는 같은 검사를 하되 boolean을 돌려준다. 공식 문서는 이를 "잘못된 입력이 예상되는 hot path에 적합하다"고 설명한다.

```js
import { isValidHeaderName, isValidHeaderValue } from 'node:http';

console.log(isValidHeaderName('X-Request-Id')); // true
console.log(isValidHeaderName('bad header'));   // false

console.log(isValidHeaderValue('text/html'));   // true
console.log(isValidHeaderValue('a\r\nb'));      // false (헤더 인젝션 방어에 유용)
console.log(isValidHeaderValue('a\x01b'));      // false
console.log(isValidHeaderValue('a\x01b', { httpValidation: 'relaxed' })); // true
```

위 값들은 공식 문서의 예제에서 가져왔다. 알아 둘 세부 사항은 다음과 같다.

- `isValidHeaderValue`는 `undefined`와 심볼을 항상 무효로 본다. 다른 비문자열 값은 `setHeader()`처럼 문자열로 변환한 뒤 검사한다(`123`은 `true`).
- `httpValidation` 옵션은 `'strict'`(기본값)와 `'relaxed'`를 받으며, `createServer()`/`request()`의 같은 옵션과 의미가 같다. 잘못된 옵션을 넘기면 예외가 발생한다.
- HTTP 메서드도 token이므로 `isValidHeaderName`으로 검증할 수 있다고 문서에 적혀 있다.

사용자 입력을 그대로 응답 헤더에 반영하는 코드(리다이렉트 `Location`, 사용자 정의 헤더 프록시)라면 `setHeader` 전에 이 함수로 거르는 패턴이 깔끔해진다.

## Buffer.stringLength()와 isLatin1(): 디코딩 전에 크기부터 확인

`Buffer.stringLength(input[, encoding])`은 `buf.toString(encoding)`이 만들 문자열의 길이(UTF-16 코드 유닛 수)를 **디코딩하지 않고** 돌려준다. `Buffer.byteLength()`의 반대 방향이다. 문서의 예제를 요약하면 `'€ 100'`을 UTF-8로 인코딩한 버퍼의 `stringLength`는 5, `'hex'`로 보면 14다. 문서는 결과가 상한으로 잘리지 않으므로, 디코딩하기 전에 `buffer.constants.MAX_STRING_LENGTH`와 비교해 디코딩 가능 여부를 먼저 판단하라고 안내한다.

```js
import { Buffer, constants } from 'node:buffer';

function safeDecode(buf) {
  if (Buffer.stringLength(buf) > constants.MAX_STRING_LENGTH) {
    throw new RangeError('payload too large to decode as string');
  }
  return buf.toString('utf8');
}
```

위 함수는 문서의 설명을 바탕으로 필자가 구성한 예시다. `isLatin1(input)`은 문자열이 Node.js의 `'latin1'` 인코딩으로 손실 없이 인코딩되는지(모든 코드 유닛이 `U+0000`~`U+00FF`인지) 검사한다. WHATWG의 `windows-1252` 정의와 다르다는 점에 주의해야 한다. 문서 예시로 `'\u0080'`은 true, `'€'`는 false다.

## 한계와 주의점

확정된 사실과 아직 모르는 것을 구분해 둔다.

**확정(공식 문서·릴리스 노트로 확인)**
- 위에 적은 API들은 v26.11.0에서 추가되었다.
- `--process-timeout`과 `--report-on-process-timeout`은 Stability 1.1(Active development)이다. 동작이 바뀔 수 있다.
- 26.x는 이 글을 쓰는 시점에 Current 라인이며, 같은 블로그 기준 최신 LTS는 24.21.0이다.

**불확실(문서에 없음, 직접 확인 필요)**
- 이 기능들이 이후 LTS 라인으로 백포트되는지는 확인하지 못했다.
- 성능 영향(스냅샷 비용, 타임아웃 감시 오버헤드)에 대한 수치는 문서에 없다.
- 릴리스 노트에 있는 sqlite 클래스 이름 변경의 구체적 내용은 이 글에서 확인하지 않았다. 사용 중이라면 해당 PR(#65988)과 문서를 직접 읽어야 한다.

참고로 릴리스 노트 페이지를 요약 도구로 읽을 때 코드 예제가 부정확하게 재구성되는 경우가 있었다(예: HTTP/2 옵션 예제에 관련 없는 모듈이 등장). 코드는 반드시 API 문서 원문과 대조하는 편이 안전하다.

## 실무 판단: 언제 쓰고 언제 쓰지 말까

| 상황 | 판단 | 이유 |
| --- | --- | --- |
| CI의 테스트·빌드 스크립트가 가끔 매달림 | **쓴다** | 종료 코드 124와 리소스 목록으로 원인 후보를 바로 얻는다 |
| 야간 배치 | **쓴다(상한 설정용)** | 무한 대기 방지. 단, `exit` 핸들러 정리가 안 돌아가는 점 확인 |
| 장기 실행 API 서버 | **쓰지 않는다** | 정상 동작 중에도 시간이 지나면 종료되는 옵션이다. 헬스체크와 오케스트레이터가 할 일이다 |
| `NODE_OPTIONS`로 옵션을 일괄 주입하는 환경 | **그대로는 불가** | 이 옵션은 `NODE_OPTIONS`에서 허용되지 않는다 |
| 이벤트 루프 지연을 직접 대시보드로 보는 서비스 | **시도해 볼 만함** | reset 없이 구간별 p99를 얻는다. 스냅샷 비용은 먼저 측정 |
| 프로덕션 핵심 경로에서 Stability 1.1 옵션 의존 | **보류** | 동작이 바뀔 수 있는 단계다 |

도입 체크리스트는 다음과 같다.

- [ ] 개발·CI 환경의 Node 버전을 26.11 이상으로 맞출 수 있는가(LTS 정책상 운영은 24.x인 팀이 많을 것이다)
- [ ] 타임아웃 시 `exit` 핸들러가 실행되지 않아도 문제가 없는가
- [ ] 자식 프로세스(`fork`, 테스트 파일별 프로세스)에도 타임아웃이 각각 적용되는 것이 의도에 맞는가
- [ ] 종료 코드 124를 CI가 실패로 처리하고 알림을 보내는가
- [ ] 히스토그램 스냅샷 주기와 `figures` 설정의 비용을 측정했는가

## 마치며

26.11.0의 기능들은 화려하진 않지만 "멈추면 이유를 알려 주고, 지연은 구간별로 보여 준다"는 방향이 분명하다. 운영 서버보다는 CI와 배치, 로컬 진단에서 먼저 써 보고, 위 TODO 표를 채워 본 뒤에 팀 표준으로 삼을지 판단하길 권한다. 실습 결과가 쌓이면 이 글의 가설(APM이 없는 환경에서 가치가 크다)을 확정하거나 수정할 예정이다.

## 참고

- [Node.js 26.11.0 (Current) 릴리스 노트](https://nodejs.org/en/blog/release/v26.11.0)
- [Node.js CLI 문서 v26.11.0 — `--process-timeout`, `--report-on-process-timeout`](https://github.com/nodejs/node/blob/v26.11.0/doc/api/cli.md)
- [Node.js perf_hooks 문서 v26.11.0 — `histogram.snapshot()`, `histogram.diff()`](https://github.com/nodejs/node/blob/v26.11.0/doc/api/perf_hooks.md)
- [Node.js http 문서 v26.11.0 — `isValidHeaderName()`, `isValidHeaderValue()`](https://github.com/nodejs/node/blob/v26.11.0/doc/api/http.md)
- [Node.js buffer 문서 v26.11.0 — `Buffer.stringLength()`, `buffer.isLatin1()`](https://github.com/nodejs/node/blob/v26.11.0/doc/api/buffer.md)
- [Node.js 블로그 목록](https://nodejs.org/en/blog)
