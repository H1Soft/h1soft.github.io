# h1soft.page

H1Soft 팀 공식 웹사이트 (정적 사이트, GitHub Pages 배포).

## 구조

```
index.html               팀 홈 (Hero·Pillars·유틸리티·라이프스타일·About·FAQ·Contact)
qr-scanner/index.html    QR Scanner 제품 상세 (/qr-scanner/ — Products·Showcase)
privacy/index.html       개인정보처리방침 (/privacy/)
terms/index.html         이용약관 (/terms/)
css/style.css            전체 스타일
js/config.js             ★ 가변 값 관리 지점 (스토어 URL, 문의 이메일)
js/site.js               Products 드롭다운, 스크롤 등장, 숫자 카운트업
assets/                  이미지 (아래 참고)
robots.txt, sitemap.xml
```

## assets/ 구성

| 파일 | 용도 | 원본 |
| --- | --- | --- |
| `app_icon.png` (512), `favicon-32.png`, `apple-touch-icon.png` (180) | QR Scanner 아이콘 | `QR_icon.png` sips 리사이즈 |
| `seukscan-icon.png` (512) | 슥캔 아이콘 | Claude Design 프로젝트 `uploads/app-icon.png` |
| `ongle-icon.png` (512) | 온글 아이콘 | 원본 1254px 리사이즈 |
| `og-image-ko.jpg` / `og-image-en.jpg` | OG 공유 이미지 | feature-graphic 1024×500 jpg 변환 |
| `screenshots/{ko,en}/0X-*.webp` (640w) | 쇼케이스 이미지 | 플레이스토어 스크린샷 1080×1920 리사이즈+webp |
| `qr-scanner-play-store-screenshots/` | 스토어용 원본 보관 | — |

재생성:

```sh
sips --resampleWidth 640 원본.png --out /tmp/rs.png && cwebp -q 82 /tmp/rs.png -o assets/screenshots/ko/01-hero.webp
sips -s format jpeg -s formatOptions 85 ko-feature-graphic-1024x500.png --out assets/og-image-ko.jpg
```

영문 페이지: `/en/`, `/en/qr-scanner/` (en 스크린샷·en OG 사용, hreflang 상호 연결).

라이프스타일 라인(피부핑 `/skinping/`, 롤개팅 `/lol.dating/`)은 별도 저장소에서 같은 도메인 하위 경로로 배포됩니다.

## 출시 후 할 일

1. `js/config.js` 에 App Store / Google Play URL 입력 → 버튼 자동 활성화.
2. 문의 이메일 확정 시 `js/config.js` + `privacy/`·`terms/` 본문 + `index.html` JSON-LD 내 이메일 교체.
3. 슥캔 · 온글 제품 상세 페이지 추가 시 홈 카드(`.tool-card--static`)를 링크 카드로 교체.
4. 커스텀 도메인 전환 시 `index.html`·`qr-scanner/`·`privacy/`·`terms/`·`robots.txt`·`sitemap.xml` 의 `https://h1soft.github.io/` 일괄 치환.

## 배포 (GitHub Pages — h1soft.github.io)

전제: GitHub 계정(또는 organization) 이름이 `h1soft`, 저장소 이름이 `h1soft.github.io`.

```sh
git init && git add -A && git commit -m "feat: H1Soft 팀 웹사이트 v1.0"
gh repo create h1soft/h1soft.github.io --public --source=. --push
```

user/org 이름과 같은 `<이름>.github.io` 저장소는 main 푸시만으로 자동 배포.
1~2분 후 `https://h1soft.github.io/` 에서 확인. (Settings → Pages에서 상태 확인 가능)
