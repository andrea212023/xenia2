// The 3D scene. Xenia herself is a sculpted model (assets/xenia.glb), finished in Blender:
// reduced for the web, turned to face the viewer, and given blink shapes for both eyes.
// The flowers around her are ten sculpted species (assets/flora.glb), split apart in Blender;
// they close and open through a small vertex shader. Loose petals and specks are made in code.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Measured on the model, in its own units (the bust is about 1 unit tall).
const MODEL_SCALE = 3.3;
const NECK_PIVOT = new THREE.Vector3(0.0, 0.31, 0.03);
const EYE_R = new THREE.Vector3(-0.115, 0.575, 0.283);
const EYE_L = new THREE.Vector3(0.1, 0.594, 0.28);
const FACE = new THREE.Vector3(-0.01, 0.6, 0.25);

/* ---------- loose petals ---------- */
const PETAL = { w: 0.56, cup: 0.42, curl: 0.9, tip: 0.5, ruffle: 0.02 };
// Rough petal colour of each of the ten sculpted flowers, for the petals they shed.
const TINTS = ['#f29ac4', '#f7b3c8', '#d9b6ee', '#f4eefc', '#f6a9b0', '#c85fc0', '#e88fc0', '#9db8f2', '#f4a890', '#f6b890'];
function petalGeometry(sp) {
  const g = new THREE.PlaneGeometry(1, 1, 12, 18);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const s = pos.getX(i) * 2, t = pos.getY(i) + 0.5;
    const width = sp.w * (Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 0.75) + 0.07 * (1 - t));
    const z = sp.cup * t * t + sp.curl * s * s * width * 0.5 - sp.tip * Math.pow(t, 5) + sp.ruffle * Math.sin(s * 9 + t * 5) * t * t;
    pos.setXYZ(i, s * width * 0.5, t, z);
  }
  g.computeVertexNormals();
  return g;
}

