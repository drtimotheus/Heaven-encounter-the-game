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

export type SaintCategory = 'novel' | 'old-testament' | 'prophet' | 'disciple' | 'new-testament';
export type SaintProp = 'none' | 'harp' | 'scroll' | 'staff' | 'flowers' | 'lantern';
export type SaintBehavior = 'stroll' | 'pair-talk' | 'admire' | 'harp-play' | 'bench-rest';

export interface SaintProfile {
  id: string;
  name: string;
  title: string;
  category: SaintCategory;
  zone: string;
  startNodeId: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  patrolPoints?: [number, number][];
  partnerId?: string;
  behavior: SaintBehavior;
  prop: SaintProp;
  hasBeard?: boolean;
  hasHeadscarf?: boolean;
  shirtColor: number;
  vestColor: number;
  robeLowerColor: number;
  hairColor: number;
  skinColor: number;
  auraColor: number;
  hasBench: boolean;
  benchOffset?: [number, number, number];
  greetingLines: string[];
  leafReaction: string;
}

export interface AmbientBanterPair {
  id: string;
  speakers: [string, string];
  lines: { speakerId: string; text: string }[];
}

export const SAINTS: SaintProfile[] = [
  // --- CORE NOVEL SAINTS (The Waiting Room of the Saints) ---
  {
    id: 'amos',
    name: 'Amos',
    title: 'Keeper of the Trees & New Arrivals',
    category: 'novel',
    zone: 'Terrace of New Arrivals',
    startNodeId: 'amos_1',
    position: [-2.4, 0, 5.8],
    lookAt: [0, 0, 12],
    patrolPoints: [[-2.4, 5.8], [0.6, 4.2], [-1.8, 2.6], [-2.4, 5.8]],
    behavior: 'stroll',
    prop: 'none',
    hasBeard: true,
    shirtColor: 0xe8dec8,
    vestColor: 0x4b5c3e,
    robeLowerColor: 0x4e473f,
    hairColor: 0xd9d4c7,
    skinColor: 0xd1a27c,
    auraColor: 0xffdf99,
    hasBench: true,
    benchOffset: [-1.5, 0, 0.3],
    greetingLines: [
      'Take your time, friend—the grass springs back greener for your step.',
      'No hurry on the Terrace. Pull up a chair whenever you wish.',
      'Look around—every soul you meet here has a story of mercy.'
    ],
    leafReaction: 'Ah—feel that? The leaves never erase the truth, only the sting.'
  },
  {
    id: 'mara',
    name: 'Mara',
    title: 'The Healed — Walled Orchard',
    category: 'novel',
    zone: 'The Walled Orchard',
    startNodeId: 'mara_1',
    position: [-15.8, 0, -6.2],
    lookAt: [-12.5, 0, -6.5],
    partnerId: 'mary_magdalene',
    behavior: 'pair-talk',
    prop: 'none',
    shirtColor: 0xddd4c6,
    vestColor: 0x8e726b,
    robeLowerColor: 0x6b5d57,
    hairColor: 0x47332a,
    skinColor: 0xd9b092,
    auraColor: 0xf7b9a1,
    hasBench: true,
    benchOffset: [0.3, 0, 1.7],
    greetingLines: [
      'You are safe in this orchard. Nobody puts a hand on your collar here.',
      'Come sit under the leaves with us—the light is gentle here.'
    ],
    leafReaction: 'Look how the light settles softly over the orchard... a scar can stand in the sun.'
  },
  {
    id: 'thomas',
    name: 'Rev. Thomas Ainsley',
    title: 'The Striver — Freed from the Ledger',
    category: 'novel',
    zone: 'The Walled Orchard',
    startNodeId: 'thomas_1',
    position: [-12.4, 0, -13.4],
    lookAt: [-7, 0, -11],
    behavior: 'bench-rest',
    prop: 'none',
    hasBeard: false,
    shirtColor: 0xebe6da,
    vestColor: 0x5c534a,
    robeLowerColor: 0x423e3b,
    hairColor: 0xcccccc,
    skinColor: 0xd4aa8c,
    auraColor: 0xcfe2ff,
    hasBench: true,
    benchOffset: [1.5, 0, 0.2],
    greetingLines: [
      'My hands are finally still, friend. Come rest a moment.',
      'No ledgers here—only thank-yous.'
    ],
    leafReaction: 'Praise Him—nothing left to pay, nothing left to prove.'
  },
  {
    id: 'elias',
    name: 'Elias Vance',
    title: 'The Builder — Mentor of Living Memory',
    category: 'novel',
    zone: 'Pool of Living Memory',
    startNodeId: 'elias_1',
    position: [11.6, 0, -6.4],
    lookAt: [14, 0, -10],
    patrolPoints: [[11.6, -6.4], [9.4, -7.8], [10.6, -11.4], [11.6, -6.4]],
    behavior: 'stroll',
    prop: 'none',
    shirtColor: 0x466384, // Blue denim work shirt
    vestColor: 0x7c4a26,  // Leather suspenders
    robeLowerColor: 0x3b3835,
    hairColor: 0xc9c4b8,
    skinColor: 0xd6a785,
    auraColor: 0xffd584,
    hasBench: true,
    benchOffset: [-1.5, 0, 0.5],
    greetingLines: [
      'Good to see you, neighbor. Step up to the Golden Pool whenever you’re ready.',
      'Forty years of framing houses, and I never saw joinery like Heaven’s.'
    ],
    leafReaction: 'That scent goes straight past the walls we used to hide behind.'
  },

  // --- NEW TESTAMENT APOSTLES & DISCIPLES ---
  {
    id: 'paul',
    name: 'Paul of Tarsus',
    title: 'Apostle of Grace — New Testament',
    category: 'new-testament',
    zone: 'Terrace Courtyard',
    startNodeId: 'paul_1',
    position: [5.2, 0, 1.8],
    lookAt: [3.2, 0, 1.5],
    partnerId: 'peter',
    behavior: 'pair-talk',
    prop: 'scroll',
    hasBeard: true,
    shirtColor: 0xdfd3be,
    vestColor: 0x7a343b, // Deep crimson mantle
    robeLowerColor: 0x5c4738,
    hairColor: 0x4a3d35,
    skinColor: 0xc7926b,
    auraColor: 0xffc796,
    hasBench: true,
    benchOffset: [1.4, 0, 1.0],
    greetingLines: [
      'Grace and peace to you! I was just telling Cephas how tiny my ink was.',
      'Come join us—I spent half my life arguing and the other half marveling.'
    ],
    leafReaction: 'Every earthly affliction really was momentary beside this weight of glory!'
  },
  {
    id: 'peter',
    name: 'Simon Peter',
    title: 'The Fisherman Disciple — New Testament',
    category: 'disciple',
    zone: 'River of Life Bridge',
    startNodeId: 'peter_1',
    position: [3.0, 0, 1.4],
    lookAt: [5.2, 0, 1.8],
    partnerId: 'paul',
    behavior: 'pair-talk',
    prop: 'staff',
    hasBeard: true,
    shirtColor: 0xd6ccb8,
    vestColor: 0x355b7d, // Sea-blue fisherman cloak
    robeLowerColor: 0x4d4a44,
    hairColor: 0x8f877d,
    skinColor: 0xc48f67,
    auraColor: 0x99dcff,
    hasBench: false,
    greetingLines: [
      'Try wading in this river, friend—not even I can sink in these waters!',
      'Glad you made it! Paul and I were trading stories about being stubborn.'
    ],
    leafReaction: 'Ha! Better than charcoal smoke by a Galilean shore, isn’t it?'
  },
  {
    id: 'mary_magdalene',
    name: 'Mary Magdalene',
    title: 'First Witness of the Dawn — Disciple',
    category: 'disciple',
    zone: 'The Walled Orchard',
    startNodeId: 'mary_1',
    position: [-12.8, 0, -6.6],
    lookAt: [-15.8, 0, -6.2],
    partnerId: 'mara',
    behavior: 'pair-talk',
    prop: 'flowers',
    hasHeadscarf: true,
    shirtColor: 0xf2e7d5,
    vestColor: 0x6c4c7d, // Soft violet shawl
    robeLowerColor: 0x806a8a,
    hairColor: 0x36241d,
    skinColor: 0xc99472,
    auraColor: 0xe6b8ff,
    hasBench: false,
    greetingLines: [
      'Peace to you—have you noticed how every garden here reminds me of that Sunday morning?',
      'He always starts by speaking your name gently.'
    ],
    leafReaction: 'It feels just like hearing Him say my name outside the empty tomb.'
  },
  {
    id: 'john',
    name: 'John the Beloved',
    title: 'Disciple & Seer of Patmos — New Testament',
    category: 'disciple',
    zone: 'Rising Road Approach',
    startNodeId: 'john_1',
    position: [2.8, 0, -16.8],
    lookAt: [0, 4, -48],
    partnerId: 'isaiah',
    behavior: 'pair-talk',
    prop: 'scroll',
    hasBeard: true,
    shirtColor: 0xf4eee0,
    vestColor: 0x2e6e78, // Teal-sapphire mantle
    robeLowerColor: 0x445963,
    hairColor: 0xe3dfd5,
    skinColor: 0xd1a280,
    auraColor: 0x9cecff,
    hasBench: true,
    benchOffset: [1.6, 0, 0.4],
    greetingLines: [
      'Look up toward that single pearl—I tried my best to describe it on Patmos!',
      'Come stand beside Isaiah and me. Earthly words never did that Gate justice.'
    ],
    leafReaction: 'The leaves of the tree really are for the healing of the nations.'
  },

  // --- OLD TESTAMENT SAINTS & PROPHETS ---
  {
    id: 'david',
    name: 'King David',
    title: 'Shepherd & Psalmist — Old Testament',
    category: 'old-testament',
    zone: 'Arrival Meadow Hillside',
    startNodeId: 'david_1',
    position: [-7.2, 0, 8.6],
    lookAt: [0, 0, 5],
    behavior: 'harp-play',
    prop: 'harp',
    hasBeard: true,
    shirtColor: 0xf2e4c4,
    vestColor: 0x9c6b27, // Burnished gold-ochre shepherd cloak
    robeLowerColor: 0x5c3c28,
    hairColor: 0x6b3a24,
    skinColor: 0xc9956d,
    auraColor: 0xffe48f,
    hasBench: true,
    benchOffset: [1.5, 0, 0.4],
    greetingLines: [
      'Hear that chord rising out of the grass? Even my psalms were only a tuning note!',
      'Sit beside an old shepherd—I have a new song you have never heard.'
    ],
    leafReaction: 'He restores my soul—look how the very hills answer in harmony!'
  },
  {
    id: 'moses',
    name: 'Moses',
    title: 'Shepherd of Sinai — Old Testament',
    category: 'old-testament',
    zone: 'Eastern Meadow Path',
    startNodeId: 'moses_1',
    position: [10.4, 0, 6.2],
    lookAt: [12.8, 0, 5.2],
    partnerId: 'elijah',
    behavior: 'pair-talk',
    prop: 'staff',
    hasBeard: true,
    shirtColor: 0xe6dbc4,
    vestColor: 0x7d5836, // Desert ochre mantle
    robeLowerColor: 0x574231,
    hairColor: 0xe6e2d8,
    skinColor: 0xc28e67,
    auraColor: 0xffe0a3,
    hasBench: true,
    benchOffset: [-1.4, 0, 0.8],
    greetingLines: [
      'No burning bush required to take off your sandals here—the whole ground is holy.',
      'Forty years in dust, and look at the country we finally crossed into!'
    ],
    leafReaction: 'More tender than manna at dawn, friend.'
  },
  {
    id: 'elijah',
    name: 'Prophet Elijah',
    title: 'Prophet of the Still Small Voice — Old Testament',
    category: 'prophet',
    zone: 'Eastern Meadow & Gray Mist Approach',
    startNodeId: 'elijah_1',
    position: [13.0, 0, 5.2],
    lookAt: [10.4, 0, 6.2],
    partnerId: 'moses',
    behavior: 'pair-talk',
    prop: 'none',
    hasBeard: true,
    shirtColor: 0xd9cbb5,
    vestColor: 0x59422e, // Coarse camel-hair mantle
    robeLowerColor: 0x453528,
    hairColor: 0x70675e,
    skinColor: 0xbf8a63,
    auraColor: 0xffc478,
    hasBench: false,
    greetingLines: [
      'If you ever felt completely spent under a broom tree, pull up a seat with me.',
      'Listen closely—not to thunder, just to the gentle whisper in this breeze.'
    ],
    leafReaction: 'Not in the earthquake, not in the fire—always in the gentle whisper.'
  },
  {
    id: 'isaiah',
    name: 'Prophet Isaiah',
    title: 'Prophet of the High & Lifted Throne — Old Testament',
    category: 'prophet',
    zone: 'Rising Road Approach',
    startNodeId: 'isaiah_1',
    position: [-2.6, 0, -16.6],
    lookAt: [2.8, 0, -16.8],
    partnerId: 'john',
    behavior: 'pair-talk',
    prop: 'scroll',
    hasBeard: true,
    shirtColor: 0xefe7d5,
    vestColor: 0x4b4278, // Royal indigo prophetic robe
    robeLowerColor: 0x3a345c,
    hairColor: 0xbab3a8,
    skinColor: 0xc7926b,
    auraColor: 0xd2c4ff,
    hasBench: false,
    greetingLines: [
      'Once I cried "Woe is me, I am undone." Now I stand in His light and laugh!',
      'Look north toward the Gate—our eyes grow stronger every step we take.'
    ],
    leafReaction: 'The coal touched my lips once; here the whole air heals without burning.'
  }
];

