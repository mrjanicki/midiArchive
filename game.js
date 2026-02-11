const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const stateEl = document.getElementById('state');
const audioBtn = document.getElementById('startAudio');

const keys = new Set();
let score = 0;
let combo = [];
let comboScore = 0;
let grindLocked = false;

const player = {
  x: 140,
  y: 360,
  vx: 0,
  vy: 0,
  angle: 0,
  onGround: true,
  grinding: false,
  jumpTimer: 0,
  spriteFrame: 0,
};

const level = {
  groundY: 390,
  rails: [
    { x1: 320, y1: 338, x2: 640, y2: 310 },
    { x1: 660, y1: 340, x2: 900, y2: 340 },
  ],
  ramps: [
    { x: 230, y: 345, w: 90, h: 45 },
    { x: 715, y: 355, w: 80, h: 35 },
  ],
  boxes: [
    { x: 440, y: 345, w: 85, h: 45 },
    { x: 565, y: 350, w: 80, h: 40 },
  ]
};

function addScore(name, amount) {
  combo.push(name);
  comboScore += amount;
  comboEl.textContent = `Combo: ${combo.join(' + ')} (${comboScore})`;
}

function bankCombo() {
  if (!combo.length) return;
  score += comboScore;
  combo = [];
  comboScore = 0;
  scoreEl.textContent = `Score: ${score}`;
  comboEl.textContent = 'Combo: -';
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const sx = x1 + t * dx;
  const sy = y1 + t * dy;
  return { d: Math.hypot(px - sx, py - sy), sx, sy, t };
}

function doTrick(key) {
  if (key === 'a' && !player.onGround) {
    addScore('Kickflip', 250);
    player.spriteFrame = 2;
  }
  if (key === 'd' && !player.onGround) {
    addScore('Grab', 220);
    player.spriteFrame = 3;
  }
  if (key === 's' && player.onGround) {
    player.vy = -7.5;
    player.onGround = false;
    player.jumpTimer = 16;
    addScore('Ollie', 120);
  }
  if (key === 'w' && !player.onGround) {
    for (const rail of level.rails) {
      const hit = distanceToSegment(player.x, player.y, rail.x1, rail.y1, rail.x2, rail.y2);
      if (hit.d < 16) {
        player.grinding = true;
        player.onGround = false;
        player.vx = 4 + Math.random() * 2;
        player.vy = 0;
        player.y = hit.sy - 8;
        addScore('Grind', 320);
        stateEl.textContent = 'State: grinding';
        grindLocked = true;
        return;
      }
    }
  }
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  keys.add(key);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    e.preventDefault();
  }
  if (['a', 'd', 's', 'w'].includes(key)) doTrick(key);
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

function update() {
  const accel = keys.has('arrowup') ? 0.18 : 0;
  if (!player.grinding) {
    player.vx += accel;
    player.vx *= 0.97;
    if (keys.has('arrowleft')) player.angle -= 0.05;
    if (keys.has('arrowright')) player.angle += 0.05;
    if (keys.has('arrowdown')) player.vx *= 0.92;
  }

  const dirX = Math.cos(player.angle);
  player.x += dirX * player.vx;

  if (!player.onGround && !player.grinding) {
    player.vy += 0.35;
    player.y += player.vy;
  }

  for (const ramp of level.ramps) {
    if (
      player.x > ramp.x &&
      player.x < ramp.x + ramp.w &&
      player.y >= level.groundY - 10
    ) {
      player.vy = -6.2;
      player.onGround = false;
      addScore('Ramp Pop', 180);
    }
  }

  if (player.grinding) {
    let onRail = false;
    for (const rail of level.rails) {
      const hit = distanceToSegment(player.x, player.y, rail.x1, rail.y1, rail.x2, rail.y2);
      if (hit.d < 20 && hit.t < 0.98) {
        onRail = true;
        player.y = hit.sy - 8;
        player.x += 2.4;
      }
    }
    if (!onRail || !keys.has('w')) {
      player.grinding = false;
      player.vy = -1.6;
      player.onGround = false;
      grindLocked = false;
      stateEl.textContent = 'State: tricking';
    }
  }

  if (player.y >= level.groundY) {
    if (!player.onGround) {
      bankCombo();
      stateEl.textContent = 'State: rolling';
    }
    player.y = level.groundY;
    player.vy = 0;
    player.onGround = true;
    player.grinding = false;
    player.spriteFrame = 0;
  }

  if (player.jumpTimer > 0) player.jumpTimer--;

  player.x = Math.max(25, Math.min(canvas.width - 25, player.x));
}

