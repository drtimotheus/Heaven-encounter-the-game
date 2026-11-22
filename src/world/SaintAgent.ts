import * as THREE from 'three';
import { SaintProfile } from '../data/dialogues';

export type AgentState = 'stroll' | 'pair-talk' | 'harp-play' | 'bench-rest' | 'greet' | 'react-leaves' | 'converse-player';

/**
 * Art-Directed Living NPC Agent (GTA 6–Inspired Reactive Fellowship)
 * Features an articulated hierarchical rig (head tracking, shoulder/arm gestures, walking gait,
 * signature biblical props, autonomous patrol/pair-banter routines, warm player greetings,
 * and synchronized environmental reactions).
 */
export class SaintAgent {
  public readonly profile: SaintProfile;
  public readonly group = new THREE.Group();

  private hips = new THREE.Group();
  private headGroup = new THREE.Group();
  private leftArm = new THREE.Group();
  private rightArm = new THREE.Group();
  private leftLeg = new THREE.Group();
  private rightLeg = new THREE.Group();
  private haloRing!: THREE.Mesh;

  private state: AgentState;
  private waypointIdx = 0;
  private waitTimer = 0;
  private greetTimer = 0;
  private greetCooldown = 0;
  private reactTimer = 0;
  private gesturePhase = Math.random() * Math.PI * 2;
  private isTalkingNow = false;
  private lastGreetIdx = 0;

  // Ambient floating wisp state
  public activeWispText: string | null = null;
  private wispTimer = 0;

  constructor(profile: SaintProfile, groundY: number) {
    this.profile = profile;
    this.state = profile.behavior === 'admire' ? 'bench-rest' : profile.behavior;
    this.group.position.set(profile.position[0], groundY, profile.position[2]);
    this.buildArticulatedRig();
    this.group.lookAt(profile.lookAt[0], groundY, profile.lookAt[2]);
  }

  private buildArticulatedRig(): void {
    const p = this.profile;

    this.hips.position.y = 0.92;
    this.group.add(this.hips);

    const lowerMat = new THREE.MeshStandardMaterial({ color: p.robeLowerColor, roughness: 0.85 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: p.shirtColor, roughness: 0.72 });
    const vestMat = new THREE.MeshStandardMaterial({ color: p.vestColor, roughness: 0.68, side: THREE.DoubleSide });
    const skinMat = new THREE.MeshStandardMaterial({ color: p.skinColor, roughness: 0.58 });
    const hairMat = new THREE.MeshStandardMaterial({ color: p.hairColor, roughness: 0.82 });

    // Legs (pivoted at hips for natural walking stride!)
    const legGeo = new THREE.CylinderGeometry(0.105, 0.085, 0.88, 10);
    legGeo.translate(0, -0.44, 0);

    this.leftLeg.position.set(-0.14, 0, 0);
    const lLegMesh = new THREE.Mesh(legGeo, lowerMat);
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);
    this.hips.add(this.leftLeg);

