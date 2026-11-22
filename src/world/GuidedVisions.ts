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
    duration: 24,
    beats: [
      { startSec: 0, speaker: 'Amos', caption: 'Before anything was made—before a single star or hill—there was already love.' },
      { startSec: 5.5, speaker: 'Living Memory', caption: 'Look up. A single spoken resonance ripples across the stillness—Let there be light.' },
      { startSec: 12, speaker: 'Amos', caption: 'Waters part and golden dawn sweeps over the deep. Nothing here is an accident.' },
      { startSec: 18, speaker: 'Amos', caption: 'The same Love that breathed galaxies into song prepared a bench for you on the Terrace.' }
    ]
  },
  cross: {
    title: 'Vision #2 — The Cross: "The Wound That Became a Gate"',
    duration: 24,
    beats: [
      { startSec: 0, speaker: 'Elias Vance', caption: 'Look at the Eastern Gate—a single pearl. The only jewel grown inside a living creature around a painful wound.' },
      { startSec: 6.5, speaker: 'Elias Vance', caption: 'Dusk falls on a quiet hillside. Watch what happens to every wall, every ledger, and every hidden shame.' },
      { startSec: 13.5, speaker: 'Living Memory', caption: 'Two seconds of stillness... then the quiet word that broke the darkness forever: It is finished.' },
      { startSec: 19, speaker: 'Elias Vance', caption: 'Unstoppable dawn. Marked, healed hands—the receipt stamped paid in full.' }
    ]
  },
  sawdust: {
    title: 'Vision #3 — Testimony Echo: "The Boy in the Sawdust"',
    duration: 22,
    beats: [
      { startSec: 0, speaker: 'Elias Vance', caption: 'Fifty years ago, behind stacked pine lumber, a seventeen-year-old boy wept for his father.' },
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
    this.group.add(new THREE.AmbientLight(0x667799, 0.7));
  }

  public start(kind: VisionKind): { title: string; duration: number } {
    this.activeKind = kind;
    this.elapsed = 0;
    this.lastBeatIdx = -1;
    this.group.visible = true;
    this.resetOpacities();
    const spec = VISION_SCRIPTS[kind];
    return { title: spec.title, duration: spec.duration };
  }

  public stop(): void {
    this.activeKind = null;
    this.group.visible = false;
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

    if (this.activeKind === 'creation') {
      const ignite = THREE.MathUtils.smoothstep(this.elapsed, 4.8, 9.5);
      const dawn = THREE.MathUtils.smoothstep(this.elapsed, 13, 21);
      (this.starField.material as THREE.PointsMaterial).opacity = ignite;
      this.starField.rotation.y += dt * 0.06;
      this.starField.rotation.x += dt * 0.02;

      (this.nebulaRing.material as THREE.MeshBasicMaterial).opacity = ignite * 0.52;
      this.nebulaRing.rotation.z += dt * 0.14;
      this.nebulaRing.scale.setScalar(0.35 + ignite * 1.15);

      (this.dawnSphere.material as THREE.MeshBasicMaterial).opacity = ignite * 0.85;
      this.dawnSphere.scale.setScalar(0.4 + dawn * 4.5);

      bgColor.setRGB(
        0.04 + dawn * 0.42,
        0.05 + dawn * 0.35,
        0.10 + ignite * 0.22 + dawn * 0.18
      );
    } else if (this.activeKind === 'cross') {
      const pearlFade = 1 - THREE.MathUtils.smoothstep(this.elapsed, 5.5, 8.0);
      const duskPhase = THREE.MathUtils.smoothstep(this.elapsed, 5.5, 8.0) * (1 - THREE.MathUtils.smoothstep(this.elapsed, 13.5, 16));
      const sunrise = THREE.MathUtils.smoothstep(this.elapsed, 15.2, 22.0);

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

      (this.dawnSphere.material as THREE.MeshBasicMaterial).opacity = sunrise * 0.95;
      this.dawnSphere.scale.setScalar(0.8 + sunrise * 6.5);
      (this.starField.material as THREE.PointsMaterial).opacity = duskPhase * 0.45 + sunrise * 0.5;

      bgColor.setRGB(
        0.08 + sunrise * 0.72,
        0.07 + sunrise * 0.56,
        0.12 + sunrise * 0.32
      );
    } else if (this.activeKind === 'sawdust') {
      const ripple = THREE.MathUtils.smoothstep(this.elapsed, 5.0, 11.0);
      const gemPhase = THREE.MathUtils.smoothstep(this.elapsed, 14.5, 18.5);

      this.rippleLines.forEach((line, idx) => {
        (line.material as THREE.LineBasicMaterial).opacity = ripple * (1 - gemPhase * 0.45) * 0.85;
        line.rotation.y += dt * (0.08 + (idx % 3) * 0.03);
      });

      (this.starField.material as THREE.PointsMaterial).opacity = 0.35 + ripple * 0.45;
      (this.sapphireGem.material as THREE.MeshStandardMaterial).opacity = gemPhase;
      this.sapphireGem.rotation.y += dt * 0.85;
      this.sapphireGem.rotation.x += dt * 0.35;
      this.sapphireGem.scale.setScalar(0.2 + gemPhase * 1.15);

      bgColor.setRGB(
        0.06 + ripple * 0.14,
        0.07 + ripple * 0.15,
        0.14 + gemPhase * 0.25
      );
    }

    if (this.elapsed >= spec.duration) {
      this.stop();
      onComplete();
    }
    return bgColor;
  }
}
