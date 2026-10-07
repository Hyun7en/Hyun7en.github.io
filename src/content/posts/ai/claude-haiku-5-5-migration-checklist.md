---
title: "Claude Haiku 5.5 출시: 싸진 가격보다 먼저 확인해야 할 마이그레이션 체크리스트"
date: 2026-10-08
category: AI
tags: [AI, LLM, Claude, API, Migration]
description: 2026-10-07 출시된 Claude Haiku 5.5의 가격·사양과 Haiku 4.5에서 올라올 때 깨지는 지점(thinking, 샘플링 파라미터, prefill, 토큰 수)을 공식 문서 기준으로 정리하고, 실제로 갈아탈지 판단하는 기준을 제안한다.
draft: true
---

> **요약**
> - Anthropic이 2026-10-07 Claude Haiku 5.5(`claude-haiku-5-5`)를 출시했다. 분류·라우팅·추출·서브에이전트처럼 물량이 많고 지연에 민감한 작업이 대상이다.
> - 공식 가격표 기준 입력 $0.10, 출력 $0.50 / MTok(프롬프트 10만 토큰 이하)로, Haiku 4.5($1 / $5)의 10분의 1 수준이다. 다만 같은 텍스트가 약 30% 더 많은 토큰으로 계산되므로 실질 절감폭은 이보다 작다.
> - 모델 ID만 바꾸면 되는 업그레이드가 아니다. `budget_tokens`, `temperature`/`top_p`/`top_k`, assistant prefill은 모두 400 오류를 낸다.
> - 같은 날 Sonnet 5.5의 캐시 읽기 가격도 $0.20에서 $0.10 / MTok으로 내려갔다. 모델 선택은 "가장 싼 모델"이 아니라 "캐시 적중률을 포함한 총비용"으로 다시 계산해야 한다.
> - 품질(정확도)은 이 글에서 다루지 않는다. 우리 데이터로 직접 측정해야 하는 부분은 TODO로 남겼다.

## 왜 개발자가 신경 써야 하나

작은 모델의 가격이 10분의 1이 되면 "LLM을 못 쓰던 자리"에 쓸 수 있게 된다. 로그 분류, 티켓 라우팅, 필드 추출, 에이전트의 보조 호출처럼 호출 횟수는 많고 건당 가치는 낮은 자리다. 그래서 이번 출시의 핵심은 성능 순위가 아니라 **단가 구조가 바뀐다**는 점이다.

반대로 이미 Haiku 4.5로 돌아가는 서비스에는 위험한 소식이기도 하다. 공식 마이그레이션 가이드는 Haiku 4.5용 코드가 Haiku 5.5에서 그대로 깨질 수 있다고 명시한다. 글의 나머지는 (1) 무엇이 확정된 사실인지, (2) 어디가 깨지는지, (3) 갈아탈 가치가 있는지를 순서대로 다룬다.

## 확정된 사양과 가격

아래 내용은 모두 Anthropic의 모델 개요 및 가격 문서에 적힌 값이다.

| 항목 | Haiku 4.5 | Haiku 5.5 |
| --- | --- | --- |
| 모델 ID(Claude API) | `claude-haiku-4-5` | `claude-haiku-5-5` (날짜 접미사·별도 alias 없음) |
| 입력 / 출력 (MTok) | $1 / $5 | $0.10 / $0.50 (≤100k 토큰 프롬프트) |
| 긴 프롬프트 | 해당 없음 | 10만 토큰 초과 시 $0.50 / $2.50 |
| 캐시 읽기 (MTok) | $0.10 | $0.01 (≤100k) / $0.05 (>100k) |
| Batch API | 50% 할인 | 50% 할인 |
| 컨텍스트 / 최대 출력 | 이 글에서 미확인 | 1M / 128K 토큰 |
| thinking | `budget_tokens` 방식 | adaptive (기본 켜짐), 기본 effort `medium` |
| 토크나이저 | 이전 세대 | Claude 4.7 이후와 동일(같은 텍스트 약 30% 더 많은 토큰) |

눈여겨볼 점이 둘 있다.

