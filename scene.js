// The 3D scene. Xenia herself is the original sculpted model (assets/xenia.glb), every triangle kept;
// phones get a lighter copy (assets/xenia-lite.glb). Her irises slide to follow the viewer.
// The flowers around her are ten sculpted species (assets/flora.glb), split apart in Blender;
// they close and open through a small vertex shader. Petals, dust and glows are made in code.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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

// The bust is about 1 unit tall in its own units.
const MODEL_SCALE = 3.3;
const FACE_TURN = 37 * Math.PI / 180;   // the original model looks to one side; this turns her to the viewer
const BG = 0x17121f;

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
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.95;
  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 40);
  camera.position.set(0, 0.1, 8.5);
  camera.lookAt(0, -0.05, 0);

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2.4, 3.4, 4.5); scene.add(key);
  const rim = new THREE.PointLight(0x9ad8ff, 16, 0, 2); rim.position.set(-3.4, 2.2, -2.4); scene.add(rim);
  const rose = new THREE.PointLight(0xffb0cf, 8, 0, 2); rose.position.set(3.4, -1.0, 2.6); scene.add(rose);

  const rig = new THREE.Group(); scene.add(rig);
  const tmp = new THREE.Vector3();
  const rnd = rng(20261117);

  /* her: the original sculpt. Only her irises move, sliding inside the eye openings. */
  const query = new URLSearchParams(location.search);
  const lite = query.has('lite') || (!query.has('full') && (window.matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 700));
  const E = {
    uDQ: { value: new THREE.Matrix4() }, uDQi: { value: new THREE.Matrix4() }, uGaze: { value: new THREE.Vector2() }, uGlow: { value: 0 },
    uEyeR: { value: new THREE.Vector3(-0.115, 0.575, 0.283) }, uEyeL: { value: new THREE.Vector3(0.1, 0.594, 0.28) }
  };
  let bust = null, appear = 0;
  const holder = new THREE.Group();
  holder.scale.setScalar(MODEL_SCALE); holder.position.set(-0.0175 * MODEL_SCALE, -0.5 * MODEL_SCALE, 0);
  rig.add(holder);
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(new URL(lite ? './assets/xenia-lite.glb' : './assets/xenia.glb', import.meta.url).href, gltf => {
    if (!lite) gltf.scene.rotation.y = FACE_TURN;   // the lighter copy was already turned in Blender
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      bust = o; o.frustumCulled = false;
      const aniso = renderer.capabilities.getMaxAnisotropy();
      for (const t of [o.material.map, o.material.normalMap, o.material.roughnessMap]) if (t) t.anisotropy = aniso;
      E.uDQ.value.copy(o.matrixWorld); E.uDQi.value.copy(o.matrixWorld).invert();
      o.material.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, E);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>
uniform mat4 uDQ; uniform mat4 uDQi; uniform vec2 uGaze; uniform vec3 uEyeR; uniform vec3 uEyeL; varying vec3 vMPos;
vec2 irisShift(vec3 pm, vec3 c, vec2 ax, vec2 up) {
  vec2 d = pm.xy - c.xy; float u = dot(d, ax) / 0.056, v = dot(d, up) / 0.027;
  float wz = 1.0 - smoothstep(0.03, 0.06, abs(pm.z - c.z));
  float wx = (1.0 - smoothstep(0.6, 1.0, abs(u))) * (1.0 - smoothstep(0.85, 1.2, abs(v)));
  float wy = 1.0 - smoothstep(0.45, 1.0, length(vec2(u, v)));
  return vec2(uGaze.x * wx, uGaze.y * wy) * wz;
}`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>
{ vec3 pm = (uDQ * vec4(transformed, 1.0)).xyz; vMPos = pm;
  pm.xy += irisShift(pm, uEyeR, vec2(0.943, -0.333), vec2(0.333, 0.943)) + irisShift(pm, uEyeL, vec2(0.952, 0.305), vec2(-0.305, 0.952));
  transformed = (uDQi * vec4(pm, 1.0)).xyz; }`);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', `#include <common>
uniform vec3 uEyeR; uniform vec3 uEyeL; uniform float uGlow; varying vec3 vMPos;`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ float eg = (1.0 - smoothstep(0.02, 0.055, distance(vMPos, uEyeR))) + (1.0 - smoothstep(0.02, 0.055, distance(vMPos, uEyeL)));
  float blue = smoothstep(0.04, 0.3, diffuseColor.b - diffuseColor.r);
  totalEmissiveRadiance += diffuseColor.rgb * eg * blue * uGlow; }`);
      };
    });
    holder.add(gltf.scene);
  }, undefined, err => console.warn('Model failed to load', err));

  /* soft glow texture, shared by the aura and the flower lights */
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(0.6, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const glowMat = color => new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
  const aura = new THREE.Sprite(glowMat(0x8fb8ff)); aura.position.set(0, 0.35, -1.6); aura.scale.setScalar(9); scene.add(aura);
  const aura2 = new THREE.Sprite(glowMat(0xff8fc0)); aura2.position.set(0.6, -0.6, -2.0); aura2.scale.setScalar(7); scene.add(aura2);

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
      const glow = new THREE.Sprite(glowMat(TINTS[sp.idx % TINTS.length])); glow.position.set(sp.head.x, sp.H * 0.85, sp.head.z); glow.scale.setScalar(sp.H * 1.5); spin.add(glow);
      const group = new THREE.Group(); group.position.copy(spot.pos); group.add(spin);
      spot.parent.add(group);
      flowers.push({ group, spin, u, glow, up: spot.up, size: spot.size, adrift: !!spot.adrift, top: sp.H, tint: TINTS[sp.idx % TINTS.length], f: 0, thr: (order[i] / spots.length) * 0.86, o: 0, user: null, bounce: 0, ph: rnd() * 6.28, w: new THREE.Vector3(), ndc: new THREE.Vector3() });
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

  /* iridescent dust: soft motes that drift, twinkle and shift colour */
  const N = lite ? 700 : 1500;
  const dPos = new Float32Array(N * 3), dSeed = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    dPos[i * 3] = (rnd() - 0.5) * 13; dPos[i * 3 + 1] = (rnd() - 0.5) * 10; dPos[i * 3 + 2] = -5 + rnd() * 8.5;
    dSeed[i * 3] = rnd(); dSeed[i * 3 + 1] = rnd() < 0.08 ? 3 + rnd() * 4 : 0.5 + rnd() * 1.3; dSeed[i * 3 + 2] = rnd();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3)); dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 3));
  const dustU = { uTime: { value: 0 }, uPx: { value: 1 }, uGain: { value: 1 }, uPointer: { value: new THREE.Vector2() } };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: dustU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec3 aSeed; uniform float uTime; uniform float uPx; uniform vec2 uPointer; varying float vHue; varying float vA;
