---
title: "iPhone Duo 출시 2주 전: UIScreen.main과 orientation 분기부터 걷어내는 대응 체크리스트"
date: 2026-10-09
category: iOS
tags: [iOS, Swift, UIKit, SwiftUI, Xcode, App Store]
description: Apple이 2026-10-05 개발자 뉴스로 공지한 iPhone Duo 대응 가이드를 공식 문서 기준으로 정리한다. SDK 버전별 동작 차이, 깨지기 쉬운 코드 패턴, 테스트 방법, 2027년 4월 스크린샷 요건을 체크리스트로 묶고 실무 우선순위를 제안한다.
draft: true
---

> **요약**
> - Apple은 2026-10-05 개발자 뉴스에서 iPhone Duo가 2026-10-23부터 고객에게 제공된다고 공지했다. 기존 앱도 실행은 되지만, 어떤 SDK로 빌드했느냐에 따라 화면 활용 방식이 달라진다.
> - 공식 가이드의 핵심은 "화면 크기와 방향을 기기 기준으로 가정하는 코드"를 없애는 것이다. `UIScreen.main`, `UIDevice.current.orientation`, `userInterfaceIdiom`, 특정 기기 높이 비교가 대표적인 점검 대상이다.
> - iOS 27.1 SDK로 빌드하면 툴바와 탭 바가 세로로 배치되는 최적화된 모드가 적용된다. 이 SDK로 배포하기 전에 콘텐츠가 그 변화를 견디는지 확인해야 한다.
> - 2027년 4월부터는 신규 제출 앱에 iPhone Duo용 스크린샷이 필요하다. 코드 대응과 별개로 App Store 에셋 일정도 잡아야 한다.
> - 이 글은 Apple 공식 문서에 적힌 내용만 근거로 한다. 실제 기기 동작과 성능은 직접 측정해야 하는 부분을 TODO로 남겼다.

## 왜 지금 이 공지를 읽어야 하나

폴더블 대응은 "언젠가 하면 되는 일"로 미뤄지기 쉽다. 이번 공지가 다른 이유는 날짜가 구체적이기 때문이다. 공식 뉴스 글은 출시일을 2026-10-23으로 적었고, 대응용 도구(Xcode 27.1, 시뮬레이터, App Store Connect 미리보기 도구)도 이미 공개되어 있다고 안내한다. 준비 기간이 길지 않다.

더 중요한 점은 영향 범위다. 공식 준비 페이지는 "모든 앱이 iPhone Duo에서 실행된다"고 밝힌다. 즉 대응을 하지 않아도 앱은 뜨지만, 아래에서 보듯 최적화되지 않은 상태로 노출된다. 이 글의 주장은 단순하다. 신규 기능을 만들 필요는 없고, 크기·방향·기기 종류를 가정하는 코드를 먼저 걷어내는 것이 가장 비용 대비 효과가 크다.

## SDK 버전에 따라 앱이 어떻게 보이나

공식 준비 페이지는 빌드 SDK에 따라 세 단계로 설명한다.

| 빌드 SDK | iPhone Duo에서의 동작 (Apple 문서 요약) |
| --- | --- |
| iOS 26 SDK 이하 | 실행은 되지만 모든 레이아웃에 적응하지 않는다. 펼친 상태에서는 화면 중앙에 앱 창이 뜨고 주변이 비며, 접은 상태에서는 외부 디스플레이에서 상태 표시줄과 카메라 왼쪽 영역에 콘텐츠가 표시된다. |
| iOS 27 SDK | 안쪽 디스플레이 대부분을 채우도록 크기가 조정되지만, 오른쪽 가장자리의 상태 표시줄은 피한다. 빈 공간은 줄어든다. |
| iOS 27.1 SDK 이상 | iPhone Duo에 최적화된다. 앱이 전체 디스플레이를 쓰고, 툴바와 탭 바가 상태 표시줄 아래에 세로로 나타난다. |

문서가 따로 강조하는 문장이 있다. iOS 27.1 SDK로 빌드해 배포하기 전에, 앱 콘텐츠가 바(bar)가 세로로 바뀌는 상황에 적응하는지 확인하라는 것이다. 이 변화는 코드를 안 바꿔도 SDK만 올리면 따라오는 변화라서, "SDK 업그레이드 = 안전한 작업"이라는 습관이 가장 위험한 지점이다.

