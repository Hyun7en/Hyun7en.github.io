---
title: "모델 ID 하드코딩을 끝낼 때: Claude Models API의 capabilities·line 필드로 모델 선택 코드 짜기"
date: 2026-10-09
category: AI
tags: [AI, LLM, Claude, API, Models API]
description: 2026-10-01~06 사이 Anthropic Models API에 추가된 line, thinking.types.disabled, server_tools 필드가 무엇을 알려주는지 공식 문서 기준으로 정리하고, 모델 ID 분기 코드를 capability 조회 기반으로 바꾸는 방법과 한계를 다룬다.
draft: true
---

> **요약**
> - Anthropic 릴리스 노트에 따르면 `GET /v1/models`와 `GET /v1/models/{model_id}` 응답에 10월 1일 `line`, 10월 5일 `capabilities.thinking.types.disabled`, 10월 6일 `capabilities.server_tools`가 차례로 추가됐다.
> - 의미는 단순하다. "이 모델이 `thinking: {type: "disabled"}`를 받는가", "web search·code execution 서버 툴을 받는가", "어느 모델 라인(haiku, sonnet, opus 등)에 속하는가"를 문자열 파싱 없이 API로 물어볼 수 있다.
> - 최근 모델 출시마다 "코드가 400으로 깨진다"는 마이그레이션 항목이 늘었다. 모델 ID별 `if` 분기를 쌓는 대신 capability를 조회해 요청을 조립하면 새 모델이 나와도 수정 범위가 줄어든다.
> - 단, 문서가 직접 밝히듯 `supported: true`가 "요청이 성공한다"를 보장하지는 않는다. 조직 설정, effort 조합 등 다른 이유로 여전히 거절될 수 있다.
> - 조회 비용·캐시 주기·실제 응답 값은 직접 측정해야 한다. 그 부분은 TODO로 남겼다.

## 왜 개발자가 신경 써야 하나

최근 Claude 모델 릴리스 노트를 읽어보면 같은 패턴이 반복된다. 2026-09-22 Opus 5.5 출시 때는 thinking을 끌 수 없고 특정 computer use 툴 버전이 400을 낸다는 항목이 있었고, 09-28 Sonnet 5.5 때는 강제 툴 사용(`any`, `tool`)이 400을 낸다는 항목이, 10-07 Haiku 5.5 때는 `budget_tokens`가 400을 낸다는 항목이 있었다. 모델이 바뀔 때마다 "어떤 파라미터를 받는가"가 달라진다는 뜻이다.

이 상황에서 흔한 대응은 모델 ID에 기대는 코드다.

```ts
// 흔히 보는 안티패턴: 모델 ID 문자열로 기능 지원을 추정한다
if (model.startsWith("claude-haiku-4")) {
  params.thinking = { type: "disabled" };
}
```

새 모델이 나오면 이 분기를 사람이 찾아 고쳐야 하고, 놓치면 운영 중 400이 난다. 이번에 추가된 필드는 이 추정을 API 응답으로 대체하라는 신호로 읽힌다. 공식 문서도 `line`에 대해 "ID에서 추론하지 말고 필드를 읽으라"고 안내한다. 이 글은 (1) 새 필드가 정확히 무엇을 보장하는지, (2) 코드를 어떻게 바꿀 수 있는지, (3) 어디까지 믿으면 안 되는지를 순서대로 정리한다.

## 새로 생긴 필드: 확정된 사실

아래는 모두 Anthropic의 릴리스 노트, Models API 레퍼런스, 모델 개요 문서에 적힌 내용이다.

| 날짜 | 필드 | 알려주는 것 |
| --- | --- | --- |
| 2026-10-01 | `line` | 모델이 속한 라인. 예: Opus 4.5와 4.6은 모두 `opus`. 라인이 없으면 `null`. 레퍼런스상 값은 `haiku`, `sonnet`, `opus`, `fable`, `mythos`이며 앞으로 추가될 수 있다. |
| 2026-10-05 | `capabilities.thinking.types.disabled` | 모델이 `thinking: {type: "disabled"}`를 받는지. 문서상 "400을 받는 경우에만 false"이고, thinking 자체를 지원하지 않는 모델에서는 true다. |
| 2026-10-06 | `capabilities.server_tools` | web search, code execution 서버 툴 지원 여부. `supported`는 둘 중 하나라도 받으면 true. |

