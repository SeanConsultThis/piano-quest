// Cloud progress sync via Firebase Firestore.
//
// Design: localStorage stays the source of truth while playing. Every save
// bumps data.updatedAt and schedules a debounced push to Firestore. On
// connect, whichever side has the newer updatedAt wins. The app is fully
// playable with sync unconfigured, offline, or failing — sync is additive.
window.PT = window.PT || {};

PT.Sync = (() => {
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const PUSH_DELAY = 3000;

  let db = null;
  let status = 'off'; // off | disabled | connecting | synced | error
  let statusDetail = '';
  let pushTimer = null;
  let listeners = [];

  const configured = () => !!window.FIREBASE_CONFIG;

  function setStatus(s, detail = '') {
    status = s;
    statusDetail = detail;
    listeners.forEach(fn => fn(s, detail));
  }

  function onStatus(fn) { listeners.push(fn); fn(status, statusDetail); }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.onload = resolve;
      el.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(el);
    });
  }

  async function ensureSdk() {
    if (db) return;
    if (!window.firebase) {
      await loadScript(SDK + 'firebase-app-compat.js');
      await loadScript(SDK + 'firebase-firestore-compat.js');
    }
    if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
    db = firebase.firestore();
  }

  // Normalize so "Smith Family" and "smith-family" are the same code.
  const norm = (s) => String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function docRef() {
    const sy = PT.State.data.syncProfile;
    if (!sy || !sy.code || !sy.name) return null;
    return db.collection('families').doc(norm(sy.code)).collection('players').doc(norm(sy.name));
  }

  // Connect this device to a family code + player name.
  async function connect(code, name) {
    if (!configured()) { setStatus('disabled'); return { ok: false, msg: 'Sync is not configured yet (see SETUP-FIREBASE.md).' }; }
    if (!norm(code) || !norm(name)) return { ok: false, msg: 'Please enter both a family code and a name.' };

    setStatus('connecting');
    try {
      await ensureSdk();
      PT.State.data.syncProfile = { code: norm(code), name: norm(name) };

      const snap = await docRef().get();
      const local = PT.State.data;
      if (snap.exists) {
        const remote = snap.data().save;
        const localProgress = (local.updatedAt || 0);
        const remoteProgress = (remote.updatedAt || 0);
        if (remoteProgress > localProgress) {
          // adopt the cloud save, but keep this device's sync profile
          remote.syncProfile = local.syncProfile;
          PT.State.adopt(remote);
        }
      }
      PT.State.save(); // persists profile and triggers a push
      await pushNow();
      setStatus('synced');
      return { ok: true, msg: snap.exists ? 'Connected — progress loaded from the cloud!' : 'Connected — this device\'s progress is now backed up.' };
    } catch (e) {
      setStatus('error', e.message);
      return { ok: false, msg: 'Could not connect: ' + e.message };
    }
  }

  function disconnect() {
    PT.State.data.syncProfile = null;
    PT.State.save();
    setStatus('off');
  }

  // Debounced push, called from State.save().
  function schedulePush() {
    if (!configured() || !PT.State.data.syncProfile) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushNow().catch(() => {}), PUSH_DELAY);
  }

  async function pushNow() {
    if (!configured() || !PT.State.data.syncProfile) return;
    try {
      await ensureSdk();
      const ref = docRef();
      if (!ref) return;
      // strip the profile from the uploaded save so a family code typo on one
      // device can't propagate; JSON round-trip drops any undefineds.
      const save = JSON.parse(JSON.stringify(PT.State.data));
      delete save.syncProfile;
      save.updatedAt = PT.State.data.updatedAt || Date.now();
      await ref.set({ save, pushedAt: Date.now() });
      setStatus('synced');
    } catch (e) {
      setStatus('error', e.message);
      throw e;
    }
  }

  // Pull the latest cloud save if it's newer (called on app start).
  async function pullIfNewer() {
    if (!configured() || !PT.State.data.syncProfile) return;
    try {
      setStatus('connecting');
      await ensureSdk();
      const snap = await docRef().get();
      if (snap.exists) {
        const remote = snap.data().save;
        if ((remote.updatedAt || 0) > (PT.State.data.updatedAt || 0)) {
          remote.syncProfile = PT.State.data.syncProfile;
          PT.State.adopt(remote);
          if (PT.App && PT.App.refreshHud) PT.App.refreshHud();
          if (PT.App && PT.App.toast) PT.App.toast('☁️ Progress loaded from the cloud!');
        }
      }
      setStatus('synced');
    } catch (e) {
      setStatus('error', e.message);
    }
  }

  function init() {
    if (!configured()) { setStatus(PT.State.data.syncProfile ? 'disabled' : 'off'); return; }
    if (PT.State.data.syncProfile) pullIfNewer();
  }

  return { init, connect, disconnect, schedulePush, pullIfNewer, onStatus, configured, get status() { return status; } };
})();
