export interface DialogueChoice {
  label: string;
  nextId: string | null;
  action?: 'breathe-leaves' | 'vision-creation' | 'vision-cross' | 'vision-sawdust' | 'mark-healed';
}

export interface DialogueNode {
  id: string;
  speaker: string;
  role: string;
  text: string;
  choices: DialogueChoice[];
}

export interface SaintProfile {
  id: string;
  name: string;
  title: string;
  zone: string;
  startNodeId: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  shirtColor: number;
  vestColor: number;
  hairColor: number;
  skinColor: number;
  auraColor: number;
  hasBench: boolean;
  benchOffset?: [number, number, number];
}

export const SAINTS: SaintProfile[] = [
  {
    id: 'amos',
    name: 'Amos',
    title: 'Keeper of the Trees & New Arrivals',
    zone: 'Terrace of New Arrivals',
    startNodeId: 'amos_1',
    position: [-2.8, 0, 5.5],
    lookAt: [0, 0, 12],
    shirtColor: 0xe8dec8,
    vestColor: 0x4b5c3e,
    hairColor: 0xd9d4c7,
    skinColor: 0xd1a27c,
    auraColor: 0xffdf99,
    hasBench: true,
    benchOffset: [-1.4, 0, 0.2]
  },
  {
    id: 'mara',
    name: 'Mara',
    title: 'The Healed — Walled Orchard',
    zone: 'The Walled Orchard',
    startNodeId: 'mara_1',
    position: [-15.5, 0, -5.5],
    lookAt: [-11, 0, -5],
    shirtColor: 0xddd4c6,
    vestColor: 0x8e726b,
    hairColor: 0x47332a,
    skinColor: 0xd9b092,
    auraColor: 0xf7b9a1,
    hasBench: true,
    benchOffset: [0, 0, 1.5]
  },
  {
    id: 'thomas',
    name: 'Rev. Thomas Ainsley',
    title: 'The Striver — Freed from the Ledger',
    zone: 'The Walled Orchard',
    startNodeId: 'thomas_1',
    position: [-12.2, 0, -13.5],
    lookAt: [-6, 0, -12],
    shirtColor: 0xebe6da,
    vestColor: 0x5c534a,
    hairColor: 0xcccccc,
    skinColor: 0xd4aa8c,
    auraColor: 0xcfe2ff,
    hasBench: true,
    benchOffset: [1.5, 0, 0.2]
  },
  {
    id: 'elias',
    name: 'Elias Vance',
    title: 'The Builder — Mentor of Living Memory',
    zone: 'Pool of Living Memory',
    startNodeId: 'elias_1',
    position: [12.5, 0, -6.2],
    lookAt: [16, 0, -8],
    shirtColor: 0x466384, // Elias's canonical blue denim work shirt
    vestColor: 0x7c4a26,  // Brown leather suspenders accent
    hairColor: 0xc9c4b8,
    skinColor: 0xd6a785,
    auraColor: 0xffd584,
    hasBench: true,
    benchOffset: [-1.4, 0, 0.5]
  }
];