같은 응답에는 이전부터 있던 필드도 있다. 레퍼런스에 나온 것만 추리면 `max_input_tokens`, `max_tokens`, `lifecycle`(`active`/`deprecated`/`retired`), `deprecated_at`, `retires_at`, 그리고 `capabilities` 아래의 `batch`, `citations`, `code_execution`, `context_management`, `effort`, `image_input`, `pdf_input`, `structured_outputs`, `thinking`이다. 레퍼런스는 `capabilities`의 키가 "알려진 모든 capability에 대해 항상 존재한다"고 설명한다.

공식 문서가 특히 강조하는 구분이 하나 있다. 최상위 `capabilities.code_execution`과 `capabilities.server_tools.code_execution`은 **다른 질문**이다.

- `server_tools.code_execution`: 모델이 code execution 툴 자체를 받는가.
- 최상위 `code_execution`: 그 툴 안에서 Claude가 돌리는 코드가 요청의 다른 툴을 호출할 수 있는가(programmatic tool calling 같은 경우).

문서의 예시는 Haiku 4.5다. 이 모델은 `server_tools.code_execution.supported`가 `true`, 최상위 `code_execution.supported`가 `false`로 보고된다. 둘을 혼동하면 "코드 실행은 되는 모델인데 programmatic tool calling을 켰더니 실패하는" 상황이 생긴다.

## 직접 조회해 보기

공식 문서의 요청 예시는 다음과 같다(출처: List Models 레퍼런스).

```bash
curl https://api.anthropic.com/v1/models \
    -H 'anthropic-version: 2023-06-01' \
    -H "X-Api-Key: $ANTHROPIC_API_KEY"
```

쿼리 파라미터로 `limit`(기본 20, 최대 1000), 커서용 `after_id`/`before_id`, 그리고 `lifecycle`(`active`, `deprecated`, `retired` 중 최대 3개)을 받는다. `lifecycle`을 생략하면 `active`와 `deprecated` 모델이 나오고, `retired`는 명시적으로 요청해야만 나온다. 자격 증명이 여러 워크스페이스에 걸쳐 쓰일 때는 `anthropic-workspace-id` 헤더로 워크스페이스를 고를 수 있다.

필요한 필드만 보려면 `jq`로 추리는 것이 빠르다. 아래는 위 응답 구조를 전제로 내가 만든 예시이며, 실제 출력은 아래 TODO 표에 채울 항목이다.

```bash
curl -s "https://api.anthropic.com/v1/models?limit=100" \
  -H 'anthropic-version: 2023-06-01' \
  -H "X-Api-Key: $ANTHROPIC_API_KEY" \
| jq -r '.data[] | [.id, .line, .lifecycle,
    .capabilities.thinking.types.disabled.supported,
    .capabilities.server_tools.web_search.supported,
    .capabilities.server_tools.code_execution.supported] | @tsv'
```

<!-- TODO(실습): 위 jq 명령을 실제 키로 실행해 현재 노출되는 모델 전체의 line / thinking.types.disabled / server_tools 값을 표로 채운다. 특히 Opus 5.5·Fable 5.1(문서상 thinking 상시 켜짐)이 disabled=false로 나오는지, Haiku 4.5가 문서 예시대로 server_tools.code_execution=true, code_execution=false로 나오는지 확인한다. -->

| 모델 | line | lifecycle | thinking.types.disabled | server_tools.web_search | server_tools.code_execution | 최상위 code_execution |
| --- | --- | --- | --- | --- | --- | --- |
| claude-opus-5-5 | TODO | TODO | TODO | TODO | TODO | TODO |
| claude-sonnet-5-5 | TODO | TODO | TODO | TODO | TODO | TODO |
| claude-haiku-5-5 | TODO | TODO | TODO | TODO | TODO | TODO |
| claude-haiku-4-5 | TODO | TODO | TODO | TODO | TODO | TODO |

## 코드는 이렇게 바꿀 수 있다

아이디어는 "모델 ID로 추정하지 말고, 요청을 만들기 직전에 capability로 확인한다"이다. 아래 TypeScript는 레퍼런스의 응답 구조를 기반으로 한 내 예시다. 타입은 필요한 부분만 최소로 적었고, 공식 SDK 타입을 쓸 수 있으면 그쪽을 쓰는 편이 낫다.

