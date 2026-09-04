# h1soft.page

H1Soft 팀 공식 웹사이트 (정적 사이트, GitHub Pages 배포).

## 구조

```
index.html               팀 홈 (Hero·Pillars·유틸리티·라이프스타일·게임·About·FAQ·Contact)
qr-scanner/index.html    QR Scanner 제품 상세 (/qr-scanner/ — Products·Showcase)
seukscan/index.html      슥캔 제품 랜딩 (/seukscan/ — Hero·Features·Showcase·FAQ, 화면 섹션은 QR 과 같은 세로 교차 배치)
ongle/index.html         온글 제품 랜딩 (/ongle/ — 동일 구성 + 한컴 비제휴 고지)
mongle/index.html        몽글 제품 랜딩 (/mongle/ — 자체 디자인 시스템, css/mongle.css)
sudoku/index.html        스도쿠 보야지 랜딩 (/sudoku/ — 자체 디자인 시스템, css/sudoku.css)
privacy/, terms/         약관 — 사이트 공통 + 제품별(qr-scanner/, seukscan/, ongle/, mongle/, sudoku/ 하위)
css/style.css            전체 스타일
css/mongle.css           몽글 전용 스타일 (크림·라운드 토큰, style.css 미사용)
css/sudoku.css           스도쿠 보야지 전용 스타일 (크림·티일 토큰, style.css 미사용)
js/config.js             ★ 가변 값 관리 지점 (스토어 URL, 문의 이메일)
js/site.js               Products 드롭다운, 스크롤 등장, 숫자 카운트업
assets/                  이미지 (아래 참고)
robots.txt, sitemap.xml
```

## assets/ 구성

| 파일 | 용도 | 원본 |
| --- | --- | --- |
| `h1soft-logo.png` (512, 투명) | H1Soft 로고 — JSON-LD `logo` | 원본 `h1.png` 트리밍 |
| `favicon-32.png`, `favicon-48.png`, `apple-touch-icon.png` (180), `h1soft-appicon.png` (512), 루트 `favicon.ico` | H1Soft 파비콘·앱 아이콘 | 흰색 계열 라운드 칩 + 헤어라인 + 로고 (`scratchpad/build_brand.py`) |
| `app_icon.png` (512) | QR Scanner 앱 아이콘 | Google Play 스토어 등록본 (2026-09-04 새 아이콘으로 교체). `QR_icon.png` 은 그 이전 아이콘 원본이고 페이지에서는 쓰지 않습니다 |
| `seukscan-icon.png` (512) | 슥캔 아이콘 | Claude Design 프로젝트 `uploads/app-icon.png` |
| `ongle-icon.png` (512) | 온글 아이콘 | 원본 1254px 리사이즈 |
| `seukscan/{ko,en}/0X.webp` (640w) | 슥캔 스크린샷 | 원본 PNG 리사이즈+webp |
| `ongle/{ko,en}/0X.webp` (640w) | 온글 스크린샷 | hwp 저장소 `store-screenshots/public/screenshots` 리사이즈+webp |
| `og-h1soft-ko.png` / `og-h1soft-en.png` (1200×630) | 루트 회사 OG | 로고 + 'IT 기술 스타트업' HTML → Chrome 헤드리스 (`scratchpad/build_og_brand.py`) |
| `og-image-ko.jpg` / `og-image-en.jpg` | QR Scanner OG | feature-graphic 1024×500 jpg 변환 |
| `mongle-og.png` / `mongle-og-en.png` (1200×630) | 몽글 OG | 시안 B-6 HTML → Chrome 헤드리스 캡처 |
| `sudoku-og.png` / `sudoku-og-en.png` (1200×630) | 스도쿠 보야지 OG | 시안 W8 HTML → Chrome 헤드리스 캡처 |
| `sudoku/0X-*.webp` (640w), `sudoku/map.webp` | 스도쿠 보야지 인앱 화면 | Claude Design `Sudoku Voyage 디자인.dc.html` 을 DC 런타임으로 렌더 후 캡처 |
| `screenshots/{ko,en}/0X-*.webp` (640w) | 쇼케이스 이미지 | 플레이스토어 스크린샷 1080×1920 리사이즈+webp |
| `qr-scanner-play-store-screenshots/` | 스토어용 원본 보관 | — |

QR Scanner 의 쇼케이스 이미지는 스토어 스크린샷이라 배경·기기 프레임이 이미 이미지 안에 있습니다. 슥캔·온글은 앱 화면 원본이라 같은 룩앤필을 CSS 로 만듭니다 — `.showcase--framed` 가 카드에 옅은 파랑 배경을 깔고, `.showcase__phone` 이 펀치홀이 있는 밝은 기기 셸을 씌운 뒤 화면이 카드 아래로 흘러 나가게 잘립니다 (크롭 확대 없음). 셸 치수는 QR 스토어 스크린샷의 목업을 실측한 값(1000px 캔버스 기준 프레임 폭 808 · 옆 베젤 24 · 윗 베젤 48 · 펀치홀 22 · 라운드 63)을 카드 폭 기준 컨테이너 단위(`cqw`)로 옮긴 것이라 QR 카드와 프레임이 같습니다. 슥캔·온글 히어로에는 QR 처럼 기기 이미지를 두지 않고 문안만 가운데 정렬합니다(`.app-hero__col:only-child`).

