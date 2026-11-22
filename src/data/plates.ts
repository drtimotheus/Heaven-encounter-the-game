export interface ReferencePlate {
  id: string;
  number: string;
  title: string;
  zone: string;
  image: string;
  summary: string;
  ue5Notes: string;
}

export const REFERENCE_PLATES: ReferencePlate[] = [
  {
    id: 'plate-01',
    number: 'Plate 01',
    title: 'Macro World Vision & Key Art',
    zone: 'Overall Horizon & City Silhouette',
    image: './plates/Heaven_Image_Cover_Best.jpg',
    summary: 'Bejeweled New Jerusalem walls, cascading turquoise waterfalls, fruit-laden trees, golden inscribed pathways, and joyous fellowship.',
    ue5Notes: 'Macro color-script and distant skyline silhouette framing the horizon from the Terrace Overlook.'
  },
  {
    id: 'plate-02',
    number: 'Plate 02',
    title: 'The Golden Pool of Living Memory',
    zone: 'Zone 5 — Hall of Living Memory',
    image: './plates/C006_S10_5s.jpg',
    summary: 'Rippling circular basin of warm golden liquid light framed by floral-carved stone archways and a central tiered fountain.',
    ue5Notes: 'Animated caustic refraction shader + Lumen emissive basin serving as the tactile portal into Guided 3D Visions.'
  },
  {
    id: 'plate-03',
    number: 'Plate 03',
    title: 'Arrival Meadow Flora & Prismatic Fauna',
    zone: 'Zone 1 — Arrival Meadow',
    image: './plates/C007_I03.jpg',
    summary: 'Sunlit rocks, turquoise waterfalls, iridescent translucent wildflowers, and a hummingbird trailing ribbons of prismatic color.',
    ue5Notes: 'Quixel Megascans rock/foliage base paired with fresnel-iridescence petal shaders, living vertex-spring grass, and Niagara ribbon trails.'
  },
  {
    id: 'plate-04',
    number: 'Plate 04',
    title: 'The Fork & Edge of the Gray Mist',
    zone: 'Zone 1 — "The One Who Ran" (Ch. 4)',
    image: './plates/C007_I04.jpg',
    summary: 'Elevated floral stone road of joyful travelers ascending toward the City contrasted with a lone figure walking down into the Gray Mist by choice.',
    ue5Notes: 'Localized Exponential Height Fog canyon volume; zero physical chains or barriers, preserving visual witness to free will.'
  },
  {
    id: 'plate-05',
    number: 'Plate 05',
    title: 'The Treasuries — Elias & Amos Character Bible',
    zone: 'Zone 6 — The Treasuries',
    image: './plates/C014_I03_Treasury.jpg',
    summary: 'Sun-drenched marble colonnade with crystal-divided bins of living sapphire, gold, and amethyst gems; definitive look for Elias (denim + suspenders) and Amos (olive vest + silver beard).',
    ue5Notes: 'Instanced refractive gem meshes driven by a global Material Parameter Collection for the Chapter 14 "Dimming Gold" event.'
  },
  {
    id: 'plate-06',
    number: 'Plate 06',
    title: 'Riverbank Reunion — Elias & Ruth Vance',
    zone: 'Zone 2/6 — Reunion Meadow',
    image: './plates/C016_I01_Covenant.jpg',
    summary: 'Elias and his restored wife Ruth (chestnut curls, ivory lace, slate-blue shawl) walking hand-in-hand above the river and arched stone bridge.',
    ue5Notes: 'Primary MetaHuman character anchor for Ruth Vance and warm Mediterranean cypress/olive lighting benchmark.'
  },
  {
    id: 'plate-07',
    number: 'Plate 07',
    title: 'The Great Assembly & Wardrobe Bible',
    zone: 'Zone 2 Terrace & Zone 7 Rising Road',
    image: './plates/C016_I02_Assembly.jpg',
    summary: 'Wide golden stone steps overlooking grand aqueducts and waterfalls; diverse saints of every tribe and nation in rich everyday and cultural garments.',
    ue5Notes: 'Core wardrobe rule: grounded, colorful, era-spanning human garments across Zones 1–6 (never generic uniform white sheets).'
  },
  {
    id: 'plate-08',
    number: 'Plate 08',
    title: 'The Eastern Gate of One Pearl',
    zone: 'Zone 7 — Eastern Gate & Vision #2 Motif',
    image: './plates/C016_I04_Pearl_Gate.jpg',
    summary: 'Colossal translucent single-pearl arch grown around a wound, flanked by waterfalls and opening onto a golden tree-lined boulevard.',
    ue5Notes: 'Thin-film mother-of-pearl nacre + subsurface scattering shader; opens into the clear-jasper Hall of True Names.'
  },
  {
    id: 'plate-09',
    number: 'Plate 09',
    title: 'The Street of Transparent Gold',
    zone: 'Zone 7 — Inner City Boulevard',
    image: './plates/C017_I03_Transparent_Gold.jpg',
    summary: 'Elias and Amos marveling at solid, glass-clear golden streets glowing brightly from below with zero dark cast shadows.',
    ue5Notes: 'Dual-layer parallax golden-glass shader with upward-bouncing Lumen emissive GI illuminating characters from underneath.'
  },
  {
    id: 'plate-10',
    number: 'Plate 10',
    title: 'The Most Holy Place',
    zone: 'Zone 7 — Chambers of Light',
    image: './plates/C017_I04_Most_Holy_Place.jpg',
    summary: 'Monumental prismatic crystal-and-gold cathedral sanctuary rising beyond sight, ringed by tiered waterfalls and an iridescent causeway.',
    ue5Notes: 'Nanite gothic-classical filigree towers with prismatic specular reflections and sky-high volumetric light pillar.'
  },
  {
    id: 'plate-11',
    number: 'Plate 11',
    title: 'The Robing Transformation — Five Colors of Heaven',
    zone: 'Zone 7 — Shoreline of the Sea of Glass',
    image: './plates/C017_I06_Elias_Robed.jpg',
    summary: 'Elias clothed in radiant white embroidered with gold filigree and the Five Colors: Gold, Sapphire Blue, Royal Purple, Crimson Red, and Emerald Green.',
    ue5Notes: 'Cloth-simulated ceremonial robe with subtle emissive gold-thread weave unlocked upon reaching the Sea of Glass.'
  },
  {
    id: 'plate-12',
    number: 'Plate 12',
    title: 'The Sapphire Sea of Glass (Crystalline)',
    zone: 'Zone 7 — Arrival at the Sea',
    image: './plates/C017_I07_Sea_of_Glass.jpg',
    summary: 'Vast sapphire expanse showing glowing crystalline refractions beneath the surface, reflecting the golden-ringed Throne Sanctuary.',
    ue5Notes: 'Planar/Lumen reflections layered over deep geometric sapphire parallax with spatialized harp and vocal stems.'
  },
  {
    id: 'plate-13',
    number: 'Plate 13',
    title: 'The Sapphire Sea of Glass (Mirror-Still)',
    zone: 'Zone 7 — Stilled Worship State',
    image: './plates/C017_I07_Sea_of_Glass_v02.jpg',
    summary: 'Unbroken mirror-smooth liquid-glass sapphire reflecting the Throne Sanctuary as all earthly restlessness goes quiet.',
    ue5Notes: 'Dynamic shader blend transitioning smoothly from Plate 12 crystalline shimmer to Plate 13 mirror stillness.'
  },
  {
    id: 'plate-14',
    number: 'Plate 14',
    title: 'Climactic Sequence: "Every Knee"',
    zone: 'Zone 7 — Face to Face (Ch. 24)',
    image: './plates/C018_I03_Every_Knee.jpg',
    summary: 'Uncountable multitude across the mirror-sapphire sea kneeling as one before the rimless personal glory of the Throne.',
    ue5Notes: 'Vertex Animation Texture (VAT) crowd wave synchronized to a gentle bowing curve ("like wheat before one wind").'
  },
  {
    id: 'plate-15',
    number: 'Plate 15',
    title: 'Endgame Finale: "Gathered by the Spirit"',
    zone: 'Zone 7 — The Breath of God (Ch. 25)',
    image: './plates/C018_I04_Gathered_by_the_Spirit.jpg',
    summary: 'Elias and surrounding saints levitating effortlessly barefoot above the sapphire sea, lifted joyfully toward the Throne.',
    ue5Notes: 'Spline-guided zero-gravity float with billowing robe physics and full MetaSounds choral resolution.'
  }
];
