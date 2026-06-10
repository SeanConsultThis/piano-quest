// Simple piano-ish synth for demos, tap mode, and feedback sounds
window.PT = window.PT || {};

PT.Synth = (() => {
  let ctx = null;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function play(midi, dur = 0.6, when = 0, vol = 0.4) {
    const c = ac();
    const t = c.currentTime + when;
    const f = PT.Notes.midiToFreq(midi);
    const g = c.createGain();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(8000, f * 8);
    g.connect(lp);
    lp.connect(c.destination);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + Math.max(dur, 0.3) + 0.35);
    [[1, 1], [2, 0.35], [3, 0.12], [4, 0.05]].forEach(([h, a]) => {
      const o = c.createOscillator();
      o.type = h === 1 ? 'triangle' : 'sine';
      o.frequency.value = f * h;
      const og = c.createGain();
      og.gain.value = a;
      o.connect(og);
      og.connect(g);
      o.start(t);
      o.stop(t + Math.max(dur, 0.3) + 0.4);
    });
  }

  // UI feedback blips
  function good() { play(88, 0.12, 0, 0.12); play(95, 0.15, 0.07, 0.10); }
  function bad() { play(41, 0.25, 0, 0.18); }
  function coin() { play(93, 0.08, 0, 0.10); play(100, 0.12, 0.06, 0.10); }
  function fanfare() {
    [[72, 0], [76, 0.12], [79, 0.24], [84, 0.38], [84, 0.62], [84, 0.78]].forEach(([m, w]) => play(m, 0.35, w, 0.22));
  }

  // Plays a song's melody. Returns a stop() handle. onStep(i) fires per note.
  function playSong(notes, bpm, onStep) {
    const beat = 60 / (bpm || 100);
    let stopped = false;
    let timers = [];
    let when = 0;
    notes.forEach((nt, i) => {
      const durSec = (nt.d || 1) * beat;
      if (nt.n) {
        const midi = PT.Notes.nameToMidi(nt.n);
        timers.push(setTimeout(() => {
          if (stopped) return;
          play(midi, durSec * 0.95, 0, 0.35);
          if (onStep) onStep(i);
        }, when * 1000));
      }
      when += durSec;
    });
    timers.push(setTimeout(() => { if (!stopped && onStep) onStep(-1); }, when * 1000 + 200));
    return {
      stop() { stopped = true; timers.forEach(clearTimeout); }
    };
  }

  return { play, good, bad, coin, fanfare, playSong, ac };
})();