```ts
type Cap = { supported: boolean };
type ModelInfo = {
  id: string;
  line: string | null;
  lifecycle: "active" | "deprecated" | "retired";
  capabilities: {
    thinking: { supported: boolean; types: { disabled: Cap; adaptive: Cap; enabled: Cap } };
    server_tools: { supported: boolean; web_search: Cap; code_execution: Cap };
  } | null; // 레퍼런스상 capabilities는 null일 수 있다
};

async function listModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch("https://api.anthropic.com/v1/models?limit=1000", {
    headers: { "anthropic-version": "2023-06-01", "x-api-key": apiKey },
  });
  if (!res.ok) throw new Error(`models list failed: ${res.status}`);
  return (await res.json()).data;
}

// "빠르고 싼 호출: 가능하면 thinking을 끄고, 못 끄면 건드리지 않는다"
function buildThinking(m: ModelInfo) {
  const canDisable = m.capabilities?.thinking.types.disabled.supported ?? false;
  return canDisable ? { thinking: { type: "disabled" as const } } : {};
}

// "웹 검색이 필요한 작업: 지원하는 모델만 후보로"
function webSearchCandidates(models: ModelInfo[]) {
  return models.filter(
    (m) => m.lifecycle === "active" && m.capabilities?.server_tools.web_search.supported,
  );
}

// 모델 피커: ID를 파싱하지 말고 line으로 묶는다
function groupByLine(models: ModelInfo[]) {
  const groups = new Map<string, ModelInfo[]>();
  for (const m of models) {
    const key = m.line ?? "other"; // 새 line 값이 생겨도 깨지지 않게
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  return groups;
}
```

몇 가지 설계 포인트는 문서 내용에서 곧바로 나온다.

- `line`의 값 집합을 열거형으로 고정하지 않는다. 문서가 "라인이 추가될 수 있으니 값 집합을 고정된 것으로 취급하지 말라"고 했다. 위 예시에서 `string | null`로 받고 `null`은 별도 그룹으로 보낸 이유다.
- `lifecycle`은 따로 확인한다. `deprecated`는 기존 조직에는 호출 가능하지만 신규 사용에는 닫혀 있고, `retired`는 호출이 실패한다. 레퍼런스는 `retires_at`이 과거인 `deprecated` 모델이 "철회가 이미 일어났다"가 아니라 "철회가 지연됐다"는 뜻이며, 철회 신호는 `lifecycle`이라고 밝힌다. 날짜가 아니라 `lifecycle`을 기준으로 삼아야 한다.
- 조회 결과가 없거나 `capabilities`가 `null`이면 보수적으로 "지원 안 함"으로 처리한다. 위 `?? false`가 그 의미다.

## 한계와 주의점

**1. `supported: true`는 성공 보장이 아니다.** 문서는 두 곳에서 이를 명시한다. `thinking.types.disabled`가 true여도 해당 모델이 허용하지 않는 effort 수준과 조합하면 400이 날 수 있다. `server_tools`가 true여도 관리자가 web search를 꺼 둔 조직이라면 요청이 실패한다. 즉 capability 조회는 "보낼 가치가 있는 요청인가"를 거르는 필터이지, 요청 검증기가 아니다. 에러 처리와 폴백은 여전히 필요하다.

**2. 범위가 제한적이다.** `server_tools`는 web search와 code execution만 다룬다. 문서가 web fetch 같은 다른 서버 툴은 포함하지 않는다고 적었다. 모델 ID로 지원 여부를 따져야 하는 기능은 여전히 남아 있다. 이번에 추가된 필드가 모든 400 케이스를 덮는다고 가정하면 안 된다.

**3. "무엇이 400을 내는가" 전부를 알려주지는 않는다.** 예컨대 Sonnet 5.5의 강제 툴 사용 제한이나 Haiku 5.5의 `budget_tokens` 제한이 `capabilities`의 어느 필드로 표현되는지는 내가 읽은 문서만으로는 확인되지 않았다. `thinking.types.enabled`가 `budget_tokens` 방식에 대응하는 것으로 보이지만, 레퍼런스의 설명은 "caller-set budget_tokens를 쓰는 extended thinking을 받는가"라는 범위에서만 확정된다. 그 밖의 매핑은 추측하지 않는다. 마이그레이션 가이드를 계속 읽어야 하는 이유다.

