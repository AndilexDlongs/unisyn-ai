console.log('✅ chat.js loaded')

// --- CHAT LOGIC ---
const qs = (s, el = document) => el.querySelector(s)
const chatContainer = qs('#chatContainer')
const input = qs('#queryInput')
const sendBtn = qs('#sendBtn')

// Make all textareas with .auto-expanding-textarea grow automatically
// const allTextareas = document.querySelectorAll('.auto-expanding-textarea');

// allTextareas.forEach(area => {
//   area.addEventListener('input', () => {
//     area.style.height = 'auto';
//     area.style.height = area.scrollHeight + 'px';
//   });
// });


// Utility to scroll to bottom
// function scrollToBottom() {
//   if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight
// }

function scrollToBottom() {
  const mainArea = document.querySelector('main'); // Select the scrolling container
  if (mainArea) {
    mainArea.scrollTo({
      top: mainArea.scrollHeight,
      behavior: 'smooth',
    });
  }
}

// Create user bubble (right-aligned to full section width)
function createUserBubble(text) {
  const wrap = document.createElement('div')
  // full width row, content pushed to the right
  wrap.className = 'user-message flex justify-end w-full'
  wrap.innerHTML = `
    <div class="inline-block bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[70%] text-left">
      ${text}
    </div>
  `
  return wrap
}

// --- LLM SELECTION DROPDOWN ---
const chooseBtn = document.getElementById('chooseLLMBtn')
const dropdown = document.getElementById('llmDropdown')
const applyBtn = document.getElementById('applyLLMs')

let selectedLLMs = []

if (chooseBtn && dropdown && applyBtn) {
  chooseBtn.addEventListener('click', () => {
    dropdown.classList.toggle('hidden')
  })

  applyBtn.addEventListener('click', () => {
    selectedLLMs = Array.from(
      dropdown.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value)
    dropdown.classList.add('hidden')
    console.log('Selected LLMs:', selectedLLMs)
  })
}

// Handle send
async function handleSend() {
  const message = input.value.trim()
  if (!message) return

  // --- Trigger UI transition on first send ---
  if (!window.chatStarted) {
    window.chatStarted = true

    // 1️⃣ Fade out logo + tagline
    const heroSection = document.querySelector('.flex.flex-col.items-center.mb-8')
    if (heroSection) heroSection.classList.add('fade-out')
    setTimeout(() => heroSection?.remove(), 400)

    // 2️⃣ Move "Who do you want to talk to?" button to top bar
    const topBar = document.querySelector('header > div.flex.items-center.justify-between')
    const llmButtonContainer = document.getElementById('llmButtonContainer')
    const chooseBtn = document.getElementById('chooseLLMBtn')

    if (topBar && llmButtonContainer && chooseBtn) {
      chooseBtn.textContent = '🧠 Change who I’m speaking to'
      llmButtonContainer.style.margin = '0'
      llmButtonContainer.classList.remove('mt-3')
      llmButtonContainer.classList.add('absolute', 'left-1/2', '-translate-x-1/2')
      topBar.insertBefore(llmButtonContainer, topBar.querySelector('#settingsBtn'))
    }

    // 4️⃣ Let the main chat column use all available width
    const shell = document.getElementById('chatShell')
    if (shell) {
      shell.classList.add('chat-shell-wide')
    }

    // 5️⃣ Frame the chat container so you can see its width clearly
    const container = document.getElementById('chatContainer')
    if (container) {
      container.classList.add('fullwidth-chat')
    }

    // Move textbox to bottom section after first send
    const textbox = document.getElementById('textboxContainer');
    const bottomRegion = document.getElementById('bottomTextboxArea');

    if (textbox && bottomRegion) {
      bottomRegion.appendChild(textbox);
    }
  }

  // append user bubble
  chatContainer.appendChild(createUserBubble(message))
  input.value = ''
  input.style.height = 'auto'
  scrollToBottom()

  // Determine which models we're sending to
  const modelsToSend =
    selectedLLMs && selectedLLMs.length > 0
      ? selectedLLMs
      : ['unisyn-auto']

  // Per-model "Thinking..." placeholders
  const thinkingGrid = document.createElement('div')
  thinkingGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2'

  const count = modelsToSend.length || 1

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div')
    card.className =
      'bg-zinc-800/70 text-zinc-400 p-4 rounded-2xl border border-zinc-700/60 animate-pulse'
    card.innerHTML = `
      <div class="font-semibold text-sm mb-2">Thinking...</div>
      <p class="text-xs text-zinc-500">Model ${i + 1} is generating a response.</p>
    `
    thinkingGrid.appendChild(card)
  }

  chatContainer.appendChild(thinkingGrid)
  scrollToBottom()
  
  
  // // --- append user message ---
  // chatContainer.appendChild(createUserBubble(message))
  // input.value = ''
  // scrollToBottom()

  // // per-LLM thinking bubbles can be added later;
  // // for now, a single left-aligned “thinking”:
  // const loading = document.createElement('div')
  // loading.className = 'ai-message text-gray-400 italic mt-2'
  // loading.textContent = 'Thinking...'
  // chatContainer.appendChild(loading)
  
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message,
        session_id: 'test-1',
        models: modelsToSend,
        conversation_type: 'solo', // later you can vary this
      }),
    })

    const data = await res.json()
    thinkingGrid.remove()

    const grid = document.createElement('div')
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'

    // Backend will return 1 result for solo, or many for multi-LLM
    data.results.slice(0, 4).forEach(resp => {
      const card = document.createElement('div')
      card.className = 'bg-zinc-800 text-zinc-200 p-4 rounded-2xl'
      card.innerHTML = `
        <div class="font-semibold text-sm mb-2">${resp.label || resp.model}</div>
        <p class="text-sm">${resp.text || '(no response)'}</p>
      `
      grid.appendChild(card)
    })

    chatContainer.appendChild(grid)
    scrollToBottom()
  } catch (err) {
    thinkingGrid.remove()
    const errorMsg = document.createElement('div')
    errorMsg.className = 'text-red-400 mt-2'
    errorMsg.textContent = 'Error contacting AI service.'
    chatContainer.appendChild(errorMsg)
  }
}

