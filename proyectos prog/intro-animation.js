// ─────────────────────────────────────────────────────────────────────────────
// intro-animation.js — Animación de intro "Big Bang" para Crónicas del Abismo
// Se dispara al clickear "Iniciar Run". Muestra las 5 cartas del mazo inicial
// con efecto de partículas + explosión + aparición dramática de cartas.
// ─────────────────────────────────────────────────────────────────────────────

import { RARITY_CONFIG } from "./Data/cardsdata.js"

export class IntroAnimation {

    constructor(game) {
        this.game    = game
        this.overlay = null
        this.canvas  = null
        this.ctx     = null
        this.animId  = null
        this.t       = 0

        // Estado de la animación
        this.phase      = "bigbang"  // "bigbang" | "explode" | "cards" | "done"
        this.particles  = []
        this.shockRings = []
        this.cardEls    = []
        this.onComplete = null

        // Dimensiones
        this.W = window.innerWidth
        this.H = window.innerHeight
        this.cx = this.W / 2
        this.cy = this.H / 2
    }

    // ── Punto de entrada ──────────────────────────────────────────────────────
    play(onComplete) {
        this.onComplete = onComplete
        this._buildOverlay()
        this._startBigBang()
    }

    // ── Construir el overlay principal ────────────────────────────────────────
    _buildOverlay() {
        this.overlay = document.createElement("div")
        this.overlay.id = "intro-overlay"
        this.overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 9999;
            overflow: hidden;
            background: #050309;
            display: flex;
            align-items: center;
            justify-content: center;
        `

        this.canvas = document.createElement("canvas")
        this.canvas.width  = this.W
        this.canvas.height = this.H
        this.canvas.style.cssText = `
            position: absolute;
            inset: 0;
            z-index: 0;
        `
        this.ctx = this.canvas.getContext("2d")

        this.overlay.appendChild(this.canvas)
        document.body.appendChild(this.overlay)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 1: BIG BANG — partícula que crece y pulsa
    // ═══════════════════════════════════════════════════════════════════════════

    _startBigBang() {
        this.phase = "bigbang"
        this.t = 0

        // Partícula central inicial (punto de energía)
        this.singularity = {
            x: this.cx,
            y: this.cy,
            radius: 0,
            maxRadius: Math.min(this.W, this.H) * 0.18,
            pulseT: 0,
            alpha: 1,
        }

        // Partículas orbitando el núcleo
        this.orbitalParticles = Array.from({ length: 80 }, (_, i) => ({
            angle:  (i / 80) * Math.PI * 2,
            speed:  0.02 + Math.random() * 0.03,
            dist:   0,
            maxDist: 8 + Math.random() * 20,
            size:   0.5 + Math.random() * 2,
            alpha:  0.4 + Math.random() * 0.6,
            color:  this._randomCoreColor(),
        }))

        // Duración del big bang antes de explotar: 2.2s
        setTimeout(() => this._triggerExplosion(), 2200)

        this._animateBigBang()
    }

    _animateBigBang() {
        if (this.phase !== "bigbang") return
        this.t += 0.016
        this.singularity.pulseT += 0.05

        const s = this.singularity
        // Radio crece hasta maxRadius con easing
        const progress = Math.min(this.t / 2.2, 1)
        s.radius = s.maxRadius * this._easeOut(progress)

        // Pulso encima del crecimiento
        const pulse = Math.sin(s.pulseT * 3) * 0.08 * (1 - progress * 0.5)

        this._draw()

        this.animId = requestAnimationFrame(() => this._animateBigBang())
    }

    _draw() {
        const ctx = this.ctx
        ctx.clearRect(0, 0, this.W, this.H)

        if (this.phase === "bigbang") {
            this._drawBigBangCore()
        } else if (this.phase === "explode") {
            this._drawExplosion()
        }
    }

    _drawBigBangCore() {
        const ctx = this.ctx
        const s   = this.singularity
        const progress = Math.min(this.t / 2.2, 1)
        const pulse    = Math.sin(s.pulseT * 3) * s.radius * 0.06

        // Fondo — efecto de luz emanando desde el centro
        const bgGrad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, s.radius * 2.5)
        bgGrad.addColorStop(0, `rgba(80, 30, 140, ${0.18 * progress})`)
        bgGrad.addColorStop(0.4, `rgba(30, 10, 60, ${0.12 * progress})`)
        bgGrad.addColorStop(1, "transparent")
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, this.W, this.H)

        // Halo exterior tenue
        const halo = ctx.createRadialGradient(this.cx, this.cy, s.radius * 0.7, this.cx, this.cy, s.radius * 1.6 + pulse)
        halo.addColorStop(0, "transparent")
        halo.addColorStop(0.6, `rgba(160, 80, 255, ${0.08 * progress})`)
        halo.addColorStop(1, "transparent")
        ctx.beginPath()
        ctx.arc(this.cx, this.cy, s.radius * 1.6 + pulse, 0, Math.PI * 2)
        ctx.fillStyle = halo
        ctx.fill()

        // Núcleo exterior (glow difuso)
        const outerGlow = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, s.radius + pulse * 2)
        outerGlow.addColorStop(0,   `rgba(220, 160, 255, ${0.9 * (1 - progress * 0.3)})`)
        outerGlow.addColorStop(0.3, `rgba(140, 60, 220, ${0.7})`)
        outerGlow.addColorStop(0.65, `rgba(80, 20, 160, ${0.5})`)
        outerGlow.addColorStop(1,   "transparent")
        ctx.beginPath()
        ctx.arc(this.cx, this.cy, s.radius + pulse * 2, 0, Math.PI * 2)
        ctx.fillStyle = outerGlow
        ctx.fill()

        // Núcleo interior brillante
        const innerGlow = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, s.radius * 0.55)
        innerGlow.addColorStop(0, "rgba(255, 240, 255, 1)")
        innerGlow.addColorStop(0.3, "rgba(220, 140, 255, 0.95)")
        innerGlow.addColorStop(0.7, "rgba(140, 50, 220, 0.7)")
        innerGlow.addColorStop(1, "transparent")
        ctx.beginPath()
        ctx.arc(this.cx, this.cy, s.radius * 0.55 + pulse, 0, Math.PI * 2)
        ctx.fillStyle = innerGlow
        ctx.fill()

        // Punto blanco central
        const coreR = Math.max(3, s.radius * 0.12 + pulse * 0.5)
        const coreGrad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, coreR)
        coreGrad.addColorStop(0, "rgba(255, 255, 255, 1)")
        coreGrad.addColorStop(0.5, "rgba(240, 200, 255, 0.9)")
        coreGrad.addColorStop(1, "transparent")
        ctx.beginPath()
        ctx.arc(this.cx, this.cy, coreR, 0, Math.PI * 2)
        ctx.fillStyle = coreGrad
        ctx.fill()

        // Partículas orbitales
        this.orbitalParticles.forEach(p => {
            p.angle += p.speed
            p.dist = Math.min(p.dist + 0.4, p.maxDist + s.radius * 0.7)
            const px = this.cx + Math.cos(p.angle) * p.dist
            const py = this.cy + Math.sin(p.angle) * p.dist
            ctx.beginPath()
            ctx.arc(px, py, p.size, 0, Math.PI * 2)
            ctx.fillStyle = p.color.replace("A", String(p.alpha * progress))
            ctx.fill()
        })

        // Rayos de luz desde el núcleo (8 rayos)
        if (progress > 0.3) {
            const rayAlpha = (progress - 0.3) / 0.7 * 0.25
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + this.t * 0.3
                const rayLen = s.radius * 1.8 + Math.sin(this.t * 2 + i) * s.radius * 0.2
                const grad = ctx.createLinearGradient(
                    this.cx, this.cy,
                    this.cx + Math.cos(angle) * rayLen,
                    this.cy + Math.sin(angle) * rayLen
                )
                grad.addColorStop(0, `rgba(200, 140, 255, ${rayAlpha})`)
                grad.addColorStop(1, "transparent")
                ctx.beginPath()
                ctx.moveTo(this.cx, this.cy)
                ctx.lineTo(
                    this.cx + Math.cos(angle) * rayLen,
                    this.cy + Math.sin(angle) * rayLen
                )
                ctx.strokeStyle = grad
                ctx.lineWidth = 2 + Math.sin(this.t * 3 + i) * 1
                ctx.stroke()
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 2: EXPLOSIÓN
    // ═══════════════════════════════════════════════════════════════════════════

    _triggerExplosion() {
        if (this.animId) cancelAnimationFrame(this.animId)
        this.phase = "explode"
        this.explodeT = 0

        // Crear partículas de la explosión
        this.particles = []
        const R = this.singularity.radius

        // Partículas principales (van hacia afuera)
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2
            const speed = 3 + Math.random() * 12
            const size  = 1 + Math.random() * 5
            this.particles.push({
                x: this.cx + (Math.random() - 0.5) * R * 0.4,
                y: this.cy + (Math.random() - 0.5) * R * 0.4,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                alpha: 0.8 + Math.random() * 0.2,
                decay: 0.012 + Math.random() * 0.02,
                color: this._randomExplosionColor(),
                gravity: 0.08 + Math.random() * 0.1,
            })
        }

        // Anillos de choque
        this.shockRings = [
            { r: 0, maxR: Math.max(this.W, this.H) * 0.9, speed: 18, alpha: 0.7, width: 8 },
            { r: 0, maxR: Math.max(this.W, this.H) * 0.7, speed: 12, alpha: 0.5, width: 5 },
            { r: 0, maxR: Math.max(this.W, this.H) * 0.5, speed: 8,  alpha: 0.35, width: 3 },
        ]

        // Flash blanco inicial
        this._flashWhite()

        // Empezar a mostrar cartas luego de 0.9s
        setTimeout(() => this._showCards(), 900)

        this._animateExplosion()
    }

    _flashWhite() {
        const flash = document.createElement("div")
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: white;
            z-index: 10;
            pointer-events: none;
            animation: intro-flash-out 0.35s ease-out forwards;
        `
        this._injectFlashStyle()
        this.overlay.appendChild(flash)
        setTimeout(() => flash.remove(), 400)
    }