void main() {
  vec3 p = position;
  p.y = mod(p.y + uTime * (0.05 + aSeed.x * 0.12) + 5.0, 10.0) - 5.0;
  p.x += sin(uTime * 0.25 + aSeed.x * 6.283 + p.y * 0.6) * 0.35 + uPointer.x * (0.25 + 0.06 * p.z);
  p.z += cos(uTime * 0.2 + aSeed.z * 6.283) * 0.3;
  p.y += uPointer.y * (0.15 + 0.04 * p.z);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSeed.y * uPx * 36.0 / -mv.z;
  vHue = fract(aSeed.z + uTime * 0.06 + p.x * 0.07 + p.y * 0.05);
  float tw = 0.45 + 0.55 * sin(uTime * (0.8 + aSeed.x * 2.2) + aSeed.z * 40.0);
  vA = tw * (aSeed.y > 2.5 ? 0.16 : 0.85);
}`,
    fragmentShader: `uniform float uGain; varying float vHue; varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d); a *= a;
  vec3 c = 0.5 + 0.5 * cos(6.28318 * (vHue + vec3(0.0, 0.33, 0.67)));
  c = mix(c, vec3(1.0), 0.3);
  gl_FragColor = vec4(c * a * vA * uGain, 1.0);
}`
  }));
  dust.frustumCulled = false; scene.add(dust);

  /* bloom, so eyes, dust and flower lights glow */
  let composer = null, bloom = null;
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.2, 0.7, 0.93);
    composer.addPass(bloom); composer.addPass(new OutputPass());
  } catch (_) { composer = null; }

  let cw = 0, ch = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
    if (w === cw && h === ch) return;
    cw = w; ch = h;
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
    dustU.uPx.value = h * renderer.getPixelRatio() / 600;
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  resize();

  /* behaviour */
  let gx = 0, gy = 0, time = 0, burst = false;
  const qLean = new THREE.Quaternion();

  // A quick press on a flower opens or closes it and shakes petals loose.
  function tap(x, y) {
    let best = null, bd = 0.16;
    for (const f of flowers) { const d = Math.hypot(f.ndc.x - x, f.ndc.y - y); if (d < bd) { bd = d; best = f; } }
    if (!best) return null;
    best.user = best.o > 0.5 ? 0 : 1; best.bounce = 1;
    shed(best, best.user === 1 ? 6 : 3);
    return 'flower';
  }

  function render(S, P, dt, unlocked) {
    resize();
    time += dt;
    const locked = !unlocked, h = S.heat, drag = P.drag || 0, idle = reduced ? 0 : 1;
    let tx = 0, ty = 0;
    if (P.active) { tx = P.x; ty = P.y; }
    else if (idle) { tx = Math.sin(time * 0.4) * 0.3; ty = Math.cos(time * 0.31) * 0.15; }
    gx += (tx - gx) * Math.min(1, dt * 4); gy += (ty - gy) * Math.min(1, dt * 4);

    // she is never reshaped: the whole bust turns gently toward you, or with your drag
    rig.rotation.y = gx * 0.2 + drag - S.recoil * 0.12;
    rig.rotation.x = -gy * 0.06;
    rig.position.y = idle * Math.sin(time * 0.6) * 0.03;
    appear = Math.min(1, appear + (bust ? dt * 1.2 : 0));
    holder.scale.setScalar(MODEL_SCALE * lerp(0.94, 1, smooth(appear)));
    holder.visible = !!bust;

    // her gaze: the irises slide toward you; glow breathes
    E.uGaze.value.set(gx * 0.013, gy * 0.005);
    E.uGlow.value = 0.28 + idle * 0.1 * Math.sin(time * 1.7) + 0.3 * S.open * h;
    dustU.uTime.value = idle ? time : 0; dustU.uPointer.value.set(gx, gy); dustU.uGain.value = 1.0 + 0.5 * h;
    aura.material.opacity = 0.16 + 0.1 * h + idle * 0.03 * Math.sin(time * 0.9);
    aura2.material.opacity = 0.08 + 0.12 * S.open * h + idle * 0.02 * Math.sin(time * 0.7 + 2.0);
    if (bloom) bloom.strength = 0.18 + 0.1 * S.open * h;

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
      f.glow.material.opacity = 0.5 * f.o * (0.35 + 0.65 * h) * (0.85 + idle * 0.15 * Math.sin(time * 1.3 + f.ph));
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
    if (composer) composer.render(); else renderer.render(scene, camera);
  }
  return { render, resize, tap };
}
