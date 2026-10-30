# 게임 매니페스트 규격 (`bloom-game.json`)

BLOOM PLAYGROUND는 전시할 게임의 설명과 릴리즈 정보를 각 게임 저장소의 `bloom-game.json`에서 읽습니다. 이 문서는 그 파일의 **유일한 규격 원본**입니다. 게임 저장소의 작업자(사람이든 에이전트든)는 이 문서와 [`bloom-game.schema.json`](bloom-game.schema.json)만 보고 파일을 만들고 고칠 수 있어야 합니다.

> 상태: 전시 중인 8개 게임이 모두 이 파일을 읽습니다(`GAMES` 항목의 `source:'manifest'`). 태그 조회에 GitHub API를 쓰지 않습니다.

## 두 개의 파일, 하나의 규격

| 구분 | 위치 | 누가 만드는가 | 포함 필드 |
| --- | --- | --- | --- |
| **원본** | 게임 저장소 루트 `bloom-game.json` (`main`) | 사람이 직접 관리 | `nightly`를 **제외한** 모든 필드 |
| **게시본** | `https://byh-playground.github.io/<저장소>/bloom-game.json` | Pages 배포가 원본에 `nightly`를 더해 생성 | 모든 필드 |

플레이그라운드는 **게시본만** 읽습니다. 원본에 `nightly`를 직접 적지 않습니다. 같은 스키마로 둘 다 검증하되, `nightly`는 스키마상 선택이므로 "원본에는 없고 게시본에는 있다"는 점은 CI가 따로 확인합니다.

GitHub Pages는 `access-control-allow-origin: *`로 응답하므로 브라우저에서 GitHub API 없이 바로 읽을 수 있습니다. Pages 캐시는 약 10분입니다.

## 필드

```json
{
  "$schema": "https://byh-playground.github.io/bloom-world/playground/bloom-game.schema.json",
  "schemaVersion": 1,
  "title": "바운코",
  "en": "BOUNKO",
  "genre": "action",
  "tags": ["물리 액션", "성장", "탑다운"],
  "desc": "방향을 조준해 돌진하고, 충돌과 반발력으로 싸우는 탑다운 액션 게임입니다.",
  "points": [
    "조준·충전·돌진 조작",
    "알과 동료를 모으는 성장 시스템",
    "다양한 적과 물리 기반 충돌"
  ],
  "showcase": "https://byh-playground.github.io/bloom-bounko/#/showcase",
  "stable": { "version": "0.19.0", "sha": "0123456789abcdef0123456789abcdef01234567" }
}
```

| 필드 | 필수 | 규칙 |
| --- | --- | --- |
| `$schema` | 선택 | 에디터 자동완성용. 위 주소 그대로 |
| `schemaVersion` | 필수 | 정수 `1` |
| `title` | 필수 | 한글 표시 이름, 1~20자 |
| `en` | 필수 | 영문 표시 이름. 대문자·숫자·공백, 30자 이하 |
| `genre` | 필수 | `strategy` · `action` · `sandbox` · `simulation` 중 하나. 한글 장르명은 플레이그라운드가 매핑합니다 |
| `tags` | 필수 | 짧은 키워드 1~3개, 각 16자 이하, 중복 금지 |
| `desc` | 필수 | 한두 문장 소개, 80자 이하. 평이한 문장으로 쓰고 전문용어·과장을 피합니다 |
| `points` | 필수 | 특징 **정확히 3개**, 각 40자 이하 |
| `showcase` | 선택 | 게임 소개 화면의 **https 전체 주소**(200자 이하). 없으면 소개 화면이 없는 게임이며 플레이그라운드는 소개 보기 버튼을 숨깁니다. 주소 형식을 추측해서 만들지 않습니다 |
| `stable` | 선택 | 승인된 Stable. 없으면 Stable 미등록 |
| `stable.version` | `stable` 있으면 필수 | `X.Y.Z` (접두어 `v` 없이). 태그는 `v` + 이 값 |
| `stable.sha` | `stable` 있으면 필수 | 태그가 가리키는 **40자 전체 커밋 SHA** |
| `nightly` | 게시본만 필수 | 최신 Nightly 태그 이름. 아래 계산식으로 **배포 단계가 생성**, 손으로 쓰지 않음 |

게임 저장소는 대표 이미지(`art`)를 이 파일에 넣지 않습니다. 대표 일러스트는 당분간 플레이그라운드가 소유합니다.

모르는 필드는 읽는 쪽이 **무시**하지만 스키마는 `additionalProperties: false`라서 저장소의 검증에서는 실패합니다. 필드를 임의로 추가하지 말고 이 문서를 먼저 고칩니다.

## Nightly 태그 계산식

