# BLOOM PLAYGROUND

게임 전시 페이지: [BLOOM PLAYGROUND](https://byh-playground.github.io/bloom-world/playground/)

이 폴더의 **`index.html`만** 전시 사이트의 원본입니다. 게임 파일이나 배포용 번들은 여기에 복사하지 않습니다.

## 릴리즈 표시

- 각 게임의 공개 GitHub 저장소에서 고유 Git 태그를 조회합니다. `vMAJOR.MINOR.PATCH`는 Stable, `nightly-YYYYMMDDTHHMMSSZ-SHA12`는 Nightly입니다.
- `전체 게임`은 Stable 우선, 없으면 Nightly입니다. 채널 탭은 해당 태그를 가진 게임만 표시합니다. 게임 상세에서 양 채널을 바꿀 수 있습니다.
- Nightly는 현재 개발 스냅샷으로서 **정상 작동을 보장하지 않습니다.** Stable은 명시적 검증 및 승인 태그만 표시합니다. 태그가 없거나 조회가 실패하면 Stable이라고 추정하지 않습니다.
- 태그 시점의 원본 `index.html`은 현재 GitHack 정적 CDN(`rawcdn.githack.com`)에서 프리뷰합니다. 이는 타사 무료 서비스이며 장애, CORS, 외부 스크립트 로딩 문제는 게임 자체의 문제와 구분합니다.
- 기존 GitHub Pages 링크는 대체 실행 경로이지만 선택한 Git 태그와 같은 버전이라는 보장은 없습니다.

## 구현

- 브라우저에서 GitHub REST refs API를 조회합니다. 응답은 세션 동안 5분 캐싱하며 API 제한이나 네트워크 장애를 오류 상태로 표시합니다.
- 고유 태그는 게임 저장소의 `.github/workflows/release-tags.yml`에서 발행하며, 실제 태그 계약의 원본은 `byh-playground/bloom-reference`의 재사용 워크플로입니다.
- 페이지는 CSS·그래픽·JavaScript가 한 HTML에 들어 있는 **정적 전시 사이트**입니다. 게임은 각자 독립 저장소의 `index.html` + 원본 자산을 사용합니다.
- 현재는 세계관 Pages의 하위 경로를 사용하는 초기 공개 주소입니다. 독립 도메인/저장소 이전 시에는 상대 경로 없이 포팅할 수 있습니다.

## 확인할 내용

- 브라우저 네트워크 오류와 GitHub 태그 없음 구분
- Stable/Nightly/전체 탭과 장르/검색 조합
- 직접 상세 URL 및 뒤로 가기
- 320~1440px 반응형, 모달 키보드 포커스
- 사용자 플레이 전에는 해당 태그 실행 환경을 별도로 검증 (특히 WebGL, CDN, RTC)
