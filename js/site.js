// ── 공통 인터랙션: Products 드롭다운, 스크롤 등장, 숫자 카운트 ──
document.addEventListener("DOMContentLoaded", () => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Products 드롭다운
  const btn = document.getElementById("nav-products");
  const menu = document.getElementById("nav-dropdown");
  if (btn && menu) {
    const close = () => {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // 숫자 카운트업
  const counters = document.querySelectorAll("[data-count]");
  if (reduce) {
    counters.forEach((el) => { el.textContent = el.dataset.count; });
  } else if (counters.length) {
    const countIO = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target;
      const target = parseInt(el.dataset.count, 10) || 0;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 900);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    counters.forEach((el) => countIO.observe(el));
  }

  // 스크롤 등장 (모션 축소 설정이면 그대로 노출)
  if (reduce) return;
  const show = (el) => { el.style.opacity = "1"; el.style.transform = "none"; };
  const revealIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    show(e.target);
    revealIO.unobserve(e.target);
  }), { threshold: 0.12 });
  // 옵저버가 어떤 이유로든 발화하지 않아도 본문이 사라지지 않도록
  setTimeout(() => document.querySelectorAll("[data-reveal]").forEach(show), 3000);
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    const d = el.dataset.revealDelay || "0";
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition =
      `opacity .7s cubic-bezier(.2,.7,.2,1) ${d}ms, transform .7s cubic-bezier(.2,.7,.2,1) ${d}ms`;
    revealIO.observe(el);
  });
});
