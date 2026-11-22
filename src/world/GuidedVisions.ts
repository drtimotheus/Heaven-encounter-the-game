import * as THREE from 'three';

export type VisionKind = 'creation' | 'cross' | 'sawdust';

export interface VisionBeat {
  startSec: number;
  speaker: string;
  caption: string;
}

const VISION_SCRIPTS: Record<VisionKind, { title: string; duration: number; beats: VisionBeat[] }> = {
  creation: {
    title: 'Vision #1 — Creation: "Let There Be Light"',
    duration: 26,
    beats: [
      { startSec: 0, speaker: 'Amos', caption: 'Before anything was made—before a single star or hill—there was already love.' },
      { startSec: 5.5, speaker: 'Living Memory', caption: 'A single spoken resonance ripples across the stillness: Let there be light.' },
      { startSec: 11, speaker: 'Amos', caption: 'Waters part and golden dawn sweeps over the deep. Nothing here is an accident. No stars yet—only light.' },
      {
        startSec: 16,
        speaker: 'Amos',
        caption:
          'Day 4. And God made two great lights; the greater light to rule the day, and the lesser light to rule the night: he made the stars also.'
      },
      { startSec: 21.5, speaker: 'Amos', caption: 'The same Love that set those stars in place prepared a bench for you on the Terrace.' }
    ]
  },
  cross: {
    title: 'Vision #2 — The Cross: "The Wound That Became a Gate"',
    duration: 24,
    beats: [
      { startSec: 0, speaker: 'Elias Vance', caption: 'Look at the Eastern Gate—a single pearl. The only jewel grown inside a living creature around a painful wound.' },
      { startSec: 6.5, speaker: 'Elias Vance', caption: 'Dusk falls on a quiet hillside. Watch what happens to every wall, every ledger, and every hidden shame.' },
      { startSec: 13.5, speaker: 'Living Memory', caption: 'Two seconds of stillness. Then the quiet word that broke the darkness forever: It is finished.' },
      { startSec: 19, speaker: 'Elias Vance', caption: 'Dawn / Risen. Marked, healed hands—the receipt stamped paid in full.' }
    ]
  },
  sawdust: {
    title: 'Vision #3 — Testimony Echo: "The Boy in the Sawdust"',
    duration: 22,
    beats: [
      { startSec: 0, speaker: 'Elias Vance', caption: 'About forty years back, behind stacked pine lumber, a seventeen-year-old boy sat down in the sawdust.' },
      { startSec: 5.5, speaker: 'Elias Vance', caption: 'I had no good words. I just sat down in the sawdust beside him and forgot it inside a week.' },
      { startSec: 11.5, speaker: 'Living Memory', caption: 'The light did not forget. Watch the golden load-path ripple across forty years of rescued lives.' },
      { startSec: 17, speaker: 'Elias Vance', caption: 'Houses burn. The sawdust crystallizes into a sapphire gem that outlasts the sun.' }
    ]
  }
};

export class GuidedVisionController {
  public readonly group = new THREE.Group();
  private activeKind: VisionKind | null = null;
  private elapsed = 0;
  private lastBeatIdx = -1;

  // Dynamic 3D elements inside the vision space
  private starField!: THREE.Points;
  private nebulaRing!: THREE.Mesh;
  private pearlArch!: THREE.Mesh;
  private shadowMotes!: THREE.Points;
  private dawnSphere!: THREE.Mesh;
  private rippleLines: THREE.Line[] = [];
  private sapphireGem!: THREE.Mesh;
  private lightCore!: THREE.PointLight;
  private visionAmbient!: THREE.AmbientLight;
  private readonly sawdustGroup = new THREE.Group();
  private sawdustSky!: THREE.Mesh;
  private sawdustMotes!: THREE.Points;
  private reduceGlow = false;

  constructor() {
    this.group.visible = false;
    this.buildVisionAssets();
  }

