/* Sean Salazar — kinetic animations (Lenis + GSAP + ScrollTrigger) */

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

/* Timecode ticker — running film timecode in the hero frame */
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
const finePointer = window.matchMedia("(pointer: fine)").matches;
if (!reduceMotion && finePointer) {
  const spot = document.querySelector(".spotlight");
  window.addEventListener("pointermove", (e) => {
    spot.style.setProperty("--spot-x", e.clientX + "px");
    spot.style.setProperty("--spot-y", e.clientY + "px");
  }, { passive: true });
}

/* ---- YouTube click-to-play facades: thumbnail + play, iframe only on demand ---- */
document.querySelectorAll(".yt[data-yt]").forEach((box) => {
  const id = box.dataset.yt;
  const title = box.dataset.ytTitle || "Play video";

  const img = document.createElement("img");
  img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  img.alt = title;
  img.loading = "lazy";

  const play = document.createElement("button");
  play.className = "yt__play";
  play.setAttribute("aria-label", `Play: ${title}`);
  play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.8v16.4c0 .9 1 1.5 1.8 1L21 12.9c.8-.5.8-1.6 0-2.1L7.8 2.7C7 2.3 6 2.9 6 3.8Z"/></svg>';

  box.append(img, play);

  box.addEventListener("click", () => {
    if (box.querySelector("iframe")) return;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = title;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    box.replaceChildren(iframe);
  });
});

/* Restore a facade (used when an accordion closes, so audio stops) */
function resetFacade(box) {
  if (!box || !box.querySelector("iframe")) return;
  box.replaceChildren();
  const id = box.dataset.yt;
  const title = box.dataset.ytTitle || "Play video";
  const img = document.createElement("img");
  img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  img.alt = title;
  const play = document.createElement("button");
  play.className = "yt__play";
  play.setAttribute("aria-label", `Play: ${title}`);
  play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.8v16.4c0 .9 1 1.5 1.8 1L21 12.9c.8-.5.8-1.6 0-2.1L7.8 2.7C7 2.3 6 2.9 6 3.8Z"/></svg>';
  box.append(img, play);
}

/* ---- Style accordion: one look open at a time ---- */
const styleCards = document.querySelectorAll(".style-card");
styleCards.forEach((card) => {
  const head = card.querySelector(".style-card__head");
  head.addEventListener("click", () => {
    const isOpen = card.classList.contains("is-open");
    styleCards.forEach((c) => {
      if (c !== card && c.classList.contains("is-open")) {
        c.classList.remove("is-open");
        c.querySelector(".style-card__head").setAttribute("aria-expanded", "false");
        resetFacade(c.querySelector(".yt"));
      }
    });
    card.classList.toggle("is-open", !isOpen);
    head.setAttribute("aria-expanded", String(!isOpen));
    if (isOpen) resetFacade(card.querySelector(".yt"));
    if (typeof ScrollTrigger !== "undefined") {
      setTimeout(() => ScrollTrigger.refresh(), 650);
    }
  });
});

