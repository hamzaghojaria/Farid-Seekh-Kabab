/* =====================================================================
   Farid Seekh Kabab Center — sizzle sound
   ---------------------------------------------------------------------
   A tawa sizzle made in the browser (no audio file to download):
     - hiss:     looping noise, filtered to the high frequencies, with a
                 slow volume wobble so it doesn't sound like static
     - crackles: tiny random bursts of noise
   Off by default. The bottom-left button turns it on/off with a fade.
   Nothing is created until the first tap (browsers require a tap first).
   ===================================================================== */

(() => {
  const btn = document.getElementById('soundToggle');
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!btn || !AC) { if (btn) btn.hidden = true; return; }

  let ac = null, master = null, on = false;

  function build() {
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);

    // 2 seconds of random noise, reused by the hiss and the crackles
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    // Hiss
    const hiss = ac.createBufferSource();
    hiss.buffer = buf; hiss.loop = true;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
    const hissGain = ac.createGain(); hissGain.gain.value = 0.05;
    hiss.connect(hp).connect(lp).connect(hissGain).connect(master);
    hiss.start();

    // Slow wobble on the hiss volume
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.35;
    const lfoGain = ac.createGain(); lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(hissGain.gain);
    lfo.start();

    // Crackles at random moments (only while the sound is on)
    (function crackle() {
      if (on) {
        const t = ac.currentTime;
        const src = ac.createBufferSource(); src.buffer = buf;
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass';
        bp.frequency.value = 2500 + Math.random() * 4000; bp.Q.value = 1.5;
        const g = ac.createGain();
        const peak = 0.05 + Math.random() * 0.22, len = 0.008 + Math.random() * 0.03;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(peak, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        src.connect(bp).connect(g).connect(master);
        src.start(t, Math.random() * 1.5, len + 0.01);
      }
      setTimeout(crackle, on ? 25 + Math.random() * 140 : 400);
    })();
  }

  btn.addEventListener('click', () => {
    if (!ac) build();
    on = !on;
    if (on) ac.resume();
    const t = ac.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(on ? 0.9 : 0, t + 0.4);   // fade in / out
    if (!on) setTimeout(() => { if (!on) ac.suspend(); }, 450);  // stop audio work when off
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Stop tawa sizzle sound' : 'Play tawa sizzle sound');
    btn.classList.toggle('on', on);
  });
})();
