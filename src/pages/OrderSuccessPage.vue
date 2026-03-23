<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { RouterLink } from "vue-router";

/* ====================================
   EMOJI CONFETTI (TYPE SAFE)
==================================== */
const EMOJIS = [
  "🎉", "✨", "🥳", "🎊", "⭐",
  "💚", "🛒", "💥", "🌟", "🎈"
] as const;
type Emoji = typeof EMOJIS[number];

function randomEmoji(): Emoji {
  const index = Math.floor(Math.random() * EMOJIS.length);
  return EMOJIS[index] ?? EMOJIS[0];
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  emoji: Emoji;
  life: number;
  ttl: number;
}

const canvasRef = ref<HTMLCanvasElement | null>(null);

let ctx: CanvasRenderingContext2D | null = null;
let rafId = 0;
let burstInterval: number | null = null;
const particles: ConfettiParticle[] = [];

function resizeCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createParticle(
  x = window.innerWidth / 2,
  y = window.innerHeight / 2
): ConfettiParticle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 2 + Math.random() * 4;

  return {
    x: x + (Math.random() * 50 - 25),
    y: y + (Math.random() * 30 - 15),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 2,
    size: 20 + Math.random() * 22,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.25,
    emoji: randomEmoji(),
    life: 0,
    ttl: 200 + Math.floor(Math.random() * 80),
  };
}

function spawnBurst(count = 80) {
  for (let i = 0; i < count; i++) particles.push(createParticle());
}

function celebrateAgain() {
  spawnBurst(100);
}

function animate() {
  if (!ctx) return;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const time = Date.now() * 0.001;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!;

    p.life++;
    p.vy += 0.03;
    p.vx += Math.sin(time + i) * 0.02;

    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    ctx.font =
      `${p.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","EmojiOne Color",system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.emoji, 0, 0);

    ctx.restore();

    if (p.life > p.ttl || p.y > window.innerHeight + 40) {
      particles.splice(i, 1);
    }
  }

  rafId = requestAnimationFrame(animate);
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  ctx = canvas.getContext("2d");
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  spawnBurst(120);

  burstInterval = window.setInterval(() => spawnBurst(40), 900);

  setTimeout(() => {
    if (burstInterval) clearInterval(burstInterval);
  }, 4000);

  rafId = requestAnimationFrame(animate);
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
  if (burstInterval) clearInterval(burstInterval);
  window.removeEventListener("resize", resizeCanvas);
});
</script>

<template>
  <section class="success-page">
    <!-- Confetti Background -->
    <canvas ref="canvasRef" class="confetti"></canvas>

    <!-- Card -->
    <div class="card">
      
      <!-- Glow Pulse -->
      <div class="glow-pulse"></div>

      <!-- Animated Checkmark -->
      <div class="checkmark-wrap">
        <svg class="checkmark" viewBox="0 0 52 52">
          <circle class="checkmark-circle" cx="26" cy="26" r="25"></circle>
          <path class="checkmark-check" d="M14 27 l8 8 l16 -16"></path>
        </svg>
      </div>

      <h1>Order Placed Successfully!</h1>
      <p>Your order has been confirmed. Thank you for shopping with us.</p>

      <div class="actions">
        <RouterLink class="btn primary" to="/products">Continue Shopping</RouterLink>
        <button class="btn ghost" @click="celebrateAgain">Celebrate Again 🎊</button>
      </div>

    </div>
  </section>
</template>

<style scoped>
/* PAGE */
.success-page {
  min-height: calc(100vh - 80px);
  display: grid;
  place-items: center;
  position: relative;
  padding: 20px;
}

.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

/* CARD */
.card {
  width: min(520px, 92vw);
  padding: 42px 34px;
  border-radius: 20px;
  background: rgba(13, 17, 23, 0.75);
  border: 1px solid rgba(48, 54, 61, 0.55);
  backdrop-filter: blur(14px);
  box-shadow: 0 15px 45px rgba(0,0,0,0.5);
  text-align: center;
  position: relative;
  z-index: 2;
  animation: fadeUp 0.45s ease;
}

/* Glow Pulse Behind Checkmark */
.glow-pulse {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: radial-gradient(rgba(0,255,135,0.25), transparent 70%);
  filter: blur(20px);
  animation: pulseGlow 2.5s infinite ease-in-out;
  z-index: -1;
}

@keyframes pulseGlow {
  0% { transform: translateX(-50%) scale(0.90); opacity: 0.55; }
  50% { transform: translateX(-50%) scale(1.15); opacity: 0.9; }
  100% { transform: translateX(-50%) scale(0.90); opacity: 0.55; }
}

/* CHECKMARK SVG */
.checkmark-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

.checkmark {
  width: 74px;
  height: 74px;
  stroke-width: 4;
  stroke-linecap: round;
}

.checkmark-circle {
  stroke: #34d399;
  fill: rgba(52,211,153,0.12);
  animation: circleAnim 0.6s ease forwards;
}

.checkmark-check {
  stroke: #34d399;
  fill: none;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: checkAnim 0.35s ease 0.4s forwards;
}

@keyframes circleAnim {
  from { stroke-dasharray: 0 160; }
  to { stroke-dasharray: 160 160; }
}

@keyframes checkAnim {
  from { stroke-dashoffset: 48; }
  to { stroke-dashoffset: 0; }
}

/* TEXT */
h1 {
  margin: 12px 0 8px;
  font-size: 1.9rem;
  font-weight: 800;
}

p {
  margin-bottom: 24px;
  color: #9da7b1;
}

/* BUTTONS */
.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.primary {
  background: #238636;
  color: white;
  border: none;
}
.primary:hover {
  transform: translateY(-2px);
  opacity: .9;
}

.ghost {
  background: transparent;
  border: 1px solid #30363d;
  color: var(--text, #e6edf3);
}
.ghost:hover {
  background: rgba(255,255,255,0.07);
  transform: translateY(-2px);
}

/* ANIMATIONS */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>