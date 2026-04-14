// ─────────────────────────────────────────────────────────────────────────────
// worldmap-renderer.js — Renderizador del mapa del mundo
// ─────────────────────────────────────────────────────────────────────────────

import { WORLD_DATA, NODE_CONNECTIONS, NODE_TYPE_CONFIG } from "./worldmap.js"

export class WorldMapRenderer {

    constructor(containerId, game) {
        this.containerId  = containerId
        this.game         = game
        this.selectedZone = "zone1"
        this.onNodeClick  = null   // callback: (nodeId, zoneId) => {}
        this.visible      = false
        this._bgAnimId    = null
        this._bgT         = 0

        this.progress = {
            completedNodes: new Set(),
            availableNodes: new Set(["z1n1"]),
            unlockedZones:  new Set(["zone1"])
        }
    }

    // ── Punto de entrada ──────────────────────────────────────────────────────
    mount() {
        const container = document.getElementById(this.containerId)
        if (!container) return

        container.innerHTML = `
        <div class="wm-wrap" id="wm-wrap">
            <canvas class="wm-bg" id="wm-bg"></canvas>

            <div class="wm-top">
                <div class="wm-logo">
                    <span class="wm-logo-icon">🗺️</span>
                    <div>
                        <div class="wm-logo-title">CRÓNICAS DEL ABISMO</div>
                        <div class="wm-logo-sub">Seleccioná una zona para explorar</div>
                    </div>
                </div>
            </div>

            <div class="wm-tabs" id="wm-tabs"></div>

            <div class="wm-content" id="wm-content">
                <div class="wm-map-area" id="wm-map-area"></div>
            </div>

            <div class="wm-info-panel" id="wm-info-panel"></div>
        </div>`

        this._injectCSS()
        this._initBg()
        this._renderTabs()
        this._renderZone("zone1")

        window._wmTab    = (z)  => this._selectZone(z)
        window._wmEnter  = (id) => this._enterNode(id)
    }

