# 공개 사이트 SEO 유지

앱 프로젝트에서 정적 사이트를 다시 내보내거나 sitemap을 재생성한 뒤, 저장소 루트에서 실행합니다. Python 3.9 이상과 Node.js가 필요합니다.

```sh
python3 -m pip install -r tools/seo/requirements.txt
python3 tools/seo/enrich.py
node tools/localize-store-links.mjs
python3 tools/seo/enrich.py
python3 tools/seo/check.py
python3 tools/seo/favicons.py --check
python3 tools/seo/product_links.py --check
python3 tools/seo/check_product_links.py
node tools/localize-store-links.mjs --check
```

두 번째 `enrich.py` 실행은 언어가 적용된 스토어 주소를 JSON-LD의 Offer에도 반영합니다. 같은 입력으로 재실행하면 최종 파일은 변하지 않습니다. CI에서는 수정을 하지 않고 검사만 실행합니다.

- 궁합 153개에 고유 설명과 인형별 대화 가이드를 적용하고, 인형 상세 17개 및 궁합 목록에서 연결합니다. `attachment-types.json`은 앱의 공개 캐릭터 원문입니다. 앱 캐릭터가 변경되면 함께 갱신합니다.
- 초대 17개, 테스트 실행 화면, 리디렉션은 `noindex,follow`로 유지합니다. 소개 랜딩과 궁합 콘텐츠는 검색을 허용합니다.
- 지원 페이지에 언어별 OG/Twitter 미리보기를 추가하고, 중복 루트 주소로 향하는 내부 링크와 sitemap을 정리합니다.
- 결·냥브로의 페이지/앱/탐색경로 구조화 데이터를 추가합니다.
- 가격은 `store-facts.json`의 공식 스토어 확인값만 사용합니다. 공개 리뷰가 없는 앱에 평점이나 리뷰를 만들지 않습니다. 가격·출시·리뷰 상태가 바뀌면 근거 URL과 확인일을 갱신한 뒤 적용합니다.
- 폰 클리너의 iOS 출시 링크와 플랫폼별 기능 설명을 유지합니다. 2026-10-03 출시를 확인한 몽글·슥캔의 Google Play 링크를 각 페이지 언어로 연결합니다.
- 약관·개인정보·삭제·관리·통계 페이지와 앱 소스는 대상에서 제외합니다.

회사 홈의 제품 수·메뉴·카드·FAQ는 제품 추가 시 직접 함께 갱신합니다. 현재 한국어/영어 홈은 11개(도구 4, 라이프스타일 3, 게임 4)이며, 검사가 카드와 JSON-LD 개수 불일치를 잡습니다. `/skinping/`, `/lol.dating/`는 홈페이지와 공통 제품 메뉴에서 제외합니다. 해당 링크가 다시 들어오면 검사가 실패합니다.

`check.py`는 헤드 필수 정보, JSON-LD, 가격, 홈 제품 목록, 고유 궁합 콘텐츠, 홈에서의 도달 가능성, sitemap의 canonical/noindex 일치를 검사합니다. 검색엔진의 실제 색인·순위나 리치 결과 채택 여부를 검증하는 도구는 아닙니다.

## 다른 앱 연결

`products.json`은 현재 회사 홈에 공개된 11개 제품의 순서·아이콘·기존 번역 이름/설명을 관리합니다. 제품 추가 시 회사 홈과 이 목록을 함께 갱신합니다. `product_links.py`는 실제 HTML의 언어와 canonical에서 목적지를 찾으며, 같은 언어가 없으면 영어, 영어도 없으면 한국어로 연결하고 언어를 표시합니다. 중국어 간체/번체와 지역 언어 코드를 구별합니다.

`python3 tools/seo/product_links.py`는 제품 메뉴와 기존 ‘다른 앱’ 카드를 완성하고, 다른 제품 소개 페이지에는 카드 목록을, 지원·정책·콘텐츠 페이지에는 간단한 링크 목록을 적용합니다. 자기 앱·중복·제외된 제품은 목록에 넣지 않습니다. 실행 화면, 관리·본인확인·심사·공유 흐름 및 noindex 페이지는 제외합니다. 생성 HTML에는 실제 `<a href>` 링크가 들어가므로 JavaScript 없이도 동작합니다. 기존 디자인 영역을 보존하고 추가 영역은 `css/product-links.css`에 한정합니다.

사이트 재생성 후 `enrich.py`가 이 작업도 실행합니다. CI는 목록 완전성, 실제 파일과 조각 주소의 존재, 언어별 목적지, 메뉴·카드 아이콘과 자기 링크를 검사합니다. 정책 본문은 수정하지 않습니다.

## 파비콘과 Google 검색 아이콘

회사 페이지는 `/assets/h1soft-appicon.png`, 온글·몽글·슥캔·QR Scanner·스도쿠·사각사각은 각 서비스의 승인된 512px PNG를 파비콘과 Apple 터치 아이콘으로 사용합니다. 이미 자체 아이콘을 사용하는 나머지 서비스의 설정은 유지합니다. 공통 파일 `favicon-32.png`/`favicon-48.png`에 제품별 아이콘을 덮어쓰지 않습니다.

`python3 tools/seo/favicons.py`로 아이콘 설정만 재적용할 수 있으며 `enrich.py`에도 포함되어 있습니다. 모든 번역·지원·정책 페이지가 대상입니다. 이 작업은 정책 내용이나 검색 허용 여부를 바꾸지 않습니다.

[Google은 호스트당 검색 파비콘 하나만 지원](https://developers.google.com/search/docs/appearance/favicon-in-search)합니다. `h1soft.github.io/ongle/`처럼 하위 경로만 다른 서비스에 검색 파비콘을 따로 지정할 수는 없습니다. 현재 도메인의 검색 대표 아이콘은 H1Soft이며, 서비스별 아이콘은 브라우저 탭·북마크 등에 사용됩니다. 검색에서 서비스별 아이콘을 분리하려면 별도 도메인/서브도메인과 사이트 이전 작업이 필요합니다. Google의 기존 아이콘은 홈페이지 재수집 후 갱신될 수 있으며 즉시 갱신이나 노출은 보장되지 않습니다. 아이콘 URL은 향후에도 안정적으로 유지합니다.