**4. 호출 빈도와 비용.** 이 엔드포인트를 요청마다 호출하라는 뜻이 아니다. 문서에 속도 제한이나 권장 캐시 주기는 적혀 있지 않았다. 앱 기동 시 또는 주기적으로 조회해 메모리에 두는 방식이 자연스럽지만, 그 주기를 얼마로 할지는 직접 정해야 한다.

<!-- TODO(실습): GET /v1/models 응답 시간과 페이로드 크기(limit=1000 기준)를 10회 측정해 기동 시 1회 조회가 현실적인지 확인한다. 응답 헤더에 rate limit 정보가 있는지도 확인한다. -->

| 측정 항목 | 값 |
| --- | --- |
| GET /v1/models 평균 응답 시간 | TODO |
| 응답 크기(limit=1000) | TODO |
| 응답 헤더의 rate limit 정보 | TODO |

## 실무 판단: 언제 쓰고 언제 쓰지 말까

**쓰는 쪽이 맞는 경우**

- 여러 모델을 라우팅하는 서비스(작업별로 Haiku·Sonnet·Opus를 섞는 구조). 모델 목록이 바뀔 때마다 분기를 고치는 비용이 가장 크다.
- 사용자가 모델을 고르는 UI. `line`으로 묶고 `lifecycle`로 deprecated를 표시하면 ID 파싱 로직이 사라진다.
- 모델 교체 작업(예: 문서상 2026-11-30에 철회되는 Sonnet 4.5에서의 이전)을 CI에서 점검하고 싶은 경우. 배포 파이프라인에서 쓰는 모델의 `lifecycle`과 `retires_at`을 읽어 경고를 띄우는 식으로 활용할 수 있다.

**굳이 쓰지 않아도 되는 경우**

- 모델 하나를 고정해서 쓰는 작은 서비스. 어차피 모델을 바꿀 때 마이그레이션 가이드를 읽고 코드를 한 번 고친다. 그때 조회 로직을 추가하는 비용이 더 클 수 있다.
- 요청 하나하나의 지연이 극히 중요한 경로. 조회를 매번 끼우는 설계는 피하고, 기동 시 캐시해 두거나 아예 정적 설정으로 두는 편이 낫다.

**점검 체크리스트**

- [ ] 코드 안의 `model.startsWith(...)`, `model.includes("haiku")` 같은 ID 파싱을 모두 찾았다.
- [ ] `line` 값을 열거형으로 고정한 곳이 없다(미지의 값은 `other` 등으로 처리).
- [ ] `capabilities`가 `null`이거나 필드가 없을 때의 기본 동작이 보수적이다.
- [ ] capability 확인을 통과한 요청도 400을 받을 수 있다는 전제로 에러 처리가 있다.
- [ ] 최상위 `code_execution`과 `server_tools.code_execution`을 구분해서 읽고 있다.
- [ ] 사용 중인 모델의 `lifecycle`/`retires_at`을 주기적으로 확인한다.

## 마무리

이번 변화는 새 모델 기능이 아니라 "모델을 쓰는 코드를 덜 취약하게 만들 도구"가 생겼다는 소식이다. 모델 릴리스 주기가 짧아지고 릴리스마다 호환성 항목이 생기는 상황에서, ID 문자열 기반 분기를 capability 조회로 옮기는 일은 비용 대비 효과가 괜찮아 보인다. 다만 이 필드들은 모든 거절 사유를 설명하지 못하므로 "조회로 거르고, 에러 처리로 받는다"의 두 단계를 같이 가져가야 한다. 실제 응답 값과 호출 비용은 위 TODO 표를 직접 채운 뒤 판단하면 된다.

## 참고

- Anthropic, Release notes (2026-10-01, 10-05, 10-06, 09-22, 09-28, 10-07 항목): https://platform.claude.com/docs/en/release-notes/overview
- Anthropic, List Models API 레퍼런스: https://platform.claude.com/docs/en/api/models/list
- Anthropic, Models overview — Using the Models API: https://platform.claude.com/docs/en/models/overview
