// The Reward Store: piano skins, powerups, and song unlocks.
window.PT = window.PT || {};

PT.Store = (() => {
  const SKINS = [
    { id: 'classic', name: 'Classic Grand', cost: 0, emoji: '🎹', desc: 'Timeless black & white.' },
    { id: 'bubblegum', name: 'Bubblegum Pop', cost: 100, emoji: '🍬', desc: 'Pink & sweet.' },
    { id: 'ocean', name: 'Ocean Wave', cost: 120, emoji: '🌊', desc: 'Cool blues of the deep sea.' },
    { id: 'forest', name: 'Enchanted Forest', cost: 140, emoji: '🌲', desc: 'Mossy greens and fireflies.' },
    { id: 'candy', name: 'Candy Shop', cost: 160, emoji: '🍭', desc: 'A rainbow sugar rush.' },
    { id: 'neon', name: 'Neon Nights', cost: 200, emoji: '🌃', desc: 'Glowing keys in the dark.' },
    { id: 'galaxy', name: 'Galaxy Quest', cost: 250, emoji: '🪐', desc: 'Play among the stars.' },
    { id: 'gold', name: 'Royal Gold', cost: 400, emoji: '👑', desc: 'The piano of champions.' },
  ];

  const POWERUPS = [
    {
      id: 'shield', name: 'Streak Shield', cost: 30, emoji: '🛡️', type: 'consumable',
      desc: 'One free mistake — your streak survives a wrong note. (Single use)'
    },
    {
      id: 'doubler', name: 'Coin Doubler', cost: 50, emoji: '✨', type: 'consumable',
      desc: 'Earn DOUBLE coins on your next song. (Single use)'
    },
    {
      id: 'octaveWizard', name: 'Octave Wizard', cost: 80, emoji: '🧙', type: 'perk',
      desc: 'Already included while learning: any octave counts. Buy to keep it even in Strict mode... or just for the wizard hat.'
    },
  ];

  function buySkin(id) {
    const skin = SKINS.find(s => s.id === id);
    const st = PT.State.data;
    if (!skin || st.ownedSkins.includes(id)) return false;
    if (!PT.State.spend(skin.cost)) return false;
    st.ownedSkins.push(id);
    st.activeSkin = id;
    PT.State.save();
    return true;
  }

  function equipSkin(id) {
    if (!PT.State.data.ownedSkins.includes(id)) return false;
    PT.State.data.activeSkin = id;
    PT.State.save();
    applySkin();
    return true;
  }

  function applySkin() {
    document.body.className = 'skin-' + PT.State.data.activeSkin;
  }

  function buyPowerup(id) {
    const p = POWERUPS.find(x => x.id === id);
    const st = PT.State.data;
    if (!p) return false;
    if (p.type === 'perk') {
      if (st.perks[id]) return false;
      if (!PT.State.spend(p.cost)) return false;
      st.perks[id] = true;
    } else {
      if (!PT.State.spend(p.cost)) return false;
      st.consumables[id] = (st.consumables[id] || 0) + 1;
    }
    PT.State.save();
    return true;
  }

  function unlockSong(id) {
    const song = PT.Songs.byId(id);
    const st = PT.State.data;
    if (!song || st.unlockedSongs.includes(id)) return false;
    if (!PT.State.spend(song.cost)) return false;
    st.unlockedSongs.push(id);
    PT.State.save();
    return true;
  }

  return { SKINS, POWERUPS, buySkin, equipSkin, applySkin, buyPowerup, unlockSong };
})();