    // ── CSS ───────────────────────────────────────────────────────────────────
    _injectCSS() {
        if (document.getElementById("wm-css")) return
        const el = document.createElement("style")
        el.id = "wm-css"
        el.textContent = `
        .wm-wrap {
            position: relative; width: 100%; height: 100%;
            display: flex; flex-direction: column;
            background: #04060e; overflow: hidden;
            font-family: 'Cinzel', serif;
        }
        .wm-bg {
            position: absolute; inset: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 0;
        }
        /* ── Top bar ── */
        .wm-top {
            position: relative; z-index: 2; flex-shrink: 0;
            padding: 14px 20px 8px;
            border-bottom: 1px solid rgba(240,200,74,0.12);
            background: linear-gradient(to bottom, rgba(4,6,14,0.98), transparent);
        }
        .wm-logo { display: flex; align-items: center; gap: 12px; }
        .wm-logo-icon { font-size: 1.6rem; }
        .wm-logo-title {
            font-size: clamp(0.9rem,2vw,1.4rem); font-weight: 900;
            letter-spacing: 0.2em; color: #f0c84a;
            text-shadow: 0 0 24px rgba(240,200,74,0.5);
        }
        .wm-logo-sub {
            font-size: 0.55rem; color: rgba(180,160,220,0.6);
            letter-spacing: 0.16em; margin-top: 2px;
        }
        /* ── Tabs ── */
        .wm-tabs {
            position: relative; z-index: 2; flex-shrink: 0;
            display: flex; gap: 3px; padding: 10px 20px 0;
        }
        .wm-tab {
            flex: 1; padding: 7px 8px;
            border: 1px solid rgba(255,255,255,0.07); border-bottom: none;
            background: rgba(8,11,20,0.85);
            color: rgba(255,255,255,0.25);
            font-family: 'Cinzel', serif; font-size: 0.52rem;
            letter-spacing: 0.08em; cursor: pointer;
            transition: all 0.18s; display: flex; flex-direction: column;
            align-items: center; gap: 2px;
        }
        .wm-tab.wm-tab-locked { cursor: not-allowed; opacity: 0.35; filter: grayscale(1); }
        .wm-tab.wm-tab-active { background: rgba(15,12,35,0.98); color: #f0c84a; }
        .wm-tab:not(.wm-tab-locked):not(.wm-tab-active):hover {
            background: rgba(12,10,28,0.9); color: rgba(255,255,255,0.6);
        }
        .wm-tab-name  { font-weight: 700; font-size: 0.6rem; }
        .wm-tab-sub   { font-size: 0.44rem; opacity: 0.55; }
        .wm-tab-prog  { font-size: 0.44rem; color: rgba(240,200,74,0.7); }
        /* ── Contenido ── */
        .wm-content {
            position: relative; z-index: 2; flex: 1; overflow: hidden;
            padding: 0 20px;
            min-height: 0;
        }
        .wm-map-area { position: relative; width: 100%; height: 100%; }
        /* SVG de conexiones */
        .wm-svg {
            position: absolute; inset: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 1; overflow: visible;
        }
        /* ── Nodos ── */
        .wm-node {
            position: absolute; transform: translate(-50%,-50%);
            display: flex; flex-direction: column; align-items: center;
            cursor: pointer; z-index: 3; user-select: none;
        }
        .wm-node.wm-locked { cursor: not-allowed; opacity: 0.3; filter: grayscale(0.9); }
        .wm-node.wm-locked .wm-nc { transform: none !important; }
        .wm-nc {
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%; border: 2px solid; position: relative;
            transition: transform 0.2s cubic-bezier(0.2,0.8,0.3,1), box-shadow 0.2s;
        }
        .wm-node:not(.wm-locked):hover .wm-nc { transform: scale(1.14); }
        /* Tipos */
        .wm-t-combat  .wm-nc { width:44px;height:44px; border-color:#e74c3c; background:rgba(231,76,60,0.1); }
        .wm-t-elite   .wm-nc { width:52px;height:52px; border-color:#9b59b6; background:rgba(155,89,182,0.12); border-width:2px; }
        .wm-t-boss    .wm-nc { width:64px;height:64px; border-color:#c0392b; background:rgba(192,57,43,0.15); border-width:3px; }
        .wm-t-event   .wm-nc { width:40px;height:40px; border-color:#3498db; background:rgba(52,152,219,0.1); border-style:dashed; }
        .wm-t-shop    .wm-nc { width:40px;height:40px; border-color:#f39c12; background:rgba(243,156,18,0.1); }
        /* Estado completado */
        .wm-done .wm-nc {
            border-color: rgba(46,204,113,0.85) !important;
            background:   rgba(46,204,113,0.1)  !important;
            box-shadow:   0 0 14px rgba(46,204,113,0.35) !important;
        }
        /* Estado disponible */
        .wm-avail.wm-t-combat .wm-nc  { animation: wm-pulse-c 1.8s ease-in-out infinite alternate; }
        .wm-avail.wm-t-elite  .wm-nc  { animation: wm-pulse-e 1.8s ease-in-out infinite alternate; }
        .wm-avail.wm-t-boss   .wm-nc  { animation: wm-pulse-b 1.8s ease-in-out infinite alternate; }
        .wm-avail.wm-t-event  .wm-nc  { animation: wm-pulse-v 1.8s ease-in-out infinite alternate; }
        @keyframes wm-pulse-c { from{box-shadow:0 0 8px rgba(231,76,60,0.3)}  to{box-shadow:0 0 22px rgba(231,76,60,0.75)} }
        @keyframes wm-pulse-e { from{box-shadow:0 0 8px rgba(155,89,182,0.3)} to{box-shadow:0 0 22px rgba(155,89,182,0.8)} }
        @keyframes wm-pulse-b { from{box-shadow:0 0 12px rgba(192,57,43,0.4)} to{box-shadow:0 0 32px rgba(192,57,43,0.9)} }
        @keyframes wm-pulse-v { from{box-shadow:0 0 8px rgba(52,152,219,0.3)} to{box-shadow:0 0 22px rgba(52,152,219,0.7)} }
        /* Ícono */
        .wm-icon { font-size: 1.2rem; line-height: 1; }
        .wm-t-boss   .wm-icon { font-size: 1.6rem; }
        .wm-t-elite  .wm-icon { font-size: 1.3rem; }
        /* Check de completado */
        .wm-check {
            position:absolute; top:-5px; right:-5px;
            width:16px; height:16px; border-radius:50%;
            background:#2ecc71; border:1px solid rgba(0,0,0,0.5);
            display:flex; align-items:center; justify-content:center;
            font-size:0.5rem; color:#fff; font-weight:700;
            box-shadow:0 0 8px rgba(46,204,113,0.6);
        }
        /* Flecha indicadora */
        .wm-arrow {
            position:absolute; top:-18px; left:50%;
            transform:translateX(-50%);
            color:#f0c84a; font-size:0.85rem;
            animation: wm-arr 0.8s ease-in-out infinite alternate;
        }
        @keyframes wm-arr {
            from{transform:translateX(-50%) translateY(0)}
            to  {transform:translateX(-50%) translateY(-5px)}
        }
        /* Label y HP */
        .wm-label {
            margin-top: 5px; font-size: 0.48rem; letter-spacing: 0.05em;
            color:rgba(255,255,255,0.5); text-align:center;
            max-width:80px; white-space:nowrap;
            overflow:hidden; text-overflow:ellipsis;
            text-shadow:0 1px 4px rgba(0,0,0,1);
        }
        .wm-avail .wm-label  { color:rgba(255,255,255,0.85); }
        .wm-done  .wm-label  { color:rgba(46,204,113,0.7); }
        .wm-t-boss .wm-label { color:#e74c3c; font-weight:700; font-size:0.5rem; }
        .wm-hp {
            font-size: 0.42rem; color:rgba(255,100,100,0.7); margin-top: 1px;
        }
        /* Decorador de zona */
        .wm-zone-bg-text {
            position:absolute; top:8px; left:0; right:0;
            text-align:center; pointer-events:none; z-index:0;
        }
        .wm-zone-bg-name {
            font-size:clamp(0.8rem,2vw,1.2rem); font-weight:900;
            letter-spacing:0.25em; opacity:0.07; text-transform:uppercase;
        }
        .wm-zone-bg-sub {
            font-family:'Crimson Text',Georgia,serif; font-style:italic;
            font-size:0.72rem; opacity:0.12; margin-top:2px;
        }
        /* Leyenda */
        .wm-legend {
            position:absolute; bottom:8px; left:4px;
            display:flex; flex-wrap:wrap; gap:10px; z-index:4;
        }
        .wm-leg-item {
            display:flex; align-items:center; gap:4px;
            font-size: 0.48rem; color:rgba(255,255,255,0.45);
            letter-spacing:0.06em;
        }
        .wm-leg-dot {
            width:9px; height:9px; border-radius:50%; border:1px solid; flex-shrink:0;
        }

        /* ═══════════════════════════════════════════
           PANEL DE INFO — versión grande y legible
        ═══════════════════════════════════════════ */
        .wm-info-panel {
            position: relative; z-index: 2; flex-shrink: 0;
            margin: 0 20px 14px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(6,8,20,0.98);
            padding: 18px 22px;
            display: none;
            align-items: center;
            gap: 20px;
            animation: wm-slide-up 0.22s ease;
            box-shadow: 0 -4px 30px rgba(0,0,0,0.6);
            min-height: 110px;
        }
        @keyframes wm-slide-up {
            from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none}
        }

        .wm-inf-portrait {
            font-size: 2.8rem;
            width: 72px; height: 72px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.04);
            border-radius: 4px;
        }

        .wm-inf-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }

        .wm-inf-name {
            font-size: 1.05rem; font-weight: 700; color: #f0c84a;
            letter-spacing: 0.06em;
            text-shadow: 0 0 16px rgba(240,200,74,0.4);
        }

        .wm-inf-lore {
            font-family: 'Crimson Text', Georgia, serif; font-style: italic;
            font-size: 1rem; color: rgba(200,180,240,0.75);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .wm-inf-tags {
            display: flex; gap: 10px; margin-top: 2px; flex-wrap: wrap;
        }

        .wm-inf-tag {
            font-size: 0.58rem; letter-spacing: 0.06em; border: 1px solid;
            padding: 3px 10px; border-radius: 3px;
            font-family: 'Cinzel', serif;
        }

        .wm-inf-ability {
            margin-top: 4px; font-size: 0.72rem;
            color: rgba(255,200,100,0.8); font-style: italic;
            font-family: 'Crimson Text', Georgia, serif;
            border-left: 2px solid rgba(255,180,60,0.4);
            padding-left: 8px;
        }

        .wm-inf-actions {
            display: flex; flex-direction: column; gap: 8px;
            flex-shrink: 0; min-width: 140px; align-items: stretch;
        }

        .wm-btn-enter {
            font-family: 'Cinzel', serif; font-size: 0.78rem; letter-spacing: 0.12em;
            background: linear-gradient(135deg, rgba(60,20,90,0.95), rgba(30,10,50,0.95));
            color: #f0c84a; border: 1px solid rgba(240,200,74,0.5);
            padding: 10px 20px; cursor: pointer; transition: all 0.18s; white-space: nowrap;
            text-align: center;
        }
        .wm-btn-enter:hover {
            border-color: #f0c84a; box-shadow: 0 0 22px rgba(240,200,74,0.35);
            background: linear-gradient(135deg, rgba(80,30,120,0.95), rgba(50,15,80,0.95));
        }

        .wm-btn-repeat {
            font-family: 'Cinzel', serif; font-size: 0.58rem; letter-spacing: 0.06em;
            background: transparent; color: rgba(255,255,255,0.4);
            border: 1px solid rgba(255,255,255,0.14);
            padding: 6px 14px; cursor: pointer; transition: all 0.18s;
            white-space: nowrap; text-align: center;
        }
        .wm-btn-repeat:hover { border-color: rgba(255,255,255,0.45); color: rgba(255,255,255,0.7); }

        .wm-locked-msg {
            font-size: 0.62rem; color: rgba(255,255,255,0.3);
            font-family: 'Cinzel', serif; letter-spacing: 0.08em;
            text-align: center; padding: 8px 0;
        }
        `
        document.head.appendChild(el)
    }

