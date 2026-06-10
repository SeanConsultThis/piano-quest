// App shell: navigation, screen rendering, song uploads, settings.
window.PT = window.PT || {};

PT.App = (() => {
  const $ = (id) => document.getElementById(id);

  // ---------- navigation ----------

  function show(name) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    $('screen-' + name).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
    if (name !== 'play') { PT.Game.stopDemo(); }
    if (name === 'home') renderHome();
    if (name === 'learn') renderLearn();
    if (name === 'songs') renderSongs();
    if (name === 'store') renderStore();
    if (name === 'settings') renderSettings();
  }

  function refreshHud() {
    $('hud-coins').textContent = PT.State.data.coins;
    $('hud-stars').textContent = PT.State.data.totalStars;
  }

  let toastTimer = null;
  function toast(msg, ms = 2600) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('open'), ms);
  }

  // ---------- home ----------

  function renderHome() {
    const st = PT.State.data;
    $('home-name').textContent = st.playerName ? `Welcome back, ${st.playerName}! 🎵` : 'Welcome to Piano Quest! 🎵';
    const lessonsDone = Object.keys(st.lessonsDone).length;
    const songsPlayed = Object.keys(st.songBest).length;
    $('home-stats').innerHTML = `
      <div class="stat-card">🪙<b>${st.coins}</b><span>coins</span></div>
      <div class="stat-card">⭐<b>${st.totalStars}</b><span>stars</span></div>
      <div class="stat-card">📚<b>${lessonsDone}/${PT.Lessons.LESSONS.length}</b><span>lessons</span></div>
      <div class="stat-card">🎵<b>${songsPlayed}</b><span>songs played</span></div>`;

    // suggest next step
    const nextLesson = PT.Lessons.LESSONS.find(l => !st.lessonsDone[l.id]);
    const btn = $('home-next');
    if (nextLesson) {
      btn.textContent = `▶ Continue: ${nextLesson.icon} ${nextLesson.title}`;
      btn.onclick = () => PT.Game.startLesson(nextLesson);
    } else {
      btn.textContent = '▶ Play a song!';
      btn.onclick = () => show('songs');
    }
  }

  // ---------- learn ----------

  function renderLearn() {
    const st = PT.State.data;
    const host = $('lesson-list');
    host.innerHTML = '';
    let prevDone = true;
    PT.Lessons.LESSONS.forEach(l => {
      const done = !!st.lessonsDone[l.id];
      const locked = !done && !prevDone;
      const card = document.createElement('div');
      card.className = 'card lesson-card' + (locked ? ' locked' : '') + (done ? ' done' : '');
      card.innerHTML = `
        <div class="card-icon">${locked ? '🔒' : l.icon}</div>
        <div class="card-body">
          <h3>${l.title} ${done ? '✅' : ''}</h3>
          <p>${l.desc}</p>
        </div>
        <button class="btn primary">${done ? 'Replay' : locked ? 'Locked' : `Start +${l.coins}🪙`}</button>`;
      const btn = card.querySelector('button');
      btn.disabled = locked;
      btn.onclick = () => PT.Game.startLesson(l);
      host.appendChild(card);
      prevDone = done;
    });
  }

  // ---------- songs ----------

  function renderSongs() {
    const st = PT.State.data;
    const host = $('song-list');
    host.innerHTML = '';
    PT.Songs.CATEGORIES.forEach(cat => {
      const songs = PT.Songs.listFor(cat.id);
      if (cat.id === 'mine' && !songs.length) {
        const sec = document.createElement('div');
        sec.innerHTML = `<h2 class="cat-title">${cat.icon} ${cat.name}</h2>
          <p class="muted">No songs here yet — tap <b>＋ Add Song</b> to upload sheet music (MusicXML), a MIDI file, or type a melody in.</p>`;
        host.appendChild(sec);
        return;
      }
      if (!songs.length) return;
      const h = document.createElement('h2');
      h.className = 'cat-title';
      h.textContent = `${cat.icon} ${cat.name}`;
      host.appendChild(h);

      songs.forEach(s => {
        const unlocked = cat.id === 'mine' || st.unlockedSongs.includes(s.id) || !s.cost;
        const best = st.songBest[s.id];
        const stars = best ? '⭐'.repeat(best.stars) + '☆'.repeat(3 - best.stars) : '☆☆☆';
        const diff = '🎵'.repeat(s.difficulty || 1);
        const card = document.createElement('div');
        card.className = 'card song-card' + (unlocked ? '' : ' locked');
        card.innerHTML = `
          <div class="card-body">
            <h3>${unlocked ? '' : '🔒 '}${esc(s.title)}</h3>
            <p>${stars} &nbsp; ${diff} &nbsp; ${s.notes.length} notes</p>
          </div>
          ${cat.id === 'mine' ? '<button class="btn subtle btn-del">🗑</button>' : ''}
          <button class="btn primary">${unlocked ? '▶ Play' : `Unlock ${s.cost}🪙`}</button>`;
        const playBtn = card.querySelector('.btn.primary');
        playBtn.onclick = () => {
          if (unlocked) { PT.Game.startSong(s); return; }
          if (PT.Store.unlockSong(s.id)) { PT.Synth.coin(); toast(`🔓 Unlocked ${s.title}!`); renderSongs(); }
          else toast(`Not enough coins — you need ${s.cost}🪙. Play lessons and songs to earn more!`);
        };
        const del = card.querySelector('.btn-del');
        if (del) del.onclick = () => {
          if (!confirm(`Delete "${s.title}" from My Songs?`)) return;
          st.mySongs = st.mySongs.filter(x => x.id !== s.id);
          PT.State.save();
          renderSongs();
        };
        host.appendChild(card);
      });
    });
  }

  // ---------- store ----------

  function renderStore() {
    const st = PT.State.data;

    const skinHost = $('store-skins');
    skinHost.innerHTML = '';
    PT.Store.SKINS.forEach(sk => {
      const owned = st.ownedSkins.includes(sk.id);
      const active = st.activeSkin === sk.id;
      const card = document.createElement('div');
      card.className = 'card store-card skin-preview-' + sk.id;
      card.innerHTML = `
        <div class="skin-swatch skin-${sk.id}"><span class="sw k1"></span><span class="sw k2"></span><span class="sw k3"></span></div>
        <div class="card-body">
          <h3>${sk.emoji} ${sk.name}</h3>
          <p>${sk.desc}</p>
        </div>
        <button class="btn ${active ? 'subtle' : 'primary'}">${active ? '✔ Equipped' : owned ? 'Equip' : sk.cost + '🪙'}</button>`;
      const btn = card.querySelector('button');
      btn.disabled = active;
      btn.onclick = () => {
        if (owned) { PT.Store.equipSkin(sk.id); toast(`${sk.emoji} ${sk.name} equipped!`); renderStore(); }
        else if (PT.Store.buySkin(sk.id)) { PT.Synth.coin(); PT.Store.applySkin(); toast(`${sk.emoji} You bought ${sk.name}!`); renderStore(); }
        else toast(`Not enough coins — ${sk.name} costs ${sk.cost}🪙.`);
      };
      skinHost.appendChild(card);
    });

    const pHost = $('store-powerups');
    pHost.innerHTML = '';
    PT.Store.POWERUPS.forEach(p => {
      const ownedPerk = p.type === 'perk' && st.perks[p.id];
      const count = p.type === 'consumable' ? (st.consumables[p.id] || 0) : 0;
      const card = document.createElement('div');
      card.className = 'card store-card';
      card.innerHTML = `
        <div class="card-icon">${p.emoji}</div>
        <div class="card-body">
          <h3>${p.name} ${count ? `<span class="badge">×${count}</span>` : ''}</h3>
          <p>${p.desc}</p>
        </div>
        <button class="btn primary">${ownedPerk ? '✔ Owned' : p.cost + '🪙'}</button>`;
      const btn = card.querySelector('button');
      btn.disabled = ownedPerk;
      btn.onclick = () => {
        if (PT.Store.buyPowerup(p.id)) { PT.Synth.coin(); toast(`${p.emoji} ${p.name} purchased!`); renderStore(); }
        else toast(`Not enough coins — ${p.name} costs ${p.cost}🪙.`);
      };
      pHost.appendChild(card);
    });
  }

  // ---------- add song (uploads) ----------

  function setupAddSong() {
    const tabs = document.querySelectorAll('.add-tab');
    tabs.forEach(t => t.onclick = () => {
      tabs.forEach(x => x.classList.toggle('active', x === t));
      document.querySelectorAll('.add-panel').forEach(p => p.classList.remove('active'));
      $('add-panel-' + t.dataset.tab).classList.add('active');
    });

    $('file-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const title = file.name.replace(/\.(musicxml|xml|mid|midi)$/i, '');
      try {
        let notes;
        if (/\.(mid|midi)$/i.test(file.name)) {
          notes = PT.Parsers.parseMIDI(await file.arrayBuffer());
        } else if (/\.(musicxml|xml)$/i.test(file.name)) {
          notes = PT.Parsers.parseMusicXML(await file.text());
        } else if (/\.mxl$/i.test(file.name)) {
          throw new Error('That is a COMPRESSED MusicXML file (.mxl). In MuseScore, use File → Export → MusicXML and pick "Uncompressed (*.musicxml)".');
        } else {
          throw new Error('Please choose a .musicxml, .xml, .mid, or .midi file.');
        }
        previewImport(title, notes);
      } catch (err) {
        $('add-error').textContent = '⚠️ ' + err.message;
        $('add-preview').style.display = 'none';
      }
      e.target.value = '';
    });

    $('btn-parse-text').onclick = () => {
      try {
        const notes = PT.Parsers.parseText($('text-input').value);
        previewImport($('text-title').value || 'My Melody', notes);
      } catch (err) {
        $('add-error').textContent = '⚠️ ' + err.message;
        $('add-preview').style.display = 'none';
      }
    };
  }

  let pendingImport = null;

  function previewImport(title, notes) {
    $('add-error').textContent = '';
    pendingImport = { title, notes };
    $('add-preview').style.display = '';
    $('preview-title').value = title;
    $('preview-info').textContent = `${notes.filter(n => n.n).length} notes`;
    PT.Staff.render($('preview-staff'), notes.filter(n => n.n).slice(0, 60), { showLabels: true });
  }

  function saveImport() {
    if (!pendingImport) return;
    const st = PT.State.data;
    const song = {
      id: 'my_' + Date.now(),
      title: $('preview-title').value.trim() || pendingImport.title || 'My Song',
      category: 'mine',
      cost: 0,
      bpm: 100,
      difficulty: 2,
      notes: pendingImport.notes,
    };
    st.mySongs.push(song);
    PT.State.save();
    pendingImport = null;
    $('add-preview').style.display = 'none';
    $('text-input').value = '';
    toast(`🎵 "${song.title}" added to My Songs!`);
    show('songs');
  }

  function previewListen() {
    if (!pendingImport) return;
    PT.Synth.playSong(pendingImport.notes.slice(0, 40), 100);
  }

  // ---------- settings ----------

  let tunerActive = false;

  function renderSettings() {
    const st = PT.State.data;
    renderSyncUI();
    $('set-name').value = st.playerName;
    $('set-strict').checked = st.settings.strictOctave;
    $('set-hints').checked = st.settings.hints;
    $('set-keylabels').checked = st.settings.keyLabels;
    $('set-stafflabels').checked = st.settings.staffLabels;
  }

  // ---------- cloud sync ----------

  function renderSyncUI() {
    const sy = PT.State.data.syncProfile;
    const configured = PT.Sync.configured();
    $('sync-form').style.display = sy ? 'none' : '';
    $('sync-connected').style.display = sy ? '' : 'none';
    if (sy) $('sync-who').textContent = `${sy.name} @ ${sy.code}`;
    if (!configured) {
      $('sync-explain').textContent = 'Cloud sync is not set up yet. A grown-up needs to follow SETUP-FIREBASE.md once, then this section comes alive.';
      $('btn-sync-connect').disabled = true;
    } else {
      $('btn-sync-connect').disabled = false;
    }
  }

  function setupSync() {
    $('btn-sync-connect').onclick = async () => {
      $('btn-sync-connect').disabled = true;
      const res = await PT.Sync.connect($('sync-code').value, $('sync-name').value);
      $('btn-sync-connect').disabled = false;
      toast((res.ok ? '☁️ ' : '⚠️ ') + res.msg, 4500);
      renderSyncUI();
      refreshHud();
    };
    $('btn-sync-disconnect').onclick = () => {
      if (!confirm('Disconnect cloud sync on this device? Progress stays on the device and in the cloud — they just stop syncing.')) return;
      PT.Sync.disconnect();
      renderSyncUI();
    };
    PT.Sync.onStatus((s, detail) => {
      const labels = {
        off: '', disabled: '',
        connecting: '☁️ Syncing…',
        synced: '☁️ Synced — progress is safe in the cloud.',
        error: '⚠️ Sync problem: ' + detail,
      };
      const el = $('sync-status');
      if (el) el.textContent = labels[s] || '';
      const hud = $('hud-sync');
      hud.style.display = (s === 'synced' || s === 'connecting' || s === 'error') ? '' : 'none';
      hud.textContent = s === 'error' ? '⚠️' : '☁️';
      hud.title = labels[s] || 'Cloud sync';
    });
  }

  function setupSettings() {
    const st = PT.State.data;
    $('set-name').addEventListener('change', e => { st.playerName = e.target.value.trim(); PT.State.save(); });
    $('set-strict').addEventListener('change', e => { st.settings.strictOctave = e.target.checked; PT.State.save(); });
    $('set-hints').addEventListener('change', e => { st.settings.hints = e.target.checked; PT.State.save(); });
    $('set-keylabels').addEventListener('change', e => { st.settings.keyLabels = e.target.checked; PT.State.save(); });
    $('set-stafflabels').addEventListener('change', e => { st.settings.staffLabels = e.target.checked; PT.State.save(); });

    $('btn-mictest').onclick = async () => {
      if (tunerActive) {
        tunerActive = false;
        PT.Pitch.stop();
        $('btn-mictest').textContent = '🎤 Start Mic Test';
        $('tuner-note').textContent = '–';
        return;
      }
      const ok = await PT.Pitch.start();
      if (!ok) { toast('🎤 Microphone permission denied. Click the mic icon in your browser address bar to allow it.', 5000); return; }
      tunerActive = true;
      $('btn-mictest').textContent = '⏹ Stop Mic Test';
      PT.Pitch.setOnNote(null);
      PT.Pitch.setOnFrame(({ noteName, cents, rms }) => {
        if (!tunerActive) return;
        if (noteName && rms > 0.02) {
          $('tuner-note').textContent = noteName;
          $('tuner-cents').textContent = (cents > 0 ? '+' : '') + cents + ' cents';
        } else {
          $('tuner-cents').textContent = 'play a note…';
        }
        $('tuner-level').style.width = Math.min(100, rms * 600) + '%';
      });
    };

    $('btn-reset').onclick = () => {
      if (!confirm('Really erase ALL progress, coins, and purchases? This cannot be undone.')) return;
      if (!confirm('Are you double sure? Everything will be reset.')) return;
      PT.State.reset();
      PT.Store.applySkin();
      show('home');
      toast('Progress reset. Fresh start! 🌱');
    };
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // ---------- init ----------

  function init() {
    PT.Store.applySkin();
    refreshHud();

    document.querySelectorAll('.nav-btn').forEach(b => {
      b.addEventListener('click', () => show(b.dataset.nav));
    });

    $('btn-demo').onclick = () => PT.Game.demo();
    $('btn-tapmode').onclick = () => PT.Game.toggleTapMode();
    $('btn-exit-play').onclick = () => PT.Game.exit();
    $('btn-replay').onclick = () => PT.Game.replay();
    $('btn-res-exit').onclick = () => PT.Game.exit();
    $('btn-save-import').onclick = saveImport;
    $('btn-preview-listen').onclick = previewListen;

    setupAddSong();
    setupSettings();
    setupSync();
    PT.Sync.init();

    if (location.protocol === 'file:') {
      $('file-warning').style.display = '';
    }

    show('home');
  }

  return { init, show, refreshHud, toast };
})();

window.addEventListener('DOMContentLoaded', PT.App.init);