## 먼저 할 일: 공식 스킬로 스캔하기

Apple 문서의 1단계는 Xcode의 코딩 어시스턴트에 "get my app ready for iPhone Duo"라고 요청하는 것이다. 어시스턴트가 앱 리사이즈 대응 스킬을 실행해 문제 패턴을 찾고, 각 항목에 대해 원인 설명과 수정안을 제시한다고 한다. 다른 코딩 에이전트를 쓴다면 터미널에서 아래 명령으로 스킬을 내보내 사용할 수 있다고 안내한다.

```bash
xcrun agent skills export
```

다만 문서 스스로 "대부분의 문제는 찾지만 전부는 아니다"라고 적었다. 스킬 결과를 정답으로 보지 말고, 아래 패턴 목록으로 직접 한 번 더 검색하는 것이 안전하다.

## 깨지기 쉬운 코드 패턴 4가지

### 1. 메인 화면 기준 크기 계산

iPhone Duo에서는 접고 펼칠 때마다 앱 크기가 바뀌고, 그 크기가 화면 크기와 항상 일치하지도 않는다. 공식 문서는 프로젝트에서 `UIScreen.main`을 검색해 다음처럼 바꾸라고 한다.

- `UIScreen.main.bounds` 대신 `view.bounds` 또는 `window.bounds`를 쓴다. SwiftUI에서는 `GeometryReader` 또는 `onGeometryChange`를 쓴다.
- 크기는 실행 시점에 한 번만 읽지 않는다. 세션 도중 접기/펼치기로 크기가 바뀔 수 있으므로 `layoutSubviews`, `viewDidLayoutSubviews`에서 레이아웃하고, 크기 변화에 맞춰 실행할 작업은 `viewWillTransition(to:with:)`에 둔다.
- 스케일은 `traitCollection.displayScale`(UIKit) 또는 `@Environment(\.displayScale)`(SwiftUI)에서 가져온다.
- 윈도는 `UIWindow(frame: UIScreen.main.bounds)` 대신 `UIWindow(windowScene:)`으로 만든다.
- `UIScreen`을 저장해 두지 말고 `view.window?.windowScene?.screen`으로 필요할 때 접근한다.

아래는 위 지침을 따른 예시 코드다. Apple 샘플이 아니라 이 글을 위해 작성한 것이며, 컴파일과 동작은 직접 확인해야 한다.

```swift
// Before: 시작 시점의 메인 화면 크기를 고정값처럼 사용
// let width = UIScreen.main.bounds.width

// After: 현재 뷰가 가진 공간을 레이아웃 시점마다 읽는다
final class FeedViewController: UIViewController {
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        let isWide = view.bounds.width > view.bounds.height
        updateLayout(isWide: isWide)
    }

    private func updateLayout(isWide: Bool) {
        // 열 개수, 여백 등 크기 의존 로직
    }
}
```

SwiftUI에서도 같은 원칙이다. 아래도 예시용 코드이며, 공식 문서가 언급한 `onGeometryChange`의 정확한 시그니처는 사용 중인 SDK 문서에서 확인해야 한다.

```swift
struct FeedView: View {
    @State private var isWide = false

    var body: some View {
        content
            .onGeometryChange(for: Bool.self) { proxy in
                proxy.size.width > proxy.size.height
            } action: { newValue in
                isWide = newValue
            }
    }

    private var content: some View { Text(isWide ? "wide" : "narrow") }
}
```

### 2. 방향(orientation)으로 레이아웃 결정

문서는 iPhone Duo에서 기기 방향이 앱의 모양을 알려주지 않는다고 설명한다. 다음 속성에 의존한 레이아웃 로직은 제거 대상이다.

- `UIDevice.current.orientation`
- `statusBarOrientation`
- `interfaceOrientation` (`windowScene.effectiveGeometry.interfaceOrientation` 포함)

가로로 넓은지 판단하려면 방향 대신 "지금 가진 공간의 너비와 높이"를 비교하라고 한다. 뷰 컨트롤러에서는 `view.bounds`, 뷰에서는 `superview.bounds`, SwiftUI에서는 `GeometryReader`가 주는 크기다.

