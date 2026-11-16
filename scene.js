// The 3D scene: a porcelain face in a crown of iridescent flowers.
// Everything is generated in code: geometry, textures and materials. No image files.
import * as THREE from 'three';
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
const G = (u, v, cu, cv, su, sv) => Math.exp(-(((u - cu) ** 2) / (2 * su * su) + ((v - cv) ** 2) / (2 * sv * sv)));

/* ---------- head shape ---------- */
// Maps a unit direction to a point on the head. Front of the face is +z.
function shapePoint(n, out) {
  let d = 0;
  if (n.z > 0) {
    const f = smooth(clamp(n.z / 0.4));
    const u = n.x, w = n.y;
    d -= 0.12 * (G(u, w, 0.37, 0.0, 0.17, 0.11) + G(u, w, -0.37, 0.0, 0.17, 0.11));
    d += 0.085 * G(u, w, 0, -0.17, 0.055, 0.17);
    d += 0.06 * G(u, w, 0, -0.33, 0.085, 0.05);
    d -= 0.02 * (G(u, w, 0.1, -0.37, 0.03, 0.02) + G(u, w, -0.1, -0.37, 0.03, 0.02));
    d += 0.05 * G(u, w, 0, -0.52, 0.15, 0.03);
    d += 0.055 * G(u, w, 0, -0.61, 0.13, 0.035);
    d -= 0.03 * G(u, w, 0, -0.565, 0.17, 0.009);
    d += 0.045 * (G(u, w, 0.52, -0.2, 0.15, 0.12) + G(u, w, -0.52, -0.2, 0.15, 0.12));
    d += 0.04 * G(u, w, 0, 0.2, 0.55, 0.07);
    d += 0.035 * G(u, w, 0, -0.84, 0.14, 0.09);
    d *= f;
  }
  out.copy(n).multiplyScalar(1 + d);
  const y = out.y;
  if (y > 0) { out.x *= 1 + 0.1 * y; out.z *= 1 + 0.1 * y; }
  else { const k = Math.pow(-y, 1.35); out.x *= 1 - 0.4 * k; out.z *= 1 - 0.2 * k; }
  if (out.z < 0) out.z *= 1.18;
  out.x *= 0.86; out.y *= 1.2; out.z *= 0.92;
  return out;
}