// GTA-Style Living World Organic Eavesdropping Conversations between Saints!
export const AMBIENT_BANTER_PAIRS: AmbientBanterPair[] = [
  {
    id: 'banter-paul-peter',
    speakers: ['paul', 'peter'],
    lines: [
      { speakerId: 'peter', text: 'You still owe me an apology for calling me out in front of everybody at Antioch, Paul.' },
      { speakerId: 'paul', text: 'Ha! You were eating with the Gentiles until James’s men walked in, Cephas—and you know it!' },
      { speakerId: 'peter', text: 'Fair enough. Though admit it—my letters were a lot easier to read than your run-on sentences.' },
      { speakerId: 'paul', text: 'Only because you had the sea breeze in your head and I had three scrolls on my lap! Thank God neither of us had to pass an exam to sit here.' }
    ]
  },
  {
    id: 'banter-moses-elijah',
    speakers: ['moses', 'elijah'],
    lines: [
      { speakerId: 'elijah', text: 'Remember standing on that mountain talking with Him before Jerusalem? I thought my heart would burst.' },
      { speakerId: 'moses', text: 'And Peter immediately offered to build us three tents! Bless that fisherman.' },
      { speakerId: 'elijah', text: 'We both spent a lifetime running across deserts—funny how resting here took longer to learn than fleeing Jezebel.' },
      { speakerId: 'moses', text: 'I only saw Canaan from Nebo, brother. Yet this country makes every mile of Sinai worth it.' }
    ]
  },
  {
    id: 'banter-mara-mary',
    speakers: ['mara', 'mary_magdalene'],
    lines: [
      { speakerId: 'mara', text: 'Did you really think He was the gardener that morning, Mary?' },
      { speakerId: 'mary_magdalene', text: 'My eyes were so swollen with weeping I could barely see. Then He spoke just one word—my name.' },
      { speakerId: 'mara', text: 'That is what undid me at the Eastern Gate too. Hearing my true name with zero condemnation in it.' },
      { speakerId: 'mary_magdalene', text: 'Look at these flowers, Mara—not one of them wilts. The weeping really did last only for a night.' }
    ]
  },
  {
    id: 'banter-john-isaiah',
    speakers: ['john', 'isaiah'],
    lines: [
      { speakerId: 'john', text: 'I kept reaching for earthly jewels on Patmos—jasper, sapphire, pearl—and every word fell short.' },
      { speakerId: 'isaiah', text: 'Tell me about it. When I saw the train of His robe fill the temple, all I could manage was "Woe is me."' },
      { speakerId: 'john', text: 'Yet the same King who shook your doorposts let me lean my head on His chest at supper.' },
      { speakerId: 'isaiah', text: 'Both registers—Elder Brother on a garden bench, and Almighty King across the Sea of Glass.' }
    ]
  }
];

