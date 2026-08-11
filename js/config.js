// ── 가변 값 단일 관리 지점 ─────────────────────────────
// 스토어 URL이 비어 있으면 다운로드 버튼은 "Coming Soon" 비활성 상태로 표시됩니다.
// 앱 출시 후 여기에 실제 URL만 넣으면 됩니다.
const CONFIG = {
  APP_STORE_URL: "", // 예: "https://apps.apple.com/app/id0000000000"
  PLAY_STORE_URL: "", // 예: "https://play.google.com/store/apps/details?id=com.h1soft.qrscanner"
  CONTACT_EMAIL: "contact@h1soft.app", // TBD: 공식 이메일 확정 시 교체
};

document.addEventListener("DOMContentLoaded", () => {
  // 스토어 버튼
  document.querySelectorAll("[data-store]").forEach((btn) => {
    const url = btn.dataset.store === "appstore" ? CONFIG.APP_STORE_URL : CONFIG.PLAY_STORE_URL;
    if (url) {
      btn.href = url;
      btn.classList.remove("is-disabled");
      btn.removeAttribute("aria-disabled");
      btn.querySelector(".store-btn__soon")?.remove();
    }
  });

  // 문의 이메일
  document.querySelectorAll("[data-email]").forEach((el) => {
    el.href = "mailto:" + CONFIG.CONTACT_EMAIL;
    if (el.dataset.email === "text") el.textContent = CONFIG.CONTACT_EMAIL;
  });

  // 모바일 햄버거 메뉴
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open);
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }
});
