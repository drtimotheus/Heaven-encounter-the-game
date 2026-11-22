import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { SaintProfile } from '../data/dialogues';
import { lookFor, type SaintBody } from './robes';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface CharacterTemplate {
  scene: THREE.Group;
  clips: THREE.AnimationClip[];
}

export interface WorldGraphics {
  quality: GraphicsQuality;
  envMap: THREE.Texture;
  envIntensity: number;
  grass: { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture };
  sand: { map: THREE.Texture; normal: THREE.Texture };
  marble: { map: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture };
  bark: { map: THREE.Texture; normal: THREE.Texture };
  wood: { map: THREE.Texture; normal: THREE.Texture };
  leaf: THREE.Texture;
  waterNormal: THREE.Texture;
  characters: Record<SaintBody, CharacterTemplate>;
  props: {
    grass: THREE.Group;
    flowers: THREE.Group;
    fern: THREE.Group;
    column: THREE.Group;
  };
  linen: { map: THREE.Texture; normal: THREE.Texture };
}

export type { SaintBody };

const QUALITY_KEY = 'he-graphics';

export function defaultGraphicsQuality(): GraphicsQuality {
  const narrow = window.matchMedia('(max-width: 820px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (narrow || coarse) return 'low';
  return 'high';
}

export function loadGraphicsQuality(): GraphicsQuality {
  const saved = localStorage.getItem(QUALITY_KEY);
  if (saved === 'low' || saved === 'medium' || saved === 'high') return saved;
  return defaultGraphicsQuality();
}

export function saveGraphicsQuality(quality: GraphicsQuality): void {
  localStorage.setItem(QUALITY_KEY, quality);
}

export function saintArchetype(profile: SaintProfile): SaintBody {
  return lookFor(profile).body;
}

function loadColor(url: string, repeatX: number, repeatY: number, anisotropy: number): Promise<THREE.Texture> {
  return loadMap(url, repeatX, repeatY, anisotropy, true);
}

function loadData(url: string, repeatX: number, repeatY: number, anisotropy: number): Promise<THREE.Texture> {
  return loadMap(url, repeatX, repeatY, anisotropy, false);
}

function loadMap(
  url: string,
  repeatX: number,
  repeatY: number,
  anisotropy: number,
  srgb: boolean
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
        tex.anisotropy = anisotropy;
        if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

async function loadCharacter(
  url: string,
  renderer: THREE.WebGLRenderer,
  ktx2: KTX2Loader
): Promise<CharacterTemplate> {
  const loader = new GLTFLoader();
  loader.setKTX2Loader(ktx2);
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  gltf.scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
    }
  });
  return { scene: gltf.scene, clips: gltf.animations };
}

export async function loadWorldGraphics(
  renderer: THREE.WebGLRenderer,
  quality: GraphicsQuality
): Promise<WorldGraphics> {
  const anisotropy = quality === 'low' ? 1 : quality === 'medium' ? 4 : 8;
  const ktx2 = new KTX2Loader().setTranscoderPath('/basis/');
  ktx2.detectSupport(renderer);

  const heroLod = quality === 'low' ? 'lod1' : 'lod0';
  const supportLod = 'lod1';
  const hdr = await new RGBELoader().loadAsync('/assets/hdri/kloofendal_1k.hdr');
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(hdr).texture;
  hdr.dispose();
  pmrem.dispose();

  const [grassMap, grassNor, grassRough, sandMap, sandNor, marbleMap, marbleNor, marbleRough, barkMap, barkNor, woodMap, woodNor, leaf, waterNormal, linenMap, linenNor, youth, sturdy, elder, woman, grass, flowers, fern, column] =
    await Promise.all([
      loadColor('/assets/textures/leafy_grass_diff.jpg', 18, 18, anisotropy),
      loadData('/assets/textures/leafy_grass_nor.jpg', 18, 18, anisotropy),
      loadData('/assets/textures/leafy_grass_rough.jpg', 18, 18, anisotropy),
      loadColor('/assets/textures/coast_sand_01_diff.jpg', 10, 10, anisotropy),
      loadData('/assets/textures/coast_sand_01_nor.jpg', 10, 10, anisotropy),
      loadColor('/assets/textures/marble_01_diff.jpg', 2.5, 2.5, anisotropy),
      loadData('/assets/textures/marble_01_nor.jpg', 2.5, 2.5, anisotropy),
      loadData('/assets/textures/marble_01_rough.jpg', 2.5, 2.5, anisotropy),
      loadColor('/assets/textures/bark_willow_diff.jpg', 1.4, 2.2, anisotropy),
      loadData('/assets/textures/bark_willow_nor.jpg', 1.4, 2.2, anisotropy),
      loadColor('/assets/textures/oak_wood_planks_diff.jpg', 2, 1.2, anisotropy),
      loadData('/assets/textures/oak_wood_planks_nor.jpg', 2, 1.2, anisotropy),
      loadColor('/assets/textures/leaf_set.png', 1, 1, anisotropy),
      loadData('/assets/textures/water_ripples.png', 3, 8, anisotropy),
      loadColor('/assets/textures/linen.png', 3, 3, anisotropy),
      loadData('/assets/textures/linen_nor.png', 3, 3, anisotropy),
      loadCharacter(`/assets/characters/casual-walker-${heroLod}.glb`, renderer, ktx2),
      loadCharacter(`/assets/characters/road-worker-${heroLod}.glb`, renderer, ktx2),
      loadCharacter(`/assets/characters/dog-walker-${supportLod}.glb`, renderer, ktx2),
      loadCharacter(`/assets/characters/hiker-${supportLod}.glb`, renderer, ktx2),
      loadProp('/assets/props/seagrass.glb', renderer, ktx2),
      loadProp('/assets/props/wildflower.glb', renderer, ktx2),
      loadProp('/assets/props/fern.glb', renderer, ktx2),
      loadProp('/assets/props/ionic-column.glb', renderer, ktx2)
    ]);

  leaf.colorSpace = THREE.SRGBColorSpace;
  waterNormal.wrapS = waterNormal.wrapT = THREE.RepeatWrapping;

  return {
    quality,
    envMap,
    envIntensity: quality === 'low' ? 0.72 : 0.95,
    grass: { map: grassMap, normal: grassNor, rough: grassRough },
    sand: { map: sandMap, normal: sandNor },
    marble: { map: marbleMap, normal: marbleNor, rough: marbleRough },
    bark: { map: barkMap, normal: barkNor },
    wood: { map: woodMap, normal: woodNor },
    leaf,
    waterNormal,
    characters: { youth, sturdy, elder, woman },
    props: { grass, flowers, fern, column },
    linen: { map: linenMap, normal: linenNor }
  };
}

async function loadProp(url: string, renderer: THREE.WebGLRenderer, ktx2: KTX2Loader): Promise<THREE.Group> {
  const loaded = await loadCharacter(url, renderer, ktx2);
  return loaded.scene;
}
