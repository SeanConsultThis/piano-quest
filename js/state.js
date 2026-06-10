// Persistent game state (localStorage)
window.PT = window.PT || {};

PT.State = (() => {
  const KEY = 'pianoQuest.save.v1';

  const DEFAULTS = {
    playerName: '',
    syncProfile: null,        // {code, name} when cloud sync is connected
    updatedAt: 0,             // last-save timestamp, used for sync conflicts
    coins: 0,
    totalStars: 0,
    unlockedSongs: ['hotcrossbuns', 'mary', 'twinkle'],
    ownedSkins: ['classic'],
    activeSkin: 'classic',
    consumables: { shield: 0, doubler: 0 },
    perks: { octaveWizard: false },
    lessonsDone: {},          // lessonId -> true
    songBest: {},             // songId -> {stars, score, accuracy}
    mySongs: [],              // uploaded songs
    settings: {
      strictOctave: false,    // false = any octave counts (kinder to mic detection)
      hints: true,
      keyLabels: true,
      staffLabels: true,
      tapMode: false,
    },
  };

  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const d = JSON.parse(raw);
      // shallow-merge so new fields appear for old saves
      const merged = Object.assign(structuredClone(DEFAULTS), d);
      merged.settings = Object.assign(structuredClone(DEFAULTS.settings), d.settings || {});
      merged.consumables = Object.assign(structuredClone(DEFAULTS.consumables), d.consumables || {});
      merged.perks = Object.assign(structuredClone(DEFAULTS.perks), d.perks || {});
      return merged;
    } catch (e) {
      return structuredClone(DEFAULTS);
    }
  }

  function save() {
    data.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(data));
    if (PT.App && PT.App.refreshHud) PT.App.refreshHud();
    if (PT.Sync) PT.Sync.schedulePush();
  }

  // Replace local state with a save object (used by cloud sync).
  function adopt(saveObj) {
    const merged = Object.assign(structuredClone(DEFAULTS), saveObj);
    merged.settings = Object.assign(structuredClone(DEFAULTS.settings), saveObj.settings || {});
    merged.consumables = Object.assign(structuredClone(DEFAULTS.consumables), saveObj.consumables || {});
    merged.perks = Object.assign(structuredClone(DEFAULTS.perks), saveObj.perks || {});
    data = merged;
    localStorage.setItem(KEY, JSON.stringify(data));
    if (PT.Store) PT.Store.applySkin();
  }

  function addCoins(n) {
    data.coins += n;
    save();
  }

  function spend(n) {
    if (data.coins < n) return false;
    data.coins -= n;
    save();
    return true;
  }

  function reset() {
    data = structuredClone(DEFAULTS);
    save();
  }

  return {
    get data() { return data; },
    save, adopt, addCoins, spend, reset,
  };
})();