    _injectFlashStyle() {
        if (document.getElementById("intro-flash-style")) return
        const s = document.createElement("style")
        s.id = "intro-flash-style"
        s.textContent = `
            @keyframes intro-flash-out {
                0%   { opacity: 1; }
                100% { opacity: 0; }
            }
            @keyframes intro-card-appear {
                0%   { opacity: 0; transform: translateY(40px) scale(0.7) rotateY(90deg); filter: brightness(3) saturate(2); }
                40%  { opacity: 1; transform: translateY(-8px) scale(1.06) rotateY(0deg); filter: brightness(1.5); }
                65%  { transform: translateY(3px) scale(0.98); filter: brightness(1.1); }
                80%  { transform: translateY(-2px) scale(1.01); }
                100% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); }
            }
            @keyframes intro-btn-appear {
                0%   { opacity: 0; transform: translateY(16px) scale(0.9); }
                60%  { transform: translateY(-3px) scale(1.03); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes intro-card-hover-lift {
                from { transform: translateY(0) scale(1); }
                to   { transform: translateY(-14px) scale(1.06); }
            }
            @keyframes intro-title-appear {
                0%   { opacity: 0; transform: translateY(-10px) scale(0.95); letter-spacing: 0.4em; }
                100% { opacity: 1; transform: translateY(0) scale(1); letter-spacing: 0.22em; }
            }
            @keyframes intro-subtitle-appear {
                0%   { opacity: 0; }
                100% { opacity: 1; }
            }
            @keyframes intro-pulse-glow {
                from { box-shadow: 0 0 20px rgba(240,200,74,0.3), 0 0 40px rgba(240,200,74,0.1); }
                to   { box-shadow: 0 0 40px rgba(240,200,74,0.6), 0 0 80px rgba(240,200,74,0.2); }
            }
            @keyframes card-float {
                0%, 100% { transform: translateY(0px); }
                50%       { transform: translateY(-6px); }
            }
        `
        document.head.appendChild(s)
    }

