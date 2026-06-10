// Note name / MIDI / frequency utilities
window.PT = window.PT || {};

PT.Notes = (() => {
  const NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const LETTER_SEMIS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const LETTER_STEPS = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

  // 'C#4' -> 61, 'Bb3' -> 58. Returns null if unparseable.
  function nameToMidi(name) {
    const m = /^([A-Ga-g])(#{1,2}|b{1,2})?(-?\d)$/.exec(String(name).trim());
    if (!m) return null;
    let semis = LETTER_SEMIS[m[1].toUpperCase()];
    if (m[2]) semis += m[2][0] === '#' ? m[2].length : -m[2].length;
    return (parseInt(m[3], 10) + 1) * 12 + semis;
  }

  const midiToName = (m) => NAMES_SHARP[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const freqToMidiFloat = (f) => 69 + 12 * Math.log2(f / 440);
  const pitchClass = (m) => ((m % 12) + 12) % 12;
  const letterOf = (m) => NAMES_SHARP[((m % 12) + 12) % 12];
  const isBlack = (m) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);

  // Diatonic step index used by the staff renderer. 'F#4' -> step of F4.
  function nameToStep(name) {
    const m = /^([A-Ga-g])(#{1,2}|b{1,2})?(-?\d)$/.exec(String(name).trim());
    if (!m) return null;
    return parseInt(m[3], 10) * 7 + LETTER_STEPS[m[1].toUpperCase()];
  }

  function accidentalOf(name) {
    const m = /^[A-Ga-g](#{1,2}|b{1,2})?-?\d$/.exec(String(name).trim());
    return m && m[1] ? m[1] : '';
  }

  return { nameToMidi, midiToName, midiToFreq, freqToMidiFloat, pitchClass, letterOf, isBlack, nameToStep, accidentalOf };
})();
