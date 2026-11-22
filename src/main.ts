import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { TerraceWorld, InteractablePoint } from './world/TerraceWorld';
import { GraphicsQuality, loadGraphicsQuality, saveGraphicsQuality } from './world/graphics';
import { buildHeavenEnvironmentMap } from './world/ProceduralTextures';
import { GuidedVisionController, VisionKind } from './world/GuidedVisions';
import { DIALOGUES, DialogueChoice, DialogueNode, auditDialogueCanon } from './data/dialogues';
import { REFERENCE_PLATES } from './data/plates';
import { HeavenlySoundscape } from './audio/Soundscape';

// --- Renderer, Scene, Camera, Post-Processing ---
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xf5e5c4, 0.0072);
scene.environment = buildHeavenEnvironmentMap(renderer);
scene.environmentIntensity = 0.85;

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 380);

let graphicsQuality: GraphicsQuality = loadGraphicsQuality();
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.28,
  0.6,
  0.82
);
let composer = new EffectComposer(renderer);

function rebuildComposer(): void {
  const pixelCap = graphicsQuality === 'high' ? 1.75 : graphicsQuality === 'medium' ? 1.25 : 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelCap));
  composer = new EffectComposer(renderer);
  // SSAOPass only blends occlusion onto an existing beauty buffer.
  composer.addPass(new RenderPass(scene, camera));
  if (graphicsQuality !== 'low') {
    const ssao = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    ssao.kernelRadius = graphicsQuality === 'high' ? 8 : 5;
    ssao.minDistance = 0.0015;
    ssao.maxDistance = 0.08;
    composer.addPass(ssao);
  }
  if (graphicsQuality === 'high') {
    composer.addPass(new BokehPass(scene, camera, { focus: 9.5, aperture: 0.00005, maxblur: 0.0035 }));
  }
  bloomPass.strength = graphicsQuality === 'low' ? 0.12 : 0.18;
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  composer.setSize(window.innerWidth, window.innerHeight);
}

// --- World & Visions ---
const terrace = new TerraceWorld();
scene.add(terrace.group);

const visions = new GuidedVisionController();
scene.add(visions.group);

const soundscape = new HeavenlySoundscape();

// --- Game State ---
type Mode = 'title' | 'explore' | 'dialogue' | 'vision';
let mode: Mode = 'title';

const playerPos = new THREE.Vector3(0, 1.75, 13.5);
let yaw = 0; // looking north (-Z) toward Terrace & Pearl Gate
let pitch = -0.04;
let activeInteractable: InteractablePoint | null = null;
let currentDialogue: DialogueNode | null = null;
let choiceFocus = 0;

// Seated camera smoothing
let seatTargetPos: THREE.Vector3 | null = null;
let seatTargetLook: THREE.Vector3 | null = null;
let savedExplorePos = new THREE.Vector3();

// Diegetic "Growing Eyes" Milestones
const eyesProgress = {
  fellowship: false,
  leaves: false,
  vision: false
};

function eyesCount(): number {
  return (eyesProgress.fellowship ? 1 : 0) + (eyesProgress.leaves ? 1 : 0) + (eyesProgress.vision ? 1 : 0);
}

const canonProblems = auditDialogueCanon();
if (canonProblems.length) {
  console.error('Heaven Encounter canon audit:', canonProblems);
}

type AccessSettings = {
  reduceGlow: boolean;
  lookSensitivity: number;
  textScale: number;
  subtitleBg: boolean;
};

const access: AccessSettings = {
  reduceGlow: false,
  lookSensitivity: 1,
  textScale: 1,
  subtitleBg: true
};

function baseBloom(): number {
  const qualityBloom = graphicsQuality === 'low' ? 0.12 : graphicsQuality === 'medium' ? 0.18 : 0.22;
  return access.reduceGlow ? qualityBloom * 0.45 : qualityBloom;
}

function loadAccess(): void {
  try {
    const raw = localStorage.getItem('he-access');
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<AccessSettings>;
    if (typeof saved.reduceGlow === 'boolean') access.reduceGlow = saved.reduceGlow;
    if (typeof saved.lookSensitivity === 'number') access.lookSensitivity = saved.lookSensitivity;
    if (typeof saved.textScale === 'number') access.textScale = saved.textScale;
    if (typeof saved.subtitleBg === 'boolean') access.subtitleBg = saved.subtitleBg;
  } catch {
    /* keep defaults */
  }
}

