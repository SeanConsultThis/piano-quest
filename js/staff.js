// Lightweight SVG treble-staff renderer for single-line melodies.
window.PT = window.PT || {};

PT.Staff = (() => {
  const LINE_GAP = 14;          // px between staff lines
  const HALF = LINE_GAP / 2;    // one diatonic step
  const NOTE_SPACING = 56;      // px between notes
  const TOP = 40;               // y of top staff line (F5)
  const LEFT = 70;              // x where notes start
  const STEP_E4 = PT.Notes.nameToStep('E4'); // bottom line reference

  function yForStep(step) {
    return TOP + 4 * LINE_GAP - (step - STEP_E4) * HALF;
  }

  // Render a song's notes into `container`. Returns a controller with
  // setCurrent(i) to highlight/scroll and markResult(i, ok).
  function render(container, notes, opts = {}) {
    const showLabels = opts.showLabels !== false;
    const n = notes.length;
    const width = Math.max(container.clientWidth || 700, 300);
    const height = TOP + 4 * LINE_GAP + 70;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', '100%');
    svg.classList.add('staff-svg');

    // Staff lines + clef stay fixed; the note group scrolls.
    for (let i = 0; i < 5; i++) {
      const ln = document.createElementNS(svgNS, 'line');
      ln.setAttribute('x1', 8); ln.setAttribute('x2', width - 8);
      ln.setAttribute('y1', TOP + i * LINE_GAP); ln.setAttribute('y2', TOP + i * LINE_GAP);
      ln.setAttribute('class', 'staff-line');
      svg.appendChild(ln);
    }
    const clef = document.createElementNS(svgNS, 'text');
    clef.textContent = '\u{1D11E}';
    clef.setAttribute('x', 14);
    clef.setAttribute('y', TOP + 4 * LINE_GAP - 14);
    clef.setAttribute('class', 'staff-clef');
    clef.setAttribute('font-size', 4.6 * LINE_GAP);
    svg.appendChild(clef);

    const group = document.createElementNS(svgNS, 'g');
    group.classList.add('staff-notes');
    svg.appendChild(group);

    const noteEls = [];
    let xi = 0;
    notes.forEach((nt, i) => {
      const x = LEFT + xi * NOTE_SPACING;
      xi++;
      const g = document.createElementNS(svgNS, 'g');
      g.classList.add('staff-note');

      if (!nt.n) { // rest
        const r = document.createElementNS(svgNS, 'text');
        r.textContent = '\u{1D13D}';
        r.setAttribute('x', x - 6);
        r.setAttribute('y', TOP + 2 * LINE_GAP + 5);
        r.setAttribute('font-size', LINE_GAP * 2.2);
        r.setAttribute('class', 'staff-rest');
        g.appendChild(r);
        group.appendChild(g);
        noteEls.push(g);
        return;
      }

      const step = PT.Notes.nameToStep(nt.n);
      const y = yForStep(step);

      // Ledger lines
      for (let s = STEP_E4 - 2; s >= step; s -= 2) {
        const ly = yForStep(s);
        g.appendChild(ledger(svgNS, x, ly));
      }
      const STEP_F5 = STEP_E4 + 8;
      for (let s = STEP_F5 + 2; s <= step; s += 2) {
        const ly = yForStep(s);
        g.appendChild(ledger(svgNS, x, ly));
      }

      const acc = PT.Notes.accidentalOf(nt.n);
      if (acc) {
        const at = document.createElementNS(svgNS, 'text');
        at.textContent = acc[0] === '#' ? '♯' : '♭';
        at.setAttribute('x', x - 22);
        at.setAttribute('y', y + 5);
        at.setAttribute('class', 'staff-acc');
        at.setAttribute('font-size', LINE_GAP * 1.4);
        g.appendChild(at);
      }

      const head = document.createElementNS(svgNS, 'ellipse');
      head.setAttribute('cx', x); head.setAttribute('cy', y);
      head.setAttribute('rx', 8); head.setAttribute('ry', 6);
      head.setAttribute('transform', `rotate(-18 ${x} ${y})`);
      head.setAttribute('class', 'staff-head');
      g.appendChild(head);

      const stem = document.createElementNS(svgNS, 'line');
      const midLine = STEP_E4 + 4; // B4
      if (step < midLine) { // stem up
        stem.setAttribute('x1', x + 7.4); stem.setAttribute('x2', x + 7.4);
        stem.setAttribute('y1', y - 2); stem.setAttribute('y2', y - 3.4 * LINE_GAP);
      } else {
        stem.setAttribute('x1', x - 7.4); stem.setAttribute('x2', x - 7.4);
        stem.setAttribute('y1', y + 2); stem.setAttribute('y2', y + 3.4 * LINE_GAP);
      }
      stem.setAttribute('class', 'staff-stem');
      g.appendChild(stem);

      if (showLabels) {
        const lab = document.createElementNS(svgNS, 'text');
        lab.textContent = nt.n.replace(/-?\d+$/, '');
        lab.setAttribute('x', x);
        lab.setAttribute('y', TOP + 4 * LINE_GAP + 34);
        lab.setAttribute('class', 'staff-label');
        lab.setAttribute('text-anchor', 'middle');
        g.appendChild(lab);
      }

      if (nt.l) {
        const lyr = document.createElementNS(svgNS, 'text');
        lyr.textContent = nt.l;
        lyr.setAttribute('x', x);
        lyr.setAttribute('y', TOP + 4 * LINE_GAP + 52);
        lyr.setAttribute('class', 'staff-lyric');
        lyr.setAttribute('text-anchor', 'middle');
        g.appendChild(lyr);
      }

      group.appendChild(g);
      noteEls.push(g);
    });

    container.innerHTML = '';
    container.appendChild(svg);

    const anchor = width * 0.32; // current note sits about a third in

    return {
      setCurrent(i) {
        noteEls.forEach((el, j) => el.classList.toggle('current', j === i));
        const shift = Math.max(0, LEFT + i * NOTE_SPACING - anchor);
        group.style.transition = 'transform 0.22s ease';
        group.style.transform = `translateX(${-shift}px)`;
      },
      markResult(i, ok) {
        if (noteEls[i]) noteEls[i].classList.add(ok ? 'done' : 'missed');
      },
      flashWrong(i) {
        if (!noteEls[i]) return;
        noteEls[i].classList.add('wrongflash');
        setTimeout(() => noteEls[i] && noteEls[i].classList.remove('wrongflash'), 350);
      }
    };
  }

  function ledger(svgNS, x, y) {
    const ln = document.createElementNS(svgNS, 'line');
    ln.setAttribute('x1', x - 13); ln.setAttribute('x2', x + 13);
    ln.setAttribute('y1', y); ln.setAttribute('y2', y);
    ln.setAttribute('class', 'staff-line ledger');
    return ln;
  }

  return { render };
})();