재생성:

```sh
sips --resampleWidth 640 원본.png --out /tmp/rs.png && cwebp -q 82 /tmp/rs.png -o assets/screenshots/ko/01-hero.webp
sips -s format jpeg -s formatOptions 85 ko-feature-graphic-1024x500.png --out assets/og-image-ko.jpg
```

영문 페이지: `/en/`, `/en/qr-scanner/`, `/en/seukscan/`, `/en/ongle/`, `/en/mongle/`, `/en/sudoku/` (hreflang 상호 연결).

몽글 캐릭터 16종은 이미지가 아니라 빌드 타임에 심어 넣은 인라인 SVG입니다 — Claude Design 의 `MongleChar.dc.html` 로직을 그대로 옮겼습니다.
스도쿠 보드(랜딩 히어로·힌트 3종·홈 게임 카드·OG)도 같은 방식으로, 시안의 `DCLogic.board()` 를 그대로 옮겨 빌드 타임에 HTML 로 펼쳐 넣습니다.

`/sudoku/` 의 인앱 화면 이미지는 스크린샷이 아니라 **디자인 시안을 실제로 렌더한 결과**입니다. Claude Design 의 `Sudoku Voyage 디자인.dc.html` 을 DC 런타임(`support.js` + `android-frame.jsx`)과 함께 로컬에서 띄우고 화면별로 캡처했습니다. 시안 본문의 `data-dc-script` 는 파일이 커서 API 응답 상한(256KiB)에 잘려 받지 못했기 때문에, 보드·입력판 데이터는 같은 프로젝트의 웹사이트 시안에 있는 `DCLogic` 을 기준으로 재구성했습니다 (스크립트: `scratchpad/make_screens.py`, `dcrender/dclogic.html` — 저장소에는 결과 이미지만 들어옵니다). 시안 주석(§ 참조 줄)과 화면 안의 한국어 주석 라벨은 캡처 전에 제거·영문화했습니다. 화면 문안은 전부 영문이라 표제 서체는 시안대로 Lora 를 씁니다 — 세리프 전환은 KO 랜딩의 한글 표제(`Noto Serif KR 600`)에만 적용됩니다.

라이프스타일 라인(피부핑 `/skinping/`, 롤개팅 `/lol.dating/`)은 별도 저장소에서 같은 도메인 하위 경로로 배포되며, 각자의 약관 페이지도 해당 저장소에 있습니다.

브랜딩: 루트 페이지는 특정 제품이 아니라 **IT 기술 스타트업**으로 포지셔닝합니다. 사용자에게 보이는 문구에는 Kotlin Multiplatform·Compose Multiplatform·Rust 같은 기술 용어를 쓰지 않습니다 — "아이폰과 안드로이드에서 똑같이", "내 폰 안에서 처리"처럼 풀어 씁니다 (JSON-LD `knowsAbout` 은 검색엔진용 구조화 데이터라 기술명을 유지). 제품 분야는 **매일 쓰는 도구 / 라이프스타일 / 게임** 세 가지로 부르고, 히어로 칩도 이 세 묶음으로 나눕니다. 파비콘·앱 아이콘·루트 OG·JSON-LD `logo` 는 전부 H1Soft 로고를 쓰고, QR Scanner 에셋은 `/qr-scanner/` 안에서만 씁니다 (예전에는 사이트 전역이 QR 아이콘이라 구글이 H1Soft = QR 앱으로 인식했습니다).

스토어 버튼에는 App Store(사과)·Google Play(삼각형) 아이콘을 항상 함께 둡니다 — `style.css` 의 `.store-btn`(QR·슥캔·온글), `mongle.css` 의 `.mg-store`, `sudoku.css` 의 `.sv-store` 모두 같은 SVG 를 씁니다.

H 마크는 썸네일(파비콘·앱 아이콘)에만 씁니다. 헤더·푸터 워드마크는 `H1Soft.` 텍스트 그대로입니다.

## 출시 후 할 일

1. `js/config.js` 에 앱별 App Store / Google Play URL 입력 → 버튼 자동 활성화
   (QR Scanner는 `APP_STORE_URL`/`PLAY_STORE_URL`, 슥캔은 `SEUKSCAN_*`, 온글은 `ONGLE_*`, 몽글은 `MONGLE_*`, 스도쿠 보야지는 `SUDOKU_*`).
2. 문의 이메일 확정 시 `js/config.js` + `privacy/`·`terms/` 본문 + `index.html` JSON-LD 내 이메일 교체.
4. 커스텀 도메인 전환 시 `index.html`·`qr-scanner/`·`privacy/`·`terms/`·`robots.txt`·`sitemap.xml` 의 `https://h1soft.github.io/` 일괄 치환.

## 배포 (GitHub Pages — h1soft.github.io)

전제: GitHub 계정(또는 organization) 이름이 `h1soft`, 저장소 이름이 `h1soft.github.io`.

```sh
git init && git add -A && git commit -m "feat: H1Soft 팀 웹사이트 v1.0"
gh repo create h1soft/h1soft.github.io --public --source=. --push
```

user/org 이름과 같은 `<이름>.github.io` 저장소는 main 푸시만으로 자동 배포.
1~2분 후 `https://h1soft.github.io/` 에서 확인. (Settings → Pages에서 상태 확인 가능)
