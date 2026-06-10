// The play engine: runs songs and lessons, listens to the mic (or taps),
// scores, and pays out coins and stars.
window.PT = window.PT || {};

PT.Game = (() => {
  let session = null; // current run
  let demoHandle = null;

  const $ = (id) => document.getElementById(id);

  // ---------- starting a run ----------

  function startSong(song) {
    start({
      mode: 'song',
      title: song.title,
      song,
      notes: song.notes.filter(nt => nt.n), // self-paced: skip rests while playing
      allNotes: song.notes,
      staff: true,
      staffLabels: PT.State.data.settings.staffLabels,
    });
  }

  function startLesson(lesson) {
    start({
      mode: 'lesson',
      title: lesson.title,
      lesson,
      notes: lesson.items,
      allNotes: lesson.items,
      staff: !!lesson.opts.staff,
      staffLabels: lesson.opts.staffLabels !== false,
      bigLetter: !!lesson.opts.bigLetter,
      intro: lesson.intro,
    });
  }

  function start(cfg) {
    stopDemo();
    session = {
      ...cfg,
      index: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0,
      score: 0,
      shieldArmed: false,
      doublerArmed: false,
      done: false,
    };

    PT.App.show('play');
    $('play-title').textContent = cfg.title;
    $('play-score').textContent = '0';
    $('play-streak').textContent = '0';
    $('play-heard').textContent = '–';
    $('play-intro').textContent = cfg.intro || '';
    $('play-intro').style.display = cfg.intro ? '' : 'none';
    $('results-modal').classList.remove('open');

    // big-letter mode for early lessons
    $('big-letter').style.display = cfg.bigLetter ? '' : 'none';
    $('staff-holder').style.display = cfg.staff ? '' : 'none';
    if (cfg.staff) {
      session.staffCtl = PT.Staff.render($('staff-holder'), cfg.notes, { showLabels: cfg.staffLabels });
    }

    PT.Keyboard.render($('kb-holder'), {
      showLabels: PT.State.data.settings.keyLabels,
      onPress: (midi) => {
        if (PT.State.data.settings.tapMode) {
          PT.Synth.play(midi, 0.4);
          handleNote(midi);
        }
      },
    });

    renderPowerupButtons();
    updateTarget();
    setMicUI();

    PT.Pitch.setOnNote(handleNote);
    PT.Pitch.setOnFrame(({ noteName, rms }) => {
      const el = $('play-heard');
      if (noteName && rms > 0.02) { el.textContent = noteName; el.classList.add('hearing'); }
      else { el.classList.remove('hearing'); }
    });
    if (!PT.State.data.settings.tapMode) enableMic();
  }

  async function enableMic() {
    const ok = await PT.Pitch.start();
    setMicUI();
    if (!ok) {
      PT.App.toast('🎤 Microphone blocked — using Tap Mode instead. You can fix mic permission in your browser bar.', 5000);
      PT.State.data.settings.tapMode = true;
      PT.State.save();
      setMicUI();
    }
  }

  function setMicUI() {
    const tap = PT.State.data.settings.tapMode;
    $('mic-status').textContent = tap ? '👆 Tap Mode' : (PT.Pitch.isRunning() ? '🎤 Listening…' : '🎤 Mic off');
    $('mic-status').classList.toggle('live', !tap && PT.Pitch.isRunning());
    $('btn-tapmode').textContent = tap ? 'Switch to Mic' : 'Switch to Tap';
  }

  function toggleTapMode() {
    PT.State.data.settings.tapMode = !PT.State.data.settings.tapMode;
    PT.State.save();
    if (!PT.State.data.settings.tapMode) enableMic();
    setMicUI();
  }

  // ---------- gameplay ----------

  function target() {
    return session && !session.done ? session.notes[session.index] : null;
  }

  function updateTarget() {
    const t = target();
    if (!t) return;
    const midi = PT.Notes.nameToMidi(t.n);

    if (session.bigLetter) {
      $('big-letter').textContent = t.n.replace(/-?\d+$/, '');
    }
    if (session.staffCtl) session.staffCtl.setCurrent(session.index);

    const hints = PT.State.data.settings.hints || session.mode === 'lesson';
    PT.Keyboard.setHint(hints ? midi : null);
    PT.Keyboard.scrollTo($('kb-holder'), midi);

    $('play-progress').style.width = (100 * session.index / session.notes.length) + '%';
    $('play-count').textContent = `${session.index + 1} / ${session.notes.length}`;
  }

  function matches(heardMidi, targetMidi) {
    const strict = PT.State.data.settings.strictOctave && !PT.State.data.perks.octaveWizard;
    if (strict) return heardMidi === targetMidi;
    return PT.Notes.pitchClass(heardMidi) === PT.Notes.pitchClass(targetMidi);
  }

  function handleNote(heardMidi) {
    const t = target();
    if (!t) return;
    const targetMidi = PT.Notes.nameToMidi(t.n);

    if (matches(heardMidi, targetMidi)) {
      session.correct++;
      session.streak++;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
      const mult = 1 + Math.min(3, Math.floor(session.streak / 5));
      session.score += 10 * mult;
      if (session.staffCtl) session.staffCtl.markResult(session.index, true);
      PT.Keyboard.flash(targetMidi, 'good');
      if (PT.State.data.settings.tapMode) {} else PT.Synth.good();
      popCoin();
      session.index++;
      $('play-score').textContent = session.score;
      $('play-streak').textContent = session.streak;
      if (session.index >= session.notes.length) finish();
      else updateTarget();
    } else {
      // ignore near-misses from mic noise only if extremely brief — Pitch
      // already debounces, so a confirmed wrong note counts.
      session.wrong++;
      if (session.shieldArmed) {
        session.shieldArmed = false;
        PT.App.toast('🛡️ Streak Shield saved you!');
        renderPowerupButtons();
      } else {
        session.streak = 0;
        $('play-streak').textContent = '0';
      }
      if (session.staffCtl) session.staffCtl.flashWrong(session.index);
      PT.Keyboard.flash(heardMidi, 'bad');
      if (!PT.State.data.settings.tapMode) PT.Synth.bad();
    }
  }

  function popCoin() {
    const el = document.createElement('div');
    el.className = 'coin-pop';
    el.textContent = '+';
    $('screen-play').appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  // ---------- finishing ----------

  function finish() {
    session.done = true;
    PT.Keyboard.setHint(null);
    const total = session.correct + session.wrong;
    const accuracy = total ? session.correct / total : 1;
    const stars = accuracy >= 0.95 ? 3 : accuracy >= 0.8 ? 2 : 1;

    let coins = Math.round(session.score / 10) + stars * 10;
    const st = PT.State.data;
    let bonusNote = '';

    if (session.mode === 'lesson') {
      const first = !st.lessonsDone[session.lesson.id];
      if (first) { coins += session.lesson.coins; bonusNote = `+${session.lesson.coins} first-time lesson bonus!`; }
      st.lessonsDone[session.lesson.id] = true;
    } else {
      const prev = st.songBest[session.song.id];
      if (!prev) { coins += 25; bonusNote = '+25 first-time song bonus!'; }
      if (!prev || stars > prev.stars) {
        st.totalStars += stars - (prev ? prev.stars : 0);
      }
      st.songBest[session.song.id] = {
        stars: Math.max(stars, prev ? prev.stars : 0),
        score: Math.max(session.score, prev ? prev.score : 0),
        accuracy: Math.max(accuracy, prev ? prev.accuracy : 0),
      };
    }

    if (session.doublerArmed) { coins *= 2; bonusNote += ' ✨ Coin Doubler: x2!'; }

    PT.State.addCoins(coins);
    PT.State.save();
    PT.Synth.fanfare();
    confetti();

    $('res-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('res-accuracy').textContent = Math.round(accuracy * 100) + '%';
    $('res-score').textContent = session.score;
    $('res-streak').textContent = session.bestStreak;
    $('res-coins').textContent = '+' + coins + ' 🪙';
    $('res-bonus').textContent = bonusNote;
    $('results-modal').classList.add('open');
  }

  function confetti() {
    const host = $('screen-play');
    const emojis = ['🎉', '⭐', '🎵', '✨', '🎶'];
    for (let i = 0; i < 24; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = emojis[i % emojis.length];
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 0.6) + 's';
      s.style.fontSize = (16 + Math.random() * 18) + 'px';
      host.appendChild(s);
      setTimeout(() => s.remove(), 2600);
    }
  }

  function replay() {
    if (!session) return;
    if (session.mode === 'lesson') startLesson(session.lesson);
    else startSong(session.song);
  }

  function exit() {
    stopDemo();
    PT.Pitch.setOnNote(null);
    PT.Keyboard.setHint(null);
    $('results-modal').classList.remove('open');
    PT.App.show(session && session.mode === 'lesson' ? 'learn' : 'songs');
    session = null;
  }

  // ---------- demo playback ----------

  function demo() {
    if (!session) return;
    stopDemo();
    const btn = $('btn-demo');
    btn.textContent = '⏹ Stop';
    demoHandle = PT.Synth.playSong(session.allNotes, session.song ? session.song.bpm : 90, (i) => {
      if (i === -1) { stopDemo(); return; }
      // map allNotes index to playable-notes index for staff highlight
      if (session.staffCtl) {
        const playableIdx = session.notes.indexOf(session.allNotes[i]);
        if (playableIdx >= 0) session.staffCtl.setCurrent(playableIdx);
      }
      const m = session.allNotes[i].n && PT.Notes.nameToMidi(session.allNotes[i].n);
      if (m) PT.Keyboard.flash(m, 'good', 250);
    });
  }

  function stopDemo() {
    if (demoHandle) { demoHandle.stop(); demoHandle = null; }
    const btn = $('btn-demo');
    if (btn) btn.textContent = '▶ Listen';
    if (session && !session.done) updateTarget();
  }

  // ---------- powerups in play ----------

  function renderPowerupButtons() {
    const st = PT.State.data;
    const host = $('play-powerups');
    host.innerHTML = '';
    if (!session || session.mode !== 'song') return;
    const defs = [
      { id: 'shield', emoji: '🛡️', armed: session.shieldArmed },
      { id: 'doubler', emoji: '✨', armed: session.doublerArmed },
    ];
    defs.forEach(d => {
      const count = st.consumables[d.id] || 0;
      if (!count && !d.armed) return;
      const b = document.createElement('button');
      b.className = 'powerup-btn' + (d.armed ? ' armed' : '');
      b.textContent = d.armed ? `${d.emoji} armed!` : `${d.emoji} ×${count}`;
      b.onclick = () => armPowerup(d.id);
      host.appendChild(b);
    });
  }

  function armPowerup(id) {
    const st = PT.State.data;
    const key = id === 'shield' ? 'shieldArmed' : 'doublerArmed';
    if (session[key]) return;
    if ((st.consumables[id] || 0) < 1) return;
    st.consumables[id]--;
    session[key] = true;
    PT.State.save();
    renderPowerupButtons();
    PT.App.toast(id === 'shield' ? '🛡️ Shield armed for this song!' : '✨ Coin Doubler armed for this song!');
  }

  return { startSong, startLesson, replay, exit, demo, stopDemo, toggleTapMode, setMicUI };
})();
