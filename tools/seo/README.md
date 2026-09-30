# 공개 사이트 SEO 유지

앱 프로젝트에서 정적 사이트를 다시 내보내거나 sitemap을 재생성한 뒤, 저장소 루트에서 실행합니다. Python 3.9 이상과 Node.js가 필요합니다.

```sh
python3 -m pip install -r tools/seo/requirements.txt
python3 tools/seo/enrich.py
node tools/localize-store-links.mjs
python3 tools/seo/enrich.py
python3 tools/seo/check.py
node tools/localize-store-links.mjs --check
```

두 번째 `enrich.py` 실행은 언어가 적용된 스토어 주소를 JSON-LD의 Offer에도 반영합니다. 같은 입력으로 재실행하면 최종 파일은 변하지 않습니다. CI에서는 수정을 하지 않고 검사만 실행합니다.

- 궁합 153개에 고유 설명과 인형별 대화 가이드를 적용하고, 인형 상세 17개 및 궁합 목록에서 연결합니다. `attachment-types.json`은 앱의 공개 캐릭터 원문입니다. 앱 캐릭터가 변경되면 함께 갱신합니다.
- 초대 17개, 테스트 실행 화면, 리디렉션은 `noindex,follow`로 유지합니다. 소개 랜딩과 궁합 콘텐츠는 검색을 허용합니다.
- 지원 페이지에 언어별 OG/Twitter 미리보기를 추가하고, 중복 루트 주소로 향하는 내부 링크와 sitemap을 정리합니다.
- 결·냥브로의 페이지/앱/탐색경로 구조화 데이터를 추가합니다.
- 가격은 `store-facts.json`의 공식 스토어 확인값만 사용합니다. 공개 리뷰가 없는 앱에 평점이나 리뷰를 만들지 않습니다. 가격·출시·리뷰 상태가 바뀌면 근거 URL과 확인일을 갱신한 뒤 적용합니다.
- 폰 클리너의 iOS 출시 링크와 플랫폼별 기능 설명을 유지합니다. 공개 페이지가 없는 슥캔 Google Play 링크는 출시 대기로 표시합니다.
- 약관·개인정보·삭제·관리·통계 페이지와 앱 소스는 대상에서 제외합니다.

회사 홈의 제품 수·메뉴·카드·FAQ는 제품 추가 시 직접 함께 갱신합니다. 현재 한국어/영어 홈은 12개(도구 4, 라이프스타일 4, 게임 4)이며, 검사가 카드와 JSON-LD 개수 불일치를 잡습니다. `/skinping/`, `/lol.dating/`는 별도 저장소에서 배포하므로 이 검사에서 파일 존재 여부를 판단하지 않습니다.

`check.py`는 헤드 필수 정보, JSON-LD, 가격, 홈 제품 목록, 고유 궁합 콘텐츠, 홈에서의 도달 가능성, sitemap의 canonical/noindex 일치를 검사합니다. 검색엔진의 실제 색인·순위나 리치 결과 채택 여부를 검증하는 도구는 아닙니다.