export function createScene(canvas, reduced) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 40);
  camera.position.set(0, 0.1, 8.5);
  camera.lookAt(0, -0.05, 0);

  const key = new THREE.DirectionalLight(0xfff1e8, 1.4); key.position.set(2.4, 3.4, 4.5); scene.add(key);
  const rim = new THREE.PointLight(0x5cc4ff, 40, 0, 2); rim.position.set(-3.4, 2.2, -2.4); scene.add(rim);
  const rose = new THREE.PointLight(0xff6aa6, 18, 0, 2); rose.position.set(3.4, -1.0, 2.6); scene.add(rose);

  const rig = new THREE.Group(); scene.add(rig);
  const tmp = new THREE.Vector3();
  const rnd = rng(20261117);

  /* her: the sculpted bust */
  const U = {
    uDQ: { value: new THREE.Matrix4() }, uDQi: { value: new THREE.Matrix4() }, uHeadRot: { value: new THREE.Matrix3() },
    uPivot: { value: NECK_PIVOT }, uEyeR: { value: EYE_R }, uEyeL: { value: EYE_L }, uGlow: { value: 0 }
  };
  let bust = null, morph = null, iR = -1, iL = -1, appear = 0;
  const holder = new THREE.Group();
  holder.scale.setScalar(MODEL_SCALE); holder.position.set(-0.0175 * MODEL_SCALE, -0.5 * MODEL_SCALE, 0);
  rig.add(holder);
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(new URL('./assets/xenia.glb', import.meta.url).href, gltf => {
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      bust = o; o.frustumCulled = false;
      U.uDQ.value.copy(o.matrixWorld); U.uDQi.value.copy(o.matrixWorld).invert();
      if (o.morphTargetDictionary) { iR = o.morphTargetDictionary.blinkR ?? -1; iL = o.morphTargetDictionary.blinkL ?? -1; morph = o.morphTargetInfluences; }
      const m = o.material;
      m.envMapIntensity = 1;
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>
uniform mat4 uDQ; uniform mat4 uDQi; uniform mat3 uHeadRot; uniform vec3 uPivot; varying vec3 vMPos;
float headW(vec3 pm) {
  float hy = smoothstep(0.25, 0.43, pm.y);
  float rr = length(pm.xz - uPivot.xz);
  return hy * (1.0 - smoothstep(0.17, 0.30, rr) * (1.0 - smoothstep(0.40, 0.54, pm.y)));
}`)
          .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
{ vec3 pmN = (uDQ * vec4(position, 1.0)).xyz; objectNormal = normalize(mix(objectNormal, uHeadRot * objectNormal, headW(pmN))); }`)
          .replace('#include <morphtarget_vertex>', `#include <morphtarget_vertex>
{ vec3 pm0 = (uDQ * vec4(position, 1.0)).xyz; vMPos = pm0; float hw = headW(pm0);
  vec3 q = (uDQ * vec4(transformed, 1.0)).xyz - uPivot; q = mix(q, uHeadRot * q, hw);
  transformed = (uDQi * vec4(q + uPivot, 1.0)).xyz; }`);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', `#include <common>
uniform vec3 uEyeR; uniform vec3 uEyeL; uniform float uGlow; varying vec3 vMPos;`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ float eg = (1.0 - smoothstep(0.018, 0.05, distance(vMPos, uEyeR))) + (1.0 - smoothstep(0.018, 0.05, distance(vMPos, uEyeL)));
  float blue = smoothstep(0.04, 0.3, diffuseColor.b - diffuseColor.r);
  totalEmissiveRadiance += diffuseColor.rgb * eg * blue * uGlow; }`);
      };
    });
    holder.add(gltf.scene);
  }, undefined, err => console.warn('Model failed to load', err));

  /* flowers: ten sculpted species (assets/flora.glb), planted around her and adrift behind */
  const flowers = [], yAxis = new THREE.Vector3(0, 1, 0);
  const spots = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 6.2832 + 0.2, front = (1 + Math.cos(a)) / 2;
    spots.push({ pos: new THREE.Vector3(Math.sin(a) * (1.75 + rnd() * 0.2), -1.72 + rnd() * 0.08, Math.cos(a) * 1.3 + 0.1),
      up: new THREE.Vector3(Math.sin(a) * 0.4, 1, Math.cos(a) * 0.4).normalize(), size: lerp(8.4, 4.6, front) * (0.85 + rnd() * 0.3), parent: rig });
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.2832 + 0.5, rad = 2.5 + rnd() * 0.5;
    spots.push({ pos: new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad * 0.7 + 0.2, -1.6 - rnd() * 1.4),
      up: new THREE.Vector3(Math.cos(a) * 0.5, 0.8, 0.6).normalize(), size: 4 + rnd() * 2, parent: scene, adrift: true });
  }
  loader.load(new URL('./assets/flora.glb', import.meta.url).href, gltf => {
    gltf.scene.updateMatrixWorld(true);
    const species = [], v = new THREE.Vector3();
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const dq = o.matrixWorld.clone(), pos = o.geometry.attributes.position;
      let H = 0; for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(dq); if (v.y > H) H = v.y; }
      let hx = 0, hz = 0, n = 0;
      for (let i = 0; i < pos.count; i += 2) { v.fromBufferAttribute(pos, i).applyMatrix4(dq); if (v.y > 0.55 * H) { hx += v.x; hz += v.z; n++; } }
      species.push({ geo: o.geometry, mat: o.material, dq, dqi: dq.clone().invert(), H, head: new THREE.Vector3(hx / Math.max(1, n), 0.5 * H, hz / Math.max(1, n)), idx: parseInt(o.name.replace(/\D/g, ''), 10) || 0 });
    });
    if (!species.length) return;
    const order = spots.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    spots.forEach((spot, i) => {
      const sp = species[(i * 3 + Math.floor(rnd() * 2)) % species.length];
      const u = { uDQ: { value: sp.dq }, uDQi: { value: sp.dqi }, uHead: { value: sp.head }, uHeadH: { value: sp.H }, uOpen: { value: 0 }, uLit: { value: 0 } };
      const mat = sp.mat.clone();
      mat.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>
uniform mat4 uDQ; uniform mat4 uDQi; uniform vec3 uHead; uniform float uHeadH; uniform float uOpen;`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>
{ vec3 pm = (uDQ * vec4(transformed, 1.0)).xyz;
  float hw = smoothstep(uHead.y - uHeadH * 0.12, uHead.y + uHeadH * 0.12, pm.y);
  vec2 d = pm.xz - uHead.xz; float r = length(d);
  float c = (1.0 - uOpen) * hw; float r2 = r * (1.0 - 0.74 * c);
  pm.xz = uHead.xz + d * (r2 / max(r, 0.00001)); pm.y += (r - r2) * 0.9;
  transformed = (uDQi * vec4(pm, 1.0)).xyz; }`);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform float uLit;')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uLit;');
      };
      mat.customProgramCacheKey = () => 'xenia-flora';
      const mesh = new THREE.Mesh(sp.geo, mat);
      mesh.matrixAutoUpdate = false; mesh.matrix.copy(sp.dq); mesh.frustumCulled = false;
      const spin = new THREE.Group(); spin.rotation.y = rnd() * 6.28; spin.add(mesh);
      const group = new THREE.Group(); group.position.copy(spot.pos); group.add(spin);
      spot.parent.add(group);
      flowers.push({ group, spin, u, up: spot.up, size: spot.size, adrift: !!spot.adrift, top: sp.H, tint: TINTS[sp.idx % TINTS.length], f: 0, thr: (order[i] / spots.length) * 0.86, o: 0, user: null, bounce: 0, ph: rnd() * 6.28, w: new THREE.Vector3(), ndc: new THREE.Vector3() });
    });
  }, undefined, err => console.warn('Flowers failed to load', err));

  /* loose petals */
  const loose = [];
  const looseGeo = petalGeometry(PETAL);
  for (let i = 0; i < 90; i++) {
    const m = new THREE.Mesh(looseGeo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.5, color: 0xffffff }));
    m.visible = false; scene.add(m);
    loose.push({ m, v: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0, size: 0.1 });
  }
  let looseAt = 0;
  function shed(f, count) {
    if (reduced) return;
    tmp.set(0, f.top * 0.8, 0); f.group.localToWorld(tmp); f.w.copy(tmp);
    const tint = new THREE.Color(f.tint);
    for (let k = 0; k < count; k++) {
      const p = loose[looseAt++ % loose.length];
      p.m.material.color.copy(tint); p.m.visible = true;
      p.m.position.copy(f.w).add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, 0.2));
      p.m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      p.v.set((Math.random() - 0.5) * 1.3, 0.5 + Math.random() * 0.9, (Math.random() - 0.3) * 1.0);
      p.spin.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
      p.life = 2.6 + Math.random() * 1.6; p.size = 0.09 + Math.random() * 0.07;
    }
  }

  /* drifting specks */
  const N = 240, sp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { sp[i * 3] = (rnd() - 0.5) * 9; sp[i * 3 + 1] = (rnd() - 0.5) * 8; sp[i * 3 + 2] = (rnd() - 0.5) * 6; }
  const speckGeo = new THREE.BufferGeometry(); speckGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(speckGeo, new THREE.PointsMaterial({ color: 0xf3eef7, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false })));

  let cw = 0, ch = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
    if (w === cw && h === ch) return;
    cw = w; ch = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  resize();

  /* behaviour */
  let gx = 0, gy = 0, time = 0, blinkT = 0, nextBlink = 3, winkT = 0, nod = 0, burst = false;
  const head = { p: 0.16, y: 0.12, r: 0.05 };
  const euler = new THREE.Euler(0, 0, 0, 'YXZ'), m4 = new THREE.Matrix4(), qLean = new THREE.Quaternion();

  // A quick press: flowers toggle open or shut and shed petals; her face answers with a wink.
  function tap(x, y, unlocked) {
    let best = null, bd = 0.14;
    for (const f of flowers) { const d = Math.hypot(f.ndc.x - x, f.ndc.y - y); if (d < bd) { bd = d; best = f; } }
    if (best) {
      best.user = best.o > 0.5 ? 0 : 1; best.bounce = 1;
      shed(best, best.user === 1 ? 6 : 3);
      return 'flower';
    }
    tmp.copy(FACE); holder.localToWorld(tmp); tmp.project(camera);
    if (unlocked && Math.hypot(tmp.x - x, tmp.y - y) < 0.3) { winkT = 0.45; nod = 1; return 'face'; }
    return null;
  }

  function render(S, P, dt, unlocked) {
    resize();
    time += dt;
    const locked = !unlocked, h = S.heat, awake = smooth(clamp(h * 1.15));
    const listen = S.listen || 0, drag = P.drag || 0;
    let tx = 0, ty = 0;
    if (P.active) { tx = P.x; ty = P.y; }
    else if (!reduced) { tx = Math.sin(time * 0.4) * 0.3; ty = Math.cos(time * 0.31) * 0.15; }
    gx += (tx - gx) * Math.min(1, dt * 4); gy += (ty - gy) * Math.min(1, dt * 4);
    nod *= Math.exp(-dt * 3);
    const idle = reduced ? 0 : 1;

    // head: bowed and turned aside while asleep, stirring while you type, following you when awake
    const stir = listen * (1 - awake);
    const tp = lerp(0.17 - 0.1 * stir, -gy * 0.11 + nod * 0.09, awake) + idle * Math.sin(time * 0.7) * 0.012;
    const tyaw = lerp(0.14 - 0.1 * stir, gx * 0.17, awake) - S.recoil * 0.3;
    const tr = lerp(0.05 + stir * 0.06 * Math.sin(time * 5), -gx * 0.05 + nod * 0.07, awake) + idle * Math.sin(time * 0.45) * 0.012;
    const k = reduced ? 1 : Math.min(1, dt * 5);
    head.p += (tp - head.p) * k; head.y += (tyaw - head.y) * k; head.r += (tr - head.r) * k;
    euler.set(head.p, head.y, head.r);
    U.uHeadRot.value.setFromMatrix4(m4.makeRotationFromEuler(euler));

    rig.rotation.y = gx * 0.14 * awake + drag - S.recoil * 0.18;
    rig.rotation.x = -gy * 0.04 * awake;
    rig.position.y = idle * Math.sin(time * 0.6) * 0.025;
    const breath = 1 + idle * Math.sin(time * 1.1) * 0.004;
    appear = Math.min(1, appear + (bust ? dt * 1.2 : 0));
    holder.scale.setScalar(MODEL_SCALE * breath * lerp(0.94, 1, smooth(appear)));
    holder.visible = !!bust;

    // eyes: closed asleep, fluttering as she stirs, blinking and winking awake
    if (!reduced && unlocked) {
      nextBlink -= dt;
      if (nextBlink < 0) { nextBlink = 2.6 + Math.random() * 4.5; blinkT = 0.2; }
    }
    blinkT = Math.max(0, blinkT - dt); winkT = Math.max(0, winkT - dt);
    const bl = Math.sin(clamp(blinkT / 0.2) * Math.PI);
    const flutter = stir * (0.12 + 0.1 * Math.sin(time * 9));
    const base = clamp(1 - awake - flutter + S.recoil * 0.4 * awake);
    if (morph) {
      if (iR >= 0) morph[iR] = clamp(Math.max(base, bl));
      if (iL >= 0) morph[iL] = clamp(Math.max(base, bl, Math.sin(clamp(winkT / 0.45) * Math.PI)));
    }
    U.uGlow.value = awake * (0.5 + 0.25 * S.open + (idle ? 0.08 * Math.sin(time * 2) : 0));

    // light: cool and dim asleep, warm awake
    renderer.toneMappingExposure = lerp(0.66, 1.18, awake) + 0.06 * stir;
    key.intensity = lerp(1.0, 2.0, awake); rose.intensity = lerp(8, 22, awake);

    // flowers
    if (S.open < 0.02) burst = false;
    const doBurst = !burst && S.open > 0.95; if (doBurst) burst = true;
    for (const f of flowers) {
      tmp.set(0, f.top * 0.75, 0); f.group.localToWorld(tmp); f.w.copy(tmp); f.ndc.copy(tmp).project(camera);
      let inf = 0, dxn = 0, dyn = 0;
      if (P.active) { dxn = P.x - f.ndc.x; dyn = P.y - f.ndc.y; inf = clamp(1 - Math.hypot(dxn, dyn) / 0.34); }
      f.f += (inf - f.f) * Math.min(1, dt * 7);
      const seq = smooth(clamp((S.open * 1.12 - f.thr) / 0.24));
      if (seq > 0.98 && f.user === 0 && P.down) f.user = null;
      const target = f.user === null ? seq : f.user;
      const prev = f.o;
      f.o += (target - f.o) * (reduced ? 1 : Math.min(1, dt * 3.5));
      if (prev < 0.9 && f.o >= 0.9 && f.user === null) shed(f, 2);
      if (doBurst) shed(f, 3);
      f.bounce *= Math.exp(-dt * 4);
      const shy = locked ? f.f : 0;
      f.u.uOpen.value = clamp(f.o - shy * 0.25);
      f.u.uLit.value = 0.22 * f.o * h;
      f.group.scale.setScalar(f.size * lerp(0.72, 1, f.o) * (1 - 0.22 * shy - 0.12 * S.recoil) * (1 + (locked ? 0 : 0.1 * f.f) + 0.22 * f.bounce * Math.sin(f.bounce * 9)));
      // sway, and lean toward the finger when she is awake, away from it while she sleeps
      const lean = f.f * (locked ? -0.55 : 0.45), dl = Math.hypot(dxn, dyn) || 1;
      tmp.copy(f.up);
      tmp.x += (dxn / dl) * lean + idle * Math.sin(time * 0.8 + f.ph) * 0.05;
      tmp.y += (dyn / dl) * lean * 0.5;
      tmp.z += idle * Math.cos(time * 0.63 + f.ph) * 0.05;
      qLean.setFromUnitVectors(yAxis, tmp.normalize());
      f.group.quaternion.slerp(qLean, reduced ? 1 : Math.min(1, dt * 6));
      if (f.adrift && idle) { f.spin.rotation.y += dt * 0.15; f.group.position.y += Math.sin(time * 0.5 + f.ph) * dt * 0.05; }
    }
    for (const p of loose) {
      if (p.life <= 0) { if (p.m.visible) p.m.visible = false; continue; }
      p.life -= dt;
      p.v.y -= 0.9 * dt; p.v.multiplyScalar(1 - 0.9 * dt); p.v.x += Math.sin(time * 3 + p.size * 90) * 0.5 * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.rotation.x += p.spin.x * dt; p.m.rotation.y += p.spin.y * dt; p.m.rotation.z += p.spin.z * dt;
      p.m.scale.setScalar(p.size * clamp(p.life / 0.8));
    }
    if (!reduced) {
      const a = speckGeo.attributes.position;
      for (let i = 0; i < N; i++) { let y = a.getY(i) - dt * (0.08 + (i % 7) * 0.012); if (y < -4) y = 4; a.setY(i, y); }
      a.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }
  return { render, resize, tap };
}
