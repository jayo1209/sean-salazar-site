/* Sean Salazar — kinetic animations (GSAP + ScrollTrigger) */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

/* Split display text into per-letter spans for stagger animation */
document.querySelectorAll("[data-split]").forEach((el) => {
  const text = el.textContent;
  el.textContent = "";
  el.setAttribute("aria-hidden", "true");
  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "ch";
    span.textContent = ch === " " ? " " : ch;
    el.appendChild(span);
  }
});

/* Timecode ticker — fake running film timecode in the hero frame */
const timecodeEl = document.getElementById("timecode");
let frames = 0;
setInterval(() => {
  frames = (frames + 1) % (24 * 60 * 60 * 24);
  const f = frames % 24;
  const s = Math.floor(frames / 24) % 60;
  const m = Math.floor(frames / (24 * 60)) % 60;
  const h = Math.floor(frames / (24 * 60 * 60));
  const pad = (n) => String(n).padStart(2, "0");
  timecodeEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}, 1000 / 24);

/* Cursor spotlight */
if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  const spot = document.querySelector(".spotlight");
  window.addEventListener("pointermove", (e) => {
    spot.style.setProperty("--spot-x", e.clientX + "px");
    spot.style.setProperty("--spot-y", e.clientY + "px");
  }, { passive: true });
}

const preloader = document.getElementById("preloader");
const nav = document.getElementById("nav");

function revealNav() {
  nav.classList.add("is-in");
}

function killPreloader(instant) {
  if (instant) {
    preloader.remove();
    revealNav();
    return;
  }
  gsap.to(preloader, {
    yPercent: -100,
    duration: 0.9,
    ease: "power4.inOut",
    onComplete: () => preloader.remove(),
  });
}

if (reduceMotion || typeof gsap === "undefined") {
  /* No-motion fallback: show everything immediately */
  document.body.classList.add("no-motion");
  killPreloader(true);
} else {
  gsap.registerPlugin(ScrollTrigger);

  /* ---- Preloader: count 0→100, then curtain up ---- */
  const countEl = document.getElementById("preloaderCount");
  const counter = { v: 0 };
  const intro = gsap.timeline();

  intro
    .to(counter, {
      v: 100,
      duration: 1.4,
      ease: "power2.inOut",
      onUpdate: () => (countEl.textContent = String(Math.round(counter.v)).padStart(2, "0")),
    })
    .add(() => killPreloader(false))

    /* ---- Hero title: letters slam in like a title card ---- */
    .from(".hero__line:first-child .ch", {
      yPercent: 120,
      rotateX: -90,
      opacity: 0,
      duration: 0.9,
      stagger: 0.05,
      ease: "power4.out",
    }, "-=0.15")
    .from(".hero__line--outline .ch", {
      yPercent: 120,
      opacity: 0,
      duration: 0.9,
      stagger: 0.05,
      ease: "power4.out",
    }, "-=0.65")
    .from(".hero__eyebrow", { opacity: 0, y: -16, duration: 0.5 }, "-=0.5")
    .from(".hero__sub", { opacity: 0, y: 24, duration: 0.6 }, "-=0.35")
    .from(".hero__tag", { opacity: 0, duration: 0.6 }, "-=0.25")
    .from(".hero__frame", { opacity: 0, scale: 1.04, duration: 0.8 }, "-=0.5")
    .from(".hero__scrollcue", { opacity: 0, duration: 0.6 }, "-=0.3")
    .add(revealNav, "-=0.6");

  /* ---- Hero parallax: title drifts up + fades as you scroll past ---- */
  gsap.to(".hero__title", {
    yPercent: -22,
    opacity: 0.25,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* ---- Generic scroll reveals ---- */
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });

  /* ---- Style cards: cascade in from the left ---- */
  gsap.utils.toArray(".style-card").forEach((card, i) => {
    gsap.from(card, {
      x: -60,
      opacity: 0,
      duration: 0.8,
      delay: (i % 3) * 0.06,
      ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 90%" },
    });
  });

  /* ---- Stat counters ---- */
  document.querySelectorAll(".stat__num[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => (el.textContent = Math.round(obj.v)),
        }),
    });
  });

  /* ---- Dance ghost text: slides horizontally with scroll ---- */
  gsap.fromTo(".dance__bg",
    { xPercent: -58 },
    {
      xPercent: -42,
      ease: "none",
      scrollTrigger: { trigger: ".dance", start: "top bottom", end: "bottom top", scrub: true },
    }
  );

  /* ---- Contact CTA letters rise on scroll into view ---- */
  gsap.from(".contact__cta .ch", {
    yPercent: 110,
    opacity: 0,
    duration: 0.8,
    stagger: 0.04,
    ease: "power4.out",
    scrollTrigger: { trigger: ".contact", start: "top 70%" },
  });

  /* IG embeds resize after load — keep trigger positions accurate */
  window.addEventListener("load", () => {
    setTimeout(() => ScrollTrigger.refresh(), 1500);
  });
}
