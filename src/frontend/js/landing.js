console.log('✅ landing.js loaded')

// ---- STARFIELD BACKGROUND ----
const canvas = document.getElementById('stars')
if (canvas) {
  const ctx = canvas.getContext('2d')
  let stars = []
  let shootingStars = []
  let w, h

  function resize() {
    w = canvas.width = window.innerWidth
    h = canvas.height = window.innerHeight
    stars = Array(50).fill().map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      t: Math.random() * 360
    }))
  }

  function createShootingStar() {
    shootingStars.push({
      x: Math.random() * w,
      y: Math.random() * (h / 2),
      len: Math.random() * 120 + 80,
      speed: Math.random() * 4 + 2,
      opacity: 1
    })
  }

  function draw() {
    ctx.clearRect(0, 0, w, h)
    stars.forEach(star => {
      const opacity = 0.6 + 0.4 * Math.sin((star.t * Math.PI) / 180)
      ctx.fillStyle = `rgba(255,255,255,${opacity})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI)
      ctx.fill()
      star.t += 0.2
    })

    if (Math.random() < 0.002) createShootingStar()
    shootingStars.forEach((s, i) => {
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len, s.y + s.len / 3)
      grad.addColorStop(0, `rgba(255,255,255,${s.opacity})`)
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(s.x - s.len, s.y + s.len / 3)
      ctx.stroke()
      s.x -= s.speed
      s.y += s.speed / 3
      s.opacity -= 0.01
      if (s.opacity <= 0) shootingStars.splice(i, 1)
    })

    requestAnimationFrame(draw)
  }

  window.addEventListener('resize', resize)
  resize()
  draw()
}

// ---- MOBILE MENU TOGGLE ----
const menuBtn = document.getElementById('menuBtn')
const mobileMenu = document.getElementById('mobileMenu')
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden')
  })
}
