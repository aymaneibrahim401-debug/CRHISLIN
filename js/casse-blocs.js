const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// --- Config ---
const rowColors = ['#00fff2', '#ff2f6e', '#ffe600', '#3d6bff', '#ff33e0'];
const brickCols = 12;
const brickRows = 5;
const brickPad = 4;
const brickTop = 40;
const brickLeft = 8;
const brickW = (W - brickLeft * 2 - brickPad * (brickCols - 1)) / brickCols;
const brickH = 16;

const GAME_DURATION = 2 * 60 * 1000; // 2 minutes
let timeLeft = GAME_DURATION;
let lastFrameTime = 0;

let score = 0, lives = 3;
let bricks = [];
let paddle, ball;
let running = false, paused = false, launched = false;

// Étoiles animées pour le fond futuriste
let stars = [];
function initStars() {
  stars = [];
  for (let i = 0; i < 70; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      speed: Math.random() * 0.4 + 0.1,
      hue: Math.random() < 0.5 ? '0,255,255' : '255,0,255'
    });
  }
}

// Particules d'impact sur les briques
let particles = [];
function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      color
    });
  }
}

// Compte à rebours avant lancement automatique de la balle
const LAUNCH_DELAY = 2000;
let launchTimerStart = 0;

function initBricks() {
  bricks = [];
  for (let r = 0; r < brickRows; r++) {
    for (let c = 0; c < brickCols; c++) {
      bricks.push({
        x: brickLeft + c * (brickW + brickPad),
        y: brickTop + r * (brickH + brickPad),
        w: brickW, h: brickH,
        color: rowColors[r],
        alive: true
      });
    }
  }
}

function initPaddle() {
  paddle = { w: 60, h: 12, x: W/2 - 30, y: H - 30, speed: 7 };
}

function initBall() {
  ball = {
    x: paddle.x + paddle.w/2,
    y: paddle.y - 8,
    r: 6,
    dx: 3.2,
    dy: -3.2
  };
  launched = false;
  launchTimerStart = performance.now();
}

function resetLevel(nextWave) {
  initBricks();
  initPaddle();
  initBall();
  updateSide();
}

function formatTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function updateSide() {
  document.getElementById('score').textContent = String(score).padStart(6, '0');
  document.getElementById('lives').textContent = '🔵'.repeat(Math.max(lives,0));
  const chronoEl = document.getElementById('chrono');
  chronoEl.textContent = formatTime(timeLeft);
  chronoEl.classList.toggle('warn', timeLeft <= 20000);
}

// --- Input clavier ---
let leftDown = false, rightDown = false;
document.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') leftDown = true;
  if (e.code === 'ArrowRight') rightDown = true;
  if (e.code === 'KeyP') togglePause();
});
document.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') leftDown = false;
  if (e.code === 'ArrowRight') rightDown = false;
});

// --- Input souris ---
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (W / rect.width);
  paddle.x = Math.min(Math.max(mx - paddle.w/2, 0), W - paddle.w);
});

// --- Input tactile (mobile) ---
function handleTouch(e) {
  if (!e.touches || e.touches.length === 0) return;
  const rect = canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX;
  const mx = (touchX - rect.left) * (W / rect.width);
  paddle.x = Math.min(Math.max(mx - paddle.w/2, 0), W - paddle.w);
  e.preventDefault();
}
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });

function togglePause() {
  if (!running) return;
  paused = !paused;
  if (!paused) {
    lastFrameTime = performance.now();
    requestAnimationFrame(loop);
  }
}

