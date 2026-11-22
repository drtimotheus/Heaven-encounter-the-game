import * as THREE from 'three';

export interface PBRMaterialMaps {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

function hash2D(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2D(ix, iy);
  const b = hash2D(ix + 1, iy);
  const c = hash2D(ix, iy + 1);
  const d = hash2D(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += smoothNoise(x * freq, y * freq) * amp;
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

function heightFieldToNormalTexture(heights: Float32Array, size: number, strength = 2.4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const ym = (y - 1 + size) % size;
      const yp = (y + 1) % size;

      const dx = (heights[y * size + xp] - heights[y * size + xm]) * strength;
      const dy = (heights[yp * size + x] - heights[ym * size + x]) * strength;
      const dz = 1.0;
      const len = Math.hypot(dx, dy, dz);

      const idx = (y * size + x) * 4;
      img.data[idx] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      img.data[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      img.data[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function finalizeRepeatTexture(canvas: HTMLCanvasElement, repeatX: number, repeatY: number, isColor = true): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Generates high-detail seamless PBR textures (Albedo, Normal, Roughness)
 * for Mediterranean stone, living grass/moss ground, tree bark, woven linen,
 * botanical leaf-sprig alpha cards, and rippling water normals.
 */
export class ProceduralTextureLibrary {
  public readonly stone: PBRMaterialMaps;
  public readonly terrain: PBRMaterialMaps;
  public readonly bark: PBRMaterialMaps;
  public readonly fabric: PBRMaterialMaps;
  public readonly leafCard: THREE.CanvasTexture;
  public readonly cypressCard: THREE.CanvasTexture;
  public readonly waterNormal: THREE.CanvasTexture;
  public readonly softGlow: THREE.CanvasTexture;

  constructor() {
    this.stone = this.createTravertineStone(256, 2, 2);
    this.terrain = this.createMeadowGround(256, 18, 18);
    this.bark = this.createTreeBark(256, 2, 3);
    this.fabric = this.createWovenFabric(128, 3, 3);
    this.leafCard = this.createLeafSprigTexture(256, false);
    this.cypressCard = this.createLeafSprigTexture(256, true);
    this.waterNormal = this.createWaterNormal(256);
    this.softGlow = this.createSoftRadialGlow(128);
  }

  private createTravertineStone(size: number, rx: number, ry: number): PBRMaterialMaps {
    const colCanvas = document.createElement('canvas');
    const roughCanvas = document.createElement('canvas');
    colCanvas.width = roughCanvas.width = size;
    colCanvas.height = roughCanvas.height = size;
    const cCtx = colCanvas.getContext('2d')!;
    const rCtx = roughCanvas.getContext('2d')!;
    const cImg = cCtx.createImageData(size, size);
    const rImg = rCtx.createImageData(size, size);
    const heights = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        // Layered Mediterranean travertine veins + subtle masonry joints
        const n = fbm(u * 8, v * 14, 4);
        const vein = Math.sin(v * Math.PI * 10 + n * 4.5) * 0.5 + 0.5;
        const mortarY = Math.abs(((v * 4) % 1) - 0.5) > 0.47 ? 1 : 0;
        const row = Math.floor(v * 4);
        const mortarX = Math.abs((((u * 2 + row * 0.5) % 1) - 0.5)) > 0.485 ? 1 : 0;
        const seam = Math.max(mortarY, mortarX);

        const h = (n * 0.65 + vein * 0.25) * (1 - seam * 0.72);
        heights[y * size + x] = h;

        const baseR = 236 - n * 24 - seam * 42;
        const baseG = 223 - n * 26 - seam * 44;
        const baseB = 196 - n * 30 - seam * 40;

        const idx = (y * size + x) * 4;
        cImg.data[idx] = Math.max(0, Math.min(255, baseR));
        cImg.data[idx + 1] = Math.max(0, Math.min(255, baseG));
        cImg.data[idx + 2] = Math.max(0, Math.min(255, baseB));
        cImg.data[idx + 3] = 255;

        const rough = Math.round((0.52 + (1 - h) * 0.38) * 255);
        rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = rough;
        rImg.data[idx + 3] = 255;
      }
    }
    cCtx.putImageData(cImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);

    const normalMap = heightFieldToNormalTexture(heights, size, 3.2);
    normalMap.repeat.set(rx, ry);

    return {
      map: finalizeRepeatTexture(colCanvas, rx, ry, true),
      normalMap,
      roughnessMap: finalizeRepeatTexture(roughCanvas, rx, ry, false)
    };
  }

  private createMeadowGround(size: number, rx: number, ry: number): PBRMaterialMaps {
    const colCanvas = document.createElement('canvas');
    const roughCanvas = document.createElement('canvas');
    colCanvas.width = roughCanvas.width = size;
    colCanvas.height = roughCanvas.height = size;
    const cCtx = colCanvas.getContext('2d')!;
    const rCtx = roughCanvas.getContext('2d')!;
    const cImg = cCtx.createImageData(size, size);
    const rImg = rCtx.createImageData(size, size);
    const heights = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        const n1 = fbm(u * 12, v * 12, 4);
        const fine = hash2D(x * 1.7, y * 1.7) * 0.18;
        const h = n1 * 0.8 + fine;
        heights[y * size + x] = h;

        // Neutral luminous moss-turf detail multiplied smoothly with vertex colors
        const shade = 205 + h * 50;
        const idx = (y * size + x) * 4;
        cImg.data[idx] = Math.min(255, shade * 0.96);
        cImg.data[idx + 1] = Math.min(255, shade * 1.04);
        cImg.data[idx + 2] = Math.min(255, shade * 0.9);
        cImg.data[idx + 3] = 255;

        const rough = Math.round((0.78 + (1 - h) * 0.18) * 255);
        rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = rough;
        rImg.data[idx + 3] = 255;
      }
    }
    cCtx.putImageData(cImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);

    const normalMap = heightFieldToNormalTexture(heights, size, 2.2);
    normalMap.repeat.set(rx, ry);

    return {
      map: finalizeRepeatTexture(colCanvas, rx, ry, true),
      normalMap,
      roughnessMap: finalizeRepeatTexture(roughCanvas, rx, ry, false)
    };
  }

  private createTreeBark(size: number, rx: number, ry: number): PBRMaterialMaps {
    const colCanvas = document.createElement('canvas');
    const roughCanvas = document.createElement('canvas');
    colCanvas.width = roughCanvas.width = size;
    colCanvas.height = roughCanvas.height = size;
    const cCtx = colCanvas.getContext('2d')!;
    const rCtx = roughCanvas.getContext('2d')!;
    const cImg = cCtx.createImageData(size, size);
    const rImg = rCtx.createImageData(size, size);
    const heights = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        const ridge = fbm(u * 22, v * 5, 4);
        const furrow = Math.sin(u * Math.PI * 16 + ridge * 5) * 0.5 + 0.5;
        const h = ridge * 0.55 + furrow * 0.45;
        heights[y * size + x] = h;

        const idx = (y * size + x) * 4;
        cImg.data[idx] = Math.round(78 + h * 58);
        cImg.data[idx + 1] = Math.round(58 + h * 46);
        cImg.data[idx + 2] = Math.round(42 + h * 34);
        cImg.data[idx + 3] = 255;

        const rough = Math.round((0.8 + (1 - h) * 0.18) * 255);
        rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = rough;
        rImg.data[idx + 3] = 255;
      }
    }
    cCtx.putImageData(cImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);

    const normalMap = heightFieldToNormalTexture(heights, size, 4.2);
    normalMap.repeat.set(rx, ry);

    return {
      map: finalizeRepeatTexture(colCanvas, rx, ry, true),
      normalMap,
      roughnessMap: finalizeRepeatTexture(roughCanvas, rx, ry, false)
    };
  }

