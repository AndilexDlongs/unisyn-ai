// app.js — Group Chat Simulation (4 AI responses)

const qs = (s, el = document) => el.querySelector(s)
const chatContainer = qs("#chatContainer")
const input = qs("#queryInput")
const sendBtn = qs("#sendBtn")

// Utility to scroll to bottom of chat
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight
}

// Create a user message bubble
function createUserBubble(text) {
  const wrap = document.createElement("div")
  wrap.className = "text-right"
  wrap.innerHTML = `
    <div class="inline-block bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[70%]">
      ${text}
    </div>
  `
  return wrap
}

// Create a grid of 4 AI responses
function createAIGroupResponses() {
  const grid = document.createElement("div")
  grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"

  // 4 placeholder AIs
  const placeholders = [
    "AI-1: Hey there! I'm good 😄",
    "AI-2: Doing great, thanks for checking in!",
    "AI-3: Always ready to chat 💬",
    "AI-4: Processing... oh wait, I'm fine too 🤖"
  ]

  for (let i = 0; i < 4; i++) {
    const card = document.createElement("div")
    card.className =
      "bg-zinc-800 text-zinc-200 p-4 rounded-2xl flex flex-col justify-between"
    card.innerHTML = `<p>${placeholders[i]}</p>`
    grid.appendChild(card)
  }

  return grid
}

// Handle send event
async function handleSend() {
  const message = input.value.trim()
  if (!message) return

  // Append user message
  const userMsg = createUserBubble(message)
  chatContainer.appendChild(userMsg)
  input.value = ""
  scrollToBottom()

  // Delay for realism
  await new Promise((r) => setTimeout(r, 400))

  // Append AI group responses
  const aiGrid = createAIGroupResponses()
  chatContainer.appendChild(aiGrid)
  scrollToBottom()
}

// Event listeners
sendBtn.addEventListener("click", handleSend)
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
})