function applyAccess(): void {
  document.documentElement.style.setProperty('--text-scale', String(access.textScale));
  document.body.classList.toggle('reduce-glow', access.reduceGlow);
  document.body.classList.toggle('subtitle-bg', access.subtitleBg);
  document.body.classList.toggle('subtitle-plain', !access.subtitleBg);
  visions.setReduceGlow(access.reduceGlow);
  if (mode !== 'vision') bloomPass.strength = baseBloom();
  const glowToggle = document.getElementById('opt-reduce-glow') as HTMLInputElement | null;
  const sens = document.getElementById('opt-sensitivity') as HTMLInputElement | null;
  const sensLabel = document.getElementById('opt-sensitivity-value');
  const subs = document.getElementById('opt-subtitles') as HTMLInputElement | null;
  if (glowToggle) glowToggle.checked = access.reduceGlow;
  if (sens) sens.value = String(access.lookSensitivity);
  if (sensLabel) sensLabel.textContent = access.lookSensitivity.toFixed(2);
  if (subs) subs.checked = access.subtitleBg;
  document.querySelectorAll<HTMLButtonElement>('[data-text-scale]').forEach((btn) => {
    btn.classList.toggle('is-selected', Number(btn.dataset.textScale) === access.textScale);
  });
}

function saveAccess(): void {
  localStorage.setItem('he-access', JSON.stringify(access));
  applyAccess();
}

// --- DOM References ---
const titleScreen = document.getElementById('title-screen')!;
const hud = document.getElementById('hud')!;
const controlsBar = document.getElementById('controls-bar')!;
const zoneNameEl = document.getElementById('zone-name')!;
const gloryVeil = document.getElementById('glory-veil')!;
const whisperBanner = document.getElementById('whisper-banner')!;
const interactPrompt = document.getElementById('interact-prompt')!;
const promptLabel = document.getElementById('prompt-label')!;
const promptSublabel = document.getElementById('prompt-sublabel')!;
const dialoguePanel = document.getElementById('dialogue-panel')!;
const dlgSpeaker = document.getElementById('dlg-speaker')!;
const dlgRole = document.getElementById('dlg-role')!;
const dlgText = document.getElementById('dlg-text')!;
const dlgChoices = document.getElementById('dlg-choices')!;
const visionHud = document.getElementById('vision-hud')!;
const visionTitle = document.getElementById('vision-title')!;
const visionSpeaker = document.getElementById('vision-speaker')!;
const visionCaption = document.getElementById('vision-caption')!;
const visionProgressFill = document.getElementById('vision-progress-fill')!;

const placesModal = document.getElementById('places-modal')!;
const artBibleModal = document.getElementById('art-bible-modal')!;
const roadmapModal = document.getElementById('roadmap-modal')!;
const lightbox = document.getElementById('lightbox')!;
const wispLayer = document.getElementById('wisp-layer')!;

// Pre-create reusable DOM wisp elements for each living Saint
const wispEls = new Map<string, HTMLDivElement>();
terrace.saintAgents.forEach((agent, id) => {
  const el = document.createElement('div');
  el.className = 'saint-wisp hidden';
  el.innerHTML = `<span class="saint-wisp-name">${agent.profile.name}</span><span class="saint-wisp-text"></span>`;
  wispLayer.appendChild(el);
  wispEls.set(id, el);
});
const tempProj = new THREE.Vector3();

let whisperTimeout: number | undefined;
function showWhisper(text: string, durationMs = 5200): void {
  whisperBanner.textContent = text;
  whisperBanner.classList.remove('hidden');
  window.clearTimeout(whisperTimeout);
  whisperTimeout = window.setTimeout(() => {
    whisperBanner.classList.add('hidden');
  }, durationMs);
}

function updateEyesUI(): void {
  document.getElementById('eye-fellowship')?.classList.toggle('opened', eyesProgress.fellowship);
  document.getElementById('eye-leaves')?.classList.toggle('opened', eyesProgress.leaves);
  document.getElementById('eye-vision')?.classList.toggle('opened', eyesProgress.vision);
  document.getElementById('btn-place-overlook')?.classList.toggle('hidden', eyesCount() < 2);
}

