// ── 가변 값 단일 관리 지점 ─────────────────────────────
// 스토어 URL이 비어 있으면 버튼은 "Coming soon" 비활성 상태.
// 앱 출시 후 여기에 실제 URL만 넣으면 자동 활성화됩니다.
const CONFIG = {
  APP_STORE_URL: "", // 예: "https://apps.apple.com/app/id0000000000"
  // 비공개 테스트 중 — 정식 출시(프로덕션 트랙 공개) 시 아래 URL을 PLAY_STORE_URL에 넣기.
  // 테스트 중에 걸면 테스터 외 방문자는 스토어에서 "찾을 수 없음"이 뜸.
  // https://play.google.com/store/apps/details?id=com.h1soft.codescanner
  PLAY_STORE_URL: "",
  CONTACT_EMAIL: "h1.soft.x001@gmail.com",
};

document.addEventListener("DOMContentLoaded", () => {
  const released = CONFIG.APP_STORE_URL || CONFIG.PLAY_STORE_URL;

  // 스토어 버튼
  document.querySelectorAll("[data-store]").forEach((btn) => {
    const url = btn.dataset.store === "appstore" ? CONFIG.APP_STORE_URL : CONFIG.PLAY_STORE_URL;
    if (url) {
      btn.href = url;
      btn.classList.remove("is-disabled");
      btn.removeAttribute("aria-disabled");
      btn.querySelector(".store-btn__sub").textContent = "Download";
    }
  });

  // 출시 안내 문구 제거
  if (released) document.querySelector("[data-store-note]")?.remove();

  // 문의 이메일
  document.querySelectorAll("[data-email]").forEach((el) => {
    el.href = "mailto:" + CONFIG.CONTACT_EMAIL;
    if (el.dataset.email === "text") el.textContent = CONFIG.CONTACT_EMAIL;
  });
});
