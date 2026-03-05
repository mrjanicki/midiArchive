import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const canvas = document.getElementById("game");
const speedLabel = document.getElementById("speed");

function createNoiseTexture(size, palette, pixel = 4) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");

  for (let y = 0; y < size; y += pixel) {
    for (let x = 0; x < size; x += pixel) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      ctx.fillStyle = color;
      ctx.fillRect(x, y, pixel, pixel);
    }
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipMapNearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createWindowTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#8a8e95";
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 4; y < 128; y += 14) {
    for (let x = 4; x < 128; x += 14) {
      ctx.fillStyle = Math.random() > 0.45 ? "#203a58" : "#474f5a";
      ctx.fillRect(x, y, 10, 10);
      ctx.fillStyle = "rgba(245, 205, 120, 0.2)";
      if (Math.random() > 0.7) ctx.fillRect(x + 1, y + 1, 8, 8);
    }
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipMapNearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const asphaltTex = createNoiseTexture(128, ["#26282b", "#2d3035", "#1c1d21", "#373c44"], 2);
asphaltTex.repeat.set(40, 40);

const grassTex = createNoiseTexture(128, ["#4b5f4d", "#5a6d58", "#445747", "#68806a"], 4);
grassTex.repeat.set(20, 20);

const rustTex = createNoiseTexture(128, ["#7e2f1a", "#8f3c1f", "#5c2818", "#a85b2a", "#3f1e15"], 4);
rustTex.repeat.set(2, 2);

const facadeTex = createWindowTexture();
facadeTex.repeat.set(1, 2);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa1abc0, 38, 210);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.max(1, Math.min(window.devicePixelRatio * 0.6, 1.3)));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 500);

const hemi = new THREE.HemisphereLight(0xc7d2f2, 0x5f5140, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe9be, 1.1);
sun.position.set(18, 30, -12);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(460, 460),
  new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const asphalt = new THREE.Mesh(
  new THREE.PlaneGeometry(320, 320),
  new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.95, metalness: 0.05 })
);
asphalt.rotation.x = -Math.PI / 2;
asphalt.position.y = 0.04;
asphalt.receiveShadow = true;
scene.add(asphalt);

function addRoadLine(z, horizontal = true) {
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(horizontal ? 260 : 2, horizontal ? 2 : 260),
    new THREE.MeshBasicMaterial({ color: 0xd8ca88 })
  );
  line.rotation.x = -Math.PI / 2;
  line.position.set(horizontal ? 0 : z, 0.06, horizontal ? z : 0);
  scene.add(line);
}

for (let i = -120; i <= 120; i += 40) {
  addRoadLine(i, true);
  addRoadLine(i, false);
}

const rand = (min, max) => Math.random() * (max - min) + min;

for (let i = 0; i < 180; i += 1) {
  const width = rand(10, 24);
  const depth = rand(10, 24);
  const height = rand(18, 58);
  const x = rand(-165, 165);
  const z = rand(-165, 165);

  if (Math.abs(x) < 36 && Math.abs(z) < 36) continue;

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      map: facadeTex,
      color: new THREE.Color().setHSL(rand(0.05, 0.12), rand(0.06, 0.2), rand(0.45, 0.62)),
      roughness: 0.96,
      metalness: 0.03,
      flatShading: true
    })
  );

  building.position.set(x, height / 2, z);
  building.castShadow = true;
  building.receiveShadow = true;
  scene.add(building);
}