function setMode(next: Mode): void {
  mode = next;
  document.body.dataset.mode = next;
}

// --- Build Visual Art Bible Gallery (All 15 Reference Plates) ---
const platesGrid = document.getElementById('plates-grid')!;
REFERENCE_PLATES.forEach((plate) => {
  const card = document.createElement('article');
  card.className = 'plate-card';
  const safeAlt = plate.title.replace(/"/g, '&quot;');
  card.innerHTML = `
    <img src="${plate.image}" alt="${safeAlt}" loading="lazy" />
    <div class="plate-info">
      <div class="plate-num">${plate.number} · ${plate.zone}</div>
      <h3>${plate.title}</h3>
      <p>${plate.summary}</p>
    </div>
  `;
  card.addEventListener('click', () => {
    (document.getElementById('lb-img') as HTMLImageElement).src = plate.image;
    (document.getElementById('lb-img') as HTMLImageElement).alt = plate.title;
    document.getElementById('lb-num')!.textContent = plate.number;
    document.getElementById('lb-title')!.textContent = plate.title;
    document.getElementById('lb-zone')!.textContent = plate.zone;
    document.getElementById('lb-summary')!.textContent = plate.summary;
    document.getElementById('lb-ue5')!.textContent = `UE5 Look-Dev: ${plate.ue5Notes}`;
    lightbox.classList.remove('hidden');
  });
  platesGrid.appendChild(card);
});

// --- Input Controls (WASD / Arrows + Drag-Look) ---
const keys = new Set<string>();
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys.add(k);

  if (mode === 'explore' && k === 'e' && activeInteractable) {
    e.preventDefault();
    triggerInteraction(activeInteractable);
  } else if (mode === 'dialogue') {
    if (k === 'escape') {
      closeDialogue();
    } else if (k === 'arrowdown' || k === 'arrowup' || k === 'tab') {
      e.preventDefault();
      const backward = k === 'arrowup' || (k === 'tab' && e.shiftKey);
      moveChoiceFocus(backward ? -1 : 1);
    } else if ((k === 'enter' || k === ' ') && currentDialogue) {
      e.preventDefault();
      const choice = currentDialogue.choices[choiceFocus];
      if (choice) handleChoice(choice);
    } else if (currentDialogue && ['1', '2', '3', '4'].includes(k)) {
      const idx = parseInt(k, 10) - 1;
      const choice = currentDialogue.choices[idx];
      if (choice) handleChoice(choice);
    }
  } else if (mode === 'vision' && k === 'escape') {
    exitVision();
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

canvas.addEventListener('mousedown', (e) => {
  if (mode === 'explore' || mode === 'vision') {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

function applyLook(dx: number, dy: number, scaleX: number, scaleY: number): void {
  const sens = access.lookSensitivity;
  yaw -= dx * scaleX * sens;
  pitch = THREE.MathUtils.clamp(pitch - dy * scaleY * sens, -1.05, 1.05);
}

window.addEventListener('mousemove', (e) => {
  if (!isDragging || (mode !== 'explore' && mode !== 'vision')) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  applyLook(dx, dy, 0.0042, 0.0035);
});

// Touch look support
let lastTouchX = 0;
let lastTouchY = 0;
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  }
}, { passive: true });
canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1 && (mode === 'explore' || mode === 'vision')) {
    const dx = e.touches[0].clientX - lastTouchX;
    const dy = e.touches[0].clientY - lastTouchY;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
    applyLook(dx, dy, 0.005, 0.004);
  }
}, { passive: true });

// On-screen walk stick for phones. Camera look stays a drag on the canvas.
const stick = { x: 0, y: 0 };
const joystick = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystick-knob');
const STICK_RADIUS = 46;
let stickPointer: number | null = null;

function setStickFromEvent(clientX: number, clientY: number): void {
  if (!joystick) return;
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const len = Math.hypot(dx, dy) || 1;
  const clamped = Math.min(STICK_RADIUS, len);
  dx = (dx / len) * clamped;
  dy = (dy / len) * clamped;
  stick.x = dx / STICK_RADIUS;
  stick.y = dy / STICK_RADIUS;
  if (joystickKnob) joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
}

function resetStick(): void {
  stick.x = 0;
  stick.y = 0;
  stickPointer = null;
  if (joystickKnob) joystickKnob.style.transform = 'translate(0px, 0px)';
}

