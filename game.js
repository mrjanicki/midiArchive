const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

const world = {
  gravity: 0.7,
  friction: 0.82,
  groundY: 470,
  cameraX: 0,
  width: 2400,
};

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  s: false,
  d: false,
};

const player = {
  x: 120,
  y: 420,
  w: 34,
  h: 50,
  vx: 0,
  vy: 0,
  speed: 1.5,
  jumpPower: 13.5,
  onGround: false,
  facing: 1,
  attacking: false,
  attackTimer: 0,
  hp: 5,
  invuln: 0,
};

const platforms = [
  { x: 280, y: 425, w: 170, h: 16 },
  { x: 560, y: 376, w: 180, h: 16 },
  { x: 890, y: 335, w: 150, h: 16 },
  { x: 1280, y: 398, w: 220, h: 16 },
  { x: 1710, y: 352, w: 160, h: 16 },
  { x: 2050, y: 408, w: 220, h: 16 },
];

const pickups = [
  { x: 610, y: 340, w: 16, h: 16, type: "food", active: true },
  { x: 1330, y: 362, w: 16, h: 16, type: "food", active: true },
];

const enemies = [
  { x: 720, y: 440, w: 30, h: 30, vx: 1, hp: 2, minX: 670, maxX: 835 },
  { x: 1460, y: 440, w: 30, h: 30, vx: -1.2, hp: 2, minX: 1360, maxX: 1590 },
  { x: 2140, y: 440, w: 30, h: 30, vx: 1.1, hp: 2, minX: 2060, maxX: 2300 },
];

function intersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function updatePlayer() {
  if (keys.ArrowLeft) {
    player.vx -= player.speed;
    player.facing = -1;
  }
  if (keys.ArrowRight) {
    player.vx += player.speed;
    player.facing = 1;
  }

  if (keys.ArrowUp && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
  }

  player.vy += world.gravity;
  player.vx *= world.friction;
  player.vx = Math.max(-7, Math.min(7, player.vx));

  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;

  if (player.y + player.h >= world.groundY) {
    player.y = world.groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  for (const p of platforms) {
    const next = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (intersects(next, p) && player.vy >= 0 && player.y + player.h - player.vy <= p.y + 8) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  player.x = Math.max(0, Math.min(world.width - player.w, player.x));

  if (keys.s && !player.attacking) {
    player.attacking = true;
    player.attackTimer = 16;
  }

  if (player.attacking) {
    player.attackTimer -= 1;
    if (player.attackTimer <= 0) {
      player.attacking = false;
    }
  }

  if (player.invuln > 0) player.invuln -= 1;

  const attackHitbox = {
    x: player.facing === 1 ? player.x + player.w : player.x - 26,
    y: player.y + 8,
    w: 26,
    h: 24,
  };

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;

    enemy.x += enemy.vx;
    if (enemy.x < enemy.minX || enemy.x > enemy.maxX) enemy.vx *= -1;

    if (player.attacking && intersects(attackHitbox, enemy)) {
      enemy.hp -= 1;
      enemy.x += player.facing * 18;
    }

    if (intersects(player, enemy) && player.invuln <= 0) {
      player.hp -= 1;
      player.invuln = 50;
      player.vx = -player.facing * 6;
      statusEl.textContent = "You got hit. Find food or shelter!";
    }
  }

  for (const item of pickups) {
    if (item.active && intersects(player, item)) {
      item.active = false;
      player.hp = Math.min(5, player.hp + 1);
      statusEl.textContent = "You found warm food near the market square.";
    }
  }

  if (keys.d) {
    if (player.x > 2200) {
      statusEl.textContent = "You reached a temporary shelter in Kalisz. Map 1 complete.";
    } else {
      statusEl.textContent = "(B) Interact: search for shelter near the right edge.";
    }
  }

  world.cameraX = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width * 0.4));
}

function drawBackdrop() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#1f2242");
  sky.addColorStop(0.5, "#29204a");
  sky.addColorStop(1, "#5c4a59");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 80; i++) {
    const sx = (i * 137 - world.cameraX * 0.12) % (canvas.width + 200);
    const sy = 40 + ((i * 71) % 190);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect((sx + canvas.width + 200) % (canvas.width + 200) - 100, sy, 2, 2);
  }

  const farX = -world.cameraX * 0.25;
  ctx.fillStyle = "#2b2442";
  for (let i = 0; i < 10; i++) {
    const x = farX + i * 260;
    ctx.fillRect(x, 220, 170, 250);
    ctx.fillRect(x + 30, 170, 90, 300);
  }

  const midX = -world.cameraX * 0.45;
  ctx.fillStyle = "#43374f";
  for (let i = 0; i < 14; i++) {
    const x = midX + i * 180;
    ctx.fillRect(x, 260, 120, 230);
    ctx.fillRect(x + 20, 210, 24, 36);
    ctx.fillRect(x + 70, 210, 24, 36);
  }

  ctx.fillStyle = "#8f7e6a";
  ctx.fillRect(0, world.groundY, canvas.width, canvas.height - world.groundY);
  ctx.fillStyle = "#615545";
  for (let i = 0; i < canvas.width; i += 48) {
    ctx.fillRect(i, world.groundY + 20, 30, 4);
  }
}

function drawWorldObjects() {
  ctx.save();
  ctx.translate(-world.cameraX, 0);

  for (const p of platforms) {
    ctx.fillStyle = "#7d6a51";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#4f4335";
    ctx.fillRect(p.x, p.y + p.h - 4, p.w, 4);
  }

  for (const item of pickups) {
    if (!item.active) continue;
    ctx.fillStyle = "#f4c15b";
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = "#5b3f1a";
    ctx.fillRect(item.x + 4, item.y + 4, 8, 8);
  }

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    ctx.fillStyle = "#33413b";
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    ctx.fillStyle = "#bf616a";
    ctx.fillRect(enemy.x + 5, enemy.y + 6, 6, 6);
    ctx.fillRect(enemy.x + 18, enemy.y + 6, 6, 6);
  }

  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(-world.cameraX, 0);

  if (player.invuln > 0 && Math.floor(player.invuln / 5) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  ctx.fillStyle = "#cdbd9a";
  ctx.fillRect(player.x + 10, player.y, 14, 12);

  ctx.fillStyle = "#57677f";
  ctx.fillRect(player.x + 6, player.y + 12, 22, 22);

  ctx.fillStyle = "#3f2d2d";
  ctx.fillRect(player.x + 6, player.y + 34, 10, 16);
  ctx.fillRect(player.x + 18, player.y + 34, 10, 16);

  if (player.attacking) {
    ctx.fillStyle = "#d4d7e2";
    const whipX = player.facing === 1 ? player.x + player.w : player.x - 24;
    ctx.fillRect(whipX, player.y + 16, 24, 4);
  }

  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(16, 14, 150, 48);
  ctx.fillStyle = "#f2eee2";
  ctx.font = "16px monospace";
  ctx.fillText(`HP: ${"♥".repeat(player.hp)}`, 24, 34);
  ctx.fillText(`X: ${Math.floor(player.x)}`, 24, 54);
}

function draw() {
  drawBackdrop();
  drawWorldObjects();
  drawPlayer();
  drawHud();
}

function loop() {
  updatePlayer();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  if (e.key in keys) keys[e.key] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key in keys) keys[e.key] = false;
});

loop();