/* ---------- painted textures ---------- */
function paintHead() {
  const W = 2048, H = 1024;
  const col = document.createElement('canvas'); col.width = W; col.height = H;
  const bmp = document.createElement('canvas'); bmp.width = W; bmp.height = H;
  const c = col.getContext('2d'), b = bmp.getContext('2d');
  const X = lon => (0.25 + lon / 360) * W, Y = lat => (0.5 - lat / 180) * H;
  c.fillStyle = '#e3e7f6'; c.fillRect(0, 0, W, H);
  b.fillStyle = '#808080'; b.fillRect(0, 0, W, H);
  // crown blush, all the way round
  let g = c.createLinearGradient(0, 0, 0, Y(8));
  g.addColorStop(0, 'rgba(240,70,130,0.95)'); g.addColorStop(0.55, 'rgba(250,120,165,0.6)'); g.addColorStop(1, 'rgba(250,150,185,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, Y(8));
  const blob = (lon, lat, rx, ry, color) => {
    const x = X(lon), y = Y(lat), R = Math.max(rx, ry) / 360 * W;
    c.save(); c.translate(x, y); c.scale(rx / Math.max(rx, ry), (ry / Math.max(rx, ry)) * 2);
    const gg = c.createRadialGradient(0, 0, 0, 0, 0, R);
    gg.addColorStop(0, color); gg.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
    c.fillStyle = gg; c.beginPath(); c.arc(0, 0, R, 0, 6.2832); c.fill(); c.restore();
  };
  for (const s of [-1, 1]) {
    blob(s * 22, 0, 19, 9, 'rgba(120,90,190,0.75)');
    blob(s * 34, -17, 15, 8, 'rgba(255,120,165,0.5)');
  }
  blob(0, -33.5, 9, 3.2, 'rgba(120,110,200,0.95)');
  blob(0, -30.5, 6, 1.6, 'rgba(95,90,180,0.8)');
  // carved filigree: painted pink and white, raised in the bump map
  const line = (pts, width, color, raise) => {
    for (const [ctx, style, w] of [[c, color, width], [b, raise, width * 1.5]]) {
      ctx.beginPath(); ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      ctx.bezierCurveTo(X(pts[1][0]), Y(pts[1][1]), X(pts[2][0]), Y(pts[2][1]), X(pts[3][0]), Y(pts[3][1]));
      ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.strokeStyle = style; ctx.stroke();
    }
  };
  const r = rng(77);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      line([[s * (3 + k * 6), 15 + k], [s * (4 + k * 7), 34], [s * (30 + k * 6), 38 + k * 3], [s * (22 + k * 9), 62 + k * 3]],
        9 - k, k % 2 ? 'rgba(255,255,255,0.95)' : 'rgba(225,60,125,0.9)', '#ffffff');
    }
    line([[s * 44, 4], [s * 60, 12], [s * 66, 30], [s * 52, 40]], 6, 'rgba(255,255,255,0.9)', '#ffffff');
    line([[s * 50, -6], [s * 68, -2], [s * 78, 18], [s * 66, 26]], 5, 'rgba(225,60,125,0.8)', '#f0f0f0');
  }
  for (let i = 0; i < 46; i++) {
    const lon = 70 + r() * 220, lat = 5 + r() * 62, dl = (r() - 0.5) * 50, dh = 8 + r() * 20;
    line([[lon, lat], [lon + dl * 0.2, lat + dh * 0.7], [lon + dl, lat + dh * 0.9], [lon + dl * 0.8, lat + dh * 0.3]],
      3 + r() * 5, r() < 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(225,60,125,0.85)', '#ffffff');
  }
  // teardrop on the forehead
  for (const [ctx, fill] of [[c, '#49b6ff'], [b, '#ffffff']]) {
    ctx.beginPath(); ctx.moveTo(X(0), Y(44));
    ctx.quadraticCurveTo(X(4.5), Y(33), X(0), Y(27)); ctx.quadraticCurveTo(X(-4.5), Y(33), X(0), Y(44));
    ctx.fillStyle = fill; ctx.fill();
  }
  c.lineWidth = 3; c.strokeStyle = '#ffffff'; c.stroke();
  // pearls across cheeks, nose and crown
  const dot = (lon, lat, rad, color) => {
    c.beginPath(); c.arc(X(lon), Y(lat), rad, 0, 6.2832); c.fillStyle = color; c.fill();
    b.beginPath(); b.arc(X(lon), Y(lat), rad * 1.2, 0, 6.2832); b.fillStyle = '#ffffff'; b.fill();
  };
  for (let i = 0; i < 150; i++) {
    const s = r() < 0.5 ? -1 : 1;
    dot(s * (5 + r() * 44), -40 + r() * 34, 1.5 + r() * 4, r() < 0.3 ? 'rgba(170,70,110,0.85)' : 'rgba(255,255,255,0.95)');
  }
  for (let i = 0; i < 160; i++) dot(-90 + r() * 360, 12 + r() * 60, 2 + r() * 5, r() < 0.25 ? 'rgba(92,196,255,0.9)' : 'rgba(255,255,255,0.95)');
  const map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const bump = new THREE.CanvasTexture(bmp);
  return { map, bump };
}
function paintEye() {
  const W = 512, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#eef1fb'; x.fillRect(0, 0, W, H);
  const yr = a => (a / Math.PI) * H; // angle from the pole to canvas row
  const iris = 0.74, pupil = 0.27;
  const g = x.createLinearGradient(0, yr(pupil), 0, yr(iris));
  g.addColorStop(0, '#c8f6ff'); g.addColorStop(0.3, '#4fb7ff'); g.addColorStop(0.75, '#1d62d8'); g.addColorStop(1, '#0a1a66');
  x.fillStyle = g; x.fillRect(0, 0, W, yr(iris));
  const r = rng(5);
  for (let i = 0; i < 260; i++) {
    const px = r() * W;
    x.beginPath(); x.moveTo(px, yr(pupil)); x.lineTo(px + (r() - 0.5) * 8, yr(pupil + (iris - pupil) * (0.4 + r() * 0.55)));
    x.lineWidth = 0.6 + r() * 2; x.strokeStyle = r() < 0.5 ? 'rgba(220,250,255,0.5)' : 'rgba(8,24,110,0.42)'; x.stroke();
  }
  x.fillStyle = '#050818'; x.fillRect(0, 0, W, yr(pupil));
  x.fillStyle = 'rgba(8,16,70,0.9)'; x.fillRect(0, yr(iris) - 4, W, 7);
  const sg = x.createLinearGradient(0, yr(iris), 0, H);
  sg.addColorStop(0, 'rgba(150,160,220,0.45)'); sg.addColorStop(0.2, 'rgba(238,241,251,0)');
  x.fillStyle = sg; x.fillRect(0, yr(iris) + 3, W, H);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- flowers ---------- */
const PALETTES = {
  pink: ['#8c1050', '#ff4f9a', '#ffd9ea'], coral: ['#b0321a', '#ff8a4a', '#ffe9c8'],
  violet: ['#2d1a8c', '#7b58f0', '#b9f2ee'], pearl: ['#8a94cc', '#e8eaff', '#ffffff'],
  magenta: ['#5a0f80', '#de3fd0', '#ffc4f4'], azure: ['#103c96', '#2faaff', '#d4f3ff']
};
const SPECIES = [
  { pal: 'pink', core: '#ffd85a', w: 0.42, cup: 0.25, curl: 0.5, tip: 0.35, rings: [{ n: 6, len: 1, shut: 1.38, open: 0.35 }] },
  { pal: 'coral', core: '#3fd0c0', w: 0.36, cup: 0.2, curl: 0.7, tip: 0.2, rings: [{ n: 9, len: 1, shut: 1.4, open: 0.3 }, { n: 6, len: 0.66, shut: 1.42, open: 0.8, off: 0.3 }] },
  { pal: 'violet', core: '#ffe680', w: 0.62, cup: 0.45, curl: 0.9, tip: 0.5, rings: [{ n: 5, len: 0.95, shut: 1.36, open: 0.5 }] },
  { pal: 'pearl', core: '#ffc23d', w: 0.2, cup: 0.12, curl: 0.4, tip: 0.3, rings: [{ n: 16, len: 1, shut: 1.42, open: 0.22 }, { n: 10, len: 0.7, shut: 1.44, open: 0.6, off: 0.2 }] },
  { pal: 'magenta', core: '#fff0c0', w: 0.7, cup: 0.5, curl: 0.8, tip: 0.7, rings: [{ n: 3, len: 1, shut: 1.34, open: 0.35 }, { n: 3, len: 0.74, shut: 1.4, open: 0.75, off: 1.047 }] },
  { pal: 'azure', core: '#ffffff', w: 0.34, cup: 0.3, curl: 0.6, tip: 0.6, rings: [{ n: 8, len: 1, shut: 1.4, open: 0.32 }, { n: 5, len: 0.6, shut: 1.42, open: 0.85, off: 0.2 }] }
];
function petalGeometry(sp, palette) {
  const g = new THREE.PlaneGeometry(1, 1, 10, 18);
  const pos = g.attributes.position, colors = new Float32Array(pos.count * 3);
  const c0 = new THREE.Color(palette[0]), c1 = new THREE.Color(palette[1]), c2 = new THREE.Color(palette[2]), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const s = pos.getX(i) * 2, t = pos.getY(i) + 0.5;
    const width = sp.w * (Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.8) + 0.07 * (1 - t));
    const x = s * width * 0.5;
    const z = sp.cup * t * t + sp.curl * s * s * width * 0.5 - sp.tip * Math.pow(t, 5) + 0.02 * Math.sin(t * 9 + s * 3) * t;
    pos.setXYZ(i, x, t, z);
    if (t < 0.5) c.copy(c0).lerp(c1, t * 2); else c.copy(c1).lerp(c2, (t - 0.5) * 2);
    c.multiplyScalar(1 - 0.22 * s * s);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export function createScene(canvas, reduced) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x17121f);
  scene.fog = new THREE.Fog(0x17121f, 8.5, 15);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 40);
  camera.position.set(0, -0.05, 8.6);
  camera.lookAt(0, -0.12, 0);

  const key = new THREE.DirectionalLight(0xfff1e8, 1.7); key.position.set(2.2, 3.2, 4.5); scene.add(key);
  const rim = new THREE.PointLight(0x5cc4ff, 46, 0, 2); rim.position.set(-3.2, 1.8, -2.2); scene.add(rim);
  const rose = new THREE.PointLight(0xff6aa6, 26, 0, 2); rose.position.set(3.4, -1.2, 2.4); scene.add(rose);
  const wake = new THREE.PointLight(0x7fd4ff, 0, 0, 2); wake.position.set(0, 0.1, 2.6); scene.add(wake);

  const rig = new THREE.Group(); scene.add(rig);
  const rnd = rng(20261117);

  /* head */
  const headGeo = new THREE.SphereGeometry(1, 160, 160);
  { const p = headGeo.attributes.position, n = new THREE.Vector3(), o = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { n.fromBufferAttribute(p, i).normalize(); shapePoint(n, o); p.setXYZ(i, o.x, o.y, o.z); }
    headGeo.computeVertexNormals(); }
  const tex = paintHead();
  const porcelain = new THREE.MeshPhysicalMaterial({
    map: tex.map, bumpMap: tex.bump, bumpScale: 2.2, roughness: 0.34, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.18, sheen: 0.35, sheenColor: new THREE.Color(0xffb0cf), sheenRoughness: 0.5,
    iridescence: 0.35, iridescenceIOR: 1.4
  });
  const head = new THREE.Mesh(headGeo, porcelain); rig.add(head);

  /* neck */
  const prof = [];
  for (let i = 0; i <= 44; i++) prof.push(new THREE.Vector2(0.27 + 0.005 * i + 0.014 * Math.sin(i * 1.7), -0.95 - i * 0.032));
  const neckMat = new THREE.MeshPhysicalMaterial({ color: 0xaab2d8, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.3 });
  const neck = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), neckMat); neck.position.z = -0.08; rig.add(neck);

  /* eyes */
  const eyeTex = paintEye();
  const eyeMat = new THREE.MeshPhysicalMaterial({ map: eyeTex, emissiveMap: eyeTex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 });
  const lidMat = new THREE.MeshPhysicalMaterial({ color: 0xc9c4ea, roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.2, sheen: 0.5, sheenColor: new THREE.Color(0xb090e0), side: THREE.DoubleSide });
  const eyeGeo = new THREE.SphereGeometry(0.215, 48, 48); eyeGeo.rotateX(Math.PI / 2);
  const upGeo = new THREE.SphereGeometry(0.232, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const loGeo = new THREE.SphereGeometry(0.228, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const lashGeo = new THREE.TorusGeometry(0.234, 0.009, 8, 48, Math.PI); lashGeo.rotateX(Math.PI / 2);
  const lashMat = new THREE.MeshStandardMaterial({ color: 0x2a1c4a, roughness: 0.5 });
  const eyes = [];
  for (const s of [-1, 1]) {
    const socket = new THREE.Group();
    socket.position.set(s * 0.325, 0.0, 0.615); socket.rotation.z = s * 0.2; socket.rotation.y = s * 0.16;
    socket.scale.set(1.22, 1, 1);
    const ball = new THREE.Mesh(eyeGeo, eyeMat); socket.add(ball);
    const up = new THREE.Mesh(upGeo, lidMat); socket.add(up);
    up.add(new THREE.Mesh(lashGeo, lashMat));
    const lo = new THREE.Mesh(loGeo, lidMat); socket.add(lo);
    rig.add(socket); eyes.push({ ball, up, lo });
  }

  /* flowers */
  const petalGeos = {}, petalMats = {};
  const geoFor = (si, pal) => petalGeos[si + pal] || (petalGeos[si + pal] = petalGeometry(SPECIES[si], PALETTES[pal]));
  const matFor = pal => petalMats[pal] || (petalMats[pal] = new THREE.MeshPhysicalMaterial({
    vertexColors: true, side: THREE.DoubleSide, roughness: 0.3, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.2,
    iridescence: 0.55, iridescenceIOR: 1.45, iridescenceThicknessRange: [180, 520], sheen: 0.3, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.35
  }));
  const coreGeo = new THREE.SphereGeometry(0.13, 20, 20), beadGeo = new THREE.SphereGeometry(0.035, 10, 10);
  const palNames = Object.keys(PALETTES), flowers = [], zAxis = new THREE.Vector3(0, 0, 1);
  function addFlower(position, normal, size, parent) {
    const si = Math.floor(rnd() * SPECIES.length), sp = SPECIES[si];
    const pal = rnd() < 0.3 ? palNames[Math.floor(rnd() * palNames.length)] : sp.pal;
    const group = new THREE.Group();
    group.position.copy(position);
    group.quaternion.setFromUnitVectors(zAxis, normal.clone().normalize());
    group.rotateZ(rnd() * 6.28);
    const petals = [], beads = [];
    for (const ring of sp.rings) {
      for (let k = 0; k < ring.n; k++) {
        const pivot = new THREE.Group(); pivot.rotation.z = (k / ring.n) * 6.2832 + (ring.off || 0);
        const m = new THREE.Mesh(geoFor(si, pal), matFor(pal));
        m.scale.setScalar(ring.len); pivot.add(m); group.add(pivot);
        petals.push({ m, ring, jit: (rnd() - 0.5) * 0.14 });
      }
    }
    const coreMat = new THREE.MeshStandardMaterial({ color: sp.core, emissive: sp.core, emissiveIntensity: 0.15, roughness: 0.35 });
    const core = new THREE.Mesh(coreGeo, coreMat); core.position.z = 0.06; group.add(core);
    for (let k = 0; k < 7; k++) { const a = (k / 7) * 6.2832, bead = new THREE.Mesh(beadGeo, coreMat); bead.position.set(Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.12); group.add(bead); beads.push(bead); }
    parent.add(group);
    flowers.push({ group, petals, beads, coreMat, size, f: 0, thr: 0, ph: rnd() * 6.28, w: new THREE.Vector3() });
  }
  { // crown: spread over the skull, leaving the face clear
    const n = new THREE.Vector3(), p = new THREE.Vector3(), picked = [];
    for (let i = 0; i < 400 && picked.length < 30; i++) {
      n.set(rnd() * 2 - 1, rnd() * 1.25 - 0.25, rnd() * 2 - 1).normalize();
      const inFace = n.z > 0.3 && n.y < 0.6 && Math.abs(n.x) < 0.74;
      if (inFace || n.y < -0.2 || n.z < -0.55) continue;
      if (picked.some(q => q.distanceTo(n) < 0.36)) continue;
      picked.push(n.clone());
      shapePoint(n, p);
      addFlower(p.clone().addScaledVector(n, 0.05), n, 0.3 + rnd() * 0.2, rig);
    }
    for (let i = 0; i < 9; i++) { // collar
      const a = lerp(-1.25, 1.25, i / 8) + Math.PI / 2;
      const dir = new THREE.Vector3(Math.cos(a), 0.35, Math.sin(a)).normalize();
      addFlower(new THREE.Vector3(Math.cos(a) * 0.62, -1.62 + Math.sin(i * 1.9) * 0.07, Math.sin(a) * 0.5 - 0.05), dir, 0.34 + rnd() * 0.16, rig);
    }
    for (let i = 0; i < 9; i++) { // drifting further out
      const a = rnd() * 6.28, rad = 1.75 + rnd() * 0.5;
      const pos = new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad * 1.05 - 0.1, -0.6 - rnd() * 1.2);
      addFlower(pos, new THREE.Vector3(pos.x * 0.3, pos.y * 0.3, 1), 0.2 + rnd() * 0.14, scene);
    }
    const idx = flowers.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    idx.forEach((fi, k) => { flowers[fi].thr = (k / idx.length) * 0.86; });
  }

  /* drifting specks */
  const N = 260, sp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { sp[i * 3] = (rnd() - 0.5) * 9; sp[i * 3 + 1] = (rnd() - 0.5) * 8; sp[i * 3 + 2] = (rnd() - 0.5) * 6; }
  const speckGeo = new THREE.BufferGeometry(); speckGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const specks = new THREE.Points(speckGeo, new THREE.PointsMaterial({ color: 0xf3eef7, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(specks);

  /* post */
  let composer = null, bloom = null;
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.16, 0.6, 0.92);
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
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  resize();

  let gx = 0, gy = 0, blink = 0, blinkT = 0, nextBlink = 3, time = 0;
  function render(S, P, dt, unlocked) {
    resize();
    time += dt;
    const locked = !unlocked, h = S.heat;
    let tx = 0, ty = 0;
    if (P.active) { tx = P.x; ty = P.y; }
    else if (!reduced) { tx = Math.sin(time * 0.4) * 0.25; ty = Math.cos(time * 0.31) * 0.12; }
    gx += (tx - gx) * Math.min(1, dt * 5); gy += (ty - gy) * Math.min(1, dt * 5);
    const awake = smooth(clamp(h * 1.2));
    rig.rotation.y = gx * 0.24 * (0.35 + 0.65 * awake) + S.recoil * 0.35;
    rig.rotation.x = -gy * 0.1 * awake + lerp(0.16, 0, awake) + (reduced ? 0 : Math.sin(time * 0.8) * 0.012);
    rig.position.y = reduced ? 0 : Math.sin(time * 0.6) * 0.02;

    if (!reduced && unlocked) {
      nextBlink -= dt;
      if (nextBlink < 0) { nextBlink = 2.8 + Math.random() * 4; blinkT = 0.17; }
      if (blinkT > 0) { blinkT -= dt; blink = Math.sin(clamp(blinkT / 0.17) * Math.PI); } else blink = 0;
    } else blink = 0;
    const e = clamp(awake * (1 - blink) - S.recoil * 0.5);
    for (const eye of eyes) {
      eye.up.rotation.x = lerp(0.34, -0.78, e);
      eye.lo.rotation.x = lerp(0.2, 0.66, e);
      eye.ball.rotation.y = gx * 0.42; eye.ball.rotation.x = -gy * 0.3;
    }
    eyeMat.emissiveIntensity = 0.28 * awake;
    wake.intensity = 2.2 * awake;
    if (bloom) bloom.strength = 0.16 + 0.1 * S.open;

    for (const f of flowers) {
      let inf = 0;
      if (P.active) { f.group.getWorldPosition(f.w).project(camera); inf = clamp(1 - Math.hypot(f.w.x - P.x, f.w.y - P.y) / 0.3); }
      f.f += (inf - f.f) * Math.min(1, dt * 8);
      const o = smooth(clamp((S.open * 1.12 - f.thr) / 0.24));
      const shy = locked ? f.f : 0;
      const sc = f.size * lerp(0.62, 1, o) * (1 - 0.3 * shy - 0.18 * S.recoil) * (locked ? 1 : 1 + 0.12 * f.f);
      f.group.scale.setScalar(sc);
      const breathe = reduced ? 0 : Math.sin(time * 0.9 + f.ph) * 0.03;
      for (const p of f.petals) p.m.rotation.x = lerp(p.ring.shut, p.ring.open + p.jit, o) + breathe * o + shy * 0.1;
      f.coreMat.emissiveIntensity = lerp(0.1, 0.9, o * h);
      for (const bd of f.beads) bd.scale.setScalar(0.05 + 0.95 * o);
    }
    if (!reduced) {
      const a = speckGeo.attributes.position;
      for (let i = 0; i < N; i++) { let y = a.getY(i) - dt * (0.08 + (i % 7) * 0.012); if (y < -4) y = 4; a.setY(i, y); }
      a.needsUpdate = true;
    }
    if (composer) composer.render(); else renderer.render(scene, camera);
  }
  return { render, resize };
}