joystick?.addEventListener('pointerdown', (e) => {
  stickPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  setStickFromEvent(e.clientX, e.clientY);
  e.preventDefault();
});
joystick?.addEventListener('pointermove', (e) => {
  if (stickPointer !== e.pointerId) return;
  setStickFromEvent(e.clientX, e.clientY);
});
joystick?.addEventListener('pointerup', resetStick);
joystick?.addEventListener('pointercancel', resetStick);

const gamepadMove = new THREE.Vector2();
let gamepadLatch = false;

function pollGamepad(): void {
  gamepadMove.set(0, 0);
  const pads = navigator.getGamepads?.();
  if (!pads) return;
  let pad: Gamepad | null = null;
  for (const candidate of pads) {
    if (candidate) pad = candidate;
  }
  if (!pad) return;
  const dead = 0.2;
  const ax = Math.abs(pad.axes[0] || 0) > dead ? pad.axes[0] : 0;
  const ay = Math.abs(pad.axes[1] || 0) > dead ? pad.axes[1] : 0;
  gamepadMove.set(ax, ay);
  const lx = Math.abs(pad.axes[2] || 0) > dead ? pad.axes[2] : 0;
  const ly = Math.abs(pad.axes[3] || 0) > dead ? pad.axes[3] : 0;
  if (mode === 'explore' || mode === 'vision') {
    applyLook(lx, ly, 1.8, 1.2);
  }
  const pressed = Boolean(pad.buttons[0]?.pressed);
  if (pressed && !gamepadLatch) {
    if (mode === 'explore' && activeInteractable) triggerInteraction(activeInteractable);
    else if (mode === 'dialogue' && currentDialogue) {
      const choice = currentDialogue.choices[choiceFocus];
      if (choice) handleChoice(choice);
    }
  }
  gamepadLatch = pressed;
}

// --- Interaction, Dialogue & Guided Vision Flows ---
function triggerInteraction(point: InteractablePoint): void {
  soundscape.playChime(point.type === 'leaves' ? 'leaves' : 'interact');

  if (point.type === 'overlook' && eyesCount() < 2) {
    openDialogue('overlook_locked');
    return;
  }

  if (point.type === 'leaves') {
    breatheHealingLeaves();
  }

  if (point.type === 'saint') {
    terrace.setActiveSaintConversation(point.id);
  }

  if (point.seatPos && point.seatLookAt) {
    savedExplorePos.copy(playerPos);
    seatTargetPos = point.seatPos.clone();
    seatTargetLook = point.seatLookAt.clone();
  } else {
    seatTargetPos = null;
    seatTargetLook = null;
  }

  openDialogue(point.dialogueId);
}

function breatheHealingLeaves(): void {
  eyesProgress.leaves = true;
  updateEyesUI();
  terrace.triggerHealingLeafWave(playerPos.clone());
  soundscape.playChime('leaves');
  gloryVeil.style.opacity = access.reduceGlow ? '0.1' : '0.22';
  window.setTimeout(() => {
    gloryVeil.style.opacity = '0';
  }, 900);
  showWhisper('You breathe the leaves of the Tree of Life. Every memory shines in the light of grace.');
}

function openDialogue(nodeId: string): void {
  const node = DIALOGUES[nodeId];
  if (!node) {
    closeDialogue();
    return;
  }
  currentDialogue = node;
  setMode('dialogue');
  interactPrompt.classList.add('hidden');
  dialoguePanel.classList.remove('hidden');

  dlgSpeaker.textContent = node.speaker;
  dlgRole.textContent = node.role;
  dlgText.textContent = node.text;
  dlgChoices.innerHTML = '';

  node.choices.forEach((choice, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.type = 'button';
    btn.textContent = `${idx + 1}. ${choice.label}`;
    btn.addEventListener('click', () => handleChoice(choice));
    btn.addEventListener('focus', () => {
      choiceFocus = idx;
    });
    dlgChoices.appendChild(btn);
  });
  choiceFocus = 0;
  const firstChoice = dlgChoices.querySelector('button');
  if (firstChoice instanceof HTMLButtonElement) firstChoice.focus();
}

