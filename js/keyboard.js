// On-screen piano keyboard (C3..C6) used for hints, feedback, and tap mode.
window.PT = window.PT || {};

PT.Keyboard = (() => {
  const LOW = 48;   // C3
  const HIGH = 84;  // C6
  const W = 46;     // white key width px

  let keyEls = {};
  let pressHandler = null;

  function render(container, opts = {}) {
    keyEls = {};
    pressHandler = opts.onPress || null;
    const showLabels = opts.showLabels !== false;

    container.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'kb-board';

    let whiteIdx = 0;
    for (let m = LOW; m <= HIGH; m++) {
      const black = PT.Notes.isBlack(m);
      const key = document.createElement('div');
      key.dataset.midi = m;
      if (black) {
        key.className = 'kb-key black';
        key.style.left = (whiteIdx * W - W * 0.30) + 'px';
      } else {
        key.className = 'kb-key white';
        key.style.left = (whiteIdx * W) + 'px';
        if (showLabels) {
          const lab = document.createElement('span');
          lab.className = 'kb-label';
          lab.textContent = PT.Notes.letterOf(m) + (m === 60 ? '4' : '');
          key.appendChild(lab);
        }
        if (m === 60) {
          const dot = document.createElement('span');
          dot.className = 'kb-middlec';
          key.appendChild(dot);
        }
        whiteIdx++;
      }
      key.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (pressHandler) pressHandler(m);
      });
      keyEls[m] = key;
      board.appendChild(key);
    }
    board.style.width = (whiteIdx * W) + 'px';
    container.appendChild(board);

    // center on middle C
    requestAnimationFrame(() => {
      const c4 = keyEls[60];
      if (c4) container.scrollLeft = c4.offsetLeft - container.clientWidth / 2 + W / 2;
    });
  }

  function setHint(midi) {
    Object.values(keyEls).forEach(el => el.classList.remove('hint'));
    if (midi != null && keyEls[midi]) keyEls[midi].classList.add('hint');
  }

  function flash(midi, cls, ms = 380) {
    const el = keyEls[midi];
    if (!el) return;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }

  function scrollTo(container, midi) {
    const el = keyEls[midi];
    if (el) container.scrollLeft = el.offsetLeft - container.clientWidth / 2;
  }

  return { render, setHint, flash, scrollTo, LOW, HIGH };
})();
