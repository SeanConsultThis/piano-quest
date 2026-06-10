# 🎹 Piano Quest

A piano-learning game that **listens through the microphone** and hears which key
is pressed on a real (acoustic or digital) piano. Correct notes earn coins and
stars to spend in the Reward Store on piano skins, powerups, and new songs.

## Playing the game

**🌐 Live site (any device): <https://seanconsultthis.github.io/piano-quest/>**

Hosted on GitHub Pages from this repo (`SeanConsultThis/piano-quest`). HTTPS
means the microphone works on laptops, iPads, and phones. To deploy changes:

```sh
git add -A && git commit -m "update" && git push
```

The site refreshes about a minute after each push.

**Local alternative:** double-click `Start Piano Quest.command` in this
folder — it serves the app at `http://localhost:8742`. (Browsers only allow
mic access on secure pages — `localhost` counts, opening `index.html`
directly does not.)

## Cross-device progress (cloud sync)

Progress saves to the browser automatically; with cloud sync it follows her
to any device. One-time setup: **[SETUP-FIREBASE.md](SETUP-FIREBASE.md)**
(free Firebase project, ~10 min), paste the config into
`js/firebase-config.js`, push. Then on each device:
**⚙️ Settings → Cloud Sync → family code + name → Connect.**
The ☁️ in the top bar means progress is safe. If two devices play offline,
the most recently played one wins.

## First-time setup

1. Click **Allow** when the browser asks for the microphone.
2. Go to **⚙️ Settings → Microphone Test**: play single notes on the piano and
   check the right names appear. Best results: quiet room, computer near the
   piano, one clear note at a time.
3. Start with **Learn → Meet Middle C**.

## The game

- **Learn** — 6 lessons from "find Middle C" to reading real notation. Each
  lesson unlocks the next and pays a first-time coin bonus.
- **Songs** — built-in library (kids' classics, folk & holiday, simplified
  classical). Locked songs are bought with coins.
- **Scoring** — 10 points per correct note, streak multiplier up to 4×.
  Finish a song for 1–3 stars based on accuracy, plus coins.
- **Store** — 8 piano skins (whole-app themes), Streak Shield 🛡️ and Coin
  Doubler ✨ consumables, and the Octave Wizard 🧙 perk.
- **Tap Mode** — no mic? Keys on the screen keyboard are tappable instead
  (button in the play screen).

## Adding your own songs (＋ Add Song)

| Method | How |
|---|---|
| **Sheet music (MusicXML)** | Export from [MuseScore](https://musescore.org) via *File → Export → MusicXML → Uncompressed (`.musicxml`)*, or download arrangements from musescore.com. Scanning apps like PlayScore 2 turn paper sheet music into MusicXML. The first part's melody line is imported. |
| **MIDI file** (`.mid`) | Search the web for "*song name* midi" or export from GarageBand etc. The busiest track is used; chords keep their top note. |
| **Type it in** | Notes like `C4 D4 E4:2 F#4 R:1 C4:1(lyric)` — letter + octave, `:beats` to hold, `R` for rests. Middle C is `C4`. |

Uploaded songs are stored in the browser (localStorage) under **My Songs**.

## Mic detection notes

- Detection is octave-forgiving by default (the right key in any octave
  counts) because piano harmonics sometimes fool pitch detectors by an octave.
  Strict mode is in Settings.
- Repeated notes are detected by listening for a new attack, so press keys
  cleanly rather than holding the pedal down.

## Tech

No build, no dependencies — plain HTML/CSS/JS. Pitch detection is
autocorrelation over the Web Audio API; sounds are synthesized with
oscillators; progress lives in localStorage.
