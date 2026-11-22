import * as THREE from 'three';
import type { SaintProfile } from '../data/dialogues';

export type SaintBody = 'youth' | 'sturdy' | 'elder' | 'woman';

export interface SaintLook {
  body: SaintBody;
  shoulder: number;
  hair: 'balding' | 'short' | 'full' | 'gray' | 'covered';
  beard: 'none' | 'short' | 'full' | 'long';
}

export function lookFor(profile: SaintProfile): SaintLook {
  const woman = profile.hasHeadscarf || profile.id === 'mara' || profile.id === 'mary_magdalene';
  let body: SaintBody = 'youth';
  if (woman) body = 'woman';
  else if (profile.id === 'peter') body = 'sturdy';
  else if (['amos', 'elias', 'moses', 'elijah', 'isaiah', 'john', 'thomas'].includes(profile.id)) body = 'elder';

  let hair: SaintLook['hair'] = 'full';
  if (profile.balding) hair = 'balding';
  else if (woman) hair = 'covered';
  else if (profile.hairColor > 0xb0b0b0) hair = 'gray';
  else if (profile.id === 'peter' || profile.id === 'thomas') hair = 'short';

  let beard: SaintLook['beard'] = 'none';
  if (!woman && profile.hasBeard) {
    if (profile.id === 'moses' || profile.id === 'elijah') beard = 'long';
    else if (profile.id === 'paul' || profile.id === 'thomas') beard = 'short';
    else beard = 'full';
  }

  const shoulder = profile.id === 'peter' ? 1.16 : profile.id === 'paul' ? 0.9 : woman ? 0.95 : 1.02;
  return { body, shoulder, hair, beard };
}

export interface FaceUniforms {
  uHead: { value: THREE.Vector3 };
  uHeadUp: { value: THREE.Vector3 };
  uHeadFwd: { value: THREE.Vector3 };
  uHandL: { value: THREE.Vector3 };
  uHandR: { value: THREE.Vector3 };
}

export function createFaceUniforms(): FaceUniforms {
  return {
    uHead: { value: new THREE.Vector3() },
    uHeadUp: { value: new THREE.Vector3(0, 1, 0) },
    uHeadFwd: { value: new THREE.Vector3(0, 0, 1) },
    uHandL: { value: new THREE.Vector3() },
    uHandR: { value: new THREE.Vector3() }
  };
}