    _animateExplosion() {
        if (this.phase !== "explode") return
        this.explodeT++

        const ctx = this.ctx
        ctx.clearRect(0, 0, this.W, this.H)

        // Fondo oscuro con afterglow
        ctx.fillStyle = `rgba(5, 3, 9, ${Math.min(1, this.explodeT * 0.04)})`
        ctx.fillRect(0, 0, this.W, this.H)

        // Afterglow central que se desvanece
        const glowAlpha = Math.max(0, 1 - this.explodeT * 0.025)
        if (glowAlpha > 0) {
            const glow = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, 300)
            glow.addColorStop(0, `rgba(200, 120, 255, ${glowAlpha * 0.6})`)
            glow.addColorStop(0.4, `rgba(100, 40, 180, ${glowAlpha * 0.35})`)
            glow.addColorStop(1, "transparent")
            ctx.fillStyle = glow
            ctx.fillRect(0, 0, this.W, this.H)
        }

        // Anillos de choque
        this.shockRings.forEach(ring => {
            ring.r += ring.speed
            ring.alpha = Math.max(0, ring.alpha - 0.013)
            if (ring.r < ring.maxR && ring.alpha > 0) {
                ctx.beginPath()
                ctx.arc(this.cx, this.cy, ring.r, 0, Math.PI * 2)
                ctx.strokeStyle = `rgba(180, 100, 255, ${ring.alpha})`
                ctx.lineWidth = ring.width * (1 - ring.r / ring.maxR)
                ctx.stroke()
            }
        })

