export interface DialogueChoice {
  label: string;
  nextId: string | null;
  /** complete-fellowship: a testimony branch finished. Pressing E, or saying goodbye on the opening line, does not count. */
  action?: 'breathe-leaves' | 'vision-creation' | 'vision-cross' | 'vision-sawdust' | 'complete-fellowship';
}

/**
 * Timothy's decisions (Nov 22, 2026), held in the playable script.
 * Jesus / the Elder Brother has one approved spoken line, from the novel, and no others.
 * The testimony arc's middle beat is Turning Point. The thief on the cross is Dismas.
 */
export const CANON = {
  elderBrotherLine: 'Peace be unto this house.',
  elderBrotherNote: 'Novel Ch. 12; cf. Luke 10:5. Novel canon, not a KJV quotation.',
  thiefOnTheCross: 'Dismas',
  arcTurningName: 'Turning Point'
} as const;

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
  /** Fringe of hair and a bare crown, instead of a full hair cap. */
  balding?: boolean;
  /** 1 is average height. Paul is short beside the other saints. */
  bodyScale?: number;
  /** Vertical-slice anchors: Paul, Amos, Elias Vance, Mara. */
  demoCast?: 'apostle' | 'guide' | 'narrator' | 'orchard';
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
    demoCast: 'guide',
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
    demoCast: 'orchard',
    hasBench: true,
    benchOffset: [0.3, 0, 1.7],
    greetingLines: [
      'Welcome to the orchard. Come sit under the leaves—the light is gentle here.',
      'There was no mistake. There never is, with Him.'
    ],
    leafReaction: 'The leaves let every memory shine in the light of grace.'
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
    demoCast: 'narrator',
    hasBench: true,
    benchOffset: [-1.5, 0, 0.5],
    greetingLines: [
      'Good to see you, neighbor. I’m sixty-three, and the Golden Pool will keep until you’re ready.',
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
    balding: true,
    bodyScale: 0.76,
    demoCast: 'apostle',
    shirtColor: 0xdfd3be,
    vestColor: 0x7a343b, // Deep crimson mantle
    robeLowerColor: 0x5c4738,
    hairColor: 0x9a9187, // Graying fringe
    skinColor: 0xc7926b,
    auraColor: 0xffc796,
    hasBench: true,
    benchOffset: [1.4, 0, 1.0],
    greetingLines: [
      "Grace and peace to you! Pull up a stone. I'm better at sitting than arguing these days!",
      'Come join us—Cephas and I only compete over who serves the other first.'
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
      { speakerId: 'peter', text: 'Brother, I did write that some things in your letters are hard to be understood.' },
      { speakerId: 'paul', text: "And you called me 'our beloved brother Paul.' I read that part more often!" },
      { speakerId: 'peter', text: 'Antioch was a long time ago.' },
      { speakerId: 'paul', text: 'I withstood you to the face. Now we only compete over who serves the other first.' }
    ]
  },
  {
    id: 'banter-moses-elijah',
    speakers: ['moses', 'elijah'],
    lines: [
      { speakerId: 'elijah', text: 'Remember standing on that mountain talking with Him before Jerusalem? I thought my heart would burst.' },
      { speakerId: 'moses', text: 'And Peter immediately offered to build us three tents! Bless that fisherman.' },
      { speakerId: 'elijah', text: 'We both ran across deserts. Here, every road runs toward Him.' },
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
      { label: 'Thank you, Amos. I want to walk and listen to the saints.', nextId: null }
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
      { label: 'I will explore the Terrace and the Orchard.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  amos_mist: {
    id: 'amos_mist',
    speaker: 'Amos',
    role: 'Keeper of the Trees & New Arrivals',
    text: 'That trail is the honest edge of the country. He compels no one, and the gates are never shut (Rev 21:25). Turn around, friend. Look how much light is facing you.',
    choices: [
      { label: 'That makes the grace here feel even more real.', nextId: 'amos_1', action: 'complete-fellowship' },
      { label: 'Thank you, Amos. I will sit with that for a moment.', nextId: null, action: 'complete-fellowship' }
    ]
  },

  // --- MARA ---
  mara_1: {
    id: 'mara_1',
    speaker: 'Mara',
    role: 'The Healed — Walled Orchard',
    text: "Welcome! I'm the one who used to stand at the edge of the grass, sure there'd been a mistake. (laughs) There wasn't. There never is, with Him. I kept telling Amos the clean light would show what I had been and someone would send me away. Mary Magdalene sat beside me here until I finally believed I belonged.",
    choices: [
      { label: 'What changed for you in this orchard?', nextId: 'mara_leaves' },
      { label: 'Did the leaves erase your memories?', nextId: 'mara_scars' },
      { label: 'I am glad you stayed, Mara.', nextId: null }
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
    text: 'No—and I am grateful they did not. I remember every hard room and every broken year. The leaves let me see every memory the way grace sees it (Rev 22:2). The facts are still true. The sting is gone.',
    choices: [
      { label: 'Breathe the Healing Leaves now', nextId: 'mara_after_leaves', action: 'breathe-leaves' },
      { label: 'Thank you for telling me the truth, Mara.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  mara_after_leaves: {
    id: 'mara_after_leaves',
    speaker: 'Mara',
    role: 'The Healed — Walled Orchard',
    text: 'Feel that? Notice how the saints across the Terrace paused and smiled when the wave passed. Later, when you pass under the Eastern Gate of One Pearl, the keeper does not read a ledger of your failures—he speaks your True Name. It was never ours to earn. It was just for us the whole time.',
    choices: [
      { label: 'Thank you, Mara. My eyes feel clearer already.', nextId: null, action: 'complete-fellowship' }
    ]
  },

  // --- REV. THOMAS AINSLEY ---
  thomas_1: {
    id: 'thomas_1',
    speaker: 'Rev. Thomas Ainsley',
    role: 'The Striver — Freed from the Ledger',
    text: "Ha! Sit, sit. My hands are finally still. I arrived with a ledger, forty years of mission work and a 1961 departure I thought I'd never balance. A whole company came down the road singing 'Jesus Paid It All.'",
    choices: [
      { label: 'How did you finally lay the ledger down?', nextId: 'thomas_song' },
      { label: 'It takes courage to admit hiding inside good work.', nextId: 'thomas_bench' },
      { label: 'Rest easy by the river, Thomas.', nextId: null }
    ]
  },
  thomas_song: {
    id: 'thomas_song',
    speaker: 'Rev. Thomas Ainsley',
    role: 'The Striver — Freed from the Ledger',
    text: 'The company sang "Jesus Paid It All," and someone among them sang Rock of Ages: "Nothing in my hand I bring, Simply to Thy cross I cling." One of the saints knelt right here in the grass and did not argue with a single line of my ledger. She just smiled and said: "No one at that table earned their seat, Thomas. Your forty years were not the payment—they were the thank-you."',
    choices: [
      { label: 'And then the Master came through the garden?', nextId: 'thomas_bench' },
      { label: 'Not the payment—the thank-you. I needed to hear that.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  thomas_bench: {
    id: 'thomas_bench',
    speaker: 'Rev. Thomas Ainsley',
    role: 'The Striver — Freed from the Ledger',
    text: 'He walked bench to bench on foot, folded Himself right down beside me on this grass, and put His arm around my shoulders. You simply cannot go on believing you owe a debt to Someone sitting beside you calling you friend.',
    choices: [
      { label: 'Thank you, Thomas. Peace to you.', nextId: null, action: 'complete-fellowship' }
    ]
  },

  // --- ELIAS VANCE ---
  elias_1: {
    id: 'elias_1',
    speaker: 'Elias Vance',
    role: 'The Builder — Mentor of Living Memory',
    text: 'Name’s Elias. I’m sixty-three. I built houses for forty years—square corners, plumb walls—and quietly filed Heaven away with the blueprints that never got funded. After Ruth and I lost our first baby, the little girl Ruth named Naomi up here, I built a wall of silence for thirty years between me and my boy Daniel. They sent me back once, just long enough to answer June and write Daniel the truth in a blunt pencil. Now I’m Home for good.',
    choices: [
      { label: 'Step with me into Vision #2: The Cross ("The Wound That Became a Gate")', nextId: null, action: 'vision-cross' },
      { label: 'Show me Vision #3: "The Boy in the Sawdust" (Ripple Review)', nextId: null, action: 'vision-sawdust' },
      { label: 'Tell me what actually lasts when the houses burn.', nextId: 'elias_sawdust' },
      { label: 'I’ll look into the Golden Pool in a moment, Elias.', nextId: null }
    ]
  },
  elias_sawdust: {
    id: 'elias_sawdust',
    speaker: 'Elias Vance',
    role: 'The Builder — Mentor of Living Memory',
    text: 'In my life review, the light did not glance once at a single roof I raised for pride. It showed me a Wednesday about forty years back, when a seventeen-year-old boy on my crew sat behind stacked lumber. I sat down in the sawdust beside him and forgot it inside a week. The light did not forget. Sitting down beside someone is the only building material that survives the fire.',
    choices: [
      { label: 'Witness "The Boy in the Sawdust" in Living Memory', nextId: null, action: 'vision-sawdust' },
      { label: 'Witness "The Cross — The Wound That Became a Gate"', nextId: null, action: 'vision-cross' },
      { label: 'Thank you, Elias. I will carry that with me.', nextId: null, action: 'complete-fellowship' }
    ]
  },

  // --- PAUL OF TARSUS ---
  paul_1: {
    id: 'paul_1',
    speaker: 'Paul of Tarsus',
    role: 'Apostle of Grace — New Testament',
    text: 'Welcome, brother or sister! Grace and peace. I stood holding the coats while Stephen was stoned, convinced my zeal made me righteous. Then a light from heaven, above the brightness of the sun, and I fell to the earth. He called me by name and sent me to speak of mercy—and Stephen was one of the first faces waiting for me here. That road was my Turning Point. Grace!',
    choices: [
      { label: 'What surprised you most when you finally arrived here?', nextId: 'paul_2' },
      { label: 'I heard you and Peter joking about Antioch!', nextId: 'paul_peter' },
      { label: 'Thank you, Paul. Grace and peace to you.', nextId: null }
    ]
  },
  paul_2: {
    id: 'paul_2',
    speaker: 'Paul of Tarsus',
    role: 'Apostle of Grace — New Testament',
    text: 'I wrote to Corinth, "For now we see through a glass, darkly; but then face to face." I meant it as poetry—I had no idea how literal the glass was! My thorn, every shipwreck, every cold prison floor in Rome—standing here, it truly feels like a light momentary shadow beside this eternal weight of glory.',
    choices: [
      { label: 'And you met Stephen again here?', nextId: 'paul_stephen' },
      { label: 'Thank you for your honesty, Paul.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  paul_stephen: {
    id: 'paul_stephen',
    speaker: 'Paul of Tarsus',
    role: 'Apostle of Grace — New Testament',
    text: 'He was one of the very first faces waiting for me on the riverbank! He wrapped his arms around me laughing and said, "Saul, my prayer worked!" That is what Heaven does to earthly guilt—it turns an enemy into a brother.',
    choices: [
      { label: 'That changes how I think about forgiveness.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  paul_peter: {
    id: 'paul_peter',
    speaker: 'Paul of Tarsus',
    role: 'Apostle of Grace — New Testament',
    text: 'Ah, you overheard us! Good—there are no marble statues up here, only real men and women rescued by the same cross. Peter and I argued fiercely on earth because we both cared deeply and saw in part. Up here, the partial fell away and only the friendship remained.',
    choices: [
      { label: 'I love seeing you two laughing together.', nextId: null, action: 'complete-fellowship' }
    ]
  },

  // --- SIMON PETER ---
  peter_1: {
    id: 'peter_1',
    speaker: 'Simon Peter',
    role: 'The Fisherman Disciple — New Testament',
    text: 'Pull up close, friend! Don’t let the stained-glass windows fool you—I was loud and impulsive, and I used to hate looking foolish. The night He needed a single loyal friend, I swore three times by a charcoal fire that I didn’t even know His name. Then the rooster crowed, and I went out, and wept bitterly—and then He cooked me breakfast. I’ve been laughing ever since.',
    choices: [
      { label: 'How did you ever recover from denying Him?', nextId: 'peter_2' },
      { label: 'Do you miss the Sea of Galilee?', nextId: 'peter_sea' },
      { label: 'Good talking with you, Peter.', nextId: null }
    ]
  },
  peter_2: {
    id: 'peter_2',
    speaker: 'Simon Peter',
    role: 'The Fisherman Disciple — New Testament',
    text: 'I didn’t recover myself—He came looking for me! He cooked fish over another charcoal fire on the beach, and the smell of that night became the smell of breakfast with my Friend. Three denials, three times He asked, "Lovest thou me?" If He had room for a blundering fisherman, I promise you He has room for you.',
    choices: [
      { label: 'That gives me so much hope, Peter.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  peter_sea: {
    id: 'peter_sea',
    speaker: 'Simon Peter',
    role: 'The Fisherman Disciple — New Testament',
    text: 'Wait until your eyes grow strong enough for the Sapphire Sea of Glass past the Eastern Gate! On Galilee, the storms nearly drowned us. Up there, the entire sea has finally come to rest—still as crystal before the One who told the wind, "Peace, be still."',
    choices: [
      { label: 'I cannot wait to see it.', nextId: null, action: 'complete-fellowship' }
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
      { label: 'Thank you, Mary.', nextId: null }
    ]
  },
  mary_2: {
    id: 'mary_2',
    speaker: 'Mary Magdalene',
    role: 'First Witness of the Dawn — Disciple',
    text: 'I thought everything good in the universe had been buried behind a stone. Even standing two steps from Him, my grief blinded me until He said one single word: "Mary." That is how I know He never forgets the brokenhearted—the very first voice He chose to announce the resurrection was a weeping woman the scholars would not have believed.',
    choices: [
      { label: 'He still meets people in gardens first.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  mary_3: {
    id: 'mary_3',
    speaker: 'Mary Magdalene',
    role: 'First Witness of the Dawn — Disciple',
    text: "Because everyone deserves a welcome. I hand each newcomer a flower that won't wilt and tell them He knows their name.",
    choices: [
      { label: 'Thank you for being here, Mary.', nextId: null, action: 'complete-fellowship' }
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
      { label: 'Peace to you, John.', nextId: null }
    ]
  },
  john_2: {
    id: 'john_2',
    speaker: 'John the Beloved',
    role: 'Disciple & Seer of Patmos — New Testament',
    text: 'People sometimes think I was bragging—never! I was stunned. Once my brother James and I wanted to call down fire on a village that rejected us. Learning that God IS love—not merely that He shows love now and then—remade my whole soul. Every soul standing on this Terrace is "the disciple whom Jesus loves."',
    choices: [
      { label: 'I will remember that.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  john_3: {
    id: 'john_3',
    speaker: 'John the Beloved',
    role: 'Disciple & Seer of Patmos — New Testament',
    text: 'Inside the jasper wall, the Gatekeeper speaks your True Name. Beyond it, light shines up from beneath the transparent gold so no one casts a shadow—and at the center, no temple and no sun, because the Lamb Himself is the light of it all.',
    choices: [
      { label: 'Thank you, John.', nextId: null, action: 'complete-fellowship' }
    ]
  },

  // --- KING DAVID ---
  david_1: {
    id: 'david_1',
    speaker: 'King David',
    role: 'Shepherd & Psalmist — Old Testament',
    text: 'Come sit on the grass, friend! Listen—the hills are already singing, and I get to join them. Every meadow blade hums a note I spent forty years trying to catch on a ten-stringed harp. There were nights on Earth I cried, "Have mercy upon me, O God," and He heard. Look where that mercy carried a shepherd.',
    choices: [
      { label: 'How did honest songs turn into praise?', nextId: 'david_2' },
      { label: 'What is music like here in Heaven?', nextId: 'david_music' },
      { label: 'Play on, David. It is good to hear you.', nextId: null }
    ]
  },
  david_2: {
    id: 'david_2',
    speaker: 'King David',
    role: 'Shepherd & Psalmist — Old Testament',
    text: 'Because God never wanted polite masks—He wanted truth in the inward parts! The Psalms were never the songs of a flawless king; they were the honest cries of a shepherd who discovered that a broken and contrite heart He will never despise. Look where that mercy carried me.',
    choices: [
      { label: 'Your honesty kept millions of people from giving up.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  david_music: {
    id: 'david_music',
    speaker: 'King David',
    role: 'Shepherd & Psalmist — Old Testament',
    text: 'Here, music isn’t just vibration in the air—you can stand inside a chord and understand something true about the mercy of God all at once. Wait until you hear the Voice of Many Waters at the Sea of Glass—and don’t be afraid to add your own note!',
    choices: [
      { label: 'Thank you, David.', nextId: null, action: 'complete-fellowship' }
    ]
  },

  // --- MOSES ---
  moses_1: {
    id: 'moses_1',
    speaker: 'Moses',
    role: 'Shepherd of Sinai — Old Testament',
    text: 'Welcome to the real Promised Land, traveler. I spent forty years in Midian convinced I had ruined my calling with one violent afternoon in Egypt, and another forty years leading weary people through wilderness sand. When I struck the rock in anger, I only got to see Canaan from Mount Nebo.',
    choices: [
      { label: 'What was it like to finally stand in the Promised Land?', nextId: 'moses_2' },
      { label: 'You once asked God to show you His glory—and now?', nextId: 'moses_glory' },
      { label: 'Peace to you, Moses.', nextId: null }
    ]
  },
  moses_2: {
    id: 'moses_2',
    speaker: 'Moses',
    role: 'Shepherd of Sinai — Old Testament',
    text: 'I saw it from Nebo, and then He brought me farther than Canaan ever reached. Centuries later He invited Elijah and me onto a Galilean mountaintop to speak with His Son face to face. His mercy is always bigger than our missed turns.',
    choices: [
      { label: 'What a comfort to hear that from you.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  moses_glory: {
    id: 'moses_glory',
    speaker: 'Moses',
    role: 'Shepherd of Sinai — Old Testament',
    text: 'On Sinai He had to hide me in the cleft of a rock so the full blaze wouldn’t consume me. That is why this Terrace is banked gentle at first—He enlarges your heart step by tender step until you can stand unveiled before the Face we only glimpsed in shadow.',
    choices: [
      { label: 'Thank you, Moses.', nextId: null, action: 'complete-fellowship' }
    ]
  },

  // --- PROPHET ELIJAH ---
  elijah_1: {
    id: 'elijah_1',
    speaker: 'Prophet Elijah',
    role: 'Prophet of the Still Small Voice — Old Testament',
    text: 'Ha! Everyone wants the fire on Carmel. My favorite part is the bread! Pull up a seat and I will tell you about the loaf, the nap, and the whisper.',
    choices: [
      { label: 'How did God answer your exhaustion?', nextId: 'elijah_2' },
      { label: 'Why do you stand near the overlook of the Gray Mist?', nextId: 'elijah_mist' },
      { label: 'Thank you for being so real, Elijah.', nextId: null }
    ]
  },
  elijah_2: {
    id: 'elijah_2',
    speaker: 'Prophet Elijah',
    role: 'Prophet of the Still Small Voice — Old Testament',
    text: 'There was a day on Earth, under a juniper tree, when I requested for myself that I might die (1 Kings 19:4). That day is long past. He did not scold me! He sent an angel to bake me warm bread, pour me water, and let me sleep twice. Then on the mountain, He wasn’t in the wind or the earthquake or the fire—He came in a gentle whisper. The bread is still my favorite part. God is far kinder to weary people than we ever dared preach.',
    choices: [
      { label: 'Bread, rest, and a whisper. I love that.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  elijah_mist: {
    id: 'elijah_mist',
    speaker: 'Prophet Elijah',
    role: 'Prophet of the Still Small Voice — Old Testament',
    text: 'Because I spent my life crying out, "How long will you waver between two opinions?" Seeing that open downward trail reminds me of the dignity God gave every human heart: He never drags anyone across the threshold, yet He never closes the gate either.',
    choices: [
      { label: 'Thank you, Elijah.', nextId: null, action: 'complete-fellowship' }
    ]
  },

  // --- PROPHET ISAIAH ---
  isaiah_1: {
    id: 'isaiah_1',
    speaker: 'Prophet Isaiah',
    role: 'Prophet of the High & Lifted Throne — Old Testament',
    text: 'In the year King Uzziah died, I saw the Lord high and lifted up—and now I laugh in that same light. A seraph touched my lips with a live coal from the altar and said, "thine iniquity is taken away, and thy sin purged."',
    choices: [
      { label: 'You also wrote about the Suffering Servant centuries before the Cross.', nextId: 'isaiah_2' },
      { label: 'What does it feel like seeing the fulfillment here?', nextId: 'isaiah_3' },
      { label: 'Peace to you, Isaiah.', nextId: null }
    ]
  },
  isaiah_2: {
    id: 'isaiah_2',
    speaker: 'Prophet Isaiah',
    role: 'Prophet of the High & Lifted Throne — Old Testament',
    text: 'I wrote it this way: "with his stripes we are healed." I scarcely grasped how the King on the Throne would become the wounded Lamb—and the joy of it still surprises me. Ask Elias to show you Vision #2 in the Golden Pool—when you see the single-pearl gate grown around a wound, you will understand every chapter I wrote.',
    choices: [
      { label: 'I will step into the Cross vision at the Golden Pool.', nextId: null, action: 'complete-fellowship' }
    ]
  },
  isaiah_3: {
    id: 'isaiah_3',
    speaker: 'Prophet Isaiah',
    role: 'Prophet of the High & Lifted Throne — Old Testament',
    text: 'Every promise I spoke in tears has bloomed in living color—the wilderness blossoming, the lame leaping, and every tear wiped from every face. Go up higher when your eyes are ready, friend.',
    choices: [
      { label: 'Thank you, Isaiah.', nextId: null, action: 'complete-fellowship' }
    ]
  },

  // --- ENVIRONMENTAL INTERACTABLES ---
  mist_edge: {
    id: 'mist_edge',
    speaker: 'The Fork & Edge of the Gray Mist',
    role: 'Environmental Reflection — Chapter 4',
    text: 'A narrow trail slopes downward into quiet, shadowless gray mist. There is no locked gate here, no fence, and no angel blocking the descent. Heaven compels no one—for love forced against the grain of a heart would not be love. Behind you, the sunlit road to the City stands forever open.',
    choices: [
      { label: 'Turn back toward the sunlit Terrace', nextId: null }
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
  overlook_locked: {
    id: 'overlook_locked',
    speaker: 'The Rising Road Overlook',
    role: 'Eyes Still Growing',
    text: "The light ahead is bright. Sit a while longer on the Terrace; it'll be ready for you.",
    choices: [
      { label: 'Return to the saints on the Terrace', nextId: null }
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

/** Problems if the vertical-slice cast or the joy / KJV guardrails slip. */
export function auditDialogueCanon(): string[] {
  const problems: string[] = [];
  const byId = new Map(SAINTS.map((s) => [s.id, s]));
  const paul = byId.get('paul');
  const amos = byId.get('amos');
  const elias = byId.get('elias');
  const mara = byId.get('mara');
  if (!paul?.balding || paul.hairColor !== 0x9a9187 || paul.demoCast !== 'apostle') {
    problems.push('Paul must be the short, balding, gray-fringe demo apostle');
  }
  if (amos?.demoCast !== 'guide' || !DIALOGUES.amos_1.choices.some((c) => c.action === 'vision-creation')) {
    problems.push('Amos must guide Vision #1 (Creation)');
  }
  if (elias?.demoCast !== 'narrator') problems.push('Elias Vance must be the narrator');
  const eliasStartsVision = [...DIALOGUES.elias_1.choices, ...DIALOGUES.elias_sawdust.choices].some(
    (c) => c.action === 'vision-cross' || c.action === 'vision-sawdust'
  );
  if (!eliasStartsVision) problems.push('Elias must lead the Cross and Sawdust visions');
  if (mara?.demoCast !== 'orchard' || !DIALOGUES.mara_leaves.choices.some((c) => c.action === 'breathe-leaves')) {
    problems.push('Mara must offer the orchard Healing Leaves');
  }
  if (CANON.elderBrotherLine !== 'Peace be unto this house.') problems.push('Elder Brother line drifted');
  if (CANON.thiefOnTheCross !== 'Dismas') problems.push('The thief on the cross is Dismas');
  if (CANON.arcTurningName !== 'Turning Point') problems.push('The arc beat is Turning Point');

  const blob = JSON.stringify(DIALOGUES) + JSON.stringify(AMBIENT_BANTER_PAIRS) + JSON.stringify(SAINTS);
  const forbidden = [
    'Breaking Point',
    'fifty years',
    '1970',
    'our little girl',
    'my horse',
    'off my horse',
    'Every thorn',
    'Do you love Me',
    'By His stripes',
    'Your guilt is taken away',
    'Have mercy on me, O God',
    'owe me an apology',
    'run-on sentences',
    'hardest sight in all of Heaven',
    'bleeding wound',
    'It broke my heart',
    'begged God to let me die',
    'glass darkly',
    'Did it hurt to stop'
  ];
  for (const phrase of forbidden) {
    if (blob.includes(phrase)) problems.push(`Forbidden phrase still in script: ${phrase}`);
  }
  if (/\bthief\b/i.test(blob) && !blob.includes(CANON.thiefOnTheCross)) {
    problems.push('A thief is named without using Dismas');
  }
  for (const node of Object.values(DIALOGUES)) {
    if ((node.speaker === 'Jesus' || node.speaker === 'Elder Brother') && node.text !== CANON.elderBrotherLine) {
      problems.push(`Divine speech must stay "${CANON.elderBrotherLine}"`);
    }
  }
  return problems;
}