- **가격이 프롬프트 길이에 따라 두 단계다.** 다른 최신 모델들은 1M 컨텍스트 전체에 동일 단가를 적용하는데, Haiku 5.5는 10만 토큰을 넘기면 단가가 5배가 된다. 긴 문서를 통째로 넣는 용도라면 표의 첫 줄 가격을 그대로 믿으면 안 된다.
- **Priority Tier는 Haiku 5.5에서 지원되지 않는다.** Haiku 4.5로 Priority Tier 약정을 쓰고 있다면 용량 계획을 따로 세워야 한다고 가이드가 밝힌다.

가용 플랫폼은 Claude API, Amazon Bedrock(`anthropic.claude-haiku-5-5`), Claude Platform on AWS, Google Cloud, Microsoft Foundry다. 문서상 퇴역은 2027-10-07 이전에는 없다.

## "10분의 1"은 실제로 얼마나 싼가

토큰이 30% 늘어난다는 점을 반영해 단순 계산해 보자. 같은 텍스트를 보낸다고 가정하면 입력 비용 비는 다음과 같다. (공식 단가에서 직접 계산한 값이며, 출력·thinking 토큰은 반영하지 않았다.)

```text
Haiku 4.5 : 1.00 × $1.00        = $1.00   (기준)
Haiku 5.5 : 1.30 × $0.10        = $0.13   → 약 7.7배 저렴
```

출력도 같은 식으로 $5 → 1.3 × $0.5 = $0.65 수준이다. 여기에 **adaptive thinking이 기본으로 켜져 있어 thinking 토큰이 출력 요금으로 붙는다**는 변수가 있다. 단순 분류에 thinking이 얼마나 쓰이는지는 effort 설정과 프롬프트에 달렸으므로 직접 재야 한다.

<!-- TODO(실습): 우리 서비스의 실제 프롬프트 100건 샘플로 Haiku 4.5 vs 5.5의 usage(input/output/thinking 토큰)와 건당 비용을 측정해 아래 표를 채운다. -->

| 측정 항목 | Haiku 4.5 | Haiku 5.5 (effort=low) | Haiku 5.5 (effort=medium) |
| --- | --- | --- | --- |
| 평균 input_tokens | TODO | TODO | TODO |
| 평균 output_tokens(thinking 포함) | TODO | TODO | TODO |
| 건당 비용($) | TODO | TODO | TODO |
| p50 / p95 지연(ms) | TODO | TODO | TODO |

## 깨지는 지점 5가지와 고치는 법

공식 마이그레이션 가이드의 체크리스트를 코드 관점에서 다시 정리한다. 요청 예시는 가이드의 before/after를 요약한 것이다.

### 1. thinking 설정

`thinking: {"type": "enabled", "budget_tokens": N}`은 400 오류다. adaptive로 바꾸고 `output_config.effort`로 깊이를 조절한다.

```json
{
  "model": "claude-haiku-5-5",
  "max_tokens": 16000,
  "thinking": { "type": "adaptive" },
  "output_config": { "effort": "medium" },
  "messages": [{ "role": "user", "content": "..." }]
}
```

(출처: Anthropic, Claude Haiku 5.5 migration guide)

부수 효과가 여럿 있다.

- `thinking`을 안 보내도 응답이 `thinking` 블록으로 시작할 수 있다. `content[0].text`로 답을 읽는 코드는 깨진다. **블록을 `type`으로 골라 읽어야 한다.**
- thinking 토큰도 `max_tokens`에 포함된다. 작은 `max_tokens`를 쓰던 호출은 thinking 블록 뒤에서 `stop_reason: "max_tokens"`로 끊겨 텍스트가 비어 올 수 있다.
- thinking 블록의 `thinking` 필드는 기본적으로 비어 있고 `signature`만 온다. 요약을 받으려면 `"display": "summarized"`를 지정한다.
- Haiku 4.5에서 thinking 없이 돌렸다면, 낮은 effort를 고르는 것이 가이드의 방향이다.

### 2. 샘플링 파라미터

`temperature`는 보낸다면 반드시 `1`, `top_p`는 기본값 `0.99`여야 하고, `top_k`는 어떤 값이든 400이다. 둘을 같이 보내도 오류다. 결정적인 출력이 필요해 `temperature: 0`을 쓰던 분류 파이프라인은 **파라미터를 지우고 프롬프트·구조화 출력으로 안정성을 확보**해야 한다.