function makeCar() {
  const car = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ map: rustTex, color: 0xb94d31, roughness: 0.82, metalness: 0.3, flatShading: true });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x1e2228, roughness: 0.75, metalness: 0.25, flatShading: true });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x6f96ba, roughness: 0.25, metalness: 0.5, transparent: true, opacity: 0.82, flatShading: true });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff3bf });
  const rearLightMat = new THREE.MeshBasicMaterial({ color: 0xc53a2c });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.8, 8.2), bodyMat);
  floor.position.y = 1.02;
  floor.castShadow = true;
  car.add(floor);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.55, 2.35), bodyMat);
  hood.position.set(0, 1.35, 2.43);
  hood.castShadow = true;
  car.add(hood);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.45, 1.2, 3.5), bodyMat);
  cabin.position.set(0, 1.92, 0.25);
  cabin.castShadow = true;
  car.add(cabin);

  const trunk = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.65, 1.95), bodyMat);
  trunk.position.set(0, 1.32, -2.52);
  trunk.castShadow = true;
  car.add(trunk);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.8, 0.15), glassMat);
  windshield.position.set(0, 2.05, 1.48);
  car.add(windshield);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.72, 0.15), glassMat);
  rearGlass.position.set(0, 2.0, -1.05);
  car.add(rearGlass);

  const sideWindowL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 2.2), glassMat);
  sideWindowL.position.set(-1.58, 2.0, 0.2);
  car.add(sideWindowL);

  const sideWindowR = sideWindowL.clone();
  sideWindowR.position.x = 1.58;
  car.add(sideWindowR);

  const grilleFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.15), trimMat);
  grilleFrame.position.set(0, 1.22, 4.12);
  car.add(grilleFrame);

  const kidneyL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.08), new THREE.MeshBasicMaterial({ color: 0xb9b9b9 }));
  kidneyL.position.set(-0.24, 1.22, 4.2);
  car.add(kidneyL);

  const kidneyR = kidneyL.clone();
  kidneyR.position.x = 0.24;
  car.add(kidneyR);

  const headL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.3, 0.1), lightMat);
  headL.position.set(-1.05, 1.24, 4.16);
  car.add(headL);

  const headR = headL.clone();
  headR.position.x = 1.05;
  car.add(headR);

  const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.08), rearLightMat);
  tailL.position.set(-1.1, 1.2, -4.16);
  car.add(tailL);

  const tailR = tailL.clone();
  tailR.position.x = 1.1;
  car.add(tailR);

  const bumperFront = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.3, 0.2), trimMat);
  bumperFront.position.set(0, 0.8, 4.2);
  car.add(bumperFront);

  const bumperRear = bumperFront.clone();
  bumperRear.position.z = -4.2;
  car.add(bumperRear);

  const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.35), trimMat);
  mirrorL.position.set(-1.85, 1.9, 1.2);
  car.add(mirrorL);

  const mirrorR = mirrorL.clone();
  mirrorR.position.x = 1.85;
  car.add(mirrorR);

  const driverBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.9, 0.5), new THREE.MeshStandardMaterial({ color: 0x417ecf, roughness: 0.8, flatShading: true }));
  driverBody.position.set(-0.55, 2.0, 0.3);
  driverBody.name = "Sławek";
  car.add(driverBody);

  const driverHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.38), new THREE.MeshStandardMaterial({ color: 0xd8af8c, roughness: 0.8, flatShading: true }));
  driverHead.position.set(-0.55, 2.66, 0.35);
  car.add(driverHead);

  const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.56, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.92, flatShading: true });
  const rimMat = new THREE.MeshBasicMaterial({ color: 0x9e9fa4 });
  const wheelOffsets = [
    [-1.75, 0.65, 2.45],
    [1.75, 0.65, 2.45],
    [-1.75, 0.65, -2.45],
    [1.75, 0.65, -2.45]
  ];

  for (const [x, y, z] of wheelOffsets) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    car.add(wheel);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.57, 10), rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(x, y, z);
    car.add(rim);
  }

  return car;
}

const car = makeCar();
scene.add(car);

const state = { velocity: 0, heading: 0, steer: 0 };
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false };

window.addEventListener("keydown", (event) => {
  if (event.code in keys) {
    keys[event.code] = true;
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code in keys) {
    keys[event.code] = false;
    event.preventDefault();
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function updateCar(dt) {
  const accel = 21;
  const brake = 30;
  const drag = 4.4;
  const maxSpeed = 50;
  const maxReverse = -15;

  if (keys.ArrowUp) state.velocity += accel * dt;
  if (keys.ArrowDown) state.velocity -= brake * dt;

  const handbrake = keys.Space;
  state.velocity -= state.velocity * drag * dt * (handbrake ? 2.2 : 1);
  state.velocity = Math.max(maxReverse, Math.min(maxSpeed, state.velocity));

  const steerInput = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
  state.steer += (steerInput * (handbrake ? 1.2 : 0.72) - state.steer) * Math.min(1, dt * 9);

  const grip = handbrake ? 0.42 : 1;
  state.heading += state.steer * 1.45 * grip * (state.velocity / maxSpeed) * dt;

  const direction = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
  car.position.addScaledVector(direction, state.velocity * dt);
  car.rotation.y = state.heading;

  const boundary = 168;
  car.position.x = THREE.MathUtils.clamp(car.position.x, -boundary, boundary);
  car.position.z = THREE.MathUtils.clamp(car.position.z, -boundary, boundary);

  if (Math.abs(car.position.x) >= boundary || Math.abs(car.position.z) >= boundary) state.velocity *= 0.88;

  speedLabel.textContent = `Speed: ${Math.round(Math.abs(state.velocity) * 3.9)} km/h ${handbrake ? "(handbrake)" : ""}`;
}

function updateCamera(dt) {
  const forward = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
  const desired = new THREE.Vector3().copy(car.position).addScaledVector(forward, -11).add(new THREE.Vector3(0, 5.2, 0));
  camera.position.lerp(desired, Math.min(1, dt * 5));
  camera.lookAt(car.position.x, car.position.y + 1.7, car.position.z + 2.2);
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.033);
  updateCar(dt);
  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
