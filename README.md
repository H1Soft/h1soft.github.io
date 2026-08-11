# h1soft.page

H1Soft 팀 공식 웹사이트 (정적 사이트, GitHub Pages 배포).

## 구조

```
index.html          메인 원페이지 (Hero·Products·Showcase·About·FAQ·Contact)
privacy/index.html  개인정보처리방침 (/privacy/)
terms/index.html    이용약관 (/terms/)
css/style.css       전체 스타일
js/config.js        ★ 가변 값 관리 지점 (스토어 URL, 문의 이메일)
assets/             이미지 (아래 참고 — 직접 추가 필요)
robots.txt, sitemap.xml
```

## assets/ 에 넣어야 할 파일

| 파일 | 용도 |
| --- | --- |
| `app_icon.png` | 제품 카드 아이콘 |
| `favicon-32.png` | 파비콘 (app_icon 32×32 리사이즈) |
| `apple-touch-icon.png` | iOS 아이콘 (180×180 리사이즈) |
| `og-image.png` | OG 공유 이미지 (1200×630 권장) |
| `01-hero-1080x1920.png` ~ `05-more-1080x1920.png` | 쇼케이스 스크린샷 5종 |

리사이즈(macOS 내장 sips):

```sh
sips -z 32 32 app_icon.png --out assets/favicon-32.png
sips -z 180 180 app_icon.png --out assets/apple-touch-icon.png
```

## 출시 후 할 일

1. `js/config.js` 에 App Store / Google Play URL 입력 → 버튼 자동 활성화.
2. 문의 이메일 확정 시 `js/config.js` + `privacy/`·`terms/` 본문 + `index.html` JSON-LD 내 이메일 교체.
3. 도메인 확정 시 `index.html`·`privacy/`·`terms/`·`robots.txt`·`sitemap.xml` 의 `https://h1soft.page/` 일괄 치환.

## 배포 (GitHub Pages)

```sh
git init && git add -A && git commit -m "feat: H1Soft 팀 웹사이트 v1.0"
gh repo create h1soft.page --public --source=. --push
```

GitHub 저장소 → Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)` 저장.
1~2분 후 `https://<계정>.github.io/h1soft.page/` 에서 확인.

커스텀 도메인: Settings → Pages → Custom domain 에 도메인 입력(CNAME 파일 자동 생성),
DNS에 `CNAME <계정>.github.io` 레코드 추가, Enforce HTTPS 체크.
