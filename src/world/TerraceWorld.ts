import * as THREE from 'three';
import { AMBIENT_BANTER_PAIRS, SAINTS } from '../data/dialogues';
import { SaintAgent } from './SaintAgent';
import { ProceduralTextureLibrary } from './ProceduralTextures';

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
  public readonly saintAgents: Map<string, SaintAgent> = new Map();

  private readonly tex = new ProceduralTextureLibrary();
  private skyMaterial!: THREE.ShaderMaterial;
  private grassMaterial!: THREE.ShaderMaterial;
  private waterMaterial!: THREE.ShaderMaterial;
  private waterfallMat!: THREE.ShaderMaterial;
  private poolMaterial!: THREE.ShaderMaterial;
  private pearlMaterial!: THREE.ShaderMaterial;
  private birds: PrismaticBird[] = [];
  private fallingLeaves!: THREE.Points;
  private goldenMotes!: THREE.Points;
  private waterfallMist!: THREE.Points;
  private leafBurstParticles!: THREE.Points;
  private leafBurstTime = -1;
  private mistClouds: THREE.Mesh[] = [];
  private banterStates: Map<string, { lineIdx: number; timer: number }> = new Map();
  private sunLight!: THREE.DirectionalLight;

  constructor() {
    this.buildSkyAndLighting();
    this.buildDistantMountains();
    this.buildTerrainAndRiver();
    this.buildRiverbankBouldersAndWaterfall();
    this.buildLivingGrass();
    this.buildWildflowers();
    this.buildBridgeAndWalkways();
    this.buildWalledOrchardAndBotanicalTrees();
    this.buildMemoryPavilion();
    this.buildGrayMistFork();
    this.buildDistantCityAndPearlGate();
    this.buildVolumetricGodRaysAndMotes();
    this.buildPrismaticBirds();
    this.buildSaintsAndBenches();
    this.buildHealingLeafBurst();
  }

  public getGroundHeight(x: number, z: number): number {
    const gentleHills =
      Math.sin(x * 0.065) * 0.55 +
      Math.cos(z * 0.06) * 0.45 +
      Math.sin((x + z) * 0.04) * 0.35;

    const riverCenter = this.getRiverCenterX(z);
    const distRiver = Math.abs(x - riverCenter);
    const riverDip = distRiver < 4.5 ? -Math.cos((distRiver / 4.5) * (Math.PI / 2)) * 1.15 : 0;

    const risingSlope = z < -18 ? Math.min(4.2, (-18 - z) * 0.16) : 0;
    const mistDip = x > 21 ? -Math.min(5.5, (x - 21) * 0.42) : 0;

    const pavDist = Math.hypot(x - 14, z + 10);
    const flattenPav = pavDist < 6 ? Math.max(0, 1 - pavDist / 6) : 0;
    const rawH = gentleHills + riverDip + risingSlope + mistDip;
    return rawH * (1 - flattenPav * 0.85) + 0.25 * flattenPav;
  }

  public getRiverCenterX(z: number): number {
    return -3.2 + Math.sin(z * 0.08) * 3.2;
  }

  private buildSkyAndLighting(): void {
    // Painterly-photorealistic sky dome with drifting volumetric cumulus clouds & Mie golden sun scattering
    const skyGeo = new THREE.SphereGeometry(280, 48, 32);
    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        topColor: { value: new THREE.Color(0x3a6fb3) },
        midColor: { value: new THREE.Color(0x9fc2dd) },
        horizonColor: { value: new THREE.Color(0xffe9c2) },
        sunDir: { value: new THREE.Vector3(0.05, 0.24, -0.97).normalize() }
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
        uniform float uTime;
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        uniform vec3 sunDir;
        varying vec3 vWorldPos;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p *= 2.04;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y, 0.0, 1.0);

          vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.32, h));
          col = mix(col, topColor, smoothstep(0.24, 0.85, h));

          // Mie golden solar glow
          float sunAmt = max(dot(dir, sunDir), 0.0);
          col += vec3(1.0, 0.88, 0.64) * pow(sunAmt, 7.0) * 0.45;
          col += vec3(1.0, 0.96, 0.86) * pow(sunAmt, 64.0) * 0.95;

          // Sun-kissed cumulus clouds projected across upper sky dome
          if (dir.y > 0.04) {
            vec2 cloudUv = dir.xz / (dir.y + 0.22) * 1.45 + vec2(uTime * 0.008, -uTime * 0.005);
            float c = fbm(cloudUv);
            float density = smoothstep(0.46, 0.78, c) * smoothstep(0.04, 0.22, dir.y) * smoothstep(0.95, 0.4, dir.y);
            vec3 cloudShade = mix(vec3(0.84, 0.86, 0.92), vec3(1.0, 0.96, 0.88), smoothstep(0.45, 0.8, c));
            vec3 sunRim = vec3(1.0, 0.91, 0.74) * pow(sunAmt, 4.0) * 0.45;
            col = mix(col, cloudShade + sunRim, density * 0.78);
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.group.add(new THREE.Mesh(skyGeo, this.skyMaterial));

    const hemi = new THREE.HemisphereLight(0xfff5db, 0x4f7848, 0.95);
    this.group.add(hemi);

    this.sunLight = new THREE.DirectionalLight(0xffe4b3, 2.25);
    this.sunLight.position.set(10, 26, -46);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 4;
    this.sunLight.shadow.camera.far = 135;
    this.sunLight.shadow.camera.left = -46;
    this.sunLight.shadow.camera.right = 46;
    this.sunLight.shadow.camera.top = 46;
    this.sunLight.shadow.camera.bottom = -46;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.03;
    this.group.add(this.sunLight);

    // Warm sunlit bounce fill so shadows stay soft and luminous
    const fill = new THREE.DirectionalLight(0xd4e6ff, 0.45);
    fill.position.set(-22, 14, 24);
    this.group.add(fill);
  }

  private buildDistantMountains(): void {
    // Multi-tiered Mediterranean alpine ridges ringing the 360-degree horizon (C007_I03 / C016_I02)
    const layers = [
      { radius: 96, height: 26, color: 0x7a9688, opacity: 0.92, seed: 1.3 },
      { radius: 145, height: 42, color: 0x9cb1c4, opacity: 0.78, seed: 4.7 },
      { radius: 200, height: 64, color: 0xc9d3df, opacity: 0.52, seed: 9.1 }
    ];

    layers.forEach((layer) => {
      const segs = 96;
      const geo = new THREE.CylinderGeometry(layer.radius, layer.radius + 14, layer.height, segs, 6, true);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y > -layer.height * 0.4) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const a = Math.atan2(z, x);
          // Dip slightly north (around -PI/2) to frame the Eastern Gate & Most Holy Place cleanly!
          const gateNotch = 1.0 - Math.exp(-Math.pow(Math.sin((a + Math.PI / 2) * 0.5), 2) * 18) * 0.65;
          const ridge =
            (Math.sin(a * 5 + layer.seed) * 0.45 +
              Math.cos(a * 11 - layer.seed * 2) * 0.3 +
              Math.sin(a * 23 + layer.seed) * 0.15 +
              0.65) *
            gateNotch;
          const t = (y + layer.height * 0.5) / layer.height;
          pos.setY(i, -4 + t * layer.height * ridge);
        }
      }
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: layer.color,
        roughness: 0.95,
        metalness: 0.0,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.BackSide
      });
      const ring = new THREE.Mesh(geo, mat);
      this.group.add(ring);
    });
  }

  private buildTerrainAndRiver(): void {
    const size = 128;
    const segs = 140;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors: number[] = [];
    const cMeadow = new THREE.Color(0x4c8c42);
    const cSunlit = new THREE.Color(0x73b352);
    const cMossBank = new THREE.Color(0x3f753e);
    const cPebble = new THREE.Color(0xcabca0);
    const cMistStone = new THREE.Color(0x6e757d);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getGroundHeight(x, z);
      pos.setY(i, y);

      const riverDist = Math.abs(x - this.getRiverCenterX(z));
      const patch = Math.sin(x * 0.13) * Math.cos(z * 0.11) * 0.5 + 0.5;
      const c = cMeadow.clone().lerp(cSunlit, patch * 0.72);
      if (riverDist < 5.2 && riverDist >= 3.2) {
        c.lerp(cMossBank, 0.45);
      } else if (riverDist < 3.2) {
        c.lerp(cPebble, 1 - riverDist / 3.2);
      }
      if (x > 19.5) {
        c.lerp(cMistStone, Math.min(1, (x - 19.5) / 9));
      }
      colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: this.tex.terrain.map,
      normalMap: this.tex.terrain.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: this.tex.terrain.roughnessMap,
      roughness: 0.92,
      metalness: 0.02
    });
    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.group.add(terrain);

    // Photorealistic Fresnel + Normal-Mapped Reflective River of Life
    const waterGeo = new THREE.PlaneGeometry(18, 122, 32, 120);
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
        uNormalMap: { value: this.tex.waterNormal },
        uSunDir: { value: new THREE.Vector3(0.05, 0.28, -0.96).normalize() },
        uDeepColor: { value: new THREE.Color(0x136f85) },
        uShallowColor: { value: new THREE.Color(0x4fd1c5) },
        uSkyReflect: { value: new THREE.Color(0xfff1cf) }
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.y += sin(p.z * 0.8 - uTime * 2.4 + p.x * 0.7) * 0.035;
          vec4 wp = modelMatrix * vec4(p, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform sampler2D uNormalMap;
        uniform vec3 uSunDir;
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uSkyReflect;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          vec2 uv1 = vUv * vec2(2.5, 16.0) + vec2(0.0, -uTime * 0.14);
          vec2 uv2 = vUv * vec2(4.0, 22.0) + vec2(uTime * 0.04, -uTime * 0.22);
          vec3 n1 = texture2D(uNormalMap, uv1).rgb * 2.0 - 1.0;
          vec3 n2 = texture2D(uNormalMap, uv2).rgb * 2.0 - 1.0;
          vec3 N = normalize(vec3((n1.x + n2.x) * 0.45, 1.0, (n1.y + n2.y) * 0.45));

          vec3 V = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);

          vec3 H = normalize(uSunDir + V);
          float spec = pow(max(dot(N, H), 0.0), 96.0);

          float bankDist = min(vUv.x, 1.0 - vUv.x);
          float foam = smoothstep(0.18, 0.08, bankDist) * (0.45 + 0.55 * sin(vUv.y * 90.0 - uTime * 4.0));

          vec3 waterCol = mix(uShallowColor, uDeepColor, smoothstep(0.08, 0.36, bankDist));
          waterCol = mix(waterCol, uSkyReflect, clamp(fresnel * 0.85, 0.0, 0.82));
          waterCol += vec3(1.0, 0.96, 0.82) * spec * 1.45;
          waterCol = mix(waterCol, vec3(0.96, 0.99, 1.0), clamp(foam * 0.55, 0.0, 0.65));

          float edgeAlpha = smoothstep(0.02, 0.14, bankDist);
          gl_FragColor = vec4(waterCol, 0.88 * edgeAlpha);
        }
      `
    });
    const river = new THREE.Mesh(waterGeo, this.waterMaterial);
    river.position.y = -0.3;
    this.group.add(river);
  }

  private buildRiverbankBouldersAndWaterfall(): void {
    // Organic sculpted mossy limestone boulders lining the crystal River of Life (C007_I03.png)
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0xbcb5a6,
      map: this.tex.stone.map,
      normalMap: this.tex.stone.normalMap,
      normalScale: new THREE.Vector2(1.4, 1.4),
      roughnessMap: this.tex.stone.roughnessMap,
      roughness: 0.86
    });

    for (let i = 0; i < 42; i++) {
      const z = -26 + i * 1.25 + (Math.sin(i * 4.3) * 0.5);
      const side = i % 2 === 0 ? -1 : 1;
      const rx = this.getRiverCenterX(z) + side * (3.1 + (i % 4) * 0.45);
      // Keep the bridge crossing clear
      if (Math.abs(z - 1.5) < 3.5) continue;

      const geo = new THREE.IcosahedronGeometry(0.55 + (i % 5) * 0.22, 2);
      const p = geo.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const vx = p.getX(v);
        const vy = p.getY(v);
        const vz = p.getZ(v);
        const n = 1.0 + Math.sin(vx * 3.1 + i) * 0.18 + Math.cos(vz * 2.7 - i) * 0.14;
        p.setXYZ(v, vx * n * 1.25, vy * n * 0.72, vz * n);
      }
      geo.computeVertexNormals();
      const rock = new THREE.Mesh(geo, rockMat);
      const ry = this.getGroundHeight(rx, z);
      rock.position.set(rx, ry + 0.15, z);
      rock.rotation.y = i * 1.3;
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    }

    // Distant Cascading Waterfall feeding the River of Life below the Eastern Gate
    const wfX = this.getRiverCenterX(-40);
    const wfGeo = new THREE.PlaneGeometry(7.5, 11.5, 10, 16);
    this.waterfallMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
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
          float stream = sin(vUv.x * 26.0 + sin(vUv.y * 8.0 + uTime * 3.5)) * 0.5 + 0.5;
          float fall = sin(vUv.y * 18.0 + uTime * 6.5) * 0.5 + 0.5;
          vec3 col = mix(vec3(0.58, 0.89, 0.96), vec3(0.98, 0.99, 1.0), stream * 0.65 + fall * 0.35);
          float alpha = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x) * 0.85;
          gl_FragColor = vec4(col, alpha);
        }
      `
    });
    const wf = new THREE.Mesh(wfGeo, this.waterfallMat);
    wf.position.set(wfX, 4.2, -41);
    this.group.add(wf);

    // Rising Waterfall Mist Particles
    const mistCount = 90;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount; i++) {
      mistPos[i * 3] = wfX + (Math.random() - 0.5) * 9;
      mistPos[i * 3 + 1] = Math.random() * 4.5;
      mistPos[i * 3 + 2] = -40 + (Math.random() - 0.5) * 4;
    }
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    this.waterfallMist = new THREE.Points(
      mistGeo,
      new THREE.PointsMaterial({
        map: this.tex.softGlow,
        color: 0xeef9ff,
        size: 3.2,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      })
    );
    this.group.add(this.waterfallMist);
  }

  private buildLivingGrass(): void {
    const count = 4800;
    const bladeGeo = new THREE.PlaneGeometry(0.11, 0.68, 1, 3);
    bladeGeo.translate(0, 0.34, 0);
    // Taper blade tip cleanly
    const bp = bladeGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const y = bp.getY(i);
      const t = y / 0.68;
      bp.setX(i, bp.getX(i) * (1 - t * 0.88));
      bp.setZ(i, t * t * 0.12);
    }
    bladeGeo.computeVertexNormals();

    this.grassMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uPlayerPos: { value: new THREE.Vector3(0, 0, 14) }
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uPlayerPos;
        varying float vTip;
        varying float vGreeted;
        varying float vVar;
        void main() {
          vTip = clamp(position.y / 0.68, 0.0, 1.0);
          vec4 worldInst = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          vVar = fract(sin(dot(worldInst.xz, vec2(12.9898, 78.233))) * 43758.5453);
          vec3 p = position;

          float sway = sin(uTime * 1.8 + worldInst.x * 0.42 + worldInst.z * 0.36) * 0.13 * vTip * vTip;
          p.x += sway;

          vec2 toGrass = worldInst.xz - uPlayerPos.xz;
          float dist = length(toGrass);
          float bend = smoothstep(1.9, 0.25, dist);
          vGreeted = smoothstep(3.4, 0.6, dist);
          if (dist > 0.001) {
            vec2 pushDir = normalize(toGrass);
            p.xz += pushDir * bend * 0.42 * vTip;
            p.y -= bend * 0.15 * vTip;
          }

          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying float vTip;
        varying float vGreeted;
        varying float vVar;
        void main() {
          vec3 baseCol = vec3(0.18, 0.42, 0.18);
          vec3 tipCol = mix(vec3(0.46, 0.78, 0.32), vec3(0.68, 0.88, 0.36), vVar);
          vec3 greetedTip = vec3(0.76, 1.0, 0.52);
          vec3 col = mix(baseCol, mix(tipCol, greetedTip, vGreeted * 0.72), vTip);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    const mesh = new THREE.InstancedMesh(bladeGeo, this.grassMaterial, count);
    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let attempt = 0; attempt < count * 3 && placed < count; attempt++) {
      const x = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60 - 4;
      const distRiver = Math.abs(x - this.getRiverCenterX(z));
      const distPav = Math.hypot(x - 14, z + 10);
      if (distRiver < 3.6 || distPav < 5.3 || x > 21) continue;

      const y = this.getGroundHeight(x, z);
      dummy.position.set(x, y - 0.04, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const s = 0.72 + Math.random() * 0.85;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed++, dummy.matrix);
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  private buildWildflowers(): void {
    const count = 480;
    const geo = new THREE.SphereGeometry(0.12, 8, 6);
    geo.scale(1.1, 0.48, 1.1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x3a2a38,
      emissiveIntensity: 0.38,
      roughness: 0.35
    });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();
    const palette = [
      new THREE.Color(0xffb8d9),
      new THREE.Color(0x9ee6ff),
      new THREE.Color(0xfff199),
      new THREE.Color(0xd5b3ff),
      new THREE.Color(0xffffff)
    ];

    let placed = 0;
    for (let i = 0; i < count * 2 && placed < count; i++) {
      const x = (Math.random() - 0.5) * 52;
      const z = (Math.random() - 0.5) * 52 - 3;
      if (Math.abs(x - this.getRiverCenterX(z)) < 3.4 || Math.hypot(x - 14, z + 10) < 5.5 || x > 20) continue;
      const y = this.getGroundHeight(x, z);
      dummy.position.set(x, y + 0.28, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      const s = 0.65 + Math.random() * 0.8;
      dummy.scale.set(s, s, s);
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
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xf4ead5,
      map: this.tex.stone.map,
      normalMap: this.tex.stone.normalMap,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughnessMap: this.tex.stone.roughnessMap,
      roughness: 0.68,
      metalness: 0.06
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf2c96b,
      emissive: 0x5c3e08,
      emissiveIntensity: 0.28,
      roughness: 0.22,
      metalness: 0.82
    });

    const bridgeGroup = new THREE.Group();
    const bridgeZ = 1.5;
    const bridgeX = this.getRiverCenterX(bridgeZ);
    const deckSegs = 11;
    for (let i = 0; i < deckSegs; i++) {
      const t = i / (deckSegs - 1) - 0.5;
      const archY = Math.cos(t * Math.PI) * 1.05 + 0.14;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 3.4), stoneMat);
      plank.position.set(t * 8.8, archY, 0);
      plank.rotation.z = -Math.sin(t * Math.PI) * 0.28;
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);

      if (i % 2 === 0) {
        [-1.55, 1.55].forEach((sideZ) => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.96, 12), stoneMat);
          post.position.set(t * 8.8, archY + 0.52, sideZ);
          post.castShadow = true;
          bridgeGroup.add(post);

          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), goldTrimMat);
          cap.position.set(t * 8.8, archY + 1.02, sideZ);
          bridgeGroup.add(cap);
        });
      }
    }
    bridgeGroup.position.set(bridgeX, 0, bridgeZ);
    this.group.add(bridgeGroup);

    const pathPoints: [number, number][] = [
      [0, 12], [-0.5, 9], [-1.2, 6.2], [1.5, 3.5], [4.5, 0.5], [7.5, -2.5], [10.2, -5.5],
      [-7.5, 0.5], [-10.5, -2.0], [-13.0, -4.5],
      [0, -4], [0, -9], [0, -14], [0, -19], [0, -24]
    ];
    pathPoints.forEach(([px, pz]) => {
      const y = this.getGroundHeight(px, pz);
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.2, 0.16, 16), stoneMat);
      stone.position.set(px, y + 0.04, pz);
      stone.receiveShadow = true;
      this.group.add(stone);
    });
  }

  private buildWalledOrchardAndBotanicalTrees(): void {
    const cx = -14.5;
    const cz = -9.0;
    const radius = 8.2;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf1e7d2,
      map: this.tex.stone.map,
      normalMap: this.tex.stone.normalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughnessMap: this.tex.stone.roughnessMap,
      roughness: 0.76
    });

    const wallSegments = 22;
    for (let i = 0; i < wallSegments; i++) {
      const angle = (i / wallSegments) * Math.PI * 2;
      if ((angle > -0.35 && angle < 0.55) || (angle > 1.25 && angle < 1.95)) continue;
      const wx = cx + Math.cos(angle) * radius;
      const wz = cz + Math.sin(angle) * radius;
      const wy = this.getGroundHeight(wx, wz);

      const block = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.25, 0.68), wallMat);
      block.position.set(wx, wy + 0.55, wz);
      block.rotation.y = -angle + Math.PI / 2;
      block.castShadow = true;
      block.receiveShadow = true;
      this.group.add(block);
    }

    // Organic Botanical Olive & Trees of Life (gnarled trunks + textured leaf-sprig cards)
    const orchardTrees: [number, number, number][] = [
      [-14.8, -9.2, 1.38],
      [-18.8, -6.5, 1.08],
      [-18.5, -12.5, 1.12],
      [-11.5, -11.8, 0.98],
      [6.5, 8.5, 1.12],
      [-8.5, 9.5, 1.04],
      [9.5, 1.5, 0.98],
      [18.2, -3.5, 0.92],
      [-10.5, -20.5, 1.22],
      [10.2, -19.5, 1.16]
    ];
    orchardTrees.forEach(([tx, tz, scale], idx) => {
      this.createBotanicalTree(tx, tz, scale, idx === 0);
    });

    // Tall Mediterranean Cypress Spires framing the Terrace & River (C016_I01_Covenant.png)
    const cypressSpots: [number, number, number][] = [
      [-9.5, 14.5, 1.15], [14.5, 11.5, 1.25], [17.8, -14.5, 1.3],
      [-18.5, 4.5, 1.1], [-15.2, -23.0, 1.35], [13.5, -24.5, 1.25],
      [6.8, -28.0, 1.18], [-6.8, -28.5, 1.22]
    ];
    cypressSpots.forEach(([tx, tz, s]) => this.createCypressTree(tx, tz, s));

    // Drifting luminous healing leaves in the Orchard
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
    this.fallingLeaves = new THREE.Points(
      leafGeo,
      new THREE.PointsMaterial({
        map: this.tex.softGlow,
        color: 0xd9ff9c,
        size: 0.24,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    this.group.add(this.fallingLeaves);

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

  private createBotanicalTree(x: number, z: number, scale: number, isHealingTree: boolean): void {
    const g = new THREE.Group();
    const y = this.getGroundHeight(x, z);

    const barkMat = new THREE.MeshStandardMaterial({
      color: 0xb39c86,
      map: this.tex.bark.map,
      normalMap: this.tex.bark.normalMap,
      normalScale: new THREE.Vector2(1.4, 1.4),
      roughnessMap: this.tex.bark.roughnessMap,
      roughness: 0.92
    });

    // Sculpted gnarled tapering trunk
    const trunkProfile = [
      new THREE.Vector2(0.46 * scale, 0),
      new THREE.Vector2(0.32 * scale, 0.8 * scale),
      new THREE.Vector2(0.26 * scale, 2.0 * scale),
      new THREE.Vector2(0.2 * scale, 3.1 * scale)
    ];
    const trunk = new THREE.Mesh(new THREE.LatheGeometry(trunkProfile, 12), barkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    g.add(trunk);

    // 4 Spreading Major Branches
    const branchAngles = [0.2, 1.75, 3.3, 4.9];
    branchAngles.forEach((ba, idx) => {
      const bLen = (1.6 + (idx % 2) * 0.45) * scale;
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.16 * scale, bLen, 8), barkMat);
      limb.position.set(Math.cos(ba) * 0.65 * scale, 2.95 * scale, Math.sin(ba) * 0.65 * scale);
      limb.rotation.z = -Math.cos(ba) * 0.65;
      limb.rotation.x = Math.sin(ba) * 0.65;
      limb.castShadow = true;
      g.add(limb);
    });

    // Dense Botanical Alpha-Cutout Leaf Sprig Cards (replaces faceted blobs!)
    const leafMat = new THREE.MeshStandardMaterial({
      map: this.tex.leafCard,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      color: isHealingTree ? 0xc8ff9e : 0xa5e084,
      emissive: isHealingTree ? 0x3b6e24 : 0x1e3816,
      emissiveIntensity: isHealingTree ? 0.48 : 0.22,
      roughness: 0.68
    });

    const cardGeo = new THREE.PlaneGeometry(2.1 * scale, 2.1 * scale);
    const clusterCount = 26;
    for (let i = 0; i < clusterCount; i++) {
      const a = (i / clusterCount) * Math.PI * 2 * 3.1;
      const r = (0.35 + ((i * 7) % 10) * 0.19) * scale;
      const cy = (3.1 + Math.sin(i * 1.9) * 0.95 + (r < 1.0 * scale ? 0.55 * scale : 0)) * scale;
      const card = new THREE.Mesh(cardGeo, leafMat);
      card.position.set(Math.cos(a) * r, cy, Math.sin(a) * r);
      card.rotation.set(
        (Math.sin(i * 2.3) - 0.5) * 0.9,
        a + i * 0.7,
        (Math.cos(i * 1.7) - 0.5) * 0.6
      );
      card.castShadow = true;
      g.add(card);
    }

    // Glowing Golden Fruits nestled in the canopy
    const fruitMat = new THREE.MeshStandardMaterial({
      color: 0xffd263,
      emissive: 0xffa824,
      emissiveIntensity: 0.68,
      roughness: 0.24
    });
    for (let i = 0; i < (isHealingTree ? 12 : 6); i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = (0.95 + (i % 3) * 0.48) * scale;
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.12 * scale, 10, 10), fruitMat);
      fruit.position.set(Math.cos(a) * r, (2.8 + (i % 2) * 0.55) * scale, Math.sin(a) * r);
      g.add(fruit);
    }

    if (isHealingTree) {
      const treeGlow = new THREE.PointLight(0xdfffa6, 2.0, 14);
      treeGlow.position.set(0, 3.4, 0);
      g.add(treeGlow);
    }

    g.position.set(x, y, z);
    this.group.add(g);
  }

  private createCypressTree(x: number, z: number, scale: number): void {
    const g = new THREE.Group();
    const y = this.getGroundHeight(x, z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * scale, 0.2 * scale, 2.0 * scale, 8),
      new THREE.MeshStandardMaterial({ map: this.tex.bark.map, normalMap: this.tex.bark.normalMap, roughness: 0.9 })
    );
    trunk.position.y = 1.0 * scale;
    g.add(trunk);

    const cyMat = new THREE.MeshStandardMaterial({
      map: this.tex.cypressCard,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      color: 0x6ea665,
      roughness: 0.78
    });

    for (let tier = 0; tier < 4; tier++) {
      const w = (1.65 - tier * 0.32) * scale;
      const h = (2.4 - tier * 0.2) * scale;
      for (let r = 0; r < 3; r++) {
        const card = new THREE.Mesh(new THREE.PlaneGeometry(w, h), cyMat);
        card.position.y = (2.1 + tier * 1.45) * scale;
        card.rotation.y = (r / 3) * Math.PI + tier * 0.5;
        card.castShadow = true;
        g.add(card);
      }
    }

    g.position.set(x, y, z);
    this.group.add(g);
  }

  private buildMemoryPavilion(): void {
    const px = 14.0;
    const pz = -10.0;
    const py = this.getGroundHeight(px, pz);
    const pav = new THREE.Group();
    pav.position.set(px, py, pz);

    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xfaf3e8,
      map: this.tex.stone.map,
      normalMap: this.tex.stone.normalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: this.tex.stone.roughnessMap,
      roughness: 0.28,
      metalness: 0.1
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf7cf6b,
      emissive: 0x704d0a,
      emissiveIntensity: 0.38,
      roughness: 0.2,
      metalness: 0.86
    });

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.7, 0.38, 40), marbleMat);
    dais.position.y = 0.19;
    dais.receiveShadow = true;
    pav.add(dais);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.28, 16, 48), marbleMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.72;
    rim.castShadow = true;
    pav.add(rim);

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

    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.46, 1.55, 20), marbleMat);
    fBase.position.y = 1.25;
    pav.add(fBase);
    const fBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.25, 0.34, 24), goldMat);
    fBowl.position.y = 1.98;
    pav.add(fBowl);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.26, 4.65, 16), marbleMat);
      col.position.set(Math.cos(a) * 4.5, 2.5, Math.sin(a) * 4.5);
      col.castShadow = true;
      pav.add(col);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.24, 16), goldMat);
      cap.position.set(Math.cos(a) * 4.5, 4.78, Math.sin(a) * 4.5);
      pav.add(cap);
    }

    const crownRing = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.24, 14, 48), goldMat);
    crownRing.rotation.x = Math.PI / 2;
    crownRing.position.y = 4.9;
    pav.add(crownRing);

    const poolLight = new THREE.PointLight(0xffdd88, 3.2, 20);
    poolLight.position.set(0, 2.6, 0);
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

    const cairn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.62, 1.15, 12),
      new THREE.MeshStandardMaterial({
        color: 0xb6bac0,
        map: this.tex.stone.map,
        normalMap: this.tex.stone.normalMap,
        roughness: 0.9
      })
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
    const gateZ = -48;
    const gateY = 4.2;

    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, gateY, gateZ);

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
          vec3 pearl = vec3(0.98, 0.96, 0.93);
          vec3 nacre = vec3(
            0.95 + 0.08 * sin(uTime * 0.7 + fres * 5.0),
            0.90 + 0.10 * sin(uTime * 0.7 + fres * 5.0 + 2.0),
            1.0
          );
          vec3 col = mix(pearl, nacre, fres) + vec3(1.0, 0.92, 0.7) * fres * 0.35;
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    const pearlArch = new THREE.Mesh(new THREE.TorusGeometry(9.5, 2.5, 28, 56, Math.PI), this.pearlMaterial);
    pearlArch.position.y = 2.5;
    gateGroup.add(pearlArch);

    // Fluted jasper walls & distant radiant city spires (C016_I04 / C017_I04)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xfff6e5,
      map: this.tex.stone.map,
      normalMap: this.tex.stone.normalMap,
      emissive: 0x6b532b,
      emissiveIntensity: 0.3,
      roughness: 0.24
    });
    [-19, 19].forEach((wx) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(20, 9.5, 3.2), wallMat);
      w.position.set(wx, 4.75, 0);
      gateGroup.add(w);
    });

    const spirePositions: [number, number, number][] = [
      [-14, 18, -14], [-7, 25, -20], [0, 36, -26], [7, 24, -20], [14, 17, -15]
    ];
    spirePositions.forEach(([sx, sh, sz]) => {
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.2, sh, 8), wallMat);
      spire.position.set(sx, sh * 0.5 + 3, sz);
      gateGroup.add(spire);
    });

    const pillarGeo = new THREE.CylinderGeometry(2.4, 7.2, 110, 32, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xfff3c9,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(0, 52, -32);
    gateGroup.add(pillar);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(18, 0.62, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xffe49e, transparent: true, opacity: 0.65 })
    );
    halo.position.set(0, 22, -28);
    gateGroup.add(halo);

    const sea = new THREE.Mesh(
      new THREE.CircleGeometry(72, 48),
      new THREE.MeshBasicMaterial({ color: 0x2a7ae0, transparent: true, opacity: 0.5 })
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, 2.2, -52);
    gateGroup.add(sea);

    this.group.add(gateGroup);

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

  private buildVolumetricGodRaysAndMotes(): void {
    // Soft diagonal golden sunbeams filtering through the Terrace & Walled Orchard
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xffefc2,
      transparent: true,
      opacity: 0.065,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const raySpots: [number, number][] = [
      [-14.5, -9.0], [14.0, -10.0], [0, 5.0], [4.5, 1.5], [-6.5, 8.5]
    ];
    raySpots.forEach(([rx, rz]) => {
      const ray = new THREE.Mesh(new THREE.ConeGeometry(4.2, 22, 16, 1, true), rayMat);
      ray.position.set(rx, 10.5, rz);
      ray.rotation.x = 0.26;
      ray.rotation.z = -0.14;
      this.group.add(ray);
    });

    // Floating sunlit golden dust/pollen motes across the entire Terrace
    const moteCount = 320;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 52;
      motePos[i * 3 + 1] = 0.6 + Math.random() * 8.5;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 52 - 4;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    this.goldenMotes = new THREE.Points(
      moteGeo,
      new THREE.PointsMaterial({
        map: this.tex.softGlow,
        color: 0xfff0b8,
        size: 0.22,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    this.group.add(this.goldenMotes);
  }

  private buildPrismaticBirds(): void {
    const trailColors = [0xffa6d8, 0x8ef2ff, 0xffe680, 0xc9a8ff, 0xa8ffbe];

    for (let i = 0; i < 6; i++) {
      const bird = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.4, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      body.rotation.x = Math.PI / 2;
      bird.add(body);

      const wingMat = new THREE.MeshBasicMaterial({ color: trailColors[i % trailColors.length], side: THREE.DoubleSide });
      const leftW = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.15), wingMat);
      leftW.position.x = -0.22;
      leftW.rotation.x = Math.PI / 2;
      bird.add(leftW);

      const rightW = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.15), wingMat);
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
        height: 4.8 + (i % 4) * 1.4,
        center: new THREE.Vector3(i % 2 === 0 ? -4 : 6, 0, -4 + (i - 3) * 2)
      });
    }
  }

  private buildSaintsAndBenches(): void {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x9c7b56,
      map: this.tex.bark.map,
      normalMap: this.tex.bark.normalMap,
      roughness: 0.78
    });
    const stoneLegMat = new THREE.MeshStandardMaterial({
      color: 0xe9dec8,
      map: this.tex.stone.map,
      normalMap: this.tex.stone.normalMap,
      roughness: 0.65
    });

    SAINTS.forEach((profile) => {
      const [sx, , sz] = profile.position;
      const sy = this.getGroundHeight(sx, sz);

      const agent = new SaintAgent(profile, sy, this.tex.fabric);
      this.group.add(agent.group);
      this.saintAgents.set(profile.id, agent);

      let seatPos: THREE.Vector3 | undefined;
      if (profile.hasBench && profile.benchOffset) {
        const bx = sx + profile.benchOffset[0];
        const bz = sz + profile.benchOffset[2];
        const by = this.getGroundHeight(bx, bz);

        const bench = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.14, 0.64), woodMat);
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
      map: this.tex.softGlow,
      color: 0xeaffb0,
      size: 0.34,
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

    this.saintAgents.forEach((agent) => {
      if (agent.group.position.distanceTo(origin) < 24) {
        agent.triggerLeafReaction();
      }
    });
  }

  public update(dt: number, elapsed: number, playerPos: THREE.Vector3): void {
    if (this.skyMaterial) this.skyMaterial.uniforms.uTime.value = elapsed;
    if (this.grassMaterial) {
      this.grassMaterial.uniforms.uTime.value = elapsed;
      this.grassMaterial.uniforms.uPlayerPos.value.copy(playerPos);
    }
    if (this.waterMaterial) this.waterMaterial.uniforms.uTime.value = elapsed;
    if (this.waterfallMat) this.waterfallMat.uniforms.uTime.value = elapsed;
    if (this.poolMaterial) this.poolMaterial.uniforms.uTime.value = elapsed;
    if (this.pearlMaterial) this.pearlMaterial.uniforms.uTime.value = elapsed;

    // Gentle drift of golden sunlit dust motes
    if (this.goldenMotes) {
      this.goldenMotes.position.y = Math.sin(elapsed * 0.4) * 0.25;
      this.goldenMotes.rotation.y = elapsed * 0.008;
    }

    // Rising waterfall mist
    if (this.waterfallMist) {
      const mp = this.waterfallMist.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < mp.count; i++) {
        let my = mp.getY(i) + dt * 0.55;
        if (my > 5.0) my = 0.2;
        mp.setY(i, my);
      }
      mp.needsUpdate = true;
    }

    // Prismatic birds & ribbon trails
    this.birds.forEach((b, idx) => {
      b.angle += dt * b.speed;
      const nx = b.center.x + Math.cos(b.angle) * b.radius;
      const nz = b.center.z + Math.sin(b.angle * 0.85) * (b.radius * 0.72);
      const ny = b.height + Math.sin(elapsed * 1.4 + idx) * 0.9;

      const prevX = b.mesh.position.x;
      const prevZ = b.mesh.position.z;
      b.mesh.position.set(nx, ny, nz);
      b.mesh.lookAt(nx + (nx - prevX), ny, nz + (nz - prevZ));

      const flap = Math.sin(elapsed * 14 + idx * 2) * 0.55;
      b.mesh.children[1].rotation.z = flap;
      b.mesh.children[2].rotation.z = -flap;

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

    this.mistClouds.forEach((puff, i) => {
      puff.position.y += Math.sin(elapsed * 0.5 + i) * dt * 0.12;
      puff.rotation.y += dt * 0.04;
    });

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