/* ---- Pricing calculator ---- */
(function () {
  const btsToggle = document.getElementById("btsToggle");
  const zoneInputs = document.querySelectorAll('input[name="zone"]');
  const milesWrap = document.getElementById("milesWrap");
  const milesInput = document.getElementById("milesInput");
  const linesEl = document.getElementById("calcLines");
  const totalEl = document.getElementById("calcTotal");
  const bookBtn = document.getElementById("bookBtn");
  const toastEl = document.getElementById("calcToast");
  if (!btsToggle || !linesEl || !totalEl) return;

  const BASE = 180;
  const BTS = 60;
  const RATE_PER_MILE = 0.7;

  let state = { zone: "local", miles: 0, bts: false, total: BASE };

  function currentZone() {
    return [...zoneInputs].find((r) => r.checked)?.value || "local";
  }

  function recalc() {
    const zone = currentZone();
    milesWrap.hidden = zone !== "other";

    const lines = [`Class filming <b>$${BASE}</b>`];
    let total = BASE;
    let travelFee = 0;
    const miles = Math.max(0, Number(milesInput.value) || 0);

    if (btsToggle.checked) {
      lines.push(`BTS coverage <b>+$${BTS}</b>`);
      total += BTS;
    }

    if (zone === "other") {
      travelFee = Math.round(miles * 2 * RATE_PER_MILE);
      lines.push(`Travel, ${miles} mi roundtrip <b>+$${travelFee}</b>`);
      total += travelFee;
    } else {
      lines.push(`Travel, local area <b>$0</b>`);
    }

    linesEl.innerHTML = lines.map((l) => `<span>${l}</span>`).join("");
    totalEl.textContent = `$${total}`;

    state = { zone, miles, bts: btsToggle.checked, total };
  }

  btsToggle.addEventListener("change", recalc);
  zoneInputs.forEach((r) => r.addEventListener("change", recalc));
  milesInput?.addEventListener("input", recalc);
  recalc();

  /* Copy a ready-to-send booking summary, then let the DM link open as normal */
  const TOAST_DEFAULT = "Tap to copy these details, then paste them into the DM.";
  function showToast() {
    if (!toastEl) return;
    toastEl.textContent = "Copied! Paste it into the chat.";
    toastEl.classList.add("is-visible");
    clearTimeout(toastEl._hideTimer);
    toastEl._hideTimer = setTimeout(() => {
      toastEl.classList.remove("is-visible");
      toastEl.textContent = TOAST_DEFAULT;
    }, 4000);
  }

  function legacyCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  bookBtn?.addEventListener("click", () => {
    const locationLine =
      state.zone === "other"
        ? `Location: about ${state.miles} mi from Hayward (+$${Math.round(state.miles * 2 * RATE_PER_MILE)} travel)`
        : "Location: Hayward, Fremont, or San Jose (no travel fee)";

    const summary = [
      "Hi Sean! I'd like to book a class filming session.",
      `Base rate: $${BASE}`,
      state.bts ? `BTS coverage: yes (+$${BTS})` : "BTS coverage: no",
      locationLine,
      `Estimated total: $${state.total}`,
    ].join("\n");

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).then(showToast, () => {
        if (legacyCopy(summary)) showToast();
      });
    } else if (legacyCopy(summary)) {
      showToast();
    }
  });
})();

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

  /* ---- Lenis smooth scroll, driven by GSAP's ticker ---- */
  let lenis = null;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    /* Anchor links scroll through Lenis so they stay buttery */
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -90 });
        }
      });
    });
  }

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
    .from(".hero__actions .btn", { opacity: 0, y: 24, duration: 0.6, stagger: 0.1 }, "-=0.3")
    .from(".hero__frame", { opacity: 0, scale: 1.04, duration: 0.8 }, "-=0.5")
    .add(revealNav, "-=0.6");

  /* ---- Hero parallax: title drifts up + fades as you scroll past ---- */
  gsap.to(".hero__title", {
    yPercent: -22,
    opacity: 0.25,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* ---- Masked title reveals: headlines wipe up from a clip ---- */
  document.querySelectorAll("[data-title]").forEach((el) => {
    gsap.fromTo(el,
      { clipPath: "inset(0 0 100% 0)", y: 46 },
      {
        clipPath: "inset(0 0 -12% 0)",
        y: 0,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      }
    );
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

  /* ---- Marquee: skews with scroll velocity, like tape catching speed ---- */
  const skewSetter = gsap.quickSetter(".marquee__track", "skewX", "deg");
  const skewProxy = { v: 0 };
  ScrollTrigger.create({
    onUpdate: (self) => {
      const skew = gsap.utils.clamp(-8, 8, self.getVelocity() / -350);
      if (Math.abs(skew) > Math.abs(skewProxy.v)) {
        skewProxy.v = skew;
        gsap.to(skewProxy, {
          v: 0,
          duration: 0.9,
          ease: "power3.out",
          overwrite: true,
          onUpdate: () => skewSetter(skewProxy.v),
        });
      }
    },
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

  /* ---- Dance stills: gentle counter-parallax drift ---- */
  gsap.utils.toArray(".dance__still").forEach((el, i) => {
    gsap.to(el, {
      yPercent: i % 2 ? 9 : -9,
      ease: "none",
      scrollTrigger: { trigger: ".dance__strip", start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  /* ---- Credits roll: names rise in sequence ---- */
  gsap.from(".credits__list li", {
    y: 64,
    opacity: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: "power4.out",
    scrollTrigger: { trigger: ".credits__list", start: "top 85%" },
  });

  /* ---- Contact CTA letters rise on scroll into view ---- */
  gsap.from(".contact__cta .ch", {
    yPercent: 110,
    opacity: 0,
    duration: 0.8,
    stagger: 0.04,
    ease: "power4.out",
    scrollTrigger: { trigger: ".contact", start: "top 70%" },
  });

  /* ---- Magnetic buttons: pull toward the cursor, spring back ---- */
  if (finePointer) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      const strength = 26;
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(btn, {
          x: (x / r.width) * strength,
          y: (y / r.height) * strength,
          duration: 0.4,
          ease: "power3.out",
        });
      });
      btn.addEventListener("pointerleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* IG embeds resize after load — keep trigger positions accurate */
  window.addEventListener("load", () => {
    setTimeout(() => ScrollTrigger.refresh(), 1500);
  });
}