function moveChoiceFocus(delta: number): void {
  const buttons = [...dlgChoices.querySelectorAll('button')];
  if (!buttons.length) return;
  choiceFocus = (choiceFocus + delta + buttons.length) % buttons.length;
  const target = buttons[choiceFocus];
  if (target instanceof HTMLButtonElement) target.focus();
}

function handleChoice(choice: DialogueChoice): void {
  if (choice.action === 'breathe-leaves') {
    breatheHealingLeaves();
  } else if (choice.action === 'complete-fellowship') {
    const before = eyesCount();
    eyesProgress.fellowship = true;
    updateEyesUI();
    if (before < 2 && eyesCount() >= 2) {
      showWhisper('Your eyes have grown for greater glory. The Rising Road Overlook to the north now stands clear.');
    }
  } else if (choice.action === 'vision-creation') {
    closeDialogue();
    startVision('creation');
    return;
  } else if (choice.action === 'vision-cross') {
    closeDialogue();
    startVision('cross');
    return;
  } else if (choice.action === 'vision-sawdust') {
    closeDialogue();
    startVision('sawdust');
    return;
  }

  if (choice.nextId) {
    openDialogue(choice.nextId);
  } else {
    closeDialogue();
  }
}

function closeDialogue(): void {
  dialoguePanel.classList.add('hidden');
  currentDialogue = null;
  terrace.setActiveSaintConversation(null);
  if (seatTargetPos) {
    playerPos.copy(savedExplorePos);
    seatTargetPos = null;
    seatTargetLook = null;
  }
  setMode('explore');
}

function startVision(kind: VisionKind): void {
  gloryVeil.style.opacity = access.reduceGlow ? '0.35' : '0.62';
  soundscape.playChime('vision-start');

  window.setTimeout(() => {
    setMode('vision');
    terrace.group.visible = false;
    scene.fog = null;
    const spec = visions.start(kind);
    visionTitle.textContent = spec.title;
    visionProgressFill.style.width = '0%';
    hud.classList.add('hidden');
    controlsBar.classList.add('hidden');
    interactPrompt.classList.add('hidden');
    visionHud.classList.remove('hidden');
    camera.position.set(0, 1.6, 4);
    yaw = 0;
    pitch = 0.08;
    bloomPass.strength = access.reduceGlow ? 0.08 : 0.16;

    gloryVeil.style.opacity = '0';
  }, 550);
}

function exitVision(): void {
  gloryVeil.style.opacity = '0.92';
  eyesProgress.vision = true;
  updateEyesUI();

  window.setTimeout(() => {
    visions.stop();
    terrace.group.visible = true;
    scene.fog = new THREE.FogExp2(0xf7ead0, 0.0062);
    scene.background = null;
    bloomPass.strength = baseBloom();
    visionHud.classList.add('hidden');
    hud.classList.remove('hidden');
    controlsBar.classList.remove('hidden');
    setMode('explore');
    gloryVeil.style.opacity = '0';

    if (eyesCount() >= 2) {
      showWhisper('Your eyes have grown for greater glory. The Rising Road Overlook to the north now stands clear.');
    } else {
      showWhisper('You return to the sunlit Terrace, carrying the memory with you.');
    }
  }, 550);
}

// --- UI Button Wiring ---
document.getElementById('btn-play')!.addEventListener('click', () => {
  soundscape.init();
  soundscape.playChime('stillness');
  titleScreen.classList.remove('active');
  titleScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  controlsBar.classList.remove('hidden');
  setMode('explore');
  showWhisper('Walk gently. Amos waits just ahead on the sunlit Terrace. Mara keeps the orchard, Elias the Pool, and Paul is by the bridge.');
});

document.getElementById('btn-menu')!.addEventListener('click', () => {
  closeDialogue();
  if (visions.isActive()) exitVision();
  hud.classList.add('hidden');
  controlsBar.classList.add('hidden');
  interactPrompt.classList.add('hidden');
  titleScreen.classList.remove('hidden');
  titleScreen.classList.add('active');
  setMode('title');
});

document.getElementById('btn-mute')!.addEventListener('click', (e) => {
  soundscape.init();
  const muted = soundscape.toggleMute();
  (e.currentTarget as HTMLButtonElement).textContent = muted ? 'Sound: Off' : 'Sound: On';
});