if (sendBtn && input) {
  sendBtn.addEventListener('click', handleSend)
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  })

  // auto-grow textarea vertically
  input.addEventListener('input', () => {
    input.style.height = 'auto'
    input.style.height = input.scrollHeight + 'px'
  })
}

// --- LLM auto-select / limit logic ---
document.addEventListener('DOMContentLoaded', () => {
  const autoSelect = document.querySelector('input[value="unisyn-auto"]')
  const allCheckBoxes = document.querySelectorAll('#llmDropdown input[type="checkbox"]')

  if (!autoSelect) return

  autoSelect.addEventListener('change', () => {
    const others = Array.from(allCheckBoxes).filter(cb => cb !== autoSelect)

    if (autoSelect.checked) {
      // Uncheck and disable all others
      others.forEach(cb => {
        cb.checked = false
        cb.disabled = true
        cb.parentElement.classList.add('opacity-40', 'cursor-not-allowed')
      })
    } else {
      // Re-enable them when Unisyn is unchecked
      others.forEach(cb => {
        cb.disabled = false
        cb.parentElement.classList.remove('opacity-40', 'cursor-not-allowed')
      })
    }
  })
})

document.addEventListener('DOMContentLoaded', () => {
  const allCheckboxes = document.querySelectorAll('#llmDropdown input[type="checkbox"]')
  const autoSelect = document.querySelector('input[value="unisyn-auto"]')

  const MAX_SELECTION = 4

  allCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      // If Unisyn auto-select is turned on, stop any other action
      if (autoSelect && autoSelect.checked && cb !== autoSelect) {
        cb.checked = false
        return
      }

      // Enforce 4-model limit (excluding Unisyn)
      const selected = Array.from(allCheckboxes).filter(
        c => c.checked && c !== autoSelect
      )

      if (selected.length > MAX_SELECTION) {
        cb.checked = false
        showToast(`You can select up to ${MAX_SELECTION} models only.`)
      }
    })
  })

  // --- Helper toast ---
  function showToast(message) {
    const toast = document.createElement('div')
    toast.className =
      'fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none'

    const inner = document.createElement('div')
    inner.textContent = message
    inner.className =
      'text-white text-3xl sm:text-4xl font-bold px-10 py-6 rounded-2xl bg-zinc-900/95 ' +
      'border border-indigo-500/40 shadow-[0_0_50px_rgba(124,58,237,0.6)] ' +
      'backdrop-blur-lg animate-toast-in text-center select-none tracking-tight'

    toast.appendChild(inner)
    document.body.appendChild(toast)

    setTimeout(() => {
      inner.classList.add('animate-toast-out')
      setTimeout(() => toast.remove(), 400)
    }, 2500)
  }
})

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar')
  const toggleBtn = document.getElementById('sidebarToggle')

  if (sidebar && toggleBtn) {
    const root = document.documentElement
    const collapsedWidth = '5rem'
    const expandedWidth = '16rem'

    // initial value
    root.style.setProperty('--sidebar-width', collapsedWidth)

    toggleBtn.addEventListener('click', () => {
      const expanded = sidebar.classList.toggle('sidebar-expanded')
      root.style.setProperty(
        '--sidebar-width',
        expanded ? expandedWidth : collapsedWidth
      )
    })
  }
})


