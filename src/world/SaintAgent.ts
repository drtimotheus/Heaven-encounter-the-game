import * as THREE from 'three';
import { SaintProfile } from '../data/dialogues';
import { PBRMaterialMaps } from './ProceduralTextures';

export type AgentState = 'stroll' | 'pair-talk' | 'harp-play' | 'bench-rest' | 'greet' | 'react-leaves' | 'converse-player';

/**
 * Art-Directed Sculpted Living NPC Agent (GTA 6–Inspired Reactive Fellowship)
 * Uses smooth Lathe-sculpted draped robes with woven fabric PBR normal/roughness maps,
 * sculpted neck/head/eyes/brows/nose, articulated arms/legs, signature biblical props,
 * proximity head-tracking, approach greetings, and synchronized world reactions.
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

  public activeWispText: string | null = null;
  private wispTimer = 0;

  constructor(profile: SaintProfile, groundY: number, fabricMaps: PBRMaterialMaps) {
    this.profile = profile;
    this.state = profile.behavior === 'admire' ? 'bench-rest' : profile.behavior;
    this.group.position.set(profile.position[0], groundY, profile.position[2]);
    this.buildSculptedRig(fabricMaps);
    this.group.lookAt(profile.lookAt[0], groundY, profile.lookAt[2]);
  }

  private buildSculptedRig(fabric: PBRMaterialMaps): void {
    const p = this.profile;

    this.hips.position.y = 0.9;
    this.group.add(this.hips);

    const lowerMat = new THREE.MeshStandardMaterial({
      color: p.robeLowerColor,
      map: fabric.map,
      normalMap: fabric.normalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: fabric.roughnessMap,
      roughness: 0.86,
      side: THREE.DoubleSide
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: p.shirtColor,
      map: fabric.map,
      normalMap: fabric.normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughnessMap: fabric.roughnessMap,
      roughness: 0.78
    });
    const vestMat = new THREE.MeshStandardMaterial({
      color: p.vestColor,
      map: fabric.map,
      normalMap: fabric.normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughnessMap: fabric.roughnessMap,
      roughness: 0.72,
      side: THREE.DoubleSide
    });
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: p.skinColor,
      roughness: 0.52,
      metalness: 0.0,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xffd7ba),
      sheenRoughness: 0.65
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: p.hairColor,
      roughness: 0.84,
      metalness: 0.04
    });

    // Sculpted Capsule Legs + Sandaled Feet
    const legGeo = new THREE.CapsuleGeometry(0.085, 0.66, 6, 12);
    legGeo.translate(0, -0.44, 0);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x5c412d, roughness: 0.85 });

    this.leftLeg.position.set(-0.13, 0, 0);
    const lLeg = new THREE.Mesh(legGeo, lowerMat);
    lLeg.castShadow = true;
    this.leftLeg.add(lLeg);
    const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.22), shoeMat);
    lFoot.position.set(0, -0.86, 0.04);
    this.leftLeg.add(lFoot);
    this.hips.add(this.leftLeg);

    this.rightLeg.position.set(0.13, 0, 0);
    const rLeg = new THREE.Mesh(legGeo, lowerMat);
    rLeg.castShadow = true;
    this.rightLeg.add(rLeg);
    const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.22), shoeMat);
    rFoot.position.set(0, -0.86, 0.04);
    this.rightLeg.add(rFoot);
    this.hips.add(this.rightLeg);

    // Smooth Lathe-Sculpted Draped Lower Tunic / Robe Skirt
    const skirtProfile = [
      new THREE.Vector2(0.35, -0.78),
      new THREE.Vector2(0.31, -0.46),
      new THREE.Vector2(0.25, -0.14),
      new THREE.Vector2(0.22, 0.04)
    ];
    const skirt = new THREE.Mesh(new THREE.LatheGeometry(skirtProfile, 22), lowerMat);
    skirt.castShadow = true;
    skirt.receiveShadow = true;
    this.hips.add(skirt);

    // Smooth Lathe-Sculpted Upper Torso + Shoulders + Waist Sash
    const torsoProfile = [
      new THREE.Vector2(0.21, 0.0),
      new THREE.Vector2(0.23, 0.22),
      new THREE.Vector2(0.27, 0.52),
      new THREE.Vector2(0.23, 0.68),
      new THREE.Vector2(0.11, 0.72)
    ];
    const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoProfile, 22), shirtMat);
    torso.scale.set(1.06, 1.0, 0.78);
    torso.castShadow = true;
    torso.receiveShadow = true;
    this.hips.add(torso);

    // Woven Belt / Waist Sash
    const belt = new THREE.Mesh(
      new THREE.TorusGeometry(0.225, 0.036, 10, 24),
      new THREE.MeshStandardMaterial({ color: p.vestColor, roughness: 0.75 })
    );
    belt.rotation.x = Math.PI / 2;
    belt.scale.set(1.06, 0.78, 1);
    belt.position.y = 0.06;
    this.hips.add(belt);

    // Layered Draped Mantle / Vest / Suspenders
    if (p.id === 'elias') {
      // Elias's iconic brown leather suspenders over blue denim shirt!
      const strapMat = new THREE.MeshStandardMaterial({ color: 0x6e3d1e, roughness: 0.58 });
      [-0.12, 0.12].forEach((sx) => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.64, 0.39), strapMat);
        strap.position.set(sx, 0.35, 0);
        this.hips.add(strap);
      });
    } else {
      const cloakProfile = [
        new THREE.Vector2(0.25, 0.02),
        new THREE.Vector2(0.27, 0.32),
        new THREE.Vector2(0.295, 0.58),
        new THREE.Vector2(0.21, 0.7)
      ];
      const cloak = new THREE.Mesh(
        new THREE.LatheGeometry(cloakProfile, 20, -Math.PI * 0.78, Math.PI * 1.56),
        vestMat
      );
      cloak.scale.set(1.08, 1.0, 0.82);
      cloak.castShadow = true;
      this.hips.add(cloak);

      if (p.category !== 'novel') {
        // Flowing diagonal biblical mantle over shoulder
        const sash = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.64, 6, 10), vestMat);
        sash.position.set(-0.14, 0.37, 0.08);
        sash.rotation.z = -0.34;
        sash.scale.set(1.0, 1.0, 1.45);
        this.hips.add(sash);
      }
    }

    // Neck + Sculpted Head Group with Expressive Facial Features
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.082, 0.14, 12), skinMat);
    neck.position.y = 0.72;
    this.hips.add(neck);

    this.headGroup.position.set(0, 0.78, 0);
    this.hips.add(this.headGroup);

    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 18), skinMat);
    cranium.scale.set(0.92, 1.08, 0.98);
    cranium.position.y = 0.16;
    cranium.castShadow = true;
    this.headGroup.add(cranium);

    // Subtle Nose Bridge & Eyes + Brows so faces read warmly up close
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.07, 8), skinMat);
    nose.rotation.x = Math.PI * 0.42;
    nose.position.set(0, 0.145, 0.165);
    this.headGroup.add(nose);

    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x261d18, roughness: 0.2 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf7f2ea, roughness: 0.35 });
    [-0.056, 0.056].forEach((ex) => {
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), whiteMat);
      sclera.position.set(ex, 0.175, 0.142);
      this.headGroup.add(sclera);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 10), eyeMat);
      iris.position.set(ex, 0.175, 0.156);
      this.headGroup.add(iris);

      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.012, 0.015), hairMat);
      brow.position.set(ex, 0.21, 0.148);
      this.headGroup.add(brow);
    });

    // Sculpted Hair Volume + Curls/Waves
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.184, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    hairCap.scale.set(0.96, 1.06, 1.02);
    hairCap.position.set(0, 0.18, -0.012);
    this.headGroup.add(hairCap);

    // Back hair / curls
    const backHair = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 12), hairMat);
    backHair.scale.set(1.05, p.hasHeadscarf || p.id === 'mara' ? 1.45 : 0.95, 0.72);
    backHair.position.set(0, p.hasHeadscarf || p.id === 'mara' ? 0.08 : 0.14, -0.09);
    this.headGroup.add(backHair);

    if (p.hasBeard) {
      const beard = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 12), hairMat);
      beard.scale.set(0.92, 1.15, 0.78);
      beard.position.set(0, 0.035, 0.075);
      this.headGroup.add(beard);

      const mustache = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.08, 4, 8), hairMat);
      mustache.rotation.z = Math.PI / 2;
      mustache.position.set(0, 0.105, 0.15);
      this.headGroup.add(mustache);
    }

    if (p.hasHeadscarf) {
      const veil = new THREE.Mesh(
        new THREE.LatheGeometry(
          [
            new THREE.Vector2(0.24, -0.18),
            new THREE.Vector2(0.22, 0.06),
            new THREE.Vector2(0.2, 0.26),
            new THREE.Vector2(0.08, 0.35)
          ],
          18,
          Math.PI * 0.25,
          Math.PI * 1.5
        ),
        vestMat
      );
      veil.position.set(0, 0.02, -0.02);
      this.headGroup.add(veil);
    }

    // Sculpted Capsule Arms with Sleeves & Hands
    const sleeveGeo = new THREE.CapsuleGeometry(0.068, 0.32, 6, 12);
    sleeveGeo.translate(0, -0.18, 0);
    const forearmGeo = new THREE.CapsuleGeometry(0.052, 0.24, 6, 10);
    forearmGeo.translate(0, -0.44, 0);
    const handGeo = new THREE.SphereGeometry(0.056, 10, 10);

    this.leftArm.position.set(-0.29, 0.62, 0);
    const lSleeve = new THREE.Mesh(sleeveGeo, shirtMat);
    lSleeve.castShadow = true;
    this.leftArm.add(lSleeve);
    this.leftArm.add(new THREE.Mesh(forearmGeo, skinMat));
    const lHand = new THREE.Mesh(handGeo, skinMat);
    lHand.position.y = -0.58;
    this.leftArm.add(lHand);
    this.hips.add(this.leftArm);

    this.rightArm.position.set(0.29, 0.62, 0);
    const rSleeve = new THREE.Mesh(sleeveGeo, shirtMat);
    rSleeve.castShadow = true;
    this.rightArm.add(rSleeve);
    this.rightArm.add(new THREE.Mesh(forearmGeo, skinMat));
    const rHand = new THREE.Mesh(handGeo, skinMat);
    rHand.position.y = -0.58;
    this.rightArm.add(rHand);
    this.hips.add(this.rightArm);

    this.attachProp(p.prop);

    // Subtle soft ground contact shadow + warm fellowship ring
    const contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.46, 24),
      new THREE.MeshBasicMaterial({ color: 0x1a2016, transparent: true, opacity: 0.24, depthWrite: false })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.03;
    this.group.add(contactShadow);

    this.haloRing = new THREE.Mesh(
      new THREE.RingGeometry(0.84, 0.96, 36),
      new THREE.MeshBasicMaterial({
        color: p.auraColor,
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    this.haloRing.rotation.x = -Math.PI / 2;
    this.haloRing.position.y = 0.05;
    this.group.add(this.haloRing);
  }

  private attachProp(prop: SaintProfile['prop']): void {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf7cf6b,
      emissive: 0x6b4b08,
      emissiveIntensity: 0.45,
      metalness: 0.82,
      roughness: 0.2
    });

    if (prop === 'harp') {
      const harp = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.028, 10, 28, Math.PI * 1.35), goldMat);
      harp.add(frame);
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.56, 10), goldMat);
      pillar.position.set(-0.24, 0, 0);
      harp.add(pillar);
      // Shimmering golden harp strings
      const strMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.75 });
      for (let i = 0; i < 6; i++) {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.46 - i * 0.04, 4), strMat);
        s.position.set(-0.18 + i * 0.065, -0.02, 0);
        harp.add(s);
      }
      harp.position.set(0.18, -0.45, 0.22);
      harp.rotation.y = 0.4;
      this.leftArm.add(harp);
    } else if (prop === 'scroll') {
      const scroll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.042, 0.36, 14),
        new THREE.MeshStandardMaterial({ color: 0xfaf0d7, roughness: 0.6 })
      );
      scroll.rotation.z = Math.PI / 2;
      scroll.position.set(0.04, -0.56, 0.08);
      this.leftArm.add(scroll);
    } else if (prop === 'staff') {
      const staff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.032, 1.98, 10),
        new THREE.MeshStandardMaterial({ color: 0x6f4e32, roughness: 0.85 })
      );
      staff.position.set(0.06, -0.34, 0.14);
      this.rightArm.add(staff);
    } else if (prop === 'flowers') {
      const bouquet = new THREE.Group();
      const colors = [0xffb8d9, 0x9ee6ff, 0xfff199];
      colors.forEach((c, idx) => {
        const bloom = new THREE.Mesh(
          new THREE.SphereGeometry(0.068, 10, 8),
          new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35 })
        );
        bloom.position.set((idx - 1) * 0.065, 0.05 + (idx % 2) * 0.045, 0.04);
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

    let effectiveState: AgentState = this.state;
    if (this.state === 'converse-player') {
      effectiveState = 'converse-player';
    } else if (this.reactTimer > 0) {
      this.reactTimer -= dt;
      effectiveState = 'react-leaves';
    } else if (distToPlayer < 6.4 && this.greetTimer <= 0 && this.greetCooldown <= 0) {
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
          this.waitTimer = 2.8 + Math.random() * 2.5;
        } else {
          walkSpeed = 1.12;
          pos.x += (dx / d) * walkSpeed * dt;
          pos.z += (dz / d) * walkSpeed * dt;
          this.smoothRotateY(Math.atan2(dx, dz), dt * 3.0);
        }
      }
    } else if (effectiveState === 'greet' || effectiveState === 'converse-player') {
      this.smoothRotateY(Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z), dt * 3.6);
    } else if (effectiveState === 'pair-talk' && partnerPos) {
      this.smoothRotateY(Math.atan2(partnerPos.x - pos.x, partnerPos.z - pos.z), dt * 2.2);
    }

    pos.y = getGroundHeight(pos.x, pos.z);

    const breath = Math.sin(elapsed * 1.8 + this.gesturePhase * 0.2) * 0.016;
    const stride = walkSpeed > 0.1 ? Math.sin(elapsed * 5.2) : 0;

    this.hips.position.y = 0.9 + breath + Math.abs(stride) * 0.032;
    this.leftLeg.rotation.x = stride * 0.4;
    this.rightLeg.rotation.x = -stride * 0.4;

    let lArmX = -stride * 0.32;
    let lArmZ = 0.08;
    let rArmX = stride * 0.32;
    let rArmZ = -0.08;
    let headPitch = 0;

    if (effectiveState === 'greet') {
      rArmX = -2.35;
      rArmZ = -0.45 + Math.sin(elapsed * 9.0) * 0.26;
      lArmX = -0.22;
      headPitch = -0.04;
    } else if (effectiveState === 'react-leaves') {
      lArmX = -1.25;
      lArmZ = 0.55;
      rArmX = -1.25;
      rArmZ = -0.55;
      headPitch = -0.26;
    } else if (effectiveState === 'harp-play') {
      lArmX = -0.78;
      lArmZ = 0.26;
      rArmX = -0.82 + Math.sin(elapsed * 4.2) * 0.14;
      rArmZ = -0.18 + Math.cos(elapsed * 3.1) * 0.1;
      headPitch = 0.08 + Math.sin(elapsed * 1.6) * 0.05;
    } else if (effectiveState === 'converse-player' || (effectiveState === 'pair-talk' && this.isTalkingNow)) {
      lArmX = -0.62 + Math.sin(this.gesturePhase) * 0.22;
      lArmZ = 0.2 + Math.cos(this.gesturePhase * 0.7) * 0.12;
      rArmX = -0.68 + Math.cos(this.gesturePhase * 1.15) * 0.26;
      rArmZ = -0.22 - Math.sin(this.gesturePhase * 0.8) * 0.12;
      headPitch = Math.sin(this.gesturePhase * 0.6) * 0.07;
    } else if (effectiveState === 'pair-talk') {
      lArmX = -0.2;
      rArmX = -0.16;
      headPitch = Math.max(0, Math.sin(elapsed * 2.1 + this.gesturePhase)) * 0.11;
    }

    const blend = Math.min(1, dt * 6.5);
    this.leftArm.rotation.x += (lArmX - this.leftArm.rotation.x) * blend;
    this.leftArm.rotation.z += (lArmZ - this.leftArm.rotation.z) * blend;
    this.rightArm.rotation.x += (rArmX - this.rightArm.rotation.x) * blend;
    this.rightArm.rotation.z += (rArmZ - this.rightArm.rotation.z) * blend;
    this.headGroup.rotation.x += (headPitch - this.headGroup.rotation.x) * blend;

    let targetHeadYaw = 0;
    if (distToPlayer < 10.5 && effectiveState !== 'converse-player') {
      const worldAngle = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
      let rel = worldAngle - this.group.rotation.y;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      targetHeadYaw = THREE.MathUtils.clamp(rel, -0.7, 0.7);
    }
    this.headGroup.rotation.y += (targetHeadYaw - this.headGroup.rotation.y) * Math.min(1, dt * 4.5);

    const haloMat = this.haloRing.material as THREE.MeshBasicMaterial;
    haloMat.opacity = distToPlayer < 6 ? 0.45 + Math.sin(elapsed * 3) * 0.12 : 0.24;
  }

  private smoothRotateY(targetYaw: number, alpha: number): void {
    let diff = targetYaw - this.group.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.group.rotation.y += diff * Math.min(1, alpha);
  }
}