document.getElementById('btn-close-dlg')!.addEventListener('click', closeDialogue);
document.getElementById('btn-exit-vision')!.addEventListener('click', exitVision);
interactPrompt.addEventListener('click', () => {
  if (mode === 'explore' && activeInteractable) triggerInteraction(activeInteractable);
});

document.getElementById('btn-guide')!.addEventListener('click', () => placesModal.classList.remove('hidden'));
document.getElementById('btn-art-bible')!.addEventListener('click', () => artBibleModal.classList.remove('hidden'));
document.getElementById('btn-art-bible-title')!.addEventListener('click', () => artBibleModal.classList.remove('hidden'));
document.getElementById('btn-roadmap-title')!.addEventListener('click', () => roadmapModal.classList.remove('hidden'));
document.getElementById('btn-close-lightbox')!.addEventListener('click', () => lightbox.classList.add('hidden'));

document.querySelectorAll('.modal-close').forEach((btn) => {
  btn.addEventListener('click', () => {
    placesModal.classList.add('hidden');
    artBibleModal.classList.add('hidden');
    roadmapModal.classList.add('hidden');
    document.getElementById('access-modal')?.classList.add('hidden');
  });
});

// Teleport shortcuts in Places Drawer
const TELEPORTS: Record<string, { x: number; z: number; yaw: number }> = {
  amos: { x: 0, z: 11, yaw: 0.25 },
  orchard: { x: -11.5, z: -6.5, yaw: 1.2 },
  pool: { x: 10.5, z: -6.0, yaw: -0.75 },
  mist: { x: 17.5, z: 4.5, yaw: -1.4 },
  overlook: { x: 0, z: -23.5, yaw: 0 },
  paul_peter: { x: 4.1, z: 4.4, yaw: 0.05 },
  david: { x: -5.4, z: 9.6, yaw: 0.85 },
  moses_elijah: { x: 11.4, z: 8.6, yaw: -0.05 },
  john_isaiah: { x: 0.1, z: -13.6, yaw: 0.0 }
};

function placePlayer(x: number, z: number, faceX?: number, faceZ?: number, fixedYaw?: number): void {
  playerPos.set(x, terrace.getGroundHeight(x, z) + 1.72, z);
  if (faceX !== undefined && faceZ !== undefined) {
    yaw = Math.atan2(-(faceX - x), -(faceZ - z));
  } else if (fixedYaw !== undefined) {
    yaw = fixedYaw;
  }
  pitch = -0.08;
  soundscape.playChime('stillness');
}

/** Stand inside the saint's interact radius, facing them. */
function teleportBeside(saintId: string, offsetX: number, offsetZ: number): void {
  const agent = terrace.saintAgents.get(saintId);
  if (!agent) return;
  const p = agent.group.position;
  placePlayer(p.x + offsetX, p.z + offsetZ, p.x, p.z);
}

document.querySelectorAll<HTMLButtonElement>('.place-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.teleport || 'amos';
    if (key === 'overlook' && eyesCount() < 2) {
      showWhisper("The light ahead is bright. Sit a while longer on the Terrace; it'll be ready for you.");
      placesModal.classList.add('hidden');
      return;
    }
    if (key === 'amos') {
      teleportBeside('amos', 1.35, 1.45);
    } else if (key === 'orchard') {
      // West and south of Mara, outside Mary Magdalene's radius.
      teleportBeside('mara', -1.55, -1.15);
    } else {
      const dest = TELEPORTS[key];
      if (dest) placePlayer(dest.x, dest.z, undefined, undefined, dest.yaw);
    }
    placesModal.classList.add('hidden');
  });
});

// --- Zone Detection Helper ---
function updateZoneIndicator(): void {
  let label = 'Zone 2 — The Terrace of New Arrivals';
  if (playerPos.x > 16.5) {
    label = 'Zone 1 — The Fork & Edge of the Gray Mist';
  } else if (playerPos.x < -8.5 && playerPos.z < 1) {
    label = 'Zone 3 — The Walled Orchard';
  } else if (playerPos.x > 8.5 && playerPos.z < -4) {
    label = 'Zone 5 — The Golden Pool of Living Memory';
  } else if (playerPos.z < -21) {
    label = 'Zone 7 — The Rising Road Overlook';
  } else if (playerPos.z > 10) {
    label = 'Zone 1 — The Arrival Meadow';
  }
  zoneNameEl.textContent = label;
}

