// ─────────────────────────────────────────────────────────────────────────────
// card-particles.js — Partículas para cartas Elite (verde) y Mística (rojo)
//
// USO: llamar CardParticles.refresh() cada vez que se renderiza la mano.
// Se monta automáticamente sobre cada .hand-card con rarity-elite o rarity-mistica.
// ─────────────────────────────────────────────────────────────────────────────

export const CardParticles = {

    // Map de canvas activos: elemento carta → { canvas, ctx, animId, particles, isHovered }
    _active: new Map(),

    // ── Llamar esto después de cada render() de la mano ─────────────────────
    refresh() {
        // Destruir canvas de cartas que ya no existen en el DOM
        for (const [cardEl, data] of this._active.entries()) {
            if (!document.body.contains(cardEl)) {
                cancelAnimationFrame(data.animId)
                data.canvas.remove()
                this._active.delete(cardEl)
            }
        }

        // Montar en cartas nuevas
        const elites   = document.querySelectorAll(".hand-card.rarity-elite")
        const misticas = document.querySelectorAll(".hand-card.rarity-mistica")

        elites.forEach(el   => this._mount(el, "elite"))
        misticas.forEach(el => this._mount(el, "mistica"))
    },

    // ── Destruir todos los canvas (al salir del combate, etc.) ───────────────
    destroyAll() {
        for (const [, data] of this._active.entries()) {
            cancelAnimationFrame(data.animId)
            data.canvas.remove()
        }
        this._active.clear()
    },

    // ── Montar canvas sobre una carta ────────────────────────────────────────
    _mount(cardEl, rarity) {
        if (this._active.has(cardEl)) return  // ya montado

        const canvas = document.createElement("canvas")
        canvas.style.cssText = `
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 20;
            border-radius: inherit;
        `
        cardEl.style.position = "relative"
        cardEl.appendChild(canvas)

        const ctx        = canvas.getContext("2d")
        const particles  = []
        const isElite    = rarity === "elite"

        const data = {
            canvas,
            ctx,
            animId:    null,
            particles,
            isHovered: false,
            rarity,
        }

        // Hover: más intensidad
        cardEl.addEventListener("mouseenter", () => { data.isHovered = true  })
        cardEl.addEventListener("mouseleave", () => { data.isHovered = false })

        this._active.set(cardEl, data)
        this._loop(cardEl, data)
    },

    // ── Loop de animación por carta ──────────────────────────────────────────
    _loop(cardEl, data) {
        const { canvas, ctx, particles } = data
        const isElite = data.rarity === "elite"

        // Sincronizar tamaño del canvas con la carta
        const W = cardEl.offsetWidth  || 196
        const H = cardEl.offsetHeight || 290
        if (canvas.width !== W || canvas.height !== H) {
            canvas.width  = W
            canvas.height = H
        }

        ctx.clearRect(0, 0, W, H)

        // Colores según rareza
        const baseColor  = isElite ? { r: 46,  g: 204, b: 113 } : { r: 231, g: 76,  b: 60  }
        const accentColor= isElite ? { r: 120, g: 255, b: 160 } : { r: 255, g: 120, b: 100 }

        // Spawn de partículas
        const spawnRate = data.isHovered ? 0.55 : 0.28
        if (Math.random() < spawnRate) {
            this._spawnParticle(particles, W, H, baseColor, accentColor, data.isHovered)
        }

        // Destellos ocasionales (independientes de las brasas)
        if (Math.random() < (data.isHovered ? 0.08 : 0.025)) {
            this._spawnFlash(particles, W, H, baseColor)
        }

        // Actualizar y dibujar partículas
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]
            this._updateParticle(p, W)

            if (p.alpha <= 0 || p.y < -10) {
                particles.splice(i, 1)
                continue
            }

            this._drawParticle(ctx, p)
        }

        // Efecto de borde luminoso pulsante (solo en hover)
        if (data.isHovered) {
            this._drawBorderGlow(ctx, W, H, baseColor, data)
        }

        data.animId = requestAnimationFrame(() => {
            if (!document.body.contains(cardEl)) {
                this._active.delete(cardEl)
                return
            }
            this._loop(cardEl, data)
        })
    },

    // ── Crear partícula tipo brasa/ember ─────────────────────────────────────
    _spawnParticle(particles, W, H, base, accent, isHovered) {
        const useAccent = Math.random() < 0.3
        const col = useAccent ? accent : base
        const size = 1.2 + Math.random() * (isHovered ? 3.5 : 2.2)

        particles.push({
            type:  "ember",
            x:     W * 0.1 + Math.random() * W * 0.8,
            y:     H * 0.75 + Math.random() * H * 0.25,   // nacen en la parte baja
            vx:    (Math.random() - 0.5) * 0.8,
            vy:    -(0.6 + Math.random() * (isHovered ? 2.2 : 1.4)),
            size,
            alpha: 0.7 + Math.random() * 0.3,
            decay: 0.008 + Math.random() * 0.012,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.04 + Math.random() * 0.06,
            r: col.r, g: col.g, b: col.b,
        })
    },

    // ── Crear destello (flash puntual) ───────────────────────────────────────
    _spawnFlash(particles, W, H, base) {
        particles.push({
            type:  "flash",
            x:     W * 0.05 + Math.random() * W * 0.9,
            y:     Math.random() * H,
            size:  2 + Math.random() * 4,
            alpha: 0.9,
            decay: 0.07 + Math.random() * 0.06,
            vx: 0, vy: 0,
            wobble: 0, wobbleSpeed: 0,
            r: base.r, g: base.g, b: base.b,
        })
    },

    // ── Actualizar posición/estado de una partícula ──────────────────────────
    _updateParticle(p, W) {
        if (p.type === "ember") {
            p.wobble += p.wobbleSpeed
            p.x  += p.vx + Math.sin(p.wobble) * 0.4
            p.y  += p.vy
            p.vy *= 0.995           // fricción muy leve
            p.size *= 0.992
        }
        p.alpha -= p.decay
    },

    // ── Dibujar una partícula ────────────────────────────────────────────────
    _drawParticle(ctx, p) {
        if (p.type === "flash") {
            // Destello: estrella de 4 puntas
            ctx.save()
            ctx.globalAlpha = Math.max(0, p.alpha)
            ctx.translate(p.x, p.y)
            ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`
            ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},0.9)`
            ctx.shadowBlur = 8

            ctx.beginPath()
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2
                const outer = p.size * p.alpha
                const inner = outer * 0.3
                ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
                ctx.lineTo(Math.cos(angle + Math.PI / 4) * inner, Math.sin(angle + Math.PI / 4) * inner)
            }
            ctx.closePath()
            ctx.fill()
            ctx.restore()
            return
        }

        // Ember: círculo con glow
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)

        // Glow exterior
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5)
        glow.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${p.alpha * 0.6})`)
        glow.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // Núcleo brillante
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0.3, p.size), 0, Math.PI * 2)
        ctx.fillStyle = `rgb(${Math.min(255, p.r + 60)},${Math.min(255, p.g + 60)},${Math.min(255, p.b + 60)})`
        ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},1)`
        ctx.shadowBlur  = 6
        ctx.fill()

        ctx.restore()
    },

    // ── Borde luminoso pulsante en hover ─────────────────────────────────────
    _drawBorderGlow(ctx, W, H, base, data) {
        if (!data._glowT) data._glowT = 0
        data._glowT += 0.06

        const pulse = 0.4 + 0.3 * Math.sin(data._glowT)

        ctx.save()
        ctx.globalAlpha = pulse
        ctx.strokeStyle = `rgba(${base.r},${base.g},${base.b},0.9)`
        ctx.lineWidth   = 1.5
        ctx.shadowColor = `rgba(${base.r},${base.g},${base.b},1)`
        ctx.shadowBlur  = 14
        ctx.strokeRect(1, 1, W - 2, H - 2)
        ctx.restore()
    },
}