/** Keep the scanned face and hands. Hide hoodies, jeans, hats and packs. */
export function revealFaceAndHands(material: THREE.MeshStandardMaterial, uniforms: FaceUniforms): void {
  material.transparent = true;
  material.alphaTest = 0.5;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSaintWorld;')
      .replace(
        '#include <project_vertex>',
        'vSaintWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#include <project_vertex>'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vSaintWorld;
         uniform vec3 uHead;
         uniform vec3 uHeadUp;
         uniform vec3 uHeadFwd;
         uniform vec3 uHandL;
         uniform vec3 uHandR;`
      )
      .replace(
        '#include <alphamap_fragment>',
        `#include <alphamap_fragment>
         vec3 rel = vSaintWorld - uHead;
         float up = dot(rel, uHeadUp);
         float headBall = 1.0 - smoothstep(0.12, 0.2, length(rel));
         float notHat = 1.0 - smoothstep(0.09, 0.16, up);
         float face = headBall * notHat;
         float handL = 1.0 - smoothstep(0.06, 0.1, distance(vSaintWorld, uHandL));
         float handR = 1.0 - smoothstep(0.06, 0.1, distance(vSaintWorld, uHandR));
         if (max(face, max(handL, handR)) < 0.25) discard;`
      );
  };
  material.needsUpdate = true;
}

function fold(geometry: THREE.BufferGeometry, amount: number, freq: number): void {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const ang = Math.atan2(z, x);
    const foldAmt = 1 + amount * Math.sin(ang * freq);
    pos.setX(i, x * foldAmt);
    pos.setZ(i, z * foldAmt);
  }
  geometry.computeVertexNormals();
}

export function linenMaterial(map: THREE.Texture, normal: THREE.Texture, tint = 0xfff6ea): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: tint,
    map,
    normalMap: normal,
    roughness: 0.72,
    metalness: 0.02,
    side: THREE.DoubleSide
  });
  mat.normalScale = new THREE.Vector2(0.45, 0.45);
  return mat;
}

/** White linen robe parented onto the shared skeleton so the walk cycle moves it. */
export function dressInRobe(
  model: THREE.Object3D,
  linen: THREE.MeshStandardMaterial,
  trimColor: number
): void {
  const skirtPts: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const y = -t * 1.02;
    const flare = 0.2 + Math.pow(t, 1.15) * 0.34;
    skirtPts.push(new THREE.Vector2(flare, y));
  }
  const skirtGeo = new THREE.LatheGeometry(skirtPts, 28);
  fold(skirtGeo, 0.07, 9);
  const skirt = new THREE.Mesh(skirtGeo, linen);
  skirt.castShadow = true;
  attach(model, 'hips', skirt, new THREE.Vector3(0, 0.02, 0));

  const bodiceGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.32, 20, 1, true);
  fold(bodiceGeo, 0.04, 7);
  const bodice = new THREE.Mesh(bodiceGeo, linen);
  bodice.castShadow = true;
  attach(model, 'chest', bodice, new THREE.Vector3(0, 0.02, 0));

  const sleeveGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.32, 12, 1, true);
  const sleeveL = new THREE.Mesh(sleeveGeo, linen);
  const sleeveR = new THREE.Mesh(sleeveGeo, linen);
  sleeveL.castShadow = sleeveR.castShadow = true;
  aimSleeve(model, 'upperarm_L', 'forearm_L', sleeveL);
  aimSleeve(model, 'upperarm_R', 'forearm_R', sleeveR);

  const foreGeo = new THREE.CylinderGeometry(0.055, 0.075, 0.26, 10, 1, true);
  const foreL = new THREE.Mesh(foreGeo, linen);
  const foreR = new THREE.Mesh(foreGeo, linen);
  aimSleeve(model, 'forearm_L', 'hand_L', foreL);
  aimSleeve(model, 'forearm_R', 'hand_R', foreR);

  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    roughness: 0.4,
    metalness: 0.35,
    emissive: trimColor,
    emissiveIntensity: 0.12
  });
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 8, 20), trimMat);
  belt.rotation.x = Math.PI / 2;
  attach(model, 'hips', belt, new THREE.Vector3(0, 0.04, 0));

  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.012, 6, 24), trimMat);
  hem.rotation.x = Math.PI / 2;
  attach(model, 'hips', hem, new THREE.Vector3(0, -0.98, 0));

  const stole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.02), trimMat);
  stole.position.set(0.12, -0.05, 0.16);
  const stoleBone = model.getObjectByName('chest');
  stoleBone?.add(stole);
}

export function dressHead(head: THREE.Object3D, look: SaintLook, profile: SaintProfile, linen: THREE.MeshStandardMaterial): void {
  const hairMat = new THREE.MeshStandardMaterial({ color: profile.hairColor, roughness: 0.68 });
  const skinMat = new THREE.MeshStandardMaterial({ color: profile.skinColor, roughness: 0.5 });

  if (look.hair === 'balding') {
    const scalp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.46), skinMat);
    scalp.position.set(0, 0.14, 0.01);
    const fringe = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.024, 8, 16), hairMat);
    fringe.rotation.x = Math.PI / 2.15;
    fringe.position.set(0, 0.085, 0.02);
    const nape = new THREE.Mesh(new THREE.SphereGeometry(0.086, 10, 8, 0.3, 2.5, 1.2, 0.8), hairMat);
    nape.position.set(0, 0.04, -0.03);
    head.add(scalp, fringe, nape);
  } else   if (look.hair === 'covered') {
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.42), linen);
    veil.position.set(0, -0.02, -0.11);
    const sideL = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.28), linen);
    sideL.position.set(-0.1, 0.02, 0.0);
    sideL.rotation.y = 0.9;
    const sideR = sideL.clone();
    sideR.position.x = 0.1;
    sideR.rotation.y = -0.9;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 16), linen);
    band.rotation.x = Math.PI / 2.4;
    band.position.set(0, 0.1, 0.03);
    head.add(veil, sideL, sideR, band);
  } else {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(look.hair === 'short' ? 0.108 : 0.118, 14, 10, 0, Math.PI * 2, 0, look.hair === 'short' ? 0.55 : 0.7),
      hairMat
    );
    cap.position.set(0, 0.1, 0);
    head.add(cap);
  }

  if (look.beard === 'none') return;
  const length = look.beard === 'short' ? 0.08 : look.beard === 'full' ? 0.16 : 0.32;
  const pts = [
    new THREE.Vector2(0.015, 0.01),
    new THREE.Vector2(0.055, -length * 0.25),
    new THREE.Vector2(0.045, -length * 0.7),
    new THREE.Vector2(0.012, -length)
  ];
  const beard = new THREE.Mesh(new THREE.LatheGeometry(pts, 12), hairMat);
  beard.position.set(0, -0.02, 0.07);
  head.add(beard);
}

function attach(model: THREE.Object3D, boneName: string, mesh: THREE.Object3D, position: THREE.Vector3): void {
  const bone = model.getObjectByName(boneName);
  if (!bone) return;
  mesh.position.copy(position);
  bone.add(mesh);
}

/** Point a Y-up sleeve along the bone toward its child, so it follows the arm. */
function aimSleeve(model: THREE.Object3D, boneName: string, childName: string, mesh: THREE.Mesh): void {
  const bone = model.getObjectByName(boneName);
  const child = model.getObjectByName(childName);
  if (!bone || !child) return;
  const dir = child.position.clone();
  if (dir.lengthSq() < 1e-6) dir.set(0, -1, 0);
  dir.normalize();
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  mesh.position.copy(dir).multiplyScalar(0.16);
  bone.add(mesh);
}