### 3. assistant prefill 제거

`messages`의 마지막이 assistant 턴이면 thinking을 꺼도 400이다. 용도별 대체안은 가이드에 정리되어 있다.

| prefill 용도 | 대체 방법 |
| --- | --- |
| 출력 형식 강제(JSON 등) | structured outputs, 분류는 enum 필드가 있는 tool |
| 군말 제거 | 시스템 프롬프트에 "바로 답하라" 명시 |
| 끊긴 응답 이어쓰기 | user 메시지에 "이전 응답이 `…`에서 끊겼다. 이어서 작성하라" |
| 맥락 상기 | user 턴에 포함 |

`{`로 시작시키는 prefill로 JSON을 받던 코드가 가장 흔한 사례일 것이다. 이 경우 structured outputs로 옮기는 편이 파싱 실패율 면에서도 낫다. (Amazon Bedrock은 structured outputs를 지원하지 않아 tool을 쓰라고 가이드가 안내한다.)

### 4. 토큰 재계산

`max_tokens`, 비용 알림 임계값, 컨텍스트 자르기 로직이 모두 "토큰 수" 기준이면 30% 가까이 어긋난다. 토큰 카운팅 API를 호출할 때 `model`을 `claude-haiku-5-5`로 지정해 새로 센다.

### 5. 대화 이력과 thinking 블록 관리

- Haiku 5.5의 thinking 블록은 **생성한 계정(또는 연결된 계정)에서만 유효**하다. 다른 계정으로 재전송하면 API가 조용히 블록을 버린다. 요청은 성공하지만 추론이 빠진 채로 흘러간다. 여러 고객의 대화를 한 저장소에서 다른 키로 재생하는 서비스라면 주의해야 한다.
- thinking 블록을 되돌려 보낼 때 앞선 `system`, `tools`, 이전 `messages`가 바뀌었다면 400이다. 대화를 **append-only**로 유지해야 한다. 2026-08-31 이전 생성 계정은 `thinking.block_binding.prefix_mismatch_behavior`를 설정한 요청에서만 오류가 난다고 가이드는 적고 있다.
- 안전 분류기가 요청을 거절하면 `stop_reason: "refusal"`이 오고, 서버 측 fallback이 없다. 호출부에서 처리해야 한다.

computer use를 쓰는 경우 Claude API·Google Cloud에서는 `computer_toolset_20260801` 툴셋으로 옮겨야 하고, 이전 `computer_20250124`는 400이다.

### 마이그레이션 체크리스트

- [ ] 모델 ID를 플랫폼별로 교체했다
- [ ] 토큰 카운트와 `max_tokens`, 비용 추정을 새 모델 기준으로 다시 잡았다
- [ ] `budget_tokens` 제거, `thinking: adaptive` + `effort` 지정
- [ ] 응답 파싱이 `content[0]`이 아닌 `type` 기반이다
- [ ] `temperature`/`top_p`/`top_k` 제거
- [ ] assistant prefill 제거, structured outputs 또는 tool로 이전
- [ ] `stop_reason: "refusal"` 처리 추가
- [ ] 대화 이력 재생 시 계정 일치와 append-only 보장
- [ ] Priority Tier 사용 여부 확인

가이드는 Claude Code에서 `/claude-api migrate this project to claude-haiku-5-5`를 실행하면 모델 ID 교체와 파라미터 수정을 자동으로 적용해 주고 수동 확인 목록까지 만들어 준다고 소개한다. 적용 범위를 먼저 묻고 파일을 고치는 방식이다. 그래도 diff 리뷰는 사람이 해야 한다.

## 같은 날의 또 다른 변화: 캐시 가격

같은 날 릴리스 노트에는 Sonnet 5.5의 캐시 읽기 가격이 $0.20에서 $0.10 / MTok으로 내려갔다는 항목도 있다. 입력 단가의 0.05배다(다른 모델 대부분은 0.1배). 캐시 쓰기와 다른 가격은 그대로다.

공식 가격 문서에 따르면 5분 캐시는 쓰기 비용이 1.25배라 한 번만 읽혀도 본전이고, 1시간 캐시는 쓰기가 2배라 두 번 읽혀야 본전이다. 큰 시스템 프롬프트를 반복 사용하는 워크로드라면 캐시 적중률에 따라 "싼 작은 모델 + 캐시 없음"보다 "중간 모델 + 높은 캐시 적중"이 총비용에서 유리할 수도 있다. 이건 가정이 아니라 계산해 볼 문제다.