    // ── Canvas de fondo ───────────────────────────────────────────────────────
    _initBg() {
        const canvas = document.getElementById("wm-bg")
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        const stars = Array.from({length:220}, () => ({
            x: Math.random(), y: Math.random(),
            r: Math.random()*1.3+0.2, a: Math.random()*0.5+0.1,
            s: Math.random()*0.008+0.003, o: Math.random()*Math.PI*2
        }))
        const loop = () => {
            this._bgT += 0.01
            const W = canvas.width  = canvas.offsetWidth  || 800
            const H = canvas.height = canvas.offsetHeight || 600
            ctx.clearRect(0,0,W,H)
            const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.7)
            bg.addColorStop(0,"#0d0818"); bg.addColorStop(1,"#04060e")
            ctx.fillStyle = bg; ctx.fillRect(0,0,W,H)
            stars.forEach(s => {
                const tw = 0.4+0.6*(0.5+0.5*Math.sin(this._bgT*s.s+s.o))
                ctx.beginPath(); ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2)
                ctx.fillStyle = `rgba(200,180,255,${s.a*tw})`; ctx.fill()
            })
            this._bgAnimId = requestAnimationFrame(loop)
        }
        loop()
    }

    // ── Tabs ──────────────────────────────────────────────────────────────────
    _renderTabs() {
        const el = document.getElementById("wm-tabs")
        if (!el) return
        el.innerHTML = Object.values(WORLD_DATA).map(z => {
            const unlocked = this.progress.unlockedZones.has(z.id)
            const prog     = this._zoneProgress(z.id)
            const active   = this.selectedZone === z.id
            return `
            <div class="wm-tab ${!unlocked?'wm-tab-locked':''} ${active?'wm-tab-active':''}"
                 style="${active?`border-color:${z.color}33`:''}"
                 onclick="${unlocked?`window._wmTab('${z.id}')`:''}"
                 title="${z.name}">
                ${!unlocked?'🔒 ':''}
                <span class="wm-tab-name">${z.name.split(' ').pop()}</span>
                <span class="wm-tab-sub">${z.name}</span>
                ${unlocked?`<span class="wm-tab-prog">${prog.done}/${prog.total}</span>`:''}
            </div>`
        }).join("")
    }

    // ── Zona ─────────────────────────────────────────────────────────────────
    _selectZone(zoneId) {
        this.selectedZone = zoneId
        this._renderTabs()
        this._renderZone(zoneId)
    }

    _renderZone(zoneId) {
        const zone  = WORLD_DATA[zoneId]
        const area  = document.getElementById("wm-map-area")
        const panel = document.getElementById("wm-info-panel")
        if (!area || !zone) return
        panel.style.display = "none"
        area.innerHTML = ""

        // Texto decorativo de fondo
        const bgText = document.createElement("div")
        bgText.className = "wm-zone-bg-text"
        bgText.innerHTML = `
            <div class="wm-zone-bg-name" style="color:${zone.color}">${zone.name}</div>
            <div class="wm-zone-bg-sub">${zone.subtitle}</div>`
        area.appendChild(bgText)

        // SVG para conexiones
        const svg = document.createElementNS("http://www.w3.org/2000/svg","svg")
        svg.setAttribute("class","wm-svg")
        svg.id = "wm-svg"
        area.appendChild(svg)

        // Nodos
        zone.nodes.forEach(node => {
            area.appendChild(this._makeNode(node, zone))
        })

        // Leyenda
        const leg = document.createElement("div")
        leg.className = "wm-legend"
        leg.innerHTML = [
            {c:"rgba(231,76,60,0.2)",b:"#e74c3c",t:"Combate"},
            {c:"rgba(155,89,182,0.2)",b:"#9b59b6",t:"Élite"},
            {c:"rgba(192,57,43,0.2)",b:"#c0392b",t:"Jefe"},
            {c:"rgba(52,152,219,0.2)",b:"#3498db",t:"Evento"},
            {c:"rgba(46,204,113,0.2)",b:"#2ecc71",t:"Completado"},
        ].map(l=>`
            <div class="wm-leg-item">
                <div class="wm-leg-dot" style="background:${l.c};border-color:${l.b}"></div>
                ${l.t}
            </div>`).join("")
        area.appendChild(leg)

        // Dibujar conexiones en el siguiente frame (cuando los nodos estén en el DOM)
        requestAnimationFrame(() => this._drawLines(zoneId, svg, zone, area))
    }

    // ── Crear nodo HTML ───────────────────────────────────────────────────────
    _makeNode(node, zone) {
        const done  = this.progress.completedNodes.has(node.id)
        const avail = this.progress.availableNodes.has(node.id)
        const lock  = !done && !avail
        const typeC = NODE_TYPE_CONFIG[node.type] || NODE_TYPE_CONFIG.combat

        const wrap = document.createElement("div")
        wrap.id        = `wm-nd-${node.id}`
        wrap.className = [
            "wm-node",
            `wm-t-${node.type}`,
            done  ? "wm-done"   : "",
            avail ? "wm-avail"  : "",
            lock  ? "wm-locked" : ""
        ].join(" ").trim()
        wrap.style.left = `${node.position.x}%`
        wrap.style.top  = `${node.position.y}%`

        const icon = done ? "✓" : typeC.icon
        const hp   = node.enemy?.health ?? ""

        wrap.innerHTML = `
            ${avail && !done ? '<div class="wm-arrow">▼</div>' : ''}
            <div class="wm-nc">
                <span class="wm-icon">${icon}</span>
                ${done ? '<div class="wm-check">✓</div>' : ''}
            </div>
            <div class="wm-label">${node.name}</div>
            ${!done && hp ? `<div class="wm-hp">❤ ${hp}</div>` : ''}
        `

        if (!lock) {
            wrap.onclick = () => this._showInfo(node, zone, done, avail)
        }
        return wrap
    }

    // ── Panel de info ─────────────────────────────────────────────────────────
    _showInfo(node, zone, done, avail) {
        const panel = document.getElementById("wm-info-panel")
        if (!panel) return
        const typeC    = NODE_TYPE_CONFIG[node.type] || NODE_TYPE_CONFIG.combat
        const portrait = node.enemy?.portrait ?? typeC.icon
        const hp       = node.enemy?.health ?? "?"
        const gold     = node.rewards?.gold ?? 0
        const repGold  = node.repeatRewards?.gold ?? 0

        panel.style.display = "flex"
        panel.innerHTML = `
            <div class="wm-inf-portrait">${portrait}</div>
            <div class="wm-inf-body">
                <div class="wm-inf-name">${node.name}</div>
                <div class="wm-inf-lore">"${node.lore}"</div>
                <div class="wm-inf-tags">
                    ${node.enemy ? `<span class="wm-inf-tag" style="color:#e74c3c;border-color:rgba(231,76,60,0.4)">❤ ${hp} HP</span>` : ''}
                    <span class="wm-inf-tag" style="color:#f0c84a;border-color:rgba(240,200,74,0.4)">🪙 ${done ? repGold : gold} oro</span>
                    <span class="wm-inf-tag" style="color:#9b59b6;border-color:rgba(155,89,182,0.4)">${typeC.label}</span>
                    ${done ? '<span class="wm-inf-tag" style="color:#2ecc71;border-color:rgba(46,204,113,0.4)">✓ Completado</span>' : ''}
                    ${node.rewards?.chestType ? `<span class="wm-inf-tag" style="color:#f39c12;border-color:rgba(243,156,18,0.4)">📦 Cofre</span>` : ''}
                </div>
                ${node.enemy?.specialAbility ? `<div class="wm-inf-ability">⚡ ${node.enemy.specialAbility}</div>` : ''}
            </div>
            <div class="wm-inf-actions">
                ${avail && !done ? `<button class="wm-btn-enter" onclick="window._wmEnter('${node.id}')">⚔ ENTRAR</button>` : ''}
                ${done ? `
                    <button class="wm-btn-enter" onclick="window._wmEnter('${node.id}')">⚔ REPETIR</button>
                    <button class="wm-btn-repeat">🪙 ${repGold} oro (rep.)</button>
                ` : ''}
                ${!avail && !done ? `<div class="wm-locked-msg">🔒 Completá el nodo anterior</div>` : ''}
            </div>`
    }

    // ── Dibujar líneas SVG ────────────────────────────────────────────────────
    _drawLines(zoneId, svg, zone, area) {
        if (!area) return
        const areaRect = area.getBoundingClientRect()

        zone.nodes.forEach(node => {
            const targets = NODE_CONNECTIONS[node.id] || []
            targets.forEach(tid => {
                const fromEl = document.getElementById(`wm-nd-${node.id}`)
                const toEl   = document.getElementById(`wm-nd-${tid}`)
                if (!fromEl || !toEl) return

                const fr = fromEl.getBoundingClientRect()
                const tr = toEl.getBoundingClientRect()

                const x1 = fr.left + fr.width/2  - areaRect.left
                const y1 = fr.top  + fr.height/2 - areaRect.top
                const x2 = tr.left + tr.width/2  - areaRect.left
                const y2 = tr.top  + tr.height/2 - areaRect.top

                const fromDone = this.progress.completedNodes.has(node.id)
                const toDone   = this.progress.completedNodes.has(tid)
                const isActive = fromDone && !toDone

                const line = document.createElementNS("http://www.w3.org/2000/svg","line")
                line.setAttribute("x1",x1); line.setAttribute("y1",y1)
                line.setAttribute("x2",x2); line.setAttribute("y2",y2)

                if (fromDone && toDone) {
                    line.setAttribute("stroke","rgba(46,204,113,0.55)")
                    line.setAttribute("stroke-width","2")
                } else if (isActive) {
                    line.setAttribute("stroke", zone.color)
                    line.setAttribute("stroke-width","1.5")
                    line.setAttribute("stroke-dasharray","6 4")
                    line.setAttribute("stroke-opacity","0.65")
                } else {
                    line.setAttribute("stroke","rgba(80,60,120,0.25)")
                    line.setAttribute("stroke-width","1")
                    line.setAttribute("stroke-dasharray","3 6")
                }
                svg.appendChild(line)
            })
        })
    }

    // ── Entrar a nodo ─────────────────────────────────────────────────────────
    _enterNode(nodeId) {
        if (this.onNodeClick) {
            const node = this.getNode(nodeId)
            this.onNodeClick(nodeId, this.selectedZone, node)
        }
    }

    // ── Completar nodo y desbloquear siguientes ───────────────────────────────
    completeNode(nodeId) {
        this.progress.completedNodes.add(nodeId)
        this.progress.availableNodes.delete(nodeId)

        const next = NODE_CONNECTIONS[nodeId] || []
        next.forEach(id => {
            if (!this.progress.completedNodes.has(id)) {
                this.progress.availableNodes.add(id)
            }
        })

        // Desbloquear nueva zona si corresponde
        Object.values(WORLD_DATA).forEach(zone => {
            zone.nodes.forEach(n => {
                if (n.id === nodeId && n.rewards?.unlocksZone) {
                    const newZoneId = n.rewards.unlocksZone
                    this.progress.unlockedZones.add(newZoneId)
                    const newZone = WORLD_DATA[newZoneId]
                    if (newZone?.nodes[0]) {
                        this.progress.availableNodes.add(newZone.nodes[0].id)
                    }
                }
            })
        })

        this._renderTabs()
        this._renderZone(this.selectedZone)
    }

    // ── Cargar progreso desde save ────────────────────────────────────────────
    loadProgress(saved) {
        if (!saved) return
        this.progress.completedNodes = new Set(saved.completedNodes || [])
        this.progress.availableNodes = new Set(saved.availableNodes || ["z1n1"])
        this.progress.unlockedZones  = new Set(saved.unlockedZones  || ["zone1"])
        this._renderTabs()
        this._renderZone(this.selectedZone)
    }

    // Serializar para guardar
    serializeProgress() {
        return {
            completedNodes: [...this.progress.completedNodes],
            availableNodes: [...this.progress.availableNodes],
            unlockedZones:  [...this.progress.unlockedZones]
        }
    }

    getNode(nodeId) {
        for (const zone of Object.values(WORLD_DATA)) {
            const n = zone.nodes.find(n => n.id === nodeId)
            if (n) return n
        }
        return null
    }

    _zoneProgress(zoneId) {
        const zone = WORLD_DATA[zoneId]
        if (!zone) return { done:0, total:0 }
        return {
            total: zone.nodes.length,
            done:  zone.nodes.filter(n => this.progress.completedNodes.has(n.id)).length
        }
    }

    show() { this.visible = true  }
    hide() { this.visible = false }

    destroy() {
        if (this._bgAnimId) cancelAnimationFrame(this._bgAnimId)
    }
}