### 3. idiom과 size class로 기기를 추정

iPhone Duo와 크기 조절이 가능한 iPhone 미러링 때문에, iPhone 앱이 어떤 size class 조합도 가질 수 있다. 문서가 안쪽 디스플레이에서는 앱이 iPad 레이아웃의 자연스러운 확장처럼 보여야 한다고 적은 이유다. 점검 항목은 다음과 같다.

- `userInterfaceIdiom == .phone` / `== .pad`로 레이아웃을 고르는 코드를 찾는다. 대신 size class나 가용 공간을 기준으로 한다.
- `horizontalSizeClass == .regular`를 "iPad"로 간주해 iPad 전용 레이아웃을 보여주는 코드, iPhone은 항상 compact라고 가정하는 코드를 찾는다. 이제 iPhone에서도 그 레이아웃이 실행될 수 있다.
- `bounds.height == 844` 같은 특정 크기 비교나 알려진 iPhone 크기 목록은 iPhone Duo와 맞지 않는다.
- 전체 화면 미디어(`.scaleAspectFill`, `.aspectRatio(contentMode: .fill)`)는 넓은 화면에서 중요한 부분이 잘릴 수 있다. 현재 size class나 화면 비율로 fill/fit을 고르거나 초점(focal point)을 지정한다.

### 4. 세로로 바뀌는 툴바와 탭 바 (27.1 SDK)

앞 절의 표에서 본 것처럼, 27.1 SDK로 빌드하면 바가 세로로 배치된다. 커스텀 탭 바, 하단에 고정된 CTA 버튼, 바 높이를 하드코딩한 inset 계산이 있다면 콘텐츠가 가려지거나 어긋날 수 있다. 시스템 컴포넌트 위주의 앱보다 커스텀 내비게이션이 많은 앱이 먼저 확인해야 한다. 다만 구체적으로 어떤 커스텀 UI가 어떻게 깨지는지는 공식 문서가 나열하지 않았다.

<!-- TODO(실습): 27.1 SDK로 빌드한 뒤 iPhone Duo 시뮬레이터에서 커스텀 탭 바/하단 고정 버튼/safe area inset 사용 화면을 캡처해 가려짐 여부를 기록 -->

## 테스트 방법 3가지

공식 3단계는 크기 조절 테스트다. 문서가 제시한 도구는 세 가지다.

| 도구 | 용도 | 내가 확인한 결과 |
| --- | --- | --- |
| Device Hub의 iOS resizable 시뮬레이터 | 임의 크기 변화에 대한 레이아웃 확인 | TODO |
| macOS 27의 iPhone 미러링 | 창을 양방향 극단 크기까지 조절 | TODO |
| Xcode 27.1의 iPhone Duo 시뮬레이터 | 네이티브 경험 전체 확인. 문서가 가장 좋은 방법이라고 명시 | TODO |

<!-- TODO(실습): 위 표의 세 도구로 같은 화면 3~5개를 돌려 발견한 레이아웃 결함 수와 유형(클리핑, 늘어남, 빈 공간)을 표에 채우기 -->

Apple은 접기/펼치기가 세션 도중 일어난다는 점을 반복해서 강조한다. 따라서 "펼친 상태로 앱 시작"과 "앱을 쓰다가 접기"를 따로 테스트하는 것이 좋다. 후자는 상태 복원, 스크롤 위치, 키보드 표시 중 크기 변화 같은 문제를 드러낼 가능성이 높다. 이는 공식 문서의 직접 서술이 아니라 위 설명에서 이끌어 낸 테스트 시나리오 제안이다.

<!-- TODO(실습): 앱 사용 중 접기/펼치기 시 입력 중이던 텍스트, 스크롤 위치, 재생 중인 미디어, 모달 상태가 유지되는지 확인 -->

## App Store 쪽 일정

코드 대응과 별개로 두 가지를 챙겨야 한다. 공식 뉴스 글 기준이다.