// --- Dessin ---
function drawBackground(dt) {
  const grad = ctx.createRadialGradient(W/2, H*0.3, 20, W/2, H*0.3, H);
  grad.addColorStop(0, '#0c1440');
  grad.addColorStop(0.55, '#060818');
  grad.addColorStop(1, '#020204');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = 'rgba(0,255,255,0.10)';
  ctx.lineWidth = 1;
  const horizon = brickTop + brickRows * (brickH + brickPad) + 14;
  for (let i = -20; i <= 20; i++) {
    ctx.beginPath();
    ctx.moveTo(W/2, horizon);
    ctx.lineTo(W/2 + i * 40, H);
    ctx.stroke();
  }
  for (let j = 0; j < 8; j++) {
    const y = horizon + (H - horizon) * (j / 8) * (j / 8);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  stars.forEach(s => {
    s.y += s.speed * (dt / 16);
    if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    ctx.beginPath();
    ctx.fillStyle = `rgba(${s.hue},${0.5 + Math.random()*0.3})`;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBricks() {
  bricks.forEach(b => {
    if (!b.alive) return;
    ctx.save();
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(b.x, b.y, b.w, 3);
  });
}

function drawPaddle() {
  ctx.save();
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 16;
  const grad = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
  grad.addColorStop(0, '#ff2f6e');
  grad.addColorStop(0.15, '#00fff2');
  grad.addColorStop(0.85, '#00fff2');
  grad.addColorStop(1, '#ff2f6e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 5);
  ctx.fill();
  ctx.restore();
}

function drawBall() {
  ctx.save();
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

function drawParticles(dt) {
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life -= 0.04;
  });
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// --- Compte à rebours visuel avant lancement ---
const countdownEl = document.getElementById('countdown');
function updateLaunchCountdown() {
  const elapsed = performance.now() - launchTimerStart;
  const remaining = LAUNCH_DELAY - elapsed;
  if (remaining > 0) {
    countdownEl.style.display = 'block';
    countdownEl.textContent = Math.ceil(remaining / 1000);
    countdownEl.style.left = (paddle.x + paddle.w/2 - 15) + 'px';
    countdownEl.style.top = (paddle.y - 70) + 'px';
  } else {
    countdownEl.style.display = 'none';
    launched = true;
  }
}

// --- Physique ---
function update(dt) {
  if (leftDown) paddle.x -= paddle.speed;
  if (rightDown) paddle.x += paddle.speed;
  paddle.x = Math.min(Math.max(paddle.x, 0), W - paddle.w);

  if (!launched) {
    ball.x = paddle.x + paddle.w/2;
    ball.y = paddle.y - ball.r - 1;
    updateLaunchCountdown();
    return;
  }

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x - ball.r < 0) { ball.x = ball.r; ball.dx *= -1; }
  if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.dx *= -1; }
  if (ball.y - ball.r < 0) { ball.y = ball.r; ball.dy *= -1; }

  if (ball.dy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y + ball.r <= paddle.y + paddle.h + 6 &&
      ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
    const hitPos = (ball.x - (paddle.x + paddle.w/2)) / (paddle.w/2);
    const speed = Math.hypot(ball.dx, ball.dy);
    const angle = hitPos * (Math.PI/3);
    ball.dx = speed * Math.sin(angle);
    ball.dy = -Math.abs(speed * Math.cos(angle));
    ball.y = paddle.y - ball.r;
  }

  for (const b of bricks) {
    if (!b.alive) continue;
    if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
      b.alive = false;
      score += 100;
      spawnParticles(b.x + b.w/2, b.y + b.h/2, b.color);
      const overlapLeft = (ball.x + ball.r) - b.x;
      const overlapRight = (b.x + b.w) - (ball.x - ball.r);
      const overlapTop = (ball.y + ball.r) - b.y;
      const overlapBottom = (b.y + b.h) - (ball.y - ball.r);
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
      if (minOverlap === overlapTop || minOverlap === overlapBottom) {
        ball.dy *= -1;
      } else {
        ball.dx *= -1;
      }
      updateSide();
      break;
    }
  }

  if (ball.y - ball.r > H) {
    lives--;
    updateSide();
    if (lives <= 0) {
      endGame(false);
      return;
    }
    initBall();
  }

  if (bricks.every(b => !b.alive)) {
    resetLevel(true);
  }
}

function endGame(won) {
  running = false;
  countdownEl.style.display = 'none';
  const titre = timeLeft <= 0 ? "TEMPS ÉCOULÉ !" : "PARTIE TERMINÉE";
  showOverlay(titre, `Score final : ${score}`, "REJOUER");
}

// --- Overlay ---
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const startBtn = document.getElementById('startBtn');

function showOverlay(title, sub, btnLabel) {
  overlayText.innerHTML = `<div style="color:#ff2f6e;font-size:28px;letter-spacing:3px;text-shadow:0 0 12px rgba(255,47,110,0.8)">${title}</div><div style="font-size:16px;margin-top:10px">${sub || ''}</div>`;
  startBtn.textContent = btnLabel || "JOUER";
  overlay.style.display = 'flex';
}

function hideOverlay() {
  overlay.style.display = 'none';
}

startBtn.addEventListener('click', () => {
  score = 0; lives = 3; timeLeft = GAME_DURATION;
  resetLevel(false);
  hideOverlay();
  running = true; paused = false;
  lastFrameTime = performance.now();
  requestAnimationFrame(loop);
});

// --- Boucle principale ---
function loop(now) {
  if (!running || paused) return;
  const dt = now - lastFrameTime;
  lastFrameTime = now;

  timeLeft -= dt;
  if (timeLeft <= 0) {
    timeLeft = 0;
    updateSide();
    endGame(false);
    return;
  }

  update(dt);
  drawBackground(dt);
  drawBricks();
  drawPaddle();
  drawBall();
  drawParticles(dt);
  updateSide();
  requestAnimationFrame(loop);
}

initStars();
initPaddle();
initBricks();
initBall();
drawBackground(16);
drawBricks();
drawPaddle();
drawBall();
updateSide();
