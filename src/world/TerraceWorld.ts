import * as THREE from 'three';
import { AMBIENT_BANTER_PAIRS, SAINTS } from '../data/dialogues';
import { SaintAgent } from './SaintAgent';
import type { GraphicsQuality, WorldGraphics } from './graphics';

export interface InteractablePoint {
  id: string;
  label: string;
  sublabel: string;
  position: THREE.Vector3;
  radius: number;
  type: 'saint' | 'leaves' | 'pool' | 'mist' | 'overlook';
  dialogueId: string;
  seatPos?: THREE.Vector3;
  seatLookAt?: THREE.Vector3;
}

interface PrismaticBird {
  mesh: THREE.Group;
  trail: THREE.Line;
  trailPositions: Float32Array;
  angle: number;
  speed: number;
  radius: number;
  height: number;
  center: THREE.Vector3;
}

export class TerraceWorld {
  public readonly group = new THREE.Group();
  public readonly interactables: InteractablePoint[] = [];

  private grassMaterial!: THREE.ShaderMaterial;
  private grassMesh!: THREE.InstancedMesh;
  private waterMaterial!: THREE.Material;
  private waterMesh!: THREE.Mesh;
  private seaMesh!: THREE.Mesh;
  private riverNormal: THREE.Texture | null = null;
  private terrainMat!: THREE.MeshStandardMaterial;
  private stoneMat!: THREE.MeshStandardMaterial;
  private marbleMat!: THREE.MeshStandardMaterial;
  private woodMat!: THREE.MeshStandardMaterial;
  private barkMat!: THREE.MeshStandardMaterial;
  private wallMat!: THREE.MeshStandardMaterial;
  private readonly trees: { group: THREE.Group; scale: number; healing: boolean }[] = [];
  private gateGroup!: THREE.Group;
  private flowerMesh!: THREE.InstancedMesh;
  private readonly plainColumns: THREE.Mesh[] = [];
  private poolMaterial!: THREE.ShaderMaterial;
  private pearlMaterial!: THREE.ShaderMaterial;
  private birds: PrismaticBird[] = [];
  private fallingLeaves!: THREE.Points;
  private leafBurstParticles!: THREE.Points;
  private leafBurstTime = -1;
  private mistClouds: THREE.Mesh[] = [];
  public readonly saintAgents: Map<string, SaintAgent> = new Map();
  private banterStates: Map<string, { lineIdx: number; timer: number }> = new Map();
  private sunLight!: THREE.DirectionalLight;

  constructor() {
    this.buildSkyAndLighting();
    this.buildTerrainAndRiver();
    this.buildLivingGrass();
    this.buildWildflowers();
    this.buildBridgeAndWalkways();
    this.buildWalledOrchard();
    this.buildMemoryPavilion();
    this.buildGrayMistFork();
    this.buildDistantCityAndPearlGate();
    this.buildPrismaticBirds();
    this.buildSaintsAndBenches();
    this.buildHealingLeafBurst();
  }

  public setShadowQuality(quality: GraphicsQuality): void {
    const size = quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512;
    this.sunLight.shadow.mapSize.set(size, size);
    this.sunLight.shadow.radius = quality === 'low' ? 1 : 3.2;
    if (this.sunLight.shadow.map) {
      this.sunLight.shadow.map.dispose();
      this.sunLight.shadow.map = null;
    }
  }

