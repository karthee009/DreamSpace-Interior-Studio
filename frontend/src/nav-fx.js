(() => {
  if (window.__dsNav) return;
  window.__dsNav = true;

  const desk = matchMedia('(min-width: 901px)');

  const init = tb => {
    tb.dataset.fxNav = '1';
    const nav = tb.querySelector('nav');

    /* ---- Spotlight follows mouse ---- */
    tb.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = tb.getBoundingClientRect();
      tb.style.setProperty('--tx', (e.clientX - r.left) + 'px');
      tb.style.setProperty('--ty', (e.clientY - r.top) + 'px');
    }, { passive: true });

    /* ---- Burger + mobile menu ---- */
    const bg = document.createElement('button');
    bg.type = 'button'; bg.className = 'fx-burger';
    bg.setAttribute('aria-label', 'Toggle menu'); bg.setAttribute('aria-expanded', 'false');
    bg.innerHTML = '<i></i><i></i><i></i>';
    tb.append(bg);

    const setOpen = o => {
      tb.classList.toggle('fx-open', o);
      bg.setAttribute('aria-expanded', String(o));
    };
    bg.addEventListener('click', () => setOpen(!tb.classList.contains('fx-open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('click', e => {
      if (tb.classList.contains('fx-open') && !tb.contains(e.target)) setOpen(false);
    });
    if (nav) nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });

    /* ---- Sliding pill (desktop) ---- */
    if (!nav) return;
    const pill = document.createElement('span');
    pill.className = 'fx-pill'; pill.setAttribute('aria-hidden', 'true');
    nav.append(pill);
    nav.classList.add('fx-pill-on');

    const place = a => {
      if (!a || !desk.matches) { pill.style.opacity = 0; return; }
      pill.style.opacity = 1;
      pill.style.width = a.offsetWidth + 'px';
      pill.style.height = a.offsetHeight + 'px';
      pill.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`;
    };
    const rest = () => place(nav.querySelector('a.active'));

    nav.addEventListener('pointerover', e => {
      if (e.pointerType === 'touch') return;
      const a = e.target.closest('a');
      if (a && nav.contains(a)) place(a);
    });
    nav.addEventListener('pointerleave', rest);
    nav.addEventListener('focusin', e => { const a = e.target.closest('a'); if (a) place(a); });
    nav.addEventListener('focusout', rest);

    new MutationObserver(rest).observe(nav, { attributes: true, subtree: true, attributeFilter: ['class'], childList: true });
    addEventListener('resize', rest);
    desk.addEventListener('change', e => { if (e.matches) setOpen(false); rest(); });
    document.fonts && document.fonts.ready.then(rest);

    rest();
    requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add('fx-pill-ready')));
  };

  /* React render-ku appuram topbar vandhaa init pannum, re-mount aanaalum thirumba pannum */
  let q = 0;
  const ensure = () => {
    if (q) return;
    q = requestAnimationFrame(() => {
      q = 0;
      const tb = document.querySelector('.topbar');
      if (tb && !tb.dataset.fxNav) init(tb);
    });
  };
  new MutationObserver(ensure).observe(document.documentElement, { childList: true, subtree: true });
  ensure();
})();