  private createWovenFabric(size: number, rx: number, ry: number): PBRMaterialMaps {
    const colCanvas = document.createElement('canvas');
    const roughCanvas = document.createElement('canvas');
    colCanvas.width = roughCanvas.width = size;
    colCanvas.height = roughCanvas.height = size;
    const cCtx = colCanvas.getContext('2d')!;
    const rCtx = roughCanvas.getContext('2d')!;
    const cImg = cCtx.createImageData(size, size);
    const rImg = rCtx.createImageData(size, size);
    const heights = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const warp = Math.sin(x * 1.45) * 0.5 + 0.5;
        const weft = Math.sin(y * 1.45) * 0.5 + 0.5;
        const fold = Math.sin((x / size) * Math.PI * 6) * 0.35 + 0.5;
        const h = ((warp + weft) * 0.25 + fold * 0.5);
        heights[y * size + x] = h;

        const lum = Math.round(218 + h * 37);
        const idx = (y * size + x) * 4;
        cImg.data[idx] = cImg.data[idx + 1] = cImg.data[idx + 2] = lum;
        cImg.data[idx + 3] = 255;

        const rough = Math.round((0.72 + (1 - h) * 0.22) * 255);
        rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = rough;
        rImg.data[idx + 3] = 255;
      }
    }
    cCtx.putImageData(cImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);

    const normalMap = heightFieldToNormalTexture(heights, size, 2.0);
    normalMap.repeat.set(rx, ry);

    return {
      map: finalizeRepeatTexture(colCanvas, rx, ry, true),
      normalMap,
      roughnessMap: finalizeRepeatTexture(roughCanvas, rx, ry, false)
    };
  }

  private createLeafSprigTexture(size: number, cypress: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    // Fine wooden twigs inside foliage cluster
    ctx.strokeStyle = 'rgba(84, 62, 42, 0.72)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, size * 0.92);
    ctx.quadraticCurveTo(cx + 6, cy, cx - 4, size * 0.14);
    ctx.stroke();

    const leafCount = cypress ? 75 : 52;
    for (let i = 0; i < leafCount; i++) {
      const a = (i / leafCount) * Math.PI * 2 + hash2D(i, 3) * 0.5;
      const dist = Math.sqrt(hash2D(i, 7)) * (size * (cypress ? 0.34 : 0.42));
      const lx = cx + Math.cos(a) * dist * (cypress ? 0.65 : 1.0);
      const ly = cy + Math.sin(a) * dist * (cypress ? 1.25 : 0.92);

      const rx = cypress ? 7 + hash2D(i, 11) * 7 : 11 + hash2D(i, 11) * 12;
      const ry = cypress ? 16 + hash2D(i, 13) * 14 : 6 + hash2D(i, 13) * 6;
      const rot = cypress ? (hash2D(i, 19) - 0.5) * 0.7 : a + (hash2D(i, 19) - 0.5) * 0.8;

      const lit = hash2D(i, 23);
      const r = cypress ? Math.round(44 + lit * 48) : Math.round(78 + lit * 95);
      const g = cypress ? Math.round(92 + lit * 64) : Math.round(138 + lit * 92);
      const b = cypress ? Math.round(46 + lit * 34) : Math.round(52 + lit * 52);

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.95)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sunlit center leaf vein
      ctx.strokeStyle = `rgba(${Math.min(255, r + 55)}, ${Math.min(255, g + 45)}, ${Math.min(255, b + 25)}, 0.45)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-rx * 0.75, 0);
      ctx.lineTo(rx * 0.75, 0);
      ctx.stroke();
      ctx.restore();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  private createWaterNormal(size: number): THREE.CanvasTexture {
    const heights = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        const w1 = Math.sin(u * Math.PI * 6 + v * Math.PI * 4) * 0.35;
        const w2 = Math.cos(u * Math.PI * 10 - v * Math.PI * 8) * 0.25;
        const w3 = fbm(u * 14, v * 14, 3) * 0.4;
        heights[y * size + x] = w1 + w2 + w3;
      }
    }
    const tex = heightFieldToNormalTexture(heights, size, 2.8);
    tex.repeat.set(4, 18);
    return tex;
  }

  private createSoftRadialGlow(size: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255, 250, 232, 1.0)');
    g.addColorStop(0.35, 'rgba(255, 236, 178, 0.55)');
    g.addColorStop(1, 'rgba(255, 224, 150, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
}

/**
 * Generates a warm golden Mediterranean HDR-style environment reflection map via PMREMGenerator
 * so marble, pearl, water, gold, skin, and fabric all receive realistic sky/sun IBL reflections.
 */
export function buildHeavenEnvironmentMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(50, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, -1.0, 1.0);
        vec3 ground = vec3(0.38, 0.46, 0.34);
        vec3 horizon = vec3(1.0, 0.92, 0.76);
        vec3 zenith = vec3(0.34, 0.58, 0.88);
        vec3 col = h < 0.0
          ? mix(horizon, ground, smoothstep(0.0, -0.45, h))
          : mix(horizon, zenith, smoothstep(0.0, 0.72, h));
        vec3 sunDir = normalize(vec3(0.05, 0.28, -0.96));
        float sun = max(dot(vDir, sunDir), 0.0);
        col += vec3(1.5, 1.25, 0.85) * pow(sun, 24.0);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  const envRT = pmrem.fromScene(envScene, 0.025);
  pmrem.dispose();
  return envRT.texture;
}
