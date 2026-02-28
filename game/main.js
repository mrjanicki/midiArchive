import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const canvas = document.getElementById("game");
const speedLabel = document.getElementById("speed");

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x4f5b77, 45, 220);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);

const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x2f2620, 1.0);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2d8, 1.05);
sun.position.set(30, 45, -20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(420, 420),
  new THREE.MeshStandardMaterial({ color: 0x374454, roughness: 0.95, metalness: 0.02 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const asphalt = new THREE.Mesh(
  new THREE.PlaneGeometry(340, 340),
  new THREE.MeshStandardMaterial({ color: 0x22252b, roughness: 0.9, metalness: 0.05 })
);
asphalt.rotation.x = -Math.PI / 2;
asphalt.position.y = 0.02;
scene.add(asphalt);

const blockColors = [0x8e949f, 0x8c9284, 0x7f8a95, 0x8b8481];
const rand = (min, max) => Math.random() * (max - min) + min;

for (let i = 0; i < 230; i += 1) {
  const width = rand(8, 20);
  const depth = rand(8, 20);
  const height = rand(12, 45);
  const x = rand(-165, 165);
  const z = rand(-165, 165);

  if (Math.abs(x) < 32 && Math.abs(z) < 32) {
    continue;
  }

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: blockColors[i % blockColors.length],
      roughness: 0.95,
      metalness: 0.03
    })
  );

  building.position.set(x, height / 2, z);
  building.castShadow = true;
  building.receiveShadow = true;
  scene.add(building);
}

function makeCar() {
  const car = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.9, 7.2),
    new THREE.MeshStandardMaterial({ color: 0x7c3124, roughness: 0.86, metalness: 0.25 })
  );
  body.position.y = 1.2;
  body.castShadow = true;
  car.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.8, 3.5),
    new THREE.MeshStandardMaterial({ color: 0x924332, roughness: 0.86, metalness: 0.18 })
  );
  roof.position.set(0, 1.95, -0.2);
  roof.castShadow = true;
  car.add(roof);

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.7, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x4f6f8f, roughness: 0.18, metalness: 0.75, transparent: true, opacity: 0.78 })
  );
  windshield.position.set(0, 1.88, 1.15);
  car.add(windshield);

  const hoodRust = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 0.08, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x65412d, roughness: 1.0, metalness: 0.1 })
  );
  hoodRust.position.set(0, 1.69, 2.2);
  car.add(hoodRust);

  const driver = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.95, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x4aab59, roughness: 0.75, metalness: 0.05 })
  );
  driver.position.set(-0.55, 2.0, 0.25);
  driver.castShadow = true;
  driver.name = "Sławek";
  car.add(driver);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.45, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xd7b090, roughness: 0.8 })
  );
  head.position.set(-0.55, 2.72, 0.25);
  car.add(head);

  const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.48, 18);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x131417, roughness: 0.95 });
  const wheelOffsets = [
    [-1.7, 0.62, 2.3],
    [1.7, 0.62, 2.3],
    [-1.7, 0.62, -2.4],
    [1.7, 0.62, -2.4]
  ];

  for (const [x, y, z] of wheelOffsets) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    car.add(wheel);
  }

  return car;
}

const car = makeCar();
car.position.set(0, 0, 0);
scene.add(car);

const state = {
  velocity: 0,
  heading: 0,
  steer: 0
};

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  Space: false
};

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
  const accel = 20;
  const brake = 28;
  const drag = 4.2;
  const maxSpeed = 48;
  const maxReverse = -14;

  if (keys.ArrowUp) {
    state.velocity += accel * dt;
  }

  if (keys.ArrowDown) {
    state.velocity -= brake * dt;
  }

  const handbrake = keys.Space;
  state.velocity -= state.velocity * drag * dt * (handbrake ? 1.9 : 1);

  state.velocity = Math.max(maxReverse, Math.min(maxSpeed, state.velocity));

  const steerInput = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
  const steerTarget = steerInput * (handbrake ? 1.1 : 0.68);
  state.steer += (steerTarget - state.steer) * Math.min(1, dt * 9);

  const steerStrength = 1.4;
  const grip = handbrake ? 0.45 : 1;
  state.heading += state.steer * steerStrength * grip * (state.velocity / maxSpeed) * dt;

  const direction = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
  car.position.addScaledVector(direction, state.velocity * dt);
  car.rotation.y = state.heading;

  const boundary = 170;
  car.position.x = THREE.MathUtils.clamp(car.position.x, -boundary, boundary);
  car.position.z = THREE.MathUtils.clamp(car.position.z, -boundary, boundary);

  if (Math.abs(car.position.x) >= boundary || Math.abs(car.position.z) >= boundary) {
    state.velocity *= 0.9;
  }

  const kmh = Math.round(Math.abs(state.velocity) * 3.8);
  speedLabel.textContent = `Speed: ${kmh} km/h ${handbrake ? "(handbrake)" : ""}`;
}

function updateCamera(dt) {
  const back = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading)).multiplyScalar(-13);
  const desired = new THREE.Vector3().copy(car.position).add(back).add(new THREE.Vector3(0, 7.2, 0));
  camera.position.lerp(desired, Math.min(1, dt * 4));
  camera.lookAt(car.position.x, car.position.y + 2, car.position.z);
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.033);
  updateCar(dt);
  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
