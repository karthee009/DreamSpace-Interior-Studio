
(() => {
  if (window.__dsShow) return;
  window.__dsShow = true;

  /* ================= CONFIG ================= */
  const CONFIG = {
    duration: 6500,
    ctaLabel: "Start designing",
    ctaHref: "/designer",
    exploreLabel: "Explore designs"
  };

  /* ================ SLIDES ================= */
  const SLIDES = [
    {
      title: "Living Room",
      subtitle: "A space that feels like home.",
      media: {
        type: "image",
        src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2000&q=85"
      },
      theme: "living"
    },
    {
      title: "Bedroom",
      subtitle: "Your comfort. Your personal style.",
      media: {
        type: "image",
        src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=85"
      },
      theme: "bedroom"
    },
    {
      title: "Dining Room",
      subtitle: "Beautiful spaces for shared moments.",
      media: {
        type: "image",
        src: "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=2000&q=85"
      },
      theme: "dining"
    },
    {
      title: "Workspace",
      subtitle: "Design a space that inspires you.",
      media: {
        type: "image",
        src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=85"
      },
      theme: "workspace"
    }
  ];

  /* ================ STYLES ================= */
  const style = document.createElement("style");

  style.textContent = `
    .ds-carousel {
      position: relative;
      width: 100%;
      min-height: 570px;
      height: min(78vh, 760px);
      overflow: hidden;
      background: #171717;
      color: #fff;
      font-family: inherit;
      isolation: isolate;
    }

    .ds-carousel *,
    .ds-carousel *::before,
    .ds-carousel *::after {
      box-sizing: border-box;
    }

    .ds-slides {
      position: absolute;
      inset: 0;
    }

    .ds-slide {
      position: absolute;
      inset: 0;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition:
        opacity 800ms ease,
        visibility 800ms ease;
    }

    .ds-slide.is-active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .ds-slide img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transform: scale(1.04);
      transition: transform 7s ease;
    }

    .ds-slide.is-active img {
      transform: scale(1);
    }

    .ds-slide::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          90deg,
          rgba(0,0,0,.76) 0%,
          rgba(0,0,0,.45) 45%,
          rgba(0,0,0,.08) 100%
        ),
        linear-gradient(
          0deg,
          rgba(0,0,0,.32),
          transparent 55%
        );
      pointer-events: none;
    }

    .ds-content {
      position: absolute;
      z-index: 2;
      left: clamp(24px, 8vw, 120px);
      top: 50%;
      transform: translateY(-50%);
      width: min(620px, 82%);
    }

    .ds-eyebrow {
      display: inline-block;
      margin-bottom: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #e5c59b;
    }

    .ds-content h2 {
      margin: 0 0 20px;
      max-width: 650px;
      font-size: clamp(42px, 6.2vw, 82px);
      line-height: 1.04;
      letter-spacing: -2px;
      font-weight: 700;
      color: #fff;
    }

    .ds-content p {
      margin: 0 0 32px;
      max-width: 440px;
      font-size: clamp(15px, 1.5vw, 19px);
      line-height: 1.7;
      color: rgba(255,255,255,.88);
    }

    .ds-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
    }

    .ds-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0 24px;
      border: 1px solid transparent;
      border-radius: 4px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition:
        background .25s ease,
        color .25s ease,
        border-color .25s ease,
        transform .25s ease;
    }

    .ds-btn:hover {
      transform: translateY(-2px);
    }

    .ds-btn-primary {
      color: #21190f;
      background: #e5c59b;
    }

    .ds-btn-primary:hover {
      background: #f2d9b6;
    }

    .ds-btn-secondary {
      color: #fff;
      border-color: rgba(255,255,255,.7);
      background: rgba(255,255,255,.04);
    }

    .ds-btn-secondary:hover {
      background: rgba(255,255,255,.15);
    }

    .ds-controls {
      position: absolute;
      z-index: 4;
      right: clamp(20px, 5vw, 70px);
      bottom: 34px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ds-arrow {
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      border: 1px solid rgba(255,255,255,.55);
      border-radius: 50%;
      color: #fff;
      background: rgba(0,0,0,.18);
      cursor: pointer;
      font-size: 22px;
      transition: background .2s ease;
    }

    .ds-arrow:hover {
      background: rgba(255,255,255,.2);
    }

    .ds-progress {
      position: absolute;
      z-index: 4;
      left: clamp(24px, 8vw, 120px);
      right: clamp(24px, 8vw, 120px);
      bottom: 0;
      display: flex;
      gap: 8px;
    }

    .ds-progress button {
      position: relative;
      flex: 1;
      height: 4px;
      padding: 0;
      border: 0;
      overflow: hidden;
      cursor: pointer;
      background: rgba(255,255,255,.35);
    }

    .ds-progress button span {
      position: absolute;
      inset: 0;
      transform: scaleX(0);
      transform-origin: left;
      background: #e5c59b;
    }

    .ds-progress button.is-active span {
      animation: ds-progress-fill ${CONFIG.duration}ms linear forwards;
    }

    @keyframes ds-progress-fill {
      to { transform: scaleX(1); }
    }

    @media (max-width: 640px) {
      .ds-carousel {
        min-height: 540px;
        height: 76vh;
      }

      .ds-slide::after {
        background:
          linear-gradient(
            0deg,
            rgba(0,0,0,.78) 0%,
            rgba(0,0,0,.32) 72%,
            rgba(0,0,0,.15) 100%
          );
      }

      .ds-content {
        top: auto;
        bottom: 115px;
        left: 24px;
        width: calc(100% - 48px);
        transform: none;
      }

      .ds-content h2 {
        font-size: clamp(38px, 10vw, 56px);
        letter-spacing: -1px;
      }

      .ds-content p {
        font-size: 15px;
      }

      .ds-btn {
        min-height: 44px;
        padding: 0 16px;
      }

      .ds-controls {
        right: 24px;
        bottom: 36px;
      }

      .ds-arrow {
        width: 40px;
        height: 40px;
      }

      .ds-progress {
        left: 24px;
        right: 24px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-slide,
      .ds-slide img,
      .ds-btn {
        transition: none !important;
      }
    }
  `;

  document.head.appendChild(style);

  /* ================ CREATE CAROUSEL ================= */
  const carousel = document.createElement("section");
  carousel.className = "ds-carousel";
  carousel.setAttribute("aria-label", "Interior design showcase");

  carousel.innerHTML = `
    <div class="ds-slides"></div>

    <div class="ds-progress" aria-label="Choose a slide"></div>

    <div class="ds-controls">
      <button class="ds-arrow ds-prev"
        type="button"
        aria-label="Previous slide">‹</button>

      <button class="ds-arrow ds-next"
        type="button"
        aria-label="Next slide">›</button>
    </div>
  `;

  const slidesContainer = carousel.querySelector(".ds-slides");
  const progressContainer = carousel.querySelector(".ds-progress");

  SLIDES.forEach((slide, index) => {
    const article = document.createElement("article");
    article.className = "ds-slide";
    article.dataset.index = index;

    const image = document.createElement("img");
    image.src = slide.media.src;
    image.alt = slide.title + " interior design";
    image.loading = index === 0 ? "eager" : "lazy";
    image.decoding = "async";

    // Image fail aana background colour fallback.
    image.addEventListener("error", () => {
      image.style.display = "none";
      article.style.background =
        "linear-gradient(135deg, #514337, #171717)";
    });

    const content = document.createElement("div");
    content.className = "ds-content";

    const eyebrow = document.createElement("span");
    eyebrow.className = "ds-eyebrow";
    eyebrow.textContent = "DREAMSPACE INTERIORS";

    const heading = document.createElement("h2");
    heading.textContent = slide.title;

    const description = document.createElement("p");
    description.textContent = slide.subtitle;

    const actions = document.createElement("div");
    actions.className = "ds-actions";

    const primary = document.createElement("a");
    primary.className = "ds-btn ds-btn-primary";
    primary.href = CONFIG.ctaHref;
    primary.textContent = CONFIG.ctaLabel;

    const secondary = document.createElement("a");
    secondary.className = "ds-btn ds-btn-secondary";
    secondary.href = "/catalogue";
    secondary.textContent = CONFIG.exploreLabel;

    actions.append(primary, secondary);
    content.append(eyebrow, heading, description, actions);
    article.append(image, content);
    slidesContainer.appendChild(article);

    const progressButton = document.createElement("button");
    progressButton.type = "button";
    progressButton.setAttribute(
      "aria-label",
      "Show " + slide.title
    );

    const bar = document.createElement("span");
    progressButton.appendChild(bar);
    progressContainer.appendChild(progressButton);
  });

  /* ================ INSERT INTO PAGE ================= */
  function mountCarousel() {
    if (carousel.isConnected) return;

    const hero = document.querySelector(".hero");

    if (hero && hero.parentNode) {
      hero.parentNode.insertBefore(carousel, hero);
    } else if (document.body) {
      document.body.prepend(carousel);
    }
  }

  mountCarousel();

  /* ================ SLIDE CONTROLS ================= */
  const slides = [...carousel.querySelectorAll(".ds-slide")];
  const progressButtons = [
    ...carousel.querySelectorAll(".ds-progress button")
  ];

  let currentIndex = 0;
  let autoplayTimer = null;
  let touchStartX = 0;
  let paused = false;

  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      const active = i === currentIndex;

      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    progressButtons.forEach((button, i) => {
      button.classList.toggle("is-active", i === currentIndex);

      // Restart progress animation.
      const bar = button.querySelector("span");
      bar.style.animation = "none";
      void bar.offsetWidth;

      if (i === currentIndex && !paused) {
        bar.style.animation =
          `ds-progress-fill ${CONFIG.duration}ms linear forwards`;
      } else {
        bar.style.animation = "none";
      }
    });
  }

  function stopAutoplay() {
    if (autoplayTimer !== null) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();

    if (
      paused ||
      document.hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    autoplayTimer = setInterval(() => {
      showSlide(currentIndex + 1);
    }, CONFIG.duration);
  }

  function goToSlide(index) {
    showSlide(index);
    startAutoplay();
  }

  carousel.querySelector(".ds-prev").addEventListener("click", () => {
    goToSlide(currentIndex - 1);
  });

  carousel.querySelector(".ds-next").addEventListener("click", () => {
    goToSlide(currentIndex + 1);
  });

  progressButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      goToSlide(index);
    });
  });

  /* ================ PAUSE / RESUME ================= */
  function pauseCarousel() {
    paused = true;
    stopAutoplay();

    const activeBar =
      progressButtons[currentIndex].querySelector("span");

    activeBar.style.animationPlayState = "paused";
  }

  function resumeCarousel() {
    paused = false;
    showSlide(currentIndex);
    startAutoplay();
  }

  carousel.addEventListener("mouseenter", pauseCarousel);
  carousel.addEventListener("mouseleave", resumeCarousel);

  carousel.addEventListener("focusin", pauseCarousel);
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) {
      resumeCarousel();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  /* ================ KEYBOARD ================= */
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      goToSlide(currentIndex - 1);
    }

    if (event.key === "ArrowRight") {
      goToSlide(currentIndex + 1);
    }
  });

  /* ================ TOUCH SWIPE ================= */
  carousel.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  carousel.addEventListener("touchend", (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const distance = touchEndX - touchStartX;

    if (Math.abs(distance) > 50) {
      goToSlide(
        distance < 0 ? currentIndex + 1 : currentIndex - 1
      );
    }
  }, { passive: true });

  /* ================ INITIALIZE ================= */
  showSlide(0);
  startAutoplay();
})();
