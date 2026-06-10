// Guided lessons for a total beginner: find the keys first, then read the staff.
window.PT = window.PT || {};

PT.Lessons = (() => {
  const seq = (names) => names.map(n => ({ n }));

  const LESSONS = [
    {
      id: 'l1', title: 'Meet Middle C', coins: 20, icon: '🎯',
      desc: 'Find Middle C — home base for everything.',
      intro: 'Look at your piano: the black keys come in groups of 2 and 3. Middle C is the white key just LEFT of a group of TWO black keys, closest to the middle of the piano.',
      opts: { bigLetter: true, staff: false },
      items: seq(['C4', 'C4', 'C4', 'C4', 'C4']),
    },
    {
      id: 'l2', title: 'C, D and E', coins: 25, icon: '🐾',
      desc: 'Three neighbors: C, D, E.',
      intro: 'D is the white key right after Middle C, and E is right after D. Step up and down between them.',
      opts: { bigLetter: true, staff: false },
      items: seq(['C4', 'D4', 'E4', 'D4', 'C4', 'E4', 'C4', 'D4', 'E4', 'E4', 'D4', 'C4']),
    },
    {
      id: 'l3', title: 'Five-Finger Power (C–G)', coins: 30, icon: '🖐️',
      desc: 'One finger per key: thumb on C, pinky on G.',
      intro: 'Place your right thumb on Middle C and let one finger rest on each key up to G. Try to use the matching finger for each note!',
      opts: { bigLetter: true, staff: false },
      items: seq(['C4', 'D4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'E4', 'G4', 'E4', 'C4']),
    },
    {
      id: 'l4', title: 'The Full Octave', coins: 35, icon: '🌈',
      desc: 'All the way from C to the next C.',
      intro: 'After G come A and B, then you land on C again — one octave up! Climb the whole ladder.',
      opts: { bigLetter: true, staff: false },
      items: seq(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4']),
    },
    {
      id: 'l5', title: 'Reading Music 1', coins: 45, icon: '📖',
      desc: 'Notes on the staff — with letter helpers.',
      intro: 'Now the notes appear on a real music staff. Middle C sits on its own little line below the staff. The letters are still shown to help you.',
      opts: { bigLetter: false, staff: true, staffLabels: true },
      items: seq(['C4', 'E4', 'G4', 'E4', 'C4', 'D4', 'F4', 'D4', 'G4', 'C4', 'E4', 'D4', 'F4', 'E4', 'C4']),
    },
    {
      id: 'l6', title: 'Reading Music 2', coins: 60, icon: '🏆',
      desc: 'Real note reading — no letter helpers!',
      intro: 'This time, no letters — just the notes on the staff. Remember: the lines from bottom to top are E-G-B-D-F (Every Good Burger Deserves Fries), and the spaces spell F-A-C-E.',
      opts: { bigLetter: false, staff: true, staffLabels: false },
      items: seq(['E4', 'G4', 'B4', 'F4', 'A4', 'C4', 'D4', 'G4', 'E4', 'C5', 'A4', 'F4', 'D4', 'B4', 'G4', 'C4']),
    },
  ];

  return { LESSONS };
})();