- iPhone Duo에 최적화된 앱과 게임은 지금도 App Store Connect에 제출할 수 있다.
- 2027년 4월부터는 제출하는 모든 앱과 게임에 iPhone Duo용 스크린샷이 필요하다.
- 최신 기기용 스크린샷과 앱 프리뷰 사양이 갱신되었고, App Store Connect에는 iPhone Duo에서 에셋이 어떻게 보이는지 확인하는 미리보기 도구가 추가되었다.
- 방향별 화면을 보여주는 스크린샷과 프리뷰를 준비하면 상품 페이지에 iPhone Duo 지원을 알릴 수 있다. 피처링 추천(featuring nomination) 시 "Helpful Details"에서 iPhone Duo 최적화와 모든 자세(pose) 지원 여부를 적을 수 있다고 안내한다.

4월까지 시간이 있다고 해서 미루면, 디자이너 일정과 심사 대기 시간이 겹칠 수 있다. 스크린샷 제작 시점을 별도 일정으로 빼 두는 편이 낫다.

## 한계와 불확실한 부분

이 글이 확정적으로 말할 수 없는 부분을 구분해 둔다.

- 공식 문서에 없는 내용은 쓰지 않았다. 하드웨어 사양, 가격, 성능은 이 글의 범위 밖이다.
- 27.1 SDK의 세로 바 배치가 서드파티 커스텀 UI에 미치는 영향은 문서에 구체 사례가 없다. 직접 확인해야 한다.
- "이 패턴이 있으면 반드시 깨진다"가 아니라 "깨질 수 있다"는 수준의 점검 목록이다. 앱마다 실제 영향은 다르다.
- 공식 스킬은 일부 문제를 놓칠 수 있다고 문서가 명시했다.
- Xcode 27.1은 공개 시점에 따라 베타 또는 릴리스 후보일 수 있다. 준비 페이지에는 Release Candidate로 표기되어 있었지만, 배포 가능한 정식판인지는 직접 확인해야 한다.

## 실무 판단: 어디까지 할 것인가

개인 의견이다. 우선순위를 세우면 다음과 같다.

1. **필수 (모든 앱)**: `UIScreen.main`, `UIDevice.current.orientation`, 특정 기기 크기 비교 검색과 제거. 비용이 낮고 iPad 멀티태스킹이나 iPhone 미러링에서도 이득이다.
2. **필수 (SDK를 27.1로 올릴 앱)**: 커스텀 바와 하단 고정 UI의 세로 바 배치 확인.
3. **권장**: idiom 분기 제거와 size class 기반 레이아웃 전환. iPad 레이아웃이 이미 있는 앱은 안쪽 디스플레이에서 그 레이아웃을 재사용하는 편이 자연스럽다고 문서가 시사한다.
4. **선택**: 피처링 추천, 방향별 마케팅 에셋. 2027년 4월 스크린샷 요건은 선택이 아니다.

반대로, 앱이 iPhone 세로 고정이고 UI를 전부 시스템 컴포넌트로 만든 소규모 앱이라면 위 1번 검색 결과가 비어 있는 것만 확인하고 넘어가도 된다. 최적화 모드를 바로 목표로 삼기보다, 먼저 깨지지 않는 상태를 확보하는 것이 순서다.

## 마무리 체크리스트

- [ ] `UIScreen.main` 사용처 검색 및 교체
- [ ] `UIDevice.current.orientation`, `statusBarOrientation`, `interfaceOrientation` 기반 레이아웃 제거
- [ ] `userInterfaceIdiom`, `horizontalSizeClass == .regular` 가정 점검
- [ ] 특정 기기 크기 하드코딩 제거
- [ ] fill 모드 미디어의 잘림 확인
- [ ] 27.1 SDK 빌드에서 세로 툴바/탭 바 확인
- [ ] 세 가지 테스트 도구로 접기/펼치기 시나리오 검증
- [ ] 2027년 4월 전까지 iPhone Duo 스크린샷 제작 일정 확보

## 참고

- Apple Developer News, "Prepare and submit your apps for iPhone Duo" (2026-10-05): https://developer.apple.com/news/?id=kkphp5qo
- Apple Developer, "Three steps to make your app shine on iPhone Duo": https://developer.apple.com/iphone-duo/prepare/
- Apple Developer, "Get ready for iPhone Duo": https://developer.apple.com/iphone-duo/
- Apple Developer News, "Build for iPhone Duo with new resources" (2026-09-18): https://developer.apple.com/news/?id=nyuppv9r
