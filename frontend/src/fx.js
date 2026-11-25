(() => {
  if (window.__dsFx) return;
  window.__dsFx = true;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;

  const store = {
    get: (s, k) => { try { return s.getItem(k); } catch { return null; } },
    set: (s, k, v) => { try { s.setItem(k, v); } catch {} },
  };

  /* ================= SFX (Web Audio, no files) ================= */
  let ctx, master, on = store.get(localStorage, 'ds-sfx') !== 'off';
  const unlock = () => {
    if (!ctx) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return;
      ctx = new A(); master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlock, { passive: true }));
  const ready = () => on && ctx && ctx.state === 'running';

  const tone = (f, d = .1, type = 'sine', v = .08, to = null, at = 0) => {
    if (!ready()) return;
    const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .03);
  };
  const noise = (d = .25, f0 = 400, f1 = 4000, v = .05) => {
    if (!ready()) return;
    const n = Math.floor(ctx.sampleRate * d), buf = ctx.createBuffer(1, n, ctx.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
    s.buffer = buf; fl.type = 'bandpass'; fl.Q.value = 1.2;
    fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + d);
    g.gain.value = v; s.connect(fl); fl.connect(g); g.connect(master); s.start();
  };
  const sfx = {
    hover: () => tone(1400, .04, 'sine', .025),
    tick: () => tone(900, .05, 'triangle', .04),
    click: () => { tone(520, .07, 'triangle', .07, 300); tone(880, .05, 'sine', .03, null, .02); },
    add: () => { tone(440, .09, 'sine', .07, 880); tone(880, .12, 'sine', .05, 1320, .07); },
    coin: () => { tone(988, .08, 'square', .03); tone(1319, .22, 'square', .03, null, .08); },
    grab: () => tone(220, .08, 'triangle', .07, 330),
    drop: () => { tone(160, .14, 'sine', .12, 60); noise(.08, 200, 800, .03); },
    whoosh: () => noise(.35, 300, 3500, .04),
    success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, 'triangle', .06, null, i * .07)),
    error: () => { tone(180, .2, 'sawtooth', .05, 110); tone(150, .2, 'sawtooth', .05, 90, .12); },
  };
  window.dsSfx = sfx;

  /* ================= Boot ================= */
  const boot = () => {
    /* ---- Sound toggle ---- */
    const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>';
    const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
    const tg = document.createElement('button');
    tg.id = 'fx-sound'; tg.type = 'button'; tg.setAttribute('aria-label', 'Toggle sound effects');
    const paint = () => { tg.dataset.on = on; tg.innerHTML = on ? ICON_ON : ICON_OFF; };
    tg.addEventListener('click', () => { on = !on; store.set(localStorage, 'ds-sfx', on ? 'on' : 'off'); paint(); if (on) sfx.click(); });
    paint(); document.body.append(tg);

    /* ---- Intro curtain (once per session) ---- */
    let introDelay = 0;
    if (!reduce && !store.get(sessionStorage, 'ds-intro')) {
      store.set(sessionStorage, 'ds-intro', '1');
      introDelay = 950;
      const c = document.createElement('div');
      c.id = 'fx-curtain'; c.innerHTML = '<span>Dream<b>Space</b></span>';
      document.body.append(c);
      setTimeout(() => c.classList.add('fx-out'), 1000);
      setTimeout(() => c.remove(), 2100);
      setTimeout(() => { introDelay = 0; }, 1700);
    }

    /* ---- Scroll: progress, navbar, hero parallax ---- */
    const bar = document.createElement('div');
    bar.id = 'fx-progress'; document.body.append(bar);
    let lastY = scrollY, busy = false;
    addEventListener('scroll', () => {
      if (busy) return; busy = true;
      requestAnimationFrame(() => {
        const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
        document.documentElement.style.setProperty('--sy', Math.min(y, 700));
        const tb = $('.topbar');
        if (tb) {
          tb.classList.toggle('fx-scrolled', y > 20);
          if (Math.abs(y - lastY) > 4) tb.classList.toggle('fx-hide', y > lastY && y > 220);
        }
        lastY = y; busy = false;
      });
    }, { passive: true });

    /* ---- Word split headings ---- */
    const split = el => {
      el.dataset.fxSplit = '1';
      el.setAttribute('aria-label', el.textContent.trim());
      let i = 0;
      const walk = n => [...n.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.append(' '); return; }
            const w = document.createElement('span'), wi = document.createElement('span');
            w.className = 'fx-w'; wi.className = 'fx-wi';
            wi.style.setProperty('--i', i++); wi.setAttribute('aria-hidden', 'true');
            wi.textContent = p; w.append(wi); frag.append(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
      walk(el); el.classList.add('fx-split');
    };
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      setTimeout(() => el.classList.add('fx-in'), el.closest('.hero') ? introDelay : 0);
      io.unobserve(el);
    }), { threshold: .3 });
    const scan = () => {
      if (reduce) return;
      $$('.hero h1, .auth-side h1, .enquiry-section h2').forEach(el => {
        if (!el.dataset.fxSplit) { split(el); io.observe(el); }
      });
    };
    let q = 0;
    const sched = () => { if (!q) q = requestAnimationFrame(() => { q = 0; scan(); }); };

    /* ---- Ripple + click/add sounds ---- */
    const ripple = (b, e) => {
      const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
      const x = e.detail === 0 ? r.width / 2 : e.clientX - r.left;
      const y = e.detail === 0 ? r.height / 2 : e.clientY - r.top;
      const s = document.createElement('fx-r');
      s.className = 'fx-ripple';
      s.style.cssText = `width:${d}px;height:${d}px;left:${x - d / 2}px;top:${y - d / 2}px`;
      b.appendChild(s); setTimeout(() => s.remove(), 750);
    };
    document.addEventListener('click', e => {
      const b = e.target.closest('button, .btn, .catalogue-pick');
      if (!b || b.id === 'fx-sound') return;
      b.matches('.catalogue-pick') ? sfx.add() : sfx.click();
      if (!reduce) ripple(b, e);
    });

    /* ---- Hover sounds ---- */
    let lastH = null, lastT = 0;
    document.addEventListener('mouseover', e => {
      const el = e.target.closest('.btn, button, .topbar nav a, .brand, .product-card, .catalogue-pick, .tag, .feature-strip div, .stat');
      if (!el || el === lastH) return;
      lastH = el;
      const n = performance.now(); if (n - lastT < 70) return; lastT = n;
      el.matches('.catalogue-pick, .topbar nav a') ? sfx.tick() : sfx.hover();
    }, { passive: true });
    document.addEventListener('mouseout', e => { if (lastH && !lastH.contains(e.relatedTarget)) lastH = null; });

    /* ---- Designer canvas grab / drop ---- */
    let dragging = false;
    document.addEventListener('pointerdown', e => { if (e.target.closest('.scene-canvas')) { dragging = true; sfx.grab(); } });
    addEventListener('pointerup', () => { if (dragging) { dragging = false; sfx.drop(); } });

    /* ---- Custom cursor ---- */
    if (fine && !reduce) {
      const ring = document.createElement('div'), dot = document.createElement('div'), lab = document.createElement('span');
      ring.id = 'fx-ring'; dot.id = 'fx-dot'; ring.append(lab); document.body.append(ring, dot);
      let x = -100, y = -100, rx = x, ry = y;
      addEventListener('pointermove', e => {
        x = e.clientX; y = e.clientY;
        dot.style.transform = `translate(${x}px,${y}px)`;
        const t = e.target.closest('a, button, .btn, input, textarea, select, .product-card, .catalogue-pick, .scene-canvas, .tag');
        const isField = !!t && t.matches('input, textarea, select');
        ring.classList.toggle('fx-hot', !!t && !isField);
        ring.classList.toggle('fx-text', isField);
        const inControl = e.target.closest('button, a, .btn');
        const l = !inControl && e.target.closest('[data-fx-label], .product-card, .scene-canvas');
        lab.textContent = l ? (l.dataset.fxLabel || (l.matches('.scene-canvas') ? 'Drag' : 'View')) : '';
        ring.classList.toggle('fx-label', !!lab.textContent);
      }, { passive: true });
      addEventListener('pointerdown', () => ring.classList.add('fx-down'));
      addEventListener('pointerup', () => ring.classList.remove('fx-down'));
      document.documentElement.addEventListener('mouseleave', () => { ring.classList.add('fx-gone'); dot.classList.add('fx-gone'); });
      document.documentElement.addEventListener('mouseenter', () => { ring.classList.remove('fx-gone'); dot.classList.remove('fx-gone'); });
      const loop = () => { rx = lerp(rx, x, .16); ry = lerp(ry, y, .16); ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); };
      loop();
      document.documentElement.classList.add('fx-cursor-on');
    }

    /* ---- Magnetic, glow, tilt, hero parallax ---- */
    const GLOW = '.product-card, .feature-strip div, .panel, .stat, .form-card';
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || reduce) return;
      const m = e.target.closest('.btn, .brand-mark');
      if (m) {
        const r = m.getBoundingClientRect();
        m.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px');
        m.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px');
      }
      const g = e.target.closest(GLOW);
      if (g) {
        const r = g.getBoundingClientRect();
        g.style.setProperty('--gx', (e.clientX - r.left) + 'px');
        g.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      }
      const t = e.target.closest('.product-card');
      if (t) {
        const r = t.getBoundingClientRect();
        t.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 12).toFixed(2) + 'deg');
        t.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5) * 12).toFixed(2) + 'deg');
      }
      const h = e.target.closest('.hero');
      if (h) {
        const r = h.getBoundingClientRect();
        h.style.setProperty('--px', (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3));
        h.style.setProperty('--py', (((e.clientY - r.top) / r.height - .5) * 2).toFixed(3));
      }
    }, { passive: true });
    document.addEventListener('pointerout', e => {
      [['.btn, .brand-mark', ['--mx', '--my']], ['.product-card', ['--rx', '--ry']], ['.hero', ['--px', '--py']]].forEach(([sel, vars]) => {
        const el = e.target.closest(sel);
        if (el && !el.contains(e.relatedTarget)) vars.forEach(v => el.style.removeProperty(v));
      });
    });

    /* ---- Confetti ---- */
    const confetti = el => {
      if (reduce) return;
      const r = el.getBoundingClientRect(), cv = document.createElement('canvas'), c = cv.getContext('2d');
      cv.className = 'fx-confetti'; cv.width = innerWidth; cv.height = innerHeight; document.body.append(cv);
      const cs = getComputedStyle(document.documentElement);
      const cols = [cs.getPropertyValue('--accent'), '#E58A68', cs.getPropertyValue('--olive'), '#F2C9A5', '#1F1D1A'].map(s => s.trim() || '#B94E2F');
      const ps = Array.from({ length: 80 }, () => ({
        x: r.left + r.width / 2, y: r.top + r.height / 2,
        vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4,
        s: Math.random() * 7 + 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
        c: cols[(Math.random() * cols.length) | 0],
      }));
      let f = 0;
      (function step() {
        c.clearRect(0, 0, cv.width, cv.height);
        ps.forEach(p => {
          p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
          c.save(); c.globalAlpha = Math.max(0, 1 - f / 95); c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore();
        });
        if (++f < 100) requestAnimationFrame(step); else cv.remove();
      })();
    };

    /* ---- Watch DOM: errors, success, route change, total bump ---- */
    let lastBump = 0;
    new MutationObserver(ms => {
      for (const m of ms) {
        m.addedNodes.forEach(n => {
          if (n.nodeType !== 1 || n.closest?.('fx-r, .fx-confetti, #fx-ring, #fx-dot')) return;
          const find = s => (n.matches(s) ? n : n.querySelector(s));
          if (find('.error-text')) sfx.error();
          else {
            const ok = find('.notice, .form-status');
            if (ok && ok.textContent.trim()) {
              if (/error|fail|invalid|wrong|couldn|unable/i.test(ok.textContent)) sfx.error();
              else { sfx.success(); confetti(ok); }
            }
          }
          if (find('.page, .hero')) sfx.whoosh();
        });
        const el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
        const tot = el && el.closest && el.closest('.scene-total');
        if (tot && el.closest('strong') && performance.now() - lastBump > 150) {
          lastBump = performance.now();
          const s = tot.querySelector('strong');
          s.classList.remove('fx-bump'); void s.offsetWidth; s.classList.add('fx-bump');
          sfx.coin();
        }
      }
      sched();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });

    scan();
  };

  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', boot) : boot();
})();