// --- Main Loop ---
const clock = new THREE.Clock();
let gloryWarnCooldown = 0;
let davidHarpCooldown = 0;

function updateAmbientWisps(): void {
  const showWisps = mode === 'explore';
  terrace.saintAgents.forEach((agent, id) => {
    const el = wispEls.get(id);
    if (!el) return;
    if (!showWisps || !agent.activeWispText) {
      el.classList.add('hidden');
      return;
    }

    const dist = agent.group.position.distanceTo(playerPos);
    if (dist > 16.5) {
      el.classList.add('hidden');
      return;
    }

    agent.getHeadWorldPos(tempProj);
    tempProj.project(camera);

    // Only display if in front of the camera and inside viewport
    if (tempProj.z < -1 || tempProj.z > 1 || Math.abs(tempProj.x) > 0.94 || Math.abs(tempProj.y) > 0.88) {
      el.classList.add('hidden');
      return;
    }

    const sx = (tempProj.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-tempProj.y * 0.5 + 0.5) * window.innerHeight;
    el.style.left = `${sx}px`;
    el.style.top = `${sy}px`;
    el.style.opacity = String(THREE.MathUtils.clamp(1.25 - dist / 16.5, 0.35, 0.98));
    const textEl = el.querySelector('.saint-wisp-text');
    if (textEl && textEl.textContent !== agent.activeWispText) {
      textEl.textContent = agent.activeWispText;
    }
    el.classList.remove('hidden');
  });
}

function animate(): void {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  pollGamepad();
  const elapsed = clock.getElapsedTime();
  gloryWarnCooldown = Math.max(0, gloryWarnCooldown - dt);
  davidHarpCooldown = Math.max(0, davidHarpCooldown - dt);

  if (mode === 'title') {
    // Gentle aerial drift over the sunlit Terrace & Eastern Gate skyline
    const drift = access.reduceGlow ? 0.35 : Math.min(1, access.lookSensitivity);
    const angle = elapsed * 0.09 * drift;
    camera.position.set(Math.sin(angle) * 16, 7.2 + Math.sin(elapsed * 0.25 * drift) * 0.8, 17 + Math.cos(angle) * 6);
    camera.lookAt(0, 2.2, -16);
    terrace.update(dt, elapsed, playerPos);
  } else if (mode === 'explore') {
    // Smooth WASD / Arrow movement
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const move = new THREE.Vector3();

    if (keys.has('w') || keys.has('arrowup')) move.add(forward);
    if (keys.has('s') || keys.has('arrowdown')) move.sub(forward);
    if (keys.has('d') || keys.has('arrowright')) move.add(right);
    if (keys.has('a') || keys.has('arrowleft')) move.sub(right);
    if (stick.x !== 0 || stick.y !== 0 || gamepadMove.lengthSq() > 0) {
      move.add(forward.clone().multiplyScalar(-stick.y - gamepadMove.y));
      move.add(right.clone().multiplyScalar(stick.x + gamepadMove.x));
    }

    // A gentle weight near the Rising Road until two Growing Eyes milestones are kept.
    // Bloom and the veil stay capped so the overlook never washes out to white.
    let speed = 6.2;
    if (playerPos.z < -20.5 && eyesCount() < 2) {
      const depth = Math.min(1, (-20.5 - playerPos.z) / 5.5);
      const bloomLo = baseBloom();
      const bloomHi = access.reduceGlow ? 0.16 : 0.42;
      bloomPass.strength = bloomLo + depth * (bloomHi - bloomLo);
      gloryVeil.style.opacity = String(depth * (access.reduceGlow ? 0.05 : 0.14));
      speed = 6.2 * (1 - depth * 0.45);
      if (depth > 0.72 && gloryWarnCooldown <= 0) {
        gloryWarnCooldown = 6;
        showWhisper('Amos: "No rush, friend—the noon glory is still bright. Sit with Mara in the Orchard, or gaze into the Golden Pool first."');
      }
      if (playerPos.z < -25.2) playerPos.z = -25.2;
    } else {
      const targetBloom = baseBloom();
      bloomPass.strength += (targetBloom - bloomPass.strength) * Math.min(1, dt * 3);
      if (gloryVeil.style.opacity !== '0' && parseFloat(gloryVeil.style.opacity || '0') < 0.6) {
        gloryVeil.style.opacity = '0';
      }
    }

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * dt);
      playerPos.x = THREE.MathUtils.clamp(playerPos.x + move.x, -26, 23.5);
      playerPos.z = THREE.MathUtils.clamp(playerPos.z + move.z, -29.5, 22);
    }

    const groundY = Math.max(terrace.getGroundHeight(playerPos.x, playerPos.z), -0.22);
    playerPos.y += (groundY + 1.72 - playerPos.y) * Math.min(1, dt * 10);

    camera.position.copy(playerPos);
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    terrace.update(dt, elapsed, playerPos);
    updateZoneIndicator();

    // Soft distant harp chime when walking near King David
    const david = terrace.saintAgents.get('david');
    if (david && david.group.position.distanceTo(playerPos) < 9.5 && davidHarpCooldown <= 0) {
      davidHarpCooldown = 7.5;
      soundscape.playChime('stillness');
    }

    // Find closest interactable point
    let nearest: InteractablePoint | null = null;
    let bestDist = Infinity;
    for (const item of terrace.interactables) {
      const d = playerPos.distanceTo(item.position);
      if (d < item.radius && d < bestDist) {
        bestDist = d;
        nearest = item;
      }
    }
    activeInteractable = nearest;
    if (nearest) {
      if (nearest.type === 'overlook' && eyesCount() < 2) {
        promptLabel.textContent = 'Rising Road Overlook';
        promptSublabel.textContent = 'Not yet. Finish two testimonies of grace, then the light will be ready.';
      } else {
        promptLabel.textContent = nearest.label;
        promptSublabel.textContent = nearest.sublabel;
      }
      interactPrompt.classList.remove('hidden');
    } else {
      interactPrompt.classList.add('hidden');
    }
  } else if (mode === 'dialogue') {
    terrace.update(dt, elapsed, playerPos);
    if (seatTargetPos && seatTargetLook) {
      camera.position.lerp(seatTargetPos, Math.min(1, dt * 3.5));
      camera.lookAt(seatTargetLook);
    }
  } else if (mode === 'vision') {
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    const bg = visions.update(
      dt,
      (beat, progress) => {
        visionSpeaker.textContent = beat.speaker;
        visionCaption.textContent = beat.caption;
        visionProgressFill.style.width = `${Math.round(progress * 100)}%`;
        soundscape.playChime('vision-swell');
      },
      () => exitVision()
    );
    if (bg) {
      scene.background = bg;
    }
    if (visions.isActive()) {
      const curW = parseFloat(visionProgressFill.style.width || '0');
      visionProgressFill.style.width = `${Math.min(100, curW + dt * 4.2)}%`;
    }
  }

  updateAmbientWisps();
  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

