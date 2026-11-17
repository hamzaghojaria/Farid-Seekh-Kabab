/* =====================================================================
   Farid Seekh Kabab Center — fire (embers, smoke, flames)
   ---------------------------------------------------------------------
   All drawn on <canvas> elements. Speed tricks used here:
     - Glows, smoke puffs and flame shapes are drawn ONCE onto small
       off-screen "sprites", then stamped each frame (much cheaper than
       building gradients or blurs every frame).
     - Soft effects are drawn at normal (not retina) resolution — they're
       blurry glows, so extra pixels add cost but no visible detail.
     - Each canvas only animates while it can actually be seen, and the
       fixed whole-site layers pause while the hero photo covers them.

   Contents
     1. Sprites (glow dot, smoke puff, flame tongue)
     2. emberField(): rising sparks + drifting smoke, optional mouse reaction
     3. flameLayer(): low flickering flames along the bottom of the screen
     4. Start everything
   ===================================================================== */

(() => {
  const { reduce, ticker, watchVisible } = window.FSK;

  /* -------------------------------------------------------------------
     1. SPRITES
     ------------------------------------------------------------------- */
  function sprite(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    return c;
  }

  // Glowing spark: white-hot centre fading to orange
  const GLOW = sprite(32, 32, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,230,170,1)');
    r.addColorStop(0.25, 'rgba(255,150,50,0.9)');
    r.addColorStop(1, 'rgba(255,90,20,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });

  // Smoke puff: soft grey circle (opacity is applied when stamping)
  const SMOKE = sprite(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(210,195,180,1)');
    r.addColorStop(1, 'rgba(210,195,180,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });

  // Flame tongue: teardrop, yellow at the base → orange → transparent tip
  const FLAME = sprite(32, 128, (g, w, h) => {
    const lin = g.createLinearGradient(0, h, 0, 0);
    lin.addColorStop(0, 'rgba(255,170,70,0.45)');
    lin.addColorStop(0.35, 'rgba(255,100,25,0.32)');
    lin.addColorStop(1, 'rgba(180,40,0,0)');
    g.fillStyle = lin;
    g.beginPath();
    g.moveTo(0, h);
    g.quadraticCurveTo(0, h * 0.5, w / 2, 0);
    g.quadraticCurveTo(w, h * 0.5, w, h);
    g.closePath(); g.fill();
  });


  /* -------------------------------------------------------------------
     2. EMBER FIELD
     options:
       density      sparks on a 1440px-wide screen (fewer on smaller screens)
       interactive  sparks/smoke react to the mouse or finger (hero)
       dpr          canvas resolution multiplier (1 = normal)
     Returns { setActive(bool) } so callers can pause it.
     ------------------------------------------------------------------- */
  function emberField(canvas, { density, interactive = false, dpr = 1 }) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, base = 0, parts = [], smoke = [], t = 0;

    function size() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      base = Math.round(Math.min(W, 1600) / 1440 * density);
      parts = Array.from({ length: base }, () => spawn(true));
      smoke = Array.from({ length: Math.max(3, Math.round(W / 220)) }, () => ({
        x: Math.random() * W, y: H * (0.4 + Math.random() * 0.7),
        r: 160 + Math.random() * 220,          // radius
        vy: 0.15 + Math.random() * 0.25,       // rise speed
        a: 0.035 + Math.random() * 0.03,       // opacity
        ph: Math.random() * 6,                 // drift phase
      }));
    }

    // One spark. `initial` scatters it on first load; otherwise it starts below the bottom edge.
    function spawn(initial) {
      return {
        x: Math.random() * W, y: initial ? Math.random() * H : H + 10,
        vy: 0.35 + Math.random() * 1.25,       // rise speed
        r: 0.6 + Math.random() * 2.1,          // size
        ph: Math.random() * Math.PI * 2,       // wobble/flicker phase
        sw: 0.4 + Math.random() * 1.2,         // wobble strength
        life: 0.5 + Math.random() * 0.5,       // max brightness
        vx: 0,                                 // sideways push from the pointer
      };
    }

    // Pointer interaction (hero): push sparks away, pull smoke along, throw sparks when moving fast
    const ptr = { x: -9999, y: -9999 };
    if (interactive && !reduce) {
      addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        const nx = e.clientX - r.left, ny = e.clientY - r.top;
        if (ny < 0 || ny > r.height) { ptr.x = -9999; return; }
        const vx = nx - ptr.x;
        if (ptr.x > -9000 && Math.abs(vx) > 6 && parts.length < base * 1.6) {
          for (let k = 0; k < 2; k++) {
            const p = spawn(false);
            p.x = nx; p.y = ny; p.vy = 1 + Math.random() * 2; p.vx = vx * 0.15;
            parts.push(p);
          }
        }
        ptr.x = nx; ptr.y = ny;
      }, { passive: true });
    }

    function draw(_, dt) {
      const k = dt / 16.7;                     // keeps speed the same on 60Hz and 120Hz screens
      t += 0.016 * k;
      ctx.clearRect(0, 0, W, H);

      // Smoke
      ctx.globalCompositeOperation = 'source-over';
      for (const s of smoke) {
        s.y -= s.vy * k;
        s.x += Math.sin(t * 0.3 + s.ph) * 0.3 * k;
        if (interactive) {
          const dx = ptr.x - s.x, dy = ptr.y - s.y;
          if (dx * dx + dy * dy < s.r * s.r) { s.x += dx * 0.004; s.y += dy * 0.004; }
        }
        if (s.y < -s.r) { s.y = H + s.r; s.x = Math.random() * W; }
        ctx.globalAlpha = s.a;
        ctx.drawImage(SMOKE, s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
      }

      // Sparks ('lighter' makes overlapping glows brighter)
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y -= p.vy * k;
        p.x += (Math.sin(t * 2 + p.ph) * p.sw + p.vx) * k;
        p.vx *= 0.94;
        if (interactive) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < 12100 && d2 > 1) {           // within 110px
            const d = Math.sqrt(d2), f = (1 - d / 110) * 2.2;
            p.vx += (dx / d) * f; p.y += (dy / d) * f * 0.5;
          }
        }
        const alpha = Math.max(0, Math.min(1, p.y / H)) * p.life * (0.6 + 0.4 * Math.sin(t * 8 + p.ph));
        if (p.y < -10 || (alpha <= 0.01 && p.y < H * 0.3)) {
          if (parts.length > base) { parts.splice(i, 1); i--; }   // extra pointer sparks disappear
          else parts[i] = spawn(false);
          continue;
        }
        const d = p.r * 6;
        ctx.globalAlpha = alpha;
        ctx.drawImage(GLOW, p.x - d / 2, p.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    }

    size();
    addEventListener('resize', () => { size(); if (reduce) draw(0, 16.7); });

    if (reduce) { draw(0, 16.7); return { setActive() {} }; }   // one still frame
    let active = false;
    return {
      setActive(on) {
        if (on === active) return;
        active = on;
        on ? ticker.add(draw) : ticker.remove(draw);
      },
    };
  }


  /* -------------------------------------------------------------------
     3. FLAME LAYER
     Drawn at a quarter of the screen size and stretched up (cheap, and
     the stretch softens it). Each tongue is the FLAME sprite, scaled to
     its flickering height and skewed so its tip sways.
     ------------------------------------------------------------------- */
  function flameLayer(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const SCALE = 0.25;
    let W = 0, H = 0, tongues = [], glow = null, t = 0;

    function size() {
      W = Math.max(1, Math.round(innerWidth * SCALE));
      H = Math.max(1, Math.round(innerHeight * SCALE));
      canvas.width = W; canvas.height = H;
      tongues = Array.from({ length: Math.ceil(W / 10) + 2 }, (_, i) => ({
        x: i * 10 - 5, w: 14 + Math.random() * 10,
        speed: 1.5 + Math.random() * 2.5, ph: Math.random() * Math.PI * 2,
      }));
      // Steady warm glow along the bottom edge (built once per resize)
      const maxH = H * (innerWidth < 761 ? 0.06 : 0.08);
      glow = ctx.createLinearGradient(0, H, 0, H - maxH * 0.5);
      glow.addColorStop(0, 'rgba(255,120,30,0.35)');
      glow.addColorStop(1, 'rgba(255,120,30,0)');
    }

    function draw(_, dt) {
      t += 0.016 * (dt / 16.7);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const maxH = H * (innerWidth < 761 ? 0.06 : 0.08);   // 8% of the screen (6% on phones)
      for (const f of tongues) {
        const flick = 0.55 + 0.3 * Math.sin(t * f.speed + f.ph) + 0.15 * Math.sin(t * f.speed * 2.3 + f.ph * 2);
        const h = Math.max(1, maxH * flick);
        const sway = Math.sin(t * 1.3 + f.ph) * 4;
        ctx.setTransform(1, 0, -sway / h, 1, f.x, H);         // skew so the tip leans by `sway`
        ctx.drawImage(FLAME, -f.w / 2, -h, f.w, h);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = glow;
      ctx.fillRect(0, H - maxH * 0.5, W, maxH * 0.5);
    }

    size();
    addEventListener('resize', () => { size(); if (reduce) draw(0, 16.7); });
    if (reduce) { draw(0, 16.7); return { setActive() {} }; }
    let active = false;
    return { setActive(on) { if (on !== active) { active = on; on ? ticker.add(draw) : ticker.remove(draw); } } };
  }


  /* -------------------------------------------------------------------
     4. START EVERYTHING
     ------------------------------------------------------------------- */
  const hero = document.getElementById('top');

  // Hero sparks: react to the pointer; run only while the hero is on screen
  const heroFire = emberField(document.getElementById('embers'), { density: 110, interactive: true });
  watchVisible(hero, on => heroFire && heroFire.setActive(on), '0px');

  // Craft photo sparks: small canvas, so slightly sharper resolution
  const craftCanvas = document.getElementById('embers3');
  const craftFire = emberField(craftCanvas, { density: 45, dpr: Math.min(devicePixelRatio || 1, 1.5) });
  watchVisible(craftCanvas, on => craftFire && craftFire.setActive(on));

  // Whole-site layers (fixed behind everything). The hero photo hides them,
  // so they pause while the hero fills most of the screen.
  const siteFire = emberField(document.getElementById('fireEmbers'), { density: 55 });
  const flames = flameLayer(document.getElementById('flames'));
  if (hero) {
    new IntersectionObserver(([e]) => {
      const covered = e.intersectionRatio > 0.9;
      siteFire && siteFire.setActive(!covered);
      flames && flames.setActive(!covered);
    }, { threshold: [0, 0.9, 1] }).observe(hero);
  } else {
    siteFire && siteFire.setActive(true);
    flames && flames.setActive(true);
  }
})();
