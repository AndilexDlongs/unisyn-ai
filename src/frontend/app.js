// Starfield Animation
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
let stars = [];
let shootingStars = [];
let w, h;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  stars = Array(50)
    .fill()
    .map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      t: Math.random() * 360,
    }));
}

function createShootingStar() {
  shootingStars.push({
    x: Math.random() * w,
    y: Math.random() * (h / 2),
    len: Math.random() * 120 + 80,
    speed: Math.random() * 4 + 2,
    opacity: 1,
  });
}

function draw() {
  ctx.clearRect(0, 0, w, h);
  stars.forEach((star) => {
    const opacity = 0.6 + 0.4 * Math.sin((star.t * Math.PI) / 180);
    ctx.fillStyle = `rgba(255,255,255,${opacity})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
    ctx.fill();
    star.t += 0.2;
  });

  if (Math.random() < 0.002) createShootingStar();
  shootingStars.forEach((s, i) => {
    const grad = ctx.createLinearGradient(
      s.x,
      s.y,
      s.x - s.len,
      s.y + s.len / 3
    );
    grad.addColorStop(0, `rgba(255,255,255,${s.opacity})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.len, s.y + s.len / 3);
    ctx.stroke();
    s.x -= s.speed;
    s.y += s.speed / 3;
    s.opacity -= 0.01;
    if (s.opacity <= 0) shootingStars.splice(i, 1);
  });

  requestAnimationFrame(draw);
}

// Mobile Menu Toggle
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
}

// Initialize starfield animation
window.addEventListener('resize', resize);
resize();
draw();

// Chat functionality (for chat page)
const qs = (s, el = document) => el.querySelector(s);
const chatContainer = qs('#chatContainer');
const input = qs('#queryInput');
const sendBtn = qs('#sendBtn');

// Utility to scroll to bottom of chat
function scrollToBottom() {
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Create a user message bubble
function createUserBubble(text) {
  const wrap = document.createElement('div');
  wrap.className = 'text-right';
  wrap.innerHTML = `
    <div class="inline-block bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[70%]">
      ${text}
    </div>
  `;
  return wrap;
}

// Create a grid of 4 AI responses
function createAIGroupResponses() {
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';

  // 4 placeholder AIs
  const placeholders = [
    "AI-1: Hey there! I'm good 😄",
    'AI-2: Doing great, thanks for checking in!',
    'AI-3: Always ready to chat 💬',
    "AI-4: Processing... oh wait, I'm fine too 🤖",
  ];

  for (let i = 0; i < 4; i++) {
    const card = document.createElement('div');
    card.className =
      'bg-zinc-800 text-zinc-200 p-4 rounded-2xl flex flex-col justify-between';
    card.innerHTML = `<p>${placeholders[i]}</p>`;
    grid.appendChild(card);
  }

  return grid;
}

// Handle send event
async function handleSend() {
  const message = input.value.trim();
  if (!message) return;

  // Append user message bubble
  const userMsg = createUserBubble(message);
  chatContainer.appendChild(userMsg);
  input.value = '';
  scrollToBottom();

  // Add temporary loading grid
  const loadingGrid = document.createElement('div');
  loadingGrid.className =
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
  for (let i = 0; i < 4; i++) {
    const card = document.createElement('div');
    card.className = 'bg-zinc-800 text-zinc-400 p-4 rounded-2xl animate-pulse';
    card.innerHTML = `<p>Thinking...</p>`;
    loadingGrid.appendChild(card);
  }
  chatContainer.appendChild(loadingGrid);
  scrollToBottom();

  try {
    // Send to backend proxy (Express → FastAPI)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message,
        session_id: 'web-user',
      }),
    });
    const data = await res.json();

    // Remove loading grid
    loadingGrid.remove();

    // Create real AI responses grid
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';

    data.results.slice(0, 4).forEach((resp) => {
      const card = document.createElement('div');
      card.className =
        'bg-zinc-800 text-zinc-200 p-4 rounded-2xl flex flex-col justify-between';
      card.innerHTML = `
        <div class="font-semibold text-sm mb-2">${
          resp.label || resp.model
        }</div>
        <p class="text-sm leading-relaxed">${
          resp.text || resp.error || '(no response)'
        }</p>
      `;
      grid.appendChild(card);
    });

    chatContainer.appendChild(grid);
    scrollToBottom();
  } catch (err) {
    console.error(err);
    loadingGrid.remove();
    const errorMsg = document.createElement('div');
    errorMsg.className =
      'text-red-400 bg-red-900/40 border border-red-800 px-4 py-2 rounded-lg mt-2';
    errorMsg.textContent = 'Error contacting AI service.';
    chatContainer.appendChild(errorMsg);
  }
}

// Initialize chat functionality if on chat page
if (sendBtn && input) {
  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
}
