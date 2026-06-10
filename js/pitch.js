// Microphone pitch detection (autocorrelation) with note-onset logic so
// repeated presses of the same key are each detected.
window.PT = window.PT || {};

PT.Pitch = (() => {
  const BUF_SIZE = 2048;
  const RMS_GATE = 0.012;        // ignore frames quieter than this
  const CONFIRM_FRAMES = 3;      // consecutive matching frames to confirm a note
  const ONSET_RATIO = 1.7;       // rms jump that counts as a new key press

  let audioCtx = null;
  let analyser = null;
  let stream = null;
  let rafId = null;
  let running = false;

  const buf = new Float32Array(BUF_SIZE);

  // listeners
  let onNote = null;   // confirmed note presses: (midi)
  let onFrame = null;  // live tuner data: ({freq, midi, cents, rms, noteName})

  // detection state
  let candidate = null;
  let candidateCount = 0;
  let lastConfirmed = null;
  let armed = true;          // can the current pitch trigger a note?
  let rmsFloor = 0;          // slow-follower of recent rms (for onset detection)
  let silentFrames = 0;

  // Classic normalized autocorrelation pitch detector (after Chris Wilson's
  // pitch-detect demo). Returns frequency in Hz or -1.
  function autoCorrelate(b, sampleRate) {
    const SIZE = b.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += b[i] * b[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < RMS_GATE) return { freq: -1, rms };

    // Trim quiet edges to sharpen correlation
    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(b[i]) < thres) { r1 = i; } else break;
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(b[SIZE - i]) < thres) { r2 = SIZE - i; } else break;
    const sl = b.slice(r1, r2);
    const N = sl.length;
    if (N < 64) return { freq: -1, rms };

    const c = new Float32Array(N);
    for (let lag = 0; lag < N; lag++) {
      let sum = 0;
      for (let i = 0; i < N - lag; i++) sum += sl[i] * sl[i + lag];
      c[lag] = sum;
    }

    let d = 0;
    while (d + 1 < N && c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < N; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    if (maxpos <= 0) return { freq: -1, rms };
    let T0 = maxpos;

    // Parabolic interpolation around the peak
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1] || 0;
    const a = (x1 + x3 - 2 * x2) / 2;
    const bb = (x3 - x1) / 2;
    if (a) T0 = T0 - bb / (2 * a);

    const freq = sampleRate / T0;
    if (freq < 60 || freq > 2200) return { freq: -1, rms }; // outside piano-lesson range
    return { freq, rms };
  }

  function tick() {
    if (!running) return;
    analyser.getFloatTimeDomainData(buf);
    const { freq, rms } = autoCorrelate(buf, audioCtx.sampleRate);

    // Onset detection: a sharp rise in level re-arms detection so the same
    // key pressed twice in a row registers twice.
    if (rms > rmsFloor * ONSET_RATIO && rms > RMS_GATE) armed = true;
    rmsFloor = Math.max(rms, rmsFloor * 0.93);

    if (freq < 0) {
      silentFrames++;
      if (silentFrames > 6) { candidate = null; candidateCount = 0; armed = true; lastConfirmed = null; }
      if (onFrame) onFrame({ freq: 0, midi: null, cents: 0, rms, noteName: null });
    } else {
      silentFrames = 0;
      const mf = PT.Notes.freqToMidiFloat(freq);
      const midi = Math.round(mf);
      const cents = Math.round((mf - midi) * 100);

      if (Math.abs(mf - midi) < 0.4) {
        if (midi === candidate) candidateCount++;
        else { candidate = midi; candidateCount = 1; }

        if (candidateCount >= CONFIRM_FRAMES) {
          const isNew = midi !== lastConfirmed;
          if ((isNew || armed) && onNote) {
            lastConfirmed = midi;
            armed = false;
            onNote(midi);
          }
        }
      }
      if (onFrame) onFrame({ freq, midi, cents, rms, noteName: PT.Notes.midiToName(midi) });
    }
    rafId = requestAnimationFrame(tick);
  }

  async function start() {
    if (running) return true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
    } catch (e) {
      return false;
    }
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    const src = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = BUF_SIZE;
    src.connect(analyser);
    running = true;
    candidate = null; candidateCount = 0; lastConfirmed = null; armed = true; rmsFloor = 0;
    tick();
    return true;
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    analyser = null;
  }

  return {
    start, stop,
    isRunning: () => running,
    setOnNote: (fn) => { onNote = fn; },
    setOnFrame: (fn) => { onFrame = fn; },
  };
})();