    this.rightLeg.position.set(0.14, 0, 0);
    const rLegMesh = new THREE.Mesh(legGeo, lowerMat);
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);
    this.hips.add(this.rightLeg);

    // Subtle flowing lower tunic / robe skirt for biblical & grounded silhouettes
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.34, 0.68, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: p.robeLowerColor, roughness: 0.8, side: THREE.DoubleSide })
    );
    skirt.position.y = -0.32;
    this.hips.add(skirt);

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.68, 12), shirtMat);
    torso.position.y = 0.34;
    torso.castShadow = true;
    this.hips.add(torso);

    // Mantle / Vest / Shawl / Suspenders accent
    const vest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.265, 0.285, 0.52, 12, 1, true, -Math.PI * 0.78, Math.PI * 1.56),
      vestMat
    );
    vest.position.y = 0.34;
    this.hips.add(vest);

    // Diagonal sash/mantle drape for prophets & apostles
    if (p.category !== 'novel') {
      const drape = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 0.56), vestMat);
      drape.position.set(-0.14, 0.34, 0);
      drape.rotation.z = 0.22;
      this.hips.add(drape);
    }

    // Head Group (independent yaw/pitch for smooth eye-contact head tracking!)
    this.headGroup.position.set(0, 0.74, 0);
    this.hips.add(this.headGroup);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.195, 14, 14), skinMat);
    head.position.y = 0.16;
    head.castShadow = true;
    this.headGroup.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    hair.position.y = 0.19;
    this.headGroup.add(hair);

    if (p.hasBeard) {
      const beard = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 8), hairMat);
      beard.rotation.x = Math.PI;
      beard.position.set(0, 0.01, 0.11);
      this.headGroup.add(beard);
    }

    if (p.hasHeadscarf) {
      const scarf = new THREE.Mesh(
        new THREE.CylinderGeometry(0.215, 0.25, 0.34, 12, 1, true),
        vestMat
      );
      scarf.position.set(0, 0.18, -0.04);
      this.headGroup.add(scarf);
    }

    // Articulated Arms (pivoted at shoulders for waving, gesturing, harp-strumming!)
    const armGeo = new THREE.CylinderGeometry(0.068, 0.058, 0.62, 8);
    armGeo.translate(0, -0.28, 0);
    const handGeo = new THREE.SphereGeometry(0.065, 8, 8);

    this.leftArm.position.set(-0.31, 0.62, 0);
    const lArmMesh = new THREE.Mesh(armGeo, shirtMat);
    lArmMesh.castShadow = true;
    this.leftArm.add(lArmMesh);
    const lHand = new THREE.Mesh(handGeo, skinMat);
    lHand.position.y = -0.58;
    this.leftArm.add(lHand);
    this.hips.add(this.leftArm);

    this.rightArm.position.set(0.31, 0.62, 0);
    const rArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rArmMesh.castShadow = true;
    this.rightArm.add(rArmMesh);
    const rHand = new THREE.Mesh(handGeo, skinMat);
    rHand.position.y = -0.58;
    this.rightArm.add(rHand);
    this.hips.add(this.rightArm);

    // Signature Art-Directed Biblical Props
    this.attachProp(p.prop);

    // Warm ground fellowship aura ring
    this.haloRing = new THREE.Mesh(
      new THREE.RingGeometry(0.82, 1.0, 32),
      new THREE.MeshBasicMaterial({
        color: p.auraColor,
        transparent: true,
        opacity: 0.44,
        side: THREE.DoubleSide
      })
    );
    this.haloRing.rotation.x = -Math.PI / 2;
    this.haloRing.position.y = 0.06;
    this.group.add(this.haloRing);
  }

  private attachProp(prop: SaintProfile['prop']): void {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf7cf6b,
      emissive: 0x6b4b08,
      emissiveIntensity: 0.55,
      metalness: 0.72,
      roughness: 0.25
    });

    if (prop === 'harp') {
      const harp = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.032, 8, 24, Math.PI * 1.35), goldMat);
      harp.add(frame);
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.56, 8), goldMat);
      pillar.position.set(-0.24, 0, 0);
      harp.add(pillar);
      harp.position.set(0.18, -0.45, 0.22);
      harp.rotation.y = 0.4;
      this.leftArm.add(harp);
    } else if (prop === 'scroll') {
      const scroll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.36, 10),
        new THREE.MeshStandardMaterial({ color: 0xfaf0d7, roughness: 0.6 })
      );
      scroll.rotation.z = Math.PI / 2;
      scroll.position.set(0.04, -0.56, 0.08);
      this.leftArm.add(scroll);
    } else if (prop === 'staff') {
      const staff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.035, 1.95, 8),
        new THREE.MeshStandardMaterial({ color: 0x735235, roughness: 0.85 })
      );
      staff.position.set(0.06, -0.35, 0.14);
      this.rightArm.add(staff);
    } else if (prop === 'flowers') {
      const bouquet = new THREE.Group();
      const colors = [0xffb8d9, 0x9ee6ff, 0xfff199];
      colors.forEach((c, idx) => {
        const bloom = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.08, 0),
          new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35 })
        );
        bloom.position.set((idx - 1) * 0.07, 0.05 + (idx % 2) * 0.05, 0.04);
        bouquet.add(bloom);
      });
      bouquet.position.set(0.02, -0.56, 0.1);
      this.leftArm.add(bouquet);
    }
  }

  public getHeadWorldPos(target = new THREE.Vector3()): THREE.Vector3 {
    this.headGroup.getWorldPosition(target);
    target.y += 0.48;
    return target;
  }

  public showWisp(text: string, duration = 4.6): void {
    this.activeWispText = text;
    this.wispTimer = duration;
  }

  public setTalking(talking: boolean): void {
    this.isTalkingNow = talking;
  }

  public triggerLeafReaction(): void {
    this.reactTimer = 4.2;
    this.showWisp(this.profile.leafReaction, 4.4);
  }

  public setConverseWithPlayer(active: boolean): void {
    if (active) {
      this.state = 'converse-player';
      this.activeWispText = null;
    } else {
      this.state = this.profile.behavior === 'admire' ? 'bench-rest' : this.profile.behavior;
    }
  }

  public update(
    dt: number,
    elapsed: number,
    playerPos: THREE.Vector3,
    getGroundHeight: (x: number, z: number) => number,
    partnerPos?: THREE.Vector3
  ): void {
    this.gesturePhase += dt * 2.4;
    this.greetCooldown = Math.max(0, this.greetCooldown - dt);

    if (this.wispTimer > 0) {
      this.wispTimer -= dt;
      if (this.wispTimer <= 0) {
        this.activeWispText = null;
      }
    }

    const pos = this.group.position;
    const distToPlayer = pos.distanceTo(playerPos);

    // Check reactive states priority: converse-player > react-leaves > greet > routine
    let effectiveState: AgentState = this.state;
    if (this.state === 'converse-player') {
      effectiveState = 'converse-player';
    } else if (this.reactTimer > 0) {
      this.reactTimer -= dt;
      effectiveState = 'react-leaves';
    } else if (distToPlayer < 6.4 && this.greetTimer <= 0 && this.greetCooldown <= 0) {
      // GTA-style organic player-approach greeting reaction!
      this.greetTimer = 2.6;
      this.greetCooldown = 18.0;
      const line = this.profile.greetingLines[this.lastGreetIdx % this.profile.greetingLines.length];
      this.lastGreetIdx++;
      if (!this.activeWispText) {
        this.showWisp(line, 4.5);
      }
    }

    if (this.greetTimer > 0 && effectiveState !== 'converse-player' && effectiveState !== 'react-leaves') {
      this.greetTimer -= dt;
      effectiveState = 'greet';
    }

    // --- Locomotion & Facing ---
    let walkSpeed = 0;
    if (effectiveState === 'stroll' && this.profile.patrolPoints && this.profile.patrolPoints.length > 1) {
      if (this.waitTimer > 0) {
        this.waitTimer -= dt;
      } else {
        const [tx, tz] = this.profile.patrolPoints[this.waypointIdx];
        const dx = tx - pos.x;
        const dz = tz - pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.35) {
          this.waypointIdx = (this.waypointIdx + 1) % this.profile.patrolPoints.length;
          this.waitTimer = 2.8 + Math.random() * 2.5; // Pause naturally to admire the Terrace!
        } else {
          walkSpeed = 1.15;
          pos.x += (dx / d) * walkSpeed * dt;
          pos.z += (dz / d) * walkSpeed * dt;
          const targetYaw = Math.atan2(dx, dz);
          this.smoothRotateY(targetYaw, dt * 3.0);
        }
      }
    } else if (effectiveState === 'greet' || effectiveState === 'converse-player') {
      const targetYaw = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
      this.smoothRotateY(targetYaw, dt * 3.6);
    } else if (effectiveState === 'pair-talk' && partnerPos) {
      const targetYaw = Math.atan2(partnerPos.x - pos.x, partnerPos.z - pos.z);
      this.smoothRotateY(targetYaw, dt * 2.2);
    }

    // Keep feet planted smoothly on terrain
    const gy = getGroundHeight(pos.x, pos.z);
    pos.y = gy;

    // --- Articulated Limb & Head Animations ---
    const breath = Math.sin(elapsed * 1.8 + this.gesturePhase * 0.2) * 0.018;
    const stride = walkSpeed > 0.1 ? Math.sin(elapsed * 5.5) : 0;

    this.hips.position.y = 0.92 + breath + Math.abs(stride) * 0.035;
    this.leftLeg.rotation.x = stride * 0.42;
    this.rightLeg.rotation.x = -stride * 0.42;

    // Default arm targets
    let lArmX = -stride * 0.35;
    let lArmZ = 0.08;
    let rArmX = stride * 0.35;
    let rArmZ = -0.08;
    let headPitch = 0;

    if (effectiveState === 'greet') {
      // Warm raised welcoming wave!
      rArmX = -2.35;
      rArmZ = -0.45 + Math.sin(elapsed * 9.0) * 0.28;
      lArmX = -0.25;
      headPitch = -0.05;
    } else if (effectiveState === 'react-leaves') {
      // Open-armed awe lifting face toward the golden healing wave
      lArmX = -1.25;
      lArmZ = 0.55;
      rArmX = -1.25;
      rArmZ = -0.55;
      headPitch = -0.28;
    } else if (effectiveState === 'harp-play') {
      // King David softly strumming his golden harp!
      lArmX = -0.78;
      lArmZ = 0.28;
      rArmX = -0.82 + Math.sin(elapsed * 4.2) * 0.14;
      rArmZ = -0.18 + Math.cos(elapsed * 3.1) * 0.1;
      headPitch = 0.08 + Math.sin(elapsed * 1.6) * 0.05;
    } else if (effectiveState === 'converse-player' || (effectiveState === 'pair-talk' && this.isTalkingNow)) {
      // Expressive storytelling hand gestures
      lArmX = -0.65 + Math.sin(this.gesturePhase) * 0.24;
      lArmZ = 0.22 + Math.cos(this.gesturePhase * 0.7) * 0.12;
      rArmX = -0.72 + Math.cos(this.gesturePhase * 1.15) * 0.28;
      rArmZ = -0.24 - Math.sin(this.gesturePhase * 0.8) * 0.12;
      headPitch = Math.sin(this.gesturePhase * 0.6) * 0.08;
    } else if (effectiveState === 'pair-talk') {
      // Attentive listening posture with warm subtle nods
      lArmX = -0.22;
      rArmX = -0.18;
      headPitch = Math.max(0, Math.sin(elapsed * 2.1 + this.gesturePhase)) * 0.12;
    }

    const blend = Math.min(1, dt * 6.5);
    this.leftArm.rotation.x += (lArmX - this.leftArm.rotation.x) * blend;
    this.leftArm.rotation.z += (lArmZ - this.leftArm.rotation.z) * blend;
    this.rightArm.rotation.x += (rArmX - this.rightArm.rotation.x) * blend;
    this.rightArm.rotation.z += (rArmZ - this.rightArm.rotation.z) * blend;
    this.headGroup.rotation.x += (headPitch - this.headGroup.rotation.x) * blend;

    // Subtle independent head-tracking toward passing player when within 10m!
    let targetHeadYaw = 0;
    if (distToPlayer < 10.5 && effectiveState !== 'converse-player') {
      const worldAngle = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
      let rel = worldAngle - this.group.rotation.y;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      targetHeadYaw = THREE.MathUtils.clamp(rel, -0.72, 0.72);
    }
    this.headGroup.rotation.y += (targetHeadYaw - this.headGroup.rotation.y) * Math.min(1, dt * 4.5);

    // Subtle pulsing ground fellowship ring when player is near
    const haloMat = this.haloRing.material as THREE.MeshBasicMaterial;
    haloMat.opacity = distToPlayer < 6 ? 0.55 + Math.sin(elapsed * 3) * 0.15 : 0.34;
  }

  private smoothRotateY(targetYaw: number, alpha: number): void {
    let diff = targetYaw - this.group.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.group.rotation.y += diff * Math.min(1, alpha);
  }
}