```python
# 공식 문서의 automatic caching 예제 형태 (모델만 교체)
response = client.messages.create(
    model="claude-sonnet-5-5",
    max_tokens=1024,
    cache_control={"type": "ephemeral"},
    system="...",
    messages=[{"role": "user", "content": "..."}],
)
u = response.usage
# 캐시 적중 확인: cache_read_input_tokens / cache_creation_input_tokens
print(u.cache_read_input_tokens, u.cache_creation_input_tokens, u.input_tokens)
```

(출처: Anthropic, Prompt caching 문서의 예제를 요약·변형. 최소 캐시 가능 길이는 모델별로 다르며 Haiku 5.5와 Sonnet 5.5는 512 토큰이라고 문서에 적혀 있다.)

<!-- TODO(실습): 우리 시스템 프롬프트(약 N토큰)로 Haiku 5.5(캐시 읽기 $0.01)와 Sonnet 5.5(캐시 읽기 $0.10)의 요청당 총비용을 캐시 적중률 0%/50%/90%에서 계산·실측한다. -->

| 시나리오 | Haiku 5.5 건당 | Sonnet 5.5 건당 | 정확도(자체 평가셋) |
| --- | --- | --- | --- |
| 캐시 적중 0% | TODO | TODO | TODO |
| 캐시 적중 50% | TODO | TODO | TODO |
| 캐시 적중 90% | TODO | TODO | TODO |

## 한계와 주의점

- **품질은 확인되지 않았다.** 이 글은 가격·사양·API 변경만 근거로 한다. 공식 개요 문서에는 "분류, 라우팅, 추출, 서브에이전트" 용도라는 설명만 있다. 우리 업무에서의 정확도는 직접 평가셋으로 재야 한다. (시스템 카드가 공개되어 있으나 이 글에서는 읽지 않았다.)
- **입력은 텍스트와 이미지, 출력은 텍스트**다. 그 밖의 모달리티를 기대하면 안 된다.
- **10만 토큰 이상은 단가 5배.** 긴 컨텍스트 용도에는 맞지 않을 수 있다.
- **지연 시간 수치는 문서에 "가장 빠름"이라는 상대 표현뿐**이다. 실제 p95는 effort와 출력 길이에 좌우된다.

## 실무 판단: 언제 갈아타고 언제 두나

**갈아탈 만한 경우**
- 호출량이 많고 정답이 비교적 명확한 분류·추출·라우팅이다. 단가 절감이 코드 수정 비용을 빠르게 넘는다.
- 이미 structured outputs나 tool 기반으로 형식을 강제하고 있다. 깨지는 지점이 적다.
- Batch API로 처리할 수 있는 비실시간 작업이다. 50% 추가 할인이 겹친다.

**두거나 보류할 경우**
- prefill, `temperature: 0`, `top_k` 등에 로직이 깊게 얽혀 있다. 테스트를 먼저 만들어야 한다.
- Priority Tier 용량에 의존한다.
- 평균 프롬프트가 10만 토큰을 넘는다.
- Haiku 4.5의 퇴역 일정이 급하지 않다면, 평가셋을 만든 뒤 점진적으로 이동해도 늦지 않다. 퇴역 일정은 공식 deprecations 문서에서 확인한다.

**권장 순서**: (1) 트래픽 일부를 섀도 호출로 5.5에 흘려 비용·지연·결과 차이를 로깅 → (2) 평가셋으로 정확도 비교 → (3) effort를 낮춰 비용을 더 줄일 수 있는지 확인 → (4) 카나리아 전환.

## 참고

- Claude Haiku 5.5 모델 개요: https://platform.claude.com/docs/en/models/haiku-5-5/overview
- Claude Haiku 5.5 마이그레이션 가이드: https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide
- Anthropic 가격 문서: https://platform.claude.com/docs/en/about-claude/pricing
- Prompt caching 문서: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Claude Platform 릴리스 노트(2026-10-07 항목): https://platform.claude.com/docs/en/release-notes/overview
