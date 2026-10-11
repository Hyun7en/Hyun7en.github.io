# 0007. Google Fonts 대신 Pretendard와 JetBrains Mono를 직접 제공한다

- 상태: 채택
- 날짜: 2026-10-11

## 배경
Google Fonts에서 Inter, Noto Sans KR, JetBrains Mono 세 가족을 불러왔다. 그래서 페이지마다 외부 서버 요청이 생기고, 방문자의 접속 정보가 Google로 넘어갔다. 본문에는 한글과 라틴 문자에 서로 다른 폰트를 섞어 쓰고 있었다.

## 결정
- 본문: **Pretendard**(npm `pretendard`). 한글과 라틴 문자를 한 가족으로 처리한다. 동적 서브셋 CSS를 써서 페이지에 쓰인 글자 범위의 파일만 내려받는다.
- 코드: **JetBrains Mono**(`@fontsource-variable/jetbrains-mono`). 코드가 있는 페이지에서만 내려받는다.
- 두 폰트 모두 OFL-1.1 라이선스다.

## 검토한 대안
- **시스템 폰트만 사용**: 가장 가볍지만 OS마다 모양이 달라진다. 특히 Windows의 한글 기본 폰트 품질이 아쉽다.
- **Google Fonts 유지**: 설정이 가장 쉽지만 외부 요청과 개인정보 문제가 남는다.

## 결과
- 외부 폰트 요청이 0이다. 홈, 글, 로드맵에서 직접 확인했다.
- 폰트 파일이 빌드 결과에 포함되어 `dist`가 약 3MB 커졌다. 방문자가 내려받는 건 그중 필요한 서브셋뿐이다.