  /** Swap flat colors for CC0 PBR maps, physical water, and leaf-card canopies. */
  public applyPbr(gfx: WorldGraphics): void {
    const normals = gfx.quality !== 'low';
    const paint = (
      mat: THREE.MeshStandardMaterial,
      map: THREE.Texture,
      normal?: THREE.Texture,
      rough?: THREE.Texture
    ) => {
      mat.map = map;
      mat.normalMap = normals && normal ? normal : null;
      mat.roughnessMap = rough ?? null;
      mat.color.set(0xffffff);
      mat.needsUpdate = true;
    };

    paint(this.terrainMat, gfx.grass.map, gfx.grass.normal, gfx.grass.rough);
    this.terrainMat.color.set(0xe4f6c2);
    this.terrainMat.normalScale.set(0.65, 0.65);
    this.terrainMat.onBeforeCompile = (shader) => {
      shader.uniforms.uSand = { value: gfx.sand.map };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D uSand;')
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
           vec3 sandCol = texture2D(uSand, vMapUv * 0.5).rgb;
           float sandMix = smoothstep(0.48, 0.2, vColor.g);
           diffuseColor.rgb = mix(diffuseColor.rgb, sandCol, sandMix);
           diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.84, 0.4), 0.22 * (1.0 - sandMix));`
        );
    };
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || mesh.material !== this.terrainMat) return;
      const attr = mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
      for (let i = 0; i < attr.count; i++) {
        attr.setXYZ(
          i,
          THREE.MathUtils.lerp(attr.getX(i), 1, 0.58),
          THREE.MathUtils.lerp(attr.getY(i), 1, 0.5),
          THREE.MathUtils.lerp(attr.getZ(i), 1, 0.68)
        );
      }
      attr.needsUpdate = true;
    });

    paint(this.stoneMat, gfx.marble.map, gfx.marble.normal, gfx.marble.rough);
    paint(this.wallMat, gfx.marble.map, gfx.marble.normal, gfx.marble.rough);
    paint(this.marbleMat, gfx.marble.map, gfx.marble.normal, gfx.marble.rough);
    paint(this.barkMat, gfx.bark.map, gfx.bark.normal);
    paint(this.woodMat, gfx.wood.map, gfx.wood.normal);
    this.wallMat.color.set(0xfff4e6);
    this.marbleMat.color.set(0xfff8ef);

    const seaNormal = gfx.waterNormal.clone();
    seaNormal.repeat.set(8, 8);
    this.riverNormal = gfx.waterNormal;
    const riverMat = new THREE.MeshPhysicalMaterial({
      color: 0x7ecfc4,
      roughness: 0.14,
      metalness: 0.04,
      transmission: 0.22,
      thickness: 0.55,
      ior: 1.33,
      transparent: true,
      opacity: 0.9,
      attenuationColor: new THREE.Color(0x1f8f86),
      attenuationDistance: 1.4,
      envMapIntensity: 1.15,
      normalMap: gfx.waterNormal,
      normalScale: new THREE.Vector2(0.45, 0.45)
    });
    this.waterMesh.material = riverMat;
    this.waterMaterial = riverMat;

    this.seaMesh.material = new THREE.MeshPhysicalMaterial({
      color: 0x9fd0f4,
      roughness: 0.03,
      metalness: 0.08,
      transmission: 0.28,
      thickness: 0.45,
      ior: 1.33,
      transparent: true,
      opacity: 0.92,
      envMapIntensity: 1.5,
      normalMap: seaNormal,
      normalScale: new THREE.Vector2(0.05, 0.05)
    });

    const leafMat = new THREE.MeshStandardMaterial({
      map: gfx.leaf,
      transparent: true,
      alphaTest: 0.38,
      roughness: 0.58,
      side: THREE.DoubleSide,
      color: 0xf3ffe6
    });
    const healingLeaf = leafMat.clone();
    healingLeaf.emissive = new THREE.Color(0x7cb85a);
    healingLeaf.emissiveIntensity = 0.16;
    const card = new THREE.PlaneGeometry(1, 1);
    for (const tree of this.trees) {
      const remove: THREE.Object3D[] = [];
      tree.group.traverse((obj) => {
        if (obj.userData.kind === 'crown') remove.push(obj);
      });
      remove.forEach((obj) => obj.parent?.remove(obj));
      const mat = tree.healing ? healingLeaf : leafMat;
      const spots: [number, number, number][] = [
        [0, 3.45, 0],
        [0.85, 3.1, 0.4],
        [-0.8, 3.2, -0.35],
        [0.1, 4.2, -0.2]
      ];
      for (const [x, y, z] of spots) {
        for (const yaw of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
          const leaf = new THREE.Mesh(card, mat);
          leaf.scale.set(1.65 * tree.scale, 1.2 * tree.scale, 1);
          leaf.position.set(x * tree.scale, y * tree.scale, z * tree.scale);
          leaf.rotation.y = yaw;
          leaf.castShadow = gfx.quality !== 'low';
          tree.group.add(leaf);
        }
      }
    }

    this.grassMesh.count = 0;
    if (this.flowerMesh) this.flowerMesh.count = 0;
    this.dressHeaven(gfx);
  }

  private dressHeaven(gfx: WorldGraphics): void {
    const count = gfx.quality === 'low' ? 18 : gfx.quality === 'medium' ? 36 : 56;
    this.scatterProp(gfx.props.grass, count, 0.85);
    this.scatterProp(gfx.props.flowers, Math.floor(count * 0.55), 1);
    this.scatterProp(gfx.props.fern, gfx.quality === 'low' ? 4 : 8, 1.1);

    const columnMat = new THREE.MeshStandardMaterial({
      color: 0xfff8ef,
      map: gfx.marble.map,
      normalMap: gfx.quality === 'low' ? null : gfx.marble.normal,
      roughnessMap: gfx.marble.rough,
      roughness: 0.38,
      metalness: 0.04
    });
    this.plainColumns.forEach((col) => {
      col.visible = false;
      const ionic = gfx.props.column.clone(true);
      ionic.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) mesh.material = columnMat;
      });
      ionic.scale.setScalar(0.82);
      ionic.position.copy(col.position);
      ionic.position.y -= 2.2;
      col.parent?.add(ionic);
    });

    const jasper = new THREE.MeshStandardMaterial({
      color: 0xd7f3e4,
      map: gfx.marble.map,
      normalMap: gfx.quality === 'low' ? null : gfx.marble.normal,
      roughness: 0.38,
      metalness: 0.08,
      emissive: 0x8fb89a,
      emissiveIntensity: 0.12
    });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xf2c96b,
      roughness: 0.28,
      metalness: 0.72,
      emissive: 0x6a4a10,
      emissiveIntensity: 0.2
    });
    this.gateGroup.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.userData.kind === 'jasper-wall') mesh.material = jasper;
    });
    [-8.2, 8.2].forEach((x) => {
      const ionic = gfx.props.column.clone(true);
      ionic.scale.setScalar(2.15);
      ionic.position.set(x, -1.6, 0);
      ionic.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.material = columnMat;
          mesh.castShadow = gfx.quality !== 'low';
        }
      });
      this.gateGroup.add(ionic);
    });
    const goldRim = new THREE.Mesh(new THREE.TorusGeometry(8.2, 0.18, 12, 48, Math.PI), gold);
    goldRim.position.y = 3.6;
    this.gateGroup.add(goldRim);
    const innerPearl = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.55, 20, 48, Math.PI), this.pearlMaterial);
    innerPearl.position.y = 3.3;
    this.gateGroup.add(innerPearl);
    [-16, 16].forEach((x) => {
      const course = new THREE.Mesh(new THREE.BoxGeometry(16, 0.28, 2.8), gold);
      course.position.set(x, 9.4, 0);
      this.gateGroup.add(course);
      const base = new THREE.Mesh(new THREE.BoxGeometry(16, 0.22, 2.8), gold);
      base.position.set(x, 0.7, 0);
      this.gateGroup.add(base);
      for (let i = 0; i < 10; i++) {
        const dentil = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.28), gold);
        dentil.position.set(x - 7 + i * 1.45, 9.05, 1.35);
        this.gateGroup.add(dentil);
      }
    });

    if (gfx.quality !== 'low') {
      const shaftMat = new THREE.MeshBasicMaterial({
        color: 0xfff1c4,
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const spots: [number, number][] = [[-6, 4], [8, -2], [-14, -8], [3, 10], [12, 6]];
      spots.forEach(([x, z], i) => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.8, 14, 8, 1, true), shaftMat);
        shaft.position.set(x, this.getGroundHeight(x, z) + 7, z);
        shaft.rotation.z = 0.35;
        shaft.rotation.y = i;
        this.group.add(shaft);
      });
    }
  }

  private scatterProp(template: THREE.Object3D, count: number, scale: number): void {
    const parts: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = [];
    template.updateMatrixWorld(true);
    template.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      parts.push({ geometry, material });
    });
    for (const part of parts) {
      const inst = new THREE.InstancedMesh(part.geometry, part.material, count);
      inst.castShadow = true;
      inst.receiveShadow = true;
      const dummy = new THREE.Object3D();
      let placed = 0;
      for (let n = 0; n < count * 6 && placed < count; n++) {
        const x = (Math.random() - 0.5) * 48;
        const z = (Math.random() - 0.5) * 46 - 2;
        if (Math.abs(x - this.getRiverCenterX(z)) < 4.2) continue;
        if (Math.hypot(x - 14, z + 10) < 5.5) continue;
        if (x > 20) continue;
        dummy.position.set(x, this.getGroundHeight(x, z), z);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        const s = scale * (0.75 + Math.random() * 0.7);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        inst.setMatrixAt(placed++, dummy.matrix);
      }
      inst.count = placed;
      inst.instanceMatrix.needsUpdate = true;
      this.group.add(inst);
    }
  }

  public getGroundHeight(x: number, z: number): number {
    // Gentle rolling Mediterranean hillside rising gently toward the north (negative Z = Rising Road)
    const gentleHills =
      Math.sin(x * 0.065) * 0.55 +
      Math.cos(z * 0.06) * 0.45 +
      Math.sin((x + z) * 0.04) * 0.35;

    // River channel runs along x ≈ -4 + sin(z * 0.08) * 3.5
    const riverCenter = this.getRiverCenterX(z);
    const distRiver = Math.abs(x - riverCenter);
    const riverDip = distRiver < 4.5 ? -Math.cos((distRiver / 4.5) * (Math.PI / 2)) * 1.15 : 0;

    // Gentle upward slope along the Rising Road (z < -18)
    const risingSlope = z < -18 ? Math.min(4.2, (-18 - z) * 0.16) : 0;

    // Gentle dip down toward Gray Mist canyon on far east (x > 21)
    const mistDip = x > 21 ? -Math.min(5.5, (x - 21) * 0.42) : 0;

    // Flatten the Arrival Meadow, Pavilion, and Orchard slightly for clean architecture
    const pavDist = Math.hypot(x - 14, z + 10);
    const flattenPav = pavDist < 6 ? Math.max(0, 1 - pavDist / 6) : 0;
    const rawH = gentleHills + riverDip + risingSlope + mistDip;
    return rawH * (1 - flattenPav * 0.85) + 0.25 * flattenPav;
  }

  public getRiverCenterX(z: number): number {
    return -3.2 + Math.sin(z * 0.08) * 3.2;
  }

  private buildSkyAndLighting(): void {
    // Warm banked-glory sky dome shader
    const skyGeo = new THREE.SphereGeometry(240, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x5288c4) },
        midColor: { value: new THREE.Color(0xf6d8a8) },
        horizonColor: { value: new THREE.Color(0xfff1cf) },
        sunDir: { value: new THREE.Vector3(0.72, 0.48, -0.42).normalize() }
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        uniform vec3 sunDir;
        varying vec3 vWorldPos;
        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y, 0.0, 1.0);
          vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.28, h));
          col = mix(col, topColor, smoothstep(0.22, 0.82, h));
          float sunAmt = max(dot(dir, sunDir), 0.0);
          col += vec3(1.0, 0.93, 0.72) * pow(sunAmt, 8.0) * 0.22;
          col += vec3(1.0, 0.97, 0.88) * pow(sunAmt, 64.0) * 0.28;
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.group.add(new THREE.Mesh(skyGeo, skyMat));

    const hemi = new THREE.HemisphereLight(0xfff6dc, 0x6ea06e, 1.15);
    this.group.add(hemi);

    this.sunLight = new THREE.DirectionalLight(0xfff1d2, 2.35);
    this.sunLight.position.set(34, 36, -16);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.radius = 2.5;
    this.sunLight.shadow.normalBias = 0.035;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 120;
    this.sunLight.shadow.camera.left = -45;
    this.sunLight.shadow.camera.right = 45;
    this.sunLight.shadow.camera.top = 45;
    this.sunLight.shadow.camera.bottom = -45;
    this.sunLight.shadow.bias = -0.0005;
    this.group.add(this.sunLight);

    // Subtle warm bounce from below to emulate Heaven's inner light
    const bounce = new THREE.DirectionalLight(0xffe1a8, 0.42);
    bounce.position.set(-10, -10, 15);
    this.group.add(bounce);
  }

  private buildTerrainAndRiver(): void {
    const size = 120;
    const segs = 120;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors: number[] = [];
    const cMeadow = new THREE.Color(0x5fa853);
    const cSunlit = new THREE.Color(0x7cc45e);
    const cSand = new THREE.Color(0xdfd2b0);
    const cMistStone = new THREE.Color(0x7c8287);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getGroundHeight(x, z);
      pos.setY(i, y);

      const riverDist = Math.abs(x - this.getRiverCenterX(z));
      const c = cMeadow.clone().lerp(cSunlit, (Math.sin(x * 0.12) * 0.5 + 0.5) * 0.65);
      if (riverDist < 4.2) {
        c.lerp(cSand, 1 - riverDist / 4.2);
      }
      if (x > 19.5) {
        c.lerp(cMistStone, Math.min(1, (x - 19.5) / 10));
      }
      colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    this.terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0,
      color: 0xe7f3c4
    });
    const terrain = new THREE.Mesh(geo, this.terrainMat);
    terrain.receiveShadow = true;
    this.group.add(terrain);

    // Crystal River of Life flowing through the Terrace
    const waterGeo = new THREE.PlaneGeometry(18, 118, 24, 96);
    waterGeo.rotateX(-Math.PI / 2);
    const wPos = waterGeo.attributes.position;
    for (let i = 0; i < wPos.count; i++) {
      const lz = wPos.getZ(i);
      const lx = wPos.getX(i);
      wPos.setX(i, lx + this.getRiverCenterX(lz));
    }
    waterGeo.computeVertexNormals();

    this.waterMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uDeepColor: { value: new THREE.Color(0x2ca9b8) },
        uGlowColor: { value: new THREE.Color(0xbef7f0) },
        uGoldSpec: { value: new THREE.Color(0xfff1c4) }
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vUv = uv;
          vec3 p = position;
          float wave = sin(p.z * 0.7 - uTime * 2.2 + p.x * 0.6) * 0.045;
          p.y += wave;
          vWave = wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uDeepColor;
        uniform vec3 uGlowColor;
        uniform vec3 uGoldSpec;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          float shimmer = sin(vUv.y * 55.0 - uTime * 3.0 + sin(vUv.x * 16.0)) * 0.5 + 0.5;
          float sparkle = pow(shimmer, 6.0);
          vec3 col = mix(uDeepColor, uGlowColor, shimmer * 0.48 + 0.18);
          col += uGoldSpec * sparkle * 0.55;
          float edgeFade = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
          gl_FragColor = vec4(col, 0.82 * edgeFade);
        }
      `
    });
    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
    const river = this.waterMesh;
    river.position.y = -0.32;
    this.group.add(river);
  }

  private buildLivingGrass(): void {
    // 3,600 living grass blades that bend gently under footsteps and spring back greener!
    const count = 3600;
    const bladeGeo = new THREE.ConeGeometry(0.065, 0.62, 3);
    bladeGeo.translate(0, 0.31, 0);

    this.grassMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPlayerPos: { value: new THREE.Vector3(0, 0, 14) }
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uPlayerPos;
        varying float vTip;
        varying float vGreeted;
        void main() {
          vTip = clamp(position.y / 0.62, 0.0, 1.0);
          vec4 worldInst = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          vec3 p = position;

          // Gentle living breeze
          float sway = sin(uTime * 1.7 + worldInst.x * 0.45 + worldInst.z * 0.35) * 0.11 * vTip;
          p.x += sway;

          // Living grass bends tenderly around footsteps and springs back brighter green
          vec2 toGrass = worldInst.xz - uPlayerPos.xz;
          float dist = length(toGrass);
          float bend = smoothstep(1.85, 0.25, dist);
          vGreeted = smoothstep(3.2, 0.6, dist);
          if (dist > 0.001) {
            vec2 pushDir = normalize(toGrass);
            p.xz += pushDir * bend * 0.38 * vTip;
            p.y -= bend * 0.14 * vTip;
          }

          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vTip;
        varying float vGreeted;
        void main() {
          vec3 baseCol = vec3(0.24, 0.56, 0.25);
          vec3 tipCol = vec3(0.56, 0.88, 0.38);
          vec3 greetedTip = vec3(0.72, 1.0, 0.52);
          vec3 col = mix(baseCol, mix(tipCol, greetedTip, vGreeted * 0.7), vTip);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.grassMesh = new THREE.InstancedMesh(bladeGeo, this.grassMaterial, count);
    const mesh = this.grassMesh;
    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let attempt = 0; attempt < count * 3 && placed < count; attempt++) {
      const x = (Math.random() - 0.5) * 56;
      const z = (Math.random() - 0.5) * 56 - 4;
      const distRiver = Math.abs(x - this.getRiverCenterX(z));
      const distPav = Math.hypot(x - 14, z + 10);
      if (distRiver < 3.7 || distPav < 5.2 || x > 21) continue;

      const y = this.getGroundHeight(x, z);
      dummy.position.set(x, y - 0.03, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const s = 0.75 + Math.random() * 0.8;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed++, dummy.matrix);
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  private buildWildflowers(): void {
    // Iridescent wildflowers inspired by C007_I03.png
    const count = 420;
    const geo = new THREE.DodecahedronGeometry(0.14, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x332233,
      emissiveIntensity: 0.45,
      roughness: 0.35
    });
    this.flowerMesh = new THREE.InstancedMesh(geo, mat, count);
    const mesh = this.flowerMesh;
    const dummy = new THREE.Object3D();
    const palette = [
      new THREE.Color(0xffb8d9), // rose-opalescent
      new THREE.Color(0x9ee6ff), // iridescent sky blue
      new THREE.Color(0xfff199), // golden center
      new THREE.Color(0xd5b3ff), // soft lavender
      new THREE.Color(0xffffff)  // pure luminous white
    ];

    let placed = 0;
    for (let i = 0; i < count * 2 && placed < count; i++) {
      const x = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50 - 3;
      if (Math.abs(x - this.getRiverCenterX(z)) < 3.3 || Math.hypot(x - 14, z + 10) < 5.5 || x > 20) continue;
      const y = this.getGroundHeight(x, z);
      dummy.position.set(x, y + 0.24, z);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      const s = 0.6 + Math.random() * 0.85;
      dummy.scale.set(s, s * 0.65, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      mesh.setColorAt(placed, palette[placed % palette.length]);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.group.add(mesh);
  }

  private buildBridgeAndWalkways(): void {
    this.stoneMat = new THREE.MeshStandardMaterial({
      color: 0xf1e5cc,
      roughness: 0.62,
      metalness: 0.02
    });
    const stoneMat = this.stoneMat;
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf2c96b,
      emissive: 0x5c3e08,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.65
    });

    // Arched stone bridge crossing the River of Life near z = 1.5
    const bridgeGroup = new THREE.Group();
    const bridgeZ = 1.5;
    const bridgeX = this.getRiverCenterX(bridgeZ);
    const deckSegs = 9;
    for (let i = 0; i < deckSegs; i++) {
      const t = i / (deckSegs - 1) - 0.5;
      const archY = Math.cos(t * Math.PI) * 0.95 + 0.15;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.28, 3.2), stoneMat);
      plank.position.set(t * 8.6, archY, 0);
      plank.rotation.z = -Math.sin(t * Math.PI) * 0.28;
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);

      if (i % 2 === 0) {
        [-1.48, 1.48].forEach((sideZ) => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.95, 8), stoneMat);
          post.position.set(t * 8.6, archY + 0.52, sideZ);
          post.castShadow = true;
          bridgeGroup.add(post);

          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), goldTrimMat);
          cap.position.set(t * 8.6, archY + 1.02, sideZ);
          bridgeGroup.add(cap);
        });
      }
    }
    bridgeGroup.position.set(bridgeX, 0, bridgeZ);
    this.group.add(bridgeGroup);

    // Stepping stones along the Terrace paths
    const pathPoints: [number, number][] = [
      [0, 12], [-0.5, 9], [-1.2, 6.2], [1.5, 3.5], [4.5, 0.5], [7.5, -2.5], [10.2, -5.5],
      [-7.5, 0.5], [-10.5, -2.0], [-13.0, -4.5],
      [0, -4], [0, -9], [0, -14], [0, -19], [0, -24]
    ];
    pathPoints.forEach(([px, pz]) => {
      const y = this.getGroundHeight(px, pz);
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.14, 12), stoneMat);
      stone.position.set(px, y + 0.04, pz);
      stone.receiveShadow = true;
      this.group.add(stone);
    });
  }

  private buildWalledOrchard(): void {
    // Zone 3: Low, open sunlit curved stone walls around x = -14.5, z = -9
    const cx = -14.5;
    const cz = -9.0;
    const radius = 8.2;
    this.wallMat = new THREE.MeshStandardMaterial({ color: 0xede2ca, roughness: 0.72 });
    const wallMat = this.wallMat;

    const wallSegments = 22;
    for (let i = 0; i < wallSegments; i++) {
      const angle = (i / wallSegments) * Math.PI * 2;
      // Leave two wide welcoming openings (east toward river & south toward terrace)
      if ((angle > -0.35 && angle < 0.55) || (angle > 1.25 && angle < 1.95)) continue;
      const wx = cx + Math.cos(angle) * radius;
      const wz = cz + Math.sin(angle) * radius;
      const wy = this.getGroundHeight(wx, wz);

      const block = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.25, 0.65), wallMat);
      block.position.set(wx, wy + 0.55, wz);
      block.rotation.y = -angle + Math.PI / 2;
      block.castShadow = true;
      block.receiveShadow = true;
      this.group.add(block);
    }

    // Trees of Life inside the Walled Orchard + Mediterranean olive/cypress accents around the Terrace
    const orchardTrees: [number, number, number][] = [
      [-14.8, -9.2, 1.35], // Central Tree of Life (interactive healing leaves!)
      [-18.8, -6.5, 1.05],
      [-18.5, -12.5, 1.1],
      [-11.5, -11.8, 0.95],
      // Surrounding Terrace olive & fruit trees
      [6.5, 8.5, 1.1],
      [-8.5, 9.5, 1.0],
      [9.5, 1.5, 0.95],
      [18.2, -3.5, 0.9],
      [-10.5, -20.5, 1.2],
      [10.2, -19.5, 1.15]
    ];

    orchardTrees.forEach(([tx, tz, scale], idx) => {
      const isHealingTree = idx === 0;
      this.createHeavenlyTree(tx, tz, scale, isHealingTree);
    });

    // Gentle drifting luminous healing leaves in the Walled Orchard
    const leafCount = 140;
    const leafGeo = new THREE.BufferGeometry();
    const leafPos = new Float32Array(leafCount * 3);
    for (let i = 0; i < leafCount; i++) {
      const r = Math.random() * 7.5;
      const a = Math.random() * Math.PI * 2;
      leafPos[i * 3] = cx + Math.cos(a) * r;
      leafPos[i * 3 + 1] = 0.8 + Math.random() * 5.2;
      leafPos[i * 3 + 2] = cz + Math.sin(a) * r;
    }
    leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPos, 3));
    const leafMat = new THREE.PointsMaterial({
      color: 0xd9ff9c,
      size: 0.16,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.fallingLeaves = new THREE.Points(leafGeo, leafMat);
    this.group.add(this.fallingLeaves);

    // Interactive Healing Leaves Point at the central Tree of Life
    const treeY = this.getGroundHeight(-14.8, -9.2);
    this.interactables.push({
      id: 'healing-leaves',
      label: 'Mara’s Orchard — Breathe the Healing Leaves',
      sublabel: 'Press E to breathe the leaves with Mara',
      position: new THREE.Vector3(-14.8, treeY + 1.2, -9.2),
      radius: 3.6,
      type: 'leaves',
      dialogueId: 'mara_after_leaves'
    });
  }

  private createHeavenlyTree(x: number, z: number, scale: number, isHealingTree: boolean): void {
    const g = new THREE.Group();
    const y = this.getGroundHeight(x, z);

    if (!this.barkMat) this.barkMat = new THREE.MeshStandardMaterial({ color: 0x6f533b, roughness: 0.86 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.42 * scale, 3.4 * scale, 10), this.barkMat);
    trunk.userData.kind = 'trunk';
    trunk.position.y = 1.65 * scale;
    trunk.castShadow = true;
    g.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({
      color: isHealingTree ? 0x76d668 : 0x5ca84f,
      emissive: isHealingTree ? 0x3b6e24 : 0x1c3614,
      emissiveIntensity: isHealingTree ? 0.55 : 0.25,
      roughness: 0.65
    });

    const clusterOffsets: [number, number, number, number][] = [
      [0, 3.7, 0, 1.85],
      [1.1, 3.2, 0.6, 1.35],
      [-1.05, 3.3, -0.5, 1.4],
      [0.3, 4.4, -0.4, 1.25]
    ];
    clusterOffsets.forEach(([ox, oy, oz, rad]) => {
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * scale, 1), foliageMat);
      crown.userData.kind = 'crown';
      crown.position.set(ox * scale, oy * scale, oz * scale);
      crown.castShadow = true;
      g.add(crown);
    });

    // Glowing golden fruits suspended in the canopy
    const fruitMat = new THREE.MeshStandardMaterial({
      color: 0xffcf5e,
      emissive: 0xffae2b,
      emissiveIntensity: 0.75,
      roughness: 0.25
    });
    for (let i = 0; i < (isHealingTree ? 12 : 6); i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = (0.9 + (i % 3) * 0.45) * scale;
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.14 * scale, 8, 8), fruitMat);
      fruit.position.set(Math.cos(a) * r, (2.6 + (i % 2) * 0.5) * scale, Math.sin(a) * r);
      g.add(fruit);
    }

    if (isHealingTree) {
      const treeGlow = new THREE.PointLight(0xdfffa6, 1.8, 12);
      treeGlow.position.set(0, 3.2, 0);
      g.add(treeGlow);
    }

    g.position.set(x, y, z);
    this.group.add(g);
    this.trees.push({ group: g, scale, healing: isHealingTree });
  }

  private buildMemoryPavilion(): void {
    // Zone 5: Golden Pool of Living Memory (inspired by C006_S10_5s.jpg)
    const px = 14.0;
    const pz = -10.0;
    const py = this.getGroundHeight(px, pz);
    const pav = new THREE.Group();
    pav.position.set(px, py, pz);

    this.marbleMat = new THREE.MeshStandardMaterial({ color: 0xf7f1e6, roughness: 0.32, metalness: 0.04 });
    const marbleMat = this.marbleMat;
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf7cf6b,
      emissive: 0x704d0a,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.7
    });

    // Stepped circular marble dais
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 0.35, 32), marbleMat);
    dais.position.y = 0.18;
    dais.receiveShadow = true;
    pav.add(dais);

    // Basin rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.28, 14, 48), marbleMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.72;
    rim.castShadow = true;
    pav.add(rim);

    // Glowing Golden Liquid-Light Pool shader!
    const poolGeo = new THREE.CircleGeometry(2.75, 48);
    poolGeo.rotateX(-Math.PI / 2);
    this.poolMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float r = length(p);
          float ripple = sin(r * 18.0 - uTime * 2.6) * 0.5 + 0.5;
          float swirl = sin(atan(p.y, p.x) * 6.0 + uTime * 1.1 + r * 6.0) * 0.5 + 0.5;
          vec3 goldDeep = vec3(0.92, 0.66, 0.20);
          vec3 goldBright = vec3(1.0, 0.96, 0.76);
          vec3 col = mix(goldDeep, goldBright, ripple * 0.65 + swirl * 0.35);
          col += vec3(0.35, 0.28, 0.1) * (1.0 - r);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    const pool = new THREE.Mesh(poolGeo, this.poolMaterial);
    pool.position.y = 0.68;
    pav.add(pool);

    // Central marble fountain spire inside the pool
    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 1.5, 16), marbleMat);
    fBase.position.y = 1.25;
    pav.add(fBase);
    const fBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.25, 0.32, 20), goldMat);
    fBowl.position.y = 1.95;
    pav.add(fBowl);

    // 6 luminous arched columns around the pavilion
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.6, 12), marbleMat);
      col.userData.kind = 'plain-column';
      this.plainColumns.push(col);
      col.position.set(Math.cos(a) * 4.5, 2.5, Math.sin(a) * 4.5);
      col.castShadow = true;
      pav.add(col);
    }

    const crownRing = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.24, 12, 48), goldMat);
    crownRing.rotation.x = Math.PI / 2;
    crownRing.position.y = 4.85;
    pav.add(crownRing);

    const poolLight = new THREE.PointLight(0xffdd88, 3.2, 18);
    poolLight.position.set(0, 2.5, 0);
    pav.add(poolLight);

    this.group.add(pav);

    this.interactables.push({
      id: 'memory-pool',
      label: 'The Golden Pool of Living Memory',
      sublabel: 'Press E to enter a Guided 3D Vision (Creation, Cross, or Sawdust)',
      position: new THREE.Vector3(px, py + 1.1, pz),
      radius: 4.5,
      type: 'pool',
      dialogueId: 'pool_menu'
    });
  }

  private buildGrayMistFork(): void {
    // Zone 1 East Bluff: Unchained downward path into swirling Gray Mist (C007_I04.png)
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0x8e959e,
      transparent: true,
      opacity: 0.34,
      depthWrite: false
    });

    for (let i = 0; i < 16; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(2.8 + (i % 4) * 1.1, 14, 12), mistMat);
      puff.scale.set(1.6, 0.55, 1.4);
      puff.position.set(25 + (i % 5) * 2.8, -2.5 + (i % 3) * 0.7, -14 + i * 2.2);
      this.group.add(puff);
      this.mistClouds.push(puff);
    }

    const mx = 20.5;
    const mz = 4.5;
    const my = this.getGroundHeight(mx, mz);

    // Quiet carved cairn stone marking the overlook
    const cairn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.6, 1.1, 8),
      new THREE.MeshStandardMaterial({ color: 0xb0b4ba, roughness: 0.9 })
    );
    cairn.position.set(mx, my + 0.55, mz);
    this.group.add(cairn);

    this.interactables.push({
      id: 'gray-mist-fork',
      label: 'The Fork & Edge of the Gray Mist',
      sublabel: 'Press E to reflect on free will and the open gates',
      position: new THREE.Vector3(mx, my + 1.0, mz),
      radius: 3.5,
      type: 'mist',
      dialogueId: 'mist_edge'
    });
  }

  private buildDistantCityAndPearlGate(): void {
    // Zone 7 Distant Skyline: Ascending golden steps, Single-Pearl Eastern Gate, Most Holy Place pillar, Sapphire horizon!
    const gateZ = -48;
    const gateY = 4.2;

    const gateGroup = new THREE.Group();
    this.gateGroup = gateGroup;
    gateGroup.position.set(0, gateY, gateZ);

    // Colossal translucent single-pearl arch (C016_I04_Pearl_Gate.png)
    this.pearlMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPos = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewPos);
          float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);
          vec3 pearl = vec3(0.78, 0.76, 0.72);
          vec3 nacre = vec3(
            0.72 + 0.16 * sin(uTime * 0.7 + fres * 6.0),
            0.70 + 0.14 * sin(uTime * 0.7 + fres * 6.0 + 2.1),
            0.84 + 0.1 * sin(uTime * 0.5 + fres * 4.0)
          );
          vec3 col = mix(pearl, nacre, fres) + vec3(1.0, 0.9, 0.65) * fres * 0.22;
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    const pearlArch = new THREE.Mesh(new THREE.TorusGeometry(9.5, 1.35, 32, 64, Math.PI), this.pearlMaterial);
    pearlArch.position.y = 2.5;
    gateGroup.add(pearlArch);

    // Flanking sunlit jasper walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xfff6e5,
      emissive: 0x6b532b,
      emissiveIntensity: 0.35,
      roughness: 0.2
    });
    [-19, 19].forEach((wx) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(18, 9.2, 2.4), wallMat);
      w.userData.kind = 'jasper-wall';
      w.position.set(wx, 5, 0);
      gateGroup.add(w);
    });

    // Radiant Most Holy Place light pillar rising far behind the gate (C017_I04_Most_Holy_Place.png)
    const pillarGeo = new THREE.CylinderGeometry(2.6, 7.5, 110, 32, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xfff3c9,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(0, 52, -32);
    gateGroup.add(pillar);

    // Distant Golden Ring Halo Sanctuary (Sea of Glass motif)
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(18, 0.65, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xffe49e, transparent: true, opacity: 0.42 })
    );
    halo.position.set(0, 22, -28);
    gateGroup.add(halo);

    // Distant Sapphire Sea shimmer plane beyond the gate
    this.seaMesh = new THREE.Mesh(
      new THREE.CircleGeometry(70, 64),
      new THREE.MeshBasicMaterial({ color: 0x2e7ee0, transparent: true, opacity: 0.55 })
    );
    const sea = this.seaMesh;
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, 2.2, -52);
    gateGroup.add(sea);

    this.group.add(gateGroup);

    // Rising Road Overlook interaction point
    const oy = this.getGroundHeight(0, -27);
    this.interactables.push({
      id: 'rising-overlook',
      label: 'Rising Road Overlook — The Eastern Gate',
      sublabel: 'Press E to gaze toward the Gate of One Pearl',
      position: new THREE.Vector3(0, oy + 1.2, -27),
      radius: 4.0,
      type: 'overlook',
      dialogueId: 'overlook_unlocked'
    });
  }

  private buildPrismaticBirds(): void {
    // Iridescent hummingbirds/doves trailing glowing ribbons of color (C007_I03.png)
    const trailColors = [0xffa6d8, 0x8ef2ff, 0xffe680, 0xc9a8ff, 0xa8ffbe];

    for (let i = 0; i < 6; i++) {
      const bird = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.42, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      body.rotation.x = Math.PI / 2;
      bird.add(body);

      const wingMat = new THREE.MeshBasicMaterial({ color: trailColors[i % trailColors.length], side: THREE.DoubleSide });
      const leftW = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), wingMat);
      leftW.position.x = -0.22;
      leftW.rotation.x = Math.PI / 2;
      bird.add(leftW);

      const rightW = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), wingMat);
      rightW.position.x = 0.22;
      rightW.rotation.x = Math.PI / 2;
      bird.add(rightW);

      const trailSegs = 28;
      const trailPositions = new Float32Array(trailSegs * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: trailColors[i % trailColors.length],
        transparent: true,
        opacity: 0.72
      });
      const trail = new THREE.Line(trailGeo, trailMat);

      this.group.add(bird);
      this.group.add(trail);

      this.birds.push({
        mesh: bird,
        trail,
        trailPositions,
        angle: (i / 6) * Math.PI * 2,
        speed: 0.28 + (i % 3) * 0.08,
        radius: 10 + i * 2.8,
        height: 4.5 + (i % 4) * 1.4,
        center: new THREE.Vector3((i % 2 === 0 ? -4 : 6), 0, -4 + (i - 3) * 2)
      });
    }
  }

  private buildSaintsAndBenches(): void {
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0x9c7b56, roughness: 0.7 });
    const woodMat = this.woodMat;
    const stoneLegMat = new THREE.MeshStandardMaterial({ color: 0xe9dec8, roughness: 0.65 });

    SAINTS.forEach((profile) => {
      const [sx, , sz] = profile.position;
      const sy = this.getGroundHeight(sx, sz);

      const agent = new SaintAgent(profile, sy);
      this.group.add(agent.group);
      this.saintAgents.set(profile.id, agent);

      // "Pull Up a Chair" Stone & Timber Bench beside designated saints
      let seatPos: THREE.Vector3 | undefined;
      if (profile.hasBench && profile.benchOffset) {
        const bx = sx + profile.benchOffset[0];
        const bz = sz + profile.benchOffset[2];
        const by = this.getGroundHeight(bx, bz);

        const bench = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.62), woodMat);
        seat.position.y = 0.52;
        seat.castShadow = true;
        seat.receiveShadow = true;
        bench.add(seat);

        [-0.68, 0.68].forEach((lx) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.52), stoneLegMat);
          leg.position.set(lx, 0.25, 0);
          bench.add(leg);
        });

        bench.position.set(bx, by, bz);
        bench.lookAt(profile.lookAt[0], by, profile.lookAt[2]);
        this.group.add(bench);

        seatPos = new THREE.Vector3(bx, by + 1.25, bz);
      }

      this.interactables.push({
        id: profile.id,
        label: `Speak with ${profile.name}`,
        sublabel: `Press E to pull up a chair · ${profile.title}`,
        position: new THREE.Vector3(sx, sy + 1.3, sz),
        radius: 3.6,
        type: 'saint',
        dialogueId: profile.startNodeId,
        seatPos,
        seatLookAt: new THREE.Vector3(sx, sy + 1.65, sz)
      });
    });

    // Initialize organic eavesdropping banter pairs
    AMBIENT_BANTER_PAIRS.forEach((pair, idx) => {
      this.banterStates.set(pair.id, { lineIdx: 0, timer: 1.5 + idx * 1.1 });
    });
  }

  public setActiveSaintConversation(saintId: string | null): void {
    this.saintAgents.forEach((agent, id) => {
      agent.setConverseWithPlayer(id === saintId);
    });
  }

  private buildHealingLeafBurst(): void {
    const count = 220;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xeaffb0,
      size: 0.26,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.leafBurstParticles = new THREE.Points(geo, mat);
    this.group.add(this.leafBurstParticles);
  }

  public triggerHealingLeafWave(origin: THREE.Vector3): void {
    this.leafBurstTime = 0;
    const attr = this.leafBurstParticles.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i++) {
      attr.setXYZ(i, origin.x, origin.y, origin.z);
    }
    attr.needsUpdate = true;

    // GTA-style synchronized crowd reaction: nearby saints turn in awe toward the golden wave!
    this.saintAgents.forEach((agent) => {
      if (agent.group.position.distanceTo(origin) < 24) {
        agent.triggerLeafReaction();
      }
    });
  }

  public update(dt: number, elapsed: number, playerPos: THREE.Vector3): void {
    if (this.grassMaterial) {
      this.grassMaterial.uniforms.uTime.value = elapsed;
      this.grassMaterial.uniforms.uPlayerPos.value.copy(playerPos);
    }
    if (this.waterMaterial instanceof THREE.ShaderMaterial && this.waterMaterial.uniforms.uTime) {
      this.waterMaterial.uniforms.uTime.value = elapsed;
    }
    if (this.riverNormal) {
      this.riverNormal.offset.x = elapsed * 0.018;
      this.riverNormal.offset.y = elapsed * 0.01;
    }
    if (this.poolMaterial) {
      this.poolMaterial.uniforms.uTime.value = elapsed;
    }
    if (this.pearlMaterial) {
      this.pearlMaterial.uniforms.uTime.value = elapsed;
    }

    // Update prismatic birds & light ribbon trails
    this.birds.forEach((b, idx) => {
      b.angle += dt * b.speed;
      const nx = b.center.x + Math.cos(b.angle) * b.radius;
      const nz = b.center.z + Math.sin(b.angle * 0.85) * (b.radius * 0.72);
      const ny = b.height + Math.sin(elapsed * 1.4 + idx) * 0.9;

      const prevX = b.mesh.position.x;
      const prevZ = b.mesh.position.z;
      b.mesh.position.set(nx, ny, nz);
      b.mesh.lookAt(nx + (nx - prevX), ny, nz + (nz - prevZ));

      // Gentle wing flap
      const flap = Math.sin(elapsed * 14 + idx * 2) * 0.55;
      b.mesh.children[1].rotation.z = flap;
      b.mesh.children[2].rotation.z = -flap;

      // Shift ribbon trail positions
      const arr = b.trailPositions;
      for (let i = arr.length - 3; i >= 3; i -= 3) {
        arr[i] = arr[i - 3];
        arr[i + 1] = arr[i - 2];
        arr[i + 2] = arr[i - 1];
      }
      arr[0] = nx;
      arr[1] = ny;
      arr[2] = nz;
      (b.trail.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    });

    // Drift Orchard healing leaves softly downward
    if (this.fallingLeaves) {
      const pos = this.fallingLeaves.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let ly = pos.getY(i) - dt * 0.28;
        const lx = pos.getX(i) + Math.sin(elapsed + i) * dt * 0.14;
        if (ly < 0.3) ly = 5.4;
        pos.setXY(i, lx, ly);
      }
      pos.needsUpdate = true;
    }

    // Gentle drift on Gray Mist puffs
    this.mistClouds.forEach((puff, i) => {
      puff.position.y += Math.sin(elapsed * 0.5 + i) * dt * 0.12;
      puff.rotation.y += dt * 0.04;
    });

    // Update articulated Living Saints + sync patrolling interaction positions
    this.saintAgents.forEach((agent, id) => {
      const partner = agent.profile.partnerId ? this.saintAgents.get(agent.profile.partnerId) : undefined;
      agent.update(dt, elapsed, playerPos, (x, z) => this.getGroundHeight(x, z), partner?.group.position);

      const inter = this.interactables.find((i) => i.id === id);
      if (inter) {
        inter.position.set(agent.group.position.x, agent.group.position.y + 1.3, agent.group.position.z);
        if (inter.seatLookAt) {
          inter.seatLookAt.set(agent.group.position.x, agent.group.position.y + 1.65, agent.group.position.z);
        }
      }
    });

    // Organic Eavesdropping Banter Scheduler between conversing saint pairs
    AMBIENT_BANTER_PAIRS.forEach((pair) => {
      const state = this.banterStates.get(pair.id);
      const a = this.saintAgents.get(pair.speakers[0]);
      const b = this.saintAgents.get(pair.speakers[1]);
      if (!state || !a || !b) return;

      const midX = (a.group.position.x + b.group.position.x) * 0.5;
      const midZ = (a.group.position.z + b.group.position.z) * 0.5;
      const playerNear = Math.hypot(playerPos.x - midX, playerPos.z - midZ) < 14.5;

      if (playerNear) {
        state.timer -= dt;
        if (state.timer <= 0) {
          const current = pair.lines[state.lineIdx % pair.lines.length];
          const speaker = this.saintAgents.get(current.speakerId);
          const listener = current.speakerId === pair.speakers[0] ? b : a;
          if (speaker) {
            speaker.showWisp(current.text, 5.4);
            speaker.setTalking(true);
            listener.setTalking(false);
          }
          state.lineIdx = (state.lineIdx + 1) % pair.lines.length;
          state.timer = 6.2;
        }
      } else {
        a.setTalking(false);
        b.setTalking(false);
      }
    });

    // Healing leaf expansion wave effect
    if (this.leafBurstTime >= 0) {
      this.leafBurstTime += dt;
      const mat = this.leafBurstParticles.material as THREE.PointsMaterial;
      const attr = this.leafBurstParticles.geometry.attributes.position as THREE.BufferAttribute;
      if (this.leafBurstTime < 4.0) {
        const progress = this.leafBurstTime / 4.0;
        mat.opacity = Math.sin(progress * Math.PI) * 0.95;
        for (let i = 0; i < attr.count; i++) {
          const theta = (i / attr.count) * Math.PI * 2 * 7;
          const phi = Math.acos(1 - (2 * (i + 0.5)) / attr.count);
          const speed = 2.6 + (i % 5) * 0.55;
          const r = this.leafBurstTime * speed;
          attr.setXYZ(
            i,
            playerPos.x + Math.sin(phi) * Math.cos(theta) * r,
            playerPos.y + Math.cos(phi) * r * 0.65 + this.leafBurstTime * 0.45,
            playerPos.z + Math.sin(phi) * Math.sin(theta) * r
          );
        }
        attr.needsUpdate = true;
      } else {
        mat.opacity = 0;
        this.leafBurstTime = -1;
      }
    }
  }
}