export const DIALOGUES: Record<string, DialogueNode> = {
  // --- AMOS ---
  amos_1: {
    id: 'amos_1',
    speaker: 'Amos',
    role: 'Keeper of the Trees & New Arrivals',
    text: 'Welcome home, friend. Pull up a seat—there is no hurry here. Look down at the grass when you walk; it bends to receive your step and springs back greener for the greeting. The first thing anyone learns on this Terrace is how to stop working long enough to be loved.',
    choices: [
      { label: 'Why does the light feel so gentle here compared to the distant City?', nextId: 'amos_banked' },
      { label: 'What is that dark canyon of gray mist off to the east?', nextId: 'amos_mist' },
      { label: 'Take me into the Vision of Creation.', nextId: null, action: 'vision-creation' },
      { label: 'Thank you, Amos. I will walk a while.', nextId: null }
    ]
  },
  amos_banked: {
    id: 'amos_banked',
    speaker: 'Amos',
    role: 'Keeper of the Trees & New Arrivals',
    text: 'A soul born in a cellar cannot walk straight out at noon. So He banks the fire here—turns the glory gentle, like morning in a valley before the sun clears the ridge. Sit with Mara and Thomas in the Walled Orchard across the grass, or walk with Elias by the Golden Pool. As your heart heals, your eyes grow stronger for the Rising Road.',
    choices: [
      { label: 'Tell me about the Gray Mist at the cliff edge.', nextId: 'amos_mist' },
      { label: 'Show me Creation—"Let There Be Light."', nextId: null, action: 'vision-creation' },
      { label: 'I will explore the Terrace and the Orchard.', nextId: null, action: 'mark-healed' }
    ]
  },
  amos_mist: {
    id: 'amos_mist',
    speaker: 'Amos',
    role: 'Keeper of the Trees & New Arrivals',
    text: 'That is the hardest sight in all of Heaven, and the most honest. God casts no one out—the gates of the City are never shut, day or night. There are no chains here and no cages. Love that could be forced would not be love. He will only, forever, stand in the open door with the light behind Him, and let every soul choose.',
    choices: [
      { label: 'That makes the grace here feel even more real.', nextId: 'amos_1', action: 'mark-healed' },
      { label: 'Thank you, Amos. I want to sit with that for a moment.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- MARA ---
  mara_1: {
    id: 'mara_1',
    speaker: 'Mara',
    role: 'The Healed — Walled Orchard',
    text: 'When I first arrived on the Terrace, I stood at the very edge of the grass with my arms wrapped tight around myself. I kept telling Amos there had been a mistake—that once the clean light showed what I had been, someone would put a hand on my collar and show me the door. On the Rising Road, the weight of glory brought me straight to my knees.',
    choices: [
      { label: 'What changed for you in this orchard?', nextId: 'mara_leaves' },
      { label: 'Did the leaves erase your memories?', nextId: 'mara_scars' },
      { label: 'I am glad you stayed, Mara.', nextId: null, action: 'mark-healed' }
    ]
  },
  mara_leaves: {
    id: 'mara_leaves',
    speaker: 'Mara',
    role: 'The Healed — Walled Orchard',
    text: 'Amos did not tell me to try harder. He carried me in under these Trees of Life, gathered an ordinary handful of leaves like mint from a garden, pressed them into my palms, and said: "Breathe, child. You do not have to do anything up here except breathe and be mended." Would you like to breathe them with me?',
    choices: [
      { label: 'Breathe the Healing Leaves of the Tree of Life', nextId: 'mara_after_leaves', action: 'breathe-leaves' },
      { label: 'Did the leaves erase what happened on Earth?', nextId: 'mara_scars' }
    ]
  },
  mara_scars: {
    id: 'mara_scars',
    speaker: 'Mara',
    role: 'The Healed — Walled Orchard',
    text: 'No—and I am grateful they did not. I remember every hard room and every broken year. What the leaves did was far kinder: they drew the poison out of the memory. They turned an open, bleeding wound into a healed scar. A wound flinches from the light—but a scar can stand straight up in the sun and be loved on.',
    choices: [
      { label: 'Breathe the Healing Leaves now', nextId: 'mara_after_leaves', action: 'breathe-leaves' },
      { label: 'Thank you for telling me the truth, Mara.', nextId: null, action: 'mark-healed' }
    ]
  },
  mara_after_leaves: {
    id: 'mara_after_leaves',
    speaker: 'Mara',
    role: 'The Healed — Walled Orchard',
    text: 'Feel that? The bracing stops. Later, when you pass under the Eastern Gate of One Pearl, the keeper does not read a ledger of your failures—he speaks your True Name, the one Heaven kept for you before you were born. It was never ours to earn. It was just for us the whole time.',
    choices: [
      { label: 'Thank you, Mara. My eyes feel clearer already.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- REV. THOMAS AINSLEY ---
  thomas_1: {
    id: 'thomas_1',
    speaker: 'Rev. Thomas Ainsley',
    role: 'The Striver — Freed from the Ledger',
    text: 'Forgive me—when I first got here I could not keep my hands still. Forty years on the mission field, and I arrived auditing my whole life like a ledger I was certain would not balance. I left a field too soon in 1961. Worse, I hid inside good work while my own daughter grew up starving for her father.',
    choices: [
      { label: 'How did you finally lay the ledger down?', nextId: 'thomas_song' },
      { label: 'It takes courage to admit hiding inside good work.', nextId: 'thomas_bench' },
      { label: 'Rest easy by the river, Thomas.', nextId: null, action: 'mark-healed' }
    ]
  },
  thomas_song: {
    id: 'thomas_song',
    speaker: 'Rev. Thomas Ainsley',
    role: 'The Striver — Freed from the Ledger',
    text: 'The leaves were Mara\'s medicine, not mine. Mine came walking down the road as a song—"Jesus Paid It All." One of the saints knelt right here in the grass and did not argue with a single line of my ledger. She just smiled and said: "No one at that table earned their seat, Thomas. Your forty years were not the payment—they were the thank-you."',
    choices: [
      { label: 'And then the Master came through the garden?', nextId: 'thomas_bench' },
      { label: 'Not the payment—the thank-you. I needed to hear that.', nextId: null, action: 'mark-healed' }
    ]
  },
  thomas_bench: {
    id: 'thomas_bench',
    speaker: 'Rev. Thomas Ainsley',
    role: 'The Striver — Freed from the Ledger',
    text: 'He did not summon us in a line before a distant throne. He walked bench to bench on foot, folded Himself right down beside me on this grass, and put His arm around my shoulders. You simply cannot go on believing you owe a debt to Someone sitting beside you calling you friend.',
    choices: [
      { label: 'Thank you, Thomas. Peace to you.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- ELIAS VANCE ---
  elias_1: {
    id: 'elias_1',
    speaker: 'Elias Vance',
    role: 'The Builder — Mentor of Living Memory',
    text: 'Name\'s Elias. Built houses for forty years—square corners, plumb walls—and quietly filed Heaven away with the blueprints that never got funded. Worse, after losing my wife Ruth and our little girl Naomi, I built a wall of silence between me and my boy Daniel. They sent me back once, just long enough to answer a dying girl named June and write Daniel the truth in a blunt pencil. Now I\'m Home for good—and the empty bin in my Treasury finally holds a gem.',
    choices: [
      { label: 'Step with me into Vision #2: The Cross ("The Wound That Became a Gate")', nextId: null, action: 'vision-cross' },
      { label: 'Show me Vision #3: "The Boy in the Sawdust" (Ripple Review)', nextId: null, action: 'vision-sawdust' },
      { label: 'Tell me what actually lasts when the houses burn.', nextId: 'elias_sawdust' },
      { label: 'I\'ll look into the Golden Pool in a moment, Elias.', nextId: null, action: 'mark-healed' }
    ]
  },
  elias_sawdust: {
    id: 'elias_sawdust',
    speaker: 'Elias Vance',
    role: 'The Builder — Mentor of Living Memory',
    text: 'In my life review, the light did not glance once at a single roof I raised for pride. It showed me a Wednesday fifty years back when a green seventeen-year-old boy on my crew lost his father and sat crying behind stacked lumber. I sat down in the sawdust beside him, said one clumsy sentence, and forgot it inside a week. The light did not forget. Sitting down beside someone is the only building material that survives the fire.',
    choices: [
      { label: 'Witness "The Boy in the Sawdust" in Living Memory', nextId: null, action: 'vision-sawdust' },
      { label: 'Witness "The Cross — The Wound That Became a Gate"', nextId: null, action: 'vision-cross' },
      { label: 'Thank you, Elias. I will carry that with me.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- ENVIRONMENTAL INTERACTABLES ---
  mist_edge: {
    id: 'mist_edge',
    speaker: 'The Fork & Edge of the Gray Mist',
    role: 'Environmental Reflection — Chapter 4',
    text: 'A narrow trail slopes downward into quiet, shadowless gray mist. There is no locked gate here, no fence, and no angel blocking the descent. Heaven compels no one—for love forced against the grain of a heart would not be love. Behind you, the sunlit road to the City stands forever open.',
    choices: [
      { label: 'Turn back toward the sunlit Terrace', nextId: null, action: 'mark-healed' }
    ]
  },
  pool_menu: {
    id: 'pool_menu',
    speaker: 'The Golden Pool of Living Memory',
    role: 'Zone 5 — Guided 3D Visions',
    text: 'Warm liquid light ripples across the marble basin beneath the floral stone archways. Look freely in all 360 degrees as you step inside a living memory of grace.',
    choices: [
      { label: 'Vision #1 — Creation: "Let There Be Light" (with Amos)', nextId: null, action: 'vision-creation' },
      { label: 'Vision #2 — The Cross: "The Wound That Became a Gate" (with Elias)', nextId: null, action: 'vision-cross' },
      { label: 'Vision #3 — Testimony Echo: "The Boy in the Sawdust" (with Elias)', nextId: null, action: 'vision-sawdust' },
      { label: 'Step back from the Pool', nextId: null }
    ]
  },
  overlook_unlocked: {
    id: 'overlook_unlocked',
    speaker: 'The Rising Road Overlook',
    role: 'Eyes Grown for Glory',
    text: 'Your eyes have adjusted to the unbanked radiance. Ahead rises the luminous Eastern Gate of One Pearl—grown layer by patient layer around a wound—and beyond its transparent streets of gold lies the mirror-still Sapphire Sea of Glass before the Throne. Where He is, there is Heaven.',
    choices: [
      { label: 'Remain in the stillness and look out over the City', nextId: null }
    ]
  }
};