Nightly는 `main` 푸시마다 자동 발행되는 불변 태그이며, 이름은 커밋만 알면 정해집니다. 이 식은 [`bloom-reference`의 `game-release-tags.yml`](https://github.com/byh-playground/bloom-reference/blob/main/.github/workflows/game-release-tags.yml)과 **동일해야 합니다**.

```
nightly-<커밋 시각 UTC, YYYYMMDDTHHMMSSZ>-<커밋 SHA 앞 12자>
```

Pages 배포 단계의 예시입니다.

```yaml
- name: Publish bloom-game.json
  run: |
    STAMP=$(date -u -d "@$(git show -s --format=%ct "$GITHUB_SHA")" +%Y%m%dT%H%M%SZ)
    jq --arg t "nightly-$STAMP-${GITHUB_SHA:0:12}" '. + {nightly:$t}' bloom-game.json > _site/bloom-game.json
```

배포하는 커밋과 태그가 붙는 커밋은 둘 다 `main`의 푸시 SHA여야 합니다. 서로 다른 커밋에서 만든 값을 섞지 않습니다.

## Stable 기록

Stable 태그는 사람이 `release-tags.yml`을 수동 실행해서 만듭니다(검증 승인 필수). 태그를 만든 뒤 같은 SHA로 `stable` 필드를 갱신하는 PR을 `main`에 머지합니다.

- `stable.sha`는 태그가 가리키는 커밋과 정확히 같아야 합니다. `git rev-parse v0.19.0^{commit}`으로 확인합니다.
- 태그가 실제로 없는 버전을 적지 않습니다. 플레이그라운드의 Stable 링크가 깨집니다.
- Stable은 올리는 방향으로만 바꿉니다. 이전 버전으로 되돌리거나 같은 버전의 SHA를 바꾸지 않습니다(태그는 불변).

## 읽는 쪽(플레이그라운드) 동작 약속

- 게시본을 가져와 스키마로 검증합니다. 파일이 없거나(404), 파싱·검증에 실패하면 그 게임 카드는 **"정보 조회 실패"로 표시**하고, 이전 값이나 추정값으로 채우지 않습니다.
- 게임 실행 주소는 항상 `https://byh-playground.github.io/<저장소 이름>/`입니다. 저장소 이름은 플레이그라운드의 전시 목록에서 가져오며 매니페스트에는 주소 필드를 두지 않습니다. 커스텀 도메인을 쓰는 게임이 생기면 그때 `url` 선택 필드를 추가합니다(선택 필드 추가라 `schemaVersion` 변경 없음).
- `showcase`가 있으면 그 주소를 그대로 소개 보기에 연결하고, 없으면 버튼을 숨깁니다(`#/showcase` 같은 경로를 임의로 붙이지 않습니다).
- `nightly`가 있으면 Nightly 실행 주소는 그 게임의 Pages 주소입니다. `stable`이 있으면 Stable 실행 주소는 `v<version>` 태그의 정적 미리보기입니다.
- 로딩·실패·미등록을 구분합니다. `stable` 필드가 없는 것은 "미등록"이고, 파일을 못 읽은 것은 "조회 실패"입니다.

## 호환성 정책

- `schemaVersion`이 같으면 필드 추가는 **선택 필드로만** 합니다. 필수 필드를 새로 만들면 `schemaVersion`을 올립니다.
- 플레이그라운드는 자신이 아는 버전보다 큰 `schemaVersion`을 받으면 그 카드를 조회 실패로 처리합니다. 새 버전의 읽기 지원을 먼저 배포한 뒤 게임 저장소를 올립니다.
- 규격 변경은 이 문서, 스키마, 플레이그라운드 검증을 **한 PR**에서 같이 고칩니다.

## 게임 저장소의 검증

게임 저장소가 규격을 지키는지는 스키마로 확인합니다. 예(`ajv-cli`):

```bash
curl -fsS https://raw.githubusercontent.com/byh-playground/bloom-world/main/playground/bloom-game.schema.json -o schema.json
npx ajv-cli@5 validate --spec=draft2020 -s schema.json -d bloom-game.json
```

CI에서는 원본을 검증하고, Pages 배포 직전에 게시본(`nightly` 포함)을 한 번 더 검증합니다. 스키마 주소는 `bloom-world`의 Pages가 `release` 브랜치를 게시하므로, `release`를 갱신하기 전에는 `main`의 raw 주소를 사용합니다. 적용 예: `byh-playground/bloom-bounko`의 `.github/workflows/bloom-game-manifest.yml`, `pages.yml`.

## 새 게임을 전시에 추가할 때

1. 게임 저장소 루트에 `bloom-game.json`을 만들고 스키마로 검증합니다.
2. Pages 배포가 게시본을 올리게 하고 `https://byh-playground.github.io/<저장소>/bloom-game.json`이 열리는지 확인합니다.
3. 게임 저장소에 Nightly/Stable 태그 워크플로(`release-tags.yml`)를 연결합니다.
4. 플레이그라운드의 전시 저장소 목록에 저장소 이름을 추가하는 PR을 `bloom-world`에 냅니다. 전시 여부의 최종 결정은 이 목록에 있습니다.