        // Partículas
        this.particles.forEach(p => {
            p.x += p.vx
            p.y += p.vy
            p.vy += p.gravity
            p.vx *= 0.98
            p.alpha -= p.decay
            p.size  *= 0.993

            if (p.alpha <= 0) return
            ctx.beginPath()
            ctx.arc(p.x, p.y, Math.max(0.3, p.size), 0, Math.PI * 2)
            ctx.fillStyle = p.color.replace("A", String(Math.min(1, p.alpha)))
            ctx.fill()

            // Estela
            if (p.size > 1.5) {
                ctx.beginPath()
                ctx.arc(p.x - p.vx * 1.5, p.y - p.vy * 1.5, p.size * 0.5, 0, Math.PI * 2)
                ctx.fillStyle = p.color.replace("A", String(Math.min(0.4, p.alpha * 0.4)))
                ctx.fill()
            }
        })

        this.animId = requestAnimationFrame(() => this._animateExplosion())
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 3: CARTAS APARECEN
    // ═══════════════════════════════════════════════════════════════════════════

    _showCards() {
        this.phase = "cards"
        if (this.animId) cancelAnimationFrame(this.animId)
        this._injectFlashStyle()

        // Fade out canvas
        this.canvas.style.transition = "opacity 0.8s ease"
        this.canvas.style.opacity    = "0.15"

        // Fondo oscuro detrás de las cartas
        this.overlay.style.background = "radial-gradient(ellipse 70% 60% at 50% 50%, #1a0a2e 0%, #080b14 100%)"

        const deckList = this.game.deckList || []
        const cards    = deckList.slice(0, 5)

        // Contenedor de toda la pantalla de cartas
        const container = document.createElement("div")
        container.style.cssText = `
            position: relative;
            z-index: 5;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 32px;
            padding: 20px;
        `

        // Título "Tu mazo inicial"
        const titleEl = document.createElement("div")
        titleEl.style.cssText = `
            font-family: 'Cinzel', serif;
            font-size: clamp(0.9rem, 2.5vw, 1.4rem);
            font-weight: 700;
            letter-spacing: 0.22em;
            color: rgba(240, 200, 74, 0.9);
            text-shadow: 0 0 30px rgba(240,200,74,0.5);
            text-align: center;
            animation: intro-title-appear 0.7s cubic-bezier(0.2,0.8,0.3,1) forwards;
            opacity: 0;
        `
        titleEl.textContent = "— TU MAZO INICIAL —"
        container.appendChild(titleEl)

        // Subtítulo
        const subEl = document.createElement("div")
        subEl.style.cssText = `
            font-family: 'Crimson Text', Georgia, serif;
            font-size: clamp(0.75rem, 1.5vw, 0.95rem);
            font-style: italic;
            color: rgba(180, 160, 220, 0.6);
            text-align: center;
            margin-top: -20px;
            animation: intro-subtitle-appear 0.7s ease 0.3s forwards;
            opacity: 0;
        `
        subEl.textContent = "Pasá el cursor sobre cada carta para ver su habilidad"
        container.appendChild(subEl)

        // Fila de cartas
        const cardsRow = document.createElement("div")
        cardsRow.style.cssText = `
            display: flex;
            gap: clamp(8px, 1.5vw, 18px);
            justify-content: center;
            align-items: flex-end;
            flex-wrap: nowrap;
        `

        cards.forEach((card, i) => {
            const cardEl = this._buildCardElement(card, i)
            cardsRow.appendChild(cardEl)
        })

        container.appendChild(cardsRow)

        // Botón "Comenzar Run"
        const btnWrapper = document.createElement("div")
        btnWrapper.style.cssText = `
            opacity: 0;
            animation: intro-btn-appear 0.6s cubic-bezier(0.2,0.8,0.3,1) 0.15s forwards;
        `

        const btn = document.createElement("button")
        btn.textContent = "⚔ Comenzar Run"
        btn.style.cssText = `
            font-family: 'Cinzel', serif;
            font-size: clamp(0.8rem, 1.8vw, 1rem);
            letter-spacing: 0.15em;
            background: linear-gradient(135deg, rgba(60,20,90,0.9), rgba(30,10,50,0.9));
            color: #f0c84a;
            border: 1px solid #8a6010;
            padding: clamp(10px, 1.5vh, 18px) clamp(24px, 4vw, 60px);
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
            position: relative;
            overflow: hidden;
            animation: intro-pulse-glow 2s ease-in-out infinite alternate;
            margin-top: 8px;
        `

        btn.onmouseenter = () => {
            btn.style.background = "linear-gradient(135deg, rgba(80,30,120,0.95), rgba(50,15,80,0.95))"
            btn.style.borderColor = "#f0c84a"
            btn.style.transform = "translateY(-2px)"
        }
        btn.onmouseleave = () => {
            btn.style.background = "linear-gradient(135deg, rgba(60,20,90,0.9), rgba(30,10,50,0.9))"
            btn.style.borderColor = "#8a6010"
            btn.style.transform = "translateY(0)"
        }
        btn.onclick = () => this._finish()

        btnWrapper.appendChild(btn)
        container.appendChild(btnWrapper)
        this.overlay.appendChild(container)
    }

