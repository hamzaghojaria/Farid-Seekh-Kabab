/* =====================================================================
   Farid Seekh Kabab Center — page-wide effects
   ---------------------------------------------------------------------
   Styles for these are in css/effects.css.

   Contents
     1. Ember headline: "Charred outside." letters glow hot, then cool
     2. Heat shimmer: pause the hero ripple while the hero is off screen
     3. Ember cursor with a spark trail (mouse only)
     4. Smooth scrolling (mouse/trackpad only)
   ===================================================================== */

(() => {
  const { reduce, finePointer, ticker, watchVisible } = window.FSK;


  /* -------------------------------------------------------------------
     1. EMBER HEADLINE
     Wraps each letter in a span with its index (--i). CSS starts each
     letter white-hot and cools it to cream, slightly later per letter,
     so the heat sweeps across. Words stay together (no mid-word breaks).
     ------------------------------------------------------------------- */
  const emberText = document.querySelector('.ember-text');
  if (emberText) {
    const title = document.getElementById('heroTitle');
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());   // screen readers read it normally
    let i = 0;
    emberText.innerHTML = emberText.textContent.split(' ').map(word =>
      '<span class="word" aria-hidden="true">' +
      [...word].map(ch => `<span class="ch" style="--i:${i++}">${ch}</span>`).join('') +
      '</span>').join(' ');
  }


  /* -------------------------------------------------------------------
     2. HEAT SHIMMER
     The ripple is an animated SVG filter (index.html, #heat). Pausing its
     animation while the hero is off screen saves work while scrolling.
     ------------------------------------------------------------------- */
  const defs = document.querySelector('.svg-defs');
  if (defs && defs.pauseAnimations) {
    if (reduce) defs.pauseAnimations();
    else watchVisible(document.getElementById('top'), on => (on ? defs.unpauseAnimations() : defs.pauseAnimations()), '0px');
  }


  /* -------------------------------------------------------------------
     3. EMBER CURSOR + SPARK TRAIL
     A soft glow follows the mouse; moving throws small sparks that float
     up and fade. The normal cursor stays visible. It only animates while
     the mouse is moving or sparks are still alive.
     ------------------------------------------------------------------- */
  const ember = document.getElementById('cursorEmber');
  const trail = document.getElementById('cursorTrail');

  if (ember && trail && finePointer && !reduce) {
    document.documentElement.classList.add('has-ember-cursor');
    const ctx = trail.getContext('2d');
    let W = 0, H = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      trail.width = W * dpr; trail.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); addEventListener('resize', size);

    let mx = -100, my = -100, ex = -100, ey = -100, lastX = 0, lastY = 0;
    let sparks = [], drawn = false;

    function loop(_, dt) {
      const k = dt / 16.7;
      const e = 1 - Math.pow(0.78, k);         // ember eases towards the mouse
      ex += (mx - ex) * e; ey += (my - ey) * e;
      ember.style.transform = `translate3d(${ex.toFixed(1)}px, ${ey.toFixed(1)}px, 0)`;

      if (sparks.length || drawn) {
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        sparks = sparks.filter(s => (s.life -= 0.025 * k) > 0);
        for (const s of sparks) {
          s.x += s.vx * k; s.y += s.vy * k; s.vy -= 0.01 * k;
          ctx.fillStyle = `rgba(255,${(140 + s.life * 90) | 0},60,${s.life.toFixed(2)})`;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (0.5 + s.life * 0.5), 0, Math.PI * 2); ctx.fill();
        }
        drawn = sparks.length > 0;
      }
      // Keep running while sparks are alive or the ember is still catching up
      return sparks.length > 0 || Math.abs(mx - ex) + Math.abs(my - ey) > 0.5;
    }

    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      ember.classList.add('on');
      const n = Math.min(3, Math.floor(Math.hypot(mx - lastX, my - lastY) / 14));
      lastX = mx; lastY = my;
      for (let k = 0; k < n && sparks.length < 80; k++) {
        sparks.push({ x: mx, y: my, vx: (Math.random() - 0.5) * 1.2, vy: -0.4 - Math.random() * 1.2, life: 1, r: 0.8 + Math.random() * 1.6 });
      }
      ticker.add(loop);
    }, { passive: true });
    document.addEventListener('mouseleave', () => ember.classList.remove('on'));
    // Bigger glow over things you can click
    document.addEventListener('pointerover', e => {
      ember.classList.toggle('hot', !!e.target.closest('a, button, [data-step]'));
    });
  }


  /* -------------------------------------------------------------------
     4. SMOOTH SCROLLING
     Uses the Lenis library (js/vendor/lenis.min.js). Phones keep their
     own natural scrolling. In-page links glide to their section.
     ------------------------------------------------------------------- */
  if (window.Lenis && finePointer && !reduce) {
    const lenis = new Lenis({ lerp: 0.1 });
    window.FSK.lenis = lenis;
    ticker.add(time => { lenis.raf(time); });   // Lenis needs a tick every frame

    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href');
        const target = id === '#top' ? 0 : document.querySelector(id);
        if (target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: id === '#top' ? 0 : -24, duration: 1.2 });
      });
    });
  }
})();