const accessModal = document.getElementById('access-modal')!;
document.getElementById('btn-access')!.addEventListener('click', () => accessModal.classList.remove('hidden'));
document.getElementById('btn-access-title')!.addEventListener('click', () => accessModal.classList.remove('hidden'));
document.getElementById('opt-reduce-glow')!.addEventListener('change', (e) => {
  access.reduceGlow = (e.currentTarget as HTMLInputElement).checked;
  saveAccess();
});
document.getElementById('opt-subtitles')!.addEventListener('change', (e) => {
  access.subtitleBg = (e.currentTarget as HTMLInputElement).checked;
  saveAccess();
});
document.getElementById('opt-sensitivity')!.addEventListener('input', (e) => {
  access.lookSensitivity = Number((e.currentTarget as HTMLInputElement).value);
  saveAccess();
});
document.querySelectorAll<HTMLButtonElement>('[data-text-scale]').forEach((btn) => {
  btn.addEventListener('click', () => {
    access.textScale = Number(btn.dataset.textScale);
    saveAccess();
  });
});

loadAccess();
applyAccess();
setMode('title');
updateEyesUI();
rebuildComposer();

document.querySelectorAll<HTMLButtonElement>('[data-gfx]').forEach((btn) => {
  btn.classList.toggle('is-selected', btn.dataset.gfx === graphicsQuality);
  btn.addEventListener('click', () => {
    const next = btn.dataset.gfx;
    if (next !== 'low' && next !== 'medium' && next !== 'high') return;
    saveGraphicsQuality(next);
    window.location.reload();
  });
});

animate();
