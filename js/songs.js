// Built-in song library. Melodies are written in the quick-text format and
// parsed at load time. cost 0 = unlocked from the start.
window.PT = window.PT || {};

PT.Songs = (() => {
  const RAW = [
    // ---------- Classic kids' songs ----------
    {
      id: 'hotcrossbuns', title: 'Hot Cross Buns', category: 'kids', cost: 0, bpm: 90, difficulty: 1,
      text: `E4(Hot) D4(cross) C4:2(buns) | E4(hot) D4(cross) C4:2(buns) |
             C4:.5(one) C4:.5(a) C4:.5(pen-) C4:.5(ny) D4:.5(two) D4:.5(a) D4:.5(pen-) D4:.5(ny) |
             E4(hot) D4(cross) C4:2(buns)`
    },
    {
      id: 'mary', title: 'Mary Had a Little Lamb', category: 'kids', cost: 0, bpm: 100, difficulty: 1,
      text: `E4(Ma-) D4(ry) C4(had) D4(a) E4(lit-) E4(tle) E4:2(lamb) |
             D4(lit-) D4(tle) D4:2(lamb) E4(lit-) G4(tle) G4:2(lamb) |
             E4(Ma-) D4(ry) C4(had) D4(a) E4(lit-) E4(tle) E4(lamb) E4(whose) |
             D4(fleece) D4(was) E4(white) D4(as) C4:4(snow)`
    },
    {
      id: 'twinkle', title: 'Twinkle Twinkle Little Star', category: 'kids', cost: 0, bpm: 95, difficulty: 1,
      text: `C4(Twin-) C4(kle) G4(twin-) G4(kle) A4(lit-) A4(tle) G4:2(star) |
             F4(how) F4(I) E4(won-) E4(der) D4(what) D4(you) C4:2(are) |
             G4(Up) G4(a-) F4(bove) F4(the) E4(world) E4(so) D4:2(high) |
             G4(like) G4(a) F4(dia-) F4(mond) E4(in) E4(the) D4:2(sky) |
             C4(Twin-) C4(kle) G4(twin-) G4(kle) A4(lit-) A4(tle) G4:2(star) |
             F4(how) F4(I) E4(won-) E4(der) D4(what) D4(you) C4:2(are)`
    },
    {
      id: 'rowrow', title: 'Row, Row, Row Your Boat', category: 'kids', cost: 40, bpm: 100, difficulty: 1,
      text: `C4(Row) C4(row) C4(row) D4(your) E4:2(boat) |
             E4(gent-) D4(ly) E4(down) F4(the) G4:2(stream) |
             C5:.5(mer-) C5:.5(ri-) C5:.5(ly) G4:.5(mer-) G4:.5(ri-) G4:.5(ly) E4:.5(mer-) E4:.5(ri-) E4:.5(ly) C4:.5(mer-) C4:.5(ri-) C4:.5(ly) |
             G4(life) F4(is) E4(but) D4(a) C4:2(dream)`
    },
    {
      id: 'londonbridge', title: 'London Bridge', category: 'kids', cost: 50, bpm: 105, difficulty: 2,
      text: `G4(Lon-) A4(don) G4(Bridge) F4(is) E4(fall-) F4(ing) G4:2(down) |
             D4(fall-) E4(ing) F4:2(down) E4(fall-) F4(ing) G4:2(down) |
             G4(Lon-) A4(don) G4(Bridge) F4(is) E4(fall-) F4(ing) G4:2(down) |
             D4:2(my) G4:2(fair) E4(la-) C4:2(dy)`
    },
    {
      id: 'oldmacdonald', title: 'Old MacDonald', category: 'kids', cost: 60, bpm: 110, difficulty: 2,
      text: `C4(Old) C4(Mac-) C4(Don-) G3(ald) A3(had) A3(a) G3:2(farm) |
             E4(E-) E4(I-) D4(E-) D4(I-) C4:3(O) G3(And) |
             C4(on) C4(that) C4(farm) G3(he) A3(had) A3(a) G3:2(duck) |
             E4(E-) E4(I-) D4(E-) D4(I-) C4:3(O)`
    },

    // ---------- Folk & holiday ----------
    {
      id: 'odetojoy', title: 'Ode to Joy', category: 'folk', cost: 80, bpm: 110, difficulty: 2,
      text: `E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 |
             E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2`
    },
    {
      id: 'saints', title: 'When the Saints Go Marching In', category: 'folk', cost: 80, bpm: 115, difficulty: 2,
      text: `C4(Oh) E4(when) F4(the) G4:3(saints) C4(oh) E4(when) F4(the) G4:3(saints) |
             C4(oh) E4(when) F4(the) G4(saints) E4(go) C4(march-) E4(ing) D4:3(in) |
             E4(Oh) E4(I) D4(want) C4:2(to) C4(be) E4(in) G4(that) G4:1.5(num-) F4:1.5(ber) |
             E4(when) F4(the) G4(saints) E4(go) C4(march-) D4(ing) C4:3(in)`
    },
    {
      id: 'jinglebells', title: 'Jingle Bells', category: 'folk', cost: 100, bpm: 120, difficulty: 2,
      text: `E4(Jin-) E4(gle) E4:2(bells) E4(jin-) E4(gle) E4:2(bells) |
             E4(jin-) G4(gle) C4(all) D4(the) E4:4(way) |
             F4(Oh) F4(what) F4(fun) F4(it) F4(is) E4(to) E4(ride) E4:.5(in) E4:.5(a) |
             E4(one-) D4(horse) D4(o-) E4(pen) D4:2(sleigh) G4:2(hey) |
             E4(Jin-) E4(gle) E4:2(bells) E4(jin-) E4(gle) E4:2(bells) |
             E4(jin-) G4(gle) C4(all) D4(the) E4:4(way) |
             F4(Oh) F4(what) F4(fun) F4(it) F4(is) E4(to) E4(ride) E4:.5(in) E4:.5(a) |
             G4(one-) G4(horse) F4(o-) D4(pen) C4:4(sleigh)`
    },
    {
      id: 'amazinggrace', title: 'Amazing Grace', category: 'folk', cost: 90, bpm: 90, difficulty: 3,
      text: `G3(A-) C4:2(maz-) E4:.5(ing) C4:.5(grace) E4:2(how) D4(sweet) C4:2(the) A3(sound) G3:3(that) |
             G3(saved) C4:2(a) E4:.5(wretch) C4:.5(like) E4:2(me) D4(I) G4:5(once) |
             G4(was) E4:2(lost) G4:.5(but) E4:.5(now) C4:2(am) D4(found) C4:2(was) A3(blind) G3:3(but) |
             G3(now) C4:2(I) E4:.5(see) C4:.5(I) E4:2(see) D4(a-) C4:4(gain)`
    },

    // ---------- Classical (simplified) ----------
    {
      id: 'minueting', title: 'Minuet in G (simplified)', category: 'classical', cost: 150, bpm: 110, difficulty: 3,
      text: `D5:2 G4 A4 B4 C5 | D5:2 G4 G4 | E5:2 C5 D5 E5 F#5 | G5:2 G4 G4 |
             C5:2 D5 C5 B4 A4 | B4:2 C5 B4 A4 G4 | F#4:2 G4 A4 B4 G4 | B4:2 A4:4`
    },
    {
      id: 'furelise', title: 'Für Elise (opening)', category: 'classical', cost: 200, bpm: 120, difficulty: 3,
      text: `E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:2 |
             C4:.5 E4:.5 A4:.5 B4:2 E4:.5 G#4:.5 B4:.5 C5:2 |
             E4:.5 E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:2 |
             C4:.5 E4:.5 A4:.5 B4:2 E4:.5 C5:.5 B4:.5 A4:3`
    },
  ];

  const CATEGORIES = [
    { id: 'kids', name: 'Classic Kids’ Songs', icon: '🧸' },
    { id: 'folk', name: 'Folk & Holiday', icon: '🎄' },
    { id: 'classical', name: 'Classical', icon: '🎻' },
    { id: 'mine', name: 'My Songs', icon: '⭐' },
  ];

  const all = RAW.map(s => {
    const { text, ...rest } = s;
    return { ...rest, notes: PT.Parsers.parseText(text) };
  });

  function byId(id) {
    return all.find(s => s.id === id) || PT.State.data.mySongs.find(s => s.id === id) || null;
  }

  function listFor(category) {
    if (category === 'mine') return PT.State.data.mySongs;
    return all.filter(s => s.category === category);
  }

  return { all, CATEGORIES, byId, listFor };
})();