    _buildCardElement(card, index) {
        const isSpell  = card.type === "spell"
        const rarity   = card.rarity ? RARITY_CONFIG[card.rarity] : null
        const delay    = 0.15 + index * 0.12

        const wrapper = document.createElement("div")
        wrapper.style.cssText = `
            opacity: 0;
            animation:
                intro-card-appear 0.65s cubic-bezier(0.2,0.8,0.3,1) ${delay}s forwards,
                card-float 3.5s ease-in-out ${delay + 0.8}s infinite;
            position: relative;
            cursor: pointer;
        `

        const card_el = document.createElement("div")
        card_el.style.cssText = `
            width: clamp(170px, 20vw, 270px);
            height: clamp(260px, 31vw, 415px);
            border: 1px solid ${rarity ? rarity.border : "#2a2f50"};
            background: #161a2e;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            transition: all 0.28s cubic-bezier(0.2,0.8,0.3,1);
            ${rarity ? `box-shadow: 0 0 12px ${rarity.glow};` : ""}
        `

        // Imagen
        const imgWrap = document.createElement("div")
        imgWrap.style.cssText = `
            width: 100%;
            flex: 1;
            overflow: hidden;
            position: relative;
            background: linear-gradient(135deg, #100820, #080814);
        `

        if (card.image) {
            const img = document.createElement("img")
            img.src = card.image
            img.alt = card.name
            img.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;transition:transform 0.3s;"
            img.onerror = () => {
                img.style.display = "none"
                const ph = document.createElement("div")
                ph.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;opacity:0.5;"
                ph.textContent = isSpell ? "✨" : "⚔️"
                imgWrap.appendChild(ph)
            }
            imgWrap.appendChild(img)

            card_el.onmouseenter = () => {
                img.style.transform = "scale(1.06)"
                card_el.style.transform = "translateY(-14px) scale(1.06)"
                card_el.style.borderColor = rarity ? rarity.color : "#f0c84a"
                card_el.style.boxShadow = rarity
                    ? `0 0 28px ${rarity.glow}, 0 16px 40px rgba(0,0,0,0.8)`
                    : "0 0 24px rgba(240,200,74,0.4), 0 16px 40px rgba(0,0,0,0.8)"
                tooltip.style.opacity = "1"
                tooltip.style.transform = "translateX(-50%) translateY(0px)"
            }
            card_el.onmouseleave = () => {
                img.style.transform = "scale(1)"
                card_el.style.transform = ""
                card_el.style.borderColor = rarity ? rarity.border : "#2a2f50"
                card_el.style.boxShadow = rarity ? `0 0 12px ${rarity.glow}` : ""
                tooltip.style.opacity = "0"
                tooltip.style.transform = "translateX(-50%) translateY(8px)"
            }
        }

        card_el.appendChild(imgWrap)

        // Footer de la carta
        const footer = document.createElement("div")
        footer.style.cssText = `
            padding: 6px 6px 7px;
            background: linear-gradient(to top, rgba(8,11,20,0.98) 0%, rgba(8,11,20,0.9) 60%, transparent 100%);
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex-shrink: 0;
        `

        // Badge rareza
        if (rarity) {
            const rar = document.createElement("div")
            rar.style.cssText = `
                font-family: 'Cinzel', serif;
                font-size: 0.4rem;
                font-weight: 700;
                letter-spacing: 0.1em;
                border: 1px solid ${rarity.border};
                border-radius: 2px;
                padding: 1px 4px;
                color: ${rarity.color};
                text-align: center;
                align-self: center;
            `
            rar.textContent = rarity.label
            footer.appendChild(rar)
        } else {
            const rar = document.createElement("div")
            rar.style.cssText = `
                font-family: 'Cinzel', serif;
                font-size: 0.4rem;
                font-weight: 700;
                letter-spacing: 0.1em;
                border: 1px solid #f97316;
                border-radius: 2px;
                padding: 1px 4px;
                color: #fbbf24;
                text-align: center;
                align-self: center;
            `
            rar.textContent = "✨ HECHIZO"
            footer.appendChild(rar)
        }

        // Nombre
        const name = document.createElement("div")
        name.style.cssText = `
            font-family: 'Cinzel', serif;
            font-size: 0.5rem;
            font-weight: 700;
            color: #fff;
            text-align: center;
            text-shadow: 0 1px 3px rgba(0,0,0,1);
            line-height: 1.2;
        `
        name.textContent = card.name
        footer.appendChild(name)

        card_el.appendChild(footer)
        wrapper.appendChild(card_el)

        // Tooltip con habilidad
        const tooltip = document.createElement("div")
        tooltip.style.cssText = `
            position: absolute;
            bottom: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%) translateY(8px);
            background: rgba(8, 11, 20, 0.97);
            border: 1px solid ${rarity ? rarity.border : "#4a3a70"};
            padding: 8px 11px;
            width: 160px;
            font-family: 'Crimson Text', Georgia, serif;
            font-size: 0.78rem;
            font-style: italic;
            color: #f4eede;
            line-height: 1.45;
            pointer-events: none;
            opacity: 0;
            transition: all 0.22s cubic-bezier(0.2,0.8,0.3,1);
            z-index: 20;
            box-shadow: 0 8px 24px rgba(0,0,0,0.9);
            ${rarity ? `box-shadow: 0 8px 24px rgba(0,0,0,0.9), 0 0 12px ${rarity.glow};` : ""}
        `
        tooltip.textContent = card.effectDescription || "Sin habilidad especial"
        wrapper.appendChild(tooltip)

        return wrapper
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FASE 4: FIN → TRANSICIÓN AL JUEGO
    // ═══════════════════════════════════════════════════════════════════════════

    _finish() {
        if (this.animId) cancelAnimationFrame(this.animId)

        // Fade out del overlay
        this.overlay.style.transition = "opacity 0.6s ease"
        this.overlay.style.opacity    = "0"

        setTimeout(() => {
            this.overlay.remove()
            if (this.onComplete) this.onComplete()
        }, 650)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILIDADES
    // ═══════════════════════════════════════════════════════════════════════════

    _randomCoreColor() {
        const cols = [
            "rgba(200,140,255,A)",
            "rgba(140,80,255,A)",
            "rgba(255,200,255,A)",
            "rgba(180,100,255,A)",
            "rgba(255,255,255,A)",
            "rgba(220,160,255,A)",
        ]
        return cols[Math.floor(Math.random() * cols.length)]
    }

    _randomExplosionColor() {
        const cols = [
            "rgba(255,200,80,A)",
            "rgba(255,140,60,A)",
            "rgba(220,100,255,A)",
            "rgba(140,80,255,A)",
            "rgba(255,255,200,A)",
            "rgba(200,140,255,A)",
            "rgba(255,220,100,A)",
            "rgba(180,60,255,A)",
            "rgba(255,255,255,A)",
            "rgba(255,180,60,A)",
        ]
        return cols[Math.floor(Math.random() * cols.length)]
    }

    _easeOut(t) {
        return 1 - Math.pow(1 - t, 3)
    }
}