function drawBackground() {
  ctx.fillStyle = '#80beff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const buildings = [
    { x: 20, y: 140, w: 230, h: 170, c: '#c4c9d2' },
    { x: 250, y: 120, w: 170, h: 190, c: '#b8beca' },
    { x: 420, y: 110, w: 220, h: 200, c: '#c7ccd6' },
    { x: 650, y: 130, w: 290, h: 180, c: '#b6bcc8' },
  ];
  for (const b of buildings) {
    ctx.fillStyle = b.c;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#2b3858';
    for (let wx = b.x + 16; wx < b.x + b.w - 10; wx += 30) {
      for (let wy = b.y + 15; wy < b.y + b.h - 10; wy += 28) {
        ctx.fillRect(wx, wy, 12, 16);
      }
    }
  }

  ctx.fillStyle = '#7b7d77';
  ctx.fillRect(0, level.groundY, canvas.width, canvas.height - level.groundY);

  ctx.fillStyle = '#4f5750';
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.fillRect(i, level.groundY + 22, 28, 2);
  }

  ctx.fillStyle = '#f2d26b';
  ctx.fillRect(70, 305, 190, 10);
  ctx.fillStyle = '#1d1a19';
  ctx.fillText('SCHOOL', 125, 300);

  for (const box of level.boxes) {
    ctx.fillStyle = '#6b4d3c';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = '#9f7a60';
    ctx.fillRect(box.x + 3, box.y + 3, box.w - 6, 4);
  }

  for (const ramp of level.ramps) {
    ctx.fillStyle = '#8f6760';
    ctx.beginPath();
    ctx.moveTo(ramp.x, level.groundY);
    ctx.lineTo(ramp.x + ramp.w, level.groundY);
    ctx.lineTo(ramp.x + ramp.w, level.groundY - ramp.h);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = '#d6dde8';
  ctx.lineWidth = 5;
  for (const rail of level.rails) {
    ctx.beginPath();
    ctx.moveTo(rail.x1, rail.y1);
    ctx.lineTo(rail.x2, rail.y2);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y - 4);
  ctx.rotate(player.angle * 0.35);

  ctx.fillStyle = '#202020';
  ctx.fillRect(-19, 8, 38, 4);
  ctx.fillStyle = '#db3f5a';
  ctx.fillRect(-18, -2, 36, 8);
  ctx.fillStyle = '#f0e7cf';
  ctx.fillRect(-6, -15, 12, 12);

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-12, 14, 5, 0, Math.PI * 2);
  ctx.arc(12, 14, 5, 0, Math.PI * 2);
  ctx.fill();

  if (player.spriteFrame === 2) {
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(-22, -6, 44, 18);
  }
  if (player.spriteFrame === 3) {
    ctx.strokeStyle = '#ffea6f';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(16, -25);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFx() {
  if (grindLocked) {
    ctx.fillStyle = '#ffd56a';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(player.x - 14 + i * 4, player.y + 10 + ((i % 2) ? 2 : 0), 2, 2);
    }
  }
}

function loop() {
  update();
  drawBackground();
  drawPlayer();
  drawFx();
  requestAnimationFrame(loop);
}

ctx.imageSmoothingEnabled = false;
ctx.font = '16px Courier New';
loop();

let audioCtx;
let musicStarted = false;

function scheduleRetroLoop() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime + 0.05;
  const bpm = 132;
  const step = 60 / bpm / 2;

  const lead = [64, 67, 71, 72, 71, 67, 64, 62, 64, 67, 69, 71, 72, 69, 67, 64];
  const bass = [40, 40, 43, 43, 38, 38, 35, 35];

  for (let i = 0; i < lead.length; i++) {
    playNote(lead[i], now + i * step, step * 0.9, 'square', 0.05);
  }
  for (let i = 0; i < bass.length; i++) {
    playNote(bass[i], now + i * step * 2, step * 1.8, 'sawtooth', 0.07);
  }
  for (let i = 0; i < 16; i++) {
    playDrum(now + i * step, i % 4 === 0 ? 0.9 : 0.5);
  }

  setTimeout(scheduleRetroLoop, step * 1000 * lead.length);
}

function playNote(midi, time, duration, type, gainAmt) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(gainAmt, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + duration + 0.02);
}

function playDrum(time, velocity) {
  const noiseBuffer = audioCtx.createBuffer(1, 2048, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(velocity * 0.08, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

  noise.connect(filter).connect(gain).connect(audioCtx.destination);
  noise.start(time);
  noise.stop(time + 0.09);
}

audioBtn.addEventListener('click', async () => {
  if (musicStarted) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  await audioCtx.resume();
  musicStarted = true;
  audioBtn.textContent = 'Retro Soundtrack Playing';
  audioBtn.disabled = true;
  scheduleRetroLoop();
});
