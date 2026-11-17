/* =====================================================================
   Farid Seekh Kabab Center — core (load this first)
   ---------------------------------------------------------------------
   Shared helpers used by the other scripts, plus the basic page features.

   Script files (all loaded with `defer`, in this order):
     core.js      this file: helpers, open/closed status, menu, scroll reveal
     fire.js      embers, smoke and flames (canvas)
     sections.js  marquee, hero tilt, plate, craft, how-to-eat
     effects.js   ember headline, cursor trail, smooth scrolling
     sound.js     sizzle sound button
   (sw.js in the main folder is the offline-support worker, registered in section 5)

   Contents
     1. Shared helpers (window.FSK)
        - FSK.reduce / FSK.finePointer
        - FSK.ticker: ONE animation loop shared by every effect
        - FSK.onceVisible / FSK.watchVisible
     2. Footer year, years since 1992, open/closed status
     3. Mobile menu
     4. Scroll reveal
     5. Install as an app (offline support + "Install app" button)
   ===================================================================== */

(() => {
  /* -------------------------------------------------------------------
     1. SHARED HELPERS
     ------------------------------------------------------------------- */
  const FSK = (window.FSK = {});

  // Visitor asked their device to reduce motion → skip animations
  FSK.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // A real mouse (desktop/laptop) rather than a touch screen
  FSK.finePointer = matchMedia('(pointer: fine)').matches;

  FSK.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  FSK.easeOut = t => 1 - Math.pow(1 - t, 3);

  /* Ticker: a single requestAnimationFrame loop for the whole site.
     Effects register a function with FSK.ticker.add(fn); it's called
     every frame with (time, dt). Return `false` from fn to stop it.
     One loop instead of many keeps frames in sync and cheaper, and it
     stops completely when nothing needs animating. */
  const jobs = new Set();
  let running = false, last = 0;
  function frame(now) {
    const dt = Math.min(50, now - last || 16.7);   // ms since last frame (capped after tab switches)
    last = now;
    for (const fn of jobs) if (fn(now, dt) === false) jobs.delete(fn);
    if (jobs.size) requestAnimationFrame(frame); else running = false;
  }
  FSK.ticker = {
    add(fn) {
      jobs.add(fn);
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
      return fn;
    },
    remove(fn) { jobs.delete(fn); },
  };

  // Run fn once, the first time el scrolls into view
  FSK.onceVisible = (el, fn, threshold = 0.35) => {
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); fn(); }
    }, { threshold });
    io.observe(el);
  };

  // Call fn(true/false) whenever el enters or leaves the screen.
  // `margin` starts things a little before they appear.
  FSK.watchVisible = (el, fn, margin = '100px') => {
    if (!el) return;
    new IntersectionObserver(([e]) => fn(e.isIntersecting), { rootMargin: margin }).observe(el);
  };


  /* -------------------------------------------------------------------
     2. FOOTER YEAR, YEARS SINCE 1992, OPEN/CLOSED STATUS
     ------------------------------------------------------------------- */
  const year = new Date().getFullYear();
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = year;

  // Years in business, counted from 1992 so it updates itself every year
  document.querySelectorAll('.years-count').forEach(el => { el.textContent = year - 1992; });

  // Open 5 PM – 1 AM, checked in Mumbai time so it's right for anyone, anywhere
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', hourCycle: 'h23',
  }).format(new Date()));
  const isOpen = hour >= 17 || hour < 1;   // 17:00 to 00:59

  const badge = document.getElementById('openBadge');          // hours card
  if (badge) {
    badge.textContent = isOpen ? 'Open now' : 'Closed now · opens 5 PM';
    badge.classList.add(isOpen ? 'is-open' : 'is-closed');
  }
  const heroOpen = document.getElementById('heroOpen');        // pill above the headline
  if (heroOpen) {
    heroOpen.textContent = isOpen ? 'Open now · till 1 AM' : 'Closed now · opens at 5 PM';
    heroOpen.classList.add(isOpen ? 'is-open' : 'is-closed');
    heroOpen.hidden = false;
  }


  /* -------------------------------------------------------------------
     3. MOBILE MENU
     The ☰ button (phones only) opens and closes the link panel.
     Tapping a link, tapping outside, or pressing Escape closes it.
     ------------------------------------------------------------------- */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  if (nav && burger) {
    const setMenu = open => {
      nav.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    burger.addEventListener('click', e => { e.stopPropagation(); setMenu(!nav.classList.contains('menu-open')); });
    nav.querySelectorAll('ul a').forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', e => { if (!nav.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }


  /* -------------------------------------------------------------------
     4. SCROLL REVEAL
     Adds .in to each .reveal element the first time it scrolls into
     view; the fade/rise itself is in styles.css.
     ------------------------------------------------------------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });   // starts a little early so nothing waits
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));


  /* -------------------------------------------------------------------
     5. INSTALL AS AN APP
     - Registers sw.js for offline support (only works once the site is
       online over https; it's skipped when opening the file directly).
     - Android / desktop Chrome & Edge: the browser says when the site can
       be installed; we then show "Install app" in the menu and footer,
       and tapping it opens the browser's own install prompt.
     - iPhone / iPad Safari has no install prompt, so "Install app" opens
       a short how-to instead (Share → Add to Home Screen).
     - Already running as an installed app: the buttons stay hidden.
     ------------------------------------------------------------------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const showInstall = on => document.querySelectorAll('.nav-install, .footer-install').forEach(el => { el.hidden = !on; });
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const tip = document.getElementById('installTip');
  let deferredPrompt = null;

  if (!installed) {
    // Chrome / Edge / Samsung Internet: keep the browser's prompt for our button
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; showInstall(true); });
    addEventListener('appinstalled', () => { deferredPrompt = null; showInstall(false); });
    // iPhone / iPad: always offer the how-to
    if (isIOS) showInstall(true);
  }

  document.querySelectorAll('.install-btn').forEach(btn => btn.addEventListener('click', async () => {
    if (nav) nav.classList.remove('menu-open');   // close the phone menu first
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      showInstall(false);
    } else if (tip) {
      tip.hidden = false;
      document.getElementById('installClose').focus();
    }
  }));

  // Close the how-to: × button, tapping the dark backdrop, or Escape
  if (tip) {
    const close = () => { tip.hidden = true; };
    document.getElementById('installClose').addEventListener('click', close);
    tip.addEventListener('click', e => { if (e.target === tip) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
})();
