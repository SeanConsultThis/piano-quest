// Song importers: quick text format, MusicXML, and Standard MIDI files.
// All return an array of notes: [{n:'C4'|null, d:beats, l:'lyric'}], or throw.
window.PT = window.PT || {};

PT.Parsers = (() => {

  // ---------- Quick text format ----------
  // Tokens separated by spaces/newlines. Bar lines (|) are ignored.
  //   C4        quarter note C4
  //   C#4:2     C#4 held 2 beats
  //   R:1       rest for 1 beat
  //   C4:1(Twin-)  with a lyric syllable
  function parseText(src) {
    const notes = [];
    const tokens = String(src).replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
    for (const tok of tokens) {
      const m = /^(R|r|[A-Ga-g][#b]{0,2}-?\d)(?::([\d.]+))?(?:\(([^)]*)\))?$/.exec(tok);
      if (!m) throw new Error(`Couldn't read "${tok}". Use notes like C4, F#4:2, or R:1 for a rest.`);
      const d = m[2] ? parseFloat(m[2]) : 1;
      if (/^r$/i.test(m[1])) {
        notes.push({ n: null, d });
      } else {
        const midi = PT.Notes.nameToMidi(m[1]);
        if (midi == null) throw new Error(`"${tok}" isn't a note I know.`);
        // normalize to a canonical (sharp) name so the rest of the app is consistent
        notes.push({ n: m[1][0].toUpperCase() + m[1].slice(1), d, l: m[3] || undefined });
      }
    }
    if (!notes.some(nt => nt.n)) throw new Error('No notes found.');
    return notes;
  }

  // ---------- MusicXML (uncompressed .musicxml / .xml) ----------
  function parseMusicXML(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error("That file doesn't look like valid MusicXML.");
    const part = doc.querySelector('part');
    if (!part) throw new Error('No <part> found in the MusicXML file.');

    let divisions = 1;
    const notes = [];
    let prevTied = false;

    part.querySelectorAll('measure').forEach(measure => {
      const div = measure.querySelector('attributes > divisions');
      if (div) divisions = parseInt(div.textContent, 10) || divisions;

      measure.querySelectorAll(':scope > note').forEach(noteEl => {
        if (noteEl.querySelector('chord')) return;        // melody only: skip chord extras
        if (noteEl.querySelector('grace')) return;
        const durEl = noteEl.querySelector('duration');
        const beats = durEl ? (parseInt(durEl.textContent, 10) / divisions) : 1;

        if (noteEl.querySelector('rest')) {
          notes.push({ n: null, d: beats });
          prevTied = false;
          return;
        }

        const pitch = noteEl.querySelector('pitch');
        if (!pitch) return;
        const stepTxt = pitch.querySelector('step').textContent.trim();
        const octave = pitch.querySelector('octave').textContent.trim();
        const alterEl = pitch.querySelector('alter');
        const alter = alterEl ? parseInt(alterEl.textContent, 10) : 0;
        const acc = alter > 0 ? '#'.repeat(alter) : alter < 0 ? 'b'.repeat(-alter) : '';
        const name = stepTxt + acc + octave;

        const tieStop = !!noteEl.querySelector('tie[type="stop"]');
        const tieStart = !!noteEl.querySelector('tie[type="start"]');

        if (tieStop && prevTied && notes.length && notes[notes.length - 1].n === name) {
          notes[notes.length - 1].d += beats;   // merge tied note
        } else {
          const lyricEl = noteEl.querySelector('lyric > text');
          notes.push({ n: name, d: beats, l: lyricEl ? lyricEl.textContent : undefined });
        }
        prevTied = tieStart;
      });
    });

    if (!notes.some(nt => nt.n)) throw new Error('No melody notes found in the first part.');
    return notes;
  }

  // ---------- Standard MIDI file (.mid / .midi) ----------
  function parseMIDI(arrayBuffer) {
    const d = new DataView(arrayBuffer);
    let pos = 0;
    const u32 = () => { const v = d.getUint32(pos); pos += 4; return v; };
    const u16 = () => { const v = d.getUint16(pos); pos += 2; return v; };
    const u8 = () => d.getUint8(pos++);
    const vlq = () => { let v = 0, b; do { b = u8(); v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };

    if (u32() !== 0x4d546864) throw new Error("That doesn't look like a MIDI file.");
    u32(); // header length
    u16(); // format
    const nTracks = u16();
    const division = u16();
    if (division & 0x8000) throw new Error('SMPTE-timed MIDI files are not supported.');

    const tracks = [];
    for (let t = 0; t < nTracks; t++) {
      if (u32() !== 0x4d54726b) throw new Error('Bad MIDI track header.');
      const len = u32();
      const end = pos + len;
      let tick = 0, runningStatus = 0;
      const events = [];
      while (pos < end) {
        tick += vlq();
        let status = u8();
        if (status < 0x80) { pos--; status = runningStatus; } else { runningStatus = status; }
        const type = status & 0xf0;
        if (type === 0x90 || type === 0x80) {
          const note = u8(), vel = u8();
          events.push({ tick, on: type === 0x90 && vel > 0, note });
        } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) { pos += 2; }
        else if (type === 0xc0 || type === 0xd0) { pos += 1; }
        else if (status === 0xff) { u8(); const l = vlq(); pos += l; }
        else if (status === 0xf0 || status === 0xf7) { const l = vlq(); pos += l; }
        else throw new Error('Unexpected MIDI data.');
      }
      pos = end;
      tracks.push(events);
    }

    // Use the track with the most note-ons as the melody track.
    let best = tracks[0] || [];
    for (const tr of tracks) if (tr.filter(e => e.on).length > best.filter(e => e.on).length) best = tr;
    const ons = best.filter(e => e.on);
    if (!ons.length) throw new Error('No notes found in that MIDI file.');

    // Make it monophonic: group simultaneous note-ons, keep the highest.
    const grouped = [];
    for (const ev of ons) {
      const last = grouped[grouped.length - 1];
      if (last && Math.abs(ev.tick - last.tick) < division / 8) {
        if (ev.note > last.note) last.note = ev.note;
      } else {
        grouped.push({ tick: ev.tick, note: ev.note });
      }
    }

    const notes = [];
    for (let i = 0; i < grouped.length; i++) {
      const cur = grouped[i];
      const next = grouped[i + 1];
      let beats = next ? (next.tick - cur.tick) / division : 1;
      beats = Math.min(Math.max(Math.round(beats * 4) / 4 || 0.25, 0.25), 8);
      notes.push({ n: PT.Notes.midiToName(cur.note), d: beats });
    }
    if (notes.length > 400) throw new Error(`That MIDI file has ${notes.length} notes — a bit long for a lesson. Try a shorter clip (under 400 notes).`);
    return notes;
  }

  return { parseText, parseMusicXML, parseMIDI };
})();