  private buildVisionAssets(): void {
    // 1. Creation starfield & swirling golden nebula
    const starCount = 2400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    const cGold = new THREE.Color(0xffe7a8);
    const cBlue = new THREE.Color(0x9bd3ff);
    const cWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < starCount; i++) {
      const r = 10 + Math.random() * 55;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = i % 3 === 0 ? cGold : i % 3 === 1 ? cBlue : cWhite;
      starCol[i * 3] = c.r;
      starCol[i * 3 + 1] = c.g;
      starCol[i * 3 + 2] = c.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    this.starField = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        size: 0.34,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    this.group.add(this.starField);

    this.nebulaRing = new THREE.Mesh(
      new THREE.TorusGeometry(14, 2.2, 20, 64),
      new THREE.MeshBasicMaterial({
        color: 0xffd67a,
        transparent: true,
        opacity: 0,
        wireframe: true,
        blending: THREE.AdditiveBlending
      })
    );
    this.nebulaRing.rotation.x = Math.PI * 0.35;
    this.group.add(this.nebulaRing);

    // 2. Cross vision: Luminous Pearl Gate + Dissolving Shadow Motes + Dawn Sphere
    this.pearlArch = new THREE.Mesh(
      new THREE.TorusGeometry(6.5, 1.35, 24, 48, Math.PI),
      new THREE.MeshStandardMaterial({
        color: 0xfff8ee,
        emissive: 0xffe0a3,
        emissiveIntensity: 0.85,
        roughness: 0.18,
        transparent: true,
        opacity: 0
      })
    );
    this.pearlArch.position.set(0, -1.5, -12);
    this.group.add(this.pearlArch);

    const moteCount = 600;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 18;
      motePos[i * 3] = Math.cos(a) * r;
      motePos[i * 3 + 1] = (Math.random() - 0.3) * 10;
      motePos[i * 3 + 2] = Math.sin(a) * r - 6;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    this.shadowMotes = new THREE.Points(
      moteGeo,
      new THREE.PointsMaterial({ color: 0x5c6278, size: 0.25, transparent: true, opacity: 0 })
    );
    this.group.add(this.shadowMotes);

    this.dawnSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xfff5d1,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      })
    );
    this.dawnSphere.position.set(0, 1.8, -14);
    this.group.add(this.dawnSphere);

    // 3. Sawdust vision: Spreading golden load-path ribbons + crystallizing Deep Sapphire Gem
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffd773,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    for (let i = 0; i < 24; i++) {
      const pts: THREE.Vector3[] = [];
      const angle = (i / 24) * Math.PI * 2;
      for (let s = 0; s <= 18; s++) {
        const t = s / 18;
        pts.push(
          new THREE.Vector3(
            Math.cos(angle + t * 0.9) * (t * 16),
            -2.5 + Math.sin(t * Math.PI) * 5.2 + (i % 3) * 0.8,
            -8 + Math.sin(angle + t * 0.9) * (t * 12)
          )
        );
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat.clone());
      this.group.add(line);
      this.rippleLines.push(line);
    }

    this.sapphireGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.45, 1),
      new THREE.MeshStandardMaterial({
        color: 0x1e60ff,
        emissive: 0x1040c8,
        emissiveIntensity: 1.1,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0
      })
    );
    this.sapphireGem.position.set(0, 1.4, -7.5);
    this.group.add(this.sapphireGem);

    this.lightCore = new THREE.PointLight(0xffe9b5, 2.5, 60);
    this.lightCore.position.set(0, 3, -8);
    this.group.add(this.lightCore);
    this.visionAmbient = new THREE.AmbientLight(0x667799, 0.7);
    this.group.add(this.visionAmbient);
    this.buildSawdustYard();
  }

  /** Photosensitivity: keep vision lights from climbing toward white. */
  public setReduceGlow(on: boolean): void {
    this.reduceGlow = on;
  }

  private buildSawdustYard(): void {
    this.sawdustGroup.visible = false;
    this.sawdustGroup.position.set(0, 0, -1.2);

    const yard = new THREE.Mesh(
      new THREE.CircleGeometry(16, 40),
      new THREE.MeshStandardMaterial({ color: 0xa68452, roughness: 1 })
    );
    yard.rotation.x = -Math.PI / 2;
    yard.position.y = 0;
    this.sawdustGroup.add(yard);

    const dustPatch = new THREE.Mesh(
      new THREE.CircleGeometry(6.5, 28),
      new THREE.MeshStandardMaterial({ color: 0xe4c48a, roughness: 1 })
    );
    dustPatch.rotation.x = -Math.PI / 2;
    dustPatch.position.set(0.2, 0.02, -3.4);
    this.sawdustGroup.add(dustPatch);

    this.sawdustSky = new THREE.Mesh(
      new THREE.SphereGeometry(34, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0xb56d3c, side: THREE.BackSide })
    );
    this.sawdustGroup.add(this.sawdustSky);

    const sun = new THREE.DirectionalLight(0xffc48a, 1.15);
    sun.position.set(-6, 7, 3);
    this.sawdustGroup.add(sun);
    this.sawdustGroup.add(new THREE.AmbientLight(0x8a6248, 0.55));

    // Stacked lumber, sawhorses, and a low pile of logs — a dusk jobsite.
    this.addLumberStack(-4.6, -6.4, 7, 0.08);
    this.addLumberStack(-4.2, -8.2, 5, -0.06);
    this.addLumberStack(4.4, -6.2, 8, 0.18);
    this.addLumberStack(4.8, -8.4, 4, -0.12);
    this.addLumberStack(-0.4, -9.6, 6, 0.42);
    this.addLogPile(-7.2, -5.2);
    this.addSawhorse(3.2, -4.2);

    const logSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 2.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b4228, roughness: 0.9 })
    );
    logSeat.rotation.z = Math.PI / 2;
    logSeat.position.set(0.2, 0.22, -3.15);
    this.sawdustGroup.add(logSeat);

    // Elias (older, gray hair, work shirt) and the boy, seated together.
    this.addSeatedFigure(-0.45, -3.15, 0x466384, 0xc9c4b8, 1);
    this.addSeatedFigure(0.85, -3.05, 0x6b5344, 0x5a4030, 0.78);

    const moteCount = 280;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 14;
      motePos[i * 3 + 1] = 0.15 + Math.random() * 1.6;
      motePos[i * 3 + 2] = -1.5 - Math.random() * 9;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    this.sawdustMotes = new THREE.Points(
      moteGeo,
      new THREE.PointsMaterial({
        color: 0xe7c48a,
        size: 0.045,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      })
    );
    this.sawdustGroup.add(this.sawdustMotes);
    this.group.add(this.sawdustGroup);
  }

  private addLumberStack(x: number, z: number, layers: number, yaw: number): void {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    const plank = new THREE.BoxGeometry(2.5, 0.11, 0.28);
    const wood = new THREE.MeshStandardMaterial({ color: 0x8d5a34, roughness: 0.84 });
    const end = new THREE.MeshStandardMaterial({ color: 0xd7b07a, roughness: 0.7 });
    for (let i = 0; i < layers; i++) {
      const board = new THREE.Mesh(plank, i % 2 === 0 ? wood : end);
      board.position.set((i % 2) * 0.06, 0.08 + i * 0.12, 0);
      board.castShadow = true;
      g.add(board);
    }
    this.sawdustGroup.add(g);
  }

  private addLogPile(x: number, z: number): void {
    const g = new THREE.Group();
    g.position.set(x, 0.16, z);
    const mat = new THREE.MeshStandardMaterial({ color: 0x7a4e30, roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.8, 7), mat);
      log.rotation.z = Math.PI / 2;
      log.position.set(0, i * 0.22, (i % 2) * 0.12);
      g.add(log);
    }
    this.sawdustGroup.add(g);
  }

  private addSawhorse(x: number, z: number): void {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const mat = new THREE.MeshStandardMaterial({ color: 0x6e4a2e, roughness: 0.86 });
    [-0.7, 0.7].forEach((ox) => {
      const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.7, 5), mat);
      legA.position.set(ox, 0.32, 0);
      legA.rotation.z = 0.28;
      g.add(legA);
      const legB = legA.clone();
      legB.rotation.z = -0.28;
      g.add(legB);
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.22), mat);
    top.position.y = 0.66;
    g.add(top);
    this.sawdustGroup.add(g);
  }

  private addSeatedFigure(x: number, z: number, shirt: number, hair: number, scale: number): void {
    const g = new THREE.Group();
    g.position.set(x, 0.55, z);
    g.scale.setScalar(scale);
    const skin = new THREE.MeshStandardMaterial({ color: 0xd1a27c, roughness: 0.62 });
    const cloth = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.75 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.8 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3a342f, roughness: 0.85 });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.4, 8), cloth);
    torso.position.y = 0.28;
    g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), skin);
    head.position.y = 0.58;
    g.add(head);
    const hairMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.138, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hairMesh.position.y = 0.62;
    g.add(hairMesh);
    const thigh = new THREE.CylinderGeometry(0.065, 0.055, 0.34, 6);
    [-0.08, 0.08].forEach((ox) => {
      const leg = new THREE.Mesh(thigh, legMat);
      leg.rotation.x = Math.PI / 2.2;
      leg.position.set(ox, 0.02, 0.18);
      g.add(leg);
    });
    this.sawdustGroup.add(g);
  }

  public start(kind: VisionKind): { title: string; duration: number } {
    this.activeKind = kind;
    this.elapsed = 0;
    this.lastBeatIdx = -1;
    this.group.visible = true;
    this.sawdustGroup.visible = kind === 'sawdust';
    this.resetOpacities();
    const spec = VISION_SCRIPTS[kind];
    return { title: spec.title, duration: spec.duration };
  }

  public stop(): void {
    this.activeKind = null;
    this.group.visible = false;
    this.sawdustGroup.visible = false;
    this.resetOpacities();
  }

  public isActive(): boolean {
    return this.activeKind !== null;
  }

  private resetOpacities(): void {
    (this.starField.material as THREE.PointsMaterial).opacity = 0;
    (this.nebulaRing.material as THREE.MeshBasicMaterial).opacity = 0;
    (this.pearlArch.material as THREE.MeshStandardMaterial).opacity = 0;
    (this.shadowMotes.material as THREE.PointsMaterial).opacity = 0;
    (this.dawnSphere.material as THREE.MeshBasicMaterial).opacity = 0;
    (this.sapphireGem.material as THREE.MeshStandardMaterial).opacity = 0;
    this.rippleLines.forEach((l) => {
      (l.material as THREE.LineBasicMaterial).opacity = 0;
    });
    this.visionAmbient.color.set(0x667799);
    this.visionAmbient.intensity = 0.7;
  }

  public update(
    dt: number,
    onBeat: (beat: VisionBeat, progress: number) => void,
    onComplete: () => void
  ): THREE.Color | null {
    if (!this.activeKind) return null;

    this.elapsed += dt;
    const spec = VISION_SCRIPTS[this.activeKind];
    const progress = Math.min(1, this.elapsed / spec.duration);

    // Check narrative beats
    let currentBeatIdx = 0;
    for (let i = 0; i < spec.beats.length; i++) {
      if (this.elapsed >= spec.beats[i].startSec) currentBeatIdx = i;
    }
    if (currentBeatIdx !== this.lastBeatIdx) {
      this.lastBeatIdx = currentBeatIdx;
      onBeat(spec.beats[currentBeatIdx], progress);
    }

    const bgColor = new THREE.Color(0x0b0e1a);

    const glow = this.reduceGlow ? 0.45 : 1;

    if (this.activeKind === 'creation') {
      // Light only until the Day 4 beat (Gen 1:16). Stars stay dark before then.
      const ignite = THREE.MathUtils.smoothstep(this.elapsed, 4.8, 9.5);
      const dawn = THREE.MathUtils.smoothstep(this.elapsed, 11, 16);
      const day4 = THREE.MathUtils.smoothstep(this.elapsed, 16, 19.5);
      (this.starField.material as THREE.PointsMaterial).opacity = day4 * glow;
      this.starField.rotation.y += dt * 0.06;
      this.starField.rotation.x += dt * 0.02;

      (this.nebulaRing.material as THREE.MeshBasicMaterial).opacity = ignite * 0.4 * glow;
      this.nebulaRing.rotation.z += dt * 0.14;
      this.nebulaRing.scale.setScalar(0.35 + ignite * 1.15);

      (this.dawnSphere.material as THREE.MeshBasicMaterial).opacity = ignite * 0.7 * glow;
      this.dawnSphere.scale.setScalar(0.4 + dawn * 3.2);

      bgColor.setRGB(
        0.04 + dawn * 0.32,
        0.05 + dawn * 0.26,
        0.10 + ignite * 0.16 + dawn * 0.12
      );
    } else if (this.activeKind === 'cross') {
      const pearlFade = 1 - THREE.MathUtils.smoothstep(this.elapsed, 5.5, 8.0);
      const duskPhase = THREE.MathUtils.smoothstep(this.elapsed, 5.5, 8.0) * (1 - THREE.MathUtils.smoothstep(this.elapsed, 13.5, 17.5));
      // Dawn / healed hands arrive only after the "It is finished" beat.
      const sunrise = THREE.MathUtils.smoothstep(this.elapsed, 19.0, 23.5);

      (this.pearlArch.material as THREE.MeshStandardMaterial).opacity = Math.max(pearlFade, sunrise * 0.8);
      (this.shadowMotes.material as THREE.PointsMaterial).opacity = duskPhase * 0.9;

      // Gently pull shadow motes inward toward the light to dissolve them
      if (duskPhase > 0.01) {
        const attr = this.shadowMotes.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < attr.count; i++) {
          attr.setXYZ(
            i,
            attr.getX(i) * (1 - dt * 0.25),
            attr.getY(i) * (1 - dt * 0.2),
            THREE.MathUtils.lerp(attr.getZ(i), -14, dt * 0.25)
          );
        }
        attr.needsUpdate = true;
      }

      (this.dawnSphere.material as THREE.MeshBasicMaterial).opacity = sunrise * 0.72 * glow;
      this.dawnSphere.scale.setScalar(0.8 + sunrise * 3.4);
      (this.starField.material as THREE.PointsMaterial).opacity = (duskPhase * 0.28 + sunrise * 0.35) * glow;

      bgColor.setRGB(
        0.08 + sunrise * 0.42,
        0.07 + sunrise * 0.32,
        0.12 + sunrise * 0.18
      );
    } else if (this.activeKind === 'sawdust') {
      const mute = THREE.MathUtils.smoothstep(this.elapsed, 8, 18);
      const gemPhase = THREE.MathUtils.smoothstep(this.elapsed, 15.5, 19.5);
      this.sawdustGroup.visible = true;
      (this.starField.material as THREE.PointsMaterial).opacity = 0;
      this.rippleLines.forEach((line) => {
        (line.material as THREE.LineBasicMaterial).opacity = 0;
      });
      (this.nebulaRing.material as THREE.MeshBasicMaterial).opacity = 0;
      (this.dawnSphere.material as THREE.MeshBasicMaterial).opacity = 0;

      const sky = this.sawdustSky.material as THREE.MeshBasicMaterial;
      const warm = new THREE.Color(0xb56d3c);
      const muted = new THREE.Color(0x6e5b48);
      sky.color.copy(warm).lerp(muted, mute);

      const attr = this.sawdustMotes.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < attr.count; i++) {
        let y = attr.getY(i) + dt * 0.08;
        if (y > 1.8) y = 0.15;
        attr.setY(i, y);
      }
      attr.needsUpdate = true;

      // A small gem rests in the sawdust at the end. The yard stays the scene.
      this.sapphireGem.position.set(0.15, 0.42, -4.05);
      (this.sapphireGem.material as THREE.MeshStandardMaterial).opacity = gemPhase * 0.9;
      this.sapphireGem.rotation.y += dt * 0.4;
      this.sapphireGem.scale.setScalar(0.15 + gemPhase * 0.35);

      this.visionAmbient.color.set(0xffc9a0);
      this.visionAmbient.intensity = 0.35;
      bgColor.copy(sky.color);
    }

    if (this.elapsed >= spec.duration) {
      this.stop();
      onComplete();
    }
    return bgColor;
  }
}
