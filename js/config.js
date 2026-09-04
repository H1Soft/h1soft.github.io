// ── 가변 값 단일 관리 지점 ─────────────────────────────
// 스토어 URL이 비어 있으면 버튼은 "Coming soon" 비활성 상태.
// 앱 출시 후 여기에 실제 URL만 넣으면 자동 활성화됩니다.
const CONFIG = {
  // QR Scanner (data-store-app 미지정 시 기본값)
  APP_STORE_URL: "", // 예: "https://apps.apple.com/app/id0000000000"
  PLAY_STORE_URL: "https://play.google.com/store/apps/details?id=com.h1soft.codescanner",

  // 슥캔 (data-store-app="seukscan")
  SEUKSCAN_APP_STORE_URL: "",
  SEUKSCAN_PLAY_STORE_URL: "",

  // 온글 (data-store-app="ongle") — Android 우선
  ONGLE_PLAY_STORE_URL: "",

  // 몽글 (data-store-app="mongle")
  MONGLE_APP_STORE_URL: "",
  MONGLE_PLAY_STORE_URL: "",

  // 스도쿠 보야지 (data-store-app="sudoku")
  SUDOKU_APP_STORE_URL: "",
  SUDOKU_PLAY_STORE_URL: "",

  CONTACT_EMAIL: "h1.soft.x001@gmail.com",
};

const STORE_URLS = {
  qr: { appstore: CONFIG.APP_STORE_URL, playstore: CONFIG.PLAY_STORE_URL },
  seukscan: { appstore: CONFIG.SEUKSCAN_APP_STORE_URL, playstore: CONFIG.SEUKSCAN_PLAY_STORE_URL },
  ongle: { appstore: "", playstore: CONFIG.ONGLE_PLAY_STORE_URL },
  mongle: { appstore: CONFIG.MONGLE_APP_STORE_URL, playstore: CONFIG.MONGLE_PLAY_STORE_URL },
  sudoku: { appstore: CONFIG.SUDOKU_APP_STORE_URL, playstore: CONFIG.SUDOKU_PLAY_STORE_URL },
};

document.addEventListener("DOMContentLoaded", () => {
  let anyReleased = false;

  // 스토어 버튼
  document.querySelectorAll("[data-store]").forEach((btn) => {
    const app = STORE_URLS[btn.dataset.storeApp] || STORE_URLS.qr;
    const url = app[btn.dataset.store];
    if (!url) return;
    anyReleased = true;
    btn.href = url;
    btn.classList.remove("is-disabled");
    btn.removeAttribute("aria-disabled");
    // 제품별 스타일시트마다 클래스 접두사가 달라서(store-btn / mg-store / sv-store) 둘 다 잡는다
    const sub = btn.querySelector('.store-btn__sub, [class*="store__sub"]');
    if (sub) sub.textContent = "Download";
  });

  // 출시 안내 문구 제거
  if (anyReleased) document.querySelector("[data-store-note]")?.remove();

  // 문의 이메일
  document.querySelectorAll("[data-email]").forEach((el) => {
    el.href = "mailto:" + CONFIG.CONTACT_EMAIL;
    if (el.dataset.email === "text") el.textContent = CONFIG.CONTACT_EMAIL;
  });
});
