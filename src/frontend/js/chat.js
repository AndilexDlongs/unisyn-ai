console.log('✅ chat.js loaded')

// --- CHAT LOGIC ---
const qs = (s, el = document) => el.querySelector(s)
const chatContainer = qs('#chatContainer')
const input = qs('#queryInput')
const sendBtn = qs('#sendBtn')

// Utility to scroll to bottom
function scrollToBottom() {
  if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight
}

// Create user bubble
function createUserBubble(text) {
  const wrap = document.createElement('div');
  wrap.className = 'user-message';
  wrap.innerHTML = `
    <div class="inline-block bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[70%]">
      ${text}
    </div>
  `;
  return wrap;
}


// Handle send
async function handleSend() {
  const message = input.value.trim()

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

    // 3️⃣ Move textbox to bottom full width
    const textbox = document.querySelector('.glass.rounded-pill')
    if (textbox) {
      textbox.classList.add('fullwidth-textbox')
    }
  }

  if (!message) return
  chatContainer.appendChild(createUserBubble(message))
  input.value = ''
  scrollToBottom()

  const loading = document.createElement('div')
  loading.className = 'text-gray-400 italic mt-2'
  loading.textContent = 'Thinking...'
  chatContainer.appendChild(loading)
  scrollToBottom()

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: message, session_id: 'web-user' })
    })
    const data = await res.json()
    loading.remove()

    const grid = document.createElement('div')
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
    data.results.slice(0, 4).forEach(resp => {
      const card = document.createElement('div')
      card.className = 'bg-zinc-800 text-zinc-200 p-4 rounded-2xl'
      card.innerHTML = `
        <div class="font-semibold text-sm mb-2">${resp.label || resp.model}</div>
        <p class="text-sm">${resp.text || '(no response)'}</p>`
      grid.appendChild(card)
    })
    chatContainer.appendChild(grid)
    scrollToBottom()
  } catch (err) {
    loading.remove()
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

document.addEventListener('DOMContentLoaded', () => {
  const autoSelect = document.querySelector('input[value="unisyn-auto"]')
  const allCheckBoxes = document.querySelectorAll('#llmDropdown input[type="checkbox"]')

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
      if (autoSelect.checked && cb !== autoSelect) {
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
    // Outer full-screen flexbox container
    const toast = document.createElement('div')
    toast.className =
      'fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none'

    // Inner glowing alert box
    const inner = document.createElement('div')
    inner.textContent = message
    inner.className =
      'text-white text-3xl sm:text-4xl font-bold px-10 py-6 rounded-2xl bg-zinc-900/95 border border-indigo-500/40 shadow-[0_0_50px_rgba(124,58,237,0.6)] backdrop-blur-lg animate-toast-in text-center select-none tracking-tight'

    toast.appendChild(inner)
    document.body.appendChild(toast)

    // Fade out and remove after 2.5 seconds
    setTimeout(() => {
      inner.classList.add('animate-toast-out')
      setTimeout(() => toast.remove(), 400)
    }, 2500)
  }


})

