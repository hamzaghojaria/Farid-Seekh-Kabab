/* =====================================================================
   Farid Seekh Kabab Center — section effects
   ---------------------------------------------------------------------
   Every effect here runs on the shared ticker (core.js) and only while
   it's needed: when its section is on screen, or right after a scroll /
   mouse move. When nothing changes, nothing runs.

   Contents
     1. Marquee: two crossing bands, faster while scrolling
     2. Hero: 3D tilt towards the mouse / phone tilt, plus parallax
     3. The Plate: labels (tap to open), pop-in, 3D tilt that levels out on scroll
     4. Craft: year counter, stamp slam, kebab photo zoom on scroll
     5. How to eat: cards flip in turn, icons animate, progress line fills
   ===================================================================== */

(() => {
  const { reduce, ticker, watchVisible, onceVisible, clamp, easeOut } = window.FSK;


  /* -------------------------------------------------------------------
     1. MARQUEE
     Each track's content is doubled, so shifting it by half its width
     is exactly one copy (seamless loop). data-dir sets the direction.
     Scrolling adds speed that eases back when you stop.
     ------------------------------------------------------------------- */
  const marquee = document.querySelector('.marquee');
  const tracks = [...document.querySelectorAll('.marquee .track')];
  tracks.forEach(tr => { tr.innerHTML += tr.innerHTML; });

  if (marquee && tracks.length && !reduce) {
    const BASE = 0.6;                          // normal speed, px per frame at 60fps
    let boost = 0, lastY = scrollY;
    const offsets = tracks.map(() => 0);
    let halves = [];                           // half of each track's width (cached: reading it every frame is slow)
    const measure = () => { halves = tracks.map(tr => tr.scrollWidth / 2); };
    measure();
    addEventListener('resize', measure);
    document.fonts && document.fonts.ready.then(measure);   // widths change once the fonts load

    addEventListener('scroll', () => {
      boost = Math.min(18, boost + Math.abs(scrollY - lastY) * 0.25);
      lastY = scrollY;
    }, { passive: true });

    function move(_, dt) {
      const k = dt / 16.7;
      boost *= Math.pow(0.92, k);              // ease back to normal speed
      tracks.forEach((tr, i) => {
        const dir = Number(tr.dataset.dir) || -1;
        offsets[i] += (BASE + boost) * dir * k;
        if (offsets[i] <= -halves[i]) offsets[i] += halves[i];
        if (offsets[i] > 0) offsets[i] -= halves[i];
        tr.style.transform = `translate3d(${offsets[i].toFixed(2)}px,0,0)`;
      });
    }
    watchVisible(marquee, on => (on ? ticker.add(move) : ticker.remove(move)));
  }


  /* -------------------------------------------------------------------
     2. HERO 3D TILT + PARALLAX
     The photo tilts towards the mouse (or with phone tilt where the
     browser allows it), shifts a little, and scrolls slower than the
     page. It eases to its target, then stops until something changes.
     ------------------------------------------------------------------- */
  const hero = document.getElementById('top');
  const heroMedia = document.getElementById('heroMedia');

  if (hero && heroMedia && !reduce) {
    let tx = 0, ty = 0, x = 0, y = 0, sy = -1, heroOn = true;

    function tilt(_, dt) {
      const e = 1 - Math.pow(0.94, dt / 16.7);   // easing, same feel at any frame rate
      x += (tx - x) * e; y += (ty - y) * e;
      const s = scrollY;
      heroMedia.style.transform =
        `perspective(1400px) rotateY(${(x * 7).toFixed(3)}deg) rotateX(${(-y * 5).toFixed(3)}deg) ` +
        `translate3d(${(x * -18).toFixed(2)}px, ${(y * -12 + s * 0.25).toFixed(2)}px, 0) scale(1.03)`;
      const settled = Math.abs(tx - x) < 0.001 && Math.abs(ty - y) < 0.001 && s === sy;
      sy = s;
      return !settled;                         // stop the job once nothing is moving
    }
    const wake = () => { if (heroOn) ticker.add(tilt); };

    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; wake();
    }, { passive: true });
    addEventListener('deviceorientation', e => {
      if (e.gamma == null) return;
      tx = clamp(e.gamma / 50, -0.5, 0.5); ty = clamp((e.beta - 45) / 70, -0.5, 0.5); wake();
    }, { passive: true });
    addEventListener('scroll', wake, { passive: true });
    watchVisible(hero, on => { heroOn = on; on ? wake() : ticker.remove(tilt); }, '0px');
    wake();
  }


  /* -------------------------------------------------------------------
     3. THE PLATE
     ------------------------------------------------------------------- */
  const plateMap = document.getElementById('plateMap');
  const tags = [...document.querySelectorAll('.tag')];

  // Tap/click a label to keep its description open; tap elsewhere or Escape to close
  const openTag = tag => tags.forEach(t => {
    t.classList.toggle('open', t === tag);
    t.setAttribute('aria-expanded', String(t === tag));
  });
  tags.forEach(tag => tag.addEventListener('click', e => {
    e.stopPropagation();
    openTag(tag.classList.contains('open') ? null : tag);
  }));
  document.addEventListener('click', () => openTag(null));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') openTag(null); });

  // Labels pop in one by one once the photo is mostly on screen
  if (plateMap) {
    if (reduce) plateMap.classList.add('tags-in');
    else onceVisible(plateMap, () => plateMap.classList.add('tags-in'), 0.55);
  }


  /* -------------------------------------------------------------------
     4. CRAFT
     ------------------------------------------------------------------- */
  const art = document.getElementById('craftArt');
  const artPhoto = art && art.querySelector('.art-photo');

  // Year counter: 1992 → this year, slowing near the end, then a small bounce
  const yrNow = document.getElementById('yrNow');
  if (yrNow) {
    const from = Number(yrNow.dataset.from) || 1992, to = new Date().getFullYear();
    if (reduce) yrNow.textContent = to;
    else onceVisible(document.getElementById('yearRoll'), () => {
      const start = performance.now(), dur = 1800;
      yrNow.classList.add('rolling');
      ticker.add(now => {
        const t = clamp((now - start) / dur);
        yrNow.textContent = Math.round(from + (to - from) * easeOut(t));
        if (t < 1) return true;
        yrNow.classList.remove('rolling'); yrNow.classList.add('landed');
        return false;
      });
    }, 0.6);
  }

  // Stamp slams onto the photo (animation in effects.css)
  if (art) {
    if (reduce) art.classList.add('stamped');
    else onceVisible(art, () => setTimeout(() => art.classList.add('stamped'), 500), 0.5);
  }


  /* -------------------------------------------------------------------
     3 + 4. SCROLL-LINKED: plate tilt and kebab zoom
     Runs once per frame only after a scroll, and only for whichever of
     the two is near the screen. All reads happen before all writes.
     ------------------------------------------------------------------- */
  if (!reduce && (plateMap || artPhoto)) {
    let plateNear = false, artNear = false, queued = false;
    watchVisible(plateMap, on => { plateNear = on; queue(); }, '200px');
    watchVisible(art, on => { artNear = on; queue(); }, '200px');

    function update() {
      queued = false;
      const vh = innerHeight;
      // Read
      const pr = plateNear && plateMap.getBoundingClientRect();
      const ar = artNear && art.getBoundingClientRect();
      // Write
      if (pr) {
        // 0 when the photo's top is at the bottom of the screen → 1 when it's 35% up
        const p = easeOut(clamp((vh - pr.top) / (vh * 0.65)));
        plateMap.style.transform = `rotateX(${((1 - p) * 32).toFixed(2)}deg) scale(${(0.9 + p * 0.1).toFixed(4)}) translateY(${((1 - p) * 40).toFixed(1)}px)`;
        plateMap.style.opacity = (0.25 + p * 0.75).toFixed(3);
      }
      if (ar) {
        // 0 as the frame enters at the bottom → 1 as it leaves at the top
        const p = clamp((vh - ar.top) / (vh + ar.height));
        artPhoto.style.setProperty('--zoom', (1 + p * 0.18).toFixed(4));
      }
      return false;                            // one-shot job
    }
    function queue() { if (!queued && (plateNear || artNear)) { queued = true; ticker.add(update); } }
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    queue();
  }


  /* -------------------------------------------------------------------
     5. HOW TO EAT
     Cards start face-down (.unflipped shows the number on the back).
     As each card comes into view it joins a queue; every 0.3s the next
     card flips, its icon animates, and the progress line fills.
     Hover or tap a card to replay its icon animation.
     ------------------------------------------------------------------- */
  const steps = [...document.querySelectorAll('[data-step]')];
  const track = document.getElementById('ritualTrack');
  const dots = track ? [...track.querySelectorAll('i')] : [];

  const play = step => {
    step.classList.remove('play');
    void step.offsetWidth;                     // restart the CSS animation
    step.classList.add('play');
  };

  if (steps.length) {
    if (!reduce) steps.forEach(s => s.classList.add('unflipped'));
    let done = 0, busy = false;
    const queue = [];

    function next() {
      if (!queue.length) { busy = false; return; }
      busy = true;
      const step = queue.shift();
      step.classList.remove('unflipped');
      setTimeout(() => play(step), reduce ? 0 : 220);   // icon plays once the card has turned
      done++;
      if (track) track.style.setProperty('--progress', (done - 1) / (steps.length - 1));
      dots.forEach((d, k) => d.classList.toggle('on', k < done));
      setTimeout(next, 300);                   // gap before the next card flips
    }

    const io = new IntersectionObserver(entries => {
      entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => steps.indexOf(a.target) - steps.indexOf(b.target))   // keep 1 → 4 order
        .forEach(e => { queue.push(e.target); io.unobserve(e.target); });
      if (!busy && queue.length) { busy = true; setTimeout(next, 100); }
    }, { threshold: 0.6 });
    steps.forEach(s => io.observe(s));

    steps.forEach(step => {
      const replay = () => { if (!step.classList.contains('unflipped')) play(step); };
      step.addEventListener('mouseenter', replay);
      step.addEventListener('click', replay);
    });
  }
})();