export const DIALOGUES: Record<string, DialogueNode> = {
  // --- AMOS ---
  amos_1: {
    id: 'amos_1',
    speaker: 'Amos',
    role: 'Keeper of the Trees & New Arrivals',
    text: 'Welcome home, friend. Pull up a seat—there is no hurry here. Look around the Terrace: you will hear Paul laughing with Peter by the bridge, Moses and Elijah trading desert stories on the east rise, and David strumming a new song in the meadow. The first thing anyone learns here is how to stop working long enough to be loved.',
    choices: [
      { label: 'Why does the light feel so gentle here compared to the distant City?', nextId: 'amos_banked' },
      { label: 'What is that dark canyon of gray mist off to the east?', nextId: 'amos_mist' },
      { label: 'Take me into Vision #1: Creation ("Let There Be Light").', nextId: null, action: 'vision-creation' },
      { label: 'Thank you, Amos. I want to walk and listen to the saints.', nextId: null, action: 'mark-healed' }
    ]
  },
  amos_banked: {
    id: 'amos_banked',
    speaker: 'Amos',
    role: 'Keeper of the Trees & New Arrivals',
    text: 'A soul born in a cellar cannot walk straight out at noon. So He banks the fire here—turns the glory gentle, like morning in a valley before the sun clears the ridge. Sit with Mara and Mary in the Walled Orchard, listen to the prophets, or walk with Elias by the Golden Pool. As your heart heals, your eyes grow stronger for the Rising Road.',
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
      { label: 'Thank you, Amos. I will sit with that for a moment.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- MARA ---
  mara_1: {
    id: 'mara_1',
    speaker: 'Mara',
    role: 'The Healed — Walled Orchard',
    text: 'When I first arrived on the Terrace, I stood at the very edge of the grass with my arms wrapped tight around myself. I kept telling Amos there had been a mistake—that once the clean light showed what I had been, someone would put a hand on my collar and show me the door. Mary Magdalene sat beside me here until I finally believed I belonged.',
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
    text: 'Feel that? Notice how the saints across the Terrace paused and smiled when the wave passed. Later, when you pass under the Eastern Gate of One Pearl, the keeper does not read a ledger of your failures—he speaks your True Name. It was never ours to earn. It was just for us the whole time.',
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
    text: 'Mine came walking down the road as a song—"Jesus Paid It All." One of the saints knelt right here in the grass and did not argue with a single line of my ledger. She just smiled and said: "No one at that table earned their seat, Thomas. Your forty years were not the payment—they were the thank-you."',
    choices: [
      { label: 'And then the Master came through the garden?', nextId: 'thomas_bench' },
      { label: 'Not the payment—the thank-you. I needed to hear that.', nextId: null, action: 'mark-healed' }
    ]
  },
  thomas_bench: {
    id: 'thomas_bench',
    speaker: 'Rev. Thomas Ainsley',
    role: 'The Striver — Freed from the Ledger',
    text: 'He walked bench to bench on foot, folded Himself right down beside me on this grass, and put His arm around my shoulders. You simply cannot go on believing you owe a debt to Someone sitting beside you calling you friend.',
    choices: [
      { label: 'Thank you, Thomas. Peace to you.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- ELIAS VANCE ---
  elias_1: {
    id: 'elias_1',
    speaker: 'Elias Vance',
    role: 'The Builder — Mentor of Living Memory',
    text: 'Name’s Elias. Built houses for forty years—square corners, plumb walls—and quietly filed Heaven away with the blueprints that never got funded. Worse, after losing my wife Ruth and our little girl Naomi, I built a wall of silence between me and my boy Daniel. They sent me back once, just long enough to answer June and write Daniel the truth in a blunt pencil. Now I’m Home for good.',
    choices: [
      { label: 'Step with me into Vision #2: The Cross ("The Wound That Became a Gate")', nextId: null, action: 'vision-cross' },
      { label: 'Show me Vision #3: "The Boy in the Sawdust" (Ripple Review)', nextId: null, action: 'vision-sawdust' },
      { label: 'Tell me what actually lasts when the houses burn.', nextId: 'elias_sawdust' },
      { label: 'I’ll look into the Golden Pool in a moment, Elias.', nextId: null, action: 'mark-healed' }
    ]
  },
  elias_sawdust: {
    id: 'elias_sawdust',
    speaker: 'Elias Vance',
    role: 'The Builder — Mentor of Living Memory',
    text: 'In my life review, the light did not glance once at a single roof I raised for pride. It showed me a Wednesday fifty years back when a grieving seventeen-year-old boy on my crew sat crying behind stacked lumber. I sat down in the sawdust beside him and forgot it inside a week. The light did not forget. Sitting down beside someone is the only building material that survives the fire.',
    choices: [
      { label: 'Witness "The Boy in the Sawdust" in Living Memory', nextId: null, action: 'vision-sawdust' },
      { label: 'Witness "The Cross — The Wound That Became a Gate"', nextId: null, action: 'vision-cross' },
      { label: 'Thank you, Elias. I will carry that with me.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- PAUL OF TARSUS ---
  paul_1: {
    id: 'paul_1',
    speaker: 'Paul of Tarsus',
    role: 'Apostle of Grace — New Testament',
    text: 'Welcome, brother or sister! People arrive expecting me to lecture them on theology, and the first thing I want to tell them is how wrong I was for half my life. I stood holding the coats while Stephen was stoned, convinced my zeal made me righteous. Then a Light brighter than noon knocked me off my horse—and instead of crushing me, He called me by name and sent me to speak of mercy.',
    choices: [
      { label: 'What surprised you most when you finally arrived here?', nextId: 'paul_2' },
      { label: 'I heard you and Peter joking about Antioch!', nextId: 'paul_peter' },
      { label: 'Thank you, Paul. Grace and peace to you.', nextId: null, action: 'mark-healed' }
    ]
  },
  paul_2: {
    id: 'paul_2',
    speaker: 'Paul of Tarsus',
    role: 'Apostle of Grace — New Testament',
    text: 'I wrote to Corinth that "now we see through a glass darkly, but then face to face." I meant it as poetry—I had no idea how literal the glass was! Every thorn in my flesh, every shipwreck, every cold prison floor in Rome—standing here, it truly feels like a light momentary shadow beside this eternal weight of glory.',
    choices: [
      { label: 'And you met Stephen again here?', nextId: 'paul_stephen' },
      { label: 'Thank you for your honesty, Paul.', nextId: null, action: 'mark-healed' }
    ]
  },
  paul_stephen: {
    id: 'paul_stephen',
    speaker: 'Paul of Tarsus',
    role: 'Apostle of Grace — New Testament',
    text: 'He was one of the very first faces waiting for me on the riverbank! He wrapped his arms around me laughing and said, "Saul, my prayer worked!" That is what Heaven does to earthly guilt—it turns an enemy into a brother.',
    choices: [
      { label: 'That changes how I think about forgiveness.', nextId: null, action: 'mark-healed' }
    ]
  },
  paul_peter: {
    id: 'paul_peter',
    speaker: 'Paul of Tarsus',
    role: 'Apostle of Grace — New Testament',
    text: 'Ah, you overheard us! Good—there are no marble statues up here, only real men and women rescued by the same cross. Peter and I argued fiercely on earth because we both cared deeply and saw in part. Up here, the partial fell away and only the friendship remained.',
    choices: [
      { label: 'I love seeing you two laughing together.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- SIMON PETER ---
  peter_1: {
    id: 'peter_1',
    speaker: 'Simon Peter',
    role: 'The Fisherman Disciple — New Testament',
    text: 'Pull up close, friend! Don’t let the stained-glass windows fool you—I was loud, impulsive, and terrified of looking foolish. The night He needed a single loyal friend, I swore three times by a charcoal fire that I didn’t even know His name. Then the rooster crowed, and I wept like a broken man.',
    choices: [
      { label: 'How did you ever recover from denying Him?', nextId: 'peter_2' },
      { label: 'Do you miss the Sea of Galilee?', nextId: 'peter_sea' },
      { label: 'Good talking with you, Peter.', nextId: null, action: 'mark-healed' }
    ]
  },
  peter_2: {
    id: 'peter_2',
    speaker: 'Simon Peter',
    role: 'The Fisherman Disciple — New Testament',
    text: 'I didn’t recover myself—He came looking for me! Cooked fish over another charcoal fire on the beach so the very smell of my worst failure became the smell of breakfast with my Friend. Three denials, three times He asked, "Do you love Me?" If He had room for a blundering fisherman, I promise you He has room for you.',
    choices: [
      { label: 'That gives me so much hope, Peter.', nextId: null, action: 'mark-healed' }
    ]
  },
  peter_sea: {
    id: 'peter_sea',
    speaker: 'Simon Peter',
    role: 'The Fisherman Disciple — New Testament',
    text: 'Wait until your eyes grow strong enough for the Sapphire Sea of Glass past the Eastern Gate! On Galilee, the storms nearly drowned us. Up there, the entire sea has finally come to rest—still as crystal before the One who told the wind, "Peace, be still."',
    choices: [
      { label: 'I cannot wait to see it.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- MARY MAGDALENE ---
  mary_1: {
    id: 'mary_1',
    speaker: 'Mary Magdalene',
    role: 'First Witness of the Dawn — Disciple',
    text: 'Peace to you in this quiet orchard. I love sitting here with Mara because we both know what it is to carry a name the world whispered with contempt—and then to have Jesus lift our chins and speak our real names with tenderness.',
    choices: [
      { label: 'What was it like seeing Him in the garden at dawn?', nextId: 'mary_2' },
      { label: 'Why do you spend so much time with new arrivals?', nextId: 'mary_3' },
      { label: 'Thank you, Mary.', nextId: null, action: 'mark-healed' }
    ]
  },
  mary_2: {
    id: 'mary_2',
    speaker: 'Mary Magdalene',
    role: 'First Witness of the Dawn — Disciple',
    text: 'I thought everything good in the universe had been buried behind a stone. Even standing two steps from Him, my grief blinded me until He said one single word: "Mary." That is how I know He never forgets the brokenhearted—the very first voice He chose to announce the resurrection was a weeping woman the scholars would not have believed.',
    choices: [
      { label: 'He still meets people in gardens first.', nextId: null, action: 'mark-healed' }
    ]
  },
  mary_3: {
    id: 'mary_3',
    speaker: 'Mary Magdalene',
    role: 'First Witness of the Dawn — Disciple',
    text: 'Because grief makes you think you are alone in the dark. Sometimes the holiest thing you can do for someone arriving from Earth is just hand them a flower that won’t die and wait with them until their breathing slows.',
    choices: [
      { label: 'Thank you for being here, Mary.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- JOHN THE BELOVED ---
  john_1: {
    id: 'john_1',
    speaker: 'John the Beloved',
    role: 'Disciple & Seer of Patmos — New Testament',
    text: 'Stand right here beside Isaiah and look north toward the Eastern Gate. On Patmos, exiled and old, I tried to write down what I was shown—twelve gates of single pearl, streets of pure gold clear as glass, a river proceeding from the Throne. Now I laugh at how small my Greek words were!',
    choices: [
      { label: 'You called yourself "the disciple whom Jesus loved." Why?', nextId: 'john_2' },
      { label: 'What is waiting past that Eastern Gate?', nextId: 'john_3' },
      { label: 'Peace to you, John.', nextId: null, action: 'mark-healed' }
    ]
  },
  john_2: {
    id: 'john_2',
    speaker: 'John the Beloved',
    role: 'Disciple & Seer of Patmos — New Testament',
    text: 'People sometimes think I was bragging—never! I was stunned. Once my brother James and I wanted to call down fire on a village that rejected us. Learning that God IS love—not merely that He shows love now and then—remade my whole soul. Every soul standing on this Terrace is "the disciple whom Jesus loves."',
    choices: [
      { label: 'I will remember that.', nextId: null, action: 'mark-healed' }
    ]
  },
  john_3: {
    id: 'john_3',
    speaker: 'John the Beloved',
    role: 'Disciple & Seer of Patmos — New Testament',
    text: 'Inside the jasper wall, the Gatekeeper speaks your True Name. Beyond it, light shines up from beneath the transparent gold so no one casts a shadow—and at the center, no temple and no sun, because the Lamb Himself is the light of it all.',
    choices: [
      { label: 'Thank you, John.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- KING DAVID ---
  david_1: {
    id: 'david_1',
    speaker: 'King David',
    role: 'Shepherd & Psalmist — Old Testament',
    text: 'Come sit on the grass, friend! Listen to the hills—every meadow blade hums a note I spent forty years trying to catch on a ten-stringed harp. On Earth I knew triumph and I knew terrible failure—hiding in caves, grieving my own sins, crying out in the night, "Have mercy on me, O God."',
    choices: [
      { label: 'How did you write so honestly about despair and still praise?', nextId: 'david_2' },
      { label: 'What is music like here in Heaven?', nextId: 'david_music' },
      { label: 'Play on, David. It is good to hear you.', nextId: null, action: 'mark-healed' }
    ]
  },
  david_2: {
    id: 'david_2',
    speaker: 'King David',
    role: 'Shepherd & Psalmist — Old Testament',
    text: 'Because God never wanted polite masks—He wanted truth in the inward parts! The Psalms were never the songs of a flawless king; they were the honest cries of a shepherd who discovered that a broken and contrite heart He will never despise. Look where that mercy carried me.',
    choices: [
      { label: 'Your honesty kept millions of people from giving up.', nextId: null, action: 'mark-healed' }
    ]
  },
  david_music: {
    id: 'david_music',
    speaker: 'King David',
    role: 'Shepherd & Psalmist — Old Testament',
    text: 'Here, music isn’t just vibration in the air—you can stand inside a chord and understand something true about the mercy of God all at once. Wait until you hear the Voice of Many Waters at the Sea of Glass—and don’t be afraid to add your own note!',
    choices: [
      { label: 'Thank you, David.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- MOSES ---
  moses_1: {
    id: 'moses_1',
    speaker: 'Moses',
    role: 'Shepherd of Sinai — Old Testament',
    text: 'Welcome to the real Promised Land, traveler. I spent forty years in Midian convinced I had ruined my calling with one violent afternoon in Egypt, and another forty years leading weary people through wilderness sand. When I struck the rock in anger, I only got to see Canaan from Mount Nebo.',
    choices: [
      { label: 'Did it hurt to stop at Mount Nebo?', nextId: 'moses_2' },
      { label: 'You once asked God to show you His glory—and now?', nextId: 'moses_glory' },
      { label: 'Peace to you, Moses.', nextId: null, action: 'mark-healed' }
    ]
  },
  moses_2: {
    id: 'moses_2',
    speaker: 'Moses',
    role: 'Shepherd of Sinai — Old Testament',
    text: 'It broke my heart—until the Lord Himself buried me and brought me straight into the country Canaan was only a shadow of! Even better, centuries later He invited Elijah and me onto a Galilean mountaintop to speak with His Son face to face. His mercy is always bigger than our missed turns.',
    choices: [
      { label: 'What a comfort to hear that from you.', nextId: null, action: 'mark-healed' }
    ]
  },
  moses_glory: {
    id: 'moses_glory',
    speaker: 'Moses',
    role: 'Shepherd of Sinai — Old Testament',
    text: 'On Sinai He had to hide me in the cleft of a rock so the full blaze wouldn’t consume me. That is why this Terrace is banked gentle at first—He enlarges your heart step by tender step until you can stand unveiled before the Face we only glimpsed in shadow.',
    choices: [
      { label: 'Thank you, Moses.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- PROPHET ELIJAH ---
  elijah_1: {
    id: 'elijah_1',
    speaker: 'Prophet Elijah',
    role: 'Prophet of the Still Small Voice — Old Testament',
    text: 'Everyone remembers the fire falling on Mount Carmel. Almost nobody wants to talk about the very next day—when I ran into the desert, collapsed under a broom tree, and begged God to let me die because I was utterly spent and sure I was the last faithful soul left.',
    choices: [
      { label: 'How did God answer your exhaustion?', nextId: 'elijah_2' },
      { label: 'Why do you stand near the overlook of the Gray Mist?', nextId: 'elijah_mist' },
      { label: 'Thank you for being so real, Elijah.', nextId: null, action: 'mark-healed' }
    ]
  },
  elijah_2: {
    id: 'elijah_2',
    speaker: 'Prophet Elijah',
    role: 'Prophet of the Still Small Voice — Old Testament',
    text: 'He did not scold me! He sent an angel to bake me warm bread, pour me water, and let me sleep twice. Then on the mountain, He wasn’t in the wind or the earthquake or the fire—He came in a gentle whisper. If you arrived tired from Earth, hear me: God is far kinder to weary people than we ever dared preach.',
    choices: [
      { label: 'Bread, rest, and a whisper. I love that.', nextId: null, action: 'mark-healed' }
    ]
  },
  elijah_mist: {
    id: 'elijah_mist',
    speaker: 'Prophet Elijah',
    role: 'Prophet of the Still Small Voice — Old Testament',
    text: 'Because I spent my life crying out, "How long will you waver between two opinions?" Seeing that open downward trail reminds me of the dignity God gave every human heart: He never drags anyone across the threshold, yet He never closes the gate either.',
    choices: [
      { label: 'Thank you, Elijah.', nextId: null, action: 'mark-healed' }
    ]
  },

  // --- PROPHET ISAIAH ---
  isaiah_1: {
    id: 'isaiah_1',
    speaker: 'Prophet Isaiah',
    role: 'Prophet of the High & Lifted Throne — Old Testament',
    text: 'In the year King Uzziah died, I saw the Lord high and lifted up, and the sheer holiness of Him undid me on the spot. Every prophet thinks he is ready for glory until he stands inside it! Then a seraph touched my lips with a live coal from the altar and said, "Your guilt is taken away."',
    choices: [
      { label: 'You also wrote about the Suffering Servant centuries before the Cross.', nextId: 'isaiah_2' },
      { label: 'What does it feel like seeing the fulfillment here?', nextId: 'isaiah_3' },
      { label: 'Peace to you, Isaiah.', nextId: null, action: 'mark-healed' }
    ]
  },
  isaiah_2: {
    id: 'isaiah_2',
    speaker: 'Prophet Isaiah',
    role: 'Prophet of the High & Lifted Throne — Old Testament',
    text: '"By His stripes we are healed." I wrote those lines trembling, scarcely grasping how the King on the Throne would become the wounded Lamb. Ask Elias to show you Vision #2 in the Golden Pool—when you see the single-pearl gate grown around a wound, you will understand every chapter I wrote.',
    choices: [
      { label: 'I will step into the Cross vision at the Golden Pool.', nextId: null, action: 'mark-healed' }
    ]
  },
  isaiah_3: {
    id: 'isaiah_3',
    speaker: 'Prophet Isaiah',
    role: 'Prophet of the High & Lifted Throne — Old Testament',
    text: 'Every promise I spoke in tears has bloomed in living color—the wilderness blossoming, the lame leaping, and every tear wiped from every face. Go up higher when your eyes are ready, friend.',
    choices: [
      { label: 'Thank you, Isaiah.', nextId: null, action: 'mark-healed' }
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
