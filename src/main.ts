import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { TerraceWorld, InteractablePoint } from './world/TerraceWorld';
import { GuidedVisionController, VisionKind } from './world/GuidedVisions';
import { DIALOGUES, DialogueNode } from './data/dialogues';
import { REFERENCE_PLATES } from './data/plates';
import { HeavenlySoundscape } from './audio/Soundscape';

// --- Renderer, Scene, Camera, Post-Processing ---
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xf5e5c4, 0.0085);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 350);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.38,
  0.65,
  0.76
);
composer.addPass(bloomPass);

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

window.addEventListener('mousemove', (e) => {
  if (!isDragging || (mode !== 'explore' && mode !== 'vision')) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  yaw -= dx * 0.0042;
  pitch = THREE.MathUtils.clamp(pitch - dy * 0.0035, -1.05, 1.05);
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
    yaw -= dx * 0.005;
    pitch = THREE.MathUtils.clamp(pitch - dy * 0.004, -1.0, 1.0);
  }
}, { passive: true });

// --- Interaction, Dialogue & Guided Vision Flows ---
function triggerInteraction(point: InteractablePoint): void {
  soundscape.playChime(point.type === 'leaves' ? 'leaves' : 'interact');

  if (point.type === 'leaves') {
    breatheHealingLeaves();
  }

  if (point.type === 'saint') {
    eyesProgress.fellowship = true;
    updateEyesUI();
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
  gloryVeil.style.opacity = '0.52';
  window.setTimeout(() => {
    gloryVeil.style.opacity = '0';
  }, 900);
  showWhisper('You breathe the leaves of the Tree of Life. The poison leaves the memory; the scar can stand in the sun.');
}

function openDialogue(nodeId: string): void {
  const node = DIALOGUES[nodeId];
  if (!node) {
    closeDialogue();
    return;
  }
  currentDialogue = node;
  mode = 'dialogue';
  interactPrompt.classList.add('hidden');
  dialoguePanel.classList.remove('hidden');

  dlgSpeaker.textContent = node.speaker;
  dlgRole.textContent = node.role;
  dlgText.textContent = node.text;
  dlgChoices.innerHTML = '';

  node.choices.forEach((choice, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = `${idx + 1}. ${choice.label}`;
    btn.addEventListener('click', () => handleChoice(choice));
    dlgChoices.appendChild(btn);
  });
}

function handleChoice(choice: DialogueNode['choices'][number]): void {
  if (choice.action === 'breathe-leaves') {
    breatheHealingLeaves();
  } else if (choice.action === 'mark-healed') {
    eyesProgress.fellowship = true;
    updateEyesUI();
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
  mode = 'explore';
}

function startVision(kind: VisionKind): void {
  gloryVeil.style.opacity = '0.95';
  soundscape.playChime('vision-start');

  window.setTimeout(() => {
    mode = 'vision';
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
    bloomPass.strength = 0.72;

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
    scene.fog = new THREE.FogExp2(0xf5e5c4, 0.0085);
    scene.background = null;
    bloomPass.strength = 0.38;
    visionHud.classList.add('hidden');
    hud.classList.remove('hidden');
    controlsBar.classList.remove('hidden');
    mode = 'explore';
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
  mode = 'explore';
  showWhisper('Walk gently. Amos waits just ahead on the sunlit Terrace, and the Walled Orchard lies across the river.');
});

document.getElementById('btn-menu')!.addEventListener('click', () => {
  closeDialogue();
  if (visions.isActive()) exitVision();
  hud.classList.add('hidden');
  controlsBar.classList.add('hidden');
  interactPrompt.classList.add('hidden');
  titleScreen.classList.remove('hidden');
  titleScreen.classList.add('active');
  mode = 'title';
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

document.querySelectorAll<HTMLButtonElement>('.place-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dest = TELEPORTS[btn.dataset.teleport || 'amos'];
    if (dest) {
      playerPos.set(dest.x, terrace.getGroundHeight(dest.x, dest.z) + 1.72, dest.z);
      yaw = dest.yaw;
      pitch = -0.02;
      soundscape.playChime('stillness');
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
  const elapsed = clock.getElapsedTime();
  gloryWarnCooldown = Math.max(0, gloryWarnCooldown - dt);
  davidHarpCooldown = Math.max(0, davidHarpCooldown - dt);

  if (mode === 'title') {
    // Gentle aerial drift over the sunlit Terrace & Eastern Gate skyline
    const angle = elapsed * 0.09;
    camera.position.set(Math.sin(angle) * 16, 7.2 + Math.sin(elapsed * 0.25) * 0.8, 17 + Math.cos(angle) * 6);
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

    // Diegetic "Weight of Glory" near the northern Rising Road if eyes haven't adjusted yet
    let speed = 6.2;
    if (playerPos.z < -20.5 && eyesCount() < 2) {
      const depth = Math.min(1, (-20.5 - playerPos.z) / 5.5);
      bloomPass.strength = 0.38 + depth * 1.15;
      gloryVeil.style.opacity = String(depth * 0.55);
      speed = 6.2 * (1 - depth * 0.65);
      if (depth > 0.72 && gloryWarnCooldown <= 0) {
        gloryWarnCooldown = 6;
        showWhisper('Amos: "No rush, friend—the noon glory is heavy yet. Rest with Mara in the Orchard or gaze into the Golden Pool first."');
      }
      if (playerPos.z < -25.2) playerPos.z = -25.2;
    } else {
      bloomPass.strength += (0.38 - bloomPass.strength) * Math.min(1, dt * 3);
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
      promptLabel.textContent = nearest.label;
      promptSublabel.textContent = nearest.sublabel;
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

animate();
